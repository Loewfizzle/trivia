// PRISM DROP — THE SKIN SYSTEM (SKINS 1 — the owner's decisions: docs/games/plan.md "SKINS 1"; docs/prism.md "THE SKINS").
// A skin = ONE definition here (like HOLD'EM's holdem/skins.js) + its art module — the board (board.js), the view (view.js), the page (page.js),
// the rail, the podium and the picker draw ONLY through a skin's hooks: NO skin-specific code path anywhere else. A NEW SKIN = one definition in
// SKINS (+ its art file, its CSS under `.pd[data-skin='<id>']`, its line in tests/prism-skins.test.mjs's contract — which checks every hook).
//
//   id · name · line (the picker's label)
//   look      'day' | 'night' — the pool it rotates in (THE GAME LOOK picks day vs night first); null = in no pool (the retired glass)
//   unlock    null (everyone owns it) | { level } (a level unlock — server-granted later; nothing is locked now)
//   family    'crayon' | 'neon' — the CSS family the view sets as .pd[data-look] (the day's PAPER panels · the night's glass); the skin itself
//             is .pd[data-skin]
//   tokens    { ink, sub, panel, line (+ line2) } — the panels' colours (ink ≥ 4.5:1 on panel — the contract test). `papers: true` = the match's
//             PAPER (crayon.js#paperOf — the host's deal) gives panel + ink + the grain instead (the crayon skin only)
//   lettering what the callouts are drawn with (CSS, by data-skin) · sounds { lock, clear } — the synth's voices (audio.js) this skin swaps in
//             (+ SKINS 2A `files: { lock, clear }` — its SOURCED sounds in audio/sfx/prism/, fetched only when the skin shows; the voice's
//             code-made sound is the fallback)
//   — THE BLOCKS (pre-drawn sprites, cached per cell size, warmed in idle slices: no stroke, shadow or blur is drawn in a frame)
//   variants · sprite(px, kind, t, v, env) — kind: block | grey (the danger drain) | ghost (the landing preview) | glow | incoming | iglow
//   fallV(n, i) · pieceV(x, y, t) — the falling piece's + HOLD / NEXT's variants (the stack's = by place: (x·7 + y·13) % variants)
//   env(pal)  what the sprites draw with (the night's world palette) or null · glow / pieceGlow — the added light under the stack / the piece
//   grid(g, o) — the well's grid layer · incoming(ctx, bands, o) — THE RISING ROWS (skin-kit.js: an occupied cell only tinted, the gap open)
//   mini(ctx, c) — one cell of a mini board (the rail, spectating, the podium) · shard(t, env) — a top-out's shard colour · crumbs — paint, not light
//   seams(ctx, o) — OPTIONAL: what the skin paints where the settled stack's blocks touch (the watercolor's BLEED) — drawn once into the
//   board's cached stack layer, over the blocks (o: { cells, px, sy, grey }) · sampleAt { x, y } — OPTIONAL (with seams): the board place the
//   settings tile's 3-block sample sits at, so the tile shows the seams too (picker.js)
//   — THE MOMENTS
//   fx()      the moments drawn ON the board's canvas (a lock, a slam, a clear, a cancel — crayonfx.js's interface) or null
//   light     the WebGL light layer + neonfx.js run (the night's clears are LIGHT) · flash — the glass's own lock flash + sweeps
//   bands     a junk glitch draws digital colour bands · pulse — a big clear pulses the board (CSS)
//   — THE SCENE
//   world     'shader' (the WebGL world behind the board) | 'page' (page.js — the skin's `page` painter fills the screen; no shader work)
//   page      { id, ok, key, files, paint } (page.js) | null · enter(o) — the skin shows: its own files load NOW, never before (o: { root, paper,
//             sky — the view's EMPTY layer above the page, under the board: a skin puts what MOVES behind its board there (a few DOM pieces
//             moved by CSS on the compositor); the view empties it when another skin shows })
//   idle(o)   → [stage] the art worth warming in idle slices while ANOTHER look shows (a live switch then only composites) — optional
//   warm(px, ms) → true once every block of a size is drawn · drop() · count() — the sprite cache (dropped a minute after the match's screen)
//   holiday   takes the holiday hook's overrides (holiday.js — crayon + neon only)
//
// THE ROTATION (PURE — tests/prism-skins.test.mjs): POOLS · owned(skin, phone) · poolOf(look, phone) · skinOf(game, look, phone) ·
// phoneOf(settings) — and the COUNTER's own maths in skin-deal.js (a leaf the cartridge's index.js takes without the art): skinK(game) ·
// dealSkin(seed, used) (the HOST's counter, from the night's memory) · soloSkin(cur) + dropSkin(settings, day) (the PLAYER's own counter)
import { W, VISIBLE } from './engine.js';
import { JEWEL, INCOMING, rgba, mix, lightIncoming, sketchIncoming } from './skin-kit.js';
import { neonPalette } from './neon.js';
import { CRAYON, CRAYON_LINE, GRAPHITE } from './crayon.js';
import { crayonSprite, VARIANTS as CRAYON_VARIANTS, warmCrayon, clearCrayon, crayonCount, toothMaskURL, warmTooth } from './crayon-art.js';
import { createCrayonFx } from './crayonfx.js';
import { neonSprite, clearNeon, neonCount } from './neon-art.js';
import { glassSprite, clearGlass, glassCount } from './glass-art.js';
import { CRAYON_PAGE, warmDay, loadMarker, loadImg } from './page.js';
import { WATER, WATER_POOL, PENCIL, WASH, VARIANTS as WATER_VARIANTS, waterSprite, seamSprite, seamAt, warmWater, clearWater, waterCount } from './water-art.js';
import { createWaterFx } from './waterfx.js';
import { WATER_PAGE, WATER_TEX, WATER_PAPER, PAPER_PAGE, KRAFT_TEX, SHEET } from './skin-pages.js';
import { CUT, CARD, CUT_LINE, VARIANTS as PAPER_VARIANTS, paperSprite, warmPaper, clearPaper, paperCount } from './paper-art.js';
import { createPaperFx } from './paperfx.js';
import { PIXEL, VARIANTS as PIXEL_VARIANTS, GRID as PIXEL_GRID, pixelSprite, warmPixel, clearPixel, pixelCount, loadPixelFont, lightOf as pixelLight, darkOf as pixelDark } from './pixel-art.js';
import { createPixelFx } from './pixelfx.js';
import { PIXEL_PAGE, pixelSky, GALAXY_PAGE, galaxySky } from './night-pages.js';
import { GALAXY, VARIANTS as GALAXY_VARIANTS, galaxySprite, warmGalaxy, clearGalaxy, galaxyCount } from './galaxy-art.js';
import { createGalaxyFx } from './galaxyfx.js';
import { skinK } from './skin-deal.js';
export { skinK, dealSkin, soloSkin, dropSkin, SK_START } from './skin-deal.js';

