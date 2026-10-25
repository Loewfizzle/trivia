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
import { rngFrom, hashString } from './rng.js';
import { SPEAK_V } from './harbor-speakeasy.js';
import { promenadeLayout } from './harbor-promenade.js';

/** the mockup's reference phone and camera */
export const REF = { W: 402, H: 874, VPY: 540, CAMH: 13.5, F: 600 };
/** depths (world z) of the bands, far → near */
export const Z = { haze: [620, 820], far: [380, 560], mid: [300, 360], landmark: [255, 290], near: [232, 250], quay: 230, rail: 64, road: [54, 64], lane: 59, prom: [30, 54], front: 36.5, ref: 47 };
/** THE SIZE RULES: on-screen size in pt on the reference phone, at the depth where the thing usually stands */
export const SIZE = {
  person: { pt: 27, z: 47 },      // hats, scarves, coats readable by shape + colour (8a — the owner: ~⅔ of the speakeasy's door; was 20)
  car: { pt: 55, z: 58 },         // 50–60 pt long
  bus: { pt: 110, z: 60 },
  lamp: { pt: 50, z: 47 },        // 45–55 pt
  canopy: { pt: 40, z: 47 },      // a tree's crown, across
  stopLight: { pt: 55, z: 54.6 }, // heads 1.3× real size
};
/** pt on the reference phone → world units at the thing's depth */
export const units = (name, pt = SIZE[name].pt) => pt * SIZE[name].z / REF.F;
/** a 1920s city coach's height (world units) — the road lane's band reaches up to it (FP3a: the parked placeholder bus is gone; the
 *  moving one is 8P's bus.js) */
export const BUS_H = () => units('bus') * 0.28;
/** world units → pt on a given camera, at depth z */
export const ptAt = (cam, u, z) => u * cam.F / z;

const DOCK_H = 76;         // the dock bar (css/title.css .nd-bar), measured Oct 20 2026
const GAP_ABOVE_DOCK = 4;  // the front row's feet stand this far above the dock's top
const UNDER_TAG = 10;      // the tallest crown stops this far under the tagline
const KNEE_B = 24;         // the knee's softness, pt

/**
 * The camera for a screen. rects: { tag: {y, h}, dock: {x, y, w, h}, neon?, word?, corner? } from the real title (fall back to estimates
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
    F = Math.max(REF.F * room / 411, 9 * SIZE.person.z / units('person', 20));   // (the camera keeps Part 1's 20-pt reference person: 8a's bigger people never move it)
    CAMH = Math.min(REF.CAMH, (room > 250 ? 0.55 : 0.4) * room * Z.front / F);
  }
  const VPY = front - F * CAMH / Z.front;
  // the neon letters, SPEAKEASY, the corner buttons (☰ + music): only for the lanes (laneRects), never for the camera
  const neon = rects.neon || { x: W / 2 - 140, y: tag.y - (wide ? (W >= 1000 ? 205 : 121) : 141), w: 280, h: 85 };
  const word = rects.word || { x: W / 2 - 150, y: tag.y - 34, w: 300, h: 21 };
  const corner = rects.corner || { x: W - 56, y: (safe.top || 0) + 10, w: 44, h: 90 };
  const cam = { W, H, wide, F, CAMH, VPX: W / 2, VPY, dock, tag, neon, word, corner, cornerL: rects.cornerL || null, limitY: tagB + UNDER_TAG, front, safeTop: safe.top || 0, safeBottom: sb };
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

// ================================================================== THE SKYLINE (Part 2)
// The composition is designed on the reference phone in SCREEN FRACTIONS (f: 0 = the left edge, 1 = the right edge) and put
// in the world at x = (f − 0.5)·(REF.W / REF.F)·z — so every upright phone shows exactly the same skyline (F follows the
// width), and a wide screen keeps it as its centre group with a panorama generated around it.
const FX = REF.W / REF.F;
/** the world x of a screen fraction at depth z (on any upright phone); and back */
export const fxAt = (f, z) => (f - 0.5) * FX * z;
export const fOf = (x, z) => 0.5 + x / (FX * z);

/** the reference title (402×874, measured with the iPhone's safe areas): the squeeze is decided here once, so every upright
 *  phone gets the same skyline; a roomier phone shows more sky above it (the owner's call, Oct 21 2026) */
export const REF_TITLE = { W: 402, H: 874, tag: { y: 319, h: 14 }, dock: { x: 14, y: 758, w: 374, h: 76 }, safe: { top: 62, bottom: 34 } };
/**
 * THE BILLBOARD (8a — the owner: onto the speakeasy's roof): over the left half-plus of the roof (u0..u1 from the speakeasy's left
 * end), set back near the roof's back edge (back: units in front of it) so the deck in front stays open (7b's guests walk in front
 * of it, 8b's billposter works up there); on a SHORT steel frame (FP — the owner: the tall open frame showed the brick city behind
 * through the gap and "looked chaotic": open = units of frame between the platform and the board's foot, now ~⅛ of its height, the
 * board's bottom only a little above the string lights) standing on a DUNNAGE platform (steel beams on short posts from the deck)
 * whose top (dun, above the pavement) sits just behind the string lights, clear of the parapet's line from this camera.
 */
export const BILLBOARD = Object.freeze({ u0: 0.6, u1: 7.4, back: 1.0, dun: 11.9, open: 0.5, h: 3.7 });


