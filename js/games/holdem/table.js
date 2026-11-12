// HOLD'EM — THE TABLE (HE1, pure): ONE HAND of no-limit Texas Hold'em, start to finish, as a reducer.
//   startHand(state, { rng | deck, now, sb?, bb? }) → { state, events, error? }   the button moves, blinds post, cards deal
//   apply(state, action, now)                       → { state, events, error? }   one player action (or the clock's)
//   legalActions(state)                             → what the player to act may do, + THE PRESETS (real amounts)
// HE2 — THE STEP RUN-OUT (`stepRunout: true` — the server dealer's tables): when betting is over with players all in, the live
// hands are turned up (`shown … runout`) and the board then comes ONE STREET per `{ type: 'deal' }` (the dealer's own action,
// on a poke after the reveal time) — the river's deal settles the showdown. Off (HE1, the sims' default): the whole run-out
// deals inside the action that ended the betting.
// The state is plain JSON (it lives in the database in HE2); the input state is never changed. An illegal action
// comes back with `error` (a plain sentence) and the SAME state. No clock, no Math.random: `now` + an injected rng.
// The deck + every unshown hole card are SERVER-ONLY — a phone gets views.js#publicView / seatView, never this.
import { shuffleDeck, cardInt } from './cards.js';
import { scoreInts, evaluate, bestFive, holeLabel } from './rank.js';
import { buildPots, splitPot } from './pots.js';
import { SHOT_MS, BANK_MS, AWAY_AFTER, MAX_SEATS } from './structure.js';

export const STREETS = ['preflop', 'flop', 'turn', 'river'];
export const LOG_MAX = 300;
const LIVE = s => s.status === 'in' || s.status === 'allin';
const CAN_ACT = s => s.status === 'in';
const copy = s => JSON.parse(JSON.stringify(s));
const fail = (state, error) => ({ state, events: [], error });

/** A fresh seat. status: 'in' | 'folded' | 'allin' | 'out' (no chips / left) | 'sitout' (seated, dealt in next hand). */
export function newSeat({ id, seat, stack }, clock) {
  return {
    id: String(id), seat, stack, status: 'sitout', cards: [], bet: 0, total: 0, start: stack,
    acted: false, actedAt: 0, shown: false, bank: clock ? clock.bank : 0, timeouts: 0, away: false,
  };
}

/**
 * A table. seats: [{ id, seat? (0–7), stack }]; clock: null (no timer) or { shot, bank } in ms (`true` = the house clock:
 * 20 s + a 30 s bank — both modes since HE2). awaySitsOut (CASH — HE2): an AWAY seat is SAT OUT from the next deal
 * (not dealt in, no blinds) until it is back; otherwise (a TOURNAMENT) it is dealt in + auto checks / folds.
 */
export function createTable({ seats, sb, bb, clock = null, awaySitsOut = false, stepRunout = false }) {
  if (!Array.isArray(seats) || seats.length > MAX_SEATS) throw new Error(`1–${MAX_SEATS} seats`);
  const ck = clock === true ? { shot: SHOT_MS, bank: BANK_MS } : clock;
  const list = seats.map((p, i) => newSeat({ id: p.id, seat: p.seat ?? i, stack: p.stack }, ck)).sort((a, b) => a.seat - b.seat);
  if (new Set(list.map(s => s.seat)).size !== list.length || new Set(list.map(s => s.id)).size !== list.length) throw new Error('seats + ids must be unique');
  return {
    v: 1, hand: 0, street: 'idle', sb, bb, button: null, sbSeat: null, bbSeat: null,
    seats: list, board: [], deck: [], bet: 0, minRaise: bb, turn: null, deadline: null, bankOn: false, bankFrom: null,
    clock: ck || null, awaySitsOut: !!awaySitsOut, stepRunout: !!stepRunout, runout: false, pots: [], result: null, log: [],
  };
}

export const running = s => STREETS.includes(s.street);
export const seatById = (s, id) => s.seats.find(x => x.id === String(id));
export const seatAt = (s, n) => s.seats.find(x => x.seat === n);
export const potTotal = s => s.seats.reduce((n, x) => n + x.total, 0);

