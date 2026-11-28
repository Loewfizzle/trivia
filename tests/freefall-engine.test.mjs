// FREEFALL F1 — THE ENGINE (js/games/freefall/{tuning,tower-gen,engine,logic,replay}.js — docs/freefall.md): every rule, with HAND-BUILT
// input. THE ONE RULE: the same seed + the same input log = the exact same run (REPLAY = LIVE); integers only; no clock, no Math.random.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TICK_HZ, TICK_MS, TURN, SLICES, BALL, SAFE, GAP, RED, MAX_SPIN, FIRST, BOUNCE, FALL, BLAZE, DARK, HUMAN, MODES, MODE_IDS, AREAS, HARBOR_FLOOR, BOTTOM_FLOOR, TERMINAL_RUN, MAX_LOG, SEED_MAX, RULE_SETS, RULES_DEFAULT, ruleSet, makeRuleSet, isRuleRow, darkPaceAt } from '../js/games/freefall/tuning.js';
import { createRun, stepTo, turn, setAngle, hold, isOver, resultOf, logOf, floorNow, sliceNow, darkGap, modeRow, seedHash } from '../js/games/freefall/engine.js';
import { sliceStart, sliceUnder, kindAt, kindAtTick, moversAt, wrap, angDiff, floorAt } from '../js/games/freefall/tower-gen.js';
import { END_WORDS, endWords, seedOf, tickOf, areaOf, areaIndex, featsOf, FEAT_NAMES, rankCompare, standings, gameStandings } from '../js/games/freefall/logic.js';
import { replay, judgeRun, logProblem, packLog, packRun, unpackLog, isHold, maxEntries } from '../js/games/freefall/replay.js';
import { BOTS, BOT_IDS, makeBot, playBot, planFlight as planFlightOf } from '../js/games/freefall/bot.js';
import { hashString } from '../js/core/rng.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const code = f => read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');
const C = RULE_SETS.classic;

// ---- THE HAND: it puts the slice it wants under the ball before the next landing (MAX SPIN is 171 a tick: half a turn fits in any flight)
/** the tower angle that puts floor-local angle `u` of the ball's floor under the ball */
const angleFor = (run, u) => wrap(BALL - floorNow(run).twist - u);
/** the kind under the ball as the tower stands — AT THE NEXT LANDING's tick (F2: THE TRENCH's red moves) */
const under = run => kindAtTick(floorNow(run), sliceNow(run), run.nl, run.R);
/** a slice of `kind` on the ball's floor (the nearest to where the ball is), or −1 */
function sliceOfKind(run, kind) {
  const fl = floorNow(run), s0 = sliceNow(run);
  for (let k = 0; k <= SLICES / 2; k++) for (const s of [(s0 + k) % SLICES, (s0 + SLICES - k) % SLICES]) if (kindAtTick(fl, s, run.nl, run.R) === kind) return s;
  return -1;
}
/** turn the tower (tick by tick from the tick after the run stands, ≤ MAX SPIN each) until floor-local angle `u` is under the ball — all before the next landing */
function steerTo(run, u, ev) {
  const A = angleFor(run, u);
  for (let t = run.t + 1; run.a !== A; t++) { assert.ok(t <= run.nl, 'the turn fits in the flight'); assert.notEqual(turn(run, t, angDiff(A, run.a), ev), 0); }
}
/** put the MIDDLE of a slice of `kind` under the ball (false = the floor has none) */
function aim(run, kind, ev) { const s = sliceOfKind(run, kind); if (s < 0) return false; steerTo(run, sliceStart(s) + 170, ev); return true; }
/** play the next landing → its tick */
const land = (run, ev) => { const N = run.nl; stepTo(run, N, ev); return N; }
/** one floor down with a bounce on the way (so THE BLAZE never lights): SAFE → bounce → GAP → fall */
function floorDown(run, ev) { assert.ok(aim(run, SAFE, ev)); land(run, ev); assert.ok(aim(run, GAP, ev)); land(run, ev); }
/** fall straight through `n` floors, a gap every time (clean — THE BLAZE lights on the way) */
function dive(run, n, ev) { for (let k = 0; k < n && !isOver(run); k++) { aim(run, GAP, ev); land(run, ev); } }
/** a fresh run brought down to floor `f` with a bounce on every floor, resting (just bounced) on a SAFE slice */
function runAt(f, { seed = 'eng', mode = 'solo' } = {}) {
  const run = createRun({ seed, mode });
  while (run.floor < f) floorDown(run);
  aim(run, SAFE); land(run);
  assert.equal(run.floor, f); assert.equal(run.fl, 'bounce'); assert.equal(run.clean, 0);
  return run;
}
/** the first floor from `from` on (this seed) that holds a slice of `kind` */
function floorWith(seed, kind, from = 0) { const h = seedHash(seed); for (let i = from; i < from + 400; i++) { const fl = floorAt(h, i); for (let s = 0; s < SLICES; s++) if (kindAt(fl, s) === kind) return i; } return -1; }
const names = ev => ev.map(e => e.e).join(' ');

test('THE NUMBERS: 60 ticks a second · one turn = 4096 units, 12 slices · MAX SPIN 171 a tick (≈ 2.5 turns a second) · BOUNCE + FALL fixed · THE BLAZE after 3 · THE DARKNESS (F3 — JAYWALK-style pressure): 3 s of grace, a floor every 2 s, never more than 3 floors above · the modes · the areas · the feats', () => {
  assert.deepEqual([TICK_HZ, TURN, SLICES, BALL, MAX_SPIN, BLAZE], [60, 4096, 12, 0, 171, 3]);
  assert.equal(TICK_MS, 1000 / 60);
  assert.ok(MAX_SPIN * TICK_HZ / TURN > 2.49 && MAX_SPIN * TICK_HZ / TURN < 2.51, '171 a tick = 2.5 turns a second');
  assert.deepEqual([BOUNCE, FALL, FIRST], [C.bounce, C.fall, C.first]);
  assert.ok(Number.isInteger(BOUNCE) && Number.isInteger(FALL) && BOUNCE > FALL && FALL > HUMAN.react, 'a fall is shorter than a bounce — and longer than a human reaction');
  assert.deepEqual(DARK, { grace: 180, pace: 120, lead: 3, paceDeep: 160, easeFrom: 100, easeTo: 160 });   // (F3 — the owner, Nov 26: it was 240 · 150 · 6; a stopped ball has 6 s now, and the darkness is always in sight · F3B: it EASES WITH DEPTH — 8 s from floor 160)
  assert.deepEqual(MODES, { solo: { finish: null, capTicks: 30 * 60 * 60, holds: 3 }, match: { finish: 200, capTicks: 3 * 60 * 60, holds: 0 }, daily: { finish: 200, capTicks: 3 * 60 * 60, holds: 0 } });
  assert.deepEqual(MODE_IDS, ['solo', 'match', 'daily']);
  assert.deepEqual(AREAS.map(a => [a.from, a.id, a.name]), [[0, 'rooftop', 'THE ROOFTOP'], [40, 'offices', 'THE OFFICES'], [80, 'speakeasy', 'THE SPEAKEASY'], [120, 'harbor', 'UNDER THE HARBOR'], [160, 'deep', 'THE DEEP'], [200, 'bottom', 'THE BOTTOM'], [201, 'trench', 'THE TRENCH']]);
  assert.deepEqual([HARBOR_FLOOR, BOTTOM_FLOOR, TERMINAL_RUN], [120, 200, 15]);
  assert.equal(MAX_LOG, 108000, 'one entry a tick at most: never more entries than the longest mode has ticks');
  // the modes' own names only; a rule set by its id (or a sim's own row)
  assert.equal(modeRow('constructor'), null); assert.equal(modeRow('__proto__'), null); assert.equal(modeRow(undefined), null); assert.equal(modeRow('match'), MODES.match);
  assert.throws(() => createRun({ seed: 'a', mode: 'toString' }), /unknown mode/);
  assert.throws(() => createRun({ seed: 'a', rules: 'nope' }), /unknown rule set/);
  assert.throws(() => createRun({ seed: 'a', rules: { ...C } }), /unknown rule set/, 'a look-alike object is not a rule set');
  assert.equal(ruleSet('classic'), C); assert.equal(ruleSet('constructor'), null); assert.equal(ruleSet('CLASSIC'), null); assert.equal(ruleSet(null), null);
  assert.equal(RULES_DEFAULT, 'classic'); assert.ok(isRuleRow(C) && !isRuleRow({ ...C }) && !isRuleRow(null));
  assert.equal(createRun({ seed: 'a' }).rules, 'classic');
});

test('A NEW RUN: tick 0 = GO — the tower at angle 0, the ball dropping in onto floor 0, its first landing at tick FIRST on a SAFE slice (a bounce); the darkness 6 floors above', () => {
  for (const seed of ['a', 'b', 'c', 'eng', '7']) {
    const run = createRun({ seed, mode: 'solo' }), ev = [];
    assert.deepEqual([run.t, run.st, run.a, run.floor, run.at, run.fl, run.pl, run.nl, run.ll, run.clean, run.blaze, run.nb, run.dk, run.dn], [0, 'live', 0, 0, 0, 'drop', 0, FIRST, -1, 0, false, 0, -DARK.lead, DARK.grace + DARK.pace]);
    assert.deepEqual(logOf(run), []);
    assert.equal(under(run), SAFE, 'the slice under the ball at the start is solid, not red');
    stepTo(run, FIRST - 1, ev);
    assert.deepEqual(ev, [], 'nothing happens before the first landing');
    stepTo(run, FIRST, ev);
    assert.deepEqual(ev, [{ e: 'land', floor: 0, slice: sliceNow(run), kind: SAFE, t: FIRST, a: 0 }, { e: 'bounce', floor: 0, slice: sliceNow(run), t: FIRST }]);
    assert.deepEqual([run.floor, run.fl, run.pl, run.nl, run.ll, run.bounces, run.t], [0, 'bounce', FIRST, FIRST + BOUNCE, FIRST, 1, FIRST]);
    assert.equal(darkGap(run), DARK.lead);
  }
  // a tick that is not a whole number moves nothing
  const run = createRun({ seed: 'a' });
  for (const bad of [NaN, 12.5, Infinity, '30', null, undefined]) { stepTo(run, bad); assert.equal(run.t, 0); }
  assert.equal(turn(run, 1.5, 10), 0); assert.equal(turn(run, -1, 10), 0); assert.equal(turn(run, 3, 0.5), 0); assert.equal(turn(run, 3, NaN), 0); assert.equal(turn(run, 3, 0), 0);
  assert.equal(setAngle(run, 3, 4096), 0); assert.equal(setAngle(run, 3, -1), 0); assert.equal(setAngle(run, 3, 2.5), 0);
  assert.deepEqual(logOf(run), []);
});

