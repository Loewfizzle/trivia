// HOLD'EM — THE MATCH (HE1, pure): a TOURNAMENT (TURBO · STANDARD · DEEP — the stacks, THE BLIND LADDER, the level
// clock, KOs + the order of finish) or a CASH session (fixed blinds, rebuys, late joiners, leaving, THE LEDGER),
// around the one-hand reducer in table.js. Plain JSON; never Math.random or a clock (`rng` + `now` come in).
//   createMatch({ mode, speed, players, now })        → match
//   nextHand(match, { rng | deck, now })              → { match, events, error? }   deal the next hand
//   act(match, action, now)                           → { match, events, error? }   a table action (+ the hand's settle)
//   rebuy / join / leave / endSession (CASH)          → { match, events, error? }
//   sitBack(match, id, now)                           → { match, events, error? }   back from AWAY (CASH: SAT OUT → dealt in next hand)
//   summary(match)                                    → THE MATCH SUMMARY (HE2 reports it to /api for XP — not wired here)
import { createTable, startHand, apply, forceFold, running, seatById, newSeat } from './table.js';
import { SPEEDS, DEFAULT_SPEED, CASH, blindsAt, levelAt, MAX_SEATS, MIN_PLAYERS, BANK_MS, BANK_REFILL_MS } from './structure.js';
import { CAT } from './rank.js';

const copy = s => JSON.parse(JSON.stringify(s));
const fail = (match, error) => ({ match, events: [], error });
const NOTABLE_MAX = 20;
const now0 = (m, now) => ({ hand: m.table.hand, at: now });

export function createMatch({ mode = 'tournament', speed = DEFAULT_SPEED, players, now = 0, stepRunout = false }) {
  const ids = (players || []).map(String);
  if (ids.length < MIN_PLAYERS || ids.length > MAX_SEATS) throw new Error(`${MIN_PLAYERS}–${MAX_SEATS} players`);
  if (new Set(ids).size !== ids.length) throw new Error('player ids must be unique');
  const cash = mode === 'cash';
  if (!cash && mode !== 'tournament') throw new Error(`unknown mode: ${mode}`);
  if (!cash && !SPEEDS[speed]) throw new Error(`unknown speed: ${speed}`);
  const stack = cash ? CASH.stack : SPEEDS[speed].stack;
  const { sb, bb } = cash ? CASH : blindsAt(0);
  // (HE2: the shot clock in BOTH modes; CASH's AWAY = SAT OUT)
  const table = createTable({ seats: ids.map((id, i) => ({ id, seat: i, stack })), sb, bb, clock: true, awaySitsOut: cash, stepRunout });
  const people = {};
  ids.forEach((id, i) => { people[id] = { seat: i, buyins: stack, rebuys: 0, banked: 0, hands: 0, won: 0, kos: 0, joinedAt: now, left: false, leaving: false }; });
  return {
    v: 1, game: 'holdem', mode, speed: cash ? null : speed, startAt: now, levelMs: cash ? null : SPEEDS[speed].levelMs,
    level: 0, table, players: people, places: [], hands: 0, biggest: null, notable: [],
    ended: false, endAt: null, winner: null, ending: false, ledger: null,
  };
}

/** The blinds the NEXT hand will use (a new level applies from the next hand). */
export function blindsFor(match, now) {
  if (match.mode === 'cash') return { level: 0, sb: CASH.sb, bb: CASH.bb };
  const level = levelAt(match.startAt, now, match.levelMs);
  return { level, ...blindsAt(level) };
}