/** Seats clockwise starting AFTER seat number `from` (wrapping), filtered. */
export function clockwise(s, from, pred = () => true) {
  const list = s.seats, i = list.findIndex(x => x.seat > from);
  const k = i < 0 ? 0 : i;
  return [...list.slice(k), ...list.slice(0, k)].filter(pred);
}

function emit(s, events, now, e) {
  const ev = { t: e.t, hand: s.hand, at: now, ...e };
  events.push(ev);
  s.log.push(ev);
  if (s.log.length > LOG_MAX) s.log.splice(0, s.log.length - LOG_MAX);
}

// ------------------------------------------------------------------------------------------------ the deal
export function startHand(state, { rng, deck, now = 0, sb, bb } = {}) {
  if (running(state)) return fail(state, 'a hand is already running');
  const s = copy(state);
  if (sb != null) s.sb = sb;
  if (bb != null) s.bb = bb;
  for (const x of s.seats) {
    Object.assign(x, { cards: [], bet: 0, total: 0, start: x.stack, acted: false, actedAt: 0, shown: false });
    x.status = x.left || x.stack <= 0 ? 'out' : s.awaySitsOut && x.away ? 'sitout' : 'in';   // (HE2 — CASH: AWAY = SAT OUT)
  }
  const dealt = s.seats.filter(CAN_ACT);
  if (dealt.length < 2) return fail(state, 'two players with chips are needed to deal');
  if (!deck && typeof rng !== 'function') return fail(state, 'the deal needs a deck or an rng');
  s.hand += 1;
  Object.assign(s, { board: [], pots: [], result: null, log: [], bankOn: false, bankFrom: null, runout: false });
  const events = [];
  // THE BUTTON: the first hand = a random dealt-in seat (rng) or the first; then the next dealt-in seat clockwise.
  if (s.button == null) s.button = (rng ? dealt[Math.floor(rng() * dealt.length)] : dealt[0]).seat;
  else s.button = clockwise(s, s.button, CAN_ACT)[0].seat;
  const order = clockwise(s, s.button, CAN_ACT);     // left of the button … the button last
  if (dealt.length === 2) { s.sbSeat = s.button; s.bbSeat = order[0].seat; }   // HEADS-UP: the button posts the small blind
  else { s.sbSeat = order[0].seat; s.bbSeat = order[1].seat; }
  s.deck = deck ? deck.slice() : shuffleDeck(rng);
  for (let r = 0; r < 2; r++) for (const x of order) x.cards.push(s.deck.shift());
  s.street = 'preflop';
  emit(s, events, now, { t: 'dealt', ids: order.map(x => x.id), button: seatAt(s, s.button).id, sb: s.sb, bb: s.bb, heads: dealt.length === 2 });
  post(s, events, now, seatAt(s, s.sbSeat), s.sb, 'small');
  post(s, events, now, seatAt(s, s.bbSeat), s.bb, 'big');
  s.bet = s.bb;   // (a short big blind: the others still call the FULL big blind — HE1's rule; HE11's lone-seat close is in progress())
  s.minRaise = s.bb;
  progress(s, events, now, s.bbSeat);
  return { state: s, events };
}

function post(s, events, now, x, amount, blind) {
  const amt = Math.min(amount, x.stack);
  x.stack -= amt; x.bet += amt; x.total += amt;
  if (x.stack === 0) x.status = 'allin';
  emit(s, events, now, { t: 'posted', id: x.id, blind, amount: amt, allin: x.stack === 0 });
}

// ------------------------------------------------------------------------------------------------ the rules
const needsAct = (s, x) => x.status === 'in' && (!x.acted || x.bet < s.bet);
const raiseBase = s => (s.bet === 0 ? 0 : Math.max(s.bet, s.bb));
const minRaiseTo = s => (s.bet === 0 ? s.bb : raiseBase(s) + s.minRaise);

/**
 * What the player to act may do — read from PUBLIC fields only, so a phone can run it on its own view.
 * { id, seat, toCall, canCheck, callAmount, callAllIn, canRaise, kind: 'bet'|'raise', minTo, maxTo, presets, deadline }
 * Amounts are "raise TO" (the seat's total bet this street). A short stack's only raise is ALL IN (minTo = maxTo).
 */
