// PRISM DROP — THE DAY LOOK's COLOURS + PAPERS (PD-4 — the owner's decisions: docs/games/plan.md "PD-4"). PURE (no DOM: the tests run in node).
// THE CRAYONS: the SAME colour families as the night (board.js's JEWEL hues — the long piece cyan-ish, the square yellow-ish…) in crayon shades, so
// a piece learned at night is recognised by day (tests/prism-crayon.test.mjs: the hue-family test of PD-3 + a contrast check against every paper).
// THE PAPERS: four pages — notepad · graph paper · construction paper · a coloring page. The HOST deals ONE per match at start() (`game.pp`): the
// same page for everyone in the room, a different one every match (a rotation through all four, never the same twice in a row) — remembered in THE
// NIGHT'S MEMORY (meta/used/prism: `pp<k>-<i>` = the k-th PRISM match tonight drew paper i; no rules change — kit/night.js).
//   CRAYON · CRAYON_LINE (each crayon's outline) · GRAPHITE · PAPERS · PAPER_IDS · paperOf(game) · pickPaper(seed, used) → { i, key }
//   outlineOf(hex) · contrast(a, b) (WCAG) · lum(hex)
import { mixHex, hexRgb } from './neon.js';

// the crayons: 1 long (turquoise) · 2 square (yellow) · 3 twist (violet) · 4 S (green) · 5 Z (red) · 6 J (blue) · 7 L (orange) · 8 junk (graphite)
export const CRAYON = Object.freeze([null, '#14b2c6', '#f4b81a', '#8a4fd8', '#24a457', '#e2334f', '#2f63d4', '#f27822', '#6e727c']);
const INK = '#1a1424';
/** a crayon's outline: the same crayon pressed harder (a darker shade of its own colour) */
export const outlineOf = hex => mixHex(hex, INK, 0.45);
export const CRAYON_LINE = Object.freeze(CRAYON.map(c => (c ? outlineOf(c) : c)));
export const GRAPHITE = '#4a4e57';   // the pencil: the frame, the grid, the ghost, the incoming rows

// the papers — `base` = the grain file's colour (scripts/build-prism-paper.py — keep them in step), `ink` = the page's text (dark pencil-grey,
// ≥ 4.5:1 on its base), `rule` = what's drawn on it (page.js), `doodle` = how the world's doodle is drawn ('colour' crayon or 'outline' — a
// coloring book's black lines), `well` = the board's wash over the doodle (0 = the page itself, 1 = the doodle hidden)
export const PAPERS = Object.freeze([
  Object.freeze({ id: 'notepad', name: 'NOTEPAD', file: 'notepad.webp', base: '#fbf7ea', ink: '#3a3d45', rule: 'lines', line: '#8fb2df', margin: '#e58593', doodle: 'colour', well: 0.7 }),
  Object.freeze({ id: 'graph', name: 'GRAPH PAPER', file: 'graph.webp', base: '#f3f7f5', ink: '#373c44', rule: 'grid', line: '#93c4bb', major: '#6fa99e', doodle: 'colour', well: 0.7 }),
  Object.freeze({ id: 'construction', name: 'CONSTRUCTION PAPER', file: 'construction.webp', base: '#cdd6de', ink: '#262a31', rule: 'none', doodle: 'colour', well: 0.68 }),
  Object.freeze({ id: 'coloring', name: 'COLORING PAGE', file: 'coloring.webp', base: '#f8f6f1', ink: '#33363d', rule: 'frame', line: '#2a2c31', doodle: 'outline', well: 0.7 }),
]);
export const PAPER_IDS = PAPERS.map(p => p.id);

/** the match's paper: the host's deal (`game.pp`), else (a game from before PD-4) one from its seed — the same on every phone */
export function paperOf(game) {
  const i = game && Number.isInteger(game.pp) && PAPERS[game.pp] ? game.pp : hash(String((game && game.seed) || '')) % PAPERS.length;
  return PAPERS[i];
}

/**
 * THE HOST's deal at start(): a rotation through all four papers (never the same twice in a row), seeded by the match.
 * used = meta/used/prism ({ key: true }) — this room's night memory; returns { i, key } (key → `markUsed('prism', [key])`).
 */
export function pickPaper(seed, used = {}) {
  const past = Object.keys(used || {}).map(k => /^pp(\d+)-(\d)$/.exec(k)).filter(Boolean)
    .map(m => ({ k: Number(m[1]), i: Number(m[2]) })).filter(x => x.i < PAPERS.length).sort((a, b) => a.k - b.k);
  const n = past.length;
  const last = n ? past[n - 1].i : -1;
  // the current round of four: the papers already drawn since the last full round
  const round = new Set(past.slice(n - (n % PAPERS.length)).map(x => x.i));
  let pool = PAPER_IDS.map((_, i) => i).filter(i => !round.has(i) && i !== last);
  if (!pool.length) pool = PAPER_IDS.map((_, i) => i).filter(i => i !== last);
  const i = pool[hash(String(seed)) % pool.length];
  return { i, key: `pp${n}-${i}` };
}

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// ---- the contrast check's measure (WCAG relative luminance + ratio)
const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
export const lum = hex => { const [r, g, b] = hexRgb(hex).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
