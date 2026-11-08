// THE BLACK HELICOPTER BAKE (FRIENDS C — the owner, Nov 6: "spooky black government helicopter"; Grok's pick Nov 8 = the SAME model as THE
// PATROL — "Utility helicopter" by 3D Assets, CC0, art/models/helicopter/ — byte-identical to Downloads\grok\helicopter\helicopter-main.glb)
// rendered OFFLINE into the sprites js/screens/harbor/air.js draws for THE BLACK HELICOPTER (mode 'black'). The page = THE PATROL's
// (scripts/bake/heli.mjs) with its own paint + light + the ROTOR:
//   THE PAINT   EVERYTHING matte-to-satin BLACK (body, boom, fin, roof, skids; the glass dark smoked) — no insignia, no colour
//   THE LIGHT   a night sky + a COLD BLUE-WHITE RIM on its top + back edges (the silhouette reads against a night sky, never a black hole) +
//               a faint warm city glow from below
//   THE ROTOR   the main rotor ALONE baked as its own SPIN frames (6 over a quarter turn — 4 blades), each MOTION-BLURRED (sub-renders over
//               the spin step, averaged): at speed a soft dark disc with its blades' sheen flicking across. The tail rotor stays drawn
//               live (a small blurred disc on the fin, as THE PATROL's).
//   node scripts/bake-model.mjs "<chromium>" blackhelo            → assets/city/blackhelo/{blackhelo,rotor}.webp + blackhelo.json
//   node scripts/bake-model.mjs "<chromium>" blackhelo --look DIR → studio + night renders + the rotor
import fs from 'node:fs';
import path from 'node:path';

