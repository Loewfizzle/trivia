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
  const misty = normalize({ weather_code: 2, cloud_cover: 40, visibility: 400 });
  assert.equal(misty.kind, 'mist', 'FP3a: under 1 km without a fog code is MIST (haze, no banks) — never a dense fog');
  assert.ok(misty.fog > 0.25 && misty.fog <= 0.4, `mist ≤ 0.4 (${misty.fog})`);
});

test('FP3a — THE WEATHER BY LAYERS (FREV B2): Grand Rapids, Oct 24 2026, the real Open-Meteo answers → the city’s state', () => {
  const S = (code, cc, lo, mid, hi, vis) => ({ weather_code: code, cloud_cover: cc, cloud_cover_low: lo, cloud_cover_mid: mid, cloud_cover_high: hi, visibility: vis, time: 1761314400 });
  const at10 = normalize(S(45, 100, 100, 0, 0, 100));
  assert.equal(at10.kind, 'fog', '10:00 — WMO 45 at 100 m: the dense fog (the airport had ¼ mile that minute)');
  assert.equal(at10.fog, 1);
  const at11 = normalize(S(3, 100, 100, 0, 4, 12200));
  assert.equal(at11.kind, 'overcast', '11:00 — the low deck still 100 %: overcast');
  assert.ok(at11.opaque >= 0.99 && at11.veil === 0 && at11.fog === 0);
  const at14 = normalize(S(3, 98, 2, 0, 98, 24000));
  assert.equal(at14.kind, 'veil', '14:00 — all of it HIGH (cirrostratus): a veil, NOT overcast');
  assert.ok(at14.opaque < 0.05 && at14.veil > 0.9 && at14.cloud >= 0.95, `opaque ${at14.opaque}, veil ${at14.veil}, the total kept ${at14.cloud}`);
  const at12 = normalize(S(2, 59, 56, 0, 59, 20000));
  assert.equal(at12.kind, 'clouds', '12:00 — patches under cirrus: clouds');
  assert.ok(at12.opaque > 0.5 && at12.opaque < 0.6 && at12.veil < 0.1);
  const mist = normalize({ weather_code: 2, cloud_cover: 50, visibility: 400 });
  assert.equal(mist.kind, 'mist'); assert.ok(mist.fog <= 0.4);
  const mist45 = normalize({ weather_code: 45, cloud_cover: 90, visibility: 600 });
  assert.equal(mist45.kind, 'mist', 'a fog code at 600 m: mist (0.3–0.6), no banks');
  assert.ok(mist45.fog >= 0.3 && mist45.fog <= 0.6);
  const patchy = normalize({ weather_code: 45, cloud_cover: 40, visibility: 9000 });
  assert.notEqual(patchy.kind, 'fog', 'a fog code the visibility doesn’t back is not fog');
  assert.equal(patchy.fog, 0);
  const rain = normalize(S(63, 90, 20, 10, 90, 8000));
  assert.equal(rain.kind, 'rain'); assert.ok(rain.opaque >= 0.8 && rain.veil === 0, 'rain always shuts the sky');
  // the provenance the readout shows
  assert.equal(at11.src, 'open-meteo/best_match'); assert.equal(at11.code, 3); assert.equal(at11.vis, 12200); assert.equal(at11.t, 1761314400000);
  const old = normalize({ weather_code: 3, cloud_cover: 95 });
  assert.equal(old.kind, 'overcast', 'no layers in the answer: the total cover, as before'); assert.equal(old.opaque, 0.95);
});

test('FP3a — the city reads OPAQUE, not the total: a high veil keeps the sun; mist has no banks', () => {
  const ms = at(2026, 10, 24, 14);
  const veil = look(ms, NY, { wx: { ...normalize({ weather_code: 3, cloud_cover: 98, cloud_cover_low: 2, cloud_cover_mid: 0, cloud_cover_high: 98, visibility: 24000 }), at: ms } });
  assert.ok(veil.cloud < 0.1 && veil.cover > 0.95 && veil.veil > 0.9, `look(): cloud = the opaque cover (${veil.cloud}), cover the total (${veil.cover}), veil ${veil.veil}`);
  const deck = look(ms, NY, { wx: { ...forcedWeather('stratus'), at: ms } });
  assert.ok(deck.cloud >= 0.99 && deck.veil === 0, 'a low stratus deck shuts the sky');
  const hi = look(ms, NY, { wx: { ...forcedWeather('highovercast'), at: ms } });
  assert.ok(hi.cloud < 0.05 && hi.veil > 0.9 && hi.wxKind === 'veil', 'the preview HIGH OVERCAST = a veil');
  const mist = look(ms, NY, { wx: { ...forcedWeather('mist'), at: ms } });
  assert.ok(mist.fog > 0.3 && mist.fog < 0.6 && mist.wxKind === 'mist');
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
