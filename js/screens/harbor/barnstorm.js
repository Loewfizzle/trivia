// CITY 2.0 — THE HARBOR, PART 6b: THE BARNSTORMER THROUGH THE SIGN (plan.md "THE BARNSTORMER THROUGH THE SIGN"; docs/harbor.md#part-6b).
// The one planned exception to "nothing flies across the sign" (THE THREE DEPTH RULES: (3) THROUGH the letters). A 1920s barnstormer —
// a bright red biplane, an open cockpit, a white scarf streaming back — THREADS THROUGH THE NEON LETTERS: behind the first N's two
// uprights and in front of its diagonal, in front of the E, THROUGH THE O (behind its left side, in front of its right), round the last N
// in a LOOP, then away climbing. By day a thin white smoke trail; at night its wingtip lights glinting + the sign's pink glow on it, the
// letters flickering a touch in its wake.
//   HOW IT GOES BETWEEN THE LAYERS: the sign is the page's (DOM) — it draws over the city's canvas. The plane is drawn on a small OVERLAY
//   canvas above the sign (made for the flight, removed after), and the strokes it passes BEHIND are cut out of that overlay (their
//   tube paths from ui/logo.js, mapped like the sign's dark halo), so the real glass shows over the plane there. Its smoke stays on the
//   city's canvas (behind the sign). The path is a function of the seconds since it began (every phone the same flight).
import { LOGO_W } from '../../ui/logo.js';
import { BARN_LEN } from '../../core/harbor-legend.js';
import { safeCtx } from '../../ui/canvas-safe.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

// the strokes it passes BEHIND (logo units: each letter's own 0..64 × 0..100 box + its x offset — ui/logo.js#LETTERS)
const BEHIND = [
  { x: 0, d: 'M0 100 V10 Q0 0 7 7' },                                   // the first N's left upright
  { x: 0, d: 'M57 93 Q64 100 64 90 V0' },                                // … and its right upright (the diagonal stays behind the plane)
  { x: 176, d: 'M32 0 C14 0 0 14 0 32 V68 C0 86 12 100 27 100' },       // the O's LEFT side (it flies through the ring)
  { x: 268, d: 'M7 7 L57 93' },                                          // the last N's diagonal (on the way into the loop)
];
const TUBE_CUT = 10.5;                                                   // (logo units: the glass tube + a hair)

/**
 * THE PATH (logo units, y down; the logo box 0..332 × 0..100) at s seconds → { x, y, ang (screen heading), on, dir (the mirror: ±1) }:
 * in from the left at mid-height, a gentle weave through N · E · O, a LOOP round the last N, then away up to the right.
 */
export function barnAt(s) {
  if (s < 0 || s > BARN_LEN) return { on: false };
  const weave = (x, base) => base + Math.sin((x + 40) / 52) * 9;
  const vx = 52;                                                           // (logo units / s ≈ 45 pt/s on a phone)
  const x0 = -90, xL = 272, tA = (xL - x0) / vx;                          // (≈ 7 s to the loop's entry)
  if (s < tA) { const x = x0 + vx * s, y = weave(x, 52), dy = Math.cos((x + 40) / 52) * 9 / 52; return { x, y, ang: Math.atan2(dy, 1), on: true, dir: 1 }; }
  const R = 40, cx = xL, cy = weave(xL, 52) - R, loopT = TAU * R / (vx * 1.15);
  if (s < tA + loopT) { const a = (s - tA) / loopT * TAU; return { x: cx + Math.sin(a) * R, y: cy + Math.cos(a) * R, ang: -a, on: true, dir: 1, loop: a }; }
  const e = s - tA - loopT, x = xL + vx * 1.2 * e, y = weave(xL, 52) - e * e * 9 - e * 14;
  return { x, y, ang: Math.atan2(-(18 * e + 14), vx * 1.2), on: x < LOGO_W + 160, dir: 1 };
}

