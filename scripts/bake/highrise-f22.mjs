// HIGH RISE S3 — THE F-22 FOR THE SKYLINE FLYBY (docs/highrise.md "THE FLYERS"): the city's source model — "F22 Raptor FREE" by NLM
// (art/models/f22/f22_raptor_free.glb, 25 MB, CC BY 4.0; git-ignored: it lives on the build machine) — turned into a SMALL copy for the
// game: assets/highrise/models/f22.glb, in the SAME format as JAYWALK's flyers (scripts/build-jaywalk-assets.py#write_glb: ONE mesh,
// the colours baked into the vertices, positions int16 + normals int8 — KHR_mesh_quantization; read by games/jaywalk/models.js#parseGlb).
// The original is only READ.
//
//   node scripts/bake-model.mjs "<chromium>" highrise-f22            → assets/highrise/models/f22.glb (+ its numbers printed)
//
// WHAT IS DONE (the city's own bake recipe, scripts/bake/f22.mjs, does the same to the model before it renders its sprites):
//   · THE POSE: the model is animated and its gear is DOWN in the preview → the clip's end with the smallest height = gear RETRACTED;
//     the wheels + their discs (hidden inside the hull then) and the crew's boarding ladder are left out
//   · THE COLOURS: each vertex takes its base map's colour (the map re-drawn through a soft blur first: the small stencil lettering
//     goes, the panel tones stay) × its material's colour; the painted parts darkened to GUNMETAL (× 0.5 — the city's Raptor)
//   · THE SHAPE: flattened into the world, nose → +z, 1 long, its belly on y = 0, centred (as blackbird.glb); welded; thinned by
//     vertex clustering to what a ~150 pt jet on a phone needs (≤ 16,000 vertices)
import fs from 'node:fs';
import path from 'node:path';

export const MODEL = 'art/models/f22/f22_raptor_free.glb';
export const OUT = 'assets/highrise/models';
const MAX_VERTS = 16000, PAINT = 0.5;

