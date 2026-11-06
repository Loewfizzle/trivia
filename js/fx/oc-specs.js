// OVERCLOCK CARDS (Nov 5 night) — REDLINE + PHOTO FINISH, as data (PURE — no imports; js/fx/oc-cards.js draws them, vault/hero.js +
// vault/layout.js read the hero boxes). Each card's art = assets/vault/oc/<art>.webp, 1280 × 720 (Grok's masters — scripts/build-oc-cards.mjs);
// `strip` = the slim strip's crop (the CSS background-position %, the SAME numbers as css/vault.css .vl-s-oc-*), `full` = the full card's.
// Every position in ART pixels, measured on the real pixels (art/oc-cards/src/notes.txt + the build's own fits).
//   hero     [x, y, w, h] — the strip's MAIN FEATURE (THE HERO-SPOT RULE — vault/hero.js)
//   heroFull [x, y, w, h] — the full card's (THE PLATE PLACEMENT RULE keeps the plate off it — vault/layout.js)
export const OC_AW = 1280, OC_AH = 720;
/** the art → slot mapping, exactly the CSS `background: … px% py% / cover` of a 1280 × 720 picture: { k, ox, oy } (gift.js#artMap keeps the gift
 *  art's 800-px height in its drawn height — not for these) */
export function ocMap(w, h, crop) {
  const k = Math.max(w / OC_AW, h / OC_AH);
  return { k, ox: (w - OC_AW * k) * (crop[0] / 100), oy: (h - OC_AH * k) * (crop[1] / 100) };
}
export const OC_SPECS = Object.freeze({
  // the tachometer: the cap's centre (897, 339); the scale runs 131° (7:30, rest) clockwise to 409° (4:30); the red zone 2 → 4:30 o'clock;
  // the needle pegs at 376° (≈ 3:30, deep in the red), its tip at r 232
  'card-redline': { art: 'redline', strip: [50, 47], full: [50, 50],
    hero: [834, 270, 290, 150],          // the cap + the needle pegged in the red (its tip clear of the gem's corner)
    heroFull: [790, 60, 410, 520],       // the cap + the needle's whole sweep in the red + the red zone (the plate may cover the dial's cold left rim, as in the mock)
    cap: [897, 339], rest: 131, peg: 376, over: 393, len: 232 },
  // the top-down finish: the line x 916 → 930 (centre 923); the noses dead even at x 935 — orange 300 (41.7 %), blue 423 (58.7 %)
  'card-photofinish': { art: 'photofinish', strip: [50, 49], full: [50, 50],
    hero: [880, 280, 90, 165],           // the noses on the line
    heroFull: [780, 228, 190, 255],      // the cars' fronts + the noses on the line (the mock: the plate may cover the trails' tips)
    line: 923, noses: [300, 423], trails: [[300, 640, 246, 336, '255,120,40'], [300, 640, 372, 462, '46,168,255']] },
});
