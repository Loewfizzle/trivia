// CITY 2.0 — how the birds fly (js/core/harbor-flight.js): smooth, seeded, frame-rate independent.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { smoothRoof, roofAt, batPlan, batAt, geesePlan, goosePose, geeseTail, hash01 } from '../js/core/harbor-flight.js';

test('the smoothed roofline has no steps (a bird riding it never teleports)', () => {
  // a skyline like the Harbor's: 4-pt cells with 50–90 pt jumps at the towers' edges
  const sky = new Float32Array(102);
  for (let i = 0; i < sky.length; i++) sky[i] = 450 - (i % 20 < 4 ? 90 : i % 7 < 2 ? 40 : 0);
  let rawStep = 0;
  for (let i = 1; i < sky.length; i++) rawStep = Math.max(rawStep, Math.abs(sky[i] - sky[i - 1]));
  assert.ok(rawStep >= 50, 'the raw roofline jumps');
  const sm = smoothRoof(sky);
  let worst = 0;
  for (let x = 0; x < 404; x += 0.5) worst = Math.max(worst, Math.abs(roofAt(sm, x + 0.5) - roofAt(sm, x)));
  assert.ok(worst < 1.5, `≤ 1.5 pt per 0.5 pt of x (was ${worst.toFixed(2)})`);
  assert.ok(roofAt(sm, -50) === sm[0] && roofAt(sm, 1e4) === sm[sm.length - 1], 'clamped at the edges');
});

test('a bat flies a smooth path: no jump between frames at 60 or 30 fps, quick darts, the same at any frame rate', () => {
  for (const seed of [1, 7, 42, 2024, 99991]) {
    const p = batPlan(seed), o = {};
    let maxStep60 = 0, maxStep30 = 0, maxV = 0, px = null, py = null, darts = 0;
    for (let f = 0; f <= 60 * 30; f++) {
      const t = f / 60;
      batAt(p, t, o);
      if (px !== null) { const d = Math.hypot(o.x - px, o.y - py); maxStep60 = Math.max(maxStep60, d); maxV = Math.max(maxV, d * 60); if (d * 60 > 90) darts++; }
      px = o.x; py = o.y;
    }
    px = null;
    for (let f = 0; f <= 30 * 30; f++) { batAt(p, f / 30, o); if (px !== null) maxStep30 = Math.max(maxStep30, Math.hypot(o.x - px, o.y - py)); px = o.x; py = o.y; }
    assert.ok(maxStep60 < 4.5, `seed ${seed}: ≤ 4.5 pt a frame at 60 fps (${maxStep60.toFixed(2)})`);
    assert.ok(maxStep30 < 9, `seed ${seed}: ≤ 9 pt a frame at 30 fps (${maxStep30.toFixed(2)})`);
    assert.ok(maxV > 100, `seed ${seed}: it darts (peak ${maxV.toFixed(0)} pt/s)`);
    assert.ok(darts > 10, `seed ${seed}: darts all through the flight`);
    // a pure function of t: sampling at 30 fps lands on the same points as 60
    const a = batAt(p, 12.5, {}), b = batAt(batPlan(seed), 12.5, {});
    assert.deepEqual(a, b);
  }
});

test('the dart hash is stable', () => {
  assert.equal(hash01(5, 3, 1), hash01(5, 3, 1));
  assert.notEqual(hash01(5, 3, 1), hash01(5, 4, 1));
  for (let i = 0; i < 200; i++) { const h = hash01(i * 7919, i, i & 3); assert.ok(h >= 0 && h < 1); }
});

test('a V is never perfect: uneven arms, stragglers with a gap, events — and the same seed draws the same flock', () => {
  let swaps = 0, drops = 0, twoStragglers = 0;
  for (let seed = 1; seed <= 200; seed++) {
    const n = 7 + (seed % 7), p = geesePlan(seed, n, 30), o = {};
    assert.equal(p.n, n);
    const str = [], inV = [];
    for (let i = 0; i < n; i++) (p.kind[i] === 2 ? str : inV).push(i);
    assert.ok(str.length >= 1 && str.length <= 2, 'one or two stragglers');
    if (str.length === 2) twoStragglers++;
    // each straggler trails its arm's last bird by a clear gap
    for (const s of str) {
      const arm = p.arm[s], front = Math.max(...inV.filter(i => p.arm[i] === arm).map(i => p.along[i]));
      assert.ok(p.along[s] - front >= 1.4, `seed ${seed}: the straggler's gap (${(p.along[s] - front).toFixed(2)})`);
      assert.ok(p.rate[s] >= 1.3, 'a straggler flaps harder');
    }
    // the spacing along an arm is irregular
    const gaps = [];
    for (let a = 0; a < 2; a++) { const al = inV.filter(i => p.arm[i] === a).map(i => p.along[i]).sort((x, y) => x - y); for (let k = 1; k < al.length; k++) gaps.push(al[k] - al[k - 1]); }
    if (gaps.length >= 3) assert.ok(Math.max(...gaps) - Math.min(...gaps) > 0.02, 'uneven spacing');
    for (const e of p.ev) e.type === 'swap' ? swaps++ : drops++;
    assert.ok(p.ev.length >= 1, 'something happens in every V');
    // smooth: no bird moves more than a sliver of a gap between frames (events + drift included)
    for (let i = 0; i < n; i++) {
      let pa = null, pc = null, pf = null;
      for (let f = 0; f <= 60 * 32; f += 1) {
        goosePose(p, i, f / 60, o);
        if (pa !== null) {
          assert.ok(Math.abs(o.along - pa) < 0.05 && Math.abs(o.across - pc) < 0.05, `seed ${seed} bird ${i} jumps at ${f}`);
          assert.ok(o.flap - pf > 0 && o.flap - pf < 0.3, 'the wingbeat runs forward, smoothly');
        }
        pa = o.along; pc = o.across; pf = o.flap;
      }
      assert.ok(o.along <= geeseTail(p), 'the tail covers every bird');
    }
    const q = geesePlan(seed, n, 30);
    assert.deepEqual(goosePose(q, n - 1, 9.25, {}), goosePose(p, n - 1, 9.25, {}));
  }
  assert.ok(drops > 120 && swaps > 60, `drops ${drops}, swaps ${swaps}`);
  assert.ok(twoStragglers > 20, `sometimes two stragglers (${twoStragglers})`);
});

test('arms of uneven length happen often', () => {
  let uneven = 0;
  for (let seed = 1; seed <= 100; seed++) {
    const p = geesePlan(seed, 11, 30), cnt = [0, 0];
    for (let i = 1; i < p.n; i++) if (p.kind[i] === 1) cnt[p.arm[i]]++;
    assert.ok(cnt[0] >= 1 && cnt[1] >= 1);
    if (cnt[0] !== cnt[1]) uneven++;
  }
  assert.ok(uneven > 40, `uneven arms in ${uneven} of 100`);
});
