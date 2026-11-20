// HIGH RISE S4B — THE MATCH, the unit half (docs/highrise.md "THE MATCH"; JAYWALK's match is the pattern — tests/jaywalk-match.test.mjs):
// the PURE director (count → play → final), THE FIRST GO, whole-match sims with 2 and 8 players (a replayed step = the same patch — a
// host migration), the end's rules (every `e` · a dead phone · a dropped signal · the 6:00 cap · UNPROVEN), THE RANKING + Call the
// Winner, THE RIVALS (rivals.js), and the server's own count of the same nodes (api/_lib/highrise.js#highriseMatch — it agrees to the floor).
// The browser + emulator halves: tests/integration/e2e-highrise-match.mjs · highrise-rivals.mjs · server.test.mjs "HIGH RISE S4B".
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGame, nextStep, endNow, scoreMatchNode } from '../js/games/highrise/director.js';
import { COUNT_MS, NO_GO_MS, END_GRACE_MS, DROP_WAIT_MS, IDLE_OUT_MS, UNPROVEN_MS, CALL_WINDOW_MS, CALL_MS, MATCH_MIN, MATCH_MAX, startOf, capAt, tickAt, endedFor, lastSeen, scoreCalls, nightBonus, stoodToEnd, ordinal } from '../js/games/highrise/match.js';
import { seedOf, gameStandings, matchStart, firstGo, GO_LEAD_MS, modeOf } from '../js/games/highrise/logic.js';
import { CLOCK, packFrom } from '../js/games/highrise/proof.js';
import { judgeRun } from '../js/games/highrise/replay.js';
import { BOTS, gaussBot, playBot } from '../js/games/highrise/bot.js';
import { createRun, stepTo, tap, isOver, resultOf } from '../js/games/highrise/engine.js';
import { TICK_HZ, MODES, BEAT, FLOOR_TICKS_MAX } from '../js/games/highrise/tuning.js';
import { createRival, resetRival, feedRival, capRival, rivalOver, rivalEnd, rivalSilent, drawTick, entryTick, matchCalls, nearest, rivalTag, mergeTags, passStep, altOrder, follow, nextFollow, RIVALS_SHOWN } from '../js/games/highrise/rivals.js';
import { highriseMatch, hrPlayed, HR_PLAYED_FLOOR } from '../api/_lib/highrise.js';
import { callBonus } from '../js/core/playlist.js';
import * as IDX from '../js/games/highrise/meta.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const CODE = 'MOON', M = 'mabc123', T0 = 1_800_000_000_000;
const ms = tick => Math.round(tick * 1000 / TICK_HZ);
/** the players' ids: u1 … un */
const ids = n => Array.from({ length: n }, (_, i) => `u${i + 1}`);
const parts = n => Object.fromEntries(ids(n).map(u => [u, true]));
/** an HONEST match node: its GO (a server time), one chunk a tap arriving `lag` ms after it on the MATCH's clock (tick 0 = playAt) */
function nodeOf(taps, go, playAt, { lag = 250, e = null, upTo = Infinity } = {}) {
  const c = {};
  let i = 0;
  for (let k = 0; k < taps.length && taps[k] <= upTo; k++) c[i++] = { s: packFrom(taps, k, k + 1), at: playAt + ms(taps[k]) + lag };
  return { go, ...(i ? { c } : {}), ...(e ? { e } : {}) };
}
/** a bot's whole MATCH run on a seed (σ ms) → its taps + the judge's own result */
function botRun(seed, sigma, tag) {
  const taps = playBot(createRun({ seed, mode: 'match' }), gaussBot({ sigmaMs: sigma, seed: `m${tag}` }));
  return { taps, want: judgeRun({ seed, mode: 'match', taps }) };
}
/** a whole match: n players' GOs land (the first at g0), the count ends, everyone plays a bot's run, every `e` lands → the game at each step */
function playMatch(n, { sigmas = [60, 40, 25, 10, 60, 40, 25, 60], goGap = 37 } = {}) {
  const P = parts(n), us = ids(n);
  let g = createGame({ matchId: M, settings: {}, participants: P, now: T0, seed: 'stand-in' });
  const gos = Object.fromEntries(us.map((u, i) => [u, T0 + COUNT_MS - 1500 + ((i * 7) % n) * goGap]));   // (the GOs land in a shuffled order)
  const g0 = Math.min(...Object.values(gos)), S = { g0, playAt: g0 + GO_LEAD_MS, seed: seedOf(CODE, M, g0) };
  const runs0 = Object.fromEntries(us.map(u => [u, { go: gos[u] }]));
  const bots = Object.fromEntries(us.map((u, i) => [u, botRun(S.seed, sigmas[i % sigmas.length], u)]));
  const nodesAt = now => Object.fromEntries(us.map(u => { const b = bots[u], end = ms(b.want.end), over = now >= S.playAt + end + 400; return [u, nodeOf(b.taps, gos[u], S.playAt, { upTo: Math.floor((now - S.playAt - 250) * TICK_HZ / 1000), e: over ? { f: b.want.floor, t: b.want.tick, w: b.want.cause } : null })]; }));
  return { g, P, us, gos, S, runs0, bots, nodesAt };
}

