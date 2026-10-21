// CITY 2.0 — THE HARBOR: the camera, the sizes and the layout (PURE: no DOM; tests/harbor.test.mjs). docs/harbor.md.
//
// World units: x to the right, y up, z away from us; the camera stands at x = 0, CAMH up, looking level at the horizon.
// A point projects to the screen (CSS pt) as  sx = VPX + F·x/z,  sy = VPY + F·(CAMH − y)/z.
// The approved mockup (docs/harbor/ref, 402×874) uses VPY 540, CAMH 13.5, F 600. Here the camera is derived per screen
// from the real title: F follows the width (a 390–430 pt phone keeps the same composition), the front row of the promenade
// stands just above the dock, and the skyline is COMPRESSED so the tallest crown stops 10 pt under the tagline — the tall
// towers shrink more than the low ones (a linear squeeze above a soft knee: the peaks keep their drama, nothing goes flat-
// topped, the landmarks stay the tallest), which frees the sky for the sun's arch (the owner's call, Oct 20 2026).
// A wide screen (desktop, a phone sideways) gets its own camera: a panorama, never a stretched phone.
import { rngFrom } from './rng.js';

/** the mockup's reference phone and camera */
export const REF = { W: 402, H: 874, VPY: 540, CAMH: 13.5, F: 600 };
/** depths (world z) of the bands, far → near */
export const Z = { haze: [620, 820], far: [380, 560], mid: [300, 360], landmark: [255, 290], near: [232, 250], quay: 230, rail: 64, road: [54, 64], lane: 59, prom: [30, 54], front: 36.5, ref: 47 };
/** THE SIZE RULES: on-screen size in pt on the reference phone, at the depth where the thing usually stands */
export const SIZE = {
  person: { pt: 20, z: 47 },      // hats, scarves, coats readable by shape + colour
  car: { pt: 55, z: 58 },         // 50–60 pt long
  bus: { pt: 110, z: 60 },
  lamp: { pt: 50, z: 47 },        // 45–55 pt
  canopy: { pt: 40, z: 47 },      // a tree's crown, across
  stopLight: { pt: 55, z: 54.6 }, // heads 1.3× real size
};
/** pt on the reference phone → world units at the thing's depth */
export const units = (name, pt = SIZE[name].pt) => pt * SIZE[name].z / REF.F;
/** world units → pt on a given camera, at depth z */
export const ptAt = (cam, u, z) => u * cam.F / z;

const DOCK_H = 76;         // the dock bar (css/title.css .nd-bar), measured Oct 20 2026
const GAP_ABOVE_DOCK = 4;  // the front row's feet stand this far above the dock's top
const UNDER_TAG = 10;      // the tallest crown stops this far under the tagline
const KNEE_B = 24;         // the knee's softness, pt

/**
 * The camera for a screen. rects: { tag: {y, h}, dock: {x, y, w, h} } from the real title (fall back to estimates
 * before the title reports them); safe: { top, bottom } insets.
 */
export function cameraFor(W, H, rects = {}, safe = {}) {
  const wide = W > H;
  const sb = safe.bottom || 0;
  const dock = rects.dock || (wide ? { x: W / 2 - 210, y: H - (W >= 1000 ? 106 : 97), w: 420, h: 70 } : { x: 14, y: H - Math.max(sb + 6, 20) - DOCK_H, w: W - 28, h: DOCK_H });
  const tag = rects.tag || { y: wide ? H * 0.43 : H * 0.365, h: 14 };
  const tagB = tag.y + tag.h;
  const front = dock.y - GAP_ABOVE_DOCK;
  let F, CAMH;
  if (!wide) {
    F = REF.F * W / REF.W;
    CAMH = REF.CAMH;
  } else {
    // a panorama: the mockup's scale where the height allows (desktop), never smaller than people of ~9 pt (a phone held
    // sideways: the camera comes down so the skyline keeps half the strip between the tagline and the dock)
    const room = Math.max(60, front - tagB - UNDER_TAG);
    F = Math.max(REF.F * room / 411, 9 * SIZE.person.z / units('person'));
    CAMH = Math.min(REF.CAMH, (room > 250 ? 0.55 : 0.4) * room * Z.front / F);
  }
  const VPY = front - F * CAMH / Z.front;
  const cam = { W, H, wide, F, CAMH, VPX: W / 2, VPY, dock, tag, limitY: tagB + UNDER_TAG, front, safeTop: safe.top || 0, safeBottom: sb };
  // the visible half-width at a depth, in world units, and the panorama factor (1 on a phone)
  cam.hw = z => (W / 2) * z / F;
  cam.spread = cam.hw(100) / (0.335 * 100);
  return cam;
}

