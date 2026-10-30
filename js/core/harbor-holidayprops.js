// CITY 2.0 — THE HARBOR, PART 11a-1: THE HOLIDAY DRESSINGS ON THE GROUND — WHERE (PURE: no DOM — tests/harbor-holidayprops.test.mjs).
// docs/harbor/passes/part-11a-1.md. Every place in world units from the layout (core/harbor-layout.js#harborLayout): the speakeasy's side door
// + its two granite steps, the promenade's lamps + trees. The painters + the live manager: screens/harbor/holidayprops.js.
//   pumpkinSlots(L)     HALLOWEEN — the jack-o'-lanterns' places on + round the side door's steps (slot i = the i-th pumpkin to
//                       arrive — core/harbor-holiday.js#PUMPKIN_DAYS — the first ones take the best spots), their kind + size + face
//   bigPumpkins(L)      WIN — the farm delivery's three BIG jack-o'-lanterns on the promenade's DRESSING SPOTS (core/harbor-spots.js)
//   marigoldSpots(L)    DAY OF THE DEAD — the marigold pots by the door, the rings round the trees' grates, the clumps at the lamps'
//                       feet + the planters (wide layouts)
//   garlandPosts(L)     the posts the marigold garlands wind up (PROM: the trees' trunks + the side door's jambs — no lampposts)
//   petalPath(L)        the marigold petal path from the promenade to the side door: [{ x, z, r, hue, rot, s }] (seeded, denser at the
//                       door) — a curve, its petals
//   papelRuns(L)        the papel picado strings across the promenade: [{ a: {x,y,z}, b: {x,y,z}, sag, n (flags), front }]
//   monarchAt(n, u, L)  a monarch's flight (u 0..1 across) → { x, y, z, hd, flap }
//   monarchSlot(ms, o)  is a monarch flying now (rare: about one every ~13 minutes by day) → { n, u } | null
import { rngFrom, hashString } from './rng.js';
import { dressingSpots } from './harbor-spots.js';
import { centreK } from './harbor-promenade.js';

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
  // (11a-2 — the owner: "rearrange the other pumpkins if you have a better layout": THE GIANT owns the centre now — the bench's piece moves
  // to the bench's FAR (left) end, out of the dance ring's way, framing the scene from the left with the hydrant's; the front strip's
  // corner piece (it stood straight in front of the giant) is retired — the centre reads as ONE hero)
  { spot: 'bench-left', kind: 'classic', d: 1.5, face: 'scary', bale: true, gourd: true },   // on a straw bale at the bench's far end, a gourd beside it (~19 pt)
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

// ------------------------------------------------------------------ 11a-2 — THE GIANT JACK-O'-LANTERN on the centre circle (the owner, Oct 26)
/** its size (world units — a person is 2.1 tall): the body (R its radius across the ribs, Hh its half-height, yc its centre over the bed,
 *  the ribs, how deep a crease cuts, the rind's thickness), the straw bed under it (`plinth`: an ellipse w × d, h its thickness), the
 *  sprite's box (x: half its width; top + bottom on screen, in units up), e: the depth exaggeration (the props' frame). The owner (Oct 26:
 *  "HUGE … twice the size"): an Atlantic giant ~8.2 units across (~110 pt at 402, two people tall) — it hides the crosswalk's near
 *  stripes + the WAIT / WALK lantern's foot behind its stem (DECIDED: the owner's size wins) */
export const GIANT = Object.freeze({
  body: Object.freeze({ R: 4.1, Hh: 2.2, yc: 2.05, ribs: 16, rib: 0.06, rind: 0.36 }),
  plinth: Object.freeze({ w: 11.2, d: 10.2, h: 0.12 }),
  box: Object.freeze({ x: 4.75, top: 5.8, bottom: -1.9 }),
  e: 1.15,
  /** how far round it the walkers keep (units, from its centre) — its girth + a step */
  clear: 4.85,
});
/** the giant on the inlay (L.medallion) → { x, z, seed } | null */
export function giantPiece(L) {
  const m = L && L.medallion;
  return m ? { x: m.x, z: m.z, seed: 1031 } : null;
}
/** the small pieces dressing the giant's plinth (its two front corners: a warty pumpkin + gourds left, a white pumpkin + gourds right;
 *  uncarved — the giant is the one carved) → [{ i, spot, x, y, z, d, kind, face, bale, gourd, side, tilt, seed, flick, decor }] */
