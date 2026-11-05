// `card-camo` (uncommon — one clear effect): THE SCAN — a night-vision sweep crossing the camo: a hard green line with a fading wake, the
// pattern lit faintly green where it passes, and a reticle that finds the wearer (it locks on near the right edge, holds, lets go).
import { glow, stamp, sprite, fract, smooth, unit } from './kit.js';
import { rrect } from './renderer.js';

/** the wake: a soft band, bright at its right edge, fading back to the left */
const wake = () => sprite('fx-scan-wake', 128, 8, (c, W, H) => { const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(120,255,140,0)'); g.addColorStop(0.85, 'rgba(120,255,140,0.35)'); g.addColorStop(1, 'rgba(200,255,200,0.9)'); c.fillStyle = g; c.fillRect(0, 0, W, H); });

export default {
  id: 'scan', tier: 'uncommon', bleed: 0, stillT: 1.6,
  draw(c, s, t, Q) {
    const { w, h } = s, rad = s.opts.radius || 12, P = s.opts.full ? 5.2 : 4.4, U = unit(s);
    const u = Q.still ? 0.62 : fract(t / P + (s.opts.seed || 0) * 0.17), run = u / 0.7;
    c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
    c.globalCompositeOperation = 'lighter';
    if (run <= 1) {
      const x = -w * 0.05 + run * w * 1.1, a = smooth(0, 0.08, run) * (1 - smooth(0.92, 1, run)) * (s.opts.calm ? 0.75 : 1);
      c.globalAlpha = 0.55 * a; c.drawImage(wake(), x - w * 0.35, 0, w * 0.35, h);
      c.globalAlpha = 0.95 * a; c.fillStyle = 'rgb(190,255,190)'; c.fillRect(x - 0.6, 0, 1.2, h);
      stamp(c, glow('120,255,140', 0.1, 32), x, h / 2, U * 0.5, 0.45 * a, h * 1.4);
    }
    // the reticle: it slides in on its target as the line passes, holds, fades
    const tx = w * (s.opts.full ? 0.78 : 0.7),   // (SHELL 2.0 B2 — THE HERO-SPOT RULE: the strip's reticle off the tier gem, middle-right)
          ty = h * (s.opts.full ? 0.36 : 0.5), lk = Q.still ? 1 : smooth(0.62, 0.72, u) * (1 - smooth(0.9, 0.98, u));
    if (lk > 0.01) {
      const r = U * (0.32 + 0.3 * (1 - lk)), L = r * 0.45;
      c.globalAlpha = 0.9 * lk; c.strokeStyle = 'rgb(150,255,160)'; c.lineWidth = 1.2;
      c.beginPath();
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { c.moveTo(tx + sx * r, ty + sy * (r - L)); c.lineTo(tx + sx * r, ty + sy * r); c.lineTo(tx + sx * (r - L), ty + sy * r); }
      c.stroke();
      stamp(c, glow('150,255,160', 0.4, 16), tx, ty, 4, lk);
    }
    c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  },
};
