// CITY 2.0 — POL4: THE BACK ROAD'S TRAFFIC (core/harbor-traffic.js) + THE VEHICLE KIT's cycle (screens/harbor/vehicles.js#vehicleFor) —
// PURE: the cars obey the signal, queue without touching (behind the bus too), never stand on the crosswalk during WALK, vary their model.
import test from 'node:test';
import assert from 'node:assert/strict';
import { cameraFor, harborLayout } from '../js/core/harbor-layout.js';
import { folkMap, folkAt } from '../js/core/harbor-people.js';
import { trafficLanes, laneSpawns, backVehicle, TRAFFIC, carsAt, simulateLane } from '../js/core/harbor-traffic.js';

test('Oct 25 — NO TRAFFIC DURING THE LEGENDARIES: no car enters the back road under a hold; one already rolling finishes; the same through carsAt', () => {
  const { L } = setup(), lanes = trafficLanes(L), ctx = { off: OFF, seed: 1924 };
  const t0 = Date.parse('2026-10-22T13:00:00-04:00') / 1000, j = Math.floor(t0 / TRAFFIC.block);
  const sp = laneSpawns(j, 'far', ctx);
  assert.ok(sp.length >= 1, 'a day block has spawns');
  const victim = sp[sp.length - 1], hold = [victim.t0 - 2, victim.t0 + 40];
  const plain = simulateLane(j, 'far', { lanes, buses: [], ...ctx }), held = simulateLane(j, 'far', { lanes, buses: [], ...ctx, hold });
  assert.ok(plain.cars.some(c => c.id === victim.id), 'without the hold it drives');
  assert.ok(!held.cars.some(c => c.id === victim.id), 'under the hold it never enters');
  for (const c of held.cars) assert.ok(c.ts < hold[0] || c.ts >= hold[1], `${c.id} entered outside the hold`);
  // a car that entered before the hold keeps rolling under it — its samples run on past the hold's start
  const earlier = held.cars.find(c => c.ts < hold[0] && c.ts + c.xs.length * TRAFFIC.dt > hold[0]);
  if (earlier) assert.ok(earlier.xs.length > 2, 'the earlier car finishes its crossing');
  // the public API: the simulation is keyed by the hold, so a hold appearing mid-session (a forced run) takes at once
  const world = { L, busesIn: () => [], off: OFF, seed: 1924 };
  const a = carsAt(victim.t0 + 3, world), b = carsAt(victim.t0 + 3, { ...world, hold });
  assert.ok(a.some(c => c.id === victim.id) && !b.some(c => c.id === victim.id), 'carsAt: there without the hold, gone with it');
});
import { signalAt } from '../js/core/harbor-promenade.js';

const OFF = -240;
const setup = (W = 402, H = 874) => { const cam = cameraFor(W, H, { dock: { x: 14, y: H - 116, w: W - 28, h: 76 } }); return { cam, L: harborLayout(cam) }; };

