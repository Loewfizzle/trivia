// CITY 2.0 — PART 9a: THE WEATHER MODEL (core/harbor-weather.js, PURE): one city state from the live answer, its intensity + why, the
// previews by name, the soft transitions (the rain builds, stops, the drips + the street drying), no weather on a clear day.
import test from 'node:test';
import assert from 'node:assert/strict';
import { cityWeather, createWeatherState, stepWeather, wetFrom, dripFrom, rateK, weatherLine, WX, WX_FORCE, WX_STATES } from '../js/core/harbor-weather.js';
import { normalize, forcedWeather, rateOf } from '../js/core/weather.js';
import { skyClock } from '../js/core/sky.js';

const cur = o => ({ temperature_2m: 12, weather_code: 0, cloud_cover: 10, cloud_cover_low: 5, cloud_cover_mid: 0, cloud_cover_high: 5, wind_speed_10m: 3, wind_direction_10m: 250, wind_gusts_10m: 5, visibility: 24000, precipitation: 0, ...o });
const live = o => normalize(cur(o), { lat: 42.96, lon: -85.67 }, Date.UTC(2026, 9, 25, 15));

test('the live answer → ONE city state (+ its intensity + why)', () => {
  assert.equal(cityWeather(null).state, 'clear', 'no answer: a dry city');
  assert.equal(cityWeather(live({})).state, 'clear');
  assert.equal(cityWeather(live({ weather_code: 3, cloud_cover: 100, cloud_cover_low: 100 })).state, 'clear', 'overcast is no weather on the city');
  assert.equal(cityWeather(live({ weather_code: 51, precipitation: 0.05 })).state, 'drizzle');
  assert.equal(cityWeather(live({ weather_code: 61, precipitation: 0.6 })).state, 'rain', 'a moderate rate (2.4 mm/h)');
  assert.equal(cityWeather(live({ weather_code: 65, precipitation: 3 })).state, 'heavy');
  assert.equal(cityWeather(live({ weather_code: 63, precipitation: 2.5 })).state, 'heavy', 'the rate decides: 10 mm/h is heavy');
  const st = cityWeather(live({ weather_code: 95, precipitation: 2 }));
  assert.equal(st.state, 'storm'); assert.ok(st.lightning && st.thunder, 'thunder + lightning when the source says so');
  assert.ok(!cityWeather(live({ weather_code: 65, precipitation: 3 })).lightning, 'heavy rain: no lightning without a thunderstorm code');
  assert.equal(cityWeather(live({ weather_code: 45, visibility: 120 })).state, 'fog');
  assert.equal(cityWeather(live({ weather_code: 3, visibility: 600 })).state, 'mist');
  assert.equal(cityWeather(live({ wind_speed_10m: 12, wind_gusts_10m: 19 })).state, 'windy');
  assert.equal(cityWeather(live({ wind_speed_10m: 6, wind_gusts_10m: 16 })).state, 'windy', 'the gusts count');
  const fz = cityWeather(live({ weather_code: 67, temperature_2m: -1, precipitation: 0.5 }));
  assert.equal(fz.state, 'freezing'); assert.ok(fz.ice > 0.4, 'ice');
  assert.equal(cityWeather(live({ weather_code: 61, temperature_2m: -1, precipitation: 0.4 })).state, 'freezing', 'rain at −1 °C glazes');
  for (const id of WX_STATES) assert.ok(typeof id === 'string');
  assert.match(st.why, /WMO 95/);
});

test('the rate: from the past quarter hour (×4), the intensity by it', () => {
  const now = Date.UTC(2026, 9, 25, 15);
  assert.equal(rateOf({ precipitation: 0 }, { time: [now / 1000 - 900, now / 1000], precipitation: [0.4, 1.1] }, now), 4.4);
  assert.equal(rateOf({ precipitation: 0.5 }, null, now), 2);
  assert.ok(rateK(0.2) < 0.3 && rateK(4) > 0.42 && rateK(4) < 0.75 && rateK(10) >= 0.75 && rateK(40) === 1);
});

