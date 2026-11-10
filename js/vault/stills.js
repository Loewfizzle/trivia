// LOAD FIX 3 — NO BLACK TILES (the owner, Nov 10; found in PD-5B): a card DRAWN IN CODE has a near-black material — its whole picture is its
// effect (js/fx/…). Wherever no effect paints it (the after-match tile, THE LAB's grid, a strip past the effect budget, the moment before the
// first frame) it showed a BLACK tile. Each card here has its STILL FRAME baked (the effect's own reduced-motion frame — the strip's and the
// full card's) by `node scripts/build-card-stills.mjs "<browser>"` into assets/vault/still/<card>-s.webp / -f.webp, wired as its material by
// the GENERATED block at the end of css/vault.css: shown only on an element the effect has NOT painted (fx/renderer.js marks a painted slot
// `.fx-on`), so a live card never shows the still under its effect — no doubled picture, no look change where the effect runs.
// A NEW card whose art is drawn in code = its row here + the build; `tests/card-stills.test.mjs` fails on a dark material that has neither a
// still nor a place on its CSS_ART list. The art itself unchanged → no LAB_V bump (re-run the build after an effect's art edit).
//   s: the strip's still · f: the full card's still (PRISM DROP's three keep PD-5B's own full material — assets/vault/pd/)
export const STILLS = Object.freeze({
  'card-inferno': 'sf', 'card-prism': 'sf', 'card-noir': 'sf', 'card-legend': 'sf', 'card-marquee-gold': 'sf', 'card-neoncamo': 'sf',
  'card-penthouse': 'sf', 'card-wildfire': 'sf', 'card-eternal': 'sf', 'card-witness': 'sf', 'card-founder': 'sf', 'card-house': 'sf',
  'card-dev-source': 'sf',
  // THE 8 SIGHTING CARDS (THE VAULT 1C — the city's own models)
  'card-sg-ufo': 'sf', 'card-sg-tr3b': 'sf', 'card-sg-blackbird': 'sf', 'card-sg-f22': 'sf', 'card-sg-ghostship': 'sf', 'card-sg-aurora': 'sf',
  'card-sg-fireball': 'sf', 'card-sg-skull': 'sf',
  // PRISM DROP's three (PD-5B baked their full cards; their strips here)
  'card-first-ko': 's', 'card-perfect-clear': 's', 'card-comeback': 's',
});
/** the cards whose material IS their picture in CSS (a gradient, a pattern, an image) — they read with no effect running */
export const CSS_ART = Object.freeze(['card-brushed', 'card-smoke', 'card-frostbite', 'card-marquee', 'card-glitter', 'card-gilded', 'card-midnight',
  'card-brass', 'card-heartbreaker', 'card-emerald', 'card-neonglass', 'card-chrome', 'card-champagne', 'card-sg-btc', 'card-zebra', 'card-camo',
  'card-velvet', 'card-aurora', 'card-rosegold', 'card-gold', 'card-flame30', 'card-marble', 'card-carbon', 'card-confetti', 'card-circuit',
  'card-sapphire', 'card-century', 'card-platinum', 'card-dev-switchboard']);
