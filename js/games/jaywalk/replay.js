// JAYWALK — THE REPLAY (H1 — docs/jaywalk.md): replay({ seed, mode, log }) → the run's result, PURE — the SAME code the phone runs
// (engine.js#step, tick by tick). The phone shows it after every run (the owner's determinism check on a real iPhone); the server's verify
// (api/_lib/jaywalk.js) = these bounds + this replay. + THE HOP LOG's packed form (the proof node's chunks) + THE SPEED CHECK + THE JUDGE
// (H4 — judgeRun: the ONE function the host's podium and the server's count both run).
import { MODES, DIRS, MIN_INPUT_GAP, MAX_INPUTS_PER_SEC, MAX_LOG, SEED_MAX, TICK_HZ, CLOCK } from './tuning.js';
import { createCourse } from './course.js';
import { createRun, step, isOver, resultOf, inputProblem } from './engine.js';

/** the hard stop of a replay past the log's last hop: an idle kid is always caught (the wall, the water, the edge) within seconds */
const IDLE_TICKS = 5 * 60 * TICK_HZ;

/**
 * → { lanes, tick, end, over, y, x, cause, taken, hits, feats: { boom, ufo, airfield }, used }
 *   lanes = the farthest lane landed on · tick = when (the tie-break: the earlier tick wins) · end = the tick the run ended (−1 = `until` came first) ·
 *   cause = the hit ('car' | 'water' | 'train' | 'edge' | 'blackbird' | 'ufo' | 'wall') or 'taken' (THE MOTHERSHIP) · used = the log entries played.
 * A hop logged at tick t is applied IN tick t (a hop logged after the run ended is never played: `used` < log.length).
 * `until` (optional) stops at that tick (a run still going — the ghosts, a match scored as it stands).
 */
