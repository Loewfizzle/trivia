// COAST CLEAR — THE RULES (CC1 — docs/coastclear.md): counts at the edges + corners, the flood, the chord (right / wrong buoys), SPOTTED (+30 s,
// play goes on, the 3rd ends it), nothing after the end, the win, the score for every outcome, the pauses, the replay (re-scores a record or
// rejects one no run makes), the phone's fold (answers out of order) + the clock.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  neighbours, countsOf, flood, openingOf, freshState, applyMove, serverAct, runView, replay, scoreOf, bucketOf, foldAnswer, clockMs, fmtClock,
  chordTargets, emptyView, stateOf, parseMove, moveText, safeCount, MAX_PAUSES, PAUSE_CAP_MS, CAUGHT, BUCKETS, W, H, LIGHTS, SPOT_S, PAUSE_S, MAX_SPOTS, DEFAULT_SETTINGS, chatLocked,
} from '../js/games/coastclear/logic.js';
import * as M from '../js/games/coastclear/meta.js';

// a 5 × 4 test board:      x: 0 1 2 3 4
//   y0   .  .  .  .  .         lights at (3,1) = 8 · (4,2) = 14 · (0,3) = 15
//   y1   .  .  .  L  .
//   y2   .  .  .  .  L
//   y3   L  .  .  .  .
const B = { w: 5, h: 4, lights: [8, 14, 15], start: 0 };
const C = countsOf(B);

test('the meta: 9 × 12, 18 searchlights, +30 s a spot, +15 s a pause, the 3rd spot ends it; one source for the console', () => {
  assert.deepEqual([W, H, LIGHTS, SPOT_S, PAUSE_S, MAX_SPOTS], [9, 12, 18, 30, 15, 3]);
  assert.equal(DEFAULT_SETTINGS, M.DEFAULT_SETTINGS); assert.equal(chatLocked, M.chatLocked); assert.equal(M.chatLocked(), false);
});

test('neighbours + counts: a corner has 3, an edge 5, the middle 8; the counts at the edges + corners', () => {
  assert.deepEqual(neighbours(0, 5, 4), [1, 5, 6]);
  assert.equal(neighbours(4, 5, 4).length, 3); assert.equal(neighbours(19, 5, 4).length, 3); assert.equal(neighbours(15, 5, 4).length, 3);
  assert.equal(neighbours(2, 5, 4).length, 5); assert.equal(neighbours(10, 5, 4).length, 5); assert.equal(neighbours(7, 5, 4).length, 8);
  assert.equal(neighbours(0, 9, 12).length, 3); assert.equal(neighbours(4, 9, 12).length, 5); assert.equal(neighbours(50, 9, 12).length, 8);
  // row by row: y0 0 0 1 1 1 · y1 0 0 1 L 2 · y2 1 1 1 2 L · y3 L 1 0 1 1
  assert.deepEqual(C, [0, 0, 1, 1, 1, 0, 0, 1, -1, 2, 1, 1, 1, 2, -1, -1, 1, 0, 1, 1]);
});

test('THE FLOOD: a 0 opens its whole calm area + the numbered edge, BFS from the tap; a number opens alone; a light never floods', () => {
  const f = flood(B, C, 0);
  assert.deepEqual(f.map(c => c[0]).sort((a, b) => a - b), [0, 1, 2, 5, 6, 7, 10, 11, 12]);
  assert.equal(f[0][0], 0, 'the tapped cell first');
  assert.deepEqual(flood(B, C, 9), [[9, 2]]);
  assert.deepEqual(flood(B, C, 8), []);
  // 17 is a 0 — its area: 11 12 13 16 17 18 (not 15, a light; it never touches a 0's flood by a light)
  assert.deepEqual(flood(B, C, 17).map(c => c[0]).sort((a, b) => a - b), [11, 12, 13, 16, 17, 18]);
  // the already-open cells are never listed again
  assert.deepEqual(flood(B, C, 17, new Set([11, 12])).map(c => c[0]).sort((a, b) => a - b), [13, 16, 17, 18]);
  assert.equal(openingOf(B).length, 9);
});