export function legalActions(s) {
  if (!running(s) || s.turn == null) return null;
  const x = seatAt(s, s.turn);
  if (!x || x.status !== 'in') return null;
  const toCall = Math.max(0, s.bet - x.bet);
  const maxTo = x.bet + x.stack;
  const others = s.seats.some(o => o !== x && o.status === 'in');
  // THE REOPEN RULE: a player who already acted may raise again only when facing at least one FULL raise since
  // (an all-in short of a full raise — or several that add up to less — never reopens the betting for them).
  const reopened = !x.acted || s.bet - x.actedAt >= s.minRaise;
  const canRaise = x.stack > toCall && others && reopened;
  const minTo = canRaise ? Math.min(minRaiseTo(s), maxTo) : 0;
  const out = {
    id: x.id, seat: x.seat, toCall, canCheck: toCall === 0, callAmount: Math.min(toCall, x.stack), callAllIn: toCall > 0 && x.stack <= toCall,
    canRaise, kind: s.bet === 0 ? 'bet' : 'raise', minTo, maxTo: canRaise ? maxTo : 0, deadline: s.deadline,
    presets: [],
  };
  if (canRaise) out.presets = presets(s, x, out);
  return out;
}

const s_othersIn = (s, x) => s.seats.some(o => o.id !== x.id && o.status === 'in');
const round5 = n => Math.round(n / 5) * 5;

/**
 * THE PRE-ACTIONS (the toggles a player sets before their turn): pre = { kind: 'checkfold' | 'check' | 'callany', hand, street }
 * (hand + street = when it was set). When the turn comes → { action } to apply; a new hand or street → { cancel }.
 * CHECK/FOLD checks when it's free, else folds — it NEVER calls. CHECK (HE10 — Ben's A1: a TRUE check) checks when it's free and
 * CANCELS ITSELF the moment anyone bets (it never calls, never folds — preVoid). CALL ANY calls whatever the bet is (all in
 * included), or checks when it's free. Not their turn yet → null.
 */
export function preAction(s, id, pre) {
  if (!pre || !running(s)) return { cancel: 'no hand is running' };
  if (pre.hand !== s.hand || pre.street !== s.street) return { cancel: 'a new street' };
  if (preVoid(s, id, pre)) return { cancel: 'a bet came in' };
  const L = legalActions(s);
  if (!L || L.id !== String(id)) return null;
  if (pre.kind === 'checkfold') return { action: { id: L.id, type: L.canCheck ? 'check' : 'fold' } };
  if (pre.kind === 'check') return L.canCheck ? { action: { id: L.id, type: 'check' } } : { cancel: 'a bet came in' };
  if (pre.kind === 'callany') return { action: { id: L.id, type: L.canCheck ? 'check' : 'call' } };
  return { cancel: `unknown pre-action: ${pre.kind}` };
}

/** HE10 (A1): a queued TRUE CHECK no longer fits — someone bet since (the seat faces a bet now). The dealer drops it at once. */
export function preVoid(s, id, pre) {
  if (!pre || pre.kind !== 'check' || !running(s)) return false;
  const x = seatById(s, id);
  return !!x && x.bet < s.bet;
}

/** THE PRESETS: before the flop MIN · 3× · ALL IN, after it ½ POT · POT · ALL IN — clamped, rounded to 5s, deduped. */
function presets(s, x, L) {
  const pot = potTotal(s), call = L.toCall;
  const want = s.street === 'preflop'
    ? [{ key: 'min', label: 'MIN', to: L.minTo, exact: true }, { key: 'x3', label: '3×', to: 3 * s.bet }]
    : [{ key: 'half', label: '½ POT', to: s.bet + (pot + call) / 2 }, { key: 'pot', label: 'POT', to: s.bet + pot + call }];
  const list = [];
  for (const p of want) {
    let to = p.exact ? p.to : Math.max(L.minTo, round5(p.to));
    to = Math.min(Math.floor(to), L.maxTo);
    if (to >= L.maxTo || to < L.minTo) continue;                 // = ALL IN, or not legal
    if (list.some(q => q.to === to)) continue;
    list.push({ key: p.key, label: p.label, to });
  }
  list.push({ key: 'allin', label: 'ALL IN', to: L.maxTo, allin: true });
  return list;
}