test('POL4 — THE BACK ROAD: the cars stop for the light, never on the crosswalk while people may walk, never touching (each other or the bus), every phone the same', () => {
  const { L } = setup(), M = folkMap(L), cache = new Map(), lanes = trafficLanes(L), cw = L.crosswalk;
  const t0 = Date.parse('2026-10-22T08:00:00-04:00') / 1000;
  let seen = 0, stopped = 0;
  const models = new Set();
  for (let t = t0; t < t0 + 3 * 3600; t += 0.5) {
    const f = folkAt(t, { L, M, ctx: { off: OFF } }, cache), S = signalAt(t * 1000);
    for (const c of f.cars) {
      seen++; models.add(c.model);
      const front = c.x + c.dir * c.len / 2, back = c.x - c.dir * c.len / 2;
      // (on WALK the road is red: nobody's body over the crosswalk)
      if (S.walk === 'walk') assert.ok(Math.max(front, back) < cw.x0 - 0.05 || Math.min(front, back) > cw.x1 + 0.05, `${c.id} on the crosswalk during WALK (x ${c.x.toFixed(2)})`);
      if (c.speed < 0.05) stopped++;
    }
    // (no two in a lane overlapping; the near lane's cars never inside the bus)
    for (const lane of ['near', 'far']) {
      const cs = f.cars.filter(c => c.lane === lane).sort((a, b) => a.x - b.x);
      for (let i = 1; i < cs.length; i++) assert.ok(cs[i].x - cs[i - 1].x >= (cs[i].len + cs[i - 1].len) / 2 + 0.3, `${cs[i - 1].id} + ${cs[i].id} overlap (${(cs[i].x - cs[i - 1].x).toFixed(2)})`);
      if (lane === 'near') for (const b of f.buses) { const bx = b.xNow; for (const c of cs) assert.ok(Math.abs(c.x - bx) >= (c.len + b.len) / 2 + 0.3, `${c.id} inside the bus (${(c.x - bx).toFixed(2)})`); }
    }
  }
  assert.ok(seen > 1500, `traffic by day (${seen} car-samples)`);
  assert.ok(stopped > 100, `cars wait at the light (${stopped})`);
  assert.ok(models.size === 7, `every model on the back road (${[...models].join(', ')})`);
  // every phone the same: a fresh cache gives the same cars
  const t = t0 + 1234.5, a = folkAt(t, { L, M, ctx: { off: OFF } }, new Map()).cars, b = folkAt(t, { L, M, ctx: { off: OFF } }, cache).cars;
  assert.deepEqual(a.map(c => [c.id, c.x.toFixed(3)]), b.map(c => [c.id, c.x.toFixed(3)]));
  assert.ok(lanes.near.dir === 1 && lanes.far.dir === -1, 'the near lane eastbound, the far westbound');
});

test('POL4 — THE BACK ROAD runs a red? never: a car passing its stop line does so on green or (too close to stop) amber', () => {
  const { L } = setup(), M = folkMap(L), cache = new Map(), lanes = trafficLanes(L);
  const t0 = Date.parse('2026-10-23T12:00:00-04:00') / 1000, prev = new Map();
  let crossings = 0;
  for (let t = t0; t < t0 + 2 * 3600; t += 0.1) {
    const f = folkAt(t, { L, M, ctx: { off: OFF } }, cache), S = signalAt(t * 1000);
    for (const c of f.cars) {
      const ln = lanes[c.lane], front = c.dir * (c.x + c.dir * c.len / 2 - ln.line), p = prev.get(c.id);
      if (p != null && p <= 0.05 && front > 0.05) { crossings++; assert.ok(S.road !== 'red', `${c.id} crossed its line on red`); }
      prev.set(c.id, front);
    }
  }
  assert.ok(crossings > 30, `${crossings} cars through the crossing`);
});

test('POL4 — THE VEHICLES vary: never the same model twice in a row (the back road + the street under the dock); party nights only glow', async () => {
  const { vehicleFor, MODELS, SEQ } = await import('../js/screens/harbor/vehicles.js');
  for (const road of ['back', 'street']) for (let n = -50; n < 400; n++) assert.notEqual(vehicleFor(n, road).model, vehicleFor(n + 1, road).model, `${road} ${n}`);
  for (let n = 0; n < 200; n++) assert.notEqual(backVehicle(n).model, backVehicle(n + 1).model);
  assert.ok(SEQ.street.every(id => MODELS[id].h <= 2.2), 'the street under the dock: only cars under the dock\'s top');
  const glowOn = j => laneSpawns(j, 'near', { off: OFF }).some(s => s.glow >= 0);
  const sat = Math.floor(Date.parse('2026-10-24T22:30:00-04:00') / 1000 / TRAFFIC.block), thu = Math.floor(Date.parse('2026-10-22T22:30:00-04:00') / 1000 / TRAFFIC.block);
  let gs = 0, gt = 0; for (let k = 0; k < 30; k++) { if (glowOn(sat + k)) gs++; if (glowOn(thu + k)) gt++; }
  assert.ok(gs > 3 && gt === 0, `a party night's underglow (${gs} blocks) — never on a Thursday (${gt})`);
  void carsAt;
});
