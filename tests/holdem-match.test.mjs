// HOLD'EM (HE1) — THE MATCH: the structure (stacks, THE BLIND LADDER, the level clock), TOURNAMENT busts + places
// (simultaneous busts, shared places, KOs) + the switch to heads-up, CASH (rebuy, late join, leave, END SESSION,
// THE LEDGER — Σ net = 0), the summary shape.
import test from 'node:test';
import assert from 'node:assert/strict';
import { newDeck } from '../js/games/holdem/cards.js';
import { LADDER, SPEEDS, CASH, blindsAt, levelAt, SHOT_MS, BANK_MS, BANK_REFILL_MS } from '../js/games/holdem/structure.js';
import { createMatch, nextHand, act, rebuy, join, leave, endSession, chipCount, summary, ledgerOf, blindsFor, sitBack } from '../js/games/holdem/match.js';
import { legalActions, running, seatById } from '../js/games/holdem/table.js';
import { rngFrom } from '../js/core/rng.js';

const H = s => s.split(' ');
function rig(holes, board) {
  const used = new Set([...holes.flatMap(H), ...H(board)]);
  const rest = newDeck().filter(c => !used.has(c));
  const deck = [];
  for (let r = 0; r < 2; r++) for (const h of holes) deck.push(H(h)[r]);
  const b = H(board);
  deck.push(rest.shift(), b[0], b[1], b[2], rest.shift(), b[3], rest.shift(), b[4], ...rest);
  return deck;
}
const ok = r => { assert.equal(r.error, undefined, r.error); return r.match; };
const turnId = m => m.table.seats.find(x => x.seat === m.table.turn)?.id;
/** Everyone left to act goes all in (or calls it) until the hand ends. */
function shoveAll(m, now = 0) {
  while (running(m.table)) {
    const L = legalActions(m.table);
    m = ok(act(m, { id: L.id, type: L.canRaise ? 'allin' : L.canCheck ? 'check' : 'call' }, now));
  }
  return m;
}

test('THE STRUCTURE: the ladder, then ×2 a level; the stacks + level times; CASH 1,000 at 5/10', () => {
  assert.equal(LADDER.length, 16);
  assert.deepEqual(blindsAt(0), { sb: 10, bb: 20 });
  assert.deepEqual(blindsAt(9), { sb: 500, bb: 1000 });
  assert.deepEqual(blindsAt(15), { sb: 5000, bb: 10000 });
  assert.deepEqual(blindsAt(16), { sb: 10000, bb: 20000 });
  assert.deepEqual(blindsAt(17), { sb: 20000, bb: 40000 });
  assert.deepEqual([SPEEDS.turbo.stack, SPEEDS.standard.stack, SPEEDS.deep.stack], [1500, 1500, 3000]);
  assert.deepEqual([SPEEDS.turbo.levelMs, SPEEDS.standard.levelMs, SPEEDS.deep.levelMs], [90000, 360000, 900000], 'HE2: DEEP 15 min');
  assert.deepEqual(CASH, { stack: 1000, sb: 5, bb: 10, rebuy: 1000 });
  assert.equal(levelAt(1000, 1000 + SPEEDS.turbo.levelMs * 3 - 1, SPEEDS.turbo.levelMs), 2);
  assert.equal(levelAt(1000, 1000 + SPEEDS.turbo.levelMs * 3, SPEEDS.turbo.levelMs), 3);
});

test('TOURNAMENT: a new level applies from the NEXT hand, never mid-hand', () => {
  const lv = SPEEDS.standard.levelMs;
  let m = createMatch({ mode: 'tournament', speed: 'standard', players: ['a', 'b', 'c'], now: 0 });
  assert.equal(m.table.seats[0].stack, 1500);
  m = ok(nextHand(m, { rng: rngFrom('lv'), now: lv - 1 }));
  assert.equal(m.table.bb, 20);
  // the level turns mid-hand: this hand keeps 10/20
  const L = legalActions(m.table);
  m = ok(act(m, { id: L.id, type: 'fold' }, lv + 5));
  assert.equal(m.table.bb, 20);
  while (running(m.table)) { const l = legalActions(m.table); m = ok(act(m, { id: l.id, type: 'fold' }, lv + 6)); }
  const r = nextHand(m, { rng: rngFrom('lv2'), now: lv + 10 });
  m = ok(r);
  assert.equal(m.table.bb, 30);
  assert.ok(r.events.some(e => e.t === 'level' && e.level === 1 && e.sb === 15));
  assert.deepEqual(blindsFor(m, lv * 20), { level: 20, sb: 5000 * 32, bb: 10000 * 32 });
});

