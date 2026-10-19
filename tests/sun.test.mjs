// LIVING CITY — THE SUN: its daily arc against the real sunrise / noon / sunset, its framed path on a phone and a desktop
// (never over the sign, the tagline or the corner buttons; left → right facing south, mirrored in the south; no jumps),
// colour and size by elevation, and real solar eclipses from the geometry. node --test tests/sun.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { sunArc, sunTimes, sunPosition, solarEclipse, look } from '../js/core/sky.js';
import { sunPlace, sunColor, sunShape } from '../js/screens/district/sun.js';

const CITIES = {
  nyc: { tz: 'America/New_York', lat: 40.71, lon: -74.0 },
  gr: { tz: 'America/Detroit', lat: 42.96, lon: -85.67 },
  sydney: { tz: 'Australia/Sydney', lat: -33.87, lon: 151.21 },
};
// a local wall-clock time in a zone → ms (searching the offset)
function at(iso, tz) {
  const guess = Date.parse(iso + 'Z');
  for (let off = -14 * 60; off <= 14 * 60; off += 15) {
    const ms = guess - off * 60000;
    const p = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(ms));
    if (p.replace(', ', 'T') === iso.slice(0, 16)) return ms;
  }
  throw new Error('no time ' + iso);
}
const hhmm = (ms, tz) => new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(ms));
const mins = s => +s.slice(0, 2) * 60 + +s.slice(3);

test('sunrise / sunset match published times (N and S hemispheres, summer and winter)', () => {
  const cases = [                                   // (timeanddate.com, ±3 min)
    ['nyc', '2026-06-21T12:00', '05:25', '20:31'],
    ['nyc', '2026-12-21T12:00', '07:17', '16:32'],
    ['sydney', '2026-12-21T12:00', '05:41', '20:05'],
    ['sydney', '2026-06-21T12:00', '07:00', '16:54'],
  ];
  for (const [c, iso, rise, set] of cases) {
    const { tz, lat, lon } = CITIES[c];
    const t = sunTimes(at(iso, tz), tz, lat, lon);
    assert.ok(Math.abs(mins(hhmm(t.rise, tz)) - mins(rise)) <= 3, `${c} ${iso} rise ${hhmm(t.rise, tz)} vs ${rise}`);
    assert.ok(Math.abs(mins(hhmm(t.set, tz)) - mins(set)) <= 3, `${c} ${iso} set ${hhmm(t.set, tz)} vs ${set}`);
  }
});

test('sunArc: 0 at the real sunrise, ½ at solar noon, 1 at sunset; higher at noon in summer (by hemisphere)', () => {
  for (const [c, { tz, lat, lon }] of Object.entries(CITIES)) {
    for (const d of ['2026-06-21', '2026-12-21', '2026-03-20']) {
      const ms = at(d + 'T12:00', tz);
      const a = sunArc(ms, tz, lat, lon);
      assert.ok(a, `${c} ${d}: an arc`);
      assert.ok(Math.abs(sunArc(a.rise, tz, lat, lon).u) < 1e-6 && Math.abs(sunArc(a.set - 1, tz, lat, lon).u - 1) < 1e-4, `${c} ${d}: ends`);
      // solar noon = the highest sun: u there is ½
      let best = a.rise, bestEl = -99;
      for (let t = a.rise; t < a.set; t += 60000) { const e = sunPosition(t, lat, lon).el; if (e > bestEl) { bestEl = e; best = t; } }
      assert.ok(Math.abs(sunArc(best, tz, lat, lon).u - 0.5) < 0.01, `${c} ${d}: noon at u ${sunArc(best, tz, lat, lon).u.toFixed(3)}`);
      assert.ok(Math.abs(a.noonEl - bestEl) < 0.2, `${c} ${d}: noonEl`);
      assert.ok(a.e1.ua > 0 && a.e1.ua < 0.5 && a.e1.ub > 0.5 && a.e1.ub < 1, `${c} ${d}: e1 crossings ${a.e1.ua.toFixed(2)} ${a.e1.ub.toFixed(2)}`);
    }
    const jun = sunArc(at('2026-06-21T12:00', tz), tz, lat, lon).noonEl, dec = sunArc(at('2026-12-21T12:00', tz), tz, lat, lon).noonEl;
    assert.ok(lat > 0 ? jun > dec + 40 : dec > jun + 40, `${c}: summer noon higher (${jun.toFixed(1)} / ${dec.toFixed(1)})`);
  }
});

