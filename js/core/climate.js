// CITY 2.0 — PART 9b: THE CLIMATE-AWARE FALLBACK (PURE: tests/climate.test.mjs). When the live weather fails (/api/sky down, Open-Meteo
// down, no answer, a stale one), the city is never random: it is built from the DATE + the PLACE (the live answer's lat / lon when this
// device kept one, else &at=, else the time zone's city — core/sky.js#placeOf) and simple monthly CLIMATE NORMALS — the nearest of ~45
// reference cities (a January high + low, a July high + low, how cloudy, how often it's wet, the fog season, the usual wind; every other
// day of the year eased between them) — seeded by the date so everyone at a place sees the same, drifting gently through the day.
// "Even if live weather isn't working, you're still going to be close": a cool, grey November in Michigan, a sunny one in Arizona.
//   THE DAYS: each day's high + low = the normal + a persistent anomaly (warm + cold spells last days, not hours); wet days by the
//   month's odds, a few hours long (a seeded window); SNOW only on a cold day (the high ≤ 2.5 °C) — never fresh snow on a mild day.
//   THE GROUND: the snowpack (core/harbor-snow.js) run over the last 75 synthetic days — snow on the ground only where + when the
//   climate makes it likely (a January in Minneapolis, never in Miami).

import { localParts, placeOf } from './sky.js';
import { packFromDays } from './harbor-snow.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
function hash(str) { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); } return h >>> 0; }
const u01 = s => (hash(s) % 100000) / 100000;
const gauss = s => (u01(s + 'a') + u01(s + 'b') + u01(s + 'c') + u01(s + 'd') - 2) * 1.732;   // (≈ N(0, 1))

