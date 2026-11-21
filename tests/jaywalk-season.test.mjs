// JAYWALK J4 — THE SEASON CLOCK (js/games/jaywalk/season.js): the whole season, the snowfall share, Dec 24 + 25, the 4 am day line.
import test from 'node:test';
import assert from 'node:assert/strict';
import { seasonOf, seasonAt, packDay, parseDay, labSeason, SEASON, WET_LIVE } from '../js/games/jaywalk/season.js';

const days = (from, n) => { const t0 = Date.UTC(...from.split('-').map((v, i) => (i === 1 ? v - 1 : +v))); return Array.from({ length: n }, (_, k) => new Date(t0 + k * 864e5).toISOString().slice(0, 10)); };

test('J4 season: the owner\'s days — Nov 30 none · Dec 1 dusting + a few lit trees · Dec 24 full + peak · Jan 7 none · Feb 25 melting · Mar 1 none', () => {
  const n30 = seasonOf('2026-11-30'), d1 = seasonOf('2026-12-01'), d12 = seasonOf('2026-12-12'), d24 = seasonOf('2026-12-24'), d25 = seasonOf('d20261225');
  assert.equal(n30.winter, 0); assert.equal(n30.christmas, 0); assert.equal(n30.snowfall, 'none'); assert.ok(!packDay(n30));
  assert.ok(d1.winter > 0.1 && d1.winter < 0.3, `Dec 1 a dusting (${d1.winter})`); assert.ok(d1.christmas > 0 && d1.christmas <= 0.2, 'Dec 1 a few lit trees'); assert.ok(packDay(d1));
  assert.ok(d12.winter > d1.winter && d12.winter < 1, `Dec 12 building (${d12.winter})`); assert.ok(d12.christmas > d1.christmas, 'more each week');
  assert.equal(d24.winter, 1); assert.equal(d24.christmas, 1); assert.equal(d25.christmas, 1);
  assert.equal(seasonOf('2027-01-06').christmas, SEASON.xmasAfter, 'Jan 6 still up');
  const j7 = seasonOf('2027-01-07'); assert.equal(j7.christmas, 0, 'all down on Jan 7'); assert.equal(j7.winter, 1);
  assert.equal(seasonOf('2027-01-15').winter, 1); assert.equal(seasonOf('2027-02-21').winter, 1, 'full until the melt week');
  const f25 = seasonOf('2027-02-25'); assert.ok(f25.melt && f25.winter > 0.2 && f25.winter < 0.7, `Feb 25 melting, patchy (${f25.winter})`);
  assert.ok(seasonOf('2027-02-28').winter < f25.winter && seasonOf('2027-02-28').winter > 0, 'Feb 28 nearly gone');
  const m1 = seasonOf('2027-03-01'); assert.equal(m1.winter, 0); assert.equal(m1.snowfall, 'none'); assert.ok(!packDay(m1));
  // (a leap year: the melt is the last 7 days of ITS February)
  assert.equal(seasonOf('2028-02-22').winter, 1); assert.ok(seasonOf('2028-02-29').winter > 0 && seasonOf('2028-03-01').winter === 0);
});

test('J4 season: the winter only ever grows to Dec 24, holds, then melts — never a jump back', () => {
  let last = 0;
  for (const d of days('2026-12-01', 24)) { const w = seasonOf(d).winter; assert.ok(w >= last, `${d} ${w} ≥ ${last}`); last = w; }
  for (const d of days('2027-02-22', 7)) { const w = seasonOf(d).winter; assert.ok(w <= last, `${d} melts`); last = w; }
});

test('J4 season: snow falls on ≈ half the winter days (± 10 %), ALWAYS on Dec 24 + 25, light or heavy, the same for everyone', () => {
  for (const y of [2026, 2027, 2028, 2029]) {
    const all = days(`${y}-12-01`, 90).map(seasonOf).filter(s => s.winter > 0), fall = all.filter(s => s.snowfall !== 'none');
    const share = fall.length / all.length;
    assert.ok(share > 0.4 && share < 0.6, `${y}: ${(share * 100).toFixed(0)} % of ${all.length} winter days`);
    assert.ok(fall.some(s => s.snowfall === 'heavy') && fall.some(s => s.snowfall === 'light'), `${y}: both kinds`);
    assert.notEqual(seasonOf(`${y}-12-24`).snowfall, 'none'); assert.notEqual(seasonOf(`${y}-12-25`).snowfall, 'none');
    for (const s of all.filter(q => q.melt)) assert.notEqual(s.snowfall, 'heavy', 'the melt week: light only');
  }
  assert.deepEqual(seasonOf('2027-01-15'), seasonOf('d20270115'), 'the two key forms agree');
  for (const d of days('2026-11-01', 150)) assert.equal(seasonOf(d).snowfall !== 'none' ? seasonOf(d).winter > 0 || seasonOf(d).christmas > 0 : true, true, `${d}: no snow outside the winter`);
});

test('J4 season: THE DAY = the 4 am Eastern turn (a match started at 3 am on Dec 1 is still Nov 30\'s — no winter)', () => {
  const at3am = Date.UTC(2026, 11, 1, 8, 0), at5am = Date.UTC(2026, 11, 1, 10, 0);   // (EST = UTC−5: 3 am · 5 am Eastern)
  assert.equal(seasonAt(at3am).day, 'd20261130'); assert.equal(seasonAt(at3am).winter, 0);
  assert.equal(seasonAt(at5am).day, 'd20261201'); assert.ok(seasonAt(at5am).winter > 0);
});

test('J4 season: the lab\'s switches + the wet streets ship OFF', () => {
  const q = s => new URLSearchParams(s);
  const a = labSeason(q('date=2026-12-24&snow=none&wet=1'), Date.UTC(2026, 6, 1));
  assert.equal(a.season.winter, 1); assert.equal(a.season.snowfall, 'none'); assert.ok(a.forced && a.wet);
  const b = labSeason(q('snow=heavy'), Date.UTC(2026, 6, 1, 12));
  assert.equal(b.season.winter, 0); assert.equal(b.season.snowfall, 'heavy'); assert.ok(!b.forced && !b.wet);
  assert.equal(labSeason(q('date=nope'), Date.UTC(2027, 0, 15, 12)).season.winter, 1, 'a bad date = today');
  assert.equal(parseDay('2026-13-01'), null);
  assert.ok(seasonOf('2027-01-15').wet > seasonOf('2026-07-01').wet, 'stronger + glossier in winter');
  assert.equal(WET_LIVE, false, 'WET NEON STREETS ships OFF in the live game (the owner flips it with a one-line add-on)');
});
