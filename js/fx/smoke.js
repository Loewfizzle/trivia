// SMOKE ROOM — SMOKE (an uncommon's one clear effect): a cigar lounge's slow smoke drifting across the strip in two depths (far: small,
// slow, dim; near: big, faster), each puff an organic baked blob turning as it goes; near the right edge the smoke RISES + CURLS off the
// card; two thin wisps curl up from below; a warm lamp off the top-left (the material's glow) lights the puffs nearest it amber. Puffs are
// placed by time (stateless): the same frame at the same t on every phone; a still frame for reduced motion.
import { puff, stamp, rng, smooth, wob, fract } from './kit.js';
import { rrect } from './renderer.js';

const COOL = '206,210,222', WARM = '255,196,140';

export default {
  id: 'smoke', tier: 'uncommon', bleed: 0, stillT: 6.5,
  draw(c, s, t, Q) {
    const { w, h } = s, r = rng(31 + (s.opts.seed || 0));
    c.save(); rrect(c, 0, 0, w, h, s.opts.radius || 12); c.clip();
    const n = Math.round((s.opts.calm ? 13 : 16) * (0.55 + 0.45 * Q.q));
    for (let i = 0; i < n; i++) {
      const near = i % 3 !== 0, sp = (near ? 0.03 : 0.017) * (0.75 + r() * 0.5), ph = r(), y0 = 0.15 + r() * 0.8, sz = (near ? 1.0 : 0.62) * (0.8 + r() * 0.6), rot0 = r() * 6.3, v = i % 4;
      const u = fract(ph + t * sp);                       // 0 → 1 across the strip (+ a margin each side)
      const x = (u * 1.3 - 0.15) * w;
      // the curl: past ~70 % of the way the puff lifts + swells + turns faster, and fades as it leaves over the edge
      const k = smooth(0.62, 1, u);
      const y = (y0 + wob(t * 0.22, i) * 0.08 - k * k * 0.9) * h;
      const d = h * sz * (1.15 + k * 0.6);
      const a = (near ? 0.62 : 0.4) * smooth(0, 0.12, u) * (1 - smooth(0.82, 1, u)) * (0.85 + 0.15 * wob(t * 0.5, i + 3));
      const warm = Math.max(0, 1 - x / (w * 0.55)) * Math.max(0, 1 - y / (h * 1.2));
      c.save(); c.translate(x, y); c.rotate(rot0 + t * (0.05 + k * 0.35) * (i % 2 ? 1 : -1));
      if (warm < 0.98) stamp(c, puff(COOL, v), 0, 0, d, a * (1 - warm));
      if (warm > 0.02) stamp(c, puff(WARM, v), 0, 0, d, a * warm * 1.1);
      c.restore();
    }
    // THE WISPS: two thin ribbons curling up from below the right half, dispersing as they rise
    for (let j = 0; j < 2; j++) {
      const bx = w * (0.62 + j * 0.2), cyc = 7 + j * 2.3, age = fract(t / cyc + j * 0.37);
      for (let q = 0; q < 16; q++) {
        const u = q / 15, life = age * 1.4 - u * 0.35; if (life <= 0 || life >= 1) continue;
        const x = bx + Math.sin(u * 6.5 + t * 1.1 + j) * (3 + u * 14) + u * 10;
        const y = h * (1.05 - u * 1.15);
        stamp(c, puff(COOL, (q + j) % 4, 128), x, y, 4 + u * 18, 0.5 * (1 - u) * Math.sin(life * Math.PI));
      }
    }
    c.restore();
  },
};
