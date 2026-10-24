// CITY 2.0 — THE HARBOR: THE TEST PIECE (FP3a, FREV A1 H6 — split out of props.js; loaded only for &force=centrepiece-test:
// screens/harbor/centre.js imports it lazily).
import { rgb, shade, mix } from './shapes.js';
import { rngFrom } from '../../core/rng.js';
import { propShadow } from './props.js';
import { rigSpots, RIG } from '../../core/harbor-centre.js';
import { FRONT, LEFT, RIGHT, TOP, clamp01, fillPts, frame, lightFor, line, lit, norm, rimCol, seedOf } from './props-light.js';

// ------------------------------------------------------------------ THE TEST PIECE (PF — &force=centrepiece-test)
// A tasteful placeholder for the centrepiece spot, to show the EVENT RIG at work: a granite OBELISK (~5.5 units) on a stepped
// plinth — two steps, a die with a bronze plaque under a cornice, the tapering shaft, a gilt bronze pyramidion. Drawn with the one
// light model (the sun / the nearest lamp); its LIGHT PASS (obeliskLight) paints only the rig's light landing on its faces: each
// face takes the up-light by how it faces the floor spots in front of it + how far up it is (brightest at the foot, gone near the
// top) — crisp, on the stone, never a haze.
const GRANITE = [190, 186, 178], BRONZE = [150, 108, 62], GILT_B = [218, 176, 92];
/** the obelisk's faces in its frame (the inlay's centre m; built once per draw): [{ q: [[u, y, d] × 4 | 3], n, c, gloss }] far → near */
function obeliskFaces(X) {
  const F = [], S = X > 0 ? -1 : 1, sideN = X > 0 ? LEFT : RIGHT;
  const box = (hw, y0, y1, hd, c = GRANITE, gloss = 0.1) => {
    const d0 = 1 - hd, d1 = 1 + hd;
    F.push({ q: [[S * hw, y0, d1], [S * hw, y0, d0], [S * hw, y1, d0], [S * hw, y1, d1]], n: sideN, c, gloss });
    F.push({ q: [[-hw, y1, d0], [hw, y1, d0], [hw, y1, d1], [-hw, y1, d1]], n: TOP, c, gloss });
    F.push({ q: [[-hw, y0, d0], [hw, y0, d0], [hw, y1, d0], [-hw, y1, d0]], n: FRONT, c, gloss });
  };
  box(1.0, 0, 0.28, 1.0); box(0.8, 0.28, 0.54, 0.8);
  box(0.66, 0.54, 0.66, 0.66); box(0.58, 0.66, 1.9, 0.58); box(0.68, 1.9, 2.04, 0.68); box(0.6, 2.04, 2.14, 0.6);
  // the shaft (tapering 0.42 → 0.27 half-width over 2.14 → 5.0) + the pyramidion (5.0 → 5.55)
  const b = 0.42, t = 0.27, y0 = 2.14, y1 = 5.0, ap = 5.55, tl = (b - t) / (y1 - y0);
  F.push({ q: [[S * b, y0, 1 + b], [S * b, y0, 1 - b], [S * t, y1, 1 - t], [S * t, y1, 1 + t]], n: norm([S, tl, 0]), c: GRANITE, gloss: 0.15 });
  F.push({ q: [[-b, y0, 1 - b], [b, y0, 1 - b], [t, y1, 1 - t], [-t, y1, 1 - t]], n: norm([0, tl, -1]), c: GRANITE, gloss: 0.15 });
  F.push({ q: [[S * t, y1, 1 + t], [S * t, y1, 1 - t], [0, ap, 1]], n: norm([S, 0.5, 0]), c: GILT_B, gloss: 1.2 });
  F.push({ q: [[-t, y1, 1 - t], [t, y1, 1 - t], [0, ap, 1]], n: norm([0, 0.5, -1]), c: GILT_B, gloss: 1.2 });
  return F;
}
const OB_E = 1.15;
/** THE TEST PIECE's art: drawn standing on the inlay (m = L.medallion), its sun shadow first */
export function drawObelisk(x, cam, m, T, ctx = {}) {
  const z0 = m.z - 1, P = frame(cam, z0, OB_E), s = P.s, X = m.x, Lt = lightFor(T, ctx, m.x, m.z), r = rngFrom(seedOf(m.x, m.z) + 23);
  propShadow(x, cam, { x: X, z: z0, shapes: OBELISK_SHADOW }, 'custom', T, ctx);
  for (const f of obeliskFaces(X)) {
    const pts = f.q.map(([u, y, d]) => P(X + u, y, d)), c = lit(Lt, f.c, f.n, f.gloss);
    fillPts(x, pts, c);
    // the granite's speckle on the big faces, a lit arris on each top's front edge
    if (f.c === GRANITE && f.q.length === 4) {
      const [a, b2, c2] = pts, n = Math.min(40, Math.round(Math.abs((b2[0] - a[0]) * (c2[1] - b2[1])) / 6));
      for (let i = 0; i < n; i++) { const u = r(), v = r(), p = [a[0] + (b2[0] - a[0]) * u + (pts[3][0] - a[0]) * v, a[1] + (b2[1] - a[1]) * u + (pts[3][1] - a[1]) * v]; x.fillStyle = rgb(shade(c, r() < 0.5 ? -0.18 : 0.12), 0.6); x.fillRect(p[0], p[1], Math.max(0.3, 0.03 * s), Math.max(0.3, 0.025 * s)); }
      if (f.n === TOP) line(x, pts[0], pts[1], rimCol(Lt, f.c, [0, 0.8, -0.6]), Math.max(0.3, 0.025 * s), 0.8);
    }
  }
  // the bronze plaque on the die's face (a raised border, its lines of letters), a wreath boss over it
  const fr = (u, y) => P(X + u, y, 1 - 0.58);
  { const a = fr(-0.34, 1.62), b2 = fr(0.34, 0.92);
    x.fillStyle = rgb(lit(Lt, shade(BRONZE, -0.25), FRONT, 0.6)); x.fillRect(a[0], a[1], b2[0] - a[0], b2[1] - a[1]);
    x.strokeStyle = rgb(lit(Lt, BRONZE, [0, 0.4, -1], 1)); x.lineWidth = Math.max(0.35, 0.03 * s); x.strokeRect(a[0] + 0.03 * s, a[1] + 0.03 * s, b2[0] - a[0] - 0.06 * s, b2[1] - a[1] - 0.06 * s);
    x.fillStyle = rgb(lit(Lt, shade(BRONZE, 0.25), FRONT, 0.8), 0.8);
    for (let i = 0; i < 5; i++) { const y = a[1] + (b2[1] - a[1]) * (0.22 + i * 0.14); x.fillRect(a[0] + (b2[0] - a[0]) * (0.2 + (i % 2) * 0.08), y, (b2[0] - a[0]) * (0.6 - (i % 2) * 0.16), Math.max(0.3, 0.02 * s)); }
    const w = fr(0, 1.75); x.strokeStyle = rgb(lit(Lt, BRONZE, FRONT, 1)); x.lineWidth = Math.max(0.35, 0.035 * s); x.beginPath(); x.ellipse(w[0], w[1], 0.11 * s, 0.075 * s, 0, 0, Math.PI * 2); x.stroke(); }
}
/** THE TEST PIECE's light pass: only the rig's light landing on its faces (black where none — added with 'lighter'). ctx.rig:
 *  { col, spots: [{ x, z, front }] } */
