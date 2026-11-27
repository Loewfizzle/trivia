// FREEFALL F4B — THE MATCH (docs/freefall.md "THE MATCH" · "THE GHOSTS"): the PURE half — the host's steps (count → play → final), the
// judge of a match == the live runs on 8-player sims, hostile match logs (forged / late / out-of-order chunks, a hold in a match, a late
// GO), THE GHOSTS (stepped conf → run: never out before their own end, the catch-up arc, the placement), WATCH's exact playback, the
// rail's + the markers' maths, the server's freefallMatch. The browser half: tests/integration/e2e-freefall-match.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRun, stepTo, setAngle, isOver, resultOf } from '../js/games/freefall/engine.js';
import { TICK_HZ, MODES, BALL } from '../js/games/freefall/tuning.js';
import { seedOf, gameStandings } from '../js/games/freefall/logic.js';
import { CLOCK, START_LEAD_MS, judgeMatch } from '../js/games/freefall/proof.js';
import * as M from '../js/games/freefall/match.js';
import { createGame, nextStep, endNow, scoreMatchNode, finalPatch } from '../js/games/freefall/director.js';
import * as G from '../js/games/freefall/ghosts.js';
import { createSim, botRun, SIM_LAG_TICKS } from '../js/games/freefall/matchsim.js';
import { freefallMatch, FF_PLAYED_FLOOR } from '../api/_lib/freefall.js';
import * as HR from '../js/games/highrise/match.js';

const MS = 1000 / TICK_HZ, GO = 1_800_000_000_000, CODE = 'FALL', MID = 'm1abc';
const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const ids = n => Array.from({ length: n }, (_, k) => `bot${k}`);
const parts = n => Object.fromEntries(ids(n).map(u => [u, true]));

/** a finished sim as the room holds it: every bot's proof node — its GO (the first one = bot0's), its chunks stamped with the SERVER's
 *  time they arrived at, its end. → { tree, S (the match's start), sim } */
function roomOf(n, o = {}) {
  const S = M.matchStart(CODE, MID, { a: { go: GO } }), sim = createSim(S.seed, n, o), tree = { t0: GO - 5 };
  sim.runs.forEach((B, k) => {
    const c = {};
    B.chunks.forEach((x, i) => { c[i] = { s: x.s, at: Math.round(S.playAt + x.at * MS) }; });
    tree[B.uid] = { go: GO + k * 40, c, e: B.end.e };
  });
  return { tree, S, sim };
}

test('THE NUMBERS: the count, the GO lead, the idle-out + the dropped signal are JAYWALK\'s / HIGH RISE\'s own; a match has NO holds, THE FINISH at floor 200, a 3:00 cap', () => {
  assert.equal(M.COUNT_MS, HR.COUNT_MS); assert.equal(M.GO_LEAD_MS, 2000); assert.equal(M.NO_GO_MS, HR.NO_GO_MS);
  assert.equal(M.IDLE_OUT_MS, HR.IDLE_OUT_MS); assert.equal(M.DROP_WAIT_MS, CLOCK.drop); assert.equal(M.UNPROVEN_MS, HR.UNPROVEN_MS);
  assert.deepEqual([M.MATCH_MIN, M.MATCH_MAX], [2, 8]);
  assert.deepEqual([MODES.match.holds || 0, MODES.match.finish, MODES.match.capTicks], [0, 200, 10800]);
  assert.equal(M.capAt({ playAt: 1000 }), 1000 + 180000);
  // the ghost's arc = the view's own (night.js#SHAPE) — this file imports no view
  const shape = read('js/games/freefall/night.js').match(/export const SHAPE = Object\.freeze\(\{([^}]*)\}/)[1];
  assert.equal(Number(/\bH: ([\d.]+)/.exec(shape)[1]), G.LIFT.H); assert.equal(Number(/\bHOP: ([\d.]+)/.exec(shape)[1]), G.LIFT.HOP);
  assert.deepEqual(['1ST', '2ND', '3RD', '4TH', '11TH', '12TH', '13TH', '21ST'], [1, 2, 3, 4, 11, 12, 13, 21].map(M.ordinal));
});

