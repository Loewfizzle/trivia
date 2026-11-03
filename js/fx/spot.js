// `card-velvet` (rare — an effect + glowing edges): THE SPOTLIGHT — a warm stage light from above drifting slowly across the velvet: its
// cone through the air, a pool of light on the pile, dust turning in the beam. Its colour: opts.tint 'r,g,b' (default warm tungsten).
import { glow, stamp, sprite, rng, unit, wob } from './kit.js';
import { rrect } from './renderer.js';

/** the cone, baked pointing down (apex at the top centre): soft-edged, brightest at its core */
const cone = rgb => sprite(`fx-spot:${rgb}`, 96, 128, (c, W, H) => {
  for (const [k, a] of [[1, 0.14], [0.62, 0.18], [0.3, 0.22]]) {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},${a * 0.25})`);
    c.fillStyle = g; c.beginPath(); c.moveTo(W / 2 - 2, 0); c.lineTo(W / 2 + 2, 0); c.lineTo(W / 2 + W / 2 * k, H); c.lineTo(W / 2 - W / 2 * k, H); c.closePath(); c.fill();
  }
});

export default {
  id: 'spot', tier: 'rare', bleed: 0, stillT: 2,
  draw(c, s, t, Q) {
    const { w, h } = s, rad = s.opts.radius || 12, rgb = s.opts.tint || '255,214,150', U = unit(s), full = !!s.opts.full;
    const tt = Q.still ? 2 : t, cx = w * (full ? 0.55 : 0.68) + (Q.still ? 0 : wob(tt * 0.12, 3) * w * (full ? 0.18 : 0.14));
    c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
    c.globalCompositeOperation = 'lighter';
    const top = -h * 0.35, H = h * 1.35 - top, W = full ? w * 0.42 : h * 2.4;
    c.globalAlpha = s.opts.calm ? 0.75 : 1; c.drawImage(cone(rgb), cx - W / 2, top, W, H);
    // the pool on the velvet (an ellipse at the cone's foot)
    stamp(c, glow(rgb, 0.15, 64), cx, h * (full ? 0.9 : 0.96), W * 1.2, 0.45, h * (full ? 0.32 : 0.6));
    // dust turning in the beam
    const r = rng(7 + (s.opts.seed || 0)), n = Math.round((full ? 34 : 14) * (0.5 + 0.5 * Q.q));
    for (let i = 0; i < n; i++) {
      const v = r(), y = top + (H * (0.25 + 0.75 * r())), x = cx + (r() - 0.5) * W * 0.8 * ((y - top) / H) + (Q.still ? 0 : wob(tt * 0.3, i) * U * 0.2);
      const tw = Q.still ? 0.6 : 0.4 + 0.6 * Math.max(0, Math.sin(tt * (0.8 + v) + i));
      stamp(c, glow('255,240,210', 0.5, 16), x, y + (Q.still ? 0 : Math.sin(tt * 0.4 + i) * U * 0.05), 1.6 + v * 1.4, 0.7 * tw);
    }
    c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  },
};