test('TOURNAMENT: two out in one hand → the bigger starting stack places higher; KOs credited; heads-up next', () => {
  // 4 players: a (button) 1500, b 300, c 600, d 1500 → b + c all in, both lose to a
  let m = createMatch({ mode: 'tournament', players: ['a', 'b', 'c', 'd'], now: 0 });
  seatById(m.table, 'b').stack = 300;
  seatById(m.table, 'c').stack = 600;
  seatById(m.table, 'a').stack = 2100;
  seatById(m.table, 'd').stack = 3000;                   // 6000 in all = 2100 + 300 + 600 + 3000
  m.players.a.buyins = 2100; m.players.b.buyins = 300; m.players.c.buyins = 600; m.players.d.buyins = 3000;
  m.table.button = 3;                                    // the next hand's button = seat 0 (a)
  // deal order b, c, d, a: b 72o, c 83o, d 94o folds, a AA
  m = ok(nextHand(m, { deck: rig(['7c 2d', '8c 3d', '9c 4d', 'As Ah'], 'Kc Qd 5s Jh 6c'), now: 0 }));
  assert.equal(turnId(m), 'd');
  m = ok(act(m, { id: 'd', type: 'fold' }, 1));
  m = ok(act(m, { id: 'a', type: 'allin' }, 2));
  m = ok(act(m, { id: 'b', type: 'allin' }, 3));
  const r = act(m, { id: 'c', type: 'allin' }, 4);
  m = ok(r);
  assert.equal(m.table.street, 'done');
  assert.deepEqual(m.places.map(p => [p.id, p.place, p.by.join()]), [['b', 4, 'a'], ['c', 3, 'a']]);
  assert.equal(m.players.a.kos, 2);
  assert.deepEqual(r.events.filter(e => e.t === 'out').map(e => e.id), ['b', 'c']);
  assert.ok(chipCount(m).ok);
  // heads-up: the button posts the small blind
  m = ok(nextHand(m, { rng: rngFrom('hu'), now: 10 }));
  assert.equal(m.table.seats.filter(x => x.status !== 'out').length, 2);
  assert.equal(m.table.sbSeat, m.table.button);
  assert.equal(turnId(m), seatById(m.table, m.table.seats.find(x => x.seat === m.table.button).id).id);
});

test('TOURNAMENT: equal starting stacks out in one hand SHARE the place; the match ends with one winner + the full order', () => {
  let m = createMatch({ mode: 'tournament', players: ['a', 'b', 'c'], now: 0 });
  m.table.button = 2;                                    // button a (seat 0): deal order b, c, a
  m = ok(nextHand(m, { deck: rig(['7c 2d', '8c 3d', 'As Ah'], 'Kc Qd 5s Jh 4h'), now: 0 }));
  m = shoveAll(m, 1);
  assert.ok(m.ended);
  assert.equal(m.winner, 'a');
  const s = summary(m);
  assert.deepEqual(s.places.map(p => [p.id, p.place]), [['a', 1], ['b', 2], ['c', 2]], 'b + c started equal → both 2nd');
  assert.equal(s.mode, 'tournament');
  assert.equal(s.hands, 1);
  assert.equal(s.biggestPot.amount, 4500);
  assert.deepEqual(s.players.a, { hands: 1, won: 1, kos: 2 });
  assert.equal(s.ledger, null);
  assert.match(nextHand(m, { rng: rngFrom('x'), now: 5 }).error, /over/);
  assert.match(act(m, { id: 'a', type: 'fold' }, 5).error, /over/);
  // a tournament has no late joiners, rebuys or leaving
  assert.match(join(createMatch({ players: ['a', 'b'] }), 'z').error, /CASH/);
  assert.match(rebuy(createMatch({ players: ['a', 'b'] }), 'a').error, /CASH/);
});

