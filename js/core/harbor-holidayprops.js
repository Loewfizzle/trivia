// CITY 2.0 — THE HARBOR, PART 11a-1: THE HOLIDAY DRESSINGS ON THE GROUND — WHERE (PURE: no DOM — tests/harbor-holidayprops.test.mjs).
// docs/harbor.md#part-11a-1. Every place in world units from the layout (core/harbor-layout.js#harborLayout): the speakeasy's side door
// + its two granite steps, the promenade's lamps + trees. The painters + the live manager: screens/harbor/holidayprops.js.
//   pumpkinSlots(L)     HALLOWEEN — the jack-o'-lanterns' places on + round the side door's steps (slot i = the i-th pumpkin to
//                       arrive — core/harbor-holiday.js#PUMPKIN_DAYS — the first ones take the best spots), their kind + size + face
//   bigPumpkins(L)      WIN — the farm delivery's three BIG jack-o'-lanterns on the promenade's DRESSING SPOTS (core/harbor-spots.js)
//   marigoldSpots(L)    DAY OF THE DEAD — the marigold pots by the door, the rings round the trees' grates, the clumps at the lamps'
//                       feet + the planters (wide layouts)
//   garlandPosts(L)     the lamp posts the marigold garlands wind up
//   petalPath(L)        the marigold petal path from the promenade to the side door: [{ x, z, r, hue, rot, s }] (seeded, denser at the
//                       door) — a curve, its petals
//   papelRuns(L)        the papel picado strings across the promenade: [{ a: {x,y,z}, b: {x,y,z}, sag, n (flags), front }]
//   monarchAt(n, u, L)  a monarch's flight (u 0..1 across) → { x, y, z, hd, flap }
//   monarchSlot(ms, o)  is a monarch flying now (rare: about one every ~13 minutes by day) → { n, u } | null
import { rngFrom, hashString } from './rng.js';
import { dressingSpots } from './harbor-spots.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, t) => a + (b - a) * t;

// ------------------------------------------------------------------ HALLOWEEN: THE PUMPKINS
/** the pumpkins' kinds: their shape (w : h), the skin, the ribs, the stem — a real patch, not one stamp */
export const PUMPKIN_KINDS = Object.freeze({
  classic: { w: 1, h: 0.82, skin: [232, 118, 26], dark: [150, 58, 10], ribs: 8, stem: [92, 96, 46] },
  tall: { w: 0.86, h: 1.04, skin: [226, 112, 24], dark: [140, 56, 12], ribs: 7, stem: [86, 82, 44] },
  squat: { w: 1.1, h: 0.78, skin: [214, 88, 22], dark: [128, 42, 12], ribs: 10, stem: [78, 70, 40] },   // a Cinderella: a slight squat + red-orange (WIN2: 1.18 × 0.66 read as a stretched disc at 25 pt)
  white: { w: 1.04, h: 0.74, skin: [236, 230, 212], dark: [168, 160, 140], ribs: 9, stem: [96, 104, 70] },
  warty: { w: 0.96, h: 0.86, skin: [212, 128, 40], dark: [120, 70, 20], ribs: 8, stem: [80, 88, 40], warts: true },
  gourds: { w: 1, h: 0.6, skin: [222, 170, 40], dark: [130, 90, 20], ribs: 0, stem: [80, 90, 40], cluster: true },
});
/** the carved faces (by slot) — each different: classic triangles, a toothy grin, a cat, a scary one, a happy one, a winking one */
export const FACES = Object.freeze(['triangles', 'toothy', 'scary', 'cat', 'happy', 'wink', 'surprised', 'fangs', 'none']);
/** the steps (core/harbor-layout.js speakeasy.door u0 9.05 → u1 10.55; the lower step z0 − 0.75 → − 0.4 at y 0.13, the upper z0 − 0.4 → z0
 *  at y 0.26). The door's path (u ≈ 9.3 → 10.3) stays free; the black cat sits at u1 + 0.32 on the upper step (harbor-wildlife.js#catSpot). */
