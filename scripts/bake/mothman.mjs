// THE MOTHMAN BAKE (THE MODELS PASS) — Grok's two Tencent HY 3D models (art/models/mothman/, AI-generated: credits.txt) rendered OFFLINE
// into the sprites the city draws (js/screens/harbor/mothman.js). The city is Canvas 2D: three.js lives only in this page (the jsDelivr CDN,
// pinned), never on the site. docs/harbor/passes/models.md.
//
//   node scripts/bake-model.mjs "<chromium>" mothman            → assets/city/mothman/mothman-{perch,glide}.webp + mothman.json
//   node scripts/bake-model.mjs "<chromium>" mothman --look DIR → studio + city renders of both models + their inventory (look.json)
//
// THE TWO MODELS (a SWAP hidden in the needle's dark stutter, never an animation — the tucked one has no rig):
//   perch  mothman-folded-small.glb — crouched, the wings folded like a cloak (the hooked peaks above the head), the talons on the point:
//          baked at THE CITY CAMERA's view of the spire tip (seen from the street, a little below, facing us), the NIGHT light only
//          (he comes 2 → ~5 am): near-black, THE NEEDLE's PINK RIM from below + a COOL MOON EDGE from above-behind
//   glide  mothman-spread-small.glb — the wings wide, seen from BELOW + BEHIND (the REAR THREE-QUARTER: its flat wings go edge-on from the
//          side / straight below / the top — never those) for the leaving + from below-in-front (the FRONT three-quarter) for the arrival,
//          each at three banks; the code mirrors them for the other direction
// Both MESHOPT-compressed (the loader's MeshoptDecoder). The models carry KHR_materials_specular at 2.0 (a pale, shiny read in a bright
// room) → the specular + the environment turned right down: he is a silhouette with a rim, never a grey statue.
// THE EYES are NOT in the bake (both models' sockets are dark + hollow): their places in each frame are projected from EYES below
// (model space, found from the look renders) → mothman.json; the code draws the two red glows there (blinking out of sync).
import fs from 'node:fs';
import path from 'node:path';

export const MODEL = 'art/models/mothman/mothman-folded-small.glb';
export const MODELS = { perch: 'art/models/mothman/mothman-folded-small.glb', glide: 'art/models/mothman/mothman-spread-small.glb' };
export const OUT = 'assets/city/mothman';

export const BAKE = {
  perch: { px: 300, elev: 9, yaws: [0] },                        // px a model height (~70 pt × 3 = 210 + room); the camera 9° below
  glide: { px: 260, views: [{ id: 'away', yaw: 150, elev: 24, pitch: 22, eyes: false }, { id: 'toward', yaw: 35, elev: 22, pitch: 18, eyes: true }], banks: [-14, 0, 14] },
};
// the eyes' sockets in each model's NORMALISED space (height 1, the feet at y 0, centred; +z the face) — from the look renders
// the night light per model: the perch sits ON the needle (its pink right under him); the glide is away from it (the city's faint glow)
export const LIGHT = { perch: { pink: 11, moon: 7 }, glide: { pink: 2.6, moon: 8 } };
export const EYES = { perch: [[-0.016, 0.779, 0.12], [0.016, 0.779, 0.12]], glide: [[-0.013, 0.578, 0.2], [0.038, 0.578, 0.2]] };