test('a DIG: a safe cell opens; an open cell is free (its own number back, nothing recorded); a light = SPOTTED and the run goes on', () => {
  let st = freshState(B, C);
  assert.equal(st.open.size, 9, 'the opening is open at the start');
  const r1 = applyMove(B, C, st, { kind: 'dig', cell: 9 });
  assert.deepEqual(r1.cells, [[9, 2]]); assert.equal(r1.changed, true); st = r1.st;
  const again = applyMove(B, C, st, { kind: 'dig', cell: 9 });
  assert.equal(again.changed, false); assert.deepEqual(again.cells, [[9, 2]]);
  const r2 = applyMove(B, C, st, { kind: 'dig', cell: 8 });
  assert.deepEqual(r2.lit, [8]); assert.equal(r2.st.done, false, 'one spot: keep going'); st = r2.st;
  const r3 = applyMove(B, C, st, { kind: 'dig', cell: 8 });
  assert.equal(r3.changed, false, 'a spotted light dug again = free');
  assert.equal(applyMove(B, C, st, { kind: 'dig', cell: 99 }).refused, 'bad_cell');
  assert.equal(applyMove(B, C, st, { kind: 'dig', cell: -1 }).refused, 'bad_cell');
});

test('a CHORD: right buoys open the rest (+ a flood); too few / too many refused at no cost; a WRONG buoy leaves a light un-buoyed → SPOTTED', () => {
  const st = freshState(B, C);
  // cell 7 (a 1): its unopened neighbours are 3, 8, 13 — the light is 8
  const right = applyMove(B, C, st, { kind: 'chord', cell: 7, buoys: [8] });
  assert.deepEqual(right.cells.map(c => c[0]).sort((a, b) => a - b), [3, 13]); assert.deepEqual(right.lit, []);
  assert.equal(applyMove(B, C, st, { kind: 'chord', cell: 7, buoys: [] }).refused, 'chord_count');
  assert.equal(applyMove(B, C, st, { kind: 'chord', cell: 7, buoys: [3, 8] }).refused, 'chord_count');
  assert.equal(applyMove(B, C, st, { kind: 'chord', cell: 7, buoys: [8, 99, 0] }).cells.length, 2, 'buoys off its neighbours / on open cells are ignored');
  const wrong = applyMove(B, C, st, { kind: 'chord', cell: 7, buoys: [3] });
  assert.deepEqual(wrong.lit, [8], 'the light the wrong buoy left is dug = spotted'); assert.deepEqual(wrong.cells.map(c => c[0]), [13]);
  assert.equal(applyMove(B, C, st, { kind: 'chord', cell: 0, buoys: [] }).refused, 'not_a_number', 'a 0 never chords');
  assert.equal(applyMove(B, C, st, { kind: 'chord', cell: 9, buoys: [8] }).refused, 'not_a_number', 'an unopened cell never chords');
  // a spotted light counts as known around a number
  const sp = applyMove(B, C, st, { kind: 'dig', cell: 8 }).st;
  const after = applyMove(B, C, sp, { kind: 'chord', cell: 7, buoys: [] });
  assert.deepEqual(after.cells.map(c => c[0]).sort((a, b) => a - b), [3, 13]);
  // a chord with nothing left to open changes nothing (free)
  assert.equal(applyMove(B, C, right.st, { kind: 'chord', cell: 7, buoys: [8] }).changed, false);
});

test('the 3rd spot ends the run (CAUGHT); nothing after the end; every safe cell open = CLEAR', () => {
  let st = freshState(B, C);
  for (const c of [8, 14]) st = applyMove(B, C, st, { kind: 'dig', cell: c }).st;
  assert.equal(st.done, false);
  const third = applyMove(B, C, st, { kind: 'dig', cell: 15 });
  assert.equal(third.st.done, true); assert.equal(third.st.out, 'caught');
  assert.equal(applyMove(B, C, third.st, { kind: 'dig', cell: 9 }).refused, 'done');
  // CLEAR
  let s2 = freshState(B, C);
  for (const c of [3, 4, 9, 13, 16, 17, 18, 19]) s2 = applyMove(B, C, s2, { kind: 'dig', cell: c }).st;
  assert.equal(s2.open.size, safeCount(B)); assert.equal(s2.done, true); assert.equal(s2.out, 'clear');
  // a spot then a clear: still a CLEAR (with its +30 s)
  let s3 = applyMove(B, C, freshState(B, C), { kind: 'dig', cell: 14 }).st;
  for (const c of [3, 4, 9, 13, 16, 17, 18, 19]) s3 = applyMove(B, C, s3, { kind: 'dig', cell: c }).st;
  assert.equal(s3.out, 'clear'); assert.equal(s3.lit.length, 1);
});

