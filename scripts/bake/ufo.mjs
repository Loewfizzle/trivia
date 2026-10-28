// THE UFO BAKE — "UFO" by sebslom (art/models/ufo/, CC BY 4.0) rendered OFFLINE into the sprites the Harbor's abduction draws
// (js/screens/harbor/ufo-model.js). The city is Canvas 2D: three.js lives only in this script's page (from the jsDelivr CDN, pinned),
// never on the site. docs/harbor.md#the-ufo-bake (how to re-bake, how to swap the model).
//
//   node scripts/bake-model.mjs "<chromium>" ufo            → assets/city/ufo/{body-hi,lights-hi,body-lo,lights-lo}.webp + ufo.json
//   node scripts/bake-model.mjs "<chromium>" ufo --look DIR → the bake into DIR instead (assets untouched) + a studio / night render at
//                                                          both angles + the base map's alpha (which parts of the model are glass)
// (BNAME: THE RECIPE of the generalised bake tool, scripts/bake-model.mjs — this page + these steps moved over VERBATIM from
// scripts/bake-ufo.mjs; the re-bake is byte-for-byte the same)
//
// <chromium>: the Playwright Chromium already on the machine (…/ms-playwright/chromium-*/chrome-win64/chrome.exe) — any Chrome with WebGL.
//
// WHAT IS BAKED: a TURNTABLE of yaw frames at the city camera's real view angles on the craft — hovering it sits ~5–7° above eye level
// (seen a little from below: legends.js#hoverY against harbor-layout.js's horizon VPY), on the approach + the exit ~18–20° (the 'lo'
// row: the craft is small there, so half the pixels). Each frame in two layers:
//   BODY    the hull lit as NIGHT (the moon high behind the viewer, the city's neon glow behind + round it as rim light, the lit
//           promenade's warm fill from below; reflections of a night sky in the metal) — true to the model's own materials
//   LIGHTS  the emissive map alone (the model's own GREEN ports), occluded by the hull, on black: drawn with 'lighter'; the code dims,
//           pulses + chases them (ufo.json lists every port's position + world angle per frame)
import fs from 'node:fs';
import path from 'node:path';

export const MODEL = 'art/models/ufo/ufo-01-sebslom.glb';
export const OUT = 'assets/city/ufo';

// ---- THE NUMBERS (the craft's largest on-screen width: legends.js sizes() — min(W·0.37, 168) pt, 159 pt on a 430-pt phone; ×3 = DPR 3)
export const BAKE = {
  frames: 24,                // the turntable: yaw steps over the model's symmetry period (SPIN_PERIOD)
  hi: { elev: 6, px: 480 },  // hovering: the view angle (° below the rim's plane) + the hull's width in px (3× 160 pt)
  lo: { elev: 19, px: 240 }, // the approach + the exit (small there)
  fov: 13.5,                 // the camera's vertical FOV at the craft (F ≈ 600 pt, the hull ~150 pt: a mild perspective)
};

