// THE PASSWORD's card (PW2 — docs/password.md "THE REWARDS") as data (PURE — no imports; js/fx/pw-cards.js draws it, vault/hero.js +
// vault/layout.js read the hero boxes). The art = assets/vault/pw/safecracker.webp, 1280 × 720 (Grok's master — scripts/build-pw-cards.mjs;
// art/pw-cards/src/notes.txt: the door at ~40–81 % across, centred vertically; the vault wall dark on the left for the plate; faint gold dust
// toward the top-right corner, no highlight under the gem). `strip` / `full` = the CSS crop (background-position %), the same numbers as
// css/vault.css .vl-s-pw-*. Every position in ART pixels.
//   hero     [x, y, w, h] — the strip's MAIN FEATURE (THE HERO-SPOT RULE — vault/hero.js): the wheel + the open door's gold
//   heroFull [x, y, w, h] — the full card's (THE PLATE PLACEMENT RULE keeps the plate off it — vault/layout.js)
export const PW_AW = 1280, PW_AH = 720;
/** the art → slot mapping, exactly the CSS `background: … px% py% / cover` of a 1280 × 720 picture: { k, ox, oy } */
// (BOARD 2.0 B — THE LONG-NAME FIX: crop[3] === 'w' = a zoom by the card's WIDTH — exactly the CSS "Z% auto" — so a full card whose art is set right
//  + zoomed out maps its effects + its hero box onto the art the CSS really draws; THE CARD PASS's strip zoom had shrunk the full card's art too)
export function pwMap(w, h, crop) {
  // (THE CARD PASS: crop[2] = a zoom OUT, like the gift cards' — the art then sits right, the strip's left its dark ground: THE SLIM-CARD LONG-NAME STANDARD)
  const k = crop[3] === 'w' ? (w / PW_AW) * crop[2] : Math.max(w / PW_AW, h / PW_AH) * (crop[2] || 1);
  return { k, ox: (w - PW_AW * k) * (crop[0] / 100), oy: (h - PW_AH * k) * (crop[1] / 100) };
}
export const PW_SPECS = Object.freeze({
  'card-safecracker': { art: 'safecracker', strip: [100, 37, 0.46], full: [100, 50, 0.78, 'w'],   // (BOARD 2.0 B: the full card's art set right at 78 % — a 12-letter name on ONE line)   // (THE CARD PASS: the strip zoomed out + set right — the wheel 0.50 → 0.77 across)
    hero: [530, 80, 380, 560],           // the wheel + the door's open edge (THE CARD PASS: the gold blaze behind it runs on under the gem)
    heroFull: [556, 70, 354, 580],        // the door + its wheel from its pink rim's inner edge (THE CARD PASS: the gold blaze, the dark wall + the rim's glow may sit beside a 12-letter name's plate)
    wheel: [705, 350, 150],               // the wheel's centre + radius (the glint runs round its rim)
    blaze: [930, 350, 170, 240],          // the gold inside the doorway (it breathes)
    dust: [900, 160, 380, 460] },         // where the gold dust drifts (right of the door, off the right edge)
});