test('CASH: rebuy at zero, a late joiner sits in next hand, leaving takes your stack, END SESSION → THE LEDGER (Σ net = 0)', () => {
  let m = createMatch({ mode: 'cash', players: ['a', 'b', 'c'], now: 0 });
  assert.deepEqual(m.table.clock, { shot: SHOT_MS, bank: BANK_MS }, 'HE2: CASH runs the shot clock too');
  assert.equal(m.table.bb, 10);
  m.table.button = 2;                                    // button a: deal order b, c, a
  m = ok(nextHand(m, { deck: rig(['7c 2d', '8c 3d', 'As Ah'], 'Kc Qd 5s Jh 4h'), now: 0 }));
  assert.equal(m.table.deadline, SHOT_MS);
  // a late joiner mid-hand: seated, not dealt in
  m = ok(join(m, 'd', 1));
  assert.equal(seatById(m.table, 'd').status, 'sitout');
  assert.match(join(m, 'd', 1).error, /already/);
  m = shoveAll(m, 2);
  assert.equal(m.table.street, 'done');
  assert.equal(seatById(m.table, 'b').stack, 0);
  assert.match(rebuy(m, 'a', 3).error, /only for a player at zero/);
  m = ok(rebuy(m, 'b', 3));                              // c stays at zero (no rebuy yet)
  m = ok(nextHand(m, { rng: rngFrom('cash'), now: 4 }));
  assert.equal(seatById(m.table, 'd').status === 'in' || seatById(m.table, 'd').status === 'allin', true, 'the joiner is dealt in');
  assert.equal(seatById(m.table, 'c').status, 'out', 'at zero → not dealt in');
  assert.equal(m.players.d.hands, 1);
  // c rebuys while the hand runs (not in it) → dealt in next hand
  m = ok(rebuy(m, 'c', 5));
  assert.equal(seatById(m.table, 'c').status, 'sitout');
  // b leaves mid-hand → folds at once (or stays all in); gone after the hand
  m = ok(leave(m, 'b', 6));
  if (running(m.table)) {
    END: while (running(m.table)) { const L = legalActions(m.table); m = ok(act(m, { id: L.id, type: L.canCheck ? 'check' : 'call' }, 7)); continue END; }
  }
  assert.equal(seatById(m.table, 'b'), undefined, 'the leaver\'s seat is free');
  assert.ok(m.players.b.left);
  assert.ok(chipCount(m).ok);
  // END SESSION mid-hand waits for the hand; between hands closes at once
  m = ok(nextHand(m, { rng: rngFrom('cash2'), now: 8 }));
  m = ok(endSession(m, 9));
  assert.ok(m.ending && !m.ended);
  assert.match(nextHand(m, { rng: rngFrom('z'), now: 9 }).error, /a hand is already running|ending/);
  while (running(m.table)) { const L = legalActions(m.table); m = ok(act(m, { id: L.id, type: 'fold' }, 10)); }
  assert.ok(m.ended);
  const s = summary(m);
  assert.equal(s.ledger.reduce((n, r) => n + r.net, 0), 0, 'the ledger sums to zero');
  const bRow = s.ledger.find(r => r.id === 'b'), cRow = s.ledger.find(r => r.id === 'c');
  assert.equal(bRow.buyins, 2000);
  assert.equal(cRow.rebuys, 1);
  assert.ok(s.ledger.every(r => Number.isInteger(r.net) && r.hands >= 0));
  assert.equal(s.places, null);
  assert.ok(s.biggestPot.amount >= 3000);
  // never a money word in the summary
  assert.ok(!/\$|cash out|owes/i.test(JSON.stringify(s)));
});

test('a hand that ends INSIDE the deal (both blinds all in → the run-out) still settles: the bust, the winner', () => {
  let m = createMatch({ mode: 'tournament', players: ['a', 'b'], now: 0 });
  seatById(m.table, 'a').stack = 5; seatById(m.table, 'b').stack = 2995;
  m.players.a.buyins = 5; m.players.b.buyins = 2995;
  m.table.button = 1;                                    // the button → a (seat 0): a posts the small blind (all in)
  const r = nextHand(m, { deck: rig(['As Ah', '7c 2d'], 'Kc Qd 5s Jh 4h'), now: 0 });   // deal order b, a
  m = ok(r);
  assert.equal(m.table.street, 'done', 'no one could act — the board ran out in the deal');
  assert.ok(r.events.some(e => e.t === 'runout'));
  assert.ok(r.events.some(e => e.t === 'returned' && e.id === 'b' && e.amount === 15), 'b\'s uncalled 15 back');
  assert.ok(m.ended, 'b (AA) beat a (7-2): a is out in the deal itself');
  assert.equal(m.winner, 'b');
  assert.deepEqual(m.places.map(p => [p.id, p.place]), [['a', 2], ['b', 1]]);
  assert.ok(chipCount(m).ok);
});

