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

// ================================================================ PAPER CUT-OUT
// the song's world as LAYERED PAPER SILHOUETTES along the screen's foot (+ one cut-out in a top corner): each world = its layers' profiles
// (y as a share of the band's height, by x 0–1), back to front, in its own muted papers. Cut once into a layer (page.js caches it).
const hills = (n, amp, ph) => u => 0.45 + amp * Math.sin(u * Math.PI * n + ph) + amp * 0.4 * Math.sin(u * Math.PI * n * 2.3 + ph * 2);
const zig = (n, amp, ph) => u => { const t = (u * n + ph) % 1; return 0.35 + amp * (t < 0.5 ? t * 2 : 2 - t * 2); };
const steps = (n, seed) => { const r = seeded(seed), hs = Array.from({ length: n + 1 }, () => 0.25 + r() * 0.6); return u => hs[Math.min(n, Math.floor(u * n))]; };
export const WORLD_CUTS = {
  sunset: { papers: ['#e9967a', '#b56a8e', '#6f4a86'], shapes: [zig(3, 0.5, 0.2), zig(4, 0.42, 0.6), hills(2, 0.14, 1)], disc: { col: '#f6c453', at: [0.78, 0.5], r: 0.42 } },
  city: { papers: ['#7f8fc4', '#566aa8', '#39457c'], shapes: [steps(9, 5), steps(12, 9), steps(7, 14)], disc: { col: '#f3e3a6', at: [0.2, 0.42], r: 0.3 } },
  crystal: { papers: ['#8fd3e0', '#6aa9d8', '#7b6fcf'], shapes: [zig(7, 0.75, 0.1), zig(9, 0.6, 0.45), zig(5, 0.5, 0.8)], disc: { col: '#e8f6fb', at: [0.82, 0.4], r: 0.26 } },
  nebula: { papers: ['#a57fd6', '#7a5cc0', '#4b3f92'], shapes: [hills(2, 0.2, 0.4), hills(3, 0.16, 2), hills(1.5, 0.2, 4)], disc: { col: '#f2a65e', at: [0.76, 0.48], r: 0.36, ring: '#f6d27a' } },
  aurora: { papers: ['#7fd1b2', '#56b0c4', '#3c7fb8'], shapes: [hills(4, 0.12, 0), hills(6, 0.09, 1.4), hills(8, 0.07, 3)], disc: { col: '#f4efc8', at: [0.2, 0.5], r: 0.28 } },
};
function cutWorld(world, w, h, dpr) {
  const c = canvasOf(w * dpr, h * dpr), x = c.getContext('2d'), C = WORLD_CUTS[world] || WORLD_CUTS.sunset;
  x.scale(dpr, dpr);
  const shadow = () => { x.shadowColor = 'rgba(60, 38, 10, 0.4)'; x.shadowBlur = 7; x.shadowOffsetY = -2; };
  // the corner cut-out (a sun, a moon, a planet): a disc of paper high on the page, half off its edge
  // (rising over the page's top edge, clear of the corner buttons; where the top line's lettering crosses it — Safari with its toolbars: no
  //  inset above the line — every disc's paper is LIGHT: the ink keeps ≥ 4.5:1 on it, tests/prism-skins.test.mjs)
  const top = Math.min(110, h * 0.13), D = C.disc, R = top * 0.62, cx = w * (D.at[0] > 0.5 ? 0.7 : 0.3), cy = -R * 0.28;
  x.save(); x.shadowColor = 'rgba(60, 38, 10, 0.38)'; x.shadowBlur = 6; x.shadowOffsetY = 3;
  x.fillStyle = D.col; x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.fill();
  if (D.ring) { x.strokeStyle = D.ring; x.lineWidth = R * 0.22; x.beginPath(); x.ellipse(cx, cy, R * 1.7, R * 0.5, -0.3, 0, Math.PI * 2); x.stroke(); }
  x.restore();
  // the layers along the foot, back to front (each casts its shadow on the one behind)
  const band = Math.min(120, h * 0.14), y0 = h - band;
  C.shapes.forEach((f, i) => {
    const lift = band * (0.95 - i * 0.26);
    x.save(); shadow();
    x.fillStyle = C.papers[i];
    x.beginPath();
    x.moveTo(-10, h + 10);
    for (let k = 0; k <= 60; k++) { const u = k / 60; x.lineTo(u * (w + 20) - 10, y0 + band - lift * f(u)); }
    x.lineTo(w + 10, h + 10);
    x.closePath();
    x.fill();
    x.restore();
  });
  return c;
}
/** the white sheet's faint fibres (so it is paper, not a white box): a few pale + grey flecks — drawn once with the sheet */
function fleck(x, bx, by, bw, bh, r) {
  for (let i = 0; i < 260; i++) {
    const fx = bx + r() * bw, fy = by + r() * bh, a = r() * Math.PI, l = 1 + r() * 4;
    x.beginPath(); x.moveTo(fx, fy); x.lineTo(fx + Math.cos(a) * l, fy + Math.sin(a) * l);
    x.lineWidth = 0.6;
    x.strokeStyle = i % 3 ? 'rgba(120, 100, 70, 0.07)' : 'rgba(255, 255, 255, 0.5)';
    x.stroke();
  }
}
export const PAPER_PAGE = Object.freeze({
  id: 'paper', lite: true,
  ok: () => true,
  key: () => '',
  files: () => [KRAFT_TEX],
  paint(ctx, st, T) {
    const { world, w, h, board, lite } = st;
    // the table: kraft board (its fibres), a soft fall of light from the top-left
    const pat = tile(ctx, T.img(KRAFT_TEX));
    ctx.fillStyle = pat || KRAFT;
    ctx.fillRect(0, 0, w, h);
    const v = ctx.createRadialGradient(w * 0.3, h * 0.25, h * 0.1, w * 0.5, h * 0.5, h * 0.75);
    v.addColorStop(0, 'rgba(255, 244, 220, 0.12)');
    v.addColorStop(1, 'rgba(70, 40, 10, 0.14)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
    // the song's world: layered paper silhouettes at the edges (the low tier drops them)
    const W0 = Math.round(w), H0 = Math.round(h);
    if (!lite) ctx.drawImage(T.layer(`pc|${world || 'sunset'}|${W0}|${H0}|${T.dpr}`, () => cutWorld(world || 'sunset', W0, H0, T.dpr)), 0, 0, w, h);
    if (!board) return;
    // THE SHEET: a big white sheet under the board, turned a hair, its soft shadow on the table
    const b = board, m = 9, r = seeded(53);
    ctx.save();
    ctx.translate(b.x + b.w / 2, b.y + b.h / 2);
    ctx.rotate(-0.006);
    ctx.shadowColor = 'rgba(60, 36, 8, 0.42)'; ctx.shadowBlur = 16; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 6;
    ctx.fillStyle = SHEET;
    ctx.fillRect(-b.w / 2 - m, -b.h / 2 - m, b.w + 2 * m, b.h + 2 * m);
    ctx.shadowColor = 'transparent';
    fleck(ctx, -b.w / 2 - m, -b.h / 2 - m, b.w + 2 * m, b.h + 2 * m, r);
    ctx.restore();
    // the board's frame: a DASHED CUT LINE
    ctx.save();
    ctx.setLineDash([7, 5]);
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = 'rgba(90, 74, 56, 0.6)';
    ctx.strokeRect(b.x - 3.5, b.y - 3.5, b.w + 7, b.h + 7);
    ctx.restore();
  },
});
