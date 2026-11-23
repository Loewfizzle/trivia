// JAYWALK — VARIETY A (docs/jaywalk.md "VARIETY A"): THE TIERS' budget · THE TIMES OF DAY · OVERCAST — PURE (a VIEW: no rule, replay or
// server file reads it — tests/jaywalk-variety-a.test.mjs). The times of day sit on the CITY's own sun model: core/sky.js's elevation at the
// phone's place (the same place + curve AUTO's day / night uses — kit/look.js#sunUpNow) + core/harbor-dark.js's DUSK ramps for the lights.
import { duskDark, litK } from '../../core/harbor-dark.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { currentLook } from '../kit/look.js';
/** the GAME LOOK chosen on this phone (Settings: auto · day · night — kit/look.js, its own memory) */
export const lookChoice = () => { try { return currentLook(); } catch { return 'auto'; } };

/** THE TIERS (the owner, Nov 22): the most draw calls a frame may take — tier 0 · 1 · 2 (tier 2 carries the sun's shadow pass) */
export const CALLS_MAX = Object.freeze([64, 64, 96]);
export const callsMax = tier => CALLS_MAX[tier < 0 ? 0 : tier > 2 ? 2 : tier | 0];

export const TODS = Object.freeze(['sunrise', 'noon', 'golden', 'sunset', 'night']);
/** THE BANDS (the sun's elevation, °): the DAY look — whatever AUTO calls day — split into … */
export const BANDS = Object.freeze({ sunrise: 6, golden: 10, sunset: 2 });
/** the lab's sun for each forced time of day (the band's look at a typical moment): sunrise just up · sunset in the blue hour's start */
export const LAB_SUN = Object.freeze({ sunrise: 1.5, noon: 40, golden: 5, sunset: -3.5, night: -20 });

/** the time of day for a DAY look: the sun's elevation (°) + the morning / the evening (local hour < 12.5) */
export function todOf(el, morning) {
  if (morning) return el < BANDS.sunrise ? 'sunrise' : 'noon';
  return el >= BANDS.golden ? 'noon' : el >= BANDS.sunset ? 'golden' : 'sunset';
}

/** THE LIGHTS by time (the owner, Nov 22): { cars, beams, neon, lamps } 0 … 1 — what glows in a DAY look (night = all 1, as always) … */
export function lightsOf(tod, el) {
  if (tod === 'night') return { cars: 1, beams: 1, neon: 1, lamps: 1 };
  const k = duskDark(el);
  if (tod === 'sunrise') return { cars: 0.5, beams: 0, neon: litK(k, 'neon'), lamps: 0 };
  if (tod === 'sunset') { const l = litK(k, 'lamps'); return { cars: Math.max(0.5 * Math.min(1, k / 0.16), l), beams: l, neon: litK(k, 'neon'), lamps: l }; }
  return { cars: 0, beams: 0, neon: 0, lamps: 0 };
}

/** OVERCAST (the owner): an occasional weather day picked by DATE — the same for everyone, about 1 day in 7, day looks only. `day` = the … */
export function overcastDay(day) {
  if (!day) return false;
  let x = 0x811c9dc5;
  for (let i = 0; i < day.length; i++) { x ^= day.charCodeAt(i); x = Math.imul(x, 0x01000193) >>> 0; }
  x ^= x >>> 16; x = Math.imul(x, 0x85ebca6b) >>> 0; x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35) >>> 0; x ^= x >>> 16;   // (murmur's finaliser)
  return (x >>> 0) / 4294967296 < 1 / 7;
}

/** the look one phone shows: { tod, look ('day' | 'night'), el, morning, overcast, lights } — `choice` = the GAME LOOK (auto · day · night), … */
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

/** THE GRADE of each DAY look (+ OVERCAST over any of them) — night.js#lookGL + the ground shader + the band's css (`data-tod` / `data-wx`): … */
export const GRADE = Object.freeze({
  noon: { key: [0xffe2ae, 2.75, 52], hemi: [0xcfe2ff, 0xc2ab84, 2.05], rim: 0.3, fog: 0xc6e6f7, warm: [1.05, 1.0, 0.93], cool: [0.80, 0.88, 1.06], sun: 1, len: 1, cloud: 0.13, dew: 0, shine: 1.6, gloss: 0.16 },
  sunrise: { key: [0xffc6b4, 2.45, 18], hemi: [0xe6cbe9, 0xc79c90, 2.0], rim: 0.4, fog: 0xeccde0, warm: [1.06, 0.96, 1.02], cool: [0.84, 0.84, 1.07], sun: 0.8, len: 1.55, cloud: 0.06, dew: 1, shine: 1.5, gloss: 0.16 },
  golden: { key: [0xffc47c, 2.65, 16], hemi: [0xeedcc6, 0xd5a46c, 1.75], rim: 0.35, fog: 0xf2dcb6, warm: [1.13, 1.0, 0.80], cool: [0.80, 0.84, 1.04], sun: 0.95, len: 1.9, cloud: 0.08, dew: 0, shine: 1.7, gloss: 0.15 },
  sunset: { key: [0xff9c6c, 1.5, 9], hemi: [0x9077c4, 0xa06656, 1.4], rim: 0.6, fog: 0xb886a6, warm: [0.8, 0.64, 0.74], cool: [0.78, 0.74, 1.0], sun: 0.5, len: 2.3, cloud: 0, dew: 0, shine: 1.4, gloss: 0.18 },
  overcast: { key: [0xe6ecf2, 1.25, 60], hemi: [0xd2dbe6, 0x9e9d98, 2.45], rim: 0.15, fog: 0xc9d1d9, warm: [0.97, 0.99, 1.02], cool: [0.9, 0.93, 1.0], sun: 0, len: 1, cloud: 0, dew: 0, shine: 0.9, gloss: 0.24 },
});
/** the grade a resolved look wears (null by night — night.js keeps the night's own lights) */
export function gradeOf(r) {
  if (!r || r.look === 'night') return null;
  const g = GRADE[r.tod] || GRADE.noon;
  if (!r.overcast) return g;
  const o = GRADE.overcast;
  return r.tod === 'sunset' ? { ...o, hemi: [0xa9a3c0, 0x8e8a8e, 2.1], fog: 0xb7b3c4, key: [0xd8cfe0, 1.0, 60] } : r.tod === 'sunrise' ? { ...o, dew: 1, fog: 0xd6d0db } : o;
}

/** the sun at the phone's place now (core/sky.js — THE CITY's model: its place from the phone's zone, its day / night = kit/look.js#sunUpNow's … */
export async function sunAt(ms) {
  try {
    const S = await lazyImport(import('../../core/sky.js'), '../../core/sky.js');
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone, L = S.look(ms, tz), w = L.w || {};
    return { el: L.sun.el, morning: L.local.h + L.local.mi / 60 < 12.5, night: (w.day || 0) + (w.golden || 0) + (w.dawn || 0) < 0.5 };
  } catch { return null; }
}
/** THE HOST's clock in a match (the owner): the sun at the match's start, packed into the start (`game.lk` — the host's own write, no new rule) … */
export const stampOf = s => (s ? { e: Math.round(s.el * 10) / 10, m: s.morning ? 1 : 0, n: s.night ? 1 : 0 } : null);
export const sunOfStamp = k => (k && Number.isFinite(+k.e) ? { el: +k.e, morning: !!k.m, night: !!k.n } : null);