test('THE MATCH IS A ROOM OF 2 … 8 (index.js#start); one player = THE SOLO RUN; the game frame: count first, its seed picked AFTER GO', () => {
  assert.equal(MATCH_MIN, 2); assert.equal(MATCH_MAX, 8); assert.equal(modeOf(parts(1)), 'solo'); assert.equal(modeOf(parts(2)), 'match');
  const idx = read('js/games/highrise/index.js');
  assert.match(idx, /const n = Object\.keys\(participants \|\| \{\}\)\.length;\n  if \(n < 1 \|\| n > MATCH_MAX\) return null;/, '1 … 8 start; nothing else');
  assert.match(idx, /export const step = \(game, \{ now, live, code, online \}\) => nextStep\(game, \{ now, live, code, online \}\);/); assert.match(idx, /export const nightBonus = bonus;/);
  assert.equal(IDX.SOLO, true, 'PLAY NOW still starts it alone');
  const g = createGame({ matchId: M, settings: {}, participants: parts(3), now: T0, seed: 'x' });
  assert.deepEqual({ phase: g.phase, mode: g.mode, seed: g.seed, playAt: g.playAt }, { phase: 'count', mode: 'match', seed: '', playAt: T0 + COUNT_MS }, 'a match: the count, no seed yet');
  assert.equal(DROP_WAIT_MS, CLOCK.drop, 'the room waits for a dropped signal as long as the judge forgives one'); assert.equal(CALL_WINDOW_MS, CALL_MS + 6000);
});

test('GO — THE SEED IS PICKED AFTER GO: THE FIRST GO among the proof nodes sets the seed + tick 0 for everyone (the step count → play writes them); a step replayed = the same patch (a host migration); no GO at all → UNPROVEN', () => {
  for (const n of [2, 8]) {
    const { g, S, runs0, gos } = playMatch(n);
    assert.equal(nextStep(g, { now: T0 + 500, live: { runs: {} }, code: CODE }), null, 'the count: nothing yet');
    assert.equal(firstGo(runs0), S.g0); assert.deepEqual(matchStart(CODE, M, runs0), S);
    assert.equal(nextStep(g, { now: S.playAt - 1, live: { runs: runs0 }, code: CODE }), null, 'the first GO is in — the count holds until tick 0');
    const a = nextStep(g, { now: S.playAt, live: { runs: runs0 }, code: CODE }), b = nextStep(g, { now: S.playAt + 900, live: { runs: runs0 }, code: CODE });
    assert.deepEqual(a, { phase: 'play', phaseStartAt: S.playAt, playAt: S.playAt, seed: S.seed, g0: S.g0 });
    assert.deepEqual(b, a, `${n} players: the same step from another host a moment later = the SAME patch`);
    // a LATER GO never moves it (the server stamps on arrival: a later arrival carries a later time)
    assert.deepEqual(matchStart(CODE, M, { ...runs0, late: { go: Math.max(...Object.values(gos)) + 5000 } }), S);
    // THE NODES ARE THE TRUTH: a phone reads the seed + tick 0 from the nodes — in the count and in play alike
    assert.deepEqual(startOf(g, runs0, CODE), S); assert.deepEqual(startOf({ ...g, ...a, seed: 'wrong', playAt: 1 }, runs0, CODE), S, 'whatever the game says');
    assert.equal(startOf(g, {}, CODE), null, 'no node, still counting: not known yet');
  }
  // no GO anywhere (no signal, the rules not published): the match plays UNPROVEN — a seed of its own, never counted
  const g = createGame({ matchId: M, settings: {}, participants: parts(2), now: T0, seed: 'x' });
  assert.equal(nextStep(g, { now: g.playAt + NO_GO_MS - 1, live: { runs: {} }, code: CODE }), null);
  const u = nextStep(g, { now: g.playAt + NO_GO_MS, live: { runs: {} }, code: CODE });
  assert.ok(u && u.phase === 'play' && u.unproven === 1 && u.seed && u.playAt === g.playAt + NO_GO_MS + 800);
  const gu = { ...g, ...u };
  assert.deepEqual(startOf(gu, { u1: { go: gu.phaseStartAt + 1 } }, CODE), { g0: 0, playAt: gu.playAt, seed: gu.seed }, 'an unproven match plays the game stand-in (a GO stamped AFTER the host gave up never moves it — REVIEW FIX A)');
  assert.equal(nextStep(gu, { now: gu.playAt + UNPROVEN_MS - 1, live: { runs: {} }, code: CODE }), null);
  const fu = nextStep(gu, { now: gu.playAt + UNPROVEN_MS, live: { runs: {} }, code: CODE });
  assert.ok(fu.phase === 'final' && Object.values(fu.results).every(r => r.f === 0) && !fu.calls, 'it ends after 90 s, with nothing to count');
});

