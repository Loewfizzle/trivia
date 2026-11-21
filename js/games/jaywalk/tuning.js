// JAYWALK — THE TUNING (H1 — docs/jaywalk.md): every number of the rules in ONE place. PURE, no imports, no DOM.
// THE RULES' MATH IS CROSS-ENGINE SAFE: integers / fixed point and + − × ÷ + Math.floor only — never Math.sin / cos / pow / exp / sqrt
// (V8 and JavaScriptCore may differ in the last bit; the phone's run and the server's replay must agree hop for hop). The view may use anything.

/** THE FIXED STEP: the rules count TICKS, never milliseconds — 60 a second. (The view turns its frame clock into ticks; the rules never read a clock.) */
export const TICK_HZ = 60;
export const TICK_MS = 1000 / TICK_HZ;
/** fixed point: 1 cell (a column's width = a lane's depth) = FP units */
export const FP = 1000;
export const COLS = 9;
export const WIDTH = COLS * FP;
export const MID_COL = 4;                 // (the centre column: never an obstacle on it — a straight way through every grass lane)

/** A HOP: 8 ticks = 133 ms (the snappy 120–150 ms feel). One more hop may be BUFFERED while one is in flight. */
export const HOP_TICKS = 8;
export const KID_HALF = 300;              // (the kid's half width against cars / trains / the Blackbird — 0.3 of a cell: a fair, slightly small box)
export const LOG_GRACE = 150;             // (how far past a log's end the kid's centre may sit and still be on it)

// ---- THE COURSE
export const CALM_LANES = 4;              // (lanes 0–3: plain grass — the opening is always calm)
export const STRETCH = 50;                // (a stretch = the 50 lanes from one landmark to the next)
/** THE FIXED LANDMARKS, every 50 lanes, in this order — then the loop again, harder (H5A: each one's lane is the GATEWAY into its AREA — below) */
export const LANDMARKS = Object.freeze(['THE DOCKS', 'THE FISH MARKET', 'THE RAIL YARD', 'THE BRIDGE', 'DOWNTOWN', 'THE CANAL', 'THE LIGHTHOUSE', 'THE AIRFIELD']);
export const LOOP_LANES = STRETCH * LANDMARKS.length;   // 400
/** J1 — SPLIT TIMES: the tick each multiple of this many lanes is FIRST reached (engine.js#land → the run's `sp`; the end card's boxes; the
 *  server's best splits — core/splits.js). 60 ticks = 1 s. */
export const SPLIT_EVERY = 50;
/** the landmark AT this lane (null = none): lane 50 → THE DOCKS … 400 → THE AIRFIELD, 450 → THE DOCKS again */
export const landmarkAt = lane => (lane > 0 && lane % STRETCH === 0 ? LANDMARKS[(lane / STRETCH - 1) % LANDMARKS.length] : null);

/** THE DIFFICULTY CURVE — the SAME on every course: HEAT by lane index, 0 at the start → 1000 at lane 400 → on up through the loop (the cap 1600 = lane 640) */
export const HEAT_FULL = 1000;
export const HEAT_MAX = 1600;
export const heatAt = lane => { const h = Math.floor(lane * HEAT_FULL / LOOP_LANES); return h > HEAT_MAX ? HEAT_MAX : h < 0 ? 0 : h; };
/** a → b as the heat goes 0 → 1000 (past 1000 it keeps going: the loop is harder), integers */
export const byHeat = (a, b, heat) => a + Math.floor((b - a) * heat / HEAT_FULL);

/** the lane MIX's weights by heat [at 0, at 1000] — and the first lane each kind may appear on */
export const MIX = Object.freeze({
  grass: [46, 20],
  road: [42, 40],
  water: [12, 26],
  rail: [0, 14],
});
export const FIRST = Object.freeze({ road: CALM_LANES, water: 12, rail: 25, ufo: 100, flight: 150 });
/** J2 — EVEN STARTS (COURSE RULES v2 only — versions.js; v1 never reads this): the opening (lanes CALM_LANES … STRETCH − 1) never runs
 *  free. The kinds keep the heat's own mix, but its SPREAD is tightened, lane by lane in order (course.js#openingKinds): never more than
 *  `grassRun` ground lanes in a row · never more than `grassPer10` in any 10 lanes running · never more than `hazardRun` hazard lanes in a
 *  row (the other side of the same coin: the overall difficulty stays the curve's — measured, docs/jaywalk.md "EVEN STARTS"). */
