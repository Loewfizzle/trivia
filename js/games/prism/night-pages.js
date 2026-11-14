// PRISM DROP — THE NEW NIGHT SKINS' PAGES + SKIES (SKINS 2B; docs/prism.md "THE SKINS"): what fills the screen behind the board. A night skin
// of this kind is a PAGE skin (page.js's host draws its `page` painter ONCE per change — the size, the board's place, the tier's `lite` — never
// in the frame loop; the WebGL world + the light layer do NO work), and what MOVES behind the board is a few DOM pieces the skin puts in the
// view's empty SKY layer (`.pd-sky`, above the page, under the board) when it shows — moved by CSS on the compositor (transform / opacity
// only), never by a frame loop of ours. The view marks the lower tiers (`.pd[data-lite]`) and reduced effects (`.pd[data-still]`): the CSS
// (css/prism.css) stops the sky's motion there — the extras go FIRST, the board's sharpness LAST.
//   PIXEL_PAGE (arcade pixel): a deep blue-black radial, sparse PIXEL STARS (2–3 px squares on whole pixels), the well a near-black field.
//   pixelSky(sky): a dozen stars that TWINKLE (a hard two-step blink — `.pd-tw`).
//   GALAXY_PAGE (galaxy): DEEP SPACE — a near-black violet ground, a FAINT NEBULA (three big soft clouds, drawn small + scaled up), a still
//   field of fine stars; DIMMED under the well so the blocks have the most contrast (the frame is the CSS's thin cool-white glow line).
//   galaxySky(sky): the SLOW-DRIFTING STAR FIELD — ONE layer of stars (a small tile, made once in code, repeated) sliding down ~5 px a
//   second by a CSS transform (`.pd-drift`).
import { seeded, rgba } from './skin-kit.js';

const el = (tag, cls, style) => { const e = document.createElement(tag); e.className = cls; if (style) e.style.cssText = style; return e; };

// ================================================================ ARCADE PIXEL
const STAR_COLS = ['#ffffff', '#ffffff', '#9fe8ff', '#fff3a6', '#c9b6ff'];
export const PIXEL_PAGE = Object.freeze({
  id: 'pixel', lite: false,   // (its extras are the sky's + the scanlines — the CSS drops them: .pd[data-lite])
  ok: () => true,
  key: () => '',
  files: () => [],
  paint(ctx, st) {
    const { w, h, board } = st;
    const g = ctx.createRadialGradient(w / 2, h * 0.36, 0, w / 2, h * 0.36, Math.max(w, h) * 0.9);
    g.addColorStop(0, '#0e1540'); g.addColorStop(0.5, '#070a20'); g.addColorStop(1, '#020309');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // sparse pixel stars: squares of 2–3 px on whole pixels (the same sky on every phone of a size)
    const r = seeded(8191), n = Math.round((w * h) / 5200);
    for (let i = 0; i < n; i++) {
      const x = Math.round(r() * (w - 3)), y = Math.round(r() * (h - 3)), s = r() < 0.28 ? 3 : 2;
      ctx.globalAlpha = 0.3 + r() * 0.55;
      ctx.fillStyle = STAR_COLS[Math.floor(r() * STAR_COLS.length)];
      ctx.fillRect(x, y, s, s);
    }
    ctx.globalAlpha = 1;
    // the well: a near-black field (the stars only faintly through it) — the frame is the CSS's crisp cyan pixel border
    if (board) { ctx.fillStyle = 'rgba(2, 3, 12, 0.9)'; ctx.fillRect(board.x, board.y, board.w, board.h); }
  },
});
/** the stars that twinkle: a dozen 2–3 px squares, each blinking in two hard steps on its own clock (CSS — opacity only) */
export function pixelSky(sky) {
  if (!sky) return;
  const r = seeded(4099);
  for (let i = 0; i < 12; i++) {
    const s = r() < 0.4 ? 3 : 2;
    sky.append(el('i', 'pd-tw', `left:${(4 + r() * 92).toFixed(2)}%;top:${(3 + r() * 94).toFixed(2)}%;width:${s}px;height:${s}px;background:${STAR_COLS[Math.floor(r() * STAR_COLS.length)]};animation-duration:${(1.6 + r() * 2.6).toFixed(2)}s;animation-delay:-${(r() * 3).toFixed(2)}s`));
  }
}

// ================================================================ GALAXY
const canvasOf = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
/** the faint nebula: three big soft clouds (violet across the top, teal at the right, magenta low-left) — drawn at a sixth of the size and
 *  scaled up (soft for free) */
