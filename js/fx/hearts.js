// HEARTBREAKER — HEARTS (an uncommon's one clear effect; the soft half of THE PINK PAIR — GLITTER BOMB is the loud one): pink + lilac
// hearts DRIFT UP through the violet, each swaying on its own slow wobble, turning a little, fading in at the foot and out near the top;
// two depths (far: small + faint, near: fuller), calmer under the name plate. The heart sprite is GLITTER BOMB's (kit.heart) — one look.
// Stateless by time (the same frame on every phone); reduced motion: one frame of hearts mid-rise.
import { heart, glow, stamp, rng, fract, smooth, unit } from './kit.js';
import { rrect } from './renderer.js';

const COLS = [['#ff6fc8', '#ffe0f2'], ['#d08bff', '#f3e2ff'], ['#ff9ad6', '#fff0f8'], ['#ff4fa8', '#ffd6ee']];

export default {
  id: 'hearts', tier: 'uncommon', bleed: 0, stillT: 3.3,
  draw(c, s, t, Q) {
    const { w, h } = s, U = unit(s), full = !!s.opts.full, r = rng(401 + (s.opts.seed || 0));
    c.save(); rrect(c, 0, 0, w, h, s.opts.radius || 12); c.clip();
    // a soft pink haze breathing low in the card (where the hearts come from)
    c.globalCompositeOperation = 'lighter';
    stamp(c, glow('255,90,190', 0.1, 64), w * 0.62, h * 1.05, w * 0.9, 0.22 + 0.06 * Math.sin(t * 0.8), U * 1.1);
    c.globalCompositeOperation = 'source-over';
    const n = Math.round((full ? 34 : 16) * (0.6 + 0.4 * Q.q));
    for (let i = 0; i < n; i++) {
      const near = i % 3 !== 0, life = (near ? 5.2 : 7.5) * (0.8 + r() * 0.5), ph = r(), xb = 0.08 + r() * 0.9;
      const u = fract(t / life + ph);
      const under = xb < 0.42 ? 0.55 : 1;                       // (calmer behind the plate: smaller + fainter)
      const x = xb * w + Math.sin(t * (0.6 + r() * 0.5) + i * 2.1) * U * 0.12;
      const y = h * (1.12 - u * 1.3);
      const sz = U * (near ? 0.3 + r() * 0.16 : 0.17 + r() * 0.08) * under;
      const a = smooth(0, 0.15, u) * (1 - smooth(0.7, 1, u)) * (near ? 0.92 : 0.5) * under;
      const [f, hi] = COLS[i % COLS.length];
      c.save(); c.translate(x, y); c.rotate(Math.sin(t * 0.9 + i) * 0.35);
      stamp(c, heart(f, hi, 64), 0, 0, sz, a); c.restore();
    }
    c.restore();
  },
};
