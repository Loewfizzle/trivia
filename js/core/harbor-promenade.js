// CITY 2.0 — THE HARBOR, PART 8a: THE PROMENADE's plan (PURE — tested in tests/harbor.test.mjs; drawn by screens/harbor/stage.js).
// What the near stage IS — its bands, where every lamp, tree, bench, cart, planter and the medallion stand, the
// trees' season by the real date, the IMPLIED ROAD along the bottom edge (cars shown only as light) — not how it looks.
//
// The bands, back to front (world z; the camera's numbers in docs/harbor.md — on a 402 phone the promenade is the strip from the
// road's near kerb, y ≈ 682, down to the dock's top, y ≈ 758):
//   THE WATERSIDE ROAD   z 54–64 (core/harbor-layout.js: the bus, the cars, the two stop lights + the CROSSWALK between them)
//   THE CURB BAND        z ≈ 52.6: tall double-head Art Deco street lamps, sugar maples in iron grates between them
//   THE PLAZA / MIDDLE   z 41–48: open cobbles in front of the speakeasy's door (8 guests, the party line, crowds); the
//                        CENTREPIECE SPOT just right of the door (an Art Deco medallion in a ring of smooth stone); the bench,
//                        the vendor cart, the stone flower planters — in the clearly visible middle, never low by the dock
//   THE FRONT WALK       z ≈ 36.5–38: short warm globe lamps along its curb (their bases = the promenade's bottom edge), the
//                        flowering crabapples
// NO FLAGPOLE (the owner, 8a: flags only on holidays / special events — a later part dresses the lamp posts then)
//   THE IMPLIED ROAD     z < 36: its granite curb just under the dock's top edge, the asphalt below — never a visible car:
//                        passing cars are LIGHT only (headlight sweeps across the cobbles at night, a soft shadow by day)
// NOTHING UNDER THE DOCK. Positions are by SCREEN FRACTION on an upright phone (every phone the same picture); a wide screen
// (desktop, sideways) repeats the curb band to the right and keeps the front row either side of the dock.

import { rngFrom } from './rng.js';

/** the bands' depths (world z) */
export const PROM = Object.freeze({ curb: 52.6, mid: [41, 48], front: 37.8, globes: 36.6, edge: 35.6, road: [22, 35.6] });

/** the pieces' sizes (world units — a person is 2.1 since the owner's 8a scale, ~⅔ of the speakeasy's door; ~0.85 m a unit) */
export const PIECE = Object.freeze({
  tall: { h: 6.1, arm: 0.95 },            // the tall double-head Deco lamp: two lanterns on a crossarm (≈ 70 pt at the curb)
  globe: { h: 3.7 },                      // the short warm globe lamp (≈ 60 pt on the front walk)
  maple: { trunk: 2.9, w: 4.9, h: 4.6 },  // a sugar maple in an iron grate (≈ 56 pt across at the curb, ≈ 78 on the front walk)
  crab: { trunk: 1.7, w: 3.3, h: 2.8 },   // a flowering crabapple — a smaller ACCENT (the owner), never the biggest tree
  bench: { w: 3.3, h: 1.25 },
  cart: { w: 3.3, h: 1.5, umb: 2.1 },     // the vendor cart + its umbrella (≈ 4.7 tall)
  planter: { w: 2.6, h: 1.35, d: 1.6 },
  medallion: { r: 1.55, ring: 2.6 },
});

/**
 * The phone's promenade, by screen fraction f at its band's depth (0 = the left edge, 1 = the right). The stop lights stand on the
 * road's near kerb (z 54.6) either side of THE CROSSWALK, right of the wheel's base (never crowding it); the curb band: a tall lamp
 * under the wheel's pier (lower than its deck), a maple + a tall lamp right of the crosswalk. The middle band: the medallion, the
 * bench, the cart, a crabapple accent. The FRONT WALK (nearest, biggest — framing the scene): the globe lamps, the big planters, a
 * maple at the right. Never a tree over the speakeasy's door or shop window, never one cut by the screen's edge.
 */
export const PHONE = Object.freeze({
  signals: [{ id: 'west', f: 0.6, dir: 1, arm: 0 }, { id: 'east', f: 0.735, dir: -1, arm: 0 }],   // (pole-top heads, 1920s)
  crosswalk: [0.613, 0.722],
  tall: [0.93],
  maples: [{ f: 0.818, z: 52.75 }, { f: 0.893, z: 37.2 }],
  crabs: [{ f: 0.405, z: 49 }],
  globes: [0.355, 0.69],                   // (the far-left globe dropped — the owner: the shopfront reads clean)
  medallion: { f: 0.47, z: 42.6 },          // (the owner: the MIDDLE of the open plaza, right of the door — open space round it)
  bench: { f: 0.665, z: 47 },
  cart: { f: 0.778, z: 44.4 },
  planters: [{ f: 0.15, z: 38.8 }, { f: 0.618, z: 38.6 }],
});

