// PRISM DROP — THE NEON SKIN's DRAWINGS (PD-3 — THE NEON LOOK; moved out of board.js by SKINS 1, not a pixel changed — docs/prism.md "THE SKINS").
// Solid DARK cores, a crisp HOT EDGE tube in the piece's colour with a near-white core line, the static glow PRE-RENDERED (a ring sprite drawn
// under the stack; never a per-frame shadowBlur), three variants per colour (a tube's hot spot — real neon is never perfectly even). The colours
// come from the world's palette (neon.js#neonPalette — the family holds).
//   neonSprite(size, kind, t, pal, v) · clearNeon() · neonCount()
import { rr, rgba, mix, grey, INCOMING } from './skin-kit.js';
import { mixHex } from './neon.js';

// ---------------------------------------------------------------- THE NEON SPRITES (PD-3)
const WHITE = '#ffffff';
function neonBlock(size, col, glowCol, v = 0, junk = false, dim = 1) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  const p = Math.max(1, size * 0.05);           // the gap between cells
  const b = size - 2 * p;
  const r = size * 0.2;
  const tw = Math.max(1.5, size * 0.115);       // the tube
  // the core: dark, a deep tint of the colour — solid (the stack reads as blocks, never as outlines)
  rr(x, p, p, b, b, r);
  const cg = x.createLinearGradient(0, p, 0, p + b);
  cg.addColorStop(0, mix(col, '#000000', junk ? 0.74 : 0.8));
  cg.addColorStop(1, mix(col, '#000000', junk ? 0.84 : 0.9));
  x.fillStyle = cg;
  x.fill();
  // the tube lights the core from its edges (baked once: the inner glow, clipped to the cell)
  x.save();
  rr(x, p, p, b, b, r);
  x.clip();
  x.shadowColor = rgba(glowCol, (junk ? 0.45 : 0.9) * dim);
  x.shadowBlur = size * 0.26;
  rr(x, p + tw * 0.5, p + tw * 0.5, b - tw, b - tw, Math.max(1, r - tw * 0.5));
  x.lineWidth = tw;
  x.strokeStyle = rgba(col, 0.9 * dim);
  x.stroke();
  x.restore();
  // the hot tube: its colour, then the near-white core line down its middle
  rr(x, p + tw * 0.5, p + tw * 0.5, b - tw, b - tw, Math.max(1, r - tw * 0.5));
  x.lineWidth = tw;
  x.strokeStyle = junk ? rgba(mixHex(col, WHITE, 0.08), 0.85) : rgba(mixHex(col, WHITE, 0.14), dim);
  x.stroke();
  x.lineWidth = Math.max(1, size * (junk ? 0.025 : 0.036));
  x.strokeStyle = junk ? rgba(mixHex(col, WHITE, 0.45), 0.55) : rgba(mixHex(col, WHITE, 0.86), 0.97 * dim);
  x.stroke();
  // the variant: a hotter stretch of the tube (top-left or bottom-right) — real neon is never perfectly even
  if (v && !junk) {
    const g = v === 1 ? x.createLinearGradient(p, p, p + b, p + b * 0.6) : x.createLinearGradient(p + b, p + b, p, p + b * 0.4);
    g.addColorStop(0, rgba(WHITE, 0.55 * dim));
    g.addColorStop(0.45, rgba(WHITE, 0));
    g.addColorStop(1, rgba(WHITE, 0));
    x.lineWidth = Math.max(1, size * 0.05);
    x.strokeStyle = g;
    x.stroke();
  }
  // the glass: a fine sheen across the tube's upper-left
  x.beginPath();
  x.moveTo(p + r * 0.9, p + tw * 0.32);
  x.lineTo(p + b * 0.55, p + tw * 0.32);
  x.lineWidth = Math.max(0.6, size * 0.014);
  x.strokeStyle = rgba(WHITE, junk ? 0.12 : 0.34 * dim);
  x.stroke();
  return c;
}
/** the static glow round a lit cell: a soft ring of light (drawn 'lighter' under the stack — it shows in the gaps + round the stack's edge) */
function neonGlow(size, glowCol) {
  const c = document.createElement('canvas');
  const n = Math.round(size * 2.2);
  c.width = c.height = n;
  const x = c.getContext('2d');
  const o = (n - size) / 2, p = size * 0.1;
  x.shadowColor = rgba(glowCol, 0.95);
  x.shadowBlur = size * 0.42;
  rr(x, o + p, o + p, size - 2 * p, size - 2 * p, size * 0.2);
  x.lineWidth = size * 0.14;
  x.strokeStyle = rgba(glowCol, 0.5);
  x.stroke();
  return c;
}
/** where the falling piece lands: an UNLIT glass tube — a thin pale line in its colour, no core light */
function neonGhost(size, col) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  const p = Math.max(1, size * 0.05), tw = Math.max(1.5, size * 0.115);
  rr(x, p + tw * 0.5, p + tw * 0.5, size - 2 * p - tw, size - 2 * p - tw, Math.max(1, size * 0.2 - tw * 0.5));
  x.fillStyle = rgba(col, 0.07);
  x.fill();
  x.lineWidth = Math.max(1, size * 0.05);
  x.strokeStyle = rgba(mixHex(col, WHITE, 0.3), 0.5);
  x.stroke();
  return c;
}
/** (PD-2's rule, the neon way) an INCOMING ghost cell: a red tube outline + hatching — no dark core, no hot core: never a block */
function neonIncoming(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  const p = Math.max(1, size * 0.07), s = size - 2 * p;
  rr(x, p, p, s, s, size * 0.18);
  x.fillStyle = rgba(INCOMING, 0.16);
  x.fill();
  x.save();
  rr(x, p, p, s, s, size * 0.18);
  x.clip();
  x.strokeStyle = 'rgba(255,120,150,0.55)';
  x.lineWidth = Math.max(1, size * 0.06);
  for (let k = -1; k <= 2; k++) { const o = p + k * s * 0.42; x.beginPath(); x.moveTo(o, p + s); x.lineTo(o + s, p); x.stroke(); }
  x.restore();
  rr(x, p, p, s, s, size * 0.18);
  x.shadowColor = rgba(INCOMING, 0.9);
  x.shadowBlur = size * 0.16;
  x.lineWidth = Math.max(1, size * 0.06);
  x.strokeStyle = 'rgba(255,160,182,0.95)';
  x.stroke();
  return c;
}
const neonSprites = new Map();
let neonPalId = '';
/** a neon sprite: kind block | grey | glow | ghost | incoming | iglow; pal = neon.js#neonPalette(world); v = the tube's variant (0–2) */
export function neonSprite(size, kind, t, pal, v = 0) {
  if (pal.id !== neonPalId) { neonSprites.clear(); neonPalId = pal.id; }   // (one world's set at a time — a song change rebuilds the cache)
  const key = `${size}|${kind}|${t}|${v}`;
  let s = neonSprites.get(key);
  if (!s) {
    const col = pal.piece[t] || pal.piece[8];
    const glow = pal.glow[t] || col;
    s = kind === 'block' ? neonBlock(size, col, glow, v, t === 8)
      : kind === 'grey' ? neonBlock(size, grey(col), grey(col), 0, true, 0.6)
        : kind === 'glow' ? neonGlow(size, glow)
          : kind === 'incoming' ? neonIncoming(size)
            : kind === 'iglow' ? neonGlow(size, INCOMING)
              : neonGhost(size, col);
    neonSprites.set(key, s);
  }
  return s;
}

// (FR7 FIXES A — PD7: the sprite caches are dropped a minute after a match's screen goes — view.js#dropCaches; their pixels freed at once)
export const clearNeon = () => { for (const c of neonSprites.values()) if (c && typeof c.width === 'number') { c.width = 0; c.height = 0; } neonSprites.clear(); };
export const neonCount = () => neonSprites.size;