/**
 * THE SUN GAPS: corridors (screen fraction, width pt) in the skyline's TOPS where the low sun's rays stream between the
 * towers at golden hour — near both sides, where the sun's arch rises and sets (sun.js: 7.5–30 % in from each edge). Chosen
 * against the WHOLE silhouette: no tower, landmark or hero stands in one (tested). Below a corridor's floor the city stays
 * one dense wall: a band's block there is CLIPPED (its piece in the corridor is lowered to the floor), never dropped, and
 * the farther, hazier bands stand a little higher behind it — never a hole through the city.
 */
export const SUN_GAPS = [{ f: 0.046, w: 6 }, { f: 0.19, w: 9 }, { f: 0.322, w: 8 }, { f: 0.669, w: 6 }, { f: 0.84, w: 6 }];
const GAP_PAD = 2;            // a side face intrudes up to ~1.5 pt: the corridor keeps this much more on each side
/** a corridor's floor (the dense base's top) and how much higher each farther band stands behind it, as heights above the
 *  waterline in reference pt (× F / REF.F on any camera) */
const FLOOR = { near: 78, mid: 84, far: 100, haze: 122 };

const MATS_NEAR = ['brick', 'brick', 'lime', 'terra', 'granite', 'cream', 'red'];
const MATS_FAR = ['lime', 'cream', 'terra', 'granite', 'slate', 'lime', 'cream'];   // brick only on near buildings
const CROWNS = ['spire', 'pyramid', 'dome', 'stepped', 'tank'];

/**
 * THE TOWERS, placed by hand (f, z, w, h + crown, the form = its setbacks). The two dominant towers (the sunburst — the
 * city's one gold crown — and the stepped EMPIRE with its mast) and a slimmer third (the needle); the WORD towers (a neat
 * grid, windows big enough for letters: wordA + wordB side by side for horizontal words, wordV for vertical ones); the
 * middle tier in clusters; the newer city's two glass towers far back in the haze. Never in a corridor (tested).
 */
export const TOWERS = [
  { id: 'sunburst', f: 0.622, z: 258, w: 12.5, h: 96, mat: 'lime', form: 'sunburst', crown: { t: 'sunburst', h: 17 }, gold: true, rank: 'hero' },
  { id: 'empire', f: 0.105, z: 266, w: 15, h: 90, mat: 'lime', form: 'empire', crown: { t: 'mast', h: 15 }, rank: 'hero' },
  { id: 'needle', f: 0.49, z: 286, w: 8.5, h: 80, mat: 'cream', form: 'needle', crown: { t: 'spire', h: 18 }, rank: 'hero', needle: 7 },   // (needle: THE NEON NEEDLE's tube above the spire, Part 3)
  { id: 'wordA', f: 0.759, z: 247, cols: 19, pu: 1.1, pv: 1.95, h: 66, mat: 'cream', form: 'deco', crown: { t: 'deco', h: 4 }, rank: 'word', word: 'h', rows: 12 },
  { id: 'wordB', f: 0.928, z: 247, cols: 15, pu: 1.1, pv: 1.95, h: 62, mat: 'terra', form: 'deco', crown: { t: 'deco', h: 4 }, rank: 'word', word: 'h', rows: 12 },
  { id: 'wordV', f: 0.25, z: 258, cols: 5, pu: 2.0, pv: 1.95, h: 92, mat: 'cream', form: 'slab', crown: { t: 'spire', h: 9 }, rank: 'word', word: 'v', rows: 24 },
  // the middle tier: clusters (left edge, behind the wheel, right), varied heights, breathing room between them
  { id: 'm-edge', f: -0.012, z: 300, w: 10, h: 62, mat: 'terra', form: 'stepped', crown: { t: 'pyramid', h: 8 }, rank: 'mid' },
  { id: 'm-dome', f: 0.395, z: 304, w: 11, h: 58, mat: 'cream', form: 'dome', crown: { t: 'dome', h: 7 }, rank: 'mid' },
  { id: 'm-step', f: 0.565, z: 312, w: 9.5, h: 52, mat: 'granite', form: 'stepped', crown: { t: 'stepped', h: 6 }, rank: 'mid' },
  { id: 'm-twin', f: 0.44, z: 322, w: 8, h: 46, mat: 'terra', form: 'block', crown: { t: 'tank', h: 4 }, rank: 'mid' },
  { id: 'm-right', f: 0.99, z: 300, w: 9, h: 56, mat: 'granite', form: 'stepped', crown: { t: 'spire', h: 9 }, rank: 'mid' },
  // the newer city behind the old harbor: glass, far back, hazy (sky reflections by day, thin crown lines at night)
  { id: 'glassL', f: 0.364, z: 470, w: 13, h: 118, mat: 'glass', form: 'modern', crown: { t: 'slant', h: 10 }, rank: 'modern' },
  { id: 'glassR', f: 0.79, z: 540, w: 12, h: 132, mat: 'glass', form: 'modern', crown: { t: 'flat', h: 3 }, rank: 'modern' },
];
/** a form's tiers: [share of the height, inset per side (of the tier below's width)] */
const FORMS = {
  sunburst: [[0.64, 0], [0.2, 0.12], [0.16, 0.15]],
  empire: [[0.34, 0], [0.08, 0.08], [0.42, 0.13], [0.08, 0.12], [0.08, 0.17]],
  needle: [[0.72, 0], [0.16, 0.12], [0.12, 0.17]],
  deco: [[0.88, 0], [0.07, 0.1], [0.05, 0.2]],
  slab: [[0.9, 0], [0.1, 0.16]],
  stepped: [[0.7, 0], [0.17, 0.12], [0.13, 0.16]],
  dome: [[0.8, 0], [0.2, 0.12]],
  modern: [[1, 0]],
  block: [[1, 0]],
};
/** the window grid (world units): the mockup's floors (3.0) and bays (2.3) by default; the word towers set their own */
const PITCH = [2.3, 3.0];
const DEPTH = 14;            // a tower's depth (a block's: 12)

