// HOLD'EM (HE4) — THE MOTION's PLAN (js/games/holdem/motion-plan.js): only events this phone hasn't shown, only fresh, only a whole run
// (a refresh / a sleep / a gap = the state as it is — never a replay); the timeline's order (the sweep before the next street's flips, the
// hands up before the pots, the side pots smallest first and the main pot last) and that it never outlasts the dealer's pauses; the seats
// drawn (a busted seat to its hand's end, then the re-spread at the next deal).
import test from 'node:test';
import assert from 'node:assert/strict';
import { freshEvents, schedule, awardOrder, awardLine, winLine, holdsOf, drawnSeats, winningCards, BEAT, MAX_AGE_MS } from '../js/games/holdem/motion-plan.js';
import { newRecord, advance, applyOp, publicOf, PAUSE } from '../api/_lib/holdem-dealer.js';
import { legalActions, running } from '../js/games/holdem/table.js';
import { rngFrom } from '../js/core/rng.js';

const ev = (n, t, at, extra = {}) => ({ n, t, at, hand: 1, ...extra });

test('FRESH EVENTS: the first look (a mount, a refresh) animates nothing; then only the new ones, fresh, with no gap', () => {
  const list = [ev(1, 'dealt', 1000), ev(2, 'posted', 1000), ev(3, 'posted', 1000)];
  assert.deepEqual(freshEvents(list, null, 1100), { list: [], seen: 3 }, 'a refresh: the state as it is');
  assert.deepEqual(freshEvents(list, 3, 1100).list, [], 'nothing new');
  const more = [...list, ev(4, 'called', 5000), ev(5, 'folded', 5000)];
  assert.deepEqual(freshEvents(more, 3, 5200).list.map(e => e.n), [4, 5]);
  assert.deepEqual(freshEvents(more, 3, 5000 + MAX_AGE_MS + 1), { list: [], seen: 5 }, 'a phone that slept: history, skipped');
  assert.deepEqual(freshEvents(more.slice(1).filter(e => e.n !== 4), 3, 5200), { list: [], seen: 5 }, 'a gap (a missed write): skipped whole');
  assert.deepEqual(freshEvents(null, 7, 0), { list: [], seen: 7 });
});

test('THE TIMELINE: the bets in front sweep into the pot BEFORE the next street flips; the flop three apart; each chip after the last', () => {
  const steps = schedule([ev(5, 'called', 0, { id: 'b', amount: 40, to: 60 }), ev(6, 'street', 0, { street: 'flop', cards: ['As', 'Kd', '2c'], board: ['As', 'Kd', '2c'] })],
    { bets: { a: 60, b: 20 } });
  const kinds = steps.map(s => s.kind);
  assert.deepEqual(kinds, ['chip', 'sweep', 'board', 'board', 'board']);
  const sweep = steps.find(s => s.kind === 'sweep');
  assert.deepEqual(sweep.from.sort((x, y) => x.id.localeCompare(y.id)), [{ id: 'a', amount: 60 }, { id: 'b', amount: 60 }], 'the call counts (its `to`)');
  const boards = steps.filter(s => s.kind === 'board');
  assert.ok(boards[0].at >= sweep.at + BEAT.sweep, 'the flop after the sweep');
  assert.deepEqual(boards.map(b => b.i), [0, 1, 2]);
  assert.equal(boards[1].at - boards[0].at, BEAT.boardGap);
  // the turn: one card, at index 3
  const turn = schedule([ev(9, 'street', 0, { cards: ['7h'], board: ['As', 'Kd', '2c', '7h'] })], { bets: {} });
  assert.deepEqual(turn.map(s => [s.kind, s.i]), [['board', 3]], 'no bets → no sweep');
});

