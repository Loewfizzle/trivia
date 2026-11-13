// FR7 FIXES C2 — THE LEAVES READ AS LEAVES (the owner's iPhone, Nov 13 7 am: "it's hard to tell these are leaves"): the seeded bank's numbers —
// FEWER, BIGGER leaves in a RING round NEON, each shape whole, most of each outside the letters, clear of SPEAKEASY, centre-out.
import test from 'node:test';
import assert from 'node:assert/strict';
import { leafLayout, leavesUp, coverOf, insideLetters, bodyR, discOverlap, LEAF_N, MAX_COVER, FLOOR_Y, CEIL_Y, NIGHT_FLOOR, RING } from '../js/screens/harbor/leafbank.js';

const K390 = 0.833;   // pt a logo unit at 390 (measured: the logo SVG's width / its 384-unit viewBox)
const L = leafLayout();

test('the bank: 25–35 leaves, each ~40–60 pt at 390', () => {
  assert.ok(L.length >= 25 && L.length <= 35 && L.length <= LEAF_N, `${L.length} leaves`);
  for (const o of L) assert.ok(o.s * K390 >= 39.5 && o.s * K390 <= 60, `a leaf ${(o.s * K390).toFixed(1)} pt`);
});

test('each shape stays whole: a leaf ≤ 30 % covered by the others', () => {
  for (let i = 0; i < L.length; i++) assert.ok(coverOf(L, i) <= MAX_COVER + 1e-9, `leaf ${i} covered ${(coverOf(L, i) * 100).toFixed(0)} %`);
  assert.ok(Math.abs(discOverlap(1, 1, 0) - Math.PI) < 1e-9 && discOverlap(1, 1, 2) === 0);
});

test('a RING round the letters: most of each leaf outside them; above, below, in the gaps, past both ends', () => {
  const ins = L.map(o => insideLetters(o.x, o.y, bodyR(o.s)));
  for (const v of ins) assert.ok(v <= 0.45, `a leaf ${(v * 100).toFixed(0)} % inside the letters`);
  assert.ok(ins.reduce((a, b) => a + b, 0) / ins.length <= 0.3, 'on average ≤ 30 % inside');
  assert.ok(L.some(o => o.y < -10) && L.some(o => o.y > 90), 'leaves above + below the letters');
  assert.ok(L.some(o => o.x < -5) && L.some(o => o.x > 337), 'leaves out past both N\'s');
  assert.ok(L.some(o => o.x > 64 && o.x < 92) || L.some(o => o.x > 154 && o.x < 176) || L.some(o => o.x > 240 && o.x < 268), 'a leaf in a gap between letters');
});

test('clear of SPEAKEASY + the corner row; inside the ring', () => {
  for (const o of L) {
    assert.ok(o.y + bodyR(o.s) <= FLOOR_Y + 1e-9, `a leaf reaches y ${(o.y + bodyR(o.s)).toFixed(0)} (SPEAKEASY)`);
    assert.ok(o.y - 0.45 * o.s >= CEIL_Y - 1e-9, 'a leaf above the corner row');
    assert.ok(o.x >= RING.cx - RING.ax && o.x <= RING.cx + RING.ax);
  }
});

test('the build-up: centre-out, the same every run', () => {
  assert.deepEqual(leafLayout().map(o => [o.x, o.y, o.s]), L.map(o => [o.x, o.y, o.s]), 'seeded');
  const half = leavesUp(L, 0.5), rest = L.filter(o => !half.includes(o));
  const dist = o => Math.abs(o.x - 166);
  const mean = a => a.reduce((s, o) => s + dist(o), 0) / a.length;
  assert.ok(mean(half) < mean(rest), 'the first half sits nearer the middle');
  assert.equal(leavesUp(L, 1).length, L.length);
  assert.equal(leavesUp(L, 0).length, 0);
  // Nov 15 → 22 (8 days): about 3–5 a day
  assert.ok(L.length / 8 >= 3 && L.length / 8 <= 5);
});

test('the night keeps the leaves\' real colours: the far floor ≥ ~55 % of daylight, warm (never olive / brown-black)', () => {
  const Y = 0.2126 * NIGHT_FLOOR[0] + 0.7152 * NIGHT_FLOOR[1] + 0.0722 * NIGHT_FLOOR[2];
  assert.ok(Y >= 0.55, `the floor's brightness ${Y.toFixed(2)}`);
  assert.ok(NIGHT_FLOOR[0] >= NIGHT_FLOOR[1] && NIGHT_FLOOR[1] >= NIGHT_FLOOR[2], 'warm (r ≥ g ≥ b): never olive');
});