const HEROES = [
  { id: 'hotel', x0: 10, x1: 24, z0: 230, z1: 240, h: 36, mat: 'red', sign: 'blade' },   // (Part 2: 2 left of the mockup's, clear of the corridor beside the sunburst)
  { id: 'pulse', x0: -14, x1: 2, z0: 233, z1: 243, h: 28, mat: 'slate', sign: 'roof' },
  { id: 'par', x0: 38, x1: 56, z0: 234, z1: 244, h: 30, mat: 'cream', sign: 'roof' },
  { id: 'jazz', x0: -50, x1: -38, z0: 230, z1: 240, h: 30, mat: 'brick', sign: 'roof' },
];

// the middle tier's clusters along the width (screen fractions; repeated beyond a phone's width for the panorama)
const CLUSTERS = [0.03, 0.4, 0.56, 0.98];
const clusterK = f => { const ff = ((f % 1) + 1) % 1; let m = 0; for (const c of CLUSTERS) for (const d of [-1, 0, 1]) m = Math.max(m, Math.exp(-(((ff - c - d) / 0.075) ** 2))); return m; };

/** a block's screen span (pt), its side face included (the face toward the middle reaches past the front) */
function spanOf(cam, x0, x1, z0, z1) {
  const a = cam.VPX + cam.F * x0 / z0, b = cam.VPX + cam.F * x1 / z0;
  return [x0 > 0 ? cam.VPX + cam.F * x0 / z1 : a, x1 < 0 ? cam.VPX + cam.F * x1 / z1 : b];
}
/** the world x where a block's span reaches a screen x: the left piece's right end (side face included), the right piece's left end */
const cutL = (cam, sx, z0, z1) => Math.min((sx - cam.VPX) * z0 / cam.F, (sx - cam.VPX) * z1 / cam.F);
const cutR = (cam, sx, z0, z1) => Math.max((sx - cam.VPX) * z0 / cam.F, (sx - cam.VPX) * z1 / cam.F);

/** a window grid on a face of width w and height h (world units): centred columns, floors from v0 */
function grid(w, h, pu = PITCH[0], pv = PITCH[1], v0 = 0.9) {
  const cols = Math.max(1, Math.floor((w - 0.8) / pu)), rows = Math.max(0, Math.floor((h - v0 - 0.4) / pv));
  return { cols, rows, u0: (w - cols * pu) / 2, v0, pitch: [pu, pv] };
}

// one skyline band: blocks side by side over [x0, x1], heights shaped by the clusters, CLIPPED at the corridors
function band(cam, o, cuts) {
  const r = rngFrom(o.seed);
  const out = [];
  let x = o.x0, i = 0;
  while (x < o.x1) {
    const w = o.w[0] + r() * (o.w[1] - o.w[0]);
    let h = o.h[0] + r() * (o.h[1] - o.h[0]);
    const z = o.z + r() * o.dz;
    const mats = o.id === 'near' ? MATS_NEAR : MATS_FAR;
    const mat = mats[Math.floor(r() * mats.length)];
    const tower = r() < o.towerP;
    const crown = r() < (tower ? 0.6 : 0.22) ? { t: CROWNS[Math.floor(r() * CROWNS.length)], h: tower ? 5 + r() * 7 : 2.5 + r() * 2.5 } : null;
    const k = r(), id = `${o.id}${i++}`;
    if (tower) h *= 1.15;
    // the clusters: taller where the middle tier gathers, lower in the breathing room between
    h *= o.flat ? 0.9 + 0.2 * clusterK(fOf(x + w / 2, z)) : 0.72 + 0.42 * clusterK(fOf(x + w / 2, z));
    const b = { id, x0: x, x1: x + w, z0: z, z1: z + (tower ? DEPTH : 12), h, mat, kind: tower ? 'tower' : 'block', crown: crown && (crown.t !== 'tank' || !tower) ? crown : null, band: o.id, seed: hashString(`${o.id}|${id}`), k };
    out.push(...clip(cam, b, cuts));
    x += w + (o.gap < 0 ? o.gap : o.gap * r());
  }
  return out;
}
// split a block at the corridors it covers: the pieces either side keep their height, the piece in the corridor is lowered
// to the corridor's floor for this band (cap, applied after the squeeze) — the base stays a dense wall
function clip(cam, b, cuts) {
  let parts = [b];
  for (const g of cuts) {
    const next = [];
    for (const p of parts) {
      const [s0, s1] = spanOf(cam, p.x0, p.x1, p.z0, p.z1), g0 = g.sx - g.w / 2 - GAP_PAD, g1 = g.sx + g.w / 2 + GAP_PAD;
      if (p.cap != null || s1 <= g0 || s0 >= g1) { next.push(p); continue; }
      const xl = Math.max(p.x0, cutL(cam, g0, p.z0, p.z1)), xr = Math.min(p.x1, cutR(cam, g1, p.z0, p.z1));
      if (xl - p.x0 > 1.2) next.push({ ...p, id: `${p.id}a`, x1: xl });
      next.push({ ...p, id: `${p.id}g`, x0: Math.max(p.x0, xl), x1: Math.min(p.x1, Math.max(xr, xl + 0.5)), crown: null, kind: 'block', cap: g.floor[p.band] });
      if (p.x1 - xr > 1.2) next.push({ ...p, id: `${p.id}b`, x0: xr });
    }
    parts = next;
  }
  return parts;
}

