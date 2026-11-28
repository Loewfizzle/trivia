// FREEFALL — THE PROOF (F4A — docs/freefall.md "THE PROOF"; … proof.js#1
import { judgeRun, unpackLog, isHold, packMove } from './replay.js';
import { TICK_HZ, ENTRY_CHARS_MAX, MAX_LOG, HOLDS_MAX, MODES, RULES_DEFAULT } from './tuning.js';
import { seedOf } from './logic.js';
import { overChunkCeiling } from '../../core/proof.js';

// the most chunks a second this game's writer can send (one … proof.js#2
export const CHUNKS_PER_SEC = 7;
/** tick 0 = the GO's server time + this: the first drag writes GO, the answer is back, the sounds are decoded — the ball always drops in
 *  from the same height (the opening's camera sweeps down meanwhile) */
export const START_LEAD_MS = 600;
/** a GO whose answer comes back later than this after its own server time starts no proven run (the darkness would have most of its
 *  grace already): the run plays UNPROVEN on its own seed */
export const START_LATE_MS = 2500;
/** a HOLD's way back: the run goes on this long after its resume stamp (the 3 · 2 · 1 — stage.js#COUNT_MS × 3) */
export const RESUME_LEAD_MS = 2400;
/** the holds a node can carry a stamp for (the solo run's: tuning.js) */
export const HOLD_STAMPS = HOLDS_MAX;

/**
 * THE CLOCK (JAYWALK's + HIGH RISE's, number for number — a run is played ON the server's clock; every chunk carries the moment it ARRIVED):
 *   ahead   a chunk's LAST event at most 2 s ahead of its own timestamp — more = a sped-up game / a log made in advance → REFUSED
 *   behind  … its FIRST event at most 8 s behind it — more, with no silence to explain it = SLOW MOTION → the run is CUT there
 *   drop / catchUp / jitter   THE DROPPED SIGNAL: a silence (≤ 75 s), then the queued chunks landing together and back on the clock
 *           within 15 s, each less late than the one before — never held against the run
 *   grant   THE PAUSE GAP (F4B): the chunk that CARRIES a hold — with every move before it — must ARRIVE within 2 s of the hold's own tick
 *           (F4A froze the run's clock at any hold: the 8 s of play before it could arrive at any time). Later = no pause was granted: the
 *           clock never stood, the run is CUT before that chunk
 *   flushMs the phone uploads its new FINAL events this often (the owner: chunked ~200–250 ms) · chunkMax / chunks = the rules' bounds
 */
export const CLOCK = Object.freeze({ ahead: 2 * TICK_HZ, behind: 8 * TICK_HZ, grant: 2 * TICK_HZ, drop: 75 * 1000, catchUp: 15 * 1000, jitter: 6, flushMs: 250, chunkMax: 400, chunks: 10000 });
/** THE PAUSE GAP (F4B — the owner, Nov 26: "a pause is granted only after the moves before it are sent + stamped; nothing arrives late"):
 *  the phone's own margin — it calls a pause GRANTED only when the hold's chunk was stamped this long after the hold at the most (tighter
 *  than the judge's CLOCK.grant: the phone's idea of the server's clock is a network's beat off) */
export const GRANT_PHONE_MS = 1500;
/** FIX C — S5 A HOLD's LONGEST: a hold whose way back was stamped more than this after the hold's own wall time has no way back — the run
 *  is CUT at that hold (a hold at tick 2 = the clock stopped for hours with the seed known: it would beat any human-likeness check) */
export const HOLD_MAX_MS = 10 * 60 * 1000;
/** FIX C — S4 A MATCH's END-BURST: a run that ENDS inside a dropped-signal burst counts that burst only when its silence was this short at
 *  most (else it is CUT where the silence began — slow motion at the end of a match is never taken whole) */
export const END_BURST_MS = 20 * 1000;
const MS = 1000 / TICK_HZ;

// ---- the writer's half: the run's own log (engine.js: … proof.js#3