/** x (world) for a screen fraction f at depth z on this camera */
export const xOfF = (cam, f, z) => (f - 0.5) * 2 * cam.hw(z);

/**
 * The promenade for a camera: { lamps, trees, bench, planters, cart, medallion, signals, crosswalk, edge, impliedRoad,
 * zones }. lamps: { x, z, h, kind: 'tall' | 'globe', dir }; trees: { x, z, kind: 'maple' | 'crab', trunk, w, h, r, grate };
 * zones (8b): the walkable rects in world x / z (the plaza, the front walk, the curb walk) + what blocks them.
 */
export function promenadeLayout(cam, { seed = 1924, wide = false, stopH = 4.9, front = 0, face = null } = {}) {
  // (a panorama keeps the phone's stage beside the speakeasy: the phone's fractions, offset from the speakeasy's right face — −5.6 on
  // every upright phone)
  const X = wide && face != null ? (f, z) => face + 5.6 + (f - 0.5) * (402 / 600) * z : (f, z) => xOfF(cam, f, z), P = PIECE;
  const lamps = [], trees = [], planters = [], more = [];
  const tall = (x, i) => lamps.push({ x, z: PROM.curb, h: P.tall.h, kind: 'tall', dir: i % 2 ? -1 : 1, arm: P.tall.arm });
  const maple = (x, z = PROM.curb + 0.15) => trees.push({ x, z, kind: 'maple', trunk: P.maple.trunk, w: P.maple.w, h: P.maple.h, r: P.maple.w / 2, grate: true });
  const crab = (x, z = PROM.front) => trees.push({ x, z, kind: 'crab', trunk: P.crab.trunk, w: P.crab.w, h: P.crab.h, r: P.crab.w / 2, grate: true });
  const globe = (x, z = PROM.globes) => lamps.push({ x, z, h: P.globe.h, kind: 'globe', dir: 1 });
  const S = PHONE;
  const signals = S.signals.map(s => ({ id: s.id, x: X(s.f, 54.6), z: 54.6, dir: s.dir, arm: s.arm, h: stopH, state: s.id === 'west' ? 'red' : 'green' }));
  S.tall.forEach((f, i) => tall(X(f, PROM.curb), i));
  S.maples.forEach(m => maple(X(m.f, m.z), m.z));
  S.globes.forEach(f => globe(X(f, PROM.globes)));
  S.crabs.forEach(c => crab(X(c.f, c.z), c.z));
  for (const p of S.planters) planters.push({ x: X(p.f, p.z), z: p.z, w: P.planter.w });
  const bench = { x: X(S.bench.f, S.bench.z), z: S.bench.z, w: P.bench.w };
  const cart = { x: X(S.cart.f, S.cart.z), z: S.cart.z, kind: 'chestnuts' };
  const medallion = { x: X(S.medallion.f, S.medallion.z), z: S.medallion.z, r: P.medallion.r, ring: P.medallion.ring };
  const crosswalk = { x0: X(S.crosswalk[0], 59), x1: X(S.crosswalk[1], 59), z0: 54, z1: 64 };
  // a wide screen (a panorama): the curb band goes on to the right edge — lamp / maple pairs, a bench now and then; the front row
  // (globes + a crabapple) either side of the dock, never under it
  if (wide) {
    const r = rngFrom(seed + 99), end = cam.hw(PROM.curb) * 0.97;
    for (let x = X(S.tall[1], PROM.curb) + 8, i = 0; x < end; x += 8 + r() * 2, i++) {
      if (i % 2 === 0) tall(x, i); else maple(x);
      if (i % 4 === 1) more.push({ x: x + 3.2, z: 46.6, w: P.bench.w });
    }
    if (front) {
      const zf = PROM.globes, pad = 24, dock = cam.dock;
      const free = sx => sx < dock.x - pad || sx > dock.x + dock.w + pad;
      const sxOf = x => cam.VPX + cam.F * x / zf;
      for (let x = X(0.04, zf), i = 0; x < cam.hw(zf) * 0.96; x += 6 + r() * 3, i++) {
        if (!free(sxOf(x))) continue;
        if (i % 3 === 2) crab(x, zf + 1.2); else globe(x);
      }
    }
  }
  if (more.length) bench.more = more;
  // THE FRONT EDGE + THE IMPLIED ROAD (the owner's idea, behind &force=implied-road; on by default for her review): the promenade's
  // granite curb at z PROM.edge (just under the dock's top on a phone), the road's asphalt nearer — no car is ever drawn on it
  const edge = { z: PROM.edge, curbW: 0.45 };
  const impliedRoad = { z0: PROM.road[0], z1: PROM.road[1], lane: 30 };
  // THE WALKABLE ZONES (8b's people + dogs): world rects + the pieces they walk round (never through the cart, into the water, under
  // the dock — the dock is a screen rect: zones stop at its top)
  const zones = {
    plaza: { x0: X(0.12, 44), x1: X(0.6, 44), z0: 40, z1: 44 },
    walk: { x0: X(0.0, 46), x1: X(1.0, 46), z0: 40, z1: 51.6 },
    front: { x0: X(0.0, 38), x1: X(1.0, 38), z0: 36.9, z1: 40 },
    curb: { x0: X(0.36, 53), x1: X(1.0, 53), z0: 51.6, z1: 53.6 },
    block: [...trees.map(t => ({ x: t.x, z: t.z, r: 0.8 })), ...lamps.map(l => ({ x: l.x, z: l.z, r: 0.35 })), { x: cart.x, z: cart.z, r: 1.6 }, { x: bench.x, z: bench.z, r: 1.4 }, ...planters.map(p => ({ x: p.x, z: p.z, r: 1.1 }))],
  };
  return { lamps, trees, bench, planters, cart, medallion, signals, crosswalk, edge, impliedRoad, zones };
}