/** a tower's tiers (each narrower and a little further back, standing on the one below) and the window grid of each */
export function tiersOf(t) {
  const f = FORMS[t.form] || FORMS.block;
  const out = [];
  let y = 0, x0 = t.x0, x1 = t.x1, z = t.z0;
  f.forEach(([hk, inset], i) => {
    const w0 = x1 - x0; x0 += w0 * inset; x1 -= w0 * inset;
    if (i) z += 1.3;
    const h = t.h * hk, w = x1 - x0;
    const g = i === 0 && t.pu ? { ...grid(w, h, t.pu, t.pv, 1.2), u0: (w - t.cols * t.pu) / 2, cols: t.cols } : grid(w, h, PITCH[0], t.rank === 'modern' ? 2.4 : PITCH[1], i ? 0.5 : 0.9);
    out.push({ x0, x1, z0: z, z1: z + (t.z1 - t.z0), y0: y, h, win: g, crown: i === f.length - 1 ? t.crown : null });
    y += h;
  });
  return out;
}

/**
 * The skyline before the squeeze: the corridors (screen), the bands (clipped at them), the towers (by hand; a wide screen adds
 * a panorama of them further out), the hero blocks on the quay. Pure; the same on every upright phone (in world units).
 */
function skylineOf(cam, seed) {
  const wide = cam.spread > 1.6, hUnit = cam.F / REF.F;
  const span = z => cam.hw(z) * 1.1 + 6;
  // the towers: the composition's centre group, and on a panorama more of them further out (each side, never mirrored
  // exactly: forms, heights and depths vary), with their own corridors between them
  const towers = TOWERS.map(t => {
    const w = t.cols ? t.cols * t.pu + 1.2 : t.w, x = fxAt(t.f, t.z);
    return { ...t, x0: x - w / 2, x1: x + w / 2, z0: t.z, z1: t.z + DEPTH, kind: t.rank === 'modern' ? 'modern' : 'landmark' };
  });
  const gapsW = [];
  if (wide) {
    const r = rngFrom(seed + 313), forms = [['stepped', 'stepped', 'pyramid'], ['needle', 'needle', 'spire'], ['empire', 'empire', 'mast'], ['dome', 'dome', 'dome'], ['deco', 'deco', 'deco'], ['sunburst', 'stepped', 'stepped']];
    for (const sgn of [-1, 1]) {
      let x = 108, i = 0;
      while (true) {
        const z = 262 + r() * 40, w = 9 + r() * 6;
        if (x + w > cam.hw(z) * 1.02) break;
        const [form, , ct] = forms[(i + (sgn > 0 ? 2 : 0)) % forms.length];
        const glass = i % 4 === 3;
        const id = `pano-${sgn > 0 ? 'r' : 'l'}${i}`;
        const tz = glass ? 480 + r() * 60 : z, tw = glass ? 12 : w, xx = sgn * (x + w / 2) * tz / z;
        towers.push({ id, x0: xx - tw / 2, x1: xx + tw / 2, z0: tz, z1: tz + DEPTH, h: glass ? 118 + r() * 24 : 58 + r() * 24, w: tw,
          mat: glass ? 'glass' : MATS_FAR[i % MATS_FAR.length], form: glass ? 'modern' : form, crown: glass ? { t: 'slant', h: 10 } : { t: ct, h: 8 + r() * 8 }, rank: glass ? 'modern' : 'pano', kind: glass ? 'modern' : 'landmark' });
        x += w + 18 + r() * 22; i++;
      }
    }
    // the panorama's own corridors: on screen, midway between neighbouring towers where there is room (side faces included)
    const sp = towers.filter(t => t.rank === 'pano' || t.id.startsWith('pano')).concat(towers.filter(t => !t.id.startsWith('pano')))
      .map(t => spanOf(cam, t.x0, t.x1, t.z0, t.z1)).sort((a, b) => a[0] - b[0]);
    const gw = Math.max(2.5, 8 * hUnit);
    for (let j = 1; j < sp.length; j++) {
      const free0 = Math.max(...sp.slice(0, j).map(v => v[1])), free1 = sp[j][0];
      const mid = (free0 + free1) / 2;
      if (free1 - free0 >= gw + 2 * GAP_PAD + 3 && Math.abs(mid - cam.VPX) > cam.F * FX * 0.5 * 1.02) gapsW.push({ sx: mid, w: gw });
    }
  }
  const cuts = [...SUN_GAPS.map(g => ({ sx: cam.VPX + cam.F * fxAt(g.f, 270) / 270, w: Math.max(2.5, g.w * hUnit) })), ...gapsW]
    .map(g => ({ ...g, floor: FLOOR }));
  // the bands, far → near: the haze, the far band, the mid band, the near band (the dense base along the far quay)
  const bands = [
    { id: 'haze', seed: seed + 7, z: Z.haze[0], dz: 200, w: [9, 20], h: [52, 96], gap: 1.5, towerP: 0.3 },
    { id: 'far', seed: seed + 41, z: Z.far[0], dz: 180, w: [6, 14], h: [44, 80], gap: 2, towerP: 0.32 },
    { id: 'mid', seed: seed + 53, z: Z.mid[0], dz: 60, w: [7, 12], h: [26, 46], gap: 3, towerP: 0.16 },
    { id: 'near', seed: seed + 43, z: Z.near[0], dz: 18, w: [5, 10], h: [20, 34], gap: -0.6, towerP: 0.06, flat: true },   // packed: the base is one wall (neighbours overlap a little: no slits)
  ].map(o => ({ id: o.id, blocks: band(cam, { ...o, x0: -span(o.z + o.dz), x1: span(o.z + o.dz) }, cuts) }));
  const heroes = HEROES.map(b => ({ ...b, kind: 'hero', seed: hashString(`hero|${b.id}`) }));
  for (const t of towers) t.seed = hashString(`tower|${t.id}`);
  return { bands, towers, heroes, cuts, all: [...bands.flatMap(b => b.blocks), ...towers, ...heroes] };
}

