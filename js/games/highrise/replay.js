// HIGH RISE — THE REPLAY + THE JUDGE (S1 — docs/highrise.md "THE JUDGE"): PURE — the SAME code the phone runs (engine.js). The phone
// shows the replay after every run (REPLAY = LIVE: the owner's determinism check on a real iPhone); the server's judge
// (api/_lib/highrise.js) = judgeRun. + THE TAP LOG's packed form.
import { BEAT, FLOOR_TICKS_MAX, MAX_TAPS, SEED_MAX } from './tuning.js';
import { createRun, stepTo, tap, isOver, resultOf, modeRow } from './engine.js';

/** a seed = 1 … 64 printable ASCII characters, no space (seedOf makes [0-9a-z]) — nothing a transport could normalise into another seed */
export const seedProblem = seed => (typeof seed !== 'string' || seed.length > SEED_MAX || !/^[!-~]+$/.test(seed) ? 'seed' : null);

/** the most taps a `mode` run can hold: a tap = a drop = a floor (the finishing floor ends the run) */
export const maxTaps = mode => { const M = modeRow(mode); return M && M.finish != null ? Math.min(M.finish, MAX_TAPS) : MAX_TAPS; };

/**
 * THE TAP LOG's BOUNDS (PURE, no replay — cheap: the judge refuses these before it plays a tick): null = fine, else why.
 *   not a list · longer than the mode's floors · a tick that is not a whole number ≥ 0 · ticks not rising · two taps closer than THE
 *   LANDING BEAT (the slab after a drop is not there yet) · a tap before the first slab · a tap at / past the mode's CAP · a gap no honest
 *   run can have (THE FUSE would have dropped the slab long before: "a log longer than any honest run").
 * Every one of them is ALSO what the engine's own tap() refuses — the replay below is the truth; these give the refusal its name.
 */
export function tapsProblem(taps, mode = 'solo') {
  const M = modeRow(mode);
  if (!M) return 'mode';
  if (!Array.isArray(taps)) return 'taps';
  if (taps.length > maxTaps(mode)) return 'too many taps';
  let prev = 0;   // (the base "landed" at tick 0)
  for (let i = 0; i < taps.length; i++) {
    const t = taps[i];
    if (typeof t !== 'number' || !Number.isSafeInteger(t) || t < 0) return 'entry';
    if (i && t <= prev) return 'ticks not rising';
    if (t - prev < BEAT) return 'in the landing beat';
    if (M.capTicks != null && t >= M.capTicks) return 'past the cap';
    if (t - prev >= FLOOR_TICKS_MAX) return 'after the fuse';
    prev = t;
  }
  return null;
}

/**
 * replay({ seed, mode, taps, until }) → the run's result + `used` (the taps that dropped a slab) + `bad` (the index of the first tap that
 * did NOT land on a sliding slab, −1 = none) + `why` for it. Without `until` the run is played to its END — after the last tap THE FUSE
 * (or THE CAP) always ends it. `until` (a tick) = the run as it stands then (a run still going — a match scored live).
 */
export function replay({ seed, mode = 'solo', taps = [], until = null } = {}) {
  if (until != null && !(Number.isSafeInteger(until) && until >= 0)) until = 0;   // (a bad `until` counts nothing — never the whole run)
  const run = createRun({ seed, mode });
  let used = 0, bad = -1, why = '';
  for (let i = 0; i < taps.length; i++) {
    const t = taps[i];
    if (until != null && t > until) break;
    const over = isOver(run);
    if (!over && tap(run, t)) { used++; continue; }
    bad = i;
    why = over || isOver(run) ? 'past the end' : run.st === 'beat' || t < run.s0 ? 'in the landing beat' : 'no slab';
    break;
  }
  if (bad < 0) stepTo(run, until != null ? until : (taps.length ? taps[taps.length - 1] : 0) + BEAT + FLOOR_TICKS_MAX);
  return { ...resultOf(run), used, bad, why };
}

/**
 * THE JUDGE (PURE): ONE run from its seed + mode + tap log → { ok: true, floor, tick, end, cause, made, perfects, maxStreak, taps, feats }
 * | { ok: false, why }. The floor is the judge's own — a phone's claimed height is never read.
 * `mode` is REQUIRED (a missing one is never quietly judged as solo — no finish, no cap).
 * REFUSED: a malformed seed · an unknown mode · a log that breaks its bounds (tapsProblem) · a tap that does not land on a sliding slab
 * (in a landing beat · after the run ended).
 */
export function judgeRun({ seed, mode, taps } = {}) {
  if (!modeRow(mode)) return { ok: false, why: 'mode' };
  if (seedProblem(seed)) return { ok: false, why: 'seed' };
  const bad = tapsProblem(taps, mode);
  if (bad) return { ok: false, why: bad };
  const r = replay({ seed, mode, taps });
  if (r.bad >= 0) return { ok: false, why: r.why };
  if (!r.over) return { ok: false, why: 'never ended' };   // (can not happen: the fuse ends every run — kept as the judge's own floor)
  return { ok: true, floor: r.floor, tick: r.tick, end: r.end, cause: r.cause, made: r.made, perfects: r.perfects, maxStreak: r.maxStreak, taps: r.taps, feats: r.feats };
}

// ---- THE PACKED LOG (S2's run node): each tap = the ticks since the tap before it (the first: since tick 0), base 36, '.' between — "1c.1k.2a"
export function packTaps(taps) {
  let s = '', p = 0;
  for (let i = 0; i < taps.length; i++) { s += (i ? '.' : '') + (taps[i] - p).toString(36); p = taps[i]; }
  return s;
}
/** → the tap log, or null (a bad string); '' = an empty log */
export function unpackTaps(str) {
  if (typeof str !== 'string' || str.length > 7 * MAX_TAPS) return null;   // (longer than any log packs to: refused before it is read)
  if (!str) return [];
  if (!/^(?:0|[1-9a-z][0-9a-z]{0,5})(?:\.(?:0|[1-9a-z][0-9a-z]{0,5}))*$/.test(str)) return null;   // (canonical: packTaps(unpackTaps(s)) === s)
  const out = [];
  let t = 0;
  for (const part of str.split('.')) { t += parseInt(part, 36); out.push(t); }
  return out;
}
