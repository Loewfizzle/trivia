// HIGH RISE — THE PROOF (S4A — docs/highrise.md "THE PROOF"; JAYWALK's `jw` node, copied: docs/jaywalk.md "THE REPLAY + THE PROOF"). PURE —
// the phone, the host's director and the SERVER run this file. A run is counted ONLY from its PROOF NODE:
//   rooms/{CODE}/hr/{matchId}/{uid} = { go (the SERVER's time, written ONCE at GO — the seed is picked from it: logic.js#seedOf; tick 0),
//     c/{i} = { s: the packed taps of that chunk, at: the SERVER's time it ARRIVED } (append only, i 0 … 9999, ≤ 400 chars),
//     e { f, t, w } (the run's end, once — a SIGNAL for the host's step: never read as a score),
//     rs (S4B — the RULE SET the run is played on: rules.js — written once, right behind GO; none = "classic"; the judge refuses one it does not know) }
// THE JUDGE (judgeNode) = the chunks → the tap log + its clock → THE SPEED CHECK both ways + THE DROPPED SIGNAL → replay.js#judgeRun (the
// SAME engine the phone ran). A phone's claimed floor is never read — there is no field the judge takes one from.
import { judgeRun, unpackTaps } from './replay.js';
import { TICK_HZ } from './tuning.js';
import { seedOf, firstGo } from './logic.js';
import { RULES_DEFAULT, ruleSet } from './rules.js';

/**
 * THE CLOCK (JAYWALK's, number for number — a run is played ON the server's clock; every chunk carries the moment it ARRIVED):
 *   ahead   a chunk's LAST tap at most 2 s ahead of its own timestamp (the phone's clock estimate + a frame) — more = a sped-up game / a
 *           log made in advance → the whole run REFUSED
 *   behind  … its FIRST tap at most 8 s behind it (the upload every second + a slow network) — more, with no silence to explain it =
 *           SLOW MOTION → the run is CUT there (it counts up to its last on-time tap)
 *   drop / catchUp / jitter   THE DROPPED SIGNAL: a silence (≤ 75 s), then the queued chunks landing together and back on the clock
 *           within 15 s, each less late than the one before (6 ticks of jitter) — never held against the run
 *   flushMs the phone uploads its new taps this often · chunkMax / chunks = the rules' bounds
 */
export const CLOCK = Object.freeze({ ahead: 2 * TICK_HZ, behind: 8 * TICK_HZ, drop: 75 * 1000, catchUp: 15 * 1000, jitter: 6, flushMs: 1000, chunkMax: 400, chunks: 10000 });

/** the taps [from …) as ONE chunk's string: each tap = the ticks since the tap before it (the first of the log: since tick 0), base 36, '.' between */
export function packFrom(taps, from = 0, to = taps.length) {
  let s = '', p = from > 0 ? taps[from - 1] : 0;
  for (let i = from; i < to; i++) { s += (i > from ? '.' : '') + (taps[i] - p).toString(36); p = taps[i]; }
  return s;
}
const chunkStr = v => (v && typeof v === 'object' && typeof v.s === 'string' ? v.s : typeof v === 'string' ? v : null);
const chunkKeys = c => Object.keys(c).map(Number).sort((a, b) => a - b);
/** a proof node's chunks ({ 0: { s, at }, 1: … } or an array) → the tap log, or null (a hole, a bad / empty chunk); none = an empty log */
export function tapsFromChunks(c) {
  if (c == null) return [];
  if (typeof c !== 'object') return null;
  const keys = chunkKeys(c), parts = [];
  for (let i = 0; i < keys.length; i++) { const x = chunkStr(c[i]); if (keys[i] !== i || !x) return null; parts.push(x); }
  return unpackTaps(parts.join('.'));
}
/** THE CHUNKS' OWN CLOCK → [{ at (the server's time), n (its taps), t0, t1 (its first + last tap's tick) }], or null (a hole, a bad chunk,
 *  a chunk without its timestamp) */
export function chunkTimes(c) {
  if (c == null) return [];
  if (typeof c !== 'object') return null;
  const keys = chunkKeys(c), out = [];
  let t = 0;
  for (let i = 0; i < keys.length; i++) {
    const v = c[i], x = chunkStr(v), at = v && typeof v === 'object' ? v.at : null;
    if (keys[i] !== i || !x || typeof at !== 'number' || !Number.isFinite(at)) return null;
    const gaps = unpackTaps(x);   // (a chunk alone unpacks as gaps from 0: add the last tap before it)
    if (!gaps || !gaps.length) return null;
    const t0 = t + gaps[0], t1 = t + gaps[gaps.length - 1];
    out.push({ at, n: gaps.length, t0, t1 });
    t = t1;
  }
  return out;
}
/**
 * THE SPEED CHECK, BOTH WAYS + THE DROPPED SIGNAL (JAYWALK's replay.js#clockProblem, the same rule): tick 0 = `go` (a server time); a
 * chunk's `at` = the server's time it ARRIVED.
 * → null (honest) | { why: 'go' | 'chunks' | 'clock' | 'ahead' | 'behind', tick (behind: the run counts up to it), taps (the taps before it) }
 */
