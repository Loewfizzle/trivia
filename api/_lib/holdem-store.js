// HOLD'EM — THE DEALER's database half (HE2). The ops arrive on POST /api/report { holdem: <op>, room, … } (STILL 8 FUNCTIONS —
// report.js is the room-match function: it already reads rooms/{CODE} + credits matches through stats.js#applyMatch, which the dealer
// reuses for the match's end with no host relay). docs/holdem.md "THE DEALER".
//
//   start      { room, mode: 'tournament'|'cash', speed? }   the HOST only — seats = the room's players (≤ 8, not kicked)
//   act        { room, hand, seq, action, amount? }           fold · check · call · bet / raise (TO amount) · allin — your own seat only
//   pre        { room, hand, pre: 'checkfold'|'callany'|null } your queued pre-action (kept on the server — fires while your phone sleeps)
//   show       { room, hand }                                 the optional SHOW after everyone folded to you
//   poke       { room }                                       whatever the server's clock says is DUE (cheap when nothing is: one tiny read)
//   rebuy · back · leave · sit  { room }                      CASH: rebuy at zero · back from AWAY / SAT OUT · leave · a late joiner sits down
//   endSession { room, voidHand? }                            the HOST only, CASH: closes now, or when the running hand ends
//
//   hrec/{CODE}                { j: the record (JSON), seq, due, id, ended, at }   SERVER ONLY (the rules' default deny) — the deck, every card
//   rooms/{CODE}/holdem        { seq, at, j: the public view (JSON) }              any signed-in reader; written by the server only
//   hole/{CODE}/{uid}          { h: hand, c?: [2 cards], pre? }                    that uid only (+ never a kicked one); server-written
// Every op = ONE transaction on hrec/{CODE} (held in the SDK's cache for the call — DFIX3's trick: the first attempt sees the real
// record), then the public view (a transaction that never goes backwards in seq) + the seats' private nodes that changed.
import { randomInt } from 'node:crypto';
import { ApiError } from './http.js';
import { ref, val, emulated } from './fb.js';
import { take } from './limit.js';
import { noTiming } from './timing.js';
import { pidOf } from './profiles.js';
import { DealerError, newRecord, applyOp, advance, dueOf, publicOf, holeOf, seatUids, resultRows } from './holdem-dealer.js';

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

