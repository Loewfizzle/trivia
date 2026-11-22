// HIGH RISE — THE ENGINE (S1 — docs/highrise.md "THE ENGINE"): THE ONE RULE — the same seed + the same TAP LOG = the exact same run on
// any phone and on the server (REPLAY = LIVE). FIXED-STEP TICKS (tuning.js#TICK_HZ = 60 a second); THE ONLY INPUT is THE TAP LOG: the
// ticks the player tapped at, rising — [t1, t2, …]. The slide is a PURE FUNCTION of the tick (a triangle wave in integers), so the run
// is EVENT-DRIVEN: nothing happens between a slab's entry, its drop (a tap, or THE FUSE) and the next slab's entry — stepTo jumps from
// one to the next. The phone's live run and the server's judge run THIS code.
// PURE: no DOM, no three.js, never Math.random / Date / performance / a frame clock; integers + Math.floor / Math.imul only (no float).
import { hashString } from '../../core/rng.js';
import { MODE_IDS, MAX_TAPS, PALETTE_N, CLOUDS_FLOOR, TOP_FLOOR } from './tuning.js';
// S4B — THE RULE-SET TABLE (rules.js): every rule number is read off the rule set THIS RUN is played on (`run.R` — the row; `run.rules` —
// its id, recorded with the run). The engine holds no rule number of its own.
import { RULE_SETS, RULES_DEFAULT, ruleSet, sweepBaseOf, sweepFloorMinOf } from './rules.js';

const CLASSIC = RULE_SETS[RULES_DEFAULT];

// ---- THE SEED's picks (integers only): which end a slab enters from + its sweep's wobble — and nothing else
/** uint32 → uint32, scrambled (Math.imul + shifts: exact on every engine) */
const mix = a => { a = Math.imul(a ^ (a >>> 16), 0x85ebca6b); a = Math.imul(a ^ (a >>> 13), 0xc2b2ae35); return (a ^ (a >>> 16)) >>> 0; };
export const seedHash = seed => hashString(`highrise:${seed}`);
const pick = (h, floor, salt) => mix((h ^ Math.imul(floor, 0x9e3779b1) ^ salt) >>> 0);
/** a mode's row on rule set `R` — only the modes' own names (never 'constructor' / '__proto__') */
export const modeRow = (mode, R = CLASSIC) => (typeof mode === 'string' && MODE_IDS.includes(mode) ? R.modes[mode] : null);

/** the slide axis of `floor` (1 = the first slab): even floors slide along x, odd floors along z */
export const axisOf = floor => (floor % 2 === 0 ? 'x' : 'z');
/** the end `floor`'s slab enters from: +1 / −1 on its axis — the seed's pick (fully off the tower either way) */
export const endOf = (h, floor) => (pick(h, floor, 0x51ab37) & 1 ? 1 : -1);
/** the ticks one sweep of `floor`'s slab takes on rule set `R`: the curve + the seeded wobble (± R.wobble), never out of the curve's band */
export function sweepTicks(h, floor, R = CLASSIC) {
  const s = sweepBaseOf(R, floor) + (pick(h, floor, 0x77e19d) % (2 * R.wobble + 1)) - R.wobble, lo = sweepFloorMinOf(R, floor);
  return s < lo ? lo : s > R.sweepMax ? R.sweepMax : s;
}
/**
 * THE SLIDE: the slab's offset from the tower's top (its low edge − the top's low edge on the slide axis; 0 = dead on) `k` ticks after
 * it entered — a triangle wave: e × TRAVEL at k = 0 (fully off), 0 at half a sweep, −e × TRAVEL at k = S, back at k = 2 S …
 * The floor is taken on the UNSIGNED distance, so the two directions mirror each other exactly.
 */
export function slideOff(S, e, k, travel = CLASSIC.travel) {
  const m = k % (2 * S), kk = m <= S ? m : 2 * S - m, d = travel - Math.floor(2 * travel * kk / S);
  return e > 0 ? d : 0 - d;   // (0 − d: never a negative zero)
}

