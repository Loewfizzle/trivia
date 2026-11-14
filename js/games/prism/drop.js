// THE DROP — PRISM DROP's DAILY run (PURE, deterministic; no DOM, no clock — docs/prism.md "THE DROP"; the owner's plan: docs/games/plan.md
// "THE DROP"). ONE module for the phone AND the server: the phone plays through it and records its INPUT LOG; the server REPLAYS that log
// through the very same steps (api/_lib/drop.js) → the real time survived + lines, or a refusal.
//
//   THE RUN = createEngine({ seed: the day's seed, mode: 'survival' }) + dropSchedule, stepped on the engine's own 1/120 s TICK:
//     at state k (k ticks played — engine time k × TICK): the inputs stamped k, in the log's order → ONE tick (gravity, lock delay) → k + 1 →
//     the schedule for time (k + 1) × TICK (the level, the rows due) → a NATURAL lock in that tick is written as a `K` stamped k + 1 (an
//     assertion the replay checks). A slam / a top-out / THE END stops the run; THE END = DROP_END_MS (8:00) — nothing outlasts it.
//   THE SCHEDULE (dropEvery): SURVIVAL's rows (10 s → 4 s over its first 150 s — logic.js#survivalEvery), then from DROP_TAIL_MS (4:00) KEEP
//     SPEEDING UP to one every DROP_FAST_MS by DROP_TAIL_MS + DROP_RAMP_MS (7:00), held to THE END; the level = SURVIVAL's (battleLevel).
//     Each row's gap = SURVIVAL's (the seed's) — everyone that day gets the same rows at the same moments.
//   THE LOG: one event per input that DID something — `<ticks since the last event><code>` (no number = the same tick): L / R a column ·
//     C / W a turn (clockwise / back) · H hold · X slam · D one soft row · S / U the soft drop held / let go · K a natural lock (the assertion).
//     A move of 3 = `LLL`. Compact (≈ 3 chars an input) and size-capped (LOG_MAX — the guaranteed end bounds an honest log well under it).
//   THE HUMAN FLOOR: ≤ FLOOR.perTick inputs in one tick, ≤ FLOOR.perSec in one second's window (120 ticks), a slam ≥ FLOOR.slamTicks after the
//     last — the phone keeps to it (an input past it is dropped, a slam too soon waits for its tick), so an honest log always passes; the
//     server refuses one that doesn't.
import * as E from './engine.js';
import { survivalEvery, battleLevel, survivalGap } from './logic.js';

export const TICK = E.TICK;
export const DROP_TAIL_MS = 240_000;    // the tail starts (4:00) — SURVIVAL's 4 s rows until then
export const DROP_RAMP_MS = 180_000;    // … speeding up over 3 minutes …
export const DROP_FAST_MS = 600;        // … to a row every 0.6 s (7:00 → the end)
export const DROP_END_MS = 480_000;     // THE END: 8:00 — the run is over whatever the board (POINTS_MAX)
export const END_TICK = Math.round(DROP_END_MS / TICK);   // 57 600
export const COUNT_MS = 3000;           // the 3-2-1 between the server's start and tick 0 (the run's origin = startedAt + COUNT_MS)
export const FLOOR = Object.freeze({ perTick: 24, perSec: 160, slamTicks: 12 });   // (a slam ≥ 0.1 s after the last: ≤ 10 pieces a second — past any human)
export const LOG_MAX = 120_000;         // chars (an honest 8-minute log ≈ 15–40 K)
export const CODES = 'LRCWHXDSUK';
const EV = /(\d*)([A-Z])/g;