test('A WHOLE MATCH, 2 and 8 players: the match ends when EVERY run has ended; the results are THE JUDGE\'s replay of each node (never the `e` a phone wrote); THE RANKING = the floor, then the most perfects, then the earlier tick; the server agrees to the floor', () => {
  for (const n of [2, 8]) {
    const { g, us, S, bots, nodesAt, runs0 } = playMatch(n);
    const play = { ...g, ...nextStep(g, { now: S.playAt, live: { runs: runs0 }, code: CODE }) };
    const lastEnd = Math.max(...us.map(u => ms(bots[u].want.end)));
    // mid-match: someone is still climbing
    assert.equal(nextStep(play, { now: S.playAt + 5000, live: { runs: nodesAt(S.playAt + 5000) }, code: CODE, online: parts(n) }), null);
    const before = S.playAt + lastEnd + 200, after = S.playAt + lastEnd + 700;
    assert.equal(nextStep(play, { now: before, live: { runs: nodesAt(before) }, code: CODE, online: parts(n) }), null, 'the last tower\'s end has not been signalled yet');
    const fin = nextStep(play, { now: after, live: { runs: nodesAt(after) }, code: CODE, online: parts(n) });
    assert.equal(fin.phase, 'final');
    assert.deepEqual(nextStep(play, { now: after, live: { runs: nodesAt(after) }, code: CODE, online: parts(n) }), fin, 'replayed = the same patch');
    for (const u of us) {
      const w = bots[u].want, r = fin.results[u];
      assert.deepEqual({ f: r.f, p: r.p, t: r.t, w: r.w, e: r.e }, { f: w.floor, p: w.perfects, t: w.tick, w: w.cause, e: w.end }, `${u}: the row = the judge's own replay`);
      assert.ok(!r.bad && !r.cut && !('go' in r), 'an honest node: counted in full (a match row carries no GO of its own)');
    }
    // a phone's own `e` is a SIGNAL, never a score
    const lying = nodesAt(after); lying.u1 = { ...lying.u1, e: { f: 999, t: 1, w: 'made' } };
    assert.equal(nextStep(play, { now: after, live: { runs: lying }, code: CODE }).results.u1.f, bots.u1.want.floor, 'e.f = 999 is never read');
    // THE RANKING
    const st = gameStandings({ ...play, ...fin });
    const sorted = us.map(u => ({ u, ...bots[u].want })).sort((a, b) => b.floor - a.floor || b.perfects - a.perfects || a.tick - b.tick);
    assert.deepEqual(st.map(r => r.uid), sorted.map(r => r.u), `${n} players: floor, then the most perfects, then the earlier tick`);
    assert.equal(st[0].rank, 1); assert.equal(st[0].score, sorted[0].floor);
    // THE SERVER's own count of the same nodes: every row equal
    const srv = highriseMatch({ code: CODE, matchId: M, uids: us, nodes: nodesAt(after) });
    assert.ok(srv.game && srv.game.sv === 1 && srv.game.seed === S.seed && srv.game.playAt === S.playAt);
    for (const u of us) assert.deepEqual({ f: srv.game.results[u].f, p: srv.game.results[u].p, t: srv.game.results[u].t, w: srv.game.results[u].w }, { f: fin.results[u].f, p: fin.results[u].p, t: fin.results[u].t, w: fin.results[u].w }, `${u}: the server's replay == the host's podium`);
    // END GAME (the host's): the runs as they stand
    assert.equal(endNow(play, { now: S.playAt + 3000, live: { runs: nodesAt(S.playAt + 3000) }, code: CODE }).phase, 'final');
  }
});