// (WIN add-on — the owner: "too crowded on small iPhones → fewer, better laid out (a neat stepped group on the steps + one each side of the
// door), clear of the door's swing, the walk-in and the lobby line; check at 390": nine → FIVE — a stepped group on the steps (the big
// classic low-left, the tall one on the upper step behind it, a small one low-right, clear of the cat's spot) + one on the pavement each
// side of the door (the warty one left of the steps, the squat Cinderella past the corner on the right); the white one by the pole, the
// front-row pair + the gourds are gone)
const PUMPKIN_SPOTS = [
  // u (along the facade), y (what it stands on), dz (from the facade, − = toward us), d (its diameter, world units), kind
  { u: 8.92, y: 0.13, dz: -0.6, d: 0.68, kind: 'classic' },      // 0 the lower step, left — the first + the biggest of the group
  { u: 11.5, y: 0, dz: -1.0, d: 0.74, kind: 'squat' },           // 1 the pavement, right of the door (past the corner)
  { u: 9.06, y: 0.26, dz: -0.2, d: 0.52, kind: 'tall' },         // 2 the upper step, left, behind the first (the stepped group)
  { u: 8.2, y: 0, dz: -0.9, d: 0.62, kind: 'warty' },            // 3 the pavement, left of the steps
  { u: 10.3, y: 0.13, dz: -0.64, d: 0.44, kind: 'classic' },     // 4 the lower step, right — small, clear of the cat
];
export function pumpkinSlots(L) {
  const s = L.speakeasy;
  return PUMPKIN_SPOTS.map((p, i) => {
    const r = rngFrom(hashString(`pumpkin|${i}`));
    return { i, x: s.x0 + p.u, y: p.y, z: s.z0 + p.dz, d: p.d * 1.3, kind: p.kind, face: p.kind === 'gourds' ? 'none' : FACES[i % 8], tilt: (r() - 0.5) * 0.16, seed: Math.floor(r() * 1e6), flick: 0.6 + r() * 0.8 };
  });
}

// ------------------------------------------------------------------ HALLOWEEN: THE BIG JACK-O'-LANTERNS ON THE PROMENADE (WIN add-on)
/** the straw bale a set piece may stand on (world units): w across, h tall, d deep */
export const BALE = Object.freeze({ w: 1.8, h: 0.74, d: 1.0 });
/** the farm delivery's three BIG jack-o'-lanterns (the owner: "readable at a glance: a big one next to the BENCH, another by a LAMP POST or
 *  the FIRE HYDRANT, carved faces glowing at night, some on a straw bale") — each on a named DRESSING SPOT (core/harbor-spots.js) */
export const BIG_PIECES = Object.freeze([
  { spot: 'hydrant', kind: 'classic', d: 1.5, face: 'toothy', bale: false },                // the nearest + the biggest, on the pavement by the hydrant (~23 pt at 402; WIN2: a round classic, the squat kind read stretched)
  { spot: 'bench-right', kind: 'classic', d: 1.5, face: 'scary', bale: true, gourd: true },  // on a straw bale at the bench's end, a gourd beside it (~19 pt)
  { spot: 'corner-right', kind: 'tall', d: 1.6, face: 'happy', bale: true },               // on a bale at the front strip's right end, left of the cart + the framing maple (~25 pt; WIN3: it stood hidden behind the maple's canopy at the lamp post)
]);
/** the big pieces placed on their spots → [{ i (100+), spot, x, y (the bale's top if on one), z, d, kind, face, bale, gourd, pass, tilt, seed,
 *  flick, baleX, baleZ }] — a spot the layout lacks is skipped */
export function bigPumpkins(L) {
  const spots = dressingSpots(L), out = [];
  BIG_PIECES.forEach((p, i) => {
    const sp = spots.find(q => q.id === p.spot); if (!sp) return;
    const r = rngFrom(hashString(`bigpumpkin|${i}`));
    out.push({ i: 100 + i, spot: sp.id, x: sp.x, z: sp.z, y: p.bale ? BALE.h : 0, d: p.d, kind: p.kind, face: p.face, bale: !!p.bale, gourd: !!p.gourd, pass: sp.pass, side: sp.face, tilt: (r() - 0.5) * 0.1, seed: Math.floor(r() * 1e6), flick: 0.6 + r() * 0.8 });
  });
  return out;
}

// ------------------------------------------------------------------ DAY OF THE DEAD
/** the marigold spots: { x, z, y, w (spread, world units), n (blooms), kind: 'pot' | 'ring' | 'clump' | 'planter', front (drawn after
 *  the front row) , half?: 'back' | 'front' (a ring round a tree: its back half behind the trunk) } */