export const EVEN = Object.freeze({ grassRun: 2, grassPer10: 5, hazardRun: 3 });
export const WATER_RUN_MAX = 3;           // (never more than 3 water lanes in a row)
export const RAIL_RUN_MAX = 3;            // (… nor more than 3 rail lanes — H5A: THE RAIL YARD leans hard on them)

/** THE AREAS (H5A — the owner, Nov 16): a new area every 50 lanes — the stretch that BEGINS at a landmark's lane IS that place (lanes
 *  50–99 THE DOCKS · 100–149 THE FISH MARKET · … · 400–449 THE AIRFIELD · 450 on: the loop again, harder); lanes 0–49 are the plain
 *  opening. Each area LEANS the lane mix — `mix` [grass, road, water, rail], a PERCENTAGE on the heat's own weights (MIX): the difficulty
 *  curve keeps climbing underneath — the speeds, the gaps, the logs' lengths, the trains' laps stay the heat's alone. `cars` + `gap` =
 *  HEAVIER TRAFFIC (more cars a lap, less spare room between them — never under the crossable gap, ROAD.gapMin + gapVTicks);
 *  `flight` = the stretch has its flight paths FOR SURE, two of them (no UFO there: never both in one stretch). */
export const AREAS = Object.freeze([
  Object.freeze({ name: 'THE DOCKS', mix: Object.freeze([120, 70, 170, 60]) }),          // water + the piers
  Object.freeze({ name: 'THE FISH MARKET', mix: Object.freeze([135, 90, 130, 50]) }),    // the market's ground + water
  Object.freeze({ name: 'THE RAIL YARD', mix: Object.freeze([90, 60, 40, 420]) }),       // more trains
  Object.freeze({ name: 'THE BRIDGE', mix: Object.freeze([35, 130, 190, 30]) }),         // water with roads
  Object.freeze({ name: 'DOWNTOWN', mix: Object.freeze([80, 190, 25, 60]), cars: 1, gap: 65 }),   // roads + heavier traffic
  Object.freeze({ name: 'THE CANAL', mix: Object.freeze([80, 60, 230, 40]) }),           // more water
  Object.freeze({ name: 'THE LIGHTHOUSE', mix: Object.freeze([150, 60, 170, 40]) }),     // water + the rocks
  Object.freeze({ name: 'THE AIRFIELD', mix: Object.freeze([110, 120, 30, 50]), flight: 2 }),     // more flight paths
]);
export const NO_LEAN = Object.freeze({ name: '', mix: Object.freeze([100, 100, 100, 100]) });
/** the area AT this lane: −1 = the opening (lanes 0–49), else 0 … 7 (the index into AREAS / LANDMARKS) */
export const areaIndex = lane => { const s = Math.floor(lane / STRETCH); return s < 1 ? -1 : (s - 1) % LANDMARKS.length; };

/** ROAD: the cars' speed (FP a tick) [slowest, fastest] at heat 0 → 1000; their lengths; the gaps */
export const ROAD = Object.freeze({
  vMin: [22, 45], vMax: [38, 105],
  lens: [1000, 1000, 1000, 2000, 2000, 3000],
  cars: [2, 4],                            // (cars in one lap of the lane, before the gaps are sized)
  gapMin: 2600, gapVTicks: 26,             // (a gap is never under 2.6 cells + what a car covers in 26 ticks — the crossable window)
  gapExtra: [5200, 2400],                  // (+ a random 0 … this much, by heat)
});
/** WATER (H3 — the owner, Nov 16): every log its OWN LENGTH, 1–4 cells, from the seed — long logs more common early, short ones later (the
 *  difficulty curve) — and UNEVEN GAPS. A 1-cell log is the hard one: never on a lane beside another water lane, never on a fast lane. */
