// PRISM DROP — THE DAY LOOK's DRAWINGS (PD-4 — THE CRAYON LOOK; docs/prism.md "THE CRAYON LOOK"). Every piece of crayon here is PRE-DRAWN ONCE
// into a cached sprite (at the board's full pixel ratio — 3× on an iPhone) — the frame loop only blits them; no stroke is drawn per frame.
//   THE BLOCK: a waxy crayon FILL (diagonal strokes pressed unevenly, the wax building up at the edges, the paper's TOOTH showing through where the
//   crayon skipped), a bold, slightly WOBBLY outline in a darker shade of the same crayon (TWO passes, like a real crayon), a small waxy highlight.
//   SIX variants a colour (the stroke angle, the wobble, the pressure) — the stack picks one by place, the falling piece by cell, so no two
//   neighbours look stamped and a block keeps its drawing while it falls. Junk = a graphite crayon, cross-hatched.
//   + the landing ghost (a light pencil outline), the danger drain (the same block in grey), the INCOMING rows' pencil sketch, the outline alone (the
//   landing's boing), the crumbs (crayon + eraser), the scribble (a zig-zag across a row), the 4-LINES star burst, the speed streak, the marks.
//   crayonSprite(size, kind, t, v) · crumbSprite(size, color, k) · scribbleSprite(w, h, color, level) · starSprite(size) · markSprite(size, kind)
//   warmCrayon(size, budgetMs) → true once every block is drawn (the view warms them in idle slices — a live look switch never hitches)
import { CRAYON, CRAYON_LINE, GRAPHITE, outlineOf } from './crayon.js';
import { mixHex } from './neon.js';

export const VARIANTS = 6;
const cache = new Map();

// ---- a small seeded random (each variant draws the same every time — a refresh, a resize, another phone)
function rng(seed) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
const canvas = (w, h = w) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

// ---- THE TOOTH: where a crayon skips the paper's valleys — two octaves of value noise, thresholded into soft holes (alpha = how much shows through)
const tooth = new Map();
const toothJobs = new Map();   // (PFIX-B — optional 17) a tile part-made in slices: key → { y, step }
function toothTile(n, seed, feature, cover) {
  const key = `${n}|${seed}|${feature.toFixed(2)}|${cover}`;
  const c = tooth.get(key);
  if (c) return c;
  toothStep(n, seed, feature, cover, Infinity);
  return tooth.get(key);
}
/** PFIX-B (FABLE REVIEW optional 17): make a tooth tile a few rows at a time (≤ budgetMs) — the view warms the day's tiles in idle slices after GO,
 *  so the first switch to day never computes the noise (it was ~370 ms of a 4×-throttled CPU in one frame). → true once the tile is made */
function toothStep(n, seed, feature, cover, budgetMs) {
  const key = `${n}|${seed}|${feature.toFixed(2)}|${cover}`;
  if (tooth.has(key)) return true;
  let job = toothJobs.get(key);
  if (!job) { job = toothJob(n, seed, feature, cover); toothJobs.set(key, job); }
  const t0 = performance.now();
  while (!job.done()) { job.row(); if (performance.now() - t0 > budgetMs) return false; }
  tooth.set(key, job.finish());
  toothJobs.delete(key);
  return true;
}
function toothJob(n, seed, feature, cover) {
  const c = canvas(n);
  const x = c.getContext('2d');
  const img = x.createImageData(n, n);
  const r = rng(seed * 31 + 7);
  const grid = (cell) => {
    const m = Math.ceil(n / cell) + 2, g = new Float32Array(m * m);
    for (let i = 0; i < g.length; i++) g[i] = r();
    return (px, py) => {
      const fx = px / cell, fy = py / cell, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
      const a = g[iy * m + ix], b = g[iy * m + ix + 1], d = g[(iy + 1) * m + ix], e = g[(iy + 1) * m + ix + 1];
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      return a + (b - a) * sx + (d - a) * sy + (a - b - d + e) * sx * sy;
    };
  };
  const f1 = grid(Math.max(1.2, feature)), f2 = grid(Math.max(2, feature * 2.6)), f3 = grid(Math.max(1, feature * 0.55));
  let y = 0;
  return {
    done: () => y >= n,
    row() {
      for (let x0 = 0; x0 < n; x0++) {
        const v = f1(x0, y) * 0.55 + f2(x0, y) * 0.3 + f3(x0, y) * 0.15;
        const k = Math.max(0, Math.min(1, (v - (1 - cover)) / 0.12));   // the higher the noise, the deeper the hole
        img.data[(y * n + x0) * 4 + 3] = Math.round(k * 255);
      }
      y++;
    },
    finish() { x.putImageData(img, 0, 0); return c; },
  };
}
/** PFIX-B (optional 17): the DAY's own tooth tiles a slice at a time — the lettering's mask, the page doodle's tile at this screen's ratio, SLAM's
 *  crayon streak at the board's cell (px: its canvas px) — true once all are made (the view then pre-draws the mask URL + the doodle — page.js#warm) */
