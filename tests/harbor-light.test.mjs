// CITY 2.0 — THE LIGHT ON THE PROMENADE (core/harbor-light.js, FP3a / FREV A1 H2): one home for the lamps' light + the sun's shadow.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cameraFor, harborLayout } from '../js/core/harbor-layout.js';
import { lightSources, lightField, sunShadow, lampOn, treeLamps, roadLampAt, pieceCtx, REACH, FACE } from '../js/core/harbor-light.js';

const setup = (W = 402, H = 874) => { const cam = cameraFor(W, H, {}, { top: 59, bottom: 34 }); return harborLayout(cam, 'gr'); };

test('FP3a — THE LIGHT: the pools only at night, brightest at a lamp\'s heart; every lamp + the speakeasy\'s spill a source', () => {
  const L = setup();
  assert.equal(lightField(L, { lamps: 0 }), null, 'by day: no pools');
  const at = lightField(L, { lamps: 1 }), src = lightSources(L);
  assert.ok(src.length >= L.lamps.length + 2 && src.some(s => s.kind === 'spill'), 'the lamps + the spill');
  const lamp = src.find(s => s.kind === 'globe'), heart = at(lamp.x, lamp.z), edge = at(lamp.x + REACH.globe * 0.9, lamp.z);
  const lum = c => (c ? c[0] + c[1] + c[2] : 0);
  assert.ok(lum(heart) > lum(edge) * 3, 'the heart far brighter than the rim');
});

test('FP3a — THE LIGHT: a face takes the NEAREST lamp (its colour, reach, direction); none at night far away; the trees + the road read the same lamps', () => {
  const L = setup(), ctx = pieceCtx(L), g = L.lamps.find(l => l.kind === 'globe');
  const near = lampOn(ctx.lights, g.x + 1, g.z - 0.5, 1);
  assert.deepEqual(near.lcol, FACE.col.globe);
  assert.ok(near.lk > 0.5 && near.ld[1] > 0, `lit from above (${near.lk.toFixed(2)})`);
  assert.equal(lampOn(ctx.lights, g.x + 400, g.z, 1).lk, 0, 'out of reach: no lamp light');
  assert.equal(lampOn([], 0, 0, 1).lk, 0);
  const t = L.trees[0], tl = treeLamps(ctx, t);
  for (const l of tl) assert.ok(Math.abs(l.x) <= 10 + 2 && l.k > 0, 'a tree sees only its neighbours');
  const front = L.lamps.find(l => l.z <= 40);
  if (front) assert.ok(roadLampAt(L.lamps, front.x) > 0.9 && roadLampAt(L.lamps, front.x + 400) === 0, 'the car under a front lamp');
});

test('FP3a — THE SUN\'S SHADOW: away from the sun, longer when it\'s low, none at night or under a deck', () => {
  assert.equal(sunShadow({ night: 1 }, 2), null);
  assert.equal(sunShadow({ day: 1, ovc: 1 }, 2), null);
  const lo = sunShadow({ day: 1, sunEl: 8, sunDir: 1 }, 2), hi = sunShadow({ day: 1, sunEl: 50, sunDir: 1 }, 2);
  assert.ok(lo.dx < 0 && Math.hypot(lo.dx, lo.dz) > Math.hypot(hi.dx, hi.dz), 'a low sun on the right throws a longer shadow left');
});

test('FP3a — the stage ↔ props import cycle is broken (both read core/harbor-light.js)', () => {
  const src = f => readFileSync(new URL(`../js/screens/harbor/${f}`, import.meta.url), 'utf8');
  assert.ok(!/from '\.\/stage\.js'/.test(src('props.js')), 'props.js no longer imports stage.js');
  for (const f of ['motorcar.js', 'centre.js', 'people.js']) assert.ok(!/from '\.\/stage\.js'/.test(src(f)), `${f} reads the pure light module, not stage.js`);
});