// ---------------------------------------------------------------- THE SCHEDULE
/** ms between rows at time t (ms of play) */
export function dropEvery(t) {
  if (t < DROP_TAIL_MS) return survivalEvery(t);
  const k = Math.max(0, Math.min(1, (t - DROP_TAIL_MS) / DROP_RAMP_MS));
  const s = k * k * (3 - 2 * k);
  return survivalEvery(DROP_TAIL_MS) - (survivalEvery(DROP_TAIL_MS) - DROP_FAST_MS) * s;
}
const ROWS = [survivalEvery(0)];
/** when THE DROP's k-th row (0-based) rises, in ms of play (whole ms — the same on every machine) */
export function dropRowAt(k) {
  while (ROWS.length <= k) { const t = ROWS[ROWS.length - 1]; ROWS.push(Math.round(t + dropEvery(t))); }
  return ROWS[k];
}
/** rows that have risen by time t */
export function dropRows(t) {
  let k = 0;
  while (dropRowAt(k) <= t) k++;
  return k;
}
/** the rows a whole run can ever see (the schedule up to THE END) */
export const MAX_ROWS = dropRows(DROP_END_MS);
export const tickTime = k => k * TICK;
/** the ticks a stored engine time (ms) stands for */
export const ticksOf = ms => Math.round(ms / TICK);

// ---------------------------------------------------------------- THE RUN
/** a fresh run on the day's seed */
export function createDropRun(seed) {
  const eng = E.createEngine({ seed: String(seed), mode: 'survival', level: 1 });
  const run = { seed: String(seed), eng, k: 0, soft: false, lastEv: 0, lastX: -1e9, wk: 0, wn: 0, tk: -1, tn: 0, ev: 0, over: false, why: '', log: '', qx: false };
  E.start(eng);
  schedule(run);
  return run;
}

function schedule(run) {
  const g = run.eng, t = tickTime(run.k);
  E.setLevel(g, battleLevel(t));
  const due = dropRows(t);
  while (g.sd < due && !g.over) { E.insertJunk(g, 1, survivalGap(run.seed, g.sd)); g.sd++; }
  settle(run);
}
function settle(run) {
  const g = run.eng;
  if (!run.over && g.over) { run.over = true; run.why = 'top'; }
  if (!run.over && run.k >= END_TICK) { run.over = true; run.why = 'end'; g.over = true; g.cur = null; }
}

/** ONE tick: gravity / lock delay → k + 1 → the schedule. → true when a piece locked by itself in that tick (a `K`) */
function stepOne(run) {
  const g = run.eng, before = g.stats.pieces;
  E.update(g, TICK, run.soft);
  run.k++;
  const locked = g.stats.pieces > before;
  schedule(run);
  return locked;
}

/** the floor's counters for an input at the run's tick: false = past the floor */
function floorOk(run, code) {
  if (run.tk !== run.k) { run.tk = run.k; run.tn = 0; }
  const w = Math.floor(run.k / 120);
  if (run.wk !== w) { run.wk = w; run.wn = 0; }
  if (run.tn >= FLOOR.perTick || run.wn >= FLOOR.perSec) return false;
  if (code === 'X' && run.k - run.lastX < FLOOR.slamTicks) return false;
  return true;
}
function count(run, code) { run.tn++; run.wn++; run.ev++; if (code === 'X') run.lastX = run.k; }

/** apply one input to the engine → true if it did something (the log keeps only those) */
function apply(run, code) {
  const g = run.eng;
  if (run.over || g.over || !g.cur) return false;
  switch (code) {
    case 'L': return E.move(g, -1);
    case 'R': return E.move(g, 1);
    case 'C': return E.rotate(g, 1);
    case 'W': return E.rotate(g, -1);
    case 'H': { const did = !g.held; if (!did) return false; E.holdPiece(g); return true; }
    case 'X': return E.hardDrop(g);
    case 'D': return E.stepDown(g, true);
    case 'S': if (run.soft) return false; run.soft = true; return true;
    case 'U': if (!run.soft) return false; run.soft = false; return true;
    default: return false;
  }
}

// ---------------------------------------------------------------- THE PHONE: play + record
function write(run, code) {
  const d = run.k - run.lastEv;
  run.log += (d > 0 ? String(d) : '') + code;
  run.lastEv = run.k;
}
/**
 * The phone's input at the run's current tick → 'ok' (applied + logged) | 'noop' (it did nothing / past the floor / the run is over) | 'wait'
 * (a slam too soon after the last: it lands on the first tick the floor allows — stepTo applies it)
 */