export function warmTooth(budgetMs = 4, dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1), px = 0) {
  const t0 = performance.now();
  const tiles = [[128, 211, 1.3, 0.3], [192, 97, Math.max(1, dpr * 0.8), 0.32]];
  if (px) {
    const n = Math.max(8, Math.round(px * 0.9));   // (markSprite(px × 0.9, 'streak') — its canvas, its punch)
    tiles.push([Math.ceil(Math.max(Math.max(5, n * 0.3), n * 2)), 61, Math.max(1, n * 0.04), 0.32]);
    for (let level = 0; level <= 2; level++) tiles.push([SCRIBBLE_TILE, 37 + level, Math.max(1, px * 1.05 * 0.03), 0.3]);   // (crayonfx's scribble: h = px × 1.05)
    for (const big of [false, true]) { const m = Math.max(32, Math.round(W_CELLS * px * (big ? 1.25 : 1.1) * 0.55)); tiles.push([m, 51, Math.max(1, m * 0.006), 0.3]); }   // (the 4-LINES star)
  }
  for (const [n, seed, f, c] of tiles) if (!toothStep(n, seed, f, c, Math.max(0.5, budgetMs - (performance.now() - t0)))) return false;
  return true;
}
const W_CELLS = 10;      // (the well's width — engine.js W; kept here so this module stays the engine's leaf)
const SCRIBBLE_TILE = 256;
/** the tooth over a strip (a w × h sprite): a SCRIBBLE_TILE tile repeated — PFIX-B (optional 17): the scribble across a row is ~970 × 36 px; it
 *  punched a 970 × 970 tile (≈ 0.25 s of noise at 4× CPU on the first clear by day, ~3.7 MB of canvas a combo level) for the same grain */
function punchRepeat(x, w, h, seed, a, feature, cover) {
  const t = toothTile(SCRIBBLE_TILE, seed, feature, cover);
  x.save();
  x.globalCompositeOperation = 'destination-out';
  x.globalAlpha = a;
  x.fillStyle = x.createPattern(t, 'repeat');
  x.fillRect(0, 0, w, h);
  x.restore();
}
/** punch the tooth into whatever is on `x` (destination-out at strength a) */
function punch(x, size, seed, a, feature, cover) {
  const t = toothTile(Math.ceil(size), seed, feature, cover);
  x.save();
  x.globalCompositeOperation = 'destination-out';
  x.globalAlpha = a;
  x.drawImage(t, 0, 0);
  x.restore();
}

// ---- THE HAND: a wobbly rounded square (a hand-drawn cell) — each side a gentle curve with its corners pushed a little off true
function handSquare(x, p, b, r, rnd, wob) {
  const j = () => (rnd() - 0.5) * 2 * wob;
  const c = [[p + j(), p + j()], [p + b + j(), p + j()], [p + b + j(), p + b + j()], [p + j(), p + b + j()]];
  x.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = c[i], n = c[(i + 1) % 4], q = c[(i + 3) % 4];
    // the corner rounded: start r before the corner on the incoming side, end r after on the outgoing side
    const into = [a[0] + (q[0] - a[0]) * (r / b), a[1] + (q[1] - a[1]) * (r / b)];
    const out = [a[0] + (n[0] - a[0]) * (r / b), a[1] + (n[1] - a[1]) * (r / b)];
    if (i === 0) x.moveTo(into[0], into[1]);
    else x.lineTo(into[0], into[1]);
    x.quadraticCurveTo(a[0], a[1], out[0], out[1]);
    // the side: a slight belly (a hand never draws dead straight)
    const nIn = [n[0] + (a[0] - n[0]) * (r / b), n[1] + (a[1] - n[1]) * (r / b)];
    const mx = (out[0] + nIn[0]) / 2 + j() * 0.6, my = (out[1] + nIn[1]) / 2 + j() * 0.6;
    x.quadraticCurveTo(mx, my, nIn[0], nIn[1]);
  }
  x.closePath();
}

