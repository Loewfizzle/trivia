// CITY 2.0 — THE HARBOR, Part 1: the grey-box tones. Day / sunset / night TINTS only (the materials come with Parts 2–8),
// blended from the real sky's weights (core/sky.js#look → w.day, w.golden, w.dawn, w.night, w.late). Each part's colour is
// an [r,g,b]; far things are mixed into the haze (atmospheric depth) by fog(z).
import { mix } from './shapes.js';

const DAY = {
  haze: [188, 208, 232], far: [176, 184, 198], mid: [160, 168, 182], landmark: [146, 152, 166], near: [128, 134, 148], hero: [138, 120, 112],
  crown: [196, 186, 150], quay: [143, 135, 123], water: [72, 102, 134], waterLo: [44, 72, 104], pier: [120, 100, 84], wheel: [190, 70, 70],
  light: [232, 232, 226], lightBand: [190, 50, 50], rail: [70, 70, 78], road: [86, 86, 95], lane: [220, 214, 200], prom: [207, 199, 184],
  promLine: [182, 173, 158], speak: [154, 84, 64], speakTop: [124, 110, 98], glass: [58, 76, 104], door: [70, 44, 34], awning: [168, 36, 46],
  lamp: [40, 42, 50], trunk: [80, 60, 46], canopy: [196, 120, 52], person: [70, 74, 92], car: [122, 42, 42], bus: [47, 95, 174],
  boat: [236, 232, 222], boatHull: [150, 40, 40], cart: [60, 110, 70], bench: [92, 70, 54], planter: [120, 92, 70], win: [255, 214, 150], winA: 0,
};
const GOLD = {
  haze: [232, 162, 122], far: [178, 120, 128], mid: [150, 100, 120], landmark: [128, 86, 110], near: [104, 70, 98], hero: [110, 66, 80],
  crown: [255, 190, 120], quay: [122, 90, 90], water: [70, 44, 72], waterLo: [42, 26, 50], pier: [96, 60, 64], wheel: [170, 60, 70],
  light: [235, 200, 180], lightBand: [170, 50, 60], rail: [50, 36, 52], road: [74, 58, 72], lane: [230, 190, 150], prom: [170, 130, 120],
  promLine: [150, 112, 106], speak: [130, 64, 60], speakTop: [104, 76, 84], glass: [60, 50, 80], door: [60, 36, 34], awning: [150, 36, 50],
  lamp: [36, 28, 40], trunk: [64, 42, 40], canopy: [190, 100, 50], person: [56, 46, 70], car: [110, 40, 46], bus: [52, 70, 140],
  boat: [240, 210, 190], boatHull: [140, 40, 50], cart: [56, 90, 66], bench: [80, 56, 50], planter: [104, 72, 64], win: [255, 200, 130], winA: 0.5,
};
const NIGHT = {
  haze: [42, 21, 70], far: [28, 26, 58], mid: [24, 22, 50], landmark: [22, 21, 46], near: [19, 18, 40], hero: [26, 18, 38],
  crown: [60, 52, 90], quay: [13, 12, 28], water: [20, 18, 48], waterLo: [7, 7, 20], pier: [26, 20, 34], wheel: [70, 50, 90],
  light: [70, 66, 90], lightBand: [80, 30, 50], rail: [20, 18, 34], road: [10, 10, 20], lane: [70, 66, 80], prom: [24, 22, 38],
  promLine: [34, 32, 52], speak: [34, 21, 38], speakTop: [26, 20, 36], glass: [20, 18, 34], door: [30, 20, 26], awning: [70, 20, 36],
  lamp: [20, 20, 30], trunk: [26, 20, 24], canopy: [60, 36, 30], person: [30, 30, 44], car: [40, 20, 28], bus: [16, 18, 36],
  boat: [60, 56, 76], boatHull: [44, 18, 28], cart: [22, 36, 30], bench: [30, 24, 26], planter: [34, 26, 30], win: [255, 208, 138], winA: 1,
};

/** the blend weights of the three tints for a look: { day, gold, night } summing to 1 */
export function toneWeights(LK) {
  const w = (LK && LK.w) || { night: 1 };
  const night = (w.night || 0) + (w.late || 0) + 0.3 * (w.dawn || 0);
  const gold = (w.golden || 0) + 0.7 * (w.dawn || 0);
  const day = w.day || 0;
  const s = Math.max(1e-6, night + gold + day);
  return { day: day / s, gold: gold / s, night: night / s };
}

