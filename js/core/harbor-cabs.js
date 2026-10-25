// CITY 2.0 — THE HARBOR, PART 8b2: THE CABS (PURE — tested in tests/harbor-cabs.test.mjs; the cab itself is THE VEHICLE KIT's checker
// 'taxi', drawn by people.js with the back road's cars). At night the cabs come to the speakeasy: one pulls up at the curb on the back
// road (the workers' truck stop: its nose at the car's stop line, left of the crossing — the clearest view) and DROPS guests who walk
// to the side door (more on party nights), or a guest comes out of the side door, walks to the curb, HAILS, and the cab pulls up for
// them. The roof's TAXI lamp is lit while it's free (dark with a fare aboard). A cab never waits long (it HOLDS the near lane while
// it stands: the cars queue behind it, never through it), never with a bus, a worker's truck or THE RAID at the stop, and it pulls away
// only on the road's green with time to clear the crossing (the trucks' rule — core/harbor-crew.js#truckPlan).
//   cabEvents(k, ctx)   the cab calls of people-block k (FOLK.block s), seeded (every phone the same)
//   cabPlan(e, L, M)    one call planned: { T (the cab: a truck-like vehicle plan + sign(t)), riders: [people visits] }
import { rngFrom, hashString } from './rng.js';
import { truckPlan } from './harbor-crew.js';
import { FOLK, planVisit } from './harbor-people.js';
import { TRAFFIC, trafficLanes } from './harbor-traffic.js';
import { partyAt } from './harbor-moments.js';

/** the numbers: the evening's window (local hours, 25 = 1 am), the chance of a call per block (normal / party), drops before `swap`
 *  (local hour) mostly, pick-ups after; the cab's length; the riders' walk */
export const CAB = Object.freeze({ from: 19.25, to: 25.6, p: 0.5, party: [1, 2], swap: 23, len: 4.85, step: 1.15, hail: 4.5,
  // C2 — THE CAB's DOOR (the owner: "passengers step out of / into the cab through a door that opens — no appearing from behind it"): the
  // kerb-side door swings open (`open` s), each fare steps down from the cab's floor (`floor` units up) through the doorway to the road
  // beside it (or up + in), the door shuts behind the last (`shut` s); `inZ` how far inside the doorway a fare starts / ends (units
  // behind the cab's middle — drawn clipped into the doorway, like the bus's riders)
  door: { open: 0.55, shut: 0.6, floor: 0.6, inZ: 0.2, out: 1.15, hold: 0.5 } });
/** how open the cab's door is at t from its door legs (0..1): open from the first, shut after the last */
function doorOf(legs) {
  if (!legs.length) return () => 0;
  const D = CAB.door, a = Math.min(...legs.map(l => l.tOpen)), b = Math.max(...legs.map(l => l.tClose));
  const sm = u => { const x = u < 0 ? 0 : u > 1 ? 1 : u; return x * x * (3 - 2 * x); };
  return t => (t < a || t > b + D.shut ? 0 : sm((t - a) / D.open) * (1 - sm((t - b) / D.shut)));
}
/** a fare's leg through the cab's door (k 'door', like the bus's: visitAt lifts them off the floor; people.js clips them into the doorway
 *  while they're inside — `bus` names the cab) */
function cabDoorLeg(id, dir, x, zCab, zOut, t, v) {
  const D = CAB.door, zIn = zCab + D.inZ, u = v * 0.75, len = Math.abs(zIn - zOut), t1 = t + D.open + len / u + (dir === 'in' ? D.hold : 0);
  return dir === 'out'
    ? { k: 'door', door: id, bus: id, dir, x0: x, z0: zIn, x1: x, z1: zOut, t0: t, t1, w0: D.open / (t1 - t), w1: 1, tOpen: t, tClose: t1 - 0.15, y0: D.floor, y1: 0 }
    : { k: 'door', door: id, bus: id, dir, x0: x, z0: zOut, x1: x, z1: zIn, t0: t, t1, w0: D.open / (t1 - t), w1: 1 - D.hold / (t1 - t), tOpen: t, tClose: t1 - D.hold * 0.6, y0: 0, y1: D.floor };
}
const localH = (t, off) => { const h = ((((t + (off || 0) * 60) / 3600) % 24) + 24) % 24; return h < 12 ? h + 24 : h; };
const dowAt = (t, off) => new Date((t + (off || 0) * 60) * 1000).getUTCDay();

