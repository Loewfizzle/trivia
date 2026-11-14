// PRISM DROP — THE ARCADE PIXEL SKIN's DRAWINGS (SKINS 2B — night; docs/prism.md "THE SKINS" → ARCADE PIXEL; the owner's brief: docs/games/plan.md
// "SKINS 2B"). CRISP is the look: every block is an 8 × 8 CHUNKY PIXEL GRID whose pixel edges are SNAPPED TO DEVICE PIXELS (the grid's lines
// = round(i × size / 8): whole device pixels, whatever the cell size), drawn with flat fillRects only — no gradient, no blur, no anti-aliased
// edge, NO BLOOM. A block = the piece's colour · a BRIGHT top + left edge (the colour toward white) · a DARK bottom + right edge (its darker
// shade) · 2–3 white GLINT pixels top-left · a rare darker pixel inside for texture. Four variants per colour (the glint's shape + where the
// texture pixels sit). The pieces' colours are the JEWEL families (the contract's ±20° — a touch more saturated for an 8-bit palette).
//   pixelSprite(size, kind, t, v)   kind: block | grey (the danger drain) | ghost (a DOTTED pixel outline) | incoming · ihot (grey pixel
//                                   blocks with a red pixel edge — dithered, never a piece) | flash (a cell of the clear's white bar) |
//                                   blink (a lock's white pixel outline)
//   bitSprite(u, color)             one burst pixel (a u × u square) · pixelGrid(size) → the 9 grid lines (device px) · PIXEL (the colours)
//   warmPixel · clearPixel · pixelCount — the sprite cache (skin-kit.js#spriteCache)
import { mix, hexRgb, spriteCache, seeded, newCanvas, INCOMING } from './skin-kit.js';

// 1 I cyan · 2 O yellow · 3 T violet · 4 S green · 5 Z red · 6 J blue · 7 L orange · 8 junk (grey)
export const PIXEL = [null, '#22e6f2', '#ffd021', '#b45cff', '#2fe26a', '#ff3f5f', '#3f7dff', '#ff8f28', '#7a8296'];
export const VARIANTS = 4;
export const GRID = 8;
const WHITE = '#ffffff', BLACK = '#000000';
const hex = c => { const m = /^rgb\((\d+),(\d+),(\d+)\)$/.exec(c); return m ? `#${[1, 2, 3].map(i => (+m[i]).toString(16).padStart(2, '0')).join('')}` : c; };
/** the piece's bright edge (toward white) · its dark edge (its darker shade) · the texture pixel (a shade under the fill) */
export const lightOf = c => hex(mix(c, WHITE, 0.58));
export const darkOf = c => hex(mix(c, BLACK, 0.52));
const dimOf = c => hex(mix(c, BLACK, 0.2));
const greyOf = c => { const [r, g, b] = hexRgb(c); const l = Math.round(r * 0.3 + g * 0.55 + b * 0.15); const v = Math.round(l * 0.55 + 46).toString(16).padStart(2, '0'); return `#${v}${v}${Math.min(255, Math.round((l * 0.55 + 46) * 1.12)).toString(16).padStart(2, '0')}`; };

/** PURE: the 8 × 8 grid's lines for a cell `size` device px wide — 9 whole numbers 0 … size (a pixel = [g[i], g[i+1]): never a half pixel) */
export function pixelGrid(size, n = GRID) { return Array.from({ length: n + 1 }, (_, i) => Math.round((i * size) / n)); }

