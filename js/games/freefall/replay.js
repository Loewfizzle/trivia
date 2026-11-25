// FREEFALL — THE REPLAY + THE JUDGE (F1 — docs/freefall.md "THE JUDGE"): PURE — the SAME code the phone runs (engine.js). The phone shows
// the replay after every run (REPLAY = LIVE: the owner's determinism check on a real iPhone); the server's judge (api/_lib/freefall.js)
// = judgeRun. + THE INPUT LOG's packed form.
import { TURN, MAX_LOG, SEED_MAX, ENTRY_CHARS_MAX, RULE_SETS, RULES_DEFAULT, ruleSet } from './tuning.js';
import { createRun, stepTo, turn, isOver, resultOf, modeRow, angDiff } from './engine.js';

const CLASSIC = RULE_SETS[RULES_DEFAULT];
/** the rule set a log names: none named = "classic"; an unknown one = null (THE JUDGE refuses it) */
export const rulesOf = rules => (rules == null ? CLASSIC : ruleSet(rules));

/** a seed = 1 … 64 printable ASCII characters, no space (seedOf makes [0-9a-z]) — nothing a transport could normalise into another seed */
export const seedProblem = seed => (typeof seed !== 'string' || seed.length > SEED_MAX || !/^[!-~]+$/.test(seed) ? 'seed' : null);

/** the most entries a `mode` run's log can hold: ONE a tick, every tick before its cap */
export const maxEntries = (mode, R = CLASSIC) => { const M = modeRow(mode, R); return M && M.capTicks != null ? Math.min(M.capTicks, MAX_LOG) : MAX_LOG; };

const tickOk = t => typeof t === 'number' && Number.isSafeInteger(t) && t >= 0;

/**
 * THE INPUT LOG's BOUNDS (PURE, no replay — cheap: the judge refuses these before it plays a tick): null = fine, else why.
 *   not a list · longer than the mode has ticks · an entry that is not { t: a whole tick ≥ 0, a: a whole angle 0 … 4095 } · ticks not
 *   rising · a tick at / past the mode's CAP · an entry that changes nothing (the log holds the CHANGES only) · MAX SPIN: a turn of more
 *   than maxSpin units in one tick ('spin').
 * Every one of them is ALSO what the engine's own turn() never logs — the replay below is the truth; these give the refusal its name.
 */
export function logProblem(log, mode, R = CLASSIC) {
  const M = modeRow(mode, R);
  if (!M) return 'mode';
  if (!Array.isArray(log)) return 'log';
  if (log.length > maxEntries(mode, R)) return 'too many entries';
  let pt = -1, pa = 0;
  for (let i = 0; i < log.length; i++) {
    const e = log[i];
    if (e === null || typeof e !== 'object') return 'entry';
    const t = e.t, a = e.a;
    if (!tickOk(t) || !tickOk(a) || a >= TURN) return 'entry';
    if (t <= pt) return 'ticks not rising';
    if (M.capTicks != null && t >= M.capTicks) return 'past the cap';
    const d = angDiff(a, pa);
    if (d === 0) return 'no change';
    if (d > R.maxSpin || d < -R.maxSpin) return 'spin';
    pt = t; pa = a;
  }
  return null;
}

/**
 * replay({ seed, mode, log, until }) → the run's result + `used` (the entries played) + `bad` (the index of the first entry the engine
 * did not take exactly as written, −1 = none) + `why` for it. Without `until` the run is played to its END — after the last move THE
 * DARKNESS (or the finish, or THE CAP) always ends it. `until` (a tick) = the run as it stands then (a run still going — a match scored live).
 */
export function replay({ seed, mode = 'solo', log = [], until = null, rules = RULES_DEFAULT, ev = null } = {}) {
  if (until != null && !(Number.isSafeInteger(until) && until >= 0)) until = 0;   // (a bad `until` counts nothing — never the whole run)
  const run = createRun({ seed, mode, rules });
  let used = 0, bad = -1, why = '';
  for (let i = 0; i < log.length; i++) {
    const e = log[i];
    if (until != null && e.t > until) break;
    const d = angDiff(e.a, run.a);
    // (the engine's own turn(): it must count AT the entry's tick and land ON the entry's angle — anything else is not a log the engine wrote)
    if (!isOver(run) && d !== 0 && turn(run, e.t, d, ev) === d && run.mt === e.t && run.a === e.a) { used++; continue; }
    bad = i;
    why = isOver(run) ? 'past the end' : d === 0 ? 'no change' : 'spin';
    break;
  }
  if (bad < 0) stepTo(run, until != null ? until : run.R.modes[run.mode].capTicks != null ? run.R.modes[run.mode].capTicks : run.t + MAX_LOG, ev);
  return { ...resultOf(run), used, bad, why };
}

