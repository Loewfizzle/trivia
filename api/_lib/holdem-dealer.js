// HOLD'EM — THE DEALER's core (HE2): PURE — no database, no clock, no randomness of its own (`now` + `rng` come in). The server's
// record of a match around HE1's engine (js/games/holdem/ — never a copy of the rules): the ops a phone may ask for, everything the
// server's OWN clock makes due (THE POKE), the pauses + the step run-out, the queued PRE-ACTIONS, and what each reader may see.
// The database half (the transaction, the writes, the call budget, the results) is api/_lib/holdem-store.js; docs/holdem.md "THE DEALER".
//
//   THE RECORD (server-only — hrec/{CODE}, stored as one JSON string): { v, id (matchId), code, mode, speed, seq, m (the engine's
//   match: the deck + every hole card), pre: { uid: { kind, hand, street } }, doneAt, revealAt, endingAt, ev: [the last public events,
//   numbered n], evn, rep: null | 'done' | 'skipped' }
//   THE PUBLIC VIEW (rooms/{CODE}/holdem — any signed-in reader): publicOf(rec, now) — the engine's publicView (no deck, no unshown
//   card) + the match's public numbers + `due` (the next moment the server's clock makes something happen) + the recent events.
//   A SEAT's PRIVATE VIEW (hole/{CODE}/{uid} — that uid only): holeOf(rec, uid) — { h: hand, c: [its 2 cards] | none, pre }.
import { createMatch, nextHand, act, rebuy, join, leave, endSession, sitBack, summary } from '../../js/games/holdem/match.js';
import { legalActions, preAction, running, seatById } from '../../js/games/holdem/table.js';
import { publicView } from '../../js/games/holdem/views.js';
import { SPEEDS, DEFAULT_SPEED, MAX_SEATS, MIN_PLAYERS } from '../../js/games/holdem/structure.js';

/** THE PAUSES (the server's clock): a run-out street every 1.5 s; the next hand ~3 s after a fold-win, ~6 s after a showdown. */
export const PAUSE = { street: 1_500, fold: 3_000, showdown: 6_000 };
/** END SESSION's fallback: the host may void a pending end's hand only once it has waited this long (never a normal button). */
export const VOID_AFTER_MS = 120_000;
/** The public view keeps this many recent events (numbered `n` — a phone that missed a write or two still animates them; further behind, it redraws from the state). Every phone downloads the view on every change: 40 kept events made it ~8.8 KB, 16 ~5.8 KB (measured — tests/integration/holdem-server.test.mjs). */
export const EV_KEEP = 16;
export const PRE_KINDS = ['checkfold', 'callany'];
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
  if (sp != null && !SPEEDS[sp]) refuse(400, 'bad_speed', 'Pick TURBO, STANDARD or DEEP.');
  const ids = [...new Set(uids.map(String))];
  if (ids.length < MIN_PLAYERS) refuse(409, 'too_few', 'Two players are needed.');
  if (ids.length > MAX_SEATS) refuse(409, 'too_many', `At most ${MAX_SEATS} players at the table.`);
  // (HE3 — THE WALK INSIDE: the console's match begins at `dealAt` — hand 1 is dealt then (a poke), the level clock starts then; `id` = the
  //  console's matchId, so the podium's report finds results/{CODE}_{id})
  const at = dealAt != null && dealAt > now ? dealAt : now;
  const m = createMatch({ mode, speed: sp || DEFAULT_SPEED, players: shuffled(ids, rng), now: at, stepRunout: true });
  const mid = matchIdOf(now, rng);
  return { v: 1, id: id || mid, code, roomAt, mode, speed: m.speed, seq: prevSeq + 1, m, pre: {}, doneAt: null, revealAt: null, endingAt: null, dealAt: at, ev: [], evn: 0, rep: null };
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
  if (t.street !== 'done' || !t.result || t.result.voided) return 0;
  return t.result.byFold ? PAUSE.fold : PAUSE.showdown;
}

