// THE SR-71 BAKE (THE MODELS PASS) — "SR-71 blackbird (FREE) downloadable" by pablogcg05 (art/models/blackbird/, CC BY 4.0) rendered OFFLINE
// into the sprites THE BLACKBIRD draws behind its ONE ART SWITCH (js/screens/harbor/blackbird.js: 'drawn' | 'model'). The city is Canvas 2D:
// three.js lives only in this page (the jsDelivr CDN, pinned), never on the site. Built from the F-22's recipe (scripts/bake/f22.mjs).
//
//   node scripts/bake-model.mjs "<chromium>" sr71            → assets/city/sr71/sr71-{day,golden,night}.webp + sr71.json
//   node scripts/bake-model.mjs "<chromium>" sr71 --look DIR → the bake into DIR + studio / city renders + the model's inventory (look.json)
//
// THE MODEL: untextured (two materials), gear up, no markings. WHAT IS BAKED: the jet in strict PROFILE seen a little from BELOW (the city's
// street looks up at it), a hair toward its near side, nose → +x, level (it never banks — it tears straight across), in THE CITY's THREE
// LIGHTS (day · golden · night: the code blends them by the hour). THE PAINT: the Blackbird's iron-ball black (a blue cast) — the model's
// greys darkened, the sky + the city's neon as its only light (the drawn one's chine highlight + the magenta rim at night).
import fs from 'node:fs';
import path from 'node:path';

export const MODEL = 'art/models/blackbird/sr-71_blackbird_free_downloadable.glb';
export const OUT = 'assets/city/sr71';

export const BAKE = {
  px: 360,                   // the fuselage's length in px (3× the Blackbird's longest, 110 pt → 330 px, + room)
  elev: 22,                  // the camera's angle BELOW the jet's plane (°): from the street, the delta's underside shows (a true profile is a needle at ~96 pt)
  yaw: 8,                    // a hair toward the viewer (°): the delta's underside + both nacelles read, never a flat needle
  rolls: [0],                // level (it never banks)
  lights: ['day', 'golden', 'night'],
};

