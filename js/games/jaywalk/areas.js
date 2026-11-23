// JAYWALK — THE AREAS' LOOK (H5A — docs/jaywalk.md "THE AREAS"): a WHOLE STRETCH looks like the place. A VIEW: it reads the course
// The long notes: docs/games/jaywalk-notes.md
import * as THREE from 'three';
import { COLS, STRETCH } from './tuning.js';
import { area } from './course.js';
import { build, roundBox } from './models.js';

const ball = (r, w = 10, h = 8) => new THREE.SphereGeometry(r, w, h);
const cyl = (a, b, h, n = 12) => new THREE.CylinderGeometry(a, b, h, n);
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const by = k => y => k[0] + y * k[1];

/** … */
export const LOOKS = Object.freeze([
  { id: 'docks', accent: 0xfff1dc, paint: 0x8a5a2b, hero: ['crane', 'boat'], sky: '#e6cfa8', lamp: 0xffc27a, lampEvery: 4, obs: ['bollard', 'crate', 'crate', 'drum'], edge: ['crate', 'container', 'bollard', 'crate', 'drum'], edgeP: 0.85,
    sig: [['crane', 8], ['boat', 17], ['boat', 28], ['crane', 37], ['boat', 45]] },
  { id: 'fish', accent: 0xff7a4a, paint: 0xd9542b, hero: ['fish', 'boat'], sky: '#ff8a4a', lamp: 0xffd9a0, lampEvery: 4, obs: ['icecrate', 'icecrate', 'crate', 'drum'], edge: ['stall', 'icecrate', 'stall', 'crate'], edgeP: 0.9,
    sig: [['fish', 6], ['boat', 14], ['fish', 22], ['boat', 31], ['fish', 39], ['boat', 46]] },
  { id: 'yard', accent: 0xffb020, paint: 0xb9770c, hero: ['stack', 'stack'], sky: '#ffb020', lamp: 0xffb060, lampEvery: 5, obs: ['drum', 'crate', 'barricade', 'drum'], edge: ['container', 'container', 'drum', 'container'], edgeP: 0.9, gantry: true, sig: [] },
  { id: 'bridge', accent: 0xff4a5a, paint: 0xc93a3a, hero: ['pylons'], sky: '#ff4a5a', lamp: 0xfff0c8, lampEvery: 2, obs: ['barricade', 'traffic-cone', 'barricade', 'drum'], edge: ['rail', 'rail'], edgeP: 1,
    sig: [['pylons', 6], ['pylons', 15], ['pylons', 24], ['pylons', 33], ['pylons', 42]] },
  { id: 'downtown', accent: 0xff3fb4, paint: 0xc02a86, hero: ['block', 'block'], sky: '#ff3fb4', lamp: 0xffe0b0, lampEvery: 3, obs: ['hydrant', 'bush-planter', 'trash-dumpster', 'traffic-cone'], edge: ['shop', 'shop', 'shop', 'hydrant'], edgeP: 1, sig: [] },
  { id: 'canal', accent: 0x7dffb0, paint: 0x23875a, hero: ['row', 'boat'], sky: '#3fd9a0', lamp: 0xffc890, lampEvery: 4, obs: ['bollard', 'bush-planter', 'tree', 'bollard'], edge: ['house', 'tree', 'house', 'bollard'], edgeP: 0.85, tufts: true, footbridge: true,
    sig: [['boat', 9], ['boat', 21], ['boat', 33], ['boat', 44]] },
  { id: 'lighthouse', accent: 0xfff0a0, paint: 0xb58a12, hero: ['lighthouse', 'boat'], sky: '#ffe9a0', lamp: 0xffe9b0, lampEvery: 7, obs: ['rock', 'rock', 'rock', 'tree'], edge: ['rock', 'rock', 'tree'], edgeP: 0.8, tufts: true,
    sig: [['boat', 8], ['lighthouse', 22], ['boat', 37]] },
  { id: 'airfield', accent: 0xc8ff4a, paint: 0x5c8a12, hero: ['tower', 'hangar'], sky: '#a8e03a', lamp: 0xfff0d8, lampEvery: 5, obs: ['traffic-cone', 'barricade', 'drum', 'traffic-cone'], edge: ['traffic-cone', 'drum'], edgeP: 0.35,
    sig: [['tower', 9], ['hangar', 19], ['hangar', 29], ['tower', 38], ['hangar', 45]] },
]);
export const lookAt = lane => { const a = area(lane); return a.index < 0 ? null : LOOKS[a.index]; };

