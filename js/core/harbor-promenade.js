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
//   THE IMPLIED ROAD     z < 36: its granite curb just under the dock's top edge, THE STREET below (FP2: full-bleed — setts, a
//                        streetcar track, a manhole, a drain); while the dock shows, passing cars are LIGHT only (headlight
//                        sweeps at night, a soft shadow by day); while it rests (hidden) the car itself rolls across (streetPlan)
// NOTHING ALIVE UNDER THE DOCK while it shows. Positions are by SCREEN FRACTION on an upright phone (every phone the same picture); a wide screen
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
  cart: { w: 3.3, h: 1.5 },               // the chestnut roaster cart (FP3b: no umbrella — ≈ 3.4 tall to its chimney's cap)
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
  // FP — THE RE-LAYOUT (the owner approved the sketch, Oct 23): FURNITURE ON THE EDGES, AN OPEN FLOOR IN THE MIDDLE, THE FRONT EDGE
  // CLEAR. THE BACK ROW along the curb, a steady street rhythm: maple (beside the blade) · tall lamp · [the crosswalk's landing, open]
  // · maple with the BENCH under it · a planter · tall lamp. THE OPEN FLOOR: clear cobbles from the shopfront to the right edge, the
  // MEDALLION at its centre (roughly under the wheel), the CART on its open right side. ONE big framing maple at the far right edge.
  // THE FRONT EDGE: only two short warm globes, one at each corner (the speakeasy's corner + the right edge). ONE crafted planter
  // tucked against the speakeasy's corner, beside the side wall (never in front of the door or the shop window).
  // (at phone size the strip is ~70 pt deep, so depth stacks on screen: no curb tree may stand in front of the two stop lights or
  // the crossing (f ~0.58–0.76), and the framing maple's crown covers the right quarter — so the back row's trees + bench sit LEFT
  // of the crossing, beside the blade + under the wheel's deck, its second tall lamp right of it; the sketch's curb planter would
  // stand hidden behind the framing maple — the ONE crafted planter is the speakeasy's corner one)
  // FP2 — THE OWNER'S TWEAKS (Oct 24): the red curb maple beside / behind the DOUBLE AGENT blade is GONE (the corner clean, the wheel's
  // left leg shows again); the corner URN is gone (the promenade has no planter now — the speakeasy has its window boxes + ivy;
  // props.js#drawPlanter stays for later); THE MEDALLION moves to the middle of the open floor, in front of the crossing (~265 pt at
  // 402); THE CART rests LEFT of it (~200 pt); THE BENCH + its tree shift LEFT (~160 pt: the cart's umbrella never hides the bench —
  // tested) and that tree is a FLOWERING CRABAPPLE (pink-white blossom in spring — spring reads again; golden autumn + red fruit).
  // So the back row is: crabapple with the bench · tall lamp · [the crossing's landing] · tall lamp. The framing maple keeps its
  // own colour (v: the BLAZING ORANGE mix — core/harbor-trees.js#MAPLE_AUTUMN 1, "the big one on the front walk").
  // PF — THE FINAL LAYOUT (the owner, Oct 24): THE CART is HIDDEN (CART_SHOWN — it returns in 8b with the moving things); THE BENCH +
  // ITS CRABAPPLE move to where the cart's umbrella stood — just LEFT of the crossing, a little FORWARD, the tree bigger (the DOUBLE
  // AGENT blade free, the tree shows); THE TALL LAMPS a matched PAIR FLANKING THE CROSSING (symmetric about its centre, 0.6675 — just
  // outside the two stop lights: the crossing framed + lit, the bench in the left one's light); the two short globes stay at the
  // front corners; nothing in front of the shopfront or the blade. THE CENTREPIECE is a brick PAVING INLAY now (props.js) on the
  // crossing's axis, a little further back (z 43.4 → 44.8) — inside both flanking lamps' pools. THE MAILBOX by the front curb, right.
  tall: [{ f: 0.559, z: 52.6 }, { f: 0.776, z: 52.6 }],
  maples: [{ f: 0.888, z: 38.2, big: true, v: 1 }],
  crabs: [{ f: 0.45, z: 50.9, k: 1.45 }],    // (PF: 0.405 / z 52.9 / k 1.25 → its crown 153–209 pt at 402: right of the blade, left of the lamp's arm)
  globes: [0.322, 0.962],                  // (the front edge's two corners: by the speakeasy's corner, by the right edge)
  medallion: { f: 0.6675, z: 44.8 },        // (PF: on the crossing's axis, between the flanking lamps — inside both their pools)
  bench: { f: 0.515, z: 47.8 },             // (PF: in front of the crabapple, a little right — its trunk + uplight show at the bench's left end; its right end by the left flanking lamp)
  // (FP3b — THE VENDOR SPOT, the owner, Oct 24: the cart moves to the FRONT CURB in the MIDDLE, just in front of the compass inlay —
  // RIGHT of it on screen: centred in front of it, its body would cover the compass's front half at every phone size (the strip is
  // ~70 pt deep); at f 0.805 its left end clears the inlay by ~3 pt and its right end stays ~10 pt short of the framing maple's trunk;
  // fully above the dock at 390 / 402 / 430 (its wheels ~15 pt over it), ~0.9 of its old size (it stands nearer). Shared by time —
  // core/harbor-routines.js#VENDOR: the chestnut cart 6:30–9:30 pm in the cold months, the newsboy's stand (8b) in the mornings)
  cart: { f: 0.805, z: 38.4, scale: 0.9 },
  planters: [],
  // (PF placed a 1920s pillar box here — `mailbox: { f: 0.81, z: 38.6 }`; the owner didn't like the olive-green box: gone, Oct 24. props.js keeps the art.)
  mailbox: null,
});
/** the vendor cart is SHOWN (8P brought it back, placed right of the inlay — PF had hidden it); false hides it (L.cart.shown) */
export const CART_SHOWN = true;

