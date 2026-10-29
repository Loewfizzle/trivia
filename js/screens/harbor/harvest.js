// CITY 2.0 — THE HARBOR, 11a-2 Group 1: THE HARVEST DISPLAY on the promenade's centre circle (the plan: "the centrepiece rig a big harvest
// display — a cornucopia / a hay-bale + pumpkin pyramid"). WHEN: core/harbor-holiday.js#thanksgivingPieces (`harvest`: from ~Nov 13 to the
// day; a BIG piece — latched: core/harbor-holiday.js#latchBig — so it is simply there at a load, never popping in). Drawn by holidayprops.js
// as ONE z-sorted extra at the inlay's centre (the walkers + the Wednesday party's dance ring round it in depth).
//
// THE PIECE (world units round the inlay's centre, y up, z away): a three-tier PYRAMID of straw bales (the bales' seams + twine bands, the
// fibres, lit as the props are lit), PUMPKINS (classic, white, warty, a squat Cinderella) + GOURD clusters + potted MUMS (rust, gold,
// burgundy) on its ledges + at its foot, a woven wicker CORNUCOPIA on top spilling apples, grapes, gourds + ears of corn, two tall CORN
// SHOCKS tied with twine behind it, and a string of warm Edison BULBS swagged along the ledges (lit live after dark). Baked into one
// sprite per light key (the props' light model: the sun by day, the lamps' pools at night); the bulbs live.
import { project } from '../../core/harbor-layout.js';
import { lightFor, lit, norm } from './props-light.js';
import { pieceCtx } from '../../core/harbor-light.js';
import { safeCtx, BAKE_CAP } from '../../ui/canvas-safe.js';
import { rngFrom } from '../../core/rng.js';
import { reportError } from '../../errlog.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgb = (c, a = 1) => `rgba(${Math.round(Math.max(0, Math.min(255, c[0])))},${Math.round(Math.max(0, Math.min(255, c[1])))},${Math.round(Math.max(0, Math.min(255, c[2])))},${+a.toFixed(3)})`;
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

/** THE PLAN (PURE): the tiers, the shocks, the cornucopia, the pieces on the ledges + at the foot, the bulbs' swags */
export const HARVEST = Object.freeze({
  tiers: Object.freeze([{ x: 2.5, z0: -1.1, z1: 1.1, y0: 0, y1: 0.62 }, { x: 1.7, z0: -0.66, z1: 0.9, y0: 0.62, y1: 1.24 }, { x: 0.92, z0: -0.26, z1: 0.7, y0: 1.24, y1: 1.86 }]),
  shocks: Object.freeze([]),   // (the lamp posts carry the corn shocks — core/harbor-holidayprops.js#thanksgivingSpots; four in a row read busy)
  horn: Object.freeze({ tip: [1.5, 3.15, 0.5], c1: [1.85, 2.15, 0.35], c2: [0.85, 2.0, 0.15], mouth: [-0.5, 2.42, -0.05], r0: 0.05, r1: 0.8 }),
  // [x, y (what it stands on), z, kind, d] — the ledges' pieces (back → front), the foot's
  pieces: Object.freeze([
    [0.6, 1.86, -0.12, 'gourds', 0.5],
    [-1.3, 1.24, -0.48, 'gourds', 0.6], [0, 1.24, -0.5, 'mum:gold', 0.72], [1.28, 1.24, -0.46, 'classic', 0.66],
    [-2.05, 0.62, -0.88, 'classic', 0.95], [-0.95, 0.62, -0.9, 'white', 0.74], [0.05, 0.62, -0.92, 'mum:rust', 0.8], [1.1, 0.62, -0.88, 'warty', 0.84], [2.1, 0.62, -0.86, 'tall', 0.82],
    [-3.55, 0, -0.55, 'mum:burgundy', 0.95], [3.6, 0, -0.5, 'mum:gold', 0.95],
    [-2.85, 0, -1.55, 'classic', 1.2], [-0.7, 0, -1.6, 'gourds', 0.7], [0.9, 0, -1.62, 'corn', 0.8], [2.95, 0, -1.5, 'squat', 1.15],
  ]),
  // the bulbs: swags along the tiers' front top edges (y, z, from x0 to x1, the sag, how many)
  swags: Object.freeze([{ y: 0.6, z: -1.12, x0: -2.5, x1: 2.5, sag: 0.16, n: 3, per: 5 }, { y: 1.22, z: -0.68, x0: -1.7, x1: 1.7, sag: 0.13, n: 2, per: 5 }]),
  box: Object.freeze({ x: 4.3, y1: 4.2, z0: -2.0, z1: 1.9 }),
});
/** the bulbs' places (world, round the inlay's centre) */
export function harvestBulbs() {
  const out = [];
  for (const s of HARVEST.swags) for (let k = 0; k < s.n; k++) { const a = s.x0 + (s.x1 - s.x0) * k / s.n, b = s.x0 + (s.x1 - s.x0) * (k + 1) / s.n; for (let i = 0; i < s.per; i++) { const u = (i + 0.5) / s.per; out.push({ x: a + (b - a) * u, y: s.y - Math.sin(Math.PI * u) * s.sag, z: s.z, ph: out.length * 1.7 }); } }
  return out;
}

const STRAW = [214, 172, 72], STRAW_HI = [242, 212, 120], STRAW_LO = [140, 100, 36], TWINE = [92, 60, 26], WICKER = [190, 140, 74], STALK = [200, 176, 116];
const MUMS = { gold: [[246, 186, 40], [214, 140, 20]], rust: [[206, 86, 30], [150, 52, 20]], burgundy: [[150, 34, 54], [98, 20, 36]] };

