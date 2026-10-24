// CITY 2.0 — THE HARBOR, PART 8a: THE PROMENADE'S PROPS — the bench, the vendor cart, the stone flower planters (their flowers by
// the season), the centrepiece MEDALLION inlaid in the plaza (an Art Deco disc in a ring of smooth stone — the big seasonal pieces
// stand on it later). Baked into the stage (stage.js); their cast shadows on the cobbles by day (propShadow, drawn with the ground).
//
// HOW THEY'RE DRAWN — crafted like an illustration, every surface lit by ONE light model (lightFor + lit): a face's colour comes from
// its NORMAL — by day the sky's cool ambient + the real sun (its side T.sunDir, its height T.sunEl; the city's convention: the light
// comes from our side, so fronts are lit and shadows fall away from us — stage.js#sunShadow), warm amber at golden hour, a soft flat
// grey under an overcast deck; at night deep cool tones lifted by the NEAREST LAMP (ctx.lights; its brightness ctx.lampK): the faces
// turned toward it catch its colour (the tall street lamps a cool white, the globes warm) — never a black blob. Brass + glazed
// surfaces get a specular glint (the sun by day, the lamp at night).
// Each prop is built in its own little frame (frame(): world x + height y + depth d behind its front), the true perspective
// linearised at the prop's depth with the depth EXAGGERATED a little (e: 1.35–1.8) — the glance test: from this high camera a
// bench's seat would be a 2-pt sliver; a touch more of its top reads as a seat. The medallion is in the paving: true perspective.
import { project } from '../../core/harbor-layout.js';
import { rgb, shade, mix } from './shapes.js';
import { PIECE } from '../../core/harbor-promenade.js';
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
    for (let i = 0; i < 3; i++) o[i] += Lt.night * (c[i] * amb * N_AMB[i] / 255 + 7 + 6 * up + Lt.lk * (c[i] * dl * 1.25 * Lt.lcol[i] / 255 + dl * 0.1 * Lt.lcol[i] + spl * Lt.lcol[i] * 0.8) + ow * c[i] * oc[i] / 255);
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
  x.fillStyle = typeof col === 'string' ? col : rgb(col, a); x.fill();
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
    if (glow > 0.05) { const gr = x.createRadialGradient(bp[0], bp[1], 0, bp[0], bp[1], 0.32 * s); gr.addColorStop(0, `rgba(255,200,130,${(0.5 * glow).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,180,110,0)'); x.save(); x.globalCompositeOperation = 'lighter'; x.fillStyle = gr; x.fillRect(bp[0] - 0.32 * s, bp[1] - 0.32 * s, 0.64 * s, 0.64 * s); x.restore(); }
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
  if (glow > 0.05) { const gr = x.createRadialGradient(cx, top + h * 0.55, 0, cx, top + h * 0.55, 0.55 * s); gr.addColorStop(0, `rgba(255,190,110,${(0.6 * glow).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,170,90,0)'); x.save(); x.globalCompositeOperation = 'lighter'; x.fillStyle = gr; x.fillRect(cx - 0.55 * s, top + h * 0.55 - 0.55 * s, 1.1 * s, 1.1 * s); x.restore(); }
  const br = lit(Lt, BRASS, FRONT, 1);
  x.strokeStyle = rgb(br); x.lineWidth = Math.max(0.3, 0.025 * s); x.strokeRect(cx - w, top + 0.06 * s, w * 2, h - 0.06 * s);
  line(x, [cx, top + 0.06 * s], [cx, top + h], br, Math.max(0.25, 0.018 * s));
  fillPts(x, [[cx - w * 1.2, top + 0.07 * s], [cx + w * 1.2, top + 0.07 * s], [cx, top - 0.06 * s]], br);
  x.fillStyle = rgb(br); x.fillRect(cx - w * 1.05, top + h, w * 2.1, 0.04 * s);
}

// ------------------------------------------------------------------ THE PLANTERS
// Big cast-stone Deco planters: a stepped plinth, the body flaring a little to the top with corner pilasters and a FLUTED panel
// (each reed a lit side + a shade side), a carved chevron band, a projecting lip whose top catches the light (its shadow under
// it), rain streaks + lichen; brimming with the season's flowers — AUTUMN mums (rust, gold, burgundy) + ornamental kale; SUMMER
// red geraniums + trailing ivy + white alyssum; SPRING red + yellow tulips over pansies; WINTER evergreen boughs, red berries, pine
// cones + birch twigs (Part 9's snow on them: ctx.snow).
const STONE = [186, 178, 164];

/** a big stone flower planter: p = { x, z, w } (PIECE.planter: h, d) — its flowers by ctx.season */
export function drawPlanter(x, cam, p, T, ctx = {}) {
  const PC = PIECE.planter, P = frame(cam, p.z, 1.35), s = P.s, Lt = lightFor(T, ctx, p.x, p.z + 0.8), X = p.x, hw = p.w / 2, D = PC.d, H = PC.h;
  const r = rngFrom(seedOf(p.x, p.z));
  x.save(); x.lineCap = 'round'; x.lineJoin = 'round';
  // 1. the stepped plinth (two steps), the body (flaring a little), the lip
  pbox(x, P, Lt, shade(STONE, -0.08), { x0: X - hw, x1: X + hw, y0: 0, y1: 0.14, d0: -0.02, d1: D + 0.02 });
  pbox(x, P, Lt, shade(STONE, -0.03), { x0: X - hw + 0.08, x1: X + hw - 0.08, y0: 0.14, y1: 0.25, d0: 0.04, d1: D - 0.04 });
  const yb = 0.25, yt = H - 0.24, w0 = hw - 0.17, w1 = hw - 0.1, d0 = 0.1, d1 = D - 0.1;
  const side = X - w0 > 0 ? -1 : X + w0 < 0 ? 1 : 0;
  if (side) { const u0 = X + side * w0, u1 = X + side * w1; fillPts(x, [P(u0, yb, d0), P(u1, yt, d0 - 0.03), P(u1, yt, d1 + 0.03), P(u0, yb, d1)], lit(Lt, STONE, [side, 0.05, 0])); }
  const fr = [P(X - w0, yb, d0), P(X + w0, yb, d0), P(X + w1, yt, d0 - 0.03), P(X - w1, yt, d0 - 0.03)];
  fillPts(x, fr, lit(Lt, STONE, FRONT));
  // the face's texture: speckled aggregate, rain streaks from the lip, lichen near the foot
  x.save(); x.beginPath(); fr.forEach((q, i) => (i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]))); x.closePath(); x.clip();
  for (let i = 0; i < 70; i++) { const q = P(X - w1 + r() * w1 * 2, yb + r() * (yt - yb), d0); x.fillStyle = rgb(r() < 0.5 ? shade(lit(Lt, STONE, FRONT), -0.25) : shade(lit(Lt, STONE, FRONT), 0.18), 0.5); x.fillRect(q[0], q[1], Math.max(0.3, 0.025 * s), Math.max(0.3, 0.025 * s)); }
  for (let i = 0; i < 5; i++) { const u = X - w0 + r() * w0 * 2, a = P(u, yt, d0), b = P(u, yt - 0.3 - r() * 0.4, d0), g = x.createLinearGradient(0, a[1], 0, b[1]); g.addColorStop(0, rgb([60, 56, 52], 0.22 * (1 - Lt.night * 0.6))); g.addColorStop(1, 'rgba(60,56,52,0)'); x.fillStyle = g; x.fillRect(a[0] - 0.04 * s, a[1], (0.05 + r() * 0.06) * s, b[1] - a[1]); }
  { const a = P(X - w0, yb, d0), g = x.createLinearGradient(0, a[1], 0, a[1] - 0.3 * s); g.addColorStop(0, rgb(mix(lit(Lt, [96, 110, 70], FRONT), [0, 0, 0], 0.1), 0.35)); g.addColorStop(1, 'rgba(90,110,70,0)'); x.fillStyle = g; x.fillRect(fr[0][0], a[1] - 0.3 * s, fr[1][0] - fr[0][0], 0.3 * s); }
  { const [, ya] = P(X, yt, d0), [, yb2] = P(X, yb, d0), g = x.createLinearGradient(0, ya, 0, yb2), k = 0.3 + 0.15 * Lt.night;
    g.addColorStop(0, `rgba(30,26,40,${k.toFixed(3)})`); g.addColorStop(0.3, 'rgba(30,26,40,0)'); g.addColorStop(0.75, 'rgba(30,26,40,0)'); g.addColorStop(1, `rgba(30,26,40,${(k * 0.7).toFixed(3)})`);
    x.fillStyle = g; x.fillRect(fr[0][0] - 2, ya, fr[1][0] - fr[0][0] + 4, yb2 - ya); }
  x.restore();
  // the corner pilasters (brought forward: a lit edge toward the light, a shade edge away) + the FLUTED panel between them
  const sunR = Lt.night > 0.5 ? Lt.ld[0] >= 0 : Lt.sd >= 0, hiC = rimCol(Lt, STONE, [sunR ? 0.7 : -0.7, 0.2, -0.7]), loC = lit(Lt, shade(STONE, -0.35), FRONT);
  const pil = 0.24, f0 = -w0 + pil, f1 = w0 - pil, yf0 = yb + 0.1, yf1 = yt - 0.24;
  for (const sg of [-1, 1]) {
    const ui = X + sg * (w0 - pil), ub = X + sg * (w1 - pil);
    line(x, P(ui, yb, d0), P(ub, yt, d0 - 0.03), (sg > 0) === sunR ? loC : hiC, Math.max(0.35, 0.03 * s), 0.9);
    const ue = X + sg * w0, ut = X + sg * w1; line(x, P(ue, yb, d0), P(ut, yt, d0 - 0.03), (sg > 0) === sunR ? hiC : loC, Math.max(0.35, 0.03 * s), 0.8);
  }
  for (let u = f0 + 0.1; u < f1 - 0.04; u += 0.15) {
    const a = P(X + u, yf0, d0), b = P(X + u * (w1 / w0), yf1, d0 - 0.02);
    line(x, a, b, loC, Math.max(0.35, 0.035 * s), 0.75);
    line(x, [a[0] + (sunR ? 0.045 : -0.045) * s, a[1]], [b[0] + (sunR ? 0.045 : -0.045) * s, b[1]], hiC, Math.max(0.25, 0.022 * s), 0.7);
  }
  // the flutes' rounded feet + heads (a carved stop)
  line(x, P(X + f0, yf0, d0), P(X + f1, yf0, d0), loC, Math.max(0.3, 0.025 * s), 0.6);
  // the chevron band under the lip (carved: a shade stroke + a lit stroke a hair above)
  const cb0 = yt - 0.2, cb1 = yt - 0.03;
  fillPts(x, [P(X - w1, cb0, d0 - 0.025), P(X + w1, cb0, d0 - 0.025), P(X + w1, cb1, d0 - 0.03), P(X - w1, cb1, d0 - 0.03)], lit(Lt, shade(STONE, 0.04), FRONT));
  for (const [col, dy] of [[loC, -0.025], [hiC, 0]]) {
    x.strokeStyle = rgb(col, 0.9); x.lineWidth = Math.max(0.3, 0.03 * s); x.beginPath();
    for (let u = -w1 + 0.04, i = 0; u <= w1 - 0.03; u += 0.13, i++) { const q = P(X + u, (i % 2 ? cb0 + 0.04 : cb1 - 0.04) + dy, d0 - 0.03); if (i) x.lineTo(q[0], q[1]); else x.moveTo(q[0], q[1]); }
    x.stroke();
  }
  // the lip: a deep shadow line under it, its fascia, its top (the brightest face), its inner edge
  const lx0 = X - hw - 0.02, lx1 = X + hw + 0.02, ly0 = yt, ly1 = H, ld0 = -0.06, ld1 = D + 0.06;
  line(x, P(X - w1, yt - 0.01, d0 - 0.02), P(X + w1, yt - 0.01, d0 - 0.02), lit(Lt, shade(STONE, -0.55), FRONT), Math.max(0.4, 0.05 * s), 0.85);
  pbox(x, P, Lt, shade(STONE, 0.04), { x0: lx0, x1: lx1, y0: ly0, y1: ly1, d0: ld0, d1: ld1 }, { rim: true });
  line(x, P(lx0, ly0 + 0.08, ld0), P(lx1, ly0 + 0.08, ld0), lit(Lt, shade(STONE, -0.2), FRONT), Math.max(0.25, 0.02 * s), 0.7);
  // the soil inside the rim (barely seen under the flowers)
  const ir = 0.13; fillPts(x, [P(lx0 + ir, ly1, ld0 + ir), P(lx1 - ir, ly1, ld0 + ir), P(lx1 - ir, ly1, ld1 - ir), P(lx0 + ir, ly1, ld1 - ir)], lit(Lt, [62, 46, 36], TOP));
  // 2. the flowers
  const bed = { X, y: H, u0: -hw + ir + 0.02, u1: hw - ir - 0.02, d0: ld0 + ir, d1: ld1 - ir, front: ld0 };
  const season = ctx.season || 'autumn';
  if (season === 'summer') geraniums(x, P, Lt, bed, r);
  else if (season === 'spring') tulips(x, P, Lt, bed, r);
  else if (season === 'winter') evergreens(x, P, Lt, bed, r, ctx.snow || 0);
  else mums(x, P, Lt, bed, r, ctx.phase ?? 0.5);
  // Part 9's snow on the lip's top
  if (ctx.snow > 0.05) { x.globalAlpha = Math.min(1, ctx.snow * 1.4); fillPts(x, [P(lx0, ly1 + 0.02, ld0), P(lx1, ly1 + 0.02, ld0), P(lx1, ly1 + 0.02, ld0 + ir), P(lx0, ly1 + 0.02, ld0 + ir)], lit(Lt, [242, 246, 252], TOP)); x.globalAlpha = 1; }
  x.restore();
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
function mums(x, P, Lt, B, r, phase) {
  const s = P.s, MUM = [[188, 72, 36], [232, 166, 46], [132, 34, 54], [214, 112, 40]];
  foliage(x, P, Lt, B, r, [[52, 84, 46], [64, 98, 52], [44, 72, 44]], 0.46, 70, 0.19);
  // the mum plants: domes of tiny florets, one colour each, in a loose grid (3 at the back, 4 at the front), ornamental kale
  // rosettes at the two front corners
  const plants = [];
  for (const [row, nn] of [[0.78, 3], [0.3, 4]]) for (let i = 0; i < nn; i++) plants.push({ u: B.u0 + (B.u1 - B.u0) * (i + 0.5) / nn + (r() - 0.5) * 0.1, d: B.d0 + (B.d1 - B.d0) * row, c: MUM[(i * 3 + (row > 0.5 ? 1 : 0) + (r() < 0.25 ? 2 : 0)) % MUM.length], kale: row < 0.5 && (i === 0 || i === nn - 1) });
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

// ------------------------------------------------------------------ THE MEDALLION
// Inlaid flush in the setts: a RING OF SMOOTH STONE (polished pale granite, cut in twelve slabs, a fine joint all round, flecked,
// its sheen — the sky by day) round an Art Deco COMPASS SUNBURST: a dark verde-granite field, eight long brass rays + eight short
// cream terrazzo rays, a brass band at the rim and round the heart, a brass boss. Each ray in two halves (lit / shade: the brass
// reads as relief), the brass catching the sun by day; at night dim, the halves toward the nearest lamp catch its light.
const GRANITE_R = [198, 188, 178], VERDE = [40, 62, 56], TERRAZZO = [234, 224, 202];

/** THE MEDALLION, inlaid in the paving (drawn with the ground, before everything that stands): m = { x, z, r, ring } */
export function drawMedallion(x, cam, m, T, ctx = {}) {
  const Lt = lightFor(T, ctx, m.x, m.z), r = rngFrom(seedOf(m.x, m.z) + 5), G = (rad, a) => project(cam, m.x + Math.cos(a) * rad, 0, m.z + Math.sin(a) * rad);
  const ring = (rad, n = 72) => { x.beginPath(); for (let i = 0; i <= n; i++) { const p = G(rad, i / n * Math.PI * 2); if (i) x.lineTo(p[0], p[1]); else x.moveTo(p[0], p[1]); } x.closePath(); };
  const annulus = (r0, r1, n = 72) => { x.beginPath(); for (let i = 0; i <= n; i++) { const p = G(r1, i / n * Math.PI * 2); if (i) x.lineTo(p[0], p[1]); else x.moveTo(p[0], p[1]); } for (let i = n; i >= 0; i--) { const p = G(r0, i / n * Math.PI * 2); x.lineTo(p[0], p[1]); } x.closePath(); };
  const s = cam.F / m.z, R = m.ring, Rin = m.r, gnd = mix(lit(Lt, GRANITE_R, TOP, 0.25), [74, 70, 96], 0.4 * Lt.night);   // (at night the polish holds the lit city's glow: a step above the setts)
  // the ring's setting: a dark joint all round (the setts meet it), then the polished slabs
  ring(R + 0.08); x.fillStyle = rgb(lit(Lt, [70, 64, 60], TOP)); x.fill();
  annulus(Rin, R); x.fillStyle = rgb(gnd); x.fill();
  // the polish: a soft sheen (the sky's light by day, the lamp's at night) across the far side, the near side a touch deeper
  x.save(); annulus(Rin, R); x.clip();
  const [cx0] = project(cam, m.x, 0, m.z), [, yFar] = project(cam, m.x, 0, m.z + R), [, yNear] = project(cam, m.x, 0, m.z - R);
  { const g = x.createLinearGradient(0, yFar, 0, yNear), shn = Lt.night > 0.5 ? mix(gnd, Lt.lcol, 0.5 * Lt.lk + 0.12) : mix(gnd, [250, 252, 255], 0.35 * (1 - Lt.ov * 0.5));
    g.addColorStop(0, rgb(shn, 0.85)); g.addColorStop(0.45, rgb(gnd, 0)); g.addColorStop(1, rgb(shade(gnd, -0.12), 0.7)); x.fillStyle = g; x.fillRect(cx0 - R * s, yFar, 2 * R * s, yNear - yFar); }
  // flecks: feldspar + mica (the polished granite's grain)
  for (let i = 0; i < 260; i++) {
    const a = r() * Math.PI * 2, rr = Rin + (R - Rin) * Math.sqrt(r() * 0.98 + 0.02), p = G(rr, a), q = r();
    x.fillStyle = q < 0.45 ? rgb(shade(gnd, -0.32), 0.55) : q < 0.75 ? rgb(mix(gnd, [214, 150, 140], 0.4), 0.55) : rgb(shade(gnd, 0.35), 0.7);
    x.fillRect(p[0], p[1], Math.max(0.3, 0.03 * s), Math.max(0.3, 0.02 * s));
  }
  // the slab joints (twelve radial cuts)
  x.strokeStyle = rgb(shade(gnd, -0.35), 0.7); x.lineWidth = Math.max(0.3, 0.02 * s);
  for (let i = 0; i < 12; i++) { const a = (i + 0.5) / 12 * Math.PI * 2, p = G(Rin, a), q = G(R, a); x.beginPath(); x.moveTo(p[0], p[1]); x.lineTo(q[0], q[1]); x.stroke(); }
  x.restore();
  // the outer edge's bevel (a fine lit line on the far rim, a dark one on the near: the stone sits flush, its arris catches light)
  x.lineWidth = Math.max(0.3, 0.025 * s);
  x.strokeStyle = rgb(rimCol(Lt, GRANITE_R, [0, 0.8, -0.6]), 0.6); x.beginPath(); for (let i = 0; i <= 36; i++) { const p = G(R - 0.03, Math.PI * (i / 36)); if (i) x.lineTo(p[0], p[1]); else x.moveTo(p[0], p[1]); } x.stroke();
  // the brass rim band, the verde field
  annulus(Rin - 0.11, Rin); x.fillStyle = rgb(lit(Lt, BRASS, TOP, 1)); x.fill();
  ring(Rin - 0.11); x.fillStyle = rgb(lit(Lt, VERDE, TOP, 0.6)); x.fill();
  // the field's own fine grain (dark green-black with lighter veins)
  x.save(); ring(Rin - 0.11); x.clip();
  for (let i = 0; i < 90; i++) { const a = r() * 6.28, rr = Math.sqrt(r()) * (Rin - 0.12), p = G(rr, a); x.fillStyle = rgb(shade(lit(Lt, VERDE, TOP), r() < 0.5 ? 0.25 : -0.3), 0.6); x.fillRect(p[0], p[1], Math.max(0.3, 0.03 * s), Math.max(0.3, 0.02 * s)); }
  x.restore();
  // the rays: 8 short terrazzo (between), 8 long brass (the compass points) — each in two halves for relief
  const L = Lt.night > 0.5 ? Lt.ld : Lt.L, lAng = Math.atan2(L[2], L[0]);   // (where the light comes from, on the ground)
  const ray = (a, len, half, col, gloss) => {
    const tip = G(len, a), base = G(0.3, a);
    const w = half, pa = project(cam, m.x + Math.cos(a) * 0.3 + Math.cos(a + Math.PI / 2) * w, 0, m.z + Math.sin(a) * 0.3 + Math.sin(a + Math.PI / 2) * w);
    const pb = project(cam, m.x + Math.cos(a) * 0.3 + Math.cos(a - Math.PI / 2) * w, 0, m.z + Math.sin(a) * 0.3 + Math.sin(a - Math.PI / 2) * w);
    // the two halves: the one facing the light lit, the other shaded (a raised, bevelled ray)
    const facing = Math.cos(a + Math.PI / 2 - lAng);
    const hiN = [Math.cos(a + Math.PI / 2) * 0.6, 0.8, Math.sin(a + Math.PI / 2) * 0.6], loN = [-hiN[0], 0.8, -hiN[2]];
    fillPts(x, [base, pa, tip], lit(Lt, col, facing > 0 ? hiN : loN, gloss));
    fillPts(x, [base, pb, tip], lit(Lt, col, facing > 0 ? loN : hiN, gloss));
  };
  for (let i = 0; i < 8; i++) ray((i + 0.5) / 8 * Math.PI * 2, Rin * 0.66, 0.2, TERRAZZO, 0.3);
  for (let i = 0; i < 8; i++) ray(i / 8 * Math.PI * 2 + Math.PI / 2, i % 2 ? Rin * 0.78 : Rin - 0.16, i % 2 ? 0.16 : 0.22, BRASS, 1.3);
  // the heart: a brass ring, a terrazzo disc, a brass boss with its glint
  ring(0.4); x.fillStyle = rgb(lit(Lt, BRASS, TOP, 1.2)); x.fill();
  ring(0.32); x.fillStyle = rgb(lit(Lt, TERRAZZO, TOP, 0.3)); x.fill();
  ring(0.15); x.fillStyle = rgb(lit(Lt, BRASS, [0, 0.9, -0.4], 1.4)); x.fill();
  // a fine brass circle between the rays (the Deco ring at two-thirds)
  x.strokeStyle = rgb(lit(Lt, BRASS, TOP, 1), 0.9); x.lineWidth = Math.max(0.3, 0.03 * s); ring(Rin * 0.5, 48); x.stroke();
  // the brass's glint: a few bright sparks on the rays toward the light (the sun by day; at night the lamp's, faint)
  const gk = (Lt.day + Lt.gold) * (1 - Lt.ov * 0.8) + Lt.night * Math.max(0.25 * Lt.lampK, Lt.lk);
  if (gk > 0.04) {
    const gc = Lt.night > 0.5 ? Lt.lcol : Lt.gold > Lt.day ? [255, 210, 150] : [255, 250, 236];
    x.save(); x.globalCompositeOperation = 'lighter';
    for (const [rr, da, k] of [[Rin - 0.35, 0, 1], [Rin * 0.55, 0.5, 0.7], [Rin - 0.06, -0.35, 0.8], [0.36, 0.2, 0.6]]) {
      const p = G(rr, lAng + Math.PI + da), g = x.createRadialGradient(p[0], p[1], 0, p[0], p[1], 0.2 * s);
      g.addColorStop(0, rgb(gc, Math.min(0.85, 0.7 * gk * k))); g.addColorStop(1, rgb(gc, 0));
      x.fillStyle = g; x.fillRect(p[0] - 0.2 * s, p[1] - 0.2 * s, 0.4 * s, 0.4 * s);
    }
    x.restore();
  }
}

// ------------------------------------------------------------------ THE SHADOWS
// The boxes a prop's shadow is made of (in its own frame's numbers): { x0, x1, y0, y1, d0, d1 } relative to the prop's x (u) and z
// (d); the cart's umbrella a disc. Every box's shadow on the ground = the hull of its foot + its top, each pushed along the sun by
// its height (stage.js#sunShadow): ONE soft fill for the whole prop (the overlaps union), then a contact shadow under it always.
function shadowShapes(kind, it) {
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
  const hw = (it.w || PIECE.planter.w) / 2, H = PIECE.planter.h, D = PIECE.planter.d;
  return { e: 1.35, boxes: [{ x0: -hw, x1: hw, y0: 0, y1: H, d0: 0, d1: D }, { x0: -hw + 0.3, x1: hw - 0.3, y0: H, y1: H + 0.5, d0: 0.3, d1: D - 0.3 }], contact: [{ x0: -hw - 0.05, x1: hw + 0.05, d0: -0.06, d1: D + 0.04, a: 0.5 }] };
}
/** a prop's cast shadow on the cobbles by day (kind: 'bench' | 'cart' | 'planter'), along the real sun (T.sunDir, T.sunEl); none
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
