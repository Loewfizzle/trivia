// COAST CLEAR — THE NO-GUESS BOARD MAKER (CC1 — docs/coastclear.md "The board maker"): 1,000+ seeds → every board finished by the solver from its
// opening (pure logic), 18 lights, the opening all-safe + a calm area of 10–20 cells, deterministic for a fixed pepper, different peppers →
// different boards; the solver never guesses (a hand-made 50/50 is refused) and never calls a cell wrong; the stored form round-trips.
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeBoard, candidate, solve, OPEN_MIN, OPEN_MAX } from '../api/_lib/cc-solve.js';
import { buildBoard, ccSeed, packBoard, unpackBoard } from '../api/_lib/cc-board.js';
import { countsOf, flood, safeCount } from '../js/games/coastclear/logic.js';
import { rngFrom } from '../js/core/rng.js';
import { W, H, LIGHTS } from '../js/games/coastclear/meta.js';

test('1,200 days: every board is solver-finishable from its opening, 18 lights, 9 × 12, the opening all safe (10–20 cells, a 0 at its heart, near the middle)', () => {
  let attempts = 0, max = 0;
  const t = Date.now();
  for (let d = 0; d < 1200; d++) {
    const { board, attempts: a } = buildBoard(`d2027${String(d).padStart(4, '0')}`, 'test-pepper');
    attempts += a; max = Math.max(max, a);
    assert.equal(board.w, W); assert.equal(board.h, H); assert.equal(board.lights.length, LIGHTS);
    assert.equal(new Set(board.lights).size, LIGHTS);
    const counts = countsOf(board);
    assert.equal(counts[board.start], 0, 'the opening starts on a 0');
    assert.ok(board.open.length >= OPEN_MIN && board.open.length <= OPEN_MAX, `opening ${board.open.length}`);
    assert.ok(board.open.every(c => counts[c] >= 0), 'the opening is all safe');
    assert.deepEqual(board.open, flood(board, counts, board.start).map(c => c[0]).sort((x, y) => x - y), 'the opening = the start\'s calm area exactly');
    const x = board.start % W, y = Math.floor(board.start / W);
    assert.ok(x >= 2 && x <= W - 3 && y >= 4 && y <= 7, 'the start sits in the middle band');
    assert.equal(solve(board).solved, true);
  }
  console.log(`# 1,200 boards: ${(attempts / 1200).toFixed(1)} attempts a board on average (max ${max}), ${((Date.now() - t) / 1200).toFixed(2)} ms a board`);
});

test('deterministic for a fixed pepper + day; different peppers / days → different boards; attempt 0 = the daily seed form', () => {
  const a = buildBoard('d20261107', 'pepper-a').board, b = buildBoard('d20261107', 'pepper-a').board;
  assert.deepEqual(a, b);
  assert.notDeepEqual(buildBoard('d20261107', 'pepper-b').board.lights, a.lights);
  assert.notDeepEqual(buildBoard('d20261108', 'pepper-a').board.lights, a.lights);
  assert.notEqual(ccSeed('p', 'd1', 0), ccSeed('p', 'd1', 1));
  assert.throws(() => buildBoard('d20261107', ''), /pepper/);
});

test('THE SOLVER never guesses: a 50/50 is stuck; it never calls a cell wrong on 2,000 random candidates (it throws if it would)', () => {
  // a 3 × 3 with one light at the top right and a hand-picked opening: the bottom-right 0 proves (2,1) safe, then the top 1 needs (2,0)
  const board = { w: 3, h: 3, lights: [2], start: 6 };
  const counts = countsOf(board);
  const opening = [0, 3, 6, 1, 4, 7, 8].map(c => [c, counts[c]]);
  // a true 50/50: a 2 × 2, the light in one of two hidden cells and nothing to tell them apart (the count too: 1 of 2)
  const fifty = { w: 2, h: 2, lights: [1], start: 0 };
  const fc = countsOf(fifty);
  assert.equal(solve(fifty, fc, [[0, fc[0]], [2, fc[2]]]).solved, false, 'a 50/50 is stuck — never a guess');
  assert.equal(solve(board, counts, opening).solved, true, 'pure logic finishes the 3 × 3');
  let ok = 0;
  for (let s = 0; s < 2000; s++) {
    const c = candidate(rngFrom(`cand${s}`));
    if (c.why) continue;
    const r = solve(c.board, c.counts, c.opening);   // throws on a wrong call
    if (r.solved) { ok++; assert.equal(r.opened, safeCount(c.board)); }
  }
  assert.ok(ok > 50, `${ok} solvable candidates`);
});

test('the stored form round-trips (the opening rebuilt from the start); the maker caps its attempts', () => {
  const { board, attempts } = buildBoard('d20261109', 'x');
  const p = packBoard(board, attempts);
  assert.equal(typeof p.l, 'string'); assert.ok(!('open' in p));
  assert.deepEqual(unpackBoard(p), board);
  assert.equal(unpackBoard(null), null); assert.equal(unpackBoard({ v: 99 }), null);
  assert.throws(() => makeBoard(a => rngFrom(a), { max: 3, lights: 60 }), /no no-guess board/);
});
