// JAYWALK H4 — THE MATCH + THE DROPPED SIGNAL (PURE — THE UNIT JOB INSTALLS NOTHING; docs/jaywalk.md "THE MATCH" · "ONE LIFE" · "THE
// DROPPED SIGNAL"): ONE LIFE in every mode; a match's course + tick 0 from THE FIRST GO (the same on every phone, the host's director and
// the server); a whole 3-player match through the pure director with real bot-played logs in timestamped chunks (the silent player has a
// run; a claim is never read); the end (every `e` · a silent phone: online → IDLE_OUT_MS, offline → + DROP_WAIT_MS · an UNPROVEN match);
// Call the Winner; the SERVER's own match (api/_lib/jaywalk.js#jaywalkMatch) = the host's rows, from the proof nodes alone; and THE
// DROPPED SIGNAL — a silence + a burst of queued chunks never costs the run (30 s, 60 s, twice, over the run's end), slow motion is still
// cut (0.8×, a "drop" that never catches up, a drop past CLOCK.drop), a log from the future / a backwards clock is refused.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../js/games/jaywalk/tuning.js';
import { createCourse } from '../js/games/jaywalk/course.js';
import { createRun, resultOf, step, isOver } from '../js/games/jaywalk/engine.js';
import { packLog, replay, chunkTimes, clockProblem, judgeRun, logFromChunks } from '../js/games/jaywalk/replay.js';
import { firstGo, matchStart, seedOf, scoreNode, scoreRun, scoreRuns, scoreCalls, standings, tickAt, GO_LEAD_MS, NO_GO_MS, DROP_WAIT_MS, CALL_WINDOW_MS, COUNT_MS } from '../js/games/jaywalk/logic.js';
import { createGame, nextStep, nightBonus, endedFor, lastSeen, IDLE_OUT_MS, UNPROVEN_MS } from '../js/games/jaywalk/director.js';
import { greedyBot, playBot } from '../js/games/jaywalk/bot.js';
import { verifyRun, verifyNode, jaywalkMatch } from '../api/_lib/jaywalk.js';
import { callBonus, CALL_MS } from '../js/core/playlist.js';
import { extractMatch } from '../js/core/match-report.js';
import { setCvSwitch } from '../js/games/jaywalk/versions.js';
setCvSwitch(Infinity);   // (J2: these cases are the MATCH / SOLO LOGIC on v1 courses at test times past the real switch — the versions themselves: tests/jaywalk-versions.test.mjs + jaywalk-v2-agree.test.mjs)

const CODE = 'ROOM', T0 = 1_800_000_000_000;
const msOf = tick => tick * 1000 / T.TICK_HZ;

/** a bot plays `ticks` on a course, then the kid stands until the run ends → { log, live (the phone's own result) } */
function play(seed, mode, ticks, botSeed) {
  const course = createCourse(seed), run = createRun({ seed, mode });
  const log = playBot(run, course, greedyBot({ seed: botSeed }), ticks), alive = !isOver(run);
  while (!isOver(run)) step(run, course, '');
  return { seed, log, alive, live: resultOf(run) };
}
/**
 * THE PROOF's chunks as a phone uploads them. realOf(tick) → the ms after tick 0 that tick was PLAYED at (honest: the tick's own time);
 * the phone flushes its new hops every `every` ms; a chunk ARRIVES (the server's stamp) `lag` ms after its flush — or, flushed inside an
 * OFFLINE window [a, b) (ms after tick 0), when the signal is back: at b, the queued chunks landing together, 3 ms apart, in order.
 */
function chunksOf(log, t0, { realOf = msOf, every = 500, lag = 120, offline = [] } = {}) {
  const c = {}, queued = new Map();
  let from = 0, k = 0, last = 0;
  while (from < log.length) {
    const flush = (Math.floor(realOf(log[from].t) / every) + 1) * every;
    let to = from; while (to < log.length && realOf(log[to].t) < flush) to++;
    const off = offline.find(([a, b]) => flush >= a && flush < b);
    let at = flush + lag;
    if (off) { const n = queued.get(off) || 0; queued.set(off, n + 1); at = off[1] + 3 * n; }
    at = Math.max(Math.round(at), last + 1); last = at;
    c[k++] = { s: packLog(log.slice(0, to), from), at: t0 + at };
    from = to;
  }
  return c;
}
const strip = r => { const { over, ...x } = r; void over; return x; };

test('ONE LIFE in solo + match + daily: the first hit ends the run — one `out`, never a second life; the replay agrees', () => {
  for (const mode of T.MODE_IDS) {
    const seed = `one-${mode}`, h = play(seed, mode, 700, seed);
    assert.equal(h.live.over, true); assert.equal(h.live.hits, 1, `${mode}: exactly one hit`);
    assert.ok(T.CAUSES.includes(h.live.cause), `${mode}: out by ${h.live.cause}`);
    assert.ok(!('lives' in h.live) && !('lives' in T.MODES[mode]));
    const r = replay({ seed, mode, log: h.log });
    assert.deepEqual(strip(r), { ...strip(h.live), used: h.log.length });
    // a hop logged after the end is never played — and the judge refuses such a log
    assert.equal(judgeRun({ seed, mode, log: [...h.log, { t: h.live.end + 20, d: 'u' }] }).why, 'past the end');
  }
});