export function giantDecor(L) {
  const m = L && L.medallion; if (!m) return [];
  const y = GIANT.plinth.h;
  return [{ x: m.x - 3.9, z: m.z - 3.0, kind: 'warty', d: 1.0, side: -1 }, { x: m.x + 3.95, z: m.z - 2.95, kind: 'white', d: 0.95, side: 1 }].map((q, k) => {
    const r = rngFrom(hashString(`giant-decor|${k}`));
    return { i: 200 + k, spot: `giant-decor-${k}`, x: q.x, y, z: q.z, d: q.d, kind: q.kind, face: 'none', bale: false, gourd: true, side: q.side, tilt: (r() - 0.5) * 0.12, seed: Math.floor(r() * 1e6), flick: 1, decor: true, pass: 'near' };
  });
}

// ------------------------------------------------------------------ 11a-2 — THANKSGIVING: THE NOVEMBER SPOT DRESSINGS
/** what stands on the DRESSING SPOTS through the November build-up (P: core/harbor-holiday.js#thanksgivingPieces — mums 0..4, bales, spots
 *  0..3, stalks) → [{ id, x, z (its foot), pass ('near' | 'top'), parts (screens/harbor/harvest.js#paintSpotPiece), seed, ext, shadow }]:
 *  the bench's far end a straw bale with pumpkins + gourds + a pot of mums beside it, the hydrant's mums + a squat pumpkin, CORN-STALK
 *  BUNDLES (PROM — no lampposts: clumps at the compass's four diagonals, a pot of mums / a pumpkin at a foot) */
export function thanksgivingSpots(L, P) {
  if (!P) return [];
  const spots = dressingSpots(L), at = id => spots.find(q => q.id === id), out = [];
  const add = (id, x, z, pass, parts, o = {}) => { if (parts.length) out.push({ id, x, z, pass, parts, seed: hashString(`tg|${id}`), ext: o.ext || [1.6, 3.2], shadow: o.shadow || 0.9 }); };
  const bl = at('bench-left');
  if (bl && (P.bales || P.mums >= 2)) {
    const parts = [];
    if (P.bales) { parts.push(['bale', 1.6, 0.85]); if (P.spots >= 1) parts.push(['pumpkin', 'classic', 0.92, -0.28, 0, true]); if (P.spots >= 2) parts.push(['gourds', 0.52, 0.42, -0.06, true]); }
    if (P.spots >= 3) parts.push(['pumpkin', 'white', 0.72, 0.55, -0.62, false]);
    if (P.mums >= 2) parts.push(['mum', 'rust', 0.78, 1.2, -0.3]);   // (C4c: on the bale's RIGHT — its left is the speakeasy's wall)
    add('bench-left', bl.x, bl.z, 'near', parts, { shadow: 1.2 });
  }
  const hy = at('hydrant');
  if (hy && P.mums >= 1) {
    const parts = [['mum', 'gold', 0.82, 0.1, 0.05]];
    if (P.mums >= 3) parts.push(['mum', 'burgundy', 0.7, 0.85, 0.15]);
    if (P.spots >= 1) parts.push(['pumpkin', 'squat', 0.95, -0.55, -0.25]);
    add('hydrant', hy.x, hy.z, hy.pass, parts, { shadow: 1.0 });
  }
  if (P.stalks) {
    // (PROM — NO LAMPPOSTS: the corn-stalk bundles are tied round the TWO TREES' trunks now — the crabapple + the framing maple — a pot of
    // mums / a pumpkin at a foot)
    (L.trees || []).slice().sort((a, b) => a.x - b.x).forEach((t, i) => {
      const parts = [['stalks', t.big ? 2.6 : 2.2]];
      if (i === 0 && P.mums >= 4) parts.push(['mum', 'gold', 0.7, 0.62, -0.32]);
      if (i === 1 && P.spots >= 2) parts.push(['pumpkin', 'warty', 0.78, -0.66, -0.3]);
      add(`stalks-${i}`, t.x, t.z - 0.05, 'near', parts, { ext: [1.2, 3.0], shadow: 0.6 });
    });
  }
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
  for (const t of L.trees || []) if (t.grate) for (const half of ['back', 'front']) out.push({ x: t.x, y: 0, z: t.z, w: 0.95, n: 14, kind: 'ring', half, front: t.z < Math.min(zs, 38.75) && half === 'front' });   // (PROM: a tree out on the floor — the maple — keeps its ring under the walkers)
  // (PROM — no lampposts: the clumps stand at THE COMPASS instead — one at each of its four diagonals, just outside its ring)
  if (L.medallion) for (const a of [0.25, 0.75, 1.25, 1.75]) { const m = L.medallion, rr = m.ring + 0.45; out.push({ x: m.x + Math.cos(a * Math.PI) * rr, y: 0, z: m.z + Math.sin(a * Math.PI) * rr, w: 0.55, n: 8, kind: 'clump', front: false }); }
  // the planters (wide layouts): filled
  for (const p of L.planters || []) out.push({ x: p.x, y: p.h || 0.9, z: p.z, w: (p.w || 1.6) * 0.5, n: 14, kind: 'planter', front: p.z < zs });
  return out;
}
/** what the marigold garlands wind up: { x, z, h (the garland's top), base, front, kind, r (the helix's radius), turns }. PROM — NO
 *  LAMPPOSTS (the owner, Oct 28): the TWO TREES' trunks (up to their first fork) + the speakeasy's FRONT — a pair framing the side
 *  door (wound up its pilasters) */
