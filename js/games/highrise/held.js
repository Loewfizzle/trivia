// HIGH RISE DAILY A — THE HELD RUN (docs/highrise.md "THE DAILY"; the owner's decisions: docs/games/plan.md "THE HIGH RISE DAILY"). PURE —
// the phone (daily-run.js), the server (api/_lib/highrise-daily.js) and the unit tests run THIS file. ONE SHOT a day; the run is cut into
// LEGS — leg 0 from START, one more for every HOLD (a hidden / refreshed / killed page — the 3 the rules allow, + THE ROOM WINS' free ones):
//   THE RECORD (server-only, dly/highrise/{day}/p/{pid}) l/{i} = { u (the uid that opened it), go (the SERVER's time of the leg's tick 0),
//     z (its last moment), t (the PLAY tick its local tick 0 is: leg 0 = 0 — the base landed; leg i ≥ 1 = its hold's tick: the slab ENTERS
//     there), r? (a free hold — THE ROOM WINS) }
//   THE PROOF NODE (dly/highrise/{day}/w/{uid}/{i} — the phone appends, database.rules.json): { go, z (server-written), c/{k} = { s: the
//     packed taps in the leg's LOCAL ticks (the first gap from local 0), at: the SERVER's timestamp }, e? (closed — the phone's end, or the
//     SERVER's at the next hold: no chunk lands after it) }
// THE LOG = leg 0's taps, then for each later leg: its HOLD { k: 'hold', t, r? } + its taps + t (engine.js#hold — the slab that was swinging
// enters at t, its sweep from tick 0). Every leg passes THE SPEED CHECK on its own clock (proof.js#clockProblem — the same rule as every run).
import { createRun, tap, hold, isOver, resultOf } from './engine.js';
import { judgeRun, isHold, replay } from './replay.js';
import { tapsFromChunks, chunkTimes, clockProblem } from './proof.js';
import { RULE_SETS, RULES_DEFAULT, TICK_HZ } from './rules.js';

export const MODE = 'daily';
const R = RULE_SETS[RULES_DEFAULT], M = R.modes[MODE];
/** the player's holds a run (the owner: 3) · THE ROOM WINS' free ones · the legs a run can have */
export const HOLDS = M.holds, ROOM_HOLDS = M.roomHolds, LEGS_MAX = 1 + HOLDS + ROOM_HOLDS;
/** a leg's GO = the START's server time + this: the 3 · 2 · 1 (not run time — a hold's slab enters at its GO) */
export const LEAD_MS = 3000;
/** a leg's chunks' window past the most play it can hold (THE DROPPED SIGNAL's burst lands after a silence of ≤ 75 s — proof.js#CLOCK.drop) */
export const GRACE_MS = 90_000;
/** a run with no hold left is closed by `today` / THE DAY'S CLOSE once nothing has landed for this long (a playing phone sends every tap
 *  at once, and one floor is never longer than ~5 s: the beat + the fuse's two sweeps) */
export const QUIET_MS = 20_000;
/** the proof nodes are pruned past this many days (the run's result stays in the record) */
export const PROOF_DAYS = 7;
const ms = ticks => Math.ceil(ticks * 1000 / TICK_HZ);
/** a leg's last moment: its GO + the play left to the cap + the grace */
export const legEnd = (go, t) => go + ms(Math.max(0, M.capTicks - t)) + GRACE_MS;

const isNum = v => typeof v === 'number' && Number.isFinite(v);
/** the record's legs in order → [{ i, u, go, z, t, r? }] (a malformed one dropped — a hole ends the list) */
export function legsOf(rec) {
  const L = (rec && rec.l) || {}, out = [];
  for (let i = 0; i < LEGS_MAX; i++) {
    const x = L[i];
    if (!x || typeof x !== 'object' || !isNum(x.go) || !isNum(x.z) || !Number.isSafeInteger(x.t) || x.t < 0) break;
    out.push({ i, u: String(x.u || ''), go: x.go, z: x.z, t: x.t, ...(x.r ? { r: 1 } : {}) });
  }
  return out;
}
/** the holds used: the player's · the room's */
export const holdsOf = rec => { let h = 0, r = 0; for (const x of legsOf(rec).slice(1)) { if (x.r) r++; else h++; } return { h, r }; };
/** the player's holds left */
export const holdsLeft = rec => Math.max(0, HOLDS - holdsOf(rec).h);
/** can the NEXT start open a leg? (a free one owed by THE ROOM WINS, else one of the 3) → 'room' | 'hold' | null */
export function nextHoldKind(rec) {
  const { h, r } = holdsOf(rec), n = legsOf(rec).length;
  if (n >= LEGS_MAX) return null;
  if (rec && rec.room && r < ROOM_HOLDS) return 'room';
  return h < HOLDS ? 'hold' : null;
}
/** a leg node's chunks up to its window (the rules refuse a chunk past z — the server never reads one either); a HOLE stays a hole (the
 *  judge refuses it — an honest writer never leaves one: one burst at a time, a refused chunk sent again) */
function keptChunks(c, z) {
  if (!c || typeof c !== 'object' || !isNum(z)) return c;
  const kept = {};
  for (const k of Object.keys(c).map(Number).sort((a, b) => a - b)) { const v = c[k]; if (v && isNum(v.at) && v.at > z) break; kept[k] = v; }
  return kept;
}

/**
 * THE LOG from the record + the leg nodes (nodes[i] = leg i's proof node) → { events, legs: [{ i, t, taps (play ticks), r? }], cut?, why? }
 *   why  = the run is REFUSED (a hole, a bad chunk, a leg's clock running backwards / ahead of the real clock): no tower at all
 *   cut  = a leg fell BEHIND the clock with no silence to explain it: the log ends at its last on-time tap (every later leg dropped)
 * Each leg's GO + its tick are the RECORD's (server-written) — never the node's.
 */
