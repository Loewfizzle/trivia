// CITY 2.0 — PART 9a: THE WEATHER MODEL (PURE: tests/harbor-weather.test.mjs). The live weather at the player's place (core/weather.js —
// Open-Meteo via /api/sky: the WMO code, the precipitation + its rate, the visibility, the wind + its gusts + direction, the temperature,
// the cloud layers) or a forced preview (&wx= / &force=storm …, the panel's WEATHER) → ONE city weather state every system reads:
//   CLEAR · DRIZZLE · RAIN · HEAVY (rain) · STORM (thunder + lightning when the source says so) · FOG · MIST · WINDY · FREEZING (rain: ice)
// (the snow states are 9b). Each with its intensity (k 0..1) and WHY (the readout's weather line).
// THE TRANSITIONS (stepWeather): the city never switches — rain starts as a few drops and builds (~90 s live, ~20 s on a preview), it stops
// over ~40 s, then the DRIPS (eaves, awnings, the tubes) die away over ~8 min and the STREET DRIES over ~45 min, patch by patch; fog
// rolls in + lifts over ~2 min; the wind eases. A load after real rain starts wet (the live answer's wetAt): wetFrom().
// Weather shows ONLY when it's real (the live answer) or forced — no answer = CLEAR.

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

/** the states, in the panel's order */
export const WX_STATES = ['clear', 'drizzle', 'rain', 'heavy', 'storm', 'fog', 'mist', 'windy', 'freezing', 'snow'];
/** the thresholds (the rate in mm/h — the meteorologists' light < 2.5 ≤ moderate < 7.6 ≤ heavy; wind in m/s) */
export const WX = Object.freeze({ drizzleMax: 0.5, lightMax: 2.5, heavyMin: 7.6, windy: 10, gusty: 15, freezeC: 0.5, dryMin: 45, dripMin: 8, rainUp: 90, rainUpForced: 20, rainDown: 40, fogS: 120 });
const FREEZING_CODES = new Set([56, 57, 66, 67]);
const STORM_CODES = new Set([95, 96, 99]);
const HEAVY_CODES = new Set([65, 82]);
const DRIZZLE_CODES = new Set([51, 53, 55]);
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);

/** the rain's intensity 0..1 from its rate (mm/h) — drizzle ~0.15–0.3, rain ~0.35–0.7, heavy 0.75–1 */
export function rateK(rate) {
  const r = Math.max(0, num(rate));
  if (r <= 0) return 0;
  if (r < WX.drizzleMax) return 0.12 + 0.18 * (r / WX.drizzleMax);
  if (r < WX.lightMax) return 0.3 + 0.12 * ((r - WX.drizzleMax) / (WX.lightMax - WX.drizzleMax));
  if (r < WX.heavyMin) return 0.42 + 0.3 * ((r - WX.lightMax) / (WX.heavyMin - WX.lightMax));
  return Math.min(1, 0.75 + 0.25 * ((r - WX.heavyMin) / 12));
}

/**
 * PURE: the live / forced weather (core/weather.js#normalize's shape, + rate mm/h, gust m/s) → the city's state:
 * { state, k (0..1), rain (the drops' target level 0..1), rate, fog (0..1), dense, wind, gust, dir, temp, ice (0..1: freezing rain),
 *   lightning, thunder, why }
 */
