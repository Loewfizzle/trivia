// FREEFALL — THE ENGINE (F1 — docs/freefall.md "THE ENGINE"): THE ONE RULE — the same seed + the same INPUT LOG = the exact same run on (→ §1, docs/freefall.md MODULE NOTES)
import { TURN, GAP, RED, MODE_IDS, MAX_LOG, HARBOR_FLOOR, BOTTOM_FLOOR, TERMINAL_RUN, RULE_SETS, RULES_DEFAULT, ruleSet, isRuleRow, AREAS, darkPaceAt } from './tuning.js';
import { seedHash, floorInto, sliceUnder, kindAtTick, wrap, angDiff } from './tower-gen.js';
import { areaIndex } from './logic.js';

const CLASSIC = RULE_SETS[RULES_DEFAULT];
export { seedHash, angDiff };

/** a mode's row on rule set `R` — only the modes' own names (never 'constructor' / '__proto__') */
export const modeRow = (mode, R = CLASSIC) => (typeof mode === 'string' && MODE_IDS.includes(mode) ? R.modes[mode] : null);

/**
 * a new run on rule set `rules` ("classic" when none is named): tick 0 = GO — the tower at angle 0, the ball dropping in onto floor 0
 * (its first landing at tick `first`; the slice under it there is SAFE), THE DARKNESS `lead` floors above. The run RECORDS its rule set
 * (`rules`), carries its row (`R`) and keeps its own INPUT LOG (`lt` the ticks · `la` the angles — logOf(run)).
 */
export function createRun({ seed, mode = 'solo', rules = RULES_DEFAULT } = {}) {
  const R = isRuleRow(rules) ? rules : ruleSet(rules);   // (an id of THE TABLE — or a sim's own what-if row, tuning.js#makeRuleSet)
  if (!R) throw new Error(`freefall: unknown rule set ${rules}`);
  if (!modeRow(mode, R)) throw new Error(`freefall: unknown mode ${mode}`);
  const s = String(seed);
  return {
    seed: s, mode, rules: R.id, R, h: seedHash(s),
    t: 0,                                   // the tick the run was stepped to
    st: 'live',                             // 'live' | 'out' | 'made' | 'cap'
    a: 0,                                   // THE TOWER's ANGLE (0 … TURN − 1) — as of the last logged tick, held since
    pa: 0, mt: -1,                          // the angle before the log's last entry · the latest tick a move counted at
    lt: [], la: [],                         // THE INPUT LOG: the ticks A changed at (rising) · A from that tick on
    floor: 0, at: 0,                        // THE FLOORS PASSED (= the floor the ball is on / falling to) · the tick that floor was reached (THE RANKING)
    fl: 'drop',                             // the ball's flight: 'drop' (the start) | 'bounce' | 'fall'
    pl: 0, nl: R.first,                     // … the tick it began · THE NEXT LANDING's tick
    ll: -1,                                 // the last landing DECIDED (a move can not count at or before it)
    clean: 0, blaze: false,                 // floors fallen in a row without a bounce since the last bounce / shatter · THE BLAZE is lit
    nb: 0, maxNb: 0,                        // THE NO-BOUNCE RUN (gaps + shatters, reset only by a bounce) · its best (TERMINAL VELOCITY)
    bounces: 0, shatters: 0, blazes: 0,
    sf: -1,                                 // the floor the LAST SHATTER dropped the ball to (−1 = none yet)
    sh: false, saves: 0,                    // (F2) the NEXT landing is the one right after a shatter (never an out) · how often that rule saved the run
    holds: 0, ht: [],                       // (F2 — THE HOLD) the holds used · their ticks
    dk: -R.dark.lead, dn: R.dark.grace + R.dark.pace,   // THE DARKNESS: the floor it has reached · the tick of its next floor down
    area: 0,                                // the area the ball's floor is in (tuning.js#AREAS)
    cause: '', end: -1,                     // out: 'red' | 'dark' · the tick the run ended
    cur: { i: -1, twist: 0, gap: 0, red: 0, m1: 0, m2: 0 },   // the floor record the landings read (ONE, rewritten — never a new object in play)
  };
}
export const isOver = run => run.st !== 'live';

