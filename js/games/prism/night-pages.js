// PRISM DROP — THE NEW NIGHT SKINS' PAGES + SKIES (SKINS 2B; docs/prism.md "THE SKINS"): what fills the screen behind the board. A night skin
// of this kind is a PAGE skin (page.js's host draws its `page` painter ONCE per change — the size, the board's place, the tier's `lite` — never
// in the frame loop; the WebGL world + the light layer do NO work), and what MOVES behind the board is a few DOM pieces the skin puts in the
// view's empty SKY layer (`.pd-sky`, above the page, under the board) when it shows — moved by CSS on the compositor (transform / opacity
// only), never by a frame loop of ours. The view marks the lower tiers (`.pd[data-lite]`) and reduced effects (`.pd[data-still]`): the CSS
// (css/prism.css) stops the sky's motion there — the extras go FIRST, the board's sharpness LAST.
//   PIXEL_PAGE (arcade pixel): a deep blue-black radial, sparse PIXEL STARS (2–3 px squares on whole pixels), the well a near-black field.
//   pixelSky(sky): a dozen stars that TWINKLE (a hard two-step blink — `.pd-tw`).
import { seeded } from './skin-kit.js';

const el = (tag, cls, style) => { const e = document.createElement(tag); e.className = cls; if (style) e.style.cssText = style; return e; };

// ================================================================ ARCADE PIXEL
const STAR_COLS = ['#ffffff', '#ffffff', '#9fe8ff', '#fff3a6', '#c9b6ff'];
export const PIXEL_PAGE = Object.freeze({
  id: 'pixel', lite: true,
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
