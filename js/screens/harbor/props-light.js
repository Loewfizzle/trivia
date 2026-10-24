// CITY 2.0 — THE HARBOR: THE PROPS' LIGHT MODEL + FRAME (FP3a, FREV A1 H6 — split out of props.js: shared by the bench + the cart +
// the inlay (props.js), the dormant planters + the mailbox (props-garden.js), the test obelisk (props-test.js) and the holiday parts'
// centrepieces (PROP_KIT)). How they're drawn: props.js's header. The lamps' light on a face: core/harbor-light.js#lampOn.
import { rgb, mix } from './shapes.js';
import { lampOn } from '../../core/harbor-light.js';

export const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
export const FONT = px => `700 ${px}px "Chakra Petch", Orbitron, sans-serif`;
export const norm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const FRONT = [0, 0, -1], TOP = [0, 1, 0], LEFT = [-1, 0, 0], RIGHT = [1, 0, 0];
export const VIEW = norm([0, 0.3, -1]);

// ------------------------------------------------------------------ THE LIGHT
// (the lamps' light on a face — the nearest one, its colour + reach + height: core/harbor-light.js#lampOn, FACE)
/** the light on a prop standing at (wx, wz) for this look */
export function lightFor(T, ctx, wx, wz) {
  const day = T.day || 0, gold = T.gold || 0, night = T.night || 0, ov = T.ovc || 0;
  const sd = ov >= 0.5 ? 0 : T.sunDir || 0, el = Math.max(4, T.sunEl ?? 30) * Math.PI / 180;
  const hx = -sd * 0.9, hz = 0.35 + 0.4 * (1 - Math.abs(sd)), hl = Math.hypot(hx, hz);
  // (toward the sun: the reverse of the shadow's way — core/harbor-light.js#sunShadow)
  const L = norm([-hx / hl * Math.cos(el), Math.sin(el), -hz / hl * Math.cos(el)]);
  const lampK = ctx.lampK != null ? ctx.lampK : T.lamps != null ? T.lamps : night;
  const { lk, lcol, ld } = lampOn(ctx.lights, wx, wz, lampK);
  return { day, gold, night, ov, sd, L, lk, lcol, ld, lampK };
}
export const SKY_AMB = [212, 222, 246], SUN = [255, 242, 218], G_AMB = [236, 176, 170], G_SUN = [255, 170, 98], N_AMB = [58, 60, 104];
/** a surface of day colour c with normal n, lit for this look. gloss: a specular glint (brass, enamel, glass) */
export function lit(Lt, c, n, gloss = 0) {
  n = norm(n);
  const up = n[1], ds = Math.max(0, dot(n, Lt.L)), o = [0, 0, 0];
  const H = norm([Lt.L[0] + VIEW[0], Lt.L[1] + VIEW[1], Lt.L[2] + VIEW[2]]), sp = gloss ? gloss * Math.pow(Math.max(0, dot(n, H)), 22) : 0;
  if (Lt.day > 0) {
    const sk = 1 - Lt.ov * 0.8, amb = 0.5 + 0.16 * up + Lt.ov * 0.26, k = ds * 0.66 * sk;
    for (let i = 0; i < 3; i++) o[i] += Lt.day * (c[i] * (amb * SKY_AMB[i] + k * SUN[i]) / 255 + sp * sk * 230);
  }
  if (Lt.gold > 0) {
    const sk = 1 - Lt.ov * 0.7, amb = 0.5 + 0.34 * up, k = ds * 0.8 * sk;
    for (let i = 0; i < 3; i++) o[i] += Lt.gold * (c[i] * (amb * G_AMB[i] + k * G_SUN[i]) / 255 + sp * sk * G_SUN[i] * 0.9);
  }
  if (Lt.night > 0) {
    const dl = Math.max(0, dot(n, Lt.ld)), amb = 0.42 + 0.22 * Math.max(0, up);
    const Hl = gloss ? norm([Lt.ld[0] + VIEW[0], Lt.ld[1] + VIEW[1], Lt.ld[2] + VIEW[2]]) : null, spl = gloss ? gloss * Math.pow(Math.max(0, dot(n, Hl)), 18) : 0;
    const ow = Lt.own ? Lt.own.k : 0, oc = Lt.own ? Lt.own.col : N_AMB;
    // (FP: + the BOUNCE off the lit cobbles round a lamp — every face near a pool gets a soft fill of the lamp's colour, so a bench
    // with the lamp behind it reads as a bench, not a black cut-out)
    for (let i = 0; i < 3; i++) o[i] += Lt.night * (c[i] * amb * N_AMB[i] / 255 + 7 + 6 * up + Lt.lk * (c[i] * (dl * 1.25 + 0.34) * Lt.lcol[i] / 255 + dl * 0.1 * Lt.lcol[i] + spl * Lt.lcol[i] * 0.8) + ow * c[i] * oc[i] / 255);
  }
  return [Math.min(255, o[0]), Math.min(255, o[1]), Math.min(255, o[2])];
}
/** a light glint colour for thin edges (a lit rim / top line): the sun's by day, the lamp's at night */
export function rimCol(Lt, c, n) { return lit(Lt, mix(c, [255, 255, 255], 0.35), n, 0.4); }