/** the cab calls of block k: [{ id, t (the cab at the curb), kind: 'drop' | 'pick', n (riders), party, seed }] */
export function cabEvents(k, ctx = {}) {
  const B = FOLK.block, t0 = k * B, r = rngFrom(hashString(`cabs|${ctx.seed || 1924}|${k}`)), out = [];
  const mid = t0 + B / 2, h = localH(mid, ctx.off);
  if (h < CAB.from || h >= CAB.to) return out;
  const eh = h >= 24 ? h - 24 : h, dow = dowAt(mid, ctx.off);
  const party = ctx.party ? !!ctx.party(mid) : partyAt(dow, eh);
  const n = party ? CAB.party[0] + Math.floor(r() * (CAB.party[1] - CAB.party[0] + 1)) : r() < CAB.p ? 1 : 0;
  for (let i = 0; i < n; i++) {
    const t = t0 + 40 + (B - 120) * ((i + r()) / Math.max(1, n));
    const hh = localH(t, ctx.off), drop = hh < CAB.swap ? r() < 0.78 : r() < 0.25;
    out.push({ id: `cab.${k}.${i}`, t, kind: drop ? 'drop' : 'pick', n: drop ? 1 + Math.floor(r() * (party ? 3 : 2)) : 1, party, seed: Math.floor(r() * 2147483647) });
  }
  return out;
}
/** the stop for a layout (the workers' trucks' — their P: the near lane, the stop line, the crossing) */
export const cabStop = L => { const ln = trafficLanes(L).near, cw = L.crosswalk; return { truckZ: ln.z, stopFront: cw.x0 - TRAFFIC.stopBack - 0.15, cw }; };

/**
 * One cab call planned (PURE): e (cabEvents), L, M (the people's map) → { id, kind, T: { …truckPlan, sign(t) (0..1 the TAXI lamp: lit
 * when free) }, riders: [visit] } | null. drop: the cab brakes to the curb, its fares step out of its kerb-side door one by one onto the
 * kerb + walk to the side door; it waits a beat, its lamp comes on, it pulls away. pick: the guest comes out of the side door to the
 * curb, HAILS as it comes up, steps in; its lamp goes off; away on green.
 */
