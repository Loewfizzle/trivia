// HOLD'EM — THE REAL CHIPS, DRAWN (HE5 — docs/holdem.md "THE CHIPS"): Grok's clay-chip art (assets/holdem/chips/ — a TOP + a SIDE per colour)
// made into 3/4-view stacks on a canvas. The three must-do fixes (Ben, docs/games/plan.md "HE5"):
//   1. a soft CONTACT SHADOW under every stack + a thin dark OUTLINE + a light RIM on the top edge — so the green chip never vanishes on green felt
//   2. LIGHT + a subtle SHEEN in code (the cylinder shading across the edge, a sheen on the top) from ONE light direction — the table's (setLight)
//   3. every chip's edge spots at its own ROTATION (the side band sampled around a full-circumference band at a random offset) + 0.5–1 pt of
//      sideways JITTER — a stack never reads as a barcode
// The side band is sampled by ANGLE across the chip's width (a cylinder: the spots compress toward the silhouette). Stacks are drawn ONCE per
// (colour, count, size, variant) into a cache and blitted; a bet's canvas is redrawn only when its amount changes (never per frame).
// Every canvas through ui/canvas-safe.js (counted by the memory guard).
import { ctx2d } from '../../ui/canvas-safe.js';
import { COLORS, chipStacks } from './chips.js';

const DIR = new URL('../../../assets/holdem/chips/', import.meta.url);
/** the side art: 128 × 24, the visible band = the source's x 4–508, y 28–68 of 512 × 96 (scaled ÷ 4) — chips are spaced by the BAND, never the canvas */
export const BAND = Object.freeze({ x: 1, y: 7, w: 126, h: 10 });
/** the look (× the chip's diameter d): the top's squash, a chip's edge thickness, the gap between stacks */
export const SHAPE = Object.freeze({ ry: 0.26, t: 0.16, gap: 0.1 });
let LIGHT = { x: -0.45, y: -0.9 };          // the table's light (a skin may move it — setLight): from above, a little to the left
const art = { ready: false, top: {}, band: {}, wait: null, listeners: new Set(), version: 0 };
const cache = new Map();                   // stack key → canvas (≤ CACHE_MAX)
const CACHE_MAX = 160;
const dprOf = () => Math.min(3, Math.max(1, (typeof devicePixelRatio === 'number' && devicePixelRatio) || 1));

export function setLight(l) { if (l && (l.x !== LIGHT.x || l.y !== LIGHT.y)) { LIGHT = { x: l.x, y: l.y }; cache.clear(); art.version++; } }
export const artVersion = () => art.version;
export const chipsReady = () => art.ready;
/** a callback when the art has loaded (the view repaints its bets) → unsubscribe */
export function onChipsReady(fn) { art.listeners.add(fn); return () => art.listeners.delete(fn); }