export const page = ({ THREE }) => String.raw`<!doctype html><meta charset=utf-8><body style="margin:0;background:#000">
<script type="importmap">{"imports":{"three":"${THREE}/build/three.module.js","three/addons/":"${THREE}/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const b64 = a => { const u = new Uint8Array(a.buffer, a.byteOffset, a.byteLength); let s = ''; for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768)); return btoa(s); };
window.ready = (async () => {
  const gltf = await new GLTFLoader().loadAsync('/model.glb');
  const root = gltf.scene;
  // THE POSE: gear UP = the flattest of the clip's two ends
  const mixer = new THREE.AnimationMixer(root), acts = gltf.animations.map(c => { const a = mixer.clipAction(c); a.play(); return a; });
  const poseAt = t => { for (const a of acts) a.time = Math.min(t, a.getClip().duration - 1e-4); mixer.update(0); root.updateMatrixWorld(true); return new THREE.Box3().setFromObject(root, true).getSize(new THREE.Vector3()); };
  const ends = acts.length ? [0, Math.max(...acts.map(a => a.getClip().duration))] : [0];
  const sizes = ends.map(t => ({ t, s: poseAt(t).toArray() }));
  const flat = sizes.reduce((a, b) => (Math.min(...b.s) < Math.min(...a.s) ? b : a));
  poseAt(flat.t);
  // THE COLOURS: each base map through a soft blur → a canvas we can read
  const maps = new Map();
  const pix = m => { if (!m.map || !m.map.image) return null; if (maps.has(m.map)) return maps.get(m.map);
    const im = m.map.image, w = Math.min(1024, im.width), h = Math.min(1024, im.height), c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d', { willReadFrequently: true }); x.filter = 'blur(' + (w / 512).toFixed(2) + 'px)'; x.drawImage(im, 0, 0, w, h);
    const r = { d: x.getImageData(0, 0, w, h).data, w, h, flipY: m.map.flipY }; maps.set(m.map, r); return r; };
  const pos = [], nor = [], col = [], idx = [], left = [], kept = [];
  const v = new THREE.Vector3(), n = new THREE.Vector3(), nm = new THREE.Matrix3(), c = new THREE.Color();
  root.traverse(o => {
    if (!o.isMesh) return;
    const m = o.material;
    if (/^(material_11|Tyre|White_disk)$/.test(m.name)) { left.push(o.name + ':' + m.name); return; }
    kept.push(m.name);
    const g = o.geometry, P = g.attributes.position, N = g.attributes.normal, UV = g.attributes.uv, base = pos.length / 3, px = pix(m);
    const painted = !/glass|black|tyre|disk/i.test(m.name);
    nm.getNormalMatrix(o.matrixWorld);
    for (let i = 0; i < P.count; i++) {
      v.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld); pos.push(v.x, v.y, v.z);
      if (N) n.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); else n.set(0, 1, 0);
      nor.push(n.x, n.y, n.z);
      c.copy(m.color);   // (linear)
      if (px && UV) {
        const u = ((UV.getX(i) % 1) + 1) % 1, w2 = ((UV.getY(i) % 1) + 1) % 1, X = Math.min(px.w - 1, Math.floor(u * px.w)), Y = Math.min(px.h - 1, Math.floor((px.flipY ? 1 - w2 : w2) * px.h)), q = (Y * px.w + X) * 4;
        const t = new THREE.Color().setRGB(px.d[q] / 255, px.d[q + 1] / 255, px.d[q + 2] / 255, THREE.SRGBColorSpace); c.multiply(t);
      }
      if (painted) c.multiplyScalar(${PAINT});
      const s = new THREE.Color().copy(c).convertLinearToSRGB();
      col.push(Math.round(Math.min(1, Math.max(0, s.r)) * 255), Math.round(Math.min(1, Math.max(0, s.g)) * 255), Math.round(Math.min(1, Math.max(0, s.b)) * 255));
    }
    if (g.index) for (let i = 0; i < g.index.count; i++) idx.push(base + g.index.getX(i)); else for (let i = 0; i < P.count; i++) idx.push(base + i);
  });
  window.geo = { pos: b64(new Float32Array(pos)), nor: b64(new Float32Array(nor)), col: b64(new Uint8Array(col)), idx: b64(new Uint32Array(idx)) };
  return { verts: pos.length / 3, tris: idx.length / 3, pose: flat.t, poses: sizes, left, materials: [...new Set(kept)] };
})();
</script>`;