export function nextHand(match, { rng, deck, now = 0 } = {}) {
  if (match.ended) return fail(match, 'the match is over');
  if (match.ending) return fail(match, 'the session is ending');
  if (running(match.table)) return fail(match, 'a hand is already running');
  const m = copy(match), events = [];
  const b = blindsFor(m, now);
  if (b.level !== m.level) {
    m.level = b.level;
    events.push({ t: 'level', ...now0(m, now), level: b.level, sb: b.sb, bb: b.bb });
  }
  const r = startHand(m.table, { rng, deck, now, sb: b.sb, bb: b.bb });
  if (r.error) return fail(match, r.error);
  m.table = r.state;
  m.hands += 1;
  const dealtIn = x => x.status === 'in' || x.status === 'allin';
  for (const x of m.table.seats) if (dealtIn(x)) m.players[x.id].hands += 1;
  // (HE2 — CASH: the time bank refills +5 s per hand dealt in, never past 30 s; a TOURNAMENT's bank is one per match)
  if (m.mode === 'cash' && m.table.clock) for (const x of m.table.seats) if (dealtIn(x)) x.bank = Math.min(BANK_MS, x.bank + BANK_REFILL_MS);
  const all = [...events, ...r.events];
  // a hand can end inside the deal (both blinds all in → the run-out; AWAY seats folding at once) — settle it now
  if (m.table.street === 'done') settle(m, all, now);
  return { match: m, events: all };
}

export function act(match, action, now = 0) {
  if (match.ended) return fail(match, 'the match is over');
  const was = running(match.table);
  const r = apply(match.table, action, now);
  if (r.error) return fail(match, r.error);
  const m = withTable(match, r.state), events = r.events.slice();
  if (was && m.table.street === 'done') settle(m, events, now);
  return { match: m, events };
}

const withTable = (match, table) => { const { table: _, ...rest } = match; return { ...copy(rest), table }; };

/** The hand just ended: the records, the busts + places (TOURNAMENT), the leavers + a pending end (CASH). */
function settle(m, events, now) {
  const t = m.table, res = t.result;
  const winners = [...new Set(res.pots.flatMap(p => p.winners.map(w => w.id)))];
  for (const id of winners) m.players[id].won += 1;
  if (!m.biggest || res.total > m.biggest.amount) m.biggest = { amount: res.total, hand: t.hand, ids: winners };
  for (const e of t.log) if (e.t === 'shown' && e.cat >= CAT.quads) note(m, { hand: t.hand, kind: 'strong', id: e.id, label: e.label });
  if (m.mode === 'tournament') return bust(m, events, now);
  for (const x of t.seats.filter(s => m.players[s.id].leaving)) removeSeat(m, x.id, events, now);
  if (m.ending) close(m, events, now);
}

function note(m, row) { if (m.notable.length < NOTABLE_MAX) m.notable.push(row); }

/**
 * TOURNAMENT busts: everyone dealt in who has 0 chips is OUT. Two or more out in the same hand → the one who
 * STARTED the hand with more chips places higher; equal starts SHARE the better place. The KO goes to the
 * winner(s) of the highest pot the busted player could win (the pot that took their last chips).
 */
function bust(m, events, now) {
  const t = m.table;
  const aliveBefore = Object.keys(m.players).length - m.places.length;
  const out = t.seats.filter(x => x.stack === 0 && x.status !== 'out').sort((a, b) => a.start - b.start);
  let place = aliveBefore;
  for (let i = 0; i < out.length;) {
    let j = i;
    while (j < out.length && out[j].start === out[i].start) j++;
    const shared = place - (j - i - 1);                  // the group shares the best of its places
    for (const x of out.slice(i, j)) {
      const pot = [...t.result.pots].reverse().find(p => p.ids.includes(x.id));
      const by = pot ? pot.winners.map(w => w.id).filter(id => id !== x.id) : [];
      for (const id of by) m.players[id].kos += 1;
      m.places.push({ id: x.id, place: shared, hand: t.hand, by });
      x.status = 'out';
      events.push({ t: 'out', ...now0(m, now), id: x.id, place: shared, by });
      note(m, { hand: t.hand, kind: 'knockout', id: x.id, by, place: shared });
    }
    place -= j - i;
    i = j;
  }
  const alive = t.seats.filter(x => x.stack > 0);
  if (alive.length === 1) {
    const w = alive[0];
    m.places.push({ id: w.id, place: 1, hand: t.hand, by: [] });
    Object.assign(m, { ended: true, endAt: now, winner: w.id });
    events.push({ t: 'ended', ...now0(m, now), winner: w.id });
  }
}

