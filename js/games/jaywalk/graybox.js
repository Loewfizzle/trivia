// JAYWALK — THE GRAYBOX (H1 — docs/jaywalk.md "THE LAB"): the engine drawn in flat coloured boxes on three.js 0.160 (the page's import
// map) — NO ART, no sounds: the proven camera, the lanes, the kid a box, cars / logs / trains boxes, the train's signal lights, the flight
// path's runway lights racing to the crossing + THE BLACKBIRD, THE UFO a disc + its beam circle, the wall a darkening band. The real looks:
// H2 (night) + H5 (day). The view INTERPOLATES between ticks (a = 0 … 1 into the next tick) — the rules never read the frame clock.
// Lanes are POOLED (a window of 30 round the kid, recycled); everything that repeats is INSTANCED (one draw call a kind).
import * as THREE from 'three';
import { FP, COLS, HOP_TICKS } from './tuning.js';
import { moverLeft, pulseAt, pulseLeft, ufoX, ufoY, mod } from './course.js';
import { CAM, createCamera } from './camera.js';

// THE CAMERA = camera.js (H2B — the SAME one as the night look: THE PROVEN RIG 16 up / 12 back, ZOOM 7 · 8 · 9 columns across, the sideways
// follow, the slight turn; the kid ≈ 62 % down the screen).
const BACK = 8, AHEAD = 22, POOL = BACK + AHEAD;   // (the lanes alive: 30)
const BG = 0x07060b;
const GROUND = { grass: [0x2e4634, 0x2a4030], road: [0x2b2b33, 0x2b2b33], water: [0x16384f, 0x143349], rail: [0x40362b, 0x40362b], flight: [0x36425f, 0x3b4868] };
const MARK = 0x6a6238, CARS = [0xd9534f, 0xf0ad4e, 0x5bc0de, 0xececec, 0xb48cff];

