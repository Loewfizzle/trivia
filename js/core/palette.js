// LIVING CITY — the colours of each hour, blended by the sun (core/sky.js#look → weights). Every look is a full set of
// numbers so any blend of two is a valid look too: dawn into day, golden hour into night, night into the small hours.
// Then the season and the holiday tint the result (fog, windows, the sky's glow), lightly: the city stays itself.

const NIGHT = {
  sky: [[3, 4, 11], [10, 13, 38], [27, 20, 70], [58, 29, 98]], glow: [160, 70, 220, 0.34], glow2: [60, 80, 200, 0.12], cloud: [90, 60, 170, 0.1],
  stars: 1, haze: [88, 46, 142], hazeA: 1, tint: [0, 0, 0], tintA: 0, rim: [150, 140, 255, 0.07], win: 1, trims: 1, street: [12, 11, 34, 0], refl: 1,
  sign: 1, dark: 1, sun: 0, sunCol: [255, 200, 140], moonA: 1,
};
const LATE = {
  ...NIGHT, sky: [[2, 3, 8], [6, 8, 24], [17, 13, 48], [36, 18, 74]], glow: [120, 50, 190, 0.22], glow2: [40, 60, 160, 0.08], cloud: [60, 40, 130, 0.08],
  stars: 1.25, haze: [62, 34, 112], win: 0.32, trims: 0.8,
};
const DAWN = {
  sky: [[24, 22, 66], [58, 44, 108], [176, 112, 152], [255, 190, 160]], glow: [255, 170, 140, 0.45], glow2: [255, 120, 160, 0.16], cloud: [255, 170, 190, 0.22],
  stars: 0.22, haze: [214, 150, 176], hazeA: 0.9, tint: [64, 52, 104], tintA: 0.42, rim: [255, 190, 170, 0.18], win: 0.22, trims: 0.15, street: [70, 54, 96, 0.45], refl: 0.45,
  sign: 0, dark: 0.3, sun: 1, sunCol: [255, 186, 140], moonA: 0.6,
};
const DAY = {
  // a hazy matinee: soft light, atmospheric depth, the skyline in cool blue-grey, nothing harsh
  sky: [[78, 112, 168], [128, 162, 206], [192, 208, 226], [236, 226, 212]], glow: [255, 244, 225, 0.32], glow2: [200, 220, 255, 0.12], cloud: [255, 255, 255, 0.34],
  stars: 0, haze: [200, 210, 226], hazeA: 1.15, tint: [104, 118, 150], tintA: 0.62, rim: [255, 240, 220, 0.22], win: 0, trims: 0, street: [70, 80, 102, 0.62], refl: 0.28,
  sign: 0, dark: 0, sun: 0.65, sunCol: [255, 246, 226], moonA: 0.3,
};
const GOLDEN = {
  sky: [[30, 34, 86], [122, 62, 128], [255, 116, 104], [255, 206, 124]], glow: [255, 150, 80, 0.55], glow2: [255, 80, 140, 0.2], cloud: [255, 150, 120, 0.3],
  stars: 0.08, haze: [255, 150, 120], hazeA: 1, tint: [70, 38, 72], tintA: 0.46, rim: [255, 170, 110, 0.32], win: 0.5, trims: 0.4, street: [92, 52, 70, 0.4], refl: 0.6,
  sign: 0.35, dark: 0.35, sun: 1, sunCol: [255, 170, 90], moonA: 0.5,
};
// THE BLUE HOUR (CITY 2.0 only, DT1 — the Harbor's weights carry `blue` between sunset and full night: screens/harbor/tones.js#
// harborWeights; City 1.0's never do, so its palette is unchanged): a deep, luminous blue overhead fading to a softer blue low,
// the city's glow cool, a few first stars — the sky real cities light up against
const BLUE = {
  ...NIGHT, sky: [[6, 12, 44], [16, 34, 98], [38, 66, 150], [92, 104, 182]], glow: [120, 110, 255, 0.26], glow2: [60, 96, 230, 0.16], cloud: [96, 104, 196, 0.16],
  stars: 0.32, haze: [62, 70, 148], tint: [28, 38, 92], tintA: 0.28, rim: [140, 160, 255, 0.1], street: [16, 18, 52, 0.12], refl: 0.85, dark: 0.85, moonA: 0.9,
};
export const LOOKS = { night: NIGHT, late: LATE, dawn: DAWN, day: DAY, golden: GOLDEN, blue: BLUE };

