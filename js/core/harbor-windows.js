// CITY 2.0 — THE HARBOR: ADDRESSABLE WINDOWS + WORDS IN THE WINDOWS (PURE: no DOM; tests/harbor.test.mjs). docs/harbor.md.
//
// Every skyline building (a band block, a tower's tier, a hero block on the quay) carries a window grid from the layout
// (`win: { cols, rows, u0, v0, pitch: [pu, pv] }`, world units from the face's left edge and its foot). A window is addressed
// by (building, tier, col, row) and its own dice come from the building's seed + its cell — never from its size or its place
// on the screen, so a relayout never re-rolls the city's windows.
//
// THE LIGHT TIMELINE is City 1.0's exactly (district/scene.js + palette.js + core/sky.js#lateK): each window that can ever
// light has one uniform random ORDER; it is lit when order ≤ the hour's share (palette `P.win`: 1 at night, LATE 0.32 in the
// small hours, DAWN 0.22, GOLDEN 0.5, DAY 0 — so lights come on in that order at dusk, go out in the reverse order through
// the night, the same few kitchens light before dawn, and party nights stay lit till 2 am). ALWAYS NIGHT: share 1.
import { hashString } from './rng.js';

const U32 = 4294967296;
/** a window's dice: 0..1 from the building's seed, the tier, the cell and a channel (k: 0 = order, 1 = colour, 2 = …) */
export function winHash(seed, t, c, r, k = 0) {
  let h = (seed ^ Math.imul(t + 1, 0x9e3779b1) ^ Math.imul(c + 7, 0x85ebca6b) ^ Math.imul(r + 13, 0xc2b2ae35) ^ Math.imul(k + 3, 0x27d4eb2f)) >>> 0;
  h ^= h >>> 16; h = Math.imul(h, 0x7feb352d) >>> 0; h ^= h >>> 15; h = Math.imul(h, 0x846ca68b) >>> 0; h ^= h >>> 16;
  return (h >>> 0) / U32;
}

/**
 * A window's character (stable): can it ever light (the building's lit share, a whole lit floor now and then, the
 * stripe buildings' gaps), its ORDER on the timeline, its colour class (warm tungsten · a few cool TV-blue · a few curtained
 * · rarely neon) and its brightness. bl = the building's own dice: { lit: share, floor: whole-floor chance, office: cool }.
 */
export function winTraits(seed, t, c, r, bl) {
  const can = winHash(seed, t, 0, r, 9) < (bl.floor || 0.07) || winHash(seed, t, c, r, 1) < bl.lit;
  if (!can) return null;
  const k = winHash(seed, t, c, r, 2);
  const cls = bl.office ? (k < 0.7 ? 'cool' : 'warm') : k < 0.06 ? 'tv' : k < 0.16 ? 'curtain' : k < 0.165 ? 'neon' : 'warm';
  return { order: winHash(seed, t, c, r, 0), cls, a: 0.55 + 0.45 * winHash(seed, t, c, r, 3), tone: winHash(seed, t, c, r, 4) };
}
/** a building's own dice (its lit share by depth, as City 1.0's layers: nearer rows show a little less of their windows) */
export function buildingDice(seed, rank) {
  const d = (k) => winHash(seed, 99, k, 0, 7);
  const base = rank === 'modern' ? 0.62 : rank === 'quay' ? 0.6 : 0.5;
  return { lit: Math.min(0.95, base * (0.6 + d(1) * 0.8)), floor: rank === 'modern' ? 0.18 : 0.07, office: rank === 'modern' || d(2) < 0.12 };
}
/** is a window lit at the hour's share (P.win)? the light timeline in one line */
export const isLit = (traits, share) => !!traits && traits.order <= share;

