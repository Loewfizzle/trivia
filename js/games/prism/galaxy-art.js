// PRISM DROP — THE GALAXY SKIN's DRAWINGS (SKINS 2B — night; docs/prism.md "THE SKINS" → GALAXY; the owner's brief: docs/games/plan.md "SKINS 2B").
// COLOUR FIRST: a block is FILLED with the piece's own colour — a bright nebula swirl (2–3 soft cloud layers in the colour + a touch of a
// neighbouring hue), a softer bright core, a STRONG GLOWING RIM in the colour (each block pops off the board), 3–5 tiny star points inside
// (decoration only: they never dim the colour). It must NOT read as neon: neon = glowing OUTLINE tubes with DARK centres; galaxy = FILLED
// glowing CLOUDS. Six variants per colour (the clouds' places, the stars). Pre-drawn sprites (gradients + a baked glow at build time — nothing
// blurred in a frame). The pieces' colours are the JEWEL families (the contract's ±20°), lifted a touch so the fill reads bright on deep space.
//   galaxySprite(size, kind, t, v)   kind: block | grey (the danger drain) | ghost (a faint STARLIGHT outline) | glow (the rim's gentle
//                                    bloom, drawn 'lighter' under the stack) | incoming · ihot (dark ASTEROID ROCK with a faint red rim —
//                                    clearly not a piece) | fade (a cleared block going out: its light, no rim)
//   dustSprite(r, color) — a stardust grain · novaSprite(size) — the soft supernova flash · GALAXY · GALAXY_NEAR (the colours)
//   warmGalaxy · clearGalaxy · galaxyCount — the sprite cache (skin-kit.js#spriteCache)
import { rr, rgba, mix, mixA, spriteCache, seeded, newCanvas, INCOMING } from './skin-kit.js';

// 1 I cyan · 2 O yellow · 3 T violet · 4 S green · 5 Z red · 6 J blue · 7 L orange · 8 junk (grey)
export const GALAXY = [null, '#27dff2', '#ffcc33', '#b266ff', '#30e078', '#ff4a6e', '#4d88ff', '#ff9838', '#7c8498'];
// the touch of a NEIGHBOURING hue run into each cloud (inside the family's side of the wheel — a nebula is never one flat colour)
export const GALAXY_NEAR = [null, '#3f9bff', '#ff9a3c', '#ff5fd0', '#2fd6c8', '#ff5fb4', '#8f6bff', '#ffd03c', '#9aa6c4'];
export const VARIANTS = 6;
const WHITE = '#ffffff', BLACK = '#000000';
const greyOf = () => '#8088a0';

function cloud(x, cx, cy, r, col, a) {
  const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, rgba(col, a));
  g.addColorStop(0.55, rgba(col, a * 0.55));
  g.addColorStop(1, rgba(col, 0));
  x.fillStyle = g;
  x.fillRect(cx - r, cy - r, r * 2, r * 2);
}
const hexOf = c => { const m = /^rgb\((\d+),(\d+),(\d+)\)$/.exec(c); return m ? `#${[1, 2, 3].map(i => (+m[i]).toString(16).padStart(2, '0')).join('')}` : c; };