/** the well's grid as lines + dots at the crossings (the night's + the glass's): a calm, precise stage */
function lineGrid(g, { px, w, h }, line, dot, d) {
  g.strokeStyle = line;
  g.lineWidth = 1;
  for (let x = 1; x < W; x++) { g.beginPath(); g.moveTo(x * px + 0.5, 0); g.lineTo(x * px + 0.5, h); g.stroke(); }
  for (let y = 1; y < VISIBLE; y++) { g.beginPath(); g.moveTo(0, y * px + 0.5); g.lineTo(w, y * px + 0.5); g.stroke(); }
  g.fillStyle = dot;
  for (let x = 1; x < W; x++) for (let y = 1; y < VISIBLE; y++) g.fillRect(x * px - d / 2, y * px - d / 2, d, d);
}

// ================================================================ CRAYON (day — PD-4: a coloring book)
const crayon = {
  id: 'crayon', name: 'CRAYON', line: 'A coloring book', look: 'day', unlock: null, family: 'crayon', holiday: true,
  tokens: { ink: '#3a3d45', sub: '#4a4e57', panel: '#fbf7ea', line: 'rgba(74, 78, 87, 0.78)', line2: 'rgba(74, 78, 87, 0.38)' }, papers: true,
  lettering: 'marker-tooth', sounds: {},
  variants: CRAYON_VARIANTS,
  sprite: (px, kind, t, v = 0) => crayonSprite(px, kind, t, v),
  fallV: (n, i) => (n * 5 + i) % CRAYON_VARIANTS,   // (the falling piece keeps its drawing while it falls: a variant per cell of THIS piece — never by place)
  pieceV: (x, y, t) => (x * 3 + y * 5 + t) % CRAYON_VARIANTS,
  env: () => null, glow: 0, pieceGlow: 0,
  /** a faint PENCIL grid: thin graphite lines, the pressure varying along each (a hand with a ruler, not a printer) */
  grid(g, { px }) {
    let k = 0;
    for (let x = 1; x < W; x++) for (let y = 0; y < VISIBLE; y++) { g.fillStyle = rgba(GRAPHITE, 0.07 + 0.05 * (((x * 31 + y * 17 + k++) % 7) / 7)); g.fillRect(x * px - 0.5, y * px, Math.max(1, px * 0.012), px); }
    for (let y = 1; y < VISIBLE; y++) for (let x = 0; x < W; x++) { g.fillStyle = rgba(GRAPHITE, 0.07 + 0.05 * (((y * 29 + x * 13 + k++) % 7) / 7)); g.fillRect(x * px, y * px - 0.5, px, Math.max(1, px * 0.012)); }
  },
  // the INCOMING rows: grey PENCIL SKETCHES (hatched — never a crayon block), shaking marks at the sides, a pencil leading edge
  incoming: sketchIncoming({ spr: (px, hot) => crayonSprite(px, hot ? 'ihot' : 'incoming', 0), ink: GRAPHITE }),
  /** a big mini draws the real crayon blocks; a small one a crayon fill + its darker outline (a KO'd board in graphite) */
  mini(ctx, { X, Y, s, px, t, ko, x, y }) {
    if (px >= 18 && !ko) { ctx.drawImage(crayonSprite(px, 'block', t, (x * 7 + y * 13) % CRAYON_VARIANTS), X, Y); return; }
    const c = ko ? '#9a9da5' : CRAYON[t] || CRAYON[8], e = Math.max(1, Math.round(px * 0.16));
    ctx.fillStyle = ko ? '#6e727c' : CRAYON_LINE[t] || CRAYON_LINE[8]; ctx.fillRect(X, Y, s, s);
    if (s > 2 * e) { ctx.fillStyle = c; ctx.fillRect(X + e, Y + e, s - 2 * e, s - 2 * e); }
  },
  shard: t => CRAYON[t] || CRAYON[8], crumbs: true,
  fx: () => createCrayonFx(), light: false, flash: false, bands: false, pulse: true,
  world: 'page', page: CRAYON_PAGE,
  /** the papers + the marker font — fetched only when the skin shows; the lettering's crayon tooth (a mask) */
  enter({ root, paper }) { warmDay(paper); if (root) root.style.setProperty('--pd-tooth', `url(${toothMaskURL()})`); },
  /** (PFIX-B — optional 17) warmed at night in idle slices: the tooth (noise, ≤ 4 ms a slice), the mask's URL, the world's doodle at the page's size */
  idle: ({ px, page, world, paper, w, h }) => [
    () => warmTooth(4, Math.min(2, window.devicePixelRatio || 1), px || 0),
    () => { toothMaskURL(); return true; },
    () => { if (page && paper) page.warm(world, paper.doodle, w, h); return true; },
  ],
  warm: (px, ms) => warmCrayon(px, ms), drop: clearCrayon, count: crayonCount,
};

