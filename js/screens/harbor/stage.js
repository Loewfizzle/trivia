// CITY 2.0 — THE HARBOR: the promenade nearest us (z 30–54) — the near STAGE where life happens: the paving, lamp + tree pairs
// (with trees at both front corners), a bench, planters, the seasonal vendor cart, and the people. Part 1: placeholders at
// the SIZE rules (people ~20 pt, lamps ~50 pt, canopies ~40 pt); the people are drawn every frame (they will walk), the rest
// is baked. At night the lamps' light is drawn every frame (rich light on the promenade — the mockup's was too dark).
import { project, groundY } from '../../core/harbor-layout.js';
import { box, person, rgb, shade } from './shapes.js';

export function promenadeSteps(L, T) {
  const cam = L.cam, p = L.prom;
  return [x => {
    const y0 = groundY(cam, p.z1);
    x.fillStyle = rgb(T.prom); x.fillRect(0, y0, cam.W, cam.H - y0);
    // the paving: lines toward the water and across (a grey box that reads as a floor in perspective)
    x.strokeStyle = rgb(T.promLine); x.lineWidth = 0.6;
    x.beginPath();
    const hw = cam.hw(p.z0) * 1.2;
    for (let wx = -Math.ceil(hw / 2.4) * 2.4; wx <= hw; wx += 2.4) { const [a, ya] = project(cam, wx, 0, p.z1), [b, yb] = project(cam, wx, 0, 24); x.moveTo(a, ya); x.lineTo(b, yb); }
    for (let z = 26; z <= p.z1; z += 2.4) { const y = groundY(cam, z); x.moveTo(0, y); x.lineTo(cam.W, y); }
    x.stroke();
  }];
}

const tree = (x, cam, t, T) => {
  box(x, cam, { x0: t.x - 0.12, x1: t.x + 0.12, z0: t.z, z1: t.z + 0.2, h: t.trunk + t.r * 0.4 }, T.trunk, { top: false });
  const [cx, cy] = project(cam, t.x, t.trunk + t.r * 0.9, t.z), r = cam.F * t.r / t.z;
  x.fillStyle = rgb(T.canopy); x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
  x.fillStyle = rgb(shade(T.canopy, 0.15)); x.beginPath(); x.arc(cx - r * 0.3, cy - r * 0.3, r * 0.5, 0, Math.PI * 2); x.fill();
};
const lamp = (x, cam, l, T) => {
  box(x, cam, { x0: l.x - 0.08, x1: l.x + 0.08, z0: l.z, z1: l.z + 0.1, h: l.h }, T.lamp, { top: false });
  const [a, y] = project(cam, l.x, l.h, l.z), [b] = project(cam, l.x + l.dir * 0.9, l.h, l.z), s = cam.F / l.z;
  x.fillStyle = rgb(T.lamp); x.fillRect(Math.min(a, b), y, Math.abs(b - a), Math.max(1, s * 0.08));
  x.beginPath(); x.roundRect(b - s * 0.22, y, s * 0.44, s * 0.36, s * 0.1); x.fill();
  l.head = { x: b, y: y + s * 0.3, s };
};

/** the stage's still pieces, far first: lamps + trees at z 47, the bench, the planters, the near lamp, the corner trees, the cart
 *  (PART 7a: keep(item) picks a share by depth — the scene bakes the ones behind / beside the speakeasy into 'stage' and the front
 *  row into 'front', over the speakeasy's live layer) */
