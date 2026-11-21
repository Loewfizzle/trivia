// JAYWALK J2 — COURSE RULES v2: THE SWITCH + THE CHECK (js/games/jaywalk/versions.js — docs/jaywalk.md "COURSE RULES v2"). v2 from the 4 am
// Eastern daily turn after J2 shipped (never mid-day); a run's version = the one in force at its GO, travelling in its proof (`cv`) and
// CHECKED against that GO — a phone never picks its own; no version (an old-code phone) = v1 until THE GRACE ends; a day's daily = the
// version in force at its 4 am, picked by the SERVER at START.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as V from '../js/games/jaywalk/versions.js';
import { streakDay } from '../js/core/streak.js';
import { turnAt } from '../js/core/week.js';

const S = V.CV_SWITCH_MS, G = V.CV_GRACE_END_MS;

test('THE SWITCH is the 4 am Eastern daily turn of 2026-11-22 (09:00 UTC) — the first moment of the streak day CV_SWITCH_DAY; THE GRACE ends 4 am Eastern Nov 27', () => {
  assert.equal(new Date(S).toISOString(), '2026-11-22T09:00:00.000Z');
  assert.equal(new Date(G).toISOString(), '2026-11-27T09:00:00.000Z');
  assert.equal(streakDay(S), V.CV_SWITCH_DAY, 'the switch moment opens its streak day');
  assert.equal(streakDay(S - 1), 'd20261121', 'a millisecond before = the day before');
  assert.equal(turnAt(V.CV_SWITCH_DAY), S, 'THE ONE DAY LINE agrees: the day turns at the switch');
  assert.equal(streakDay(G), 'd20261127'); assert.equal(turnAt('d20261127'), G);
  const hourNY = ms => Number(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', hourCycle: 'h23' }).format(new Date(ms)));
  assert.equal(hourNY(S), 4); assert.equal(hourNY(G), 4);
  assert.equal(V.CV_LATEST, 2); assert.deepEqual(V.CV_IDS, [1, 2]);
});

test('versionAt: v1 to the millisecond before the switch, v2 from it — never mid-day: a day is ONE version (its 4 am)', () => {
  assert.equal(V.versionAt(S - 1), 1); assert.equal(V.versionAt(S), 2); assert.equal(V.versionAt(S + 864e5 * 30), 2);
  assert.equal(V.versionAt(0), 1); assert.equal(V.versionAt(undefined), 1);
  assert.equal(V.versionOfDay('d20261121'), 1, "today's daily stays v1 (its 4 am was before the switch)");
  assert.equal(V.versionOfDay('d20261122'), 2, "tomorrow's daily is v2");
  assert.equal(V.versionOfDay('d20261201'), 2); assert.equal(V.versionOfDay('d20251231'), 1); assert.equal(V.versionOfDay(null), 1);
  // every moment of a streak day has the version of its 4 am — the daily's day never straddles the switch
  for (let t = S - 864e5; t < S + 2 * 864e5; t += 15 * 60e3) assert.equal(V.versionOfDay(streakDay(t)), V.versionAt(turnAt(streakDay(t))), new Date(t).toISOString());
});

test('THE CHECK (runVersion): the proof\'s `cv` must BE the version in force at its GO — a phone never picks its own; none = v1 only until THE GRACE ends', () => {
  const pre = S - 60e3, post = S + 60e3, late = G + 60e3;
  // a run started BEFORE the switch = v1, whatever it says
  assert.equal(V.runVersion(null, V.versionAt(pre), pre), 1, 'an old phone before the switch: v1');
  assert.equal(V.runVersion(1, V.versionAt(pre), pre), 1, 'a new phone before the switch: v1');
  assert.equal(V.runVersion(2, V.versionAt(pre), pre), 0, 'v2 claimed before the switch: REFUSED');
  // after the switch
  assert.equal(V.runVersion(2, V.versionAt(post), post), 2, 'a new phone after the switch: v2');
  assert.equal(V.runVersion(1, V.versionAt(post), post), 0, 'v1 claimed after the switch (an easier course, picked): REFUSED');
  assert.equal(V.runVersion(null, V.versionAt(post), post), 1, 'no version after the switch (an old-code phone): v1 — until THE GRACE ends');
  assert.equal(V.runVersion(null, V.versionAt(late), late), 0, 'no version past THE GRACE: REFUSED');
  assert.equal(V.runVersion(2, V.versionAt(late), late), 2);
  for (const bad of [0, 3, -1, '2', 1.5, true]) assert.equal(V.runVersion(bad, 2, post), 0, `cv ${JSON.stringify(bad)}`);
});

test('THE DAILY\'s START (tryVersion): the SERVER picks the day\'s version — the phone only says the newest it knows; ONE COURSE A DAY: an old phone on a v2 day is refused', () => {
  const now = S + 3600e3;
  assert.equal(V.tryVersion('d20261121', 2, S - 1000), 1, "today's daily: v1 even for a new phone");
  assert.equal(V.tryVersion('d20261121', null, S - 1000), 1);
  assert.equal(V.tryVersion('d20261122', 2, now, V.CV_REV), 2, "tomorrow's: v2");
  // (J2 FIX — a phone still on the PRE-FIX J2 build knows v2 but plays its old numbers: it sends no `cvr` → refused on a v2 day, told to refresh)
  assert.equal(V.CV_REV, 2);
  assert.equal(V.tryVersion('d20261122', 2, now), 0, 'the pre-fix J2 build (no cvr) is refused on a v2 day');
  assert.equal(V.tryVersion('d20261122', 2, now, 1), 0, '… an older revision too');
  assert.equal(V.tryVersion('d20261122', 99, now, V.CV_REV), 2, 'a phone that claims a newer one still gets the DAY\'s');
  assert.equal(V.tryVersion('d20261122', null, now), 0, 'ONE COURSE A DAY: an old phone on a v2 day is refused (told to refresh) — no grace for the daily');
  assert.equal(V.tryVersion('d20261122', 1, now), 0, '… a phone that knows only v1 too');
  assert.equal(V.tryVersion('d20261128', null, G + 3600e3), 0);
  // a try that began before 4 am keeps its own day (A RUN KEEPS ITS OWN DAY): its version is that day's — v1, even played past the switch
  assert.equal(V.tryVersion('d20261121', 2, S + 120e3), 1);
});

test('THE TEST SWITCH: setCvSwitch moves it for a test only (the emulator\'s ?emu&jwcv= · the local /api\'s JW_CV_SWITCH_MS) — off Vercel only; back to the real one after', async () => {
  V.setCvSwitch(0);
  assert.equal(V.versionAt(1), 2); assert.equal(V.versionOfDay('d20200101'), 2);
  V.setCvSwitch(Infinity);
  assert.equal(V.versionAt(S + 1e12), 1); assert.equal(V.versionOfDay('d20301231'), 1);
  V.setCvSwitch(null);
  assert.equal(V.cvSwitch(), S); assert.equal(V.versionAt(S), 2); assert.equal(V.versionOfDay('d20261122'), 2);
  const { cvFromEnv } = await import('../api/_lib/jaywalk.js');
  assert.equal(cvFromEnv({ VERCEL: '1', JW_CV_SWITCH_MS: '0' }), false, 'never on Vercel');
  assert.equal(cvFromEnv({ VERCEL_ENV: 'production', JW_CV_SWITCH_MS: '0' }), false);
  assert.equal(V.cvSwitch(), S, 'the switch did not move');
  assert.equal(cvFromEnv({}), false);
  assert.equal(cvFromEnv({ JW_CV_SWITCH_MS: '0' }), true); assert.equal(V.cvSwitch(), 0);
  V.setCvSwitch(null);
  // the page's own hook reads a LOCAL emulator address only
  const src = readFileSync(new URL('../js/games/jaywalk/versions.js', import.meta.url), 'utf8');
  assert.ok(src.includes(String.raw`/^(localhost|127\.0\.0\.1)$/.test(location.hostname`), 'a local host only');
  assert.ok(src.includes("/[?&]emu(?:&|=|$)/.test(location.search"), 'an emulator page only');
});

test('THE RULE (database.rules.json): the proof\'s `cv` = the player\'s own, written ONCE, 1 or 2, within 3 h of its own GO — the smallest change (one leaf)', () => {
  const R = JSON.parse(readFileSync(new URL('../database.rules.json', import.meta.url), 'utf8'));
  const n = R.rules.rooms.$code.jw.$match.$uid;
  assert.deepEqual(Object.keys(n), ['go', 'cv', 'c', 'k', 'e', '$other']);
  assert.match(n.cv['.write'], /auth\.uid === \$uid/); assert.match(n.cv['.write'], /!data\.exists\(\)/);
  assert.match(n.cv['.write'], /\/go'\)\.isNumber\(\)/); assert.match(n.cv['.write'], /\/go'\)\.val\(\) \+ 10800000/);
  assert.equal(n.cv['.validate'], 'newData.isNumber() && (newData.val() === 1 || newData.val() === 2)');
});
