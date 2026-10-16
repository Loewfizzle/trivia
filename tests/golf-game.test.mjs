// NEON PAR rules + director: scoring, countdown, offline players, wraps, the course order, sabotage, and a
// whole match simulated through the pure director (incl. replayed transitions after a host change).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, nextStep, COUNTDOWN_MS, WRAP_MS, ACE_WRAP_MS, CARD_MS, HOLE_MAX_MS } from '../js/games/golf/director.js';
import { standings, totals, scoreName, sabotageEarned, sabotageActive, incomingSabotage, holeResults, matchStats, CAP, parOf, holeNumbers, SAB_MAX_MS } from '../js/games/golf/logic.js';
import { finalRanks, musicFor } from '../js/games/golf/index.js';

const P = { a: true, b: true, c: true, d: true };
const online = { a: true, b: true, c: true, d: true };
const apply = (g, patch) => {
  const out = JSON.parse(JSON.stringify(g));
  for (const [k, v] of Object.entries(patch)) {
    const parts = k.split('/');
    let o = out;
    while (parts.length > 1) { const p = parts.shift(); o = o[p] = o[p] || {}; }
    o[parts[0]] = v;
  }
  return out;
};
const done = (hi, f) => ({ h: hi, s: Math.min(f, 6), f, st: 'done' });

