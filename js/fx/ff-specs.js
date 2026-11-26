// FREEFALL CARDS — THE ART AS DATA (F4A — docs/freefall.md "THE CARDS"): SPLASHDOWN · TERMINAL VELOCITY · ROCK BOTTOM (PURE — no imports),
// in JAYWALK's + HIGH RISE's own format (js/fx/jw-specs.js · js/fx/hi-specs.js). HIDDEN until go-live — awarded only from a server-judged
// run once counting is ON: api/_lib/catalog.js (the three cards + their achievements — the feats of the SERVER's replay: reachedHarbor →
// `harbor` · terminal → `terminal` · reachedBottom → `bottom`), js/vault/catalog.js (THE LAB 231–236), js/vault/strip.js (the materials),
// css/vault.css `.vl-s-ff-*` / `.vl-fcm-ff-*` (the numbers below), vault/hero.js + vault/layout.js (the hero boxes), api/_lib/lab-text.js.
// Each card's art = assets/vault/ff/<art>.webp, 1280 × 720 (Grok's masters, 1920 × 1080 — the owner's delivery Downloads\grok\freefall\cards
// / Downloads\NEON\art-src\freefall\cards: RAW ART OFF GIT; scripts/build-freefall-cards.mjs converts them + draws the slim / full
// previews these numbers were judged on).
//   strip / full = the CSS crop, exactly `background: … px% py% / Z% auto` (THE SLIM-CARD LONG-NAME STANDARD: the picture set RIGHT, the
//     strip's hero ≈ 0.78–0.8 across, the left its dark ground for a 12-letter name; the full card's art set right at 80 % by its
//     WIDTH — crop[3] 'w'): the same mapping as js/fx/jw-specs.js#jwMap
//   hero / heroFull [x, y, w, h] in ART px — the strip's / the full card's MAIN FEATURE (THE HERO-SPOT RULE)
//   ground = the dark the left of the card fades into (the art's own left edge, measured)
export const FF_AW = 1280, FF_AH = 720;
export const FF_SPECS = Object.freeze({
  // SPLASHDOWN (floor 120 — reachedHarbor): the glowing ball plunging out of a pink-violet shaft of light into the dark harbor — the ball
  // at (970, 305), its splash crown under it to y ≈ 460, bubbles below the surface. The left: near-black navy (#01000e).
  'card-splashdown': { art: 'splashdown', strip: [100, 42, 0.86], full: [100, 50, 0.8, 'w'], ground: '#01000e',
    hero: [850, 210, 240, 270],          // the ball + the heart of its splash crown (clear of the tier gem's corner)
    heroFull: [780, 0, 400, 700] },      // the shaft of light, the ball, the crown, the bubbles
  // TERMINAL VELOCITY (15 floors in a row without a bounce — `terminal`; Grok's v1: the ORANGE fire): the burning ball smashing down
  // through four neon rings, shards flying — the ball at (955, 390), the rings x 760 … 1200. The left: black.
  'card-terminalvelocity': { art: 'terminal-velocity', strip: [100, 57, 0.86], full: [100, 50, 0.8, 'w'], ground: '#000000',
    hero: [840, 280, 240, 230],          // the ball + its fire
    heroFull: [750, 20, 470, 690] },     // the fire trail, the rings, the shards
  // ROCK BOTTOM (floor 200 — reachedBottom): the golden ball on the seabed, the rings of light round it in the sand, the tower's rings
  // above it — the ball at (955, 490), the tower x 860 … 1040, y 60 … 400. The left: black.
  'card-rockbottom': { art: 'rock-bottom', strip: [100, 83, 0.86], full: [100, 50, 0.8, 'w'], ground: '#000001',
    hero: [815, 395, 265, 260],          // the ball + the first rings in the sand (clear of the tier gem's corner)
    heroFull: [740, 60, 440, 620] },     // the tower above, the ball, the seabed's rings
});
