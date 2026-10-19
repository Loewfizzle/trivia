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
export const LOOKS = { night: NIGHT, late: LATE, dawn: DAWN, day: DAY, golden: GOLDEN };

const mixN = (a, b, t) => a + (b - a) * t;
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
  // a rainy hour is a little greyer by day
  if (L.rain) { P.sky = P.sky.map(c => shiftCol(c, [118, 124, 140], 0.25 * (L.w.day + L.w.dawn * 0.5))); P.cloud[3] = Math.min(0.5, P.cloud[3] * 1.4); P.stars *= 0.2; }
  return P;
}

export const css = (c, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${c.length > 3 && a === 1 ? c[3] : a})`;
