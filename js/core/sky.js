// LIVING CITY — the sky the title city mirrors, PURE (no DOM): the real sun and moon for the player's local time and an
// approximate place (from the time zone; never a location prompt), the season, holidays with their build-up, meteor
// showers, rare aurora nights, rain nights. district/scene.js asks look(ms, tz) every few seconds and blends to it.
//
//   look(ms, tz, { alwaysNight }) → {
//     local {y, m, d, h, mi, s, dow, doy}, lat, lon, south,
//     sun {el, az}, moon {el, az, phase (0 new .. 0.5 full .. 1), illum, waxing},
//     w {night, late, dawn, day, golden}  (time-of-day weights, sum 1),
//     season {winter, spring, summer, autumn}  (blends at the edges),
//     holiday {id, full, k} | null,  nye {countdown (s to local midnight, last 10 min), finale (s since midnight, first 5 min)},
//     rain (0..1), snow (0..1), clear, meteors (per minute), aurora (bool), key (changes when the picture should change)
//   }

import { isFresh, forcedWeather, opaqueOf, veilOf } from './weather.js';
import { WX_FORCE, WX_K } from './harbor-weather.js';
import { partyLateK, inPartyWindow } from './party.js';

const RAD = Math.PI / 180;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
function hash(str) { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); } return h >>> 0; }

// ---------------------------------------------------------------- time zones → a representative place
// [lat, lon] for the zones most players will have; anything else falls back on the UTC offset (lon = offset × 15°) at a
// sensible latitude for its region.
const ZONES = {
  'America/New_York': [40.71, -74.01], 'America/Detroit': [42.33, -83.05], 'America/Toronto': [43.65, -79.38], 'America/Chicago': [41.88, -87.63],
  'America/Denver': [39.74, -104.99], 'America/Phoenix': [33.45, -112.07], 'America/Los_Angeles': [34.05, -118.24], 'America/Vancouver': [49.28, -123.12],
  'America/Anchorage': [61.22, -149.9], 'Pacific/Honolulu': [21.31, -157.86], 'America/Halifax': [44.65, -63.57], 'America/St_Johns': [47.56, -52.71],
  'America/Mexico_City': [19.43, -99.13], 'America/Bogota': [4.71, -74.07], 'America/Lima': [-12.05, -77.04], 'America/Santiago': [-33.45, -70.67],
  'America/Sao_Paulo': [-23.55, -46.63], 'America/Argentina/Buenos_Aires': [-34.6, -58.38], 'America/Caracas': [10.48, -66.9], 'America/Puerto_Rico': [18.47, -66.11],
  'America/Indiana/Indianapolis': [39.77, -86.16], 'America/Kentucky/Louisville': [38.25, -85.76], 'America/Boise': [43.62, -116.2], 'America/Edmonton': [53.55, -113.49],
  'America/Winnipeg': [49.9, -97.14], 'America/Regina': [50.45, -104.61],
  'Europe/London': [51.51, -0.13], 'Europe/Dublin': [53.35, -6.26], 'Europe/Lisbon': [38.72, -9.14], 'Europe/Madrid': [40.42, -3.7], 'Europe/Paris': [48.86, 2.35],
  'Europe/Brussels': [50.85, 4.35], 'Europe/Amsterdam': [52.37, 4.9], 'Europe/Berlin': [52.52, 13.4], 'Europe/Zurich': [47.38, 8.54], 'Europe/Rome': [41.9, 12.5],
  'Europe/Vienna': [48.21, 16.37], 'Europe/Prague': [50.08, 14.44], 'Europe/Warsaw': [52.23, 21.01], 'Europe/Stockholm': [59.33, 18.07], 'Europe/Oslo': [59.91, 10.75],
  'Europe/Copenhagen': [55.68, 12.57], 'Europe/Helsinki': [60.17, 24.94], 'Europe/Athens': [37.98, 23.73], 'Europe/Istanbul': [41.01, 28.98], 'Europe/Kyiv': [50.45, 30.52],
  'Europe/Kiev': [50.45, 30.52], 'Europe/Moscow': [55.76, 37.62], 'Europe/Bucharest': [44.43, 26.1], 'Europe/Budapest': [47.5, 19.04],
  'Africa/Cairo': [30.04, 31.24], 'Africa/Lagos': [6.52, 3.38], 'Africa/Nairobi': [-1.29, 36.82], 'Africa/Johannesburg': [-26.2, 28.05], 'Africa/Casablanca': [33.57, -7.59],
  'Asia/Dubai': [25.2, 55.27], 'Asia/Karachi': [24.86, 67.0], 'Asia/Kolkata': [19.08, 72.88], 'Asia/Calcutta': [19.08, 72.88], 'Asia/Dhaka': [23.81, 90.41],
  'Asia/Bangkok': [13.76, 100.5], 'Asia/Jakarta': [-6.2, 106.85], 'Asia/Singapore': [1.35, 103.82], 'Asia/Kuala_Lumpur': [3.14, 101.69], 'Asia/Manila': [14.6, 120.98],
  'Asia/Hong_Kong': [22.32, 114.17], 'Asia/Shanghai': [31.23, 121.47], 'Asia/Taipei': [25.03, 121.57], 'Asia/Seoul': [37.57, 126.98], 'Asia/Tokyo': [35.68, 139.69],
  'Asia/Jerusalem': [31.77, 35.21], 'Asia/Riyadh': [24.71, 46.68], 'Asia/Tehran': [35.69, 51.39],
  'Australia/Sydney': [-33.87, 151.21], 'Australia/Melbourne': [-37.81, 144.96], 'Australia/Brisbane': [-27.47, 153.03], 'Australia/Adelaide': [-34.93, 138.6],
  'Australia/Perth': [-31.95, 115.86], 'Australia/Hobart': [-42.88, 147.33], 'Australia/Darwin': [-12.46, 130.84], 'Pacific/Auckland': [-36.85, 174.76],
  'UTC': [51.48, 0], 'Etc/UTC': [51.48, 0],
};
const REGION_LAT = { America: 38, Europe: 50, Africa: 5, Asia: 30, Australia: -32, Pacific: -20, Atlantic: 40, Indian: -20, Antarctica: -70 };

