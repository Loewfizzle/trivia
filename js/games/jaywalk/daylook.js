// JAYWALK — VARIETY A (docs/jaywalk.md "VARIETY A"): THE TIERS' budget · THE TIMES OF DAY · OVERCAST — PURE (a VIEW: no rule, replay or
// server file reads it — tests/jaywalk-variety-a.test.mjs). The times of day sit on the CITY's own sun model: core/sky.js's elevation at the
// phone's place (the same place + curve AUTO's day / night uses — kit/look.js#sunUpNow) + core/harbor-dark.js's DUSK ramps for the lights.
import { duskDark, litK } from '../../core/harbor-dark.js';

/** THE TIERS (the owner, Nov 22): the most draw calls a frame may take — tier 0 · 1 · 2 (tier 2 carries the sun's shadow pass) */
export const CALLS_MAX = Object.freeze([64, 64, 96]);
export const callsMax = tier => CALLS_MAX[tier < 0 ? 0 : tier > 2 ? 2 : tier | 0];

export const TODS = Object.freeze(['sunrise', 'noon', 'golden', 'sunset', 'night']);
/** THE BANDS (the sun's elevation, °): the DAY look — whatever AUTO calls day — split into
 *  sunrise = a morning under +6° · noon = above (morning ≥ +6°, evening ≥ +10°) · golden = an evening +10° … +2° · sunset = an evening under +2°
 *  (into the blue hour) → night where the city says night (sky.js: about −10.5° in the morning, −9° in the evening) */
export const BANDS = Object.freeze({ sunrise: 6, golden: 10, sunset: 2 });
/** the lab's sun for each forced time of day (the band's look at a typical moment): sunrise just up · sunset in the blue hour's start */
export const LAB_SUN = Object.freeze({ sunrise: 1.5, noon: 40, golden: 5, sunset: -3.5, night: -20 });

/** the time of day for a DAY look: the sun's elevation (°) + the morning / the evening (local hour < 12.5) */
export function todOf(el, morning) {
  if (morning) return el < BANDS.sunrise ? 'sunrise' : 'noon';
  return el >= BANDS.golden ? 'noon' : el >= BANDS.sunset ? 'golden' : 'sunset';
}

/** THE LIGHTS by time (the owner, Nov 22): { cars, beams, neon, lamps } 0 … 1 — what glows in a DAY look (night = all 1, as always)
 *  sunrise: the cars' head + tail lamps at HALF (small, crisp — no beams, no glow pools) + the neon switching OFF through the morning (the
 *  city's own neon ramp) · noon + golden: none · sunset: the city's lamps ramp (around sunset) brings the lights ON, its neon ramp the neon */
export function lightsOf(tod, el) {
  if (tod === 'night') return { cars: 1, beams: 1, neon: 1, lamps: 1 };
  const k = duskDark(el);
  if (tod === 'sunrise') return { cars: 0.5, beams: 0, neon: litK(k, 'neon'), lamps: 0 };
  if (tod === 'sunset') { const l = litK(k, 'lamps'); return { cars: Math.max(0.5 * Math.min(1, k / 0.16), l), beams: l, neon: litK(k, 'neon'), lamps: l }; }
  return { cars: 0, beams: 0, neon: 0, lamps: 0 };
}

/** OVERCAST (the owner): an occasional weather day picked by DATE — the same for everyone, about 1 day in 7, day looks only. `day` = the
 *  run's own 4 am Eastern day key ('d20261124' — the season's: a match = its first GO's day) */
export function overcastDay(day) {
  if (!day) return false;
  let x = 0x811c9dc5;
  for (let i = 0; i < day.length; i++) { x ^= day.charCodeAt(i); x = Math.imul(x, 0x01000193) >>> 0; }
  x ^= x >>> 16; x = Math.imul(x, 0x85ebca6b) >>> 0; x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35) >>> 0; x ^= x >>> 16;   // (murmur's finaliser)
  return (x >>> 0) / 4294967296 < 1 / 7;
}

/** the look one phone shows: { tod, look ('day' | 'night'), el, morning, overcast, lights } — `choice` = the GAME LOOK (auto · day · night),
 *  `sun` = { el, morning } (sky.js — the phone's own place + clock, or the HOST's stamp in a match), `day` = the run's day key (overcast) */
export function resolveTod(choice, sun, day, force = {}) {
  let tod = force.tod && TODS.includes(force.tod) ? force.tod : null, el;
  if (!tod) {
    if (choice === 'night') tod = 'night';
    else if (choice === 'day') tod = 'noon';
    else if (!sun) tod = 'noon';
    else tod = sun.night ? 'night' : todOf(sun.el, sun.morning);
  }
  el = force.el != null && Number.isFinite(+force.el) ? +force.el : sun && choice === 'auto' && !force.tod ? sun.el : LAB_SUN[tod];
  const overcast = tod !== 'night' && (force.weather ? force.weather === 'overcast' : overcastDay(day));
  return { tod, look: tod === 'night' ? 'night' : 'day', el, overcast, lights: lightsOf(tod, el) };
}
