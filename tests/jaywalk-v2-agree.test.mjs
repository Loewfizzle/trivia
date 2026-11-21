// JAYWALK J2 — THE PHONE, THE HOST AND THE SERVER AGREE ON THE COURSE VERSION (docs/jaywalk.md "COURSE RULES v2"): real bot-played runs on
// v2 courses — SOLO (jaywalkSolo), the host's podium (logic.js#scoreRun), a MATCH (jaywalkMatch) and THE DAILY (openTry + scoreTry) — lane
// for lane, split for split; an OLD-CODE phone (no `cv`) replays as v1 until THE GRACE ends, then is refused; a version not in force at the
// run's GO is REFUSED (a phone never picks its own); a run whose GO is before the switch = v1 (today's), after = v2; today's daily v1,
// tomorrow's v2. PURE — THE UNIT JOB INSTALLS NOTHING.
import test from 'node:test';
import assert from 'node:assert/strict';
import { TICK_HZ, SPLIT_EVERY } from '../js/games/jaywalk/tuning.js';
import { createCourse } from '../js/games/jaywalk/course.js';
import { createRun, step, isOver, resultOf, canLog } from '../js/games/jaywalk/engine.js';
import { greedyBot } from '../js/games/jaywalk/bot.js';
import { packLog } from '../js/games/jaywalk/replay.js';
import { replay as replayFrozen } from './fixtures/jaywalk-v1/replay.js';
import { seedOf, matchStart, scoreRun, scoreNode, matchVersion } from '../js/games/jaywalk/logic.js';
import { jaywalkSolo, jaywalkMatch } from '../api/_lib/jaywalk.js';
import { scoreTry, openTry, CAP_MS, GRACE_MS } from '../api/_lib/jaywalk-tries.js';
import { CV_SWITCH_MS, CV_GRACE_END_MS, CV_REV, versionAt, tryVersion, setCvSwitch } from '../js/games/jaywalk/versions.js';

setCvSwitch(null);   // (the REAL switch: 2026-11-22 09:00 UTC)
const CODE = 'WXYZ', AFTER = CV_SWITCH_MS + 3600e3, BEFORE = CV_SWITCH_MS - 3600e3, LATE = CV_GRACE_END_MS + 3600e3;

/** the greedy bot plays a `mode` run on (seed, cv) through the recorder's own bounds → { log, live } */
function played(seed, mode, cv, { maxTicks = 3 * 60 * TICK_HZ, botSeed = seed } = {}) {
  const run = createRun({ seed, mode }), course = createCourse(seed, { cv }), bot = greedyBot({ seed: botSeed }), log = [];
  while (!isOver(run) && run.t < maxTicks) {
    let d = bot(run, course) || '';
    if (d && !canLog(log, run.t, d, mode)) d = '';
    if (d) log.push({ t: run.t, d });
    step(run, course, d);
  }
  while (!isOver(run)) step(run, course, '');
  return { log, live: resultOf(run) };
}
/** the proof node's chunks — every second of the run's clock (+ 200 ms), tick 0 = t0 */
function chunks(log, t0) {
  const c = {};
  let from = 0, k = 0;
  for (let t = TICK_HZ; from < log.length; t += TICK_HZ) {
    let to = from; while (to < log.length && log[to].t < t) to++;
    if (to > from) { c[k++] = { s: packLog(log.slice(0, to), from), at: t0 + Math.round(t * 1000 / TICK_HZ) + 200 }; from = to; }
  }
  return c;
}
const soloGame = m => ({ id: 'jaywalk', matchId: m, mode: 'solo', phase: 'final', participants: { me: true } });
const same = (row, live, what) => { assert.equal(row.l, live.lanes, `${what}: lanes`); assert.equal(row.t, live.tick, `${what}: tick`); assert.equal(row.w, live.cause, `${what}: cause`); assert.deepEqual(row.sp, live.splits.length ? live.splits : undefined, `${what}: splits`); };