// THE CALL BUDGET off the hot path (daily.js's DFIX3 pattern): a per-instance window decides at once; the shared rl/hd_{uid} count is
// written behind it, and its refusal lifts the local count so a flood across warm instances still stops
const BUDGET = new Map();
function budget(uid, now) {
  const key = String(uid).replace(/[.#$[\]/]/g, '_');
  let b = BUDGET.get(key);
  if (!b || now - b.t >= CALLS.windowMs || now < b.t) {
    b = { n: 0, t: now };
    BUDGET.set(key, b);
    if (BUDGET.size > 4000) for (const k of [...BUDGET.keys()].slice(0, 1000)) BUDGET.delete(k);
  }
  if (b.n >= CALLS.max) return false;
  b.n++;
  take(`hd_${key}`, CALLS.max, CALLS.windowMs, now).then(ok => { if (!ok) b.n = Math.max(b.n, CALLS.max); }).catch(() => {});
  return true;
}
export const forgetHoldemBudgets = () => BUDGET.clear();

const ROOM = /^[A-Z]{4}$/;
const asApi = e => new ApiError(e.status, e.code, e.message, e.extra);

/** Hold a node in the SDK's cache for the call (a transaction's first attempt then runs on the real value — one round trip). */
function holdRef(r) {
  const hold = () => {};
  r.on('value', hold);
  return { loaded: new Promise((res, rej) => r.once('value', s => res(s.val()), rej)), off: () => r.off('value', hold) };
}

/**
 * ONE HOLD'EM CALL. uid = the verified caller (requireUser). → { ok, seq, hand, due, now, changed } — or an ApiError:
 * 400 bad_* · 403 not_in_room / kicked / not_host / not_seated · 404 no_match · 409 stale (+ seq, hand) / illegal / running · 429 slow_down.
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

  // THE POKE's cheap path: nothing due by the server's clock → one tiny read, no write
  if (op === 'poke') {
    const [due, inRoom, kickedMe] = await Promise.all([val(`${recPath}/due`), member(), val(`${rp}/kicked/${uid}`)]);
    T.mark('load');
    if (!inRoom || kickedMe) throw new ApiError(403, 'not_in_room', 'Only someone in the room can poke the table.');
    if (due == null || now < due) return { ok: true, changed: false, due: due ?? null, now };
  }

  const recRef = ref(recPath), pubRef = ref(`${rp}/holdem`);
  const recHold = holdRef(recRef), pubHold = holdRef(pubRef);
  try {
    const needHost = op === 'start' || op === 'endSession';
    const [, , inRoom, kicked, hostId, players] = await Promise.all([
      recHold.loaded, pubHold.loaded, member(), val(`${rp}/kicked`), needHost ? val(`${rp}/meta/hostId`) : null, op === 'start' ? val(`${rp}/players`) : null]);
    T.mark('load');
    const kickedMap = kicked && typeof kicked === 'object' ? kicked : {};
    if (!inRoom) throw new ApiError(403, 'not_in_room', 'Only someone in the room can play at its table.');
    if (kickedMap[uid]) throw new ApiError(403, 'kicked', 'You were removed from this room.');
    const isHost = hostId === uid;
    if (op === 'start' && !isHost) throw new ApiError(403, 'not_host', 'Only the host starts the game.');
    const rng = rngNow();

    // ONE transaction on the server's record
    let prev = null, next = null, refused = null, attempts = 0;
    const tx = await recRef.transaction(cur => {
      attempts++; refused = null; prev = null; next = null;
      prev = cur && typeof cur.j === 'string' ? JSON.parse(cur.j) : null;
      let rec;
      try {
        if (op === 'start') {
          if (prev && !prev.m.ended) throw new DealerError(409, 'running', 'A game is already running at this table.', { seq: prev.seq });
          const uids = Object.keys(players || {}).filter(u => !kickedMap[u]).sort((a, b) => ((players[a] || {}).joinedAt || 0) - ((players[b] || {}).joinedAt || 0));
          rec = newRecord({ code, uids, mode: body.mode, speed: body.speed, now, rng, prevSeq: prev ? prev.seq : 0 });
          advance(rec, now, rng);
        } else {
          if (!prev) throw new DealerError(404, 'no_match', 'No game at this table.');
          rec = JSON.parse(cur.j);
          applyOp(rec, op, uid, body, { now, rng, isHost, kicked: kickedMap });
        }
      } catch (e) {
        if (!(e instanceof DealerError)) throw e;
        refused = e;
        return undefined;                                          // a refusal writes nothing
      }
      // the public view's number moves only when what a phone can see changed (a pre-action toggle is private)
      if (prev && op !== 'start' && JSON.stringify(publicOf(rec)) !== JSON.stringify(publicOf(prev))) rec.seq = prev.seq + 1;
      const j = JSON.stringify(rec);
      if (cur && cur.j === j) return undefined;                    // nothing changed (a poke a moment early, a repeat) → nothing written
      next = rec;
      return { j, seq: rec.seq, due: dueOf(rec), id: rec.id, ended: !!rec.m.ended, at: now };
    }, undefined, false);
    T.mark('tx', attempts);
    if (refused) throw asApi(refused);
    const changed = !!(tx.committed && next);
    let rec = changed ? next : prev;
    if (changed) { await publish(code, op === 'start' ? null : prev, next, now, pubRef); T.mark('write'); }
    // the match is over and its result not yet sent (this call ended it, or an earlier try failed — the poke retries: due = now)
    if (rec && rec.m.ended && !rec.rep) { rec = await settleReport(code, rec, now, pubRef); T.mark('report'); }
    if (!rec) return { ok: true, changed: false, seq: null, hand: null, due: null, now };
    return { ok: true, changed, seq: rec.seq, hand: rec.m.table.hand, due: dueOf(rec), now, ...(op === 'start' ? { id: rec.id } : {}) };
  } finally { recHold.off(); pubHold.off(); }
}

/** The public view (never backwards in seq) + every seat's private node that changed — in parallel. */
async function publish(code, prev, next, now, pubRef) {
  const jobs = [];
  if (!prev || prev.seq !== next.seq) {
    const pub = { seq: next.seq, at: now, j: JSON.stringify(publicOf(next)) };
    jobs.push(pubRef.transaction(c => (c && Number(c.seq) >= pub.seq ? undefined : pub), undefined, false));
  }
  if (!prev) {                                                     // a new match: the room's private nodes replaced whole
    const all = {};
    for (const u of seatUids(next)) { const h = holeOf(next, u); if (h) all[u] = h; }
    jobs.push(ref(`hole/${code}`).set(Object.keys(all).length ? all : null));
  } else {
    const holes = {};
    const uids = new Set([...seatUids(prev), ...seatUids(next)]);
    for (const u of uids) if (JSON.stringify(holeOf(prev, u)) !== JSON.stringify(holeOf(next, u))) holes[`hole/${code}/${u}`] = holeOf(next, u);
    if (Object.keys(holes).length) jobs.push(ref('/').update(holes));
  }
  await Promise.all(jobs);
}

/**
 * THE RESULT, ONCE: the match is over → its summary from the SERVER's OWN record goes through the server-checked path every room match
 * uses (results/{CODE}_{matchId} claimed by a transaction; stats.js#applyMatch = XP, the streak, the counters — exactly once per player
 * by pstats m/{key}). No client claim, no host relay. A failure leaves rec.rep unset → the next poke (due = now) tries again.
 */
async function settleReport(code, rec, now, pubRef) {
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
  await publish(code, rec, next, now, pubRef);
  return next;
}

/** → 'done' | 'skipped' (fewer than 2 who played). Exactly once by the results claim + pstats m/{key}. */
export async function reportMatch(code, rec, now) {
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
