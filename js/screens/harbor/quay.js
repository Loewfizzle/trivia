// CITY 2.0 — THE HARBOR: the far quay — the quay wall and its row of lamps (the hero blocks are skyline.js's near group; their
// signs: Part 3, neon.js).
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
      // its lamps: one every 11 units (Part 4 lights them and puts their light in the water)
      const hw = cam.hw(q.z) * 1.05;
      for (let wx = -Math.floor(hw / 11) * 11; wx < hw; wx += 11) box(x, cam, { x0: wx - 0.15, x1: wx + 0.15, z0: q.z + 1, z1: q.z + 1.3, h: 3.2 }, shade(T.quay, -0.3), { y0: q.top, top: false });
    },
  ];
}