// ------------------------------------------------------------------ THE FRAME (a prop's own little world)
/** the camera linearised at depth oz, depth exaggerated by e: P(x, y, d) → screen pt (x world, y up, d behind oz) */
export function frame(cam, oz, e) {
  const s = cam.F / oz;
  const P = (x, y, d = 0) => { const sx = cam.VPX + s * x, sy = cam.VPY + s * (cam.CAMH - y), k = d * e / oz; return [sx - (sx - cam.VPX) * k, sy - (sy - cam.VPY) * k]; };
  P.s = s; P.e = e; P.camh = cam.CAMH;
  return P;
}
export function fillPts(x, pts, col, a = 1) {
  x.beginPath(); pts.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.closePath();
  x.fillStyle = Array.isArray(col) ? rgb(col, a) : col; x.fill();   // (a colour [r, g, b], a css string or a gradient)
}
export function line(x, a, b, col, w, alpha = 1) { x.strokeStyle = rgb(col, alpha); x.lineWidth = w; x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); }
/** a lit box in a frame: { x0, x1, y0, y1, d0, d1 } (world x, height, depth); faces: what the camera sees */
export function pbox(x, P, Lt, c, b, { top = true, front = true, gloss = 0, rim = true } = {}) {
  const { x0, x1, y0, y1, d0, d1 } = b;
  if (x0 > 0) fillPts(x, [P(x0, y0, d0), P(x0, y1, d0), P(x0, y1, d1), P(x0, y0, d1)], lit(Lt, c, LEFT, gloss));
  if (x1 < 0) fillPts(x, [P(x1, y0, d0), P(x1, y1, d0), P(x1, y1, d1), P(x1, y0, d1)], lit(Lt, c, RIGHT, gloss));
  if (top && y1 < P.camh) fillPts(x, [P(x0, y1, d0), P(x1, y1, d0), P(x1, y1, d1), P(x0, y1, d1)], lit(Lt, c, TOP, gloss));
  if (front) fillPts(x, [P(x0, y0, d0), P(x1, y0, d0), P(x1, y1, d0), P(x0, y1, d0)], lit(Lt, c, FRONT, gloss));
  if (rim && top) line(x, P(x0, y1, d0), P(x1, y1, d0), rimCol(Lt, c, [0, 0.7, -0.7]), Math.max(0.35, P.s * 0.025), 0.75);
}
/** soft shapes (a shadow): the path drawn far off and its blurred shadow brought back (Safari-safe: no ctx.filter) */
export function soft(x, draw, col, a, blur) {
  const m = x.getTransform(), k = Math.hypot(m.a, m.b) || 1, FAR = 5000;
  x.save();
  x.shadowColor = rgb(col, a); x.shadowBlur = Math.max(0.5, blur * k); x.shadowOffsetX = FAR * k; x.shadowOffsetY = 0;
  x.translate(-FAR, 0); x.fillStyle = '#000'; x.beginPath(); draw(); x.fill();
  x.restore();
}
// the convex hull of a few points (monotone chain) — a box's shadow on the ground is the hull of its foot + its top, pushed
export function hull2(p) {
  const q = p.slice().sort((u, v) => u[0] - v[0] || u[1] - v[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const v of q) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], v) <= 0) lo.pop(); lo.push(v); }
  for (let i = q.length - 1; i >= 0; i--) { const v = q[i]; while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], v) <= 0) up.pop(); up.push(v); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
export const seedOf = (a, b) => Math.abs(Math.round(a * 97 + b * 31)) + 7;

/** the props' light model + frame for the holiday parts' centrepieces (11a–c): frame(cam, z, e) → P(x, y, d); lightFor(T, ctx, x, z)
 *  → Lt; lit(Lt, colour, normal, gloss) → [r, g, b]; rimCol; pbox (a lit box); fillPts; line; propShadow(x, cam, { x, z, shapes },
 *  'custom', T) — shapes: { e, boxes, contact } like shadowShapes' */
export const PROP_KIT = Object.freeze({ frame, lightFor, lit, rimCol, pbox, fillPts, line, norm });

