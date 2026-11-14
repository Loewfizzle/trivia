// BOARD 2.0 A — DAILY POINTS + THE DAILIES' BOARDS (pure): each table row (best / worst / lost / not played), a better result never fewer points,
// "skipping never helps" (a simulated fortnight, both periods), the 10-day threshold, the 4 am crossing, THE THROWAWAY GATE, a repeat writes
// nothing, THE BACK-FILL's rebuild, and THE SIMULATION (40 bots × 2 weeks → the boards' order = a hand-computed one).
import test from 'node:test';
import assert from 'node:assert/strict';
import { dailyPoints, POINTS, POINT_DAILIES, POINTS_FLOOR, MIN_DAYS, pointsStep, pointsValues, pointsFromRecords, weekOfDay, averageOf, ALL_TIME_RULE } from '../js/core/daily-points.js';
import { dailyStep } from '../js/core/progress.js';
import { overallValues } from '../js/core/overall.js';
import { boardDef, fmtValue } from '../js/core/boards.js';
import { dayOf, dayNum, dayStartAt } from '../js/core/streak.js';
import { weekKey } from '../js/core/week.js';
import { DAILIES } from '../js/config.js';
import { simulate } from '../scripts/sim-board.mjs';

const T = ['password', 'coastclear'];
const at = (day, h = 9) => dayStartAt(day) + (h - 4) * 3600e3;   // (an Eastern hour on that daily-day)

test('THE TABLE — a row for every daily on the list; each daily its own board (PLUG-AND-PLAY)', () => {
  for (const d of DAILIES) if (d.on !== false && ['password', 'coastclear'].includes(d.id)) assert.ok(POINTS[d.id], d.id);
  assert.deepEqual(POINT_DAILIES, DAILIES.map(d => d.id).filter(id => POINTS[id]));
  for (const id of ['daily', ...POINT_DAILIES.map(g => `daily-${g}`)]) { const b = boardDef(id); assert.ok(b && b.kind === 'overall' && b.points && b.minDays === MIN_DAYS, id); }
  assert.equal(fmtValue({ fmt: 'avg' }, 8325), '83.3');
});

test('THE PASSWORD row — both doors 100 … 60, one door 55 … 25, locked out at the first door 10; not played 0', () => {
  assert.equal(dailyPoints('password', 2), 100);
  assert.equal(dailyPoints('password', 12), 60);
  assert.equal(dailyPoints('password', 107), 55, 'the first door in 1, then locked out');
  assert.equal(dailyPoints('password', 112), 25, 'the first door in 6, then locked out');
  assert.equal(dailyPoints('password', 206), POINTS_FLOOR);
  assert.equal(dailyPoints('password', null), null, 'not played → no points (0 on the board)');
});

test('COAST CLEAR row — cleared 100 at ≤ 0:45 … 40 past 15:00; caught 10 … 30 by the harbor opened', () => {
  assert.equal(dailyPoints('coastclear', 30), 100);
  assert.equal(dailyPoints('coastclear', 79), 83, 'the sim\'s median clear');
  assert.equal(dailyPoints('coastclear', 240), 50);
  assert.equal(dailyPoints('coastclear', 5000), 40, 'the slowest clear');
  assert.equal(dailyPoints('coastclear', 10089), POINTS_FLOOR, 'caught with nothing opened');
  assert.equal(dailyPoints('coastclear', 10001), 30, 'caught with one cell left');
});

test('A BETTER RESULT NEVER SCORES FEWER POINTS; a played-and-lost day always > 0 (every score a run makes, in the game\'s own order)', () => {
  // THE PASSWORD: lower score = better (both doors 2–12, one door 107–112, locked out 206)
  const pw = [...Array.from({ length: 11 }, (_, i) => 2 + i), ...Array.from({ length: 6 }, (_, i) => 107 + i), 206];
  for (let i = 1; i < pw.length; i++) assert.ok(dailyPoints('password', pw[i]) < dailyPoints('password', pw[i - 1]), `${pw[i - 1]} → ${pw[i]}`);
  // COAST CLEAR: lower = better (every clear second to an hour, then every caught run)
  const cc = [...Array.from({ length: 3601 }, (_, i) => i), ...Array.from({ length: 90 }, (_, i) => 10000 + i)];
  for (let i = 1; i < cc.length; i++) assert.ok(dailyPoints('coastclear', cc[i]) <= dailyPoints('coastclear', cc[i - 1]), `${cc[i - 1]} → ${cc[i]}`);
  assert.ok(dailyPoints('coastclear', 10000 + 1) < dailyPoints('coastclear', 9999), 'the best caught run below the slowest clear');
  for (const s of [...pw, ...cc]) assert.ok(dailyPoints(s < 1000 || s === 206 ? 'password' : 'coastclear', s) >= (s === 206 || s >= 10000 ? POINTS_FLOOR : 0));
  for (const s of cc) assert.ok(dailyPoints('coastclear', s) >= POINTS_FLOOR);
});

