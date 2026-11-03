// CITY 2.0 — PROGRESSION B: THE POLAROID's PHOTO — the city's ACTUAL frame, composed from its own layers (run by scene.js right after a
// frame drew, so every buffer — the GPU fireworks' too — is this frame's). The FEASIBILITY CHECK (WebKit 402×874 @3, Nov 2): every city
// canvas composes into one with no taint (all same-origin), the crisp lettering included; the NEON sign + its tagline are the page's
// SVG / text OVER the city (the title's UI, like the dock) — not in the photo: the crop keeps below them where the legendary allows.
//   composeCity({ host, cx, cy, avoid: { y (the sign band's bottom) }, side }) → { canvas, ms, box: { left, top, side }, dpr }
import { safeCtx } from '../../ui/canvas-safe.js';

/** the overlays a few legendaries fly on, outside the city's own box (their canvases sit on <body>) */
const OVERLAYS = 'canvas.hb-bb, canvas.hb-balloon, canvas.hl-tri';

export function composeCity({ host, cx, cy, avoid = null, side = null }) {
  const t0 = performance.now();
  const W = innerWidth, H = innerHeight, dpr = Math.min(3, window.devicePixelRatio || 1);
  const S = Math.round(side || Math.min(W * 0.8, H * 0.5));   // (a little tighter than the width: the legendary reads bigger in the print)
  // the crop: square round the legendary, inside the screen; below the sign when the legendary sits low enough to keep it in frame
  let top = Math.max(0, Math.min(H - S, cy - S / 2)), left = Math.max(0, Math.min(W - S, cx - S / 2));
  if (avoid && avoid.y != null && top < avoid.y && cy > avoid.y + S * 0.12) top = Math.max(top, Math.min(avoid.y, cy - S * 0.15, H - S));
  const out = document.createElement('canvas'); out.width = Math.round(S * dpr); out.height = Math.round(S * dpr);
  const x = safeCtx(out);
  x.fillStyle = '#05050a'; x.fillRect(0, 0, out.width, out.height);
  const seen = new Set(), layers = [];
  const add = (cv, i) => { if (seen.has(cv)) return; seen.add(cv); const cs = getComputedStyle(cv); if (cs.display === 'none' || cs.visibility === 'hidden') return; const op = +cs.opacity; if (!(op > 0.01)) return; const z = parseInt(cs.zIndex, 10); layers.push({ cv, op, z: Number.isFinite(z) ? z : 0, i }); };
  let i = 0;
  if (host) for (const cv of host.querySelectorAll('canvas')) add(cv, i++);
  for (const cv of document.querySelectorAll(OVERLAYS)) add(cv, 1000 + i++);
  layers.sort((a, b) => (a.z - b.z) || (a.i - b.i));
  for (const L of layers) {
    const r = L.cv.getBoundingClientRect();
    if (r.width < 1 || r.height < 1 || r.right < left || r.left > left + S || r.bottom < top || r.top > top + S) continue;
    x.globalAlpha = L.op;
    try { x.drawImage(L.cv, (r.left - left) * dpr, (r.top - top) * dpr, r.width * dpr, r.height * dpr); } catch { /* a layer that can't be read (a lost context): the rest still make the photo */ }
  }
  x.globalAlpha = 1;
  return { canvas: out, ms: +(performance.now() - t0).toFixed(1), box: { left, top, side: S }, dpr };
}

/** a canvas → a JPEG blob (the album's copy) — async, off the frame */
export function toJpeg(canvas, q = 0.86) {
  return new Promise(res => { try { canvas.toBlob(b => res(b || null), 'image/jpeg', q); } catch { res(null); } });
}
