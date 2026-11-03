// `card-confetti` (rare — an effect + glowing edges): CONFETTI — paper pieces + curls tumbling down through the card, each turning in 3D
// (it narrows to an edge + flips, catching the light as it faces you), drifting side to side; a few strands of streamer. Seeded, by time.
import { glow, stamp, rng, unit, wob } from './kit.js';
import { rrect } from './renderer.js';

const COLS = ['255,92,184', '255,206,84', '84,222,255', '176,120,255', '255,255,255', '120,255,180'];

export default {
  id: 'confetti', tier: 'rare', bleed: 0, stillT: 1.7,
  draw(c, s, t, Q) {
    const { w, h } = s, rad = s.opts.radius || 12, U = unit(s), full = !!s.opts.full, r = rng(61 + (s.opts.seed || 0)), tt = Q.still ? 1.7 : t;
    const n = Math.round((full ? 70 : 26) * (0.5 + 0.5 * Q.q) * (s.opts.calm ? 0.75 : 1));
    c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
    for (let i = 0; i < n; i++) {
      const sp = 0.1 + r() * 0.12, ph = r(), u = Q.still ? ph : ((tt * sp + ph) % 1), col = COLS[Math.floor(r() * COLS.length)];
      const x = r() * w + (Q.still ? 0 : wob(tt * 0.5 + i, i) * U * 0.25), y = -U * 0.2 + u * (h + U * 0.4);
      const spin = tt * (1.5 + r() * 2.5) + r() * 6, face = Math.cos(spin), sz = U * (0.07 + r() * 0.07), curl = r() < 0.25;
      c.save(); c.translate(x, y); c.rotate(r() * 6 + tt * (r() - 0.5) * 2);
      c.scale(1, Math.max(0.12, Math.abs(face)));
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.9;
      // the paper: the lit side brighter as it faces you
      const lit = 0.55 + 0.45 * Math.abs(face);
      const [R, G, B] = col.split(',').map(Number);
      c.fillStyle = `rgb(${Math.round(R * lit)},${Math.round(G * lit)},${Math.round(B * lit)})`;
      if (curl) { c.lineWidth = sz * 0.35; c.strokeStyle = c.fillStyle; c.beginPath(); c.moveTo(-sz * 1.4, 0); c.quadraticCurveTo(-sz * 0.5, -sz * 1.2, 0, 0); c.quadraticCurveTo(sz * 0.5, sz * 1.2, sz * 1.4, 0); c.stroke(); }
      else c.fillRect(-sz, -sz * 0.6, sz * 2, sz * 1.2);
      c.restore();
      // a flash as a face turns to you
      if (Math.abs(face) > 0.96 && !Q.still) { c.globalCompositeOperation = 'lighter'; stamp(c, glow('255,255,255', 0.4, 16), x, y, sz * 3, 0.5); }
    }
    c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  },
};
