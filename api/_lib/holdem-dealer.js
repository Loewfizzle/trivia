// HOLD'EM — THE DEALER's core (HE2): PURE — no database, no clock, no randomness of its own (`now` + `rng` come in). The server's
// record of a match around HE1's engine (js/games/holdem/ — never a copy of the rules): the ops a phone may ask for, everything the
// server's OWN clock makes due (THE POKE), the pauses + the step run-out, the queued PRE-ACTIONS, and what each reader may see.
// The database half (the transaction, the writes, the call budget, the results) is api/_lib/holdem-store.js; docs/holdem.md "THE DEALER".
//
//   THE RECORD (server-only — hrec/{CODE}, stored as one JSON string): { v, id (matchId), code, mode, speed, seq, m (the engine's
//   match: the deck + every hole card), pre: { uid: { kind, hand, street } }, doneAt, revealAt, ev: [the last public events,
//   numbered n], evn, rep: null | 'done' | 'skipped' | 'short' (HE10 — too short to count), lv: { uid: hand } (HE5 — LEAVE AFTER THIS HAND, queued) }
//   THE PUBLIC VIEW (rooms/{CODE}/holdem — any signed-in reader): publicOf(rec, now) — the engine's publicView (no deck, no unshown
//   card) + the match's public numbers + `due` (the next moment the server's clock makes something happen) + the recent events.
//   A SEAT's PRIVATE VIEW (hole/{CODE}/{uid} — that uid only): holeOf(rec, uid) — { h: hand, c: [its 2 cards] | none, pre }.
import { createMatch, nextHand, act, rebuy, join, leave, endSession, sitBack, summary } from '../../js/games/holdem/match.js';
import { legalActions, preAction, preVoid, running, seatById } from '../../js/games/holdem/table.js';
import { publicView } from '../../js/games/holdem/views.js';
import { SPEEDS, DEFAULT_SPEED, MAX_SEATS, MIN_PLAYERS } from '../../js/games/holdem/structure.js';

/** THE PAUSES (the server's clock): a run-out street every 1.5 s; the next hand ~3 s after a fold-win, ~6 s after a showdown. */
export const PAUSE = { street: 1_500, fold: 3_000, showdown: 6_000 };
/**
 * The public view keeps this many recent events (numbered `n` — a phone that missed a write or two still animates them; further behind, it
 * redraws from the state). Each event is its own part on the wire (only the new ones travel). HE10 (A4): 24 — the BIGGEST single call (an
 * 8-way all-in's river: the street, up to 7 pots, 7 KOs, the end; or a shove that fires 7 queued CALL ANYs + the reveal) must fit whole, or
 * every phone sees a gap and skips the motion, the sounds + the KO cards (tests/holdem-dealer.test.mjs "THE BIGGEST CALL").
 */
export const EV_KEEP = 24;
/** HE10 (A1): CHECK / FOLD · CHECK (a TRUE check — dropped the moment anyone bets) · CALL ANY */
export const PRE_KINDS = ['checkfold', 'check', 'callany'];
/**
 * HE10 (Ben's A7) — A MATCH COUNTS (XP, the streak, wins) only after REAL PLAY: CASH ≥ 10 hands dealt AND ≥ 5 minutes; a TOURNAMENT ≥ 3
 * hands dealt. Below that the match ends normally but the dealer credits nothing (rep = 'short'; the end screen says so in one quiet line).
 */
export const COUNTS = Object.freeze({ cash: { hands: 10, ms: 5 * 60_000 }, tournament: { hands: 3 } });
/** HE10 (A16): the record + the seats' private nodes are deleted this long after the end (once the result is sent) — the podium is up by then. */
export const CLEAN_AFTER_MS = 8_000;
const ACTS = ['fold', 'check', 'call', 'bet', 'raise', 'allin'];

class DealerError extends Error {
  constructor(status, code, message, extra = {}) { super(message || code); this.status = status; this.code = code; this.extra = extra; }
}
const refuse = (status, code, message, extra) => { throw new DealerError(status, code, message, extra); };
export { DealerError };

/** A new matchId: 'h' + base36 time + 4 random base36 — /^[a-z0-9]{3,16}$/ like every room match. */
export function matchIdOf(now, rng) {
  let r = '';
  for (let i = 0; i < 4; i++) r += Math.floor(rng() * 36).toString(36);
  return `h${Math.floor(now).toString(36)}${r}`.slice(0, 16);
}

