// CITY 2.0 — THE HARBOR, 11a-2: THANKSGIVING ON THE NEON SIGN (drawn by the sign's dressing: screens/harbor/signdress.js) — the plan: "the
// NEON sign in amber tubes with a crafted HARVEST WREATH (wheat, oak leaves, gourds, warm bulbs; no cartoon turkey)". In LOGO UNITS (the
// letters 0..332 × 0..100, y down).
//   THE WREATH     a real harvest wreath framing the round O: a twisted grapevine ring, sprays of WHEAT radiating from it (golden
//                  stalks, plump grain heads, fine awns), OAK LEAVES in rust, red, gold + brown tucked all round, a cluster of little
//                  GOURDS at its foot under a RAFFIA bow, warm Edison BULBS threaded through it
//   THE SWAGS      a raffia rope along the other letters' tops (the N, the E, the last N) with wheat sprigs + oak leaves at intervals
//                  and its own warm bulbs
// It goes up by `k` (core/harbor-holiday.js#thanksgivingPieces().wreath: the build-up's last ten days — the vine first, then the wheat,
// the leaves, the gourds + the bow, the bulbs last). The bulbs glow after dark (dyn), steady (warm filament light, never twinkling).
import { rngFrom, hashString } from '../../core/rng.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, t) => a + (b - a) * t;

// ------------------------------------------------------------------ the geometry (PURE)
/** the wreath round the O (its centre + radii) */
export const WREATH = Object.freeze({ cx: 208, cy: 50, rx: 44, ry: 58 });
/** the swags along the other letters' tops: [a, b, sag] */
const SWAGS = [[[-4, 5], [64, -1], 10], [[92, -1], [154, -1], 9], [[268, -1], [334, 5], 10]];
const ringAt = (a, k = 1) => [WREATH.cx + Math.cos(a) * WREATH.rx * k, WREATH.cy + Math.sin(a) * WREATH.ry * k];
/** PURE: the wreath's + the swags' pieces: { vine: [[x, y]…]×3, wheat: [{ x, y, a, len }], leaves: [{ x, y, a, s, col }], gourds, bow, bulbs } */
export function wreathPieces() {
  const R = rngFrom(hashString('thanks|wreath')), wheat = [], leaves = [], bulbs = [], gourds = [];
  // the vine: three strands twisting round the ring
  const vine = [0, 1, 2].map(j => { const pts = []; for (let i = 0; i <= 96; i++) { const a = i / 96 * TAU, tw = Math.sin(a * 9 + j * 2.1) * 0.035; pts.push(ringAt(a, 1 + tw)); } return pts; });
  // the wheat: sprays every ~11° (skipping the bow's place at the foot), each three stalks fanning out from the vine
  for (let i = 0; i < 32; i++) {
    const a = i / 32 * TAU + 0.05; if (Math.abs(Math.atan2(Math.sin(a - Math.PI / 2), Math.cos(a - Math.PI / 2))) < 0.42) continue;
    const [x, y] = ringAt(a), out = a + (R() - 0.5) * 0.3;
    for (const d of [-0.22, 0.22]) wheat.push({ x, y, a: out + d + Math.PI * 0.08 * (i % 2 ? 1 : -1), len: 10 + R() * 4, order: 0.2 + 0.3 * (i / 32) });
  }
  // the oak leaves: tucked all round, alternating out + across
  const LC = [[188, 84, 30], [206, 62, 28], [222, 150, 40], [150, 90, 40], [176, 46, 30], [214, 116, 36]];
  for (let i = 0; i < 48; i++) { const a = i / 48 * TAU + 0.09, [x, y] = ringAt(a, 1 + (R() - 0.5) * 0.16); leaves.push({ x, y, a: a + (i % 2 ? 0.9 : -0.6) + (R() - 0.5) * 0.5, s: 8 + R() * 4, col: LC[i % LC.length], order: 0.4 + 0.35 * R() }); }
  // the gourds at its foot (a little cluster round the bow)
  const GC = [[[232, 120, 26], [150, 60, 14]], [[226, 196, 62], [92, 120, 40]], [[238, 232, 214], [170, 160, 140]], [[214, 96, 30], [130, 40, 12]], [[200, 168, 60], [80, 110, 40]]];
  [[-13, 3, 5.2], [-5, 6, 5.8], [4, 5.5, 5], [12, 2.5, 4.6], [-1, -1, 4.2]].forEach(([dx, dy, r], i) => { const [x, y] = ringAt(Math.PI / 2); gourds.push({ x: x + dx, y: y + dy, r, col: GC[i], pear: i % 2 === 1, order: 0.75 + i * 0.03 }); });
  // the bulbs: threaded through the wreath + along the swags
  for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + 0.22; if (Math.abs(Math.atan2(Math.sin(a - Math.PI / 2), Math.cos(a - Math.PI / 2))) < 0.3) continue; const [x, y] = ringAt(a, 1.02); bulbs.push({ x, y }); }
  const swags = SWAGS.map(([a, b, sag]) => { const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t) + Math.sin(Math.PI * t) * sag]); } return pts; });
  swags.forEach(pts => { for (let i = 2; i < pts.length - 1; i += 3) { const [x, y] = pts[i], q = pts[i + 1], tan = Math.atan2(q[1] - y, q[0] - x); wheat.push({ x, y, a: tan - Math.PI / 2 - 0.5, len: 9 + R() * 3, order: 0.35 + R() * 0.2, sw: true }); leaves.push({ x: x + 2, y: y + 1, a: tan + 1.3, s: 6 + R() * 2, col: LC[(i + 2) % LC.length], order: 0.5 + R() * 0.25 }); }
    for (let i = 1; i < pts.length; i += 4) bulbs.push({ x: pts[i][0], y: pts[i][1] + 2.2, sw: true }); });
  return { vine, swags, wheat, leaves, gourds, bulbs, bow: ringAt(Math.PI / 2, 1.0) };
}