test('THE SLICE UNDER THE BALL decides the landing — AT THE SLICE\'S EDGE TO THE UNIT: the first unit of a gap falls, the unit before it (the solid slice beside it) bounces; and it is the angle AT THE LANDING TICK that counts', () => {
  let edges = 0;
  for (const seed of ['e1', 'e2', 'e3', 'e4', 'e5', 'e6']) {
    const h = seedHash(seed), fl = floorAt(h, 0);
    for (let s = 0; s < SLICES; s++) {
      // an edge between two kinds: slice s − 1 | slice s
      const p = (s + SLICES - 1) % SLICES, kp = kindAt(fl, p), ks = kindAt(fl, s);
      if (kp === ks) continue;
      edges++;
      for (const [u, kind] of [[sliceStart(s), ks], [wrap(sliceStart(s) - 1), kp]]) {
        const run = createRun({ seed });
        steerTo(run, u);
        assert.equal(sliceNow(run), kind === ks ? s : p);
        land(run);
        assert.equal(run.floor, kind === GAP ? 1 : 0, `${seed} slice ${s}: unit ${u} is ${kind === GAP ? 'a gap' : 'solid'}`);
        assert.equal(run.fl, kind === GAP ? 'fall' : 'bounce');
      }
    }
  }
  assert.ok(edges >= 20, `${edges} edges tried`);
  // THE ANGLE AT THE LANDING TICK: a move AT the landing's own tick counts for it; a move one tick later does not
  const run = createRun({ seed: 'e1' }), gap = sliceOfKind(run, GAP), u = sliceStart(gap) + 170, A = angleFor(run, u);
  const a = createRun({ seed: 'e1' }), b = createRun({ seed: 'e1' });
  // bring both within one MAX SPIN of the gap's first unit, on the solid side
  for (const r of [a, b]) { const near = wrap(angleFor(r, sliceStart(gap)) + 1); for (let t = 1; r.a !== near; t++) turn(r, t, angDiff(near, r.a)); assert.notEqual(under(r), GAP); }
  assert.equal(turn(a, FIRST, -1), -1, 'the last unit, at the landing\'s own tick');
  stepTo(a, FIRST); assert.equal(a.floor, 1, 'it fell: the angle at the landing tick is the one that counts');
  stepTo(b, FIRST); assert.equal(turn(b, FIRST + 1, -1), -1); assert.equal(b.floor, 0, 'a tick later: the landing had been decided — it bounced');
  void A;
});

test('BOUNCE + FALL TIMING: a bounce = BOUNCE ticks to the next landing on the SAME floor · a gap = FALL ticks to the landing on the next · they never change with depth', () => {
  const run = createRun({ seed: 'time' }), ev = [];
  assert.equal(land(run, ev), FIRST);
  for (let k = 1; k <= 3; k++) { assert.equal(run.nl, FIRST + k * BOUNCE); land(run, ev); assert.equal(run.floor, 0); assert.equal(run.bounces, k + 1); }
  assert.ok(aim(run, GAP, ev));
  const L = land(run, ev);
  assert.equal(L, FIRST + 4 * BOUNCE);
  assert.deepEqual([run.floor, run.at, run.fl, run.pl, run.nl, run.clean, run.nb], [1, L, 'fall', L, L + FALL, 1, 1]);
  assert.deepEqual(ev.slice(-3).map(e => [e.e, e.floor, e.t]), [['land', 0, L], ['fall', 1, L], ['dark', 1 - DARK.lead, L]], 'the darkness follows at once: never more than the lead above');
  assert.equal(ev.find(e => e.e === 'fall').clean, 1);
  // the same two numbers at every depth — the rooftop, the deep, the trench
  for (const f of [3, 60, 130, 205]) {
    const r = runAt(f, { seed: 'depth' });
    const t0 = r.ll; land(r); assert.equal(r.ll - t0, BOUNCE, `floor ${f}: a bounce`);
    aim(r, GAP); const t1 = land(r); land(r); assert.equal(r.ll - t1, FALL, `floor ${f}: a fall`);
  }
  assert.equal(resultOf(runAt(5, { seed: 'time' })).tick, runAt(5, { seed: 'time' }).at, 'the result\'s tick = the tick the floor was reached');
});

test('RED = OUT: a landing on a red slice ends the run at that tick (cause "red") — the floor is not passed', () => {
  const seed = 'red', f = floorWith(seed, RED);
  assert.ok(f >= 10, `the first red of this tower is on floor ${f} (floors 0–9 have none)`);
  const run = runAt(f, { seed }), ev = [];
  assert.ok(aim(run, RED, ev));
  const L = land(run, ev);
  assert.deepEqual([run.st, run.cause, run.end, run.floor, run.t], ['out', 'red', L, f, L]);
  assert.deepEqual(ev.map(e => e.e), ['land', 'out']); assert.equal(ev[0].kind, RED); assert.deepEqual(ev[1], { e: 'out', cause: 'red', t: L });
  assert.ok(isOver(run));
  const r = resultOf(run);
  assert.deepEqual([r.floor, r.end, r.over, r.cause, r.made], [f, L, true, 'red', false]);
  assert.equal(endWords(r), 'HIT THE RED');
  // over is over: nothing moves it again
  const snap = JSON.stringify(run);
  stepTo(run, L + 5000); assert.equal(turn(run, L + 1, 50), 0); assert.equal(setAngle(run, L + 2, 100), 0);
  assert.equal(JSON.stringify(run), snap);
});

test('THE BLAZE: the 3rd floor fallen in a row without a bounce lights it · it is CARRIED over a gap · the next solid slice SHATTERS (SAFE and RED alike): the floor counts, the ball keeps falling, the blaze is spent, clean = 0 · 3 MORE clean floors relight it (2 do not) · a bounce ends the count', () => {
  // lit on the 3rd clean floor — not the 2nd
  const run = runAt(12, { seed: 'blaze' }), ev = [];
  dive(run, 2, ev);
  assert.deepEqual([run.clean, run.blaze, run.floor], [2, false, 14]);
  aim(run, GAP, ev); const L3 = land(run, ev);
  assert.deepEqual([run.clean, run.blaze, run.blazes, run.floor], [3, true, 1, 15]);
  assert.deepEqual(ev.slice(-4).map(e => [e.e, e.floor, e.t]), [['land', 14, L3], ['fall', 15, L3], ['blaze', 15, L3], ['dark', 15 - DARK.lead, L3]], 'land → fall → blaze (→ the darkness follows), at the same tick');
  // CARRIED over a gap: still lit, nothing shatters
  ev.length = 0; aim(run, GAP, ev); land(run, ev);
  assert.deepEqual([run.clean, run.blaze, run.shatters, run.floor], [4, true, 0, 16]);
  assert.ok(!ev.some(e => e.e === 'shatter' || e.e === 'blaze'));
  // SPENT on a SAFE slice: it shatters — the floor counts, the ball keeps falling (FALL ticks), clean restarts at 0
  ev.length = 0; assert.ok(aim(run, SAFE, ev)); const Ls = land(run, ev);
  assert.deepEqual([run.clean, run.blaze, run.shatters, run.floor, run.at, run.fl, run.nl, run.bounces >= 1, run.nb], [0, false, 1, 17, Ls, 'fall', Ls + FALL, true, 5]);
  assert.deepEqual(ev.filter(e => e.e !== 'dark').map(e => e.e), ['land', 'shatter', 'fall']);
  assert.deepEqual(ev.find(e => e.e === 'shatter'), { e: 'shatter', floor: 16, slice: ev[0].slice, red: false, t: Ls });
  assert.equal(run.sf, 17, 'the floor the shatter dropped the ball to');
  // 2 more clean floors: not lit; the 3rd relights
  dive(run, 2); assert.deepEqual([run.clean, run.blaze], [2, false]);
  dive(run, 1); assert.deepEqual([run.clean, run.blaze, run.blazes], [3, true, 2]);
  // SPENT on a RED slice alike: no out — it shatters
  let guard = 0;
  while (sliceOfKind(run, RED) < 0) { assert.ok(guard++ < 30); dive(run, 1); assert.ok(run.blaze, 'carried from gap to gap'); }
  ev.length = 0; aim(run, RED, ev); const f = run.floor, Lr = land(run, ev);
  assert.equal(run.st, 'live', 'THE BLAZE goes through red');
  assert.deepEqual(ev.find(e => e.e === 'shatter'), { e: 'shatter', floor: f, slice: ev[0].slice, red: true, t: Lr });
  assert.deepEqual([run.floor, run.blaze, run.clean, run.shatters], [f + 1, false, 0, 2]);
  // … and with the blaze spent, red is red again — but NOT on the landing right after the shatter (F2, the owner's rule b: a bounce)
  if (aim(run, RED)) {
    land(run); assert.deepEqual([run.st, run.fl, run.clean], ['live', 'bounce', 0], 'the landing right after a shatter is never an out');
    if (aim(run, RED)) { land(run); assert.deepEqual([run.st, run.cause], ['out', 'red'], 'the next landing on red is'); }
  }
  // A BOUNCE ENDS THE COUNT: gap, gap, bounce, gap, gap → never lit
  const b = runAt(12, { seed: 'blaze' });
  dive(b, 2); aim(b, SAFE); land(b); assert.deepEqual([b.clean, b.blaze], [0, false]);
  dive(b, 2); assert.deepEqual([b.clean, b.blaze, b.blazes], [2, false, 0]);
});

test('THE NO-BOUNCE RUN: gaps + shatters count, only a bounce resets it — 15 floors in a row = TERMINAL VELOCITY (the feat keeps the best run)', () => {
  const run = runAt(0, { seed: 'term' });
  assert.equal(run.nb, 0);
  dive(run, 3); assert.deepEqual([run.nb, run.clean, run.blaze], [3, 3, true]);
  aim(run, SAFE); land(run);   // (a shatter: the no-bounce run goes on, the clean count starts again)
  assert.deepEqual([run.nb, run.clean, run.shatters, run.maxNb], [4, 0, 1, 4]);
  dive(run, 3); assert.deepEqual([run.nb, run.clean], [7, 3]);
  // 14 in a row, then a bounce: no feat
  dive(run, 7); assert.equal(run.nb, 14);
  assert.equal(resultOf(run).feats.terminal, false);
  if (run.blaze) { aim(run, SAFE); land(run); }   // (spend the blaze so the next solid slice is a real bounce … the shatter made it 15)
  const was = run.nb;
  aim(run, SAFE); land(run);
  assert.deepEqual([run.nb, run.clean], [0, 0], 'a bounce resets both');
  assert.equal(run.maxNb, was);
  assert.equal(resultOf(run).feats.terminal, was >= 15);
  // exactly 15: the feat, kept after the bounce
  const r2 = runAt(0, { seed: 'term2' });
  for (let k = 0; k < 15; k++) { if (!aim(r2, GAP)) assert.fail('a floor without a gap'); land(r2); }
  assert.equal(r2.nb, 15); assert.equal(resultOf(r2).feats.terminal, true); assert.equal(resultOf(r2).bestRun, 15);
  while (r2.blaze || under(r2) !== SAFE || r2.fl !== 'bounce') { aim(r2, SAFE); land(r2); if (r2.nb === 0) break; }
  assert.equal(r2.nb, 0); assert.equal(resultOf(r2).feats.terminal, true, 'the best run is kept');
  assert.equal(TERMINAL_RUN, 15);
});

