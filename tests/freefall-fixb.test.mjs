// FREEFALL — THE FIX PASS, PART B (docs/games/passes/freefall-fixb.md): the PURE halves of THE MATCH + STABILITY — S1 THE RE-SCORE (a
// silent phone's end lands after the podium) · S6 (b) a phone with no on-time GO ends at once · S7 a LOST phone is never the leader, not
// PLAYING, never in LAST ONE STANDING's way · the speed group's static guards (the cartridge never gets the test page's switches).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TICK_HZ } from '../js/games/freefall/tuning.js';
import * as M from '../js/games/freefall/match.js';
import { createGame, nextStep, finalPatch, scoreMatchNode, rescore } from '../js/games/freefall/director.js';
import * as G from '../js/games/freefall/ghosts.js';
import { createSim } from '../js/games/freefall/matchsim.js';
import { liveGoers, GO_WINDOW_MS } from '../js/core/proof.js';

const MS = 1000 / TICK_HZ, GO = 1_800_000_000_000, CODE = 'FALL', MID = 'm1fixb';
const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const parts = n => Object.fromEntries(Array.from({ length: n }, (_, k) => [`bot${k}`, true]));
function roomOf(n, o = {}) {
  const S = M.matchStart(CODE, MID, { a: { go: GO } }), sim = createSim(S.seed, n, o), tree = { t0: GO - 5 };
  sim.runs.forEach((B, k) => {
    const c = {};
    B.chunks.forEach((x, i) => { c[i] = { s: x.s, at: Math.round(S.playAt + x.at * MS) }; });
    tree[B.uid] = { go: GO + k * 40, c, e: B.end.e };
  });
  return { tree, S };
}
const playing = S => ({ ...createGame({ matchId: MID, settings: {}, participants: parts(2), now: GO - 1000, seed: '' }), phase: 'play', playAt: S.playAt, seed: S.seed, g0: S.g0 });

test('S1 A SILENT PHONE: the podium written while a phone was silent is RE-SCORED when its end lands (before the cap\'s grace) — results + the night record (phase final again), the podium\'s moment kept, once', () => {
  const { tree, S } = roomOf(2, { maxFloor: 60 });
  // bot1's phone went silent a third of the way into its run: the host saw a third of its chunks and no end — the 18 s rule wrote the podium
  const early = structuredClone(tree), keys = Object.keys(early.bot1.c).map(Number).sort((a, b) => a - b);
  for (const k of keys.slice(Math.max(1, Math.floor(keys.length / 3)))) delete early.bot1.c[k];
  delete early.bot1.e;
  const g = playing(S), endAt = S.playAt + 60000, fin = finalPatch(g, early, endAt, CODE), gf = { ...g, ...fin };
  assert.deepEqual(gf.ends, { _: 1, bot0: 1 }, 'the podium records whose ends it had (`_`: never an empty object — the database would drop it)');
  assert.equal(nextStep(gf, { now: endAt + 500, live: { runs: early }, code: CODE }), null, 'nothing new: the podium stands');
  // … then the phone is back: its queued chunks + its end land
  const re = nextStep(gf, { now: endAt + 9000, live: { runs: tree }, code: CODE });
  assert.ok(re && re.phase === 'final', 'phase final again — host.js#roomPatch writes the night record again from the new ranks');
  assert.deepEqual(re.results.bot1, scoreMatchNode(gf, tree.bot1), 'bot1 scored from its whole node');
  assert.ok(re.results.bot1.f > gf.results.bot1.f, `the late phone's floors are counted (${gf.results.bot1.f} → ${re.results.bot1.f})`);
  assert.deepEqual(re.results.bot0, gf.results.bot0);
  assert.equal(re.phaseStartAt, undefined); assert.equal(re.endAt, undefined, 'the podium\'s own moment is kept');
  assert.deepEqual([re.ends, re.rescored], [{ _: 1, bot0: 1, bot1: 1 }, 1]);
  assert.equal(nextStep({ ...gf, ...re }, { now: endAt + 9500, live: { runs: tree }, code: CODE }), null, 'once: the judge runs at a landing, never a tick');
  // an end that lands too late (the cap's grace is over) changes nothing
  assert.equal(rescore(gf, tree, M.capAt(gf) + M.END_GRACE_MS, CODE), null);
  // an end that changes no row only marks itself seen (no night record written again)
  const same = structuredClone(tree); delete same.bot1.e;
  const gs = { ...g, ...finalPatch(g, same, endAt, CODE) };
  assert.deepEqual(nextStep(gs, { now: endAt + 1000, live: { runs: tree }, code: CODE }), { ends: { _: 1, bot0: 1, bot1: 1 } });
  // a podium written before this pass (no `ends`), a solo run, an unproven match: never re-scored
  const { ends, ...old } = gf; void ends;
  assert.equal(rescore(old, tree, endAt + 9000, CODE), null);
  assert.equal(rescore({ ...gf, unproven: 1 }, tree, endAt + 9000, CODE), null);
  assert.equal(rescore({ ...gf, mode: 'solo' }, tree, endAt + 9000, CODE), null);
});

