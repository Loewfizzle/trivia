// JAYWALK — THE MODELS (H2 — docs/jaywalk.md "THE NIGHT LOOK"): the 12 Kenney models (CC0 — assets/jaywalk/models/, re-packed by
// scripts/build-jaywalk-assets.py: ONE mesh each, the colormap baked into vertex colours, a car's body paint in COLOR_0's alpha) through a
// tiny GLB reader of our own (no loader add-on: the page's import map carries three's core only), + everything BUILT IN CODE in the smooth
// toy style: THE JAYWALKER, the round puffy trees, the logs, the tufts, a truck's box. Every geometry here carries `color` (linear RGB) +
// `paint` (1 = the part that takes the player's / the car's colour). Kenney's normals are never recomputed.
import * as THREE from 'three';

const DIR = new URL('../../../assets/jaywalk/models/', import.meta.url);
export const MODEL_REV = 1;   // (bump when a model file is replaced)
export const KENNEY = Object.freeze(['car-sedan', 'car-hatchback', 'car-taxi', 'car-van', 'train-front', 'train-carriage',
  'bush-planter', 'street-lamp', 'traffic-cone', 'traffic-barrier', 'trash-dumpster', 'crate-box']);
const lin = c => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const COMP = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
const NORM = { 5120: 127, 5121: 255, 5122: 32767, 5123: 65535 };
const WIDTH = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };

/** one of OUR re-packed GLBs (one node, one mesh, one primitive: POSITION · NORMAL · COLOR_0 · indices) → a BufferGeometry in the node's scale */
export function parseGlb(buf) {
  const dv = new DataView(buf);
  if (dv.getUint32(0, true) !== 0x46546c67) throw new Error('not a GLB');
  const jl = dv.getUint32(12, true), json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jl))), bin = 20 + jl + 8;
  const read = i => {
    const a = json.accessors[i], bv = json.bufferViews[a.bufferView], T = COMP[a.componentType], n = WIDTH[a.type];
    const stride = bv.byteStride || T.BYTES_PER_ELEMENT * n, at = bin + (bv.byteOffset || 0) + (a.byteOffset || 0), k = a.normalized ? 1 / NORM[a.componentType] : 1;
    const out = new Float32Array(a.count * n), get = { 5120: 'getInt8', 5121: 'getUint8', 5122: 'getInt16', 5123: 'getUint16', 5125: 'getUint32', 5126: 'getFloat32' }[a.componentType];
    for (let v = 0; v < a.count; v++) for (let c = 0; c < n; c++) out[v * n + c] = dv[get](at + v * stride + c * T.BYTES_PER_ELEMENT, true) * k;
    return { out, n, count: a.count };
  };
  const node = json.nodes[0], prim = json.meshes[node.mesh].primitives[0], s = (node.scale || [1, 1, 1])[0];
  const P = read(prim.attributes.POSITION), N = read(prim.attributes.NORMAL), C = read(prim.attributes.COLOR_0), I = read(prim.indices);
  const pos = P.out.map(v => v * s), col = new Float32Array(P.count * 3), paint = new Float32Array(P.count);
  for (let v = 0; v < P.count; v++) { for (let c = 0; c < 3; c++) col[v * 3 + c] = lin(C.out[v * 4 + c]); paint[v] = C.out[v * 4 + 3] < 0.5 ? 1 : 0; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(N.out, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('paint', new THREE.BufferAttribute(paint, 1));
  g.setIndex(new THREE.BufferAttribute(P.count > 65535 ? Uint32Array.from(I.out) : Uint16Array.from(I.out), 1));
  g.computeBoundingBox();
  return g;
}

/** every Kenney model → { name: geometry } (a missing file = a missing key: the scene draws nothing for it, never throws) */
export async function loadKenney(names = KENNEY) {
  const out = {};
  await Promise.all(names.map(n => fetch(new URL(`${n}.glb?v=${MODEL_REV}`, DIR)).then(r => (r.ok ? r.arrayBuffer() : null)).then(b => { if (b) out[n] = parseGlb(b); }).catch(() => {})));
  return out;
}

// ---- BUILT IN CODE
const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), S = new THREE.Vector3(), C = new THREE.Color();
/** parts [{ g, color, paint?, at?, rot?, scale?, shade? (y → a colour multiplier) }] → ONE non-indexed geometry with color + paint */
export function build(parts) {
  let n = 0;
  const done = parts.map(p => {
    const g = p.g.index ? p.g.toNonIndexed() : p.g.clone();
    M.compose(V.fromArray(p.at || [0, 0, 0]), Q.setFromEuler(E.fromArray(p.rot || [0, 0, 0])), S.fromArray(typeof p.scale === 'number' ? [p.scale, p.scale, p.scale] : p.scale || [1, 1, 1]));
    g.applyMatrix4(M);
    n += g.attributes.position.count;
    return g;
  });
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), paint = new Float32Array(n);
  let o = 0;
  done.forEach((g, k) => {
    const p = parts[k], c = g.attributes.position.count;
    pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3);
    C.set(p.color);
    for (let v = 0; v < c; v++) {
      const m = p.shade ? p.shade(g.attributes.position.getY(v), g.attributes.position.getX(v), g.attributes.position.getZ(v)) : 1;
      col[(o + v) * 3] = C.r * m; col[(o + v) * 3 + 1] = C.g * m; col[(o + v) * 3 + 2] = C.b * m; paint[o + v] = p.paint ? 1 : 0;
    }
    o += c; g.dispose(); p.g.dispose();
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3)); out.setAttribute('paint', new THREE.BufferAttribute(paint, 1));
  out.computeBoundingBox();
  return out;
}
/** a box with every edge + corner rounded by r (smooth normals) */
export function roundBox(w, h, d, r, seg = 3) {
  const g = new THREE.BoxGeometry(w, h, d, seg, seg, seg), p = g.attributes.position, nrm = g.attributes.normal, hx = w / 2 - r, hy = h / 2 - r, hz = d / 2 - r;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), cx = Math.max(-hx, Math.min(hx, x)), cy = Math.max(-hy, Math.min(hy, y)), cz = Math.max(-hz, Math.min(hz, z));
    V.set(x - cx, y - cy, z - cz);
    if (V.lengthSq() < 1e-9) V.set(nrm.getX(i), nrm.getY(i), nrm.getZ(i)); else V.normalize();
    p.setXYZ(i, cx + V.x * r, cy + V.y * r, cz + V.z * r); nrm.setXYZ(i, V.x, V.y, V.z);
  }
  return g;
}
const ball = (r, w = 14, h = 10) => new THREE.SphereGeometry(r, w, h);

