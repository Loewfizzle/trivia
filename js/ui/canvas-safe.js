// SAFARI-SAFE CANVAS (City 2.0, NEON PASS 5 — the owner's iPhone showed less than Chromium; docs/harbor/passes/neon-pass-5.md).
// What Safari / WebKit does differently, and the safe path every effect takes instead of depending on it:
//   ctx.filter       Safari before 18 has no canvas filters: `x.filter = 'blur(…)'` just sets a plain property and draws
//                    unblurred. blurWorks() tests it once by its pixels (reading the property back can't tell); the callers draw a
//                    soft look of their own without it (stacked wider strokes at a low alpha).
//   drawImage        older WebKit drew NOTHING when the source rect ran outside the image (Chromium clips it); blit() clips the
//                    source rect to the image and moves the destination to match — the same picture in both.
//   getContext       iOS caps the canvas memory of a page; past it, getContext('2d') returns null (and every draw throws).
//                    ctx2d() returns null instead of throwing, for a sprite that must never take the frame down with it.
// PLAY NOW — 0d: THE SUPPORTED FLOOR is iOS / Safari 15.4 — the one thing the code needs that 15.4 lacks is the canvas `roundRect` (Safari
// 16.0 · Chrome 99 · Firefox 112; ~56 calls in the city + the games, unguarded). This fills it in where it's missing — the spec's radii
// (a number, a {x, y} point, or a list of 1–4: [all] · [tl+br, tr+bl] · [tl, tr+bl, br] · [tl, tr, br, bl]), each corner clamped like the
// real one (scaled down together when two corners overrun a side), a negative w / h drawn the other way. Never touches a browser that has it.
/** PURE: the spec's radii → [tl, tr, br, bl] (numbers) for a w × h box */
export function roundRadii(w, h, radii) {
  const n = r => { const v = r && typeof r === 'object' ? Number(r.x) : Number(r); return Number.isFinite(v) && v > 0 ? v : 0; };
  const L = Array.isArray(radii) ? radii.map(n) : [n(radii)];
  const [tl, tr, br, bl] = L.length >= 4 ? L.slice(0, 4) : L.length === 3 ? [L[0], L[1], L[2], L[1]] : L.length === 2 ? [L[0], L[1], L[0], L[1]] : [L[0] || 0, L[0] || 0, L[0] || 0, L[0] || 0];
  const W = Math.abs(w), H = Math.abs(h);
  const f = Math.min(1, W / ((tl + tr) || 1), W / ((bl + br) || 1), H / ((tl + bl) || 1), H / ((tr + br) || 1));
  return [tl * f, tr * f, br * f, bl * f];
}
function roundRectFill(x, y, w, h, radii = 0) {
  if (![x, y, w, h].every(Number.isFinite)) return;
  let [tl, tr, br, bl] = roundRadii(w, h, radii);
  if (w < 0) { x += w; w = -w; [tl, tr, br, bl] = [tr, tl, bl, br]; }
  if (h < 0) { y += h; h = -h; [tl, tr, br, bl] = [bl, br, tr, tl]; }
  this.moveTo(x + tl, y);
  this.lineTo(x + w - tr, y); if (tr) this.arcTo(x + w, y, x + w, y + tr, tr);
  this.lineTo(x + w, y + h - br); if (br) this.arcTo(x + w, y + h, x + w - br, y + h, br);
  this.lineTo(x + bl, y + h); if (bl) this.arcTo(x, y + h, x, y + h - bl, bl);
  this.lineTo(x, y + tl); if (tl) this.arcTo(x, y, x + tl, y, tl);
  this.closePath();
  this.moveTo(x, y);
}
if (typeof globalThis !== 'undefined') {
  for (const C of [globalThis.CanvasRenderingContext2D, globalThis.OffscreenCanvasRenderingContext2D, globalThis.Path2D]) {
    try { if (C && C.prototype && typeof C.prototype.roundRect !== 'function') Object.defineProperty(C.prototype, 'roundRect', { value: roundRectFill, configurable: true, writable: true }); } catch { /* a frozen prototype: nothing to do */ }
  }
}