test('CASH: END SESSION mid-hand waits for the hand (HE10 — A17: no void path; a second END SESSION is refused)', () => {
  let m = createMatch({ mode: 'cash', players: ['a', 'b'], now: 0 });
  m = ok(nextHand(m, { rng: rngFrom('void'), now: 0 }));
  const L = legalActions(m.table);
  m = ok(act(m, { id: L.id, type: 'raise', to: 300 }, 1));
  m = ok(endSession(m, 2));
  assert.ok(m.ending && !m.ended);
  assert.ok(endSession(m, 3).error);
  const L2 = legalActions(m.table);
  m = ok(act(m, { id: L2.id, type: 'fold' }, 4));
  assert.ok(m.ended);
  assert.equal(ledgerOf(m).reduce((n, x) => n + x.net, 0), 0);
});

// ------------------------------------------------------------------------------------------------ HE2
const toAct = m => m.table.seats.find(x => x.seat === m.table.turn);
/** let the clock run out on whoever is to act (the bank first, then the timeout) */
function clockOut(m) {
  for (let g = 0; g < 3; g++) {
    const was = m.table.turn, hand = m.table.hand;
    m = ok(act(m, { type: 'timeout' }, m.table.deadline));
    if (m.table.turn !== was || m.table.hand !== hand || !running(m.table)) return m;
  }
  return m;
}

test('HE2 — CASH: the shot clock + the bank; the bank refills +5 s a hand dealt in, never past 30 s', () => {
  let m = createMatch({ mode: 'cash', players: ['a', 'b', 'c'], now: 0 });
  m = ok(nextHand(m, { rng: rngFrom('he2-bank'), now: 0 }));
  assert.equal(m.table.deadline, SHOT_MS, '20 s a turn');
  const x = toAct(m);
  assert.equal(x.bank, BANK_MS, 'a full bank: the refill never passes 30 s');
  // they use 12 s of their bank, then act
  let r = ok(act(m, { type: 'timeout' }, SHOT_MS));
  assert.ok(r.table.bankOn);
  r = ok(act(r, { id: x.id, type: 'fold' }, SHOT_MS + 12_000));
  assert.equal(seatById(r.table, x.id).bank, BANK_MS - 12_000);
  while (running(r.table)) { const L = legalActions(r.table); r = ok(act(r, { id: L.id, type: 'fold' }, SHOT_MS + 13_000)); }
  r = ok(nextHand(r, { rng: rngFrom('he2-bank2'), now: 60_000 }));
  assert.equal(seatById(r.table, x.id).bank, BANK_MS - 12_000 + BANK_REFILL_MS, '+5 s for the hand dealt in');
  // a TOURNAMENT's bank never refills (one per match)
  let t = createMatch({ mode: 'tournament', players: ['a', 'b', 'c'], now: 0 });
  t = ok(nextHand(t, { rng: rngFrom('he2-tb'), now: 0 }));
  const y = toAct(t);
  t = ok(act(t, { type: 'timeout' }, SHOT_MS));
  t = ok(act(t, { id: y.id, type: 'fold' }, SHOT_MS + 12_000));
  while (running(t.table)) { const L = legalActions(t.table); t = ok(act(t, { id: L.id, type: 'fold' }, SHOT_MS + 13_000)); }
  t = ok(nextHand(t, { rng: rngFrom('he2-tb2'), now: 60_000 }));
  assert.equal(seatById(t.table, y.id).bank, BANK_MS - 12_000, 'TOURNAMENT: no refill');
  // a CASH late joiner sits down with a full bank
  m = ok(join(m, 'd', 1));
  assert.equal(seatById(m.table, 'd').bank, BANK_MS);
});