/** the look key the bakes follow: the weights in sixths (a visible step), so a re-bake happens a few times a dusk */
export const toneKey = tw => `${Math.round(tw.day * 6)}${Math.round(tw.gold * 6)}${Math.round(tw.night * 6)}`;

/** the tone table for weights (quantised the same way as the key, so a bake is exactly its key's look) */
export function tones(tw) {
  const q = v => Math.round(v * 6) / 6;
  let d = q(tw.day), g = q(tw.gold), n = q(tw.night);
  const s = d + g + n || 1; d /= s; g /= s; n /= s;
  const T = {};
  for (const k of Object.keys(DAY)) {
    if (k === 'winA') { T[k] = DAY[k] * d + GOLD[k] * g + NIGHT[k] * n; continue; }
    T[k] = [0, 1, 2].map(i => DAY[k][i] * d + GOLD[k][i] * g + NIGHT[k][i] * n);
  }
  T.night = n; T.gold = g; T.day = d;
  return T;
}

/**
 * The real sun on the facades (Part 2): which side the light comes from (we face south: −1 = a morning sun in the east, on the
 * left; 1 = an afternoon sun in the west; 0 = around noon, straight behind the city) and how high (bucketed: a few re-bakes a
 * day), plus the sky's colours the glass mirrors. sunKey goes into the bake key.
 */
export function sunLook(LK, P) {
  const az = LK && LK.sun ? LK.sun.az : 180, el = LK && LK.sun ? LK.sun.el : 30;
  const d = ((az - 180 + 540) % 360) - 180;
  // THE DAY PASS: with the sun up the side is CONTINUOUS (−1..1 in fifths) — the light swings from the left in the morning to the
  // right in the afternoon, never "straight behind" (a flat city at noon): around noon a gentle ±0.4 from the side it's on.
  // A low sun (golden hour: |d| ≥ 55°) is ±1 as before; with the sun down the old sides exactly (the night + dusk never change).
  const sunDir = el < 0 ? (Math.abs(d) < 14 ? 0 : d > 0 ? 1 : -1)
    : Math.round(Math.max(-1, Math.min(1, (Math.sign(d) || 1) * Math.max(0.4, Math.abs(d) / 55))) * 5) / 5;
  // (the height in steps: a golden-hour sun as before; a day sun in ~8° steps — a new look every ~40–60 min at most)
  const sunEl = el < 8 ? 6 : el < 18 ? 12 : el < 26 ? 22 : el < 34 ? 30 : el < 44 ? 40 : 52;
  const col = c => (Array.isArray(c) ? c : null), st = harborSky(P, LK);
  return { sunDir, sunEl, skyHi: col(st && st[1]), skyLo: col(st && st[3]), skyTop: col(st && st[0]), cloud: LK ? LK.cloud || 0 : 0 };
}

// ------------------------------------------------------------------ THE DAY SKY (THE DAY PASS)
// The shared palette's day sky (district/palette.js — City 1.0's, untouched) is a soft grey-blue. The Harbor paints its own by day:
// a deep azure overhead fading through clean blues to a pale, luminous horizon — a travel poster's sky — blended in by the day's
// share (so dawn, golden hour and the night keep the palette's exactly) and greyed by the real cloud cover.
const SKY_DAY = [[26, 82, 172], [70, 136, 212], [146, 192, 236], [214, 230, 242]];
const SKY_GREY = [[124, 136, 154], [150, 160, 174], [176, 184, 194], [200, 204, 208]];
const sm = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const mixc = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
/** the Harbor's sky stops (4 colours, top → horizon) for a look: the palette's, with the Harbor's own day sky by the day's share */
export function harborSky(P, LK) {
  if (!P || !P.sky) return null;
  const d = LK && LK.w ? LK.w.day || 0 : 0;
  if (d <= 0.001) return P.sky;
  const g = sm(0.45, 0.97, (LK && LK.cloud) || 0) * 0.85;
  return P.sky.map((c, i) => { const own = mixc(SKY_DAY[i], SKY_GREY[i], g); return mixc(c.slice(0, 3), own, d).map(Math.round); });
}
export const sunKey = sl => `${sl.sunDir}${sl.sunEl}${sl.cloud > 0.6 ? 'o' : ''}`;

/** atmospheric depth: 0 at the quay, 1 far away (mixed into the haze) */
export const fog = z => Math.max(0, Math.min(1, (z - 230) / 770));