/** the biplane, nose → +x, `len` pt long, its paint in this light (day 0..1, night 0..1), t (s: the prop + the scarf) */
function drawBiplane(c, len, day, night, t, pink) {
  const red = mix([96, 20, 24], [214, 36, 36], day), redD = red.map(v => v * 0.7), cream = mix([110, 100, 90], [246, 236, 214], day);
  const P = (pts, col) => { c.fillStyle = col; c.beginPath(); pts.forEach(([a, b], i) => (i ? c.lineTo(a * len, b * len) : c.moveTo(a * len, b * len))); c.closePath(); c.fill(); };
  c.lineCap = 'round';
  // the lower wing (behind the body), the far tailplane
  P([[0.4, 0.08], [0.78, 0.07], [0.79, 0.1], [0.4, 0.11]], rgb(redD));
  // the wheels + their struts
  c.strokeStyle = rgb([40, 34, 34]); c.lineWidth = len * 0.018;
  c.beginPath(); c.moveTo(0.66 * len, 0.06 * len); c.lineTo(0.7 * len, 0.17 * len); c.moveTo(0.76 * len, 0.06 * len); c.lineTo(0.7 * len, 0.17 * len); c.stroke();
  c.fillStyle = rgb([26, 22, 24]); c.beginPath(); c.arc(0.7 * len, 0.18 * len, 0.05 * len, 0, TAU); c.fill();
  c.fillStyle = rgb(cream); c.beginPath(); c.arc(0.7 * len, 0.18 * len, 0.018 * len, 0, TAU); c.fill();
  // the fuselage: the round engine cowl at the nose, tapering to the tail
  c.beginPath(); c.moveTo(0.95 * len, -0.055 * len); c.bezierCurveTo(0.7 * len, -0.075 * len, 0.3 * len, -0.06 * len, 0.02 * len, -0.025 * len);
  c.lineTo(0.0, 0.01 * len); c.bezierCurveTo(0.3 * len, 0.05 * len, 0.7 * len, 0.07 * len, 0.95 * len, 0.06 * len); c.closePath();
  const g = c.createLinearGradient(0, -0.07 * len, 0, 0.07 * len); g.addColorStop(0, rgb(mix(red, [255, 220, 200], 0.25 * day))); g.addColorStop(1, rgb(redD));
  c.fillStyle = g; c.fill();
  c.fillStyle = rgb(cream); c.fillRect(0.15 * len, -0.012 * len, 0.62 * len, 0.016 * len);                       // (the cream cheatline)
  c.fillStyle = rgb([44, 40, 44]); c.beginPath(); c.ellipse(0.93 * len, 0, 0.05 * len, 0.068 * len, 0, 0, TAU); c.fill();   // (the cowl)
  // the tail: the fin + the rudder (cream with a red band), the near tailplane
  P([[0.12, -0.03], [0.04, -0.17], [-0.02, -0.17], [-0.01, -0.02]], rgb(cream));
  P([[0.06, -0.11], [0.02, -0.17], [-0.02, -0.17], [-0.01, -0.11]], rgb(red));
  P([[0.14, 0.0], [-0.04, 0.04], [-0.05, 0.02], [0.0, -0.005]], rgb(redD));
  // the open cockpit: the pilot's leather helmet + goggles, and his WHITE SCARF streaming back in the wind
  c.fillStyle = rgb(mix([40, 30, 26], [110, 70, 44], day)); c.beginPath(); c.arc(0.52 * len, -0.095 * len, 0.035 * len, 0, TAU); c.fill();
  c.fillStyle = rgb([200, 210, 220]); c.fillRect(0.53 * len, -0.105 * len, 0.03 * len, 0.012 * len);
  const sw = Math.sin(t * 13) * 0.02;
  c.strokeStyle = rgb(mix([150, 150, 160], [250, 250, 250], day)); c.lineWidth = len * 0.022;
  c.beginPath(); c.moveTo(0.5 * len, -0.08 * len); c.quadraticCurveTo(0.42 * len, (-0.1 + sw) * len, 0.32 * len, (-0.09 - sw) * len); c.stroke();
  // the upper wing on its struts (in front: the cabane + the interplane struts)
  c.strokeStyle = rgb([60, 40, 36]); c.lineWidth = len * 0.012;
  c.beginPath(); for (const x of [0.46, 0.73]) { c.moveTo(x * len, -0.19 * len); c.lineTo((x + 0.01) * len, 0.08 * len); } c.moveTo(0.58 * len, -0.19 * len); c.lineTo(0.6 * len, -0.06 * len); c.stroke();
  P([[0.38, -0.215], [0.8, -0.225], [0.81, -0.19], [0.39, -0.185]], rgb(red));
  c.fillStyle = rgb(cream, 0.8); c.fillRect(0.4 * len, -0.212 * len, 0.4 * len, 0.008 * len);
  // the propeller: a blurred disc
  c.fillStyle = rgb([200, 200, 210], 0.28); c.beginPath(); c.ellipse(0.985 * len, 0, 0.016 * len, 0.19 * len, 0, 0, TAU); c.fill();
  c.strokeStyle = rgb([60, 50, 50], 0.6); c.lineWidth = len * 0.012; const pa = t * 40; c.beginPath(); c.moveTo(0.985 * len, Math.sin(pa) * 0.19 * len); c.lineTo(0.985 * len, -Math.sin(pa) * 0.19 * len); c.stroke();
  // the sign's pink glow on its top + its wingtip / tail lights at night
  if (pink > 0.02) { c.globalCompositeOperation = 'source-atop'; c.fillStyle = rgb([255, 80, 170], 0.45 * pink); c.fillRect(-0.1 * len, -0.3 * len, 1.2 * len, 0.2 * len); c.globalCompositeOperation = 'source-over'; }
  if (night > 0.1) {
    c.globalCompositeOperation = 'lighter';
    for (const [x, y, col] of [[0.8, -0.205, [90, 255, 140]], [0.0, -0.17, [255, 250, 240]]]) {
      const r = len * 0.06, gr = c.createRadialGradient(x * len, y * len, 0, x * len, y * len, r); gr.addColorStop(0, rgb(col, night)); gr.addColorStop(1, rgb(col, 0));
      c.fillStyle = gr; c.beginPath(); c.arc(x * len, y * len, r, 0, TAU); c.fill();
    }
    c.globalCompositeOperation = 'source-over';
  }
}