/** our flyers' GLB (scripts/build-jaywalk-assets.py#write_glb, in JS): 16 bytes a vertex — position int16 × 3 (normalised, × the node's scale), normal int8 × 3, a spare byte, colour u8 × 4 */
function writeGlb(file, name, P, N, C, I, copyright) {
  const nv = P.length / 3;
  let ext = 0; for (const x of P) ext = Math.max(ext, Math.abs(x));
  const q = x => Math.max(-32767, Math.min(32767, Math.round(x / ext * 32767)));
  const vb = Buffer.alloc(nv * 16), mn = [32767, 32767, 32767], mx = [-32767, -32767, -32767];
  for (let k = 0; k < nv; k++) {
    for (let a = 0; a < 3; a++) { const v = q(P[k * 3 + a]); vb.writeInt16LE(v, k * 16 + a * 2); mn[a] = Math.min(mn[a], v); mx[a] = Math.max(mx[a], v); }
    const l = Math.hypot(N[k * 3], N[k * 3 + 1], N[k * 3 + 2]) || 1;
    for (let a = 0; a < 3; a++) vb.writeInt8(Math.max(-127, Math.min(127, Math.round(N[k * 3 + a] / l * 127))), k * 16 + 8 + a);
    vb[k * 16 + 12] = C[k * 3]; vb[k * 16 + 13] = C[k * 3 + 1]; vb[k * 16 + 14] = C[k * 3 + 2]; vb[k * 16 + 15] = 255;
  }
  let ib = Buffer.alloc(I.length * 2); for (let k = 0; k < I.length; k++) ib.writeUInt16LE(I[k], k * 2);
  if (ib.length % 4) ib = Buffer.concat([ib, Buffer.alloc(4 - ib.length % 4)]);
  const j = {
    asset: { version: '2.0', generator: 'NEON SPEAKEASY scripts/bake/highrise-f22.mjs', copyright },
    extensionsUsed: ['KHR_mesh_quantization'], extensionsRequired: ['KHR_mesh_quantization'],
    scene: 0, scenes: [{ name, nodes: [0] }], nodes: [{ name, mesh: 0, scale: [ext, ext, ext] }],
    meshes: [{ name, primitives: [{ attributes: { POSITION: 0, NORMAL: 1, COLOR_0: 2 }, indices: 3, material: 0 }] }],
    materials: [{ name: 'vertex-colour', pbrMetallicRoughness: { metallicFactor: 0, roughnessFactor: 0.6 } }],
    buffers: [{ byteLength: vb.length + ib.length }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: vb.length, byteStride: 16, target: 34962 }, { buffer: 0, byteOffset: vb.length, byteLength: ib.length, target: 34963 }],
    accessors: [
      { bufferView: 0, byteOffset: 0, componentType: 5122, normalized: true, count: nv, type: 'VEC3', min: mn.map(x => x / 32767), max: mx.map(x => x / 32767) },
      { bufferView: 0, byteOffset: 8, componentType: 5120, normalized: true, count: nv, type: 'VEC3' },
      { bufferView: 0, byteOffset: 12, componentType: 5121, normalized: true, count: nv, type: 'VEC4' },
      { bufferView: 1, byteOffset: 0, componentType: 5123, count: I.length, type: 'SCALAR' },
    ],
  };
  let js = Buffer.from(JSON.stringify(j)); if (js.length % 4) js = Buffer.concat([js, Buffer.alloc(4 - js.length % 4, 0x20)]);
  const bin = Buffer.concat([vb, ib]), head = Buffer.alloc(12), h1 = Buffer.alloc(8), h2 = Buffer.alloc(8);
  head.write('glTF', 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + js.length + 8 + bin.length, 8);
  h1.writeUInt32LE(js.length, 0); h1.write('JSON', 4); h2.writeUInt32LE(bin.length, 0); h2.write('BIN\0', 4);
  fs.writeFileSync(file, Buffer.concat([head, h1, js, h2, bin]));
  return fs.statSync(file).size;
}

/** vertex clustering: every vertex in a cell of `cell` → ONE (the mean place, normal, colour); triangles that collapse are dropped */
function cluster(P, N, C, I, cell) {
  const key = new Map(), acc = [], map = new Int32Array(P.length / 3);
  for (let k = 0; k < P.length / 3; k++) {
    const id = `${Math.round(P[k * 3] / cell)},${Math.round(P[k * 3 + 1] / cell)},${Math.round(P[k * 3 + 2] / cell)},${N[k * 3 + 1] > 0.25 ? 1 : N[k * 3 + 1] < -0.25 ? -1 : 0}`;   // (the top skin and the belly of a thin wing never merge)
    let a = key.get(id);
    if (a == null) { a = acc.length; key.set(id, a); acc.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]); }
    const r = acc[a]; for (let c = 0; c < 3; c++) { r[c] += P[k * 3 + c]; r[3 + c] += N[k * 3 + c]; r[6 + c] += C[k * 3 + c]; } r[9]++;
    map[k] = a;
  }
  const p = new Float32Array(acc.length * 3), n = new Float32Array(acc.length * 3), c = new Uint8Array(acc.length * 3), idx = [], seen = new Set();
  acc.forEach((r, a) => { for (let k = 0; k < 3; k++) { p[a * 3 + k] = r[k] / r[9]; n[a * 3 + k] = r[3 + k]; c[a * 3 + k] = Math.round(r[6 + k] / r[9]); } });
  for (let t = 0; t < I.length; t += 3) {
    const a = map[I[t]], b = map[I[t + 1]], d = map[I[t + 2]];
    if (a === b || b === d || a === d) continue;
    const k = [a, b, d].sort((x, y) => x - y).join(',');
    if (seen.has(k)) continue;
    seen.add(k); idx.push(a, b, d);
  }
  return { P: p, N: n, C: c, I: idx };
}