test('THE END\'s RULES: a DEAD PHONE online is waited for IDLE_OUT (the fuse has ended that tower) · OFFLINE + the dropped signal\'s 75 s · floor 200 = the finish (MADE IT) · the 6:00 cap ends everyone where they stand (TIME\'S UP) · a tie at floor 200 → the most perfects', () => {
  const g0 = T0 + 2000, S = { g0, playAt: g0 + GO_LEAD_MS, seed: seedOf(CODE, M, g0) };
  const game = { ...createGame({ matchId: M, settings: {}, participants: parts(2), now: T0, seed: 'x' }), phase: 'play', playAt: S.playAt, seed: S.seed, g0 };
  // u1 plays to the end of a sloppy run; u2's phone dies after 5 taps (no `e` ever)
  const a = botRun(S.seed, 60, 'a'), b = botRun(S.seed, 10, 'b'), dead = b.taps.slice(0, 5);
  const n1 = nodeOf(a.taps, g0, S.playAt, { e: { f: 1, t: 1 } }), n2 = nodeOf(dead, g0 + 20, S.playAt);
  const seen = lastSeen(game, n2);
  assert.equal(seen, S.playAt + ms(dead[4]) + 250, 'their proof last moved at their last chunk');
  assert.ok(!endedFor(game, n2, seen + IDLE_OUT_MS - 1, true) && endedFor(game, n2, seen + IDLE_OUT_MS, true), 'online + silent: out after IDLE_OUT');
  assert.ok(!endedFor(game, n2, seen + IDLE_OUT_MS + DROP_WAIT_MS - 1, false) && endedFor(game, n2, seen + IDLE_OUT_MS + DROP_WAIT_MS, false), 'offline: + the dropped signal\'s wait');
  assert.ok(endedFor(game, undefined, S.playAt + IDLE_OUT_MS, true), 'a seat that never wrote a GO');
  const late = Math.max(S.playAt + ms(a.want.end) + 500, seen + IDLE_OUT_MS);
  assert.equal(nextStep(game, { now: late - 1 < seen + IDLE_OUT_MS ? late - 1 : seen + IDLE_OUT_MS - 1, live: { runs: { u1: n1, u2: n2 } }, code: CODE, online: { u1: true, u2: true } }), null);
  const fin = nextStep(game, { now: late, live: { runs: { u1: n1, u2: n2 } }, code: CODE, online: { u1: true, u2: true } });
  const wd = judgeRun({ seed: S.seed, mode: 'match', taps: dead });
  assert.deepEqual({ f: fin.results.u2.f, w: fin.results.u2.w }, { f: wd.floor, w: 'slow' }, 'the dead phone\'s tower: its 5 floors, then THE FUSE (TOO SLOW)');
  assert.equal(nextStep(game, { now: late, live: { runs: { u1: n1, u2: n2 } }, code: CODE, online: { u1: true } }), null, 'OFFLINE: the room still waits for the dropped signal');
  // THE FINISH + a tie on floor 200: two machines — the one with more perfects wins
  const p1 = playBot(createRun({ seed: S.seed, mode: 'match' }), gaussBot({ sigmaMs: 2, seed: 'p1' })), p2 = playBot(createRun({ seed: S.seed, mode: 'match' }), gaussBot({ sigmaMs: 12, seed: 'p2' }));
  const j1 = judgeRun({ seed: S.seed, mode: 'match', taps: p1 }), j2 = judgeRun({ seed: S.seed, mode: 'match', taps: p2 });
  assert.ok(j1.made && j1.floor === 200 && j1.cause === 'made' && j2.floor === 200 && j1.perfects > j2.perfects, `both finished on floor 200 (${j1.perfects} vs ${j2.perfects} perfects)`);
  const nf = { u1: nodeOf(p2, g0, S.playAt, { e: { f: 200, t: 1 } }), u2: nodeOf(p1, g0 + 9, S.playAt, { e: { f: 200, t: 1 } }) };
  const ff = nextStep(game, { now: S.playAt + ms(Math.max(j1.end, j2.end)) + 800, live: { runs: nf }, code: CODE });
  assert.deepEqual(gameStandings({ ...game, ...ff }).map(r => [r.uid, r.rank]), [['u2', 1], ['u1', 2]], 'the same floor: THE MOST PERFECTS takes it');
  assert.ok(stoodToEnd(ff.results.u1) && stoodToEnd(ff.results.u2));
  // THE CAP: nobody's `e` is needed — 6:00 + the grace ends the match; a tower still standing reads TIME'S UP
  const cap = capAt(game);
  assert.equal(cap, S.playAt + ms(MODES.match.capTicks)); assert.equal(tickAt(game, cap), MODES.match.capTicks);
  // (a slow, careful player: every slab dropped on its SECOND pass — dead on, twice the time: the cap comes first)
  const slowRun = createRun({ seed: S.seed, mode: 'match' }), slow = [];
  while (!isOver(slowRun)) { stepTo(slowRun, slowRun.s0); if (slowRun.st !== 'slide') break; const tk = slowRun.s0 + Math.floor(slowRun.S / 2) + slowRun.S; if (!tap(slowRun, tk)) break; slow.push(tk); }
  stepTo(slowRun, MODES.match.capTicks);
  assert.equal(resultOf(slowRun).cause, 'cap');
  const nc = { u1: nodeOf(slow, g0, S.playAt), u2: nodeOf(a.taps, g0 + 5, S.playAt, { e: { f: 1, t: 1 } }) };
  assert.equal(nextStep(game, { now: cap + END_GRACE_MS - 1, live: { runs: nc }, code: CODE, online: parts(2) }), null, 'u1 still climbs: the match goes on to the cap');
  const fc = nextStep(game, { now: cap + END_GRACE_MS, live: { runs: nc }, code: CODE, online: parts(2) });
  assert.deepEqual({ w: fc.results.u1.w, f: fc.results.u1.f }, { w: 'cap', f: resultOf(slowRun).floor }, 'TIME\'S UP — scored where the tower stood');
  assert.ok(fc.results.u1.f > fc.results.u2.f && fc.results.u1.f < 200);
});

test('CALL THE WINNER (the kit\'s piece, scored here): a call counts when the caller was OUT, named a player still in then, in time; right = that player won; the bonus = callBonus(the players still in); never for one who stood to the end', () => {
  const game = { participants: parts(4), playAt: T0, mode: 'match' };
  // u1 wins (floor 150, out at tick 9000) · u2 floor 90 (out at 5000) · u3 floor 40 (out at 2000) · u4 floor 20 (out at 1000)
  const results = { u1: { f: 150, p: 100, t: 8900, w: 'miss', e: 9000 }, u2: { f: 90, p: 50, t: 4900, w: 'thin', e: 5000 }, u3: { f: 40, p: 20, t: 1900, w: 'slow', e: 2000 }, u4: { f: 20, p: 5, t: 900, w: 'miss', e: 1000 } };
  const at = tick => T0 + ms(tick);
  // (THE PROOF PASS: every player's node carries its GO — a player with NO run can not be named, and is not counted as "still in")
  const GO = T0 - 2000, go = r => { const o = {}; for (const u of ['u1', 'u2', 'u3', 'u4']) o[u] = { go: GO, ...(r[u] || {}) }; return o; };
  const runs = go({
    u4: { k: { w: 'u1', at: at(1000) + 4000 } },               // out first, called the winner in time → right, 3 still in
    u3: { k: { w: 'u2', at: at(2000) + 3000 } },               // called u2 (still in then) → wrong
    u2: { k: { w: 'u4', at: at(5000) + 2000 } },               // called a player ALREADY out → no call
    u1: { k: { w: 'u2', at: at(9000) + 1000 } },               // the winner "calling" after everyone was out → no call
  });
  const calls = scoreCalls(game, runs, results);
  assert.deepEqual(calls, { u4: { w: 'u1', ok: true, bonus: callBonus(3) }, u3: { w: 'u2', ok: false, bonus: 0 } });
  assert.deepEqual(nightBonus({ calls }), { u4: callBonus(3) });
  assert.deepEqual(scoreCalls(game, go({ u4: { k: { w: 'u1', at: at(1000) + CALL_WINDOW_MS + 1 } } }), results), {}, 'too late: no call');
  assert.deepEqual(scoreCalls(game, go({ u4: { k: { w: 'u4', at: at(1000) } } }), results), {}, 'never yourself');
  // THE PROOF PASS — the inbox's (3) + the review's NICE: a player with NO RUN (no GO / a GO past the window) is never "still in" — not
  // nameable, not counted in the bonus; a FULL DRAW pays nobody
  const noRun = go({ u4: { k: { w: 'u1', at: at(1000) + 4000 } } }); delete noRun.u2.go;
  assert.deepEqual(scoreCalls(game, noRun, results), { u4: { w: 'u1', ok: true, bonus: callBonus(2) } }, 'u2 has no run: two were still in, not three');
  const named = go({ u4: { k: { w: 'u1', at: at(1000) + 4000 } } }); named.u1.go = GO + 5001;
  assert.deepEqual(scoreCalls(game, named, results), {}, 'the named player\'s GO was past the window: no run, no call');
  const draw = { u1: { f: 0, p: 0, t: 0, w: 'slow', e: 300 }, u2: { f: 0, p: 0, t: 0, w: 'slow', e: 300 }, u3: { f: 0, p: 0, t: 0, w: 'slow', e: 300 }, u4: { f: 0, p: 0, t: 0, w: 'miss', e: 100 } };
  assert.deepEqual(scoreCalls(game, go({ u4: { k: { w: 'u1', at: at(100) + 1000 } } }), draw), {}, 'everyone tied for first: a full draw pays nobody');
  // a player who stood to the end (the finish / the cap) was never out: no call of theirs counts — and a call FOR them can win
  const r2 = { ...results, u1: { f: 200, p: 190, t: 12400, w: 'made', e: 12400 } };
  assert.deepEqual(scoreCalls(game, go({ u1: { k: { w: 'u2', at: at(100) } }, u4: { k: { w: 'u1', at: at(1000) + 100 } } }), r2), { u4: { w: 'u1', ok: true, bonus: callBonus(3) } });
  assert.equal(ordinal(1), '1ST'); assert.equal(ordinal(2), '2ND'); assert.equal(ordinal(3), '3RD'); assert.equal(ordinal(4), '4TH'); assert.equal(ordinal(11), '11TH');
});

