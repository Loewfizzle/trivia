// CITY 2.0 — THE HARBOR: the sky's own paint — the hour's gradient (palette.js, from the real sky: core/sky.js#look) and the
// glow low over the harbor, repainted only when the look changes. The real sky ON it (the stars, the sun, the moon, planes,
// clouds, rain, birds, fireworks, rainbows) is the district's sky modules, called as they are (docs/harbor.md#sky).
import { css } from '../district/palette.js';

export function paintSky(cv, W, HZ, dpr, P) {
  const cw = Math.max(1, Math.round(W * dpr)), ch = Math.max(1, Math.round(HZ * dpr));
  if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
  const x = cv.getContext('2d');
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  const g = x.createLinearGradient(0, 0, 0, HZ);
  g.addColorStop(0, css(P.sky[0])); g.addColorStop(0.45, css(P.sky[1])); g.addColorStop(0.8, css(P.sky[2])); g.addColorStop(1, css(P.sky[3]));
  x.fillStyle = g; x.fillRect(0, 0, W, HZ);
  const hg = x.createRadialGradient(W * 0.5, HZ * 1.02, 0, W * 0.5, HZ * 1.02, Math.max(W, HZ) * 0.9);
  hg.addColorStop(0, css(P.glow)); hg.addColorStop(0.45, css(P.glow2)); hg.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = hg; x.fillRect(0, 0, W, HZ);
  return cv;
}