export const WATER = Object.freeze({
  vMin: [16, 34], vMax: [26, 62],
  lenW: [[4, 14, 36, 46], [30, 40, 22, 8]],     // (the weights of a 1 · 2 · 3 · 4-cell log at heat 0 → 1000; past 1000 they keep going, never under 1)
  oneV: 44,                                     // (a 1-cell log only on a lane this slow or slower — its landing window stays ≥ ~0.5 s)
  logs: [3, 3],
  gapShort: [900, 1500], shortOf: 380,          // (UNEVEN GAPS: this many gaps of 1000 are SHORT — 0.9–1.5 cells …)
  gapMin: 1400, gapExtra: [1400, 2600],         // (… the rest LONG: 1.4 cells + a random 0 … this much, by heat)
});
/** RAIL: a train is a TELL (the signal lights) then a fast, long body; the lap in ticks by heat */
export const RAIL = Object.freeze({ tell: 60, len: 14000, v: 750, period: [[300, 480], [170, 300]] });
/** THE FLIGHT PATH: THE BLACKBIRD — its tell ≥ 1.5 s (the radio crackle + the runway lights), then a split-second pass */
export const FLIGHT = Object.freeze({ lanes: 2, tell: 108, len: 3000, v: 1000, period: [[420, 600], [330, 480]], chance: [300, 450] });
/** THE UFO: a slow diagonal drift over a zone of grass + road lanes; its beam circle on the ground = the warning */
export const UFO = Object.freeze({ lanes: 8, r: 1250, vx: [14, 24], vy: [7, 13], chance: [320, 450] });
export const MIN_TELL_TICKS = 90;         // (1.5 s — the Blackbird's tell is never shorter: tests/jaywalk-sim.test.mjs)
/**
 * J2 — THE BLACKBIRD's RUNWAYS (COURSE RULES v2 only — versions.js; v1 keeps FLIGHT): a runway = a band of 3 or 4 flight lanes, EACH with
 * its OWN jet on ONE shared lap, staggered (the lanes' passes spread round the lap in a shuffled order — never all at once: a kid weaves
 * and times across). Every lane: its tell (≥ MIN_TELL_TICKS) → the pass (the body, `FLIGHT.len` at `FLIGHT.v`) → THE AFTERBURNER TRAIL
 * (`trail` ticks: the whole lane still burns — touching it = 'blackbird') → quiet. A runway always has a SAFE ground lane right before
 * and right after it (a place to wait — course.js#typeAt), never another runway back to back. FAIR BY CONSTRUCTION: every layout is
 * checked as it is made (course.js#runwaySlack — a careful kid, waiting + hopping, gets across from at least `slack` start ticks of
 * every lap); one that is not falls back to the tight cluster (`gap[0]`), which always leaves a calm gap the whole band is quiet in.
 *   period   a lane's lap [at heat 0, at heat 1000] = [[min, max], [min, max]] ticks (4–6 s early → 3–4.5 s deeper; never under periodMin)
 *   four     ‰ of runways with 4 lanes (else 3), by heat
 *   chance   ‰ a stretch gets runways: s2 = THE FISH MARKET (from lane `first`) · mid = 150–249 · deep = 250 on (+ `two` ‰ of those a 2nd)
 *   ufo      the most ‰ a stretch gives THE UFO first (never both in one stretch) · THE AIRFIELD: `airfield` runways, never a UFO
 */
export const RUNWAY = Object.freeze({
  first: 120, tell: 96, trail: 42, jitter: 6, periodMin: 180,
  gap: Object.freeze([18, 0]), slack: 24,   // (the stagger: the ticks between one lane's jet and the next, [fewest, 0 = the lap shared evenly] · a layout leaving under `slack` start ticks a lap with a way across is not used — course.js#runwaySlack)
  period: Object.freeze([Object.freeze([240, 360]), Object.freeze([180, 270])]),
  four: Object.freeze([250, 750]),
  chance: Object.freeze({ s2: 420, mid: 560, deep: 760, two: 450 }),
  ufo: Object.freeze({ s2: 380, mid: 300, deep: 240 }),
  airfield: 4,
});

/** GRASS: obstacles (never on the centre column, never beside a water lane): how many, by heat */
export const GRASS = Object.freeze({ obstacles: [[0, 3], [1, 5]] });

// ---- THE WALL (night: THE BLACKOUT · day: a FOG BANK) — its front edge in lane FP; a kid whose centre it passes is caught
export const WALL = Object.freeze({
  start: -8 * FP,                          // (it begins 8 lanes behind the start)
  delay: 180,                              // (and waits 3 s — the calm opening)
  behind: 5,                               // (never more than 5 lanes behind the kid's BEST: no banking distance — it waits just under the screen's foot)
});

