// THE PASSWORD's card (PW2 — docs/password.md "THE REWARDS") as data (PURE — no imports; js/fx/pw-cards.js draws it, vault/hero.js +
// vault/layout.js read the hero boxes). The art = assets/vault/pw/safecracker.webp, 1280 × 720 (Grok's master — scripts/build-pw-cards.mjs;
// art/pw-cards/src/notes.txt: the door at ~40–81 % across, centred vertically; the vault wall dark on the left for the plate; faint gold dust
// toward the top-right corner, no highlight under the gem). `strip` / `full` = the CSS crop (background-position %), the same numbers as
// css/vault.css .vl-s-pw-*. Every position in ART pixels.
//   hero     [x, y, w, h] — the strip's MAIN FEATURE (THE HERO-SPOT RULE — vault/hero.js): the wheel + the open door's gold
//   heroFull [x, y, w, h] — the full card's (THE PLATE PLACEMENT RULE keeps the plate off it — vault/layout.js)
export const PW_AW = 1280, PW_AH = 720;
/** the art → slot mapping, exactly the CSS `background: … px% py% / cover` of a 1280 × 720 picture: { k, ox, oy } */
export function pwMap(w, h, crop) {
  const k = Math.max(w / PW_AW, h / PW_AH);
  return { k, ox: (w - PW_AW * k) * (crop[0] / 100), oy: (h - PW_AH * k) * (crop[1] / 100) };
}
export const PW_SPECS = Object.freeze({
  'card-safecracker': { art: 'safecracker', strip: [50, 50], full: [50, 50],
    hero: [560, 110, 480, 500],          // the wheel + the door's open edge + the gold blaze (centre ≈ 0.62 across)
    heroFull: [520, 60, 600, 600],        // the whole door (the plate may cover the dark wall's left)
    wheel: [705, 350, 150],               // the wheel's centre + radius (the glint runs round its rim)
    blaze: [930, 350, 170, 240],          // the gold inside the doorway (it breathes)
    dust: [900, 160, 380, 460] },         // where the gold dust drifts (right of the door, off the right edge)
});