// ---- THE FILL: crayon strokes across the cell (pressed unevenly), the wax built up at the edges, the tooth
function crayonFill(x, size, col, rnd, v, { cross = false, base = 0.5 } = {}) {
  const S = size;
  x.fillStyle = rgba(col, base);
  x.fillRect(0, 0, S, S);
  const ang = (-38 + (v % 3) * 7 + (rnd() - 0.5) * 6) * Math.PI / 180;
  const dirs = cross ? [ang, ang + Math.PI / 2 + 0.2] : [ang, ang + 0.22];
  dirs.forEach((a, pass) => {
    const ca = Math.cos(a), sa = Math.sin(a);
    const step = S * (pass ? 0.11 : 0.06);
    const L = S * 1.6;
    for (let o = -S * 0.8; o < S * 0.8; o += step * (0.75 + rnd() * 0.5)) {
      const cx = S / 2 - sa * o, cy = S / 2 + ca * o;
      const bend = (rnd() - 0.5) * S * 0.12;
      x.beginPath();
      x.moveTo(cx - ca * L / 2, cy - sa * L / 2);
      x.quadraticCurveTo(cx - sa * bend, cy + ca * bend, cx + ca * L / 2, cy + sa * L / 2);
      x.lineWidth = S * (0.045 + rnd() * 0.035);
      const shade = rnd() < 0.3 ? mixHex(col, '#ffffff', 0.12) : rnd() < 0.5 ? mixHex(col, '#000000', 0.08) : col;
      x.strokeStyle = rgba(shade, (pass ? 0.38 : 0.66) + rnd() * 0.3);
      x.lineCap = 'round';
      x.stroke();
    }
  });
}

/** one crayon block: col = the crayon, line = its outline; v = the variant */
function blockArt(size, col, line, v, { junk = false, grey = false } = {}) {
  const S = size;
  const c = canvas(S);
  const x = c.getContext('2d');
  const rnd = rng(v * 977 + (parseInt(col.slice(1), 16) % 9973) + S);
  const p = Math.max(1, S * 0.05), b = S - 2 * p, r = S * 0.11, wob = S * 0.016;
  // the fill on its own layer: clipped to a slightly inset hand square, the tooth punched through
  const f = canvas(S);
  const fx = f.getContext('2d');
  handSquare(fx, p + S * 0.02, b - S * 0.04, r, rng(v * 13 + 5), wob);
  fx.save();
  fx.clip();
  crayonFill(fx, S, col, rnd, v, { cross: junk, base: junk ? 0.36 : 0.4 });
  // the wax builds up where the crayon turns at the edges (a darker band just inside the outline, heavier at the foot)
  fx.lineWidth = S * 0.16;
  fx.strokeStyle = rgba(mixHex(col, '#000000', 0.18), 0.32);
  fx.stroke();
  const g = fx.createLinearGradient(0, p, 0, p + b);
  g.addColorStop(0, rgba(mixHex(col, '#000000', 0.2), 0));
  g.addColorStop(1, rgba(mixHex(col, '#000000', 0.2), 0.22));
  fx.fillStyle = g;
  fx.fillRect(0, 0, S, S);
  fx.restore();
  punch(fx, S, v * 7 + 1, grey ? 0.5 : 0.62, Math.max(1.1, S * 0.022), 0.34);
  x.drawImage(f, 0, 0);
  // the outline: two passes of the darker crayon (the second a little off the first), its own tooth (a crayon line is never solid)
  const o = canvas(S);
  const ox = o.getContext('2d');
  ox.lineJoin = 'round';
  ox.lineCap = 'round';
  handSquare(ox, p + S * 0.035, b - S * 0.07, r, rng(v * 13 + 5), wob);
  ox.lineWidth = S * 0.085;
  ox.strokeStyle = rgba(line, 0.94);
  ox.stroke();
  handSquare(ox, p + S * 0.035 + (rnd() - 0.5) * S * 0.02, b - S * 0.07, r, rng(v * 29 + 11), wob * 1.3);
  ox.lineWidth = S * 0.05;
  ox.strokeStyle = rgba(mixHex(line, '#000000', 0.15), 0.7);
  ox.stroke();
  punch(ox, S, v * 7 + 3, 0.42, Math.max(1, S * 0.018), 0.3);
  x.drawImage(o, 0, 0);
  // the wax's sheen: a few short broken light strokes along the top-left, following the crayon's direction (never a glossy arc)
  if (!grey) {
    x.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const y0 = p + b * (0.2 + i * 0.07), x0 = p + b * (0.18 + rnd() * 0.06 + i * 0.03);
      x.beginPath();
      x.moveTo(x0, y0 + b * 0.05);
      x.lineTo(x0 + b * (0.16 + rnd() * 0.14 - i * 0.04), y0 - b * 0.05);
      x.lineWidth = S * (0.028 - i * 0.006);
      x.strokeStyle = `rgba(255,255,255,${(junk ? 0.16 : 0.34) - i * 0.08})`;
      x.stroke();
    }
  }
  return c;
}

