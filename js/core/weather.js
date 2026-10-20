// LIVE WEATHER, PURE (server + client): Open-Meteo's current conditions → the few numbers the city draws with.
//   { kind, rain 0..1, snow 0..1, storm, fog 0..1, cloud 0..1, wind m/s, windDir °, temp °C, lat, lon, city, at,
//     wetAt (ms: the last real rain in the past two hours — still raining = at; null = dry) }
// kind: clear · clouds · overcast · fog · drizzle · rain · storm · snow · sleet. /api/sky fetches it for the visitor's area
// (Vercel's IP location, rounded); core/sky.js#look draws with it; without it the city keeps its seeded weather.

/** WMO weather interpretation codes (Open-Meteo `weather_code`) → kind + intensities. */
export function fromWmo(code) {
  const c = Number(code);
  if (c === 0) return { kind: 'clear', cloud: 0.05 };
  if (c === 1) return { kind: 'clear', cloud: 0.2 };
  if (c === 2) return { kind: 'clouds', cloud: 0.5 };
  if (c === 3) return { kind: 'overcast', cloud: 0.95 };
  if (c === 45 || c === 48) return { kind: 'fog', cloud: 0.9, fog: c === 48 ? 1 : 0.8 };
  if (c === 51 || c === 53 || c === 55) return { kind: 'drizzle', cloud: 0.9, rain: { 51: 0.22, 53: 0.32, 55: 0.42 }[c] };
  if (c === 56 || c === 57) return { kind: 'sleet', cloud: 0.95, rain: 0.3, snow: 0.2 };
  if (c === 61 || c === 63 || c === 65) return { kind: 'rain', cloud: 0.95, rain: { 61: 0.45, 63: 0.7, 65: 1 }[c] };
  if (c === 66 || c === 67) return { kind: 'sleet', cloud: 0.95, rain: c === 67 ? 0.7 : 0.45, snow: 0.25 };
  if (c === 71 || c === 73 || c === 75) return { kind: 'snow', cloud: 0.95, snow: { 71: 0.45, 73: 0.72, 75: 1 }[c] };
  if (c === 77) return { kind: 'snow', cloud: 0.9, snow: 0.3 };
  if (c === 80 || c === 81 || c === 82) return { kind: 'rain', cloud: 0.85, rain: { 80: 0.5, 81: 0.75, 82: 1 }[c] };
  if (c === 85 || c === 86) return { kind: 'snow', cloud: 0.9, snow: c === 86 ? 0.95 : 0.6 };
  if (c === 95) return { kind: 'storm', cloud: 1, rain: 0.8, storm: 1 };
  if (c === 96 || c === 99) return { kind: 'storm', cloud: 1, rain: 1, storm: 1 };
  return { kind: 'clouds', cloud: 0.5 };
}

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

const WET_KINDS = new Set(['drizzle', 'rain', 'storm', 'sleet']);
/** PURE: when it last really rained (ms), from Open-Meteo's past 15-minute precipitation ({ time: [unix s], precipitation:
 *  [mm per 15 min, the sum of the 15 minutes BEFORE the time] }): the end of the last wet quarter hour up to now (≥ 0.1 mm —
 *  a trace that doesn't wet the street is not rain). Null when the past two hours were dry or the data is missing. */
export function wetAtOf(m15, nowMs = Date.now()) {
  if (!m15 || !Array.isArray(m15.time) || !Array.isArray(m15.precipitation)) return null;
  let wet = null;
  for (let i = 0; i < m15.time.length; i++) {
    const t = Number(m15.time[i]) * 1000, p = Number(m15.precipitation[i]);
    if (!Number.isFinite(t) || t > nowMs + 60_000) continue;          // never a forecast: only quarter hours that have passed
    if (Number.isFinite(p) && p >= 0.1 && (wet == null || t > wet)) wet = t;
  }
  return wet;
}