// ---- THE PIECES, built in code (y up, standing on y = 0, centred on their own foot)
export function buildAreaGeo() {
  const G = {};
  // a mooring BOLLARD: an iron post with its round cap, a rope coiled at its foot
  G.bollard = build([
    { g: cyl(0.15, 0.2, 0.5), color: 0x57504c, at: [0, 0.25, 0], shade: by([0.7, 0.9]) },
    { g: ball(0.23, 12, 8), color: 0x80766c, at: [0, 0.52, 0], scale: [1, 0.55, 1] },
    { g: new THREE.TorusGeometry(0.27, 0.07, 6, 14), color: 0xd8b070, at: [0, 0.08, 0], rot: [Math.PI / 2, 0, 0] },
    { g: new THREE.TorusGeometry(0.2, 0.06, 6, 12), color: 0xc49a5c, at: [0, 0.2, 0], rot: [Math.PI / 2, 0, 0] },
  ]);
  // a wooden CRATE: slatted, banded
  G.crate = build([
    { g: roundBox(0.74, 0.66, 0.74, 0.03, 2), color: 0xb88346, at: [0, 0.33, 0], shade: by([0.72, 0.6]) },
    { g: roundBox(0.78, 0.1, 0.78, 0.02, 1), color: 0x7a5026, at: [0, 0.12, 0] },
    { g: roundBox(0.78, 0.1, 0.78, 0.02, 1), color: 0x7a5026, at: [0, 0.56, 0] },
    { g: roundBox(0.1, 0.68, 0.78, 0.02, 1), color: 0x8c5c2c, at: [-0.33, 0.34, 0] },
    { g: roundBox(0.1, 0.68, 0.78, 0.02, 1), color: 0x8c5c2c, at: [0.33, 0.34, 0] },
    { g: roundBox(0.6, 0.03, 0.09, 0.01, 1), color: 0x8c5c2c, at: [0, 0.67, 0], rot: [0, 0.78, 0] },
  ]);
  // an ICE CRATE: a white fish box heaped with ice, two fish on top
  G.icecrate = build([
    { g: roundBox(0.82, 0.42, 0.62, 0.05, 2), color: 0xe9eef6, at: [0, 0.21, 0], shade: by([0.72, 0.9]) },
    { g: roundBox(0.72, 0.16, 0.52, 0.07, 2), color: 0xf4f6f4, at: [0, 0.46, 0] },
    { g: ball(0.16), color: 0xff8a5a, at: [-0.13, 0.56, 0.03], scale: [1.5, 0.35, 0.6], rot: [0, 0.5, 0] },
    { g: ball(0.14), color: 0xc9cdd0, at: [0.17, 0.56, -0.06], scale: [1.5, 0.35, 0.6], rot: [0, -0.4, 0] },
  ]);
  // an oil DRUM (H5C — the owner: NEVER BLUE (blue on the ground = water) + smaller): built WHITE — an instance's colour paints it red / …
  G.drum = build([
    { g: cyl(0.27, 0.27, 0.66, 16), color: 0xffffff, at: [0, 0.33, 0], shade: by([0.66, 0.6]) },
    { g: cyl(0.287, 0.287, 0.05, 16), color: 0xb9b2aa, at: [0, 0.2, 0] },
    { g: cyl(0.287, 0.287, 0.05, 16), color: 0xb9b2aa, at: [0, 0.46, 0] },
    { g: cyl(0.283, 0.283, 0.035, 16), color: 0xd8d2ca, at: [0, 0.645, 0] },
    { g: cyl(0.235, 0.235, 0.03, 14), color: 0x4a4440, at: [0, 0.668, 0] },
    { g: cyl(0.045, 0.045, 0.04, 8), color: 0x8a8480, at: [0.12, 0.69, 0.05] },
    { g: roundBox(0.2, 0.15, 0.03, 0.012, 1), color: 0x8a5a44, at: [0.09, 0.1, 0.262], rot: [0, 0.34, 0] },
    { g: roundBox(0.13, 0.09, 0.03, 0.012, 1), color: 0x9a6a50, at: [-0.2, 0.31, 0.19], rot: [0, -0.82, 0] },
    { g: roundBox(0.11, 0.2, 0.03, 0.012, 1), color: 0xfff6ea, at: [-0.06, 0.36, 0.268], rot: [0, -0.2, 0.15] },
  ]);
  // a ROCK: two soft boulders
  G.rock = build([
    { g: new THREE.IcosahedronGeometry(0.42, 1), color: 0x6b7284, at: [0, 0.26, 0], scale: [1.1, 0.72, 0.95], shade: by([0.6, 1.1]) },
    { g: new THREE.IcosahedronGeometry(0.24, 1), color: 0x596072, at: [0.3, 0.15, 0.16], scale: [1, 0.7, 1], shade: by([0.6, 1.4]) },
  ]);
  // a fire HYDRANT
  G.hydrant = build([
    { g: cyl(0.13, 0.16, 0.44), color: 0xe8413c, at: [0, 0.22, 0], shade: by([0.7, 1.0]) },
    { g: ball(0.15), color: 0xf05a50, at: [0, 0.46, 0], scale: [1, 0.7, 1] },
    { g: cyl(0.06, 0.06, 0.42, 8), color: 0xc22e2c, at: [0, 0.3, 0], rot: [0, 0, Math.PI / 2] },
    { g: cyl(0.19, 0.19, 0.05), color: 0xb82a2a, at: [0, 0.03, 0] },
  ]);
  // a freight CONTAINER (white: an instance's colour paints it) — 2.3 long along x, ribbed sides, its doors at one end
  const ribs = [];
  for (let k = 0; k < 9; k++) ribs.push({ g: box(0.07, 0.8, 0.9), color: 0xb9b9b9, at: [-1.0 + k * 0.25, 0.47, 0] });
  G.container = build([{ g: roundBox(2.3, 0.94, 0.86, 0.03, 1), color: 0xe6e6e6, at: [0, 0.47, 0], shade: by([0.74, 0.5]) }, ...ribs, { g: box(0.04, 0.8, 0.7), color: 0x8a8a8a, at: [1.15, 0.47, 0] }]);
  // a market STALL: a counter heaped with ice under a striped awning on four posts — 1.6 wide
  const stripes = [];
  for (let k = 0; k < 6; k++) stripes.push({ g: roundBox(0.28, 0.05, 1.05, 0.02, 1), color: k % 2 ? 0xf4f4f8 : 0xff5a4a, at: [-0.7 + k * 0.28, 1.0, 0.02], rot: [0.26, 0, 0] });
  G.stall = build([
    ...[[-0.78, -0.4], [0.78, -0.4], [-0.78, 0.42], [0.78, 0.42]].map(([x, z]) => ({ g: box(0.06, z < 0 ? 1.12 : 0.88, 0.06), color: 0x39394a, at: [x, z < 0 ? 0.56 : 0.44, z] })),
    ...stripes,
    { g: roundBox(1.5, 0.44, 0.5, 0.04, 1), color: 0x8a5a33, at: [0, 0.22, 0.05], shade: by([0.75, 0.8]) },
    { g: roundBox(1.4, 0.1, 0.42, 0.04, 1), color: 0xf4f6f4, at: [0, 0.48, 0.05] },
  ]);
  // a bridge RAILING post + rail (a piece along z — 1 lane deep)
  G.rail = build([
    { g: box(0.08, 0.62, 0.08), color: 0xb9422e, at: [0, 0.31, -0.42] }, { g: box(0.08, 0.62, 0.08), color: 0xb9422e, at: [0, 0.31, 0.42] },
    { g: box(0.06, 0.06, 1.0), color: 0xd05038, at: [0, 0.6, 0] }, { g: box(0.05, 0.05, 1.0), color: 0x8c3222, at: [0, 0.32, 0] },
  ]);
  // THE DOCK CRANE: a portal on four legs, its machine house, a boom reaching toward the water (+x), a container on its cable
  const leg = (x, z) => ({ g: box(0.2, 3.1, 0.2), color: 0xf0a81e, at: [x, 1.55, z], shade: by([0.72, 0.1]) });
  G.crane = build([
    leg(-0.75, -0.9), leg(0.75, -0.9), leg(-0.75, 0.9), leg(0.75, 0.9),
    { g: box(1.7, 0.16, 0.16), color: 0xd89214, at: [0, 1.5, -0.9] }, { g: box(1.7, 0.16, 0.16), color: 0xd89214, at: [0, 1.5, 0.9] },
    { g: box(0.16, 0.16, 1.9), color: 0xd89214, at: [-0.75, 3.0, 0] }, { g: box(0.16, 0.16, 1.9), color: 0xd89214, at: [0.75, 3.0, 0] },
    { g: roundBox(1.3, 0.7, 1.1, 0.06, 1), color: 0xe4e8f2, at: [-0.2, 3.5, 0], shade: by([0.4, 0.16]) },
    { g: box(3.9, 0.22, 0.3), color: 0xf0a81e, at: [0.55, 3.2, 0] },
    { g: box(0.12, 0.9, 0.12), color: 0xd89214, at: [-0.6, 4.3, 0] }, { g: box(2.7, 0.06, 0.06), color: 0x8a6a1a, at: [0.7, 4.05, 0], rot: [0, 0, -0.32] },
    { g: box(0.05, 1.3, 0.05), color: 0x2a2a34, at: [2.1, 2.5, 0] },
    { g: roundBox(1.0, 0.44, 0.5, 0.03, 1), color: 0xd8472f, at: [2.1, 1.66, 0], shade: by([0.2, 0.45]) },
  ]);
  // THE CONTROL TOWER: a pale shaft, its wide glass cab, the roof, an antenna
  G.tower = build([
    { g: roundBox(0.8, 2.5, 0.8, 0.08, 1), color: 0xd6dcea, at: [0, 1.25, 0], shade: by([0.62, 0.14]) },
    { g: cyl(0.95, 0.66, 0.66, 8), color: 0x1e3350, at: [0, 2.83, 0] },
    { g: cyl(1.02, 1.02, 0.1, 8), color: 0xe4e8f2, at: [0, 3.2, 0] },
    { g: cyl(0.7, 0.7, 0.08, 8), color: 0xbfc6d8, at: [0, 2.48, 0] },
    { g: cyl(0.03, 0.03, 0.9, 6), color: 0xd0d0d8, at: [0.2, 3.7, 0] },
  ]);
  // THE HANGAR: an arched shell on a ground lane, its dark doorway + the stripe over it toward the camera (+z)
  G.hangar = build([
    { g: new THREE.SphereGeometry(1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), color: 0x9aa4bc, at: [0, 0, 0], scale: [1.0, 0.86, 0.47], shade: by([0.62, 0.5]) },
    { g: roundBox(1.25, 0.58, 0.06, 0.03, 1), color: 0x141a2a, at: [0, 0.29, 0.44] },
    { g: roundBox(1.4, 0.08, 0.07, 0.02, 1), color: 0xffc83a, at: [0, 0.64, 0.42] },
  ]);
  // a bridge PYLON: two tall legs joined by two cross beams (the bridge's red)
  G.pylon = build([
    { g: box(0.26, 4.4, 0.26), color: 0xd04a34, at: [0, 2.2, -0.34], shade: by([0.66, 0.08]) }, { g: box(0.26, 4.4, 0.26), color: 0xd04a34, at: [0, 2.2, 0.34], shade: by([0.66, 0.08]) },
    { g: box(0.2, 0.26, 0.9), color: 0xb03a28, at: [0, 4.2, 0] }, { g: box(0.2, 0.2, 0.9), color: 0xb03a28, at: [0, 2.6, 0] },
  ]);
  // a HOUSE (white: an instance's colour paints it): a storefront / a canal house — 1.8 wide, 2 tall, a flat roof with its parapet, …
  G.house = build([
    { g: roundBox(1.8, 2.0, 1.0, 0.05, 1), color: 0xe2e2e8, at: [0, 1.0, 0], shade: by([0.55, 0.24]) },
    { g: box(1.9, 0.1, 1.08), color: 0x77777f, at: [0, 2.04, 0] },
    { g: roundBox(0.34, 0.07, 0.9, 0.02, 1), color: 0xffffff, at: [1.02, 0.86, 0], rot: [0, 0, -0.3] },
    { g: box(0.05, 0.6, 0.5), color: 0x24242c, at: [0.91, 0.36, 0] },
  ]);
  // an arched stone FOOTBRIDGE over a water lane (along z): the logs drift under it
  const arch = [];
  for (let k = -4; k <= 4; k++) { const t = k / 4, y = 0.92 - t * t * 0.5; arch.push({ g: roundBox(0.62, 0.12, 0.2, 0.03, 1), color: 0x9a9cb0, at: [0, y, t * 0.66], rot: [t * 0.72, 0, 0] }, { g: box(0.05, 0.2, 0.05), color: 0x6c6e84, at: [-0.28, y + 0.16, t * 0.66] }, { g: box(0.05, 0.2, 0.05), color: 0x6c6e84, at: [0.28, y + 0.16, t * 0.66] }); }
  G.footbridge = build([...arch, { g: roundBox(0.7, 0.5, 0.16, 0.03, 1), color: 0x7e8096, at: [0, 0.25, -0.72] }, { g: roundBox(0.7, 0.5, 0.16, 0.03, 1), color: 0x7e8096, at: [0, 0.25, 0.72] }]);
  return G;
}
/** each small built piece (an obstacle on a play cell / the edge dressing): its size on the lane (× the model) + its blob shadow [wide, deep] */
export const PIECE = Object.freeze({
  bollard: [1.25, [0.85, 0.7]], crate: [1.02, [1.0, 0.9]], icecrate: [0.98, [1.05, 0.8]], drum: [0.84, [0.62, 0.54]], rock: [1.12, [1.2, 0.95]], hydrant: [1.35, [0.7, 0.6]],
});
const CONTAINER_HEX = [0xd8472f, 0xb5522f, 0x3ea86a, 0xe8a02a, 0x8a5fd0, 0xd8d8e0];
const HOUSE_HEX = [0xd87a9a, 0xe6d08a, 0xe0b46a, 0x8fd0a8, 0xb08ae0, 0xe08a6a];
const SIGN_HEX = [0xff3fb4, 0x22e0ff, 0xffe04a, 0x7dffb0, 0xff7a4a, 0xa05bff];
/** the edge pieces that take the whole edge column (a lamp never shares it; the scene lays them through drawBig) */
const BIG = { container: 1, stall: 1, shop: 1, house: 1, rail: 1 };