test('THE FIRST GO: the earliest `go` among the proof nodes picks the course + sets tick 0 (+ GO_LEAD_MS) — final the moment it lands, the same for the phones, the director and the server', () => {
  assert.equal(firstGo(null), 0); assert.equal(firstGo({}), 0); assert.equal(firstGo({ a: {}, b: { go: 0 }, c: null, d: { go: 'x' } }), 0, 'no GO yet');
  const runs = { a: { go: T0 + 1105 }, b: { go: T0 + 1090 }, c: { go: T0 + 1300 } };
  assert.equal(firstGo(runs), T0 + 1090, 'the earliest');
  assert.equal(firstGo({ b: runs.b }), firstGo(runs), 'a later GO never changes it (the server stamps arrivals: a later one is always later)');
  assert.equal(firstGo({ a: { go: T0 + 1090 }, b: { go: T0 + 1090 } }), T0 + 1090, 'the same millisecond: the same course (the time alone picks it — never a uid)');
  const S = matchStart(CODE, 'm0', runs);
  assert.deepEqual(S, { g0: T0 + 1090, playAt: T0 + 1090 + GO_LEAD_MS, seed: seedOf(CODE, 'm0', T0 + 1090) });
  assert.equal(matchStart(CODE, 'm0', {}), null);
  assert.notEqual(matchStart(CODE, 'm1', runs).seed, S.seed, 'another match: another course'); assert.notEqual(matchStart('MOON', 'm0', runs).seed, S.seed);
  assert.notEqual(matchStart(CODE, 'm0', { b: { go: T0 + 1091 } }).seed, S.seed, 'one millisecond later: another course — nobody can shop for one');
  assert.equal(GO_LEAD_MS, 2000, 'the GOs are written in the count\'s last 2 s (the rules\' window): tick 0 ≈ the count\'s end');
  // the director: count → play carries the course + the clock; the host's own seed is never the course
  const g0 = createGame({ matchId: 'm0', settings: {}, participants: { a: true, b: true, c: true }, now: T0, seed: 'host-made' });
  assert.deepEqual([g0.phase, g0.seed, g0.playAt], ['count', '', T0 + COUNT_MS]);
  assert.equal(nextStep(g0, { now: S.playAt - 1, live: { runs }, code: CODE }), null, 'the count holds to tick 0');
  const p = nextStep(g0, { now: S.playAt + 30, live: { runs }, code: CODE });
  assert.deepEqual(p, { phase: 'play', phaseStartAt: S.playAt, playAt: S.playAt, seed: S.seed, g0: S.g0 });
  assert.deepEqual(nextStep(g0, { now: S.playAt + 900, live: { runs }, code: CODE }), p, 'asked again (a host migration): the same patch');
  // a GO that lands late (after the count's own end, before the UNPROVEN deadline) still starts a PROVEN match — 2 s after it
  const late = { a: { go: g0.playAt + 1500 } };
  assert.equal(nextStep(g0, { now: g0.playAt + NO_GO_MS + 400, live: { runs: late }, code: CODE }), null);
  assert.equal(nextStep(g0, { now: g0.playAt + 1500 + GO_LEAD_MS, live: { runs: late }, code: CODE }).g0, g0.playAt + 1500);
});

test('NO GO ANYWHERE (no signal, the rules not published) → the match plays UNPROVEN: a stand-in course, never counted, ended by the clock', () => {
  const g0 = createGame({ matchId: 'm0', settings: {}, participants: { a: true, b: true }, now: T0, seed: 'x' });
  assert.equal(nextStep(g0, { now: g0.playAt + NO_GO_MS - 1, live: { runs: {} }, code: CODE }), null);
  const now = g0.playAt + NO_GO_MS, p = nextStep(g0, { now, live: { runs: {} }, code: CODE });
  assert.deepEqual([p.phase, p.unproven, p.phaseStartAt, p.playAt], ['play', 1, now, now + 800]);
  assert.ok(typeof p.seed === 'string' && p.seed.length > 4 && p.g0 === undefined, 'a course of its own — no first GO');
  const g = { ...g0, ...p };
  assert.equal(nextStep(g, { now: g.playAt + UNPROVEN_MS - 1, live: { runs: {} }, code: CODE, online: { a: true, b: true } }), null, 'nobody\'s end can be signalled: it runs its time');
  const end = nextStep(g, { now: g.playAt + UNPROVEN_MS, live: { runs: {} }, code: CODE });
  assert.equal(end.phase, 'final'); assert.deepEqual([end.results.a.l, end.results.b.l], [0, 0], 'nothing was proven');
});

// ---- A WHOLE MATCH: a (a long run) · b (a short one) · c (silent — GO, never a hop)
const MATCH = (() => {
  const gos = { a: T0 + 1105, b: T0 + 1090, c: T0 + 1300 };
  const S = matchStart(CODE, 'm0', Object.fromEntries(Object.entries(gos).map(([u, go]) => [u, { go }])));
  const A = play(S.seed, 'match', 2400, 'a'), B = play(S.seed, 'match', 900, 'b'), C = play(S.seed, 'match', 0, 'c');
  const endAt = h => S.playAt + Math.ceil(msOf(h.live.end)) + 150;   // (their own `e` lands a beat after the hit)
  const full = {
    a: { go: gos.a, c: chunksOf(A.log, S.playAt), e: { l: A.live.lanes, t: A.live.tick, w: A.live.cause } },
    b: { go: gos.b, c: chunksOf(B.log, S.playAt), e: { l: B.live.lanes, t: B.live.tick, w: B.live.cause } },
    c: { go: gos.c, e: { l: 0, t: 0, w: C.live.cause } },
  };
  /** the nodes as the room holds them at a server time: the chunks that have arrived, each `e` once it has */
  const at = now => Object.fromEntries(Object.entries(full).map(([u, n]) => {
    const c = {};
    for (const [i, v] of Object.entries(n.c || {})) if (v.at <= now) c[i] = v;
    return [u, { go: n.go, ...(Object.keys(c).length ? { c } : {}), ...(now >= endAt({ a: A, b: B, c: C }[u]) ? { e: n.e } : {}) }];
  }));
  return { S, A, B, C, full, at, endAt, last: Math.max(endAt(A), endAt(B), endAt(C)) };
})();

