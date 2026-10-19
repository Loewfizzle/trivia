// LIVE WEATHER (core/weather.js + core/sky.js#look), the planets, lunar eclipses, the street's clock (district/street.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { fromWmo, normalize, forcedWeather, isFresh, areaOf, WEATHER_TTL_MS } from '../js/core/weather.js';
import { look, planetsAt, eclipseAt, skyClock } from '../js/core/sky.js';
import { trafficAt, trainGap } from '../js/screens/district/street.js';

const NY = 'America/New_York';
const at = (y, m, d, h, mi = 0) => Date.UTC(y, m - 1, d, h + 4, mi);      // EDT (summer / autumn) wall time → UTC

test('WMO weather codes → kinds and intensities', () => {
  assert.equal(fromWmo(0).kind, 'clear');
  assert.equal(fromWmo(3).kind, 'overcast');
  assert.equal(fromWmo(45).kind, 'fog');
  assert.equal(fromWmo(61).rain < fromWmo(65).rain, true, 'heavier rain');
  assert.equal(fromWmo(95).storm, 1);
  assert.equal(fromWmo(75).snow, 1);
  assert.equal(fromWmo(1234).kind, 'clouds', 'an unknown code is just cloudy');
});

test('Open-Meteo current conditions → the city weather (cloud cover, fog from visibility, wind)', () => {
  const w = normalize({ weather_code: 63, cloud_cover: 88, wind_speed_10m: 7.34, wind_direction_10m: 271, temperature_2m: 9.25, visibility: 9000 }, { lat: 43, lon: -85.5 }, 1000);
  assert.equal(w.kind, 'rain');
  assert.equal(w.rain, 0.7);
  assert.equal(w.cloud, 0.88);
  assert.equal(w.wind, 7.3);
  assert.equal(w.windDir, 271);
  assert.equal(w.lat, 43);
  assert.equal(w.at, 1000);
  const foggy = normalize({ weather_code: 2, cloud_cover: 40, visibility: 400 });
  assert.equal(foggy.kind, 'fog', 'under ~1 km visibility is fog whatever the code says');
  assert.ok(foggy.fog > 0.8);
});

test('the area is rounded (~35 miles) before anything is kept; nonsense is refused', () => {
  const a = areaOf(42.9634, -85.6681);          // Grand Rapids
  assert.deepEqual([a.lat, a.lon], [43, -85.5]);
  assert.match(a.key, /^a43p0_m85p5$/);
  assert.equal(areaOf('x', 3), null);
  assert.equal(areaOf(95, 0), null);
  assert.equal(areaOf(null, null), null, 'missing is not 0°, 0°');
});

test('live weather is used while fresh, then the city falls back', () => {
  const w = forcedWeather('rain', { at: 1000 });
  assert.equal(isFresh(w, 1000 + WEATHER_TTL_MS - 1), true);
  assert.equal(isFresh(w, 1000 + WEATHER_TTL_MS + 1), false);
  assert.equal(isFresh(null), false);
});

test('look(): rain, storms, fog and snow come ONLY from real weather — no weather, a dry city', () => {
  // the old seeded "rainy evenings" are gone: over a whole autumn, never any rain without live weather
  let wet = 0;
  for (let d = 0; d < 90; d++) for (const h of [3, 9, 15, 21]) { const L = look(at(2026, 9, 1, h) + d * 86400000, NY); if (L.rain || L.storm || L.fog) wet++; }
  assert.equal(wet, 0);
  const ms = at(2026, 10, 20, 21, 30);
  const live = { ...forcedWeather('storm'), at: ms, lat: 43, lon: -85.5 };
  const L = look(ms, NY, { wx: live });
  assert.ok(L.rain > 0.9 && L.storm === 1 && L.cloud === 1 && L.live);
  assert.equal(L.clear, false);
  assert.equal(L.lat, 43, 'the sun and moon come from the real place');
  // stale live weather is ignored
  assert.equal(look(ms, NY, { wx: { ...live, at: ms - WEATHER_TTL_MS - 1 } }).rain, 0);
  // the preview switch (?wx=) works at any date
  const q = skyClock('?when=2026-01-15T21:00&tz=America/New_York&wx=snow');
  assert.ok(look(q.now(), q.tz, { wx: q.wx }).snow > 0.7);
  // Christmas keeps a little snow (unless it really rains)
  assert.ok(look(Date.UTC(2026, 11, 25, 2), NY).snow > 0.5);
  assert.equal(look(Date.UTC(2026, 11, 25, 2), NY, { wx: { ...forcedWeather('rain'), at: Date.UTC(2026, 11, 25, 2) } }).snow, 0);
});

test('the planets: Venus stays near the sun, Jupiter at its real distance', () => {
  for (let i = 0; i < 40; i++) {
    const P = planetsAt(Date.UTC(2026, 0, 1) + i * 86400000 * 9);
    const j = P.find(p => p.name === 'jupiter');
    assert.ok(j.dist > 3.9 && j.dist < 6.6, `jupiter ${j.dist}`);
    for (const p of P) assert.ok(p.ra >= 0 && p.ra < 360 && Math.abs(p.dec) < 30);
  }
});

test('lunar eclipses on their real dates: partial, total, over', () => {
  const g = Date.parse('2026-03-03T11:34Z');
  assert.deepEqual(eclipseAt(g), { p: 0, mag: 1.15, total: true });
  const before = eclipseAt(g - 60 * 60000);
  assert.ok(before.p < 0 && !before.total, 'an hour before: the shadow still coming across');
  assert.equal(eclipseAt(g + 3 * 3600000), null);
  const partial = eclipseAt(Date.parse('2026-08-28T04:13Z'));
  assert.equal(partial.total, false);
});

test('the street follows the clock: rush hours, a quiet small hours; trains stop overnight', () => {
  assert.ok(trafficAt(8.2, 2) > trafficAt(11, 2) && trafficAt(17.6, 2) > trafficAt(14, 2));
  assert.ok(trafficAt(3.5, 2) < 0.25);
  assert.equal(trainGap(3), Infinity);
  assert.ok(trainGap(8) < trainGap(12) && trainGap(12) < trainGap(23));
});
