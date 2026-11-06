// OVERCLOCK — ODD ONE OUT's FOUR FAMILIES (OC4 Group 1 — docs/overclock.md "ODD ONE OUT"). PURE: the catalogs, one grid's build, its night key,
// the one short "why" line THE ANSWER shows. Each of a challenge's three grids (4×4 · 5×5 · 6×6) comes from a DIFFERENT family (seeded):
//   0 LETTERS / NUMBERS — ~60 fair look-alike pairs in a monospace "coding" face (O/0, l/1, rn/m, 8/B …), three tiers (by the challenge's level)
//   1 ROTATION — one arrow / chevron / key / bracket / pin turned 25–45° among identical ones (never under 20° — the phone rule)
//   2 MIRROR   — one flipped asymmetric shape (a flag, a note, a boot, a bolt) among the same shape the right way round
//   3 NEON SHAPES — crafted tube icons: a ring's gap in another spot, a star missing a point, a die showing 5 among 6s (4 among 5s)
// NO "slightly different colour" family (colour-blind players). Every difference is a thick stroke or a clear angle at the 6×6 grid's ~50-pt
// cells on a 390-pt phone (tests/overclock-oc4.test.mjs). A grid = { size, fam, base, odd, idx } — base / odd are TOKENS (a glyph for the
// letters; 'shape@angle' for a turned shape; 'shape~@angle' = mirrored; 'gap@angle' · 'star5' / 'star4' · 'die6' / 'die5' for the neon icons).
import { randInt, pick, shuffle } from '../../core/rng.js';

export const ODD_FAMS = ['glyph', 'rot', 'mirror', 'shape'];
export const ODD_SIZES = [4, 5, 6];

// [one, the other, tier 0 easy · 1 medium · 2 hard] — either may be the odd one. Fair in a monospace face at a phone's cell size.
export const GLYPH_PAIRS = [
  ['O', 'Q', 0], ['E', 'F', 0], ['P', 'R', 0], ['C', 'G', 0], ['V', 'Y', 0], ['M', 'N', 0], ['T', 'Y', 0], ['U', 'V', 0], ['K', 'X', 0],
  ['H', 'N', 0], ['X', 'Y', 0], ['W', 'M', 0], ['F', 'P', 0], ['7', '1', 0], ['4', 'A', 0], ['L', 'J', 0], ['c', 'o', 0], ['v', 'y', 0],
  ['k', 'x', 0], ['f', 't', 0],
  ['b', 'd', 1], ['p', 'q', 1], ['6', '9', 1], ['u', 'v', 1], ['m', 'n', 1], ['h', 'n', 1], ['3', '8', 1], ['D', 'O', 1], ['i', 'j', 1],
  ['r', 'n', 1], ['g', 'q', 1], ['B', 'R', 1], ['a', 'o', 1], ['/', '\\', 1], ['{', '(', 1], ['[', '(', 1], ['R', 'K', 1], ['E', 'B', 1],
  ['0', '8', 1], ['S', '8', 1],
  ['O', '0', 2], ['l', '1', 2], ['I', 'l', 2], ['I', '1', 2], ['5', 'S', 2], ['8', 'B', 2], ['Z', '2', 2], ['G', '6', 2], ['e', 'c', 2],
  ['i', 'l', 2], ['6', 'b', 2], ['9', 'q', 2], ['rn', 'm', 2], ['cl', 'd', 2], ['vv', 'w', 2], [';', ':', 2], [',', '.', 2], ['!', '|', 2],
  ['Q', '0', 2], ['nn', 'm', 2],
];
// ROTATION: shapes with no turn that maps them onto themselves (an arrow, a chevron, a key, an L-bracket, a map pin)
export const ROT_SHAPES = ['arrow', 'chevron', 'key', 'bracket', 'pin'];
// MIRROR: shapes whose mirror image reads FLIPPED (each cell the same way up — only the flip differs)
export const MIRROR_SHAPES = ['flag', 'note', 'boot', 'bolt'];
// NEON SHAPES: a ring's gap (its angles drawn per grid) · a star missing a point · a die's 5 among 6s · its 4 among 5s
export const NEON_ODD = ['gap', 'star', 'die6', 'die5'];
// the angles a ROTATION grid turns its odd one by (per level band — bigger = easier); never under ODD_MIN_TURN
export const ODD_MIN_TURN = 20;
export const ROT_TURNS = [[40, 45], [30, 35, 40], [25, 30, 35]];
const band = level => (level < 0.4 ? 0 : level < 0.7 ? 1 : 2);

