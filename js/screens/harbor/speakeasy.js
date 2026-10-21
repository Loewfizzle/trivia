// CITY 2.0 — THE HARBOR: the SPEAKEASY on our side, bleeding off the left edge (z 44–60, 10.5 units tall): its front and lit
// side, the windows you will see into, the unmarked door, the awning ("EST. 1924" comes with the craft), the rooftop with its
// planters, the water tower and the string lights' pole. Part 1: grey boxes at the final sizes; Part 7 builds it.
import { project } from '../../core/harbor-layout.js';
import { box, poly, rgb, shade } from './shapes.js';

export function speakeasySteps(L, T) {
  const cam = L.cam, s = L.speakeasy, night = T.night > 0.5;
  const at = (u, v) => project(cam, s.x0 + u, v, s.z0);
  return [x => {
    box(x, cam, s, T.speak, { light: 1, sideK: 0.12 });
    // the rooftop deck's parapet + the water tower + the planters + the pole
    box(x, cam, { x0: s.x0, x1: s.x1, z0: s.z0, z1: s.z0 + 0.3, h: 0.5 }, shade(T.speakTop, 0.1), { y0: s.h });
    const tw = s.tower;
    box(x, cam, { x0: tw.x - 1.1, x1: tw.x + 1.1, z0: tw.z, z1: tw.z + 2.2, h: 2.1 }, shade(T.speakTop, -0.1), { y0: s.h + 1.5 });
    poly(x, cam, [[tw.x - 1.2, s.h + 3.6, tw.z], [tw.x, s.h + 4.6, tw.z], [tw.x + 1.2, s.h + 3.6, tw.z]], rgb(shade(T.speakTop, -0.2)));
    for (const leg of [-0.9, 0.9]) box(x, cam, { x0: tw.x + leg - 0.08, x1: tw.x + leg + 0.08, z0: tw.z, z1: tw.z + 0.1, h: 1.5 }, T.lamp, { y0: s.h, top: false });
    for (const p of L.roof.planters) box(x, cam, { x0: p.x - 0.7, x1: p.x + 0.7, z0: p.z, z1: p.z + 0.6, h: 0.75 }, T.planter, { y0: s.h });
    const pl = L.roof.pole;
    box(x, cam, { x0: pl.x - 0.06, x1: pl.x + 0.06, z0: pl.z, z1: pl.z + 0.1, h: pl.h }, T.lamp, { y0: s.h, top: false });
    // the cornice + the floor band
    for (const v of [9.9, 3.9]) { const [a, y0] = at(-0.2, v + 0.45), [b, y1] = at(11.4, v); x.fillStyle = rgb(shade(T.speak, 0.18)); x.fillRect(a, y0, b - a, y1 - y0); }
    // the windows: two rows of three (Part 7: rooms you can see into — the cat, the dancers, the plants, the TV)
    for (const [v0, v1] of s.rows) for (const [u0, u1] of s.windows) {
      const [a, y0] = at(u0, v1), [b, y1] = at(u1, v0);
      x.fillStyle = night ? rgb([255, 196, 120]) : rgb(T.glass); x.fillRect(a, y0, b - a, y1 - y0);
      x.fillStyle = rgb(shade(T.speak, 0.25)); x.fillRect(a - 1, y1, b - a + 2, Math.max(1, cam.F * 0.15 / s.z0));
    }
    // the shop window under the awning, the door (unmarked) with its frame, the sconce
    { const [a, y0] = at(6.1, 2.8), [b, y1] = at(8.6, 0.4); x.fillStyle = night ? rgb([255, 214, 150], 0.9) : rgb(T.glass); x.fillRect(a, y0, b - a, y1 - y0); }
    { const d = s.door, [a, y0] = at(d.u0 - 0.2, d.h + 0.25), [b, y1] = at(d.u1 + 0.2, 0); x.fillStyle = rgb(shade(T.speak, -0.35)); x.fillRect(a, y0, b - a, y1 - y0);
      const [c0, y2] = at(d.u0, d.h), [c1] = at(d.u1, 0); x.fillStyle = rgb(T.door); x.fillRect(c0, y2, c1 - c0, y1 - y2); }
    // the awning: from the wall out over the sidewalk
    const aw = s.awning;
    poly(x, cam, [[s.x0 + aw.u0, aw.y0, s.z0], [s.x0 + aw.u1, aw.y0, s.z0], [s.x0 + aw.u1, aw.y1, aw.z], [s.x0 + aw.u0, aw.y1, aw.z]], rgb(T.awning));
    poly(x, cam, [[s.x0 + aw.u0, aw.y1, aw.z], [s.x0 + aw.u1, aw.y1, aw.z], [s.x0 + aw.u1, aw.y1 - 0.45, aw.z], [s.x0 + aw.u0, aw.y1 - 0.45, aw.z]], rgb(shade(T.awning, -0.2)));
  }];
}