test('A WHOLE MATCH (the pure director): count → play at THE FIRST GO → final when every run has ended — the results are THE JUDGE\'s replay of each log, never a claim; the silent player has a run', () => {
  const { S, A, B, C, at, last } = MATCH;
  assert.ok(A.alive && B.alive, 'the bots were still hopping when they stopped (the runs end by standing still)');
  assert.ok(A.live.lanes > B.live.lanes && B.live.lanes > 10, `a: lane ${A.live.lanes} · b: lane ${B.live.lanes}`);
  assert.deepEqual([C.live.lanes, C.live.cause, C.live.over], [0, 'wall', true], 'the silent player: the blackout takes them');
  const g0 = createGame({ matchId: 'm0', settings: {}, participants: { a: true, b: true, c: true }, now: T0, seed: 'x' });
  const g1 = { ...g0, ...nextStep(g0, { now: S.playAt, live: { runs: at(S.playAt) }, code: CODE }) };
  assert.deepEqual([g1.phase, g1.seed, g1.playAt], ['play', S.seed, S.playAt]);
  const online = { a: true, b: true, c: true };
  for (const dt of [1000, 10_000, 20_000, 30_000]) assert.equal(nextStep(g1, { now: S.playAt + dt, live: { runs: at(S.playAt + dt) }, code: CODE, online }), null, `${dt / 1000} s in: someone is still hopping`);
  // (a mid-match score "as it stands" — the ghosts' / END NOW's view — never past the clock)
  const mid = scoreRuns(g1, at(S.playAt + 10_000), S.playAt + 10_000, CODE);
  assert.ok(mid.a.l > 0 && mid.a.l < A.live.lanes && mid.a.e === -1, 'a: still running at 10 s');
  // the end: every node says `e` — a LIES about their lanes
  const now = last + 400, runs = at(now);
  runs.a = { ...runs.a, e: { l: 99999, t: 1 } };
  assert.ok(runs.a.e && runs.b.e && runs.c.e);
  const p2 = nextStep(g1, { now, live: { runs }, code: CODE, online });
  assert.deepEqual([p2.phase, p2.phaseStartAt, p2.endAt], ['final', now, now]);
  assert.equal(p2.calls, undefined, 'nobody called');
  for (const [u, h] of [['a', A], ['b', B], ['c', C]]) {
    assert.deepEqual([p2.results[u].l, p2.results[u].t, p2.results[u].w, p2.results[u].e], [h.live.lanes, h.live.tick, h.live.cause, h.live.end], `${u}: the replay's lanes · tick · cause · end`);
    assert.ok(!p2.results[u].bad && !p2.results[u].cut && !('lv' in p2.results[u]), `${u}: an honest run — no lives anywhere`);
  }
  assert.notEqual(p2.results.a.l, 99999, 'a claim is never read');
  const g2 = { ...g1, ...p2 };
  assert.equal(nextStep(g2, { now: now + 9999, live: { runs }, code: CODE }), null, 'final holds (the console\'s podium)');
  assert.deepEqual(standings(g2).map(r => [r.uid, r.rank]), [['a', 1], ['b', 2], ['c', 3]], 'farthest first');
  assert.deepEqual(nextStep(g1, { now, live: { runs }, code: CODE, online }), p2, 'the same step asked again (a host migration) = the same patch');
  assert.deepEqual(nightBonus(g2), {});
  // every patch of the step moved the phase (THE 3 S RULE)
  for (const patch of [nextStep(g0, { now: S.playAt, live: { runs: at(S.playAt) }, code: CODE }), p2]) assert.ok(patch.phase && patch.phaseStartAt);
});

test('THE SERVER\'S OWN MATCH (jaywalkMatch): every run replayed from the proof nodes alone — the SAME rows as the host\'s podium; nothing the host wrote is read; no GO / no hops = nothing to count', () => {
  const { S, at, last, A } = MATCH, now = last + 400, nodes = at(now);
  const g1 = { ...createGame({ matchId: 'm0', settings: {}, participants: { a: true, b: true, c: true }, now: T0, seed: 'x' }), phase: 'play', playAt: S.playAt, seed: S.seed, g0: S.g0 };
  const host = scoreRuns(g1, nodes, now, CODE);
  const J = jaywalkMatch({ code: CODE, matchId: 'm0', uids: ['a', 'b', 'c'], nodes });
  assert.deepEqual(J.game.results, host, 'the server\'s rows = the host\'s, to the lane and the tick');
  assert.deepEqual([J.game.id, J.game.mode, J.game.phase, J.game.sv, J.game.seed, J.game.playAt, J.game.g0], ['jaywalk', 'match', 'final', 1, S.seed, S.playAt, S.g0], 'the course + tick 0 from THE FIRST GO — never the host\'s game');
  assert.deepEqual(standings(J.game).map(r => r.uid), ['a', 'b', 'c']);
  // → the report's rows: a (the farthest) wins; the silent-but-present player is in the match (a GO = they were there)
  const ex = extractMatch(J.game);
  assert.deepEqual([ex.rows.a.rank, ex.rows.a.win, ex.rows.b.rank, ex.rows.c.rank, ex.solo], [1, true, 2, 3, false]);
  assert.deepEqual(Object.keys(ex.rows.a.rec), ['jaywalk-solo'], 'H6A — YOUR BEST ANYWHERE: a counted match run raises the same best');
  assert.equal(ex.rows.a.rec['jaywalk-solo'], J.game.results.a.l);
  // a forged claim in a node's `e`, a forged log
  const lied = { ...nodes, b: { ...nodes.b, e: { l: 99999, t: 1 } } };
  assert.deepEqual(jaywalkMatch({ code: CODE, matchId: 'm0', uids: ['a', 'b', 'c'], nodes: lied }).game.results, host, 'a claim changes nothing');
  const forged = { ...nodes, b: { go: nodes.b.go, c: { 0: { s: 'U0U1U1U1', at: S.playAt + 600 } } } };
  const F = jaywalkMatch({ code: CODE, matchId: 'm0', uids: ['a', 'b', 'c'], nodes: forged }).game.results;
  assert.deepEqual([F.b.l, F.b.bad], [0, 'too fast'], 'a forged log: the run of a kid who never hopped, named'); assert.deepEqual(F.a, host.a);
  const future = { ...nodes, b: { go: nodes.b.go, c: { 0: { s: packLog(A.log), at: S.playAt + 900 } } } };
  assert.equal(jaywalkMatch({ code: CODE, matchId: 'm0', uids: ['a', 'b', 'c'], nodes: future }).game.results.b.bad, 'ahead of the clock', 'a whole log uploaded at the start: made in advance');
  // a name without a node (a seat, never a play): a row that says so — the report drops it (A SEAT IS NOT A PLAY)
  const D = jaywalkMatch({ code: CODE, matchId: 'm0', uids: ['a', 'b', 'c', 'd'], nodes }).game;
  assert.deepEqual(D.results.d, { l: 0, t: 0, w: '', e: -1, bad: 'no go' }); assert.deepEqual(D.results.a, host.a);
  // another room / match = another course: the same logs are other runs
  assert.notDeepEqual(jaywalkMatch({ code: 'MOON', matchId: 'm0', uids: ['a', 'b', 'c'], nodes }).game.results.a, host.a);
  // nothing to count
  assert.deepEqual(jaywalkMatch({ code: CODE, matchId: 'm0', uids: ['a', 'b'], nodes: {} }), { game: null, why: 'no go' });
  assert.deepEqual(jaywalkMatch({ code: CODE, matchId: 'm0', uids: ['a', 'b'], nodes: { a: { go: 5 }, b: { go: 9 } } }), { game: null, why: 'no hops' }, 'GOs alone (an unproven match\'s stray GO): nobody hopped');
  assert.equal(jaywalkMatch({ code: CODE, matchId: 'm0', uids: ['a'], nodes }).game, null, 'one name is not a match (the solo path is jaywalkSolo)');
});

