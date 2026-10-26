// SP4 — the pure parts of the pass (docs/harbor.md#sp4): the JAZZ hush sign inside its pane at the SP3 window sizes, the seeded
// weather's CALM wind, the clouds' screen speed (minutes to cross, never seconds), the awning's drips by the rain, the window people's
// looks table (lit / shadow / silhouette / ghost — every moment has one), the web's build-up by date (tests/signdress.test.mjs has it).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hushPlan, hushGlass, HUSH } from '../js/core/harbor-hush.js';
import { SPEAK_WIN, SPEAK_V } from '../js/core/harbor-speakeasy.js';
import { look } from '../js/core/sky.js';
import { driftSpeed, driftX } from '../js/core/harbor-clouds.js';
import { dripRate, dripSheet, rateK as rainLevel } from '../js/core/harbor-weather.js';
import { MOMENTS, WINDOW_LOOKS, LOOK_WHY } from '../js/core/harbor-moments.js';

test('the hush sign: every lobby word sits INSIDE the lower-right pane, its tubes and their halo clear of the frame', () => {
  // (the geometry as hushsign.js reads it: the lower-right upstairs window — the third column × the first row, SP3's sizes)
  const [a, b] = SPEAK_WIN[2], [r0, r1] = SPEAK_V.rows[0];
  const glass = hushGlass(a, b, r0, r1), [g0, g1, h0, h1] = glass;
  for (const word of ['JAZZ', 'SWING', 'MOON', 'VELVET', 'GIN', 'TANGO']) {
    const P = hushPlan(word, glass), half = P.tube / 2, halo = P.tube * 0.75 * 1.2;   // (the lit sprite's halo: hushsign.js glow = w × 0.75)
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const r of P.rows) for (const l of r.letters) for (const p of l.polys) for (const [x, y] of p.pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    assert.ok(x0 - half - halo >= g0 && x1 + half + halo <= g1, `${word}: across — ${(x0 - half - halo).toFixed(2)} … ${(x1 + half + halo).toFixed(2)} in ${g0.toFixed(2)} … ${g1.toFixed(2)}`);
    assert.ok(y0 - half - halo >= h0 && y1 + half + halo <= h1, `${word}: up — ${(y0 - half - halo).toFixed(2)} … ${(y1 + half + halo).toFixed(2)} in ${h0.toFixed(2)} … ${h1.toFixed(2)}`);
    // centred: the block's middle within a few % of the glass's
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    assert.ok(Math.abs(cx - (g0 + g1) / 2) < (g1 - g0) * 0.06 && Math.abs(cy - (h0 + h1) / 2) < (h1 - h0) * 0.08, `${word}: centred (${cx.toFixed(2)}, ${cy.toFixed(2)})`);
  }
  assert.ok(HUSH.margin >= 0.18, 'the margin leaves room for the halo');
});

test('the seeded fallback is CALM: a light breeze (1–3.5 m/s) on every day of a year, never the old 2–6', () => {
  let max = 0, min = 99;
  for (let d = 0; d < 366; d++) {
    const L = look(Date.UTC(2026, 0, 1, 15) + d * 86400e3, 'America/Detroit', { wx: null });
    assert.ok(!L.live, 'no live answer: seeded');
    max = Math.max(max, L.wind); min = Math.min(min, L.wind);
    assert.ok(L.rain === 0 && L.storm === 0 && L.fog === 0, 'a dry seeded city');
  }
  assert.ok(min >= 1 && max <= 3.5, `the seeded wind ${min.toFixed(1)} … ${max.toFixed(1)} m/s`);
});

