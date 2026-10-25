// CITY 2.0 — THE HARBOR, PART 6b: THE AURORA, BACK TO CITY 1.0's (plan.md "THE AURORA: BACK TO CITY 1.0's" + "THE AURORA BLENDS MORE";
// docs/harbor.md#part-6b). 6a's curtain of rays read jittery, slowed-down, with hard vertical shafts; City 1.0's "looked really good":
// many WIDE, OVERLAPPING, feathered strands (each a soft column of colour — a pink fringe at its foot, green, violet, a deep red up top — feathered to
// nothing at both sides) summed additively into ONE smooth glowing curtain that ripples + drifts. Re-fitted to the Harbor: the whole
// sky from under the corner buttons down to the crowns (behind the NEON sign — the page draws over it), taller + brighter on a storm
// night, smooth at 60 fps (a pure function of the clock, no per-frame noise); + its SOFT REFLECTION on the harbor's water. 6a's timing
// stays (~2 nights a month + a real Kp ≥ 7 storm: skyfx.setAurora).
import { safeCtx } from '../../ui/canvas-safe.js';

// POLISH 4 (the owner: "better, but ALL ONE GREEN"): the real colours — GREEN in the middle band (oxygen, the brightest), a PINK /
// MAGENTA fringe along the curtain's LOWER edge (nitrogen), deep RED / crimson HIGH at the top (oxygen up high), a touch of VIOLET
// between; two strand looks (a redder top / a more violet one) crossfading slowly along the curtain, so its colours SHIFT over minutes.
const LOOKS = [
  // [u from the strand's foot (0) to its top (1), r, g, b, a]
  [[0, 255, 60, 170, 0], [0.035, 255, 70, 175, 0.42], [0.085, 230, 110, 180, 0.42], [0.15, 70, 255, 140, 0.9], [0.36, 80, 240, 160, 0.5], [0.54, 110, 190, 170, 0.24], [0.68, 180, 60, 120, 0.28], [0.84, 215, 30, 60, 0.34], [1, 215, 25, 55, 0]],
  [[0, 255, 50, 200, 0], [0.04, 255, 60, 200, 0.5], [0.1, 210, 120, 220, 0.42], [0.17, 70, 255, 150, 0.85], [0.38, 80, 236, 170, 0.44], [0.56, 150, 120, 255, 0.32], [0.72, 200, 60, 150, 0.26], [0.88, 220, 30, 70, 0.26], [1, 220, 30, 70, 0]],
];
export function createAurora() {
  let bands = null, refl = null, W = 1, tier = 2;
  function strands() {
    if (bands) return bands;
    bands = LOOKS.map(stops => {
      const cv = document.createElement('canvas'); cv.width = 48; cv.height = 160;
      const x = safeCtx(cv), w = 48, h = 160;
      const g = x.createLinearGradient(0, h, 0, 0);
      for (const [u, r, gg, bb, al] of stops) g.addColorStop(u, `rgba(${r},${gg},${bb},${al})`);
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      // feathered to nothing at both sides (a gaussian-ish profile: the neighbours melt together, no edges — "blends more")
      const m = x.createLinearGradient(0, 0, w, 0);
      for (let i = 0; i <= 10; i++) { const u = i / 10, d = (u - 0.5) * 2; m.addColorStop(u, `rgba(0,0,0,${Math.exp(-d * d * 3.2).toFixed(3)})`); }
      x.globalCompositeOperation = 'destination-in'; x.fillStyle = m; x.fillRect(0, 0, w, h);
      return cv;
    });
    return bands;
  }
  const curtain = (u, tt, base, amp, ph, sp) => base + amp * Math.sin(u * 7 + tt * sp * 3 + ph) + 0.03 * Math.sin(u * 23 + tt * sp * 7);
  return {
    resize(w) { W = w; },
    setTier(t) { tier = t; },
    /** the curtain: k (0..1 strength — a storm night ~1), box { y0, y1 } (its foot sits on the crowns), t (s), motion */
    draw(c, k, box, t, motion) {
      if (k < 0.02) return;
      const BB = strands(), strips = tier === 2 ? 44 : tier === 1 ? 32 : 22, tt = motion ? t : 0, span = box.y1 - box.y0;
      c.save(); c.globalCompositeOperation = 'lighter';
      for (const [base, amp, ph, sp, a] of [[0.94, 0.05, 0, 0.11, 0.5], [0.8, 0.045, 2.2, 0.08, 0.34]]) {
        for (let i = 0; i < strips; i++) {
          const u = i / strips, x = u * W * 1.1 - W * 0.05;
          const y = box.y0 + span * curtain(u, tt, base, amp, ph, sp);
          const hgt = span * (0.5 + 0.18 * k + 0.14 * Math.sin(u * 5 + tt * sp * 2 + ph));
          const bw = W / strips * 7.5;
          const al = Math.min(1, a * k * 0.78 * (0.72 + 0.28 * Math.sin(u * 5 + tt * 0.6 + ph)) * Math.sin(Math.PI * u));
          // (the two looks crossfading slowly along the curtain + over the minutes: its colours shift; tier 0: one look)
          const wB = tier === 0 ? 0 : 0.5 + 0.5 * Math.sin(u * 3.1 + tt * 0.045 + ph);
          if (wB < 0.98) { c.globalAlpha = al * (1 - wB); c.drawImage(BB[0], x - bw / 2, y - hgt, bw, hgt); }
          if (wB > 0.02) { c.globalAlpha = al * wB; c.drawImage(BB[1], x - bw / 2, y - hgt, bw, hgt); }
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
    destroy() { if (bands) for (const b of bands) b.width = 0; bands = null; refl = null; },
  };
}