let blurOk = null;
/** does `ctx.filter = 'blur(…)'` really blur here? (once, by its pixels) */
export function blurWorks() {
  if (blurOk != null) return blurOk;
  try {
    const c = document.createElement('canvas'); c.width = c.height = 9;
    const x = c.getContext('2d');
    if (!x || !('filter' in x)) return (blurOk = false);
    x.filter = 'blur(2px)'; x.fillStyle = '#fff'; x.fillRect(4, 4, 1, 1); x.filter = 'none';
    blurOk = x.getImageData(1, 4, 1, 1).data[3] > 0;
    c.width = c.height = 0;
  } catch { blurOk = false; }
  return blurOk;
}
/** drawImage with the source rect clipped to the image (and the destination moved to match): never "nothing" on WebKit */
export function blit(c, img, sx, sy, sw, sh, dx, dy, dw, dh) {
  const iw = img && img.width, ih = img && img.height;
  if (!iw || !ih || !(sw > 0) || !(sh > 0)) return;
  const kx = dw / sw, ky = dh / sh;
  const x0 = Math.max(0, sx), y0 = Math.max(0, sy), x1 = Math.min(iw, sx + sw), y1 = Math.min(ih, sy + sh);
  if (x1 - x0 <= 0 || y1 - y0 <= 0) return;
  c.drawImage(img, x0, y0, x1 - x0, y1 - y0, dx + (x0 - sx) * kx, dy + (y0 - sy) * ky, (x1 - x0) * kx, (y1 - y0) * ky);
}
/** a canvas's 2D context, or null (iOS out of canvas memory) — never throws */
export function ctx2d(cv, o) {
  track(cv);
  let x = null;
  try { x = cv.getContext('2d', o) || null; } catch { x = null; }
  if (x) watchLoss(cv, x);
  return x;
}

/** PART 10 — a canvas's WebGL2 context (the fireworks' GPU engine), or null — never throws; counted by canvasMb like the 2D ones */
export function glCtx(cv, o) {
  track(cv);
  try { return cv.getContext('webgl2', o) || null; } catch { return null; }
}

// C4c — THE HONEST TOTAL (review-4 H19: the readout counted the bakes, the water, the wheel + the boats, and missed 32-43 MB of live
// canvases): every canvas that takes a context through ctx2d / safeCtx is remembered (a WeakRef: never kept alive by this list), and
// canvasMb() sums the pixels of the live ones (width x height x 4) — what the memory guard + the readout + the phone bench count.
const tracked = new Set(), seen = typeof WeakSet === 'function' ? new WeakSet() : null;
function track(cv) {
  if (!cv || !seen || typeof WeakRef !== 'function' || seen.has(cv)) return;
  seen.add(cv); tracked.add(new WeakRef(cv));
}

// FR7 FIXES A — THE BLANK CITY AFTER BEING AWAY (a tester's iPhone, Nov 12: back to a tab that sat in the background, the city's painted
// layers were GONE — blank sky, black ground — while the crisp lettering + the DOM signs stayed; a refresh fixed it). iOS can discard a
// canvas's backing store while the page is in the background. Every canvas whose 2D context goes through here is WATCHED: the 2D
// `contextlost` / `contextrestored` events (Safari 17+, Chrome) + `isContextLost()` (anyLost — asked on every return) — and a loss the
// browser never reports is found by the scene's own sentinel pixel (scene.js#lostLook) and REPORTED here (reportLost). Whoever paints
// a cache listens (onCanvasLost): the city re-fits through its one gate, the effect library drops its sprites.
const ctxOf = typeof WeakMap === 'function' ? new WeakMap() : null, watched = typeof WeakSet === 'function' ? new WeakSet() : null;
const lostFns = new Set();
let lostN = 0;
function watchLoss(cv, x) {
  if (!ctxOf || !watched || watched.has(cv)) return;
  watched.add(cv); ctxOf.set(cv, x);
  try {
    cv.addEventListener('contextlost', () => { lostN++; emitLost('a context lost'); });
    cv.addEventListener('contextrestored', () => emitLost('a context restored'));
  } catch { /* an OffscreenCanvas / a stub: nothing to listen to */ }
}
function emitLost(why) { for (const fn of [...lostFns]) { try { fn(why); } catch (e) { console.warn('[canvas lost]', e); } } }
/** subscribe to a lost (or restored-blank) canvas → unsubscribe */
export function onCanvasLost(fn) { lostFns.add(fn); return () => lostFns.delete(fn); }
/** a loss found by its owner (the sentinel's blank pixel — the browser never said): every cache-holder hears it */
export function reportLost(why) { lostN++; emitLost(why); }
/** how many losses so far (events + reports) */
export const lostCount = () => lostN;
/** any watched 2D context lost right now? (cheap enough for a return to the screen — never in a frame) */
export function anyLost() {
  if (!ctxOf) return false;
  for (const r of tracked) {
    const cv = r.deref(); if (!cv) { tracked.delete(r); continue; }
    const x = ctxOf.get(cv);
    try { if (x && typeof x.isContextLost === 'function' && x.isContextLost()) return true; } catch { /* fine */ }
  }
  return false;
}
/** TESTS — a background purge as iOS does it, with no event: every watched 2D canvas's pixels wiped (its size set again) */
export function purgeForTest() {
  let n = 0;
  for (const r of tracked) { const cv = r.deref(); if (!cv || !(ctxOf && ctxOf.has(cv)) || !cv.width) continue; const w = cv.width; cv.width = 0; cv.width = w; n++; }
  return n;
}

/** the live canvases' pixel memory now (MB) + their count — the honest total */
export function canvasMb() {
  let b = 0, n = 0;
  for (const r of tracked) { const cv = r.deref(); if (!cv) { tracked.delete(r); continue; } const px = (cv.width || 0) * (cv.height || 0); if (px > 1) { b += px * 4; n++; } }
  return { mb: +(b / 1e6).toFixed(1), n };
}