/** … */
export function dressLane(d, T, i, L, h) {
  for (let c = 0; c < COLS; c++) if (L.obs[c]) d.obs.push({ c, k: T.obs[Math.floor(h(c * 17 + 3, 1) * T.obs.length) % T.obs.length], s: h(c * 29 + 11, 2), ry: (h(c + 71, 3) - 0.5) * 0.9, dx: 0, dz: 0, r: 0 });
  if (L.mark) return;
  for (const c of [-1, COLS]) {
    if (h(c * 13 + 5, 4) >= T.edgeP) continue;
    const k = T.edge[Math.floor(h(c * 7 + 1, 5) * T.edge.length) % T.edge.length], s = h(c * 29 + 11, 2), big = !!BIG[k];
    d.obs.push({ c, k, s, ry: big ? 0 : (h(c + 71, 3) - 0.5) * 0.9, dx: big ? 0 : (h(c + 5, 6) - 0.5) * 0.24, dz: big ? 0 : (s - 0.5) * 0.24, r: h(c + 9, 7), edge: true, big });
  }
  if (T.lampEvery && i % T.lampEvery === 0) { const side = Math.floor(i / T.lampEvery) % 2 ? 1 : -1, c = side > 0 ? COLS : -1; if (!d.obs.some(q => q.c === c && q.big && q.k !== 'rail')) { d.lamp = side; d.lampHex = T.lamp; d.obs = d.obs.filter(q => q.k === 'rail' || q.c !== c); } }
}

