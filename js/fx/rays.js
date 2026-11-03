// `card-gold` (rare — an effect + glowing edges): THE SUNBURST — the deco rays pressed into the foil catch the light in turn: a slow sweep
// of brightness turns round the burst (one ray after another lighting up), a glint where it peaks. The rays' centre: low on a full card,
// at the strip's right. Tint: opts.tint.
import { glow, stamp, sparkle, sprite } from './kit.js';
import { rrect } from './renderer.js';

/** one ray (a slender wedge, baked pointing up, its point at the bottom centre) */
const ray = rgb => sprite(`fx-ray:${rgb}`, 32, 256, (c, W, H) => {
  const g = c.createLinearGradient(0, H, 0, 0); g.addColorStop(0, `rgba(${rgb},0.9)`); g.addColorStop(0.5, `rgba(${rgb},0.45)`); g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g; c.beginPath(); c.moveTo(W / 2, H); c.lineTo(0, 0); c.lineTo(W, 0); c.closePath(); c.fill();
});

export default {
  id: 'rays', tier: 'rare', bleed: 0, stillT: 1.2,
  draw(c, s, t, Q) {
    const { w, h } = s, rad = s.opts.radius || 12, full = !!s.opts.full, rgb = s.opts.tint || '255,226,150';
    const ox = full ? w * 0.5 : w * 0.82, oy = full ? h * 1.05 : h * 1.25, L = Math.hypot(w, h) * 1.1;
    const n = 22, a0 = -Math.PI * 0.95, a1 = -Math.PI * 0.05, tt = Q.still ? 1.2 : t, sweep = ((tt * 0.16) % 1.4) - 0.2;
    c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1), a = a0 + (a1 - a0) * u, k = Math.exp(-(((u - sweep) / 0.09) ** 2));
      const al = (0.05 + 0.32 * k) * (s.opts.calm ? 0.8 : 1);
      c.save(); c.translate(ox, oy); c.rotate(a + Math.PI / 2); c.globalAlpha = al;
      c.drawImage(ray(rgb), -L * 0.028, -L, L * 0.056, L);
      c.restore();
      if (k > 0.7) { const gx = ox + Math.cos(a) * L * 0.42, gy = oy + Math.sin(a) * L * 0.42; if (gx > 0 && gx < w && gy > 0 && gy < h) stamp(c, sparkle('255,246,220'), gx, gy, (full ? h * 0.18 : h * 0.4), (k - 0.7) * 3); }
    }
    stamp(c, glow(rgb, 0.1, 64), ox, oy, L * 0.6, 0.18);
    c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  },
};
