// PRISM DROP — THE WATERCOLOR SKIN's DRAWINGS (SKINS 1 — the owner's spec: docs/games/plan.md "SKINS 1 — WATERCOLOR"; docs/prism.md "THE SKINS").
// Every piece of paint is PRE-DRAWN ONCE into a cached sprite at the board's full pixel ratio (3× on an iPhone) — the frame loop only blits.
//   THE BLOCK: 3–4 TRANSLUCENT layers of the piece's colour on a wobbly SOFT-CORNERED SQUARE (a squircle — hand-painted, never a perfect rect,
//   never a round blob), each layer a little off the last so the paint is thin at the edges and deep where they overlap; a darker PIGMENT RIM
//   where the paint pooled as it dried (the colour's own darker shade), the paper's tooth showing through (granulation), a soft white highlight
//   top-left. SIX variants a colour (the wobble, the layers' drift, where the pigment gathered). The paper shows THROUGH the paint — the sprite
//   keeps its translucency. Junk = a neutral grey wash.
//   + the landing ghost (a faint pencil outline), the danger drain (the block in grey), the INCOMING rows' grey wash with a darker pigment edge,
//   the wet sheen (a lock), the drip (a clear's run), the droplet (a splash, a cancel), the bloom (4 LINES — a wet wash spreading behind the stack).
//   waterSprite(size, kind, t, v) · dripSprite(w, color) · dropSprite(size, color) · bloomSprite(size, colors) · warmWater(size, ms) · clearWater()
import { mixHex } from './neon.js';
import { seeded, spriteCache, newCanvas, rgba } from './skin-kit.js';

export const VARIANTS = 6;
// the paints: 1 long (turquoise) · 2 square (yellow) · 3 twist (violet) · 4 S (green) · 5 Z (red) · 6 J (blue) · 7 L (orange) · 8 junk (a neutral grey)
// — the SAME colour families as every skin (tests/prism-skins.test.mjs: the hue within its JEWEL family)
export const WATER = Object.freeze([null, '#19b3c8', '#f2b61e', '#8f5bd9', '#2faa5e', '#e23f5a', '#3a6fd8', '#f2812a', '#878b95']);
const DEEP = '#1c1638';
/** where the pigment pooled: the paint's own darker shade */
export const rimOf = hex => mixHex(hex, DEEP, 0.46);
export const WATER_RIM = Object.freeze(WATER.map(c => (c ? rimOf(c) : c)));
export const PENCIL = '#5b6272';   // the ghost's outline, the grid, the warning marks
export const WASH = '#8d919b';     // the incoming rows' grey wash

const cache = spriteCache();

/** a wobbly soft-cornered SQUARE (a squircle with a hand's wobble) as a closed smooth path: centre, half-size, wobble (a share of half) */
function squircle(x, cx, cy, half, rnd, wob = 0.03, e = 5.2) {
  const n = 36, ph = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28], pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    const k = Math.pow(Math.pow(Math.abs(c), e) + Math.pow(Math.abs(s), e), -1 / e);
    const w = 1 + wob * (Math.sin(a * 2 + ph[0]) * 0.5 + Math.sin(a * 3 + ph[1]) * 0.35 + Math.sin(a * 5 + ph[2]) * 0.25);
    pts.push([cx + c * half * k * w, cy + s * half * k * w]);
  }
  x.beginPath();
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const m0 = mid(pts[n - 1], pts[0]);
  x.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) { const m = mid(pts[i], pts[(i + 1) % n]); x.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); }
  x.closePath();
}

