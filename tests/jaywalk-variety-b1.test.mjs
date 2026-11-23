// JAYWALK VARIETY B1 (docs/jaywalk.md "VARIETY B1"): THE VARIETY A FIXES (the shadow pops · the skyline snow · the clearer day view · the
// snow-start seam) — all a VIEW.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTiers, CAP_WORK_MS } from '../js/games/kit/tiers.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = f => readFileSync(join(ROOT, f), 'utf8');

test('B1 — THE SNOW-START SEAM: the ground\'s noise coordinate never wraps at lane 0 — only on a gateway lane (every 50)', () => {
  const fx = src('js/games/jaywalk/night-fx.js');
  assert.ok(!/mod\(vLane,\s*64\.0\)/.test(fx), 'no mod(lane, 64) left: lane −1 read as 63 — the hard line under the start');
  const m = /float lwOf\(float l\) \{ return l < 50\.0 \? l \+ 50\.0 : mod\(l, 50\.0\); \}/.exec(fx);
  assert.ok(m, 'lwOf is the one wrap');
  const lwOf = l => (l < 50 ? l + 50 : ((l % 50) + 50) % 50);
  // continuous from the lanes behind the start (the camera shows ≥ 9 back) through the whole opening; a jump only INTO a gateway lane
  for (let l = -20; l < 1000; l++) {
    const jump = lwOf(l + 1) - lwOf(l) !== 1;
    assert.equal(jump, (l + 1) % 50 === 0 && l + 1 >= 50, `lane ${l} → ${l + 1}`);
  }
  // (the gateway lane is a landmark's — its own paving + neon trim: a seam there is the kind change it already has)
  assert.equal(src('js/games/jaywalk/tuning.js').match(/export const STRETCH = (\d+);/)[1], '50');
});

test('B1 — THE SHADOW POPS: a CPU-bound phone is NOT a capped one — the probe never jumps it back to the top tier', () => {
  const run = (frameMs, workMs, seconds) => {
    const T = createTiers({ initial: 2, max: 2 });
    let now = 0; const path = [2];
    for (let i = 0; i < seconds * 1000 / frameMs(T.get()); i++) { now += frameMs(T.get()); T.sample(now, workMs(T.get())); T.tick(now); if (T.get() !== path[path.length - 1]) path.push(T.get()); }
    return { path, capped: T.capped() };
  };
  // slow frames at every tier because the CPU is busy (work well over CAP_WORK_MS): steps DOWN, never back up mid-run (the flap: 2 1 0 2 1 0)
  const busy = run(() => 40, () => CAP_WORK_MS + 10, 40);
  assert.deepEqual(busy.path, [2, 1, 0], `a busy CPU steps down and stays: ${busy.path}`);
  assert.equal(busy.capped, false);
  // the Low Power cap (light work, 30 Hz): still read as a cap — back to the top tier and it stays (PD6 unchanged)
  const cap = run(() => 33.3, () => 1.5, 30);
  assert.equal(cap.path[cap.path.length - 1], 2); assert.equal(cap.capped, true);
});

test('B1 — THE SHADOW POPS: the sun shadows FADE (1 s) on a tier change, the depth camera texel-snapped, the angle in whole degrees', () => {
  const n = src('js/games/jaywalk/night.js');
  assert.match(n, /sunF = !sunAble \|\| sunF < 0 \? sunT : sunT > sunF \? Math\.min\(sunT, sunF \+ dt \/ 1000\) : Math\.max\(sunT, sunF - dt \/ 1000\);/);
  assert.match(n, /uShK\.value = sunReal \? GR\.sun \* 0\.9 \* ease\(sunF\) : 0;/, 'the depth shadow by the fade');
  assert.match(n, /sunK = \(1 - ease\(sunF < 0 \? 0 : sunF\)\)/, 'the cheap blob the other way');
  assert.match(n, /Math\.round\(er \/ tx\) \* tx - er/, 'texel-snapped');
  assert.match(n, /const el = Math\.round\(Math\.max\(14, Math\.min\(68, GR\.key\[2\]\)\)\)/);
});

test('B1 — MORE CLEAR VIEW UP TOP: the DAY looks\' haze starts later (still full at the sea wall\'s foot), night unchanged', () => {
  const n = src('js/games/jaywalk/night.js');
  const m = /HAZE_LANES = ([\d.]+), HAZE_DAY = ([\d.]+);/.exec(n);
  assert.ok(m && Number(m[1]) === 4.4 && Number(m[2]) < 4.4 && Number(m[2]) >= 1.5, 'night 4.4 lanes (unchanged), day shorter — a soft edge kept');
  assert.match(n, /const hz = day && VA \? HAZE_DAY : HAZE_LANES/);
  assert.match(n, /f = 24\.5 \* k \+ \(footAt - 24\.5 \* k\) \* reveal/, 'the far edge (full haze) unchanged: no lane pops in at the top');
});

test('B1 — THE SKYLINE SNOW: one compositor layer in the winter pack, transform-only motion, still with reduce motion, hidden at rest', () => {
  const s = src('js/games/jaywalk/sky-snow.js');
  assert.match(s, /@keyframes jw-sky-fall \{ from \{ transform: translate3d\(0, 0, 0\); \} to \{ transform: translate3d\(-120px, 360px, 0\); \} \}/);
  assert.ok(!/@keyframes[^}]*\b(top|left|margin|background-position)\b/.test(s), 'transform only');
  assert.match(s, /prefers-reduced-motion: reduce\) \{ \.jw-sky-snow i \{ animation: none; \} \}/);
  // the tile moves exactly a whole number of tiles a loop (seamless): near 120 px tile × 3 down / 1 across; far 80 × 3 / 1
  assert.match(s, /background-size: 120px 120px/); assert.match(s, /background-size: 80px 80px/);
  assert.match(s, /translate3d\(-80px, 240px, 0\)/);
  for (const [w, h] of [...s.matchAll(/background-size: (\d+)px (\d+)px/g)].map(m => [Number(m[1]), Number(m[2])])) assert.ok((w === 120 || w === 80) && (w === 120 ? 360 % h === 0 : 240 % h === 0) && (w === 120 ? 120 % w === 0 : 80 % w === 0), `the ${w} × ${h} tile divides its loop`);
  // never in the start bundle
  assert.ok(!/sky-snow/.test(src('js/games/jaywalk/night.js')), 'the start bundle never imports it');
});