/** Fisher–Yates on the injected rng (the SEAT ORDER — the first button is the engine's own rng pick). */
function shuffled(list, rng) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** START: seats = the room's players (≤ 8), in an order the server's randomness picks; hand 1 is dealt by `advance`. */
export function newRecord({ code, uids, mode = 'tournament', speed, now, rng, prevSeq = 0, roomAt = null, dealAt = null, id = null }) {
  if (mode !== 'tournament' && mode !== 'cash') refuse(400, 'bad_mode', 'Pick TOURNAMENT or CASH.');
  const sp = mode === 'cash' ? null : (speed == null ? DEFAULT_SPEED : speed);
  // (HE10 — A13: the real keys only — 'constructor' / '__proto__' / ['turbo'] once made a table with null stacks)
  if (sp != null && !(typeof sp === 'string' && Object.prototype.hasOwnProperty.call(SPEEDS, sp))) refuse(400, 'bad_speed', 'Pick TURBO, STANDARD or DEEP.');
  const ids = [...new Set(uids.map(String))];
  if (ids.length < MIN_PLAYERS) refuse(409, 'too_few', 'Two players are needed.');
  if (ids.length > MAX_SEATS) refuse(409, 'too_many', `At most ${MAX_SEATS} players at the table.`);
  // (HE3 — THE WALK INSIDE: the console's match begins at `dealAt` — hand 1 is dealt then (a poke), the level clock starts then; `id` = the
  //  console's matchId, so the podium's report finds results/{CODE}_{id})
  const at = dealAt != null && dealAt > now ? dealAt : now;
  const m = createMatch({ mode, speed: sp || DEFAULT_SPEED, players: shuffled(ids, rng), now: at, stepRunout: true });
  const mid = matchIdOf(now, rng);
  return { v: 1, id: id || mid, code, roomAt, mode, speed: m.speed, seq: prevSeq + 1, m, pre: {}, doneAt: null, revealAt: null, dealAt: at, ev: [], evn: 0, rep: null, lv: {} };
}

function note(rec, events) {
  for (const e of events) {
    rec.evn += 1;
    rec.ev.push({ n: rec.evn, ...e });
  }
  if (rec.ev.length > EV_KEEP) rec.ev.splice(0, rec.ev.length - EV_KEEP);
}

/** One engine step on the record: notes the events, stamps when a hand ended (the pause) or a run-out began (the reveals). */
function engine(rec, fn, now) {
  const was = rec.m.table, wasRunning = running(was), wasRunout = !!was.runout, wasHand = was.hand;
  const r = fn(rec.m);
  if (r.error) return r;
  rec.m = r.match;
  note(rec, r.events);
  const t = rec.m.table;
  if (t.street === 'done' && (wasRunning || t.hand !== wasHand)) rec.doneAt = now;
  if (t.runout && (!wasRunout || t.hand !== wasHand)) rec.revealAt = now;
  return r;
}

/** The pause before the next deal (from `doneAt`). */
function pauseOf(t) {
  if (t.street !== 'done' || !t.result) return 0;
  return t.result.byFold ? PAUSE.fold : PAUSE.showdown;
}

/**
 * THE NEXT MOMENT the server's clock makes something happen (ms, the server's time), or null (nothing timed — e.g. a CASH table
 * waiting for a second dealable player). 0 = due now (a report still to send).
 */
export function dueOf(rec) {
  const m = rec.m, t = m.table;
  // (HE10 — A16: the result sent → one last moment: the clean-up, CLEAN_AFTER_MS after the end)
  if (m.ended) return rec.rep ? cleanAt(rec) : 0;
  if (running(t)) {
    if (t.runout) return (rec.revealAt || 0) + PAUSE.street;
    return t.deadline ?? null;
  }
  if (!canDeal(m)) return queuedLeaves(rec).length ? nextDealAt(rec) : null;
  return nextDealAt(rec);
}

/** HE10 (A16): when a finished match's record + private nodes may go (its result sent) — null while it isn't finished */
export const cleanAt = rec => (rec && rec.m.ended && rec.rep ? (rec.m.endAt || 0) + CLEAN_AFTER_MS : null);

/** HE10 (A7): did this match see enough real play to COUNT? (COUNTS) */
export function counts(rec) {
  const m = rec.m;
  if (rec.mode === 'cash') return m.hands >= COUNTS.cash.hands && (m.endAt || 0) - (m.startAt || 0) >= COUNTS.cash.ms;
  return m.hands >= COUNTS.tournament.hands;
}