test('THE LIGHTS GO OUT: the grace, then one floor every PACE ticks · never more than LEAD floors above the ball\'s floor (the pace starts again from there) · it only ever moves down · the EXACT out tick', () => {
  // THE STALLER: nobody touches the screen — the darkness starts LEAD floors above, rests GRACE ticks, then a floor every PACE: out at GRACE + LEAD × PACE
  const run = createRun({ seed: 'dark', mode: 'match' }), ev = [];
  stepTo(run, DARK.grace + DARK.pace - 1, ev);
  assert.ok(!ev.some(e => e.e === 'dark'), 'the grace + the first floor\'s pace: nothing yet');
  assert.equal(run.dk, -DARK.lead);
  stepTo(run, DARK.grace + DARK.pace, ev);
  assert.deepEqual(ev.filter(e => e.e === 'dark'), [{ e: 'dark', floor: -DARK.lead + 1, t: DARK.grace + DARK.pace }]);
  const OUT = DARK.grace + DARK.lead * DARK.pace;
  stepTo(run, OUT - 1, ev);
  assert.deepEqual([run.st, run.dk, darkGap(run)], ['live', -1, 1]);
  stepTo(run, OUT + 999, ev);
  assert.deepEqual([run.st, run.cause, run.end, run.dk, run.floor, run.t], ['out', 'dark', OUT, 0, 0, OUT]);
  assert.equal(OUT / TICK_HZ, 9, 'a run nobody touches is caught after 9 s (the 3 s of grace + 3 floors × 2 s)');
  assert.deepEqual(ev.filter(e => e.e === 'dark').map(e => [e.floor, e.t]), Array.from({ length: DARK.lead }, (_, i) => i + 1).map(k => [-DARK.lead + k, DARK.grace + k * DARK.pace]));
  assert.deepEqual(ev.slice(-2), [{ e: 'dark', floor: 0, t: OUT }, { e: 'out', cause: 'dark', t: OUT }]);
  assert.equal(endWords(resultOf(run)), 'THE LIGHTS WENT OUT');
  // every seed, every mode: the same tick
  for (const mode of MODE_IDS) for (const seed of ['s1', 's2', 's3']) { const r = createRun({ seed, mode }); stepTo(r, 99999); assert.deepEqual([r.cause, r.end], ['dark', OUT]); }

  // THE LEAD: a ball that dives is followed — when it reaches floor f the darkness is at least at f − LEAD, and its pace starts again from that tick
  const d = createRun({ seed: 'dark2' }), dev = [];
  dive(d, 9, dev);
  const Lf = d.at;
  assert.equal(d.floor, 9);
  assert.deepEqual([d.dk, d.dn, darkGap(d)], [9 - DARK.lead, Lf + DARK.pace, DARK.lead]);
  assert.deepEqual(dev.filter(e => e.e === 'dark').map(e => e.floor), Array.from({ length: 9 }, (_, i) => i + 1 - DARK.lead), 'it started exactly the lead above: every floor the ball fell pulled it one down');
  assert.ok(dev.filter(e => e.e === 'dark').every((e, k) => e.t === dev.filter(x => x.e === 'fall')[k].t), '… at the tick of that fall');
  // … then the ball stalls on floor 9 (bouncing on solid ground): out LEAD × PACE ticks after it got there
  if (d.blaze) { /* (the next landing would shatter — let it, then stall one floor lower) */ }
  const stall = createRun({ seed: 'dark2' });
  for (let k = 0; k < 9; k++) floorDown(stall);
  const at = stall.at, f = stall.floor;
  aim(stall, SAFE); stepTo(stall, 99999);
  assert.deepEqual([stall.cause, stall.floor, stall.end], ['dark', f, at + DARK.lead * DARK.pace], 'the exact tick: the last catch-up + LEAD × PACE');

  // A SLOW PLAYER LOSES GROUND: no catch-up while the ball is within the lead — the darkness keeps its own pace from where it stands
  const slow = createRun({ seed: 'dark3' });
  const seenDk = [slow.dk];
  for (let k = 0; k < 6 && !isOver(slow); k++) { for (let b = 0; b < 5 && !isOver(slow); b++) { aim(slow, SAFE); land(slow); } if (!isOver(slow)) { aim(slow, GAP); land(slow); } seenDk.push(slow.dk); }   // (a floor every 5 bounces: slower than the darkness — F3: it is caught within the six floors)
  for (let k = 1; k < seenDk.length; k++) assert.ok(seenDk[k] >= seenDk[k - 1]);
  assert.ok(darkGap(slow) < DARK.lead, `after 6 slow floors the darkness is ${darkGap(slow)} floors above (it started ${DARK.lead})`);

  // IT ONLY EVER MOVES DOWN — over whole bot runs
  for (const id of BOT_IDS) for (let i = 0; i < 6; i++) {
    const r = createRun({ seed: `dk${i}`, mode: 'solo' }), bot = makeBot(id, `dk${i}`);
    let last = r.dk;
    while (!isOver(r) && r.floor < 260) { playBot(r, bot, { maxFloor: r.floor + 1 }); assert.ok(r.dk >= last && r.floor - r.dk <= DARK.lead && (isOver(r) || r.dk < r.floor)); last = r.dk; }
  }
});

test('THE DARKNESS EASES WITH DEPTH (F3B — the owner, Nov 26): floors 0–100 EXACTLY as F3 (a floor every 120 ticks: 6 s stopped), a straight line over floors 100–160, a floor every 160 ticks from 160 on (8 s stopped — THE DEEP + THE TRENCH); a pure function of the BALL\'s floor (integers); the judge replays it; a row without the ease keeps one pace', () => {
  // the pace at a depth: pure, integers, never below F3's, never above the deep pace
  assert.deepEqual([0, 1, 50, 99, 100, 101, 102, 115, 130, 145, 159, 160, 161, 200, 201, 600].map(f => darkPaceAt(C, f)), [120, 120, 120, 120, 120, 120, 121, 130, 140, 150, 159, 160, 160, 160, 160, 160]);
  for (let f = 0; f < 700; f++) { const p = darkPaceAt(C, f); assert.ok(Number.isSafeInteger(p) && p >= 120 && p <= 160 && p >= darkPaceAt(C, f - 1 < 0 ? 0 : f - 1), `floor ${f}: ${p}`); }
  assert.deepEqual([100, 130, 160].map(f => DARK.lead * darkPaceAt(C, f) / TICK_HZ), [6, 7, 8], 'a stopped ball: 6 s down to floor 100 · 7 s at 130 · 8 s from 160');
  // (a what-if row that names no ease — a sim's own, an older shape: ONE pace at every depth)
  const flat = makeRuleSet({ ...JSON.parse(JSON.stringify({ ...C, reach: undefined, hop: undefined })), id: 'flat', dark: { grace: 180, pace: 120, lead: 3 } });
  assert.deepEqual([0, 130, 400].map(f => darkPaceAt(flat, f)), [120, 120, 120]);
  // (the fresh-eyes review: HALF a ramp — a deep pace with no floors to ease over — is no ramp: its one pace, never a NaN)
  const half = makeRuleSet({ ...JSON.parse(JSON.stringify({ ...C, reach: undefined, hop: undefined })), id: 'half', dark: { grace: 180, pace: 120, lead: 3, paceDeep: 160 } });
  assert.deepEqual([0, 130, 400].map(f => darkPaceAt(half, f)), [120, 120, 120]);
  // A BALL THAT STOPS at a depth is out EXACTLY lead × the pace at its floor after it got there — on the live engine and on the judge's replay
  for (const [f, pace] of [[60, 120], [100, 120], [130, 140], [150, 153], [160, 160], [205, 160], [262, 160]]) {
    assert.equal(darkPaceAt(C, f), pace);
    let done = 0;
    for (let i = 0; i < 40 && done < 3; i++) {
      const seed = `deep${f}-${i}`, run = createRun({ seed, mode: 'solo' });
      // (down through the gaps to floor f — a run the blaze + the red never ended — then hands off on SAFE ground)
      while (!isOver(run) && run.floor < f) { aim(run, GAP); land(run); }
      if (isOver(run) || run.floor !== f) continue;
      while (!isOver(run) && run.blaze) { aim(run, SAFE); land(run); }   // (a lit blaze would shatter the ground: bounce it out first — on the same floor or a few lower)
      if (isOver(run)) continue;
      const on = run.floor, at = run.at, want = at + DARK.lead * darkPaceAt(C, on);
      // it stands: every landing from here on SAFE ground of this floor (aimed again each bounce — the trench's red moves)
      while (!isOver(run)) { if (!aim(run, SAFE)) break; land(run); if (run.floor !== on) break; }
      if (run.floor !== on || run.cause !== 'dark') continue;
      assert.equal(run.end, want, `floor ${on} (seed ${seed}): out lead × ${darkPaceAt(C, on)} ticks after it got there — ${(DARK.lead * darkPaceAt(C, on) / TICK_HZ).toFixed(2)} s`);
      const v = judgeRun({ seed, mode: 'solo', log: logOf(run) });
      assert.deepEqual([v.ok, v.cause, v.floor, v.end], [true, 'dark', on, want], 'REPLAY = LIVE: the judge reads the same pace');
      done++;
    }
    assert.ok(done >= 1, `floor ${f}: a stalled run was found`);
  }
  // the darkness's own steps deep down: one floor every pace-at-the-ball's-floor — never faster than F3's, slower from floor 100
  const r = runAt(170), ev = [];
  const on = r.floor, at = r.at;
  while (!isOver(r)) { if (!aim(r, SAFE, ev)) break; land(r, ev); if (r.floor !== on) break; }
  if (r.floor === on && r.cause === 'dark') assert.deepEqual(ev.filter(e => e.e === 'dark').map(e => e.t - at), [160, 320, 480], 'three steps of 160 ticks: 8 s');
});

test('THE DARKNESS + A LANDING AT THE SAME TICK: the landing first — a ball that falls through a gap that tick has left the floor the darkness takes; one that bounces is caught', () => {
  // (a what-if row: no grace, a floor every FIRST ticks, a lead of 1 — the darkness reaches floor 0 exactly at the first landing's tick)
  const plain = JSON.parse(JSON.stringify(C)); delete plain.reach; delete plain.hop;
  const tight = makeRuleSet({ ...plain, id: 'tight', dark: { grace: 0, pace: plain.first, lead: 1 } });
  const stay = createRun({ seed: 'same', rules: tight }), ev = [];
  assert.deepEqual([stay.dk, stay.dn, stay.nl], [-1, FIRST, FIRST]);
  stepTo(stay, FIRST, ev);
  assert.deepEqual([stay.st, stay.cause, stay.end], ['out', 'dark', FIRST]);
  assert.deepEqual(ev.map(e => e.e), ['land', 'bounce', 'dark', 'out'], 'the landing, THEN the darkness — it bounced on a floor that went dark');
  const go = createRun({ seed: 'same', rules: tight }), ev2 = [];
  aim(go, GAP); stepTo(go, FIRST, ev2);
  assert.deepEqual([go.st, go.floor, go.dk], ['live', 1, 0], 'it fell through at that tick: the darkness took floor 0 behind it');
  assert.deepEqual(ev2.map(e => e.e), ['land', 'fall', 'dark']);
  assert.equal(go.rules, 'tight'); assert.equal(resultOf(go).rules, 'tight');
});

