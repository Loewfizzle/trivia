// COAST CLEAR — CC2 (docs/coastclear.md): the end screen's lines, the finished harbor, THE REVEAL (only once the run is over), the share line +
// THE SHARE CARD's inputs (NO BOARD in them), the countdown, the day number. Pure — node --test tests/coastclear-cc2.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { serverAct, runView, newRecord, foldAnswer, emptyView, endLine, finalMs, headline, endMap, shareLine, shareInputs, dayNumber, msToTurn, fmtCountdown, countsOf, safeCount } from '../js/games/coastclear/logic.js';
import { SHARE_KEYS } from '../js/games/coastclear/share.js';
import { makeBoard } from '../api/_lib/cc-solve.js';
import { rngFrom } from '../js/core/rng.js';
import { dayNumber as pwDay } from '../js/games/password/logic.js';

const board = makeBoard(a => rngFrom(`cc2-test:${a}`)).board;
const C = countsOf(board), L = new Set(board.lights);
const safe = [...Array(board.w * board.h).keys()].filter(i => !L.has(i));

/** play a record forward: every safe cell (a clear) or three lights (caught), `spots` lights first */
function play({ spots = 0, caught = false, t0 = 1_000_000 } = {}) {
  let rec = newRecord(t0), now = t0, last = null;
  const act = (a, args) => { now += 1000; const r = serverAct(board, rec, a, args, now); if (r.record) rec = r.record; last = r.resp; return r; };
  for (let k = 0; k < (caught ? 3 : spots); k++) act('dig', { cell: board.lights[k] });
  if (!caught) for (const c of safe) act('dig', { cell: c });
  return { rec, last, view: runView(rec, board) };
}

test('THE REVEAL: a run that is still going never names a light it has not spotted; a finished run (and its last answer) reveals every light', () => {
  const mid = runView(newRecord(5), board);
  assert.equal(mid.reveal, undefined, 'no reveal while the run is on');
  const r1 = serverAct(board, newRecord(5), 'dig', { cell: board.lights[0] }, 10);
  assert.equal(r1.resp.reveal, undefined, 'a spot (play goes on) reveals nothing');
  const { last, view } = play({ caught: true });
  assert.equal(view.done, true); assert.equal(view.out, 'caught');
  assert.deepEqual(view.reveal.slice().sort((a, b) => a - b), board.lights.slice().sort((a, b) => a - b), 'the finished view: every light');
  assert.deepEqual(last.reveal.slice().sort((a, b) => a - b), board.lights.slice().sort((a, b) => a - b), 'the last answer: every light');
  const folded = foldAnswer({ ...emptyView(), startedAt: 1 }, last);
  assert.equal(folded.reveal.length, board.lights.length, 'the phone keeps the reveal');
});

test('THE END LINES: COAST CLEAR / CAUGHT · the big time = the score\'s seconds · "0 SPOTTED" · "1 SPOTTED · +30 s" · caught "3 SPOTTED · m:ss"', () => {
  const clean = play().view;
  assert.equal(headline(clean), 'COAST CLEAR');
  assert.equal(endLine(clean), '0 SPOTTED');
  const secs = Math.round((clean.finishedAt - clean.startedAt) / 1000);
  assert.equal(finalMs(clean), secs * 1000);
  const one = play({ spots: 1 }).view;
  assert.equal(endLine(one), '1 SPOTTED · +30 s');
  assert.equal(finalMs(one), (Math.round((one.finishedAt - one.startedAt) / 1000) + 30) * 1000, 'the +30 s is in the big time');
  const two = play({ spots: 2 }).view;
  assert.equal(endLine(two), '2 SPOTTED · +60 s');
  assert.equal(endLine({ ...one, pauses: 1 }), '1 SPOTTED · +30 s · 1 PAUSE · +15 s');
  const caught = play({ caught: true }).view;
  assert.equal(headline(caught), 'CAUGHT');
  assert.match(endLine(caught), /^3 SPOTTED · \d+:\d\d$/);
});

test('THE FINISHED HARBOR: numbers on the open water, gold where a light found you, buoys on the lights a clear marked, a caught run\'s unfound lights + shut water', () => {
  const one = play({ spots: 1 }).view;
  const m = endMap(one, board.lights.slice(1));
  assert.equal(m.length, board.w * board.h);
  assert.equal(m[board.lights[0]].k, 'spot');
  for (const c of board.lights.slice(1)) assert.equal(m[c].k, 'buoy');
  for (const c of safe) { assert.equal(m[c].k, 'open'); assert.equal(m[c].n, C[c]); }
  const caught = play({ caught: true }).view;
  const open = new Set(caught.open.map(x => x[0]));
  const shutSafe = safe.find(c => !open.has(c));
  const mc = endMap(caught, shutSafe != null ? [shutSafe, board.lights[5]] : [board.lights[5]]);
  assert.equal(mc[board.lights[0]].k, 'spot'); assert.equal(mc[board.lights[2]].k, 'spot');
  assert.equal(mc[board.lights[5]].k, 'buoy', 'a light the player buoyed');
  assert.equal(mc[board.lights[9]].k, 'light', 'a light never found — revealed');
  if (shutSafe != null) assert.equal(mc[shutSafe].k, 'miss', 'a buoy on safe water');
  assert.ok(mc.some(x => x.k === 'shut') || open.size === safeCount(board));
});

test('THE SHARE: the one line + THE CARD\'s inputs carry NO BOARD (no cell, no light, no count) — only the headline, the time / line, the lamps lit', () => {
  const one = play({ spots: 1 }).view;
  const line = shareLine(one, 'd20261112');
  assert.match(line, /^COAST CLEAR #12 · \d+:\d\d · 1 spotted · neonspeakeasy\.com$/);
  const caught = play({ caught: true }).view;
  assert.match(shareLine(caught, 'd20261101'), /^COAST CLEAR #1 · caught · 3 spotted · \d+:\d\d · neonspeakeasy\.com$/);
  for (const v of [one, caught, play().view]) {
    const I = shareInputs(v, 'd20261112');
    assert.deepEqual(Object.keys(I).sort(), [...SHARE_KEYS].sort(), 'exactly the card\'s keys');
    for (const [k, x] of Object.entries(I)) assert.ok(x == null || typeof x === 'string' || typeof x === 'number' || typeof x === 'boolean', `${k}: a plain value, never a list`);
    assert.ok(I.spots <= 3 && !('reveal' in I) && !('open' in I) && !('lit' in I));
    // THE PROOF: the same result on a DIFFERENT harbor (other cells open, other lights, another reveal) gives the very same inputs — nothing
    // in them depends on the board
    const other = { ...v, open: [[0, 1], [1, 2]], lit: v.lit.map((_, k) => 100 + k), reveal: [3, 4, 5], w: 9, h: 12 };
    assert.deepEqual(shareInputs(other, 'd20261112'), I);
    assert.equal(shareLine(other, 'd20261112'), shareLine(v, 'd20261112'));
  }
});

test('the day number shares THE PASSWORD\'s epoch; the countdown to 4 am Eastern', () => {
  for (const d of ['d20261101', 'd20261107', 'd20270301']) assert.equal(dayNumber(d), pwDay(d));
  assert.equal(dayNumber('2026-11-07'), 7);
  assert.equal(fmtCountdown(msToTurn({ h: 14, mi: 53, s: 16 })), '13:06:44');
  assert.equal(fmtCountdown(msToTurn({ h: 4, mi: 0, s: 0 })), '24:00:00');
  assert.equal(fmtCountdown(msToTurn({ h: 3, mi: 59, s: 59 })), '0:00:01');
});