export function cabPlan(e, L, M) {
  const P = cabStop(L), r = rngFrom(e.seed), spec = { model: 'taxi', paint: 0 }, side = M.nodes.sideDoor;
  const pre = truckPlan(L, P, e.id, spec, e.t - 16, null), shift = e.t - pre.tA, tE = e.t - 16 + shift;
  const T0 = truckPlan(L, P, e.id, spec, tE, null), zDoor = T0.z - CAB.door.out, kerb = FOLK.curbZ - 0.35, front = T0.xc + T0.len / 2;
  const riders = [];
  let tReady;
  if (e.kind === 'drop') {
    // out of the kerb-side door (from inside the body: hidden by it, then stepping clear) onto the kerb, then to the side door
    let last = T0.tA + 1;
    for (let i = 0; i < e.n; i++) {
      const t = T0.tA + 2.6 + i * CAB.step, x = T0.xc - 0.35 + (i % 2 ? 0.35 : 0), v = FOLK.speed.walk;
      const legs = [cabDoorLeg(T0.id, 'out', x, T0.z, zDoor, t, v)];
      // (round the cab's NOSE onto the kerb by the crossing — the kerb behind it is the bench + the crabapple's corner, like the trucks')
      const t2 = legs[0].t1, gap = { x: front + 0.3 + i * 0.25, z: kerb }, pts = [{ x, z: zDoor }, { x: front + 0.2 + i * 0.25, z: FOLK.roadZ + 0.45 }, gap];
      let d = 0; for (let j = 1; j < pts.length; j++) d += Math.hypot(pts[j].x - pts[j - 1].x, pts[j].z - pts[j - 1].z);
      const legs2 = { k: 'walk', pts, t0: t2, t1: t2 + d / v, v };
      legs.push(legs2);
      const vis = planVisit({ look: 'guest', gait: 'walk', goals: [{ from: 'bus' }, { door: 'side' }] }, legs2.t1, M, { r, start: gap });
      if (!vis) continue;
      riders.push({ id: `${e.id}.r${i}`, kind: 'guests', look: 'guest', gait: 'walk', legs: [...legs, ...vis.legs], t0: t, t1: vis.t1, tEnd: vis.t1, members: [{ role: 'lead', dx: 0, dz: 0, lag: 0, seed: Math.floor(r() * 1e6) }], party: e.party, cab: e.id });
      last = Math.max(last, t2);
    }
    tReady = last + 4.5;   // (the fare paid, the door shut, a look back — then the lamp on + away)
  } else {
    // the guest out of the side door, to the curb by the stop, HAILING as the cab comes up, then in
    const curb = { x: front + 0.35, z: kerb };
    const vis = planVisit({ look: 'guest', gait: 'stroll', goals: [{ from: 'side' }, { at: curb }] }, e.t - 30, M, { r });
    if (!vis) return null;
    const legs = [...vis.legs], tW = vis.t1;
    // (the cab can't come before the hail — the plan moves it later if the walk ran long)
    const tA = Math.max(T0.tA, tW + CAB.hail);
    const T1 = tA > T0.tA ? truckPlan(L, P, e.id, spec, tE + (tA - T0.tA), null) : T0;
    legs.push({ k: 'pose', pose: 'wait', x: curb.x, z: curb.z, t0: tW, t1: tA - CAB.hail + 0.5, hd: Math.PI / 2 });
    legs.push({ k: 'pose', pose: 'wave', x: curb.x, z: curb.z, t0: tA - CAB.hail + 0.5, t1: T1.tA + 0.4, hd: Math.PI });
    const t3 = T1.tA + 0.4, v = FOLK.speed.walk;
    const dx = T1.xc - 0.35, pa = [{ ...curb }, { x: front + 0.2, z: FOLK.roadZ + 0.45 }, { x: dx, z: zDoor }];
    let d = 0; for (let j = 1; j < pa.length; j++) d += Math.hypot(pa[j].x - pa[j - 1].x, pa[j].z - pa[j - 1].z);
    legs.push({ k: 'walk', pts: pa, t0: t3, t1: t3 + d / v, v });
    const t4 = legs[legs.length - 1].t1;
    legs.push(cabDoorLeg(T1.id, 'in', dx, T1.z, zDoor, t4, v));
    const tEnd = legs[legs.length - 1].t1;
    riders.push({ id: `${e.id}.r0`, kind: 'leaving', look: 'guest', gait: 'stroll', legs, t0: vis.t0, t1: tEnd, tEnd, members: [{ role: 'lead', dx: 0, dz: 0, lag: 0, seed: Math.floor(r() * 1e6) }], party: e.party, cab: e.id });
    tReady = tEnd + 1.5;
    const T = truckPlan(L, P, e.id, spec, tE + (tA - T0.tA), tReady);
    const tOn = tEnd - 0.4;
    return { id: e.id, kind: e.kind, T: { ...T, cab: true, sign: t => (t < tOn ? 1 : 0), door: doorOf([legs[legs.length - 1]]) }, riders };
  }
  if (!riders.length) return null;
  const T = truckPlan(L, P, e.id, spec, tE, tReady), tFree = tReady - 1;
  const door = doorOf(riders.map(v => v.legs[0]));
  return { id: e.id, kind: e.kind, T: { ...T, cab: true, sign: t => (t < tFree ? 0 : 1), door }, riders };
}
