// `card-witness` (legendary — every legend over the harbor, seen): THE STAR CHART — the night over the harbor drawn as an old celestial
// map: every legend the city flies written in the stars as its own CONSTELLATION (the saucer, the black triangle, the Blackbird, the vic of
// jets, the ghost ship, the skull balloon, the fireball, the aurora's ribbon) — all of them faint at once (the chart), and one after another
// each LIGHTS UP: its lines drawn in gold, its stars flaring, a breath of its own colour round it, then it settles back into the chart.
// + THE BORDER LASER. All by time + a fixed layout (the same chart on every phone).
import { glow, stamp, sparkle, sprite, rng, smooth, clamp01 } from './kit.js';
import { drawLaser } from './laser.js';
import { rrect } from './renderer.js';
import { backdrop } from './sg-kit.js';

// each figure: polylines in its own unit box (-1..1), its colour (r,g,b)
const FIG = [
  { id: 'ufo', rgb: '120,255,190', lines: [[[-1, 0.05], [-0.62, -0.16], [-0.3, -0.5], [0.3, -0.5], [0.62, -0.16], [1, 0.05], [0.5, 0.25], [-0.5, 0.25], [-1, 0.05]], [[-0.22, 0.25], [-0.45, 0.95]], [[0.22, 0.25], [0.45, 0.95]]] },
  { id: 'tr3b', rgb: '255,90,70', lines: [[[1, 0], [-0.75, -0.55], [-0.6, 0.55], [1, 0]], [[0.1, 0], [0.1, 0]]] },
  { id: 'blackbird', rgb: '196,150,255', lines: [[[1, 0], [0.25, -0.12], [-0.3, -0.48], [-0.82, -0.46], [-0.6, -0.1], [-1, 0], [-0.6, 0.1], [-0.82, 0.46], [-0.3, 0.48], [0.25, 0.12], [1, 0]]] },
  { id: 'f22', rgb: '110,185,255', lines: [[[0.6, -0.1], [0.2, -0.35], [0.25, -0.1], [0.6, -0.1]], [[0.2, 0.5], [-0.2, 0.25], [-0.15, 0.5], [0.2, 0.5]], [[-0.4, -0.55], [-0.8, -0.8], [-0.75, -0.55], [-0.4, -0.55]]] },
  { id: 'ghost', rgb: '120,255,190', lines: [[[-1, 0.35], [1, 0.35], [0.7, 0.7], [-0.8, 0.7], [-1, 0.35]], [[0, 0.35], [0, -1]], [[0, -0.9], [0.62, -0.1], [0, -0.1]], [[-0.55, 0.35], [-0.55, -0.6], [-0.1, -0.2]]] },
  { id: 'skull', rgb: '255,140,60', lines: [[[0, -1], [0.55, -0.78], [0.72, -0.25], [0.42, 0.3], [0.14, 0.55], [-0.14, 0.55], [-0.42, 0.3], [-0.72, -0.25], [-0.55, -0.78], [0, -1]], [[-0.12, 0.62], [-0.12, 0.85], [0.12, 0.85], [0.12, 0.62]]] },
  { id: 'fireball', rgb: '196,255,120', lines: [[[0.85, -0.65], [0.3, -0.2], [-0.25, 0.25], [-0.9, 0.75]], [[0.3, -0.2], [0.15, 0.05]], [[-0.25, 0.25], [-0.45, 0.2]]] },
  { id: 'aurora', rgb: '255,116,214', lines: [[[-1, 0.1], [-0.55, -0.35], [-0.1, 0.05], [0.35, -0.4], [0.8, -0.05], [1, -0.2]]] },
];
// where each sits: on a full card (x, y, size as fractions of w / h / w) — clear of the plate (left-middle) + the words; a strip shows the right half
const PLACE_FULL = [[0.66, 0.31, 0.09], [0.87, 0.27, 0.07], [0.75, 0.57, 0.1], [0.52, 0.21, 0.055], [0.91, 0.67, 0.055], [0.45, 0.8, 0.045], [0.36, 0.21, 0.045], [0.63, 0.76, 0.075]];
const PLACE_STRIP = [[0.5, 0.42, 0.05], [0.62, 0.5, 0.04], [0.74, 0.4, 0.055], [0.86, 0.3, 0.04], [0.95, 0.62, 0.035], [0.56, 0.78, 0.03], [0.68, 0.18, 0.03], [0.82, 0.72, 0.045]];
const SKY = { sky: [[0, '#03040c'], [0.6, '#070a1c'], [1, '#0b0e22']], stars: 60, starRgb: '230,236,255', starTo: 1, seed: 202,
  glow: [{ x: 0.7, y: 0.4, r: 0.6, rgb: '120,110,200', a: 0.1 }] };
