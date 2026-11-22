// JAYWALK — THE MODELS (H2 — docs/jaywalk.md "THE NIGHT LOOK"): the 12 Kenney models (CC0 — assets/jaywalk/models/, re-packed by
// The long notes: docs/games/jaywalk-notes.md
import * as THREE from 'three';

const DIR = new URL('../../../assets/jaywalk/models/', import.meta.url);
export const MODEL_REV = 2;   // (bump when a model file is replaced)
export const KENNEY = Object.freeze(['car-sedan', 'car-hatchback', 'car-taxi', 'car-van', 'train-front', 'train-carriage',
  'bush-planter', 'street-lamp', 'traffic-cone', 'traffic-barrier', 'trash-dumpster', 'crate-box']);
/** what the night look draws today (H2B — the owner: no junk-looking props): the crate is out (THE DOCKS' crates are built in code — H5A)
 *  and so is the jersey barrier (from above it read as a pale cube — the barrier is now THE BARRICADE, built in code);
 *  H5A — THE AREAS' two models: the lighthouse (MaverickFX, CC0) + the fishing boat (Kenney's Watercraft Kit, CC0) */
export const LANDMARK_MODELS = Object.freeze(['lighthouse', 'fishing-boat']);
export const SCENE_MODELS = Object.freeze([...KENNEY.filter(n => n !== 'crate-box' && n !== 'traffic-barrier'), ...LANDMARK_MODELS]);
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
  // (H5A — THE KID: each vertex's ONE bone + THE POSES — the skin matrices, 3 rows of 4 floats a bone, a row of the texture a frame)
  const X = json.extras && json.extras.poses;
  if (X && prim.attributes._BONE != null) {
    g.setAttribute('bone', new THREE.BufferAttribute(read(prim.attributes._BONE).out, 1));
    const tex = new THREE.DataTexture(read(X.accessor).out, X.bones * 3, X.frames, THREE.RGBAFormat, THREE.FloatType);
    tex.minFilter = tex.magFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
    g.userData.poses = { tex, clips: X.clips, bones: X.bones, frames: X.frames };
  }
  return g;
}

/** every Kenney model → { name: geometry } (a missing file = a missing key: the scene draws nothing for it, never throws) */
export async function loadKenney(names = KENNEY) {
  const out = {};
  await Promise.all(names.map(n => fetch(new URL(`${n}.glb?v=${MODEL_REV}`, DIR)).then(r => (r.ok ? r.arrayBuffer() : null)).then(b => { if (b) out[n] = parseGlb(b); }).catch(() => {})));
  return out;
}

// (J4's winter loader — THE SEASONAL PACK's models — lives in seasonal.js since JT1: never the start bundle)

/** (H3 — the cartridge's preload, during the walk inside) the scene's model files into the HTTP cache — fetched, never parsed */
export const warmModels = () => Promise.all([...SCENE_MODELS, 'kid'].map(n => fetch(new URL(`${n}.glb?v=${MODEL_REV}`, DIR)).catch(() => null)));

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
 * THE KID (H5A — the owner, Nov 16): Kenney's "Mini Skate" skate boy (CC0) — assets/jaywalk/models/kid.glb, re-packed by
 * scripts/build-jaywalk-assets.py: ONE mesh, the colormap in vertex colours, the PAINT = his T-shirt + THE CAP (they take the player's
 * colour; the face, the arms, the jeans + the white sneakers stay Kenney's), each vertex's ONE bone (`bone`) and THE POSES (the skin
 * matrices of idle · jump · fall + the SPLAY, a row a frame). He faces −z (up the course), 0.78 tall, his cap built into his head.
 * → the geometry (+ `userData.poses` = { tex (a float texture: 3 texels a bone across, a row a frame), clips: { name: [first row,
 * frames] } }), or null (the file never came: the scene draws his glow ring + shadow alone, never throws). Tried three times.
 */
export const KID = Object.freeze({ h: 0.78 });
export async function loadKid() {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(new URL(`kid.glb?v=${MODEL_REV}`, DIR));
      if (r.ok) { const g = parseGlb(await r.arrayBuffer()); if (g.userData.poses) return g; }
    } catch { /* the next try */ }
    await new Promise(res => setTimeout(res, 600 * (i + 1)));
  }
  return null;
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
/**
 * A LOG (H3 — the owner, Nov 16: all the SAME THICKNESS, each its OWN LENGTH; nothing on a log that could read as a pickup), `len` cells
 * long along x (1 · 2 · 3 · 4 — one geometry a length: nothing is stretched), built in code in the smooth toy style:
 *   · a ROUND trunk of ONE radius (LOG.r — a true circle across: it must read as thick + round), HALF-SUNK: the scene floats its centre
 *     at the waterline, so only the round back shows — LIT ON TOP, DARK DOWN THE SIDES (the shade by the angle round it)
 *   · BARK GRAIN ALONG THE LENGTH: each strip round the trunk is one tone from end to end (a ridge or a dark furrow) → crisp lines
 *   · PALE RINGED ENDS as round discs — sawn on a slant (the top a little shorter), so the cut faces are SEEN from the camera above
 * NO moss, NO branch stub, NO dot (H2B's stub ended in a pale sawn face — two small concentric circles on the log's shoulder: from the
 * camera it read as a dot, a pickup; JAYWALK has none). Its top sits LOG.top above its centre.
 */