export function cityWeather(wx) {
  const base = { state: 'clear', k: 0, rain: 0, snow: 0, rate: 0, fog: 0, dense: false, wind: 3, gust: 3, dir: 250, temp: null, ice: 0, lightning: false, thunder: false, why: 'no live weather — a dry city' };
  if (!wx || !wx.kind) return base;
  const code = wx.code != null && Number.isFinite(Number(wx.code)) ? Number(wx.code) : null;
  const wind = num(wx.wind, 3), gust = Math.max(wind, num(wx.gust, wind * 1.4)), dir = num(wx.windDir, 250), temp = wx.temp == null ? null : num(wx.temp);
  const fog = clamp01(num(wx.fog)), rain0 = clamp01(num(wx.rain));
  // the rate: the source's own (mm/h), else read back from the code's intensity
  const rate = wx.rate != null && Number.isFinite(Number(wx.rate)) && Number(wx.rate) > 0 ? Number(wx.rate) : rain0 > 0 ? (rain0 < 0.35 ? 0.3 : rain0 < 0.6 ? 1.8 : rain0 < 0.85 ? 4.5 : 9) : 0;
  const out = { ...base, rate: Math.round(rate * 10) / 10, wind, gust, dir, temp, fog };
  const src = wx.forced ? 'forced' : `WMO ${code == null ? '?' : code}`;
  const wet = rain0 > 0 || rate > 0 || wx.kind === 'drizzle' || wx.kind === 'rain' || wx.kind === 'storm' || wx.kind === 'freezing';
  const k = wx.k != null ? clamp01(num(wx.k)) : null;          // (a preview's chosen intensity: light / medium / heavy)
  // (1) STORM — thunder + lightning only when the source says so (a thunderstorm code / a forced storm)
  if (STORM_CODES.has(code) || wx.kind === 'storm' || wx.storm) {
    const kk = k != null ? k : Math.max(0.85, rateK(rate));
    return { ...out, state: 'storm', k: kk, rain: Math.max(0.6, kk), lightning: true, thunder: true, why: `${src} thunderstorm · ${out.rate} mm/h` };
  }
  // (1b) SNOW (9b) — a snow code, or the source's snow (never sleet: that is freezing rain) — the flakes' level by the code / the source
  if (SNOW_CODES.has(code) || ((wx.kind === 'snow' || num(wx.snow) > 0.05) && !FREEZING_CODES.has(code) && wx.kind !== 'sleet' && rain0 < 0.1)) {
    const kk = k != null ? k : clamp01(Math.max(num(wx.snow), code === 75 || code === 86 ? 1 : code === 73 || code === 85 ? 0.72 : code === 71 || code === 77 ? 0.45 : 0.6));
    return { ...out, state: 'snow', k: kk, snow: kk, rate: 0, why: `${src} snow · ${temp == null ? '?' : temp} °C${wind >= WX.windy ? ` · wind ${wind} m/s` : ''}` };
  }
  // (2) FREEZING RAIN — a freezing code, or rain falling at / under freezing (ice: the glaze on the frame + the glass)
  if (FREEZING_CODES.has(code) || wx.kind === 'freezing' || (wet && temp != null && temp <= WX.freezeC)) {
    const kk = k != null ? k : Math.max(0.3, rateK(rate));
    return { ...out, state: 'freezing', k: kk, rain: kk * 0.85, ice: clamp01(0.45 + 0.55 * kk), why: `${src} freezing rain · ${temp == null ? '?' : temp} °C · ${out.rate} mm/h` };
  }
  // (3) THE RAIN by its rate (or the code's own words)
  if (wet) {
    const kk = k != null ? k : rateK(rate);
    const state = HEAVY_CODES.has(code) || wx.kind === 'heavy' || rate >= WX.heavyMin || kk >= 0.75 ? 'heavy'
      : DRIZZLE_CODES.has(code) || wx.kind === 'drizzle' || (rate > 0 && rate < WX.drizzleMax) || kk < 0.3 ? 'drizzle' : 'rain';
    const kf = k != null ? k : state === 'heavy' ? Math.max(0.75, kk) : state === 'drizzle' ? Math.min(0.3, Math.max(0.15, kk)) : Math.max(0.35, Math.min(0.72, kk));
    return { ...out, state, k: kf, rain: kf, why: `${src} ${state === 'heavy' ? 'heavy rain' : state} · ${out.rate} mm/h${wind >= WX.windy ? ` · wind ${wind} m/s` : ''}` };
  }
  // (4) FOG / MIST (core/weather.js#fogOf: dense only for a fog code AND under 300 m)
  if (wx.kind === 'fog' || fog >= 0.6) return { ...out, state: 'fog', k: k != null ? k : Math.max(0.6, fog), fog: k != null ? Math.max(0.6, k) : Math.max(0.6, fog), dense: true, why: `${src} fog · vis ${wx.vis != null ? `${wx.vis} m` : '?'}` };
  if (wx.kind === 'mist' || fog >= 0.25) return { ...out, state: 'mist', k: k != null ? k : fog, fog: k != null ? 0.25 + 0.3 * k : Math.max(0.25, fog), why: `${src} mist · vis ${wx.vis != null ? `${wx.vis} m` : '?'}` };
  // (5) WINDY — a dry, blowy day (the wind or its gusts)
  if (wx.kind === 'windy' || wind >= WX.windy || gust >= WX.gusty) {
    const kk = k != null ? k : clamp01((Math.max(wind, gust / 1.5) - 7) / 10);
    return { ...out, state: 'windy', k: kk, wind: wx.kind === 'windy' && k != null ? 8 + 10 * k : wind, gust: wx.kind === 'windy' && k != null ? 13 + 12 * k : gust, why: `${src} windy · ${wind} m/s, gusts ${Math.round(gust)}` };
  }
  return { ...out, why: `${src} ${wx.kind} — no weather on the city` };
}

/** PURE: the street's wetness on a load after real rain (wetAt ms: when it last really rained) — 1 while raining, drying over WX.dryMin */
export function wetFrom(wetAt, now) {
  if (wetAt == null || !Number.isFinite(wetAt)) return 0;
  const m = (now - wetAt) / 60000;
  return m <= 0 ? 1 : clamp01(1 - m / WX.dryMin);
}
/** SP4 — PURE: THE AWNING'S DRIPS per second across its front edge, by the rain's intensity (0..1) and, after it, the dying drip level:
 *  drizzle (~0.2) an occasional drip, rain (~0.5) a steady line, heavy (1) a running fringe (+ the corners' sheets: dripSheet) */
