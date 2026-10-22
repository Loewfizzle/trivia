// CITY 2.0 — NEON PASS 2: THE WATERFRONT STRIP (docs/harbor.md#neon-pass-2). The far shore's ground floor — bars, a diner, a
// theatre, cafés, an oyster bar — as a RIBBON OF WARM, VARIED STOREFRONT GLOW along the water's edge. On a phone it is only a few
// pt tall, so it reads by COLOUR + SHAPE + REFLECTION (the owner's add-on), never by small text:
//   each shop     a striped AWNING over its SHOP WINDOW (by day dark glass catching the sky; at night its own warm light —
//                 amber, rose, warm white, a teal diner — and a figure or two), and above it a simple NEON SHAPE: a cocktail glass,
//                 a coffee cup, an arrow, a fish, a music note, a pizza slice, a star, a heart (unlit glass by day)
//   the theatre   a MARQUEE of CHASING BULBS round its canopy (drawn live: the only moving part)
//   the water     LONG WOBBLY REFLECTIONS streaking down into the harbor from every lit shop (water.light: the mirror's ripples
//                 break them up) — plus the strip itself mirrored (it is drawn before the water)
// Names (BAR, DINER…) only on a wide screen (desktop / TV), where they read. Storefronts sit where they can really be seen at street
// level (nearer buildings hide the ones behind). Baked once per look (the art) + one lit sprite (the glows + the shapes) drawn
// additively with the city's power.
import { project, groundY } from '../../core/harbor-layout.js';
import { tube, drawLit, drawGlass, sprite, free, mix, rgba } from './tubes.js';
import { LETTERS } from '../district/marks.js';
import { flattenPath } from '../../core/tube-path.js';
import { hashString } from '../../core/rng.js';

// the neon shapes (a 10 × 10 box, single tubes) — read at a glance, no letters
const GLYPH = {
  cocktail: 'M1 1.2 L9 1.2 L5 5.8 Z M5 5.8 L5 9.2 M3 9.2 L7 9.2 M6.6 0.2 L8.4 2.6',
  coffee: 'M1.6 3.4 L7.6 3.4 L7 8.8 L2.2 8.8 Z M7.6 4.6 Q9.8 4.6 9.8 6 Q9.8 7.4 7.3 7.4 M3.4 0.4 Q2.8 1.4 3.6 2.4 M5.6 0.4 Q5 1.4 5.8 2.4',
  arrow: 'M0.6 5 L8.6 5 M5.2 1.6 L8.8 5 L5.2 8.4',
  fish: 'M0.8 5 Q4.2 0.6 7.4 5 Q4.2 9.4 0.8 5 Z M7.4 5 L9.6 2.8 L9.6 7.2 Z',
  note: 'M6.6 0.8 L6.6 7.4 M6.6 0.8 L9.4 2 M6.6 7.4 Q6.6 9.4 4.4 9.4 Q2.8 9.4 2.8 8.1 Q2.8 6.8 4.6 6.8 Q6.1 6.8 6.6 7.4',
  pizza: 'M1 1.4 Q5 0.2 9 1.4 L5 9.4 Z M3.4 3.2 L3.6 3.4 M6 3.6 L6.2 3.8 M4.8 6 L5 6.2',
  star: 'M5 0.4 L6.2 3.8 L9.8 3.8 L6.9 6 L8 9.6 L5 7.4 L2 9.6 L3.1 6 L0.2 3.8 L3.8 3.8 Z',
  heart: 'M5 9.2 Q0.4 5.8 0.4 3 Q0.4 0.8 2.6 0.8 Q4.2 0.8 5 2.6 Q5.8 0.8 7.4 0.8 Q9.6 0.8 9.6 3 Q9.6 5.8 5 9.2 Z',
};
// the shops: a word (wide screens), a shape (phones), the neon's colour, the window's light, the awning's stripes
export const SHOPS = [
  { word: 'BAR', glyph: 'cocktail', col: [255, 46, 151], win: [255, 168, 140], awn: [[150, 28, 52], [236, 226, 210]] },
  { word: 'DINER', glyph: 'arrow', col: [46, 230, 255], win: [150, 236, 226], awn: [[30, 96, 120], [236, 232, 220]] },
  { word: 'OYSTERS', glyph: 'fish', col: [255, 176, 46], win: [255, 206, 140], awn: [[34, 92, 70], [232, 226, 206]] },
  { word: 'CAFE', glyph: 'coffee', col: [255, 140, 70], win: [255, 220, 170], awn: [[176, 64, 40], [240, 230, 214]] },
  { word: 'COCKTAIL', glyph: 'cocktail', col: [255, 70, 180], win: [255, 150, 190], awn: [[40, 30, 70], [210, 190, 230]] },
  { word: 'DANCING', glyph: 'note', col: [168, 82, 255], win: [220, 170, 255], awn: [[60, 30, 90], [220, 200, 240]] },
  { word: 'PIZZA', glyph: 'pizza', col: [255, 150, 40], win: [255, 196, 120], awn: [[40, 110, 50], [236, 230, 214]] },
  { word: 'EAT', glyph: 'star', col: [255, 59, 59], win: [255, 214, 160], awn: [[160, 30, 30], [240, 236, 226]] },
  { word: 'OPEN', glyph: 'heart', col: [255, 59, 90], win: [255, 186, 170], awn: [[30, 40, 80], [226, 228, 236]] },
];
export const THEATRE = { word: 'THEATRE', glyph: null, col: [255, 214, 120], win: [255, 220, 150], awn: [[120, 24, 36], [120, 24, 36]], marquee: true };
const STOREY = 3.3;                                 // world units: the ground floor's height

