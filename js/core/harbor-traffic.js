// CITY 2.0 — THE HARBOR, POL4: THE BACK ROAD'S TRAFFIC — the city's motorcars on the waterside road behind the promenade (the owner's
// POL4 add-on: "a VARIETY used on BOTH roads … never the same car twice in a row"). PURE (no DOM, no clock of its own: tests/harbor-
// traffic.test.mjs). The cars are THE VEHICLE KIT's (screens/harbor/vehicles.js); people.js draws them in its far pass (by depth with the
// bus + the crossers); the plan lives here.
//   THE LANES   the near lane eastbound (→, the bus's), the far lane westbound (←); both come out from behind the speakeasy on the left
//   THE LIGHT   every car obeys the crossing's signal (core/harbor-promenade.js#signalAt): it stops at its STOP LINE (short of the
//               crosswalk) on amber / red — unless too close to stop on amber — and pulls away a beat after green; the crossers only
//               step out on WALK (red for the road), so a car is never on the crosswalk then
//   QUEUES      each car keeps a gap to the one ahead (a car — or THE BUS, which the near lane's cars wait behind at its stop); nobody
//               overtakes, nobody runs into anyone
//   WHEN        per lane per BLOCK (120 s) a seeded handful by the hour (busy by day, a few in the evening, rare in the small hours; a
//               party night a few more, a third of them with a soft NEON UNDERGLOW); never a car spawned just ahead of a bus
// The motion is SIMULATED once per block + lane (0.1 s steps over the block and the minute after — every phone the same; a page
// opened mid-way lands mid-way) and sampled: carsAt(t) → who is where now.
import { signalAt, SIGNAL_CYCLE, SIGNAL_PERIOD } from './harbor-promenade.js';
import { rngFrom, hashString } from './rng.js';
import { partyAtT } from './harbor-moments.js';

/** the numbers: the cruise (u / s), acceleration + braking (u / s²), the gap kept (u), the reaction after green (s), the block (s), the
 *  cars a block per lane by the hour, the lanes' depth (z) + direction, how far off screen a car enters + leaves (u) */
export const TRAFFIC = Object.freeze({
  v: [5.0, 6.2], acc: 1.7, brake: 3.2, gap: 1.3, react: 0.7, block: 120, dt: 0.1, tail: 70, minGap: 7,
  perBlock: { day: [2, 4], evening: [1, 3], late: [0, 1], party: [2, 3] }, glow: 0.34,
  lanes: { near: { z: 56.3, dir: 1 }, far: { z: 59.7, dir: -1 } }, off: 9, stopBack: 0.8,
});
const LEN = { packard: 5.85, modelA: 4.5, taxi: 4.85, roadster: 4.6, modelT: 4.05, coupe: 4.55, van: 5.05 };
const SEQ = ['packard', 'modelA', 'taxi', 'roadster', 'modelT', 'coupe', 'van'];
/** the vehicle for a lane's nth car (a fixed cycle stepped every lap: never the same model twice in a row) — mirrors vehicles.js#vehicleFor */
export function backVehicle(n, salt = 0) {
  const L = SEQ.length, i = Math.floor(n), m = SEQ[(((i + Math.floor(i / L)) % L) + L) % L];
  const h = (Math.imul(i ^ 0x5bd1e995, 2654435761) ^ Math.imul(salt + 7, 40503)) >>> 0;
  return { model: m, len: LEN[m], h };
}
const localHour = (t, off) => ((((t + (off || 0) * 60) / 3600) % 24) + 24) % 24;
/** the road for a layout: each lane's z, direction, its stop line (where the FRONT bumper stops, short of the crosswalk), where it enters +
 *  leaves (world x) — the crosswalk's edges from the layout */
