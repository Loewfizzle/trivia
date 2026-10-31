// THE HELICOPTER BAKE (THE MODELS PASS) — "Utility helicopter" by 3D Assets (art/models/helicopter/, CC0 — its site lists it as made with AI
// tools) rendered OFFLINE into the sprites THE PATROL draws (js/screens/harbor/air.js). The city is Canvas 2D: three.js lives only in this
// page (the jsDelivr CDN, pinned), never on the site. docs/harbor/passes/models.md.
//
//   node scripts/bake-model.mjs "<chromium>" heli            → assets/city/heli/heli-{day,night}.webp + heli.json
//   node scripts/bake-model.mjs "<chromium>" heli --look DIR → studio + city renders + the model's inventory (look.json)
//
// THE MODEL (Grok's notes): metres, +Y up, nose +Z, a JetRanger-style shape; its nodes 'main-rotor' (pivot 0, 3.01, 0.53 — spins about Y)
// + 'tail-rotor' (pivot 0.18, 2.20, −4.13 — spins about X) HIDDEN here: the spinning rotors are drawn live in code (their hubs projected
// into heli.json per frame); its 'rotor-spin' clip ignored. WHAT IS BAKED: the craft at YAWS steps all the way round (its heading on screen:
// 0° = the nose to the right, 90° = toward the viewer, 180° = left, 270° = away), seen a little from BELOW (the promenade looks up at it over
// the water), in TWO LIGHTS: DAY (the sun + the sky) and NIGHT — the navy paint + the dark glass sink into a dark sky, so at night a LIGHTER
// paint + the city's cool rim from above and its warm glow from below make a clear silhouette (Grok's note). The code blends them by the
// hour. Per frame: where the main rotor's hub, the tail rotor's hub, the belly lamp (the searchlight's root), the beacon + the tail light fall.
import fs from 'node:fs';
import path from 'node:path';

export const MODEL = 'art/models/helicopter/helicopter-utility-hd_3dassets-18712.glb';
export const OUT = 'assets/city/heli';
export const BAKE = { px: 200, elev: 9, yaws: 24, lights: ['day', 'night'] };   // (px: the fuselage's length — the near pass ~64 pt at 402 → ~190 px at 3×)
// points in the model's own metres (+Y up, nose +Z): the hubs (Grok's notes), the belly lamp under the cabin, the beacon on the engine deck, the tail light
export const PTS = { hub: [0, 3.01, 0.53], tail: [0.18, 2.2, -4.13], lamp: [0, 0.55, 1.7], beacon: [0, 2.55, -0.9], tailLight: [0, 2.3, -4.75], nose: [0, 1.2, 2.6], back: [0, 1.6, -4.6] };

