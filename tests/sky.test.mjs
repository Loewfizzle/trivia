// LIVING CITY — the sky: the sun against real sunrise / sunset, the moon against real phases, the calendar.
import test from 'node:test';
import assert from 'node:assert/strict';
import { moonArc, sunTimes, placeOf, localParts, moonPhase, easter, thanksgiving, holidayOf, seasonOf, look, meteorsOf, auroraNight, skyClock, cleanZone } from '../js/core/sky.js';

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

test('the moon crosses the screen from moonrise (0) to moonset (1)', () => {
  const lat = 40.7, lon = -74;
  const t0 = Date.parse('2026-10-19T01:30:00Z');   // 9:30 pm in New York, a first-quarter moon in the south-west
  const a = moonArc(t0, lat, lon), b = moonArc(t0 + 3600000, lat, lon);
  assert.ok(a > 0.5 && a < 1 && b > a, `moving toward its set (${a.toFixed(2)} → ${b.toFixed(2)})`);
  assert.equal(moonArc(t0 + 8 * 3600000, lat, lon), null, 'down after moonset');
  // near the set it's close to 1
  let x = t0; while (moonArc(x + 600000, lat, lon) != null) x += 600000;
  assert.ok(moonArc(x, lat, lon) > 0.97, 'just before moonset: the right edge');
});

test('the night sky: real star positions turn with the sky', async () => {
  const { galToEq, altAz, lst } = await import('../js/screens/district/stars.js');
  const gc = galToEq(0, 0);
  assert.ok(Math.abs(gc.ra - 266.4) < 0.5 && Math.abs(gc.dec + 28.94) < 0.5, `galactic centre at RA ${gc.ra.toFixed(1)} Dec ${gc.dec.toFixed(1)}`);
  // Polaris sits at the observer's latitude, due north, all night
  const lat = 40.7, lon = -74;
  for (const h of [0, 6]) {
    const p = altAz(37.95, 89.26, lat, lst(Date.parse('2026-10-19T02:00:00Z') + h * 3600000, lon));
    assert.ok(Math.abs(p.alt - lat) < 1.2 && (p.az < 2 || p.az > 358), `Polaris alt ${p.alt.toFixed(1)} az ${p.az.toFixed(1)}`);
  }
  // Orion's Betelgeuse: high in the south on a January evening in New York, below the horizon on a July evening
  const jan = altAz(5.919 * 15, 7.41, lat, lst(Date.parse('2027-01-15T03:00:00Z'), lon));
  const jul = altAz(5.919 * 15, 7.41, lat, lst(Date.parse('2026-07-15T03:00:00Z'), lon));
  assert.ok(jan.alt > 40 && jan.az > 140 && jan.az < 220, `January: alt ${jan.alt.toFixed(0)} az ${jan.az.toFixed(0)}`);
  assert.ok(jul.alt < 0, 'July evening: below the horizon');
});

test('NIGHT-A — a time zone is cleaned + checked before Intl sees it (the owner: "invalid time zone: America/Detroit")', () => {
  const dev = () => 'Europe/Paris';
  for (const raw of ['America/Detroit\u200b', '\u200bAmerica/Detroit', 'America/Detroit ', ' America/Detroit', 'America/Detroit\u00a0', 'America\uff0fDetroit',
    'America%2FDetroit', '"America/Detroit"', 'America/Detroit)', 'America/Detroit.', 'america/detroit', 'America/Detroit\ufeff', 'America/Detroit\u2060', 'America/Detroit\n']) {
    const z = cleanZone(raw, dev);
    assert.equal(z.tz, 'America/Detroit', JSON.stringify(raw));
    assert.equal(z.bad, 'fixed');
    assert.doesNotThrow(() => new Intl.DateTimeFormat('en-CA', { timeZone: z.tz }));
  }
  assert.deepEqual(cleanZone('America/Detroit', dev), { tz: 'America/Detroit', raw: 'America/Detroit', bad: null, shown: 'America/Detroit' });
  assert.equal(cleanZone('America/New York', dev).tz, 'America/New_York');
  for (const raw of ['Mars/Olympus', 'America/Detroitx', '<script>', '\u200b', '%E0%A4%A']) {
    const z = cleanZone(raw, dev);
    assert.equal(z.tz, 'Europe/Paris', JSON.stringify(raw)); assert.equal(z.bad, 'invalid');
  }
  assert.equal(cleanZone('America/Detroit\u200b', dev).shown, 'America/Detroit' + String.fromCharCode(92) + 'u200b');
  assert.equal(cleanZone(null, dev).tz, 'Europe/Paris'); assert.equal(cleanZone('', dev).bad, null);
  // the clock carries the cleaned zone + a note for /admin
  const c = skyClock('?tz=America/Detroit%E2%80%8B&when=2026-10-29T21:00');
  assert.equal(c.tz, 'America/Detroit'); assert.equal(c.tzNote.bad, 'fixed');
  assert.equal(localParts(c.now(), c.tz).h, 21);
  assert.equal(skyClock('?tz=America/Detroit').tzNote, null);
});
