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
  // (NEON PASS 3: ~6 % COLOURED ROOMS — a pink, a violet, a teal room among the warm ones, like City 1.0's night; offices a few too)
  const cls = bl.office ? (k < 0.66 ? 'cool' : k < 0.7 ? 'neon' : 'warm') : k < 0.06 ? 'tv' : k < 0.16 ? 'curtain' : k < 0.222 ? 'neon' : 'warm';
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
// ------------------------------------------------------------------ POLISH 4 — THE BIGGER FONTS (the owner: "BUY BTC" read as a jumble)
// Three more sizes for the word towers — a tower picks the BIGGEST that fits its face AND keeps a letter's natural shape once the
// window's own aspect is applied (fontsFor): wordA + wordB's windows are ~1.75× taller than their pitch is wide, so a 5×7 letter there
// would read as a skinny 0.4 — the 5 × 5 is the corrected 5 × 7 there (it reads as ~5 : 8.8); wordV's windows are square, so it takes
// the real 5 × 7. Every font draws every character of the 3 × 5 (tested).
const G4 = {   // the middle size: 4 wide (M, W, V, Y, T, I 5 / 3 wide), 5 tall
  A: ['.##.', '#..#', '####', '#..#', '#..#'], B: ['###.', '#..#', '###.', '#..#', '###.'], C: ['.###', '#...', '#...', '#...', '.###'],
  D: ['###.', '#..#', '#..#', '#..#', '###.'], E: ['####', '#...', '###.', '#...', '####'], F: ['####', '#...', '###.', '#...', '#...'],
  G: ['.###', '#...', '#.##', '#..#', '.###'], H: ['#..#', '#..#', '####', '#..#', '#..#'], I: ['###', '.#.', '.#.', '.#.', '###'],
  J: ['...#', '...#', '...#', '#..#', '.##.'], K: ['#..#', '#.#.', '##..', '#.#.', '#..#'], L: ['#...', '#...', '#...', '#...', '####'],
  M: ['#...#', '##.##', '#.#.#', '#...#', '#...#'], N: ['#..#', '##.#', '#.##', '#..#', '#..#'], O: ['.##.', '#..#', '#..#', '#..#', '.##.'],
  P: ['###.', '#..#', '###.', '#...', '#...'], Q: ['.##.', '#..#', '#..#', '#.#.', '.#.#'], R: ['###.', '#..#', '###.', '#.#.', '#..#'],
  S: ['.###', '#...', '.##.', '...#', '###.'], T: ['#####', '..#..', '..#..', '..#..', '..#..'], U: ['#..#', '#..#', '#..#', '#..#', '.##.'],
  V: ['#...#', '#...#', '#...#', '.#.#.', '..#..'], W: ['#...#', '#...#', '#.#.#', '##.##', '#...#'], X: ['#..#', '#..#', '.##.', '#..#', '#..#'],
  Y: ['#...#', '.#.#.', '..#..', '..#..', '..#..'], Z: ['####', '...#', '.##.', '#...', '####'],
  0: ['####', '#..#', '#..#', '#..#', '####'], 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['###.', '...#', '.##.', '#...', '####'],
  3: ['###.', '...#', '.##.', '...#', '###.'], 4: ['#..#', '#..#', '####', '...#', '...#'], 5: ['####', '#...', '###.', '...#', '###.'],
  6: ['.##.', '#...', '###.', '#..#', '.##.'], 7: ['####', '...#', '..#.', '.#..', '.#..'], 8: ['.##.', '#..#', '.##.', '#..#', '.##.'],
  9: ['.##.', '#..#', '.###', '...#', '.##.'], '!': ['#', '#', '#', '.', '#'], '?': ['###.', '...#', '.##.', '....', '.#..'],
  '-': ['...', '...', '###', '...', '...'], '.': ['.', '.', '.', '.', '#'], "'": ['#', '#', '.', '.', '.'],
  '♥': ['##.##', '#####', '#####', '.###.', '..#..'], '★': ['..#..', '#####', '.###.', '.#.#.', '#...#'],
  '⚑': ['#.#.#.#', '.#.####', '#.#.#.#', '#######', '.......'], ' ': ['..', '..', '..', '..', '..'],
};
const G5 = {   // 5 × 5: the corrected 5 × 7 for the tall-windowed towers (and a big letter anywhere)
  A: ['.###.', '#...#', '#####', '#...#', '#...#'], B: ['####.', '#...#', '####.', '#...#', '####.'], C: ['.####', '#....', '#....', '#....', '.####'],
  D: ['####.', '#...#', '#...#', '#...#', '####.'], E: ['#####', '#....', '####.', '#....', '#####'], F: ['#####', '#....', '####.', '#....', '#....'],
  G: ['.####', '#....', '#..##', '#...#', '.####'], H: ['#...#', '#...#', '#####', '#...#', '#...#'], I: ['###', '.#.', '.#.', '.#.', '###'],
  J: ['....#', '....#', '....#', '#...#', '.###.'], K: ['#...#', '#..#.', '###..', '#..#.', '#...#'], L: ['#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#...#', '#...#'], N: ['#...#', '##..#', '#.#.#', '#..##', '#...#'], O: ['.###.', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '####.', '#....', '#....'], Q: ['.###.', '#...#', '#.#.#', '#..#.', '.##.#'], R: ['####.', '#...#', '####.', '#..#.', '#...#'],
  S: ['.####', '#....', '.###.', '....#', '####.'], T: ['#####', '..#..', '..#..', '..#..', '..#..'], U: ['#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '.#.#.', '..#..'], W: ['#...#', '#...#', '#.#.#', '##.##', '#...#'], X: ['#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
  Y: ['#...#', '.#.#.', '..#..', '..#..', '..#..'], Z: ['#####', '...#.', '..#..', '.#...', '#####'],
  0: ['.###.', '#..##', '#.#.#', '##..#', '.###.'], 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['####.', '....#', '.###.', '#....', '#####'],
  3: ['####.', '....#', '.###.', '....#', '####.'], 4: ['#...#', '#...#', '#####', '....#', '....#'], 5: ['#####', '#....', '####.', '....#', '####.'],
  6: ['.###.', '#....', '####.', '#...#', '.###.'], 7: ['#####', '....#', '...#.', '..#..', '..#..'], 8: ['.###.', '#...#', '.###.', '#...#', '.###.'],
  9: ['.###.', '#...#', '.####', '....#', '.###.'], '!': ['#', '#', '#', '.', '#'], '?': ['.###.', '....#', '..##.', '.....', '..#..'],
  '-': ['....', '....', '####', '....', '....'], '.': ['.', '.', '.', '.', '#'], "'": ['#', '#', '.', '.', '.'],
  // (the symbols WIDE on the tall windows: 7 × 5 reads as a round heart / a star once the windows' aspect stretches it)
  '♥': ['.##.##.', '#######', '.#####.', '..###..', '...#...'], '★': ['...#...', '#######', '.#####.', '.##.##.', '##...##'],
  '⚑': ['#.#.#.#', '.#.####', '#.#.#.#', '#######', '.......'], ' ': ['...', '...', '...', '...', '...'],
};
const G7 = {   // 5 × 7 — the classic LCD letter, for square windows (wordV)
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'], B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'], D: ['###..', '#..#.', '#...#', '#...#', '#...#', '#..#.', '###..'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'], F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'], H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '###'], J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'], L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'], N: ['#...#', '#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'], P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'], R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'], T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'], V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '#.#.#', '.#.#.'], X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'], Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  0: ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'], 1: ['.#.', '##.', '.#.', '.#.', '.#.', '.#.', '###'],
  2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'], 3: ['#####', '...#.', '..#..', '...#.', '....#', '#...#', '.###.'],
  4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'], 5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  6: ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'], 7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'], 9: ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
  '!': ['#', '#', '#', '#', '#', '.', '#'], '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
  '-': ['....', '....', '....', '####', '....', '....', '....'], '.': ['.', '.', '.', '.', '.', '.', '#'], "'": ['#', '#', '.', '.', '.', '.', '.'],
  '♥': ['.##.##.', '#######', '#######', '#######', '.#####.', '..###..', '...#...'], '★': ['...#...', '..###..', '#######', '.#####.', '..###..', '.##.##.', '##...##'],
  '⚑': ['#.#.####', '.#.#....', '#.#.####', '........', '########', '........', '########'], ' ': ['...', '...', '...', '...', '...', '...', '...'],
};
/** the fonts, smallest first: s 3 × 5 (the original), m 4 × 5, l 5 × 5, x 5 × 7 */
export const FONTS = Object.freeze({ s: { id: 's', g: G, h: 5 }, m: { id: 'm', g: G4, h: 5 }, l: { id: 'l', g: G5, h: 5 }, x: { id: 'x', g: G7, h: 7 } });
const fontOf = f => (f && f.g ? f : FONTS[f] || FONTS.s);
/** a letter's typical width in a font (its A) */
const fontW = f => fontOf(f).g.A[0].length;
/**
 * The fonts a face may use, biggest first (POLISH 4): its windows' aspect `ar` (pitch height ÷ width: ~1.75 on wordA + wordB, ~1 on
 * wordV) turns a glyph's w × h into what the eye sees; a font stays in the list only while its letters keep a natural shape there
 * (seen aspect 0.44 … 1.02 — never a skinny stretched letter, never a squat one); the original 3 × 5 always last (the fallback).
 */