// A context that draws nothing: what safeCtx() hands back when iOS refuses one, so a starved layer comes out blank instead of
// throwing on every frame. Every method is a no-op; the few that must return something return a harmless stand-in.
let starved = 0;
const NOOP = () => {};
const GRAD = Object.freeze({ addColorStop: NOOP });
const img = (w, h) => {
  const W = Math.max(1, Math.floor(Math.abs(w) || 1)), H = Math.max(1, Math.floor(Math.abs(h) || 1));
  return typeof ImageData === 'function' ? new ImageData(W, H) : { width: W, height: H, data: new Uint8ClampedArray(W * H * 4) };
};
const RET = {
  createLinearGradient: () => GRAD, createRadialGradient: () => GRAD, createConicGradient: () => GRAD, createPattern: () => null,
  createImageData: (w, h) => (typeof w === 'object' ? img(w.width, w.height) : img(w, h)), getImageData: (x, y, w, h) => img(w, h),
  measureText: () => ({ width: 0, actualBoundingBoxAscent: 0, actualBoundingBoxDescent: 0 }), isPointInPath: () => false,
  isPointInStroke: () => false, getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }), getLineDash: () => [],
};
function nullCtx(cv) {
  const props = { canvas: cv };
  return new Proxy(props, {
    get: (o, k) => (k in RET ? RET[k] : k in o ? o[k] : NOOP),
    set: (o, k, v) => { if (!(k in RET)) o[k] = v; return true; },
  });
}
/** a canvas's 2D context — or, when iOS has no canvas memory left (getContext returns null / throws), a stand-in that draws
 *  nothing and counts the miss (starvedCount(): the scene steps its tier down to free memory). Never null, never throws. */
export function safeCtx(cv, o) {
  track(cv);
  let x = null;
  try { x = cv.getContext('2d', o) || null; } catch { x = null; }
  if (x) { watchLoss(cv, x); return x; }
  starved++;
  return nullCtx(cv);
}
/** how many contexts iOS has refused so far (safeCtx) */
export const starvedCount = () => starved;

// C4c — `&dpr=3` (review-4 §E 17): the Harbor's baked + offscreen layers are capped at 2× on phones; the flag lifts the cap to the
// device's own dpr (3 on an iPhone) for the owner's LOOK judgement only — never a default (the memory + the fill cost ×2.25).
// Read once at load: the flag is a link's, not a panel toggle.
export const BAKE_CAP = (() => { try { return typeof location !== 'undefined' && new URLSearchParams(location.search).get('dpr') === '3' ? 3 : 2; } catch { return 2; } })();

// 9f — A CANVAS's CSS WIDTH WITHOUT A LAYOUT READ: reading `clientWidth` in the frame loop forces a synchronous layout whenever
// the page was restyled since the last frame (the TR-3B's drain restyles the NEON sign every frame — the crisp layer + the hush
// sign's overlays then paid a whole page layout per frame). One read the first time, then a ResizeObserver keeps it.
const cssW = new WeakMap();
/** the canvas's CSS width (px), cached per canvas */
/** THE CITY's LONG NIGHT (Nov 12 night): a module's teardown frees its canvases AT ONCE — each zeroed (its backing store gone now, not at the next
 *  GC: a long night of city → room → game trips on an iPhone; the memory guard's count drops with it). Takes canvases, { cv | canvas | sv } holders,
 *  Maps, Sets, arrays and plain objects of them (two levels deep) — anything else is ignored. */
export function freeCanvases(...vals) {
  const seen = new Set();
  const zero = c => { if (c && typeof c === 'object' && 'width' in c && 'height' in c && typeof c.getContext === 'function') { try { c.width = 0; c.height = 0; } catch { /* fine */ } return true; } return false; };
  const walk = (v, d) => {
    if (!v || typeof v !== 'object' || seen.has(v)) return; seen.add(v);
    if (zero(v)) return;
    for (const k of ['cv', 'canvas', 'sv', 'ang', 'glow', 'blank', 'fresh']) if (v[k]) zero(v[k]);
    if (d <= 0) return;
    const kids = v instanceof Map ? [...v.values()] : v instanceof Set || Array.isArray(v) ? [...v] : Object.getPrototypeOf(v) === Object.prototype ? Object.values(v) : [];
    for (const x of kids) walk(x, d - 1);
  };
  for (const v of vals) walk(v, 2);
}
export function cssWidth(cv) {
  if (!cv) return 0;
  let e = cssW.get(cv);
  if (!e) {
    e = { w: cv.clientWidth || 0 };
    cssW.set(cv, e);
    if (typeof ResizeObserver !== 'undefined') { try { new ResizeObserver(es => { for (const x of es) e.w = x.contentRect.width; }).observe(cv); } catch { e.w = -1; } }
    else e.w = -1;
  }
  return e.w >= 0 ? e.w : (cv.clientWidth || 0);
}
