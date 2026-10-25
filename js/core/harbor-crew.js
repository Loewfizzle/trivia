// CITY 2.0 — THE HARBOR, PART 8b1: THE CREW — the workers' timetable (core/harbor-workers.js) turned into PEOPLE on the promenade's
// map (core/harbor-people.js): each show's itinerary (walks routed round the furniture, REAL doors, the truck at the stop, a ladder
// climbed, the roof by its hatch, the catwalk), the trucks' motion on the back road, and every PROP's state on the clock (the bottles
// on the step, the bundles, the newsstand, the ladders, the platform, the cellar hatch, the billboard's sheets, the blade's repaint,
// the can held, the wet streak). PURE (tests/harbor-workers.test.mjs) — every phone the same, joined mid-way; drawn by people.js
// (the figures, by depth) + screens/harbor/workers.js (the props).
//
// HOW A WORKER NEVER POPS IN: from a screen edge, a door, the far side of their truck (hidden by its body, walking round its tail),
// or the roof's hatch (the roof's convention: a 0.8 s fade where the parapet hides the stair). Carrying is part of a leg (`carry`:
// the look's prop for that stretch — the bottles, an ice block, the can, a crate, a ladder…), a height (`y`) too: a ladder's rungs, the
// platform, the catwalk.
import { FOLK, DOOR, planVisit, doorLeg } from './harbor-people.js';
import { signalAt } from './harbor-promenade.js';
import { TRAFFIC } from './harbor-traffic.js';
import { rngFrom, hashString } from './rng.js';
import { workDay, forcedWork, dayOf, prevKey, bulbOut, lampFault, boardLampOut, MILK, SHEETS, sheetsUp, paintStage, PAINT_STAGES, PAINT_TOTAL, platformAt, WET } from './harbor-workers.js';

const PI = Math.PI;
/** the trucks' kit lengths (screens/harbor/vehicles.js#MODELS) + their cruise / braking / pulling away (u, u / s, u / s²) */
export const TRUCK = Object.freeze({ len: { van: 5.05, dump: 6.0, stake: 6.25 }, v: 5.2, brake: 2.0, go: 1.25, ready: 2.5 });
/** the blade on the speakeasy's side wall (screens/harbor/speakeasy-blade.js#BLADE: w along the wall, out from it, v0 → v1 up) */
const BLADE_AT = Object.freeze({ w: 0.42, outer: 0.22 + 1.86, v0: 2.75, v1: 11.0 });

/** where the crew works (world x, z; y up) for a layout + the people's map */
export function crewSpots(L, M) {
  const s = L.speakeasy, cw = L.crosswalk, F = FOLK;
  const globes = (L.lamps || []).filter(l => l.kind === 'globe').sort((a, b) => a.x - b.x), fl = globes[0] || { x: -4.4, z: 36.6 };
  const can = L.trashCan ? { x: L.trashCan.x, z: L.trashCan.z } : { x: fl.x + 0.95, z: fl.z + 0.3 };
  const bx = s.x1 + BLADE_AT.outer, bz = s.z0 + BLADE_AT.w;
  const rf = L.roof || {}, bk = rf.bulkhead || { x0: -8.7, x1: -6.9, z0: 51.4 }, bd = rf.board || { x0: -16.2, x1: -9.4, y0: 12.4, y1: 16.1, z: 55, deck: 10.5 };
  return {
    face: s.z0, deck: s.h,
    shopDoor: M.nodes.shopDoor, sideDoor: M.nodes.sideDoor,
    step: { x: M.nodes.shopDoor.x + 0.66, z: s.z0 - 0.3 }, stepStand: { x: M.nodes.shopDoor.x + 0.66, z: s.z0 - 1.0 },
    vendor: { x: L.cart ? L.cart.x : 7.85, z: L.cart ? L.cart.z : 38.4 }, newsboy: { x: (L.cart ? L.cart.x : 7.85) - 1.3, z: (L.cart ? L.cart.z : 38.4) + 0.5 },
    can, canStand: { x: can.x + 0.7, z: can.z + 0.62 },
    // the tall ladder against the BLADE's outer edge (its feet out on the promenade to the right, its top at the crest)
    ladder: { foot: { x: bx + 1.15, z: bz - 0.06 }, top: { x: bx + 0.04, y: BLADE_AT.v1 - 0.55, z: bz - 0.06 }, v0: BLADE_AT.v0, v1: BLADE_AT.v1 },
    holder: { x: bx + 1.75, z: bz - 0.75 },
    cellar: { x: s.x0 + 5.7, z: s.z0 - 0.78 }, lookout: { x: s.x1 + 1.05, z: s.z0 - 1.45 },
    awning: { x: s.x0 + ((s.awning ? s.awning.u0 + s.awning.u1 : 10.1) / 2) + 0.9, z: s.z0 - 0.95 },
    doorman: { x: M.nodes.sideDoor.x + 1.15, z: F.doorZ - 0.8 },
    flowers: { x: s.x1 + 2.7, z: F.doorZ - 2.1 },
    // the window washers' platform along the front face (u from the speakeasy's left end): the two bays on screen
    wash: { u0: 3.85, u1: 9.65, z: s.z0 - 0.5, x0: s.x0 },
    // the roof: the stair house's door (the hatch), the planters, the billboard's catwalk (y above the deck) + its ladder
    hatch: { x: (bk.x0 + bk.x1) / 2, z: bk.z0 - 0.3 }, beds: (rf.planters || []).map(p => ({ x: p.x, z: p.z - 0.7 })),
    board: { x0: bd.x0, x1: bd.x1, y0: bd.y0, y1: bd.y1, z: bd.z, ladderX: bd.x0 + 0.7 * (bd.x1 - bd.x0), walkZ: bd.z - 0.5, walkY: Math.max(0.6, bd.y0 - 0.12 - s.h), footZ: bd.z - 0.9 },
    lamps: L.lamps || [],
    truckZ: TRAFFIC.lanes.near.z, stopFront: cw.x0 - TRAFFIC.stopBack - 0.15, cw,
  };
}

// ------------------------------------------------------------------ THE TRUCKS (the vehicle kit's vans + the new trucks)
/** a truck at the stop (PURE): enters from behind the speakeasy at tE, brakes to the stop (its front at the car's stop line, left of
 *  the crossing: the bus's stop — the clearest view), waits until tReady, pulls away on GREEN with time to clear the crossing */