// ------------------------------------------------------------------------------------------------ actions
/**
 * action: { id, type, to? } — type 'fold' | 'check' | 'call' | 'bet' | 'raise' (to = the total to bet this street)
 * | 'allin' | 'timeout' (the clock ran out — no id needed) | 'show' (the winner of a hand everyone folded to)
 * | 'deal' (HE2 — the dealer's next run-out street on a `stepRunout` table; no id) | 'back' (an AWAY player is back — in CASH a SAT OUT one is dealt in again from the next hand: SIT BACK)
 * | 'away' (HE10 — the dealer's own: that seat's player left the room / was kicked — AWAY at once).
 * Every action is the acting seat's OWN (HE2: nobody — the host included — acts, folds or sits out for another player).
 */
export function apply(state, action, now = 0) {
  const a = action || {};
  const type = a.type;
  if (type === 'back') {
    const x = seatById(state, a.id);
    if (!x) return fail(state, 'that player is not at this table');
    if (!x.away && !x.timeouts) return fail(state, 'that player is not away');
    const s = copy(state), y = seatById(s, a.id), events = [];
    y.away = false; y.timeouts = 0;
    emit(s, events, now, { t: 'back', id: y.id });
    return { state: s, events };
  }
  if (type === 'show') return show(state, a.id, now);
  if (type === 'away') return goneAway(state, a.id, now);
  if (!running(state)) return fail(state, 'no hand is running');
  if (type === 'deal') return dealNext(state, now);
  if (type === 'timeout') return timeout(state, now);
  const x = seatById(state, a.id);
  if (!x) return fail(state, 'that player is not at this table');
  if (state.turn !== x.seat) return fail(state, 'it is not your turn');
  const L = legalActions(state);
  let kind, to = 0;
  switch (type) {
    case 'fold': kind = 'fold'; break;
    case 'check':
      if (!L.canCheck) return fail(state, `you can't check — ${L.toCall} to call`);
      kind = 'check'; break;
    case 'call':
      if (L.toCall === 0) return fail(state, 'there is nothing to call — check instead');
      kind = 'call'; break;
    case 'bet': case 'raise': {
      if (type === 'bet' && state.bet > 0) return fail(state, 'there is already a bet — raise instead');
      if (type === 'raise' && state.bet === 0) return fail(state, 'there is no bet to raise — bet instead');
      if (!L.canRaise) return fail(state, x.stack <= L.toCall ? 'you only have enough to call'
        : !s_othersIn(state, x) ? 'everyone else is all in — call or fold' : 'the betting is not open to you again — call or fold');
      to = Number(a.to);
      if (!Number.isInteger(to)) return fail(state, 'the amount must be a whole number of chips');
      if (to > L.maxTo) return fail(state, `you only have ${L.maxTo} in all`);
      if (to < L.minTo) return fail(state, `the smallest ${L.kind} is to ${L.minTo}`);
      kind = 'raise'; break;
    }
    case 'allin':
      if (x.stack <= L.toCall) { kind = 'call'; break; }       // all in to call (or for less)
      if (!L.canRaise) return fail(state, 'the betting is not open to you again — call or fold');
      kind = 'raise'; to = L.maxTo; break;
    default: return fail(state, `unknown action: ${type}`);
  }
  const s = copy(state), y = seatById(s, x.id), events = [];
  if (s.bankOn) y.bank = Math.max(0, y.bank - Math.max(0, now - s.bankFrom));
  y.timeouts = 0;
  if (y.away) { y.away = false; emit(s, events, now, { t: 'back', id: y.id }); }
  act(s, events, now, y, kind, to);
  progress(s, events, now, y.seat);
  return { state: s, events };
}