/** the lighthouse's parts as world boxes (x0, x1, y0, y1 at its z): the tapered tower (its widest, at the foot), the gallery,
 *  the lantern, the dome — what may cover a word face, the screen checks, the drawing (lighthouse.js) */
export function lighthouseBoxes(l) {
  const g = l.gallery || l.r1 + 1;
  return [
    // the tapered tower in four slices (each as wide as its foot)
    ...[0, 0.25, 0.5, 0.75].map(f => { const r = l.r0 + (l.r1 - l.r0) * f; return { id: `tower${f}`, x0: l.x - r, x1: l.x + r, y0: l.h * f, y1: l.h * (f + 0.25), z0: l.z }; }),
    { id: 'gallery', x0: l.x - g, x1: l.x + g, y0: l.h, y1: l.h + 0.45, z0: l.z },
    { id: 'lantern', x0: l.x - l.r1 * 0.7, x1: l.x + l.r1 * 0.7, y0: l.h + 0.45, y1: l.h + 3.4, z0: l.z },
    { id: 'dome', x0: l.x - l.r1, x1: l.x + l.r1, y0: l.h + 3.4, y1: l.h + 5.1, z0: l.z },
  ];
}

/** The whole layout for a camera: every piece at its final position and size (world units), plus screen-space checks. */
export function harborLayout(cam, seed = 1924, opts = {}) {
  const sky = skylineOf(cam, seed);
  // the squeeze: on an upright phone the reference phone's (so every phone shows the same skyline — a roomier one keeps more
  // sky above it), never past this screen's own limit; a wide screen fits its own
  const top = b => (b.h + (b.crown ? b.crown.h : 0));
  const sqLoc = squeeze(cam, Math.min(...sky.all.map(b => project(cam, 0, top(b), b.z0)[1])));
  let sqRef = null;
  if (!cam.wide) {
    const rc = cameraFor(REF_TITLE.W, REF_TITLE.H, { tag: REF_TITLE.tag, dock: REF_TITLE.dock }, REF_TITLE.safe), rs = skylineOf(rc, seed);
    sqRef = squeeze(rc, Math.min(...rs.all.map(b => project(rc, 0, top(b), b.z0)[1])));
  }
  const sq = (h, z) => (sqRef ? Math.min(sqRef(h, z), sqLoc(h, z)) : sqLoc(h, z));
  for (const b of sky.all) {
    const t0 = top(b), t1 = sq(t0, b.z0), r = t1 / t0;
    b.h *= r; if (b.crown) b.crown = { ...b.crown, h: b.crown.h * r }; if (b.needle) b.needle *= r;
    b.squeeze = r;
  }
  const hUnit = cam.F / REF.F, HZq = groundY(cam, Z.quay);
  const hAtY = (y, z) => cam.CAMH - (y - cam.VPY) * z / cam.F;           // the height whose top lands on screen y at depth z
  // the corridors' floors: a piece in a corridor is lowered to its band's floor
  for (const b of sky.all) if (b.cap != null) b.h = Math.min(b.h, Math.max(2, hAtY(HZq - b.cap * hUnit, b.z0)));
  // the towers' tiers + window grids (after the squeeze); every block gets its grid
  for (const t of sky.towers) t.tiers = tiersOf(t);
  for (const b of [...sky.bands.flatMap(d => d.blocks), ...sky.heroes]) b.win = grid(b.x1 - b.x0, b.h, PITCH[0], PITCH[1], b.kind === 'hero' ? 2.2 : 0.9);
  const k = Math.max(1, Math.min(2.2, cam.spread * 0.5));           // the harbor pieces spread out on a panorama
  // THE LIGHTHOUSE (Part 3: moved for the word towers, the owner's review): on a phone it stands in the slot between the two
  // horizontal word towers (in front of the sunset corridor, its gallery between their faces) — both faces fully on screen and
  // uncovered; a wide screen keeps it out to the right (46 · k)
  const lighthouse = { x: cam.wide ? 46 * k : fxAt(0.8502, 150), z: 150, h: 26, r0: 2.4, r1: 1.7, gallery: 2.3 };
  // the word towers' faces stay clear: anything nearer in front of one stands below its word rows (the hero blocks, the
  // lighthouse's tower + gallery + lantern)
  const lhBoxes = lighthouseBoxes(lighthouse);
  for (const t of sky.towers.filter(t => t.word)) {
    const tr = t.tiers[0], g = tr.win;
    const [s0, s1] = spanOf(cam, tr.x0, tr.x1, tr.z0, tr.z1);
    // the hero blocks on the quay stay as they are (their signs: Part 3): the face's rows start above them
    let cover = 1e9;
    for (const b of sky.heroes) { const [b0, b1] = spanOf(cam, b.x0, b.x1, b.z0, b.z1); if (b1 > s0 + 1 && b0 < s1 - 1) cover = Math.min(cover, project(cam, 0, b.h, b.z0)[1]); }
    // (against the face itself — its front; the lighthouse may stand in front of a word tower's side face)
    const f0 = project(cam, tr.x0, 0, tr.z0)[0], f1 = project(cam, tr.x1, 0, tr.z0)[0];
    for (const b of lhBoxes) { const b0 = project(cam, b.x0, 0, b.z0)[0], b1 = project(cam, b.x1, 0, b.z0)[0]; if (b1 > f0 + 1 && b0 < f1 - 1) cover = Math.min(cover, project(cam, 0, b.y1, b.z0)[1]); }
    const rowY = r => project(cam, 0, tr.y0 + g.v0 + r * g.pitch[1] - 0.3, tr.z0)[1];
    let r0 = Math.max(0, g.rows - t.rows);
    while (r0 < g.rows && rowY(r0) > cover - 1) r0++;
    const yFace = rowY(r0);
    t.face = { row0: r0, rows: g.rows - r0, y: yFace };
    for (const b of [...sky.bands.flatMap(d => d.blocks), ...sky.towers]) {
      if (b === t || b.z0 >= tr.z0) continue;
      const [b0, b1] = spanOf(cam, b.x0, b.x1, b.z0, b.z1);
      if (b1 <= s0 + 1 || b0 >= s1 - 1) continue;
      const hMax = hAtY(yFace + 1, b.z0);
      if (top(b) > hMax) { b.h = Math.min(b.h, hMax); b.crown = null; if (b.win) b.win = grid(b.x1 - b.x0, b.h); if (b.tiers) b.tiers = tiersOf(b); }
    }
  }
  const { bands, towers, heroes } = sky;
  const landmarks = towers;          // (the Part 1 name: the hand-placed towers)
  // ---- the far bank and the quay, the water
  const quay = { z: Z.quay, top: 0.4, foot: -1.2 };
  const water = { z0: Z.rail, z1: Z.quay };
  // ---- the near STAGE. The speakeasy bleeds off the left edge (28 pt past it at the reference scale); everything on the
  // phone's stage keeps its place relative to the speakeasy's right face; a panorama repeats the promenade to the right edge.
  // PART 7a — THE SPEAKEASY (core/harbor-speakeasy.js: the facade's heights, the rooms, the weekly ghost ad): the same box on screen
  // as Part 1's; its SIDE WALL runs straight back to z 60 (8a: the corner-turn preview is gone — the owner picked the blade sign).
  // The ground floor: the barbershop's window (shop.win) + its door + the pole, the unmarked side door (door: the knock's target),
  // the basement window in the plinth; the awning over the shop; the upper windows (windows × rows) are the rooms' (ROOMS).
  const sz0 = 44, sx0 = xAt(cam, -28 * cam.F / REF.F, sz0), sx1 = sx0 + 11.2;
  const side = { x: sx1, z: 60 };
  const speakeasy = { x0: sx0, x1: sx1, z0: sz0, z1: 60, h: 10.5, turned: false, side,
    door: { u0: 9.05, u1: 10.55, h: 2.6 }, awning: { u0: 2.0, u1: 8.1, y0: 3.8, y1: 3.42, z: 43.15 },
    // (8P — the shop window WIDENED a little, 4.22 → 4.6 units, for THE HUSH WORD SIGN's 14 pt letters on a 390 phone: the door + the
    // pole stepped out to make room; core/harbor-hush.js)
    shop: { win: [3.3, 7.9, 0.78, 3.12], door: [2.14, 3.06, 3.12], pole: { u: 8.42, v0: 1.15, v1: 3.2 }, basement: [4.3, 7.1, 0.1, 0.47], sconce: { u: 9.8, v: 3.05 } },
    windows: [[1.0, 2.9], [4.2, 6.1], [7.4, 9.3]], rows: SPEAK_V.rows.map(r => [...r]), top: SPEAK_V.crest };
  // ---- the pier + the Ferris wheel, the breakwater + the lighthouse + the keeper's cottage (right, in open water).
  // THE WHEEL STANDS ON ITS PIER OVER WATER (the owner's review, Oct 21 2026): the speakeasy hides the harbor left of its
  // roof's back corner, so the wheel stands right of it — its A-frame legs ≥ 12 pt clear of the speakeasy — and nearer than
  // Part 1's (z 132), so its deck is ~10 pt BELOW the speakeasy's roofline, never level with it (tested at every size).
  // Clear of the word towers and the hero towers' crowns; it may cover the low skyline behind it.
  const wz = 132, wr = 12.6, legK = 0.42;
  const speakBack = project(cam, speakeasy.x1, 0, speakeasy.z1)[0];
  const wheelX = Math.max((cam.wide ? -30 : -24) * k * wz / 165, xAt(cam, speakBack + 12 + legK * cam.F * wr / wz, wz));
  // (Part 5) the wheel's two A-frames stand in front of and behind it (± 1.7), 16 gondolas; THE PIER widens into a platform
  // under it (the HEAD: the A-frames' feet at ± leg · r stand on its deck, 1.4 units in from its edges) — the walkway behind
  // it runs on to the quay
  const wheel = { x: wheelX, y: wr + 5.4, z: wz, r: wr, leg: legK, frame: 1.7, cars: 16 };
  const headHalf = legK * wr + 1.4;
  const pier = { x0: wheelX - 3.2, x1: wheelX + 3.6, z0: 118, z1: Z.quay, y: 2.4, head: { x0: wheelX - headHalf, x1: wheelX + headHalf, z0: wz - 6, z1: wz + 6 } };
  const breakwater = { x0: lighthouse.x - 20, x1: lighthouse.x + 34, z: 150, h: 1.6 };
  const cottage = { x: lighthouse.x + 3.4, z: 150, w: 5, h: 4.6, roof: 6.6 };
  // ---- the boats (the riverboat "Rosie" with her bulbs, a water taxi, a tug at night, sailboats by day), re-spaced around
  // the wheel's pier so the harbor stays open: Rosie right of the pier, the taxi out front on the right, the far boats small
  const bx = (f, z) => (cam.wide ? fxAt(0.5 + (f - 0.5) * 1.1, z) * Math.min(k, 1.6) : fxAt(f, z));
  const boats = [
    { id: 'rosie', x: bx(0.73, 142), z: 142, len: 24, h: 10, dir: -1 },
    { id: 'taxi', x: bx(0.88, 94), z: 94, len: 6, h: 2.2, dir: 1 },
    { id: 'tug', x: bx(0.585, 214), z: 214, len: 9.5, h: 5.2, dir: 1, when: 'night' },
    { id: 'sail', x: bx(0.585, 214), z: 214, len: 6.5, h: 10, dir: 1, when: 'day' },
    { id: 'sail2', x: bx(0.92, 205), z: 205, len: 6.5, h: 10, dir: -1, when: 'day' },
    // (8b1 — THE HARBOR'S TIMETABLE: a Great Lakes fishing tug — out at dawn with a bow lantern, back late afternoon; moored by the pier)
    { id: 'fish', x: bx(0.62, 232), z: 232, len: 8, h: 4.6, dir: 1 },
  ];
  const face = speakeasy.x1, rel = dx => face + dx;            // the phone's stage, relative to the face (−5.6 on the phone)
  const rail = { z: Z.rail, y: 1.1 };
  const road = { z0: Z.road[0], z1: Z.road[1], lane: Z.lane };
  const stopH = units('stopLight');
  // PART 8a — THE PROMENADE (core/harbor-promenade.js: the bands, the lamps, the trees, the bench, the cart, the planters, the
  // medallion, the crosswalk, the implied road, the walkable zones; no flagpole — the owner: flags only on holidays).
  const PR = promenadeLayout(cam, { seed, wide: cam.spread > 1.6, stopH, front: cam.wide, face });
  const signals = PR.signals;
  const prom = { z0: Z.prom[0], z1: Z.prom[1] };
  const { lamps, trees, bench, planters, cart, medallion, crosswalk, edge, impliedRoad, zones, mailbox, trashCan } = PR;   // (8b1: trashCan — the trash collector's can)
  // the rooftop (7a): the string lights' POSTS on the parapet (each pier) + their tall POLE at the back, the stair BULKHEAD, the
  // CHIMNEY; the deck between them is left open for 7b's parties + the seasonal garden (planters: where its beds go)
  const roofBack = Math.min(side.z, 56);
  const roof = { planters: [4.4, 5.8, 7.2].map(u => ({ x: sx0 + u, z: 47.2 })), pole: { x: sx1 - 1.4, z: roofBack - 3.2, h: 2.9 },
    posts: [3.55, 6.75, 9.95, 11.2].map(u => sx0 + u), bulkhead: { x0: sx0 + 8.1, x1: sx0 + 9.9, z0: roofBack - 4.6, z1: roofBack - 1.8, h: 2.1 },
    chimney: { x: sx0 + 10.5, z: roofBack - 2.2, w: 0.75, h: 1.9 } };
  // (FP: the bulkhead + the chimney moved right, out from under the billboard — its short frame reads as one clean structure)
  // THE BILLBOARD on the roof (8a): its board in world units + the dunnage platform under the frame (core/harbor-neon.js: the spot)
  { const B = BILLBOARD, y0 = B.dun + B.open;
    roof.board = { x0: sx0 + B.u0, x1: sx0 + B.u1, y0, y1: y0 + B.h, z: roofBack - B.back, dun: B.dun, deck: speakeasy.h }; }
  const L = { cam, seed, bands, landmarks, heroes, quay, water, pier, wheel, lighthouse, breakwater, cottage, boats, rail, road, signals, prom, lamps, trees, bench, planters, cart, speakeasy, roof, medallion, mailbox, trashCan, crosswalk, edge, impliedRoad, zones, towers, cuts: sky.cuts, gaps: sky.cuts.map(g => ({ sx: g.sx, w: g.w })), squeeze: (sqRef || sqLoc).s, knee: (sqRef || sqLoc).knee };
  L.door = doorRect(L);
  L.lanes = laneRects(L);
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
  for (const bd of L.bands) for (const b of bd.blocks) out.push({ ...box(`${bd.id}`, 'sky', b.x0, b.x1, 0, b.h + (b.crown ? b.crown.h : 0), b.z0), rank: 'band' });
  // a tower: each tier (the crown on the top one), so the roofline follows its setbacks
  for (const t of L.towers) for (const tr of t.tiers) out.push({ ...box(t.id, 'sky', tr.x0, tr.x1, 0, tr.y0 + tr.h + (tr.crown ? tr.crown.h : 0), tr.z0), rank: t.rank });
  for (const b of L.heroes) out.push({ ...box(b.id, 'sky', b.x0, b.x1, 0, b.h, b.z0), rank: 'quay' });
  for (const bt of L.boats) out.push(box(`boat:${bt.id}`, 'alive', bt.x - bt.len / 2, bt.x + bt.len / 2, 0, bt.h, bt.z));
  if (L.cart.shown !== false) out.push(box('cart', 'alive', L.cart.x - 1.2, L.cart.x + 1.2, 0, 3.5, L.cart.z));
  for (const l of L.lamps) out.push(box('lamp', 'still', l.x - 0.3, l.x + 0.3, 0, l.h, l.z));
  for (const s of L.signals) out.push(box(`signal:${s.id}`, 'still', s.x - 0.3, s.x + 0.3, 0, s.h, s.z));
  return out;
}
/** the roofline: the highest roof (crowns included) over every 4 pt of the width — the planes keep above it. only(box) picks
 *  what counts: the sun's arch fits to the BASE's roofline (the bands + the quay), so the sun may pass behind the towers */