export function truckPlan(L, P, id, spec, tE, tReady) {
  const len = TRUCK.len[spec.model] || 5.05, z = P.truckZ, hw = L.cam && L.cam.hw ? L.cam.hw(z) : 18, cw = P.cw;
  const xIn = -hw - len - 2, xc = P.stopFront - len / 2, v = TRUCK.v, br = TRUCK.brake, go = TRUCK.go;
  const dB = v * v / (2 * br), tBr = v / br, dCruise = Math.max(0, xc - xIn - dB), tA = tE + dCruise / v + tBr, tb = tA - tBr;
  const through = (cw.x1 + 0.4) - (xc - len / 2), tThrough = Math.sqrt(2 * Math.max(0, through) / go) + 0.5;
  let tD = Math.max(tA + 2, tReady == null ? tA + 30 : tReady);
  for (let k = 0; k < 40; k++) { const S = signalAt(tD * 1000); if (S.road === 'green' && S.left >= tThrough + 1) break; tD += S.left + 0.05; }
  const xOut = hw + len + 2, tX = tD + Math.sqrt(2 * (xOut - xc) / go);
  const x = tt => (tt <= tE ? xIn : tt < tb ? xIn + (tt - tE) * v : tt < tA ? (u => xIn + dCruise + v * u - 0.5 * br * u * u)(tt - tb) : tt < tD ? xc : xc + 0.5 * go * (tt - tD) * (tt - tD));
  const dist = tt => Math.abs(x(tt) - xIn);
  return { id, truck: true, model: spec.model, word: spec.word || null, trade: spec.trade || 0, paint: spec.paint || 0, dark: !!spec.dark, len, z, tE, tA, tD, tX, xc, x, dist, hold: true, riders: { off: 0, on: 0 } };
}

// ------------------------------------------------------------------ A WORKER's ITINERARY (a small builder over the people's legs)
function crewOf(M, P, r, gait, t, start) {
  const legs = [], v = FOLK.speed[gait || 'walk'] * (0.92 + r() * 0.16);
  let now = t, cur = start ? { ...start } : null, carry = null, y = 0;
  const push = lg => { legs.push({ carry, ...lg }); now = lg.t1; };
  const B = {
    get now() { return now; }, get cur() { return cur; }, v,
    wait(dur) { if (dur > 0.01) push({ k: 'pose', pose: 'wait', x: cur.x, z: cur.z, t0: now, t1: now + dur, y }); return B; },
    /** indoors for a while (after a door in, before a door out): off the promenade */
    inside(dur) { if (dur > 0.01) push({ k: 'gap', x: cur.x, z: cur.z, t0: now, t1: now + dur }); return B; },
    until(tt, pose = 'wait', o = {}) { return tt > now + 0.01 ? B.pose(pose, tt - now, o) : B; },
    hold(c) { carry = c; return B; },
    at(p) { cur = { x: p.x, z: p.z }; return B; },
    /** a straight walk (explicit points — onto / off the road, along the catwalk) */
    line(pts, vv = v) { let d = 0, last = cur; for (const p of pts) { d += Math.hypot(p.x - last.x, p.z - last.z); last = p; } if (d < 0.02) { cur = { ...last }; return B; } push({ k: 'walk', pts: [cur, ...pts], t0: now, t1: now + d / vv, v: vv, y }); cur = { x: last.x, z: last.z }; return B; },
    /** a routed walk on the map (round the bench, the lamps, the building) */
    go(p, vv = v) {
      const vis = planVisit({ look: 'worker', gait: 'walk', goals: [{ at: p }] }, now, M, { r, start: cur });
      if (!vis) return B.line([p], vv);
      const k = vv / Math.max(0.01, vis.v), t0 = now;
      for (const lg of vis.legs) push({ ...lg, t0: t0 + (lg.t0 - t0) / k, t1: t0 + (lg.t1 - t0) / k, v: lg.v * k, y });
      cur = { x: vis.end.x, z: vis.end.z }; return B;
    },
    pose(pose, dur, o = {}) { if (dur <= 0.01) return B; push({ k: 'pose', pose, x: cur.x, z: cur.z, t0: now, t1: now + dur, hd: o.hd, face: o.face, y: o.y != null ? o.y : y, ...(o.carry !== undefined ? { carry: o.carry } : {}) }); return B; },
    /** up / down a ladder: from where they stand to (x1, z1) at height y1 (rung by rung — the 'climb' pose) */
    climb(p1, y1, dur, hd) { push({ k: 'pose', pose: 'climb', x: cur.x, z: cur.z, x1: p1.x, z1: p1.z, y0: y, y1, t0: now, t1: now + dur, hd }); cur = { x: p1.x, z: p1.z }; y = y1; return B; },
    /** in / out through a real door (core/harbor-people.js#doorLeg) */
    door(kind, dir) {
      const d = kind === 'side' ? M.nodes.sideDoor : M.nodes.shopDoor;
      if (dir === 'in') { const zs = M.face - (kind === 'side' ? DOOR.stepSide : DOOR.step); B.go({ x: d.x, z: zs - DOOR.approach }); B.line([{ x: d.x, z: zs }]); const lg = doorLeg(kind, 'in', d.x, now, v, M.face); push(lg); cur = { x: lg.x1, z: lg.z1 }; }
      else { const lg = doorLeg(kind, 'out', d.x + (r() - 0.5) * 0.2, now, v, M.face); push(lg); cur = { x: lg.x1, z: lg.z1 }; B.line([{ x: cur.x + (r() - 0.5) * 0.4, z: FOLK.doorZ - 0.9 }]); }
      return B;
    },
    /** onto the roof (from inside the stair: a fade at the hatch) / back down it */
    fade(out, dur = 0.8) { push({ k: 'fade', x: cur.x, z: cur.z, t0: now, t1: now + dur, out }); return B; },
    edge(side, z) { const ex = M.exits[side]; const e = Array.isArray(ex) ? ex.reduce((a, b) => (Math.abs(b.z - z) < Math.abs(a.z - z) ? b : a)) : ex; cur = { x: e.x, z: e.z }; return B; },
    exit(side, z = 42) { const ex = M.exits[side]; const e = Array.isArray(ex) ? ex.reduce((a, b) => (Math.abs(b.z - z) < Math.abs(a.z - z) ? b : a)) : ex; return B.go(e); },
    // THE TRUCK at the stop (its nose at the car's stop line, just left of the crossing): the kerb behind it is the bench + the crabapple's
    // corner, so the crew come and go round its NOSE — from the cab's far side (hidden by its body), round the front, along the road
    // to the kerb's gap by the crossing; loading is at the BED's side, standing on the road between the kerb and the truck
    /** out of the cab (its far side), round the nose, up onto the kerb */
    fromTruck(T, i = 0) { const front = T.xc + T.len / 2; cur = { x: front - 0.9 - i * 0.4, z: T.z + 0.95 }; B.line([{ x: front + 0.45, z: T.z + 0.7 }, { x: front + 0.5 + i * 0.25, z: FOLK.roadZ + 0.35 }, { x: front + 0.3 + i * 0.25, z: FOLK.curbZ - 0.35 }]); return B; },
    /** back into the cab (round the nose to its far side, out of sight) */
    toTruck(T, i = 0) { const front = T.xc + T.len / 2; B.go({ x: front + 0.3 + i * 0.25, z: FOLK.curbZ - 0.35 }); B.line([{ x: front + 0.5 + i * 0.25, z: FOLK.roadZ + 0.35 }, { x: front + 0.45, z: T.z + 0.7 }, { x: front - 0.9 - i * 0.4, z: T.z + 0.95 }]); B.wait(0.6); return B; },
    /** to the bed's side (loading / unloading), standing on the road by the truck */
    tail(T, i = 0) { const front = T.xc + T.len / 2, bed = T.xc - T.len / 2 + 1.0 + i * 0.7; B.go({ x: front + 0.3 + i * 0.25, z: FOLK.curbZ - 0.35 }); B.line([{ x: front + 0.2 + i * 0.25, z: FOLK.roadZ + 0.45 }, { x: bed, z: FOLK.roadZ + 0.45 }, { x: bed, z: T.z - 0.9 }]); return B; },
    fromTail(T, i = 0) { const front = T.xc + T.len / 2, bed = T.xc - T.len / 2 + 1.0 + i * 0.7; B.line([{ x: bed, z: FOLK.roadZ + 0.45 }, { x: front + 0.2 + i * 0.25, z: FOLK.roadZ + 0.45 }, { x: front + 0.3 + i * 0.25, z: FOLK.curbZ - 0.35 }]); return B; },
    out(id, kind, look, extra = {}) { return legs.length ? { id, kind, routine: 'work', idx: 0, look, gait: gait || 'walk', legs, t0: legs[0].t0, t1: now, tEnd: now, members: [{ role: 'lead', dx: 0, dz: 0, lag: 0, seed: Math.floor(r() * 1e6) }], ...extra } : null; },
  };
  return B;
}

