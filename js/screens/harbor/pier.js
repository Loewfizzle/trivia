// CITY 2.0 — THE HARBOR: the pier on the left (reaching out from the far bank, z 140–230) and the Ferris wheel on it.
// Part 1: the deck, its pilings and lamps, the wheel as a circle with spokes and gondolas. Part 5 crafts both (bulbs, the
// turning wheel, its light on the water).
import { box, rgb, shade } from './shapes.js';
import { project } from '../../core/harbor-layout.js';

export function pierSteps(L, T) {
  const cam = L.cam, p = L.pier, w = L.wheel;
  return [
    x => {
      // the pilings (from the waterline up: the water is drawn under them), far first
      for (let z = p.z1 - 2; z >= p.z0; z -= 5) for (const px of [p.x0 + 0.3, p.x1 - 0.3]) box(x, cam, { x0: px - 0.25, x1: px + 0.25, z0: z, z1: z + 0.5, h: p.y - 0.2 }, shade(T.pier, -0.35), { y0: 0, top: false });
      // the deck: its top (planks), and its edge facing us
      box(x, cam, { x0: p.x0, x1: p.x1, z0: p.z0, z1: p.z1, h: 0.45 }, T.pier, { y0: p.y - 0.45, light: 1 });
      x.strokeStyle = rgb(shade(T.pier, -0.22), 0.6); x.lineWidth = 0.5;
      for (let z = p.z0 + 2; z < p.z1; z += 2.4) { const [a, ya] = project(cam, p.x0, p.y, z), [b, yb] = project(cam, p.x1, p.y, z); x.beginPath(); x.moveTo(a, ya); x.lineTo(b, yb); x.stroke(); }
      // the railing along both edges: posts and a top rail
      for (const px of [p.x0 + 0.1, p.x1 - 0.1]) {
        const [a0, y0] = project(cam, px, p.y + 1.1, p.z0), [a1, y1] = project(cam, px, p.y + 1.1, p.z1);
        x.strokeStyle = rgb(shade(T.pier, -0.4)); x.lineWidth = Math.max(0.5, cam.F / p.z0 * 0.12);
        x.beginPath(); x.moveTo(a0, y0); x.lineTo(a1, y1); x.stroke();
        for (let z = p.z0; z < p.z1; z += 3) { const [b0, c0] = project(cam, px, p.y, z), [, c1] = project(cam, px, p.y + 1.1, z); x.lineWidth = Math.max(0.4, cam.F / z * 0.08); x.beginPath(); x.moveTo(b0, c0); x.lineTo(b0, c1); x.stroke(); }
      }
      // its lamps (Part 5 lights them)
      for (let z = p.z0 + 4; z < p.z1 - 4; z += 9) box(x, cam, { x0: p.x1 - 0.35, x1: p.x1 - 0.15, z0: z, z1: z + 0.2, h: 5 }, shade(T.pier, -0.45), { y0: p.y, top: false });
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
      for (const s of [-1, 1]) { x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + s * r * w.leg, deckY); x.stroke(); }
      x.fillStyle = rgb(shade(T.pier, -0.3)); x.fillRect(cx - r * (w.leg + 0.08), deckY - 1, r * (w.leg + 0.08) * 2, 2);   // the A-frame's footing on the deck
      x.fillStyle = rgb(shade(T.wheel, 0.2));
      for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2 + 0.17, gx = cx + Math.cos(a) * r, gy = cy + Math.sin(a) * r; x.fillRect(gx - r * 0.03, gy, r * 0.06, r * 0.055); }
    },
  ];
}