/** THE MODES — the wall's pace (FP a tick) + its speed-up, THE MOTHERSHIP's tick (cap: 0 = never). All tunable here.
 *  ONE LIFE EVERYWHERE (H4 — the owner, Nov 16): one hit = out, in every mode. No lives option, no respawn, no blink, no one-up.
 *  SOLO ENDLESS = no speed-up, no end · MATCH = faster from ~4 min, THE MOTHERSHIP at ~6 min takes whoever is left (rare — a reward) ·
 *  DAILY (built later — DAILY A / B) = faster from ~3 min, THE MOTHERSHIP at ~5 min. */
export const MODES = Object.freeze({
  solo: Object.freeze({ wall: { base: 10, rampAt: 0, rampTicks: 0, max: 10 }, cap: 0 }),
  match: Object.freeze({ wall: { base: 10, rampAt: 4 * 60 * TICK_HZ, rampTicks: 2 * 60 * TICK_HZ, max: 30 }, cap: 6 * 60 * TICK_HZ }),
  daily: Object.freeze({ wall: { base: 10, rampAt: 3 * 60 * TICK_HZ, rampTicks: 2 * 60 * TICK_HZ, max: 30 }, cap: 5 * 60 * TICK_HZ }),
});
export const MODE_IDS = Object.freeze(Object.keys(MODES));
/** the wall's pace at a tick (FP a tick): still for the delay, the base, then the ramp to its max */
export function wallPace(mode, tick) {
  const w = MODES[mode].wall;
  if (tick < WALL.delay) return 0;
  if (!w.rampAt || tick <= w.rampAt) return w.base;
  const p = w.base + Math.floor((tick - w.rampAt) * (w.max - w.base) / w.rampTicks);
  return p > w.max ? w.max : p;
}

// ---- THE HOP LOG's BOUNDS (the server's verify + the phone's recorder share them)
export const DIRS = Object.freeze(['u', 'l', 'r', 'd']);
export const MIN_INPUT_GAP = 2;           // (two inputs are never closer than 2 ticks — 33 ms)
export const MAX_INPUTS_PER_SEC = 20;     // (… and never more than 20 in any one second)
export const MAX_LOG = 60000;             // (a solo run's whole log; a capped mode's = its cap / MIN_INPUT_GAP at most)
export const SEED_MAX = 64;

// ---- THE CLOCK (H3 — the anti-cheat: a run is played ON the server's clock; tick 0 = GO, a server timestamp the rules enforce. Every
// hop-log chunk carries its own server timestamp — the moment it ARRIVED. The server refuses a log that runs AHEAD of the real clock, and
// stops counting one that falls BEHIND it — a slowed game — at the last hop that was on time.
// H4 — THE DROPPED SIGNAL (the owner, Nov 16 — a phone in a moving van): the database queues writes while a phone is offline and stamps
// them when they ARRIVE, so a lost connection looks like slow motion. They are told apart by HOW the chunks arrive (replay.js#clockProblem):
//   · a DROP = a SILENCE, then a BURST of chunks landing together that catches up to the real clock → never held against the run (≤ `drop`)
//   · SLOW MOTION = the ticks drifting behind the clock while the chunks keep arriving → cut, as before)
export const CLOCK = Object.freeze({
  ahead: 2 * TICK_HZ,                      // (a chunk's LAST hop: at most 2 s ahead of the chunk's own timestamp — the phone's clock estimate + a frame)
  behind: 8 * TICK_HZ,                     // (… its FIRST hop: at most 8 s behind it — the upload every second + a slow network)
  drop: 75 * 1000,                         // (ms — THE DROPPED SIGNAL: a silence this long before a burst explains its lag: ~60 s offline + the reconnect)
  catchUp: 15 * 1000,                      // (ms — … and the burst must be back on the clock within this of its first chunk, or it was never a drop)
  jitter: 6,                               // (ticks — inside a burst a chunk may be this much later than the one before it, never more: a lag that grows is slow motion)
  flushMs: 1000,                           // (the phone uploads its new hops every second — a solo run)
  flushMatchMs: 120,                       // (… AT ONCE in a MATCH — H4B: a hop goes up within this; the others' ghosts are your hop log. ≤ 8 small writes a second at the very most)
  chunkMax: 400,                           // (a chunk's packed string — the rules' bound)
  chunks: 10000,                           // (c/0 … c/9999)
});

/** the hit causes, the run's states */
export const CAUSES = Object.freeze(['car', 'water', 'train', 'edge', 'blackbird', 'ufo', 'wall']);