// [id, lat, lon, Jan high, Jan low, Jul high, Jul low (°C), cloud Jan, cloud Jul (0..1), wet days Jan, wet days Jul (share of days with
//  ≥ 1 mm), the fog's peak month (0 = none), a foggy morning's odds at the peak, the usual wind (m/s)]
export const STATIONS = [
  ['grand-rapids', 42.96, -85.67, 0, -8, 28, 16, 0.82, 0.45, 0.48, 0.30, 10, 0.12, 4.6],
  ['detroit', 42.33, -83.05, 0, -7, 29, 18, 0.78, 0.45, 0.42, 0.30, 10, 0.1, 4.4],
  ['chicago', 41.88, -87.63, 0, -8, 29, 19, 0.72, 0.45, 0.36, 0.32, 11, 0.08, 4.8],
  ['minneapolis', 44.98, -93.27, -5, -15, 29, 19, 0.66, 0.45, 0.30, 0.33, 11, 0.07, 4.4],
  ['toronto', 43.65, -79.38, -1, -8, 27, 17, 0.76, 0.42, 0.42, 0.30, 10, 0.08, 4.5],
  ['montreal', 45.5, -73.57, -5, -14, 26, 16, 0.72, 0.45, 0.46, 0.36, 10, 0.06, 4.0],
  ['winnipeg', 49.9, -97.14, -11, -21, 26, 14, 0.56, 0.40, 0.30, 0.33, 0, 0, 4.8],
  ['new-york', 40.71, -74.0, 4, -3, 29, 21, 0.60, 0.45, 0.35, 0.33, 4, 0.06, 4.8],
  ['boston', 42.36, -71.06, 2, -6, 28, 19, 0.62, 0.45, 0.37, 0.30, 6, 0.1, 5.4],
  ['washington', 38.9, -77.04, 7, -2, 31, 22, 0.56, 0.45, 0.32, 0.32, 10, 0.08, 4.0],
  ['atlanta', 33.75, -84.39, 12, 2, 32, 22, 0.56, 0.45, 0.35, 0.38, 11, 0.08, 4.0],
  ['miami', 25.76, -80.19, 24, 16, 32, 25, 0.40, 0.55, 0.22, 0.52, 1, 0.04, 4.4],
  ['houston', 29.76, -95.37, 17, 7, 34, 24, 0.60, 0.45, 0.30, 0.30, 1, 0.12, 3.8],
  ['dallas', 32.78, -96.8, 13, 2, 35, 24, 0.50, 0.30, 0.23, 0.18, 1, 0.05, 4.6],
  ['denver', 39.74, -104.99, 7, -8, 31, 15, 0.45, 0.40, 0.15, 0.30, 0, 0, 4.0],
  ['salt-lake', 40.76, -111.89, 3, -7, 34, 19, 0.62, 0.25, 0.30, 0.12, 1, 0.1, 3.6],
  ['phoenix', 33.45, -112.07, 19, 7, 41, 29, 0.25, 0.18, 0.12, 0.12, 0, 0, 2.8],
  ['las-vegas', 36.17, -115.14, 14, 3, 40, 27, 0.30, 0.15, 0.10, 0.06, 0, 0, 3.6],
  ['los-angeles', 34.05, -118.24, 20, 9, 29, 18, 0.35, 0.28, 0.18, 0.0, 6, 0.25, 3.0],
  ['san-francisco', 37.77, -122.42, 14, 8, 21, 13, 0.50, 0.55, 0.35, 0.0, 7, 0.35, 5.2],
  ['seattle', 47.61, -122.33, 8, 2, 26, 14, 0.86, 0.32, 0.60, 0.12, 11, 0.18, 3.8],
  ['vancouver', 49.28, -123.12, 7, 1, 22, 13, 0.86, 0.35, 0.60, 0.15, 11, 0.18, 3.4],
  ['calgary', 51.05, -114.07, -1, -13, 23, 10, 0.56, 0.40, 0.20, 0.40, 0, 0, 4.2],
  ['anchorage', 61.22, -149.9, -4, -11, 18, 11, 0.72, 0.70, 0.30, 0.45, 9, 0.06, 3.2],
  ['honolulu', 21.31, -157.86, 27, 19, 31, 23, 0.50, 0.40, 0.30, 0.25, 0, 0, 5.0],
  ['mexico-city', 19.43, -99.13, 21, 6, 23, 12, 0.30, 0.75, 0.10, 0.70, 12, 0.06, 2.6],
  ['london', 51.5, -0.13, 8, 2, 23, 14, 0.80, 0.65, 0.50, 0.33, 12, 0.12, 4.4],
  ['paris', 48.86, 2.35, 7, 2, 25, 15, 0.80, 0.55, 0.45, 0.30, 12, 0.12, 3.8],
  ['berlin', 52.52, 13.4, 3, -2, 24, 14, 0.85, 0.55, 0.50, 0.35, 11, 0.12, 3.8],
  ['stockholm', 59.33, 18.07, 0, -4, 23, 14, 0.85, 0.50, 0.50, 0.35, 11, 0.08, 4.0],
  ['moscow', 55.75, 37.62, -6, -11, 24, 14, 0.85, 0.55, 0.55, 0.45, 11, 0.08, 3.6],
  ['madrid', 40.42, -3.7, 10, 3, 33, 19, 0.45, 0.10, 0.20, 0.06, 12, 0.08, 3.0],
  ['rome', 41.9, 12.5, 12, 3, 31, 18, 0.50, 0.15, 0.30, 0.06, 11, 0.08, 3.4],
  ['istanbul', 41.0, 28.98, 9, 3, 29, 20, 0.70, 0.20, 0.50, 0.10, 3, 0.08, 4.4],
  ['reykjavik', 64.15, -21.94, 2, -3, 14, 9, 0.80, 0.75, 0.60, 0.40, 0, 0, 6.2],
  ['tokyo', 35.68, 139.69, 10, 1, 30, 23, 0.35, 0.70, 0.15, 0.40, 6, 0.04, 3.4],
  ['beijing', 39.9, 116.4, 2, -8, 31, 22, 0.30, 0.60, 0.05, 0.45, 12, 0.12, 2.8],
  ['delhi', 28.6, 77.2, 21, 7, 35, 27, 0.20, 0.75, 0.08, 0.50, 1, 0.35, 2.4],
  ['mumbai', 19.08, 72.88, 31, 17, 30, 25, 0.10, 0.95, 0.0, 0.90, 0, 0, 3.4],
  ['singapore', 1.35, 103.82, 30, 23, 31, 25, 0.70, 0.70, 0.50, 0.45, 0, 0, 2.6],
  ['dubai', 25.2, 55.27, 24, 14, 41, 30, 0.15, 0.05, 0.10, 0.0, 1, 0.1, 3.8],
  ['cairo', 30.04, 31.24, 19, 9, 35, 22, 0.25, 0.0, 0.03, 0.0, 12, 0.05, 3.6],
  ['johannesburg', -26.2, 28.05, 26, 15, 17, 4, 0.60, 0.10, 0.50, 0.02, 0, 0, 3.4],
  ['sydney', -33.87, 151.21, 26, 19, 17, 8, 0.50, 0.35, 0.40, 0.30, 5, 0.06, 4.0],
  ['melbourne', -37.81, 144.96, 26, 14, 14, 6, 0.45, 0.65, 0.25, 0.45, 6, 0.1, 4.4],
  ['buenos-aires', -34.6, -58.38, 30, 20, 15, 8, 0.40, 0.55, 0.25, 0.25, 6, 0.1, 4.0],
  ['sao-paulo', -23.55, -46.63, 28, 19, 22, 12, 0.75, 0.40, 0.60, 0.20, 6, 0.08, 2.8],
  ['auckland', -36.85, 174.76, 24, 16, 15, 8, 0.55, 0.65, 0.35, 0.55, 0, 0, 5.0],
].map(([id, lat, lon, jHi, jLo, uHi, uLo, cJ, cU, wJ, wU, fogM, fogP, wind]) => ({ id, lat, lon, jHi, jLo, uHi, uLo, cJ, cU, wJ, wU, fogM, fogP, wind }));

