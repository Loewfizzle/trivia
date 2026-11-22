// HIGH RISE — THE RULE-SET TABLE (S4B — docs/highrise.md "THE RULE-SET TABLE"): EVERY NUMBER OF THE RULES lives HERE, in ONE table — the
// start size, the perfect window, grow-back, too thin, the travel, the fuse, the landing beat, the speed curve + its wobble, the solo
// tightening past floor 200, each mode's finish + cap. A RULE SET = one row; today's only one is "classic" (S1 / S2's numbers, set by
// the bot sims — docs/highrise.md "THE NUMBERS" · "THE SIMS"). A run is played on ONE rule set and RECORDS it (engine.js: `run.rules` ·
// the proof node's `rs` · the judge's answer); THE JUDGE replays a log on the set it names and REFUSES one it does not know — so a
// future tuning is a NEW row, and every run ever recorded still replays to the tick on the row it was played on.
// PURE, no imports, no DOM. THE RULES' MATH IS CROSS-ENGINE SAFE: integers / fixed point and + − × + Math.floor / Math.imul only.

/** THE FIXED STEP (every rule set counts the same ticks): 60 a second */
export const TICK_HZ = 60;

const freezeRow = r => {
  const sweepMax = r.sweep.reduce((m, k) => (k[1] > m ? k[1] : m), 0), sweepMin = r.sweep.reduce((m, k) => (k[1] < m ? k[1] : m), sweepMax);
  return Object.freeze({
    ...r,
    sweep: Object.freeze(r.sweep.map(k => Object.freeze(k.slice()))),
    tight: Object.freeze({ ...r.tight }),
    modes: Object.freeze(Object.fromEntries(Object.entries(r.modes).map(([k, v]) => [k, Object.freeze({ ...v })]))),
    // (derived — never tuned by hand: the curve's own band · the longest one floor can take: the beat + the fuse's sweeps at the slowest sweep)
    sweepMax, sweepMin, floorTicksMax: r.beat + r.fuseSweeps * sweepMax,
  });
};

/**
 * THE TABLE. A row:
 *   start       THE STARTING WIDTH (fixed point units, both axes — square slabs)
 *   perfect     PERFECT = |offset| within this (5 % of the start: a fixed window, it never shrinks with the tower)
 *   grow · growStreak   GROW-BACK: past `growStreak` perfects in a row, each FURTHER perfect adds `grow` units back on that drop's axis (never past start)
 *   thin        TOO THIN: a slab with either side under this slips off
 *   travel      THE SLIDE: a triangle wave ± this round the tower's top (≥ start: at either end the slab is fully off the tower)
 *   fuseSweeps  THE FUSE: an untapped slab drops by itself at the end of this many sweeps
 *   beat        THE LANDING BEAT: the next slab enters this many ticks after a drop
 *   sweep       THE SPEED CURVE: knots [floor, the ticks one sweep takes], straight lines between them (integers), held after the last
 *   wobble      … ± this many ticks, the seed's pick, never out of the curve's band
 *   tight       SOLO PAST 200 KEEPS TIGHTENING: past floor `from` the sweep loses `by` ticks every `every` floors, never under `min`
 *   modes       each mode's `finish` (the floor that ends the run as MADE IT; null = endless) + `capTicks` (the tick the run ends where it stands; null = none)
 *               + (HIGH RISE DAILY A — THE HELD RUN) `holds` (the player's holds a run may use — a hidden / refreshed page; none = 0) + `roomHolds` (THE ROOM
 *               WINS' free holds — a room that really started a game); a hold in a mode without them is refused by the engine + the judge
 */
export const RULE_SETS = Object.freeze({
  classic: freezeRow({
    id: 'classic',
    start: 10000, perfect: 500, grow: 400, growStreak: 6, thin: 500,
    travel: 15000, fuseSweeps: 2, beat: 12,
    sweep: [[1, 140], [120, 84]], wobble: 3,
    tight: { from: 200, every: 10, by: 3, min: 24 },
    modes: { solo: { finish: null, capTicks: null }, match: { finish: 200, capTicks: 6 * 60 * TICK_HZ }, daily: { finish: 200, capTicks: 5 * 60 * TICK_HZ, holds: 3, roomHolds: 3 } },
  }),
});
/** the rule set a run is played on when it names none (a node written before `rs` could be: classic) */
export const RULES_DEFAULT = 'classic';
/** a rule set's id is short + plain (the proof node's `rs` — the rules allow nothing else) */
export const RULES_ID_MAX = 16;
/** an id → its row, or null (an unknown id · anything that is not a plain id: never 'constructor' / '__proto__') */
export const ruleSet = id => (typeof id === 'string' && id.length <= RULES_ID_MAX && /^[a-z0-9-]+$/.test(id) && Object.prototype.hasOwnProperty.call(RULE_SETS, id) ? RULE_SETS[id] : null);

/** the curve alone (no wobble): the sweep ticks of `floor` (1 = the first slab) on rule set `R` */
export function sweepBaseOf(R, floor) {
  const K = R.sweep;
  if (floor <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) {
    if (floor <= K[i][0]) {
      const a = K[i - 1], b = K[i];
      return a[1] + Math.floor((b[1] - a[1]) * (floor - a[0]) / (b[0] - a[0]));
    }
  }
  const held = K[K.length - 1][1];
  if (floor <= R.tight.from) return held;
  const s = held - R.tight.by * Math.floor((floor - R.tight.from) / R.tight.every);
  return s < R.tight.min ? R.tight.min : s;
}
/** the lowest a floor's sweep may wobble to: the curve's own band until the FIRST notch of the tightening — from there, its floor */
export const sweepFloorMinOf = (R, floor) => (floor >= R.tight.from + R.tight.every ? R.tight.min : R.sweepMin);