/** how many of the run's log events are FINAL now (the engine can not change them again): all of them once the run is over; else the
 *  moves at or before the last landing DECIDED / the last hold, + every hold. ZERO GARBAGE: read from a frame. */
export function finalCount(run) {
  const n = run.lt.length, H = run.ht.length;
  if (run.st !== 'live') return n + H;
  const hl = H ? run.ht[H - 1] : -1, lim = run.ll > hl ? run.ll : hl;
  let i = n;
  while (i > 0 && run.lt[i - 1] > lim) i--;
  return i + H;
}
/** the run's log events [a, b) — in the log's own order (a move at a hold's tick comes before it) — as ONE chunk's text: exactly the
 *  characters replay.js#packRun writes for them (each event counts from the one before it: the chunks, joined, ARE the packed log) */
export function packRange(run, a, b) {
  const n = run.lt.length, H = run.ht.length;
  let s = '', pt = -1, pa = 0, i = 0, k = 0, idx = 0;
  while (idx < b && (i < n || k < H)) {
    const hold = k < H && (i >= n || run.ht[k] < run.lt[i]), t = hold ? run.ht[k] : run.lt[i];
    if (idx >= a) s += hold ? `!${(t - pt).toString(36)}` : packMove(pt, pa, t, run.la[i]);
    pt = t;
    if (hold) k++; else { pa = run.la[i]; i++; }
    idx++;
  }
  return s;
}

// ---- the chunks → the log + its clock

const chunkStr = v => (v && typeof v === 'object' && typeof v.s === 'string' ? v.s : typeof v === 'string' ? v : null);
const chunkKeys = c => Object.keys(c).map(Number).sort((a, b) => a - b);
/** the events one chunk's text holds: every event has exactly ONE of + − ! (a move's sign, a hold's mark); 0 = not a chunk (it must
 *  BEGIN an event — never a digit: a chunk is cut BETWEEN two events — and end in a digit) */
function eventsIn(x) {
  if (!x || x.length > CLOCK.chunkMax) return 0;
  const c0 = x.charCodeAt(0), cz = x.charCodeAt(x.length - 1);
  if (c0 !== 46 && c0 !== 43 && c0 !== 45 && c0 !== 33) return 0;                       // . + - !
  if (!((cz >= 48 && cz <= 57) || (cz >= 97 && cz <= 122))) return 0;                  // 0-9 a-z
  let n = 0;
  for (let i = 0; i < x.length; i++) { const c = x.charCodeAt(i); if (c === 43 || c === 45 || c === 33) n++; }
  return n;
}
/**
 * a proof node's chunks ({ 0: { s, at }, 1: … } or an array) → { log: [{ t, a } | { k: 'hold', t }], n: [the events each chunk holds] },
 * or null (a hole, a bad / empty chunk, a text that is not a canonical packed log, one longer than any log packs to); none = an empty log
 */
export function logFromChunks(c) {
  if (c == null) return { log: [], n: [] };
  if (typeof c !== 'object') return null;
  const keys = chunkKeys(c), n = [];
  let all = '';
  for (let i = 0; i < keys.length; i++) {
    const x = chunkStr(c[i]), k = keys[i] === i ? eventsIn(x) : 0;
    if (!k) return null;
    n.push(k); all += x;
    if (all.length > ENTRY_CHARS_MAX * (MAX_LOG + HOLDS_MAX)) return null;
  }
  const log = unpackLog(all);
  if (!log) return null;
  let sum = 0;
  for (const k of n) sum += k;
  return sum === log.length ? { log, n } : null;
}
/** how many log events a node's chunks hold (the writer's read-back), −1 = broken */
export const eventsOf = c => { const L = logFromChunks(c); return L ? L.log.length : -1; };
/**
 * THE CHUNKS' OWN CLOCK → [{ at (the server's time), n (its events), t0, t1 (its first + last event's tick), s0, s1 (the SEGMENT each
 * lies in: the holds before it in the log — a hold itself closes the segment it is in), hn (F4B: the HOLDS it carries) }], or null (a
 * broken node, a chunk without its timestamp)
 */
