// FR7 FIXES C — THE ONE DAY LINE (Grok's PROGRESSION + CALENDAR review, Nov 12 — honest players): every play is credited by its OWN time on
// the 4:00 am America/New_York streak day (M1–M3), a capped match still marks the night (M2), the week turns with it (S1), a won-back run
// pays its milestones once (S3), the reset's freezes show before the first play (S5), a skipped-by-the-gap report waits (M4, the pure half).
import '../api/_lib/catalog.js';   // (the server-only catalog — the milestones' items + FAVOR)
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { streakDay, dayStartAt, streakPlay, streakView, dayNum, dayOf, MILESTONES, FREEZE } from '../js/core/streak.js';
import { weekKey, weekEndsAt, dayKey } from '../js/core/week.js';
import { msToTurn } from '../js/daily/clock.js';
import { matchStep, payXp, playDay, DAILY_CEILING, dailyStep } from '../js/core/progress.js';
import { overallValues } from '../js/core/overall.js';
import { needsRetry, mergeOutcomes } from '../api/_lib/stats.js';

const H = 3600e3;
const ET = (y, m, d, h, mi, off) => Date.UTC(y, m - 1, d, h + off, mi);   // an Eastern wall clock (off = 5 EST · 4 EDT) → ms
const row = (rank = 1) => ({ rank, win: rank === 1, c: { p: 1, ...(rank === 1 ? { w: 1 } : {}) }, rec: {} });

// ---- M3 — THE 4 AM LINE ON THE NIGHTS THE CLOCKS CHANGE (TZ unset AND TZ=UTC) -------------------------------------------------------------
// [the date, its 00:00 Eastern in UTC, the UTC offset hours AFTER 4 am that day] — the streak day turns at 4:00 Eastern WALL CLOCK every one
const NIGHTS = [
  ['d20261101', Date.UTC(2026, 10, 1, 4), 'fall back (Sun Nov 1 2026: 2 am EDT → 1 am EST)'],
  ['d20270314', Date.UTC(2027, 2, 14, 5), 'spring forward (Sun Mar 14 2027: 2 am EST → 3 am EDT)'],
  ['d20271107', Date.UTC(2027, 10, 7, 4), 'fall back (Sun Nov 7 2027)'],
  ['d20261118', Date.UTC(2026, 10, 18, 5), 'a plain winter day'],
  ['d20260701', Date.UTC(2026, 6, 1, 4), 'a plain summer day'],
];
const wallHour = ms => +new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: '2-digit', hourCycle: 'h23' }).format(new Date(ms));
function table() {
  const out = [];
  for (const [dk, mid] of NIGHTS) for (let m = 0; m <= 6.5 * 60; m += 30) { const t = mid + m * 60e3; out.push([dk, t, streakDay(t)]); }
  return out;
}

test('M3 — dayStartAt = 4:00 am Eastern WALL CLOCK on every kind of day (08:00 UTC in summer time, 09:00 in winter)', () => {
  assert.equal(new Date(dayStartAt('d20261101')).toISOString(), '2026-11-01T09:00:00.000Z', 'fall back: 4 am EST');
  assert.equal(new Date(dayStartAt('d20270314')).toISOString(), '2027-03-14T08:00:00.000Z', 'spring forward: 4 am EDT');
  assert.equal(new Date(dayStartAt('d20271107')).toISOString(), '2027-11-07T09:00:00.000Z');
  for (const [dk] of NIGHTS) { assert.equal(wallHour(dayStartAt(dk)), 4, dk); assert.equal(dayKey(dayStartAt(dk)), dk, dk); }
});

