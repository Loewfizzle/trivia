// OVERCLOCK PASS 2 (OC2 — docs/overclock.md): THE RESULTS FLOW's RULES. THE ROUND WIN (one rule: the highest + not shared; a tie = a DEAD
// HEAT, nobody wins; nobody above 0 = no winner) — stored per challenge (game/rw), the SAME rule the server's REDLINE uses
// (core/match-report.js); whole simulated QUICK matches through the director still yield `sweep` / `photo` from the room's own record;
// the AWARD CHIPS (BEST STREAK + FASTEST, their ties); YOUR BEST / YOUR WORST; a replayed step writes the same patch.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, nextStep, timesOf } from '../js/games/overclock/director.js';
import {
  roundWin, packRoundWin, roundWinOf, roundWins, comboReachAt, comboFold, awardChips, fastestOf, bestWorst, maxPts, STREAK_CHIP_MIN,
  FASTEST_MIN_RIGHT, FASTEST_SKIP, CHALLENGE_MS, MODES, levelOf,
} from '../js/games/overclock/logic.js';
import { partsFor } from '../js/games/overclock/challenges.js';
import { extractMatch } from '../js/core/match-report.js';
import { rngFrom } from '../js/core/rng.js';

function applyPatch(obj, patch) {
  for (const [k, v] of Object.entries(patch || {})) {
    if (k === '$room') continue;
    const parts = k.split('/');
    let o = obj;
    for (const p of parts.slice(0, -1)) o = o[p] ??= {};
    if (v === null) delete o[parts.at(-1)]; else o[parts.at(-1)] = structuredClone(v);
  }
}
const R = o => Object.fromEntries(Object.entries(o).map(([u, p]) => [u, { pts: p, ok: 1, parts: 1 }]));

// ---------------------------------------------------------------------------------------------- THE ROUND WIN
test('THE ROUND WIN: the highest + NOT shared wins; a tie for the top = a DEAD HEAT (nobody); nobody above 0 = no winner', () => {
  assert.deepEqual(roundWin(R({ a: 150, b: 130, c: 90 }), ['a', 'b', 'c']), { kind: 'win', uid: 'a', uids: ['a'], pts: 150 });
  assert.deepEqual(roundWin(R({ a: 120, b: 120, c: 90 }), ['a', 'b', 'c']), { kind: 'tie', uids: ['a', 'b'], pts: 120 });
  assert.deepEqual(roundWin(R({ a: 0, b: 0 }), ['a', 'b']), { kind: 'none', uids: [], pts: 0 });
  assert.equal(roundWin(R({ a: 10 }), ['a', 'b']).uid, 'a', 'a missing result counts 0');
  assert.equal(roundWin(R({ b: 0 }), ['a', 'b']).kind, 'none');
  assert.equal(roundWin(R({ a: 1, b: 0 }), ['a', 'b']).uid, 'a', 'one point is a win');
  assert.equal(roundWin(R({ a: 50 }), ['a']).kind, 'win', 'alone: the rule is the same (the view shows no banner in solo)');
  assert.equal(roundWin({}, []).kind, 'none');
  // stored + read back
  for (const r of [roundWin(R({ a: 5, b: 3 }), ['a', 'b']), roundWin(R({ a: 5, b: 5, c: 1 }), ['a', 'b', 'c']), roundWin(R({ a: 0 }), ['a'])]) {
    assert.deepEqual(roundWinOf({ rw: { 0: packRoundWin(r) }, participants: {}, results: {} }, 0), r);
  }
  assert.equal(roundWinOf({ participants: { a: 1, b: 1 }, results: { 0: R({ a: 3, b: 9 }) } }, 0).uid, 'b', 'no rw stored (a match from before OC2): the same rule over its results');
});

