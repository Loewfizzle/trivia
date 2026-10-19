// LIVING CITY — the sky: the sun against real sunrise / sunset, the moon against real phases, the calendar.
import test from 'node:test';
import assert from 'node:assert/strict';
import { sunTimes, placeOf, localParts, moonPhase, easter, thanksgiving, holidayOf, seasonOf, look, meteorsOf, auroraNight, skyClock } from '../js/core/sky.js';

const at = (tz, y, m, d, h = 12, mi = 0) => { const c = skyClock(`?when=${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}&tz=${tz}`); return c.now(); };
const hm = (ms, tz) => { const p = localParts(ms, tz); return p.h * 60 + p.mi; };
const near = (got, want, tol, what) => assert.ok(Math.abs(got - want) <= tol, `${what}: got ${Math.floor(got / 60)}:${String(got % 60).padStart(2, '0')}, want ${Math.floor(want / 60)}:${String(want % 60).padStart(2, '0')}`);

test('the sun: sunrise and sunset within a few minutes of the almanac', () => {
  const cases = [
    // tz, date, sunrise, sunset (local, from timeanddate.com)
    ['America/New_York', [2026, 6, 21], 5 * 60 + 25, 20 * 60 + 31],
    ['America/New_York', [2026, 12, 21], 7 * 60 + 17, 16 * 60 + 32],
    ['Europe/London', [2026, 6, 21], 4 * 60 + 43, 21 * 60 + 21],
    ['Australia/Sydney', [2026, 12, 21], 5 * 60 + 41, 20 * 60 + 5],
    ['Asia/Tokyo', [2026, 6, 21], 4 * 60 + 25, 19 * 60],
  ];
  for (const [tz, [y, m, d], rise, set] of cases) {
    const { lat, lon } = placeOf(tz);
    const t = sunTimes(at(tz, y, m, d), tz, lat, lon);
    near(hm(t.rise, tz), rise, 6, `${tz} ${y}-${m}-${d} sunrise`);
    near(hm(t.set, tz), set, 6, `${tz} ${y}-${m}-${d} sunset`);
  }
});

test('the moon: full and new on the real dates', () => {
  for (const full of ['2024-01-25T17:54Z', '2025-01-13T22:27Z', '2024-09-18T02:34Z']) assert.ok(moonPhase(Date.parse(full)).illum > 0.97, `full moon ${full}`);
  for (const nw of ['2024-04-08T18:21Z', '2025-03-29T10:58Z']) assert.ok(moonPhase(Date.parse(nw)).illum < 0.03, `new moon ${nw}`);
  const fq = moonPhase(Date.parse('2024-04-15T19:13Z'));
  assert.ok(fq.waxing && Math.abs(fq.illum - 0.5) < 0.08, 'first quarter: half lit, waxing');
});

test('the calendar: Easter and Thanksgiving across years; build-ups; the season flips south', () => {
  assert.deepEqual([2024, 2025, 2026, 2027, 2028].map(y => `${easter(y).m}-${easter(y).d}`), ['3-31', '4-20', '4-5', '3-28', '4-16']);
  assert.deepEqual([2024, 2025, 2026, 2027].map(y => thanksgiving(y).d), [28, 27, 26, 25]);
  assert.deepEqual(holidayOf(2026, 10, 31), { id: 'halloween', full: true, k: 1 });
  assert.equal(holidayOf(2026, 10, 30).full, true);
  assert.equal(holidayOf(2026, 11, 1).full, true);
  const b = holidayOf(2026, 10, 26);
  assert.ok(b && b.id === 'halloween' && !b.full && b.k > 0, 'the week before: a build-up');
  assert.equal(holidayOf(2026, 10, 18), null);
  assert.equal(holidayOf(2026, 12, 10).id, 'christmas');
  assert.ok(holidayOf(2026, 12, 20).k > holidayOf(2026, 12, 3).k, 'December builds up as it goes');
  assert.ok(holidayOf(2026, 12, 25).full);
  assert.equal(holidayOf(2026, 12, 31).id, 'nye');
  assert.equal(holidayOf(2026, 11, 26).id, 'thanksgiving');
  assert.equal(holidayOf(2026, 4, 5).id, 'easter');
  assert.equal(holidayOf(2026, 2, 14).id, 'valentine');
  assert.equal(holidayOf(2026, 3, 17).id, 'stpatrick');
  assert.equal(holidayOf(2026, 7, 4).id, 'july4');
  const north = seasonOf(15, false), south = seasonOf(15, true);
  assert.ok(north.winter > 0.9 && south.summer > 0.9, 'January: winter north, summer south');
  const edge = seasonOf(60, false);
  assert.ok(edge.winter > 0.15 && edge.spring > 0.15, 'seasons blend at the edges');
});

test('the look: dawn, day, golden hour, night and late night follow the sun; ALWAYS NIGHT; New Year countdown', () => {
  const ny = 'America/New_York';
  const L = (h, mi = 0) => look(at(ny, 2026, 10, 18, h, mi), ny);
  assert.ok(L(13).w.day > 0.9, 'midday: day');
  assert.ok(L(22).w.night > 0.9, '10 pm: night');
  assert.ok(L(3).w.late > 0.6, '3 am: late night');
  assert.ok(L(6, 50).w.dawn > 0.4, 'just before sunrise: dawn');
  assert.ok(L(18, 10).w.golden > 0.4, 'around sunset: golden hour');
  assert.equal(look(at(ny, 2026, 10, 18, 13), ny, { alwaysNight: true }).w.night, 1, 'ALWAYS NIGHT');
  const nye = look(at(ny, 2026, 12, 31, 23, 55), ny).nye;
  assert.ok(nye && nye.countdown === 300, 'five minutes to midnight');
  assert.ok(look(at(ny, 2027, 1, 1, 0, 2), ny).nye.finale >= 120, 'the finale after midnight');
  // Southern Hemisphere in December: summer, Christmas
  const syd = look(at('Australia/Sydney', 2026, 12, 25, 21), 'Australia/Sydney');
  assert.ok(syd.season.summer > 0.8 && syd.holiday.id === 'christmas');
  assert.ok(syd.snow > 0, 'Christmas still snows, even in an Australian summer');
});

test('sky events: shower peaks, rare single stars, rare aurora nights', () => {
  assert.equal(meteorsOf(2026, 8, 12).shower.id, 'perseids');
  assert.ok(meteorsOf(2026, 8, 12).rate > meteorsOf(2026, 8, 13).rate && meteorsOf(2026, 8, 13).rate > meteorsOf(2026, 9, 2).rate);
  assert.ok(meteorsOf(2026, 9, 2).rate <= 0.15, 'an ordinary night: a rare shooting star');
  let n = 0, total = 0;
  for (let y = 2026; y < 2030; y++) for (let m = 1; m <= 12; m++) for (let d = 1; d <= 28; d++) { total++; if (auroraNight(y, m, d, false)) n++; }
  assert.ok(n / total > 0.15 && n / total < 0.25, `aurora on ${n} of ${total} nights`);
  let summer = 0; for (let d = 1; d <= 31; d++) if (auroraNight(2026, 7, d, false)) summer++;
  assert.ok(summer > 0, 'summer nights get aurora too');
});
