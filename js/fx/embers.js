// `card-flame30` (rare — an effect + glowing edges): THE EMBERS — a bed of coals along the foot breathing red-orange, small low flames
// licking up from it, and embers lifting off — drifting, flaring, winking out. (Also CENTURY's second effect, over its flames.)
import { glow, stamp, lick, rng, unit, wob } from './kit.js';
import { rrect } from './renderer.js';

export default {
  id: 'embers', tier: 'rare', bleed: 0, stillT: 2.2,
  draw(c, s, t, Q) {
    const { w, h } = s, rad = s.opts.radius || 12, U = unit(s), full = !!s.opts.full, r = rng(23 + (s.opts.seed || 0)), tt = Q.still ? 2.2 : t;
    const hot = s.opts.tint || '255,140,50', calm = s.opts.calm ? 0.75 : 1, bed = !s.opts.noBed;
    c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
    c.globalCompositeOperation = 'lighter';
    if (bed) {
      // the coals: glowing spots along the foot, each breathing on its own
      const nc = Math.round(w / (U * 0.16));
      for (let i = 0; i < nc; i++) {
        const x = (i + r()) / nc * w, br = Q.still ? 0.7 : 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(tt * (0.7 + r()) + i * 1.7));
        stamp(c, glow(i % 3 ? '255,90,30' : '255,170,70', 0.2, 32), x, h - U * 0.03, U * (0.45 + r() * 0.3), 0.55 * br * calm, U * 0.22);
      }
      // low flames licking up
      const L = lick(64), nf = Math.round(w / (U * 0.22) * (0.6 + 0.4 * Q.q));
      for (let i = 0; i < nf; i++) {
        const x = (i + r()) / nf * w, ph = r() * 6, life = Q.still ? 0.6 : 0.5 + 0.5 * Math.sin(tt * (2.2 + r() * 1.5) + ph);
        const fh = U * (0.22 + 0.3 * life) * (0.7 + r() * 0.6), fw = fh * 0.5;
        c.globalAlpha = 0.6 * life * calm; c.drawImage(L, x - fw / 2 + (Q.still ? 0 : wob(tt * 2, i) * U * 0.02), h - fh + U * 0.02, fw, fh);
      }
    }
    // the embers: rising, swaying, flaring + winking out
    const ne = Math.round((full ? 60 : 26) * (0.5 + 0.5 * Q.q) * calm);
    for (let i = 0; i < ne; i++) {
      const sp = 0.12 + r() * 0.18, ph = r(), u = Q.still ? (ph * 0.85 + 0.05) : ((tt * sp + ph) % 1);
      const x = r() * w + (Q.still ? 0 : wob(tt * 0.7 + i, i) * U * 0.12) + u * U * 0.2, y = h - u * h * 1.05;
      const fl = Q.still ? 0.8 : 0.6 + 0.4 * Math.sin(tt * 9 + i * 2.3), a = Math.sin(u * Math.PI) * fl;
      stamp(c, glow(hot, 0.3, 16), x, y, U * 0.07 + 1.2, a * 0.75);
      stamp(c, glow('255,240,200', 0.6, 16), x, y, 1.6, a * 0.9);
    }
    c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  },
};