test('M3 — every half hour from midnight to 6:30 am: the day before until 4:00 wall clock, then the day itself (the old rule turned at 5 am / 3 am)', () => {
  for (const [dk, t, got] of table()) {
    const want = wallHour(t) < 4 && dayKey(t) === dk ? dayOf(dayNum(dk) - 1) : dk;
    assert.equal(got, want, `${dk} at ${new Date(t).toISOString()} (${wallHour(t)}:xx ET)`);
  }
  // the review's exact cases: 4:30 am EDT on spring-forward Sunday is Sunday (was Saturday); 3:30 am EST on fall-back Sunday is still Saturday (was Sunday)
  assert.equal(streakDay(ET(2027, 3, 14, 4, 30, 4)), 'd20270314');
  assert.equal(streakDay(ET(2026, 11, 1, 3, 30, 5)), 'd20261031');
  assert.equal(streakDay(ET(2027, 11, 7, 3, 30, 5)), 'd20271106');
});

test('M3 — the same table with TZ=UTC (the server\'s zone) and with the machine\'s own zone', () => {
  const me = fileURLToPath(new URL('../js/core/streak.js', import.meta.url)).replace(/\\/g, '/');
  const code = `import('file:///${me.replace(/^\//, '')}').then(m => { const o = []; for (const t of ${JSON.stringify(table().map(r => r[1]))}) o.push(m.streakDay(t)); console.log(JSON.stringify(o)); })`;
  const want = JSON.stringify(table().map(r => r[2]));
  for (const TZ of ['UTC', 'America/Los_Angeles', undefined]) {
    const env = { ...process.env }; if (TZ) env.TZ = TZ; else delete env.TZ;
    assert.equal(execFileSync(process.execPath, ['--input-type=module', '-e', code], { env, encoding: 'utf8' }).trim(), want, `TZ=${TZ || '(unset)'}`);
  }
});

test('M3 — the countdown to the turn (msToTurn from an INSTANT): to the next 4:00 wall clock, an hour right on the DST nights', () => {
  // 3:00 am EDT spring-forward Sunday (Mar 14 2027 — the clocks jumped at 2): 1 h to 4 am EDT (the old wall-clock sum said 1 h too, but a screen
  // opened at 3:30 aimed at MONDAY — it read 24.5 h: the day hadn't turned by the old rule until 5)
  assert.equal(msToTurn(ET(2027, 3, 14, 3, 30, 4)), 0.5 * H);
  // fall-back Sunday Nov 1 2026, 1:30 am EST (the second 1:30): 2.5 h to 4 am EST
  assert.equal(msToTurn(ET(2026, 11, 1, 1, 30, 5)), 2.5 * H);
  // 1:30 am EDT the Saturday night before the spring change: 23 h + ... → 4 am EDT is only 1.5 wall hours + the lost hour = 1.5 h real time
  assert.equal(msToTurn(ET(2027, 3, 14, 1, 30, 5)), 1.5 * H);
  // an ordinary evening: 8 pm → 8 h; exactly at the turn: a whole day to the next
  assert.equal(msToTurn(ET(2026, 11, 18, 20, 0, 5)), 8 * H);
  assert.equal(msToTurn(dayStartAt('d20261118')), 24 * H);
  assert.equal(msToTurn(dayStartAt('d20270313')), 23 * H, 'the spring-forward day is 23 hours long');
  assert.equal(msToTurn(dayStartAt('d20261031')), 25 * H, 'the fall-back day is 25 hours long');
});

// ---- M1 — A MATCH IS CREDITED BY ITS MATCH TIME -------------------------------------------------------------------------------------------
test('M1 — a Friday-night match reported at 4:30 am Saturday is FRIDAY\'s: the streak, the day\'s counters, the week', () => {
  const fri = ET(2026, 11, 13, 23, 30, 5), late = ET(2026, 11, 14, 4, 30, 5);
  let s = matchStep(null, { key: 'a', gid: 'overclock', row: row(1), n: 4, now: ET(2026, 11, 12, 21, 0, 5), gap: 0 }).next;   // Thursday
  const r = matchStep(s, { key: 'b', gid: 'overclock', row: row(2), n: 4, now: late, at: fri, gap: 0 });
  assert.equal(r.next.st.d, 'd20261113', 'the run marks FRIDAY (the report came after 4 am)');
  assert.equal(r.next.st.n, 2, 'Thursday → Friday: the run goes on (it used to skip Friday → break on Saturday)');
  assert.equal(r.next.day.k, 'd20261113');
  // the same match credited by its REPORT time (the old behaviour) would have landed on Saturday:
  assert.equal(matchStep(s, { key: 'b', gid: 'overclock', row: row(2), n: 4, now: late, gap: 0 }).next.st.d, 'd20261114');
});