/**
 * THE JAYWALKER — smooth toy style, ≈ 1 lane tall (0.98), the head ≈ 45 % of him, a hoodie in the player's colour (paint), a BACKWARDS
 * cap (its brim to his back — toward the camera as he hops up the course), white sneakers, two big eyes. He faces −z (up the course).
 * → { body, cap } (the cap is its own mesh: a car knocks it off)
 */
export function buildKid() {
  const skin = 0xf3c7a0, navy = 0x262d52, hair = 0x54361f, white = 0xf4f4f8;
  const body = build([
    { g: new THREE.CapsuleGeometry(0.185, 0.13, 5, 14), color: 0x9a9a9a, paint: 1, at: [0, 0.36, 0], scale: [1.16, 1, 0.98], shade: y => 0.7 + (y - 0.2) * 0.9 },
    { g: ball(0.115, 12, 8), color: 0x8c8c8c, paint: 1, at: [0, 0.515, 0.125], scale: [1.3, 0.7, 0.95] },                                  // the hood, on his back
    { g: new THREE.CapsuleGeometry(0.062, 0.13, 4, 10), color: 0xbababa, paint: 1, at: [-0.255, 0.37, -0.05], rot: [0.75, 0, 0.18] },   // arms: a runner's swing
    { g: new THREE.CapsuleGeometry(0.062, 0.13, 4, 10), color: 0xbababa, paint: 1, at: [0.255, 0.37, 0.05], rot: [-0.75, 0, -0.18] },
    { g: ball(0.066, 10, 8), color: skin, at: [-0.275, 0.3, -0.135] },
    { g: ball(0.066, 10, 8), color: skin, at: [0.275, 0.3, 0.135] },
    { g: new THREE.CapsuleGeometry(0.078, 0.07, 4, 10), color: navy, at: [-0.095, 0.15, -0.05], rot: [0.35, 0, 0] },                    // legs
    { g: new THREE.CapsuleGeometry(0.078, 0.07, 4, 10), color: navy, at: [0.095, 0.15, 0.06], rot: [-0.35, 0, 0] },
    { g: roundBox(0.175, 0.11, 0.29, 0.052), color: white, at: [-0.105, 0.056, -0.1] },                                                     // the sneakers: big + white
    { g: roundBox(0.175, 0.11, 0.29, 0.052), color: white, at: [0.105, 0.056, 0.07] },
    { g: ball(0.222, 18, 14), color: skin, at: [0, 0.725, 0], scale: [1.06, 0.98, 1] },                                                 // the head
    { g: new THREE.SphereGeometry(0.236, 16, 12, 0, Math.PI), color: hair, at: [0, 0.72, 0.014], scale: [1.07, 1.02, 1.04] },                // hair: the back of it
    { g: ball(0.064, 12, 10), color: white, at: [-0.095, 0.74, -0.186], scale: [1, 1.15, 0.6] },                                        // two big eyes
    { g: ball(0.064, 12, 10), color: white, at: [0.095, 0.74, -0.186], scale: [1, 1.15, 0.6] },
    { g: ball(0.038, 10, 8), color: 0x14121c, at: [-0.092, 0.738, -0.222], scale: [1, 1.15, 0.5] },
    { g: ball(0.038, 10, 8), color: 0x14121c, at: [0.092, 0.738, -0.222], scale: [1, 1.15, 0.5] },
  ]);
  const cap = build([
    { g: new THREE.SphereGeometry(0.25, 18, 8, 0, Math.PI * 2, 0, Math.PI * 0.42), color: 0xb4b4b4, paint: 1, at: [0, 0.762, -0.012], scale: [1.07, 0.86, 1.05] },
    { g: roundBox(0.32, 0.045, 0.22, 0.021), color: 0xf4f4f8, at: [0, 0.83, 0.3], rot: [-0.1, 0, 0] },                       // the brim: BACKWARDS
    { g: ball(0.034, 8, 6), color: 0xf4f4f8, at: [0, 0.98, -0.012] },
  ]);
  return { body, cap, height: 0.98 };
}

