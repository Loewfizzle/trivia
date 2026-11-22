// GARDEN PARTY (THE GARDEN PARTY PASS, Nov 21 — docs/vault.md "GARDEN PARTY") — the LV 34 epic card's motion, on the SHARED surface
// (js/fx/renderer.js — never a canvas per card). The art (Grok's master) is the card's material (css/vault.css .vl-s-gp-garden); this draws what
// moves over it, in ART px mapped exactly like the CSS crop (gp-specs.js#gpMap). EPIC = two effects together (docs/vault.md "THE TIERS"):
//   THE PETALS — Grok's eight cut-out petals (one sheet, gp-petals.webp) DRIFT down through the sunlit air over the bouquet: each its own speed,
//     a slow sway, a tumble (it turns + flips — its width breathing with the flip), faded in at the top + out at the foot; at the still moment
//     each sits exactly where Grok put it (the plate's own composition).
//   THE SUN SPARKLES — the sparkle plate (light with alpha, drawn 'lighter') breathing, + its brightest starbursts (gp-specs.js#GLINTS) each
//     TWINKLING in turn — a 4-point star swelling + a soft warm bloom.
// Kept off the slim card's plate + the tier gem (the petals live in the bouquet's columns; the strip's right edge fades them), calmer on the
// strip (×0.88 — THE PROMINENCE RULE reads the tier). Reduced motion = the still frame (each waits for its images — sg-kit.js#image calls
// renderer.js#fxAssetIn when one lands).
import { stamp, glow, sparkle, fract, smooth } from './kit.js';
import { image } from './sg-kit.js';
import { rrect } from './renderer.js';
import { GP_SPECS, PETALS, GLINTS, SPARKLE_BOX, gpMap } from './gp-specs.js';

export const GP_ART = new URL('../../assets/vault/gp/', import.meta.url).href;
const STILL_T = 1.6, SPAN = 900, TOP = -90;   // (a petal's fall: art y −90 → 810, then round again)
// each petal's own motion: [speed art px/s, sway art px, sway rad/s, spin rad/s, flip rad/s, drift (art x per art y)]
const MOTION = Object.freeze([[58, 22, 0.9, 0.55, 1.7, -0.2], [66, 18, 1.15, -0.7, 2.1, -0.16], [52, 26, 0.8, 0.42, 1.4, -0.24], [62, 20, 1.05, -0.5, 1.9, -0.18],
  [55, 24, 0.95, 0.62, 1.6, -0.22], [70, 16, 1.25, -0.4, 2.3, -0.14], [60, 21, 0.85, 0.5, 1.8, -0.2], [54, 25, 1.0, -0.6, 1.5, -0.23]]);
/** PURE (tests): petal i at t s → { x, y (art px — its centre), ang (rad), sx (the flip's width 0.35 … 1), a (alpha) }; at STILL_T = the plate's spot */
export function petalAt(i, t) {
  const [, , , , cx, cy] = PETALS[i], [v, sw, sf, spin, flip, drift] = MOTION[i], d = t - STILL_T;
  const y = TOP + fract((cy - TOP + v * d) / SPAN) * SPAN;
  let dy = y - cy; if (dy > SPAN / 2) dy -= SPAN; else if (dy < -SPAN / 2) dy += SPAN;
  const x = cx + drift * dy + sw * Math.sin(sf * d);
  const a = smooth(TOP, TOP + 120, y) * (1 - smooth(SPAN + TOP - 150, SPAN + TOP, y));
  return { x, y, ang: spin * d, sx: 0.35 + 0.65 * Math.abs(Math.cos(flip * d * 0.5)), a };
}
/** PURE (tests): glint i's twinkle at t s, 0 … 1 (a short swell, each in turn — never all at once) */
export function glintAt(i, t, still) {
  if (still) return [0.9, 0.2, 0.55, 0, 0.7, 0.3, 0, 0.8, 0.1, 0.45, 0, 0.6, 0.25, 0][i] || 0;
  const u = fract(t / 2.8 + i * 0.618);
  return u < 0.32 ? Math.pow(Math.sin((u / 0.32) * Math.PI), 2) : 0;
}

function garden(c, s, t, Q) {
  const S = GP_SPECS['card-garden'], full = !!s.opts.full, still = !!Q.still, rad = s.opts.radius || 12;
  const M = gpMap(s.w, s.h, full ? S.full : S.strip), k = M.k, X = x => M.ox + x * k, Y = y => M.oy + y * k;
  const calm = full ? 1 : 0.88, tt = still ? STILL_T : t;
  c.save(); rrect(c, 0, 0, s.w, s.h, rad); c.clip();
  // (the strip: nothing over the name's plate side; the right edge (the tier gem's column) faded — in slot px)
  const keep = x => (full ? 1 : smooth(0.5 * s.w, 0.6 * s.w, x) * (1 - smooth(0.93 * s.w, s.w, x)));
  // 1 · THE SUN SPARKLES — the plate breathing (light with alpha, 'lighter')
  c.globalCompositeOperation = 'lighter';
  const sp = image(`${GP_ART}gp-sparkle.webp`);
  if (sp) {
    const [bx, by, bw, bh] = SPARKLE_BOX, br = still ? 0.6 : 0.5 + 0.18 * Math.sin(t * 1.3) + 0.08 * Math.sin(t * 3.7);
    c.globalAlpha = Math.min(1, br * calm * (full ? 1 : 0.85)); c.drawImage(sp, X(bx), Y(by), bw * k, bh * k);
  }
  // … + its starbursts twinkling in turn
  const sz = full ? 1 : 1.6;   // (the strip's art is small: a star a touch bigger there, so it reads at phone size)
  GLINTS.forEach(([gx, gy], i) => {
    const v = glintAt(i, tt, still); if (v <= 0.02) return;
    const x = X(gx), y = Y(gy), a = v * keep(x) * calm; if (a <= 0.02) return;
    stamp(c, glow('255,236,196', 0.3), x, y, (60 + 50 * v) * k * sz, a * 0.55);
    stamp(c, sparkle('255,248,228', 64), x, y, (34 + 46 * v) * k * sz, a);
  });
  c.globalAlpha = 1;
  // 2 · THE PETALS drifting (source-over: Grok's cut-outs keep their own colour + alpha)
  c.globalCompositeOperation = 'source-over';
  const pt = image(`${GP_ART}gp-petals.webp`);
  if (pt) {
    for (let i = 0; i < PETALS.length; i++) {
      const P = petalAt(i, tt), [px, py, pw, ph] = PETALS[i], x = X(P.x), y = Y(P.y);
      const a = P.a * keep(x) * (full ? 0.95 : 0.92); if (a <= 0.02) continue;
      if (y < -ph * k || y > s.h + ph * k) continue;
      c.save(); c.translate(x, y); c.rotate(P.ang); c.scale(P.sx, 1); c.globalAlpha = a;
      c.drawImage(pt, px, py, pw, ph, -pw * k / 2, -ph * k / 2, pw * k, ph * k);
      c.restore();
    }
  }
  c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}

export const gpGarden = { id: 'gpGarden', tier: 'epic', bleed: 0, stillT: STILL_T, draw: garden };
