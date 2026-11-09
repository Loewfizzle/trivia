// BOARD 2.0 B — SCORES → ALL TIME: YOUR TABLE's averages (pure: js/daily/today-logic.js#allTimeRows / allTimeLine)
import test from 'node:test';
import assert from 'node:assert/strict';
import { allTimeRows, allTimeLine } from '../js/daily/today-logic.js';

const P = {
  mine: { 'daily-password': { avg: 83.3, days: 7 }, daily: { avg: 80, days: 12 } },
  friends: {
    P_ben: { 'daily-password': { avg: 91.2, days: 14 } },
    P_kim: { 'daily-password': { avg: 88.0, days: 10 } },
    P_max: { 'daily-password': { avg: 95.0, days: 3 } },
    P_ray: { 'daily-password': { avg: null, days: 0 } },
    P_lou: {},
  },
};
const names = { P_ben: 'BEN', P_kim: 'KIM', P_max: 'MAXIMILIANOS' };

test('ranked from 10 days, best first; the rest after; nobody who never played', () => {
  const rows = allTimeRows(P, { board: 'daily-password', me: { pid: 'P_me', name: 'AVA' }, names, need: 10 });
  assert.deepEqual(rows.map(r => [r.name, r.place]), [['BEN', 1], ['KIM', 2], ['AVA', null], ['MAXIMILIANOS', null]]);
});
test('a tie shares the place', () => {
  const rows = allTimeRows({ mine: { daily: { avg: 80, days: 12 } }, friends: { a: { daily: { avg: 80, days: 11 } }, b: { daily: { avg: 70, days: 20 } } } }, { board: 'daily', me: { pid: 'm' } });
  assert.deepEqual(rows.map(r => r.place), [1, 1, 3]);
  assert.equal(rows[0].me, true);
});
test('the lines: a ranked average · YOU below 10 days · a friend below 10 days', () => {
  assert.deepEqual(allTimeLine({ place: 2, avg: 88 }), { score: '88.0', unit: 'AVG' });
  assert.equal(allTimeLine({ me: true, avg: 83.33, days: 7 }).note, '3 MORE DAYS TO BE RANKED · YOUR AVERAGE 83.3');
  assert.equal(allTimeLine({ me: true, avg: 83.33, days: 9 }).note, '1 MORE DAY TO BE RANKED · YOUR AVERAGE 83.3');
  assert.equal(allTimeLine({ avg: 95, days: 3 }).note, '3 OF 10 DAYS · 95.0 AVG');
});
test('no answer → no rows', () => {
  assert.deepEqual(allTimeRows(null, { board: 'daily' }), []);
});
