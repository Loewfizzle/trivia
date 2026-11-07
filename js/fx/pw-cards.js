// THE PASSWORD's card (PW2 — docs/password.md "THE REWARDS") — the motion over Grok's vault door, on the SHARED surface (js/fx/renderer.js —
// never a canvas per card) through THE GL PAINTER. The art (the master) is the card's material (css/vault.css .vl-s-pw-*); this draws what the
// game adds over it, in ART px mapped exactly like the CSS crop (pw-specs.js#pwMap — the art is 1280 × 720). Everything 'lighter' — no plate,
// no black box. Reduced motion = a still frame (the dust held, the blaze at rest, no glint).
//   THE DUST: gold motes pouring out of the vault to the right + drifting off the edge (two staggered drifts, flickering, winking out)
//   THE BLAZE: the gold inside the doorway breathing slowly (a soft warm bloom swelling + fading)
//   THE GLINT: a bright point running round the wheel's rim now and then (every ~5.6 s)
import { stamp, glow, sparkle, rng, fract, wob } from './kit.js';
import { rrect } from './renderer.js';
import { PW_SPECS, pwMap } from './pw-specs.js';

function safe(c, s, t, Q) {
  const S = PW_SPECS['card-safecracker'], { w, h } = s, rad = s.opts.radius || 12, full = !!s.opts.full;
  const M = pwMap(w, h, full ? S.full : S.strip), k = M.k;
  const X = x => M.ox + x * k, Y = y => M.oy + y * k;
  const still = Q.still, tt = still ? 3.1 : t;
  c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
  c.globalCompositeOperation = 'lighter';
  // THE BLAZE breathing (a warm bloom over the doorway's gold)
  const br = still ? 0.5 : 0.5 + 0.5 * Math.sin(tt * 0.9);
  const [bx, by, bw, bh] = S.blaze;
  stamp(c, glow('255,196,90', 0.16, 64), X(bx), Y(by), bw * k * 1.6, 0.16 + 0.2 * br, bh * k * 1.4);
  stamp(c, glow('255,240,200', 0.3, 64), X(bx - 20), Y(by), bw * k * 0.7, 0.1 + 0.16 * br, bh * k * 0.8);
  // THE DUST: motes born at the door's open edge, drifting right + a little up, flickering, fading out past the edge
  const r = rng(41 + (s.opts.seed || 0)), [dx, dy, dw, dh] = S.dust, n = Math.round((full ? 54 : 30) * (0.5 + 0.5 * Q.q));
  const spk = sparkle('255,214,120', 32), gl = glow('255,200,100', 0.22, 24);
  for (let i = 0; i < n; i++) {
    const sp = 0.05 + r() * 0.08, ph = r(), lane = r(), u = still ? (ph * 0.8 + 0.1) : fract(tt * sp + ph);
    const x = X(dx + u * dw * 1.15 + (still ? 0 : wob(tt * 0.5 + i, i) * 14)), y = Y(dy + lane * dh - u * 40 + (still ? 0 : wob(tt * 0.35, i + 9) * 18));
    const fl = still ? 0.8 : 0.55 + 0.45 * Math.sin(tt * (6 + r() * 5) + i * 2.1), a = Math.sin(u * Math.PI) * fl * (0.35 + 0.65 * r());
    const d = (1.2 + r() * 2.2) * k * 2.2;
    stamp(c, gl, x, y, d * 3, a * 0.5);
    stamp(c, i % 3 ? gl : spk, x, y, d, a * 0.95);
  }
  // THE GLINT: a point running round the wheel's rim (a 1.1-s lap every 5.6 s), with a soft halo
  if (!still) {
    const lap = fract(tt / 5.6) * 5.6;
    if (lap < 1.1) {
      const a = lap / 1.1, ang = -Math.PI * 0.75 + a * Math.PI * 2, [wx, wy, wr] = S.wheel, fade = Math.sin(a * Math.PI);
      const gx = X(wx + Math.cos(ang) * wr), gy = Y(wy + Math.sin(ang) * wr * 0.96);
      stamp(c, glow('255,255,255', 0.5, 32), gx, gy, 26 * k * 3, 0.55 * fade);
      stamp(c, sparkle('255,255,255', 48), gx, gy, 22 * k * 3, 0.9 * fade);
    }
  }
  c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}
export const pwSafe = { id: 'pwSafe', tier: 'rare', bleed: 0, stillT: 3.1, draw: safe };
