// HIGH STAKES — the back room, in two Canvas 2D layers.
//   room (baked once per size): darkness, a wall of frosted glass with neon signs glowing through it, the table seen from
//        above — deep emerald felt with a woven texture and printed gold lines, a polished dark-wood rail catching the
//        lamp — and a vignette. The lamp's warm pool, its sway and the ALL IN dimming are compositor layers (css).
//   fx   (per frame, additive where it glows): haze drifting through the lamplight, chips flying in weighted arcs (bets
//        into the pot, winnings to the winners, losses to the house), the DOUBLE DOWN gold sweep, the winner's chip rain.
// Tiers 2/1/0 (DPR 2 / 1.5 / 1, haze count, chip shadows, rain size) come from the kit's frame pacing.
import { rngFrom } from '../../core/rng.js';

const TAU = Math.PI * 2;
export const CHIP = {                      // casino colours by value: body, rim inserts, inner
  1000: { body: '#d9a93a', edge: '#fff4d2', inner: '#f6d27a', ink: '#3a2606' },
  500: { body: '#6d1f3a', edge: '#f6e6c8', inner: '#8a2c4c', ink: '#ffe6ef' },
  100: { body: '#16161a', edge: '#f2c869', inner: '#26262c', ink: '#f2c869' },
  25: { body: '#0f6e48', edge: '#f4efe0', inner: '#138a5a', ink: '#effff6' },
  10: { body: '#e9e2cf', edge: '#1b6f8c', inner: '#f6f1e3', ink: '#1b4a5c' },
};
export const DENOMS = [1000, 500, 100, 25, 10];
const TIERS = [
  { dpr: 1, haze: 0, motes: 18, shadow: false, rain: 40 },
  { dpr: 1.5, haze: 2, motes: 42, shadow: true, rain: 70 },
  { dpr: 2, haze: 3, motes: 80, shadow: true, rain: 110 },
];