export function roofline(L, only = null) {
  const c = L.cam, HZ = Math.round(groundY(c, Z.quay));
  const out = new Float32Array(Math.ceil(c.W / 4) + 1).fill(HZ);
  for (const b of screenBoxes(L)) if (b.kind === 'sky' && (!only || only(b))) {
    const a = Math.max(0, Math.floor(b.x / 4)), e = Math.min(out.length - 1, Math.ceil((b.x + b.w) / 4));
    for (let i = a; i <= e; i++) if (b.y < out[i]) out[i] = b.y;
  }
  return out;
}

/** each lane's minimum height (pt) — what has to fit: a banner plane up high, a flock / a balloon low, a parade float */
export const LANE_MIN = { 'sky-high': 40, 'sky-low': 24, skyline: 60, water: 40, road: 24, promenade: 36, windows: 20, rooftop: 12, tagline: 12 };
/** a lane's minimum on this camera: the sky's in screen pt, the world's lanes scale with the city (a phone sideways: smaller) */
export const laneMin = (cam, id) => LANE_MIN[id] * (id.startsWith('sky-') ? 1 : Math.min(1, cam.F / REF.F));
const PAD = 4;   // a lane keeps this far from the sign's rects and the corner buttons

/**
 * THE LANES as places: a screen rect (pt) per lane, where its events draw. Re-computed when the sign moves (cheap; no bake).
 *   sky-high   safe top .. the neon's top, left of the corner buttons (the banner plane's strip)
 *   sky-low    the tagline's bottom .. the roofline's median (things here pass BEHIND the taller roofs); City 2.0 fades the
 *              tagline out ~15 s in (cam.tagGone): then from the word's bottom (`y0NoTag`) — the freed band joins the lane
 *   tagline    the tagline's own band (+ 3 pt): THE TAGLINE SLOT — later parts bring a line back there briefly (holidays, the
 *              countdown); its events claim this lane
 *   skyline    the skyline limit .. the far quay
 *   water      the tallest boat's top .. the railing
 *   road       a bus's top on the far lane .. the road's near kerb
 *   promenade  a two-person float's top at the far edge .. the dock's top (never under the dock)
 *   windows / rooftop   the speakeasy's upper front face (its windows) and the space over its roof (clipped to the screen)
 */
