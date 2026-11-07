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

// ---- THE REWARDS (Group 6): GHOST RUN + LIGHTHOUSE from the SERVER's record (api/_lib/cc.js#flags → core/progress.js#dailyStep → the award engine)
test('THE REWARDS\' FLAGS from a replayed record: LIGHTHOUSE = any clear · GHOST RUN = zero spots AT the threshold (not a second over) · a caught run = nothing', async () => {
  // (the pure rule — api/_lib/cc.js#flags = runFlags(replay(the server's record)); the unit job has no firebase-admin, so the server module is the /api tests')
  const { runFlags, GHOST_S, replay } = await import('../js/games/coastclear/logic.js');
  const CC_DAILY = { flags: ({ record, startedAt, data }) => (record && data ? runFlags(replay(record, data, { startedAt })) : null) };
  assert.equal(GHOST_S, 50, 'the simulation\'s time (scripts/sim-coastclear.mjs: ≈ the best ~9 % of clean runs)');
  assert.deepEqual(runFlags({ out: 'clear', spots: 0, score: GHOST_S }), { clear: 1, ghost: 1 }, 'exactly at the threshold: earned');
  assert.deepEqual(runFlags({ out: 'clear', spots: 0, score: GHOST_S + 1 }), { clear: 1 }, 'one second over: LIGHTHOUSE only');
  assert.deepEqual(runFlags({ out: 'clear', spots: 1, score: 20 }), { clear: 1 }, 'a spot: never GHOST RUN, however fast');
  assert.equal(runFlags({ out: 'caught', spots: 3, score: 10020 }), null);
  assert.equal(runFlags(null), null);
  // the cartridge reads the RECORD (the phone's claim is never an input): a real record replayed on its board
  const clean = play();   // zero spots, ~1 s a move → well over 50 s
  const fl = CC_DAILY.flags({ record: clean.rec, startedAt: clean.rec.st, data: board });
  assert.deepEqual(fl, { clear: 1 });
  const fast = (() => { let rec = newRecord(1000); let now = 1000; for (const c of safe) { now += 100; const r = serverAct(board, rec, 'dig', { cell: c }, now); if (r.record) rec = r.record; } return rec; })();
  assert.deepEqual(CC_DAILY.flags({ record: fast, startedAt: fast.st, data: board }), { clear: 1, ghost: 1 }, 'a fast clean clear from the record: both');
  const forged = { ...fast, e: fast.e - 60000 };   // an end time the moves can't have made (before the start)
  assert.equal(CC_DAILY.flags({ record: { ...forged, e: fast.st - 1 }, startedAt: fast.st, data: board }), null, 'a faked finish (a record no run makes): nothing');
  assert.equal(CC_DAILY.flags({ record: { st: 1000, mv: ['d0'] }, startedAt: 1000, data: board }), null, 'an unfinished record: nothing');
});

test('THE REWARDS through the daily step: LIGHTHOUSE on any clear, GHOST RUN on the ghost flag, never twice, another game\'s flags not COAST CLEAR\'s', async () => {
  await import('../api/_lib/catalog.js');   // (the server-only catalog registers the achievements, as on the server)
  const { dailyStep } = await import('../js/core/progress.js');
  const T0 = Date.UTC(2026, 10, 10, 20), DAY = 864e5;
  let r = dailyStep(null, { game: 'coastclear', day: 'd20261110', now: T0, flags: { clear: 1 } });
  assert.deepEqual(r.ach, ['lighthouse']); assert.ok(r.items.includes('emb-lighthouse') && !r.items.includes('card-ghost-run'));
  assert.equal(r.next.pa.gf['coastclear-clear'], 1);
  r = dailyStep(r.next, { game: 'coastclear', day: 'd20261111', now: T0 + DAY, flags: { clear: 1, ghost: 1 } });
  assert.deepEqual(r.ach, ['ghost-run']); assert.ok(r.items.includes('card-ghost-run') && !r.items.includes('emb-lighthouse'));
  const r3 = dailyStep(r.next, { game: 'coastclear', day: 'd20261112', now: T0 + 2 * DAY, flags: { clear: 1, ghost: 1 } });
  assert.deepEqual(r3.ach, []); assert.ok(!r3.items.includes('card-ghost-run'), 'never twice');
  assert.deepEqual(dailyStep(null, { game: 'coastclear', day: 'd20261110', now: T0, flags: null }).ach, [], 'a caught run (no flags): nothing');
  assert.deepEqual(dailyStep(null, { game: 'password', day: 'd20261110', now: T0, flags: { clear: 1, ghost: 1 } }).ach, [], 'THE PASSWORD\'s flags never COAST CLEAR\'s');
});

test('THE REWARDS\' WIRING: the lab rows (strip + full card + emblem), the lab text, the server catalog, the CSS crop = the effect\'s (~10 % lower than centre), the hero-spot rule', async () => {
  const { readFileSync } = await import('node:fs');
  const { LAB } = await import('../js/vault/catalog.js');
  const { CC_SPECS } = await import('../js/fx/cc-specs.js');
  const { HERO, heroMisses } = await import('../js/vault/hero.js');
  const lab = JSON.stringify(LAB);
  for (const id of ['card-ghost-run', 'full-card-ghost-run', 'emb-lighthouse']) assert.ok(LAB.find(x => x.id === id), id);
  void lab;
  const text = readFileSync(new URL('../api/_lib/lab-text.js', import.meta.url), 'utf8'), cat = readFileSync(new URL('../api/_lib/catalog.js', import.meta.url), 'utf8');
  for (const id of ['card-ghost-run', 'full-card-ghost-run', 'emb-lighthouse']) assert.match(text, new RegExp(`"${id}": \{ "name"`), `${id}: its lab text`);
  assert.match(cat, /C\('card-ghost-run', 'GHOST RUN', 'rare'/); assert.match(cat, /E\('emb-lighthouse', 'LIGHTHOUSE', 'uncommon'/);
  assert.match(cat, /p\.gf\['coastclear-clear'\]/); assert.match(cat, /p\.gf\['coastclear-ghost'\]/);
  const css = readFileSync(new URL('../css/vault.css', import.meta.url), 'utf8');
  const S = CC_SPECS['card-ghost-run'];
  const m = /\.vl-s-cc-ghost-run \.vl-mat \{ background: #\w+ url\('\.\.\/assets\/vault\/cc\/ghost-run\.webp'\) (\d+)% (\d+)% \/ cover/.exec(css);
  assert.ok(m); assert.deepEqual([+m[1], +m[2]], S.strip, 'the strip\'s crop = the effect\'s');
  assert.ok(S.strip[1] >= 60 && S.strip[1] <= 66, 'the strip ~10 % lower than centre (the boat sits low)');
  assert.ok(HERO['card-ghost-run']); assert.ok(HERO['card-ghost-run'][0][0] + HERO['card-ghost-run'][0][2] / 2 >= 0.6, 'the boat right of centre');
  assert.deepEqual(heroMisses(), []);
});
