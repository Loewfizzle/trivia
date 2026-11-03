// BEVEL — THE DIAMOND-CUT EDGE (THE VAULT 2A, `card-platinum`'s second effect — the owner's pick, Nov 3 11:50 am: a solid metal plate,
// a diamond-cut bevelled edge, a cold white light sliding across it — clean, not busy). The bevel itself is CSS (css/vault.css .vl-s-platinum
// — two cut facets round the edge, crisp at the phone's full ratio); this is the LIGHT on it: as the cold sheen crosses the plate, the facets
// it passes catch it — a short white run of light along the cut edge (top + bottom, where the band meets them), a hard glint where it
// leaves a corner. No tail, no colour, no particles: clean. Stateless by time (the sheen's own clock: they stay in step); reduced motion:
// one facet lit top-left, no glint.
import { glow, sparkle, stamp, smooth, fract } from './kit.js';
import { along } from './laser.js';

export default {
  id: 'bevel', tier: 'epic', bleed: 6, stillT: 1.6,
  draw(c, s, t, Q) {
    const { w, h } = s, rad = s.opts.radius || 12, full = !!s.opts.full, period = full ? 6.2 : 5.2;
    const u = Q.still ? 0.33 : fract(t / period + (s.opts.seed || 0) * 0.13), run = u / 0.42;     // (the sheen's own pass: sheen.js)
    const i = full ? 3.2 : 2.2, W = w - 2 * i, H = h - 2 * i, r = Math.max(2, rad - i * 0.6);
    c.save(); c.translate(i, i); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    // where the sheen's slanted band meets the top + the bottom edge (it slants: the top leads by its lean)
    if (run < 1) {
      const x = -h * 0.8 + run * (w + h * 1.6), sl = h * 0.55, fade = Math.sin(Math.min(1, run) * Math.PI);
      for (const [ex, top] of [[x + sl - i, true], [x - sl - i, false]]) {
        if (ex < -20 || ex > W + 20) continue;
        // the run of light along the facet: a few strokes fading out each side of the meeting point (top: s from the top-left; bottom: back)
        const s0 = top ? ex - r : (W - 2 * r) + (H - 2 * r) + Math.PI * r + (W - r - ex);
        const span = full ? 46 : 30, N = 8;
        for (const pass of [0, 1]) {
          for (let k = -N; k < N; k++) {
            const a = along(W, H, r, s0 + (k / N) * span), b = along(W, H, r, s0 + ((k + 1) / N) * span), f = 1 - Math.abs(k + 0.5) / N;
            c.globalAlpha = fade * (pass ? 0.85 : 0.2) * f * f;
            c.lineWidth = pass ? (full ? 1.3 : 1) : (full ? 6 : 4.5);
            c.strokeStyle = pass ? 'rgb(255,255,255)' : 'rgb(214,228,255)';
            c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
          }
        }
      }
    } else if (Q.still) {
      const a = along(W, H, r, r + W * 0.2); stamp(c, glow('214,228,255', 0.3, 32), a[0], a[1], 18, 0.5, 6);
    }
    // the glint where the band leaves the top-right corner's cut (+ a softer one at the bottom-left as it enters)
    const gl = Q.still ? 0 : smooth(0.38, 0.44, u) * (1 - smooth(0.44, 0.52, u));
    const gi = Q.still ? 0 : smooth(0.0, 0.04, u) * (1 - smooth(0.04, 0.12, u));
    const c1 = along(W, H, r, (W - 2 * r) + (Math.PI / 4) * r), c0 = along(W, H, r, 2 * (W - 2 * r) + (H - 2 * r) + Math.PI * r + (Math.PI / 4) * r);
    if (gl > 0.01) { stamp(c, glow('220,232,255', 0.2, 32), c1[0], c1[1], h * 0.8, 0.35 * gl); stamp(c, sparkle('255,255,255', 64), c1[0], c1[1], Math.min(full ? 70 : 44, h * 0.62), gl); }
    if (gi > 0.01) stamp(c, sparkle('235,242,255', 64), c0[0], c0[1], Math.min(full ? 46 : 30, h * 0.4), 0.7 * gi);
    c.restore();
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  },
};
