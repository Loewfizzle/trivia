// CITY 2.0 — THE HARBOR, PART 8a: THE PROMENADE'S PROPS — the bench, the vendor cart, the stone flower planters (their flowers by
// the season), the centrepiece spot's INLAY (PF: a brick compass rose laid flush in the setts — the big seasonal pieces stand on
// it — with its event rig's floor spots), THE MAILBOX (PF: a 1920s olive-green pillar box), THE TEST PIECE (PF: an obelisk on a
// stepped plinth — &force=centrepiece-test). Baked into the stage (stage.js); their cast shadows on the cobbles by day (propShadow,
// drawn with the ground).
//
// HOW THEY'RE DRAWN — crafted like an illustration, every surface lit by ONE light model (lightFor + lit): a face's colour comes from
// its NORMAL — by day the sky's cool ambient + the real sun (its side T.sunDir, its height T.sunEl; the city's convention: the light
// comes from our side, so fronts are lit and shadows fall away from us — stage.js#sunShadow), warm amber at golden hour, a soft flat
// grey under an overcast deck; at night deep cool tones lifted by the NEAREST LAMP (ctx.lights; its brightness ctx.lampK): the faces
// turned toward it catch its colour (the tall street lamps a cool white, the globes warm) — never a black blob. Brass + glazed
// surfaces get a specular glint (the sun by day, the lamp at night).
// Each prop is built in its own little frame (frame(): world x + height y + depth d behind its front), the true perspective
// linearised at the prop's depth with the depth EXAGGERATED a little (e: 1.35–1.8) — the glance test: from this high camera a
// bench's seat would be a 2-pt sliver; a touch more of its top reads as a seat. The inlay is in the paving: true perspective.
import { project } from '../../core/harbor-layout.js';
import { rgb, shade, mix } from './shapes.js';
import { PIECE } from '../../core/harbor-promenade.js';
import { inlayPlan, wearAt, rigSpots, RIG } from '../../core/harbor-centre.js';
import { rngFrom } from '../../core/rng.js';
import { sunShadow } from './stage.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const FONT = px => `700 ${px}px "Chakra Petch", Orbitron, sans-serif`;
const norm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const FRONT = [0, 0, -1], TOP = [0, 1, 0], LEFT = [-1, 0, 0], RIGHT = [1, 0, 0];
const VIEW = norm([0, 0.3, -1]);

// ------------------------------------------------------------------ THE LIGHT
// the lamps' colours (stage.js#LIGHT, brighter: on a face, not a pool) + how far their light carries onto a prop (world units)
const LAMP_COL = { tall: [196, 212, 236], globe: [255, 190, 118] };
const LAMP_REACH = { tall: 14, globe: 12 };
const LAMP_Y = { tall: 5.8, globe: 3.9 };
/** the light on a prop standing at (wx, wz) for this look */
function lightFor(T, ctx, wx, wz) {
  const day = T.day || 0, gold = T.gold || 0, night = T.night || 0, ov = T.ovc || 0;
  const sd = ov >= 0.5 ? 0 : T.sunDir || 0, el = Math.max(4, T.sunEl ?? 30) * Math.PI / 180;
  const hx = -sd * 0.9, hz = 0.35 + 0.4 * (1 - Math.abs(sd)), hl = Math.hypot(hx, hz);
  // (toward the sun: the reverse of the shadow's way — stage.js#sunShadow)
  const L = norm([-hx / hl * Math.cos(el), Math.sin(el), -hz / hl * Math.cos(el)]);
  const lampK = ctx.lampK != null ? ctx.lampK : T.lamps != null ? T.lamps : night;
  let best = null, bd = 1e9;
  for (const l of ctx.lights || []) { const d = Math.hypot(l.x - wx, (l.z - wz) * 1.1); if (d < bd) { bd = d; best = l; } }
  const kind = best && best.kind === 'tall' ? 'tall' : 'globe';
  const lk = best ? lampK * Math.min(1, 1.35 * Math.pow(clamp01(1 - bd / LAMP_REACH[kind]), 1.1)) : 0;
  const ld = best ? norm([best.x - wx, LAMP_Y[kind] - 1, best.z - wz]) : [0, 1, 0];
  return { day, gold, night, ov, sd, L, lk, lcol: LAMP_COL[kind], ld, lampK };
}
const SKY_AMB = [212, 222, 246], SUN = [255, 242, 218], G_AMB = [236, 176, 170], G_SUN = [255, 170, 98], N_AMB = [58, 60, 104];
/** a surface of day colour c with normal n, lit for this look. gloss: a specular glint (brass, enamel, glass) */
function lit(Lt, c, n, gloss = 0) {
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
function rimCol(Lt, c, n) { return lit(Lt, mix(c, [255, 255, 255], 0.35), n, 0.4); }

// ------------------------------------------------------------------ THE FRAME (a prop's own little world)
/** the camera linearised at depth oz, depth exaggerated by e: P(x, y, d) → screen pt (x world, y up, d behind oz) */
function frame(cam, oz, e) {
  const s = cam.F / oz;
  const P = (x, y, d = 0) => { const sx = cam.VPX + s * x, sy = cam.VPY + s * (cam.CAMH - y), k = d * e / oz; return [sx - (sx - cam.VPX) * k, sy - (sy - cam.VPY) * k]; };
  P.s = s; P.e = e; P.camh = cam.CAMH;
  return P;
}
function fillPts(x, pts, col, a = 1) {
  x.beginPath(); pts.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.closePath();
  x.fillStyle = Array.isArray(col) ? rgb(col, a) : col; x.fill();   // (a colour [r, g, b], a css string or a gradient)
}
function line(x, a, b, col, w, alpha = 1) { x.strokeStyle = rgb(col, alpha); x.lineWidth = w; x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); }
/** a lit box in a frame: { x0, x1, y0, y1, d0, d1 } (world x, height, depth); faces: what the camera sees */
function pbox(x, P, Lt, c, b, { top = true, front = true, gloss = 0, rim = true } = {}) {
  const { x0, x1, y0, y1, d0, d1 } = b;
  if (x0 > 0) fillPts(x, [P(x0, y0, d0), P(x0, y1, d0), P(x0, y1, d1), P(x0, y0, d1)], lit(Lt, c, LEFT, gloss));
  if (x1 < 0) fillPts(x, [P(x1, y0, d0), P(x1, y1, d0), P(x1, y1, d1), P(x1, y0, d1)], lit(Lt, c, RIGHT, gloss));
  if (top && y1 < P.camh) fillPts(x, [P(x0, y1, d0), P(x1, y1, d0), P(x1, y1, d1), P(x0, y1, d1)], lit(Lt, c, TOP, gloss));
  if (front) fillPts(x, [P(x0, y0, d0), P(x1, y0, d0), P(x1, y1, d0), P(x0, y1, d0)], lit(Lt, c, FRONT, gloss));
  if (rim && top) line(x, P(x0, y1, d0), P(x1, y1, d0), rimCol(Lt, c, [0, 0.7, -0.7]), Math.max(0.35, P.s * 0.025), 0.75);
}
/** soft shapes (a shadow): the path drawn far off and its blurred shadow brought back (Safari-safe: no ctx.filter) */
function soft(x, draw, col, a, blur) {
  const m = x.getTransform(), k = Math.hypot(m.a, m.b) || 1, FAR = 5000;
  x.save();
  x.shadowColor = rgb(col, a); x.shadowBlur = Math.max(0.5, blur * k); x.shadowOffsetX = FAR * k; x.shadowOffsetY = 0;
  x.translate(-FAR, 0); x.fillStyle = '#000'; x.beginPath(); draw(); x.fill();
  x.restore();
}
// the convex hull of a few points (monotone chain) — a box's shadow on the ground is the hull of its foot + its top, pushed
function hull2(p) {
  const q = p.slice().sort((u, v) => u[0] - v[0] || u[1] - v[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const v of q) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], v) <= 0) lo.pop(); lo.push(v); }
  for (let i = q.length - 1; i >= 0; i--) { const v = q[i]; while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], v) <= 0) up.pop(); up.push(v); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
const seedOf = (a, b) => Math.abs(Math.round(a * 97 + b * 31)) + 7;

// ------------------------------------------------------------------ THE BENCH
// A 1920s park bench facing us (its back toward the road): painted cast-iron Deco ends (a scrolled foot turned out, a stepped knee,
// the armrest ending in a curl, the back post's stepped finial), a centre support, oak slats (the seat seen from above, three back
// slats leaning back with gaps that show the street behind), grain + a lit top edge on every slat, a small brass plaque.
const OAK = [158, 106, 62], IRON_B = [40, 52, 48], BRASS = [204, 160, 72];

/** ctx (every prop): { season, phase, lights: [{ x, z, kind }] (the lamps — the side facing one catches its light at night), lampK
 *  (0..1: the lamps' brightness in this look), snow, wet (Part 9) }. b: { x, z, w } (world; the bench faces us, its back toward
 *  the road) */
export function drawBench(x, cam, b, T, ctx = {}) {
  const P = frame(cam, b.z, 1.8), s = P.s, Lt = lightFor(T, ctx, b.x, b.z + 0.4), hw = b.w / 2, X = b.x;
  const r = rngFrom(seedOf(b.x, b.z));
  const ends = [X - hw + 0.2, X + hw - 0.2], lw = v => Math.max(0.45, v * s);
  x.save(); x.lineCap = 'round'; x.lineJoin = 'round';
  const iron = n => lit(Lt, IRON_B, n, 0.5), ironHi = rimCol(Lt, IRON_B, [Lt.sd >= 0 ? 0.6 : -0.6, 0.5, -0.6]);
  // 1. the back posts (behind the slats): from the ground at the back up past the top slat, a stepped Deco finial
  const back = t => [0.7 + 0.18 * t, 0.7 + 0.62 * t];          // the back's plane: t 0..1 → (d, y)
  for (const u of [...ends, X]) {
    const [d0] = back(0), [d1, y1] = back(1);
    const a = P(u, 0, 0.74), m = P(u, 0.62, d0), t = P(u, y1 + 0.08, d1 + 0.02);
    x.strokeStyle = rgb(iron(FRONT)); x.lineWidth = lw(u === X ? 0.08 : 0.11);
    x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(m[0], m[1]); x.lineTo(t[0], t[1]); x.stroke();
    if (u !== X) {   // the finial: two small steps + a ball
      const f = P(u, y1 + 0.1, d1 + 0.02);
      fillPts(x, [[f[0] - 0.09 * s, f[1]], [f[0] + 0.09 * s, f[1]], [f[0] + 0.09 * s, f[1] - 0.05 * s], [f[0] - 0.09 * s, f[1] - 0.05 * s]], iron(TOP));
      fillPts(x, [[f[0] - 0.055 * s, f[1] - 0.05 * s], [f[0] + 0.055 * s, f[1] - 0.05 * s], [f[0] + 0.055 * s, f[1] - 0.1 * s], [f[0] - 0.055 * s, f[1] - 0.1 * s]], iron(FRONT));
      x.fillStyle = rgb(iron([0, 0.6, -0.8])); x.beginPath(); x.arc(f[0], f[1] - 0.15 * s, 0.055 * s, 0, Math.PI * 2); x.fill();
      x.fillStyle = rgb(ironHi, 0.8); x.beginPath(); x.arc(f[0] + (Lt.sd >= 0 ? 0.02 : -0.02) * s, f[1] - 0.17 * s, 0.022 * s, 0, Math.PI * 2); x.fill();
    }
  }
  // 2. the back slats: three oak boards on the leaning back (the gaps show the street), grain, a lit top edge
  const nb = norm([0, 0.3, -0.95]);
  for (let i = 0; i < 3; i++) {
    const t0 = 0.12 + i * 0.3, t1 = t0 + 0.22, [da, ya] = back(t0), [db, yb] = back(t1);
    const c = shade(OAK, (r() - 0.5) * 0.12), x0 = X - hw + 0.04, x1 = X + hw - 0.04;
    const q = [P(x0, ya, da), P(x1, ya, da), P(x1, yb, db), P(x0, yb, db)];
    fillPts(x, q, lit(Lt, c, nb));
    grain(x, P, Lt, c, nb, x0, x1, (u, f) => { const [d, y] = back(t0 + (t1 - t0) * f); return P(u, y, d); }, r);
    line(x, P(x0, yb, db), P(x1, yb, db), rimCol(Lt, c, [0, 0.9, -0.4]), Math.max(0.35, s * 0.035), 0.9);
    line(x, P(x0, ya, da), P(x1, ya, da), lit(Lt, shade(c, -0.45), FRONT), Math.max(0.3, s * 0.025), 0.8);
    // the bolts where each slat meets the posts
    for (const u of [...ends, X]) { const p = P(u, (ya + yb) / 2, (da + db) / 2); x.fillStyle = rgb(iron(nb)); x.beginPath(); x.arc(p[0], p[1], Math.max(0.35, 0.03 * s), 0, Math.PI * 2); x.fill(); }
  }
  // the brass plaque on the top slat's middle (a memorial plate: it catches the light)
  { const [da, ya] = back(0.76), [db, yb] = back(0.88), w = 0.13, q = [P(X - w, ya, da), P(X + w, ya, da), P(X + w, yb, db), P(X - w, yb, db)];
    fillPts(x, q, lit(Lt, shade(BRASS, -0.15), nb, 0.6)); line(x, q[3], q[2], rimCol(Lt, BRASS, [0, 1, -0.3]), Math.max(0.3, s * 0.02), 0.9); }
  // 3. the seat: four oak slats seen from above, back to front (their top, then the thin front edge)
  for (let i = 3; i >= 0; i--) {
    const d0 = 0.04 + i * 0.165, d1 = d0 + 0.13, y = 0.6, c = shade(OAK, (r() - 0.5) * 0.1 + 0.03), x0 = X - hw, x1 = X + hw;
    fillPts(x, [P(x0, y, d0), P(x1, y, d0), P(x1, y, d1), P(x0, y, d1)], lit(Lt, c, TOP));
    fillPts(x, [P(x0, y - 0.07, d0), P(x1, y - 0.07, d0), P(x1, y, d0), P(x0, y, d0)], lit(Lt, c, FRONT));
    line(x, P(x0, y, d0), P(x1, y, d0), rimCol(Lt, c, [0, 0.8, -0.6]), Math.max(0.3, s * 0.022), 0.85);
    if (i === 0) grain(x, P, Lt, c, FRONT, x0, x1, (u, f) => P(u, y - 0.07 * f, d0), r, 2);
    else grain(x, P, Lt, c, TOP, x0, x1, (u, f) => P(u, y, d0 + 0.13 * f), r, 2);
  }
  // the seat's rails under it (the iron frame's shadowed front bar)
  line(x, P(X - hw + 0.1, 0.48, 0.1), P(X + hw - 0.1, 0.48, 0.1), iron([0, -0.4, -0.9]), lw(0.05), 0.9);
  // 4. the iron ends from the front: the leg with a stepped knee + a foot scrolled outward, the armrest + its front curl;
  //    the centre support (a plain leg)
  for (const [j, u] of ends.entries()) {
    const out = j === 0 ? -1 : 1, c = iron(FRONT);
    x.strokeStyle = rgb(c);
    // the front leg: a gentle S from the seat down to the foot, the foot turning outward in a scroll
    const k0 = P(u, 0.56, 0.06), kn = P(u, 0.36, 0.04), f0 = P(u + out * 0.02, 0.12, 0.02), ft = P(u + out * 0.16, 0.03, 0);
    x.lineWidth = lw(0.1); x.beginPath(); x.moveTo(k0[0], k0[1]); x.lineTo(kn[0], kn[1]); x.quadraticCurveTo(f0[0], f0[1], ft[0], ft[1]); x.stroke();
    const cc = P(u + out * 0.17, 0.08, 0); x.lineWidth = lw(0.045); x.beginPath(); x.arc(cc[0], cc[1], 0.06 * s, out > 0 ? Math.PI * 0.5 : Math.PI * 0.5, out > 0 ? Math.PI * 2.1 : -Math.PI * 1.1, out < 0); x.stroke();
    // the stepped knee (a Deco block where the leg meets the seat rail)
    const kb = P(u, 0.5, 0.04); fillPts(x, [[kb[0] - 0.09 * s, kb[1]], [kb[0] + 0.09 * s, kb[1]], [kb[0] + 0.07 * s, kb[1] + 0.07 * s], [kb[0] - 0.07 * s, kb[1] + 0.07 * s]], iron(FRONT));
    // the armrest (seen from above: its top a thin bar back to the post) + its supporting bracket + the curl at the front
    const a0 = P(u, 0.94, 0.72), a1 = P(u, 0.9, 0.02);
    x.strokeStyle = rgb(iron(TOP)); x.lineWidth = lw(0.1); x.beginPath(); x.moveTo(a0[0], a0[1]); x.lineTo(a1[0], a1[1]); x.stroke();
    x.strokeStyle = rgb(c); x.lineWidth = lw(0.06); const br = P(u, 0.6, 0.08); x.beginPath(); x.moveTo(br[0], br[1]); x.quadraticCurveTo(P(u + out * 0.05, 0.75, 0.04)[0], P(u, 0.75, 0.04)[1], a1[0], a1[1] + 0.05 * s); x.stroke();
    const cu = P(u, 0.86, 0); x.fillStyle = rgb(iron([0, 0.3, -1])); x.beginPath(); x.arc(cu[0], cu[1], 0.075 * s, 0, Math.PI * 2); x.fill();
    x.strokeStyle = rgb(ironHi, 0.85); x.lineWidth = Math.max(0.3, 0.02 * s); x.beginPath(); x.arc(cu[0], cu[1], 0.045 * s, Math.PI * 1.1, Math.PI * 2.2); x.stroke();
    // the lit edge on the sunny (lamp) side of the leg + the arm's top
    const side = Lt.night > 0.5 ? Math.sign(Lt.ld[0]) || 1 : Lt.sd >= 0 ? 1 : -1;
    line(x, [k0[0] + side * 0.04 * s, k0[1]], [kn[0] + side * 0.04 * s, kn[1]], ironHi, Math.max(0.3, 0.025 * s), 0.7);
    line(x, [a0[0], a0[1] - 0.04 * s], [a1[0], a1[1] - 0.04 * s], ironHi, Math.max(0.3, 0.025 * s), 0.8);
  }
  { const k0 = P(X, 0.53, 0.08), f = P(X, 0, 0.06); x.strokeStyle = rgb(iron(FRONT)); x.lineWidth = lw(0.08); x.beginPath(); x.moveTo(k0[0], k0[1]); x.lineTo(f[0], f[1]); x.stroke();
    x.fillStyle = rgb(iron(FRONT)); x.beginPath(); x.ellipse(f[0], f[1], 0.1 * s, 0.035 * s, 0, 0, Math.PI * 2); x.fill(); }
  // snow on the seat + the back's top (Part 9)
  if (ctx.snow > 0.05) { x.globalAlpha = Math.min(1, ctx.snow * 1.4); fillPts(x, [P(X - hw, 0.61, 0.05), P(X + hw, 0.61, 0.05), P(X + hw, 0.61, 0.66), P(X - hw, 0.61, 0.66)], lit(Lt, [240, 244, 250], TOP)); x.globalAlpha = 1; }
  x.restore();
}
/** wood grain along a board: a few thin darker streaks + a knot or two. at(u, f): the board's point at x u, f 0..1 across it */
function grain(x, P, Lt, c, n, x0, x1, at, r, nl = 3) {
  const dk = lit(Lt, shade(c, -0.28), n), lt = lit(Lt, shade(c, 0.12), n), w = Math.max(0.22, P.s * 0.012);
  for (let k = 0; k < nl; k++) {
    const f = 0.22 + 0.56 * (k + r() * 0.6) / nl, a = x0 + (x1 - x0) * r() * 0.3, b = x1 - (x1 - x0) * r() * 0.3;
    const p = at(a, f), q = at(b, f + (r() - 0.5) * 0.25);
    line(x, p, q, k % 2 ? lt : dk, w, 0.55);
  }
  if (r() < 0.6) { const p = at(x0 + (x1 - x0) * (0.15 + r() * 0.7), 0.5); x.fillStyle = rgb(dk, 0.7); x.beginPath(); x.ellipse(p[0], p[1], P.s * 0.04, P.s * 0.018, 0, 0, Math.PI * 2); x.fill(); }
}