/** the landing ghost: a light PENCIL outline (two thin sketchy passes) + the faintest wash of the piece's crayon */
function ghostArt(size, col) {
  const S = size, c = canvas(S), x = c.getContext('2d');
  const p = Math.max(1, S * 0.05), b = S - 2 * p, r = S * 0.11;
  handSquare(x, p + S * 0.04, b - S * 0.08, r, rng(41), S * 0.014);
  x.fillStyle = rgba(col, 0.1);
  x.fill();
  x.lineWidth = Math.max(1, S * 0.035);
  x.strokeStyle = rgba(GRAPHITE, 0.62);
  x.stroke();
  handSquare(x, p + S * 0.05, b - S * 0.1, r, rng(43), S * 0.02);
  x.lineWidth = Math.max(1, S * 0.022);
  x.strokeStyle = rgba(GRAPHITE, 0.4);
  x.stroke();
  punch(x, S, 17, 0.4, Math.max(1, S * 0.02), 0.3);
  return c;
}

/** the outline alone (the landing's BOING — the outline squashes + springs back over the block) */
function outlineArt(size, line) {
  const S = size, c = canvas(S), x = c.getContext('2d');
  const p = Math.max(1, S * 0.05), b = S - 2 * p;
  x.lineJoin = 'round';
  handSquare(x, p + S * 0.035, b - S * 0.07, S * 0.11, rng(61), S * 0.016);
  x.lineWidth = S * 0.075;
  x.strokeStyle = rgba(line, 0.9);
  x.stroke();
  punch(x, S, 23, 0.35, Math.max(1, S * 0.018), 0.3);
  return c;
}

/** an INCOMING row's cell: a grey PENCIL SKETCH — hatched both ways, a sketchy outline — never a crayon block */
function incomingArt(size, hot) {
  const S = size, c = canvas(S), x = c.getContext('2d');
  const p = Math.max(1, S * 0.06), b = S - 2 * p;
  const rnd = rng(hot ? 91 : 89);
  x.save();
  handSquare(x, p, b, S * 0.08, rng(71), S * 0.02);
  x.clip();
  x.fillStyle = rgba(GRAPHITE, hot ? 0.14 : 0.08);
  x.fillRect(0, 0, S, S);
  x.lineCap = 'round';
  for (const a of [-0.8, 0.8]) {
    const ca = Math.cos(a), sa = Math.sin(a);
    for (let o = -S; o < S; o += S * (a < 0 ? 0.16 : 0.24)) {
      x.beginPath();
      x.moveTo(S / 2 - sa * o - ca * S, S / 2 + ca * o - sa * S);
      x.lineTo(S / 2 - sa * o + ca * S, S / 2 + ca * o + sa * S);
      x.lineWidth = Math.max(1, S * (0.022 + rnd() * 0.014));
      x.strokeStyle = rgba(GRAPHITE, (hot ? 0.62 : 0.48) * (a < 0 ? 1 : 0.6));
      x.stroke();
    }
  }
  x.restore();
  handSquare(x, p, b, S * 0.08, rng(73), S * 0.022);
  x.lineWidth = Math.max(1, S * 0.04);
  x.strokeStyle = rgba(GRAPHITE, hot ? 0.9 : 0.72);
  x.stroke();
  handSquare(x, p + S * 0.02, b - S * 0.03, S * 0.08, rng(79), S * 0.03);
  x.lineWidth = Math.max(1, S * 0.022);
  x.strokeStyle = rgba(GRAPHITE, 0.45);
  x.stroke();
  punch(x, S, 29, 0.4, Math.max(1, S * 0.02), 0.32);
  return c;
}

