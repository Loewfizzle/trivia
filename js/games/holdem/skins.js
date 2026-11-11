// HOLD'EM — THE SKIN SYSTEM (HE5 — docs/holdem.md "THE SKINS"; HE6 adds COZY CABIN + CYBERPUNK APARTMENT + THE PICKER), PURE data + PURE helpers.
// A skin = ONE definition here + its art in assets/holdem/<id>/ (scripts/build-holdem-skin.py) + its living touches' CSS (css/holdem.css
// `.he[data-skin='<id>'] .he-live-<k>`) — the view consumes it through CSS variables (skinVars) + a few settings (the light direction for the
// chips, the card back, the backdrop, the living touches): NO skin-specific code path. HE7: the sideways view + desktop use `backdrop.square`.
// A per-PHONE choice (settings.heSkin — the console's settings storage; ☰ → Settings → HOLD'EM → TABLE), default NEON CASINO, changeable any
// time (live, even mid-hand). Only the chosen skin's art loads (skinAssets — the preload + the CSS variables name only its files).
//
//   felt      { img, tile (CSS px), tint }                     the cloth (its normal map baked in)
//   rail      { img, tile, base, trim, trimHi, trimLo, led, sheen }   the rail + the thin trim where it meets the felt (`led` = a glow along it —
//                                                               the apartment's cyan LED; `sheen` 'r, g, b' = the roll's highlight)
//   light     { dir: { x, y }, color: 'r, g, b', strength, pool, at, vignette }   ONE light: the pool on the felt (`at` = where — the cabin's fire
//                                                               is low-left) + the chips' shading (chip-art.js#setLight)
//   print     { color, hi, glow }                               the NEON SPEAKEASY print, printed into the cloth (`glow` = a neon print's light)
//   betline   { color, glow }                                   the betting line round the inner felt (the apartment's pink neon)
//   accent    { main, hi, lo, rgb: 'r, g, b', ink }             what marks YOU + the winner (the stacks, the turn ring, the winning hand, the clock)
//   plate     { bg, rim, rimHi }                                the seats' + your plate (over `button.tex` when the skin has one)
//   button    { glass, glassHi, glassLo, rim, rimHi, rimLo, glow, tex,  the round buttons + presets (glass over an optional texture — the
//               call: { hi, mid, lo, rimHi, rim, rimLo, ink, glow, shine },   cabin's wood); CALL = the main one; FOLD its own rim
//               fold: { glass, rimHi, rim, rimLo, ink } }
//   back      the card back (every opponent's cards + the deal)
//   stock     the card STOCK's paper colour (HE6 — the faces' ink never changes; only the paper's tint: crisp white · warm ivory · cool white)
//   backdrop  { portrait, square, sqY, sqDim, dim, pos, size }   behind the table, darkened by `dim`, placed by `pos` / `size`; HE7: `square` =
//                                                               the sideways view + desktop's (the whole room), `sqY` = which of its rows meet
//                                                               the window's top (0 its top … 1 its bottom), darkened by `sqDim`
//   living    ['neon', 'haze', 'slots']                         the cheap living touches (opacity / transform only) — the FIRST thing the tiers drop
//   thumb     { room, back }                                    THE PICKER's mini table (picker.js — CSS only: the room's mood + the back's colour)
const ASSET = new URL('../../../assets/holdem/', import.meta.url).href;