function act(s, events, now, x, kind, to, extra = {}) {
  x.acted = true;
  if (kind === 'fold') {
    x.status = 'folded';
    emit(s, events, now, { t: 'folded', id: x.id, ...extra });
  } else if (kind === 'check') {
    x.actedAt = s.bet;
    emit(s, events, now, { t: 'checked', id: x.id, ...extra });
  } else if (kind === 'call') {
    const amt = Math.min(s.bet - x.bet, x.stack);
    x.stack -= amt; x.bet += amt; x.total += amt; x.actedAt = s.bet;
    if (x.stack === 0) { x.status = 'allin'; emit(s, events, now, { t: 'allin', id: x.id, kind: 'call', amount: amt, to: x.bet }); }
    else emit(s, events, now, { t: 'called', id: x.id, amount: amt, to: x.bet });
  } else {
    const opening = s.bet === 0, base = raiseBase(s);
    const full = to >= minRaiseTo(s);
    const amt = to - x.bet;
    x.stack -= amt; x.bet = to; x.total += amt;
    if (full) s.minRaise = to - base;
    s.bet = Math.max(s.bet, to);
    x.actedAt = s.bet;
    const k = opening ? 'bet' : 'raise';
    if (x.stack === 0) { x.status = 'allin'; emit(s, events, now, { t: 'allin', id: x.id, kind: k, amount: amt, to, full }); }
    else emit(s, events, now, { t: opening ? 'bet' : 'raised', id: x.id, amount: amt, to, full });
  }
}

/** The clock ran out on the player to act: the time bank first (once), then CHECK if free else FOLD; 2 in a row → AWAY. */
function timeout(state, now) {
  if (!state.clock) return fail(state, 'this game has no shot clock');
  if (state.turn == null) return fail(state, 'nobody is to act');
  if (now < state.deadline) return fail(state, 'the clock has not run out');
  const s = copy(state), x = seatAt(s, s.turn), events = [];
  if (!s.bankOn && x.bank > 0 && !x.away) {
    s.bankOn = true; s.bankFrom = s.deadline; s.deadline = s.deadline + x.bank;
    emit(s, events, now, { t: 'timebank', id: x.id, ms: x.bank, until: s.deadline });
    return { state: s, events };
  }
  if (s.bankOn) x.bank = 0;
  x.timeouts += 1;
  const kind = x.bet >= s.bet ? 'check' : 'fold';
  emit(s, events, now, { t: 'timeout', id: x.id, action: kind });
  if (x.timeouts >= AWAY_AFTER && !x.away) { x.away = true; emit(s, events, now, { t: 'away', id: x.id }); }
  act(s, events, now, x, kind, 0, { auto: true });
  progress(s, events, now, x.seat);
  return { state: s, events };
}

/**
 * HE10 (A15) — GONE: the DEALER's own action ({ type: 'away', id }) for a seat whose player left the room or was kicked — AWAY at once
 * (no 20 s clock + time bank to wait out): on their turn they check or fold now, and from then on as every AWAY seat (a TOURNAMENT:
 * dealt in + auto check / fold; CASH: SAT OUT from the next deal). 'back' (their own tap, once they're in the room again) undoes it.
 */
function goneAway(state, id, now) {
  const x = seatById(state, id);
  if (!x) return fail(state, 'that player is not at this table');
  if (x.away) return fail(state, 'already away');
  const s = copy(state), y = seatById(s, id), events = [];
  y.away = true;
  emit(s, events, now, { t: 'away', id: y.id, gone: true });
  if (running(s) && !s.runout && s.turn === y.seat && y.status === 'in') {
    act(s, events, now, y, y.bet >= s.bet ? 'check' : 'fold', 0, { auto: true, away: true });
    progress(s, events, now, y.seat);
  }
  return { state: s, events };
}

/** SHOW: the winner of a hand everyone folded to may turn their cards up (optional) until the next deal. */
function show(state, id, now) {
  if (state.street !== 'done' || !state.result) return fail(state, 'there is no finished hand to show');
  const x = seatById(state, id);
  if (!x) return fail(state, 'that player is not at this table');
  if (state.result.byFold !== x.id) return fail(state, 'only the winner of a hand everyone folded to may show');
  if (x.shown) return fail(state, 'already shown');
  const s = copy(state), y = seatById(s, id), events = [];
  y.shown = true;
  emit(s, events, now, { t: 'shown', id: y.id, cards: y.cards.slice(), label: s.board.length ? evaluate([...y.cards, ...s.board]).label : holeLabel(y.cards), byChoice: true });
  return { state: s, events };
}