const greyOf = h => { const n = parseInt(h.slice(1), 16); const l = Math.round(((n >> 16) * 0.3 + ((n >> 8) & 255) * 0.55 + (n & 255) * 0.15) * 0.72 + 40); const z = Math.max(0, Math.min(255, l)).toString(16).padStart(2, '0'); return `#${z}${z}${z}`; };

/**
 * a crayon sprite (cached): kind block | grey | ghost | outline | incoming | ihot; t = the piece (1–7, 8 junk); v = the variant (0–5)
 */
export function crayonSprite(size, kind, t, v = 0) {
  const key = `${size}|${kind}|${t}|${kind === 'block' ? v % VARIANTS : 0}`;
  let s = cache.get(key);
  if (s) return s;
  const col = CRAYON[t] || CRAYON[8];
  const line = CRAYON_LINE[t] || CRAYON_LINE[8];
  if (kind === 'block') s = blockArt(size, col, line, v % VARIANTS, { junk: t === 8 });
  else if (kind === 'grey') { const g = greyOf(col); s = blockArt(size, g, outlineOf(g), 1, { junk: true, grey: true }); }
  else if (kind === 'ghost') s = ghostArt(size, col);
  else if (kind === 'outline') s = outlineArt(size, line);
  else if (kind === 'incoming' || kind === 'ihot') s = incomingArt(size, kind === 'ihot');
  else s = blockArt(size, col, line, 0);
  cache.set(key, s);
  return s;
}

/** a crumb (a crayon bit — or an ERASER crumb: color 'eraser'): an irregular little lump, k = its shape (0–2) */
export function crumbSprite(size, color, k = 0) {
  const n = Math.max(4, Math.round(size));
  const key = `crumb|${n}|${color}|${k % 3}`;
  let s = cache.get(key);
  if (s) return s;
  s = canvas(n);
  const x = s.getContext('2d');
  const rnd = rng(k * 101 + n);
  const eraser = color === 'eraser';
  const col = eraser ? '#e9b8b4' : color;
  const pts = 6 + (k % 3);
  x.beginPath();
  for (let i = 0; i < pts; i++) {
    const a = (i / pts) * Math.PI * 2, rr = n * (eraser ? 0.3 : 0.26) * (0.7 + rnd() * 0.5);
    const px = n / 2 + Math.cos(a) * rr * (eraser ? 1.35 : 1), py = n / 2 + Math.sin(a) * rr * (eraser ? 0.75 : 1);
    if (i) x.lineTo(px, py); else x.moveTo(px, py);
  }
  x.closePath();
  x.fillStyle = col;
  x.fill();
  x.lineWidth = Math.max(1, n * 0.1);
  x.strokeStyle = eraser ? '#b98c8a' : outlineOf(col);
  x.stroke();
  punch(x, n, k + 3, 0.35, Math.max(1, n * 0.08), 0.3);
  cache.set(key, s);
  return s;
}

/**
 * THE SCRIBBLE: a fast zig-zag crayon stroke across a row (w × h device px) — level 0–2 = thicker + denser (combos build); colours cycle when
 * `color` is an array (a combo's colours). The view reveals it left → right (or right → left) by drawing a slice.
 */