// ------------------------------------------------------------------ THE PLANS (one per kind) → { visits, roof, trucks, props, marks }
// props: what workers.js draws ({ kind, t0, t1, … } — its state at t from its own fields); marks: moments other systems read (the milk
// on the step, the board's sheets, the blade's repaint, the bulb + lamp fixes, the can held)
const PLAN = {
  sweeper(w, M, P, r) {
    // a "white wing" pushing his can cart along the promenade in slow passes (sweeping in place now + then), leaving a wet streak
    const c = crewOf(M, P, r, 'stroll', w.t0).edge('right', 44.5).hold('sweepcart'), pts = [], vS = 0.42;
    const passes = [[44.6, -1], [41.2, 1], [47.6, -1], [39.6, 1]].map(([z, dir]) => ({ z, dir }));
    c.go({ x: 10.5, z: 44.6 });
    for (const [i, p] of passes.entries()) {
      const xa = p.dir < 0 ? 10.5 : -3.8, xb = p.dir < 0 ? -3.8 : 10.5;
      if (i) c.go({ x: xa, z: p.z });
      const xm = (xa + xb) / 2;
      c.line([{ x: xm, z: p.z }], vS); pts.push({ x: xa, z: p.z, t: c.now - Math.abs(xm - xa) / vS }, { x: xm, z: p.z, t: c.now });
      c.pose('sweep', 18 + r() * 14, { hd: p.dir < 0 ? PI : 0 });
      c.line([{ x: xb, z: p.z }], vS); pts.push({ x: xb, z: p.z, t: c.now });
      if (i === 1) c.pose('lean', 14 + r() * 8, { face: 0 });
    }
    c.exit('right', 41);
    return { visits: [c.out(w.id, 'sweeper', 'sweeper')], props: [{ kind: 'wet', pts, t0: w.t0, t1: c.now + WET.dry }] };
  },
};
// (the truck-borne plans share one shape: plan the truck's arrival, the crew from tA, then the truck's departure once they're back)
function truckShow(L, w, M, P, r, crew) {
  const pre = truckPlan(L, P, `${w.id}.truck`, w.truck, w.t0, null);
  const res = crew(pre, r);
  const back = Math.max(pre.tA + 4, ...res.visits.filter(Boolean).map(v => v.t1)) + TRUCK.ready;
  const T = truckPlan(L, P, `${w.id}.truck`, w.truck, w.t0, back);
  return { ...res, trucks: [T] };
}
PLAN.milk = (w, M, P, r, L) => truckShow(L, w, M, P, r, T => {
  // 6:00 — the milkman round the truck's tail with his wire carrier, to the barbershop's step, sets it down, back
  const c = crewOf(M, P, r, 'brisk', T.tA + 1.4).fromTruck(T).tail(T).pose('reach', 1.6, { hd: 0 }).hold('bottles').fromTail(T).go(P.stepStand).go(P.step);
  const drop = c.now + 0.9; c.pose('garden', 1.8, { hd: PI / 2 }).hold(null).go(P.stepStand).toTruck(T);
  return { visits: [c.out(w.id, 'milk', 'milkman')], marks: { milkDrop: drop } };
});
PLAN.newsdrop = (w, M, P, r, L) => truckShow(L, w, M, P, r, T => {
  const c = crewOf(M, P, r, 'brisk', T.tA + 1.2).fromTruck(T).tail(T).pose('reach', 1.2, { hd: 0 }).hold('bundle').fromTail(T).go({ x: P.vendor.x - 0.9, z: P.vendor.z + 0.9 });
  const drop = c.now + 0.6; c.pose('garden', 1.3, { hd: -PI / 2 }).hold(null).toTruck(T);
  return { visits: [c.out(w.id, 'newsdrop', 'worker')], marks: { bundles: drop } };
});
PLAN.trash = (w, M, P, r, L) => truckShow(L, w, M, P, r, T => {
  // the collector to the can beside the front-left lamppost: the lid off, the can up on his shoulder, to the truck's tail, tipped in
  // over the side, carried back, set down, the lid on — the raccoon (Group 2) bolts if it's there
  const c = crewOf(M, P, r, 'walk', T.tA + 1.6).fromTruck(T).go(P.canStand).pose('garden', 1.6, { hd: PI + 0.4 });
  const lift = c.now; c.hold('can').tail(T).pose('tip', 2.8, { hd: PI / 2 }).fromTail(T).go(P.canStand);
  const set = c.now + 0.8; c.pose('garden', 1.8, { hd: PI + 0.4 }).hold(null).toTruck(T);
  return { visits: [c.out(w.id, 'trash', 'trashman')], marks: { canHeld: [lift + 0.8, set] } };
});
PLAN.ice = (w, M, P, r, L) => truckShow(L, w, M, P, r, T => {
  const c = crewOf(M, P, r, 'walk', T.tA + 1.5).fromTruck(T).tail(T).pose('reach', 2.2, { hd: 0 }).hold('ice').fromTail(T).door('side', 'in');
  c.inside(32 + r() * 12).hold(null).door('side', 'out').toTruck(T);
  return { visits: [c.out(w.id, 'ice', 'iceman')] };
});
PLAN.soda = (w, M, P, r, L) => truckShow(L, w, M, P, r, T => {
  // two men, two trips each: a crate of soda water (wink) on the shoulder, in at the side door
  const vs = [];
  for (let i = 0; i < 2; i++) {
    const c = crewOf(M, P, r, 'walk', T.tA + 1.4 + i * 1.6).fromTruck(T, i);
    for (let trip = 0; trip < 2; trip++) { c.tail(T, i).pose('reach', 1.8, { hd: 0 }).hold('crate').fromTail(T, i).door('side', 'in').inside(5 + r() * 4).hold(null).door('side', 'out'); }
    c.toTruck(T, i); vs.push(c.out(`${w.id}.${i}`, 'soda', 'worker'));
  }
  return { visits: vs };
});
function bootlegCrew(w, M, P, r, T, trips) {
  // a quiet truck (no lamps): two men pass crates down the open CELLAR HATCH in front of the basement window; a lookout on the corner
  const vs = [], hatchAt = T.tA + 4, endAt = [];
  for (let i = 0; i < 2; i++) {
    const c = crewOf(M, P, r, 'brisk', T.tA + 1.2 + i * 1.4).fromTruck(T, i);
    for (let k = 0; k < trips; k++) { c.tail(T, i).pose('reach', 1.4, { hd: 0 }).hold('crate').fromTail(T, i).go({ x: P.cellar.x + (i ? 0.7 : -0.7), z: P.cellar.z - 0.55 }).pose('garden', 1.6, { hd: PI / 2 }).hold(null); }
    endAt.push(c.now); c.toTruck(T, i); vs.push(c.out(`${w.id}.${i}`, 'bootlegger', 'bootlegger'));
  }
  const lo = crewOf(M, P, r, 'walk', T.tA + 2.2).fromTruck(T, 2).go(P.lookout).until(Math.max(...endAt) + 4, 'lookout', { hd: -PI / 2 }).toTruck(T, 2);
  vs.push(lo.out(`${w.id}.lookout`, 'lookout', 'lookout'));
  return { visits: vs, props: [{ kind: 'hatch', x: P.cellar.x, z: P.cellar.z, t0: hatchAt, t1: Math.max(...endAt) + 3, open: 1.2 }] };
}
PLAN.bootleg = (w, M, P, r, L) => truckShow(L, w, M, P, r, T => bootlegCrew(w, M, P, r, T, 3));
PLAN.delivery = (w, M, P, r, L) => truckShow(L, w, M, P, r, T => bootlegCrew(w, M, P, r, T, 6));
PLAN.washers = (w, M, P, r) => {
  // two men in at the side door with their buckets; up on the roof, they let the platform down over the parapet onto the upper floor
  // (the right bay, then the left), lower it a floor, the same again, then wind it back up; out again at the side door
  const len = w.t1 - w.t0, vs = [], W = P.wash, up = len * 0.08;
  for (let i = 0; i < 2; i++) {
    const c = crewOf(M, P, r, 'walk', w.t0 - 70 + i * 2).edge('right', 43).hold('bucket').door('side', 'in').hold(null);
    // on the platform: their spots along it (left / right), the bay they're on, facing the wall (we see their backs)
    const onAt = w.t0 + 4, offAt = w.t1 - 2, steps = 40;
    let t = onAt;
    const y0 = platformAt(4, len).y + 0.12, legs = [{ k: 'fade', x: W.x0 + (i ? 8.85 : 7.85), z: W.z, t0: onAt - 0.8, t1: onAt, out: false, y: y0 }];
    for (let k = 0; k < steps; k++) {
      const t1 = onAt + (offAt - onAt) * (k + 1) / steps, um = (t + t1) / 2 - w.t0, st = platformAt(um, len), bay = st.bay ? [7.4, 9.3] : [4.2, 6.1];
      const u = i ? bay[1] - 0.45 : bay[0] + 0.45, x = W.x0 + u + (r() - 0.5) * 0.3;
      legs.push({ k: 'pose', pose: st.moving ? 'wait' : 'squeegee', x, z: W.z, t0: t, t1, hd: PI / 2, y: st.y + 0.12, plat: true, carry: st.moving ? null : 'squeegee' });
      t = t1;
    }
    legs.push({ k: 'fade', x: legs[legs.length - 1].x, z: W.z, t0: offAt, t1: offAt + 0.8, out: true, y: platformAt(len - 4, len).y + 0.12 });
    const back = crewOf(M, P, r, 'walk', offAt + 40 + i * 2.5).at(P.sideDoor).door('side', 'out').hold('bucket').exit('right', 43);
    const a = c.out(`${w.id}.${i}a`, 'washer', 'washer'), b = back.out(`${w.id}.${i}b`, 'washer', 'washer');
    vs.push(a, { id: `${w.id}.${i}p`, kind: 'washer', routine: 'work', idx: i, look: 'washer', gait: 'walk', legs, t0: legs[0].t0, t1: legs[legs.length - 1].t1, tEnd: legs[legs.length - 1].t1, members: [{ role: 'lead', dx: 0, dz: 0, lag: 0, seed: a ? a.members[0].seed : 7 }], plat: true }, b);
  }
  return { visits: vs, props: [{ kind: 'platform', t0: w.t0 - up * 0.2, t1: w.t1 + 2, len, start: w.t0, u0: W.u0, u1: W.u1, z: W.z, x0: W.x0 }] };
};
PLAN.gardener = (w, M, P, r) => {
  // Wednesday: up through the hatch with his watering can, each bed in turn (bending, tending), back down
  const R = { rects: [], circles: [], exits: M.exits, nodes: M.nodes, face: M.face };
  const c = crewOf(R, P, r, 'stroll', w.t0).at(P.hatch).hold('wcan').fade(false);
  const beds = P.beds.length ? P.beds : [{ x: -11, z: 46.5 }];
  const per = (w.t1 - w.t0 - 30) / beds.length;
  for (const b of beds) { c.line([b]); c.pose('garden', per * 0.7, { face: 1 }); c.pose('wait', per * 0.3 - 6, { face: 2 }); }
  c.line([P.hatch]).fade(true);
  return { roof: [c.out(w.id, 'gardener', 'worker')] };
};
PLAN.crew = (w, M, P, r) => {
  // the morning after a party night: two of the staff up on the roof with brooms + a sack, the deck swept, the bottles gathered
  const out = [];
  for (let i = 0; i < 2; i++) {
    const c = crewOf({ rects: [], circles: [], exits: M.exits, nodes: M.nodes, face: M.face }, P, r, 'stroll', w.t0 + i * 6).at(P.hatch).hold(i ? 'sack' : 'broom').fade(false);
    const spots = [[-12.6, 46.4], [-10.4, 47.5], [-8.6, 46.1], [-13.4, 47.8], [-9.6, 46.8]];
    const per = (w.t1 - w.t0 - 40) / spots.length;
    for (const [x, z] of spots) { c.line([{ x: x + i * 0.9, z: z + i * 0.3 }]); c.pose(i ? 'garden' : 'sweep', per * 0.75, { face: i ? 1 : -1 }); c.wait(per * 0.25 - 4); }
    c.line([P.hatch]).fade(true); out.push(c.out(`${w.id}.${i}`, 'crew', 'staff'));
  }
  return { roof: out };
};
PLAN.sweep2 = (w, M, P, r) => PLAN.sweeper(w, M, P, r);
PLAN.billposter = (w, M, P, r) => {
  // ~5–6 pm: in at the side door with his paste bucket, the roll of sheets + the long brush; up through the hatch, across the deck,
  // up the board's ladder to the catwalk; each sheet pasted (the long brush up the board, the sheet smoothed); a dead lamp fixed; down
  const R = { rects: [], circles: [], exits: M.exits, nodes: M.nodes, face: M.face }, B = P.board, yW = B.walkY;
  const a = crewOf(M, P, r, 'walk', w.t0 - 95).edge('right', 43).hold('paste').door('side', 'in');
  const c = crewOf(R, P, r, 'walk', w.t0 + 4).at(P.hatch).hold('paste').fade(false).line([{ x: B.ladderX + 0.3, z: B.footZ }]).hold(null).climb({ x: B.ladderX + 0.3, z: B.walkZ }, yW, 4.2, PI / 2);
  const colX = i => B.x0 + (B.x1 - B.x0) * (i + 0.5) / SHEETS.cols, sheets = [];
  // (to the first sheet by its start: SHEETS.from s after his show's start)
  c.line([{ x: colX(0), z: B.walkZ }], 0.9).until(w.t0 + SHEETS.from - 2, 'wait', { hd: PI / 2 });
  for (let row = 0; row < SHEETS.rows; row++) for (let col = 0; col < SHEETS.cols; col++) {
    const s0 = w.t0 + SHEETS.from + (row * SHEETS.cols + col) * SHEETS.per;
    c.line([{ x: colX(col) + (r() - 0.5) * 0.4, z: B.walkZ }], 0.9).until(s0, 'wait', { hd: PI / 2 });
    c.pose(row ? 'paste' : 'pastehi', SHEETS.per - 5, { hd: PI / 2, carry: 'brush' }); sheets.push(s0);
  }
  const fixAt = c.now + 6;
  c.line([{ x: B.x0 + (B.x1 - B.x0) * 0.25, z: B.walkZ }], 0.9).pose('reach', SHEETS.fix * 0.5, { hd: PI / 2 });
  c.line([{ x: B.ladderX + 0.3, z: B.walkZ }], 0.9).climb({ x: B.ladderX + 0.3, z: B.footZ }, 0, 4.2, -PI / 2).hold('paste').line([P.hatch]).fade(true);
  const d = crewOf(M, P, r, 'walk', c.now + 30).at(P.sideDoor).door('side', 'out').hold('paste').exit('right', 43);
  return { visits: [a.out(`${w.id}.in`, 'billposter', 'billposter'), d.out(`${w.id}.out`, 'billposter', 'billposter')], roof: [c.out(w.id, 'billposter', 'billposter')], marks: { sheets: { t0: w.t0, done: c.now - SHEETS.fix, fixAt } } };
};
/** where a climber stands on a leaning ladder at height y (their feet): along it from the foot toward the top, just in front of it */
const onLadder = (foot, top, y) => { const f = Math.max(0, Math.min(1, y / Math.max(0.5, top.y))); return { x: foot.x + (top.x - foot.x) * f, z: Math.min(foot.z, top.z) - 0.12 }; };
function ladderShow(w, M, P, r, { tall, foot, top, y, work, look, kind, fix }) {
  // a worker carrying his ladder in from the right edge, raising it, up, the work, down, the ladder away
  const c = crewOf(M, P, r, 'walk', w.t0).edge('right', foot.z).hold(tall ? 'ladder' : 'steps').go({ x: foot.x + 0.5, z: foot.z - 0.6 });
  const up = c.now + 1; c.pose('garden', 3.2, { hd: PI }).hold(null).go(onLadder(foot, top, 0));
  c.climb(onLadder(foot, top, y), y, tall ? 6.5 : 2.2, PI);
  const f0 = c.now; c.pose('reach', work, { hd: PI });
  const f1 = c.now; c.climb(onLadder(foot, top, 0), 0, tall ? 6.0 : 2.0, -PI / 2).go({ x: foot.x + 0.5, z: foot.z - 0.6 });
  const down = c.now + 0.6; c.pose('garden', 2.6, { hd: PI }).hold(tall ? 'ladder' : 'steps').exit('right', foot.z);
  return { visits: [c.out(w.id, kind, look)], props: [{ kind: tall ? 'ladder' : 'steps', t0: up + 1.6, t1: down + 1.2, foot, top }], marks: { [fix]: { t: f0 + work * 0.72, t0: f0, t1: f1 } } };
}
PLAN.bulb = (w, M, P, r) => ladderShow(w, M, P, r, { tall: true, foot: P.ladder.foot, top: P.ladder.top, y: P.ladder.top.y - 2.0, work: 26, look: 'repairman', kind: 'repairman', fix: 'bulbFix' });
PLAN.lamp = (w, M, P, r) => {
  // a stepladder (an A-frame) beside the lamp, its top just under the lamp's head
  const l = P.lamps[w.lamp % Math.max(1, P.lamps.length)] || { x: 0, z: 45, h: 4 }, y = Math.max(0.6, l.h - 2.3);
  const foot = { x: l.x + 0.62, z: l.z - 0.32 }, top = { x: l.x + 0.62, y: y + 0.15, z: l.z - 0.32 };
  return ladderShow(w, M, P, r, { tall: false, foot, top, y, work: 38, look: 'repairman', kind: 'lampman', fix: 'lampFix' });
};
PLAN.painters = (w, M, P, r) => {
  // MONDAY 1–4 pm: two painters carry the long ladder in together, raise it against the blade's edge; one up it through the stages
  // (the old name painted out bottom → top, the new letters chalked, filled + gilded top → bottom), climbing down between stages;
  // the other at the foot steadying it + mixing; the drop cloth on the cobbles under the blade
  const Ld = P.ladder, vs = [], F = Ld.foot, mate = P.holder;
  const a = crewOf(M, P, r, 'walk', w.t0).edge('right', F.z).hold('ladder').go({ x: F.x + 0.5, z: F.z - 0.6 });
  const up = a.now + 1.5; a.pose('garden', 3.2, { hd: PI }).hold(null).go(onLadder(F, Ld.top, 0));
  const b = crewOf(M, P, r, 'walk', w.t0 + 1.2).edge('right', F.z - 0.8).hold('bucket').go(mate);
  // the painter's height through the stages: v (the row he works at) per stage — out: bottom → top; chalk / letters / gilt: top → bottom
  let u0 = 0, yNow = 0;
  const topY = Ld.v1 - 2.6, lowY = Math.max(0.4, Ld.v0 - 1.4);
  const ks = (w.t1 - w.t0) / PAINT_TOTAL;                    // (a preview's shorter slot: the same stages, compressed)
  for (const [stage, len0] of PAINT_STAGES) {
    const len = len0 * ks, s0 = w.t0 + u0, s1 = s0 + len; u0 += len;
    if (stage === 'setup' || stage === 'pack') continue;
    const n = stage === 'out' ? 4 : stage === 'chalk' ? 3 : stage === 'letters' ? 6 : 3, rising = stage === 'out';
    a.until(s0, yNow > 0.2 ? 'paint' : 'wait', { hd: PI });
    for (let k = 0; k < n; k++) {
      const f = (k + 0.5) / n, yy = rising ? lowY + (topY - lowY) * f : topY - (topY - lowY) * f, seg = len / n;
      const dy = Math.abs(yy - yNow), cl = Math.min(seg * 0.3, 1.4 + dy * 0.9);
      a.climb(onLadder(F, Ld.top, yy), yy, cl, yy > yNow ? PI : -PI / 2); yNow = yy;
      a.pose(stage === 'chalk' ? 'reach' : 'paint', seg - cl, { hd: PI, carry: stage === 'chalk' ? 'chalk' : 'brush' });
    }
    // (a breather at the foot between the stages — down + up again)
    if (stage !== 'gilt') { a.climb(onLadder(F, Ld.top, 0), 0, 1.4 + yNow * 0.6, -PI / 2); yNow = 0; a.pose('wait', 20, { face: 0 }); }
  }
  a.climb(onLadder(F, Ld.top, 0), 0, 1.4 + yNow * 0.6, -PI / 2).until(w.t1 - 150, 'wait', { face: 0 }).go({ x: F.x + 0.5, z: F.z - 0.6 });
  const down = a.now + 0.6; a.pose('garden', 2.8, { hd: PI }).hold('ladder').exit('right', F.z);
  b.until(w.t1 - 148, 'hold', { hd: PI - 0.5 }).hold('bucket').exit('right', F.z - 0.8);
  vs.push(a.out(`${w.id}.a`, 'painter', 'painter'), b.out(`${w.id}.b`, 'painter', 'painter'));
  return { visits: vs, props: [{ kind: 'ladder', t0: up + 1.6, t1: down + 1.2, foot: F, top: Ld.top }, { kind: 'cloth', x: Ld.top.x + 0.5, z: F.z - 0.55, t0: w.t0 + 70, t1: w.t1 - 120 }], marks: { paint: { t0: w.t0, t1: w.t1 } } };
};
// ---- THE REGULARS
PLAN.newsboy = (w, M, P, r) => {
  // 7:00 (fixed): the newsboy with his folding stand under his arm, the bundles untied, papers held up for the passers; buyers now + then
  const c = crewOf(M, P, r, 'kid', w.t0 - 9).edge('left', P.newsboy.z).hold('stand').go(P.newsboy);
  const open = c.now; c.pose('garden', 6, { hd: 0 }).hold('papers');
  const vs = [], buys = [];
  let t = c.now;
  const rb = rngFrom(hashString(`buyers|${w.id}`));
  while (t < w.t1 - 30) { const dur = 20 + rb() * 40; c.pose(rb() < 0.55 ? 'wave' : 'wait', dur, { hd: -PI / 2 + 0.5 }); t = c.now; if (rb() < 0.4) buys.push(t + 2); }
  c.pose('garden', 5, { hd: 0 }); const shut = c.now; c.hold('stand').exit('left', P.newsboy.z);
  vs.push(c.out(w.id, 'newsboy', 'newsboy'));
  // the buyers: from an edge to the stand, a paper, away (a visit each, planned round the floor)
  for (const [i, bt] of buys.entries()) {
    const side = rb() < 0.5 ? 'left' : 'right', b = crewOf(M, P, rb, 'walk', bt - 14).edge(side, 42 + rb() * 6).go({ x: P.newsboy.x + 1.05, z: P.newsboy.z - 0.5 });
    if (b.now > bt + 10) continue;
    b.until(bt, 'wait', { hd: PI }).pose('cart', 5, { hd: PI }).hold('papers').exit(rb() < 0.5 ? 'left' : 'right', 40 + rb() * 8);
    vs.push(b.out(`${w.id}.b${i}`, 'buyer', rb() < 0.5 ? 'commuter' : 'walker'));
  }
  return { visits: vs, props: [{ kind: 'stand', x: P.vendor.x - 0.25, z: P.vendor.z, t0: open + 1, t1: shut, unfold: 4 }], marks: { untie: open + 2 } };
};
PLAN.evening = PLAN.newsboy;
PLAN.barber = (w, M, P, r, L, ctx) => {
  // 8:30 (fixed): in from the left, the milk taken in off the step, (a raccoon's night: the can's lid righted), into the shop; out
  // again with his broom: the step swept, the awning cranked out, back in
  const c = crewOf(M, P, r, 'walk', w.t0 - 6).edge('left', 43.2).go(P.stepStand).go(P.step);
  const take = c.now + 0.8; c.pose('garden', 1.8, { hd: PI / 2 }).hold('bottles');
  let fixLid = null;
  if (ctx && ctx.canAskew && ctx.canAskew(w.t0)) { c.hold(null).go(P.canStand); fixLid = c.now + 0.7; c.pose('garden', 1.6, { hd: PI + 0.4 }).hold('bottles').go(P.stepStand); }
  c.door('shop', 'in').hold(null).inside(5.5 * 60).door('shop', 'out').hold('broom').go(P.stepStand).pose('sweep', 48, { face: -1 }).hold(null).go(P.awning).pose('crank', 7.5, { hd: PI / 2 }).door('shop', 'in');
  return { visits: [c.out(w.id, 'barber', 'barber')], marks: { milkTake: take, lidFix: fixLid } };
};
PLAN.cop = (w, M, P, r) => {
  // the beat cop's friendly stroll: through the middle of the floor, a pause (the baton's twirl), a tip of the hat, on his way
  const am = w.kind === 'cop', a = am ? 'left' : 'right', b = am ? 'right' : 'left', z = 43 + r() * 2.5;
  const c = crewOf(M, P, r, 'stroll', w.t0).edge(a, z).go({ x: 2.4 + r() * 2, z: z - 0.6 }).pose('twirl', 5.5, { face: 0 }).pose('tipHat', 1.6, { face: am ? 1 : -1 }).exit(b, z + 1);
  return { visits: [c.out(w.id, 'cop', 'cop')], marks: { whistle: r() < 0.4 ? w.t0 + 20 + r() * 25 : null } };
};
PLAN.patrol = PLAN.cop;
PLAN.mail = (w, M, P, r) => {
  const c = crewOf(M, P, r, 'walk', w.t0).edge('right', 42.6).hold('mailbag').go({ x: P.shopDoor.x + 0.3, z: M.face - 1.4 }).pose('post', 3.2, { hd: PI / 2 }).exit('right', 41.5);
  return { visits: [c.out(w.id, 'mailman', 'mailman')] };
};
PLAN.bartender = (w, M, P, r) => ({ visits: [crewOf(M, P, r, 'walk', w.t0).edge('right', 43.4).door('side', 'in').out(w.id, 'bartender', 'staff')] });
PLAN.doorman = (w, M, P, r) => {
  // from dusk: out of the side door to his post just right of it, watching the street; a nod to each guest (the password); at the end
  // of the night he walks off home
  const c = crewOf(M, P, r, 'walk', w.t0).at(P.sideDoor).door('side', 'out').go(P.doorman).until(w.t1, 'watch', { hd: PI }).exit(r() < 0.5 ? 'left' : 'right', 42);
  return { visits: [c.out(w.id, 'doorman', 'doorman')], marks: { doorman: [w.t0 + 12, w.t1] } };
};
PLAN.flowers = (w, M, P, r) => {
  const c = crewOf(M, P, r, 'stroll', w.t0).edge('right', P.flowers.z).hold('flowers').go(P.flowers);
  const rb = rngFrom(hashString(`flowers|${w.id}`));
  while (c.now < w.t1 - 20) { c.pose('wait', 16 + rb() * 22, { face: 0 }); c.pose('offer', 4.5, { face: -1 }); }
  c.exit('right', P.flowers.z);
  return { visits: [c.out(w.id, 'flowers', 'flowers')] };
};
PLAN.musician = (w, M, P, r) => ({ visits: [crewOf(M, P, r, 'walk', w.t0).edge('right', 43.2).hold('bass').door('side', 'in').out(w.id, 'musician', 'musician')] });
PLAN.staff = (w, M, P, r) => {
  // ~2 am: the bar staff out of the side door one after another, the last one locking it, home in different directions
  const vs = [];
  for (let i = 0; i < 3; i++) {
    const c = crewOf(M, P, r, 'walk', w.t0 + i * 3.4).at(P.sideDoor).door('side', 'out');
    if (i === 2) c.go({ x: P.sideDoor.x - 0.2, z: M.face - 1.25 }).pose('post', 3.6, { hd: PI / 2 });
    c.exit(i === 1 ? 'left' : 'right', 41 + i * 2); vs.push(c.out(`${w.id}.${i}`, 'staff', 'staff'));
  }
  return { visits: vs };
};