test('the SCORE: clean · with spots · with pauses · caught (below every finished run, the more crossed the better); the buckets', () => {
  assert.equal(scoreOf({ out: 'clear', ms: 125_400 }), 125);
  assert.equal(scoreOf({ out: 'clear', ms: 125_400, spots: 2 }), 185);
  assert.equal(scoreOf({ out: 'clear', ms: 125_400, spots: 1, pauses: 2 }), 185);
  assert.equal(scoreOf({ out: 'caught', ms: 30_000, spots: 3, safeLeft: 40 }), CAUGHT + 40);
  assert.ok(scoreOf({ out: 'caught', safeLeft: 0 }) > scoreOf({ out: 'clear', ms: 9e9, spots: 2, pauses: 50 }), 'a caught run ranks below every finished run');
  assert.ok(scoreOf({ out: 'caught', safeLeft: 10 }) < scoreOf({ out: 'caught', safeLeft: 50 }));
  assert.equal(bucketOf(0), 0); assert.equal(bucketOf(124), 24); assert.equal(bucketOf(1199), 239); assert.equal(bucketOf(5000), 240);
  assert.equal(bucketOf(CAUGHT), 241); assert.equal(bucketOf(CAUGHT + 500), BUCKETS - 1); assert.ok(bucketOf(CAUGHT + 90) < BUCKETS);
  for (let s = 0; s < CAUGHT + 120; s += 7) { const b = bucketOf(s); assert.ok(b >= 0 && b < BUCKETS); if (s > 0) assert.ok(b >= bucketOf(s - 7), 'monotone'); }
});

test('THE SERVER: dig → only opened cells; idempotent digs; the pause stops the clock (+15 s), a move resumes it; nothing after the end', () => {
  let rec = null;
  const T = 1_000_000;
  const a = serverAct(B, rec, 'dig', { cell: 9 }, T + 1000); rec = a.record;
  assert.deepEqual(a.resp.cells, [[9, 2]]); assert.deepEqual(rec.mv, ['d9']); assert.equal(rec.st, T + 1000, 'a fresh record starts at the move (the daily passes the real start)');
  rec = { ...rec, st: T };
  const free = serverAct(B, rec, 'dig', { cell: 9 }, T + 2000);
  assert.equal(free.record, null, 'a repeated dig writes nothing'); assert.equal(free.resp.already, true); assert.deepEqual(free.resp.cells, [[9, 2]]);
  const free2 = serverAct(B, rec, 'dig', { cell: 0 }, T + 2000);
  assert.equal(free2.record, null); assert.deepEqual(free2.resp.cells.map(c => c[0]).sort((a, b) => a - b), [0, 1, 2, 5, 6, 7, 10, 11, 12], 'an opening cell: free — its whole flood back (FR7 FIXES A — DY6: a lost flood answer re-sent in full)');
  // pause → resume
  const p = serverAct(B, rec, 'pause', {}, T + 10_000); rec = p.record;
  assert.equal(rec.p.n, 1); assert.equal(rec.p.at, T + 10_000);
  assert.equal(serverAct(B, rec, 'pause', {}, T + 11_000).record, null, 'a second pause while paused = free');
  const r = serverAct(B, rec, 'resume', {}, T + 40_000); rec = r.record;
  assert.equal(rec.p.ms, 30_000); assert.equal(rec.p.at, undefined);
  assert.equal(serverAct(B, rec, 'resume', {}, T + 41_000).record, null, 'a resume when running = free');
  // a pause, then a dig resumes by itself
  rec = serverAct(B, rec, 'pause', {}, T + 50_000).record;
  const d = serverAct(B, rec, 'dig', { cell: 3 }, T + 55_000); rec = d.record;
  assert.equal(d.resp.resumed, true); assert.equal(rec.p.ms, 35_000); assert.equal(rec.p.n, 2);
  // the spots, the end
  for (const c of [8, 14]) rec = serverAct(B, rec, 'dig', { cell: c }, T + 60_000).record;
  const end = serverAct(B, rec, 'dig', { cell: 15 }, T + 70_000); rec = end.record;
  assert.equal(end.resp.done, true); assert.equal(end.resp.out, 'caught'); assert.equal(end.resp.spots, 3); assert.equal(rec.e, T + 70_000); assert.equal(rec.o, 'caught');
  assert.equal(serverAct(B, rec, 'dig', { cell: 4 }, T + 80_000).refused, 'done');
  assert.equal(serverAct(B, rec, 'chord', { cell: 7, buoys: [8] }, T + 80_000).refused, 'done');
  assert.equal(serverAct(B, rec, 'pause', {}, T + 80_000).refused, 'done');
  assert.equal(serverAct(B, rec, 'nope', {}, T).refused, 'bad_action');
  // the view never names an unopened cell
  const v = runView(rec, B);
  const known = new Set([...v.open.map(c => c[0]), ...v.lit]);
  assert.ok(v.open.every(([c, n]) => n === C[c]) && v.lit.every(c => C[c] === -1));
  assert.ok(known.size < B.w * B.h);
});