// the framed path: sample a whole day, each minute, on a phone and a desktop
const SCREENS = {
  phone: { W: 390, H: 844, HZ: 844 * 0.735, base: 16.5, logo: { x: 35, y: 84, w: 320, h: 207 }, buttons: { x: 334, y: 10, w: 44, h: 90 }, safeTop: 0 },
  notch: { W: 390, H: 844, HZ: 844 * 0.735, base: 16.5, logo: { x: 35, y: 143, w: 320, h: 207 }, buttons: { x: 334, y: 69, w: 44, h: 90 }, safeTop: 59 },
  desktop: { W: 1440, H: 900, HZ: 900 * 0.74, base: 26, logo: { x: 510, y: 135, w: 420, h: 260 }, buttons: { x: 1380, y: 10, w: 44, h: 90 }, safeTop: 0 },
};
const block = l => ({ x: l.x - 6, y: l.y - 6, w: l.w + 12, h: l.h + 12 });
const hitsRect = (x, y, r, b) => { const dx = Math.max(b.x - x, 0, x - (b.x + b.w)), dy = Math.max(b.y - y, 0, y - (b.y + b.h)); return Math.hypot(dx, dy) < r; };
function day(city, date, scr) {
  const { tz, lat, lon } = CITIES[city];
  const a0 = sunArc(at(date + 'T12:00', tz), tz, lat, lon);
  const out = [];
  for (let t = a0.rise - 20 * 60000; t <= a0.set + 20 * 60000; t += 60000) {
    const el = sunPosition(t, lat, lon).el, a = sunArc(t, tz, lat, lon);
    const p = sunPlace({ W: scr.W, H: scr.H, HZ: scr.HZ, u: a.u, el, south: lat < 0, r: scr.base, block: block(scr.logo), buttons: scr.buttons, safeTop: scr.safeTop, e1: a.e1 });
    out.push({ t, el, u: a.u, ...p, r: scr.base * sunShape(el).size });
  }
  return out;
}

test('the path never crosses the sign or the tagline (it may pass behind the corner buttons), and never jumps', () => {
  for (const [name, scr] of Object.entries(SCREENS)) for (const city of Object.keys(CITIES)) for (const date of ['2026-06-21', '2026-12-21', '2026-10-20']) {
    const pts = day(city, date, scr);
    for (const p of pts) {
      if (p.el < -1) continue;                                          // set: behind the skyline
      assert.ok(!hitsRect(p.x, p.y, p.r, scr.logo), `${name} ${city} ${date} ${hhmm(p.t, CITIES[city].tz)}: the disc (${p.x.toFixed(0)},${p.y.toFixed(0)} r${p.r.toFixed(0)}) is on the sign`);
      assert.ok(p.y > -p.r && p.y < scr.HZ, `${name} ${city} ${date}: on screen above the street (${p.y.toFixed(0)})`);
    }
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      assert.ok(d < (name === 'desktop' ? 14 : 9), `${name} ${city} ${date} ${hhmm(pts[i].t, CITIES[city].tz)}: a jump of ${d.toFixed(1)} px in a minute`);
    }
  }
});

test('it rises on the left and sets on the right facing south — mirrored south of the equator', () => {
  for (const [name, scr] of Object.entries(SCREENS)) {
    for (const city of ['nyc', 'gr', 'sydney']) {
      const pts = day(city, '2026-10-20', scr).filter(p => p.el > 0);
      const first = pts[0], last = pts[pts.length - 1], noon = pts.reduce((a, b) => (b.el > a.el ? b : a));
      const north = CITIES[city].lat > 0;
      assert.ok(north ? first.x < scr.W * 0.35 && last.x > scr.W * 0.65 : first.x > scr.W * 0.65 && last.x < scr.W * 0.35, `${name} ${city}: rises ${first.x.toFixed(0)} sets ${last.x.toFixed(0)}`);
      assert.ok(noon.y < first.y && noon.y < last.y, `${name} ${city}: highest at noon`);
      assert.ok(Math.abs(noon.x - scr.W / 2) < scr.W * 0.2, `${name} ${city}: near the middle at noon (${noon.x.toFixed(0)})`);
    }
    // summer noon higher on screen than winter noon (north)
    const hi = d => day('nyc', d, scr).reduce((a, b) => (b.el > a.el ? b : a)).y;
    assert.ok(hi('2026-06-21') < hi('2026-12-21'), `${name}: summer noon higher than winter (${hi('2026-06-21').toFixed(0)} / ${hi('2026-12-21').toFixed(0)})`);
  }
});