function nebula(w, h) {
  const k = 6, c = canvasOf(w / k, h / k), x = c.getContext('2d'), r = seeded(6007);
  x.scale(1 / k, 1 / k);
  const cloud = (cx, cy, rad, col, a) => {
    for (let i = 0; i < 6; i++) {
      const ang = r() * 6.28, d = rad * (0.1 + r() * 0.55), px = cx + Math.cos(ang) * d, py = cy + Math.sin(ang) * d * 0.7, rr = rad * (0.4 + r() * 0.45);
      const g = x.createRadialGradient(px, py, 0, px, py, rr);
      g.addColorStop(0, rgba(col, a)); g.addColorStop(0.6, rgba(col, a * 0.45)); g.addColorStop(1, rgba(col, 0));
      x.fillStyle = g;
      x.fillRect(px - rr, py - rr, rr * 2, rr * 2);
    }
  };
  cloud(w * 0.3, h * 0.12, w * 0.75, '#5a2fb0', 0.13);
  cloud(w * 1.0, h * 0.5, w * 0.6, '#1c6f96', 0.1);
  cloud(w * 0.05, h * 0.86, w * 0.7, '#8a2c7a', 0.1);
  return c;
}
const GAL_STARS = ['#ffffff', '#ffffff', '#dfe8ff', '#bcd0ff', '#ffe9c4'];
export const GALAXY_PAGE = Object.freeze({
  id: 'galaxy', lite: false,   // (its extra is the sky's drift — the CSS stops it: .pd[data-lite])
  ok: () => true,
  key: () => '',
  files: () => [],
  paint(ctx, st, T) {
    const { w, h, board } = st;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0a0620'); g.addColorStop(0.5, '#06041a'); g.addColorStop(1, '#030210');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const W0 = Math.round(w), H0 = Math.round(h);
    ctx.drawImage(T.layer(`gn|${W0}|${H0}`, () => nebula(W0, H0)), 0, 0, w, h);
    // the still stars: fine points (most faint, a few bright with a small halo) — the drifting field slides over them
    const r = seeded(9011), n = Math.round((w * h) / 2600);
    for (let i = 0; i < n; i++) {
      const x = r() * w, y = r() * h, big = r() < 0.08, s = big ? 1.2 : 0.5 + r() * 0.5;
      ctx.globalAlpha = big ? 0.9 : 0.25 + r() * 0.5;
      ctx.fillStyle = GAL_STARS[Math.floor(r() * GAL_STARS.length)];
      ctx.beginPath(); ctx.arc(x, y, s, 0, 6.2832); ctx.fill();
      if (big) { ctx.globalAlpha = 0.16; ctx.beginPath(); ctx.arc(x, y, 4, 0, 6.2832); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    // THE WELL: dimmed (the nebula + the stars only faintly through it) — the blocks get the most contrast
    if (board) { ctx.fillStyle = 'rgba(3, 2, 12, 0.84)'; ctx.fillRect(board.x, board.y, board.w, board.h); }
  },
});
// the drifting field's tile: stars on nothing, made ONCE (a PNG data URL the CSS repeats — ~10 KB of pixels, no download)
export const DRIFT_TILE = 256;
let driftUrl = '';
function driftTile() {
  if (driftUrl) return driftUrl;
  const k = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1), c = canvasOf(DRIFT_TILE * k, DRIFT_TILE * k), x = c.getContext('2d'), r = seeded(1213);
  x.scale(k, k);
  for (let i = 0; i < 34; i++) {
    const px = r() * DRIFT_TILE, py = r() * DRIFT_TILE, big = r() < 0.14, s = big ? 1.1 + r() * 0.5 : 0.55 + r() * 0.45;
    x.globalAlpha = big ? 0.95 : 0.4 + r() * 0.45;
    x.fillStyle = GAL_STARS[Math.floor(r() * GAL_STARS.length)];
    // (drawn wrapped: a star on the tile's edge shows on both sides — no seam)
    for (const ox of [-DRIFT_TILE, 0, DRIFT_TILE]) for (const oy of [-DRIFT_TILE, 0, DRIFT_TILE]) { x.beginPath(); x.arc(px + ox, py + oy, s, 0, 6.2832); x.fill(); }
  }
  try { driftUrl = c.toDataURL('image/png'); } catch { driftUrl = ''; }
  c.width = 0; c.height = 0;
  return driftUrl;
}
/** the slow-drifting star field: ONE layer, a tile taller than the screen, sliding down one tile every ~48 s (CSS — a transform only) */
export function galaxySky(sky) {
  if (!sky) return;
  const url = driftTile();
  if (!url) return;
  sky.append(el('i', 'pd-drift', `background-image:url(${url});background-size:${DRIFT_TILE}px ${DRIFT_TILE}px;top:-${DRIFT_TILE}px;--pd-drift:${DRIFT_TILE}px`));
}