/** a block: the colour's fill → the clouds (a swirl along an arc) → the soft bright core → the stars → the strong glowing rim */
function block(size, col, near, v, o = {}) {
  const c = newCanvas(size), x = c.getContext('2d'), r = seeded(v * 97 + (o.seed || 0) * 13 + 3);
  const p = Math.max(1, size * 0.045), b = size - 2 * p, rad = size * 0.2, cx = size / 2, cy = size / 2;
  const dim = o.dim == null ? 1 : o.dim;
  // THE FILL: the piece's own colour, edge to edge (a shade deeper toward the corners — the cloud's body)
  rr(x, p, p, b, b, rad);
  const fg = x.createRadialGradient(cx, cy, size * 0.08, cx, cy, size * 0.74);
  fg.addColorStop(0, col);
  fg.addColorStop(0.55, mix(col, BLACK, 0.1));
  fg.addColorStop(1, mix(col, BLACK, 0.42));
  x.fillStyle = fg;
  x.fill();
  x.save();
  rr(x, p, p, b, b, rad);
  x.clip();
  // THE NEBULA: 2–3 soft cloud layers swirled round the middle — the colour lifted, the neighbouring hue run in, a deeper lane between them
  const a0 = r() * 6.28, turn = r() < 0.5 ? 1 : -1, layers = 2 + (r() < 0.6 ? 1 : 0);
  for (let k = 0; k < layers; k++) {
    const ang = a0 + turn * k * (1.9 + r() * 0.5), d = size * (0.2 + r() * 0.1);
    cloud(x, cx + Math.cos(ang) * d, cy + Math.sin(ang) * d, size * (0.34 + r() * 0.12), k === 1 ? near : hexOf(mix(col, WHITE, 0.22)), (k === 1 ? 0.6 : 0.7) * dim);
  }
  // (the lane: a deeper wisp across — depth, never a dark centre)
  const la = a0 + turn * 2.9;
  cloud(x, cx + Math.cos(la) * size * 0.3, cy + Math.sin(la) * size * 0.3, size * 0.26, hexOf(mix(col, BLACK, 0.6)), 0.42);
  // THE CORE: a softer bright heart, a little off-centre
  const kx = cx + (r() - 0.5) * size * 0.16, ky = cy + (r() - 0.5) * size * 0.16;
  cloud(x, kx, ky, size * 0.24, hexOf(mix(col, WHITE, 0.7)), 0.5 * dim);
  // THE STARS: 3–5 tiny points (one with a small cross) — decoration only
  if (!o.plain) {
    const n = 3 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const sx = p + size * 0.14 + r() * (b - size * 0.28), sy = p + size * 0.14 + r() * (b - size * 0.28), sr = Math.max(0.7, size * (0.016 + r() * 0.016));
      x.fillStyle = rgba(WHITE, 0.95);
      x.beginPath(); x.arc(sx, sy, sr, 0, 6.2832); x.fill();
      if (i === 0) { x.fillRect(sx - sr * 3.2, sy - sr * 0.3, sr * 6.4, sr * 0.6); x.fillRect(sx - sr * 0.3, sy - sr * 3.2, sr * 0.6, sr * 6.4); }
    }
  }
  // THE RIM, lit from inside: the colour's light falling inward from the edge (baked once)
  const tw = Math.max(1.5, size * 0.085);
  x.shadowColor = rgba(hexOf(mix(col, WHITE, 0.2)), 0.95 * dim);
  x.shadowBlur = size * 0.2;
  rr(x, p + tw * 0.5, p + tw * 0.5, b - tw, b - tw, Math.max(1, rad - tw * 0.5));
  x.lineWidth = tw;
  x.strokeStyle = rgba(hexOf(mix(col, WHITE, 0.3)), dim);
  x.stroke();
  x.restore();
  // the rim's hot line (near-white toward the upper left — the light's side)
  rr(x, p + tw * 0.5, p + tw * 0.5, b - tw, b - tw, Math.max(1, rad - tw * 0.5));
  const hg = x.createLinearGradient(p, p, p + b, p + b);
  hg.addColorStop(0, mixA(col, WHITE, 0.92, 0.95 * dim));
  hg.addColorStop(0.45, mixA(col, WHITE, 0.5, 0.75 * dim));
  hg.addColorStop(1, mixA(col, WHITE, 0.25, 0.6 * dim));
  x.lineWidth = Math.max(1, size * 0.03);
  x.strokeStyle = hg;
  x.stroke();
  return c;
}
/** the rim's gentle bloom: a soft ring of the colour's light round a cell (drawn 'lighter' under the stack — it shows in the gaps + round the
 *  stack's edge) */
function glow(size, col) {
  const n = Math.round(size * 2.2), c = newCanvas(n), x = c.getContext('2d');
  const o = (n - size) / 2, p = size * 0.08;
  x.shadowColor = rgba(col, 0.9);
  x.shadowBlur = size * 0.46;
  rr(x, o + p, o + p, size - 2 * p, size - 2 * p, size * 0.2);
  x.fillStyle = rgba(col, 0.34);
  x.fill();
  return c;
}
/** where the falling piece lands: a faint STARLIGHT outline (a thin pale line, two tiny stars on it) — no fill, no colour light */
function ghost(size, col) {
  const c = newCanvas(size), x = c.getContext('2d');
  const p = Math.max(1, size * 0.07), s = size - 2 * p;
  rr(x, p, p, s, s, size * 0.2);
  x.fillStyle = rgba(col, 0.07);
  x.fill();
  x.lineWidth = Math.max(1, size * 0.035);
  x.strokeStyle = mixA(col, WHITE, 0.7, 0.8);
  x.stroke();
  x.fillStyle = rgba(WHITE, 0.9);
  for (const [sx, sy] of [[p + s * 0.2, p], [p + s, p + s * 0.72]]) { const sr = Math.max(0.8, size * 0.028); x.beginPath(); x.arc(sx, sy, sr, 0, 6.2832); x.fill(); }
  return c;
}
/** an INCOMING row's cell: a dark ASTEROID — an uneven rock (never a rounded square), craters, a faint red rim (hot = due: the rim brighter) */
function rock(size, hot) {
  const c = newCanvas(size), x = c.getContext('2d'), r = seeded(hot ? 77 : 53);
  const cx = size / 2, cy = size / 2, n = 9, pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.2832 + 0.3, d = size * (0.4 + r() * 0.085);
    // (pushed out toward a square so the row still reads as a row of cells)
    const k = 1 / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a))), q = Math.min(d * (0.72 + 0.28 * k), size * 0.47);
    pts.push([cx + Math.cos(a) * q, cy + Math.sin(a) * q]);
  }
  const path = () => { x.beginPath(); pts.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py))); x.closePath(); };
  path();
  const g = x.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, hot ? '#4a4e5c' : '#3b3f4b'); g.addColorStop(1, '#161820');
  x.fillStyle = g;
  x.fill();
  x.save();
  x.clip();
  // craters: a dark pit with a lit lower lip
  for (let i = 0; i < 3; i++) {
    const kx = size * (0.26 + r() * 0.48), ky = size * (0.26 + r() * 0.48), kr = size * (0.05 + r() * 0.06);
    x.fillStyle = 'rgba(8,9,14,0.75)'; x.beginPath(); x.arc(kx, ky, kr, 0, 6.2832); x.fill();
    x.strokeStyle = 'rgba(150,156,176,0.4)'; x.lineWidth = Math.max(1, size * 0.018); x.beginPath(); x.arc(kx, ky + kr * 0.25, kr, 0.25, 2.9); x.stroke();
  }
  x.restore();
  // the faint red rim (it is a warning — but dim: a rock, not a tube)
  path();
  x.shadowColor = rgba(INCOMING, hot ? 0.9 : 0.5);
  x.shadowBlur = size * (hot ? 0.14 : 0.08);
  x.lineWidth = Math.max(1, size * (hot ? 0.045 : 0.035));
  x.strokeStyle = rgba(INCOMING, hot ? 0.95 : 0.62);
  x.stroke();
  return c;
}

