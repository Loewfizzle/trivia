// THE CRANE BAKE (BNAME, Oct 28) — "Crane" by J-Toastie (art/models/crane/, CC BY 3.0, poly.pizza) rendered OFFLINE into the sprites
// the construction tower's crane draws (js/screens/harbor/crane-model.js). docs/harbor.md#bname.
//
//   node scripts/bake-model.mjs "<chromium>" crane            → assets/city/crane/{top,mast}.webp + crane.json
//   node scripts/bake-model.mjs "<chromium>" crane --look DIR → the bake into DIR + look renders (the whole crane, day + night, big)
//
// WHAT IS BAKED, at the city camera's real view of the slot (core/harbor-layout.js: the crane's top sits ~95 pt above the horizon at
// F ≈ 600 → seen ~9° from below, so far away the perspective is nearly flat):
//   TOP    the SLEWING part — the jib, the counter-jib + its counterweight, the cab, the tower head, the trolley + the hook block — cut
//          from the mast at the slewing line (where the model widens above the mast: the cab), in SLEW frames over the swing the code
//          plays (±66° about broadside, 1° a step — 9g: the code draws the NEAREST frame whole, never two blended), each as DAY + NIGHT (two atlases, the same
//          silhouette: the code blends them by the darkness). Per frame: the anchor (the mast's axis at the slewing line) + the tower
//          head's apex + the jib's tip (the two red beacons stay CODE, on the skyline's own pulse).
//   MAST   the lattice below the slewing line (it never turns): a HEAD strip from the slewing line down + a seamless TILE (whole
//          lattice periods, found by the strip's own autocorrelation) the code repeats down to the roofs in front, DAY + NIGHT.
// LIGHT from the city, never a studio: DAY = the Harbor's afternoon sun from the front-left + the sky's blue above, the warm street
//   below; NIGHT = a dark violet sky, the city's glow behind as a rim, THE SITE's WORK FLOODS (9f) from the deck below — warm light up
//   the mast + under the jib.
// SCALE: 1 unit = the jib (the slew axis → the tip); JIB_PX px per unit = 33 pt at DPR 3 (the code draws it at 24·s pt — 9e's size).
import fs from 'node:fs';
import path from 'node:path';

export const MODEL = 'art/models/crane/crane-01-jtoastie.glb';
export const OUT = 'assets/city/crane';
export const BAKE = { jibPx: 100, elev: 9, slew: [-66, 66], step: 1, mastYaw: 34, SS: 4, q: 0.82 };   // (9g: 1° a step — the code draws the NEAREST frame whole)