export function marigoldSpots(L) {
  const s = L.speakeasy, out = [], zs = s.z0;
  // the door: two pots flanking the steps (the petal path ends between them)
  out.push({ x: s.x0 + 8.62, y: 0, z: s.z0 - 0.5, w: 0.62, n: 9, kind: 'pot', front: false });
  out.push({ x: s.x0 + 11.0, y: 0, z: s.z0 - 0.62, w: 0.62, n: 9, kind: 'pot', front: false });
  // the trees' grates: a ring of marigolds (its back half behind the trunk, its front half in front)
  for (const t of L.trees || []) if (t.grate) for (const half of ['back', 'front']) out.push({ x: t.x, y: 0, z: t.z, w: 0.95, n: 14, kind: 'ring', half, front: t.z < zs && half === 'front' });
  // the lamps' feet: a clump each side of the base
  for (const l of L.lamps || []) out.push({ x: l.x, y: 0, z: l.z - 0.12, w: 0.55, n: 8, kind: 'clump', front: l.z < zs });
  // the planters (wide layouts): filled
  for (const p of L.planters || []) out.push({ x: p.x, y: p.h || 0.9, z: p.z, w: (p.w || 1.6) * 0.5, n: 14, kind: 'planter', front: p.z < zs });
  return out;
}
/** the lamp posts the garlands wind up: { x, z, h (the garland's top), front } */
export function garlandPosts(L) {
  const zs = L.speakeasy.z0;
  return (L.lamps || []).map(l => ({ x: l.x, z: l.z, h: l.kind === 'tall' ? l.h * 0.62 : l.h * 0.72, base: 0.25, front: l.z < zs, kind: l.kind }));
}
/** the petal path: from the open promenade in front of the medallion to the side door's steps — a soft S-curve; denser at the door */
export function petalPath(L, n = 980) {
  const s = L.speakeasy, door = { x: s.x0 + (s.door.u0 + s.door.u1) / 2, z: s.z0 - 0.82 };
  const med = L.medallion || { x: door.x + 10, z: s.z0 };
  const A = { x: lerp(door.x, med.x, 0.62), z: Math.max((L.prom ? L.prom.z0 : 30) + 8.4, s.z0 - 5.2) };   // the start, out on the floor
  const C1 = { x: lerp(A.x, door.x, 0.25), z: A.z + 2.6 }, C2 = { x: door.x + 2.6, z: door.z - 1.6 };
  const bez = u => { const v = 1 - u; return { x: v * v * v * A.x + 3 * v * v * u * C1.x + 3 * v * u * u * C2.x + u * u * u * door.x, z: v * v * v * A.z + 3 * v * v * u * C1.z + 3 * v * u * u * C2.z + u * u * u * door.z }; };
  const r = rngFrom(hashString('petals|dotd')), out = [];
  for (let i = 0; i < n; i++) {
    // denser toward the door: u biased to 1
    const u = 1 - Math.pow(r(), 1.55), p = bez(u), q = bez(Math.min(1, u + 0.01)), tx = q.x - p.x, tz = q.z - p.z, tl = Math.hypot(tx, tz) || 1;
    const width = lerp(0.62, 1.0, u), stray = r() < 0.06 ? 1.9 : 1, off = (r() + r() + r() - 1.5) / 1.5 * width * stray;
    out.push({ x: p.x - (tz / tl) * off, z: p.z + (tx / tl) * off * 0.6, r: 0.05 + r() * 0.05, hue: r(), rot: r() * Math.PI * 2, s: 0.5 + r() * 0.5, u });
  }
  // the VOTIVES lining the path (glass cups with a candle — lit after dark): pairs, closer toward the door
  const candles = [];
  for (const [u, side] of [[0.18, 1], [0.34, -1], [0.48, 1], [0.6, -1], [0.71, 1], [0.8, -1], [0.88, 1], [0.95, -1]]) {
    const p = bez(u), q = bez(Math.min(1, u + 0.01)), tx = q.x - p.x, tz = q.z - p.z, tl = Math.hypot(tx, tz) || 1, w = lerp(0.62, 1.0, u) + 0.22;
    candles.push({ x: p.x - (tz / tl) * w * side, z: p.z + (tx / tl) * w * side * 0.6, u, glass: candles.length % 3 });
  }
  return { pts: out, a: A, door, curve: bez, candles };
}
/** the papel picado strings across the promenade: [{ a, b (world {x,y,z} — the ends), sag (units), n (flags), front (the string
 *  runs in the front row: its ends on the front lamps) }] — the tall lamps' pair, the corner from the speakeasy to the left tall lamp,
 *  the front globes' pair (+ the speakeasy's corner to the left globe) */