test('THE REPLAY: re-scores a finished record (clean · spots · pauses · caught); rejects a record no run makes', () => {
  const T = 5_000_000;
  let rec = { st: T, mv: [] };
  for (const [c, at] of [[3, 10e3], [14, 20e3], [4, 30e3], [9, 40e3], [13, 50e3], [16, 60e3], [17, 70e3]]) rec = serverAct(B, rec, 'dig', { cell: c }, T + at).record;
  rec = serverAct(B, rec, 'pause', {}, T + 85e3).record;
  rec = serverAct(B, rec, 'resume', {}, T + 95e3).record;
  const last = serverAct(B, rec, 'dig', { cell: 19 }, T + 100e3); rec = last.record;
  assert.equal(last.resp.out, 'clear');
  const r = replay(rec, B);
  assert.deepEqual({ out: r.out, spots: r.spots, pauses: r.pauses, ms: r.ms }, { out: 'clear', spots: 1, pauses: 1, ms: 90e3 });
  assert.equal(r.score, 90 + 30 + 15);
  // a clean run with a chord
  let c2 = { st: T, mv: [] };
  c2 = serverAct(B, c2, 'chord', { cell: 7, buoys: [8] }, T + 5e3).record;
  for (const c of [4, 9, 16, 17, 19]) c2 = serverAct(B, c2, 'dig', { cell: c }, T + 20e3).record;
  assert.equal(replay(c2, B).score, 20); assert.equal(replay(c2, B).out, 'clear');
  // caught
  let c3 = { st: T, mv: [] };
  for (const c of [8, 14, 15]) c3 = serverAct(B, c3, 'dig', { cell: c }, T + 9e3).record;
  assert.equal(replay(c3, B).score, CAUGHT + safeCount(B) - 9);
  // REJECTED: unfinished · a no-op recorded · a move after the end · a bad move · the wrong outcome · a missing end · an open pause · pauses > the run
  assert.equal(replay({ st: T, mv: ['d9'] }, B), null);
  assert.equal(replay({ ...rec, mv: ['d9', 'd9', ...rec.mv.slice(1)] }, B), null);
  assert.equal(replay({ ...c3, mv: [...c3.mv, 'd9'] }, B), null);
  assert.equal(replay({ ...rec, mv: ['x1', ...rec.mv] }, B), null);
  assert.equal(replay({ ...rec, mv: ['c7:', ...rec.mv] }, B), null, 'a chord with the wrong count');
  assert.equal(replay({ ...rec, o: 'caught' }, B), null);
  assert.equal(replay({ ...rec, e: undefined }, B), null);
  assert.equal(replay({ ...rec, p: { n: 1, ms: 0, at: T } }, B), null);
  assert.equal(replay({ ...rec, p: { n: 1, ms: 1e9 } }, B), null);
  assert.equal(replay({ ...rec, e: T - 5 }, B), null);
  assert.equal(replay(null, B), null);
  // Firebase may hand an array back as an object with number keys
  assert.equal(replay({ ...rec, mv: Object.fromEntries(rec.mv.map((m, i) => [i, m])) }, B).score, r.score);
});