test('THE ROUND WIN = the server\'s rule: REDLINE (match-report sweep) is exactly "roundWin won every one of the six"', () => {
  const rand = rngFrom('agree');
  let swept = 0, checked = 0;
  for (let s = 0; s < 3000; s++) {
    const n = 2 + Math.floor(rand() * 3), uids = 'abcd'.slice(0, n).split('');
    // small point ranges so ties + zero rounds happen often
    const results = Object.fromEntries(Array.from({ length: 6 }, (_, ci) => [ci, R(Object.fromEntries(uids.map(u => [u, Math.floor(rand() * 4) * (u === 'a' ? 2 : 1)])))]));
    const game = { id: 'overclock', matchId: `m${s}`, phase: 'final', phaseStartAt: 1, participants: Object.fromEntries(uids.map(u => [u, true])), settings: { mode: 'quick' }, total: 6, order: Array(6).fill('math'), results };
    const rows = extractMatch(game).rows;
    for (const u of uids) {
      const mine = Object.values(results).every(rr => { const r = roundWin(rr, uids); return r.kind === 'win' && r.uid === u; });
      // the rule as the OVERCLOCK CARDS pass first wrote it (strictly the most, > 0) — independent of roundWin
      const old = Object.values(results).every(rr => { const me = rr[u].pts; return me > 0 && uids.every(v => v === u || rr[v].pts < me); });
      assert.equal(mine, old, 'the helper = the original rule');
      assert.equal(!!(rows[u] && rows[u].f && rows[u].f.sweep), mine, `seed ${s} ${u}`);
      swept += mine ? 1 : 0; checked++;
    }
  }
  assert.ok(swept > 20 && checked > 6000, `${swept} sweeps in ${checked}`);
});

// ---------------------------------------------------------------------------------------------- whole simulated QUICK matches → the record
const ORDER = ['math', 'pattern', 'oddone', 'stroop', 'count', 'truefalse'];
/** play a whole QUICK match through the director. plan(ci, uid) → { ok, doneMs } | null (didn't play) */
function playQuick(uids, plan, { mode = 'quick' } = {}) {
  let now = 1_000_000;
  const game = createGame({ matchId: 'sim', settings: { mode }, participants: Object.fromEntries(uids.map(u => [u, true])), now, seed: 'sim', bank: {}, trivia: { n: 99 }, order: ORDER.slice(0, MODES[mode]) });
  const online = Object.fromEntries(uids.map(u => [u, true]));
  const patches = [];
  while (game.phase !== 'final') {
    now = game.phaseEndsAt;
    applyPatch(game, nextStep(game, { now, boards: {}, online, fallback: () => null }));
    assert.equal(game.phase, 'play');
    const parts = partsFor(game.order[game.ci], levelOf(game.ci, game.total));
    const boards = {}, marks = {};
    for (const u of uids) {
      const p = plan(game.ci, u, parts);
      if (!p) continue;
      boards[u] = { p: parts, ok: p.ok, n: parts, done: true, doneAt: game.playStartAt + p.doneMs };
      marks[u] = { s: Array.from({ length: parts }, (_, i) => (i < p.ok ? '1' : '0')).join('') };
    }
    now = game.playStartAt + CHALLENGE_MS + 1000;
    const ctx = { now, boards, online, marks, fallback: () => null };
    const patch = nextStep(game, ctx);
    assert.deepEqual(nextStep(structuredClone(game), { ...structuredClone({ ...ctx, fallback: null }), fallback: () => null }), patch, 'a new host replaying the close writes the same patch');
    patches.push(patch);
    applyPatch(game, patch);
    if (game.phase === 'standings') { now = game.phaseEndsAt; applyPatch(game, nextStep(game, { now, boards: {}, online, fallback: () => null })); }
  }
  return { game, patches, flags: u => (extractMatch(game).rows[u] || {}).f || {} };
}
const perfect = ms => (ci, u, parts) => ({ ok: parts, doneMs: ms });