/** A chip seen from above, drawn into ctx at (x, y) with radius r. */
export function drawChip(x, cx, cy, r, value = 100) {
  const c = CHIP[value] || CHIP[100];
  x.save();
  x.translate(cx, cy);
  let g = x.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
  g.addColorStop(0, lighten(c.body, 0.28)); g.addColorStop(0.7, c.body); g.addColorStop(1, darken(c.body, 0.35));
  x.fillStyle = g; x.beginPath(); x.arc(0, 0, r, 0, TAU); x.fill();
  // rim inserts
  x.fillStyle = c.edge;
  for (let i = 0; i < 8; i++) {
    x.save(); x.rotate((TAU / 8) * i);
    x.beginPath(); x.rect(-r * 0.13, -r * 0.99, r * 0.26, r * 0.24); x.fill();
    x.restore();
  }
  // inner ring + inlay
  x.strokeStyle = c.edge; x.globalAlpha = 0.55; x.lineWidth = Math.max(0.6, r * 0.05); x.setLineDash([r * 0.12, r * 0.09]);
  x.beginPath(); x.arc(0, 0, r * 0.7, 0, TAU); x.stroke(); x.setLineDash([]); x.globalAlpha = 1;
  g = x.createRadialGradient(-r * 0.15, -r * 0.2, 0, 0, 0, r * 0.56);
  g.addColorStop(0, lighten(c.inner, 0.25)); g.addColorStop(1, c.inner);
  x.fillStyle = g; x.beginPath(); x.arc(0, 0, r * 0.56, 0, TAU); x.fill();
  if (r >= 14) {
    x.fillStyle = c.ink; x.font = `800 ${Math.round(r * 0.46)}px 'Chakra Petch', system-ui, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(value >= 1000 ? '1K' : String(value), 0, r * 0.03);
  }
  // shine
  x.globalCompositeOperation = 'lighter';
  g = x.createLinearGradient(-r, -r, r * 0.4, r * 0.4);
  g.addColorStop(0, 'rgba(255,255,255,0.22)'); g.addColorStop(0.45, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.beginPath(); x.arc(0, 0, r, 0, TAU); x.fill();
  x.restore();
}
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
const lighten = (h, k) => `rgb(${hexRgb(h).map(v => Math.round(v + (255 - v) * k)).join(',')})`;
const darken = (h, k) => `rgb(${hexRgb(h).map(v => Math.round(v * (1 - k))).join(',')})`;

/** The chips that make up an amount (largest first), at most `max` pieces. */
export function breakdown(amount, max = 40) {
  const out = [];
  let left = Math.max(0, Math.round(amount));
  for (const d of DENOMS) { while (left >= d && out.length < max) { out.push(d); left -= d; } }
  if (left > 0 && out.length < max) out.push(10);
  return out;
}

export function createRoom(roomCanvas, fxCanvas, { reduced = false } = {}) {
  const rx = roomCanvas.getContext('2d', { alpha: false });
  const fx = fxCanvas.getContext('2d');
  let W = 0, H = 0, dpr = 1, tier = 2;
  let layout = { table: { x: 0, y: 0, w: 0, h: 0 }, pot: { x: 0, y: 0 }, house: { x: 0, y: 0 } };
  const sprites = {};
  const flights = [];
  const motes = [];
  const rain = [];
  let raining = false;
  let shimmerAt = -1;
  let lastNow = 0;
  const R = rngFrom('hs-room');

  function sprite(value, r) {
    const k = `${value}:${r}`;
    if (sprites[k]) return sprites[k];
    const s = Math.ceil(r * 2 + 4);
    const c = document.createElement('canvas');
    c.width = c.height = Math.ceil(s * dpr);
    const x = c.getContext('2d');
    x.scale(dpr, dpr);
    drawChip(x, s / 2, s / 2, r, value);
    sprites[k] = { c, s };
    return sprites[k];
  }

  function resize(w, h) {
    const t = TIERS[tier];
    const nd = Math.min(t.dpr, window.devicePixelRatio || 1);
    if (Math.abs(w - W) < 1 && Math.abs(h - H) < 1 && nd === dpr) return;
    W = w; H = h; dpr = nd;
    for (const c of [roomCanvas, fxCanvas]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    rx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const k of Object.keys(sprites)) delete sprites[k];
    bake();
    seedMotes();
  }

  function setLayout(l) { layout = { ...layout, ...l }; bake(); }

  // ---------------------------------------------------------------- the room (baked)
  function bake() {
    if (!W || !H) return;
    const x = rx;
    const T = layout.table.w ? layout.table : { x: W * 0.04, y: H * 0.26, w: W * 0.92, h: H * 0.7 };
    x.fillStyle = '#040604'; x.fillRect(0, 0, W, H);
    drawWall(x, T);
    drawTable(x, T);
    // vignette
    const g = x.createRadialGradient(W / 2, T.y + T.h * 0.42, Math.min(W, H) * 0.2, W / 2, T.y + T.h * 0.42, Math.max(W, H) * 0.85);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.65, 'rgba(0,0,0,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0.82)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
  }

  // the back wall: frosted glass panes with neon behind them, above the table
  function drawWall(x, T) {
    const top = 0, bottom = Math.max(T.y + 30, H * 0.22);
    let g = x.createLinearGradient(0, top, 0, bottom);
    g.addColorStop(0, '#07090b'); g.addColorStop(1, '#0b0f0c');
    x.fillStyle = g; x.fillRect(0, top, W, bottom);
    // neon behind the glass: soft shapes drawn with wide glows (as if diffused by the frosting)
    const signs = [
      { kind: 'martini', cx: W * 0.16, cy: bottom * 0.42, s: Math.min(70, W * 0.11), c: '#ff5fb8' },
      { kind: 'spade', cx: W * 0.5, cy: bottom * 0.36, s: Math.min(60, W * 0.09), c: '#46e0c0' },
      { kind: 'diamond', cx: W * 0.84, cy: bottom * 0.44, s: Math.min(62, W * 0.1), c: '#f6c85a' },
      { kind: 'bar', cx: W * 0.5, cy: bottom * 0.8, s: W * 0.7, c: '#a874ff' },
    ];
    x.save();
    x.globalCompositeOperation = 'lighter';
    for (const s of signs) neon(x, s);
    x.restore();
    // frosting: grain + a milky haze, panes and brass mullions
    x.save();
    g = x.createLinearGradient(0, top, 0, bottom);
    g.addColorStop(0, 'rgba(180,200,190,0.05)'); g.addColorStop(1, 'rgba(160,190,170,0.09)');
    x.fillStyle = g; x.fillRect(0, top, W, bottom);
    x.globalAlpha = 0.06;
    for (let i = 0; i < W * bottom / 90; i++) { x.fillStyle = R() < 0.5 ? '#fff' : '#000'; x.fillRect(R() * W, R() * bottom, 1, 1); }
    x.globalAlpha = 1;
    const panes = Math.max(3, Math.round(W / 220));
    for (let i = 1; i < panes; i++) {
      const px = (W / panes) * i;
      g = x.createLinearGradient(px - 3, 0, px + 3, 0);
      g.addColorStop(0, '#2a1d0c'); g.addColorStop(0.5, '#8a6a32'); g.addColorStop(1, '#2a1d0c');
      x.fillStyle = g; x.fillRect(px - 2.5, top, 5, bottom);
    }
    g = x.createLinearGradient(0, bottom - 6, 0, bottom + 2);
    g.addColorStop(0, '#a8823e'); g.addColorStop(1, '#1e1408');
    x.fillStyle = g; x.fillRect(0, bottom - 5, W, 6);
    x.restore();
    // the wall below the glass fades into the dark room
    g = x.createLinearGradient(0, bottom, 0, H);
    g.addColorStop(0, '#0a0d0a'); g.addColorStop(1, '#030403');
    x.fillStyle = g; x.fillRect(0, bottom, W, H - bottom);
  }

  function neon(x, s) {
    x.save();
    x.translate(s.cx, s.cy);
    x.strokeStyle = s.c; x.lineCap = 'round'; x.lineJoin = 'round';
    const path = () => {
      x.beginPath();
      const k = s.s;
      if (s.kind === 'martini') { x.moveTo(-k * 0.5, -k * 0.4); x.lineTo(k * 0.5, -k * 0.4); x.lineTo(0, k * 0.15); x.closePath(); x.moveTo(0, k * 0.15); x.lineTo(0, k * 0.55); x.moveTo(-k * 0.22, k * 0.55); x.lineTo(k * 0.22, k * 0.55); x.moveTo(k * 0.15, -k * 0.55); x.lineTo(-k * 0.05, -k * 0.2); }
      if (s.kind === 'spade') { x.moveTo(0, -k * 0.5); x.bezierCurveTo(k * 0.55, -k * 0.05, k * 0.45, k * 0.38, 0, k * 0.2); x.bezierCurveTo(-k * 0.45, k * 0.38, -k * 0.55, -k * 0.05, 0, -k * 0.5); x.moveTo(0, k * 0.15); x.lineTo(-k * 0.15, k * 0.5); x.lineTo(k * 0.15, k * 0.5); x.closePath(); }
      if (s.kind === 'diamond') { x.moveTo(0, -k * 0.5); x.lineTo(k * 0.36, 0); x.lineTo(0, k * 0.5); x.lineTo(-k * 0.36, 0); x.closePath(); }
      if (s.kind === 'bar') { x.moveTo(-k * 0.5, 0); x.lineTo(k * 0.5, 0); }
    };
    for (const [w, a, blur] of [[16, 0.08, 40], [8, 0.16, 22], [3.5, 0.5, 10], [1.6, 0.9, 0]]) {
      x.lineWidth = w; x.globalAlpha = a; x.shadowColor = s.c; x.shadowBlur = blur;
      path(); x.stroke();
    }
    x.restore();
  }

  function tableShape(x, T, inset = 0) {
    const r = Math.min(T.h * 0.42, T.w * 0.34) - inset;
    const l = T.x + inset, t = T.y + inset, w = T.w - inset * 2, h = T.h - inset * 2;
    x.beginPath();
    x.moveTo(l + r, t);
    x.lineTo(l + w - r, t);
    x.quadraticCurveTo(l + w, t, l + w, t + r);
    x.lineTo(l + w, t + h - r * 1.2);
    x.quadraticCurveTo(l + w, t + h, l + w - r * 1.3, t + h);
    x.lineTo(l + r * 1.3, t + h);
    x.quadraticCurveTo(l, t + h, l, t + h - r * 1.2);
    x.lineTo(l, t + r);
    x.quadraticCurveTo(l, t, l + r, t);
    x.closePath();
  }

  function drawTable(x, T) {
    const rail = Math.max(14, Math.min(26, T.w * 0.035));
    // shadow under the table
    x.save(); x.shadowColor = 'rgba(0,0,0,0.85)'; x.shadowBlur = 40; x.shadowOffsetY = 14; x.fillStyle = '#000'; tableShape(x, T); x.fill(); x.restore();
    // the rail: dark polished wood with grain, lit from the lamp above the middle
    let g = x.createLinearGradient(0, T.y, 0, T.y + T.h);
    g.addColorStop(0, '#3a1c0c'); g.addColorStop(0.5, '#24100a'); g.addColorStop(1, '#130805');
    x.fillStyle = g; tableShape(x, T); x.fill();
    x.save(); tableShape(x, T); x.clip();
    x.globalAlpha = 0.22;
    for (let i = 0; i < 90; i++) { x.strokeStyle = R() < 0.5 ? '#5a2c14' : '#0c0402'; x.lineWidth = 0.6 + R(); const y = T.y + R() * T.h; x.beginPath(); x.moveTo(T.x, y); x.bezierCurveTo(T.x + T.w * 0.3, y + (R() - 0.5) * 8, T.x + T.w * 0.7, y + (R() - 0.5) * 8, T.x + T.w, y); x.stroke(); }
    x.globalAlpha = 1;
    // the lamp's highlight sweeping along the polished wood
    g = x.createRadialGradient(W / 2, T.y + T.h * 0.42, 0, W / 2, T.y + T.h * 0.42, Math.max(T.w, T.h) * 0.62);
    g.addColorStop(0, 'rgba(255,190,110,0.32)'); g.addColorStop(1, 'rgba(255,190,110,0)');
    x.globalCompositeOperation = 'lighter'; x.fillStyle = g; x.fillRect(T.x, T.y, T.w, T.h);
    x.restore();
    // rail edges: a bright bevel on the outer lip, a dark groove on the inner one
    x.save(); x.lineWidth = 1.4; x.strokeStyle = 'rgba(255,200,140,0.28)'; tableShape(x, T, 1); x.stroke();
    x.strokeStyle = 'rgba(0,0,0,0.75)'; x.lineWidth = 3; tableShape(x, T, rail); x.stroke(); x.restore();
    // the felt
    const F = { x: T.x + rail, y: T.y + rail, w: T.w - rail * 2, h: T.h - rail * 2 };
    g = x.createRadialGradient(W / 2, F.y + F.h * 0.4, 10, W / 2, F.y + F.h * 0.45, Math.max(F.w, F.h) * 0.75);
    g.addColorStop(0, '#0f6a44'); g.addColorStop(0.45, '#0a4a30'); g.addColorStop(1, '#03180f');
    x.save(); tableShape(x, T, rail); x.clip();
    x.fillStyle = g; x.fillRect(F.x, F.y, F.w, F.h);
    // fabric: fine grain and a soft weave
    x.globalAlpha = 0.08;
    for (let i = 0; i < F.w * F.h / 40; i++) { x.fillStyle = R() < 0.5 ? '#9affc8' : '#000'; x.fillRect(F.x + R() * F.w, F.y + R() * F.h, 1, 1); }
    x.globalAlpha = 0.035; x.strokeStyle = '#bfffe0'; x.lineWidth = 0.5;
    for (let d = -F.h; d < F.w; d += 3) { x.beginPath(); x.moveTo(F.x + d, F.y); x.lineTo(F.x + d + F.h, F.y + F.h); x.stroke(); }
    x.globalAlpha = 1;
    // printed gold: the betting line, the pot ring, the house's words along an arc
    x.strokeStyle = 'rgba(242,200,105,0.32)'; x.lineWidth = 1.2;
    tableShape(x, T, rail + Math.max(12, F.w * 0.035)); x.stroke();
    const P = layout.pot.x ? layout.pot : { x: W / 2, y: F.y + F.h * 0.42 };
    const pr = Math.min(F.w, F.h) * 0.16;
    x.strokeStyle = 'rgba(242,200,105,0.38)'; x.lineWidth = 1.4; x.beginPath(); x.arc(P.x, P.y, pr, 0, TAU); x.stroke();
    x.strokeStyle = 'rgba(242,200,105,0.18)'; x.beginPath(); x.arc(P.x, P.y, pr + 5, 0, TAU); x.stroke();
    arcText(x, 'HARD PAYS TWO TO ONE  ·  DOUBLE DOWN PAYS DOUBLE', P.x, P.y, pr + 22, Math.PI * 0.5, 'rgba(242,200,105,0.42)', Math.max(8, Math.min(11, F.w * 0.022)));
    x.restore();
  }

  function arcText(x, text, cx, cy, r, mid, color, size, flip = false) {
    x.save();
    x.fillStyle = color; x.font = `700 ${size}px 'Chakra Petch', system-ui, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
    const chars = [...text];
    const step = (size * 0.78) / r;
    const total = step * (chars.length - 1);
    chars.forEach((ch, i) => {
      const a = flip ? mid - total / 2 + i * step : mid + total / 2 - i * step;
      x.save();
      x.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      x.rotate(flip ? a + Math.PI / 2 : a - Math.PI / 2);
      x.fillText(ch, 0, 0);
      x.restore();
    });
    x.restore();
  }

  // ---------------------------------------------------------------- the live layer
  function seedMotes() {
    motes.length = 0;
    const n = reduced ? 0 : TIERS[tier].motes;
    for (let i = 0; i < n; i++) motes.push({ x: R(), y: R(), z: 0.3 + R() * 0.7, vx: (R() - 0.5) * 0.004, vy: -0.002 - R() * 0.004, ph: R() * TAU });
  }

  /** Chips flying from a to b. kind: 'bet' (into the pot) | 'win' (to a winner) | 'lose' (to the house). */
  function chips(a, b, amount, { kind = 'bet', delay = 0, max = 12 } = {}) {
    if (!a || !b) return 0;
    const list = breakdown(amount, max);
    const now = performance.now();
    const r = Math.max(9, Math.min(15, W * 0.03));
    list.forEach((v, i) => {
      const lift = kind === 'lose' ? 0.18 : 0.35 + R() * 0.15;
      flights.push({
        v, r, x0: a.x + (R() - 0.5) * 14, y0: a.y + (R() - 0.5) * 10, x1: b.x + (R() - 0.5) * 18, y1: b.y + (R() - 0.5) * 12,
        t0: now + delay + i * (kind === 'bet' ? 45 : 70), dur: kind === 'lose' ? 620 : 780 + R() * 160, lift, spin: R() * TAU, kind,
      });
    });
    if (flights.length > 140) flights.splice(0, flights.length - 140);
    return list.length;
  }

  function shimmer() { shimmerAt = performance.now(); }
  function setRain(on) {
    raining = !!on && !reduced;
    if (!raining) rain.length = 0;
  }

  function frame(now) {
    const t0 = performance.now();
    const dt = Math.min(0.05, (now - (lastNow || now)) / 1000);
    lastNow = now;
    fx.clearRect(0, 0, W, H);
    const T = layout.table;
    const P = layout.pot.x ? layout.pot : { x: W / 2, y: H * 0.5 };
    // haze sheets drifting through the lamplight
    const tt = TIERS[tier];
    if (!reduced && tt.haze) {
      fx.save(); fx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < tt.haze; i++) {
        const k = now / 1000 * (0.03 + i * 0.012) + i * 2.1;
        const hx = P.x + Math.sin(k) * W * 0.18, hy = P.y - T.h * 0.12 + Math.cos(k * 0.8) * T.h * 0.08;
        const rr = Math.max(W, H) * (0.28 + i * 0.06);
        const g = fx.createRadialGradient(hx, hy, 0, hx, hy, rr);
        g.addColorStop(0, 'rgba(255,214,150,0.045)'); g.addColorStop(1, 'rgba(255,214,150,0)');
        fx.fillStyle = g; fx.fillRect(hx - rr, hy - rr, rr * 2, rr * 2);
      }
      fx.restore();
    }
    // motes catching the light (brighter inside the lamp's pool)
    if (motes.length) {
      fx.save(); fx.globalCompositeOperation = 'lighter';
      for (const m of motes) {
        m.x += m.vx * dt * 10 * m.z; m.y += m.vy * dt * 10 * m.z;
        if (m.y < -0.02) { m.y = 1.02; m.x = R(); }
        if (m.x < -0.02) m.x = 1.02; if (m.x > 1.02) m.x = -0.02;
        const px = m.x * W, py = m.y * H;
        const d = Math.hypot(px - P.x, (py - P.y) * 1.4) / (Math.max(W, H) * 0.45);
        const a = Math.max(0, 1 - d) * (0.25 + 0.2 * Math.sin(now / 900 + m.ph)) * m.z;
        if (a < 0.02) continue;
        fx.fillStyle = `rgba(255,226,170,${a.toFixed(3)})`;
        fx.beginPath(); fx.arc(px, py, 0.7 + m.z * 1.3, 0, TAU); fx.fill();
      }
      fx.restore();
    }
    // the DOUBLE DOWN gold sweep across the felt
    if (shimmerAt >= 0) {
      const k = (now - shimmerAt) / 1300;
      if (k > 1) shimmerAt = -1;
      else if (k > 0) {
        fx.save(); fx.globalCompositeOperation = 'lighter';
        const sx = T.x - T.w * 0.4 + (T.w * 1.8) * k;
        const g = fx.createLinearGradient(sx - 120, 0, sx + 120, 0);
        g.addColorStop(0, 'rgba(255,214,120,0)'); g.addColorStop(0.5, `rgba(255,220,140,${(0.32 * Math.sin(Math.PI * k)).toFixed(3)})`); g.addColorStop(1, 'rgba(255,214,120,0)');
        fx.fillStyle = g; fx.fillRect(T.x, T.y, T.w, T.h);
        fx.restore();
      }
    }
    // chips in the air
    for (let i = flights.length - 1; i >= 0; i--) {
      const f = flights[i];
      const k = (now - f.t0) / f.dur;
      if (k < 0) continue;
      if (k >= 1) { flights.splice(i, 1); continue; }
      const e = f.kind === 'lose' ? k * k : 1 - Math.pow(1 - k, 3);
      const x = f.x0 + (f.x1 - f.x0) * e;
      const arc = Math.sin(Math.PI * Math.min(1, k * 1.05)) * Math.hypot(f.x1 - f.x0, f.y1 - f.y0) * f.lift;
      const y = f.y0 + (f.y1 - f.y0) * e - arc;
      const s = sprite(f.v, f.r);
      const flip = Math.abs(Math.cos(f.spin + k * 6));       // the chip turning over in the air
      const scale = 1 + Math.sin(Math.PI * k) * 0.25;
      if (TIERS[tier].shadow) {
        fx.fillStyle = 'rgba(0,0,0,0.28)';
        fx.beginPath(); fx.ellipse(x + 4 + arc * 0.08, y + 6 + arc * 0.25, f.r * scale, f.r * scale * 0.55, 0, 0, TAU); fx.fill();
      }
      fx.save(); fx.translate(x, y); fx.scale(scale, scale * Math.max(0.22, flip));
      fx.globalAlpha = f.kind === 'lose' ? Math.min(1, 1.6 - k) : 1;
      fx.drawImage(s.c, -s.s / 2, -s.s / 2, s.s, s.s);
      fx.restore();
    }
    // the winner's chips falling slowly through the lamplight
    if (raining) {
      if (rain.length < TIERS[tier].rain) rain.push({ v: [1000, 500, 100, 25][Math.floor(R() * 4)], x: R() * W, y: -30 - R() * H * 0.3, vy: 26 + R() * 34, vx: (R() - 0.5) * 14, sp: R() * TAU, vs: 0.6 + R() * 1.4, r: 9 + R() * 8 });
      for (let i = rain.length - 1; i >= 0; i--) {
        const c = rain[i];
        c.y += c.vy * dt; c.x += c.vx * dt; c.sp += c.vs * dt;
        if (c.y > H + 40) { rain.splice(i, 1); continue; }
        const s = sprite(c.v, Math.round(c.r));
        const d = Math.hypot(c.x - P.x, c.y - P.y) / Math.max(W, H);
        fx.save(); fx.translate(c.x, c.y); fx.rotate(c.sp * 0.3); fx.scale(1, Math.max(0.15, Math.abs(Math.cos(c.sp))));
        fx.globalAlpha = Math.max(0.35, 1 - d * 1.3);
        fx.drawImage(s.c, -s.s / 2, -s.s / 2, s.s, s.s);
        fx.restore();
      }
    }
    return performance.now() - t0;
  }

  return {
    resize, setLayout, chips, shimmer, setRain, frame,
    setTier(t) { if (t === tier) return; tier = Math.max(0, Math.min(2, t)); const w = W, h = H; W = 0; resize(w, h); },
    tier: () => tier,
    busy: () => flights.length > 0,
    stats: () => ({ flights: flights.length, motes: motes.length, rain: rain.length, tier, W, H, dpr }),
    destroy() { roomCanvas.width = roomCanvas.height = 0; fxCanvas.width = fxCanvas.height = 0; flights.length = 0; rain.length = 0; },
  };
}