test('THE FINISH + THE CAP, per mode: MATCH + DAILY end ON floor 200 ("made" — YOU HIT THE BOTTOM) or at 3:00 ("cap"), whichever first · SOLO goes on past THE BOTTOM into THE TRENCH (its safety cap: 30:00)', () => {
  for (const mode of ['match', 'daily']) {
    const run = createRun({ seed: 'fin', mode }), ev = [];
    dive(run, 199, ev);
    assert.deepEqual([run.floor, run.st], [199, 'live']);
    aim(run, GAP, ev); const L = land(run, ev);
    assert.deepEqual([run.st, run.floor, run.at, run.end, run.cause], ['made', 200, L, L, '']);
    const r = resultOf(run);
    assert.deepEqual([r.floor, r.tick, r.end, r.cause, r.made, r.over], [200, L, L, 'made', true, true]);
    assert.deepEqual(r.feats, { reachedHarbor: true, terminal: true, reachedBottom: true });
    assert.equal(endWords(r), 'YOU HIT THE BOTTOM');
    assert.deepEqual(ev.slice(-3).map(e => e.e).filter(e => e !== 'dark'), ['fall', 'area', 'made'].filter(e => ev.slice(-3).some(x => x.e === e)));
    assert.deepEqual(ev[ev.length - 1], { e: 'made', t: L });
    assert.deepEqual(ev.filter(e => e.e === 'area').map(e => [e.id, e.floor]), [['offices', 40], ['speakeasy', 80], ['harbor', 120], ['deep', 160], ['bottom', 200]]);
    assert.equal(L, FIRST + 199 * FALL, 'a perfect dive: a floor every FALL ticks');
  }
  // SOLO: floor 200 is one more floor — the run goes on into THE TRENCH
  const solo = createRun({ seed: 'fin', mode: 'solo' }), sev = [];
  dive(solo, 205, sev);
  assert.deepEqual([solo.st, solo.floor], ['live', 205]);
  assert.deepEqual(sev.filter(e => e.e === 'area').slice(-2).map(e => [e.id, e.floor]), [['bottom', 200], ['trench', 201]]);
  assert.deepEqual(resultOf(solo).feats, { reachedHarbor: true, terminal: true, reachedBottom: true });

  // THE CAP: a careful player (two bounces a floor: 90 ticks — ahead of the darkness's 120; F3: THREE a floor is 126, and the darkness
  // gains on it floor by floor) is stopped where they stand AT the cap's tick, before anything else that tick
  for (const mode of MODE_IDS) {
    const cap = MODES[mode].capTicks, run = createRun({ seed: 'cap', mode }), ev = [];
    while (!isOver(run) && run.nl < cap) {
      if (run.bounces % 2 === 1 && run.fl !== 'fall') aim(run, GAP, ev); else aim(run, SAFE, ev);
      if (run.nl >= cap) break;
      land(run, ev);
    }
    assert.equal(run.st, 'live', `${mode}: alive up to the cap`);
    const before = run.floor;
    assert.equal(turn(run, cap - 1, 1), 1, 'the last tick before the cap still takes a move');
    assert.equal(turn(run, cap, 1), 0, 'a move AT the cap\'s tick is too late');
    stepTo(run, cap - 1, ev); assert.equal(run.st, 'live');
    stepTo(run, cap + 500, ev);
    assert.deepEqual([run.st, run.end, run.t, run.floor, run.cause], ['cap', cap, cap, before, '']);
    assert.deepEqual(ev[ev.length - 1], { e: 'cap', t: cap });
    assert.equal(resultOf(run).cause, 'cap'); assert.equal(endWords(resultOf(run)), 'TIME’S UP');
    if (mode !== 'solo') assert.ok(before > 40 && before < 200, `${mode}: floor ${before} at 3:00`);
    else assert.ok(before > 600, `solo: floor ${before} at 30:00 — far into THE TRENCH`);
  }
  // a landing AT the cap's tick never happens: the cap comes first
  const plain = JSON.parse(JSON.stringify(C)); delete plain.reach; delete plain.hop;
  const short = makeRuleSet({ ...plain, id: 'short', modes: { ...plain.modes, match: { finish: 200, capTicks: FIRST } } });
  const r = createRun({ seed: 'cap', mode: 'match', rules: short }), ev = [];
  stepTo(r, FIRST, ev);
  assert.deepEqual(ev, [{ e: 'cap', t: FIRST }]);
});

test('MAX SPIN: all the turning that counts at ONE tick is clamped to ± 171 units — the rest is the caller\'s to offer again; the judge refuses a log that turns faster ("spin")', () => {
  const run = createRun({ seed: 'spin' });
  assert.equal(turn(run, 3, 500), MAX_SPIN, 'clamped');
  assert.deepEqual(logOf(run), [{ t: 3, a: MAX_SPIN }]);
  assert.equal(turn(run, 3, 50), 0, 'this tick is full');
  assert.equal(turn(run, 3, -MAX_SPIN - 100), -MAX_SPIN - 100 < -2 * MAX_SPIN ? -2 * MAX_SPIN : -MAX_SPIN - 100, 'the other way: the tick\'s sum moves, within ± MAX SPIN of where the tick began');
  assert.deepEqual(logOf(run), [{ t: 3, a: wrap(-100) }]);
  assert.equal(turn(run, 3, -500), -(MAX_SPIN - 100)); assert.deepEqual(logOf(run), [{ t: 3, a: wrap(-MAX_SPIN) }]);
  // the tower catches up at full spin, tick after tick
  const c = createRun({ seed: 'spin' });
  let rest = 1000, t = 5;
  while (rest) { rest -= turn(c, t++, rest); }
  assert.deepEqual(logOf(c).map(e => e.a), [171, 342, 513, 684, 855, 1000]);
  assert.deepEqual(logOf(c).map(e => e.t), [5, 6, 7, 8, 9, 10]);
  // setAngle: the SHORTEST way, clamped
  const s = createRun({ seed: 'spin' });
  assert.equal(setAngle(s, 2, 4000), -96); assert.equal(s.a, 4000);
  assert.equal(setAngle(s, 3, 2000), -MAX_SPIN); assert.equal(s.a, 4000 - MAX_SPIN);
  assert.equal(setAngle(s, 4, s.a), 0);
  // THE JUDGE: 171 is fine, 172 is "spin" — and a log the engine wrote always passes
  assert.equal(judgeRun({ seed: 'spin', mode: 'solo', log: [{ t: 3, a: 171 }] }).ok, true);
  assert.deepEqual(judgeRun({ seed: 'spin', mode: 'solo', log: [{ t: 3, a: 172 }] }), { ok: false, why: 'spin' });
  assert.deepEqual(judgeRun({ seed: 'spin', mode: 'solo', log: [{ t: 3, a: 4096 - 172 }] }), { ok: false, why: 'spin' });
  assert.deepEqual(judgeRun({ seed: 'spin', mode: 'solo', log: [{ t: 3, a: 100 }, { t: 4, a: 300 }] }), { ok: false, why: 'spin' });
  for (const r of [run, c, s]) assert.equal(logProblem(logOf(r), 'solo'), null);
});

test('THE LOG = THE CHANGES ONLY: two moves at one tick are ONE entry (their sum) · a tick that ends where it began leaves no entry · the ticks always rise', () => {
  const run = createRun({ seed: 'log' });
  assert.equal(turn(run, 4, 30), 30); assert.equal(turn(run, 4, 12), 12);
  assert.deepEqual(logOf(run), [{ t: 4, a: 42 }]);
  assert.equal(turn(run, 4, -42), -42);
  assert.deepEqual(logOf(run), [], 'back where the tick began: no entry');
  assert.equal(run.a, 0);
  assert.equal(turn(run, 4, 7), 7); assert.deepEqual(logOf(run), [{ t: 4, a: 7 }], 'the same tick can still take a move');
  assert.equal(turn(run, 9, -7), -7);
  assert.deepEqual(logOf(run), [{ t: 4, a: 7 }, { t: 9, a: 0 }]);
  assert.equal(turn(run, 9, -3), -3); assert.equal(turn(run, 9, 3), 3);
  assert.deepEqual(logOf(run), [{ t: 4, a: 7 }, { t: 9, a: 0 }], 'the entry before is untouched');
  // a move for an EARLIER tick than one already logged counts at that logged tick (never before it)
  assert.equal(turn(run, 6, 20), 20);
  assert.deepEqual(logOf(run), [{ t: 4, a: 7 }, { t: 9, a: 20 }]);
  assert.equal(run.mt, 9);
  assert.equal(packRun(run), packLog(logOf(run)));
  assert.equal(logProblem(logOf(run), 'solo'), null);
  assert.equal(resultOf(run).moves, 2);
});

test('FAIR INPUT: a move counts at the tick of its EVENT TIME — also when the run was already stepped past that tick; only a move at / before a landing ALREADY DECIDED counts at the first tick after it; live == the judge either way', () => {
  assert.equal(tickOf(1000, 0), 60); assert.equal(tickOf(1008, 0), 60); assert.equal(tickOf(1009, 0), 61); assert.equal(tickOf(991.7, 0), 60); assert.equal(tickOf(5000 + 250, 5000), 15);
  // between two landings the angle decides nothing: a move for tick 25 that comes in after the run was stepped to 30 counts AT 25
  const run = createRun({ seed: 'fair' });
  stepTo(run, FIRST + 12);
  assert.equal(run.ll, FIRST);
  assert.equal(turn(run, FIRST + 7, 40), 40);
  assert.deepEqual(logOf(run), [{ t: FIRST + 7, a: 40 }]); assert.equal(run.mt, FIRST + 7);
  // … a move whose tick is AT or BEFORE the landing already decided (tick FIRST) counts at FIRST + 1 — the first tick it can still mean anything
  const late = createRun({ seed: 'fair' });
  stepTo(late, FIRST + 12);
  assert.equal(turn(late, FIRST - 3, 40), 40);
  assert.deepEqual(logOf(late), [{ t: FIRST + 1, a: 40 }]);
  const late2 = createRun({ seed: 'fair' });
  stepTo(late2, FIRST + 12);
  assert.equal(turn(late2, FIRST, 40), 40); assert.deepEqual(logOf(late2), [{ t: FIRST + 1, a: 40 }]);
  for (const r of [run, late, late2]) {
    stepTo(r, 5000);
    const j = judgeRun({ seed: 'fair', mode: 'solo', log: logOf(r) });
    assert.equal(j.ok, true); assert.deepEqual([j.floor, j.tick, j.end, j.cause], [r.floor, r.at, r.end, r.cause]);
  }
  // THE FUZZ: 400 sessions as a phone makes them — frames of 1 … 9 ticks, moves whose event time is a few ticks BEHIND the frame, now and
  // then out of order, bursts that hit MAX SPIN, stalls — the live run + its whole event stream == the replay of its own log
  let moves = 0, behind = 0, moved = 0, ended = { red: 0, dark: 0, made: 0, cap: 0 };
  for (let n = 0; n < 400; n++) {
    let x = hashString(`fuzz${n}`);
    const rnd = m => { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return x % m; };
    const seed = `fz${n}`, mode = MODE_IDS[n % 3], live = createRun({ seed, mode }), ev = [];
    let T = 0, bias = rnd(2) ? 1 : -1;
    while (!isOver(live) && T < 4000) {
      T += 1 + rnd(rnd(12) ? 3 : 9);
      const k = rnd(4);
      for (let q = 0; q < k; q++) {
        const at = T - rnd(7) + 1, d = (rnd(5) ? bias : -bias) * (rnd(9) ? 1 + rnd(90) : 100 + rnd(400));
        if (at < 0) continue;
        const before = live.lt.length ? live.lt[live.lt.length - 1] : -1;
        const got = turn(live, at, d, ev);
        moves++; if (got) { moved++; if (live.mt !== at) behind++; assert.ok(live.mt >= at && live.mt >= before && live.mt > live.ll); }
      }
      if (rnd(40) === 0) bias = -bias;
      stepTo(live, T, ev);
    }
    stepTo(live, MODES[mode].capTicks, ev);
    assert.ok(isOver(live));
    const log = logOf(live), evR = [];
    assert.equal(logProblem(log, mode), null, `${seed}: the engine's own log is one the judge accepts`);
    const r = replay({ seed, mode, log, ev: evR });
    const { used, bad, why, ...rest } = r;
    assert.deepEqual([used, bad, why], [log.length, -1, '']);
    assert.deepEqual(rest, resultOf(live), `${seed}: replay == live`);
    assert.deepEqual(evR, ev, `${seed}: the same events, tick for tick`);
    const j = judgeRun({ seed, mode, log });
    assert.equal(j.ok, true);
    ended[j.cause]++;
  }
  assert.ok(moved > 3000 && behind > 150, `${moves} moves offered, ${moved} counted, ${behind} of them pushed past a decided landing / an earlier entry`);
  assert.ok(ended.red > 50 && ended.dark > 20, `the fuzz ends every way a wild hand can: ${JSON.stringify(ended)}`);
});

