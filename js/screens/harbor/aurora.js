// CITY 2.0 — THE HARBOR, PART 6b: THE AURORA, BACK TO CITY 1.0's (plan.md "THE AURORA: BACK TO CITY 1.0's" + "THE AURORA BLENDS MORE";
// docs/harbor.md#part-6b). 6a's curtain of rays read jittery, slowed-down, with hard vertical shafts; City 1.0's "looked really good":
// many WIDE, OVERLAPPING, feathered strands (each a soft column of colour — green at its foot, teal, then violet up top — feathered to
// nothing at both sides) summed additively into ONE smooth glowing curtain that ripples + drifts. Re-fitted to the Harbor: the whole
// sky from under the corner buttons down to the crowns (behind the NEON sign — the page draws over it), taller + brighter on a storm
// night, smooth at 60 fps (a pure function of the clock, no per-frame noise); + its SOFT REFLECTION on the harbor's water. 6a's timing
// stays (~2 nights a month + a real Kp ≥ 7 storm: skyfx.setAurora).
import { safeCtx } from '../../ui/canvas-safe.js';

export function createAurora() {
  let band = null, refl = null, W = 1, tier = 2;
  function strand() {
    if (band) return band;
    band = document.createElement('canvas'); band.width = 48; band.height = 160;
    const x = safeCtx(band), w = 48, h = 160;
    const g = x.createLinearGradient(0, h, 0, 0);
    g.addColorStop(0, 'rgba(60,255,170,0)'); g.addColorStop(0.07, 'rgba(70,255,170,0.85)'); g.addColorStop(0.4, 'rgba(90,230,200,0.38)'); g.addColorStop(0.72, 'rgba(150,120,255,0.24)'); g.addColorStop(0.9, 'rgba(255,90,170,0.1)'); g.addColorStop(1, 'rgba(255,90,170,0)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    // feathered to nothing at both sides (a gaussian-ish profile: the neighbours melt together, no edges — "blends more")
    const m = x.createLinearGradient(0, 0, w, 0);
    for (let i = 0; i <= 10; i++) { const u = i / 10, d = (u - 0.5) * 2; m.addColorStop(u, `rgba(0,0,0,${Math.exp(-d * d * 3.2).toFixed(3)})`); }
    x.globalCompositeOperation = 'destination-in'; x.fillStyle = m; x.fillRect(0, 0, w, h);
    return band;
  }
  const curtain = (u, tt, base, amp, ph, sp) => base + amp * Math.sin(u * 7 + tt * sp * 3 + ph) + 0.03 * Math.sin(u * 23 + tt * sp * 7);
  return {
    resize(w) { W = w; },
    setTier(t) { tier = t; },
    /** the curtain: k (0..1 strength — a storm night ~1), box { y0, y1 } (its foot sits on the crowns), t (s), motion */
    draw(c, k, box, t, motion) {
      if (k < 0.02) return;
      const B = strand(), strips = tier === 2 ? 44 : tier === 1 ? 32 : 22, tt = motion ? t : 0, span = box.y1 - box.y0;
      c.save(); c.globalCompositeOperation = 'lighter';
      for (const [base, amp, ph, sp, a] of [[0.94, 0.05, 0, 0.11, 0.5], [0.8, 0.045, 2.2, 0.08, 0.34]]) {
        for (let i = 0; i < strips; i++) {
          const u = i / strips, x = u * W * 1.1 - W * 0.05;
          const y = box.y0 + span * curtain(u, tt, base, amp, ph, sp);
          const hgt = span * (0.5 + 0.18 * k + 0.14 * Math.sin(u * 5 + tt * sp * 2 + ph));
          const bw = W / strips * 7.5;
          c.globalAlpha = Math.min(1, a * k * 0.78 * (0.72 + 0.28 * Math.sin(u * 5 + tt * 0.6 + ph)) * Math.sin(Math.PI * u));
          c.drawImage(B, x - bw / 2, y - hgt, bw, hgt);
        }
      }
      c.restore();
    },
    /** its soft reflection on the water (after the water): a few wide strands of its green, stretched + rippling down the harbor */
    reflect(c, k, water, t, motion) {
      if (k < 0.02 || !water) return;
      const tt = motion ? t : 0, h = water.y1 - water.y0;
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 9; i++) {
        const u = (i + 0.5) / 9, x = u * W, wob = Math.sin(u * 7 + tt * 0.33) * W * 0.02;
        const g = c.createLinearGradient(0, water.y0, 0, water.y0 + h * 0.75);
        g.addColorStop(0, `rgba(80,255,180,${(0.16 * k * Math.sin(Math.PI * u)).toFixed(3)})`); g.addColorStop(1, 'rgba(80,255,180,0)');
        c.fillStyle = g; c.fillRect(x + wob - W / 12, water.y0, W / 6, h * 0.75);
      }
      c.restore();
    },
    destroy() { if (band) band.width = 0; band = null; refl = null; },
  };
}
