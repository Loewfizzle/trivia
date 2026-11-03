// TWINKLE — glints catching the light at seeded places, each on its own beat (four-point stars + a soft core), now + then a big one.
// MARBLE & GOLD (its gold veins), SAPPHIRE & SILVER's leaf, PRISM LEGEND's foil. Tint: opts.tint (default white-gold); opts.n density.
import { glow, stamp, sparkle, rng, unit } from './kit.js';
import { rrect } from './renderer.js';

export default {
  id: 'twinkle', tier: 'uncommon', bleed: 0, stillT: 1.3,
  draw(c, s, t, Q) {
    const { w, h } = s, rad = s.opts.radius || 12, U = unit(s), full = !!s.opts.full, rgb = s.opts.tint || '255,240,200', r = rng(41 + (s.opts.seed || 0));
    const n = Math.round((s.opts.n || 1) * (full ? 30 : 12) * (0.5 + 0.5 * Q.q)), tt = Q.still ? 1.3 : t;
    c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const x = r() * w, y = r() * h, P = 2.4 + r() * 3.2, ph = r() * P, big = r() < 0.12;
      const u = ((tt + ph) % P) / P, k = u < 0.25 ? Math.sin(u / 0.25 * Math.PI) : 0;
      if (k < 0.02) continue;
      const d = U * (big ? 0.5 : 0.22) * (0.7 + 0.3 * k);
      stamp(c, sparkle(rgb), x, y, d, k * (s.opts.calm ? 0.7 : 0.95));
      stamp(c, glow(rgb, 0.3, 16), x, y, d * 0.35, k * 0.6);
    }
    c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  },
};
