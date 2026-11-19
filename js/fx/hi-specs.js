// HIGH RISE CARDS — THE ART, PREPARED (S3 — docs/highrise.md "THE CARDS' ART"): ABOVE THE CLOUDS + TOP OF THE WORLD as data (PURE — no
// imports), in JAYWALK's own format (js/fx/jw-specs.js). **NOTHING READS THIS YET**: no catalog entry, no CSS class, no achievement —
// the two cards are ADDED + AWARDED in S4 (server-judged runs only, hidden until go-live). S4 wires: js/vault/catalog.js +
// api/_lib/catalog.js (the feats: tuning.js CLOUDS_FLOOR 60 → reachedClouds · TOP_FLOOR 200 → reachedTop), css/vault.css
// `.vl-s-hi-*` / `.vl-fcm-hi-*` from the numbers below, js/vault/strip.js, the stills, the lab's text.
// Each card's art = assets/vault/hi/<art>.webp, 1280 × 720 (Grok's masters — art/highrise-cards/src/, copies of the owner's delivery;
// scripts/build-highrise-cards.mjs converts them + draws the slim / full previews these numbers were judged on).
//   strip / full = the CSS crop, exactly `background: … px% py% / Z% auto` (THE SLIM-CARD LONG-NAME STANDARD: the picture set RIGHT, the
//     strip's hero ≈ 0.78–0.8 across, the left its dark ground for a 12-letter name; the full card's art set right at 80 % by its
//     WIDTH — crop[3] 'w'): the same mapping as js/fx/jw-specs.js#jwMap
//   hero / heroFull [x, y, w, h] in ART px — the strip's / the full card's MAIN FEATURE (THE HERO-SPOT RULE)
//   ground = the dark the left of the card fades into (the art's own left edge, measured)
export const HI_AW = 1280, HI_AH = 720;
export const HI_SPECS = Object.freeze({
  // ABOVE THE CLOUDS (floor 60 — reachedClouds): the glowing glass tower standing out of a sea of night clouds; its lit top slab at
  // (990, 85), the tower x 905 … 1080 down to the clouds at y ≈ 600. The left third: quiet dark navy (mean L 5).
  'card-abovetheclouds': { art: 'above-the-clouds', strip: [100, 9, 0.86], full: [100, 50, 0.8, 'w'], ground: '#05060d',
    hero: [900, 50, 190, 260],           // the lit top + the first slabs under it
    heroFull: [890, 50, 205, 570] },     // the whole tower above the clouds
  // TOP OF THE WORLD (floor 200 — reachedTop; Grok's v2: the colossal ship): the mothership's underside fills the top of the frame and
  // runs off the top + right edges; a white-gold light pours from its belly (915, 330) onto the tower's top slab (915, 495).
  'card-topoftheworld': { art: 'top-of-the-world', strip: [100, 70, 0.8], full: [100, 50, 0.8, 'w'], ground: '#020203',
    hero: [800, 310, 250, 260],          // the light + the top slabs it falls on
    heroFull: [740, 130, 370, 560] },    // the ship's belly, the light, the tower's top
});