export const page = ({ THREE }) => String.raw`<!doctype html><meta charset=utf-8><body style="margin:0;background:#000">
<script type="importmap">{"imports":{"three":"${THREE}/build/three.module.js","three/addons/":"${THREE}/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const PAINT = 0.32;
window.ready = (async () => {
  const gltf = await new GLTFLoader().loadAsync('/model.glb');
  const root = gltf.scene, inv = { meshes: [], materials: {}, clips: [], textures: [] };
  root.traverse(o => { if (o.isMesh) { inv.meshes.push({ name: o.name, verts: o.geometry.attributes.position.count, mat: o.material.name, skinned: !!o.isSkinnedMesh });
    const m = o.material; if (!inv.materials[m.name]) { inv.materials[m.name] = { color: m.color && m.color.getHexString(), metal: m.metalness, rough: m.roughness, map: !!m.map, normal: !!m.normalMap, rm: !!m.roughnessMap, em: !!m.emissiveMap, transparent: m.transparent, opacity: m.opacity };
      for (const k of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'aoMap']) if (m[k] && m[k].image) inv.textures.push({ mat: m.name, k, w: m[k].image.width, h: m[k].image.height }); } } });
  for (const c of gltf.animations) inv.clips.push({ name: c.name, dur: +c.duration.toFixed(3), tracks: c.tracks.length, nodes: [...new Set(c.tracks.map(t => t.name.split('.')[0]))].slice(0, 30) });
  // THE POSE: every clip at its start and at its end — the one with the gear UP is the flatter (the gear legs hang below the belly)
  const mixer = new THREE.AnimationMixer(root), acts = gltf.animations.map(c => { const a = mixer.clipAction(c); a.play(); return a; });
  const heightAt = t => { for (const a of acts) a.time = Math.min(t, a.getClip().duration - 1e-4); mixer.update(0); root.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(root, true); return b; };
  const ends = acts.length ? [0, Math.max(...acts.map(a => a.getClip().duration))] : [0];
  const hs = ends.map(t => { const b = heightAt(t), s = b.getSize(new THREE.Vector3()); return { t, size: s.toArray().map(v => +v.toFixed(3)) }; });
  inv.poses = hs;
  // the flattest: the smallest extent along the model's up axis (the second-smallest dimension's partner — the height is the smallest)
  const flat = hs.reduce((a, b) => (Math.min(...b.size) < Math.min(...a.size) ? b : a));
  heightAt(flat.t); inv.pose = flat.t;
  // NORMALISE: the longest axis = the fuselage (→ x), the smallest = the height (→ y), the nose → +x (the tail end carries the fins: the
  // taller end), the length 2 (−1 … 1), centred
  const box = new THREE.Box3().setFromObject(root, true), size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
  const d = [size.x, size.y, size.z], iL = d.indexOf(Math.max(...d)), iH = d.indexOf(Math.min(...d)), iS = 3 - iL - iH;
  inv.axes = { length: 'xyz'[iL], height: 'xyz'[iH], span: 'xyz'[iS], size: d.map(v => +v.toFixed(3)) };
  const pivot = new THREE.Group(), holder = new THREE.Group(); holder.add(root); pivot.add(holder);
  root.position.sub(ctr);
  // rotate so length → x, height → y
  const basis = new THREE.Matrix4(), ax = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)];
  const L = ax[iL], Hh = ax[iH], S = new THREE.Vector3().crossVectors(L, Hh);
  basis.makeBasis(L, Hh, S).invert(); holder.setRotationFromMatrix(basis);
  holder.scale.setScalar(2 / d[iL]);
  pivot.updateMatrixWorld(true);
  // the nose: of the two ends (|x| > 0.6), the one with the LOWER top is the nose (the fins stand at the tail); the up: the fins point up
  const ext = () => { let topP = -9, topN = -9, botP = 9, botN = 9, maxY = -9, minY = 9; const v = new THREE.Vector3();
    pivot.traverse(o => { if (!o.isMesh) return; const p = o.geometry.attributes.position; for (let i = 0; i < p.count; i += 3) { v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); if (v.x > 0.6) { topP = Math.max(topP, v.y); botP = Math.min(botP, v.y); } if (v.x < -0.6) { topN = Math.max(topN, v.y); botN = Math.min(botN, v.y); } maxY = Math.max(maxY, v.y); minY = Math.min(minY, v.y); } });
    return { topP, topN, botP, botN, maxY, minY }; };
  let e = ext();
  // fins up: the tail's tallest extent is above the centre line
  const tailTop = Math.max(e.topP - e.botP, e.topN - e.botN);
  const finsUp = Math.max(e.topP, e.topN) > -Math.min(e.botP, e.botN);
  if (!finsUp) { holder.rotateX(Math.PI); pivot.updateMatrixWorld(true); e = ext(); }
  if (e.topP > e.topN) { pivot.rotation.y = Math.PI; pivot.updateMatrixWorld(true); e = ext(); }
  inv.ext = Object.fromEntries(Object.entries(e).map(([k, v]) => [k, +v.toFixed(3)]));
  // THE STENCILS: every base map re-drawn through a soft blur (the lettering goes, the panel tones stay)
  const soft = new Set();
  pivot.traverse(o => { if (!o.isMesh) return; const m = o.material; if (!m.map || soft.has(m.map)) return; soft.add(m.map);
    const im = m.map.image, w = Math.min(1024, im.width), h = Math.min(1024, im.height), c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); x.filter = 'blur(' + (w / 512).toFixed(2) + 'px)'; x.drawImage(im, 0, 0, w, h);
    const t = new THREE.CanvasTexture(c); t.flipY = m.map.flipY; t.colorSpace = m.map.colorSpace; t.wrapS = m.map.wrapS; t.wrapT = m.map.wrapT; t.channel = m.map.channel; m.map = t; m.needsUpdate = true; });
  inv.softened = soft.size;
  // THE LADDER: the crew's boarding ladder hangs under the cockpit in the gear-up pose (its own material) — not on a jet in flight
  // (no boarding ladder on this model)
  // THE PAINT: the model's greys are pale (a ground-lit museum jet); a Raptor in the city is GUNMETAL (the hand-drawn one's tone —
  // "modern, real, menacing"): every painted base colour darkened, the glass + the black parts as they are
  const tinted = new Set();
  // (the Blackbird: every material to a near-black with a blue cast, a little sheen — the iron-ball paint)
  pivot.traverse(o => { if (!o.isMesh) return; const m = o.material; if (tinted.has(m)) return; tinted.add(m); const l = (m.color.r + m.color.g + m.color.b) / 3; m.color.setRGB(0.09 + 0.2 * l * PAINT, 0.1 + 0.2 * l * PAINT, 0.14 + 0.22 * l * PAINT); m.metalness = Math.min(0.6, m.metalness ?? 0.3); m.roughness = Math.max(0.45, Math.min(0.7, m.roughness ?? 0.6)); });

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
  renderer.setPixelRatio(1); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1; renderer.setClearColor(0x000000, 0);
  document.body.append(renderer.domElement);
  const pmrem = new THREE.PMREMGenerator(renderer);
  // THE CITY's LIGHTS as environments (an equirect: el > 0 the sky, el < 0 the ground) + their key lights
  const envOf = (fn) => { const EW = 256, EH = 128, a = new Float32Array(EW * EH * 4);
    for (let j = 0; j < EH; j++) for (let i = 0; i < EW; i++) { const el = (0.5 - (j + 0.5) / EH) * Math.PI, az = ((i + 0.5) / EW) * Math.PI * 2 - Math.PI, c = fn(el, az), p = (j * EW + i) * 4; a[p] = c[0]; a[p + 1] = c[1]; a[p + 2] = c[2]; a[p + 3] = 1; }
    const t = new THREE.DataTexture(a, EW, EH, THREE.RGBAFormat, THREE.FloatType); t.mapping = THREE.EquirectangularReflectionMapping; t.needsUpdate = true; return pmrem.fromEquirectangular(t).texture; };
  const sm = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  const ENV = {
    day: envOf((el) => el > 0 ? [0.32 + 0.2 * (1 - sm(0, 1, el)), 0.45 + 0.15 * (1 - sm(0, 1, el)), 0.72] : [0.22, 0.2, 0.18]),
    golden: envOf((el, az) => el > 0 ? [0.55 * (1 - sm(0, 0.8, el)) + 0.2, 0.32 * (1 - sm(0, 0.8, el)) + 0.18, 0.3 + 0.2 * sm(0, 1, el)] : [0.2, 0.13, 0.1]),
    night: envOf((el, az) => { const band = Math.exp(-(((el - 0.05) / 0.14) ** 2)); let c = el > 0 ? [0.03, 0.035, 0.08] : [0.14, 0.09, 0.06];
      c = c.map((v, k) => v + band * [0.22, 0.14, 0.3][k]); const m = Math.exp(-(((az + 1.4) / 0.5) ** 2) - (((el - 0.08) / 0.12) ** 2)), cy = Math.exp(-(((az - 1.2) / 0.5) ** 2) - (((el - 0.06) / 0.12) ** 2));
      return c.map((v, k) => v + m * [1.6, 0.3, 1.0][k] + cy * [0.2, 1.1, 1.6][k]); }),
  };
  const scene = new THREE.Scene(); scene.add(pivot);
  const sun = new THREE.DirectionalLight(0xffffff, 3), fill = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4), rimA = new THREE.DirectionalLight(0xff4fb4, 0), rimB = new THREE.DirectionalLight(0x44d8ff, 0);
  scene.add(sun, fill, rimA, rimB);
  const LIGHT = {
    day: () => { scene.environment = ENV.day; sun.color.set(0xfff6e8); sun.intensity = 3.2; sun.position.set(1.5, 6, 4); fill.color.set(0xbfd6ff); fill.groundColor.set(0x6a6050); fill.intensity = 0.6; rimA.intensity = rimB.intensity = 0; renderer.toneMappingExposure = 1.0; },
    golden: () => { scene.environment = ENV.golden; sun.color.set(0xffb070); sun.intensity = 3.4; sun.position.set(-6, 1.6, 3); fill.color.set(0xffc8a0); fill.groundColor.set(0x4a3020); fill.intensity = 0.45; rimA.intensity = rimB.intensity = 0; renderer.toneMappingExposure = 1.0; },
    night: () => { scene.environment = ENV.night; sun.color.set(0xd8e2ff); sun.intensity = 0.9; sun.position.set(-2, 6, 3); fill.color.set(0x2a2f55); fill.groundColor.set(0xffa060); fill.intensity = 0.9;
      rimA.intensity = 2.2; rimA.position.set(-5, 1, -4); rimB.intensity = 1.8; rimB.position.set(5, 0.5, -4); renderer.toneMappingExposure = 1.15; },
  };
  const studioEnv = pmrem.fromScene(new (await import('three/addons/environments/RoomEnvironment.js')).RoomEnvironment(), 0.04).texture;
  window.studio = () => { scene.environment = studioEnv; sun.intensity = 1.2; sun.position.set(2, 5, 4); fill.intensity = 0.3; rimA.intensity = rimB.intensity = 0; renderer.toneMappingExposure = 1; };
  window.light = k => LIGHT[k]();

  // THE CAMERA: beside the jet (+z), a little below (elev), a hair toward the nose's side (yaw); the jet's length 2 → px pixels
  const cam = new THREE.PerspectiveCamera(10, 1, 0.1, 200), SS = 2, D = 14;
  const big = document.createElement('canvas'), bx = big.getContext('2d', { willReadFrequently: true });
  window.shoot = ({ elev, yaw, roll, px }) => {
    const w = Math.round(px * 1.12), h = Math.round(px * 0.62), fpx = (px / 2) * D;      // (the length 2 at distance D: px wide)
    renderer.setSize(w * SS, h * SS, false);
    cam.fov = 2 * Math.atan((h / 2) / fpx) * 180 / Math.PI; cam.aspect = w / h;
    const e = elev * Math.PI / 180, y = yaw * Math.PI / 180;
    cam.position.set(Math.sin(y) * Math.cos(e) * D, -Math.sin(e) * D, Math.cos(y) * Math.cos(e) * D); cam.up.set(0, 1, 0); cam.lookAt(0, 0, 0); cam.updateProjectionMatrix();
    pivot.rotation.x = roll * Math.PI / 180;    // (the top of the jet toward the viewer at +z)
    pivot.updateMatrixWorld(true);
    renderer.render(scene, cam);
    big.width = w; big.height = h; bx.imageSmoothingEnabled = true; bx.imageSmoothingQuality = 'high'; bx.clearRect(0, 0, w, h); bx.drawImage(renderer.domElement, 0, 0, w, h);
    const P = v => { const q = v.clone().project(cam); return [(q.x * 0.5 + 0.5) * w, (0.5 - q.y * 0.5) * h]; };
    return { w, h, nose: P(new THREE.Vector3(1, 0, 0)), tail: P(new THREE.Vector3(-1, 0, 0)), c: P(new THREE.Vector3(0, 0, 0)) };
  };
  window.shootURL = o => { const r = window.shoot(o); return { url: big.toDataURL('image/png'), ...r }; };
  window.shootData = o => { const r = window.shoot(o); return { ...r, data: Array.from(bx.getImageData(0, 0, r.w, r.h).data) }; };
  window.webp = (q) => big.toDataURL('image/webp', q);
  // (--look: every mesh's box in the jet's frame — which hang below the belly: the ladder, the gear)
  window.parts = () => { const out = []; pivot.updateMatrixWorld(true); pivot.traverse(o => { if (!o.isMesh || !o.visible) return; const b = new THREE.Box3().setFromObject(o, true); out.push({ n: o.name, m: o.material.name, min: b.min.toArray().map(v => +v.toFixed(3)), max: b.max.toArray().map(v => +v.toFixed(3)) }); }); return out; };
  window.pose = t => { for (const a of acts) a.time = Math.min(t, a.getClip().duration - 1e-4); mixer.update(0); pivot.updateMatrixWorld(true); };
  window.hide = names => { pivot.traverse(o => { if (o.isMesh) o.visible = !names.includes(o.name); }); };
  return inv;
})();
</script>`;