test('HE2 — CASH: AWAY = SAT OUT (not dealt in, no blinds) until SIT BACK; a TOURNAMENT\'s AWAY is still dealt in', () => {
  let m = createMatch({ mode: 'cash', players: ['a', 'b', 'c', 'd'], now: 0 });
  let now = 0, hand = 0;
  // 'a' lets the clock run out twice in a row (two hands if need be) → AWAY
  while (!seatById(m.table, 'a').away) {
    assert.ok(++hand < 30, 'a went away');
    m = ok(nextHand(m, { rng: rngFrom(`sat-${hand}`), now: now += 1000 }));
    while (running(m.table)) {
      if (toAct(m).id === 'a') m = clockOut(m);
      else { const L = legalActions(m.table); m = ok(act(m, { id: L.id, type: L.canCheck ? 'check' : 'call' }, m.table.deadline - 1)); }
      now = Math.max(now, (m.table.deadline || 0));
    }
  }
  assert.equal(seatById(m.table, 'a').timeouts, 2);
  // the next deals skip 'a': not dealt in, never a blind
  for (let k = 0; k < 4; k++) {
    m = ok(nextHand(m, { rng: rngFrom(`sat-skip-${k}`), now: now += 1000 }));
    const a = seatById(m.table, 'a');
    assert.equal(a.status, 'sitout', 'SAT OUT');
    assert.deepEqual(a.cards, []);
    assert.ok(!m.table.log.some(e => e.t === 'posted' && e.id === 'a'), 'no blinds while sat out');
    assert.ok(!m.table.log.find(e => e.t === 'dealt').ids.includes('a'));
    while (running(m.table)) { const L = legalActions(m.table); m = ok(act(m, { id: L.id, type: 'fold' }, now += 1000)); }
  }
  const handsBefore = m.players.a.hands;
  // SIT BACK — only someone away; dealt in from the next hand
  assert.match(sitBack(m, 'b', now).error, /not away/);
  m = ok(sitBack(m, 'a', now += 1000));
  assert.equal(seatById(m.table, 'a').away, false);
  m = ok(nextHand(m, { rng: rngFrom('sat-back'), now: now += 1000 }));
  assert.ok(['in', 'allin'].includes(seatById(m.table, 'a').status), 'dealt in again');
  assert.equal(m.players.a.hands, handsBefore + 1, 'a sat-out hand is never counted as played');
  assert.ok(chipCount(m).ok);
  // a TOURNAMENT: the AWAY seat is still dealt in + posts (HE1 unchanged)
  let t = createMatch({ mode: 'tournament', players: ['a', 'b', 'c'], now: 0 });
  seatById(t.table, 'a').away = true; seatById(t.table, 'a').timeouts = 2;
  t = ok(nextHand(t, { rng: rngFrom('tour-away'), now: 1 }));
  assert.ok(t.table.log.find(e => e.t === 'dealt').ids.includes('a'), 'TOURNAMENT: still dealt in');
});

test('HE2 — CASH: sit back while a hand runs changes nothing in it; the table waits when fewer than 2 are dealable', () => {
  let m = createMatch({ mode: 'cash', players: ['a', 'b'], now: 0 });
  seatById(m.table, 'a').away = true; seatById(m.table, 'a').timeouts = 2;
  assert.match(nextHand(m, { rng: rngFrom('w'), now: 1 }).error, /two players/, 'one dealable player: no deal');
  m = ok(join(m, 'c', 2));
  m = ok(nextHand(m, { rng: rngFrom('w2'), now: 3 }));
  assert.equal(seatById(m.table, 'a').status, 'sitout');
  const before = JSON.stringify(m.table.seats.filter(x => x.id !== 'a'));
  m = ok(sitBack(m, 'a', 4));
  assert.equal(seatById(m.table, 'a').status, 'sitout', 'still out of the running hand');
  assert.equal(JSON.stringify(m.table.seats.filter(x => x.id !== 'a')), before);
});

test('HE2 — the engine has no act-for-another: every action names its own seat; a wrong seat is refused', () => {
  let m = createMatch({ mode: 'cash', players: ['a', 'b', 'c'], now: 0 });
  m = ok(nextHand(m, { rng: rngFrom('own'), now: 0 }));
  const L = legalActions(m.table);
  const other = m.table.seats.find(x => x.id !== L.id).id;
  assert.match(act(m, { id: other, type: 'fold' }, 1).error, /not your turn/);
});