export const page = ({ THREE }) => String.raw`<!doctype html><meta charset=utf-8><body style="margin:0;background:#000">
<script type="importmap">{"imports":{"three":"${THREE}/build/three.module.js","three/addons/":"${THREE}/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
window.ready = (async () => {
  const gltf = await new GLTFLoader().loadAsync('/model.glb');
  const root = gltf.scene, inv = { nodes: [], materials: {}, clips: gltf.animations.map(c => c.name) };
  root.traverse(o => { inv.nodes.push(o.name + (o.isMesh ? ' (mesh)' : '')); if (o.isMesh) { const m = o.material; inv.materials[m.name] = { color: m.color && m.color.getHexString(), metal: m.metalness, rough: m.roughness }; } });
  for (const n of ['main-rotor', 'tail-rotor']) { const o = root.getObjectByName(n); if (o) o.visible = false; }
  root.updateMatrixWorld(true);
  const box = new THREE.Box3(); root.traverse(o => { if (o.isMesh && o.visible) { let v = true; for (let p = o; p; p = p.parent) if (!p.visible) v = false; if (v) box.expandByObject(o); } });
  inv.box = { min: box.min.toArray().map(v => +v.toFixed(2)), max: box.max.toArray().map(v => +v.toFixed(2)) };
  const LEN = box.max.z - box.min.z;
  const mats = {}; root.traverse(o => { if (o.isMesh) mats[o.material.name] = o.material; });
  const keep = {}; for (const [k, m] of Object.entries(mats)) keep[k] = { c: m.color.clone(), metal: m.metalness, rough: m.roughness };
  // the paint per light: by day as modelled (a touch less metal: no env-mapped chrome); at night the navy lifted to a mid slate-blue + the
  // glass a little lighter, the metals matte — a silhouette that reads against the night sky, never a black hole
  window.paint = lt => { for (const [k, m] of Object.entries(mats)) { const o = keep[k]; m.color.copy(o.c); m.metalness = Math.min(0.35, o.metal); m.roughness = Math.max(0.45, o.rough);
    if (lt === 'night') { if (k === 'paint') m.color.lerp(new THREE.Color(0.32, 0.4, 0.62), 0.55); else if (k === 'glass') m.color.lerp(new THREE.Color(0.16, 0.2, 0.3), 0.6); else if (k === 'rubber') m.color.lerp(new THREE.Color(0.12, 0.13, 0.18), 0.5); }
    m.needsUpdate = true; } };
  const pivot = new THREE.Group(), holder = new THREE.Group(); holder.add(root); pivot.add(holder);
  const ctr = box.getCenter(new THREE.Vector3()); root.position.sub(ctr); holder.scale.setScalar(2 / LEN);   // (its length 2, centred)
  window.toPivot = p => new THREE.Vector3(...p).sub(ctr).multiplyScalar(2 / LEN);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
  renderer.setPixelRatio(1); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.setClearColor(0x000000, 0);
  document.body.append(renderer.domElement);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envOf = fn => { const EW = 128, EH = 64, a = new Float32Array(EW * EH * 4); for (let j = 0; j < EH; j++) for (let i = 0; i < EW; i++) { const el = (0.5 - (j + 0.5) / EH) * Math.PI, c = fn(el), p = (j * EW + i) * 4; a[p] = c[0]; a[p + 1] = c[1]; a[p + 2] = c[2]; a[p + 3] = 1; }
    const t = new THREE.DataTexture(a, EW, EH, THREE.RGBAFormat, THREE.FloatType); t.mapping = THREE.EquirectangularReflectionMapping; t.needsUpdate = true; return pmrem.fromEquirectangular(t).texture; };
  const ENV = { day: envOf(el => el > 0 ? [0.45, 0.58, 0.85] : [0.28, 0.26, 0.24]), night: envOf(el => el > 0 ? [0.06, 0.07, 0.16] : [0.2, 0.12, 0.14]) };
  const scene = new THREE.Scene(); scene.add(pivot);
  const sun = new THREE.DirectionalLight(0xffffff, 3), fill = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5), rimTop = new THREE.DirectionalLight(0xb8c4ff, 0), rimLow = new THREE.DirectionalLight(0xffb48c, 0);
  scene.add(sun, fill, rimTop, rimLow);
  const LIGHT = {
    day: () => { paint('day'); scene.environment = ENV.day; sun.color.set(0xfff4e6); sun.intensity = 3.0; sun.position.set(1.5, 5, 3); fill.color.set(0xc8dcff); fill.groundColor.set(0x6a6050); fill.intensity = 0.7; rimTop.intensity = rimLow.intensity = 0; renderer.toneMappingExposure = 1.0; },
    night: () => { paint('night'); scene.environment = ENV.night; sun.color.set(0xc8d4ff); sun.intensity = 0.9; sun.position.set(-1, 5, 2); fill.color.set(0x3a4070); fill.groundColor.set(0x8a5040); fill.intensity = 1.1;
      rimTop.intensity = 2.6; rimTop.position.set(0, 4, -3); rimLow.intensity = 1.6; rimLow.position.set(0, -4, 2); renderer.toneMappingExposure = 1.2; },
  };
  const studioEnv = pmrem.fromScene(new (await import('three/addons/environments/RoomEnvironment.js')).RoomEnvironment(), 0.04).texture;
  window.light = k => { if (k === 'studio') { paint('day'); scene.environment = studioEnv; sun.intensity = 1.2; fill.intensity = 0.3; rimTop.intensity = rimLow.intensity = 0; renderer.toneMappingExposure = 1; } else LIGHT[k](); };
  const cam = new THREE.PerspectiveCamera(10, 1, 0.1, 200), SS = 2, D = 16;
  const big = document.createElement('canvas'), bx = big.getContext('2d', { willReadFrequently: true });
  // heading psi (°): 0 = the nose to screen-right, 90 = toward the viewer, 180 = left, 270 = away — the model's nose (+Z) turned onto it
  window.shoot = ({ psi, elev, px }) => {
    const w = Math.round(px * 1.3), h = Math.round(px * 0.85), fpx = (px / 2) * D;
    renderer.setSize(w * SS, h * SS, false);
    cam.fov = 2 * Math.atan((h / 2) / fpx) * 180 / Math.PI; cam.aspect = w / h;
    const e = elev * Math.PI / 180;
    cam.position.set(0, -Math.sin(e) * D, Math.cos(e) * D); cam.up.set(0, 1, 0); cam.lookAt(0, 0.12, 0); cam.updateProjectionMatrix();
    pivot.rotation.set(0, (90 - psi) * Math.PI / 180, 0); pivot.updateMatrixWorld(true);
    renderer.render(scene, cam);
    big.width = w; big.height = h; bx.imageSmoothingEnabled = true; bx.imageSmoothingQuality = 'high'; bx.clearRect(0, 0, w, h); bx.drawImage(renderer.domElement, 0, 0, w, h);
    const P = p => { const v = window.toPivot(p).applyEuler(pivot.rotation).project(cam); return [+((v.x * 0.5 + 0.5) * w).toFixed(2), +((0.5 - v.y * 0.5) * h).toFixed(2)]; };
    return { w, h, P };
  };
  window.shootURL = (o, pts) => { const r = window.shoot(o); return { url: big.toDataURL('image/png'), w: r.w, h: r.h, pts: Object.fromEntries(Object.entries(pts).map(([k, p]) => [k, r.P(p)])) }; };
  window.shootData = (o, pts) => { const r = window.shoot(o); return { w: r.w, h: r.h, pts: Object.fromEntries(Object.entries(pts).map(([k, p]) => [k, r.P(p)])), data: Array.from(bx.getImageData(0, 0, r.w, r.h).data) }; };
  inv.len = +LEN.toFixed(3);
  return inv;
})();
</script>`;