function finish(run, st, cause, T, ev) {
  run.st = st; run.cause = cause; run.end = T; run.t = T;
  if (ev) ev.push(st === 'out' ? { e: 'out', cause, t: T } : { e: st, t: T });
}

/** the floor the ball is on / falling to, as the landings read it (the run's ONE record) */
export function floorNow(run) {
  if (run.cur.i !== run.floor) floorInto(run.h, run.floor, run.R, run.cur);
  return run.cur;
}

/**
 * A LANDING at tick L: the slice under the ball AT THAT TICK decides.
 *   GAP → the ball falls to the next floor (the floor counts; the clean count + the no-bounce run grow; the 3rd clean floor lights THE BLAZE)
 *   THE BLAZE lit + a solid slice (SAFE or RED alike) → it SHATTERS: the floor counts, the ball keeps falling, the blaze is spent, clean = 0
 *   SAFE → a bounce (clean = 0, the no-bounce run = 0), the next landing on the SAME floor · RED → OUT ('red')
 *   F2 (the owner's rule b — `shatterSafe`): THE LANDING RIGHT AFTER A SHATTER is never an out — red there = a BOUNCE (`bounce.red`: the
 *   view's red flash + the cracked slice); the clean count resets as for any bounce.
 *   F2 — MOVING RED (THE TRENCH): the slice's kind is read AT THE LANDING's TICK (tower-gen.js#kindAtTick).
 */
function landing(run, L, ev) {
  const R = run.R, f = run.floor, fl = floorNow(run), s = sliceUnder(run.a, fl.twist), kind = kindAtTick(fl, s, L, R);
  const after = run.sh;   // (this landing is the one right after a shatter)
  run.ll = L; run.sh = false;
  if (ev) ev.push({ e: 'land', floor: f, slice: s, kind, t: L });
  if (kind !== GAP && !run.blaze) {
    const saved = kind === RED && after && R.shatterSafe === true;
    if (kind === RED && !saved) return finish(run, 'out', 'red', L, ev);
    run.clean = 0; run.nb = 0; run.bounces++;
    run.fl = 'bounce'; run.pl = L; run.nl = L + R.bounce;
    if (saved) { run.saves++; if (ev) ev.push({ e: 'bounce', floor: f, slice: s, red: true, t: L }); }
    else if (ev) ev.push({ e: 'bounce', floor: f, slice: s, t: L });
    return;
  }
  // the floor is PASSED
  let lit = false;
  if (kind !== GAP) {
    run.blaze = false; run.clean = 0; run.shatters++; run.sf = f + 1; run.sh = true;
    if (ev) ev.push({ e: 'shatter', floor: f, slice: s, red: kind === RED, t: L });
  } else {
    run.clean++;
    if (!run.blaze && run.clean >= R.blaze) { run.blaze = true; run.blazes++; lit = true; }
  }
  run.nb++;
  if (run.nb > run.maxNb) run.maxNb = run.nb;
  run.floor = f + 1; run.at = L;
  run.fl = 'fall'; run.pl = L; run.nl = L + R.fall;
  if (ev) ev.push({ e: 'fall', floor: run.floor, clean: run.clean, t: L });
  if (lit && ev) ev.push({ e: 'blaze', floor: run.floor, t: L });
  const k = areaIndex(run.floor);
  if (k !== run.area) { run.area = k; if (ev) ev.push({ e: 'area', id: AREAS[k].id, floor: run.floor, t: L }); }
  // THE DARKNESS is never more than `lead` floors above the deepest floor the ball has reached (and its pace starts again from there —
  // F3B: THE PACE EASES WITH DEPTH, by the floor the ball is on: tuning.js#darkPaceAt)
  if (run.floor - R.dark.lead > run.dk) {
    run.dk = run.floor - R.dark.lead; run.dn = L + darkPaceAt(R, run.floor);
    if (ev) ev.push({ e: 'dark', floor: run.dk, t: L });
  }
  const M = R.modes[run.mode];
  if (M.finish != null && run.floor >= M.finish) finish(run, 'made', '', L, ev);
}

/** THE DARKNESS comes one floor down at tick D — when it reaches the ball's floor the run is OUT ('dark') */
function darker(run, D, ev) {
  run.dk++; run.dn = D + darkPaceAt(run.R, run.floor);
  if (ev) ev.push({ e: 'dark', floor: run.dk, t: D });
  if (run.dk >= run.floor) finish(run, 'out', 'dark', D, ev);
}

