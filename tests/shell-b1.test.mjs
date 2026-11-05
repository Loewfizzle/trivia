// SHELL 2.0 B1 — the owner's SHELL 2.0 A fixes + the contract + the solo lane (docs/harbor/passes/shell-b1.md). Pure checks; the
// browser halves live in the harbor suite (shell, sheetstack, roomfix, radio, progress) + the games' E2Es.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

// ---- THE RACING CLOUDS (the owner, 8:26 am: last night's tab reopened → the clouds flew): a page open 10 h, the mean wind eases to a
//      new value → every cloud's ON-SCREEN speed stays in the normal range (≤ its speed at the faster wind), and it never jumps
test('THE RACING CLOUDS: 10 hours open, the wind eases 3 → 9 m/s → every cloud moves at its normal speed, never flung', async () => {
  const { cloudDrift, driftAt, driftSpeed } = await import('../js/core/harbor-clouds.js');
  const drift = cloudDrift(), W = 402;
  const d = { x0: 40, w: 160, v: 1.1 };
  const windAt = t => { const t1 = 36000, t2 = 36000 + 90; return t < t1 ? 3 : t > t2 ? 9 : 3 + 6 * (t - t1) / (t2 - t1); };
  let worst = 0, prev = null;
  for (let t = 35900; t < 36300; t += 1 / 30) {
    const x = d.x0 + d.w * 1.04 + d.v * drift.dist(t, windAt(t), 1);     // (unwrapped — the wrap would hide a jump)
    if (prev != null) worst = Math.max(worst, Math.abs(x - prev) * 30);
    prev = x;
    void driftAt;
  }
  const cap = driftSpeed(9) * d.v * 1.001;
  assert.ok(worst <= cap, `the on-screen speed peaked at ${worst.toFixed(2)} pt/s (the fastest normal: ${cap.toFixed(2)})`);
  // (the old formula — x0 + speed × the clock — on the same easing: hundreds of pt/s; proves the test sees the bug)
  let old = 0, po = null;
  for (let t = 35900; t < 36300; t += 1 / 30) { const x = d.v * driftSpeed(windAt(t)) * t; if (po != null) old = Math.max(old, Math.abs(x - po) * 30); po = x; }
  assert.ok(old > 50 * cap, `the old speed × clock flew at ${old.toFixed(0)} pt/s`);
});

test('THE PHASE: the first sight = the clock\'s own formula (phones agree), continuous across a change, starts over when the clock runs back', async () => {
  const { phaseClock } = await import('../js/core/harbor-phase.js');
  const a = phaseClock(), b = phaseClock();
  assert.equal(a.at(1000, 2), 2000); assert.equal(b.at(1000, 2), 2000);
  assert.equal(a.at(1010, 2), 2020);
  assert.equal(a.at(1010, 5), 2020, 'a new speed keeps the position');
  assert.equal(a.at(1012, 5), 2030);
  assert.equal(a.at(1012, 5), 2030, 'the same t + speed twice = the same answer (four draw passes a frame)');
  assert.equal(a.at(10, 5), 50, 'a new block (the clock went back): the clock formula again');
});

test('every speed × clock drift in the city goes through the phase (clouds + deck, the water\'s wavelets, the fog\'s wisps)', () => {
  const c = read('js/screens/harbor/clouds.js'), w = read('js/screens/harbor/water.js'), f = read('js/screens/harbor/waterfog.js');
  assert.match(c, /const drift = cloudDrift\(\)/); assert.doesNotMatch(c, /driftSpeed\(wind\) \* wx \* d\.v \* \(motion \? tSec/); assert.doesNotMatch(c, /driftX\(d, motion \? tSec/);
  assert.match(w, /ph1\.at\(t, 3 \+ 9 \* rough\)/); assert.doesNotMatch(w, /t \* \(3 \+ 9 \* rough\)/);
  assert.match(f, /ph\.at\(s\.t, v\)/); assert.doesNotMatch(f, /tt \* v \* sp/);
});