test('THE STEPS: count → (THE FIRST GO: the seed + tick 0 for all) → play → final; no GO anywhere = UNPROVEN, never scored; a hiccup\'s unproven mark is taken back', () => {
  const now = GO - 1000, g = createGame({ matchId: MID, settings: {}, participants: parts(3), now, seed: 'x' });
  assert.deepEqual([g.mode, g.phase, g.seed, g.playAt], ['match', 'count', '', now + 3000]);
  assert.equal(createGame({ matchId: MID, settings: {}, participants: parts(1), now, seed: 'x' }).phase, 'play', 'a room of one is the solo run: no count');
  assert.equal(nextStep(g, { now: now + 2500, live: { runs: {} }, code: CODE }), null, 'the count holds with no GO');
  // THE FIRST GO lands: the step waits for ITS tick 0, then writes the seed + the clock into the game
  const runs = { bot1: { go: GO + 90 }, bot0: { go: GO } };
  assert.equal(nextStep(g, { now: GO + 1999, live: { runs }, code: CODE }), null);
  const p = nextStep(g, { now: GO + 2000, live: { runs }, code: CODE });
  assert.deepEqual(p, { phase: 'play', phaseStartAt: GO + 2000, playAt: GO + 2000, seed: seedOf(CODE, MID, GO), g0: GO });
  assert.deepEqual(M.startOf(g, runs, CODE), { g0: GO, playAt: GO + 2000, seed: p.seed }, 'THE NODES ARE THE TRUTH — in the count already');
  // no GO anywhere: UNPROVEN after NO_GO_MS — a stand-in seed, never counted
  const u = nextStep(g, { now: g.playAt + M.NO_GO_MS, live: { runs: {} }, code: CODE });
  assert.equal(u.unproven, 1); assert.equal(u.phase, 'play'); assert.notEqual(u.seed, p.seed);
  const gu = { ...g, ...u };
  // … a FIRST GO stamped BEFORE the host gave up: the mark is taken back, the match is the GO's
  assert.deepEqual(nextStep(gu, { now: gu.playAt + 100, live: { runs }, code: CODE }), { unproven: null, playAt: GO + 2000, seed: p.seed, g0: GO });
  // … one stamped AFTER it never moves a match already falling on its stand-in; it ends unscored after UNPROVEN_MS
  const late = { bot0: { go: gu.phaseStartAt + 50 } };
  assert.equal(nextStep(gu, { now: gu.playAt + 100, live: { runs: late }, code: CODE }), null);
  const fu = nextStep(gu, { now: gu.playAt + M.UNPROVEN_MS, live: { runs: late }, code: CODE });
  assert.equal(fu.phase, 'final'); assert.ok(Object.values(fu.results).every(r => r.f === 0 && r.e === -1));
});