/** the display baked for this light: deps = { paintPumpkin(slot, px, col, carved, night) (holidayprops.js), col(x, z) → c => [r, g, b] } */
function paint(L, m, T, dark, dpr, deps) {
  const cam = L.cam, H = HARVEST, B = H.box, P = (x, y, z) => project(cam, m.x + x, y, m.z + z);
  const xs = [], ys = [];
  for (const x of [-B.x, B.x]) for (const z of [B.z0, B.z1]) for (const y of [0, B.y1]) { const p = P(x, y, z); xs.push(p[0]); ys.push(p[1]); }
  const bx0 = Math.floor(Math.min(...xs)) - 2, by0 = Math.floor(Math.min(...ys)) - 2, bx1 = Math.ceil(Math.max(...xs)) + 2, by1 = Math.ceil(Math.max(...ys)) + 4;
  const cv = mk((bx1 - bx0) * dpr, (by1 - by0) * dpr), x = safeCtx(cv);
  if (!x) return null;
  x.setTransform(dpr, 0, 0, dpr, -bx0 * dpr, -by0 * dpr);
  const Lt = lightFor(T || { day: 1 }, { ...pieceCtx(L), lampK: dark }, m.x, m.z), night = (T && T.night || 0) > 0.4 || dark > 0.5;
  const r = rngFrom(4242), s = cam.F / m.z;
  // ---- the contact shadow under it all
  { const [cx, cy] = P(0, 0, 0); x.fillStyle = 'rgba(16,10,8,0.4)'; x.beginPath(); x.ellipse(cx, cy + 0.3 * s, 3.4 * s, 0.75 * s, 0, 0, TAU); x.fill(); }
  // ---- THE CORN SHOCKS (behind): dry stalks gathered at a twine band, flaring to their tassels, leaf blades drooping
  for (const sh of H.shocks) {
    const tieY = sh.h * 0.4, n = 34;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + r() * 0.3, b0 = [sh.x + Math.cos(a) * 0.42, 0, sh.z + Math.sin(a) * 0.3], tie = [sh.x + Math.cos(a) * 0.15, tieY, sh.z + Math.sin(a) * 0.1];
      const top = [sh.x + Math.cos(a) * (0.5 + r() * 0.35) + (r() - 0.5) * 0.25, sh.h * (0.85 + 0.15 * r()), sh.z + Math.sin(a) * 0.3];
      const front = Math.sin(a) < 0, col = lit(Lt, STALK.map(v => v * (0.75 + 0.35 * r())), norm([Math.cos(a), 0.2, Math.sin(a)]), 0.04).map(v => v * (front ? 1 : 0.72));
      const A = P(...b0), Bt = P(...tie), C = P(...top);
      x.strokeStyle = rgb(col); x.lineWidth = Math.max(0.6, 0.055 * s); x.lineCap = 'round';
      x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(Bt[0], Bt[1]); x.quadraticCurveTo(Bt[0] + (C[0] - Bt[0]) * 0.4, Bt[1] - (Bt[1] - C[1]) * 0.6, C[0], C[1]); x.stroke();
      if (r() < 0.55) {   // a leaf blade: out from the stalk above the tie, arching + drooping
        const u = 0.5 + r() * 0.4, L0 = [Bt[0] + (C[0] - Bt[0]) * u, Bt[1] + (C[1] - Bt[1]) * u], dir = Math.cos(a) >= 0 ? 1 : -1, len = (0.5 + r() * 0.5) * s;
        x.strokeStyle = rgb(col.map(v => v * 0.92)); x.lineWidth = Math.max(0.5, 0.07 * s);
        x.beginPath(); x.moveTo(L0[0], L0[1]); x.quadraticCurveTo(L0[0] + dir * len * 0.7, L0[1] - len * 0.4, L0[0] + dir * len, L0[1] + len * 0.25); x.stroke();
      }
    }
    const T0 = P(sh.x, tieY, sh.z - 0.12); x.strokeStyle = rgb(lit(Lt, TWINE, [0, 0, -1], 0)); x.lineWidth = Math.max(0.8, 0.07 * s); x.beginPath(); x.ellipse(T0[0], T0[1], 0.2 * s, 0.05 * s, 0, 0, TAU); x.stroke();
  }
  // ---- THE TIERS of straw bales (each a box: its sides, its top, its front — the seams + twine bands, the fibres)
  const face = (pts, n, col) => { x.beginPath(); pts.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.closePath(); x.fillStyle = rgb(lit(Lt, col, n, 0)); x.fill(); };
  const fibres = (pts, cnt, n) => {
    x.save(); x.beginPath(); pts.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.closePath(); x.clip();
    const X0 = Math.min(...pts.map(p => p[0])), X1 = Math.max(...pts.map(p => p[0])), Y0 = Math.min(...pts.map(p => p[1])), Y1 = Math.max(...pts.map(p => p[1]));
    x.lineCap = 'round';
    for (let i = 0; i < cnt; i++) { const fx = X0 + r() * (X1 - X0), fy = Y0 + r() * (Y1 - Y0), len = 0.6 + r() * 1.8, a = (r() - 0.5) * 0.8; x.strokeStyle = rgb(lit(Lt, r() < 0.5 ? STRAW_HI : STRAW_LO, n, 0), 0.55); x.lineWidth = 0.4; x.beginPath(); x.moveTo(fx, fy); x.lineTo(fx + Math.cos(a) * len, fy + Math.sin(a) * len * 0.5); x.stroke(); }
    x.restore();
  };
  for (const t of H.tiers) {
    const q = (a, b, c2, d) => [a, b, c2, d];
    const L0 = q(P(-t.x, t.y0, t.z0), P(-t.x, t.y0, t.z1), P(-t.x, t.y1, t.z1), P(-t.x, t.y1, t.z0)), R0 = q(P(t.x, t.y0, t.z0), P(t.x, t.y0, t.z1), P(t.x, t.y1, t.z1), P(t.x, t.y1, t.z0));
    const top = q(P(-t.x, t.y1, t.z0), P(t.x, t.y1, t.z0), P(t.x, t.y1, t.z1), P(-t.x, t.y1, t.z1)), front = q(P(-t.x, t.y0, t.z0), P(t.x, t.y0, t.z0), P(t.x, t.y1, t.z0), P(-t.x, t.y1, t.z0));
    face(L0, [-1, 0, 0], mix(STRAW, STRAW_LO, 0.4)); face(R0, [1, 0, 0], mix(STRAW, STRAW_LO, 0.4));
    face(top, [0, 1, 0], mix(STRAW, STRAW_HI, 0.3)); fibres(top, 50, [0, 1, 0]);
    { const g = x.createLinearGradient(0, front[3][1], 0, front[0][1]); g.addColorStop(0, rgb(lit(Lt, mix(STRAW, STRAW_HI, 0.2), [0, 0.2, -1], 0))); g.addColorStop(1, rgb(lit(Lt, STRAW_LO, [0, -0.2, -1], 0)));
      x.beginPath(); front.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.closePath(); x.fillStyle = g; x.fill(); }
    fibres(front, 70, [0, 0, -1]);
    // the bales' seams (1.6-unit bales) + two twine bands on each
    const nb = Math.max(1, Math.round(t.x * 2 / 1.6)), bw = t.x * 2 / nb;
    x.strokeStyle = rgb(lit(Lt, [70, 46, 18], [0, 0, -1], 0), 0.65); x.lineWidth = 0.5;
    for (let i = 1; i < nb; i++) { const xx = -t.x + i * bw, a = P(xx, t.y0, t.z0), b = P(xx, t.y1, t.z0); x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); }
    x.strokeStyle = rgb(lit(Lt, TWINE, [0, 0.5, -1], 0), 0.85); x.lineWidth = Math.max(0.5, 0.03 * s);
    for (let i = 0; i < nb; i++) for (const f of [0.28, 0.72]) { const xx = -t.x + (i + f) * bw, a = P(xx, t.y0, t.z0), b = P(xx, t.y1, t.z0), c2 = P(xx, t.y1, t.z1); x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.lineTo(c2[0], c2[1]); x.stroke(); }
    // loose straws over the front edge
    x.strokeStyle = rgb(lit(Lt, STRAW_HI, [0, 1, -0.3], 0), 0.8); x.lineWidth = 0.4;
    for (let i = 0; i < 10; i++) { const a = P(-t.x + r() * 2 * t.x, t.y1, t.z0); x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(a[0] + (r() - 0.5) * 2, a[1] - 0.6 - r() * 1.4); x.stroke(); }
  }
  // ---- THE CORNUCOPIA (on top): a wicker horn from its curled tip to the open mouth, the weave in bands, the mouth dark inside
  { const Hn = H.horn, bez = u => { const v = 1 - u; return [0, 1, 2].map(i => v * v * v * Hn.tip[i] + 3 * v * v * u * Hn.c1[i] + 3 * v * u * u * Hn.c2[i] + u * u * u * Hn.mouth[i]); };
    const N = 30;
    for (let i = 0; i <= N; i++) {
      const u = i / N, p = bez(u), rr = (Hn.r0 + (Hn.r1 - Hn.r0) * Math.pow(u, 1.5)) * s, [cx, cy] = P(...p);
      const band = (i % 3 === 0) ? 0.78 : 1, col = lit(Lt, WICKER.map(v => v * band), [0, 0.6, -0.8], 0.08);
      const g = x.createRadialGradient(cx - rr * 0.35, cy - rr * 0.4, rr * 0.1, cx, cy, rr * 1.05); g.addColorStop(0, rgb(col.map(v => v * 1.15))); g.addColorStop(1, rgb(col.map(v => v * 0.55)));
      x.fillStyle = g; x.beginPath(); x.ellipse(cx, cy, rr, rr * 0.92, 0, 0, TAU); x.fill();
      if (i % 2 === 0 && rr > 1.2) { x.strokeStyle = rgb(col.map(v => v * 0.6), 0.6); x.lineWidth = 0.45; for (let k = -2; k <= 2; k++) { x.beginPath(); x.moveTo(cx + k * rr * 0.35, cy - rr * 0.85); x.lineTo(cx + k * rr * 0.35 - rr * 0.18, cy + rr * 0.85); x.stroke(); } }
    }
    const [mx, my] = P(...Hn.mouth), mr = Hn.r1 * s;
    x.fillStyle = rgb(lit(Lt, [70, 44, 20], [0, 0, -1], 0)); x.beginPath(); x.ellipse(mx - mr * 0.12, my, mr * 0.62, mr * 0.88, 0.25, 0, TAU); x.fill();
    x.strokeStyle = rgb(lit(Lt, mix(WICKER, [255, 230, 170], 0.25), [-0.4, 0.4, -0.8], 0.1)); x.lineWidth = Math.max(0.8, 0.06 * s); x.beginPath(); x.ellipse(mx - mr * 0.12, my, mr * 0.66, mr * 0.92, 0.25, 0, TAU); x.stroke();
    // the spill: grapes, apples, small gourds tumbling out of the mouth down onto the top bale
    const spill = (wx, wy, wz, kind) => { const [sx, sy] = P(wx, wy, wz), rr = 0.15 * s;
      if (kind === 'grapes') for (let i = 0; i < 14; i++) { const gx = sx + (r() - 0.5) * rr * 2.4, gy = sy - r() * rr * 2 + i * 0.05 * rr; const g = x.createRadialGradient(gx - rr * 0.15, gy - rr * 0.15, 0, gx, gy, rr * 0.4); g.addColorStop(0, rgb(lit(Lt, [150, 96, 190], [0, 0.5, -1], 0.3))); g.addColorStop(1, rgb(lit(Lt, [64, 26, 84], [0, 0, -1], 0))); x.fillStyle = g; x.beginPath(); x.arc(gx, gy, rr * 0.38, 0, TAU); x.fill(); }
      else { const col = kind === 'apple' ? [196, 30, 34] : [224, 150, 40], g = x.createRadialGradient(sx - rr * 0.3, sy - rr * 0.35, 0, sx, sy, rr); g.addColorStop(0, rgb(lit(Lt, col.map(v => Math.min(255, v * 1.3)), [0, 0.6, -0.8], 0.4))); g.addColorStop(1, rgb(lit(Lt, col.map(v => v * 0.5), [0, 0, -1], 0)));
        x.fillStyle = g; x.beginPath(); x.arc(sx, sy, rr, 0, TAU); x.fill(); if (kind === 'apple') { x.strokeStyle = rgb(lit(Lt, [70, 50, 30], [0, 1, 0], 0)); x.lineWidth = 0.5; x.beginPath(); x.moveTo(sx, sy - rr * 0.8); x.lineTo(sx + rr * 0.2, sy - rr * 1.3); x.stroke(); } } };
    spill(-0.8, 2.12, -0.2, 'grapes'); spill(-1.05, 2.0, -0.32, 'apple'); spill(-0.45, 1.98, -0.36, 'gourd'); spill(-1.3, 1.93, -0.24, 'apple'); spill(-0.75, 1.92, -0.44, 'gourd'); spill(-1.55, 1.9, -0.3, 'grapes'); spill(-0.2, 1.92, -0.4, 'apple');
  }
  // ---- THE PIECES on the ledges + at the foot (back → front): pumpkins + gourds (holidayprops' painter), potted mums, ears of corn
  const order = H.pieces.slice().sort((a, b) => b[2] - a[2]);
  for (const [px, py, pz, kind, d] of order) {
    const [sx, sy] = P(px, py, pz), sc = cam.F / (m.z + pz);
    if (kind.startsWith('mum:')) { mum(x, sx, sy, d * sc, MUMS[kind.slice(4)], Lt, r); continue; }
    if (kind === 'apples') { for (let i = 0; i < 4; i++) { const ax = sx + (i - 1.5) * 0.17 * sc, ay = sy - (i % 2) * 0.1 * sc, rr = 0.14 * sc, g = x.createRadialGradient(ax - rr * 0.3, ay - rr * 1.3, 0, ax, ay - rr, rr * 1.1); g.addColorStop(0, rgb(lit(Lt, [236, 70, 60], [0, 0.6, -0.8], 0.4))); g.addColorStop(1, rgb(lit(Lt, [110, 16, 20], [0, 0, -1], 0))); x.fillStyle = g; x.beginPath(); x.arc(ax, ay - rr, rr, 0, TAU); x.fill(); } continue; }
    if (kind === 'corn') { for (let i = 0; i < 3; i++) { const cx = sx + (i - 1) * 0.22 * sc, len = 0.62 * sc; x.save(); x.translate(cx, sy - 0.08 * sc); x.rotate(-0.25 + i * 0.25); x.fillStyle = rgb(lit(Lt, [226, 186, 70], [0, 0.4, -1], 0.1)); x.beginPath(); x.ellipse(0, -len * 0.45, 0.08 * sc, len * 0.45, 0, 0, TAU); x.fill(); x.fillStyle = rgb(lit(Lt, [200, 180, 130], [0, 0.4, -1], 0)); x.beginPath(); x.moveTo(-0.1 * sc, 0); x.quadraticCurveTo(-0.22 * sc, -len * 0.5, -0.04 * sc, -len * 0.7); x.lineTo(0, -len * 0.2); x.closePath(); x.fill(); x.restore(); } continue; }
    const slot = { kind, face: 'none', seed: Math.floor(r() * 1e6), d };
    const sp = deps.paintPumpkin(slot, d * sc * dpr, deps.col(m.x + px, m.z + pz), false, night);
    x.drawImage(sp.cv, sx - sp.cx / dpr, sy - sp.foot / dpr, sp.w / dpr, sp.h / dpr);
  }
  return { cv, x: bx0, y: by0, w: bx1 - bx0, h: by1 - by0 };
}
/** a potted chrysanthemum: a terracotta pot (its rim, its shade) + a dome of small florets in two tones, lit from above */
export function mum(x, sx, sy, d, cols, Lt, r) {
  const pw = d * 0.62, ph = d * 0.42, top = sy - ph;
  const pot = lit(Lt, [176, 92, 56], [0, 0.2, -1], 0.05);
  x.fillStyle = rgb(pot); x.beginPath(); x.moveTo(sx - pw * 0.42, sy); x.lineTo(sx - pw * 0.5, top); x.lineTo(sx + pw * 0.5, top); x.lineTo(sx + pw * 0.42, sy); x.closePath(); x.fill();
  x.fillStyle = rgb(pot.map(v => v * 1.12)); x.fillRect(sx - pw * 0.55, top - ph * 0.12, pw * 1.1, ph * 0.18);
  x.fillStyle = rgb(pot.map(v => v * 0.6)); x.fillRect(sx + pw * 0.2, top + ph * 0.06, pw * 0.25, ph * 0.9);
  const R = d * 0.48, cy = top - R * 0.55;
  x.fillStyle = rgb(lit(Lt, [44, 70, 34], [0, 0.4, -1], 0)); x.beginPath(); x.ellipse(sx, cy + R * 0.2, R * 1.02, R * 0.72, 0, 0, TAU); x.fill();
  for (let i = 0; i < 70; i++) { const a = r() * TAU, rr = Math.sqrt(r()), fx = sx + Math.cos(a) * R * rr, fy = cy + Math.sin(a) * R * 0.7 * rr - (1 - rr) * R * 0.3, up = 1 - (fy - (cy - R)) / (R * 1.6);
    x.fillStyle = rgb(lit(Lt, mix(cols[1], cols[0], clamp01(up + (r() - 0.5) * 0.3)), [0, 0.7, -0.7], 0.05)); x.beginPath(); x.arc(fx, fy, Math.max(0.45, R * 0.12), 0, TAU); x.fill(); }
}

