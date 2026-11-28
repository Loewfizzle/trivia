// FREEFALL — THE TUNING + THE RULE-SET TABLE (F1 — … tuning.js#1

// THE FIXED STEP: the rules count TICKS, never milliseconds — … tuning.js#2
export const TICK_HZ = 60;
export const TICK_MS = 1000 / TICK_HZ;

// ---- THE TOWER's SHAPE (the same for every rule set: the … tuning.js#3
export const TURN = 4096;
/** a floor = a ring of 12 slices round the pillar */
export const SLICES = 12;
/** the ball sits at a FIXED angle — the front */
export const BALL = 0;
/** a slice's kind */
export const SAFE = 0, GAP = 1, RED = 2;

// a curve by floor: knots [floor, value], straight lines … tuning.js#4
export function rampOf(K, x) {
  if (x <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) {
    if (x <= K[i][0]) {
      const a = K[i - 1], b = K[i];
      return a[1] + Math.floor((b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]));
    }
  }
  return K[K.length - 1][1];
}

const freezeKnots = K => Object.freeze(K.map(k => Object.freeze(k.slice())));
/** the rows made by makeRuleSet (THE TABLE's own + a sim's what-if row) — createRun plays on nothing else */
const ROWS = new WeakSet();
/** is this a rule-set row (made by makeRuleSet)? */
export const isRuleRow = r => r !== null && typeof r === 'object' && ROWS.has(r);
/**
 * a rule-set ROW from its numbers (frozen, its derived numbers worked out). THE TABLE below is made of these; the SIMS make a what-if row
 * to try a number (scripts/freefall-sim.mjs) — a run can be played on one, but THE JUDGE only ever takes a row's ID that THE TABLE holds.
 */
export const makeRuleSet = r => {
  // (derived — never tuned by … tuning.js#5
  const reach = (r.fall > r.human.react ? r.fall - r.human.react : 0) * r.human.spin;
  // THE HOP: the longest run of red slices a human-paced spin … tuning.js#6
  const sliceMax = Math.floor((TURN + SLICES - 1) / SLICES);
  const hop = Math.floor(((r.bounce > r.human.react ? r.bounce - r.human.react : 0) * r.human.spin) / sliceMax) - 1;
  const row = Object.freeze({
    ...r,
    dark: Object.freeze({ ...r.dark }),
    human: Object.freeze({ ...r.human }),
    gen: Object.freeze({ ...r.gen, gaps: freezeKnots(r.gen.gaps), wide: freezeKnots(r.gen.wide), red: freezeKnots(r.gen.red), hug: freezeKnots(r.gen.hug), lap: Object.freeze({ ...r.gen.lap }), move: r.gen.move ? Object.freeze({ ...r.gen.move }) : null, blind: Object.freeze([...(r.gen.blind || [])]) }),
    modes: Object.freeze(Object.fromEntries(Object.entries(r.modes).map(([k, v]) => [k, Object.freeze({ ...v })]))),
    reach, hop: hop < 1 ? 1 : hop,
  });
  ROWS.add(row);
  return row;
};

