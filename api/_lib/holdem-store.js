// HOLD'EM — THE DEALER's database half (HE2). The ops arrive on POST /api/report { holdem: <op>, room, … } (STILL 8 FUNCTIONS —
// report.js is the room-match function: it already reads rooms/{CODE} + credits matches through stats.js#applyMatch, which the dealer
// reuses for the match's end with no host relay). docs/holdem.md "THE DEALER".
//
//   start      { room, mode: 'tournament'|'cash', speed? }   the HOST only — seats = the room's players (≤ 8, not kicked)
//   act        { room, hand, seq, action, amount? }           fold · check · call · bet / raise (TO amount) · allin — your own seat only
//   pre        { room, hand, pre: 'checkfold'|'check'|'callany'|null } your queued pre-action (kept on the server — fires while your phone sleeps)
//   show       { room, hand }                                 the optional SHOW after everyone folded to you
//   poke       { room }                                       whatever the server's clock says is DUE (cheap when nothing is: 5 small reads in parallel, no write)
//   rebuy · back · leave · sit  { room }                      CASH: rebuy at zero · back from AWAY / SAT OUT · leave · a late joiner sits down
//   endSession { room }                                       the HOST only, CASH: closes now, or when the running hand ends
//
//   hrec/{CODE}                { j: the record (JSON), seq, due, id, ended, at }   SERVER ONLY (the rules' default deny) — the deck, every card
//   rooms/{CODE}/holdem        { seq, at, m/… t/… s/… p/… e/… }                    THE LEAN WIRE (js/games/holdem/wire.js — HE3): the public view
//                                                                                  as small parts; any signed-in reader; written by the server only
//   hole/{CODE}/{uid}          { h: hand, c?: [2 cards], pre? }                    that uid only (+ never a kicked one); server-written
// Every op = ONE transaction on hrec/{CODE} (held in the SDK's cache for the call — DFIX3's trick: the first attempt sees the real
// record), then ONE multi-path update: only the public parts that changed + the seats' private nodes that changed + the room's
// meta/activeAt (HE3 — a 2 h DEEP match is never closed by the 1 h idle rule). A publish that lands out of order (two calls racing)
// leaves the published `seq` behind the record's — the next call (any op, a poke included) sees it and writes the whole view (THE HEAL).
import { randomInt } from 'node:crypto';
import { ApiError } from './http.js';
import { ref, val, emulated, adminPids } from './fb.js';
import { GAMES } from '../../js/config.js';
import { take } from './limit.js';
import { noTiming } from './timing.js';
import { pidOf } from './profiles.js';
import { DealerError, newRecord, applyOp, advance, dueOf, publicOf, holeOf, seatUids, resultRows, abandoned, cleanAt, counts } from './holdem-dealer.js';
import { toWire, wireDiff, nestWire, wireBytes } from '../../js/games/holdem/wire.js';

export const OPS = ['start', 'act', 'pre', 'show', 'poke', 'rebuy', 'back', 'leave', 'sit', 'endSession'];

/** THE CALL BUDGET (per uid): a fast 8-player table's host pokes + acts ≈ 25 calls a minute — 900 / 10 min leaves room; a flood → 429. */
export const CALLS = { max: 900, windowMs: 10 * 60_000 };

// THE SERVER's RANDOMNESS: Node's crypto (no secret, no env var). The emulator-only test hooks below swap in a seeded rng + a clock —
// never honoured outside the emulators (FIREBASE_DATABASE_EMULATOR_HOST), so production stays crypto + Date.now().
const cryptoRng = () => randomInt(0, 2 ** 47) / 2 ** 47;
let testRng = null, testClock = null;
export function setTestRng(fn) { testRng = emulated() ? fn : null; }
export function setTestClock(fn) { testClock = emulated() ? fn : null; }
const rngNow = () => (emulated() && testRng) || cryptoRng;
export const clockNow = () => (emulated() && testClock ? testClock() : Date.now());

/**
 * HE8 — THE OWNER'S LIVE TEST: may this host START a match? While HOLD'EM's GAMES row is `playable: false` only a room HOSTED BY THE OWNER
 * may (the host's uid → their profile id → ADMIN_PIDS — the same owner test as the radio's roles, api/_lib/radio.js#roleOf; never a client
 * flag). `playable: true` opens it to every host. On the LOCAL EMULATORS (the E2E + the passes' play-tests on `&preview=1`) the table stays
 * open, unless the test switch `testHoldemGate` is set — then the live rule runs (the owner = ADMIN_PIDS or `testAdmins/{pid}`, as roleOf).
 */