export function chunkTimes(c, L = logFromChunks(c)) {
  if (!L) return null;
  if (c == null) return [];
  const out = [], seg = new Array(L.log.length);
  let h = 0;
  for (let i = 0; i < L.log.length; i++) { seg[i] = h; if (isHold(L.log[i])) h++; }
  let at0 = 0;
  for (let i = 0; i < L.n.length; i++) {
    const v = c[i], at = v && typeof v === 'object' ? v.at : null;
    if (typeof at !== 'number' || !Number.isFinite(at)) return null;
    const a = at0, b = at0 + L.n[i] - 1;
    out.push({ at, n: L.n[i], t0: L.log[a].t, t1: L.log[b].t, s0: seg[a], s1: seg[b], hn: seg[b] - seg[a] + (isHold(L.log[b]) ? 1 : 0) });
    at0 = b + 1;
  }
  return out;
}
// a node's resume stamps → [h0, h1, …] as far as they go … proof.js#4
export function stampsOf(node) {
  const h = node && node.h, out = [];
  if (h && typeof h === 'object') for (let i = 0; i < HOLD_STAMPS; i++) { const v = h[i]; if (typeof v !== 'number' || !(v > 0)) break; out.push(v); }
  return out;
}

/**
 * THE SPEED CHECK, BOTH WAYS + THE DROPPED SIGNAL + THE HOLDS' CLOCK. A run is played on THE RUN's CLOCK: tick 0 = `go` + START_LEAD_MS;
 * a HOLD at tick T freezes it — no tick passes while the run is held — and it goes on at T at `h[s]` + RESUME_LEAD_MS (the server's stamp
 * of the way back). A chunk's `at` = the server's time it ARRIVED.
 *   ahead   in WALL time: a chunk's last event can not lie more than 2 s after its own arrival — on its own segment's clock
 *   behind  in RUN ticks: its first event at most 8 s of PLAY behind the run's clock at its arrival (the time a run stood held is no
 *           lateness: the tail a phone could not send before it was locked lands when it is back)
 *   a hold's stamp can not lie before the hold itself; events after a hold WITHOUT its stamp — or AHEAD of it (a stamp that landed late:
 *   the phone had gone on without it) — have no clock: the run is CUT at that hold
 *   THE PAUSE GAP (F4B): a hold FREEZES the clock only when it was GRANTED — its own chunk (the hold + every move before it) arrived within
 *   CLOCK.grant of the hold's tick on the wall. A hold whose chunk came later was no pause: the clock ran on, the chunks before it are
 *   held to that running clock, and the run is CUT before the hold's own chunk ('pause')
 * → null (honest) | { why: 'go' | 'chunks' | 'clock' | 'ahead' | 'hold clock' } (refused) |
 *   { why: 'behind' | 'pause', tick, events (the events before the cut — the run counts up to them) } | { why: 'hold', tick, seg (the segments that have a clock) }
 */