/** … */
export function sigOf(course, s, pick) {
  const base = s * STRETCH, T = lookAt(base), out = [], used = new Set();
  if (!T) return out;
  let side = pick(s, 3) < 0.5 ? -1 : 1;
  // H5B — THE LANDMARK MOMENT AT THE GATE: the area's hero piece(s) in the GATE LANE's own two edge columns (a ground lane: nothing …
  { const hero = T.hero || [], hs = pick(s, 5) < 0.5 ? -1 : 1; hero.forEach((w0, n) => { const what = w0 === 'crane' && course.lane(base + 1).type === 'flight' ? 'boat' : w0; if (what === 'pylons') out.push({ y0: base, side: -1, what, n: 90, hero: true }, { y0: base, side: 1, what, n: 90, hero: true }); else out.push({ y0: base, side: n ? -hs : hs, what, n: 90 + n, hero: true }); }); }
  const free = y => { const L = course.lane(y); return y > base + 1 && y < base + STRETCH - 2 && L.type !== 'flight' && !L.mark && !used.has(y); };
  const ground = y => free(y) && course.lane(y).type === 'grass';
  const wet = y => ground(y) && (course.lane(y - 1).type === 'water' || course.lane(y + 1).type === 'water');
  const near = (y, ok, reach) => { for (let k = 0; k <= reach; k++) for (const q of k ? [y + k, y - k] : [y]) if (ok(q)) return q; return -1; };
  T.sig.forEach(([what, off], n) => {
    const y = base + off;
    let y0 = -1;
    if (what === 'crane') y0 = near(y, q => free(q) && free(q + 1), 5);
    else if (what === 'pylons') y0 = near(y, free, 4);
    else if (what === 'boat') { y0 = near(y, wet, 6); if (y0 < 0) y0 = near(y, ground, 6); }
    else y0 = near(y, ground, 9);
    if (y0 < 0) return;
    used.add(y0); if (what === 'crane') used.add(y0 + 1);
    if (what === 'pylons') out.push({ y0, side: -1, what, n }, { y0, side: 1, what, n });
    else { out.push({ y0, side, what, n }); side = -side; }
  });
  return out;
}

