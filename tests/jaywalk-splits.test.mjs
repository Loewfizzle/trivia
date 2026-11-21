// JAYWALK J1 — SPLIT TIMES (PURE — THE UNIT JOB INSTALLS NOTHING; docs/jaywalk.md "SPLIT TIMES"): the engine records the tick each multiple
// of 50 lanes is FIRST reached; the phone's engine, the host's podium (THE JUDGE) and the SERVER's replay agree on every split for real
// bot-played runs — solo (jaywalkSolo), match (jaywalkMatch) and the daily (scoreTry); a run that never reaches 50 has none; the server's
// BEST splits (core/splits.js#splitBests through progress.js#matchStep + jaywalk-credit.js#creditTry): a new best only when FASTER; a refused
// run records nothing; the end card's clock words.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SPLIT_EVERY, TICK_HZ } from '../js/games/jaywalk/tuning.js';
import { createCourse } from '../js/games/jaywalk/course.js';
import { createRun, step, isOver, resultOf, canLog } from '../js/games/jaywalk/engine.js';
import { greedyBot } from '../js/games/jaywalk/bot.js';
import { packLog, replay } from '../js/games/jaywalk/replay.js';
import { seedOf, matchStart, scoreNode } from '../js/games/jaywalk/logic.js';
import { jaywalkSolo, jaywalkMatch, serverRow, verifyRun } from '../api/_lib/jaywalk.js';
import { scoreTry, CAP_MS, GRACE_MS } from '../api/_lib/jaywalk-tries.js';
import { creditTry } from '../api/_lib/jaywalk-credit.js';
import { splitBests, cleanSplits, splitClock, splitGain, splitLane, SPLIT_MAX } from '../js/core/splits.js';
import { extractMatch } from '../js/core/match-report.js';
import { matchStep } from '../js/core/progress.js';
import { readFileSync } from 'node:fs';

const T0 = 1_800_000_000_000;
/** the greedy bot plays a `mode` run on `seed` (the recorder's own bounds) → { log, live: the phone's own result, firsts: the tick each 50 was first reached } */
function played(seed, mode, { maxTicks = 3 * 60 * TICK_HZ, botSeed = seed, stopBelow = null } = {}) {
  const run = createRun({ seed, mode }), course = createCourse(seed), bot = greedyBot({ seed: botSeed }), log = [], firsts = [];
  let best = 0;
  while (!isOver(run) && run.t < maxTicks) {
    let d = bot(run, course) || '';
    if (stopBelow != null && run.best >= stopBelow) d = '';
    if (d && !canLog(log, run.t, d, mode)) d = '';
    if (d) log.push({ t: run.t, d });
    step(run, course, d);
    while (run.best > best) { best++; if (best % SPLIT_EVERY === 0) firsts.push(run.bestT); }
  }
  while (!isOver(run)) step(run, course, '');
  return { log, live: resultOf(run), firsts };
}
/** the proof node's chunks, every second of the run's own clock (+ a 200 ms lag), tick 0 = t0 */
function chunks(log, t0) {
  const c = {}, per = TICK_HZ;
  let from = 0, k = 0;
  for (let t = per; from < log.length; t += per) {
    let to = from; while (to < log.length && log[to].t < t) to++;
    if (to > from) { c[k++] = { s: packLog(log.slice(0, to), from), at: t0 + Math.round(t * 1000 / TICK_HZ) + 200 }; from = to; }
  }
  return c;
}

test('THE ENGINE: sp[i] = the tick lane (i + 1) × 50 was FIRST landed on — one per multiple reached, rising; the replay returns the same', () => {
  let some = 0;
  for (const s of ['sp-a', 'sp-b', 'sp-c', 'sp-d']) {
    const seed = `g${s}`, h = played(seed, 'solo');
    assert.deepEqual(h.live.splits, h.firsts, `${seed}: the engine's splits = the lanes' own first ticks`);
    assert.equal(h.live.splits.length, Math.floor(h.live.lanes / SPLIT_EVERY), `${seed}: one split per 50 reached (${h.live.lanes} lanes)`);
    for (let i = 1; i < h.live.splits.length; i++) assert.ok(h.live.splits[i] > h.live.splits[i - 1]);
    assert.deepEqual(replay({ seed, mode: 'solo', log: h.log }).splits, h.live.splits, `${seed}: the replay = the live run`);
    some += h.live.splits.length;
  }
  assert.ok(some >= 4, `the bots reached real splits (${some})`);
});