const RAD = Math.PI / 180;
/** PURE: the reference city nearest a place (great-circle) */
export function nearestStation(lat, lon) {
  let best = STATIONS[0], bd = Infinity;
  for (const s of STATIONS) {
    const a = Math.sin(((s.lat - lat) * RAD) / 2) ** 2 + Math.cos(lat * RAD) * Math.cos(s.lat * RAD) * Math.sin(((s.lon - lon) * RAD) / 2) ** 2;
    if (a < bd) { bd = a; best = s; }
  }
  return best;
}

// the year's shape: the coldest day ~Jan 20 (north) — a Jan value on doy 20, the Jul value six months on; cosine between
const yearK = doy => 0.5 + 0.5 * Math.cos((2 * Math.PI * (doy - 20)) / 365.25);       // 1 = the January value, 0 = the July value
const ease = (j, u, doy) => u + (j - u) * yearK(doy);
const doyOf = (y, m, d) => Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 864e5) + 1;

/** PURE: the normals for a day of the year: { hi, lo, cloud, wet, fog, wind } */
export function normalsOf(st, doy) {
  const fogK = st.fogM ? st.fogP * Math.max(0, Math.cos((2 * Math.PI * ((doy / 30.44 + 0.5) - st.fogM)) / 12)) ** 2 : 0;
  return { hi: ease(st.jHi, st.uHi, doy), lo: ease(st.jLo, st.uLo, doy), cloud: ease(st.cJ, st.cU, doy), wet: ease(st.wJ, st.wU, doy), fog: fogK, wind: st.wind * (0.85 + 0.3 * yearK(doy) * (st.lat >= 0 ? 1 : 0) + 0.3 * (1 - yearK(doy)) * (st.lat < 0 ? 1 : 0)) };
}

// a day's key (UTC calendar math on the local date)
const dayKey = (y, m, d) => `${y}-${m}-${d}`;
const shiftDay = (y, m, d, n) => { const t = new Date(Date.UTC(y, m - 1, d) + n * 864e5); return [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()]; };

/**
 * PURE: one synthetic day at a station — { y, m, d, tmax, tmin, cloud, wet (bool), mm (precipitation), snow (cm), rain (mm), start, hours
 * (the wet window, local hours), fog (a foggy morning), wind, storm (a summer thunderstorm afternoon) } — seeded by the station + the date.
 */