test('THE END: every run ended (their own `e`) — or a silent phone idled out (online 18 s · offline + 75 s) — or the 3:00 cap + its grace; the host\'s END GAME scores the runs as they stand', () => {
  const { tree, S } = roomOf(3, { maxFloor: 30 });
  const g = { ...createGame({ matchId: MID, settings: {}, participants: parts(3), now: GO - 1000, seed: '' }), phase: 'play', playAt: S.playAt, seed: S.seed, g0: S.g0 };
  const far = S.playAt + 100000;
  const noE = structuredClone(tree); delete noE.bot2.e;
  const last = M.lastSeen(g, noE.bot2);
  assert.equal(nextStep(g, { now: last + M.IDLE_OUT_MS - 1, live: { runs: noE }, code: CODE, online: { bot0: true, bot1: true, bot2: true } }), null, 'a silent phone is waited for');
  assert.equal(nextStep(g, { now: last + M.IDLE_OUT_MS, live: { runs: noE }, code: CODE, online: { bot0: true, bot1: true, bot2: true } }).phase, 'final');
  assert.equal(nextStep(g, { now: last + M.IDLE_OUT_MS + 1000, live: { runs: noE }, code: CODE, online: { bot0: true, bot1: true, bot2: false } }), null, 'OFFLINE: THE DROPPED SIGNAL gets its 75 s on top');
  assert.equal(nextStep(g, { now: last + M.IDLE_OUT_MS + M.DROP_WAIT_MS, live: { runs: noE }, code: CODE, online: { bot0: true, bot1: true, bot2: false } }).phase, 'final');
  assert.equal(nextStep(g, { now: far, live: { runs: tree }, code: CODE }).phase, 'final');
  assert.equal(nextStep(g, { now: M.capAt(g) + M.END_GRACE_MS, live: { runs: {} }, code: CODE }).phase, 'final', 'the cap ends every wait');
  assert.equal(endNow({ ...g, phase: 'count' }, { now: far, live: { runs: tree }, code: CODE }).phase, 'final');
  // THE LIVE RUNS (the server's + the podium's wait): read from the nodes alone
  assert.deepEqual(M.liveOf({ code: CODE, matchId: MID, tree: noE, now: last + 1000 }).uids, ['bot2']);
  assert.deepEqual(M.liveOf({ code: CODE, matchId: MID, tree, now: last + 1000 }).uids, []);
  assert.deepEqual(M.liveOf({ code: CODE, matchId: MID, tree: noE, now: last + M.IDLE_OUT_MS + 1 }).uids, []);
});

test('THE JUDGE OF A MATCH == THE LIVE RUNS — 8-player sims (the host\'s podium AND the server\'s count): every row is the bot\'s own run, floor for floor, tick for tick; the deepest wins, then the earlier tick', () => {
  for (const [n, o] of [[8, {}], [8, { maxFloor: 90 }], [3, { bots: ['great'] }], [2, { maxFloor: 12 }]]) {
    const { tree, S, sim } = roomOf(n, o);
    const game = { id: 'freefall', matchId: MID, mode: 'match', participants: parts(n), phase: 'play', playAt: S.playAt, seed: S.seed, g0: S.g0 };
    const patch = finalPatch(game, tree, S.playAt + 200000, CODE);
    const srv = freefallMatch({ code: CODE, matchId: MID, uids: ids(n), nodes: tree });
    assert.ok(srv.game && srv.game.sv === 1 && srv.game.mode === 'match');
    for (const B of sim.runs) {
      const want = [B.result.floor, B.result.tick, B.result.cause, B.result.end], h = patch.results[B.uid], s = srv.game.results[B.uid];
      assert.deepEqual([h.f, h.t, h.w, h.e], want, `${n} players — ${B.uid}: the host's podium row is the run itself`);
      assert.deepEqual([s.f, s.t, s.w, s.e], want, `${n} players — ${B.uid}: the server's row is the run itself`);
      assert.equal(h.bad, undefined); assert.equal(h.cut, undefined);
    }
    const st = gameStandings({ participants: game.participants, results: patch.results });
    for (let i = 1; i < st.length; i++) assert.ok(st[i - 1].floor > st[i].floor || (st[i - 1].floor === st[i].floor && st[i - 1].tick <= st[i].tick), 'the deepest first, then the earlier tick');
    assert.deepEqual(srv.played.slice().sort(), ids(n).filter(u => sim.results[u].floor >= FF_PLAYED_FLOOR).sort(), 'PLAYED = passed a floor in the server\'s replay');
    // a great bot's match can END at THE BOTTOM: floor 200, MADE IT
    for (const B of sim.runs) if (B.result.made) assert.deepEqual([B.result.floor, patch.results[B.uid].w], [200, 'made']);
  }
});