export function replay({ seed, mode = 'solo', log = [], until = null } = {}) {
  const run = createRun({ seed, mode }), course = createCourse(seed);
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
  for (let i = 0; i < log.length; i++) {
    const h = log[i];
    if (!h || typeof h !== 'object') return 'entry';
    const why = inputProblem(log, i, h && h.t, h && h.d, mode);   // (engine.js — the recorder's own function: the two can not differ)
    if (why) return why;
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
/** the chunks joined → the log, or null (a bad string); `t0` = the tick of the hop before the string's first (0 for the log's start) */
export function unpackLog(str, t0 = 0) {
  if (typeof str !== 'string') return null;
  const out = [];
  let t = t0, i = 0;
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
/** a chunk as the proof node holds it: H3 = { s: the packed hops, at: the SERVER's time it was written (the rules: === now) }; a bare
 *  string (H1's shape — the pure tests) still reads */
const chunkStr = v => (typeof v === 'string' ? v : v && typeof v === 'object' && typeof v.s === 'string' ? v.s : null);
const chunkKeys = c => Object.keys(c).map(Number).sort((a, b) => a - b);
/** the chunks of a proof node ({ 0: { s, at }, 1: … } or an array) → the hop log, or null (a hole, a bad chunk); none = an empty log */
export function logFromChunks(c) {
  if (c == null) return [];
  const keys = chunkKeys(c);
  let s = '';
  for (let i = 0; i < keys.length; i++) { const x = chunkStr(c[i]); if (keys[i] !== i || x == null) return null; s += x; }
  return unpackLog(s);
}
/** THE CHUNKS' OWN CLOCK (H3) → [{ at (the server's time), n (its hops), t0, t1 (its first + last hop's tick) }], or null (a hole, a bad
 *  chunk, a chunk without its timestamp) */
export function chunkTimes(c) {
  if (c == null) return [];
  const keys = chunkKeys(c), out = [];
  let t = 0;
  for (let i = 0; i < keys.length; i++) {
    const v = c[i], x = chunkStr(v), at = v && typeof v === 'object' ? v.at : null;
    if (keys[i] !== i || x == null || typeof at !== 'number' || !Number.isFinite(at)) return null;
    const hops = unpackLog(x, t);
    if (!hops) return null;
    out.push({ at, n: hops.length, t0: hops.length ? hops[0].t : t, t1: hops.length ? hops[hops.length - 1].t : t });
    if (hops.length) t = hops[hops.length - 1].t;
  }
  return out;
}
/**
 * THE SPEED CHECK, BOTH WAYS (H3 — PURE) + THE DROPPED SIGNAL (H4). Tick 0 = `go` (a server time). A chunk's `at` = the server's time it
 * ARRIVED. It may not hold a hop AHEAD of the real clock (tick > the clock's tick + CLOCK.ahead: a sped-up game, a log made in advance) —
 * the run is refused. A hop far BEHIND it (its chunk's first hop > CLOCK.behind late) is one of two things:
 *   · A DROPPED SIGNAL: the phone was offline — its queued chunks arrive TOGETHER after a SILENCE. The lag is explained when no hop is
 *     older than the last arrival before the silence (− CLOCK.behind), the silence is ≤ CLOCK.drop, and the burst is back on the clock
 *     within CLOCK.catchUp of its first chunk (a later chunk on time), each chunk of it LESS late than the one before — or the run
 *     simply ended inside it. Never held against the run.
 *   · SLOW MOTION: the ticks drift behind while the chunks keep arriving — no silence explains it → BEHIND: the run counts up to the
 *     first late hop. A "drop" that never catches up was slow motion all along → cut at the burst's first hop.
 * → null (honest) | { why: 'go' | 'chunks' | 'clock' | 'ahead' | 'behind', tick (behind: the run counts up to it), hops (the hops before it) }
 * `from` (a MATCH): the earliest a chunk may arrive — the first GO (tick 0 is 2 s after it); default = `go`.
 */
export function clockProblem(go, times, { from = null } = {}) {
  if (typeof go !== 'number' || !(go > 0)) return { why: 'go' };
  if (!Array.isArray(times)) return { why: 'chunks' };
  const tickOf = at => Math.floor((at - go) * TICK_HZ / 1000);
  let last = from == null ? go : from, hops = 0, drop = null;   // (drop: a burst whose lag the silence before it explains — until it catches up)
  for (const k of times) {
    if (!(k.at >= last)) return { why: 'clock' };   // (a chunk's time never runs backwards, never before GO)
    const prev = last;
    last = k.at;
    if (k.n) {
      const now = tickOf(k.at);
      if (k.t1 > now + CLOCK.ahead) return { why: 'ahead' };
      if (k.t0 >= now - CLOCK.behind) drop = null;   // (on the clock — a drop before it is settled)
      // (inside a burst the queued chunks arrive together: each one's lag is SMALLER than the one before — a lag that GROWS, or a burst
      //  still late past its time, was slow motion all along: the run counts up to the burst's first hop)
      else if (drop) { const lag = now - k.t0; if (k.at > drop.until || lag > drop.lag + CLOCK.jitter) return { why: 'behind', tick: drop.tick, hops: drop.hops }; drop.lag = lag; }
      else {
        const silence = Math.min(k.at - prev, CLOCK.drop);
        if (k.t0 < tickOf(k.at - silence) - CLOCK.behind) return { why: 'behind', tick: k.t0, hops };
        drop = { tick: k.t0, hops, until: k.at + CLOCK.catchUp, lag: now - k.t0 };
      }
    }
    hops += k.n;
  }
  return null;
}

/**
 * THE JUDGE (H4 — PURE): ONE run from its hop log + its chunks' clock — the host's podium (logic.js#scoreNode) and the server's count
 * (api/_lib/jaywalk.js) run THIS, so they agree to the lane. → { ok: true, result (the replay's), over, cut? } | { ok: false, why }
 * Refused: a log that breaks the bounds · AHEAD of the clock · a broken clock · a hop logged after the run had ended. A log BEHIND the
 * clock is CUT (`cut: { why, tick }`): the run counts up to its last on-time hop. `until` = score it as it stands at that tick.
 */
export function judgeRun({ seed, mode = 'solo', log, go = null, times = null, from = null, until = null } = {}) {
  const bad = logProblem(log, mode);
  if (bad) return { ok: false, why: bad };
  let cut = null;
  if (go != null || times != null) {
    const c = clockProblem(go, times, { from });
    if (c && c.why !== 'behind') return { ok: false, why: c.why === 'ahead' ? 'ahead of the clock' : c.why === 'clock' ? 'the chunks\' clock' : c.why };
    if (c) cut = { why: 'behind', tick: c.tick };
    if (c) log = log.slice(0, c.hops);
  }
  const r = replay({ seed, mode, log, until: cut ? (until == null ? cut.tick : Math.min(until, cut.tick)) : until });
  if (!cut && r.over && r.used < log.length) return { ok: false, why: 'past the end' };
  const { used, over, ...result } = r;
  // (THE PROOF PASS: + `hops` — the hops the replay PLAYED: "a GO alone is not a player" reads it, never a phone's claim)
  return cut ? { ok: true, result, over, cut, hops: used } : { ok: true, result, over, hops: used };
}
