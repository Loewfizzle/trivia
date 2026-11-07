// COAST CLEAR's card (CC2 — docs/coastclear.md "THE REWARDS") as data (PURE — no imports; js/fx/cc-cards.js draws it, vault/hero.js +
// vault/layout.js read the hero boxes). The art = assets/vault/cc/ghost-run.webp, 1280 × 720 (Grok's master — scripts/build-cc-cards.mjs;
// art/cc-cards/src/notes.txt: the boat racing right sits LOW — "anchor the strip crop about 8-10% lower"; the spray from ~30 % across; two
// searchlight beams crossing from the upper right; a lighthouse on the right horizon; the gem corner dark). `strip` / `full` = the CSS crop
// (background-position %), the same numbers as css/vault.css .vl-s-cc-*. Every position in ART pixels.
//   strip [x%, y%] — THE STRIP sits ~10 % lower than centre (a per-card value — the owner, CC2): 64 % down keeps the hull + its cyan trim in the band
//   hero     [x, y, w, h] — the strip's MAIN FEATURE (THE HERO-SPOT RULE — vault/hero.js): the boat (its centre ≈ 0.68 across — the left stays clear
//            for a long player name)
//   heroFull [x, y, w, h] — the full card's (THE PLATE PLACEMENT RULE keeps the plate off it — vault/layout.js)
export const CC_AW = 1280, CC_AH = 720;
/** the art → slot mapping, exactly the CSS `background: … px% py% / cover` of a 1280 × 720 picture: { k, ox, oy } */
export function ccMap(w, h, crop) {
  const k = Math.max(w / CC_AW, h / CC_AH);
  return { k, ox: (w - CC_AW * k) * (crop[0] / 100), oy: (h - CC_AH * k) * (crop[1] / 100) };
}
export const CC_SPECS = Object.freeze({
  'card-ghost-run': { art: 'ghost-run', strip: [50, 64], full: [50, 56],
    hero: [600, 380, 500, 150],          // the boat's cabin + hull (the spray trails left of it; the bow's tip runs on under the gem — its dark backing, css/vault.css)
    heroFull: [380, 340, 800, 260],      // the boat + its spray (the plate keeps to the dark water / sky on the left)
    spray: [600, 470],                   // the bow wave's root — the spray flies back + up to the left from here
    lamp: [1095, 303],                   // the lighthouse's lamp (its glow breathes, its beam sweeps)
    cross: [852, 118],                   // where the two searchlight beams cross (a soft shimmer)
    trim: [580, 445, 1170, 432] },       // the hull's cyan trim line (a light runs along it now and then)
});