/** the scene's context for the two draw functions: { K (its kinds), A (the areas' kinds), KM + BOX (Kenney's + the landmarks'), X, Z, … */

/** a BIG edge piece (it takes the whole edge column of its ground lane): q = dressLane's entry, x0 = its cell's centre, z = the lane's */
export function drawBig(q, x0, z, c) {
  const { K, A, lt, on } = c, out = q.c < 0 ? -1 : 1, dim = lt * (c.ek || 0.5) * 1.35, face = out < 0 ? 0 : Math.PI;
  if (q.k === 'rail') { A.rail.put(x0 + out * 0.42, 0, z, 1, 1, 1, 0, 0xffffff, dim); return; }
  if (q.k === 'container') {
    // freight containers along the lane's edge — one, or two stacked: each its own colour
    const x = x0 + out * 0.62, a = CONTAINER_HEX[Math.floor(q.s * 6) % 6], b = CONTAINER_HEX[Math.floor(q.r * 6) % 6];
    A.container.put(x, 0, z, 0.8, 0.8, 0.86, 0, a, dim * 1.1);
    if (q.r < 0.55) A.container.put(x + (q.s - 0.5) * 0.3, 0.75, z, 0.8, 0.8, 0.86, 0, b, dim * 1.1);
    K.shadow.put(x, 0.03, z + 0.08, 2.2, 1, 1.0, 0, 0, 1, 0, 0.5 * lt);
    return;
  }
  if (q.k === 'stall') {
    A.stall.put(x0 + out * 0.42, 0, z, 0.9, 0.9, 0.86, 0, 0xffffff, dim * 1.15);
    K.shadow.put(x0 + out * 0.42, 0.03, z + 0.08, 1.7, 1, 0.9, 0, 0, 1, 0, 0.45 * lt);
    if (on) { K.bill.put(x0 + out * 0.42, 0.62, z + 0.3, 0.26, 0.26, 1, 0, 0xffe6b0, 1, 5, 0.9 * lt * 0.6); K.flat.put(x0 + out * 0.2, 0.04, z + 0.2, 2.6, 1, 1.6, 0, 0xffd9a0, 1, 0, 0.28 * lt); }
    return;
  }
  // a STOREFRONT (DOWNTOWN: its neon sign + the light it throws) / a CANAL HOUSE (warm windows) — its awning toward the play
  const shop = q.k === 'shop', tall = shop ? 0.6 + q.r * 0.24 : 0.74 + q.r * 0.3, x = x0 + out * 0.68, hx = HOUSE_HEX[Math.floor(q.s * 6) % 6], sg = SIGN_HEX[Math.floor(q.r * 6) % 6];
  if (shop && c.SH && c.SH(q, x, z, dim, lt, on, c.day, sg)) return;
  A.house.put(x, 0, z, 1, tall, 0.9, face, hx, dim * (shop ? 0.9 : 1.1));
  K.shadow.put(x, 0.03, z + 0.1, 2.1, 1, 1.1, 0, 0, 1, 0, 0.5 * lt);
  if (c.day) {
    for (const dx of [-0.5, 0.05, 0.6]) K.bill.put(x + dx * 0.9, 1.42 * tall, z + 0.47, 0.2, 0.24, 1, 0, 0x2c4468, 1, 4, 0.85);
    if (shop) { K.bill.put(x, 2.0 * tall + 0.16, z + 0.3, 1.3, 0.3, 1, 0, 0xfbf6ea, 1, 4, 1); K.bill.put(x, 2.0 * tall + 0.16, z + 0.3, 1.1, 0.16, 1, 0, sg, 1, 4, 1); }
    return;
  }
  if (!on) return;
  for (const dx of [-0.5, 0.05, 0.6]) K.bill.put(x + dx * 0.9, 1.42 * tall, z + 0.47, 0.2, 0.24, 1, 0, (dx + q.s * 3) % 1 < 0.72 ? 0xffe6a8 : 0x7fe6ff, 1, 4, 0.85 * lt * 0.7);
  if (shop) {
    K.bill.put(x, 2.0 * tall + 0.16, z + 0.3, 1.25, 0.22, 1, 0, sg, 1, 4, lt * 0.9); K.bill.put(x, 2.0 * tall + 0.16, z + 0.3, 1.9, 0.7, 1, 0, sg, 1, 0, 0.4 * lt);
    K.flat.put(x0 - out * 0.3, 0.045, z, 2.4, 1, 1.4, 0, sg, 1, 0, 0.3 * lt);
  } else K.flat.put(x0 - out * 0.2, 0.045, z + 0.2, 2.0, 1, 1.3, 0, 0xffc890, 1, 0, 0.22 * lt);
}