/** the shows whose span touches [a, b] (the day's plans + the evening before; or the &force= preview's slots) */
function worksIn(a, b, ctx, cache) {
  if (ctx.force) { const out = []; for (let t = a; t <= b + 420; t += 300) for (const w of forcedWork(ctx.force, t, ctx)) if (!out.some(o => o.id === w.id)) out.push(w); return out.filter(w => w.t1 + 60 > a && w.t0 - 120 < b); }
  const off = ctx.off || 0, out = [], keys = new Set();
  for (const tt of [a - 86400, a, b]) { const d = dayOf(tt, off); if (keys.has(d.key)) continue; keys.add(d.key);
    let plan = cache.get(`P|${d.key}`); if (!plan) { plan = workDay(d.key, { ...ctx, day0: d.day0 }); cache.set(`P|${d.key}`, plan); }
    for (const w of plan) if (w.t1 + 60 > a && w.t0 - 120 < b) out.push(w); }
  return out;
}
/** the results of shows (cached per show) → { visits, roof, trucks, props, marks } */
function resultsOf(ws, world, cache) {
  const { L, M } = world, ctx = world.ctx || {};
  let P = cache.get('P'); if (!P) { P = crewSpots(L, M); cache.set('P', P); }
  const out = { visits: [], roof: [], trucks: [], props: [], marks: {}, works: ws };
  for (const w of ws) {
    let res = cache.get(`W|${w.id}`);
    if (res === undefined) { const f = PLAN[w.kind]; try { res = f ? f(w, M, P, rngFrom(w.seed), L, ctx) : null; } catch (e) { res = null; } cache.set(`W|${w.id}`, res); }
    if (!res) continue;
    for (const v of res.visits || []) if (v) out.visits.push(v);
    for (const v of res.roof || []) if (v) out.roof.push(v);
    for (const T of res.trucks || []) out.trucks.push(T);
    for (const p of res.props || []) out.props.push({ ...p, work: w.kind });
    if (res.marks) out.marks[w.kind] = { ...res.marks, t0: w.t0, t1: w.t1 };
  }
  return out;
}
/** keep the crew's own cache bounded (plans + results: a few days' worth) */
const trim = cache => { if (cache.size > 400) { let n = cache.size - 300; for (const k of cache.keys()) { if (k === 'P') continue; cache.delete(k); if (--n <= 0) break; } } };
/**
 * THE CREW over [a, b] (PURE given the cache): every show touching the span → { visits (promenade), roof (on the roof deck), trucks,
 * props, marks }. world: { L, M, ctx: { off, seed, party, force (a kind), canAskew(t), dusk(key) } }
 */