/** the storefronts on screen (pt) — [{ x0, x1, y0 (top), y1 (the ground), z, shop }] from what is visible at street level */
export function storefronts(L) {
  const cam = L.cam, K = cam.F / 600, cands = [];
  for (const b of L.bands.find(bd => bd.id === 'near').blocks) cands.push({ b, kind: 'band' });
  for (const b of L.heroes) cands.push({ b, kind: 'hero' });
  cands.sort((p, q) => p.b.z0 - q.b.z0);
  const covered = [];                                // screen x intervals already hidden at street level (by nearer buildings)
  const minus = (a, c) => { let parts = [[a, c]]; for (const [u, v] of covered) parts = parts.flatMap(([p, q]) => (v <= p || u >= q ? [[p, q]] : [[p, Math.min(q, u)], [Math.max(p, v), q]].filter(([m, n]) => n - m > 0.5))); return parts; };
  // (the wheel's quiet zone: no storefront glow or shape behind its disc)
  const wh = L.wheel, [wcx, wcy] = project(cam, wh.x, wh.y, wh.z), wr = cam.F * wh.r / wh.z * 1.06 + 4;
  const behindWheel = (x0, x1, y0, y1) => { const nx = Math.max(x0, Math.min(wcx, x1)), ny = Math.max(y0, Math.min(wcy, y1)); return Math.hypot(nx - wcx, ny - wcy) < wr; };
  const out = [];
  for (const { b, kind } of cands) {
    const [a] = project(cam, b.x0, 0, b.z0), [c] = project(cam, b.x1, 0, b.z0);
    const vis = minus(a, c);
    const sa = b.x0 > 0 ? Math.min(a, project(cam, b.x0, 0, b.z1)[0]) : a, sc = b.x1 < 0 ? Math.max(c, project(cam, b.x1, 0, b.z1)[0]) : c;
    covered.push([sa, sc]);
    const gy = groundY(cam, b.z0), hpt = cam.F * Math.min(STOREY, b.h * 0.3) / b.z0;
    for (let [p, q] of vis) {
      p = Math.max(p, 3); q = Math.min(q, cam.W - 3);                 // (on screen: a shape never clipped by the edge)
      if (q - p < 9 * K || q < 2 || p > cam.W - 2) continue;
      const n = Math.max(1, Math.round((q - p) / (24 * K)));
      for (let i = 0; i < n; i++) {
        const x0 = p + (q - p) * i / n + 0.6, x1 = p + (q - p) * (i + 1) / n - 0.6;
        if (x1 - x0 < 8 * K || behindWheel(x0, x1, gy - hpt * 2, gy)) continue;
        out.push({ x0, x1, y0: gy - hpt, y1: gy, z: b.z0, shop: null, seed: hashString(`${b.id}|${i}`), kind });
      }
    }
  }
  // the shops along the shore, left to right, from a seeded start: every neighbour different; one theatre (a wide front)
  out.sort((p, q) => p.x0 - q.x0);
  const start = hashString('waterfront') % SHOPS.length;
  let tAt = -1, best = 0;
  out.forEach((f, i) => { const w = f.x1 - f.x0; if (i > out.length * 0.3 && i < out.length * 0.8 && w > best) { best = w; tAt = i; } });
  out.forEach((f, i) => { f.shop = i === tAt ? THEATRE : SHOPS[(start + i) % SHOPS.length]; });
  return out;
}