// ================================================================ WATERCOLOR (day — SKINS 1: translucent washes on cold-press paper)
/** (SKINS 2B) where the settings tile's sample sits on the board: the first place whose TWO seams (the pair side by side, the one on top) both
 *  bleed — the tile shows its three washes touching + bleeding, like the board */
const WATER_SAMPLE = (() => {
  for (let y = 0; y < VISIBLE - 1; y++) for (let x = 0; x < W - 1; x++) if (seamAt(x, y, false) && seamAt(x + 1, y, true)) return Object.freeze({ x, y });
  return Object.freeze({ x: 0, y: 0 });
})();
const watercolor = {
  id: 'watercolor', name: 'WATERCOLOR', line: 'Washes on cold-press paper', look: 'day', unlock: null, family: 'crayon', holiday: false,
  tokens: { ink: '#2e3340', sub: '#4a5266', panel: WATER_PAPER, line: 'rgba(92, 111, 146, 0.62)', line2: 'rgba(92, 111, 146, 0.3)', grain: `url("${WATER_TEX}")` },
  lettering: 'marker-paint', sounds: { lock: 'plip', clear: 'swish', files: { lock: 'watercolor-lock', clear: 'watercolor-clear' } },
  variants: WATER_VARIANTS,
  sprite: (px, kind, t, v = 0) => waterSprite(px, kind, t, v),
  fallV: (n, i) => (n * 5 + i) % WATER_VARIANTS,
  pieceV: (x, y, t) => (x * 3 + y * 5 + t) % WATER_VARIANTS,
  env: () => null, glow: 0, pieceGlow: 0,
  /** a very faint pencil grid — the columns to aim by, nothing more (paint, not graph paper) */
  grid(g, { px }) {
    g.fillStyle = rgba(PENCIL, 0.075);
    for (let x = 1; x < W; x++) g.fillRect(x * px - 0.5, 0, Math.max(1, px * 0.012), VISIBLE * px);
    g.fillStyle = rgba(PENCIL, 0.05);
    for (let y = 1; y < VISIBLE; y++) g.fillRect(0, y * px - 0.5, W * px, Math.max(1, px * 0.012));
  },
  // the INCOMING rows: a GREY WASH with a darker pigment edge (flat — never a painted block: no highlight), the leading edge a wet line of wash
  incoming: sketchIncoming({
    spr: (px, hot) => waterSprite(px, hot ? 'ihot' : 'incoming', 0), ink: WASH,
    edge(ctx, yTop, px) {
      const g = ctx.createLinearGradient(0, yTop - px * 0.42, 0, yTop);
      g.addColorStop(0, rgba(WASH, 0));
      g.addColorStop(1, rgba(WASH, 0.3));
      ctx.fillStyle = g;
      ctx.fillRect(0, yTop - px * 0.42, W * px, px * 0.42);
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#5d616b';
      ctx.fillRect(0, yTop - Math.max(1, px * 0.025), W * px, Math.max(2, px * 0.05));
    },
  }),
  /** a big mini draws the real washes; a small one a flat wash, its edge pooled a shade deeper — the same wash, no dark rim (a KO'd board in
   *  grey wash) */
  mini(ctx, { X, Y, s, px, t, ko, x, y }) {
    if (px >= 18 && !ko) { ctx.drawImage(waterSprite(px, 'block', t, (x * 7 + y * 13) % WATER_VARIANTS), X, Y); return; }
    const c = ko ? '#a9acb4' : WATER[t] || WATER[8], e = Math.max(1, Math.round(px * 0.14));
    ctx.fillStyle = ko ? '#93979f' : WATER_POOL[t] || WATER_POOL[8]; ctx.globalAlpha = 0.8; ctx.fillRect(X, Y, s, s);
    if (s > 2 * e) { ctx.globalAlpha = 1; ctx.clearRect(X + e, Y + e, s - 2 * e, s - 2 * e); ctx.globalAlpha = 0.72; ctx.fillStyle = c; ctx.fillRect(X + e, Y + e, s - 2 * e, s - 2 * e); }
    ctx.globalAlpha = 1;
  },
  /** THE BLEED (SKINS 2A): where two DIFFERENT colours touch in the settled stack, a soft patch of the two paints run together across the seam
   *  (≈ 3 seams in 5, by place). Painted ONCE into the board's cached stack layer (board.js — when the stack changes), never per frame.
   *  o: { cells, px, sy (row → canvas y), grey (the danger drain: the bleed fades with the colour) } */
  seams(ctx, { cells, px, sy, grey = 0 }) {
    const a = Math.max(0, 1 - grey * 1.2);
    if (a <= 0.02) return;
    ctx.globalAlpha = a;
    for (let y = 0; y < VISIBLE; y++) for (let x = 0; x < W; x++) {
      const t = cells[y * W + x];
      if (!t) continue;
      const r = x + 1 < W ? cells[y * W + x + 1] : 0, u = y + 1 < VISIBLE ? cells[(y + 1) * W + x] : 0;
      let k = r && r !== t ? seamAt(x, y, false) : 0;
      if (k) { const sp = seamSprite(px, t, r, false, k); ctx.drawImage(sp, (x + 1) * px - sp.width / 2, sy(y) + (px - sp.height) / 2); }
      k = u && u !== t ? seamAt(x, y, true) : 0;
      if (k) { const sp = seamSprite(px, u, t, true, k); ctx.drawImage(sp, x * px + (px - sp.width) / 2, sy(y) - sp.height / 2); }
    }
    ctx.globalAlpha = 1;
  },
  sampleAt: WATER_SAMPLE,
  shard: t => WATER[t] || WATER[8], crumbs: true,
  fx: () => createWaterFx(), light: false, flash: false, bands: false, pulse: true,
  world: 'page', page: WATER_PAGE,
  /** its paper + the marker font — fetched only when the skin shows */
  enter() { loadImg(WATER_TEX); loadMarker(); },
  warm: (px, ms) => warmWater(px, ms), drop: clearWater, count: waterCount,
};