// ---- the paper's TOOTH through the paint (granulation): a small tile of soft speckle, punched out of a sprite at low strength
let grainC = null;
function grainTile() {
  if (grainC) return grainC;
  const n = 96, r = seeded(4177);
  grainC = newCanvas(n);
  const x = grainC.getContext('2d'), img = x.createImageData(n, n), d = img.data;
  // two octaves of value noise → soft pits (alpha = how much paint the paper's valleys didn't take)
  const grid = cell => { const m = Math.ceil(n / cell) + 2, g = new Float32Array(m * m); for (let i = 0; i < g.length; i++) g[i] = r(); return (px, py) => { const fx = px / cell, fy = py / cell, ix = fx | 0, iy = fy | 0, tx = fx - ix, ty = fy - iy, a = g[iy * m + ix], b = g[iy * m + ix + 1], c = g[(iy + 1) * m + ix], e = g[(iy + 1) * m + ix + 1], sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty); return a + (b - a) * sx + (c - a) * sy + (a - b - c + e) * sx * sy; }; };
  const g1 = grid(3.2), g2 = grid(9);
  for (let y = 0; y < n; y++) for (let xx = 0; xx < n; xx++) {
    const v = g1(xx, y) * 0.65 + g2(xx, y) * 0.35;
    const a = Math.max(0, v - 0.52) / 0.48;
    d[(y * n + xx) * 4 + 3] = Math.round(255 * a * a);
  }
  x.putImageData(img, 0, 0);
  return grainC;
}
function punchGrain(x, size, strength, seed) {
  const g = grainTile();
  x.save();
  x.globalCompositeOperation = 'destination-out';
  x.globalAlpha = strength;
  const k = Math.max(1, size / 60);   // (the speckle keeps its size on the page, whatever the cell)
  const ox = (seed * 37) % g.width, oy = (seed * 53) % g.height;
  x.setTransform(k, 0, 0, k, -ox * k, -oy * k);
  x.fillStyle = x.createPattern(g, 'repeat');
  x.fillRect(ox, oy, size / k + 1, size / k + 1);
  x.restore();
}

