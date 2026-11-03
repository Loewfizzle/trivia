// THE MARQUEE (an epic: TWO effects together, bold): THEATRE BULBS round the edge — brass sockets, warm filament bulbs, a chase running
// round the frame (every third bulb, a soft hand-off between neighbours, now and then the whole ring flashes at once) — and A NEON TUBE
// that FLICKERS ON (the ignition stutter, then lit with the tube's hum; off again for a beat each cycle — the city's own tube look: a
// wide soft glow, the coloured tube, a white-hot core). Reduced motion: every bulb lit, the tube on.
import { glow, stamp, fract, smooth } from './kit.js';
import { rrect } from './renderer.js';

/** the bulbs' places round the frame (inset), in order clockwise from the top-left */
function bulbs(w, h) {
  const k = `${w}x${h}`;
  if (bulbs.k === k) return bulbs.v;
  const v = [], ins = 6, gap = 15, nx = Math.max(2, Math.round((w - 2 * ins) / gap)), ny = Math.max(1, Math.round((h - 2 * ins) / gap));
  for (let i = 0; i < nx; i++) v.push([ins + (w - 2 * ins) * i / nx, ins]);
  for (let i = 0; i < ny; i++) v.push([w - ins, ins + (h - 2 * ins) * i / ny]);
  for (let i = 0; i < nx; i++) v.push([w - ins - (w - 2 * ins) * i / nx, h - ins]);
  for (let i = 0; i < ny; i++) v.push([ins, h - ins - (h - 2 * ins) * i / ny]);
  bulbs.k = k; bulbs.v = v; return v;
}
/** the tube: a left-pointing arrow (the marquee's "this way in") along the right half */
function tubePath(c, w, h) {
  const x0 = w * 0.5, x1 = w * 0.84, y = h * 0.5, a = h * 0.17;
  c.beginPath();
  c.moveTo(x1, y); c.lineTo(x0 + a * 0.6, y);
  c.moveTo(x0 + a * 1.25, y - a); c.lineTo(x0, y); c.lineTo(x0 + a * 1.25, y + a);
  c.moveTo(x1 + a * 0.15, y - a * 0.9); c.lineTo(x1 + a * 0.15, y + a * 0.9);
}
/** the tube's power at time t (0..1): off → a stutter → on (a faint hum) → off for a beat — a 9 s cycle */
function power(t) {
  const u = fract(t / 9) * 9;
  if (u < 0.35) return 0;
  if (u < 1.35) { const s = (u - 0.35) * 14; return [0, 0.9, 0.1, 0, 0.75, 0.2, 1, 0.35, 0.95, 1, 0.6, 1, 1, 1][Math.min(13, Math.floor(s))]; }
  if (u > 8.55) return 0.15;
  return 0.94 + 0.06 * Math.sin(u * 47);
}

export default {
  id: 'marquee', tier: 'epic', bleed: 8, stillT: 4,
  draw(c, s, t, Q) {
    const { w, h } = s, rad = s.opts.radius || 12, B = bulbs(w, h), N = B.length;
    // THE TUBE (under the bulbs): the unlit glass always faintly there; lit, its glow + colour + core
    const p = Q.still ? 1 : power(t);
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.5; c.strokeStyle = 'rgba(120,40,70,0.9)'; c.lineWidth = 2.4; tubePath(c, w, h); c.stroke();
    if (p > 0.02) {
      c.globalCompositeOperation = 'lighter';
      for (const [lw, col, a] of [[12, '255,60,150', 0.1], [6.5, '255,70,160', 0.22], [2.6, '255,95,180', 0.95], [1, '255,225,240', 0.95]]) { c.globalAlpha = a * p; c.strokeStyle = `rgb(${col})`; c.lineWidth = lw; tubePath(c, w, h); c.stroke(); }
    }
    // THE BULBS: sockets (always), the chase, now and then the whole ring flashing on the beat
    const cyc = fract(t / 12), flash = Q.still ? 0 : smooth(0.86, 0.87, cyc) * (1 - smooth(0.93, 0.95, cyc)) * (fract(t * 3.3) < 0.5 ? 1 : 0.35);
    const head = t * 6;
    for (let i = 0; i < N; i++) {
      const [x, y] = B[i];
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      c.fillStyle = '#3a2408'; c.beginPath(); c.arc(x, y, 3.3, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(232,190,110,0.9)'; c.lineWidth = 0.9; c.stroke();
      c.fillStyle = 'rgba(120,70,20,0.9)'; c.beginPath(); c.arc(x, y, 2.1, 0, Math.PI * 2); c.fill();
      // the chase: every third bulb, a soft hand-off (cos^4 of the phase)
      const ph = (i - head) / 3, chase = Math.pow(Math.max(0, Math.cos(ph * Math.PI * 2)), 4);
      const b = Q.still ? 1 : Math.max(0.08, Math.min(1, 0.08 + chase * 0.92 + flash));
      c.globalCompositeOperation = 'lighter';
      stamp(c, glow('255,186,90', 0.12, 32), x, y, 24, b * 0.75);
      stamp(c, glow('255,236,190', 0.3, 32), x, y, 9, b);
      stamp(c, glow('255,255,245', 0.6, 16), x, y, 3.6, b);
    }
    // the edge: brass + a warm glow (an epic's bold frame)
    c.globalCompositeOperation = 'lighter';
    for (const [lw, a] of [[6, 0.12], [1.3, 0.55]]) { c.globalAlpha = a; c.strokeStyle = 'rgb(255,190,100)'; c.lineWidth = lw; rrect(c, 0.6, 0.6, w - 1.2, h - 1.2, rad - 0.3); c.stroke(); }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  },
};
