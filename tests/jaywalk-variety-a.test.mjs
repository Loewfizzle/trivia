// JAYWALK VARIETY A (docs/jaywalk.md "VARIETY A"): THE TIERS' budget, THE TIMES OF DAY on the city's sun model, OVERCAST by date — all a VIEW.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CALLS_MAX, callsMax, TODS, BANDS, todOf, lightsOf, overcastDay, resolveTod, LAB_SUN } from '../js/games/jaywalk/daylook.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');
function graph(entry) {
  const seen = new Set(), todo = [join(ROOT, entry)];
  while (todo.length) {
    const f = todo.pop();
    if (seen.has(f) || !existsSync(f)) continue;
    seen.add(f);
    for (const m of strip(readFileSync(f, 'utf8')).matchAll(/(?:from\s+|import\s*\(\s*)['"](\.{1,2}\/[^'"]+)['"]/g)) todo.push(resolve(dirname(f), m[1]));
  }
  return [...seen].map(f => f.slice(ROOT.length + 1).replace(/\\/g, '/'));
}
const dayKey = (y, m, d) => `d${y}${String(m).padStart(2, '0')}${String(d).padStart(2, '0')}`;

test('VARIETY A — THE TIERS: tier 2 may take ~96 draw calls (its sun-shadow pass), tiers 1 + 0 stay at 64', () => {
  assert.deepEqual([...CALLS_MAX], [64, 64, 96]);
  assert.equal(callsMax(2), 96); assert.equal(callsMax(1), 64); assert.equal(callsMax(0), 64); assert.equal(callsMax(9), 96); assert.equal(callsMax(-1), 64);
});

test('VARIETY A — THE TIMES OF DAY: the DAY look split by the sun\'s elevation (sunrise · noon · golden · sunset), night where the city says night', () => {
  assert.deepEqual([...TODS], ['sunrise', 'noon', 'golden', 'sunset', 'night']);
  assert.equal(todOf(-8, true), 'sunrise'); assert.equal(todOf(BANDS.sunrise - 0.1, true), 'sunrise'); assert.equal(todOf(BANDS.sunrise, true), 'noon');
  assert.equal(todOf(30, false), 'noon'); assert.equal(todOf(BANDS.golden - 0.1, false), 'golden'); assert.equal(todOf(BANDS.sunset, false), 'golden');
  assert.equal(todOf(BANDS.sunset - 0.1, false), 'sunset'); assert.equal(todOf(-8, false), 'sunset');
  // AUTO follows the city: night is the SUN's verdict (the console's day / night), the band only splits the day
  assert.equal(resolveTod('auto', { el: -8, morning: false, night: true }, 'd20260601').tod, 'night');
  assert.equal(resolveTod('auto', { el: -8, morning: false, night: false }, 'd20260601').tod, 'sunset');
  assert.equal(resolveTod('auto', { el: 45, morning: false }, 'd20260601').tod, 'noon');
  // DAY forces noon, NIGHT forces night (whatever the sun)
  assert.equal(resolveTod('day', { el: -8, morning: false, night: true }, 'd20260601').tod, 'noon');
  assert.equal(resolveTod('night', { el: 45, morning: false }, 'd20260601').tod, 'night');
  // the lab's forced time of day + its sun
  for (const t of TODS) { const r = resolveTod('auto', { el: 45, morning: false }, 'd20260601', { tod: t }); assert.equal(r.tod, t); assert.equal(r.el, LAB_SUN[t]); assert.equal(r.look, t === 'night' ? 'night' : 'day'); }
});

test('VARIETY A — THE LIGHTS by time (the owner): sunrise = cars at half, no beams, the neon going OFF · noon + golden = none · sunset = the city\'s lamps + neon ramps', () => {
  for (const el of [-9, -4, 0, 3, 5.9]) { const L = lightsOf('sunrise', el); assert.equal(L.cars, 0.5); assert.equal(L.beams, 0); assert.equal(L.lamps, 0); }
  assert.ok(lightsOf('sunrise', -9).neon > 0.9 && lightsOf('sunrise', 2).neon === 0, 'the neon switches off through the morning');
  for (const t of ['noon', 'golden']) assert.deepEqual(lightsOf(t, 5), { cars: 0, beams: 0, neon: 0, lamps: 0 });
  assert.ok(lightsOf('sunset', 1.5).lamps === 0 && lightsOf('sunset', -4).lamps === 1, 'the lights come ON around sunset (the city\'s lamps ramp)');
  assert.ok(lightsOf('sunset', -2).neon < lightsOf('sunset', -6).neon && lightsOf('sunset', -7.5).neon === 1, 'the neon comes on through the blue hour');
  assert.deepEqual(lightsOf('night', 0), { cars: 1, beams: 1, neon: 1, lamps: 1 });
});

test('VARIETY A — OVERCAST: picked by DATE (the same on every phone), about 1 day in 7, never two in a row too often, day looks only', () => {
  for (const y of [2026, 2027, 2028]) {
    let n = 0, run = 0, most = 0;
    for (let d = 0; d < 365; d++) { const t = new Date(Date.UTC(y, 0, 1 + d)); if (overcastDay(dayKey(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()))) { n++; run++; most = Math.max(most, run); } else run = 0; }
    assert.ok(n >= 40 && n <= 66, `${y}: ${n} overcast days (≈ 52)`); assert.ok(most <= 4, `${y}: the longest grey spell ${most} days`);
  }
  assert.equal(overcastDay(''), false);
  const k = 'd20261224'; assert.equal(overcastDay(k), overcastDay(k));
  const grey = ['d20261209', 'd20261221', 'd20261224'];
  for (const g of grey) assert.equal(resolveTod('auto', { el: 30, morning: false }, g).overcast, true, `${g} is grey`);
  assert.equal(resolveTod('night', null, grey[0]).overcast, false, 'never at night');
  assert.equal(resolveTod('day', null, 'd20261122', { weather: 'overcast' }).overcast, true, 'the lab forces it');
});

test('VARIETY A — THE GAMEPLAY LOCK: the rules, the replay, the director + the server\'s judge never reach the times of day', () => {
  for (const f of ['js/games/jaywalk/course.js', 'js/games/jaywalk/engine.js', 'js/games/jaywalk/replay.js', 'js/games/jaywalk/logic.js', 'js/games/jaywalk/director.js', 'js/games/jaywalk/tuning.js', 'js/games/jaywalk/versions.js']) {
    assert.ok(!graph(f).includes('js/games/jaywalk/daylook.js'), `${f} never reaches daylook.js`);
  }
});
