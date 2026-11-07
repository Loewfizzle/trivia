// OVERCLOCK OC8 — THE FIX PASS (THE FABLE REVIEW, Nov 7): the rules-side fixes, one test each (docs/overclock.md "OC8").
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOrder, categoryClashes } from '../js/games/overclock/logic.js';
import { TYPES as TYPES_ALL, SKILL_TYPES } from '../js/games/overclock/challenges.js';

// A5 — the first rematch dealt a type the room had just played, as its ×2 final
test('A5: while a whole match of fresh types remains, the rematch deals ONLY fresh ones (its ×2 final included); fewer left → the weight', () => {
  for (let s = 0; s < 400; s++) {
    const a = buildOrder(`a5-${s}`, 6);
    const b = buildOrder(`a5-${s}b`, 6, a);
    assert.equal(b.filter(t => a.includes(t)).length, 0, `seed ${s}: the rematch repeats nothing (${a.join(' ')} → ${b.join(' ')})`);
    assert.ok(!a.includes(b[5]), 'the ×2 final is fresh');
    assert.equal(new Set(b).size, 6);
    assert.ok(b[5] !== 'dumbluck', 'DUMB LUCK still never last');
    // the third match: 12 played, 7 fresh ≥ 6 → still fresh only
    const c = buildOrder(`a5-${s}c`, 6, [...a, ...b]);
    assert.equal(c.filter(t => a.includes(t) || b.includes(t)).length, 0, `seed ${s}: the third match repeats nothing either`);
  }
  // the category spread still holds as a rule of the draw (zero clashes nearly always — a forced fresh set may hold one)
  let clashes = 0;
  for (let s = 0; s < 400; s++) clashes += categoryClashes(buildOrder(`a5s-${s}b`, 6, buildOrder(`a5s-${s}`, 6)));
  assert.ok(clashes <= 8, `category clashes in 400 rematches: ${clashes}`);
  // fewer fresh types than the match needs → the old weight: the fresh ones still go first, the rest from the stale
  const played = TYPES_ALL.filter(t => t !== 'rewire' && t !== 'compass');
  let both = 0;
  for (let s = 0; s < 200; s++) { const d = buildOrder(`a5w-${s}`, 6, played); assert.equal(d.length, 6); if (d.includes('rewire') && d.includes('compass')) both++; }
  assert.ok(both > 150, `the two fresh types dealt in ${both} / 200`);
  // SOLO (no DUMB LUCK): the same rule over the 18 skill types
  for (let s = 0; s < 200; s++) {
    const a = buildOrder(`a5solo-${s}`, 6, [], { luck: false });
    const b = buildOrder(`a5solo-${s}b`, 6, a, { luck: false });
    assert.equal(b.filter(t => a.includes(t)).length, 0);
    assert.ok(b.every(t => SKILL_TYPES.includes(t)));
  }
  // no memory = exactly the old draw
  for (let s = 0; s < 50; s++) assert.deepEqual(buildOrder(`a5z-${s}`, 6, TYPES_ALL), buildOrder(`a5z-${s}`, 6));
});

