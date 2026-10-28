// CITY 2.0 — 9c: THE CRISP LAYER (the owner, Oct 27: "the speakeasy's blade looks blurry … do that with the other billboard too … and all
// other important things"). The city's canvases are capped at DPR 2 (scene.js TIERS, bake.js — the iOS memory budget), so on an iPhone
// (DPR 3) every painted letter is stretched 1.5× — soft next to the NEON logo (SVG). This is ONE shared layer for the LETTERING the eye
// reads up close: small overlay canvases at the phone's FULL dpr laid exactly over their spot in the city (placed through the city
// context's current transform, like the hush sign's), each redrawn only when its key changes (a new bake, a new game, a lit level step)
// and CROSSFADED with the city's own re-bake fade (never a pop). The city still bakes / draws the same thing underneath (the fallback:
// a desktop at DPR ≤ 2, or the layer turned off with &force=no-crisp draws nothing here; 9e: on at every tier, tier 0 included).
//   What goes here: things with letters that NOTHING passes in front of (above the walkers' heads): the speakeasy's BLADE (its board, its
//   lit letters, its marquee bulbs), the EST. 1924 DATE STONE, the speakeasy's ROOF BILLBOARD's poster face by day. NOT here: the windows,
//   people, vehicles, bricks, textures (the owner's DECIDED list), and anything a walker crosses in front of (the barber's gilt, the
//   promenade's set pieces — a layer over the city can't go behind a person; see docs/harbor.md#9c).
//   Memory: only the items' boxes (the blade ~25 × 115 pt → 75 × 345 px ≈ 0.1 MB, two while it crossfades).
import { ctx2d } from '../../ui/canvas-safe.js';