export function garlandPosts(L) {
  const s = L.speakeasy, zs = s.z0, out = [];
  for (const t of L.trees || []) if (!(L.cam && L.cam.wide && Math.abs(t.x) > L.cam.hw(t.z))) out.push({ x: t.x, z: t.z - 0.02, h: (t.trunk || 2) * 0.86, base: 0.18, front: t.z < Math.min(zs, 38.75), kind: 'trunk', r: t.big ? 0.2 : 0.16, turns: t.big ? 4.2 : 3.4 });
  if (s && s.door) for (const u of [s.door.u0 - 0.24, s.door.u1 + 0.24]) out.push({ x: s.x0 + u, z: s.z0 - 0.12, h: 2.75, base: 0.2, front: false, kind: 'door', r: 0.12, turns: 3.6 });
  return out;
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
  // PROM — NO LAMPPOSTS (the owner, Oct 28: "the RAILING itself becomes the main spot … the papel picado strings re-anchor from the lamps
  // to the railing / the wall / the tree"): ACROSS THE PROMENADE from the crabapple's crown to the framing maple's (high over the floor);
  // ALONG THE RAILING across the road — strung low between its posts, in runs that leave the WAIT / WALK lantern + the crossing's landing
  // clear (`rail`: drawn under the traffic + the far pavement's walkers, which pass in front of it)
  const s = L.speakeasy, out = [];
  const run = (a, b, front, o = {}) => { const len = Math.hypot(b.x - a.x, b.z - a.z); if (len < 2) return; out.push({ a, b, sag: o.sag != null ? o.sag : Math.min(0.9, 0.16 + len * 0.05), n: Math.max(5, Math.round(len / (o.gap || 0.52))), front, rail: !!o.rail }); };
  const crab = (L.trees || []).find(o => o.kind === 'crab'), maple = (L.trees || []).find(o => o.kind === 'maple' && o.big);
  const crown = t => ({ x: t.x, y: (t.trunk || 2) + (t.big ? 1.6 : 1.1), z: t.z - 0.2 });
  if (crab && maple) run({ ...crown(crab), x: crab.x + 0.5 }, { ...crown(maple), x: maple.x - 0.9 }, false);
  // (the bold one: from the speakeasy's corner wall right across the floor to the maple — the owner's "across the promenade", nearer + lower)
  if (maple && s) run({ x: s.x1 - 0.05, y: 4.05, z: s.z0 - 0.05 }, { ...crown(maple), x: maple.x - 1.2, y: crown(maple).y - 0.5, z: maple.z - 0.4 }, false);
  // the railing's run: from the left edge to the lantern, from past the crossing's landing to the right edge
  const cw = L.crosswalk, rz = (L.rail ? L.rail.z : 64) - 0.15, y = (L.rail ? L.rail.y : 1.1) + 0.85, hw = L.cam && L.cam.hw ? L.cam.hw(rz) : 21;
  if (cw) {
    const lx = cw.lantern ? cw.lantern.x : (cw.x0 + cw.x1) / 2, cut0 = Math.min(cw.x0, lx - 1.4) - 0.4, cut1 = Math.max(cw.x1, lx + 1.4) + 0.4;
    const segs = [[-hw - 0.5, cut0], [cut1, hw + 0.5]];
    for (const [x0, x1] of segs) { const n = Math.max(1, Math.round((x1 - x0) / 7)); for (let i = 0; i < n; i++) { const a = x0 + (x1 - x0) * i / n, b = x0 + (x1 - x0) * (i + 1) / n; run({ x: a, y, z: rz }, { x: b, y, z: rz }, false, { rail: true, sag: 0.32, gap: 0.62 }); } }
  }
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

// ------------------------------------------------------------------ NIGHT-A2 — THE STANDING PROPS ARE SOLID (the owner, Oct 29 7:12 pm)
// "people walk AROUND it, never through it" — the harvest display (+ every standing set piece the holidays put on the floor): their
// GROUND FOOTPRINTS (world rects, a person's half-width + a step of margin included) for core/harbor-people.js#aroundSolids, which bends
// every walk leg that would cross one round its corners (whoever planned it — the crowd, the cart, the dog walker, the line, a stargazer)
// and moves a stop inside one out to its edge. The harvest display's base: its bottom tier ±2.5 × −1.1…1.1, the foot pieces out to x ±4.1
// and z −2.15 (screens/harbor/harvest.js#HARVEST — tests/harbor-people.test.mjs keeps the two in step), drawn × centreK about the inlay.
export const HARVEST_FOOT = Object.freeze({ x: 4.15, z0: -2.2, z1: 1.15 });
/** a person's half-width + a step: how far outside a piece's own base a walker's foot stays */
export const SOLID_PAD = 0.45;
/**
 * the standing pieces' footprints now → [{ id, x0, x1, z0, z1 }] (world, padded). HP: the holiday's pieces (scene.js's HP — the latched
 * BIG pieces). Covered: THE HARVEST DISPLAY (HP.harvest), THE GIANT jack-o'-lantern (HP.giant), Halloween's BIG pumpkins on their
 * dressing spots (HP.bigs — the bench's bale; the hydrant's stands on the front strip, nearer than the walkers' floor), Thanksgiving's
 * spot pieces (HP.bales / mums / stalks: the bench's bale + mums, the hydrant's mums, the stalk bundles round the two trunks).
 * Not here: the pumpkins on the speakeasy's steps (they flank the door — the guests pass between them by design), the snowman + the
 * Christmas-tree stand (their builders + sellers work AT them; 11b's pieces register here when they're built).
 */
export function standingFootprints(L, HP) {
  if (!L || !HP) return [];
  const out = [], P = SOLID_PAD, box = (id, x, z, hw, hd, hd1 = hd) => out.push({ id, x0: +(x - hw - P).toFixed(3), x1: +(x + hw + P).toFixed(3), z0: +(z - hd - P).toFixed(3), z1: +(z + hd1 + P).toFixed(3) });
  const m = L.medallion, k = centreK(L);
  if (m && HP.harvest) box('harvest', m.x, m.z, HARVEST_FOOT.x * k, -HARVEST_FOOT.z0 * k, HARVEST_FOOT.z1 * k);
  else if (m && HP.giant) box('giant', m.x, m.z, GIANT.body.R * k, GIANT.body.R * k * 0.8);
  if (HP.bigs) for (const b of bigPumpkins(L)) if (b.pass !== 'top') box(`big-${b.spot}`, b.x, b.z, b.bale ? BALE.w / 2 : b.d / 2, b.bale ? BALE.d / 2 : b.d / 2);
  if (HP.bales || HP.mums || HP.stalks) for (const sp of thanksgivingSpots(L, HP)) if (sp.pass !== 'top') box(`tg-${sp.id}`, sp.x, sp.z, sp.id.startsWith('stalks') ? 0.55 : 0.95, 0.55);
  return out;
}