/**
 * bring the run to tick T (an integer): every LANDING and every step of THE DARKNESS up to T happens, in order — at the same tick the
 * landing first (a ball that falls through a gap that tick has left the floor the darkness takes). THE CAP (a mode's capTicks) ends the
 * run where it stands AT its tick — before anything else that tick. `ev` (optional) collects the EVENTS for the view, each with its tick `t`:
 *   land { floor, slice, kind } · bounce { floor, slice } · shatter { floor, slice, red } · fall { floor, clean } · blaze { floor } ·
 *   area { id, floor } · dark { floor } · out { cause } · made · cap · (F2) bounce.red = the landing right after a shatter, saved · hold (hold())
 *   — a landing's own events come together, in order: land → bounce | out | ( shatter → ) fall → blaze → area → dark → made.
 *   (`fall.floor` / `blaze.floor` / `area.floor` = THE FLOORS PASSED after it — the floor the ball now falls to.)
 * EVERY MOVE WITH A TICK ≤ T MUST BE IN BEFORE THIS (turn / setAngle step the run themselves — a view calls them first, then stepTo).
 */
export function stepTo(run, T, ev) {
  if (!Number.isSafeInteger(T)) return run;   // (a tick is a whole number — anything else moves nothing)
  const cap = run.R.modes[run.mode].capTicks;
  while (run.st === 'live') {
    const land = run.nl <= run.dn, next = land ? run.nl : run.dn;
    if (cap != null && cap <= next) { if (cap <= T) finish(run, 'cap', '', cap, ev); break; }
    if (next > T) break;
    if (land) landing(run, next, ev); else darker(run, next, ev);
  }
  if (run.st === 'live' && T > run.t) run.t = T;
  return run;
}

/**
 * THE CONTROL — turn the tower by `d` angle units (signed) AT tick T → the units it really turned (0 = nothing: the run over, the cap
 * passed, the log full, d = 0). The engine LOGS the move itself (run.lt / run.la) and the log is always one THE JUDGE accepts:
 *   · MAX SPIN: all the turning that counts at ONE tick is clamped to ± maxSpin — the caller keeps what was not applied and offers it
 *     again at the next tick (the tower catches up at full spin; never felt by a human)
 *   · FAIR INPUT: T is the tick of the finger's MOVE (its event time) and may be EARLIER than the tick the run was already stepped to —
 *     between two landings the angle decides nothing, so the move counts at T exactly; only a move that comes in at or before a landing
 *     ALREADY DECIDED counts at the first tick after it (and never before a move already logged) — `run.mt` says where it counted
 *   · two moves at the same tick are ONE entry (their sum); a tick that ends where it began leaves no entry (the log = the changes only)
 */
export function turn(run, T, d, ev) {
  if (!Number.isSafeInteger(T) || T < 0 || !Number.isSafeInteger(d) || d === 0 || run.st !== 'live') return 0;
  if (T - 1 > run.t) stepTo(run, T - 1, ev);   // (every landing BEFORE T is decided on the angle as it was)
  if (run.st !== 'live') return 0;
  let te = T + 0;   // (+ 0: a −0 tick is tick 0 — never a negative zero in the log)
  if (te <= run.ll) te = run.ll + 1;
  if (te < run.mt) te = run.mt;
  const R = run.R, cap = R.modes[run.mode].capTicks;
  if (cap != null && te >= cap) return 0;
  const n = run.lt.length, same = n > 0 && run.lt[n - 1] === te, base = same ? run.pa : run.a, had = same ? angDiff(run.a, base) : 0;
  if (!same && n >= MAX_LOG) return 0;   // (the log is full — one entry a tick at most, so only a rule set with no cap could get here)
  let want = had + d;
  if (want > R.maxSpin) want = R.maxSpin; else if (want < -R.maxSpin) want = -R.maxSpin;
  if (want === had) return 0;
  const a = wrap(base + want);
  if (same) {
    if (want === 0) { run.lt.pop(); run.la.pop(); } else run.la[n - 1] = a;
  } else {
    run.pa = run.a; run.lt.push(te); run.la.push(a);
  }
  run.a = a; run.mt = te;
  return want - had;
}