/** a new run on rule set `rules` (rules.js — "classic" when none is named): the base slab (start × start, centred on 0) "landed" at
 *  tick 0 — the first slab enters at tick `beat`. The run RECORDS its rule set (`rules`) and carries its row (`R`). */
export function createRun({ seed, mode = 'solo', rules = RULES_DEFAULT } = {}) {
  const R = ruleSet(rules);
  if (!R) throw new Error(`highrise: unknown rule set ${rules}`);
  if (!modeRow(mode, R)) throw new Error(`highrise: unknown mode ${mode}`);
  const s = String(seed), half = R.start / 2;
  return {
    seed: s, mode, rules: R.id, R, h: seedHash(s),
    t: 0,                                   // the tick the run was stepped to
    st: 'beat',                             // 'beat' (a landing beat: no slab) | 'slide' | 'out' | 'made' | 'cap'
    floor: 0, at: 0,                        // the slabs landed + the tick the last one landed (THE RANKING: height, then the earlier tick)
    x0: -half, x1: half, z0: -half, z1: half,   // THE TOP SLAB's edges (integers)
    s0: R.beat, S: 0, e: 0,                 // the slab's entry tick (in a beat: the NEXT one's) · its sweep ticks · its entry end (+1 / −1)
    streak: 0, perfects: 0, maxStreak: 0, taps: 0,
    cause: '', end: -1,                     // out: 'miss' | 'thin' | 'slow' · the tick the run ended
    holds: 0, rh: 0,                        // (DAILY A — THE HELD RUN: the player's holds used · THE ROOM WINS' free holds used)
  };
}
export const isOver = run => run.st === 'out' || run.st === 'made' || run.st === 'cap';

function finish(run, st, cause, T, ev) {
  run.st = st; run.cause = cause; run.end = T; run.t = T;
  if (ev) ev.push(st === 'out' ? { e: 'out', cause, t: T } : { e: st, t: T });
}

/** the next slab enters (at run.s0) */
function spawn(run, ev) {
  const floor = run.floor + 1;
  run.st = 'slide'; run.S = sweepTicks(run.h, floor, run.R); run.e = endOf(run.h, floor);
  if (ev) ev.push({ e: 'spawn', floor, axis: axisOf(floor), from: run.e, S: run.S, t: run.s0 });
}

/**
 * A DROP at tick T — a tap, or THE FUSE's (the SAME drop; only the cause of an end differs: TOO SLOW). The overlap with the slab below on
 * the slide axis, in integers: |offset| ≤ PERFECT → a PERFECT (it snaps onto the slab below; the streak grows; from the 7th in a row the
 * slab GROWS BACK) · no overlap → OUT, a miss · else it is CUT to the overlap (the streak ends) and, if a side is under THIN, it slips off.
 */