test('course modes and pars', () => {
  assert.deepEqual(holeNumbers({ mode: 'full' }), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.equal(holeNumbers({ mode: 'quick6' }).length, 6);
  assert.equal(holeNumbers({ mode: 'quick3' }).length, 3);
  const g = createGame({ matchId: 'm', settings: {}, participants: P, now: 0 });
  assert.equal(g.holes.reduce((s, _, i) => s + parOf(g, i), 0), 27);
  assert.deepEqual(musicFor(g), ['golf-rooftops', 'menu']);
  assert.deepEqual(musicFor({ ...g, hi: 3 }), ['golf-cyber', 'menu']);
  assert.deepEqual(musicFor({ ...g, hi: 8 }), ['golf-arcade', 'menu']);
});

test('score names', () => {
  assert.equal(scoreName(1, 3), 'HOLE IN ONE');
  assert.equal(scoreName(2, 4), 'EAGLE');
  assert.equal(scoreName(2, 3), 'BIRDIE');
  assert.equal(scoreName(3, 3), 'PAR');
  assert.equal(scoreName(4, 3), 'BOGEY');
  assert.equal(scoreName(5, 3), 'DOUBLE BOGEY');
  assert.equal(scoreName(7, 3), 'MAXED OUT');
});

test('a hole: countdown once more than half are in, offline players never block, unfinished = 7', () => {
  let g = createGame({ matchId: 'm', settings: {}, participants: P, now: 1000 });
  // two of four in: not more than half → no countdown
  let nodes = { a: done(0, 2), b: done(0, 3), c: { h: 0, s: 1, st: 'aim' } };
  assert.equal(nextStep(g, { now: 2000, online, nodes }), null);
  nodes = { ...nodes, c: done(0, 4) };
  const p = nextStep(g, { now: 3000, online, nodes });
  assert.equal(p.cdEndsAt, 3000 + COUNTDOWN_MS);
  g = apply(g, p);
  assert.equal(nextStep(g, { now: 4000, online, nodes }), null);
  const end = nextStep(g, { now: 3000 + COUNTDOWN_MS, online, nodes });
  assert.equal(end.phase, 'card');
  assert.deepEqual(end['results/0'], { a: { s: 2 }, b: { s: 3 }, c: { s: 4 }, d: { s: CAP } });
  // offline players don't hold the hole: everyone online is in → wrap, then the card
  g = createGame({ matchId: 'm', settings: {}, participants: P, now: 0 });
  nodes = { a: done(0, 2), b: done(0, 2), c: done(0, 3) };
  const wrap = nextStep(g, { now: 100, online: { ...online, d: false }, nodes });
  assert.equal(wrap.wrapAt, 100 + WRAP_MS);
  g = apply(g, wrap);
  assert.equal(nextStep(g, { now: 200, online, nodes }), null);
  assert.equal(nextStep(g, { now: 100 + WRAP_MS, online, nodes }).phase, 'card');
  // an ace earns a longer wrap (its replay plays on every phone)
  g = createGame({ matchId: 'm', settings: {}, participants: { a: true }, now: 0 });
  assert.equal(nextStep(g, { now: 10, online, nodes: { a: done(0, 1) } }).wrapAt, 10 + ACE_WRAP_MS);
  // hard cap
  g = createGame({ matchId: 'm', settings: {}, participants: P, now: 0 });
  assert.equal(nextStep(g, { now: HOLE_MAX_MS, online, nodes: {} }).phase, 'card');
  // a stale node from the previous hole doesn't count
  g = { ...createGame({ matchId: 'm', settings: {}, participants: { a: true, b: true }, now: 0 }), hi: 1 };
  assert.equal(nextStep(g, { now: 5, online, nodes: { a: done(0, 2), b: done(0, 2) } }), null);
});

test('sabotage: earned by birdie or best score; lasts until the target’s next shot ends (8 s max)', () => {
  const g = { ...createGame({ matchId: 'm', settings: {}, participants: P, now: 0 }), hi: 1, results: { 0: { a: { s: 1 }, b: { s: 2 }, c: { s: 3 }, d: { s: 3 } } } };
  // hole 1 is par 2: a aced (birdie or better + best), b made par, c and d bogeyed
  assert.equal(sabotageEarned(g, 'a'), true);
  assert.equal(sabotageEarned(g, 'b'), false);
  assert.equal(sabotageEarned(g, 'c'), false);
  const tied = { ...g, results: { 0: { a: { s: 3 }, b: { s: 3 }, c: { s: 4 }, d: { s: 7 } } } };
  assert.equal(sabotageEarned(tied, 'a'), true, 'ties for best both earn it');
  assert.equal(sabotageEarned(tied, 'b'), true);
  assert.equal(sabotageEarned({ ...g, settings: { sabotage: 'off' } }, 'a'), false);
  assert.equal(sabotageEarned({ ...g, hi: 0 }, 'a'), false);
  const sab = { h: 1, to: 'c', k: 'fog', at: 10_000 };
  assert.equal(sabotageActive(sab, { ls: 0, le: 0 }, 12_000), true);
  assert.equal(sabotageActive(sab, { ls: 11_000, le: 0 }, 12_000), true, 'shot under way');
  assert.equal(sabotageActive(sab, { ls: 11_000, le: 13_000 }, 13_500), false, 'that shot ended');
  assert.equal(sabotageActive(sab, { ls: 9_000, le: 9_500 }, 12_000), true, 'a shot before it arrived doesn’t count');
  assert.equal(sabotageActive(sab, {}, 10_000 + SAB_MAX_MS), false, '8 s max');
  const nodes = { a: { h: 1, sab }, b: { h: 1, sab: { ...sab, to: 'd' } }, c: { h: 1, ls: 0, le: 0 } };
  assert.deepEqual(incomingSabotage(nodes, 'c', 1, 11_000), [{ from: 'a', k: 'fog', at: 10_000 }]);
  assert.deepEqual(incomingSabotage(nodes, 'c', 2, 11_000), [], 'other holes don’t count');
});

test('a whole match through the director (with replayed transitions) → standings, stats, ranks', () => {
  const scores = [[1, 2, 3, 3], [2, 3, 3, 4], [3, 3, 7, 4]]; // per hole: a b c d (quick 3)
  let g = createGame({ matchId: 'm', settings: { mode: 'quick3' }, participants: P, now: 0 });
  let now = 0;
  for (let hi = 0; hi < 3; hi++) {
    assert.equal(g.phase, 'play');
    assert.equal(g.hi, hi);
    const nodes = Object.fromEntries(['a', 'b', 'c', 'd'].map((u, k) => [u, done(hi, scores[hi][k])]));
    let guard = 0;
    while (g.phase === 'play' && guard++ < 10) {
      now += 3000;
      const p = nextStep(g, { now, online, nodes });
      if (p) { g = apply(g, p); g = apply(g, p); } // a new host replaying the same step is harmless
    }
    assert.equal(g.phase, 'card');
    now += CARD_MS;
    g = apply(g, nextStep(g, { now, online, nodes: {} }));
  }
  assert.equal(g.phase, 'final');
  const st = standings(g);
  assert.deepEqual(st.map(r => [r.uid, r.score, r.rank]), [['a', 6, 1], ['b', 8, 2], ['d', 11, 3], ['c', 13, 4]]);
  assert.equal(totals(g).a.toPar, 6 - (2 + 3 + 3));
  const ms = matchStats(g);
  assert.equal(ms.a.aces, 1);
  assert.equal(ms.a.best.s, 1);
  assert.deepEqual(finalRanks(g).map(r => r.rank), [1, 2, 3, 4]);
  assert.deepEqual(nextStep({ ...g, phaseEndsAt: now }, { now, online, nodes: {} }), { lobby: true });
  assert.deepEqual(holeResults(g, {}, 0), { a: { s: 7 }, b: { s: 7 }, c: { s: 7 }, d: { s: 7 } });
});

test('the startup course table matches the hole files', async () => {
  const { COURSE, MAX_STROKES: M } = await import('../js/games/golf/course.js');
  const { HOLES } = await import('../js/games/golf/holes/index.js');
  const { MAX_STROKES } = await import('../js/games/golf/physics.js');
  assert.equal(M, MAX_STROKES);
  assert.deepEqual(COURSE, HOLES.map(h => ({ id: h.id, name: h.name, zone: h.zone, par: h.par })));
});