export function logOf(rec, nodes) {
  const legs = legsOf(rec), events = [], out = [];
  for (const L of legs) {
    const node = nodes && nodes[L.i];
    const c = keptChunks(node && node.c, L.z);
    let local = tapsFromChunks(c);
    const times = chunkTimes(c);
    if (!local || !times) return { events: [], legs: [], why: 'chunks' };
    const p = clockProblem(L.go, times);
    if (p && p.why !== 'behind') return { events: [], legs: [], why: p.why === 'ahead' ? 'ahead of the clock' : p.why === 'clock' ? 'the chunks\' clock' : p.why };
    if (p) local = local.slice(0, p.taps);
    if (L.i > 0) events.push({ k: 'hold', t: L.t, ...(L.r ? { r: 1 } : {}) });
    const taps = local.map(k => k + L.t);
    for (const t of taps) events.push(t);
    out.push({ i: L.i, t: L.t, taps, ...(L.r ? { r: 1 } : {}) });
    if (p) return { events, legs: out, cut: { leg: L.i, tick: L.t + p.tick } };
  }
  return { events, legs: out };
}

/** the run AS IT STANDS right after its last event (no step past it — what a hold continues from) */
export function standAfter(seed, events) {
  const run = createRun({ seed, mode: MODE });
  for (const x of events) { if (isOver(run)) break; if (isHold(x) ? !hold(run, x.t, !!x.r) : !tap(run, x)) break; }
  return run;
}
/** HIGH RISE DAILY B — the floors a run stands on after its events (a held run's ticket: "FLOOR 47 · ONE SHOT") */
export const floorsAfter = (seed, events) => resultOf(standAfter(String(seed), events)).floor;
/** THE NEXT HOLD's tick: the slab that was swinging (the next floor's) enters where its own entry was — no run time lost. null = the run is over */
export function nextHoldTick(seed, events) {
  const run = standAfter(seed, events), T = run.st === 'beat' ? run.s0 : run.t;
  return isOver(run) || T >= M.capTicks ? null : T;
}

/** THE RANKING (the owner): floors → most perfects → the earlier tick — ONE number, `better: 'high'` (core/daily-best.js#hrScore's layout) */
export const HR_FLOOR = 1e8, HR_PERF = 1e5;
export const hrScore = (floor, perfects, tick) => Math.max(0, Math.floor(floor)) * HR_FLOOR + Math.max(0, Math.min(999, Math.floor(perfects))) * HR_PERF + (HR_PERF - 1 - Math.max(0, Math.min(HR_PERF - 1, Math.floor(tick))));
export const hrFloors = score => Math.floor(Math.max(0, Number(score) || 0) / HR_FLOOR);
export const hrPerfects = score => Math.floor((Math.max(0, Number(score) || 0) % HR_FLOOR) / HR_PERF);
export const hrTick = score => HR_PERF - 1 - (Math.max(0, Math.floor(Number(score) || 0)) % HR_PERF);

/**
 * THE JUDGE OF A HELD RUN (the server's score — never the phone's word): the log (logOf) replayed by HIGH RISE's own judge (replay.js#judgeRun)
 * on the day's seed, mode 'daily'. A refused log = no tower (`bad`) — 0 floors. → { f, p, k, s, w, h, rh, ms, cut?, bad? }
 */
export function judgeHeld({ seed, record, nodes }) {
  const L = logOf(record, nodes);
  const bad = why => ({ f: 0, p: 0, k: 0, s: hrScore(0, 0, 0), w: '', h: 0, rh: 0, bad: String(why || 'refused').slice(0, 24) });
  if (L.why) return bad(L.why);
  const v = judgeRun({ seed: String(seed), mode: MODE, taps: L.events });
  if (!v.ok) return bad(v.why);
  return { f: v.floor, p: v.perfects, k: v.tick, s: hrScore(v.floor, v.perfects, v.tick), w: v.cause || '', h: v.holds || 0, rh: v.rh || 0, ms: v.maxStreak, ...(L.cut ? { cut: 1 } : {}) };
}

/**
 * THE SHARE CARD's inputs (DAILY B draws the card — SPOILER-FREE: no timing, no seed, no tap): the log replayed once → { f: floors, p: perfects,
 * w: [each floor's slab WIDTH on its slide axis, 0 … 1 of the start], x: [its centre's OFFSET from the tower's start centre, −1 … 1 of the
 * start], pf: [1 = a perfect] } — one entry per floor, floor 1 first.
 */
export function shareOf(seed, events) {
  const ev = [], run = createRun({ seed: String(seed), mode: MODE });
  for (const x of events) { if (isOver(run)) break; if (isHold(x) ? !hold(run, x.t, !!x.r) : !tap(run, x, ev)) break; }
  const r3 = v => Math.round(v * 1000) / 1000;
  const w = [], xo = [], pf = [];
  let perfect = false;
  for (const e of ev) {
    if (e.e === 'drop') perfect = false;
    else if (e.e === 'perfect') perfect = true;
    else if (e.e === 'land') {
      const xAxis = e.floor % 2 === 0, lo = xAxis ? e.x0 : e.z0, hi = xAxis ? e.x1 : e.z1;
      w.push(r3((hi - lo) / R.start)); xo.push(r3((lo + hi) / 2 / R.start)); pf.push(perfect ? 1 : 0);
    }
  }
  const res = resultOf(run);
  return { f: res.floor, p: res.perfects, w, x: xo, pf };
}
/** the run's end as the phone's own engine sees it from a log (the phone's resume + its end card's REPLAY = LIVE) */
export const replayHeld = (seed, events) => replay({ seed: String(seed), mode: MODE, taps: events });