export const LOG = Object.freeze({ r: 0.36, top: 0.36 });
export function buildLog(len) {
  const L = len - 0.1, R = LOG.r, SL = 0.62, nx = Math.max(2, len * 2), na = 20, nc = 12, A0 = -0.42, A1 = Math.PI + 0.42;
  const pos = [], nor = [], col = [], c = new THREE.Color();
  const BARK = 0x9a6238, GRAIN = [1, 1, 0.7, 1, 0.94, 1, 0.66, 1, 1, 0.92, 0.7, 1, 1, 0.68, 1, 0.94, 1, 0.7, 1, 1];   // (a strip round the trunk: a ridge, or a dark furrow — the same from end to end)
  const put = (x, y, z, nx_, ny, nz, hex, k) => { pos.push(x, y, z); const l = Math.hypot(nx_, ny, nz) || 1; nor.push(nx_ / l, ny / l, nz / l); c.set(hex); col.push(c.r * k, c.g * k, c.b * k); };
  /** lit on top, dark down the sides */
  const lit = a => 0.3 + 0.86 * Math.pow(Math.max(0, Math.cos(a - 1.3)), 2.2);   // (brightest on the shoulder the camera + the key light see, falling away to BOTH limbs: it reads as ROUND)
  /** a point of the trunk: u 0 … 1 along it, a = the angle round it (0 = the camera's side, π / 2 = the top) */
  const trunk = (u, a, k) => { const ca = Math.cos(a), sa = Math.sin(a), half = L / 2 - SL * R * sa; put(-half + 2 * half * u, R * sa, R * ca, 0, sa, ca, BARK, k); };
  for (let i = 0; i < nx; i++) for (let j = 0; j < na; j++) {
    const u0 = i / nx, u1 = (i + 1) / nx, a0 = A0 + (A1 - A0) * j / na, a1 = A0 + (A1 - A0) * (j + 1) / na, k = GRAIN[j % GRAIN.length] * lit((a0 + a1) / 2);
    trunk(u0, a0, k); trunk(u1, a0, k); trunk(u1, a1, k);
    trunk(u0, a0, k); trunk(u1, a1, k); trunk(u0, a1, k);
  }
  // THE CUT ENDS (H4): plain pale wood, subtle rings (three thin ones a shade darker, the bark's thin edge) — round discs on the slanted saw cut
  const RINGS = [[0, 0.1, 0xdcc394], [0.1, 0.34, 0xe9d3a6], [0.34, 0.39, 0xdcc394], [0.39, 0.62, 0xe9d3a6], [0.62, 0.67, 0xdcc394], [0.67, 0.93, 0xe9d3a6], [0.93, 1, 0xa87c50]];   // (H4 — the owner: PLAIN PALE WOOD, the rings only a shade darker + thin — the banded ends read as a shell)
  for (const side of [-1, 1]) {
    const end = (q, a, hex) => put(side * (L / 2 - SL * q * R * Math.sin(a)), q * R * Math.sin(a), q * R * Math.cos(a), side * 0.12, 1, 0.42, hex, 0.74);   // (H4: the cut faces look UP at the key light — plain pale wood on both ends, never the pink rim light's sheen)
    for (const [q0, q1, hex] of RINGS) for (let j = 0; j < nc; j++) {
      const a0 = A0 + (A1 - A0) * j / nc, a1 = A0 + (A1 - A0) * (j + 1) / nc;
      if (side < 0) { end(q0, a0, hex); end(q1, a0, hex); end(q1, a1, hex); end(q0, a0, hex); end(q1, a1, hex); end(q0, a1, hex); }
      else { end(q0, a0, hex); end(q1, a1, hex); end(q1, a0, hex); end(q0, a0, hex); end(q0, a1, hex); end(q1, a1, hex); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('paint', new THREE.Float32BufferAttribute(new Float32Array(pos.length / 3), 1));
  g.computeBoundingBox();
  return g;
}
/**
 * THE BOX TRUCK (the 3-cell vehicle — H2B, the owner: "a real box truck"), built in code in the smooth style: a rounded CAB in the truck's
 * colour (paint) with dark glass, a long rounded white cargo BOX with a stripe in the truck's colour, a dark chassis, six wheels, a bumper.
 * 2.9 long along z (its nose at +z, like Kenney's cars), 0.8 wide, ≈ 1.12 tall. Its lights (head, tail, the amber markers along the box's
 * side) are the scene's light quads. TRUCK.box = where the box's side runs (z), for the markers.
 */
export const TRUCK = Object.freeze({ len: 2.9, box: [-1.36, 0.5], top: 1.12 });
export function buildTruck() {
  const dark = 0x1c1c24, glass = 0x121a2c, white = 0xe2e5f0, tyre = 0x101014, hub = 0x9aa0b4;
  const wheel = (x, z) => [{ g: new THREE.CylinderGeometry(0.17, 0.17, 0.14, 14), color: tyre, at: [x, 0.17, z], rot: [0, 0, Math.PI / 2] },
    { g: new THREE.CylinderGeometry(0.075, 0.075, 0.16, 10), color: hub, at: [x, 0.17, z], rot: [0, 0, Math.PI / 2] }];
  return build([
    { g: roundBox(0.6, 0.12, 2.78, 0.04), color: dark, at: [0, 0.25, -0.02] },                                                  // the chassis
    { g: roundBox(0.8, 0.8, 1.9, 0.1), color: white, at: [0, 0.72, -0.43], shade: y => 0.7 + y * 0.3 },                         // THE BOX
    { g: roundBox(0.815, 0.2, 1.8, 0.03), color: 0x9c9c9c, paint: 1, at: [0, 0.55, -0.43] },                                    // … its stripe
    { g: roundBox(0.7, 0.05, 0.05, 0.02), color: dark, at: [0, 0.36, -1.39] },                                                  // … its rear step
    { g: roundBox(0.74, 0.6, 0.76, 0.13), color: 0xa6a6a6, paint: 1, at: [0, 0.6, 1.04], shade: y => 0.72 + y * 0.42 },         // THE CAB
    { g: roundBox(0.64, 0.25, 0.1, 0.04), color: glass, at: [0, 0.71, 1.39] },                                                  // the windshield
    { g: roundBox(0.755, 0.22, 0.42, 0.04), color: glass, at: [0, 0.72, 1.12] },                                                // the side windows
    { g: roundBox(0.76, 0.11, 0.1, 0.04), color: 0x3b3e4c, at: [0, 0.3, 1.42] },                                                // the bumper
    { g: roundBox(0.5, 0.07, 0.34, 0.03), color: 0x8c8c8c, paint: 1, at: [0, 0.93, 0.98] },                                     // the wind deflector
    ...wheel(-0.33, 1.02), ...wheel(0.33, 1.02), ...wheel(-0.33, -0.62), ...wheel(0.33, -0.62), ...wheel(-0.33, -1.02), ...wheel(0.33, -1.02),
  ]);
}
/** THE BARRICADE (H2B): a road barricade that reads at phone size — two striped boards (orange / white) on two dark A-frame legs, a lamp
 *  on one end (its amber glow is the scene's light quad). 0.9 wide along x, ≈ 0.66 tall; the boards face the camera (z). */
export function buildBarricade() {
  const parts = [];
  for (const y of [0.47, 0.25]) for (let i = 0; i < 6; i++) parts.push({ g: roundBox(0.15, 0.14, 0.05, 0.015, 2), color: i % 2 ? 0xf4f4f8 : 0xff6418, at: [-0.375 + i * 0.15, y, 0] });
  for (const x of [-0.38, 0.38]) for (const d of [1, -1]) parts.push({ g: roundBox(0.055, 0.62, 0.055, 0.015, 2), color: 0x2b2b36, at: [x, 0.29, d * 0.1], rot: [d * 0.32, 0, 0] });
  parts.push({ g: ball(0.055, 8, 6), color: 0xffb030, at: [0.38, 0.63, 0] });
  return build(parts);
}