export function clockProblem(go, times, holdTicks = [], stamps = [], endBurst = 0) {
  if (typeof go !== 'number' || !(go > 0)) return { why: 'go' };
  if (!Array.isArray(times)) return { why: 'chunks' };
  // the segments' clocks: base[s] = the server time segment s's first tick T[s] stands at
  const T = [0], base = [go + START_LEAD_MS];
  // (the server's time each hold's OWN chunk arrived at — the … proof.js#5
  let frozen = holdTicks.length, hi = 0, ci = 0;
  for (let s = 0; s < holdTicks.length; s++) {
    const paused = base[s] + (holdTicks[s] - T[s]) * MS;   // (the wall time the run was held at)
    while (ci < times.length && hi + (times[ci].hn || 0) <= s) { hi += times[ci].hn || 0; ci++; }
    // (THE PAUSE GAP: the hold's chunk arrived too late — no … proof.js#6
    if (ci < times.length && times[ci].at > paused + CLOCK.grant * MS) { frozen = s; break; }
    if (s >= stamps.length) break;
    if (stamps[s] < paused - CLOCK.ahead * MS) return { why: 'hold clock' };
    if (stamps[s] - paused > HOLD_MAX_MS) break;   // (FIX C — S5: too long a hold = no way back: cut at it)
    T.push(holdTicks[s]); base.push(stamps[s] + RESUME_LEAD_MS);
  }
  /** THE RUN's CLOCK at a server time: the tick the run stands at (frozen at a hold until its way back) */
  const runTick = at => {
    for (let s = base.length - 1; s >= 0; s--) {
      if (at < base[s] && s > 0) continue;
      const t = T[s] + Math.floor((at - base[s]) / MS);
      return s < frozen && t > holdTicks[s] ? holdTicks[s] : t;
    }
    return 0;
  };
  let last = go, events = 0, drop = null, holds = 0;
  for (const k of times) {
    if (!(k.at >= last)) return { why: 'clock' };   // (a chunk's time never runs backwards, never before GO)
    const prev = last;
    last = k.at;
    // (THE PAUSE GAP: this chunk carries the hold that was NOT granted — the run counts up to the events before it)
    holds += k.hn || 0;
    if (holds > frozen) return { why: 'pause', tick: holdTicks[frozen], events: drop ? drop.events : events }; // proof#7
    // (events past a hold whose way back was never stamped: no clock — the run counts up to that hold)
    if (k.s1 >= base.length) return { why: 'hold', tick: holdTicks[base.length - 1], seg: base.length };
    // (AHEAD of its own segment's clock. In the run's FIRST … proof.js#8
    if (base[k.s1] + (k.t1 - T[k.s1]) * MS > k.at + CLOCK.ahead * MS) return k.s1 > 0 ? { why: 'hold', tick: holdTicks[k.s1 - 1], seg: k.s1 } : { why: 'ahead' };
    const now = runTick(k.at);
    if (k.t0 >= now - CLOCK.behind) drop = null;   // (on the clock — a drop before it is settled)
    else if (drop) { const lag = now - k.t0; if (k.at > drop.until || lag > drop.lag + CLOCK.jitter) return { why: 'behind', tick: drop.tick, events: drop.events }; drop.lag = lag; }
    else {
      const silence = Math.min(k.at - prev, CLOCK.drop);
      if (k.t0 < runTick(k.at - silence) - CLOCK.behind) return { why: 'behind', tick: k.t0, events };
      drop = { tick: k.t0, events, until: k.at + CLOCK.catchUp, lag: now - k.t0, silence };
    }
    events += k.n;
  }
  // (FIX C — S4: the run ENDED inside a burst — a match takes it only after a short silence)
  if (drop && endBurst > 0 && drop.silence > endBurst) return { why: 'behind', tick: drop.tick, events: drop.events };
  return null;
}

/**
 * THE JUDGE OF ONE NODE (PURE — the host's podium AND the server's count): { seed, mode, node } → the judge's answer
 *   { ok: true, floor, tick, end, cause, made, bounces, shatters, blazes, bestRun, moves, feats, holds?, cut? } | { ok: false, why }
 * Refused: no GO · a hole / a bad chunk · more chunks than its own clock allows · a chunk's clock running backwards · a log AHEAD of the
 * real clock · a hold's stamp before its hold · everything replay.js#judgeRun refuses (the bounds, MAX SPIN, a move after the end, a HOLD
 * in a mode that has none: a match, the daily). A log that falls BEHIND the clock with no silence to explain it — or goes on past a hold
 * whose way back was never stamped — is CUT (`cut: { why, tick }`): judged up to its last on-time event (through that hold); the tower
 * then stands still and the run ends where the rules end it. F4B — THE PAUSE GAP: a hold whose own chunk arrived more than CLOCK.grant
 * after the hold's tick was never a pause (`cut.why: 'pause'`): the run counts up to the events before that chunk.
 * `mirror` = THE HOST's PODIUM judging its own LIVE mirror (a chunk still in flight carries the phone's ESTIMATE of the server's time):
 * the times are taken as never running backwards. THE SERVER never sets it — strict.
 */
