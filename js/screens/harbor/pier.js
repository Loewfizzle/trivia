// CITY 2.0 — THE HARBOR, Part 5: THE PIER (baked with the look) — a timber pier from the far quay (z 230) out over the water to
// z 118, widening into a PLATFORM (the head) where the Ferris wheel stands: its A-frames' feet are on the deck. Far → near: the
// walkway behind the head, the head, the stub in front of it; each with its pilings (round timbers from the water, X braces
// under the deck, the dark underside), the deck's planks (weathered wood by day, darker near the edges), its fascia, the
// railings (posts, a top + a mid rail), the lamp posts (lit per frame: pierLamps + scene.js); on the head the boarding plinth
// under the wheel, the ticket booth with its striped awning, and the wheel's BACK A-frame (the front one is drawn over the
// turning wheel: wheel.js). The pilings' reflections are faint dark streaks in the water under them.
import { box, poly, rgb, shade, mix } from './shapes.js';
import { project } from '../../core/harbor-layout.js';
import { LEVEL } from './water.js';
import { aFrame } from './wheel.js';

/** the pier's lamp posts: { x, y (the globe), z } — lit at night by the scene (a glow + a column in the water) */
export function pierLamps(L) {
  const p = L.pier, h = p.head, out = [];
  for (const [x, z] of [[h.x0 + 0.3, h.z0 + 0.3], [h.x1 - 0.3, h.z0 + 0.3], [h.x0 + 0.3, h.z1 - 0.3], [h.x1 - 0.3, h.z1 - 0.3]]) out.push({ x, y: p.y + 3.1, z });
  for (let z = h.z1 + 12; z < p.z1 - 6; z += 16) out.push({ x: p.x1 - 0.25, y: p.y + 3.1, z });
  return out;
}