test('THE RIVALS (rivals.js — PURE): a rival\'s tower = their own taps through the SAME engine, each chunk read ONCE; no new tap is ever assumed — the fuse\'s end only once their `e` is here; the cap falls by itself; a late seed starts them again', () => {
  const seed = seedOf(CODE, M, T0), a = botRun(seed, 25, 'r'), w = a.want;
  const node = upTo => nodeOf(a.taps, T0, T0 + GO_LEAD_MS, { upTo });
  const R = createRival(seed);
  assert.equal(feedRival(R, undefined), 0); assert.equal(R.run.floor, 0);
  // the chunks land a few at a time: the floor follows, each chunk once
  const mid = a.taps[Math.floor(a.taps.length / 2)];
  const n1 = feedRival(R, node(mid)), f1 = R.run.floor;
  assert.ok(n1 > 0 && f1 > 0 && feedRival(R, node(mid)) === 0 && R.run.floor === f1, 'the same node again: nothing new, nothing replayed');
  const live = createRun({ seed, mode: 'match' }); for (const t of a.taps) { if (t > mid) break; tap(live, t); }
  assert.deepEqual([R.run.floor, R.run.perfects, R.run.streak], [live.floor, live.perfects, live.streak], 'the rival\'s state = the player\'s own, tick for tick');
  feedRival(R, node(Infinity));
  if (w.cause === 'slow') assert.ok(!rivalOver(R), 'every tap in, the fuse ended them — but NOT on this screen until their `e` lands');
  else assert.ok(rivalOver(R), 'a miss / too thin is known from the tap itself');
  // NO SIGNAL: a tower whose last LANDED tap is a whole floor's longest time + 4 s old, with no end here — shown as silent, never as out
  { const Q = createRival(seed); feedRival(Q, nodeOf(a.taps.slice(0, 4), T0, T0 + GO_LEAD_MS));
    assert.equal(Q.run.st, 'beat', 'a rival\'s run rests in its landing beat between two taps (moved by landed taps alone)');
    assert.ok(!rivalSilent(Q, Q.last + FLOOR_TICKS_MAX + 240) && rivalSilent(Q, Q.last + FLOOR_TICKS_MAX + 241) && !rivalOver(Q), 'long past the fuse with no tap + no end: NO SIGNAL');
    feedRival(Q, { ...nodeOf(a.taps.slice(0, 4), T0, T0 + GO_LEAD_MS), e: { f: 0, t: 0 } }); assert.ok(rivalOver(Q) && !rivalSilent(Q, 1e9), 'their end lands: out — no longer silent');
    // WATCHING a tower: its next slab ENTERS on the clock (seen sliding), is held before its fuse, and a late tap still lands
    const W = createRun({ seed, mode: 'match' }); tap(W, a.taps[0]);
    assert.equal(entryTick(W, W.s0 - 1), -1); assert.equal(entryTick(W, W.s0 + 50), W.s0, 'the entry is stepped (the seed\'s own doing)');
    stepTo(W, entryTick(W, W.s0 + 50)); assert.equal(W.st, 'slide'); assert.equal(entryTick(W, 1e9), -1, 'never stepped again: not to its fuse');
    assert.equal(drawTick(W, 1e9), W.s0 + 2 * W.S - 1, 'its slab is drawn held at its last tick'); assert.equal(drawTick(W, W.s0 + 7), W.s0 + 7);
    assert.ok(tap(W, a.taps[1]) && W.floor === 2, 'the watched player\'s tap — earlier than the tick drawn — still lands'); }
  feedRival(R, { ...node(Infinity), e: { f: 0, t: 0 } });
  assert.ok(rivalOver(R) && R.done && rivalEnd(R) === 'out' && R.run.floor === w.floor && R.run.cause === w.cause, `their end is in: floor ${w.floor}, ${w.cause} — the judge's own`);
  // a late seed (THE FIRST GO landed late): the rival starts again
  resetRival(R, seedOf(CODE, M, T0 + 1));
  assert.ok(R.n === 0 && R.run.floor === 0 && !R.done && R.taps.length === 0);
  // the cap
  const C = createRival(seed), few = a.taps.slice(0, 3);
  feedRival(C, nodeOf(few, T0, T0 + GO_LEAD_MS));
  capRival(C, MODES.match.capTicks - 1); assert.ok(!rivalOver(C)); capRival(C, MODES.match.capTicks); assert.equal(rivalEnd(C), 'cap');
  // a machine reaches floor 200: the finish needs no `e`
  const F = createRival(seed), p = playBot(createRun({ seed, mode: 'match' }), gaussBot({ sigmaMs: 2, seed: 'f' }));
  feedRival(F, nodeOf(p, T0, T0 + GO_LEAD_MS));
  assert.equal(rivalEnd(F), 'made'); assert.equal(F.run.floor, 200);
  // a forged chunk (a tap in a landing beat): the tower stands where it stood, flagged — never a throw
  const B = createRival(seed);
  feedRival(B, { go: T0, c: { 0: { s: packFrom([a.taps[0], a.taps[0] + 3], 0, 2), at: T0 } } });
  assert.ok(B.bad && B.run.floor <= 1);
  assert.equal(BEAT + FLOOR_TICKS_MAX > 0, true);
});