// the GLINT (white pixels, top-left, inside the bright edge) per variant · where the rare darker texture pixels sit (inside the 6 × 6 middle)
const GLINT = [[[1, 1], [2, 1], [1, 2]], [[1, 1], [2, 1]], [[1, 1], [1, 2], [2, 2]], [[1, 1], [3, 1], [1, 2]]];
/** PURE: a variant's texture pixels — 1–2 cells of the inner field (2…5), never on a glint, the same on every phone */
export function textureOf(t, v) {
  const r = seeded(t * 37 + v * 101 + 5), out = [];
  const n = 1 + (r() < 0.45 ? 1 : 0);
  for (let k = 0; k < n; k++) {
    const x = 2 + Math.floor(r() * 4), y = 3 + Math.floor(r() * 3);
    if (!out.some(p => p[0] === x && p[1] === y)) out.push([x, y]);
  }
  return out;
}

const cell = (x, g, i, j, col) => { x.fillStyle = col; x.fillRect(g[i], g[j], g[i + 1] - g[i], g[j + 1] - g[j]); };

/** a block: the fill, the bevel (bright top + left, dark bottom + right — the two corners where they meet take the fill), the glint, the texture */
function block(size, col, v, o = {}) {
  const c = newCanvas(size), x = c.getContext('2d'), g = pixelGrid(size), n = GRID;
  const hi = o.hi || lightOf(col), lo = o.lo || darkOf(col);
  x.fillStyle = col;
  x.fillRect(0, 0, size, size);
  for (let i = 0; i < n - 1; i++) { cell(x, g, i, 0, hi); cell(x, g, 0, i, hi); }
  for (let i = 1; i < n; i++) { cell(x, g, i, n - 1, lo); cell(x, g, n - 1, i, lo); }
  if (!o.flat) {
    for (const [i, j] of textureOf(o.t || 0, v)) cell(x, g, i, j, dimOf(col));
    for (const [i, j] of GLINT[v % VARIANTS]) cell(x, g, i, j, o.glint || WHITE);
  }
  return c;
}
/** where the falling piece lands: a DOTTED pixel outline in its colour (every other pixel of the cell's edge), the inside open */
function ghost(size, col) {
  const c = newCanvas(size), x = c.getContext('2d'), g = pixelGrid(size), n = GRID;
  x.globalAlpha = 0.9;
  for (let i = 0; i < n; i++) {
    if (i % 2 === 0) { cell(x, g, i, 0, col); cell(x, g, n - 1, i, col); }
    else { cell(x, g, i, n - 1, col); cell(x, g, 0, i, col); }
  }
  return c;
}
/** an INCOMING row's cell: a GREY pixel block (a dithered checker — never a piece: no bevel, no glint) inside a RED pixel edge; hot = due */
function incoming(size, hot) {
  const c = newCanvas(size), x = c.getContext('2d'), g = pixelGrid(size), n = GRID;
  const a = hot ? '#6d7386' : '#565c6e', b = hot ? '#565c6e' : '#454a5a', red = hot ? '#ff6f8d' : INCOMING, deep = hot ? '#d93a5c' : '#b92f4e';
  for (let j = 1; j < n - 1; j++) for (let i = 1; i < n - 1; i++) cell(x, g, i, j, (i + j) % 2 ? a : b);
  for (let i = 0; i < n; i++) { cell(x, g, i, 0, red); cell(x, g, 0, i, red); cell(x, g, i, n - 1, deep); cell(x, g, n - 1, i, deep); }
  return c;
}
/** a lock's blink: the cell's edge in white pixels (one frame of light on a set piece — no bloom) */
function blink(size) {
  const c = newCanvas(size), x = c.getContext('2d'), g = pixelGrid(size), n = GRID;
  for (let i = 0; i < n; i++) { cell(x, g, i, 0, WHITE); cell(x, g, 0, i, WHITE); cell(x, g, i, n - 1, WHITE); cell(x, g, n - 1, i, WHITE); }
  return c;
}

