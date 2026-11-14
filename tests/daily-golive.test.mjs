// THE DROP B — THE SCHEDULED GO-LIVE's PURE rule (js/core/daily.js#rowOpenOn + nextLiveDay): an OFF row opens on whole days from its scheduled
// day — never mid-day (a day key compared, never a time); GO LIVE AT THE NEXT 4 AM = tomorrow's streak day from any time of today.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rowOpenOn, nextLiveDay } from '../js/core/daily.js';
import { streakDay, dayStartAt } from '../js/core/streak.js';

test('rowOpenOn: an ON row always; an OFF row only from its day; a bad schedule opens nothing', () => {
  const on = { id: 'a', on: true }, off = { id: 'drop', on: false };
  assert.equal(rowOpenOn(on, null, 'd20261113'), true);
  assert.equal(rowOpenOn(off, null, 'd20261113'), false);
  assert.equal(rowOpenOn(off, { from: 'd20261114' }, 'd20261113'), false, 'the day before');
  assert.equal(rowOpenOn(off, { from: 'd20261114' }, 'd20261114'), true, 'the day of');
  assert.equal(rowOpenOn(off, { from: 'd20261114' }, 'd20261201'), true, 'every day after');
  assert.equal(rowOpenOn(off, { from: 'tomorrow' }, 'd20261201'), false);
  assert.equal(rowOpenOn(null, { from: 'd20261114' }, 'd20261201'), false);
});

test('nextLiveDay: the next 4 am turn from any time — 3:59 am opens at the 4 am a minute later, 4:01 am the next day\'s', () => {
  const d = 'd20261113', start = dayStartAt(d);
  assert.equal(nextLiveDay(start + 60e3), 'd20261114', '4:01 am → tomorrow');
  assert.equal(nextLiveDay(start + 19 * 3600e3), 'd20261114', '11 pm → tomorrow');
  assert.equal(streakDay(start - 60e3), 'd20261112');
  assert.equal(nextLiveDay(start - 60e3), 'd20261113', '3:59 am → the 4 am a minute away');
});