export function createGraybox(host, o = {}) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const renderer = new THREE.WebGLRenderer({ antialias: dpr < 2, powerPreference: 'high-performance' });
  renderer.setPixelRatio(dpr);
  const el = renderer.domElement;
  el.className = 'jw-canvas';
  host.append(el);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 26, 35);   // (the far lanes fade into the skyline band's dark)
  const cam = new THREE.PerspectiveCamera(CAM.fov, 1, 1, 70);
  const rig = createCamera({ zoom: o.zoom, angle: o.angle });
  scene.add(new THREE.AmbientLight(0xffffff, 2.1));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(-6, 14, 8);
  scene.add(sun);

  const box = new THREE.BoxGeometry(1, 1, 1);
  const lambert = () => new THREE.MeshLambertMaterial({ color: 0xffffff });
  const flat = () => new THREE.MeshBasicMaterial({ color: 0xffffff });
  const made = [];
  /** an instanced kind: n boxes, each its own place + size + colour */
  function kind(n, mat = lambert()) {
    const m = new THREE.InstancedMesh(box, mat, n);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.setColorAt(0, new THREE.Color(0xffffff));
    m.frustumCulled = false; m.count = 0;
    scene.add(m); made.push(m);
    let i = 0;
    return {
      mesh: m,
      reset() { i = 0; },
      put(x, y, z, sx, sy, sz, col) { if (i >= n) return; P.set(x, y, z); S.set(sx, sy, sz); M.compose(P, Q, S); m.setMatrixAt(i, M); C.setHex(col); m.setColorAt(i, C); i++; },
      done() { m.count = i; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; },
    };
  }
  const P = new THREE.Vector3(), S = new THREE.Vector3(), Q = new THREE.Quaternion(), M = new THREE.Matrix4(), C = new THREE.Color();
  const K = {
    ground: kind(POOL), side: kind(POOL), obs: kind(POOL * 7), cars: kind(POOL * 8), logs: kind(POOL * 6), trains: kind(POOL),
    jets: kind(8), signals: kind(POOL * 2, flat()), runway: kind(POOL * COLS, flat()),
  };
  // the kid: a box in his colour
  const kid = new THREE.Mesh(box, new THREE.MeshLambertMaterial({ color: new THREE.Color(o.kidColor || '#00f0ff') }));
  scene.add(kid);
  // THE UFO: a disc + its beam circle on the ground (two at most are ever in the window)
  const disc = new THREE.CylinderGeometry(0.95, 1.25, 0.28, 20), ring = new THREE.CircleGeometry(1, 28);
  const ufos = [0, 1].map(() => {
    const d = new THREE.Mesh(disc, new THREE.MeshLambertMaterial({ color: 0xb7ffcf }));
    const b = new THREE.Mesh(ring, new THREE.MeshBasicMaterial({ color: 0x7dffb8, transparent: true, opacity: 0.55, depthWrite: false }));
    b.rotation.x = -Math.PI / 2;
    d.visible = b.visible = false;
    scene.add(d, b);
    return { d, b };
  });
  // THE WALL: a darkening band — the black behind its edge, a see-through lip ahead of it
  const wall = new THREE.Mesh(box, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.94, depthWrite: false, fog: false }));
  const lip = new THREE.Mesh(box, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5, depthWrite: false, fog: false }));
  wall.renderOrder = 5; lip.renderOrder = 5;
  scene.add(wall, lip);

  let w = 0, h = 0;
  function resize() {
    const nw = host.clientWidth, nh = host.clientHeight;
    if (!nw || !nh || (nw === w && nh === h)) return;
    w = nw; h = nh;
    renderer.setSize(w, h, false);
    cam.fov = rig.fit(w / h);   // (ZOOM columns across on every screen shape — camera.js#lensFor)
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  const X = cells => cells - COLS / 2, Z = lanes => -lanes;

  /** one frame: the run after its last tick, `a` (0 … 1) into the next one, `dt` ms since the last frame */
  function draw(run, course, a, dt) {
    const t = run.t + a;
    // the kid, between ticks
    let kx = run.x / FP, ky = run.y + 0.5, lift = 0;
    if (run.st === 'hop') {
      const f = Math.min(1, (run.k + a) / HOP_TICKS);
      kx = (run.fx + (run.tx - run.fx) * f) / FP; ky = run.fy + 0.5 + (run.ty - run.fy) * f; lift = Math.sin(Math.PI * f) * 0.5;
    } else if (run.st === 'idle') { const L = course.lane(run.y); if (L.type === 'water') kx += L.dir * L.v * a / FP; }
    const flatK = run.st === 'out';
    kid.visible = true;
    kid.scale.set(0.62, flatK ? 0.16 : 0.82, 0.62);
    if (run.st === 'taken') lift = Math.min(14, (lift || 0) + (kid.userData.rise = (kid.userData.rise || 0) + dt * 0.006)); else kid.userData.rise = 0;
    kid.position.set(X(kx), (flatK ? 0.08 : 0.41) + lift + 0.1, Z(ky));

    // THE CAMERA (camera.js): it follows the kid up the lanes + sideways (eased), never the frame clock of the rules
    rig.follow(run.st === 'hop' ? run.tx / FP : kx, run.st === 'hop' ? run.ty + 0.5 : ky, dt);
    rig.apply(cam);
    const camY = rig.y();

    for (const q of Object.values(K)) q.reset();
    let nu = 0;
    const base = Math.floor(camY) - BACK;   // (the lanes behind the start are plain grass no kid can hop onto — the wall is seen coming from the first second)
    for (let i = base; i < base + POOL; i++) {
      const L = course.lane(i), z = Z(i + 0.5), g = GROUND[L.type];
      K.ground.put(0, -0.1, z, COLS, 0.2, 1, L.mark ? MARK : g[i & 1]);
      K.side.put(0, -0.16, z, 40, 0.2, 1, 0x101016);
      if (L.type === 'grass') {
        for (let c = 0; c < COLS; c++) if (L.obs[c]) K.obs.put(X(c + 0.5), 0.45, z, 0.78, 0.9, 0.78, 0x1c2b20);
      } else if (L.type === 'road' || L.type === 'water') {
        const car = L.type === 'road', q = car ? K.cars : K.logs;
        for (let j = 0; j < L.items.length; j++) {
          const it = L.items[j], left = moverLeft(L, it, t) / FP, len = it.len / FP;
          if (left > COLS + 4 || left + len < -4) continue;
          if (car) q.put(X(left + len / 2), 0.32, z, len - 0.12, 0.56, 0.7, CARS[Math.abs(i * 7 + j) % CARS.length]);
          else q.put(X(left + len / 2), 0.06, z, len - 0.06, 0.22, 0.82, 0x7a5536);
        }
      } else {
        const p = L.pulse, st = pulseAt(p, Math.floor(t)), rail = L.type === 'rail';
        if (st.st === 'pass') {
          const left = pulseLeft(p, mod(t - p.phase, p.period)) / FP, len = p.len / FP;
          if (rail) K.trains.put(X(left + len / 2), 0.6, z, len, 1.1, 0.84, 0xc9c9d2);
          else K.jets.put(X(left + len / 2), 0.9, z, len, 0.3, 0.92, 0x9aa3c4);
        }
        if (rail) {   // the signal lights: red, blinking, from the tell to the train's tail
          const on = st.st !== 'idle' && (Math.floor(t / 8) % 2 === 0), col = on ? 0xff3b3b : 0x4a1c1c;
          K.signals.put(X(-0.35), 0.6, z, 0.26, 1.2, 0.26, col); K.signals.put(X(COLS + 0.35), 0.6, z, 0.26, 1.2, 0.26, col);
        } else {      // the runway lights: dim amber; in the tell they RACE to the crossing, faster and faster
          const f = st.st === 'tell' ? 1 - st.left / p.tell : -1, head = f < 0 ? -9 : ((f * f * 7 + f * 2) % 1) * (COLS + 2) - 1;
          for (let c = 0; c < COLS; c++) {
            const at = p.dir > 0 ? c : COLS - 1 - c, lit = st.st === 'pass' || (f >= 0 && at <= head && at > head - 3);
            K.runway.put(X(c + 0.5), 0.06, z - 0.4, lit ? 0.56 : 0.3, 0.12, lit ? 0.3 : 0.16, lit ? 0xfff0a8 : 0x8a6f24);
          }
        }
      }
      if (L.ufo && nu < 2 && !ufos.slice(0, nu).some(u => u.id === L.ufo.id)) {
        const u = ufos[nu++], bx = ufoX(L.ufo, t) / FP, by = ufoY(L.ufo, t) / FP;
        u.id = L.ufo.id;
        u.d.position.set(X(bx), 4.2, Z(by)); u.b.position.set(X(bx), 0.07, Z(by)); u.b.scale.setScalar(L.ufo.r / FP);
        u.d.visible = u.b.visible = true;
      }
    }
    for (let j = nu; j < 2; j++) { ufos[j].d.visible = ufos[j].b.visible = false; ufos[j].id = -1; }
    for (const q of Object.values(K)) q.done();
    // the wall: its edge at run.wall (lane FP), 40 lanes of black behind it
    const edge = run.wall / FP;
    wall.position.set(0, 0.7, Z(edge - 20)); wall.scale.set(40, 1.4, 40);
    lip.position.set(0, 0.7, Z(edge + 0.75)); lip.scale.set(40, 1.4, 1.5);
    renderer.render(scene, cam);
  }

  return {
    el, draw, resize,
    /** where the kid is on the screen (0 … 1 from the top) — the camera's check */
    kidScreenY() { const v = kid.position.clone().project(cam); return (1 - v.y) / 2; },
    kidScreenX() { const v = kid.position.clone().project(cam); return (1 + v.x) / 2; },
    project(cells, lane) { const v = new THREE.Vector3(X(cells), 0, Z(lane)).project(cam); return [(1 + v.x) / 2, (1 - v.y) / 2]; },
    setCamera(zoom, angle, snap) { rig.choose(zoom, angle, snap); },
    zoom: () => rig.zoom(), angle: () => rig.angle(),
    info: () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles, dpr, w, h, fov: cam.fov, zoom: rig.zoom(), angle: rig.angle(), camX: rig.x(), yaw: rig.yaw() }),
    destroy() {
      ro.disconnect();
      for (const m of made) { m.material.dispose(); scene.remove(m); }
      for (const m of [kid, wall, lip, ...ufos.flatMap(u => [u.d, u.b])]) { m.material.dispose(); scene.remove(m); }
      box.dispose(); disc.dispose(); ring.dispose();
      renderer.dispose();
      try { renderer.forceContextLoss(); } catch { /* fine */ }
      el.remove();
    },
  };
}