export function fontsFor(face) {
  const ar = face && face.ar > 0 ? face.ar : 1.75;
  const seen = f => (fontW(f) / f.h) / ar;
  const big = [FONTS.x, FONTS.l, FONTS.m].filter(f => seen(f) >= 0.44 && seen(f) <= 1.02).sort((a, b) => fontW(b) * b.h - fontW(a) * a.h);
  return [...big, FONTS.s];
}

export const FONT = G;
export const FONT_H = 5;
const ALIAS = { '<3': '♥', '*': '★', HEART: '♥', STAR: '★', FLAG: '⚑' };
/** the glyph of a character in a font (default the 3 × 5; unknown characters are skipped) */
export const glyph = (ch, f) => { const g = fontOf(f).g; return g[ch] || g[String(ch).toUpperCase()] || null; };
/** normalise a message: upper case, the aliases (<3 → ♥, * → ★, [flag] → ⚑) */
export function normText(s, max = 40) {
  let t = String(s || '').toUpperCase().slice(0, max);
  t = t.replace(/<3/g, '♥').replace(/\*/g, '★').replace(/\[FLAG\]/g, '⚑').replace(/\[HEART\]/g, '♥').replace(/\[STAR\]/g, '★');
  return [...t].filter(ch => G[ch]).join('').replace(/ +/g, ' ').trim();     // (7a §0: a dropped character leaves no double space)
}
/** a line's width in columns (1 column between glyphs) in a font */
export const lineWidth = (line, f) => [...line].reduce((w, ch, i) => w + glyph(ch, f)[0].length + (i ? 1 : 0), 0);