/** … the same, by the angle to reach: the tower turns the SHORTEST way from where it stands towards `a` (0 … 4095), clamped to MAX SPIN → the units it turned */
export function setAngle(run, T, a, ev) {
  if (!Number.isSafeInteger(a) || a < 0 || a >= TURN) return 0;
  return turn(run, T, angDiff(a, run.a), ev);
}

/**
 * THE HOLD = EXACT RESUME (F3 — the owner, Nov 26; F2's hold restarted the ball's flight: a hold at the right tick was a free dodge of
 * a landing — docs/freefall.md "THE HOLD"): a LOGGED event { k: 'hold', t: T } — the page was hidden / the phone locked (SOLO only: a
 * mode's `holds`; a match never holds). T is a PLAY tick: the time away and the 3 · 2 · 1 before the run goes on are not run time.
 * THE WHOLE STATE IS FROZEN AT T AND RESUMED UNCHANGED: everything up to AND AT T happens first (a landing due at T lands — on the
 * angle the tower stood at), then nothing moves — the ball's flight (`fl` · `pl` · `nl`: its phase + its height), the tower's angle,
 * THE DARKNESS (`dk` · `dn`) are exactly what they were. A HOLD NEVER CANCELS OR RESTARTS A LANDING: a log with its holds taken out
 * replays to the SAME run, tick for tick. The only thing a hold changes: the next move counts at T + 1 at the earliest (no input
 * counts while the run is held — the log's order: a move at a hold's own tick comes before it).
 * → true = held · false = refused: no hold left in this mode, the run over (or ended by what was due at T), T not a whole tick, a tick
 * the run was already stepped to, a move already counted after T, T at / past THE CAP.
 */
export function hold(run, T, ev) {
  if (!Number.isSafeInteger(T) || T < 0 || run.st !== 'live') return false;
  const M = run.R.modes[run.mode];
  if (run.holds >= (M.holds || 0)) return false;
  if (T <= run.t) return false;   // (a tick the run was already stepped to: what happened there stands — the page holds at the NEXT tick)
  if (T < run.mt) return false;
  if (M.capTicks != null && T >= M.capTicks) return false;
  stepTo(run, T, ev);             // (what is due at T happens: a hold takes nothing away — the landing, the darkness's step)
  if (run.st !== 'live') return false;
  run.holds++; run.ht.push(T + 0); run.mt = T + 1;
  if (ev) ev.push({ e: 'hold', t: T });
  return true;
}

/** THE INPUT LOG as the judge reads it: [{ t, a }] — the ticks A changed at, rising — and (F2) its HOLDS { k: 'hold', t } in their place (a move at a hold's own tick comes before it) */
export function logOf(run) {
  const out = [];
  let k = 0;
  for (let i = 0; i < run.lt.length; i++) {
    while (k < run.ht.length && run.ht[k] < run.lt[i]) out.push({ k: 'hold', t: run.ht[k++] });
    out.push({ t: run.lt[i], a: run.la[i] });
  }
  while (k < run.ht.length) out.push({ k: 'hold', t: run.ht[k++] });
  return out;
}

/** the slice under the ball on the floor it is on / falling to, at the angle the tower stands at (for the VIEW + the bots) */
export const sliceNow = run => sliceUnder(run.a, floorNow(run).twist);
/** how many floors THE DARKNESS is above the ball's floor (0 = it has it) */
export const darkGap = run => run.floor - run.dk;

/** the run's RESULT — what the phone shows and the server's judge returns (the same code) */
export function resultOf(run) {
  return {
    rules: run.rules,
    floor: run.floor, tick: run.at, end: run.end, over: run.st !== 'live',
    cause: run.st === 'out' ? run.cause : run.st === 'made' || run.st === 'cap' ? run.st : '',
    made: run.st === 'made',
    bounces: run.bounces, shatters: run.shatters, blazes: run.blazes, bestRun: run.maxNb, moves: run.lt.length,
    ...(run.holds ? { holds: run.holds } : {}),
    feats: { reachedHarbor: run.floor >= HARBOR_FLOOR, terminal: run.maxNb >= TERMINAL_RUN, reachedBottom: run.floor >= BOTTOM_FLOOR },
  };
}