/** THE BLOCK: the washes, the pigment rim, the tooth, the highlight. o: { junk, grey, thin (the incoming rows' flat wash), hot } */
function blockArt(size, col, rim, v, o = {}) {
  const c = newCanvas(size), x = c.getContext('2d');
  const rnd = seeded(v * 7919 + 13 + (o.junk ? 71 : 0) + Math.round(parseInt(col.slice(1), 16) % 997));
  const cx = size / 2, cy = size / 2, half = size * 0.468;
  const layers = o.thin ? 2 : 4;
  // the washes: each a little off the last + a little smaller — thin at the edge (one layer: the paper shows through), deep where they overlap;
  // their own edges stay visible inside the block, the way a second pass of paint dries over the first
  for (let i = 0; i < layers; i++) {
    const dx = (rnd() - 0.5) * size * 0.05, dy = (rnd() - 0.5) * size * 0.05;
    const h = half * (1 - i * 0.035 - rnd() * 0.02);
    squircle(x, cx + dx, cy + dy, h, rnd, 0.026 + rnd() * 0.016, 6.6);
    const shade = i === 0 ? mixHex(col, '#ffffff', 0.14) : i === layers - 1 ? mixHex(col, rim, 0.1) : col;
    x.fillStyle = rgba(shade, o.thin ? 0.3 : i === 0 ? 0.5 : 0.36);
    x.fill();
    // each pass dries with a faint edge of its own
    if (!o.thin && i > 0) { x.lineWidth = Math.max(1, size * 0.012); x.strokeStyle = rgba(rim, 0.16); x.stroke(); }
  }
  x.globalCompositeOperation = 'source-atop';
  // granulation: the pigment settled unevenly — a few soft darker patches + lighter back-runs (flat paint, never a shaded ball)
  for (let i = 0; i < 5; i++) {
    const px = size * (0.15 + rnd() * 0.7), py = size * (0.15 + rnd() * 0.7), rr = size * (0.14 + rnd() * 0.16), dark = i % 2 === 0;
    const g = x.createRadialGradient(px, py, 0, px, py, rr);
    g.addColorStop(0, dark ? rgba(rim, o.thin ? 0.08 : 0.17) : `rgba(255,255,255,${o.thin ? 0.08 : 0.15})`);
    g.addColorStop(1, dark ? rgba(rim, 0) : 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.fillRect(px - rr, py - rr, rr * 2, rr * 2);
  }
  // THE PIGMENT RIM: the paint pooled at its edge as it dried — a narrow soft band just inside the outline…
  const er = seeded(v * 131 + 5);
  squircle(x, cx, cy, half * 0.99, er, 0.03, 6.6);
  x.lineWidth = size * 0.085;
  x.strokeStyle = rgba(rim, o.thin ? 0.2 : 0.24);
  x.stroke();
  x.lineWidth = size * 0.04;
  x.strokeStyle = rgba(rim, o.thin ? 0.3 : 0.4);
  x.stroke();
  // …and its crisp hard edge, uneven like a real one (the paint dried harder in places)
  x.lineWidth = Math.max(1, size * 0.02);
  x.strokeStyle = rgba(rim, o.thin ? 0.5 : 0.85);
  x.setLineDash([size * (0.6 + er() * 0.6), size * (0.03 + er() * 0.05), size * (0.35 + er() * 0.5), size * 0.025]);
  x.lineDashOffset = er() * size;
  x.stroke();
  x.setLineDash([]);
  // the tooth: the paper's valleys the paint skipped
  x.globalCompositeOperation = 'source-over';
  punchGrain(x, size, o.thin ? 0.34 : 0.3, v * 3 + 1);
  if (!o.thin && !o.grey) {
    // the soft white highlight top-left: a lighter lift of the brush, not a gloss
    x.globalCompositeOperation = 'source-atop';
    x.save();
    x.translate(size * 0.34, size * 0.3);
    x.rotate(-0.6);
    x.scale(1.7, 0.75);
    const hg = x.createRadialGradient(0, 0, 0, 0, 0, size * 0.17);
    hg.addColorStop(0, `rgba(255,255,255,${o.junk ? 0.22 : 0.36})`);
    hg.addColorStop(0.6, `rgba(255,255,255,${o.junk ? 0.1 : 0.16})`);
    hg.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = hg;
    x.fillRect(-size * 0.25, -size * 0.25, size * 0.5, size * 0.5);
    x.restore();
    x.globalCompositeOperation = 'source-over';
  }
  if (o.hot) {
    // a due row: the wash still wet — a firmer, darker edge all round
    squircle(x, cx, cy, half * 0.985, seeded(v * 131 + 5), 0.03, 6.6);
    x.lineWidth = Math.max(1.5, size * 0.04);
    x.strokeStyle = rgba(rim, 0.85);
    x.stroke();
  }
  return c;
}

/** where the falling piece lands: a faint PENCIL outline (two passes — a hand drew it), nothing filled */
function ghostArt(size) {
  const c = newCanvas(size), x = c.getContext('2d'), r = seeded(77);
  x.lineJoin = 'round';
  for (let pass = 0; pass < 2; pass++) {
    squircle(x, size / 2 + (pass ? size * 0.012 : 0), size / 2 - (pass ? size * 0.01 : 0), size * (pass ? 0.425 : 0.435), r, 0.02, 6.5);
    x.lineWidth = Math.max(1, size * (pass ? 0.02 : 0.034));
    x.strokeStyle = rgba(PENCIL, pass ? 0.3 : 0.6);
    x.stroke();
  }
  return c;
}
/** the wet sheen of a block that just set: a soft darker wash over the cell, fading as it dries (waterfx.js) */
function wetArt(size, rim) {
  const c = newCanvas(size), x = c.getContext('2d');
  squircle(x, size / 2, size / 2, size * 0.45, seeded(9), 0.02);
  const g = x.createRadialGradient(size / 2, size * 0.55, size * 0.05, size / 2, size / 2, size * 0.6);
  g.addColorStop(0, rgba(rim, 0.5));
  g.addColorStop(1, rgba(rim, 0.15));
  x.fillStyle = g;
  x.fill();
  return c;
}

const greyOf = h => { const n = parseInt(h.slice(1), 16); const l = Math.round(((n >> 16) * 0.3 + ((n >> 8) & 255) * 0.55 + (n & 255) * 0.15) * 0.6 + 78); const z = Math.max(0, Math.min(255, l)).toString(16).padStart(2, '0'); return `#${z}${z}${z}`; };

/** a watercolor sprite (cached): kind block | grey | ghost | wet | incoming | ihot; t = the piece (1–7, 8 junk); v = the variant (0–5) */
export function waterSprite(size, kind, t, v = 0) {
  const vv = kind === 'block' ? v % VARIANTS : 0;
  return cache.get(`${size}|${kind}|${t}|${vv}`, () => {
    const col = WATER[t] || WATER[8], rim = WATER_RIM[t] || WATER_RIM[8];
    if (kind === 'block') return blockArt(size, col, rim, vv, { junk: t === 8 });
    if (kind === 'grey') { const g = greyOf(col); return blockArt(size, g, rimOf(g), 1, { junk: true, grey: true }); }
    if (kind === 'ghost') return ghostArt(size);
    if (kind === 'wet') return wetArt(size, rim);
    if (kind === 'incoming' || kind === 'ihot') return blockArt(size, WASH, rimOf(WASH), kind === 'ihot' ? 2 : 4, { thin: true, hot: kind === 'ihot' });
    return blockArt(size, col, rim, 0);
  });
}

/** a DRIP (a clear's paint running): a thin trail down to a darker bead — drawn stretched to its length (w = its width in px) */
export function dripSprite(w, color) {
  w = Math.max(3, Math.round(w));
  return cache.get(`drip|${w}|${color}`, () => {
    const h = w * 6, c = newCanvas(w, h), x = c.getContext('2d'), rim = rimOf(color);
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, rgba(color, 0));
    g.addColorStop(0.3, rgba(color, 0.6));
    g.addColorStop(0.75, rgba(color, 0.88));
    g.addColorStop(1, rgba(rim, 0.95));
    x.fillStyle = g;
    // the trail narrows to the top; the bead at the foot is round
    x.beginPath();
    x.moveTo(w * 0.42, 0);
    x.bezierCurveTo(w * 0.36, h * 0.5, w * 0.08, h * 0.74, w * 0.08, h - w * 0.5);
    x.arc(w / 2, h - w * 0.5, w * 0.42, Math.PI, 0, true);
    x.bezierCurveTo(w * 0.92, h * 0.74, w * 0.64, h * 0.5, w * 0.58, 0);
    x.closePath();
    x.fill();
    // the bead's wet glint
    x.fillStyle = 'rgba(255,255,255,0.5)';
    x.beginPath(); x.ellipse(w * 0.4, h - w * 0.62, w * 0.1, w * 0.16, -0.4, 0, Math.PI * 2); x.fill();
    return c;
  });
}
/** a DROPLET (a splash at a slam's foot, a cancelled row's wash coming off): a small soft round bead */
export function dropSprite(size, color) {
  size = Math.max(3, Math.round(size));
  return cache.get(`drop|${size}|${color}`, () => {
    const c = newCanvas(size), x = c.getContext('2d'), r = size / 2;
    const g = x.createRadialGradient(r * 0.8, r * 0.8, 0, r, r, r);
    g.addColorStop(0, rgba(mixHex(color, '#ffffff', 0.25), 0.85));
    g.addColorStop(0.7, rgba(color, 0.75));
    g.addColorStop(1, rgba(rimOf(color), 0));
    x.fillStyle = g;
    x.beginPath(); x.arc(r, r, r, 0, Math.PI * 2); x.fill();
    return c;
  });
}
/** THE BLOOM (4 LINES / a perfect clear): a big wet wash spreading on the page — soft-edged pools of two or three paints, a dried rim */
export function bloomSprite(size, colors) {
  size = Math.round(size);
  return cache.get(`bloom|${size}|${colors.join('')}`, () => {
    const c = newCanvas(size), x = c.getContext('2d'), r = seeded(colors.length * 17 + 3);
    colors.forEach((col, i) => {
      const a = (i / colors.length) * Math.PI * 2 + r() * 0.8, d = size * 0.13;
      const cx = size / 2 + Math.cos(a) * d, cy = size / 2 + Math.sin(a) * d, rad = size * (0.3 + r() * 0.06);
      const g = x.createRadialGradient(cx, cy, rad * 0.1, cx, cy, rad);
      g.addColorStop(0, rgba(col, 0.3));
      g.addColorStop(0.7, rgba(col, 0.24));
      g.addColorStop(0.88, rgba(col, 0.3));   // (the dried rim: pigment carried to the wash's edge)
      g.addColorStop(1, rgba(col, 0));
      x.fillStyle = g;
      x.fillRect(0, 0, size, size);
    });
    punchGrain(x, size, 0.25, 5);
    return c;
  });
}

/** warm the blocks for a size in slices (≤ budgetMs a call): true once every colour × variant + the ghost + the drain + the rows are drawn */
export function warmWater(size, budgetMs = 4) {
  const t0 = performance.now();
  for (let t = 1; t <= 8; t++) {
    for (let v = 0; v < VARIANTS; v++) if (!cache.has(`${size}|block|${t}|${v}`)) { waterSprite(size, 'block', t, v); if (performance.now() - t0 > budgetMs) return false; }
    for (const k of ['grey', 'wet']) if (!cache.has(`${size}|${k}|${t}|0`)) { waterSprite(size, k, t); if (performance.now() - t0 > budgetMs) return false; }
  }
  for (const k of ['ghost', 'incoming', 'ihot']) if (!cache.has(`${size}|${k}|0|0`)) waterSprite(size, k, 0);
  return true;
}
export const clearWater = () => { cache.clear(); if (grainC) { grainC.width = 0; grainC.height = 0; grainC = null; } };
export const waterCount = () => cache.size;
