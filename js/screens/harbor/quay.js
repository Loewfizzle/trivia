// CITY 2.0 — THE HARBOR: the far quay — the quay wall and its row of lamps (the hero blocks are skyline.js's near group; their
// signs: Part 3, neon.js). Part 4 lights the lamps at night (drawQuayLamps, every frame): their light runs down into the water.
import { box, rgb, shade } from './shapes.js';
import { project } from '../../core/harbor-layout.js';

export function quaySteps(L, T) {
  const cam = L.cam, q = L.quay;
  return [
    x => {
      // the quay wall: the far bank's edge on the water, its top catching the light
      const [, yTop] = project(cam, 0, q.top, q.z), [, yFoot] = project(cam, 0, q.foot, q.z);
      x.fillStyle = rgb(T.quay); x.fillRect(0, yTop, cam.W, yFoot - yTop);
      x.fillStyle = rgb(shade(T.quay, 0.25)); x.fillRect(0, yTop, cam.W, 0.9);
      // its lamps: one every 11 units (lit at night: drawQuayLamps)
      const hw = cam.hw(q.z) * 1.05;
      for (let wx = -Math.floor(hw / 11) * 11; wx < hw; wx += 11) box(x, cam, { x0: wx - 0.15, x1: wx + 0.15, z0: q.z + 1, z1: q.z + 1.3, h: 3.2 }, shade(T.quay, -0.3), { y0: q.top, top: false });
    },
  ];
}

/** the quay's lamps lit (night: k = how lit — the night × the city's power-on): a warm head, its halo, the pool of light on the
 *  quay's edge, all baked once per layout into ONE sprite (quayLampSprite) and drawn additively with k (one drawImage a frame).
 *  The water mirrors them (water.js): long warm columns from the far bank. */
export function drawQuayLamps(c, sp, k) {
  if (k <= 0.01 || !sp) return;
  c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, k);
  c.drawImage(sp.cv, 0, sp.y, sp.w, sp.h);
  c.restore();
}
/** the lamps' sprite: { cv, y, w, h } (screen pt) — glow: a radial sprite; dpr: the scene's */
export function quayLampSprite(L, glow, dpr, old = null) {
  const cam = L.cam, q = L.quay, s = cam.F / (q.z + 1);
  const [, yh] = project(cam, 0, 3.25, q.z + 1.15), [, yq] = project(cam, 0, q.top, q.z);
  const y = Math.floor(yh - s * 1.6), h = Math.ceil(yq + s * 0.8 - y), cv = old || document.createElement('canvas');
  cv.width = Math.ceil(cam.W * dpr); cv.height = Math.ceil(h * dpr);
  const x = cv.getContext('2d');
  x.setTransform(dpr, 0, 0, dpr, 0, -y * dpr);
  drawLamps(x, L, glow);
  return { cv, y, w: cam.W, h };
}
function drawLamps(c, L, glow) {
  const cam = L.cam, q = L.quay, hw = cam.hw(q.z) * 1.05, s = cam.F / (q.z + 1), k = 1;
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let wx = -Math.floor(hw / 11) * 11; wx < hw; wx += 11) {
    const [x, y] = project(cam, wx, 3.25, q.z + 1.15);
    if (x < -10 || x > cam.W + 10) continue;
    const [, yq] = project(cam, wx, q.top, q.z);
    // the pool on the quay's edge, the halo, the hot head
    c.globalAlpha = 0.22 * k; c.drawImage(glow, x - s * 2.6, yq - s * 0.7, s * 5.2, s * 1.4);
    c.globalAlpha = 0.5 * k; c.drawImage(glow, x - s * 1.5, y - s * 1.5, s * 3, s * 3);
    c.globalAlpha = 0.95 * k; c.fillStyle = 'rgb(255,236,196)'; c.fillRect(x - Math.max(0.6, s * 0.17), y - Math.max(0.5, s * 0.12), Math.max(1.2, s * 0.34), Math.max(1, s * 0.3));
  }
  c.restore();
}
