// HIGH RISE — THE TUNING (S1 — docs/highrise.md): every number of the rules in ONE place. PURE, no imports, no DOM.
// THE RULES' MATH IS CROSS-ENGINE SAFE: integers / fixed point and + − × + Math.floor / Math.imul only — never a float, never Math.sin /
// cos / pow / sqrt, never Date / Math.random / performance (the phone's run and the server's replay must agree drop for drop). The view
// may use anything.

/** THE FIXED STEP: the rules count TICKS, never milliseconds — 60 a second. (The view turns its clock into ticks; the rules never read one.) */
export const TICK_HZ = 60;
export const TICK_MS = 1000 / TICK_HZ;

// ---- THE SLAB (fixed point: the STARTING WIDTH = 10000 units, both axes — square slabs)
export const START = 10000;
/** PERFECT = the slab's offset within 5 % of the STARTING width — a fixed window, it never shrinks with the tower */
export const PERFECT = 500;
/** GROW-BACK: after GROW_STREAK perfects in a row, each FURTHER perfect (the 7th in a row and on) adds GROW units back on that drop's
 *  slide axis — never past START */
export const GROW = 400;
export const GROW_STREAK = 6;
/** TOO THIN: a slab with either side under 5 % of the starting width slips off */
export const THIN = 500;

// ---- THE SLIDE: a triangle wave ±TRAVEL around the tower's top (its centre on the slide axis) — at either end the slab is FULLY OFF the
// tower (TRAVEL ≥ START: even two full-size slabs do not touch there). A SWEEP = one end to the other.
export const TRAVEL = 15000;
/** THE FUSE: an untapped slab drops by itself at the end of this many sweeps */
export const FUSE_SWEEPS = 2;
/** THE LANDING BEAT: the next slab enters this many ticks after a drop (the base "lands" at tick 0: the first slab enters at tick BEAT) */
export const BEAT = 12;

/**
 * THE SPEED CURVE — SWEEP-TICKS by floor (the ticks one sweep takes; fewer = faster): the knots [floor, ticks], straight lines between
 * them (integers), held after the last. SET BY THE BOT SIMS (scripts/highrise-sim.mjs — docs/games/passes/highrise-s1.md has the table):
 * the owner's starting points were 96 ticks at floor 1 → 45 by floor 120 → held; THE TARGETS WON — 140 → 84 by floor 120 → held
 * (sloppy 0:41 · casual 1:10 · good 2:19 · near-perfect on floor 200 at 3:28, every run). tests/highrise-sim.test.mjs holds the bands.
 */
export const SWEEP = Object.freeze([Object.freeze([1, 140]), Object.freeze([120, 84])]);
/** the seeded wobble: ± this many ticks on a floor's sweep (integer, deterministic) — never out of the curve's own band */
export const WOBBLE = 3;
export const SWEEP_MAX = SWEEP.reduce((m, k) => (k[1] > m ? k[1] : m), 0);
export const SWEEP_MIN = SWEEP.reduce((m, k) => (k[1] < m ? k[1] : m), SWEEP_MAX);
/**
 * SOLO PAST 200 KEEPS TIGHTENING (S2 — the owner, Nov 18: S1's held curve let a near-perfect player climb for ever): past floor `from`
 * the sweep loses `by` ticks every `every` floors (floor 210, 220, …), never under `min` — so even a near-perfect player falls. Only an
 * ENDLESS run ever gets there: MATCH + DAILY end ON floor 200 (MADE IT), their slab 201 never enters — they are unchanged, tick for tick
 * (tests/highrise-engine.test.mjs pins S1's runs). SET BY THE SIMS (docs/games/passes/highrise-s2.md).
 */
export const TIGHT = Object.freeze({ from: 200, every: 10, by: 3, min: 24 });
/** the curve alone (no wobble): the sweep ticks of `floor` (1 = the first slab) */
export function sweepBase(floor) {
  const K = SWEEP;
  if (floor <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) {
    if (floor <= K[i][0]) {
      const a = K[i - 1], b = K[i];
      return a[1] + Math.floor((b[1] - a[1]) * (floor - a[0]) / (b[0] - a[0]));
    }
  }
  const held = K[K.length - 1][1];
  if (floor <= TIGHT.from) return held;
  const s = held - TIGHT.by * Math.floor((floor - TIGHT.from) / TIGHT.every);
  return s < TIGHT.min ? TIGHT.min : s;
}
/** the lowest a floor's sweep may wobble to: the curve's own band until the FIRST notch (floor 210 — floors 201 … 209 are S1's 84 … 87,
 *  the review's find) — from there, the tightening's floor */
export const sweepFloorMin = floor => (floor >= TIGHT.from + TIGHT.every ? TIGHT.min : SWEEP_MIN);

/** THE MODES: `finish` = the floor that ends the run as MADE IT (null = endless) · `capTicks` = the tick the run ends where it stands (null = none) */
export const MODES = Object.freeze({
  solo: Object.freeze({ finish: null, capTicks: null }),
  match: Object.freeze({ finish: 200, capTicks: 6 * 60 * TICK_HZ }),
  daily: Object.freeze({ finish: 200, capTicks: 5 * 60 * TICK_HZ }),
});
export const MODE_IDS = Object.freeze(Object.keys(MODES));

/** THE FEATS' heights (S3's cards) */
export const CLOUDS_FLOOR = 60;
export const TOP_FLOOR = 200;

// ---- THE TAP LOG's BOUNDS
export const SEED_MAX = 64;
/** a run's whole tap log at most (a tap = a drop = a floor: an endless run this tall is hours long); a finishing mode's = its finish floor */
export const MAX_TAPS = 20000;
/** the longest one floor can take: the beat + the fuse's sweeps at the slowest sweep there is (the wobble never leaves the band) */
export const FLOOR_TICKS_MAX = BEAT + FUSE_SWEEPS * SWEEP_MAX;

/** view-only, but the same on every phone (engine.js#paletteFor): how many colours the tower walks through */
export const PALETTE_N = 24;