export const SKINS = Object.freeze({
  casino: Object.freeze({
    id: 'casino', name: 'NEON CASINO', line: 'A high-roller table at night',
    felt: { img: 'casino/felt.webp', tile: 256, tint: '#135530' },
    rail: { img: 'casino/rail.webp', tile: 160, base: '#0b0a09', trim: '#f2c14e', trimHi: '#ffe7a6', trimLo: '#7a5414', led: 'transparent', sheen: '255, 238, 210' },
    light: { dir: { x: -0.45, y: -0.9 }, color: '255, 224, 168', strength: 0.26, pool: 0.58, at: '50% 47%', vignette: 0.68 },
    print: { color: 'rgba(3, 20, 9, 0.62)', hi: 'rgba(150, 230, 170, 0.16)', glow: 'transparent' },
    betline: { color: 'rgba(244, 234, 210, 0.24)', glow: 'transparent' },
    accent: { main: '#f2c14e', hi: '#ffd977', lo: '#e2a92f', rgb: '242, 193, 78', ink: '#1a1204' },
    plate: { bg: 'rgba(9, 8, 6, 0.92)', rim: 'rgba(242, 193, 78, 0.5)', rimHi: 'rgba(255, 231, 166, 0.85)' },
    button: {
      glass: '#171209', glassHi: '#2a2216', glassLo: '#050403', rim: '#f2c14e', rimHi: '#ffe7a6', rimLo: '#7a5414', glow: 'transparent', tex: null,
      call: { hi: '#ffe9a8', mid: '#e2a92f', lo: '#b07a1c', rimHi: '#fff4d0', rim: '#ffe7a6', rimLo: '#9a6a18', ink: '#1a1204', glow: 'rgba(242, 193, 78, 0.35)', shine: 0.5 },
      fold: { glass: '#2a1416', rimHi: '#ffb3bd', rim: '#ff5468', rimLo: '#7a1a26', ink: '#ffd0d6' },
    },
    back: 'cardback-casino.webp', stock: '#fbfaf6',
    backdrop: { portrait: 'casino/backdrop.webp', square: 'casino/square.webp', sqY: 0.1, sqDim: 0.22, dim: 0.18, pos: 'center top', size: 'cover' },
    living: Object.freeze(['neon', 'haze', 'slots']),
    thumb: { room: 'linear-gradient(180deg, rgba(255, 60, 170, 0.45) 0 3px, #0b0910 3px, #060509 70%, #120814)', back: '#7d1420' },
  }),
  cabin: Object.freeze({
    id: 'cabin', name: 'COZY CABIN', line: 'A mountain cabin card night by the fire',
    felt: { img: 'cabin/felt.webp', tile: 256, tint: '#1c4a26' },
    rail: { img: 'cabin/rail.webp', tile: 200, base: '#3a2213', trim: '#c9a052', trimHi: '#f2dca3', trimLo: '#6b4c1c', led: 'transparent', sheen: '255, 222, 176' },
    light: { dir: { x: -0.75, y: 0.55 }, color: '255, 170, 92', strength: 0.3, pool: 0.66, at: '30% 66%', vignette: 0.52 },
    print: { color: 'rgba(246, 230, 194, 0.3)', hi: 'rgba(0, 0, 0, 0.32)', glow: 'transparent' },
    betline: { color: 'rgba(246, 230, 194, 0.3)', glow: 'transparent' },
    accent: { main: '#f2a541', hi: '#ffcb80', lo: '#c97a1e', rgb: '242, 165, 65', ink: '#1f1206' },
    plate: { bg: 'rgba(24, 13, 6, 0.58)', rim: 'rgba(201, 160, 82, 0.6)', rimHi: 'rgba(242, 220, 163, 0.92)' },
    button: {
      glass: 'rgba(40, 22, 10, 0.25)', glassHi: 'rgba(120, 72, 36, 0.32)', glassLo: 'rgba(14, 7, 2, 0.62)', rim: '#c9a052', rimHi: '#f2dca3', rimLo: '#6b4c1c', glow: 'transparent', tex: 'cabin/wood.webp',
      call: { hi: '#ffdca0', mid: '#e39a3c', lo: '#a6621a', rimHi: '#fff1cf', rim: '#f2dca3', rimLo: '#7d5418', ink: '#1f1206', glow: 'rgba(242, 165, 65, 0.4)', shine: 0.45 },
      fold: { glass: 'rgba(70, 20, 12, 0.5)', rimHi: '#ffb9a3', rim: '#d9603f', rimLo: '#6e2416', ink: '#ffd9cc' },
    },
    back: 'cardback-cabin.webp', stock: '#f7efde',
    backdrop: { portrait: 'cabin/backdrop.webp', square: 'cabin/square.webp', sqY: 0.16, sqDim: 0.12, dim: 0.06, pos: 'center top', size: 'cover' },
    living: Object.freeze(['fire', 'snow', 'lamp']),
    thumb: { room: 'radial-gradient(60% 30% at 0% 100%, rgba(255, 140, 50, 0.55), rgba(0, 0, 0, 0) 100%), repeating-linear-gradient(180deg, #2b1a0f 0 5px, #20130a 5px 7px)', back: '#7b1d1a' },
  }),
  apartment: Object.freeze({
    id: 'apartment', name: 'CYBERPUNK APARTMENT', line: 'A high-rise table above a rainy neon city',
    felt: { img: 'apartment/felt.webp', tile: 256, tint: '#07232b' },
    rail: { img: 'apartment/rail.webp', tile: 220, base: '#1a1e26', trim: '#3be0ff', trimHi: '#c2f7ff', trimLo: '#0a5568', led: 'rgba(59, 224, 255, 0.7)', sheen: '205, 228, 255' },
    light: { dir: { x: 0.35, y: -0.9 }, color: '150, 215, 255', strength: 0.15, pool: 0.5, at: '50% 46%', vignette: 0.82 },
    print: { color: 'rgba(150, 245, 255, 0.62)', hi: 'transparent', glow: 'rgba(59, 224, 255, 0.55)' },
    betline: { color: 'rgba(255, 92, 200, 0.82)', glow: 'rgba(255, 60, 190, 0.7)' },
    accent: { main: '#3bd9ff', hi: '#a3f1ff', lo: '#1599c2', rgb: '59, 217, 255', ink: '#021319' },
    plate: { bg: 'rgba(8, 14, 34, 0.9)', rim: 'rgba(255, 80, 192, 0.55)', rimHi: 'rgba(255, 176, 232, 0.92)' },
    button: {
      glass: '#0b1430', glassHi: '#1c2b58', glassLo: '#03060f', rim: '#ff4fc0', rimHi: '#ffb6e8', rimLo: '#7a1660', glow: 'rgba(255, 79, 192, 0.42)', tex: null,
      call: { hi: '#1f3d74', mid: '#0d1c40', lo: '#050b1e', rimHi: '#ffd6f2', rim: '#ff6ccc', rimLo: '#8e1a70', ink: '#a3f1ff', glow: 'rgba(255, 79, 192, 0.65)', shine: 0.18 },
      fold: { glass: '#2a0b22', rimHi: '#ffb3c9', rim: '#ff4f7e', rimLo: '#7a1234', ink: '#ffd0dc' },
    },
    back: 'cardback-apartment.webp', stock: '#fcfdff',
    backdrop: { portrait: 'apartment/backdrop.webp', square: 'apartment/square.webp', sqY: 0, sqDim: 0.14, dim: 0.1, pos: 'center top', size: 'cover' },
    living: Object.freeze(['rain', 'sign', 'sweep']),
    thumb: { room: 'linear-gradient(90deg, rgba(59, 224, 255, 0.55) 0 2px, rgba(0, 0, 0, 0) 2px calc(100% - 2px), rgba(255, 79, 192, 0.55) calc(100% - 2px)), linear-gradient(180deg, #1a2350, #0a0f24 28%, #060912)', back: 'linear-gradient(135deg, #3be0ff, #8a4dff 50%, #ff4fc0)' },
  }),
});
export const SKIN_IDS = Object.freeze(Object.keys(SKINS));
export const DEFAULT_SKIN = 'casino';
/** the skin for a setting (an unknown or retired id → the default) */
export const skinOf = id => SKINS[id] || SKINS[DEFAULT_SKIN];
/** an asset's URL */
export const assetUrl = p => (p ? ASSET + p : '');
const url = p => (p ? `url("${assetUrl(p)}")` : 'none');