test('THE SAME LOG TWICE = THE SAME RUN — played in ONE JUMP, landing by landing, and TICK BY TICK: the same state, the same events', () => {
  for (const [n, id] of BOT_IDS.entries()) for (const mode of MODE_IDS) {
    const seed = `same-${id}-${mode}`, src = createRun({ seed, mode });
    playBot(src, makeBot(id, seed), { maxFloor: 230 });
    stepTo(src, MODES[mode].capTicks);
    const log = logOf(src), end = src.end;
    assert.ok(log.length > 10 && isOver(src));
    const strip = r => { const { cur, R, ...rest } = r; void cur; void R; return rest; };
    // A: the whole log, then one jump to the end
    const a = createRun({ seed, mode }), evA = [];
    for (const e of log) turn(a, e.t, angDiff(e.a, a.a), evA);
    stepTo(a, MODES[mode].capTicks, evA);
    // B: tick by tick — the moves of each tick, then that tick
    const b = createRun({ seed, mode }), evB = [];
    let i = 0;
    for (let t = 0; t <= end + 3; t++) { while (i < log.length && log[i].t === t) { turn(b, t, angDiff(log[i].a, b.a), evB); i++; } stepTo(b, t, evB); }
    // C: in uneven jumps
    const c = createRun({ seed, mode }), evC = [];
    i = 0;
    for (let t = 0; t <= end + 40; t += 1 + ((t * 7 + n) % 23)) { while (i < log.length && log[i].t <= t) { turn(c, log[i].t, angDiff(log[i].a, c.a), evC); i++; } stepTo(c, t, evC); }
    stepTo(c, MODES[mode].capTicks, evC);
    assert.deepEqual(strip(a), strip(src), `${seed}: the same run again`);
    assert.deepEqual(strip(b), strip(src), `${seed}: tick by tick`);
    assert.deepEqual(strip(c), strip(src), `${seed}: in jumps`);
    assert.deepEqual(evB, evA); assert.deepEqual(evC, evA);
    assert.deepEqual(resultOf(a), resultOf(src));
  }
});

test('THE EVENTS (for a view): each with its tick; a landing\'s own events together, in order — land → bounce | out | (shatter →) fall → blaze → area → dark → made', () => {
  const run = createRun({ seed: 'ev', mode: 'match' }), ev = [];
  // (a dive that goes for a gap — except with THE BLAZE lit: then for solid ground, to see it shatter)
  while (!isOver(run)) { if (!(run.blaze && aim(run, SAFE, ev))) aim(run, GAP, ev); land(run, ev); }
  assert.equal(run.st, 'made');
  const kinds = new Set(ev.map(e => e.e));
  for (const k of ['land', 'fall', 'blaze', 'shatter', 'area', 'dark', 'made']) assert.ok(kinds.has(k), `a ${k} event`);
  let last = -1;
  for (const e of ev) { assert.ok(Number.isInteger(e.t) && e.t >= last); last = e.t; }
  // group by landing
  const order = ['land', 'shatter', 'fall', 'blaze', 'area', 'dark', 'made'];
  for (let i = 0; i < ev.length;) {
    assert.equal(ev[i].e, 'land');
    let j = i + 1, at = 0;
    while (j < ev.length && ev[j].e !== 'land') { const k = order.indexOf(ev[j].e); assert.ok(k > at, `${names(ev.slice(i, j + 1))}`); at = k; assert.equal(ev[j].t, ev[i].t); j++; }
    i = j;
  }
  for (const e of ev) {
    if (e.e === 'land') assert.deepEqual(Object.keys(e), ['e', 'floor', 'slice', 'kind', 't', 'a']);   // (FIX C: + the tower's angle)
    if (e.e === 'fall') assert.deepEqual(Object.keys(e), ['e', 'floor', 'clean', 't']);
    if (e.e === 'shatter') assert.deepEqual(Object.keys(e), ['e', 'floor', 'slice', 'red', 't']);
    if (e.e === 'area') assert.deepEqual(Object.keys(e), ['e', 'id', 'floor', 't']);
    if (e.e === 'dark' || e.e === 'blaze') assert.deepEqual(Object.keys(e), ['e', 'floor', 't']);
  }
  // 200 floors without a bounce: three clean ones light the blaze, the 4th shatters — 50 times
  assert.equal(ev.filter(e => e.e === 'fall').length, 200);
  assert.equal(ev.filter(e => e.e === 'blaze').length, run.blazes);
  assert.deepEqual([run.blazes, run.shatters, ev.filter(e => e.e === 'shatter').length, run.bounces, run.maxNb], [50, 50, 50, 0, 200]);
  // no `ev` given: the same run, nothing collected
  const quiet = createRun({ seed: 'ev', mode: 'match' });
  while (!isOver(quiet)) { if (!(quiet.blaze && aim(quiet, SAFE))) aim(quiet, GAP); land(quiet); }
  assert.deepEqual(resultOf(quiet), resultOf(run));
});

test('THE RESULT + THE FEATS + THE AREAS + THE RANKING + THE WORDS + THE SEED', () => {
  const run = createRun({ seed: 'res', mode: 'solo' });
  assert.deepEqual(resultOf(run), { rules: 'classic', floor: 0, tick: 0, end: -1, over: false, cause: '', made: false, bounces: 0, shatters: 0, blazes: 0, bestRun: 0, moves: 0, feats: { reachedHarbor: false, terminal: false, reachedBottom: false } });
  assert.equal(endWords(resultOf(run)), '');
  dive(run, 119); assert.equal(resultOf(run).feats.reachedHarbor, false);
  dive(run, 1); assert.deepEqual(resultOf(run).feats, { reachedHarbor: true, terminal: true, reachedBottom: false });
  assert.equal(featsOf(resultOf(run)), 'reachedHarbor terminal'); assert.equal(featsOf({}), ''); assert.equal(featsOf(null), '');
  assert.deepEqual(FEAT_NAMES, { reachedHarbor: 'SPLASHDOWN', terminal: 'TERMINAL VELOCITY', reachedBottom: 'ROCK BOTTOM' });
  assert.deepEqual(END_WORDS, { red: 'HIT THE RED', dark: 'THE LIGHTS WENT OUT', made: 'YOU HIT THE BOTTOM', cap: 'TIME’S UP' });
  // THE AREAS
  assert.deepEqual([0, 39, 40, 79, 80, 119, 120, 159, 160, 199, 200, 201, 240, 241, 281].map(f => areaOf(f).id), ['rooftop', 'rooftop', 'offices', 'offices', 'speakeasy', 'speakeasy', 'harbor', 'harbor', 'deep', 'deep', 'bottom', 'trench', 'trench', 'trench', 'trench']);
  assert.deepEqual([areaOf(201).lap, areaOf(240).lap, areaOf(241).lap, areaOf(281).lap, areaOf(199).lap], [1, 1, 2, 3, 0]);
  assert.deepEqual(areaOf(130), { id: 'harbor', name: 'UNDER THE HARBOR', from: 120, index: 3, lap: 0 });
  assert.equal(areaIndex(-5), 0);
  // THE RANKING (F5C — THE TIE-BREAK): floors → the earlier tick that floor was reached → more blazes → a draw (a shared place)
  assert.ok(rankCompare({ floor: 50, tick: 900 }, { floor: 49, tick: 100 }) < 0);
  assert.ok(rankCompare({ floor: 50, tick: 900 }, { floor: 50, tick: 901 }) < 0);
  assert.ok(rankCompare({ floor: 50, tick: 900, blazes: 0 }, { floor: 50, tick: 901, blazes: 9 }) < 0, 'the earlier tick beats more blazes');
  assert.ok(rankCompare({ floor: 50, tick: 900, blazes: 3 }, { floor: 50, tick: 900, blazes: 2 }) < 0, 'the same tick: more blazes');
  assert.equal(rankCompare({ floor: 50, tick: 900 }, { floor: 50, tick: 900 }), 0);
  assert.equal(rankCompare({ floor: 50, tick: 900, blazes: 2 }, { floor: 50, tick: 900, blazes: 2 }), 0);
  assert.deepEqual(standings([{ uid: 'c', floor: 200, tick: 9100 }, { uid: 'a', floor: 200, tick: 9000 }, { uid: 'b', floor: 120, tick: 4000 }, { uid: 'd', floor: 120, tick: 4000 }, { uid: 'e' }]),
    [{ uid: 'a', rank: 1, floor: 200, tick: 9000, blazes: 0 }, { uid: 'c', rank: 2, floor: 200, tick: 9100, blazes: 0 }, { uid: 'b', rank: 3, floor: 120, tick: 4000, blazes: 0 }, { uid: 'd', rank: 3, floor: 120, tick: 4000, blazes: 0 }, { uid: 'e', rank: 5, floor: 0, tick: 0, blazes: 0 }]);
  assert.deepEqual(standings([{ uid: 'b', floor: 120, tick: 4000, blazes: 1 }, { uid: 'd', floor: 120, tick: 4000, blazes: 4 }, { uid: 'f', floor: 120, tick: 4000, blazes: 1 }]).map(r => `${r.uid}${r.rank}`), ['d1', 'b2', 'f2'], 'more blazes takes the place; still equal = a draw');
  assert.deepEqual(gameStandings({ participants: { u1: true, u2: true }, results: { u1: { f: 30, t: 700, bl: 1 }, u2: { f: 30, t: 700, bl: 2 } } }).map(r => `${r.uid}${r.rank}`), ['u21', 'u12'], 'the game rows carry their blazes (bl)');
  assert.deepEqual(standings(null), []);
  // THE SEED: picked after GO — a pure hash of (code, match, the server's GO time)
  const s = seedOf('HUSH', 'm1', 1763000000000);
  assert.match(s, /^f[0-9a-z]{2,14}$/); assert.ok(s.length <= SEED_MAX);
  assert.equal(s, seedOf('HUSH', 'm1', 1763000000000)); assert.notEqual(s, seedOf('HUSH', 'm1', 1763000000001)); assert.notEqual(s, seedOf('HUSH', 'm2', 1763000000000)); assert.notEqual(s, seedOf('HUSJ', 'm1', 1763000000000));
});

