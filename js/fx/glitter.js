// GLITTER BOMB (an epic — the owner's "almost over-the-top girly" one): every ~2.6 s a BURST from the middle — glitter flakes flying out
// (tiny foil diamonds turning so they flash as they catch the light, slowed by the air, settling down), HEARTS tumbling (pink + lilac +
// white, spinning as they fall), SPARKLES popping (a quick scale-up + gone); two bursts overlap so it never stops; between them the card's
// own glitter twinkles. Stateless by burst number (the same burst on every phone at the same moment). Reduced motion: one burst, frozen.
import { glow, sparkle, heart, stamp, rng, fract, smooth } from './kit.js';
import { rrect } from './renderer.js';

const PERIOD = 2.6, LIFE = 3.4;
const FLAKES = ['255,170,225', '255,255,255', '255,120,200', '255,215,120', '210,170,255'];
const HEARTS = [['#ff4fb8', '#ffd6ee'], ['#c77dff', '#f1dcff'], ['#ffffff', '#ffffff'], ['#ff7ac8', '#fff0f8']];

export default {
  id: 'glitter', tier: 'epic', bleed: 0, stillT: 1.15,
  draw(c, s, t, Q) {
    const { w, h } = s, seed = (s.opts.seed || 0) * 131;
    c.save(); rrect(c, 0, 0, w, h, s.opts.radius || 12); c.clip();
    c.globalCompositeOperation = 'lighter';
    // the card's own glitter twinkling (between the bursts)
    const tw = rng(seed + 3);
    for (let i = 0; i < Math.round(22 * Q.q); i++) { const x = tw() * w, y = tw() * h, p = tw() * 9; stamp(c, sparkle('255,225,245', 32), x, y, 7, Q.still ? 0.4 : Math.max(0, Math.sin(t * 2 + p)) ** 8); }
    const nowB = Math.floor(t / PERIOD);
    for (let b = nowB - 1; b <= nowB; b++) {
      const age = t - b * PERIOD; if (age < 0 || age > LIFE) continue;
      const r = rng(seed + b * 977 + 7), cx = w * (0.56 + r() * 0.22), cy = h * (0.42 + r() * 0.16);
      const fade = 1 - smooth(LIFE * 0.6, LIFE, age);
      // the burst's flash
      if (age < 0.35) stamp(c, glow('255,200,240', 0.15), cx, cy, h * 1.6 * (0.4 + age * 2), (1 - age / 0.35) * 0.55);
      const nf = Math.round(64 * Q.q * (s.opts.calm ? 0.75 : 1));
      for (let i = 0; i < nf; i++) {
        const a = r() * Math.PI * 2, sp = (0.35 + r() * 0.9) * w * 0.32, drag = 2.2 + r() * 1.5;
        const d = sp * (1 - Math.exp(-drag * age)) / drag;
        const x = cx + Math.cos(a) * d * 1.25, y = cy + Math.sin(a) * d * 0.55 + 9 * age * age + Math.sin(age * 6 + i) * 1.2;
        const spin = r() * 6 + age * (6 + r() * 10), flashOn = Math.abs(Math.cos(spin));
        const col = FLAKES[i % FLAKES.length], sz = 1.4 + r() * 1.8;
        c.globalAlpha = Math.min(1, fade * (0.25 + 0.75 * flashOn)); c.fillStyle = `rgb(${col})`;
        c.save(); c.translate(x, y); c.rotate(spin); c.fillRect(-sz / 2, -sz * 0.35, sz, sz * 0.7); c.restore();
        if (flashOn > 0.93) stamp(c, sparkle(col, 32), x, y, 6, fade * 0.9);
      }
      // hearts tumbling
      const nh = Math.round(7 * (0.6 + 0.4 * Q.q));
      for (let i = 0; i < nh; i++) {
        const a = -Math.PI * (0.15 + r() * 0.7), sp = (0.3 + r() * 0.6) * w * 0.28, d = sp * (1 - Math.exp(-2.4 * age)) / 2.4;
        const x = cx + Math.cos(a) * d * 1.3, y = cy + Math.sin(a) * d * 0.6 + 14 * age * age;
        const [f, hi] = HEARTS[i % HEARTS.length], sz = h * (0.2 + r() * 0.14) * smooth(0, 0.25, age);
        c.save(); c.translate(x, y); c.rotate(Math.sin(age * 3 + i) * 0.6 + (r() - 0.5)); c.globalCompositeOperation = 'source-over';
        stamp(c, heart(f, hi, 64), 0, 0, sz, fade * 0.95); c.restore();
      }
      // sparkles popping
      c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 6; i++) {
        const at = r() * 1.6, x = cx + (r() - 0.5) * w * 0.55, y = h * (0.15 + r() * 0.7), u = (age - at) / 0.5;
        if (u < 0 || u > 1) continue;
        stamp(c, sparkle('255,255,255', 64), x, y, h * 0.42 * Math.sin(u * Math.PI), Math.sin(u * Math.PI));
      }
    }
    c.restore();
    // the edge: hot pink, a soft glow
    c.globalCompositeOperation = 'lighter';
    for (const [lw, a] of [[6, 0.16], [1.3, 0.7]]) { c.globalAlpha = a; c.strokeStyle = 'rgb(255,120,210)'; c.lineWidth = lw; rrect(c, 0.6, 0.6, w - 1.2, h - 1.2, (s.opts.radius || 12) - 0.3); c.stroke(); }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  },
};