export const page = ({ THREE }) => String.raw`<!doctype html><meta charset=utf-8><body style="margin:0;background:#000">
<script type="importmap">{"imports":{"three":"${THREE}/build/three.module.js","three/addons/":"${THREE}/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
window.ready = (async () => {
  const gltf = await new GLTFLoader().loadAsync('/model.glb');
  const root = gltf.scene;
  root.updateMatrixWorld(true);
  let mesh = null; root.traverse(o => { if (o.isMesh) mesh = o; });
  // normalise: the thin axis up, the hull's radius 1, the rim's plane at y = 0 (its widest ring)
  const box = new THREE.Box3().setFromObject(root), size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
  const geo = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
  geo.translate(-ctr.x, -ctr.y, -ctr.z);
  const dims = [size.x, size.y, size.z], thin = dims.indexOf(Math.min(...dims));
  if (thin === 2) geo.rotateX(-Math.PI / 2); else if (thin === 0) geo.rotateZ(Math.PI / 2);
  geo.computeBoundingBox();
  const bb = geo.boundingBox, R = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) / 2;
  geo.scale(1 / R, 1 / R, 1 / R);
  const pos = geo.attributes.position;
  // the DOME up: near the axis (r < 0.35) the dome reaches further from the rim than the belly — that side is +y
  { let lo = 0, hi = 0; for (let i = 0; i < pos.count; i++) if (Math.hypot(pos.getX(i), pos.getZ(i)) < 0.35) { lo = Math.min(lo, pos.getY(i)); hi = Math.max(hi, pos.getY(i)); }
    if (-lo > hi) geo.rotateX(Math.PI); }
  // the rim's plane: the height where the hull is widest
  let best = -1, rimY = 0;
  for (let i = 0; i < pos.count; i++) { const r = Math.hypot(pos.getX(i), pos.getZ(i)); if (r > best) { best = r; rimY = pos.getY(i); } }
  geo.translate(0, -rimY, 0); geo.computeBoundingBox();
  const mat = mesh.material;
  window.info = { R, rimY, bbox: [geo.boundingBox.min.toArray(), geo.boundingBox.max.toArray()], thin, mat: { transparent: mat.transparent, alphaMode: mat.userData, emissiveIntensity: mat.emissiveIntensity, metalness: mat.metalness, roughness: mat.roughness, color: mat.color.getHex(), emissive: mat.emissive.getHex() } };

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
  renderer.setClearColor(0x000000, 0);
  document.body.append(renderer.domElement);

  // THE NIGHT the metal reflects (y up; the viewer looks along +z… the city across the water behind the craft = −z from the viewer):
  // a dark sky overhead, the city's glow low round the horizon with its neon smears, the dark street below with warm specks, the moon
  const EW = 512, EH = 256, env = new Float32Array(EW * EH * 4);
  const h01 = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const NEON = [[1, .27, .7], [.24, .82, 1], [1, .69, .27], [.75, .47, 1], [.47, 1, .67]];
  for (let j = 0; j < EH; j++) for (let i = 0; i < EW; i++) {
    const el = (0.5 - (j + 0.5) / EH) * Math.PI, az = ((i + 0.5) / EW) * Math.PI * 2 - Math.PI;
    let c;
    const sm = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
    if (el > 0) { const t = sm(0.04, 0.9, el); c = [0.11 * (1 - t) + 0.025 * t, 0.09 * (1 - t) + 0.03 * t, 0.17 * (1 - t) + 0.065 * t]; }
    else { const t = sm(0, 0.5, -el); c = [0.16 * (1 - t) + 0.09 * t, 0.12 * (1 - t) + 0.065 * t, 0.1 * (1 - t) + 0.05 * t]; }   // (the lit promenade + the street below: warm)
    const band = Math.exp(-(((el - 0.06) / 0.12) ** 2));
    c = c.map((v, k) => v + band * [0.26, 0.2, 0.3][k]);   // (the city's glow on the haze: a cool violet-grey)
    for (let k = 0; k < 14; k++) {
      const col = NEON[k % 5], a0 = -Math.PI + k * 0.45 + 0.2 * h01(k, 3), e0 = 0.02 + 0.16 * h01(k, 5);
      const da = Math.atan2(Math.sin(az - a0), Math.cos(az - a0)), w = Math.exp(-((da / 0.06) ** 2) - (((el - e0) / 0.03) ** 2));
      for (let q = 0; q < 3; q++) c[q] += col[q] * w * 3.2;
    }
    if (el < -0.03 && el > -0.6 && h01(Math.floor(az * 70), Math.floor(el * 80)) > 0.94) c = c.map((v, k) => v + [1, 0.75, 0.45][k] * 0.6);
    // the moon: high, behind the viewer on the left
    const M = [-0.42, 0.66, 0.62], ml = Math.hypot(...M), r = [Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)];
    const md = (r[0] * M[0] + r[1] * M[1] + r[2] * M[2]) / ml;
    if (md > 0.9) c = c.map((v, k) => v + [1, 0.98, 0.92][k] * (Math.exp(-((1 - md) / 0.0015)) * 14 + Math.exp(-((1 - md) / 0.02)) * 0.5));
    const p = (j * EW + i) * 4; env[p] = c[0]; env[p + 1] = c[1]; env[p + 2] = c[2]; env[p + 3] = 1;
  }
  const envTex = new THREE.DataTexture(env, EW, EH, THREE.RGBAFormat, THREE.FloatType);
  envTex.mapping = THREE.EquirectangularReflectionMapping; envTex.colorSpace = THREE.LinearSRGBColorSpace; envTex.needsUpdate = true;
  const pmrem = new THREE.PMREMGenerator(renderer), envMap = pmrem.fromEquirectangular(envTex).texture;

  const scene = new THREE.Scene();
  scene.environment = envMap;
  // the BODY's material: the model's own, its emissive off (the lights are their own layer)
  const body = mat.clone(); body.emissiveIntensity = 0; body.envMapIntensity = 1;
  // THE GLASS: the base map is opaque on the hull + the blue sphere; only the two rusty CAPS over the sphere are glass (alpha 0.88).
  // The loader draws the whole BLEND material without depth writes, so the sphere painted OVER the hull's near rim. Two passes instead:
  // the solid craft with true depth (the caps cut out: alphaTest), then the caps as faint glass over it — the sphere reads through
  // them as the model's glossy bluish dome (solid, their rust hid it)
  body.transparent = false; body.depthWrite = true; body.alphaTest = 0.95;
  const GLASS = 0.8;   // (the model says 0.88; a touch less lets the blue sphere glow through)
  const glass = mat.clone(); glass.emissiveIntensity = 0; glass.transparent = true; glass.depthWrite = false;
  glass.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>' + String.fromCharCode(10) + 'if (diffuseColor.a > 0.95) discard; diffuseColor.a *= ' + GLASS.toFixed(2) + ';'); };
  glass.customProgramCacheKey = () => 'ufo-glass';
  // the LIGHTS' material: black everywhere, the emissive map alone (its strength as the model sets it)
  const lights = new THREE.MeshBasicMaterial({ color: 0xffffff, map: mat.emissiveMap, side: THREE.DoubleSide, toneMapped: true });
  lights.color.setScalar(Math.min(1, mat.emissiveIntensity));
  // the AZIMUTH pass: each port's angle round the rim (r) + its brightness (g) — the chase's map
  const azim = new THREE.ShaderMaterial({
    uniforms: { em: { value: mat.emissiveMap } }, side: THREE.DoubleSide,
    // (the WORLD angle — the port's place round the rim as the viewer sees it this frame: the chase runs in it, so the turntable's wrap
    // from the last frame to the first never jumps the chase)
    vertexShader: 'varying vec3 vp; varying vec2 vu; void main(){ vp = (modelMatrix * vec4(position,1.)).xyz; vu = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: 'uniform sampler2D em; varying vec3 vp; varying vec2 vu; void main(){ vec3 e = texture2D(em, vu).rgb; float l = max(e.r, max(e.g, e.b)); gl_FragColor = vec4(atan(vp.z, vp.x) / 6.2831853 + 0.5, l, clamp(vp.y * 0.5 + 0.5, 0., 1.), 1.); }',
  });
  const craft = new THREE.Mesh(geo, body); scene.add(craft);
  const caps = new THREE.Mesh(geo, glass); caps.renderOrder = 1; craft.add(caps);   // (follows the craft's turn)
  const hem = new THREE.HemisphereLight(0x2a2f55, 0x3a2418, 0.5); scene.add(hem);
  const moon = new THREE.DirectionalLight(0xdfe6ff, 2.2); moon.position.set(-3, 5, 4); scene.add(moon);
  const rimM = new THREE.DirectionalLight(0xff4fb4, 3.4); rimM.position.set(-4, 0.6, -5); scene.add(rimM);
  const rimC = new THREE.DirectionalLight(0x44d8ff, 2.8); rimC.position.set(4.5, 0.4, -4); scene.add(rimC);
  const under = new THREE.DirectionalLight(0xffb070, 1.0); under.position.set(0, -5, 2); scene.add(under);
  // (--look: the model under a neutral studio light — the reference for "true to its materials")
  const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
  const studioEnv = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  window.studio = on => { scene.environment = on ? studioEnv : envMap; for (const l of [hem, moon, rimM, rimC, under]) l.visible = !on; };

  // THE CAMERA: the craft at D (in hull radii) from the viewer — the city camera's own perspective (F ≈ 600 pt for a ~150-pt hull:
  // D = 2·F/width ≈ 8), looking at the rim's centre from elev degrees below its plane. Rendered SS× and downsampled (clean edges).
  const cam = new THREE.PerspectiveCamera(1, 1, 0.1, 100), SS = 2;
  const big = document.createElement('canvas'), bx = big.getContext('2d', { willReadFrequently: true });
  function shoot({ elev, yaw, px, layer, D = 8 }) {
    const e = elev * Math.PI / 180, w = Math.round(px * 1.5), h = Math.round(px * 1.1), fpx = px * D / 2;   // (a generous frame: cropped later)
    renderer.setSize(w * SS, h * SS, false);
    cam.fov = 2 * Math.atan((h / 2) / fpx) * 180 / Math.PI; cam.aspect = w / h;
    cam.position.set(0, -Math.sin(e) * D, Math.cos(e) * D); cam.up.set(0, 1, 0); cam.lookAt(0, 0, 0); cam.updateProjectionMatrix();
    craft.rotation.set(0, yaw * Math.PI / 180, 0); craft.updateMatrixWorld(true);
    craft.material = layer === 'lights' ? lights : layer === 'azim' ? azim : body;
    caps.visible = layer === 'body';
    renderer.setClearColor(0x000000, layer === 'body' ? 0 : 1);
    renderer.toneMapping = layer === 'body' ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
    renderer.outputColorSpace = layer === 'azim' ? THREE.LinearSRGBColorSpace : THREE.SRGBColorSpace;
    renderer.render(scene, cam);
    big.width = w; big.height = h; bx.imageSmoothingEnabled = layer !== 'azim'; bx.imageSmoothingQuality = 'high';
    bx.clearRect(0, 0, w, h); bx.drawImage(renderer.domElement, 0, 0, w, h);
    const P = v => { const q = v.clone().project(cam); return [(q.x * 0.5 + 0.5) * w, (0.5 - q.y * 0.5) * h]; };
    const c0 = P(new THREE.Vector3(0, 0, 0)), cr = P(new THREE.Vector3(1, 0, 0)), cl = P(new THREE.Vector3(-1, 0, 0));
    const belly = P(new THREE.Vector3(0, geo.boundingBox.min.y, 0)), crown = P(new THREE.Vector3(0, geo.boundingBox.max.y, 0));
    return { w, h, data: bx.getImageData(0, 0, w, h), anchor: c0, rpx: (cr[0] - cl[0]) / 2, belly, crown };
  }
  window.shootURL = o => { shoot(o); return big.toDataURL('image/png'); };
  // (--look: the base map's alpha as grey, 512 px — which parts of the model are glass)
  window.alphaMap = () => { const im = mat.map.image, c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); x.drawImage(im, 0, 0, 512, 512);
    const d = x.getImageData(0, 0, 512, 512); for (let i = 0; i < d.data.length; i += 4) { const a = d.data[i + 3]; d.data[i] = d.data[i + 1] = d.data[i + 2] = a; d.data[i + 3] = 255; } x.putImageData(d, 0, 0);
    const c2 = document.createElement('canvas'); c2.width = 1024; c2.height = 512; const y = c2.getContext('2d'); y.drawImage(c, 512, 0); y.drawImage(im, 0, 0, 512, 512); return c2.toDataURL('image/png'); };
  /** THE ROW: n yaw frames over period degrees at one view angle → the atlases (WebP data URLs) + the frame meta + every port per frame */
  window.bakeRow = ({ elev, px, n, period, cols, q = 0.82 }) => {
    const fr = [];
    for (let k = 0; k < n; k++) {
      const yaw = (k / n) * period;
      const b = shoot({ elev, yaw, px, layer: 'body' }), l = shoot({ elev, yaw, px, layer: 'lights' }), a = shoot({ elev, yaw, px, layer: 'azim' });
      // THE PORTS: bright GREEN pixels in the lights' layer, flood-filled into blobs; each blob's centre (brightness-weighted), its size +
      // its world angle (the azimuth pass, a circular mean)
      const { w, h } = b, L = l.data.data, A = a.data.data, seen = new Uint8Array(w * h), ports = [];
      const isPort = p => { const r = L[p * 4], g = L[p * 4 + 1], bl = L[p * 4 + 2]; return g > 90 && g > r * 1.25 && g > bl * 1.15; };
      for (let p0 = 0; p0 < w * h; p0++) {
        if (seen[p0] || !isPort(p0)) continue;
        const st = [p0]; seen[p0] = 1; let sw = 0, sx = 0, sy = 0, cs = 0, sn = 0, cnt = 0;
        while (st.length) {
          const p = st.pop(), x = p % w, y = (p / w) | 0, g = L[p * 4 + 1] / 255;
          sw += g; sx += x * g; sy += y * g; cnt++;
          const az = (A[p * 4] / 255 - 0.5) * Math.PI * 2; cs += Math.cos(az) * g; sn += Math.sin(az) * g;
          for (const d of [-1, 1, -w, w]) { const qq = p + d; if (qq >= 0 && qq < w * h && !seen[qq] && Math.abs((qq % w) - x) <= 1 && isPort(qq)) { seen[qq] = 1; st.push(qq); } }
        }
        if (cnt >= 3) ports.push({ x: sx / sw, y: sy / sw, az: Math.atan2(sn, cs), size: Math.sqrt(cnt), lv: sw / cnt });
      }
      fr.push({ b, l, ports });
    }
    // the crop: the union of every frame's hull (alpha) + lights, a small margin
    const { w, h } = fr[0].b; let x0 = w, y0 = h, x1 = 0, y1 = 0;
    for (const f of fr) { const B = f.b.data.data, L = f.l.data.data; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const p = (y * w + x) * 4; if (B[p + 3] > 2 || L[p] + L[p + 1] + L[p + 2] > 12) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } } }
    const m = 3; x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(w - 1, x1 + m); y1 = Math.min(h - 1, y1 + m);
    const fw = x1 - x0 + 1, fh = y1 - y0 + 1, rows = Math.ceil(n / cols);
    const atlas = layer => { const c = document.createElement('canvas'); c.width = fw * cols; c.height = fh * rows; const x = c.getContext('2d');
      if (layer === 'l') { x.fillStyle = '#000'; x.fillRect(0, 0, c.width, c.height); }
      const t = document.createElement('canvas'); t.width = w; t.height = h; const tx = t.getContext('2d');
      fr.forEach((f, k) => { tx.putImageData(f[layer].data, 0, 0); x.drawImage(t, x0, y0, fw, fh, (k % cols) * fw, Math.floor(k / cols) * fh, fw, fh); });
      return c.toDataURL('image/webp', layer === 'l' ? 0.72 : q); };
    const f0 = fr[0].b, R = f0.rpx, ax = f0.anchor[0] - x0, ay = f0.anchor[1] - y0;
    // (positions in HULL RADII from the rim's centre: the code scales them by its own R)
    const u = (x, y) => [+((x - x0 - ax) / R).toFixed(4), +((y - y0 - ay) / R).toFixed(4)];
    return {
      body: atlas('b'), lights: atlas('l'),
      meta: { elev, n, period, cols, fw, fh, ax: +ax.toFixed(2), ay: +ay.toFixed(2), rpx: +R.toFixed(3),
        belly: u(...f0.belly), crown: u(...f0.crown),
        ports: fr.map(f => f.ports.map(p => [...u(p.x, p.y), +(p.az).toFixed(3), +(p.size / R).toFixed(4), +p.lv.toFixed(2)])) },
    };
  };
  return window.info;
})();
</script>`;

