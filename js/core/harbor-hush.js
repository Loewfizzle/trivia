// CITY 2.0 — THE HARBOR, 8P: THE HUSH WORD SIGN's plan (PURE — tested in tests/harbor-people.test.mjs; drawn by
// screens/harbor/hushsign.js). Ben (Oct 24, replacing the shop-window sign): the room's password appears as BARE NEON TUBES hanging inside
// the speakeasy's LOWER-RIGHT upstairs window (the jazz room) — a signal from someone inside to friends outside. It exists ONLY while the
// player is in a lobby: absent otherwise (no unlit tubes), lit letter by letter when a lobby opens, glowing by day too, dark + gone when
// they leave. The room's moments keep playing behind it (the silhouettes show between the letters).
// SIZE (Ben, after the feasibility check: the glass is ~22 pt wide at 390): sized for FOUR letters — today's hush words — as a 2 × 2
// block as big as the glass allows; five letters (3 + 2) only have to fit (smaller if needed).
import { LETTERS } from '../screens/district/marks.js';
import { flattenPath } from './tube-path.js';

/** the sign's proportions (× the cap height): a letter's width, the gaps across + between the rows; margin: inside the glass (units);
 *  col: the tubes' neon. POLISH 5 (the owner, the JAZZ preview at night: pink-red on the warm amber room read soft + low-contrast):
 *  ICE-CYAN — the complement of the room's amber, the most contrast there is — with white-hot cores + TIGHT halos (hushsign.js), the
 *  strokes thicker and the letters BOLD BLOCKS that fill the glass (wider, tighter gaps, a slimmer margin) */
// (SP4 — the owner: the JAZZ letters rode over the pane's frame: the block filled the glass edge to edge and the tubes' halos spilled onto
// the frame — the margin now leaves room for the halo (the letters ~12 % smaller), and hushsign.js clips the overlay to the glass)
export const HUSH = Object.freeze({ lw: 0.84, gap: 0.1, row: 0.13, tube: 0.17, margin: 0.2, col: [96, 232, 255] });

/** the window's glass (wall units) for the window [a, b] × [r0, r1] — the same insets as the speakeasy's sash (speakeasy.js#paintWindow) */
export const hushGlass = (a, b, r0, r1) => [a + 0.18, b - 0.05, r0 + 0.12, r1 - 0.06];

/** the rows a word splits into: 4 → 2 + 2, 5 → 3 + 2, 3 → 2 + 1 (top row the longer), ≤ 2 → one row */
export const hushRows = s => (s.length <= 2 ? [s] : [s.slice(0, Math.ceil(s.length / 2)), s.slice(Math.ceil(s.length / 2))]);

/**
 * The sign's layout in WALL UNITS (u across, v up) inside the glass [g0, g1, h0, h1] → { text, cap, rows: [{ letters: [{ ch, u0, w, polys
 * }] }], tube } — every row centred; the cap as big as the glass allows for the word (4 letters: the full 2 × 2 block).
 */
export function hushPlan(text, glass) {
  const H = HUSH, [g0, g1, h0, h1] = glass, s = String(text || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6);
  const rows = hushRows(s), n = Math.max(1, ...rows.map(r => r.length)), W = g1 - g0 - 2 * H.margin, Hh = h1 - h0 - 2 * H.margin;
  const capW = W / (n * H.lw + (n - 1) * H.gap), capH = Hh / (rows.length + (rows.length - 1) * H.row), cap = Math.min(capW, capH);
  const lw = H.lw * cap, totalH = rows.length * cap + (rows.length - 1) * H.row * cap, top = (h0 + h1) / 2 + totalH / 2;
  const out = rows.map((word, ri) => {
    const rowW = word.length * lw + (word.length - 1) * H.gap * cap, u0 = (g0 + g1) / 2 - rowW / 2, base = top - (ri + 1) * cap - ri * H.row * cap;
    return { word, letters: [...word].map((ch, i) => { const lu = u0 + i * (lw + H.gap * cap), d = LETTERS[ch];
      return { ch, u0: lu, w: lw, base, polys: d ? flattenPath(d, 1, 0, 0, 0.6).map(p => ({ ...p, pts: p.pts.map(([x, y]) => [lu + x * lw / 10, base + cap - y * cap / 14]) })) : [] }; }) };
  });
  return { text: s, cap, rows: out, tube: H.tube * cap };
}

/** What the sign shows (PURE): a lobby's word → { text, lit: 1 }; no lobby → { text: null, lit: 0 } (absent — no unlit tubes) */
export function hushState({ word = null } = {}) {
  const w = String(word || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6);
  return w ? { text: w, lit: 1 } : { text: null, lit: 0 };
}

