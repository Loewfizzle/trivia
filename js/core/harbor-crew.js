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
import { FOLK, DOOR, planVisit, doorLeg, visitAt } from './harbor-people.js';
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
  const hyd = L.hydrant ? { x: L.hydrant.x, z: L.hydrant.z } : { x: fl.x + 0.95, z: fl.z + 0.3 };
  const bx = s.x1 + BLADE_AT.outer, bz = s.z0 + BLADE_AT.w;
  const rf = L.roof || {}, bk = rf.bulkhead || { x0: -8.7, x1: -6.9, z0: 51.4 }, bd = rf.board || { x0: -16.2, x1: -9.4, y0: 12.4, y1: 16.1, z: 55, deck: 10.5 };
  return {
    face: s.z0, deck: s.h,
    shopDoor: M.nodes.shopDoor, sideDoor: M.nodes.sideDoor,
    step: { x: M.nodes.shopDoor.x + 0.66, z: s.z0 - 0.3 }, stepStand: { x: M.nodes.shopDoor.x + 0.66, z: s.z0 - 1.0 },
    vendor: { x: L.cart ? L.cart.x : 7.85, z: L.cart ? L.cart.z : 38.4 }, newsboy: { x: (L.cart ? L.cart.x : 7.85) - 1.3, z: (L.cart ? L.cart.z : 38.4) + 0.5 },
    bundles: { x: (L.cart ? L.cart.x : 7.85) + 0.62, z: (L.cart ? L.cart.z : 38.4) - 0.12 }, stand: { x: (L.cart ? L.cart.x : 7.85) - 0.25, z: L.cart ? L.cart.z : 38.4 },
    // (POLISH 5: the fire hydrant where the can stood — the spray worker's stand beside it, on its right + a step back; the street's cans
    // now wait off screen at the curb, right)
    hydrant: hyd, hydStand: { x: hyd.x + 0.62, z: hyd.z + 0.34 },
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
    trees: (L.trees || []).map(t => ({ x: t.x, z: t.z, kind: t.kind })),   // (11a-2: the raker works under them)
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

/**
 * 8b2 (the owner's review: "the painters' LADDER POPS UP at the sign") — THE TALL LADDER is ONE object from the screen's edge to the
 * screen's edge: a 1920s two-section wooden EXTENSION LADDER (`len` a section; the fly run up on its rope to reach the crest), carried
 * IN on edge on two shoulders (`hA` from the foot end — the HOLDER leads; `hB` from the top end — the CLIMBER; `gap` between them, in
 * step), set down, its top end hoisted overhead + WALKED UP hand over hand (`hR` the hands' height, `vUp` the pace) while the holder
 * foots it, pushed upright, the fly hauled up (`pull` s a pull), tipped onto the blade's edge; the same in reverse after + carried OFF
 * by the same two. `w` / `wf`: the base's + the fly's width, `ys`: the lower rail on a shoulder, `pitch`: the rungs.
 * THE STEPLADDER (`STEPS`): carried on edge on one shoulder, swung down + stood up folded, spread, climbed; folded, swung back up, away.
 * The props' states are PURE functions of t (`at(t)`) built with the itineraries — the hands + the prop never disagree.
 */
export const LADDER = Object.freeze({ len: 5.75, w: 0.4, wf: 0.32, hA: 0.5, hB: 0.55, gap: 4.7, ys: 1.6, hR: 2.2, vUp: 0.8, pull: 0.5, pitch: 0.32, push: 0.6 });
/** 9a: the push / catch — where the rail is in front of the climber (world units ahead of him, at height y) as the ladder turns, k 0..1 from
 *  the walked-up angle to upright (the same eased turn as ladderAt's 'turn'): folk.js's hands REACH it */
export const railAhead = (y, k) => { const thU = Math.atan2(LADDER.hR, LADDER.push - HANDS.up), th = thU + (Math.PI / 2 - thU) * sm(cl01(k)); return LADDER.push - y / Math.tan(th); };
export const STEPS = Object.freeze({ ws: 0.15, d: 0.42, ys: 1.66, upend: 2.0, spread: 1.3 });
/** the painters' KIT hung on the ladder (`d` up from its foot): the paint bucket + the rolled drop cloth (`cloth`: its x extent round its
 *  middle; `un`: s to unroll / roll up) */
export const KIT = Object.freeze({ d: 1.7, cloth: [-1.2, 1.5], un: 1.6 });
/** 8b2 — the lift with the knees (folk.js's squat for 'pick' / 'set' — the props follow the same curve): s into the pose, s left */
export const liftSq = (sN, lN) => sm(cl01(sN / 0.55)) * sm(cl01(lN / 0.6));
/** the end of a ladder hoisted overhead ('raise' — mirrored for 'lower'): how far the arms are up (folk.js#jointsOf's rk) */
export const raiseK = uP => sm(cl01((uP - 0.28) / 0.5));
const cl01 = v => (v < 0 ? 0 : v > 1 ? 1 : v), sm = u => u * u * (3 - 2 * u);
/** a haul on the rope: n pulls of LADDER.pull s each (a pull eased over 3/4 of it, a beat to re-grip) → 0..1 */
const pullsK = (s, dur) => { const n = Math.max(1, Math.round(dur / LADDER.pull)), w = cl01(s / dur) * n, k = Math.min(n - 1, Math.floor(w)), q = w - k; return (k + sm(cl01(q / 0.75))) / n; };
// ------------------------------------------------------------------ A WORKER's ITINERARY (a small builder over the people's legs)
/** 8b2 — WEIGHT + TIMING (the owner): a heavy load slows the walk (ice, a crate, the can, a ladder, a bucket of paste) */
export const HEAVY = Object.freeze({ ice: 0.78, crate: 0.84, can: 0.84, ladder: 0.86, ladderA: 0.86, ladderB: 0.86, steps: 0.9, bucket: 0.92, paste: 0.92, bundle: 0.9 });
function crewOf(M, P, r, gait, t, start, vFix = null) {
  const legs = [], v0 = vFix != null ? vFix : FOLK.speed[gait || 'walk'] * (0.92 + r() * 0.16);
  let now = t, cur = start ? { ...start } : null, carry = null, y = 0;
  const vNow = () => v0 * (HEAVY[carry] || 1), v = v0;
  const push = lg => { legs.push({ carry, ...lg }); now = lg.t1; };
  const B = {
    get now() { return now; }, get cur() { return cur; }, v,
    wait(dur) { if (dur > 0.01) push({ k: 'pose', pose: 'wait', x: cur.x, z: cur.z, t0: now, t1: now + dur, y }); return B; },
    /** indoors for a while (after a door in, before a door out): off the promenade */
    inside(dur) { if (dur > 0.01) push({ k: 'gap', x: cur.x, z: cur.z, t0: now, t1: now + dur }); return B; },
    until(tt, pose = 'wait', o = {}) { return tt > now + 0.01 ? B.pose(pose, tt - now, o) : B; },
    hold(c) { carry = c; return B; },
    /** 8b2 — a load off the truck's bed: the hands in empty, out with it (to the shoulder for a shoulder load) — never in hand before */
    unload(dur, what) { return B.pose('unload', dur, { hd: 0, carry: what }).hold(what); },
    at(p) { cur = { x: p.x, z: p.z }; return B; },
    /** a straight walk (explicit points — onto / off the road, along the catwalk) */
    line(pts, vv = vNow()) { let d = 0, last = cur; for (const p of pts) { d += Math.hypot(p.x - last.x, p.z - last.z); last = p; } if (d < 0.02) { cur = { ...last }; return B; } push({ k: 'walk', pts: [cur, ...pts], t0: now, t1: now + d / vv, v: vv, y }); cur = { x: last.x, z: last.z }; return B; },
    /** a routed walk on the map (round the bench, the lamps, the building) */
    go(p, vv = vNow()) {
      const vis = planVisit({ look: 'worker', gait: 'walk', goals: [{ at: p }] }, now, M, { r, start: cur });
      if (!vis) return B.line([p], vv);
      const k = vv / Math.max(0.01, vis.v), t0 = now;
      for (const lg of vis.legs) push({ ...lg, t0: t0 + (lg.t0 - t0) / k, t1: t0 + (lg.t1 - t0) / k, v: lg.v * k, y });
      cur = { x: vis.end.x, z: vis.end.z }; return B;
    },
    pose(pose, dur, o = {}) { if (dur <= 0.01) return B; push({ k: 'pose', pose, x: cur.x, z: cur.z, t0: now, t1: now + dur, hd: o.hd, face: o.face, y: o.y != null ? o.y : y, ...(o.carry !== undefined ? { carry: o.carry } : {}) }); return B; },
    /** up / down a ladder: from where they stand to (x1, z1) at height y1 (rung by rung — the 'climb' pose) */
    climb(p1, y1, dur, hd) { push({ k: 'pose', pose: 'climb', x: cur.x, z: cur.z, x1: p1.x, z1: p1.z, y0: y, y1, t0: now, t1: now + dur, hd }); cur = { x: p1.x, z: p1.z }; y = y1; return B; },
    /** 8b2 — walking BACKWARD (facing hd) to p1 at LADDER.vUp: lowering a tall ladder hand over hand (folk.js: the stride run in reverse) */
    back(p1, dur, hd) { push({ k: 'pose', pose: 'walkback', x: cur.x, z: cur.z, x1: p1.x, z1: p1.z, t0: now, t1: now + dur, hd, y }); cur = { x: p1.x, z: p1.z }; return B; },
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
  const c = crewOf(M, P, r, 'brisk', T.tA + 1.4).fromTruck(T).tail(T).unload(1.6, 'bottles').fromTail(T).go(P.stepStand).go(P.step);
  const drop = c.now + 0.9; c.pose('set', 1.8, { hd: PI / 2 }).hold(null).go(P.stepStand).toTruck(T);
  return { visits: [c.out(w.id, 'milk', 'milkman')], marks: { milkDrop: drop } };
});
PLAN.newsdrop = (w, M, P, r, L) => truckShow(L, w, M, P, r, T => {
  const c = crewOf(M, P, r, 'brisk', T.tA + 1.2).fromTruck(T).tail(T).unload(1.2, 'bundle').fromTail(T).go(P.bundles);
  const drop = c.now + 0.65; c.pose('set', 1.3, { hd: -PI / 2 }).hold(null).toTruck(T);
  return { visits: [c.out(w.id, 'newsdrop', 'worker')], marks: { bundles: drop } };
});
PLAN.trash = (w, M, P, r, L) => truckShow(L, w, M, P, r, T => {
  // POLISH 5 (the hydrant took the can's spot): the collector off along the curb to the street's cans OFF SCREEN (right — the open side;
  // left is the bench's corner + the building), back with a full can on his shoulder, to the truck's tail, tipped in over the side,
  // carried back out, empty-handed back to his cab
  const c = crewOf(M, P, r, 'walk', T.tA + 1.6).fromTruck(T).exit('right', FOLK.curbZ).wait(2.2).hold('can');
  c.tail(T).pose('tip', 2.8, { hd: PI / 2 }).fromTail(T).exit('right', FOLK.curbZ).wait(1.6).hold(null).toTruck(T);
  return { visits: [c.out(w.id, 'trash', 'trashman')], marks: {} };
});
/** POLISH 5 — THE HYDRANT ON A HOT DAY (the owner: ~85 °F+ / 29 °C+, the afternoon): a city worker in from the left with his hydrant wrench,
 *  the cap off + the stem turned (the SPRAY: a sparkling arc onto the cobbles, its wet patch spreading), he stands back while it runs,
 *  a kid runs through it, shut + capped, away; the patch dries over HYD.dry (core/harbor-crew.js#tracesAt → hydrant) */
export const HYD = Object.freeze({ open: 3.2, spray: 150, close: 3.4, dry: 12 * 60, kidAt: 52 });
PLAN.hydrant = (w, M, P, r) => {
  const c = crewOf(M, P, r, 'walk', w.t0).edge('left', P.hydStand.z).hold('wrench').go(P.hydStand);
  const t0 = c.now; c.pose('pick', HYD.open, { hd: PI + 0.5 });
  const sprayOn = c.now; c.go({ x: P.hydrant.x - 1.45, z: P.hydStand.z + 0.75 }).pose('watch', HYD.spray - 2.5, { hd: -0.35 });   // (stepped back, left of it: clear of the arc)
  c.go(P.hydStand); const sprayOff = c.now + HYD.close * 0.6; c.pose('pick', HYD.close, { hd: PI + 0.5 }).exit('left', P.hydStand.z);
  // a kid in from the right, straight through the spray (a whoop + the splash), off to the left
  const k = crewOf(M, P, r, 'kid', sprayOn + HYD.kidAt).edge('right', P.hydStand.z + 0.4).go({ x: P.hydrant.x + 2.4, z: P.hydStand.z + 0.4 })
    .line([{ x: P.hydrant.x - 1.6, z: P.hydrant.z + 0.45 }]).exit('left', P.hydStand.z + 0.4);
  return { visits: [c.out(w.id, 'hydrant', 'worker'), k.out(`${w.id}.kid`, 'hydrant-kid', 'kid', { gait: 'kid' })], marks: { spray: [sprayOn, sprayOff], t0 } };
};
PLAN.ice = (w, M, P, r, L) => truckShow(L, w, M, P, r, T => {
  const c = crewOf(M, P, r, 'walk', T.tA + 1.5).fromTruck(T).tail(T).unload(2.2, 'ice').fromTail(T).door('side', 'in');
  c.inside(32 + r() * 12).hold(null).door('side', 'out').toTruck(T);
  return { visits: [c.out(w.id, 'ice', 'iceman')] };
});
PLAN.soda = (w, M, P, r, L) => truckShow(L, w, M, P, r, T => {
  // two men, two trips each: a crate of soda water (wink) on the shoulder, in at the side door
  const vs = [];
  for (let i = 0; i < 2; i++) {
    const c = crewOf(M, P, r, 'walk', T.tA + 1.4 + i * 1.6).fromTruck(T, i);
    for (let trip = 0; trip < 2; trip++) { c.tail(T, i).unload(1.8, 'crate').fromTail(T, i).door('side', 'in').inside(5 + r() * 4).hold(null).door('side', 'out'); }
    c.toTruck(T, i); vs.push(c.out(`${w.id}.${i}`, 'soda', 'worker'));
  }
  return { visits: vs };
});
function bootlegCrew(w, M, P, r, T, trips) {
  // a quiet truck (no lamps): two men pass crates down the open CELLAR HATCH in front of the basement window; a lookout on the corner
  const vs = [], hatchAt = T.tA + 4, endAt = [];
  for (let i = 0; i < 2; i++) {
    const c = crewOf(M, P, r, 'brisk', T.tA + 1.2 + i * 1.4).fromTruck(T, i);
    for (let k = 0; k < trips; k++) { c.tail(T, i).unload(1.4, 'crate').fromTail(T, i).go({ x: P.cellar.x + (i ? 0.7 : -0.7), z: P.cellar.z - 0.55 }).pose('set', 1.6, { hd: PI / 2 }).hold(null); }
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
      legs.push({ k: 'pose', pose: st.moving ? 'wait' : 'squeegee', x, z: W.z, t0: t, t1, hd: PI / 2, y: st.y + 0.12, plat: true, carry: 'squeegee' });
      t = t1;
    }
    legs.push({ k: 'fade', x: legs[legs.length - 1].x, z: W.z, t0: offAt, t1: offAt + 0.8, out: true, y: platformAt(len - 4, len).y + 0.12 });
    const back = crewOf(M, P, r, 'walk', offAt + 40 + i * 2.5).at(P.sideDoor).hold('bucket').door('side', 'out').exit('right', 43);
    const a = c.out(`${w.id}.${i}a`, 'washer', 'washer'), b = back.out(`${w.id}.${i}b`, 'washer', 'washer');
    vs.push(a, { id: `${w.id}.${i}p`, kind: 'washer', routine: 'work', idx: i, look: 'washer', gait: 'walk', legs, t0: legs[0].t0, t1: legs[legs.length - 1].t1, tEnd: legs[legs.length - 1].t1, members: [{ role: 'lead', dx: 0, dz: 0, lag: 0, seed: a ? a.members[0].seed : 7 }], plat: true }, b);
  }
  // (8b2: the rig SWUNG OUT over the parapet before they step onto it — the davits turning out, the deck lifted over the edge + down to
  // its park — and swung back in after they're off: never popped; workers.js#platform, `swing` s each way)
  return { visits: vs, props: [{ kind: 'platform', t0: w.t0 - 9, t1: w.t1 + 9, swing: 8, len, start: w.t0, u0: W.u0, u1: W.u1, z: W.z, x0: W.x0 }] };
};
PLAN.xlights = (w, M, P, r, L) => {
  // 11a-2 — BLACK FRIDAY: THE FIRST CHRISTMAS CREW (core/harbor-xmas.js). The electrician's van pulls up at the stop; two riggers carry
  // a box of light strings each in at the side door — up on the roof they let the WINDOW WASHERS' RIG down over the parapet and work
  // the front bay by bay (the cornice as it goes down past it, the top floor's sills, a floor down, the lower sills), leaving a string
  // of big bulbs hung along every sill; the third man takes the STEPLADDER to the awning, two stands along it, and strings its edge,
  // then loads the ladder + drives the van off. The riggers come down + walk off when the rig is wound back up. (A scene to WATCH: the
  // strings appear on screen as they work — the off-camera rule's exception.)
  const s = L.speakeasy, aw = s.awning, W = P.wash, len = w.t1 - w.t0;
  let inAt = w.t0;
  const marks = { awning: [] }, props = [];
  const res = truckShow(L, w, M, P, r, T => {
    const vs = [];
    for (let i = 0; i < 2; i++) {
      const c = crewOf(M, P, r, 'walk', T.tA + 1.4 + i * 1.8).fromTruck(T, i).tail(T, i).unload(1.8, 'lights').fromTail(T, i).door('side', 'in');
      inAt = Math.max(inAt, c.now); vs.push(c.out(`${w.id}.${i}a`, 'xlights', 'lineman'));
    }
    // the stepladder man: off the bed with the ladder, to the awning's left half, the ladder set + climbed, the string hung across that
    // half, down, the ladder moved to the right half, the same, back to the van with it
    const c = crewOf(M, P, r, 'walk', T.tA + 6).fromTruck(T, 1).tail(T, 1).unload(2.0, 'ladder').fromTail(T, 1);
    const zs = s.z0 - 0.78, spots = [s.x0 + aw.u0 + (aw.u1 - aw.u0) * 0.27, s.x0 + aw.u0 + (aw.u1 - aw.u0) * 0.73], work = Math.max(30, Math.min(70, len * 0.05));
    for (const x of spots) {
      c.go({ x, z: zs }).pose('set', 1.6, { hd: PI / 2 }).hold('lights');
      const set = c.now;
      c.climb({ x, z: zs }, 1.25, 2.4, PI / 2);
      const a = c.now; c.pose('reach', work, { hd: PI / 2 }); marks.awning.push([a, c.now]);
      c.climb({ x, z: zs }, 0, 2.2, -PI / 2).pose('fold', 1.4, { hd: PI / 2 }).hold('ladder');
      props.push({ kind: 'steps', t0: set - 0.2, t1: c.now, foot: { x, z: zs + 0.12 }, top: { x, y: 1.2, z: zs + 0.12 } });
    }
    c.tail(T, 1).pose('set', 1.8, { hd: 0, carry: null }).hold(null).fromTail(T, 1).toTruck(T, 1);
    vs.push(c.out(`${w.id}.2`, 'xlights', 'lineman'));
    return { visits: vs };
  });
  // the rig: from a little after they're in to the show's last minutes
  const r0 = inAt + 45, r1 = Math.max(r0 + 120, w.t1 - 110), rl = r1 - r0, vs = [...res.visits];
  for (let i = 0; i < 2; i++) {
    const onAt = r0 + 4, offAt = r1 - 2, steps = 36;
    let t = onAt;
    const legs = [{ k: 'fade', x: W.x0 + (i ? 8.85 : 7.85), z: W.z, t0: onAt - 0.8, t1: onAt, out: false, y: platformAt(4, rl).y + 0.12 }];
    for (let k = 0; k < steps; k++) {
      const t1 = onAt + (offAt - onAt) * (k + 1) / steps, st = platformAt((t + t1) / 2 - r0, rl), bay = st.bay ? [7.4, 9.3] : [4.2, 6.1];
      const u = i ? bay[1] - 0.45 : bay[0] + 0.45, x = W.x0 + u + (r() - 0.5) * 0.3;
      legs.push({ k: 'pose', pose: st.moving ? 'wait' : 'reach', x, z: W.z, t0: t, t1, hd: PI / 2, y: st.y + 0.12, plat: true, carry: 'lights' });
      t = t1;
    }
    legs.push({ k: 'fade', x: legs[legs.length - 1].x, z: W.z, t0: offAt, t1: offAt + 0.8, out: true, y: platformAt(rl - 4, rl).y + 0.12 });
    vs.push({ id: `${w.id}.${i}p`, kind: 'xlights', routine: 'work', idx: i, look: 'lineman', gait: 'walk', legs, t0: legs[0].t0, t1: legs[legs.length - 1].t1, tEnd: legs[legs.length - 1].t1, members: [{ role: 'lead', dx: 0, dz: 0, lag: 0, seed: Math.floor(r() * 1e6) }] });
    const back = crewOf(M, P, r, 'walk', offAt + 35 + i * 2.5).at(P.sideDoor).door('side', 'out').exit('right', 43);
    vs.push(back.out(`${w.id}.${i}b`, 'xlights', 'lineman'));
  }
  props.push({ kind: 'platform', t0: r0 - 9, t1: r1 + 9, swing: 8, len: rl, start: r0, u0: W.u0, u1: W.u1, z: W.z, x0: W.x0 });
  // THE STRINGS as they're hung (screens/harbor/xlights.js draws them; core/harbor-xmas.js#sillsAt — the rig's order)
  props.push({ kind: 'xlights', t0: w.t0, t1: w.t1 + 1, rig: { start: r0, len: rl }, awning: marks.awning });
  return { ...res, visits: vs, props: [...(res.props || []), ...props] };
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
PLAN.raker = (w, M, P, r) => {
  // 11a-2 — THE LEAF RAKER: in from the left with his rake; under two trees on the floor (the crabapple by the bench, a tree on the right)
  // he rakes the fallen leaves into a pile (the pile GROWS as he works, its leaves drawn by workers.js#leafPile), then bags each pile (it
  // shrinks into the sack) and carries the sack off to the right
  // (the crabapple at the back by the bench: in front of it; the framing maple on the front strip: just behind it, on the floor)
  const zMin = FOLK.zMin + 0.35, zMax = FOLK.zMax - 0.6, crab = P.trees.find(t => t.kind === 'crab'), right = P.trees.filter(t => t !== crab).sort((a, b) => b.x - a.x)[0];
  const spots = [crab, right].filter(Boolean).map((t, i) => ({ x: t.x + (i ? -1.7 : 1.6), z: Math.min(zMax, Math.max(zMin + 0.3, t.z > 45 ? t.z - 1.7 : t.z + 1.5)) }));
  const c = crewOf(M, P, r, 'walk', w.t0).edge('left', 42.4).hold('rake'), piles = [];
  for (const [i, sp] of spots.entries()) {
    c.go(sp);
    const g0 = c.now;
    for (let k = 0; k < 4; k++) c.pose('sweep', 70 + r() * 40, { face: k % 2 ? 1 : -1 });
    piles.push({ kind: 'leafpile', x: sp.x + (i ? -0.85 : 0.85), z: sp.z + 0.25, seed: Math.floor(r() * 1e6) + i, grow: [g0 + 10, c.now], gone: null, t0: g0 });
  }
  // bag them: at each pile a minute stooped over it (the pile shrinks into the sack), the sack carried off
  c.hold(null);
  for (const p of piles) { c.go({ x: p.x + 0.7, z: p.z - 0.2 }); const b0 = c.now; c.pose('pick', 55, { face: -1 }); p.gone = [b0 + 4, c.now - 3]; p.t1 = c.now; c.hold('sack'); }
  c.exit('right', 41.6);
  return { visits: [c.out(w.id, 'raker', 'raker')], props: piles };
};
PLAN.billposter = (w, M, P, r) => {
  // ~5–6 pm: in at the side door with his paste bucket, the roll of sheets + the long brush; up through the hatch, across the deck,
  // up the board's ladder to the catwalk; each sheet pasted (the long brush up the board, the sheet smoothed); a dead lamp fixed; down
  const R = { rects: [], circles: [], exits: M.exits, nodes: M.nodes, face: M.face }, B = P.board, yW = B.walkY;
  const a = crewOf(M, P, r, 'walk', w.t0 - 95).edge('right', 43).hold('paste').door('side', 'in');
  const c = crewOf(R, P, r, 'walk', w.t0 + 4).at(P.hatch).hold('poster').fade(false).line([{ x: B.ladderX + 0.3, z: B.footZ }]).climb({ x: B.ladderX + 0.3, z: B.walkZ }, yW, 4.2, PI / 2);
  const colX = i => B.x0 + (B.x1 - B.x0) * (i + 0.5) / SHEETS.cols, sheets = [];
  // (to the first sheet by its start: SHEETS.from s after his show's start)
  c.line([{ x: colX(0), z: B.walkZ }], 0.9).until(w.t0 + SHEETS.from - 2, 'wait', { hd: PI / 2 });
  for (let row = 0; row < SHEETS.rows; row++) for (let col = 0; col < SHEETS.cols; col++) {
    const s0 = w.t0 + SHEETS.from + (row * SHEETS.cols + col) * SHEETS.per;
    c.line([{ x: colX(col) + (r() - 0.5) * 0.4, z: B.walkZ }], 0.9).until(s0, 'wait', { hd: PI / 2 });
    c.pose(row ? 'paste' : 'pastehi', SHEETS.per - 5, { hd: PI / 2 }); sheets.push(s0);
  }
  const fixAt = c.now + 6;
  c.line([{ x: B.x0 + (B.x1 - B.x0) * 0.25, z: B.walkZ }], 0.9).pose('reach', SHEETS.fix * 0.5, { hd: PI / 2 });
  c.line([{ x: B.ladderX + 0.3, z: B.walkZ }], 0.9).climb({ x: B.ladderX + 0.3, z: B.footZ }, 0, 4.2, -PI / 2).line([P.hatch]).fade(true);
  const d = crewOf(M, P, r, 'walk', c.now + 30).at(P.sideDoor).hold('paste').door('side', 'out').exit('right', 43);
  return { visits: [a.out(`${w.id}.in`, 'billposter', 'billposter'), d.out(`${w.id}.out`, 'billposter', 'billposter')], roof: [c.out(w.id, 'billposter', 'billposter')], marks: { sheets: { t0: w.t0, done: c.now - SHEETS.fix, fixAt } } };
};
/** where a climber stands on a leaning ladder at height y (their feet): along it from the foot toward the top, just in front of it */
const onLadder = (foot, top, y) => { const f = Math.max(0, Math.min(1, y / Math.max(0.5, top.y))); return { x: foot.x + (top.x - foot.x) * f, z: Math.min(foot.z, top.z) - 0.12 }; };
// ---- THE TALL LADDER, CARRIED BY TWO (the painters, the bulb's repairmen): see LADDER. tallLadder() → { a (the CLIMBER's builder, at the
// foot ready to climb), b (the HOLDER's), up (the moment it rests on the blade), down(a, b) (the takedown + the carry off → the props) }.
// The ladder's state on the clock is ONE function of t (`at(t)` → { x, y (the lower rail's foot), th (0 = lying on edge, its top to
// the right; π/2 upright), e (the fly run up), z }) built from the same numbers as the two men's legs:
//   move (on two shoulders; x = the holder's x − hA) · set (lowered with the knees — folk.js's squat curve) · ground · lift (the top end
//   hoisted overhead by the climber — the angle from his hands) · walk (walked up hand over hand: the angle from where his hands are) ·
//   turn (pushed upright; tipped onto the blade; back) · ext (the fly hauled up / let down, pull by pull) · stand · … the reverse · pick · move
export const HANDS = Object.freeze({ up: 0.17, low: 0.48, hold: 0.55 });            // (the hands ahead of the body: overhead / in a squat / 'hold')
function ladderAt(ph, G) {
  const X = LADDER, thOf = (hy, hx) => Math.atan2(hy, Math.max(0.05, hx - G.px));
  return t => {
    let s = null;
    for (const q of ph) if (t >= q.t0 && t < q.t1) { s = q; break; }
    if (!s) return null;
    const d = Math.max(1e-3, s.t1 - s.t0), sN = t - s.t0, lN = s.t1 - t, u = cl01(sN / d);
    let x = G.px, y = 0, th = 0, e = 0;
    if (s.k === 'move') { x = s.x0 + (s.x1 - s.x0) * u; y = X.ys; }
    else if (s.k === 'set') y = u < 0.5 ? X.ys * (1 - liftSq(sN, lN)) : 0;
    else if (s.k === 'pick') y = u < 0.5 ? 0 : X.ys * (1 - liftSq(sN, lN));
    else if (s.k === 'lift') { const k = raiseK(s.down ? 1 - u : u); th = thOf(X.hR * k, s.ha + (s.hb - s.ha) * k); }
    else if (s.k === 'walk') th = thOf(X.hR, s.xa + (s.xb - s.xa) * u - HANDS.up);
    else if (s.k === 'turn') { th = s.thA + (s.thB - s.thA) * sm(u); e = s.e; }
    else if (s.k === 'ext') { th = PI / 2; e = G.E * (s.down ? 1 - pullsK(sN, d) : pullsK(sN, d)); }
    else if (s.k === 'stand') { th = G.thL; e = G.E; }
    return { x, y, th, e, z: G.zL };
  };
}
function tallLadder(M, P, r, t0, kit = false) {
  const X = LADDER, Ld = P.ladder, F = Ld.foot, T = Ld.top, zL = F.z, zC = zL - 0.17, zF = zL - 0.22;   // (carried on their FAR shoulders: they walk in front of it)
  const thL = Math.atan2(T.y, T.x - F.x), px = F.x + (X.w / 2) * Math.sin(thL), E = Math.hypot(T.x - F.x, T.y) - X.len;
  const ex = M.exits.right, e0 = Array.isArray(ex) ? ex.reduce((p, q) => (Math.abs(q.z - zC) < Math.abs(p.z - zC) ? q : p)) : ex;
  const xS = Math.max(16, e0.x) + X.hA + 1.4, xH = px + X.hA, xR = px + 5.45, xU = px + X.push;   // (in from past the edge; the holder's stop; the hoist; the push)
  const v0 = FOLK.speed.walk * (0.94 + r() * 0.1), ph = [], G = { px, zL, E, thL }, kitOn = [], props = [];
  const footAt = { x: F.x + 0.12, z: zL + 0.45 };                     // (the holder footing it: behind its foot, facing out)
  // (the painters' KIT — the paint bucket + the rolled drop cloth — rides hung on the ladder, KIT.d up from its foot; the cloth spread
  // under the blade, the bucket on it)
  const kd = KIT.d, CL = { x: F.x - 0.61, z: zL - 0.55 }, edgeC = { x: CL.x + KIT.cloth[1] + 0.42, z: CL.z }, KG = { x: px + kd, z: zL - 0.62 };
  const roundFoot = (c, to) => c.line([{ x: px - 0.55, z: zL + 0.2 }, { x: px - 0.5, z: zL - 0.4 }, to]);
  const roundFootBack = c => c.line([{ x: px - 0.5, z: zL - 0.4 }, { x: px - 0.55, z: zL + 0.2 }, footAt]);
  // IN: both from past the right edge on the same line, the same pace, a ladder's length apart (folk.js keeps them in step)
  const b = crewOf(M, P, r, 'walk', t0, null, v0).at({ x: xS, z: zC }).hold('ladderA').line([{ x: xH, z: zC }]);
  const a = crewOf(M, P, r, 'walk', t0, null, v0).at({ x: xS + X.gap, z: zC }).hold('ladderB').line([{ x: xH + X.gap, z: zC }]);
  const tA = b.now; ph.push({ k: 'move', t0, t1: tA, x0: xS - X.hA, x1: px });
  // SET DOWN together (with the knees), on edge on the cobbles
  b.pose('set', 1.8, { hd: PI }).hold(null); a.pose('set', 1.8, { hd: PI }).hold(null); ph.push({ k: 'set', t0: tA, t1: tA + 1.8 });
  if (kit) {
    // the holder round its foot to the front: the kit off the ladder, the drop cloth unrolled under the blade + the bucket on it
    b.line([{ x: px + kd, z: zL - 0.42 }]);
    const k0 = b.now; b.pose('pick', 1.6, { hd: PI / 2, carry: 'kit' }).hold('kit'); kitOn.push([t0, k0 + 0.8]);
    b.line([edgeC]);
    const c0 = b.now; b.pose('set', 1.8, { hd: PI, carry: 'kit' }).hold(null);
    props.push({ kind: 'cloth', x: CL.x, z: CL.z, t0: c0 + 0.9, t1: Infinity, un: KIT.un });
    roundFootBack(b);
  } else roundFootBack(b);
  // the climber a step along to its top end (the holder foots it: behind its foot, facing out over it)
  a.line([{ x: xR, z: zF }]);
  // HOIST the top end overhead (a squat, then up) — then WALK IT UP hand over hand toward the foot; PUSH it upright
  const tR = Math.max(a.now, b.now - 2.6); a.until(tR, 'wait', { hd: PI }); ph.push({ k: 'ground', t0: tA + 1.8, t1: tR });
  a.pose('raise', 3.2, { hd: PI }); ph.push({ k: 'lift', t0: tR, t1: a.now, ha: xR - HANDS.low, hb: xR - HANDS.up });
  const tW = a.now; a.hold('walkup').line([{ x: xU, z: zF }], X.vUp).hold(null); ph.push({ k: 'walk', t0: tW, t1: a.now, xa: xR, xb: xU });
  const thU = Math.atan2(X.hR, xU - HANDS.up - px);
  let t1 = a.now; a.pose('push', 1.5, { hd: PI }); ph.push({ k: 'turn', t0: t1, t1: a.now, thA: thU, thB: PI / 2, e: 0 });
  // the FLY hauled up its rope, pull by pull; then the top tipped over onto the blade's edge
  t1 = a.now; a.pose('haul', 10 * X.pull, { hd: PI }); ph.push({ k: 'ext', t0: t1, t1: a.now });
  t1 = a.now; a.pose('hold', 1.4, { hd: PI }); ph.push({ k: 'turn', t0: t1, t1: a.now, thA: PI / 2, thB: thL, e: E });
  const up = a.now; a.line([onLadder(F, T, 0)], 0.7);
  const down = (aa, bb) => {
    // DOWN (the reverse, the holder footing it all the while): the cloth rolled up first + the kit set by the ladder; off the blade, the
    // fly let down, caught + WALKED BACK, the end lowered; the kit hung back on; the two at its ends, lifted together, carried OFF the way
    // they came (the holder behind at the foot end, in step)
    if (kit) {
      bb.until(aa.now, 'hold', { hd: -PI / 2 });
      roundFoot(bb, edgeC);
      const c1 = bb.now; bb.pose('pick', 1.8, { hd: PI, carry: 'kit' }).hold('kit'); props[0].t1 = c1 + 0.9;
      bb.line([KG]);
      const g0 = bb.now; bb.pose('set', 1.6, { hd: PI / 2, carry: 'kit' }).hold(null); props.push({ kind: 'kit', x: KG.x, z: KG.z, t0: g0 + 0.8, t1: Infinity });
      roundFootBack(bb);
      aa.until(bb.now, 'wait', { face: 0 });
    }
    aa.line([{ x: xU, z: zF }], 0.7);
    const t2 = aa.now; ph.push({ k: 'stand', t0: up, t1: t2 });
    aa.pose('hold', 1.4, { hd: PI }); ph.push({ k: 'turn', t0: t2, t1: aa.now, thA: thL, thB: PI / 2, e: E });
    let t3 = aa.now; aa.pose('haul', 9 * X.pull, { hd: PI }); ph.push({ k: 'ext', t0: t3, t1: aa.now, down: true });
    t3 = aa.now; aa.pose('catch', 1.5, { hd: PI }); ph.push({ k: 'turn', t0: t3, t1: aa.now, thA: PI / 2, thB: thU, e: 0 });
    t3 = aa.now; aa.back({ x: xR, z: zF }, (xR - xU) / X.vUp, PI); ph.push({ k: 'walk', t0: t3, t1: aa.now, xa: xU, xb: xR });
    t3 = aa.now; aa.pose('lower', 3.2, { hd: PI }); ph.push({ k: 'lift', t0: t3, t1: aa.now, ha: xR - HANDS.low, hb: xR - HANDS.up, down: true });
    const tG = aa.now;
    bb.until(tG + 0.3, 'hold', { hd: -PI / 2 });
    if (kit) {
      // the kit back off the cobbles + hung on the ladder where it rode in
      roundFoot(bb, KG);
      const g1 = bb.now; bb.pose('pick', 1.6, { hd: PI / 2, carry: 'kit' }).hold('kit'); props[1].t1 = g1 + 0.8;
      bb.line([{ x: px + kd, z: zL - 0.42 }]);
      const h0 = bb.now; bb.pose('set', 1.6, { hd: PI / 2, carry: 'kit' }).hold(null); kitOn.push([h0 + 0.8, Infinity]);
      bb.line([{ x: xH, z: zC }]);
    } else roundFoot(bb, { x: xH, z: zC });
    aa.line([{ x: xH + X.gap, z: zC }]);
    const tK = Math.max(aa.now, bb.now) + 0.4; aa.until(tK, 'wait', { hd: 0 }); bb.until(tK, 'wait', { hd: 0 }); ph.push({ k: 'ground', t0: tG, t1: tK });
    aa.pose('pick', 1.8, { hd: 0, carry: 'ladderB' }).hold('ladderB'); bb.pose('pick', 1.8, { hd: 0, carry: 'ladderA' }).hold('ladderA'); ph.push({ k: 'pick', t0: tK, t1: tK + 1.8 });
    const tO = aa.now; aa.line([{ x: xS + X.gap, z: zC }]); bb.line([{ x: xS, z: zC }]); ph.push({ k: 'move', t0: tO, t1: bb.now, x0: px, x1: xS - X.hA });
    return [{ kind: 'xladder', t0, t1: bb.now + 0.05, at: ladderAt(ph, G), len: X.len, w: X.w, wf: X.wf, z: zL, kit: kit ? kitOn : null, kd },
      // (the moment it rests on the blade — people.js's ladder-clank + the E2E read it)
      { kind: 'ladder', mark: true, t0: up, t1: t2, foot: F, top: T }, ...props];
  };
  return { a, b, up, down, F, T };
}
// ---- THE STEPLADDER (the lampman's — one man): its state on the clock, from his own legs (the carry rides his near shoulder; upend: its
// foot swung down to the cobbles, then its top up over it; spread / fold; the same back onto the shoulder) → { fb (the front legs' foot),
// bb (the back legs'), tp (the top), z } in world units
function stepsAt(vis, ph, G) {
  const S = STEPS;
  const onSh = st => { const c = Math.cos(st.hd), s = Math.sin(st.hd);
    // (on edge on the near shoulder — toward us, walking across; over the head, walking toward us / away — its feet leading)
    const C = { x: st.x, y: S.ys + S.ws / 2, z: st.z - 0.2 * Math.min(1, Math.abs(c) * 1.4) }, hx = -c, hz = -s, L2 = G.Ls / 2;
    return { fb: { x: C.x - hx * L2, y: C.y, z: C.z - hz * L2 }, bb: null, tp: { x: C.x + hx * L2, y: C.y, z: C.z + hz * L2 }, z: C.z, n: [0, 1, 0] }; };
  return t => {
    let s = null;
    for (const q of ph) if (t >= q.t0 && t < q.t1) { s = q; break; }
    if (!s) return null;
    if (s.k === 'carry') { const st = visitAt(vis, t); if (!st) return null; const o = onSh(st); o.bb = o.fb; return o; }
    const d = Math.max(1e-3, s.t1 - s.t0), u0 = cl01((t - s.t0) / d), u = s.down ? 1 - u0 : u0;
    if (s.k === 'upend') {
      // the foot swung down + forward to its spot (the top kept near his shoulder), then the top swung up over it
      const C0 = s.C, D = G.dir || -1, B0 = { x: C0.x + D * G.Ls / 2, y: C0.y }, ka = sm(cl01(u / 0.5)), kb = sm(cl01((u - 0.5) / 0.5));
      const phi = u < 0.5 ? G.phm * ka : G.phm + (PI / 2 - G.phm) * kb;
      const B = u < 0.5 ? { x: B0.x + (G.x - B0.x) * ka, y: B0.y * (1 - ka) } : { x: G.x, y: 0 }, z = C0.z + (G.z - C0.z) * ka;
      const fb = { x: B.x, y: B.y, z }, tp = { x: B.x - D * G.Ls * Math.cos(phi), y: B.y + G.Ls * Math.sin(phi), z };
      return { fb, bb: fb, tp, z, n: [-Math.sin(phi), -D * Math.cos(phi), 0] };
    }
    const D = G.dir || -1, dd = s.k === 'spread' ? S.d * sm(u) : S.d, h = Math.sqrt(G.Ls * G.Ls - dd * dd);
    return { fb: { x: G.x + D * dd, y: 0, z: G.z }, bb: { x: G.x - D * dd, y: 0, z: G.z }, tp: { x: G.x, y: h, z: G.z }, z: G.z, n: [-h / G.Ls, -D * dd / G.Ls, 0] };
  };
}
PLAN.bulb = (w, M, P, r) => {
  // the morning after a marquee bulb went: two repairmen carry the tall ladder in, raise it against the blade's edge; one climbs, swaps
  // the bulb at the crest (the test flicker), down, the ladder away
  const L = tallLadder(M, P, r, w.t0), { a, b, F, T } = L, y = T.y - 2.0, work = 26;
  a.climb(onLadder(F, T, y), y, 6.5, PI);
  const f0 = a.now; a.pose('reach', work, { hd: PI });
  const f1 = a.now; a.climb(onLadder(F, T, 0), 0, 6.0, -PI / 2);
  const props = L.down(a, b);
  return { visits: [a.out(`${w.id}.a`, 'repairman', 'repairman'), b.out(`${w.id}.b`, 'repairman', 'repairman')], props, marks: { bulbFix: { t: f0 + work * 0.72, t0: f0, t1: f1 } } };
};
PLAN.lamp = (w, M, P, r) => {
  // a STEPLADDER (an A-frame) beside the lamp, its top just under the lamp's head: carried in on his shoulder, swung down + stood up,
  // spread; up, the work, down; folded, back up onto the shoulder, away
  const l = P.lamps[w.lamp % Math.max(1, P.lamps.length)] || { x: 0, z: 45, h: 4 }, y = Math.max(0.6, l.h - 2.3), S = STEPS;
  // (on the lamp's right — unless the hydrant by its post is there: then its left, the lampman on its far side facing in)
  const sd = Math.abs(P.hydrant.x - (l.x + 0.62)) < 1.4 && Math.abs(P.hydrant.z - (l.z - 0.32)) < 1.4 ? -1 : 1, dir = -sd, hdF = sd > 0 ? PI : 0;
  const foot = { x: l.x + 0.62 * sd, z: l.z - 0.32 }, top = { x: foot.x, y: y + 0.15, z: foot.z }, Ht = top.y + 0.15, Ls = Math.hypot(S.d, Ht);
  const G = { x: foot.x, z: foot.z, Ls, dir, phm: Math.asin(Math.min(0.95, 1.55 / Ls)) }, ph = [], stand = { x: foot.x + 0.62 * sd, z: foot.z - 0.05 };
  // (the last stretch straight along the kerb toward the spot — the stepladder's feet leading, never swung round at the spot; on the left
  // side: round behind the can + the post first)
  const c = crewOf(M, P, r, 'walk', w.t0).edge('right', foot.z).hold('steps');
  if (sd > 0) c.go({ x: foot.x + 2.4, z: stand.z }).line([stand]);
  else c.go({ x: P.hydrant.x + 0.9, z: P.hydrant.z + 1.1 }).line([{ x: stand.x - 1.6, z: P.hydrant.z + 0.9 }, { x: stand.x - 1.6, z: stand.z }, stand]);
  const C = { x: stand.x, y: S.ys + S.ws / 2, z: stand.z - 0.2 };
  ph.push({ k: 'carry', t0: w.t0, t1: c.now });
  let t1 = c.now; c.pose('upend', S.upend, { hd: hdF }); ph.push({ k: 'upend', t0: t1, t1: c.now, C });
  t1 = c.now; c.pose('spread', S.spread, { hd: hdF }).hold(null); ph.push({ k: 'spread', t0: t1, t1: c.now });
  const set = c.now; c.line([onLadder(foot, top, 0)], 0.7);
  c.climb(onLadder(foot, top, y), y, 2.2, hdF);
  const f0 = c.now, work = 38; c.pose('reach', work, { hd: sd > 0 ? PI : 0 });
  const f1 = c.now; c.climb(onLadder(foot, top, 0), 0, 2.0, -PI / 2).line([stand], 0.7);
  const t2 = c.now; ph.push({ k: 'stand', t0: set, t1: t2 });
  c.pose('fold', S.spread, { hd: hdF }); ph.push({ k: 'spread', t0: t2, t1: c.now, down: true });
  t1 = c.now; c.pose('lay', S.upend, { hd: hdF, carry: 'steps' }).hold('steps'); ph.push({ k: 'upend', t0: t1, t1: c.now, C, down: true });
  t1 = c.now; c.exit('right', foot.z); ph.push({ k: 'carry', t0: t1, t1: c.now + 1 });
  const vis = c.out(w.id, 'lampman', 'repairman');
  return { visits: [vis], props: [{ kind: 'xsteps', t0: w.t0, t1: c.now + 1, at: stepsAt(vis, ph, G), ws: S.ws, z: foot.z }, { kind: 'steps', mark: true, t0: set, t1: t2, foot, top }], marks: { lampFix: { t: f0 + work * 0.72, t0: f0, t1: f1 } } };
};
PLAN.painters = (w, M, P, r) => {
  // MONDAY 1–4 pm: the two painters carry the tall ladder in TOGETHER, raise it against the blade's edge (tallLadder); the climber up it
  // through the stages (the old name painted out bottom → top, the new letters chalked, filled + gilded top → bottom), climbing down
  // between stages; the holder at the foot steadying it; the drop cloth on the cobbles under the blade
  const Ld = P.ladder, vs = [], F = Ld.foot;
  const LT = tallLadder(M, P, r, w.t0, true), { a, b } = LT;
  // the painter's height through the stages: v (the row he works at) per stage — out: bottom → top; chalk / letters / gilt: top → bottom
  let u0 = 0, yNow = 0;
  const topY = Ld.v1 - 2.6, lowY = Math.max(0.4, Ld.v0 - 1.4);
  const ks = (w.t1 - w.t0) / PAINT_TOTAL;                    // (a preview's shorter slot: the same stages, compressed)
  for (const [stage, len0] of PAINT_STAGES) {
    const len = len0 * ks, s0 = w.t0 + u0, s1 = s0 + len; u0 += len;
    if (stage === 'setup' || stage === 'pack') continue;
    const n = stage === 'out' ? 4 : stage === 'chalk' ? 3 : stage === 'letters' ? 6 : 3, rising = stage === 'out';
    a.until(s0, yNow > 0.2 ? 'paint' : 'wait', { hd: PI }).hold(stage === 'chalk' ? 'chalk' : 'brush');
    for (let k = 0; k < n; k++) {
      const f = (k + 0.5) / n, yy = rising ? lowY + (topY - lowY) * f : topY - (topY - lowY) * f, seg = len / n;
      const dy = Math.abs(yy - yNow), cl = Math.min(seg * 0.3, 1.4 + dy * 0.9);
      a.climb(onLadder(F, Ld.top, yy), yy, cl, yy > yNow ? PI : -PI / 2); yNow = yy;
      a.pose(stage === 'chalk' ? 'reach' : 'paint', seg - cl, { hd: PI, carry: stage === 'chalk' ? 'chalk' : 'brush' });
    }
    // (a breather at the foot between the stages — down + up again)
    if (stage !== 'gilt') { a.climb(onLadder(F, Ld.top, 0), 0, 1.4 + yNow * 0.6, -PI / 2); yNow = 0; a.pose('wait', 20, { face: 0 }); }
  }
  a.climb(onLadder(F, Ld.top, 0), 0, 1.4 + yNow * 0.6, -PI / 2).hold(null).until(w.t1 - 150, 'wait', { face: 0 });
  // (the takedown — the cloth rolled up first, the kit set down by the foot; the ladder lowered, the kit hung back on it, away in step)
  const props = LT.down(a, b);
  vs.push(a.out(`${w.id}.a`, 'painter', 'painter'), b.out(`${w.id}.b`, 'painter', 'painter'));
  return { visits: vs, props, marks: { paint: { t0: w.t0, t1: w.t1 } } };
};
// ---- THE REGULARS
PLAN.newsboy = (w, M, P, r, L, ctx = {}) => {
  // 7:00 (fixed): the newsboy with his folding stand under his arm, the bundles untied, papers held up for the passers; buyers now + then
  // (8b2: the stand SET DOWN folded at its spot from under his arm, opened out (workers.js#newsstand: unfolding from `open`), the papers
  // onto it; at the end folded (from `fold`), PICKED UP, under his arm, away — never popped; the morning's bundles at its foot)
  const S0 = P.stand, at = { x: S0.x - 0.6, z: S0.z + 0.06 };
  const c = crewOf(M, P, r, 'kid', w.t0 - 9).edge('left', P.newsboy.z).hold('stand').go({ x: at.x - 1.3, z: at.z }).line([at]);
  const s0 = c.now; c.pose('set', 1.6, { hd: 0, carry: 'stand' }).hold(null);
  const open = c.now; c.pose('garden', 6, { hd: 0 }).hold('papers').line([P.newsboy]);
  const vs = [], buys = [];
  let t = c.now;
  const rb = rngFrom(hashString(`buyers|${w.id}`));
  while (t < w.t1 - 30) { const dur = 20 + rb() * 40; c.pose(rb() < 0.55 ? 'wave' : 'wait', dur, { hd: -PI / 2 + 0.5 }); t = c.now; if (rb() < 0.4) buys.push(t + 2); }
  c.line([at]).hold(null);
  const fold = c.now; c.pose('garden', 3.4, { hd: 0 });
  const k1 = c.now; c.pose('pick', 1.6, { hd: 0, carry: 'stand' }).hold('stand').exit('left', P.newsboy.z);
  vs.push(c.out(w.id, 'newsboy', 'newsboy'));
  // the buyers: from an edge to the stand, a paper, away (a visit each, planned round the floor)
  for (const [i, bt] of buys.entries()) {
    const side = rb() < 0.5 ? 'left' : 'right', b = crewOf(M, P, rb, 'walk', bt - 14).edge(side, 42 + rb() * 6).go({ x: P.newsboy.x + 1.05, z: P.newsboy.z - 0.5 });
    if (b.now > bt + 10) continue;
    b.until(bt, 'wait', { hd: PI }).pose('cart', 5, { hd: PI }).hold('papers').exit(rb() < 0.5 ? 'left' : 'right', 40 + rb() * 8);
    vs.push(b.out(`${w.id}.b${i}`, 'buyer', rb() < 0.5 ? 'commuter' : 'walker'));
  }
  return { visits: vs, props: [{ kind: 'stand', x: S0.x, z: S0.z, t0: s0 + 0.8, t1: k1 + 0.8, open: open + 0.4, fold, unfold: 4, bundles: w.kind === 'newsboy' && !ctx.force ? { x: P.bundles.x, z: P.bundles.z, untie: open + 4.5 } : null }], marks: { untie: open + 4.5 } };
};
PLAN.evening = PLAN.newsboy;
PLAN.barber = (w, M, P, r, L, ctx) => {
  // 8:30 (fixed): in from the left, the milk taken in off the step, into the shop; out to crank the awning, in for his broom, out with it:
  // the step swept, back in
  const c = crewOf(M, P, r, 'walk', w.t0 - 6).edge('left', 43.2).go(P.stepStand).go(P.step);
  const take = c.now + 0.9; c.pose('pick', 1.8, { hd: PI / 2, carry: 'bottles' }).hold('bottles');
  // (8b2: the awning cranked first; then back in for his broom + out WITH it, the step swept, in with it — never in his hand outside a door)
  c.door('shop', 'in').hold(null).inside(5.5 * 60).door('shop', 'out').go(P.awning).pose('crank', 7.5, { hd: PI / 2 }).door('shop', 'in').inside(18).hold('broom').door('shop', 'out').go(P.stepStand).pose('sweep', 48, { face: -1 }).door('shop', 'in');
  return { visits: [c.out(w.id, 'barber', 'barber')], marks: { milkTake: take } };
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
 * props, marks }. world: { L, M, ctx: { off, seed, party, force (a kind), dusk(key) } }
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
/** POLISH 5 — the hydrant at t: spray 0..1 (the stem turned up over ~1.2 s, down over ~1 s), wet 0..1 (the patch: it spreads over the
 *  first ~40 s of the spray, dries over HYD.dry after), u (s since it opened) — or null */
export function hydrantTrace(mk, t) {
  if (!mk || !mk.spray) return null;
  const [a, b] = mk.spray;
  if (t < a - 1 || t > b + HYD.dry) return null;
  const spray = t < a ? 0 : t < a + 1.2 ? (t - a) / 1.2 : t < b ? 1 : t < b + 1 ? 1 - (t - b) : 0;
  const grow = Math.min(1, Math.max(0, (Math.min(t, b) - a) / 40)), dry = t > b ? Math.max(0, 1 - (t - b) / HYD.dry) : 1;
  return { spray, wet: grow * dry, u: t - a };
}
/** the TRACES at t (PURE given the cache): the milk on the step, the bundles waiting, the board's game swap, the blade's repaint, the
 *  bulb / lamp fixes, the hydrant's spray + its wet patch, the doorman's watch, the wet streak → { milk, bundles, board, blade, bulbFixed, lampFixed, hydrant, … } */
export function tracesAt(t, world, cache = new Map()) {
  const ctx = world.ctx || {}, d = dayOf(t, ctx.off || 0);
  const today = crewDay(d.key, d.day0, world, cache), yday = crewDay(prevKey(d.key), d.day0 - 86400, world, cache);
  // (a &force=work-<kind> preview: the marks of its latest slot)
  const m = ctx.force ? resultsOf(worksIn(t - 1500, t + 1, ctx, cache).filter(w => w.t0 <= t).sort((p, q) => p.t0 - q.t0), world, cache).marks : today.marks, my = ctx.force ? {} : yday.marks;
  // (a preview — &force=work-milk / -newsdrop — keeps its trace until its slot ends; a real day: until the barber / the newsboy, or midday)
  const until = (mk, noon) => (ctx.force ? mk.t1 + 60 : d.day0 + noon * 3600);
  const milk = m.milk && t >= m.milk.milkDrop && !(m.barber && m.barber.milkTake != null && t >= m.barber.milkTake) && t < until(m.milk, 13);
  const bundles = m.newsdrop && t >= m.newsdrop.bundles && !(m.newsboy && t >= m.newsboy.untie) && t < until(m.newsdrop, 12);
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
    milk: !!milk, bundles: !!bundles, board, blade, bladeDone: pt ? pt.t1 : null, monday: d.dow === 1, bulbFix: m.bulb && m.bulb.bulbFix ? m.bulb.bulbFix.t : null, lampFix: m.lamp && m.lamp.lampFix ? { t: m.lamp.lampFix.t, t0: m.lamp.lampFix.t0, t1: m.lamp.lampFix.t1 } : null, hydrant: hydrantTrace(m.hydrant, t), doorman: m.doorman ? m.doorman.doorman : (my.doorman ? my.doorman.doorman : null), whistle: [m.cop && m.cop.whistle, m.patrol && m.patrol.whistle].filter(Boolean), day: d };
}