export function obeliskLight(x, cam, m, T, ctx = {}) {
  const z0 = m.z - 1, P = frame(cam, z0, OB_E), X = m.x, rig = ctx.rig || {}, col = rig.col || RIG.col, spots = (rig.spots || rigSpots(m)).filter(sp => sp.front);
  // the light a point (world u, y, d in the frame) with normal n takes from the spots in front: the spot's cone aims up at the
  // piece's middle; brightest low, gone by ~4.5 units up
  const at = (u, y, d, n) => {
    let k = 0;
    const wx = X + u, wz = z0 + d;
    for (const sp of spots) {
      const v = [sp.x - wx, -y, sp.z - wz], dl = Math.hypot(v[0], v[1], v[2]) || 1, L = [v[0] / dl, v[1] / dl, v[2] / dl];
      const face = Math.max(0, n[0] * L[0] + n[1] * L[1] + n[2] * L[2]);
      const aim = norm([m.x - sp.x, 2.2, m.z - sp.z]), c = -(L[0] * aim[0] + L[1] * aim[1] + L[2] * aim[2]);
      const cone = clamp01((c - 0.55) / 0.35);
      k += face * cone / (1 + (dl / 2.4) ** 2);
    }
    return k;
  };
  for (const f of obeliskFaces(X)) {
    const pts = f.q.map(([u, y, d]) => P(X + u, y, d));
    const ys = f.q.map(q => q[1]), y0 = Math.min(...ys), y1 = Math.max(...ys), mid = q => f.q.reduce((a, p) => a + p[q], 0) / f.q.length;
    const kb = at(mid(0), y0 + 0.02, mid(2), f.n), kt = at(mid(0), y1, mid(2), f.n), alb = f.c.map(v => v / 255);
    const cb = col.map((v, i) => Math.min(255, v * alb[i] * kb * 2.2)), ct = col.map((v, i) => Math.min(255, v * alb[i] * kt * 2.2));
    const ya = Math.max(...pts.map(p => p[1])), yb = Math.min(...pts.map(p => p[1]));
    const g = x.createLinearGradient(0, ya, 0, yb); g.addColorStop(0, rgb(cb)); g.addColorStop(1, rgb(ct));
    fillPts(x, pts, g);
  }
}
const OBELISK_SHADOW = { e: OB_E, boxes: [{ x0: -1, x1: 1, y0: 0, y1: 0.28, d0: 0, d1: 2 }, { x0: -0.8, x1: 0.8, y0: 0, y1: 0.54, d0: 0.2, d1: 1.8 }, { x0: -0.62, x1: 0.62, y0: 0, y1: 2.12, d0: 0.4, d1: 1.6 },
  { x0: -0.42, x1: 0.42, y0: 2.1, y1: 5.0, d0: 0.58, d1: 1.42 }, { x0: -0.12, x1: 0.12, y0: 5, y1: 5.5, d0: 0.88, d1: 1.12 }], contact: [{ x0: -1.05, x1: 1.05, d0: -0.03, d1: 2.05, a: 0.45 }] };
/** THE TEST PIECE for harbor().centrepiece (its height, its art + its light pass) */
export const TEST_PIECE = Object.freeze({ h: 5.6, piece: Object.freeze({ draw: drawObelisk, light: obeliskLight }) });