export function input(run, code) {
  if (run.over || !CODES.includes(code) || code === 'K') return 'noop';
  if (code === 'X' && run.k - run.lastX < FLOOR.slamTicks) { run.qx = true; return 'wait'; }
  if (!floorOk(run, code)) return 'noop';
  if (!apply(run, code)) return 'noop';
  count(run, code);
  write(run, code);
  settle(run);
  return 'ok';
}
/** step the phone's run to tick `k` (never past THE END / the top-out): every natural lock logged as its `K`; a waiting slam lands on its tick.
 *  → the ticks stepped */
export function stepTo(run, k) {
  let n = 0;
  const to = Math.min(END_TICK, Math.floor(k));
  while (!run.over && run.k < to) {
    if (stepOne(run)) write(run, 'K');
    n++;
    if (run.qx && run.k - run.lastX >= FLOOR.slamTicks) { run.qx = false; input(run, 'X'); }
  }
  return n;
}

// ---------------------------------------------------------------- THE SNAPSHOT (exact — the server's incremental checkpoint)
const ENG_KEYS = ['n', 'cur', 'hold', 'held', 'level', 'lines', 'score', 'combo', 'maxCombo', 'b2b', 'b2bCount', 'best', 'sent', 'frac', 'badges', 'clock', 'acc', 'fall', 'lockT', 'resets', 'lowest', 'lastRot', 'touched', 'over', 'sd', 'peak', 'stats'];
/** the run's whole state as ONE string (JSON — numbers round-trip exactly; stored as a string so the database never rounds one) */
export function snapshot(run) {
  const g = run.eng, e = {};
  for (const k of ENG_KEYS) e[k] = g[k];
  e.cells = Array.from(g.cells).join('');
  return JSON.stringify({ v: 1, seed: run.seed, k: run.k, soft: run.soft, lastEv: run.lastEv, lastX: run.lastX, wk: run.wk, wn: run.wn, tk: run.tk, tn: run.tn, ev: run.ev, over: run.over, why: run.why, len: run.log.length || run.len || 0, e });
}
/** a run back from its snapshot (the log itself is not in it — the caller holds the log; `len` = how much of it the snapshot covers) */
export function fromSnapshot(str) {
  const s = JSON.parse(str);
  if (!s || s.v !== 1) throw new Error('bad snapshot');
  const run = createDropRun(s.seed);
  const g = run.eng;
  for (const k of ENG_KEYS) g[k] = s.e[k];
  g.stats = { ...s.e.stats };
  g.cur = s.e.cur ? { ...s.e.cur } : null;
  g.lastRot = s.e.lastRot ? { ...s.e.lastRot } : null;
  g.best = s.e.best ? { ...s.e.best } : null;
  g.pending = [];
  for (let i = 0; i < g.cells.length; i++) g.cells[i] = s.e.cells.charCodeAt(i) - 48;
  E.takeEvents(g);
  Object.assign(run, { k: s.k, soft: s.soft, lastEv: s.lastEv, lastX: s.lastX, wk: s.wk, wn: s.wn, tk: s.tk, tn: s.tn, ev: s.ev, over: s.over, why: s.why, log: '', qx: false });
  run.len = s.len;
  return run;
}

// ---------------------------------------------------------------- THE REPLAY (the server — and the phone's resume)
/**
 * Replay a log through the run. log: the WHOLE log (or, with `from`, the log whose first `from.len` chars the snapshot already covers);
 * seed: the day's seed; to: the tick the upload reaches (the checkpoint's k); final: the run must be OVER at `to` (a top-out or THE END).
 * → { ok: true, run, t (engine ms), lines, pieces, k, over, why } | { ok: false, refused: reason, at: tick }
 *   reasons: bad_log (a char no log has) · too_big · out_of_order (an event inside an already-checked span / a tick before the run's) ·
 *   illegal (an input that does nothing there) · lock_mismatch (a K with no lock / a lock with no K) · too_fast (past the human floor) ·
 *   past_end (anything after the top-out / THE END, or `to` past it) · not_over (final, the run still going) · bad_to
 */