export function trafficLanes(L) {
  const cw = L.crosswalk, hw = z => (L.cam && L.cam.hw ? L.cam.hw(z) : 30);
  const out = {};
  for (const [id, ln] of Object.entries(TRAFFIC.lanes)) {
    const edge = hw(ln.z) + TRAFFIC.off;
    out[id] = { id, z: ln.z, dir: ln.dir, line: cw ? (ln.dir > 0 ? cw.x0 - TRAFFIC.stopBack : cw.x1 + TRAFFIC.stopBack) : 0, xIn: -ln.dir * edge, xOut: ln.dir * edge };
  }
  return out;
}
/** the spawns of lane `lane` in block j (PURE): [{ id, n (its number in the lane — the model's cycle), t0 (enters), v, model, len, glow }] */
export function laneSpawns(j, lane, ctx = {}) {
  const B = TRAFFIC.block, t0 = j * B, r = rngFrom(hashString(`traffic|${ctx.seed || 1924}|${lane}|${j}`));
  const h = localHour(t0 + B / 2, ctx.off), dow = new Date((t0 + B / 2 + (ctx.off || 0) * 60) * 1000).getUTCDay(), party = !!(ctx.party ? ctx.party(t0 + B / 2) : partyAtT(t0 + B / 2, ctx.off));
  const band = party && h >= 20 ? 'party' : h >= 7 && h < 19 ? 'day' : h >= 19 && h < 24 ? 'evening' : h < 1.5 ? 'evening' : h < 6 ? 'late' : 'evening';
  const [a, b] = TRAFFIC.perBlock[band];
  const n = a + Math.floor(r() * (b - a + 1)), out = [];
  let last = t0 - TRAFFIC.minGap;
  for (let k = 0; k < n; k++) {
    const at = t0 + 4 + r() * (B - 12);
    if (at - last < TRAFFIC.minGap) { r(); r(); continue; }
    const num = j * 8 + k, veh = backVehicle(num, lane === 'near' ? 1 : 2), v = TRAFFIC.v[0] + r() * (TRAFFIC.v[1] - TRAFFIC.v[0]);
    out.push({ id: `car.${lane}.${j}.${k}`, n: num, t0: at, v, model: veh.model, len: veh.len, paint: veh.h % 5, trade: (veh.h >>> 4) % 4, rumble: (veh.h >>> 7) % 3 === 0, glow: party && h >= 21 && r() < TRAFFIC.glow ? (veh.h >>> 9) % 4 : -1 });
    last = at;
  }
  return out.sort((p, q) => p.t0 - q.t0);
}
/** the green's age at ms (s since the road went green; -1 while not green) */
function greenAge(ms) { const S = signalAt(ms); return S.road === 'green' ? SIGNAL_CYCLE.go - S.left : -1; }

/**
 * THE SIMULATION of one lane over block j (+ the cars still on the road from block j − 1, which lead them): every car's x sampled every
 * TRAFFIC.dt from its entry until it has left. leaders: the near lane's buses ([{ x(t), len, tE, tX }]) — scripted, they don't wait
 * for cars; a car spawned in the 25 s before a bus enters is dropped (it would be ahead of the bus at its stop). → { cars: [{ ...spawn,
 * xs: Float32Array, ts (its first sample's time) }] } (only block j's spawns)
 */