test('THE END with a silent phone (THE DROPPED SIGNAL in a match): a player whose own end never arrives is waited for — online: IDLE_OUT_MS (the kid is out by then) · offline: + DROP_WAIT_MS — then scored as their proof stands', () => {
  const { S, at, A, B } = MATCH;
  assert.equal(DROP_WAIT_MS, T.CLOCK.drop); assert.ok(DROP_WAIT_MS >= 65_000, 'a ~60 s drop + the reconnect');
  const g1 = { ...createGame({ matchId: 'm0', settings: {}, participants: { a: true, b: true, c: true }, now: T0, seed: 'x' }), phase: 'play', playAt: S.playAt, seed: S.seed, g0: S.g0 };
  // b's phone went dark 8 s in: its chunks up to then, no `e` — a + c ended as they did
  const cutAt = S.playAt + 8000, dark = now => { const n = at(now), b = at(cutAt).b; return { ...n, b: { go: b.go, c: b.c } }; };
  const seen = lastSeen(g1, dark(cutAt).b);
  assert.ok(seen > S.playAt + 6000 && seen <= cutAt, 'last seen: their newest chunk\'s arrival');
  assert.equal(lastSeen(g1, undefined), S.playAt); assert.equal(lastSeen(g1, { go: S.playAt - 900 }), S.playAt, 'no chunk yet: the match\'s tick 0');
  assert.equal(endedFor(g1, { go: 1, e: { l: 0, t: 0 } }, S.playAt, true), true, 'their own end');
  assert.equal(endedFor(g1, dark(cutAt).b, seen + IDLE_OUT_MS - 1, true), false); assert.equal(endedFor(g1, dark(cutAt).b, seen + IDLE_OUT_MS, true), true);
  assert.equal(endedFor(g1, dark(cutAt).b, seen + IDLE_OUT_MS + DROP_WAIT_MS - 1, false), false); assert.equal(endedFor(g1, dark(cutAt).b, seen + IDLE_OUT_MS + DROP_WAIT_MS, false), true);
  const late = MATCH.last + 400;
  assert.ok(late < seen + IDLE_OUT_MS + DROP_WAIT_MS, 'a + c are long done');
  // OFFLINE (presence gone): the room waits for the signal to come back
  assert.equal(nextStep(g1, { now: late, live: { runs: dark(late) }, code: CODE, online: { a: true, c: true } }), null, 'b is offline: waited for');
  assert.equal(nextStep(g1, { now: seen + IDLE_OUT_MS + DROP_WAIT_MS - 1, live: { runs: dark(late) }, code: CODE, online: { a: true, c: true } }), null);
  const end = nextStep(g1, { now: seen + IDLE_OUT_MS + DROP_WAIT_MS, live: { runs: dark(late) }, code: CODE, online: { a: true, c: true } });
  assert.equal(end.phase, 'final');
  const b8 = replay({ seed: S.seed, mode: 'match', log: logFromChunks(dark(late).b.c) });
  assert.deepEqual([end.results.b.l, end.results.b.e], [b8.lanes, b8.end], 'scored at their last provable point: the hops that arrived, then the blackout');
  assert.ok(end.results.b.l > 0 && end.results.b.l <= B.live.lanes); assert.equal(end.results.a.l, A.live.lanes);
  // ONLINE but silent (a stuck page): no drop to wait for
  assert.equal(nextStep(g1, { now: Math.max(late, seen + IDLE_OUT_MS), live: { runs: dark(late) }, code: CODE, online: { a: true, b: true, c: true } }).phase, 'final');
  // … and the signal coming BACK in time: their queued chunks + `e` land → the full run counts (the judge: a burst after a silence)
  const back = MATCH.last + 30_000, bNode = { go: MATCH.full.b.go, c: chunksOf(B.log, S.playAt, { offline: [[8000, back - S.playAt]] }), e: MATCH.full.b.e };
  const p = nextStep(g1, { now: back + 500, live: { runs: { ...at(back + 500), b: bNode } }, code: CODE, online: { a: true, b: true, c: true } });
  assert.equal(p.phase, 'final'); assert.deepEqual([p.results.b.l, p.results.b.cut, p.results.b.bad], [B.live.lanes, undefined, undefined], 'the dropped signal cost nothing');
});

