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
// NIGHT-A (the owner, Oct 29: "the 3D looks more real but its lighting is crappy" → RE-BAKED IN THE CITY's NIGHT LIGHT): NIGHT = a cool
// sky ambient + the new light's WASH as a warm key from the FRONT, low (the implied lamps' direction) + EACH EDISON BULB a real point light
// (the code's 25, at their 3D places on the two ledges: MODEL_SWAGS in js/screens/harbor/harvest.js) glowing onto the bales + pumpkins +
// the compass floods' warm-white RIM from low at its sides; + GOLD = the golden hour (a low warm sun from the front-left, the sky warm),
// the sprite between day + night. The code's bulbs stay on top.
export const MODEL = 'art/models/harvest/harvest-01-hunyuan.glb';
export const OUT = 'assets/city/harvest';
export const BAKE = { F: 600, CAMH: 13.2, z: 42.6, DPR: 3, SS: 2, WIDTH: 4.4, ext: { w: 3.0, y0: -1.4, y1: 4.0 }, yaw: 0, q: 0.86 };   // (its footprint is SQUARE (as deep as wide) + 0.8 as tall: 4.4 u across → 3.5 tall (the drawn display's horn tip 3.15), inside the compass's ring (6.1 across); yaw 0 = its front)

// NIGHT-A: the night's light levels (three.js physical units) + the code's 25 bulbs in the model's 3D frame (x across, y up, z toward the
// camera): the sprite fractions of MODEL_SWAGS back-projected at their ledges' depth (the bottom tier's front edge ~1.5 u in front of the
// centre, ~0.46 u up; the next ~1.0 u in front, ~1.3 u up)
export const LIGHTS = { key: 1.8, flood: 7, bulb: 0.4 };
const SWAGS = [{ y: 0.46, z: 1.5, x0: 0.142, x1: 0.866, sag: 0.02, n: 3, per: 5 }, { y: 1.3, z: 1.0, x0: 0.205, x1: 0.803, sag: 0.016, n: 2, per: 5 }];
export const BULBS = SWAGS.flatMap(sw => Array.from({ length: sw.n * sw.per }, (_, i) => { const q = Math.floor(i / sw.per), u = (i % sw.per + 0.5) / sw.per, a = sw.x0 + (sw.x1 - sw.x0) * q / sw.n, b = sw.x0 + (sw.x1 - sw.x0) * (q + 1) / sw.n, f = a + (b - a) * u;
  return [+(-3 + 6 * f).toFixed(3), +(sw.y - Math.sin(Math.PI * u) * sw.sag * 5.4 + 0.08).toFixed(3), sw.z + 0.12]; }));
const L = LIGHTS;
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
  const day = [new THREE.HemisphereLight(0xc4dcff, 0x8a7560, 1.0)], night = [new THREE.HemisphereLight(0x2a3466, 0x1a120c, 0.55)], gold = [new THREE.HemisphereLight(0xffd2a8, 0x7a5a48, 1.1)];
  { const sun = new THREE.DirectionalLight(0xfff0d8, 2.4); sun.position.set(-0.55, 0.75, 0.6); day.push(sun); }
  { const sun = new THREE.DirectionalLight(0xffb070, 3.2); sun.position.set(-0.75, 0.3, 0.6); gold.push(sun); }
  { // the wash: warm, from the front + low (the implied lamps behind the viewer, below the screen)
    const key = new THREE.DirectionalLight(0xffb46a, ${L.key}); key.position.set(0.12, 0.28, 1); night.push(key);
    // the compass floods: warm-white, low at its sides, a little behind — a rim up the edges
    for (const sx of [-1, 1]) { const f = new THREE.PointLight(0xfff0d0, ${L.flood}, 6, 2); f.position.set(sx * 2.9, 0.15, -0.5); night.push(f); }
    // the Edison bulbs — each a real point light (the bales + the pumpkins catch them)
    for (const b of ${JSON.stringify(BULBS)}) { const p = new THREE.PointLight(0xffb45c, ${L.bulb}, 1.9, 2); p.position.set(b[0], b[1], b[2]); night.push(p); }
    const glow = new THREE.DirectionalLight(0x8f6bd8, 0.35); glow.position.set(0.2, 0.35, -1); night.push(glow); }
  for (const l of [...day, ...night, ...gold]) scene.add(l);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 400);
  /** o: { yaw (deg), which ('day' | 'night'), big (a look render: 2× the size) } → { url, w, h, footX, footY } (sprite px) */
  window.shoot = o => {
    const k = B.WIDTH / Math.max(size.x, size.z);
    root.position.set(-ctr.x, -box.min.y, -ctr.z); spin.scale.setScalar(k); spin.rotation.y = (o.yaw || 0) * Math.PI / 180;
    for (const l of day) l.visible = o.which === 'day'; for (const l of night) l.visible = o.which === 'night'; for (const l of gold) l.visible = o.which === 'gold';
    renderer.toneMappingExposure = o.which === 'day' ? 0.95 : o.which === 'gold' ? 1.0 : 0.9;
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
    for (const yaw of [0, 90, 180, 270]) for (const which of ['day', 'gold', 'night']) {
      const r = await page.evaluate(o => window.shoot(o), { yaw, which, big: true, png: true });
      console.log(`look-yaw${yaw}-${which}.png`, save(`look-yaw${yaw}-${which}.png`, dataUrlToBuf(r.url)), 'bytes');
    }
    return;
  }
  const meta = { z: BAKE.z, F: BAKE.F, dpr: BAKE.DPR, ppu: +(BAKE.F / BAKE.z).toFixed(4), width: BAKE.WIDTH, yaw: BAKE.yaw };
  for (const which of ['day', 'gold', 'night']) {
    const r = await page.evaluate(o => window.shoot(o), { yaw: BAKE.yaw, which });
    console.log(`${which}.webp`, save(`${which}.webp`, dataUrlToBuf(r.url)), 'bytes', r.w, '×', r.h);
    // (HOTFIX Oct 29: + a PNG of the same frame — harvest.js falls back to it when an iPhone's WebP decode fails)
    const p = await page.evaluate(o => window.shoot(o), { yaw: BAKE.yaw, which, png: true });
    console.log(`${which}.png`, save(`${which}.png`, dataUrlToBuf(p.url)), 'bytes');
    Object.assign(meta, { w: r.w, h: r.h, footX: r.footX, footY: r.footY });
  }
  save('harvest.json', Buffer.from(JSON.stringify(meta, null, 1)));
  console.log('harvest.json', JSON.stringify(meta));
}
