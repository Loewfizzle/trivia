// HOLD'EM (HE1) — the cards + THE HAND RANKER: the classic proof (every one of the 2,598,960 five-card hands, the
// known category counts + the 7,462 distinct hand values), the tricky cases, 7-card spot checks, the labels.
import test from 'node:test';
import assert from 'node:assert/strict';
import { newDeck, shuffleDeck, cardInt, intCard, isCard } from '../js/games/holdem/cards.js';
import { scoreInts, evaluate, compareHands, bestFive, holeLabel, handLabel, decode } from '../js/games/holdem/rank.js';
import { rngFrom } from '../js/core/rng.js';

const H = s => s.split(' ');

test('the deck: 52 distinct codes, a seeded shuffle replays exactly, a different seed differs', () => {
  const d = newDeck();
  assert.equal(d.length, 52);
  assert.equal(new Set(d).size, 52);
  assert.ok(d.every(isCard));
  for (const c of d) assert.equal(intCard(cardInt(c)), c);
  const a = shuffleDeck(rngFrom('seed-1')), b = shuffleDeck(rngFrom('seed-1')), c = shuffleDeck(rngFrom('seed-2'));
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
  assert.deepEqual([...a].sort(), [...d].sort());
  assert.throws(() => shuffleDeck());
});

test('the shuffle is fair enough: each card lands in each position about 1/52 of the time', () => {
  const rng = rngFrom('fair'), N = 20000, hits = new Array(52).fill(0);
  for (let i = 0; i < N; i++) hits[shuffleDeck(rng).indexOf('As')]++;
  const e = N / 52;
  for (const h of hits) assert.ok(Math.abs(h - e) < e * 0.35, `position count ${h} vs ${e}`);
});

test('THE CLASSIC PROOF: all 2,598,960 five-card hands give the known category counts + 7,462 distinct values', () => {
  const t0 = performance.now();
  const cats = new Array(9).fill(0), seen = new Set(), h = [0, 0, 0, 0, 0];
  let royals = 0;
  for (let a = 0; a < 52; a++) for (let b = a + 1; b < 52; b++) for (let c = b + 1; c < 52; c++)
    for (let d = c + 1; d < 52; d++) for (let e = d + 1; e < 52; e++) {
      h[0] = a; h[1] = b; h[2] = c; h[3] = d; h[4] = e;
      const s = scoreInts(h, 5);
      const cat = Math.floor(s / 1048576);
      cats[cat]++;
      seen.add(s);
      if (cat === 8 && decode(s).ranks[0] === 12) royals++;
    }
  assert.deepEqual(cats, [1302540, 1098240, 123552, 54912, 10200, 5108, 3744, 624, 40]);
  assert.equal(cats.reduce((x, y) => x + y), 2598960);
  assert.equal(royals, 4);
  assert.equal(seen.size, 7462, 'the distinct five-card hand values');
  const ms = performance.now() - t0;
  assert.ok(ms < 15000, `the proof took ${Math.round(ms)} ms`);
  console.log(`# holdem: the 2,598,960-hand proof ran in ${Math.round(ms)} ms`);
});

test('tricky cases: the wheel, board plays, counterfeits, flush kickers, splits', () => {
  const cmp = (a, b) => Math.sign(compareHands(H(a), H(b)));
  // the wheel is the LOWEST straight
  assert.equal(evaluate(H('As 2d 3c 4h 5s')).label, 'STRAIGHT · FIVE HIGH');
  assert.equal(cmp('2s 3d 4c 5h 6s', 'As 2d 3c 4h 5s'), 1, 'six-high beats the wheel');
  assert.equal(cmp('Ts Jd Qc Kh As', '9s Td Jc Qh Ks'), 1, 'broadway beats king-high');
  assert.equal(evaluate(H('Qs Kd Ac 2h 3s')).cat, 0, 'no wrap-around straight');
  assert.equal(evaluate(H('As 2s 3s 4s 5s')).label, 'STRAIGHT FLUSH');
  assert.equal(evaluate(H('Ts Js Qs Ks As')).label, 'ROYAL FLUSH');
  // the board plays → split
  const board = 'Ts Jd Qc Kh As';
  assert.equal(cmp(`2c 3d ${board}`, `4h 5h ${board}`), 0, 'both play the board');
  // two pair from 7: the two BEST pairs count (kings + sevens beat kings + twos with an ace)
  assert.equal(cmp('7c 7d 2s 2h Ks Kd Qc', 'Ah 3c 2s 2h Ks Kd Qc'), 1);
  assert.equal(evaluate(H('7c 7d 2s 2h Ks Kd Qc')).label, 'TWO PAIR · KINGS AND SEVENS');
  // a real counterfeit: 5-5 on 6-6-Q-Q-A → two pair QQ66 A for both 5-5 and 3-4 → split
  assert.equal(cmp('5c 5d 6s 6h Qs Qd Ac', '3h 4c 6s 6h Qs Qd Ac'), 0, 'the fives are counterfeited');
  // flush vs flush: the kickers count, down to the fifth card
  assert.equal(cmp('As 9s 7s 4s 2s', 'Ad 9d 7d 5d 2d'), -1, 'the fourth card decides');
  assert.equal(cmp('Kh Jh 8h 6h 3h', 'Kh Jh 8h 6h 2h'), 1, 'the fifth card decides');
  // full house: trips first, then the pair; two trips → the higher trips + the lower as the pair
  assert.equal(evaluate(H('9s 9d 9c Kh Ks Kd 2c')).label, 'FULL HOUSE · KINGS OVER NINES');
  assert.equal(cmp('Ks Kd Kc 2h 2s', 'Qs Qd Qc As Ah'), 1);
  // quads + the best kicker from 7
  assert.equal(cmp('As Ad Ac Ah 2c 3d Kc', 'As Ad Ac Ah 2c 3d Qc'), 1);
  // pair kickers
  assert.equal(cmp('As Ad Kc Qh 9s', 'As Ad Kc Qh 8s'), 1);
  assert.equal(cmp('As Ad Kc Qh 9s', 'Ac Ah Kd Qs 9c'), 0, 'suits never matter');
  // the straight beats trips, the flush beats the straight, a 7-card flush + straight → the flush (or the straight flush)
  assert.equal(evaluate(H('5h 6h 7h 8h 9c Ah 2d')).cat, 5);
  assert.equal(evaluate(H('5h 6h 7h 8h 9h Ah 2d')).label, 'STRAIGHT FLUSH');
  assert.equal(evaluate(H('5h 6h 7h 8h 9c 9d 9s')).cat, 4, 'a straight beats trips');
});