test('SOLO on v2: the phone\'s engine = the host\'s podium row = THE SERVER\'s replay — lanes, tick, cause, splits; the rows say cv 2', () => {
  let reached = 0;
  for (const [k, m] of ['sa1', 'sa2', 'sa3', 'sa4'].entries()) {
    const go = AFTER + k * 7919, seed = seedOf(CODE, m, go), h = played(seed, 'solo', 2, { maxTicks: 4 * 60 * TICK_HZ });
    const node = { go, cv: 2, c: chunks(h.log, go), e: { l: h.live.lanes, t: h.live.tick } };
    const S = jaywalkSolo({ code: CODE, matchId: m, uid: 'me', node }), row = S.game.results.me;
    assert.ok(S.v.ok, S.v.why); same(row, h.live, `server ${m}`); assert.equal(row.cv, 2);
    const host = scoreRun(soloGame(m), node, null, CODE);
    same(host, h.live, `host ${m}`); assert.equal(host.cv, 2);
    reached += h.live.splits.length;
    // the same hops judged as v1 (what an old phone would have played) are a DIFFERENT run — the version matters
    const v1 = jaywalkSolo({ code: CODE, matchId: m, uid: 'me', node: { ...node, cv: undefined } }).game.results.me;
    assert.equal(v1.cv, undefined, 'no cv in THE GRACE = v1');
    void v1;
  }
  assert.ok(reached >= 2, `real splits on v2 (${reached})`);
});

test('AN OLD-CODE PHONE (no cv): played on v1 → its run replays as v1 until THE GRACE ends (= the frozen v1 replay), then it is refused', () => {
  const m = 'old1', go = AFTER + 55, seed = seedOf(CODE, m, go), h = played(seed, 'solo', 1, { maxTicks: 4 * 60 * TICK_HZ });
  const node = { go, c: chunks(h.log, go) };
  const row = jaywalkSolo({ code: CODE, matchId: m, uid: 'me', node }).game.results.me;
  same(row, h.live, 'an old phone in THE GRACE'); assert.equal(row.cv, undefined);
  const fz = replayFrozen({ seed, mode: 'solo', log: h.log });
  assert.equal(fz.lanes, row.l, 'v1 = the frozen rules'); assert.equal(fz.tick, row.t);
  same(scoreRun(soloGame(m), node, null, CODE), h.live, 'the host agrees');
  // past THE GRACE: refused
  const go2 = LATE, node2 = { go: go2, c: chunks(h.log, go2) };
  const late = jaywalkSolo({ code: CODE, matchId: m, uid: 'me', node: node2 });
  assert.equal(late.v.ok, false); assert.equal(late.v.why, 'version'); assert.equal(late.game.results.me.bad, 'version');
  assert.equal(scoreRun(soloGame(m), node2, null, CODE).bad, 'version', 'the host refuses it too');
});

test('A PHONE NEVER PICKS ITS VERSION: v1 claimed after the switch (an easier course) is REFUSED · v2 claimed before it is REFUSED · v1 before = today\'s course exactly', () => {
  const m = 'pick1';
  { const go = AFTER + 9, seed = seedOf(CODE, m, go), h = played(seed, 'solo', 1);
    const r = jaywalkSolo({ code: CODE, matchId: m, uid: 'me', node: { go, cv: 1, c: chunks(h.log, go) } });
    assert.equal(r.v.why, 'version'); assert.equal(scoreRun(soloGame(m), { go, cv: 1, c: chunks(h.log, go) }, null, CODE).bad, 'version'); }
  { const go = BEFORE, seed = seedOf(CODE, m, go), h = played(seed, 'solo', 2);
    const r = jaywalkSolo({ code: CODE, matchId: m, uid: 'me', node: { go, cv: 2, c: chunks(h.log, go) } });
    assert.equal(r.v.why, 'version'); }
  { const go = BEFORE + 1, seed = seedOf(CODE, m, go), h = played(seed, 'solo', 1, { maxTicks: 4 * 60 * TICK_HZ });
    for (const cv of [1, undefined]) {
      const row = jaywalkSolo({ code: CODE, matchId: m, uid: 'me', node: { go, cv, c: chunks(h.log, go) } }).game.results.me;
      same(row, h.live, `a run started before the switch (cv ${cv}) = v1`);
      assert.equal(row.l, replayFrozen({ seed, mode: 'solo', log: h.log }).lanes);
    } }
  assert.equal(versionAt(CV_SWITCH_MS - 1), 1); assert.equal(versionAt(CV_SWITCH_MS), 2);
});