test('CALL THE WINNER: a right call (made once out, on a player still in, in time) pays core/playlist.js#callBonus(the players still in); wrong / late / on someone already out / by a taken player / on yourself pays nothing', () => {
  const sec = s => s * T.TICK_HZ, playAt = T0 + 5000;
  const game = { participants: { a: true, b: true, c: true, d: true, e: true }, playAt };
  // a out at 10 s (lane 12) · b out at 30 s (lane 40) · c out at 50 s (lane 90 — the farthest) · d out at 60 s (lane 70) · e TAKEN at the cap (lane 60)
  const results = { a: { l: 12, t: sec(9), e: sec(10) }, b: { l: 40, t: sec(29), e: sec(30) }, c: { l: 90, t: sec(49), e: sec(50) }, d: { l: 70, t: sec(58), e: sec(60) }, e: { l: 60, t: sec(200), e: T.MODES.match.cap, x: 1 } };
  const outAt = u => playAt + msOf(results[u].e);
  // (THE PROOF PASS: every player's node carries its GO — a player with NO run can not be named, and is not counted as "still in")
  const GO = playAt - 2000, go = r => { const o = {}; for (const u of ['a', 'b', 'c', 'd', 'e']) o[u] = { go: GO, ...(r[u] || {}) }; return o; };
  const call = (u, w, dt = 4000) => go({ [u]: { k: { w, at: outAt(u) + dt } } });
  assert.deepEqual(scoreCalls(game, call('a', 'c'), results), { a: { w: 'c', ok: true, bonus: callBonus(4) } }, 'a called c with 4 still in');
  assert.equal(callBonus(4), 1.2); assert.equal(CALL_WINDOW_MS, CALL_MS + 6000);
  assert.deepEqual(scoreCalls(game, call('b', 'c'), results).b, { w: 'c', ok: true, bonus: callBonus(3) }, 'fewer still in: a smaller bonus');
  assert.deepEqual(scoreCalls(game, call('a', 'd'), results).a, { w: 'd', ok: false, bonus: 0 }, 'a wrong call: counted, pays nothing');
  assert.deepEqual(scoreCalls(game, call('a', 'c', CALL_WINDOW_MS), results).a.ok, true, 'the window\'s last moment');
  assert.deepEqual(scoreCalls(game, call('a', 'c', CALL_WINDOW_MS + 1), results), {}, 'too late');
  assert.deepEqual(scoreCalls(game, call('b', 'a'), results), {}, 'a was already out');
  assert.deepEqual(scoreCalls(game, call('a', 'a'), results), {}, 'never yourself');
  assert.deepEqual(scoreCalls(game, call('a', 'zz'), results), {}, 'not a player');
  assert.deepEqual(scoreCalls(game, go({ e: { k: { w: 'c', at: playAt + 1000 } } }), results), {}, 'a taken player was never out');
  assert.deepEqual(scoreCalls(game, go({ a: { k: { w: 'c' } } }), results), {}, 'a call without the server\'s time');
  // THE PROOF PASS — the inbox's (3) + the review's NICE: a player with NO RUN is never "still in"; a FULL DRAW pays nobody
  const noRun = call('a', 'c'); delete noRun.b.go;
  assert.deepEqual(scoreCalls(game, noRun, results).a, { w: 'c', ok: true, bonus: callBonus(3) }, 'b has no run: three were still in, not four');
  const late = call('a', 'c'); late.c.go = GO + 5001;
  assert.deepEqual(scoreCalls(game, late, results), {}, 'the named player\'s GO was past the window: no run, no call');
  const draw = Object.fromEntries(['a', 'b', 'c', 'd', 'e'].map((u, i) => [u, { l: 0, t: 0, e: sec(10 + i) }]));
  assert.deepEqual(scoreCalls(game, call('a', 'e'), draw), {}, 'everyone tied for first: a full draw pays nobody');
  assert.deepEqual(scoreCalls(game, call('d', 'e'), results).d, { w: 'e', ok: false, bonus: 0 }, 'e was still in (taken later) — but c won');
  // a tie for first: either of the two is a right call
  const tied = { ...results, d: { l: 90, t: sec(49), e: sec(60) } };
  assert.equal(scoreCalls(game, call('a', 'd'), tied).a.ok, true); assert.equal(scoreCalls(game, call('a', 'c'), tied).a.ok, true);
  // the night's bonus: only what was won
  assert.deepEqual(nightBonus({ calls: { a: { w: 'c', ok: true, bonus: 1.2 }, b: { w: 'd', ok: false, bonus: 0 } } }), { a: 1.2 });
  assert.deepEqual(nightBonus({}), {});
  // through the director: the final patch carries the calls
  const { S, at, last, A } = MATCH, now = last + 400, runs = at(now);
  runs.c = { ...runs.c, k: { w: 'a', at: S.playAt + msOf(MATCH.C.live.end) + 3000 } };   // (c — out first — called a, who won)
  const g1 = { ...createGame({ matchId: 'm0', settings: {}, participants: { a: true, b: true, c: true }, now: T0, seed: 'x' }), phase: 'play', playAt: S.playAt, seed: S.seed, g0: S.g0 };
  const p = nextStep(g1, { now, live: { runs }, code: CODE, online: { a: true, b: true, c: true } });
  assert.deepEqual(p.calls, { c: { w: 'a', ok: true, bonus: callBonus(2) } }); assert.equal(p.results.a.l, A.live.lanes);
  assert.deepEqual(nightBonus({ ...g1, ...p }), { c: callBonus(2) });
  assert.deepEqual(jaywalkMatch({ code: CODE, matchId: 'm0', uids: ['a', 'b', 'c'], nodes: runs }).game.calls, p.calls, 'the server reads the same calls');
});

// ---- THE DROPPED SIGNAL (the owner, Nov 16 — a phone in a moving van): a solo run of two minutes on the course its GO picked
const LONG = (() => {
  const go = T0 + 1092, matchId = 'm9', seed = seedOf(CODE, matchId, go);   // (H5A — THE AREAS changed every course: a GO whose course this bot lives two minutes on)
  const h = play(seed, 'solo', 7200, 'drop');
  return { go, matchId, seed, ...h, node: o => ({ go, c: chunksOf(h.log, go, { every: 1000, ...o }), e: { l: 0, t: 0 } }) };
})();
const judge = o => verifyNode({ code: CODE, matchId: LONG.matchId, node: LONG.node(o) });

