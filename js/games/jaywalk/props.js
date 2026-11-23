// JAYWALK — VARIETY B2: THE AREA TREES + THE EDGE DECORATION (docs/jaywalk.md "VARIETY B2"). A VIEW, lazy (never the start bundle — night.js
// fetches it at the scene's first frame; until it is in, every tree draws today's round tree). The rules' cells are untouched: a tree / a
// planter stands where it stood (decorOf — `dress` only says WHICH model draws it); the decoration goes ONLY into an EDGE COLUMN slot that is
// empty today (never a play cell), sparse, smaller + dimmer than a lane prop. Files per area, a stretch ahead (variety.js#createVariety).
import * as THREE from 'three';
import { createVariety } from './variety.js';
import { TREES, DECO, propIds, dress } from './props-plan.js';
export { TREES, TREE_SETS, DECO_SETS, DECO, treeOf, propIds, dress } from './props-plan.js';
import { build, roundBox } from './models.js';

// ---- THE CODE-BUILT PIECES (y up, on their own foot, in cells)
const cyl = (a, b, hh, n = 10) => new THREE.CylinderGeometry(a, b, hh, n);
const ball = (r, w = 10, hh = 8) => new THREE.SphereGeometry(r, w, hh);
const by = k => y => k[0] + y * k[1];
function buildPieces() {
  const G = {};
  // a low SHRUB: three soft blobs (green-dominant: autumn turns it)
  G['c-shrub'] = build([
    { g: ball(0.22, 10, 7), color: 0x3f9a46, at: [0, 0.18, 0], scale: [1.25, 0.8, 1.15], shade: by([0.7, 0.8]) },
    { g: ball(0.16, 9, 6), color: 0x4aa84e, at: [0.17, 0.15, 0.06], shade: by([0.72, 0.9]) },
    { g: ball(0.15, 9, 6), color: 0x3a9142, at: [-0.15, 0.14, -0.05], shade: by([0.72, 0.9]) },
  ]);
  // a FISH CRATE on the quay: a shallow wooden box heaped with ice + silver fish (the ice white — blue on the ground = water)
  G['c-fishcrate'] = build([
    { g: roundBox(0.56, 0.2, 0.4, 0.02, 1), color: 0xa8743e, at: [0, 0.1, 0], shade: by([0.7, 1.2]) },
    { g: roundBox(0.5, 0.06, 0.34, 0.02, 1), color: 0xf2f4f2, at: [0, 0.2, 0] },
    { g: ball(0.07, 8, 6), color: 0xc4cad0, at: [-0.12, 0.24, 0.05], scale: [2.2, 0.45, 0.8], rot: [0, 0.4, 0] },
    { g: ball(0.07, 8, 6), color: 0xd0d6dc, at: [0.1, 0.24, -0.06], scale: [2.2, 0.45, 0.8], rot: [0, -0.3, 0] },
    { g: ball(0.065, 8, 6), color: 0xff8f5c, at: [0.04, 0.26, 0.09], scale: [2.1, 0.45, 0.8], rot: [0, 0.15, 0] },
  ]);
  // a RAIL SIGNAL by the tracks: a dark post, a head with two lenses (painted — unlit: only the crossing's signals ever flash, H5B)
  G['c-railsignal'] = build([
    { g: roundBox(0.24, 0.06, 0.24, 0.02, 1), color: 0x3b3e46, at: [0, 0.03, 0] },
    { g: cyl(0.035, 0.04, 0.82, 8), color: 0x50545e, at: [0, 0.44, 0] },
    { g: roundBox(0.16, 0.3, 0.12, 0.03, 2), color: 0x1d1f25, at: [0, 0.92, 0.02] },
    { g: ball(0.045, 8, 6), color: 0xc8322a, at: [0, 0.99, 0.085] },
    { g: ball(0.045, 8, 6), color: 0x2f9a52, at: [0, 0.86, 0.085] },
  ]);
  // a stack of RAIL TIES: two crossed layers of dark creosoted beams
  { const P = []; for (let k = 0; k < 4; k++) P.push({ g: roundBox(0.16, 0.08, 0.82, 0.015, 1), color: k % 2 ? 0x4a3527 : 0x55402f, at: [-0.27 + k * 0.18, 0.04, 0] }); for (let k = 0; k < 3; k++) P.push({ g: roundBox(0.7, 0.08, 0.16, 0.015, 1), color: k % 2 ? 0x5c4533 : 0x4f3a2b, at: [0, 0.12, -0.24 + k * 0.24] }); G['c-railties'] = build(P); }
  // a WINDSOCK: a white mast + an orange / white striped sock (it sways a little — the instance's tilt)
  { const P = [{ g: roundBox(0.22, 0.05, 0.22, 0.02, 1), color: 0x5a5e66, at: [0, 0.025, 0] }, { g: cyl(0.025, 0.03, 1.0, 8), color: 0xe8eaee, at: [0, 0.52, 0] }];
    for (let k = 0; k < 4; k++) { const r0 = 0.085 - k * 0.012; P.push({ g: cyl(r0 - 0.012, r0, 0.13, 10), color: k % 2 ? 0xf4f2ee : 0xff6a1a, at: [0.07 + k * 0.125, 0.94, 0], rot: [0, 0, Math.PI / 2] }); }
    G['c-windsock'] = build(P); }
  // a TAXIWAY SIGN: a low board on two short legs — a yellow panel + a black one (the airfield's own colours)
  G['c-runwaysign'] = build([
    { g: roundBox(0.035, 0.12, 0.035, 0.01, 1), color: 0x3a3c42, at: [0, 0.06, -0.2] },
    { g: roundBox(0.035, 0.12, 0.035, 0.01, 1), color: 0x3a3c42, at: [0, 0.06, 0.2] },
    { g: roundBox(0.06, 0.2, 0.28, 0.015, 1), color: 0xffd23a, at: [0, 0.22, -0.13] },
    { g: roundBox(0.06, 0.2, 0.26, 0.015, 1), color: 0x16171b, at: [0, 0.22, 0.14] },
    { g: roundBox(0.062, 0.04, 0.12, 0.01, 1), color: 0xffd23a, at: [0, 0.24, 0.14] },
  ]);
  // a BAGGAGE CART: a low flat bed on four small wheels, a tow bar, three suitcases
  G['c-bagcart'] = build([
    { g: roundBox(0.46, 0.05, 0.72, 0.015, 1), color: 0x8a9098, at: [0, 0.12, 0] },
    ...[[-0.2, -0.28], [0.2, -0.28], [-0.2, 0.28], [0.2, 0.28]].map(([x, z]) => ({ g: cyl(0.06, 0.06, 0.05, 8), color: 0x1c1d22, at: [x, 0.06, z], rot: [0, 0, Math.PI / 2] })),
    { g: roundBox(0.04, 0.03, 0.22, 0.01, 1), color: 0x5a5e66, at: [0, 0.1, 0.46] },
    { g: roundBox(0.34, 0.2, 0.22, 0.03, 1), color: 0xd8472f, at: [0, 0.25, -0.2] },
    { g: roundBox(0.3, 0.16, 0.2, 0.03, 1), color: 0x3ea86a, at: [0.02, 0.23, 0.06] },
    { g: roundBox(0.26, 0.24, 0.16, 0.03, 1), color: 0xe8a02a, at: [-0.03, 0.27, 0.27] },
  ]);
  return G;
}

