// CITY PART 1 — OVERCLOCK = ONE BOARD (the inbox, Nov 19 3:20 pm): BEST QUICK RUN, solo or in a room; THE DUMB LUCK CHECK; THE SEED.
import test from 'node:test';
import assert from 'node:assert/strict';
import { extractMatch, ocBoardScore, soloBoard } from '../js/core/match-report.js';
import { boardDef } from '../js/core/boards.js';
import { seedOcQuick } from '../js/core/board-fill.js';
import { DL_MAX, LUCK } from '../js/games/overclock/luck.js';
import { challengeMax, ptsCeiling } from '../js/games/overclock/logic.js';
import { SKILL_TYPES } from '../js/games/overclock/challenges.js';

test('THE DUMB LUCK CHECK: a long shot (260) out-scores any skill challenge that is not the ×2 final (160) — DUMB LUCK is never last', () => {
  assert.equal(DL_MAX, 260);
  assert.equal(challengeMax('math', false), 160);
  assert.ok(DL_MAX > challengeMax('math', false), 'so the board leaves DUMB LUCK out');
});

const room = (withLuck = true) => {
  const order = [...SKILL_TYPES.slice(0, 2), withLuck ? LUCK : SKILL_TYPES[2], ...SKILL_TYPES.slice(3, 6)];
  const pts = (t, ci, i) => (t === LUCK ? (i ? 0 : DL_MAX) : i ? ptsCeiling(t, 1, 3, ci === 5) : ptsCeiling(t, 2, 3, ci === 5));
  return { id: 'overclock', phase: 'final', matchId: 'm', participants: { ua: true, ub: true }, settings: { mode: 'quick' }, total: 6, order,
    results: Object.fromEntries(order.map((t, ci) => [ci, { ua: { pts: pts(t, ci, 0), ok: t === LUCK ? 0 : 2, parts: 3 }, ub: { pts: pts(t, ci, 1), ok: 1, parts: 3 } }])) };
};

test('A ROOM QUICK MATCH writes BEST QUICK RUN for both players — the BOARD score leaves DUMB LUCK\'s points out, the match\'s total + placings unchanged', () => {
  const g = room(true), ex = extractMatch(g);
  const total = Object.values(g.results).reduce((s, r) => s + r.ua.pts, 0);
  assert.equal(ex.rows.ua.rec['overclock-quick'], total - DL_MAX, 'ALICE: her skill points only');
  assert.equal(ocBoardScore(g, 'ua'), total - DL_MAX);
  assert.equal(ex.rows.ub.rec['overclock-quick'], Object.values(g.results).reduce((s2, r) => s2 + r.ub.pts, 0), 'BOB too — his skill points (no lucky ticket)');
  assert.equal(ex.rows.ua.rank, 1, 'the match is still won on its total (the lucky ticket counts there)');
  assert.deepEqual(ex.rejected, []);
});

test('the solo lane keeps the ONE board (a `both` board); STANDARD writes nothing; a forged total is refused', () => {
  assert.equal(soloBoard('overclock-quick'), 'overclock-quick');
  assert.equal(soloBoard('prism-rush'), boardDef('prism-rush-solo') ? 'prism-rush-solo' : null, 'every other board as before');
  const std = { ...room(false), settings: { mode: 'standard' } };
  assert.deepEqual(extractMatch(std).rows.ua.rec, {}, 'STANDARD: XP only');
  const forged = room(false); forged.results[0].ua.pts = 9999;
  const ex = extractMatch(forged);
  assert.equal(ex.rows.ua.rec['overclock-quick'], undefined);
  assert.ok(ex.rejected.some(r => r.uid === 'ua' && r.board === 'overclock-quick'));
});

test('THE SEED: BEST QUICK RUN starts from the old QUICK · SOLO best — the larger of the two, this week\'s row where it is this week\'s; idempotent', () => {
  const wk = 'w20261116';
  assert.equal(seedOcQuick(null, wk), null);
  assert.equal(seedOcQuick({ 'prism-rush': { a: 5 } }, wk), null, 'no old row: nothing to seed');
  const b = { 'overclock-quick-solo': { a: 900, w: 700, wk } };
  const s1 = seedOcQuick(b, wk);
  assert.deepEqual(s1, { a: 900, w: 700, wk });
  assert.equal(seedOcQuick({ ...b, 'overclock-quick': s1 }, wk), null, 'a second run changes nothing');
  assert.deepEqual(seedOcQuick({ ...b, 'overclock-quick': { a: 1200, w: 300, wk } }, wk), { a: 1200, w: 700, wk }, 'a better new all-time kept, this week\'s raised');
  assert.deepEqual(seedOcQuick({ 'overclock-quick-solo': { a: 900, w: 700, wk: 'w20261109' } }, wk), { a: 900 }, 'an old week\'s row seeds ALL TIME only');
  assert.equal(seedOcQuick({ 'overclock-quick-solo': { a: 0 } }, wk), null, 'a 0 is never a record');
});