test('THE DROPPED SIGNAL: a 30 s and a 60 s silence, then the queued chunks landing together → the FULL honest run counts (no cut) — twice in a run, and over the run\'s own end too', () => {
  assert.ok(LONG.alive && LONG.log.length > 300 && LONG.live.lanes > 150, `a real two-minute run (${LONG.log.length} hops, lane ${LONG.live.lanes})`);
  const want = strip(LONG.live);
  const steady = judge({});
  assert.equal(steady.ok, true, steady.why); assert.equal(steady.cut, undefined); assert.deepEqual(steady.result, want, 'the signal never dropped: the phone\'s own run');
  for (const [name, offline] of [['30 s', [[20_000, 50_000]]], ['60 s', [[20_000, 80_000]]], ['60 s right from the start', [[0, 60_000]]], ['two drops', [[20_000, 50_000], [70_000, 110_000]]], ['over the end of the run', [[100_000, 165_000]]]]) {
    const node = LONG.node({ offline }), times = chunkTimes(node.c);
    const gap = Math.max(...times.map((k, i) => k.at - (i ? times[i - 1].at : LONG.go)));
    assert.ok(gap >= (offline[0][1] - offline[0][0]) - 2500, `${name}: a real silence in the chunks' clock (${(gap / 1000).toFixed(1)} s)`);
    assert.equal(clockProblem(LONG.go, times), null, `${name}: the lag is explained by the silence + the catch-up burst`);
    const v = verifyNode({ code: CODE, matchId: LONG.matchId, node });
    assert.equal(v.ok, true, `${name}: ${v.why}`); assert.equal(v.cut, undefined, `${name}: never cut`);
    assert.deepEqual(v.result, want, `${name}: the whole run — every lane`);
  }
  // … on a slow link too (the queued chunks trickle in over a few seconds, each less late than the one before)
  const trickle = LONG.node({ offline: [[20_000, 60_000]] });
  let n = 0; for (const k of Object.values(trickle.c)) if (k.at >= LONG.go + 60_000 && k.at < LONG.go + 60_200) k.at += 90 * n++;
  for (let i = 1; trickle.c[i]; i++) if (trickle.c[i].at <= trickle.c[i - 1].at) trickle.c[i].at = trickle.c[i - 1].at + 1;
  const slowLink = verifyNode({ code: CODE, matchId: LONG.matchId, node: trickle });
  assert.equal(slowLink.ok && !slowLink.cut, true, 'a burst that takes a few seconds to drain'); assert.deepEqual(slowLink.result, want);
  // a MATCH: tick 0 is 2 s after the first GO — the same rule (the host's podium + the server's count)
  const mrow = scoreNode({ seed: LONG.seed, mode: 'solo', node: LONG.node({ offline: [[20_000, 80_000]] }), t0: LONG.go, from: LONG.go - GO_LEAD_MS });
  assert.deepEqual([mrow.l, mrow.cut, mrow.bad], [LONG.live.lanes, undefined, undefined]);
  assert.equal(clockProblem(T0 + 2000, [{ at: T0 + 1500, n: 0, t0: 0, t1: 0 }], { from: T0 }), null, 'a match: a chunk may land between the first GO and tick 0');
  assert.deepEqual(clockProblem(T0 + 2000, [{ at: T0 + 1500, n: 0, t0: 0, t1: 0 }]), { why: 'clock' }, '… a solo run: never before its GO');
});

test('SLOW MOTION IS STILL CAUGHT: a 0.8× game (the ticks drift behind while the chunks keep arriving) is cut · a "drop" that never catches up is cut at the burst\'s FIRST hop · a drop past CLOCK.drop is cut at the first offline hop', () => {
  const full = LONG.live.lanes, lanesAt = (hops, tick) => replay({ seed: LONG.seed, mode: 'solo', log: LONG.log.slice(0, hops), until: tick }).lanes;
  // 0.8× — every tick takes 1.25× its time; a chunk a second, arriving normally: no silence explains the lag
  const slow = judge({ realOf: t => msOf(t) * 1.25 });
  assert.equal(slow.ok, true); assert.equal(slow.cut && slow.cut.why, 'behind', 'a steady drift: cut');
  assert.ok(slow.cut.tick >= 25 * T.TICK_HZ && slow.cut.tick <= 45 * T.TICK_HZ, `cut ${(slow.cut.tick / T.TICK_HZ).toFixed(1)} s in (20 % slow: 8 s behind after ~32 s of play)`);
  assert.ok(slow.result.lanes < full && slow.result.lanes > 0, `it keeps ${slow.result.lanes} of its ${full} lanes — up to the last on-time hop`);
  assert.equal(slow.result.lanes, lanesAt(LONG.log.findIndex(h => h.t >= slow.cut.tick), slow.cut.tick), 'the replay of the hops before the cut, to the cut');
  // 0.5× from the first tick — cut sooner, fewer lanes
  const half = judge({ realOf: t => msOf(t) * 2 });
  assert.ok(half.cut && half.cut.tick < slow.cut.tick && half.result.lanes < slow.result.lanes);
  // SLOW MOTION HIDDEN IN A "DROP": honest for 20 s, then half speed with the chunks held back for 40 s and sent as one burst, then on at half
  // speed — a real drop catches up to the clock; this one never does → cut at the burst's FIRST hop (nothing of the slowed part counts)
  const hidden = judge({ realOf: t => (msOf(t) <= 20_000 ? msOf(t) : 20_000 + (msOf(t) - 20_000) * 2), offline: [[20_000, 60_000]] });
  assert.equal(hidden.cut && hidden.cut.why, 'behind');
  assert.ok(hidden.cut.tick >= 19 * T.TICK_HZ && hidden.cut.tick <= 21 * T.TICK_HZ, `cut at the fake drop's first hop (${(hidden.cut.tick / T.TICK_HZ).toFixed(1)} s) — not where the grace ran out`);
  assert.ok(hidden.result.lanes <= lanesAt(LONG.log.length, 21 * T.TICK_HZ));
  // … the same burst from an HONEST phone (it played on at full speed while offline) is no cut at all
  assert.equal(judge({ offline: [[20_000, 60_000]] }).cut, undefined);
  // A DROP LONGER THAN CLOCK.drop (95 s offline): the run counts up to the first hop made offline — never thrown away
  assert.ok(T.CLOCK.drop >= 65_000 && T.CLOCK.drop <= 90_000 && T.CLOCK.catchUp >= 5000);
  const longDrop = judge({ offline: [[20_000, 115_000]] });
  assert.equal(longDrop.ok, true); assert.equal(longDrop.cut && longDrop.cut.why, 'behind');
  assert.ok(longDrop.cut.tick >= 19 * T.TICK_HZ && longDrop.cut.tick <= 21 * T.TICK_HZ, 'cut where the signal went');
  assert.ok(longDrop.result.lanes > 0 && longDrop.result.lanes < full);
  // a PAUSED game (stopped 30 s, then on — late for good): a silence explains the first chunk, nothing explains the rest → cut at the pause
  const paused = judge({ realOf: t => msOf(t) + (t > 1200 ? 30_000 : 0) });
  assert.ok(paused.cut && paused.cut.tick > 1200 && paused.cut.tick <= 1320, 'cut at the pause');
});