/** Local calendar + clock in a time zone (Intl), with the zone's UTC offset in minutes. */
export function localParts(ms, tz) {
  let f;
  try { f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', weekday: 'short' }); }
  catch { f = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', weekday: 'short' }); }
  const p = {};
  for (const x of f.formatToParts(new Date(ms))) p[x.type] = x.value;
  const y = +p.year, m = +p.month, d = +p.day, h = +p.hour % 24, mi = +p.minute, s = +p.second;
  const off = Math.round((Date.UTC(y, m - 1, d, h, mi, s) - Math.floor(ms / 1000) * 1000) / 60000);
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
  const doy = Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86_400_000) + 1;
  return { y, m, d, h, mi, s, dow, doy, off };
}

export function placeOf(tz, offMin = 0) {
  if (ZONES[tz]) return { lat: ZONES[tz][0], lon: ZONES[tz][1], known: true };
  const region = String(tz || '').split('/')[0];
  const lat = REGION_LAT[region] ?? 40;
  return { lat, lon: Math.max(-180, Math.min(180, (offMin / 60) * 15)), known: false };
}
export const deviceZone = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; } };
/** NIGHT-A — A TIME ZONE IS CHECKED BEFORE Intl EVER SEES IT (the owner's iPhone, Oct 29: "RangeError: invalid time zone: America/Detroit"
 *  from district/sun.js — the name looked right, so the string carried something invisible: a zero-width space, a no-break space, a
 *  stray quote or bracket from a pasted link, a %-escape left over). The raw value is cleaned (invisible + control characters out, the
 *  compatibility forms folded — a no-break space, a full-width slash — whitespace inside → '_', wrapping quotes / brackets / trailing
 *  punctuation off, a leftover %-escape decoded, a case slip fixed), then tried on Intl; a zone Intl still rejects falls back to the
 *  device's. → { tz, raw, bad: null | 'fixed' | 'invalid', shown } — `shown` = the raw string with every non-ASCII character as \uXXXX
 *  (what /admin needs to see what really arrived). */
