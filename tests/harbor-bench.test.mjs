// CITY 2.0 — C4c: THE PHONE BENCH's pure parts (js/screens/harbor/bench.js): the scenes, the numbers, the report's text.
import test from 'node:test';
import assert from 'node:assert/strict';
import { BENCH_SCENES, BENCH, benchStats, benchText } from '../js/screens/harbor/bench.js';
import { REMOTE_KEYS } from '../js/core/harbor-remote.js';

test('C4c — THE PHONE BENCH: six heavy scenes (a party peak, party + snow, Halloween, the UFO, the TR-3B, a storm) as preview states the panel knows; ~3 min in all', () => {
  assert.deepEqual(BENCH_SCENES.map(s => s.id), ['party', 'party-break', 'party-snow', 'halloween', 'ufo', 'tr3b', 'blackbird', 'storm']);   // (NIGHT-B: + the street party's conga break)
  for (const s of BENCH_SCENES) for (const k of Object.keys(s.q)) assert.ok(REMOTE_KEYS.includes(k), `${s.id}: ${k} is a preview key`);
  const ms = BENCH_SCENES.reduce((a, s) => a + BENCH.settle + (s.measure || BENCH.measure), 0);
  assert.ok(ms > 120000 && ms < 240000, `${(ms / 60000).toFixed(1)} min`);
});
test('C4c — THE PHONE BENCH: the numbers (fps from the frames, the percentiles, slow = over 20 ms, the work) + the report carries every row, its steps + the memory guard', () => {
  const s = benchStats([16.7, 16.7, 16.7, 33.3, 16.7, 16.7, 50, 16.7, 16.7, 16.7], [2, 2, 3, 9, 2, 2, 12, 2, 2, 2]);
  assert.equal(s.n, 10); assert.equal(s.p50, 16.7); assert.equal(s.worst, 50); assert.equal(s.slow, 20); assert.equal(s.work, 3.8);
  assert.ok(Math.abs(s.fps - 1000 * 10 / 216.6) < 0.2, `fps ${s.fps}`);
  assert.deepEqual(benchStats([], []), { n: 0, fps: 0, p50: 0, p95: 0, worst: 0, slow: 0, work: 0, workP95: 0 });
  const t = benchText({ at: 'now', ua: 'iPhone', w: 402, h: 874, dpr: 3, cityDpr: 2, cap: 2 }, [{ scene: 'a party', stats: s, tier0: '2/2', tier1: '1/2', mem: '81.0', steps: [{ at: 9.5, dir: 'down', text: '2/2 → 1/2 (effects — live)' }], why: 'party 100%' }], { guard: 'nothing stepped down', tierLog: [{ at: 9.5, dir: 'down', text: '2/2 → 1/2' }] });
  for (const w of ['THE PHONE BENCH', 'device dpr 3', 'a party', '2/2→1/2', '↓ 9.5 s', 'memory guard: nothing stepped down', 'every quality step']) assert.ok(t.includes(w), `the report says "${w}"`);
});
