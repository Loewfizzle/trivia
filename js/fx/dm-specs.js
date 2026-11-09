// THE DAILY MODULE's card (DM2 — docs/vault.md "THE DAILY MODULE's cards") as data (PURE — no imports; js/fx/dm-cards.js draws it, vault/hero.js +
// vault/layout.js read the hero boxes). PERFECT WEEK's art = assets/vault/dm/perfect-week.webp, 1280 × 720 (Grok's master — the owner's pick,
// card-perfect-week-backup.png — scripts/build-dm-cards.mjs): neon-tube tickets fanned at ~46–91 % across, a white-hot starburst at the middle one,
// reflections on black glass below. `strip` / `full` = the CSS crop (background-position % + a zoom OUT — THE SLIM-CARD LONG-NAME STANDARD: the
// strip's fan centred ≈ 0.80 across, the left its dark ground for a 12-letter name), the same numbers as css/vault.css .vl-s-dm-*. ART pixels.
//   hero     [x, y, w, h] — the strip's MAIN FEATURE (THE HERO-SPOT RULE — vault/hero.js): the fan + its burst
//   heroFull [x, y, w, h] — the full card's (THE PLATE PLACEMENT RULE keeps the plate off it — vault/layout.js)
export const DM_AW = 1280, DM_AH = 720;
/** the art → slot mapping, exactly the CSS `background: … px% py% / cover` (× the zoom) of a 1280 × 720 picture: { k, ox, oy } */
// (BOARD 2.0 B — THE LONG-NAME FIX: crop[3] === 'w' = a zoom by the card's WIDTH — exactly the CSS "Z% auto" — so a full card whose art is set right
//  + zoomed out maps its effects + its hero box onto the art the CSS really draws; THE CARD PASS's strip zoom had shrunk the full card's art too)
export function dmMap(w, h, crop) {
  const k = crop[3] === 'w' ? (w / DM_AW) * crop[2] : Math.max(w / DM_AW, h / DM_AH) * (crop[2] || 1);
  return { k, ox: (w - DM_AW * k) * (crop[0] / 100), oy: (h - DM_AH * k) * (crop[1] / 100) };
}
export const DM_SPECS = Object.freeze({
  'card-perfect-week': { art: 'perfect-week', strip: [100, 42, 0.648], full: [100, 50, 0.8, 'w'],   // (BOARD 2.0 B: the full card's fan set right at 80 % — a 12-letter name on ONE line)
    hero: [640, 160, 400, 330],          // the fan's middle tickets + the burst (the outer orange ticket runs on beside the gem)
    heroFull: [590, 140, 590, 380],      // the whole fan (the plate keeps left of it)
    burst: [884, 418],                   // the white-hot star at the middle ticket's foot (it breathes)
    // the tickets' top corners, left → right (a light runs along the fan: one ticket a beat — the seven days — then all together)
    tops: [[640, 300, '255,90,210'], [702, 238, '200,110,255'], [778, 190, '120,150,255'], [902, 160, '255,236,250'], [1048, 212, '90,170,255'], [1136, 312, '255,150,70']],
    motes: [700, 160, 420, 300] },       // where the sparks drift (up from the burst, across the fan)
});
