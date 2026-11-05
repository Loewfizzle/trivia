// SHELL 2.0 B2 — THE GIFT CARDS' MOTION, as data (js/fx/gift.js draws it): each card's art (assets/vault/gift/<art>.webp, 1280 × 800 —
// scripts/build-gift-art.mjs) + its crop on the slim strip (`strip`: the CSS background-position %, the SAME numbers as css/vault.css —
// tests/shell-b2.test.mjs checks they match) + its LAYERS, every position in ART pixels. `on: 'full'` = the full card only (the strip is the
// calmer cut). PURE data — no names (the names are the server's).
//   hero    [x, y, w, h] — the card's MAIN FEATURE (the face) in art px: THE HERO-SPOT RULE checks it on the strip (vault/hero.js)
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
  'card-gift-halloffame': { art: 'halloffame', hero: [847, 244, 140, 207], strip: [50, 28], layers: [
    { t: 'breathe', at: [1060, 300], r: 560, rgb: '255,210,150', a: [0.04, 0.15], period: 5 },
    { t: 'sweep', box: [740, 0, 540, 712], period: 6, dur: 1.8, angle: -0.5, rgb: '255,240,200', width: 120, a: 0.5 },
    { t: 'motes', box: [760, 0, 500, 700], n: 24, rgb: '255,226,180', size: [1.2, 2.6], dir: 'up', speed: 6, a: 0.6, kind: 'dot', tw: 0.6 },
  ] },
  'card-gift-playerone': { art: 'playerone', hero: [790, 200, 220, 280], strip: [50, 32.5], layers: [
    { t: 'scan', a: 0.16, gap: 3, flicker: 0.06 },
    { t: 'twinkle', box: [640, 30, 600, 620], n: 9, rgb: '255,255,255', size: 26, period: 1.7, pixel: true },
    { t: 'twinkle', box: [640, 30, 600, 620], n: 5, rgb: '255,214,90', size: 22, period: 2.3, pixel: true },
    { t: 'text', on: 'full', at: [640, 752], text: 'PRESS START', font: '700 34px "JetBrains Mono", Consolas, monospace', fill: '#7fe9ff', size: 300, mode: 'blink', period: 1.2, center: true },
  ] },
  'card-gift-sunsetstrip': { art: 'sunsetstrip', hero: [760, 270, 340, 200], strip: [50, 43], layers: [
    { t: 'haze', box: [440, 300, 500, 340], rgb: '255,220,160', a: 0.1 },
    { t: 'palm', at: [150, 655], h: 430, sway: 0.035, period: 5.5, rgb: '28,8,40' },
    { t: 'palm', at: [345, 655], h: 300, sway: 0.03, period: 6.3, rgb: '28,8,40', flip: true },   // (both palms left: a palm across the shiba's face read as a mistake)
    { t: 'sweep', box: [720, 270, 420, 150], period: 4.5, dur: 0.8, angle: -0.6, rgb: '255,255,255', width: 46, a: 0.85 },
    { t: 'motes', box: [300, 280, 980, 520], n: 22, rgb: '255,214,150', size: [3, 6], dir: 'up', speed: 14, a: 0.8, kind: 'spark', tw: 0.8 },
  ] },
  'card-gift-goldenhour': { art: 'goldenhour', hero: [725, 180, 360, 420], strip: [50, 43], layers: [
    { t: 'motes', box: [0, 0, 1280, 800], n: 30, rgb: '255,205,110', size: [2, 4], dir: 'drift', speed: 8, a: 0.75, kind: 'glow', tw: 0.6 },
    { t: 'sprite', art: 'goldenhour-polaroid', at: [905, 390], w: 360, rot: 0.08, bob: 7, period: 4.2, glints: [[150, 160], [262, 160]] },
    { t: 'heart', at: [612, 300], size: 96, period: 1.15 },
    { t: 'twinkle', pts: [[600, 150], [690, 600], [1110, 640], [1060, 190], [760, 520]], rgb: '255,250,220', size: 34, period: 1.9 },
  ] },
  'card-gift-anarchist': { art: 'anarchist', hero: [760, 250, 110, 170], strip: [50, 38], layers: [
    { t: 'breathe', at: [850, 330], r: 640, rgb: '255,50,110', a: [0.08, 0.22], period: 1.9, flicker: 0.6 },
    { t: 'beams', at: [905, -40], rgb: ['255,210,120', '255,90,180'], a: 0.09, spread: 0.22, sway: 0.12, period: 9 },
    { t: 'drips', pts: [[606, 610, 70], [648, 628, 55], [1088, 600, 60], [1116, 572, 80], [858, 30, 40], [1150, 380, 50]], rgb: '255,60,120' },
    { t: 'twinkle', ring: [850, 330, 300], n: 16, rgb: '255,220,240', size: 22, period: 2.1 },
    { t: 'motes', box: [520, 120, 720, 680], n: 30, rgb: '255,170,80', size: [2, 4], dir: 'up', speed: 26, a: 0.85, kind: 'glow', tw: 0.4 },
    { t: 'sweep', box: [760, 280, 140, 70], period: 5, dur: 0.7, angle: 0, rgb: '255,255,255', width: 40, a: 0.95, star: true },
    { t: 'smoke', box: [0, 480, 1280, 320], n: 6, rgb: '190,170,200', a: 0.08 },
  ] },
  'card-gift-goldenboot': { art: 'goldenboot', hero: [755, 270, 100, 110], strip: [50, 43], layers: [
    { t: 'breathe', at: [560, 70], r: 280, rgb: '255,255,235', a: [0.12, 0.34], period: 4 },
    { t: 'breathe', at: [1010, 95], r: 300, rgb: '255,255,235', a: [0.12, 0.34], period: 4.7 },
    { t: 'motes', box: [380, 0, 900, 720], n: 30, rgb: '255,214,120', size: [2, 4], dir: 'drift', speed: 9, a: 0.8, kind: 'glow', tw: 0.5 },
    { t: 'region', src: [961, 431, 78, 78], mode: 'spin', period: 1.6 },
    { t: 'breathe', at: [1000, 470], r: 110, rgb: '255,214,120', a: [0.12, 0.42], period: 1.1 },
    { t: 'twinkle', box: [0, 474, 1280, 64], n: 22, rgb: '200,240,255', size: 12, period: 1.4 },
    { t: 'streaks', box: [480, 200, 300, 220], n: 7, rgb: '255,240,220', a: 0.35 },
  ] },
  'card-gift-youngbuck': { art: 'youngbuck', hero: [700, 340, 330, 140], strip: [50, 52], layers: [
    { t: 'bar', box: [522, 0, 758, 800], period: 7, rgb: '220,255,255', width: 70, a: 0.32 },
    { t: 'region', src: [598, 548, 548, 100], mode: 'jitter', period: 0.14, amp: 2.2 },
    { t: 'breathe', at: [1032, 262], r: 180, rgb: '250,255,90', a: [0.0, 0.34], period: 0.8, flicker: 0.9 },
    { t: 'haze', box: [522, 0, 758, 800], rgb: '255,190,240', a: 0.05, halftone: true },
    { t: 'sweep', box: [500, 0, 50, 800], period: 5.5, dur: 1.2, angle: 1.5708, rgb: '255,255,255', width: 50, a: 0.7 },
  ] },
  'card-gift-icecold': { art: 'icecold', hero: [690, 140, 260, 300], strip: [50, 32.5], layers: [
    { t: 'aurora', box: [430, 30, 760, 280], rgbs: ['110,255,220', '170,130,255'], a: 0.16 },
    { t: 'motes', box: [0, -20, 1280, 840], n: 46, rgb: '255,255,255', size: [1.5, 3.6], dir: 'down', speed: 34, a: 0.85, kind: 'dot', tw: 0.2 },
    { t: 'frost', rgb: '215,240,255', a: [0.08, 0.32], period: 10 },
    { t: 'puff', at: [728, 412], rgb: '235,248,255', period: 3.6, dir: -1 },
    { t: 'sweep', box: [690, 60, 430, 740], period: 6.5, dur: 1.4, angle: -1.2, rgb: '210,245,255', width: 34, a: 0.45 },
  ] },
});