export async function run({ page, out, ROOT, info }) {
  const g = await page.evaluate(() => window.geo), dec = (s, T) => { const b = Buffer.from(s, 'base64'); return new T(b.buffer, b.byteOffset, b.byteLength / T.BYTES_PER_ELEMENT); };
  let P = Float32Array.from(dec(g.pos, Float32Array)), N = Float32Array.from(dec(g.nor, Float32Array)), C = Uint8Array.from(dec(g.col, Uint8Array)), I = Array.from(dec(g.idx, Uint32Array));
  const nv = P.length / 3;
  // NORMALISE: the longest axis = the fuselage (→ z), the smallest = the height (→ y); the fins point UP; the nose (the end whose top is
  // LOWER — the fins stand at the tail) → +z; 1 long, the belly on y = 0, centred
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (let k = 0; k < nv; k++) for (let a = 0; a < 3; a++) { lo[a] = Math.min(lo[a], P[k * 3 + a]); hi[a] = Math.max(hi[a], P[k * 3 + a]); }
  const d = [0, 1, 2].map(a => hi[a] - lo[a]), iL = d.indexOf(Math.max(...d)), iH = d.indexOf(Math.min(...d)), iS = 3 - iL - iH, ctr = [0, 1, 2].map(a => (lo[a] + hi[a]) / 2);
  const turn = (A, centred) => { const o = new Float32Array(A.length); for (let k = 0; k < A.length / 3; k++) { const s = centred ? ctr : [0, 0, 0]; o[k * 3] = A[k * 3 + iS] - s[iS]; o[k * 3 + 1] = A[k * 3 + iH] - s[iH]; o[k * 3 + 2] = A[k * 3 + iL] - s[iL]; } return o; };
  P = turn(P, true); N = turn(N, false);
  const L = d[iL];
  const tops = () => { let tp = -9e9, tn = -9e9, top = -9e9, bot = 9e9; for (let k = 0; k < nv; k++) { const y = P[k * 3 + 1], z = P[k * 3 + 2]; if (z > 0.3 * L) tp = Math.max(tp, y); if (z < -0.3 * L) tn = Math.max(tn, y); top = Math.max(top, y); bot = Math.min(bot, y); } return { tp, tn, top, bot }; };
  let e = tops();
  const flip = (ax1, ax2) => { for (let k = 0; k < nv; k++) { P[k * 3 + ax1] *= -1; P[k * 3 + ax2] *= -1; N[k * 3 + ax1] *= -1; N[k * 3 + ax2] *= -1; } };   // (a half turn: two axes — the winding is kept)
  if (e.top < -e.bot) { flip(1, 0); e = tops(); }          // the fins up
  if (e.tp > e.tn) { flip(2, 0); e = tops(); }             // the nose → +z
  for (let k = 0; k < nv; k++) { P[k * 3] /= L; P[k * 3 + 1] = (P[k * 3 + 1] - e.bot) / L; P[k * 3 + 2] /= L; }
  // THIN IT: the smallest cell whose clusters fit
  let best = null, cell = 0.002;
  for (; cell < 0.05; cell *= 1.12) { const r = cluster(P, N, C, I, cell); if (r.P.length / 3 <= MAX_VERTS) { best = r; break; } }
  if (!best) throw new Error('the model could not be thinned');
  fs.mkdirSync(out, { recursive: true });
  const file = path.join(out, 'f22.glb');
  const size = writeGlb(file, 'f22', best.P, best.N, best.C, best.I, '"F22 Raptor FREE" by NLM (sketchfab.com/NLM-Group) — CC BY 4.0');
  const span = Math.max(...Array.from({ length: best.P.length / 3 }, (_, k) => Math.abs(best.P[k * 3]))) * 2, tall = Math.max(...Array.from({ length: best.P.length / 3 }, (_, k) => best.P[k * 3 + 1]));
  console.log(`f22.glb  ${fs.statSync(path.join(ROOT, MODEL)).size} → ${size} B · ${nv} → ${best.P.length / 3} verts · ${info.tris} → ${best.I.length / 3} tris · cell ${cell.toFixed(4)} · span ${span.toFixed(3)} × height ${tall.toFixed(3)} × 1 long (nose +z) · pose t=${info.pose} · left out: ${info.left.length} meshes (the wheels, their discs, the ladder)`);
}
