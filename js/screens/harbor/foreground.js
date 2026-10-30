// CITY 2.0 — THE HARBOR: the foreground — the nearest edge of the stage and the frame around the whole picture. Part 1: the
// vignette (a soft frame, stronger at night). Later: the front corners' leaves and branches over the edges, the weather on
// the "lens" (Parts 8–9).
import { safeCtx } from '../../ui/canvas-safe.js';
export function drawForeground(c, W, H, vignette, night) {
  c.globalAlpha = 0.45 + 0.45 * night;
  c.drawImage(vignette, 0, 0, W, H);
  c.globalAlpha = 1;
}

// SKY-B — THE VIGNETTE AS A LAYER (the party's speed on the iPhone: Safari rasterizes every canvas draw in its GPU process on the CPU — a
// full-screen alpha blend of the vignette EVERY frame was ~8 % of the party frame's pixels). The same half-res vignette canvas now sits on
// the page right over the city's canvas, under every overlay (the crisp layer, the hush sign — as before: they were drawn above it), its
// strength as the element's opacity: the phone's compositor (the real GPU) blends it for free. The same picture. The frozen pane (drawn
// over the vignette on the canvas) + &force=vig-canvas draw it on the canvas as before.
export function createVignetteLayer() {
  let el = null, a = -1;
  return {
    /** over the city's canvas (its parent the host): the vignette canvas itself, at alpha */
    show(canvas, vig, alpha) {
      const host = canvas && canvas.parentElement;
      if (!host || !vig) return false;
      if (el !== vig || !vig.isConnected || vig.parentElement !== host) {
        if (el && el !== vig) el.remove();
        el = vig; el.className = 'hb-vig'; el.setAttribute('aria-hidden', 'true');
        Object.assign(el.style, { position: 'absolute', left: '0px', top: '0px', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '0', display: 'block' });
        canvas.after(el); a = -1;
      }
      const q = Math.round(Math.max(0, Math.min(1, alpha)) * 250) / 250;
      if (q !== a) { a = q; el.style.opacity = String(q); }
      if (el.style.display === 'none') el.style.display = 'block';
      return true;
    },
    hide() { if (el && el.style.display !== 'none') el.style.display = 'none'; },
    get el() { return el; },
    destroy() { if (el) el.remove(); el = null; },
  };
}

export function makeVignette(W, H) {
  const v = document.createElement('canvas');
  v.width = Math.max(1, Math.ceil(W / 2)); v.height = Math.max(1, Math.ceil(H / 2));
  const x = safeCtx(v);
  const g = x.createRadialGradient(v.width / 2, v.height * 0.45, Math.min(v.width, v.height) * 0.3, v.width / 2, v.height * 0.5, Math.max(v.width, v.height) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(1,1,8,0.55)');
  x.fillStyle = g; x.fillRect(0, 0, v.width, v.height);
  return v;
}
