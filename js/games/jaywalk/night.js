// JAYWALK — THE SCENE (H2 … H6B; three.js 0.160): the pure engine drawn in the smooth stylized 3D style — NIGHT + DAY are ONE scene
// (setLook). The same interface as the graybox: draw(run, course, a, dt). A VIEW: it draws from (run, course) and writes nothing; no
// rule, replay or server file imports it. What each part is + why → docs/jaywalk.md "THE NIGHT LOOK" · "THE DAY LOOK" · "THE AREAS" ·
// "NO WEAK POINTS" · "THE BIG MOMENTS" (flyers.js — on demand) · "THE CAMERA" · "THE LINES" · "THE GHOSTS" · "THE FINAL POLISH".
// Everything that repeats is INSTANCED; a window of lanes round the kid is alive; bloom at tier 2 only (setTier).
import * as THREE from 'three';
import { FP, COLS, HOP_TICKS, MODES } from './tuning.js';
import { moverLeft, pulseAt, pulseLeft, logUnder, ufoX, ufoY, mod, area, gateName } from './course.js';
import { loadKenney, loadKid, KID, SCENE_MODELS, buildTree, buildTuft, buildLog, LOG, buildTruck, TRUCK, buildBarricade } from './models.js';
import { FOG_HEX, DAY_FOG_HEX, KIND, rgb, createGround, glowMaterial, paintMaterial, neonEnv, dayEnv, createBloom, fogUp, FOG_UP } from './night-fx.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { skyPlan, skyHeld, skyRoom, skyShift, skyOff, SKY_FADE_MS, SKY_LOOK_MS, SKY_BAND, SKY_ASPECT, SKY_LIGHTS, SKY_NEON } from './skyline.js';
import { CAM, createCamera } from './camera.js';
import { ctx2d } from '../../ui/canvas-safe.js';
import { LINE_HEX } from './lines.js';
import { drawNum, numWidth } from './numerals.js';
import { LOOKS, PIECE, buildAreaGeo, dressLane, sigOf, drawBig, drawSig, drawFishSign } from './areas.js';
import { hsh, strSeed, vehicleAt } from './causes.js';   // (THE ONE SOURCE OF TRUTH for which vehicle a car IS — the end screen's cause line reads the same function)

const BACK = 9, AHEAD = 27, POOL = BACK + AHEAD;   // (the most lanes alive: 36 — a closer zoom lays fewer ahead)
const NEON = [0xff3fb4, 0x22e0ff, 0xa05bff, 0xff5a7a, 0x4d7dff];   // (a car's body tint: pink · cyan · violet · coral · blue)
/** two colours a phone could confuse (the go-live review: a cyan kid vanished against two cyan vans) */
const nearHex = (a, b) => Math.abs((a >> 16) - (b >> 16)) + Math.abs(((a >> 8) & 255) - ((b >> 8) & 255)) + Math.abs((a & 255) - (b & 255)) < 150;
/** car `k`'s tint for a viewer whose kid wears `kid`: its own — or the next in the palette that is not near the kid's */
export const carTint = (k, kid) => { for (let q = 0; q < NEON.length; q++) { const t = NEON[(k + q) % NEON.length]; if (!nearHex(t, kid)) return t; } return NEON[k]; };
const TAXI_HEX = 0xffc81a;   // (H4 — THE TAXI: cab yellow, never a neon tint)
const DPR_AT = [1.5, 2, 3];
// THE LAMPS: a vehicle's head / tail lights — [half their spacing across the lane, their height]
const LAMPS = Object.freeze({ 'car-sedan': [0.225, 0.2], 'car-hatchback': [0.225, 0.2], 'car-taxi': [0.225, 0.2], 'car-van': [0.26, 0.24], truck: [0.25, 0.3], train: [0.2, 0.45] });
const HEAD_REACH = 1.35, TAIL_LEN = 1.2;   // (TAIL_LEN — H5C: the tail pool, from under the bumper to where it has faded out)
const LOG_FEET = 0.33;   // (H3 — where the kid's feet stand on a log: its round back, the log HALF-SUNK — its centre a hair under the waterline)
const KID_S = 1.62;   // (THE KID's size on the lane — H5A, Kenney's skate boy, 0.78 tall: ≈ 1.26 of a lane tall — he must read at real phone size; the rules' box stays 0.6 of a cell)
/** his poses: the idle loop (ms), how fast the fall flails */
const IDLE_MS = 1333, FALL_MS = 333;
const KID_YAW = Math.PI;   // (Kenney's kid faces +z, as his cars do; the scene's "up the course" is −z)
const X = c => c - COLS / 2, Z = l => -l;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const NOP = () => {};
const RING8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]];
const SKY_DIR = new URL('../../../assets/jaywalk/', import.meta.url);
/** THE DRUMS: red · orange · yellow — never blue (blue on the ground = water) */
const DRUM_HEX = [0xd8402c, 0xee8a1e, 0xf2c21c];
/** THE SUN: a day shadow's direction on the ground (x, z) + its length per unit of height */
const SUN = Object.freeze({ x: 0.97, z: -0.24, len: 0.7 });
/** THE FOG BANK's layers (back → front): [lanes behind the bank's edge, height, a puff's width + height, alpha, drift (cells / s),
 *  its sunlit top, its cool underside, the spacing] */