test('HOSTILE MATCH LOGS: forged · out of order · late (slow motion) · too fast · a HOLD in a match · a late GO · no GO — each refused by name, or CUT to its last on-time move; never above the honest run; nothing throws', () => {
  const { tree, S, sim } = roomOf(4, { bots: ['great'], maxFloor: 120 });
  const honest = sim.results.bot1, judge = node => judgeMatch({ seed: S.seed, node, playAt: S.playAt });
  const base = tree.bot1, keys = Object.keys(base.c).map(Number);
  assert.ok(keys.length > 20 && honest.floor >= 60);
  assert.equal(judge(base).floor, honest.floor);
  // forged: a chunk's text changed (a bigger turn than MAX SPIN · a text that is no packed log · a chunk dropped: a hole)
  { const n = structuredClone(base); n.c[5].s = '+zz'; assert.equal(judge(n).ok, false); }
  { const n = structuredClone(base); n.c[5].s = '%%'; assert.deepEqual(judge(n), { ok: false, why: 'chunks' }); }
  { const n = structuredClone(base); delete n.c[5]; assert.deepEqual(judge(n), { ok: false, why: 'chunks' }); }
  // out of order: two chunks swapped — the log is another log: refused, or judged as what that input makes (never above the honest floor's own tower)
  { const n = structuredClone(base); const a = n.c[6].s; n.c[6].s = n.c[7].s; n.c[7].s = a; const v = judge(n); assert.ok(!v.ok || v.floor <= 200); assert.notDeepEqual([v.floor, v.tick], [honest.floor + 1, honest.tick]); }
  // … their arrival times running backwards: the chunks' own clock
  { const n = structuredClone(base); n.c[7].at = n.c[5].at - 10; assert.deepEqual(judge(n), { ok: false, why: 'the chunks\' clock' }); }
  // late — SLOW MOTION with no silence to explain it: every chunk from the 10th arrives 12 s after its moves → CUT at the last on-time move
  { const n = structuredClone(base); for (const i of keys) if (i >= 10) n.c[i].at += 12000 + i * 40;
    const v = judge(n); assert.equal(v.ok, true); assert.equal(v.cut.why, 'behind'); assert.ok(v.floor <= honest.floor); }
  // too fast: the whole log uploaded at once, at the start (a run made in advance)
  { const n = structuredClone(base); for (const i of keys) n.c[i].at = S.playAt + 500 + i; const v = judge(n); assert.equal(v.ok, false); assert.ok(['ahead of the clock', 'too many chunks'].includes(v.why), v.why); }
  // … a game played at DOUBLE SPEED (every chunk arrives when half its ticks have passed): AHEAD of the clock
  { const n = structuredClone(base); for (const i of keys) n.c[i].at = Math.round(S.playAt + (base.c[i].at - S.playAt) / 2); const v = judge(n); assert.equal(v.ok, false); assert.ok(['ahead of the clock', 'too many chunks'].includes(v.why), v.why); }
  // A HOLD IN A MATCH: refused by name — on time or late, with a stamp or without (a hidden page runs on: a match never holds)
  for (const late of [0, 60000]) for (const h of [undefined, { 0: S.playAt + 4000 }]) {
    const n = { go: base.go, c: { 0: { s: '+1.a+5', at: S.playAt + 400 }, 1: { s: '!4', at: S.playAt + 600 + late }, 2: { s: '.9+3', at: S.playAt + 5000 + late } }, ...(h ? { h } : {}) };
    assert.deepEqual(judge(n), { ok: false, why: 'too many holds' });
  }
  // a GO later than the window after THE FIRST GO is no run (the host who GOes alone early and adds the rivals later wins nothing) · no GO at all
  const lateTree = structuredClone(tree); lateTree.bot2.go = GO + 5001;
  const game = { id: 'freefall', matchId: MID, mode: 'match', participants: parts(4), phase: 'play', playAt: S.playAt, seed: S.seed, g0: S.g0 };
  assert.equal(scoreMatchNode(game, lateTree.bot2).bad, 'late go');
  const srv = freefallMatch({ code: CODE, matchId: MID, uids: ids(4), nodes: lateTree });
  assert.deepEqual([srv.game.results.bot2.f, srv.game.results.bot2.bad], [0, 'late go']); assert.ok(!srv.played.includes('bot2'));
  const noGo = structuredClone(tree); delete noGo.bot3.go;
  assert.equal(freefallMatch({ code: CODE, matchId: MID, uids: ids(4), nodes: noGo }).game.results.bot3.bad, 'no go');
  assert.deepEqual(scoreMatchNode(game, noGo.bot3), { f: 0, t: 0, w: '', e: -1 });
  // nothing to read: no match
  assert.equal(freefallMatch({ code: CODE, matchId: MID, uids: ['bot0'], nodes: tree }).game, null);
  assert.equal(freefallMatch({ code: CODE, matchId: MID, uids: ids(4), nodes: {} }).why, 'no go');
  assert.equal(freefallMatch({ code: CODE, matchId: MID, uids: ids(2), nodes: { bot0: { go: GO }, bot1: { go: GO + 5 } } }).why, 'no moves');
  for (const junk of [null, 7, 'x', [], { go: 'now' }, { go: GO, c: 'abc' }, { go: GO, c: { 0: null } }, { go: GO, c: { 0: { s: 5, at: 1 } } }]) assert.equal(judge(junk).ok, false);
});