const mixN = (a, b, t) => a + (b - a) * t;
const clamp = v => (v < 0 ? 0 : v > 1 ? 1 : v);
function blendInto(out, P, k) {
  for (const key of Object.keys(P)) {
    const v = P[key];
    if (typeof v === 'number') out[key] = (out[key] || 0) + v * k;
    else if (Array.isArray(v[0])) { out[key] ||= v.map(c => c.map(() => 0)); v.forEach((c, i) => c.forEach((x, j) => { out[key][i][j] += x * k; })); }
    else { out[key] ||= v.map(() => 0); v.forEach((x, j) => { out[key][j] += x * k; }); }
  }
}
const shiftCol = (c, to, t) => c.map((x, i) => (i < 3 ? mixN(x, to[i], t) : x));

/** The palette for a sky look (core/sky.js#look). */
export function paletteFor(L) {
  const P = {};
  for (const [k, w] of Object.entries(L.w)) if (w > 0.0005) blendInto(P, LOOKS[k], w);
  const s = L.season, hol = L.holiday;
  // seasons: autumn's amber haze, winter's cooler air and warmer windows, spring's soft pink dawn, summer's warm nights
  P.haze = shiftCol(P.haze, [210, 140, 90], 0.16 * s.autumn);
  P.haze = shiftCol(P.haze, [150, 170, 220], 0.12 * s.winter);
  P.glow = shiftCol(P.glow, [255, 150, 190], 0.12 * s.spring * (L.w.dawn + L.w.golden));
  P.winWarm = 0.35 * s.winter + 0.2 * s.autumn;
  // holidays
  if (hol) {
    const k = hol.k;
    if (hol.id === 'halloween') {
      P.haze = shiftCol(P.haze, [255, 116, 40], (hol.full ? 0.42 : 0.34) * k);
      P.glow2 = shiftCol(P.glow2, [150, 60, 210], 0.5 * k);
      P.glow = shiftCol(P.glow, [255, 110, 40], (hol.full ? 0.35 : 0.24) * k);
    }
    if (hol.id === 'thanksgiving') { P.haze = shiftCol(P.haze, [255, 170, 90], 0.3 * k); P.winWarm += 0.4 * k; }
    if (hol.id === 'valentine') P.glow = shiftCol(P.glow, [255, 90, 140], 0.3 * k);
    if (hol.id === 'stpatrick') P.glow2 = shiftCol(P.glow2, [40, 220, 120], 0.3 * k);
    if (hol.id === 'easter') { const pk = 0.35 * k * (L.w.dawn + L.w.golden + 0.3 * L.w.day); P.sky = P.sky.map((c, i) => (i >= 2 ? shiftCol(c, i === 3 ? [255, 222, 236] : [214, 190, 240], pk) : c)); }
    if (hol.id === 'christmas') P.winWarm += 0.2 * k;
  }
  P.winWarm = Math.min(1, P.winWarm);
  // LIVE WEATHER: a grey day under overcast, the city's glow thrown back by low cloud at night, fog softening the distance
  const dayish = clamp(L.w.day + L.w.dawn * 0.6 + L.w.golden * 0.4), darkish = L.w.night + L.w.late;
  const over = clamp(((L.cloud || 0) - 0.55) / 0.4) + (L.rain ? 0.35 : 0);
  if (over > 0) {
    P.sky = P.sky.map((c, i) => shiftCol(c, [124 + i * 14, 130 + i * 14, 146 + i * 12], Math.min(0.62, over * 0.55) * dayish));
    // at night low cloud glows with the city: warm magenta at the horizon, a lid of violet above
    P.sky = P.sky.map((c, i) => shiftCol(c, i >= 2 ? [70, 34, 92] : [26, 20, 50], Math.min(0.5, over * 0.45) * darkish));
    P.glow = shiftCol(P.glow, [190, 80, 170], 0.3 * over * darkish); P.glow[3] = Math.min(0.6, P.glow[3] * (1 + 0.5 * over * darkish));
    P.stars *= Math.max(0, 1 - over * 1.1);
    P.moonA *= Math.max(0.25, 1 - over * 0.6);
    P.sun *= Math.max(0, 1 - over);
    P.rim[3] *= Math.max(0, 1 - over);
  }
  if (L.rain) { P.hazeA *= 1.12; P.refl = Math.min(1.25, P.refl * 1.25); }   // wet streets shine
  if (L.fog > 0.05) {
    const f = L.fog;
    P.haze = shiftCol(P.haze, darkish > 0.5 ? [120, 96, 150] : [214, 216, 224], 0.45 * f);
    P.hazeA *= 1 + f * 0.9;
    P.tintA = Math.min(0.92, P.tintA + f * 0.3); P.tint = shiftCol(P.tint, darkish > 0.5 ? [60, 46, 88] : [170, 174, 186], 0.5 * f);
    P.stars *= 1 - f; P.refl *= 1 - 0.35 * f;
  }
  return P;
}

export const css = (c, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${c.length > 3 && a === 1 ? c[3] : a})`;