test('pointsStep — the day, its week, ALL TIME; a day + game twice = no-op; weekOfDay = the board\'s week', () => {
  let dp = pointsStep(null, { game: 'password', day: 'd20261109', pts: 80 });
  dp = pointsStep(dp, { game: 'coastclear', day: 'd20261109', pts: 70 });
  assert.equal(pointsStep(dp, { game: 'coastclear', day: 'd20261109', pts: 99 }), null, 'a repeat writes nothing');
  assert.deepEqual(dp.d.d20261109, { g: { password: 80, coastclear: 70 }, t: 150 });
  assert.equal(dp.a.n, 1, 'one day played'); assert.equal(dp.a.t, 150); assert.equal(dp.a.g.password.n, 1);
  for (const day of ['d20261109', 'd20261115', 'd20261116', 'd20261101', 'd20261102']) assert.equal(weekOfDay(day), weekKey(dayStartAt(day) + 8 * 3600e3), day);
  assert.equal(dp.w[weekOfDay('d20261109')].t, 150);
});

test('SKIPPING NEVER HELPS — a player who skips their worst day ranks below one who plays it, on THIS WEEK + ALL TIME', () => {
  const play = (skip) => {
    let s = null;
    for (let k = 0; k < 14; k++) {
      const day = dayOf(dayNum('d20261109') + k), worst = k === 9;
      if (skip && worst) continue;
      for (const g of T) s = dailyStep(s, { game: g, day, now: at(day), today: T, counts: true, points: worst ? POINTS_FLOOR : 80 }).next;
    }
    return s;
  };
  const now = at('d20261122', 16), A = overallValues(play(false), now), B = overallValues(play(true), now);
  for (const b of ['daily', 'daily-password', 'daily-coastclear']) {
    assert.ok(A[b].week > B[b].week, `${b} THIS WEEK: ${A[b].week} > ${B[b].week}`);
    assert.ok(A[b].all > B[b].all, `${b} ALL TIME (${ALL_TIME_RULE}): ${A[b].all} > ${B[b].all}`);
  }
  // a played-and-lost day beats not playing: one floor day > none
  const lost = overallValues(dailyStep(null, { game: 'password', day: 'd20261116', now: at('d20261116'), today: T, counts: true, points: dailyPoints('password', 206) }).next, at('d20261116'));
  assert.ok(lost.daily.week > 0 && lost['daily-password'].week === POINTS_FLOOR);
});

test('THE 10-DAY THRESHOLD — 9 days: unranked on ALL TIME, the average still known; 10: ranked (× 100)', () => {
  let s = null;
  for (let k = 0; k < 10; k++) {
    const day = dayOf(dayNum('d20261109') + k);
    s = dailyStep(s, { game: 'password', day, now: at(day), today: T, counts: true, points: 70 + k }).next;
    const v = pointsValues(s.dp, 'password');
    if (k < 9) assert.ok(v.all === null && v.avg > 0 && v.days === k + 1, `day ${k + 1}: ${JSON.stringify(v)}`);
    else assert.equal(v.all, Math.round(((70 + 79) / 2) * 100), 'ranked at 10: the average × 100');
  }
  assert.equal(averageOf({ t: 300, n: 3, f: 'd20261101', l: 'd20261105' }, 'span'), 60, 'span: two skipped days in between count 0');
  assert.equal(averageOf({ t: 300, n: 3, f: 'd20261101', l: 'd20261105' }, 'played'), 100, 'played: per day played');
});