const FOG_LAYERS = Object.freeze([
  [-7.9, 2.95, 8.0, 5.0, 0.85, 0.05, 0xf6f9fb, 0xbccad8, 2.5],
  [-5.9, 2.9, 7.0, 4.5, 0.85, -0.08, 0xf0f5f8, 0xc0cddb, 2.25],
  [-4.2, 2.75, 6.4, 4.0, 0.9, 0.07, 0xf8fbfc, 0xc6d2de, 2.05],
  [-2.7, 1.3, 6.2, 4.0, 1.0, 0.11, 0xf2f6f9, 0xd0dbe5, 2.2],
  [-1.3, 0.95, 4.6, 3.0, 0.9, -0.18, 0xfbfdfe, 0xdde6ee, 1.7],
  [-0.1, 0.6, 3.3, 2.1, 0.55, 0.28, 0xffffff, 0xecf2f6, 1.35],
]);
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
  const rig = createCamera({ zoom: o.zoom, angle: o.angle, hero: o.hero });   // (hero: THE POSTER's low camera — camera.js; the game never passes it)
  const heroCam = !!o.hero;   // THE CAMERA (camera.js): the zoom, the sideways follow, the turn
  // the night's light: a cool fill, a soft key, a pink RIM LIGHT from behind
  const hemi = new THREE.HemisphereLight(0x8fa0ff, 0x1a1030, 1.5); scene.add(hemi);
  const key = new THREE.DirectionalLight(0xdfe4ff, 1.55); key.position.set(-5, 12, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff6ad0, 1.25); rim.position.set(6, 5, -10); scene.add(rim);
  let env = null, envDay = null;
  try { env = neonEnv(renderer); scene.environment = env; } catch { /* no gloss: fine */ }

  const P = new THREE.Vector3(), S = new THREE.Vector3(), Q = new THREE.Quaternion(), E = new THREE.Euler(), M = new THREE.Matrix4(), C = new THREE.Color();
  const made = [];
  /** an instanced kind. put(x, y, z, sx, sy, sz, ry, hex, k): place + size + turn + colour (× k) */
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
      put(x, y, z, sx, sy, sz, ry, hex, k = 1, a0 = 1, a1 = 1, rx = 0, rz = 0, a2 = 0, a3 = 0) {
        if (i >= n) return;
        P.set(x, y, z); S.set(sx, sy, sz);
        if (rx || rz) Q.setFromEuler(E.set(rx, ry, rz, 'YXZ')); else if (ry) Q.setFromAxisAngle(UP, ry); else Q.identity();
        M.compose(P, Q, S); m.setMatrixAt(i, M);
        // (BY DAY a `k` over 1 is THE FOG BANK taking the thing — it fades INTO the fog's own colour, never brighter than it)
        const f = day && k > 1 ? Math.min(1, (k - 1) / 2.4) : 0, kk = f ? 1 - f : k;
        if (raw) { col[i * 3] = ((hex >> 16) & 255) / 255 * kk + 0.875 * f; col[i * 3 + 1] = ((hex >> 8) & 255) / 255 * kk + 0.906 * f; col[i * 3 + 2] = (hex & 255) / 255 * kk + 0.933 * f; }
        else { C.setHex(hex); col[i * 3] = C.r * kk + 0.72 * f; col[i * 3 + 1] = C.g * kk + 0.79 * f; col[i * 3 + 2] = C.b * kk + 0.85 * f; }
        if (ax) { const q = i * aux[1]; ax.array[q] = a0; if (aux[1] > 1) ax.array[q + 1] = a1; if (aux[1] > 2) { ax.array[q + 2] = a2; ax.array[q + 3] = a3; } }
        i++;
      },
      done() { m.count = i; m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true; if (ax) ax.needsUpdate = true; },
    };
  }
  const UP = new THREE.Vector3(0, 1, 0);
  /** THE TAIL LIGHT BAR: a thin red bar across a vehicle's rear, `vw` wide — it glows by night */
  function tailBar(x, y, z, vw, a) {
    K.flat.put(x, y, z, vw, 1, day ? 0.09 : 0.15, Math.PI / 2, day ? 0xd81828 : 0xff2030, 1, 4, (day ? 1 : 1.3) * a);
    if (!day) { K.flat.put(x, y + 0.002, z, vw * 0.92, 1, 0.05, Math.PI / 2, 0xffd6cc, 1, 4, 0.9 * a); K.flat.put(x, y - 0.002, z, vw * 1.25, 1, 0.5, Math.PI / 2, 0xff2030, 1, 4, 0.3 * a); }
  }
  const lambert = () => fogUp(new THREE.MeshLambertMaterial({ vertexColors: true }));   // (fogUp — H5C: a thing fades into the far haze as the ground under it does)
  const glossy = (rough, envI) => new THREE.MeshStandardMaterial({ roughness: rough, metalness: 0, envMapIntensity: envI });

  // ---- the kinds (≈ 26 draw calls: one a kind)
  const ground = createGround(POOL, fogV);
  scene.add(ground.mesh);
  const flatGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), billGeo = new THREE.PlaneGeometry(1, 1), unit = new THREE.BoxGeometry(1, 1, 1);
  const GEO = { tree: buildTree(), tuft: buildTuft(), log1: buildLog(1), log2: buildLog(2), log3: buildLog(3), log4: buildLog(4), truck: buildTruck(), barricade: buildBarricade() };
  const K = {
    shadow: kind(flatGeo, glowMaterial(fogV, { shadow: true }), 420, { aux: ['aFx', 2], raw: true, order: 1 }),
    flat: kind(flatGeo, glowMaterial(fogV), 720, { aux: ['aFx', 2], raw: true, order: 2, bloom: true }),          // pools · trails · beams · rings · edge lines
    bill: kind(billGeo, glowMaterial(fogV, { bill: true }), 600, { aux: ['aFx', 2], raw: true, order: 3, bloom: true }),   // lamps · light quads · sparks
    trees: kind(GEO.tree, lambert(), 150),
    tufts: kind(GEO.tuft, lambert(), 220),
    // THE LOGS: one geometry a length (1–4 cells, nothing stretched); rough wood
    ...Object.fromEntries([1, 2, 3, 4].map(n => [`log${n}`, kind(GEO[`log${n}`], fogUp(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0, envMapIntensity: 0.25 })), 60)])),
    trucks: kind(GEO.truck, paintMaterial(glossy(0.3, 1), { instanced: true }), 24, { aux: ['aLit', 1] }),
    barricades: kind(GEO.barricade, lambert(), 40),
    posts: kind(unit, fogUp(new THREE.MeshLambertMaterial({ color: 0xffffff })), 280),
  };
  // THE SUN's SHADOWS; `raw` = straight under the thing only (the kid's ring, a line's words' strip)
  let day = false;
  // by day a shadow is TWO: a tight CONTACT shadow + THE SUN's, thrown along SUN by the thing's height (`sy`)
  { const put0 = K.shadow.put; K.shadow.raw = put0; K.shadow.put = (x, y, z, sx, sy, sz, ry, hex, k, a0, a1, ...r) => {
    if (!day) { put0(x, y, z, sx, 1, sz, ry, hex, k, a0, a1, ...r); return; }
    const a = a1 == null ? 1 : a1, off = Math.min(SUN.len * (sy === 1 ? 0.55 : sy), 0.4 * Math.min(sx, sz) + 0.14);   // (never further than the shadow is wide: it stays joined to the thing)
    put0(x + SUN.x * off, y - 0.003, z + SUN.z * off, sx * 1.05, 1, sz * 1.05, ry, hex, k, a0, a * 0.62, ...r);
    put0(x + SUN.x * 0.05, y, z + SUN.z * 0.05, sx * 0.9, 1, sz * 0.9, ry, hex, k, a0, a * 0.9, ...r);
  }; }
  // THE AREAS' PIECES (areas.js) — one kind each
  const AGEO = buildAreaGeo(), AK = {};
  for (const [name, g] of Object.entries(AGEO)) AK[name] = K[`a_${name}`] = kind(g, lambert(), { bollard: 60, crate: 90, icecrate: 60, drum: 70, rock: 90, hydrant: 40, container: 60, stall: 30, rail: 60, house: 24 }[name] || 6);
  // Kenney's models land after the first frame — until then (or if a file fails) that kind draws nothing
  const KM = {}, BOX = {};
  let dead = false, needWarm = true, warmed = 0;
  let kidGeo = null, kidMat = null, POSE = null;
  const ready = Promise.all([loadKenney(SCENE_MODELS), loadKid()]).then(([geos, kg]) => {
    if (dead) { for (const g of Object.values(geos)) g.dispose(); if (kg) { kg.userData.poses.tex.dispose(); kg.dispose(); } return false; }
    if (kg) {
      // THE KID: ONE skinned geometry, instanced — himself (opaque, rim-lit) + THE GHOSTS (see-through)
      kidGeo = kg; POSE = kg.userData.poses.clips;
      kidMat = paintMaterial(glossy(0.42, 0.7), { instanced: true, rim: true, skin: kg.userData.poses.tex });
      KM.kid = kind(kg, kidMat, 1, { aux: ['aKid', 4] });
      const gm = paintMaterial(glossy(0.5, 0.35), { instanced: true, skin: kg.userData.poses.tex, fade: true }); gm.transparent = true; gm.opacity = 0.46;
      // YOUR OWN KID DRAWS ON TOP OF EVERY GHOST (the stencil: he marks his pixels)
      kidMat.stencilWrite = true; kidMat.stencilRef = 1; kidMat.stencilFunc = THREE.AlwaysStencilFunc; kidMat.stencilZPass = THREE.ReplaceStencilOp;
      gm.stencilWrite = true; gm.stencilWriteMask = 0; gm.stencilRef = 1; gm.stencilFunc = THREE.NotEqualStencilFunc;
      KM.ghosts = kind(kg, gm, 8, { aux: ['aKid', 4], order: 4 });
    }
    for (const [name, g] of Object.entries(geos)) {
      const b = g.boundingBox; BOX[name] = { w: b.max.x - b.min.x, h: b.max.y, l: b.max.z - b.min.z, cz: (b.max.z + b.min.z) / 2, x0: b.min.x, z0: b.min.z, z1: b.max.z };
      if (name.startsWith('car-')) KM[name] = kind(g, paintMaterial(glossy(0.28, 1.1), { instanced: true }), 40, { aux: ['aLit', 1] });
      else if (name.startsWith('train-')) KM[name] = kind(g, fogUp(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0, envMapIntensity: 0.9 })), 40);
      else KM[name] = kind(g, lambert(), name === 'lighthouse' ? 2 : name === 'fishing-boat' ? 6 : 70);
    }
    needWarm = true;   // (H4B — the new kinds' programs + buffers are made in the NEXT frame, not when a car first drives in)
    return true;
  }).catch(() => false);

  // THE KID's place this frame — set by draw()
  const kidPos = new THREE.Vector3();
  // THE LINES' WORDS: flat on the ground beside the line — one small canvas each, redrawn when the text changes
  const labelGeo = new THREE.PlaneGeometry(7.0, 0.875).rotateX(-Math.PI / 2);   // (BIG: the letters ≈ half a lane tall; 7 cells — H5C: the words are CENTRED on the screen (they ride the camera's column): never cut by its edge)
  const LBL = {};
  for (const k of ['best', 'friend']) {
    const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 128;
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    // drawn above everything (no depth test, last) — but never over your own kid (the stencil)
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false });   // (alpha-blended in both looks: the letters carry a dark halo — they read on bright water + over a van)
    mat.stencilWrite = true; mat.stencilWriteMask = 0; mat.stencilRef = 1; mat.stencilFunc = THREE.NotEqualStencilFunc;
    const m = new THREE.Mesh(labelGeo, mat);
    m.renderOrder = 5; m.visible = false; m.frustumCulled = false; m.layers.enable(1); scene.add(m);
    LBL[k] = { m, cv, tex, text: null };
  }
  const css = hex => `#${hex.toString(16).padStart(6, '0')}`;
  // THE ARRIVAL GATEWAY's NAME — THE GATE SIGN: an arched board on its own canvas under the sea wall (css .jw-gate), ONLY ON THE
  // APPROACH (GATE_SEEN → GATE_GONE lanes from the gate). THE NEON FISH: the fish market's sign.
  const GATE_GONE = 3, GATE_FADE = 1.5, GATE_SEEN = 10;
  const fishGeo = new THREE.PlaneGeometry(2.4, 1.2);
  const G = { cv: document.createElement('canvas'), text: null, o: '' };
  G.cv.width = 1024; G.cv.height = 176; G.cv.className = 'jw-gate'; G.cv.setAttribute('aria-hidden', 'true'); host.append(G.cv);
  const gateShow = v => { const o = v < 0.01 ? '0' : v.toFixed(2); if (o !== G.o) { G.o = o; G.cv.style.opacity = o; } };
  const gateInfo = { on: false, text: '', y: 0, d: 0, a: 0 };
  function writeGate(text, hex, paint) {
    const key = `${text}|${day ? 'd' : 'n'}`;
    if (G.text === key) return;
    G.text = key;
    const c = ctx2d(G.cv);
    if (!c) return;
    c.clearRect(0, 0, 1024, 176);
    // the board: straight sides, an ARCHED top (q = its inset)
    const board = q => { c.beginPath(); c.moveTo(q, 176 - q); c.lineTo(q, 66 + q * 0.4); c.quadraticCurveTo(512, -30 + q * 2.2, 1024 - q, 66 + q * 0.4); c.lineTo(1024 - q, 176 - q); c.closePath(); };
    c.lineJoin = 'round';
    if (day) {   // (BY DAY: a PAINTED sign — the area's colour, a white trim, the name in white paint with a dark edge)
      board(3); c.fillStyle = css(paint); c.fill();
      c.save(); board(3); c.clip(); const sh = c.createLinearGradient(0, 0, 0, 176); sh.addColorStop(0, 'rgba(255, 255, 255, 0.2)'); sh.addColorStop(0.55, 'rgba(255, 255, 255, 0)'); sh.addColorStop(1, 'rgba(0, 0, 20, 0.22)'); c.fillStyle = sh; c.fillRect(0, 0, 1024, 176); c.restore();
      board(3); c.lineWidth = 5; c.strokeStyle = 'rgba(14, 18, 40, 0.85)'; c.stroke();
      board(13); c.lineWidth = 6; c.strokeStyle = '#fffaf0'; c.stroke();
    } else {     // (BY NIGHT: a neon sign — a smoked see-through panel, a tube round the arch in the area's colour, its white-hot core)
      board(8); c.fillStyle = 'rgba(9, 6, 24, 0.9)'; c.fill();   // (a SOLID dark board, as the day's is solid: the letters are never cluttered by what is behind)
      board(12); c.shadowColor = css(hex); c.shadowBlur = 14; c.lineWidth = 7; c.strokeStyle = css(hex); c.stroke();
      c.shadowBlur = 0; c.lineWidth = 2.5; c.strokeStyle = 'rgba(255, 255, 255, 0.8)'; c.stroke();
    }
    c.font = '900 88px "Orbitron", "Chakra Petch", system-ui, sans-serif'; c.textBaseline = 'middle'; c.textAlign = 'center';
    try { c.letterSpacing = '8px'; } catch { /* an old browser: no tracking */ }
    const tw = c.measureText(text).width, sx = Math.min(1, 930 / Math.max(1, tw));
    c.save(); c.translate(512, 112); c.scale(sx, 1);
    if (day) { c.lineWidth = 13; c.strokeStyle = 'rgba(10, 16, 40, 0.92)'; c.strokeText(text, 0, 0); c.fillStyle = '#ffffff'; c.fillText(text, 0, 0); }
    else {
      c.shadowColor = css(hex); c.shadowBlur = 18; c.fillStyle = css(hex); c.fillText(text, 0, 0);
      c.shadowBlur = 0; c.globalAlpha = 0.7; c.fillStyle = '#ffffff'; c.fillText(text, 0, 0);
    }
    c.restore();
  }
  const fishCv = document.createElement('canvas'); fishCv.width = 256; fishCv.height = 128;
  const fishTex = new THREE.CanvasTexture(fishCv); fishTex.colorSpace = THREE.SRGBColorSpace;
  { const c = ctx2d(fishCv); if (c) drawFishSign(c, 256, 128); }
  const fish = new THREE.Mesh(fishGeo, new THREE.MeshBasicMaterial({ map: fishTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  fish.renderOrder = 3; fish.visible = false; fish.frustumCulled = false; fish.layers.enable(1); scene.add(fish);
  function writeLabel(k, text) {
    const L = LBL[k];
    if (L.text === text) return;
    L.text = text;
    const c = ctx2d(L.cv);
    if (!c) return;
    c.clearRect(0, 0, 1024, 128);
    const FAM = '"Orbitron", "Chakra Petch", system-ui, sans-serif';
    c.font = `900 104px ${FAM}`; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
    const w = numWidth(c, text, 104, FAM, 900), sx = Math.min(1, 930 / Math.max(1, w)), x0 = -w / 2;
    c.save(); c.translate(512, 106); c.scale(sx, 1);
    // (a dark edge + halo: the words read on bright water)
    c.shadowColor = 'rgba(6, 4, 18, 0.9)'; c.shadowBlur = 12; c.fillStyle = '#0c1022'; for (const [dx, dy] of RING8) drawNum(c, text, x0 + dx * 6, dy * 6, 104, FAM, 900);
    c.shadowBlur = 0;
    if (day) {   // (BY DAY: the line's colour as paint)
      c.fillStyle = css(LINE_HEX[k]); drawNum(c, text, x0, 0, 104, FAM, 900);
      c.globalAlpha = 0.3; c.fillStyle = '#ffffff'; drawNum(c, text, x0, 0, 104, FAM, 900);
    } else {     // (BY NIGHT: neon — the colour, its glow, a white-hot core)
      c.shadowColor = css(LINE_HEX[k]); c.shadowBlur = 14; c.fillStyle = css(LINE_HEX[k]); drawNum(c, text, x0, 0, 104, FAM, 900);
      c.shadowBlur = 0; c.globalAlpha = 0.5; c.fillStyle = '#ffffff'; drawNum(c, text, x0, 0, 104, FAM, 900);
    }
    c.restore();
    L.tex.needsUpdate = true;
  }
  const LINES = { best: null, friend: null }, crossed = [];   // (crossed: a line's burst — { k, lane, t0 })
  // HE ALWAYS STANDS OUT: his colour → the cap + the shirt, his own rim light, the glow ring
  const rimCol = new THREE.Color();
  let kidHex = 0xff3fb4;
  const tintOf = hex => { kidHex = C.set(hex).getHex(); rimCol.set(hex).lerp(C.set(0xffffff), 0.5); };
  tintOf(o.kidColor || '#ff3fb4');
  // THE BIG MOMENTS (flyers.js): fetched ON DEMAND — never in the eager graph
  let FL = null, flyAsk = null;
  // DOWNTOWN's EDGE SHOPS (shops.js): ON DEMAND too
  let SH = null, shopAsk = null;
  const shopGet = () => { if (!shopAsk) shopAsk = lazyImport(import('./shops.js'), './shops.js').then(M => { if (!dead) SH = M.createShops({ kind, K, rewarm() { needWarm = true; } }); }).catch(NOP); };
  const flyGet = () => { if (!flyAsk) flyAsk = lazyImport(import('./flyers.js'), './flyers.js').then(M => { if (!dead) FL = M.createFlyers({ renderer, scene, cam, host, K, hazeAt, reduce, rewarm() { needWarm = true; } }); }).catch(NOP); };
  // THE BLACKOUT's curtain: everything a lane and more behind its edge is black
  const curtain = new THREE.Mesh(unit, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.93, depthWrite: false, fog: false }));
  curtain.renderOrder = 6; scene.add(curtain);
  // (by day a LIP on the bank body's straight top edge: its colour fading up to nothing)
  const lipTex = (() => { const n = 32, d = new Uint8Array(n * 4); for (let i = 0; i < n; i++) { const u = 1 - i / (n - 1), a = u * u * (3 - 2 * u); d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 255; d[i * 4 + 3] = Math.round(a * 255); } const t = new THREE.DataTexture(d, 1, n, THREE.RGBAFormat); t.magFilter = t.minFilter = THREE.LinearFilter; t.needsUpdate = true; return t; })();
  const lip = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xdfe7ee, map: lipTex, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide }));
  lip.renderOrder = 6.1; lip.visible = false; scene.add(lip);

  // THE SKYLINE BAND (the top ≈ 24 % — css .jw-skyline): the picture slides ≈ 10 % with the kid's column
  const sky = document.createElement('div'), skyImg = document.createElement('div');
  sky.className = 'jw-skyline'; skyImg.className = 'jw-skyline-img';
  // (THE NIGHT's LIFE — SKY_LIGHTS / SKY_NEON: its own layer)
  const skyLifeEl = document.createElement('div'), skyL = [], skyN = []; skyLifeEl.className = 'jw-sky-life';
  for (const [x, y, d] of SKY_LIGHTS) { const i = document.createElement('i'); i.className = 'jw-sky-l'; i.style.cssText = `left:${x}%;top:${y}%;animation-delay:${-d}s`; skyLifeEl.append(i); skyL.push(i); }
  for (const [x, y, bw, bh, d] of SKY_NEON) { const i = document.createElement('i'); i.className = 'jw-sky-n'; i.style.cssText = `left:${x}%;top:${y}%;width:${bw}%;height:${bh}%;animation-delay:${-d}s`; skyLifeEl.append(i); skyN.push(i); }
  skyImg.append(skyLifeEl);
  let skyLifeKey = '', skyLifeT = 0;
  /** the lights + windows OFF for these pictures: nothing blinks on a painted landmark */
  function skyLife(...files) {
    const off = files.map(skyOff), key = files.join('|');
    if (key === skyLifeKey) return;
    skyLifeKey = key;
    skyL.forEach((e, i) => { e.hidden = off.some(o => o.l.includes(i)); }); skyN.forEach((e, i) => { e.hidden = off.some(o => o.n.includes(i)); });
  }
  // THE PAINTED SKYLINES (skyline.js): TWO layers — the picture on screen + the one a gate CROSS-FADES to (the hidden one changes)
  const skyUnder = document.createElement('div'), skyOver = document.createElement('div');   // (UNDER is always solid; only OVER's opacity ever moves)
  skyUnder.className = skyOver.className = 'jw-sky-pic'; skyOver.style.opacity = '0'; skyImg.prepend(skyUnder, skyOver);
  // THE FAR EDGE: the course ENDS at a SEA WALL against the skyline's sea — the far lanes FULLY in the haze before it, the band
  // solid down to it. The wall holds BOTH looks' stone.
  const seaWall = document.createElement('div'), wallStone = document.createElement('i'), wallDay = document.createElement('i'), farHaze = document.createElement('div');
  seaWall.className = 'jw-seawall'; farHaze.className = 'jw-farhaze'; wallDay.className = 'is-day'; seaWall.append(wallStone, wallDay);
  for (const x of [8, 29, 50, 71, 92]) { const l = document.createElement('b'); l.style.left = `${x}%`; seaWall.append(l); }
  sky.append(skyImg, seaWall); host.append(sky, farHaze);
  // (THE LANDMARKS ARE PAINTED IN BOTH LOOKS)
  let skyAt = 9e9, skyLane = -1e9, skyRoomPc = 0, skyBias = 0, skyBiasT = 0, skyFresh = true, skyPicW = 0, skyMax = 99, skyMin = -99, skyMatch = false;
  // the pictures held (file → { img, ok }): the one on screen + the next area's
  const skyHold = new Map();
  const skyS = { now: '', over: false, want: '', fades: 0, until: 0, ms: 0 };   // (over: the picture on screen sits on the OVER layer · until: its cross-fade's end)
  const skyUrl = f => new URL(f, SKY_DIR).href;
  function skyGet(f) {
    let q = skyHold.get(f);
    if (!q) {
      const img = new Image(); img.decoding = 'async'; img.src = skyUrl(f);
      q = { img, ok: (img.decode ? img.decode() : new Promise(r => { img.onload = img.onerror = r; })).then(() => true, () => false) };
      skyHold.set(f, q);
    }
    return q;
  }
  /** show `f` on the band: at once (`ms` 0) or CROSS-FADED over `ms`, once it has arrived */
  function skyShow(f, ms) {
    if (f === skyS.want) return;
    skyS.want = f; skyS.ms = ms;
    const go = () => {
      if (dead || skyS.want !== f || skyS.now === f) return;
      const wait = skyS.until - performance.now();
      if (wait > 0) { setTimeout(go, wait + 30); return; }   // (a visible layer's picture never changes: wait the running fade out)
      const slow = !!(skyS.ms && !reduce && skyS.now);
      // (the new picture goes on the HIDDEN layer, then OVER fades: the band is never see-through)
      (skyS.over ? skyUnder : skyOver).style.backgroundImage = `url("${skyUrl(f)}")`;
      skyOver.style.transition = slow ? `opacity ${skyS.ms}ms ease-in-out` : 'none';
      skyS.over = !skyS.over; skyOver.style.opacity = skyS.over ? '1' : '0';
      clearTimeout(skyLifeT); skyLife(skyS.now, f); if (slow) skyLifeT = setTimeout(() => { if (!dead) skyLife(skyS.now); }, skyS.ms + 60); else skyLife(f);
      skyS.now = f; skyS.until = slow ? performance.now() + skyS.ms : 0;
      if (slow) skyS.fades++;
    };
    skyGet(f).ok.then(go).catch(NOP);
  }
  /** the band follows the kid: his area's picture, the next one fetched ahead. `fresh`: true = the first picture (at once) · 'look' = THE LOOK SWITCH */
  function skyFollow(lane, fresh) {
    const plan = skyPlan(lane, day ? 'day' : 'night', skyMatch), keep = skyHeld(plan);
    for (const f of keep) skyGet(f);
    for (const f of [...skyHold.keys()]) if (!keep.includes(f) && f !== skyS.now) skyHold.delete(f);   // (ONLY the current + the next are held — + the one still on screen through a look's cross-fade)
    skyShow(plan.now, fresh === true ? 0 : fresh === 'look' ? SKY_LOOK_MS : SKY_FADE_MS);
    skyBiasT = plan.bias; skyMax = plan.max; skyMin = plan.min;   // (the go-live review: the count stays clear of the landmark · a match's left landmarks stay clear of the chips)
    if (fresh === true) skyBias = skyBiasT;
  }

  /** THE LOOK: 'night' = neon · 'day' = a sunny harbor — ONE scene, switched at once. A VIEW: no rule sees it. */
  let lookSet = false, resting = 0, otherWarm = false;
  /** the look's GPU half for `day` as set — setLook's + THE OTHER LOOK's PREWARM (warm()) */
  function lookGL() {
    const fogHex = day ? DAY_FOG_HEX : FOG_HEX;
    scene.background.setHex(fogHex); scene.fog.color.setHex(fogHex);
    ground.uniforms.uFogCol.value.set(...rgb(fogHex)); ground.uniforms.uDay.value = day ? 1 : 0;
    hemi.color.setHex(day ? 0xd6e9ff : 0x8fa0ff); hemi.groundColor.setHex(day ? 0xc2ab84 : 0x1a1030); hemi.intensity = day ? 2.1 : 1.5;   // (H5C: a soft SKY fill — cooler from above, warm bounce from the ground)
    key.color.setHex(day ? 0xffe6b4 : 0xdfe4ff); key.intensity = day ? 2.7 : 1.55;   // (… under a WARMER sun key) key.position.set(day ? -9 : -5, 12, day ? 3.4 : 9);
    rim.color.setHex(day ? 0xffffff : 0xff6ad0); rim.intensity = day ? 0.3 : 1.25;
    if (day && !envDay) { try { envDay = dayEnv(renderer); } catch { envDay = null; } }
    scene.environment = day ? envDay || env : env;
    // by day the lights that stay become PAINT (alpha-blended — night-fx.js GLOW_F)
    for (const q of [K.flat, K.bill]) { const m = q.mesh.material; m.blending = day ? THREE.NormalBlending : THREE.AdditiveBlending; m.uniforms.uDay.value = day ? 1 : 0; m.needsUpdate = true; }
    K.shadow.mesh.material.uniforms.uDay.value = day ? 1 : 0;   // (H5C — a day shadow is COOL: the sky fills it)
    fish.material.blending = day ? THREE.NormalBlending : THREE.AdditiveBlending; fish.material.needsUpdate = true;
    // THE BLACKOUT's curtain = THE FOG BANK's body by day
    curtain.material.color.setHex(day ? 0xdfe7ee : 0x000000); curtain.material.opacity = day ? 1 : 0.93; lip.visible = day;
  }
  function setLook(l) {
    const d = l === 'day';
    if (lookSet && d === day) return;
    const first = !lookSet;
    lookSet = true; day = d; if (resting) resting = 3;
    lookGL();
    for (const k of ['best', 'friend']) { const t = LBL[k].text; LBL[k].text = null; if (t != null) writeLabel(k, t); }
    G.text = null;
    { const c = ctx2d(fishCv); if (c) { drawFishSign(c, 256, 128, day); fishTex.needsUpdate = true; } }
    sky.dataset.look = day ? 'day' : 'night'; farHaze.dataset.look = sky.dataset.look;
    // (THE LOOK SWITCH: the whole band CROSS-FADES (SKY_LOOK_MS) — the two looks' horizons differ)
    skyLane = -1e9; skyFresh = first ? true : 'look'; needWarm = true;
  }
  setLook(o.look === 'day' ? 'day' : 'night');

  let bloom = null, tier = 2, w = 0, h = 0, dpr = devDpr, kAt = 0, reveal = 1, revealT = 1;   // (reveal — H3: 0 = only the start's few lanes out of the dark · 1 = the whole view)
  /** the rig's scale moved (a ZOOM change): the far plane + the fog follow it */
  // THE FAR EDGE: the fog is FULL exactly where the ground meets the sea wall's foot (FOOT_AT down the screen); footAt = that
  // point's depth from the lens, measured off the camera
  const FOOT_AT = 0.25, HAZE_LANES = 4.4;
  let footAt = 0, footDirty = true, posed = false;
  const fwd = new THREE.Vector3(0, 0, -1);
  function depth() {
    const k = rig.k(), key = k + reveal * 7;
    if (key === kAt && !footDirty) return;
    kAt = key; cam.far = 90 * k; cam.updateProjectionMatrix();
    footAt = 35 * k;
    if (posed && !heroCam) { P.set(0, (1 - 2 * FOOT_AT) * Math.tan(cam.fov * Math.PI / 360), -1).applyQuaternion(cam.quaternion); if (P.y < -0.05) footAt = cam.position.y / -P.y; footDirty = false; }
    else if (heroCam) footDirty = false;
    // (the fog's near / far: reveal 0 shows ≈ 3–5 lanes ahead of the kid)
    const n = 22 * k + (footAt - HAZE_LANES * k - 22 * k) * reveal, f = 24.5 * k + (footAt - 24.5 * k) * reveal;
    scene.fog.near = n; scene.fog.far = f; fogV.set(n, f);
  }
  /** how deep in the far haze a point is (0 = clear · 1 = gone) — for what three's own fog cannot fade */
  const hazeAt = (x, y, z) => { const d = (x - cam.position.x) * fwd.x + (y - cam.position.y) * fwd.y + (z - cam.position.z) * fwd.z, u = clamp01((d - scene.fog.near) / Math.max(0.001, scene.fog.far - scene.fog.near)); return u * u * (3 - 2 * u); };
  function fit(force) {
    const nw = host.clientWidth, nh = host.clientHeight, nd = resting ? 1 : Math.min(devDpr, DPR_AT[tier]);
    if (!nw || !nh || (!force && nw === w && nh === h && nd === dpr)) return;
    w = nw; h = nh; dpr = nd; if (resting) resting = 3;
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
    cam.fov = rig.fit(w / h);   // (ZOOM columns across on every screen shape — camera.js#lensFor)
    cam.aspect = w / h; kAt = 0; footDirty = true; depth();
    if (bloom) bloom.size(Math.round(w * dpr), Math.round(h * dpr));
    skyRoomPc = skyRoom(w, h); skyPicW = h * SKY_BAND * SKY_ASPECT; skyAt = 9e9; footDirty = true;
  }
  const ro = new ResizeObserver(() => fit());
  ro.observe(host);
  function setTier(t) {
    tier = t < 0 ? 0 : t > 2 ? 2 : t | 0;
    ground.uniforms.uQ.value = tier > 0 ? 1 : 0;
    if (tier === 2 && !bloom && !resting) { try { bloom = createBloom(renderer); } catch { bloom = null; } }
    if (tier < 2 && bloom) { bloom.dispose(); bloom = null; }
    fit(true);
  }
  setTier(o.tier == null ? 2 : o.tier);

  // ---- what stands on a lane (view only — from the seed + the lane)
  let courseRef = null, vseed = 0;
  const decor = new Map();
  function decorOf(i, L) {
    let d = decor.get(i);
    if (d) return d;
    d = { obs: [], tufts: [], lamp: 0, lampHex: 0xffc27a };
    const T = L.type === 'grass' ? LOOKS[area(i).index] : null;
    if (T) {
      dressLane(d, T, i, L, (a, b) => hsh(vseed ^ (i * (131 + b * 46)), a));
      if (T.tufts) { const n = 2 + Math.floor(hsh(vseed ^ i, 9) * 3); for (let t = 0; t < n; t++) { const x = hsh(vseed ^ (i * 53), t * 7 + 1) * 12 - 1.5, c = Math.floor(x); if (c < 0 || c >= COLS || !L.obs[c]) d.tufts.push([x, 0.12 + hsh(vseed ^ (i * 59), t) * 0.76, 0.8 + hsh(vseed ^ i, t + 40) * 0.6]); } }
    } else if (L.type === 'grass') {
      const docks = !!L.mark || (i > 40 && (i % 50 <= 3 || i % 50 >= 47));   // (by a landmark: the docks' clutter)
      const pick = (c, edge) => {
        const r = hsh(vseed ^ (i * 131), c * 17 + 3), s = hsh(vseed ^ (i * 977), c * 29 + 11);
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
  // THE SIGNATURE PIECES (areas.js#sigOf), by their lane
  const plots = new Map();
  function sigAt(i) {
    const s = Math.floor(i / 50);
    let m = plots.get(s);
    if (!m) { m = new Map(); for (const P of sigOf(courseRef, s, (a, b) => hsh(vseed ^ (a * 7919), b))) { const l = m.get(P.y0) || []; l.push(P); m.set(P.y0, l); } plots.set(s, m); if (plots.size > 6) plots.delete(plots.keys().next().value); }
    return m.get(i) || null;
  }

  // ---- the kid's feel + the hits: derived from the run between frames
  const fx = { t: -1, st: 'idle', hits: 0, y: 0, yaw: Math.PI, landAt: -1e9, landOn: '', hit: null, parts: [], wob: null, shake: 0, seen: false, out: 0, endT: -1, after: 0 };
  let clock = 0, kidH = 0;
  const part = (kindOf, x, y, z, life, a = {}) => { if (fx.parts.length < 60) fx.parts.push({ k: kindOf, x, y, z, t0: clock, life, ...a }); };
  function splash(x, z, hex = 0x9fe8ff) {
    part('ring', x, 0.06, z, 520, { hex, r0: 0.25, r1: 1.25 });
    part('ring', x, 0.06, z, 760, { hex, r0: 0.1, r1: 0.9 });
    if (!reduce) for (let j = 0; j < 9; j++) { const a = j / 9 * Math.PI * 2; part('drop', x, 0.1, z, 520, { hex: 0xd8f6ff, vx: Math.cos(a) * (0.9 + (j % 3) * 0.35), vz: Math.sin(a) * 0.7, vy: 3.2 + (j % 4) * 0.5 }); }
  }

  /** THE START: a phone builds a program + uploads a mesh at its FIRST DRAW WITH SOMETHING IN IT — so each kind gets ONE instance
   *  far under the ground + ONE hidden frame is rendered (the bloom too), then all is put back: at the top of the first frame + of
   *  the one after Kenney's models land. */
  function warm() {
    const put = [];
    for (const q of [...Object.values(K), ...Object.values(KM)]) { q.reset(); q.put(0, -60, 0, 0.01, 0.01, 0.01, 0, 0xffffff, 1); q.done(); }
    for (const m of [...(FL ? FL.meshes() : []), ...Object.values(LBL).map(L => L.m), fish]) { put.push([m, m.visible, m.position.y]); m.visible = true; m.position.y = -60; }
    try { renderer.compile(scene, cam); renderer.render(scene, cam); if (bloom) bloom.render(scene, cam); } catch { /* a phone that can't: the kinds simply build as they come, as before */ }
    // THE OTHER LOOK's PREWARM — ONCE a view, in this hidden frame: the other look set, drawn once, put back
    if (!otherWarm && lookSet) {
      otherWarm = true; day = !day;
      try { lookGL(); renderer.compile(scene, cam); renderer.render(scene, cam); } catch { /* as above */ }
      day = !day; lookGL();
    }
    for (const [m, v, y] of put) { m.visible = v; m.position.y = y; }
    for (const q of [...Object.values(K), ...Object.values(KM)]) { q.reset(); q.done(); }
    warmed++;
  }

  /** one frame: the run after its last tick, `a` (0 … 1) into the next one, `dt` ms since the last frame. `o.ghosts` (a match):
   *  [{ run, hex, out? }] — each gets `tag` = [x, y] on the screen (CSS px) or null. `o.t` = THE WORLD's TICK: all is drawn at it.
   *  `o.a` = the ghosts' fraction; `g.vis` / `o.off` = a late hop's CATCH-UP ({ x, y, u: 0 … 1, d }); `g.held` = unconfirmed. */
  function draw(run, course, a, dt, o = null) {
    if (resting === 1) return;   // (rest(): its still is up)
    if (resting) resting--;
    clock += dt;
    // (LF / LB = a light that only GLOWS — nothing by day; EK = the edge columns' dim; fogK = the wall on a lane's things)
    const LF = day ? NOP : K.flat.put, LB = day ? NOP : K.bill.put, EK = day ? 0.8 : 0.5, fogK = day ? 2.4 : -0.96;
    if (needWarm && w && h) { needWarm = false; warm(); }
    if (reveal !== revealT) { reveal = reduce ? revealT : reveal + (revealT - reveal) * Math.min(1, dt / 130); if (Math.abs(revealT - reveal) < 0.004) reveal = revealT; }
    if (course !== courseRef) { courseRef = course; vseed = strSeed(course.seed); decor.clear(); plots.clear(); }
    // (THE WORLD GOES ON after a hit: the traffic drives on — the car rolls OFF the flat kid)
    if (run.st === 'out' || run.st === 'taken') { if (fx.endT !== run.end) { fx.endT = run.end; fx.after = 0; } fx.after += dt * 0.06; } else { fx.endT = -1; fx.after = 0; }
    // (THE MOTHERSHIP HAS ARRIVED: the traffic eases to a stop past the cap — a view, never the rules)
    const capT = MODES[run.mode].cap, tr = o && o.t != null ? o.t : run.t + a + fx.after, t = capT && tr > capT ? capT + 40 * (1 - Math.exp((capT - tr) / 40)) : tr, lane = course.lane(run.y);
    if (run.t < fx.t || (run.t === 0 && fx.t !== 0)) { fx.hits = 0; fx.hit = null; fx.parts.length = 0; fx.yaw = Math.PI; fx.landAt = -1e9; fx.wob = null; fx.seen = false; fx.st = 'idle'; fx.out = 0; }
    // ---- the kid between ticks
    let kx = run.x / FP, ky = run.y + 0.5, lift = 0, f = 0, hopDir = '';
    if (run.st === 'hop') {
      f = Math.min(1, (run.k + a) / HOP_TICKS);
      kx = (run.fx + (run.tx - run.fx) * f) / FP; ky = run.fy + 0.5 + (run.ty - run.fy) * f; lift = Math.sin(Math.PI * f) * 0.52;
      hopDir = run.ty > run.fy ? 'u' : run.ty < run.fy ? 'd' : run.tx < run.fx ? 'l' : 'r';
    } else if (run.st === 'idle' && lane.type === 'water') kx += lane.dir * lane.v * a / FP;
    // (a WATCHED ghost's late hop: drawn back where it was, closing in a quick hop)
    const co = o && o.off && run.st !== 'out' && run.st !== 'taken' ? o.off : null;
    if (co) { kx += co.x; ky += co.y; lift = lift * co.u + Math.sin(Math.PI * co.u) * 0.5 * Math.min(1, co.d); }
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
    if (run.st !== 'out') { if (fx.hit && run.st !== 'taken') fx.hit = null; }
    fx.t = run.t; fx.st = run.st; fx.hits = run.hits; fx.fy = run.fy; fx.fx = run.fx;
    if (run.t > 0 || run.st === 'hop') fx.seen = true;

    // where his feet are: the ground, or a log's back (it bobs)
    const bobOf = (i, j) => (reduce ? 0 : Math.sin(clock / 520 + i * 1.7 + j * 2.3) * 0.028);
    let feet = 0;
    if (run.st !== 'hop' && lane.type === 'water') { const j = logUnder(lane, run.t, run.x); feet = j >= 0 ? LOG_FEET + bobOf(lane.i, j) : 0; }
    else if (run.st === 'hop') { const A = course.lane(run.fy), B = course.lane(run.ty); feet = (A.type === 'water' ? LOG_FEET : 0) * (1 - f) + (B.type === 'water' ? LOG_FEET : 0) * f; }
    // THE HOP: a squash at the push, a stretch in the air, a squash on landing, a small turn; an idle bob between
    const since = clock - fx.landAt;
    let sy = 1, yawT = fx.seen ? 0 : Math.PI, tilt = 0;
    if (run.st === 'hop') { sy = 1 + 0.2 * Math.sin(Math.PI * f) - 0.17 * Math.exp(-f * 13); tilt = 0.3 * Math.sin(Math.PI * f); }   // (he leans INTO the hop — Kenney's kid faces +z: the lean's sign follows)
    else if (since < 150) sy = 1 - 0.2 * (1 - since / 150) * (1 - since / 150);
    else if (!reduce) sy = 1 + 0.022 * Math.sin(clock / 270);
    if (hopDir) fx.dir = hopDir;
    if (fx.seen) yawT = fx.dir === 'l' ? Math.PI / 2 : fx.dir === 'r' ? -Math.PI / 2 : fx.dir === 'd' ? Math.PI : 0;
    let dy = yawT - fx.yaw; while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI;
    fx.yaw += dy * (reduce ? 1 : 1 - Math.exp(-dt / 55));
    const sxz = 1 / Math.sqrt(sy);
    let px = X(kx), py = feet + lift, pz = Z(ky), lit = 1, show = true, flat = null, taken = 0, rx = tilt, rz = 0, ry = fx.yaw, s3 = [sxz, sy, sxz];
    // HIS POSE: the idle loop; a hop = Kenney's JUMP timed to HOP_TICKS; a hit = the fall or THE SPLAY
    let poseA = 0, poseB = 0, poseK = 0;
    if (POSE) {
      poseA = POSE.idle[0] + (reduce ? 0 : (clock % IDLE_MS) / IDLE_MS * POSE.idle[1]);
      if (run.st === 'hop' || co) { const q = run.st === 'hop' ? f : co.u; poseB = POSE.jump[0] + q * POSE.jump[1]; poseK = Math.min(1, Math.sin(Math.PI * q) * 1.7); }
    }
    const fallPose = e => { if (POSE) { const u = (e % (FALL_MS * 2)) / FALL_MS; poseB = POSE.fall[0] + (u < 1 ? u : 2 - u) * POSE.fall[1]; poseK = Math.min(1, e / 90); } };
    // THE HITS, one per cause
    const H = fx.hit;
    if (H && run.st === 'out') {
      const e = clock - H.t0, u = clamp01(e / 600);
      px = X(H.x); pz = Z(H.y); py = 0; rx = 0; show = true;
      if (H.cause === 'car') {
        // THE FLATTENED KID: squashed STRAIGHT DOWN under his cap, in THE SPLAY — a quick squash + one small bounce
        const sq = clamp01(e / 90), bounce = reduce ? 0 : Math.exp(-e / 160) * Math.sin(e / 38) * 0.1 * sq;
        flat = { thin: 1 - 0.86 * sq + bounce, wide: 1 + 0.5 * sq - bounce * 0.6 };   // (a PANCAKE: half as wide again, a seventh as thick)
        if (POSE) { poseB = POSE.splay[0]; poseK = sq; }
        fx.yaw += (0 - fx.yaw) * sq; ry = fx.yaw; s3 = [flat.wide, flat.thin, flat.wide];   // (his head up the screen: the sneakers kick out toward the camera)
      } else if (H.cause === 'water' || H.cause === 'edge') {    // (the edge: carried off on the log a moment more, then the splash) + the sink
        const carry = H.cause === 'edge' ? clamp01(e / 260) : 1, sink = clamp01((e - (H.cause === 'edge' ? 260 : 0)) / 380);
        if (H.cause === 'edge') { px += H.dir * 0.9 * carry; if (!H.wet && carry >= 1) { H.wet = 1; splash(px, pz); } py = LOG_FEET * (1 - sink); }
        py -= sink * 1.05; s3 = [1 - sink * 0.3, 1, 1 - sink * 0.3]; rz = sink * 0.5; fallPose(e);
        if (sink >= 1) show = false;
      } else if (H.cause === 'train' || H.cause === 'blackbird') {   // knocked away, spinning — THE BLACKBIRD's SHOCKWAVE blasts him higher, tumbling, toward the lens
        const bb = H.cause === 'blackbird', v = clamp01(e / (bb ? 1000 : 700));
        px += H.dir * v * (bb ? 3 : 9); py = 0.2 + (bb ? 3.6 : 2.4) * Math.sin(v * Math.PI * 0.85); rz = -H.dir * e * 0.016; ry = fx.yaw + e * 0.01; fallPose(e);
        if (bb) { pz += v * 1.5; rx = e * 0.013; if (FL) FL.blast(X(H.x), Z(H.y), e, H.dir); }
        if (v >= 1) show = false;
      } else if (H.cause === 'wall') {                           // swallowed by the dark
        const v = clamp01(e / 420); lit = day ? 1 + v * 2.4 : 1 - v; py = -v * 0.5; s3 = [1 - v * 0.35, 1 - v * 0.6, 1 - v * 0.35];
        if (v >= 1) show = false;
      } else {                                                   // THE UFO's ABDUCTION (H6A — flyers.js): frozen mid-step, then up the beam, spinning + shrinking
        const A = FL && FL.abduct(e, px, pz, course.lane(Math.floor(H.y)).ufo, t, kidHex), v = clamp01((e - 380) / 1150);
        lit = 1.6; py = A ? A.y : v * 6; ry = fx.yaw + (A ? A.spin : e * 0.012); const k = A ? A.s : 1 - v * 0.6; s3 = [k, k, k]; if (e > 380) fallPose(e - 380);
        if (A ? !A.show : v >= 1) show = false;
      }
    } else if (run.st === 'taken') {                             // THE MOTHERSHIP (H6A — a finish line): he rises into it, glowing in his colour
      fx.out += dt; taken = 1;
      const A = FL ? FL.lifted(fx.out) : { y: Math.min(13, fx.out * 0.005), spin: fx.out * 0.002, q: 0 };
      py = A.y; ry = fx.yaw + A.spin; lit = 1.7; px += (rig.x() - px) * A.q; if (A.q >= 1) show = false; else if (FL) FL.lift(px, py, pz, A.q, kidHex, 1);
      if (POSE) { poseB = POSE.jump[0] + 0.5 * POSE.jump[1]; poseK = clamp01(fx.out / 400); }
    }
    // the blackout on him
    const wallE = run.wall / FP, darkOf = i => clamp01(wallE - i), litOf = i => 1 + fogK * darkOf(i);
    lit *= litOf(Math.floor(ky));
    kidPos.set(px, flat ? 0.02 : py, pz);
    const kidDraw = show ? [px, flat ? 0.02 : py, pz, s3[0] * KID_S, s3[1] * KID_S, s3[2] * KID_S, ry + KID_YAW, kidHex, 1, lit, poseA, rx, rz, poseB, poseK] : null;
    if (kidMat) kidMat.userData.u.uRim.value.copy(rimCol).multiplyScalar((day ? 0.16 : 0.5) * Math.min(1, lit));
    kidH = KID.h * s3[1] * KID_S;

    // ---- THE CAMERA (camera.js): a smooth follow leading a hop to its landing, the slight turn, a hit's shake
    const down = run.st === 'out';
    rig.follow(run.st === 'hop' ? run.tx / FP : down && H ? H.x : kx, run.st === 'hop' ? run.ty + 0.5 : down ? (H ? H.y : ky) : ky, dt);
    const camY = rig.y();
    let shx = 0, shy = 0;
    if (clock < fx.shake) { const q = (fx.shake - clock) / 240; shx = Math.sin(clock * 0.09) * 0.16 * q; shy = Math.cos(clock * 0.113) * 0.12 * q; }
    if (FL) { const q = FL.shake(); shx += Math.sin(clock * 0.11) * q; shy += Math.cos(clock * 0.13) * q; }   // (THE BLACKBIRD's pass: ≤ 4 px, ≤ 200 ms)
    rig.apply(cam, shx, shy, heroCam ? [px, pz] : null);
    posed = true; fwd.set(0, 0, -1).applyQuaternion(cam.quaternion); FOG_UP.value = -fwd.y; depth();   // (the fog follows the lens: full at the sea wall's foot)
    // the skyline slides against the follow + RESTS where its area's landmark is (skyline.js#SKY_BIAS); the sea wall's stones slide a touch more
    skyBias += (skyBiasT - skyBias) * (reduce ? 1 : 1 - Math.exp(-dt / 650)); if (Math.abs(skyBiasT - skyBias) < 0.02) skyBias = skyBiasT;
    const sl = Math.round(skyShift(skyBias, rig.x() * 2.2 - rig.yaw() * 28, skyRoomPc, skyMax, skyMin) * 20) / 20;
    if (sl !== skyAt) { skyAt = sl; skyImg.style.transform = `translate3d(${(-50 - sl).toFixed(2)}%,0,0)`; wallStone.style.transform = wallDay.style.transform = `translate3d(${(-sl * skyPicW * 0.0115).toFixed(1)}px,0,0)`; }

    // ---- the lanes
    for (const q of Object.values(K)) q.reset();
    for (const q of Object.values(KM)) q.reset();
    if (capT) flyGet();
    if (FL) FL.begin({ t, clock, dt, day, w, h, camX: rig.x(), kx: px, kz: pz, ky, own: !o || o.own !== false, alive: run.st === 'idle' || run.st === 'hop' });
    if (kidDraw && KM.kid) KM.kid.put(...kidDraw);
    const kindOf = L => (L.mark ? KIND.mark : KIND[L.type]);
    let beam = null, sign = null, gateSeen = false;
    const base = Math.floor(camY) - BACK, top = base + BACK + Math.min(AHEAD, Math.ceil(24 * rig.k()) + 2);
    let nu = 0, gi = 0, ufoSeen = -1;
    for (let i = base; i < top; i++) {
      const L = course.lane(i), z = Z(i + 0.5), dk = darkOf(i), lt = 1 + fogK * dk, on = day ? dk < 0.6 : lt > 0.3;
      let fxv = 0, railGone = false;
      if (L.type === 'grass') {
        const D = decorOf(i, L), SG = sigAt(i), sgL = !!SG && SG.some(P => P.side < 0 && P.what !== 'pylons'), sgR = !!SG && SG.some(P => P.side > 0 && P.what !== 'pylons');
        for (const q of D.obs) {
          if (q.edge && (q.c < 0 ? sgL : sgR)) continue;   // (a signature piece stands on this side of the lane)
          const x = X(q.c + 0.5) + q.dx, zz = z + q.dz, dim = lt * (q.c < 0 || q.c >= COLS ? EK : 1);
          if (q.big) { if (q.k === 'shop' && !SH) shopGet(); drawBig(q, X(q.c + 0.5), z, { K, A: AK, lt, on: on && !day, day, ek: EK, SH: SH && SH.put }); }
          else if (AK[q.k]) { const [ps, sh] = PIECE[q.k]; AK[q.k].put(x, 0, zz, ps, ps, ps, q.ry, q.k === 'drum' ? DRUM_HEX[Math.floor(q.s * 2.999)] : 0xffffff, dim * 1.25); K.shadow.put(x, 0.03, zz + 0.06, sh[0], 1, sh[1], 0, 0, 1, 0, 0.45 * lt); }
          else if (q.k === 'tree' || (q.k !== 'barricade' && !KM[q.k])) { const s = 0.72 + q.s * 0.3; K.trees.put(x, 0, zz, s, s, s, q.ry * 3, 0xffffff, dim); K.shadow.put(x, 0.03, zz + 0.1, 1.15 * s, 1.6, 1.0 * s, 0, 0, 1, 0, 0.5 * lt); }
          else if (q.k === 'barricade') { K.barricades.put(x, 0, zz, 1.04, 1.04, 1.04, q.ry * 0.22, 0xffffff, dim * 1.3); K.shadow.put(x, 0.03, zz + 0.06, 1.1, 1, 0.6, 0, 0, 1, 0, 0.45 * lt); if (on) K.bill.put(x + 0.4, 0.68, zz, 0.3, 0.3, 1, 0, 0xffa530, 1, 0, 0.95 * dim); }
          else { const s = PROP_S[q.k]; KM[q.k].put(x, 0, zz, s, s, s, Math.round(q.ry) * Math.PI / 2 + (q.k === 'traffic-cone' ? q.ry : 0), 0xffffff, dim * 1.35); K.shadow.put(x, 0.03, zz + 0.06, 0.95, 1, 0.8, 0, 0, 1, 0, 0.45 * lt); }
        }
        if (D.lamp && !(D.lamp < 0 ? sgL : sgR)) {                // a street lamp on the edge column: its head over the grass, a warm pool under it
          const side = D.lamp, x = X(side > 0 ? COLS + 0.55 : -0.55);
          if (KM['street-lamp']) KM['street-lamp'].put(x, 0, z, 2.7, 2.7, 2.7, side > 0 ? Math.PI / 2 : -Math.PI / 2, 0xffffff, lt * 1.3);
          if (on) { LF(x - side * 0.75, 0.035, z, 3.6, 1, 3.0, 0, D.lampHex, 1, 0, 0.34 * lt); LB(x - side * 0.5, 1.72, z, 0.34, 0.34, 1, 0, D.lampHex, 1, 5, 0.8 * lt); }
        }
        if (tier > 0) for (const q of D.tufts) K.tufts.put(X(q[0]), 0, z - 0.5 + q[1], q[2], q[2], q[2], q[0] * 9, 0xffffff, lt * (q[0] < 0 || q[0] > COLS ? EK + 0.1 : 1));
      } else if (L.type === 'road' || L.type === 'water') {
        const car = L.type === 'road', per = L.period / FP;
        if (!car) fxv = L.dir * L.v * 0.06;   // (H5B's add-on — THE WATER FLOWS the way its logs go: the lane's current in cells a second, for the ground's ripple caps + specks)
        for (let j = 0; j < L.items.length; j++) {
          const it = L.items[j], len = it.len / FP, l0 = moverLeft(L, it, t) / FP;
          // (a mover's next lap is drawn too: nothing pops in or out at the screen's side)
          for (let lap = -1; lap <= 1; lap++) {
            const left = l0 + lap * per;
            if (left > COLS + 9 || left + len < -9) continue;
            const cx = X(left + len / 2), inside = left + len > 0 && left < COLS, dim = lt * (inside ? 1 : EK + 0.05);
            if (car) {
              // (THE TAXI is yellow, its roof light lit — the cause line must be true)
              const what = vehicleAt(course, i, j), taxi = what === 'taxi', nk = Math.floor(hsh(vseed ^ (i * 104729), j * 31 + 7) * NEON.length), tint = taxi ? TAXI_HEX : carTint(nk, kidHex);   // (never a car in YOUR kid's colour — a VIEW: the rules know no colour)
              const name = what === 'truck' ? 'car-van' : `car-${what}`, q = KM[name], B = BOX[name], ry = L.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
              const bodyL = len < 1.5 ? 0.96 : 1.9, sz = B ? bodyL / B.l : 1, sx = B ? (len < 1.5 ? 0.7 : 0.78) / B.w : 1, sy = B ? (len < 1.5 ? 0.42 : 0.52) : 1;
              const nose = left + (L.dir > 0 ? len - 0.02 : 0.02), bx = X(nose - L.dir * bodyL / 2), tail = left + (L.dir > 0 ? 0.02 : len - 0.02);
              const truck = what === 'truck', tz = (len - 0.1) / TRUCK.len;   // (3 cells = THE BOX TRUCK, built in code — models.js#buildTruck)
              if (truck) K.trucks.put(cx, 0, z, 0.94, 0.9, tz, ry, tint, 1, day ? dim * 0.8 : dim);   // (by day a touch under: its white box blew out to a flat slab — now its side reads under its top)
              else if (q) q.put(bx - L.dir * B.cz * sz, 0, z, sx, sy, sz, ry, tint, 1, dim);
              K.shadow.put(cx, 0.03, z, len * 1.12, truck ? 1.05 : len > 1.5 ? 0.7 : 0.55, 1.05, 0, 0, 1, 0, (day ? 0.85 : 0.6) * lt);
              if (on) {
                const [hw, hy] = LAMPS[truck ? 'truck' : name], a1 = dim, back = L.dir > 0 ? 0 : Math.PI;
                // the truck's amber markers along the foot of the box's side
                if (truck) for (const m of [0, 0.34, 0.67, 1]) K.bill.put(cx + L.dir * (TRUCK.box[0] + (TRUCK.box[1] - TRUCK.box[0]) * m) * tz, 0.29, z + 0.4, 0.24, 0.24, 1, 0, 0xff9a1c, 1, 0, a1);
                if (taxi) { K.bill.put(bx, 0.5, z, 0.3, 0.2, 1, 0, 0xfff3b0, 1, 5, a1); LB(bx, 0.5, z, 0.62, 0.42, 1, 0, 0xffc21e, 1, 0, 0.55 * a1); }   // its ROOF LIGHT: a small lit box + its warm halo
                // THE TAIL LIGHTS (no light trails: from above they read as jet exhaust)
                const rearX = truck ? tail : nose - L.dir * bodyL;
                // a LIGHT BAR across the rear (tailBar) + ONE oval pool on the road behind it — the same for every vehicle
                const vw = truck ? 0.9 : len < 1.5 ? 0.7 : 0.78;
                LF(X(rearX - L.dir * (TAIL_LEN / 2 - 0.2)), 0.04, z, TAIL_LEN, 1, vw * 1.15, L.dir > 0 ? Math.PI : 0, 0xff2a22, 1, -1, 0.34 * a1);
                LF(X(rearX - L.dir * 0.1), 0.041, z, 0.6, 1, vw * 0.9, 0, 0xff5a34, 1, 0, 0.3 * a1);
                tailBar(X(rearX - L.dir * 0.03), hy + 0.06, z, vw, a1);
                for (const e of [-hw, hw]) {   // BOTH headlights + BOTH tail lamps, each at its own place on the model
                  // (BY DAY: no beams — a pale lens in front, a small red behind)
                  LF(X(nose + L.dir * HEAD_REACH / 2), 0.04, z + e, HEAD_REACH, 1, 0.8, back, 0xfff0c8, 1, 6, 0.5 * a1);   // a short soft beam on the road ahead
                  K.bill.put(X(nose), hy, z + e, day ? 0.13 : 0.2, day ? 0.13 : 0.2, 1, 0, 0xfff0c0, 1, 5, (day ? 0.7 : 0.8) * a1);
                }
              }
            } else {
              // A LOG (models.js#buildLog): HALF-SUNK; it bobs + rocks (dips + rolls when the kid lands on it)
              const wob = fx.wob && fx.wob.lane === i && fx.wob.j === j && lap === 0 ? clock - fx.wob.t0 : 9e9, wv = wob < 520 && !reduce ? Math.exp(-wob / 170) * Math.sin(wob / 42) : 0;
              const by = bobOf(i, j) + LOG_FEET - LOG.top - wv * 0.07, rock = reduce ? 0 : Math.sin(clock / 880 + i * 1.3 + j * 2.1) * 0.04 + wv * 0.16;
              const n = Math.max(1, Math.min(4, Math.round(len))), tailX = L.dir > 0 ? left : left + len;
              K[`log${n}`].put(cx, by, z, 1, 1, 1, 0, 0xffffff, dim * 1.12, 1, 1, rock);
              K.shadow.put(cx, 0.047, z + 0.06, len * 1.06 + 0.25, 0.35, 1.25, 0, 0, 1, 0, 0.5 * Math.min(1, lt));   // (H5B's add-on: a soft darker shadow under each log — it sits ON bright water)
              if (on) {
                // THE WATERLINE: a thin ring hugging the log + a ripple swelling off it; by night the amber is ONLY that underglow
                const lw = len + 0.1, ld = 0.92, asp = 7 + Math.min(9.9, lw / ld) / 10, rp = reduce ? 0.4 : (clock / 1700 + j * 0.37 + i * 0.21) % 1;
                // (BY DAY: no amber — a white foam ring, ripple + wake)
                LF(cx, 0.045, z, len + 1.1, 1, 1.6, 0, 0xffa23a, 1, 0, 0.17 * dim);
                K.flat.put(cx, 0.05, z, lw, 1, ld, 0, day ? 0xffffff : 0xffb060, 1, asp, (day ? 0.75 : 0.42) * dim);
                K.flat.put(cx, 0.052, z, lw + 0.12 + rp * 0.5, 1, ld + 0.12 + rp * 0.5, 0, day ? 0xffffff : 0xb8dcec, 1, 7 + Math.min(9.9, (lw + 0.12 + rp * 0.5) / (ld + 0.12 + rp * 0.5)) / 10, (day ? 0.5 : 0.2) * (1 - rp) * dim);
                // a small wake trails it
                K.flat.put(X(tailX - L.dir * 0.8), 0.05, z, 1.7, 1, 0.8, L.dir > 0 ? 0 : Math.PI, day ? 0xffffff : 0xa8d4e6, 1, 1, (day ? 0.4 : 0.13) * dim);
              }
            }
          }
        }
      } else {
        const p = L.pulse, st = pulseAt(p, Math.floor(t)), rail = L.type === 'rail', u = mod(t - p.phase, p.period);
        // (the body is drawn a little before + after its pass: SEEN through the edge columns)
        const lead = 10, s = u < p.pass + lead ? u : u > p.period - lead ? u - p.period : null;
        if (rail) {
          // THE SIGNALS FLASH ONLY BEFORE THE TRAIN (red = a train is COMING): through the TELL alone, DARK once its nose enters the lane
          const tell = st.st === 'tell', blink = tell && Math.floor(t / 8) % 2 === 0;
          railGone = !tell && (st.st === 'pass' || s !== null);
          fxv = tell ? (blink ? 1 : 0.35) : 0;
          for (const c of [-0.3, 3, 6, 9.3]) {                // the signals: red, flashing from the tell to the train's tail
            const x = X(c);
            K.posts.put(x, 0.3, z - 0.44, 0.1, 0.6, 0.1, 0, 0x2a2a34, lt); K.posts.put(x, 0.66, z - 0.46, 0.3, 0.34, 0.12, 0, 0x1c1c24, lt);   // (a post + its signal head's housing: a lamp, never a lollipop)
            // (BY DAY the flash stays BOLD: a bigger lens + a red wash on the ground)
            K.bill.put(x, 0.66, z - 0.44, blink ? (day ? 0.7 : 0.62) : 0.24, blink ? (day ? 0.7 : 0.62) : 0.24, 1, 0, blink ? 0xff2a2a : tell ? 0x7a1414 : 0x32151b, 1, 5, (blink ? 1 : tell ? 0.8 : 0.7) * lt);
            if (blink && on) K.flat.put(x, 0.04, z - 0.3, 2.2, 1, 1.5, 0, 0xff2020, 1, 0, (day ? 0.45 : 0.5) * lt);
          }
          if (st.st === 'tell' && on) {                           // a warning glow on the side it comes from
            const pulse = 0.55 + 0.45 * Math.sin(t * 0.55), side = p.dir > 0 ? -1.2 : COLS + 1.2;
            K.flat.put(X(side), 0.05, z, 5.5, 1, 2.4, 0, 0xff3030, 1, 0, (day ? 0.5 : 0.7) * pulse * lt); K.bill.put(X(side), 0.7, z, 2.6, 2.2, 1, 0, 0xff3030, 1, 0, (day ? 0.32 : 0.5) * pulse * lt);
          }
          if (s !== null && KM['train-front'] && KM['train-carriage']) {
            const left = pulseLeft(p, s) / FP, len = p.len / FP, F = BOX['train-front'], Cg = BOX['train-carriage'], sc = 0.74, n = 6;
            const fl = F.l * sc, cl = (len - fl * 2) / (n - 1), ry = p.dir > 0 ? Math.PI / 2 : -Math.PI / 2, nose = p.dir > 0 ? left + len : left;
            KM['train-front'].put(X(nose - p.dir * fl / 2), 0, z, sc, sc, sc, ry, 0xffffff, lt);
            KM['train-front'].put(X(nose - p.dir * (len - fl / 2)), 0, z, sc, sc, sc, -ry, 0xffffff, lt);
            for (let c = 0; c < n - 1; c++) {
              const cx = X(nose - p.dir * (fl + cl * (c + 0.5)));
              KM['train-carriage'].put(cx, 0, z, sc, sc, cl / Cg.l, ry, 0xffffff, lt);
              if (on) for (const wx of [-0.62, 0, 0.62]) LB(cx + wx, 0.98, z + 0.3, 0.4, 0.26, 1, 0, c % 2 ? 0x7fe6ff : 0xffe6a8, 1, 0, 0.9 * lt);   // lit windows
            }
            K.shadow.put(X(left + len / 2), 0.03, z, len * 1.03, 1.2, 1.25, 0, 0, 1, 0, 0.65 * lt);
            if (on) {
              const [tw, ty] = LAMPS.train, rear = nose - p.dir * len;
              for (const e of [-tw, tw]) {   // the train's front: BOTH headlights cast a soft beam (a little longer than a car's); BOTH tail lights a red glow
                LF(X(nose + p.dir * HEAD_REACH * 0.8), 0.05, z + e, HEAD_REACH * 1.6, 1, 0.95, p.dir > 0 ? 0 : Math.PI, 0xfff2d0, 1, 6, 0.6 * lt);
                K.bill.put(X(nose), ty, z + e, day ? 0.24 : 0.36, day ? 0.24 : 0.36, 1, 0, 0xfff6d8, 1, 5, lt);
              }
              tailBar(X(rear - p.dir * 0.03), ty + 0.04, z, 0.86, lt);   // (H6B — the cars' rule: a light bar across its tail …)
              LF(X(rear - p.dir * (TAIL_LEN * 0.65 - 0.2)), 0.05, z, TAIL_LEN * 1.3, 1, 1.0, p.dir > 0 ? Math.PI : 0, 0xff2a22, 1, -1, 0.3 * lt);   // … and ONE oval red pool starting at it, centred, as wide as the train
              LF(X(left + len / 2), 0.045, z + 0.55, len, 1, 0.9, 0, 0xffe2b8, 1, 4, 0.3 * lt);   // (its windows' light on the ground: warm — never blue)
            }
          }
        } else {
          const tellF = st.st === 'tell' ? 1 - st.left / p.tell : st.st === 'pass' ? 1 : 0;
          fxv = tellF * p.dir;
          // THE FLIGHT PATH: warm runway lights in the ground (never blue: blue = water); the tell = the lights RACING to the crossing
          const head = st.st === 'tell' ? (tellF * tellF * 7 + tellF * 2) % 1 * 14 - 2.5 : -99;
          // (BY DAY the tell MUST read — fairness: from its FIRST tick every lamp is a BOLD red / amber SIGNAL LAMP on a dark backing,
          //  wig-wagging off the rules' tick; the racing head white-hot amber)
          const warn = day && tellF > 0, wig = warn && !reduce ? Math.floor((st.left || 0) / 10) & 1 : 0;
          for (let c = -1; c <= COLS; c++) {
            const at = p.dir > 0 ? c : COLS - 1 - c, hot = head > -50 && at <= head && at > head - 3.2, far = c < 0 || c >= COLS ? 0.6 : 1;
            if (warn) {
              for (const e of [-0.42, 0.42]) {
                const s = hot ? 1.3 : 0.86, hex = hot ? 0xfff0a0 : (c + (e > 0 ? 1 : 0) + wig) & 1 ? 0xff2412 : 0xffa400;
                if (hot && on) K.flat.put(X(c + 0.5), 0.04, z + e, 2.4, 1, 1.7, 0, 0xffa820, 1, 0, 0.7 * far);
                K.flat.put(X(c + 0.5), 0.046, z + e, s * 1.5, 1, s * 1.25, 0, 0x07070e, 1, 5, 0.92 * far);   // its dark backing
                K.bill.put(X(c + 0.5), 0.07 + s * 0.26, z + e, s, s, 1, 0, hex, 1, 5, far);   // (standing ON the tarmac: sunk to its middle, a lamp had a flat-cut bottom)
              }
              continue;
            }
            for (const e of [-0.42, 0.42]) {
              K.bill.put(X(c + 0.5), 0.07, z + e, hot ? (day ? 0.9 : 0.74) : (day ? 0.22 : 0.3), hot ? (day ? 0.9 : 0.74) : (day ? 0.22 : 0.3), 1, 0, hot ? (day ? 0xffffff : 0xfff6dc) : (day ? 0xb9bec8 : 0xffcf8a), 1, 5, (hot ? 1 : 0.85) * lt * far);
              if (on) K.flat.put(X(c + 0.5), 0.04, z + e, hot ? 1.7 : 0.8, 1, hot ? 1.2 : 0.6, 0, 0xffa820, 1, 0, (hot ? (day ? 0.6 : 0.75) : (day ? 0 : 0.35)) * lt * far);
            }
          }
          // THE BLACKBIRD (flyers.js; its two lanes share ONE pulse). Until the module lands: its shadow alone
          if (L.i === p.band) { if (FL) FL.jet(p, u, z - (p.n - 1) / 2, lt); else { flyGet(); if (s !== null) K.shadow.put(X(pulseLeft(p, s) / FP + p.len / FP / 2), 0.03, z - 0.5, 3.6, 1, 1.9, 0, 0, 1, 0, 0.6 * lt); } }
        }
      }
      if (L.ufo && nu < 2 && L.ufo.id !== ufoSeen) {   // THE UFO (H6A — flyers.js; once a UFO). Until the module has landed: its ring — the rules' warning — alone
        nu++; ufoSeen = L.ufo.id;
        if (FL) FL.ufo(L.ufo, t, lt); else { flyGet(); const r = L.ufo.r / FP * 2.5; K.flat.put(X(ufoX(L.ufo, t) / FP), 0.05, Z(ufoY(L.ufo, t) / FP), r, 1, r, 0, 0x3dff7a, 1, 3, 0.95); }
      }
      const AR = area(i).index;
      if (L.mark && AR >= 0) {
        // THE ARRIVAL GATEWAY: two posts in the edge columns + a line on the ground between them — nothing over a lane
        const hex = LOOKS[AR].accent, xl = X(-0.55), xr = X(COLS + 0.55), zf = z - 0.42;
        if (day) {
          // BY DAY: white posts banded in the area's colour, a striped PAINTED line
          const pc = LOOKS[AR].paint, wh = 0xf6f2e8, li = Math.min(1.6, lt);
          for (const x of [xl, xr]) { K.posts.put(x, 1.5, zf, 0.22, 3.0, 0.22, 0, wh, li); K.posts.put(x, 2.86, zf, 0.3, 0.4, 0.3, 0, pc, li); K.posts.put(x, 0.4, zf, 0.3, 0.8, 0.3, 0, pc, li); K.posts.put(x, 3.16, zf, 0.34, 0.2, 0.34, 0, wh, li); K.shadow.put(x, 0.03, zf, 0.9, 3.0, 0.7, 0, 0, 1, 0, 0.5 * Math.min(1, lt)); }
          for (let k = 0; k < 10; k++) K.flat.put(xl + (xr - xl) * (k + 0.5) / 10, 0.05, zf + 0.06, (xr - xl) / 10 + 0.02, 1, 0.38, 0, k % 2 ? wh : pc, 1, 4, 1);
        } else {
          for (const x of [xl, xr]) { K.posts.put(x, 1.5, zf, 0.2, 3.0, 0.2, 0, 0x2b2b3c, lt); K.bill.put(x, 3.1, zf, 0.5, 0.5, 1, 0, hex, 1, 5, lt); for (let k = 0; k < 5; k++) K.bill.put(x, 0.4 + k * 0.55, zf, 0.3, 0.42, 1, 0, hex, 1, 4, 0.85 * lt); if (on) K.flat.put(x, 0.05, zf, 2.6, 1, 2.0, 0, hex, 1, 0, 0.4 * lt); }
          // (a NEON LINE on the ground between the posts)
          K.flat.put(0, 0.05, zf + 0.06, (xr - xl) * 1.02, 1, 0.3, 0, hex, 1, 4, 0.9 * lt); K.flat.put(0, 0.052, zf + 0.06, xr - xl, 1, 0.08, 0, 0xffffff, 1, 4, 0.7 * lt);
          if (on) K.flat.put(0, 0.045, z, 11, 1, 1.2, 0, hex, 1, 4, 0.16 * lt);
        }
        // THE NAME: the gate's sign — ONLY ON THE APPROACH
        const dg = i - ky, near = clamp01((dg - GATE_GONE) / GATE_FADE) * clamp01(GATE_SEEN + 0.5 - dg);
        if (!gateSeen && near > 0.01 && dk < 0.8) { writeGate(gateName(i), hex, LOOKS[AR].paint); gateShow(near); gateSeen = true; gateInfo.on = true; gateInfo.text = gateName(i); gateInfo.y = 0.24 + 0.74 * w * 176 / 1024 / h; gateInfo.d = dg; gateInfo.a = near; }
      }
      const PL = AR >= 0 ? sigAt(i) : null;
      if (PL) for (const P of PL) { const r = drawSig(P, { K, A: AK, KM, BOX, X, Z, lt, on: on && !day, day, ek: EK, T: LOOKS[AR], h: (a, b) => hsh(vseed ^ (a * 2659), b), course }); if (r && r.beam && on) beam = { at: r.beam, side: P.side, lt: Math.min(1, lt) }; if (r && r.sign && on && !sign) sign = { at: r.sign, lt: Math.min(1, lt) }; }
      // (THE CANAL: a stone footbridge over a water lane, in an edge column)
      if (AR >= 0 && LOOKS[AR].footbridge && L.type === 'water' && i % 2 === 0) AK.footbridge.put(X(i % 4 ? -0.6 : COLS + 0.6), 0, z, 1.05, 1.0, 0.86, 0, 0xffffff, lt * (EK + 0.2));
      // (THE RAIL YARD: a signal gantry over each rail lane's edge columns)
      if (AR >= 0 && LOOKS[AR].gantry && L.type === 'rail') for (const sd of [-1, 1]) {
        const gx = X(sd < 0 ? -0.55 : COLS + 0.55);
        K.posts.put(gx - 0.42, 0.95, z - 0.47, 0.07, 1.9, 0.07, 0, 0x3a3a48, lt * (EK + 0.2)); K.posts.put(gx + 0.42, 0.95, z - 0.47, 0.07, 1.9, 0.07, 0, 0x3a3a48, lt * (EK + 0.2)); K.posts.put(gx, 1.9, z - 0.47, 0.95, 0.08, 0.08, 0, 0x4a4a5a, lt * (EK + 0.2));
        K.bill.put(gx, 1.72, z - 0.47, 0.26, 0.26, 1, 0, fxv ? 0xff2a2a : railGone ? 0x24302a : 0x40ff80, 1, 5, 0.9 * lt);   // (red in the tell · dark while the train is here · green: clear)
      }
      ground.lay(gi++, i, kindOf(L), kindOf(course.lane(i - 1)), kindOf(course.lane(i + 1)), hsh(vseed, i) * 10, dk, fxv, AR + 1);
    }
    ground.done(gi);
    if (!gateSeen) { gateInfo.on = false; gateShow(0); }
    // THE LIGHTHOUSE's BEAM: its lamp + a long soft beam SWEEPING over the lanes
    if (beam) {
      const [bx, bh, bz] = beam.at, sw = reduce ? 0.25 : Math.sin(clock / 2300) * 0.95, ang = beam.side < 0 ? sw : Math.PI - sw, len = 15;
      K.bill.put(bx, bh, bz, day ? 0.8 : 1.5, day ? 0.8 : 1.5, 1, 0, 0xfff4c0, 1, 5, beam.lt); LB(bx, bh, bz, 4.2, 3.4, 1, 0, 0xffe9a0, 1, 0, 0.5 * beam.lt);
      K.flat.put(bx + Math.cos(ang) * len / 2, 0.075, bz - Math.sin(ang) * len / 2, len, 1, 3.4, ang, day ? 0xfffbe0 : 0xfff0b0, 1, 2, (day ? 0.2 : 0.5) * beam.lt);
      LF(bx + Math.cos(ang) * len / 2, 0.076, bz - Math.sin(ang) * len / 2, len, 1, 1.3, ang, 0xffffff, 1, 2, 0.28 * beam.lt);
    }
    fish.visible = !!sign;
    if (sign) { fish.position.set(sign.at[0], sign.at[1], sign.at[2]); fish.quaternion.copy(cam.quaternion); fish.material.opacity = sign.lt * (reduce || day ? 1 : 0.88 + 0.12 * Math.sin(clock / 190)); }
    // THE PAINTED SKYLINES: the band's picture follows his lane (skyFollow)
    const kl = Math.max(0, Math.floor(ky));
    if (skyMatch !== (run.mode === 'match')) { skyMatch = !skyMatch; skyLane = -1e9; }
    if (kl !== skyLane) { skyLane = kl; skyFollow(kl, skyFresh); skyFresh = false; }
    // his blob shadow: smaller + fainter as he rises
    if (show && py > -0.2) K.shadow.put(px, feet + 0.035, pz + 0.05, 0.98 * (1 - lift * 0.55) * s3[0], 1.15 + lift * 1.4, 0.78 * (1 - lift * 0.55) * s3[2], 0, 0, 1, 0, 0.66 * (1 - lift * 0.9) * lit);
    // HE ALWAYS STANDS OUT: a pool of his colour under him + a ring round his feet (it breathes)
    if (show && py > -0.2 && lit > 0.25 && !(H && down)) {
      const br = reduce ? 1 : 0.94 + 0.06 * Math.sin(clock / 260);
      LF(px, feet + 0.04, pz + 0.04, 2.3, 1, 1.9, 0, kidHex, 1, 0, 0.3 * lit);   // (H5A: softer — the new kid's own colours (his face, his arms, his sneakers) must read through it)
      // (BY DAY: a soft SHADOW-RING, his colour painted inside it)
      if (day) K.shadow.raw(px, feet + 0.043, pz + 0.04, 1.72 * br, 1, 1.42 * br, 0, 0, 1, 3, 0.5 * Math.min(1, lit));
      K.flat.put(px, feet + 0.045, pz + 0.04, 1.42 * br, 1, 1.16 * br, 0, kidHex, 1, 3, (day ? 1 : 0.8) * lit);
    }
    // THE GHOSTS: the others' kids from their own runs — see-through, their colour, a ring under their feet
    const ghosts = (o && o.ghosts) || null;
    const ga = o && o.a != null ? o.a : a;
    if (ghosts) for (const g of ghosts) {
      const r = g.run;
      g.tag = null;
      if (!r) continue;
      if (r.st === 'out' || r.st === 'taken') { if (!g.outAt) g.outAt = clock; } else g.outAt = 0;
      const up = r.st === 'taken' ? 2 : r.cause === 'ufo' ? 1 : 0, gone = g.outAt ? clamp01((clock - g.outAt) / (up ? 1500 * up : r.cause === 'blackbird' ? 800 : 420)) : 0;
      if (gone >= 1) continue;
      let gx = r.x / FP, gy = r.y + 0.5, gl = 0, gf = 0;
      const GL = course.lane(r.y);
      if (r.st === 'hop') { gf = Math.min(1, (r.k + ga) / HOP_TICKS); gx = (r.fx + (r.tx - r.fx) * gf) / FP; gy = r.fy + 0.5 + (r.ty - r.fy) * gf; gl = Math.sin(Math.PI * gf) * 0.5; g.dir = r.ty > r.fy ? 'u' : r.ty < r.fy ? 'd' : r.tx < r.fx ? 'l' : 'r'; }
      else if (r.st === 'idle' && GL.type === 'water' && !g.held) gx += GL.dir * GL.v * ga / FP;
      // (a late hop's catch-up: drawn back where it was, closing in a quick hop)
      const gv = g.vis && !g.outAt ? g.vis : null, air = gv ? Math.sin(Math.PI * gv.u) * 0.5 * Math.min(1, gv.d) : 0;
      if (gv) { gx += gv.x; gy += gv.y; gl = gl * gv.u + air; }
      if (gy < base - 1 || gy > top + 1) continue;
      const onLog = r.st === 'hop' ? (course.lane(r.fy).type === 'water' ? LOG_FEET * (1 - gf) : 0) + (course.lane(r.ty).type === 'water' ? LOG_FEET * gf : 0) : GL.type === 'water' ? LOG_FEET : 0;
      const yawG = g.dir === 'l' ? Math.PI / 2 : g.dir === 'r' ? -Math.PI / 2 : g.dir === 'd' ? Math.PI : 0, gs = KID_S * 0.94 * (1 - gone * 0.6), glit = litOf(Math.floor(gy)) * (up ? 1.8 : 1 - gone);
      const bb = r.cause === 'blackbird' && gone > 0 ? (GL.pulse ? GL.pulse.dir : 1) : 0;
      const gpx = X(gx) + bb * gone * 5 + (up > 1 ? (rig.x() - X(gx)) * gone : 0), gpy = onLog + gl + (up > 1 ? 13 * gone * gone * (3 - 2 * gone) : up ? gone * gone * 5 : bb ? 4 * Math.sin(gone * Math.PI * 0.85) : 0), gpz = Z(gy) + (bb ? gone * 2.4 : 0);
      if (up && gone > 0 && FL) FL.lift(gpx, gpy, gpz, gone, g.hex, up === 2);
      // NEAR YOU = FAINT: a ghost within ≈ 1.5 cells of the kid fades to a faint outline, its name tag hides — eased
      const near = show ? clamp01((2.0 - Math.hypot(gpx - px, gpz - pz)) / 0.5) : 0;
      g.fade = (g.fade || 0) + (near - (g.fade || 0)) * (reduce ? 1 : 1 - Math.exp(-dt / 50));
      const gq = r.st === 'hop' ? gf : gv ? gv.u : -1, gA = POSE ? POSE.idle[0] + (reduce ? 0 : ((clock + gpx * 400) % IDLE_MS + IDLE_MS) % IDLE_MS / IDLE_MS * POSE.idle[1]) : 0;
      if (KM.ghosts) KM.ghosts.put(gpx, gpy, gpz, gs, gs * (r.st === 'hop' ? 1 + 0.16 * Math.sin(Math.PI * gf) : 1 + 0.32 * air), gs, yawG + KID_YAW, g.hex, 1, Math.min(7.9, glit) + 8 * Math.round(g.fade * 15), gA, 0, 0, POSE && gq >= 0 ? POSE.jump[0] + gq * POSE.jump[1] : 0, gq >= 0 ? Math.min(1, Math.sin(Math.PI * gq) * 1.7) : 0);
      if (glit > 0.25) K.flat.put(gpx, onLog + 0.042, gpz + 0.04, 1.2, 1, 1.0, 0, g.hex, 1, 3, 0.4 * Math.min(1, glit) * (1 - 0.85 * g.fade));
      g.wx = gpx; g.wy = gpy + KID.h * gs + 0.16; g.wz = gpz; g.tag = gone > 0 || g.fade > 0.45 ? null : true;
    }
    if (flat) K.shadow.put(px, 0.034, pz + 0.12, 1.5 * flat.wide, 1, 1.3 * flat.wide, 0, 0, 1, 0, 0.5 * lit);
    // THE LINES: YOUR BEST + the next friend's — across the lane at its far edge, the words beside it
    for (const k of ['best', 'friend']) {
      const Ln = LINES[k], lab = LBL[k];
      if (!Ln || Ln.lane < base || Ln.lane >= top) { lab.m.visible = false; continue; }
      const L = course.lane(Ln.lane), ll = litOf(Ln.lane), hex = LINE_HEX[k], both = k === 'friend' && LINES.best && LINES.best.lane === Ln.lane;
      const z = Z(Ln.lane + (both ? 0.8 : 0.93)), hit = crossed.find(q => q.k === k && q.lane === Ln.lane), fl = hit ? Math.max(0, 1 - (clock - hit.t0) / 700) : 0;
      {
        // ONE FORM FOR BOTH: a line you CROSS, never a surface — a post at each edge of the play, a TAPE between them: GOLD = YOUR BEST ·
        // NEON PINK = the next friend's. ON WATER THE POSTS ARE BUOYS.
        const la = Math.min(1.4, ll), wet = L.type === 'water', cap = k === 'best' ? 0xfff0c0 : 0xffe4f6;
        for (const px0 of [X(-0.03), X(COLS + 0.03)]) {
          const bob = wet && !reduce ? Math.sin(clock / 480 + px0 * 1.9) * 0.035 : 0;
          if (wet) {
            K.posts.put(px0, 0.1 + bob, z, 0.34, 0.24, 0.34, 0, 0xe8432e, la); K.posts.put(px0, 0.27 + bob, z, 0.26, 0.1, 0.26, 0, 0xffffff, la); K.posts.put(px0, 0.5 + bob, z, 0.08, 0.36, 0.08, 0, cap, la);
            K.flat.put(px0, 0.05, z, 1.1, 1, 0.8, 0, 0xffffff, 1, 3, (day ? 0.55 : 0.24) * Math.min(1, ll));
          } else K.posts.put(px0, 0.31, z, 0.12, 0.62, 0.12, 0, cap, la);
          K.bill.put(px0, 0.68 + bob, z, 0.5 + fl * 0.2, 0.5 + fl * 0.2, 1, 0, hex, 1, 5, ll); if (!day) K.flat.put(px0, 0.05, z, 1.3, 1, 1.0, 0, hex, 1, 0, 0.3 * ll);
        }
        K.shadow.raw(0, 0.052, z + 0.07, 9.0, 1, 0.26, 0, 0, 1, 4, 0.5 * Math.min(1, ll));
        if (day) K.flat.put(0, 0.358, z, 9.1, 1, 0.8, 0, k === 'best' ? 0x5a3a00 : 0x5a0a44, 1, 4, 0.6 * Math.min(1, ll));   // (by day: a dark edge under the tape — it must read on a sunlit lane)
        K.flat.put(0, 0.36, z, 9.06, 1, (day ? 0.62 : 0.5) + fl * 0.25, 0, hex, 1, 4, (0.95 + fl * 0.4) * ll);
        K.flat.put(0, 0.362, z, 9.06, 1, 0.13, 0, 0xffffff, 1, 4, (0.85 + fl * 0.3) * ll);
        if (!reduce) for (let g = 0; g < 3; g++) K.bill.put(((clock / 1500 + g / 3) % 1) * 9 - 4.5, 0.4, z, 0.8, 0.3, 1, 0, hex, 1, 0, 0.7 * ll);
      }
      lab.m.visible = ll > 0.2;
      // (a soft dark strip under the words: they read on ANY ground)
      const wz = Z(Ln.lane + (both ? 1.42 : 0.42) - (L.mark ? 1 : 0));   // (H5A — a gateway lane carries its area's name: the line's words lie a lane lower)
      K.shadow.raw(rig.x(), 0.062, wz, 7.6, 1, 0.9, 0, 0, 1, 4, (day ? 0.4 : 0.5) * Math.min(1, ll));
      lab.m.position.set(rig.x(), 0.07, wz);   // (centred on the screen: the words ride the camera's own column — never cut by an edge)
      lab.m.material.opacity = Math.min(1, ll);
    }
    // (a FRIEND's line just crossed: its flare alone, fading where it lay)
    for (let j = crossed.length - 1; j >= 0; j--) {
      const q = crossed[j], u = (clock - q.t0) / 700;
      if (u >= 1) { crossed.splice(j, 1); continue; }
      if (LINES[q.k] && LINES[q.k].lane === q.lane) continue;
      if (q.lane >= base && q.lane < top) K.flat.put(0, 0.36, Z(q.lane + 0.93), 9.06, 1, 0.55 + (1 - u) * 0.25, 0, LINE_HEX[q.k], 1, 4, (1 - u) * litOf(q.lane));
    }
    // THE MOTHERSHIP (a capped run alone): its warning from the cap − 10 s, its arrival at the cap
    if (FL) { if (capT) FL.ship(tr, capT, taken ? fx.out : -1, 1); FL.end(); }
    // the small moments: a dust ring, a ripple, a splash
    for (let j = fx.parts.length - 1; j >= 0; j--) {
      const q = fx.parts[j], u = (clock - q.t0) / q.life;
      if (u >= 1) { fx.parts.splice(j, 1); continue; }
      if (q.k === 'ring') { const r = q.r0 + (q.r1 - q.r0) * ease(u); K.flat.put(q.x, q.y, q.z, r * 2, 1, r * 2 * (q.sz || 0.7), 0, q.hex, 1, 3, (1 - u) * (q.al || 0.8)); }
      else { const s = (clock - q.t0) / 1000; K.bill.put(q.x + q.vx * s, q.y + q.vy * s - 6.5 * s * s, q.z + q.vz * s, 0.16, 0.16, 1, 0, q.hex, 1, 0, 1 - u); }
    }
    // THE BLACKOUT: a cold edge where it bites, the black behind it
    if (day) {
      // THE FOG BANK (the blackout by day — the SAME wall, timing + rules): ROLLING, LAYERED fog (FOG_LAYERS) — the lanes show THROUGH
      // its first metre, the body behind (the curtain). Never a hard line, never a flat slab.
      const T = reduce ? 0 : clock / 1000, wrap = v => ((v % 19) + 19) % 19 - 9.5;
      K.shadow.raw(0, 0.06, Z(wallE + 1.25), 34, 1, 3.2, 0, 0, 1, 4, 0.2);
      for (let li = 0; li < FOG_LAYERS.length; li++) {
        const [dz, y0, sw, sh, al, sp, top, under, stp] = FOG_LAYERS[li];
        if (tier === 0 && li === 1) continue;   // (the lowest tier: one body layer less)
        for (let c = -9.5, id = 0; c < 9.5; c += stp, id++) {
          const r1 = hsh(977 + li * 31, id), r2 = hsh(1543 + li * 17, id), sz = 0.74 + 0.52 * r1;
          const x = wrap(c + T * sp), up = reduce ? 0 : Math.sin(T * (0.5 + r2 * 0.5) + id * 1.9) * 0.1, y = y0 * (0.78 + 0.5 * r2) + up, z = Z(wallE + dz + (r1 - 0.5) * 0.7);
          K.bill.put(x + 0.25 * sw * sz * 0.2, y - sh * sz * 0.2, z, sw * sz * 1.08, sh * sz, 1, 0, under, 1, 10, al);   // (shape 10: a puff fades INTO the ground — never cut by it)
          K.bill.put(x, y, z - 0.02, sw * sz, sh * sz * 0.86, 1, 0, top, 1, 10, al * 0.92);
        }
      }
      // the wisps: thin streaks drifting ahead of the bank
      for (let j = 0; j < 9; j++) { const r = hsh(2203, j), x = wrap(j * 2.1 + T * (0.42 + r * 0.4)); K.bill.put(x, 0.24 + r * 0.3, Z(wallE + 0.35 + r * 1.3), 3.0 + r * 1.6, 0.42 + r * 0.25, 1, 0, 0xffffff, 1, 0, 0.3 + 0.16 * Math.sin(T * 0.7 + j)); }
    } else {
      K.flat.put(0, 0.07, Z(wallE + 0.5), 30, 1, 2.6, 0, 0x5a3a9a, 1, 4, 0.1);   // (a cold VIOLET breath ahead of it — never blue: blue on the ground = water; the ragged glowing lip itself is the ground shader's)
      // (never a hard line: the dark creeps AHEAD in soft ragged drifting tongues, a cold violet glow on each lip)
      const T = reduce ? 0 : clock / 1000;
      for (let c = -9, id = 0; c <= 9; c += 1.15, id++) {
        const r = hsh(3301, id), x = c + Math.sin(T * (0.25 + r * 0.3) + id * 2.1) * 0.7, lip = wallE + 0.1 + r * 0.75;
        K.shadow.raw(x, 0.085, Z(lip), 2.6 + r * 1.6, 1, 1.5 + r * 1.3, 0, 0, 1, 0, 0.62 + 0.3 * r);
      }
    }
    // (by day the body starts under the back billows: its own edge is never seen)
    if (day) { lip.position.set(0, 2.5 + 0.9, Z(wallE - 3.1)); lip.scale.set(60, 1.8, 1); }
    curtain.position.set(0, 1.2, Z(wallE - (day ? 3.1 : 2.3) - 20)); curtain.scale.set(60, 2.6, 40);   // (by night it starts where the ground is already fully dark: its straight front is never seen)
    ground.uniforms.uWall.value = wallE;
    for (const q of Object.values(K)) q.done();
    for (const q of Object.values(KM)) q.done();
    ground.uniforms.uTime.value = reduce ? 0 : clock / 1000;
    renderer.info.reset();
    renderer.render(scene, cam);
    if (bloom && !day) bloom.render(scene, cam);   // (the bloom is the night's: by day the lights are paint)
    // THE SHARE IMAGE's frame: copied in THIS frame (a WebGL canvas keeps no picture between frames)
    if (snapAsk) { const ask = snapAsk; snapAsk = null; try { ask(grab(snapW, snapR)); } catch { ask(null); } }
    // where each ghost's name tag goes (CSS px; null = off the screen)
    if (ghosts) for (const g of ghosts) {
      if (!g.tag) continue;
      v3.set(g.wx, g.wy, g.wz).project(cam);
      const sx = (1 + v3.x) / 2, sy = (1 - v3.y) / 2;
      g.tag = v3.z < 1 && sx > 0.04 && sx < 0.96 && sy > 0.2 && sy < 0.9 ? [sx * w, sy * h] : null;
    }
  }
  let snapAsk = null, snapW = 1080, snapR = 0;
  /** the picture on the canvas right now → a 2D canvas `width` px wide (null if this phone can't) */
  function grab(width = 1080, rows = 0) {
    const cv = document.createElement('canvas'), k = width / el.width, H = Math.max(1, Math.round(el.height * k));
    // (`rows` = keep only that many round the kid; cv.top = where the cut begins)
    v3.copy(kidPos).project(cam);
    const hh = rows && rows < H ? rows : H, top = hh < H ? Math.max(0, Math.min(H - hh, Math.round((1 - v3.y) / 2 * H - hh * 0.65))) : 0;
    cv.width = width; cv.height = hh; cv.top = top; cv.full = H;
    const c = ctx2d(cv);
    if (!c) return null;
    c.drawImage(el, 0, -top, width, H);
    return cv;
  }

  const v3 = new THREE.Vector3();
  return {
    /** the NEXT frame as a 2D canvas → fn(canvas | null): the share image, the poster */
    snap(fn, width = 1080, rows = 0) { snapAsk = fn; snapW = width; snapR = rows; },
    /** the end screen covers the scene: it RESTS — a small still (dpr 1), no bloom targets, then nothing is drawn */
    rest(on) {
      if (!!resting === !!on) return;
      resting = on ? 3 : 0;
      if (on) { if (bloom) { bloom.dispose(); bloom = null; } for (const f of [...skyHold.keys()]) if (f !== skyS.now) skyHold.delete(f); }
      if (FL) FL.rest(on);
      fit(true); if (!on) setTier(tier);
    },
    resting: () => resting,
    /** the lines to draw (lines.js#linesFor): { best: { lane, text } | null, friend: … } */
    setLines(v) { for (const k of ['best', 'friend']) { LINES[k] = (v && v[k]) || null; if (LINES[k]) writeLabel(k, LINES[k].text); else LBL[k].m.visible = false; } },
    /** a line was CROSSED: a short light burst along it (never with reduce motion: the flare alone) */
    flashLine(k, lane) {
      crossed.push({ k, lane, t0: clock });
      if (reduce) return;
      for (let j = 0; j < 14; j++) part('drop', X(-0.5 + j * 0.78), 0.1, Z(lane + 0.93), 560, { hex: LINE_HEX[k], vx: (j % 3 - 1) * 0.4, vz: 0.15, vy: 2.4 + (j % 4) * 0.5 });
      part('ring', kidPos.x, 0.06, Z(lane + 0.93), 520, { hex: LINE_HEX[k], r0: 0.3, r1: k === 'best' ? 2.6 : 1.6 });
    },
    /** SPECTATE (the camera moved to another kid): the kid's own feel starts clean */
    resetKid() { fx.t = -1; fx.st = 'idle'; fx.hits = 0; fx.hit = null; fx.parts.length = 0; fx.landAt = -1e9; fx.wob = null; fx.seen = true; fx.out = 0; },
    el, draw, resize: () => fit(), ready, setTier, tier: () => tier,
    /** the lab's switches: ZOOM 7 · 8 · 9 + ANGLE straight · turned (eased; `snap` = at once) */
    setCamera(zoom, angle, snap) { rig.choose(zoom, angle, snap); },
    zoom: () => rig.zoom(), angle: () => rig.angle(),
    /** a ground point (column cells, lane) → where it is on the screen ([x, y] 0 … 1 from the top left) */
    project(cells, lane) { v3.set(X(cells), 0, Z(lane)).project(cam); return [(1 + v3.x) / 2, (1 - v3.y) / 2]; },
    kidScreenX() { v3.copy(kidPos).project(cam); return (1 + v3.x) / 2; },
    setKidColor: tintOf,
    /** THE START WHILE THE COURSE LANDS: 0 = only the lanes at the kid's feet out of the dark · 1 = the whole view */
    setReveal(v, snap) { revealT = v < 0 ? 0 : v > 1 ? 1 : v; if (snap) reveal = revealT; },
    /** where the kid is on the screen (0 … 1 from the top) — the camera's check */
    kidScreenY() { v3.copy(kidPos).project(cam); return (1 - v3.y) / 2; },
    /** how tall he stands on the screen, in CSS px — the wider view's readability number */
    kidHeightPx() { v3.copy(kidPos).project(cam); const y0 = v3.y; v3.set(kidPos.x, kidPos.y + kidH, kidPos.z).project(cam); return Math.abs(v3.y - y0) / 2 * h; },
    info: () => ({ warmed, kid: !!kidGeo, programs: renderer.info.programs ? renderer.info.programs.length : 0, calls: renderer.info.render.calls, tris: renderer.info.render.triangles, dpr, w, h, fov: cam.fov, tier, zoom: rig.zoom(), angle: rig.angle(), camX: rig.x(), yaw: rig.yaw(), bloom: !!bloom && !day, look: day ? 'day' : 'night', rest: resting, fly: FL ? FL.info() : null, shops: SH ? SH.info().models : 0, words: 'top', gate: gateInfo.on ? { ...gateInfo } : null, sky: { now: skyS.now, held: [...skyHold.keys()], fades: skyS.fades, shift: skyAt, bias: skyBiasT, off: skyLifeKey, fading: performance.now() < skyS.until }, foot: footAt, fog: [scene.fog.near, scene.fog.far] }),
    /** how long this run's end is SEEN before the end screen may cover it (ms; 0 = the view's own) · the moments' loops fade */
    holdMs: r => (FL ? FL.holdMs(r) : 0), quiet() { if (FL) FL.quiet(); }, duck: () => (FL ? FL.duck() : 1),
    /** THE LOOK: 'day' | 'night' (at once; the same scene) */
    setLook, look: () => (day ? 'day' : 'night'),
    destroy() {
      dead = true; ro.disconnect();
      for (const { m, g } of made) { scene.remove(m); m.material.dispose(); if (g) g.dispose(); m.dispose(); }
      for (const g of Object.values(GEO)) g.dispose();
      curtain.material.dispose(); lip.geometry.dispose(); lip.material.dispose(); lipTex.dispose(); if (FL) FL.destroy();
      if (kidGeo) { kidGeo.userData.poses.tex.dispose(); kidGeo.dispose(); }
      for (const L of Object.values(LBL)) { scene.remove(L.m); L.m.material.dispose(); L.tex.dispose(); L.cv.width = 0; L.cv.height = 0; }
      labelGeo.dispose(); fishGeo.dispose(); fishTex.dispose(); fish.material.dispose(); scene.remove(fish); fishCv.width = 0;
      G.cv.remove(); G.cv.width = 0; G.cv.height = 0;
      for (const g of Object.values(AGEO)) g.dispose();
      flatGeo.dispose(); billGeo.dispose(); unit.dispose(); ground.dispose();
      if (bloom) bloom.dispose();
      if (env) env.dispose();
      if (envDay) envDay.dispose();
      clearTimeout(skyLifeT); if (SH) SH.destroy();
      renderer.dispose();
      try { renderer.forceContextLoss(); } catch { /* fine */ }
      el.width = 0; el.height = 0;   // (BEFORE THE FLIP: the canvas freed at once — CLAUDE.md "THE LONG NIGHT's RULE")
      el.remove(); sky.remove(); farHaze.remove(); skyHold.clear();
    },
  };
}
