// PROGRESSION B — BIRTHDAYS (month + day, never the year, once a year) + CALL IN A FAVOR's role on the radio. PURE.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanBirthday, canChangeBirthday, isBirthdayOn, bdayText, bdayLabel, dayKeyOf, BDAY_CHANGE_MS } from '../js/core/birthday.js';
import { eventStep } from '../js/core/progress.js';
import { ROLES, roleJack, roleAudience, jacks, publicMoment, favorJacks } from '../js/core/harbor-radio.js';

test('cleanBirthday: a real month + day (Feb 29 allowed), cleared, bad dates refused — never a year', () => {
  assert.deepEqual(cleanBirthday(11, 3), { bd: { m: 11, d: 3 } });
  assert.deepEqual(cleanBirthday(2, 29), { bd: { m: 2, d: 29 } });
  assert.deepEqual(cleanBirthday(null, null), { bd: null });
  assert.equal(cleanBirthday(2, 30).bad, 'bad_day');
  assert.equal(cleanBirthday(4, 31).bad, 'bad_day');
  assert.equal(cleanBirthday(13, 1).bad, 'bad_month');
  assert.equal(cleanBirthday('x', 1).bad, 'bad_month');
  assert.equal(Object.keys(cleanBirthday(11, 3).bd).includes('y'), false);
});

test('ONCE A YEAR: the first set is free; a change waits a year from the last one', () => {
  const now = Date.UTC(2026, 10, 3);
  assert.equal(canChangeBirthday(null, now).ok, true);
  assert.equal(canChangeBirthday({ m: 1, d: 1, at: now - 10 * 864e5 }, now).ok, false);
  assert.equal(canChangeBirthday({ m: 1, d: 1, at: now - 10 * 864e5 }, now).until, now - 10 * 864e5 + BDAY_CHANGE_MS);
  assert.equal(canChangeBirthday({ off: true, at: now - 366 * 864e5 }, now).ok, true);
});

test('isBirthdayOn: the player\'s own zone; Feb 29 falls on Feb 28 in other years', () => {
  const t = Date.UTC(2026, 10, 4, 2, 30);       // Nov 4 02:30 UTC = Nov 3 21:30 in Detroit
  assert.equal(isBirthdayOn({ m: 11, d: 3 }, t, 'America/Detroit'), true);
  assert.equal(isBirthdayOn({ m: 11, d: 3 }, t, 'Europe/London'), false);
  assert.equal(isBirthdayOn({ m: 2, d: 29 }, Date.UTC(2027, 1, 28, 18), 'America/Detroit'), true);
  assert.equal(isBirthdayOn({ m: 2, d: 29 }, Date.UTC(2028, 1, 28, 18), 'America/Detroit'), false);
  assert.equal(isBirthdayOn({ m: 2, d: 29 }, Date.UTC(2028, 1, 29, 18), 'America/Detroit'), true);
  assert.equal(isBirthdayOn(null, t, 'America/Detroit'), false);
  assert.equal(dayKeyOf(t, 'America/Detroit'), '2026-11-03');
});

test('the skywrite: HAPPY BDAY + the player\'s own name through the filter (a refused one → FRIEND), ≤ 16 letters; the label has no year', () => {
  assert.equal(bdayText('Ben'), 'HAPPY BDAY BEN');
  assert.equal(bdayText(''), 'HAPPY BDAY FRIEND');
  assert.equal(bdayText('shithead'), 'HAPPY BDAY FRIEND');
  assert.ok(bdayText('A VERY LONG NAME INDEED').length <= 'HAPPY BDAY '.length + 16);
  assert.equal(bdayLabel({ m: 11, d: 3 }), 'NOV 3');
});

test('MANY HAPPY RETURNS: the birthday event wakes it once', () => {
  const a = eventStep({ g: {} }, { k: 'birthday' }, 1e12);
  assert.ok(a.ach.includes('many-happy-returns'), JSON.stringify(a.ach));
  assert.equal(eventStep(a.next, { k: 'birthday' }, 1e12 + 1), null);
});

test('CALL IN A FAVOR: the role fires the crew\'s 11 jacks, for a ROOM only, never a sighting; the public copy says favor', () => {
  assert.ok(ROLES.favor && ROLES.favor.sightings === false);
  const crew = jacks().filter(j => j.crew).map(j => j.id);
  assert.equal(crew.length, 11);
  assert.deepEqual(favorJacks().map(j => j.id), crew);
  for (const j of jacks()) assert.equal(roleJack('favor', j.id), !!j.crew, j.id);
  assert.equal(roleAudience('favor', 'room'), true);
  assert.equal(roleAudience('favor', 'everyone'), false);
  assert.equal(roleAudience('favor', 'me'), false);
  assert.equal(publicMoment('x', { jack: 'ufo', role: 'favor', aud: 'room', at: 1, until: 2 }).by, 'favor');
});