/**
 * A letter re-lighting after the word appeared (PURE): i = the letter in reading order, dt = s since → 0..1. Each STRIKES in turn
 * (every 0.28 s): two quick flickers, then on — the way a cold tube catches.
 */
export function strikeLevel(i, dt) {
  const t0 = 0.25 + i * 0.28, u = dt - t0;
  if (u < 0) return 0;
  if (u > 0.36) return 1;
  return u < 0.07 ? 0.9 : u < 0.14 ? 0.15 : u < 0.2 ? 1 : u < 0.27 ? 0.3 : 1;
}
/** going dark when the lobby closes (PURE): dt = s since → 0..1 — a last flicker, then out (gone after ~0.5 s) */
export const darkLevel = dt => (dt < 0 ? 1 : dt < 0.08 ? 0.35 : dt < 0.16 ? 0.9 : dt < 0.5 ? 0.9 * (1 - (dt - 0.16) / 0.34) : 0);

// ------------------------------------------------------------------ WIN — THE HUSH WORD ON THE WALL (the owner, Oct 26: DECIDED)
/**
 * THE DOOR'S PASSWORD SIGN: a vertical neon sign mounted FLAT on the brick PIER right of the right window column (core/harbor-speakeasy.js
 * SPEAK_PIERS[3] — the corner pier the blade hangs beside), the letters STACKED top to bottom, in a thin dark door-plate mount —
 * from above the side door's sconce (its top 3.43) up to under the right wall-washer's hood (its lamp at 9.13; the sign's top 8.95).
 * FEASIBILITY (checked before building — docs/harbor.md#win): the run is 5.4 units ≈ 74 pt at 402; a 4-letter word gets ~1.09-unit caps
 * ≈ 14.8 pt (14.4 at 390, 15.8 at 430), five letters ~0.87 ≈ 11.9 pt — not the owner's 18–22 pt (that needs the right washer gone:
 * +0.65 units of run → ~17 pt). minN: a 3-letter word is sized as four (never huge). The plate hugs the word (margin + plate), centred in
 * the pier's run; its right edge ~3 pt from the corner, ~7 pt from the blade's board. ALL FOUR WINDOWS stay free for the moments.
 */
// (WIN2 — the owner: the right pier's wall-washer is REMOVED while the sign is lit (speakeasy-bake.js: ctx.hushLit), so the run reaches
// up under the cornice: v1 8.95 → 9.62 → a 4-letter word ≈ 1.22-unit caps ≈ 16.6 pt at 402 (16.1 at 390, 17.8 at 430), five ≈ 13.2)
export const HUSH_WALL = Object.freeze({ u0: 9.35, u1: 11.2, v0: 3.55, v1: 9.62, margin: 0.08, plate: 0.12, gap: 0.12, lw: 0.84, tube: 0.17, minN: 4, col: [96, 232, 255] });
/**
 * wallPlan(text) → { text, cap, tube, letters: [{ ch, u0, w, base, polys }] (top → bottom), plate: [u0, u1, v0, v1], pier: [u0, u1, v0, v1] }
 * in WALL UNITS (u across the facade, v up) — or null without a word
 */
export function wallPlan(text) {
  const H = HUSH_WALL, s = String(text || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6), n = s.length;
  if (!n) return null;
  const inset = H.margin + H.plate, W = H.u1 - H.u0 - 2 * inset, Hh = H.v1 - H.v0 - 2 * inset, N = Math.max(H.minN, n);
  const PADK = 0.14;   // (the plate's pad round the letters, × the cap: the halo — 0.75 × the tube — stays on the plate)
  const cap = Math.min(W / (H.lw + 2 * PADK), Hh / (N + (N - 1) * H.gap + 2 * PADK)), lw = H.lw * cap, total = n * cap + (n - 1) * H.gap * cap;
  const cx = (H.u0 + H.u1) / 2, cy = (H.v0 + H.v1) / 2, top = cy + total / 2, u0 = cx - lw / 2;
  const letters = [...s].map((ch, i) => { const base = top - (i + 1) * cap - i * H.gap * cap, d = LETTERS[ch];
    return { ch, u0, w: lw, base, polys: d ? flattenPath(d, 1, 0, 0, 0.6).map(p => ({ ...p, pts: p.pts.map(([x, y]) => [u0 + x * lw / 10, base + cap - y * cap / 14]) })) : [] }; });
  const pad = H.plate + PADK * cap;
  return { text: s, cap, tube: H.tube * cap, letters, plate: [u0 - pad, u0 + lw + pad, top - total - pad, top + pad], pier: [H.u0, H.u1, H.v0, H.v1] };
}
