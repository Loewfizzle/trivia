// JAYWALK CARDS (Nov 12 night — docs/harbor/passes/jaywalk-cards.md; H6A: + BEAM ME UP, RIGHT OF WAY's redone picture) — SONIC BOOM · CLOSE ENCOUNTER · RIGHT OF WAY · BEAM ME UP, as data (PURE — no imports;
// js/fx/jw-cards.js draws them, vault/hero.js + vault/layout.js read the hero boxes, tests/jaywalk-cards.test.mjs the timing). Each card's art =
// assets/vault/jw/<art>.webp, 1280 × 720 (Grok's masters — scripts/build-jaywalk-cards.mjs); `strip` / `full` = the CSS crop (background-position %
// + a zoom OUT — THE SLIM-CARD LONG-NAME STANDARD: the strip's hero centred ≈ 0.78 across, the left its dark ground for a 12-letter name; the full
// card's art set right at 80 % by its WIDTH — crop[3] 'w'), the SAME numbers as css/vault.css .vl-s-jw-* / .vl-fcm-jw-*. Every position in ART px,
// measured on the real pixels (art/jaywalk-cards/src/ + the build's own fits).
//   hero     [x, y, w, h] — the strip's MAIN FEATURE (THE HERO-SPOT RULE — vault/hero.js)
//   heroFull [x, y, w, h] — the full card's (THE PLATE PLACEMENT RULE keeps the plate off it — vault/layout.js)
// THE FX PLATES (light with alpha, cropped to their light + halved by the build): `PLATES[n]` = the crop box in the plate's ORIGINAL px (1280 × 720)
// — the drawn image is half that; every anchor below is in original plate px.
export const JW_AW = 1280, JW_AH = 720;
/** the art → slot mapping, exactly the CSS `background: … px% py% / Z% auto` (strip — × the cover scale) or `Z% auto` by the width ('w' — the full
 *  card) of a 1280 × 720 picture: { k, ox, oy } */