/** HE5 — LEAVE AFTER THIS HAND: the CASH seats whose player queued a leave (applied when the hand is over — at the next deal's moment) */
const queuedLeaves = rec => Object.keys(rec.lv || {});

/** When the next hand may be dealt: the pause after the last one (and never before the match's first deal moment — HE3). */
const nextDealAt = rec => Math.max(rec.dealAt || 0, (rec.doneAt ?? 0) + pauseOf(rec.m.table));

/** Can the next hand be dealt (two players with chips who aren't sat out, the match not ending)? */
function canDeal(m) {
  if (m.ended || m.ending) return false;
  const t = m.table;
  return t.seats.filter(x => !x.left && x.stack > 0 && !(t.awaySitsOut && x.away)).length >= 2;
}

/**
 * ADVANCE: everything DUE by the server's clock at `now`, in order — a queued PRE-ACTION the moment its turn comes, a TIMEOUT
 * (the time bank first), a RUN-OUT street after its reveal time, the NEXT HAND after its pause (the new blind level with it).
 * `kicked` (the room's kicked map): CASH — that seat leaves; a TOURNAMENT — AWAY at once. HE10 (A15) `gone` ({ uid: true } — a seat whose
 * player is no longer in the room's players): AWAY at once in both modes (no 20 s + 30 s bank to wait out on every turn — 'back' undoes it).
 * → true when anything changed.
 */
export function advance(rec, now, rng, { kicked = null, gone = null } = {}) {
  let changed = false;
  if ((kicked || gone) && !rec.m.ended) {
    for (const x of rec.m.table.seats) {
      const p = rec.m.players[x.id];
      if (!p || p.left || p.leaving || x.status === 'out') continue;
      if (kicked && kicked[x.id] && rec.mode === 'cash') {
        if (!engine(rec, m => leave(m, x.id, now), now).error) { delete rec.pre[x.id]; changed = true; }
      } else if (((kicked && kicked[x.id]) || (gone && gone[x.id])) && !x.away) {
        if (!engine(rec, m => act(m, { type: 'away', id: x.id }, now), now).error) { delete rec.pre[x.id]; changed = true; }
      }
    }
  }
  for (let guard = 0; guard < 200; guard++) {
    const m = rec.m, t = m.table;
    if (m.ended) break;
    // a queued pre-action that can no longer fire (a new street / hand — or HE10's TRUE CHECK once someone bet) is dropped
    for (const [uid, p] of Object.entries(rec.pre)) if (!running(t) || p.hand !== t.hand || p.street !== t.street || preVoid(t, uid, p)) { delete rec.pre[uid]; changed = true; }
    if (running(t)) {
      if (t.runout) {
        if (now < (rec.revealAt || 0) + PAUSE.street) break;
        engine(rec, mm => act(mm, { type: 'deal' }, now), now);
        rec.revealAt = now;
        changed = true;
        continue;
      }
      const L = legalActions(t);
      if (L && rec.pre[L.id]) {
        const p = preAction(t, L.id, rec.pre[L.id]);
        delete rec.pre[L.id];
        changed = true;
        if (p && p.action && !engine(rec, mm => act(mm, p.action, now), now).error) continue;
      }
      if (t.deadline != null && now >= t.deadline) {
        if (engine(rec, mm => act(mm, { type: 'timeout' }, now), now).error) break;
        changed = true;
        continue;
      }
      break;
    }
    // HE5 — the queued LEAVE AFTER THIS HAND: the hand is over — they go at the next deal's moment (the showdown stays on screen until
    // then), or at once when no next hand can be dealt
    if (queuedLeaves(rec).length && (now >= nextDealAt(rec) || !canDeal(m))) {
      for (const uid of queuedLeaves(rec)) {
        delete rec.lv[uid];
        if (m.players[uid] && !m.players[uid].left) engine(rec, mm => leave(mm, uid, now), now);
      }
      changed = true;
      continue;
    }
    if (!canDeal(m) || now < nextDealAt(rec)) break;
    if (engine(rec, mm => nextHand(mm, { rng, now }), now).error) break;
    changed = true;
  }
  return changed;
}

const seated = (rec, uid) => !!seatById(rec.m.table, uid);

/**
 * May a START replace this unfinished match? Only when it is ABANDONED: its room is gone (a HUSH WORD comes back 24 h after a room
 * closes — `roomAt` = the room's meta/createdAt differs) or fewer than 2 of its seated players are still in the room, not kicked.
 */
