// LIVE WEATHER, PURE (server + client): Open-Meteo's current conditions → the few numbers the city draws with.
//   { kind, rain 0..1, snow 0..1, storm, fog 0..1, cloud 0..1 (TOTAL cover), opaque 0..1 (what shuts the sky: low + mid),
//     veil 0..1 (thin high cover over a sky that's otherwise open), wind m/s, windDir °, temp °C, lat, lon, city, at,
//     wetAt (ms: the last real rain in the past two hours — still raining = at; null = dry),
//     src, code (WMO), vis (m), t (the model's slot, ms) — FP3a: the provenance the &debug=1 readout shows }
// kind: clear · clouds · veil · overcast · mist · fog · drizzle · rain · storm · snow · sleet.
// FP3a (FREV B2 — the owner's iPhone showed fog at 10:19 + a grey deck at 11:19 under a thin high veil): FOG is CONSERVATIVE and
// GRADED (a dense bank only for a fog code AND under 300 m; 300 m – 1 km is MIST: the far skyline's haze + wider halos, no banks,
// no foghorn), and the CLOUD LAYERS decide the sky: only LOW / MID cover shuts it (`opaque` → the overcast deck, the grey city);
// HIGH cover over an open sky is a VEIL (a clear sky slightly whitened, the sun kept — its real look is 6b's). /api/sky fetches it for the visitor's area
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

/** PURE: the cloud cover by height ({ lo, mid, hi } 0..1, rounded) — null unless all three are in the data */
export function layersOf(cur) {
  if (!cur || cur.cloud_cover_low == null || cur.cloud_cover_mid == null || cur.cloud_cover_high == null) return null;
  const f = v => Math.round(clamp01(num(v) / 100) * 100) / 100;
  return { lo: f(cur.cloud_cover_low), mid: f(cur.cloud_cover_mid), hi: f(cur.cloud_cover_high) };
}

/** PURE (FP3a): the cover that SHUTS the sky — low + most of mid (high thin cover lets the sun through). No layers: the total. */
export const opaqueOf = (layers, total = 0) => (layers ? clamp01(Math.max(clamp01(layers.lo), 0.9 * clamp01(layers.mid))) : clamp01(total));
/** PURE (FP3a): a thin HIGH veil over an otherwise open sky (0..1) — 0 once the low / mid cover shuts it, 0 without layers */
export const veilOf = (layers, opaque = opaqueOf(layers)) => (layers ? clamp01((clamp01(layers.hi) - 0.25) / 0.5) * clamp01((0.6 - opaque) / 0.3) : 0);
/** PURE (FP3a): fog by visibility + the code — { fog 0..1, dense } — a dense bank only for a fog code AND under 300 m */
export function fogOf(code, vis) {
  const fogCode = code === 45 || code === 48;
  if (vis == null) return { fog: fogCode ? (code === 48 ? 1 : 0.8) : 0, dense: fogCode };      // (no visibility in the answer: the code alone, as before)
  if (fogCode && vis < 300) return { fog: 1, dense: true };
  if (vis < 1000) return { fog: Math.round((fogCode ? 0.3 + 0.3 * clamp01((1000 - vis) / 700) : 0.25 + 0.15 * clamp01((1000 - vis) / 700)) * 100) / 100, dense: false };
  if (fogCode && vis < 3000) return { fog: 0.2, dense: false };                                  // (a fog code, a clear view: patchy — a thin haze at most)
  return { fog: 0, dense: false };
}
const round2 = v => Math.round(v * 100) / 100;

/** PURE (9a): the rain's RATE (mm/h) — the last quarter hour that has passed (×4), else the current block's precipitation (Open-Meteo:
 *  the quarter hour before the current slot, ×4); 0 when dry or unknown */
export function rateOf(cur, m15, nowMs = Date.now()) {
  if (m15 && Array.isArray(m15.time) && Array.isArray(m15.precipitation)) {
    let best = null;
    for (let i = 0; i < m15.time.length; i++) { const t = Number(m15.time[i]) * 1000, p = Number(m15.precipitation[i]); if (Number.isFinite(t) && Number.isFinite(p) && t <= nowMs + 60_000 && (best == null || t > best[0])) best = [t, p]; }
    if (best && nowMs - best[0] < 45 * 60_000) return Math.round(Math.max(0, best[1]) * 4 * 10) / 10;
  }
  const p = cur && Number(cur.precipitation);
  return Number.isFinite(p) && p > 0 ? Math.round(p * 4 * 10) / 10 : 0;
}

/** PURE (9b): Open-Meteo's daily block (unixtime) → compact rows [[dayStartMs, high °C, low °C, snowfall cm, rain mm], …] (oldest first);
 *  null when missing — the snowpack's days (core/harbor-snow.js#daysOf) */
export function dailyRows(daily) {
  if (!daily || !Array.isArray(daily.time)) return null;
  const col = k => (Array.isArray(daily[k]) ? daily[k] : []);
  const r1 = v => (v == null || !Number.isFinite(Number(v)) ? null : Math.round(Number(v) * 10) / 10);
  const out = daily.time.map((t, i) => [Number(t) * 1000, r1(col('temperature_2m_max')[i]), r1(col('temperature_2m_min')[i]), r1(col('snowfall_sum')[i]), r1(col('rain_sum')[i])]).filter(r => Number.isFinite(r[0]));
  return out.length ? out : null;
}

