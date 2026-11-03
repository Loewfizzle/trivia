// TUBE — A NEON TUBE INSIDE THE EDGE (THE VAULT 1B — NEON GLASS: "smoked glass with a cyan tube inside the edge"): a real tube bent round
// the card a few px in from the rim — the wide soft glow, the coloured glass, the white-hot core (the city's own tube look) — BREATHING
// with its hum, and once a cycle it STUTTERS (an old transformer catching) and comes back. Its colour: opts.tint 'r,g,b'. The glow
// spills onto the smoked glass inside. Stateless by time; reduced motion: lit, steady.
import { wob, fract } from './kit.js';
import { rrect } from './renderer.js';

function power(t) {
  const u = fract(t / 11) * 11;
  if (u > 9.2 && u < 9.75) return [1, 0.2, 0.9, 0.1, 0.75, 1, 0.35, 1][Math.min(7, Math.floor((u - 9.2) * 14))];
  return 0.86 + 0.1 * (0.5 + 0.5 * Math.sin(u * 1.4)) + 0.02 * wob(u * 9, 2);
}

export default {
  id: 'tube', tier: 'uncommon', bleed: 10, stillT: 2,
  draw(c, s, t, Q) {
    const { w, h } = s, rad = s.opts.radius || 12, rgb = s.opts.tint || '63,224,255', full = !!s.opts.full;
    const ins = full ? 9 : 4.5, k = full ? 1.35 : 1, p = Q.still ? 1 : power(t);
    c.lineJoin = 'round';
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.55; c.strokeStyle = `rgba(${rgb},0.25)`; c.lineWidth = 2.6 * k;
    rrect(c, ins, ins, w - 2 * ins, h - 2 * ins, Math.max(2, rad - ins * 0.6)); c.stroke();
    c.globalCompositeOperation = 'lighter';
    for (const [lw, col, a] of [[14, rgb, 0.07], [7, rgb, 0.16], [2.8, rgb, 0.9], [1, '235,255,255', 0.9]]) {
      c.globalAlpha = a * p; c.strokeStyle = `rgb(${col})`; c.lineWidth = lw * k;
      rrect(c, ins, ins, w - 2 * ins, h - 2 * ins, Math.max(2, rad - ins * 0.6)); c.stroke();
    }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  },
};