/** the chart's fine graticule (baked): a few arcs of right ascension + a ring, gold, faint */
const chart = (w, h, dpr) => sprite(`fx-chart:${w}x${h}@${dpr}`, w * dpr, h * dpr, (c) => {
  c.scale(dpr, dpr); c.strokeStyle = 'rgba(214,178,106,0.14)'; c.lineWidth = 0.6;
  for (let i = 1; i < 5; i++) { c.beginPath(); c.arc(w * 0.65, h * 1.8, h * (0.9 + i * 0.32), Math.PI * 1.08, Math.PI * 1.92); c.stroke(); }
  for (let i = 0; i < 7; i++) { const a = Math.PI * (1.12 + i * 0.12); c.beginPath(); c.moveTo(w * 0.65, h * 1.8); c.lineTo(w * 0.65 + Math.cos(a) * h * 3, h * 1.8 + Math.sin(a) * h * 3); c.stroke(); }
});

export default {
  id: 'witness', tier: 'legendary', bleed: 10, stillT: 1.6,
  draw(c, s, t, Q) {
    const { w, h } = s, rad = s.opts.radius || 12, full = !!s.opts.full, tt = Q.still ? 1.6 : t;
    const dpr = Math.min(3, Math.max(1, Math.round(Q.dpr * 4) / 4)), PL = full ? PLACE_FULL : PLACE_STRIP;
    c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
    c.drawImage(backdrop(full ? 'wit-full' : 'wit', w, h, dpr, SKY), 0, 0, w, h);
    c.drawImage(chart(w, h, dpr), 0, 0, w, h);
    const STEP = 2.2, cur = Math.floor(tt / STEP) % FIG.length, ph = (tt % STEP) / STEP;
    c.lineCap = 'round'; c.lineJoin = 'round';
    FIG.forEach((F, i) => {
      const [px, py, ps] = PL[i], R = ps * w, X = px * w, Y = py * h;
      const on = Q.still ? (i === 0 ? 1 : 0) : i === cur ? smooth(0, 0.25, ph) * (1 - smooth(0.8, 1, ph) * 0.6) : i === (cur + FIG.length - 1) % FIG.length ? 0.4 * (1 - smooth(0, 0.4, ph)) : 0;
      const draw = Q.still ? 1 : i === cur ? clamp01(ph / 0.45) : 1;
      // the lines: always faint (the chart), drawn in bright gold when lit (the stroke grows along the figure)
      c.globalCompositeOperation = 'lighter';
      if (on > 0.02) stamp(c, glow(F.rgb, 0.05, 64), X, Y, R * 3.2, 0.3 * on);
      for (const line of F.lines) {
        const pts = line.map(([a, b]) => [X + a * R, Y + b * R]);
        c.globalAlpha = 0.3 + 0.1 * on; c.strokeStyle = 'rgb(214,178,106)'; c.lineWidth = 0.8;
        c.beginPath(); pts.forEach(([a, b], k) => (k ? c.lineTo(a, b) : c.moveTo(a, b))); c.stroke();
        if (on > 0.02) {
          const n = pts.length - 1, upto = draw * n;
          c.globalAlpha = 0.9 * on; c.strokeStyle = 'rgb(255,222,150)'; c.lineWidth = full ? 1.3 : 1;
          c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
          for (let k = 1; k <= n; k++) { if (k <= upto) c.lineTo(pts[k][0], pts[k][1]); else { const f = upto - (k - 1); if (f > 0) c.lineTo(pts[k - 1][0] + (pts[k][0] - pts[k - 1][0]) * f, pts[k - 1][1] + (pts[k][1] - pts[k - 1][1]) * f); break; } }
          c.stroke();
        }
        // its stars at the vertices
        for (const [a, b] of pts) { stamp(c, glow('255,246,220', 0.5, 16), a, b, (full ? 3.4 : 2.6) + 2.5 * on, 0.6 + 0.4 * on); }
      }
      if (on > 0.6 && !Q.still) { const [a, b] = [X + F.lines[0][0][0] * R, Y + F.lines[0][0][1] * R]; stamp(c, sparkle('255,246,220'), a, b, R * 1.2, (on - 0.6) * 2.2); }
    });
    c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    drawLaser(c, w, h, t, { rgb: '255,214,140', still: Q.still, radius: rad });
    void rng;
  },
};
