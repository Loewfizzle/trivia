// PRISM — the white beam + the sweeping rainbow (a rare: an effect + glowing edges): a white beam comes in from the left (passing behind
// the name plate), strikes a glass prism and leaves it SPLIT into a rainbow that fans out to the right edge and SWEEPS (its angle + its
// spread breathing); a faint dispersion inside the glass, a glint running the prism's edges, and every few seconds A HOLOGRAPHIC SHEEN
// slides across the whole strip. All 'lighter' over black glass: the colour is light, not paint.
import { glow, sparkle, stamp, smooth, fract } from './kit.js';
import { rrect } from './renderer.js';

const BANDS = ['255,60,90', '255,150,40', '255,235,80', '80,255,140', '60,200,255', '110,110,255', '200,90,255'];

export default {
  id: 'prism', tier: 'rare', bleed: 8, stillT: 1.4,
  draw(c, s, t, Q) {
    const { w, h } = s, rad = s.opts.radius || 12;
    c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
    // the prism: an equilateral triangle, point up, at ~55 % across
    // (a FULL CARD: the prism stands right of the name plate, smaller against the card, the beam coming in low from the left)
    const full = !!s.opts.full, pcx = w * (full ? 0.6 : 0.55), cy = h * (full ? 0.5 : 0.5), ph = h * (full ? 0.46 : 0.74), pw = ph * 1.155, top = [pcx, cy - ph / 2], bl = [pcx - pw / 2, cy + ph / 2], br = [pcx + pw / 2, cy + ph / 2];
    const hit = [pcx - pw * 0.26, cy + ph * 0.08], out = [pcx + pw * 0.22, cy - ph * 0.03];
    c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    // THE BEAM: from the left edge to the prism's face (a soft halo, then the white core)
    for (const [lw, a] of [[7, 0.08], [3.2, 0.22], [1.3, 0.95]]) { c.globalAlpha = a; c.strokeStyle = '#fff'; c.lineWidth = lw; c.beginPath(); c.moveTo(-4, h * (full ? 0.69 : 0.74)); c.lineTo(hit[0], hit[1]); c.stroke(); }
    // THE RAINBOW: a fan from the exit, sweeping
    const base = Q.still ? -0.12 : -0.14 + 0.13 * Math.sin(t * 0.55) + 0.03 * Math.sin(t * 1.7);
    const spread = (Q.still ? 0.3 : 0.26 + 0.08 * Math.sin(t * 0.37 + 1)) * (full ? 2.1 : 1);   // (a full card: the fan opens wide across the right of the card)
    const R = w;                                                  // (long enough to leave the strip)
    for (const [k, alpha] of [[1.25, 0.12], [1, 0.42]]) {
      for (let i = 0; i < BANDS.length; i++) {
        const a0 = base + spread * k * (i / BANDS.length - 0.5), a1 = base + spread * k * ((i + 1) / BANDS.length - 0.5);
        const g = c.createLinearGradient(out[0], out[1], out[0] + Math.cos(base) * w * 0.45, out[1] + Math.sin(base) * w * 0.45);
        g.addColorStop(0, `rgba(${BANDS[i]},${alpha * 1.6})`); g.addColorStop(0.35, `rgba(${BANDS[i]},${alpha})`); g.addColorStop(1, `rgba(${BANDS[i]},${alpha * 0.45})`);
        c.fillStyle = g; c.globalAlpha = 1;
        c.beginPath(); c.moveTo(out[0], out[1]); c.lineTo(out[0] + Math.cos(a0) * R, out[1] + Math.sin(a0) * R); c.lineTo(out[0] + Math.cos(a1) * R, out[1] + Math.sin(a1) * R); c.closePath(); c.fill();
      }
    }
    // inside the glass: the beam bending + beginning to split
    const ig = c.createLinearGradient(hit[0], hit[1], out[0], out[1]); ig.addColorStop(0, 'rgba(255,255,255,0.55)'); ig.addColorStop(1, 'rgba(200,220,255,0.35)');
    c.globalAlpha = 1; c.strokeStyle = ig; c.lineWidth = 2.2; c.beginPath(); c.moveTo(hit[0], hit[1]); c.lineTo(out[0], out[1]); c.stroke();
    // the glass: a faint body + bright edges (one edge catching the light), a glint racing round them
    c.globalCompositeOperation = 'source-over';
    const body = c.createLinearGradient(bl[0], top[1], br[0], bl[1]); body.addColorStop(0, 'rgba(255,255,255,0.10)'); body.addColorStop(0.6, 'rgba(180,200,255,0.04)'); body.addColorStop(1, 'rgba(255,255,255,0.08)');
    c.fillStyle = body; c.beginPath(); c.moveTo(...top); c.lineTo(...br); c.lineTo(...bl); c.closePath(); c.fill();
    c.globalCompositeOperation = 'lighter';
    c.lineJoin = 'round';
    for (const [lw, a] of [[3.5, 0.12], [1.2, 0.85]]) { c.globalAlpha = a; c.strokeStyle = '#eef4ff'; c.lineWidth = lw; c.beginPath(); c.moveTo(...top); c.lineTo(...br); c.lineTo(...bl); c.closePath(); c.stroke(); }
    if (!Q.still) {
      const e = fract(t / 2.6), pts = [top, br, bl, top], seg = Math.min(2, Math.floor(e * 3)), f = e * 3 - seg;
      const gx = pts[seg][0] + (pts[seg + 1][0] - pts[seg][0]) * f, gy = pts[seg][1] + (pts[seg + 1][1] - pts[seg][1]) * f;
      stamp(c, sparkle(), gx, gy, 12, 0.9); stamp(c, glow('255,255,255', 0.2, 32), gx, gy, 16, 0.35);
    }
    stamp(c, glow('255,255,255', 0.15, 32), out[0], out[1], 18, 0.55);
    // THE HOLO SHEEN: every ~5 s a pastel band slides across the whole strip
    const sh = fract(t / 5.2), sx = (sh * 1.8 - 0.4) * w;
    if (!Q.still && sh < 0.6) {
      const g = c.createLinearGradient(sx - h, 0, sx + h, h);
      [['255,120,200', 0], ['255,120,200', 0.12], ['120,220,255', 0.16], ['180,255,170', 0.12], ['255,240,140', 0.08], ['255,240,140', 0]].forEach(([col, a], i, A) => g.addColorStop(i / (A.length - 1), `rgba(${col},${a})`));
      c.globalAlpha = smooth(0, 0.1, sh) * (1 - smooth(0.45, 0.6, sh)); c.fillStyle = g; c.fillRect(0, 0, w, h);
    }
    c.restore();
    // the glowing edge (a rare's mark): a cool white rim, faintly iridescent
    c.globalCompositeOperation = 'lighter';
    const eg = c.createLinearGradient(0, 0, w, 0); eg.addColorStop(0, 'rgba(220,230,255,0.35)'); eg.addColorStop(0.5, 'rgba(255,190,240,0.5)'); eg.addColorStop(1, 'rgba(170,240,255,0.55)');
    for (const [lw, a] of [[6, 0.25], [1.4, 1]]) { c.globalAlpha = a; c.strokeStyle = eg; c.lineWidth = lw; rrect(c, 0.6, 0.6, w - 1.2, h - 1.2, rad - 0.3); c.stroke(); }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  },
};
