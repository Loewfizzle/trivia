// CITY 2.0 — THE HARBOR: the boats — the riverboat "Rosie" with her bulbs, a water taxi, a tug at night, sailboats by day.
// Part 1: simple shapes at their final places and sizes, drawn every frame (they will move: Part 5 crafts and sails them).
import { project } from '../../core/harbor-layout.js';
import { rgb, shade } from './shapes.js';

export function drawBoats(c, L, T) {
  const cam = L.cam, night = T.night > 0.5;
  for (const b of [...L.boats].sort((a, d) => d.z - a.z)) {
    if (b.when === 'night' && !night) continue;
    if (b.when === 'day' && night) continue;
    const s = cam.F / b.z;
    const [x0, yw] = project(cam, b.x - b.len / 2, 0, b.z), [x1] = project(cam, b.x + b.len / 2, 0, b.z);
    const w = x1 - x0;
    if (b.id.startsWith('sail')) {
      c.fillStyle = rgb(T.boat); c.beginPath(); c.moveTo(x0 + w * 0.1, yw); c.lineTo(x1, yw - s * 0.2); c.lineTo(x1 - w * 0.12, yw + s * 0.6); c.lineTo(x0 + w * 0.2, yw + s * 0.6); c.fill();
      c.beginPath(); c.moveTo(x0 + w * 0.5, yw - s * 0.2); c.lineTo(x0 + w * 0.5, yw - s * b.h); c.lineTo(x0 + w * 0.92, yw - s * 0.5); c.closePath(); c.fill();
      continue;
    }
    // hull
    c.fillStyle = rgb(b.id === 'rosie' ? T.boat : b.id === 'taxi' ? [232, 198, 74] : shade(T.boatHull, -0.2));
    c.beginPath(); c.moveTo(x0, yw - s * (b.id === 'rosie' ? 3.6 : 1.2)); c.lineTo(x1, yw - s * (b.id === 'rosie' ? 2.6 : 1.0)); c.lineTo(x1 - w * 0.03, yw + s * 0.2); c.lineTo(x0 + w * 0.06, yw + s * 0.2); c.fill();
    c.fillStyle = rgb(T.boatHull); c.fillRect(x0 + w * 0.05, yw - s * 0.6, w * 0.92, s * 0.6);
    if (b.id === 'rosie') {
      // two decks, the pilot house, the stack (Part 5: windows, railings, lifebuoys, the bulbs from staff to stack to staff)
      const deck = (u0, u1, y0, y1, col) => { const [a, ya] = project(cam, b.x - b.len / 2 + u0, y1, b.z), [d, yd] = project(cam, b.x - b.len / 2 + u1, y0, b.z); c.fillStyle = rgb(col); c.fillRect(a, ya, d - a, yd - ya); };
      deck(4.5, 24, 2.6, 4.9, shade(T.boat, -0.06)); deck(7.5, 20, 4.9, 6.9, T.boat); deck(8.1, 10.1, 6.9, 8.4, shade(T.boat, -0.1)); deck(16.9, 18.1, 6.9, 11, T.boatHull);
      if (night) { c.fillStyle = rgb([255, 214, 140]); for (let i = 0; i < 12; i++) { const [a, y] = project(cam, b.x - b.len / 2 + 5.4 + i * 1.55, 3.4, b.z); c.fillRect(a, y, s * 0.6, s * 0.8); } }
    } else {
      const [a, ya] = project(cam, b.x - b.len * 0.2, b.h, b.z), [d, yd] = project(cam, b.x + b.len * 0.2, 1, b.z);
      c.fillStyle = rgb(shade(T.boat, -0.1)); c.fillRect(a, ya, d - a, yd - ya);
    }
  }
}
