// SAFARI-SAFE CANVAS (City 2.0, NEON PASS 5 — the owner's iPhone showed less than Chromium; docs/harbor.md#neon-pass-5).
// What Safari / WebKit does differently, and the safe path every effect takes instead of depending on it:
//   ctx.filter       Safari before 18 has no canvas filters: `x.filter = 'blur(…)'` just sets a plain property and draws
//                    unblurred. blurWorks() tests it once by its pixels (reading the property back can't tell); the callers draw a
//                    soft look of their own without it (stacked wider strokes at a low alpha).
//   drawImage        older WebKit drew NOTHING when the source rect ran outside the image (Chromium clips it); blit() clips the
//                    source rect to the image and moves the destination to match — the same picture in both.
//   getContext       iOS caps the canvas memory of a page; past it, getContext('2d') returns null (and every draw throws).
//                    ctx2d() returns null instead of throwing, for a sprite that must never take the frame down with it.
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
  try { return cv.getContext('2d', o) || null; } catch { return null; }
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
  let x = null;
  try { x = cv.getContext('2d', o) || null; } catch { x = null; }
  if (x) return x;
  starved++;
  return nullCtx(cv);
}
/** how many contexts iOS has refused so far (safeCtx) */
export const starvedCount = () => starved;