export async function run({ page, out, look, ROOT, THREE, MODEL, info, dataUrlToBuf }) {
  if (look) {
    fs.writeFileSync(path.join(out, 'look.json'), JSON.stringify(info, null, 1));
    for (const [name, setup, o] of [['studio', 'studio', { elev: 7, yaw: 6, roll: 0 }], ['studio-top', 'studio', { elev: -60, yaw: 0, roll: 0 }], ['studio-under', 'studio', { elev: 60, yaw: 0, roll: 0 }],
      ['day', 'day', { elev: BAKE.elev, yaw: BAKE.yaw, roll: 0 }], ['golden', 'golden', { elev: BAKE.elev, yaw: BAKE.yaw, roll: 0 }], ['night', 'night', { elev: BAKE.elev, yaw: BAKE.yaw, roll: 0 }], ['night-r12', 'night', { elev: 7, yaw: 6, roll: 12 }], ['day-r12', 'day', { elev: 7, yaw: 6, roll: 12 }]]) {
      await page.evaluate(s => (s === 'studio' ? window.studio() : window.light(s)), setup);
      const r = await page.evaluate(oo => window.shootURL(oo), { ...o, px: 600 });
      fs.writeFileSync(path.join(out, `look-${name}.png`), dataUrlToBuf(r.url));
    }
    fs.writeFileSync(path.join(out, 'parts-t0.json'), JSON.stringify(await page.evaluate(() => window.parts())));
    for (const t of []) {
      await page.evaluate(tt => window.pose(tt), t); await page.evaluate(() => window.studio());
      const r = await page.evaluate(oo => window.shootURL(oo), { elev: 7, yaw: 6, roll: 0, px: 600 });
      fs.writeFileSync(path.join(out, `look-pose${t}.png`), dataUrlToBuf(r.url));
    }
    fs.writeFileSync(path.join(out, 'parts-t25.json'), JSON.stringify(await page.evaluate(() => window.parts())));
    console.log('look renders →', out);
    return;
  }
  // THE BAKE: every light × every roll, cropped to the union of their alpha (one frame size), each light one atlas row
  const frames = [];
  for (const lt of BAKE.lights) {
    await page.evaluate(s => window.light(s), lt);
    for (const roll of BAKE.rolls) frames.push({ lt, roll, ...(await page.evaluate(o => window.shootData(o), { elev: BAKE.elev, yaw: BAKE.yaw, roll, px: BAKE.px })) });
  }
  const { w, h } = frames[0];
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (const f of frames) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (f.data[(y * w + x) * 4 + 3] > 2) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const m = 2; x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(w - 1, x1 + m); y1 = Math.min(h - 1, y1 + m);
  const fw = x1 - x0 + 1, fh = y1 - y0 + 1, n = BAKE.rolls.length;
  const f0 = frames[0], lenPx = Math.hypot(f0.nose[0] - f0.tail[0], f0.nose[1] - f0.tail[1]);
  const meta = { model: MODEL, credit: fs.readFileSync(path.join(ROOT, 'art/models/blackbird/credits.txt'), 'utf8').trim().split(/\r?\n/).slice(0, 3), three: THREE, pose: info.pose,
    elev: BAKE.elev, yaw: BAKE.yaw, rolls: BAKE.rolls, lights: BAKE.lights, fw, fh, cols: n,
    // the jet's frame in the sprite: its length in px (nose ↔ tail at their centre line), the nozzle's place (the tail's point) + the nose's
    lenPx: +lenPx.toFixed(2), tail: [+(f0.tail[0] - x0).toFixed(2), +(f0.tail[1] - y0).toFixed(2)], nose: [+(f0.nose[0] - x0).toFixed(2), +(f0.nose[1] - y0).toFixed(2)] };
  let bytes = 0;
  for (const lt of BAKE.lights) {
    const row = frames.filter(f => f.lt === lt);
    const url = await page.evaluate(({ row, w, h, x0, y0, fw, fh }) => {
      const c = document.createElement('canvas'); c.width = fw * row.length; c.height = fh; const x = c.getContext('2d');
      row.forEach((f, k) => { const id = new ImageData(new Uint8ClampedArray(f.data), w, h), t = document.createElement('canvas'); t.width = w; t.height = h; t.getContext('2d').putImageData(id, 0, 0); x.drawImage(t, x0, y0, fw, fh, k * fw, 0, fw, fh); });
      return c.toDataURL('image/webp', 0.86);
    }, { row: row.map(f => ({ data: f.data })), w, h, x0, y0, fw, fh });
    const buf = dataUrlToBuf(url); fs.writeFileSync(path.join(out, `sr71-${lt}.webp`), buf); bytes += buf.length;
    console.log(`sr71-${lt}.webp`, (buf.length / 1024).toFixed(1), 'KB', `${fw}×${fh} a frame × ${n}`);
  }
  const js = JSON.stringify(meta); fs.writeFileSync(path.join(out, 'sr71.json'), js); bytes += js.length;
  console.log('total', (bytes / 1024).toFixed(1), 'KB →', out);
}
