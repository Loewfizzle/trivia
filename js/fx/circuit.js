// `card-circuit` (rare — an effect + glowing edges): THE BOARD — copper traces routed across a dark green board (straight runs + 45°
// turns, vias, pads; baked once per size) and SIGNALS racing along them: a hot green head, the trace lit behind it, the pad flaring as it
// arrives. Overclocked: now + then a burst runs every trace at once. Tint: opts.tint.
import { glow, stamp, sprite, rng, unit } from './kit.js';
import { rrect } from './renderer.js';

const cache = new Map();
/** the traces for a size: [{ pts: [[x, y]…], cum, len, ph, sp }] */
function traces(w, h, full) {
  const k = `${Math.round(w)}x${Math.round(h)}`;
  if (cache.has(k)) return cache.get(k);
  const r = rng(77), out = [], step = full ? 9 : 7, n = full ? 26 : 12;
  for (let i = 0; i < n; i++) {
    let x = (0.08 + r() * 0.9) * w, y = r() * h, dir = Math.floor(r() * 8);
    if (!full && x < w * 0.38) x = w * (0.38 + r() * 0.6);          // (the strip: right of the plate)
    const pts = [[x, y]];
    for (let s = 0; s < 14; s++) {
      if (r() < 0.35) dir = (dir + (r() < 0.5 ? 1 : 7)) & 7;
      if (dir % 2 && r() < 0.5) dir = (dir + 1) & 7;                     // (mostly straight runs)
      const a = dir * Math.PI / 4, L = step * (1 + Math.floor(r() * 4));
      const nx = x + Math.cos(a) * L, ny = y + Math.sin(a) * L;
      if (nx < 2 || nx > w - 2 || ny < 2 || ny > h - 2) break;
      x = nx; y = ny; pts.push([x, y]);
    }
    if (pts.length < 3) continue;
    const cum = [0]; for (let j = 1; j < pts.length; j++) cum.push(cum[j - 1] + Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]));
    out.push({ pts, cum, len: cum[cum.length - 1], ph: r(), sp: 0.7 + r() * 0.6 });
  }
  cache.set(k, out); return out;
}
const along = (tr, d) => { let j = 1; while (j < tr.cum.length - 1 && tr.cum[j] < d) j++; const u = Math.max(0, Math.min(1, (d - tr.cum[j - 1]) / Math.max(1e-6, tr.cum[j] - tr.cum[j - 1]))); return [tr.pts[j - 1][0] + (tr.pts[j][0] - tr.pts[j - 1][0]) * u, tr.pts[j - 1][1] + (tr.pts[j][1] - tr.pts[j - 1][1]) * u, j]; };
/** the copper (baked): each trace, its vias + end pads */
const board = (w, h, dpr, full, rgb) => sprite(`fx-circ:${w}x${h}@${dpr}:${rgb}`, w * dpr, h * dpr, (c) => {
  c.scale(dpr, dpr); c.lineCap = 'round'; c.lineJoin = 'round';
  for (const tr of traces(w, h, full)) {
    c.strokeStyle = 'rgba(0,0,0,0.55)'; c.lineWidth = 2.6; c.beginPath(); tr.pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
    c.strokeStyle = `rgba(${rgb},0.28)`; c.lineWidth = 1.2; c.stroke();
    for (const [x, y] of [tr.pts[0], tr.pts[tr.pts.length - 1]]) { c.fillStyle = 'rgba(200,170,90,0.55)'; c.fillRect(x - 2.2, y - 2.2, 4.4, 4.4); c.fillStyle = 'rgba(0,0,0,0.6)'; c.beginPath(); c.arc(x, y, 1, 0, Math.PI * 2); c.fill(); }
    for (let j = 2; j < tr.pts.length - 1; j += 3) { const [x, y] = tr.pts[j]; c.strokeStyle = `rgba(${rgb},0.45)`; c.lineWidth = 0.8; c.beginPath(); c.arc(x, y, 1.6, 0, Math.PI * 2); c.stroke(); }
  }
});

export default {
  id: 'circuit', tier: 'rare', bleed: 0, stillT: 2.1,
  draw(c, s, t, Q) {
    const { w, h } = s, rad = s.opts.radius || 12, full = !!s.opts.full, rgb = s.opts.tint || '61,255,160', U = unit(s), tt = Q.still ? 2.1 : t;
    const dpr = Math.min(3, Math.max(1, Math.round(Q.dpr * 4) / 4));
    c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
    c.drawImage(board(w, h, dpr, full, rgb), 0, 0, w, h);
    c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    const burst = Q.still ? 0 : Math.max(0, Math.sin(tt * 0.5)) ** 30;              // (overclocked: everything at once, now + then)
    const sp = U * 1.4;
    for (const tr of traces(w, h, full)) {
      const per = tr.len / (sp * tr.sp) + 1.2 + tr.ph * 2.5, e = (((tt + tr.ph * 9) % per) + per) % per, d = e * sp * tr.sp, tail = U * 0.6;
      const hd = Math.min(d, tr.len), d0 = Math.max(0, d - tail), over = d - tr.len;
      if (over < tail && hd > d0) {
        let A = along(tr, d0);
        for (let k = 1; k <= 5; k++) {
          const B = along(tr, d0 + (hd - d0) * k / 5), f = k / 5;
          c.globalAlpha = (0.1 + 0.7 * f * f) * (over > 0 ? 1 - over / tail : 1); c.strokeStyle = `rgb(${rgb})`; c.lineWidth = 1 + f;
          c.beginPath(); c.moveTo(A[0], A[1]); for (let q = A[2]; q < B[2]; q++) c.lineTo(tr.pts[q][0], tr.pts[q][1]); c.lineTo(B[0], B[1]); c.stroke(); A = B;
        }
        if (d <= tr.len) { const H = along(tr, hd); stamp(c, glow(rgb, 0.2, 32), H[0], H[1], U * 0.35, 0.8); stamp(c, glow('230,255,240', 0.5, 16), H[0], H[1], 3, 1); }
      }
      if (over > 0 && over < sp * 0.5) { const E = tr.pts[tr.pts.length - 1], f = 1 - over / (sp * 0.5); stamp(c, glow(rgb, 0.2, 32), E[0], E[1], U * 0.5, f); }
      if (burst > 0.02) { c.globalAlpha = 0.5 * burst; c.strokeStyle = `rgb(${rgb})`; c.lineWidth = 1.4; c.beginPath(); tr.pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); }
    }
    c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  },
};