// ------------------------------------------------------------------ the pixel font (5 rows; letters 3–5 columns wide)
// '#' = a lit window. Digits and most letters are 3 wide; M, N, W, Q and the symbols wider. A heart, a star, a flag.
const G = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], C: ['.##', '#..', '#..', '#..', '.##'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'], E: ['###', '#..', '##.', '#..', '###'], F: ['###', '#..', '##.', '#..', '#..'],
  G: ['.##', '#..', '#.#', '#.#', '.##'], H: ['#.#', '#.#', '###', '#.#', '#.#'], I: ['###', '.#.', '.#.', '.#.', '###'],
  J: ['..#', '..#', '..#', '#.#', '.#.'], K: ['#.#', '#.#', '##.', '#.#', '#.#'], L: ['#..', '#..', '#..', '#..', '###'],
  M: ['#...#', '##.##', '#.#.#', '#...#', '#...#'], N: ['#..#', '##.#', '#.##', '#..#', '#..#'], O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
  P: ['##.', '#.#', '##.', '#..', '#..'], Q: ['.#..', '#.#.', '#.#.', '#.#.', '.#.#'], R: ['##.', '#.#', '##.', '#.#', '#.#'],
  S: ['.##', '#..', '.#.', '..#', '##.'], T: ['###', '.#.', '.#.', '.#.', '.#.'], U: ['#.#', '#.#', '#.#', '#.#', '###'],
  V: ['#.#', '#.#', '#.#', '#.#', '.#.'], W: ['#...#', '#...#', '#.#.#', '#.#.#', '.#.#.'], X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'], Z: ['###', '..#', '.#.', '#..', '###'],
  0: ['###', '#.#', '#.#', '#.#', '###'], 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['##.', '..#', '.#.', '#..', '###'],
  3: ['##.', '..#', '.#.', '..#', '##.'], 4: ['#.#', '#.#', '###', '..#', '..#'], 5: ['###', '#..', '##.', '..#', '##.'],
  6: ['.##', '#..', '###', '#.#', '###'], 7: ['###', '..#', '.#.', '.#.', '.#.'], 8: ['###', '#.#', '###', '#.#', '###'],
  9: ['###', '#.#', '###', '..#', '##.'], '!': ['#', '#', '#', '.', '#'], '?': ['##.', '..#', '.#.', '...', '.#.'],
  '-': ['...', '...', '###', '...', '...'], '.': ['.', '.', '.', '.', '#'], "'": ['#', '#', '.', '.', '.'],
  '♥': ['##.##', '#####', '#####', '.###.', '..#..'], '★': ['..#..', '#####', '.###.', '.#.#.', '#...#'],
  '⚑': ['#.#.#.#', '.#.####', '#.#.#.#', '#######', '.......'],   // the flag: the canton top-left, the stripes (Part 10 colours it)
  ' ': ['..', '..', '..', '..', '..'],
};
export const FONT = G;
export const FONT_H = 5;
const ALIAS = { '<3': '♥', '*': '★', HEART: '♥', STAR: '★', FLAG: '⚑' };
/** the glyph of a character (unknown characters are skipped) */
export const glyph = ch => G[ch] || G[String(ch).toUpperCase()] || null;
/** normalise a message: upper case, the aliases (<3 → ♥, * → ★, [flag] → ⚑) */
export function normText(s, max = 40) {
  let t = String(s || '').toUpperCase().slice(0, max);
  t = t.replace(/<3/g, '♥').replace(/\*/g, '★').replace(/\[FLAG\]/g, '⚑').replace(/\[HEART\]/g, '♥').replace(/\[STAR\]/g, '★');
  return [...t].filter(ch => G[ch]).join('');
}
/** a line's width in columns (1 column between glyphs) */
export const lineWidth = line => [...line].reduce((w, ch, i) => w + glyph(ch)[0].length + (i ? 1 : 0), 0);

/** the lit cells of a line, left-aligned from (0, 0) at the top-left: [[col, row], …] (row 0 = the top) */
export function lineCells(line) {
  const out = [];
  let x = 0;
  [...line].forEach((ch, i) => {
    const g = glyph(ch); if (i) x += 1;
    g.forEach((row, r) => [...row].forEach((v, c) => { if (v === '#') out.push([x + c, r]); }));
    x += g[0].length;
  });
  return out;
}