function drop(run, T, fuse, ev) {
  const R = run.R, floor = run.floor + 1, x = floor % 2 === 0, axis = x ? 'x' : 'z';
  const lo = x ? run.x0 : run.z0, hi = x ? run.x1 : run.z1, size = hi - lo;
  const off = slideOff(run.S, run.e, T - run.s0, R.travel), a = off < 0 ? -off : off;
  if (!fuse) run.taps++;
  if (ev) ev.push({ e: 'drop', floor, axis, off, fuse, t: T });
  let nlo = lo, nhi = hi;
  if (a <= R.perfect) {
    run.streak++; run.perfects++;
    if (run.streak > run.maxStreak) run.maxStreak = run.streak;
    if (ev) ev.push({ e: 'perfect', floor, streak: run.streak, t: T });
    if (run.streak > R.growStreak && size < R.start) {
      const g = R.start - size < R.grow ? R.start - size : R.grow, l = Math.floor(g / 2);
      nlo = lo - l; nhi = hi + (g - l);
      if (ev) ev.push({ e: 'grow', floor, axis, by: g, t: T });
    }
  } else {
    run.streak = 0;
    if (a >= size) return finish(run, 'out', fuse ? 'slow' : 'miss', T, ev);
    // the CUT: the piece past the slab below falls away (its size + side are rules data; its fall is the view's)
    if (off > 0) nlo = lo + off; else nhi = hi + off;
    if (ev) ev.push({ e: 'cut', floor, axis, side: off > 0 ? 1 : -1, piece: { lo: off > 0 ? hi : lo + off, hi: off > 0 ? hi + off : lo, size: a }, t: T });
    if (nhi - nlo < R.thin || (x ? run.z1 - run.z0 : run.x1 - run.x0) < R.thin) return finish(run, 'out', fuse ? 'slow' : 'thin', T, ev);
  }
  if (x) { run.x0 = nlo; run.x1 = nhi; } else { run.z0 = nlo; run.z1 = nhi; }
  run.floor = floor; run.at = T;
  if (ev) ev.push({ e: 'land', floor, x0: run.x0, x1: run.x1, z0: run.z0, z1: run.z1, t: T });   // (the slab as it lies — a view needs nothing else to draw it)
  const M = R.modes[run.mode];
  if (M.finish != null && floor >= M.finish) return finish(run, 'made', '', T, ev);
  run.st = 'beat'; run.s0 = T + R.beat;
}

/**
 * bring the run to tick T (an integer): every slab's entry and every FUSE drop up to T happens, in order; THE CAP (a mode's capTicks)
 * ends the run where it stands AT its tick — before anything else that tick. `ev` (optional) collects the EVENTS for the view:
 *   spawn { floor, axis, from, S } · drop { floor, axis, off, fuse } · perfect { floor, streak } · grow { floor, axis, by } ·
 *   cut { floor, axis, side, piece: { lo, hi, size } } · land { floor, x0, x1, z0, z1 } (the slab as it lies) · out { cause } · made · cap
 *   — each with its tick `t`. A drop's own events (drop → perfect / grow / cut → land | out) are pushed together, in that order.
 */
export function stepTo(run, T, ev) {
  if (!Number.isSafeInteger(T)) return run;   // (a tick is a whole number — anything else moves nothing)
  const cap = run.R.modes[run.mode].capTicks, fuse = run.R.fuseSweeps;
  while (!isOver(run)) {
    const next = run.st === 'beat' ? run.s0 : run.s0 + fuse * run.S;
    if (cap != null && cap <= next) { if (cap <= T) finish(run, 'cap', '', cap, ev); break; }
    if (next > T) break;
    if (run.st === 'beat') spawn(run, ev); else drop(run, next, true, ev);
  }
  if (!isOver(run) && T > run.t) run.t = T;
  return run;
}

/**
 * A TAP at tick T → true = it dropped the sliding slab (the caller LOGS T) · false = no slab to drop at that tick (a landing beat, the
 * run over, the log full) — never logged, never played. FAIR TAPS: T is the tick of the finger's TOUCH and may be EARLIER than the tick
 * the run was already stepped to — while a slab slides nothing else happens, so its drop at T is exact either way (and the judge, which
 * replays the log in order, lands on the same state).
 */
export function tap(run, T, ev) {
  if (!Number.isSafeInteger(T) || T < 0 || isOver(run)) return false;
  stepTo(run, T, ev);
  if (run.st !== 'slide' || T < run.s0 || run.taps >= MAX_TAPS) return false;
  drop(run, T, false, ev);
  return true;
}

/**
 * HIGH RISE DAILY A — THE HOLD (THE HELD RUN — docs/highrise.md "THE DAILY"): a LOGGED event { k: 'hold', t: T, r? } — the page was hidden /
 * refreshed / killed (or THE ROOM WINS: `r`, a free one). The run stands as it was after its LAST TAP (the replay applies a hold WITHOUT
 * stepping to T first: nothing happened in the gap — no fuse, no spawn); the slab of the next floor ENTERS AT T, its sweep from tick 0 —
 * the 3-2-1 before it is not run time (T is a PLAY tick: the server picks T = the slab's own entry, so a hold costs no run time at all).
 * A floor already placed never changes. → true = held · false = refused: a mode with no holds left (rules.js `holds` / `roomHolds` —
 * the 4th player hold), the run over, T not a whole tick ≥ the slab's natural entry (in a beat) / the tick the run stands at (sliding).
 */
