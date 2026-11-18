// JAYWALK THE TOUCH-UP PASS — THE SHARE PICTURE SHOWS THE KID (js/games/jaywalk/shot.js#shotMs; docs/jaywalk.md "THE TOUCH-UP PASS"):
// the frame's moment per cause is one the scene still draws him at (night.js's own end clocks), always before the end screen rests the scene
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SHOT_AT, CAR_SHOT_HIT, shotMs, carClearMs } from '../js/games/jaywalk/shot.js';
import { FP } from '../js/games/jaywalk/tuning.js';

const src = f => readFileSync(new URL(`../js/games/jaywalk/${f}`, import.meta.url), 'utf8'), num = (f, re) => Number(re.exec(src(f))[1]);
// (view.js + flyers.js reach the database / three.js — read as text: THE UNIT JOB INSTALLS NOTHING)
const END_HOLD = num('view.js', /export const END_HOLD_MS = (\d+);/);
const FLY = { abductMs: num('flyers.js', /abductMs: (\d+),/), liftMs: num('flyers.js', /liftMs: (\d+),/) };
const HOLD = /export const holdMs = run => \(run\.st === 'taken' \? (\d+) : run\.cause === 'ufo' \? FLY\.abductMs \+ (\d+) : run\.cause === 'blackbird' \? (\d+) : 0\);/.exec(src('flyers.js'));
const holdMs = r => (r.st === 'taken' ? +HOLD[1] : r.cause === 'ufo' ? FLY.abductMs + +HOLD[2] : r.cause === 'blackbird' ? +HOLD[3] : 0);

test('every end has its moment — while he is still drawn, before the end screen covers the scene', () => {
  for (const c of ['car', 'train', 'water', 'edge', 'wall', 'blackbird', 'ufo']) {
    const ms = shotMs({ st: 'out', cause: c });
    assert.ok(ms > 0 && ms < Math.max(END_HOLD, holdMs({ st: 'out', cause: c })) - 100, `${c}: ${ms} ms, before the end screen`);
  }
  assert.ok(SHOT_AT.taken < holdMs({ st: 'taken' }) - 100, 'the Mothership: inside its own hold');
  // night.js's end clocks (ms since the hit): the sink is done at 380 (the edge: 260 + 380) · the dark swallows him by 420 · the train
  // throws him off the frame by ~260 · the UFO lifts him from 380 to ~1530 · the Mothership's lift starts at 520 and he is gone by its end
  assert.ok(SHOT_AT.water < 380 * 0.5 && SHOT_AT.edge > 260 && SHOT_AT.edge < 260 + 380 * 0.5, 'water: mid-splash, head + arms up');
  assert.ok(SHOT_AT.wall < 420 * 0.25, 'the blackout / the fog: as it reaches him');
  assert.ok(SHOT_AT.train >= 90 && SHOT_AT.train < 260, 'the train: knocked up beside it, still on the frame');
  assert.ok(SHOT_AT.ufo > 380 + 150 && SHOT_AT.ufo < 380 + 1150 * 0.6, 'the UFO: mid-lift in the beam');
  assert.ok(SHOT_AT.taken > 520 + 300 && SHOT_AT.taken < 520 + FLY.liftMs * 0.6, 'the Mothership: rising in its beam');
  assert.equal(shotMs({ st: 'taken', cause: 'car' }), SHOT_AT.taken, 'taken wins over any cause');
});

test('a vehicle: as before when it has passed him by then — else the impact (it is still over him)', () => {
  // one road lane, one mover moving right at v FP a tick; the kid at x = 4500
  const lane = (len, v, off) => ({ type: 'road', dir: 1, v, period: 20000, pad: 2000, items: [{ off, len }] });
  const course = L => ({ lane: () => L });
  const kid = { st: 'out', cause: 'car', y: 9, x: 4500, end: 0, t: 0 };
  // a 1-cell car whose front just touched him (its left edge at 4500 - 300 - 1000 + 1): fast → gone by 460 ms
  const fast = lane(1 * FP, 120, 4500 - 300 - 1000 + 1 + 2000);
  assert.ok(carClearMs(course(fast), kid) <= SHOT_AT.car && shotMs(kid, course(fast)) === SHOT_AT.car, 'a fast car: the 460 ms frame (he lies flat behind it)');
  const van = lane(2 * FP, 40, 4500 - 300 - 2000 + 1 + 2000);
  assert.ok(carClearMs(course(van), kid) > SHOT_AT.car && shotMs(kid, course(van)) === CAR_SHOT_HIT, 'a slow van still over him: the impact');
  assert.equal(shotMs(kid, course({ type: 'grass' })), CAR_SHOT_HIT, 'no vehicle found: the impact');
  assert.equal(shotMs(kid), SHOT_AT.car, 'no course: as before');
  assert.ok(CAR_SHOT_HIT < 100, 'the impact: the first frames');
});
