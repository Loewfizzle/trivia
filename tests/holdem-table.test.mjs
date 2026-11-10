// HOLD'EM (HE1) — THE TABLE: one hand start to finish on rigged decks — the action order (incl. HEADS-UP), min bets +
// raises, THE REOPEN RULE, the uncalled bet, the fold-win + SHOW, side pots + splits + the odd chip, the run-out,
// THE PRESETS, THE PRE-ACTIONS, the shot clock + time bank + AWAY, the views, illegal actions never applied.
import test from 'node:test';
import assert from 'node:assert/strict';
import { newDeck } from '../js/games/holdem/cards.js';
import { createTable, startHand, apply, legalActions, preAction, forceFold, seatById, potTotal } from '../js/games/holdem/table.js';
import { buildPots, splitPot } from '../js/games/holdem/pots.js';
import { publicView, seatView } from '../js/games/holdem/views.js';

const H = s => s.split(' ');
/** A deck that deals `holes` (in deal order: left of the button first … the button last) then the board. */
function rig(holes, board = 'Kc Td 4s Jh 3h') {
  const used = new Set([...holes.flatMap(H), ...H(board)]);
  const rest = newDeck().filter(c => !used.has(c));
  const deck = [];
  for (let r = 0; r < 2; r++) for (const h of holes) deck.push(H(h)[r]);
  const b = H(board);
  deck.push(rest.shift(), b[0], b[1], b[2], rest.shift(), b[3], rest.shift(), b[4], ...rest);
  assert.equal(new Set(deck).size, 52, 'a rigged deck is a real deck');
  return deck;
}
/** A table of n seats (ids a, b, c …), the button set so the FIRST hand's button = seat `btn`. */
function table(stacks, { btn = 0, sb = 10, bb = 20, clock = null } = {}) {
  const t = createTable({ seats: stacks.map((stack, i) => ({ id: 'abcdefgh'[i], stack })), sb, bb, clock });
  t.button = (btn - 1 + stacks.length) % stacks.length;   // startHand moves it one seat on
  return t;
}
const chips = t => t.seats.reduce((n, x) => n + x.stack + x.total, 0);
function play(t, steps, now = 0) {
  for (const [id, type, to] of steps) {
    const r = apply(t, { id, type, to }, now);
    assert.equal(r.error, undefined, `${id} ${type} ${to ?? ''}: ${r.error}`);
    t = r.state;
  }
  return t;
}
const turnId = t => t.seats.find(x => x.seat === t.turn)?.id;

test('HEADS-UP: the button posts the small blind, acts first before the flop and last after', () => {
  let t = table([1000, 1000], { btn: 0 });
  const r = startHand(t, { deck: rig(['As Ad', 'Ks Kd']), now: 0 });
  t = r.state;
  assert.equal(t.button, 0);
  assert.equal(t.sbSeat, 0, 'the button is the small blind');
  assert.equal(t.bbSeat, 1);
  assert.equal(seatById(t, 'a').bet, 10);
  assert.equal(seatById(t, 'b').bet, 20);
  assert.equal(turnId(t), 'a', 'the button acts first before the flop');
  assert.deepEqual(r.events.map(e => e.t), ['dealt', 'posted', 'posted']);
  t = play(t, [['a', 'call'], ['b', 'check']]);
  assert.equal(t.street, 'flop');
  assert.equal(turnId(t), 'b', 'the big blind acts first after the flop');
});

test('3+ players: before the flop the seat left of the big blind opens; after it, the seat left of the button', () => {
  let t = table([1000, 1000, 1000, 1000], { btn: 0 });
  t = startHand(t, { deck: rig(['2c 3d', '4c 5d', '6c 7d', '8c 9h']) }).state;
  assert.equal(t.sbSeat, 1); assert.equal(t.bbSeat, 2);
  assert.equal(turnId(t), 'd', 'left of the big blind');
  t = play(t, [['d', 'call'], ['a', 'call'], ['b', 'call']]);
  assert.equal(t.street, 'preflop', 'THE BIG BLIND\'s OPTION');
  assert.equal(turnId(t), 'c');
  const L = legalActions(t);
  assert.ok(L.canCheck && L.canRaise);
  t = play(t, [['c', 'check']]);
  assert.equal(t.street, 'flop');
  assert.equal(turnId(t), 'b', 'left of the button');
  assert.equal(potTotal(t), 80);
  assert.equal(chips(t), 4000);
});