test('DFIX1 — THE PAUSE CAPS: 3 accepted pauses a run, 20 min stopped in all; past either a pause is refused + the clock runs; an open pause stops at the cap', () => {
  assert.equal(MAX_PAUSES, 3); assert.equal(PAUSE_CAP_MS, 20 * 60_000);
  const T = 7_000_000, MIN = 60_000;
  // the count: three pauses of a minute each are accepted, the 4th refused (409 pause_limit) — nothing written, the clock running
  let rec = { st: T, mv: [] };
  for (let k = 0; k < 3; k++) {
    const p = serverAct(B, rec, 'pause', {}, T + (2 * k + 1) * MIN); assert.equal(p.resp.pauses, k + 1); rec = p.record;
    rec = serverAct(B, rec, 'resume', {}, T + (2 * k + 2) * MIN).record;
  }
  const fourth = serverAct(B, rec, 'pause', {}, T + 7 * MIN);
  assert.equal(fourth.refused, 'pause_limit'); assert.equal(fourth.status, 409); assert.equal(fourth.record, undefined, 'a refused pause writes nothing');
  assert.equal(rec.p.at, undefined, 'the clock is running'); assert.equal(rec.p.n, 3); assert.equal(rec.p.ms, 3 * MIN);
  // the total: one long pause is counted up to 20 minutes — a resume 25 minutes later stops 20, the 5 past the cap run on the clock
  let r2 = serverAct(B, { st: T, mv: [] }, 'pause', {}, T + MIN).record;
  r2 = serverAct(B, r2, 'resume', {}, T + 26 * MIN).record;
  assert.equal(r2.p.ms, PAUSE_CAP_MS); assert.equal(r2.p.n, 1);
  assert.equal(serverAct(B, r2, 'pause', {}, T + 27 * MIN).refused, 'pause_limit', 'the 20 minutes used up: no more pauses');
  // the total across pauses: 15 + then a second pause that runs past the 20 → stopped exactly 20 in all
  let r3 = serverAct(B, { st: T, mv: [] }, 'pause', {}, T).record;
  r3 = serverAct(B, r3, 'resume', {}, T + 15 * MIN).record;
  r3 = serverAct(B, r3, 'pause', {}, T + 16 * MIN).record;
  // the open pause past the cap: a pause call closes it at the cap (WRITTEN) and is refused — the clock running again
  const late = serverAct(B, r3, 'pause', {}, T + 30 * MIN);
  assert.equal(late.refused, 'pause_limit'); assert.ok(late.record, 'the auto-resume is written');
  assert.equal(late.record.p.at, undefined); assert.equal(late.record.p.ms, PAUSE_CAP_MS); assert.equal(late.record.p.n, 2);
  // a pause still under the cap while paused = free, as before
  assert.equal(serverAct(B, r3, 'pause', {}, T + 18 * MIN).resp.already, true);
  // a DIG after a long pause resumes at the cap; the replay scores the 10 minutes past it + 15 s a pause
  let r4 = serverAct(B, { st: T, mv: [] }, 'pause', {}, T).record;
  const d = serverAct(B, r4, 'dig', { cell: 3 }, T + 30 * MIN); r4 = d.record;
  assert.equal(d.resp.resumed, true); assert.equal(r4.p.ms, PAUSE_CAP_MS);
  for (const c of [4, 9, 13, 16, 17, 19]) r4 = serverAct(B, r4, 'dig', { cell: c }, T + 30 * MIN).record;
  const rp = replay(r4, B);
  assert.equal(rp.out, 'clear'); assert.equal(rp.ms, 10 * MIN); assert.equal(rp.score, 600 + 15);
  // THE PHONE's clock: an open pause stops it only up to the cap
  const v = { ...emptyView(), startedAt: T, paused: true, pausedAt: T + MIN, pausedMs: 0, pauses: 1 };
  assert.equal(clockMs(v, T + 11 * MIN), MIN + 15_000, 'ten minutes paused: the clock stopped at 1:00 (+15 s)');
  assert.equal(clockMs(v, T + 31 * MIN), 11 * MIN + 15_000, 'thirty minutes paused: 20 stopped, the 10 past the cap on the clock');
  // THE REPLAY refuses a record past either cap (a forged one)
  assert.equal(replay({ ...r4, p: { n: 4, ms: 0 } }, B), null);
  assert.equal(replay({ ...r4, p: { n: 1, ms: PAUSE_CAP_MS + 1 } }, B), null);
});