// ------------------------------------------------------------------ THE VENDOR CART
// A 1920s vendor's wagon: a painted wooden body on four big spoked wheels (the near pair in front of the body, the far pair peeking
// out behind), turned-wood push handles at its left end, panelled sides with gilt pinstriping + the trade in gilt letters, a
// striped canvas umbrella (gores in perspective, a scalloped valance with little bulbs that glow at night) and a brass lantern on
// its hook. Its trade by the season: AUTUMN + WINTER hot chestnuts (an iron firebox with glowing coals, a brass roaster, its
// chimney, a tray of chestnuts + paper cones), SUMMER ice cream (a cream cart, chrome tub lids, a big cone on top), SPRING flowers
// (a wooden cart, zinc buckets of tulips + daffodils).
const CART_KIND = { spring: 'flowers', summer: 'icecream', autumn: 'chestnuts', winter: 'chestnuts' };
const CART_LOOK = {
  chestnuts: { body: [34, 88, 64], trim: [22, 56, 42], wheel: [172, 46, 38], umb: [[186, 40, 42], [240, 228, 202]], word: 'HOT CHESTNUTS' },
  icecream: { body: [238, 232, 216], trim: [126, 196, 184], wheel: [96, 160, 196], umb: [[236, 150, 170], [250, 244, 236]], word: 'ICE CREAM', board: [92, 170, 160], ink: [252, 248, 238] },
  flowers: { body: [174, 124, 74], trim: [70, 112, 74], wheel: [52, 92, 62], umb: [[240, 196, 64], [250, 244, 228]], word: 'FRESH FLOWERS', board: [62, 104, 68] },
};
const GILT = [214, 170, 82];

/** the vendor cart: c = { x, z, kind: 'chestnuts' } (its trade by ctx.season unless c.kind names another — chestnuts in autumn +
 *  winter, ice cream in summer, flowers in spring); PIECE.cart: w, h (the box), umb (the umbrella's radius) */