export const page = ({ THREE }) => String.raw`<!doctype html><meta charset=utf-8><body style="margin:0;background:#000">
<script type="importmap">{"imports":{"three":"${THREE}/build/three.module.js","three/addons/":"${THREE}/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
window.ready = (async () => {
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  const M = {}, inv = {};
  for (const k of ['perch', 'glide']) {
    const g = await loader.loadAsync('/m/' + k + '.glb');
    const root = g.scene;
    const mats = {};
    root.traverse(o => { if (!o.isMesh) return; const m = o.material; mats[m.name || 'm'] = { color: m.color && m.color.getHexString(), metal: m.metalness, rough: m.roughness, spec: m.specularIntensity, specColor: m.specularColor && m.specularColor.getHexString(), map: !!m.map, normal: !!m.normalMap, side: m.side };
      if ('specularIntensity' in m) m.specularIntensity = 0.25; if (m.specularColor) m.specularColor.setScalar(1); m.envMapIntensity = 0.35; m.needsUpdate = true; });
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root, true), size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
    const holder = new THREE.Group(); holder.add(root); root.position.set(-ctr.x, -box.min.y, -ctr.z); holder.scale.setScalar(1 / size.y);
    const pivot = new THREE.Group(); pivot.add(holder); pivot.visible = false;
    M[k] = { pivot };
    inv[k] = { size: size.toArray().map(v => +v.toFixed(3)), min: box.min.toArray().map(v => +v.toFixed(3)), max: box.max.toArray().map(v => +v.toFixed(3)), mats, clips: g.animations.length };
  }
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
  renderer.setPixelRatio(1); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1; renderer.setClearColor(0x000000, 0);
  document.body.append(renderer.domElement);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const scene = new THREE.Scene(); for (const k in M) scene.add(M[k].pivot);
  // THE NIGHT: a dark city sky (a faint violet glow along the horizon below) — no bright room, so the dark texture stays dark
  const envOf = (fn) => { const EW = 128, EH = 64, a = new Float32Array(EW * EH * 4);
    for (let j = 0; j < EH; j++) for (let i = 0; i < EW; i++) { const el = (0.5 - (j + 0.5) / EH) * Math.PI, c = fn(el), p = (j * EW + i) * 4; a[p] = c[0]; a[p + 1] = c[1]; a[p + 2] = c[2]; a[p + 3] = 1; }
    const t = new THREE.DataTexture(a, EW, EH, THREE.RGBAFormat, THREE.FloatType); t.mapping = THREE.EquirectangularReflectionMapping; t.needsUpdate = true; return pmrem.fromEquirectangular(t).texture; };
  const nightEnv = envOf(el => el > 0 ? [0.02, 0.022, 0.05] : [0.12, 0.05, 0.12]);
  const studioEnv = pmrem.fromScene(new (await import('three/addons/environments/RoomEnvironment.js')).RoomEnvironment(), 0.04).texture;
  const fill = new THREE.HemisphereLight(0x2a2f55, 0x3a1030, 0.3);
  const pink = new THREE.DirectionalLight(0xff3fae, 0), moon = new THREE.DirectionalLight(0xbcd2ff, 0), key = new THREE.DirectionalLight(0xffffff, 0);
  scene.add(fill, pink, moon, key, pink.target, moon.target);
  window.light = (k, o = {}) => {
    if (k === 'studio') { scene.environment = studioEnv; key.intensity = 1.4; key.position.set(2, 4, 5); pink.intensity = moon.intensity = 0; fill.intensity = 0.4; renderer.toneMappingExposure = 1; return; }
    // night: the needle's PINK from straight below (a touch in front: it lights the shins, the hem's underside, the chin), THE MOON cool
    // from above-behind one side (a thin edge on the wing peaks + the skull), the city's violet faint all round
    scene.environment = nightEnv; key.intensity = 0;
    pink.intensity = o.pink != null ? o.pink : 11; pink.position.set(0.15, -3, 1.4);
    moon.intensity = o.moon != null ? o.moon : 7; moon.position.set(-2.4, 2.4, -2.0);
    fill.intensity = 0.9; renderer.toneMappingExposure = 1.2;
  };
  const cam = new THREE.PerspectiveCamera(10, 1, 0.1, 400), SS = 2, D = 20;
  const big = document.createElement('canvas'), bx = big.getContext('2d', { willReadFrequently: true });
  // shoot: the model k turned to face yaw (° — 0 = its face to the camera, 180 = its back), the camera elev ° BELOW it, the model banked
  // (° about its own forward axis), px = the model's height (1) in pixels; the frame square-ish round its centre (y 0.5)
  window.shoot = ({ k, yaw = 0, elev = 0, bank = 0, pitch = 0, px = 300, wf = 1.25, hf = 1.25, cy = 0.5 }) => {
    for (const n in M) M[n].pivot.visible = n === k;
    const P = M[k].pivot; P.rotation.set(pitch * Math.PI / 180, yaw * Math.PI / 180, bank * Math.PI / 180, 'YXZ');   // (pitch: the glide's forward lean — the lift-off pose tipped into flight) P.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(P, true), sz = box.getSize(new THREE.Vector3());
    // (the frame round the turned model's own box — a bank or a lean moves it off the axis; the bake's union crop trims the rest)
    const bc = box.getCenter(new THREE.Vector3()), auto = wf === 'auto';
    const span = Math.max(sz.x, sz.z, 1), w = Math.round(px * (auto ? Math.max(sz.x, sz.z) * 1.15 + 0.1 : Math.max(wf, span * 1.1))), h = Math.round(px * (auto ? Math.max(sz.y, sz.z) * 1.15 + 0.1 : hf)), fpx = px * D;
    const tx = auto ? bc.x : 0, ty = auto ? bc.y : cy;
    renderer.setSize(w * SS, h * SS, false);
    cam.fov = 2 * Math.atan((h / 2) / fpx) * 180 / Math.PI; cam.aspect = w / h;
    const e = elev * Math.PI / 180;
    cam.position.set(tx, ty - Math.sin(e) * D, Math.cos(e) * D); cam.up.set(0, 1, 0); cam.lookAt(tx, ty, 0); cam.updateProjectionMatrix();
    renderer.render(scene, cam);
    big.width = w; big.height = h; bx.imageSmoothingEnabled = true; bx.imageSmoothingQuality = 'high'; bx.clearRect(0, 0, w, h); bx.drawImage(renderer.domElement, 0, 0, w, h);
    const proj = v => { const q = new THREE.Vector3(...v).applyMatrix4(P.matrixWorld).project(cam); return [+(((q.x * 0.5 + 0.5) * w).toFixed(2)), +(((0.5 - q.y * 0.5) * h).toFixed(2))]; };
    return { w, h, proj };
  };
  window.shootURL = (o, pts = []) => { const r = window.shoot(o); return { url: big.toDataURL('image/png'), w: r.w, h: r.h, pts: pts.map(r.proj) }; };
  window.shootData = (o, pts = []) => { const r = window.shoot(o); return { w: r.w, h: r.h, pts: pts.map(r.proj), feet: r.proj([0, 0, 0]), top: r.proj([0, 1, 0]), mid: r.proj([0, 0.5, 0]), data: Array.from(bx.getImageData(0, 0, r.w, r.h).data) }; };
  return inv;
})();
</script>`;