test('colour and size by elevation: deep red-orange and larger at the horizon → warm white at midday', () => {
  const low = sunColor(0), gold = sunColor(8), high = sunColor(60);
  assert.ok(low[0] === 255 && low[1] < 100 && low[2] < 60, `horizon red-orange ${low}`);
  assert.ok(gold[1] > 140 && gold[2] < 110, `golden ${gold}`);
  assert.ok(high[1] > 240 && high[2] > 220, `midday warm white ${high}`);
  for (let e = -2; e < 60; e++) { const a = sunColor(e), b = sunColor(e + 1); assert.ok(b[1] >= a[1] && b[2] >= a[2], `warming smoothly at ${e}`); }
  assert.ok(sunShape(0).size > 1.3 && sunShape(0).squash < 0.9, 'large and squashed at the horizon');
  assert.equal(sunShape(40).size, 1); assert.equal(sunShape(40).squash, 1);
});

test('solar eclipses from the geometry: real totals, partials, an annular, and nothing on other days', () => {
  const e = (iso, lat, lon) => solarEclipse(Date.parse(iso), lat, lon);
  assert.ok(e('2024-04-08T18:42:00Z', 32.78, -96.80).total, 'Dallas, 8 Apr 2024: total');
  const ny = e('2024-04-08T19:25:00Z', 40.71, -74.0);
  assert.ok(ny && !ny.total && ny.mag > 0.85 && ny.mag < 0.93, `New York, 8 Apr 2024: ~0.90 partial (${ny && ny.mag.toFixed(3)})`);
  const gr = e('2024-04-08T19:12:00Z', 42.96, -85.67);
  assert.ok(gr && !gr.total && gr.mag > 0.88, `Grand Rapids, 8 Apr 2024: a deep partial (${gr && gr.mag.toFixed(3)})`);
  const abq = e('2023-10-14T16:35:00Z', 35.08, -106.65);
  assert.ok(abq && abq.annular && !abq.total, 'Albuquerque, 14 Oct 2023: annular');
  // the seconds of totality over a window (5 s steps)
  const totalFor = (a, b, lat, lon) => { let n = 0; for (let t = Date.parse(a); t < Date.parse(b); t += 5000) { const x = solarEclipse(t, lat, lon); if (x && x.total) n += 5; } return n; };
  const indy = totalFor('2024-04-08T19:00:00Z', '2024-04-08T19:15:00Z', 39.77, -86.16);
  assert.ok(indy > 200 && indy < 250, `Indianapolis, 8 Apr 2024: ~3 min 46 s of totality (${indy} s)`);
  assert.ok(totalFor('2026-08-12T18:20:00Z', '2026-08-12T18:40:00Z', 41.65, -0.88) > 30, 'Zaragoza, 12 Aug 2026: total');
  assert.ok(totalFor('2026-08-12T17:40:00Z', '2026-08-12T17:55:00Z', 64.15, -21.94) > 0, 'Reykjavik, 12 Aug 2026: total');
  assert.equal(totalFor('2024-04-08T19:00:00Z', '2024-04-08T19:50:00Z', 40.71, -74.0), 0, 'New York, 8 Apr 2024: never total');
  assert.equal(e('2024-04-15T19:25:00Z', 40.71, -74.0), null, 'a week later: nothing');
  assert.equal(e('2026-10-20T16:00:00Z', 40.71, -74.0), null, 'today: nothing');
  // look() carries it
  const L = look(Date.parse('2024-04-08T19:06:00Z'), 'America/Indiana/Indianapolis');
  assert.ok(L.solar && L.solar.obsc > 0.8, `look().solar at Indianapolis (${L.solar && L.solar.obsc.toFixed(2)})`);
});

test('ALWAYS NIGHT: look() says so (the sun layer then draws nothing)', () => {
  const L = look(Date.parse('2026-06-21T17:00:00Z'), 'America/New_York', { alwaysNight: true });
  assert.equal(L.alwaysNight, true);
  assert.equal(L.w.day, 0);
  assert.ok(look(Date.parse('2026-06-21T17:00:00Z'), 'America/New_York').sunArc.u > 0.3);
});
