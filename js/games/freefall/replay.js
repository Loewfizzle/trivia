// FREEFALL — THE REPLAY + THE JUDGE (F1 — docs/freefall.md "THE JUDGE"): PURE — the SAME code the phone runs (engine.js). The phone shows
// the replay after every run (REPLAY = LIVE: the owner's determinism check on a real iPhone); the server's judge (api/_lib/freefall.js)
// = judgeRun. + THE INPUT LOG's packed form.
import { TURN, MAX_LOG, HOLDS_MAX, SEED_MAX, ENTRY_CHARS_MAX, RULE_SETS, RULES_DEFAULT, ruleSet } from './tuning.js';
import { createRun, stepTo, turn, hold, isOver, resultOf, modeRow, angDiff } from './engine.js';

const CLASSIC = RULE_SETS[RULES_DEFAULT];
/** the rule set a log names: none named = "classic"; an unknown one = null (THE JUDGE refuses it) */
export const rulesOf = rules => (rules == null ? CLASSIC : ruleSet(rules));

/** a seed = 1 … 64 printable ASCII characters, no space (seedOf makes [0-9a-z]) — nothing a transport could normalise into another seed */
export const seedProblem = seed => (typeof seed !== 'string' || seed.length > SEED_MAX || !/^[!-~]+$/.test(seed) ? 'seed' : null);

/** F2 — a HOLD in a log (engine.js#hold): { k: 'hold', t: the PLAY tick the run was held at }. A log = moves { t, a } + holds, in order (a move at a hold's own tick comes before it) */
export const isHold = x => x !== null && typeof x === 'object' && x.k === 'hold';
/** the most entries a `mode` run's log can hold: ONE move a tick, every tick before its cap — + the mode's holds */
export const maxEntries = (mode, R = CLASSIC) => { const M = modeRow(mode, R); return (M && M.capTicks != null ? Math.min(M.capTicks, MAX_LOG) : MAX_LOG) + ((M && M.holds) || 0); };

const tickOk = t => typeof t === 'number' && Number.isSafeInteger(t) && t >= 0 && !Object.is(t, -0);   // (a −0 is not a tick: one log, one JSON text)

/**
 * THE INPUT LOG's BOUNDS (PURE, no replay — cheap: the judge refuses these before it plays a tick): null = fine, else why.
 *   not a list · longer than the mode has ticks · an entry that is not { t: a whole tick ≥ 0, a: a whole angle 0 … 4095 } · ticks not
 *   rising · a tick at / past the mode's CAP · an entry that changes nothing (the log holds the CHANGES only) · MAX SPIN: a turn of more
 *   than maxSpin units in one tick ('spin') · F2: a HOLD that is not { k: 'hold', t: a whole tick ≥ 0 } ('entry'), before the event before it /
 *   a move at or before a hold ('ticks not rising'), more holds than the mode has ('too many holds').
 * Every one of them is ALSO what the engine's own turn() never logs — the replay below is the truth; these give the refusal its name.
 */
export function logProblem(log, mode, R = CLASSIC) {
  const M = modeRow(mode, R);
  if (!M) return 'mode';
  if (!Array.isArray(log)) return 'log';
  if (log.length > maxEntries(mode, R)) return 'too many entries';
  let pt = -1, pa = 0, ph = -1, held = 0;   // the last move's tick · its angle · the last hold's tick · the holds so far
  for (let i = 0; i < log.length; i++) {
    const e = log[i];
    if (e === null || typeof e !== 'object') return 'entry';
    const t = e.t, a = e.a;
    if (isHold(e)) {
      // (THE REVIEW, F3: exactly its two OWN keys — { k: 'hold', t, a: 'x' } or a `k` inherited from a prototype was judged as a hold: two JSON texts for one log)
      if (!tickOk(t) || !Object.prototype.hasOwnProperty.call(e, 'k') || Object.keys(e).length !== 2) return 'entry';
      if (t < pt || t <= ph) return 'ticks not rising';
      if (M.capTicks != null && t >= M.capTicks) return 'past the cap';
      if (++held > (M.holds || 0)) return 'too many holds';
      ph = t;
      continue;
    }
    if (!tickOk(t) || !tickOk(a) || a >= TURN) return 'entry';
    if (t <= pt || t <= ph) return 'ticks not rising';
    if (M.capTicks != null && t >= M.capTicks) return 'past the cap';
    const d = angDiff(a, pa);
    if (d === 0) return 'no change';
    if (d > R.maxSpin || d < -R.maxSpin) return 'spin';
    pt = t; pa = a;
  }
  return null;
}

/**
 * (NOT the hostile-safe door — it takes a log THE BOUNDS already passed: logProblem, or the engine's own; judgeRun is the door.)
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
    // (a HOLD — F3: EXACT RESUME — everything up to + at its tick happens, then nothing moves: engine.js#hold; refused = not a log the engine wrote)
    if (isHold(e)) {
      if (hold(run, e.t, ev)) { used++; continue; }
      bad = i; why = isOver(run) ? 'past the end' : 'hold';
      break;
    }
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
 * blazes, bestRun, moves, feats } | { ok: false, why }. The floor is the judge's own — a phone's claimed depth is never read.
 * `mode` is REQUIRED (a missing one is never quietly judged as solo). NOTHING THROWS: every hostile input gets its { ok: false, why }.
 * REFUSED: an unknown rule set ('rules') · an unknown mode · a malformed seed · a log that breaks its bounds (logProblem) · a move after
 * the run was over ('past the end').
 */