const cache = spriteCache();
/** an ARCADE PIXEL sprite at `size` device px (kind: block | grey | ghost | incoming | ihot | flash | blink; v = the variant 0–3) */
export function pixelSprite(size, kind, t, v = 0) {
  size = Math.max(4, Math.round(size));
  const key = `${size}|${kind}|${t}|${kind === 'block' ? v % VARIANTS : 0}`;
  return cache.get(key, () => {
    const col = PIXEL[t] || PIXEL[8];
    if (kind === 'block') return t === 8 ? block(size, col, v, { t, glint: lightOf(col) }) : block(size, col, v, { t });
    if (kind === 'grey') return block(size, greyOf(col), 0, { flat: true });
    if (kind === 'incoming') return incoming(size, false);
    if (kind === 'ihot') return incoming(size, true);
    if (kind === 'blink') return blink(size);
    if (kind === 'flash') { const c = newCanvas(size), x = c.getContext('2d'); x.fillStyle = WHITE; x.fillRect(0, 0, size, size); return c; }
    return ghost(size, col);
  });
}
/** one burst pixel: a flat u × u square of a colour */
export function bitSprite(u, color) {
  u = Math.max(1, Math.round(u));
  return cache.get(`bit|${u}|${color}`, () => { const c = newCanvas(u), x = c.getContext('2d'); x.fillStyle = color; x.fillRect(0, 0, u, u); return c; });
}
/** every block of a size, drawn ahead (flat fills: a few ms in all) → true when done */
export function warmPixel(size, ms = 4) {
  const t0 = performance.now();
  for (let t = 1; t <= 8; t++) for (let v = 0; v < VARIANTS; v++) { pixelSprite(size, 'block', t, v); if (performance.now() - t0 > ms) return false; }
  return true;
}
export const clearPixel = () => cache.clear();
export const pixelCount = () => cache.size;

// ---- THE LETTERING: "Press Start 2P" (SIL OFL 1.1 — assets/fonts/prism/, ~12 KB), as 'PD Pixel' — fetched once, ONLY when the skin shows
const FONT = new URL('../../../assets/fonts/prism/press-start-2p-latin-400.woff2', import.meta.url);
let fontP = null, fontOk = false;
export function loadPixelFont() {
  if (!fontP && typeof FontFace === 'function' && typeof document !== 'undefined' && document.fonts) {
    fontP = new FontFace('PD Pixel', `url(${FONT.href}) format('woff2')`, { display: 'swap' }).load()
      .then(f => { document.fonts.add(f); fontOk = true; return true; }).catch(() => false);
  }
  return fontP;
}
export const pixelFontReady = () => fontOk;
/**
 * a WORD in the pixel font as a sprite (the clear's "LINE!"): white letters, a hard one-font-pixel drop shadow in `shade`, a black pixel
 * outline round both so it reads over any stack — no blur. `F` = the font's size in device px (a multiple of 8: one font pixel = F / 8 whole
 * device pixels — crisp). Until the font is in: the system's monospace, bold (never cached under the font's key).
 */
export function wordSprite(text, F, shade) {
  F = Math.max(8, Math.round(F / 8) * 8);
  const ok = fontOk, u = F / 8;
  return cache.get(`word|${text}|${F}|${shade}|${ok ? 1 : 0}`, () => {
    const c = newCanvas(text.length * F + 4 * u, F + 4 * u), x = c.getContext('2d');
    x.font = ok ? `${F}px "PD Pixel"` : `900 ${Math.round(F * 0.92)}px ui-monospace, Menlo, Consolas, monospace`;
    x.textBaseline = 'alphabetic';
    x.textAlign = ok ? 'left' : 'center';
    const X = ok ? u : c.width / 2, Y = u + F;
    x.fillStyle = BLACK;
    for (const [sx, sy] of [[0, 0], [u, u]]) for (const [dx, dy] of [[-u, 0], [u, 0], [0, -u], [0, u], [-u, -u], [u, -u], [-u, u], [u, u]]) x.fillText(text, X + sx + dx, Y + sy + dy);
    x.fillStyle = shade; x.fillText(text, X + u, Y + u);
    x.fillStyle = WHITE; x.fillText(text, X, Y);
    return c;
  });
}