// ------------------------------------------------------------------ C4c — THE 3D MODEL TEST (the owner's Oct 28 note; `&prop=model`)
// Grok's test model (a Grok Imagine reference → Tencent Hunyuan3D 2.1, AI-generated — art/models/harvest/credits.txt) baked OFFLINE by
// scripts/bake-model.mjs harvest at the city camera's real view of the compass into assets/city/harvest/{day,night}.webp (+ harvest.json:
// its foot in the sprite, its pt per unit at the bake's depth). LAZY: fetched only once the switch is on (&prop=model or the HOLIDAYS row
// THE HARVEST DISPLAY · 3D MODEL); the hand-drawn display stands in until it's in, or if it fails. Night blended over day by the
// darkness; its lamp light taken down with the lamps (the TR-3B's blackout: o.dark carries the drain). Not the default until the owner picks it.
// C4d (the owner, Oct 29: the model + drawn links looked IDENTICAL on his iPhone — the live site loads it in WebKit + Chromium, so a
// failure there was SILENT): the load's state is told — `mState` (asked / in / failed + why, in ms since asked), every change to the
// watchers (scene.js writes it into the LOAD LOG: &debug=1's load strip), a failure reported to /admin (errlog) once a page; a decode()
// that never settles can't hold it (DECODE_MS); a failed load tries once more after RETRY_MS.
const MODEL_BASE = new URL('../../../assets/city/harvest/', import.meta.url);
const DECODE_MS = 2500, RETRY_MS = 15000;
let mLoading = null, mModel = null, mFailed = false, mTries = 0, mReported = false;
const mState = { state: 'idle', ms: 0, why: '' }, mWatch = new Set();
const mSet = (state, why = '', t0 = 0) => { mState.state = state; mState.why = why; mState.ms = t0 ? Math.round(performance.now() - t0) : 0; for (const fn of mWatch) { try { fn({ ...mState }); } catch { /* a watcher's own problem */ } } };
/** the model's load state ({ state: idle | loading | in | failed, ms, why }) + a watcher for its changes (→ an unsubscribe) */
export const harvestModelState = () => ({ ...mState, tries: mTries });
export const onHarvestModel = fn => { mWatch.add(fn); return () => mWatch.delete(fn); };
function harvestModel() {
  if (mModel || mFailed) return mModel;
  if (!mLoading) {
    const t0 = performance.now(); mTries++;
    const img = name => new Promise((res, rej) => { const i = new Image(); i.decoding = 'async';
      i.onload = () => Promise.race([i.decode ? i.decode().catch(() => {}) : Promise.resolve(), new Promise(r => setTimeout(r, DECODE_MS))]).then(() => res(i));
      i.onerror = () => rej(new Error(`harvest sprite ${name} didn't load`)); i.src = new URL(name, MODEL_BASE).href; });
    mSet('loading', `try ${mTries}`, t0);
    mLoading = (async () => {
      const r = await fetch(new URL('harvest.json', MODEL_BASE).href); if (!r.ok) throw new Error(`harvest.json ${r.status}`);
      const meta = await r.json(), [day, night] = await Promise.all([img('day.webp'), img('night.webp')]);
      if (!(day.naturalWidth > 0 && night.naturalWidth > 0)) throw new Error('harvest sprites empty after load');
      mModel = { ...meta, day, night }; mSet('in', `${meta.w}×${meta.h}`, t0); return mModel;
    })();
    mLoading.catch(e => {
      mFailed = true; mSet('failed', String((e && e.message) || e).slice(0, 120), t0);
      if (!mReported) { mReported = true; reportError(e instanceof Error ? e : new Error(String(e)), 'harvest-model'); }
      if (mTries < 2) setTimeout(() => { mFailed = false; mLoading = null; }, RETRY_MS);
    });
  }
  return mModel;
}
/** the model's Edison bulbs (CODE, on top): swags along its two lower ledges' front edges, in the sprite's fractions (measured on the
 *  4.4 u bake: the bottom tier's top at 0.74 of its height, the next at 0.555) — { y, x0, x1, sag, n (swags), per (bulbs a swag) } */