export function abandoned(rec, { roomAt, players, kicked }) {
  if (rec.m.ended) return true;
  if (rec.roomAt != null && roomAt != null && rec.roomAt !== roomAt) return true;
  const live = rec.m.table.seats.filter(x => players && players[x.id] && !(kicked && kicked[x.id]));
  return live.length < 2;
}

/**
 * ONE OP from a player (uid = the CALLER — never a uid from the body: nobody acts for another player, the host included).
 * ctx: { now, rng, isHost, kicked, gone }. Mutates `rec` — or throws a DealerError. HE10 (A14): what the server's clock made due runs FIRST
 * (a late tap never beats its own timeout, and the time bank is charged from the deadline); a refusal after that catch-up carries
 * `advanced: true` so the store still writes the caught-up table (and only the op is refused). (`start` is newRecord + advance — the store.)
 */
export function applyOp(rec, op, uid, body, { now, rng, isHost = false, kicked = null, gone = null } = {}) {
  const ran = advance(rec, now, rng, { kicked, gone });
  try { opOn(rec, op, uid, body, { now, isHost, kicked }); } catch (e) {
    if (e instanceof DealerError && ran) e.advanced = true;
    throw e;
  }
  advance(rec, now, rng, { kicked, gone });
}

function opOn(rec, op, uid, body, { now, isHost, kicked }) {
  uid = String(uid);
  const m = rec.m, t = m.table;
  const stale = () => refuse(409, 'stale', 'The table moved on.', { seq: rec.seq, hand: t.hand });
  const fresh = () => {
    if (body.hand !== t.hand || body.seq !== rec.seq) stale();
  };
  const ok = r => { if (r.error) refuse(409, 'illegal', r.error, { seq: rec.seq }); };
  switch (op) {
    case 'act': {
      if (!seated(rec, uid)) refuse(403, 'not_seated', 'You are not at this table.');
      fresh();
      const a = String(body.action || '');
      if (!ACTS.includes(a)) refuse(400, 'bad_action', 'That move doesn’t read.');
      const type = a === 'bet' || a === 'raise' ? (t.bet === 0 ? 'bet' : 'raise') : a;
      const action = { id: uid, type };
      if (type === 'bet' || type === 'raise') action.to = Number(body.amount);
      ok(engine(rec, mm => act(mm, action, now), now));
      delete rec.pre[uid];
      break;
    }
    case 'pre': {
      if (!seated(rec, uid)) refuse(403, 'not_seated', 'You are not at this table.');
      if (body.hand !== t.hand || !running(t)) stale();
      const kind = body.pre == null ? null : String(body.pre);
      if (kind != null && !PRE_KINDS.includes(kind)) refuse(400, 'bad_pre', 'That toggle doesn’t read.');
      const x = seatById(t, uid);
      if (kind && x.status !== 'in') refuse(409, 'illegal', 'You are not in this hand.', { seq: rec.seq });
      if (kind === 'check' && x.bet < t.bet) refuse(409, 'illegal', 'There’s a bet to call — CHECK is off.', { seq: rec.seq });
      if (kind) rec.pre[uid] = { kind, hand: t.hand, street: t.street };
      else delete rec.pre[uid];
      break;
    }
    case 'show': {
      if (!seated(rec, uid)) refuse(403, 'not_seated', 'You are not at this table.');
      if (body.hand !== t.hand) stale();
      ok(engine(rec, mm => act(mm, { id: uid, type: 'show' }, now), now));
      break;
    }
    case 'poke': break;
    case 'rebuy': ok(engine(rec, mm => rebuy(mm, uid, now), now)); break;
    case 'back': ok(engine(rec, mm => sitBack(mm, uid, now), now)); break;
    case 'leave': {
      // HE5 — LEAVE IS ALWAYS THERE (CASH): `after` = LEAVE AFTER THIS HAND — while you're IN the running hand it's QUEUED (you play it out;
      // the dealer lets you go when it's over — advance); `after: false` cancels. Not in a running hand → you leave at once (as before).
      if (body.after != null) {
        if (rec.mode !== 'cash') refuse(409, 'illegal', 'Only a CASH game lets you leave.', { seq: rec.seq });
        const x = seatById(t, uid), p = m.players[uid];
        if (!x || !p || p.left) refuse(403, 'not_seated', 'You are not at this table.');
        rec.lv = rec.lv || {};
        if (!body.after) { delete rec.lv[uid]; break; }
        if (running(t) && (x.status === 'in' || x.status === 'allin')) { rec.lv[uid] = t.hand; break; }
      }
      ok(engine(rec, mm => leave(mm, uid, now), now));
      delete rec.pre[uid];
      if (rec.lv) delete rec.lv[uid];
      break;
    }
    case 'sit': {
      // CASH: a late joiner takes a free seat (or a player who left comes back) — dealt in from the next hand
      if (kicked && kicked[uid]) refuse(403, 'kicked', 'You were removed from this room.');
      ok(engine(rec, mm => join(mm, uid, now), now));
      break;
    }
    case 'endSession': {
      if (!isHost) refuse(403, 'not_host', 'Only the host can end the session.');
      if (rec.mode !== 'cash') refuse(409, 'illegal', 'Only a CASH game has an END SESSION.');
      // (HE10 — A17: no "void the hand" — a pending end waits for the hand, which always ends by itself)
      if (m.ending) refuse(409, 'ending', 'The session ends when this hand is over.', { seq: rec.seq });
      ok(engine(rec, mm => endSession(mm, now), now));
      break;
    }
    default: refuse(400, 'bad_action', 'No such move.');
  }
}