test('CALL THE WINNER: a call counts from a player who was OUT, for one still in at that moment, within its window; right = that player won; the bonus is game-night points', () => {
  const { tree, S } = roomOf(4, { bots: ['sloppy', 'great', 'good', 'great'], maxFloor: 150 });
  const game = { id: 'freefall', matchId: MID, mode: 'match', participants: parts(4), phase: 'play', playAt: S.playAt, seed: S.seed, g0: S.g0 };
  const res = finalPatch(game, tree, S.playAt + 200000, CODE).results, st = gameStandings({ participants: game.participants, results: res });
  const winner = st[0].uid, loser = st[st.length - 1].uid, outAt = S.playAt + res[loser].e * MS;
  assert.notEqual(winner, loser); assert.ok(res[loser].e >= 0 && res[loser].w !== 'made');
  const withK = (w, at) => { const t = structuredClone(tree); t[loser].k = { w, at }; return finalPatch(game, t, S.playAt + 200000, CODE); };
  const right = withK(winner, outAt + 3000);
  assert.equal(right.calls[loser].ok, true); assert.ok(right.calls[loser].bonus > 0);
  assert.deepEqual(M.nightBonus({ calls: right.calls }), { [loser]: right.calls[loser].bonus });
  const other = st[1].uid === loser ? st[2].uid : st[1].uid;
  if (res[other].e > res[loser].e || M.stoodToEnd(res[other])) assert.deepEqual([withK(other, outAt + 3000).calls[loser].ok, withK(other, outAt + 3000).calls[loser].bonus], [false, 0]);
  assert.equal(withK(winner, outAt + M.CALL_WINDOW_MS + 1).calls, undefined, 'past its window: no call');
  assert.equal(withK(loser, outAt + 1000).calls, undefined, 'never yourself');
});