/**
 * Fold a player OUT OF TURN (CASH: they left the table mid-hand). A player all in can't fold — they stay in
 * the hand to its end. Returns { state, events } (unchanged state when there was nothing to fold).
 */
export function forceFold(state, id, now = 0) {
  const x = seatById(state, id);
  // (HE2 — a STEP RUN-OUT: the betting is over and the hands are face up; a leaver stays in to the hand's end, like an all in)
  if (!running(state) || !x || x.status !== 'in' || state.runout) return { state, events: [] };
  const s = copy(state), y = seatById(s, id), events = [];
  const wasTurn = s.turn === y.seat;
  act(s, events, now, y, 'fold', 0, { left: true });
  progress(s, events, now, wasTurn ? y.seat : null);
  return { state: s, events };
}

// ------------------------------------------------------------------------------------------------ the flow
/** After an action (or a deal): end the hand, close the street, or hand the turn on (AWAY seats act at once). */
function progress(s, events, now, from) {
  for (let guard = 0; guard < 64; guard++) {
    const live = s.seats.filter(LIVE);
    if (live.length === 1) return winByFold(s, events, now, live[0]);
    const canAct = s.seats.filter(CAN_ACT);
    const need = canAct.filter(x => needsAct(s, x));
    // HE11 (FR7-B's NICE): ONE seat left who can act, already covering every other live seat's bet (they're all in — e.g. a big blind all in
    // for LESS than the small blind, heads-up) has nobody to match: the street closes, never a FOLD that forfeits a pot it already covered.
    // (With another seat still to act the full big blind stands — HE1's rule.)
    if (need.length === 0 || (canAct.length === 1 && canAct[0].bet >= Math.min(s.bet, Math.max(0, ...live.filter(x => x !== canAct[0]).map(x => x.bet))))) {
      if (closeStreet(s, events, now) === 'over') return;
      from = s.button;
      continue;
    }
    const cur = s.turn != null ? seatAt(s, s.turn) : null;
    const next = from == null && cur && needsAct(s, cur) ? cur : clockwise(s, from ?? s.turn, x => needsAct(s, x))[0];
    if (next.seat !== s.turn || from != null) setTurn(s, next, now);
    if (!next.away) return;
    // AWAY: they check or fold at once (they still post their blinds) until they act again ('back')
    act(s, events, now, next, next.bet >= s.bet ? 'check' : 'fold', 0, { auto: true, away: true });
    from = next.seat;
  }
  throw new Error('holdem: progress did not settle');
}

function setTurn(s, x, now) {
  s.turn = x.seat;
  s.bankOn = false; s.bankFrom = null;
  s.deadline = s.clock ? now + s.clock.shot : null;
}

/** An uncalled bet goes back: a LIVE player's contribution above everyone else's (a folded seat's chips stay in — dead). */
function returnUncalled(s, events, now) {
  const tops = [...s.seats].sort((a, b) => b.total - a.total);
  if (tops.length < 2 || tops[0].total === tops[1].total || !LIVE(tops[0])) return;
  const x = tops[0], back = x.total - tops[1].total;
  x.total -= back; x.bet = Math.max(0, x.bet - back); x.stack += back;
  if (x.status === 'allin' && x.stack > 0) x.status = 'in';
  emit(s, events, now, { t: 'returned', id: x.id, amount: back });
}