// ================================================================ PAPER CUT-OUT (day — SKINS 1: cut paper on a white sheet, a kraft-board table)
const paper = {
  id: 'paper', name: 'PAPER CUT-OUT', line: 'Cut paper on a kraft table', look: 'day', unlock: null, family: 'crayon', holiday: false,
  tokens: { ink: '#3a2a18', sub: '#5a4630', panel: SHEET, line: 'rgba(58, 42, 24, 0.34)', line2: 'rgba(58, 42, 24, 0.16)' },
  lettering: 'label', sounds: { lock: 'tap', clear: 'rip', files: { lock: 'paper-lock', clear: 'paper-clear' } },
  variants: PAPER_VARIANTS,
  sprite: (px, kind, t, v = 0) => paperSprite(px, kind, t, v),
  fallV: (n, i) => (n * 5 + i) % PAPER_VARIANTS,
  pieceV: (x, y, t) => (x * 3 + y * 5 + t) % PAPER_VARIANTS,
  env: () => null, glow: 0, pieceGlow: 0,
  /** the sheet's guide: faint cut-marks at the crossings — the columns to aim by, nothing ruled */
  grid(g, { px }) {
    g.fillStyle = rgba(CUT_LINE, 0.16);
    const d = Math.max(2, Math.round(px * 0.03)), l = Math.max(4, Math.round(px * 0.1));
    for (let x = 1; x < W; x++) for (let y = 1; y < VISIBLE; y++) { g.fillRect(x * px - l / 2, y * px - d / 2, l, d); g.fillRect(x * px - d / 2, y * px - l / 2, d, l); }
  },
  // the INCOMING rows: GREY CARD STOCK (a due row's edge inked), the leading edge a dashed cut line
  incoming: sketchIncoming({
    spr: (px, hot) => paperSprite(px, hot ? 'ihot' : 'incoming', 0), ink: '#7b756d',
    edge(ctx, yTop, px) {
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#5a4a38';
      const dash = Math.max(6, Math.round(px * 0.22)), gap = Math.max(4, Math.round(px * 0.14)), hgt = Math.max(2, Math.round(px * 0.045));
      for (let x = 0; x < W * px; x += dash + gap) ctx.fillRect(x, yTop - hgt / 2, dash, hgt);
    },
  }),
  /** a big mini draws the real cut squares; a small one a flat paper fill with its white top edge (a KO'd board in grey card) */
  mini(ctx, { X, Y, s, px, t, ko, x, y }) {
    if (px >= 18 && !ko) { ctx.drawImage(paperSprite(px, 'block', t, (x * 7 + y * 13) % PAPER_VARIANTS), X, Y); return; }
    ctx.fillStyle = ko ? '#aaa7a1' : CUT[t] || CUT[8]; ctx.fillRect(X, Y, s, s);
    if (s > 3) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(X, Y, s, Math.max(1, Math.round(px * 0.14))); }
  },
  shard: t => CUT[t] || CUT[8], crumbs: true,
  fx: () => createPaperFx(), light: false, flash: false, bands: false, pulse: false,
  world: 'page', page: PAPER_PAGE,
  /** its kraft board + the marker font — fetched only when the skin shows */
  enter() { loadImg(KRAFT_TEX); loadMarker(); },
  warm: (px, ms) => warmPaper(px, ms), drop: clearPaper, count: paperCount,
};
void CARD;