export function climateDay(st, y, m, d) {
  const doy = doyOf(y, m, d), n = normalsOf(st, doy);
  // the anomaly: a weighted sum of the last five days' draws (warm + cold spells last), the spread wider in a continental winter
  const range = Math.abs(st.uHi - st.jHi), winter = st.lat >= 0 ? yearK(doy) : 1 - yearK(doy);
  const sd = (1.6 + 0.09 * range) * (0.8 + 0.45 * winter);
  const W = [0.42, 0.28, 0.16, 0.09, 0.05];
  let an = 0;
  for (let k = 0; k < W.length; k++) { const [yy, mm, dd] = shiftDay(y, m, d, -k); an += W[k] * gauss(`${st.id}:t:${dayKey(yy, mm, dd)}`); }
  an = (an / 0.55) * sd;
  const k0 = `${st.id}:${dayKey(y, m, d)}`;
  // wet: the month's odds, a little likelier after a wet day (systems last); a wet day is cloudier + its range smaller
  const prevWet = u01(`${st.id}:w:${dayKey(...shiftDay(y, m, d, -1))}`) < n.wet;
  const wet = u01(`${st.id}:w:${dayKey(y, m, d)}`) < Math.min(0.95, n.wet * (prevWet ? 1.25 : 0.9));
  const spread = (n.hi - n.lo) * (wet ? 0.7 : 1 + 0.15 * (u01(k0 + 'sp') - 0.5));
  const mid = (n.hi + n.lo) / 2 + an;
  const tmax = Math.round((mid + spread / 2) * 10) / 10, tmin = Math.round((mid - spread / 2) * 10) / 10;
  const cloud = clamp01(n.cloud + (wet ? 0.3 : -0.12) + 0.35 * (u01(k0 + 'c') - 0.5));
  const summer = 1 - winter;
  const mm = wet ? Math.round((1 + 6 * (0.5 + summer) * -Math.log(Math.max(0.02, u01(k0 + 'mm')))) * 10) / 10 : 0;
  const cold = tmax <= 2.5;
  const storm = wet && !cold && n.hi >= 26 && u01(k0 + 'st') < 0.3;
  const start = storm ? 13 + Math.floor(u01(k0 + 's0') * 6) : Math.floor(u01(k0 + 's0') * 24), hours = storm ? 2 + Math.floor(u01(k0 + 's1') * 2) : 3 + Math.floor(u01(k0 + 's1') * 9);
  const fog = !wet && u01(k0 + 'f') < n.fog;
  const wind = Math.round(n.wind * (0.55 + 0.9 * u01(k0 + 'wd')) * (wet ? 1.25 : 1) * 10) / 10;
  return { y, m, d, tmax, tmin, cloud: Math.round(cloud * 100) / 100, wet, mm, snow: cold ? mm : 0, rain: cold ? 0 : mm, start, hours, fog, wind, storm };
}

/** PURE: the n synthetic days BEFORE a date (oldest first) — the snowpack's input */
export function climateDays(st, y, m, d, n = 75) {
  const out = [];
  for (let k = n; k >= 1; k--) { const [yy, mm, dd] = shiftDay(y, m, d, -k); out.push(climateDay(st, yy, mm, dd)); }
  return out;
}

// the day's temperature curve: the low near 6 am, the high near 3 pm
function tempAt(day, next, h) {
  if (h >= 6 && h <= 15) return day.tmin + (day.tmax - day.tmin) * (0.5 - 0.5 * Math.cos((Math.PI * (h - 6)) / 9));
  if (h > 15) { const lo = next ? next.tmin : day.tmin; return lo + (day.tmax - lo) * (0.5 + 0.5 * Math.cos((Math.PI * (h - 15)) / 15)); }
  return day.tmin + 2 * (6 - h) / 6 * 0.3;    // (the small hours: near the low)
}
const inWindow = (day, h) => { const e = day.start + day.hours; return day.wet && (h >= day.start && h < e || (e > 24 && h < e - 24)); };

/** where the fallback stands: the place it was built for + how it knows it */
export function climatePlace({ lat = null, lon = null, tz = 'UTC', off = 0 } = {}) {
  if (lat != null && lon != null && Number.isFinite(+lat) && Number.isFinite(+lon)) return { lat: +lat, lon: +lon, how: 'the place' };
  const p = placeOf(tz, off);
  return { lat: p.lat, lon: p.lon, how: p.known ? `the time zone (${tz})` : `the time zone's region (${tz})` };
}

/**
 * PURE: the CLIMATE FALLBACK at an instant — core/weather.js#normalize's shape (kind, rain, snow, storm, fog, cloud, opaque, veil, wind,
 * windDir, gust, rate, temp, lat, lon, at, wetAt, layers, code (the WMO equivalent: harbor-weather's states read it), vis) + src
 * 'climate', climate { station, how, why }, pack (the snowpack from the last 75 days). The same instant + place → the same answer.
 */
