// CITY 2.0 — THE HARBOR, 8P: THE HUSH WORD SIGN's plan (PURE — tested in tests/harbor-people.test.mjs; drawn by
// screens/harbor/hushsign.js). The owner (Oct 24): the room's password hides in plain sight ON the speakeasy — a small NEON WINDOW SIGN
// hanging just inside the BARBERSHOP's glass, in the window's lower part, under the gold "HARBOR BARBERS" arch (it replaces the tiny
// OPEN card): the word in bold Deco tube capitals + a small neon KEYHOLE beside it (the wink), a thin tube border, on a dark backing
// board (so the neon reads at noon too). Hush words are 4 letters; it is SIZED FOR 5. Its letters never under HUSH.minPt tall (cap
// height, as the blade's letters are measured) on a 390 phone — the shop window was widened a little for that (8P).
// What it says (hushState): a lobby's word, lit day + night; no lobby → a plain neon OPEN while the shop is open by day, its glass
// unlit before the opening / after closing, dark at night. A new word re-lights letter by letter (strikeLevel).
import { LETTERS } from '../screens/district/marks.js';
import { flattenPath } from './tube-path.js';

/** the sign's proportions (× the cap height): a letter's width (condensed Deco), the gaps, the board's padding; sizeFor: the letters
 *  it is laid out for (4-letter words keep the 5-letter size, centred); margin: from the window's edges (wall units); minPt: the
 *  smallest cap height allowed on a 390 phone (pt) */
export const HUSH = Object.freeze({ lw: 0.56, gap: 0.1, kw: 0.34, kh: 0.74, kgap: 0.26, padX: 0.15, padY: 0.17, tube: 0.1, sizeFor: 5, margin: 0.08, foot: 0.07, maxCap: 1.2, minPt: 14,
  col: [255, 104, 62], key: [255, 196, 92] });
/** the keyhole (a 6 × 14 box, y down): a round head on a flared slot — one closed tube */
export const KEYHOLE = 'M1.6 7.2 A3 3 0 1 1 4.4 7.2 L5.6 14 H0.4 Z';

/**
 * The sign's layout in the shop front's WALL UNITS (u across, v up — the window [w0, w1, v0, v1]) for `text` →
 * { cap, board: [u0, u1, v0, v1], letters: [{ ch, u0, w, polys }], key: { u0, polys }, tube } — polys are polylines in wall units.
 * The size comes from sizeFor letters (so OPEN and a 4-letter word look the same size); a longer text shrinks to fit.
 */
export function hushPlan(text, win) {
  const H = HUSH, [w0, w1, v0] = win, s = String(text || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8);
  const n = Math.max(H.sizeFor, s.length), per = 2 * H.padX + H.kw + H.kgap + n * H.lw + (n - 1) * H.gap;
  const avail = w1 - w0 - 2 * H.margin, cap = Math.min(H.maxCap, avail / per);
  // the content's width for THIS text (centred on the window)
  const m = Math.max(1, s.length), wC = H.kw + H.kgap + m * H.lw + (m - 1) * H.gap, wB = (wC + 2 * H.padX) * cap;
  const mid = (w0 + w1) / 2, bu0 = mid - wB / 2, bv0 = v0 + H.foot, bv1 = bv0 + cap * (1 + 2 * H.padY);
  const base = bv0 + H.padY * cap;                   // the letters' foot
  const map = (pts, ox, sx) => pts.map(([x, y]) => [ox + x * sx, base + cap - y * cap / 14]);
  const ku0 = bu0 + H.padX * cap, kw = H.kw * cap;
  // (the keyhole SMALLER than a letter + set apart, centred on the letters' height: a symbol, never read as a letter — "ROPEN")
  const kh = H.kh * cap, kb = base + (cap - kh) / 2, kmap = pts => pts.map(([x, y]) => [ku0 + x * kw / 6, kb + kh - y * kh / 14]);
  const key = { u0: ku0, w: kw, polys: flattenPath(KEYHOLE, 1, 0, 0, 0.6).map(p => ({ ...p, pts: kmap(p.pts) })) };
  const lu0 = ku0 + kw + H.kgap * cap, lw = H.lw * cap, letters = [];
  [...s].forEach((ch, i) => {
    const u0 = lu0 + i * (lw + H.gap * cap), d = LETTERS[ch];
    letters.push({ ch, u0, w: lw, polys: d ? flattenPath(d, 1, 0, 0, 0.6).map(p => ({ ...p, pts: map(p.pts, u0, lw / 10) })) : [] });
  });
  return { text: s, cap, board: [bu0, bu0 + wB, bv0, bv1], letters, key, tube: H.tube * cap };
}

/**
 * What the sign shows now (PURE): { text, lit } — word: the lobby's hush word (null: no lobby), shop: the barbershop's state
 * ('open' | 'closed'), night: the lamps' ramp 0..1. A lobby's word is lit day + night; no lobby: OPEN lit while the shop is open by
 * day, unlit glass by day when closed, dark (lit 0) at night.
 */
export function hushState({ word = null, shop = 'open', night = 0 } = {}) {
  const w = String(word || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8);
  if (w) return { text: w, lit: 1 };
  return { text: 'OPEN', lit: shop === 'open' && night < 0.5 ? 1 : 0 };
}

/**
 * A letter re-lighting after the text changed (PURE): i = the letter (−1 = the keyhole, which comes on first), dt = s since the
 * change → 0..1. Each letter STRIKES in turn (every 0.28 s): two quick flickers, then on — the way a cold tube catches.
 */
export function strikeLevel(i, dt) {
  const t0 = 0.25 + (i + 1) * 0.28, u = dt - t0;
  if (u < 0) return 0;
  if (u > 0.36) return 1;
  return u < 0.07 ? 0.9 : u < 0.14 ? 0.15 : u < 0.2 ? 1 : u < 0.27 ? 0.3 : 1;
}
