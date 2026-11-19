// HIGH RISE — THE ENGINE (S1 — docs/highrise.md "THE ENGINE"): THE ONE RULE — the same seed + the same TAP LOG = the exact same run on
// any phone and on the server (REPLAY = LIVE). FIXED-STEP TICKS (tuning.js#TICK_HZ = 60 a second); THE ONLY INPUT is THE TAP LOG: the
// ticks the player tapped at, rising — [t1, t2, …]. The slide is a PURE FUNCTION of the tick (a triangle wave in integers), so the run
// is EVENT-DRIVEN: nothing happens between a slab's entry, its drop (a tap, or THE FUSE) and the next slab's entry — stepTo jumps from
// one to the next. The phone's live run and the server's judge run THIS code.
// PURE: no DOM, no three.js, never Math.random / Date / performance / a frame clock; integers + Math.floor / Math.imul only (no float).
import { hashString } from '../../core/rng.js';
import { START, PERFECT, GROW, GROW_STREAK, THIN, TRAVEL, FUSE_SWEEPS, BEAT, WOBBLE, SWEEP_MIN, SWEEP_MAX, sweepBase, MODES, MODE_IDS, MAX_TAPS, PALETTE_N, CLOUDS_FLOOR, TOP_FLOOR } from './tuning.js';

// ---- THE SEED's picks (integers only): which end a slab enters from + its sweep's wobble — and nothing else
/** uint32 → uint32, scrambled (Math.imul + shifts: exact on every engine) */
const mix = a => { a = Math.imul(a ^ (a >>> 16), 0x85ebca6b); a = Math.imul(a ^ (a >>> 13), 0xc2b2ae35); return (a ^ (a >>> 16)) >>> 0; };
export const seedHash = seed => hashString(`highrise:${seed}`);
const pick = (h, floor, salt) => mix((h ^ Math.imul(floor, 0x9e3779b1) ^ salt) >>> 0);
/** a mode's row — only the MODES' own names (never 'constructor' / '__proto__') */
export const modeRow = mode => (typeof mode === 'string' && MODE_IDS.includes(mode) ? MODES[mode] : null);

/** the slide axis of `floor` (1 = the first slab): even floors slide along x, odd floors along z */
export const axisOf = floor => (floor % 2 === 0 ? 'x' : 'z');
/** the end `floor`'s slab enters from: +1 / −1 on its axis — the seed's pick (fully off the tower either way) */
export const endOf = (h, floor) => (pick(h, floor, 0x51ab37) & 1 ? 1 : -1);
/** the ticks one sweep of `floor`'s slab takes: the curve + the seeded wobble (± WOBBLE), never out of the curve's band */
export function sweepTicks(h, floor) {
  const s = sweepBase(floor) + (pick(h, floor, 0x77e19d) % (2 * WOBBLE + 1)) - WOBBLE;
  return s < SWEEP_MIN ? SWEEP_MIN : s > SWEEP_MAX ? SWEEP_MAX : s;
}
/**
 * THE SLIDE: the slab's offset from the tower's top (its low edge − the top's low edge on the slide axis; 0 = dead on) `k` ticks after
 * it entered — a triangle wave: e × TRAVEL at k = 0 (fully off), 0 at half a sweep, −e × TRAVEL at k = S, back at k = 2 S …
 * The floor is taken on the UNSIGNED distance, so the two directions mirror each other exactly.
 */
export function slideOff(S, e, k) {
  const m = k % (2 * S), kk = m <= S ? m : 2 * S - m, d = TRAVEL - Math.floor(2 * TRAVEL * kk / S);
  return e > 0 ? d : 0 - d;   // (0 − d: never a negative zero)
}