/** THE PUBLIC VIEW: what any reader may see (never the deck, an unshown hole card, or a queued pre-action). */
export function publicOf(rec) {
  const m = rec.m, t = m.table;
  const { log, ...table } = publicView(t);
  const players = {};
  for (const [id, p] of Object.entries(m.players)) players[id] = { seat: p.seat, buyins: p.buyins, rebuys: p.rebuys, hands: p.hands, won: p.won, kos: p.kos, left: !!p.left, leaving: !!p.leaving, ...(rec.lv && rec.lv[id] != null ? { after: true } : {}) };
  return {
    v: 1, id: rec.id, mode: rec.mode, speed: rec.speed, seq: rec.seq, hand: t.hand,
    startAt: m.startAt, levelMs: m.levelMs, level: m.level,
    table, players, places: m.places, ended: m.ended, endAt: m.endAt, winner: m.winner, ending: m.ending,
    ledger: m.ledger, biggest: m.biggest, hands: m.hands, due: dueOf(rec), rep: rec.rep || null, ev: rec.ev,
  };
}

/** A SEAT's PRIVATE VIEW: this hand's two cards (while it has them) + its queued pre-action. null = nothing to hold. */
export function holeOf(rec, uid) {
  const t = rec.m.table, x = seatById(t, uid);
  const out = { h: t.hand };
  if (x && x.cards && x.cards.length) out.c = x.cards.slice();
  if (rec.pre[uid]) out.pre = rec.pre[uid].kind;
  return out.c || out.pre ? out : null;
}

/** Every uid that ever sat at this match (a seat's private node is cleared when it no longer holds anything). */
export const seatUids = rec => Object.keys(rec.m.players);

/**
 * THE RESULT ROWS for the server-checked path (api/_lib/stats.js#applyMatch — the same rows core/match-report.js#extractMatch makes):
 * TOURNAMENT = the places (1st = the win); CASH = by net (ties share; the top net wins unless everyone tied). A player dealt no hand
 * isn't credited. null = nothing to report (fewer than 2 players who played, or — HE10 — too short to count: `counts`).
 */
export function resultRows(rec) {
  if (!counts(rec)) return null;                                   // (HE10 — A7: too short to count)
  const s = summary(rec.m), rows = {};
  const played = id => (s.players[id] && s.players[id].hands > 0);
  if (rec.mode === 'tournament') {
    for (const p of s.places || []) if (played(p.id)) rows[p.id] = { rank: p.place, win: p.place === 1 };
  } else {
    const L = (s.ledger || []).filter(r => played(r.id));
    const top = Math.max(...L.map(r => r.net)), allTied = L.every(r => r.net === top);
    for (const r of L) rows[r.id] = { rank: 1 + L.filter(o => o.net > r.net).length, win: r.net === top && !allTied };
  }
  const n = Object.keys(rows).length;
  if (n < 2) return null;
  for (const r of Object.values(rows)) { r.c = { p: 1, ...(r.win ? { w: 1 } : {}) }; r.rec = {}; }
  return { gid: 'holdem', n, solo: false, mode: rec.mode === 'cash' ? 'cash' : rec.speed, rows, rejected: [], summary: s };
}