/**
 * THE JUDGE (PURE): ONE run from its seed + mode + input log → { ok: true, rules, floor, tick, end, cause, made, bounces, shatters,
 * blazes, maxClean, moves, feats } | { ok: false, why }. The floor is the judge's own — a phone's claimed depth is never read.
 * `mode` is REQUIRED (a missing one is never quietly judged as solo). NOTHING THROWS: every hostile input gets its { ok: false, why }.
 * REFUSED: an unknown rule set ('rules') · an unknown mode · a malformed seed · a log that breaks its bounds (logProblem) · a move after
 * the run was over ('past the end').
 */
export function judgeRun(input) {
  const { seed, mode, log, rules } = input !== null && typeof input === 'object' ? input : {};
  const R = rulesOf(rules);
  if (!R) return { ok: false, why: 'rules' };
  if (!modeRow(mode, R)) return { ok: false, why: 'mode' };
  if (seedProblem(seed)) return { ok: false, why: 'seed' };
  const bad = logProblem(log, mode, R);
  if (bad) return { ok: false, why: bad };
  const r = replay({ seed, mode, log, rules: R.id });
  if (r.bad >= 0) return { ok: false, why: r.why };
  if (!r.over) return { ok: false, why: 'never ended' };   // (can not happen: the darkness or the cap ends every run — kept as the judge's own floor)
  return { ok: true, rules: R.id, floor: r.floor, tick: r.tick, end: r.end, cause: r.cause, made: r.made, bounces: r.bounces, shatters: r.shatters, blazes: r.blazes, maxClean: r.maxClean, moves: r.moves, feats: r.feats };
}

// ---- THE PACKED LOG (F4's run node): entry after entry, no separator between them —
//   [ '.' + the ticks since the entry before (base 36) ]  — left out when it is 1 (a drag logs tick after tick); the first entry counts from tick −1
//   '+' | '-'                                             — the way the tower turned
//   the units it turned (base 36, 1 … 2048)               — the SHORTEST way from the angle before
// ".c+2r+1k-3.a-z" = tick 11: +99 · tick 12: +56 · tick 13: −3 · tick 23: −35. CANONICAL: packLog(unpackLog(s)) === s, nothing else unpacks.
const D36 = '0123456789abcdefghijklmnopqrstuvwxyz';
export function packLog(log) {
  let s = '', pt = -1, pa = 0;
  for (let i = 0; i < log.length; i++) {
    const e = log[i], gap = e.t - pt, d = angDiff(e.a, pa);
    s += (gap === 1 ? '' : `.${gap.toString(36)}`) + (d < 0 ? `-${(-d).toString(36)}` : `+${d.toString(36)}`);
    pt = e.t; pa = e.a;
  }
  return s;
}
/** the run's own log, packed */
export function packRun(run) {
  let s = '', pt = -1, pa = 0;
  for (let i = 0; i < run.lt.length; i++) {
    const t = run.lt[i], a = run.la[i], gap = t - pt, d = angDiff(a, pa);
    s += (gap === 1 ? '' : `.${gap.toString(36)}`) + (d < 0 ? `-${(-d).toString(36)}` : `+${d.toString(36)}`);
    pt = t; pa = a;
  }
  return s;
}
/** → the log [{ t, a }], or null (a bad string — or one longer than `maxLen` characters: refused before it is read); '' = an empty log */
export function unpackLog(str, maxLen = ENTRY_CHARS_MAX * MAX_LOG) {
  if (typeof str !== 'string' || str.length > maxLen) return null;
  const out = [], n = str.length;
  let i = 0, t = -1, a = 0;
  // (a hand-written reader — one pass, no regex over an unbounded string, no recursion)
  const num = max => {   // base-36 digits from i: no leading zero, at most `max` digits → the value, or −1
    let v = 0, k = 0;
    while (i < n && k <= max) { const c = D36.indexOf(str[i]); if (c < 0) break; if (k === 0 && c === 0) return -1; v = v * 36 + c; i++; k++; }
    return k === 0 || k > max ? -1 : v;
  };
  while (i < n) {
    let gap = 1;
    if (str[i] === '.') { i++; gap = num(5); if (gap < 2) return null; }
    const sign = str[i] === '+' ? 1 : str[i] === '-' ? -1 : 0;
    if (!sign) return null;
    i++;
    const m = num(3);
    if (m < 1 || m > TURN / 2 || (sign > 0 && m === TURN / 2)) return null;   // (half a turn is written '-': one way only)
    t += gap; a = ((a + sign * m) % TURN + TURN) % TURN;
    out.push({ t, a });
  }
  return out;
}
