// PRISM DROP — THE NEON LOOK's PALETTES (PD-3 — the owner's decision, docs/games/plan.md "PD-3"). PURE (no DOM: the palette test runs in node).
// Each piece keeps its COLOUR FAMILY in every world (the long piece always cyan-ish, the square always yellow-ish… from board.js's JEWEL hues) so a
// player knows a piece by its colour; a WORLD only shifts the SHADE + the glow (warmer at SYNTH SUNSET, icier in CRYSTAL CAVE…), plus the well's
// edge, the board's frame and the sparks. Never a full colour swap between songs.
//   neonPalette(worldId) → { id, piece: [null, 7 piece colours, junk], glow: [...], edge, frame, well, sparks: [a, b], flash }
//   NEON_BASE (the night's own piece colours — today's JEWEL hues, lit as tubes) · WORLD_SHIFT (the per-world table) · hex / hsl helpers

// the base tubes: JEWEL's hues (board.js) — 1 long (cyan) · 2 square (yellow) · 3 twist (violet) · 4 S (green) · 5 Z (red) · 6 J (blue) · 7 L (orange) · 8 junk
export const NEON_BASE = [null, '#2be4f0', '#ffc93a', '#b46bff', '#2fe07a', '#ff4d6d', '#4a86ff', '#ff9b3d', '#6b7385'];

// a world's shift: every piece hue PULLED toward `to` by `k` (capped at `cap` degrees — the family holds), its saturation × `s`, its lightness + `l`;
// the glow leans toward the world's `glow` colour by `gk`. edge = the frame's tube, well = the walls' inner line, sparks = the clears' two colours.
export const WORLD_SHIFT = {
  aurora: { to: 160, k: 0.12, cap: 10, s: 1.0, l: 0.0, glow: '#3dffb4', gk: 0.16, edge: '#5fffd0', frame: '#2fd6b0', well: '#7affd8', sparks: ['#d4fff2', '#8f84ff'] },
  city: { to: 318, k: 0.10, cap: 9, s: 1.06, l: 0.01, glow: '#ff3fa4', gk: 0.14, edge: '#ff4fb8', frame: '#ff2f9e', well: '#56e8ff', sparks: ['#ffe0f3', '#54eaff'] },
  nebula: { to: 285, k: 0.10, cap: 9, s: 1.0, l: 0.01, glow: '#b07cff', gk: 0.16, edge: '#c08cff', frame: '#9a5cff', well: '#ff9ae4', sparks: ['#fff1d8', '#ff7ad9'] },
  crystal: { to: 198, k: 0.14, cap: 11, s: 0.9, l: 0.05, glow: '#8ff2ff', gk: 0.2, edge: '#a6f4ff', frame: '#5fd8ff', well: '#e2fbff', sparks: ['#f2fbff', '#7fe8ff'] },
  sunset: { to: 28, k: 0.14, cap: 11, s: 1.05, l: 0.0, glow: '#ffb347', gk: 0.16, edge: '#ff6fd0', frame: '#ff5aa8', well: '#ffcf6a', sparks: ['#fff0c8', '#ff6ad5'] },
};
// a piece's share of the world's pull: yellow + orange sit 15° apart — they barely move (the square stays YELLOW, the L stays ORANGE in every
// world); red leans little (it borders orange + violet)
export const PIECE_PULL = [0, 1, 0.3, 1, 1, 0.7, 1, 0.5, 0];
export const NEUTRAL = { to: 0, k: 0, cap: 0, s: 1, l: 0, glow: '#c8d8ff', gk: 0, edge: '#9fd8ff', frame: '#7fb8ff', well: '#cfe6ff', sparks: ['#ffffff', '#8fd8ff'] };

// ---- colour maths (pure)
export function hexRgb(h) { return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); }
export function rgbHex(c) { return `#${c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`; }
export function rgbHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
export function hslRgb([h, s, l]) {
  h = ((h % 360) + 360) % 360 / 360;
  if (!s) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}
/** the signed shortest angle a → b (degrees, -180..180) */
export const hueDiff = (a, b) => ((((b - a) % 360) + 540) % 360) - 180;
export const mixHex = (a, b, k) => { const x = hexRgb(a), y = hexRgb(b); return rgbHex(x.map((v, i) => v + (y[i] - v) * k)); };

/** one piece colour in a world: its hue pulled toward the world's (capped — the family holds), its saturation + lightness shaded */
export function shade(hex, w, t = 1) {
  const [h, s, l] = rgbHsl(hexRgb(hex));
  const f = PIECE_PULL[t] ?? 1;
  const pull = Math.max(-w.cap * f, Math.min(w.cap * f, hueDiff(h, w.to) * w.k * f));
  return rgbHex(hslRgb([h + pull, Math.max(0, Math.min(1, s * w.s)), Math.max(0.42, Math.min(0.72, l + w.l))]));
}

const cache = new Map();
/** the palette a world draws with (memoised — the board's sprite cache keys on its id) */
export function neonPalette(worldId) {
  const id = WORLD_SHIFT[worldId] ? worldId : 'neutral';
  let p = cache.get(id);
  if (p) return p;
  const w = WORLD_SHIFT[id] || NEUTRAL;
  const piece = NEON_BASE.map((c, t) => (c && t !== 8 ? shade(c, w, t) : c));
  // junk = a cool unlit grey tube, nudged toward the world's frame
  piece[8] = mixHex('#7a8296', w.frame, 0.12);
  const glow = piece.map(c => (c ? mixHex(c, w.glow, w.gk) : c));
  p = Object.freeze({ id, piece: Object.freeze(piece), glow: Object.freeze(glow), edge: w.edge, frame: w.frame, well: w.well, sparks: Object.freeze([...w.sparks]), flash: mixHex('#ffffff', w.edge, 0.22) });
  cache.set(id, p);
  return p;
}

// ---- the palette test's measure (CIE76 ΔE in Lab — "enough contrast between pieces")
function lin(v) { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }
export function lab(hex) {
  const [r, g, b] = hexRgb(hex).map(lin);
  const X = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047, Y = r * 0.2126 + g * 0.7152 + b * 0.0722, Z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = t => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
export const deltaE = (a, b) => { const p = lab(a), q = lab(b); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };
