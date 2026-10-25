// CITY 2.0 — THE HARBOR, PART 8a: THE PROMENADE'S PROPS — the bench, the vendor cart, the stone flower planters (their flowers by
// the season), the centrepiece spot's INLAY (PF: a brick compass rose laid flush in the setts — the big seasonal pieces stand on
// it — with its event rig's floor spots), THE MAILBOX (PF: a 1920s olive-green pillar box), THE TEST PIECE (PF: an obelisk on a
// stepped plinth — &force=centrepiece-test). Baked into the stage (stage.js); their cast shadows on the cobbles by day (propShadow,
// drawn with the ground).
//
// HOW THEY'RE DRAWN — crafted like an illustration, every surface lit by ONE light model (lightFor + lit): a face's colour comes from
// its NORMAL — by day the sky's cool ambient + the real sun (its side T.sunDir, its height T.sunEl; the city's convention: the light
// comes from our side, so fronts are lit and shadows fall away from us — core/harbor-light.js#sunShadow), warm amber at golden hour, a soft flat
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
import { sunShadow } from '../../core/harbor-light.js';
import { FONT, FRONT, TOP, fillPts, frame, hull2, lightFor, line, lit, norm, pbox, rimCol, seedOf, soft } from './props-light.js';
// (FP3a: the light model + frame → props-light.js; the dormant planters + mailbox → props-garden.js; the test obelisk → props-test.js)

// ------------------------------------------------------------------ THE BENCH
// A 1920s park bench facing us (its back toward the road): painted cast-iron Deco ends (a scrolled foot turned out, a stepped knee,
// the armrest ending in a curl, the back post's stepped finial), a centre support, oak slats (the seat seen from above, three back
// slats leaning back with gaps that show the street behind), grain + a lit top edge on every slat, a small brass plaque.
// (FP3b, the owner: a DARK GREEN cast-iron frame — the oak slats + the sitters separate from it)
export const OAK = [158, 106, 62], IRON_B = [26, 70, 50], BRASS = [204, 160, 72];

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
  chestnuts: { body: [34, 88, 64], trim: [22, 56, 42], wheel: [172, 46, 38], umb: [[186, 40, 42], [240, 228, 202]], word: 'CHESTNUTS', ink: [250, 236, 196], bold: true },
  icecream: { body: [238, 232, 216], trim: [126, 196, 184], wheel: [96, 160, 196], umb: [[236, 150, 170], [250, 244, 236]], word: 'ICE CREAM', board: [92, 170, 160], ink: [252, 248, 238] },
  flowers: { body: [174, 124, 74], trim: [70, 112, 74], wheel: [52, 92, 62], umb: [[240, 196, 64], [250, 244, 228]], word: 'FRESH FLOWERS', board: [62, 104, 68] },
};
const GILT = [214, 170, 82];

/** the vendor cart: c = { x, z, kind: 'chestnuts' } (its trade by ctx.season unless c.kind names another — chestnuts in autumn +
 *  winter, ice cream in summer, flowers in spring); PIECE.cart: w, h (the box), umb (the umbrella's radius) */