test('a WHOLE simulated QUICK match: REDLINE (sweep) 6 / 6 alone ✓ · 5 / 6 ✗ · a tied round ✗ · solo never — through match-report.js', () => {
  // ALICE perfect + fastest everywhere, BOB half right
  const hit = playQuick(['a', 'b'], (ci, u, parts) => (u === 'a' ? { ok: parts, doneMs: 8000 } : { ok: Math.floor(parts / 2), doneMs: 20000 }));
  assert.equal(hit.game.results && Object.keys(hit.game.results).length, 6, 'six results, the record\'s shape');
  assert.equal(hit.game.total, 6);
  assert.equal(hit.game.settings.mode, 'quick');
  assert.equal(hit.flags('a').sweep, 1, '6 / 6 alone');
  assert.ok(!hit.flags('b').sweep);
  assert.equal(roundWins(hit.game).a, 6);
  assert.ok(Object.keys(hit.game.rw).length === 6 && Object.values(hit.game.rw).every(r => r.w === 'a'), 'the stored round wins');
  // 5 / 6: BOB takes challenge 3
  const miss = playQuick(['a', 'b'], (ci, u, parts) => ((u === 'a') !== (ci === 3) ? { ok: parts, doneMs: 8000 } : { ok: 0, doneMs: 20000 }));
  assert.ok(!miss.flags('a').sweep, '5 / 6');
  assert.deepEqual(roundWins(miss.game), { a: 5, b: 1 });
  // a tied round (both perfect at the same moment in challenge 2) = nobody won it
  const tie = playQuick(['a', 'b'], (ci, u, parts) => (ci === 2 ? { ok: parts, doneMs: 9000 } : u === 'a' ? { ok: parts, doneMs: 8000 } : { ok: 0, doneMs: 20000 }));
  assert.equal(roundWinOf(tie.game, 2).kind, 'tie', 'the banner\'s DEAD HEAT');
  assert.deepEqual(tie.game.rw[2], { t: { a: true, b: true }, p: tie.game.results[2].a.pts });
  assert.ok(!tie.flags('a').sweep, 'a tied round is not won');
  assert.equal(roundWins(tie.game).a, 5);
  // a round nobody scored = no winner
  const blank = playQuick(['a', 'b'], (ci, u, parts) => (ci === 4 ? null : u === 'a' ? { ok: parts, doneMs: 8000 } : { ok: 1, doneMs: 25000 }));
  assert.deepEqual(blank.game.rw[4], { n: true }, 'NO WINNER');
  assert.ok(!blank.flags('a').sweep);
  // solo: winning every round alone is automatic — never REDLINE (nor PHOTO FINISH)
  const solo = playQuick(['a'], perfect(8000));
  assert.ok(!solo.flags('a').sweep && !solo.flags('a').photo);
});

test('a WHOLE simulated QUICK match: PHOTO FINISH (photo) by 1 ✓ · by 2 ✗ · a tie at the top ✗', () => {
  // the same perfect run, BOB 500 ms slower in challenge 1 = one speed point (60 × 0.5 / 30 s); everything else the same
  const by = ms => playQuick(['a', 'b'], (ci, u, parts) => ({ ok: parts, doneMs: 10000 + (u === 'b' && ci === 1 ? ms : 0) }));
  const one = by(500), two = by(1000), level = by(0);
  const tot = g => u => Object.values(g.results).reduce((s, r) => s + r[u].pts, 0);
  assert.equal(tot(one.game)('a') - tot(one.game)('b'), 1, 'one point');
  assert.equal(one.flags('a').photo, 1, 'by exactly one point');
  assert.ok(!one.flags('b').photo);
  assert.ok(!one.flags('a').sweep, 'the other five rounds were dead heats');
  assert.equal(tot(two.game)('a') - tot(two.game)('b'), 2);
  assert.ok(!two.flags('a').photo, 'by two');
  assert.equal(tot(level.game)('a'), tot(level.game)('b'));
  assert.ok(!level.flags('a').photo && !level.flags('b').photo, 'a tie at the top: no PHOTO FINISH (co-winners)');
  assert.ok(Object.values(level.game.rw).every(r => r.t), 'every round a DEAD HEAT');
});