test('A RUN THAT NEVER REACHES 50 has no splits — not in the engine, the host\'s row, the server\'s row, the daily try', () => {
  const seed = 'gshort', h = played(seed, 'solo', { stopBelow: 30 });
  assert.ok(h.live.lanes < 50 && h.live.lanes > 0, `a short run (${h.live.lanes})`);
  assert.deepEqual(h.live.splits, []);
  const go = T0, node = { go, c: chunks(h.log, go), e: { l: h.live.lanes, t: h.live.tick } }, sseed = seedOf('ROOM', 'm1', go);
  const h2 = played(sseed, 'solo', { stopBelow: 30 }), n2 = { go, c: chunks(h2.log, go), e: {} };
  const S = jaywalkSolo({ code: 'ROOM', matchId: 'm1', uid: 'u', node: n2 });
  assert.ok(S.v.ok); assert.equal('sp' in S.game.results.u, false);
  assert.equal('sp' in scoreNode({ seed: sseed, mode: 'solo', node: n2, t0: go }), false);
  void node;
});

test('SOLO: the phone\'s engine = the host\'s podium row = THE SERVER\'s replay, split for split', () => {
  for (const m of ['s1', 's2', 's3']) {
    const go = T0 + 7777, seed = seedOf('ROOM', m, go), h = played(seed, 'solo');
    const node = { go, c: chunks(h.log, go), e: { l: h.live.lanes, t: h.live.tick, w: h.live.cause } };
    const S = jaywalkSolo({ code: 'ROOM', matchId: m, uid: 'u1', node }), host = scoreNode({ seed, mode: 'solo', node, t0: go });
    assert.ok(S.v.ok, `${m}: counted (${S.v.why || ''})`);
    const want = h.live.splits.length ? h.live.splits : undefined;
    assert.deepEqual(S.game.results.u1.sp, want, `${m}: the server's splits = the phone's (${h.live.lanes} lanes)`);
    assert.deepEqual(host.sp, want, `${m}: the host's row = the phone's`);
  }
});

test('MATCH: every player\'s splits — the phones\' engines = the server\'s jaywalkMatch rows (THE FIRST GO\'s course + tick 0)', () => {
  const gos = { a: T0 + 100, b: T0 + 400, c: T0 + 900 }, nodes0 = { a: { go: gos.a }, b: { go: gos.b }, c: { go: gos.c } };
  const S = matchStart('ROOM', 'mm', nodes0), nodes = {}, lives = {};
  for (const u of ['a', 'b', 'c']) {
    const h = played(S.seed, 'match', { botSeed: `bot-${u}` });
    lives[u] = h.live;
    nodes[u] = { go: gos[u], c: chunks(h.log, S.playAt), e: { l: h.live.lanes, t: h.live.tick, w: h.live.cause } };
  }
  const M = jaywalkMatch({ code: 'ROOM', matchId: 'mm', uids: ['a', 'b', 'c'], nodes });
  assert.ok(M.game, `the match counted (${M.why || ''})`);
  let n = 0;
  for (const u of ['a', 'b', 'c']) { const want = lives[u].splits.length ? lives[u].splits : undefined; n += lives[u].splits.length; assert.deepEqual(M.game.results[u].sp, want, `${u}: ${lives[u].lanes} lanes`); }
  assert.ok(n >= 2, `real splits in the match (${n})`);
});