test('THE 4 AM CROSSING — yesterday\'s run finishing after today\'s lands on ITS day + week; today\'s untouched', () => {
  const T2 = ['password', 'coastclear'];
  let s = dailyStep(null, { game: 'password', day: 'd20261116', now: at('d20261116', 5), today: T2, counts: true, points: 90 }).next;   // Monday's
  s = dailyStep(s, { game: 'coastclear', day: 'd20261115', now: at('d20261116', 5) + 60e3, today: T2, counts: true, points: 60 }).next;   // Sunday's run, finished Monday 5 am
  assert.equal(s.dp.d.d20261116.t, 90); assert.equal(s.dp.d.d20261115.t, 60);
  assert.equal(s.dp.w.w20261116.t, 90, 'Monday\'s week'); assert.equal(s.dp.w.w20261109.t, 60, 'Sunday\'s run on last week');
});

test('THE THROWAWAY GATE — a non-counting result earns no points (the XP + streak as usual)', () => {
  const r = dailyStep(null, { game: 'password', day: 'd20261116', now: at('d20261116'), today: T, counts: false, points: 90 });
  assert.equal(r.next.dp, undefined); assert.equal(r.points, null); assert.ok(r.next.xp > 0);
});

test('A REPEAT FINISH WRITES NOTHING — the day\'s key skips the step (points included)', () => {
  const a = dailyStep(null, { game: 'password', day: 'd20261116', now: at('d20261116'), today: T, counts: true, points: 90 });
  assert.equal(dailyStep(a.next, { game: 'password', day: 'd20261116', now: at('d20261116') + 5000, today: T, counts: true, points: 90 }).skip, 'counted');
});

test('THE BACK-FILL — the points rebuilt from the stored COUNTED results through the same table', () => {
  const daily = { password: { d20261108: { r: { p1: 4, p2: 206 }, x: {} }, d20261109: { r: { p1: 110 }, x: {} } }, coastclear: { d20261108: { r: { p1: 79, p3: 60 }, x: { p3: 1 } } } };
  const dp = pointsFromRecords(daily, 'p1');
  assert.equal(dp.d.d20261108.t, dailyPoints('password', 4) + dailyPoints('coastclear', 79));
  assert.equal(dp.d.d20261109.t, dailyPoints('password', 110));
  assert.equal(dp.a.n, 2);
  assert.equal(pointsFromRecords(daily, 'p2').a.t, POINTS_FLOOR);
  assert.equal(pointsFromRecords(daily, 'p3'), null, 'a non-counting result earns nothing');
});

test('THE SIMULATION — 40 bots with mixed habits, 2 weeks: every board\'s order (THIS WEEK + ALL TIME) = the hand-computed one', () => {
  const { hand, server } = simulate();
  for (const b of Object.keys(hand)) {
    assert.ok(hand[b].week.length > 20, `${b}: a full week (${hand[b].week.length})`);
    assert.deepEqual(server[b], hand[b], b);
  }
});

test('THE DROP A — THE DROP\'s row: a CAPPED curve on the time survived; a longer run never fewer points (the lines never lower them); any played day ≥ the floor; THE END = 100', async () => {
  const { scoreOf, DROP_END_MS } = await import('../js/games/prism/drop.js');
  assert.ok(POINTS.drop, 'a points row');
  assert.equal(dailyPoints('drop', scoreOf(0, 0)), POINTS_FLOOR, 'topped out at once = the floor');
  assert.equal(dailyPoints('drop', scoreOf(DROP_END_MS, 120)), 100, 'THE END (the guaranteed end) = POINTS_MAX');
  assert.equal(dailyPoints('drop', scoreOf(DROP_END_MS - 100, 999)), 99, 'just short of THE END: under 100 whatever the lines');
  assert.equal(dailyPoints('drop', scoreOf(120_000, 30)), 49);
  assert.equal(dailyPoints('drop', scoreOf(240_000, 60)), 69);
  let last = -1;
  for (let t = 0; t <= DROP_END_MS; t += 100) for (const ln of [0, 500, 999]) {
    const p = dailyPoints('drop', scoreOf(t, ln));
    assert.ok(p >= POINTS_FLOOR && p <= 100, `${t}: ${p}`);
    if (ln === 0) { assert.ok(p >= last, `never fewer at ${t} (${p} < ${last})`); last = p; }
    assert.equal(p, dailyPoints('drop', scoreOf(t, 0)), 'the lines break board ties only — never the points');
  }
});