export function createWaterfront() {
  let L = null, cam = null, dpr = 2, fronts = [], art = null, artKey = '', lit = null, clipY = 0, words = false, K = 1;

  function layout(l, o) {
    L = l; cam = l.cam; dpr = Math.min(2, o.dpr || 1); K = cam.F / 600;
    fronts = storefronts(L);
    words = !!cam.wide;                                // names only where they read (desktop / TV)
    clipY = project(cam, 0, 0.4, 230)[1];             // (the far quay's top edge stands in front of the shop floors' feet)
    free(art); free(lit); art = null; lit = null; artKey = '';
  }
  // a storefront's parts (pt): the sign's box above the awning, the awning, the window
  function parts(f) {
    const w = f.x1 - f.x0, h = f.y1 - f.y0;
    const awnY = f.y0 + h * 0.18, awnH = h * 0.2, winY = awnY + awnH, winH = f.y1 - winY;
    const gs = Math.min(w * 0.7, h * 0.95), sign = { x: f.x0 + (w - gs) / 2, y: f.y0 - gs * 0.9, s: gs };
    return { w, h, awnY, awnH, winY, winH, sign };
  }
  function signTubes(f, P) {
    const sh = f.shop;
    // (a name only where it reads: a wide screen, letters at least 3.6 pt tall — a long name on a narrow front takes its shape)
    const n = sh.word.length, box = { x: f.x0 + P.w * 0.05, y: f.y0 - P.h * 0.62, w: P.w * 0.9, h: P.h * 0.55 };
    const lh = Math.min(box.h, (box.w / n) * 1.25);
    if ((words && (lh >= 3.6 || !sh.glyph)) || !sh.glyph) {
      if (!words) return [];
      const s = lh / 14, lw = 10 * s, gap = Math.min(lw * 0.4, (box.w - n * lw) / Math.max(1, n - 1));
      const used = n * lw + (n - 1) * Math.max(0, gap), ox = box.x + (box.w - used) / 2, oy = box.y + (box.h - lh) / 2, out = [];
      [...sh.word].forEach((ch, i) => { const d = LETTERS[ch]; if (d) for (const p of flattenPath(d, s, ox + i * (lw + Math.max(0, gap)), oy, 0.6)) out.push(p.pts); });
      return out.map(p => ({ pts: p, w: Math.max(0.4, lh * 0.13) }));
    }
    const sc = P.sign.s / 10;
    return flattenPath(GLYPH[sh.glyph], sc, P.sign.x, P.sign.y, 0.5).map(p => ({ pts: p.pts, w: Math.max(0.45, P.sign.s * 0.075) }));
  }
  const bounds = () => ({ x0: Math.min(...fronts.map(f => f.x0)) - 3, y0: Math.min(...fronts.map(f => f.y0 - (f.y1 - f.y0) * 1.1)) - 3, x1: Math.max(...fronts.map(f => f.x1)) + 3, y1: clipY });
  // the art (per look): the awnings, the windows (sky in the glass by day; dark at night — the light is the lit sprite), the doors,
  // the shapes' unlit glass, the marquee's canopy
  function buildArt(T) {
    const day = Math.min(1, T.day + 0.8 * T.gold), night = T.night;
    const key = `${Math.round(day * 6)}${Math.round(T.gold * 6)}${Math.round(night * 6)}`;
    if (key === artKey && art) return;
    artKey = key; free(art);
    if (!fronts.length) { art = null; return; }
    const box = bounds();
    art = sprite(box, 0, dpr, x => {
      x.save(); x.beginPath(); x.rect(box.x0 - 4, box.y0 - 4, box.x1 - box.x0 + 8, clipY - box.y0 + 4); x.clip();
      for (const f of fronts) {
        const P = parts(f), sh = f.shop;
        const glass = mix(mix([14, 12, 22], [72, 92, 116], day), [160, 120, 100], T.gold * 0.4);
        x.fillStyle = rgba(glass); x.fillRect(f.x0 + P.w * 0.05, P.winY + P.winH * 0.06, P.w * 0.9, P.winH * 0.9);
        if (day > 0.2) { const g = x.createLinearGradient(f.x0, P.winY, f.x0 + P.w, f.y1); g.addColorStop(0, `rgba(255,255,255,${0.24 * day})`); g.addColorStop(0.5, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(f.x0 + P.w * 0.05, P.winY, P.w * 0.9, P.winH); }
        x.fillStyle = rgba(mix([10, 8, 16], [40, 34, 34], day));
        for (const k of [0.36, 0.64]) x.fillRect(f.x0 + P.w * k - 0.25, P.winY + P.winH * 0.06, 0.5, P.winH * 0.9);
        const dx = f.x0 + P.w * (((f.seed >>> 4) % 2) ? 0.07 : 0.73);
        x.fillStyle = rgba(mix([8, 6, 12], [52, 36, 30], day)); x.fillRect(dx, P.winY + P.winH * 0.04, P.w * 0.2, P.winH * 0.96);
        // the awning: striped canvas, a scalloped edge, its shade under it (the theatre: its canopy)
        const nS = Math.max(3, Math.round(P.w / 2.4));
        for (let i = 0; i < nS; i++) { x.fillStyle = rgba(mix(mix([20, 16, 26], sh.awn[i % 2], 0.4 + 0.6 * day), [255, 200, 150], T.gold * 0.15)); x.fillRect(f.x0 - 0.5 + (P.w + 1) * i / nS, P.awnY, (P.w + 1) / nS + 0.2, P.awnH); }
        x.fillStyle = rgba(mix([20, 16, 26], sh.awn[0], 0.35 + 0.6 * day));
        if (!sh.marquee) for (let i = 0; i < nS; i++) { const cx = f.x0 - 0.5 + (P.w + 1) * (i + 0.5) / nS; x.beginPath(); x.arc(cx, P.awnY + P.awnH, (P.w + 1) / nS / 2, 0, Math.PI); x.fill(); }
        x.fillStyle = `rgba(0,0,0,${0.25 + 0.2 * day})`; x.fillRect(f.x0, P.awnY + P.awnH, P.w, Math.max(0.4, P.winH * 0.1));
        if (sh.marquee) { x.fillStyle = rgba(mix([40, 18, 22], [150, 40, 46], day)); x.fillRect(f.x0 - 0.8, f.y0 - P.h * 0.15, P.w + 1.6, P.h * 0.33); }
        // the shape's (or the name's) glass, unlit
        const ts = signTubes(f, P);
        if (ts.length) drawGlass(x, ts.map(t => tube(t.pts, false, t.w, [false, false])), sh.col, T, { w: ts[0].w, clips: false, shadow: false, faint: night > 0.5 });
      }
      x.restore();
    });
  }
  // the lit parts (night): each window's own warm light + a figure or two, the glow spilling under the awning + over the quay's
  // edge, the shapes lit in their colours
  function buildLit() {
    if (lit || !fronts.length) return;
    const box = bounds();
    lit = sprite(box, 8, dpr, x => {
      x.save(); x.beginPath(); x.rect(box.x0 - 10, box.y0 - 10, box.x1 - box.x0 + 20, clipY - box.y0 + 10); x.clip();
      for (const f of fronts) {
        const P = parts(f), sh = f.shop, wc = sh.win;
        const g = x.createLinearGradient(0, P.winY, 0, f.y1); g.addColorStop(0, rgba(wc, 0.78)); g.addColorStop(1, rgba(mix(wc, [255, 240, 220], 0.35), 1));
        x.fillStyle = g; x.fillRect(f.x0 + P.w * 0.05, P.winY + P.winH * 0.06, P.w * 0.9, P.winH * 0.9);
        x.globalCompositeOperation = 'source-over'; x.fillStyle = 'rgba(30,18,24,0.72)';
        const nP = 1 + ((f.seed >>> 7) % 2);
        for (let i = 0; i < nP; i++) { const px = f.x0 + P.w * (0.25 + 0.4 * i + ((f.seed >>> (9 + i)) % 10) / 100), ph = P.winH * 0.66; x.beginPath(); x.ellipse(px, f.y1 - ph * 0.82, ph * 0.1, ph * 0.12, 0, 0, Math.PI * 2); x.fill(); x.fillRect(px - ph * 0.13, f.y1 - ph * 0.68, ph * 0.26, ph * 0.68); }
        x.globalCompositeOperation = 'lighter';
        // the glow: under the awning, a soft bloom round the window (the ribbon of warm light along the water) — NEON PASS 3: a
        // touch brighter, so the strip reads on a phone
        x.fillStyle = rgba(wc, 0.34); x.fillRect(f.x0, P.awnY + P.awnH * 0.4, P.w, P.awnH * 0.8);
        const gg = x.createRadialGradient((f.x0 + f.x1) / 2, f.y1 - P.winH * 0.4, 0, (f.x0 + f.x1) / 2, f.y1 - P.winH * 0.4, P.w * 0.75);
        gg.addColorStop(0, rgba(wc, 0.46)); gg.addColorStop(0.55, rgba(wc, 0.14)); gg.addColorStop(1, rgba(wc, 0)); x.fillStyle = gg; x.fillRect(f.x0 - P.w * 0.3, f.y0 - P.h * 0.2, P.w * 1.6, P.h * 1.3);
        const ts = signTubes(f, P);
        if (ts.length) drawLit(x, ts.map(t => tube(t.pts, false, t.w, [true, true])), sh.col, { w: ts[0].w, glow: Math.max(2.2, P.sign.s * 0.5), a: 1, dpr });
      }
      x.restore();
    });
  }
  return {
    layout,
    /** draw (after the near neon, before the water): T the tones, k the lights (night × the city's power), fade, t (s), motion,
     *  water (its light() hook: the long reflections) */
    draw(c, T, k, fade, t = 0, motion = true, water = null) {
      if (!L || !fronts.length || fade <= 0) return;
      buildArt(T);
      if (art) { c.globalAlpha = fade; c.drawImage(art.c, art.x, art.y, art.w, art.h); }
      if (k > 0.01) {
        buildLit();
        c.save(); c.globalCompositeOperation = 'lighter';
        if (lit) { c.globalAlpha = Math.min(1, k) * fade; c.drawImage(lit.c, lit.x, lit.y, lit.w, lit.h); }
        // THE THEATRE's marquee: chasing bulbs round its canopy (live: the strip's one moving part)
        const step = motion ? Math.floor(t / 0.14) : 0;
        for (const f of fronts) if (f.shop.marquee) {
          const P = parts(f), y0 = f.y0 - P.h * 0.15, y1 = y0 + P.h * 0.33, n = Math.max(8, Math.round(P.w / 1.5)), r = Math.max(0.42, 0.5 * K);
          let i = 0;
          for (const by of [y0, y1]) for (let j = 0; j <= n; j++, i++) { const on = (i + step) % 3 === 0; c.globalAlpha = Math.min(1, k) * fade * (on ? 1 : 0.32); c.fillStyle = on ? 'rgb(255,244,214)' : 'rgb(255,200,120)'; c.beginPath(); c.arc(f.x0 - 0.8 + (P.w + 1.6) * j / n, by, on ? r * 1.25 : r, 0, Math.PI * 2); c.fill(); }
        }
        c.restore();
        // LONG WOBBLY REFLECTIONS: each lit shop streaks down into the harbor (the mirror's ripples break the columns up)
        if (water) for (const f of fronts) { const P = parts(f); water.light((f.x0 + f.x1) / 2, f.y1 - P.winH * 0.4, f.shop.win, Math.min(1, k) * fade * 0.9, P.w * 0.42, 72 * K); }
      }
      c.globalAlpha = 1;
    },
    debug: () => ({ fronts: fronts.length, words, shops: fronts.map(f => (words ? f.shop.word : f.shop.glyph || 'marquee')), named: fronts.filter(f => { const P = parts(f); return words && Math.min(P.h * 0.55, (P.w * 0.9 / f.shop.word.length) * 1.25) >= 3.6; }).length, mb: +(((art ? art.mb : 0) + (lit ? lit.mb : 0))).toFixed(2) }),
    destroy() { free(art); free(lit); art = null; lit = null; L = null; },
  };
}