/** ONE signature piece (its lane is being laid). → { beam: [x, y, z] } where THE LIGHTHOUSE's lamp is (the scene sweeps its beam … */
export function drawSig(P, c) {
  const { K, A, KM, BOX, X, Z, lt, on, h } = c, s = P.side, z = Z(P.y0 + 0.5), x0 = X(s < 0 ? -0.5 : COLS + 0.5), dim = lt * (c.ek || 0.5) * 1.4;
  const hot = k => (c.day ? lt * Math.min(1.12, (c.ek || 0.5) * 1.4 * k) : dim * k);
  const lamp = (x, y, zz, hex, sz = 0.3, a = 0.9) => { if (on) K.bill.put(x, y, zz, sz, sz, 1, 0, hex, 1, 5, a * lt); };
  if (P.what === 'crane') {
    // THE DOCK CRANE straddles two lanes: its four thin legs on the lane lines (whatever runs there runs between them), its boom …
    const zc = Z(P.y0 + 1), x = x0 + s * 0.19;
    A.crane.put(x, 0, zc, 0.75, 0.82, 1.1, s < 0 ? Math.PI : 0, 0xffffff, hot(1.3));
    if (c.day) K.shadow.put(x, 0.03, zc, 2.2, 1, 2.4, 0, 0, 1, 0, 0.3 * Math.min(1, lt));
    lamp(x - s * 0.1, 3.75, zc, 0xff3030, 0.3); lamp(x, 2.5, zc, 0xfff0c8, 0.28, 0.7);
    if (on) K.flat.put(x, 0.04, zc, 3.2, 1, 3.0, 0, 0xffc27a, 1, 0, 0.2 * lt);
    return null;
  }
  if (P.what === 'pylons') {
    // a BRIDGE TOWER straddles its lane (its legs on the lane lines); two lit cables fall away along the bridge, both ways
    const x = x0 - s * 0.05;
    A.pylon.put(x, 0, z, 0.9, 0.95, 1.47, 0, 0xffffff, hot(1.35));
    lamp(x, 4.3, z, 0xff3030, 0.36); lamp(x, 2.55, z, 0xfff0c8, 0.24, 0.6);
    for (const dz of [-1, 1]) K.posts.put(x, 2.6, z + dz * 2.55, 0.05, 0.05, 5.6, 0, c.day ? 0xd8452f : 0xffd0a0, hot(1.6), 1, 1, dz * 0.6, 0);
    return null;
  }
  if (P.what === 'lighthouse') {
    // THE LIGHTHOUSE on its rocks, on a ground lane's edge column — its lamp lit; the scene sweeps its beam across the lanes …
    const B = BOX.lighthouse, sc = B ? 3.9 / B.h : 0.3, x = x0 + s * (P.hero ? 0.1 : 0.66);
    for (const [dx, dz, r] of [[0.75, 0.2, 1.25], [-0.5, 0.36, 0.8], [0.2, -0.38, 0.9], [1.5, -0.1, 1.5]]) { if (P.hero && dx < 0) continue; A.rock.put(x + s * dx, -0.04, z + dz, r, r, r, dx * 5, 0xffffff, hot(1)); }
    if (KM.lighthouse) KM.lighthouse.put(x, 0.1, z, sc, sc, sc, 0, 0xffffff, hot(1.7));
    K.shadow.put(x, 0.03, z + 0.1, 2.4, 1, 1.5, 0, 0, 1, 0, 0.5 * lt);
    return { beam: [x, 0.1 + 3.9 * 0.86, z] };
  }
  if (P.what === 'tower') {
    const x = x0 + s * 0.3;
    A.tower.put(x, 0, z, 0.8, 0.8, 0.8, 0.4, 0xffffff, hot(1.5));
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; lamp(x + Math.cos(a) * 0.62, 2.28, z + Math.sin(a) * 0.62, 0x9fffd0, 0.2, 0.8); }
    lamp(x + 0.16, 3.4, z, 0xff3030, 0.3); K.shadow.put(x, 0.03, z + 0.1, 1.3, 1, 1.0, 0, 0, 1, 0, 0.5 * lt);
    if (on) K.flat.put(x, 0.04, z, 3.0, 1, 2.4, 0, 0xfff0d8, 1, 0, 0.2 * lt);
    return null;
  }
  if (P.what === 'hangar') {
    const x = x0 + s * 0.55;
    A.hangar.put(x, 0, z, 1, 1, 1, 0, 0xffffff, hot(1.25));
    K.shadow.put(x, 0.03, z + 0.12, 2.3, 1, 1.2, 0, 0, 1, 0, 0.5 * lt);
    lamp(x - 0.8, 0.3, z + 0.5, 0xffc060, 0.2); lamp(x + 0.8, 0.3, z + 0.5, 0xffc060, 0.2);
    if (on) K.flat.put(x, 0.04, z + 0.6, 2.2, 1, 1.2, 0, 0xffd27a, 1, 0, 0.34 * lt);
    return null;
  }
  if (P.what === 'fish') {
    // a market stall under THE NEON FISH (the scene's sign plane — light only: it covers nothing)
    const x = x0 + s * (P.hero ? 0.25 : 0.42);
    A.stall.put(x, 0, z, 0.9, 0.9, 0.86, 0, 0xffffff, hot(1.15));
    K.shadow.put(x, 0.03, z + 0.08, 1.7, 1, 0.9, 0, 0, 1, 0, 0.45 * lt);
    if (on) K.flat.put(x - s * 0.2, 0.04, z + 0.2, 2.8, 1, 1.8, 0, 0xff8a5a, 1, 0, 0.3 * lt);
    return { sign: [x, 1.75, z] };
  }
  if (P.what === 'stack') {
    // (H5B — THE RAIL YARD's gate: freight containers stacked three high, a signal lamp on their corner)
    const x = x0 + s * 0.45, n = Math.floor(h(P.y0, 61 + s) * 6);
    for (let k = 0; k < 3; k++) A.container.put(x + (k === 1 ? s * 0.12 : 0), k * 0.75, z, 0.8, 0.8, 0.86, 0, CONTAINER_HEX[(n + k * 2) % 6], hot(1.1));
    K.shadow.put(x, 0.03, z + 0.08, 2.2, 1, 1.0, 0, 0, 1, 0, 0.5 * lt);
    lamp(x - s * 0.9, 2.4, z + 0.3, 0x40ff80, 0.26);
    return null;
  }
  if (P.what === 'block' || P.what === 'row') {
    // (H5B — DOWNTOWN's gate: a TOWER BLOCK, three storeys of lit windows + its sign · THE CANAL's: a tall canal house)
    const tall = P.what === 'block' ? 1.9 : 1.25, x = x0 + s * 0.47, hx = HOUSE_HEX[Math.floor(h(P.y0, 63 + s) * 6) % 6], sg = SIGN_HEX[Math.floor(h(P.y0, 65 + s) * 6) % 6];
    A.house.put(x, 0, z, 1, tall, 0.9, s < 0 ? 0 : Math.PI, P.what === 'block' ? 0xc8d2e6 : hx, hot(P.what === 'block' ? 0.95 : 1.1));
    K.shadow.put(x, 0.03, z + 0.1, 2.1, 1, 1.1, 0, 0, 1, 0, 0.5 * lt);
    for (let r = 0; r < (P.what === 'block' ? 3 : 2); r++) for (const dx of [-0.5, 0.05, 0.6]) {
      if (c.day) K.bill.put(x + dx * 0.9, (0.9 + r * 0.85) * tall * 0.62 + 0.5, z + 0.47, 0.2, 0.26, 1, 0, 0x2c4468, 1, 4, 0.85);
      else if (on) K.bill.put(x + dx * 0.9, (0.9 + r * 0.85) * tall * 0.62 + 0.5, z + 0.47, 0.2, 0.26, 1, 0, (r + dx * 3 + 9) % 2 < 1.3 ? 0xffe6a8 : 0x7fe6ff, 1, 4, 0.8 * lt);
    }
    if (P.what === 'block') {
      if (c.day) { K.bill.put(x, 2.0 * tall + 0.2, z + 0.3, 1.3, 0.3, 1, 0, 0xfbf6ea, 1, 4, 1); K.bill.put(x, 2.0 * tall + 0.2, z + 0.3, 1.1, 0.16, 1, 0, sg, 1, 4, 1); }
      else if (on) { K.bill.put(x, 2.0 * tall + 0.2, z + 0.3, 1.3, 0.24, 1, 0, sg, 1, 4, lt); K.bill.put(x, 2.0 * tall + 0.2, z + 0.3, 2.0, 0.8, 1, 0, sg, 1, 0, 0.4 * lt); lamp(x, 2.0 * tall + 0.7, z, 0xff3030, 0.3); K.flat.put(x0 - s * 0.3, 0.045, z, 2.4, 1, 1.4, 0, sg, 1, 0, 0.3 * lt); }
    } else if (on) K.flat.put(x0 - s * 0.2, 0.045, z + 0.2, 2.0, 1, 1.3, 0, 0xffc890, 1, 0, 0.22 * lt);
    return null;
  }
  // A MOORED FISHING BOAT, alongside the pier on a ground lane's edge column — a lamp on its mast, its light on the water side
  const B = BOX['fishing-boat'], sc = B ? 1.86 / B.l : 0.48, x = x0 + s * 0.62, wetUp = c.course.lane(P.y0 + 1).type === 'water', dz = c.course.lane(P.y0 - 1).type === 'water' || wetUp ? (wetUp ? -0.08 : 0.08) : 0;
  if (KM['fishing-boat']) KM['fishing-boat'].put(x, -0.05, z + dz, sc, sc, sc, s < 0 ? Math.PI / 2 : -Math.PI / 2, 0xffffff, hot(1.6), 1, 1, 0, (h(P.y0, 51) - 0.5) * 0.12);
  K.shadow.put(x, 0.03, z + dz + 0.08, 2.1, 1, 1.05, 0, 0, 1, 0, 0.5 * lt);
  lamp(x, 1.0, z + dz, 0xffe9b0, 0.22);
  if (on) K.flat.put(x, 0.04, z + dz, 2.6, 1, 1.6, 0, 0xffe9b0, 1, 0, 0.22 * lt);
  return null;
}