export async function run({ page, out, look, ROOT, THREE, MODEL, info, dataUrlToBuf }) {
  if (look) {
    fs.writeFileSync(path.join(out, 'look.json'), JSON.stringify(info, null, 1));
    for (const [name, lt, psi] of [['studio-0', 'studio', 0], ['studio-45', 'studio', 45], ['day-0', 'day', 0], ['day-60', 'day', 60], ['night-0', 'night', 0], ['night-30', 'night', 30], ['night-120', 'night', 120], ['night-270', 'night', 270]]) {
      await page.evaluate(s => window.light(s), lt);
      const r = await page.evaluate((o, pts) => window.shootURL(o, pts), { psi, elev: BAKE.elev, px: 500 }, PTS);
      fs.writeFileSync(path.join(out, `look-${name}.png`), dataUrlToBuf(r.url));
      console.log(name, JSON.stringify(r.pts));
    }
    return;
  }
  // THE BAKE: every light × every heading, cropped to the union of their alpha (one frame size), a sheet per light (cols × rows)
  const N = BAKE.yaws, frames = [];
  for (const lt of BAKE.lights) {
    await page.evaluate(s => window.light(s), lt);
    for (let i = 0; i < N; i++) frames.push({ lt, i, ...(await page.evaluate((o, pts) => window.shootData(o, pts), { psi: (360 / N) * i, elev: BAKE.elev, px: BAKE.px }, PTS)) });
  }
  const { w, h } = frames[0];
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (const f of frames) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (f.data[(y * w + x) * 4 + 3] > 2) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  // (the rotor disc + the lights drawn in code reach past the body: the crop keeps a margin above for the hub)
  const m = 3; x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(w - 1, x1 + m); y1 = Math.min(h - 1, y1 + m);
  const fw = x1 - x0 + 1, fh = y1 - y0 + 1, cols = 6, rows = Math.ceil(N / cols);
  const meta = { model: MODEL, credit: fs.readFileSync(path.join(ROOT, 'art/models/helicopter/credits.txt'), 'utf8').split(/\r?\n/).find(l => /Credit line/.test(l) && /18e3c5fe/.test(l))?.replace(/^\s*Credit line\s*:\s*/, '') || 'Utility helicopter by 3D Assets (CC0)', three: THREE,
    elev: BAKE.elev, yaws: N, lights: BAKE.lights, fw, fh, cols, rows, px: BAKE.px, lenM: info.len, rotorR: 4.25, tailR: 0.65,
    frames: frames.filter(f => f.lt === BAKE.lights[0]).map(f => Object.fromEntries(Object.entries(f.pts).map(([k, p]) => [k, [+(p[0] - x0).toFixed(1), +(p[1] - y0).toFixed(1)]]))) };
  let bytes = 0;
  for (const lt of BAKE.lights) {
    const row = frames.filter(f => f.lt === lt);
    const url = await page.evaluate(({ row, w, h, x0, y0, fw, fh, cols, rows }) => {
      const c = document.createElement('canvas'); c.width = fw * cols; c.height = fh * rows; const x = c.getContext('2d');
      row.forEach((f, k) => { const id = new ImageData(new Uint8ClampedArray(f.data), w, h), t = document.createElement('canvas'); t.width = w; t.height = h; t.getContext('2d').putImageData(id, 0, 0); x.drawImage(t, x0, y0, fw, fh, (k % cols) * fw, Math.floor(k / cols) * fh, fw, fh); });
      return c.toDataURL('image/webp', 0.88);
    }, { row: row.map(f => ({ data: f.data })), w, h, x0, y0, fw, fh, cols, rows });
    const buf = dataUrlToBuf(url); fs.writeFileSync(path.join(out, `heli-${lt}.webp`), buf); bytes += buf.length;
    console.log(`heli-${lt}.webp`, (buf.length / 1024).toFixed(1), 'KB', `${fw}×${fh} a frame, ${cols}×${rows}`);
  }
  const js = JSON.stringify(meta); fs.writeFileSync(path.join(out, 'heli.json'), js); bytes += js.length;
  console.log('total', (bytes / 1024).toFixed(1), 'KB →', out);
}
