// CITY 2.0 — THE HARBOR, PF: THE CENTREPIECE SPOT's plan (PURE — tested in tests/harbor.test.mjs; drawn by screens/harbor/props.js
// #drawInlay + screens/harbor/centre.js). Three things live here:
//   THE INLAY  — the brick COMPASS ROSE laid flush in the setts where the medallion was (core/harbor-promenade.js#L.medallion: its
//                centre + its outer radius `ring`): a soldier-course border (bricks on end, radial), a buff header course inside it, the
//                red field in concentric stretcher courses, an 8-point star in two tones (buff + a dark brown-red, each point split
//                light / dark), a small buff centre in a ring of dark headers. North points AWAY from us (+z): the camera looks north.
//   THE RIG    — the event lighting: four small brass FLOOR SPOTS flush in the soldier course on the diagonals (between the star's
//                points), off + nearly invisible normally, switched on (warm, aimed up) while a centrepiece stands on the inlay.
//   THE STATE  — what harbor().centrepiece.set({ piece, h, rig, lights }) holds, cleaned (normCentre), its key, the rig's level now.

import { project } from './harbor-layout.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const fin = v => typeof v === 'number' && Number.isFinite(v);

/** the inlay's bands as fractions of its outer radius (the medallion's `ring`, 2.6 units) — the bricks EXAGGERATED ~2.5× like the
 *  setts (a course ~0.3 units deep, a brick ~0.58 long), so the pattern reads on a phone at a glance */
export const INLAY = Object.freeze({
  soldier: [0.83, 1],        // the border: bricks on end, laid radially (~0.44 deep)
  header: [0.76, 0.83],      // a buff course round the field (stretchers along the circle)
  field: [0.19, 0.76],       // the red field: concentric stretcher courses
  centre: [0.115, 0.19],     // the dark headers round the centre stone
  stone: 0.115,              // the buff centre
  course: 0.3,               // a field course's depth (world units)
  brick: 0.58,               // a field brick's length along its course
  soldierW: 0.25,            // a soldier brick's width along the circle
  star: { long: 0.76, short: 0.52, wl: 0.15, ws: 0.115 },   // the star: the cardinal + intercardinal points' reach + half-widths (× R)
});

/**
 * The inlay's bricks for a medallion m = { x, z, ring } (world units): { R, soldier: { r0, r1, n }, header: { r0, r1, n }, courses:
 * [{ r0, r1, n, off }], centre: { r0, r1, n }, stone, star: [{ a, len, w, cardinal, tones: [left, right] }] }. Every n a multiple
 * of 4 (the pattern stays symmetric across the compass); angles in radians, 0 = +x (east, right), π/2 = +z (north, away from us).
 */
export function inlayPlan(m) {
  const R = m.ring, I = INLAY, q4 = v => Math.max(4, Math.round(v / 4) * 4);
  const soldier = { r0: I.soldier[0] * R, r1: R, n: q4(2 * Math.PI * ((I.soldier[0] + 1) / 2) * R / I.soldierW) };
  const header = { r0: I.header[0] * R, r1: I.header[1] * R, n: q4(2 * Math.PI * ((I.header[0] + I.header[1]) / 2) * R / (I.brick * 0.9)) };
  const f0 = I.field[0] * R, f1 = I.field[1] * R, nc = Math.max(3, Math.round((f1 - f0) / I.course)), dc = (f1 - f0) / nc;
  const courses = [];
  for (let i = 0; i < nc; i++) { const r0 = f0 + i * dc, r1 = r0 + dc; courses.push({ r0, r1, n: q4(2 * Math.PI * (r0 + r1) / 2 / I.brick), off: i % 2 ? 0.5 : 0 }); }
  const centre = { r0: I.centre[0] * R, r1: I.centre[1] * R, n: 12 };
  const star = [];
  for (let i = 0; i < 8; i++) {
    const cardinal = i % 2 === 0, a = i * Math.PI / 4;
    // (the classic rose: each point split down its axis, one half light, one half dark — the long points buff on their
    // counter-clockwise half, the short ones the other way round, so the light runs round the star like a pinwheel)
    star.push({ a, cardinal, len: (cardinal ? I.star.long : I.star.short) * R, w: (cardinal ? I.star.wl : I.star.ws) * R, tones: cardinal ? ['buff', 'dark'] : ['dark', 'buff'] });
  }
  return { R, soldier, header, courses, centre, stone: I.stone * R, star };
}

/**
 * THE WEAR (0..1): where feet go, the bricks are polished smooth + a touch lighter (by day the sky's sheen, at night the lamps') —
 * the foot traffic crosses the floor left ↔ right and heads back to the crossing (+z) — dx, dz from the inlay's centre, R its radius
 */
export function wearAt(dx, dz, R) {
  const u = dx / R, v = dz / R;
  const across = Math.exp(-(((v + 0.08) / 0.42) ** 2));        // the line across the floor (a little on our side of the centre)
  const back = Math.exp(-(((u - 0.12) / 0.34) ** 2)) * (v > -0.2 ? 1 : 0.4);   // toward the crossing behind it
  const edge = clamp(1.15 - Math.hypot(u, v), 0, 1);             // (the border wears least — feet cut the corner)
  return clamp((0.75 * across + 0.45 * back) * (0.55 + 0.45 * edge), 0, 1);
}