export function scribbleSprite(w, h, color, level = 0) {
  const cols = Array.isArray(color) ? color : [color];
  const key = `scr|${Math.round(w)}|${Math.round(h)}|${cols.join(',')}|${level}`;
  let s = cache.get(key);
  if (s) return s;
  s = canvas(w, h);
  const x = s.getContext('2d');
  const rnd = rng(Math.round(w) + level * 17 + cols.length);
  x.lineCap = 'round';
  x.lineJoin = 'round';
  const passes = 1 + level;
  for (let p = 0; p < passes; p++) {
    const col = cols[p % cols.length];
    const step = h * (0.3 - level * 0.04);
    // a hand scribbling a row OUT: tight back-and-forth strokes, the turns uneven (the hand overshoots, sometimes doubles back), drifting a little
    x.beginPath();
    let up = p % 2 === 0;
    let px = -step * rnd();
    x.moveTo(px, h * (up ? 0.85 : 0.15));
    while (px < w + step) {
      px += step * (0.55 + rnd() * 0.9) * (rnd() < 0.12 ? -0.4 : 1);
      up = !up;
      x.lineTo(px, h * (up ? 0.9 - rnd() * 0.16 : 0.06 + rnd() * 0.16));
    }
    x.lineWidth = h * (0.17 + level * 0.04) * (p ? 0.8 : 1);
    x.strokeStyle = rgba(col, 0.86);
    x.stroke();
  }
  punchRepeat(x, s.width, s.height, 37 + level, 0.38, Math.max(1, h * 0.03), 0.3);
  cache.set(key, s);
  return s;
}

/** THE STAR BURST (4 LINES / a perfect clear): a big crayon-drawn star + rays + little stars, in yellow + orange crayon */
export function starSprite(size) {
  const n = Math.max(32, Math.round(size));
  const key = `star|${n}`;
  let s = cache.get(key);
  if (s) return s;
  s = canvas(n);
  const x = s.getContext('2d');
  const c = n / 2, rnd = rng(n);
  x.lineCap = 'round';
  x.lineJoin = 'round';
  // the rays: wobbly crayon strokes out from the middle
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + (rnd() - 0.5) * 0.12;
    const r0 = n * 0.2, r1 = n * (i % 2 ? 0.38 : 0.48);
    x.beginPath();
    x.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0);
    x.quadraticCurveTo(c + Math.cos(a + 0.06) * (r0 + r1) / 2, c + Math.sin(a + 0.06) * (r0 + r1) / 2, c + Math.cos(a) * r1, c + Math.sin(a) * r1);
    x.lineWidth = n * 0.026;
    x.strokeStyle = rgba(i % 2 ? '#f27822' : '#f4b81a', 0.95);
    x.stroke();
  }
  // the star: five points, filled with yellow crayon, a bold orange outline (two passes)
  const star = (rx, ry, R, rot) => {
    x.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = rot + (i / 10) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? R * 0.45 : R;
      const px = rx + Math.cos(a) * r + (rnd() - 0.5) * R * 0.04, py = ry + Math.sin(a) * r + (rnd() - 0.5) * R * 0.04;
      if (i) x.lineTo(px, py); else x.moveTo(px, py);
    }
    x.closePath();
  };
  star(c, c, n * 0.17, 0);
  x.fillStyle = rgba('#f4b81a', 0.88);
  x.fill();
  x.lineWidth = n * 0.016;
  x.strokeStyle = rgba(outlineOf('#f27822'), 0.95);
  x.stroke();
  star(c + n * 0.003, c - n * 0.003, n * 0.172, 0.02);
  x.lineWidth = n * 0.009;
  x.stroke();
  // the little stars round it
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.3, r = n * (0.32 + rnd() * 0.12);
    star(c + Math.cos(a) * r, c + Math.sin(a) * r, n * (0.025 + rnd() * 0.02), rnd());
    x.fillStyle = rgba(['#14b2c6', '#e2334f', '#8a4fd8', '#24a457'][i % 4], 0.9);
    x.fill();
    x.lineWidth = n * 0.006;
    x.strokeStyle = rgba('#3a3040', 0.7);
    x.stroke();
  }
  punch(x, n, 51, 0.4, Math.max(1, n * 0.006), 0.3);
  cache.set(key, s);
  return s;
}