/** world → screen (pt) */
export const project = (cam, x, y, z) => [cam.VPX + cam.F * x / z, cam.VPY + cam.F * (cam.CAMH - y) / z];
/** the world x at a screen x, at depth z */
export const xAt = (cam, sx, z) => (sx - cam.VPX) * z / cam.F;
/** the screen y of the ground (y = 0) at depth z */
export const groundY = (cam, z) => cam.VPY + cam.F * cam.CAMH / z;

/**
 * The skyline squeeze. Given the highest uncompressed top on screen (yMax, pt), returns h → h' at depth z. Below the knee
 * nothing changes; above it the height above the knee is scaled by s (with a soft start), so the highest top lands on
 * cam.limitY. Monotonic: what was taller stays taller.
 */
export function squeeze(cam, yMax) {
  // (a short strip of sky — a phone sideways — puts the knee lower, so the squeeze has room to keep the peaks apart)
  const kf = Math.max(0.55, Math.min(0.85, 0.55 + (150 - (cam.VPY - cam.limitY)) / 250));
  const knee = cam.limitY + kf * (cam.VPY - cam.limitY);
  const room = knee - cam.limitY, dMax = knee - yMax;
  const E = 1 - Math.exp(-Math.max(0, dMax) / KNEE_B);
  let s = dMax <= room ? 1 : (room - KNEE_B * E) / (dMax - KNEE_B * E);
  s = Math.max(0.04, Math.min(1, s));
  const f = d => (d <= 0 ? d : s * d + (1 - s) * KNEE_B * (1 - Math.exp(-d / KNEE_B)));
  const sq = (h, z) => {
    const y0 = cam.VPY + cam.F * (cam.CAMH - h) / z;
    const d = knee - y0;
    if (d <= 0 || s >= 1) return h;
    const y1 = knee - f(d);
    return cam.CAMH - (y1 - cam.VPY) * z / cam.F;
  };
  sq.s = s; sq.knee = knee;
  return sq;
}

// the planned SUN GAPS: corridors (screen fraction, width pt) kept clear through every skyline band, along the low sun's path
// near both sides — at golden hour the rays stream between the buildings here (Part 2 builds the rays; sun.js already
// fits its arch to the roofline this layout reports)
export const SUN_GAPS = [{ f: 0.06, w: 7 }, { f: 0.13, w: 9 }, { f: 0.31, w: 6 }, { f: 0.7, w: 6 }, { f: 0.79, w: 9 }, { f: 0.9, w: 8 }, { f: 0.97, w: 6 }];

const MATS = ['lime', 'granite', 'brick', 'cream', 'slate', 'terra'];
const CROWNS = ['spire', 'pyramid', 'dome', 'mast'];

// one skyline band: blocks and towers side by side over [x0, x1], skipping the sun gaps
function band(cam, o) {
  const r = rngFrom(o.seed);
  const out = [];
  let x = o.x0;
  while (x < o.x1) {
    const w = o.w[0] + r() * (o.w[1] - o.w[0]);
    let h = o.h[0] + r() * (o.h[1] - o.h[0]);
    const z = o.z + r() * o.dz;
    const mat = MATS[Math.floor(r() * MATS.length)];
    const tower = r() < o.towerP;
    const crown = tower && r() < 0.5 ? { t: CROWNS[Math.floor(r() * 4)], h: 6 + r() * 8 } : null;
    if (tower) h *= 1.25;
    // the edges of the view a little taller, the middle a little lower (the landmarks stand there)
    const c = Math.min(1, Math.abs(x + w / 2) / Math.max(1, cam.hw(z)));
    h *= 0.85 + 0.3 * c * c;
    const b = { x0: x, x1: x + w, z0: z, z1: z + (tower ? 14 : 12), h, mat, kind: tower ? 'tower' : 'block', crown, band: o.id };
    if (!inGap(cam, b)) out.push(b);
    x += w + o.gap * r();
  }
  return out;
}
// does a block cover one of the sun gaps (on screen, at its front face)?
function inGap(cam, b) {
  const s0 = cam.VPX + cam.F * b.x0 / b.z0, s1 = cam.VPX + cam.F * b.x1 / b.z0;
  return cam.gaps.some(g => s1 > g.sx - g.w / 2 && s0 < g.sx + g.w / 2);
}

