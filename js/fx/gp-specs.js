// GARDEN PARTY (THE GARDEN PARTY PASS, Nov 21 — docs/vault.md "GARDEN PARTY") — the LV 34 epic card, as data (PURE — no imports; js/fx/gp-card.js
// draws it, vault/hero.js + vault/layout.js read the hero boxes, tests/garden-party.test.mjs the numbers). The art = assets/vault/gp/garden.webp,
// 1280 × 720 (Grok's master — scripts/build-garden-party.mjs); `strip` / `full` = the CSS crop, exactly `background: … px% py% / Z% auto` by
// the WIDTH (the JAYWALK cards' own mapping — js/fx/jw-specs.js#jwMap), the SAME numbers as css/vault.css .vl-s-gp-garden / .vl-fcm-gp-garden.
// The strip is framed ON THE BOUQUET (the owner, Nov 14 + Nov 21): zoomed in so the flowers fill the strip — the bouquet's heart ≈ 0.78 across,
// the blurred rose garden behind the plate (THE SLIM-CARD LONG-NAME STANDARD: room for a 12-letter name). The full card's art fills the card
// (1.586 : 1 — 113 % by its width), set right. Every position in ART px, measured on the real pixels (art/garden-party/src/ + the build).
//   hero     [x, y, w, h] — the strip's MAIN FEATURE (THE HERO-SPOT RULE — vault/hero.js)
//   heroFull [x, y, w, h] — the full card's (THE PLATE PLACEMENT RULE keeps the plate off it — vault/layout.js)
// THE FX: PETALS = the 8 petals cut out of garden-fx-petals.png into ONE sheet (gp-petals.webp): [sx, sy, sw, sh (the sheet), cx, cy (the
// petal's centre on the 1280 × 720 plate)] · SPARKLE_BOX = gp-sparkle.webp's crop of the plate (original px; the WebP is half) · GLINTS = the
// sparkle plate's brightest starbursts [x, y, peak] (the build finds them).
export const GP_AW = 1280, GP_AH = 720;
export function gpMap(w, h, crop) {
  const k = crop[3] === 'w' ? (w / GP_AW) * crop[2] : Math.max(w / GP_AW, h / GP_AH) * (crop[2] || 1);
  return { k, ox: (w - GP_AW * k) * (crop[0] / 100), oy: (h - GP_AH * k) * (crop[1] / 100) };
}
export const GP_SPECS = Object.freeze({
  'card-garden': { art: 'garden', strip: [57, 26, 1.2, 'w'], full: [100, 50, 1.13, 'w'], ground: '#5b4552',
    hero: [840, 150, 210, 190],          // the bouquet's heart: the lilac rose + the peach peony (centre 0.78 across, clear of the gem)
    heroFull: [820, 40, 380, 620] },     // the bouquet's face, the vase's right, the teacup + the macarons (its left third may sit under the plate — refine 1: a 12-letter name on one line)
});
export const SPARKLE_BOX = Object.freeze([558, 22, 700, 590]);   // (the plate's light, measured by the build: its border 0)
export const PETALS = Object.freeze([[4, 4, 76, 76, 1050, 88], [84, 4, 74, 73, 827, 126.5], [162, 4, 82, 78, 888, 253], [248, 4, 76, 81, 1042, 329.5],
  [328, 4, 76, 72, 729, 372], [408, 4, 74, 75, 849, 453.5], [486, 4, 77, 75, 1021.5, 513.5], [567, 4, 90, 83, 654, 551.5]].map(r => Object.freeze(r)));
export const GLINTS = Object.freeze([[1050, 440, 251], [864, 336, 249], [802, 396, 245], [680, 356, 232], [810, 238, 231], [1106, 366, 231], [1076, 184, 226],
  [928, 116, 219], [1222, 366, 215], [902, 462, 213], [1134, 272, 209], [832, 484, 205], [896, 252, 203], [1016, 298, 201]].map(r => Object.freeze(r)));