/**
 * Lay out a message on the word towers. towers: { id: { cols, rows, word: 'h'|'v' } } (the face: its free rows from the top).
 * Returns [{ tower, cells: [[col, row-from-the-face-top], …], rows: the rows the message uses }] or null if it can't fit.
 *   vertical (a 'v' tower): one letter under the other, a row between — "JOY", "BOO", "USA", a short name
 *   horizontal: one line on A; else two lines on A; else across A and B (the first word(s) on A, the rest on B), each centred
 * opts.tower forces a tower ('wordA' | 'wordB' | 'wordV').
 */
export function layoutText(text, towers, opts = {}) {
  const t = normText(text);
  if (!t) return null;
  const V = towers.wordV, A = towers.wordA, B = towers.wordB;
  const centre = (cells, cols, w, rowOff) => cells.map(([c, r]) => [c + Math.floor((cols - w) / 2), r + rowOff]);
  const vertical = tw => {
    const chars = [...t.replace(/ /g, '')];
    const need = chars.length * FONT_H + (chars.length - 1);
    if (!tw || need > tw.rows || chars.some(ch => glyph(ch)[0].length > tw.cols)) return null;
    const top = Math.max(0, Math.floor((tw.rows - need) / 2));
    const cells = chars.flatMap((ch, i) => centre(lineCells(ch), tw.cols, glyph(ch)[0].length, top + i * (FONT_H + 1)));
    return [{ tower: 'wordV', cells, rows: need }];
  };
  const oneLine = (line, tw, id) => {
    const w = lineWidth(line); if (!tw || w > tw.cols || FONT_H > tw.rows) return null;
    const top = Math.max(0, Math.floor((tw.rows - FONT_H) / 2));
    return { tower: id, cells: centre(lineCells(line), tw.cols, w, top), rows: FONT_H };
  };
  const twoLines = (l1, l2, tw, id) => {
    const w1 = lineWidth(l1), w2 = lineWidth(l2);
    if (!tw || Math.max(w1, w2) > tw.cols || 2 * FONT_H + 1 > tw.rows) return null;
    const top = Math.max(0, Math.floor((tw.rows - 2 * FONT_H - 1) / 2));
    return { tower: id, cells: [...centre(lineCells(l1), tw.cols, w1, top), ...centre(lineCells(l2), tw.cols, w2, top + FONT_H + 1)], rows: 2 * FONT_H + 1 };
  };
  if (opts.tower === 'wordV') return vertical(V);
  if (opts.tower === 'wordA' || opts.tower === 'wordB') { const r = oneLine(t, towers[opts.tower], opts.tower); return r ? [r] : null; }
  // a short word of letters reads best down the tall tower ("JOY", "BOO", "USA")
  if (!opts.tower && /^[A-Z]{2,4}$/.test(t) && opts.vertical !== false) { const v = vertical(V); if (v) return v; }
  const one = oneLine(t, A, 'wordA'); if (one) return [one];
  const words = t.split(' ').filter(Boolean);
  for (let i = 1; i < words.length; i++) {
    const l1 = words.slice(0, i).join(' '), l2 = words.slice(i).join(' ');
    const two = twoLines(l1, l2, A, 'wordA'); if (two) return [two];
  }
  // across the two towers: A takes the first word(s) (one or two lines), B the rest
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i), b = words.slice(i).join(' ');
    const onB = oneLine(b, B, 'wordB'); if (!onB) continue;
    let onA = oneLine(a.join(' '), A, 'wordA');
    if (!onA && a.length > 1) for (let j = 1; j < a.length && !onA; j++) onA = twoLines(a.slice(0, j).join(' '), a.slice(j).join(' '), A, 'wordA');
    if (onA) return [onA, onB];
  }
  return vertical(V);
}

/** a message as columns for THE SCROLL (a ticker across a tower's face): one bitmask per column (bit r = row r from the top),
 *  1 blank column between glyphs; up to 120 characters */
export function scrollColumns(text) {
  const t = normText(text, 120);
  const w = t ? lineWidth(t) : 0, cols = new Array(w).fill(0);
  for (const [c, r] of lineCells(t)) cols[c] |= 1 << r;
  return { text: t, cols };
}

/** the words the scheduler's random `spell` event may light (night only; rare — never the same two nights running) */
export const SPELL_WORDS = ['♥', '★', 'HI', 'JAZZ', 'NEON', 'JOY', '♥ ♥'];
