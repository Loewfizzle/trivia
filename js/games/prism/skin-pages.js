// PRISM DROP — THE NEW DAY SKINS' PAGES (SKINS 1; docs/prism.md "THE SKINS"): what fills the screen behind the board — page.js's host draws a
// skin's `page` painter ONCE per change (the paper, the song's world, the size, the board's place — never in the frame loop).
//   WATER_PAGE (watercolor): warm COLD-PRESS paper with real tooth (assets/prism/paper/watercolor.webp — CC0, tiled; a flat #f6f0e2 until it's in),
//   three faint pastel WASHES, the song's world as a VERY faint loose wash behind the board (the crayon's doodle shapes, painted wide + soft),
//   the well a clean patch of paper inside a brushed line.
//   PAPER_PAGE (paper cut-out): a KRAFT-BOARD table (kraft.webp — CC0 fibres, tan), a big WHITE SHEET under the board (its soft shadow baked,
//   rotated a hair), the world as 2–3 layered paper SILHOUETTES at the screen's edges, the board's frame a DASHED CUT LINE.
// `lite` (the LOW tier — view.js passes it): the world's silhouettes are dropped first. Only the SHOWN skin's texture is fetched (files()).
import { DOODLES } from './page.js';
import { rgba, seeded } from './skin-kit.js';

const ASSET = new URL('../../../assets/prism/paper/', import.meta.url);
export const WATER_TEX = new URL('watercolor.webp', ASSET).href;
export const KRAFT_TEX = new URL('kraft.webp', ASSET).href;
export const WATER_PAPER = '#f6f0e2';
export const KRAFT = '#c6a576';
export const SHEET = '#fbf9f4';

const canvasOf = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
/** the tile as a pattern at half size (one tile pixel = one CSS px ÷ 2 — the tooth stays fine on a phone) */
function tile(ctx, img) {
  if (!img) return null;
  const p = ctx.createPattern(img, 'repeat');
  if (p.setTransform) p.setTransform(new DOMMatrix().scale(0.5));
  return p;
}
/** the song's world drawn WIDE + SOFT: the doodle's own shapes (page.js#DOODLES) at a fraction of the size with every line fattened — scaled back
 *  up it reads as a loose wash / a soft-edged shape, never a line drawing. `ink` = one colour for all of it, or null = the doodle's own colours */
function looseWorld(world, w, h, { k = 5, fat = 5, ink = null } = {}) {
  const c = canvasOf(w / k, h / k), x = c.getContext('2d');
  x.scale(1 / k, 1 / k);
  // (the doodles set their own line widths: a thin proxy fattens each one — the drawing code is shared, not copied)
  const wide = new Proxy(x, {
    get(t, key) { const v = t[key]; return typeof v === 'function' ? v.bind(t) : v; },
    set(t, key, v) { t[key] = key === 'lineWidth' ? v * fat : v; return true; },
  });
  (DOODLES[world] || DOODLES.sunset)(wide, w, h, ink, seeded(world.length * 131 + 7));
  return c;
}

// ================================================================ WATERCOLOR
/** three faint pastel washes (peach top-left, sky at the right, mint low-left): pools of thin paint with a dried edge — drawn small, scaled up soft */
function washes(w, h) {
  const k = 4, c = canvasOf(w / k, h / k), x = c.getContext('2d'), r = seeded(2311);
  x.scale(1 / k, 1 / k);
  const pool = (cx, cy, rad, col, a) => {
    for (let i = 0; i < 7; i++) {
      const ang = r() * 6.28, d = rad * (0.15 + r() * 0.5), px = cx + Math.cos(ang) * d, py = cy + Math.sin(ang) * d * 0.8, rr = rad * (0.45 + r() * 0.4);
      const g = x.createRadialGradient(px, py, rr * 0.1, px, py, rr);
      g.addColorStop(0, rgba(col, a));
      g.addColorStop(0.78, rgba(col, a * 0.8));
      g.addColorStop(0.92, rgba(col, a * 1.25));   // (the dried edge: pigment carried out to the pool's rim)
      g.addColorStop(1, rgba(col, 0));
      x.fillStyle = g;
      x.fillRect(px - rr, py - rr, rr * 2, rr * 2);
    }
  };
  pool(w * 0.12, h * 0.1, w * 0.5, '#f3b594', 0.05);
  pool(w * 0.95, h * 0.42, w * 0.48, '#8fc4e8', 0.05);
  pool(w * 0.2, h * 0.93, w * 0.55, '#9dd9b0', 0.045);
  return c;
}
export const WATER_PAGE = Object.freeze({
  id: 'watercolor', lite: true,
  ok: () => true,
  key: () => '',
  files: () => [WATER_TEX],
  paint(ctx, st, T) {
    const { world, w, h, board, lite } = st;
    const pat = tile(ctx, T.img(WATER_TEX));
    ctx.fillStyle = pat || WATER_PAPER;
    ctx.fillRect(0, 0, w, h);
    const W0 = Math.round(w), H0 = Math.round(h);
    ctx.drawImage(T.layer(`ww|${W0}|${H0}`, () => washes(W0, H0)), 0, 0, w, h);
    // the song's world: a VERY faint loose wash (the low tier drops it)
    if (!lite) {
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.drawImage(T.layer(`wl|${world || 'sunset'}|${W0}|${H0}`, () => looseWorld(world || 'sunset', W0, H0, { k: 5, fat: 5 })), 0, 0, w, h);
      ctx.restore();
    }
    if (!board) return;
    // the well: a clean patch of the paper (the washes + the world only faintly through it), inside a soft brushed line
    const b = board, pad = 3;
    ctx.save();
    ctx.globalAlpha = 0.66;
    ctx.fillStyle = pat || WATER_PAPER;
    ctx.fillRect(b.x - pad, b.y - pad, b.w + 2 * pad, b.h + 2 * pad);
    ctx.restore();
    const r = seeded(41), o = 5, L = b.x - o, Tp = b.y - o, R = b.x + b.w + o, B = b.y + b.h + o;
    ctx.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) {
      const j = () => (r() - 0.5) * (pass ? 2.4 : 1.2);
      ctx.lineWidth = pass ? 1.2 : 2.6;
      ctx.strokeStyle = rgba('#5c6f92', pass ? 0.3 : 0.5);
      ctx.beginPath();
      ctx.moveTo(L - 4 * r(), Tp + j()); ctx.lineTo(R + 4 * r(), Tp + j());
      ctx.moveTo(R + j(), Tp - 4 * r()); ctx.lineTo(R + j(), B + 4 * r());
      ctx.moveTo(R + 4 * r(), B + j()); ctx.lineTo(L - 4 * r(), B + j());
      ctx.moveTo(L + j(), B + 4 * r()); ctx.lineTo(L + j(), Tp - 4 * r());
      ctx.stroke();
    }
  },
});
