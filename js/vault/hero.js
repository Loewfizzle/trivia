// THE HERO-SPOT RULE (the owner, Nov 4 4:16 pm + Nov 5 — THE HERO-SPOT AUDIT, SHELL 2.0 B2): every slim strip's MAIN FEATURE sits in the
// MIDDLE → MIDDLE-RIGHT, clear of the stepped plate (left) + the tier gem (the bottom-right corner); the plate NEVER sits over a card's
// art element. PURE (no imports): each card with a focal element declares WHERE its effect draws it on the strip, as fractions of the
// strip [x, y, w, h] — the effect's own layout numbers (js/fx/<effect>.js, the strip branch), one box per element. A card whose art is a
// GROUND (flames, smoke, sheen, glitter, confetti, a material …) has no hero and is not listed. A NEW card with a focal element = its row.
// THE GIFT CARDS (SHELL 2.0 B2): their hero = the spec's face box (js/fx/gift-specs.js `hero`, art px) through the strip's own crop at the
// nominal strip size (358 × 64) — one source, the same numbers the CSS + the effect use.
// Checked: tests/shell-b2.test.mjs (the band + the gem's corner) + harbor-e2e/lobbyfix.mjs 'platefit' (the live plate at 390 / 402 / 430).
import { GIFT_SPECS } from '../fx/gift-specs.js';
export const HERO_BAND = Object.freeze([0.6, 0.84]);           // (where a hero's centre may sit, across the strip: right of a 10-letter name's
                                                               //  plate on every phone — LOEWFIZZLE's name row ends at 0.58 at 390)
export const GEM_BOX = Object.freeze([0.88, 0.5, 0.12, 0.5]);  // (the tier gem's corner + its glow — css/vault.css .vl-strip .vl-gem)
export const HERO = {
  'card-prism': [[0.55, 0.13, 0.17, 0.74]],                       // the prism (prism.js: 0.63 — B2)
  'card-marquee': [[0.6, 0.33, 0.26, 0.34]],                      // the neon arrow (marquee.js: 0.6 → 0.86 — B2)
  'card-sg-ufo': [[0.51, 0.08, 0.3, 0.84]],                       // the UFO + its beam (ufo.js: 0.66 — B2)
  'card-emerald': [[0.6, 0.25, 0.2, 0.75]],                       // the deco crown (the material: right 24 % — B2)
  'card-champagne': [[0.66, 0.3, 0.22, 0.7]],                     // the arcs (the material)
  'card-sg-tr3b': [[0.47, 0.12, 0.3, 0.56]],                      // the craft (sg-tr3b.js: cx 0.62 — B2)
  'card-sg-f22': [[0.52, 0.05, 0.34, 0.8]],                        // the pair of jets (sg-kit.js: cx 0.7)
  'card-sg-ghostship': [[0.56, 0.1, 0.2, 0.8]],                   // the ship
  'card-sg-fireball': [[0.45, 0, 0.47, 0.45]],                    // the fireball's path (sg-fireball.js: 0.34 → 1.04 across the top)
  'card-sg-skull': [[0.6, 0.04, 0.16, 0.92]],                     // the skull balloon
  'card-sg-btc': [[0.52, 0.04, 0.34, 0.76]],                       // the ₿ balloons
  'card-camo': [[0.64, 0.25, 0.12, 0.5]],                         // the scope's reticle (scan.js: 0.7 — B2)
  'card-eternal': [[0.57, 0.05, 0.14, 0.9]],                      // the eternal flame
  'card-century': [[0.55, 0.2, 0.14, 0.6]],                       // the sunburst's heart (deco.js: 0.62 — B2)
  'card-founder': [[0.55, 0.14, 0.24, 0.72]],                     // NEON SPEAKEASY (opening.js: 0.66)
  'card-dev-switchboard': [[0.61, 0.3, 0.18, 0.6], [0.785, 0.1, 0.19, 0.4]],   // the jacks (0.635 → 0.765 — B2) + ON AIR (dev-switch.js)
  'card-dev-source': [[0.58, 0.24, 0.25, 0.52]],                  // NEON in the code rain (dev-source.js: 0.705 — B2)
};
// (the gift cards' boxes: art px → the strip's fractions, exactly as js/fx/gift.js#artMap maps them)
const AW = 1280, AH = 800, SW = 358, SH = 64;
for (const [id, S] of Object.entries(GIFT_SPECS)) {
  if (!S.hero) continue;
  const k = Math.max(SW / AW, SH / AH), ox = (SW - AW * k) * S.strip[0] / 100, oy = (SH - AH * k) * S.strip[1] / 100, [x, y, w, h] = S.hero;
  const y0 = Math.max(0, (oy + y * k) / SH), y1 = Math.min(1, (oy + (y + h) * k) / SH);
  HERO[id] = Object.freeze([[(ox + x * k) / SW, y0, (w * k) / SW, Math.max(0.05, y1 - y0)]]);
}
/** do two boxes [x, y, w, h] overlap? */
export const overlaps = (a, b) => a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3];
/** the rule's pure half: every element's centre in the band, none over the gem's corner → the cards that break it */
export function heroMisses() {
  const bad = [];
  // (the FIRST box is the main feature — its centre in the band; a card's other elements only keep clear of the gem, e.g. ON AIR up in the
  //  top-right corner, above the gem)
  for (const [id, boxes] of Object.entries(HERO)) boxes.forEach((b, i) => {
    const cx = b[0] + b[2] / 2;
    if ((!i && (cx < HERO_BAND[0] || cx > HERO_BAND[1])) || overlaps(b, GEM_BOX) || b[0] + b[2] > 1) bad.push(id);
  });
  return [...new Set(bad)];
}