/**
 * SIT BACK (HE2): an AWAY player is back. A TOURNAMENT: they act on the clock again. CASH: a SAT OUT player is dealt in from
 * the next hand (mid-hand it changes nothing in the running hand — they were not dealt in). Only the player themself.
 */
export function sitBack(match, id, now = 0) {
  if (match.ended) return fail(match, 'the match is over');
  return act(match, { id: String(id), type: 'back' }, now);
}

// ------------------------------------------------------------------------------------------------ CASH
function needCash(match) { return match.mode === 'cash' ? null : 'only in a CASH game'; }

/** REBUY (CASH): back to 1,000 once you are at zero — between hands, or while a hand runs that you're not in. */
export function rebuy(match, id, now = 0) {
  const why = needCash(match) || (match.ended && 'the session is over');
  if (why) return fail(match, why);
  const p = match.players[id], x = seatById(match.table, id);
  if (!p || p.left || !x) return fail(match, 'that player is not at the table');
  if (x.stack > 0 || (running(match.table) && x.status === 'allin')) return fail(match, 'a rebuy is only for a player at zero');
  const m = copy(match), y = seatById(m.table, id);
  y.stack = CASH.rebuy;
  if (running(m.table)) y.status = 'sitout';
  m.players[id].buyins += CASH.rebuy;
  m.players[id].rebuys += 1;
  return { match: m, events: [{ t: 'rebuy', ...now0(m, now), id, amount: CASH.rebuy }] };
}

/** LATE JOIN (CASH): a free seat, 1,000 chips, dealt in from the next hand (no blind owed). A player who left may come back. */
export function join(match, id, now = 0) {
  const why = needCash(match) || (match.ended && 'the session is over') || (match.ending && 'the session is ending');
  if (why) return fail(match, why);
  id = String(id);
  const had = match.players[id];
  if (had && !had.left) return fail(match, 'already at the table');
  const taken = new Set(match.table.seats.map(x => x.seat));
  let seat = -1;
  for (let n = 0; n < MAX_SEATS; n++) if (!taken.has(n)) { seat = n; break; }
  if (seat < 0) return fail(match, 'the table is full');
  const m = copy(match);
  m.table.seats.push(newSeat({ id, seat, stack: CASH.stack }, m.table.clock));
  m.table.seats.sort((a, b) => a.seat - b.seat);
  m.players[id] = had
    ? { ...had, seat, buyins: had.buyins + CASH.stack, left: false, leaving: false }
    : { seat, buyins: CASH.stack, rebuys: 0, banked: 0, hands: 0, won: 0, kos: 0, joinedAt: now, left: false, leaving: false };
  return { match: m, events: [{ t: 'joined', ...now0(m, now), id, seat }] };
}

/**
 * LEAVE (CASH): the stack counts at the moment they leave. Mid-hand they fold at once (out of turn); a player
 * all in stays in the hand to its end and leaves with what they have then.
 */
export function leave(match, id, now = 0) {
  const why = needCash(match) || (match.ended && 'the session is over');
  if (why) return fail(match, why);
  const p = match.players[id];
  if (!p || p.left) return fail(match, 'that player is not at the table');
  const x = seatById(match.table, id);
  if (!running(match.table) || !x || (x.total === 0 && x.status !== 'in' && x.status !== 'allin')) {
    const m = copy(match), events = [];           // not in the running hand (or none runs): gone at once
    removeSeat(m, id, events, now);
    return { match: m, events };
  }
  const r = forceFold(match.table, id, now);
  const m = withTable(match, r.state), events = r.events.slice();
  m.players[id].leaving = true;
  if (m.table.street === 'done') settle(m, events, now);
  return { match: m, events };
}

