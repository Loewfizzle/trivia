// CITY 2.0 — THE HARBOR: THE DORMANT PROPS (FP3a, FREV A1 H6 — split out of props.js, where they were 43 % of the file and nothing
// drew them): THE PLANTER (one crafted Deco urn — `planters: []` in core/harbor-promenade.js#PHONE) and THE MAILBOX (`mailbox: null`).
// Their art is kept for the holiday parts + 8b; stage.js still draws them the moment the layout places one.
import { rgb, shade, mix } from './shapes.js';
import { PIECE } from '../../core/harbor-promenade.js';
import { rngFrom } from '../../core/rng.js';
import { dome, blob, foliage, tulips, boxOf, BRASS } from './props.js';
import { FONT, FRONT, LEFT, RIGHT, TOP, dot, fillPts, frame, lightFor, line, lit, norm, pbox, rimCol, seedOf, soft } from './props-light.js';

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

