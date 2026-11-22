// JAYWALK — THE SCENE (H2 … H6B; three.js 0.160): the pure engine drawn in the smooth stylized 3D style — NIGHT + DAY are ONE scene
// The long notes: docs/games/jaywalk-notes.md
import * as THREE from 'three';
import { FP, COLS, HOP_TICKS, MODES } from './tuning.js';
import { moverLeft, pulseAt, pulseLeft, logUnder, ufoX, ufoY, mod, area, gateName } from './course.js';
import { loadKenney, loadKid, KID, SCENE_MODELS, buildTree, buildTuft, buildLog, LOG, buildTruck, TRUCK, buildBarricade, build, parseGlb } from './models.js';
import { seasonWindow } from './season-gate.js';
import { FOG_HEX, DAY_FOG_HEX, KIND, rgb, createGround, glowMaterial, paintMaterial, neonEnv, dayEnv, createBloom, fogUp, FOG_UP, OCC_LAYER } from './night-fx.js';
import { lazyImport } from '../../ui/lazy-import.js';
import { skyPlan, skyHeld, skyRoom, skyShift, skyOff, SKY_FADE_MS, SKY_LOOK_MS, SKY_BAND, SKY_ASPECT, SKY_LIGHTS, SKY_NEON } from './skyline.js';
import { CAM, createCamera } from './camera.js';
import { ctx2d, onCanvasLost } from '../../ui/canvas-safe.js';
import { shade } from './arrival.js';
import { LINE_HEX, friendFade } from './lines.js';
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
/** J4 — WINTER · JT1 — SEASONS (docs/jaywalk.md "JT1 — SEASONS"): a VIEW — every seasonal layer is THE SEASONAL PACK's (seasonal.js, fetched
 *  only on a season day — season-gate.js — or the lab's forced date; never the start bundle). The scene calls it at fixed points of a frame. */
const NO_SEASON = Object.freeze({ day: '', winter: 0, christmas: 0, snowfall: 'none', wet: 0, autumn: 0, hat: '', fireworks: '', any: false });