export function simulateLane(j, laneId, ctx = {}) {
  const lanes = ctx.lanes, ln = lanes[laneId], dir = ln.dir, B = TRAFFIC.block, dt = TRAFFIC.dt;
  const buses = laneId === 'near' ? (ctx.buses || []) : [];
  // (8b1: a worker's truck HOLDS the stop for minutes — `hold`: no car enters the near lane from just before it comes until it's gone)
  // (Oct 25 — NO TRAFFIC DURING THE LEGENDARIES: ctx.hold = [t0, t1] (core/harbor-legend.js#trafficHold): no car enters inside it; one
  // already on the road finishes its crossing)
  const inHold = s => !!ctx.hold && s.t0 >= ctx.hold[0] && s.t0 < ctx.hold[1];
  const keep = s => !inHold(s) && !buses.some(b => s.t0 > b.tE - (b.hold ? 45 : 25) && s.t0 < (b.hold ? b.tX : b.tE + 3));
  // (9b: the winter work — the plow + the salt truck — as extra cars of the lane: ctx.extra(j, lane) → spawns, core/harbor-snowwork.js)
  const ex = jj => (ctx.extra ? ctx.extra(jj, laneId) : []);
  const prev = [...laneSpawns(j - 1, laneId, ctx), ...ex(j - 1)].filter(keep).sort((p, q) => p.t0 - q.t0), mine = [...laneSpawns(j, laneId, ctx), ...ex(j)].filter(keep).sort((p, q) => p.t0 - q.t0);
  const all = [...prev, ...mine].map(s => ({ ...s, x: ln.xIn, vel: s.v, on: false, done: false, xs: [], ts: null, stopped: 0 }));
  const t0 = (j - 1) * B, t1 = (j + 1) * B + TRAFFIC.tail;
  for (let t = t0; t < t1; t += dt) {
    const ms = t * 1000, S = signalAt(ms), age = greenAge(ms);
    // the entities ahead of a car: cars on the road + the buses (by their x now)
    const busNow = buses.filter(b => t >= b.tE && t <= b.tX).map(b => ({ x: b.x(t), len: b.len }));
    for (let i = 0; i < all.length; i++) {
      const c = all[i];
      if (c.done) continue;
      if (!c.on) { if (t < c.t0) continue; c.on = true; c.ts = t; }
      // the gap to whoever is ahead (the nearest car / bus in front, in the car's own direction)
      let ahead = Infinity;
      for (let k = 0; k < all.length; k++) { const o = all[k]; if (k === i || !o.on || o.done) continue; const d = dir * (o.x - c.x) - (o.len + c.len) / 2; if (d > -0.5 && dir * (o.x - c.x) > 0) ahead = Math.min(ahead, d); }
      for (const b of busNow) { const d = dir * (b.x - c.x) - (b.len + c.len) / 2; if (dir * (b.x - c.x) > 0) ahead = Math.min(ahead, d); }
      // the light: stop at the line on amber / red (unless too close to stop on amber), go a beat after green
      // (amber: the driver decides ONCE, as it comes on — too close to stop comfortably → through; else it stops — never re-deciding as it
      // brakes, which would carry it over the line)
      const dl = dir * (ln.line - c.x) - c.len / 2, cyc = Math.floor(ms / 1000 / SIGNAL_PERIOD);
      if (S.road === 'amber' && c.amber !== cyc) { c.amber = cyc; c.through = dl <= c.vel * c.vel / (2 * TRAFFIC.brake * 0.7) + 0.3; }
      const mustStop = dl > -0.05 && (S.road === 'red' || (S.road === 'amber' && !c.through) || (S.road === 'green' && c.stopped && age < TRAFFIC.react));
      let room = Infinity;
      if (mustStop) room = Math.min(room, dl);
      if (ahead < Infinity) room = Math.min(room, ahead - TRAFFIC.gap);
      const vMax = room === Infinity ? c.v : Math.sqrt(2 * TRAFFIC.brake * 0.7 * Math.max(0, room - 0.05));   // (a comfortable stop: 70 % of the brake)
      let v = Math.min(c.v, vMax, c.vel + TRAFFIC.acc * dt);
      v = Math.max(0, Math.max(v, c.vel - TRAFFIC.brake * 1.6 * dt));      // (never a stop harder than a firm 1920s brake…)
      if (v * dt > room) v = Math.max(0, room / dt);                        // (…but never into the line / the car ahead)
      c.vel = v; c.x += dir * v * dt; c.stopped = v < 0.05 ? 1 : c.stopped && v < 0.5 ? 1 : 0;
      c.xs.push(c.x);
      if (dir * (c.x - ln.xOut) > 0) c.done = true;
    }
  }
  return { cars: all.slice(prev.length).filter(c => c.ts != null).map(c => ({ id: c.id, n: c.n, work: c.work || null, model: c.model, len: c.len, paint: c.paint, trade: c.trade, rumble: c.rumble, glow: c.glow, lane: laneId, z: ln.z, dir, ts: c.ts, xs: Float32Array.from(c.xs) })) };
}
/** a simulated car at t → { x, speed, dist } | null (not on the road) */
export function carState(car, t) {
  const dt = TRAFFIC.dt, u = (t - car.ts) / dt, i = Math.floor(u);
  if (u < 0 || i >= car.xs.length - 1) return null;
  const f = u - i, x = car.xs[i] + (car.xs[i + 1] - car.xs[i]) * f, sp = Math.abs(car.xs[i + 1] - car.xs[i]) / dt;
  return { x, speed: sp, dist: Math.abs(x - car.xs[0]) };
}
const sims = new Map();
/**
 * THE BACK ROAD NOW (PURE but cached): every car on the road at t → [{ id, model, paint, trade, rumble, glow (an UNDERGLOW index or −1),
 * lane, z, dir, len, x, speed, dist }]. world: { L, busesIn(a, b) (the near lane's buses over a span: core/harbor-people.js — the same plan), off, seed, party,
 * hold ([t0, t1]: a legendary's hold on every start — Oct 25) }
 */
export function carsAt(t, world) {
  const L = world.L; if (!L || !L.crosswalk) return [];
  const lanes = trafficLanes(L), B = TRAFFIC.block, j = Math.floor(t / B), out = [];
  const key0 = `${L.cam ? L.cam.W : 0}x${L.cam ? L.cam.H : 0}|${world.seed || 1924}|${world.off || 0}|${world.tag || ''}|${world.hold ? Math.round(world.hold[0]) : ''}|${world.extraKey || ''}`;   // (8b2: tag — a raid's convoy holding the near lane)
  for (const lane of Object.keys(lanes)) for (const jj of [j - 1, j]) {
    const key = `${key0}|${lane}|${jj}`;
    let sim = sims.get(key);
    if (!sim) { const a = (jj - 1) * B, b = (jj + 1) * B + TRAFFIC.tail, buses = lane === 'near' && world.busesIn ? world.busesIn(a, b).filter(o => o.tX > a && o.tE < b) : [];   // (the buses over the simulation's own span: the same on every phone, whenever the page opened)
      sim = simulateLane(jj, lane, { lanes, buses, off: world.off, seed: world.seed, party: world.party, hold: world.hold || null, extra: world.extra || null }); sims.set(key, sim); if (sims.size > 24) sims.delete(sims.keys().next().value); }
    for (const c of sim.cars) { const s = carState(c, t); if (s) out.push({ ...c, xs: undefined, ...s }); }
  }
  return out;
}