export function papelRuns(L) {
  const s = L.speakeasy, out = [], lamps = (L.lamps || []).slice().sort((a, b) => a.x - b.x);
  const tall = lamps.filter(l => l.kind === 'tall'), globes = lamps.filter(l => l.kind !== 'tall');
  const post = (l, y) => ({ x: l.x, y, z: l.z });
  const run = (a, b, front) => { const len = Math.hypot(b.x - a.x, b.z - a.z); if (len < 2) return; out.push({ a, b, sag: Math.min(0.9, 0.16 + len * 0.05), n: Math.max(5, Math.round(len / 0.52)), front }); };
  // (the first run starts in the crabapple's crown right of the blade sign — strung from the speakeasy's corner it passed BEHIND the blade,
  // which hangs nearer to us; no crabapple → the speakeasy's corner)
  const crab = (L.trees || []).filter(o => o.kind === 'crab' && tall.length && o.x < tall[0].x).sort((a, b) => b.x - a.x)[0];
  const corner = crab ? { x: crab.x + 0.35, y: (crab.trunk || 2) + 1.1, z: crab.z - 0.2 } : { x: s.x1 - 0.05, y: 4.05, z: s.z0 - 0.05 };
  if (tall.length) run(corner, post(tall[0], 4.75), false);
  for (let i = 0; i + 1 < tall.length; i++) run(post(tall[i], 4.75), post(tall[i + 1], 4.75), false);
  for (let i = 0; i + 1 < globes.length; i++) run(post(globes[i], 3.25), post(globes[i + 1], 3.25), true);
  return out;
}

// ------------------------------------------------------------------ MONARCHS (rare, by day)
/** a monarch now: by day ~3 of every 4 ten-minute slots carry one (seeded, ~22 s across: about one every 13 minutes); forced: one every 25 s from the flag */
export const MONARCH = Object.freeze({ slot: 600, len: 22, chance: 0.75 });
export function monarchSlot(ms, o = {}) {
  const s = ms / 1000;
  if (o.forceAt != null) { const e = s - o.forceAt / 1000 - 1.5; if (e < 0) return null; const n = Math.floor(e / 25), u = (e - n * 25) / MONARCH.len; return u < 1 ? { n: 9000 + n, u } : null; }
  if (!o.on) return null;
  const k = Math.floor(s / MONARCH.slot), r = rngFrom(hashString(`monarch|${k}`));
  if (r() > MONARCH.chance) return null;
  const t0 = k * MONARCH.slot + r() * (MONARCH.slot - MONARCH.len), u = (s - t0) / MONARCH.len;
  return u >= 0 && u < 1 ? { n: k, u } : null;
}
/** its place at u across: in from one side, a meander over the promenade (dips to the marigolds, a glide now + then), out the other */
export function monarchAt(n, u, L) {
  const r = rngFrom(hashString(`monarch-path|${n}`)), dir = r() < 0.5 ? 1 : -1;
  const hw = L && L.cam && L.cam.hw ? L.cam.hw(42) : 14, z = 38.6 + r() * 6;
  const x0 = -dir * (hw + 2), x1 = dir * (hw + 2);
  const ph = r() * 6, f1 = 2 + r() * 1.5, f2 = 5 + r() * 2;
  const x = lerp(x0, x1, u) + Math.sin(u * f1 * Math.PI + ph) * 1.2;
  const y = 1.6 + 0.9 * Math.sin(u * f1 * 2.1 + ph) + 0.35 * Math.sin(u * f2 * 6 + ph * 2) + 0.4 * r();
  const dz = Math.sin(u * 3.1 + ph) * 1.4;
  // the wingbeat: bursts of flapping (~7 Hz) with short glides (wings held open, a little up)
  const glide = Math.sin(u * 13 + ph * 3) > 0.55;
  return { x, y: Math.max(0.6, y), z: z + dz, hd: dir > 0 ? 0 : Math.PI, dir, glide };
}
