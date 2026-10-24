// CITY 2.0 — THE HARBOR: drawing helpers in world space (the projector from core/harbor-layout.js). Part 1 draws grey boxes;
// later parts draw the real thing with the same projection.
import { project } from '../../core/harbor-layout.js';

export const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
export const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const rgb = (c, a = 1) => (a >= 1 ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`);
export const shade = (c, k) => (k >= 0 ? mix(c, [255, 255, 255], k) : mix(c, [0, 0, 0], -k));

/** a polygon of world points */
export function poly(x, cam, pts, fill) {
  x.beginPath();
  pts.forEach(([wx, wy, wz], i) => { const [sx, sy] = project(cam, wx, wy, wz); if (i) x.lineTo(sx, sy); else x.moveTo(sx, sy); });
  x.closePath();
  x.fillStyle = fill; x.fill();
}

/**
 * A box: x0..x1, 0..h (from y0), z0..z1. Draws what the camera sees: the side facing the middle, the top if it is below the
 * eye, then the front. col: [r,g,b]; light: which side catches the light (-1 left, 1 right).
 */
export function box(x, cam, b, col, { y0 = 0, light = 1, top = true, sideK = 0.14 } = {}) {
  const { x0, x1, z0, z1, h } = b, y1 = y0 + h;
  if (x1 < 0) poly(x, cam, [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], rgb(shade(col, light > 0 ? sideK : -sideK)));
  if (x0 > 0) poly(x, cam, [[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]], rgb(shade(col, light < 0 ? sideK : -sideK)));
  if (top && y1 < cam.CAMH) poly(x, cam, [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], rgb(shade(col, 0.22)));
  const [a, b2] = project(cam, x0, y1, z0), [c, d] = project(cam, x1, y0, z0);
  x.fillStyle = rgb(col); x.fillRect(a, b2, c - a, d - b2);
  return { x: a, y: b2, w: c - a, h: d - b2 };
}

// (FP3a, FREV H4 / H5: the placeholder person + vehicle are gone — 8P's folk.js draws the people, bus.js the bus)