test('7-card spot checks + bestFive', () => {
  const cases = [
    ['2c 3c 4d 5s 7h 9h Jd', 'HIGH CARD · JACK'],
    ['Kc Kd 4d 5s 7h 9h Jd', 'PAIR OF KINGS'],
    ['Kc Kd 9s 5s 7h 9h Jd', 'TWO PAIR · KINGS AND NINES'],
    ['9c 9d 9s 5s 7h 2h Jd', 'THREE NINES'],
    ['6c 7d 8s 9s Th 2h 2d', 'STRAIGHT · TEN HIGH'],
    ['Ac 7c 8c 2c Th Jc 2d', 'FLUSH · ACE HIGH'],
    ['Ac Ad As Ah Th Jc 2d', 'FOUR ACES'],
    ['Ac Ad Kc Kd Qh Qc 2d', 'TWO PAIR · ACES AND KINGS'],
  ];
  for (const [h, label] of cases) assert.equal(evaluate(H(h)).label, label, h);
  assert.equal(evaluate(H('Kc Kd 9s 5s 7h 9h Jd')).short, 'TWO PAIR · KINGS');
  assert.equal(evaluate(H('9s 9d 9c Kh Ks Kd 2c')).short, 'FULL HOUSE · KINGS');
  const b5 = bestFive(H('Ac 7c 8c 2c Th Jc 2d'));
  assert.deepEqual(b5.sort(), H('Ac 7c 8c 2c Jc').sort());
  assert.equal(bestFive(H('As 2d 3c 4h 5s 9d Kd')).sort().join(), H('As 2d 3c 4h 5s').sort().join());
  // random 7-card hands: the 7-card score always equals the best of its 21 five-card subsets
  const rng = rngFrom('spot');
  for (let i = 0; i < 3000; i++) {
    const d = shuffleDeck(rng).slice(0, 7).map(cardInt);
    let best = 0;
    const p = [0, 0, 0, 0, 0];
    for (let a = 0; a < 7; a++) for (let b = a + 1; b < 7; b++) for (let c = b + 1; c < 7; c++)
      for (let x = c + 1; x < 7; x++) for (let y = x + 1; y < 7; y++) {
        p[0] = d[a]; p[1] = d[b]; p[2] = d[c]; p[3] = d[x]; p[4] = d[y];
        best = Math.max(best, scoreInts(p, 5));
      }
    assert.equal(scoreInts(d, 7), best);
  }
});

test('the labels: two cards before the flop, every category in plain words', () => {
  assert.equal(holeLabel(H('Qs Qd')), 'PAIR OF QUEENS');
  assert.equal(holeLabel(H('Kd As')), 'ACE KING');
  assert.equal(holeLabel(H('2c 7h')), 'SEVEN TWO');
  assert.equal(handLabel(H('Kd As')), 'ACE KING');
  assert.equal(handLabel(H('Kd As Ks 7c 2h')), 'PAIR OF KINGS');
  assert.equal(handLabel(H('Kd Ah Ks 7c 7h'), true), 'TWO PAIR · KINGS');
  assert.equal(handLabel([]), '');
  assert.equal(evaluate(H('Ac 9d 7s 4h 2c')).label, 'HIGH CARD · ACE');
  assert.equal(evaluate(H('Ac Ad Kh Kc Kd')).label, 'FULL HOUSE · KINGS OVER ACES');
  // never a money word in a label
  for (const l of ['HIGH CARD · ACE', evaluate(H('Ac Ad Kh Kc Kd')).label]) assert.ok(!/[$]/.test(l));
});