export function judgeRun(input) {
  const { seed, mode, log, rules, until } = input !== null && typeof input === 'object' ? input : {};
  const R = rulesOf(rules);
  if (!R) return { ok: false, why: 'rules' };
  if (!modeRow(mode, R)) return { ok: false, why: 'mode' };
  if (seedProblem(seed)) return { ok: false, why: 'seed' };
  // (`until` — A RUN SCORED AS IT STANDS at a tick, a match still going: a whole tick ≥ 0 or nothing; the answer then says `over`)
  const live = until !== undefined && until !== null;
  if (live && !tickOk(until)) return { ok: false, why: 'until' };
  const bad = logProblem(log, mode, R);
  if (bad) return { ok: false, why: bad };
  const r = replay({ seed, mode, log, rules: R.id, until: live ? until : null });
  if (r.bad >= 0) return { ok: false, why: r.why };
  if (!live && !r.over) return { ok: false, why: 'never ended' };   // (can not happen: the darkness or the cap ends every run — kept as the judge's own floor)
  return { ok: true, rules: R.id, floor: r.floor, tick: r.tick, end: r.end, cause: r.cause, made: r.made, bounces: r.bounces, shatters: r.shatters, blazes: r.blazes, bestRun: r.bestRun, moves: r.moves, feats: r.feats, ...(r.holds ? { holds: r.holds } : {}), ...(live ? { over: r.over } : {}) };
}

// ---- THE PACKED LOG (F4's run node): event after event, no separator between them —
//   A MOVE:  [ '.' + the ticks since the event before (base 36) ]  — left out when it is 1 (a drag logs tick after tick); the first event counts from tick −1
//            '+' | '-'                                             — the way the tower turned
//            the units it turned (base 36, 1 … 2048)               — the SHORTEST way from the angle before
//   A HOLD (F2):  '!' + the ticks since the event before (base 36; "0" = at the tick of the move before it)
// ".c+2r+1k-3.a-z" = tick 11: +99 · tick 12: +56 · tick 13: −3 · tick 23: −35. "…-z!4+5" = … a hold at tick 27, then tick 28: +5.
// CANONICAL: packLog(unpackLog(s)) === s, nothing else unpacks.
const one = (pt, pa, t, a) => { const gap = t - pt, d = angDiff(a, pa); return (gap === 1 ? '' : `.${gap.toString(36)}`) + (d < 0 ? `-${(-d).toString(36)}` : `+${d.toString(36)}`); };
export function packLog(log) {
  let s = '', pt = -1, pa = 0;
  for (let i = 0; i < log.length; i++) {
    const e = log[i];
    if (isHold(e)) { s += `!${(e.t - pt).toString(36)}`; pt = e.t; continue; }
    s += one(pt, pa, e.t, e.a);
    pt = e.t; pa = e.a;
  }
  return s;
}
/** the run's own log, packed */
export function packRun(run) {
  let s = '', pt = -1, pa = 0, k = 0;
  for (let i = 0; i <= run.lt.length; i++) {
    const t = i < run.lt.length ? run.lt[i] : Infinity;
    while (k < run.ht.length && run.ht[k] < t) { s += `!${(run.ht[k] - pt).toString(36)}`; pt = run.ht[k++]; }
    if (i === run.lt.length) break;
    s += one(pt, pa, t, run.la[i]);
    pt = t; pa = run.la[i];
  }
  return s;
}
/** → the log [{ t, a } | { k: 'hold', t }], or null (a bad string — or one longer than `maxLen` characters: refused before it is read); '' = an empty log */
export function unpackLog(str, maxLen = ENTRY_CHARS_MAX * (MAX_LOG + HOLDS_MAX)) {
  if (typeof str !== 'string' || str.length > maxLen) return null;
  const out = [], n = str.length;
  let i = 0, t = -1, a = 0, moved = false;   // (`moved` = the event before was a MOVE: only then may a hold stand at its very tick — "!0")
  // (a hand-written reader — one pass, no regex over an unbounded string, no recursion)
  const num = max => {   // base-36 digits from i: no leading zero, at most `max` digits → the value, or −1
    let v = 0, k = 0;
    while (i < n && k <= max) { const c = D36.indexOf(str[i]); if (c < 0) break; if (k === 0 && c === 0) return -1; v = v * 36 + c; i++; k++; }
    return k === 0 || k > max ? -1 : v;
  };
  while (i < n) {
    if (str[i] === '!') {
      i++;
      let gap;
      if (str[i] === '0') { if (!moved) return null; gap = 0; i++; } else { gap = num(4); if (gap < 1) return null; }
      t += gap; moved = false;
      out.push({ k: 'hold', t });
      continue;
    }
    let gap = 1;
    if (str[i] === '.') { i++; gap = num(4); if (gap < 2) return null; }   // (≤ 4 digits: the longest log's last tick is "2bbz")
    const sign = str[i] === '+' ? 1 : str[i] === '-' ? -1 : 0;
    if (!sign) return null;
    i++;
    const m = num(3);
    if (m < 1 || m > TURN / 2 || (sign > 0 && m === TURN / 2)) return null;   // (half a turn is written '-': one way only)
    t += gap; a = ((a + sign * m) % TURN + TURN) % TURN; moved = true;
    out.push({ t, a });
  }
  return out;
}
const D36 = '0123456789abcdefghijklmnopqrstuvwxyz';