export function drawCart(x, cam, c, T, ctx = {}) {
  const kind = c.kind && c.kind !== 'chestnuts' ? c.kind : CART_KIND[ctx.season || 'autumn'] || 'chestnuts';
  const K = CART_LOOK[kind] || CART_LOOK.chestnuts;
  const P = frame(cam, c.z, 1.5), s = P.s, Lt = lightFor(T, ctx, c.x, c.z + 0.6), X = c.x, r = rngFrom(seedOf(c.x, c.z));
  // FP3b (the owner: "REMOVE the big umbrella — it blocks too much of the promenade"): a LOW, COMPACT period ROASTER cart — the body a
  // step lower (its counter at 1.55), no umbrella; on it a black-iron coal STOVE with a glowing grate, a roasting pan of chestnuts, a
  // TIN CHIMNEY with its cap (people.js lifts the smoke + the steam from the anchors this returns), a small LANTERN on an iron hook
  const bx0 = X - 1.22, bx1 = X + 1.22, by0 = 0.74, by1 = 1.55, D0 = 0.12, D1 = 1.18;
  x.save(); x.lineCap = 'round'; x.lineJoin = 'round';
  const glow = Lt.night * Lt.lampK;            // the lantern + the stove by the lamps' ramp (the coals glow by day too, softer)
  if (glow > 0.02) Lt.own = { k: 0.28 * Lt.lampK, col: [255, 176, 110] };   // (their warm light on the cart itself: it reads at night)
  // (c.hand = 1: the push handles on the RIGHT end — wheeled in from the right, the left end clear of the compass; c.roll turns the
  // wheels with the distance wheeled; c.hood: the drizzle's little canvas hood up over the stove — Part 9's hook)
  const hEnd = c.hand === 1 ? bx1 : bx0, hDir = c.hand === 1 ? 1 : -1, roll = c.roll || 0, out = {};
  // 1. the far wheels (behind the body), the chassis + the handles' far shaft
  for (const u of [X - 0.8, X + 0.8]) wheel(x, P, Lt, K, u, 0.6, 1.24, 0.58, true, roll);
  pbox(x, P, Lt, [40, 38, 40], { x0: bx0 + 0.1, x1: bx1 - 0.1, y0: 0.62, y1: by0, d0: D0 + 0.05, d1: D1 - 0.05 }, { top: false, rim: false });
  handle(x, P, Lt, X, hEnd, 0.95, hDir);
  // 2. the body: its side, its top (the counter), its front (panelled), the mouldings — painted wood WORN at its edges
  pbox(x, P, Lt, K.body, { x0: bx0, x1: bx1, y0: by0, y1: by1, d0: D0, d1: D1 }, { rim: false });
  bodyFront(x, P, Lt, K, bx0, bx1, by0, by1, D0);
  wear(x, P, Lt, K, bx0, bx1, by0, by1, D0, r);
  // the counter's edge: a BRASS rail catching the light (lit top, its glint), the skirt below
  pbox(x, P, Lt, [176, 132, 60], { x0: bx0 - 0.07, x1: bx1 + 0.07, y0: by1, y1: by1 + 0.07, d0: D0 - 0.07, d1: D1 + 0.07 }, { gloss: 1 });
  line(x, P(bx0 - 0.05, by1 + 0.07, D0 - 0.07), P(bx1 + 0.05, by1 + 0.07, D0 - 0.07), rimCol(Lt, BRASS, [0.2, 0.9, -0.5]), Math.max(0.35, 0.025 * s), 0.9);
  pbox(x, P, Lt, K.trim, { x0: bx0 - 0.04, x1: bx1 + 0.04, y0: by0 - 0.04, y1: by0 + 0.08, d0: D0 - 0.04, d1: D1 + 0.04 }, { top: false });
  // 3. the trade on the counter: the roaster (the tray + the stove + the chimney) — or the summer / spring trades
  if (kind === 'chestnuts') roasterTop(x, P, Lt, X, by1 + 0.07, glow, r, out, !!c.hood);
  else if (kind === 'icecream') iceTop(x, P, Lt, X, by1 + 0.08);
  else flowerTop(x, P, Lt, X, by1 + 0.08, r);
  // 4. the near shaft of the handles + the near wheels (in front of the body)
  handle(x, P, Lt, X, hEnd, 0.25, hDir);
  for (const u of [X - 0.8, X + 0.8]) wheel(x, P, Lt, K, u, 0.6, -0.04, 0.6, false, roll);
  // 5. the LANTERN on its hook: an iron post at the counter's right corner, a scrolled arm, the lantern hanging over the handles
  { const pu = bx1 - 0.12, pd = 0.3, iron = lit(Lt, [34, 32, 36], FRONT, 0.4), a = P(pu, by1 + 0.07, pd), b = P(pu, by1 + 1.32, pd), e = P(pu + 0.42, by1 + 1.32, pd);
    line(x, a, b, iron, Math.max(0.7, 0.07 * s)); line(x, [a[0] + 0.02 * s, a[1]], [b[0] + 0.02 * s, b[1]], rimCol(Lt, [70, 70, 76], [0.7, 0.2, -0.7]), Math.max(0.25, 0.018 * s), 0.7);
    line(x, b, e, iron, Math.max(0.55, 0.05 * s));
    x.strokeStyle = rgb(iron); x.lineWidth = Math.max(0.4, 0.035 * s); x.beginPath(); x.arc((b[0] + e[0]) / 2, b[1] + 0.09 * s, 0.09 * s, Math.PI * 1.05, Math.PI * 1.95); x.stroke();   // (the scroll under the arm)
    lantern(x, P, Lt, pu + 0.4, by1 + 0.98, pd, glow);
    const [lx, ly] = P(pu + 0.4, by1 + 0.86, pd); out.lantern = [lx, ly]; }
  x.restore();
  return out;
}
/** FP3b — the painted wood WORN: the paint rubbed back to the grain along the counter's front edge + the corners, scuffs low down by
 *  the wheels, a darker grime band at the skirt */