test('A LOG FROM THE FUTURE IS REFUSED · a chunk clock that runs backwards is refused · never ahead of the clock, drop or no drop', () => {
  // the whole log uploaded half a second after GO (made in advance / a sped-up game)
  const future = { go: LONG.go, c: { 0: { s: packLog(LONG.log.slice(0, 80)), at: LONG.go + 500 } } };
  assert.deepEqual(verifyNode({ code: CODE, matchId: LONG.matchId, node: future }), { ok: false, why: 'ahead of the clock' });
  // double speed
  assert.equal(judge({ realOf: t => msOf(t) / 2, lag: 0 }).why, 'ahead of the clock');
  // a "drop" can't hide it: chunks held back and sent at 30 s that hold hops up to 60 s of play
  const ahead = LONG.node({ realOf: t => msOf(t) / 2, offline: [[5000, 30_000]] });
  assert.equal(verifyNode({ code: CODE, matchId: LONG.matchId, node: ahead }).why, 'ahead of the clock');
  // inside the slack (the phone's clock estimate + a frame): fine
  assert.equal(judge({ lag: -900 }).ok, true);
  // the clock itself
  const back = LONG.node({}); back.c[5].at = back.c[4].at - 5;
  assert.equal(verifyNode({ code: CODE, matchId: LONG.matchId, node: back }).why, 'the chunks\' clock');
  const before = LONG.node({}); before.c[0].at = LONG.go - 1;
  assert.equal(verifyNode({ code: CODE, matchId: LONG.matchId, node: before }).why, 'the chunks\' clock', 'a chunk before GO');
  assert.equal(verifyNode({ code: CODE, matchId: LONG.matchId, node: { c: LONG.node({}).c } }).why, 'no go');
  // verifyRun is the judge + a finished run: the same answers
  const node = LONG.node({ offline: [[20_000, 80_000]] });
  const v = verifyRun({ seed: LONG.seed, mode: 'solo', log: logFromChunks(node.c), go: LONG.go, times: chunkTimes(node.c) });
  assert.equal(v.ok && !v.cut, true); assert.equal(v.result.lanes, LONG.live.lanes);
  assert.equal(verifyRun({ seed: LONG.seed, mode: 'solo', log: logFromChunks(future.c), go: LONG.go, times: chunkTimes(future.c) }).why, 'ahead of the clock');
  assert.deepEqual(scoreRun({ mode: 'solo', matchId: LONG.matchId, participants: { a: true } }, future, LONG.go + 60_000, CODE), { l: 0, t: 0, w: 'wall', e: scoreRun({ mode: 'solo', matchId: LONG.matchId, participants: { a: true } }, { go: LONG.go }, LONG.go + 60_000, CODE).e, y: 0, px: 4500, bad: 'ahead of the clock', go: LONG.go }, 'the host\'s podium says the same: a kid who never hopped, named');
  assert.equal(tickAt({ playAt: T0 }, T0 + 1000), T.TICK_HZ);
});

// ---- THE PROOF PASS (Nov 20 — docs/games/passes/proof-pass.md): the review's MUST 2 step 1 (THE SERVER's TWO GUARDS) + MUST 3 + SHOULD 1, for JAYWALK
test('THE PROOF PASS — THE SERVER\'S TWO GUARDS + A GO ALONE IS NOT A PLAYER: a node counts only with a GO; a GO later than the window after THE FIRST GO is no run (the early-first-GO host wins nothing); `played` = a hop the server replayed; the host\'s podium says the same', async () => {
  const { GO_WINDOW_MS, goUids, firstGo: coreFirstGo, T0_KEY } = await import('../js/core/proof.js');
  const { JW_PLAYED_HOPS } = await import('../api/_lib/jaywalk.js');
  const { S, at, last } = MATCH, now = last + 400, nodes = at(now), uids = ['a', 'b', 'c'];
  assert.equal(firstGo, coreFirstGo, 'ONE firstGo — core/proof.js (HIGH RISE\'s too)');
  // an honest match: a + b hopped, c only wrote GO (silent) — c is NOT a player any more
  const J = jaywalkMatch({ code: CODE, matchId: 'm0', uids, nodes });
  assert.deepEqual(J.played, ['a', 'b'], 'the players = the uids with a hop in the server\'s own replay (c wrote GO and never hopped)');
  assert.equal(JW_PLAYED_HOPS, 1);
  assert.ok(!J.game.results.c.bad && J.game.results.c.l === 0, 'c still has a row (the blackout took the kid) — it is the COUNT that drops them');
  // the tree's own stamp is never a player, never a GO
  const stamped = { ...nodes, [T0_KEY]: S.g0 - 3 };
  assert.deepEqual(jaywalkMatch({ code: CODE, matchId: 'm0', uids, nodes: stamped }).game.results, J.game.results, 'the stamp changes nothing');
  assert.equal(firstGo(stamped), S.g0); assert.deepEqual(goUids(stamped).sort(), ['a', 'b', 'c']);
  // GUARD 1 — a node counts only with a GO: a's GO gone (the tree deleted under the match, a's chunks written on) → no run, not a player
  const noGo = { ...nodes, a: { c: nodes.a.c, e: nodes.a.e } };
  const G1 = jaywalkMatch({ code: CODE, matchId: 'm0', uids, nodes: noGo });
  assert.equal(G1.game.results.a.bad, 'no go'); assert.deepEqual(G1.played, ['b']); assert.deepEqual(goUids(noGo).sort(), ['b', 'c'], 'report.js#provenUids: a node of chunks alone proves nobody');
  // GUARD 2 — a GO later than the window after THE FIRST GO is no run
  const late = { ...nodes, a: { ...nodes.a, go: S.g0 + GO_WINDOW_MS + 1 } };
  const G2 = jaywalkMatch({ code: CODE, matchId: 'm0', uids, nodes: late });
  assert.deepEqual([G2.game.results.a.bad, G2.game.results.a.l, G2.played], ['late go', 0, ['b']], 'a\'s long run is not in this match');
  const edge = { ...nodes, a: { ...nodes.a, go: S.g0 + GO_WINDOW_MS } };
  assert.ok(!jaywalkMatch({ code: CODE, matchId: 'm0', uids, nodes: edge }).game.results.a.bad, 'the window\'s last millisecond is in');
  assert.equal(GO_WINDOW_MS, 5000);
  // … THE EARLY FIRST GO (hole c): the host GOes ALONE 20 s early — everyone else's GO is then "late": he is left a solo run, never a win
  const early = { ...nodes, c: { go: S.g0 - 20000, c: nodes.b.c } };
  const G3 = jaywalkMatch({ code: CODE, matchId: 'm0', uids, nodes: early });
  assert.deepEqual([G3.game.results.a.bad, G3.game.results.b.bad], ['late go', 'late go'], 'the rivals who GOed 20 s after him have no run in HIS match');
  assert.ok(G3.played.every(u => u === 'c') && G3.played.length <= 1, 'at most the early bird himself played — one real player = the solo rule (api/report.js)');
  // the host's podium (the director's scoring) agrees with the server on both guards
  const g1 = { ...createGame({ matchId: 'm0', settings: {}, participants: { a: true, b: true, c: true }, now: T0, seed: 'x' }), phase: 'play', playAt: S.playAt, seed: S.seed, g0: S.g0 };
  assert.equal(scoreRuns(g1, late, now, CODE).a.bad, 'late go'); assert.equal(scoreRuns(g1, noGo, now, CODE).a.bad, 'no go');
  assert.deepEqual(scoreRuns(g1, nodes, now, CODE), J.game.results, 'an honest match: the podium = the server, row for row (as before)');
  // THE FRESH-EYES REVIEW (finding 3 — THE SORE LOSER): b LOST and breaks his own log after the podium (the rules take a leaf for 3 h): a
  // junk chunk behind a hole — his whole log is refused (0 lanes), but his FIRST CHUNK still replays a hop: he stays a PLAYER who lost,
  // so a's win over him stands (he used to drop out of `played` → a 2-player match became a's solo run: no win)
  const sore = { ...nodes, b: { ...nodes.b, c: { ...nodes.b.c, 9999: { s: 'U1', at: now } } } };
  const G4 = jaywalkMatch({ code: CODE, matchId: 'm0', uids, nodes: sore });
  assert.deepEqual([G4.game.results.b.bad, G4.game.results.b.l, G4.played], ['chunks', 0, ['a', 'b']], 'a broken log: refused, 0 lanes — and still a player');
  const junkOnly = { ...nodes, c: { go: nodes.c.go, c: { 5: { s: 'U1', at: now } } } };
  assert.deepEqual(jaywalkMatch({ code: CODE, matchId: 'm0', uids, nodes: junkOnly }).played, ['a', 'b'], 'a seat with junk and no valid first chunk: still nobody (MUST 3 holds)');
  // the report reads `played`
  const rep = (await import('node:fs')).readFileSync(new URL('../api/report.js', import.meta.url), 'utf8');
  assert.ok(rep.includes('judged = M.game.results[uid] || null; matchPlayed = new Set(M.played || []);') && rep.includes('if (GO_TREES.has(gid)) { for (const u of goUids(t)) out.add(u); continue; }'));
});