test('M1 — the match time never runs ahead of the server\'s clock (clamped to now)', () => {
  const now = ET(2026, 11, 13, 21, 0, 5);
  const r = matchStep(null, { key: 'a', gid: 'overclock', row: row(1), n: 4, now, at: now + 9 * H, gap: 0 });
  assert.equal(r.next.st.d, streakDay(now));
});

test('M1 + S1 — a Sunday-night match reported after Monday 4 am lands on ITS week (the board\'s week before), never wiping the new week', () => {
  const sun = ET(2026, 11, 15, 23, 0, 5), monLate = ET(2026, 11, 16, 5, 0, 5), monMatch = ET(2026, 11, 16, 4, 30, 5);
  let s = matchStep(null, { key: 'a', gid: 'overclock', row: row(1), n: 4, now: ET(2026, 11, 15, 20, 0, 5), gap: 0 }).next;   // Sunday 8 pm
  const sunX = s.xw.x;
  s = matchStep(s, { key: 'mon', gid: 'overclock', row: row(1), n: 4, now: monMatch, gap: 0 }).next;                          // Monday 4:30 am (the new week)
  const monX = s.xw.x;
  assert.equal(s.xw.wk, 'w20261116');
  const late = matchStep(s, { key: 'sun2', gid: 'overclock', row: row(2), n: 4, now: monLate, at: sun, gap: 0 });             // Sunday 11 pm, reported late
  assert.equal(late.next.xw.wk, 'w20261116', 'this week\'s counter stays this week\'s');
  assert.equal(late.next.xw.x, monX, '... unchanged');
  assert.deepEqual(late.next.xw.p, { wk: 'w20261109', x: sunX + late.xp.total }, 'the late match on last week\'s count');
  assert.equal(late.next.wk, 'w20261116'); assert.equal(late.wk, 'w20261109');
  assert.equal(late.next.gw.overclock.p, 1, 'this week\'s game counters untouched by last week\'s match');
  const v = overallValues(late.next, monLate);
  assert.equal(v.xp.weeks.w20261109, sunX + late.xp.total);
  assert.equal(v.xp.week, monX);
});

test('M1 — a late report for YESTERDAY keeps TODAY\'s counters (the day before is its own box: `pd`)', () => {
  const y = ET(2026, 11, 13, 23, 0, 5), t = ET(2026, 11, 14, 20, 0, 5);
  let s = matchStep(null, { key: 'a', gid: 'overclock', row: row(1), n: 4, now: ET(2026, 11, 13, 22, 0, 5), gap: 0 }).next;
  s = matchStep(s, { key: 't1', gid: 'prism', row: row(1), n: 4, now: t, gap: 0 }).next;
  s = matchStep(s, { key: 't2', gid: 'prism', row: row(1), n: 4, now: t + 600e3, gap: 0 }).next;
  const r = matchStep(s, { key: 'y2', gid: 'holdem', row: row(1), n: 4, now: t + 1200e3, at: y, gap: 0 });
  assert.deepEqual(r.next.day, { k: 'd20261114', g: { prism: 1 }, n: 2 }, 'today\'s box as it was');
  assert.equal(r.next.pd.k, 'd20261113'); assert.equal(r.next.pd.n, 2); assert.ok(r.next.pd.g.holdem);
  assert.ok(r.xp.parts.some(p => p.k === 'new'), 'NEW GAME TONIGHT on ITS night (holdem was new that night)');
  assert.equal(r.next.st.d, 'd20261114', 'the run\'s last day stays today');
});