// the five landmark towers (the mockup's numbers), the four hero blocks on the quay
const LANDMARKS = [
  { id: 'sunburst', x: 30, w: 13, z: 255, h: 112, mat: 'lime', crown: { t: 'sunburst', h: 13 }, tiers: 3 },
  { id: 'needle', x: 56, w: 11, z: 280, h: 100, mat: 'cream', crown: { t: 'spire', h: 18 }, tiers: 3 },
  { id: 'pyramid', x: 4, w: 10, z: 290, h: 86, mat: 'slate', crown: { t: 'pyramid', h: 10 }, tiers: 3 },
  { id: 'dome', x: -26, w: 11, z: 280, h: 78, mat: 'terra', crown: { t: 'dome', h: 6 }, tiers: 2 },
  { id: 'mast', x: -64, w: 11, z: 270, h: 92, mat: 'granite', crown: { t: 'mast', h: 14 }, tiers: 3 },
];
const HEROES = [
  { id: 'hotel', x0: 12, x1: 26, z0: 230, z1: 240, h: 36, mat: 'red', sign: 'blade' },
  { id: 'pulse', x0: -14, x1: 2, z0: 233, z1: 243, h: 28, mat: 'slate', sign: 'roof' },
  { id: 'par', x0: 38, x1: 56, z0: 234, z1: 244, h: 32, mat: 'cream', sign: 'roof' },
  { id: 'jazz', x0: -50, x1: -38, z0: 230, z1: 240, h: 30, mat: 'brick', sign: 'roof' },
];