test('S1 — the phones: the late phone\'s own podium is scored from the nodes as they stand (scoredNow), a re-score rebuilds every podium (view.js)', () => {
  const v = read('js/games/freefall/view.js');
  assert.match(v, /const lateMine = g => !!outSrv && mine\(g\) && g\.endAt > 0 && outSrv > g\.endAt;/);
  assert.match(v, /const podiumGame = g => \(liveWait\.waited\(\) \|\| lateMine\(g\) \? scoredNow\(g\) : g\);/);
  assert.match(v, /showFinal\(podiumGame\(g\)\); \}\n    \}\n    \/\/ FIX B — S1: THE HOST RE-SCORED/);
  assert.match(v, /else if \(final && g\.phase === 'final' && resKey\(g\) !== finalRes\) \{ final\.destroy\(\);/);
});

test('S6 (b) NO ON-TIME GO = NO RUN: the room stops waiting NO_GO_END_MS after THE FIRST GO\'s window — the same players core/proof.js#liveGoers leaves out', () => {
  const { tree, S } = roomOf(2, { maxFloor: 20 });
  const g = playing(S), tab = undefined, late = { go: S.g0 + GO_WINDOW_MS + 1 };
  const due = S.g0 + GO_WINDOW_MS + M.NO_GO_END_MS;
  for (const node of [tab, late]) {
    assert.equal(M.endedFor(g, node, due - 1, true), false);
    assert.equal(M.endedFor(g, node, due, true), true, 'ended 8 s after THE FIRST GO — never 18 + 75 s');
  }
  assert.equal(M.endedFor(g, { go: S.g0 + 300 }, due + 1000, true), false, 'an on-time GO with no chunk yet: a run — the 18 s rule');
  assert.equal(M.endedFor({ ...g, g0: 0 }, tab, due, true), false, 'no first GO known: the old rule');
  const live = liveGoers({ ...tree, gone: undefined, slow: late }, { now: S.playAt + 1000, playAt: S.playAt, capAt: M.capAt(S), idleMs: M.IDLE_OUT_MS });
  assert.ok(!live.uids.includes('slow') && !live.uids.includes('gone'), 'the two rules agree: no on-time GO is never a live run');
});

test('S6 (a) A DELIBERATE LEAVE mid-run writes `e` for a live proven run (view.js#unmount — the room left; never a yielded tab)', () => {
  const v = read('js/games/freefall/view.js');
  assert.match(v, /if \(isMatch && runLive\(\) && !wroteE && !dup\(\) && \(!A \|\| A\.code !== code \|\| !\(A\.players && A\.players\[uid\]\)\)\) \{ const r = S\.result\(\); wroteE = true; spent = true; W\.end\(\{ f: r\.floor, t: r\.tick, w: 'left' \}\); \}\n\s+W\.close\(\);/);
});

