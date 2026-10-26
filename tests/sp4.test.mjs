// SP4 — the pure parts of the pass (docs/harbor.md#sp4): the JAZZ hush sign inside its pane at the SP3 window sizes, the seeded
// weather's CALM wind, the clouds' screen speed (minutes to cross, never seconds), the awning's drips by the rain, the window people's
// looks table (lit / shadow / silhouette / ghost — every moment has one), the web's build-up by date (tests/signdress.test.mjs has it).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wallPlan, HUSH_WALL } from '../js/core/harbor-hush.js';
import { SPEAK_WIN, SPEAK_V } from '../js/core/harbor-speakeasy.js';
import { look } from '../js/core/sky.js';
import { driftSpeed, driftX } from '../js/core/harbor-clouds.js';
import { dripRate, dripSheet, rateK as rainLevel } from '../js/core/harbor-weather.js';
import { MOMENTS, WINDOW_LOOKS, LOOK_WHY } from '../js/core/harbor-moments.js';

test("WIN — the hush word on the WALL: every lobby word stacked on its plate inside the corner pier (over the sconce, under the washer), its tubes + halo clear of the plate's edge, centred; 4 letters ~15 pt at 402, 5 ~12", () => {
  const H = HUSH_WALL, K402 = 13.6;   // (≈ pt a wall unit on a 402 phone)
  for (const word of ['JAZZ', 'SWING', 'MOON', 'VELVET', 'GIN', 'TANGO']) {
    const P = wallPlan(word), [p0, p1, q0, q1] = P.plate, half = P.tube / 2, halo = P.tube * 0.75 * 1.2;
    assert.equal(P.letters.map(l => l.ch).join(''), word.slice(0, 6), `${word}: one letter a row, top → bottom`);
    for (let i = 1; i < P.letters.length; i++) assert.ok(P.letters[i].base < P.letters[i - 1].base, `${word}: stacked downward`);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const l of P.letters) for (const p of l.polys) for (const [x, y] of p.pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    assert.ok(x0 - half - halo >= p0 && x1 + half + halo <= p1 && y0 - half - halo >= q0 && y1 + half + halo <= q1, `${word}: the tubes + halo inside the plate`);
    assert.ok(p0 >= H.u0 + H.margin - 1e-6 && p1 <= H.u1 - H.margin + 1e-6 && q0 >= H.v0 - 1e-6 && q1 <= H.v1 + 1e-6, `${word}: the plate inside the pier's run (${p0.toFixed(2)}–${p1.toFixed(2)} × ${q0.toFixed(2)}–${q1.toFixed(2)})`);
    assert.ok(Math.abs((p0 + p1) / 2 - (H.u0 + H.u1) / 2) < 1e-6 && Math.abs((q0 + q1) / 2 - (H.v0 + H.v1) / 2) < 0.02, `${word}: centred in the pier`);
  }
  // (WIN2: the right washer gone while the sign is lit — the run to 9.62: ~17 pt for four letters)
  assert.ok(wallPlan('JAZZ').cap * K402 > 16 && wallPlan('JAZZ').cap * K402 < 18, `four letters ${(wallPlan('JAZZ').cap * K402).toFixed(1)} pt at 402`);
  assert.ok(wallPlan('SWING').cap * K402 > 12.5, `five letters ${(wallPlan('SWING').cap * K402).toFixed(1)} pt at 402`);
  assert.equal(wallPlan('GIN').cap, wallPlan('JAZZ').cap, 'a 3-letter word sized as four (never huge)');
  assert.equal(wallPlan(''), null, 'no word, no sign');
  assert.ok(H.v0 > 3.43 && H.v1 < 9.85, "the run: over the sconce, under the cornice (the washer is gone while the sign is lit)");
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
