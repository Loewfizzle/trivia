// COAST CLEAR's card (CC2 — docs/coastclear.md "THE REWARDS") — GHOST RUN: the motion over Grok's speedboat, on the SHARED surface
// (js/fx/renderer.js — never a canvas per card) through THE GL PAINTER. The art (the master) is the card's material (css/vault.css .vl-s-cc-*);
// this draws what the game adds over it, in ART px mapped exactly like the CSS crop (cc-specs.js#ccMap — the art is 1280 × 720). Everything
// 'lighter' — no plate, no black box. Reduced motion = a still frame.
//   THE SPRAY: white + cyan droplets thrown back and up from the bow wave, arcing down, flickering out (the boat is RUNNING)
//   THE LIGHTHOUSE: its lamp's warm glow breathing + a short beam sweeping round now and then (every ~4.8 s)
//   THE SEARCHLIGHTS: a soft shimmer where the two beams cross (they're looking — they never find you)
//   THE TRIM: a light running along the hull's cyan line every ~6.2 s
import { stamp, glow, sparkle, rng, fract, wob } from './kit.js';
import { rrect } from './renderer.js';
import { CC_SPECS, ccMap } from './cc-specs.js';

function ghost(c, s, t, Q) {
  const S = CC_SPECS['card-ghost-run'], { w, h } = s, rad = s.opts.radius || 12, full = !!s.opts.full;
  const M = ccMap(w, h, full ? S.full : S.strip), k = M.k;
  const X = x => M.ox + x * k, Y = y => M.oy + y * k;
  const still = Q.still, tt = still ? 2.4 : t;
  c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
  c.globalCompositeOperation = 'lighter';
  // THE SEARCHLIGHTS' crossing: a slow soft shimmer
  const [qx, qy] = S.cross, sh = still ? 0.5 : 0.5 + 0.5 * Math.sin(tt * 0.7);
  stamp(c, glow('230,240,255', 0.2, 64), X(qx), Y(qy), 150 * k, 0.1 + 0.14 * sh, 110 * k);
  // THE LIGHTHOUSE: the lamp breathing + its beam sweeping round (a 1.2-s pass every 4.8 s)
  const [lx, ly] = S.lamp, br = still ? 0.6 : 0.5 + 0.5 * Math.sin(tt * 1.3);
  stamp(c, glow('255,214,140', 0.3, 48), X(lx), Y(ly), 70 * k, 0.32 + 0.3 * br);
  stamp(c, glow('255,250,220', 0.6, 32), X(lx), Y(ly), 18 * k, 0.6 + 0.35 * br);
  if (!still) {
    const lap = fract(tt / 4.8) * 4.8;
    if (lap < 1.2) {
      const a = lap / 1.2, sweep = Math.sin(a * Math.PI), dir = a < 0.5 ? -1 : 1, len = 120 * k * sweep;
      stamp(c, glow('255,226,160', 0.2, 48), X(lx) + dir * len * 0.5, Y(ly), len, 0.35 * sweep, 9 * k);
    }
  }
  // THE SPRAY: droplets from the bow wave, thrown back (left) + up, arcing down, flickering out
  const r = rng(73 + (s.opts.seed || 0)), [sx, sy] = S.spray, n = Math.round((full ? 60 : 34) * (0.5 + 0.5 * Q.q));
  const gl = glow('190,240,255', 0.25, 24), spk = sparkle('235,250,255', 32);
  for (let i = 0; i < n; i++) {
    const sp = 0.6 + r() * 0.7, ph = r(), u = still ? (ph * 0.85 + 0.08) : fract(tt * sp + ph);
    const vx = 120 + r() * 200, vy = 70 + r() * 110;
    const x = X(sx - u * vx + (still ? 0 : wob(tt * 0.6 + i, i) * 6)), y = Y(sy - u * vy + u * u * vy * 1.25);
    const fl = still ? 0.8 : 0.5 + 0.5 * Math.sin(tt * (9 + r() * 6) + i * 1.7), a = Math.sin(u * Math.PI) * fl * (0.4 + 0.6 * r());
    const d = (1 + r() * 2) * k * 2.2;
    stamp(c, gl, x, y, d * 3, a * 0.45);
    stamp(c, i % 3 ? gl : spk, x, y, d, a * 0.9);
  }
  // THE TRIM: a light running along the hull's cyan line (a 0.9-s run every 6.2 s)
  if (!still) {
    const lap = fract((tt + 1.7) / 6.2) * 6.2;
    if (lap < 0.9) {
      const a = lap / 0.9, [x0, y0, x1, y1] = S.trim, fade = Math.sin(a * Math.PI);
      const gx = X(x0 + (x1 - x0) * a), gy = Y(y0 + (y1 - y0) * a);
      stamp(c, glow('120,235,255', 0.4, 32), gx, gy, 46 * k, 0.55 * fade, 12 * k);
      stamp(c, sparkle('235,255,255', 48), gx, gy, 16 * k, 0.8 * fade);
    }
  }
  c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}
export const ccGhost = { id: 'ccGhost', tier: 'rare', bleed: 0, stillT: 2.4, draw: ghost };