export async function startOpen(uid) {
  const row = GAMES.find(g => g.id === 'holdem');
  if (row && row.playable) return true;
  const pid = await pidOf(uid);
  if (pid && adminPids().includes(pid)) return true;
  if (!emulated()) return false;
  if (pid && (await val(`testAdmins/${pid}`))) return true;
  return !(await val('testHoldemGate'));
}

// THE CALL BUDGET off the hot path (daily.js's DFIX3 pattern): a per-instance window decides at once; the shared rl/hd_{uid} count is
// written behind it — HE10 (A20): in batches (the first call of a window, then every BUDGET_EVERY calls, the batch's size at once — never a
// transaction on every call), and its refusal lifts the local count so a flood across warm instances still stops
export const BUDGET_EVERY = 20;
const BUDGET = new Map();
function budget(uid, now) {
  const key = String(uid).replace(/[.#$[\]/]/g, '_');
  let b = BUDGET.get(key);
  if (!b || now - b.t >= CALLS.windowMs || now < b.t) {
    b = { n: 0, t: now, owe: 0 };
    BUDGET.set(key, b);
    if (BUDGET.size > 4000) for (const k of [...BUDGET.keys()].slice(0, 1000)) BUDGET.delete(k);
  }
  if (b.n >= CALLS.max) return false;
  b.n++; b.owe++;
  if (b.n === 1 || b.owe >= BUDGET_EVERY) {
    const by = b.owe;
    b.owe = 0;
    take(`hd_${key}`, CALLS.max, CALLS.windowMs, now, by).then(ok => { if (!ok) b.n = Math.max(b.n, CALLS.max); }).catch(() => {});
  }
  return true;
}
export const forgetHoldemBudgets = () => BUDGET.clear();

const ROOM = /^[A-Z]{4}$/;
const MATCH_ID = /^[a-z0-9]{3,16}$/;
/** HE3 — start's `at` (the console's walk inside): the first deal waits for it, at most this far ahead. */
export const START_AHEAD_MS = 10_000;
/** HE3 — the room's meta/activeAt, stamped with a dealer write at most once a minute (the idle close waits an hour). */
export const ACTIVE_EVERY_MS = 60_000;
/** TESTS ONLY (the emulator suite prints it): the bytes of each publish — { kinds: the new events' types, diff, full }. */
export const wireStats = [];
const asApi = e => new ApiError(e.status, e.code, e.message, e.extra);

/** HE10 (A15): the seated players no longer in the room (their players/{uid} is gone) — or kicked → { uid: true } | null */
function goneOf(rec, players, kicked) {
  const out = {};
  for (const x of rec.m.table.seats) if (!players[x.id] || kicked[x.id]) out[x.id] = true;
  return Object.keys(out).length ? out : null;
}

/** Hold a node in the SDK's cache for the call (a transaction's first attempt then runs on the real value — one round trip). */
function holdRef(r) {
  const hold = () => {};
  r.on('value', hold);
  return { loaded: new Promise((res, rej) => r.once('value', s => res(s.val()), rej)), off: () => r.off('value', hold) };
}

/**
 * ONE HOLD'EM CALL. uid = the verified caller (requireUser). → { ok, seq, hand, due, now, changed } — or an ApiError:
 * 400 bad_* · 403 not_in_room / kicked / not_host / not_open (HE8 — a non-owner host while HOLD'EM isn't playable) / not_seated · 404 no_match · 409 stale (+ seq, hand) / illegal / running · 429 slow_down.
 */
export async function holdemAction(uid, body, now = clockNow(), T = noTiming) {
  body = body && typeof body === 'object' ? body : {};
  const op = String(body.holdem || ''), code = String(body.room || '');
  if (!OPS.includes(op)) throw new ApiError(400, 'bad_action', 'No such move.');
  if (!ROOM.test(code)) throw new ApiError(400, 'bad_room');
  if (!budget(uid, now)) throw new ApiError(429, 'slow_down', 'Too many moves — wait a moment.');
  T.mark('pre');
  const recPath = `hrec/${code}`, rp = `rooms/${code}`;
  const member = async () => (await ref(`${rp}/players/${uid}`).once('value')).exists();

  // THE POKE's cheap path: nothing due by the server's clock → 5 small reads in parallel, no write
  if (op === 'poke') {
    const [due, inRoom, kickedMe, recSeq, pubSeq] = await Promise.all([val(`${recPath}/due`), member(), val(`${rp}/kicked/${uid}`), val(`${recPath}/seq`), val(`${rp}/holdem/seq`)]);
    T.mark('load');
    if (!inRoom || kickedMe) throw new ApiError(403, 'not_in_room', 'Only someone in the room can poke the table.');
    // (THE HEAL: a published view behind the record → the full path below rewrites it)
    if ((due == null || now < due) && (recSeq == null || recSeq === pubSeq)) return { ok: true, changed: false, due: due ?? null, now };
  }

  const recRef = ref(recPath);
  const recHold = holdRef(recRef);
  try {
    const needHost = op === 'start' || op === 'endSession';
    // (HE3: only the published view's NUMBER is read — never the view itself: the lean wire writes parts, the heal compares numbers.
    //  HE10: the room's players on every full call (≤ 8 small rows — A15: a seat whose player left the room goes AWAY at once) + the room's
    //  createdAt (A16: a record from an earlier room with the same word is never advanced))
    const [, playersRaw, kicked, hostId, roomAt, pubSeq, roomGame, goM] = await Promise.all([
      recHold.loaded, val(`${rp}/players`), val(`${rp}/kicked`), needHost ? val(`${rp}/meta/hostId`) : null,
      val(`${rp}/meta/createdAt`), val(`${rp}/holdem/seq`), op === 'start' ? val(`${rp}/game/matchId`) : null,
      op === 'start' ? val(`${rp}/meta/go/m`) : null]);
    T.mark('load');
    const players = playersRaw && typeof playersRaw === 'object' ? playersRaw : {};
    const inRoom = !!players[uid];
    const kickedMap = kicked && typeof kicked === 'object' ? kicked : {};
    if (!inRoom) throw new ApiError(403, 'not_in_room', 'Only someone in the room can play at its table.');
    if (kickedMap[uid]) throw new ApiError(403, 'kicked', 'You were removed from this room.');
    const isHost = hostId === uid;
    if (op === 'start' && !isHost) throw new ApiError(403, 'not_host', 'Only the host starts the game.');
    if (op === 'start' && !(await startOpen(uid))) throw new ApiError(403, 'not_open', 'HOLD’EM is still being built — only the owner can open a test table.');
    const rng = rngNow();

    // ONE transaction on the server's record
    let prev = null, next = null, refused = null, attempts = 0, gone = null;   // gone: 'clean' | 'room' — the record deleted (HE10 — A16)
    const tx = await recRef.transaction(cur => {
      attempts++; refused = null; prev = null; next = null; gone = null;
      prev = cur && typeof cur.j === 'string' ? JSON.parse(cur.j) : null;
      if (prev && op !== 'start') {
        // HE10 (A16): a record from an EARLIER room with this word (its createdAt differs) is never advanced — it goes; a finished match
        // whose result is sent goes CLEAN_AFTER_MS after its end (the deck, every card, the record)
        if (prev.roomAt != null && roomAt != null && prev.roomAt !== roomAt) { gone = 'room'; return null; }
        const c = cleanAt(prev);
        if (c != null && now >= c) { gone = 'clean'; return null; }
      }
      let rec;
      try {
        if (op === 'start') {
          // (HE3: the console's END GAME / BACK TO THE ROOM leaves a match unfinished — a NEW start the console stamped (meta/go = this
          //  start's matchId) while the room's game is no longer that match may replace it, like an abandoned one)
          const left = !!prev && !!body.matchId && goM === body.matchId && roomGame !== prev.id && body.matchId !== prev.id;
          if (prev && !left && !abandoned(prev, { roomAt, players, kicked: kickedMap })) throw new DealerError(409, 'running', 'A game is already running at this table.', { seq: prev.seq });
          // seats = the room's players, not kicked — HE3: only those the console names (its connected players) when it names them
          const want = Array.isArray(body.uids) ? new Set(body.uids.map(String)) : null;
          const uids = Object.keys(players || {}).filter(u => !kickedMap[u] && (!want || want.has(u))).sort((a, b) => ((players[a] || {}).joinedAt || 0) - ((players[b] || {}).joinedAt || 0));
          const at = Number.isFinite(body.at) ? Math.min(now + START_AHEAD_MS, Math.max(now, body.at)) : now;
          const id = MATCH_ID.test(String(body.matchId || '')) ? String(body.matchId) : null;
          rec = newRecord({ code, uids, mode: body.mode, speed: body.speed, now, rng, prevSeq: prev ? prev.seq : 0, roomAt: roomAt ?? null, dealAt: at, id });
          advance(rec, now, rng);
        } else {
          if (!prev) throw new DealerError(404, 'no_match', 'No game at this table.');
          rec = JSON.parse(cur.j);
          applyOp(rec, op, uid, body, { now, rng, isHost, kicked: kickedMap, gone: goneOf(rec, players, kickedMap) });
        }
      } catch (e) {
        if (!(e instanceof DealerError)) throw e;
        refused = e;
        // a refusal writes nothing — unless the server's clock moved the table first (HE10 — A14: the caught-up table is still written)
        if (!e.advanced) return undefined;
      }
      // the public view's number moves only when what a phone can see changed (a pre-action toggle is private)
      if (prev && op !== 'start' && JSON.stringify(publicOf(rec)) !== JSON.stringify(publicOf(prev))) rec.seq = prev.seq + 1;
      const j = JSON.stringify(rec);
      if (cur && cur.j === j) return undefined;                    // nothing changed (a poke a moment early, a repeat) → nothing written
      next = rec;
      return { j, seq: rec.seq, due: dueOf(rec), id: rec.id, ended: !!rec.m.ended, at: now };
    }, undefined, false);
    T.mark('tx', attempts);
    if (gone && tx.committed) {
      // the record went: its private nodes with it; the table's `due` → nothing (the phones stop poking — the rest of the view stays: the podium)
      await ref('/').update({ [`hole/${code}`]: null, ...(gone === 'clean' ? { [`${rp}/holdem/m/due`]: 'null' } : {}) });
      T.mark('write');
      if (gone === 'room') throw new ApiError(404, 'no_match', 'No game at this table.');
      return { ok: true, changed: true, seq: prev ? prev.seq : null, hand: prev ? prev.m.table.hand : null, due: null, now, cleaned: true };
    }
    const changed = !!(tx.committed && next);
    let rec = changed ? next : prev;
    // THE HEAL: the published view is behind (an out-of-order publish) → this call writes it whole
    if (changed) { await publish(code, op === 'start' || !prev || pubSeq !== prev.seq ? null : prev, next, now); T.mark('write'); }
    else if (rec && pubSeq !== rec.seq) { await publish(code, null, rec, now, { holes: false }); T.mark('write'); }
    if (refused) throw asApi(refused);
    // the match is over and its result not yet sent (this call ended it, or an earlier try failed — the poke retries: due = now)
    if (rec && rec.m.ended && !rec.rep) { rec = await settleReport(code, rec, now); T.mark('report'); }
    if (!rec) return { ok: true, changed: false, seq: null, hand: null, due: null, now };
    return { ok: true, changed, seq: rec.seq, hand: rec.m.table.hand, due: dueOf(rec), now, ...(op === 'start' ? { id: rec.id } : {}) };
  } finally { recHold.off(); }
}

/**
 * THE LEAN WIRE (HE3): ONE multi-path update — the public parts that changed since `prev` (prev null = the whole view, the node
 * replaced: a start or THE HEAL), every seat's private node that changed, and the room's meta/activeAt (at most once a minute — the
 * last stamp is remembered per warm instance). → the update's bytes.
 */
async function publish(code, prev, next, now, { holes = true } = {}) {
  const rp = `rooms/${code}`, u = {};
  const pubNext = publicOf(next);
  if (!prev) u[`${rp}/holdem`] = { seq: next.seq, at: now, ...nestWire(toWire(pubNext)) };
  else if (prev.seq !== next.seq) {
    for (const [k, v] of Object.entries(wireDiff(publicOf(prev), pubNext))) u[`${rp}/holdem/${k}`] = v;
    u[`${rp}/holdem/seq`] = next.seq;
    u[`${rp}/holdem/at`] = now;
  }
  if (holes) {
    if (!prev) {                                                   // a new match (or a heal): the room's private nodes replaced whole
      const all = {};
      for (const id of seatUids(next)) { const h = holeOf(next, id); if (h) all[id] = h; }
      u[`hole/${code}`] = Object.keys(all).length ? all : null;
    } else {
      for (const id of new Set([...seatUids(prev), ...seatUids(next)])) if (JSON.stringify(holeOf(prev, id)) !== JSON.stringify(holeOf(next, id))) u[`hole/${code}/${id}`] = holeOf(next, id);
    }
  }
  const wrote = !!(u[`${rp}/holdem`] || u[`${rp}/holdem/seq`] != null);
  const stamp = wrote && now - (ACTIVE.get(code) || 0) >= ACTIVE_EVERY_MS;
  if (stamp) u[`${rp}/meta/activeAt`] = now;
  if (!Object.keys(u).length) return 0;
  await ref('/').update(u);
  if (stamp) { ACTIVE.set(code, now); if (ACTIVE.size > 2000) for (const k of [...ACTIVE.keys()].slice(0, 500)) ACTIVE.delete(k); }
  if (emulated() && wireStats.length < 20000) {                  // (HE10 — A19: the tests' byte accounting never runs in production)
    const pubPart = Object.fromEntries(Object.entries(u).filter(([k]) => k.startsWith(`${rp}/holdem`)));
    const kinds = [...new Set((next.ev || []).filter(e => !prev || e.n > (prev.evn || 0)).map(e => e.t))];
    wireStats.push({ kinds, diff: wireBytes(pubPart), full: wireBytes({ seq: next.seq, at: now, j: JSON.stringify(pubNext) }), whole: !prev });
  }
  return wireBytes(u);
}
// (the last activeAt stamp per room, per warm instance — a cold instance stamps once more: one more stamp, never one fewer)
const ACTIVE = new Map();
export const forgetHoldemActive = () => ACTIVE.clear();

/**
 * THE RESULT, ONCE: the match is over → its summary from the SERVER's OWN record goes through the server-checked path every room match
 * uses (results/{CODE}_{matchId} claimed by a transaction; stats.js#applyMatch = XP, the streak, the counters — exactly once per player
 * by pstats m/{key}). No client claim, no host relay. A failure leaves rec.rep unset → the next poke (due = now) tries again.
 */
async function settleReport(code, rec, now) {
  let status = 'done';
  try { status = await reportMatch(code, rec, now); } catch (e) { console.warn('holdem report', e && e.message); return rec; }
  let next = null;
  await ref(`hrec/${code}`).transaction(cur => {
    if (!cur || typeof cur.j !== 'string') return undefined;
    const r = JSON.parse(cur.j);
    if (r.id !== rec.id || r.rep) return undefined;
    r.rep = status; r.seq += 1; next = r;
    return { ...cur, j: JSON.stringify(r), seq: r.seq, due: dueOf(r), at: now };
  });
  if (!next) return rec;
  await publish(code, rec, next, now);
  return next;
}

/** → 'done' | 'skipped' (fewer than 2 who played) | 'short' (HE10 — A7: too short to count). Exactly once by the results claim + pstats m/{key}. */
export async function reportMatch(code, rec, now) {
  if (!counts(rec)) return 'short';
  const ex = resultRows(rec);
  if (!ex) return 'skipped';
  const key = `${code}_${rec.id}`;
  const done = await val(`results/${key}`);
  if (done && done.st === 'done') return 'done';
  const claim = await ref(`results/${key}`).transaction(cur => {
    if (cur && cur.st === 'done') return undefined;
    if (cur && cur.st === 'busy' && now - (cur.at || 0) < 30_000) return undefined;
    return { st: 'busy', at: now, by: 'dealer' };
  });
  if (!claim.committed) {
    const cur = claim.snapshot.val();
    if (cur && cur.st === 'done') return 'done';
    throw new Error('being counted');
  }
  const [{ applyMatch }, { bumpPlayed }, { dedupePids }] = await Promise.all([import('./stats.js'), import('./activity.js'), import('../../js/core/progress.js')]);
  const pids = {};
  await Promise.all(Object.keys(ex.rows).map(async u => { const pid = await pidOf(u); if (pid) pids[u] = pid; }));
  dedupePids(ex.rows, pids);
  const meta = await val(`rooms/${code}/meta`);
  const { summary, ...rows } = ex;
  const outcomes = await applyMatch(key, rows, pids, now, { code, meta, win: { c: code, s: rec.m.startAt, e: rec.m.endAt || now } });
  await bumpPlayed('holdem', now).catch(() => {});
  await ref(`results/${key}`).set({ st: 'done', at: now, g: 'holdem', mode: ex.mode, n: ex.n, src: 'dealer', by: 'dealer', o: outcomes });
  return 'done';
}