export function hold(run, T, room = false) {
  if (!Number.isSafeInteger(T) || T < 0 || isOver(run)) return false;
  const M = run.R.modes[run.mode], max = (room ? M.roomHolds : M.holds) || 0;
  if ((room ? run.rh : run.holds) >= max) return false;
  if (run.st === 'beat' ? T < run.s0 : T < run.t) return false;
  const cap = M.capTicks;
  if (cap != null && T >= cap) return false;
  if (room) run.rh++; else run.holds++;
  run.st = 'beat'; run.s0 = T; run.S = 0; run.e = 0;
  return true;
}

/** THE SLIDING SLAB at a tick (null = none: a beat, the run over): its edges + its offset from the top — for the VIEW (which may ease between two ticks) */
export function slabAt(run, tick) {
  return slabInto(run, tick, { floor: 0, axis: 'x', off: 0, x0: 0, x1: 0, z0: 0, z1: 0 });
}
/** … the same, written INTO `out` (a record the view keeps — S4A FIX, ZERO GARBAGE: a frame asks it twice and makes nothing) → out | null */
export function slabInto(run, tick, out) {
  if (run.st !== 'slide') return null;
  const floor = run.floor + 1, x = floor % 2 === 0, lim = run.R.fuseSweeps * run.S;
  let k = tick - run.s0;
  if (k < 0) k = 0; else if (k > lim) k = lim;
  const off = slideOff(run.S, run.e, k, run.R.travel);
  out.floor = floor; out.axis = x ? 'x' : 'z'; out.off = off;
  out.x0 = run.x0 + (x ? off : 0); out.x1 = run.x1 + (x ? off : 0); out.z0 = run.z0 + (x ? 0 : off); out.z1 = run.z1 + (x ? 0 : off);
  return out;
}
/** THE TOP SLAB as the view wants it: its centre + its sides (a centre may sit on a half unit — the RULES only ever use the edges) */
export const topOf = run => ({ cx: (run.x0 + run.x1) / 2, cz: (run.z0 + run.z1) / 2, w: run.x1 - run.x0, d: run.z1 - run.z0 });

/** the tick by which a run whose LAST tap fell at `lastTap` (0 = none) has surely ended (the beat + the fuse's sweeps at the slowest
 *  sweep of its rule set) — what a replay steps to after the last tap */
export const endBy = (run, lastTap) => lastTap + run.R.beat + run.R.floorTicksMax;

/** the run's RESULT — what the phone shows and the server's judge returns (the same code) */
export function resultOf(run) {
  return {
    rules: run.rules,   // (S4B: the rule set this run was played on — recorded with it)
    floor: run.floor, tick: run.at, end: run.end, over: isOver(run),
    cause: run.st === 'out' ? run.cause : run.st === 'made' || run.st === 'cap' ? run.st : '',
    made: run.st === 'made',
    perfects: run.perfects, maxStreak: run.maxStreak, taps: run.taps,
    feats: { reachedClouds: run.floor >= CLOUDS_FLOOR, reachedTop: run.floor >= TOP_FLOOR },
  };
}

// ---- THE PURE EXTRAS (view-only — but deterministic, so every phone agrees)
/** the flyer that passes this run's tower */
export const flyerFor = seed => (mix(seedHash(String(seed)) ^ 0x0f17e5) & 1 ? 'blackbird' : 'f22');
/** the colour index of `floor`'s slab (0 … PALETTE_N − 1): the seed picks where the tower starts on the wheel, each floor one step on */
export const paletteFor = (seed, floor) => (mix(seedHash(String(seed)) ^ 0x9a1e77) % PALETTE_N + floor) % PALETTE_N;