const cache = spriteCache();
/** a GALAXY sprite at `size` device px (kind: block | grey | ghost | glow | incoming | ihot | fade; v = the variant 0–5) */
export function galaxySprite(size, kind, t, v = 0) {
  size = Math.max(4, Math.round(size));
  const key = `${size}|${kind}|${t}|${kind === 'block' ? v % VARIANTS : 0}`;
  return cache.get(key, () => {
    const col = GALAXY[t] || GALAXY[8], near = GALAXY_NEAR[t] || GALAXY_NEAR[8];
    if (kind === 'block') return t === 8 ? block(size, col, near, v, { seed: t, dim: 0.7, plain: true }) : block(size, col, near, v, { seed: t });
    if (kind === 'grey') return block(size, greyOf(col), '#9aa2b8', 0, { seed: t, dim: 0.55, plain: true });
    if (kind === 'glow') return glow(size, col);
    if (kind === 'incoming') return rock(size, false);
    if (kind === 'ihot') return rock(size, true);
    if (kind === 'fade') { const c = newCanvas(size), x = c.getContext('2d'); cloud(x, size / 2, size / 2, size * 0.62, hexOf(mix(col, WHITE, 0.45)), 0.95); return c; }
    return ghost(size, col);
  });
}
/** a stardust grain: a white-hot point in a small halo of its colour (drawn 'lighter') — r = its halo's radius in device px */
export function dustSprite(r, color) {
  r = Math.max(2, Math.round(r));
  return cache.get(`dust|${r}|${color}`, () => {
    const c = newCanvas(r * 2), x = c.getContext('2d');
    const g = x.createRadialGradient(r, r, 0, r, r, r);
    g.addColorStop(0, rgba(WHITE, 1));
    g.addColorStop(0.22, mixA(color, WHITE, 0.5, 0.95));
    g.addColorStop(0.55, rgba(color, 0.42));
    g.addColorStop(1, rgba(color, 0));
    x.fillStyle = g;
    x.fillRect(0, 0, r * 2, r * 2);
    return c;
  });
}
/** the soft supernova flash: white at the heart, a cool blue-violet falloff (drawn 'lighter', scaled) */
export function novaSprite(size) {
  size = Math.max(16, Math.round(size / 16) * 16);
  return cache.get(`nova|${size}`, () => {
    const c = newCanvas(size), x = c.getContext('2d'), h = size / 2;
    const g = x.createRadialGradient(h, h, 0, h, h, h);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.2, 'rgba(226,236,255,0.6)');
    g.addColorStop(0.5, 'rgba(150,170,255,0.2)');
    g.addColorStop(1, 'rgba(120,120,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, size, size);
    return c;
  });
}
/** every block of a size, drawn ahead in slices (≤ ms a slice) → true when done */
export function warmGalaxy(size, ms = 4) {
  const t0 = performance.now();
  for (let t = 1; t <= 8; t++) {
    for (let v = 0; v < VARIANTS; v++) { galaxySprite(size, 'block', t, v); if (performance.now() - t0 > ms) return false; }
    galaxySprite(size, 'glow', t);
    if (performance.now() - t0 > ms) return false;
  }
  return true;
}
export const clearGalaxy = () => cache.clear();
export const galaxyCount = () => cache.size;