test('THE DAILY: a try\'s splits from its proof node (mode daily, tick 0 = the server\'s go) = the phone\'s; the try keeps them compact', () => {
  const seed = 'd20261121x', go = 5_000_000, h = played(seed, 'daily', { maxTicks: 1e9 });
  const node = { go, z: go + CAP_MS + GRACE_MS, c: chunks(h.log, go) };
  const t = scoreTry({ seed, go, z: node.z, node });
  assert.ok(!t.bad, t.bad);
  assert.deepEqual(t.sp, h.live.splits.length ? h.live.splits : undefined, `the try's splits = the phone's (${h.live.lanes} lanes)`);
  assert.ok(h.live.splits.length >= 1, `the daily bot reached a split (${h.live.lanes})`);
  assert.ok(JSON.stringify(t.sp).length < 80, 'compact: the ticks only');
});

test('A REFUSED / BAD RUN records nothing: a forged log → no splits on the host\'s row, the server\'s row, the match report row', () => {
  const go = T0, seed = seedOf('ROOM', 'bad', go), h = played(seed, 'solo');
  assert.ok(h.live.splits.length >= 1);
  const fast = h.log.map(x => ({ ...x, t: Math.floor(x.t / 3) * 2 + x.t % 2 }));   // (inputs too close: the bounds refuse it)
  const node = { go, c: { 0: { s: packLog(fast), at: go + 1000 } } };
  const row = scoreNode({ seed, mode: 'solo', node, t0: go });
  assert.ok(row.bad, `refused (${row.bad})`); assert.equal('sp' in row, false);
  assert.equal('sp' in serverRow(verifyRun({ seed, mode: 'solo', log: fast })), false);
  const game = { id: 'jaywalk', matchId: 'bad', phase: 'final', mode: 'solo', sv: 1, participants: { u: true }, settings: {}, results: { u: { ...serverRow({ ok: false, why: 'too fast' }), sp: [100, 200] } } };
  const ex = extractMatch(game);
  assert.equal(ex.rows.u ? ex.rows.u.sp : undefined, undefined, 'a refused row never carries splits into the credit');
});

test('THE BEST SPLITS (core/splits.js#splitBests): a first reach becomes the best (never NEW BEST) · only FASTER is new · equal / slower nothing', () => {
  let S = splitBests(null, [1800, 4000]);
  assert.deepEqual(S.next, [1800, 4000]); assert.deepEqual(S.news, []); assert.equal(S.changed, true);
  S = splitBests([1800, 4000], [1700, 4100, 6000]);
  assert.deepEqual(S.next, [1700, 4000, 6000]); assert.deepEqual(S.news, [{ i: 0, at: 50, tick: 1700, prev: 1800 }]);
  S = splitBests([1700, 4000], [1700, 4000]);
  assert.equal(S.changed, false); assert.deepEqual(S.news, []);
  S = splitBests({ 0: 1700, 1: 4000 }, { 0: 1600 });   // (the database's object form both ways)
  assert.deepEqual(S.next, [1600, 4000]); assert.equal(S.news.length, 1);
  assert.deepEqual(cleanSplits([5, 3, 9]), [5], 'a list that runs backwards ends there');
  assert.deepEqual(cleanSplits(['x', 3]), []);
  assert.equal(cleanSplits(Array.from({ length: 99 }, (_, i) => i + 1)).length, SPLIT_MAX);
  assert.equal(splitLane(0), 50); assert.equal(splitLane(3), 200);
});

