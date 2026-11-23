// JAYWALK SMOOTH — what must hold (docs/jaywalk.md "SMOOTH"): THE FRAME METER is the lab's alone + reads dropped / worst frames.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DROP_MS, BIG_MS, frameStats } from '../js/games/jaywalk/lab-hud-stats.js';
import { createTiers, STUTTER, dropsIn } from '../js/games/kit/tiers.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

test('THE FRAME METER: lazy, the lab only — never the live game, never the start bundle', () => {
  assert.match(read('js/games/jaywalk/lab.js'), /Q\.get\('hud'\) === '1'[^\n]*lazyImport\(import\('\.\/lab-hud\.js'\)/);
  for (const f of ['js/games/jaywalk/view.js', 'js/games/jaywalk/night.js', 'js/games/jaywalk/index.js', 'js/games/preload-graph.js']) assert.doesNotMatch(read(f), /lab-hud/, f);
});

test('THE FRAME METER reads drops + the worst frame, not the median', () => {
  const steady = Array(600).fill(16.7), s = frameStats(steady);
  assert.equal(s.drops, 0); assert.equal(s.big, 0); assert.ok(Math.abs(s.fps - 59.9) < 0.2);
  const hitchy = [...steady.slice(0, 590), ...Array(6).fill(25), ...Array(4).fill(50)], h = frameStats(hitchy);
  assert.equal(h.p50, 16.7, 'the median cannot see it');
  assert.equal(h.drops, 10); assert.equal(h.big, 4); assert.equal(h.worst, 50);
  assert.ok(DROP_MS === 20 && BIG_MS === 33);
  assert.deepEqual(frameStats([]), { n: 0, fps: 0, drops: 0, big: 0, p50: 0, p95: 0, p99: 0, worst: 0 });
});

// a phone: `ms(tier, frame)` = this frame's interval · the tier's whole path over `seconds`
const drive = (ms, seconds, o = { stutter: true }, work = () => 2) => {
  const T = createTiers({ initial: 2, max: 2, ...o }), path = [2];
  let now = 1000, f = 0;
  while (now < 1000 + seconds * 1000) { now += ms(T.get(), f++); T.sample(now, work(T.get())); T.tick(now); if (T.get() !== path[path.length - 1]) path.push(T.get()); }
  return { path, capped: T.capped() };
};
const hitch = every => (t, f) => (f % every === 0 ? 34 : 16.7);

test('THE STUTTER RULE: a dropped frame is judged against the phone\'s own cadence', () => {
  const ring = new Float64Array(120); ring.fill(33.3);
  assert.equal(dropsIn(ring, 120, 0, 120, 33.3), 0, 'a steady 30 Hz cap drops nothing');
  ring.fill(16.7); for (let k = 0; k < 7; k++) ring[50 + k * 10] = 34;
  assert.equal(dropsIn(ring, 120, 0, 120, 16.7), 7);
  assert.equal(STUTTER.count, 6);
});

test('THE STUTTER RULE: stutters the p75 cannot see step down, and the step stays when it helped', () => {
  assert.deepEqual(drive(hitch(15), 40, {}).path, [2], 'without the option: the old rule never moves');
  const cured = drive((t, f) => (t === 2 && f % 15 === 0 ? 34 : 16.7), 120);
  assert.deepEqual(cured.path, [2, 1], `one step, and it stays: ${cured.path}`);
});

test('THE STUTTER RULE: a stutter the tier does not cause goes back up ONCE, and never flaps', () => {
  const r = drive(hitch(15), 300);
  assert.deepEqual(r.path, [2, 1, 2], `down, the probe, back, and quiet for five minutes: ${r.path}`);
  assert.equal(r.capped, false, 'a stutter is never read as the Low Power cap');
});

test('THE STUTTER RULE: iOS Low Power Mode (a steady 30 Hz, with jitter) is not a stutter', () => {
  const r = drive((t, f) => 33.3 + (f % 2 ? 1.2 : -1.2), 60);
  assert.equal(r.path[r.path.length - 1], 2); assert.equal(r.capped, true);
  assert.deepEqual(r.path, drive((t, f) => 33.3 + (f % 2 ? 1.2 : -1.2), 60, {}).path, 'exactly the path the old rule took: one probe of the cap, nothing added');
});

test('THE STUTTER RULE: a clean phone never moves; one stray hitch a few seconds apart never moves it', () => {
  assert.deepEqual(drive(() => 16.7, 60).path, [2]);
  assert.deepEqual(drive(hitch(240), 120).path, [2]);
  // one burst (an area loading, a banner): 1.5 s of hitches, then clean
  let at = 0; assert.deepEqual(drive((t, f) => { const v = at > 10000 && at < 11500 && f % 6 === 0 ? 34 : 16.7; at += v; return v; }, 60).path, [2], 'one burst never steps');
});