test('THE GHOSTS — stepped conf → run: fed chunk by chunk as the line delivers them, a ghost is NEVER out (nor over THE FINISH) before its own end says so, ends exactly where its player did, and a late chunk is closed in an arc — never a teleport', () => {
  const { sim, S } = roomOf(8, {});
  const ghosts = sim.runs.map(B => G.createGhost(S.seed));
  let arcs = 0, jumps = 0, heldSeen = 0;
  const lastTick = Math.max(...sim.runs.map(B => B.end.at)) + 30;
  for (let tick = 0, now = 0; tick <= lastTick; tick += 1, now += MS) {
    const nodes = sim.reveal(tick);
    sim.runs.forEach((B, k) => {
      const gh = ghosts[k], node = nodes[B.uid], wasA = gh.a, wasY = gh.y, wasOver = gh.over;
      G.feedGhost(gh, node);
      G.stepGhost(gh, tick + 0.5, now);
      if (!node.e && tick < MODES.match.capTicks) assert.ok(!(gh.over && gh.end !== 'cap'), `${B.uid} @${tick}: never OUT / MADE before their own end is here`);
      if (gh.held) heldSeen++;
      if (gh.off) arcs++;
      // (a frame's step is never a teleport: a tick moves the ball at most its own flight's step — a confirmed jump is spread over the arc)
      if (tick > 0 && !wasOver && !gh.over && Math.abs(gh.y - wasY) > 0.5) jumps++;
      void wasA;
      assert.equal(gh.bad, false);
    });
  }
  sim.runs.forEach((B, k) => {
    const gh = ghosts[k];
    assert.deepEqual([gh.floor, gh.over, gh.end, gh.moves], [B.result.floor, true, B.result.made ? 'made' : B.result.cause === 'cap' ? 'cap' : 'out', B.log.length], `${B.uid}: the ghost ended exactly where its player did`);
    assert.deepEqual((r => [r.floor, r.tick, r.cause])(resultOf(gh.conf)), [B.result.floor, B.result.tick, B.result.cause]);
  });
  assert.ok(arcs > 50, `late chunks were closed in arcs (${arcs} frames of catch-up)`);
  assert.equal(jumps, 0, 'no frame moved a ghost half a floor at once');
  assert.ok(heldSeen > 0, 'a ghost that would have gone out unconfirmed was HELD');
  // a chunk the engine does not take (a hold — a match never holds; a turn over MAX SPIN): the ghost stands where it stood, flagged
  for (const s of ['!4', '+zz', '%', '.+3']) { const gh = G.createGhost(S.seed); G.feedGhost(gh, { go: 1, c: { 0: { s: '+5' }, 1: { s } } }); assert.deepEqual([gh.bad, gh.moves], [true, 1], s); }
  // the seed moved (THE FIRST GO landed late on this phone): the ghost starts again, its chunks are read again
  const gh = ghosts[0]; G.resetGhost(gh, 'other-seed'); assert.deepEqual([gh.n, gh.moves, gh.done, gh.floor, gh.lt.length], [0, 0, false, 0, 0]);
});

test('WHERE A GHOST STANDS: on its real floor over the SAME slice — the world angle (the ball\'s − their tower\'s) + MY tower\'s: it turns with MY tower; near my ball it is an outline; far away it is an edge marker', () => {
  assert.equal(G.ghostPhi(0, 0), BALL, 'both towers at rest: they stand where my ball is');
  assert.equal(G.ghostPhi(1000, 1000), BALL, 'the same turn on both towers: still over the same slice as me');
  assert.equal(G.ghostPhi(1000, 0), 4096 - 1000); assert.equal(G.ghostPhi(0, 300), 300, 'I turn my tower 300: they go round with it');
  assert.equal(G.ghostPhi(4000, 200), (4096 - 4000 + 200) % 4096);
  const rows = [{ uid: 'a', name: 'MIA', hex: '#0ff', floor: 30, over: false }, { uid: 'b', name: 'LIAM', hex: '#ff0', floor: 18, over: false }, { uid: 'c', name: 'ZOE', hex: '#f0f', floor: 22, over: false },
    { uid: 'd', name: 'KAI', hex: '#fff', floor: 60, over: true }, { uid: 'e', name: 'AVA', hex: '#fff', floor: 11, over: false }, { uid: 'f', name: 'NOAH', hex: '#fff', floor: 9, over: false }, { uid: 'g', name: 'RUBY', hex: '#fff', floor: 3, over: false }, { uid: 'me', name: 'ME', floor: 20, me: true }];
  const into = { up: [], down: [] }, m = G.edgeMarks(rows, 20, into);
  assert.deepEqual(m.down.map(x => x.text), ['MIA ↓10'], 'deeper than me by 5 or more (ZOE is 2 away: on the picture; KAI is out)');
  assert.deepEqual(m.up.map(x => x.text), ['LIAM ↑2', 'AVA ↑9', 'NOAH ↑11'], 'above me — from TWO floors up (the picture ends sooner there): the nearest first, three at most');
  const first = m.up[0]; G.edgeMarks(rows, 20, into); assert.equal(into.up[0], first, 'the records are kept: no list made a call');
  assert.equal(G.placeOf(rows, 20), 4, '1 + the players strictly deeper (MIA · ZOE · KAI)');
  assert.equal(G.markText('MIA', 12), 'MIA ↓12'); assert.equal(G.markText('MIA', -3), 'MIA ↑3');
  // WATCH THE LEADER: the deepest still falling; a tap = the next; the one you follow stays while they fall
  assert.equal(G.follow(rows), 'a'); assert.equal(G.follow(rows, 'c'), 'c'); assert.equal(G.follow(rows, 'd'), 'a', 'the one you followed is out: the leader');
  assert.equal(G.nextFollow(rows, 'a'), 'c'); assert.equal(G.nextFollow(rows, 'g'), 'a', 'round and round');
  const allOut = rows.map(r => ({ ...r, over: true }));
  assert.equal(G.follow(allOut), 'd', 'nobody still falling: the deepest of all'); assert.equal(G.follow([{ uid: 'me', me: true, floor: 1 }]), '');
});