// ================================================================ NEON (night — PD-3: neon tubes in the world's palette)
const neonEnv = pal => pal || neonPalette('');
const neon = {
  id: 'neon', name: 'NEON', line: 'Neon tubes', look: 'night', unlock: null, family: 'neon', holiday: true,
  tokens: { ink: '#ffffff', sub: '#c8d4ee', panel: '#0a0c18', line: '#9fd8ff' },
  lettering: 'neon', sounds: {},
  variants: 3,
  sprite: (px, kind, t, v = 0, env) => neonSprite(px, kind, t, neonEnv(env), v),
  fallV: (n, i) => i % 3,
  pieceV: () => 0,
  env: neonEnv, glow: 0.62, pieceGlow: 0.8,
  /** the world's well colour, faint lines, brighter crossings */
  grid(g, o) { const pal = neonEnv(o.pal); lineGrid(g, o, rgba(pal.well, 0.045), rgba(pal.well, 0.16), Math.max(2, Math.round(o.px * 0.035))); },
  // the INCOMING rows: a red tube edge with a hot core (light — the dark well glows through)
  incoming: lightIncoming((px, kind, pal) => neonSprite(px, kind, 0, neonEnv(pal)), { core: 'rgba(255,236,240,0.95)', w: 0.05, halo: 'rgba(255,79,116,0.35)' }),
  /** a big mini (spectating, the podium — ≥ 18 device px a cell) draws the real tubes; a small one a lit edge + a dark core */
  mini(ctx, { X, Y, s, px, t, ko, x, y, env }) {
    if (ko) { ctx.fillStyle = '#3a3f4c'; ctx.fillRect(X, Y, s, s); return; }
    const P = neonEnv(env);
    if (px >= 18) { ctx.drawImage(neonSprite(px, 'block', t, P, (x * 7 + y * 13) % 3), X, Y); return; }
    const c = P.piece[t] || P.piece[8], e = Math.max(1, Math.round(px * 0.2));
    ctx.fillStyle = c; ctx.fillRect(X, Y, s, s);
    if (s > 2 * e + 1) { ctx.fillStyle = mix(c, '#000000', 0.8); ctx.fillRect(X + e, Y + e, s - 2 * e, s - 2 * e); }
  },
  shard: (t, env) => neonEnv(env).piece[t], crumbs: false,
  fx: () => null, light: true, flash: false, bands: true, pulse: false,
  world: 'shader', page: null,
  enter() {},
  warm: () => true, drop: clearNeon, count: neonCount,
};