/**
 * THE CENTREPIECE'S RULES (FP2 — for 8b + the seasonal pieces):
 * - EVENT_CLEAR (world units, from the medallion's centre): on a normal day the cart may roll ACROSS the medallion (8b: L.cart.route)
 *   and people walk over it; while an EVENT stands on the medallion (a seasonal centrepiece, a show, a crowd) the cart stops short —
 *   its centre never nearer than this (L.cart.stopX: the furthest right it may stand) — and the walkers go round the ring.
 * - CENTRE_PAD (pt): a centrepiece's top stays this far under the skyline's vertical neon blade's bottom (the game blade on the HOTEL
 *   — CIPHER / PRISM …) and under the wheel's hub — centrepieceCap() turns that into a height in world units at the medallion.
 */
export const EVENT_CLEAR = 4;   // (the ring 2.6 + the cart's half-body 1.22 + a little)
export const CENTRE_PAD = 8;
/**
 * The tallest a seasonal CENTREPIECE on the medallion may stand (world units, from the paving): its top `pad` pt under every screen
 * y in `limits` (the blade's bottom — core/harbor-neon.js#signSpots 'n-blade' — and the wheel's hub, project(wheel.x, wheel.y,
 * wheel.z)). PURE: cam + the medallion + the limits. At 390 / 402 / 430: ≈ 11.5 units (≈ 160 pt at 402 — a Christmas tree fits).
 */
export function centrepieceCap(cam, m, limits, pad = CENTRE_PAD) {
  const gy = cam.VPY + cam.F * cam.CAMH / m.z, top = Math.max(...limits) + pad;   // (under the LOWEST of them)
  return Math.max(0, Math.floor((gy - top) * m.z / cam.F * 10) / 10);
}

/** the WALK / WAIT lantern (world units): at the crosswalk's far end (`at`: its place across the crosswalk's width, 0 = the left
 *  edge — the open gap between the curb row's tall lamp and maple, the west stop light clear), z by the railing, h the post to the
 *  box's foot, w × bh the box (≈ 22 × 25 pt at 402; its letters ≈ 6.7 pt tall) */
export const LANTERN = Object.freeze({ at: 0.5, z: 63.4, h: 2.6, w: 2.3, bh: 2.4 });

// ------------------------------------------------------------------ THE CROSSING'S CYCLE (FP — PURE, on the shared clock)
// One cycle for the whole road (both stop lights show the same — it's one road, both directions) and the WALK / WAIT lantern, in
// step: the road GREEN (the lantern WAIT, steady) → AMBER → a moment ALL RED → WALK (steady) → WAIT BLINKING (the clearance: "don't
// start now" — it blinks before the road turns green again) → a moment all red (WAIT steady) → green. On the city's clock (ms since
// the epoch): every phone sees the same light at the same moment; 8b's traffic + people use it (stop on red, cross on WALK).
/** the phases' lengths (s) */
export const SIGNAL_CYCLE = Object.freeze({ go: 24, amber: 3, clear: 1.5, walk: 11, blink: 5, hold: 1.5 });
export const SIGNAL_PERIOD = Object.values(SIGNAL_CYCLE).reduce((a, b) => a + b, 0);
/** the blink: on for BLINK_ON of each BLINK_S */
export const BLINK_S = 1, BLINK_ON = 0.55;
/**
 * The crossing at ms → { road: 'green' | 'amber' | 'red', walk: 'walk' | 'wait', blink (WAIT blinking: the last BLINK s before the
 * road turns green), lit (the lantern's lit pane is showing right now — false only in a blink's off half), phase, left (s to the next
 * change), s (s into the cycle) }
 */
