// CITY 2.0 — C4c + SKY-B: THE PHONE BENCH's pure parts (js/screens/harbor/bench.js): the scenes, the profile, the links, the numbers, the
// report's text.
import test from 'node:test';
import assert from 'node:assert/strict';
import { BENCH_SCENES, BENCH_PROFILE, PROFILE_Q, BENCH, benchStats, benchText, benchUrl } from '../js/screens/harbor/bench.js';
import { REMOTE_KEYS, EVENTS } from '../js/core/harbor-remote.js';

test('C4c — THE PHONE BENCH: the heavy scenes (a party peak, a dance break, party + snow, Halloween, the UFO, the TR-3B, the Blackbird, a storm + MODELS: the Mothman, the patrol) as preview states the panel knows', () => {
  assert.deepEqual(BENCH_SCENES.map(s => s.id), ['party', 'party-break', 'party-snow', 'halloween', 'ufo', 'tr3b', 'blackbird', 'storm', 'fog', 'freezing', 'blizzard', 'mothman', 'patrol']);
  for (const s of [...BENCH_SCENES, { id: 'profile', q: PROFILE_Q }]) for (const k of Object.keys(s.q)) assert.ok(REMOTE_KEYS.includes(k), `${s.id}: ${k} is a preview key`);
  const per = s => 12000 + BENCH.cool + BENCH.settle + (s.measure || BENCH.measure) + BENCH.fill;
  const ms = BENCH_SCENES.reduce((a, s) => a + per(s), 0) + BENCH_PROFILE.reduce((a) => a + per({ measure: BENCH.profile }), 0);
  assert.ok(ms > 6 * 60000 && ms < 17 * 60000, `${(ms / 60000).toFixed(1)} min in all`);   // (ATM-B: + fog, freezing rain + the blizzard — ~14 min; the scenes + the profile also run apart)
});
test('SKY-B — THE PROFILE: the dance break with one piece off at a time — every switch is a real preview flag; the first row everything on', () => {
  assert.equal(BENCH_PROFILE[0].off, '');
  const ids = new Set(EVENTS.map(r => r.id));
  for (const p of BENCH_PROFILE.slice(1)) assert.ok(ids.has(p.off), `${p.id}: &force=${p.off} has a panel row`);
});
test('SKY-B — A FRESH PAGE PER STEP: the link keeps the page\'s own flags (debug, dpr) + the step\'s (when, wx, force) + the bench\'s own; Grand Rapids when the page had no place', () => {
  const u = new URL(benchUrl('https://neonspeakeasy.com/?city=2&debug=1&dpr=3&when=2020-01-01T00:00&force=dance&bench=1', { q: { when: '2026-10-24T22:06:20', wx: 'clear' }, off: 'no-wands' }, false));
  const p = u.searchParams;
  assert.equal(p.get('debug'), '1'); assert.equal(p.get('dpr'), '3'); assert.equal(p.get('when'), '2026-10-24T22:06:20'); assert.equal(p.get('wx'), 'clear');
  assert.equal(p.get('force'), 'no-wands'); assert.equal(p.get('bench'), '1'); assert.equal(p.get('benchrun'), '1'); assert.equal(p.get('benchfast'), null);
  assert.equal(p.get('tz'), 'America/Detroit'); assert.equal(p.get('at'), '42.96,-85.67');
  const u2 = new URL(benchUrl('http://localhost:5173/?city=2&tz=Europe/Paris&at=1,2', { q: { when: 'x', force: 'blackbird' } }, true));
  assert.equal(u2.searchParams.get('force'), 'blackbird'); assert.equal(u2.searchParams.get('tz'), 'Europe/Paris'); assert.equal(u2.searchParams.get('benchfast'), '1');
});
test('C4c — THE PHONE BENCH: the numbers (fps from the frames, the percentiles, slow = over 20 ms, the work, OUTSIDE the JS) + the report carries every row, its steps, the profile\'s deltas + the memory guard', () => {
  const s = benchStats([16.7, 16.7, 16.7, 33.3, 16.7, 16.7, 50, 16.7, 16.7, 16.7], [2, 2, 3, 9, 2, 2, 12, 2, 2, 2]);
  assert.equal(s.n, 10); assert.equal(s.p50, 16.7); assert.equal(s.worst, 50); assert.equal(s.slow, 20); assert.equal(s.work, 3.8); assert.equal(s.side, 14.7);
  assert.ok(Math.abs(s.fps - 1000 * 10 / 216.6) < 0.2, `fps ${s.fps}`);
  assert.deepEqual(benchStats([], []), { n: 0, fps: 0, p50: 0, p95: 0, worst: 0, slow: 0, work: 0, workP95: 0, side: 0 });
  const full = { id: 'p-full', profile: true, scene: 'the dance break, everything on', stats: benchStats([20, 20, 20], [10, 10, 10]), tier0: '2/2', tier1: '2/2', mem: '70.0' };
  const noPeople = { id: 'p-people', profile: true, scene: '… without ANY people', stats: benchStats([16.7, 16.7, 16.7], [6, 6, 6]), tier0: '2/2', tier1: '2/2', mem: '66.0' };
  const t = benchText({ at: 'now', ua: 'iPhone', w: 402, h: 874, dpr: 3, cityDpr: 2, cap: 2 }, [{ scene: 'a party', stats: s, tier0: '2/2', tier1: '1/2', mem: '81.0', steps: [{ at: 9.5, dir: 'down', text: '2/2 → 1/2 (effects — live)' }], why: 'party 100%', fill: { mp: 13.1, screens: 9.4, calls: 900, paths: 2300, layers: 14, layerMp: 2.1 }, cpu: '100 % → 97 %' }, full, noPeople], { phone: 'the screen\'s idle rate 60 fps', guard: 'nothing stepped down', tierLog: [{ at: 9.5, dir: 'down', text: '2/2 → 1/2' }] });
  for (const w of ['THE PHONE BENCH', 'device dpr 3', 'a party', '2/2→1/2', '↓ 9.5 s', 'memory guard: nothing stepped down', 'every quality step', 'FRESH PAGE', 'outside', 'painted a frame: 13.1 MP (9.4 screens)', 'CPU speed 100 %', 'idle rate 60 fps', 'WHAT COSTS THE PARTY', '→ frame p50 -3.3 ms · work -4 ms']) assert.ok(t.includes(w), `the report says "${w}"`);
});