test('the previews by name: &force=storm / &wx=heavy + &wxk=', () => {
  for (const id of Object.keys(WX_FORCE)) {
    const c = skyClock(`?force=${id}&at=42.96,-85.67`);
    assert.ok(c.wx && c.wx.forced, id);
    assert.equal(cityWeather(c.wx).state, { 'heavy-rain': 'heavy', 'freezing-rain': 'freezing' }[id] || id, id);
  }
  const k = skyClock('?wx=rain&wxk=light'); assert.equal(cityWeather(k.wx).k, 0.3);
  assert.equal(cityWeather(forcedWeather('windy')).state, 'windy');
  assert.equal(skyClock('?at=42.96,-85.67').wx.kind, 'clear', 'a place alone: clear weather');
});

test('the transitions: rain builds from a few drops, stops, the drips + the street drying', () => {
  const clear = cityWeather(null), rain = cityWeather(forcedWeather('rain'));
  const st = createWeatherState(clear);
  assert.equal(st.rain, 0); assert.equal(st.wet, 0);
  // the first 10 s: only a few drops
  for (let i = 0; i < 10; i++) stepWeather(st, rain, 1);
  assert.ok(st.rain > 0.005 && st.rain < 0.12, `a few drops first (${st.rain.toFixed(3)})`);
  for (let i = 0; i < 120; i++) stepWeather(st, rain, 1);
  assert.ok(Math.abs(st.rain - rain.rain) < 1e-6, 'up to the rain in ~2 min');
  assert.equal(st.wet, 1); assert.equal(st.drip, 1);
  // it stops: the rain fades over ~40 s; the drips go on for minutes, the street wet for longer
  for (let i = 0; i < 45; i++) stepWeather(st, clear, 1);
  assert.equal(st.rain, 0);
  assert.ok(st.drip > 0.85 && st.wet > 0.95, 'still dripping, still wet');
  for (let i = 0; i < 9 * 60; i++) stepWeather(st, clear, 1);
  assert.equal(st.drip, 0, 'the drips gone within ~8 min');
  assert.ok(st.wet > 0.7 && st.wet < 0.85, `the street still drying (${st.wet.toFixed(2)})`);
  for (let i = 0; i < WX.dryMin * 60; i++) stepWeather(st, clear, 1);
  assert.equal(st.wet, 0, 'dry within ~45 min');
  // a preview builds faster
  const f = createWeatherState(clear); for (let i = 0; i < 25; i++) stepWeather(f, rain, 1, { forced: true });
  assert.ok(Math.abs(f.rain - rain.rain) < 0.01, 'a forced rain is up in ~20 s');
  assert.match(weatherLine(st), /CLEAR/);
});

test('a load after real rain starts wet; a load in the rain starts raining (joined)', () => {
  const now = Date.UTC(2026, 9, 25, 15);
  assert.equal(wetFrom(null, now), 0);
  assert.equal(wetFrom(now, now), 1);
  assert.ok(Math.abs(wetFrom(now - 15 * 60000, now) - 2 / 3) < 1e-9);
  assert.equal(wetFrom(now - 60 * 60000, now), 0);
  assert.ok(dripFrom(now - 4 * 60000, now) > 0.4 && dripFrom(now - 9 * 60000, now) === 0);
  const r = createWeatherState(cityWeather(forcedWeather('storm')));
  assert.ok(r.rain > 0.6 && r.wet === 1 && r.lightning, 'joined mid-storm');
});

test('no weather on a clear day — and lightning never without a storm', () => {
  const st = createWeatherState(cityWeather(live({})));
  for (let i = 0; i < 60; i++) stepWeather(st, cityWeather(live({})), 1);
  assert.equal(st.rain, 0); assert.equal(st.fog, 0); assert.equal(st.lightning, false); assert.equal(st.wet, 0);
  const h = createWeatherState(cityWeather(live({ weather_code: 65, precipitation: 3 })));
  assert.equal(h.lightning, false);
});