// ---- M2 — THE CEILING, NEW GAME TONIGHT, VARIETY + THE SOLO CAP ON THE STREAK DAY -----------------------------------------------------------
test('M2 — THE DAILY CEILING counts the streak day: 20 matches 11 pm → 1 am, the 21st at 1:30 am is capped (midnight used to reset it)', () => {
  let s = null; const start = ET(2026, 11, 13, 23, 0, 5);
  for (let i = 0; i < DAILY_CEILING; i++) s = matchStep(s, { key: `m${i}`, gid: 'overclock', row: row(2), n: 4, now: start + i * 6 * 60e3, gap: 0 }).next;
  const r = matchStep(s, { key: 'm21', gid: 'overclock', row: row(1), n: 4, now: ET(2026, 11, 14, 1, 30, 5), gap: 0 });
  assert.equal(r.capped, true);
  assert.equal(r.xp.total, 0);
  // ... and after 4 am the count starts again
  const r2 = matchStep(r.next, { key: 'm22', gid: 'overclock', row: row(1), n: 4, now: ET(2026, 11, 14, 4, 5, 5), gap: 0 });
  assert.ok(!r2.capped && r2.xp.total > 0);
});

test('M2 — a CAPPED match still marks the streak (0 XP, no board, no counted play)', () => {
  let s = null; const thu = ET(2026, 11, 12, 20, 0, 5);
  s = matchStep(s, { key: 'thu', gid: 'overclock', row: row(1), n: 4, now: thu, gap: 0 }).next;
  // Friday: the ceiling already met (a simulation lifts `ceiling` to 0 to cap the first match of the night)
  const r = matchStep(s, { key: 'fri', gid: 'overclock', row: row(1), n: 4, now: thu + 24 * H, gap: 0, ceiling: 0 });
  assert.equal(r.capped, true);
  assert.equal(r.next.st.d, 'd20261113', 'Friday marked'); assert.equal(r.next.st.n, 2);
  assert.equal(r.next.xp, s.xp, 'no XP'); assert.equal(r.next.cp, s.cp, 'no counted play'); assert.equal(r.pbs.length, 0);
});

test('M2 — NEW GAME TONIGHT + VARIETY are the streak day\'s: 11 pm + 12:30 am of the same game = one night, no second +25', () => {
  const a = matchStep(null, { key: 'a', gid: 'overclock', row: row(2), n: 4, now: ET(2026, 11, 13, 23, 0, 5), gap: 0 });
  assert.ok(a.xp.parts.some(p => p.k === 'new'));
  const b = matchStep(a.next, { key: 'b', gid: 'overclock', row: row(2), n: 4, now: ET(2026, 11, 14, 0, 30, 5), gap: 0 });
  assert.ok(!b.xp.parts.some(p => p.k === 'new'), 'midnight is not a new night');
  const c = matchStep(b.next, { key: 'c', gid: 'overclock', row: row(2), n: 4, now: ET(2026, 11, 14, 4, 30, 5), gap: 0 });
  assert.ok(c.xp.parts.some(p => p.k === 'new'), '4:30 am is');
});

// ---- S1 — THE WEEK TURNS WITH THE STREAK DAY ----------------------------------------------------------------------------------------------
test('S1 — the week, the weekly goal\'s week + XP-this-week turn at MONDAY 4 AM (with the streak + the dailies), on both DST weeks', () => {
  for (const off of [5, 4]) {
    const y = off === 5 ? [2026, 11, 16] : [2026, 6, 15];
    const sunLate = ET(y[0], y[1], y[2], 3, 59, off), mon4 = ET(y[0], y[1], y[2], 4, 0, off);
    assert.equal(streakDay(sunLate), dayOf(dayNum(streakDay(mon4)) - 1));
    assert.notEqual(weekKey(sunLate), weekKey(mon4));
    assert.equal(weekKey(ET(y[0], y[1], y[2], 0, 0, off)), weekKey(sunLate), 'Monday 00:00 still last week');
    assert.equal(weekEndsAt(sunLate), mon4);
  }
  const s = payXp({}, 0, 50, ET(2026, 11, 16, 2, 0, 5));
  assert.equal(s.xw.wk, 'w20261109', 'XP earned at 2 am Monday counts on the week that ends at 4 am');
});