test('S7 A LOST PHONE: never THE LEADER · a followed one left once silent > LOST_GONE_MS · not PLAYING · never in LAST ONE STANDING\'s way', () => {
  const row = (uid, floor, o = {}) => ({ uid, name: uid, floor, over: false, end: '', lost: false, gone: false, me: false, ...o });
  const me = { ...row('me', 30), me: true };
  // the deepest rival's phone is LOST: the leader is the deepest one still heard
  assert.equal(G.follow([me, row('a', 50, { lost: true }), row('b', 40)]), 'b');
  // a followed rival who is lost but not yet gone stays; once gone, the watcher moves on
  assert.equal(G.follow([me, row('a', 50, { lost: true }), row('b', 40)], 'a'), 'a');
  assert.equal(G.follow([me, row('a', 50, { lost: true, gone: true }), row('b', 40)], 'a'), 'b');
  assert.equal(G.nextFollow([me, row('a', 50, { lost: true, gone: true }), row('b', 40), row('c', 20)], 'b'), 'c', 'a tap never lands on a gone phone');
  // LAST ONE STANDING: a gone rival is down for it; a lost one (< 2 s) still holds it back
  const others = [row('b', 12, { over: true, end: 'out' })];
  assert.equal(G.lastStanding([me, row('a', 25, { lost: true }), ...others]), null);
  assert.equal(G.lastStanding([me, row('a', 25, { lost: true, gone: true }), ...others]), null, 'a 2 s blip never fires the once-a-match card');
  assert.equal(G.lastStanding([me, row('a', 25, { lost: true, gone: true, dead: true }), ...others]), 5, 'no news for LOST_OUT_MS: down for it — me 30 vs the deepest rival down (25)');
  assert.deepEqual([G.LOST_GONE_MS, G.LOST_OUT_MS], [2000, 8000]);
  // the ghost records when it went quiet
  const s = read('js/games/freefall/ghosts.js'), st = read('js/games/freefall/stage.js');
  assert.match(s, /if \(G\.lost && !wasLost\) G\.lostAt = now;/);
  assert.match(st, /const quiet = G\.lost \? now - G\.lostAt : 0, gn = quiet > LOST_GONE_MS, dead = quiet > LOST_OUT_MS;/);
  assert.match(st, /if \(!rows\[i\]\.over && !rows\[i\]\.dead\) n\+\+;/, '"n PLAYING" leaves a phone with no news for 8 s out');
});

test('FIX B — THE SPEED SWITCHES are the TEST PAGE\'s only: the cartridge passes no `ab` and no `fps`; the stage keeps the engine untouched (the smooth tower is a VIEW lead)', () => {
  const idx = read('js/games/freefall/view.js'), play = read('js/games/freefall/play.js'), st = read('js/games/freefall/stage.js');
  assert.doesNotMatch(idx, /\bab:|fps:/, 'the cartridge\'s driver has no switches');
  assert.match(play, /const AB = Object\.freeze\(\{ bloom: !off\('bloom'\), fx: !off\('fx'\), wall: !off\('wall'\), ghosts: !off\('ghosts'\), smooth: !off\('smooth'\), hud: !off\('hud'\) \}\);/);   // (FIX C: + `?hud=0`)
  assert.match(st, /function spinAhead\(tau\) \{\n    if \(!SMOOTH \|\| t0 == null \|\| held \|\| spect \|\| isOver\(run\) \|\| tau < 1\) return 0;/);
  assert.match(st, /export const SPIKE = Object\.freeze\(\{ n: 4, span: 20000, trial: 10000, settle: 500, helped: 0\.5, floor: 1 \}\);/);
  assert.match(st, /if \(!helped\) \{ spikeOff = true; tiers\.set\(trialFrom\); \}/, 'a step that did not help goes back up — and the rule rests');
});