export const MODEL_SWAGS = Object.freeze([{ y: 0.742, x0: 0.142, x1: 0.866, sag: 0.02, n: 3, per: 5 }, { y: 0.555, x0: 0.205, x1: 0.803, sag: 0.016, n: 2, per: 5 }]);
/** whether the model's sprites were ever asked for (the tests: never without the switch) */
export const harvestModelAsked = () => !!mLoading;

export function createHarvest(deps) {
  const cache = new Map(); let last = null;
  const bulbs = harvestBulbs(), stat = { drawn: 0, rect: null, bulbs: 0, model: false };
  let mCv = null;   // (the model's sprite composed for this light: day / night + the lamps' level — also the floods' rim source)
  /** the 3D model's sprite at the display's place → true when drawn (false: not loaded yet — the drawn display stands in) */
  function drawModel(c, o) {
    const M = harvestModel(); if (!M) return false;
    const { L, m } = o, cam = L.cam, T = o.T || {}, n = clamp01(Math.max(T.night || 0, (o.dark || 0) > 0.5 ? (o.dark || 0) : 0, 1 - clamp01((T.day || 0) + (T.gold || 0)))), lamp = clamp01(o.dark || 0);
    if (!mCv) mCv = document.createElement('canvas');
    if (mCv.width !== M.w || mCv.height !== M.h) { mCv.width = M.w; mCv.height = M.h; }
    const x = safeCtx(mCv); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.clearRect(0, 0, M.w, M.h);
    if (n < 0.999) x.drawImage(M.day, 0, 0);
    if (n > 0.001) { x.globalAlpha = n; x.drawImage(M.night, 0, 0); x.globalAlpha = 1; }
    // (the night sprite carries the lamps' light: with the lamps down — the dusk before they catch, the blackout — it darkens on its own pixels)
    const dim = n * (1 - lamp) * 0.72; if (dim > 0.01) { x.globalCompositeOperation = 'source-atop'; x.fillStyle = `rgba(10,8,22,${dim.toFixed(3)})`; x.fillRect(0, 0, M.w, M.h); x.globalCompositeOperation = 'source-over'; }
    const [fx, fy] = project(cam, m.x, 0, m.z), k = (cam.F / m.z) / M.ppu / M.dpr, w = M.w * k, h = M.h * k, sx = fx - M.footX * k, sy = fy - M.footY * k;
    c.save(); c.globalAlpha = o.fade == null ? 1 : o.fade; c.drawImage(mCv, sx, sy, w, h);
    // THE BULBS (as the drawn display's): a warm Edison bulb each (by day a pale glass bead), after dark a warm core + a tight halo
    const nk = clamp01(o.lit || 0) * (o.power == null ? 1 : o.power), s = cam.F / m.z; let nb = 0;
    for (const sw of MODEL_SWAGS) for (let q = 0; q < sw.n; q++) { const a = sw.x0 + (sw.x1 - sw.x0) * q / sw.n, b = sw.x0 + (sw.x1 - sw.x0) * (q + 1) / sw.n;
      for (let i = 0; i < sw.per; i++) { const u = (i + 0.5) / sw.per, bx = sx + (a + (b - a) * u) * w, by = sy + (sw.y + Math.sin(Math.PI * u) * sw.sag) * h;
        c.globalCompositeOperation = 'source-over'; c.fillStyle = nk > 0.05 ? `rgba(255,236,190,${(0.6 + 0.4 * nk).toFixed(2)})` : 'rgba(236,226,200,0.85)'; c.beginPath(); c.arc(bx, by, Math.max(0.6, 0.05 * s), 0, TAU); c.fill();
        if (nk > 0.05) { c.globalCompositeOperation = 'lighter'; const R = 0.32 * s, g = c.createRadialGradient(bx, by, 0, bx, by, R); g.addColorStop(0, `rgba(255,200,120,${(0.65 * nk).toFixed(3)})`); g.addColorStop(1, 'rgba(255,170,80,0)'); c.fillStyle = g; c.fillRect(bx - R, by - R, R * 2, R * 2); nb++; } } }
    c.restore();
    last = { cv: mCv, x: sx, y: sy, w, h };
    stat.drawn++; stat.model = true; stat.bulbs = nb; stat.rect = { x: sx, y: sy, w, h };
    return true;
  }
  function draw(c, o) {
    if (o.model && drawModel(c, o)) return;
    stat.model = false;
    const { L, m } = o, dpr = Math.min(BAKE_CAP, o.dpr || 2), key = `${L.cam.W}x${L.cam.H}|${dpr}|${o.lightKey || ''}`;
    let sp = cache.get(key);
    if (!sp) { sp = paint(L, m, o.T, o.dark || 0, dpr, { ...deps, col: o.col }); if (!sp) return; cache.set(key, sp); if (cache.size > 6) { const k0 = cache.keys().next().value; const v = cache.get(k0); if (v && v.cv) v.cv.width = v.cv.height = 0; cache.delete(k0); } }
    last = sp;
    c.save(); c.globalAlpha = o.fade == null ? 1 : o.fade;
    c.drawImage(sp.cv, sp.x, sp.y, sp.w, sp.h);
    // THE BULBS: a warm Edison bulb each (by day a small pale glass bead), after dark a warm core + a tight halo
    const nk = clamp01(o.lit || 0) * (o.power == null ? 1 : o.power), cam = L.cam;
    let n = 0;
    for (const b of bulbs) {
      const [bx, by] = project(cam, m.x + b.x, b.y, m.z + b.z), s = cam.F / (m.z + b.z);
      c.globalCompositeOperation = 'source-over'; c.fillStyle = nk > 0.05 ? `rgba(255,236,190,${(0.6 + 0.4 * nk).toFixed(2)})` : 'rgba(236,226,200,0.85)'; c.beginPath(); c.arc(bx, by, Math.max(0.6, 0.05 * s), 0, TAU); c.fill();
      if (nk > 0.05) { c.globalCompositeOperation = 'lighter'; const R = 0.32 * s, g = c.createRadialGradient(bx, by, 0, bx, by, R); g.addColorStop(0, `rgba(255,200,120,${(0.65 * nk).toFixed(3)})`); g.addColorStop(1, 'rgba(255,170,80,0)'); c.fillStyle = g; c.fillRect(bx - R, by - R, R * 2, R * 2); n++; }
    }
    c.restore();
    stat.drawn++; stat.bulbs = n; stat.rect = { x: sp.x, y: sp.y, w: sp.w, h: sp.h };
  }
  return { draw, lastSprite: () => last, debug: () => ({ ...stat, sprites: cache.size, modelAsked: harvestModelAsked(), modelIn: !!mModel, modelState: harvestModelState() }), destroy() { for (const v of cache.values()) if (v && v.cv) v.cv.width = v.cv.height = 0; cache.clear(); if (mCv) mCv.width = mCv.height = 0; mCv = null; last = null; void last; } };
}