const ASSETS = new URL('../../../assets/jaywalk/', import.meta.url);
export const PROPS_REV = 1;
const urlOf = id => new URL(`${id[0] === 't' ? 'trees' : 'edge'}/${id.slice(2)}.glb?v=${PROPS_REV}`, ASSETS);
/** (the cartridge's preload) the opening's files into the HTTP cache */
export const warmProps = () => Promise.all(propIds(-1).map(id => fetch(urlOf(id)).catch(() => null)));

/**
 * The scene's half. A = { kind, lambert, parseGlb, unkind, K, clock } (night.js). → { want(areas), pump(busy) → a step taken?, tree(tk, x, zz, s,
 * ry, dim) → drawn?, deco(q, x, zz, dim, lt), info() }
 */
export function createProps(A) {
  const leafMat = A.lambert(true), plainMat = A.lambert(false), PK = {}, BOX = {};
  const G = buildPieces();
  for (const [id, g] of Object.entries(G)) { const b = g.boundingBox; BOX[id] = b.max.y; PK[id] = A.kind(g, id === 'c-shrub' ? leafMat : plainMat, id === 'c-shrub' ? 40 : 16, { cast: id === 'c-shrub' }); }
  const L = createVariety({
    parseGlb: A.parseGlb, parseSteps: A.parseSteps, ids: propIds, url: urlOf, known: new Set(),
    add(id, g) { const tree = id[0] === 't', leaf = tree && TREES[id.slice(2)].leaf; PK[id] = A.kind(g, leaf ? leafMat : plainMat, tree ? 60 : 20, { cast: tree }); },
    drop(id) { const q = PK[id]; if (q) { delete PK[id]; A.unkind(q); } },
  });
  return {
    dress,
    want: areas => L.want(areas),
    due: () => L.due(),
    pump: busy => L.pump(busy),
    /** a tree of model `tk` (false = not in yet: the scene draws today's round tree) */
    tree(tk, x, zz, s, ry, dim) {
      const id = TREES[tk] && TREES[tk].code ? `c-${tk}` : `t-${tk}`, q = PK[id];
      if (!q) return false;
      const k = s / 0.87, hh = TREES[tk].h * k, ww = TREES[tk].xz * k;
      q.put(x, 0, zz, ww, hh, ww, ry, 0xffffff, dim);
      return true;
    },
    /** an edge piece (drawn smaller + dimmer than a lane prop: the scene's edge dim) — a file not in yet: nothing (it is decoration) */
    deco(q, x, zz, dim, lt) {
      const P = DECO[q.k], m = PK[q.k];
      if (!P || !m) return;
      const hh = P.h * (0.92 + q.s * 0.16), ry = P.ry * (q.side || 1) + q.ry, sw = P.sway && !A.reduce ? Math.sin(A.clock() * 0.0016 + q.s * 9) * 0.12 : 0;
      m.put(x, 0, zz, hh, hh, hh, ry, 0xffffff, dim * 1.1, 1, 1, 0, sw);
      A.K.shadow.put(x, 0.03, zz + 0.05, P.sh[0] * hh / P.h, 1, P.sh[1] * hh / P.h, ry, 0, 1, 0, 0.36 * lt);
    },
    /** every kind of its own (the scene resets + uploads them each frame, warms them with the rest) */
    kinds: () => Object.values(PK),
    info: () => ({ ...L.info(), kinds: Object.keys(PK).length }),
    destroy() { L.destroy(); },
  };
}