/** the 12 images (loaded once a page) → each colour's full-circumference band (the visible half + its mirror: 8 spots round) */
export function loadChips() {
  if (art.wait) return art.wait;
  const img = src => new Promise(res => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  art.wait = Promise.all(COLORS.flatMap(c => [img(new URL(`chip-${c}-top.webp`, DIR).href), img(new URL(`chip-${c}-side.webp`, DIR).href)])).then(list => {
    COLORS.forEach((c, i) => {
      const top = list[2 * i], side = list[2 * i + 1];
      if (!top || !side) return;
      art.top[c] = top;
      const cv = document.createElement('canvas');
      cv.width = BAND.w * 2; cv.height = BAND.h;
      const x = ctx2d(cv);
      if (!x) return;
      x.drawImage(side, BAND.x, BAND.y, BAND.w, BAND.h, 0, 0, BAND.w, BAND.h);
      x.save(); x.translate(BAND.w * 2, 0); x.scale(-1, 1);
      x.drawImage(side, BAND.x, BAND.y, BAND.w, BAND.h, 0, 0, BAND.w, BAND.h);
      x.restore();
      art.band[c] = cv;
    });
    art.ready = COLORS.every(c => art.top[c] && art.band[c]);
    art.version++;
    cache.clear();
    for (const fn of art.listeners) { try { fn(); } catch { /* fine */ } }
    return art.ready;
  });
  return art.wait;
}

// a tiny seeded rng (the jitter + the rotations — the same stack always looks the same: no shimmer on a redraw)
function rngOf(key) {
  let h = 2166136261;
  for (const ch of String(key)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}

/** one stack's size (CSS px) for a chip diameter d and n chips: { w, h } — the shadow + the jitter included */
export function stackSize(d, n) {
  const ry = d * SHAPE.ry, t = d * SHAPE.t;
  return { w: d + 4, h: 2 * ry + n * t + ry * 0.7 + 2 };
}

/** draw ONE stack (colour, n chips, diameter d px at scale k) with its base at (cx, base) on ctx — shadow, edges, the top */
function drawStack(x, color, n, d, cx, base, rnd) {
  const top = art.top[color], band = art.band[color];
  const rx = d / 2, ry = d * SHAPE.ry, t = d * SHAPE.t;
  const lx = LIGHT.x;
  // 1. THE CONTACT SHADOW (soft, a little away from the light)
  const sx = cx - lx * d * 0.08, sy = base + ry * 0.35;
  const g = x.createRadialGradient(sx, sy, 0, sx, sy, rx * 1.25);
  g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(0.55, 'rgba(0,0,0,0.32)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.save(); x.translate(sx, sy); x.scale(1, 0.42); x.translate(-sx, -sy);
  x.fillStyle = g; x.beginPath(); x.arc(sx, sy, rx * 1.25, 0, Math.PI * 2); x.fill(); x.restore();
  // 2. THE EDGES, bottom chip first: each chip's band sampled by ANGLE across its width (a cylinder), its own rotation + jitter, the light
  const slice = Math.max(0.5, d / 28);
  let jx = 0, topCx = cx;
  for (let i = 0; i < n; i++) {
    const j = (0.5 + rnd() * 0.5) * (rnd() < 0.5 ? -1 : 1) * Math.max(0.5, d / 18);   // 0.5–1 pt at a ~16 pt chip
    jx = i === 0 ? 0 : j;
    const ccx = cx + jx, rot = rnd() * band.width, yTop = base - ry - (i + 1) * t;   // yTop = this chip's top-face centre
    for (let px = -rx; px < rx; px += slice) {
      const u = Math.max(-0.999, Math.min(0.999, (px + slice / 2) / rx));
      const ang = Math.asin(u);                                   // −π/2 … π/2 across the visible half
      const srcX = (rot + (ang / Math.PI + 0.5) * BAND.w) % band.width;
      const dy = ry * Math.sqrt(1 - u * u);                       // the band follows the ellipse's lower curve
      const sw = Math.min(2, band.width - srcX);
      x.drawImage(band, srcX, 0, sw, BAND.h, ccx + px, yTop + dy, slice + 0.35, t + 0.35);
      // the cylinder's light: brighter toward the light, falling off to the far silhouette
      const lit = 0.5 + 0.5 * (-u * lx + Math.sqrt(1 - u * u) * 0.55);
      const dark = Math.max(0, 0.62 - lit) * 0.75;
      if (dark > 0.01) { x.fillStyle = `rgba(0,0,0,${dark.toFixed(3)})`; x.fillRect(ccx + px, yTop + dy, slice + 0.35, t + 0.35); }
      const hi = Math.max(0, lit - 0.86) * 1.4;
      if (hi > 0.01) { x.fillStyle = `rgba(255,248,230,${hi.toFixed(3)})`; x.fillRect(ccx + px, yTop + dy, slice + 0.35, t * 0.6); }
      x.fillStyle = 'rgba(0,0,0,0.28)'; x.fillRect(ccx + px, yTop + dy + t - 0.5, slice + 0.35, 0.6);   // the seam under each chip
    }
    topCx = ccx;
  }
  // 3. THE TOP of the top chip (the art squashed to the 3/4 view) + its sheen + the rim light + the dark outline
  const yT = base - ry - n * t;
  x.save();
  x.beginPath(); x.ellipse(topCx, yT, rx, ry, 0, 0, Math.PI * 2); x.clip();
  x.drawImage(top, topCx - rx, yT - ry, d, 2 * ry);
  const sh = x.createRadialGradient(topCx + lx * rx * 0.55, yT - ry * 0.55, 0, topCx + lx * rx * 0.55, yT - ry * 0.55, rx * 1.3);
  sh.addColorStop(0, 'rgba(255,250,235,0.30)'); sh.addColorStop(0.45, 'rgba(255,250,235,0.08)'); sh.addColorStop(1, 'rgba(0,0,0,0.22)');
  x.fillStyle = sh; x.fillRect(topCx - rx, yT - ry, d, 2 * ry);
  x.restore();
  // the outline: the whole silhouette (top ellipse + the sides + the bottom curve) — the separation from any felt
  const yB = base - ry;
  x.lineWidth = Math.max(0.6, d / 26);
  x.strokeStyle = 'rgba(0,0,0,0.55)';
  x.beginPath();
  x.ellipse(topCx, yT, rx, ry, 0, Math.PI, 0, false);
  x.lineTo(cx + rx, yB);
  x.ellipse(cx, yB, rx, ry, 0, 0, Math.PI, false);
  x.closePath();
  x.stroke();
  // the rim light on the top edge (toward the light)
  x.strokeStyle = 'rgba(255,246,220,0.6)';
  x.lineWidth = Math.max(0.5, d / 34);
  x.beginPath(); x.ellipse(topCx, yT, rx - x.lineWidth, ry - x.lineWidth * 0.6, 0, Math.PI * 1.02, Math.PI * 1.75); x.stroke();
}

/** a cached canvas of ONE stack (device px) */
function stackCanvas(color, n, d, dpr, variant) {
  const key = `${color}|${n}|${d.toFixed(2)}|${dpr}|${variant}|${art.version}`;
  let cv = cache.get(key);
  if (cv) { cache.delete(key); cache.set(key, cv); return cv; }
  const { w, h } = stackSize(d, n);
  cv = document.createElement('canvas');
  cv.width = Math.ceil(w * dpr); cv.height = Math.ceil(h * dpr);
  const x = ctx2d(cv);
  if (!x) return null;
  x.scale(dpr, dpr);
  drawStack(x, color, n, d, w / 2, h - d * SHAPE.ry * 0.7 - 1, rngOf(key));
  cache.set(key, cv);
  while (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
  return cv;
}

/**
 * THE STACKS for an amount, into `cv` (resized to fit; CSS size set on its style): d = a chip's diameter (CSS px), o = the chips.js caps
 * ({ maxStacks, maxPer }), variant = a seat's own look (0–2). → { w, h } (CSS px) — or null before the art has loaded (then nothing drawn).
 */
export function paintStacks(cv, amount, d, o = {}, variant = 0) {
  if (!cv) return null;
  const stacks = chipStacks(amount, o);
  const dpr = dprOf();
  const gap = d * SHAPE.gap;
  const sizes = stacks.map(s => stackSize(d, s.n));
  const w = Math.max(1, sizes.reduce((a, s) => a + s.w, 0) + Math.max(0, stacks.length - 1) * (gap - 4));
  const h = Math.max(1, ...sizes.map(s => s.h));
  const W = Math.ceil(w * dpr), H = Math.ceil(h * dpr);
  if (cv.width !== W) cv.width = W;
  if (cv.height !== H) cv.height = H;
  cv.style.width = `${w}px`; cv.style.height = `${h}px`;
  const x = ctx2d(cv);
  if (!x) return null;
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.clearRect(0, 0, W, H);
  if (!art.ready) return null;
  let left = 0;
  stacks.forEach((s, i) => {
    const sc = stackCanvas(s.color, s.n, d, dpr, (variant + i) % 3);
    if (sc) x.drawImage(sc, Math.round(left * dpr), H - sc.height);
    left += sizes[i].w + gap - 4;
  });
  return { w, h };
}

/** a NEW canvas with the stacks (the motion's flying ghosts) — CSS-sized; null before the art loaded */
export function stackGhost(amount, d, o, variant = 0) {
  const cv = document.createElement('canvas');
  return paintStacks(cv, amount, d, o, variant) ? cv : null;
}
