// DAILY A — DAILY BEST (js/core/daily-best.js): each daily's own rule, the step (idempotent), the view, the backfill (safe twice), a better
// try's points (pointsRaise) + JAYWALK's points curve (core/daily-points.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { BEST_RULES, BEST_DAILIES, bestCounts, isBetter, bestStep, bestView, bestFromRecords, pointsRaise, jwScore, jwLanes, jwTick, JW_SPAN } from '../js/core/daily-best.js';
import { dailyPoints, pointsStep, POINTS, JW_TOP, POINTS_FLOOR, POINTS_MAX } from '../js/core/daily-points.js';
import { DAILIES } from '../js/config.js';

test('every daily has a DAILY BEST rule (plug-and-play: a new row needs its rule)', () => {
  for (const d of DAILIES) assert.ok(BEST_RULES[d.id], `${d.id} has a best rule`);
  assert.deepEqual([...BEST_DAILIES].sort(), DAILIES.map(d => d.id).sort());
});

test('THE PASSWORD: fewer guesses better — a LOCKOUT never counts', () => {
  assert.ok(isBetter('password', 4, 7)); assert.ok(!isBetter('password', 7, 4)); assert.ok(!isBetter('password', 5, 5), 'a tie is not better');
  assert.ok(!bestCounts('password', 103), 'one door + locked out'); assert.ok(!bestCounts('password', 206), 'locked out at the first door');
  assert.ok(!isBetter('password', 104, null), 'a lockout is never a best, even the first');
  assert.ok(isBetter('password', 12, 103), 'a clean crack beats a stored lockout (never stored, but safe)');
});

test('COAST CLEAR: the fastest CLEAR — caught never counts', () => {
  assert.ok(isBetter('coastclear', 70, 95)); assert.ok(!isBetter('coastclear', 95, 70));
  assert.ok(!bestCounts('coastclear', 10000)); assert.ok(!bestCounts('coastclear', 10042), 'caught (+ the cells left)');
  assert.ok(!isBetter('coastclear', 10003, null));
});

test('THE DROP: the longest time (the lines break a tie); JAYWALK: the most lanes, then the EARLIER tick', () => {
  assert.ok(isBetter('drop', 1230 * 1000 + 4, 1200 * 1000 + 40)); assert.ok(isBetter('drop', 1200 * 1000 + 41, 1200 * 1000 + 40));
  assert.ok(!isBetter('drop', 600 * 1000, 900 * 1000));
  const a = jwScore(120, 9000), b = jwScore(120, 9500), c = jwScore(119, 100);
  assert.ok(isBetter('jaywalk', a, b), 'the same lanes: the earlier tick wins'); assert.ok(isBetter('jaywalk', b, c), 'more lanes beat any tick');
  assert.equal(jwLanes(a), 120); assert.equal(jwTick(a), 9000); assert.equal(jwScore(0, 0), JW_SPAN - 1);
});

test('bestStep: the first best (no p) → a better one (p = the one it beat) → a worse one changes nothing; idempotent', () => {
  let db = bestStep(null, { game: 'coastclear', score: 95, day: 'd20261110', now: 1 });
  assert.deepEqual(db.coastclear, { s: 95, day: 'd20261110', at: 1 });
  assert.deepEqual(bestView(db.coastclear, 'd20261110'), { best: { s: 95, day: 'd20261110' }, newBest: false, first: true });
  assert.equal(bestStep(db, { game: 'coastclear', score: 95, day: 'd20261110', now: 2 }), null, 'the same result again: unchanged');
  assert.equal(bestStep(db, { game: 'coastclear', score: 120, day: 'd20261111', now: 2 }), null, 'a slower clear: unchanged');
  assert.equal(bestStep(db, { game: 'coastclear', score: 10004, day: 'd20261111', now: 2 }), null, 'caught: unchanged');
  db = bestStep(db, { game: 'coastclear', score: 71, day: 'd20261112', now: 3 });
  assert.deepEqual(db.coastclear, { s: 71, day: 'd20261112', at: 3, p: 95 });
  assert.deepEqual(bestView(db.coastclear, 'd20261112'), { best: { s: 71, day: 'd20261112' }, newBest: true, first: false });
  assert.deepEqual(bestView(db.coastclear, 'd20261113'), { best: { s: 71, day: 'd20261112' }, newBest: false, first: false }, 'the next day: not new');
  assert.deepEqual(bestView(null, 'd1'), { best: null, newBest: false, first: false });
  // (JAYWALK's tries: a better try the SAME day keeps that day's p — beating your own first try is no NEW DAILY BEST; the first ever stays FIRST)
  let j = bestStep(null, { game: 'jaywalk', score: jwScore(20, 900), day: 'd20261118', now: 1 });
  j = bestStep(j, { game: 'jaywalk', score: jwScore(30, 900), day: 'd20261118', now: 2 });
  assert.deepEqual(bestView(j.jaywalk, 'd20261118'), { best: { s: jwScore(30, 900), day: 'd20261118' }, newBest: false, first: true });
  j = bestStep(j, { game: 'jaywalk', score: jwScore(40, 900), day: 'd20261119', now: 3 });
  j = bestStep(j, { game: 'jaywalk', score: jwScore(45, 900), day: 'd20261119', now: 4 });
  assert.equal(j.jaywalk.p, jwScore(30, 900), 'the best it beat = the earlier DAY best'); assert.equal(bestView(j.jaywalk, 'd20261119').newBest, true);
  db = bestStep(db, { game: 'password', score: 6, day: 'd20261112', now: 3 });
  assert.equal(db.coastclear.s, 71, 'another daily never touches this one');
});

