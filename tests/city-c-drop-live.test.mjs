// CITY C 0a — THE DROP's BILLBOARD MISSED "TURN ON": the roof board's go-live day reads "live" exactly as the daily screen does
// (core/daily.js#goLiveDay — the switch + the row's on-switch OR THE SCHEDULED GO-LIVE).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { goLiveDay, rowOpenOn } from '../js/core/daily.js';

const OFF = { id: 'drop', on: false }, ON = { id: 'drop' };
const T = 'd20261115';

test('CITY C 0a: a switched-on row with no schedule → the face from the day its switch flipped on', () => {
  assert.equal(goLiveDay({ row: ON, switchOn: true, sched: null, onDay: 'd20261114', today: T }), 'd20261114');
  assert.equal(goLiveDay({ row: ON, switchOn: true, sched: null, onDay: null, firstDay: 'd20261113', today: T }), 'd20261113', 'no recorded flip → its first counted finish');
  assert.equal(goLiveDay({ row: ON, switchOn: true, sched: null, today: T }), T, 'no flip, no finish → today');
  assert.equal(goLiveDay({ row: ON, switchOn: true, sched: null, onDay: 'd20261201', today: T }), T, 'a flip day in the future is never trusted');
  assert.ok(rowOpenOn(ON, null, T), 'the daily screen has it open too');
});
test('CITY C 0a: schedule only → from that day (a future one too: the face waits for it)', () => {
  assert.equal(goLiveDay({ row: OFF, switchOn: true, sched: { from: 'd20261114' }, onDay: 'd20261101', today: T }), 'd20261114');
  assert.equal(goLiveDay({ row: OFF, switchOn: true, sched: { from: 'd20261201' }, today: T }), 'd20261201');
});
test('CITY C 0a: both off → none; the dailies switch off → none', () => {
  assert.equal(goLiveDay({ row: OFF, switchOn: true, sched: null, onDay: 'd20261114', today: T }), null, 'an OFF row with no schedule never shows');
  assert.equal(rowOpenOn(OFF, null, T), false);
  assert.equal(goLiveDay({ row: ON, switchOn: false, sched: { from: 'd20261114' }, today: T }), null);
  assert.equal(goLiveDay({ row: null, switchOn: true, today: T }), null);
});
test('CITY C 0a: the feed + /admin read ONE reader (dailies.js#goLive); the switch records its OFF → ON flip', () => {
  const radio = readFileSync(new URL('../api/_lib/radio.js', import.meta.url), 'utf8'), admin = readFileSync(new URL('../api/admin.js', import.meta.url), 'utf8');
  const dl = readFileSync(new URL('../api/_lib/dailies.js', import.meta.url), 'utf8');
  assert.match(radio, /goLive\('drop', now\)/); assert.match(admin, /goLive\('drop', now\)/);
  assert.doesNotMatch(radio + admin, /val\('progress\/dlive\/drop'\)/, 'never the schedule alone');
  assert.match(dl, /set\(\{ on: true, at: now, by, onAt \}\)/);
});
