// `card-inferno` — FLAMES (a rare: an effect + GLOWING EDGES): a bed of fire along the bottom — flame licks rising, swaying, shrinking as they
// burn out (a baked white-hot → red teardrop, drawn 'lighter' so they pile into real fire), the ember bed glowing + flickering under
// them, sparks spiralling up, and THE EDGE: a heat glow round the border that breathes. Licks are placed by time (stateless); calmer
// under the name plate (the name always reads). Reduced motion: one frame of fire, the edge lit.
import { lick, glow, stamp, rng, wob, fract, unit } from './kit.js';
import { rrect } from './renderer.js';

export default {
  id: 'flames', tier: 'rare', bleed: 9, stillT: 2.35,
  draw(c, s, t, Q) {
    const { w, h } = s, rad = s.opts.radius || 12, r = rng(57 + (s.opts.seed || 0)), U = unit(s), full = !!s.opts.full;
    c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
    c.globalCompositeOperation = 'lighter';
    // the ember bed: a band of heat along the bottom, its brightness flickering in patches
    const bed = c.createLinearGradient(0, h, 0, h - U * 0.55);
    bed.addColorStop(0, 'rgba(255,140,40,0.75)'); bed.addColorStop(0.35, 'rgba(230,60,12,0.3)'); bed.addColorStop(1, 'rgba(160,20,0,0)');
    c.fillStyle = bed; c.globalAlpha = 0.8 + 0.2 * wob(t * 2.2, 1); c.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) { const x = (i + 0.5) / 6 * w, a = 0.35 + 0.35 * (0.5 + 0.5 * wob(t * 1.7, i * 2)); stamp(c, glow('255,110,30', 0.1, 64), x, h, w / 3.2, a, U * 0.9); }
    // THE FIRE: two layers of licks — big slow TONGUES that build the wall of fire (overlapping, so 'lighter' piles them white-hot at
    // the root), then quick small FLICKERS dancing on top; calmer under the name plate (the name always reads)
    const L = lick();
    for (const [layer, count, life0, hMul, szMul, aMul] of [[0, 26, 1.1, 0.55, 0.5, 0.75], [1, 30, 0.6, 0.45, 0.3, 0.85]]) {
      const n = Math.round(count * (full ? 1.25 : 1) * (s.opts.calm ? 0.8 : 1) * (0.5 + 0.5 * Q.q));
      for (let i = 0; i < n; i++) {
        const life = life0 * (0.75 + r() * 0.5), ph = r(), xb = (i + r() * 0.9) / n;
        const age = fract(t / life + ph);
        const under = xb < 0.4 ? 0.55 : 0.7 + 0.3 * Math.min(1, (xb - 0.4) / 0.25);
        const sway = Math.sin(t * (2 + layer) + i * 1.7) * (2 + age * 5);
        const x = xb * w + sway;
        const rise = age * U * hMul * under * (full ? 1.5 : 1);
        const sz = U * szMul * under * (1 - age * 0.62) * (0.8 + 0.4 * r());
        const a = Math.sin(Math.min(1, age * 1.4) * Math.PI) * aMul;
        // (the tongue's root sits at its own base: it stretches tall as it rises, then thins out)
        const tall = sz * (2.3 + age * 1.2);
        // (half of them mirrored, each leaning with its sway: no two tongues alike)
        const yc = h - rise - tall * 0.42;
        c.save(); c.translate(x, yc + tall * 0.42); c.rotate(sway * 0.02); if (i % 2) c.scale(-1, 1);
        stamp(c, L, 0, -tall * 0.42, sz, a, tall); c.restore();
      }
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