// ------------------------------------------------------------------ 11a-2 — THE NOVEMBER SPOT DRESSINGS (core/harbor-spots.js's spots)
/** a corn-stalk bundle tied round a post (x, z its foot; h tall; the twine at 0.42 h) — the stalks flaring above the tie to their tassels,
 *  leaf blades arching out; drawn round the post (the back half darker) */
function bundle(x, P, Lt, r, h, s, rad = 0.36) {
  const tieY = h * 0.42, n = 26;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + r() * 0.3, front = Math.sin(a) < 0;
    const b0 = [Math.cos(a) * rad, 0, Math.sin(a) * rad * 0.7], tie = [Math.cos(a) * 0.11, tieY, Math.sin(a) * 0.08], top = [Math.cos(a) * (0.35 + r() * 0.3), h * (0.85 + 0.15 * r()), Math.sin(a) * 0.25];
    const col = lit(Lt, STALK.map(v => v * (0.75 + 0.35 * r())), norm([Math.cos(a), 0.2, Math.sin(a)]), 0.04).map(v => v * (front ? 1 : 0.7));
    const A = P(...b0), B = P(...tie), C = P(...top);
    x.strokeStyle = rgb(col); x.lineWidth = Math.max(0.55, 0.05 * s); x.lineCap = 'round';
    x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); x.quadraticCurveTo(B[0] + (C[0] - B[0]) * 0.4, B[1] - (B[1] - C[1]) * 0.6, C[0], C[1]); x.stroke();
    if (r() < 0.5) { const u = 0.5 + r() * 0.4, L0 = [B[0] + (C[0] - B[0]) * u, B[1] + (C[1] - B[1]) * u], dir = Math.cos(a) >= 0 ? 1 : -1, len = (0.4 + r() * 0.4) * s;
      x.lineWidth = Math.max(0.5, 0.06 * s); x.beginPath(); x.moveTo(L0[0], L0[1]); x.quadraticCurveTo(L0[0] + dir * len * 0.7, L0[1] - len * 0.4, L0[0] + dir * len, L0[1] + len * 0.25); x.stroke(); }
  }
  const T0 = P(0, tieY, -0.1); x.strokeStyle = rgb(lit(Lt, TWINE, [0, 0, -1], 0)); x.lineWidth = Math.max(0.8, 0.06 * s); x.beginPath(); x.ellipse(T0[0], T0[1], 0.15 * s, 0.04 * s, 0, 0, TAU); x.stroke();
}
/** a straw bale (w × d × h) at the origin, its long side to us */
function bale(x, P, Lt, r, w, d, h, s) {
  const q = (...p) => p, hw = w / 2, hd = d / 2;
  const fill = (pts, n, col) => { x.beginPath(); pts.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.closePath(); x.fillStyle = rgb(lit(Lt, col, n, 0)); x.fill(); };
  fill(q(P(-hw, 0, -hd), P(-hw, 0, hd), P(-hw, h, hd), P(-hw, h, -hd)), [-1, 0, 0], mix(STRAW, STRAW_LO, 0.4));
  fill(q(P(hw, 0, -hd), P(hw, 0, hd), P(hw, h, hd), P(hw, h, -hd)), [1, 0, 0], mix(STRAW, STRAW_LO, 0.4));
  fill(q(P(-hw, h, -hd), P(hw, h, -hd), P(hw, h, hd), P(-hw, h, hd)), [0, 1, 0], mix(STRAW, STRAW_HI, 0.3));
  const front = q(P(-hw, 0, -hd), P(hw, 0, -hd), P(hw, h, -hd), P(-hw, h, -hd));
  { const g = x.createLinearGradient(0, front[3][1], 0, front[0][1]); g.addColorStop(0, rgb(lit(Lt, mix(STRAW, STRAW_HI, 0.2), [0, 0.2, -1], 0))); g.addColorStop(1, rgb(lit(Lt, STRAW_LO, [0, -0.2, -1], 0))); x.beginPath(); front.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.closePath(); x.fillStyle = g; x.fill(); }
  x.save(); x.beginPath(); front.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.closePath(); x.clip(); x.lineCap = 'round';
  const X0 = Math.min(...front.map(p => p[0])), X1 = Math.max(...front.map(p => p[0])), Y0 = Math.min(...front.map(p => p[1])), Y1 = Math.max(...front.map(p => p[1]));
  for (let i = 0; i < 40; i++) { const fx = X0 + r() * (X1 - X0), fy = Y0 + r() * (Y1 - Y0), len = 0.6 + r() * 1.6, a = (r() - 0.5) * 0.8; x.strokeStyle = rgb(lit(Lt, r() < 0.5 ? STRAW_HI : STRAW_LO, [0, 0, -1], 0), 0.55); x.lineWidth = 0.4; x.beginPath(); x.moveTo(fx, fy); x.lineTo(fx + Math.cos(a) * len, fy + Math.sin(a) * len * 0.5); x.stroke(); }
  x.restore();
  x.strokeStyle = rgb(lit(Lt, TWINE, [0, 0.5, -1], 0), 0.85); x.lineWidth = Math.max(0.5, 0.03 * s);
  for (const f of [0.28, 0.72]) { const xx = -hw + f * w, a = P(xx, 0, -hd), b = P(xx, h, -hd), c2 = P(xx, h, hd); x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.lineTo(c2[0], c2[1]); x.stroke(); }
}
/**
 * one November SPOT PIECE baked for this light: piece = { x, z (world: its foot), parts: [['bale'], ['pumpkin', kind, d, dx, dz, onBale],
 * ['gourds', d, dx, dz, onBale], ['mum', colour, d, dx, dz], ['stalks', h]] } → { cv, x, y, w, h } (screen pt) | null.
 * deps = { paintPumpkin, col(x, z) }
 */