const zoneOk = tz => { try { return new Intl.DateTimeFormat('en-US', { timeZone: tz }).resolvedOptions().timeZone || tz; } catch { return null; } };
export const zoneShown = s => String(s).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
export function cleanZone(raw, fallback = deviceZone) {
  if (raw == null || raw === '') return { tz: fallback(), raw: null, bad: null, shown: '' };
  let s = String(raw);
  if (/%[0-9a-f]{2}/i.test(s)) { try { s = decodeURIComponent(s); } catch {} }
  s = s.normalize('NFKC').replace(/[\u0000-\u001f\u007f-\u009f\u00ad\u034f\u061c\u115f\u1160\u17b4\u17b5\u180e\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g, '')
    .trim().replace(/\s+/g, '_').replace(/^["'`<(\[{\u2018-\u201f]+/, '').replace(/["'`>)\]}.,;:!?\u2018-\u201f]+$/, '');
  const ok = s ? zoneOk(s) : null;
  if (ok) {
    const tz = ok !== s && ok.toLowerCase() === s.toLowerCase() ? ok : s;   // (a case slip → Intl's spelling; an alias like US/Eastern kept as typed)
    return { tz, raw, bad: tz === raw ? null : 'fixed', shown: zoneShown(raw) };
  }
  return { tz: fallback(), raw, bad: 'invalid', shown: zoneShown(raw) };
}

// ---------------------------------------------------------------- the sun (NOAA's solar position algorithm)
const julian = ms => ms / 86_400_000 + 2440587.5;
export function sunPosition(ms, lat, lon) {
  const jc = (julian(ms) - 2451545) / 36525;
  const L0 = (280.46646 + jc * (36000.76983 + jc * 0.0003032)) % 360;
  const M = 357.52911 + jc * (35999.05029 - 0.0001537 * jc);
  const e = 0.016708634 - jc * (0.000042037 + 0.0000001267 * jc);
  const C = Math.sin(M * RAD) * (1.914602 - jc * (0.004817 + 0.000014 * jc)) + Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * jc) + Math.sin(3 * M * RAD) * 0.000289;
  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * jc;
  const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(omega * RAD);
  const eps0 = 23 + (26 + (21.448 - jc * (46.815 + jc * (0.00059 - jc * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos(omega * RAD);
  const decl = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD)) / RAD;
  const y = Math.tan((eps / 2) * RAD) ** 2;
  const eqTime = 4 * (y * Math.sin(2 * L0 * RAD) - 2 * e * Math.sin(M * RAD) + 4 * e * y * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD) - 0.5 * y * y * Math.sin(4 * L0 * RAD) - 1.25 * e * e * Math.sin(2 * M * RAD)) / RAD;
  const utcMin = ((ms / 60000) % 1440 + 1440) % 1440;
  let tst = (utcMin + eqTime + 4 * lon) % 1440;
  if (tst < 0) tst += 1440;
  let ha = tst / 4 - 180;
  if (ha < -180) ha += 360;
  const zen = Math.acos(Math.sin(lat * RAD) * Math.sin(decl * RAD) + Math.cos(lat * RAD) * Math.cos(decl * RAD) * Math.cos(ha * RAD)) / RAD;
  const el = 90 - zen;
  let az = Math.acos(((Math.sin(lat * RAD) * Math.cos(zen * RAD)) - Math.sin(decl * RAD)) / (Math.cos(lat * RAD) * Math.sin(zen * RAD) || 1e-9)) / RAD;
  az = ha > 0 ? (az + 180) % 360 : (540 - az) % 360;
  return { el, az };
}
/** Sunrise / sunset (ms) on the local date containing ms: the crossings of −0.833° (refraction + the disc). */
export function sunTimes(ms, tz, lat, lon) {
  const lp = localParts(ms, tz);
  const midnight = Date.UTC(lp.y, lp.m - 1, lp.d) - lp.off * 60000;
  const el = t => sunPosition(t, lat, lon).el + 0.833;
  const cross = (a, b, rising) => {
    if (rising ? !(el(a) <= 0 && el(b) > 0) : !(el(a) > 0 && el(b) <= 0)) return null;
    for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if ((el(m) > 0) === rising) b = m; else a = m; }
    return (a + b) / 2;
  };
  let rise = null, set = null;
  for (let t = midnight; t < midnight + 86_400_000; t += 1_800_000) {
    if (rise == null) rise = cross(t, t + 1_800_000, true);
    if (set == null) set = cross(t, t + 1_800_000, false);
  }
  return { rise, set };
}

/** The sun's pass today: u = how far between today's real sunrise (0) and sunset (1) — it runs a little below 0 / above 1
 *  just outside them (the sun under the horizon) — and noonEl, its highest elevation today (the season: higher in summer).
 *  null when the sun doesn't rise or set (polar day / night). Cached per local day and place. */
const sunDayCache = new Map();
export function sunArc(ms, tz, lat, lon) {
  const lp = localParts(ms, tz);
  const key = `${lp.y}-${lp.m}-${lp.d}|${lat.toFixed(2)}|${lon.toFixed(2)}`;
  let day = sunDayCache.get(key);
  if (!day) {
    const { rise, set } = sunTimes(ms, tz, lat, lon);
    if (rise != null && set != null && set > rise) {
      const noon = (rise + set) / 2, noonEl = sunPosition(noon, lat, lon).el;
      const at = (a, b, up, E) => { for (let i = 0; i < 24; i++) { const m = (a + b) / 2; if ((sunPosition(m, lat, lon).el < E) === up) a = m; else b = m; } return (a + b) / 2; };
      // the real climb: for elevations above the sunrise horizon (e = el + 0.83°, 0 … noon), where the sun is in u, morning and
      // afternoon — the phone's arch checks its clearance against the real pace (the climb is no sine near the horizon)
      const N = noonEl + 0.83, prof = [];
      for (let i = 0; i <= 36; i++) {
        const e = N * (i / 36) * (i / 36);
        const tm = at(rise, noon, true, e - 0.83), ta2 = at(noon, set, false, e - 0.83);
        prof.push([e, (tm - rise) / (set - rise), (ta2 - rise) / (set - rise)]);
      }
      day = { rise, set, noonEl, prof };
    } else day = null;
    if (sunDayCache.size > 60) sunDayCache.clear();
    sunDayCache.set(key, day);
  }
  if (!day) return null;
  // the season for this place: 0 = today's noon is as low as the winter solstice's, 1 = as high as the summer solstice's
  const ax = Math.abs(lat), wNoon = Math.max(0, 90 - ax - 23.44), sNoon = Math.min(90, 90 - ax + 23.44);
  const season = Math.max(0, Math.min(1, (day.noonEl - wNoon) / Math.max(1, sNoon - wNoon)));
  return { u: (ms - day.rise) / (day.set - day.rise), noonEl: day.noonEl, season, prof: day.prof, rise: day.rise, set: day.set };
}

// ---------------------------------------------------------------- solar eclipses, from the geometry itself
// The moon to ~0.02° (Meeus' principal periodic terms) seen from the viewer's place (topocentric: the moon's parallax is
// nearly 1°, larger than the sun), against the sun (NOAA, above). An eclipse is simply the two discs overlapping — no
// table of dates needed: on a real eclipse date and time, at the viewer's estimated location, the moon covers the sun by the
// amount it really does (and on any other day it can't).
// Meeus, Astronomical Algorithms ch. 47 (ELP-2000/82 truncated, ~10″): rows of D, M, M′, F, Σl (1e-6°), Σr (m)
const ML = [
  0,0,1,0,6288774,-20905355, 2,0,-1,0,1274027,-3699111, 2,0,0,0,658314,-2955968, 0,0,2,0,213618,-569925, 0,1,0,0,-185116,48888,
  0,0,0,2,-114332,-3149, 2,0,-2,0,58793,246158, 2,-1,-1,0,57066,-152138, 2,0,1,0,53322,-170733, 2,-1,0,0,45758,-204586,
  0,1,-1,0,-40923,-129620, 1,0,0,0,-34720,108743, 0,1,1,0,-30383,104755, 2,0,0,-2,15327,10321, 0,0,1,2,-12528,0,
  0,0,1,-2,10980,79661, 4,0,-1,0,10675,-34782, 0,0,3,0,10034,-23210, 4,0,-2,0,8548,-21636, 2,1,-1,0,-7888,24208,
  2,1,0,0,-6766,30824, 1,0,-1,0,-5163,-8379, 1,1,0,0,4987,-16675, 2,-1,1,0,4036,-12831, 2,0,2,0,3994,-10445,
  4,0,0,0,3861,-11650, 2,0,-3,0,3665,14403, 0,1,-2,0,-2689,-7003, 2,0,-1,2,-2602,0, 2,-1,-2,0,2390,10056,
  1,0,1,0,-2348,6322, 2,-2,0,0,2236,-9884, 0,1,2,0,-2120,5751, 0,2,0,0,-2069,0, 2,-2,-1,0,2048,-4950,
  2,0,1,-2,-1773,4130, 2,0,0,2,-1595,0, 4,-1,-1,0,1215,-3958, 0,0,2,2,-1110,0, 3,0,-1,0,-892,3258,
  2,1,1,0,-810,2616, 4,-1,-2,0,759,-1897, 0,2,-1,0,-713,-2117, 2,2,-1,0,-700,2354, 2,1,-2,0,691,0,
  2,-1,0,-2,596,0, 4,0,1,0,549,-1423, 0,0,4,0,537,-1117, 4,-1,0,0,520,-1571, 1,0,-2,0,-487,-1739,
  2,1,0,-2,-399,0, 0,0,2,-2,-381,-4421, 1,1,1,0,351,0, 3,0,-2,0,-340,0, 4,0,-3,0,330,0,
  2,-1,2,0,327,0, 0,2,1,0,-323,1165, 1,1,-1,0,299,0, 2,0,3,0,294,0, 2,0,-1,-2,0,8752,
];
// rows of D, M, M′, F, Σb (1e-6°)
const MB = [
  0,0,0,1,5128122, 0,0,1,1,280602, 0,0,1,-1,277693, 2,0,0,-1,173237, 2,0,-1,1,55413, 2,0,-1,-1,46271, 2,0,0,1,32573,
  0,0,2,1,17198, 2,0,1,-1,9266, 0,0,2,-1,8822, 2,-1,0,-1,8216, 2,0,-2,-1,4324, 2,0,1,1,4200, 2,1,0,-1,-3359,
  2,-1,-1,1,2463, 2,-1,0,1,2211, 2,-1,-1,-1,2065, 0,1,-1,-1,-1870, 4,0,-1,-1,1828, 0,1,0,1,-1794, 0,0,0,3,-1749,
  0,1,-1,1,-1565, 1,0,0,1,-1491, 0,1,1,1,-1475, 0,1,1,-1,-1410, 0,1,0,-1,-1344, 1,0,0,-1,-1335, 0,0,3,1,1107,
  4,0,0,-1,1021, 4,0,-1,1,833, 0,0,1,-3,777, 4,0,-2,1,671, 2,0,0,-3,607, 2,0,2,-1,596, 2,-1,1,-1,491,
  2,0,-2,1,-451, 0,0,3,-1,439, 2,0,2,1,422, 2,0,-3,-1,421, 2,1,-1,1,-366, 2,1,0,1,-351, 4,0,0,1,331,
  2,-1,1,1,315, 2,-2,0,-1,302, 0,0,1,3,-283, 2,1,1,-1,-229, 1,1,0,-1,223, 1,1,0,1,223, 0,1,-2,-1,-220,
  2,1,-1,-1,-220, 1,0,1,1,-185, 2,-1,-2,-1,181, 0,1,2,1,-177, 4,0,-2,-1,176, 4,-1,-1,-1,166, 1,0,1,-1,-164,
  4,0,1,-1,132, 1,0,-1,-1,-119, 4,-1,0,-1,115, 2,-2,0,1,107,
];
const DELTA_T_S = 69.2;                     // TT − UT (seconds) for the 2020s; the moon moves ~0.01° in that time
function moonPrecise(ms) {
  const T = (julian(ms + DELTA_T_S * 1000) - 2451545) / 36525, T2 = T * T, T3 = T2 * T, T4 = T3 * T;
  const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T2 + T3 / 538841 - T4 / 65194000;
  const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T2 + T3 / 545868 - T4 / 113065000;
  const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T2 + T3 / 24490000;
  const Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T2 + T3 / 69699 - T4 / 14712000;
  const F = 93.2720950 + 483202.0175233 * T - 0.0036539 * T2 - T3 / 3526000 + T4 / 863310000;
  const A1 = 119.75 + 131.849 * T, A2 = 53.09 + 479264.29 * T, A3 = 313.45 + 481266.484 * T;
  const E = 1 - 0.002516 * T - 0.0000074 * T2;
  let sl = 0, sr = 0, sb = 0;
  for (let i = 0; i < ML.length; i += 6) {
    const a = (ML[i] * D + ML[i + 1] * M + ML[i + 2] * Mp + ML[i + 3] * F) * RAD, e = ML[i + 1] ? E ** Math.abs(ML[i + 1]) : 1;
    sl += ML[i + 4] * e * Math.sin(a); sr += ML[i + 5] * e * Math.cos(a);
  }
  for (let i = 0; i < MB.length; i += 5) {
    const a = (MB[i] * D + MB[i + 1] * M + MB[i + 2] * Mp + MB[i + 3] * F) * RAD, e = MB[i + 1] ? E ** Math.abs(MB[i + 1]) : 1;
    sb += MB[i + 4] * e * Math.sin(a);
  }
  sl += 3958 * Math.sin(A1 * RAD) + 1962 * Math.sin((Lp - F) * RAD) + 318 * Math.sin(A2 * RAD);
  sb += -2235 * Math.sin(Lp * RAD) + 382 * Math.sin(A3 * RAD) + 175 * Math.sin((A1 - F) * RAD) + 175 * Math.sin((A1 + F) * RAD) + 127 * Math.sin((Lp - Mp) * RAD) - 115 * Math.sin((Lp + Mp) * RAD);
  // apparent: nutation in longitude and the true obliquity (as the sun's NOAA position above)
  const omega = 125.04452 - 1934.136261 * T;
  const lon = Lp + sl / 1e6 - 0.00478 * Math.sin(omega * RAD), lat = sb / 1e6, dist = 385000.56 + sr / 1000;
  const e = (23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60 + 0.00256 * Math.cos(omega * RAD)) * RAD;
  const l = lon * RAD, b = lat * RAD;
  const ra = Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l));
  const dec = Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l));
  return { ra, dec, dist };
}
/** PURE: the moon's topocentric elevation / azimuth (degrees) and its distance (km) from a place on the ground. */
export function moonTopo(ms, latDeg, lonDeg) {
  const m = moonPrecise(ms);
  const d = julian(ms) - 2451545, T = d / 36525;
  const gmst = 280.46061837 + 360.98564736629 * d + 0.000387933 * T * T;
  const lst = (gmst + lonDeg) * RAD;
  const H = lst - m.ra, phi = latDeg * RAD;
  // the observer on the ellipsoid (geocentric ρ·sinφ′, ρ·cosφ′), then the parallax in right ascension and declination
  const u = Math.atan(0.99664719 * Math.tan(phi)), rs = 0.99664719 * Math.sin(u), rc = Math.cos(u);
  const sp = 6378.14 / m.dist;
  const dRa = Math.atan2(-rc * sp * Math.sin(H), Math.cos(m.dec) - rc * sp * Math.cos(H));
  const Ht = H - dRa;
  const decT = Math.atan2((Math.sin(m.dec) - rs * sp) * Math.cos(dRa), Math.cos(m.dec) - rc * sp * Math.cos(H));
  const el = Math.asin(Math.sin(phi) * Math.sin(decT) + Math.cos(phi) * Math.cos(decT) * Math.cos(Ht)) / RAD;
  const az = (Math.atan2(Math.sin(Ht), Math.cos(Ht) * Math.sin(phi) - Math.tan(decT) * Math.cos(phi)) / RAD + 180) % 360;
  // the distance from the observer (for the moon's apparent size)
  const dObs = Math.sqrt(m.dist ** 2 + 6378.14 ** 2 - 2 * m.dist * 6378.14 * (Math.cos(m.dec) * rc * Math.cos(H) + Math.sin(m.dec) * rs));
  return { el, az, dist: dObs };
}
/** PURE: a solar eclipse as seen from a place right now, or null. Returns { mag (fraction of the sun's diameter covered),
 *  obsc (fraction of its area), total, annular, dx, dy (the moon's centre from the sun's, in sun radii: +x toward a higher
 *  azimuth, +y up), k (moon radius / sun radius) }. */