// ---------------------------------------------------------------------------------------------- the director's new state
test('the close of a challenge stores rw + tm (+ cr when a best streak is set) — game.combo keeps its { c, m } exactly', () => {
  const sim = playQuick(['a', 'b', 'c'], (ci, u, parts) => (u === 'c' ? null : { ok: u === 'a' ? parts : 1, doneMs: u === 'a' ? 7000 : 31000 }));
  const p0 = sim.patches[0];
  assert.deepEqual(Object.keys(p0).filter(k => /^(rw|tm|cr)\//.test(k)).sort(), ['cr/a', 'cr/b', 'rw/0', 'tm/0']);
  assert.deepEqual(p0['tm/0'], { a: 7000, b: CHALLENGE_MS, c: CHALLENGE_MS }, 'ms to the finish, clamped to the 30 s; no board = the whole 30 s');
  for (const v of Object.values(sim.game.combo)) assert.deepEqual(Object.keys(v).sort(), ['c', 'm'], 'combo unchanged');
  assert.deepEqual(timesOf({ participants: { x: 1 }, playStartAt: 100 }, { x: { done: true, doneAt: 50 } }), { x: 0 }, 'never negative');
  // comboReachAt: the mark where the new best was set
  assert.equal(comboReachAt({ c: 0, m: 0 }, '111'), 2);
  assert.equal(comboReachAt({ c: 2, m: 5 }, '1111'), 3, 'from 2: the 6th in a row is the 4th mark');
  assert.equal(comboReachAt({ c: 0, m: 5 }, '1101'), -1, 'no new best');
  assert.equal(comboReachAt({ c: 3, m: 3 }, '1h1-1'), 4);
  assert.equal(comboFold({ c: 3, m: 3 }, '1h1-1').m, 6);
});

// ---------------------------------------------------------------------------------------------- THE AWARD CHIPS
const G = extra => ({ participants: { a: 1, b: 1, c: 1 }, total: 6, order: ['math', 'pattern', 'compass', 'oddone', 'truefalse', 'stroop'], results: {}, ...extra });
test('BEST STREAK: the highest maxStreak (≥ 3); a tie → the one who reached it EARLIER; none → no chip', () => {
  assert.deepEqual(awardChips(G({ combo: { a: { c: 0, m: 5 }, b: { c: 2, m: 7 }, c: { c: 0, m: 2 } } })), [{ k: 'streak', uid: 'b', v: 7 }]);
  assert.deepEqual(awardChips(G({ combo: { a: { c: 0, m: 6 }, b: { c: 6, m: 6 } }, cr: { a: 405, b: 207 } }))[0], { k: 'streak', uid: 'b', v: 6 }, 'b got there in challenge 2');
  assert.equal(awardChips(G({ combo: { a: { m: 6 }, b: { m: 6 } }, cr: { a: 203, b: 205 } }))[0].uid, 'a', 'same challenge: the earlier answer');
  assert.equal(awardChips(G({ combo: { a: { m: 6 }, b: { m: 6 } } }))[0].uid, 'a', 'no reach stored: join order');
  assert.deepEqual(awardChips(G({ combo: { a: { m: 2 }, b: { m: 1 } } })), [], `under ×${STREAK_CHIP_MIN}: skipped`);
  assert.deepEqual(awardChips(G({})), []);
});

test('FASTEST: the lowest average ms per RIGHT answer (≥ 3 right), the clockless challenges skipped; a tie → reached it earlier', () => {
  const results = {
    0: { a: { ok: 4 }, b: { ok: 4 }, c: { ok: 1 } },     // math: a 8 s, b 12 s
    1: { a: { ok: 2 }, b: { ok: 0 }, c: { ok: 1 } },     // pattern: a 10 s
    2: { a: { ok: 5 }, b: { ok: 5 }, c: { ok: 5 } },     // compass (skipped — its clock is the script's)
  };
  const tm = { 0: { a: 8000, b: 12000, c: 30000 }, 1: { a: 10000, b: 30000, c: 30000 }, 2: { a: 25000, b: 1, c: 1 } };
  const f = fastestOf(G({ results, tm }));
  assert.deepEqual(f.a, { avg: 3000, right: 6, last: 1 });
  assert.deepEqual(f.b, { avg: 3000, right: 4, last: 0 }, 'a challenge with no right answer adds nothing');
  assert.equal(f.c, undefined, `under ${FASTEST_MIN_RIGHT} right answers: out`);
  assert.ok(FASTEST_SKIP.has('compass') && FASTEST_SKIP.has('memory') && FASTEST_SKIP.has('reflex'));
  const chips = awardChips(G({ results, tm }));
  assert.deepEqual(chips, [{ k: 'fastest', uid: 'b', v: 3000, n: 4 }], 'a tie at 3.0 s: b reached it in challenge 0');
  assert.deepEqual(fastestOf(G({ results })), {}, 'a match from before OC2 stored no times: no chip');
  // half credit floors (Quick Count's off-by-one is not a right answer)
  assert.equal(fastestOf(G({ results: { 0: { a: { ok: 3.5 } } }, tm: { 0: { a: 9000 } } })).a.right, 3);
  // both chips together, the order fixed
  assert.deepEqual(awardChips(G({ results, tm, combo: { a: { m: 9 } } })).map(c => c.k), ['streak', 'fastest']);
});

// ---------------------------------------------------------------------------------------------- YOUR BEST / YOUR WORST
test('YOUR BEST / YOUR WORST: your points vs the room\'s best in each challenge (alone: vs the most it could score)', () => {
  const game = G({ results: { 0: R({ a: 100, b: 50, c: 0 }), 1: R({ a: 40, b: 160, c: 0 }), 2: R({ a: 0, b: 0, c: 0 }), 3: R({ a: 80, b: 80, c: 10 }) } });
  const bw = bestWorst(game, 'a');
  assert.equal(bw.best.ci, 0, 'first + alone on top (100 %) beats a shared 100 % with fewer points');
  assert.equal(bw.worst.ci, 2, 'a challenge nobody scored is 0 %');
  assert.equal(bestWorst(game, 'b').best.ci, 1);
  assert.equal(bestWorst(game, 'b').best.type, 'pattern');
  assert.equal(bestWorst(G({ results: { 0: R({ a: 5, b: 9 }) } }), 'a').worst, null, 'one challenge: no worst');
  assert.equal(bestWorst(G({ results: {} }), 'a'), null);
  assert.equal(bestWorst(G({ results: { 0: R({ a: 5 }) } }), 'zz'), null);
  const solo = { participants: { a: 1 }, total: 6, order: ['math', 'pattern', 'oddone', 'stroop', 'count', 'truefalse'], results: { 0: R({ a: 160 }), 5: R({ a: 160 }), 3: R({ a: 120 }) } };
  assert.equal(maxPts(solo, 5), 320);
  const s = bestWorst(solo, 'a');
  assert.equal(s.best.ci, 0, 'a perfect 160 / 160');
  assert.equal(s.worst.ci, 5, 'the last (×2): 160 of 320');
});

test('a whole 8-player QUICK match: round wins add up, the chips + best / worst are the same on every phone (pure, deterministic)', () => {
  const uids = 'abcdefgh'.split('');
  const plan = (ci, u, parts) => { const k = uids.indexOf(u); return { ok: Math.max(0, parts - ((k + ci) % (parts + 1))), doneMs: 6000 + ((k * 7 + ci * 3) % 20) * 1000 }; };
  const one = playQuick(uids, plan), two = playQuick(uids, plan);
  assert.deepEqual(awardChips(one.game), awardChips(two.game));
  const wins = roundWins(one.game), tied = Object.values(one.game.rw).filter(r => !r.w).length;
  assert.equal(Object.values(wins).reduce((a, b) => a + b, 0) + tied, 6, 'every round = one winner, or a dead heat / no winner');
  for (const u of uids) assert.deepEqual(bestWorst(one.game, u), bestWorst(two.game, u));
  assert.ok(awardChips(one.game).every(c => uids.includes(c.uid)));
});

// ---------------------------------------------------------------------------------------------- THE BEATS (inside the owner's timings)
test('THE BEATS fit INSIDE the after-challenge screen\'s own time: the answer ≥ the 3 s skip floor, then the banner, then the standings', async () => {
  const { resultBeats, finalBeats, beatAt, beatStart, standingsMs, SKIP_MIN_MS, FINAL_MS, FINAL_STANDINGS_MS } = await import('../js/games/overclock/logic.js');
  const { TYPES } = await import('../js/games/overclock/challenges.js');
  for (const t of TYPES) {
    const b = resultBeats(t), L = standingsMs(t);
    assert.equal(b.end, L, 'the screen keeps its max');
    assert.ok(b.banner >= SKIP_MIN_MS, `${t}: the answer holds ≥ 3 s (${b.banner})`);
    assert.ok(b.stand > b.banner && L - b.stand >= 3_500, `${t}: the standings get their time`);
    assert.deepEqual([0, b.banner, b.stand].map(ms => beatAt(b, ms)), ['answer', 'banner', 'stand']);
    assert.equal(beatAt(b, L + 5000), 'stand');
    const s = resultBeats(t, true);
    assert.equal(s.banner, null, 'solo: no banner');
    assert.equal(beatAt(s, b.banner + 10), 'answer');
    const f = finalBeats(t);
    assert.equal(beatAt(f, L), 'final');
    assert.equal(beatAt(f, L + FINAL_STANDINGS_MS), 'victory');
    assert.ok(f.victory < FINAL_MS - 60_000, 'the victory has a minute+ on screen');
    assert.equal(beatAt(finalBeats(t, true), L), 'victory', 'solo: no final standings');
    assert.equal(beatStart(f, 'victory'), f.victory);
  }
});