// ------------------------------------------------------------------ THE RIG (the event lighting)
/** the floor spots: on the diagonals (between the star's points), in the soldier course's middle; their brass ring + dark lens
 *  (world units); the default warm white; how strong a spot's paving spot + halo are at k 1 */
export const RIG = Object.freeze({
  angles: [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4],
  at: (INLAY.soldier[0] + 1) / 2,   // (× R: the soldier course's middle)
  ring: 0.17, lens: 0.11,
  col: Object.freeze([255, 218, 168]),
});
/** the four spots for a medallion (world): { x, z, a, front (nearer us than the centre: drawn in front of a piece) } */
export function rigSpots(m) {
  const r = RIG.at * m.ring;
  return RIG.angles.map(a => ({ x: m.x + Math.cos(a) * r, z: m.z + Math.sin(a) * r, a, front: Math.sin(a) < 0 }));
}

/**
 * The centrepiece's state, cleaned (what harbor().centrepiece.set takes): { piece: fn | { draw, light? } | null, h (its height, world
 * units — ≤ the cap; the box + the generic up-light), rig: { on (default: on while a piece stands), col [r, g, b], k (0..2) },
 * lights: [{ x, y, z (world; x, z relative to the inlay's centre), col, r (its halo, world units), k, tw (twinkle Hz, 0 = steady),
 * ph (phase) }] (≤ MAX_LIGHTS) }. null / {} → nothing (the rig off).
 */
export const MAX_LIGHTS = 240;
export function normCentre(o, cap = Infinity) {
  if (!o || typeof o !== 'object') return null;
  const piece = typeof o.piece === 'function' || (o.piece && typeof o.piece.draw === 'function') ? o.piece : null;
  const rg = o.rig || {}, col = Array.isArray(rg.col) && rg.col.length === 3 && rg.col.every(fin) ? rg.col.map(v => clamp(Math.round(v), 0, 255)) : [...RIG.col];
  const rig = { on: rg.on != null ? !!rg.on : !!piece, col, k: fin(rg.k) ? clamp(rg.k, 0, 2) : 1 };
  const lights = (Array.isArray(o.lights) ? o.lights : []).filter(l => l && fin(l.x) && fin(l.y) && fin(l.z)).slice(0, MAX_LIGHTS).map(l => ({
    x: l.x, y: clamp(l.y, 0, cap), z: l.z,
    col: Array.isArray(l.col) && l.col.length === 3 && l.col.every(fin) ? l.col.map(v => clamp(Math.round(v), 0, 255)) : [255, 214, 150],
    r: fin(l.r) ? clamp(l.r, 0.03, 2) : 0.18, k: fin(l.k) ? clamp(l.k, 0, 2) : 1, tw: fin(l.tw) ? clamp(l.tw, 0, 8) : 0, ph: fin(l.ph) ? l.ph : 0,
  }));
  const h = clamp(fin(o.h) ? o.h : cap === Infinity ? 6 : cap, 0.5, cap === Infinity ? 1e3 : Math.max(0.5, cap));
  if (!piece && !rig.on && !lights.length) return null;
  return { piece, h, rig, lights };
}
/** the rig's level now (0..2): its k while on, × the lamps' ramp (it comes on with the street lamps — by day nothing shows) */
export const rigLevel = (st, lamps) => (st && st.rig && st.rig.on ? st.rig.k * clamp(+lamps || 0, 0, 1) : 0);
/** an ACTIVE event on the inlay (8b's rule: the cart stops short at L.cart.stopX, the walkers go round): a piece stands there */
export const centreActive = st => !!(st && st.piece);

/**
 * The piece's sprite box on screen (pt): wide enough for its foot + the inlay's ring + a little for its sun shadow / its arms,
 * tall enough for h units (+ its lights' halos): { x, y, w, h }.
 */
export function centreBox(cam, m, h) {
  const hw = Math.max(m.ring + 1.2, h * 0.5), [x0] = project(cam, m.x - hw, 0, m.z), [x1] = project(cam, m.x + hw, 0, m.z);
  const [, top] = project(cam, m.x, h + 0.8, m.z), [, foot] = project(cam, m.x, 0, m.z - m.ring - 0.6);
  const x = Math.floor(x0), y = Math.floor(top);
  return { x, y, w: Math.ceil(x1) - x, h: Math.ceil(foot) - y };
}

// 9c — THE CENTREPIECE's SHOW LIGHTING (screens/harbor/floods.js): two warm floods low on the inlay's rim. out / fwd: where they stand
// (beyond the piece's radius, ahead of its centre — × its radius), y: the lens's height; pool: the pool's radius (× the piece's); ease
// (s): how slowly they dim + come up; fill: the low fill they keep while the piece lights itself
export const FLOOD = Object.freeze({ out: 0.7, fwd: 0.75, y: 0.35, pool: 2.2, ease: 4, fill: 0.28 });
/** PURE: the floods' level — on with the street lamps (lamps 0..1: their ramp; by day 0), dimmed to a low fill as the piece lights itself
 *  (self 0..1: the carved ₿'s fire, a tree's lights) */
export function floodTarget(lamps, self = 0) {
  const l = Math.max(0, Math.min(1, lamps || 0)), sl = Math.max(0, Math.min(1, self || 0));
  return l * (1 - (1 - FLOOD.fill) * sl);
}