/** THE NEON FISH (the fish market's sign) on a canvas: a fish in neon tubes + its eye — drawn once a look (H5B — by DAY a painted … */
export function drawFishSign(c, w, hgt, day = false) {
  c.clearRect(0, 0, w, hgt);
  c.lineCap = 'round'; c.lineJoin = 'round'; c.shadowBlur = 0; c.globalAlpha = 1;
  const body = () => { c.beginPath(); c.moveTo(w * 0.1, hgt * 0.5); c.bezierCurveTo(w * 0.3, hgt * 0.08, w * 0.62, hgt * 0.1, w * 0.74, hgt * 0.5); c.bezierCurveTo(w * 0.62, hgt * 0.9, w * 0.3, hgt * 0.92, w * 0.1, hgt * 0.5); c.moveTo(w * 0.74, hgt * 0.5); c.lineTo(w * 0.92, hgt * 0.2); c.lineTo(w * 0.92, hgt * 0.8); c.closePath(); };
  if (day) { body(); c.fillStyle = '#ff7a3a'; c.fill(); c.lineWidth = hgt * 0.07; c.strokeStyle = '#fff6e8'; c.stroke(); c.lineWidth = hgt * 0.02; c.strokeStyle = 'rgba(20, 40, 70, 0.7)'; c.stroke(); c.fillStyle = '#ffffff'; c.beginPath(); c.arc(w * 0.27, hgt * 0.42, hgt * 0.06, 0, Math.PI * 2); c.fill(); return; }
  for (const [lw, a, col, blur] of [[hgt * 0.16, 0.55, '#ff7a4a', hgt * 0.2], [hgt * 0.07, 1, '#ffb090', 0], [hgt * 0.025, 1, '#ffffff', 0]]) { c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = lw; c.shadowColor = '#ff7a4a'; c.shadowBlur = blur; body(); c.stroke(); }
  c.globalAlpha = 1; c.shadowBlur = hgt * 0.1; c.shadowColor = '#22e0ff'; c.fillStyle = '#bff4ff'; c.beginPath(); c.arc(w * 0.27, hgt * 0.42, hgt * 0.05, 0, Math.PI * 2); c.fill();
}