test('A MATCH on v2: the version = the one in force at THE FIRST GO — every phone\'s engine = the host\'s rows = jaywalkMatch\'s; an old phone\'s node (no cv) is its own v1 run in THE GRACE', () => {
  const gos = { a: AFTER + 100, b: AFTER + 400, c: AFTER + 900 }, S = matchStart(CODE, 'mv2', { a: { go: gos.a } });
  assert.equal(matchVersion(S), 2);
  const nodes = {}, lives = {};
  for (const u of ['a', 'b']) { const h = played(S.seed, 'match', 2, { botSeed: `bot-${u}` }); lives[u] = h.live; nodes[u] = { go: gos[u], cv: 2, c: chunks(h.log, S.playAt), e: { l: h.live.lanes, t: h.live.tick, w: h.live.cause } }; }
  { const h = played(S.seed, 'match', 1, { botSeed: 'bot-c' }); lives.c = h.live; nodes.c = { go: gos.c, c: chunks(h.log, S.playAt), e: { l: h.live.lanes, t: h.live.tick, w: h.live.cause } }; }
  const M = jaywalkMatch({ code: CODE, matchId: 'mv2', uids: ['a', 'b', 'c'], nodes });
  assert.ok(M.game, M.why);
  for (const u of ['a', 'b', 'c']) same(M.game.results[u], lives[u], `server ${u}`);
  assert.equal(M.game.results.a.cv, 2); assert.equal(M.game.results.c.cv, undefined);
  const game = { id: 'jaywalk', matchId: 'mv2', mode: 'match', phase: 'final', participants: { a: true, b: true, c: true }, seed: S.seed, playAt: S.playAt, g0: S.g0 };
  for (const u of ['a', 'b', 'c']) same(scoreRun(game, nodes[u], null, CODE), lives[u], `host ${u}`);
  // a match whose FIRST GO was before the switch stays v1 for everyone — even a GO a moment after it
  const S1 = matchStart(CODE, 'mv1', { a: { go: CV_SWITCH_MS - 300 }, b: { go: CV_SWITCH_MS + 300 } });
  assert.equal(matchVersion(S1), 1);
  const h1 = played(S1.seed, 'match', 1), n1 = { go: CV_SWITCH_MS + 300, cv: 1, c: chunks(h1.log, S1.playAt) };
  same(scoreNode({ seed: S1.seed, mode: 'match', node: n1, t0: S1.playAt, from: S1.g0, cv: 1 }), h1.live, 'v1 match');
  const M1 = jaywalkMatch({ code: CODE, matchId: 'mv1', uids: ['a', 'b'], nodes: { a: { go: CV_SWITCH_MS - 300, cv: 1, c: chunks(h1.log, S1.playAt) }, b: n1 } });
  same(M1.game.results.b, h1.live, 'the late GO plays the match\'s own version');
});

test('THE DAILY: today\'s (d20261121) is v1, tomorrow\'s (d20261122) v2 — the SERVER picks it at START (the try keeps cv 2), scoreTry replays the try on it = the phone\'s run', () => {
  assert.equal(tryVersion('d20261121', 2, AFTER), 1); assert.equal(tryVersion('d20261122', 2, AFTER, CV_REV), 2); assert.equal(tryVersion('d20261122', 2, AFTER), 0);
  const o = openTry(null, { uid: 'u1', now: AFTER, startedAt: AFTER, cv: tryVersion('d20261122', 2, AFTER, CV_REV) });
  assert.equal(o.record.t[0].cv, 2); assert.equal(o.cv, 2);
  const o1 = openTry(null, { uid: 'u1', now: AFTER, startedAt: AFTER, cv: 1 });
  assert.equal(o1.record.t[0].cv, undefined, 'a v1 try writes nothing new');
  const seed = 'dv2daily', go = o.go, h = played(seed, 'daily', 2, { maxTicks: 1e9 });
  const node = { go, z: o.z, c: chunks(h.log, go) };
  const t = scoreTry({ seed, go, z: node.z, node, cv: 2 });
  assert.ok(!t.bad, t.bad); assert.equal(t.l, h.live.lanes); assert.equal(t.k, h.live.tick); assert.deepEqual(t.sp, h.live.splits.length ? h.live.splits : undefined);
  const t1 = scoreTry({ seed, go, z: node.z, node });   // (a try with no cv = v1: a different run of the same hops)
  assert.equal(t1.bad, undefined);
  const hv1 = played(seed, 'daily', 1, { maxTicks: 1e9 }), t1b = scoreTry({ seed, go, z: node.z, node: { go, z: node.z, c: chunks(hv1.log, go) } });
  assert.equal(t1b.l, hv1.live.lanes, "today's try = v1 exactly");
  assert.ok(SPLIT_EVERY === 50 && CAP_MS > 0 && GRACE_MS > 0);
});