/** the lit cells of a line in a font, left-aligned from (0, 0) at the top-left: [[col, row], …] (row 0 = the top) */
export function lineCells(line, f) {
  const out = [];
  let x = 0;
  [...line].forEach((ch, i) => {
    const g = glyph(ch, f); if (i) x += 1;
    g.forEach((row, r) => [...row].forEach((v, c) => { if (v === '#') out.push([x + c, r]); }));
    x += g[0].length;
  });
  return out;
}

/**
 * Lay out a message on the word towers. towers: { id: { cols, rows, word: 'h'|'v', ar? (the windows' aspect: pitch h ÷ w) } }.
 * Returns [{ tower, cells: [[col, row-from-the-face-top], …], rows: the rows the message uses, font }] or null if it can't fit.
 *   vertical (a 'v' tower): one letter under the other, a row between — "JOY", "BOO", "USA", a short name
 *   horizontal: one line on A; else two lines on A; else across A and B (the first word(s) on A, the rest on B), each centred
 * Each part in the BIGGEST font that fits its face and reads right there (fontsFor — POLISH 4). opts.tower forces a tower.
 */
export function layoutText(text, towers, opts = {}) {
  const t = normText(text);
  if (!t) return null;
  const V = towers.wordV, A = towers.wordA, B = towers.wordB;
  const centre = (cells, cols, w, rowOff) => cells.map(([c, r]) => [c + Math.floor((cols - w) / 2), r + rowOff]);
  const vertical = tw => {
    if (!tw) return null;
    const chars = [...t.replace(/ /g, '')];
    for (const f of fontsFor(tw)) {
      const need = chars.length * f.h + (chars.length - 1);
      if (need > tw.rows || chars.some(ch => glyph(ch, f)[0].length > tw.cols)) continue;
      const top = Math.max(0, Math.floor((tw.rows - need) / 2));
      const cells = chars.flatMap((ch, i) => centre(lineCells(ch, f), tw.cols, glyph(ch, f)[0].length, top + i * (f.h + 1)));
      return [{ tower: 'wordV', cells, rows: need, text: chars.join(''), font: f.id }];
    }
    return null;
  };
  const oneLine = (line, tw, id) => {
    if (!tw) return null;
    for (const f of fontsFor(tw)) {
      const w = lineWidth(line, f); if (w > tw.cols || f.h > tw.rows) continue;
      const top = Math.max(0, Math.floor((tw.rows - f.h) / 2));
      return { tower: id, cells: centre(lineCells(line, f), tw.cols, w, top), rows: f.h, text: line, font: f.id };
    }
    return null;
  };
  const twoLines = (l1, l2, tw, id) => {
    if (!tw) return null;
    for (const f of fontsFor(tw)) {
      const w1 = lineWidth(l1, f), w2 = lineWidth(l2, f);
      if (Math.max(w1, w2) > tw.cols || 2 * f.h + 1 > tw.rows) continue;
      const top = Math.max(0, Math.floor((tw.rows - 2 * f.h - 1) / 2));
      return { tower: id, cells: [...centre(lineCells(l1, f), tw.cols, w1, top), ...centre(lineCells(l2, f), tw.cols, w2, top + f.h + 1)], rows: 2 * f.h + 1, text: `${l1} / ${l2}`, font: f.id };
    }
    return null;
  };
  if (opts.tower === 'wordV') return vertical(V);
  if (opts.tower === 'wordA' || opts.tower === 'wordB') { const r = oneLine(t, towers[opts.tower], opts.tower); return r ? [r] : null; }
  // a short word of letters reads best down the tall tower ("JOY", "BOO", "USA")
  if (!opts.tower && /^[A-Z]{2,4}$/.test(t) && opts.vertical !== false) { const v = vertical(V); if (v) return v; }
  const one = oneLine(t, A, 'wordA'); if (one) return [one];
  const words = t.split(' ').filter(Boolean);
  // (POLISH 4: two words that each stand on a tower of their own in a BIG font go across A + B before two small lines on A —
  // "BUY BTC": BUY on A, BTC on B, each as big as its face allows)
  const big = p => p && p.font !== 's';
  if (words.length === 2) { const a = oneLine(words[0], A, 'wordA'), b = oneLine(words[1], B, 'wordB'); if (big(a) && big(b)) return [a, b]; }
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
 *  1 blank column between glyphs; up to 120 characters; in a font (POLISH 4: the biggest the face's rows + windows take) */
export function scrollColumns(text, f) {
  const t = normText(text, 120);
  const w = t ? lineWidth(t, f) : 0, cols = new Array(w).fill(0);
  for (const [c, r] of lineCells(t, f)) cols[c] |= 1 << r;
  return { text: t, cols, h: fontOf(f).h };
}

// ------------------------------------------------------------------ PART 7a §0 — THE WORD TOWERS from the panel: capacity + the fit
/** the word towers' faces on every phone + desktop today (harbor.test.mjs checks them against the layout): the panel's fallback
 *  when the live faces (harbor().windows.faces) aren't there */
export const WORD_FACES = { wordA: { cols: 19, rows: 11, word: 'h', ar: 1.75 }, wordB: { cols: 15, rows: 9, word: 'h', ar: 1.75 }, wordV: { cols: 5, rows: 18, word: 'v', ar: 0.97 } };
/** the tower choices: AUTO (layoutText: the best layout, else ONE WORD PER TOWER on A + B), one tower, or a list of towers (one
 *  word each, in order; the last takes the rest) — a word too long for its tower SCROLLS on it */
export const TOWER_CHOICES = ['', 'wordA', 'wordB', 'wordV', 'wordA,wordB', 'wordA,wordB,wordV'];
/** the characters the window font draws (+ what to type for the symbols) */
export const FONT_CHARS = Object.keys(G).filter(ch => ch !== ' ');
export const FONT_ALIASES = { '♥': '<3', '★': '*', '⚑': '[flag]' };
/** a tower's room: { word, cols, rows, lines (h: lines of text it holds), letters (a line's 3-column letters: most letters — M W N Q ♥ ★
 *  are wider, I ! . ' narrower) } — vertical: letters = one under the other */
export function towerCapacity(towers) {
  const out = {};
  for (const [id, f] of Object.entries(towers || {})) {
    if (!f || !f.cols || !f.rows) continue;
    if (f.word === 'v') out[id] = { word: 'v', cols: f.cols, rows: f.rows, lines: 1, letters: f.cols >= 3 ? Math.floor((f.rows + 1) / (FONT_H + 1)) : 0 };
    else { const lines = Math.floor((f.rows + 1) / (FONT_H + 1)); out[id] = { word: 'h', cols: f.cols, rows: f.rows, lines, letters: lines ? Math.floor((f.cols + 1) / 4) : 0 }; }
  }
  return out;
}
/** the characters of a message the font can't draw (after the aliases) */
export function badChars(s) {
  const t = String(s || '').toUpperCase().replace(/<3/g, '').replace(/\*/g, '').replace(/\[(FLAG|HEART|STAR)\]/g, '');
  return [...new Set([...t].filter(ch => ch !== ' ' && !G[ch]))];
}
/** does a word stand on a tower (no scroll)? h: one line in its columns; v: its letters one under the other */
function standsOn(word, f) {
  if (!f) return false;
  if (f.word === 'v') { const ch = [...word.replace(/ /g, '')]; return ch.length > 0 && ch.length * FONT_H + ch.length - 1 <= f.rows && ch.every(c => glyph(c)[0].length <= f.cols); }
  return lineWidth(word) <= f.cols && FONT_H <= f.rows;
}
/**
 * What a message does on the towers — the panel's live readout and lights.js#spell share it.
 * → { text, bad: [characters dropped], mode: 'layout' (layoutText placed it) | 'split' (one word per tower) | 'scroll' (one tower's
 *   ticker), plan: [{ tower, text, letters, cap (the tower's letters a line), fits (stands still), scroll }] } — null for no text.
 * tower: a TOWER_CHOICES value (or one id / a comma list).
 */
export function fitText(text, towers, tower = '') {
  const t = normText(text, 120);
  if (!t) return null;
  const bad = badChars(text), cap = towerCapacity(towers);
  const list = String(tower || '').split(',').filter(id => towers[id]);
  const count = w => [...w.replace(/ /g, '')].length;
  const entry = (id, w, still) => ({ tower: id, text: w, letters: count(w), cap: cap[id] ? cap[id].letters * (still && cap[id].word === 'h' && w.includes(' / ') ? 2 : 1) : 0, fits: still, scroll: !still });
  if (list.length <= 1) {
    const lay = t.length <= 40 ? layoutText(t, towers, list[0] ? { tower: list[0] } : {}) : null;
    if (lay) return { text: t, bad, mode: 'layout', plan: lay.map(p => entry(p.tower, p.text, true)) };
    // one tower asked for: its ticker (a vertical tower's word that doesn't stand: the ticker on A — the narrow face is no ticker)
    if (list[0]) { const id = towers[list[0]].word === 'h' ? list[0] : 'wordA'; return { text: t, bad, mode: 'scroll', plan: [entry(id, t, false)] }; }
  }
  // ONE WORD PER TOWER (AUTO when nothing else fits: A then B) — the last tower takes the rest; a word too long for its tower scrolls
  const ids = list.length > 1 ? list : ['wordA', 'wordB'].filter(id => towers[id]);
  const words = t.split(' ').filter(Boolean), n = Math.min(words.length, ids.length);
  const plan = [];
  for (let i = 0; i < n; i++) {
    const w = i === n - 1 ? words.slice(i).join(' ') : words[i], id = ids[i];
    plan.push(entry(id, w, standsOn(w, towers[id])));
  }
  return { text: t, bad, mode: n === 1 && plan[0].scroll ? 'scroll' : 'split', plan };
}

/** the words the scheduler's random `spell` event may light (night only; rare — never the same two nights running) */
export const SPELL_WORDS = ['♥', '★', 'HI', 'JAZZ', 'NEON', 'JOY', '♥ ♥'];