export function furnitureSteps(L, T, keep = null) {
  const cam = L.cam;
  const items = [
    ...L.lamps.map(l => ({ z: l.z, f: x => lamp(x, cam, l, T) })),
    ...L.trees.map(t => ({ z: t.z, f: x => tree(x, cam, t, T) })),
    ...[L.bench, ...(L.bench.more || [])].map(b => ({ z: b.z, f: x => { box(x, cam, { x0: b.x - b.w / 2, x1: b.x + b.w / 2, z0: b.z, z1: b.z + 0.5, h: 0.12 }, T.bench, { y0: 0.45 }); box(x, cam, { x0: b.x - b.w / 2, x1: b.x + b.w / 2, z0: b.z + 0.5, z1: b.z + 0.6, h: 0.5 }, shade(T.bench, -0.1), { y0: 0.45, top: false }); for (const s of [-1, 1]) box(x, cam, { x0: b.x + s * b.w * 0.42 - 0.05, x1: b.x + s * b.w * 0.42 + 0.05, z0: b.z, z1: b.z + 0.1, h: 0.45 }, T.lamp, { top: false }); } })),
    ...L.planters.map(p => ({ z: p.z, f: x => { box(x, cam, { x0: p.x - 0.7, x1: p.x + 0.7, z0: p.z, z1: p.z + 1.2, h: 0.9 }, T.planter); const [cx, cy] = project(cam, p.x, 1.1, p.z); x.fillStyle = rgb(shade(T.canopy, -0.1)); x.beginPath(); x.ellipse(cx, cy, cam.F * 0.7 / p.z, cam.F * 0.3 / p.z, 0, 0, Math.PI * 2); x.fill(); } })),
    { z: L.cart.z, f: x => { const c = L.cart; box(x, cam, { x0: c.x - 1.2, x1: c.x + 1.2, z0: c.z, z1: c.z + 1, h: 1.05 }, T.cart, { y0: 0.7 }); for (const s of [-0.8, 0.8]) { const [wx, wy] = project(cam, c.x + s, 0.45, c.z); x.fillStyle = '#121218'; x.beginPath(); x.arc(wx, wy, cam.F * 0.45 / c.z, 0, Math.PI * 2); x.fill(); } box(x, cam, { x0: c.x + 0.65, x1: c.x + 0.75, z0: c.z + 0.4, z1: c.z + 0.5, h: 1.6 }, T.lamp, { y0: 1.9, top: false }); const [ux, uy] = project(cam, c.x + 0.7, 3.5, c.z + 0.45), ur = cam.F * 1.5 / c.z; x.fillStyle = rgb(shade(T.awning, 0.1)); x.beginPath(); x.ellipse(ux, uy, ur, ur * 0.32, 0, Math.PI, 0); x.fill(); } },
  ].filter(it => !keep || keep(it)).sort((a, b) => b.z - a.z);
  const steps = [];
  for (let i = 0; i < items.length; i += 4) { const part = items.slice(i, i + 4); steps.push(x => { for (const it of part) it.f(x); }); }
  return steps;
}

const COATS = [[200, 50, 62], [60, 74, 106], [60, 122, 90], [224, 168, 58], [138, 79, 168], [42, 42, 54], [200, 66, 58], [30, 30, 40]];
/** the people, far first (drawn every frame: Part 8 walks them; nobody under the dock) */
export function drawPeople(c, L, T) {
  const cam = L.cam, night = T.night > 0.5;
  [...L.people].sort((a, b) => b.z - a.z).forEach((p, i) => {
    const col = night ? shade(COATS[i % COATS.length], -0.55) : COATS[i % COATS.length];
    person(c, cam, p, col, { hat: shade(col, -0.4), rim: night ? Object.assign([255, 210, 150], { side: p.x < 0 ? 1 : -1 }) : null });
  });
}

/** the lamps' light at night: a halo at the head and a pool on the paving (sprites from the scene) */
export function drawLampLight(c, L, k, glow) {
  if (k < 0.02) return;
  const cam = L.cam;
  c.globalCompositeOperation = 'lighter';
  for (const l of L.lamps) {
    if (!l.head) continue;
    const [px, py] = project(cam, l.x + l.dir * 0.9, 0, l.z), s = l.head.s;
    c.globalAlpha = 0.6 * k; const r = s * 3.6; c.drawImage(glow, l.head.x - r, l.head.y - r, r * 2, r * 2);
    // the pool on the paving: a wide soft wash and a brighter core under the head (the promenade reads warm and lit at night)
    c.save(); c.translate(px, py); c.scale(1, 0.34);
    c.globalAlpha = 0.34 * k; const wr = s * 9; c.drawImage(glow, -wr, -wr, wr * 2, wr * 2);
    c.globalAlpha = 0.5 * k; const pr = s * 4.4; c.drawImage(glow, -pr, -pr, pr * 2, pr * 2);
    c.restore();
  }
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}