/** PURE: Open-Meteo's `current` block (+ where; + its past 15-minute precipitation) → the city's weather. */
export function normalize(cur, where = {}, at = Date.now(), m15 = null) {
  const w = fromWmo(cur && cur.weather_code);
  const cloud = cur && cur.cloud_cover != null ? clamp01(num(cur.cloud_cover) / 100) : w.cloud;
  // fog from visibility too (Open-Meteo reports metres): under 1 km is fog whatever the code says
  const vis = cur && cur.visibility != null ? num(cur.visibility, 20000) : 20000;
  const fog = Math.max(w.fog || 0, clamp01((1500 - vis) / 1200));
  return {
    kind: fog > 0.6 && w.kind !== 'storm' && !w.rain && !w.snow ? 'fog' : w.kind,
    rain: clamp01(w.rain || 0), snow: clamp01(w.snow || 0), storm: w.storm ? 1 : 0, fog: Math.round(fog * 100) / 100,
    cloud: Math.round(Math.max(cloud, w.rain || w.snow ? 0.8 : 0) * 100) / 100,
    wind: Math.round(num(cur && cur.wind_speed_10m) * 10) / 10, windDir: Math.round(num(cur && cur.wind_direction_10m)),
    temp: Math.round(num(cur && cur.temperature_2m, 15) * 10) / 10,
    lat: where.lat ?? null, lon: where.lon ?? null, city: where.city || null, at,
    // RAINBOWS (core/rainbow.js): when it last rained — raining now counts as now
    wetAt: WET_KINDS.has(w.kind) ? at : wetAtOf(m15, at),
  };
}

/** A made-up weather for previews (?wx=storm …) and tests. */
export function forcedWeather(kind, extra = {}) {
  const base = {
    clear: { kind: 'clear', cloud: 0.1 }, clouds: { kind: 'clouds', cloud: 0.55 }, overcast: { kind: 'overcast', cloud: 0.95 },
    fog: { kind: 'fog', cloud: 0.9, fog: 0.9 }, drizzle: { kind: 'drizzle', cloud: 0.9, rain: 0.3 }, rain: { kind: 'rain', cloud: 0.95, rain: 0.75 },
    storm: { kind: 'storm', cloud: 1, rain: 0.95, storm: 1 }, freeze: { kind: 'clear', cloud: 0.15, temp: -16 }, snow: { kind: 'snow', cloud: 0.95, snow: 0.8 }, sleet: { kind: 'sleet', cloud: 0.95, rain: 0.4, snow: 0.25 },
  }[kind] || { kind: 'clear', cloud: 0.1 };
  return { rain: 0, snow: 0, storm: 0, fog: 0, wind: kind === 'storm' ? 9 : 3, windDir: 250, temp: kind === 'snow' ? -2 : kind === 'freeze' ? -16 : 12, lat: null, lon: null, city: null, at: Date.now(), ...base, ...extra };
}

/** Real weather is used for 75 minutes after it was fetched (then the seeded weather until the next answer). */
export const WEATHER_TTL_MS = 75 * 60_000;
export const isFresh = (wx, now = Date.now()) => !!(wx && wx.kind && wx.at && now - wx.at < WEATHER_TTL_MS && now >= wx.at - 60_000);

/** The area a visitor is in, rounded (~0.5° ≈ 35 miles): the cache key, and all the server ever keeps of where they are. */
export function areaOf(lat, lon) {
  if (lat == null || lon == null || lat === '' || lon === '') return null;      // missing is unknown, never 0°, 0°
  const la = Number(lat), lo = Number(lon);
  if (!Number.isFinite(la) || !Number.isFinite(lo) || Math.abs(la) > 90 || Math.abs(lo) > 180) return null;
  const r = v => Math.round(v * 2) / 2;
  return { lat: r(la), lon: r(lo), key: `a${r(la).toFixed(1)}_${r(lo).toFixed(1)}`.replace(/\./g, 'p').replace(/-/g, 'm') };
}