test('THE SERVER KEEPS THEM (a counted solo run → matchStep): pstats.jsp + the outcome { r, b, n } — NEW BEST only for a faster split', () => {
  const mk = (sp, m) => ({ id: 'jaywalk', matchId: m, phase: 'final', mode: 'solo', sv: 1, participants: { u: true }, settings: {}, results: { u: { l: 120, t: 5000, w: 'car', e: 5100, sp } } });
  const ex1 = extractMatch(mk([1800, 4000], 'r1'));
  assert.deepEqual(ex1.rows.u.sp, [1800, 4000]);
  const a = matchStep(null, { key: 'k1', gid: 'jaywalk', row: ex1.rows.u, n: 1, now: T0, gap: 0 });
  assert.deepEqual(a.next.jsp, [1800, 4000]); assert.deepEqual(a.sp, { r: [1800, 4000], b: [1800, 4000], n: [] });
  const ex2 = extractMatch(mk([1900, 3900], 'r2'));
  const b = matchStep(a.next, { key: 'k2', gid: 'jaywalk', row: ex2.rows.u, n: 1, now: T0 + 60_000, gap: 0 });
  assert.deepEqual(b.next.jsp, [1800, 3900]); assert.deepEqual(b.sp.n, [{ i: 1, at: 100, tick: 3900, prev: 4000 }]);
  const c = matchStep(b.next, { key: 'k3', gid: 'jaywalk', row: extractMatch(mk(undefined, 'r3')).rows.u, n: 1, now: T0 + 120_000, gap: 0 });
  assert.deepEqual(c.next.jsp, [1800, 3900], 'a run with no split keeps the bests'); assert.equal(c.sp, undefined);
  // (an unverified solo row — no `sv` — never reaches the bests)
  const un = extractMatch({ ...mk([10, 20], 'r4'), sv: 0 });
  assert.equal(un.rows.u.sp, undefined);
});

test('THE DAILY KEEPS THEM (jaywalk-credit.js#creditTry): the try\'s splits → pstats.jsp; nothing new = `next` null + the answer still says them', () => {
  const s0 = { xp: 10, b: {}, pa: {} };
  const a = creditTry(s0, { lanes: 120, feats: '', splits: [1800, 4000], now: T0 });
  assert.deepEqual(a.next.jsp, [1800, 4000]); assert.deepEqual(a.sp.n, []);
  const b = creditTry(a.next, { lanes: 60, feats: '', splits: { 0: 1700 }, now: T0 });
  assert.deepEqual(b.next.jsp, [1700, 4000]); assert.deepEqual(b.sp.n, [{ i: 0, at: 50, tick: 1700, prev: 1800 }]);
  const c = creditTry(b.next, { lanes: 60, feats: '', splits: [1750], now: T0 });
  assert.equal(c.next, null, 'nothing to write'); assert.deepEqual(c.sp, { r: [1750], b: [1700, 4000], n: [] });
  assert.equal(creditTry(b.next, { lanes: 0, feats: '', splits: null, now: T0 }), null);
  const daily = readFileSync(new URL('../api/daily.js', import.meta.url), 'utf8');
  assert.match(daily, /return res && res\.next \? res\.next : undefined/, 'the transaction never commits a null (it would delete pstats)');
});

test('THE END CARD\'s words: m:ss from the ticks · the gain −0:04 · the card wired on every end (solo, match, the local end, the daily)', () => {
  assert.equal(splitClock(0), '0:00'); assert.equal(splitClock(59), '0:00'); assert.equal(splitClock(60 * 61), '1:01'); assert.equal(splitClock(21600), '6:00');
  assert.equal(splitGain(1700, 1940), '−0:04'); assert.equal(splitGain(1700, 1710), '−0:01', 'a faster split always shows a gain');
  const v = readFileSync(new URL('../js/games/jaywalk/victory.js', import.meta.url), 'utf8'), vw = readFileSync(new URL('../js/games/jaywalk/view.js', import.meta.url), 'utf8'), dr = readFileSync(new URL('../js/games/jaywalk/daily-run.js', import.meta.url), 'utf8');
  assert.equal((v.match(/const SC = addSplits\(el, game, uid\)/g) || []).length, 2, 'solo + match');
  assert.match(vw, /keepOwnSplits\(matchId, run\.sp\)/); assert.match(vw, /splitsCard\(run\.sp\)/); assert.match(vw, /D\.end\(isOver\(run\), lineOf\(run, course\), run\.sp\.slice\(\)\)/);
  assert.match(dr, /splitsCard\(sp\)/); assert.match(dr, /splits\.server\(/);
});