test('WATCH THE LEADER = an EXACT playback, 1.5 s behind the world: at every tick the watched run is the player\'s own run at that tick (floor, angle, flight) — and it never ends before their own end is here', () => {
  const { sim, S } = roomOf(3, { bots: ['great', 'good', 'sloppy'] });
  for (let k = 0; k < 3; k++) {
    const B = sim.runs[k], gh = G.createGhost(S.seed), W = G.createWatch(S.seed), ref = createRun({ seed: S.seed, mode: 'match' }), ev = [];
    let li = 0, rebuilt = 0, checked = 0;
    for (let tick = 0; tick <= B.end.at + G.WATCH_DELAY + 5; tick++) {
      G.feedGhost(gh, sim.reveal(tick)[B.uid]);
      const T = tick - G.WATCH_DELAY;
      if (T < 0) continue;
      if (G.stepWatch(W, gh, T, ev)) rebuilt++;
      // the player's own run at tick T (the reference: their whole log through a fresh engine)
      while (li < B.log.length && B.log[li].t <= T) { setAngle(ref, B.log[li].t, B.log[li].a); li++; }
      stepTo(ref, T);
      if (!isOver(ref)) { assert.deepEqual([W.run.floor, W.run.a, W.run.fl, W.run.nl], [ref.floor, ref.a, ref.fl, ref.nl], `${B.uid} @${T}: the playback IS the run`); checked++; }
      else if (!gh.done) assert.ok(!isOver(W.run) || W.run.st === 'cap', 'never ended before their own end is here');
    }
    assert.ok(checked > 200); assert.equal(rebuilt, 0, `a ${SIM_LAG_TICKS}-tick line: every move is here before it is played (no rebuild)`);
    assert.deepEqual([W.run.floor, W.run.st], [B.result.floor, resultOf(ref).over ? ref.st : W.run.st]);
    assert.ok(ev.some(e => e.e === 'land'), 'the watched run carries its own events (the view shows their tower)');
  }
  // a line slower than the delay: a move that lands after its tick was played rebuilds the playback — and it is exact again
  const B = botRun(S.seed, 1, { lag: 140, bot: 'good', maxFloor: 40 }), gh = G.createGhost(S.seed), W = G.createWatch(S.seed), node = { go: 1, c: {} };
  let next = 0, rebuilt = 0;
  for (let tick = 0; tick <= B.end.at + 200; tick++) {
    while (next < B.chunks.length && B.chunks[next].at <= tick) { node.c[next] = B.chunks[next]; next++; }
    if (next >= B.chunks.length && B.end.at <= tick) node.e = B.end.e;
    G.feedGhost(gh, node);
    if (tick >= G.WATCH_DELAY && G.stepWatch(W, gh, tick - G.WATCH_DELAY, null)) rebuilt++;
  }
  assert.ok(rebuilt > 0, 'the slow line was seen'); assert.deepEqual([W.run.floor, W.run.st !== 'live'], [B.result.floor, true]);
});