/** The whole layout for a camera: every piece at its final position and size (world units), plus screen-space checks. */
export function harborLayout(cam, seed = 1924) {
  const P = (x, y, z) => project(cam, x, y, z);
  cam.gaps = SUN_GAPS.map(g => ({ sx: g.f * cam.W, w: g.w * Math.max(1, cam.F / REF.F) }));
  const k = Math.max(1, Math.min(2.2, cam.spread * 0.5));           // the harbor pieces spread out on a panorama
  const span = z => cam.hw(z) * 1.1 + 6;
  // ---- the skyline, far → near: 5 depth bands (the haze, the far band, the mid band, the landmarks, the near band + quay)
  const bands = [
    { id: 'haze', seed: seed + 7, z: Z.haze[0], dz: 200, w: [10, 22], h: [30, 70], gap: 3, towerP: 0.25 },
    { id: 'far', seed: seed + 41, z: Z.far[0], dz: 180, w: [7, 16], h: [40, 100], gap: 4, towerP: 0.35 },
    { id: 'mid', seed: seed + 53, z: Z.mid[0], dz: 60, w: [7, 13], h: [34, 70], gap: 6, towerP: 0.2 },
    { id: 'near', seed: seed + 43, z: Z.near[0], dz: 18, w: [6, 11], h: [22, 48], gap: 1, towerP: 0.1 },
  ].map(o => ({ id: o.id, blocks: band(cam, { ...o, x0: -span(o.z + o.dz), x1: span(o.z + o.dz) }) }));
  const landmarks = LANDMARKS.map(L => ({ ...L, x0: L.x - L.w / 2, x1: L.x + L.w / 2, z0: L.z, z1: L.z + 14, kind: 'landmark' }));
  // a panorama gets more landmarks further out (mirrored, so the centre group stays the heart of the city)
  if (cam.spread > 1.6) for (const L of LANDMARKS.slice(0, 3)) for (const sgn of [-1, 1]) {
    const x = sgn * (90 + Math.abs(L.x) * 1.6);
    if (Math.abs(x) < cam.hw(L.z) * 0.95) landmarks.push({ ...L, id: `${L.id}-${sgn > 0 ? 'r' : 'l'}`, x, x0: x - L.w / 2, x1: x + L.w / 2, z0: L.z + 20, z1: L.z + 34, h: L.h * 0.86, kind: 'landmark' });
  }
  const heroes = HEROES.map(b => ({ ...b, kind: 'hero' }));
  // the squeeze: measured on the highest top, crown included
  const top = b => (b.h + (b.crown ? b.crown.h : 0));
  const all = [...bands.flatMap(b => b.blocks), ...landmarks, ...heroes];
  const yMax = Math.min(...all.map(b => P(0, top(b), b.z0)[1]));
  const sq = squeeze(cam, yMax);
  for (const b of all) {
    const t0 = top(b), t1 = sq(t0, b.z0), r = t1 / t0;
    b.h *= r; if (b.crown) b.crown = { ...b.crown, h: b.crown.h * r };
    b.squeeze = r;
  }
  // ---- the far bank and the quay, the water
  const quay = { z: Z.quay, top: 0.4, foot: -1.2 };
  const water = { z0: Z.rail, z1: Z.quay };
  // ---- the pier + the Ferris wheel (left), the breakwater + the lighthouse + the keeper's cottage (right, in open water)
  const pier = { x0: -34 * k, x1: -20 * k, z0: 140, z1: Z.quay, y: 2.4 };
  const wheel = { x: -24 * k, y: 23, z: 165, r: 17 };
  const lighthouse = { x: 46 * k, z: 150, h: 26, r0: 2.4, r1: 1.7 };
  const breakwater = { x0: lighthouse.x - 20, x1: lighthouse.x + 34, z: 150, h: 1.6 };
  const cottage = { x: lighthouse.x + 3.4, z: 150, w: 5, h: 4.6, roof: 6.6 };
  // ---- the boats (the riverboat "Rosie" with her bulbs, a water taxi, a tug at night, sailboats by day)
  const boats = [
    { id: 'rosie', x: 4 * Math.min(k, 1.3), z: 128, len: 26, h: 11, dir: -1 },
    { id: 'taxi', x: 32 * k, z: 100, len: 6, h: 2.2, dir: 1 },
    { id: 'tug', x: -60 * k, z: 190, len: 8, h: 4.6, dir: 1, when: 'night' },
    { id: 'sail', x: -60 * k, z: 190, len: 6, h: 9, dir: 1, when: 'day' },
    { id: 'sail2', x: 70 * k, z: 200, len: 6, h: 9, dir: -1, when: 'day' },
  ];
  // ---- the near STAGE. The speakeasy bleeds off the left edge (28 pt past it at the reference scale); everything on the
  // phone's stage keeps its place relative to the speakeasy's right face; a panorama repeats the promenade to the right edge.
  const sz0 = 44, sx0 = xAt(cam, -28 * cam.F / REF.F, sz0);
  const speakeasy = { x0: sx0, x1: sx0 + 11.2, z0: sz0, z1: 60, h: 10.5,
    door: { u0: 9.05, u1: 10.55, h: 2.6 }, awning: { u0: 5.9, u1: 8.8, y0: 3.75, y1: 2.95, z: 42.7 },
    windows: [[1.0, 2.9], [4.2, 6.1], [7.4, 9.3]], rows: [[4.5, 6.9], [7.5, 9.9]], tower: { x: sx0 + 1.6, z: 46 } };
  const face = speakeasy.x1, rel = dx => face + dx;            // the phone's stage, relative to the face (−5.6 on the phone)
  const rail = { z: Z.rail, y: 1.1 };
  const road = { z0: Z.road[0], z1: Z.road[1], lane: Z.lane };
  const stopH = units('stopLight');
  const signals = [{ id: 'west', x: rel(2.6), z: 54.6, dir: 1, h: stopH, state: 'red' }, { id: 'east', x: rel(18.1), z: 54.6, dir: -1, h: stopH, state: 'green' }];
  const carL = units('car'), busL = units('bus');
  const bus = { x: rel(13.6), z: 60, len: busL, h: busL * 0.28, dir: -1 };
  const cars = [
    { id: 'sedan', x: rel(20.1), z: 57.5, len: carL, h: carL * 0.33, dir: 1 },
    { id: 'coupe', x: rel(-2.4), z: 57, len: carL, h: carL * 0.33, dir: 1 },
    { id: 'suv', x: rel(-9.4), z: 61, len: carL * 1.08, h: carL * 0.4, dir: -1 },
  ];
  const prom = { z0: Z.prom[0], z1: Z.prom[1] };
  const lampH = units('lamp'), canopy = units('canopy') / 2, personH = units('person');
  const lamps = [{ x: rel(2), z: 47, dir: 1 }, { x: rel(11), z: 47, dir: 1 }, { x: rel(18.2), z: 47, dir: -1 }, { x: rel(14.2), z: 37, dir: -1 }].map(l => ({ ...l, h: lampH }));
  const trees = [{ x: rel(4.4), z: 47.3 }, { x: rel(15.4), z: 47.3 }, { x: cam.hw(37.4) * 0.84, z: 37.4, corner: 'right' }, { x: rel(-6), z: 37.4, corner: 'left' }].map(t => ({ ...t, r: canopy, trunk: canopy * 2 }));
  const bench = { x: rel(12.8), z: 47.8, w: 2.4 };
  const planters = [{ x: rel(0.2), z: 43 }, { x: rel(6), z: 43 }];
  const cart = { x: rel(9.2), z: 37.6, kind: 'chestnuts' };
  const people = [
    { id: 'cart', x: rel(11.2), z: 37.2, dir: -1, h: personH * 1.0 },
    { id: 'doorman', x: rel(1.2), z: 44.2, dir: 1, h: personH * 1.05, hat: true },
    { id: 'couple-a', x: rel(6), z: 40, dir: 1, h: personH * 1.05, hat: true },
    { id: 'couple-b', x: rel(6.8), z: 40.3, dir: 1, h: personH * 0.95 },
    { id: 'dog', x: rel(-1.2), z: 39.5, dir: 1, h: personH, dog: true },
    { id: 'hail', x: rel(20.2), z: 45, dir: -1, h: personH, hat: true },
    { id: 'stroll', x: rel(10.2), z: 46.6, dir: 1, h: personH * 0.98 },
    { id: 'walker', x: rel(3.2), z: 41.5, dir: -1, h: personH * 1.02, hat: true },
  ];
  // the rooftop: planters and string lights (people up there come with Part 7)
  const roof = { planters: [0.8, 3, 5.2, 7.4, 9.6].map(u => ({ x: sx0 + u, z: 44.8 })), pole: { x: speakeasy.x1 - 0.3, z: 44.5, h: 4 } };
  // a panorama: the promenade goes on to the right edge — lamp + tree pairs, a bench now and then, people
  if (cam.spread > 1.6) {
    const r = rngFrom(seed + 99);
    const end = cam.hw(47) * 0.98;
    for (let x = rel(26), i = 0; x < end; x += 18 + r() * 6, i++) {
      lamps.push({ x, z: 47, dir: i % 2 ? 1 : -1, h: lampH });
      if (x + 2.4 < end) trees.push({ x: x + 2.4, z: 47.3, r: canopy, trunk: canopy * 2 });
      if (i % 2 === 0) bench.more = [...(bench.more || []), { x: x + 7, z: 47.8, w: 2.4 }];
      people.push({ id: `p${i}`, x: x + 5 + r() * 6, z: 40 + r() * 6, dir: r() < 0.5 ? -1 : 1, h: personH * (0.95 + r() * 0.1), hat: r() < 0.4 });
      if (i % 2 === 1) cars.push({ id: `car${i}`, x: x + r() * 8, z: r() < 0.5 ? 57.5 : 61, len: carL, h: carL * 0.33, dir: r() < 0.5 ? -1 : 1 });
    }
  }
  // a wide screen: the dock is an island in the middle, so the promenade's front row (z 28–33) lives either side of it —
  // a lamp + tree pair, a bench, people — never under the dock (a phone's dock spans the width: no front row there)
  if (cam.wide) {
    const r = rngFrom(seed + 77);
    const zf = 31, pad = 24;
    const free = sx => sx < cam.dock.x - pad || sx > cam.dock.x + cam.dock.w + pad;
    const left = xAt(cam, -10, zf), right = xAt(cam, cam.W + 10, zf);
    const fromX = xAt(cam, project(cam, speakeasy.x1, 0, sz0)[0] + 12, zf);
    for (let x = fromX, i = 0; x < right; x += 9 + r() * 5, i++) {
      const sx = project(cam, x, 0, zf)[0];
      if (!free(sx) || x < left) continue;
      const kind = i % 3;
      if (kind === 0) { lamps.push({ x, z: zf, dir: r() < 0.5 ? -1 : 1, h: lampH, front: true }); trees.push({ x: x + 2.2, z: zf + 0.3, r: canopy, trunk: canopy * 2, front: true }); }
      else if (kind === 1) bench.more = [...(bench.more || []), { x, z: zf + 0.8, w: 2.4 }];
      if (free(project(cam, x + 4, 0, zf)[0])) people.push({ id: `f${i}`, x: x + 4 + r() * 2, z: zf - 1 + r() * 3, dir: r() < 0.5 ? -1 : 1, h: personH * (0.95 + r() * 0.1), hat: r() < 0.4 });
    }
  }
  const L = { cam, seed, bands, landmarks, heroes, quay, water, pier, wheel, lighthouse, breakwater, cottage, boats, rail, road, signals, bus, cars, prom, lamps, trees, bench, planters, cart, people, speakeasy, roof, squeeze: sq.s, knee: sq.knee, gaps: cam.gaps };
  L.door = doorRect(L);
  return L;
}