export function solarEclipse(ms, lat, lon) {
  const s = sunPosition(ms, lat, lon);
  if (s.el < -2) return null;
  const m = moonTopo(ms, lat, lon);
  const a1 = s.el * RAD, a2 = m.el * RAD, dz = (m.az - s.az) * RAD;
  const sep = Math.acos(Math.max(-1, Math.min(1, Math.sin(a1) * Math.sin(a2) + Math.cos(a1) * Math.cos(a2) * Math.cos(dz)))) / RAD;
  // the sun's apparent radius changes ~3% over the year (the earth's distance: nearest in January)
  const Ms = (357.52911 + 35999.05029 * ((julian(ms) - 2451545) / 36525)) * RAD;
  const rs = 0.26664 / (1.00014 - 0.01671 * Math.cos(Ms) - 0.00014 * Math.cos(2 * Ms)), rm = Math.asin(1737.4 / m.dist) / RAD;
  if (sep >= rs + rm) return null;
  const k = rm / rs, sr = sep / rs;
  // the covered fraction of the area: the lens where two circles overlap
  let obsc;
  if (sr <= k - 1) obsc = 1;
  else if (sr <= 1 - k) obsc = k * k;
  else {
    const r1 = 1, r2 = k, dd = sr;
    const p1 = Math.acos(Math.max(-1, Math.min(1, (dd * dd + r1 * r1 - r2 * r2) / (2 * dd * r1)))), p2 = Math.acos(Math.max(-1, Math.min(1, (dd * dd + r2 * r2 - r1 * r1) / (2 * dd * r2))));
    obsc = (r1 * r1 * p1 + r2 * r2 * p2 - 0.5 * Math.sqrt(Math.max(0, (-dd + r1 + r2) * (dd + r1 - r2) * (dd - r1 + r2) * (dd + r1 + r2)))) / Math.PI;
  }
  let dzd = ((m.az - s.az) + 540) % 360 - 180;
  return { mag: Math.min(1, (rs + rm - sep) / (2 * rs)), obsc: Math.min(1, obsc), total: sr <= k - 1, annular: k < 1 && sr <= 1 - k, dx: (dzd * Math.cos(a1)) / rs, dy: (m.el - s.el) / rs, k };
}