// ================================================================ ARCADE PIXEL (night — SKINS 2B: chunky 8 × 8 pixel blocks, crisp — no bloom)
const pixelUnit = px => Math.max(1, Math.round(px / PIXEL_GRID));
const pixel = {
  id: 'pixel', name: 'ARCADE PIXEL', line: 'Chunky 8-bit pixels', look: 'night', unlock: null, family: 'neon', holiday: false,
  // (PFIX-3 — K5: the callouts' arrow in the skin's own lettering — Press Start 2P has no "→": it fell back to a thin glyph of another font.
  //  A skin's `arrow` = the mark its callouts use between "+5" and a name; none = "→")
  arrow: '>',
  tokens: { ink: '#ffffff', sub: '#b8f1ff', panel: '#050716', line: '#35e6ff' },
  // (PFIX-3 — S13: `pitch` = the note of each PITCHED file, a pitch class 0 … 11 — the blip is a clear G; the sting is a chromatic sweep: none)
  lettering: 'pixel', sounds: { lock: 'blip', clear: 'chip', files: { lock: 'pixel-lock', clear: 'pixel-clear' }, pitch: { lock: 7 } },
  variants: PIXEL_VARIANTS,
  sprite: (px, kind, t, v = 0) => pixelSprite(px, kind, t, v),
  fallV: (n, i) => (n * 3 + i) % PIXEL_VARIANTS,
  pieceV: (x, y, t) => (x + y * 3 + t) % PIXEL_VARIANTS,
  env: () => null, glow: 0, pieceGlow: 0,   // (NO BLOOM on the blocks: crisp is the look)
  /** the well's guide: one cyan PIXEL at each crossing (a block's own pixel size, on whole device pixels) — nothing ruled */
  grid(g, { px }) {
    const u = pixelUnit(px);
    g.fillStyle = 'rgba(53, 230, 255, 0.2)';
    for (let x = 1; x < W; x++) for (let y = 1; y < VISIBLE; y++) g.fillRect(x * px - (u >> 1), y * px - (u >> 1), u, u);
  },
  // the INCOMING rows: GREY PIXEL BLOCKS with a RED PIXEL EDGE (a dithered grey — never a piece), the leading edge a dotted red pixel line
  incoming: sketchIncoming({
    spr: (px, hot) => pixelSprite(px, hot ? 'ihot' : 'incoming', 0), ink: INCOMING, marks: false,
    edge(ctx, yTop, px) {
      const u = pixelUnit(px), y = Math.round(yTop) - u;
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ff6f8d';
      for (let x = 0; x < W * px; x += u * 2) ctx.fillRect(x, y, u, u);
    },
  }),
  /** a big mini draws the real pixel blocks; a small one the piece's colour with a bright top + left and a dark bottom + right pixel edge
   *  (a KO'd board in flat grey) */
  mini(ctx, { X, Y, s, px, t, ko, x, y }) {
    if (px >= 18 && !ko) { ctx.drawImage(pixelSprite(px, 'block', t, (x * 7 + y * 13) % PIXEL_VARIANTS), X, Y); return; }
    const c = ko ? '#4a4f5e' : PIXEL[t] || PIXEL[8], e = Math.max(1, Math.round(px / PIXEL_GRID));
    ctx.fillStyle = c; ctx.fillRect(X, Y, s, s);
    if (s > 3 * e && !ko) {
      ctx.fillStyle = pixelLight(c); ctx.fillRect(X, Y, s - e, e); ctx.fillRect(X, Y, e, s - e);
      ctx.fillStyle = pixelDark(c); ctx.fillRect(X + e, Y + s - e, s - e, e); ctx.fillRect(X + s - e, Y + e, e, s - e);
    }
  },
  shard: t => PIXEL[t] || PIXEL[8], crumbs: true,   // (a top-out breaks into flat bits, not shards of light)
  fx: () => createPixelFx(), light: false, flash: false, bands: true, pulse: false,
  world: 'page', page: PIXEL_PAGE,
  /** its lettering (Press Start 2P, ~12 KB) — fetched only when the skin shows; its twinkling stars into the view's sky layer */
  enter({ sky } = {}) { loadPixelFont(); pixelSky(sky); },
  warm: (px, ms) => warmPixel(px, ms), drop: clearPixel, count: pixelCount,
};