/** the little marks: 'bounce' (two short curved lines — the boing's bounce), 'impact' (\ | / ticks — SLAM's landing), 'streak' (a speed line) */
export function markSprite(size, kind, color = GRAPHITE) {
  const n = Math.max(8, Math.round(size));
  const key = `mark|${n}|${kind}|${color}`;
  let s = cache.get(key);
  if (s) return s;
  if (kind === 'streak') {
    // a tall thin crayon streak, pressed hard at the foot + fading up (drawn stretched to the slam's length)
    s = canvas(Math.max(5, n * 0.3), n * 2);
    const x = s.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, s.height);
    g.addColorStop(0, rgba(color, 0));
    g.addColorStop(0.55, rgba(color, 0.45));
    g.addColorStop(1, rgba(color, 0.95));
    x.fillStyle = g;
    x.beginPath();
    x.moveTo(s.width * 0.45, 0);
    x.lineTo(s.width * 0.8, s.height);
    x.lineTo(s.width * 0.2, s.height);
    x.closePath();
    x.fill();
    punch(x, Math.max(s.width, s.height), 61, 0.4, Math.max(1, n * 0.04), 0.32);
    cache.set(key, s);
    return s;
  }
  s = canvas(n);
  const x = s.getContext('2d');
  x.lineCap = 'round';
  x.strokeStyle = rgba(color, 0.9);
  x.lineWidth = Math.max(2, n * 0.085);
  if (kind === 'bounce') {
    // two short arcs, like "((" — the piece just bounced
    for (let i = 0; i < 2; i++) {
      x.beginPath();
      x.arc(n * (0.75 + i * 0.22), n * 0.5, n * (0.28 + i * 0.12), Math.PI * 0.72, Math.PI * 1.28);
      x.stroke();
    }
  } else {
    // \ | / — three ticks fanning up from the landing
    for (const a of [-0.55, 0, 0.55]) {
      x.beginPath();
      x.moveTo(n / 2 + Math.sin(a) * n * 0.12, n * 0.9 - Math.cos(a) * n * 0.12);
      x.lineTo(n / 2 + Math.sin(a) * n * 0.46, n * 0.9 - Math.cos(a) * n * 0.46);
      x.stroke();
    }
  }
  cache.set(key, s);
  return s;
}

/** warm the blocks for a size in slices (≤ budgetMs a call): true once every colour × variant + the ghosts + the drain are drawn */
export function warmCrayon(size, budgetMs = 4) {
  const t0 = performance.now();
  for (let t = 1; t <= 8; t++) {
    for (let v = 0; v < VARIANTS; v++) {
      if (!cache.has(`${size}|block|${t}|${v}`)) { crayonSprite(size, 'block', t, v); if (performance.now() - t0 > budgetMs) return false; }
    }
    for (const k of ['ghost', 'grey', 'outline']) if (!cache.has(`${size}|${k}|${t}|0`)) { crayonSprite(size, k, t); if (performance.now() - t0 > budgetMs) return false; }
  }
  for (const k of ['incoming', 'ihot']) if (!cache.has(`${size}|${k}|0|0`)) crayonSprite(size, k, 0);
  return true;
}
export const clearCrayon = () => cache.clear();

/** the tooth as a CSS MASK (a data URL — opaque where the crayon stays, see-through where it skipped): the day look's crayon lettering */
let maskUrl = '';
export function toothMaskURL() {
  if (maskUrl) return maskUrl;
  const n = 128, c = canvas(n), x = c.getContext('2d');
  x.fillStyle = '#000';
  x.fillRect(0, 0, n, n);
  x.globalCompositeOperation = 'destination-out';
  x.globalAlpha = 0.7;
  x.drawImage(toothTile(n, 211, 1.3, 0.3), 0, 0);
  maskUrl = c.toDataURL('image/png');
  return maskUrl;
}

/** the tooth over a big surface (the page's doodle — a 192 px tile repeated): punch it into x's w × h at strength a */
export function punchTiled(x, w, h, a, feature = 1.4) {
  const t = toothTile(192, 97, feature, 0.32);
  x.save();
  x.globalCompositeOperation = 'destination-out';
  x.globalAlpha = a;
  x.fillStyle = x.createPattern(t, 'repeat');
  x.fillRect(0, 0, w, h);
  x.restore();
}