export function replay(log, seed, { from = null, to = null, final = false } = {}) {
  if (typeof log !== 'string') return { ok: false, refused: 'bad_log', at: 0 };
  if (log.length > LOG_MAX) return { ok: false, refused: 'too_big', at: 0 };
  let run;
  try { run = from ? (typeof from === 'string' ? fromSnapshot(from) : from) : createDropRun(seed); } catch { return { ok: false, refused: 'bad_snapshot', at: 0 }; }
  const start = from ? (run.len || 0) : 0;
  if (start > log.length) return { ok: false, refused: 'out_of_order', at: run.k };
  const part = log.slice(start);
  const no = (refused) => ({ ok: false, refused, at: run.k });
  let pendingK = null;                         // the tick a natural lock waits for its K at
  const stepUntil = target => {
    while (run.k < target) {
      if (pendingK != null) return 'lock_mismatch';
      if (run.over) return 'past_end';
      if (stepOne(run)) pendingK = run.k;
      E.takeEvents(run.eng);
    }
    return null;
  };
  EV.lastIndex = 0;
  let m, seen = 0, tick = run.lastEv;
  while ((m = EV.exec(part))) {
    if (m.index !== seen) return no('bad_log');
    seen = EV.lastIndex;
    const code = m[2];
    if (!CODES.includes(code)) return no('bad_log');
    if (m[1].length > 6 || (m[1].length > 1 && m[1][0] === '0')) return no('bad_log');
    tick += m[1] ? Number(m[1]) : 0;
    if (tick < run.k && !(code === 'K' && pendingK === tick)) return no('out_of_order');
    if (tick > END_TICK) return no('past_end');
    const bad = stepUntil(tick);
    if (bad) return no(bad);
    if (code === 'K') {
      if (pendingK !== tick) return no('lock_mismatch');
      pendingK = null; run.lastEv = tick;
      continue;
    }
    if (pendingK != null) return no('lock_mismatch');
    if (run.over) return no('past_end');
    if (!floorOk(run, code)) return no('too_fast');
    if (!apply(run, code)) return no('illegal');
    count(run, code);
    run.lastEv = tick;
    settle(run);
    E.takeEvents(run.eng);
  }
  if (seen !== part.length) return no('bad_log');
  if (to != null) {
    if (!Number.isInteger(to) || to < run.k) return no('bad_to');
    if (to > END_TICK) return no('past_end');
    const bad = stepUntil(to);
    if (bad) return no(bad);
  }
  if (pendingK != null) return no('lock_mismatch');
  if (final && !run.over) return no('not_over');
  run.len = log.length;
  return { ok: true, run, t: tickTime(run.k), lines: run.eng.lines, pieces: run.eng.stats.pieces, k: run.k, over: run.over, why: run.why };
}

// ---------------------------------------------------------------- THE SCORE (ONE stored number — `better: 'high'`)
/** time survived in TENTHS × 1000 + lines (lines break a tie; < 1000 in any run) */
export const scoreOf = (t, lines) => Math.round(Math.max(0, Math.min(DROP_END_MS, t)) / 100) * 1000 + Math.max(0, Math.min(999, lines | 0));
export const tenthsOf = score => Math.floor(Math.max(0, Number(score) || 0) / 1000);
export const linesOf = score => Math.max(0, Math.round(Number(score) || 0) % 1000);
/** the score's spoiler-free line: "4:12.3 · 37 LINES" (THE END: "8:00 · THE END") */
export function dropLine(score) {
  const d = tenthsOf(score), s = Math.floor(d / 10), ln = linesOf(score);
  const time = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}${d >= DROP_END_MS / 100 ? '' : `.${d % 10}`}`;
  return d >= DROP_END_MS / 100 ? `${time} · THE END` : `${time} · ${ln} ${ln === 1 ? 'LINE' : 'LINES'}`;
}