export function climateWeather(ms, { lat = null, lon = null, tz = 'UTC' } = {}) {
  const lp = localParts(ms, tz);
  const pl = climatePlace({ lat, lon, tz, off: lp.off });
  const st = nearestStation(pl.lat, pl.lon);
  const day = climateDay(st, lp.y, lp.m, lp.d), next = climateDay(st, ...shiftDay(lp.y, lp.m, lp.d, 1));
  const h = lp.h + lp.mi / 60;
  const temp = Math.round(tempAt(day, next, h) * 10) / 10;
  // the cloud drifts through the day (a slow wobble in 3-hour steps, eased) — and closes in round the wet window
  const b = Math.floor(h / 3), f = h / 3 - b, wob = v => u01(`${st.id}:${dayKey(lp.y, lp.m, lp.d)}:cw${v}`) - 0.5;
  let cloud = clamp01(day.cloud + 0.3 * (wob(b) * (1 - f) + wob(b + 1) * f));
  const raining = inWindow(day, lp.h);
  const near = day.wet && !raining && (Math.abs(lp.h - day.start) <= 2 || Math.abs(lp.h - (day.start + day.hours) % 24) <= 2);
  if (raining) cloud = Math.max(cloud, 0.9); else if (near) cloud = Math.max(cloud, 0.7);
  const rate = raining ? Math.round(Math.max(0.2, day.mm / day.hours) * 10) / 10 : 0;
  const snowing = raining && temp <= 1 && day.tmax <= 3.5;          // (never fresh snow on a mild day)
  const fogNow = day.fog && lp.h >= 4 && lp.h < 10;
  let kind, code, rain = 0, snow = 0, storm = 0, fog = 0, vis = null;
  if (snowing) { kind = 'snow'; code = rate >= 2.5 ? 75 : rate >= 1 ? 73 : 71; snow = code === 75 ? 1 : code === 73 ? 0.72 : 0.45; }
  else if (raining && day.storm) { kind = 'storm'; code = 95; rain = 0.8; storm = 1; }
  else if (raining) { kind = rate < 0.5 ? 'drizzle' : 'rain'; code = rate < 0.5 ? 51 : rate >= 7.6 ? 65 : rate >= 2.5 ? 63 : 61; rain = { 51: 0.22, 61: 0.45, 63: 0.7, 65: 1 }[code]; }
  else if (fogNow) { const dense = lp.h < 8 && u01(`${st.id}:${dayKey(lp.y, lp.m, lp.d)}:fd`) < 0.5; kind = dense ? 'fog' : 'mist'; code = 45; vis = dense ? 200 : 700; fog = dense ? 1 : 0.45; }
  else { kind = cloud >= 0.75 ? 'overcast' : cloud >= 0.4 ? 'clouds' : 'clear'; code = cloud >= 0.75 ? 3 : cloud >= 0.4 ? 2 : cloud >= 0.15 ? 1 : 0; }
  const wet = !!(rain || snow);
  // when it last really rained today (the street still wet after a morning's rain): the window's end, if it ended before now
  const end = day.start + day.hours, endedH = day.wet && !raining && end <= 24 && lp.h >= end ? end : null;
  const wetAt = wet ? ms : endedH != null && !day.snow ? ms - (h - endedH) * 3600e3 : null;
  const dirW = 200 + 140 * u01(`${st.id}:${dayKey(lp.y, lp.m, lp.d)}:dir`);
  const wind = Math.round(day.wind * (0.75 + 0.45 * clamp01((h - 8) / 7) * clamp01((22 - h) / 7)) * 10) / 10;
  const pack = packFromDays(climateDays(st, lp.y, lp.m, lp.d));
  const why = `${st.id} normals · ${day.tmin}–${day.tmax} °C · ${day.wet ? `${day.snow ? 'snow' : 'wet'} ${day.start}:00 for ${day.hours} h` : 'dry'}${day.fog ? ' · a foggy morning' : ''}`;
  return {
    kind, rain, snow, storm, fog, cloud: Math.round(Math.max(cloud, wet ? 0.8 : 0) * 100) / 100, opaque: Math.round(Math.max(cloud, wet ? 0.8 : 0) * 100) / 100, veil: 0,
    wind, windDir: Math.round(dirW), gust: Math.round(wind * 1.45 * 10) / 10, rate: raining ? rate : 0, temp,
    lat: pl.lat, lon: pl.lon, city: null, at: ms, wetAt, layers: null, src: 'climate', code, vis, t: ms,
    climate: { station: st.id, how: pl.how, why, day: { tmax: day.tmax, tmin: day.tmin } }, pack,
  };
}