export function crewSpan(a, b, world, cache = new Map()) { trim(cache); return resultsOf(worksIn(a, b, world.ctx || {}, cache), world, cache); }
export function crewAt(t, world, cache = new Map()) {
  const res = crewSpan(t - 1, t + 1, world, cache);
  const live = v => v && t >= v.t0 - 1 && t < (v.tEnd || v.t1) + 1;
  return { ...res, visits: res.visits.filter(live), roof: res.roof.filter(live), trucks: res.trucks.filter(T => t >= T.tE && t < T.tX), props: res.props.filter(p => t >= p.t0 && t < p.t1) };
}
/** the day's plan + its marks (the things that outlast a show — the milk on the step until the barber, the bundles until the
 *  newsboy, the billboard's game, the blade's week — read from it) */
export function crewDay(key, day0, world, cache = new Map()) {
  let v = cache.get(`D|${key}`);
  if (!v) { const ctx = world.ctx || {}; let plan = cache.get(`P|${key}`); if (!plan) { plan = workDay(key, { ...ctx, day0 }); cache.set(`P|${key}`, plan); } v = { plan, marks: resultsOf(plan, world, cache).marks }; cache.set(`D|${key}`, v); }
  return v;
}
/** the repairman's TEST of a new bulb (s since the swap): a couple of quick flickers, then steady */
export const FLICK = u => (u < 0 ? 0 : u < 0.25 ? 0.8 : u < 0.5 ? 0.1 : u < 0.8 ? 0.9 : u < 1.05 ? 0.25 : 1);
/** the TRACES at t (PURE given the cache): the milk on the step, the bundles waiting, the board's game swap, the blade's repaint, the
 *  bulb / lamp fixes, the can held, the doorman's watch, the wet streak → { milk, bundles, board, blade, bulbFixed, lampFixed, canHeld, … } */