/** a round puffy tree (the concept's): stacked soft blobs on a short trunk — ≈ 1.25 tall at scale 1 */
export function buildTree() {
  const leaf = 0x2f9a48, top = y => 0.62 + Math.max(0, y - 0.35) * 0.62;
  return build([
    { g: new THREE.CylinderGeometry(0.075, 0.1, 0.42, 8), color: 0x7a4a2c, at: [0, 0.21, 0] },
    { g: ball(0.36, 12, 9), color: leaf, at: [0, 0.68, 0], scale: [1.12, 0.86, 1.12], shade: top },
    { g: ball(0.27, 10, 8), color: leaf, at: [0.02, 0.98, 0.01], scale: [1.05, 0.9, 1.05], shade: top },
    { g: ball(0.2, 10, 8), color: leaf, at: [-0.26, 0.6, 0.12], shade: top },
    { g: ball(0.2, 10, 8), color: leaf, at: [0.27, 0.62, -0.08], shade: top },
  ]);
}
/** a small grass tuft (three leaning blades' worth of cone) */
export function buildTuft() {
  const c = (x, z, h, r) => ({ g: new THREE.ConeGeometry(0.035, h, 5), color: 0x3fae55, at: [x, h / 2, z], rot: r, shade: y => 0.55 + y * 4 });
  return build([c(0, 0, 0.13, [0, 0, 0]), c(0.05, 0.02, 0.1, [0, 0, -0.5]), c(-0.05, -0.01, 0.1, [0, 0, 0.5]), c(0.01, 0.05, 0.09, [0.5, 0, 0])]);
}
/** a log, 1 cell long along x at scale 1 (the scene stretches x): long, rounded, smooth bark, a pale ring at each end */
export function buildLog() {
  const r = 0.36, b = 0.12, L = 0.5, pts = [new THREE.Vector2(0.001, -L)];
  for (let i = 0; i <= 5; i++) { const a = (i / 5) * Math.PI / 2; pts.push(new THREE.Vector2(r - b + Math.sin(a) * b, -L + b - Math.cos(a) * b)); }
  for (let i = 0; i <= 5; i++) { const a = (i / 5) * Math.PI / 2; pts.push(new THREE.Vector2(r - b + Math.cos(a) * b, L - b + Math.sin(a) * b)); }
  pts.push(new THREE.Vector2(0.001, L));
  return build([{ g: new THREE.LatheGeometry(pts, 14), color: 0x8a5a34, rot: [0, 0, Math.PI / 2], scale: [1, 1, 1],
    shade: (y, x, z) => (Math.abs(x) > L - 0.03 ? 1.9 : 0.74 + 0.3 * (y / r)) * (Math.abs(x) > L - 0.03 && Math.hypot(y, z) < 0.14 ? 0.7 : 1) }]);
}
/** a truck's box (behind the van on a 3-cell vehicle): a rounded cargo box on a dark base, 1 long along z */
export function buildTrailer() {
  return build([
    { g: roundBox(1, 0.78, 1, 0.09), color: 0xbababa, paint: 1, at: [0, 0.62, 0], shade: y => 0.7 + y * 0.35 },
    { g: roundBox(0.94, 0.16, 1, 0.05), color: 0x23232b, at: [0, 0.17, 0] },
    { g: new THREE.CylinderGeometry(0.2, 0.2, 1.04, 12), color: 0x18181d, at: [0, 0.2, 0.22], rot: [0, 0, Math.PI / 2] },
  ]);
}
/** THE BLACKBIRD's placeholder (H6 draws the real one): a dark dart, 1 long along x */
export function buildDart() {
  return build([{ g: new THREE.ConeGeometry(0.5, 1, 4), color: 0x1b1d2c, rot: [0, Math.PI / 4, -Math.PI / 2], scale: [1, 0.16, 1] }]);
}