// ------------------------------------------------------------------ THE SEASON (the trees, the planters)
export const SEASONS = Object.freeze(['spring', 'summer', 'autumn', 'winter']);
/**
 * The trees' season by the real local date (Michigan): SPRING Apr 10 → May 31 (the crabapples blossom ~ late Apr → mid May, fresh
 * light-green leaves), SUMMER Jun 1 → Sep 24 (full green), AUTUMN Sep 25 → Nov 19 (the maples blaze red-orange-gold, leaves
 * falling), WINTER Nov 20 → Apr 9 (bare branches; Part 9 lays the snow on them). The south (`south`): the months shift by six.
 * force: 'spring' | 'summer' | 'autumn' | 'winter' (&season=) wins.
 */
export function seasonOf(month, day = 15, { south = false, force = null } = {}) {
  if (force && SEASONS.includes(force)) return force;
  let m = month;
  if (south) m = ((month + 5) % 12) + 1;
  const md = m * 100 + day;
  if (md >= 410 && md < 601) return 'spring';
  if (md >= 601 && md < 925) return 'summer';
  if (md >= 925 && md < 1120) return 'autumn';
  return 'winter';
}
/** how far into its season (0..1) — the blossom's peak, the autumn colour's turn, the leaves thinning */
export function seasonPhase(month, day = 15, { south = false } = {}) {
  let m = month;
  if (south) m = ((month + 5) % 12) + 1;
  const doy = (m - 1) * 30.5 + day;
  const span = { spring: [99, 152], summer: [152, 268], autumn: [268, 324] };
  const s = seasonOf(month, day, { south });
  if (s === 'winter') { const d = doy >= 324 ? doy - 324 : doy + 365 - 324; return Math.min(1, d / 140); }
  const [a, b] = span[s];
  return Math.max(0, Math.min(1, (doy - a) / (b - a)));
}

// ------------------------------------------------------------------ THE IMPLIED ROAD'S CARS (on the clock: every phone the same)
/** a slot of the near road: at most one car a slot; its window: the sound starts at t0, the car is nearest at t0 + its take's peak */
export const ROAD_PASS = Object.freeze({ slot: 40e3, lead: 12e3, dur: 22e3, peak: 9e3 });
/** how busy the road is by the local hour (0..1 — a pass's chance a slot): the evening rush busiest, the small hours nearly empty */
export function roadBusy(hour) {
  if (hour == null) return 0.5;
  const h = ((hour % 24) + 24) % 24;
  if (h < 1) return 0.4; if (h < 5) return 0.14; if (h < 7) return 0.32; if (h < 10) return 0.62;
  if (h < 16) return 0.48; if (h < 20) return 0.68; return 0.5;
}
/**
 * The pass running at ms (or about to): { id, t0, dir (+1 → right, −1 → left), take (0..1 — which recording), lane } or null. A
 * pure function of the time (+ the local hour's busy-ness): the scene asks every frame; a pass that started before the page
 * loaded joins mid-way (its light), its sound only when caught at its start. force: a pass every ~13 s (the preview).
 */
export function roadPassAt(ms, hourAt = () => 12, { seed = 1924, force = false } = {}) {
  const S = ROAD_PASS;
  if (force) { const n = Math.floor(ms / 13e3), t0 = n * 13e3 - 6e3; return { id: `f${n}`, t0, dir: n % 2 ? -1 : 1, take: (n * 0.37) % 1, lane: 0 }; }
  for (const k of [0, -1]) {
    const n = Math.floor(ms / S.slot) + k, r = rngFrom(seed * 7919 + n * 104729);
    const t0 = n * S.slot + r() * (S.slot - S.lead), dir = r() < 0.5 ? -1 : 1, take = r(), lane = r() < 0.3 ? 1 : 0;
    if (r() > roadBusy(hourAt(t0))) continue;
    if (ms >= t0 && ms < t0 + S.dur) return { id: `p${n}`, t0, dir, take, lane };
  }
  return null;
}
