// CITY 2.0 — THE HARBOR: the far quay — the sign frames on the four hero blocks (the hotel's blade, the PULSE, NEON PAR and JAZZ
// roofs: their signs come with Part 3; the blocks themselves are skyline.js's near group), the quay wall and its row of lamps.
import { box, rgb, shade } from './shapes.js';
import { project } from '../../core/harbor-layout.js';

export function quaySteps(L, T) {
  const cam = L.cam, q = L.quay;
  return [
    x => { for (const b of [...L.heroes].sort((a, c) => c.z0 - a.z0)) {
      // the sign's place (Part 3): a blade on the hotel, a scaffold + tube on the roofs — a frame only
      x.strokeStyle = rgb(shade(T.hero, T.night > 0.5 ? 0.3 : -0.3), 0.55); x.lineWidth = 0.7;
      if (b.sign === 'blade') { const [a, y0] = project(cam, b.x0 + 3, b.h * 0.95, b.z0 - 1.4), [c, y1] = project(cam, b.x0 + 7.6, b.h * 0.15, b.z0 - 1.4); x.strokeRect(a, y0, c - a, y1 - y0); }
      else { const [a, y0] = project(cam, b.x0 + 1, b.h + 6, b.z0), [c, y1] = project(cam, b.x1 - 1, b.h, b.z0); x.strokeRect(a, y0, c - a, y1 - y0); }
    } },
    x => {
      // the quay wall: the far bank's edge on the water, its top catching the light
      const [, yTop] = project(cam, 0, q.top, q.z), [, yFoot] = project(cam, 0, q.foot, q.z);
      x.fillStyle = rgb(T.quay); x.fillRect(0, yTop, cam.W, yFoot - yTop);
      x.fillStyle = rgb(shade(T.quay, 0.25)); x.fillRect(0, yTop, cam.W, 0.9);
      // its lamps: one every 11 units (Part 4 lights them and puts their light in the water)
      const hw = cam.hw(q.z) * 1.05;
      for (let wx = -Math.floor(hw / 11) * 11; wx < hw; wx += 11) box(x, cam, { x0: wx - 0.15, x1: wx + 0.15, z0: q.z + 1, z1: q.z + 1.3, h: 3.2 }, shade(T.quay, -0.3), { y0: q.top, top: false });
    },
  ];
}