const oakLeaf = (x, s) => {
  // a lobed oak leaf along +x from its stem (length s): rounded lobes both sides, narrowing to the tip
  x.beginPath(); x.moveTo(0, 0);
  for (let i = 0; i <= 14; i++) { const t = i / 14, w = Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.05)), 0.8) * s * 0.32 * (1 + 0.42 * Math.sin(t * Math.PI * 7)); x.lineTo(t * s, -w); }
  for (let i = 14; i >= 0; i--) { const t = i / 14, w = Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.05)), 0.8) * s * 0.32 * (1 + 0.42 * Math.sin(t * Math.PI * 7 + 0.4)); x.lineTo(t * s, w); }
  x.closePath();
};

export function createThanksgivingDress() {
  const G = wreathPieces();
  let lastK = 0;
  /** the static pieces (the caches). o = { layer ('silk' | 'glow'), day (0..1), light (x, y) → { i, … } — the tubes' light there } */
  function paint(x, k, o) {
    lastK = k;
    const glow = o.layer === 'glow', day = o.day > 0.5, dk = day ? 1 : 0.62, r = rngFrom(hashString('thanks|paint'));
    x.save(); x.lineCap = 'round'; x.lineJoin = 'round';
    const C = (c, m = 1) => `rgb(${c.map(v => Math.round(Math.min(255, v * dk * m))).join(',')})`;
    if (glow) {
      // the neon's glow ON the dressing: the wheat + the leaves near the tubes catch the amber light (a soft lift, not a colour change)
      for (const w of G.wheat) { if (w.order > k) continue; const L = o.light(w.x, w.y), a = clamp01(L.i * 0.35); if (a < 0.03) continue; x.globalAlpha = a; x.strokeStyle = 'rgb(255,214,140)'; x.lineWidth = 0.8; x.beginPath(); x.moveTo(w.x, w.y); x.lineTo(w.x + Math.cos(w.a) * w.len, w.y + Math.sin(w.a) * w.len); x.stroke(); }
      x.globalAlpha = 1; x.restore(); return;
    }
    // ---- the vine (the ring) + the swags' raffia rope
    if (k > 0.02) {
      const f = clamp01(k / 0.2);
      G.vine.forEach((pts, j) => { x.strokeStyle = C([96 - j * 10, 66 - j * 6, 38]); x.lineWidth = 1.5 - j * 0.3; x.beginPath(); pts.slice(0, Math.max(2, Math.ceil(pts.length * f))).forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py))); x.stroke(); });
      x.strokeStyle = C([206, 178, 112]); x.lineWidth = 1.3;
      for (const pts of G.swags) { x.beginPath(); pts.slice(0, Math.max(2, Math.ceil(pts.length * f))).forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py))); x.stroke(); }
      x.strokeStyle = C([150, 120, 70]); x.lineWidth = 0.4;
      for (const pts of G.swags) for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i]; x.beginPath(); x.moveTo(ax - 0.6, ay - 0.6); x.lineTo(ax + 0.6, ay + 0.6); x.stroke(); }
    }
    // ---- the wheat: a stalk + its head (a plump double row of grains) + the fine awns
    for (const w of G.wheat) {
      if (w.order > k) continue;
      const ex = w.x + Math.cos(w.a) * w.len, ey = w.y + Math.sin(w.a) * w.len, hx = w.x + Math.cos(w.a) * w.len * 0.55, hy = w.y + Math.sin(w.a) * w.len * 0.55;
      x.strokeStyle = C([196, 164, 86]); x.lineWidth = 0.55; x.beginPath(); x.moveTo(w.x, w.y); x.lineTo(hx, hy); x.stroke();
      // (a plump golden head: a body under the grains, the grains in pairs tapering to the tip, short fine awns — never a fletched arrow)
      const n = 5, ca = Math.cos(w.a), sa = Math.sin(w.a);
      x.fillStyle = C([214, 170, 76]); x.beginPath(); x.ellipse((hx + ex) / 2, (hy + ey) / 2, Math.hypot(ex - hx, ey - hy) / 2 + 0.6, 1.5, w.a, 0, TAU); x.fill();
      for (let i = 0; i < n; i++) { const t = i / (n - 1), gx = lerp(hx, ex, t), gy = lerp(hy, ey, t), sz = 1 - t * 0.35;
        for (const sd of [-1, 1]) { x.fillStyle = C(i % 2 ? [236, 194, 96] : [246, 214, 122]); x.beginPath(); x.ellipse(gx - sa * sd * 0.85 * sz, gy + ca * sd * 0.85 * sz, 1.35 * sz, 0.8 * sz, w.a + sd * 0.35, 0, TAU); x.fill(); } }
      x.strokeStyle = C([236, 210, 150], 0.9); x.lineWidth = 0.15; x.beginPath(); for (const d of [-0.2, 0.2]) { x.moveTo(ex, ey); x.lineTo(ex + Math.cos(w.a + d) * 2.4, ey + Math.sin(w.a + d) * 2.4); } x.stroke();
    }
    // ---- the oak leaves (lobed, a midrib + a shade toward their tip)
    for (const lf of G.leaves) {
      if (lf.order > k) continue;
      x.save(); x.translate(lf.x, lf.y); x.rotate(lf.a);
      oakLeaf(x, lf.s);
      const g = x.createLinearGradient(0, -lf.s * 0.3, lf.s, lf.s * 0.3); g.addColorStop(0, C(lf.col, 1.12)); g.addColorStop(1, C(lf.col, 0.7)); x.fillStyle = g; x.fill();
      x.strokeStyle = C(lf.col, 0.55); x.lineWidth = 0.3; x.beginPath(); x.moveTo(-1.2, 0); x.lineTo(lf.s * 0.9, 0); x.stroke();
      x.restore();
    }
    // ---- the gourds at the wreath's foot + THE RAFFIA BOW over them
    for (const gd of G.gourds) {
      if (gd.order > k) continue;
      const g = x.createRadialGradient(gd.x - gd.r * 0.35, gd.y - gd.r * 0.4, gd.r * 0.1, gd.x, gd.y, gd.r * 1.1); g.addColorStop(0, C(gd.col[0], 1.15)); g.addColorStop(1, C(gd.col[1]));
      x.fillStyle = g; x.beginPath();
      if (gd.pear) { x.ellipse(gd.x, gd.y + gd.r * 0.2, gd.r * 0.8, gd.r * 0.75, 0, 0, TAU); x.ellipse(gd.x - gd.r * 0.15, gd.y - gd.r * 0.55, gd.r * 0.45, gd.r * 0.5, -0.3, 0, TAU); }
      else x.ellipse(gd.x, gd.y, gd.r, gd.r * 0.82, 0, 0, TAU);
      x.fill();
      x.strokeStyle = C(gd.col[1], 0.8); x.lineWidth = 0.3; for (const q of [-0.4, 0.4]) { x.beginPath(); x.ellipse(gd.x + q * gd.r * 0.5, gd.y, gd.r * 0.35, gd.r * 0.78, 0, -1.2, 1.2); x.stroke(); }
      x.strokeStyle = C([80, 70, 40]); x.lineWidth = 0.7; x.beginPath(); x.moveTo(gd.x, gd.y - gd.r * 0.8); x.lineTo(gd.x + 1, gd.y - gd.r * 1.15); x.stroke();
    }
    if (k > 0.84) {
      const [bx, by] = G.bow, rc = C([226, 200, 140]), rs = C([170, 140, 84]);
      x.fillStyle = rc; x.strokeStyle = rs; x.lineWidth = 0.4;
      for (const sd of [-1, 1]) { x.beginPath(); x.moveTo(bx, by - 4); x.bezierCurveTo(bx + sd * 12, by - 14, bx + sd * 16, by - 2, bx + sd * 2, by - 3); x.closePath(); x.fill(); x.stroke();
        x.beginPath(); x.moveTo(bx + sd * 1, by - 2); x.quadraticCurveTo(bx + sd * 5, by + 8, bx + sd * 8, by + 16); x.lineTo(bx + sd * 5.5, by + 16.5); x.quadraticCurveTo(bx + sd * 3, by + 8, bx, by - 1); x.closePath(); x.fill(); x.stroke(); }
      x.fillStyle = rs; x.beginPath(); x.ellipse(bx, by - 3, 2.6, 2.2, 0, 0, TAU); x.fill();
    }
    // ---- the bulbs' bodies (glass + a brass cap; their glow is dyn)
    if (k > 0.9) for (const b of G.bulbs) { x.fillStyle = C([120, 100, 60]); x.fillRect(b.x - 0.8, b.y - 2.6, 1.6, 1.2); x.fillStyle = day ? 'rgba(250,240,214,0.9)' : 'rgba(120,96,60,0.9)'; x.beginPath(); x.ellipse(b.x, b.y, 1.5, 1.9, 0, 0, TAU); x.fill(); }
    void r; x.restore();
  }
  /** the bulbs lit after dark: a warm filament core + a tight halo (steady — Edison bulbs don't twinkle) */
  function dyn(x, k, o) {
    if (k <= 0.9) return;
    const night = 1 - (o.day || 0) * 0.85;
    if (night < 0.05) return;
    x.save(); x.globalCompositeOperation = 'lighter';
    for (const b of G.bulbs) {
      const g = x.createRadialGradient(b.x, b.y, 0, b.x, b.y, 7); g.addColorStop(0, `rgba(255,214,140,${(0.75 * night).toFixed(3)})`); g.addColorStop(0.35, `rgba(255,170,80,${(0.22 * night).toFixed(3)})`); g.addColorStop(1, 'rgba(255,150,60,0)');
      x.fillStyle = g; x.fillRect(b.x - 7, b.y - 7, 14, 14);
      x.fillStyle = `rgba(255,248,224,${(0.95 * night).toFixed(3)})`; x.beginPath(); x.ellipse(b.x, b.y, 0.8, 1.1, 0, 0, TAU); x.fill();
    }
    x.restore();
  }
  function boxes() { return lastK > 0.9 ? G.bulbs.map(b => ({ x0: b.x - 8, y0: b.y - 8, x1: b.x + 8, y1: b.y + 8 })) : []; }
  return { paint, dyn, boxes, prepare: () => [], moving: () => false, debug: () => ({ k: lastK, wheat: G.wheat.filter(w => w.order <= lastK).length, leaves: G.leaves.filter(l => l.order <= lastK).length, bulbs: lastK > 0.9 ? G.bulbs.length : 0 }) };
}