/**
 * THE TABLE. A row:
 *   maxSpin     MAX SPIN: the most the tower may turn in ONE tick (angle units; 171 ≈ 2.5 turns a second) — the phone clamps, the judge refuses more
 *   first       the tick of the FIRST landing (the ball drops in onto floor 0)
 *   bounce      a BOUNCE: the ticks from a landing on a SAFE slice to the next landing on the SAME floor — it never changes with depth
 *   fall        a FALL: the ticks from passing a floor (a gap, or a shatter) to the landing on the next one — it never changes with depth
 *   blaze       THE BLAZE: this many floors fallen in a row without a bounce light it
 *   shatterSafe (F2 — the owner's rule b) THE LANDING RIGHT AFTER A SHATTER is never an out: red there = a BOUNCE (the clean count resets as for any bounce)
 *   dark        THE LIGHTS GO OUT: `grace` ticks of rest, then one floor every `pace` ticks; never more than `lead` floors above the ball's floor.
 *               F3B — IT EASES WITH DEPTH (darkPaceAt): `pace` down to floor `easeFrom`, then a straight line to `paceDeep` at floor `easeTo`,
 *               `paceDeep` from there on — by the floor the BALL is on when a step is set (a row without them: `pace` at every depth)
 *   human       THE HUMAN PACE the fairness proofs are written for: a reaction of `react` ticks, then at most `spin` units a tick (1 turn a second)
 *   gen         THE LAYOUT (tower-gen.js) — difficulty comes from here only. Curves by floor (rampOf), each value in 256ths:
 *                 gaps  the gaps a floor has (512 = 2; the fraction = the chance of one more) · wide  the chance a gap is 2 slices wide (else 1)
 *                 red   the red slices a floor aims for · hug  the chance a slice BESIDE a gap turns red
 *               blind (F5B: the floors that carry NO red — hidden until their breakthrough) · redFrom (no red above it) · hugFrom (red never beside a gap above it) · belowUntil (above it the slices straight below a gap are never red)
 *               windowRamp (THE FALL WINDOW comes in over this many floors from `belowUntil`: the escape a floor may ask for grows from 0 to the human reach)
 *               redMax · safeMin · gapSlicesMax (the hard bounds) · lap { from, every, red, hug } (THE TRENCH: past `from`, every `every` floors
 *               the red aim grows by `red` 256ths and the hug chance by `hug`)
 *               move (F2 — MOVING RED, THE TRENCH only: floors ≥ `from`): { from, pace (the ticks it stays on a slice — a fixed slow rate), max (the
 *               longest track, slices), chance (256ths: a floor of the first lap has one) + lap (… more each lap), two (from this lap TWO reds move) } — tower-gen.js#moverInto
 *   modes       each mode's `finish` (the floor that ends the run as MADE IT; null = endless) + `capTicks` (the tick the run ends where it stands)
 *               + `holds` (F2 — THE HOLD: how often a run may be held — the page hidden / the phone locked; solo only: a match never holds)
 *   (derived)   reach = THE FALL WINDOW's human reach in angle units · hop = the longest red run (slices) a human-paced bounce crosses
 */
export const RULE_SETS = Object.freeze({
  classic: makeRuleSet({
    id: 'classic',
    maxSpin: 171,
    first: 18, bounce: 36, fall: 18,
    blaze: 3,
    shatterSafe: true,
    // (F3 — THE LIGHTS GO OUT = JAYWALK-STYLE PRESSURE, the owner … tuning.js#7
    dark: { grace: 3 * TICK_HZ, pace: 120, lead: 3, paceDeep: 160, easeFrom: 100, easeTo: 160 },
    human: { react: 12, spin: 68 },
    gen: {
      gaps: [[0, 512], [80, 448], [120, 384], [160, 300], [200, 256]],
      wide: [[0, 256], [40, 256], [80, 192], [120, 128], [160, 48], [200, 0]],
      red: [[10, 384], [40, 768], [80, 960], [120, 1152], [160, 1408], [200, 1664]],
      hug: [[40, 56], [80, 88], [120, 128], [160, 200], [200, 240]],
      redFrom: 10, hugFrom: 40, belowUntil: 120, windowRamp: 40,
      // (F5B — THE BLIND FLOORS, the owner: the floors the skylight … tuning.js#8
      blind: [40, 120],
      redMax: 8, safeMin: 3, gapSlicesMax: 6,
      lap: { from: 200, every: 40, red: 128, hug: 8 },
      move: { from: 201, pace: 45, max: 4, chance: 154, lap: 51, two: 3 },
    },
    modes: {
      solo: { finish: null, capTicks: 30 * 60 * TICK_HZ, holds: 3 },
      match: { finish: 200, capTicks: 3 * 60 * TICK_HZ, holds: 0 },
      daily: { finish: 200, capTicks: 3 * 60 * TICK_HZ, holds: 0 },
    },
  }),
});
/**
 * THE DARKNESS's PACE AT A DEPTH (F3B — THE DARKNESS EASES WITH DEPTH): the ticks to its next floor down, by the floor the BALL is on when
 * the step is set — `pace` down to `easeFrom`, a straight line to `paceDeep` at `easeTo`, `paceDeep` below. PURE, integers only (the phone's
 * run and the judge's replay read the same number); a row that names no ease keeps `pace` at every depth.
 */