test('the clouds cross a phone in MINUTES: the screen speed bounded, the nearest cumulus ≥ 2.5 min across 402 pt in a gale, far cirrus slower', () => {
  assert.ok(driftSpeed(0) >= 0.4 && driftSpeed(1.6) < 1.1 && driftSpeed(6) < 2.5 && driftSpeed(30) <= 2.6, `speeds ${[0, 1.6, 6, 30].map(w => driftSpeed(w).toFixed(2)).join(' / ')}`);
  for (const wind of [0, 1.6, 6, 15, 40]) {
    const near = { x0: 0, w: 120, v: 1.2 }, far = { x0: 0, w: 120, v: 0.18 };
    const secNear = 402 / (driftSpeed(wind) * near.v), secFar = 402 / (driftSpeed(wind) * far.v);
    assert.ok(secNear >= 128, `wind ${wind}: the nearest cloud takes ${secNear.toFixed(0)} s to cross 402 pt`);
    assert.ok(secFar > secNear * 4, `wind ${wind}: cirrus far slower (${secFar.toFixed(0)} s)`);
    // driftX moves with it (and wraps): after 60 s a near cloud moved less than a sixth of the screen in a breeze
    const dx = driftX(near, 60, 1.6, 1, 402) - driftX(near, 0, 1.6, 1, 402);
    assert.ok(Math.abs(dx) > 20 && Math.abs(dx) < 402 / 5, `60 s in a breeze: ${dx.toFixed(0)} pt`);
  }
});

test("the awning's drips scale with the rain: drizzle an occasional drip, rain a steady line, heavy a running fringe + the corners' sheets; tapering after", () => {
  const dz = dripRate(rainLevel(0.3), 1), rn = dripRate(rainLevel(4), 1), hv = dripRate(rainLevel(12), 1);
  assert.ok(dz > 0.5 && dz < 3, `drizzle ${dz.toFixed(1)} a second`);
  assert.ok(rn > 8 && rn < 16, `rain ${rn.toFixed(1)} a second`);
  assert.ok(hv >= 25 && hv > rn && rn > dz, `heavy ${hv.toFixed(1)} a second`);
  assert.equal(dripSheet(rainLevel(0.3)), 0, 'no sheet in drizzle'); assert.equal(dripSheet(rainLevel(4)), 0, 'no sheet in rain'); assert.ok(dripSheet(rainLevel(12)) > 0.8, 'the corners pour in heavy rain');
  // after the rain: only the dying drips, less each minute, nothing once they are gone
  const after = [1, 0.75, 0.5, 0.25, 0].map(d => dripRate(0, d));
  for (let i = 1; i < after.length; i++) assert.ok(after[i] < after[i - 1], `tapering ${after.map(v => v.toFixed(2)).join(' → ')}`);
  assert.equal(after[after.length - 1], 0);
  // monotonic in the rain
  let prev = 0; for (let r = 0.05; r <= 1; r += 0.05) { const v = dripRate(r, 0); assert.ok(v >= prev, `monotonic at ${r.toFixed(2)}`); prev = v; }
});

test('the window people: every moment has a look, the rule holds — the jazz shade is a shadow, the dark rooms + the TV are silhouettes, lit rooms are lit', () => {
  for (const m of MOMENTS) assert.ok(WINDOW_LOOKS[m.id], `${m.id} has a look`);
  for (const [id, look] of Object.entries(WINDOW_LOOKS)) { assert.ok(LOOK_WHY[look], `${id}: ${look} is a known look`); assert.ok(MOMENTS.some(m => m.id === id), `${id} is a moment`); }
  for (const id of ['dance', 'sax', 'mummy']) assert.equal(WINDOW_LOOKS[id], 'shadow', `${id}: on the jazz shade`);
  for (const id of ['witchsil', 'lights-out', 'cat']) assert.equal(WINDOW_LOOKS[id], 'silhouette', `${id}: a dark room / the TV`);
  assert.equal(WINDOW_LOOKS.ghost, 'ghost');
  for (const id of ['toast', 'costume', 'tango', 'mirror', 'wake', 'peek', 'bartender', 'ofrenda']) assert.equal(WINDOW_LOOKS[id], 'lit', `${id}: lit`);
});
