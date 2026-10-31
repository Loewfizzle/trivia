// ATM-A — THE WIND AS ONE SYSTEM (core/harbor-wind.js): the input, the side on screen, the gusts as waves rolling from upwind, the looks
import test from 'node:test';
import assert from 'node:assert/strict';
import { WIND, windInput, windSide, windFrame, gustsNear, gustEnv } from '../js/core/harbor-wind.js';

test('THE INPUT: the live wind + gusts + direction; no answer = a calm, plausible air', () => {
  assert.deepEqual(windInput({}), { speed: WIND.calm, gust: WIND.calm * 1.5, dir: 250, src: 'calm' });
  const w = windInput({ wind: 12, gust: 8, dir: 90 });
  assert.equal(w.speed, 12); assert.equal(w.gust, 12, 'a gust never under the mean'); assert.equal(w.dir, 90); assert.equal(w.src, 'live');
  assert.equal(windInput({ wind: 5 }).gust, 7, 'no gust given: 1.4 × the mean');
});

test('THE SIDE ON SCREEN (we face south): a west wind blows left, an east wind right — the leaves\' + smoke\'s old sign', () => {
  assert.equal(windSide(270), -1); assert.equal(windSide(250), -1); assert.equal(windSide(90), 1); assert.equal(windSide(null), -1);
});

test('THE LOOKS: calm < breeze < windy < gale, each clearly apart; the level + the lean grow with the speed', () => {
  const at = (s, g = s * 1.5) => windFrame(windInput({ wind: s, gust: g, dir: 270 }), 100);
  assert.equal(at(1).look, 'calm'); assert.equal(at(4.5).look, 'breeze'); assert.equal(at(13).look, 'windy'); assert.equal(at(21).look, 'gale');
  const lv = [1, 4.5, 13, 21].map(s => at(s).level);
  for (let i = 1; i < lv.length; i++) assert.ok(lv[i] - lv[i - 1] > 0.15, `level steps apart: ${lv.map(v => v.toFixed(2)).join(' < ')}`);
  assert.ok(at(21).level >= 0.95 && at(1).level < 0.05);
  assert.ok(at(21).lean > at(13).lean && at(13).lean > at(4.5).lean);
  assert.ok(at(21).cross < at(4.5).cross, 'a gale\'s gusts cross faster');
});

test('GUSTS ARE WAVES: seeded (every phone the same), each swelling + dying, ROLLING FROM THE UPWIND EDGE with a real delay', () => {
  assert.deepEqual(gustsNear(500, 0.7, 0.6, 1924), gustsNear(500, 0.7, 0.6, 1924), 'the same dice for the same moment');
  const g = { t0: 0, s: 1, hold: 1 };
  assert.equal(gustEnv(-0.1, g), 0); assert.ok(gustEnv(WIND.rise / 2, g) > 0.3 && gustEnv(WIND.rise / 2, g) < 0.7);
  assert.equal(gustEnv(WIND.rise + 0.5, g), 1); assert.equal(gustEnv(WIND.rise + 1 + WIND.fall + 0.01, g), 0);
  // find a gust in a windy hour + watch it cross: from the west (blowing LEFT) it reaches the screen's RIGHT edge first
  const inp = windInput({ wind: 13, gust: 22, dir: 270 });
  let found = null;
  for (let t = 1000; t < 1600 && !found; t += 0.25) { const f = windFrame(inp, t); if (f.at(1) > 0.4 && f.at(0) < 0.05) found = t; }
  assert.ok(found, 'a gust front on the upwind (right) side while the left is still calm');
  const f0 = windFrame(inp, found), cross = f0.cross;
  const later = windFrame(inp, found + cross * 0.9);
  assert.ok(later.at(0) > f0.at(0) + 0.2, `…and it reaches the left ~${cross.toFixed(1)} s later (${f0.at(0).toFixed(2)} → ${later.at(0).toFixed(2)})`);
});

test('LULLS + GUSTS: the wind sits under its mean between gusts, up to the gust speed in one; signed toward the side it blows', () => {
  const inp = windInput({ wind: 12, gust: 20, dir: 90 });
  let lo = 99, hi = 0;
  for (let t = 0; t < 900; t += 0.5) { const v = windFrame(inp, t).v(0.5); lo = Math.min(lo, v); hi = Math.max(hi, v); }
  assert.ok(lo > 0, 'an east wind blows right (+)');
  assert.ok(Math.abs(lo - 12 * WIND.lull) < 0.01, `the lulls at ${lo.toFixed(1)} m/s`);
  assert.ok(hi > 17 && hi <= 20.001, `the gusts up to ${hi.toFixed(1)} m/s`);
  // a calm hour: no gusts at all
  let any = 0; for (let t = 0; t < 600; t += 1) any += windFrame(windInput({ wind: 0.5, gust: 0.8 }), t).gusts;
  assert.equal(any, 0, 'calm air: no gusts');
});
