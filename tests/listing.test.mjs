// WHO GETS LISTED (PD-3 Group 0 — the owner, Nov 9): a profile is on the public boards from its 3rd COUNTED PLAY — a counted room match OR a
// counted daily finish (THE THROWAWAY GATE) — never a solo run. core/progress.js#countedPlays + boardHidden (api/_lib/lb.js#hiddenOf reads them),
// core/streak.js#countsOn (the gate), core/board-fill.js#countedPlaysFromRecords (the back-fill's exact re-count).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchStep, dailyStep, countedPlays, boardHidden } from '../js/core/progress.js';
import { countsOn, dayStartAt } from '../js/core/streak.js';
import { countedPlaysFromRecords } from '../js/core/board-fill.js';

const MIN = 3;
const PROF = { n: 'AVA' };
const T0 = Date.UTC(2026, 10, 9, 20, 0);   // Nov 9 2026, 3 pm Eastern
const room = (s, k, n = 4) => matchStep(s, { key: `m${k}`, gid: 'prism', row: { rank: 2, win: false, c: { p: 1 }, rec: {} }, n, now: T0 + k * 600_000 }).next;
const solo = (s, k) => matchStep(s, { key: `s${k}`, gid: 'prism', row: { rank: 1, win: false, c: { p: 1 }, rec: {}, solo: true }, n: 1, now: T0 + k * 600_000 }).next;
const daily = (s, game, day, counts = true) => dailyStep(s, { game, day, now: dayStartAt(day) + 3 * 3600_000, today: ['password', 'coastclear'], counts }).next;

test('2 dailies + 1 room match = listed', () => {
  let s = null;
  s = daily(s, 'password', 'd20261108');
  assert.equal(boardHidden(PROF, s, MIN), 'matches');
  s = daily(s, 'coastclear', 'd20261108');
  assert.equal(countedPlays(s), 2);
  assert.equal(boardHidden(PROF, s, MIN), 'matches');
  s = room(s, 1);
  assert.equal(countedPlays(s), 3);
  assert.equal(boardHidden(PROF, s, MIN), false, 'listed from the 3rd counted play');
  // the order doesn't matter: a room match first, then two dailies
  let t = room(null, 1);
  t = daily(t, 'password', 'd20261108');
  t = daily(t, 'password', 'd20261109');
  assert.equal(boardHidden(PROF, t, MIN), false);
});

test('3 solo runs = not listed (a solo run never counts) — a 3rd counted play then lists', () => {
  let s = null;
  for (let k = 1; k <= 3; k++) s = solo(s, k);
  assert.equal(countedPlays(s), 0);
  assert.equal(boardHidden(PROF, s, MIN), 'matches');
  s = room(s, 4); s = room(s, 5);
  assert.equal(boardHidden(PROF, s, MIN), 'matches');
  s = room(s, 6);
  assert.equal(boardHidden(PROF, s, MIN), false);
  // the opt-out / the admin's hide still win
  assert.equal(boardHidden({ ...PROF, h: true }, s, MIN), 'opt');
});

test('a daily from a profile made after that day\'s 4 am = not counted (THE THROWAWAY GATE)', () => {
  const day = 'd20261109';
  const made = dayStartAt(day) + 3600_000;   // made at 5 am that day
  assert.equal(countsOn(made, day), false);
  assert.equal(countsOn(made, 'd20261110'), true, 'it counts from the next day');
  assert.equal(countsOn(dayStartAt(day) - 1, day), true);
  assert.equal(countsOn(null, day), true, 'no creation time = an old profile');
  let s = room(null, 1);
  s = room(s, 2);
  s = daily(s, 'password', day, countsOn(made, day));
  assert.equal(countedPlays(s), 2, 'the same-day daily is not a counted play');
  assert.equal(boardHidden(PROF, s, MIN), 'matches');
  s = daily(s, 'password', 'd20261110', countsOn(made, 'd20261110'));
  assert.equal(boardHidden(PROF, s, MIN), false);
});

test('a replayed match / daily never counts twice; an old profile is estimated from its stats until the back-fill', () => {
  let s = room(null, 1);
  assert.equal(matchStep(s, { key: 'm1', gid: 'prism', row: { rank: 1, c: { p: 1 } }, n: 3, now: T0 }).skip, 'counted');
  s = daily(s, 'password', 'd20261108');
  assert.equal(dailyStep(s, { game: 'password', day: 'd20261108', now: T0, today: ['password'] }).skip, 'counted');
  assert.equal(countedPlays(s), 2);
  // a profile from before the counter: its counted matches + its counted daily finishes (DAILY POINTS' tally)
  const old = { g: { prism: { p: 2 }, overclock: { p: 1 } }, dp: { a: { t: 900, n: 2, g: { password: { n: 2 }, coastclear: { n: 1 } } } } };
  assert.equal(countedPlays(old), 6);
  assert.equal(countedPlays({ ...old, cp: 1 }), 1, 'the stored count wins');
});

test('the back-fill re-counts from the records: room matches + counted dailies, never a solo run, never a skipped one', () => {
  const results = {
    a: { at: T0, n: 4, o: { p1: { xp: { gain: 50 } }, p2: { xp: { gain: 40 } } } },
    b: { at: T0, n: 1, o: { p1: { xp: { gain: 10 } } } },                         // solo
    c: { at: T0, n: 2, o: { p1: { skip: 'overlap' }, p2: { xp: { gain: 30 } } } },   // p1 skipped
    d: { at: T0, o: { p3: { xp: { gain: 30 } } } },                                // an old record without n → a room match
    e: { st: 'claim', at: T0 },                                                    // in flight: no outcomes
  };
  const dly = {
    password: { d20261108: { r: { p1: 4, p3: 6 }, x: { p3: 1 } }, d20261109: { r: { p1: 5 } } },
    coastclear: { d20261109: { r: { p2: 140 } } },
  };
  assert.deepEqual(countedPlaysFromRecords({ results, daily: dly }), { p1: 3, p2: 3, p3: 1 });
  assert.deepEqual(countedPlaysFromRecords({}), {});
});