/** PURE: Open-Meteo's `current` block (+ where; + its past 15-minute precipitation; + 9b: its daily block) → the city's weather. */
export function normalize(cur, where = {}, at = Date.now(), m15 = null, daily = null) {
  const code = cur && cur.weather_code != null && Number.isFinite(Number(cur.weather_code)) ? Number(cur.weather_code) : null;
  const w = fromWmo(code);
  const cloud = cur && cur.cloud_cover != null ? clamp01(num(cur.cloud_cover) / 100) : w.cloud;
  const vis = cur && cur.visibility != null && Number.isFinite(Number(cur.visibility)) ? Number(cur.visibility) : null;
  const { fog, dense } = fogOf(code, vis);
  const layers = layersOf(cur), wet = !!(w.rain || w.snow);
  const opaque = Math.max(opaqueOf(layers, cloud), wet ? 0.8 : 0), veil = wet ? 0 : veilOf(layers, opaque);
  let kind = w.kind;
  if (!wet && !w.storm) {
    if (dense) kind = 'fog';
    else if (fog >= 0.25) kind = 'mist';
    else if (layers) kind = opaque >= 0.75 ? 'overcast' : opaque >= 0.4 ? 'clouds' : veil >= 0.5 ? 'veil' : opaque >= 0.12 || layers.hi >= 0.25 ? 'clouds' : 'clear';
    else if (kind === 'fog') kind = 'clouds';                    // (a fog code the visibility doesn't back: no fog)
  }
  const slot = cur && cur.time != null && Number.isFinite(Number(cur.time)) ? Number(cur.time) * 1000 : null;
  return {
    kind,
    rain: clamp01(w.rain || 0), snow: clamp01(w.snow || 0), storm: w.storm ? 1 : 0, fog: round2(fog),
    cloud: round2(Math.max(cloud, wet ? 0.8 : 0)), opaque: round2(opaque), veil: round2(veil),
    wind: Math.round(num(cur && cur.wind_speed_10m) * 10) / 10, windDir: Math.round(num(cur && cur.wind_direction_10m)),
    // (9a: the gusts + the rain's rate — core/harbor-weather.js#cityWeather)
    gust: cur && cur.wind_gusts_10m != null ? Math.round(num(cur.wind_gusts_10m) * 10) / 10 : null, rate: wet ? rateOf(cur, m15, at) : 0,
    temp: Math.round(num(cur && cur.temperature_2m, 15) * 10) / 10,
    lat: where.lat ?? null, lon: where.lon ?? null, city: where.city || null, at,
    // RAINBOWS (core/rainbow.js): when it last rained — raining now counts as now
    wetAt: WET_KINDS.has(w.kind) ? at : wetAtOf(m15, at),
    // DT2 — THE CLOUDS by height (Open-Meteo's low / mid / high cover, 0..1): which kinds the Harbor draws (core/harbor-clouds.js —
    // high = cirrus, mid = altocumulus, low = cumulus / stratocumulus / the deck); null when the data has none
    layers,
    src: 'open-meteo/best_match', code, vis: vis == null ? null : Math.round(vis), t: slot,
    // 9b — THE SNOWPACK: the real snow depth now (cm; null when the model has none) + the snowfall of the last quarter hour (cm) + the
    // last 30 days as rows (core/harbor-snow.js)
    snowDepth: cur && cur.snow_depth != null && Number.isFinite(Number(cur.snow_depth)) ? Math.round(Number(cur.snow_depth) * 1000) / 10 : null,
    snowfall: cur && cur.snowfall != null && Number.isFinite(Number(cur.snowfall)) ? Math.round(Number(cur.snowfall) * 10) / 10 : 0,
    days: dailyRows(daily),
  };
}

