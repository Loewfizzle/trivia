// CITY FIXES — THIS WEEK'S GOAL: paid by the SERVER exactly once (the match that completes it; a repeat report never pays twice), solo matches
// (THE SOLO LANE) never count toward it — the owner's 8 / 8 with "THE REWARD +200 XP" still showing: solo plays filled the bar the server
// never pays from — and the profile's one quiet line only once it is paid.
import test from 'node:test';
import assert from 'node:assert/strict';
import { matchStep } from '../js/core/progress.js';
import { weeklyGoal, goalProgress, GOAL_XP, goalPaid as paidWk } from '../js/core/ranks.js';
import { GOAL_GAMES } from '../js/core/boards.js';
import { weekKey } from '../js/core/week.js';
const goalPaid = (s, now) => paidWk(s, weekKey(now));

const row = rank => ({ rank, win: rank === 1, c: { p: 1, ...(rank === 1 ? { w: 1 } : {}) }, rec: {} });
// a week whose goal is "Play 8 matches" (the owner's) — searched from Nov 9 2026
const weekOf = () => { for (let d = 0; d < 400; d += 7) { const t = Date.UTC(2026, 10, 10, 18) + d * 864e5; if (weeklyGoal(weekKey(t), GOAL_GAMES).kind === 'play') return t; } throw new Error('no play week'); };
const T0 = weekOf();
const GAP = 6 * 60e3;   // (counted matches a few minutes apart — past the server's too-soon gap)

function play(s, i, { n = 4, rank = 2 } = {}) { const r = matchStep(s, { key: `ROOM_m${i}`, gid: GOAL_GAMES[0], row: row(rank), n, now: T0 + i * GAP }); assert.ok(!r.skip, `match ${i}: ${r.skip}`); return r; }
const goalXp = r => (r.xp.parts.find(p => p.k === 'goal') || {}).v || 0;

test('the goal pays +200 ONCE — on the match that completes it; a repeat report of that match pays nothing', () => {
  let s = null, paid = 0, at = -1;
  for (let i = 1; i <= 10; i++) { const r = play(s, i); if (goalXp(r)) { paid += goalXp(r); at = i; } s = r.next; }
  assert.equal(paid, GOAL_XP, 'paid once');
  assert.equal(at, 8, 'by the 8th match');
  assert.equal(s.gd, weekKey(T0), 'the week marked paid (stats.gd)');
  // the same match reported again (another phone, a retry): skipped — never a second +200
  const again = matchStep(s, { key: 'ROOM_m8', gid: GOAL_GAMES[0], row: row(2), n: 4, now: T0 + 11 * GAP });
  assert.equal(again.skip, 'counted');
  assert.ok(goalPaid(s, T0 + 11 * GAP), 'the profile shows the one quiet line (GOAL DONE · +200 XP)');
  assert.ok(!goalPaid(s, T0 + 8 * 864e5), 'next week: the new goal\'s box is back');
});

test('the owner\'s case: SOLO matches never fill the goal\'s bar (they never pay it) — the 8th ROOM match pays', () => {
  let s = null;
  for (let i = 1; i <= 7; i++) s = play(s, i).next;
  const solo = play(s, 8, { n: 1, rank: 1 });
  assert.equal(goalXp(solo), 0, 'a solo match never pays the goal');
  s = solo.next;
  const goal = weeklyGoal(weekKey(T0), GOAL_GAMES);
  assert.deepEqual(goalProgress(goal, s.gw, s.gs), { have: 7, n: 8, done: false }, 'the bar says 7 / 8 — never a done it can\'t pay');
  assert.ok(!goalPaid(s, T0 + 9 * GAP), 'the box stays (not paid)');
  const r = play(s, 9);
  assert.equal(goalXp(r), GOAL_XP, 'the 8th ROOM match pays it');
  assert.ok(goalPaid(r.next, T0 + 9 * GAP));
});

test('a week\'s old data (solo plays counted before the fix, no gs): done by the count, paid by the next room match', () => {
  const wk = weekKey(T0);
  const s = { wk, gw: { [GOAL_GAMES[0]]: { p: 8 } }, xp: 1000, last: T0 - 3600e3, m: {} };
  assert.ok(!goalPaid(s, T0));
  const r = matchStep(s, { key: 'ROOM_late', gid: GOAL_GAMES[0], row: row(2), n: 3, now: T0 });
  assert.equal(goalXp(r), GOAL_XP, 'his next room match pays the +200 (once)');
});