export async function run({ page, out, look, ROOT, THREE, dataUrlToBuf }) {
  // the model's symmetry: 12 ports + 12 radial seams round the rim → one period = 30°; the 24 frames cover it (1.25° a step: a smooth
  // spin), the code wraps the last to the first (only the worn texture's specks shift at the wrap — invisible at phone size)
  const PERIOD = 360 / 12;
  const meta = { model: 'art/models/ufo/ufo-01-sebslom.glb', credit: fs.readFileSync(path.join(ROOT, 'art/models/ufo/credits.txt'), 'utf8').trim().split(/\r?\n/), three: THREE, rows: {} };
  let bytes = 0;
  if (look) {
    for (const studio of [true, false]) for (const elev of [6, 19]) {
      await page.evaluate(s => window.studio(s), studio);
      const url = await page.evaluate(o => window.shootURL(o), { elev, yaw: 0, px: 480, layer: 'body' });
      fs.writeFileSync(path.join(out, `look-${studio ? 'studio' : 'night'}-e${elev}.png`), dataUrlToBuf(url));
    }
    await page.evaluate(() => window.studio(false));
    fs.writeFileSync(path.join(out, 'look-basemap-alpha.png'), dataUrlToBuf(await page.evaluate(() => window.alphaMap())));
  }
  for (const [id, row] of Object.entries({ hi: BAKE.hi, lo: BAKE.lo })) {
    const r = await page.evaluate(o => window.bakeRow(o), { elev: row.elev, px: row.px, n: BAKE.frames, period: PERIOD, cols: 4 });
    for (const [layer, url] of [['body', r.body], ['lights', r.lights]]) {
      const f = path.join(out, `${layer}-${id}.webp`), buf = dataUrlToBuf(url);
      fs.writeFileSync(f, buf); bytes += buf.length;
      console.log(`${layer}-${id}.webp`, (buf.length / 1024).toFixed(1), 'KB', `${r.meta.fw}×${r.meta.fh} a frame`);
    }
    meta.rows[id] = r.meta;
    console.log(`row ${id}: ports per frame`, r.meta.ports.map(p => p.length).join(' '));
  }
  const js = JSON.stringify(meta);
  fs.writeFileSync(path.join(out, 'ufo.json'), js); bytes += js.length;
  console.log('total', (bytes / 1024).toFixed(1), 'KB →', out);
}
