// CITY 2.0 — THE HARBOR: the breakwater in open water on the right, the lighthouse on it, the keeper's cottage. Part 1: a
// tapered tower with two bands, the lantern as a box, the cottage as a box with a roof. Part 5 crafts them (the turning beam).
import { box, poly, rgb, shade } from './shapes.js';

export function lighthouseSteps(L, T) {
  const cam = L.cam, b = L.breakwater, l = L.lighthouse, k = L.cottage;
  return [x => {
    box(x, cam, { x0: b.x0, x1: b.x1, z0: b.z, z1: b.z + 3, h: b.h }, shade(T.quay, -0.1), { light: -1 });
    // the keeper's cottage (behind the tower's right side)
    box(x, cam, { x0: k.x, x1: k.x + k.w, z0: k.z + 1, z1: k.z + 4, h: k.h - b.h }, shade(T.light, -0.15), { y0: b.h, light: -1 });
    poly(x, cam, [[k.x - 0.4, k.h, k.z + 1], [k.x + k.w / 2, k.roof, k.z + 1], [k.x + k.w + 0.4, k.h, k.z + 1]], rgb(shade(T.lightBand, -0.2)));
    // the tower: tapered, two bands, the gallery and the lantern
    const tower = (y0, y1, col) => { const f0 = y0 / l.h, f1 = y1 / l.h, r0 = l.r0 + (l.r1 - l.r0) * f0, r1 = l.r0 + (l.r1 - l.r0) * f1; poly(x, cam, [[l.x - r0, y0, l.z], [l.x - r1, y1, l.z], [l.x + r1, y1, l.z], [l.x + r0, y0, l.z]], rgb(col)); };
    box(x, cam, { x0: l.x - l.r0 - 1, x1: l.x + l.r0 + 1, z0: l.z - 0.5, z1: l.z + 3, h: 2.2 - b.h }, shade(T.quay, 0.1), { y0: b.h });
    tower(2.2, l.h, T.light);
    tower(l.h * 0.25, l.h * 0.38, T.lightBand);
    tower(l.h * 0.6, l.h * 0.73, T.lightBand);
    box(x, cam, { x0: l.x - (l.gallery || l.r1 + 1), x1: l.x + (l.gallery || l.r1 + 1), z0: l.z, z1: l.z + 0.5, h: 0.45 }, shade(T.lamp, 0.1), { y0: l.h, top: false });
    box(x, cam, { x0: l.x - l.r1 * 0.7, x1: l.x + l.r1 * 0.7, z0: l.z, z1: l.z + 0.5, h: 2.95 }, T.night > 0.4 ? [255, 236, 190] : shade(T.light, -0.25), { y0: l.h + 0.45, top: false });
    poly(x, cam, [[l.x - l.r1, l.h + 3.4, l.z], [l.x, l.h + 5.1, l.z], [l.x + l.r1, l.h + 3.4, l.z]], rgb(shade(T.lamp, 0.15)));
  }];
}
