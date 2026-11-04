// `card-inferno` — FLAMES (a rare: an effect + GLOWING EDGES): a bed of fire along the bottom — REAL FIRE since THE VAULT 2C (js/fx/fire.js:
// a baked noise flipbook — the 1A teardrops read as drops, the owner's FIX), the ember bed glowing + flickering under
// them, sparks spiralling up, and THE EDGE: a heat glow round the border that breathes. Licks are placed by time (stateless); calmer
// under the name plate (the name always reads). Reduced motion: one frame of fire, the edge lit.
import { glow, stamp, rng, wob, fract, unit } from './kit.js';
import { drawFire } from './fire.js';
import { rrect } from './renderer.js';

export default {
  id: 'flames', tier: 'rare', bleed: 9, stillT: 2.35,
  draw(c, s, t, Q) {
    const { w, h } = s, rad = s.opts.radius || 12, r = rng(57 + (s.opts.seed || 0)), U = unit(s), full = !!s.opts.full;
    c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
    c.globalCompositeOperation = 'lighter';
    // the ember bed: a band of heat along the bottom, its brightness flickering in patches
    const bed = c.createLinearGradient(0, h, 0, h - U * 0.55);
    bed.addColorStop(0, 'rgba(255,120,30,0.5)'); bed.addColorStop(0.35, 'rgba(220,50,10,0.22)'); bed.addColorStop(1, 'rgba(160,20,0,0)');
    c.fillStyle = bed; c.globalAlpha = 0.8 + 0.2 * wob(t * 2.2, 1); c.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) { const x = (i + 0.5) / 6 * w, a = 0.35 + 0.35 * (0.5 + 0.5 * wob(t * 1.7, i * 2)); stamp(c, glow('255,110,30', 0.1, 64), x, h, w / 3.2, a, U * 0.9); }
    // THE FIRE (THE VAULT 2C — the owner's FIX: "a lot more like real flame"): a baked flipbook of a real fire field (js/fx/fire.js —
    // tongues splitting, merging, tearing off at the tips, white-hot at the root), two layers crossing: a tall slow one behind, a quicker
    // one in front; their height breathing along the strip; calmer under the name plate (the name always reads)
    const calm = s.opts.calm ? 0.85 : 1, seed = s.opts.seed || 0, band = (full ? h * 0.92 : h * 1.7) * calm;
    drawFire(c, 0, w, h + U * 0.05, band, t, { loop: 1.9, a: 0.34 + 0.08 * Q.q, seed: seed + 0.2, drift: -U * 0.1, stretch: 1.25 });
    drawFire(c, 0, w, h + U * 0.06, band * 0.74, t, { loop: 1.3, a: 0.44, seed: seed + 0.7, drift: U * 0.16, stretch: 0.9 });
    if (Q.q > 0.5) drawFire(c, 0, w, h + U * 0.08, band * 0.5, t, { loop: 0.9, a: 0.3, seed: seed + 0.45, drift: -U * 0.24, stretch: 0.8 });
    // calmer under the name plate: the fire there sinks into smoke-dark (one wash, the name always reads)
    if (!full) {
      c.globalCompositeOperation = 'source-over';
      const g = c.createLinearGradient(0, 0, w * 0.62, 0); g.addColorStop(0, 'rgba(14,3,0,0.5)'); g.addColorStop(0.62, 'rgba(14,3,0,0.42)'); g.addColorStop(1, 'rgba(14,3,0,0)');
      c.fillStyle = g; c.fillRect(0, 0, w * 0.62, h);
      c.globalCompositeOperation = 'lighter';
    }
    // sparks: small hot points spiralling up
    const ns = Math.round(16 * (full ? 2.2 : 1) * Q.q);
    for (let i = 0; i < ns; i++) {
      const life = 1.1 + r() * 0.9, ph = r(), xb = 0.35 + r() * 0.65, age = fract(t / life + ph);
      const x = xb * w + Math.sin(age * 9 + i) * 5, y = h - age * h * 1.15;
      stamp(c, glow('255,200,110', 0.3, 16), x, y, 3.2, (1 - age) * 0.95);
    }
    c.restore();
    // THE EDGE — a heat glow round the border, breathing (outside the clip: it bleeds a few px)
    const k = Q.still ? 0.8 : 0.62 + 0.38 * (0.5 + 0.5 * Math.sin(t * 2.4)) + 0.06 * wob(t * 4, 3);
    c.globalCompositeOperation = 'lighter';
    for (const [lw, col, a] of [[9, '255,90,20', 0.09], [5, '255,120,40', 0.18], [2, '255,170,80', 0.55], [0.9, '255,230,170', 0.8]]) {
      c.globalAlpha = a * k; c.strokeStyle = `rgb(${col})`; c.lineWidth = lw;
      rrect(c, 0.6, 0.6, w - 1.2, h - 1.2, rad - 0.3); c.stroke();
    }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  },
};