// ---------------------------------------------------------------- the moon (low precision: phase, position)
const SYNODIC = 29.530588853;
const NEW_MOON_JD = 2451550.1;   // 2000-01-06 18:14 UTC
export function moonPhase(ms) {
  // the mean age, corrected by the main periodic terms (good to a few hours)
  const jd = julian(ms);
  const d = jd - 2451545;
  const Ms = (357.529 + 0.98560028 * d) * RAD, Mm = (134.963 + 13.064993 * d) * RAD, D = (297.85 + 12.190749 * d) * RAD;
  // elongation of the moon from the sun (deg), the phase angle from it
  const elong = D / RAD + 6.289 * Math.sin(Mm) - 2.1 * Math.sin(Ms) + 1.274 * Math.sin(2 * D - Mm) + 0.658 * Math.sin(2 * D) + 0.214 * Math.sin(2 * Mm) - 0.11 * Math.sin(D);
  const phase = (((elong % 360) + 360) % 360) / 360;           // 0 new, 0.5 full
  const illum = (1 - Math.cos(phase * 2 * Math.PI)) / 2;
  void NEW_MOON_JD; void SYNODIC;
  return { phase, illum, waxing: phase < 0.5 };
}
/** How far the moon is through tonight's pass, 0 at moonrise → 1 at moonset (null when it's down). Found by stepping back to
 *  the rise and forward to the set (20-min steps + bisection); cached for two minutes (look() runs every few seconds). */
const arcCache = new Map();
export function moonArc(ms, lat, lon) {
  const key = `${Math.floor(ms / 120000)}|${lat.toFixed(2)}|${lon.toFixed(2)}`;
  if (arcCache.has(key)) return arcCache.get(key);
  const TH = -0.3, STEP = 20 * 60000, MAX = 30 * 3600000;
  const el = t => moonPosition(t, lat, lon).el;
  let u = null;
  if (el(ms) > TH) {
    const cross = (a, b) => { for (let i = 0; i < 18; i++) { const m = (a + b) / 2; if ((el(m) > TH) === (el(b) > TH)) b = m; else a = m; } return (a + b) / 2; };
    let a = ms; while (el(a - STEP) > TH && ms - a < MAX) a -= STEP;
    let b = ms; while (el(b + STEP) > TH && b - ms < MAX) b += STEP;
    const rise = cross(a - STEP, a), set = cross(b + STEP, b);
    u = Math.max(0, Math.min(1, (ms - rise) / Math.max(1, set - rise)));
  }
  if (arcCache.size > 200) arcCache.clear();
  arcCache.set(key, u);
  return u;
}

export function moonPosition(ms, lat, lon) {
  const d = julian(ms) - 2451545;
  const L = (218.316 + 13.176396 * d) * RAD, M = (134.963 + 13.064993 * d) * RAD, F = (93.272 + 13.22935 * d) * RAD;
  const lng = L + 6.289 * RAD * Math.sin(M), bet = 5.128 * RAD * Math.sin(F);
  const e = 23.4397 * RAD;
  const ra = Math.atan2(Math.sin(lng) * Math.cos(e) - Math.tan(bet) * Math.sin(e), Math.cos(lng));
  const dec = Math.asin(Math.sin(bet) * Math.cos(e) + Math.cos(bet) * Math.sin(e) * Math.sin(lng));
  const sid = (280.16 + 360.9856235 * d) * RAD + lon * RAD;
  const H = sid - ra, phi = lat * RAD;
  const el = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H)) / RAD;
  const az = (Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi)) / RAD + 180) % 360;
  return { el, az };
}