function closeStreet(s, events, now) {
  returnUncalled(s, events, now);
  for (const x of s.seats) { x.bet = 0; if (x.status === 'in') { x.acted = false; x.actedAt = 0; } }
  Object.assign(s, { bet: 0, minRaise: s.bb, turn: null, deadline: null, bankOn: false, bankFrom: null });
  s.pots = buildPots(s.seats);
  if (s.street === 'river') { showdown(s, events, now); return 'over'; }
  if (s.seats.filter(CAN_ACT).length <= 1) {                    // betting is over: RUN IT OUT
    emit(s, events, now, { t: 'runout', from: s.street, ids: s.seats.filter(LIVE).map(x => x.id) });
    if (s.stepRunout) {                                           // HE2: the hands face up now, the board a street per 'deal'
      s.runout = true;
      for (const x of clockwise(s, s.button, LIVE)) {
        x.shown = true;
        const lab = s.board.length >= 3 ? evaluate([...x.cards, ...s.board]) : { label: holeLabel(x.cards) };
        emit(s, events, now, { t: 'shown', id: x.id, cards: x.cards.slice(), label: lab.label, ...(lab.cat != null ? { short: lab.short, cat: lab.cat } : {}), runout: true });
      }
      return 'over';
    }
    while (s.street !== 'river') deal(s, events, now, true);
    showdown(s, events, now);
    return 'over';
  }
  deal(s, events, now, false);
  return 'next';
}

/** HE2 — THE STEP RUN-OUT: the dealer's next street (the river's deal settles the showdown). */
function dealNext(state, now) {
  if (!state.runout) return fail(state, 'there is no run-out to deal');
  const s = copy(state), events = [];
  deal(s, events, now, true);
  if (s.street === 'river') { s.runout = false; showdown(s, events, now); }
  return { state: s, events };
}

function deal(s, events, now, runout) {
  const street = STREETS[STREETS.indexOf(s.street) + 1];
  s.deck.shift();                                               // the burn card
  const n = street === 'flop' ? 3 : 1, cards = s.deck.splice(0, n);
  s.board.push(...cards);
  s.street = street;
  emit(s, events, now, { t: 'street', street, cards, board: s.board.slice(), runout });
}

function finish(s, result) {
  for (const x of s.seats) { x.bet = 0; x.total = 0; }
  Object.assign(s, { street: 'done', turn: null, deadline: null, bankOn: false, bankFrom: null, pots: [], result, runout: false });
}

function winByFold(s, events, now, w) {
  returnUncalled(s, events, now);
  const total = potTotal(s);
  w.stack += total;
  emit(s, events, now, { t: 'pot', pot: 0, amount: total, winners: [{ id: w.id, amount: total }], byFold: true });
  finish(s, { total, byFold: w.id, pots: [{ amount: total, winners: [{ id: w.id, amount: total }], ids: [w.id] }] });
}

function showdown(s, events, now) {
  const order = clockwise(s, s.button, LIVE);                   // shown + the odd chip: from the first seat left of the button
  const score = {};
  for (const x of order) {
    const seven = [...x.cards, ...s.board];
    score[x.id] = scoreInts(seven.map(cardInt));
    // (HE10 — A4 / A6: a hand the run-out already turned up is NOT shown again — no second flip, no second sting, and an 8-way all-in's
    //  river fits the event feed; the hands' final names are the table's own `result` + the cards on the board)
    if (x.shown) continue;
    x.shown = true;
    const e = evaluate(seven);
    emit(s, events, now, { t: 'shown', id: x.id, cards: x.cards.slice(), label: e.label, short: e.short, cat: e.cat, best: bestFive(seven) });
  }
  const pots = buildPots(s.seats), out = [];
  let total = 0;
  pots.forEach((p, i) => {
    const elig = order.filter(x => p.ids.includes(x.id));
    const top = Math.max(...elig.map(x => score[x.id]));
    const winners = splitPot(p.amount, elig.filter(x => score[x.id] === top).map(x => x.id));
    for (const w of winners) seatById(s, w.id).stack += w.amount;
    const e = evaluate([...seatById(s, winners[0].id).cards, ...s.board]);
    const row = { amount: p.amount, ids: p.ids, winners, label: elig.length > 1 ? e.label : null, cat: e.cat };
    out.push(row);
    total += p.amount;
    emit(s, events, now, { t: 'pot', pot: i, side: i > 0, amount: p.amount, winners, label: row.label, cat: e.cat, ids: p.ids });
  });
  finish(s, { total, byFold: null, pots: out });
}
