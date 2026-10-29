// THE PROMENADE's STILL PIECES BAKE (PROM, Oct 28) — Grok's bench + hydrant candidates (art/models/promenade/, CC BY 4.0 — credits.txt
// in each folder) rendered OFFLINE at the city camera's REAL view + REAL size, for the owner's side-by-side against the hand-drawn pieces
// (docs/harbor/passes/prom.md). Not shipped unless a model wins the side-by-side (the hand-drawn pieces stayed — see the doc).
//
//   node scripts/bake-model.mjs "<chromium>" promenade --model art/models/promenade/bench/park_bench.glb --look DIR [--kind bench|hydrant]
//
// THE CAMERA is the city's own: a shifted lens (no tilt — every vertical stays vertical) at the eye height CAMH, the piece at its real
// depth z straight ahead (core/harbor-layout.js#project: y = VPY + F·(CAMH − y) / z), F = 600 pt (a 402 pt phone). Each look is rendered
// at the phone's DPR 3 × SS, then cut to the piece's box. KINDS: bench → its width 3.3 units (PIECE.bench), its seat facing the camera
// (yaw found by the model's own bbox + a look at four yaws); hydrant → 1.0 unit tall (HYDRANT.h); a green paint turned the city's red.
// LIGHT: DAY = the afternoon sun from the front-left + the sky; NIGHT = the IMPLIED LAMPS (core/harbor-light.js#IMPLIED: warm, from in
// front of + above the piece, behind the viewer) + the violet city glow behind as a rim.
import path from 'node:path';

export const MODEL = 'art/models/promenade/bench/park_bench.glb';
export const OUT = 'assets/city/promenade';
const CAM = { F: 600, CAMH: 13.2, DPR: 3, SS: 2 };

export const page = ({ THREE }) => String.raw`<!doctype html><meta charset=utf-8><body style="margin:0;background:#000">
<script type="importmap">{"imports":{"three":"${THREE}/build/three.module.js","three/addons/":"${THREE}/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
window.ready = (async () => {
  const gltf = await new GLTFLoader().loadAsync('/model.glb');
  const root = gltf.scene; root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root), size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
  window.info = { size: size.toArray().map(v => +v.toFixed(3)), meshes: 0, mats: [] };
  root.traverse(o => { if (o.isMesh) { window.info.meshes++; const m = o.material; if (m && !window.info.mats.includes(m.name)) window.info.mats.push(m.name); } });
  const holder = new THREE.Group(), spin = new THREE.Group(); spin.add(root); holder.add(spin);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
  renderer.setPixelRatio(1); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.setClearColor(0x000000, 0);
  document.body.append(renderer.domElement);
  const scene = new THREE.Scene(); scene.add(holder);
  const day = [new THREE.HemisphereLight(0xc4dcff, 0x8a7560, 0.9)], night = [new THREE.HemisphereLight(0x1c2148, 0x24160c, 0.3)];
  { const sun = new THREE.DirectionalLight(0xfff0d8, 2.6); sun.position.set(-0.55, 0.75, 0.6); day.push(sun); }
  { const lamp = new THREE.PointLight(0xffc488, 60, 0, 1.6); lamp.position.set(0, 5.6, 16.5); night.push(lamp);
    const glow = new THREE.DirectionalLight(0x8f6bd8, 0.6); glow.position.set(0.2, 0.3, -1); night.push(glow); }
  for (const l of [...day, ...night]) scene.add(l);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 400);
  /** o: { kind, yaw (°), which ('day' | 'night'), z (its depth), recolor (a green paint → red) } → a PNG data url of the piece's box */
  window.shoot = o => {
    const k = o.kind === 'hydrant' ? 1.0 / size.y : 3.3 / Math.max(size.x, size.z);
    root.position.set(-ctr.x, -box.min.y, -ctr.z); spin.scale.setScalar(k); spin.rotation.y = (o.yaw || 0) * Math.PI / 180;
    if (o.recolor) root.traverse(m => { if (!m.isMesh || !m.material || !m.material.color) return; const c = m.material.color, hsl = {}; c.getHSL(hsl); if (hsl.h > 0.2 && hsl.h < 0.5 && hsl.s > 0.15) { m.material = m.material.clone(); m.material.color.setHSL(0.0, Math.max(0.6, hsl.s), Math.min(0.42, hsl.l + 0.05)); if (m.material.map) { m.material.map = null; m.material.needsUpdate = true; } } });
    const d = o.which === 'day'; for (const l of day) l.visible = d; for (const l of night) l.visible = !d; renderer.toneMappingExposure = d ? 0.9 : 0.85;
    holder.updateMatrixWorld(true);
    // the city's shifted lens: the eye at (0, CAMH, z), looking straight along −z; the full frame F-based, a view offset cut to the box
    const F = ${CAM.F} * ${CAM.DPR} * ${CAM.SS}, Hf = 4000 * ${CAM.SS}, Wf = 2000 * ${CAM.SS};
    cam.position.set(0, ${CAM.CAMH}, o.z); cam.lookAt(0, ${CAM.CAMH}, o.z - 1); cam.fov = 2 * Math.atan((Hf / 2) / F) * 180 / Math.PI; cam.aspect = Wf / Hf;
    const ext = o.kind === 'hydrant' ? { w: 1.4, h: 1.4 } : { w: 4.2, h: 2.0 }, pw = Math.ceil(ext.w / o.z * F), ph = Math.ceil(ext.h / o.z * F);
    const yTop = Hf / 2 + F * (${CAM.CAMH} - ext.h * 0.92) / o.z, xLeft = Wf / 2 - pw / 2;
    cam.setViewOffset(Wf, Hf, xLeft, yTop, pw, ph); cam.updateProjectionMatrix();
    renderer.setSize(pw, ph, false); renderer.render(scene, cam);
    const out = document.createElement('canvas'); out.width = Math.round(pw / ${CAM.SS}); out.height = Math.round(ph / ${CAM.SS});
    const x = out.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(renderer.domElement, 0, 0, out.width, out.height);
    return out.toDataURL('image/png');
  };
  return window.info;
})();
</script>`;

export async function run({ page, out, save, dataUrlToBuf, MODEL: M }) {
  const kind = /hydrant/.test(M) ? 'hydrant' : 'bench', name = path.basename(M, '.glb'), recolor = /american/.test(M);
  const zs = kind === 'hydrant' ? [37.2] : [38.0, 47.8];
  for (const z of zs) for (const yaw of kind === 'hydrant' ? [0, 90, 180] : [0, 90, 180, 270]) for (const which of ['day', 'night']) {
    const url = await page.evaluate(o => window.shoot(o), { kind, yaw, which, z, recolor });
    const f = `${name}-z${z}-yaw${yaw}-${which}.png`;
    console.log(f, save(f, dataUrlToBuf(url)), 'bytes');
  }
}
