// CITY 2.0 — THE HARBOR: a skyline building in grey box (Part 1): a shaded box in its depth's tone, mixed into the haze by
// distance, a placeholder crown, and at night a sparse glitter of lit windows (far windows are glitter — no detail; Part 2
// builds the real facades). Shared by far.js, mid.js, landmarks.js and quay.js.
import { box, crown, rgb, shade } from './shapes.js';
import { hazed } from './tones.js';
import { project } from '../../core/harbor-layout.js';
import { rngFrom } from '../../core/rng.js';

export function skyBlock(x, cam, b, T, tone) {
  const col = hazed(T, T[tone], b.z0);
  box(x, cam, b, col, { light: 1, sideK: 0.1 });
  if (b.crown) crown(x, cam, (b.x0 + b.x1) / 2, b.h, b.z0, b.x1 - b.x0, b.crown, hazed(T, T.crown, b.z0, 0.5));
  // the top edge catches the sky (a hairline: the silhouettes read against each other)
  const [a, y] = project(cam, b.x0, b.h, b.z0), [c] = project(cam, b.x1, b.h, b.z0);
  x.fillStyle = rgb(shade(col, 0.18)); x.fillRect(a, y, c - a, 0.8);
  // night: a few lit windows as glitter (the share by depth: nearer rows show more)
  if (T.winA > 0.02) {
    const r = rngFrom(Math.round(b.x0 * 131 + b.z0 * 71 + b.h * 31));
    const s = cam.F / b.z0, fh = 3 * s, cw = 2.3 * s;
    if (fh < 1.2) return;
    const [x0, yTop] = project(cam, b.x0, b.h, b.z0), [x1, yBot] = project(cam, b.x1, 0, b.z0);
    const share = 0.18 + 0.12 * Math.min(1, 280 / b.z0);
    for (let yy = yTop + fh * 0.6; yy < yBot - fh; yy += fh) for (let xx = x0 + cw * 0.4; xx < x1 - cw * 0.6; xx += cw) {
      if (r() > share) continue;
      x.fillStyle = rgb(hazed(T, T.win, b.z0, 0.35), T.winA * (0.45 + r() * 0.5));
      x.fillRect(xx, yy, Math.max(0.6, cw * 0.5), Math.max(0.6, fh * 0.55));
    }
  }
}

/** a band's blocks, far first, in chunks of n per step */
export function bandSteps(cam, blocks, T, tone, n = 8) {
  const sorted = [...blocks].sort((a, b) => b.z0 - a.z0);
  const steps = [];
  for (let i = 0; i < sorted.length; i += n) { const part = sorted.slice(i, i + n); steps.push(x => { for (const b of part) skyBlock(x, cam, b, T, tone); }); }
  return steps;
}

/** a haze veil at a band's feet (the distance dissolves): from the ground line up `up` pt, in the haze colour */
export function hazeVeil(x, cam, z, up, T, a) {
  const y = cam.VPY + cam.F * cam.CAMH / z;
  const g = x.createLinearGradient(0, y - up, 0, y + 2);
  g.addColorStop(0, rgb(T.haze, 0)); g.addColorStop(1, rgb(T.haze, a));
  x.fillStyle = g; x.fillRect(0, y - up, cam.W, up + 2);
}
