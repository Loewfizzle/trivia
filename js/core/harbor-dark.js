// CITY 2.0 — THE HARBOR: ONE "HOW DARK IS IT" INPUT (cleanup C1.5; docs/harbor.md#how-dark-is-it). PURE.
// Before this, "lit" meant "night": every lighting decision in scene.js read the sky model's darkness (palette.js#P.dark — the
// real sun's altitude through City 1.0's light timeline) with its own little ramp, and a black storm sky at 4 pm could never light
// a window. Now there is ONE value a frame — darkness() — and every lighting decision reads it through a NAMED ramp (LIT): the
// windows, the neon + signs, the lamps (quay, pier, waterfront, the wheel's + the boats' lights), the beams, the lighthouse, the
// strings, the water's reflections, the NEON logo's light on the city, the sky's city glow.
//
// TODAY IT CHANGES NOTHING: the extra terms (DARK_TERMS) are all 0, so darkness() === the sky model's P.dark, and each ramp below
// is the exact threshold its caller used before. THE DAY TOUCH-UP builds the blue-hour staggered power-up on it (a per-light
// stagger over these ramps), PART 9 turns on the storm / cloud terms (clouds.set({ dark }) → storm afternoons light the city),
// and an eclipse (core/sky.js) can join through `eclipse`.
//
// Still on the tone weights (T.night: the COLOUR of the light, baked per look key) and not routed yet — the Day touch-up moves
// them when it builds the power-up: the street lamps + the stop lights' glow (scene.js), the floodlights / the wheel's backdrop /
// the crowns (blocks.js, baked: T.night > 0.05), the boats' + the wheel's own night looks (wheel.js, boats.js: T.night).

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);

/** how much each extra input darkens the city (0 = off). All 0 today: darkness() is the sky model's own darkness. */
export const DARK_TERMS = Object.freeze({ cloud: 0, storm: 0, eclipse: 0 });

/**
 * The city's darkness now, 0 (broad day) .. 1 (night).
 * @param {{ sky?: number, cloud?: number, storm?: number, eclipse?: number }} o
 *   sky: the sky model's darkness (palette.js P.dark); cloud: the real cover 0..1; storm: 0..1 (a storm sky, clouds.set's dark);
 *   eclipse: 0..1 (the sun covered)
 * @param terms the weights (DARK_TERMS unless a test / a later part passes its own)
 * The extras only ever darken (never lighten the night), and saturate toward 1.
 */
export function darkness(o = {}, terms = DARK_TERMS) {
  const sky = clamp01(+o.sky || 0);
  const extra = clamp01((terms.cloud || 0) * clamp01(+o.cloud || 0) + (terms.storm || 0) * clamp01(+o.storm || 0) + (terms.eclipse || 0) * clamp01(+o.eclipse || 0));
  return extra > 0 ? sky + (1 - sky) * extra : sky;
}

/**
 * THE NAMED RAMPS: [from, span] — a light is off below `from` and fully on at `from + span` (each exactly the threshold its
 * caller used before C1.5). Read with litK(k, name).
 */
export const LIT = Object.freeze({
  water: [0.15, 0.5],      // the water's night look: its reflections + light columns (water.js f.night)
  neon: [0.2, 0.5],        // the building neon, the signs, the billboards (neon.js f.night) + the neon's reflections in the water
  city: [0.25, 0.5],       // the city's night light over the skyline (the lit windows' + the beacons' strength)
  lamps: [0.3, 0.45],      // the quay lamps, the waterfront strip, the pier's lamps, the wheel's + the boats' lights (harbor glow)
  strings: [0.3, 0.4],     // the string lights on the speakeasy's roof
  logo: [0.3, 0.5],        // the NEON logo's light on the city under it
  glow: [0.3, 0.5],        // the city's glow on the night air (sky.js)
  beams: [0.35, 0.4],      // the party's sky beams, the lighthouse's beam
});
/** a named ramp of the darkness: 0 (off) .. 1 (fully lit) */
export function litK(k, name) {
  const r = LIT[name];
  return r ? clamp01((k - r[0]) / r[1]) : 0;
}
/** dark enough for the windows' night bake (the light key's switch) */
export const windowsNight = k => k > 0.2;
/** dark enough to call it night (the sign "caught" at power-on, tier 0's calm) */
export const isNight = k => k > 0.5;