function wear(x, P, Lt, K, x0, x1, y0, y1, d, r) {
  const s = P.s, bare = lit(Lt, [146, 108, 70], FRONT), grime = lit(Lt, shade(K.body, -0.45), FRONT);
  for (let i = 0; i < 16; i++) { const u = x0 + 0.05 + r() * (x1 - x0 - 0.1), p = P(u, y1 - 0.02 - r() * 0.05, d - 0.01); x.fillStyle = rgb(bare, 0.55 + r() * 0.3); x.fillRect(p[0], p[1], (0.04 + r() * 0.1) * s, Math.max(0.35, 0.02 * s)); }
  for (const u of [x0, x1]) for (let i = 0; i < 4; i++) { const p = P(u + (u < X0(x0, x1) ? 0.02 : -0.06), y0 + 0.1 + r() * (y1 - y0 - 0.2), d - 0.01); x.fillStyle = rgb(bare, 0.5); x.fillRect(p[0], p[1], 0.04 * s, (0.05 + r() * 0.08) * s); }
  fillPts(x, [P(x0, y0, d - 0.005), P(x1, y0, d - 0.005), P(x1, y0 + 0.12, d - 0.005), P(x0, y0 + 0.12, d - 0.005)], grime, 0.35);
}
const X0 = (a, b) => (a + b) / 2;
/** FP3b — THE ROASTER on the counter: the tray of chestnuts (left), the black-iron coal STOVE (right) on its short legs — a brass band,
 *  the GRATE's coals glowing orange (bright at night, a warm ember by day), a shallow roasting pan of chestnuts on top, a TIN CHIMNEY
 *  rising from the stove's back (galvanised, ~0.15 wide — never hair-thin — seamed, its little conical cap on three stays); in drizzle a
 *  small canvas HOOD up over it. out ← { chimney, pan, grate } (screen points for the live smoke, steam + glow) */
