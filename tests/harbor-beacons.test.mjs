// 9d — THE BEACONS' PHOTOCELL (core/harbor-dark.js#photocell / beaconStep): the red obstruction lights on at SUNSET by the real light
// level (the owner: "they switch on by a light sensor as the daylight drops"), earlier on an overcast evening, off at sunrise, faded
// over ~a minute and a half, never chattering on + off.
import test from 'node:test';
import assert from 'node:assert/strict';
import { darkness, photocell, beaconStep, BEACON } from '../js/core/harbor-dark.js';
import { sunPosition, sunTimes } from '../js/core/sky.js';

const GR = { lat: 42.96, lon: -85.67, tz: 'America/Detroit' };
/** the first minute (from `from`, stepping 1 min, up to `span` min) the cell changes, at a given cloud cover — minutes from `from` */
function switchAt(from, span, cloud, start) {
  let on = start;
  for (let m = 0; m <= span; m++) {
    const ms = from + m * 60e3, k = darkness({ el: sunPosition(ms, GR.lat, GR.lon).el, cloud });
    const n = photocell(k, on);
    if (n !== on) return m;
    on = n;
  }
  return null;
}

test('9d — THE PHOTOCELL: the red beacons come on within minutes of SUNSET in Grand Rapids through the year (never in the blue hour), off within minutes of sunrise', () => {
  for (const day of ['2026-01-15', '2026-03-20', '2026-06-21', '2026-09-22', '2026-10-27', '2026-12-21']) {
    const noon = Date.parse(`${day}T17:00:00Z`), st = sunTimes(noon, GR.tz, GR.lat, GR.lon);
    assert.ok(st && st.set && st.rise, `${day}: the sun's times`);
    const evening = switchAt(st.set - 40 * 60e3, 80, 0, false);
    assert.ok(evening != null, `${day}: on at all`);
    const vsSet = evening - 40;   // (minutes after the official sunset)
    assert.ok(vsSet >= -9 && vsSet <= 2, `${day}: on ${vsSet} min from sunset (the sensor at the horizon's light)`);
    const morning = switchAt(st.rise - 40 * 60e3, 80, 0, true);
    assert.ok(morning != null && morning - 40 >= -2 && morning - 40 <= 14, `${day}: off ${morning - 40} min from sunrise`);
  }
});

test('9d — THE PHOTOCELL: a dark OVERCAST evening trips it earlier (the same darkness input as every light)', () => {
  const noon = Date.parse('2026-10-27T17:00:00Z'), st = sunTimes(noon, GR.tz, GR.lat, GR.lon);
  const clear = switchAt(st.set - 60 * 60e3, 100, 0, false), ovc = switchAt(st.set - 60 * 60e3, 100, 1, false);
  assert.ok(ovc != null && clear != null && clear - ovc >= 5, `overcast ${ovc} vs clear ${clear} (min from an hour before sunset)`);
});

test('9d — THE PHOTOCELL never chatters (hysteresis) + the lamps fade over ~90 s (a time jump joins at once)', () => {
  // the light hovering round the threshold: one switch, not one per wobble
  let on = false, flips = 0;
  for (let i = 0; i < 400; i++) { const k = BEACON.on + 0.004 * Math.sin(i * 0.7) + (i > 40 ? 0.003 : -0.01); const n = photocell(k, on); if (n !== on) flips++; on = n; }
  assert.equal(flips, 1);
  assert.equal(photocell(BEACON.on - 0.001, null), false); assert.equal(photocell(BEACON.on, null), true);
  // the fade: half way at 45 s, full by 90 s
  let k = 0; for (let s = 0; s < 45; s++) k = beaconStep(k, true, 1);
  assert.ok(Math.abs(k - 0.5) < 0.02, `half on after 45 s (${k})`);
  for (let s = 0; s < 50; s++) k = beaconStep(k, true, 1);
  assert.equal(k, 1);
  assert.equal(beaconStep(1, false, 3600), 0, 'a jump of the clock (a preview, a return) joins at once');
  assert.equal(beaconStep(0, true, NaN), 1);
});