function removeSeat(m, id, events, now) {
  const t = m.table, x = seatById(t, id), p = m.players[id];
  p.banked += x ? x.stack : 0;
  Object.assign(p, { left: true, leaving: false, leftAt: now });
  if (x) t.seats = t.seats.filter(s => s.id !== id);
  events.push({ t: 'left', hand: t.hand, at: now, id, stack: x ? x.stack : 0 });
}

/**
 * END SESSION (CASH, the host): between hands it closes at once; mid-hand it closes when that hand ends —
 * or at once with { voidHand: true }, every chip of the running hand back where it came from.
 */
export function endSession(match, now = 0, { voidHand = false } = {}) {
  const why = needCash(match) || (match.ended && 'the session is over');
  if (why) return fail(match, why);
  const m = copy(match), events = [];
  if (running(m.table)) {
    if (!voidHand) { m.ending = true; return { match: m, events: [{ t: 'ending', ...now0(m, now) }] }; }
    for (const x of m.table.seats) { x.stack += x.total; x.total = 0; x.bet = 0; }
    Object.assign(m.table, { street: 'done', turn: null, deadline: null, pots: [], runout: false, result: { total: 0, byFold: null, pots: [], voided: true } });
    events.push({ t: 'voided', ...now0(m, now) });
  }
  close(m, events, now);
  return { match: m, events };
}

function close(m, events, now) {
  m.ledger = ledgerOf(m);
  Object.assign(m, { ended: true, ending: false, endAt: now });
  events.push({ t: 'ended', ...now0(m, now), ledger: m.ledger });
}

/** THE LEDGER: per player — everything bought in (rebuys included), the final stack, net = final − bought in. Σ net = 0. */
export function ledgerOf(m) {
  return Object.entries(m.players).map(([id, p]) => {
    const x = seatById(m.table, id);
    const final = p.banked + (x ? x.stack + x.total : 0);
    return { id, buyins: p.buyins, rebuys: p.rebuys, final, net: final - p.buyins, hands: p.hands };
  }).sort((a, b) => b.net - a.net || (a.id < b.id ? -1 : 1));
}

/** Every chip the match holds (stacks + the running pot + what leavers took) vs everything bought in — always equal. */
export function chipCount(m) {
  const onTable = m.table.seats.reduce((n, x) => n + x.stack + x.total, 0);
  const banked = Object.values(m.players).reduce((n, p) => n + p.banked, 0);
  const bought = Object.values(m.players).reduce((n, p) => n + p.buyins, 0);
  return { onTable, banked, bought, ok: onTable + banked === bought };
}

/**
 * THE MATCH SUMMARY (HE2 reports it to /api for XP — the shape only, not wired):
 * { game, v, mode, speed, startAt, endAt, hands, winner, places: [{ id, place, hand, by }] (place 1 first — TOURNAMENT),
 *   ledger: [{ id, buyins, rebuys, final, net, hands }] (CASH), biggestPot: { amount, hand, ids },
 *   notable: [{ hand, kind: 'strong' | 'knockout', … }], players: { id: { hands, won, kos } } }
 */
export function summary(m) {
  const players = {};
  for (const [id, p] of Object.entries(m.players)) players[id] = { hands: p.hands, won: p.won, kos: p.kos };
  return {
    game: 'holdem', v: 1, mode: m.mode, speed: m.speed, startAt: m.startAt, endAt: m.endAt, hands: m.hands,
    winner: m.winner, places: m.mode === 'tournament' ? [...m.places].sort((a, b) => a.place - b.place) : null,
    ledger: m.mode === 'cash' ? (m.ledger || ledgerOf(m)) : null,
    biggestPot: m.biggest, notable: m.notable.slice(), players,
  };
}