test('THE DEAL: one deal step + the blinds alongside it; your two flip once the last card lands; HEADS UP when the table gets down to two', () => {
  const ids = ['a', 'b', 'c', 'd'];
  const steps = schedule([ev(1, 'dealt', 0, { ids, button: 'a', heads: false }), ev(2, 'posted', 0, { id: 'b', amount: 10 }), ev(3, 'posted', 0, { id: 'c', amount: 20 })], { heroId: 'd', k: 3 });
  assert.equal(steps.filter(s => s.kind === 'deal').length, 1);
  assert.equal(steps.filter(s => s.kind === 'chip').length, 2);
  const flip = steps.find(s => s.kind === 'heroFlip');
  assert.equal(flip.at, 2 * ids.length * BEAT.dealGap + BEAT.dealFly + BEAT.heroFlip);
  assert.ok(!steps.some(s => s.kind === 'headsUp'));
  const hu = schedule([ev(1, 'dealt', 0, { ids: ['a', 'b'], button: 'a', heads: true })], { heroId: 'zz', k: 3 });
  assert.ok(hu.some(s => s.kind === 'headsUp'), 'down to two → HEADS UP');
  assert.ok(!hu.some(s => s.kind === 'heroFlip'), 'a spectator has no cards to flip');
  assert.ok(!schedule([ev(1, 'dealt', 0, { ids: ['a', 'b'], heads: true })], { k: 1 }).some(s => s.kind === 'headsUp'), 'already heads-up: no moment');
});

test('THE POTS: the hands up first, then the side pots ONE AT A TIME — the smallest first, the main pot last — each with its line', () => {
  const pots = [
    ev(20, 'pot', 0, { pot: 0, amount: 1500, winners: [{ id: 'a', amount: 1500 }], label: 'FLUSH · ACE HIGH' }),
    ev(21, 'pot', 0, { pot: 1, side: true, amount: 1320, winners: [{ id: 'b', amount: 1320 }], label: 'TWO PAIR · KINGS AND NINES' }),
    ev(22, 'pot', 0, { pot: 2, side: true, amount: 400, winners: [{ id: 'b', amount: 200 }, { id: 'c', amount: 200 }], label: 'STRAIGHT · TEN HIGH' }),
  ];
  assert.deepEqual(awardOrder(pots).map(p => p.pot), [2, 1, 0]);
  const shown = ['a', 'b', 'c'].map((id, i) => ev(16 + i, 'shown', 0, { id }));
  const steps = schedule([...shown, ...pots], { bets: { a: 100, b: 100, c: 100 } });
  const kinds = steps.map(s => s.kind);
  assert.equal(kinds[0], 'sweep', 'the last bets in first');
  const lastShown = Math.max(...steps.filter(s => s.kind === 'shown').map(s => s.at));
  const awards = steps.filter(s => s.kind === 'award');
  assert.deepEqual(awards.map(a => a.pot.pot), [2, 1, 0]);
  assert.ok(awards[0].at >= lastShown, 'the pots after the hands are up');
  assert.equal(awards[1].at - awards[0].at, BEAT.awardGap);
  assert.ok(awards[2].at + BEAT.award < PAUSE.showdown, 'the whole showdown fits the dealer’s 6 s pause — nothing waits on the motion');
  const name = id => ({ a: 'ALEX', b: 'BO', c: 'CY' })[id];
  assert.equal(awardLine(pots[1], name, true), 'SIDE POT · 1,320 → BO');
  assert.equal(awardLine(pots[0], name, true), 'MAIN POT · 1,500 → ALEX');
  assert.equal(awardLine({ ...pots[0], pot: 0 }, name, false), 'POT · 1,500 → ALEX');
  assert.equal(awardLine(pots[2], name, true), 'SIDE POT · 400 → BO & CY');
  assert.equal(winLine(pots[0]), 'FLUSH · ACE HIGH');
  assert.equal(winLine(pots[2]), 'SPLIT POT');
  assert.equal(winLine({ ...pots[0], byFold: true }), '');
  assert.deepEqual(holdsOf(steps), { stack: { a: 1500, b: 1520, c: 200 }, pot: 3220 });
  // a fold-win inside its 3 s pause
  const fw = schedule([ev(30, 'folded', 0, { id: 'b' }), ev(31, 'pot', 0, { pot: 0, amount: 90, winners: [{ id: 'a', amount: 90 }], byFold: true })], { bets: { a: 60, b: 20, c: 10 } });
  const last = fw[fw.length - 1];
  assert.ok(last.at + BEAT.award < PAUSE.fold, 'a fold-win fits the dealer’s 3 s pause');
});

