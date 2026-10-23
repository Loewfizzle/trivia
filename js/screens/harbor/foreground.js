// CITY 2.0 — THE HARBOR: the foreground — the nearest edge of the stage and the frame around the whole picture. Part 1: the
// vignette (a soft frame, stronger at night). Later: the front corners' leaves and branches over the edges, the weather on
// the "lens" (Parts 8–9).
import { safeCtx } from '../../ui/canvas-safe.js';
export function drawForeground(c, W, H, vignette, night) {
  c.globalAlpha = 0.45 + 0.45 * night;
  c.drawImage(vignette, 0, 0, W, H);
  c.globalAlpha = 1;
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
