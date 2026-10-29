// THE HARVEST DISPLAY BAKE (C4c Group 3 — the owner's Oct 28 note: "THE HARVEST DISPLAY AS A 3D MODEL — THE TEST MODEL IS IN") — Grok's
// test model (art/models/harvest/: a Grok Imagine reference → Tencent Hunyuan3D 2.1, its notes + licence in credits.txt) rendered
// OFFLINE at the city camera's REAL view of the compass + its REAL size, DAY + NIGHT, into the sprites harvest.js draws in place of its
// hand-drawn display behind the switch `&prop=model` (+ the HOLIDAYS panel row). The Edison bulbs + the floods stay CODE on top.
//
//   node scripts/bake-model.mjs "<chromium>" harvest                 → assets/city/harvest/{day,night}.webp + harvest.json
//   node scripts/bake-model.mjs "<chromium>" harvest --look DIR      → four turns (yaw 0 / 90 / 180 / 270), day, big — to find its front
//
// THE CAMERA is the city's own (as the promenade recipe): a shifted lens (every vertical stays vertical), the eye at CAMH, the piece at
// the compass's depth z straight ahead, F = 600 pt (a 402 pt phone), rendered at the phone's DPR 3 × SS then cut to the piece's box.
// SIZE: the model's widest footprint = WIDTH units; its base on the cobbles.
// LIGHT: DAY = the afternoon sun from the front-left + the sky; NIGHT = the implied lamps (warm, in front of + above it, behind the
// viewer) + the violet city glow behind as a rim. The model's FRONT faces the camera (its back is a plain hay wall — the notes).
export const MODEL = 'art/models/harvest/harvest-01-hunyuan.glb';
export const OUT = 'assets/city/harvest';
export const BAKE = { F: 600, CAMH: 13.2, z: 42.6, DPR: 3, SS: 2, WIDTH: 4.4, ext: { w: 3.0, y0: -1.4, y1: 4.0 }, yaw: 0, q: 0.86 };   // (its footprint is SQUARE (as deep as wide) + 0.8 as tall: 4.4 u across → 3.5 tall (the drawn display's horn tip 3.15), inside the compass's ring (6.1 across); yaw 0 = its front)

export const page = ({ THREE }) => String.raw`<!doctype html><meta charset=utf-8><body style="margin:0;background:#000">
<script type="importmap">{"imports":{"three":"${THREE}/build/three.module.js","three/addons/":"${THREE}/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const B = ${JSON.stringify(BAKE)};
window.ready = (async () => {
  const gltf = await new GLTFLoader().loadAsync('/model.glb');
  const root = gltf.scene; root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root), size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
  window.info = { size: size.toArray().map(v => +v.toFixed(3)), meshes: 0 };
  root.traverse(o => { if (o.isMesh) { window.info.meshes++; if (o.material) { o.material.side = THREE.FrontSide; } } });
  const spin = new THREE.Group(); spin.add(root); const holder = new THREE.Group(); holder.add(spin);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
  renderer.setPixelRatio(1); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.setClearColor(0x000000, 0);
  document.body.append(renderer.domElement);
  const scene = new THREE.Scene(); scene.add(holder);
  const day = [new THREE.HemisphereLight(0xc4dcff, 0x8a7560, 1.0)], night = [new THREE.HemisphereLight(0x1c2148, 0x24160c, 0.35)];
  { const sun = new THREE.DirectionalLight(0xfff0d8, 2.4); sun.position.set(-0.55, 0.75, 0.6); day.push(sun); }
  { for (const x of [-9, 0, 9]) { const lamp = new THREE.PointLight(0xffc488, 95, 0, 1.6); lamp.position.set(x, 5.6, 21.1); night.push(lamp); }
    const glow = new THREE.DirectionalLight(0x8f6bd8, 0.7); glow.position.set(0.2, 0.35, -1); night.push(glow); }
  for (const l of [...day, ...night]) scene.add(l);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 400);
  /** o: { yaw (deg), which ('day' | 'night'), big (a look render: 2× the size) } → { url, w, h, footX, footY } (sprite px) */
  window.shoot = o => {
    const k = B.WIDTH / Math.max(size.x, size.z);
    root.position.set(-ctr.x, -box.min.y, -ctr.z); spin.scale.setScalar(k); spin.rotation.y = (o.yaw || 0) * Math.PI / 180;
    const d = o.which === 'day'; for (const l of day) l.visible = d; for (const l of night) l.visible = !d; renderer.toneMappingExposure = d ? 0.95 : 0.9;
    holder.updateMatrixWorld(true);
    const M = o.big ? 2 : 1, F = B.F * B.DPR * B.SS * M, Hf = 4000 * B.SS * M, Wf = 2400 * B.SS * M, z = B.z;
    cam.position.set(0, B.CAMH, z); cam.lookAt(0, B.CAMH, z - 1); cam.fov = 2 * Math.atan((Hf / 2) / F) * 180 / Math.PI; cam.aspect = Wf / Hf;
    // the cut: x ±ext.w, y ext.y0 … ext.y1 at the piece's depth (the shifted lens: y_screen = Hf/2 + F·(CAMH − y)/z)
    const pw = Math.ceil(2 * B.ext.w / z * F), yTop = Hf / 2 + F * (B.CAMH - B.ext.y1) / z, yBot = Hf / 2 + F * (B.CAMH - B.ext.y0) / z, ph = Math.ceil(yBot - yTop), xLeft = Wf / 2 - pw / 2;
    cam.setViewOffset(Wf, Hf, xLeft, yTop, pw, ph); cam.updateProjectionMatrix();
    renderer.setSize(pw, ph, false); renderer.render(scene, cam);
    const out = document.createElement('canvas'); out.width = Math.round(pw / B.SS); out.height = Math.round(ph / B.SS);
    const x = out.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(renderer.domElement, 0, 0, out.width, out.height);
    // the foot: where the world point (0, 0, z) — the display's centre on the cobbles — lands in the sprite
    const footX = (Wf / 2 - xLeft) / B.SS, footY = (Hf / 2 + F * B.CAMH / z - yTop) / B.SS;
    return { url: out.toDataURL(o.png ? 'image/png' : 'image/webp', B.q), w: out.width, h: out.height, footX: +footX.toFixed(2), footY: +footY.toFixed(2) };
  };
  return window.info;
})();
</script>`;

export async function run({ page, out, look, save, dataUrlToBuf }) {
  if (look) {
    for (const yaw of [0, 90, 180, 270]) for (const which of ['day', 'night']) {
      const r = await page.evaluate(o => window.shoot(o), { yaw, which, big: true, png: true });
      console.log(`look-yaw${yaw}-${which}.png`, save(`look-yaw${yaw}-${which}.png`, dataUrlToBuf(r.url)), 'bytes');
    }
    return;
  }
  const meta = { z: BAKE.z, F: BAKE.F, dpr: BAKE.DPR, ppu: +(BAKE.F / BAKE.z).toFixed(4), width: BAKE.WIDTH, yaw: BAKE.yaw };
  for (const which of ['day', 'night']) {
    const r = await page.evaluate(o => window.shoot(o), { yaw: BAKE.yaw, which });
    console.log(`${which}.webp`, save(`${which}.webp`, dataUrlToBuf(r.url)), 'bytes', r.w, '×', r.h);
    Object.assign(meta, { w: r.w, h: r.h, footX: r.footX, footY: r.footY });
  }
  save('harvest.json', Buffer.from(JSON.stringify(meta, null, 1)));
  console.log('harvest.json', JSON.stringify(meta));
}
