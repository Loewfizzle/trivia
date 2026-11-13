// BOARD 2.0 A — THE OVERALL BOARD = XP THIS WEEK (pure): THE ONE XP PAYMENT (core/progress.js#payXp), the week rollover (Monday 00:00 ET — a
// DST week too), a replay pays once, the solo lane at its capped XP, the dailies' XP, the board values (core/overall.js), THE BACK-FILL's rebuild
// (core/board-fill.js), and the grep: NO XP path skips the board.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { matchStep, dailyStep, payXp, weekXp } from '../js/core/progress.js';
import { overallValues } from '../js/core/overall.js';
import { rebuildWeekXp, filledWeek } from '../js/core/board-fill.js';
import { boardDef, OVERALL_IDS } from '../js/core/boards.js';
import { weekKey } from '../js/core/week.js';
import { SOLO_XP } from '../js/core/ranks.js';

const ET = (y, m, d, h, mi, off) => Date.UTC(y, m - 1, d, h + off, mi);   // an Eastern wall-clock time (off = 5 EST · 4 EDT) → ms
const row = (rank = 1, n = 4) => ({ rank, win: rank === 1, c: { p: 1, ...(rank === 1 ? { w: 1 } : {}) }, rec: {} });

test('THE OVERALL BOARD — its definition: `xp`, an overall board (no game), both periods', () => {
  assert.ok(OVERALL_IDS.includes('xp'));
  const d = boardDef('xp');
  assert.equal(d.kind, 'overall'); assert.equal(d.game, null); assert.equal(d.dir, 1);
  assert.equal(boardDef('xp-wins'), null, 'never mistaken for a game board');
});

test('payXp — the total + this week\'s counter; a new week starts at 0', () => {
  const t = ET(2026, 11, 10, 20, 0, 5);
  const s = payXp({}, 0, 120, t);
  assert.deepEqual([s.xp, s.xw.wk, s.xw.x], [120, weekKey(t), 120]);
  payXp(s, s.xp, 30, t + 3600e3);
  assert.deepEqual([s.xp, s.xw.x], [150, 150]);
  const nextWeek = t + 7 * 86400e3;
  payXp(s, s.xp, 40, nextWeek);
  assert.deepEqual([s.xp, s.xw.wk, s.xw.x], [190, weekKey(nextWeek), 40]);
  assert.equal(weekXp(s, t), 0, 'last week\'s counter reads 0 once the week turned');
});

// (THE ONE DAY LINE — S1, FR7 FIXES C: the week turns at MONDAY 4:00 AM ET with the streak day — Sunday night until 4 am is still the old week)
for (const [name, sun, mon, midnight] of [
  ['a plain week (Nov 16, EST)', ET(2026, 11, 16, 3, 59, 5), ET(2026, 11, 16, 4, 0, 5), ET(2026, 11, 16, 0, 0, 5)],
  ['THE FALL DST WEEK (DST ends Sun Nov 1 2 am → Mon Nov 2, EST)', ET(2026, 11, 2, 3, 59, 5), ET(2026, 11, 2, 4, 0, 5), ET(2026, 11, 2, 0, 0, 5)],
  ['THE SPRING DST WEEK (DST starts Sun Mar 8 → Mon Mar 9, EDT)', ET(2026, 3, 9, 3, 59, 4), ET(2026, 3, 9, 4, 0, 4), ET(2026, 3, 9, 0, 0, 4)],
]) {
  test(`THE WEEK ROLLOVER — Monday 3:59 → 4:00 am ET: ${name}`, () => {
    assert.notEqual(weekKey(sun), weekKey(mon));
    assert.equal(weekKey(midnight), weekKey(sun), 'Monday 00:00 is still last week — the week turns at 4 am');
    assert.equal(weekKey(sun), weekKey(sun - 6 * 86400e3), 'Monday 3:59 is still the week that began last Monday 4:00');
    let s = matchStep(null, { key: 'a', gid: 'overclock', row: row(1), n: 4, now: sun, gap: 0 }).next;
    const sunX = s.xw.x;
    assert.ok(sunX > 0 && s.xw.wk === weekKey(sun));
    s = matchStep(s, { key: 'b', gid: 'overclock', row: row(2), n: 4, now: mon, gap: 0 }).next;
    assert.equal(s.xw.wk, weekKey(mon));
    assert.equal(s.xw.x, s.xp - sunX, 'Monday 00:00 counts only Monday\'s match');
    const v = overallValues(s, mon);
    assert.deepEqual([v.xp.all, v.xp.week], [s.xp, s.xp - sunX]);
    assert.equal(overallValues(s, sun + 7 * 86400e3 + 86400e3).xp.week, null, 'a week with no XP is off THIS WEEK');
  });
}

test('A REPLAY PAYS ONCE — the same match key: skipped, nothing paid, the week counter unchanged', () => {
  const t = ET(2026, 11, 10, 21, 0, 5);
  const a = matchStep(null, { key: 'room_m1', gid: 'overclock', row: row(1), n: 4, now: t, gap: 0 });
  const b = matchStep(a.next, { key: 'room_m1', gid: 'overclock', row: row(1), n: 4, now: t + 60e3, gap: 0 });
  assert.equal(b.skip, 'counted');
  assert.equal(a.next.xw.x, a.xp.total);
});