test('THE HEIGHT TAPES + THE TAGS (rivals.js): a rival UNDER you = a tape on your tower · AT or OVER you = a right-edge tag "ALEX ▲3" — the 3 NEAREST each way; tags that would overlap MERGE; a pass is called once the order really flips; the altimeter + whom a watcher follows', () => {
  const rows = [['a', 'ALEX', 60], ['b', 'BOB', 57], ['c', 'CLEO', 52], ['d', 'DEE', 49], ['e', 'EVE', 31], ['f', 'FINN', 30], ['g', 'GUS', 12]].map(([uid, name, floor]) => ({ uid, name, floor }));
  const N = nearest(rows, 50);
  assert.equal(RIVALS_SHOWN, 3);
  assert.deepEqual(N.above.map(r => r.uid), ['c', 'b', 'a'], 'above: the three nearest, the nearest first');
  assert.deepEqual(N.below.map(r => r.uid), ['d', 'e', 'f'], 'below: the three nearest (GUS, 38 floors down, is not shown)');
  assert.deepEqual(nearest(rows, 61).above, []); assert.deepEqual(nearest(rows, 52).above.map(r => r.uid), ['c', 'b', 'a'], 'level with you = a tag, never a tape on your top slab');
  assert.equal(rivalTag('ALEX', 3), 'ALEX ▲3'); assert.equal(rivalTag('CLEO', 0), 'CLEO · LEVEL');
  // the tags: each at its floor's height; two within 30 px = ONE — the nearest rival's name + "+N" + its own ▲
  const tags = mergeTags([{ uid: 'c', name: 'CLEO', up: 2, y: 300 }, { uid: 'b', name: 'BOB', up: 7, y: 282 }, { uid: 'a', name: 'ALEX', up: 10, y: 220 }]);
  assert.deepEqual(tags.map(t => [t.text, t.y, t.uids.join('')]), [['CLEO +1 ▲2', 300, 'cb'], ['ALEX ▲10', 220, 'a']]);
  assert.deepEqual(mergeTags([{ uid: 'a', name: 'ALEX', up: 0, y: 300 }, { uid: 'b', name: 'BOB', up: 0, y: 300 }, { uid: 'c', name: 'CLEO', up: 1, y: 290 }]).map(t => t.text), ['ALEX +2 · LEVEL']);
  assert.deepEqual(mergeTags([]), []);
  // a PASS: called only when the order really flips — never at the start (everyone level), never twice
  const sides = {};
  assert.equal(passStep(sides, 'a', 0, 0), ''); assert.equal(passStep(sides, 'a', 1, 0), '', 'the first lead is no pass');
  assert.equal(passStep(sides, 'a', 1, 1), '', 'level again: nothing yet'); assert.equal(passStep(sides, 'a', 1, 2), 'them', 'ALEX went over you');
  assert.equal(passStep(sides, 'a', 2, 2), ''); assert.equal(passStep(sides, 'a', 3, 2), 'me', 'you went back over ALEX'); assert.equal(passStep(sides, 'a', 4, 2), '');
  // the altimeter: the highest first, the most perfects on a tie; a watcher: the leader first, a tap = the next still in
  const alt = altOrder([{ uid: 'x', floor: 9, perfects: 1 }, { uid: 'y', floor: 12, perfects: 0 }, { uid: 'z', floor: 9, perfects: 4 }]);
  assert.deepEqual(alt.map(r => r.uid), ['y', 'z', 'x']);
  const live = [{ uid: 'a', floor: 60, over: false }, { uid: 'b', floor: 70, over: true }, { uid: 'c', floor: 52, over: false }, { uid: 'd', floor: 20, over: false }];
  assert.equal(follow(live), 'a', 'THE LEADER still climbing (BOB, higher, is out)'); assert.equal(follow(live, 'd'), 'd', 'the picked one while they are in'); assert.equal(follow(live, 'b'), 'a', 'a picked player who went out: back to the leader');
  assert.equal(nextFollow(live, 'a'), 'c'); assert.equal(nextFollow(live, 'c'), 'd'); assert.equal(nextFollow(live, 'd'), 'a', 'round and round');
  assert.equal(follow(live.map(r => ({ ...r, over: true }))), 'b', 'nobody left: the highest tower');
});