// ---------------------------------------------------------------- the calendar: seasons, holidays, showers
const dayNum = (y, m, d) => Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
/** Western Easter (Anonymous Gregorian algorithm). */
export function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return { m: month, d: day };
}
/** US Thanksgiving: the fourth Thursday of November. */
export function thanksgiving(y) {
  const first = new Date(Date.UTC(y, 10, 1)).getUTCDay();
  return { m: 11, d: 1 + ((4 - first + 7) % 7) + 21 };
}
/** The holiday for a local date: { id, full, k } (k: 0..1 how strongly it shows) — full days win over build-ups. */
export function holidayOf(y, m, d) {
  const n = dayNum(y, m, d);
  const at = (mm, dd, yy = y) => dayNum(yy, mm, dd);
  const list = [];
  const span = (id, center, before, after, build = 0, buildK = [0.3, 0.75]) => {
    if (n >= center - before && n <= center + after) list.push({ id, full: true, k: 1 });
    else if (build && n >= center - before - build && n < center - before) { const t = (n - (center - before - build)) / Math.max(1, build - 1); list.push({ id, full: false, k: buildK[0] + (buildK[1] - buildK[0]) * clamp01(t) }); }
  };
  span('halloween', at(10, 31), 1, 1, 7);
  const tg = thanksgiving(y); span('thanksgiving', at(tg.m, tg.d), 1, 1, 7);
  span('christmas', at(12, 25), 1, 1, 23, [0.08, 0.9]);           // the whole of December builds up
  if ((m === 12 && d === 31) || (m === 1 && d === 1)) list.push({ id: 'nye', full: true, k: 1 });
  span('valentine', at(2, 14), 1, 1, 3);
  span('stpatrick', at(3, 17), 1, 1, 0);
  const es = easter(y); span('easter', at(es.m, es.d), 1, 1, 3);
  span('july4', at(7, 4), 1, 1, 0);
  if (!list.length) return null;
  list.sort((a, b) => (b.full - a.full) || (b.k - a.k));
  return list[0];
}
/** Seasons by day of year (Northern Hemisphere; the south shifts half a year), blending over ~4 weeks at the edges. */
export function seasonOf(doy, south) {
  const centers = { winter: 15, spring: 105, summer: 196, autumn: 288 };
  const w = {};
  let sum = 0;
  for (const [k, c] of Object.entries(centers)) {
    const cc = south ? (c + 182) % 365 : c;
    let dd = Math.abs(doy - cc); dd = Math.min(dd, 365 - dd);
    w[k] = 1 - smooth(32, 60, dd);
    sum += w[k];
  }
  for (const k of Object.keys(w)) w[k] = sum ? w[k] / sum : 0;
  return w;
}
// meteor showers: peak (month, day)
export const SHOWERS = [
  { id: 'quadrantids', name: 'QUADRANTIDS', m: 1, d: 3 }, { id: 'lyrids', name: 'LYRIDS', m: 4, d: 22 }, { id: 'etaaquariids', name: 'ETA AQUARIIDS', m: 5, d: 6 },
  { id: 'perseids', name: 'PERSEIDS', m: 8, d: 12 }, { id: 'orionids', name: 'ORIONIDS', m: 10, d: 21 }, { id: 'leonids', name: 'LEONIDS', m: 11, d: 17 },
  { id: 'geminids', name: 'GEMINIDS', m: 12, d: 14 },
];
/** Shooting stars per minute on a clear night: a rare one on any night, many on a shower's peak (±1 day). The night of
 *  a date runs into the small hours of the next one, so the evening's date is used before 6 am. */
export function meteorsOf(y, m, d) {
  const n = dayNum(y, m, d);
  for (const s of SHOWERS) {
    const dd = Math.abs(n - dayNum(y, s.m, s.d));
    if (dd === 0) return { rate: 3.2, shower: s };
    if (dd === 1) return { rate: 1.1, shower: s };
  }
  return { rate: 0.1, shower: null };
}
/** An aurora night: any time of year, about 1 night in 5, the same night for everyone (seeded by the date). */
export function auroraNight(y, m, d, south) {
  void south;
  return hash(`aurora:${y}-${m}-${d}`) % 5 === 0;
}