// ================================================================ GALAXY (night — SKINS 2B: FILLED glowing nebula clouds — colour first)
const galaxy = {
  id: 'galaxy', name: 'GALAXY', line: 'Glowing nebula clouds', look: 'night', unlock: null, family: 'neon', holiday: false,
  tokens: { ink: '#ffffff', sub: '#cfd8f6', panel: '#07051a', line: '#dfe8ff' },
  // (PFIX-3 — S13: the chime is a clear C; the stardust's shimmer a C major-seventh chord (C–E–G–B) under its noise — placed as a chord)
  lettering: 'starlight', sounds: { lock: 'chime', clear: 'dust', files: { lock: 'galaxy-lock', clear: 'galaxy-clear' }, pitch: { lock: 0, clear: { pc: 0, chord: 'maj7' } } },
  variants: GALAXY_VARIANTS,
  sprite: (px, kind, t, v = 0) => galaxySprite(px, kind, t, v),
  fallV: (n, i) => (n * 5 + i) % GALAXY_VARIANTS,
  pieceV: (x, y, t) => (x * 3 + y * 5 + t) % GALAXY_VARIANTS,
  env: () => null, glow: 0.62, pieceGlow: 0.75,   // (a gentle bloom on the rims: the baked ring under the stack + the piece — the tier's glow)
  /** the well's guide: a faint point of starlight at each crossing — nothing ruled (deep space stays dark) */
  grid(g, { px }) {
    const d = Math.max(1.5, px * 0.022);
    g.fillStyle = 'rgba(214, 226, 255, 0.2)';
    for (let x = 1; x < W; x++) for (let y = 1; y < VISIBLE; y++) { g.beginPath(); g.arc(x * px, y * px, d, 0, 6.2832); g.fill(); }
  },
  // the INCOMING rows: DARK ASTEROID ROCK with a faint red rim (an uneven rock — never a piece), the leading edge a thin red glow line
  incoming: sketchIncoming({
    spr: (px, hot) => galaxySprite(px, hot ? 'ihot' : 'incoming', 0), ink: INCOMING, marks: false,
    edge(ctx, yTop, px) {
      const g = ctx.createLinearGradient(0, yTop - px * 0.6, 0, yTop);
      g.addColorStop(0, rgba(INCOMING, 0));
      g.addColorStop(1, rgba(INCOMING, 0.26));
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.fillRect(0, yTop - px * 0.6, W * px, px * 0.6);
      ctx.fillStyle = 'rgba(255, 150, 172, 0.9)';
      ctx.fillRect(0, yTop - Math.max(1, px * 0.02), W * px, Math.max(2, px * 0.035));
    },
  }),
  /** a big mini draws the real clouds; a small one the piece's colour FILLED inside its lighter rim (a KO'd board in dim grey) */
  mini(ctx, { X, Y, s, px, t, ko, x, y }) {
    if (px >= 18 && !ko) { ctx.drawImage(galaxySprite(px, 'block', t, (x * 7 + y * 13) % GALAXY_VARIANTS), X, Y); return; }
    const c = ko ? '#474c5c' : GALAXY[t] || GALAXY[8], e = Math.max(1, Math.round(px * 0.16));
    ctx.fillStyle = ko ? '#5a6072' : mix(c, '#ffffff', 0.5); ctx.fillRect(X, Y, s, s);
    if (s > 2 * e) { ctx.fillStyle = c; ctx.fillRect(X + e, Y + e, s - 2 * e, s - 2 * e); }
  },
  shard: t => GALAXY[t] || GALAXY[8], crumbs: false,   // (a top-out flies apart as light)
  fx: () => createGalaxyFx(), light: false, flash: false, bands: false, pulse: true,
  world: 'page', page: GALAXY_PAGE,
  /** its drifting star field into the view's sky layer (made in code — the galaxy downloads nothing) */
  enter({ sky } = {}) { galaxySky(sky); },
  warm: (px, ms) => warmGalaxy(px, ms), drop: clearGalaxy, count: galaxyCount,
};

// ================================================================ GLASS (the first look — retired by PD-4; in no pool, kept drawable)
const glass = {
  id: 'glass', name: 'GLASS', line: 'Glass crystals', look: null, unlock: null, family: 'neon', holiday: false,
  tokens: { ink: '#ffffff', sub: '#c8d4ee', panel: '#0a0c18', line: '#9fd8ff' },
  lettering: 'neon', sounds: {},
  variants: 3,
  sprite: (px, kind, t) => glassSprite(px, kind, t),
  fallV: (n, i) => i % 3,
  pieceV: () => 0,
  env: () => null, glow: 0, pieceGlow: 0.5,
  grid(g, o) { lineGrid(g, o, 'rgba(200,220,255,0.055)', 'rgba(220,235,255,0.12)', 2); },
  incoming: lightIncoming((px, kind) => glassSprite(px, kind, 0), { core: 'rgba(255,210,220,0.9)', w: 0.07 }),
  mini(ctx, { X, Y, s, t, ko }) { ctx.fillStyle = ko ? '#3a3f4c' : JEWEL[t] || JEWEL[8]; ctx.fillRect(X, Y, s, s); },
  shard: t => JEWEL[t], crumbs: false,
  fx: () => null, light: false, flash: true, bands: true, pulse: false,
  world: 'shader', page: null,
  enter() {},
  warm: () => true, drop: clearGlass, count: glassCount,
};

