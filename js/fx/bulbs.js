// `card-marquee-gold` (epic — two effects): YOUR NAME IN LIGHTS — a premiere: GOLD BULBS in a double row round the frame, a wave chasing
// round them (the two rows a half-beat apart), every bulb flaring white-gold at its crest; behind, two SEARCHLIGHTS crossing the sky from
// below (the opening night). Reduced motion: every bulb lit, the beams crossed.
import { glow, stamp, sprite, fract } from './kit.js';
import { rrect } from './renderer.js';

/** a searchlight beam, baked pointing up from its root (bottom centre) */
const beam = () => sprite('fx-beam', 64, 256, (c, W, H) => {
  for (const [k, a] of [[1, 0.1], [0.55, 0.16], [0.25, 0.24]]) {
    const g = c.createLinearGradient(0, H, 0, 0); g.addColorStop(0, `rgba(255,236,190,${a})`); g.addColorStop(1, `rgba(255,236,190,0)`);
    c.fillStyle = g; c.beginPath(); c.moveTo(W / 2 - 2, H); c.lineTo(W / 2 + 2, H); c.lineTo(W / 2 + W / 2 * k, 0); c.lineTo(W / 2 - W / 2 * k, 0); c.closePath(); c.fill();
  }
});
function ring(w, h, ins, gap) {
  const v = [], nx = Math.max(2, Math.round((w - 2 * ins) / gap)), ny = Math.max(1, Math.round((h - 2 * ins) / gap));
  for (let i = 0; i < nx; i++) v.push([ins + (w - 2 * ins) * i / nx, ins]);
  for (let i = 0; i < ny; i++) v.push([w - ins, ins + (h - 2 * ins) * i / ny]);
  for (let i = 0; i < nx; i++) v.push([w - ins - (w - 2 * ins) * i / nx, h - ins]);
  for (let i = 0; i < ny; i++) v.push([ins, h - ins - (h - 2 * ins) * i / ny]);
  return v;
}
const rings = new Map();

export default {
  id: 'bulbs', tier: 'epic', bleed: 6, stillT: 3,
  draw(c, s, t, Q) {
    const { w, h } = s, rad = s.opts.radius || 12, full = !!s.opts.full, tt = Q.still ? 3 : t;
    const key = `${Math.round(w)}x${Math.round(h)}`;
    if (!rings.has(key)) { if (rings.size > 8) rings.clear(); rings.set(key, [ring(w, h, 5, full ? 11 : 10), ring(w, h, 10.5, full ? 11 : 10)]); }
    const [A, B] = rings.get(key);
    // THE SEARCHLIGHTS (under the bulbs): two beams from below, swinging + crossing
    c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
    c.globalCompositeOperation = 'lighter';
    for (const [bx, ph, dir] of [[w * (full ? 0.3 : 0.55), 0, 1], [w * (full ? 0.72 : 0.88), 1.7, -1]]) {
      const a = Q.still ? 0.35 * dir : Math.sin(tt * 0.45 + ph) * 0.55, L = h * (full ? 1.4 : 2.6);
      c.save(); c.translate(bx, h + 4); c.rotate(a); c.globalAlpha = s.opts.calm ? 0.6 : 0.85; c.drawImage(beam(), -L * 0.22, -L, L * 0.44, L); c.restore();
    }
    c.restore();
    // THE BULBS: two rows, a wave chasing round, crests flaring
    c.globalCompositeOperation = 'lighter';
    const head = tt * 9;
    for (const [row, off] of [[A, 0], [B, 0.5]]) {
      const N = row.length;
      for (let i = 0; i < N; i++) {
        const [x, y] = row[i], ph = ((i - head) / 6 + off), wave = Math.pow(Math.max(0, Math.cos(ph * Math.PI * 2)), 6);
        const b = Q.still ? 0.9 : 0.25 + 0.75 * wave;
        stamp(c, glow('255,196,90', 0.12, 32), x, y, 16, b * 0.55);
        stamp(c, glow('255,232,170', 0.35, 16), x, y, 5.5, Math.min(1, b + 0.15));
        if (wave > 0.9 && !Q.still) stamp(c, glow('255,255,240', 0.6, 16), x, y, 3, wave);
      }
    }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    void fract;
  },
};