// ---------------------------------------------------------------- the planets (Venus, Mars, Jupiter, Saturn)
// JPL's approximate Keplerian elements (Standish, J2000, valid 1800–2050): a (AU), e, I, L, long. perihelion, long. node (°)
// and their rates per century. Good to a fraction of a degree — far finer than a phone screen needs.
const ELEMENTS = {
  earth:   [[1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0], [0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0]],
  venus:   [[0.72333566, 0.00677672, 3.39467605, 181.97909950, 131.60246718, 76.67984255], [0.00000390, -0.00004107, -0.00078890, 58517.81538729, 0.00268329, -0.27769418]],
  mars:    [[1.52371034, 0.09339410, 1.84969142, -4.55343205, -23.94362959, 49.55953891], [0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343]],
  jupiter: [[5.20288700, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909], [-0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106]],
  saturn:  [[9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448], [-0.00125060, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794]],
};
function helio(name, T) {
  const [e0, r] = ELEMENTS[name];
  const [a, e, I, L, wp, O] = e0.map((v, i) => v + r[i] * T);
  const M = ((L - wp) % 360 + 540) % 360 - 180, w = wp - O;
  let E = M * RAD + e * Math.sin(M * RAD);
  for (let k = 0; k < 6; k++) E -= (E - e * Math.sin(E) - M * RAD) / (1 - e * Math.cos(E));
  const xp = a * (Math.cos(E) - e), yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const cw = Math.cos(w * RAD), sw = Math.sin(w * RAD), cO = Math.cos(O * RAD), sO = Math.sin(O * RAD), cI = Math.cos(I * RAD), sI = Math.sin(I * RAD);
  return [
    (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp,
    (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp,
    (sw * sI) * xp + (cw * sI) * yp,
  ];
}
/** PURE: the planets' geocentric RA / Dec (degrees), distance (AU) and a typical magnitude, at an instant. */
export function planetsAt(ms) {
  const T = (ms / 86400000 + 2440587.5 - 2451545) / 36525;
  const ea = helio('earth', T), eps = 23.43928 * RAD;
  const MAG = { venus: -4.2, mars: 0.6, jupiter: -2.3, saturn: 0.7 };
  return Object.keys(MAG).map(name => {
    const p = helio(name, T);
    const x = p[0] - ea[0], y = p[1] - ea[1], z = p[2] - ea[2];
    const ye = y * Math.cos(eps) - z * Math.sin(eps), ze = y * Math.sin(eps) + z * Math.cos(eps);
    const ra = ((Math.atan2(ye, x) / RAD) + 360) % 360, dec = Math.atan2(ze, Math.hypot(x, ye)) / RAD;
    const dist = Math.hypot(x, y, z);
    // Mars swings from bright to faint with its distance; the others barely change on a screen
    const mag = name === 'mars' ? Math.max(-2.6, Math.min(1.8, -1.5 + 5 * Math.log10(dist / 0.52) * 0.62)) : MAG[name];
    return { name, ra, dec, dist, mag };
  });
}

// ---------------------------------------------------------------- lunar eclipses
// Total and deep partial eclipses of the moon (NASA's five-millennium catalog: greatest eclipse in UTC, umbral magnitude).
// The shadow takes ~1¾ hours to cross for a total, a little less for a partial; it is only drawn while the moon is up.
export const ECLIPSES = [
  ['2026-03-03T11:34Z', 1.15], ['2026-08-28T04:13Z', 0.93], ['2028-07-06T18:20Z', 0.39], ['2028-12-31T16:52Z', 1.25],
  ['2029-06-26T03:22Z', 1.84], ['2029-12-20T22:42Z', 1.12], ['2030-06-15T18:33Z', 0.5], ['2032-04-25T15:14Z', 1.19],
  ['2032-10-18T19:03Z', 1.1], ['2033-04-14T19:13Z', 1.09], ['2033-10-08T10:55Z', 1.35], ['2036-02-11T22:12Z', 1.3],
  ['2036-08-07T02:52Z', 1.45], ['2037-01-31T14:01Z', 1.21], ['2037-07-27T04:09Z', 0.81],
].map(([at, mag]) => ({ at: Date.parse(at), mag }));
/** PURE: the eclipse under way at an instant: { p (−1 entering … 0 greatest … 1 leaving), mag, total } or null. */
export function eclipseAt(ms) {
  for (const e of ECLIPSES) {
    const half = (e.mag >= 1 ? 108 : 70 + 40 * e.mag) * 60000;      // the umbral phase, either side of greatest
    const d = ms - e.at;
    if (Math.abs(d) <= half) {
      const totalHalf = e.mag >= 1 ? (28 + 30 * Math.min(1, (e.mag - 1) / 0.8)) * 60000 : 0;
      return { p: d / half, mag: e.mag, total: totalHalf > 0 && Math.abs(d) <= totalHalf };
    }
  }
  return null;
}

// ---------------------------------------------------------------- the look
export function look(ms, tz, { alwaysNight = false, wx = null } = {}) {
  const lp = localParts(ms, tz);
  // LIVE WEATHER (core/weather.js): the visitor's real area when /api/sky knew it — the sun, moon and stars from there too
  // (SP4: `keep` — the panel moved the clock; the answer is the real weather here, fresh by the REAL clock (scene.js#wxNow), kept)
  const live = isFresh(wx, ms) || (wx && (wx.forced || wx.keep)) ? wx : null;
  const place = placeOf(tz, lp.off);
  const lat = live && live.lat != null ? live.lat : place.lat, lon = live && live.lon != null ? live.lon : place.lon;
  const south = lat < 0;
  const sun = sunPosition(ms, lat, lon);
  const moonP = moonPosition(ms, lat, lon);
  const mph = moonPhase(ms);
  const hour = lp.h + lp.mi / 60;
  const morning = hour < 12.5;
  const e = sun.el;
  // time of day from the sun's elevation (dawn mornings, golden hour evenings)
  let night, dawn = 0, day, golden = 0;
  if (morning) { night = 1 - smooth(-16, -5, e); day = smooth(1, 11, e); dawn = Math.max(0, 1 - night - day); }
  else { night = 1 - smooth(-14, -4, e); day = smooth(5, 15, e); golden = Math.max(0, 1 - night - day); }
  // late night: the small hours (fewer windows, a deeper sky)
  // the city winds down: windows start going out around 10 pm, fewer by midnight, sparse by 2 am, until dawn
  // (PARTY NIGHTS: Fri / Sat the city stays fully lit until 2 am, then winds down over the following hour — core/party.js)
  const pk = partyLateK(lp);
  // (THE STREET, Oct 21: before dawn only a few kitchens light up again — the small hours' sparseness eases a little from 4:30,
  // and the dawn takes over from there; it used to snap back to every window lit at 5 am)
  const kitchens = h => 1 - 0.3 * smooth(4.5, 6, h);
  const lateK = pk != null ? pk * (hour < 9 && hour >= 2 ? kitchens(hour) : 1) : hour >= 21.5 ? smooth(21.5, 26, hour) : hour < 9 ? smooth(21.5, 26, hour + 24) * kitchens(hour) : 0;
  let late = night * lateK;
  night -= late;
  if (alwaysNight) { night = 1; late = 0; dawn = 0; day = 0; golden = 0; }
  const w = { night, late, dawn, day, golden };
  const season = seasonOf(lp.doy, south);
  const hol = holidayOf(lp.y, lp.m, lp.d);
  // the evening's date carries a night into the small hours (showers, aurora, rain blocks)
  const ev = lp.h < 6 ? localParts(ms - 6 * 3_600_000, tz) : lp;
  const winter = season.winter;
  const xmas = hol && hol.id === 'christmas' && hol.full ? 0.8 : 0;   // a little Christmas magic, unless it's really raining
  let rain, snow, storm, fog, cloud, wind, windDir, cover, veil = 0;
  if (live) {
    rain = live.rain || 0; storm = live.storm ? 1 : 0; fog = live.fog || 0;
    // FP3a (FREV B2): `cloud` is the cover that SHUTS the sky (low + mid — every consumer's "how overcast"), `cover` the total,
    // `veil` a thin high sheet over an open sky (the sun kept); an older answer without them: from its layers, else the total
    cover = live.cloud || 0;
    cloud = live.opaque != null ? live.opaque : Math.max(opaqueOf(live.layers, cover), live.rain || live.snow ? 0.8 : 0);
    veil = live.veil != null ? live.veil : (live.rain || live.snow ? 0 : veilOf(live.layers, cloud));
    snow = Math.max(live.snow || 0, rain ? 0 : xmas * 0.6);
    wind = live.wind || 0; windDir = live.windDir || 0;
  } else {
    // no live weather (yet, or the lookup failed): a dry city — rain, storms, fog and snow only ever come from the real
    // weather (the old seeded "rainy evenings" are gone). A few fair-weather clouds drift by; Christmas keeps its snow.
    snow = xmas; rain = 0; storm = 0; fog = 0;
    cloud = 0.06 + (hash(`cloud:${ev.y}-${ev.m}-${ev.d}:${Math.floor(lp.h / 3)}`) % 100) / 100 * 0.3; cover = cloud;
    // (SP4 — the owner: the seeded fallback must be CALM + plausible — a light breeze, 1–3.4 m/s; it was 2–6)
    wind = 1 + (hash(`wind:${ev.y}-${ev.m}-${ev.d}`) % 25) / 10; windDir = 250;
  }
  const clear = !rain && snow < 0.6 && cloud < 0.7 && fog < 0.4;
  // a deep freeze (real cold only: −4 °C / 25 °F starts it, full by −12 °C / 10 °F): frost, icicles, rime (district/frost.js)
  const freeze = live && live.temp != null ? clamp01((-4 - live.temp) / 8) : 0;
  const dark = w.night + w.late;
  const met = meteorsOf(ev.y, ev.m, ev.d);
  const meteors = clear && dark > 0.6 ? met.rate : 0;
  const aurora = clear && dark > 0.6 && auroraNight(ev.y, ev.m, ev.d, south);
  // New Year's Eve: the last 10 minutes before the local midnight count down; the first 5 after are the finale
  let nye = null;
  if (lp.m === 12 && lp.d === 31 && lp.h === 23 && lp.mi >= 50) nye = { countdown: (60 - lp.mi) * 60 - lp.s };
  else if (lp.m === 1 && lp.d === 1 && lp.h === 0 && lp.mi < 5) nye = { finale: lp.mi * 60 + lp.s };
  const q = v => Math.round(v * 40);
  const key = [q(w.night), q(w.late), q(w.dawn), q(w.day), q(w.golden), q(season.winter), q(season.autumn), q(season.spring), q(season.summer), hol ? `${hol.id}${hol.full ? 'F' : Math.round(hol.k * 10)}` : '-', Math.round(rain * 4), Math.round(fog * 4), Math.round(cloud * 5), Math.round(veil * 4), storm, Math.round(clamp01(snow) * 4), Math.round(freeze * 4), sun.az < 180 ? 'E' : 'W'].join('|');
  return {
    local: lp, lat, lon, south, sun, alwaysNight, partyNight: inPartyWindow(lp), moon: { ...moonP, ...mph, u: moonArc(ms, lat, lon) }, w, season, holiday: hol, nye,
    eclipse: moonP.el > -1 ? eclipseAt(ms) : null,
    sunArc: sunArc(ms, tz, lat, lon), solar: sun.el > -2 ? solarEclipse(ms, lat, lon) : null,
    rain, snow: clamp01(snow), storm, fog, cloud, cover, veil, cloudLayers: live && live.layers ? live.layers : null, wind, windDir, temp: live ? live.temp : null, freeze, live: !!live, wxKind: live ? live.kind : null, clear, meteors, shower: met.shower, aurora, key,
  };
}

// ---------------------------------------------------------------- the clock (a preview switch for screenshots)
/** ?when=2026-10-31T19:30&tz=America/New_York freezes the start of the clock (it still runs from there);
 *  ?force=bats,meteor,aurora,sleigh,fireworks,searchlights,party,finale makes the rare moments happen now; ?wx=storm|rain|snow|fog|clouds|
 *  overcast|drizzle|sleet|clear (CITY 2.0: + cirrus|veil — high cloud by its height; FP3a: + mist|stratus|highovercast) sets the weather (instead of the live weather); &at=42.96,-85.67 puts the sun, moon and stars
 *  over that place instead of the time zone's city (with clear weather unless &wx= says otherwise); &rained=12 says the rain
 *  stopped 12 minutes before the clock's start (RAINBOWS: the real after-rain path, core/rainbow.js; &force=rainbow,rainbow2,
 *  moonbow,neonbow show one at once); &wind=<m/s> sets the wind (THE STREET). Normal players never pass these. */
export function skyClock(search = (typeof location !== 'undefined' ? location.search : '')) {
  const q = new URLSearchParams(search || '');
  const zone = cleanZone(q.get('tz')), tz = zone.tz;   // (NIGHT-A: never a raw &tz= into Intl)
  const when = q.get('when');
  const force = new Set((q.get('force') || '').split(',').filter(Boolean));
  const at = /^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/.exec(q.get('at') || '');
  const place = at && Math.abs(+at[1]) <= 90 && Math.abs(+at[2]) <= 180 ? { lat: +at[1], lon: +at[2] } : null;
  const rained = q.get('rained') != null && q.get('rained') !== '' && Number.isFinite(Number(q.get('rained'))) ? Number(q.get('rained')) : null;
  // &wind=12: the wind in m/s (THE STREET: the trees' sway, gusts, the falling leaves)
  const windQ = q.get('wind') != null && Number.isFinite(Number(q.get('wind'))) ? Math.max(0, Number(q.get('wind'))) : null;
  // (9a — THE WEATHER's previews by name too: &force=drizzle|rain|heavy-rain|storm|fog|mist|windy|freezing-rain (the first one named), its
  // intensity &wxk=light|medium|heavy — core/harbor-weather.js#WX_FORCE)
  const fwx = [...force].find(id => WX_FORCE[id]), wxk = WX_K[q.get('wxk')];
  const wxId = q.get('wx') || (fwx ? WX_FORCE[fwx][0] : null), wxExtra = fwx && !q.get('wx') ? WX_FORCE[fwx][1] : {};
  const wx = wxId || place || rained != null || windQ != null ? { ...forcedWeather(wxId || 'clear', wxExtra), forced: true, ...(wxk != null && wxId ? { k: wxk } : {}), ...(place || {}), ...(windQ != null ? { wind: windQ } : {}) } : null;
  let base = null;
  if (when) {
    // the wall time is in tz: find the UTC instant whose local time in tz matches
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(when);
    if (m) {
      const [y, mo, d, h = '12', mi = '00', sc = '00'] = m.slice(1);
      let guess = Date.UTC(+y, +mo - 1, +d, +h, +mi, +sc);
      for (let i = 0; i < 3; i++) guess = Date.UTC(+y, +mo - 1, +d, +h, +mi, +sc) - localParts(guess, tz).off * 60000;
      base = guess;
    }
  }
  const t0 = Date.now();
  // &speed=60: the clock runs 60× (test-only: watch an hour of dusk in a minute)
  const speed = Math.max(1, Math.min(3600, Number(q.get('speed')) || 1));
  const start = base == null ? t0 : base;
  if (wx && rained != null) wx.wetAt = start - rained * 60_000;
  return { tz, tzNote: zone.bad ? zone : null, force, wx, speed, preview: !!(when || q.get('tz') || force.size || wx || speed > 1), now: () => (base == null && speed === 1 ? Date.now() : start + (Date.now() - t0) * speed) };
}
