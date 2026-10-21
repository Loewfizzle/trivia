// CITY 2.0 — THE HARBOR: the pier on the left (reaching out from the far bank, z 140–230) and the Ferris wheel on it.
// Part 1: the deck, its pilings and lamps, the wheel as a circle with spokes and gondolas. Part 5 crafts both (bulbs, the
// turning wheel, its light on the water).
import { box, rgb, shade } from './shapes.js';
import { project } from '../../core/harbor-layout.js';

export function pierSteps(L, T) {
  const cam = L.cam, p = L.pier, w = L.wheel;
  return [
    x => {
      // the deck: its top, and the side facing us
      box(x, cam, { x0: p.x0, x1: p.x1, z0: p.z0, z1: p.z1, h: 0.5 }, T.pier, { y0: p.y - 0.5, light: 1 });
      for (let z = p.z0 + 4; z < p.z1; z += 6) box(x, cam, { x0: p.x1 - 0.5, x1: p.x1 - 0.1, z0: z, z1: z + 0.4, h: p.y + 3 }, shade(T.pier, -0.3), { y0: -3, top: false });
      for (let z = p.z0 + 4; z < p.z1 - 4; z += 9) box(x, cam, { x0: p.x1 - 1.1, x1: p.x1 - 0.9, z0: z, z1: z + 0.2, h: 6 }, shade(T.pier, -0.45), { y0: p.y, top: false });
    },
    x => {
      const [cx, cy] = project(cam, w.x, w.y, w.z), r = cam.F * w.r / w.z;
      x.strokeStyle = rgb(T.wheel); x.lineWidth = Math.max(1, r * 0.035);
      x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.stroke();
      x.lineWidth = Math.max(0.6, r * 0.012);
      x.beginPath(); x.arc(cx, cy, r * 0.93, 0, Math.PI * 2); x.stroke();
      for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); x.stroke(); }
      // the legs down to the deck, the gondolas
      const [, deckY] = project(cam, w.x, p.y, w.z);
      x.lineWidth = Math.max(1, r * 0.03);
      for (const s of [-1, 1]) { x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + s * r * 0.42, deckY); x.stroke(); }
      x.fillStyle = rgb(shade(T.wheel, 0.2));
      for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2 + 0.17, gx = cx + Math.cos(a) * r, gy = cy + Math.sin(a) * r; x.fillRect(gx - r * 0.03, gy, r * 0.06, r * 0.055); }
    },
  ];
}
