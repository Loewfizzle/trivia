// LIVING CITY air traffic + satellites (js/screens/district/aircraft.js): traffic by the hour, flight paths, nav lights,
// the Starlink nights and the twilight window — and the old flying vehicles / satellite train gone.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { trafficRate, planPath, navLights, starlinkNight, satTwilight } from '../js/screens/district/aircraft.js';

function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

test('traffic by the hour: busiest in the evening, steady by day, quieter late, very rare 2–5 am', () => {
  const ev = trafficRate(19.5), day = trafficRate(13), late = trafficRate(23.5), small = trafficRate(3.5);
  assert.ok(ev > day && day > late && late > small, `${ev} ${day} ${late} ${small}`);
  assert.ok(small <= 0.05);
  for (let h = 0; h < 24; h += 0.25) assert.ok(trafficRate(h) >= 0 && trafficRate(h) <= 1);
});

test('flight paths: never level, inside their band, never through a clear zone (the sign, the dock)', () => {
  const R = rng(7);
  const zones = [{ x: 16, y: 84, w: 358, h: 235 }, { x: 16, y: 688, w: 358, h: 140 }];      // a 390×844 phone
  let n = 0;
  for (let i = 0; i < 400; i++) {
    const p = planPath({ W: 390, top: 26, bottom: 455, zones, rand: R, minSlope: 0.03, maxSlope: 0.15 });
    if (!p) continue;
    n++;
    assert.ok(Math.abs(p.slope) >= 0.029, `slope ${p.slope}`);
    for (let x = -20; x <= 410; x += 4) {
      const y = p.y0 + (p.y1 - p.y0) * ((x - p.x0) / (p.x1 - p.x0));
      assert.ok(y >= 26 - 0.01 && y <= 455 + 0.01);
      for (const z of zones) assert.ok(!(x > z.x && x < z.x + z.w && y > z.y && y < z.y + z.h), `through a zone at ${x},${y}`);
    }
  }
  assert.ok(n > 300, 'paths are found');
  // both directions
  const dirs = new Set(Array.from({ length: 40 }, () => planPath({ W: 390, top: 26, bottom: 70, rand: R, minSlope: 0.02, maxSlope: 0.07 })).filter(Boolean).map(p => p.dir));
  assert.deepEqual([...dirs].sort(), [-1, 1]);
});

test('navigation lights: red on the left wingtip, green on the right — the near one shows higher', () => {
  // heading screen-right (west, seen facing south) its left wing points away: red far, green near; heading left, the reverse
  assert.deepEqual(navLights(1), { near: 'green', far: 'red' });
  assert.deepEqual(navLights(-1), { near: 'red', far: 'green' });
});

test('Starlink trains: about one evening in four or five, the same nights for everyone; only in the twilight window', () => {
  let k = 0;
  for (let i = 0; i < 1000; i++) { const d = new Date(Date.UTC(2026, 0, 1) + i * 86400000); if (starlinkNight(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate())) k++; }
  assert.ok(k > 160 && k < 290, `${k} of 1000 nights`);
  assert.equal(starlinkNight(2026, 10, 20), starlinkNight(2026, 10, 20));
  assert.equal(satTwilight(-3, 19), null, 'too light');
  assert.equal(satTwilight(-10, 19), 'evening');
  assert.equal(satTwilight(-12, 5), 'morning');
  assert.equal(satTwilight(-25, 23), null, 'deep night: the satellites are in the earth\'s shadow');
});

test('the old flying vehicles and the old satellite train are gone; planes draw behind the clouds and the skyline', () => {
  const scene = readFileSync(new URL('../js/screens/district/scene.js', import.meta.url), 'utf8');
  const fx = readFileSync(new URL('../js/screens/district/fx.js', import.meta.url), 'utf8');
  assert.ok(!/vehiclesStep|vehicles\b/.test(scene), 'vehicles removed from scene.js');
  assert.ok(!/\bsats\b|nextSats/.test(fx), 'the old satellite train removed from fx.js');
  const air = scene.indexOf('air.draw(c, fs)'), clouds = scene.indexOf('wfx.sky(c, fs)'), rows = scene.indexOf('layers.forEach((L, li) =>', air);
  assert.ok(air > 0 && air < clouds && air < rows, 'planes before the clouds and the skyline rows');
});
