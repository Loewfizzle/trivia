// HOLD'EM — THE SKIN SYSTEM (HE5 — docs/holdem.md "THE SKINS"; Ben: docs/games/plan.md "HE5"), PURE data + PURE helpers. A skin = ONE
// definition here + its art in assets/holdem/<id>/ + its living touches' CSS (css/holdem.css `.he[data-skin='<id>']`) — the view consumes it
// through CSS variables (skinVars) + a few settings (the light direction for the chips, the card back, the backdrop, the living touches): NO
// skin-specific code path. HE6 adds COZY CABIN + CYBERPUNK APARTMENT as two more entries (+ the picker); HE7's sideways view uses `backdrop.square`.
// A per-PHONE choice (settings.heSkin — the console's settings storage), default NEON CASINO, changeable any time (live, even mid-hand). Only
// the chosen skin's art loads (skinAssets — the preload + the CSS variables name only its files).
//
//   felt      { img, tile (CSS px), tint }                     the cloth (its normal map baked in: scripts/build-holdem-skin.py)
//   rail      { img, tile, base, trim, trimHi, trimLo }         the padded rail + the thin trim line where it meets the felt
//   light     { dir: { x, y }, color: 'r, g, b', strength, pool, vignette }   ONE light: the pool on the felt + the chips' shading (chip-art.js#setLight)
//   print     { color, hi }                                     the NEON SPEAKEASY print, printed into the cloth
//   accent    { main, hi, ink }                                 what marks YOU + the winner (the stacks, the gold lines)
//   plate     { bg, rim, rimHi }   button { glass, glassHi, rim, rimHi, rimLo }   the black glass + its rims
//   back      the card back (every opponent's cards + the deal)
//   stock     the card STOCK's paper colour (HE6 — the faces' ink never changes; only the paper's tint: crisp white · warm ivory · cool white)
//   backdrop  { portrait, square, dim }                         behind the table (square = HE7's sideways view), darkened by `dim`
//   living    ['neon', 'haze', 'slots']                         the cheap living touches (opacity / transform only) — the FIRST thing the tiers drop
const ASSET = new URL('../../../assets/holdem/', import.meta.url).href;

export const SKINS = Object.freeze({
  casino: Object.freeze({
    id: 'casino', name: 'NEON CASINO', line: 'A high-roller table at night',
    felt: { img: 'casino/felt.webp', tile: 256, tint: '#135530' },
    rail: { img: 'casino/rail.webp', tile: 160, base: '#0b0a09', trim: '#f2c14e', trimHi: '#ffe7a6', trimLo: '#7a5414' },
    light: { dir: { x: -0.45, y: -0.9 }, color: '255, 224, 168', strength: 0.26, pool: 0.58, vignette: 0.68 },
    print: { color: 'rgba(3, 20, 9, 0.62)', hi: 'rgba(150, 230, 170, 0.16)' },
    accent: { main: '#f2c14e', hi: '#ffd977', ink: '#1a1204' },
    plate: { bg: 'rgba(9, 8, 6, 0.92)', rim: 'rgba(242, 193, 78, 0.5)', rimHi: 'rgba(255, 231, 166, 0.85)' },
    button: { glass: '#171209', glassHi: '#2a2216', rim: '#f2c14e', rimHi: '#ffe7a6', rimLo: '#7a5414' },
    back: 'cardback-casino.webp', stock: '#fbfaf6',
    backdrop: { portrait: 'casino/backdrop.webp', square: null, dim: 0.18 },
    living: Object.freeze(['neon', 'haze', 'slots']),
  }),
});
export const SKIN_IDS = Object.freeze(Object.keys(SKINS));
export const DEFAULT_SKIN = 'casino';
/** the skin for a setting (an unknown or retired id → the default) */
export const skinOf = id => SKINS[id] || SKINS[DEFAULT_SKIN];
/** an asset's URL */
export const assetUrl = p => (p ? ASSET + p : '');

/** the CSS variables the view sets on its root (only the chosen skin's files are named — so only they load) */
export function skinVars(skin) {
  const s = skin || SKINS[DEFAULT_SKIN], L = s.light;
  return {
    '--he-felt-img': `url("${assetUrl(s.felt.img)}")`, '--he-felt-tile': `${s.felt.tile}px`, '--he-felt-tint': s.felt.tint,
    '--he-rail-img': `url("${assetUrl(s.rail.img)}")`, '--he-rail-tile': `${s.rail.tile}px`, '--he-rail-base': s.rail.base,
    '--he-trim': s.rail.trim, '--he-trim-hi': s.rail.trimHi, '--he-trim-lo': s.rail.trimLo,
    '--he-light': L.color, '--he-light-k': String(L.strength), '--he-light-pool': `${Math.round(L.pool * 100)}%`, '--he-vignette': String(L.vignette),
    '--he-print': s.print.color, '--he-print-hi': s.print.hi,
    '--he-gold': s.accent.main, '--he-gold-2': s.accent.hi, '--he-ink': s.accent.ink,
    '--he-plate': s.plate.bg, '--he-plate-rim': s.plate.rim, '--he-plate-rim-hi': s.plate.rimHi,
    '--he-glass': s.button.glass, '--he-glass-hi': s.button.glassHi, '--he-rim': s.button.rim, '--he-rim-hi': s.button.rimHi, '--he-rim-lo': s.button.rimLo,
    '--he-stock': s.stock,
    '--he-backdrop': s.backdrop.portrait ? `url("${assetUrl(s.backdrop.portrait)}")` : 'none', '--he-backdrop-dim': String(s.backdrop.dim),
  };
}
/** every file the skin draws with (the preload fetches only these) */
export const skinAssets = skin => { const s = skin || SKINS[DEFAULT_SKIN]; return [s.felt.img, s.rail.img, s.back, s.backdrop.portrait].filter(Boolean).map(assetUrl); };
