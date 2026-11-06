// SHELL 2.0 B2 — THE GIFT CARDS' MOTION, as data (js/fx/gift.js draws it): each card's art (assets/vault/gift/<art>.webp, 1280 × 800 —
// scripts/build-gift-art.mjs) + its crop on the slim strip (`strip`: the CSS background-position %, the SAME numbers as css/vault.css —
// tests/shell-b2.test.mjs checks they match) + its LAYERS, every position in ART pixels. `on: 'full'` = the full card only (the strip is the
// calmer cut). PURE data — no names (the names are the server's).
//   hero    [x, y, w, h] — the card's MAIN FEATURE (the face) in art px: THE HERO-SPOT RULE checks it on the strip (vault/hero.js)
//   heroFull [x, y, w, h] — the full card's hero (the face + what matters round it — the rifle, the ball …; default `hero`): THE PLATE
//           PLACEMENT RULE keeps the full card's plate off it (vault/layout.js — CARD FIXES)
//   strip   [px, py, z?] — the strip's crop: the CSS background-position %, z = a zoom OUT (< 1: more of the art in the band — the face whole;
//           the art then sits right, its dark left under the plate; css/vault.css `background-size: z·100% auto`)
//   motes   { box, n, rgb, size: [min, max], dir: 'up'|'down'|'drift', speed (art px/s), a, kind: 'glow'|'spark'|'dot', tw (twinkle 0..1) }
//   breathe { at, r, rgb, a: [lo, hi], period, flicker (quick dips a second, 0..1) }      — a light pulsing / buzzing / flickering
//   sweep   { box, period, dur, angle, rgb, width, a }                                    — a soft band crossing the box (a gleam, a glint)
//   rays    { at, n, rgb, a, speed (rad/s) }                                              — speed rays turning
//   scan    { a, gap, flicker }                                                           — CRT scanlines + a soft flicker (the whole card)
//   grid    { y0, rgb, a, speed }                                                         — a synthwave floor rolling toward you
//   text    { at, text, font, fill, stroke, size, mode: 'blink'|'punch', period }        — a baked word (never text in the GL frame)
//   flash   { box, period, rgb }                                                          — flash-bulb pops
//   region  { src: [x, y, w, h], mode: 'spin'|'jitter', period, amp }                     — a piece of the art itself moved (the ball spins)
//   sprite  { art, at, w, rot, bob, period, glints: [[x, y]…] (sprite px) }               — a separate art piece that moves (the polaroid)
//   heart   { at, size, period }                                                          — a pulsing heart
//   twinkle { pts: [[x, y]…] | box + n, rgb, size, period }                                — sparkles popping in turn
//   palm    { at, h, sway, period, rgb }                                                  — a palm silhouette swaying from its foot
//   haze    { box, rgb, a }                                                               — heat shimmer: thin bands rising
//   drips   { pts: [[x, y, len]…], rgb }                                                  — paint drips crawling down
//   beams   { at, rgb: [..], a, spread, sway, period }                                    — light beams swaying from a point
//   smoke   { box, n, rgb, a }                                                            — soft smoke drifting
//   aurora  { box, rgbs, a }                                                              — flowing aurora bands
//   frost   { rgb, a: [lo, hi], period }                                                  — frost creeping in from the edges + easing back
//   puff    { at, rgb, period, dir }                                                      — breath puffs
//   streaks { box, n, rgb, a }                                                            — speed streaks shimmering
//   edge    { rgb, a: [lo, hi], period }                                                  — the card's own neon edge pulsing
//   bar     { box, period, rgb, width, a }                                                — a photocopier's light bar sweeping
//   scribble { pts: [[x, y]…], rgb, w, dur, delay, a }                                    — a chalk line drawing itself ONCE as the card appears
//   region mode 'lift' { src, period, amp (rad) }                                          — a piece of the art (the tape's corner) peeling up + settling
//   rays    … box?                                                                        — the rays clipped to a box (the red wall)
//   stripArt { art, h, crop, hero, layers }                                               — the card's OWN strip picture (1280 × h) + its layers in its px
//   glint   { lenses: [[cx, cy, rx, ry]…], period, dur, angle, rgb, width, a, stars: [[x, y]…], size } — a glint across the LENSES only
//           (clipped to them) + a star twinkling on the rims after it passes (CARD FIXES: the shiba's sunglasses)
export const GIFT_SPECS = Object.freeze({
  'card-gift-enforcer': { art: 'enforcer', hero: [720, 140, 260, 290], strip: [50, 28], layers: [
    { t: 'breathe', at: [290, 370], r: 340, rgb: '255,244,225', a: [0.02, 0.16], period: 3.2, flicker: 0.7 },
    { t: 'motes', box: [430, 0, 850, 800], n: 34, rgb: '255,200,130', size: [2, 4.5], dir: 'up', speed: 20, a: 0.85, kind: 'glow', tw: 0.5 },
    { t: 'motes', box: [0, 0, 1280, 800], n: 26, rgb: '230,230,230', size: [1.5, 3], dir: 'drift', speed: 7, a: 0.45, kind: 'dot', tw: 0.3 },
    { t: 'sweep', box: [0, 0, 1280, 800], period: 7.5, dur: 2.6, angle: -0.35, rgb: '255,210,130', width: 190, a: 0.22 },
  ] },
  'card-gift-linebacker': { art: 'linebacker', hero: [720, 140, 260, 290], strip: [50, 28], layers: [
    { t: 'rays', at: [960, 260], n: 16, rgb: '170,200,255', a: 0.09, speed: 0.06 },
    { t: 'haze', box: [0, 0, 1280, 800], rgb: '150,180,255', a: 0.05, halftone: true },
    { t: 'flash', box: [600, 0, 680, 520], period: 2.6, rgb: '255,255,255' },
    { t: 'text', on: 'full', at: [60, 520], text: 'HIT HARD.', font: 'italic 900 118px Impact, "Arial Black", sans-serif', fill: '#ffd23a', stroke: '#0a1230', size: 470, mode: 'punch', period: 6 },
  ] },
  'card-gift-underlights': { art: 'underlights', hero: [720, 140, 260, 290], strip: [50, 28], layers: [
    { t: 'breathe', at: [700, 40], r: 320, rgb: '255,150,240', a: [0.14, 0.42], period: 4, flicker: 0.25 },
    { t: 'breathe', at: [1190, 20], r: 360, rgb: '255,170,250', a: [0.18, 0.46], period: 5.3, flicker: 0.2 },
    { t: 'grid', y0: 600, rgb: '255,79,216', a: 0.55, speed: 0.35 },
    { t: 'edge', rgb: '255,79,216', a: [0.25, 0.75], period: 2.4 },
  ] },
  'card-gift-halloffame': { art: 'halloffame', hero: [848, 236, 190, 222], strip: [100, 40, 0.9], layers: [
    { t: 'breathe', at: [1060, 300], r: 560, rgb: '255,210,150', a: [0.04, 0.15], period: 5 },
    { t: 'sweep', box: [740, 0, 540, 712], period: 6, dur: 1.8, angle: -0.5, rgb: '255,240,200', width: 120, a: 0.5 },
    { t: 'motes', box: [760, 0, 500, 700], n: 24, rgb: '255,226,180', size: [1.2, 2.6], dir: 'up', speed: 6, a: 0.6, kind: 'dot', tw: 0.6 },
  ] },
  'card-gift-playerone': { art: 'playerone', hero: [790, 200, 220, 290], heroFull: [790, 60, 440, 440], strip: [100, 38.5, 0.75], layers: [
    { t: 'scan', a: 0.16, gap: 3, flicker: 0.06 },
    { t: 'twinkle', box: [640, 30, 600, 620], n: 9, rgb: '255,255,255', size: 26, period: 1.7, pixel: true },
    { t: 'twinkle', box: [640, 30, 600, 620], n: 5, rgb: '255,214,90', size: 22, period: 2.3, pixel: true },
    { t: 'text', on: 'full', at: [640, 752], text: 'PRESS START', font: '800 118px "JetBrains Mono", Consolas, monospace', fill: '#8ff0ff', stroke: '#06102a', size: 540, mode: 'blink', period: 1.1, center: true },   // (CARD FIXES: readable at 402 unzoomed — it was a 19 pt smudge; an arcade's blink)
  ] },
  'card-gift-sunsetstrip': { art: 'sunsetstrip', hero: [760, 270, 340, 200], heroFull: [730, 90, 480, 470], strip: [50, 43], layers: [
    { t: 'haze', box: [440, 300, 500, 340], rgb: '255,220,160', a: 0.1 },
    { t: 'palm', at: [150, 655], h: 430, sway: 0.035, period: 5.5, rgb: '28,8,40' },
    { t: 'palm', at: [345, 655], h: 300, sway: 0.03, period: 6.3, rgb: '28,8,40', flip: true },   // (both palms left: a palm across the shiba's face read as a mistake)
    { t: 'glint', lenses: [[806, 331, 62, 53], [995, 342, 77, 60]], period: 3.6, dur: 0.9, angle: -0.7, rgb: '255,255,255', width: 70, a: 1, stars: [[858, 292], [1056, 300]], size: 64 },
    { t: 'motes', box: [300, 280, 980, 520], n: 22, rgb: '255,214,150', size: [3, 6], dir: 'up', speed: 14, a: 0.8, kind: 'spark', tw: 0.8 },
  ] },
  'card-gift-goldenhour': { art: 'goldenhour', hero: [725, 180, 360, 420], strip: [50, 43], layers: [
    { t: 'motes', box: [0, 0, 1280, 800], n: 30, rgb: '255,205,110', size: [2, 4], dir: 'drift', speed: 8, a: 0.75, kind: 'glow', tw: 0.6 },
    { t: 'sprite', art: 'goldenhour-polaroid', at: [905, 390], w: 360, rot: 0.08, bob: 7, period: 4.2, glints: [[150, 160], [262, 160]] },
    { t: 'heart', at: [612, 300], size: 96, period: 1.15 },
    { t: 'twinkle', pts: [[600, 150], [690, 600], [1110, 640], [1060, 190], [760, 520]], rgb: '255,250,220', size: 34, period: 1.9 },
  ] },
  'card-gift-anarchist': { art: 'anarchist', hero: [935, 255, 100, 170], heroFull: [855, 255, 395, 440], strip: [50, 38], layers: [   // (v2 — CARD FIXES)
    { t: 'breathe', at: [995, 310], r: 540, rgb: '255,50,110', a: [0.08, 0.22], period: 1.9, flicker: 0.6 },
    { t: 'beams', at: [1080, -40], rgb: ['255,210,120', '255,90,180'], a: 0.09, spread: 0.22, sway: 0.12, period: 9 },
    { t: 'drips', pts: [[752, 500, 60], [795, 545, 35], [868, 590, 50], [1003, 650, 55], [1186, 560, 45], [1222, 530, 40]], rgb: '255,60,120' },
    { t: 'twinkle', ring: [995, 310, 255], n: 16, rgb: '255,220,240', size: 22, period: 2.1 },
    { t: 'motes', box: [700, 60, 580, 740], n: 30, rgb: '255,170,80', size: [2, 4], dir: 'up', speed: 26, a: 0.85, kind: 'glow', tw: 0.4 },
    { t: 'sweep', box: [930, 290, 100, 45], period: 5, dur: 0.7, angle: 0, rgb: '255,255,255', width: 40, a: 0.95, star: true },
    { t: 'smoke', box: [560, 560, 720, 240], n: 6, rgb: '190,170,200', a: 0.08 },
  ] },
  'card-gift-goldenboot': { art: 'goldenboot', hero: [755, 270, 100, 110], heroFull: [745, 250, 175, 230], strip: [50, 43], layers: [
    { t: 'breathe', at: [560, 70], r: 280, rgb: '255,255,235', a: [0.12, 0.34], period: 4 },
    { t: 'breathe', at: [1010, 95], r: 300, rgb: '255,255,235', a: [0.12, 0.34], period: 4.7 },
    { t: 'motes', box: [380, 0, 900, 720], n: 30, rgb: '255,214,120', size: [2, 4], dir: 'drift', speed: 9, a: 0.8, kind: 'glow', tw: 0.5 },
    { t: 'region', src: [961, 431, 78, 78], mode: 'spin', period: 1.6 },
    { t: 'breathe', at: [1000, 470], r: 110, rgb: '255,214,120', a: [0.12, 0.42], period: 1.1 },
    { t: 'twinkle', box: [0, 474, 1280, 64], n: 22, rgb: '200,240,255', size: 12, period: 1.4 },
    { t: 'streaks', box: [480, 200, 300, 220], n: 7, rgb: '255,240,220', a: 0.35 },
  ] },
  // THE TAPE CARD (the owner's ADD-ON, Nov 5 5:52 pm — it REPLACES the young-buck card; the id stays card-gift-youngbuck: THE LAB's marks, the gift lock + the item
  // rows are keyed by it): his face in black-and-white photocopy on a torn 50/50 split — the left dark, the right a red punk wall — the duct tape
  // across his mouth (the art's own lettering), a red neon halo round his outline. Its OWN strip picture (eyebrows → chin).
  'card-gift-youngbuck': { art: 'bruh', hero: [790, 110, 440, 690], heroFull: [790, 110, 440, 690], strip: [50, 50], layers: [
    { t: 'rays', at: [1000, 430], n: 16, rgb: '255,220,225', a: 0.07, speed: 0.035, box: [640, 0, 640, 800] },
    { t: 'drips', pts: [[668, 0, 90], [732, 0, 60], [1120, 0, 70], [1262, 0, 110], [1200, 690, 60]], rgb: '150,8,24' },
    { t: 'breathe', at: [1000, 420], r: 560, rgb: '255,40,70', a: [0.1, 0.26], period: 2.4, flicker: 0.85 },
    { t: 'breathe', at: [1000, 170], r: 300, rgb: '255,70,90', a: [0.06, 0.2], period: 1.7, flicker: 0.9 },
    { t: 'scribble', pts: [[668, 640], [704, 612], [690, 668], [738, 630], [722, 690], [770, 650], [752, 712], [796, 676]], rgb: '250,250,245', w: 5, dur: 1.4, delay: 0.9, a: 0.85 },
    { t: 'region', src: [1062, 578, 42, 46], mode: 'lift', period: 4.8, amp: 0.32 },
    { t: 'twinkle', pts: [[735, 150], [690, 330], [720, 545], [660, 620], [800, 60], [1110, 50], [1250, 250], [1262, 560], [1185, 700]], rgb: '255,240,245', size: 30, period: 1.9 },
    { t: 'flash', box: [660, 10, 610, 110], period: 2.3, rgb: '255,255,255' },
  ], stripArt: { art: 'bruh-strip', h: 256, crop: [50, 50], hero: [880, 30, 230, 220], layers: [
    { t: 'rays', at: [990, 170], n: 14, rgb: '255,220,225', a: 0.06, speed: 0.035, box: [640, 0, 640, 256] },
    { t: 'breathe', at: [990, 130], r: 330, rgb: '255,40,70', a: [0.08, 0.22], period: 2.4, flicker: 0.85 },
    { t: 'drips', pts: [[668, 0, 40], [760, 0, 30], [1190, 0, 45]], rgb: '150,8,24' },
    { t: 'region', src: [1040, 168, 40, 40], mode: 'lift', period: 4.8, amp: 0.28 },
    { t: 'twinkle', pts: [[690, 60], [770, 210], [700, 150], [1200, 60], [1250, 200], [820, 28]], rgb: '255,240,245', size: 24, period: 1.9 },
    { t: 'flash', box: [660, 0, 600, 40], period: 2.3, rgb: '255,255,255' },
  ] } },
  // THE SEEING-STARS CARD (the owner, Nov 6 — B · SEEING STARS; its name a pun ONLY — nothing else from any film; the name is the server's): pop art — the pink + yellow dizzy
  // spiral, the halftone, him in four flat inks, the ring of stars round his cap, the HIC! burst. The flat picture is taken APART
  // (scripts/build-buzzed-art.py — its numbers below): the spiral TURNS behind him (`spiral` — its formula fitted to the art), the dots +
  // the picture's light laid back over it (`dots` shimmering, the `shade`), HIM cut out (`cutout`), the stars ORBITING (`orbit` — the far
  // half behind him, smaller + dimmer; the near half in front, twinkling), the HIC! popping (`pop`). Its OWN strip picture (eyes → mouth).
  //   spiral  { key, sp: { cx, cy, k, c, e, rot, phase, d, N } (the fit), R (art px the bake covers), size (its px), rgb: [pink, yellow], speed (rad/s) }
  //   dots    { per, x0, y0 (the lattice), r, a (how dark), shimmer (0..1), period }
  //   cutout  { art, box: [x, y, w, h] }                                                — a baked RGBA piece (him, the light) drawn in place
  //   orbit   { side: 'back'|'front', ring: { cx, cy, rx, ry, rot }, n, a0, size, period, fill }
  //   pop     { art, box, period }                                                      — the HIC! hiccup: a swell, a squash, a dying wobble
  'card-gift-buzzed': { art: 'buzzed', hero: [745, 225, 380, 440], heroFull: [690, 90, 520, 610], strip: [50, 50], layers: [
    { t: 'spiral', key: 'buzzed', sp: { cx: 859.38, cy: 564.67, k: 0.0059146, c: -0.95747, e: 0.075075, rot: -0.181911, phase: -0.720564, d: -0.004715, N: 3 }, R: 1087, size: 1536, rgb: ['232,61,157', '242,213,65'], speed: 0.16 },
    { t: 'dots', per: 31.5, x0: 9.0, y0: 8.94, r: 5.6, a: 0.19, shimmer: 0.75, period: 5.5 },
    { t: 'cutout', art: 'buzzed-shade', box: [0, 0, 1280, 800] },
    { t: 'twinkle', pts: [[150, 120], [430, 60], [300, 470], [560, 720], [610, 380], [1250, 330], [1240, 690], [80, 660]], rgb: '255,250,215', size: 26, period: 2.3 },
    { t: 'orbit', side: 'back', ring: { cx: 925, cy: 74, rx: 196, ry: 52, rot: -0.12 }, n: 5, a0: 0.6, size: 62, period: 7, fill: '#fff6b0' },
    { t: 'cutout', art: 'buzzed-man', box: [658, 89, 554, 665] },
    { t: 'orbit', side: 'front', ring: { cx: 925, cy: 74, rx: 196, ry: 52, rot: -0.12 }, n: 5, a0: 0.6, size: 62, period: 7, fill: '#fff6b0' },
    { t: 'pop', art: 'buzzed-hic', box: [585, 186, 134, 108], period: 3.6 },
  ], stripArt: { art: 'buzzed-strip', h: 256, crop: [50, 50], hero: [790, 0, 300, 256], layers: [   // (the owner, Nov 6 12:40 pm: "eyebrows to chin" — the strip
    // picture is COMPOSED from the full one: art y 240 → 655 scaled x 0.6169 into 256 px, his face at 72 % across — every number below is
    // the full card's own, mapped the same way: build-buzzed-art.py's `strip`)
    { t: 'spiral', key: 'buzzed-strip2', sp: { cx: 881.12, cy: 200.28, k: 0.0095881, c: -2.51618, e: 0.075075, rot: -0.181911, phase: -0.720564, d: -0.004715, N: 3 }, R: 935, size: 1024, rgb: ['232,61,157', '242,213,65'], speed: 0.12 },
    { t: 'dots', per: 19.431, x0: 6.783, y0: 12.915, r: 3.454, a: 0.19, shimmer: 0.5, period: 6.5 },
    { t: 'cutout', art: 'buzzed-strip-shade', box: [0, 0, 1280, 256] },
    { t: 'cutout', art: 'buzzed-strip-man', box: [769, 0, 329, 256] },
    { t: 'twinkle', pts: [[1180, 50], [1235, 196], [640, 40]], rgb: '255,250,215', size: 22, period: 2.6 },
  ] } },
  'card-gift-icecold': { art: 'icecold', hero: [840, 140, 260, 300], heroFull: [840, 70, 300, 460], strip: [50, 32.5], layers: [   // (the art slid right 150 — CARD FIXES)
    { t: 'aurora', box: [580, 30, 700, 280], rgbs: ['110,255,220', '170,130,255'], a: 0.16 },
    { t: 'motes', box: [0, -20, 1280, 840], n: 46, rgb: '255,255,255', size: [1.5, 3.6], dir: 'down', speed: 34, a: 0.85, kind: 'dot', tw: 0.2 },
    { t: 'frost', rgb: '215,240,255', a: [0.08, 0.32], period: 10 },
    { t: 'puff', at: [878, 412], rgb: '235,248,255', period: 3.6, dir: -1 },
    { t: 'sweep', box: [840, 60, 440, 740], period: 6.5, dur: 1.4, angle: -1.2, rgb: '210,245,255', width: 34, a: 0.45 },
  ] },
});
