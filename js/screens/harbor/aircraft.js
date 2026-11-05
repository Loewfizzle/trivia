// LIVING CITY — air traffic and satellites, the PURE part (docs/title.md): when, where, which lights. Simulated: no flight data, no network.
// (CITY 1.0 OUT: City 1.0's own painter — createAircraft — went; the Harbor draws its sky traffic in harbor/air.js on these.)
// Pure helpers (exported, tested in tests/aircraft.test.mjs): trafficRate, planPath, navLights, starlinkNight, satTwilight.

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
function hash(str) { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); } return h >>> 0; }

// ---------------------------------------------------------------- pure helpers
/** PURE: how busy the sky is at a local hour, 0..1: busiest in the evening, steady by day, quieter late, very rare 2–5 am. */
export function trafficRate(hr) {
  const g = (c, w) => Math.exp(-Math.pow((hr - c) / w, 2));
  if (hr >= 2 && hr < 5) return 0.04;
  const day = 0.62 * smooth(5, 8, hr) * (1 - smooth(22, 24.5, hr));
  const evening = 0.42 * g(19.5, 2.2);
  const late = hr < 2 ? 0.26 * (1 - hr / 2.2) : hr >= 22 ? 0.3 : 0;
  return clamp01(Math.max(day + evening, late, 0.04));
}

/** PURE: a straight path across the open sky, never level, never through a clear zone. Returns { x0, y0, x1, y1, dir, slope } or null.
 *  o: { W, top, bottom, zones: [{x, y, w, h}], rand, minSlope, maxSlope, margin } — the path runs from off one side to off the other. */
export function planPath({ W, top, bottom, zones = [], rand = Math.random, minSlope = 0.035, maxSlope = 0.16, margin = 16, dir = null, tries = 120 }) {
  for (let i = 0; i < tries; i++) {
    const d = dir || (rand() < 0.5 ? 1 : -1);
    const slope = (minSlope + rand() * (maxSlope - minSlope)) * (rand() < 0.5 ? 1 : -1);     // climbing or descending a little
    const x0 = d > 0 ? -60 : W + 60, x1 = d > 0 ? W + 60 : -60;
    const y0 = top + rand() * (bottom - top);
    const y1 = y0 + slope * (x1 - x0) * d * d;
    if (y1 < top || y1 > bottom) continue;
    let ok = true;
    for (let x = -20; x <= W + 20 && ok; x += 8) {
      const y = y0 + (y1 - y0) * ((x - x0) / (x1 - x0));
      for (const z of zones) if (x > z.x - margin && x < z.x + z.w + margin && y > z.y - margin && y < z.y + z.h + margin) { ok = false; break; }
    }
    if (ok) return { x0, y0, x1, y1, dir: d, slope: (y1 - y0) / (x1 - x0) };
  }
  return null;
}

/** PURE: which navigation light is the near wingtip (seen from the street, facing south: screen-right is west) for a plane
 *  heading screen-right (dir 1) or screen-left (−1). The near wingtip shows a little higher on screen, the far one lower
 *  (it's further off, nearer the horizon). Port (left) is red, starboard (right) green. */
export function navLights(dir) {
  // heading west (right): its left wing points south — away from us; heading east (left): its left wing points north, toward us
  return dir > 0 ? { near: 'green', far: 'red' } : { near: 'red', far: 'green' };
}

/** PURE: a Starlink evening / morning (about one in four or five, seeded by the local date: the same nights for everyone). */
export const starlinkNight = (y, m, d) => hash(`starlink:${y}-${m}-${d}`) % 100 < 22;

/** PURE: the twilight hours when satellites shine (the sky dark, the satellite still in sunlight): the sun 6–18° down.
 *  Returns 'evening' | 'morning' | null. */
export function satTwilight(sunEl, hour) {
  if (sunEl > -6 || sunEl < -18) return null;
  return hour >= 12 ? 'evening' : 'morning';
}