export function laneRects(L) {
  const c = L.cam, W = c.W, P = (x, y, z) => project(c, x, y, z), yOf = (y, z) => P(0, y, z)[1];
  const rect = (y0, y1, x0 = 0, x1 = W) => {
    x0 = Math.max(0, x0); x1 = Math.min(W, x1);
    const r = { x: x0, y: y0, w: Math.max(0, x1 - x0), h: Math.max(0, y1 - y0) };
    // the corner buttons: a lane that would reach them stops short on the left
    if (c.corner && r.y < c.corner.y + c.corner.h + PAD && r.y + r.h > c.corner.y - PAD && r.x + r.w > c.corner.x - PAD) r.w = Math.max(0, c.corner.x - PAD - r.x);
    // (7a §0 — SPLIT CORNERS: the ☰ in the top-left corner on the title: a lane that would reach it starts right of it)
    const cl = c.cornerL;
    if (cl && r.y < cl.y + cl.h + PAD && r.y + r.h > cl.y - PAD && r.x < cl.x + cl.w + PAD) { const x0 = cl.x + cl.w + PAD; r.w = Math.max(0, r.x + r.w - x0); r.x = x0; }
    return r;
  };
  const roof = Array.from(roofline(L)).sort((a, b) => a - b), roofMed = roof[roof.length >> 1];
  const tagB = c.tag.y + c.tag.h, wordB = c.word ? c.word.y + c.word.h : tagB;
  const s = L.speakeasy, [wx0, wy0] = P(s.x0, s.h, s.z0), [wx1, wy1] = P(s.x1, 3.9, s.z0);
  const tallBoat = Math.min(...L.boats.map(b => yOf(b.h, b.z)));
  const personPt = ptAt(c, units('person'), Z.ref);
  const lanes = {
    'sky-high': rect(c.safeTop + PAD, c.neon.y - PAD),
    'sky-low': { ...rect((c.tagGone ? wordB : tagB) + PAD, roofMed), y0NoTag: wordB + PAD },
    tagline: rect(c.tag.y - 3, tagB + 3, c.tag.x != null ? c.tag.x - 6 : 0, c.tag.x != null ? c.tag.x + c.tag.w + 6 : W),
    skyline: rect(c.limitY, groundY(c, Z.quay)),
    water: rect(tallBoat, groundY(c, Z.rail)),
    road: rect(yOf(BUS_H(), Z.road[1]), groundY(c, Z.road[0])),
    promenade: rect(Math.min(yOf(units('person') * 2.2, Z.prom[1]), c.dock.y - 2 * personPt), c.dock.y),
    windows: rect(wy0, wy1, wx0, wx1),
    rooftop: rect(yOf(s.h + 4.6, s.z0 + 2), yOf(s.h, s.z0), wx0, wx1),
  };
  return lanes;
}