export const page = ({ THREE }) => String.raw`<!doctype html><meta charset=utf-8><body style="margin:0;background:#000">
<script type="importmap">{"imports":{"three":"${THREE}/build/three.module.js","three/addons/":"${THREE}/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
window.ready = (async () => {
  const gltf = await new GLTFLoader().loadAsync('/model.glb');
  const root = gltf.scene;
  root.updateMatrixWorld(true);
  // every vertex in world space (the model's own frame): the axis, the jib, the slewing line are measured on them
  const pts = [];
  root.traverse(o => { if (!o.isMesh) return; const p = o.geometry.attributes.position, v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); pts.push(v.x, v.y, v.z); } });
  const box = new THREE.Box3().setFromObject(root), H = box.max.y - box.min.y, y0 = box.min.y;
  const each = fn => { for (let i = 0; i < pts.length; i += 3) fn(pts[i], pts[i + 1], pts[i + 2]); };
  // THE MAST's AXIS: the middle of the vertices low on the mast (15–45 % up: the mast alone there)
  let ax0 = 1e9, ax1 = -1e9, az0 = 1e9, az1 = -1e9;
  each((x, y, z) => { const u = (y - y0) / H; if (u > 0.15 && u < 0.45) { ax0 = Math.min(ax0, x); ax1 = Math.max(ax1, x); az0 = Math.min(az0, z); az1 = Math.max(az1, z); } });
  const cx = (ax0 + ax1) / 2, cz = (az0 + az1) / 2, mastR = Math.max(ax1 - ax0, az1 - az0) / 2;
  // THE JIB: the farthest point from the axis high up (the tip); the counter-jib points the other way
  let far = 0, dir = 0;
  each((x, y, z) => { if ((y - y0) / H < 0.6) return; const r = Math.hypot(x - cx, z - cz); if (r > far) { far = r; dir = Math.atan2(z - cz, x - cx); } });
  // THE SLEWING LINE: going up the mast, the first slice that reaches well past the mast's own radius (the cab, the slewing unit)
  const N = 200, sliceR = new Float32Array(N);
  each((x, y, z) => { const k = Math.min(N - 1, Math.floor(((y - y0) / H) * N)); sliceR[k] = Math.max(sliceR[k], Math.hypot(x - cx, z - cz)); });
  let cutK = N - 1;
  for (let k = Math.floor(N * 0.45); k < N; k++) if (sliceR[k] > mastR * 1.6) { cutK = k; break; }
  const yCutM = y0 + (cutK / N) * H - H * 0.004;
  // normalise: the axis at x = z = 0, the slewing line at y = 0, the jib along +x, 1 unit = the jib
  const S = 1 / far;
  root.position.set(0, 0, 0);
  const pivot = new THREE.Group(); pivot.add(root);
  root.position.set(-cx, -yCutM, -cz);
  const spin = new THREE.Group(); spin.add(pivot); spin.rotation.y = dir; spin.scale.setScalar(S);
  const holder = new THREE.Group(); holder.add(spin);
  holder.updateMatrixWorld(true);
  // the measures in jib units
  const toN = (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(root.matrixWorld);   // (the vertices were read with the root at the origin)
  let tip = null, apex = null, low = 0;
  each((x, y, z) => { const p = toN(x, y, z); if (!tip || p.x > tip.x) tip = p; if (Math.hypot(p.x, p.z) < mastR * S * 2.2 && (!apex || p.y > apex.y)) apex = p; low = Math.min(low, p.y); });
  window.info = { H, meshes: 0, mastR: +(mastR * S).toFixed(4), cut: +((yCutM - y0) / H).toFixed(3), far, tip: tip.toArray().map(v => +v.toFixed(3)), apex: apex.toArray().map(v => +v.toFixed(3)), low: +low.toFixed(3) };
  root.traverse(o => { if (o.isMesh) window.info.meshes++; });

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
  renderer.localClippingEnabled = true;
  renderer.setClearColor(0x000000, 0);
  document.body.append(renderer.domElement);
  const scene = new THREE.Scene(); scene.add(holder);
  // the clip at the slewing line: TOP keeps y > 0, MAST keeps y < 0
  const keepTop = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), keepMast = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
  const mats = [];
  root.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.side = THREE.DoubleSide; mats.push(o.material); } });
  const clipTo = pl => { for (const m of mats) { m.clippingPlanes = pl ? [pl] : []; m.needsUpdate = true; } };

  // THE CITY's LIGHT (an environment for the metal + lights), DAY and NIGHT
  const envOf = (sky, horizon, ground) => {
    const EW = 256, EH = 128, d = new Float32Array(EW * EH * 4);
    for (let j = 0; j < EH; j++) for (let i = 0; i < EW; i++) {
      const el = (0.5 - (j + 0.5) / EH) * Math.PI, t = el > 0 ? Math.min(1, el / 0.9) : Math.min(1, -el / 0.5);
      const c = el > 0 ? horizon.map((v, k) => v * (1 - t) + sky[k] * t) : horizon.map((v, k) => v * (1 - t) + ground[k] * t);
      const p = (j * EW + i) * 4; d[p] = c[0]; d[p + 1] = c[1]; d[p + 2] = c[2]; d[p + 3] = 1;
    }
    const tx = new THREE.DataTexture(d, EW, EH, THREE.RGBAFormat, THREE.FloatType);
    tx.mapping = THREE.EquirectangularReflectionMapping; tx.colorSpace = THREE.LinearSRGBColorSpace; tx.needsUpdate = true;
    return new THREE.PMREMGenerator(renderer).fromEquirectangular(tx).texture;
  };
  const envDay = envOf([0.18, 0.36, 0.8], [0.7, 0.78, 0.86], [0.32, 0.27, 0.22]);
  const envNight = envOf([0.012, 0.012, 0.035], [0.08, 0.05, 0.12], [0.06, 0.04, 0.03]);
  const day = [new THREE.HemisphereLight(0xc4dcff, 0x8a7560, 0.8)], night = [new THREE.HemisphereLight(0x1c2148, 0x24160c, 0.22)];
  { const sun = new THREE.DirectionalLight(0xfff0d8, 2.8); sun.position.set(-0.55, 0.75, 0.6); day.push(sun);
    const fill = new THREE.DirectionalLight(0xbcd2ff, 0.35); fill.position.set(0.7, 0.2, 0.5); day.push(fill); }
  { // the work floods on the deck below + the city's glow behind
    const flood = new THREE.PointLight(0xffb468, 1.0, 0, 1.6); flood.position.set(0.12, -0.55, 0.35); night.push(flood);
    const flood2 = new THREE.PointLight(0xffc27a, 0.5, 0, 1.6); flood2.position.set(0.55, -0.4, 0.25); night.push(flood2);
    const glow = new THREE.DirectionalLight(0x8f6bd8, 0.55); glow.position.set(0.2, 0.15, -1); night.push(glow);
    const front = new THREE.DirectionalLight(0x6f78b0, 0.12); front.position.set(-0.3, 0.3, 1); night.push(front); }
  for (const l of [...day, ...night]) scene.add(l);
  const light = which => { const d = which === 'day'; for (const l of day) l.visible = d; for (const l of night) l.visible = !d; scene.environment = d ? envDay : envNight; scene.environmentIntensity = d ? DAY_ENV : NIGHT_ENV; renderer.toneMappingExposure = d ? 0.82 : 0.72; };
  const DAY_ENV = 0.45, NIGHT_ENV = 0.3;

  // THE CAMERA: far + narrow (the slot is ~470 units away at F 600: nearly flat), looking at the slewing line from elev ° below
  const cam = new THREE.PerspectiveCamera(1, 1, 0.1, 200), D = 40;
  const big = document.createElement('canvas'), bx = big.getContext('2d', { willReadFrequently: true });
  function shoot({ elev, slew, px, w, h, which, part, ox = 0, oy = 0 }) {
    const SS = ${BAKE.SS};
    light(which); clipTo(part === 'top' ? keepTop : part === 'mast' ? keepMast : null);
    spin.rotation.y = dir + slew * Math.PI / 180; holder.updateMatrixWorld(true);
    const e = elev * Math.PI / 180, fpx = px * D;
    renderer.setSize(w * SS, h * SS, false);
    cam.fov = 2 * Math.atan((h / 2) / fpx) * 180 / Math.PI; cam.aspect = w / h;
    cam.position.set(0, -Math.sin(e) * D + oy, Math.cos(e) * D); cam.up.set(0, 1, 0); cam.lookAt(0, oy, 0);
    cam.clearViewOffset(); if (ox) cam.setViewOffset(w, h, ox, 0, w, h);
    cam.updateProjectionMatrix();
    renderer.render(scene, cam);
    big.width = w; big.height = h; bx.imageSmoothingEnabled = true; bx.imageSmoothingQuality = 'high';
    bx.clearRect(0, 0, w, h); bx.drawImage(renderer.domElement, 0, 0, w, h);
    const P = v => { const q = v.clone().project(cam); return [(q.x * 0.5 + 0.5) * w, (0.5 - q.y * 0.5) * h]; };
    // (the apex + the tip turn with the slew: their places this frame)
    const rot = v => v.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), slew * Math.PI / 180);
    return { w, h, data: bx.getImageData(0, 0, w, h), anchor: P(new THREE.Vector3(0, 0, 0)), apex: P(rot(apex)), tip: P(rot(tip)) };
  }
  window.shootURL = o => { shoot(o); return big.toDataURL('image/png'); };
  // the union crop of frames (alpha > 2), a margin
  const crop = (frames, m = 2) => {
    const { w, h } = frames[0]; let x0 = w, y0 = h, x1 = 0, y1 = 0;
    for (const f of frames) { const A = f.data.data; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (A[(y * w + x) * 4 + 3] > 2) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
    return { x0: Math.max(0, x0 - m), y0: Math.max(0, y0 - m), x1: Math.min(w - 1, x1 + m), y1: Math.min(h - 1, y1 + m) };
  };
  const atlasOf = (frames, c, cols, q) => {
    const fw = c.x1 - c.x0 + 1, fh = c.y1 - c.y0 + 1, rows = Math.ceil(frames.length / cols);
    const cv = document.createElement('canvas'); cv.width = fw * cols; cv.height = fh * rows; const x = cv.getContext('2d');
    const t = document.createElement('canvas'); t.width = frames[0].w; t.height = frames[0].h; const tx = t.getContext('2d');
    frames.forEach((f, k) => { tx.putImageData(f.data, 0, 0); x.drawImage(t, c.x0, c.y0, fw, fh, (k % cols) * fw, Math.floor(k / cols) * fh, fw, fh); });
    return { url: cv.toDataURL('image/webp', q), fw, fh };
  };

  /** THE TOP: the slew frames, DAY + NIGHT atlases (frames in the same cells) + each frame's anchor / apex / tip */
  window.bakeTop = ({ elev, px, slews, cols, q }) => {
    const w = Math.round(px * 2.6), h = Math.round(px * 1.3), oy = 0.12;   // (the frame: the jib + the counter-jib either side; the hook below)
    const days = [], nights = [];
    for (const s of slews) { days.push(shoot({ elev, slew: s, px, w, h, which: 'day', part: 'top', oy })); nights.push(shoot({ elev, slew: s, px, w, h, which: 'night', part: 'top', oy })); }
    const c = crop([...days, ...nights]);
    const D0 = atlasOf(days, c, cols, q), N0 = atlasOf(nights, c, cols, q);
    const u = ([x, y]) => [+((x - c.x0) / px).toFixed(4), +((y - c.y0) / px).toFixed(4)];
    return { day: D0.url, night: N0.url, meta: { elev, px, cols, n: slews.length, slews, fw: D0.fw, fh: D0.fh,
      frames: days.map(f => ({ a: u(f.anchor), apex: u(f.apex), tip: u(f.tip) })) } };
  };
  /** THE MAST: one strip below the slewing line at a fixed yaw → the head + a seamless tile (whole lattice periods) */
  window.bakeMast = ({ elev, px, yaw, q }) => {
    const len = Math.min(-low, 1.4), w = Math.round(px * mastR * S * 0 + px * 0.5), h = Math.round(px * len * 1.02) + 8;
    const sh = which => shoot({ elev, slew: yaw, px, w, h, which, part: 'mast', oy: -len / 2 });
    const d = sh('day'), n = sh('night');
    const A = d.data.data, W = d.w, Hh = d.h;
    // the mast's columns + its alpha profile down the strip
    let x0 = W, x1 = 0; for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) if (A[(y * W + x) * 4 + 3] > 2) { if (x < x0) x0 = x; if (x > x1) x1 = x; }
    const top = Math.max(0, Math.round(d.anchor[1]));
    const prof = []; for (let y = 0; y < Hh; y++) { let s = 0; for (let x = x0; x <= x1; x++) s += A[(y * W + x) * 4 + 3]; prof.push(s); }
    // THE PERIOD: the lag (8 px … a third of the strip) whose rows match best over the strip's middle (a normalised difference)
    const a0 = top + Math.round((Hh - top) * 0.25), a1 = top + Math.round((Hh - top) * 0.7);
    let best = 1e18, P = 0;
    for (let L = 8; L < (Hh - top) / 3; L++) { let e = 0, n2 = 0; for (let y = a0; y < a1 && y + L < Hh; y++) { e += Math.abs(prof[y] - prof[y + L]); n2++; } e /= Math.max(1, n2); if (e < best * 0.985) { best = e; P = L; } }
    // the tile: whole periods (≥ 40 px), starting a quarter down; the head: the slewing line → the tile's start
    // (never into the foot: the tile ends above the lowest 15 % — the concrete base)
    const foot = top + Math.round((Hh - top) * 0.85), reps = Math.max(1, Math.floor((foot - a0) / P)), t0 = a0, t1 = t0 + P * reps;
    const cx0 = Math.max(0, x0 - 2), cx1 = Math.min(W - 1, x1 + 2), cw = cx1 - cx0 + 1, hh = t1 - top;
    const cv = document.createElement('canvas'); cv.width = cw * 2; cv.height = hh; const x = cv.getContext('2d');
    const t = document.createElement('canvas'); t.width = W; t.height = Hh; const tx = t.getContext('2d');
    for (const [k, f] of [[0, d], [1, n]]) { tx.putImageData(f.data, 0, 0); x.drawImage(t, cx0, top, cw, hh, k * cw, 0, cw, hh); }
    return { url: cv.toDataURL('image/webp', q), meta: { px, yaw, fw: cw, fh: hh, ax: +(d.anchor[0] - cx0).toFixed(2), head: t0 - top, tile: t1 - t0, period: P, err: +best.toFixed(1) } };
  };
  return window.info;
})();
</script>`;

