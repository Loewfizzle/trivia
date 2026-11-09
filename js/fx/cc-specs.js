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
// (BOARD 2.0 B — THE LONG-NAME FIX: crop[3] === 'w' = a zoom by the card's WIDTH — exactly the CSS "Z% auto" — so a full card whose art is set right
//  + zoomed out maps its effects + its hero box onto the art the CSS really draws; THE CARD PASS's strip zoom had shrunk the full card's art too)
export function ccMap(w, h, crop) {
  // (THE CARD PASS: crop[2] = a zoom OUT, like the gift cards' — the art then sits right, the strip's left its dark ground: THE SLIM-CARD LONG-NAME STANDARD)
  const k = crop[3] === 'w' ? (w / CC_AW) * crop[2] : Math.max(w / CC_AW, h / CC_AH) * (crop[2] || 1);
  return { k, ox: (w - CC_AW * k) * (crop[0] / 100), oy: (h - CC_AH * k) * (crop[1] / 100) };
}
export const CC_SPECS = Object.freeze({
  'card-ghost-run': { art: 'ghost-run', strip: [100, 70, 0.653], full: [100, 56, 0.78, 'w'],   // (BOARD 2.0 B: the full card's art set right at 78 % — a 12-letter name on ONE line)   // (THE CARD PASS: the strip zoomed out + set right — the cabin 0.65 → 0.77 across)
    hero: [640, 370, 380, 130],          // (THE CARD PASS: the cabin + the hull's middle — the bow's tip runs on under the gem)          // the boat's cabin + hull (the spray trails left of it; the bow's tip runs on under the gem — its dark backing, css/vault.css)
    heroFull: [560, 340, 640, 240],      // the boat (THE CARD PASS: its spray may trail under a 12-letter name's plate — the boat itself stays clear)
    spray: [600, 470],                   // the bow wave's root — the spray flies back + up to the left from here
    lamp: [1095, 303],                   // the lighthouse's lamp (its glow breathes, its beam sweeps)
    cross: [852, 118],                   // where the two searchlight beams cross (a soft shimmer)
    trim: [580, 445, 1170, 432] },       // the hull's cyan trim line (a light runs along it now and then)
});