test('THE PROOF PASS — A HOST HICCUP AT GO (HIGH RISE\'s REVIEW FIX A, ported): the host saw no GO for NO_GO_MS and marked the match UNPROVEN after everyone had started — a FIRST GO stamped BEFORE it gave up takes the mark back; one stamped after never moves a match on its stand-in', async () => {
  const { startOf, goBeforeGiveUp } = await import('../js/games/jaywalk/logic.js');
  const g0 = createGame({ matchId: 'm0', settings: {}, participants: { a: true, b: true, c: true }, now: T0, seed: 'x' });
  const giveUp = g0.playAt + NO_GO_MS, u = nextStep(g0, { now: giveUp, live: { runs: {} }, code: CODE });
  assert.ok(u.unproven === 1 && u.phaseStartAt === giveUp, 'the host\'s mirror was empty: it gave up');
  const gu = { ...g0, ...u };
  // the GOs were there all along (stamped in the count's last 2 s — before the give-up)
  const runs = { a: { go: g0.playAt - 1800 }, b: { go: g0.playAt - 1750 }, c: { go: g0.playAt - 1600 } }, S = matchStart(CODE, 'm0', runs);
  assert.ok(goBeforeGiveUp(gu, S));
  assert.deepEqual(startOf(gu, runs, CODE), S, 'a phone reads the GO from the nodes, unproven mark or not — it never leaves the GO\'s course');
  const back = nextStep(gu, { now: giveUp + 2500, live: { runs }, code: CODE });
  assert.deepEqual(back, { phase: 'play', phaseStartAt: S.playAt, playAt: S.playAt, seed: S.seed, g0: S.g0, unproven: null }, 'the mark is taken back: the GO\'s course + tick 0 (the patch moves the phase stamp — THE 3 S RULE)');
  const gp = { ...gu, ...back }; delete gp.unproven;
  assert.equal(nextStep(gp, { now: giveUp + 3000, live: { runs }, code: CODE, online: { a: true, b: true, c: true } }), null, 'the match runs on as a proven one');
  assert.deepEqual(startOf(gp, runs, CODE), S);
  // the match is then scored + counted as normal (the same rows as a match that never hiccuped)
  const { at, last } = MATCH;
  // a GO stamped AFTER the give-up (a phone that came back later) never moves a match already running on its stand-in
  const lateRuns = { a: { go: giveUp + 900 } }, L = matchStart(CODE, 'm0', lateRuns);
  assert.ok(!goBeforeGiveUp(gu, L));
  assert.deepEqual(startOf(gu, lateRuns, CODE), { g0: 0, playAt: gu.playAt, seed: gu.seed }, 'the phones stay on the stand-in');
  assert.equal(nextStep(gu, { now: giveUp + 2500, live: { runs: lateRuns }, code: CODE }), null, 'the host does not take the mark back');
  assert.equal(nextStep(gu, { now: gu.playAt + UNPROVEN_MS, live: { runs: lateRuns }, code: CODE }).phase, 'final', 'it ends by its clock, never counted');
  void at; void last;
  // the view: a run that ended while the match was marked unproven sends its end once proven again; a refresh never adopts from the game alone
  const v = (await import('node:fs')).readFileSync(new URL('../js/games/jaywalk/view.js', import.meta.url), 'utf8');
  assert.ok(v.includes("if (proven && mode === 'over' && !wroteE && run && isOver(run)) sendEnd();"), 'the end goes up once proven again — the match does not wait 18 s');
  assert.ok(v.includes('if (S && V && (course.seed !== S.seed || go !== S.playAt || course.cv !== V) && (runs || g.unproven)) {'), 'never adopted from the game alone while the proof mirror is on its way (the inbox, Nov 20 — HIGH RISE S4B\'s own fix)');
  assert.ok(v.includes('lateGo = !!myNode && goOf(myNode) > 0 && !onTime(myNode, firstGo(runs));') && v.includes('proven = !lateGo && ((haveGo && !g.unproven && mine(g)) || everProven);'), 'a GO of this phone\'s own past the window: nothing is written for it');
});