export function drawCart(x, cam, c, T, ctx = {}) {
  const kind = c.kind && c.kind !== 'chestnuts' ? c.kind : CART_KIND[ctx.season || 'autumn'] || 'chestnuts';
  const K = CART_LOOK[kind] || CART_LOOK.chestnuts, C = PIECE.cart;
  const P = frame(cam, c.z, 1.5), s = P.s, Lt = lightFor(T, ctx, c.x, c.z + 0.6), X = c.x, r = rngFrom(seedOf(c.x, c.z));
  const bx0 = X - 1.22, bx1 = X + 1.22, by0 = 0.8, by1 = 1.92, D0 = 0.12, D1 = 1.18;
  x.save(); x.lineCap = 'round'; x.lineJoin = 'round';
  const glow = Lt.night * Lt.lampK;            // its own lights (the bulbs, the lantern, the coals) by the lamps' ramp
  if (glow > 0.02) Lt.own = { k: 0.42 * Lt.lampK, col: [255, 178, 108] };   // (their warm light on the cart itself: it reads at night)
  // 1. the far wheels (behind the body), the chassis + the handles' far shaft
  for (const u of [X - 0.8, X + 0.8]) wheel(x, P, Lt, K, u, 0.6, 1.24, 0.58, true);
  pbox(x, P, Lt, [40, 38, 40], { x0: bx0 + 0.1, x1: bx1 - 0.1, y0: 0.66, y1: 0.8, d0: D0 + 0.05, d1: D1 - 0.05 }, { top: false, rim: false });
  handle(x, P, Lt, X, bx0, 0.95);
  // 2. the body: its side, its top (the counter), its front (panelled), the mouldings
  pbox(x, P, Lt, K.body, { x0: bx0, x1: bx1, y0: by0, y1: by1, d0: D0, d1: D1 }, { rim: false });
  bodyFront(x, P, Lt, K, bx0, bx1, by0, by1, D0);
  pbox(x, P, Lt, K.trim, { x0: bx0 - 0.07, x1: bx1 + 0.07, y0: by1, y1: by1 + 0.08, d0: D0 - 0.07, d1: D1 + 0.07 });     // the counter's moulded edge
  pbox(x, P, Lt, K.trim, { x0: bx0 - 0.04, x1: bx1 + 0.04, y0: by0 - 0.04, y1: by0 + 0.08, d0: D0 - 0.04, d1: D1 + 0.04 }, { top: false });   // the skirt
  // 3. the umbrella's pole (from the back of the counter up through the canopy)
  const pu = X - 0.05, pd = 0.85;
  { const a = P(pu, by1, pd), b = P(pu, 4.85, pd); line(x, a, b, lit(Lt, [70, 64, 60], FRONT, 0.6), Math.max(0.6, 0.07 * s));
    line(x, [a[0] + 0.02 * s, a[1]], [b[0] + 0.02 * s, b[1]], rimCol(Lt, [120, 110, 100], [0.7, 0, -0.7]), Math.max(0.25, 0.018 * s), 0.6); }
  // 4. the trade on the counter
  if (kind === 'chestnuts') chestnutTop(x, P, Lt, X, by1 + 0.08, glow, r);
  else if (kind === 'icecream') iceTop(x, P, Lt, X, by1 + 0.08);
  else flowerTop(x, P, Lt, X, by1 + 0.08, r);
  // 5. the near shaft of the handles + the near wheels (in front of the body)
  handle(x, P, Lt, X, bx0, 0.25);
  for (const u of [X - 0.8, X + 0.8]) wheel(x, P, Lt, K, u, 0.6, -0.04, 0.6, false);
  // 6. the umbrella (+ its bulbs), the lantern on its hook
  umbrella(x, P, Lt, K, pu, pd, C.umb, glow, ctx.snow || 0);
  lantern(x, P, Lt, X + 1.15, 3.98, 0.15, glow);
  x.restore();
}
function wheel(x, P, Lt, K, u, yc, d, R, far) {
  const s = P.s, [cx, cy] = P(u, yc, d), rr = R * s;
  const tyre = lit(Lt, [30, 30, 34], FRONT, 0.3), paint = lit(Lt, far ? shade(K.wheel, -0.35) : K.wheel, FRONT), hub = lit(Lt, BRASS, FRONT, 1.2);
  // the iron tyre, the painted felloe, twelve spokes (each with its sunny edge), the brass hub
  x.lineWidth = Math.max(0.6, 0.07 * s); x.strokeStyle = rgb(tyre); x.beginPath(); x.arc(cx, cy, rr - 0.035 * s, 0, Math.PI * 2); x.stroke();
  x.lineWidth = Math.max(0.5, 0.07 * s); x.strokeStyle = rgb(paint); x.beginPath(); x.arc(cx, cy, rr - 0.1 * s, 0, Math.PI * 2); x.stroke();
  x.lineWidth = Math.max(0.35, 0.035 * s);
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6 + 0.13; x.beginPath(); x.moveTo(cx + Math.cos(a) * 0.1 * s, cy + Math.sin(a) * 0.1 * s); x.lineTo(cx + Math.cos(a) * (rr - 0.12 * s), cy + Math.sin(a) * (rr - 0.12 * s)); x.stroke(); }
  if (!far) {
    // the tyre's sunny arc (the sun's / lamp's side), a gilt pinstripe on the felloe
    const side = Lt.night > 0.5 ? Math.atan2(-Lt.ld[1], Lt.ld[0]) : Math.atan2(-Lt.L[1], Lt.L[0]);
    x.strokeStyle = rgb(rimCol(Lt, [90, 90, 96], [Math.cos(side), -Math.sin(side), -0.5]), 0.85); x.lineWidth = Math.max(0.35, 0.025 * s);
    x.beginPath(); x.arc(cx, cy, rr - 0.01 * s, side - 0.9, side + 0.9); x.stroke();
    x.strokeStyle = rgb(lit(Lt, GILT, FRONT, 0.8), 0.8); x.lineWidth = Math.max(0.25, 0.015 * s); x.beginPath(); x.arc(cx, cy, rr - 0.14 * s, 0, Math.PI * 2); x.stroke();
  }
  x.fillStyle = rgb(far ? shade(hub, -0.4) : hub); x.beginPath(); x.arc(cx, cy, 0.11 * s, 0, Math.PI * 2); x.fill();
  if (!far) { x.fillStyle = rgb(rimCol(Lt, BRASS, [0.4, 0.5, -0.8]), 0.9); x.beginPath(); x.arc(cx - 0.03 * s, cy - 0.03 * s, 0.04 * s, 0, Math.PI * 2); x.fill(); }
}
function handle(x, P, Lt, X, bx0, d) {
  const s = P.s, a = P(bx0 + 0.05, 1.3, d), b = P(bx0 - 0.62, 1.42, d);
  line(x, a, b, lit(Lt, [96, 64, 40], FRONT), Math.max(0.6, 0.075 * s));
  line(x, [a[0], a[1] - 0.025 * s], [b[0], b[1] - 0.025 * s], rimCol(Lt, [150, 104, 64], [0, 0.8, -0.6]), Math.max(0.25, 0.02 * s), 0.7);
  if (d < 0.5) {   // the turned-wood grip across the two shafts' ends (seen end-on: a knob)
    const g0 = P(bx0 - 0.66, 1.42, 0.25), g1 = P(bx0 - 0.66, 1.42, 0.95);
    line(x, g0, g1, lit(Lt, [120, 80, 48], TOP), Math.max(0.6, 0.09 * s));
    x.fillStyle = rgb(lit(Lt, [120, 80, 48], [-0.5, 0.3, -0.8])); x.beginPath(); x.arc(g0[0], g0[1], 0.07 * s, 0, Math.PI * 2); x.fill();
  }
}
/** the body's front: a raised frame, two panels with gilt pinstriping + corner curls, the trade in gilt across the board */
function bodyFront(x, P, Lt, K, x0, x1, y0, y1, d) {
  const s = P.s, body = lit(Lt, K.body, FRONT), dk = lit(Lt, shade(K.body, -0.3), FRONT), hi = rimCol(Lt, K.body, [0, 0.7, -0.7]);
  const gilt = lit(Lt, GILT, FRONT, 0.9), giltHi = rimCol(Lt, GILT, [0, 0.5, -0.9]);
  // the lettering board (top) + two panels under it
  const bd = [x0 + 0.1, x1 - 0.1, y1 - 0.48, y1 - 0.08], pn = [[x0 + 0.1, (x0 + x1) / 2 - 0.05, y0 + 0.14, y1 - 0.56], [(x0 + x1) / 2 + 0.05, x1 - 0.1, y0 + 0.14, y1 - 0.56]];
  for (const [a, b, c0, c1] of [bd, ...pn]) {
    // a recessed panel: its top + sun-away edge in shadow, its bottom + sunny edge lit (the lettering board in its own colour)
    fillPts(x, [P(a, c0, d), P(b, c0, d), P(b, c1, d), P(a, c1, d)], lit(Lt, a === bd[0] && c0 === bd[2] && K.board ? K.board : shade(K.body, -0.08), FRONT));
    line(x, P(a, c1, d), P(b, c1, d), dk, Math.max(0.35, 0.035 * s), 0.9); line(x, P(a, c0, d), P(b, c0, d), hi, Math.max(0.3, 0.025 * s), 0.8);
    // the gilt pinstripe inset + the little corner squares (a Deco touch)
    const i = 0.06, q = [P(a + i, c0 + i, d), P(b - i, c0 + i, d), P(b - i, c1 - i, d), P(a + i, c1 - i, d)];
    x.strokeStyle = rgb(gilt, 0.95); x.lineWidth = Math.max(0.3, 0.018 * s); x.beginPath(); q.forEach((p, k) => (k ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.closePath(); x.stroke();
    x.fillStyle = rgb(gilt); for (const p of q) x.fillRect(p[0] - 0.035 * s, p[1] - 0.035 * s, 0.07 * s, 0.07 * s);
  }
  // the panels' centre ornament: a small gilt fan (a sunburst) in each
  for (const [a, b, c0, c1] of pn) {
    const [cx, cy] = P((a + b) / 2, c0 + 0.08, d), R = (c1 - c0) * 0.62 * s;
    for (let k = 0; k < 7; k++) { const t0 = Math.PI + k * Math.PI / 7, t1 = t0 + Math.PI / 7 * 0.55; fillPts(x, [[cx, cy], [cx + Math.cos(t0) * R, cy + Math.sin(t0) * R], [cx + Math.cos(t1) * R, cy + Math.sin(t1) * R]], k % 2 ? gilt : giltHi, 0.9); }
  }
  // the trade, in gilt (shadowed letters: the sign-writer's drop shade)
  const [lx, ly] = P((x0 + x1) / 2, (bd[2] + bd[3]) / 2 - 0.12, d), size = (bd[3] - bd[2]) * 0.62 * s, wmax = (bd[1] - bd[0] - 0.18) * s;
  x.save(); x.font = FONT(size); x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  const tw = x.measureText(K.word).width, sq = Math.min(1, wmax / Math.max(1, tw));
  x.translate(lx, ly); x.scale(sq, 1);
  x.fillStyle = rgb(shade(dk, -0.4), 0.9); x.fillText(K.word, 0.06 * s, 0.05 * s);
  x.fillStyle = rgb(K.ink ? lit(Lt, K.ink, FRONT, 0.5) : giltHi); x.fillText(K.word, 0, 0);
  x.restore();
  // the body's corner posts (turned, a lit edge)
  for (const u of [x0, x1]) { const a = P(u, y0, d - 0.02), b = P(u, y1, d - 0.02); line(x, a, b, lit(Lt, K.trim, FRONT), Math.max(0.6, 0.09 * s)); line(x, [a[0] + 0.025 * s, a[1]], [b[0] + 0.025 * s, b[1]], rimCol(Lt, K.trim, [0.6, 0.3, -0.7]), Math.max(0.25, 0.02 * s), 0.7); }
}
function chestnutTop(x, P, Lt, X, y, glow, r) {
  const s = P.s;
  // the firebox (iron), its grate opening with the coals (a red glow, bright at night)
  pbox(x, P, Lt, [44, 42, 46], { x0: X + 0.2, x1: X + 1.06, y0: y, y1: y + 0.36, d0: 0.3, d1: 0.98 }, { gloss: 0.3 });
  const g = [P(X + 0.32, y + 0.06, 0.29), P(X + 0.94, y + 0.06, 0.29), P(X + 0.94, y + 0.26, 0.29), P(X + 0.32, y + 0.26, 0.29)];
  const coal = mix(lit(Lt, [210, 74, 30], FRONT), [255, 150, 60], 0.35 + 0.6 * glow);
  fillPts(x, g, [24, 12, 10]);
  for (let i = 0; i < 9; i++) { const p = P(X + 0.36 + 0.07 * i, y + 0.1 + r() * 0.06, 0.29); x.fillStyle = rgb(i % 3 ? coal : mix(coal, [255, 230, 150], 0.5 + 0.4 * glow)); x.beginPath(); x.arc(p[0], p[1], 0.04 * s, 0, Math.PI * 2); x.fill(); }
  if (glow > 0.05) {   // the coals' warm light on the counter + the roaster
    const [cx, cy] = P(X + 0.63, y + 0.2, 0.3), gr = x.createRadialGradient(cx, cy, 0, cx, cy, 0.9 * s);
    gr.addColorStop(0, `rgba(255,140,60,${(0.55 * glow).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,120,40,0)');
    x.save(); x.globalCompositeOperation = 'lighter'; x.fillStyle = gr; x.fillRect(cx - s, cy - s, 2 * s, 2 * s); x.restore();
  }
  // the firebox's brass band along its top edge
  line(x, P(X + 0.2, y + 0.34, 0.3), P(X + 1.06, y + 0.34, 0.3), lit(Lt, BRASS, [0, 0.6, -0.8], 1.2), Math.max(0.4, 0.045 * s));
  // the grate's bars
  for (let i = 1; i < 5; i++) line(x, P(X + 0.32 + i * 0.124, y + 0.06, 0.28), P(X + 0.32 + i * 0.124, y + 0.26, 0.28), [20, 18, 20], Math.max(0.3, 0.025 * s));
  // the brass roaster on top: a shallow drum + a domed lid + a knob (gleaming)
  const [cx, cy] = P(X + 0.63, y + 0.36, 0.64), rw = 0.4 * s, rh = 0.16 * s;
  x.fillStyle = rgb(lit(Lt, [150, 112, 54], FRONT, 0.8)); x.fillRect(cx - rw, cy - 0.12 * s, rw * 2, 0.12 * s);
  const dome = x.createLinearGradient(cx - rw, 0, cx + rw, 0), lc = lit(Lt, BRASS, [-0.6, 0.6, -0.5], 1.4), mc = lit(Lt, BRASS, [0, 0.7, -0.7], 1.4), rc = lit(Lt, BRASS, [0.6, 0.6, -0.5], 1.4);
  dome.addColorStop(0, rgb(lc)); dome.addColorStop(0.5, rgb(mc)); dome.addColorStop(1, rgb(rc));
  x.fillStyle = dome; x.beginPath(); x.ellipse(cx, cy - 0.12 * s, rw, rh * 1.9, 0, Math.PI, 0); x.fill();
  x.strokeStyle = rgb(lit(Lt, [120, 84, 36], FRONT)); x.lineWidth = Math.max(0.3, 0.03 * s); x.beginPath(); x.ellipse(cx, cy - 0.12 * s, rw, rh * 0.5, 0, 0, Math.PI); x.stroke();
  x.fillStyle = rgb(rimCol(Lt, BRASS, [0.2, 0.9, -0.4])); x.beginPath(); x.ellipse(cx - rw * 0.3, cy - 0.12 * s - rh * 1.3, rw * 0.28, rh * 0.28, -0.3, 0, Math.PI * 2); x.fill();
  x.fillStyle = rgb(lit(Lt, [40, 36, 40], TOP)); x.beginPath(); x.arc(cx, cy - 0.12 * s - rh * 1.9 - 0.03 * s, 0.05 * s, 0, Math.PI * 2); x.fill();
  // the chimney: an iron pipe from the firebox's back, a conical rain cap (no smoke here — the city's smoke is live)
  const c0 = P(X + 0.95, y + 0.36, 0.9), c1 = P(X + 0.95, y + 1.4, 0.9);
  line(x, c0, c1, lit(Lt, [50, 48, 52], FRONT, 0.4), Math.max(0.7, 0.1 * s));
  line(x, [c0[0] + 0.03 * s, c0[1]], [c1[0] + 0.03 * s, c1[1]], rimCol(Lt, [80, 80, 86], [0.7, 0, -0.7]), Math.max(0.25, 0.02 * s), 0.6);
  fillPts(x, [[c1[0] - 0.13 * s, c1[1]], [c1[0] + 0.13 * s, c1[1]], [c1[0], c1[1] - 0.1 * s]], lit(Lt, [56, 54, 58], [0, 0.7, -0.7], 0.4));
  // the tray of chestnuts (a heap of glossy brown nuts) + the paper cones standing in their rack
  pbox(x, P, Lt, [150, 112, 54], { x0: X - 1.08, x1: X + 0.08, y0: y, y1: y + 0.1, d0: 0.25, d1: 1.0 }, { gloss: 0.8 });
  const nuts = Array.from({ length: 40 }, () => [X - 1.0 + r() * 0.98, 0.32 + r() * 0.62]).sort((a, b) => b[1] - a[1]);
  for (const [u, dd] of nuts) {
    const i = (u * 100) | 0, h = y + 0.1 + 0.14 * Math.max(0, 1 - Math.abs(u - (X - 0.5)) * 1.9), p = P(u, h, dd);
    x.fillStyle = rgb(lit(Lt, i % 4 ? [96, 50, 28] : [128, 70, 38], [0, 0.6, -0.8], 0.8)); x.beginPath(); x.ellipse(p[0], p[1], 0.05 * s, 0.04 * s, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = rgb(rimCol(Lt, [150, 90, 50], [0.2, 0.8, -0.5]), 0.6); x.fillRect(p[0] - 0.02 * s, p[1] - 0.03 * s, 0.025 * s, 0.015 * s);
  }
  // the brass scoop resting on the heap, a stack of folded paper bags at the front corner
  { const a = P(X - 0.25, y + 0.14, 0.45), b = P(X + 0.05, y + 0.3, 0.6); line(x, a, b, lit(Lt, BRASS, TOP, 1.2), Math.max(0.4, 0.04 * s)); x.fillStyle = rgb(lit(Lt, BRASS, [0, 0.7, -0.7], 1.2)); x.beginPath(); x.ellipse(a[0], a[1], 0.1 * s, 0.05 * s, 0, 0, Math.PI * 2); x.fill(); }
  pbox(x, P, Lt, [232, 220, 196], { x0: X - 1.1, x1: X - 0.72, y0: y, y1: y + 0.12, d0: 0.15, d1: 0.4 });
  line(x, P(X - 1.1, y + 0.06, 0.15), P(X - 0.72, y + 0.06, 0.15), lit(Lt, [190, 176, 150], FRONT), Math.max(0.25, 0.015 * s), 0.8);
}
function iceTop(x, P, Lt, X, y) {
  const s = P.s;
  // three chrome tub lids set in the counter (bright rims, knobs) + the big cone on its rod (a waffle cone, a pink scoop, a cherry)
  for (const u of [-0.1, 0.4, 0.9]) {
    const [cx, cy] = P(X + u, y + 0.02, 0.62), rw = 0.21 * s, rh = rw * 0.42;
    x.fillStyle = rgb(lit(Lt, [150, 156, 166], [0, -0.3, -1], 1)); x.beginPath(); x.ellipse(cx, cy + 0.04 * s, rw, rh, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = rgb(lit(Lt, [206, 212, 220], TOP, 1.4)); x.beginPath(); x.ellipse(cx, cy, rw, rh, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = rgb(rimCol(Lt, [220, 226, 236], [0.3, 0.8, -0.5])); x.beginPath(); x.ellipse(cx - rw * 0.3, cy - rh * 0.3, rw * 0.35, rh * 0.25, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = rgb(lit(Lt, [90, 94, 104], TOP)); x.beginPath(); x.arc(cx, cy - 0.04 * s, 0.045 * s, 0, Math.PI * 2); x.fill();
  }
  const a = P(X - 0.75, y, 0.5), b = P(X - 0.75, y + 0.75, 0.5); line(x, a, b, lit(Lt, [150, 156, 166], FRONT, 1), Math.max(0.5, 0.05 * s));
  const tip = P(X - 0.75, y + 0.72, 0.5), top = P(X - 0.75, y + 1.22, 0.5), w = 0.2 * s;
  fillPts(x, [tip, [top[0] - w, top[1]], [top[0] + w, top[1]]], lit(Lt, [214, 160, 92], FRONT));
  x.strokeStyle = rgb(lit(Lt, [160, 108, 56], FRONT), 0.8); x.lineWidth = Math.max(0.25, 0.018 * s);
  for (let k = -2; k <= 2; k++) { x.beginPath(); x.moveTo(top[0] + k * w * 0.4 - w * 0.3, top[1]); x.lineTo(tip[0] + k * w * 0.1 + w * 0.15, tip[1] - (tip[1] - top[1]) * 0.35); x.stroke(); }
  const sc = lit(Lt, [244, 170, 190], [0, 0.6, -0.8]);
  x.fillStyle = rgb(sc); x.beginPath(); x.arc(top[0], top[1] - w * 0.55, w * 1.05, 0, Math.PI * 2); x.fill();
  x.fillStyle = rgb(rimCol(Lt, [250, 210, 220], [-0.3, 0.8, -0.5]), 0.9); x.beginPath(); x.arc(top[0] - w * 0.35, top[1] - w * 0.9, w * 0.38, 0, Math.PI * 2); x.fill();
  x.fillStyle = rgb(lit(Lt, [200, 30, 44], [0, 0.6, -0.8], 1)); x.beginPath(); x.arc(top[0] + w * 0.1, top[1] - w * 1.65, w * 0.32, 0, Math.PI * 2); x.fill();
}
function flowerTop(x, P, Lt, X, y, r) {
  const s = P.s, BL = [[214, 40, 52], [246, 204, 58], [236, 130, 170], [250, 246, 236], [150, 96, 196], [255, 150, 60]];
  // four zinc buckets along the counter, each a bunch of stems + blooms (tulips, daffodils, lilac)
  [-0.95, -0.4, 0.2, 0.78].forEach((u, i) => {
    const bx = X + u, d = 0.62, hb = 0.36;
    const [cx, cy] = P(bx, y, d), w = 0.22 * s, [, ty] = P(bx, y + hb, d);
    // the bunch (behind the bucket's rim): stems, leaves, blooms
    const col = BL[(i * 2 + (r() * 2 | 0)) % BL.length], col2 = BL[(i * 2 + 3) % BL.length];
    for (let k = 0; k < 9; k++) {
      const a = -0.5 + k / 8, hx = bx + a * 0.36 + (r() - 0.5) * 0.08, hy = y + hb + 0.35 + r() * 0.3 - Math.abs(a) * 0.2, p = P(hx, hy, d - 0.05), q = P(bx + a * 0.1, y + hb, d);
      line(x, q, p, lit(Lt, [70, 120, 56], FRONT), Math.max(0.3, 0.025 * s));
      const cc = k % 3 === 2 ? col2 : col;
      x.fillStyle = rgb(lit(Lt, cc, [0, 0.5, -0.9])); x.beginPath(); x.ellipse(p[0], p[1], 0.07 * s, 0.085 * s, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = rgb(rimCol(Lt, cc, [0.3, 0.8, -0.5]), 0.7); x.beginPath(); x.arc(p[0] - 0.02 * s, p[1] - 0.03 * s, 0.028 * s, 0, Math.PI * 2); x.fill();
    }
    // the bucket: a zinc pail (slightly tapered), its rim, a lit band
    const zinc = [160, 168, 176];
    fillPts(x, [[cx - w * 0.82, cy], [cx + w * 0.82, cy], [cx + w, ty], [cx - w, ty]], lit(Lt, zinc, FRONT, 0.9));
    fillPts(x, [[cx + w * (Lt.sd >= 0 ? 0.2 : -0.6), cy], [cx + w * (Lt.sd >= 0 ? 0.6 : -0.2), cy], [cx + w * (Lt.sd >= 0 ? 0.7 : -0.3), ty], [cx + w * (Lt.sd >= 0 ? 0.25 : -0.75), ty]], rimCol(Lt, zinc, [0.3, 0.2, -0.9]), 0.55);
    line(x, [cx - w, ty], [cx + w, ty], rimCol(Lt, zinc, [0, 0.8, -0.6]), Math.max(0.35, 0.03 * s));
    line(x, [cx - w * 0.9, (cy + ty) / 2], [cx + w * 0.9, (cy + ty) / 2], lit(Lt, shade(zinc, -0.3), FRONT), Math.max(0.25, 0.02 * s), 0.8);
  });
}
/** the striped canvas umbrella: gores from the apex to the rim (painter's order, far first), a scalloped valance on the near half,
 *  a little bulb at each scallop (lit at night), a brass finial */
function umbrella(x, P, Lt, K, pu, pd, R, glow, snow) {
  const s = P.s, yA = 4.88, yR = 4.06, n = 14, ap = P(pu, yA, pd), rot = 0.11;
  const rim = i => { const a = rot + i * Math.PI * 2 / n; return [pu + Math.cos(a) * R, yR, pd + Math.sin(a) * R, a]; };
  const gores = Array.from({ length: n }, (_, i) => ({ i, a: rim(i), b: rim(i + 1), m: Math.sin(rot + (i + 0.5) * Math.PI * 2 / n) }));
  gores.sort((g, h) => h.m - g.m);            // far (sin > 0: behind the pole) first
  const slope = (yA - yR) / R;
  for (const g of gores) {
    const am = rot + (g.i + 0.5) * Math.PI * 2 / n, nrm = [Math.cos(am) * slope, 1, Math.sin(am) * slope];
    const base = K.umb[g.i % 2], col = lit(Lt, mix(base, [255, 250, 240], 0.04), nrm);
    const pa = P(g.a[0], g.a[1], g.a[2]), pb = P(g.b[0], g.b[1], g.b[2]);
    fillPts(x, [ap, pa, pb], col);
    // the canvas's sag between the ribs: a soft darker crease along each rib
    line(x, ap, pa, lit(Lt, shade(base, -0.25), nrm), Math.max(0.25, 0.02 * s), 0.5);
    if (snow > 0.05) { x.globalAlpha = Math.min(1, snow * 1.3); fillPts(x, [ap, [pa[0] * 0.5 + ap[0] * 0.5, pa[1] * 0.5 + ap[1] * 0.5], [pb[0] * 0.5 + ap[0] * 0.5, pb[1] * 0.5 + ap[1] * 0.5]], lit(Lt, [242, 246, 252], nrm)); x.globalAlpha = 1; }
  }
  // the valance: a hanging flap under each near gore, scalloped (its own colour, a step darker: it hangs vertical)
  const vh = 0.3, near = gores.filter(g => g.m < 0.25).sort((g, h) => h.m - g.m);
  for (const g of near) {
    const am = rot + (g.i + 0.5) * Math.PI * 2 / n, nrm = [Math.cos(am), 0.1, Math.sin(am)], base = K.umb[g.i % 2];
    const pa = P(g.a[0], yR, g.a[2]), pb = P(g.b[0], yR, g.b[2]), qa = P(g.a[0], yR - vh, g.a[2]), qb = P(g.b[0], yR - vh, g.b[2]);
    const col = lit(Lt, base, nrm);
    x.beginPath(); x.moveTo(pa[0], pa[1]); x.lineTo(pb[0], pb[1]); x.lineTo(qb[0], qb[1]);
    const mx = (qa[0] + qb[0]) / 2, my = (qa[1] + qb[1]) / 2;
    x.quadraticCurveTo(mx, my + 0.22 * s, qa[0], qa[1]); x.closePath(); x.fillStyle = rgb(col); x.fill();
    line(x, pa, pb, rimCol(Lt, base, [nrm[0], 0.6, nrm[2]]), Math.max(0.3, 0.025 * s), 0.7);
    // a bulb at the scallop's point (clear glass by day; a warm spark at night — the cart's string lights)
    const bp = [mx, my + 0.16 * s];
    x.fillStyle = glow > 0.05 ? rgb(mix([255, 214, 150], [255, 248, 220], glow)) : rgb(lit(Lt, [236, 232, 220], FRONT, 1), 0.8);
    x.beginPath(); x.arc(bp[0], bp[1], Math.max(0.5, 0.045 * s), 0, Math.PI * 2); x.fill();
    // (FP2 — crisp lights: each bulb's halo tight — 0.24 units, a quick falloff; was a 0.32-unit linear cone)
    if (glow > 0.05) { const gr = x.createRadialGradient(bp[0], bp[1], 0, bp[0], bp[1], 0.24 * s); gr.addColorStop(0, `rgba(255,206,140,${(0.6 * glow).toFixed(3)})`); gr.addColorStop(0.35, `rgba(255,190,120,${(0.2 * glow).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,180,110,0)'); x.save(); x.globalCompositeOperation = 'lighter'; x.fillStyle = gr; x.fillRect(bp[0] - 0.24 * s, bp[1] - 0.24 * s, 0.48 * s, 0.48 * s); x.restore(); }
  }
  // the finial: a brass ball on a short spike
  x.fillStyle = rgb(lit(Lt, BRASS, [0, 0.8, -0.6], 1.3)); x.beginPath(); x.arc(ap[0], ap[1] - 0.1 * s, 0.075 * s, 0, Math.PI * 2); x.fill();
  x.fillStyle = rgb(rimCol(Lt, BRASS, [0.3, 0.9, -0.3])); x.beginPath(); x.arc(ap[0] - 0.025 * s, ap[1] - 0.13 * s, 0.03 * s, 0, Math.PI * 2); x.fill();
}
/** a small brass lantern on a hook under the umbrella's rim: a frame, glass (a warm flame at night), a cap + ring */
function lantern(x, P, Lt, u, y, d, glow) {
  const s = P.s, [cx, top] = P(u, y, d), w = 0.12 * s, h = 0.3 * s, [, hook] = P(u, y + 0.25, d);
  line(x, [cx, hook], [cx, top], lit(Lt, [60, 56, 50], FRONT), Math.max(0.3, 0.02 * s));
  const glass = glow > 0.05 ? mix([255, 196, 110], [255, 240, 200], glow) : lit(Lt, [214, 200, 160], FRONT, 1.2);
  fillPts(x, [[cx - w, top + 0.06 * s], [cx + w, top + 0.06 * s], [cx + w * 0.85, top + h], [cx - w * 0.85, top + h]], glass);
  // (FP2 — crisp lights: the lantern's halo tight — 0.4 units with a quick falloff, was a 0.55-unit linear cone; the cart's own
  // surfaces catch its light: Lt.own)
  if (glow > 0.05) { const gr = x.createRadialGradient(cx, top + h * 0.55, 0, cx, top + h * 0.55, 0.4 * s); gr.addColorStop(0, `rgba(255,200,124,${(0.7 * glow).toFixed(3)})`); gr.addColorStop(0.3, `rgba(255,184,104,${(0.24 * glow).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,170,90,0)'); x.save(); x.globalCompositeOperation = 'lighter'; x.fillStyle = gr; x.fillRect(cx - 0.4 * s, top + h * 0.55 - 0.4 * s, 0.8 * s, 0.8 * s); x.restore(); }
  const br = lit(Lt, BRASS, FRONT, 1);
  x.strokeStyle = rgb(br); x.lineWidth = Math.max(0.3, 0.025 * s); x.strokeRect(cx - w, top + 0.06 * s, w * 2, h - 0.06 * s);
  line(x, [cx, top + 0.06 * s], [cx, top + h], br, Math.max(0.25, 0.018 * s));
  fillPts(x, [[cx - w * 1.2, top + 0.07 * s], [cx + w * 1.2, top + 0.07 * s], [cx, top - 0.06 * s]], br);
  x.fillStyle = rgb(br); x.fillRect(cx - w * 1.05, top + h, w * 2.1, 0.04 * s);
}

// ------------------------------------------------------------------ THE PLANTER — ONE CRAFTED URN (FP, the owner: "much higher quality
// or replaced"; fewer planters, better ones)
// A 1920s Deco garden URN in the speakeasy's own cream terracotta, tucked against its corner: a square two-step plinth with a recessed
// panel, a turned foot + stem + knop, a GADROONED bowl (lobes that catch the light one by one), a fillet, a carved CHEVRON frieze, a
// rolled lip — every band a lathe surface lit by its own normals (the lit side → a core shadow → a thin bounce on the far edge: real
// roundness, the lighthouse's way); weathered (chipped edges, rain streaks under the lip, moss at the foot). Planted the way a
// gardener fills an urn — a THRILLER (tall: fountain grass plumes in autumn, a spiky dracaena in summer, tall tulips in spring, birch
// twigs in winter), FILLERS (the season's flowers as clusters with their leaves) and SPILLERS (vines trailing over the lip).
const STONE = [204, 188, 160];          // (cream terracotta — the speakeasy's trim, a little weathered)

/** the urn's profile: [y, r, slope φ (rad: + faces up)] bands, bottom → top (world units; the plinth below y 0.34) */
const URN = [
  { y0: 0.34, y1: 0.42, r0: 0.56, r1: 0.5, phi: 0.5 },     // the foot ring (its top bevel)
  { y0: 0.42, y1: 0.63, r0: 0.34, r1: 0.31, phi: -0.1 },   // the stem
  { y0: 0.63, y1: 0.72, r0: 0.44, r1: 0.44, phi: 0 },      // the knop
  { y0: 0.72, y1: 1.02, r0: 0.5, r1: 0.95, phi: -0.75 },   // the bowl's underside (gadrooned)
  { y0: 1.02, y1: 1.34, r0: 0.95, r1: 1.17, phi: -0.3 },   // the bowl's belly (gadrooned)
  { y0: 1.34, y1: 1.42, r0: 1.2, r1: 1.2, phi: 0.1 },      // the fillet
  { y0: 1.42, y1: 1.62, r0: 1.15, r1: 1.15, phi: 0 },      // the chevron frieze
  { y0: 1.62, y1: 1.67, r0: 1.22, r1: 1.3, phi: -0.6 },    // the lip's roll, under
  { y0: 1.67, y1: 1.76, r0: 1.3, r1: 1.24, phi: 0.75 },    // the lip's roll, over
];
export function drawPlanter(x, cam, p, T, ctx = {}) {
  const k = (p.w || PIECE.planter.w) / 2.6, P = frame(cam, p.z, 1.35), s = P.s, Lt = lightFor(T, ctx, p.x, p.z + 0.8), X = p.x;
  const r = rngFrom(seedOf(p.x, p.z)), dc = 0.95 * k;          // (the axis: the plinth's centre, its front at d 0)
  const S = v => v * k;
  x.save(); x.lineCap = 'round'; x.lineJoin = 'round';
  // the front arc of a horizontal circle (radius rr at height y): θ −90° → +90°, left → right (the near half: lower on screen)
  const arc = (rr, y, n = 18) => { const o = []; for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + Math.PI * i / n; o.push(P(X + rr * Math.sin(a), y, dc - rr * Math.cos(a))); } return o; };
  const nrm = (a, phi) => [Math.sin(a) * Math.cos(phi), Math.sin(phi), -Math.cos(a) * Math.cos(phi)];
  // a lathe band: the region between the front arcs at y0 (r0) and y1 (r1), its colour across from the normals (round shading)
  const band = (y0, y1, r0, r1, phi, col) => {
    const lo = arc(r0, y0), hi = arc(r1, y1).reverse(), rm = Math.max(r0, r1), [ax] = P(X - rm, (y0 + y1) / 2, dc), [bx] = P(X + rm, (y0 + y1) / 2, dc);
    const g = x.createLinearGradient(ax, 0, bx, 0);
    for (let i = 0; i <= 8; i++) { const t = i / 8, a = Math.asin(Math.max(-1, Math.min(1, t * 2 - 1))) * 0.98; g.addColorStop(t, rgb(lit(Lt, col, nrm(a, phi)))); }
    x.fillStyle = g; x.beginPath(); [...lo, ...hi].forEach((q, i) => (i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]))); x.closePath(); x.fill();
  };
  // 1. THE PLINTH: a base step + a die with a recessed panel (its sunk face in shade, a lit lower reveal), the die's lit top edge
  const pw = S(0.86), pw2 = S(0.76), D0 = dc - S(0.86), D1 = dc + S(0.86);
  pbox(x, P, Lt, shade(STONE, -0.12), { x0: X - pw, x1: X + pw, y0: 0, y1: 0.13, d0: D0, d1: D1 });
  pbox(x, P, Lt, shade(STONE, -0.05), { x0: X - pw2, x1: X + pw2, y0: 0.13, y1: 0.34, d0: D0 + 0.08, d1: D1 - 0.08 });
  { const a = P(X - pw2 + 0.12, 0.3, D0 + 0.08), b = P(X + pw2 - 0.12, 0.17, D0 + 0.08);
    x.fillStyle = rgb(lit(Lt, shade(STONE, -0.2), FRONT)); x.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
    x.fillStyle = rgb(lit(Lt, shade(STONE, -0.42), FRONT)); x.fillRect(a[0], a[1], b[0] - a[0], Math.max(0.35, (b[1] - a[1]) * 0.22));   // (the sunk panel's top: in its own shadow)
    x.fillStyle = rgb(rimCol(Lt, STONE, [0, 0.8, -0.6]), 0.8); x.fillRect(a[0], b[1] - Math.max(0.3, (b[1] - a[1]) * 0.16), b[0] - a[0], Math.max(0.3, (b[1] - a[1]) * 0.16));
    // a small Deco fan carved in the panel (three rays from its foot)
    const mid = (a[0] + b[0]) / 2; x.strokeStyle = rgb(lit(Lt, shade(STONE, -0.5), FRONT), 0.7); x.lineWidth = Math.max(0.25, 0.022 * s);
    for (const f of [-0.6, 0, 0.6]) { x.beginPath(); x.moveTo(mid, b[1] - 0.5); x.lineTo(mid + f * (b[0] - a[0]) * 0.32, a[1] + (b[1] - a[1]) * 0.35); x.stroke(); } }
  // moss + grime at the plinth's foot, a darker damp line where it meets the cobbles
  { const a = P(X - pw, 0.13, D0), b = P(X + pw, 0, D0), g = x.createLinearGradient(0, a[1], 0, b[1]); g.addColorStop(0, 'rgba(70,96,58,0)'); g.addColorStop(1, rgb(lit(Lt, [70, 96, 58], FRONT), 0.45)); x.fillStyle = g; x.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]); }
  // 2. THE URN, bottom → top (each band its own lit lathe surface)
  for (const B of URN) band(B.y0, B.y1, S(B.r0), S(B.r1), B.phi, B.phi > 0.4 ? shade(STONE, 0.05) : B.y0 >= 1.42 && B.y0 < 1.62 ? shade(STONE, -0.02) : STONE);
  // the GADROONS on the bowl: lobes round it, each a lit crest + a groove (only the near half), following the bowl's curve
  const rb = y => (y < 1.02 ? S(0.5 + (0.95 - 0.5) * (y - 0.72) / 0.3) : S(0.95 + (1.17 - 0.95) * (y - 1.02) / 0.32));
  const lobes = 14, sunR = Lt.night > 0.5 ? Lt.ld[0] >= 0 : Lt.sd >= 0;
  for (let i = 0; i < lobes; i++) {
    const a = -Math.PI / 2 + Math.PI * (i + 0.5) / lobes;
    if (Math.abs(a) > 1.45) continue;
    const pts = t => { const y = 0.76 + t * 0.56, rr = rb(y); return P(X + rr * Math.sin(a), y, dc - rr * Math.cos(a)); };
    const groove = lit(Lt, shade(STONE, -0.45), nrm(a, -0.4)), crest = rimCol(Lt, STONE, nrm(a + (sunR ? 0.35 : -0.35), -0.2));
    x.strokeStyle = rgb(groove, 0.7); x.lineWidth = Math.max(0.3, 0.035 * s * Math.cos(a) + 0.2); x.beginPath();
    for (let t = 0; t <= 1.001; t += 0.1) { const q = pts(t); if (t) x.lineTo(q[0], q[1]); else x.moveTo(q[0], q[1]); } x.stroke();
    const b = -Math.PI / 2 + Math.PI * (i + 1) / lobes;          // (the crest: half way to the next groove)
    const pc = t => { const y = 0.8 + t * 0.48, rr = rb(y) * 1.01, aa = (a + b) / 2; return P(X + rr * Math.sin(aa), y, dc - rr * Math.cos(aa)); };
    x.strokeStyle = rgb(crest, 0.35 + 0.4 * Math.max(0, Math.cos(a))); x.lineWidth = Math.max(0.25, 0.028 * s); x.beginPath();
    for (let t = 0; t <= 1.001; t += 0.125) { const q = pc(t); if (t) x.lineTo(q[0], q[1]); else x.moveTo(q[0], q[1]); } x.stroke();
  }
  // the fillet's lit top line + the frieze's carved CHEVRONS (a shade stroke + a lit stroke a hair above), the lip's lit crest
  { const q = arc(S(1.2), 1.42); x.strokeStyle = rgb(rimCol(Lt, STONE, [0, 0.9, -0.4]), 0.85); x.lineWidth = Math.max(0.3, 0.03 * s); x.beginPath(); q.forEach((v, i) => (i ? x.lineTo(v[0], v[1]) : x.moveTo(v[0], v[1]))); x.stroke(); }
  for (const [col, dy] of [[lit(Lt, shade(STONE, -0.5), FRONT), 0], [rimCol(Lt, STONE, [0, 0.7, -0.7]), 0.025]]) {
    x.strokeStyle = rgb(col, 0.8); x.lineWidth = Math.max(0.28, 0.028 * s); x.beginPath();
    const n = 13; for (let i = 0; i <= n; i++) { const a = -1.35 + 2.7 * i / n, y = (i % 2 ? 1.46 : 1.58) + dy, rr = S(1.155), q = P(X + rr * Math.sin(a), y, dc - rr * Math.cos(a)); if (i) x.lineTo(q[0], q[1]); else x.moveTo(q[0], q[1]); }
    x.stroke();
  }
  { const q = arc(S(1.3), 1.67); x.strokeStyle = rgb(rimCol(Lt, STONE, [0, 0.95, -0.3]), 0.9); x.lineWidth = Math.max(0.35, 0.04 * s); x.beginPath(); q.forEach((v, i) => (i ? x.lineTo(v[0], v[1]) : x.moveTo(v[0], v[1]))); x.stroke(); }
  // weathering, clipped to the urn's body: speckle, rain streaks down from the lip, a few chips off the lip (darker notches)
  { x.save(); x.beginPath(); const sil = [...URN.map(B => P(X - S(B.r0), B.y0, dc)), P(X - S(1.24), 1.76, dc), P(X + S(1.24), 1.76, dc), ...URN.slice().reverse().map(B => P(X + S(B.r0), B.y0, dc)), ...arc(S(0.56), 0.34).reverse()];
    sil.forEach((v, i) => (i ? x.lineTo(v[0], v[1]) : x.moveTo(v[0], v[1]))); x.closePath(); x.clip();
    for (let i = 0; i < 60; i++) { const a = (r() - 0.5) * 2.8, y = 0.4 + r() * 1.3, rr = rb(Math.max(0.76, Math.min(1.34, y))), q = P(X + rr * Math.sin(a), y, dc - rr * Math.cos(a)); x.fillStyle = rgb(r() < 0.55 ? shade(lit(Lt, STONE, nrm(a, 0)), -0.22) : shade(lit(Lt, STONE, nrm(a, 0)), 0.14), 0.5); x.fillRect(q[0], q[1], Math.max(0.3, 0.022 * s), Math.max(0.3, 0.022 * s)); }
    for (let i = 0; i < 6; i++) { const a = (r() - 0.5) * 2.2, rr = S(1.16), t = P(X + rr * Math.sin(a), 1.62, dc - rr * Math.cos(a)), b = P(X + rr * 0.92 * Math.sin(a), 1.0 - r() * 0.2, dc - rr * Math.cos(a)), g = x.createLinearGradient(0, t[1], 0, b[1]);
      g.addColorStop(0, rgb([70, 62, 52], 0.24 * (1 - 0.5 * Lt.night))); g.addColorStop(1, 'rgba(70,62,52,0)'); x.fillStyle = g; x.fillRect(t[0] - 0.03 * s, t[1], (0.04 + r() * 0.05) * s, b[1] - t[1]); }
    x.restore(); }
  for (let i = 0; i < 3; i++) { const a = (r() - 0.5) * 2.4, rr = S(1.3), q = P(X + rr * Math.sin(a), 1.7, dc - rr * Math.cos(a)); x.fillStyle = rgb(lit(Lt, shade(STONE, -0.35), FRONT)); x.beginPath(); x.ellipse(q[0], q[1], 0.06 * s, 0.035 * s, 0, 0, Math.PI * 2); x.fill(); }
  // the lip's top (the ring seen from above) + the soil inside it
  { const top = 1.76, ro = S(1.24), ri = S(1.06), ring = (rr, y) => { const o = []; for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; o.push(P(X + rr * Math.sin(a), y, dc - rr * Math.cos(a))); } return o; };
    fillPts(x, ring(ro, top), lit(Lt, shade(STONE, 0.08), TOP)); fillPts(x, ring(ri, top), lit(Lt, ctx.season === 'winter' ? [30, 52, 40] : [34, 56, 36], [0, 0.5, -0.8])); }   // (inside the lip: the planting's own shadowed leaves, never bare soil)
  // 3. THE PLANTING (the season's): the bed inside the lip (a square inscribed in the bowl's circle, mounded), then the spillers
  const R = S(1.0), top = 1.76;
  // (the bed fills the bowl to its lip and mounds above it — no soil showing)
  const bed = { X, y: top + 0.05, u0: -R * 1.0, u1: R * 1.0, d0: dc - R * 1.1, d1: dc + R * 0.78, front: dc - R * 1.16 };
  const season = ctx.season || 'autumn';
  urnThriller(x, P, Lt, X, top, dc, R, season, r, 'back');
  if (season === 'summer') geraniums(x, P, Lt, bed, r);
  else if (season === 'spring') tulips(x, P, Lt, bed, r);
  else if (season === 'winter') evergreens(x, P, Lt, bed, r, ctx.snow || 0);
  else mums(x, P, Lt, bed, r, ctx.phase ?? 0.5, { kale: false });
  urnThriller(x, P, Lt, X, top, dc, R, season, r, 'front');
  urnSpillers(x, P, Lt, X, top, dc, y => (y > 1.62 ? S(1.3) : y > 1.34 ? S(1.2) : y > 1.02 ? S(0.95 + 0.22 * (y - 1.02) / 0.32) : S(0.5 + 0.45 * Math.max(0, y - 0.72) / 0.3)), season, r);
  // Part 9's snow on the lip's top
  if (ctx.snow > 0.05) { x.globalAlpha = Math.min(1, ctx.snow * 1.4); const q = arc(S(1.27), top + 0.02); x.strokeStyle = rgb(lit(Lt, [242, 246, 252], TOP)); x.lineWidth = Math.max(0.6, 0.08 * s); x.beginPath(); q.forEach((v, i) => (i ? x.lineTo(v[0], v[1]) : x.moveTo(v[0], v[1]))); x.stroke(); x.globalAlpha = 1; }
  x.restore();
}
/** the urn's THRILLER — the tall centre plant: autumn purple fountain grass (arching blades + soft plumes), summer a spiky green
 *  dracaena, spring tall white tulips, winter red-twig dogwood stems. part: 'back' (behind the flowers) | 'front' (the few in front) */
function urnThriller(x, P, Lt, X, y0, dc, R, season, r, part) {
  const s = P.s, n = season === 'autumn' ? 16 : season === 'summer' ? 14 : season === 'spring' ? 7 : 9;
  const rr = rngFrom(Math.round(X * 31 + 7) + (part === 'front' ? 3 : 0));
  for (let i = 0; i < n; i++) {
    const a = (i / n - 0.5) * 2.4 + (rr() - 0.5) * 0.25, front = Math.abs(a) < 0.5 && i % 3 === 0;
    if ((part === 'front') !== front) continue;
    const base = P(X + Math.sin(a) * 0.12, y0 + 0.3, dc + 0.1), lean = Math.sin(a);
    if (season === 'autumn') {
      // fountain grass: a burgundy blade arching out + a soft buff-pink plume on the tallest
      const h = 1.1 + rr() * 0.55, tip = P(X + lean * 0.9, y0 + 0.3 + h, dc), m = P(X + lean * 0.25, y0 + 0.3 + h * 0.95, dc);
      x.strokeStyle = rgb(lit(Lt, shade([112, 46, 58], (rr() - 0.5) * 0.2), [lean * 0.5, 0.7, -0.5])); x.lineWidth = Math.max(0.35, 0.035 * s);
      x.beginPath(); x.moveTo(base[0], base[1]); x.quadraticCurveTo(m[0], m[1], tip[0], tip[1] + 0.25 * s); x.stroke();
      if (i % 2 === 0) { const pl = P(X + lean * 0.62, y0 + 0.3 + h * 1.02, dc - 0.05); x.save(); x.translate(pl[0], pl[1]); x.rotate(lean * 0.7); const g = x.createLinearGradient(0, -0.3 * s, 0, 0.3 * s); g.addColorStop(0, rgb(lit(Lt, [214, 170, 160], [0, 0.8, -0.5]), 0.95)); g.addColorStop(1, rgb(lit(Lt, [150, 96, 100], [0, 0.4, -0.8]), 0.85)); x.fillStyle = g; x.beginPath(); x.ellipse(0, 0, 0.07 * s, 0.3 * s, 0, 0, Math.PI * 2); x.fill(); x.restore(); }
    } else if (season === 'summer') {
      // a dracaena spike: stiff narrow leaves fanning up, lighter along the midrib
      const h = 1.0 + rr() * 0.4, tip = P(X + lean * 0.55, y0 + 0.3 + h, dc);
      x.fillStyle = rgb(lit(Lt, [58, 108, 62], [lean * 0.6, 0.6, -0.5])); x.beginPath(); x.moveTo(base[0] - 0.04 * s, base[1]); x.lineTo(tip[0], tip[1]); x.lineTo(base[0] + 0.04 * s, base[1]); x.closePath(); x.fill();
      x.strokeStyle = rgb(rimCol(Lt, [120, 170, 96], [lean * 0.4, 0.8, -0.4]), 0.6); x.lineWidth = Math.max(0.2, 0.012 * s); x.beginPath(); x.moveTo(base[0], base[1]); x.lineTo(tip[0], tip[1]); x.stroke();
    } else if (season === 'spring') {
      // tall white tulips standing up out of the bed
      const h = 0.9 + rr() * 0.35, tip = P(X + lean * 0.35, y0 + 0.3 + h, dc - 0.1);
      line(x, base, tip, lit(Lt, [76, 124, 60], FRONT), Math.max(0.3, 0.028 * s));
      const w = 0.075 * s, hh = 0.15 * s; x.fillStyle = rgb(lit(Lt, [246, 242, 232], [0, 0.2, -1])); x.beginPath(); x.moveTo(tip[0] - w, tip[1] - hh); x.lineTo(tip[0], tip[1] - hh * 0.8); x.lineTo(tip[0] + w, tip[1] - hh); x.quadraticCurveTo(tip[0] + w, tip[1], tip[0], tip[1]); x.quadraticCurveTo(tip[0] - w, tip[1], tip[0] - w, tip[1] - hh); x.fill();
    } else {
      // red-twig dogwood: slim straight stems, bright red, a few side twigs
      const h = 1.1 + rr() * 0.4, tip = P(X + lean * 0.4, y0 + 0.3 + h, dc);
      line(x, base, tip, lit(Lt, [176, 40, 40], [lean * 0.5, 0.5, -0.7]), Math.max(0.35, 0.03 * s));
      const m = [(base[0] + tip[0]) / 2, (base[1] + tip[1]) / 2]; line(x, m, [m[0] + lean * 0.18 * s + 0.08 * s, m[1] - 0.2 * s], lit(Lt, [176, 40, 40], FRONT), Math.max(0.25, 0.02 * s));
    }
  }
}
/** the SPILLERS: vines trailing over the urn's lip and down its front (autumn lime sweet-potato vine, summer variegated ivy + white
 *  bacopa, spring ivy, winter cedar sprigs) — leaf by leaf, each lit by its own tilt */
function urnSpillers(x, P, Lt, X, y0, dc, prof, season, r) {
  // autumn: ivy (deep green) with a few burgundy leaves; summer: variegated ivy + white bacopa; spring: fresh ivy; winter: cedar sprigs
  const s = P.s, col = season === 'autumn' ? [[46, 92, 52], [62, 112, 60], [112, 46, 58]] : season === 'winter' ? [[52, 86, 62], [64, 98, 70], [46, 76, 56]] : [[56, 104, 56], [80, 132, 70], [196, 214, 170]];
  const vines = 6;
  for (let v = 0; v < vines; v++) {
    // each vine tumbles over the lip and down the bowl (hugging it), curving to one side, its leaves alternating + shrinking
    const a0 = -1.2 + 2.4 * (v + 0.2 + r() * 0.6) / vines, len = 0.35 + r() * 0.6, curl = (r() < 0.5 ? -1 : 1) * (0.25 + r() * 0.35);
    for (let t = 0, j = 0; t < len; t += 0.085, j++) {
      const y = y0 + 0.04 - t, a = a0 + curl * t * t, rr = prof(Math.max(0.72, y)) + 0.05 + 0.03 * Math.sin(t * 9), q = P(X + rr * Math.sin(a), y, dc - rr * Math.cos(a));
      const c = col[season === 'autumn' ? (r() < 0.16 ? 2 : (r() * 2) | 0) : (r() * 3) | 0], n = [Math.sin(a) * 0.6, 0.3, -Math.cos(a) * 0.8];
      const rot = (j % 2 ? 1 : -1) * (0.7 + r() * 0.4) + Math.sin(a) * 0.4, sz = 1 - 0.35 * (t / len);
      x.save(); x.translate(q[0], q[1]); x.rotate(rot);
      const w = (season === 'winter' ? 0.035 : 0.085) * s * sz, h = (season === 'winter' ? 0.12 : 0.085) * s * sz;
      x.fillStyle = rgb(lit(Lt, c, n)); x.beginPath(); x.moveTo(0, -h); x.quadraticCurveTo(w * 1.3, -h * 0.2, 0, h); x.quadraticCurveTo(-w * 1.3, -h * 0.2, 0, -h); x.fill();
      x.strokeStyle = rgb(rimCol(Lt, c, [0, 0.7, -0.6]), 0.45); x.lineWidth = Math.max(0.18, 0.01 * s); x.beginPath(); x.moveTo(0, -h * 0.8); x.lineTo(0, h * 0.8); x.stroke();
      x.restore();
    }
  }
  if (season === 'summer') for (let i = 0; i < 12; i++) { const a = (r() - 0.5) * 2.4, yy = y0 - r() * 0.3, ro = prof(yy) + 0.06, q = P(X + ro * Math.sin(a), yy, dc - ro * Math.cos(a)); blob(x, Lt, q, 0.035 * s, 0.03 * s, [248, 246, 240], 0); }
}
/** the bed's dome height at (u, d): the flowers mound up in the middle */
const dome = (B, u, d, H) => { const fu = u / ((B.u1 - B.u0) / 2), fd = (d - (B.d0 + B.d1) / 2) / ((B.d1 - B.d0) / 2); return B.y + H * Math.max(0.15, 1 - 0.5 * fu * fu - 0.35 * fd * fd); };
/** a round blob (a floret, a leaf clump, a bloom) lit as a little sphere: its body + a highlight toward the light */
function blob(x, Lt, p, rw, rh, c, hiK = 0.6) {
  x.fillStyle = rgb(lit(Lt, c, [0, 0.45, -0.9])); x.beginPath(); x.ellipse(p[0], p[1], rw, rh, 0, 0, Math.PI * 2); x.fill();
  if (hiK > 0) {
    const L = Lt.night > 0.5 ? Lt.ld : Lt.L, ox = Math.max(-0.5, Math.min(0.5, L[0])) * rw * 0.5, oy = -rh * 0.35;
    x.fillStyle = rgb(rimCol(Lt, c, [L[0] * 0.5, 0.8, -0.5]), hiK); x.beginPath(); x.ellipse(p[0] + ox, p[1] + oy, rw * 0.45, rh * 0.4, 0, 0, Math.PI * 2); x.fill();
  }
}
/** a mound of foliage over the bed (back to front), spilling a little over the front lip */
function foliage(x, P, Lt, B, r, cols, H, n = 46, size = 0.17) {
  // the mound's body first (no soil showing through): the bed's front + back edges at the mound's height, filled deep
  const e = [], N = 12;
  for (let i = 0; i <= N; i++) { const u = B.u0 + (B.u1 - B.u0) * i / N; e.push(P(B.X + u, dome(B, u, B.d1, H) - 0.1, B.d1)); }
  for (let i = N; i >= 0; i--) { const u = B.u0 + (B.u1 - B.u0) * i / N; e.push(P(B.X + u, dome(B, u, B.d0, H) - 0.06, B.d0 - 0.04)); }
  fillPts(x, e, lit(Lt, shade(cols[0], -0.3), [0, 0.6, -0.8]));
  const pts = [];
  for (let i = 0; i < n; i++) { const u = B.u0 + r() * (B.u1 - B.u0), d = B.d0 - 0.06 + r() * (B.d1 - B.d0 + 0.06); pts.push([u, d]); }
  pts.sort((a, b) => b[1] - a[1]);
  for (const [u, d] of pts) { const y = dome(B, u, d, H) - 0.08, p = P(B.X + u, y, d); blob(x, Lt, p, size * P.s * (0.8 + r() * 0.5), size * P.s * (0.55 + r() * 0.3), cols[(r() * cols.length) | 0], 0.35); }
}
function mums(x, P, Lt, B, r, phase, { kale: withKale = true } = {}) {
  const s = P.s, MUM = [[188, 72, 36], [232, 166, 46], [132, 34, 54], [214, 112, 40]];
  foliage(x, P, Lt, B, r, [[52, 84, 46], [64, 98, 52], [44, 72, 44]], 0.46, 70, 0.19);
  // the mum plants: domes of tiny florets, one colour each, in a loose grid (3 at the back, 4 at the front), ornamental kale
  // rosettes at the two front corners
  const plants = [];
  for (const [row, nn] of [[0.78, 3], [0.3, 4]]) for (let i = 0; i < nn; i++) plants.push({ u: B.u0 + (B.u1 - B.u0) * (i + 0.5) / nn + (r() - 0.5) * 0.1, d: B.d0 + (B.d1 - B.d0) * row, c: MUM[(i * 3 + (row > 0.5 ? 1 : 0) + (r() < 0.25 ? 2 : 0)) % MUM.length], kale: withKale && row < 0.5 && (i === 0 || i === nn - 1) });
  plants.sort((a, b) => b.d - a.d);
  for (const pl of plants) {
    if (pl.kale) { kale(x, P, Lt, B.X + pl.u, dome(B, pl.u, pl.d, 0.28) + 0.04, pl.d - 0.12); continue; }
    const top = dome(B, pl.u, pl.d, 0.66), rad = 0.36, fl = [];
    for (let k = 0; k < 48; k++) { const a = r() * Math.PI * 2, q = Math.sqrt(r()), du = Math.cos(a) * q * rad, dd = Math.sin(a) * q * rad * 0.8; fl.push([pl.u + du, pl.d + dd, top - q * q * 0.2]); }
    fl.sort((a, b) => b[1] - a[1] || a[2] - b[2]);
    const c = mix(pl.c, [120, 70, 40], 0.12 * phase);
    for (const [u, d, y] of fl) { const p = P(B.X + u, y, d); blob(x, Lt, p, 0.075 * s, 0.058 * s, shade(c, (r() - 0.5) * 0.2), 0.75); }
    // the eye of a few florets (a darker centre dot)
    for (let k = 0; k < 6; k++) { const a = r() * 6.28, q = r() * 0.7, p = P(B.X + pl.u + Math.cos(a) * q * rad, top - q * q * 0.2 + 0.02, pl.d + Math.sin(a) * q * rad * 0.8 - 0.02); x.fillStyle = rgb(lit(Lt, shade(c, -0.45), TOP), 0.7); x.fillRect(p[0] - 0.012 * s, p[1] - 0.012 * s, 0.025 * s, 0.025 * s); }
  }
}
function kale(x, P, Lt, u, y, d) {
  const s = P.s, p = P(u, y, d);
  // concentric ruffled leaves: blue-green outside, a creamy-violet heart
  [[0.3, [92, 126, 120]], [0.22, [124, 140, 142]], [0.15, [176, 120, 168]], [0.08, [226, 200, 222]]].forEach(([rr, c], i) => {
    const n = 9 - i;
    for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2 + i * 0.4, q = [p[0] + Math.cos(a) * rr * s * 0.6, p[1] + Math.sin(a) * rr * s * 0.32 - i * 0.03 * s]; blob(x, Lt, q, rr * s * 0.42, rr * s * 0.3, c, 0.45); }
  });
}
function geraniums(x, P, Lt, B, r) {
  const s = P.s;
  // trailing ivy over the front lip first (it hangs in front of the stone)
  ivy(x, P, Lt, B, r);
  foliage(x, P, Lt, B, r, [[60, 112, 52], [74, 128, 60], [52, 98, 46]], 0.5, 70, 0.21);
  // the zonal rings on a few leaves (a darker horseshoe — the geranium's mark)
  for (let i = 0; i < 10; i++) { const u = B.u0 + r() * (B.u1 - B.u0), d = B.d0 + r() * (B.d1 - B.d0), p = P(B.X + u, dome(B, u, d, 0.48) - 0.02, d); x.strokeStyle = rgb(lit(Lt, [40, 70, 34], TOP), 0.6); x.lineWidth = Math.max(0.25, 0.02 * s); x.beginPath(); x.ellipse(p[0], p[1], 0.08 * s, 0.05 * s, 0, 0, Math.PI * 2); x.stroke(); }
  // the flower heads: round umbels of scarlet florets held above the leaves (8), the odd white alyssum at the edges
  const heads = [];
  for (let i = 0; i < 8; i++) heads.push([B.u0 + 0.15 + (B.u1 - B.u0 - 0.3) * ((i % 4) + 0.5 + (r() - 0.5) * 0.4) / 4, B.d0 + (B.d1 - B.d0) * (i < 4 ? 0.72 : 0.28)]);
  heads.sort((a, b) => b[1] - a[1]);
  for (const [u, d] of heads) {
    const y = dome(B, u, d, 0.48) + 0.18 + r() * 0.1;
    line(x, P(B.X + u, y - 0.25, d), P(B.X + u, y, d), lit(Lt, [70, 110, 52], FRONT), Math.max(0.3, 0.025 * s));
    for (let k = 0; k < 9; k++) { const a = r() * 6.28, q = Math.sqrt(r()) * 0.13, p = P(B.X + u + Math.cos(a) * q, y + Math.sin(a) * q * 0.7 + 0.04, d); blob(x, Lt, p, 0.06 * s, 0.05 * s, shade([214, 36, 42], (r() - 0.5) * 0.18), 0.7); }
  }
  for (let i = 0; i < 14; i++) { const u = B.u0 + r() * (B.u1 - B.u0), d = B.d0 + (r() < 0.5 ? 0 : B.d1 - B.d0) * 0.9, p = P(B.X + u, dome(B, u, d, 0.4), d - 0.05); blob(x, Lt, p, 0.04 * s, 0.03 * s, [246, 244, 236], 0); }
}
function ivy(x, P, Lt, B, r) {
  const s = P.s, IVY = [[46, 92, 52], [60, 110, 60], [38, 78, 46]];
  for (let k = 0; k < 6; k++) {
    const u = B.u0 + (B.u1 - B.u0) * (k + 0.2 + r() * 0.6) / 6, y = B.y + 0.02, len = 0.45 + r() * 0.45;
    const sway = (r() - 0.5) * 0.25;
    for (let t = 0; t < len; t += 0.07) {
      const p = P(B.X + u + sway * t, y - t, B.front - 0.08), c = IVY[(r() * 3) | 0];
      x.fillStyle = rgb(lit(Lt, c, [0, 0.1, -1])); x.beginPath(); x.ellipse(p[0] + (t * 50 % 2 ? 1 : -1) * 0.04 * s, p[1], 0.06 * s, 0.045 * s, 0.4, 0, Math.PI * 2); x.fill();
    }
  }
}
function tulips(x, P, Lt, B, r) {
  const s = P.s;
  // the pansies: a low mound of leaves, faces of violet / yellow / cream with dark eyes
  foliage(x, P, Lt, B, r, [[66, 110, 56], [80, 126, 64]], 0.28, 64, 0.17);
  const PANSY = [[110, 64, 170], [244, 206, 60], [240, 236, 220], [150, 90, 200]];
  for (let i = 0; i < 24; i++) {
    const u = B.u0 + r() * (B.u1 - B.u0), d = B.d0 - 0.05 + r() * (B.d1 - B.d0) * 0.6, p = P(B.X + u, dome(B, u, d, 0.24) + 0.02, d), c = PANSY[(r() * 4) | 0];
    blob(x, Lt, p, 0.07 * s, 0.055 * s, c, 0.4); x.fillStyle = rgb(lit(Lt, [40, 24, 50], FRONT), 0.85); x.beginPath(); x.arc(p[0], p[1] + 0.005 * s, 0.022 * s, 0, Math.PI * 2); x.fill();
  }
  // the tulips: upright stems over the pansies, a broad leaf or two, cups (red / yellow) lit on one side
  const TUL = [[214, 36, 48], [246, 196, 44]], tl = [];
  for (let i = 0; i < 22; i++) tl.push([B.u0 + 0.1 + r() * (B.u1 - B.u0 - 0.2), B.d0 + (B.d1 - B.d0) * (0.3 + r() * 0.65), i]);
  tl.sort((a, b) => b[1] - a[1]);
  for (const [u, d, i] of tl) {
    const yb = dome(B, u, d, 0.24), yt = yb + 0.42 + r() * 0.22, c = TUL[(i + (r() < 0.2 ? 1 : 0)) % 2];
    const a = P(B.X + u, yb, d), b = P(B.X + u + (r() - 0.5) * 0.06, yt, d);
    if (i % 3 === 0) fillPts(x, [a, [a[0] + 0.1 * s, a[1] - 0.25 * s], [a[0] + 0.02 * s, a[1] - 0.32 * s]], lit(Lt, [86, 136, 84], [0.5, 0.3, -0.8]));
    line(x, a, b, lit(Lt, [76, 124, 60], FRONT), Math.max(0.3, 0.028 * s));
    const w = 0.075 * s, h = 0.14 * s, L = Lt.night > 0.5 ? Lt.ld[0] : Lt.L[0];
    x.fillStyle = rgb(lit(Lt, c, [0, 0.2, -1])); x.beginPath(); x.moveTo(b[0] - w, b[1] - h); x.lineTo(b[0] - w * 0.4, b[1] - h * 0.75); x.lineTo(b[0], b[1] - h); x.lineTo(b[0] + w * 0.4, b[1] - h * 0.75); x.lineTo(b[0] + w, b[1] - h); x.quadraticCurveTo(b[0] + w * 1.05, b[1], b[0], b[1]); x.quadraticCurveTo(b[0] - w * 1.05, b[1], b[0] - w, b[1] - h); x.fill();
    x.fillStyle = rgb(rimCol(Lt, c, [L * 0.6, 0.5, -0.7]), 0.65); x.beginPath(); x.ellipse(b[0] + (L >= 0 ? 0.35 : -0.35) * w, b[1] - h * 0.45, w * 0.32, h * 0.38, 0, 0, Math.PI * 2); x.fill();
  }
}
function evergreens(x, P, Lt, B, r, snow) {
  const s = P.s, GREEN = [[34, 70, 52], [46, 86, 60], [70, 104, 84], [88, 112, 64]];
  // a dense bed of greens first (the mound the boughs + twigs rise from)
  foliage(x, P, Lt, B, r, [[30, 62, 46], [40, 76, 54], [58, 92, 72]], 0.36, 60, 0.2);
  // the boughs: fronds radiating from the middle, each a curved stem with needles (back ones first), spilling over the lip
  const fronds = [];
  for (let i = 0; i < 40; i++) { const a = r() * Math.PI * 2, len = 0.6 + r() * 0.55; fronds.push({ a, len, c: GREEN[(r() * 4) | 0], d: Math.sin(a) }); }
  fronds.sort((f, g) => g.d - f.d);
  const cu = 0, cd = (B.d0 + B.d1) / 2, cy = B.y + 0.3;
  for (const f of fronds) {
    const ex = cu + Math.cos(f.a) * f.len * 1.25, ed = cd + Math.sin(f.a) * f.len * 0.85, ey = B.y + 0.12 + (f.d < 0 ? -0.12 : 0.16);
    const a = P(B.X + cu, cy, cd), m = P(B.X + (cu + ex) / 2, cy + 0.12, (cd + ed) / 2), b = P(B.X + ex, ey, ed);
    const col = lit(Lt, f.c, [Math.cos(f.a) * 0.3, 0.8, Math.sin(f.a) * 0.3 - 0.4]);
    x.strokeStyle = rgb(col); x.lineWidth = Math.max(0.5, 0.05 * s); x.beginPath(); x.moveTo(a[0], a[1]); x.quadraticCurveTo(m[0], m[1], b[0], b[1]); x.stroke();
    // needles: short strokes either side along the frond
    x.lineWidth = Math.max(0.35, 0.032 * s);
    for (let t = 0.15; t <= 1; t += 0.08) {
      const qx = (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * m[0] + t * t * b[0], qy = (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * m[1] + t * t * b[1], ln = 0.16 * s * (1.1 - t * 0.5);
      x.strokeStyle = rgb(shade(col, (t * 7 % 2) > 1 ? 0.1 : -0.1));
      x.beginPath(); x.moveTo(qx - ln, qy - ln * 0.5); x.lineTo(qx, qy); x.lineTo(qx + ln, qy - ln * 0.5); x.stroke();
    }
    if (snow > 0.05) { x.strokeStyle = rgb(lit(Lt, [240, 244, 252], TOP), Math.min(1, snow * 1.3)); x.lineWidth = Math.max(0.4, 0.05 * s); x.beginPath(); x.moveTo(a[0], a[1] - 0.03 * s); x.quadraticCurveTo(m[0], m[1] - 0.05 * s, b[0], b[1] - 0.03 * s); x.stroke(); }
  }
  // birch twigs standing up from the middle (white, with dark marks) — height + a winter read at a glance
  for (const u of [-0.25, 0.05, 0.3]) {
    const a = P(B.X + u, B.y, (B.d0 + B.d1) / 2 + 0.1), b = P(B.X + u * 1.4 + (r() - 0.5) * 0.1, B.y + 1.0 + r() * 0.3, (B.d0 + B.d1) / 2 + 0.1);
    line(x, a, b, lit(Lt, [226, 222, 212], FRONT), Math.max(0.4, 0.04 * s));
    for (let k = 0; k < 4; k++) { const t = 0.2 + k * 0.2, q = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; x.fillStyle = rgb(lit(Lt, [50, 46, 44], FRONT)); x.fillRect(q[0] - 0.02 * s, q[1], 0.04 * s, Math.max(0.3, 0.02 * s)); }
  }
  // pine cones (brown, scaled) + the red winterberries in clusters
  for (let i = 0; i < 4; i++) { const u = B.u0 + 0.2 + r() * (B.u1 - B.u0 - 0.4), d = B.d0 + r() * (B.d1 - B.d0) * 0.6, p = P(B.X + u, B.y + 0.22, d); blob(x, Lt, p, 0.07 * s, 0.1 * s, [112, 76, 46], 0.4); x.strokeStyle = rgb(lit(Lt, [70, 44, 28], FRONT), 0.8); x.lineWidth = Math.max(0.25, 0.015 * s); for (let k = -1; k <= 1; k++) { x.beginPath(); x.moveTo(p[0] - 0.06 * s, p[1] + k * 0.04 * s); x.lineTo(p[0] + 0.06 * s, p[1] + k * 0.04 * s - 0.02 * s); x.stroke(); } }
  for (let c = 0; c < 6; c++) {
    const u = B.u0 + 0.1 + r() * (B.u1 - B.u0 - 0.2), d = B.d0 + r() * (B.d1 - B.d0), y = B.y + 0.3 + r() * 0.3;
    const tw0 = P(B.X + u, B.y + 0.1, d), tw1 = P(B.X + u + 0.05, y + 0.1, d); line(x, tw0, tw1, lit(Lt, [92, 60, 44], FRONT), Math.max(0.3, 0.02 * s));
    for (let k = 0; k < 7; k++) { const p = P(B.X + u + (r() - 0.5) * 0.18, y + r() * 0.16, d - 0.02); blob(x, Lt, p, 0.04 * s, 0.04 * s, [200, 26, 34], 0.8); }
  }
}

// ------------------------------------------------------------------ THE INLAY (PF — the centrepiece spot: a BRICK COMPASS ROSE)
// The owner (PF): no raised ring, no medallion object — PAVING people walk over: an old-school compass rose laid in brick within
// the setts (core/harbor-centre.js#inlayPlan: a soldier-course border of bricks on end, a buff header course, the red field in
// concentric stretcher courses, an 8-point star in buff + a dark brown-red — each point split light / dark down its axis — round a
// small buff centre in a ring of dark headers; north away from us). Flush: every brick is a flat face in true perspective
// (project()), lit like the setts — by day the sky + the sun, a hair of light on each brick's far arris, the WEAR where feet go
// (polished smooth, lighter, the sky's sheen); at night the same baked LAMP POOLS the setts take (ctx.lightAt — stage.js#lightField),
// the polished bricks catching a little more. The event rig's four FLOOR SPOTS sit flush in the soldier course: a brass ring + a
// dark glass lens (barely a glint by day); centre.js lights them while a centrepiece stands here.
const BRICK = { red: { d: [168, 80, 58], g: [198, 100, 72], n: [80, 46, 56] }, buff: { d: [222, 196, 152], g: [242, 186, 138], n: [100, 92, 104] },
  dark: { d: [82, 42, 38], g: [104, 52, 46], n: [44, 30, 42] }, mortar: { d: [146, 136, 122], g: [164, 124, 104], n: [58, 54, 70] } };
// (at night the lamps' light lands on a brick by its colour — the red stays red under the cool street lamps, never a grey wash)
const ALB = { red: [0.66, 0.31, 0.23], buff: [0.87, 0.77, 0.6], dark: [0.32, 0.17, 0.15] };
const triT = (T, k) => [0, 1, 2].map(i => k.d[i] * (T.day || 0) + k.g[i] * (T.gold || 0) + k.n[i] * (T.night || 0));
const addL = (c, l, k) => [Math.min(255, c[0] + l[0] * k), Math.min(255, c[1] + l[1] * k), Math.min(255, c[2] + l[2] * k)];

/** THE INLAY, flush in the paving (drawn with the ground, before everything that stands): m = { x, z, ring } (L.medallion);
 *  ctx.lightAt(x, z) → the baked lamps' light there (stage.js), or none by day */
export function drawInlay(x, cam, m, T, ctx = {}) {
  const pl = inlayPlan(m), R = pl.R, r = rngFrom(seedOf(m.x, m.z) + 5), s = cam.F / m.z;
  const day = (T.day || 0) + 0.7 * (T.gold || 0), night = T.night || 0, ovc = T.ovc || 0;
  const G = (rad, a) => project(cam, m.x + Math.cos(a) * rad, 0, m.z + Math.sin(a) * rad);
  const W = (wx, wz) => project(cam, wx, 0, wz);
  const lightAt = ctx.lightAt || null;
  const tone = { red: triT(T, BRICK.red), buff: triT(T, BRICK.buff), dark: triT(T, BRICK.dark) }, mortar = triT(T, BRICK.mortar);
  // the sky's sheen on polished brick by day (warm at golden hour), the arris's hair of light
  const sheen = mix([238, 236, 232], [255, 206, 160], (T.gold || 0) / Math.max(0.01, (T.day || 0) + (T.gold || 0))), lipK = 0.16 * day * (1 - 0.5 * ovc);
  /** a brick's colour: its tone, its own shade, the wear, the lamps' pool where it lies */
  const brickCol = (tn, bx, bz, v, hj = 0) => {
    // its own shade (v) + a hue of its own (hj: a warmer orange one, a cooler purple-brown clinker), the wear, the lamps
    let c = tone[tn].map((q, i) => q * v + hj * [16, 5, -7][i] * (0.4 + 0.6 * day));
    const w = wearAt(bx - m.x, bz - m.z, R);
    if (day > 0) c = mix(c, sheen, 0.2 * w * day * (1 - 0.4 * ovc));
    const lt = lightAt ? lightAt(bx, bz) : null, al = ALB[tn];
    if (lt) c = c.map((q, i) => Math.min(255, q + lt[i] * (0.2 + 0.95 * al[i]) * (1 + 0.35 * w)));
    else if (night > 0) c = addL(c, [10, 10, 16], w * night);   // (the polish holds a little of the city's glow)
    return c.map(q => Math.max(0, q));
  };
  const poly = (pts, col) => { x.beginPath(); pts.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.closePath(); x.fillStyle = rgb(col); x.fill(); };
  const lineW = Math.max(0.3, 0.035 * s);
  /** an annular brick: radii r0..r1, angles a0..a1 (inset by the joint) → filled, its far arris lit */
  const GAP = 0.05;
  const arcBrick = (r0, r1, a0, a1, tn, v) => {
    const ga = GAP / 2 / Math.max(0.2, (r0 + r1) / 2), q0 = r0 + GAP / 2, q1 = r1 - GAP / 2, b0 = a0 + ga, b1 = a1 - ga, am = (a0 + a1) / 2, rm = (r0 + r1) / 2;
    const n = Math.max(1, Math.ceil((b1 - b0) * rm / 0.3)), pts = [];
    for (let i = 0; i <= n; i++) pts.push(G(q1, b0 + (b1 - b0) * i / n));
    for (let i = n; i >= 0; i--) pts.push(G(q0, b0 + (b1 - b0) * i / n));
    const c = brickCol(tn, m.x + Math.cos(am) * rm, m.z + Math.sin(am) * rm, v, r() - 0.5);
    poly(pts, c);
    // (the far arris — the edge away from us catches the sky: the outer edge on the far half, the inner on the near half)
    if (lipK > 0.01) {
      const far = Math.sin(am) > 0 ? q1 : q0;
      x.strokeStyle = rgb(mix(c, [255, 252, 244], 0.55), lipK * 2.4); x.lineWidth = lineW * 0.8;
      x.beginPath(); for (let i = 0; i <= n; i++) { const p = G(far, b0 + (b1 - b0) * i / n); if (i) x.lineTo(p[0], p[1]); else x.moveTo(p[0], p[1]); } x.stroke();
    }
  };
  // 1. the setting: a mortar disc a little wider than the inlay (the setts meet its border in a clean joint)
  { const pts = []; for (let i = 0; i < 96; i++) pts.push(G(R + 0.06, i / 96 * Math.PI * 2)); poly(pts, lightAt ? addL(mortar, lightAt(m.x, m.z) || [0, 0, 0], 0.42) : mortar); }
  // 2. the soldier course (bricks on end, radial), each its own shade, now and then a darker flashed one
  { const S = pl.soldier;
    for (let i = 0; i < S.n; i++) { const a0 = i / S.n * Math.PI * 2, q = r(); arcBrick(S.r0, S.r1, a0, a0 + Math.PI * 2 / S.n, q < 0.1 ? 'dark' : 'red', 0.8 + r() * 0.3); } }
  // 3. the buff header course
  { const S = pl.header; for (let i = 0; i < S.n; i++) { const a0 = (i + 0.5) / S.n * Math.PI * 2; arcBrick(S.r0, S.r1, a0, a0 + Math.PI * 2 / S.n, 'buff', 0.88 + r() * 0.2); } }
  // 4. the red field: concentric stretcher courses, staggered (the joints never line up course to course)
  for (const c of pl.courses) for (let i = 0; i < c.n; i++) { const a0 = (i + c.off) / c.n * Math.PI * 2; arcBrick(c.r0, c.r1, a0, a0 + Math.PI * 2 / c.n, r() < 0.06 ? 'dark' : 'red', 0.8 + r() * 0.3); }
  // 5. THE STAR: the short points first, the long over them; each point's two halves in its two tones, laid in courses along the
  //    point's axis (a joint line down each half + cross joints) — the light half's far arris lit
  const order = [...pl.star].sort((a, b) => (a.cardinal ? 1 : 0) - (b.cardinal ? 1 : 0));
  for (const p of order) {
    const ax = [Math.cos(p.a), Math.sin(p.a)], pp = [-ax[1], ax[0]];
    const O = [m.x, m.z], Tp = [m.x + ax[0] * p.len, m.z + ax[1] * p.len];
    for (const [side, tn] of [[1, p.tones[0]], [-1, p.tones[1]]]) {
      const S = [m.x + ax[0] * p.w + pp[0] * p.w * side, m.z + ax[1] * p.w + pp[1] * p.w * side];
      const tri = [W(O[0], O[1]), W(S[0], S[1]), W(Tp[0], Tp[1])];
      const cx = (O[0] + S[0] + Tp[0]) / 3, cz = (O[1] + S[1] + Tp[1]) / 3;
      const c = brickCol(tn, cx, cz, 0.94 + r() * 0.1);
      poly(tri, c);
      // its bricks: a joint along the half (from the axis' middle toward the tip) + cross joints, in the mortar's tone
      x.save(); x.beginPath(); x.moveTo(tri[0][0], tri[0][1]); x.lineTo(tri[1][0], tri[1][1]); x.lineTo(tri[2][0], tri[2][1]); x.closePath(); x.clip();
      const jc = lightAt ? addL(mortar, lightAt(cx, cz) || [0, 0, 0], 0.42) : mortar;
      x.strokeStyle = rgb(jc, 0.85); x.lineWidth = lineW;
      x.beginPath();
      for (const f of [0.5]) { const a = W(O[0] + pp[0] * p.w * side * f, O[1] + pp[1] * p.w * side * f), b = W(Tp[0], Tp[1]); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); }
      for (let d = 0.42; d < p.len; d += 0.42) { const a = W(m.x + ax[0] * d, m.z + ax[1] * d), b = W(m.x + ax[0] * d + pp[0] * side * 0.6, m.z + ax[1] * d + pp[1] * side * 0.6); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); }
      x.stroke(); x.restore();
      // the axis joint (the point's spine) — a fine mortar line; the light half's outer arris catching the sky by day
      if (lipK > 0.01 && tn === 'buff') { x.strokeStyle = rgb(mix(c, [255, 252, 244], 0.6), lipK * 2.2); x.lineWidth = lineW * 0.8; x.beginPath(); x.moveTo(tri[1][0], tri[1][1]); x.lineTo(tri[2][0], tri[2][1]); x.stroke(); }
    }
    x.strokeStyle = rgb(mortar, 0.9); x.lineWidth = lineW; const a = W(O[0], O[1]), b = W(Tp[0], Tp[1]); x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke();
  }
  // 6. the centre: a ring of dark headers round a buff stone
  { const S = pl.centre; for (let i = 0; i < S.n; i++) { const a0 = i / S.n * Math.PI * 2; arcBrick(S.r0, S.r1, a0, a0 + Math.PI * 2 / S.n, 'dark', 0.9 + r() * 0.2); } }
  { const pts = []; for (let i = 0; i < 24; i++) pts.push(G(pl.stone - 0.02, i / 24 * Math.PI * 2)); poly(pts, brickCol('buff', m.x, m.z, 1.02)); }
  // 7. THE RIG's floor spots, flush in the soldier course: a brass ring (a glint by day) round a dark glass lens
  const Lt = lightFor(T, ctx, m.x, m.z);
  for (const sp of rigSpots(m)) {
    const ell = (rad, col, a = 1) => { const [cx0, cy0] = W(sp.x, sp.z), [xr] = W(sp.x + rad, sp.z), [, yn] = W(sp.x, sp.z - rad), [, yf] = W(sp.x, sp.z + rad); x.fillStyle = rgb(col, a); x.beginPath(); x.ellipse(cx0, (yn + yf) / 2, Math.max(0.3, xr - cx0), Math.max(0.2, (yn - yf) / 2), 0, 0, Math.PI * 2); x.fill(); return [cx0, (yn + yf) / 2, xr - cx0, (yn - yf) / 2]; };
    ell(RIG.ring + 0.03, lightAt ? addL(mortar, lightAt(sp.x, sp.z) || [0, 0, 0], 0.42) : mortar);
    ell(RIG.ring, lit(Lt, shade(BRASS, -0.12), TOP, 0.9));
    const [lx, ly, rx, ry] = ell(RIG.lens, lit(Lt, [30, 34, 40], TOP, 0.6));
    // the glass's glint: the sky by day, the lamps' light at night (tiny — a lens set flush, not a lamp)
    const gk = day * (1 - 0.6 * ovc) * 0.55 + night * Math.max(0.15, Lt.lk) * 0.35;
    if (gk > 0.03) { x.fillStyle = rgb(night > 0.5 ? Lt.lcol : [255, 255, 255], Math.min(0.8, gk)); x.beginPath(); x.ellipse(lx - rx * 0.3, ly - ry * 0.35, Math.max(0.25, rx * 0.32), Math.max(0.15, ry * 0.3), 0, 0, Math.PI * 2); x.fill(); }
  }
}
/** (the old name: stage.js + the tests call the centrepiece spot's ground piece by it) */
export const drawMedallion = drawInlay;

// ------------------------------------------------------------------ THE MAILBOX (PF — a street-furniture accent)
// A 1920s U.S. collection box in its period OLIVE GREEN (the Post Office's colour until the 1950s): a cast-iron pillar on a short
// pedestal (a stepped foot, a tapering neck, a collar), the box's square body with chamfered corners, a flanged DOMED cap + a knob;
// on its face the hinged SLOT FLAP under a little hood, the raised "U.S. MAIL" band, the collection door (inset, its lock) with the
// enamel COLLECTION-TIMES plate, a small eagle boss on the neck. Worn the way old ironwork wears: the corners + the flap rubbed
// down to dark iron, a few chips, rust at the foot, rain streaks under the cap. Exaggerated a little for the phone (~1.85 units —
// like the bench). Lit by the ONE light model: the sun by day, the nearest lamp at night (+ the bounce off the lit cobbles).
const OLIVE = [92, 104, 58], IRON_D = [46, 44, 40], ENAMEL = [232, 226, 206];
/** b = { x, z } (world: the box's front face at z) */
export function drawMailbox(x, cam, b, T, ctx = {}) {
  const e = 1.5, P = frame(cam, b.z, e), s = P.s, X = b.x, Lt = lightFor(T, ctx, b.x, b.z + 0.3), r = rngFrom(seedOf(b.x, b.z) + 11);
  const seeL = X > 0, sideN = seeL ? LEFT : RIGHT, sgn = seeL ? -1 : 1;     // (we see the side facing the middle of the screen)
  const col = n => lit(Lt, OLIVE, n, 0.35);
  x.save(); x.lineJoin = 'round'; x.lineCap = 'round';
  /** a vertical face from (xa, da) to (xb, db) between heights y0..y1, its colour shaded toward the foot (ambient occlusion) */
  const vface = (xa, da, xb, db, y0, y1, n, c = OLIVE, k = 0.16) => {
    const top = lit(Lt, c, n, 0.35), q = [P(xa, y0, da), P(xb, y0, db), P(xb, y1, db), P(xa, y1, da)];
    const g = x.createLinearGradient(0, q[0][1], 0, q[3][1]); g.addColorStop(0, rgb(shade(top, -k))); g.addColorStop(1, rgb(top));
    fillPts(x, q, g);
    return q;
  };
  // 1. the pedestal: the stepped foot, the tapering neck, the collar
  const ped = (hw0, hw1, y0, y1, d0, d1) => {
    vface(X + sgn * hw0, d1, X + sgn * hw0, d0, y0, y1, sideN);   // (its side — straight; the taper reads on the front)
    const q = [P(X - hw0, y0, d0), P(X + hw0, y0, d0), P(X + hw1, y1, d0), P(X - hw1, y1, d0)];
    const g = x.createLinearGradient(0, q[0][1], 0, q[2][1]); g.addColorStop(0, rgb(shade(col(FRONT), -0.2))); g.addColorStop(1, rgb(col(FRONT)));
    fillPts(x, q, g);
    if (y1 < P.camh) fillPts(x, [P(X - hw1, y1, d0), P(X + hw1, y1, d0), P(X + hw1, y1, d1), P(X - hw1, y1, d1)], col(TOP));
  };
  pbox(x, P, Lt, OLIVE, { x0: X - 0.38, x1: X + 0.38, y0: 0, y1: 0.08, d0: 0, d1: 0.74 });
  pbox(x, P, Lt, OLIVE, { x0: X - 0.32, x1: X + 0.32, y0: 0.08, y1: 0.15, d0: 0.07, d1: 0.67 });
  ped(0.24, 0.18, 0.15, 0.46, 0.17, 0.57);
  pbox(x, P, Lt, OLIVE, { x0: X - 0.36, x1: X + 0.36, y0: 0.46, y1: 0.53, d0: 0.05, d1: 0.69 });
  // the eagle boss on the neck (a small raised oval: lit on its top, shade under)
  { const p = P(X, 0.3, 0.17); x.fillStyle = rgb(col([0, -0.3, -1])); x.beginPath(); x.ellipse(p[0], p[1], 0.09 * s, 0.065 * s, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = rgb(rimCol(Lt, OLIVE, [0, 0.8, -0.6]), 0.8); x.beginPath(); x.ellipse(p[0], p[1] - 0.02 * s, 0.06 * s, 0.03 * s, 0, Math.PI, 0); x.fill(); }
  // rust at the foot (the iron where the rain splashes)
  for (let i = 0; i < 9; i++) { const p = P(X + (r() - 0.5) * 0.8, r() * 0.12, 0); x.fillStyle = rgb(lit(Lt, r() < 0.5 ? [132, 70, 40] : [96, 56, 36], FRONT), 0.55); x.fillRect(p[0], p[1], Math.max(0.35, 0.05 * s), Math.max(0.3, 0.03 * s)); }
  // 2. the body: the side, the near chamfer, the front (square with chamfered corners)
  const B = { hw: 0.33, c: 0.08, d0: 0.1, d1: 0.62, y0: 0.53, y1: 1.5 };
  vface(X + sgn * B.hw, B.d1 - B.c, X + sgn * B.hw, B.d0 + B.c, B.y0, B.y1, sideN);
  const chN = norm([sgn, 0, -1]);
  vface(X + sgn * B.hw, B.d0 + B.c, X + sgn * (B.hw - B.c), B.d0, B.y0, B.y1, chN);
  vface(X + sgn * (B.hw - B.c), B.d0, X - sgn * (B.hw - B.c), B.d0, B.y0, B.y1, FRONT);
  // the far chamfer, seen edge-on: a thin strip (it catches the light from its side)
  vface(X - sgn * (B.hw - B.c), B.d0, X - sgn * (B.hw - B.c * 0.4), B.d0 + B.c * 0.6, B.y0, B.y1, norm([-sgn, 0, -1]));
  // the corners rubbed to dark iron + a lit edge (the wear)
  const F = (u, y) => P(X + u, y, B.d0);
  for (const u of [-(B.hw - B.c), B.hw - B.c]) line(x, F(u, B.y0 + 0.05), F(u, B.y1 - 0.02), rimCol(Lt, OLIVE, norm([Math.sign(u), 0.2, -1])), Math.max(0.3, 0.022 * s), 0.7);
  // 3. the face: the collection door (an inset panel: its top + left edges in shade, the bottom + right lit), its lock
  { const x0 = -0.2, x1 = 0.2, y0 = 0.62, y1 = 1.04, dk = lit(Lt, shade(OLIVE, -0.4), FRONT), hi = rimCol(Lt, OLIVE, [0, -0.5, -1]), w = Math.max(0.3, 0.02 * s);
    line(x, F(x0, y1), F(x1, y1), dk, w, 0.9); line(x, F(x0, y0), F(x0, y1), dk, w, 0.9);
    line(x, F(x0, y0), F(x1, y0), hi, w, 0.7); line(x, F(x1, y0), F(x1, y1), hi, w, 0.7);
    const k = F(0.14, 0.72); x.fillStyle = rgb(lit(Lt, BRASS, FRONT, 0.9)); x.beginPath(); x.arc(k[0], k[1], Math.max(0.4, 0.028 * s), 0, Math.PI * 2); x.fill();
    // the enamel COLLECTION-TIMES plate (cream, its lines of hours in dark ink)
    const pa = F(-0.13, 1.0), pb = F(0.13, 0.82);
    x.fillStyle = rgb(lit(Lt, ENAMEL, FRONT, 0.6)); x.fillRect(pa[0], pa[1], pb[0] - pa[0], pb[1] - pa[1]);
    x.fillStyle = rgb(lit(Lt, [40, 52, 70], FRONT), 0.75);
    for (let i = 0; i < 4; i++) { const ya = pa[1] + (pb[1] - pa[1]) * (0.18 + i * 0.2); x.fillRect(pa[0] + (pb[0] - pa[0]) * 0.14, ya, (pb[0] - pa[0]) * (i ? 0.72 : 0.5), Math.max(0.25, 0.012 * s)); } }
  // the raised "U.S. MAIL" band (a lit top edge, the letters cast in relief — a band of light + shade, not meant to be read)
  { const ya = 1.1, yb = 1.22, a = F(-B.hw + B.c + 0.02, yb), c2 = F(B.hw - B.c - 0.02, ya);
    x.fillStyle = rgb(col([0, 0.15, -1])); x.fillRect(a[0], a[1], c2[0] - a[0], c2[1] - a[1]);
    line(x, F(-B.hw + B.c + 0.02, yb), F(B.hw - B.c - 0.02, yb), rimCol(Lt, OLIVE, [0, 0.9, -0.5]), Math.max(0.3, 0.018 * s), 0.8);
    const px = Math.max(1.6, 0.1 * s), m = F(0, (ya + yb) / 2);
    x.font = FONT(px); x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = rgb(lit(Lt, shade(OLIVE, -0.45), FRONT), 0.9); x.fillText('U.S. MAIL', m[0] + 0.012 * s, m[1] + 0.012 * s);
    x.fillStyle = rgb(rimCol(Lt, OLIVE, [0, 0.6, -0.8]), 0.85); x.fillText('U.S. MAIL', m[0], m[1]); }
  // the SLOT under its hinged flap: a hood standing out from the face (its top lit, its lip worn to iron), the dark slot beneath
  { const ya = 1.3, yb = 1.42, hw = 0.19, out = 0.07;
    const slot = [F(-hw + 0.02, ya + 0.015), F(hw - 0.02, ya + 0.015), F(hw - 0.02, ya - 0.025), F(-hw + 0.02, ya - 0.025)];
    fillPts(x, slot, lit(Lt, [16, 16, 18], FRONT));
    fillPts(x, [P(X - hw, yb, B.d0), P(X + hw, yb, B.d0), P(X + hw, ya + 0.02, B.d0 - out), P(X - hw, ya + 0.02, B.d0 - out)], col(norm([0, 0.55, -0.8])));
    line(x, P(X - hw, ya + 0.02, B.d0 - out), P(X + hw, ya + 0.02, B.d0 - out), lit(Lt, IRON_D, FRONT, 0.6), Math.max(0.35, 0.03 * s), 0.95);
    line(x, P(X - hw + 0.05, ya + 0.025, B.d0 - out), P(X + hw - 0.05, ya + 0.025, B.d0 - out), rimCol(Lt, IRON_D, [0, 0.3, -1]), Math.max(0.25, 0.012 * s), 0.6); }
  // paint chips + rain streaks (from under the cap, down the face + the side)
  for (let i = 0; i < 7; i++) { const p = F((r() - 0.5) * 0.6, 0.58 + r() * 0.86); x.fillStyle = rgb(lit(Lt, IRON_D, FRONT), 0.6); x.fillRect(p[0], p[1], Math.max(0.3, 0.025 * s), Math.max(0.25, 0.018 * s)); }
  for (let i = 0; i < 6; i++) { const u = (r() - 0.5) * 0.62, l = 0.25 + r() * 0.5; line(x, F(u, B.y1 - 0.02), F(u + (r() - 0.5) * 0.02, B.y1 - l), lit(Lt, shade(OLIVE, -0.35), FRONT), Math.max(0.25, 0.016 * s), 0.35); }
  for (let i = 0; i < 3; i++) { const d = B.d0 + B.c + r() * (B.d1 - B.d0 - 2 * B.c), l = 0.2 + r() * 0.4; line(x, P(X + sgn * B.hw, B.y1 - 0.02, d), P(X + sgn * B.hw, B.y1 - l, d), lit(Lt, shade(OLIVE, -0.35), sideN), Math.max(0.25, 0.016 * s), 0.35); }
  // 4. the cap: a flange standing out all round, the dome over it, a knob on top
  const dc = (B.d0 + B.d1) / 2, flange = 0.39, dome = 0.36;
  const ellAt = (y, rr) => { const [cx0, cy0] = P(X, y, dc), [xr] = P(X + rr, y, dc), [, yn] = P(X, y, dc - rr), [, yf] = P(X, y, dc + rr); return { cx: cx0, cy: (yn + yf) / 2, rx: xr - cx0, ry: Math.max(0.3, (yn - yf) / 2), cy0 }; };
  { const a = ellAt(1.5, flange), c2 = ellAt(1.56, flange);
    x.fillStyle = rgb(lit(Lt, shade(OLIVE, -0.12), [0, -0.2, -1])); x.beginPath(); x.ellipse(a.cx, a.cy, a.rx, a.ry, 0, 0, Math.PI); x.ellipse(c2.cx, c2.cy, c2.rx, c2.ry, 0, Math.PI, 0, true); x.closePath(); x.fill();
    x.fillStyle = rgb(col(TOP)); x.beginPath(); x.ellipse(c2.cx, c2.cy, c2.rx, c2.ry, 0, 0, Math.PI * 2); x.fill();
    line(x, [c2.cx - c2.rx * 0.8, c2.cy + c2.ry * 0.62], [c2.cx + c2.rx * 0.8, c2.cy + c2.ry * 0.62], rimCol(Lt, OLIVE, [0, 0.7, -0.7]), Math.max(0.3, 0.02 * s), 0.6); }
  { const a = ellAt(1.56, dome), [, top] = P(X, 1.84, dc), hh = a.cy - top;
    const g = x.createLinearGradient(a.cx - a.rx, 0, a.cx + a.rx, 0), lsd = Lt.night > 0.5 ? Math.sign(Lt.ld[0]) || 1 : Lt.sd >= 0 ? 1 : -1;
    const sh = col([-0.7 * lsd, 0.55, -0.45]), hi = col([0.6 * lsd, 0.65, -0.45]);
    g.addColorStop(0, rgb(lsd > 0 ? sh : hi)); g.addColorStop(0.5, rgb(col([0, 0.75, -0.65]))); g.addColorStop(1, rgb(lsd > 0 ? hi : sh));
    x.fillStyle = g; x.beginPath(); x.ellipse(a.cx, a.cy, a.rx, a.ry, 0, 0, Math.PI); x.ellipse(a.cx, a.cy, a.rx, hh, 0, Math.PI, 0); x.closePath(); x.fill();
    // the dome's sheen (the sky by day, the lamp at night) + its knob
    x.fillStyle = rgb(rimCol(Lt, OLIVE, [0.3 * lsd, 0.9, -0.3]), 0.55); x.beginPath(); x.ellipse(a.cx + lsd * a.rx * 0.32, a.cy - hh * 0.55, a.rx * 0.28, hh * 0.22, 0, 0, Math.PI * 2); x.fill();
    const k = P(X, 1.88, dc); x.fillStyle = rgb(col([0, 0.6, -0.8])); x.beginPath(); x.arc(k[0], k[1], Math.max(0.5, 0.06 * s), 0, Math.PI * 2); x.fill();
    x.fillStyle = rgb(rimCol(Lt, OLIVE, [0.4 * lsd, 0.8, -0.4]), 0.8); x.beginPath(); x.arc(k[0] + lsd * 0.02 * s, k[1] - 0.025 * s, Math.max(0.25, 0.022 * s), 0, Math.PI * 2); x.fill(); }
  // snow on the cap (Part 9)
  if (ctx.snow > 0.05) { const a = ellAt(1.62, 0.36); x.globalAlpha = Math.min(1, ctx.snow * 1.4); x.fillStyle = rgb(lit(Lt, [240, 244, 250], TOP)); x.beginPath(); x.ellipse(a.cx, a.cy - a.ry * 0.6, a.rx, a.ry * 1.2, 0, 0, Math.PI * 2); x.fill(); x.globalAlpha = 1; }
  x.restore();
}
/** the mailbox on screen (pt): its foot to the knob (drawMailbox's frame) */
export function mailboxBox(cam, b) {
  const P = frame(cam, b.z, 1.5), pts = [];
  for (const u of [-0.45, 0.45]) for (const [y, d] of [[0, 0], [0, 0.74], [1.92, 0.36], [1.92, 0]]) pts.push(P(b.x + u, y, d));
  return boxOf(pts);
}

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
/** the props' light model + frame for the holiday parts' centrepieces (11a–c): frame(cam, z, e) → P(x, y, d); lightFor(T, ctx, x, z)
 *  → Lt; lit(Lt, colour, normal, gloss) → [r, g, b]; rimCol; pbox (a lit box); fillPts; line; propShadow(x, cam, { x, z, shapes },
 *  'custom', T) — shapes: { e, boxes, contact } like shadowShapes' */
export const PROP_KIT = Object.freeze({ frame, lightFor, lit, rimCol, pbox, fillPts, line, norm });

// ------------------------------------------------------------------ THE SHADOWS
// The boxes a prop's shadow is made of (in its own frame's numbers): { x0, x1, y0, y1, d0, d1 } relative to the prop's x (u) and z
// (d); the cart's umbrella a disc. Every box's shadow on the ground = the hull of its foot + its top, each pushed along the sun by
// its height (stage.js#sunShadow): ONE soft fill for the whole prop (the overlaps union), then a contact shadow under it always.
function shadowShapes(kind, it) {
  if (it.shapes) return it.shapes;                     // (PF: a centrepiece's own — { e, boxes, contact })
  if (kind === 'mailbox') return { e: 1.5, boxes: [{ x0: -0.4, x1: 0.4, y0: 0, y1: 0.53, d0: 0.05, d1: 0.7 }, { x0: -0.42, x1: 0.42, y0: 0.53, y1: 1.62, d0: 0.05, d1: 0.7 }, { x0: -0.3, x1: 0.3, y0: 1.62, y1: 1.88, d0: 0.15, d1: 0.6 }],
    contact: [{ x0: -0.47, x1: 0.47, d0: -0.03, d1: 0.78, a: 0.5 }] };
  if (kind === 'bench') {
    const hw = (it.w || PIECE.bench.w) / 2;
    return { e: 1.8, boxes: [{ x0: -hw, x1: hw, y0: 0.53, y1: 0.6, d0: 0.04, d1: 0.7 }, { x0: -hw + 0.04, x1: hw - 0.04, y0: 0.82, y1: 1.32, d0: 0.75, d1: 0.86 },
      ...[-hw + 0.2, 0, hw - 0.2].map(u => ({ x0: u - 0.06, x1: u + 0.06, y0: 0, y1: 0.95, d0: 0.02, d1: 0.76 }))], contact: [{ x0: -hw, x1: hw, d0: 0, d1: 0.8, a: 0.42 }] };
  }
  if (kind === 'cart') {
    const R = PIECE.cart.umb;
    return { e: 1.5, boxes: [{ x0: -1.22, x1: 1.22, y0: 0.8, y1: 1.92, d0: 0.12, d1: 1.18 }, { x0: -1.0, x1: 1.0, y0: 0, y1: 1.2, d0: 0, d1: 1.24 }, { x0: -0.08, x1: 0.02, y0: 1.9, y1: 4.06, d0: 0.8, d1: 0.9 }, { x0: 0.25, x1: 1.0, y0: 1.9, y1: 3.3, d0: 0.4, d1: 0.95 }],
      disc: { u: -0.05, d: 0.85, r: R, y: 4.2 }, contact: [{ x0: -1.3, x1: 1.3, d0: 0, d1: 1.25, a: 0.32 }, { x0: -1.05, x1: -0.55, d0: -0.08, d1: 0.1, a: 0.55 }, { x0: 0.55, x1: 1.05, d0: -0.08, d1: 0.1, a: 0.55 }] };
  }
  // (FP: the urn — its plinth, its bowl + lip, the planting over it)
  const k = (it.w || PIECE.planter.w) / 2.6, c = 0.95 * k;
  return { e: 1.35, boxes: [{ x0: -0.86 * k, x1: 0.86 * k, y0: 0, y1: 0.34, d0: c - 0.86 * k, d1: c + 0.86 * k }, { x0: -0.4 * k, x1: 0.4 * k, y0: 0.34, y1: 0.75, d0: c - 0.4 * k, d1: c + 0.4 * k }, { x0: -1.15 * k, x1: 1.15 * k, y0: 0.9, y1: 1.76, d0: c - 0.9 * k, d1: c + 0.9 * k }, { x0: -0.8 * k, x1: 0.8 * k, y0: 1.76, y1: 2.6, d0: c - 0.6 * k, d1: c + 0.6 * k }],
    contact: [{ x0: -0.92 * k, x1: 0.92 * k, d0: c - 0.92 * k, d1: c + 0.9 * k, a: 0.5 }] };
}
/** a prop's cast shadow on the cobbles by day (kind: 'bench' | 'cart' | 'planter' | 'mailbox' | 'custom' with item.shapes), along the real sun (T.sunDir, T.sunEl); none
 *  under an overcast deck (T.ovc ≥ 0.5) or at night — and its CONTACT shadow, always (soft, a little darker right under it) */
export function propShadow(x, cam, item, kind, T, ctx = {}) {
  const S = shadowShapes(kind, item), P = frame(cam, item.z, S.e), s = P.s, X = item.x;
  const sh = sunShadow(T, 1);
  if (sh) {
    // (the frame exaggerates depth by e: the shadow's reach back is the world's, so divide it out)
    const g = (u, y, d) => P(X + u + sh.dx * y, 0, d + sh.dz * y / S.e);
    const hulls = S.boxes.map(b => { const pts = []; for (const y of [b.y0, b.y1]) for (const [u, d] of [[b.x0, b.d0], [b.x1, b.d0], [b.x1, b.d1], [b.x0, b.d1]]) pts.push(g(u, y, d)); return hull2(pts); });
    if (S.disc) { const pts = []; for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; pts.push(g(S.disc.u + Math.cos(a) * S.disc.r, S.disc.y, S.disc.d + Math.sin(a) * S.disc.r)); } hulls.push(hull2(pts)); }
    const pen = Math.max(0.6, 0.12 * s);
    soft(x, () => { for (const h of hulls) { h.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.closePath(); } }, [28, 22, 44], Math.min(0.62, sh.a * 1.7), pen);
  }
  // the contact shadow (ambient occlusion right under it): soft, always; deeper by day, subtle at night
  const ak = 0.55 + 0.45 * ((T.day || 0) + (T.gold || 0)) + 0.2 * (T.ovc || 0);
  for (const c of S.contact) {
    const a = P(X + c.x0, 0, c.d0), b = P(X + c.x1, 0, c.d1), cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2, rx = Math.abs(b[0] - a[0]) / 2, ry = Math.max(0.8, Math.abs(b[1] - a[1]) / 2);
    soft(x, () => x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2), [20, 16, 30], Math.min(0.75, c.a * ak), Math.max(0.6, ry * 0.9));
  }
}

// ------------------------------------------------------------------ THE BOXES (FP2 — tested: the cart's umbrella never hides the bench)
const boxOf = pts => { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), x0 = Math.min(...xs), y0 = Math.min(...ys); return { x: x0, y: y0, w: Math.max(...xs) - x0, h: Math.max(...ys) - y0 }; };
/** the bench on screen (pt): its two ends, from the paving up to the back posts' finials (drawBench's frame) */
export function benchBox(cam, b) {
  const P = frame(cam, b.z, 1.8), hw = (b.w || PIECE.bench.w) / 2, pts = [];
  for (const u of [-hw - 0.05, hw + 0.05]) for (const [y, d] of [[0, 0], [0, 0.92], [1.55, 0.92], [1.55, 0]]) pts.push(P(b.x + u, y, d));
  return boxOf(pts);
}
/** the cart's umbrella on screen (pt): the canopy's rim all round + its scalloped valance and bulbs hanging under it, the apex +
 *  the finial (umbrella(): apex 4.88, rim 4.06, valance 0.3 + its scallop + a bulb ≈ 0.56 under the rim; the pole at x − 0.05) */
export function umbrellaBox(cam, c) {
  const P = frame(cam, c.z, 1.5), R = PIECE.cart.umb, pu = c.x - 0.05, pd = 0.85, pts = [P(pu, 5.05, pd)];
  for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2, u = pu + Math.cos(a) * R, d = pd + Math.sin(a) * R; pts.push(P(u, 4.06, d), P(u, 3.5, d)); }
  return boxOf(pts);
}
