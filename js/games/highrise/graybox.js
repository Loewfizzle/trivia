// HIGH RISE — THE GRAYBOX (S1 — docs/highrise.md "THE LAB"): the engine drawn in flat-shaded boxes on three.js 0.160 (the page's import
// map) — NO ART, no sounds. THE DIAGONAL CAMERA the real game will use (turned 45°, looking ~33° down, a narrow lens), climbing with the
// top slab; the cut piece just falls away; a PERFECT flashes the top edge white. The looks: S2 (night) + S3 (day).
// VIEW ONLY: it reads the run + its EVENTS (engine.js) and eases between two ticks — the rules never read the frame clock.
import * as THREE from 'three';
import { START, PALETTE_N } from './tuning.js';
import { slabAt, paletteFor } from './engine.js';
import { createTower } from './tower.js';

const U = 1 / START;            // rule units → world units: the starting slab is 1 × 1
const H = 0.14;                 // a slab's thickness (world)
const BG = 0x07060b;
const KEEP = 44;                // the slabs kept drawn under the top (the rest is below the screen)
/** THE CAMERA: turned 45°, 33° down, a 20° lens; `fill` = the first slab's width on the screen (0.6 of it — on a wide screen, of a phone-shaped column) */
export const CAM = Object.freeze({ fov: 20, yaw: 45, pitch: 33, fill: 0.6, aspectMax: 0.62, lift: 0.5 });
const RAD = Math.PI / 180;