/**
 * THE NEXT MOMENT the server's clock makes something happen (ms, the server's time), or null (nothing timed — e.g. a CASH table
 * waiting for a second dealable player). 0 = due now (a report still to send).
 */
export function dueOf(rec) {
  const m = rec.m, t = m.table;
  if (m.ended) return rec.rep ? null : 0;
  if (running(t)) {
    if (t.runout) return (rec.revealAt || 0) + PAUSE.street;
    return t.deadline ?? null;
  }
  if (!canDeal(m)) return null;
  return nextDealAt(rec);
}

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
 * `kicked` (CASH): a seat whose player was kicked from the room leaves. → true when anything changed.
 */
export function advance(rec, now, rng, { kicked = null } = {}) {
  let changed = false;
  if (kicked && rec.mode === 'cash' && !rec.m.ended) {
    for (const x of rec.m.table.seats) {
      if (!kicked[x.id] || rec.m.players[x.id]?.leaving) continue;
      if (!engine(rec, m => leave(m, x.id, now), now).error) { delete rec.pre[x.id]; changed = true; }
    }
  }
  for (let guard = 0; guard < 200; guard++) {
    const m = rec.m, t = m.table;
    if (m.ended) break;
    // a queued pre-action that can no longer fire (a new street / hand) is dropped
    for (const [uid, p] of Object.entries(rec.pre)) if (!running(t) || p.hand !== t.hand || p.street !== t.street) { delete rec.pre[uid]; changed = true; }
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
 * ctx: { now, rng, isHost, kicked }. Mutates `rec`; → { pub: the public view changed?, why } — or throws a DealerError (nothing changed).
 * (`start` is newRecord + advance — the store calls it.)
 */
export function applyOp(rec, op, uid, body, { now, rng, isHost = false, kicked = null } = {}) {
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
    case 'leave': ok(engine(rec, mm => leave(mm, uid, now), now)); delete rec.pre[uid]; break;
    case 'sit': {
      // CASH: a late joiner takes a free seat (or a player who left comes back) — dealt in from the next hand
      if (kicked && kicked[uid]) refuse(403, 'kicked', 'You were removed from this room.');
      ok(engine(rec, mm => join(mm, uid, now), now));
      break;
    }
    case 'endSession': {
      if (!isHost) refuse(403, 'not_host', 'Only the host can end the session.');
      if (rec.mode !== 'cash') refuse(409, 'illegal', 'Only a CASH game has an END SESSION.');
      if (m.ending) {
        // the fallback only: a pending end's hand is VOIDED (every chip back) once it has waited VOID_AFTER_MS
        if (!body.voidHand) refuse(409, 'ending', 'The session ends when this hand is over.', { seq: rec.seq });
        if (now - (rec.endingAt || now) < VOID_AFTER_MS) refuse(409, 'too_soon', 'Give the hand a moment to finish.', { seq: rec.seq });
        ok(engine(rec, mm => endSession(mm, now, { voidHand: true }), now));
      } else {
        ok(engine(rec, mm => endSession(mm, now), now));
        if (rec.m.ending) rec.endingAt = now;
      }
      break;
    }
    default: refuse(400, 'bad_action', 'No such move.');
  }
  advance(rec, now, rng, { kicked });
}

/** THE PUBLIC VIEW: what any reader may see (never the deck, an unshown hole card, or a queued pre-action). */
export function publicOf(rec) {
  const m = rec.m, t = m.table;
  const { log, ...table } = publicView(t);
  const players = {};
  for (const [id, p] of Object.entries(m.players)) players[id] = { seat: p.seat, buyins: p.buyins, rebuys: p.rebuys, hands: p.hands, won: p.won, kos: p.kos, left: !!p.left, leaving: !!p.leaving };
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
 * isn't credited. null = nothing to report (fewer than 2 players who played).
 */
export function resultRows(rec) {
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

