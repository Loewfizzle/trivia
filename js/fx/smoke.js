// `card-smoke` — SMOKE (an uncommon's one clear effect): a cigar lounge's slow smoke. BANKS of it drift across the strip in two depths
// (far: thin + slow; near: fuller + faster) — each bank a soft baked blob STRETCHED flat (smoke in a still room hangs in layers), turning
// slowly as it goes; near the right edge the smoke RISES + CURLS off the card and thins out; two RIBBONS (continuous, not dots) curl up
// from below, widening + fading as they climb; a warm lamp off the top-left (the material's glow) lights the smoke nearest it amber.
// Placed by time (stateless): the same frame at the same t on every phone; a still frame for reduced motion.
import { puff, rng, smooth, wob, fract, unit } from './kit.js';
import { rrect } from './renderer.js';

const COOL = '196,202,216', WARM = '255,190,132';

function bank(c, img, x, y, d, sx, sy, rot, a) {
  if (a <= 0.004) return;
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(sx, sy);
  c.globalAlpha = a > 1 ? 1 : a; c.drawImage(img, -d / 2, -d / 2, d, d);
  c.restore();
}
/** a ribbon of smoke: the path's points [[x, y, w]] stroked in three soft passes, each segment faded by its own alpha */
function ribbon(c, pts, alpha, rgb) {
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (const [k, a] of [[3.2, 0.06], [1.7, 0.12], [0.7, 0.22]]) {
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0, w0, a0] = pts[i - 1], [x1, y1, , a1] = pts[i];
      const al = a * alpha * (a0 + a1) / 2; if (al <= 0.004) continue;
      c.globalAlpha = al; c.strokeStyle = `rgb(${rgb})`; c.lineWidth = Math.max(0.6, w0 * k);
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    }
  }
}

export default {
  id: 'smoke', tier: 'uncommon', bleed: 0, stillT: 6.5,
  draw(c, s, t, Q) {
    const { w, h } = s, r = rng(31 + (s.opts.seed || 0)), U = unit(s), full = !!s.opts.full;
    c.save(); rrect(c, 0, 0, w, h, s.opts.radius || 12); c.clip();
    const n = Math.round((s.opts.calm ? 16 : 20) * (full ? 3.2 : 1) * (0.55 + 0.45 * Q.q));
    for (let i = 0; i < n; i++) {
      const near = i % 3 !== 0, sp = (near ? 0.026 : 0.014) * (0.75 + r() * 0.5), ph = r(), y0 = 0.1 + r() * 0.85, sz = (near ? 1.25 : 0.85) * (0.8 + r() * 0.5), rot0 = (r() - 0.5) * 0.5, v = i % 4, flat = 1.7 + r() * 0.9;
      const u = fract(ph + t * sp);                       // 0 → 1 across the strip (+ a margin each side)
      const x = (u * 1.4 - 0.2) * w;
      // the curl: past ~65 % of the way the bank lifts, swells, rounds up (less flat) + turns, and thins as it leaves over the edge
      const k = smooth(0.6, 1, u);
      const y = (y0 + wob(t * 0.18, i) * 0.07 - k * k * (full ? 0.5 : 0.85)) * h;
      const d = U * sz * (full ? 0.95 : 1) * (1 + k * 0.5);
      const a = (near ? 0.56 : 0.34) * (full ? 0.62 : 1) * smooth(0, 0.14, u) * (1 - smooth(0.8, 1, u)) * (0.85 + 0.15 * wob(t * 0.4, i + 3));
      const warm = Math.max(0, 1 - x / (w * 0.6)) * Math.max(0, 1 - y / (h * 1.3));
      const rot = rot0 + t * (0.02 + k * 0.25) * (i % 2 ? 1 : -1), sx = flat * (1 - k * 0.35), sy = 0.62 + k * 0.3;
      if (warm < 0.98) bank(c, puff(COOL, v), x, y, d, sx, sy, rot, a * (1 - warm));
      if (warm > 0.02) bank(c, puff(WARM, v), x, y, d, sx, sy, rot, a * warm * 1.15);
    }
    // THE RIBBONS: two curling plumes rising from below the right half, each a continuous line that widens + fades as it climbs
    for (let j = 0; j < 2; j++) {
      const bx = w * (0.6 + j * 0.22), cyc = 6.5 + j * 2.1, age = fract(t / cyc + j * 0.41), pts = [];
      for (let q = 0; q <= 22; q++) {
        const u = q / 22, life = age * 1.5 - u * 0.5;
        const x = bx + Math.sin(u * 5.2 + t * 0.9 + j * 2) * (2 + u * u * 16) * (full ? 1.6 : 1) + u * 12 + wob(t * 0.6 + u * 2, j) * 2;
        const y = h * (1.08 - u * 1.2);
        pts.push([x, y, (1 + u * 4.5) * (full ? 1.15 : 1), life <= 0 || life >= 1 ? 0 : Math.sin(life * Math.PI) * (1 - u * 0.75)]);
      }
      ribbon(c, pts, 0.9, COOL);
    }
    c.restore();
  },
};