/** A made-up weather for previews (?wx=storm …) and tests. */
export function forcedWeather(kind, extra = {}) {
  const base = {
    clear: { kind: 'clear', cloud: 0.1 }, clouds: { kind: 'clouds', cloud: 0.55 }, overcast: { kind: 'overcast', cloud: 0.95 },
    fog: { kind: 'fog', cloud: 0.9, fog: 0.9 }, drizzle: { kind: 'drizzle', cloud: 0.9, rain: 0.3 }, rain: { kind: 'rain', cloud: 0.95, rain: 0.75 },
    storm: { kind: 'storm', cloud: 1, rain: 0.95, storm: 1 }, freeze: { kind: 'clear', cloud: 0.15, temp: -16 }, snow: { kind: 'snow', cloud: 0.95, snow: 0.8 }, sleet: { kind: 'sleet', cloud: 0.95, rain: 0.4, snow: 0.25 },
    // (CITY 2.0 — SP: high cloud by its height — a fair day's cirrus over a few cumulus; a hazy CIRROSTRATUS veil + the moon's halo)
    cirrus: { kind: 'clear', cloud: 0.3, layers: { lo: 0.12, mid: 0, hi: 0.5 } }, veil: { kind: 'veil', cloud: 0.92, layers: { lo: 0.08, mid: 0.05, hi: 0.92 } },
    // (FP3a: the graded fog + the layers — MIST (a 600 m view: the far skyline's haze, no banks, no horn), a low STRATUS deck,
    // a HIGH OVERCAST (WMO 3, all of it high: a bright veil, never the grey deck))
    mist: { kind: 'mist', cloud: 0.6, fog: 0.45, vis: 600 }, stratus: { kind: 'overcast', cloud: 1, layers: { lo: 1, mid: 0, hi: 0 } },
    highovercast: { kind: 'veil', cloud: 1, code: 3, layers: { lo: 0, mid: 0, hi: 1 } },
    // (9a — THE WEATHER's previews: core/harbor-weather.js#WX_FORCE gives each its rate / wind / ice)
    heavy: { kind: 'heavy', cloud: 1, rain: 0.9, rate: 12 }, windy: { kind: 'windy', cloud: 0.45, wind: 14, gust: 21 },
    gale: { kind: 'windy', cloud: 0.6, wind: 20, gust: 30 },   // (ATM-A: a GALE — the trees bent hard, people leaning in, the rain driven sideways)
    freezing: { kind: 'freezing', cloud: 1, rain: 0.5, rate: 2.5, temp: -2, code: 67 },
    heavysnow: { kind: 'snow', cloud: 1, snow: 1, temp: -5, wind: 6, gust: 10 },   // (ATM-B: HEAVY SNOW in layers of depth)
    blizzard: { kind: 'snow', cloud: 1, snow: 1, temp: -8, wind: 17, gust: 26, vis: 250 },   // (ATM-B: THE BLIZZARD — a whiteout with depth)
  }[kind] || { kind: 'clear', cloud: 0.1 };
  return { rain: 0, snow: 0, storm: 0, fog: 0, wind: kind === 'storm' ? 9 : kind === 'windy' ? 14 : 3, windDir: 250, temp: kind === 'snow' || kind === 'freezing' ? -2 : kind === 'freeze' ? -16 : 12, lat: null, lon: null, city: null, at: Date.now(), ...base, ...extra };
}

/** Real weather is used for 45 minutes after it was fetched (FP3a: was 75 — then the seeded weather until the next answer; a
 *  normal answer is at most ~30 min old: the server's cache 15 + the page's poll 15) */
export const WEATHER_TTL_MS = 45 * 60_000;
export const isFresh = (wx, now = Date.now()) => !!(wx && wx.kind && wx.at && now - wx.at < WEATHER_TTL_MS && now >= wx.at - 60_000);

/** The area a visitor is in, rounded (~0.5° ≈ 35 miles): the cache key, and all the server ever keeps of where they are. */
export function areaOf(lat, lon) {
  if (lat == null || lon == null || lat === '' || lon === '') return null;      // missing is unknown, never 0°, 0°
  const la = Number(lat), lo = Number(lon);
  if (!Number.isFinite(la) || !Number.isFinite(lo) || Math.abs(la) > 90 || Math.abs(lo) > 180) return null;
  const r = v => Math.round(v * 2) / 2;
  return { lat: r(la), lon: r(lo), key: `a${r(la).toFixed(1)}_${r(lo).toFixed(1)}`.replace(/\./g, 'p').replace(/-/g, 'm') };
}

// ------------------------------------------------------------------ SPACE WEATHER (CITY 2.0, Part 6a: the aurora's storm night)
/** NOAA SWPC's planetary K-index forecast (products/noaa-planetary-k-index-forecast.json — objects { time_tag, kp, observed },
 *  or the older rows [time_tag, kp, observed, scale] under a header) → [[ms (the 3-hour block's start, UTC), kp], …] from 12 h
 *  ago to 36 h ahead. [] when it can't be read. */
export function parseKp(json, nowMs = Date.now()) {
  if (!Array.isArray(json)) return [];
  const out = [];
  for (const r of json) {
    let t, k;
    if (Array.isArray(r)) { if (r[0] === 'time_tag') continue; [t, k] = r; } else if (r && typeof r === 'object') { t = r.time_tag; k = r.kp; } else continue;
    const ms = Date.parse(String(t).replace(' ', 'T') + (/[zZ]|[+-]\d\d:?\d\d$/.test(String(t)) ? '' : 'Z'));
    const kp = Number(k);
    if (!Number.isFinite(ms) || !Number.isFinite(kp) || kp < 0 || kp > 9.5) continue;
    if (ms < nowMs - 12 * 3600e3 || ms > nowMs + 36 * 3600e3) continue;
    out.push([ms, Math.round(kp * 100) / 100]);
  }
  return out.sort((a, b) => a[0] - b[0]);
}
/** the Kp at ms from the blocks (each 3 h from its start); null outside them */
export function kpAt(blocks, ms) {
  if (!Array.isArray(blocks)) return null;
  for (const [t, k] of blocks) if (ms >= t && ms < t + 3 * 3600e3) return k;
  return null;
}
