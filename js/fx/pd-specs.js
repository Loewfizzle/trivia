// PD-5B — PRISM DROP's THREE CARDS as data (PURE — no imports; js/fx/pd-cards.js draws them, vault/hero.js + vault/layout.js read the hero
// boxes, tests/prism-cards.test.mjs checks them). DRAWN IN CODE in the night's NEON (PD-3: solid dark cores, crisp hot tubes, each piece's
// colour family — the long piece cyan, the square yellow, the twist violet, S green, Z red, J blue, L orange).
// Each card is ONE SCENE of PD_W × PD_H units (a full card's shape). The FULL card covers it a little smaller + flush right (the scene's dark
// left for the name — like PENTHOUSE · THE DIAL); the SLIM strip has its OWN band (`band` — fractions of the scene's height) at the strip's
// height, the hero's centre (`focus`) set at `cx` across (THE SLIM-CARD LONG-NAME STANDARD: 0.75–0.85), clear of the gem's corner.
//   hero     [x, y, w, h] — the strip's MAIN FEATURE (scene units — THE HERO-SPOT RULE: vault/hero.js maps it through the strip's band)
//   heroFull [x, y, w, h] — the full card's (THE PLATE PLACEMENT RULE keeps the plate off it — vault/layout.js)
export const PD_W = 1000, PD_H = 630;
/** the full card's scene scale (smaller than cover, set flush right — the name fits on ONE line left of the hero) */
export const PD_FULL_Z = 0.9;
/** one cell of the scenes' wells (scene units) */
export const CELL = 46;
/** the night's piece colours (= games/prism/neon.js NEON_BASE — the colour families: 1 long cyan · 2 square yellow · 3 twist violet · 4 S green ·
 *  5 Z red · 6 J blue · 7 L orange; checked equal by tests/prism-cards.test.mjs) + the SPECTRUM (the seven by hue — PERFECT CLEAR's rainbow) */
export const PD_COL = Object.freeze([null, '#2be4f0', '#ffc93a', '#b46bff', '#2fe07a', '#ff4d6d', '#4a86ff', '#ff9b3d']);
export const SPECTRUM = Object.freeze([5, 7, 2, 4, 1, 6, 3].map(i => PD_COL[i]));
export const PD_SPECS = Object.freeze({
  // FIRST KO (common): ONE big neon block (the long piece's cyan) on a dim stack — it CRACKS, BURSTS into shards with a "KO" flash, re-forms
  'card-first-ko': {
    block: { x: 760, y: 262, s: 176, sFull: 214, col: '#2be4f0' },   // the block's centre + side (bigger on the full card)
    ko: { x: 752, y: 262, h: 110, hFull: 136 },                              // the KO lettering (over the block, popped at the burst)
    well: { x0: 575, x1: 945, floor: 500 },                     // the dim stack under it (full card only — clear of the card's printed name)
    band: [0.23, 0.595], focus: 760, cx: 0.8,
    hero: [664, 166, 192, 192],
    heroFull: [620, 120, 290, 390],
  },
  // PERFECT CLEAR (rare): the EMPTY well, spotless — a beam of white light through a glass prism at its mouth splits into the pieces' colours +
  // a rainbow sweeps down + across the clean well, lighting its walls; glints on the clean floor
  'card-perfect-clear': {
    well: { x0: 640, x1: 880, top: 250, floor: 478 },            // the well's inner box (wider than tall — it reads at slim size)
    prism: { x: 760, y: 168, s: 100 },                           // the glass prism over the mouth (its centre + side)
    band: [0.25, 0.79], focus: 760, cx: 0.785,
    hero: [620, 160, 280, 335],
    heroFull: [560, 20, 360, 480],
  },
  // COMEBACK (epic): a stack up AGAINST the red danger line at the top of the well; ONE bright piece (the long piece, white-hot cyan) drops into
  // the last gap, four rows CLEAR, the stack falls away from the line + light RISES out of the well
  'card-comeback': {
    well: { x0: 630, x1: 860, top: 76, floor: 520 },             // 5 cells of a well (46 each → 230 wide), the line near the top
    line: 116,                                                   // the danger line (y) — the stack's top row (its top at 106) crosses it
    gap: 3,                                                      // the open column the bright piece drops into (0-based)
    band: [0.112, 0.532], focus: 745, cx: 0.78,
    hero: [630, 64, 230, 236],
    heroFull: [595, 50, 300, 474],
  },
});
export const PD_CARDS = Object.freeze(Object.keys(PD_SPECS));
/** the scene → slot mapping { k, ox, oy }: full = the scene a little smaller than cover, flush right; strip = the card's own band */
export function pdMap(w, h, full, id = 'card-first-ko') {
  if (full) { const k = Math.max(w / PD_W, h / PD_H) * PD_FULL_Z; return { k, ox: w - PD_W * k, oy: (h - PD_H * k) / 2 }; }
  const S = PD_SPECS[id], k = h / ((S.band[1] - S.band[0]) * PD_H);
  return { k, ox: w * S.cx - S.focus * k, oy: -S.band[0] * PD_H * k };
}
/** a card's hero box in scene units (the strip's or the full card's) */
export const pdHero = (id, full) => (PD_SPECS[id] || {})[full ? 'heroFull' : 'hero'];
/** COMEBACK's stack: the rows (bottom first) as piece colours 1–7 (0 = empty). The column `gap` is open from the top down to row 4: the bright
 *  piece falls through the TOP row's hole + lands on row 3, completing rows 4–7 (CB_CLEAR) — they clear and the top row (CB_TOP, its top at 106,
 *  over the danger line) FALLS four rows, away from the line. 9 rows. */
export const CB_ROWS = Object.freeze([
  [5, 5, 3, 3, 7], [2, 2, 3, 1, 1], [2, 2, 5, 5, 1], [7, 4, 4, 5, 1],
  [3, 3, 3, 0, 6], [5, 3, 2, 0, 6], [5, 5, 2, 0, 6], [7, 5, 2, 0, 4], [1, 1, 6, 0, 4],
].map(r => Object.freeze(r)));
/** the clear: the four rows (indices into CB_ROWS) the bright piece completes; the row that falls after it */
export const CB_CLEAR = Object.freeze([4, 5, 6, 7]);
export const CB_TOP = 8;