test('THE SOLO LANE counts at its CAPPED XP — 15 a run, the first 4 of the day, then 0', () => {
  let s = null; const t = ET(2026, 11, 10, 19, 0, 5);
  for (let i = 0; i < 6; i++) s = matchStep(s, { key: `solo${i}`, gid: 'overclock', row: { rank: 1, win: false, c: { p: 1 }, rec: {} }, n: 1, now: t + i * 60e3, gap: 0 }).next;
  assert.equal(s.xw.x, 4 * SOLO_XP);
  assert.equal(s.xp, 4 * SOLO_XP);
});

test('THE DAILIES pay the week too (the daily XP + THE SWEEP), idempotent by the day\'s key', () => {
  const t = ET(2026, 11, 10, 9, 0, 5), today = ['password', 'coastclear'];
  let r = dailyStep(null, { game: 'password', day: 'd20261110', now: t, today });
  r = dailyStep(r.next, { game: 'coastclear', day: 'd20261110', now: t + 600e3, today });
  assert.equal(r.next.xw.x, 15 + 15 + 10);
  const again = dailyStep(r.next, { game: 'coastclear', day: 'd20261110', now: t + 900e3, today });
  assert.equal(again.skip, 'counted');
});

test('the board values — ALL TIME = total XP, THIS WEEK = xw; nothing earned = off the board', () => {
  assert.deepEqual(overallValues({}, Date.now()).xp, { all: null, week: null, weeks: {} });
  const t = ET(2026, 11, 12, 12, 0, 5);
  assert.deepEqual(overallValues({ xp: 900, xw: { wk: weekKey(t), x: 75 } }, t).xp, { all: 900, week: 75, weeks: { [weekKey(t)]: 75 } });
});

test('THE BACK-FILL — this week rebuilt from the match records + the week\'s daily runs (THE DAILY XP\'s rule); never lower than the live counter', () => {
  const wk = weekKey(ET(2026, 11, 10, 12, 0, 5)), t = ET(2026, 11, 10, 20, 0, 5), last = ET(2026, 11, 6, 20, 0, 5);
  const results = {
    a: { at: t, o: { p1: { xp: { gain: 80 } }, p2: { xp: { gain: 30 } } } },
    b: { at: t + 3600e3, o: { p1: { xp: { gain: 50 } }, p3: { skip: 'too_soon' } } },
    old: { at: last, o: { p1: { xp: { gain: 999 } } } },
  };
  const day = 'd20261110', s = { p1: t - 3600e3, p2: t - 3000e3 };
  const daily = { password: { [day]: { r: { p1: 7, p2: 106 }, s, x: {} } }, coastclear: { [day]: { r: { p1: 120 }, s: { p1: t - 1800e3 }, x: {} } } };
  const w = rebuildWeekXp({ results, daily, live: ['password', 'coastclear'], wk });
  assert.equal(w.p1, 80 + 50 + 15 + 15 + 10, 'p1: two matches + two dailies + THE SWEEP');
  assert.equal(w.p2, 30 + 15, 'p2: a match + one daily (no sweep)');
  assert.equal(w.p3, undefined, 'a skipped outcome paid nothing');
  // a non-counting result still pays the daily XP, never THE SWEEP
  const g = rebuildWeekXp({ results: {}, daily: { password: { [day]: { r: { p9: 9 }, s: { p9: t }, x: { p9: 1 } } }, coastclear: { [day]: { r: { p9: 99 }, s: { p9: t }, x: { p9: 1 } } } }, live: ['password', 'coastclear'], wk });
  assert.equal(g.p9, 30);
  assert.deepEqual(filledWeek({ wk, x: 300 }, 200, wk), { wk, x: 300, bf: 1 }, 'the live counter wins when larger (a payment during the run)');
  assert.deepEqual(filledWeek({ wk: 'w20261102', x: 300 }, 200, wk), { wk, x: 200, bf: 1, p: { wk: 'w20261102', x: 300 } }, 'last week\'s counter is not this week\'s (kept as the week before — THE ONE DAY LINE)');
});

// THE GREP: every XP payment goes through payXp; every server file that writes a profile's XP also writes THE OVERALL BOARD (overallPaths) —
// except THE PROGRESS RESET, which wipes every board (lb: null) with the XP
test('NO XP PATH SKIPS THE OVERALL BOARD (a grep)', () => {
  const core = new URL('../js/core/', import.meta.url);
  for (const f of readdirSync(core).filter(f => f.endsWith('.js'))) {
    const src = readFileSync(new URL(f, core), 'utf8').split('\n').filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');   // (code lines only)
    const hits = [...src.matchAll(/\b(next|s|stats|out)\.xp\s*=(?!=)/g)].length;
    if (f === 'progress.js') { assert.equal(hits, 1, 'progress.js: only payXp sets .xp'); assert.match(src, /export function payXp[\s\S]{0,200}next\.xp = /); }
    else assert.equal(hits, 0, `${f} sets .xp outside payXp`);
  }
  const walk = d => readdirSync(d, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(new URL(`${e.name}/`, d)) : e.name.endsWith('.js') ? [new URL(e.name, d)] : []));
  const writers = [];
  for (const u of walk(new URL('../api/', import.meta.url))) {
    const src = readFileSync(u, 'utf8');
    if (!/profiles\/\$\{pid\}\/x`\]/.test(src)) continue;
    writers.push(u.pathname.split('/api/')[1]);
    assert.match(src, /overallPaths\(/, `${u.pathname} writes a profile's XP without THE OVERALL BOARD`);
  }
  assert.deepEqual(writers.sort(), ['_lib/stats.js', 'daily.js']);
});