test('THE PACKED LOG: tick gaps + the tower\'s turns in base 36 — CANONICAL (packLog(unpackLog(s)) === s, nothing else unpacks), an over-long string refused UNREAD', () => {
  const log = [{ t: 11, a: 99 }, { t: 12, a: 155 }, { t: 13, a: 152 }, { t: 23, a: 117 }];
  assert.equal(packLog(log), '.c+2r+1k-3.a-z');
  assert.deepEqual(unpackLog('.c+2r+1k-3.a-z'), log);
  assert.equal(packLog([]), ''); assert.deepEqual(unpackLog(''), []);
  assert.equal(packLog([{ t: 0, a: 1 }]), '+1', 'tick 0 is one tick after the log\'s start (−1): no gap written');
  assert.equal(packLog([{ t: 0, a: 4095 }, { t: 1, a: 2047 }]), '-1-1kw', 'half a turn is written the "-" way');
  assert.deepEqual(unpackLog('-1-1kw'), [{ t: 0, a: 4095 }, { t: 1, a: 2047 }]);
  // every bot log round-trips, and is small
  let chars = 0, entries = 0;
  for (const id of BOT_IDS) for (let i = 0; i < 6; i++) {
    const seed = `pk-${id}-${i}`, run = createRun({ seed, mode: 'match' });
    playBot(run, makeBot(id, seed));
    const l = logOf(run), s = packRun(run);
    assert.equal(s, packLog(l)); assert.deepEqual(unpackLog(s), l); assert.equal(packLog(unpackLog(s)), s);
    assert.match(s, /^[0-9a-z.+-]*$/);
    chars += s.length; entries += l.length;
  }
  assert.ok(chars / entries < 4.5, `${(chars / entries).toFixed(2)} characters an entry`);
  // NOT CANONICAL / NOT A LOG: refused
  for (const bad of ['.1+5', '.0+5', '.01+5', '+0', '-0', '+05', '+', '-', '.c', '.c+', 'c+5', '+5.', '+5..2+5', '+5,+5', '+5 +5', ' +5', '+5\n', '+1kw', '+1kx', '-1kx', '+zzzz', '.zzzzzz+1', '.10000+1', '.zzzzz+1', '+A', '+5+-5', '+1E3', '+1_3', null, undefined, 5, {}, [], ['+5'], true]) {
    assert.equal(unpackLog(bad), null, `${JSON.stringify(bad)} is not a packed log`);
  }
  // REFUSED UNREAD: longer than any log packs to (9 characters an entry × the longest log) — and a caller's own bound
  const huge = '+1'.repeat(600000);
  assert.equal(huge.length > 9 * MAX_LOG, true);
  const t0 = process.hrtime.bigint();
  assert.equal(unpackLog(huge), null);
  assert.ok(Number(process.hrtime.bigint() - t0) < 5e6, 'refused before it is read');
  assert.equal(unpackLog('+1+1+1', 4), null); assert.deepEqual(unpackLog('+1+1', 4), [{ t: 0, a: 1 }, { t: 1, a: 2 }]);
  // a long honest log parses in one pass (no regex over it, no recursion)
  const long = '+1-1'.repeat(50000);
  assert.equal(unpackLog(long).length, 100000);
});

test('THE REVIEW\'s FINDS (F1\'s fresh-eyes reviewer): never a NEGATIVE ZERO in the state or the log · the end\'s words come from their own table only · THE CAP beats the finish at the same tick · the judge scores a run AS IT STANDS (`until`) · the largest log there can be is judged in a blink', () => {
  // −0: a tick of −0 is tick 0 (the log, `mt`, the clock → tick mapping) — and the judge refuses a −0 in a log (one log, one JSON text)
  const z = createRun({ seed: 'z', mode: 'solo' });
  assert.equal(turn(z, -0, 5), 5);
  assert.ok(Object.is(z.lt[0], 0) && Object.is(z.mt, 0), 'tick −0 is logged as tick 0');
  assert.ok(Object.is(tickOf(99.9, 100), 0) && Object.is(tickOf(100, 100), 0) && Object.is(tickOf(-0, 0), 0), 'tickOf never gives a negative zero');
  assert.equal(setAngle(z, 2, 0), -5); assert.ok(Object.is(z.a, 0));
  assert.deepEqual(judgeRun(JSON.parse('{"seed":"z","mode":"solo","log":[{"t":-0,"a":5}]}')), { ok: false, why: 'entry' });
  assert.deepEqual(judgeRun(JSON.parse('{"seed":"z","mode":"solo","log":[{"t":0,"a":5},{"t":3,"a":-0}]}')), { ok: false, why: 'entry' });
  assert.equal(judgeRun(JSON.parse('{"seed":"z","mode":"solo","log":[{"t":0,"a":5},{"t":3,"a":0}]}')).ok, true);
  // the end's words: the table's own keys only
  for (const c of ['constructor', 'toString', '__proto__', 'hasOwnProperty', 'valueOf', '', 5, null, {}, ['red']]) assert.equal(endWords({ cause: c }), '', `endWords of ${JSON.stringify(c)}`);
  assert.equal(endWords({ cause: 'red' }), 'HIT THE RED'); assert.equal(endWords(undefined), '');
  // THE CAP BEATS THE FINISH AT THE SAME TICK (the plan: "whichever first" — at a tie the cap, as everywhere: before anything else that tick)
  const plain = JSON.parse(JSON.stringify(C)); delete plain.reach; delete plain.hop;
  const tie = makeRuleSet({ ...plain, id: 'tie', modes: { ...plain.modes, match: { finish: 1, capTicks: FIRST } } });
  const t = createRun({ seed: 'tie', mode: 'match', rules: tie }), tev = [];
  aim(t, GAP); assert.equal(under(t), GAP);
  stepTo(t, FIRST, tev);
  assert.deepEqual([t.st, t.floor, t.end], ['cap', 0, FIRST], 'the pass that would have finished the run falls on the cap\'s tick: the cap');
  assert.deepEqual(tev, [{ e: 'cap', t: FIRST }]);
  const one = makeRuleSet({ ...plain, id: 'one', modes: { ...plain.modes, match: { finish: 1, capTicks: FIRST + 1 } } });
  const t1 = createRun({ seed: 'tie', mode: 'match', rules: one }); aim(t1, GAP); stepTo(t1, FIRST + 5);
  assert.deepEqual([t1.st, t1.floor, t1.end], ['made', 1, FIRST], 'a tick earlier than the cap: made');
  // THE JUDGE's `until`: the run as it stands at a tick (a match still going) — a whole tick ≥ 0, else refused by name
  const src = createRun({ seed: 'unt', mode: 'match' }); playBot(src, makeBot('great', 'unt'), { maxFloor: 60 }); stepTo(src, MODES.match.capTicks);
  const log = logOf(src), whole = judgeRun({ seed: 'unt', mode: 'match', log });
  assert.equal(whole.ok, true); assert.ok(!('over' in whole), 'a whole run\'s answer has no `over`: it is over');
  let last = 0;
  for (const u of [0, 100, 900, src.end - 1, src.end, src.end + 99]) {
    const v = judgeRun({ seed: 'unt', mode: 'match', log, until: u });
    assert.equal(v.ok, true); assert.equal(v.over, u >= src.end); assert.ok(v.floor >= last && v.tick <= u); last = v.floor;
    const live = createRun({ seed: 'unt', mode: 'match' });
    for (const e of log) { if (e.t > u) break; turn(live, e.t, angDiff(e.a, live.a)); }
    stepTo(live, u);
    assert.deepEqual([v.floor, v.tick, v.end, v.cause], [live.floor, live.at, live.end, resultOf(live).cause], `as of tick ${u}`);
  }
  assert.deepEqual(judgeRun({ seed: 'unt', mode: 'match', log, until: src.end }).floor, whole.floor);
  for (const bad of [NaN, -1, 1.5, '600', {}, [], Infinity, true, -0]) assert.deepEqual(judgeRun({ seed: 'unt', mode: 'match', log, until: bad }), { ok: false, why: 'until' });
  assert.deepEqual(judgeRun({ seed: 'unt', mode: 'match', log: [null], until: 9 }), { ok: false, why: 'entry' }, 'a hostile log is refused by its bounds first — with `until` too');
  // THE LARGEST LOG THERE CAN BE (a move every tick of a 30:00 solo run, 108,000 entries, a dive to the cap) — judged in well under a second
  const big = createRun({ seed: 'big', mode: 'solo' });
  for (let T = 1; T < MODES.solo.capTicks && !isOver(big); T++) {
    // (one unit back and forth every tick — and, in every flight, a gap under the ball: the run never ends before the cap)
    stepTo(big, T - 1);
    if (isOver(big)) break;
    if (T === big.ll + 1 || T === 1) { const s = sliceOfKind(big, GAP), A = angleFor(big, sliceStart(s) + 170); for (let q = T; big.a !== A; q++) turn(big, q, angDiff(A, big.a)); }
    turn(big, T, T % 2 ? 1 : -1);
  }
  stepTo(big, MODES.solo.capTicks);
  const bl = logOf(big);
  assert.equal(big.st, 'cap'); assert.ok(bl.length > 100000 && big.floor > 5000, `${bl.length} entries, floor ${big.floor}`);
  const t0 = process.hrtime.bigint(), bv = judgeRun({ seed: 'big', mode: 'solo', log: bl }), ms = Number(process.hrtime.bigint() - t0) / 1e6;
  assert.deepEqual([bv.ok, bv.floor, bv.cause, bv.moves], [true, big.floor, 'cap', bl.length]);
  assert.ok(ms < 1000, `judged in ${ms.toFixed(0)} ms`);
  assert.deepEqual(unpackLog(packRun(big)), bl);
});