export function signalAt(ms) {
  const C = SIGNAL_CYCLE, P = SIGNAL_PERIOD, s = (((ms / 1000) % P) + P) % P;
  const ends = [['go', 'green', 'wait'], ['amber', 'amber', 'wait'], ['clear', 'red', 'wait'], ['walk', 'red', 'walk'], ['blink', 'red', 'wait'], ['hold', 'red', 'wait']];
  let t0 = 0;
  for (const [phase, road, walk] of ends) {
    const t1 = t0 + C[phase];
    if (s < t1) {
      const blink = phase === 'blink', u = s - t0;
      return { road, walk, blink, lit: !blink || (u % BLINK_S) < BLINK_ON * BLINK_S, phase, left: t1 - s, s };
    }
    t0 = t1;
  }
  return { road: 'green', walk: 'wait', blink: false, lit: true, phase: 'go', left: C.go, s: 0 };
}

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
  const crab = (x, z = PROM.front, k = 1) => trees.push({ x, z, kind: 'crab', trunk: P.crab.trunk * (0.6 + 0.4 * k), w: P.crab.w * k, h: P.crab.h * k, r: P.crab.w * k / 2, grate: true });
  const globe = (x, z = PROM.globes) => lamps.push({ x, z, h: P.globe.h, kind: 'globe', dir: 1 });
  const S = PHONE;
  const signals = S.signals.map(s => ({ id: s.id, x: X(s.f, 54.6), z: 54.6, dir: s.dir, arm: s.arm, h: stopH, state: 'green' }));
  S.tall.forEach((t, i) => tall(X(t.f, t.z), i));
  // (FP2: the framing maple's crown a little rounder — h 1.1 → 1.14 × — its trunk sturdier: core/harbor-trees.js#treePlan's big; v: its colour mix)
  S.maples.forEach(m => { maple(X(m.f, m.z), m.z); const t = trees[trees.length - 1]; if (m.v != null) t.v = m.v; if (m.big) Object.assign(t, { big: true, w: P.maple.w * 1.12, r: P.maple.w * 0.56, h: P.maple.h * 1.14, trunk: P.maple.trunk * 1.02 }); });
  S.globes.forEach(f => globe(X(f, PROM.globes)));
  S.crabs.forEach(c => crab(X(c.f, c.z), c.z, c.k || 1));
  for (const p of S.planters) planters.push({ x: X(p.f, p.z), z: p.z, w: P.planter.w * (p.corner ? 1.08 : 0.92), corner: !!p.corner });
  const bench = { x: X(S.bench.f, S.bench.z), z: S.bench.z, w: P.bench.w };
  // (live: drawn by the people's near pass on its schedule, never baked; hand 1: its handles on the right end — FP3b: a low roaster
  // cart, no umbrella: props.js#drawCart)
  const cart = { x: X(S.cart.f, S.cart.z), z: S.cart.z, kind: 'chestnuts', shown: CART_SHOWN, live: true, scale: S.cart.scale || 1, hand: 1 };
  const medallion = { x: X(S.medallion.f, S.medallion.z), z: S.medallion.z, r: P.medallion.r, ring: P.medallion.ring, clear: EVENT_CLEAR };
  // (FP2 — THE CART'S RULE for 8b: it rests LEFT of the medallion; on a normal day its route rolls across the floor — over the
  // medallion — to the open right side and back; during an event on the medallion it stops short: never right of stopX)
  cart.route = { x0: cart.x, x1: X(0.8, cart.z), z: cart.z };
  cart.stopX = medallion.x - EVENT_CLEAR;
  const crosswalk = { x0: X(S.crosswalk[0], 59), x1: X(S.crosswalk[1], 59), z0: 54, z1: 64 };
  // (FP: THE WALK / WAIT LANTERN — on the FAR side of the crossing, at the railing where the crosswalk lands, facing us: the people
  // waiting on the promenade's kerb read it across the road, the way a pedestrian signal stands)
  crosswalk.lantern = { x: crosswalk.x0 + (crosswalk.x1 - crosswalk.x0) * LANTERN.at, z: LANTERN.z, h: LANTERN.h, w: LANTERN.w, bh: LANTERN.bh };
  // a wide screen (a panorama): the curb band goes on to the right edge — lamp / maple pairs, a bench now and then; the front row
  // (globes + a crabapple) either side of the dock, never under it
  if (wide) {
    const r = rngFrom(seed + 99), end = cam.hw(PROM.curb) * 0.97;
    for (let x = X(S.tall[1].f, PROM.curb) + 8, i = 0; x < end; x += 8 + r() * 2, i++) {
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
  // granite curb at z PROM.edge (just under the dock's top on a phone), THE STREET nearer (FP2: setts, a streetcar track, a manhole,
  // a drain — full-bleed to the screen's foot; its car seen only while the dock rests: streetPlan below)
  const edge = { z: PROM.edge, curbW: 0.45 };
  const impliedRoad = { z0: PROM.road[0], z1: PROM.road[1], lane: 30, street: streetPlan(cam, PROM.edge) };
  // THE WALKABLE ZONES (8b's people + dogs): world rects + the pieces they walk round (never through the cart, into the water, under
  // the dock — the dock is a screen rect: zones stop at its top)
  const zones = {
    // (FP: THE OPEN FLOOR — the shopfront to the cart's right, the speakeasy's face to the back row)
    plaza: { x0: X(0.02, 44), x1: X(0.8, 44), z0: 38.4, z1: 50 },
    walk: { x0: X(0.0, 46), x1: X(1.0, 46), z0: 40, z1: 51.6 },
    front: { x0: X(0.0, 38), x1: X(1.0, 38), z0: 36.9, z1: 40 },
    curb: { x0: X(0.36, 53), x1: X(1.0, 53), z0: 51.6, z1: 53.6 },
    block: [...trees.map(t => ({ x: t.x, z: t.z, r: 0.8 })), ...lamps.map(l => ({ x: l.x, z: l.z, r: 0.35 })), ...(cart.shown ? [{ x: cart.x, z: cart.z, r: 1.6 }] : []), { x: bench.x, z: bench.z, r: 1.4 }, ...planters.map(p => ({ x: p.x, z: p.z, r: 1.1 }))],
  };
  const mailbox = S.mailbox ? { x: X(S.mailbox.f, S.mailbox.z), z: S.mailbox.z } : null;   // (PF: props.js#drawMailbox)
  if (mailbox) zones.block.push({ x: mailbox.x, z: mailbox.z + 0.3, r: 0.6 });
  return { lamps, trees, bench, planters, cart, medallion, signals, crosswalk, edge, impliedRoad, zones, mailbox };
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
/** a slot of the near road: at most one car a slot; its window from t0; the car is nearest at its CENTRE, t0 + peak — the same on
 *  every phone, whatever its take (FP3: the sound's take is placed so its own loudest moment lands there — core/city-sounds.js#syncStart) */
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

// ------------------------------------------------------------------ FP2 — THE STREET UNDER THE DOCK (full-bleed; PURE)
// The band under the dock is a FINISHED STREET (the implied road made real — the owner, Oct 23): the near granite curb (its top at
// the dock's top edge), a granite gutter, the street's own setts, ONE streetcar track (two steel rails, inset), a manhole, a storm
// drain at the curb, a wet hook (Part 9). While the dock rests (hidden), the implied road's passes are SEEN: a 1920s motorcar rolls
// across (screens/harbor/motorcar.js), the same pass + sound as before (roadPassAt). Two lanes, by direction (the traffic keeps
// right: westbound ← along the far side by the curb, eastbound → nearer us); the far lane's roof stays under the dock's top (the
// dock covers the car whole while it fades back in), the near lane's wheels above the screen's foot (else both use the far lane).
/** the street's sizes (world units — 1 ≈ 0.85 m): the gutter's width, a street sett (x × z), the track's gauge, the car (a 1928
 *  sedan: 4.2 m long, 1.75 m tall, 1.8 m wide, 0.78 m wheels), the lanes' preferred depth, the manhole + the drain */
export const STREET = Object.freeze({
  gutter: 1.4, sett: [0.82, 0.6], gauge: 1.7, rail: 0.07,     // (the gutter: ~0.8 of it hidden under the curb's 27 cm face)
  car: { len: 4.95, h: 2.06, w: 2.1, r: 0.46, base: 3.09 },
  far: 30.4, near: 25.6,
  manhole: { f: 0.7, r: 0.72 }, drain: { f: 0.17, w: 1.3 },
});
/** the z of the screen's foot on this camera (the street paints down to it) */
export const footZ = cam => (cam.H - cam.VPY > 1 ? (cam.F * cam.CAMH) / (cam.H - cam.VPY) : 12);
/**
 * The street for a camera: { z0 (the curb's road edge), gutter: [z0, z1], foot (the screen's foot), lanes: [{ dir: -1, z }, { dir: 1, z }]
 * (z = the car's near side, its wheels' line), rails: [z, z], manhole: { x, z, r }, drain: { x, z0, z1, w } (a grate in the gutter's
 * visible strip + the inlet in the curb's face) }.
 */
export function streetPlan(cam, edgeZ = PROM.edge) {
  const S = STREET, C = S.car, foot = Math.min(edgeZ - 2, footZ(cam));
  // (the car's roof at the dock's top + 2 pt on a phone; a wide screen's dock is a short bar in the middle: the street shows either side)
  const zRoof = cam.wide ? Infinity : (cam.F * (cam.CAMH - C.h)) / Math.max(1, cam.dock.y + 2 - cam.VPY);
  const zWheel = (cam.F * cam.CAMH) / Math.max(1, cam.H - 8 - cam.VPY);                     // the near wheels 8 pt over the foot
  const g1 = edgeZ - S.gutter;
  const far = Math.max(Math.min(S.far, zRoof, g1 - C.w - 0.4), foot + 0.5);
  const near = Math.max(S.near, zWheel), two = near + C.w + 0.9 < far;
  const tc = two ? (near + C.w + far) / 2 : Math.max(foot + S.gauge, far - S.gauge - 0.6);
  const rails = [tc - S.gauge / 2, tc + S.gauge / 2];
  const mz = (g1 + far + C.w) / 2;
  return {
    z0: edgeZ, gutter: [g1, edgeZ], foot, rails,
    lanes: [{ dir: -1, z: far }, { dir: 1, z: two ? near : far }], two,
    manhole: { x: xOfF(cam, S.manhole.f, mz), z: mz, r: S.manhole.r },
    drain: { x: xOfF(cam, S.drain.f, edgeZ), z0: g1 + 0.06, z1: g1 + 0.62, w: S.drain.w },
  };
}
/**
 * Where the pass's car is at ms (PURE): { x (world, its middle), z (its lane), dir, env (0..1 — 1 when nearest), speed (u / s),
 * on (any of it inside the screen) }. center: the ms the car is nearest (x 0) — the pass's t0 + ROAD_PASS.peak, where its sound's
 * take peaks (FP3). cross: s to cross the visible street (its take's swell — carSpeed); none → ~6 u / s (a 1920s cruise).
 */
export function carAt(pass, center, ms, cam, street, cross = null) {
  const lane = pass.dir < 0 ? street.lanes[0] : street.lanes[1], z = lane.z;
  const span = cam.hw(z) + 14, speed = carSpeed(cam, z, cross), x = pass.dir * ((ms - center) / 1000) * speed;
  return { x, z, dir: pass.dir, speed, env: Math.max(0, 1 - Math.abs(x) / span) ** 0.6, on: Math.abs(x) < cam.hw(z) + STREET.car.len / 2 + 0.5 };
}
/** FP3 — the car's speed along the road at depth z (u / s): it crosses the visible street (entering → leaving: 2 hw + its length
 *  + 1) in `cross` s — its sound's take's swell (core/city-sounds.js#crossFor: the car passes within the audible rise and fall);
 *  no take (an empty slot) → FP2's ~6 u / s */
export const carSpeed = (cam, z, cross = null) => (cross > 0 ? (2 * cam.hw(z) + STREET.car.len + 1) / cross : ((cam.hw(z) + 14) * 2) / 9);
/** the car's visibility (0..1) — it shows only while the dock rests: up over the dock's 1.8 s fade-out, gone in 0.25 s when the dock
 *  comes back (its own fade-in is 0.45 s: the car never shows through the dock) */
export const carVis = (v, gone, dtMs) => Math.max(0, Math.min(1, v + (gone ? dtMs / 1800 : -dtMs / 250)));
/** THE WET HOOK (Part 9 sets `wet` from the real rain + how long since; &force=wet-street → 1): 0..1 — the street's puddles + sheen */
export const streetWet = ({ force = false, wet = 0 } = {}) => (force ? 1 : Math.max(0, Math.min(1, +wet || 0)));