test('THE WINNING FIVE: the winners’ best five (on the board + in their hands), a split’s both', () => {
  const best = id => ({ a: ['As', 'Ks', 'Qs', 'Js', 'Ts'], b: ['As', 'Ks', 'Qs', 'Js', '9s'] })[id];
  assert.equal(winningCards({ winners: [{ id: 'a' }] }, best).size, 5);
  assert.deepEqual([...winningCards({ winners: [{ id: 'a' }, { id: 'b' }] }, best)].sort(), ['9s', 'As', 'Js', 'Ks', 'Qs', 'Ts']);
});

test('THE SEATS DRAWN: a seat out in an EARLIER hand is gone; out THIS hand it stays (OUT, then its fade) until the next deal re-spreads the table', () => {
  const seats = [{ id: 'a', status: 'in' }, { id: 'b', status: 'out' }, { id: 'c', status: 'out' }];
  const places = [{ id: 'b', place: 3, hand: 4 }, { id: 'c', place: 2, hand: 7 }];
  assert.deepEqual(drawnSeats(seats, { hand: 7, street: 'done' }, places).map(x => x.id), ['a', 'c'], 'c went out this hand');
  assert.deepEqual(drawnSeats(seats, { hand: 8, street: 'preflop' }, places).map(x => x.id), ['a'], 'the next deal: gone');
});

test('A WHOLE MATCH through the real dealer: every run of events a phone could see plans without a stray step; the showdowns fit their pause; a refresh in the middle of a pot award animates nothing', () => {
  const rng = rngFrom('he4-motion');
  const uids = ['p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'];
  let now = 1e12;
  const rec = newRecord({ code: 'MOTN', uids, now, rng });
  advance(rec, now, rng);
  let seen = 0, hands = 0, longest = 0, awards = 0, prevBets = {};
  const KNOWN = new Set(['deal', 'heroFlip', 'chip', 'sweep', 'board', 'fold', 'shown', 'award', 'back', 'level', 'headsUp', 'out']);
  for (let g = 0; g < 4000 && !rec.m.ended; g++) {
    const t = rec.m.table;
    if (running(t) && !t.runout) {
      const L = legalActions(t);
      const r = rng();
      const action = r < 0.25 ? 'allin' : r < 0.45 ? 'fold' : L.canCheck ? 'check' : 'call';
      now += 3000;
      try { applyOp(rec, 'act', L.id, { hand: t.hand, seq: rec.seq, action }, { now, rng }); } catch { applyOp(rec, 'act', L.id, { hand: t.hand, seq: rec.seq, action: 'fold' }, { now, rng }); }
      rec.seq++;
    } else { now += 1600; if (advance(rec, now, rng)) rec.seq++; }
    const pub = publicOf(rec);
    const fr = freshEvents(pub.ev, seen, now);
    if (fr.list.length) {
      const steps = schedule(fr.list, { bets: prevBets, heroId: 'p0', k: 7 });
      for (const s of steps) assert.ok(KNOWN.has(s.kind), `a known step: ${s.kind}`);
      const aw = steps.filter(s => s.kind === 'award');
      awards += aw.length;
      if (aw.length) longest = Math.max(longest, aw[aw.length - 1].at + BEAT.award);
      if (fr.list.some(e => e.t === 'dealt')) hands++;
      // a refresh right here: nothing replays
      assert.deepEqual(freshEvents(pub.ev, null, now).list, []);
    }
    seen = fr.seen;
    prevBets = Object.fromEntries(pub.table.seats.filter(x => x.bet > 0).map(x => [x.id, x.bet]));
  }
  assert.ok(rec.m.ended, 'the match ended');
  assert.ok(hands > 3 && awards >= hands, `${hands} hands, ${awards} pots awarded`);
  assert.ok(longest < PAUSE.showdown, `the longest award run ${longest} ms < the showdown pause`);
});
