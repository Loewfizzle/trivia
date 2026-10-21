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

/** a placeholder person: legs, a coat, a head (+ a hat), ~h world units tall, standing at (x, 0, z) */
export function person(x, cam, p, col, { hat = col, rim = null } = {}) {
  const [sx, sy] = project(cam, p.x, 0, p.z), s = cam.F / p.z, hh = p.h * s, w = hh * 0.28;
  x.fillStyle = rgb(shade(col, -0.35));
  x.fillRect(sx - w * 0.38, sy - hh * 0.44, w * 0.28, hh * 0.44); x.fillRect(sx + w * 0.1, sy - hh * 0.44, w * 0.28, hh * 0.44);   // legs
  x.fillStyle = rgb(col);
  x.beginPath(); x.roundRect(sx - w / 2, sy - hh * 0.82, w, hh * 0.44, w * 0.3); x.fill();                                        // the coat
  x.beginPath(); x.arc(sx, sy - hh * 0.9, hh * 0.085, 0, Math.PI * 2); x.fill();                                                 // the head
  if (p.hat) { x.fillStyle = rgb(hat); x.fillRect(sx - hh * 0.12, sy - hh * 0.99, hh * 0.24, hh * 0.035); x.fillRect(sx - hh * 0.07, sy - hh * 1.06, hh * 0.14, hh * 0.07); }
  if (p.dog) { x.fillStyle = rgb(shade(col, -0.2)); x.fillRect(sx + p.dir * hh * 0.35 - hh * 0.09, sy - hh * 0.2, hh * 0.22, hh * 0.1); }
  if (rim) { x.fillStyle = rgb(rim, 0.55); x.fillRect(sx + (rim.side || 1) * w * 0.4, sy - hh * 0.82, Math.max(0.6, w * 0.1), hh * 0.44); }
  return { x: sx - w / 2, y: sy - hh, w, h: hh };
}

/** a placeholder vehicle seen side-on: body, cabin, wheels */
export function vehicle(x, cam, v, col, { cabin = 0.55, win = null, bus = false } = {}) {
  const [a, ay] = project(cam, v.x - v.len / 2, 0.25, v.z), [b, by] = project(cam, v.x + v.len / 2, v.h, v.z), s = cam.F / v.z;
  const w = b - a, hgt = ay - by;
  x.fillStyle = rgb(col);
  if (bus) { x.beginPath(); x.roundRect(a, by, w, hgt, s * 0.35); x.fill(); }
  else {
    x.beginPath(); x.roundRect(a, by + hgt * 0.42, w, hgt * 0.58, s * 0.2); x.fill();
    const c0 = a + w * (v.dir > 0 ? 0.22 : 0.78 - cabin), cw = w * cabin;
    x.beginPath(); x.roundRect(c0, by, cw, hgt * 0.5, s * 0.25); x.fill();
  }
  if (win) { x.fillStyle = rgb(win); if (bus) for (let i = 0; i < 6; i++) x.fillRect(a + w * (0.08 + i * 0.145), by + hgt * 0.16, w * 0.11, hgt * 0.3); else x.fillRect(a + w * (v.dir > 0 ? 0.27 : 0.27), by + hgt * 0.1, w * 0.46, hgt * 0.3); }
  x.fillStyle = '#0b0b12';
  for (const f of [0.18, 0.82]) { x.beginPath(); x.arc(a + w * f, ay, Math.max(1.2, s * 0.36), 0, Math.PI * 2); x.fill(); }
  return { x: a, y: by, w, h: hgt };
}