export function createNight(host, o = {}) {
  // (J2 FIX — THE NIGHT COMPARE: the new crisp runway lamps + the heat trail by NIGHT too, on the LAB's `&rwnight=new` only — the game never …
  const RWN = o.rwNight === true;
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
  const hemi = new THREE.HemisphereLight(0x8fa0ff, 0x1a1030, 1.5); scene.add(hemi);
  const key = new THREE.DirectionalLight(0xdfe4ff, 1.55); key.position.set(-5, 12, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff6ad0, 1.25); rim.position.set(6, 5, -10); scene.add(rim);
  let env = null, envDay = null;
  try { env = neonEnv(renderer); scene.environment = env; } catch { /* no gloss: fine */ }

  const P = new THREE.Vector3(), S = new THREE.Vector3(), Q = new THREE.Quaternion(), E = new THREE.Euler(), M = new THREE.Matrix4(), C = new THREE.Color();
  const made = [];
  /** an instanced kind. put(x, y, z, sx, sy, sz, ry, hex, k): place + size + turn + colour (× k) */
  function kind(geo, mat, n, { aux = null, raw = false, order = 0, bloom = false, solid = !bloom && !mat.transparent } = {}) {
    const g = aux ? geo.clone() : geo, m = new THREE.InstancedMesh(g, mat, n);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.setColorAt(0, C.set(0xffffff)); m.instanceColor.setUsage(THREE.DynamicDrawUsage);
    let ax = null;
    if (aux) { ax = new THREE.InstancedBufferAttribute(new Float32Array(n * aux[1]), aux[1]); ax.setUsage(THREE.DynamicDrawUsage); g.setAttribute(aux[0], ax); }
    m.frustumCulled = false; m.count = 0; m.renderOrder = order;
    if (bloom) m.layers.enable(1);
    if (solid) m.layers.enable(OCC_LAYER);   // (J1 — THE NIGHT GLOW FIX: a solid thing hides the lights behind it from the bloom — night-fx.js#createBloom)
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
        const f = day && k > 1 ? Math.min(1, (k - 1) / 2.4) : 0, kk = f ? 1 - f : k;
        if (raw) { col[i * 3] = ((hex >> 16) & 255) / 255 * kk + 0.875 * f; col[i * 3 + 1] = ((hex >> 8) & 255) / 255 * kk + 0.906 * f; col[i * 3 + 2] = (hex & 255) / 255 * kk + 0.933 * f; }
        else { C.setHex(hex); col[i * 3] = C.r * kk + 0.72 * f; col[i * 3 + 1] = C.g * kk + 0.79 * f; col[i * 3 + 2] = C.b * kk + 0.85 * f; }
        if (ax) { const q = i * aux[1]; ax.array[q] = a0; if (aux[1] > 1) ax.array[q + 1] = a1; if (aux[1] > 2) { ax.array[q + 2] = a2; ax.array[q + 3] = a3; } }
        i++;
      },
      done() { m.count = i; upRange(m.instanceMatrix, i * 16); upRange(m.instanceColor, i * 3); if (ax) upRange(ax, i * aux[1]); },
      left: () => n - i,
    };
  }
  const UP = new THREE.Vector3(0, 1, 0);
  // (J4 — the fresh-eyes review: ONLY the instances in use go to the GPU — three's own kept range record, HIGH RISE's S4A pattern; a three …
  const upRange = (a, cnt) => { const u = a._updateRange; if (u && cnt > 0) { u.offset = 0; u.count = cnt; } a.needsUpdate = true; };
  /** THE TAIL LIGHT BAR: a thin red bar across a vehicle's rear, `vw` wide — it glows by night */
  function tailBar(x, y, z, vw, a) {
    K.flat.put(x, y, z, vw, 1, day ? 0.09 : 0.15, Math.PI / 2, day ? 0xd81828 : 0xff2030, 1, 4, (day ? 1 : 1.3) * a);
    if (!day) { K.flat.put(x, y + 0.002, z, vw * 0.92, 1, 0.05, Math.PI / 2, 0xffd6cc, 1, 4, 0.9 * a); K.flat.put(x, y - 0.002, z, vw * 1.25, 1, 0.5, Math.PI / 2, 0xff2030, 1, 4, 0.3 * a); }
  }
  // (fogUp — H5C: a thing fades into the far haze as the ground under it does · J4 / JT1: THE SEASONAL PACK patches these — the snow on the …
  const seaMats = [];
  let SP = null;   // (THE SEASONAL PACK, once it is in — prepSeason)
  const lambert = (leaf = false) => { const m = fogUp(new THREE.MeshLambertMaterial({ vertexColors: true })); seaMats.push([m, leaf]); if (SP) SP.patch(m, leaf); return m; };
  const glossy = (rough, envI) => new THREE.MeshStandardMaterial({ roughness: rough, metalness: 0, envMapIntensity: envI });

  const ground = createGround(POOL, fogV);
  scene.add(ground.mesh);
  const flatGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), billGeo = new THREE.PlaneGeometry(1, 1), unit = new THREE.BoxGeometry(1, 1, 1);
  const GEO = { tree: buildTree(), tuft: buildTuft(), log1: buildLog(1), log2: buildLog(2), log3: buildLog(3), log4: buildLog(4), truck: buildTruck(), barricade: buildBarricade() };
  const K = {
    shadow: kind(flatGeo, glowMaterial(fogV, { shadow: true }), 420, { aux: ['aFx', 2], raw: true, order: 1 }),
    flat: kind(flatGeo, glowMaterial(fogV), 720, { aux: ['aFx', 2], raw: true, order: 2, bloom: true }),          // pools · trails · beams · rings · edge lines
    bill: kind(billGeo, glowMaterial(fogV, { bill: true }), 900, { aux: ['aFx', 2], raw: true, order: 3, bloom: true }),   // lamps · light quads · sparks
    trees: kind(GEO.tree, lambert(true), 150),
    tufts: kind(GEO.tuft, lambert(), 220, { solid: false }),   // (J1: a grass tuft never hides a light pool)
    ...Object.fromEntries([1, 2, 3, 4].map(n => [`log${n}`, kind(GEO[`log${n}`], fogUp(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0, envMapIntensity: 0.25 })), 60)])),
    trucks: kind(GEO.truck, paintMaterial(glossy(0.3, 1), { instanced: true }), 24, { aux: ['aLit', 1] }),
    barricades: kind(GEO.barricade, lambert(), 40),
    posts: kind(unit, fogUp(new THREE.MeshLambertMaterial({ color: 0xffffff })), 280),
  };
  let day = false;
  { const put0 = K.shadow.put; K.shadow.raw = put0; K.shadow.put = (x, y, z, sx, sy, sz, ry, hex, k, a0, a1, ...r) => {
    if (!day) { put0(x, y, z, sx, 1, sz, ry, hex, k, a0, a1, ...r); return; }
    const a = a1 == null ? 1 : a1, off = Math.min(SUN.len * (sy === 1 ? 0.55 : sy), 0.4 * Math.min(sx, sz) + 0.14);   // (never further than the shadow is wide: it stays joined to the thing)
    put0(x + SUN.x * off, y - 0.003, z + SUN.z * off, sx * 1.05, 1, sz * 1.05, ry, hex, k, a0, a * 0.62, ...r);
    put0(x + SUN.x * 0.05, y, z + SUN.z * 0.05, sx * 0.9, 1, sz * 0.9, ry, hex, k, a0, a * 0.9, ...r);
  }; }
  const AGEO = buildAreaGeo(), AK = {};
  for (const [name, g] of Object.entries(AGEO)) AK[name] = K[`a_${name}`] = kind(g, lambert(), { bollard: 60, crate: 90, icecrate: 60, drum: 70, rock: 90, hydrant: 40, container: 60, stall: 30, rail: 60, house: 24 }[name] || 6);
  const KM = {}, BOX = {};
  let dead = false, needWarm = true, warmed = 0;
  let kidGeo = null, kidMat = null, POSE = null;
  const ready = Promise.all([loadKenney(SCENE_MODELS), loadKid()]).then(([geos, kg]) => {
    if (dead) { for (const g of Object.values(geos)) g.dispose(); if (kg) { kg.userData.poses.tex.dispose(); kg.dispose(); } return false; }
    if (kg) {
      kidGeo = kg; POSE = kg.userData.poses.clips;
      kidMat = paintMaterial(glossy(0.42, 0.7), { instanced: true, rim: true, skin: kg.userData.poses.tex });
      KM.kid = kind(kg, kidMat, 1, { aux: ['aKid', 4] });
      const gm = paintMaterial(glossy(0.5, 0.35), { instanced: true, skin: kg.userData.poses.tex, fade: true }); gm.transparent = true; gm.opacity = 0.46;
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

  // ---- J4 + JT1 — THE SEASON (setSeason — the view's, from the run's own DAY): THE SEASONAL PACK (seasonal.js — its code; the winter models …
  let SZ = NO_SEASON, wetOn = false, spAsk = null, onSound = null;
  const SPAPI = {
    scene, kind, K, KM, X, Z, COLS, hsh, reduce, fogV, build, parseGlb, mats: seaMats,
    lambert: () => lambert(), ground: null, part: (...a) => part(...a),
    kid: () => (KM.kid ? { kid: KM.kid, ghosts: KM.ghosts } : null), sky: () => skyImg, course: () => courseRef, area, dead: () => dead, rewarm() { needWarm = true; },
    sound: id => { if (onSound) { try { onSound(id); } catch { /* audio is polish */ } } },
  };
  /** fetch THE SEASONAL PACK for a day ('d20261224') — a season day only (or `force`: the lab) → a promise (true = the day's pieces are in) */
  function prepSeason(day, { force = false } = {}) {
    if (!force && !seasonWindow(day)) return Promise.resolve(false);
    if (!spAsk) spAsk = lazyImport(import('./seasonal.js'), './seasonal.js').then(M => { if (dead) return null; SPAPI.ground = ground; SP = M.createSeasonal(SPAPI); if (resting) SP.rest(true); return SP; }).catch(() => { spAsk = null; return null; });
    return spAsk.then(sp => (sp ? sp.prep(day) : false));
  }
  /** the season for the run starting now: its DAY · { wet (WET NEON STREETS — the lab's; WET_LIVE in the game), snow (the lab's forced fall),
   *  clock (the lab's local minutes), now (the phone's clock: the New Year's finale) } → what it applied (the normal look if the pack is not in) */
  function setSeason(day, o = {}) {
    wetOn = !!o.wet;
    const want = !!day && (seasonWindow(day) || o.force || wetOn || !!o.snow);
    if (want && !SP) prepSeason(day, { force: true });
    SZ = SP ? SP.apply(want ? day : '', o) : { ...NO_SEASON, day: day || '' };   // (a scene kept over PLAY AGAIN on another day: the pack takes its season back off)
    return SZ;
  }
  /** THE LIGHTS this frame (J4 — the wet streets' streaks + the snow's catch-light): the pack keeps the 16 nearest the kid */
  let lWant = false;
  const glow = (x, z, hex, k) => { if (lWant) SP.glow(x, z, hex, k); };
  const FR = {}, seaLand = { on: false, L: null, x: 0, y: 0 };   // (JT1 — the numbers a frame hands THE SEASONAL PACK · this frame's landing — no garbage)

  const kidPos = new THREE.Vector3();
  const labelGeo = new THREE.PlaneGeometry(7.0, 0.875).rotateX(-Math.PI / 2);   // (BIG: the letters ≈ half a lane tall; 7 cells — H5C: the words are CENTRED on the screen (they ride the camera's column): never cut by its edge)
  const LBL = {};
  for (const k of ['best', 'friend']) {
    const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 128;
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: k === 'friend' });   // (the dark halo: they read on bright water · JT2: the FRIEND's words lie UNDER the traffic — YOUR BEST's still read over a van)
    mat.stencilWrite = true; mat.stencilWriteMask = 0; mat.stencilRef = 1; mat.stencilFunc = THREE.NotEqualStencilFunc;
    const m = new THREE.Mesh(labelGeo, mat);
    m.renderOrder = 5; m.visible = false; m.frustumCulled = false; m.layers.enable(1); scene.add(m);
    LBL[k] = { m, cv, tex, text: null };
  }
  const css = hex => `#${hex.toString(16).padStart(6, '0')}`;
  const GATE_GONE = 3, GATE_FADE = 1.5, GATE_SEEN = 10;
  const fishGeo = new THREE.PlaneGeometry(2.4, 1.2);
  const G = { cv: document.createElement('canvas'), text: null, o: '' };
  G.cv.width = 1024; G.cv.height = 176; G.cv.className = 'jw-gate'; G.cv.setAttribute('aria-hidden', 'true'); host.append(G.cv);
  const gateShow = v => {   // (BEFORE THE FLIP: marked drawn only once drawn; a refused / wiped / blank board drawn again; a small pop-in)
    const o = v < 0.01 ? '0' : v.toFixed(2);
    if (o === G.o) return;
    if (G.o === '0' || G.o === '') gateCheck();
    G.o = o; G.cv.style.opacity = o; G.cv.style.transform = o === '0' ? '' : `scale(${(0.9 + 0.1 * Math.min(1, v)).toFixed(3)})`;
  };
  function gateCheck() {
    if (!G.text) return;
    try { const c = ctx2d(G.cv); if (!c || c.getImageData(512, 150, 1, 1).data[3] === 0) G.text = null; } catch { G.text = null; }
  }
  const offLost = onCanvasLost(() => { G.text = null; });
  try { if (document.fonts && document.fonts.load) document.fonts.load('900 88px "Orbitron"').then(() => { if (!dead) G.text = null; }, NOP); } catch { /* no font API: the fallback face */ }
  const gateInfo = { on: false, text: '', y: 0, d: 0, a: 0 };
  function writeGate(text, hex, paint) {
    const key = `${text}|${day ? 'd' : 'n'}`;
    if (G.text === key) return;
    const c = ctx2d(G.cv);
    if (!c) return;   // (refused — asked again next frame)
    G.text = key;
    c.clearRect(0, 0, 1024, 176);
    const board = q => { c.beginPath(); c.moveTo(q, 176 - q); c.lineTo(q, 66 + q * 0.4); c.quadraticCurveTo(512, -30 + q * 2.2, 1024 - q, 66 + q * 0.4); c.lineTo(1024 - q, 176 - q); c.closePath(); };
    c.lineJoin = 'round';
    if (day) {   // (BY DAY: a PAINTED sign — the area's colour, a white trim, the name in white paint with a dark edge. BEFORE THE FLIP: the
      board(3); c.fillStyle = css(shade(paint, 0.72)); c.fill();
      c.save(); board(3); c.clip(); const sh = c.createLinearGradient(0, 0, 0, 176); sh.addColorStop(0, 'rgba(255, 255, 255, 0.2)'); sh.addColorStop(0.55, 'rgba(255, 255, 255, 0)'); sh.addColorStop(1, 'rgba(0, 0, 20, 0.22)'); c.fillStyle = sh; c.fillRect(0, 0, 1024, 176); c.restore();
      board(3); c.lineWidth = 7; c.strokeStyle = 'rgba(14, 18, 40, 0.92)'; c.stroke();
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
    // (THE TOUCH-UP PASS: a THICKER dark edge — two rings + a soft shadow: pink / gold words read over a yellow taxi + the day's ground)
    c.shadowColor = 'rgba(6, 4, 18, 0.95)'; c.shadowBlur = 16; c.fillStyle = '#0c1022'; for (const r of [10, 5]) for (const [dx, dy] of RING8) drawNum(c, text, x0 + dx * r, dy * r, 104, FAM, 900);
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
  const rimCol = new THREE.Color();
  let kidHex = 0xff3fb4;
  const tintOf = hex => { kidHex = C.set(hex).getHex(); rimCol.set(hex).lerp(C.set(0xffffff), 0.5); };
  tintOf(o.kidColor || '#ff3fb4');
  let FL = null, flyAsk = null;
  let SH = null, shopAsk = null;
  const shopGet = () => { if (!shopAsk) shopAsk = lazyImport(import('./shops.js'), './shops.js').then(M => { if (!dead) SH = M.createShops({ kind, K, rewarm() { needWarm = true; } }); }).catch(NOP); };
  const flyGet = () => { if (!flyAsk) flyAsk = lazyImport(import('./flyers.js'), './flyers.js').then(M => { if (!dead) FL = M.createFlyers({ renderer, scene, cam, host, K, hazeAt, reduce, rewarm() { needWarm = true; } }); }).catch(NOP); };
  const curtain = new THREE.Mesh(unit, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.93, depthWrite: false, fog: false }));
  curtain.renderOrder = 6; scene.add(curtain);
  const lipTex = (() => { const n = 32, d = new Uint8Array(n * 4); for (let i = 0; i < n; i++) { const u = 1 - i / (n - 1), a = u * u * (3 - 2 * u); d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 255; d[i * 4 + 3] = Math.round(a * 255); } const t = new THREE.DataTexture(d, 1, n, THREE.RGBAFormat); t.magFilter = t.minFilter = THREE.LinearFilter; t.needsUpdate = true; return t; })();
  const lip = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xdfe7ee, map: lipTex, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide }));
  lip.renderOrder = 6.1; lip.visible = false; scene.add(lip);

  const sky = document.createElement('div'), skyImg = document.createElement('div');
  sky.className = 'jw-skyline'; skyImg.className = 'jw-skyline-img';
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
  const skyUnder = document.createElement('div'), skyOver = document.createElement('div');   // (UNDER is always solid; only OVER's opacity ever moves)
  skyUnder.className = skyOver.className = 'jw-sky-pic'; skyOver.style.opacity = '0'; skyImg.prepend(skyUnder, skyOver);
  const seaWall = document.createElement('div'), wallStone = document.createElement('i'), wallDay = document.createElement('i'), farHaze = document.createElement('div');
  seaWall.className = 'jw-seawall'; farHaze.className = 'jw-farhaze'; wallDay.className = 'is-day'; seaWall.append(wallStone, wallDay);
  for (const x of [8, 29, 50, 71, 92]) { const l = document.createElement('b'); l.style.left = `${x}%`; seaWall.append(l); }
  sky.append(skyImg, seaWall); host.append(sky, farHaze);
  let skyAt = 9e9, skyLane = -1e9, skyRoomPc = 0, skyBias = 0, skyBiasT = 0, skyFresh = true, skyPicW = 0, skyMax = 99, skyMin = -99, skyMatch = false;
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
    for (const q of [K.flat, K.bill]) { const m = q.mesh.material; m.blending = day ? THREE.NormalBlending : THREE.AdditiveBlending; m.uniforms.uDay.value = day ? 1 : 0; m.needsUpdate = true; }
    K.shadow.mesh.material.uniforms.uDay.value = day ? 1 : 0;   // (H5C — a day shadow is COOL: the sky fills it)
    fish.material.blending = day ? THREE.NormalBlending : THREE.AdditiveBlending; fish.material.needsUpdate = true;
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
    skyLane = -1e9; skyFresh = first ? true : 'look'; needWarm = true;
  }
  setLook(o.look === 'day' ? 'day' : 'night');

  let bloom = null, tier = 2, w = 0, h = 0, dpr = devDpr, kAt = 0, reveal = 1, revealT = 1;   // (reveal — H3: 0 = only the start's few lanes out of the dark · 1 = the whole view)
  /** the rig's scale moved (a ZOOM change): the far plane + the fog follow it */
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
    const n = 22 * k + (footAt - HAZE_LANES * k - 22 * k) * reveal, f = 24.5 * k + (footAt - 24.5 * k) * reveal;
    scene.fog.near = n; scene.fog.far = f; fogV.set(n, f);
  }
  /** how deep in the far haze a point is (0 = clear · 1 = gone) — for what three's own fog cannot fade */
  const hazeAt = (x, y, z) => { const d = (x - cam.position.x) * fwd.x + (y - cam.position.y) * fwd.y + (z - cam.position.z) * fwd.z, u = clamp01((d - scene.fog.near) / Math.max(0.001, scene.fog.far - scene.fog.near)); return u * u * (3 - 2 * u); };
  let fitAsk = 0;   // (BEFORE THE FLIP — a resize only ASKS; draw() resizes FIRST, then renders: a resize after the frame was drawn showed the stage's pale day sky for a frame — the owner's "white flashes". 0 · 1 = a size check · 2 = forced)
  const fit = force => { fitAsk = Math.max(fitAsk, force ? 2 : 1); };
  function fitNow(force) {
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
  fitNow(true); fitAsk = 0;   // (the new canvas: sized at once — nothing drawn on it yet)

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
  const plots = new Map();
  function sigAt(i) {
    const s = Math.floor(i / 50);
    let m = plots.get(s);
    if (!m) { m = new Map(); for (const P of sigOf(courseRef, s, (a, b) => hsh(vseed ^ (a * 7919), b))) { const l = m.get(P.y0) || []; l.push(P); m.set(P.y0, l); } plots.set(s, m); if (plots.size > 6) plots.delete(plots.keys().next().value); }
    return m.get(i) || null;
  }

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
    const seaBack = SP ? SP.warmIn() : null;   // (J4 — the falling snow's program too: THE SEASONAL PACK's)
    for (const m of [...(FL ? FL.meshes() : []), ...Object.values(LBL).map(L => L.m), fish]) { put.push([m, m.visible, m.position.y, m.count]); m.visible = true; m.position.y = -60; if (m.isInstancedMesh && !m.count) m.count = 1; }   // (J2: the jets are ONE instanced mesh — warmed with one in it)
    try { renderer.compile(scene, cam); renderer.render(scene, cam); if (bloom) bloom.render(scene, cam); } catch { /* a phone that can't: the kinds simply build as they come, as before */ }
    if (!otherWarm && lookSet) {
      otherWarm = true; day = !day;
      try { lookGL(); renderer.compile(scene, cam); renderer.render(scene, cam); } catch { /* as above */ }
      day = !day; lookGL();
    }
    for (const [m, v, y, c] of put) { m.visible = v; m.position.y = y; if (m.isInstancedMesh) m.count = c; }
    if (seaBack) seaBack();
    for (const q of [...Object.values(K), ...Object.values(KM)]) { q.reset(); q.done(); }
    warmed++;
  }

  /** one frame: the run after its last tick, `a` (0 … 1) into the next one, `dt` ms since the last frame. `o.ghosts` (a match):
   *  [{ run, hex, out? }] — each gets `tag` = [x, y] on the screen (CSS px) or null. `o.t` = THE WORLD's TICK: all is drawn at it.
   *  `o.a` = the ghosts' fraction; `g.vis` / `o.off` = a late hop's CATCH-UP ({ x, y, u: 0 … 1, d }); `g.held` = unconfirmed. */
  /**
   * J2 — THE AFTERBURNER TRAIL (a v2 runway lane — course.js#laneHit: everything behind its jet burns through the pass, then the WHOLE lane
   * for `p.trail` ticks): BLUE-PINK PLASMA in both looks (the owner, Nov 21: amber fire sank into the amber runway lights) — a glowing
   * streak on the road (a white-violet core in a hot PINK glow · by day a dark scorched band under pink paint: BLUE ON THE GROUND = WATER,
   * so the blue stays OFF the ground) + a row of standing plasma tongues (an electric-blue body, a white-hot heart, a pink tip), cooling as
   * it ages but bright to the last deadly tick; then out fast (EMBER ticks of dim violet embers — never read as live). Instanced kinds only
   * (no draw call of its own). `u` = ticks into the lap.
   */
  const EMBER = 14, burnHash = (i, k) => { const x = (Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1; return x < 0 ? x + 1 : x; };   // (0 … 1: the tongues stay inside their own lane)
  function burnLane(p, u, z, lt) {
    const end = p.pass + p.trail;
    if (u >= end + EMBER) return;
    let x0 = -1.6, x1 = COLS + 1.6;
    if (u < p.pass) { const l = pulseLeft(p, u) / FP, len = p.len / FP; if (p.dir > 0) x1 = Math.min(x1, l + len * 0.4); else x0 = Math.max(x0, l + len * 0.6); }
    if (x1 - x0 < 0.2) return;
    const age = u < p.pass ? 0 : u - p.pass, live = u < end, heat = live ? 1 - 0.4 * age / p.trail : 0.32 * (1 - (u - end) / EMBER);
    const cx = X((x0 + x1) / 2), w = x1 - x0, A = Math.min(1, lt), fl = reduce ? 1 : 0.85 + 0.15 * Math.sin(clock / 47 + z * 3.1);
    if (day || RWN) { heatTrail(p, u, z, x0, x1, cx, w, A, age, live, heat); return; }
    // (BY NIGHT, as J2 shipped it — the owner: "looks amazing". The day's plasma paint gave way to J2 FIX's heat trail, heatTrail)
    K.flat.put(cx, 0.045, z, w, 1, 1.0, 0, 0xff2aa8, 1, 4, 0.62 * heat * fl * lt);   // the glow round it (inside its own lane: never read as the next one burning)
    K.flat.put(cx, 0.05, z, w, 1, 0.3, 0, live ? 0xa86cff : 0x5a1a6e, 1, 4, 0.6 * heat * lt);   // the hot core (violet, never white: additive light over the pink would blow out)
    if (!live) return;
    // THE PLASMA TONGUES: one every 0.85 of a cell, each its own flicker (still with reduce motion: a steady height) — blue body, white heart, pink tip
    for (let c = Math.ceil(x0 / 0.85) * 0.85; c < x1; c += 0.85) {
      const hsh0 = burnHash(Math.round(c * 7) + p.band * 31, 3), f = reduce ? 0.8 : 0.62 + 0.38 * Math.abs(Math.sin(clock / (70 + 40 * Math.abs(hsh0)) + hsh0 * 9)), hh = (0.42 + 0.34 * f) * heat;
      const x = X(c), zz = z + (hsh0 - 0.5) * 0.36;
      const fw = 0.7 * (0.8 + 0.2 * heat), fh = hh;
      K.bill.put(x, fh * 0.66, zz - 0.01, fw * 0.75, fh * 1.05, 1, 0, 0xff2ab8, 1, 9, 0.5 * A);   // its pink tip (the tongue's top, licking up past the blue)
      K.bill.put(x, fh * 0.45, zz, fw, fh, 1, 0, 0x1e50ff, 1, 9, A);                           // the plasma tongue (narrow at its top)
      K.bill.put(x, fh * 0.28, zz + 0.02, fw * 0.36, fh * 0.5, 1, 0, 0x7cc8ff, 1, 9, 0.55 * A);   // its hot heart (cyan — additive: white would wash the blue out)
    }
  }

  /**
   * J2 FIX — THE RUNWAY LAMPS, CRISP (the owner, Nov 21: the big glowing lamp balls looked cheap): every lamp a SMALL FIXTURE — a dark housing
   * set in the tarmac (by day: night's additive light has no dark) + a sharp bright PIP (shape 11 — a hard edge at 3×, no halo). Off the
   * tell: a dim lens. In the tell + the pass: a RUNNING SEQUENCE across the lane toward the crossing (every 3rd lamp lit, stepping every 7
   * ticks off the rules' own clock — steady, all lit, with reduce motion), the amber row + the red row, the racing head brightest. The
   * chevron arrows (the ground's shader) are untouched. By day always; by night on the lab's `&rwnight=new` only (a soft glow under a lit
   * pip there — the dark road needs it). Instanced kinds only.
   */
  function runwayLamps(p, st, tellF, head, z, lt) {
    const warn = tellF > 0, k = st.st === 'pass' ? p.tell + st.s : p.tell - (st.left || 0), step = reduce ? 0 : Math.floor(k / 7);
    for (let c = -1; c <= COLS; c++) {
      const at = p.dir > 0 ? c : COLS - 1 - c, far = c < 0 || c >= COLS ? 0.6 : 1, x = X(c + 0.5), hot = warn && head > -50 && at <= head && at > head - 3.2;
      for (const e of [-0.42, 0.42]) {
        if (day) K.flat.put(x, 0.046, z + e, 0.32, 1, 0.2, 0, 0x30343c, 1, 12, 0.85 * far);                                         // the housing (a small crisp box set in the tarmac)
        if (!warn) { K.bill.put(x, 0.1, z + e, 0.11, 0.11, 1, 0, day ? 0xa49c8c : 0x7a5a32, 1, 11, (day ? 0.8 : 0.7) * lt * far); continue; }   // a dim lens
        const lit = reduce || hot || ((at - step) % 3 + 3) % 3 === 0, hex = e < 0 ? 0xffa400 : 0xff2412;
        if (!lit) { K.bill.put(x, 0.1, z + e, 0.12, 0.12, 1, 0, day ? 0x6a3420 : 0x3a1408, 1, 11, far); continue; }
        const sz = hot ? 0.27 : 0.21, y = 0.06 + sz * 0.5;
        if (!day) K.flat.put(x, 0.04, z + e, 0.9, 1, 0.7, 0, hex, 1, 0, 0.42 * far);                                                  // (night compare: a small glow on the road)
        K.bill.put(x, y, z + e, sz, sz, 1, 0, hex, 1, 11, far);                                                                         // the lamp
        K.bill.put(x, y, z + e, sz * 0.42, sz * 0.42, 1, 0, 0xfff8e6, 1, 11, far);                                                       // its sharp bright pip
      }
    }
  }
  /**
   * J2 FIX — THE TRAIL BY DAY = HEAT, NOT NEON (the owner, Nov 21): a SCORCHED dark streak on the asphalt + a thin WHITE-HOT centre line
   * (a warm edge round it) + see-through, soft-edged BLUE-WHITE flame tongues standing up (shape 13: no solid cones, they flicker, their
   * tips fade to nothing — BLUE ONLY STANDS UP: blue on the ground = water) + a faint HEAT SHIMMER (a translucent wavy band over it) +
   * SMOKE WISPS rising as the 0.7 s ends. By night (the lab's `&rwnight=new` only): the same, tuned for additive light — the violet core on
   * the road, electric-blue tongues with a CYAN heart (white would wash the blue out). Instanced kinds only (no draw call of its own).
   */
  function heatTrail(p, u, z, x0, x1, cx, w, A, age, live, heat) {
    const T = p.trail, dying = live ? Math.max(0, (age - T * 0.5) / (T * 0.5)) : 1, gone = live ? 0 : (u - p.pass - T) / EMBER;
    const sc = (live ? 1 : 1 - gone) * A;
    if (day) { K.flat.put(cx, 0.049, z, w, 1, 1.9, 0, 0x2a2420, 1, 4, 0.82 * sc); K.flat.put(cx, 0.0495, z, w, 1, 0.9, 0, 0x120e0c, 1, 4, 0.9 * sc); }   // the SCORCHED streak + its charred core (soot, never blue)
    else { K.shadow.put(cx, 0.049, z, w, 1, 1.9, 0, 0, 1, 4, 0.85 * sc); K.shadow.put(cx, 0.05, z, w, 1, 0.8, 0, 0, 1, 4, 0.7 * sc); }
    if (live) {
      K.flat.put(cx, 0.053, z, w, 1, day ? 0.5 : 0.36, 0, day ? 0xff6a10 : 0xa86cff, 1, 4, (day ? 0.8 : 0.6) * heat * A);                              // the line's hot edge (violet by night)
      K.flat.put(cx, 0.054, z, w, 1, day ? 0.18 : 0.12, 0, day ? 0xfffbea : 0xe2d4ff, 1, 4, (day ? 0.65 + 0.35 * heat : 0.5 * heat) * A);                // the WHITE-HOT centre line
      // THE HEAT SHIMMER: three translucent bands over the trail, each wavering on its own (a picture of heat — no distortion pass)
      if (!reduce) for (let k = 0; k < 3; k++) {
        const sx = x0 + (k + 0.5) * (x1 - x0) / 3, wv = Math.sin(clock / 83 + k * 2.1 + z * 1.7);
        K.bill.put(X(sx), 0.95 + 0.07 * wv, z + 0.05 * Math.sin(clock / 61 + k), (x1 - x0) / 3 * 1.1, 0.34 + 0.06 * wv, 1, 0, day ? 0xfff6ea : 0x8aa8ff, 1, 4, (day ? 0.13 : 0.07) * heat * A);
      }
      // THE FLAME TONGUES: one every 0.85 of a cell, each its own flicker + sway (still with reduce motion: a steady height)
      for (let c = Math.ceil(x0 / 0.85) * 0.85; c < x1; c += 0.85) {
        const hs = burnHash(Math.round(c * 7) + p.band * 31, 3), f = reduce ? 0.8 : 0.6 + 0.4 * Math.abs(Math.sin(clock / (64 + 40 * hs) + hs * 9));
        const hh = (0.5 + 0.42 * f) * (0.55 + 0.45 * heat) * (day ? 1.8 : 1.1), fw = (day ? 0.92 : 0.62) * (0.85 + 0.15 * heat);
        const x = X(c + (reduce ? 0 : 0.06 * Math.sin(clock / 53 + hs * 11))), zz = z + (hs - 0.5) * 0.36;
        K.bill.put(x, hh * 0.5, zz, fw, hh, 1, 0, day ? 0x58a4ff : 0x1e50ff, 1, 13, (day ? 0.8 : 0.95) * A);                                // the tongue (see-through)
        K.bill.put(x, hh * 0.32, zz + 0.02, fw * 0.48, hh * 0.62, 1, 0, day ? 0xffffff : 0x7cd8ff, 1, 13, (day ? 0.95 : 0.6) * A);            // its hot heart (cyan by night)
      }
    }
    // SMOKE WISPS as it dies: soft grey puffs rising + spreading, out with the embers
    if (dying > 0 && gone < 1) for (let c = Math.ceil(x0 / 1.6) * 1.6 + 0.4; c < x1; c += 1.6) {
      const hs = burnHash(Math.round(c * 5) + p.band * 17, 7), q = live ? dying * 0.6 : 0.6 + 0.4 * gone, sz = 0.9 + 1.3 * q;
      K.bill.put(X(c + 0.3 * (hs - 0.5) + 0.25 * q), 0.45 + 1.5 * q, z + (hs - 0.5) * 0.3, sz, sz, 1, 0, day ? 0x3c3d42 : 0x3c4658, 1, 0, Math.sin(Math.PI * Math.min(1, q * 1.15)) * (day ? 0.9 : 0.34) * A);
    }
  }

  function draw(run, course, a, dt, o = null) {
    if (fitAsk) { const f = fitAsk === 2; fitAsk = 0; fitNow(f); }   // (a resize asked since the last frame: done HERE, before this frame renders)
    if (resting === 1) return;   // (rest(): its still is up)
    if (resting) resting--;
    clock += dt;
    const LF = day ? NOP : K.flat.put, LB = day ? NOP : K.bill.put, EK = day ? 0.8 : 0.5, fogK = day ? 2.4 : -0.96;
    if (SP && (run.t === 0 || run.st === 'out' || run.st === 'taken')) SP.quiet();   // (J4 — the pack's kinds + shaders brought in at a quiet frame, never mid-run)
    if (needWarm && w && h) { needWarm = false; warm(); }
    if (reveal !== revealT) { reveal = reduce ? revealT : reveal + (revealT - reveal) * Math.min(1, dt / 130); if (Math.abs(revealT - reveal) < 0.004) reveal = revealT; }
    if (course !== courseRef) { courseRef = course; vseed = strSeed(course.seed); decor.clear(); plots.clear(); }
    if (run.st === 'out' || run.st === 'taken') { if (fx.endT !== run.end) { fx.endT = run.end; fx.after = 0; } fx.after += dt * 0.06; } else { fx.endT = -1; fx.after = 0; }
    const capT = MODES[run.mode].cap, tr = o && o.t != null ? o.t : run.t + a + fx.after, t = capT && tr > capT ? capT + 40 * (1 - Math.exp((capT - tr) / 40)) : tr, lane = course.lane(run.y);
    if (run.t < fx.t || (run.t === 0 && fx.t !== 0)) { fx.hits = 0; fx.hit = null; fx.parts.length = 0; fx.yaw = Math.PI; fx.landAt = -1e9; fx.wob = null; fx.seen = false; fx.st = 'idle'; fx.out = 0; }
    let kx = run.x / FP, ky = run.y + 0.5, lift = 0, f = 0, hopDir = '';
    if (run.st === 'hop') {
      f = Math.min(1, (run.k + a) / HOP_TICKS);
      kx = (run.fx + (run.tx - run.fx) * f) / FP; ky = run.fy + 0.5 + (run.ty - run.fy) * f; lift = Math.sin(Math.PI * f) * 0.52;
      hopDir = run.ty > run.fy ? 'u' : run.ty < run.fy ? 'd' : run.tx < run.fx ? 'l' : 'r';
    } else if (run.st === 'idle' && lane.type === 'water') kx += lane.dir * lane.v * a / FP;
    const co = o && o.off && run.st !== 'out' && run.st !== 'taken' ? o.off : null;
    if (co) { kx += co.x; ky += co.y; lift = lift * co.u + Math.sin(Math.PI * co.u) * 0.5 * Math.min(1, co.d); }
    const landed = (fx.st === 'hop' && run.st !== 'hop') || (run.st === 'hop' && fx.st === 'hop' && (run.fy !== fx.fy || run.fx !== fx.fx));
    if (landed && run.hits === fx.hits) {
      const at = run.st === 'hop' ? course.lane(run.fy) : lane, lx = (run.st === 'hop' ? run.fx : run.x) / FP, ly = (run.st === 'hop' ? run.fy : run.y) + 0.5;
      fx.landAt = clock; fx.landOn = at.type;
      if (SP) { seaLand.L = at; seaLand.x = lx; seaLand.y = ly; seaLand.on = true; }   // (JT1 — the prints, the puff, a leaf pile: told to the pack below, with the frame's numbers)
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

    const bobOf = (i, j) => (reduce ? 0 : Math.sin(clock / 520 + i * 1.7 + j * 2.3) * 0.028);
    let feet = 0;
    if (run.st !== 'hop' && lane.type === 'water') { const j = logUnder(lane, run.t, run.x); feet = j >= 0 ? LOG_FEET + bobOf(lane.i, j) : 0; }
    else if (run.st === 'hop') { const A = course.lane(run.fy), B = course.lane(run.ty); feet = (A.type === 'water' ? LOG_FEET : 0) * (1 - f) + (B.type === 'water' ? LOG_FEET : 0) * f; }
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
    let poseA = 0, poseB = 0, poseK = 0;
    if (POSE) {
      poseA = POSE.idle[0] + (reduce ? 0 : (clock % IDLE_MS) / IDLE_MS * POSE.idle[1]);
      if (run.st === 'hop' || co) { const q = run.st === 'hop' ? f : co.u; poseB = POSE.jump[0] + q * POSE.jump[1]; poseK = Math.min(1, Math.sin(Math.PI * q) * 1.7); }
    }
    const fallPose = e => { if (POSE) { const u = (e % (FALL_MS * 2)) / FALL_MS; poseB = POSE.fall[0] + (u < 1 ? u : 2 - u) * POSE.fall[1]; poseK = Math.min(1, e / 90); } };
    const H = fx.hit;
    if (H && run.st === 'out') {
      const e = clock - H.t0, u = clamp01(e / 600);
      px = X(H.x); pz = Z(H.y); py = 0; rx = 0; show = true;
      if (H.cause === 'car') {
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
    const wallE = run.wall / FP, darkOf = i => clamp01(wallE - i), litOf = i => 1 + fogK * darkOf(i);
    lit *= litOf(Math.floor(ky));
    kidPos.set(px, flat ? 0.02 : py, pz);
    const SE = SP && SZ.any ? SP : null;   // (THE SEASONAL PACK this frame — none: nothing seasonal is drawn)
    lWant = !!SE && !day && ((wetOn && tier === 2) || SZ.snowfall !== 'none');   // (J4 — THE LIGHTS this frame)
    if (SE) {
      FR.px = px; FR.pz = pz; FR.lights = lWant; FR.day = day; FR.tier = tier; FR.clock = clock; FR.dt = dt; FR.vseed = vseed; FR.LF = LF; FR.LB = LB; SE.frame(FR);
      if (seaLand.on) SE.land(seaLand.L, seaLand.x, seaLand.y, fx.dir, true, area(Math.floor(seaLand.y)).index);
    }
    seaLand.on = false;
    const kidDraw = show ? [px, flat ? 0.02 : py, pz, s3[0] * KID_S, s3[1] * KID_S, s3[2] * KID_S, ry + KID_YAW, kidHex, 1, lit, poseA, rx, rz, poseB, poseK] : null;
    if (kidMat) kidMat.userData.u.uRim.value.copy(rimCol).multiplyScalar((day ? 0.16 : 0.5) * Math.min(1, lit));
    kidH = KID.h * s3[1] * KID_S;

    const down = run.st === 'out';
    rig.follow(run.st === 'hop' ? run.tx / FP : down && H ? H.x : kx, run.st === 'hop' ? run.ty + 0.5 : down ? (H ? H.y : ky) : ky, dt);
    const camY = rig.y();
    let shx = 0, shy = 0;
    if (clock < fx.shake) { const q = (fx.shake - clock) / 240; shx = Math.sin(clock * 0.09) * 0.16 * q; shy = Math.cos(clock * 0.113) * 0.12 * q; }
    if (FL) { const q = FL.shake(); shx += Math.sin(clock * 0.11) * q; shy += Math.cos(clock * 0.13) * q; }   // (THE BLACKBIRD's pass: ≤ 4 px, ≤ 200 ms)
    rig.apply(cam, shx, shy, heroCam ? [px, pz] : null);
    posed = true; fwd.set(0, 0, -1).applyQuaternion(cam.quaternion); FOG_UP.value = -fwd.y; depth();   // (the fog follows the lens: full at the sea wall's foot)
    skyBias += (skyBiasT - skyBias) * (reduce ? 1 : 1 - Math.exp(-dt / 650)); if (Math.abs(skyBiasT - skyBias) < 0.02) skyBias = skyBiasT;
    const sl = Math.round(skyShift(skyBias, rig.x() * 2.2 - rig.yaw() * 28, skyRoomPc, skyMax, skyMin) * 20) / 20;
    if (sl !== skyAt) { skyAt = sl; skyImg.style.transform = `translate3d(${(-50 - sl).toFixed(2)}%,0,0)`; wallStone.style.transform = wallDay.style.transform = `translate3d(${(-sl * skyPicW * 0.0115).toFixed(1)}px,0,0)`; }

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
          else if (q.k === 'tree' || (q.k !== 'barricade' && !KM[q.k])) {
            const s = 0.72 + q.s * 0.3;
            if (!SE || !SE.tree(x, zz, s, q, i, dim, on, lt)) K.trees.put(x, 0, zz, s, s, s, q.ry * 3, 0xffffff, dim);   // (J4 — winter swaps it: a snow pine · a lit Christmas tree — seasonal.js)
            K.shadow.put(x, 0.03, zz + 0.1, 1.15 * s, 1.6, 1.0 * s, 0, 0, 1, 0, 0.5 * lt);
          }
          else if (q.k === 'barricade') { K.barricades.put(x, 0, zz, 1.04, 1.04, 1.04, q.ry * 0.22, 0xffffff, dim * 1.3); K.shadow.put(x, 0.03, zz + 0.06, 1.1, 1, 0.6, 0, 0, 1, 0, 0.45 * lt); if (on) K.bill.put(x + 0.4, 0.68, zz, 0.3, 0.3, 1, 0, 0xffa530, 1, 0, 0.95 * dim); }
          else {
            if (!SE || !SE.planter(x, zz, q, i, dim)) { const s = PROP_S[q.k]; KM[q.k].put(x, 0, zz, s, s, s, Math.round(q.ry) * Math.PI / 2 + (q.k === 'traffic-cone' ? q.ry : 0), 0xffffff, dim * 1.35); }   // (J4 — some planters → SNOWMEN: seasonal.js)
            K.shadow.put(x, 0.03, zz + 0.06, 0.95, 1, 0.8, 0, 0, 1, 0, 0.45 * lt);
          }
        }
        if (D.lamp && !(D.lamp < 0 ? sgL : sgR)) {                // a street lamp on the edge column: its head over the grass, a warm pool under it
          const side = D.lamp, x = X(side > 0 ? COLS + 0.55 : -0.55);
          if (KM['street-lamp']) KM['street-lamp'].put(x, 0, z, 2.7, 2.7, 2.7, side > 0 ? Math.PI / 2 : -Math.PI / 2, 0xffffff, lt * 1.3);
          if (on) { LF(x - side * 0.75, 0.035, z, 3.6, 1, 3.0, 0, D.lampHex, 1, 0, 0.34 * lt); LB(x - side * 0.5, 1.72, z, 0.34, 0.34, 1, 0, D.lampHex, 1, 5, 0.8 * lt); glow(x - side * 0.5, z, D.lampHex, 0.9 * lt); }
        }
        if (tier > 0 && SZ.winter < 0.45) for (const q of D.tufts) K.tufts.put(X(q[0]), 0, z - 0.5 + q[1], q[2], q[2], q[2], q[0] * 9, 0xffffff, lt * (q[0] < 0 || q[0] > COLS ? EK + 0.1 : 1));
      } else if (L.type === 'road' || L.type === 'water') {
        const car = L.type === 'road', per = L.period / FP;
        if (!car) fxv = L.dir * L.v * 0.06;   // (H5B's add-on — THE WATER FLOWS the way its logs go: the lane's current in cells a second, for the ground's ripple caps + specks)
        for (let j = 0; j < L.items.length; j++) {
          const it = L.items[j], len = it.len / FP, l0 = moverLeft(L, it, t) / FP;
          for (let lap = -1; lap <= 1; lap++) {
            const left = l0 + lap * per;
            if (left > COLS + 9 || left + len < -9) continue;
            const cx = X(left + len / 2), inside = left + len > 0 && left < COLS, dim = lt * (inside ? 1 : EK + 0.05);
            if (car) {
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
                if (truck) for (const m of [0, 0.34, 0.67, 1]) K.bill.put(cx + L.dir * (TRUCK.box[0] + (TRUCK.box[1] - TRUCK.box[0]) * m) * tz, 0.29, z + 0.4, 0.24, 0.24, 1, 0, 0xff9a1c, 1, 0, a1);
                if (taxi) { K.bill.put(bx, 0.5, z, 0.3, 0.2, 1, 0, 0xfff3b0, 1, 5, a1); LB(bx, 0.5, z, 0.62, 0.42, 1, 0, 0xffc21e, 1, 0, 0.55 * a1); }   // its ROOF LIGHT: a small lit box + its warm halo
                const rearX = truck ? tail : nose - L.dir * bodyL;
                if (lWant) { glow(X(nose), z, 0xfff0c8, 1.1 * a1); glow(X(rearX), z, 0xff2a22, 0.85 * a1); }   // (J4 — its headlights + its tail on the wet road)
                const vw = truck ? 0.9 : len < 1.5 ? 0.7 : 0.78;
                LF(X(rearX - L.dir * (TAIL_LEN / 2 - 0.2)), 0.04, z, TAIL_LEN, 1, vw * 1.15, L.dir > 0 ? Math.PI : 0, 0xff2a22, 1, -1, 0.34 * a1);
                LF(X(rearX - L.dir * 0.1), 0.041, z, 0.6, 1, vw * 0.9, 0, 0xff5a34, 1, 0, 0.3 * a1);
                tailBar(X(rearX - L.dir * 0.03), hy + 0.06, z, vw, a1);
                for (const e of [-hw, hw]) {   // BOTH headlights + BOTH tail lamps, each at its own place on the model
                  LF(X(nose + L.dir * HEAD_REACH / 2), 0.04, z + e, HEAD_REACH, 1, 0.8, back, 0xfff0c8, 1, 6, 0.5 * a1);   // a short soft beam on the road ahead
                  K.bill.put(X(nose), hy, z + e, day ? 0.13 : 0.2, day ? 0.13 : 0.2, 1, 0, 0xfff0c0, 1, 5, (day ? 0.7 : 0.8) * a1);
                }
              }
            } else {
              const wob = fx.wob && fx.wob.lane === i && fx.wob.j === j && lap === 0 ? clock - fx.wob.t0 : 9e9, wv = wob < 520 && !reduce ? Math.exp(-wob / 170) * Math.sin(wob / 42) : 0;
              const by = bobOf(i, j) + LOG_FEET - LOG.top - wv * 0.07, rock = reduce ? 0 : Math.sin(clock / 880 + i * 1.3 + j * 2.1) * 0.04 + wv * 0.16;
              const n = Math.max(1, Math.min(4, Math.round(len))), tailX = L.dir > 0 ? left : left + len;
              K[`log${n}`].put(cx, by, z, 1, 1, 1, 0, 0xffffff, dim * 1.12, 1, 1, rock);
              K.shadow.put(cx, 0.047, z + 0.06, len * 1.06 + 0.25, 0.35, 1.25, 0, 0, 1, 0, 0.5 * Math.min(1, lt));   // (H5B's add-on: a soft darker shadow under each log — it sits ON bright water)
              if (on) {
                const lw = len + 0.1, ld = 0.92, asp = 7 + Math.min(9.9, lw / ld) / 10, rp = reduce ? 0.4 : (clock / 1700 + j * 0.37 + i * 0.21) % 1;
                LF(cx, 0.045, z, len + 1.1, 1, 1.6, 0, 0xffa23a, 1, 0, 0.17 * dim);
                K.flat.put(cx, 0.05, z, lw, 1, ld, 0, day ? 0xffffff : 0xffb060, 1, asp, (day ? 0.75 : 0.42) * dim);
                K.flat.put(cx, 0.052, z, lw + 0.12 + rp * 0.5, 1, ld + 0.12 + rp * 0.5, 0, day ? 0xffffff : 0xb8dcec, 1, 7 + Math.min(9.9, (lw + 0.12 + rp * 0.5) / (ld + 0.12 + rp * 0.5)) / 10, (day ? 0.5 : 0.2) * (1 - rp) * dim);
                K.flat.put(X(tailX - L.dir * 0.8), 0.05, z, 1.7, 1, 0.8, L.dir > 0 ? 0 : Math.PI, day ? 0xffffff : 0xa8d4e6, 1, 1, (day ? 0.4 : 0.13) * dim);
              }
            }
          }
        }
      } else {
        const p = L.pulse, st = pulseAt(p, Math.floor(t)), rail = L.type === 'rail', u = mod(t - p.phase, p.period);
        const lead = 10, s = u < p.pass + lead ? u : u > p.period - lead ? u - p.period : null;
        if (rail) {
          const tell = st.st === 'tell', blink = tell && Math.floor(t / 8) % 2 === 0;
          railGone = !tell && (st.st === 'pass' || s !== null);
          fxv = tell ? (blink ? 1 : 0.35) : 0;
          for (const c of [-0.3, 3, 6, 9.3]) {                // the signals: red, flashing from the tell to the train's tail
            const x = X(c);
            K.posts.put(x, 0.3, z - 0.44, 0.1, 0.6, 0.1, 0, 0x2a2a34, lt); K.posts.put(x, 0.66, z - 0.46, 0.3, 0.34, 0.12, 0, 0x1c1c24, lt);   // (a post + its signal head's housing: a lamp, never a lollipop)
            K.bill.put(x, 0.66, z - 0.44, blink ? (day ? 0.7 : 0.62) : 0.24, blink ? (day ? 0.7 : 0.62) : 0.24, 1, 0, blink ? 0xff2a2a : tell ? 0x7a1414 : 0x32151b, 1, 5, (blink ? 1 : tell ? 0.8 : 0.7) * lt);
            if (blink && on) { K.flat.put(x, 0.04, z - 0.3, 2.2, 1, 1.5, 0, 0xff2020, 1, 0, (day ? 0.45 : 0.5) * lt); glow(x, z - 0.44, 0xff2020, 0.8 * lt); }
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
              tailBar(X(rear - p.dir * 0.03), ty + 0.04, z, 0.86, lt); glow(X(nose), z, 0xfff2d0, 1.2 * lt); glow(X(rear), z, 0xff2a22, 0.8 * lt);   // (H6B — the cars' rule: a light bar across its tail …)
              LF(X(rear - p.dir * (TAIL_LEN * 0.65 - 0.2)), 0.05, z, TAIL_LEN * 1.3, 1, 1.0, p.dir > 0 ? Math.PI : 0, 0xff2a22, 1, -1, 0.3 * lt);   // … and ONE oval red pool starting at it, centred, as wide as the train
              LF(X(left + len / 2), 0.045, z + 0.55, len, 1, 0.9, 0, 0xffe2b8, 1, 4, 0.3 * lt);   // (its windows' light on the ground: warm — never blue)
            }
          }
        } else {
          const tellF = st.st === 'tell' ? 1 - st.left / p.tell : st.st === 'pass' ? 1 : 0;
          fxv = tellF * p.dir;
          const head = st.st === 'tell' ? (tellF * tellF * 7 + tellF * 2) % 1 * 14 - 2.5 : -99;
          // (J2 FIX — the crisp lamps by day (+ the lab's night compare): runwayLamps. BY NIGHT the lamps J2 shipped, untouched)
          if (day || RWN) runwayLamps(p, st, tellF, head, z, lt);
          else for (let c = -1; c <= COLS; c++) {
            const at = p.dir > 0 ? c : COLS - 1 - c, hot = head > -50 && at <= head && at > head - 3.2, far = c < 0 || c >= COLS ? 0.6 : 1;
            for (const e of [-0.42, 0.42]) {
              K.bill.put(X(c + 0.5), 0.07, z + e, hot ? 0.74 : 0.3, hot ? 0.74 : 0.3, 1, 0, hot ? 0xfff6dc : 0xffcf8a, 1, 5, (hot ? 1 : 0.85) * lt * far);
              if (on) K.flat.put(X(c + 0.5), 0.04, z + e, hot ? 1.7 : 0.8, 1, hot ? 1.2 : 0.6, 0, 0xffa820, 1, 0, (hot ? 0.75 : 0.35) * lt * far);
            }
          }
          if (p.trail) burnLane(p, u, z, lt);   // (J2 — v2's runways: THE AFTERBURNER TRAIL — drawn here, never waiting for the flyers' module)
          if (L.i === p.band) { if (FL) FL.jet(p, u, z - (p.n - 1) / 2, lt); else { flyGet(); if (s !== null) K.shadow.put(X(pulseLeft(p, s) / FP + p.len / FP / 2), 0.03, z - 0.5, 3.6, 1, 1.9, 0, 0, 1, 0, 0.6 * lt); } }
        }
      }
      if (L.ufo && nu < 2 && L.ufo.id !== ufoSeen) {   // THE UFO (H6A — flyers.js; once a UFO). Until the module has landed: its ring — the rules' warning — alone
        nu++; ufoSeen = L.ufo.id;
        if (FL) FL.ufo(L.ufo, t, lt); else { flyGet(); const r = L.ufo.r / FP * 2.5; K.flat.put(X(ufoX(L.ufo, t) / FP), 0.05, Z(ufoY(L.ufo, t) / FP), r, 1, r, 0, 0x3dff7a, 1, 3, 0.95); }
      }
      const AR = area(i).index;
      if (SE && L.type === 'grass') SE.grass(i, L, z, lt, AR);   // (JT1 — a LEAF PILE on it, if it has one)
      if (L.mark && AR >= 0) {
        const hex = LOOKS[AR].accent, xl = X(-0.55), xr = X(COLS + 0.55), zf = z - 0.42;
        if (day) {
          const pc = LOOKS[AR].paint, wh = 0xf6f2e8, li = Math.min(1.6, lt);
          for (const x of [xl, xr]) { K.posts.put(x, 1.5, zf, 0.22, 3.0, 0.22, 0, wh, li); K.posts.put(x, 2.86, zf, 0.3, 0.4, 0.3, 0, pc, li); K.posts.put(x, 0.4, zf, 0.3, 0.8, 0.3, 0, pc, li); K.posts.put(x, 3.16, zf, 0.34, 0.2, 0.34, 0, wh, li); K.shadow.put(x, 0.03, zf, 0.9, 3.0, 0.7, 0, 0, 1, 0, 0.5 * Math.min(1, lt)); }
          for (let k = 0; k < 10; k++) K.flat.put(xl + (xr - xl) * (k + 0.5) / 10, 0.05, zf + 0.06, (xr - xl) / 10 + 0.02, 1, 0.38, 0, k % 2 ? wh : pc, 1, 4, 1);
        } else {
          for (const x of [xl, xr]) { glow(x, zf, hex, lt); K.posts.put(x, 1.5, zf, 0.2, 3.0, 0.2, 0, 0x2b2b3c, lt); K.bill.put(x, 3.1, zf, 0.5, 0.5, 1, 0, hex, 1, 5, lt); for (let k = 0; k < 5; k++) K.bill.put(x, 0.4 + k * 0.55, zf, 0.3, 0.42, 1, 0, hex, 1, 4, 0.85 * lt); if (on) K.flat.put(x, 0.05, zf, 2.6, 1, 2.0, 0, hex, 1, 0, 0.4 * lt); }
          K.flat.put(0, 0.05, zf + 0.06, (xr - xl) * 1.02, 1, 0.3, 0, hex, 1, 4, 0.9 * lt); K.flat.put(0, 0.052, zf + 0.06, xr - xl, 1, 0.08, 0, 0xffffff, 1, 4, 0.7 * lt);
          if (on) K.flat.put(0, 0.045, z, 11, 1, 1.2, 0, hex, 1, 4, 0.16 * lt);
        }
        const dg = i - ky, near = clamp01((dg - GATE_GONE) / GATE_FADE) * clamp01(GATE_SEEN + 0.5 - dg);
        if (!gateSeen && near > 0.01 && dk < 0.8) { writeGate(gateName(i), hex, LOOKS[AR].paint); gateShow(near); gateSeen = true; gateInfo.on = true; gateInfo.text = gateName(i); gateInfo.y = 0.24 + 0.82 * w * 176 / 1024 / h; gateInfo.d = dg; gateInfo.a = near; }
      }
      const PL = AR >= 0 ? sigAt(i) : null;
      if (PL) for (const P of PL) { const r = drawSig(P, { K, A: AK, KM, BOX, X, Z, lt, on: on && !day, day, ek: EK, T: LOOKS[AR], h: (a, b) => hsh(vseed ^ (a * 2659), b), course }); if (r && r.beam && on) beam = { at: r.beam, side: P.side, lt: Math.min(1, lt) }; if (r && r.sign && on && !sign) sign = { at: r.sign, lt: Math.min(1, lt) }; }
      if (AR >= 0 && LOOKS[AR].footbridge && L.type === 'water' && i % 2 === 0) AK.footbridge.put(X(i % 4 ? -0.6 : COLS + 0.6), 0, z, 1.05, 1.0, 0.86, 0, 0xffffff, lt * (EK + 0.2));
      if (AR >= 0 && LOOKS[AR].gantry && L.type === 'rail') for (const sd of [-1, 1]) {
        const gx = X(sd < 0 ? -0.55 : COLS + 0.55);
        K.posts.put(gx - 0.42, 0.95, z - 0.47, 0.07, 1.9, 0.07, 0, 0x3a3a48, lt * (EK + 0.2)); K.posts.put(gx + 0.42, 0.95, z - 0.47, 0.07, 1.9, 0.07, 0, 0x3a3a48, lt * (EK + 0.2)); K.posts.put(gx, 1.9, z - 0.47, 0.95, 0.08, 0.08, 0, 0x4a4a5a, lt * (EK + 0.2));
        K.bill.put(gx, 1.72, z - 0.47, 0.26, 0.26, 1, 0, fxv ? 0xff2a2a : railGone ? 0x24302a : 0x40ff80, 1, 5, 0.9 * lt);   // (red in the tell · dark while the train is here · green: clear)
      }
      ground.lay(gi++, i, kindOf(L), kindOf(course.lane(i - 1)), kindOf(course.lane(i + 1)), hsh(vseed, i) * 10, dk, fxv, AR + 1);
    }
    ground.done(gi);
    if (!gateSeen) { gateInfo.on = false; gateShow(0); }
    if (beam) {
      const [bx, bh, bz] = beam.at, sw = reduce ? 0.25 : Math.sin(clock / 2300) * 0.95, ang = beam.side < 0 ? sw : Math.PI - sw, len = 15;
      K.bill.put(bx, bh, bz, day ? 0.8 : 1.5, day ? 0.8 : 1.5, 1, 0, 0xfff4c0, 1, 5, beam.lt); LB(bx, bh, bz, 4.2, 3.4, 1, 0, 0xffe9a0, 1, 0, 0.5 * beam.lt);
      K.flat.put(bx + Math.cos(ang) * len / 2, 0.075, bz - Math.sin(ang) * len / 2, len, 1, 3.4, ang, day ? 0xfffbe0 : 0xfff0b0, 1, 2, (day ? 0.2 : 0.5) * beam.lt);
      LF(bx + Math.cos(ang) * len / 2, 0.076, bz - Math.sin(ang) * len / 2, len, 1, 1.3, ang, 0xffffff, 1, 2, 0.28 * beam.lt);
    }
    fish.visible = !!sign;
    if (sign) { fish.position.set(sign.at[0], sign.at[1], sign.at[2]); fish.quaternion.copy(cam.quaternion); fish.material.opacity = sign.lt * (reduce || day ? 1 : 0.88 + 0.12 * Math.sin(clock / 190)); }
    const kl = Math.max(0, Math.floor(ky));
    if (skyMatch !== (run.mode === 'match')) { skyMatch = !skyMatch; skyLane = -1e9; }
    if (kl !== skyLane) { skyLane = kl; skyFollow(kl, skyFresh); skyFresh = false; }
    if (show && py > -0.2) K.shadow.put(px, feet + 0.035, pz + 0.05, 0.98 * (1 - lift * 0.55) * s3[0], 1.15 + lift * 1.4, 0.78 * (1 - lift * 0.55) * s3[2], 0, 0, 1, 0, 0.66 * (1 - lift * 0.9) * lit);
    if (show && py > -0.2 && lit > 0.25 && !(H && down)) {
      const br = reduce ? 1 : 0.94 + 0.06 * Math.sin(clock / 260);
      LF(px, feet + 0.04, pz + 0.04, 2.3, 1, 1.9, 0, kidHex, 1, 0, 0.3 * lit);   // (H5A: softer — the new kid's own colours (his face, his arms, his sneakers) must read through it)
      if (day) K.shadow.raw(px, feet + 0.043, pz + 0.04, 1.72 * br, 1, 1.42 * br, 0, 0, 1, 3, 0.5 * Math.min(1, lit));
      K.flat.put(px, feet + 0.045, pz + 0.04, 1.42 * br, 1, 1.16 * br, 0, kidHex, 1, 3, (day ? 1 : 0.8) * lit);
    }
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
      const gv = g.vis && !g.outAt ? g.vis : null, air = gv ? Math.sin(Math.PI * gv.u) * 0.5 * Math.min(1, gv.d) : 0;
      if (gv) { gx += gv.x; gy += gv.y; gl = gl * gv.u + air; }
      const ghop = r.st === 'hop';
      if (SE && g.hopW && !ghop && !g.outAt) SE.land(GL, gx, gy, g.dir, false, area(r.y).index);   // (JT1 — a rival LANDED: its prints on the snow, a pile it lands in bursts)
      g.hopW = ghop;
      if (gy < base - 1 || gy > top + 1) continue;
      const onLog = r.st === 'hop' ? (course.lane(r.fy).type === 'water' ? LOG_FEET * (1 - gf) : 0) + (course.lane(r.ty).type === 'water' ? LOG_FEET * gf : 0) : GL.type === 'water' ? LOG_FEET : 0;
      const yawG = g.dir === 'l' ? Math.PI / 2 : g.dir === 'r' ? -Math.PI / 2 : g.dir === 'd' ? Math.PI : 0, gs = KID_S * 0.94 * (1 - gone * 0.6), glit = litOf(Math.floor(gy)) * (up ? 1.8 : 1 - gone);
      const bb = r.cause === 'blackbird' && gone > 0 ? (GL.pulse ? GL.pulse.dir : 1) : 0;
      const gpx = X(gx) + bb * gone * 5 + (up > 1 ? (rig.x() - X(gx)) * gone : 0), gpy = onLog + gl + (up > 1 ? 13 * gone * gone * (3 - 2 * gone) : up ? gone * gone * 5 : bb ? 4 * Math.sin(gone * Math.PI * 0.85) : 0), gpz = Z(gy) + (bb ? gone * 2.4 : 0);
      if (up && gone > 0 && FL) FL.lift(gpx, gpy, gpz, gone, g.hex, up === 2);
      const near = show ? clamp01((2.0 - Math.hypot(gpx - px, gpz - pz)) / 0.5) : 0;
      g.fade = (g.fade || 0) + (near - (g.fade || 0)) * (reduce ? 1 : 1 - Math.exp(-dt / 50));
      const gq = r.st === 'hop' ? gf : gv ? gv.u : -1, gA = POSE ? POSE.idle[0] + (reduce ? 0 : ((clock + gpx * 400) % IDLE_MS + IDLE_MS) % IDLE_MS / IDLE_MS * POSE.idle[1]) : 0;
      if (KM.ghosts) KM.ghosts.put(gpx, gpy, gpz, gs, gs * (r.st === 'hop' ? 1 + 0.16 * Math.sin(Math.PI * gf) : 1 + 0.32 * air), gs, yawG + KID_YAW, g.hex, 1, Math.min(7.9, glit) + 8 * Math.round(g.fade * 15), gA, 0, 0, POSE && gq >= 0 ? POSE.jump[0] + gq * POSE.jump[1] : 0, gq >= 0 ? Math.min(1, Math.sin(Math.PI * gq) * 1.7) : 0);
      if (glit > 0.25) K.flat.put(gpx, onLog + 0.042, gpz + 0.04, 1.2, 1, 1.0, 0, g.hex, 1, 3, 0.4 * Math.min(1, glit) * (1 - 0.85 * g.fade));
      g.wx = gpx; g.wy = gpy + KID.h * gs + 0.16; g.wz = gpz; g.tag = gone > 0 || g.fade > 0.45 ? null : true;
    }
    if (flat) K.shadow.put(px, 0.034, pz + 0.12, 1.5 * flat.wide, 1, 1.3 * flat.wide, 0, 0, 1, 0, 0.5 * lit);
    for (const k of ['best', 'friend']) {
      const Ln = LINES[k], lab = LBL[k];
      if (!Ln || Ln.lane < base || Ln.lane >= top) { lab.m.visible = false; continue; }
      const L = course.lane(Ln.lane), ll = litOf(Ln.lane), hex = LINE_HEX[k], both = k === 'friend' && LINES.best && LINES.best.lane === Ln.lane;
      const z = Z(Ln.lane + (both ? 0.8 : 0.93)), hit = crossed.find(q => q.k === k && q.lane === Ln.lane), fl = hit ? Math.max(0, 1 - (clock - hit.t0) / 700) : 0;
      // (JT2 — THE FRIEND LINE: thinner + see-through (half), ON the ground — under every vehicle — and it FADES as the kid comes: lines.js#friendFade)
      const fr = k === 'friend', fd = fr ? friendFade(Ln.lane - ky + 0.5) : 1;
      if (fr && fd <= 0.002 && fl <= 0) { lab.m.visible = false; continue; }
      {
        const la = Math.min(1.4, ll), wet = L.type === 'water', cap = k === 'best' ? 0xfff0c0 : 0xffe4f6, ps = fr ? 0.5 * fd : 1;
        for (const px0 of [X(-0.03), X(COLS + 0.03)]) {
          const bob = wet && !reduce ? Math.sin(clock / 480 + px0 * 1.9) * 0.035 : 0;
          if (wet) {
            const b = fr ? fd : 1;
            K.posts.put(px0, 0.1 * b + bob, z, 0.34 * b, 0.24 * b, 0.34 * b, 0, 0xe8432e, la); K.posts.put(px0, 0.27 * b + bob, z, 0.26 * b, 0.1 * b, 0.26 * b, 0, 0xffffff, la); K.posts.put(px0, 0.5 * b + bob, z, 0.08 * b, 0.36 * b, 0.08 * b, 0, cap, la);
            K.flat.put(px0, 0.05, z, 1.1, 1, 0.8, 0, 0xffffff, 1, 3, (day ? 0.55 : 0.24) * Math.min(1, ll) * ps);
          } else K.posts.put(px0, fr ? 0.17 * fd : 0.31, z, 0.12, fr ? 0.34 * fd : 0.62, 0.12, 0, cap, la);
          K.bill.put(px0, (fr ? (wet ? 0.68 * fd : 0.38 * fd) : 0.68) + bob, z, (fr ? 0.34 : 0.5) + fl * 0.2, (fr ? 0.34 : 0.5) + fl * 0.2, 1, 0, hex, 1, 5, ll * (fr ? ps + fl : 1)); if (!day) K.flat.put(px0, 0.05, z, 1.3, 1, 1.0, 0, hex, 1, 0, 0.3 * ll * ps);
        }
        if (fr) {   // (the tape lies at the ground's edge of the lane: a car on its lane hides it, one on the next lane stands clear of it — never drawn over traffic)
          K.shadow.raw(0, 0.03, z + 0.04, 9.0, 1, 0.16, 0, 0, 1, 4, 0.3 * fd * Math.min(1, ll));
          if (day) K.flat.put(0, 0.055, z, 9.1, 1, 0.34, 0, 0x5a0a44, 1, 4, 0.35 * fd * Math.min(1, ll));
          K.flat.put(0, 0.06, z, 9.06, 1, (day ? 0.26 : 0.22) + fl * 0.3, 0, hex, 1, 4, (0.5 * fd + fl * 1.2) * ll);
          K.flat.put(0, 0.062, z, 9.06, 1, 0.05, 0, 0xffd6f0, 1, 4, (0.32 * fd + fl * 1.1) * ll);   // (a pale pink core — no white-hot line to bloom at night)
        } else {
          K.shadow.raw(0, 0.052, z + 0.07, 9.0, 1, 0.26, 0, 0, 1, 4, 0.5 * Math.min(1, ll));
          if (day) K.flat.put(0, 0.358, z, 9.1, 1, 0.8, 0, 0x5a3a00, 1, 4, 0.6 * Math.min(1, ll));   // (by day: a dark edge under the tape — it must read on a sunlit lane)
          K.flat.put(0, 0.36, z, 9.06, 1, (day ? 0.62 : 0.5) + fl * 0.25, 0, hex, 1, 4, (0.95 + fl * 0.4) * ll);
          K.flat.put(0, 0.362, z, 9.06, 1, 0.13, 0, 0xffffff, 1, 4, (0.85 + fl * 0.3) * ll);
          if (!reduce) for (let g = 0; g < 3; g++) K.bill.put(((clock / 1500 + g / 3) % 1) * 9 - 4.5, 0.4, z, 0.8, 0.3, 1, 0, hex, 1, 0, 0.7 * ll);
        }
      }
      lab.m.visible = ll > 0.2;
      const wz = Z(Ln.lane + (both ? 1.42 : 0.42) - (L.mark ? 1 : 0));   // (H5A — a gateway lane carries its area's name: the line's words lie a lane lower)
      K.shadow.raw(rig.x(), 0.062, wz, 7.6, 1, 0.9, 0, 0, 1, 4, (day ? 0.4 : 0.5) * Math.min(1, ll) * fd);
      lab.m.position.set(rig.x(), 0.07, wz);   // (centred on the screen: the words ride the camera's own column — never cut by an edge)
      lab.m.material.opacity = Math.min(1, ll) * fd;
    }
    for (let j = crossed.length - 1; j >= 0; j--) {
      const q = crossed[j], u = (clock - q.t0) / 700;
      if (u >= 1) { crossed.splice(j, 1); continue; }
      if (LINES[q.k] && LINES[q.k].lane === q.lane) continue;
      if (q.lane >= base && q.lane < top) K.flat.put(0, 0.36, Z(q.lane + 0.93), 9.06, 1, 0.55 + (1 - u) * 0.25, 0, LINE_HEX[q.k], 1, 4, (1 - u) * litOf(q.lane));
    }
    if (FL) { if (capT) FL.ship(tr, capT, taken ? fx.out : -1, 1); FL.end(); }
    for (let j = fx.parts.length - 1; j >= 0; j--) {
      const q = fx.parts[j], u = (clock - q.t0) / q.life;
      if (u >= 1) { fx.parts.splice(j, 1); continue; }
      if (q.k === 'ring') { const r = q.r0 + (q.r1 - q.r0) * ease(u); K.flat.put(q.x, q.y, q.z, r * 2, 1, r * 2 * (q.sz || 0.7), 0, q.hex, 1, 3, (1 - u) * (q.al || 0.8)); }
      else { const s = (clock - q.t0) / 1000, sz = q.sz || 0.16, yy = q.y + q.vy * s - (q.g || 6.5) * s * s; K.bill.put(q.x + q.vx * s, q.g ? Math.max(0.02, yy) : yy, q.z + q.vz * s, sz, sz, 1, 0, q.hex, 1, q.sh || 0, (1 - u) * (q.al || 1)); }   // (JT1: a snow puff · a leaf — their own size, alpha, fall + shape)
    }
    if (day) {
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
      for (let j = 0; j < 9; j++) { const r = hsh(2203, j), x = wrap(j * 2.1 + T * (0.42 + r * 0.4)); K.bill.put(x, 0.24 + r * 0.3, Z(wallE + 0.35 + r * 1.3), 3.0 + r * 1.6, 0.42 + r * 0.25, 1, 0, 0xffffff, 1, 0, 0.3 + 0.16 * Math.sin(T * 0.7 + j)); }
    } else {
      K.flat.put(0, 0.07, Z(wallE + 0.5), 30, 1, 2.6, 0, 0x5a3a9a, 1, 4, 0.1);   // (a cold VIOLET breath ahead of it — never blue: blue on the ground = water; the ragged glowing lip itself is the ground shader's)
      const T = reduce ? 0 : clock / 1000;
      for (let c = -9, id = 0; c <= 9; c += 1.15, id++) {
        const r = hsh(3301, id), x = c + Math.sin(T * (0.25 + r * 0.3) + id * 2.1) * 0.7, lip = wallE + 0.1 + r * 0.75;
        K.shadow.raw(x, 0.085, Z(lip), 2.6 + r * 1.6, 1, 1.5 + r * 1.3, 0, 0, 1, 0, 0.62 + 0.3 * r);
      }
    }
    if (day) { lip.position.set(0, 2.5 + 0.9, Z(wallE - 3.1)); lip.scale.set(60, 1.8, 1); }
    curtain.position.set(0, 1.2, Z(wallE - (day ? 3.1 : 2.3) - 20)); curtain.scale.set(60, 2.6, 40);   // (by night it starts where the ground is already fully dark: its straight front is never seen)
    ground.uniforms.uWall.value = wallE;
    // J4 + JT1 — THE SEASON's frame (seasonal.js): the tree lights LAST (whatever room the glow billboards have left after every gameplay …
    if (SE) { v3.copy(kidPos).project(cam); FR.kidX = v3.x; FR.kidY = v3.y; FR.camX = rig.x(); FR.camY = camY; FR.w = w; FR.h = h; SE.end(FR); }
    ground.uniforms.uWet.value = !day && wetOn && tier === 2 && SE ? SZ.wet : 0;
    for (const q of Object.values(K)) q.done();
    for (const q of Object.values(KM)) q.done();
    ground.uniforms.uTime.value = reduce ? 0 : clock / 1000;
    renderer.info.reset();
    renderer.render(scene, cam);
    if (bloom && !day) bloom.render(scene, cam);   // (the bloom is the night's: by day the lights are paint)
    if (snapAsk) { const ask = snapAsk; snapAsk = null; try { ask(grab(snapW, snapR)); } catch { ask(null); } }
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
      if (SP) SP.rest(on);
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
    /** J4 — THE SEASON: prepSeason(s) starts THE SEASONAL PACK (in season only) · setSeason(s, { wet }) for the run starting now → what it applied */
    prepSeason, setSeason, season: () => ({ ...SZ, wet: wetOn ? SZ.wet : 0, pack: !!KM['w-pine'], sp: SP ? SP.info() : null }),
    /** JT1 — the pack's sounds (a leaf pile's crunch · the fireworks): fn(id) — the view plays them through its own sfx (the switches kept) */
    onSeasonSound(fn) { onSound = fn || null; },
    /** (the lab's look checks) the first LEAF PILE from lane `from` on this course + day: { lane, col } | null */
    seasonPile: from => (SP ? SP.pileFind(from) : null),
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
    info: () => ({ binCap: K.bill.left(), warmed, kid: !!kidGeo, inst: { flat: K.flat.mesh.count, bill: K.bill.mesh.count, shadow: K.shadow.mesh.count }, programs: renderer.info.programs ? renderer.info.programs.length : 0, calls: renderer.info.render.calls, tris: renderer.info.render.triangles, dpr, w, h, fov: cam.fov, tier, zoom: rig.zoom(), angle: rig.angle(), camX: rig.x(), yaw: rig.yaw(), bloom: !!bloom && !day, look: day ? 'day' : 'night', rest: resting, fly: FL ? FL.info() : null, shops: SH ? SH.info().models : 0, words: 'top', gate: gateInfo.on ? { ...gateInfo } : null, sky: { now: skyS.now, held: [...skyHold.keys()], fades: skyS.fades, shift: skyAt, bias: skyBiasT, off: skyLifeKey, fading: performance.now() < skyS.until }, foot: footAt, fog: [scene.fog.near, scene.fog.far] }),
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
      if (SP) SP.destroy();
      for (const L of Object.values(LBL)) { scene.remove(L.m); L.m.material.dispose(); L.tex.dispose(); L.cv.width = 0; L.cv.height = 0; }
      labelGeo.dispose(); fishGeo.dispose(); fishTex.dispose(); fish.material.dispose(); scene.remove(fish); fishCv.width = 0;
      G.cv.remove(); G.cv.width = 0; G.cv.height = 0; offLost();
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