export function jwMap(w, h, crop) {
  const k = crop[3] === 'w' ? (w / JW_AW) * crop[2] : Math.max(w / JW_AW, h / JW_AH) * (crop[2] || 1);
  return { k, ox: (w - JW_AW * k) * (crop[0] / 100), oy: (h - JW_AH * k) * (crop[1] / 100) };
}
/** the FX plates' crop boxes (original plate px — the build prints them; tests/jaywalk-cards.test.mjs checks each WebP = half its box) */
export const PLATES = Object.freeze({
  afterburner: [214, 272, 988, 178],   // one right-pointing plume: the nozzle (white-hot) at x 255, the axis y 358.5
  shockring: [360, 47, 570, 598],      // a face-on ring: centre (638, 344), its bright band r 217
  beam: [436, 27, 400, 672],           // the cone: the tip (639, 42), the pool (639, 655) ~314 wide
  trails: [120, 154, 1064, 412],       // seven streaks converging to the right at (1170, 392)
  hop: [132, 187, 718, 400],           // the arc: start (148, 567) → peak (614, 236) → the puff (750, 310); its first third faded to clear (the build)
});
export const JW_SPECS = Object.freeze({
  // SONIC BOOM · rare — the jet through the barrier over the voxel city: the vapor cone where the fuselage crosses the halo's left rim (700, 360 —
  // 54.7 % across); the two plumes from the nozzles (white-hot at x 1041 / 914) down-right toward the edge
  'card-sonicboom': { art: 'sonic-boom', strip: [100, 55, 0.69], full: [100, 50, 0.8, 'w'],
    hero: [690, 260, 360, 200],          // the vapor cone + the tails + the engines (the plumes run on under the gem)
    heroFull: [680, 90, 500, 540],       // the whole halo + the engines (the plate may cover the nose, as on the strip)
    cone: [700, 360],                    // the ring bursts out of here (+ the white flash)
    ring: 265,                           // the burst's radius at its widest (art px; the halo's own ~ 232 × 265)
    // the plumes: [nozzle x, y, angle°, scale] — one plate drawn twice, fitted to each
    plumes: [[1048, 373, 9, 0.62], [920, 434, 7.6, 0.72]],
    city: [700, 490, 580, 120] },        // the voxel city's lights (they dip as the ring passes)
  // CLOSE ENCOUNTER · rare — the saucer over the road: its belly glow (895, 318), the beam's pool on the road (875, 568); the cars' light trails
  // converge up-right toward the far car (790, 528) — the build darkened them in the lower-left corner (the plate's calm)
  'card-closeencounter': { art: 'close-encounter', strip: [100, 36, 0.76], full: [100, 50, 0.8, 'w'],
    hero: [780, 150, 260, 260],          // the saucer's belly + the beam's top (its rims run on beside the gem)
    heroFull: [690, 110, 440, 470],      // the saucer + the beam + its pool
    belly: [895, 318], pool: [875, 568], // the beam's plate: its tip at the belly, its pool on the road
    beamK: [0.8, 0.408],                 // the plate's scale (x, y): the pool ~250 wide, tip → pool 250 tall
    vanish: [790, 528], trailAng: -25, trailK: 0.56,   // the trails' plate: its converging point at the far car, turned up-right
    calmX: [380, 540] },                 // the sheen fades in across here (never over the plate's corner)
  // RIGHT OF WAY · legendary — H6A: Grok's REDONE picture (Nov 16 — the game's real kid: the forward cap, the pink T-shirt; the hoodie art is
  // art/jaywalk-cards/src/right-of-way-old.png): the kid mid-run on the runway (he leads: THE PROMINENCE RULE), his trailing hip (842, 505); the
  // blue runway lights in two rows from the far end toward the camera (measured on the picture; the right row's far end is behind him)
  'card-rightofway': { art: 'right-of-way', strip: [100, 50, 0.7], full: [100, 50, 0.8, 'w'],
    hero: [800, 280, 260, 250],          // the kid: his cap, his face, his shirt
    heroFull: [790, 275, 275, 360],      // the kid
    hip: [842, 505],                     // the hop's puff lands here (the plate slides: its puff 750, 310 → here)
    rows: [[[823, 437], [800, 446], [768, 459], [722, 479], [684, 495], [621, 522], [549, 549]],
      [[1065, 496], [1123, 521], [1201, 552], [1290, 588]]] },
  // BEAM ME UP · epic (H6A — THE MOTHERSHIP's card): the kid afloat in the white-gold beam under the colossal ship — the belly's bright disc
  // (930, 300), the pool's ring on the road (930, 665 — ~146 wide each way), the ring of lights round the belly
  'card-beammeup': { art: 'mothership', strip: [100, 61, 0.7], full: [100, 50, 0.8, 'w'],
    hero: [840, 330, 190, 220],          // the kid in the beam
    heroFull: [800, 240, 280, 360],      // the belly's light + the kid
    belly: [930, 300], pool: [930, 665], poolR: [146, 30],
    ring: [930, 292, 196, 58],           // the belly's lit rim: centre, rx, ry — the lights chase round it
    kid: [935, 455] },                   // the motes rise past him
});
// ---- the motion's timing (PURE — the effect + the tests read the same curves)
export const RING_EVERY = 4, RING_DUR = 0.9, HOP_EVERY = 5, HOP_DRAW = 0.8, LIFT_EVERY = 3.2;
const sm = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const fr = v => v - Math.floor(v);
/** SONIC BOOM's ring at t s: { u (0 → 1 over the burst, -1 between), scale (0.6 → 1.15), a (bright → gone), flash, dip } */
export function ringAt(t, still) {
  if (still) return { u: 0.35, scale: 0.6 + 0.55 * 0.35, a: 0.7, flash: 0.25, dip: 0.3 };
  const ph = fr(t / RING_EVERY) * RING_EVERY;
  if (ph >= RING_DUR) return { u: -1, scale: 0, a: 0, flash: 0, dip: 0 };
  const u = ph / RING_DUR, e = 1 - Math.pow(1 - u, 2.2);   // (fast out, easing as it spreads)
  return { u, scale: 0.6 + 0.55 * e, a: Math.pow(1 - u, 1.3), flash: u < 0.18 ? 1 - u / 0.18 : 0, dip: Math.sin(Math.min(1, u * 1.4) * Math.PI) };
}
/** RIGHT OF WAY's hop at t s: { draw (0 → 1, how much of the arc is drawn), puff (the landing bloom), a (the arc's alpha) } — every HOP_EVERY s */
export function hopAt(t, still) {
  if (still) return { draw: 1, puff: 0.8, a: 0.9 };
  const ph = fr(t / HOP_EVERY) * HOP_EVERY;
  const draw = sm(0, HOP_DRAW, ph);                                        // (the arc draws on toward the kid)
  const puff = ph < HOP_DRAW - 0.1 ? 0 : sm(HOP_DRAW - 0.1, HOP_DRAW + 0.15, ph) * (1 - sm(HOP_DRAW + 0.4, HOP_DRAW + 1.6, ph));
  const a = 1 - sm(HOP_DRAW + 0.5, HOP_DRAW + 2.0, ph);                   // (then the whole arc fades)
  return { draw, puff, a };
}
/** BEAM ME UP's beam at t s: { p (its slow pulse 0 → 1), chase (0 → 1 round the belly's ring), motes: [{ u (0 foot → 1 belly), x (−1 … 1 across), a }] } */
export function liftAt(t, still, n = 7) {
  const p = still ? 0.7 : 0.5 + 0.5 * Math.sin(t * Math.PI * 2 / LIFT_EVERY), motes = [];
  for (let i = 0; i < n; i++) {
    const u = still ? (i + 0.5) / n : fr(t / (LIFT_EVERY * 1.4) + i / n + 0.37 * fr(i * 0.618));
    motes.push({ u, x: fr(i * 0.618 + 0.11) * 2 - 1, a: Math.sin(u * Math.PI) });
  }
  return { p, chase: still ? 0.2 : fr(t / 2.6), motes };
}
