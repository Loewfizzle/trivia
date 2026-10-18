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
/** A rare aurora night: winter nights, ~1 in 11, the same night for everyone (seeded by the date). */
export function auroraNight(y, m, d, south) {
  const winter = south ? m >= 5 && m <= 8 : m === 11 || m === 12 || m <= 2;
  return winter && hash(`aurora:${y}-${m}-${d}`) % 11 === 0;
}
/** Rain: some evenings are wet (seeded by the date and a 4-hour block, the same for everyone in a zone). */
export function rainOf(y, m, d, h) {
  const block = Math.floor(h / 4);
  const r = hash(`rain:${y}-${m}-${d}:${block}`) % 100;
  return r < 42 ? 1 : 0;
}

// ---------------------------------------------------------------- the look
export function look(ms, tz, { alwaysNight = false } = {}) {
  const lp = localParts(ms, tz);
  const { lat, lon } = placeOf(tz, lp.off);
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
  const lateK = hour >= 0.5 && hour < 5 ? smooth(0.5, 1.6, hour) * (1 - smooth(4, 5, hour)) : 0;
  let late = night * lateK;
  night -= late;
  if (alwaysNight) { night = 1; late = 0; dawn = 0; day = 0; golden = 0; }
  const w = { night, late, dawn, day, golden };
  const season = seasonOf(lp.doy, south);
  const hol = holidayOf(lp.y, lp.m, lp.d);
  // the evening's date carries a night into the small hours (showers, aurora, rain blocks)
  const ev = lp.h < 6 ? localParts(ms - 6 * 3_600_000, tz) : lp;
  const wet = rainOf(ev.y, ev.m, ev.d, lp.h);
  const winter = season.winter;
  const snow = clamp01((winter - 0.35) / 0.4) * (wet ? 1 : 0.45) + (hol && hol.id === 'christmas' && hol.full ? 0.8 : 0);
  const rain = wet && winter < 0.5 ? 1 : 0;
  const clear = !rain && snow < 0.6;
  const dark = w.night + w.late;
  const met = meteorsOf(ev.y, ev.m, ev.d);
  const meteors = clear && dark > 0.6 ? met.rate : 0;
  const aurora = clear && dark > 0.6 && auroraNight(ev.y, ev.m, ev.d, south);
  // New Year's Eve: the last 10 minutes before the local midnight count down; the first 5 after are the finale
  let nye = null;
  if (lp.m === 12 && lp.d === 31 && lp.h === 23 && lp.mi >= 50) nye = { countdown: (60 - lp.mi) * 60 - lp.s };
  else if (lp.m === 1 && lp.d === 1 && lp.h === 0 && lp.mi < 5) nye = { finale: lp.mi * 60 + lp.s };
  const q = v => Math.round(v * 40);
  const key = [q(w.night), q(w.late), q(w.dawn), q(w.day), q(w.golden), q(season.winter), q(season.autumn), q(season.spring), q(season.summer), hol ? `${hol.id}${hol.full ? 'F' : Math.round(hol.k * 10)}` : '-', rain].join('|');
  return {
    local: lp, lat, lon, south, sun, moon: { ...moonP, ...mph }, w, season, holiday: hol, nye,
    rain, snow: clamp01(snow), clear, meteors, shower: met.shower, aurora, key,
  };
}

// ---------------------------------------------------------------- the clock (a preview switch for screenshots)
/** ?when=2026-10-31T19:30&tz=America/New_York freezes the start of the clock (it still runs from there);
 *  ?force=bats,meteor,aurora,sleigh,fireworks makes the rare moments happen now. Normal players never pass these. */
export function skyClock(search = (typeof location !== 'undefined' ? location.search : '')) {
  const q = new URLSearchParams(search || '');
  const tz = q.get('tz') || deviceZone();
  const when = q.get('when');
  const force = new Set((q.get('force') || '').split(',').filter(Boolean));
  let base = null;
  if (when) {
    // the wall time is in tz: find the UTC instant whose local time in tz matches
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(when);
    if (m) {
      const [y, mo, d, h = '12', mi = '00'] = m.slice(1);
      let guess = Date.UTC(+y, +mo - 1, +d, +h, +mi);
      for (let i = 0; i < 3; i++) guess = Date.UTC(+y, +mo - 1, +d, +h, +mi) - localParts(guess, tz).off * 60000;
      base = guess;
    }
  }
  const t0 = Date.now();
  return { tz, force, preview: !!(when || q.get('tz') || force.size), now: () => (base == null ? Date.now() : base + (Date.now() - t0)) };
}