test('the moves on the wire: parse + print, buoys sorted + unique', () => {
  assert.deepEqual(parseMove('d45'), { kind: 'dig', cell: 45 });
  assert.deepEqual(parseMove('c30:21,22'), { kind: 'chord', cell: 30, buoys: [21, 22] });
  assert.deepEqual(parseMove('c30:'), { kind: 'chord', cell: 30, buoys: [] });
  assert.equal(parseMove('d'), null); assert.equal(parseMove('c3:a'), null); assert.equal(parseMove(null), null);
  assert.equal(moveText({ kind: 'chord', cell: 7, buoys: [9, 3, 9] }), 'c7:3,9');
  const { ok } = stateOf(B, { mv: ['d9', 'c7:8'] });
  assert.equal(ok, true);
});

test('THE PHONE: answers fold in out of order (pipelined taps); the clock (server time, the pauses stopped, + the penalties); the chord pre-check', () => {
  const v0 = { ...emptyView({ w: 5, h: 4, lights: 3, startedAt: 1000 }), open: openingOf(B) };
  const a = { cells: [[9, 2]], lit: [], spots: 0, done: false }, b = { cells: [[3, 1]], lit: [8], spots: 1, done: false };
  const ab = foldAnswer(foldAnswer(v0, a), b), ba = foldAnswer(foldAnswer(v0, b), a);
  assert.deepEqual(new Map(ab.open), new Map(ba.open)); assert.equal(ab.spots, 1); assert.equal(ba.spots, 1); assert.deepEqual(ab.lit, [8]);
  const late = foldAnswer(ab, { cells: [], lit: [], spots: 0 });
  assert.equal(late.spots, 1, 'an older answer never lowers the spots');
  assert.equal(foldAnswer(ab, { cells: [], lit: [], spots: 3, done: true, out: 'caught', finishedAt: 9000 }).done, true);
  // the clock
  assert.equal(clockMs({ startedAt: 1000, pausedMs: 0, spots: 0, pauses: 0 }, 61_000), 60_000);
  assert.equal(clockMs({ startedAt: 1000, pausedMs: 10_000, spots: 1, pauses: 1 }, 61_000), 50_000 + 45_000);
  assert.equal(clockMs({ startedAt: 1000, pausedMs: 0, paused: true, pausedAt: 31_000, spots: 0, pauses: 1 }, 61_000), 30_000 + 15_000, 'stopped while paused');
  assert.equal(clockMs({ startedAt: 1000, finishedAt: 21_000, pausedMs: 0, spots: 0, pauses: 0 }, 99_000), 20_000, 'frozen at the finish');
  assert.equal(fmtClock(83_400), '1:23'); assert.equal(fmtClock(0), '0:00'); assert.equal(fmtClock(605_000), '10:05');
  // the chord pre-check on the phone
  const v = { ...emptyView({ w: 5, h: 4, lights: 3 }), open: openingOf(B) };
  assert.deepEqual(chordTargets(v, 7, new Set([8])).sort((x, y) => x - y), [3, 13]);
  assert.equal(chordTargets(v, 7, new Set()), null);
  assert.equal(chordTargets(v, 0, new Set()), null);
});
