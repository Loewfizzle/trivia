// JAYWALK — THE NIGHT LOOK (H2 — docs/jaywalk.md "THE NIGHT LOOK"): the pure engine drawn in the SMOOTH STYLIZED 3D style on three.js
// 0.160 — the same interface as the graybox (graybox.js: `?gray=1` on the lab keeps it for comparison): draw(run, course, a, dt).
//   · THE GROUND: one instanced plane a lane, drawn in a shader (night-fx.js) · CARS: the Kenney models, a neon body tint per car from the
//     seed, an additive light trail, bold headlight / taillight pools (decals — no real point light), our own light quads
//   · LOGS built in code (amber edges, a glow on the water, a gentle bob) · TRAINS: Kenney's front + carriages, lit windows, a headlight
//     beam, the red signals + a warning glow on the side it comes from · TREES built in code, Kenney's props, the lamps' warm pools
//   · THE BLACKOUT (the wall): the lights die lane by lane from below, a cold edge where it bites
//   · THE JAYWALKER (models.js#buildKid) + THE HOP's feel + the hits, one per cause — ALL DERIVED FROM THE RUN's STATE between ticks
//     (the rules never read the frame clock; a refresh / a replay draws the same kid)
//   · THE CAMERA (H2B — camera.js, shared with the graybox): ZOOM 7 · 8 · 9 columns across, the sideways follow, the slight TURN; the
//     dimmer edge column each side stays the cue for the play area's edge. View only: the rules stay 9 columns.
// Everything that repeats is INSTANCED; a window of lanes round the kid is alive (re-laid every frame — a few hundred matrices); no
// post-processing below the top tier (THE HALF-RES BLOOM: tier 2 only). setTier(2 | 1 | 0): the match kit's tiers (games/kit/tiers.js).
import * as THREE from 'three';
import { FP, COLS, HOP_TICKS, DOWN_TICKS } from './tuning.js';
import { moverLeft, pulseAt, pulseLeft, logUnder, ufoX, ufoY, mod } from './course.js';
import { loadKenney, SCENE_MODELS, buildKid, buildTree, buildTuft, buildLog, buildTruck, TRUCK, buildBarricade, buildDart } from './models.js';
import { FOG_HEX, KIND, rgb, createGround, glowMaterial, paintMaterial, neonEnv, createBloom } from './night-fx.js';
import { CAM, createCamera } from './camera.js';

const BACK = 9, AHEAD = 27, POOL = BACK + AHEAD;   // (the most lanes alive: 36 — a closer zoom lays fewer ahead)
const NEON = [0xff3fb4, 0x22e0ff, 0xa05bff, 0xff5a7a, 0x4d7dff];   // (a car's body tint + its trail: pink · cyan · violet · coral · blue)
const DPR_AT = [1.5, 2, 3];
const KID_S = 1.3;   // (THE JAYWALKER's size on the lane: ≈ 1.27 of a lane tall — he must read at real phone size; the rules' box stays 0.6 of a cell)
// the skyline's night life, in % of the band's picture (assets/jaywalk/skyline-night.webp): [x, y, delay s] the red aviation lights ·
// [x, y, w, h, delay s] the neon blocks that flicker
const SKY_LIGHTS = [[31.7, 31.8, 0], [66.3, 36.4, 0.9], [67.9, 36.4, 0.9], [62.6, 45.6, 1.7], [64.2, 45.6, 1.7], [88.7, 34.2, 0.4], [93.8, 44.6, 1.3], [10.9, 37, 2.1]];
const SKY_NEON = [[24, 52.6, 2.5, 5.8, 0], [33.6, 47.4, 1.8, 8.4, 2.2], [80.2, 56.4, 2.6, 3.4, 3.7], [8.5, 57.6, 2.3, 3, 1.1], [75.3, 52.8, 1.8, 4.6, 4.4]];
const X = c => c - COLS / 2, Z = l => -l;
const hsh = (a, b) => { let x = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul((b | 0) + 0x7f4a7c15, 0xc2b2ae35); x ^= x >>> 15; x = Math.imul(x, 0x2c1b3c6d); x ^= x >>> 12; return (x >>> 0) / 4294967296; };
const strSeed = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h | 0; };
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = t => t * t * (3 - 2 * t);