export function pierSteps(L, T) {
  const cam = L.cam, p = L.pier, h = p.head, w = L.wheel;
  const day = Math.min(1, T.day + 0.8 * T.gold), night = T.night;
  const wood = mix(mix([132, 108, 84], [118, 82, 74], T.gold / Math.max(0.01, T.day + T.gold)), [30, 24, 36], night);
  const plankA = shade(wood, 0.06), plankB = shade(wood, -0.06), under = shade(wood, -0.55), post = shade(wood, -0.3);
  const rail = mix(mix([44, 40, 46], [56, 40, 48], T.gold), [18, 16, 28], night);
  const P = (x, y, z) => project(cam, x, y, z);
  const lwAt = (z, k) => Math.max(0.35, cam.F / z * k);

  // one stretch of deck (x0..x1, z0..z1): pilings, braces, the deck, its planks, the fascia, the railings
  function stretch(x, s) {
    const { x0, x1, z0, z1 } = s, dy = p.y;
    // the pilings, far first: round timbers in pairs (+ a middle row under the wide head), the X braces between a pair
    const cols = s.head ? [x0 + 0.35, (x0 + x1) / 2, x1 - 0.35] : [x0 + 0.3, x1 - 0.3];
    for (let z = z1 - 1; z >= z0; z -= s.head ? 3 : 4) {
      for (const px of cols) {
        const [a, ya] = P(px - 0.24, dy - 0.45, z), [b, yb] = P(px + 0.24, LEVEL, z);
        x.fillStyle = rgb(post); x.fillRect(a, ya, b - a, yb - ya);
        if (day > 0.1) { x.fillStyle = rgb(shade(post, 0.25)); x.fillRect(a, ya, Math.max(0.3, (b - a) * 0.3), yb - ya); }
        // the waterline: wet, dark timber + weed
        x.fillStyle = rgb(shade(post, -0.45)); x.fillRect(a, yb - Math.max(0.6, (yb - ya) * 0.16), b - a, Math.max(0.6, (yb - ya) * 0.16));
      }
      if (z < 170) {
        x.strokeStyle = rgb(shade(post, -0.15), 0.8); x.lineWidth = lwAt(z, 0.09);
        x.beginPath();
        for (let i = 0; i < cols.length - 1; i++) { const [a, ya] = P(cols[i], dy - 0.5, z), [b, yb] = P(cols[i + 1], LEVEL + 0.3, z), [, yc] = P(0, dy - 0.5, z); x.moveTo(a, ya); x.lineTo(b, yb); x.moveTo(b, yc); x.lineTo(a, yb); }
        x.stroke();
      }
    }
    // the deck's underside shadow (a dark band under the near edge)
    { const [a, ya] = P(x0, dy - 0.45, z0), [b] = P(x1, dy - 0.45, z0); x.fillStyle = rgb(under, 0.9); x.fillRect(a, ya, b - a, Math.max(0.8, cam.F / z0 * 0.35)); }
    // the deck: its top in planks (laid across the pier: strips along z, alternately a little lighter / darker), weathered
    const yTop = dy;
    poly(x, cam, [[x0, yTop, z0], [x1, yTop, z0], [x1, yTop, z1], [x0, yTop, z1]], rgb(wood));
    let k = 0;
    for (let z = z0; z < z1; z += 0.85) {
      const za = z, zb = Math.min(z1, z + 0.85), ya = P(0, yTop, za)[1], yb = P(0, yTop, zb)[1];
      if (ya - yb < 0.45) break;                     // (far: too thin to read — the base colour carries on)
      poly(x, cam, [[x0, yTop, za], [x1, yTop, za], [x1, yTop, zb], [x0, yTop, zb]], rgb(k++ % 2 ? plankA : plankB, 0.55 + 0.1 * Math.sin(z * 3.7)));
      x.strokeStyle = rgb(shade(wood, -0.35), 0.45); x.lineWidth = 0.35;
      const [l0, ly] = P(x0, yTop, za), [r0] = P(x1, yTop, za); x.beginPath(); x.moveTo(l0, ly); x.lineTo(r0, ly); x.stroke();
    }
    // the sun's sheen along the boards by day, the edges darker (worn, damp)
    if (day > 0.1) { const [a, ya] = P(x0, yTop, z0), [b, yb] = P(x1, yTop, z1); const g = x.createLinearGradient(a, 0, b, 0); g.addColorStop(0, `rgba(30,20,20,${0.18 * day})`); g.addColorStop(0.5, `rgba(255,240,220,${0.08 * day})`); g.addColorStop(1, `rgba(30,20,20,${0.18 * day})`); x.fillStyle = g; poly(x, cam, [[x0, yTop, z0], [x1, yTop, z0], [x1, yTop, z1], [x0, yTop, z1]], g); }
    // the fascia board facing us + the deck's sides (the one toward the middle)
    box(x, cam, { x0, x1, z0, z1: z0 + 0.3, h: 0.45 }, shade(wood, -0.18), { y0: dy - 0.45, top: false, light: 1 });
    // the railings: posts + a top rail + a mid rail along both edges (and across the head's far + near edges, an opening
    // where the walkway joins)
    x.strokeStyle = rgb(rail);
    const runs = [[x0 + 0.1, z0, x0 + 0.1, z1], [x1 - 0.1, z0, x1 - 0.1, z1]];
    if (s.head) { runs.push([x0 + 0.1, z0, p.x0 - 0.1, z0], [p.x1 + 0.1, z0, x1 - 0.1, z0]); }
    for (const [ax, az, bx, bz] of runs) {
      for (const yy of [1.1, 0.55]) {
        const [a, ya] = P(ax, dy + yy, az), [b, yb] = P(bx, dy + yy, bz);
        x.lineWidth = lwAt(Math.min(az, bz), yy > 1 ? 0.1 : 0.06); x.beginPath(); x.moveTo(a, ya); x.lineTo(b, yb); x.stroke();
      }
      const n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / 2.4));
      for (let i = 0; i <= n; i++) { const xx = ax + (bx - ax) * i / n, zz = az + (bz - az) * i / n, [a, ya] = P(xx, dy, zz), [, yb] = P(xx, dy + 1.1, zz); x.lineWidth = lwAt(zz, 0.08); x.beginPath(); x.moveTo(a, ya); x.lineTo(a, yb); x.stroke(); }
    }
  }

  return [
    x => {
      // the pilings' reflections: faint dark streaks in the water under the near ones (they ripple in the live water above)
      x.fillStyle = 'rgba(4,4,12,0.28)';
      for (let z = p.z1 - 1; z >= p.z0; z -= 4) for (const px of [p.x0 + 0.3, p.x1 - 0.3]) { const [a, ya] = P(px - 0.22, LEVEL, z), [b] = P(px + 0.22, LEVEL, z); const len = cam.F / z * 1.6; x.fillRect(a, ya, b - a, len); }
      // far → near: the walkway behind the head, the head, the stub in front
      stretch(x, { x0: p.x0, x1: p.x1, z0: h.z1, z1: p.z1 });
    },
    x => {
      stretch(x, { x0: h.x0, x1: h.x1, z0: h.z0, z1: h.z1, head: true });
      // the wheel's BACK A-frame (behind the wheel; the front one is drawn over it every frame)
      const bz = w.z + w.frame, bu = cam.F / bz, [hx, hy] = P(w.x, w.y, bz), [, fd] = P(w.x, p.y, bz);
      const paint = mix(mix([150, 36, 44], [132, 44, 60], T.gold / Math.max(0.01, T.day + T.gold)), [24, 18, 34], night);
      aFrame(x, hx, hy, w.leg * w.r * bu, fd - hy, bu, shade(paint, -0.12), shade(paint, -0.45), shade(paint, 0.2), false);
      // the boarding plinth under the wheel (two steps up to where the gondolas stop) + its rail
      box(x, cam, { x0: w.x - 2.2, x1: w.x + 2.2, z0: w.z - 1.3, z1: w.z + 1.3, h: 0.55 }, shade(wood, -0.08), { y0: p.y, light: 1 });
      box(x, cam, { x0: w.x - 2.9, x1: w.x + 2.9, z0: w.z - 1.9, z1: w.z - 1.3, h: 0.28 }, shade(wood, 0.04), { y0: p.y, light: 1 });
    },
    x => {
      // the ticket booth on the head's near right corner: a little Deco kiosk, its striped awning, a lit window at night
      const bx0 = h.x1 - 2.6, bx1 = h.x1 - 0.8, bz = h.z0 + 0.9, dy = p.y;
      const paint = mix([226, 214, 190], [40, 34, 52], night);
      box(x, cam, { x0: bx0, x1: bx1, z0: bz, z1: bz + 1.6, h: 2.1 }, paint, { y0: dy, light: 1 });
      const [wa, wy] = P(bx0 + 0.35, dy + 1.75, bz), [wb, wy2] = P(bx1 - 0.35, dy + 0.95, bz);
      x.fillStyle = night > 0.4 ? 'rgb(255,204,128)' : rgb(mix([70, 96, 120], [150, 180, 200], day * 0.5)); x.fillRect(wa, wy, wb - wa, wy2 - wy);
      // the striped awning (red + cream), a scalloped edge
      const [aa, ay] = P(bx0 - 0.2, dy + 2.35, bz - 0.4), [ab] = P(bx1 + 0.2, dy + 2.35, bz - 0.4), [, ay2] = P(0, dy + 1.95, bz - 0.4);
      const n = 6, sw = (ab - aa) / n;
      for (let i = 0; i < n; i++) { x.fillStyle = i % 2 ? rgb(mix([236, 226, 206], [60, 50, 60], night)) : rgb(mix([196, 40, 48], [70, 22, 34], night)); x.fillRect(aa + i * sw, ay, sw + 0.1, ay2 - ay); x.beginPath(); x.arc(aa + i * sw + sw / 2, ay2, sw / 2, 0, Math.PI); x.fill(); }
      // the lamp posts (dark iron, a globe on top: lit by the scene at night)
      for (const lp of pierLamps(L)) {
        const [a, ya] = P(lp.x, dy, lp.z), [, yb] = P(lp.x, lp.y - 0.3, lp.z), s = cam.F / lp.z;
        x.strokeStyle = rgb(rail); x.lineWidth = Math.max(0.4, s * 0.1); x.beginPath(); x.moveTo(a, ya); x.lineTo(a, yb); x.stroke();
        x.fillStyle = rgb(rail); x.fillRect(a - s * 0.18, ya - s * 0.25, s * 0.36, s * 0.25);
        x.fillStyle = rgb(mix([236, 232, 220], [70, 60, 70], night)); x.beginPath(); x.arc(a, yb - s * 0.22, Math.max(0.6, s * 0.26), 0, Math.PI * 2); x.fill();
      }
      // the stub in front of the head (the pier's near end) + its end rail
      stretch(x, { x0: p.x0, x1: p.x1, z0: p.z0, z1: h.z0 });
      const [ea, ey] = P(p.x0 + 0.1, p.y + 1.1, p.z0), [eb] = P(p.x1 - 0.1, p.y + 1.1, p.z0);
      x.strokeStyle = rgb(rail); x.lineWidth = lwAt(p.z0, 0.1); x.beginPath(); x.moveTo(ea, ey); x.lineTo(eb, ey); x.stroke();
    },
  ];
}