export function clockProblem(go, times) {
  if (typeof go !== 'number' || !(go > 0)) return { why: 'go' };
  if (!Array.isArray(times)) return { why: 'chunks' };
  const tickOf = at => Math.floor((at - go) * TICK_HZ / 1000);
  let last = go, taps = 0, drop = null;   // (drop: a burst whose lag the silence before it explains — until it catches up)
  for (const k of times) {
    if (!(k.at >= last)) return { why: 'clock' };   // (a chunk's time never runs backwards, never before GO)
    const prev = last;
    last = k.at;
    const now = tickOf(k.at);
    if (k.t1 > now + CLOCK.ahead) return { why: 'ahead' };
    if (k.t0 >= now - CLOCK.behind) drop = null;   // (on the clock — a drop before it is settled)
    else if (drop) { const lag = now - k.t0; if (k.at > drop.until || lag > drop.lag + CLOCK.jitter) return { why: 'behind', tick: drop.tick, taps: drop.taps }; drop.lag = lag; }
    else {
      const silence = Math.min(k.at - prev, CLOCK.drop);
      if (k.t0 < tickOf(k.at - silence) - CLOCK.behind) return { why: 'behind', tick: k.t0, taps };
      drop = { tick: k.t0, taps, until: k.at + CLOCK.catchUp, lag: now - k.t0 };
    }
    taps += k.n;
  }
  return null;
}

/**
 * THE JUDGE OF ONE NODE (PURE — the host's podium AND the server's count): { seed, mode, node } → the judge's answer
 *   { ok: true, floor, tick, end, cause, made, perfects, maxStreak, taps, feats, cut? } | { ok: false, why }
 * Refused: no GO · a hole / a bad chunk · a chunk's clock running backwards · a log AHEAD of the real clock · everything replay.js#judgeRun
 * refuses (the bounds, a tap in a landing beat, a tap after the end). A log that falls BEHIND the clock with no silence to explain it is
 * CUT (`cut: { why: 'behind', tick }`): judged up to its last on-time tap — the fuse then ends that run where it stood.
 */
export function judgeNode({ seed, mode = 'solo', node, mirror = false, rules = null } = {}) {
  if (!node || typeof node !== 'object' || !(Number(node.go) > 0)) return { ok: false, why: 'no go' };
  // (S4B — THE RULE SET: the node's own `rs` — none = "classic". `rules` = the set a MATCH is played on (its first GO's player's): a
  //  node that names another one is refused — everyone in a match climbs by the same numbers)
  const rs = node.rs == null ? RULES_DEFAULT : node.rs;
  if (rules != null && rs !== rules) return { ok: false, why: 'rules' };
  let taps = tapsFromChunks(node.c);
  const times = chunkTimes(node.c);
  if (!taps || !times) return { ok: false, why: 'chunks' };
  // (THE REVIEW — `mirror`: THE HOST's PODIUM judges its own LIVE mirror, where a chunk still in flight carries the phone's ESTIMATE of
  //  the server's time — a round trip early, so it can read as stamped BEFORE the acknowledged chunk ahead of it: an honest run refused
  //  as "the chunks' clock". The podium's read takes the times as never running backwards; THE SERVER's judge never sets it — strict.)
  if (mirror) { let last = Number(node.go); for (const k of times) { if (k.at < last) k.at = last; last = k.at; } }
  const c = clockProblem(Number(node.go), times);
  let cut = null;
  if (c && c.why !== 'behind') return { ok: false, why: c.why === 'ahead' ? 'ahead of the clock' : c.why === 'clock' ? 'the chunks\' clock' : c.why };
  if (c) { cut = { why: 'behind', tick: c.tick }; taps = taps.slice(0, c.taps); }
  const j = judgeRun({ seed, mode, taps, rules: rs });
  return j.ok && cut ? { ...j, cut } : j;
}
/** S4B — a MATCH's rule set = the one THE FIRST GO's player named (none = "classic"): PURE — the phones, the host and the server agree.
 *  THE CLOSE's REVIEW: a set NOBODY KNOWS is never the match's — the match stays "classic" and that player's own node is the one refused
 *  (one player naming "zz" voided everyone's tower); two GOs in the same millisecond: the LOWEST uid's (never the order the keys came in). */
export function matchRules(runs) {
  const g0 = firstGo(runs);
  if (!(g0 > 0)) return RULES_DEFAULT;
  let first = null;
  for (const u of Object.keys(runs || {})) { const n = runs[u]; if (n && Number(n.go) === g0 && (first === null || u < first)) first = u; }
  const rs = first === null ? null : runs[first].rs;
  return rs != null && ruleSet(rs) ? rs : RULES_DEFAULT;
}
/** a SOLO run's node: the seed = logic.js#seedOf(code, matchId, its own GO) — picked AFTER GO, nobody can shop for a tower */
export const judgeSolo = ({ code, matchId, node, mirror = false } = {}) => (node && Number(node.go) > 0
  ? judgeNode({ seed: seedOf(String(code), String(matchId), Number(node.go)), mode: 'solo', node, mirror }) : { ok: false, why: 'no go' });