export function createNight(host, o = {}) {
  const reduce = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();
  const devDpr = Math.min(window.devicePixelRatio || 1, 3);
  const renderer = new THREE.WebGLRenderer({ antialias: devDpr < 2, powerPreference: 'high-performance' });
  renderer.info.autoReset = false;
  const el = renderer.domElement;
  el.className = 'jw-canvas';
  host.append(el);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(FOG_HEX);
  scene.fog = new THREE.Fog(FOG_HEX, 26, 35);
  const fogV = new THREE.Vector2(26, 35);          // (the shaders' copy of the fog's near / far)
  const cam = new THREE.PerspectiveCamera(CAM.fov, 1, 1, 90);
  cam.layers.enableAll();
  const rig = createCamera({ zoom: o.zoom, angle: o.angle });   // THE CAMERA (camera.js): the zoom, the sideways follow, the turn
  // the light: a dim cool night, a soft key from the front-left, A RIM LIGHT from behind (pink) — the smooth finish
  scene.add(new THREE.HemisphereLight(0x8fa0ff, 0x1a1030, 1.5));
  const key = new THREE.DirectionalLight(0xdfe4ff, 1.55); key.position.set(-5, 12, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff6ad0, 1.25); rim.position.set(6, 5, -10); scene.add(rim);
  let env = null;
  try { env = neonEnv(renderer); scene.environment = env; } catch { /* no gloss: fine */ }

  const P = new THREE.Vector3(), S = new THREE.Vector3(), Q = new THREE.Quaternion(), E = new THREE.Euler(), M = new THREE.Matrix4(), C = new THREE.Color();
  const made = [];
  /** an instanced kind. put(x, y, z, sx, sy, sz, ry, hex, k): place + size + turn + colour (× k — the blackout, the dim edge) */
  function kind(geo, mat, n, { aux = null, raw = false, order = 0, bloom = false } = {}) {
    const g = aux ? geo.clone() : geo, m = new THREE.InstancedMesh(g, mat, n);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.setColorAt(0, C.set(0xffffff)); m.instanceColor.setUsage(THREE.DynamicDrawUsage);
    let ax = null;
    if (aux) { ax = new THREE.InstancedBufferAttribute(new Float32Array(n * aux[1]), aux[1]); ax.setUsage(THREE.DynamicDrawUsage); g.setAttribute(aux[0], ax); }
    m.frustumCulled = false; m.count = 0; m.renderOrder = order;
    if (bloom) m.layers.enable(1);
    scene.add(m); made.push({ m, g });
    const col = m.instanceColor.array;
    let i = 0;
    return {
      mesh: m,
      reset() { i = 0; },
      put(x, y, z, sx, sy, sz, ry, hex, k = 1, a0 = 1, a1 = 1, rx = 0, rz = 0) {
        if (i >= n) return;
        P.set(x, y, z); S.set(sx, sy, sz);
        if (rx || rz) Q.setFromEuler(E.set(rx, ry, rz, 'YXZ')); else if (ry) Q.setFromAxisAngle(UP, ry); else Q.identity();
        M.compose(P, Q, S); m.setMatrixAt(i, M);
        if (raw) { col[i * 3] = ((hex >> 16) & 255) / 255 * k; col[i * 3 + 1] = ((hex >> 8) & 255) / 255 * k; col[i * 3 + 2] = (hex & 255) / 255 * k; }
        else { C.setHex(hex); col[i * 3] = C.r * k; col[i * 3 + 1] = C.g * k; col[i * 3 + 2] = C.b * k; }
        if (ax) { ax.array[i * aux[1]] = a0; if (aux[1] > 1) ax.array[i * aux[1] + 1] = a1; }
        i++;
      },
      done() { m.count = i; m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true; if (ax) ax.needsUpdate = true; },
    };
  }
  const UP = new THREE.Vector3(0, 1, 0);
  const lambert = () => new THREE.MeshLambertMaterial({ vertexColors: true });
  const glossy = (rough, envI) => new THREE.MeshStandardMaterial({ roughness: rough, metalness: 0, envMapIntensity: envI });

  // ---- the kinds (≈ 26 draw calls: one a kind)
  const ground = createGround(POOL, fogV);
  scene.add(ground.mesh);
  const flatGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), billGeo = new THREE.PlaneGeometry(1, 1), unit = new THREE.BoxGeometry(1, 1, 1);
  const GEO = { tree: buildTree(), tuft: buildTuft(), log: buildLog(), truck: buildTruck(), barricade: buildBarricade(), dart: buildDart() };
  const K = {
    shadow: kind(flatGeo, glowMaterial(fogV, { shadow: true }), 160, { aux: ['aFx', 2], raw: true, order: 1 }),
    flat: kind(flatGeo, glowMaterial(fogV), 520, { aux: ['aFx', 2], raw: true, order: 2, bloom: true }),          // pools · trails · beams · rings · edge lines
    bill: kind(billGeo, glowMaterial(fogV, { bill: true }), 520, { aux: ['aFx', 2], raw: true, order: 3, bloom: true }),   // lamps · light quads · sparks
    trees: kind(GEO.tree, lambert(), 150),
    tufts: kind(GEO.tuft, lambert(), 220),
    logs: kind(GEO.log, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0, envMapIntensity: 0.5 }), 110),
    trucks: kind(GEO.truck, paintMaterial(glossy(0.3, 1), { instanced: true }), 24, { aux: ['aLit', 1] }),
    barricades: kind(GEO.barricade, lambert(), 40),
    posts: kind(unit, new THREE.MeshLambertMaterial({ color: 0xffffff }), 180),
    jets: kind(GEO.dart, lambert(), 8),
  };
  // Kenney's (CC0): they arrive a moment after the first frame — until then (or if a file fails) that kind simply draws nothing
  const CARS = ['car-sedan', 'car-hatchback', 'car-taxi', 'car-van'];
  const KM = {}, BOX = {};
  let dead = false;
  const ready = loadKenney(SCENE_MODELS).then(geos => {
    if (dead) { for (const g of Object.values(geos)) g.dispose(); return false; }
    for (const [name, g] of Object.entries(geos)) {
      const b = g.boundingBox; BOX[name] = { w: b.max.x - b.min.x, h: b.max.y, l: b.max.z - b.min.z, cz: (b.max.z + b.min.z) / 2, x0: b.min.x, z0: b.min.z, z1: b.max.z };
      if (name.startsWith('car-')) KM[name] = kind(g, paintMaterial(glossy(0.28, 1.1), { instanced: true }), 40, { aux: ['aLit', 1] });
      else if (name.startsWith('train-')) KM[name] = kind(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0, envMapIntensity: 0.9 }), 40);
      else KM[name] = kind(g, lambert(), 70);
    }
    return true;
  }).catch(() => false);

  // THE JAYWALKER
  const kidGeo = buildKid();
  const kidMat = paintMaterial(glossy(0.42, 0.7), { rim: true }), capMat = paintMaterial(glossy(0.36, 0.8), { rim: true });
  const kid = new THREE.Mesh(kidGeo.body, kidMat), kidCap = new THREE.Mesh(kidGeo.cap, capMat);
  scene.add(kid, kidCap);
  // HE ALWAYS STANDS OUT (H2B): his colour → the hoodie + the cap, a rim light of his own (his colour pulled toward white), the glow ring under him
  const rimCol = new THREE.Color();
  let kidHex = 0xff3fb4;
  const tintOf = hex => { kidMat.userData.u.uTint.value.set(hex); capMat.userData.u.uTint.value.set(hex); kidHex = C.set(hex).getHex(); rimCol.set(hex).lerp(C.set(0xffffff), 0.5); };
  tintOf(o.kidColor || '#ff3fb4');
  // THE UFO's placeholder (H6 draws the real one): a disc + its beam circle on the ground
  const discGeo = new THREE.CylinderGeometry(0.95, 1.25, 0.28, 20);
  const ufos = [0, 1].map(() => { const d = new THREE.Mesh(discGeo, new THREE.MeshStandardMaterial({ color: 0x9fb0c8, roughness: 0.25, envMapIntensity: 1.2 })); d.visible = false; scene.add(d); return { d, id: -1 }; });
  // THE BLACKOUT's curtain: everything a lane and more behind its edge is simply black
  const curtain = new THREE.Mesh(unit, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.93, depthWrite: false, fog: false }));
  curtain.renderOrder = 6; scene.add(curtain);

  // THE SKYLINE BAND (the top ≈ 24 % — css/jaywalk.css .jw-skyline): the night picture covers the band's height and slides ≈ 10 % with the
  // kid's column; its foot fades into the lanes' fog. NIGHT LIFE: the aviation lights blink, a few neon blocks flicker (small overlays).
  const sky = document.createElement('div'), skyImg = document.createElement('div');
  sky.className = 'jw-skyline'; skyImg.className = 'jw-skyline-img';
  skyImg.style.backgroundImage = `url("${new URL('../../../assets/jaywalk/skyline-night.webp', import.meta.url).href}")`;
  for (const [x, y, d] of SKY_LIGHTS) { const i = document.createElement('i'); i.className = 'jw-sky-l'; i.style.cssText = `left:${x}%;top:${y}%;animation-delay:${-d}s`; skyImg.append(i); }
  for (const [x, y, bw, bh, d] of SKY_NEON) { const i = document.createElement('i'); i.className = 'jw-sky-n'; i.style.cssText = `left:${x}%;top:${y}%;width:${bw}%;height:${bh}%;animation-delay:${-d}s`; skyImg.append(i); }
  sky.append(skyImg); host.append(sky);
  let skyAt = 9;

  let bloom = null, tier = 2, w = 0, h = 0, dpr = devDpr, kAt = 0;
  /** the rig's scale moved (a ZOOM change easing in): the far plane + the fog follow it */
  function depth() {
    const k = rig.k();
    if (k === kAt) return;
    kAt = k; cam.far = 90 * k; cam.updateProjectionMatrix();
    scene.fog.near = 26 * k; scene.fog.far = 35 * k; fogV.set(26 * k, 35 * k);
  }
  function fit(force) {
    const nw = host.clientWidth, nh = host.clientHeight, nd = Math.min(devDpr, DPR_AT[tier]);
    if (!nw || !nh || (!force && nw === w && nh === h && nd === dpr)) return;
    w = nw; h = nh; dpr = nd;
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
    cam.fov = rig.fit(w / h);   // (ZOOM columns across on every screen shape — camera.js#lensFor)
    cam.aspect = w / h; kAt = 0; depth();
    if (bloom) bloom.size(Math.round(w * dpr), Math.round(h * dpr));
  }
  const ro = new ResizeObserver(() => fit());
  ro.observe(host);
  function setTier(t) {
    tier = t < 0 ? 0 : t > 2 ? 2 : t | 0;
    ground.uniforms.uQ.value = tier > 0 ? 1 : 0;
    if (tier === 2 && !bloom) { try { bloom = createBloom(renderer); } catch { bloom = null; } }
    if (tier < 2 && bloom) { bloom.dispose(); bloom = null; }
    fit(true);
  }
  setTier(o.tier == null ? 2 : o.tier);

  // ---- what stands on a lane (view only — from the seed + the lane: the same picture on every phone, nothing the rules read)
  let courseRef = null, vseed = 0;
  const decor = new Map();
  function decorOf(i, L) {
    let d = decor.get(i);
    if (d) return d;
    d = { obs: [], tufts: [], lamp: 0 };
    if (L.type === 'grass') {
      const docks = !!L.mark || (i > 40 && (i % 50 <= 3 || i % 50 >= 47));   // (by a landmark: the docks' clutter)
      const pick = (c, edge) => {
        const r = hsh(vseed ^ (i * 131), c * 17 + 3), s = hsh(vseed ^ (i * 977), c * 29 + 11);
        // (H2B — the owner: no junk-looking props: the crates are out; the barrier = THE BARRICADE, built in code; planters, cones, the dumpster stay)
        const k = docks ? (r < 0.3 ? 'trash-dumpster' : r < 0.56 ? 'barricade' : r < 0.8 ? 'traffic-cone' : 'tree')
          : edge ? (r < 0.62 ? 'tree' : r < 0.8 ? 'bush-planter' : '') : (r < 0.72 ? 'tree' : r < 0.9 ? 'bush-planter' : r < 0.95 ? 'barricade' : 'traffic-cone');
        if (k) d.obs.push({ c, k, s, ry: (hsh(vseed ^ i, c + 71) - 0.5) * 0.9, dx: edge ? (hsh(vseed ^ i, c + 5) - 0.5) * 0.3 : 0, dz: edge ? (s - 0.5) * 0.3 : 0 });
      };
      for (let c = 0; c < COLS; c++) if (L.obs[c]) pick(c, false);
      if (!L.mark) { pick(-1, true); pick(COLS, true); if (hsh(vseed ^ i, 201) < 0.4) pick(-3, true); if (hsh(vseed ^ i, 202) < 0.4) pick(COLS + 2, true); }
      if (i % 4 === 0) { d.lamp = (i >> 2) % 2 ? 1 : -1; d.obs = d.obs.filter(q => q.c !== (d.lamp > 0 ? COLS : -1)); }
      const n = 3 + Math.floor(hsh(vseed ^ i, 9) * 4);
      for (let t = 0; t < n; t++) { const x = hsh(vseed ^ (i * 53), t * 7 + 1) * 12 - 1.5, c = Math.floor(x); if (c < 0 || c >= COLS || !L.obs[c]) d.tufts.push([x, 0.12 + hsh(vseed ^ (i * 59), t) * 0.76, 0.8 + hsh(vseed ^ i, t + 40) * 0.6]); }
    }
    decor.set(i, d);
    if (decor.size > 160) decor.delete(decor.keys().next().value);
    return d;
  }
  const PROP_S = { 'bush-planter': 2.1, 'traffic-cone': 6.2, 'trash-dumpster': 2.5, 'street-lamp': 2.7 };

  // ---- the kid's feel + the hits: derived from the run between frames (never from the rules' clock)
  const fx = { t: -1, st: 'idle', hits: 0, y: 0, yaw: Math.PI, landAt: -1e9, landOn: '', hit: null, parts: [], wob: null, shake: 0, seen: false, out: 0 };
  let clock = 0, kidH = 0;
  const part = (kindOf, x, y, z, life, a = {}) => { if (fx.parts.length < 60) fx.parts.push({ k: kindOf, x, y, z, t0: clock, life, ...a }); };
  function splash(x, z, hex = 0x9fe8ff) {
    part('ring', x, 0.06, z, 520, { hex, r0: 0.25, r1: 1.25 });
    part('ring', x, 0.06, z, 760, { hex, r0: 0.1, r1: 0.9 });
    if (!reduce) for (let j = 0; j < 9; j++) { const a = j / 9 * Math.PI * 2; part('drop', x, 0.1, z, 520, { hex: 0xd8f6ff, vx: Math.cos(a) * (0.9 + (j % 3) * 0.35), vz: Math.sin(a) * 0.7, vy: 3.2 + (j % 4) * 0.5 }); }
  }

  /** one frame: the run after its last tick, `a` (0 … 1) into the next one, `dt` ms since the last frame */
  function draw(run, course, a, dt) {
    clock += dt;
    if (course !== courseRef) { courseRef = course; vseed = strSeed(course.seed); decor.clear(); }
    const t = run.t + a, lane = course.lane(run.y);
    if (run.t < fx.t || (run.t === 0 && fx.t !== 0)) { fx.hits = 0; fx.hit = null; fx.parts.length = 0; fx.yaw = Math.PI; fx.landAt = -1e9; fx.wob = null; fx.seen = false; fx.st = 'idle'; fx.out = 0; }
    // ---- the kid between ticks
    let kx = run.x / FP, ky = run.y + 0.5, lift = 0, f = 0, hopDir = '';
    if (run.st === 'hop') {
      f = Math.min(1, (run.k + a) / HOP_TICKS);
      kx = (run.fx + (run.tx - run.fx) * f) / FP; ky = run.fy + 0.5 + (run.ty - run.fy) * f; lift = Math.sin(Math.PI * f) * 0.52;
      hopDir = run.ty > run.fy ? 'u' : run.ty < run.fy ? 'd' : run.tx < run.fx ? 'l' : 'r';
    } else if (run.st === 'idle' && lane.type === 'water') kx += lane.dir * lane.v * a / FP;
    // what just happened (the view's own reading of the state)
    const landed = (fx.st === 'hop' && run.st !== 'hop') || (run.st === 'hop' && fx.st === 'hop' && (run.fy !== fx.fy || run.fx !== fx.fx));
    if (landed && run.hits === fx.hits) {
      const at = run.st === 'hop' ? course.lane(run.fy) : lane, lx = (run.st === 'hop' ? run.fx : run.x) / FP, ly = (run.st === 'hop' ? run.fy : run.y) + 0.5;
      fx.landAt = clock; fx.landOn = at.type;
      if (at.type === 'water') { const j = logUnder(at, run.t, run.st === 'hop' ? run.fx : run.x); fx.wob = { lane: at.i, j, t0: clock }; part('ring', X(lx), 0.07, Z(ly), 620, { hex: 0x7fdcff, r0: 0.5, r1: 1.7, sz: 0.55 }); }
      else if (at.type === 'grass' && !reduce) part('ring', X(lx), 0.05, Z(ly), 300, { hex: 0xbfe8b0, r0: 0.25, r1: 0.75, al: 0.45 });
    }
    if (run.hits > fx.hits) {
      const L = course.lane(run.y), dir = L.pulse ? L.pulse.dir : L.dir || 1;
      fx.hit = { cause: run.cause, t0: clock, x: kx, y: run.y + 0.5, dir, ground: L.type === 'water' ? -0.02 : 0 };
      fx.shake = reduce ? 0 : clock + 240;
      if (run.cause === 'water') splash(X(kx), Z(run.y + 0.5));
    }
    if (run.st !== 'down' && run.st !== 'out') { if (fx.hit && run.st !== 'taken') fx.hit = null; }
    fx.t = run.t; fx.st = run.st; fx.hits = run.hits; fx.fy = run.fy; fx.fx = run.fx;
    if (run.t > 0 || run.st === 'hop') fx.seen = true;

    // where his feet are: the ground, or a log's back (it bobs)
    const bobOf = (i, j) => (reduce ? 0 : Math.sin(clock / 520 + i * 1.7 + j * 2.3) * 0.028);
    let feet = 0;
    if (run.st !== 'hop' && lane.type === 'water') { const j = logUnder(lane, run.t, run.x); feet = j >= 0 ? 0.25 + bobOf(lane.i, j) : 0; }
    else if (run.st === 'hop') { const A = course.lane(run.fy), B = course.lane(run.ty); feet = (A.type === 'water' ? 0.25 : 0) * (1 - f) + (B.type === 'water' ? 0.25 : 0) * f; }
    // THE HOP: a squash at the push, a stretch in the air, a squash on landing, a small turn the way he hops; an idle bob between
    const since = clock - fx.landAt;
    let sy = 1, yawT = fx.seen ? 0 : Math.PI, tilt = 0;
    if (run.st === 'hop') { sy = 1 + 0.2 * Math.sin(Math.PI * f) - 0.17 * Math.exp(-f * 13); tilt = -0.3 * Math.sin(Math.PI * f); }
    else if (since < 150) sy = 1 - 0.2 * (1 - since / 150) * (1 - since / 150);
    else if (!reduce) sy = 1 + 0.022 * Math.sin(clock / 270);
    if (hopDir) fx.dir = hopDir;
    if (fx.seen) yawT = fx.dir === 'l' ? Math.PI / 2 : fx.dir === 'r' ? -Math.PI / 2 : fx.dir === 'd' ? Math.PI : 0;
    let dy = yawT - fx.yaw; while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI;
    fx.yaw += dy * (reduce ? 1 : 1 - Math.exp(-dt / 55));
    const sxz = 1 / Math.sqrt(sy);
    let px = X(kx), py = feet + lift, pz = Z(ky), lit = 1, show = !(run.blink && (run.blink >> 2) % 2), capOff = null, rx = tilt, rz = 0, ry = fx.yaw, s3 = [sxz, sy, sxz];
    // THE HITS, one per cause
    const H = fx.hit;
    if (H && (run.st === 'down' || run.st === 'out')) {
      const e = clock - H.t0, u = clamp01(e / 600);
      px = X(H.x); pz = Z(H.y); py = 0; rx = 0; show = true;
      if (H.cause === 'car') {                                   // flattened + the cap spins off
        s3 = [1.4, 0.13, 1.4];
        capOff = { x: 0.6 * u * H.dir, y: 1.5 * Math.sin(u * Math.PI) - 0.74 * u, r: e * 0.022 * (u < 1 ? 1 : 0) + (u >= 1 ? 2.1 : 0), tip: u >= 1 ? 0 : 0.5 };
      } else if (H.cause === 'water' || H.cause === 'edge') {    // (the edge: carried off on the log a moment more, then the splash) + the sink
        const carry = H.cause === 'edge' ? clamp01(e / 260) : 1, sink = clamp01((e - (H.cause === 'edge' ? 260 : 0)) / 380);
        if (H.cause === 'edge') { px += H.dir * 0.9 * carry; if (!H.wet && carry >= 1) { H.wet = 1; splash(px, pz); } py = 0.25 * (1 - sink); }
        py -= sink * 1.05; s3 = [1 - sink * 0.3, 1, 1 - sink * 0.3]; rz = sink * 0.5;
        if (sink >= 1) show = false;
      } else if (H.cause === 'train' || H.cause === 'blackbird') {   // knocked away, spinning
        const v = clamp01(e / 700);
        px += H.dir * v * 9; py = 0.2 + 2.4 * Math.sin(v * Math.PI * 0.85); rz = -H.dir * e * 0.016; ry = fx.yaw + e * 0.01;
        if (v >= 1) show = false;
      } else if (H.cause === 'wall') {                           // swallowed by the dark
        const v = clamp01(e / 420); lit = 1 - v; py = -v * 0.5; s3 = [1 - v * 0.35, 1 - v * 0.6, 1 - v * 0.35];
        if (v >= 1) show = false;
      } else {                                                   // (the UFO: a placeholder until H6 — beamed up)
        const v = clamp01(e / 650); py = v * 6; ry = fx.yaw + e * 0.012; s3 = [1 - v * 0.6, 1 - v * 0.6, 1 - v * 0.6];
        if (v >= 1) show = false;
      }
    } else if (run.st === 'taken') { fx.out += dt; py = Math.min(16, fx.out * 0.007); ry = fx.yaw + fx.out * 0.008; }
    // the blackout on him
    const wallE = run.wall / FP, darkOf = i => clamp01(wallE - i), litOf = i => 1 - 0.96 * darkOf(i);
    lit *= litOf(Math.floor(ky));
    kid.visible = show;
    kid.position.set(px, py, pz); kid.rotation.set(rx, ry, rz, 'YXZ'); kid.scale.set(s3[0] * KID_S, s3[1] * KID_S, s3[2] * KID_S);
    kidMat.userData.u.uLit.value = capMat.userData.u.uLit.value = lit;
    kidMat.userData.u.uRim.value.copy(rimCol).multiplyScalar(0.5 * lit); capMat.userData.u.uRim.value.copy(kidMat.userData.u.uRim.value);
    if (capOff) { kidCap.position.set(px + capOff.x, py + capOff.y * KID_S, pz + 0.25 * clamp01(capOff.x * 2 * H.dir)); kidCap.rotation.set(capOff.tip, capOff.r, 0, 'YXZ'); kidCap.scale.setScalar(KID_S); }
    else { kidCap.position.copy(kid.position); kidCap.rotation.copy(kid.rotation); kidCap.scale.copy(kid.scale); }
    kidCap.visible = show;
    kidH = kidGeo.height * s3[1] * KID_S;

    // ---- THE CAMERA (camera.js): a smooth follow that leads a hop to where it lands — up the lanes AND sideways (clamped at the play
    // area's edges; a log ride is followed) — the slight turn, a short shake on a hit (never with reduce motion)
    const down = run.st === 'down' || run.st === 'out';
    rig.follow(run.st === 'hop' ? run.tx / FP : down && H ? H.x : kx, run.st === 'hop' ? run.ty + 0.5 : down ? (H ? H.y : ky) : ky, dt);
    depth();
    const camY = rig.y();
    let shx = 0, shy = 0;
    if (clock < fx.shake) { const q = (fx.shake - clock) / 240; shx = Math.sin(clock * 0.09) * 0.16 * q; shy = Math.cos(clock * 0.113) * 0.12 * q; }
    rig.apply(cam, shx, shy);
    // the skyline slides against the follow (a far thing barely moves) + sits a step over in the turned view
    const sl = Math.round((rig.x() * 2.2 - rig.yaw() * 28) * 20) / 20;
    if (sl !== skyAt) { skyAt = sl; skyImg.style.transform = `translate3d(${(-50 - sl).toFixed(2)}%,0,0)`; }

    // ---- the lanes
    for (const q of Object.values(K)) q.reset();
    for (const q of Object.values(KM)) q.reset();
    const kindOf = L => (L.mark ? KIND.mark : KIND[L.type]);
    const base = Math.floor(camY) - BACK, top = base + BACK + Math.min(AHEAD, Math.ceil(24 * rig.k()) + 2);
    let nu = 0, gi = 0;
    for (let i = base; i < top; i++) {
      const L = course.lane(i), z = Z(i + 0.5), dk = darkOf(i), lt = 1 - 0.96 * dk, on = lt > 0.3;
      let fxv = 0;
      if (L.type === 'grass') {
        const D = decorOf(i, L);
        for (const q of D.obs) {
          const x = X(q.c + 0.5) + q.dx, zz = z + q.dz, dim = lt * (q.c < 0 || q.c >= COLS ? 0.5 : 1);
          if (q.k === 'tree' || (q.k !== 'barricade' && !KM[q.k])) { const s = 0.72 + q.s * 0.3; K.trees.put(x, 0, zz, s, s, s, q.ry * 3, 0xffffff, dim); K.shadow.put(x, 0.03, zz + 0.1, 1.15 * s, 1, 1.0 * s, 0, 0, 1, 0, 0.5 * lt); }
          else if (q.k === 'barricade') { K.barricades.put(x, 0, zz, 1.04, 1.04, 1.04, q.ry * 0.22, 0xffffff, dim * 1.3); K.shadow.put(x, 0.03, zz + 0.06, 1.1, 1, 0.6, 0, 0, 1, 0, 0.45 * lt); if (on) K.bill.put(x + 0.4, 0.68, zz, 0.3, 0.3, 1, 0, 0xffa530, 1, 0, 0.95 * dim); }
          else { const s = PROP_S[q.k]; KM[q.k].put(x, 0, zz, s, s, s, Math.round(q.ry) * Math.PI / 2 + (q.k === 'traffic-cone' ? q.ry : 0), 0xffffff, dim * 1.35); K.shadow.put(x, 0.03, zz + 0.06, 0.95, 1, 0.8, 0, 0, 1, 0, 0.45 * lt); }
        }
        if (D.lamp) {                                            // a street lamp on the edge column: its head over the grass, a warm pool under it
          const side = D.lamp, x = X(side > 0 ? COLS + 0.55 : -0.55);
          if (KM['street-lamp']) KM['street-lamp'].put(x, 0, z, 2.7, 2.7, 2.7, side > 0 ? Math.PI / 2 : -Math.PI / 2, 0xffffff, lt * 1.3);
          if (on) { K.flat.put(x - side * 0.75, 0.035, z, 3.6, 1, 3.0, 0, 0xffc27a, 1, 0, 0.34 * lt); K.bill.put(x - side * 0.5, 1.72, z, 0.34, 0.34, 1, 0, 0xffd9a0, 1, 5, 0.8 * lt); }
        }
        if (tier > 0) for (const q of D.tufts) K.tufts.put(X(q[0]), 0, z - 0.5 + q[1], q[2], q[2], q[2], q[0] * 9, 0xffffff, lt * (q[0] < 0 || q[0] > COLS ? 0.6 : 1));
        if (L.oneUp >= 0 && !run.ups[i]) K.bill.put(X(L.oneUp + 0.5), 0.4, z, 0.6, 0.6, 1, 0, 0xff5ec4, 1, 5, 1);
      } else if (L.type === 'road' || L.type === 'water') {
        const car = L.type === 'road', per = L.period / FP;
        for (let j = 0; j < L.items.length; j++) {
          const it = L.items[j], len = it.len / FP, l0 = moverLeft(L, it, t) / FP;
          // (the lane is one lap long: the view shows a mover's next lap too, so nothing pops in or out at the screen's side — the copies
          //  are always outside the 9 played columns)
          for (let lap = -1; lap <= 1; lap++) {
            const left = l0 + lap * per;
            if (left > COLS + 9 || left + len < -9) continue;
            const cx = X(left + len / 2), inside = left + len > 0 && left < COLS, dim = lt * (inside ? 1 : 0.55);
            if (car) {
              const r = hsh(vseed ^ (i * 7919), j * 13 + 1), tint = NEON[Math.floor(hsh(vseed ^ (i * 104729), j * 31 + 7) * NEON.length)];
              const name = len < 1.5 ? CARS[Math.floor(r * 3)] : 'car-van', q = KM[name], B = BOX[name], ry = L.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
              const bodyL = len < 1.5 ? 0.96 : 1.9, sz = B ? bodyL / B.l : 1, sx = B ? (len < 1.5 ? 0.7 : 0.78) / B.w : 1, sy = B ? (len < 1.5 ? 0.42 : 0.52) : 1;
              const nose = left + (L.dir > 0 ? len - 0.02 : 0.02), bx = X(nose - L.dir * bodyL / 2), tail = left + (L.dir > 0 ? 0.02 : len - 0.02);
              const truck = len > 2.5, tz = (len - 0.1) / TRUCK.len;   // (3 cells = THE BOX TRUCK, built in code — models.js#buildTruck)
              if (truck) K.trucks.put(cx, 0, z, 0.94, 0.9, tz, ry, tint, 1, dim);
              else if (q) q.put(bx - L.dir * B.cz * sz, 0, z, sx, sy, sz, ry, tint, 1, dim);
              K.shadow.put(cx, 0.03, z, len * 1.12, 1, 1.05, 0, 0, 1, 0, 0.6 * lt);
              if (on) {
                const hw = len < 1.5 ? 0.2 : 0.24, hy = truck ? 0.3 : len < 1.5 ? 0.2 : 0.24, a1 = dim;
                // the truck's amber markers along the foot of the box's side (the side the camera sees)
                if (truck) for (const m of [0, 0.34, 0.67, 1]) K.bill.put(cx + L.dir * (TRUCK.box[0] + (TRUCK.box[1] - TRUCK.box[0]) * m) * tz, 0.29, z + 0.4, 0.24, 0.24, 1, 0, 0xff9a1c, 1, 0, a1);
                K.flat.put(X(nose + L.dir * 1.25), 0.04, z, 2.6, 1, 1.15, L.dir > 0 ? 0 : Math.PI, 0xfff0c8, 1, 2, 0.62 * a1);   // the headlight pool, ahead
                K.flat.put(X(tail - L.dir * 0.45), 0.04, z, 1.5, 1, 1.0, 0, 0xff2030, 1, 0, 0.5 * a1);                            // the taillight pool, behind
                K.flat.put(X(tail - L.dir * (1.0 + L.v * 0.02)), 0.3, z, 2.0 + L.v * 0.045, 1, 0.62, L.dir > 0 ? 0 : Math.PI, tint, 1, 1, 0.7 * a1);   // THE LIGHT TRAIL
                K.bill.put(X(nose), hy, z - hw, 0.2, 0.2, 1, 0, 0xfff0c0, 1, 5, 0.8 * a1); K.bill.put(X(nose), hy, z + hw, 0.2, 0.2, 1, 0, 0xfff0c0, 1, 5, 0.8 * a1);
                K.bill.put(X(tail), hy + 0.02, z - hw, 0.17, 0.17, 1, 0, 0xff2840, 1, 5, 0.9 * a1); K.bill.put(X(tail), hy + 0.02, z + hw, 0.17, 0.17, 1, 0, 0xff2840, 1, 5, 0.9 * a1);
              }
            } else {
              const wob = fx.wob && fx.wob.lane === i && fx.wob.j === j && lap === 0 ? clock - fx.wob.t0 : 9e9, wv = wob < 520 && !reduce ? Math.exp(-wob / 170) * Math.sin(wob / 42) : 0;
              const by = bobOf(i, j) - 0.05 - wv * 0.07;
              K.logs.put(cx, by, z, len - 0.08, 0.78, 1.02, 0, 0xffffff, dim, 1, 1, wv * 0.16);
              if (on) {
                K.flat.put(cx, 0.045, z, len + 1.5, 1, 2.0, 0, 0xffa23a, 1, 0, 0.36 * dim);                                       // its amber glow on the water
                K.flat.put(X(L.dir > 0 ? left - 0.95 : left + len + 0.95), 0.05, z, 2.3, 1, 0.92, L.dir > 0 ? 0 : Math.PI, 0xc8f6ff, 1, 1, 0.34 * dim);   // a soft wake behind it
                K.flat.put(cx, 0.06, z + 0.4, len + 0.1, 1, 0.2, 0, 0xffb648, 1, 4, 0.95 * dim); K.flat.put(cx, 0.06, z - 0.4, len + 0.1, 1, 0.2, 0, 0xffb648, 1, 4, 0.7 * dim);   // AMBER edges
                K.bill.put(X(left + 0.03), 0.2 + by, z, 0.42, 0.5, 1, 0, 0xffb040, 1, 0, 0.9 * dim); K.bill.put(X(left + len - 0.03), 0.2 + by, z, 0.42, 0.5, 1, 0, 0xffb040, 1, 0, 0.9 * dim);
              }
            }
          }
        }
      } else {
        const p = L.pulse, st = pulseAt(p, Math.floor(t)), rail = L.type === 'rail', u = mod(t - p.phase, p.period);
        // (the body is drawn a little before + after its pass too: it is SEEN coming through the edge column and leaving through the other)
        const lead = 10, s = u < p.pass + lead ? u : u > p.period - lead ? u - p.period : null;
        if (rail) {
          const tell = st.st !== 'idle' || s !== null, blink = tell && Math.floor(t / 8) % 2 === 0;
          fxv = tell ? (blink ? 1 : 0.35) : 0;
          for (const c of [-0.3, 3, 6, 9.3]) {                // the signals: red, flashing from the tell to the train's tail
            const x = X(c);
            K.posts.put(x, 0.3, z - 0.44, 0.07, 0.6, 0.07, 0, 0x2a2a34, lt);
            K.bill.put(x, 0.66, z - 0.44, blink ? 0.62 : 0.24, blink ? 0.62 : 0.24, 1, 0, blink ? 0xff2a2a : 0x7a1414, 1, 5, (blink ? 1 : 0.8) * lt);
            if (blink && on) K.flat.put(x, 0.04, z - 0.3, 2.2, 1, 1.5, 0, 0xff2020, 1, 0, 0.5 * lt);
          }
          if (st.st === 'tell' && on) {                           // a warning glow on the side it comes from
            const pulse = 0.55 + 0.45 * Math.sin(t * 0.55), side = p.dir > 0 ? -1.2 : COLS + 1.2;
            K.flat.put(X(side), 0.05, z, 5.5, 1, 2.4, 0, 0xff3030, 1, 0, 0.7 * pulse * lt); K.bill.put(X(side), 0.7, z, 2.6, 2.2, 1, 0, 0xff3030, 1, 0, 0.5 * pulse * lt);
          }
          if (s !== null && KM['train-front'] && KM['train-carriage']) {
            const left = pulseLeft(p, s) / FP, len = p.len / FP, F = BOX['train-front'], Cg = BOX['train-carriage'], sc = 0.74, n = 6;
            const fl = F.l * sc, cl = (len - fl * 2) / (n - 1), ry = p.dir > 0 ? Math.PI / 2 : -Math.PI / 2, nose = p.dir > 0 ? left + len : left;
            KM['train-front'].put(X(nose - p.dir * fl / 2), 0, z, sc, sc, sc, ry, 0xffffff, lt);
            KM['train-front'].put(X(nose - p.dir * (len - fl / 2)), 0, z, sc, sc, sc, -ry, 0xffffff, lt);
            for (let c = 0; c < n - 1; c++) {
              const cx = X(nose - p.dir * (fl + cl * (c + 0.5)));
              KM['train-carriage'].put(cx, 0, z, sc, sc, cl / Cg.l, ry, 0xffffff, lt);
              if (on) for (const wx of [-0.62, 0, 0.62]) K.bill.put(cx + wx, 0.98, z + 0.3, 0.4, 0.26, 1, 0, c % 2 ? 0x7fe6ff : 0xffe6a8, 1, 0, 0.9 * lt);   // lit windows
            }
            K.shadow.put(X(left + len / 2), 0.03, z, len * 1.03, 1, 1.25, 0, 0, 1, 0, 0.65 * lt);
            if (on) {
              K.flat.put(X(nose + p.dir * 3.2), 0.05, z, 6.6, 1, 2.3, p.dir > 0 ? 0 : Math.PI, 0xfff2d0, 1, 2, 0.85 * lt);          // the headlight beam, sweeping ahead
              K.bill.put(X(nose), 0.5, z, 0.7, 0.7, 1, 0, 0xfff6d8, 1, 5, lt);
              K.flat.put(X(left + len / 2), 0.045, z + 0.55, len, 1, 0.9, 0, 0x7fd0ff, 1, 4, 0.3 * lt);
            }
          }
        } else {
          const tellF = st.st === 'tell' ? 1 - st.left / p.tell : st.st === 'pass' ? 1 : 0;
          fxv = tellF * p.dir;
          // THE FLIGHT PATH: blue runway lights in the ground; the tell = the lights RACING toward the crossing (bold, unmissable)
          const head = st.st === 'tell' ? (tellF * tellF * 7 + tellF * 2) % 1 * 14 - 2.5 : -99;
          for (let c = -1; c <= COLS; c++) {
            const at = p.dir > 0 ? c : COLS - 1 - c, hot = st.st === 'pass' || (head > -50 && at <= head && at > head - 3.2), far = c < 0 || c >= COLS ? 0.6 : 1;
            for (const e of [-0.42, 0.42]) {
              K.bill.put(X(c + 0.5), 0.07, z + e, hot ? 0.74 : 0.3, hot ? 0.74 : 0.3, 1, 0, hot ? 0xd8f0ff : 0x2f7bff, 1, 5, (hot ? 1 : 0.85) * lt * far);
              if (on) K.flat.put(X(c + 0.5), 0.04, z + e, hot ? 1.7 : 0.8, 1, hot ? 1.2 : 0.6, 0, 0x2a7cff, 1, 0, (hot ? 0.75 : 0.35) * lt * far);
            }
          }
          if (s !== null) {                                       // THE BLACKBIRD's placeholder (H6): a dark dart + its burner
            const left = pulseLeft(p, s) / FP, len = p.len / FP;
            K.jets.put(X(left + len / 2), 1.0, z, len, 1.1, 1.1, p.dir > 0 ? 0 : Math.PI, 0xffffff, lt);
            K.bill.put(X(p.dir > 0 ? left : left + len), 1.0, z, 1.3, 1.0, 1, 0, 0xff8a3a, 1, 0, lt);
            K.shadow.put(X(left + len / 2), 0.03, z, len, 1, 1.0, 0, 0, 1, 0, 0.5 * lt);
          }
        }
      }
      if (L.ufo && nu < 2 && !ufos.slice(0, nu).some(q => q.id === L.ufo.id)) {   // THE UFO's placeholder (H6): a disc + its beam circle on the ground
        const q = ufos[nu++], bx = ufoX(L.ufo, t) / FP, by = ufoY(L.ufo, t) / FP, r = L.ufo.r / FP;
        q.id = L.ufo.id; q.d.position.set(X(bx), 4.2, Z(by)); q.d.visible = true;
        K.flat.put(X(bx), 0.05, Z(by), r * 2.5, 1, r * 2.5, 0, 0x6dffb0, 1, 3, 0.95); K.flat.put(X(bx), 0.045, Z(by), r * 2.1, 1, r * 2.1, 0, 0x3dff9a, 1, 0, 0.42);
        K.bill.put(X(bx), 4.0, Z(by), 2.6, 1.2, 1, 0, 0x7dffc0, 1, 0, 0.7);
      }
      ground.lay(gi++, i, kindOf(L), kindOf(course.lane(i - 1)), kindOf(course.lane(i + 1)), hsh(vseed, i) * 10, dk, fxv);
    }
    ground.done(gi);
    for (let j = nu; j < 2; j++) { ufos[j].d.visible = false; ufos[j].id = -1; }
    // his blob shadow: smaller + fainter as he rises
    if (show && py > -0.2) K.shadow.put(px, feet + 0.035, pz + 0.05, 0.98 * (1 - lift * 0.55) * s3[0], 1, 0.78 * (1 - lift * 0.55) * s3[2], 0, 0, 1, 0, 0.66 * (1 - lift * 0.9) * lit);
    // HE ALWAYS STANDS OUT: a soft pool of his colour on the ground under him + a ring round his feet (it breathes — never with reduce motion)
    if (show && py > -0.2 && lit > 0.25 && !(H && down)) {
      const br = reduce ? 1 : 0.94 + 0.06 * Math.sin(clock / 260);
      K.flat.put(px, feet + 0.04, pz + 0.04, 2.3, 1, 1.9, 0, kidHex, 1, 0, 0.5 * lit);
      K.flat.put(px, feet + 0.045, pz + 0.04, 1.42 * br, 1, 1.16 * br, 0, kidHex, 1, 3, 0.8 * lit);
    }
    // the small moments: a dust ring, a ripple, a splash
    for (let j = fx.parts.length - 1; j >= 0; j--) {
      const q = fx.parts[j], u = (clock - q.t0) / q.life;
      if (u >= 1) { fx.parts.splice(j, 1); continue; }
      if (q.k === 'ring') { const r = q.r0 + (q.r1 - q.r0) * ease(u); K.flat.put(q.x, q.y, q.z, r * 2, 1, r * 2 * (q.sz || 0.7), 0, q.hex, 1, 3, (1 - u) * (q.al || 0.8)); }
      else { const s = (clock - q.t0) / 1000; K.bill.put(q.x + q.vx * s, q.y + q.vy * s - 6.5 * s * s, q.z + q.vz * s, 0.16, 0.16, 1, 0, q.hex, 1, 0, 1 - u); }
    }
    // THE BLACKOUT: a cold edge where it bites, the black behind it
    K.flat.put(0, 0.08, Z(wallE), 30, 1, 0.5, 0, 0x8fc4ff, 1, 4, 0.5); K.flat.put(0, 0.07, Z(wallE + 0.5), 30, 1, 2.2, 0, 0x2a4a9a, 1, 4, 0.16);
    curtain.position.set(0, 1.2, Z(wallE - 1.1 - 20)); curtain.scale.set(60, 2.6, 40);
    for (const q of Object.values(K)) q.done();
    for (const q of Object.values(KM)) q.done();
    ground.uniforms.uTime.value = reduce ? 0 : clock / 1000;
    renderer.info.reset();
    renderer.render(scene, cam);
    if (bloom) bloom.render(scene, cam);
  }

  const v3 = new THREE.Vector3();
  return {
    el, draw, resize: () => fit(), ready, setTier, tier: () => tier,
    /** the lab's switches: ZOOM 7 · 8 · 9 + ANGLE straight · turned (eased; `snap` = at once) */
    setCamera(zoom, angle, snap) { rig.choose(zoom, angle, snap); },
    zoom: () => rig.zoom(), angle: () => rig.angle(),
    /** a ground point (column cells, lane) → where it is on the screen ([x, y] 0 … 1 from the top left) — the framing's checks */
    project(cells, lane) { v3.set(X(cells), 0, Z(lane)).project(cam); return [(1 + v3.x) / 2, (1 - v3.y) / 2]; },
    kidScreenX() { v3.copy(kid.position).project(cam); return (1 + v3.x) / 2; },
    setKidColor: tintOf,
    /** where the kid is on the screen (0 … 1 from the top) — the camera's check */
    kidScreenY() { v3.copy(kid.position).project(cam); return (1 - v3.y) / 2; },
    /** how tall he stands on the screen, in CSS px (= pt) — the wider view's readability number */
    kidHeightPx() { v3.set(kid.position.x, kid.position.y, kid.position.z).project(cam); const y0 = v3.y; v3.set(kid.position.x, kid.position.y + kidH, kid.position.z).project(cam); return Math.abs(v3.y - y0) / 2 * h; },
    info: () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles, dpr, w, h, fov: cam.fov, tier, zoom: rig.zoom(), angle: rig.angle(), camX: rig.x(), yaw: rig.yaw(), bloom: !!bloom, look: 'night' }),
    destroy() {
      dead = true; ro.disconnect();
      for (const { m, g } of made) { scene.remove(m); m.material.dispose(); if (g) g.dispose(); m.dispose(); }
      for (const g of Object.values(GEO)) g.dispose();
      for (const m of [kid, kidCap, curtain, ...ufos.map(q => q.d)]) { m.material.dispose(); }
      kidGeo.body.dispose(); kidGeo.cap.dispose(); discGeo.dispose(); flatGeo.dispose(); billGeo.dispose(); unit.dispose(); ground.dispose();
      if (bloom) bloom.dispose();
      if (env) env.dispose();
      renderer.dispose();
      try { renderer.forceContextLoss(); } catch { /* fine */ }
      el.remove(); sky.remove();
    },
  };
}