export function darkPaceAt(R, floor) {
  const D = R.dark;
  if (D.paceDeep == null || !(D.easeTo > D.easeFrom) || floor <= D.easeFrom) return D.pace;   // (a row with no ramp of its own — or half of one — keeps its one pace: never a NaN)
  if (floor >= D.easeTo) return D.paceDeep;
  return D.pace + Math.floor((D.paceDeep - D.pace) * (floor - D.easeFrom) / (D.easeTo - D.easeFrom));
}
/** the rule set a run is played on when it names none */
export const RULES_DEFAULT = 'classic';
/** a rule set's id is short + plain (F4's proof node `rs` — the rules will allow nothing else) */
export const RULES_ID_MAX = 16;
/** an id → its row, or null (an unknown id · anything that is not a plain id: never 'constructor' / '__proto__') */
export const ruleSet = id => (typeof id === 'string' && id.length <= RULES_ID_MAX && /^[a-z0-9-]+$/.test(id) && Object.prototype.hasOwnProperty.call(RULE_SETS, id) ? RULE_SETS[id] : null);

// ---- THE CLASSIC ROW BY NAME (for the views, the sims + the … tuning.js#9
const C = RULE_SETS.classic;
export const MAX_SPIN = C.maxSpin;
export const FIRST = C.first;
export const BOUNCE = C.bounce;
export const FALL = C.fall;
export const BLAZE = C.blaze;
/** F2 — THE LANDING RIGHT AFTER A SHATTER is never an out (red there = a bounce) */
export const SHATTER_SAFE = C.shatterSafe;
/** F2 — MOVING RED (THE TRENCH): { from, pace, max, chance, lap } */
export const MOVE = C.gen.move;
export const DARK = C.dark;
export const HUMAN = C.human;
export const GEN = C.gen;
export const REACH = C.reach;
export const HOP = C.hop;
// THE MODES: `finish` = the floor that ends the run as MADE … tuning.js#10
export const MODES = C.modes;
export const MODE_IDS = Object.freeze(Object.keys(MODES));

// ---- THE AREAS (by floor — pure, for the views; … tuning.js#11
export const AREAS = Object.freeze([
  Object.freeze({ id: 'rooftop', from: 0, name: 'THE ROOFTOP' }),
  Object.freeze({ id: 'offices', from: 40, name: 'THE OFFICES' }),
  Object.freeze({ id: 'speakeasy', from: 80, name: 'THE SPEAKEASY' }),
  Object.freeze({ id: 'harbor', from: 120, name: 'UNDER THE HARBOR' }),
  Object.freeze({ id: 'deep', from: 160, name: 'THE DEEP' }),
  Object.freeze({ id: 'bottom', from: 200, name: 'THE BOTTOM' }),
  Object.freeze({ id: 'trench', from: 201, name: 'THE TRENCH' }),
]);

// ---- THE FEATS (from the replay only — F3's cards)
/** SPLASHDOWN: the ball reached floor 120 (UNDER THE HARBOR) */
export const HARBOR_FLOOR = 120;
/** ROCK BOTTOM: the ball reached floor 200 (THE BOTTOM) */
export const BOTTOM_FLOOR = 200;
/** TERMINAL VELOCITY: this many floors in a row without a bounce (gaps + shatters) */
export const TERMINAL_RUN = 15;

// ---- THE INPUT LOG's BOUNDS
export const SEED_MAX = 64;
// a run's whole log at most: ONE entry a tick (the ticks … tuning.js#12
export const MAX_LOG = Object.values(C.modes).reduce((m, v) => (v.capTicks > m ? v.capTicks : m), 0);
/** F2 — THE HOLD: the most holds any mode allows (the log's bound: its entries + this many holds) */
export const HOLDS_MAX = Object.values(C.modes).reduce((m, v) => ((v.holds || 0) > m ? v.holds : m), 0);
// the longest a packed entry is: '.' + a gap (≤ 4 base-36 … tuning.js#13
export const ENTRY_CHARS_MAX = 9;