test('REVIEW FIX A — MUST 3, A GO IS NOT A PLAY: seven seats that only write GO beside one real player → the server replay proves ONE player (a landed slab each) — never an "8-player match"; an honest 8 all count; JAYWALK untouched', () => {
  const { us, S, bots, nodesAt } = playMatch(8);
  const end = S.playAt + Math.max(...us.map(u => ms(bots[u].want.end))) + 700;
  const honest = nodesAt(end), srv = highriseMatch({ code: CODE, matchId: M, uids: us, nodes: honest });
  assert.equal(hrPlayed(new Set(us), srv.game.results).size, 8, 'an honest 8: all eight landed a slab');
  // the padded room: u1 plays; u2 … u8 wrote only their GO
  const padded = { u1: honest.u1 };
  for (const u of us.slice(1)) padded[u] = { go: honest[u].go };
  const pad = highriseMatch({ code: CODE, matchId: M, uids: us, nodes: padded });
  const proven = new Set(Object.keys(padded));   // (report.js#provenUids: every node in the tree — the old count, 8)
  const played = hrPlayed(proven, pad.game.results);
  assert.deepEqual(pad.played, ['u1'], 'THE PROOF PASS: the match itself says who PLAYED — the report reads it');
  assert.equal(srv.played.length, 8);
  assert.equal(proven.size, 8);
  assert.deepEqual([...played], ['u1'], 'only the player with a landed slab counts — one real player = the solo rule');
  assert.equal(HR_PLAYED_FLOOR, 1);
  const rep = read('api/report.js');
  assert.ok(rep.includes('if (matchPlayed) proven = new Set([...proven].filter(u => matchPlayed.has(u)));'), 'report.js narrows the proof tree to the players the server\'s replay saw PLAY, before the count (THE PROOF PASS: JAYWALK too — a hop)');
});

test('REVIEW FIX A — SHOULD 1, A HOST HICCUP AT GO: the host saw no GO for NO_GO_MS (its line stalled) and marked the match UNPROVEN after everyone had started — a FIRST GO stamped BEFORE it gave up takes the mark back: the GO seed + tick 0, the match counted as normal', () => {
  const { g, S, runs0, us, bots, nodesAt } = playMatch(3);
  // the host's mirror is empty at the count's end + NO_GO_MS: it gives up
  const giveUp = g.playAt + NO_GO_MS;
  const u = nextStep(g, { now: giveUp, live: { runs: {} }, code: CODE });
  assert.ok(u && u.unproven === 1 && u.phaseStartAt === giveUp);
  const gu = { ...g, ...u };
  // the phones whose mirrors have the GO never leave its seed (THE NODES ARE THE TRUTH)
  assert.deepEqual(startOf(gu, runs0, CODE), S, 'a phone reads the GO from the nodes, unproven mark or not');
  // the host's line comes back: the GOs (all stamped before the give-up) → the mark is taken back, the GO seed + tick 0 written
  const back = nextStep(gu, { now: giveUp + 2500, live: { runs: runs0 }, code: CODE });
  assert.deepEqual(back, { unproven: null, playAt: S.playAt, seed: S.seed, g0: S.g0 });
  const gp = { ...gu, ...back, unproven: undefined };
  assert.equal(nextStep(gp, { now: giveUp + 2600, live: { runs: runs0 }, code: CODE, online: parts(3) }), null, 'then it climbs as normal');
  const after = S.playAt + Math.max(...us.map(x => ms(bots[x].want.end))) + 700;
  const fin = nextStep(gp, { now: after, live: { runs: nodesAt(after) }, code: CODE, online: parts(3) });
  assert.equal(fin.phase, 'final');
  for (const x of us) assert.equal(fin.results[x].f, bots[x].want.floor, `${x}: counted from the replay — not NOTHING`);
  // a GO stamped AFTER the give-up (a phone back later) never takes it back
  const late = { u1: { go: giveUp + 1 } };
  assert.equal(nextStep(gu, { now: giveUp + 2500, live: { runs: late }, code: CODE }), null);
  assert.ok(read('js/games/highrise/director.js').includes('if (goBeforeGiveUp(game, S)) return { unproven: null, playAt: S.playAt, seed: S.seed, g0: S.g0 };'));
});