/** the CSS variables the view sets on its root (only the chosen skin's files are named — so only they load) */
export function skinVars(skin) {
  const s = skin || SKINS[DEFAULT_SKIN], L = s.light, B = s.button, C = B.call, F = B.fold;
  return {
    '--he-felt-img': url(s.felt.img), '--he-felt-tile': `${s.felt.tile}px`, '--he-felt-tint': s.felt.tint,
    '--he-rail-img': url(s.rail.img), '--he-rail-tile': `${s.rail.tile}px`, '--he-rail-base': s.rail.base,
    '--he-trim': s.rail.trim, '--he-trim-hi': s.rail.trimHi, '--he-trim-lo': s.rail.trimLo, '--he-trim-glow': s.rail.led, '--he-sheen': s.rail.sheen,
    '--he-light': L.color, '--he-light-k': String(L.strength), '--he-light-pool': `${Math.round(L.pool * 100)}%`, '--he-light-at': L.at, '--he-vignette': String(L.vignette),
    '--he-print': s.print.color, '--he-print-hi': s.print.hi, '--he-print-glow': s.print.glow,
    '--he-betline': s.betline.color, '--he-betline-glow': s.betline.glow,
    '--he-gold': s.accent.main, '--he-gold-2': s.accent.hi, '--he-gold-lo': s.accent.lo, '--he-gold-rgb': s.accent.rgb, '--he-ink': s.accent.ink,
    '--he-plate': s.plate.bg, '--he-plate-rim': s.plate.rim, '--he-plate-rim-hi': s.plate.rimHi,
    '--he-glass': B.glass, '--he-glass-hi': B.glassHi, '--he-glass-lo': B.glassLo, '--he-rim': B.rim, '--he-rim-hi': B.rimHi, '--he-rim-lo': B.rimLo,
    '--he-btn-glow': B.glow, '--he-tex': url(B.tex),
    '--he-call-hi': C.hi, '--he-call-mid': C.mid, '--he-call-lo': C.lo, '--he-call-rim-hi': C.rimHi, '--he-call-rim': C.rim, '--he-call-rim-lo': C.rimLo,
    '--he-call-ink': C.ink, '--he-call-glow': C.glow, '--he-call-shine': String(C.shine),
    '--he-fold-glass': F.glass, '--he-fold-rim-hi': F.rimHi, '--he-fold-rim': F.rim, '--he-fold-rim-lo': F.rimLo, '--he-fold-ink': F.ink,
    '--he-stock': s.stock,
    '--he-backdrop': url(s.backdrop.portrait), '--he-backdrop-dim': String(s.backdrop.dim), '--he-backdrop-pos': s.backdrop.pos, '--he-backdrop-size': s.backdrop.size,
    '--he-square': url(s.backdrop.square), '--he-sq-y': String(s.backdrop.sqY), '--he-sq-dim': String(s.backdrop.sqDim),
  };
}
/** every file the skin draws with (the preload fetches only these) — HE7: `wide` = the screen is sideways (the square backdrop, not the portrait's) */
export const skinAssets = (skin, wide = false) => { const s = skin || SKINS[DEFAULT_SKIN]; return [s.felt.img, s.rail.img, s.back, wide ? s.backdrop.square : s.backdrop.portrait, s.button.tex].filter(Boolean).map(assetUrl); };