export function createCrisp() {
  const items = new Map();   // id → { a, b (the two canvases: a = current, b = the one fading out), key, css, M, shownAt, op, z, xf }
  let dpr = 1, on = false, frameN = 0, host = null;

  /** per frame, before the items: the context the city draws in + the tier → whether the layer is worth it here */
  function begin(c, tier, wanted = true) {
    frameN++;
    host = c && c.canvas && c.canvas.parentElement;
    const dev = (typeof window !== 'undefined' && window.devicePixelRatio) || 1, cw = (c && c.canvas && c.canvas.clientWidth) || 1, canvasDpr = c && c.canvas ? c.canvas.width / cw : dev;
    // (9e — THE BLADE STAYS SHARP AT EVERY TIER: the owner's Day of the Dead night at 20 % battery stepped down to tier 0 and the blade went
    //  soft on the city's canvas. The layer is ~0.1 MB + redraws only on a key change, so it stays on at every tier; only the DPR check
    //  remains — a tier-0 canvas is even softer, so it matters most there)
    dpr = Math.min(3, dev);
    on = !!host && wanted && dpr > canvasDpr + 0.2;
    return on;
  }
  const mkCv = (z) => { const cv = document.createElement('canvas'); cv.className = 'hc-crisp'; cv.setAttribute('aria-hidden', 'true'); Object.assign(cv.style, { position: 'absolute', pointerEvents: 'none', left: '0px', top: '0px', zIndex: String(z) }); host.append(cv); return cv; };
  /**
   * show one item this frame: { id, box: { x, y, w, h } (pt, in the city context's coordinates), key (redraw when it changes), draw(x)
   * (in pt — x is set up so the city's own drawing code paints the same thing at full dpr), alpha (0..1), z (stacking among the items),
   * xfade (ms: a key change crossfades over it; 0 = at once) } → true when it is shown here (the caller may skip its own canvas draw)
   */
  function show(c, it) {
    if (!on || !it.box || !(it.box.w > 0) || !(it.box.h > 0)) return false;
    let I = items.get(it.id);
    const M0 = typeof c.getTransform === 'function' ? c.getTransform() : null, cw = c.canvas.clientWidth || 1, ratio = c.canvas.width / cw || 1;
    const T = M0 ? M0 : { a: ratio, b: 0, c: 0, d: ratio, e: 0, f: 0 };
    const P = (x, y) => [(T.a * x + T.c * y + T.e) / ratio, (T.b * x + T.d * y + T.f) / ratio];
    const bx = it.box, cs = [P(bx.x, bx.y), P(bx.x + bx.w, bx.y), P(bx.x, bx.y + bx.h), P(bx.x + bx.w, bx.y + bx.h)];
    const x0 = Math.floor(Math.min(...cs.map(p => p[0]))), y0 = Math.floor(Math.min(...cs.map(p => p[1]))), x1 = Math.ceil(Math.max(...cs.map(p => p[0]))), y1 = Math.ceil(Math.max(...cs.map(p => p[1])));
    const geo = `${x0}|${y0}|${x1}|${y1}|${dpr}|${T.a.toFixed(4)}|${T.d.toFixed(4)}|${T.e.toFixed(1)}|${T.f.toFixed(1)}`;
    const z = it.z || 1;
    if (!I || !I.a.isConnected || I.host !== host) { if (I) drop(it.id); I = { a: mkCv(z), b: null, key: null, geo: '', host, xfFrom: 0, xf: 0, op: -1, opB: -1 }; items.set(it.id, I); }
    const place = cv => {
      cv.width = Math.max(1, (x1 - x0) * dpr); cv.height = Math.max(1, (y1 - y0) * dpr);
      Object.assign(cv.style, { left: `${x0}px`, top: `${y0}px`, width: `${x1 - x0}px`, height: `${y1 - y0}px` });
    };
    const paint = cv => {
      const x = ctx2d(cv); if (!x) return;
      x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, cv.width, cv.height);
      x.setTransform(T.a / ratio * dpr, T.b / ratio * dpr, T.c / ratio * dpr, T.d / ratio * dpr, (T.e / ratio - x0) * dpr, (T.f / ratio - y0) * dpr);
      x.save(); try { it.draw(x); } catch (e) { console.warn('[harbor] crisp', it.id, e); } x.restore();
    };
    const now = performance.now();
    if (geo !== I.geo) { I.geo = geo; place(I.a); paint(I.a); I.key = it.key; if (I.b) { I.b.remove(); I.b = null; } }
    else if (it.key !== I.key) {
      // a new look: the old canvas stays under, the new one fades in over xfade ms (the city's own crossfade)
      if (it.xfade > 0) { if (!I.b) { I.b = mkCv(z); I.b.style.zIndex = String(z); } const t = I.a; I.a = I.b; I.b = t; host.append(I.a); place(I.a); I.xfFrom = now; I.xf = it.xfade; I.op = -1; }
      paint(I.a); I.key = it.key;
    }
    const a = Math.max(0, Math.min(1, it.alpha == null ? 1 : it.alpha));
    let ka = 1;
    if (I.b) { ka = I.xf > 0 ? Math.min(1, (now - I.xfFrom) / I.xf) : 1; if (ka >= 1) { I.b.remove(); I.b = null; } }
    const opA = Math.round(a * ka * 100) / 100, opB = I.b ? Math.round(a * 100) / 100 : -1;
    if (opA !== I.op) { I.op = opA; I.a.style.opacity = String(opA); }
    if (I.b && opB !== I.opB) { I.opB = opB; I.b.style.opacity = String(opB); }
    I.a.style.display = ''; if (I.b) I.b.style.display = '';
    I.seen = frameN;
    return true;
  }
  function drop(id) { const I = items.get(id); if (!I) return; I.a.remove(); if (I.b) I.b.remove(); items.delete(id); }
  /** after the frame: an item not shown this frame hides (and is freed after ~2 s unseen) */
  function end() {
    for (const [id, I] of items) {
      if (I.seen === frameN) continue;
      if (I.a.style.display !== 'none') { I.a.style.display = 'none'; if (I.b) I.b.style.display = 'none'; }
      if (frameN - I.seen > 120) drop(id);
    }
  }
  return {
    begin, show, end,
    get on() { return on; },
    get dpr() { return dpr; },
    debug: () => ({ on, dpr, items: [...items].filter(([, I]) => I.seen === frameN).map(([id, I]) => ({ id, w: I.a.width, h: I.a.height, op: I.op, fading: !!I.b })) }),
    destroy() { for (const id of [...items.keys()]) drop(id); },
  };
}