export async function run({ page, out, look, MODEL, ROOT, THREE, save, dataUrlToBuf }) {
  const B = BAKE, slews = [];
  for (let s = B.slew[0]; s <= B.slew[1] + 1e-6; s += B.step) slews.push(s);
  let bytes = 0;
  if (look) {
    for (const which of ['day', 'night']) for (const slew of [0, 40, -40]) {
      const url = await page.evaluate(o => window.shootURL(o), { elev: B.elev, slew, px: 420, w: 1100, h: 1200, which, part: 'all', oy: -0.6 });
      save(`look-${which}-s${slew}.png`, dataUrlToBuf(url));
    }
  }
  const top = await page.evaluate(o => window.bakeTop(o), { elev: B.elev, px: B.jibPx, slews, cols: 8, q: B.q });
  bytes += save('top-day.webp', dataUrlToBuf(top.day));
  bytes += save('top-night.webp', dataUrlToBuf(top.night));
  console.log('top', top.meta.n, 'frames', `${top.meta.fw}×${top.meta.fh} a frame`);
  const mast = await page.evaluate(o => window.bakeMast(o), { elev: B.elev, px: B.jibPx, yaw: B.mastYaw, q: B.q });
  bytes += save('mast.webp', dataUrlToBuf(mast.url));
  console.log('mast', JSON.stringify(mast.meta));
  const meta = { model: MODEL, credit: fs.readFileSync(path.join(ROOT, 'art/models/crane/credits.txt'), 'utf8').trim().split(/\r?\n/), three: THREE, top: top.meta, mast: mast.meta };
  const js = JSON.stringify(meta);
  bytes += save('crane.json', Buffer.from(js));
  console.log('total', (bytes / 1024).toFixed(1), 'KB →', out);
}
