// SHEEN — THE FOIL'S SHINE PASS (THE VAULT 1B — an uncommon's one clear effect for the lacquer + foil cards: `card-emerald`, `card-chrome`,
// `card-champagne` …; decisions: "UNCOMMON = a shimmer pass"): every ~5 s a band of light SWEEPS across the card at a slant — a soft
// wide glow, a bright narrow core, a faint coloured fringe each side (the foil's own tint: opts.tint 'r,g,b') — then a glint flares on the
// frame where the band leaves it. Stateless by time; reduced motion: the band parked a third of the way across, no glint.
import { glow, sparkle, stamp, smooth, fract } from './kit.js';
import { rrect } from './renderer.js';

export default {
  id: 'sheen', tier: 'uncommon', bleed: 6, stillT: 1.6,
  draw(c, s, t, Q) {
    const { w, h } = s, rad = s.opts.radius || 12, tint = s.opts.tint || '255,236,190', period = s.opts.full ? 6.2 : 5.2;
    const u = Q.still ? 0.33 : fract(t / period + (s.opts.seed || 0) * 0.13), run = u / 0.42;   // (the pass takes ~42 % of the period)
    if (run < 1) {
      const x = -h * 0.8 + run * (w + h * 1.6), sl = h * 0.55, a = Math.sin(Math.min(1, run) * Math.PI);
      c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
      c.globalCompositeOperation = 'lighter';
      for (const [bw, al, col] of [[h * 0.9, 0.16, tint], [h * 0.34, 0.3, '255,255,255'], [h * 0.12, 0.38, '255,255,255']]) {
        const g = c.createLinearGradient(x - bw, 0, x + bw, 0);
        g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(0.5, `rgba(${col},${Math.min(1, al * (s.opts.gain || 1))})`); g.addColorStop(1, `rgba(${col},0)`);
        c.fillStyle = g; c.globalAlpha = a;     // (opts.gain — the stops above: a brighter pass on a light metal (card-platinum); 1 = as approved)
        c.beginPath(); c.moveTo(x - bw + sl, 0); c.lineTo(x + bw + sl, 0); c.lineTo(x + bw - sl, h); c.lineTo(x - bw - sl, h); c.closePath(); c.fill();
      }
      c.restore();
    }
    // the glint where the band leaves the frame (top right)
    const gl = Q.still ? 0 : smooth(0.4, 0.46, u) * (1 - smooth(0.46, 0.56, u));
    if (gl > 0.01) {
      c.globalCompositeOperation = 'lighter';
      stamp(c, glow(tint, 0.2, 32), w - rad * 0.7, rad * 0.7, h * 0.7, 0.4 * gl);
      stamp(c, sparkle('255,255,255', 64), w - rad * 0.7, rad * 0.7, Math.min(46, h * 0.55), gl);
    }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  },
};