export function createGraybox(host) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(dpr);
  const el = renderer.domElement;
  el.className = 'hi-canvas';
  host.append(el);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  const cam = new THREE.PerspectiveCamera(CAM.fov, 1, 0.5, 80);
  scene.add(new THREE.AmbientLight(0xffffff, 1.25));
  const sun = new THREE.DirectionalLight(0xffffff, 2.3);
  scene.add(sun, sun.target);

  const box = new THREE.BoxGeometry(1, 1, 1);
  const P = new THREE.Vector3(), S = new THREE.Vector3(), Q = new THREE.Quaternion(), M = new THREE.Matrix4(), C = new THREE.Color(), V = new THREE.Vector3();
  // the tower: ONE instanced mesh (a slab = a box, its own size + shade)
  const tower = new THREE.InstancedMesh(box, new THREE.MeshLambertMaterial({ color: 0xffffff }), KEEP + 2);
  tower.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  tower.setColorAt(0, C.set(0xffffff));
  tower.frustumCulled = false; tower.count = 0;
  scene.add(tower);
  // the sliding slab
  const slider = new THREE.Mesh(box, new THREE.MeshLambertMaterial({ color: 0xbfefff }));
  slider.visible = false;
  scene.add(slider);
  // the pieces that fall away (a cut's overhang; a missed slab) — a small pool
  const pieces = Array.from({ length: 8 }, () => {
    const m = new THREE.Mesh(box, new THREE.MeshLambertMaterial({ color: 0x8d93a3, transparent: true }));
    m.visible = false; scene.add(m);
    return { m, vx: 0, vy: 0, vz: 0, rx: 0, rz: 0, age: 0, on: false };
  });
  let pieceAt = 0;
  // the PERFECT flash: the top slab's whole top face goes white (fading) + four white bars round its upper edge (they stay a beat longer)
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
  const plateMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
  const bars = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(box, flashMat); m.visible = false; scene.add(m); return m; });
  const plate = new THREE.Mesh(box, plateMat); plate.visible = false; scene.add(plate);
  let flashAge = 1e9;
  const FLASH_MS = 460, BAR = 0.07;

  /** the shade of a floor's slab: grays walking the wheel (paletteFor — the same index the real looks will colour by) */
  const shadeOf = (seed, floor) => { const i = paletteFor(seed, floor), f = 1 - Math.abs(2 * i / PALETTE_N - 1); return C.setHSL(0.62, 0.12, 0.27 + 0.2 * f + (floor & 1 ? 0.085 : 0)); };   // (mid grays — a white flash + the pale sliding slab stand out; every other slab lighter: each floor reads)

  // ---- the view's own tower: tower.js builds it from the EVENTS (pure — tests/highrise-lab.test.mjs proves it equals the engine's)
  let T = null, slabs = [], top = null, seed = '';
  function fall(r, floor, dx, dz, whole) {
    const p = pieces[pieceAt++ % pieces.length];
    p.on = true; p.age = 0;
    p.m.visible = true; p.m.material.opacity = 1;
    p.m.scale.set((r.x1 - r.x0) * U, H, (r.z1 - r.z0) * U);
    p.m.position.set((r.x0 + r.x1) / 2 * U, (floor - 0.5) * H, (r.z0 + r.z1) / 2 * U);
    p.m.rotation.set(0, 0, 0);
    p.vx = dx * 0.5; p.vz = dz * 0.5; p.vy = 0;
    p.rx = whole ? 0 : dz * 1.6; p.rz = whole ? 0 : -dx * 1.6;
  }
  function reset(run) {
    seed = run.seed;
    T = createTower(run, { onPerfect: () => { flashAge = 0; }, onFall: fall }, KEEP);
    slabs = T.slabs(); top = T.top();
    flashAge = 1e9;
    for (const p of pieces) { p.on = false; p.m.visible = false; }
    slider.visible = false;
    camY = 0; camX = (top.x0 + top.x1) / 2 * U; camZ = (top.z0 + top.z1) / 2 * U;
  }
  /** the run's EVENTS since the last frame, in order (engine.js#stepTo / tap) */
  function feed(events) { T.feed(events); top = T.top(); }

  let w = 0, h = 0, dist = 14, camX = 0, camY = 0, camZ = 0;
  function resize() {
    const nw = host.clientWidth, nh = host.clientHeight;
    if (!nw || !nh || (nw === w && nh === h)) return;
    w = nw; h = nh;
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    // THE FIRST SLAB ≈ 60 % OF THE SCREEN WIDTH: seen from its corner it is √2 wide
    const a = Math.min(cam.aspect, CAM.aspectMax);
    dist = Math.SQRT2 / (2 * CAM.fill * a * Math.tan(CAM.fov * RAD / 2));
    cam.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  const cp = Math.cos(CAM.pitch * RAD), sp = Math.sin(CAM.pitch * RAD), sy = Math.sin(CAM.yaw * RAD), cy = Math.cos(CAM.yaw * RAD);
  function aim(dt) {
    const k = dt >= 1000 ? 1 : 1 - Math.exp(-dt / 140);
    const ty = (slabs[slabs.length - 1].floor) * H, tx = (top.x0 + top.x1) / 2 * U, tz = (top.z0 + top.z1) / 2 * U;
    camY += (ty - camY) * k; camX += (tx - camX) * k; camZ += (tz - camZ) * k;
    const lookY = camY + CAM.lift;
    cam.position.set(camX + dist * cp * sy, lookY + dist * sp, camZ + dist * cp * cy);
    cam.lookAt(camX, lookY, camZ);
    sun.position.set(camX - 3, camY + 9, camZ + 6); sun.target.position.set(camX, camY, camZ);
  }

  /** one frame: the run, `tau` = the clock in ticks (a fraction into the next one), `dt` ms since the last frame */
  function draw(run, tau, dt) {
    aim(dt);
    // the tower: a tall dark pillar under the base, then the slabs
    let n = 0;
    P.set(0, -H - 6, 0); S.set(1, 12, 1); M.compose(P, Q, S); tower.setMatrixAt(n, M); tower.setColorAt(n, C.set(0x23252e)); n++;
    for (let i = Math.max(0, slabs.length - KEEP); i < slabs.length; i++) {
      const s = slabs[i];
      P.set((s.x0 + s.x1) / 2 * U, (s.floor - 0.5) * H, (s.z0 + s.z1) / 2 * U); S.set((s.x1 - s.x0) * U, H, (s.z1 - s.z0) * U);
      M.compose(P, Q, S); tower.setMatrixAt(n, M); tower.setColorAt(n, shadeOf(seed, s.floor)); n++;
    }
    tower.count = n; tower.instanceMatrix.needsUpdate = true; tower.instanceColor.needsUpdate = true;
    // the sliding slab, eased between its two ticks
    const k0 = Math.floor(tau), a = slabAt(run, k0);
    if (a) {
      const b = slabAt(run, k0 + 1), f = tau - k0, mx = (a.x0 + a.x1) / 2, mz = (a.z0 + a.z1) / 2;
      slider.visible = true;
      slider.position.set((mx + ((b.x0 + b.x1) / 2 - mx) * f) * U, (a.floor - 0.5) * H, (mz + ((b.z0 + b.z1) / 2 - mz) * f) * U);
      slider.scale.set((a.x1 - a.x0) * U, H, (a.z1 - a.z0) * U);
    } else slider.visible = false;
    // the falling pieces
    for (const p of pieces) {
      if (!p.on) continue;
      p.age += dt;
      const s = dt / 1000;
      p.vy -= 9 * s;
      p.m.position.x += p.vx * s; p.m.position.y += p.vy * s; p.m.position.z += p.vz * s;
      p.m.rotation.x += p.rx * s; p.m.rotation.z += p.rz * s;
      p.m.material.opacity = Math.max(0, 1 - p.age / 1100);
      if (p.age > 1100) { p.on = false; p.m.visible = false; }
    }
    // the PERFECT flash
    flashAge += dt;
    const fo = flashAge < FLASH_MS ? 1 - flashAge / FLASH_MS : 0;
    flashMat.opacity = fo; plateMat.opacity = fo * fo * 0.9;
    if (fo > 0) {
      const y = slabs[slabs.length - 1].floor * H + 0.004, x0 = top.x0 * U, x1 = top.x1 * U, z0 = top.z0 * U, z1 = top.z1 * U, mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
      bars[0].position.set(mx, y, z0); bars[0].scale.set(x1 - x0 + BAR, 0.012, BAR);
      bars[1].position.set(mx, y, z1); bars[1].scale.set(x1 - x0 + BAR, 0.012, BAR);
      bars[2].position.set(x0, y, mz); bars[2].scale.set(BAR, 0.012, z1 - z0 + BAR);
      bars[3].position.set(x1, y, mz); bars[3].scale.set(BAR, 0.012, z1 - z0 + BAR);
      plate.position.set(mx, y, mz); plate.scale.set(x1 - x0, 0.006, z1 - z0);
    }
    for (const b of bars) b.visible = fo > 0;
    plate.visible = fo > 0;
    renderer.render(scene, cam);
  }

  return {
    el, reset, feed, draw, resize,
    /** the view's own top slab (built from the events) — the lab's check: it equals the engine's */
    top: () => ({ ...top, floor: slabs[slabs.length - 1].floor }),
    /** a world point (rule units x, z; y in floors) → [x, y] on the screen, 0 … 1 from the top left */
    project(x, floor, z) { V.set(x * U, floor * H, z * U).project(cam); return [(1 + V.x) / 2, (1 - V.y) / 2]; },
    flashing: () => flashAge < FLASH_MS,
    falling: () => pieces.filter(p => p.on).length,
    info: () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles, dpr, w, h, dist, slabs: slabs.length }),
    destroy() {
      ro.disconnect();
      for (const m of [tower, slider, plate, ...bars, ...pieces.map(p => p.m)]) scene.remove(m);
      tower.material.dispose(); slider.material.dispose(); flashMat.dispose(); plateMat.dispose(); for (const p of pieces) p.m.material.dispose();
      box.dispose(); renderer.dispose();
      try { renderer.forceContextLoss(); } catch { /* fine */ }
      el.remove();
    },
  };
}