function roasterTop(x, P, Lt, X, y, glow, r, out, hood) {
  const s = P.s, iron = [34, 32, 36], tin = [150, 154, 160];
  // the tray (left) — chestnuts heaped in a brass tray, the scoop, the paper bags
  // (FP3b, the second pass: the STOVE on the LEFT half — its chimney + smoke clear of the framing maple's crown, by the vendor who
  // tends it — the tray on the right)
  const tx = X + 1.16;
  pbox(x, P, Lt, [150, 112, 54], { x0: tx - 1.08, x1: tx - 0.08, y0: y, y1: y + 0.1, d0: 0.25, d1: 1.0 }, { gloss: 0.8 });
  const nuts = Array.from({ length: 34 }, () => [tx - 1.0 + r() * 0.85, 0.32 + r() * 0.62]).sort((a, b) => b[1] - a[1]);
  for (const [u, dd] of nuts) {
    const i = (u * 100) | 0, h = y + 0.1 + 0.13 * Math.max(0, 1 - Math.abs(u - (tx - 0.58)) * 2.1), p = P(u, h, dd);
    x.fillStyle = rgb(lit(Lt, i % 4 ? [96, 50, 28] : [128, 70, 38], [0, 0.6, -0.8], 0.8)); x.beginPath(); x.ellipse(p[0], p[1], 0.05 * s, 0.04 * s, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = rgb(rimCol(Lt, [150, 90, 50], [0.2, 0.8, -0.5]), 0.6); x.fillRect(p[0] - 0.02 * s, p[1] - 0.03 * s, 0.025 * s, 0.015 * s);
  }
  { const a = P(tx - 0.35, y + 0.14, 0.45), b = P(tx - 0.1, y + 0.3, 0.6); line(x, a, b, lit(Lt, BRASS, TOP, 1.2), Math.max(0.4, 0.04 * s)); x.fillStyle = rgb(lit(Lt, BRASS, [0, 0.7, -0.7], 1.2)); x.beginPath(); x.ellipse(a[0], a[1], 0.1 * s, 0.05 * s, 0, 0, Math.PI * 2); x.fill(); }
  pbox(x, P, Lt, [232, 220, 196], { x0: tx - 0.4, x1: tx - 0.06, y0: y, y1: y + 0.12, d0: 0.15, d1: 0.4 });
  // the stove: four short iron legs, the firebox (a squat iron drum-box), the brass band, the grate + its coals
  const sx0 = X - 1.08, sx1 = X - 0.08, sy0 = y + 0.12, sy1 = y + 0.6, sd0 = 0.28, sd1 = 0.98;
  for (const [u, dd] of [[sx0 + 0.08, sd0 + 0.05], [sx1 - 0.08, sd0 + 0.05]]) line(x, P(u, y, dd), P(u, sy0, dd), lit(Lt, iron, FRONT, 0.3), Math.max(0.5, 0.05 * s));
  pbox(x, P, Lt, iron, { x0: sx0, x1: sx1, y0: sy0, y1: sy1, d0: sd0, d1: sd1 }, { gloss: 0.35 });
  // the cast ribs on its face (catching the light)
  for (const v of [sy0 + 0.04, sy1 - 0.04]) line(x, P(sx0 + 0.02, v, sd0 - 0.005), P(sx1 - 0.02, v, sd0 - 0.005), rimCol(Lt, [80, 78, 84], [0, 0.6, -0.8]), Math.max(0.3, 0.02 * s), 0.7);
  line(x, P(sx0, sy1 - 0.01, sd0 - 0.01), P(sx1, sy1 - 0.01, sd0 - 0.01), lit(Lt, BRASS, [0, 0.7, -0.7], 1.3), Math.max(0.45, 0.04 * s));
  // THE GRATE: the opening, the coals (dark red → orange → a yellow-hot heart: by day an ember, at night bright), its iron bars
  const g0 = sx0 + 0.16, g1 = sx1 - 0.16, gv0 = sy0 + 0.08, gv1 = sy1 - 0.12, k = 0.45 + 0.55 * glow;
  const G = [P(g0, gv0, sd0 - 0.01), P(g1, gv0, sd0 - 0.01), P(g1, gv1, sd0 - 0.01), P(g0, gv1, sd0 - 0.01)];
  fillPts(x, G, [20, 8, 6]);
  { const [ax, ay] = G[3], [bx, by] = G[1], cg = x.createLinearGradient(0, ay, 0, by);
    cg.addColorStop(0, `rgba(150,36,14,${(0.9 * k).toFixed(3)})`); cg.addColorStop(0.55, `rgba(255,118,34,${k.toFixed(3)})`); cg.addColorStop(1, `rgba(255,${(190 + 50 * glow) | 0},${(70 + 80 * glow) | 0},${k.toFixed(3)})`);
    x.fillStyle = cg; x.fillRect(ax, ay, bx - ax, by - ay);
    for (let i = 0; i < 8; i++) { const p = P(g0 + 0.06 + i * (g1 - g0 - 0.12) / 7, gv0 + 0.05 + r() * 0.06, sd0 - 0.012); x.fillStyle = `rgba(255,${(214 + 30 * glow) | 0},${(120 + 90 * glow) | 0},${(0.6 + 0.4 * k).toFixed(3)})`; x.beginPath(); x.arc(p[0], p[1], 0.035 * s, 0, Math.PI * 2); x.fill(); } }
  for (let i = 1; i < 6; i++) line(x, P(g0 + i * (g1 - g0) / 6, gv0, sd0 - 0.015), P(g0 + i * (g1 - g0) / 6, gv1, sd0 - 0.015), [18, 14, 16], Math.max(0.35, 0.03 * s));
  // its crisp glow: a tight warm halo off the grate + its light on the counter's front (never a blur over the cart)
  if (k > 0.3) { const [cx, cy] = P((g0 + g1) / 2, (gv0 + gv1) / 2, sd0), R = 0.95 * s, h = x.createRadialGradient(cx, cy, 0, cx, cy, R);
    h.addColorStop(0, `rgba(255,160,70,${(0.75 * glow).toFixed(3)})`); h.addColorStop(0.35, `rgba(255,120,40,${(0.3 * glow).toFixed(3)})`); h.addColorStop(1, 'rgba(255,110,40,0)');
    x.save(); x.globalCompositeOperation = 'lighter'; x.fillStyle = h; x.fillRect(cx - R, cy - R, 2 * R, 2 * R); x.restore(); }
  out.grate = P((g0 + g1) / 2, (gv0 + gv1) / 2, sd0);
  // the roasting pan on top: a shallow black pan with its handle, chestnuts in it (split + roasting), a lit rim
  pbox(x, P, Lt, [26, 24, 28], { x0: sx0 + 0.06, x1: sx1 - 0.06, y0: sy1, y1: sy1 + 0.07, d0: sd0 + 0.03, d1: sd1 - 0.06 }, { gloss: 0.5 });
  for (let i = 0; i < 14; i++) { const p = P(sx0 + 0.16 + r() * (sx1 - sx0 - 0.32), sy1 + 0.08, sd0 + 0.12 + r() * 0.5); x.fillStyle = rgb(lit(Lt, i % 3 ? [110, 58, 30] : [160, 110, 64], [0, 0.7, -0.7], 0.8)); x.beginPath(); x.ellipse(p[0], p[1], 0.05 * s, 0.035 * s, 0, 0, Math.PI * 2); x.fill(); }
  line(x, P(sx0 + 0.06, sy1 + 0.05, (sd0 + sd1) / 2), P(sx0 - 0.3, sy1 + 0.1, (sd0 + sd1) / 2), lit(Lt, iron, FRONT, 0.4), Math.max(0.45, 0.04 * s));
  out.pan = P((sx0 + sx1) / 2, sy1 + 0.12, (sd0 + sd1) / 2);
  // THE TIN CHIMNEY from the stove's back-right: galvanised pipe (a lit edge, a shade edge, two seams), its conical cap on stays
  const cu = sx0 + 0.22, cd = sd1 - 0.1, ch0 = sy1, ch1 = sy1 + 0.9, cw = 0.095;
  { const a = P(cu - cw, ch0, cd), b = P(cu + cw, ch0, cd), c2 = P(cu + cw, ch1, cd), d2 = P(cu - cw, ch1, cd);
    const w = Math.max(2, b[0] - a[0]), ox = (a[0] + b[0]) / 2;   // (never hair-thin: at least ~1.6 pt)
    fillPts(x, [[ox - w / 2, a[1]], [ox + w / 2, b[1]], [ox + w / 2, c2[1]], [ox - w / 2, d2[1]]], lit(Lt, tin, FRONT, 0.9));
    const sd = Lt.sd >= 0 ? 1 : -1;
    fillPts(x, [[ox + sd * w * 0.12, a[1]], [ox + sd * w / 2, b[1]], [ox + sd * w / 2, c2[1]], [ox + sd * w * 0.12, d2[1]]], rimCol(Lt, tin, [sd * 0.8, 0.2, -0.6]), 0.75);
    fillPts(x, [[ox - sd * w / 2, a[1]], [ox - sd * w * 0.2, a[1]], [ox - sd * w * 0.2, d2[1]], [ox - sd * w / 2, d2[1]]], lit(Lt, shade(tin, -0.4), FRONT, 0.6), 0.8);
    for (const v of [ch0 + 0.35, ch0 + 0.75]) { const p = P(cu, v, cd); x.fillStyle = rgb(lit(Lt, shade(tin, -0.3), FRONT, 0.6)); x.fillRect(ox - w / 2 - 0.2, p[1], w + 0.4, Math.max(0.5, 0.03 * s)); }
    // the cap: a little cone on three stays, a gap under it (the smoke comes out there)
    const top = P(cu, ch1 + 0.13, cd)[1], capW = Math.max(w * 2.3, 0.3 * s);
    line(x, [ox - w * 0.4, d2[1]], [ox - capW * 0.35, top + 0.06 * s], lit(Lt, iron, FRONT, 0.4), Math.max(0.3, 0.02 * s)); line(x, [ox + w * 0.4, d2[1]], [ox + capW * 0.35, top + 0.06 * s], lit(Lt, iron, FRONT, 0.4), Math.max(0.3, 0.02 * s));
    fillPts(x, [[ox - capW / 2, top + 0.06 * s], [ox + capW / 2, top + 0.06 * s], [ox, top - 0.1 * s]], lit(Lt, shade(tin, -0.15), [0, 0.7, -0.7], 0.8));
    line(x, [ox - capW / 2, top + 0.06 * s], [ox + capW / 2, top + 0.06 * s], rimCol(Lt, tin, [0, 0.9, -0.4]), Math.max(0.3, 0.022 * s), 0.8);
    out.chimney = [ox, (d2[1] + top) / 2 + 0.02 * s]; }
  // the drizzle's HOOD (Part 9): a small canvas quarter-dome on two bent rods over the stove — much smaller than the old umbrella
  if (hood) {
    const hx0 = sx0 - 0.05, hx1 = sx1 + 0.05, hy = sy1 + 0.75, hd = sd0 - 0.08, canvas = [176, 52, 44], cream = [234, 222, 196];
    for (const u of [hx0 + 0.04, hx1 - 0.04]) line(x, P(u, sy1, sd1 - 0.05), P(u, hy, sd1 - 0.15), lit(Lt, iron, FRONT, 0.4), Math.max(0.35, 0.03 * s));
    const n = 6;
    for (let i = 0; i < n; i++) { const a0 = hx0 + (hx1 - hx0) * i / n, a1 = hx0 + (hx1 - hx0) * (i + 1) / n;
      fillPts(x, [P(a0, hy, sd1 - 0.15), P(a1, hy, sd1 - 0.15), P(a1, hy - 0.22, hd), P(a0, hy - 0.22, hd)], lit(Lt, i % 2 ? cream : canvas, [0, 0.6, -0.8])); }
    line(x, P(hx0, hy - 0.22, hd), P(hx1, hy - 0.22, hd), rimCol(Lt, canvas, [0, 0.4, -0.9]), Math.max(0.35, 0.03 * s), 0.85);
  }
}
function wheel(x, P, Lt, K, u, yc, d, R, far, roll = 0) {
  const s = P.s, [cx, cy] = P(u, yc, d), rr = R * s, spin = -roll / R;
  const tyre = lit(Lt, [30, 30, 34], FRONT, 0.3), paint = lit(Lt, far ? shade(K.wheel, -0.35) : K.wheel, FRONT), hub = lit(Lt, BRASS, FRONT, 1.2);
  // the iron tyre, the painted felloe, twelve spokes (each with its sunny edge), the brass hub
  x.lineWidth = Math.max(0.6, 0.07 * s); x.strokeStyle = rgb(tyre); x.beginPath(); x.arc(cx, cy, rr - 0.035 * s, 0, Math.PI * 2); x.stroke();
  x.lineWidth = Math.max(0.5, 0.07 * s); x.strokeStyle = rgb(paint); x.beginPath(); x.arc(cx, cy, rr - 0.1 * s, 0, Math.PI * 2); x.stroke();
  x.lineWidth = Math.max(0.35, 0.035 * s);
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6 + 0.13 + spin; x.beginPath(); x.moveTo(cx + Math.cos(a) * 0.1 * s, cy + Math.sin(a) * 0.1 * s); x.lineTo(cx + Math.cos(a) * (rr - 0.12 * s), cy + Math.sin(a) * (rr - 0.12 * s)); x.stroke(); }
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
function handle(x, P, Lt, X, bx0, d, dir = -1) {
  const s = P.s, a = P(bx0 - 0.05 * dir, 1.3, d), b = P(bx0 + 0.62 * dir, 1.42, d);
  line(x, a, b, lit(Lt, [96, 64, 40], FRONT), Math.max(0.6, 0.075 * s));
  line(x, [a[0], a[1] - 0.025 * s], [b[0], b[1] - 0.025 * s], rimCol(Lt, [150, 104, 64], [0, 0.8, -0.6]), Math.max(0.25, 0.02 * s), 0.7);
  if (d < 0.5) {   // the turned-wood grip across the two shafts' ends (seen end-on: a knob)
    const g0 = P(bx0 + 0.66 * dir, 1.42, 0.25), g1 = P(bx0 + 0.66 * dir, 1.42, 0.95);
    line(x, g0, g1, lit(Lt, [120, 80, 48], TOP), Math.max(0.6, 0.09 * s));
    x.fillStyle = rgb(lit(Lt, [120, 80, 48], [-0.5, 0.3, -0.8])); x.beginPath(); x.arc(g0[0], g0[1], 0.07 * s, 0, Math.PI * 2); x.fill();
  }
}
/** the body's front: a raised frame, two panels with gilt pinstriping + corner curls, the trade in gilt across the board */
function bodyFront(x, P, Lt, K, x0, x1, y0, y1, d) {
  const s = P.s, body = lit(Lt, K.body, FRONT), dk = lit(Lt, shade(K.body, -0.3), FRONT), hi = rimCol(Lt, K.body, [0, 0.7, -0.7]);
  const gilt = lit(Lt, GILT, FRONT, 0.9), giltHi = rimCol(Lt, GILT, [0, 0.5, -0.9]);
  // the lettering board (top) + two panels under it
  // (POL4 — the owner: the lettering was hard to read at phone size: a BOLD trade gets a deeper board, the panels under it shorter)
  const bh = K.bold ? 0.6 : 0.4, bd = [x0 + 0.08, x1 - 0.08, y1 - 0.06 - bh, y1 - 0.06], pn = [[x0 + 0.1, (x0 + x1) / 2 - 0.05, y0 + 0.12, y1 - bh - 0.14], [(x0 + x1) / 2 + 0.05, x1 - 0.1, y0 + 0.12, y1 - bh - 0.14]];
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
  const big = !!K.bold, [lx, ly] = P((x0 + x1) / 2, (bd[2] + bd[3]) / 2 - (big ? 0.2 : 0.12), d), size = (bd[3] - bd[2]) * (big ? 0.86 : 0.62) * s, wmax = (bd[1] - bd[0] - (big ? 0.1 : 0.18)) * s;
  x.save(); x.font = big ? `900 ${size}px "Chakra Petch", Orbitron, sans-serif` : FONT(size); x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  const tw = x.measureText(K.word).width, sq = Math.min(1, wmax / Math.max(1, tw));
  x.translate(lx, ly); x.scale(sq, 1);
  // (big: a dark outline round every letter so the cream reads on the green at night too — the sign-writer's keyline)
  if (big) { x.lineJoin = 'round'; x.strokeStyle = rgb(shade(dk, -0.55)); x.lineWidth = Math.max(0.9, size * 0.16); x.strokeText(K.word, 0.04 * s, 0.04 * s); x.strokeText(K.word, 0, 0); }
  x.fillStyle = rgb(shade(dk, -0.4), 0.9); x.fillText(K.word, 0.06 * s, 0.05 * s);
  x.fillStyle = rgb(K.ink ? lit(Lt, K.ink, FRONT, 0.5) : giltHi); x.fillText(K.word, 0, 0);
  x.restore();
  // the body's corner posts (turned, a lit edge)
  for (const u of [x0, x1]) { const a = P(u, y0, d - 0.02), b = P(u, y1, d - 0.02); line(x, a, b, lit(Lt, K.trim, FRONT), Math.max(0.6, 0.09 * s)); line(x, [a[0] + 0.025 * s, a[1]], [b[0] + 0.025 * s, b[1]], rimCol(Lt, K.trim, [0.6, 0.3, -0.7]), Math.max(0.25, 0.02 * s), 0.7); }
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

// ------------------------------------------------------------------ THE CART'S FLOWERS (FP3a: the urn's planting helpers the cart's
// spring flowers use — kept here, live; the dormant urn in props-garden.js imports them)
/** the bed's dome height at (u, d): the flowers mound up in the middle */
export const dome = (B, u, d, H) => { const fu = u / ((B.u1 - B.u0) / 2), fd = (d - (B.d0 + B.d1) / 2) / ((B.d1 - B.d0) / 2); return B.y + H * Math.max(0.15, 1 - 0.5 * fu * fu - 0.35 * fd * fd); };
/** a round blob (a floret, a leaf clump, a bloom) lit as a little sphere: its body + a highlight toward the light */
export function blob(x, Lt, p, rw, rh, c, hiK = 0.6) {
  x.fillStyle = rgb(lit(Lt, c, [0, 0.45, -0.9])); x.beginPath(); x.ellipse(p[0], p[1], rw, rh, 0, 0, Math.PI * 2); x.fill();
  if (hiK > 0) {
    const L = Lt.night > 0.5 ? Lt.ld : Lt.L, ox = Math.max(-0.5, Math.min(0.5, L[0])) * rw * 0.5, oy = -rh * 0.35;
    x.fillStyle = rgb(rimCol(Lt, c, [L[0] * 0.5, 0.8, -0.5]), hiK); x.beginPath(); x.ellipse(p[0] + ox, p[1] + oy, rw * 0.45, rh * 0.4, 0, 0, Math.PI * 2); x.fill();
  }
}
/** a mound of foliage over the bed (back to front), spilling a little over the front lip */
export function foliage(x, P, Lt, B, r, cols, H, n = 46, size = 0.17) {
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
export function tulips(x, P, Lt, B, r) {
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

// ------------------------------------------------------------------ THE SHADOWS
// The boxes a prop's shadow is made of (in its own frame's numbers): { x0, x1, y0, y1, d0, d1 } relative to the prop's x (u) and z
// (d); the cart's umbrella a disc. Every box's shadow on the ground = the hull of its foot + its top, each pushed along the sun by
// its height (core/harbor-light.js#sunShadow): ONE soft fill for the whole prop (the overlaps union), then a contact shadow under it always.
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
    // (FP3b: the low roaster cart — the body, the wheels, the stove, its chimney; no umbrella any more)
    return { e: 1.5, boxes: [{ x0: -1.22, x1: 1.22, y0: 0.74, y1: 1.62, d0: 0.12, d1: 1.18 }, { x0: -1.0, x1: 1.0, y0: 0, y1: 1.2, d0: 0, d1: 1.24 }, { x0: -1.08, x1: -0.08, y0: 1.62, y1: 2.3, d0: 0.28, d1: 0.98 }, { x0: -0.93, x1: -0.79, y0: 2.2, y1: 3.4, d0: 0.82, d1: 0.94 }],
      contact: [{ x0: -1.3, x1: 1.3, d0: 0, d1: 1.25, a: 0.32 }, { x0: -1.05, x1: -0.55, d0: -0.08, d1: 0.1, a: 0.55 }, { x0: 0.55, x1: 1.05, d0: -0.08, d1: 0.1, a: 0.55 }] };
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
export const boxOf = pts => { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), x0 = Math.min(...xs), y0 = Math.min(...ys); return { x: x0, y: y0, w: Math.max(...xs) - x0, h: Math.max(...ys) - y0 }; };
/** the bench on screen (pt): its two ends, from the paving up to the back posts' finials (drawBench's frame) */
export function benchBox(cam, b) {
  const P = frame(cam, b.z, 1.8), hw = (b.w || PIECE.bench.w) / 2, pts = [];
  for (const u of [-hw - 0.05, hw + 0.05]) for (const [y, d] of [[0, 0], [0, 0.92], [1.55, 0.92], [1.55, 0]]) pts.push(P(b.x + u, y, d));
  return boxOf(pts);
}