// A6 — a pool challenge FIRST on a slow connection: the order is predictable from the match id, so every phone fetches the first pool in the walk
test('A6: the match ORDER comes from the match id (every phone predicts the first challenge in the walk); the first pool fits the preload budget', async () => {
  const { readFileSync, statSync } = await import('node:fs');
  const { orderFor, orderSeed } = await import('../js/games/overclock/deal.js');
  const { buildOrder } = await import('../js/games/overclock/logic.js');
  const { PRELOAD_BUDGET } = await import('../js/games/cartridge.js');
  const { BANK_FILES } = await import('../js/games/overclock/banks.js');
  // the same stamp → the same order on every phone; a different match → a different draw; the night memory still steers it
  for (let s = 0; s < 100; s++) {
    const m = `m${s}x`, used = { overclock: { 't-math': true, 't-memory': true } };
    assert.deepEqual(orderFor({ matchId: m, mode: 'quick', used, n: 4 }), orderFor({ matchId: m, mode: 'quick', used, n: 4 }));
    assert.deepEqual(orderFor({ matchId: m, mode: 'quick', used, n: 4 }), buildOrder(orderSeed(m), 6, ['math', 'memory'], { luck: true }));
    assert.ok(!orderFor({ matchId: m, mode: 'quick', used: {}, n: 1 }).includes('dumbluck'), 'solo: never DUMB LUCK');
    assert.equal(orderFor({ matchId: m, mode: 'standard', used: {}, n: 3 }).length, 12);
  }
  // the host's start() deals the predicted order + waits for its banks up to the walk's length (never the flat 3 s); preload() starts the first
  const idx = readFileSync('js/games/overclock/index.js', 'utf8');
  assert.match(idx, /const order = orderFor\(\{ matchId,/);
  assert.match(idx, /const wait = walkLeft\(now\)/);
  assert.match(idx, /first \? loadBank\(first\)/);
  assert.ok(!/settle\([^)]*,\s*3000\)/.test(idx), 'no flat 3-s bank wait left');
  // the preload with the BIGGEST first pool still inside the 1.5 MB budget (sounds + fonts + words + crack + the largest bank)
  const biggest = Math.max(...Object.values(BANK_FILES).map(b => statSync(`data/oc/${b.file}`).size));
  const { OC1_FILES } = await import('../js/games/overclock/sfx.js');
  const snd = OC1_FILES.map(f => statSync(`audio/sfx/overclock/${f}.mp3`).size).reduce((a, b) => a + b, 0);
  const fnt = ['barlow-condensed-900i', 'barlow-condensed-800i', 'chakra-petch-700', 'chakra-petch-500'].map(f => statSync(`assets/fonts/overclock/${f}.woff2`).size).reduce((a, b) => a + b, 0);
  const words = [5, 6, 7].flatMap(n => [`answers-${n}`, `valid-${n}`]).map(f => statSync(`data/words/${f}.json`).size).reduce((a, b) => a + b, 0);
  const crack = ['crack.webp', 'crack-glow.webp'].map(f => statSync(`assets/overclock/${f}`).size).reduce((a, b) => a + b, 0);
  const total = snd + fnt + words + crack + biggest;
  assert.ok(total <= PRELOAD_BUDGET, `the preload with the biggest first pool: ${Math.round(total / 1024)} KB of ${PRELOAD_BUDGET / 1024}`);
});

// A12 — solo Closest Call always paid the closest-in-the-room +60
test('A12: SOLO Closest Call pays the +60 only for a DEAD ON guess (within 5 %); with 2+ the closest in the room still gets it', async () => {
  const { computeResults, SPEED_BONUS } = await import('../js/games/overclock/logic.js');
  const game = (n, ci = 1) => ({ order: ['math', 'closest', 'memory', 'oddone', 'stroop', 'count'], ci, total: 6, playStartAt: 0, participants: Object.fromEntries(['a', 'b'].slice(0, n).map(u => [u, true])) });
  const off = computeResults(game(1), { a: { ok: 0.86, done: true, doneAt: 9000 } }).a;
  assert.equal(off.pts, 86, 'alone, 14 % off: the accuracy only — no "closest in the room"');
  const dead = computeResults(game(1), { a: { ok: 1, done: true, doneAt: 9000 } }).a;
  assert.equal(dead.pts, 100 + SPEED_BONUS, 'alone, DEAD ON: the bonus');
  const two = computeResults(game(2), { a: { ok: 0.86, done: true, doneAt: 9000 }, b: { ok: 0.5, done: true, doneAt: 9000 } });
  assert.equal(two.a.pts, 86 + SPEED_BONUS, 'two players: the closest still gets it, unchanged');
  assert.equal(two.b.pts, 50);
});