/** a new run: the base slab (START × START, centred on 0) "landed" at tick 0 — the first slab enters at tick BEAT */
export function createRun({ seed, mode = 'solo' } = {}) {
  if (!modeRow(mode)) throw new Error(`highrise: unknown mode ${mode}`);
  const s = String(seed), half = START / 2;
  return {
    seed: s, mode, h: seedHash(s),
    t: 0,                                   // the tick the run was stepped to
    st: 'beat',                             // 'beat' (a landing beat: no slab) | 'slide' | 'out' | 'made' | 'cap'
    floor: 0, at: 0,                        // the slabs landed + the tick the last one landed (THE RANKING: height, then the earlier tick)
    x0: -half, x1: half, z0: -half, z1: half,   // THE TOP SLAB's edges (integers)
    s0: BEAT, S: 0, e: 0,                   // the slab's entry tick (in a beat: the NEXT one's) · its sweep ticks · its entry end (+1 / −1)
    streak: 0, perfects: 0, maxStreak: 0, taps: 0,
    cause: '', end: -1,                     // out: 'miss' | 'thin' | 'slow' · the tick the run ended
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
  run.st = 'slide'; run.S = sweepTicks(run.h, floor); run.e = endOf(run.h, floor);
  if (ev) ev.push({ e: 'spawn', floor, axis: axisOf(floor), from: run.e, S: run.S, t: run.s0 });
}

/**
 * A DROP at tick T — a tap, or THE FUSE's (the SAME drop; only the cause of an end differs: TOO SLOW). The overlap with the slab below on
 * the slide axis, in integers: |offset| ≤ PERFECT → a PERFECT (it snaps onto the slab below; the streak grows; from the 7th in a row the
 * slab GROWS BACK) · no overlap → OUT, a miss · else it is CUT to the overlap (the streak ends) and, if a side is under THIN, it slips off.
 */
function drop(run, T, fuse, ev) {
  const floor = run.floor + 1, x = floor % 2 === 0, axis = x ? 'x' : 'z';
  const lo = x ? run.x0 : run.z0, hi = x ? run.x1 : run.z1, size = hi - lo;
  const off = slideOff(run.S, run.e, T - run.s0), a = off < 0 ? -off : off;
  if (!fuse) run.taps++;
  if (ev) ev.push({ e: 'drop', floor, axis, off, fuse, t: T });
  let nlo = lo, nhi = hi;
  if (a <= PERFECT) {
    run.streak++; run.perfects++;
    if (run.streak > run.maxStreak) run.maxStreak = run.streak;
    if (ev) ev.push({ e: 'perfect', floor, streak: run.streak, t: T });
    if (run.streak > GROW_STREAK && size < START) {
      const g = START - size < GROW ? START - size : GROW, l = Math.floor(g / 2);
      nlo = lo - l; nhi = hi + (g - l);
      if (ev) ev.push({ e: 'grow', floor, axis, by: g, t: T });
    }
  } else {
    run.streak = 0;
    if (a >= size) return finish(run, 'out', fuse ? 'slow' : 'miss', T, ev);
    // the CUT: the piece past the slab below falls away (its size + side are rules data; its fall is the view's)
    if (off > 0) nlo = lo + off; else nhi = hi + off;
    if (ev) ev.push({ e: 'cut', floor, axis, side: off > 0 ? 1 : -1, piece: { lo: off > 0 ? hi : lo + off, hi: off > 0 ? hi + off : lo, size: a }, t: T });
    if (nhi - nlo < THIN || (x ? run.z1 - run.z0 : run.x1 - run.x0) < THIN) return finish(run, 'out', fuse ? 'slow' : 'thin', T, ev);
  }
  if (x) { run.x0 = nlo; run.x1 = nhi; } else { run.z0 = nlo; run.z1 = nhi; }
  run.floor = floor; run.at = T;
  if (ev) ev.push({ e: 'land', floor, x0: run.x0, x1: run.x1, z0: run.z0, z1: run.z1, t: T });   // (the slab as it lies — a view needs nothing else to draw it)
  const M = MODES[run.mode];
  if (M.finish != null && floor >= M.finish) return finish(run, 'made', '', T, ev);
  run.st = 'beat'; run.s0 = T + BEAT;
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
  const cap = MODES[run.mode].capTicks;
  while (!isOver(run)) {
    const next = run.st === 'beat' ? run.s0 : run.s0 + FUSE_SWEEPS * run.S;
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

/** THE SLIDING SLAB at a tick (null = none: a beat, the run over): its edges + its offset from the top — for the VIEW (which may ease between two ticks) */
export function slabAt(run, tick) {
  if (run.st !== 'slide') return null;
  const floor = run.floor + 1, x = floor % 2 === 0, lim = FUSE_SWEEPS * run.S;
  let k = tick - run.s0;
  if (k < 0) k = 0; else if (k > lim) k = lim;
  const off = slideOff(run.S, run.e, k);
  return { floor, axis: x ? 'x' : 'z', off, x0: run.x0 + (x ? off : 0), x1: run.x1 + (x ? off : 0), z0: run.z0 + (x ? 0 : off), z1: run.z1 + (x ? 0 : off) };
}
/** THE TOP SLAB as the view wants it: its centre + its sides (a centre may sit on a half unit — the RULES only ever use the edges) */
export const topOf = run => ({ cx: (run.x0 + run.x1) / 2, cz: (run.z0 + run.z1) / 2, w: run.x1 - run.x0, d: run.z1 - run.z0 });

/** the run's RESULT — what the phone shows and the server's judge returns (the same code) */
export function resultOf(run) {
  return {
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