test('THE RULES NEVER READ A CLOCK OR A DICE — AND ARE INTEGERS ONLY: no Date / Math.random / performance / frame clock / float math in the rules\' files; the run\'s whole state is whole numbers', () => {
  for (const f of ['tuning.js', 'tower-gen.js', 'engine.js', 'logic.js', 'replay.js']) {
    const s = code(`js/games/freefall/${f}`);
    assert.doesNotMatch(s, /Date\b|Math\.random|performance\.|requestAnimationFrame|setTimeout|setInterval/, `${f}: no clock, no dice`);
    assert.doesNotMatch(s, /Math\.(sin|cos|tan|pow|sqrt|exp|log|hypot|atan2?|cbrt|fround|trunc|ceil)\b|parseFloat|toFixed/, `${f}: no float math`);
    assert.doesNotMatch(s, /document\.|window\.|navigator\.|from 'three'|localStorage|fetch\(/, `${f}: no DOM, no three.js, no network`);
  }
  for (const f of ['tuning.js', 'tower-gen.js', 'engine.js']) {
    const s = code(`js/games/freefall/${f}`);
    assert.deepEqual([...new Set([...s.matchAll(/Math\.(\w+)/g)].map(m => m[1]))].sort().filter(m => !['floor', 'imul'].includes(m)), [], `${f}: Math.floor + Math.imul only`);
    assert.doesNotMatch(s, /\d\.\d/, `${f}: no decimal number`);
  }
  // every division in the rules is floored (the rules' three files: each "/" sits inside a Math.floor( … ))
  for (const f of ['tower-gen.js', 'engine.js']) {
    const s = code(`js/games/freefall/${f}`).replace(/'[^'\n]*'|`[^`\n]*`/g, "''");
    for (const m of s.matchAll(/[^\n]*[\w)\]] \/ [\w(][^\n]*/g)) assert.match(m[0], /Math\.floor\([^\n]* \/ |TURN \/ 2/, `${f}: a division outside Math.floor — ${m[0].trim().slice(0, 90)}`);
  }
  assert.match(code('js/games/freefall/logic.js'), /export const tickOf = \(ms, t0\) => Math\.round\(\(ms - t0\) \* TICK_HZ \/ 1000\) \+ 0;/, 'the ONE clock → tick mapping (the view\'s side of the rules): the nearest tick');
  assert.deepEqual([...code('js/games/freefall/engine.js').matchAll(/^import [^\n]* from '([^']+)';$/gm)].map(m => m[1]), ['./tuning.js', './tower-gen.js', './logic.js']);
  assert.deepEqual([...code('js/games/freefall/tower-gen.js').matchAll(/^import [^\n]* from '([^']+)';$/gm)].map(m => m[1]), ['../../core/rng.js', './tuning.js'], 'the one import outside the folder: the integer hash');
  assert.deepEqual([...code('js/games/freefall/tuning.js').matchAll(/^import /gm)], [], 'tuning.js imports nothing');
  assert.doesNotMatch(code('js/games/freefall/bot.js'), /Math\.random|Date\b/, 'the bots have their own seeded rng');
  // the state: integers (and a few words / flags) — after long bot runs
  for (const id of BOT_IDS) {
    const run = createRun({ seed: `int-${id}`, mode: 'solo' });
    playBot(run, makeBot(id, `int-${id}`), { maxFloor: 260 });
    for (const [k, v] of Object.entries(run)) {
      if (typeof v === 'number') assert.ok(Number.isSafeInteger(v) && !Object.is(v, -0), `run.${k} = ${v}`);
    }
    for (const v of [...run.lt, ...run.la]) {
      if (Object.is(v, -0)) assert.fail('a negative zero in the log');
    }
    for (const v of [...run.lt, ...run.la, run.cur.twist, run.cur.gap, run.cur.red]) assert.ok(Number.isSafeInteger(v) && v >= 0);
    assert.ok(run.la.every(a => a < TURN));
    for (let i = 1; i < run.lt.length; i++) assert.ok(run.lt[i] > run.lt[i - 1]);
  }
  assert.deepEqual(Object.keys(BOTS), ['sloppy', 'good', 'great', 'human']);
});

// ======================================================================================================================================
// F2 — THE RULES FIXES (docs/freefall.md "THE RULES — F2"; the owner's decisions: docs/games/plan.md "FREEFALL — F2")
// ======================================================================================================================================

/** a run brought to a lit BLAZE on a floor that has a RED slice, the blaze carried from gap to gap until then */
function blazeOverRed(seed, mode = 'solo', rules = undefined) {
  const run = createRun({ seed, mode, rules });
  while (run.floor < 12) floorDown(run);
  dive(run, 3); assert.ok(run.blaze);
  let guard = 0;
  // (a floor with red on it AND red on the next: the shatter drops the ball onto red)
  for (;;) {
    assert.ok(guard++ < 200 && !isOver(run));
    const nxt = floorAt(run.h, run.floor + 1, run.R);
    if (sliceOfKind(run, SAFE) >= 0 && nxt.red) break;
    dive(run, 1); assert.ok(run.blaze, 'carried from gap to gap');
  }
  return run;
}

test('F2 — THE LANDING RIGHT AFTER A SHATTER IS NEVER AN OUT (the owner\'s rule b): red there = a BOUNCE (`bounce.red`), the clean count resets as for any bounce; the NEXT landing on red is out again; a what-if row without the rule plays F1\'s game', () => {
  assert.equal(C.shatterSafe, true);
  let tried = 0;
  for (let k = 0; k < 12; k++) {
    const run = blazeOverRed(`sh${k}`), ev = [];
    aim(run, SAFE, ev); const Ls = land(run, ev);                    // THE BLAZE shatters a slice …
    assert.equal(ev.filter(e => e.e === 'shatter').length, 1);
    assert.deepEqual([run.sh, run.blaze, run.clean, run.fl], [true, false, 0, 'fall'], 'the next landing is the one right after a shatter');
    if (!aim(run, RED, ev)) continue;                                // … and the ball comes down ON RED
    tried++;
    ev.length = 0;
    const f = run.floor, b0 = run.bounces, nb0 = run.maxNb, L = land(run, ev);
    assert.equal(L, Ls + FALL);
    assert.deepEqual([run.st, run.floor, run.fl, run.nl, run.clean, run.nb, run.bounces, run.saves, run.sh], ['live', f, 'bounce', L + BOUNCE, 0, 0, b0 + 1, 1, false], 'a bounce — the floor is NOT passed, the counts reset');
    assert.equal(run.maxNb, nb0);
    assert.deepEqual(ev.map(e => e.e), ['land', 'bounce']);
    assert.deepEqual(ev[0], { e: 'land', floor: f, slice: ev[0].slice, kind: RED, t: L, a: run.a });
    assert.deepEqual(ev[1], { e: 'bounce', floor: f, slice: ev[0].slice, red: true, t: L }, 'the view\'s cue: a red flash + the slice cracks');
    // the tower did not move: the NEXT landing is on the same red slice — and that one is out
    const L2 = land(run, ev);
    assert.deepEqual([run.st, run.cause, run.end, L2], ['out', 'red', L + BOUNCE, L + BOUNCE], 'only the landing RIGHT after the shatter is spared');
    // live == the judge
    const v = judgeRun({ seed: `sh${k}`, mode: 'solo', log: logOf(run) });
    assert.deepEqual([v.ok, v.floor, v.cause, v.end], [true, f, 'red', L2]);
  }
  assert.ok(tried >= 6, `${tried} shatter-landings on red tried`);
  // a plain bounce's event keeps F1's shape (no `red` key)
  const p = createRun({ seed: 'plain' }), pe = [];
  land(p, pe); assert.deepEqual(Object.keys(pe.find(e => e.e === 'bounce')), ['e', 'floor', 'slice', 't']);
  // a landing on SAFE or a GAP right after a shatter: nothing special (the flag is spent)
  const g = blazeOverRed('sh-gap'); aim(g, SAFE); land(g); assert.ok(g.sh);
  if (aim(g, GAP)) { land(g); assert.deepEqual([g.sh, g.clean, g.saves], [false, 1, 0]); }
  // THE RULE IS THE ROW's: a what-if row without it = F1 (the landing after a shatter on red is out)
  const plain = JSON.parse(JSON.stringify(C)); delete plain.reach; delete plain.hop;
  const f1 = makeRuleSet({ ...plain, id: 'f1', shatterSafe: false });
  let outs = 0;
  for (let k = 0; k < 12; k++) {
    const run = blazeOverRed(`sh${k}`, 'solo', f1);
    aim(run, SAFE); land(run);
    if (!aim(run, RED)) continue;
    land(run); assert.deepEqual([run.st, run.cause, run.saves], ['out', 'red', 0]); outs++;
  }
  assert.ok(outs >= 6);
});

test('F2 — MOVING RED in the engine (THE TRENCH, solo): a landing reads the slice AT ITS OWN TICK — on the mover\'s slice then = OUT, on the same slice when the mover has walked on = a bounce; the blaze shatters it like any red; above floor 201 nothing moves', () => {
  // a seed's first trench floor with a mover
  const seed = 'mover', run = createRun({ seed, mode: 'solo' });
  dive(run, 200);
  aim(run, SAFE); land(run);   // (THE BLAZE is lit after the dive: spent on a shatter — floor 201 from here on, bounce by bounce)
  assert.deepEqual([run.floor, run.blaze], [201, false]);
  let guard = 0;
  while (!floorNow(run).m1) { assert.ok(guard++ < 30); floorDown(run); }
  const f = run.floor, fl = floorNow(run), R = run.R;
  assert.ok(f >= 201 && fl.m1);
  // rest on a SAFE slice (the hand reads the kinds at the landing's tick)
  aim(run, SAFE); land(run); assert.deepEqual([run.fl, run.floor], ['bounce', f]);
  // ON THE MOVER at the landing's tick → out
  const a = { ...run, lt: run.lt.slice(), la: run.la.slice(), ht: run.ht.slice(), cur: { ...run.cur } };
  const at = moversAt(fl, a.nl, R); assert.ok(at);
  const s = 31 - Math.clz32(at);
  assert.equal(kindAt(fl, s), SAFE, 'the static layout calls that slice safe'); assert.equal(kindAtTick(fl, s, a.nl, R), RED, '… at that tick it is red');
  steerTo(a, sliceStart(s) + 170); const ev = []; const L = land(a, ev);
  assert.deepEqual([a.st, a.cause, a.end], ['out', 'red', L]);
  assert.deepEqual(ev[0], { e: 'land', floor: f, slice: s, kind: RED, t: L, a: a.a });
  // THE SAME SLICE when the mover stands elsewhere → a bounce
  const b = { ...run, lt: run.lt.slice(), la: run.la.slice(), ht: run.ht.slice(), cur: { ...run.cur } };
  let hops = 0;
  while ((moversAt(fl, b.nl, R) >> s) & 1) { assert.ok(hops++ < 12); aim(b, SAFE); land(b); assert.equal(b.st, 'live'); }
  steerTo(b, sliceStart(s) + 170); land(b);
  assert.deepEqual([b.st, b.fl, b.floor], ['live', 'bounce', f], 'the mover has walked on: the slice is safe ground');
  // live == the judge, on both
  for (const r of [a, b]) { const cut = logOf(r); assert.equal(judgeRun({ seed, mode: 'solo', log: cut, until: r.t }).floor, f); }
  // above THE TRENCH the kind at a tick is the static kind, at any tick
  const h = seedHash(seed);
  for (let i = 0; i <= 200; i += 7) { const x = floorAt(h, i); for (let q = 0; q < SLICES; q++) for (const t of [0, 77, 5000]) assert.equal(kindAtTick(x, q, t, R), kindAt(x, q)); }
});

test('THE HOLD = EXACT RESUME (F3 — the owner, Nov 26; SOLO only: 3 a run; a match + the daily never hold): a LOGGED event { k: "hold", t } — everything up to AND AT its tick happens, then THE WHOLE STATE IS FROZEN and resumed unchanged: the flight, the tower, the darkness; a hold never cancels or restarts a landing', () => {
  assert.deepEqual([MODES.solo.holds, MODES.match.holds, MODES.daily.holds], [3, 0, 0]);
  // IN A BOUNCE: nothing of the flight moves
  const run = runAt(20, { seed: 'hold' });
  const L = run.pl, nl = run.nl, dn = run.dn, dk = run.dk, a = run.a, floor = run.floor, at = run.at;
  assert.equal(nl, L + BOUNCE);
  const T = L + 10, ev = [];
  assert.equal(hold(run, T, ev), true);
  assert.deepEqual([run.holds, run.ht, run.fl, run.pl, run.nl, run.dn, run.dk, run.a, run.t, run.mt], [1, [T], 'bounce', L, nl, dn, dk, a, T, T + 1], 'the bounce goes on from where it was: its start, its landing, the darkness — unchanged');
  assert.deepEqual([run.floor, run.at, run.st], [floor, at, 'live'], 'nothing already decided changes');
  assert.deepEqual(ev, [{ e: 'hold', t: T }]);
  assert.deepEqual(resultOf(run).holds, 1);
  assert.equal('holds' in resultOf(createRun({ seed: 'x' })), false, 'a run never held keeps F1\'s result shape');
  // a move after the hold counts at T + 1 at the earliest (no input counts while the run is held; the log's order: a hold, then the moves after it)
  assert.equal(turn(run, T, 5), 5); assert.equal(run.mt, T + 1);
  assert.deepEqual(logOf(run).slice(-2), [{ k: 'hold', t: T }, { t: T + 1, a: run.a }]);
  // IN A FALL: the same — the ball comes back to the SAME point of its fall
  aim(run, GAP); const Lg = land(run); assert.equal(run.fl, 'fall');
  assert.equal(hold(run, Lg + 4), true);
  assert.deepEqual([run.nl, run.pl, run.holds], [Lg + FALL, Lg, 2]);
  // REFUSED: a tick the run was already stepped to · not a tick · the run over · no hold left
  assert.equal(hold(run, run.t), false, 'a tick already stepped to'); assert.equal(hold(run, run.t - 3), false);
  for (const bad of [-1, 1.5, NaN, Infinity, '5', null, undefined, -0 - 1]) assert.equal(hold(run, bad), false);
  assert.equal(hold(run, run.t + 1), true); assert.equal(run.holds, 3);
  assert.equal(hold(run, run.t + 1), false, 'the 4th hold is refused'); assert.equal(run.holds, 3);
  const dead = createRun({ seed: 'hold-dead' }); stepTo(dead, 5000); assert.ok(isOver(dead)); assert.equal(hold(dead, 6000), false);
  // a landing due BEFORE the hold's tick happens — and the flight it started goes on from ITS start
  const late = runAt(5, { seed: 'hold' }), due = late.nl, bounces = late.bounces;
  assert.equal(hold(late, due + 3), true);
  assert.deepEqual([late.bounces, late.pl, late.nl], [bounces + 1, due, due + BOUNCE], 'the landing before the hold\'s tick happened; its bounce is 3 ticks old');
  // a hold AT a landing's own tick: THE LANDING LANDS (F2 held it away — the free dodge), then the run is held
  const edge = runAt(5, { seed: 'hold' }), e0 = edge.nl, eb = edge.bounces, evE = [];
  assert.equal(hold(edge, e0, evE), true);
  assert.deepEqual([edge.bounces, edge.pl, edge.nl], [eb + 1, e0, e0 + BOUNCE]);
  assert.equal(names(evE), 'land bounce hold', 'the landing\'s events, then the hold');
  // … and a move after it never reaches back to that landing
  assert.equal(turn(edge, e0, 9), 9); assert.equal(edge.mt, e0 + 1);
  // THE CAP + THE MODES: a match never holds, a hold at / past the cap is refused
  for (const mode of ['match', 'daily']) { const m = runAt(3, { seed: 'hold', mode }); assert.equal(hold(m, m.t + 2), false, `${mode}: no hold`); assert.equal(m.holds, 0); }
  assert.equal(hold(createRun({ seed: 'hold-cap' }), MODES.solo.capTicks), false, 'at the cap');
  // THE DARKNESS: a hold gives NOTHING back — a staller with three holds is out at the very tick of one with none
  const st = createRun({ seed: 'hold-stall' });
  for (const t of [100, 300, 500]) assert.equal(hold(st, t), true);
  stepTo(st, 5000); assert.deepEqual([st.st, st.cause, st.end], ['out', 'dark', DARK.grace + DARK.lead * DARK.pace]);
});

test('THE HOLD = EXACT RESUME: a hold ONE TICK BEFORE a red landing STILL ENDS ON RED (and at its tick, and ten ticks before) — at the SAME tick as the run never held; a hold whose own tick ends the run is refused and leaves no entry', () => {
  const seed = 'hold-red', f = floorWith(seed, RED, 12);
  assert.ok(f > 0);
  const toRed = () => { const r = runAt(f, { seed }); assert.ok(aim(r, RED)); assert.equal(under(r), RED); return r; };
  const plain = toRed(), N = plain.nl;
  stepTo(plain, N + 5);
  assert.deepEqual([plain.st, plain.cause, plain.end], ['out', 'red', N]);
  for (const before of [1, 2, 10]) {
    const r = toRed();
    if (N - before <= r.t) continue;   // (the steer took the ticks: nothing to hold there)
    assert.equal(hold(r, N - before), true, `held ${before} tick(s) before the red landing`);
    assert.equal(r.nl, N, 'the landing is still due at its tick');
    stepTo(r, N + 5);
    assert.deepEqual([r.st, r.cause, r.end, r.floor], ['out', 'red', N, plain.floor], `a hold ${before} tick(s) before: still out on red, at the same tick`);
    const v = judgeRun({ seed, mode: 'solo', log: logOf(r) });
    assert.deepEqual([v.ok, v.cause, v.end, v.holds], [true, 'red', N, 1]);
  }
  // the hold AT the red landing's tick: the landing lands (out) — the hold is refused, nothing is logged
  const r = toRed(), n = logOf(r).length, ev = [];
  assert.equal(hold(r, N, ev), false);
  assert.deepEqual([r.st, r.cause, r.end, r.holds, logOf(r).length], ['out', 'red', N, 0, n]);
  assert.equal(names(ev), 'land out');
  // the first move after GO counts: a hold one tick before, then a turn at the landing's tick that takes the ball off the red — a move like any other
  const out = toRed();
  assert.equal(hold(out, N - 1), true);
  assert.equal(turn(out, N - 1, 171), 171, 'a move at the hold\'s own tick, after it …'); assert.equal(out.mt, N, '… counts at the next tick — the landing\'s: before the landing reads the tower');
  const k = under(out);
  stepTo(out, N);
  assert.equal(out.st, k === RED ? 'out' : 'live', 'the landing reads the tower as that move left it — a move like any other');
  assert.equal(judgeRun({ seed, mode: 'solo', log: logOf(out), until: N }).ok, true);
});

test('THE HOLD = EXACT RESUME: REPLAY = LIVE with holds at random ticks (300 sessions — moves before, at and after a hold) AND THE SAME RUN WITH ITS HOLDS TAKEN OUT replays to the same result, event for event; the judge\'s refusals by name (too many holds · ticks not rising · entry · hold · past the cap), the packed log with holds — canonical', () => {
  const rnd = (() => { let x = hashString('hold-fuzz') || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; })();
  let held = 0, saves = 0;
  for (let k = 0; k < 300; k++) {
    const seed = `hf${k}`, run = createRun({ seed, mode: 'solo' }), bot = makeBot(k % 2 ? 'good' : 'great', seed), live = [];
    const stops = [Math.floor(rnd() * 600), 600 + Math.floor(rnd() * 900), 1500 + Math.floor(rnd() * 2000), 4000 + Math.floor(rnd() * 2000)].map(t => t + 1);
    // the bot plays flight by flight; at each stop the page holds the run (as play.js does: step to now, then hold at the next free tick)
    while (!isOver(run) && run.floor < 150) {
      if (stops.length && run.t >= stops[0]) {
        stops.shift();
        const T = Math.max(run.t + 1, run.mt);
        const ok = hold(run, T, live);
        assert.equal(ok, run.holds <= 3 && live[live.length - 1].e === 'hold' && live[live.length - 1].t === T, 'three holds, the fourth refused');
        if (ok) held++;
        if (rnd() < 0.5 && !isOver(run)) turn(run, T, Math.floor(rnd() * 300) - 150, live);   // (a finger that moves the instant the run goes on)
        continue;
      }
      const N = run.nl, pl = planFlightOf(run, bot), spin = bot.P.spin;
      let rest = pl.d;
      for (let t = run.t + 1 + pl.wait; t <= N && rest !== 0 && !isOver(run); t++) { const step = rest > spin ? spin : rest < -spin ? -spin : rest; turn(run, t, -step, live); rest -= step; }
      stepTo(run, N, live);
    }
    stepTo(run, MODES.solo.capTicks, live);
    saves += run.saves;
    const log = logOf(run), evR = [], r = replay({ seed, mode: 'solo', log, ev: evR });
    assert.equal(r.bad, -1, `${seed}: ${r.why}`); assert.equal(r.used, log.length);
    const { used, bad, why, ...res } = r;
    assert.deepEqual(res, resultOf(run), `${seed}: the replay's result`);
    assert.deepEqual(evR, live, `${seed}: event for event`);
    assert.equal(log.filter(isHold).length, run.holds);
    // THE HOLDS TAKEN OUT: the same moves replay to the same run — a hold changed nothing (only its own events + the count are gone)
    const bare = log.filter(e => !isHold(e)), evB = [], rb = replay({ seed, mode: 'solo', log: bare, ev: evB });
    assert.equal(rb.bad, -1, `${seed}: without its holds — ${rb.why}`);
    { const { used: u2, bad: b2, why: w2, ...resB } = rb, want = { ...resultOf(run) }; delete want.holds; assert.deepEqual(resB, want, `${seed}: the run without its holds is the same run`); }
    assert.deepEqual(evB, live.filter(e => e.e !== 'hold'), `${seed}: … event for event`);
    const v = judgeRun({ seed, mode: 'solo', log });
    assert.equal(v.ok, true, `${seed}: ${v.why}`); assert.equal(v.holds || 0, run.holds);
    // packed: canonical, both ways
    const packed = packRun(run);
    assert.equal(packed, packLog(log)); assert.deepEqual(unpackLog(packed), log); assert.equal(packLog(unpackLog(packed)), packed);
    assert.equal((packed.match(/!/g) || []).length, run.holds);
  }
  assert.ok(held > 500, `${held} holds played`); assert.ok(saves > 5, `${saves} shatter-landings saved on the way`);
  // ---- the judge's refusals
  const why = (log, mode = 'solo') => { const v = judgeRun({ seed: 'hj', mode, log }); assert.equal(v.ok, false, JSON.stringify(v).slice(0, 100)); return v.why; };
  const H = t => ({ k: 'hold', t });
  assert.equal(judgeRun({ seed: 'hj', mode: 'solo', log: [H(5), H(9), H(40)] }).holds, 3);
  assert.equal(why([H(5), H(9), H(40), H(41)]), 'too many holds');
  assert.equal(why([H(5)], 'match'), 'too many holds', 'a match never holds'); assert.equal(why([H(5)], 'daily'), 'too many holds');
  assert.equal(why([H(9), H(9)]), 'ticks not rising'); assert.equal(why([H(9), H(5)]), 'ticks not rising');
  assert.equal(why([{ t: 10, a: 5 }, H(9)]), 'ticks not rising', 'a hold before the move before it');
  assert.equal(why([H(9), { t: 9, a: 5 }]), 'ticks not rising', 'a move at a hold\'s own tick comes BEFORE it');
  assert.equal(judgeRun({ seed: 'hj', mode: 'solo', log: [{ t: 9, a: 5 }, H(9), { t: 10, a: 9 }] }).ok, true, 'a move, a hold at its tick, the next move a tick later');
  for (const e of [{ k: 'hold', t: 5, a: 3 }, { k: 'hold', t: 5, x: 1 }, Object.assign(Object.create({ k: 'hold' }), { t: 5 }), { k: 'hold' }, { k: 'hold', t: -1 }, { k: 'hold', t: 1.5 }, { k: 'hold', t: '5' }, { k: 'hold', t: -0 }, { k: 'hold', t: 2 ** 53 }]) assert.equal(why([e]), 'entry', JSON.stringify(e));
  assert.equal(why([H(MODES.solo.capTicks)]), 'past the cap');
  assert.equal(why([H(0)]), 'hold', 'tick 0 is the tick the run stands at: nothing to hold yet');
  assert.equal(why([H(30000)]), 'past the end', 'a hold after the lights went out');
  assert.equal(maxEntries('solo'), MAX_LOG + 3); assert.equal(maxEntries('match'), MODES.match.capTicks);
  assert.equal(logProblem([H(5)], 'solo'), null); assert.equal(isHold(H(1)), true); assert.equal(isHold({ t: 1, a: 2 }), false); assert.equal(isHold(null), false);
  // ---- the packed form: '!' + the ticks since the event before ("0" = at the tick of the move before it)
  assert.equal(packLog([{ t: 11, a: 99 }, H(11), { t: 12, a: 100 }, H(20), H(21)]), '.c+2r!0+1!8!1');
  assert.deepEqual(unpackLog('.c+2r!0+1!8!1'), [{ t: 11, a: 99 }, H(11), { t: 12, a: 100 }, H(20), H(21)]);
  assert.equal(packLog([H(0)]), '!1'); assert.deepEqual(unpackLog('!1'), [H(0)]);
  for (const bad of ['!0', '!', '!01', '!1!0', '+5!00', '!-1', '!.2', '+5!0!0', '!zzzzz', '+5!']) assert.equal(unpackLog(bad), null, bad);
});
