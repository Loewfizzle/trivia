// CITY 2.0 — 9b: THE CLIMATE-AWARE FALLBACK (core/climate.js) — when the live weather fails, the city is the climate's best guess.
import test from 'node:test';
import assert from 'node:assert/strict';
import { climateWeather, climateDay, nearestStation, climatePlace, STATIONS } from '../js/core/climate.js';
import { snowState } from '../js/core/harbor-snow.js';
import { cityWeather } from '../js/core/harbor-weather.js';

const GR = { lat: 42.96, lon: -85.67, tz: 'America/Detroit' };
const PHX = { lat: 33.45, lon: -112.07, tz: 'America/Phoenix' };
const MIA = { lat: 25.76, lon: -80.19, tz: 'America/New_York' };
const MSP = { lat: 44.98, lon: -93.27, tz: 'America/Chicago' };

// a month's hours sampled (4 a day, every day) at a place
function month(place, y, m, days = 28) {
  const out = [];
  for (let d = 1; d <= days; d++) for (const h of [3, 9, 15, 21]) out.push(climateWeather(Date.UTC(y, m - 1, d, h + 5), place));
  return out;
}
const mean = a => a.reduce((s, v) => s + v, 0) / a.length;

test('climate: the nearest reference city; a place from the time zone when there is no lat / lon', () => {
  assert.equal(nearestStation(42.96, -85.67).id, 'grand-rapids');
  assert.equal(nearestStation(33.5, -112).id, 'phoenix');
  assert.equal(nearestStation(-33.9, 151.2).id, 'sydney');
  const p = climatePlace({ tz: 'America/Detroit' });
  assert.equal(nearestStation(p.lat, p.lon).id, 'detroit');
  assert.match(p.how, /time zone/);
  assert.ok(STATIONS.length >= 40);
});

test('climate: a November in Grand Rapids is cool + often cloudy', () => {
  const nov = month(GR, 2026, 11);
  assert.ok(mean(nov.map(w => w.cloud)) > 0.6, `cloudy (${mean(nov.map(w => w.cloud)).toFixed(2)})`);
  const t = mean(nov.map(w => w.temp));
  assert.ok(t > -2 && t < 10, `cool (${t.toFixed(1)} °C)`);
  assert.ok(nov.filter(w => w.kind === 'clear').length < nov.length * 0.15, 'rarely clear');
});

test('climate: Phoenix is sunny, Miami never snows', () => {
  for (const m of [1, 4, 7, 11]) {
    const p = month(PHX, 2026, m);
    assert.ok(p.filter(w => w.kind === 'clear').length > p.length * 0.7, `Phoenix mostly clear in month ${m}`);
  }
  for (let y = 2026; y <= 2028; y++) for (const m of [1, 2, 12]) {
    const a = month(MIA, y, m);
    assert.ok(a.every(w => !w.snow && w.kind !== 'snow'), `no snow in Miami ${y}-${m}`);
    assert.ok(a.every(w => snowState(w.pack).stage === 'none'), `no snow on the ground in Miami ${y}-${m}`);
  }
});

test('climate: a January in Minneapolis has snow on the ground; a July nowhere does', () => {
  const jan = month(MSP, 2027, 1).filter((_, i) => i % 4 === 2);
  assert.ok(jan.filter(w => snowState(w.pack).stage !== 'none').length >= jan.length * 0.85, 'snow on the ground most of January');
  for (const pl of [GR, MSP, PHX, MIA]) assert.ok(month(pl, 2026, 7).every(w => snowState(w.pack).stage === 'none'), 'no snow in July');
});

test('climate: never fresh snow on a mild day; the same instant + place gives the same answer; it drifts gently', () => {
  for (const pl of [GR, MSP]) for (const m of [1, 3, 11, 12]) for (const w of month(pl, 2026, m)) {
    if (w.kind === 'snow') assert.ok(w.temp <= 1 && w.climate.day.tmax <= 3.5, `snow at ${w.temp} °C (high ${w.climate.day.tmax})`);
  }
  const ms = Date.UTC(2026, 10, 12, 18);
  assert.deepEqual(climateWeather(ms, GR), climateWeather(ms, GR));
  assert.deepEqual(climateDay(nearestStation(GR.lat, GR.lon), 2026, 11, 12), climateDay(nearestStation(GR.lat, GR.lon), 2026, 11, 12));
  // ten minutes on: the temperature + the cloud move a little, never jump
  for (let h = 0; h < 24; h++) {
    const a = climateWeather(Date.UTC(2026, 10, 12, h, 0), GR), b = climateWeather(Date.UTC(2026, 10, 12, h, 10), GR);
    assert.ok(Math.abs(a.temp - b.temp) < 1.2, `temp ${a.temp} → ${b.temp}`);
    assert.ok(Math.abs(a.cloud - b.cloud) < 0.25 || a.kind !== b.kind, `cloud ${a.cloud} → ${b.cloud}`);
  }
});

test('climate: its answer reads as a city weather (harbor-weather) and says where it came from', () => {
  const w = climateWeather(Date.UTC(2027, 0, 20, 18), GR);
  assert.equal(w.src, 'climate');
  assert.match(w.climate.why, /grand-rapids normals/);
  const c = cityWeather(w);
  assert.ok(c.state, 'a state');
  assert.match(c.why, /WMO/);
});
