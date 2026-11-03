// THE BORDER LASER (the legendary's mark — the owner, Nov 2 3:52 pm: "a bright LASER / comet of light RACING ROUND THE BORDER"): a
// white-hot head with a coloured tail tracing the slot's rounded edge, one lap every ~3.4 s, plus the edge's own faint neon. Drawn
// 'lighter' just inside + over the edge (its glow bleeds a few px past it). Reduced motion: the edge lit, the comet parked top-right.
import { glow, stamp } from './kit.js';
import { fxDiag } from './renderer.js';

/** a point on a rounded rect's perimeter at distance s (clockwise from the top-left corner's end) */
export function along(w, h, r, s) {
  const L = [w - 2 * r, (Math.PI / 2) * r, h - 2 * r, (Math.PI / 2) * r, w - 2 * r, (Math.PI / 2) * r, h - 2 * r, (Math.PI / 2) * r];
  const P = L.reduce((a, b) => a + b, 0);
  s = ((s % P) + P) % P;
  let i = 0; while (s > L[i]) { s -= L[i]; i = (i + 1) % 8; }
  const u = L[i] ? s / L[i] : 0;
  switch (i) {
    case 0: return [r + s, 0];
    case 1: { const a = -Math.PI / 2 + u * Math.PI / 2; return [w - r + Math.cos(a) * r, r + Math.sin(a) * r]; }
    case 2: return [w, r + s];
    case 3: { const a = u * Math.PI / 2; return [w - r + Math.cos(a) * r, h - r + Math.sin(a) * r]; }
    case 4: return [w - r - s, h];
    case 5: { const a = Math.PI / 2 + u * Math.PI / 2; return [r + Math.cos(a) * r, h - r + Math.sin(a) * r]; }
    case 6: return [0, h - r - s];
    default: { const a = Math.PI + u * Math.PI / 2; return [r + Math.cos(a) * r, r + Math.sin(a) * r]; }
  }
}
export const perimeter = (w, h, r) => 2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r;

/** draw the comet on a slot of w × h (inset i) — rgb its colour, lap its seconds a lap */
export function drawLaser(c, w, h, t, o = {}) {
  if (!fxDiag.laser) return;
  const i = o.inset != null ? o.inset : 1.2, r = (o.radius || 12) - i * 0.5, W = w - 2 * i, H = h - 2 * i, rgb = o.rgb || '120,255,190';
  const P = perimeter(W, H, r), lap = o.lap || 3.4, still = !!o.still;
  const head = still ? (W - r) : (t / lap) * P;
  c.save(); c.translate(i, i); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
  // the tail: segments fading back along the edge (wide glow pass, then the bright core)
  const N = 30, len = P * (o.tail || 0.32), ds = len / N;
  for (const pass of [0, 1]) {
    let [px, py] = along(W, H, r, head);
    for (let k = 1; k <= N; k++) {
      const [x, y] = along(W, H, r, head - k * ds), f = 1 - k / N;
      c.globalAlpha = (pass ? 0.95 : 0.22) * Math.pow(f, 1.5);
      c.lineWidth = pass ? 0.8 + 1.8 * f : 3.5 + 5 * f;
      c.strokeStyle = pass && f > 0.82 ? 'rgb(255,255,255)' : `rgb(${rgb})`;
      c.beginPath(); c.moveTo(px, py); c.lineTo(x, y); c.stroke();
      px = x; py = y;
    }
  }
  // the head: a white-hot point in its own glow
  const [hx, hy] = along(W, H, r, head);
  stamp(c, glow(rgb, 0.12), hx, hy, 34, 0.85);
  stamp(c, glow('255,255,255', 0.3), hx, hy, 9, 1);
  c.restore();
}

export default {
  id: 'laser', tier: 'legendary', bleed: 10, stillT: 0,
  draw(c, s, t, Q) { drawLaser(c, s.w, s.h, t, { rgb: s.opts.laser || s.opts.tint || '120,255,190', still: Q.still, radius: s.opts.radius }); },
};