export function judgeNode({ seed, mode = 'solo', node, mirror = false, ev = null, rules = null } = {}) {
  if (!node || typeof node !== 'object' || !(Number(node.go) > 0)) return { ok: false, why: 'no go' };
  // (FIX C — N7 THE RULE SET: the node's own `rs` — none = "classic"; `rules` = the set a MATCH is played on: a node naming another is refused)
  const rs = node.rs == null ? RULES_DEFAULT : node.rs;
  if (rules != null && rs !== rules) return { ok: false, why: 'rules' };
  if (overChunkCeiling(node, CHUNKS_PER_SEC)) return { ok: false, why: 'too many chunks' };   // (before anything is unpacked)
  const L = logFromChunks(node.c), times = chunkTimes(node.c, L);
  if (!L || !times) return { ok: false, why: 'chunks' };
  const go = Number(node.go);
  if (mirror) { let last = go; for (const k of times) { if (k.at < last) k.at = last; last = k.at; } }
  let log = L.log;
  const holdTicks = [];
  for (const e of log) if (isHold(e)) holdTicks.push(e.t);
  // (F4B: more holds than the mode has — a match / the daily: … proof.js#9
  if (holdTicks.length > ((Object.prototype.hasOwnProperty.call(MODES, mode) && MODES[mode].holds) || 0) && Object.prototype.hasOwnProperty.call(MODES, mode)) return { ok: false, why: 'too many holds' };
  const c = clockProblem(go, times, holdTicks, stampsOf(node), mode === 'match' ? END_BURST_MS : 0);
  let cut = null;
  if (c && c.why !== 'behind' && c.why !== 'hold' && c.why !== 'pause') return { ok: false, why: c.why === 'ahead' ? 'ahead of the clock' : c.why === 'clock' ? 'the chunks\' clock' : c.why };
  if (c && (c.why === 'behind' || c.why === 'pause')) { cut = { why: c.why, tick: c.tick }; log = log.slice(0, c.events); }
  if (c && c.why === 'hold') {
    // (through the hold that has no way back: the events of the segments that HAVE a clock + that hold itself)
    let n = 0, h = 0;
    for (; n < log.length; n++) if (isHold(log[n]) && ++h === c.seg) { n++; break; }
    cut = { why: 'hold', tick: c.tick }; log = log.slice(0, n);
  }
  const j = judgeRun({ seed, mode, log, ev, rules: rs });
  return j.ok && cut ? { ...j, cut } : j;
}
/** F4B — a MATCH's node: judged on THE FIRST GO's seed + clock — tick 0 = `playAt` (logic.js#matchStart: the first GO + its lead) for
 *  everyone, whatever the node's own GO says (it only proves the player was there on time: core/proof.js#onTime — the caller's check).
 *  NO HOLDS (the judge refuses one by name), THE FINISH at floor 200, the 3:00 cap. */
export const judgeMatch = ({ seed, node, playAt, mirror = false, ev = null, rules = null } = {}) => (node && Number(node.go) > 0 && Number(playAt) > 0
  ? judgeNode({ seed, mode: 'match', node: { ...node, go: Number(playAt) - START_LEAD_MS }, mirror, ev, rules }) : { ok: false, why: 'no go' });
// a SOLO run's node: the seed = logic.js#seedOf(code, … proof.js#10
export const judgeSolo = ({ code, matchId, node, mirror = false } = {}) => (node && Number(node.go) > 0
  ? judgeNode({ seed: seedOf(String(code), String(matchId), Number(node.go)), mode: 'solo', node, mirror }) : { ok: false, why: 'no go' });