export async function run({ page, out, look, ROOT, THREE, MODEL, info, dataUrlToBuf }) {
  if (look) {
    fs.writeFileSync(path.join(out, 'look.json'), JSON.stringify(info, null, 1));
    const shots = [
      ['perch-studio-front', 'studio', { k: 'perch', yaw: 0, elev: 0 }], ['perch-studio-side', 'studio', { k: 'perch', yaw: 90, elev: 0 }], ['perch-studio-back', 'studio', { k: 'perch', yaw: 180, elev: 0 }],
      ['perch-night', 'night', { k: 'perch', yaw: 0, elev: BAKE.perch.elev }], ['perch-face', 'studio', { k: 'perch', yaw: 0, elev: 0, px: 1400, cy: 0.78, hf: 0.3, wf: 0.4 }],
      ['glide-studio-front', 'studio', { k: 'glide', yaw: 0, elev: 0 }], ['glide-studio-side', 'studio', { k: 'glide', yaw: 90, elev: 0 }], ['glide-face', 'studio', { k: 'glide', yaw: 0, elev: 0, px: 1400, cy: 0.82, hf: 0.3, wf: 0.4 }],
      ...BAKE.glide.views.flatMap(v => BAKE.glide.banks.map(b => [`glide-${v.id}-b${b}`, 'night', { k: 'glide', yaw: v.yaw, elev: v.elev, pitch: v.pitch, bank: b, wf: 'auto' }])),
    ];
    for (const [name, lt, o] of shots) {
      await page.evaluate((s, lo) => window.light(s, lo), lt, LIGHT[o.k]);
      const eyes = EYES[o.k];
      const r = await page.evaluate((oo, pts) => window.shootURL({ px: 600, ...oo }, pts), o, eyes);
      fs.writeFileSync(path.join(out, `look-${name}.png`), dataUrlToBuf(r.url));
      console.log(name, r.w + '×' + r.h, 'eyes', JSON.stringify(r.pts));
    }
    console.log('look renders →', out);
    return;
  }
  // THE BAKE: each model's frames cropped to the union of their alpha (one frame size per model), one atlas per model (rows = views)
  const meta = { credit: 'Mothman 3D models generated with Tencent HY 3D (Hunyuan 3D V3.1, AI-generated) from images created with Grok.', three: THREE, models: MODELS };
  const sets = {
    perch: BAKE.perch.yaws.map(y => ({ row: 'perch', o: { k: 'perch', yaw: y, elev: BAKE.perch.elev, px: BAKE.perch.px } })),
    glide: BAKE.glide.views.flatMap(v => BAKE.glide.banks.map(b => ({ row: v.id, bank: b, o: { k: 'glide', yaw: v.yaw, elev: v.elev, pitch: v.pitch, bank: b, px: BAKE.glide.px, wf: 'auto' } }))),
  };
  let bytes = 0;
  for (const [k, list] of Object.entries(sets)) {
    const frames = [];
    await page.evaluate(lo => window.light('night', lo), LIGHT[k]);
    for (const f of list) frames.push({ ...f, ...(await page.evaluate((o, pts) => window.shootData(o, pts), f.o, EYES[k])) });
    const W = Math.max(...frames.map(f => f.w)), H = Math.max(...frames.map(f => f.h));
    // (frames of one model share the camera + px, so the same size — the union crop of their alpha, measured on the centred frames)
    let x0 = 1e9, y0 = 1e9, x1 = 0, y1 = 0;
    for (const f of frames) { const ox = (W - f.w) >> 1, oy = (H - f.h) >> 1; for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) if (f.data[(y * f.w + x) * 4 + 3] > 3) { x0 = Math.min(x0, x + ox); x1 = Math.max(x1, x + ox); y0 = Math.min(y0, y + oy); y1 = Math.max(y1, y + oy); } }
    const m = 3; x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(W - 1, x1 + m); y1 = Math.min(H - 1, y1 + m);
    const fw = x1 - x0 + 1, fh = y1 - y0 + 1, rows = [...new Set(frames.map(f => f.row))], cols = Math.max(...rows.map(r => frames.filter(f => f.row === r).length));
    const loc = (f, p) => [+(p[0] + ((W - f.w) >> 1) - x0).toFixed(2), +(p[1] + ((H - f.h) >> 1) - y0).toFixed(2)];
    meta[k] = { fw, fh, rows, cols, px: list[0].o.px, banks: k === 'glide' ? BAKE.glide.banks : null, views: k === 'glide' ? BAKE.glide.views : BAKE.perch,
      frames: frames.map(f => ({ row: f.row, bank: f.bank != null ? f.bank : 0, feet: loc(f, f.feet), top: loc(f, f.top), mid: loc(f, f.mid), eyes: f.pts.map(p => loc(f, p)) })) };
    const url = await page.evaluate(({ frames, W, H, x0, y0, fw, fh, rows, cols }) => {
      const c = document.createElement('canvas'); c.width = fw * cols; c.height = fh * rows.length; const x = c.getContext('2d');
      const n = {}; for (const f of frames) { const r = rows.indexOf(f.row), i = n[f.row] = (n[f.row] || 0); n[f.row]++;
        const id = new ImageData(new Uint8ClampedArray(f.data), f.w, f.h), t = document.createElement('canvas'); t.width = f.w; t.height = f.h; t.getContext('2d').putImageData(id, 0, 0);
        x.drawImage(t, x0 - ((W - f.w) >> 1), y0 - ((H - f.h) >> 1), fw, fh, i * fw, r * fh, fw, fh); }
      return c.toDataURL('image/webp', 0.9);
    }, { frames: frames.map(f => ({ row: f.row, data: f.data, w: f.w, h: f.h })), W, H, x0, y0, fw, fh, rows, cols });
    const buf = dataUrlToBuf(url); fs.writeFileSync(path.join(out, `mothman-${k}.webp`), buf); bytes += buf.length;
    console.log(`mothman-${k}.webp`, (buf.length / 1024).toFixed(1), 'KB', `${fw}×${fh} a frame, ${rows.length} rows × ${cols}`);
  }
  const js = JSON.stringify(meta); fs.writeFileSync(path.join(out, 'mothman.json'), js); bytes += js.length;
  console.log('total', (bytes / 1024).toFixed(1), 'KB →', out);
}
