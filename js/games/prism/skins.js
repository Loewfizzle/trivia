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
//   — THE BLOCKS (pre-drawn sprites, cached per cell size, warmed in idle slices: no stroke, shadow or blur is drawn in a frame)
//   variants · sprite(px, kind, t, v, env) — kind: block | grey (the danger drain) | ghost (the landing preview) | glow | incoming | iglow
//   fallV(n, i) · pieceV(x, y, t) — the falling piece's + HOLD / NEXT's variants (the stack's = by place: (x·7 + y·13) % variants)
//   env(pal)  what the sprites draw with (the night's world palette) or null · glow / pieceGlow — the added light under the stack / the piece
//   grid(g, o) — the well's grid layer · incoming(ctx, bands, o) — THE RISING ROWS (skin-kit.js: an occupied cell only tinted, the gap open)
//   mini(ctx, c) — one cell of a mini board (the rail, spectating, the podium) · shard(t, env) — a top-out's shard colour · crumbs — paint, not light
//   — THE MOMENTS
//   fx()      the moments drawn ON the board's canvas (a lock, a slam, a clear, a cancel — crayonfx.js's interface) or null
//   light     the WebGL light layer + neonfx.js run (the night's clears are LIGHT) · flash — the glass's own lock flash + sweeps
//   bands     a junk glitch draws digital colour bands · pulse — a big clear pulses the board (CSS)
//   — THE SCENE
//   world     'shader' (the WebGL world behind the board) | 'page' (page.js — the skin's `page` painter fills the screen; no shader work)
//   page      { id, ok, key, files, paint } (page.js) | null · enter(o) — the skin shows: its own files load NOW, never before (o: { root, paper })
//   idle(o)   → [stage] the art worth warming in idle slices while ANOTHER look shows (a live switch then only composites) — optional
//   warm(px, ms) → true once every block of a size is drawn · drop() · count() — the sprite cache (dropped a minute after the match's screen)
//   holiday   takes the holiday hook's overrides (holiday.js — crayon + neon only)
//
// THE ROTATION (PURE — tests/prism-skins.test.mjs): POOLS · owned(skin, phone) · poolOf(look, phone) · skinOf(game, look, phone) ·
// dealSkin(seed, used) (the HOST's counter, from the night's memory) · soloSkin(cur) (the PLAYER's own counter) · phoneOf(settings)
import { W, VISIBLE } from './engine.js';
import { JEWEL, rgba, mix, lightIncoming, sketchIncoming } from './skin-kit.js';
import { neonPalette } from './neon.js';
import { CRAYON, CRAYON_LINE, GRAPHITE } from './crayon.js';
import { crayonSprite, VARIANTS as CRAYON_VARIANTS, warmCrayon, clearCrayon, crayonCount, toothMaskURL, warmTooth } from './crayon-art.js';
import { createCrayonFx } from './crayonfx.js';
import { neonSprite, clearNeon, neonCount } from './neon-art.js';
import { glassSprite, clearGlass, glassCount } from './glass-art.js';
import { CRAYON_PAGE, warmDay } from './page.js';

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

export const SKINS = Object.freeze({ crayon: Object.freeze(crayon), neon: Object.freeze(neon), glass: Object.freeze(glass) });
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
/** the skins a phone owns in a look, in the pool's order (never empty: a look's first skin is everyone's) */
export function ownedOf(look, phone) {
  const all = POOLS[look === 'day' ? 'day' : 'night'];
  const mine = all.filter(id => owned(SKINS[id], phone));
  return mine.length ? mine : [all[0]];
}
/** a phone's pool for a look: the skins it owns — a PIN narrows it to one (a pin on a skin it doesn't own, or of the other look = ROTATE) */
export function poolOf(look, phone) {
  const mine = ownedOf(look, phone);
  const pin = phone && phone.pin && phone.pin[look === 'day' ? 'day' : 'night'];
  return pin && pin !== ROTATE && mine.includes(pin) ? [pin] : mine;
}
/** the match's skin counter: the host's deal (`game.sk`); a game from before SKINS 1 (no counter) = 0 — the look's first skin */
export const skinK = game => (game && Number.isInteger(game.sk) && game.sk >= 0 ? game.sk : 0);
/**
 * THE SKIN A PHONE DRAWS: pool[k % its pool size] — the same pool = the same skin on every phone; every skin before a repeat, never the same
 * twice in a row (for one pool size); fixed for the match — a mid-match look change uses the SAME k on the other pool. From the shared game
 * state + this phone's own settings only (a refresh, a rejoin, a host change draw the same skin).
 */
export function skinOf(game, look, phone) {
  const pool = poolOf(look, phone);
  return SKINS[pool[skinK(game) % pool.length]];
}
/**
 * THE HOST's deal at start(): the room's skin counter, +1 a match — remembered in THE NIGHT'S MEMORY (meta/used/prism: `sk<k>` = a match
 * tonight drew counter k; no rules change — kit/night.js, like the paper's `pp<k>-<i>`). The night's first match starts from the match's seed
 * (a room's first skin isn't always the same one). → { k, key } (key → `markUsed('prism', [key])`)
 */
export function dealSkin(seed, used = {}) {
  const past = Object.keys(used || {}).map(k => /^sk(\d+)$/.exec(k)).filter(Boolean).map(m => Number(m[1]));
  const k = past.length ? Math.max(...past) + 1 : hash(String(seed)) % SK_START;
  return { k, key: `sk${k}` };
}
/** the first counter of a night is under this (a multiple of every pool size up to 6 — every skin is as likely to open a night) */
export const SK_START = 60;
/** THE PLAYER's OWN COUNTER (a solo run + THE DROP — this phone's settings, +1 a run): cur = settings.prismSkinK → { k, next } */
export function soloSkin(cur) {
  const k = Number.isInteger(cur) && cur >= 0 ? cur : 0;
  return { k, next: (k + 1) % 1_000_000 };
}
/** this phone, for the rotation: its pins (settings.prismSkinDay / prismSkinNight — ROTATE or one skin) + the server's grants (none yet) */
export const phoneOf = (settings, grants = null) => ({ pin: { day: (settings && settings.prismSkinDay) || ROTATE, night: (settings && settings.prismSkinNight) || ROTATE }, grants });

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