/** the glyph pairs a grid may use: its tier (from the level + the grid's place, as before — the later grids harder) */
export const glyphTier = (level, g) => Math.min(2, Math.floor(level * 1.6 + g * 0.6));
/** the catalog indices family `fam` offers grid g at this level */
export function oddPool(fam, level, g) {
  if (fam === 0) { const t = glyphTier(level, g); return GLYPH_PAIRS.map((p, i) => (p[2] === t ? i : -1)).filter(i => i >= 0); }
  if (fam === 1) return ROT_SHAPES.map((_, i) => i);
  if (fam === 2) return MIRROR_SHAPES.map((_, i) => i);
  return NEON_ODD.map((_, i) => i);
}
/** THE ROOM's NIGHT MEMORY key of a family's item (deal.js — one dash, database-safe): od-g<the pair's char codes> · od-r<shape> · od-m… · od-s… */
export function oddKey(fam, i) {
  if (fam === 0) { const p = GLYPH_PAIRS[i]; return p ? `od-g${[p[0], p[1]].map(c => [...c].map(x => x.charCodeAt(0).toString(36)).join('')).join('x')}` : ''; }
  return `od-${['g', 'r', 'm', 's'][fam]}${[null, ROT_SHAPES, MIRROR_SHAPES, NEON_ODD][fam][i]}`;
}

/** one grid: family `fam`, catalog item `i`, `size` × `size`, grid number g (0–2) — the seeded details (which glyph is the odd one, the
 *  angles, the cell) from `rand` */
export function oddGrid(rand, fam, i, size, level, g) {
  const cells = size * size;
  let base, odd, turn = 0;
  if (fam === 0) {
    const p = GLYPH_PAIRS[i] || GLYPH_PAIRS[0];
    const flip = rand() < 0.5;
    base = flip ? p[1] : p[0]; odd = flip ? p[0] : p[1];
  } else if (fam === 1) {
    const s = ROT_SHAPES[i] || ROT_SHAPES[0];
    const a0 = randInt(rand, 0, 23) * 15;
    turn = pick(rand, ROT_TURNS[band(level)]) * (rand() < 0.5 ? -1 : 1);
    base = `${s}@${a0}`; odd = `${s}@${(((a0 + turn) % 360) + 360) % 360}`;
  } else if (fam === 2) {
    const s = MIRROR_SHAPES[i] || MIRROR_SHAPES[0];
    const a0 = pick(rand, [0, 0, 90, 180, 270]);
    const flip = rand() < 0.5;   // either the plain or the mirrored one is the crowd
    base = `${s}${flip ? '~' : ''}@${a0}`; odd = `${s}${flip ? '' : '~'}@${a0}`;
  } else {
    const id = NEON_ODD[i] || NEON_ODD[0];
    if (id === 'gap') { const a0 = randInt(rand, 0, 7) * 45; const d = pick(rand, [90, 135, 180, 225, 270]); base = `gap@${a0}`; odd = `gap@${(a0 + d) % 360}`; }
    else if (id === 'star') { base = 'star5'; odd = 'star4'; }
    else if (id === 'die6') { base = 'die6'; odd = 'die5'; }
    else { base = 'die5'; odd = 'die4'; }
  }
  return { size, fam: ODD_FAMS[fam], base, odd, idx: randInt(rand, 0, cells - 1), ...(turn ? { turn } : {}) };
}

/** how many items family `fam` holds */
export const oddCatalogSize = fam => [GLYPH_PAIRS, ROT_SHAPES, MIRROR_SHAPES, NEON_ODD][fam]?.length || 0;
/** the three families of a challenge (3 different of the 4), seeded */
export const oddFamilies = rand => shuffle(rand, [0, 1, 2, 3]).slice(0, 3);

/** parse a token: 'arrow@30' → { shape: 'arrow', a: 30, m: false } · 'flag~@90' → mirrored · 'die6' → { shape: 'die6', a: 0 } */
export function oddToken(t) {
  const m = /^([a-z]+\d?)(~?)(?:@(-?\d+))?$/.exec(String(t));
  return m ? { shape: m[1], m: m[2] === '~', a: Number(m[3] || 0) } : null;
}

const NAMES = { arrow: 'arrow', chevron: 'chevron', key: 'key', bracket: 'bracket', pin: 'pin', flag: 'flag', note: 'note', boot: 'boot', bolt: 'bolt' };
/** THE ANSWER's one short line: what made it odd ("turned 30°", "a 5 among 6s", "the 0 among the Os") — PURE */
export function oddWhy(gr, glyphWhy = null) {
  if (!gr) return '';
  const fam = gr.fam || 'glyph';
  if (fam === 'glyph') return (glyphWhy && glyphWhy(gr.odd, gr.base)) || `the ${gr.odd} among the ${gr.base}s`;
  const b = oddToken(gr.base), o = oddToken(gr.odd);
  if (fam === 'rot') { const d = Math.abs(gr.turn || (((o.a - b.a + 540) % 360) - 180)); return `the ${NAMES[b.shape]} turned ${d}°`; }
  if (fam === 'mirror') return `the ${NAMES[b.shape]} flipped — a mirror image`;
  if (b.shape === 'gap') return 'its gap in a different spot';
  if (b.shape === 'star5') return 'a star missing a point';
  if (b.shape === 'die6') return 'a 5 among 6s';
  if (b.shape === 'die5') return 'a 4 among 5s';
  return 'the different one';
}
