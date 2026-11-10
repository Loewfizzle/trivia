// THE SIGN KIT (THE VAULT 2A — card-founder's sign + card-house's front): the app's OWN neon, baked for a card. The NEON
// letters are the title sign's (ui/logo.js#LOGO_LETTERS — the same bent tubes, the same pink), SPEAKEASY + any other word the city's tube
// alphabet (core/marks.js#LETTERS — the games' signs + the speakeasy's blade); every letter flattened (core/tube-path.js) and
// baked ONCE per size into two sprites — its unlit GLASS and its LIT tube (glow → body → white-hot core → a highlight, the logo's layer
// stack) — so a frame only STAMPS sprites (no stroke per frame on the GPU path). A letter's light is an alpha: ignite() gives the
// ignition stutter a sign makes when it's switched on.
import { sprite } from './kit.js';
import { flattenPath } from '../core/tube-path.js';
import { LOGO_LETTERS } from '../ui/logo.js';
import { LETTERS, glyphAdvance } from '../core/marks.js';

export const PINK = { glow: '255,46,151', body: '#ff5fb4', core: '#fff1f8', glass: '#40243a' };
export const CREAM = { glow: '255,190,90', body: '#ffd78a', core: '#fffaf0', glass: '#3a2c1c' };
export const GOLD = { glow: '255,176,40', body: '#ffcf5a', core: '#fff8e0', glass: '#3a2a10' };

/** a letter (or any tube path): its polylines in sign units (x0, y0 = where its box sits; s = units per path unit) */
const polysOf = (d, s, x0, y0) => flattenPath(d, s, x0, y0, 1.2);

/**
 * bake one tube (its polylines in sign units) at k CSS px per unit, dpr → { cv, x, y, w, h } (x / y = its box's top-left in CSS px,
 * relative to the sign's origin). lit: the light stack, else the dark glass. tw = the tube's width in units.
 */
export function tubeSprite(key, polys, k, dpr, col, tw, lit) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of polys) for (const [x, y] of p.pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const pad = tw * (lit ? 3.4 : 1.2);
  const bx = (x0 - pad) * k, by = (y0 - pad) * k, bw = (x1 - x0 + pad * 2) * k, bh = (y1 - y0 + pad * 2) * k;
  const cv = sprite(`sgn:${key}:${lit ? 1 : 0}:${k.toFixed(3)}@${dpr}`, Math.ceil(bw * dpr), Math.ceil(bh * dpr), (c) => {
    c.scale(dpr, dpr); c.translate(-bx, -by); c.lineCap = 'round'; c.lineJoin = 'round';
    const path = () => { c.beginPath(); for (const p of polys) { p.pts.forEach(([x, y], i) => (i ? c.lineTo(x * k, y * k) : c.moveTo(x * k, y * k))); } };
    const W = tw * k;
    if (!lit) {
      c.strokeStyle = col.glass; c.lineWidth = W * 1.1; c.globalAlpha = 0.95; path(); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = Math.max(0.5, W * 0.18); c.save(); c.translate(-W * 0.18, -W * 0.18); path(); c.stroke(); c.restore();
      return;
    }
    // the glow: the tube's colour blurred wide (shadowBlur works everywhere a 2D canvas does — a bake, never a frame)
    c.shadowColor = `rgba(${col.glow},0.9)`;
    for (const [bl, lw, a] of [[W * 3.2, W * 1.6, 0.35], [W * 1.4, W * 1.2, 0.55]]) {
      c.shadowBlur = bl * dpr; c.strokeStyle = `rgba(${col.glow},${a})`; c.lineWidth = lw; path(); c.stroke();
    }
    c.shadowBlur = 0; c.shadowColor = 'transparent';
    c.strokeStyle = col.body; c.lineWidth = W; c.globalAlpha = 1; path(); c.stroke();
    c.strokeStyle = col.core; c.lineWidth = W * 0.38; path(); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = Math.max(0.4, W * 0.1); c.save(); c.translate(-W * 0.16, -W * 0.16); path(); c.stroke(); c.restore();
  });
  return { cv, x: bx, y: by, w: bw, h: bh };
}

/**
 * THE SIGN's LAYOUT in sign units: lines of letters → [{ key, polys, col, tw }] in reading order. A line: { word, y, h (cap height),
 * col, logo (true: the title's NEON letters, 100 units tall), tw, track (gap in cap heights), cx (the line's centre x) }
 */
export function signLayout(lines) {
  const out = [];
  for (const L of lines) {
    if (L.logo) {
      const s = L.h / 100, W = 332 * s, ox = L.cx - W / 2;
      LOGO_LETTERS.forEach((G, i) => out.push({ key: `logo${i}:${L.h}`, polys: polysOf(G.d, s, ox + G.x * s, L.y), col: L.col, tw: (L.tw || 9) * s, line: L }));
      continue;
    }
    const s = L.h / 14, lw = 10 * s, gap = (L.track != null ? L.track : 0.32) * lw, chars = [...L.word], W = chars.reduce((a, ch) => a + glyphAdvance(ch) * lw, 0) + (chars.length - 1) * gap;
    let x = L.cx - W / 2;   // (LOAD FIX 3: each glyph's own advance — the apostrophe a narrow cell)
    chars.forEach((ch, i) => { const d = LETTERS[ch]; if (d) out.push({ key: `t${ch}:${L.h}:${i}:${L.word}`, polys: polysOf(d, s, x, L.y), col: L.col, tw: (L.tw || 1.25) * s, line: L }); x += glyphAdvance(ch) * lw + gap; });
  }
  return out;
}
/** a vertical word (the blade): one letter under the next, centred on cx */
export function bladeLayout(word, cx, y0, h, col, tw = 1.25, gap = 0.36) {
  const s = h / 14, out = [];
  [...word].forEach((ch, i) => { const d = glyphAdvance(ch) < 1 ? null : LETTERS[ch]; if (d) out.push({ key: `v${ch}:${h}:${i}:${word}`, polys: polysOf(d, s, cx - 5 * s, y0 + i * h * (1 + gap)), col, tw: tw * s }); });
  return out;
}
/** THE IGNITION: a letter switched on at t0 — dark, a stutter (on / off / half / on), then lit; 0..1 */
export function ignite(t, t0, i = 0) {
  const e = t - t0;
  if (e < 0) return 0;
  if (e > 0.42) return 1;
  const seq = [0.9, 0, 0.55, 0.1, 1, 0.35, 1];
  return seq[Math.min(seq.length - 1, Math.floor((e / 0.42) * seq.length + (i % 2) * 0.3))];
}
/** a lit tube's hum: a hair of variation, now and then a dip (seeded per letter) */
export function hum(t, i) {
  const a = Math.sin(t * 7.3 + i * 2.1) * 0.5 + 0.5, dip = Math.abs(Math.sin(Math.floor(t * 1.7 + i * 3.3) * 91.7)) < 0.04 ? 0.55 : 1;
  return (0.93 + 0.07 * a) * dip;
}
/** draw a letter: its glass, then its light at alpha a (k = CSS px per sign unit, ox / oy = the sign's origin in the slot) */
export function drawTube(c, L, k, dpr, ox, oy, a) {
  const g = tubeSprite(L.key, L.polys, k, dpr, L.col, L.tw, false);
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  c.drawImage(g.cv, ox + g.x, oy + g.y, g.w, g.h);
  if (a > 0.01) {
    const s = tubeSprite(L.key, L.polys, k, dpr, L.col, L.tw, true);
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a);
    c.drawImage(s.cv, ox + s.x, oy + s.y, s.w, s.h);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  }
}
