// JAYWALK — THE REPLAY (H1 — docs/jaywalk.md): replay({ seed, mode, log, oneUp }) → the run's result, PURE — the SAME code the phone runs
// (engine.js#step, tick by tick). The phone shows it after every run (the owner's determinism check on a real iPhone); the server's verify
// (api/_lib/jaywalk.js) = these bounds + this replay. + THE HOP LOG's packed form (the proof node's chunks — H4).
import { MODES, DIRS, MIN_INPUT_GAP, MAX_INPUTS_PER_SEC, MAX_LOG, SEED_MAX, TICK_HZ, ONE_UP } from './tuning.js';
import { createCourse } from './course.js';
import { createRun, step, isOver, resultOf } from './engine.js';

/** the hard stop of a replay past the log's last hop: an idle kid is always caught (the wall, the water, the edge) — 3 lives × well under a minute each */
const IDLE_TICKS = 5 * 60 * TICK_HZ;

/**
 * → { lanes, tick, end, over, cause, lives, taken, hits, feats: { boom, ufo, airfield }, used }
 *   lanes = the farthest lane landed on · tick = when (the tie-break: the earlier tick wins) · end = the tick the run ended (−1 = `until` came first) ·
 *   cause = the last hit ('car' | 'water' | 'train' | 'edge' | 'blackbird' | 'ufo' | 'wall') or 'taken' (THE MOTHERSHIP) · used = the log entries played.
 * A hop logged at tick t is applied IN tick t (a hop logged after the run ended is never played: `used` < log.length).
 * `until` (optional) stops at that tick (a run still going — the spectators' ghosts, H4). `oneUp` = THE ONE-UP switch (tuning.js#ONE_UP).
 */
export function replay({ seed, mode = 'solo', log = [], oneUp = ONE_UP, lives, until = null } = {}) {
  const run = createRun({ seed, mode, lives, oneUp }), course = createCourse(seed, { oneUp: run.oneUp });
  const n = log.length, stop = (n ? log[n - 1].t : 0) + IDLE_TICKS;
  let i = 0;
  while (!isOver(run) && run.t <= stop && (until == null || run.t < until)) {
    let d = '';
    if (i < n && log[i].t === run.t) { d = log[i].d; i++; }
    step(run, course, d);
  }
  return { ...resultOf(run), used: i };
}

/** THE HOP LOG's BOUNDS (PURE — the server refuses a log that breaks one; the phone's recorder never makes one): null = fine, else why */
export function logProblem(log, mode = 'solo') {
  const M = MODES[mode];
  if (!M) return 'mode';
  if (!Array.isArray(log)) return 'log';
  const cap = M.cap ? Math.min(MAX_LOG, Math.floor(M.cap / MIN_INPUT_GAP)) : MAX_LOG;
  if (log.length > cap) return 'too long';
  let last = -MIN_INPUT_GAP;
  for (let i = 0; i < log.length; i++) {
    const h = log[i];
    if (!h || typeof h !== 'object' || !Number.isInteger(h.t) || h.t < 0 || !DIRS.includes(h.d)) return 'entry';
    if (h.t <= last && i) return 'ticks not rising';
    if (h.t - last < MIN_INPUT_GAP) return 'too fast';
    if (M.cap && h.t >= M.cap) return 'past the cap';
    if (i >= MAX_INPUTS_PER_SEC && h.t - log[i - MAX_INPUTS_PER_SEC].t < TICK_HZ) return 'too fast';
    last = h.t;
  }
  return null;
}
export const seedProblem = seed => (typeof seed !== 'string' || !seed || seed.length > SEED_MAX ? 'seed' : null);

// ---- THE PACKED LOG (the proof node's chunks): a hop = its direction's CAPITAL + the ticks since the hop before it, base 36 — "U0R1cU9"
const UP = { u: 'U', l: 'L', r: 'R', d: 'D' }, DOWN = { U: 'u', L: 'l', R: 'r', D: 'd' };
/** hops [from …) → a string; `prev` = the tick of the hop before the first one (0 for the log's start) */
export function packLog(log, from = 0, prev = from > 0 ? log[from - 1].t : 0) {
  let s = '', p = prev;
  for (let i = from; i < log.length; i++) { s += UP[log[i].d] + (log[i].t - p).toString(36); p = log[i].t; }
  return s;
}
/** the chunks joined → the log, or null (a bad string) */
export function unpackLog(str) {
  if (typeof str !== 'string') return null;
  const out = [];
  let t = 0, i = 0;
  while (i < str.length) {
    const d = DOWN[str[i++]];
    let j = i;
    while (j < str.length && !DOWN[str[j]]) j++;
    const num = str.slice(i, j);
    if (!d || !/^[0-9a-z]{1,6}$/.test(num)) return null;
    t += parseInt(num, 36);
    out.push({ t, d });
    i = j;
  }
  return out;
}