export function tracesAt(t, world, cache = new Map()) {
  const ctx = world.ctx || {}, d = dayOf(t, ctx.off || 0);
  const today = crewDay(d.key, d.day0, world, cache), yday = crewDay(prevKey(d.key), d.day0 - 86400, world, cache);
  // (a &force=work-<kind> preview: the marks of its latest slot)
  const m = ctx.force ? resultsOf(worksIn(t - 1500, t + 1, ctx, cache).filter(w => w.t0 <= t).sort((p, q) => p.t0 - q.t0), world, cache).marks : today.marks, my = ctx.force ? {} : yday.marks;
  const milk = m.milk && t >= m.milk.milkDrop && !(m.barber && m.barber.milkTake != null && t >= m.barber.milkTake) && t < d.day0 + 13 * 3600;
  const bundles = m.newsdrop && t >= m.newsdrop.bundles && !(m.newsboy && t >= m.newsboy.untie) && t < d.day0 + 12 * 3600;
  const bp = m.billposter && m.billposter.sheets;
  // the board's game: TODAY's once the billposter's last sheet is up (no billposter today: from 17:30); before that, yesterday's
  const boardDone = bp ? bp.done : d.day0 + 17.5 * 3600;
  const board = { key: t >= boardDone ? d.key : prevKey(d.key), pasting: bp && t >= bp.t0 && t < bp.done + 60 ? { u: t - bp.t0, sheets: sheetsUp(t - bp.t0), from: prevKey(d.key), to: d.key } : null, fixAt: bp ? bp.fixAt : null };
  const pt = m.painters && m.painters.paint, pk = pt ? (pt.t1 - pt.t0) / PAINT_TOTAL : 1, blade = pt && t >= pt.t0 - 60 && t < pt.t1 + 120 ? { u: t - pt.t0, ...paintStage((t - pt.t0) / pk), done: pt.t1 } : null;
  // CAUSE AND EFFECT: last evening's fault (fixed by this morning's worker) or this evening's (still out — tomorrow's job)
  const y0 = d.day0 - 86400, yKey = prevKey(d.key);
  const bo = [[bulbOut(yKey, y0, ctx), m.bulb && m.bulb.bulbFix ? m.bulb.bulbFix.t : d.day0 + 86400], [bulbOut(d.key, d.day0, ctx), Infinity]].find(([o, fx]) => o && t >= o.t && t < fx + 2.2);
  let bulbDead = null;
  if (bo) { const [o, fx] = bo, i = 5 + (o.bulb % 2); bulbDead = { i, k: t < fx ? 0 : FLICK(t - fx) }; }
  if (ctx.force === 'bulb' && m.bulb && m.bulb.bulbFix) { const fx = m.bulb.bulbFix.t; bulbDead = { i: 6, k: t < fx ? 0 : t < fx + 2.2 ? FLICK(t - fx) : 1 }; }
  const lf = [[lampFault(yKey, y0, ctx), m.lamp && m.lamp.lampFix ? m.lamp.lampFix.t : d.day0 + 86400], [lampFault(d.key, d.day0, ctx), Infinity]].find(([o, fx]) => o && t >= o.from && t < fx);
  const bl = [[boardLampOut(yKey, y0, ctx), bp ? bp.fixAt : d.day0 + 86400], [boardLampOut(d.key, d.day0, ctx), Infinity]].find(([o, fx]) => o && t >= o.t && t < fx);
  return { bulbDead, lampFault: lf ? { lamp: lf[0].lamp, from: lf[0].from, period: lf[0].period } : null, boardLampDead: bl ? bl[0].lamp : ctx.force === 'billposter' && bp && t < bp.fixAt ? 1 : null,
    milk: !!milk, bundles: !!bundles, board, blade, bladeDone: pt ? pt.t1 : null, monday: d.dow === 1, bulbFix: m.bulb && m.bulb.bulbFix ? m.bulb.bulbFix.t : null, lampFix: m.lamp && m.lamp.lampFix ? { t: m.lamp.lampFix.t, t0: m.lamp.lampFix.t0, t1: m.lamp.lampFix.t1 } : null, lidFix: m.barber ? m.barber.lidFix : null, canHeld: m.trash && m.trash.canHeld && t >= m.trash.canHeld[0] && t < m.trash.canHeld[1], doorman: m.doorman ? m.doorman.doorman : (my.doorman ? my.doorman.doorman : null), whistle: [m.cop && m.cop.whistle, m.patrol && m.patrol.whistle].filter(Boolean), day: d };
}