test('S1 — a daily\'s XP lands on its RUN\'s week, like its points (a Sunday-day run finished Monday 4:20 am)', () => {
  const r = dailyStep(null, { game: 'password', day: 'd20261115', now: ET(2026, 11, 16, 4, 20, 5), today: ['password'], counts: true, points: 50 });
  assert.equal(r.next.xw.wk, 'w20261109');
});

// ---- S3 — WIN IT BACK PAYS ONLY ABOVE THE LOST RUN -----------------------------------------------------------------------------------------
test('S3 — a 100+ night run broken + won back keeps ONE FAVOR (the milestones are paid only above the run it restores)', () => {
  const D = n => dayOf(dayNum('d20260101') + n);
  let next = {};
  for (let i = 0; i < 101; i++) playDay(next, 0, null, D(i));
  assert.equal(next.st.n, 101); assert.equal(next.fv, 1);
  next.st.f = 0;                                                           // no freezes left to cover the gap
  const evs = [];
  for (const d of [D(103), D(104), D(105)]) evs.push(playDay(next, 0, null, d).ev);   // broke on 102, back on 103: 3 plays in 3 days
  assert.ok(evs[0].broke && evs[0].offer, 'the break + the offer');
  assert.ok(evs[2].restored, 'won back');
  assert.equal(next.st.n, 101 + 3);
  assert.equal(next.fv, 1, 'no second FAVOR');
  assert.deepEqual(evs[2].milestones.map(m => m.n), [], 'nothing the lost run had passed is passed again');
  // a won-back run still passes what lies ABOVE: a 99-night run won back to 102 passes 100 (its FAVOR) once
  next = {};
  for (let i = 0; i < 99; i++) playDay(next, 0, null, D(i));
  next.st.f = 0;
  const e2 = []; for (const d of [D(101), D(102), D(103)]) e2.push(playDay(next, 0, null, d).ev);
  assert.deepEqual(e2[2].milestones.map(m => m.n), [100]);
  assert.equal(next.fv, 1);
});

// ---- S5 — THE RESET's FREEZES SHOW BEFORE THE FIRST PLAY -----------------------------------------------------------------------------------
test('S5 — after THE PROGRESS RESET (st = { f }) the card shows the freezes held — before the first play, capped at the hold limit', () => {
  assert.equal(streakView({ f: 2 }, 'd20261116').freezes, 2);
  assert.equal(streakView({ f: 9 }, 'd20261116').freezes, FREEZE.hold);
  assert.equal(streakView(null, 'd20261116').freezes, 0);
  assert.equal(streakView({ f: 2 }, 'd20261116').state, 'out', 'no run yet');
  assert.equal(streakPlay({ f: 2 }, 'd20261116').st.f, 2, 'the first play keeps them (FR7 FIXES B — E2)');
});

// ---- M4 — A REPORT SKIPPED BY THE GAP WAITS (the pure half; the server's 425 + the resend: server.test.mjs + e2e-profiles) ----------------
test('M4 — too_soon / busy outcomes mean "try again"; a retry keeps what an earlier try credited', () => {
  assert.equal(needsRetry({ a: { gid: 'prism' }, b: { skip: 'too_soon' } }), true);
  assert.equal(needsRetry({ a: { skip: 'busy' } }), true);
  assert.equal(needsRetry({ a: { gid: 'prism' }, b: { skip: 'counted' }, c: { skip: 'overlap' } }), false);
  const first = { p1: { gid: 'prism', xp: { gain: 40 } }, p2: { skip: 'too_soon' } };
  const second = { p1: { skip: 'counted' }, p2: { gid: 'prism', xp: { gain: 25 } } };
  assert.deepEqual(mergeOutcomes(first, second), { p1: first.p1, p2: second.p2 });
  assert.equal(matchStep({ last: 1000 }, { key: 'x', gid: 'prism', row: row(1), n: 4, now: 20_000 }).skip, 'too_soon');
});

test('MILESTONES — the FAVOR lives at 100 (the data S3 protects)', () => {
  assert.equal(MILESTONES.find(m => m.favor).n, 100);
});