// ---- THE PROOF PASS (Nov 20 — docs/games/passes/proof-pass.md): THE SERVER's TWO GUARDS for HIGH RISE (JAYWALK's too) + "YOUR OWN PHONE MISSED THE GO"
test('THE PROOF PASS — THE SERVER\'S TWO GUARDS (HIGH RISE): a node counts only with a GO; a GO later than the window after THE FIRST GO is no tower — the host who GOes alone early wins nothing; the host\'s podium says the same; the stamp is never a player', async () => {
  const { GO_WINDOW_MS, goUids, firstGo: coreFirstGo, T0_KEY } = await import('../js/core/proof.js');
  assert.equal(firstGo, coreFirstGo, 'ONE firstGo — core/proof.js (JAYWALK\'s too)');
  const { us, S, bots, nodesAt } = playMatch(4);
  const end = S.playAt + Math.max(...us.map(u => ms(bots[u].want.end))) + 700, nodes = nodesAt(end);
  const H = highriseMatch({ code: CODE, matchId: M, uids: us, nodes });
  assert.deepEqual(H.played, us, 'an honest four: all played');
  // the tree's stamp: not a GO, not a player, changes no row
  const stamped = { ...nodes, [T0_KEY]: S.g0 - 2 };
  assert.deepEqual(highriseMatch({ code: CODE, matchId: M, uids: us, nodes: stamped }).game.results, H.game.results);
  assert.deepEqual(goUids(stamped).sort(), [...us].sort()); assert.equal(firstGo(stamped), S.g0);
  // GUARD 1: u2's GO gone, its chunks there → no tower, not a player
  const noGo = { ...nodes, u2: { c: nodes.u2.c, e: nodes.u2.e } };
  const G1 = highriseMatch({ code: CODE, matchId: M, uids: us, nodes: noGo });
  assert.equal(G1.game.results.u2.bad, 'no go'); assert.ok(!G1.played.includes('u2')); assert.ok(!goUids(noGo).includes('u2'));
  // GUARD 2: a GO past the window → no tower ('late go'); the window's last millisecond is in
  const lateU = us.find(u => nodes[u].go !== S.g0);
  const late = { ...nodes, [lateU]: { ...nodes[lateU], go: S.g0 + GO_WINDOW_MS + 1 } };
  const G2 = highriseMatch({ code: CODE, matchId: M, uids: us, nodes: late });
  assert.deepEqual([G2.game.results[lateU].bad, G2.game.results[lateU].f], ['late go', 0]); assert.ok(!G2.played.includes(lateU));
  assert.ok(!highriseMatch({ code: CODE, matchId: M, uids: us, nodes: { ...nodes, [lateU]: { ...nodes[lateU], go: S.g0 + GO_WINDOW_MS } } }).game.results[lateU].bad);
  // THE EARLY FIRST GO (hole c): one player GOes alone 20 s early — the others are then "late": no tower of theirs in HIS match
  const first = us.find(u => nodes[u].go === S.g0), early = { ...nodes, [first]: { ...nodes[first], go: S.g0 - 20000 } };
  const G3 = highriseMatch({ code: CODE, matchId: M, uids: us, nodes: early });
  for (const u of us) if (u !== first) assert.equal(G3.game.results[u].bad, 'late go', `${u}: GOed 20 s after him — not in his match`);
  assert.ok(G3.played.every(u => u === first), 'at most the early bird played — one real player = the solo rule, never a win');
  // the host's podium: the same refusal
  const g = { id: 'highrise', matchId: M, mode: 'match', participants: parts(4), seed: S.seed, playAt: S.playAt, g0: S.g0, phase: 'play' };
  assert.equal(scoreMatchNode(g, late[lateU]).bad, 'late go'); assert.ok(!scoreMatchNode(g, nodes[lateU]).bad);
});

test('THE PROOF PASS — "YOUR OWN PHONE MISSED THE GO" (REVIEW FIX A left it here): a phone that reaches the match\'s real clock with no taps of its own, after the fuse has ended a tower nobody touched, WATCHES — never a fake restart that goes TOO SLOW; its end is signalled', () => {
  const v = read('js/games/highrise/view.js');
  // the engine's own answer: a tower nobody touched is over once its first slab's fuse has run — and not before
  const r = createRun({ seed: 'missed', mode: 'match' }), limit = r.R.floorTicksMax;
  const at = t => { const x = createRun({ seed: 'missed', mode: 'match' }); stepTo(x, t); return isOver(x); };
  let gone = -1; for (let t = 1; t < limit * 4 && gone < 0; t++) if (at(t)) gone = t;
  assert.ok(gone > 60 && gone <= limit * 3, `a tower nobody touched ends at tick ${gone} (the fuse — ${(gone / TICK_HZ).toFixed(1)} s)`);
  assert.equal(at(gone - 1), false);
  assert.ok(v.includes('function towerGone(St) {') && v.includes("const r = createRun({ seed: St.seed, mode: 'match' });") && v.includes('stepTo(r, tick);') && v.includes('return isOver(r);'), 'the view asks the ENGINE whether the untouched tower is gone — never a guessed number');
  assert.ok(v.includes('missed = mine(g) && !(old && old.length) && !(node && node.e) && towerGone(St);'), 'only a player with NO taps of their own, no end yet, on a clock where the fuse has run');
  assert.ok(v.includes("S.hud().announce('YOU MISSED THE START — NOT COUNTED', 'passed');") && v.includes("S.spectate({ mode: 'match', seed: St.seed, t0: perfOf(St.playAt) });"), 'it WATCHES, told plainly — never adopt() into a run that is already over');
  assert.ok(v.includes("if (missed && proven && !wroteE) { wroteE = true; spent = true; W.end({ f: 0, t: 0, w: 'slow' }); }"), 'its end is signalled (a GO of its own may be there): the room does not wait 18 s');
  assert.ok(v.includes('if (outRes || !mine(g) || missed) afterOut(g, runs, rows);') && v.includes('me = mine(g) && !missed ? S.me(meRec) : null'), 'the watcher\'s view + rows from then on');
  // a rejoin WITH taps of its own, or before the fuse: plays on as before
  assert.ok(v.includes("} else if (mine(g)) S.adopt({ mode: 'match', seed: St.seed, t0: perfOf(St.playAt), taps: old || [] });"));
});