test('min bet = the big blind, min raise = the last full raise; illegal actions are refused + never applied', () => {
  let t = table([1000, 1000, 1000], { btn: 0 });
  t = startHand(t, { deck: rig(['2c 3d', '4c 5d', '6c 7d']) }).state;
  assert.equal(turnId(t), 'a');
  const before = JSON.stringify(t);
  for (const [act, why] of [
    [{ id: 'b', type: 'fold' }, /not your turn/],
    [{ id: 'a', type: 'check' }, /can't check — 20 to call/],
    [{ id: 'a', type: 'raise', to: 30 }, /smallest raise is to 40/],
    [{ id: 'a', type: 'raise', to: 2000 }, /only have 1000/],
    [{ id: 'a', type: 'raise', to: 50.5 }, /whole number/],
    [{ id: 'a', type: 'bet', to: 60 }, /already a bet/],
    [{ id: 'z', type: 'call' }, /not at this table/],
    [{ id: 'a', type: 'dance' }, /unknown action/],
    [{ type: 'timeout' }, /no shot clock/],
    [{ id: 'a', type: 'show' }, /no finished hand/],
  ]) {
    const r = apply(t, act, 0);
    assert.match(r.error, why, JSON.stringify(act));
    assert.equal(r.state, t, 'the same state back');
    assert.deepEqual(r.events, []);
  }
  assert.equal(JSON.stringify(t), before, 'the input state is never changed');
  t = play(t, [['a', 'raise', 60]]);                 // a raise of 40
  assert.equal(legalActions(t).minTo, 100, '60 + the last full raise (40)');
  t = play(t, [['b', 'call'], ['c', 'call']]);
  assert.equal(t.street, 'flop');
  const L = legalActions(t);
  assert.equal(L.kind, 'bet');
  assert.equal(L.minTo, 20, 'the min bet = the big blind');
  assert.match(apply(t, { id: turnId(t), type: 'raise', to: 40 }).error, /no bet to raise/);
  assert.match(apply(t, { id: turnId(t), type: 'call' }).error, /nothing to call/);
});

test('THE REOPEN RULE: a short all-in does not reopen the betting; short all-ins that add up to a full raise do', () => {
  // flop: a bets 100, b all-in 150 (a raise of 50 < 100), c calls → back to a: call or fold only
  let t = table([1000, 170, 1000], { btn: 2 });   // button c → a = sb, b = bb
  t = startHand(t, { deck: rig(['2c 3d', '4c 5d', '6c 7d']) }).state;
  t = play(t, [['c', 'call'], ['a', 'call'], ['b', 'check']]);
  assert.equal(t.street, 'flop');
  assert.equal(turnId(t), 'a');
  t = play(t, [['a', 'bet', 100], ['b', 'allin']]);
  assert.equal(seatById(t, 'b').status, 'allin');
  assert.equal(t.bet, 150);
  let L = legalActions(t);
  assert.equal(L.id, 'c');
  assert.ok(L.canRaise, 'c has not acted — it may raise');
  assert.equal(L.minTo, 250, '150 + the last full raise (100)');
  t = play(t, [['c', 'call']]);
  L = legalActions(t);
  assert.equal(L.id, 'a');
  assert.equal(L.canRaise, false, 'the short all-in does not reopen it for a');
  assert.equal(L.presets.length, 0);
  assert.match(apply(t, { id: 'a', type: 'raise', to: 400 }).error, /not open to you again/);
  assert.match(apply(t, { id: 'a', type: 'allin' }).error, /not open to you again/);
  t = play(t, [['a', 'call']]);
  assert.equal(t.street, 'turn');

  // cumulative: a bets 100, b all-in 150, c all-in 210 → a faces 110 more ≥ 100 → reopened
  let u = table([1000, 170, 230, 1000], { btn: 3 });   // d button → a sb, b bb, c first
  u = startHand(u, { deck: rig(['2c 3d', '4c 5d', '6c 7d', '8c 9d']) }).state;
  u = play(u, [['c', 'call'], ['d', 'call'], ['a', 'call'], ['b', 'check']]);
  u = play(u, [['a', 'bet', 100], ['b', 'allin'], ['c', 'allin']]);
  assert.equal(u.bet, 210);
  u = play(u, [['d', 'call']]);
  L = legalActions(u);
  assert.equal(L.id, 'a');
  assert.ok(L.canRaise, 'two short all-ins = a full raise in all → reopened');
});

test('the uncalled bet is returned; everyone folds → the last player wins without showing; SHOW is optional', () => {
  let t = table([1000, 1000, 1000], { btn: 0 });
  t = startHand(t, { deck: rig(['2c 3d', '4c 5d', 'As Ad']) }).state;   // deal order b, c, a (the button last): a holds AA
  const r = apply(play(t, [['a', 'raise', 300], ['b', 'fold']]), { id: 'c', type: 'fold' }, 5);
  t = r.state;
  assert.equal(t.street, 'done');
  assert.ok(r.events.some(e => e.t === 'returned' && e.id === 'a' && e.amount === 280));
  const pot = r.events.find(e => e.t === 'pot');
  assert.deepEqual(pot.winners, [{ id: 'a', amount: 50 }]);
  assert.equal(seatById(t, 'a').stack, 1030);
  assert.equal(t.result.byFold, 'a');
  assert.ok(!r.events.some(e => e.t === 'shown'), 'nobody shows');
  assert.equal(publicView(t).seats.find(x => x.id === 'a').cards, undefined);
  assert.match(apply(t, { id: 'b', type: 'show' }).error, /only the winner/);
  const s = apply(t, { id: 'a', type: 'show' }, 6);
  assert.equal(s.events[0].t, 'shown');
  assert.deepEqual(s.events[0].cards, ['As', 'Ad']);
  assert.deepEqual(publicView(s.state).seats.find(x => x.id === 'a').cards, ['As', 'Ad']);
  assert.equal(s.events[0].label, 'PAIR OF ACES', 'folded before the flop → the two-card label');
  assert.match(apply(s.state, { id: 'a', type: 'show' }).error, /already shown/);
  assert.equal(chips(t), 3000);
});

test('SIDE POTS: three all-ins of different sizes, each pot to the best eligible hand, the run-out, events', () => {
  // a 100 (best hand), b 300 (second), c 600 (third), d 1000 (worst) — all in before the flop
  let t = table([100, 300, 600, 1000], { btn: 3 });    // d button: a sb, b bb, c first
  t = startHand(t, { deck: rig(['As Ah', 'Ks Kh', 'Qs Qh', '7c 2d'], '3c 8d 9s 4h Jd') }).state;
  const r = [];
  for (const [id, type] of [['c', 'allin'], ['d', 'call'], ['a', 'allin'], ['b', 'allin']]) {
    const x = apply(t, { id, type }, 1);
    assert.equal(x.error, undefined, x.error);
    t = x.state; r.push(...x.events);
  }
  assert.equal(t.street, 'done');
  assert.ok(r.some(e => e.t === 'runout'), 'the board runs out by itself');
  assert.deepEqual(r.filter(e => e.t === 'street').map(e => [e.street, e.runout]), [['flop', true], ['turn', true], ['river', true]]);
  assert.ok(r.some(e => e.t === 'returned' && e.id === 'd' && e.amount === 0) === false);
  const pots = r.filter(e => e.t === 'pot');
  assert.deepEqual(pots.map(p => [p.amount, p.winners.map(w => w.id).join()]), [[400, 'a'], [600, 'b'], [600, 'c']]);
  assert.equal(pots[0].label, 'PAIR OF ACES');
  assert.equal(r.filter(e => e.t === 'shown').length, 4, 'everyone still in shows');
  assert.deepEqual(t.seats.map(x => x.stack), [400, 600, 600, 400]);
  assert.equal(chips(t), 2000);
});

test('ties split; the odd chip goes to the first winner left of the button', () => {
  assert.deepEqual(splitPot(101, ['x', 'y']), [{ id: 'x', amount: 51 }, { id: 'y', amount: 50 }]);
  assert.deepEqual(splitPot(100, ['x', 'y', 'z']), [{ id: 'x', amount: 34 }, { id: 'y', amount: 33 }, { id: 'z', amount: 33 }]);
  // a + c split (the board plays a broadway straight); b folded 15 → the pot is odd
  let t = table([1000, 1000, 1000], { btn: 0, sb: 5, bb: 10 });
  t = startHand(t, { deck: rig(['2c 3d', '4c 5d', '6h 7d'], 'Ts Jd Qc Kh As') }).state;   // left of button = b first
  t = play(t, [['a', 'raise', 25], ['b', 'call'], ['c', 'call']]);
  t = play(t, [['b', 'bet', 20], ['c', 'call'], ['a', 'call']]);   // flop
  t = play(t, [['b', 'bet', 15], ['c', 'call'], ['a', 'fold']]);   // turn — a folds, pot = 75 + 60 + 30 = 165
  const r = apply(play(t, [['b', 'check']]), { id: 'c', type: 'check' });
  const pot = r.events.find(e => e.t === 'pot');
  assert.equal(pot.amount, 165);
  assert.deepEqual(pot.winners, [{ id: 'b', amount: 83 }, { id: 'c', amount: 82 }], 'b is first left of the button (a)');
  assert.equal(pot.label, 'STRAIGHT · ACE HIGH');
});

test('buildPots: folded chips count, ineligible; a pot per all-in level', () => {
  const p = buildPots([
    { id: 'a', total: 50, status: 'allin' }, { id: 'b', total: 200, status: 'folded' },
    { id: 'c', total: 200, status: 'in' }, { id: 'd', total: 120, status: 'allin' },
  ]);
  assert.deepEqual(p, [{ amount: 200, ids: ['a', 'c', 'd'] }, { amount: 210, ids: ['c', 'd'] }, { amount: 160, ids: ['c'] }]);
  assert.equal(p.reduce((n, x) => n + x.amount, 0), 570);
});

test('THE PRESETS: real amounts, rounded to 5s, clamped to legal, duplicates + illegal dropped', () => {
  let t = table([1000, 1000, 1000], { btn: 0 });
  t = startHand(t, { deck: rig(['2c 3d', '4c 5d', '6c 7d']) }).state;
  assert.deepEqual(legalActions(t).presets.map(p => [p.label, p.to]), [['MIN', 40], ['3×', 60], ['ALL IN', 1000]]);
  t = play(t, [['a', 'raise', 70]]);
  assert.deepEqual(legalActions(t).presets.map(p => [p.label, p.to]), [['MIN', 120], ['3×', 210], ['ALL IN', 1000]]);
  t = play(t, [['b', 'call'], ['c', 'call']]);
  // the flop, pot 210, no bet: ½ POT = 105, POT = 210
  assert.deepEqual(legalActions(t).presets.map(p => [p.label, p.to]), [['½ POT', 105], ['POT', 210], ['ALL IN', 930]]);
  t = play(t, [['b', 'bet', 55]]);
  // facing 55 into 265: ½ POT = 55 + (265 + 55) / 2 = 215, POT = 55 + 320 = 375
  assert.deepEqual(legalActions(t).presets.map(p => [p.label, p.to]), [['½ POT', 215], ['POT', 375], ['ALL IN', 930]]);
  // a short stack: the 3× and POT presets are past all in → dropped (ALL IN stays)
  let u = table([1000, 1000, 50], { btn: 1 });       // b button, c sb, a bb → b first? (3 seats: left of bb = b)
  u = startHand(u, { deck: rig(['2c 3d', '4c 5d', '6c 7d']) }).state;
  u = play(u, [[turnId(u), 'raise', 40]]);
  const L = legalActions(u);
  assert.equal(L.id, 'c');
  assert.deepEqual(L.presets.map(p => [p.label, p.to]), [['ALL IN', 50]], 'MIN (80) + 3× (120) are past all in');
  assert.equal(L.minTo, 50, 'a short raise = all in only');
  for (const p of legalActions(t).presets) assert.equal(apply(t, { id: turnId(t), type: p.allin ? 'allin' : 'raise', to: p.to }).error, undefined, p.label);
});

test('THE PRE-ACTIONS: CHECK/FOLD never calls, CALL ANY calls anything, a new street cancels', () => {
  let t = table([1000, 1000, 1000], { btn: 0 });
  t = startHand(t, { deck: rig(['2c 3d', '4c 5d', '6c 7d']) }).state;
  const cf = { kind: 'checkfold', hand: t.hand, street: 'preflop' }, ca = { kind: 'callany', hand: t.hand, street: 'preflop' };
  assert.equal(preAction(t, 'c', cf), null, 'not their turn yet');
  t = play(t, [['a', 'raise', 500]]);
  assert.deepEqual(preAction(t, 'b', cf).action, { id: 'b', type: 'fold' });
  assert.deepEqual(preAction(t, 'b', ca).action, { id: 'b', type: 'call' });
  t = play(t, [['b', 'call'], ['c', 'call']]);
  assert.ok(preAction(t, 'b', ca).cancel, 'the flop cancels a pre-flop toggle');
  const cf2 = { kind: 'checkfold', hand: t.hand, street: 'flop' };
  assert.deepEqual(preAction(t, 'b', cf2).action, { id: 'b', type: 'check' }, 'free → check');
  t = play(t, [['b', 'bet', 500]]);
  assert.deepEqual(preAction(t, 'c', { kind: 'callany', hand: t.hand, street: 'flop' }).action, { id: 'c', type: 'call' }, 'all in to call is still a call');
});

test('THE SHOT CLOCK: 20 s, then the 30 s time bank, then check-if-free else fold; two in a row → AWAY; back', () => {
  let t = table([1000, 1000, 1000], { btn: 0, clock: true });
  t = startHand(t, { deck: rig(['2c 3d', '4c 5d', '6c 7d']), now: 1000 }).state;
  assert.equal(t.deadline, 21000);
  assert.match(apply(t, { type: 'timeout' }, 20999).error, /not run out/);
  let r = apply(t, { type: 'timeout' }, 21000);
  assert.equal(r.events[0].t, 'timebank');
  t = r.state;
  assert.equal(t.deadline, 51000);
  // a acts 10 s into the bank → 20 s of bank left
  t = play(t, [['a', 'call']], 31000);
  assert.equal(seatById(t, 'a').bank, 20000);
  assert.equal(t.deadline, 51000, 'the next turn: now + 20 s');
  // b: the bank, then a timeout → fold? no — b (small blind) faces 10 → fold
  t = apply(t, { type: 'timeout' }, 51000).state;
  r = apply(t, { type: 'timeout' }, 81000);
  assert.deepEqual(r.events.slice(0, 2).map(e => [e.t, e.action]), [['timeout', 'fold'], ['folded', undefined]]);
  t = r.state;
  assert.equal(seatById(t, 'b').bank, 0);
  // c (big blind) is free → the timeout CHECKS (c has its bank; spend it)
  t = apply(t, { type: 'timeout' }, 101000).state;
  r = apply(t, { type: 'timeout' }, 131000);
  assert.equal(r.events[0].action, 'check');
  t = r.state;
  assert.equal(t.street, 'flop');
  // the flop: c first → no bank left → a second timeout in a row → AWAY
  assert.equal(turnId(t), 'c');
  r = apply(t, { type: 'timeout' }, t.deadline);
  assert.ok(r.events.some(e => e.t === 'away' && e.id === 'c'));
  t = r.state;
  // a bets; c is AWAY → folds at once, the hand ends (b folded) without a clock
  r = apply(t, { id: 'a', type: 'bet', to: 40 }, t.deadline - 5000);
  assert.ok(r.events.some(e => e.t === 'folded' && e.id === 'c' && e.away));
  t = r.state;
  assert.equal(t.street, 'done');
  // c is back
  assert.match(apply(t, { id: 'a', type: 'back' }).error, /not away/);
  t = apply(t, { id: 'c', type: 'back' }).state;
  assert.equal(seatById(t, 'c').away, false);
  // AWAY players still post their blinds + are dealt in
  t = apply(t, { id: 'b', type: 'back' }).state;
});

test('forceFold (a player leaving mid-hand) — out of turn, the hand goes on; the last one left wins', () => {
  let t = table([1000, 1000, 1000], { btn: 0 });
  t = startHand(t, { deck: rig(['2c 3d', '4c 5d', '6c 7d']) }).state;
  t = forceFold(t, 'c').state;
  assert.equal(seatById(t, 'c').status, 'folded');
  assert.equal(turnId(t), 'a', 'still a\'s turn');
  t = forceFold(t, 'a').state;
  assert.equal(t.street, 'done');
  assert.equal(t.result.byFold, 'b');
  assert.equal(seatById(t, 'b').stack, 1020);
});

test('the views: publicView never holds an unshown card or the deck; seatView adds only your own', () => {
  let t = table([1000, 1000, 1000], { btn: 0 });
  t = startHand(t, { deck: rig(['2c 3d', '4c 5d', '6c 7d']) }).state;
  const v = publicView(t);
  const flat = JSON.stringify(v);
  for (const c of ['2c', '3d', '4c', '5d', '6c', '7d']) assert.ok(!flat.includes(`"${c}"`), c);
  assert.equal(v.deck, undefined);
  assert.equal(v.deckLeft, 52 - 6);
  assert.ok(v.seats.every(x => x.held));
  const mine = seatView(t, 'b');
  assert.deepEqual(mine.mine, ['2c', '3d'], 'b is dealt first (left of the button)');
  assert.ok(!JSON.stringify(mine).includes('"4c"'));
  assert.equal(legalActions(v).id, 'a', 'legalActions runs on a public view');
});

test('a short big blind: the others still call the full big blind; the short stack can only win what it matched', () => {
  let t = table([1000, 1000, 15], { btn: 0 });        // c = bb with 15
  const r = startHand(t, { deck: rig(['2c 3d', '4c 5d', 'As Ad']) });
  t = r.state;
  assert.ok(r.events.some(e => e.t === 'posted' && e.id === 'c' && e.amount === 15 && e.allin));
  assert.equal(t.bet, 20);
  assert.equal(legalActions(t).toCall, 20);
  t = play(t, [['a', 'call'], ['b', 'call']]);
  assert.equal(t.street, 'flop');
  assert.deepEqual(t.pots, [{ amount: 45, ids: ['a', 'b', 'c'] }, { amount: 10, ids: ['a', 'b'] }]);
});