export const dripRate = (rain, drip) => (rain > 0.03 ? (rain < 0.3 ? 0.8 + 5 * rain : rain < 0.7 ? 7 + 24 * (rain - 0.3) : 17 + 60 * (rain - 0.7)) : 3 * clamp01(drip) * clamp01(drip));
/** the sheet pouring off each corner of the awning: 0 below rain 0.6, 1 at heavy */
export const dripSheet = rain => clamp01(((rain || 0) - 0.6) / 0.25);
/** PURE: the drips after the rain (eaves, the awning, the tubes) — 1 as it stops, gone over WX.dripMin */
export const dripFrom = (wetAt, now) => (wetAt == null ? 0 : clamp01(1 - Math.max(0, (now - wetAt) / 60000) / WX.dripMin));

/** the live state (what's drawn now): created at the first answer — joined mid-way (a load in the rain shows the rain at once) */
export function createWeatherState(target = cityWeather(null), { wet = 0, drip = 0 } = {}) {
  return { state: target.state, k: target.k, rain: target.rain, snow: target.snow || 0, fog: target.fog, wind: target.wind, gust: target.gust, dir: target.dir, ice: target.ice,
    lightning: target.lightning, wet: Math.max(wet, target.rain > 0 ? 1 : 0), drip: Math.max(drip, target.rain > 0 ? 1 : 0), since: 0, target };
}

/**
 * PURE: one step of the soft transitions (dt in s; forced = a preview: the rain builds faster) — mutates + returns st:
 *   rain → the target (up over WX.rainUp s from nothing — a few drops first: the drops' count follows st.rain; down over WX.rainDown s)
 *   wet  → 1 while it rains (soaked within ~2 min), then dries over WX.dryMin min (the street's puddles go patch by patch: harbor-street)
 *   drip → 1 while it rains, then dies away over WX.dripMin min
 *   fog  → the target over WX.fogS s; the wind eases toward the target over ~20 s
 */
export function stepWeather(st, target, dt, { forced = false } = {}) {
  const s = Math.max(0, Math.min(5, dt));
  const up = forced ? WX.rainUpForced : WX.rainUp;
  if (st.target !== target) { if (!st.target || st.target.state !== target.state) st.since = 0; st.target = target; }
  st.since += s;
  const toward = (v, to, perS) => (v < to ? Math.min(to, v + perS * s) : Math.max(to, v - perS * s));
  // (the rain builds slowly at first — a few drops, then it comes on: the step grows with what's already falling)
  st.rain = target.rain > st.rain ? Math.min(target.rain, st.rain + 1.8 * (0.15 + st.rain) * s / up) : toward(st.rain, target.rain, 1 / WX.rainDown);
  if (st.rain > 0.03) { st.wet = Math.min(1, st.wet + s / 120); st.drip = Math.min(1, st.drip + s / 30); }
  else { st.wet = Math.max(0, st.wet - s / (WX.dryMin * 60)); st.drip = Math.max(0, st.drip - s / (WX.dripMin * 60)); }
  st.snow = toward(st.snow || 0, target.snow || 0, 1 / (forced ? 8 : 120));      // (9b: the flakes come on over ~2 min live — a few big ones first)
  st.fog = toward(st.fog, target.fog, 1 / WX.fogS);
  st.wind += (target.wind - st.wind) * Math.min(1, s / 20); st.gust += (target.gust - st.gust) * Math.min(1, s / 20); st.dir = target.dir;
  st.ice = toward(st.ice, target.ice, 1 / 240);
  st.k = target.k; st.lightning = target.lightning && st.rain > 0.4; st.state = target.state;
  return st;
}

/** PURE: the readout's weather line — the state + why + what the city shows now */
export function weatherLine(st) {
  if (!st) return 'weather —';
  const p = v => Math.round(v * 100);
  return `→ ${st.state.toUpperCase()}${st.k ? ` ${p(st.k)}%` : ''} · ${st.target ? st.target.why : ''} · rain ${p(st.rain)}% wet ${p(st.wet)}% drip ${p(st.drip)}% fog ${p(st.fog)}%${st.snow > 0.01 ? ` snow ${p(st.snow)}%` : ''}${st.ice > 0.01 ? ` ice ${p(st.ice)}%` : ''} · wind ${st.wind.toFixed(1)} g ${st.gust.toFixed(1)}${st.lightning ? ' · ⚡' : ''}`;
}

/** the previews: a state id (&force=… / &wx=…) + an intensity (&wxk=light|medium|heavy) → core/weather.js#forcedWeather's kind + extras */
export const WX_FORCE = Object.freeze({
  drizzle: ['drizzle', { rain: 0.25, rate: 0.3 }], rain: ['rain', { rain: 0.55, rate: 3.5 }], 'heavy-rain': ['heavy', { rain: 0.9, rate: 12 }],
  storm: ['storm', { rain: 0.95, rate: 15, storm: 1, wind: 9, gust: 18 }], fog: ['fog', { fog: 0.9, vis: 150 }], mist: ['mist', { fog: 0.45, vis: 600 }],
  windy: ['windy', { wind: 14, gust: 21 }], snowfall: ['snow', { snow: 0.7, temp: -3 }], 'freezing-rain': ['freezing', { rain: 0.5, rate: 2.5, temp: -2, code: 67 }],
});
export const WX_K = Object.freeze({ light: 0.3, medium: 0.6, heavy: 0.95 });