// (the order = each pool's rotation: DAY crayon · watercolor · paper — NIGHT neon · arcade pixel · galaxy)
export const SKINS = Object.freeze({ crayon: Object.freeze(crayon), watercolor: Object.freeze(watercolor), paper: Object.freeze(paper), neon: Object.freeze(neon), pixel: Object.freeze(pixel), galaxy: Object.freeze(galaxy), glass: Object.freeze(glass) });
export const SKIN_IDS = Object.freeze(Object.keys(SKINS));
/** every hook a skin must have (the contract — tests/prism-skins.test.mjs) */
export const HOOKS = Object.freeze({
  data: ['id', 'name', 'line', 'family', 'tokens', 'lettering', 'sounds', 'variants', 'world'],
  fn: ['sprite', 'fallV', 'pieceV', 'env', 'grid', 'incoming', 'mini', 'shard', 'fx', 'enter', 'warm', 'drop', 'count'],
});
/** the skin for an id — or for a LOOK's old name ('crayon' | 'neon' | 'glass': the share cards + the tickets pass one — they stay crayon by day,
 *  neon by night); an unknown id → the glass (what an unnamed look always drew) */
export const skinById = id => SKINS[id] || SKINS.glass;
/** the default skin of a look (the first of its pool): 'day' → crayon · 'night' → neon */
export const defaultSkin = look => SKINS[POOLS[look === 'day' ? 'day' : 'night'][0]];
/** every sprite cache dropped / counted (view.js#dropCaches — a minute after the match's screen) */
export const dropSkins = () => { for (const id of SKIN_IDS) SKINS[id].drop(); };
export const skinCount = () => SKIN_IDS.reduce((n, id) => n + SKINS[id].count(), 0);

// ================================================================ THE ROTATION (PURE)
/** the pools, in the order they rotate: DAY · NIGHT (a skin's `look`; the glass is in neither) */
export const POOLS = Object.freeze({
  day: Object.freeze(SKIN_IDS.filter(id => SKINS[id].look === 'day')),
  night: Object.freeze(SKIN_IDS.filter(id => SKINS[id].look === 'night')),
});
export const ROTATE = 'rotate';
/** does this phone own a skin? unlock null = everyone; a level unlock = the server's grant (phone.grants — nothing is locked now) */
export const owned = (skin, phone) => !!skin && (!skin.unlock || !!(phone && phone.grants && phone.grants[skin.id]));
/** the skins a phone owns in a look, in the pool's order (never empty: a look's first skin is everyone's). `reg` = the registry (the tests
 *  pass one with a locked skin — nothing is locked in SKINS today) */
export function ownedOf(look, phone, reg = SKINS) {
  const all = POOLS[look === 'day' ? 'day' : 'night'];
  const mine = all.filter(id => owned(reg[id], phone));
  return mine.length ? mine : [all[0]];
}
/** a phone's pool for a look: the skins it owns — a PIN narrows it to one (a pin on a skin it doesn't own, or of the other look = ROTATE) */
export function poolOf(look, phone, reg = SKINS) {
  const mine = ownedOf(look, phone, reg);
  const pin = phone && phone.pin && phone.pin[look === 'day' ? 'day' : 'night'];
  return pin && pin !== ROTATE && mine.includes(pin) ? [pin] : mine;
}
/**
 * THE SKIN A PHONE DRAWS: pool[k % its pool size] — the same pool = the same skin on every phone; every skin before a repeat, never the same
 * twice in a row (for one pool size); fixed for the match — a mid-match look change uses the SAME k on the other pool. From the shared game
 * state + this phone's own settings only (a refresh, a rejoin, a host change draw the same skin).
 */
export function skinOf(game, look, phone) {
  const pool = poolOf(look, phone);
  return SKINS[pool[skinK(game) % pool.length]];
}
/** this phone, for the rotation: its pins (settings.prismSkinDay / prismSkinNight — ROTATE or one skin) + the server's grants (none yet) */
export const phoneOf = (settings, grants = null) => ({ pin: { day: (settings && settings.prismSkinDay) || ROTATE, night: (settings && settings.prismSkinNight) || ROTATE }, grants });