test('MODELS — THE LOAD FREEZE: each row says the first frame, the longest stall (+ when, if ≥ 0.25 s), the stalls, when steady, the longest task, the bake', async () => {
  const { loadLine } = await import('../js/screens/harbor/bench.js');
  const l = loadLine({ first: 1.23, freeze: 2400, at: 3.1, stalls: 3, steady: 7.4, task: 1900, ready: 6300 });
  assert.match(l, /first frame at 1\.2 s/); assert.match(l, /longest freeze 2\.4 s \(at 3\.1 s\)/); assert.match(l, /3 stalls/); assert.match(l, /steady at 7\.4 s/); assert.match(l, /longest task 1\.9 s/); assert.match(l, /baked in 6\.3 s/);
  const m = loadLine({ first: 0.5, freeze: 40, at: 1, stalls: 0, steady: null, task: null, ready: 900 });
  assert.doesNotMatch(m, /\(at /); assert.match(m, /NOT before the bakes/);
  const t = benchText({ at: 'now', ua: 'x', w: 402, h: 874, dpr: 3, cityDpr: 2, cap: 2 }, [{ scene: 's', stats: benchStats([16, 17], [5, 6]), tier0: '2/2', tier1: '2/2', mem: '1', steps: [], load: { first: 1, freeze: 900, at: 2, stalls: 1, steady: 4, task: null, ready: 3000 } }]);
  assert.match(t, /SILENT/); assert.match(t, /load: the first frame/);
});