/** the speakeasy's door on screen: { x, y (its foot), w, h, rect (the ≥ 44 pt tap target) } */
export function doorRect(L) {
  const c = L.cam, s = L.speakeasy;
  const [a, y0] = project(c, s.x0 + s.door.u0, 0, s.z0), [b, y1] = project(c, s.x0 + s.door.u1, s.door.h, s.z0);
  const w = b - a, h = y0 - y1, cx = (a + b) / 2, cy = (y0 + y1) / 2;
  const tw = Math.max(44, w + 8), th = Math.max(44, h + 8);
  return { x: cx, y: y0, w, h, rect: { x: cx - tw / 2, y: cy - th / 2, w: tw, h: th }, side: 'left' };
}

/** every piece's screen box (pt), for the checks and the &grid overlay. kind: sky | alive | still */
export function screenBoxes(L) {
  const c = L.cam, P = (x, y, z) => project(c, x, y, z);
  const box = (id, kind, x0, x1, y0, y1, z) => { const [a, b] = P(x0, y1, z), [cc, d] = P(x1, y0, z); return { id, kind, x: a, y: b, w: cc - a, h: d - b, z }; };
  const out = [];
  for (const bd of L.bands) for (const b of bd.blocks) out.push(box(`${bd.id}`, 'sky', b.x0, b.x1, 0, b.h + (b.crown ? b.crown.h : 0), b.z0));
  for (const b of [...L.landmarks, ...L.heroes]) out.push(box(b.id, 'sky', b.x0, b.x1, 0, b.h + (b.crown ? b.crown.h : 0), b.z0));
  for (const p of L.people) out.push(box(`person:${p.id}`, 'alive', p.x - p.h * 0.22, p.x + p.h * 0.22, 0, p.h, p.z));
  for (const v of [L.bus, ...L.cars]) out.push(box(`car:${v.id || 'bus'}`, 'alive', v.x - v.len / 2, v.x + v.len / 2, 0, v.h, v.z));
  for (const bt of L.boats) out.push(box(`boat:${bt.id}`, 'alive', bt.x - bt.len / 2, bt.x + bt.len / 2, 0, bt.h, bt.z));
  out.push(box('cart', 'alive', L.cart.x - 1.2, L.cart.x + 1.2, 0, 3.5, L.cart.z));
  for (const l of L.lamps) out.push(box('lamp', 'still', l.x - 0.3, l.x + 0.3, 0, l.h, l.z));
  for (const s of L.signals) out.push(box(`signal:${s.id}`, 'still', s.x - 0.3, s.x + 0.3, 0, s.h, s.z));
  return out;
}