export function paintSpotPiece(L, pc, T, dark, dpr, deps) {
  const cam = L.cam, P = (x, y, z) => project(cam, pc.x + x, y, pc.z + z), s = cam.F / pc.z, ext = pc.ext || [1.6, 3.4];
  const pts = [P(-ext[0], 0, -0.9), P(ext[0], 0, -0.9), P(-ext[0], ext[1], 0.9), P(ext[0], ext[1], 0.9), P(-ext[0], 0, 0.9), P(ext[0], ext[1], -0.9)];
  const bx0 = Math.floor(Math.min(...pts.map(p => p[0]))) - 3, by0 = Math.floor(Math.min(...pts.map(p => p[1]))) - 3, bx1 = Math.ceil(Math.max(...pts.map(p => p[0]))) + 3, by1 = Math.ceil(Math.max(...pts.map(p => p[1]))) + 3;
  const cv = mk((bx1 - bx0) * dpr, (by1 - by0) * dpr), x = safeCtx(cv);
  if (!x) return null;
  x.setTransform(dpr, 0, 0, dpr, -bx0 * dpr, -by0 * dpr);
  const Lt = lightFor(T || { day: 1 }, { ...pieceCtx(L), lampK: dark }, pc.x, pc.z), night = (T && T.night || 0) > 0.4 || dark > 0.5, r = rngFrom(pc.seed || 77);
  const BALE_H = 0.62;
  { const [cx, cy] = P(0, 0, 0); x.fillStyle = 'rgba(16,10,8,0.36)'; x.beginPath(); x.ellipse(cx, cy + 0.1 * s, (pc.shadow || 0.9) * s, 0.22 * s, 0, 0, TAU); x.fill(); }
  for (const part of pc.parts) {
    const [kind] = part;
    if (kind === 'stalks') bundle(x, P, Lt, r, part[1], s, part[2] || 0.36);
    else if (kind === 'bale') bale(x, P, Lt, r, part[1] || 1.6, part[2] || 0.85, BALE_H, s);
    else if (kind === 'mum') { const [, c, d, dx, dz, on] = part, [sx, sy] = P(dx, on ? BALE_H : 0, dz); mum(x, sx, sy, d * cam.F / (pc.z + dz), MUMS[c], Lt, r); }
    else if (kind === 'pumpkin' || kind === 'gourds') {
      const k2 = kind === 'gourds' ? 'gourds' : part[1], d = kind === 'gourds' ? part[1] : part[2], dx = kind === 'gourds' ? part[2] : part[3], dz = kind === 'gourds' ? part[3] : part[4], on = kind === 'gourds' ? part[4] : part[5];
      const [sx, sy] = P(dx, on ? BALE_H : 0, dz), sc = cam.F / (pc.z + dz);
      const sp = deps.paintPumpkin({ kind: k2, face: 'none', seed: Math.floor(r() * 1e6), d }, d * sc * dpr, deps.col(pc.x + dx, pc.z + dz), false, night);
      x.drawImage(sp.cv, sx - sp.cx / dpr, sy - sp.foot / dpr, sp.w / dpr, sp.h / dpr);
    }
  }
  return { cv, x: bx0, y: by0, w: bx1 - bx0, h: by1 - by0 };
}
