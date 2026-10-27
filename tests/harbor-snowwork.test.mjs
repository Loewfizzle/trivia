// CITY 2.0 — 9b: THE WINTER WORK (core/harbor-snowwork.js) + THE WINTER PEOPLE's schedule (screens/harbor/winterfolk.js#winterActs)
import test from 'node:test';
import assert from 'node:assert/strict';
import { workPasses, workSpawns, lastCleared, SNOWWORK } from '../js/core/harbor-snowwork.js';
import { winterActs, doorCleared } from '../js/screens/harbor/winterfolk.js';
import { simulateLane, trafficLanes } from '../js/core/harbor-traffic.js';

const T0 = 1800000000;   // (a fixed instant, s)

test('the plow: a pass each lane every ~40 min while it snows, the salt truck ~10 min after each near-lane pass; nothing on a dry day', () => {
  const p = workPasses(T0, T0 + 4 * 3600, { snowing: true, seed: 1924 });
  const near = p.filter(x => x.kind === 'plow' && x.lane === 'near'), far = p.filter(x => x.kind === 'plow' && x.lane === 'far'), salt = p.filter(x => x.kind === 'salter');
  assert.ok(near.length >= 5 && near.length <= 7 && far.length >= 5 && far.length <= 7, `${near.length} + ${far.length} passes in 4 h`);
  for (let i = 1; i < near.length; i++) assert.equal(Math.round(near[i].t0 - near[i - 1].t0), SNOWWORK.every);
  for (const s of salt) assert.ok(s.t0 - SNOWWORK.saltAfter < T0 || near.some(n => Math.abs(s.t0 - n.t0 - SNOWWORK.saltAfter) < 1), 'the salt follows a plow');
  assert.deepEqual(workPasses(T0, T0 + 4 * 3600, { snowing: false, fresh: false }), [], 'no snow: no work');
  assert.deepEqual(workPasses(T0, T0 + 3600, { snowing: true, seed: 7 }), workPasses(T0, T0 + 3600, { snowing: true, seed: 7 }), 'every phone the same');
});

test('the morning after: the clean-up round ~6:40 → 7:30 local; forced passes; never inside a hold (the parade, a raid)', () => {
  const off = -300, day0 = Math.floor((T0 + off * 60) / 86400) * 86400 - off * 60;     // (a local midnight)
  const m = workPasses(day0, day0 + 86400, { fresh: true, off, seed: 1924 });
  assert.equal(m.length, 4);
  for (const x of m) { const h = (x.t0 - day0) / 3600; assert.ok(h > 6.5 && h < 7.6, `at ${h.toFixed(2)} h`); }
  const f = workPasses(T0, T0 + 120, { forced: { plow: T0 + 5, salt: null } });
  assert.deepEqual(f.map(x => x.kind), ['plow', 'salter'], 'a forced plow + its salt truck behind it');
  const held = workPasses(T0, T0 + 4 * 3600, { snowing: true, seed: 1924, holds: [[T0, T0 + 4 * 3600]] });
  assert.deepEqual(held, [], 'nothing starts in a hold');
});

test('the plow drives in the back road\'s own simulation (the light, the queue) and the road is cleared after it', () => {
  const L = { crosswalk: { x0: -2, x1: 2 }, cam: { hw: () => 30 } }, lanes = trafficLanes(L);
  const ctx = { forced: { plow: T0 + 10, salt: null } }, j = Math.floor((T0 + 10) / 120);
  const sim = simulateLane(j, 'near', { lanes, extra: (jj, lane) => workSpawns(jj, lane, ctx), seed: 1924, off: -300 });
  const plow = sim.cars.find(c => c.model === 'plow');
  assert.ok(plow && plow.work === 'plow', 'the plow is a car of the near lane');
  assert.ok(plow.xs[plow.xs.length - 1] > lanes.near.xOut - 1, 'it crosses the whole road');
  assert.equal(lastCleared(T0 + 50, ctx), null, 'not cleared while it is still crossing');
  assert.ok(lastCleared(T0 + 120, ctx) != null, 'cleared once it has passed');
});

test('the winter people: the doorman\'s round + the shoveller the morning after; the snowball fight on weekend afternoons only; the slip on thaw nights', () => {
  const fresh = { stage: 'fresh', cover: 1, age: 0 }, older = { stage: 'older', cover: 0.9, age: 3 }, thaw = { stage: 'thaw', cover: 0.5, age: 4 };
  const lc = (h, dow, mi = 0) => ({ y: 2027, m: 1, d: 16, h, mi, dow });
  assert.ok(winterActs(lc(7, 3, 45), fresh).shovel && !winterActs(lc(12, 3), fresh).shovel, 'the doorman at 7:45, not at noon');
  assert.ok(winterActs(lc(10, 3), fresh).shoveller && !winterActs(lc(10, 3), older).shoveller, 'the shoveller the day it snowed');
  let weekend = 0, weekday = 0;
  for (let h = 12; h < 18; h += 0.05) { if (winterActs(lc(Math.floor(h), 6, Math.round((h % 1) * 60)), older).snowball) weekend++; if (winterActs(lc(Math.floor(h), 3, Math.round((h % 1) * 60)), older).snowball) weekday++; }
  assert.ok(weekend > 0 && weekday === 0, `the fight: ${weekend} samples on Saturday, ${weekday} on Wednesday`);
  assert.ok(!winterActs(lc(14, 6), thaw).snowball, 'no fight in the slush');
  assert.ok(winterActs(lc(20, 3), thaw).slip && !winterActs(lc(20, 3), older).slip, 'a slip only on a thaw night');
  assert.ok(!doorCleared(lc(7, 3), fresh) && doorCleared(lc(9, 3), fresh) && doorCleared(lc(7, 3), older), 'the steps cleared after his round');
  assert.ok(!winterActs(lc(7, 3, 45), { stage: 'none', cover: 0, age: 99 }).shovel, 'no snow: no shovel');
});