export function createBarnstorm() {
  let cur = null, fg = null, fx = null, band = null, dpr = 2;
  const ensure = (W, nr) => {
    const top = Math.max(0, nr.y - nr.h * 1.4), h = nr.h * 2.9, d = Math.min(2, dpr);
    if (!fg) {
      fg = document.createElement('canvas'); fg.className = 'nd-skyfront'; fg.setAttribute('aria-hidden', 'true');
      fg.style.cssText = 'position:fixed;left:0;pointer-events:none;z-index:60;';
      document.body.appendChild(fg);
    }
    if (!band || band.top !== top || band.h !== h || band.W !== W) {
      band = { top, h, W }; fg.width = Math.ceil(W * d); fg.height = Math.ceil(h * d);
      fg.style.top = `${top}px`; fg.style.width = `${W}px`; fg.style.height = `${h}px`;
      fx = safeCtx(fg);
    }
    return d;
  };
  const drop = () => { if (fg) { fg.remove(); fg.width = 0; fg = null; fx = null; band = null; } };
  // the logo's box on the screen (title.js#logoRect is 7 % / 18 % inside it — the same mapping as the sign's dark halo)
  const boxOf = nr => { const w0 = nr.w / 0.86, h0 = nr.h / 0.64, x0 = nr.x - w0 * 0.07, y0 = nr.y - h0 * 0.18, k = w0 / (LOGO_W + 52); return { ox: x0 + 26 * k, oy: y0 + 30 * k, k }; };
  return {
    start(at) { cur = { at }; return true; },
    on: () => !!cur,
    stop() { cur = null; drop(); },
    setDpr(d) { dpr = d; band = null; },
    /** its smoke on the city's canvas (behind the sign) + the plane on the overlay (between the sign's layers) */
    draw(c, s) {
      const nr = s.textRects && s.textRects.neon;
      if (!cur || !nr) { if (fg) drop(); return; }
      const e = (s.now - cur.at) / 1000;
      if (e > BARN_LEN) { cur = null; drop(); return; }
      if (e < 0) return;
      const B = boxOf(nr), toS = (x, y) => [B.ox + x * B.k, B.oy + y * B.k], L = s.L;
      const day = clamp01(L.w.day + L.w.golden * 0.8 + L.w.dawn * 0.6) * (1 - clamp01(L.w.night + L.w.late)), night = clamp01(L.w.night + L.w.late);
      // THE SMOKE (by day): its past positions on the analytic path, a thin white line widening + fading (behind the sign)
      if (day > 0.2) {
        c.save(); c.lineCap = 'round';
        let prev = null;
        for (let k = 0; k < 40; k++) {
          const p = barnAt(e - 0.1 - k * 0.12); if (!p.on) { prev = null; continue; }
          const q = toS(p.x - Math.cos(p.ang) * 20, p.y - Math.sin(p.ang) * 20);
          if (prev) { c.strokeStyle = `rgba(250,250,252,${(0.55 * (1 - k / 40) * day).toFixed(3)})`; c.lineWidth = 1 + k * 0.12; c.beginPath(); c.moveTo(prev[0], prev[1]); c.lineTo(q[0], q[1]); c.stroke(); }
          prev = q;
        }
        c.restore();
      }
      // THE PLANE on the overlay, the strokes it's behind cut out of it
      const W = s.cam && s.cam.W ? s.cam.W : (typeof innerWidth !== 'undefined' ? innerWidth : 400);
      const d = ensure(W, nr), p = barnAt(e);
      fx.setTransform(1, 0, 0, 1, 0, 0); fx.clearRect(0, 0, fg.width, fg.height);
      if (!p.on) return;
      fx.setTransform(d, 0, 0, d, 0, -band.top * d);
      const [px, py] = toS(p.x, p.y), len = 40 * B.k;
      const nearSign = 1 - smooth(0, 60, Math.max(0, Math.abs(p.x - 166) - 166));
      fx.save(); fx.translate(px, py); fx.rotate(p.ang); fx.translate(-len * 0.5, 0);
      drawBiplane(fx, len, Math.max(0.2, day), night, performance.now() / 1000, night * nearSign * 0.8);
      fx.restore();
      fx.save(); fx.globalCompositeOperation = 'destination-out'; fx.translate(B.ox, B.oy); fx.scale(B.k, B.k);
      fx.lineCap = 'round'; fx.lineJoin = 'round'; fx.lineWidth = TUBE_CUT; fx.strokeStyle = '#000';
      for (const st of BEHIND) { fx.save(); fx.translate(st.x, 0); fx.stroke(new Path2D(st.d)); fx.restore(); }
      fx.restore();
    },
    /** the letters flicker a touch in its wake (at night, while the sign is lit): a level for the sign-dim hook, or null */
    wake(s) {
      if (!cur) return null;
      const e = (s.now - cur.at) / 1000, p = barnAt(e);
      if (!p.on || p.x < -10 || p.x > LOGO_W + 10) return null;
      return Math.sin(e * 37) > 0.6 ? 0.78 : null;
    },
    debug: () => (cur ? { at: cur.at, overlay: !!fg } : null),
    destroy() { cur = null; drop(); },
  };
}