export const MODEL = 'art/models/helicopter/helicopter-utility-hd_3dassets-18712.glb';
export const OUT = 'assets/city/blackhelo';
export const BAKE = { px: 300, elev: 9, yaws: 12, lights: ['black'], spin: 6, sub: 10 };   // (px: the fuselage's length — the hover ~100 pt at 402 → 300 px at 3×; 12 headings: it turns less than the patrol — 4.8 MB decoded, loaded only while it flies)
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
  // (FRIENDS C — THE BLACK PAINT: every material near-black, matte-to-satin; the glass a dark smoked sheen; the lamps' lenses dark too —
  //  the lights are drawn live)
  window.paint = lt => { for (const [k, m] of Object.entries(mats)) { const o = keep[k]; m.color.copy(o.c); m.metalness = Math.min(0.35, o.metal); m.roughness = Math.max(0.45, o.rough);
    if (lt === 'black' || lt === 'studio-black') { if (k === 'glass') { m.color.setRGB(0.035, 0.045, 0.055); m.metalness = 0.5; m.roughness = 0.18; } else { m.color.setRGB(0.028, 0.03, 0.036); m.metalness = 0.35; m.roughness = k === 'rubber' ? 0.8 : 0.42; } if (m.emissive) m.emissive.setRGB(0, 0, 0); }
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
    // (FRIENDS C — THE BLACK HELICOPTER's night: a dark sky, the COLD RIM strong from above + behind (its top + back edges catch it), a
    //  second cool rim from behind-left, the city's warm glow faint from below; the key light low — it stays BLACK, only its edges lit)
    black: () => { paint('black'); scene.environment = ENV.night; sun.color.set(0xb8c8ff); sun.intensity = 0.35; sun.position.set(-1, 5, 2); fill.color.set(0x2a3050); fill.groundColor.set(0x6a4038); fill.intensity = 0.55;
      rimTop.color.set(0xd8e6ff); rimTop.intensity = 10; rimTop.position.set(0.6, 4, -3.2); rimLow.color.set(0xa8c0ff); rimLow.intensity = 4.5; rimLow.position.set(-3, 1.5, -2.5); renderer.toneMappingExposure = 1.35; },
    night: () => { paint('night'); scene.environment = ENV.night; sun.color.set(0xc8d4ff); sun.intensity = 0.9; sun.position.set(-1, 5, 2); fill.color.set(0x3a4070); fill.groundColor.set(0x8a5040); fill.intensity = 1.1;
      rimTop.intensity = 2.6; rimTop.position.set(0, 4, -3); rimLow.intensity = 1.6; rimLow.position.set(0, -4, 2); renderer.toneMappingExposure = 1.2; },
  };
  const studioEnv = pmrem.fromScene(new (await import('three/addons/environments/RoomEnvironment.js')).RoomEnvironment(), 0.04).texture;
  window.light = k => { if (k === 'studio' || k === 'studio-black') { paint(k === 'studio' ? 'day' : 'black'); scene.environment = studioEnv; sun.intensity = 1.2; fill.intensity = 0.3; rimTop.intensity = rimLow.intensity = 0; renderer.toneMappingExposure = 1; } else LIGHT[k](); };
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
  // THE ROTOR's spin frames: everything hidden but 'main-rotor'; each frame = SUB renders over one spin step, averaged ('lighter' at 1/sub)
  const rotorNode = root.getObjectByName('main-rotor'), hidden = [];
  window.rotorShot = ({ i, spin, sub, psi, elev, px }, hubPt) => {
    root.traverse(o => { if (o.isMesh) { let inRotor = false; for (let p = o; p; p = p.parent) if (p === rotorNode) inRotor = true; if (!inRotor && o.visible) { o.visible = false; hidden.push(o); } } });
    rotorNode.visible = true;
    const base = rotorNode.rotation.y, out = document.createElement('canvas'), ox = out.getContext('2d');
    let r = null;
    for (let j = 0; j < sub; j++) {
      rotorNode.rotation.y = base + ((i + j / sub) / spin) * (Math.PI / 2);
      r = window.shoot({ psi, elev, px });
      if (j === 0) { out.width = r.w; out.height = r.h; ox.globalCompositeOperation = 'lighter'; }
      ox.globalAlpha = 1 / sub; ox.drawImage(big, 0, 0);
    }
    rotorNode.rotation.y = base; rotorNode.visible = false; for (const o of hidden) o.visible = true; hidden.length = 0;
    return { url: out.toDataURL('image/png'), w: r.w, h: r.h, hub: r.P(hubPt) };
  };
  inv.len = +LEN.toFixed(3);
  return inv;
})();
</script>`;

export async function run({ page, out, look, ROOT, MODEL, info, dataUrlToBuf }) {
  if (look) {
    fs.writeFileSync(path.join(out, 'look.json'), JSON.stringify(info, null, 1));
    for (const [name, lt, psi] of [['studio-0', 'studio-black', 0], ['black-0', 'black', 0], ['black-35', 'black', 35], ['black-145', 'black', 145], ['black-90', 'black', 90], ['black-270', 'black', 270]]) {
      await page.evaluate(s => window.light(s), lt);
      const r = await page.evaluate((o, pts) => window.shootURL(o, pts), { psi, elev: BAKE.elev, px: 500 }, PTS);
      fs.writeFileSync(path.join(out, `look-${name}.png`), dataUrlToBuf(r.url));
    }
    await page.evaluate(s => window.light(s), 'black');
    for (let i = 0; i < 2; i++) { const r = await page.evaluate((o, hub) => window.rotorShot(o, hub), { i, spin: BAKE.spin, sub: BAKE.sub, psi: 0, elev: BAKE.elev, px: 500 }, PTS.hub); fs.writeFileSync(path.join(out, `look-rotor-${i}.png`), dataUrlToBuf(r.url)); }
    return;
  }
  // THE BAKE: every heading in the black light, cropped to the union of their alpha (one frame size), one sheet (cols × rows)
  const N = BAKE.yaws, frames = [];
  await page.evaluate(s => window.light(s), 'black');
  for (let i = 0; i < N; i++) frames.push({ i, ...(await page.evaluate((o, pts) => window.shootData(o, pts), { psi: (360 / N) * i, elev: BAKE.elev, px: BAKE.px }, PTS)) });
  const { w, h } = frames[0];
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (const f of frames) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (f.data[(y * w + x) * 4 + 3] > 2) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const m = 3; x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(w - 1, x1 + m); y1 = Math.min(h - 1, y1 + m);
  const fw = x1 - x0 + 1, fh = y1 - y0 + 1, cols = 4, rows = Math.ceil(N / cols);
  const url = await page.evaluate(({ row, w, h, x0, y0, fw, fh, cols, rows }) => {
    const c = document.createElement('canvas'); c.width = fw * cols; c.height = fh * rows; const x = c.getContext('2d');
    row.forEach((f, k) => { const id = new ImageData(new Uint8ClampedArray(f.data), w, h), t = document.createElement('canvas'); t.width = w; t.height = h; t.getContext('2d').putImageData(id, 0, 0); x.drawImage(t, x0, y0, fw, fh, (k % cols) * fw, Math.floor(k / cols) * fh, fw, fh); });
    return c.toDataURL('image/webp', 0.9);
  }, { row: frames.map(f => ({ data: f.data })), w, h, x0, y0, fw, fh, cols, rows });
  let bytes = 0;
  { const buf = dataUrlToBuf(url); fs.writeFileSync(path.join(out, 'blackhelo.webp'), buf); bytes += buf.length; console.log('blackhelo.webp', (buf.length / 1024).toFixed(1), 'KB', `${fw}×${fh} a frame, ${cols}×${rows}`); }
  // THE ROTOR: BAKE.spin motion-blurred frames at heading 0 (a disc from below looks the same at every heading), cropped round the disc, one strip
  const R = [];
  for (let i = 0; i < BAKE.spin; i++) R.push(await page.evaluate((o, hub) => window.rotorShot(o, hub), { i, spin: BAKE.spin, sub: BAKE.sub, psi: 0, elev: BAKE.elev, px: BAKE.px }, PTS.hub));
  const strip = await page.evaluate(async ({ urls, w, h }) => {
    const ims = await Promise.all(urls.map(u => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = u; })));
    const t = document.createElement('canvas'); t.width = w; t.height = h; const tx = t.getContext('2d', { willReadFrequently: true });
    let x0 = w, y0 = h, x1 = 0, y1 = 0;
    for (const im of ims) { tx.clearRect(0, 0, w, h); tx.drawImage(im, 0, 0); const d = tx.getImageData(0, 0, w, h).data; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 1) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
    x0 = Math.max(0, x0 - 2); y0 = Math.max(0, y0 - 2); x1 = Math.min(w - 1, x1 + 2); y1 = Math.min(h - 1, y1 + 2);
    const fw = x1 - x0 + 1, fh = y1 - y0 + 1, c = document.createElement('canvas'); c.width = fw * ims.length; c.height = fh; const cx = c.getContext('2d');
    ims.forEach((im, k) => cx.drawImage(im, x0, y0, fw, fh, k * fw, 0, fw, fh));
    return { url: c.toDataURL('image/webp', 0.9), x0, y0, fw, fh };
  }, { urls: R.map(r => r.url), w: R[0].w, h: R[0].h });
  { const buf = dataUrlToBuf(strip.url); fs.writeFileSync(path.join(out, 'rotor.webp'), buf); bytes += buf.length; console.log('rotor.webp', (buf.length / 1024).toFixed(1), 'KB', `${strip.fw}×${strip.fh} a frame × ${BAKE.spin}`); }
  const meta = { model: MODEL, credit: '"Utility helicopter" by 3D Assets (3dassets.dev), CC0 1.0', paint: 'black', elev: BAKE.elev, yaws: N, lights: ['black'], fw, fh, cols, rows, px: BAKE.px, lenM: info.len, rotorR: 4.25, tailR: 0.65,
    frames: frames.map(f => Object.fromEntries(Object.entries(f.pts).map(([k, p]) => [k, [+(p[0] - x0).toFixed(1), +(p[1] - y0).toFixed(1)]]))),
    rotor: { n: BAKE.spin, fw: strip.fw, fh: strip.fh, hub: [+(R[0].hub[0] - strip.x0).toFixed(1), +(R[0].hub[1] - strip.y0).toFixed(1)] } };
  const js = JSON.stringify(meta); fs.writeFileSync(path.join(out, 'blackhelo.json'), js); bytes += js.length;
  console.log('total', (bytes / 1024).toFixed(1), 'KB →', out);
}