test('THE BACKFILL: each daily\'s rule over the kept days, merged with what is stored — safe to run twice; days before the reset left out', () => {
  const days = {
    password: { d20261102: 9, d20261103: 104, d20261104: 5, d20261105: 7 },
    coastclear: { d20261102: 10005, d20261103: 88 },
    drop: { d20261102: 1500 * 1000 + 3 },
    jaywalk: { d20261115: jwScore(40, 2000), d20261116: jwScore(55, 4000) },
  };
  const r1 = bestFromRecords(null, days);
  assert.deepEqual(Object.fromEntries(Object.entries(r1.db).map(([g, x]) => [g, x.s])), { password: 5, coastclear: 88, drop: 1500003, jaywalk: jwScore(55, 4000) });
  assert.ok(Object.values(r1.db).every(x => !('p' in x) && x.bf === 1), 'a backfilled best never claims NEW DAILY BEST');
  const r2 = bestFromRecords(r1.db, days);
  assert.deepEqual(r2.changed, [], 'run twice: nothing changes'); assert.deepEqual(r2.db, r1.db);
  const stored = { password: { s: 3, day: 'd20261117', at: 9, p: 5 } };
  const r3 = bestFromRecords(stored, days);
  assert.deepEqual(r3.db.password, stored.password, 'a better stored (live) best stays, its NEW mark kept');
  const r4 = bestFromRecords(null, days, { fromDay: 'd20261104' });
  assert.equal(r4.db.password.s, 5); assert.equal(r4.db.coastclear, undefined, 'days before the reset left out');
});

test('pointsRaise: a better try adds only the DIFFERENCE (the day, its week, ALL TIME) — never a second day played', () => {
  const day = 'd20261118';
  const dp = pointsStep(null, { game: 'jaywalk', day, pts: 40 });
  const up = pointsRaise(dp, { game: 'jaywalk', day, pts: 70 });
  assert.equal(up.d[day].g.jaywalk, 70); assert.equal(up.d[day].t, 70);
  const wk = Object.keys(up.w)[0];
  assert.equal(up.w[wk].t, 70); assert.equal(up.w[wk].g.jaywalk, 70);
  assert.equal(up.a.t, 70); assert.equal(up.a.n, 1, 'still ONE day played'); assert.equal(up.a.g.jaywalk.t, 70); assert.equal(up.a.g.jaywalk.n, 1);
  assert.equal(pointsRaise(up, { game: 'jaywalk', day, pts: 70 }), null, 'the same points: unchanged');
  assert.equal(pointsRaise(up, { game: 'jaywalk', day, pts: 50 }), null, 'fewer: unchanged');
  assert.equal(pointsRaise(up, { game: 'jaywalk', day: 'd20261101', pts: 90 }), null, 'a day not scored: unchanged');
});

test('JAYWALK\'s points: a CAPPED lanes curve — floor at 0 lanes, 100 from JW_TOP, never fewer for more lanes, the tick never counts', () => {
  assert.equal(JW_TOP, 300); assert.ok(POINTS.jaywalk.high);
  assert.equal(dailyPoints('jaywalk', jwScore(0, 0)), POINTS_FLOOR);
  assert.equal(dailyPoints('jaywalk', jwScore(300, 17000)), POINTS_MAX); assert.equal(dailyPoints('jaywalk', jwScore(520, 17999)), POINTS_MAX);
  assert.deepEqual([50, 100, 150, 200, 250].map(l => dailyPoints('jaywalk', jwScore(l, 5000))), [40, 56, 69, 80, 90]);
  let last = 0;
  for (let l = 0; l <= 320; l++) { const p = dailyPoints('jaywalk', jwScore(l, 9000)); assert.ok(p >= last, `${l} lanes never fewer than ${l - 1}`); last = p; }
  assert.equal(dailyPoints('jaywalk', jwScore(120, 100)), dailyPoints('jaywalk', jwScore(120, 17000)), 'the tick never changes the points');
  assert.ok(dailyPoints('jaywalk', jwScore(299, 0)) < POINTS_MAX, '299 lanes is not the top');
});
