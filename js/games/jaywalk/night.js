// JAYWALK — THE NIGHT LOOK (H2 — docs/jaywalk.md "THE NIGHT LOOK"): the pure engine drawn in the SMOOTH STYLIZED 3D style on three.js
// 0.160 — the same interface as the graybox (graybox.js: `?gray=1` on the lab keeps it for comparison): draw(run, course, a, dt).
//   · THE GROUND: one instanced plane a lane, drawn in a shader (night-fx.js) · CARS: the Kenney models, a neon body tint per car from the
//     seed, both tail lights lit + a soft red glow on the road behind, a soft headlight glow in front (H5A — the light trails are GONE: they read as jet exhaust from above) (decals — no real point light), our own light quads
//   · LOGS built in code (H3: each its own length, half-sunk, a waterline ring; the amber only a thin underglow + a soft light on the water) · TRAINS: Kenney's front + carriages, lit windows, a headlight
//     beam, the red signals + a warning glow on the side it comes from · TREES built in code, Kenney's props, the lamps' warm pools
//   · THE AREAS (H5A — areas.js): a whole stretch looks like the place — its ground, its obstacles, its edge dressing, its signature
//     pieces in the edge columns (THE DOCK CRANE, THE LIGHTHOUSE + its sweeping beam, THE CONTROL TOWER …), THE ARRIVAL GATEWAY (a neon arch +
//     the area's name on its lane), the skyline band's tint
//   · THE BLACKOUT (the wall): the lights die lane by lane from below, a cold edge where it bites
//   · THE GHOSTS (H4 — a match): the other players' kids, SEE-THROUGH in their own colours — each one's run is their hop log through
//     the same engine (the view steps it; this file only draws it), never colliding; `ghost.tag` = where its name tag goes on screen
//   · THE LINES (H4 add-on — lines.js): YOUR BEST (gold) + THE NEXT FRIEND's (white / cyan) — a glowing line across the whole lane at
//     the far edge of that lane (a row of glowing buoys on water), its words on the ground beside it, a burst when it is crossed
//   · THE KID (H5A — Kenney's skate boy: models.js#loadKid; his cap + shirt in the player's colour; a pose a frame — idle · the jump ·
//     the fall · the splay) + THE HOP's feel + the hits, one per cause — ALL DERIVED FROM THE RUN's STATE between ticks
//     (the rules never read the frame clock; a refresh / a replay draws the same kid)
//   · THE CAMERA (H2B — camera.js, shared with the graybox): ZOOM 7 · 8 · 9 columns across, the sideways follow, the slight TURN; the
//     dimmer edge column each side stays the cue for the play area's edge. View only: the rules stay 9 columns.
//   · THE DAY LOOK (H5B — docs/jaywalk.md "THE DAY LOOK"): setLook('day' | 'night') — the SAME scene in sunlight: a warm sun + a clear
//     sky's light, the ground shader's day colours (night-fx.js `uDay`), the lights that only GLOW at night switched off (LF / LB) and
//     the ones that must READ kept as PAINT (the glow kinds alpha-blended: the rail signals, the runway lights, the lines, the kid's
//     ring), sun shadows (the blob shadows thrown to one side), the painted gateway, THE FOG BANK where the blackout is, the day
//     skyline + THE LANDMARKS IN THE SKYLINE (skymarks.js). View only: nothing the rules read.
// Everything that repeats is INSTANCED; a window of lanes round the kid is alive (re-laid every frame — a few hundred matrices); no
// post-processing below the top tier (THE HALF-RES BLOOM: tier 2 only). setTier(2 | 1 | 0): the match kit's tiers (games/kit/tiers.js).
import * as THREE from 'three';
import { FP, COLS, HOP_TICKS } from './tuning.js';
import { moverLeft, pulseAt, pulseLeft, logUnder, ufoX, ufoY, mod, area, gateName } from './course.js';
import { loadKenney, loadKid, KID, SCENE_MODELS, buildTree, buildTuft, buildLog, LOG, buildTruck, TRUCK, buildBarricade, buildDart } from './models.js';
import { FOG_HEX, DAY_FOG_HEX, KIND, rgb, createGround, glowMaterial, paintMaterial, neonEnv, dayEnv, createBloom } from './night-fx.js';
import { createSkyMark } from './skymarks.js';
import { CAM, createCamera } from './camera.js';
import { ctx2d } from '../../ui/canvas-safe.js';
import { LINE_HEX } from './lines.js';
import { drawNum, numWidth } from './numerals.js';
import { LOOKS, PIECE, buildAreaGeo, dressLane, sigOf, drawBig, drawSig, drawFishSign } from './areas.js';
import { hsh, strSeed, vehicleAt } from './causes.js';   // (THE ONE SOURCE OF TRUTH for which vehicle a car IS — the end screen's cause line reads the same function)

const BACK = 9, AHEAD = 27, POOL = BACK + AHEAD;   // (the most lanes alive: 36 — a closer zoom lays fewer ahead)
const NEON = [0xff3fb4, 0x22e0ff, 0xa05bff, 0xff5a7a, 0x4d7dff];   // (a car's body tint: pink · cyan · violet · coral · blue)
const TAXI_HEX = 0xffc81a;   // (H4 — THE TAXI: cab yellow, never a neon tint)
const DPR_AT = [1.5, 2, 3];
// THE LAMPS (H2B add-on — CAR LIGHTS): where each vehicle's two headlights / two tail lights sit — [half their spacing across the lane,
// their height] on the model as the scene draws it. BOTH cast: a SHORT SOFT beam ahead (gone within HEAD_REACH cells) + a small red glow
// behind (within TAIL_REACH) — a glow on the road, never a spotlight. All instanced quads: no real light.
const LAMPS = Object.freeze({ 'car-sedan': [0.225, 0.2], 'car-hatchback': [0.225, 0.2], 'car-taxi': [0.225, 0.2], 'car-van': [0.26, 0.24], truck: [0.25, 0.3], train: [0.2, 0.45] });
const HEAD_REACH = 1.35, TAIL_REACH = 0.75;
const LOG_FEET = 0.33;   // (H3 — where the kid's feet stand on a log: its round back, the log HALF-SUNK — its centre a hair under the waterline)
const KID_S = 1.62;   // (THE KID's size on the lane — H5A, Kenney's skate boy, 0.78 tall: ≈ 1.26 of a lane tall — he must read at real phone size; the rules' box stays 0.6 of a cell)
/** his poses (models.js#loadKid — a row of the pose texture a frame): the idle loop (ms), how fast the fall flails */
const IDLE_MS = 1333, FALL_MS = 333;
const KID_YAW = Math.PI;   // (Kenney's kid faces +z, as his cars do; the scene's "up the course" is −z)
// the skyline's night life, in % of the band's picture (assets/jaywalk/skyline-night.webp): [x, y, delay s] the red aviation lights ·
// [x, y, w, h, delay s] the neon blocks that flicker
const SKY_LIGHTS = [[31.7, 31.8, 0], [66.3, 36.4, 0.9], [67.9, 36.4, 0.9], [62.6, 45.6, 1.7], [64.2, 45.6, 1.7], [88.7, 34.2, 0.4], [93.8, 44.6, 1.3], [10.9, 37, 2.1]];
const SKY_NEON = [[24, 52.6, 2.5, 5.8, 0], [33.6, 47.4, 1.8, 8.4, 2.2], [80.2, 56.4, 2.6, 3.4, 3.7], [8.5, 57.6, 2.3, 3, 1.1], [75.3, 52.8, 1.8, 4.6, 4.4]];
const X = c => c - COLS / 2, Z = l => -l;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const NOP = () => {};
const RING8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]];
/** the two bands' pictures (only the look on screen is ever fetched) */
const SKY_URL = { night: new URL('../../../assets/jaywalk/skyline-night.webp', import.meta.url).href, day: new URL('../../../assets/jaywalk/skyline-day.webp', import.meta.url).href };
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
  // the light: a dim cool night, a soft key from the front-left, A RIM LIGHT from behind (pink) — the smooth finish
  const hemi = new THREE.HemisphereLight(0x8fa0ff, 0x1a1030, 1.5); scene.add(hemi);
  const key = new THREE.DirectionalLight(0xdfe4ff, 1.55); key.position.set(-5, 12, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff6ad0, 1.25); rim.position.set(6, 5, -10); scene.add(rim);
  let env = null, envDay = null;
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
      put(x, y, z, sx, sy, sz, ry, hex, k = 1, a0 = 1, a1 = 1, rx = 0, rz = 0, a2 = 0, a3 = 0) {
        if (i >= n) return;
        P.set(x, y, z); S.set(sx, sy, sz);
        if (rx || rz) Q.setFromEuler(E.set(rx, ry, rz, 'YXZ')); else if (ry) Q.setFromAxisAngle(UP, ry); else Q.identity();
        M.compose(P, Q, S); m.setMatrixAt(i, M);
        if (raw) { col[i * 3] = ((hex >> 16) & 255) / 255 * k; col[i * 3 + 1] = ((hex >> 8) & 255) / 255 * k; col[i * 3 + 2] = (hex & 255) / 255 * k; }
        else { C.setHex(hex); col[i * 3] = C.r * k; col[i * 3 + 1] = C.g * k; col[i * 3 + 2] = C.b * k; }
        if (ax) { const q = i * aux[1]; ax.array[q] = a0; if (aux[1] > 1) ax.array[q + 1] = a1; if (aux[1] > 2) { ax.array[q + 2] = a2; ax.array[q + 3] = a3; } }
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
  const GEO = { tree: buildTree(), tuft: buildTuft(), log1: buildLog(1), log2: buildLog(2), log3: buildLog(3), log4: buildLog(4), truck: buildTruck(), barricade: buildBarricade(), dart: buildDart() };
  const K = {
    shadow: kind(flatGeo, glowMaterial(fogV, { shadow: true }), 160, { aux: ['aFx', 2], raw: true, order: 1 }),
    flat: kind(flatGeo, glowMaterial(fogV), 720, { aux: ['aFx', 2], raw: true, order: 2, bloom: true }),          // pools · trails · beams · rings · edge lines
    bill: kind(billGeo, glowMaterial(fogV, { bill: true }), 600, { aux: ['aFx', 2], raw: true, order: 3, bloom: true }),   // lamps · light quads · sparks
    trees: kind(GEO.tree, lambert(), 150),
    tufts: kind(GEO.tuft, lambert(), 220),
    // THE LOGS (H3): one geometry a length (1 · 2 · 3 · 4 cells — nothing stretched, all the SAME thickness); rough wood — the bark must be SEEN, never a glow
    ...Object.fromEntries([1, 2, 3, 4].map(n => [`log${n}`, kind(GEO[`log${n}`], new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0, envMapIntensity: 0.25 }), 60)])),
    trucks: kind(GEO.truck, paintMaterial(glossy(0.3, 1), { instanced: true }), 24, { aux: ['aLit', 1] }),
    barricades: kind(GEO.barricade, lambert(), 40),
    posts: kind(unit, new THREE.MeshLambertMaterial({ color: 0xffffff }), 280),
    jets: kind(GEO.dart, lambert(), 8),
  };
  // THE SUN's SHADOWS (H5B — the day look): the same blob shadows, thrown a little to one side + up the lanes (the sun is high on the
  // front-left), a touch softer. `raw` = straight under the thing (the kid's shadow-ring, the dark strip under a line's words)
  let day = false;
  { const put0 = K.shadow.put; K.shadow.raw = put0; K.shadow.put = (x, y, z, sx, sy, sz, ry, hex, k, a0, a1, ...r) => (day ? put0(x + 0.17 * Math.min(1.5, sz), y, z - 0.09, sx * 1.05, sy, sz * 1.05, ry, hex, k, a0, (a1 == null ? 1 : a1) * 0.82, ...r) : put0(x, y, z, sx, sy, sz, ry, hex, k, a0, a1, ...r)); }
  // THE AREAS' PIECES (areas.js — built in code): the obstacles + the edge dressing + the plots' big pieces, one kind each
  const AGEO = buildAreaGeo(), AK = {};
  for (const [name, g] of Object.entries(AGEO)) AK[name] = K[`a_${name}`] = kind(g, lambert(), { bollard: 60, crate: 90, icecrate: 60, drum: 70, rock: 90, hydrant: 40, container: 60, stall: 30, rail: 60, house: 24 }[name] || 6);
  // Kenney's (CC0): they arrive a moment after the first frame — until then (or if a file fails) that kind simply draws nothing
  const KM = {}, BOX = {};
  let dead = false, needWarm = true, warmed = 0;
  let kidGeo = null, kidMat = null, POSE = null;
  const ready = Promise.all([loadKenney(SCENE_MODELS), loadKid()]).then(([geos, kg]) => {
    if (dead) { for (const g of Object.values(geos)) g.dispose(); if (kg) { kg.userData.poses.tex.dispose(); kg.dispose(); } return false; }
    if (kg) {
      // THE KID (H5A): ONE skinned geometry, instanced — himself (opaque, his own rim light) + THE GHOSTS (see-through, their colours):
      // two draw calls for every kid in the match; each instance carries its own poses (night-fx.js#paintMaterial `skin`)
      kidGeo = kg; POSE = kg.userData.poses.clips;
      kidMat = paintMaterial(glossy(0.42, 0.7), { instanced: true, rim: true, skin: kg.userData.poses.tex });
      KM.kid = kind(kg, kidMat, 1, { aux: ['aKid', 4] });
      const gm = paintMaterial(glossy(0.5, 0.35), { instanced: true, skin: kg.userData.poses.tex }); gm.transparent = true; gm.opacity = 0.46;
      KM.ghosts = kind(kg, gm, 8, { aux: ['aKid', 4], order: 4 });
    }
    for (const [name, g] of Object.entries(geos)) {
      const b = g.boundingBox; BOX[name] = { w: b.max.x - b.min.x, h: b.max.y, l: b.max.z - b.min.z, cz: (b.max.z + b.min.z) / 2, x0: b.min.x, z0: b.min.z, z1: b.max.z };
      if (name.startsWith('car-')) KM[name] = kind(g, paintMaterial(glossy(0.28, 1.1), { instanced: true }), 40, { aux: ['aLit', 1] });
      else if (name.startsWith('train-')) KM[name] = kind(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0, envMapIntensity: 0.9 }), 40);
      else KM[name] = kind(g, lambert(), name === 'lighthouse' ? 2 : name === 'fishing-boat' ? 6 : 70);
    }
    needWarm = true;   // (H4B — the new kinds' programs + buffers are made in the NEXT frame, not when a car first drives in)
    return true;
  }).catch(() => false);

  // THE KID's place this frame (the camera's checks, a line's burst) — set by draw()
  const kidPos = new THREE.Vector3();
  // THE LINES' WORDS (H4 add-on): "YOUR BEST · 143" / "LIAM · 212" written on the ground — one small canvas a line, drawn when its text
  // changes (never per frame), lying flat beside its line; additive: it glows on any ground
  const labelGeo = new THREE.PlaneGeometry(7.6, 0.95).rotateX(-Math.PI / 2);   // (BIG: the letters ≈ 0.55 of a lane tall — ≈ 27 pt at the kid's row at ZOOM 8 on a 390 pt phone)
  const LBL = {};
  for (const k of ['best', 'friend']) {
    const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 128;
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(labelGeo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    m.renderOrder = 2; m.visible = false; m.frustumCulled = false; m.layers.enable(1); scene.add(m);
    LBL[k] = { m, cv, tex, text: null };
  }
  const css = hex => `#${hex.toString(16).padStart(6, '0')}`;
  // THE ARRIVAL GATEWAY's NAME (H5A): the area's name written BIG on its gateway lane (two planes: this gateway + the next one in
  // view), in the area's own neon — drawn when its text changes, never per frame. THE NEON FISH: the fish market's sign (one plane)
  const gateGeo = new THREE.PlaneGeometry(7.3, 0.74).rotateX(-Math.PI / 2);   // (7.3 cells: the whole name is on screen at ZOOM 8 — the letters ≈ half a lane tall)
  const fishGeo = new THREE.PlaneGeometry(2.4, 1.2);
  const GATE = [0, 1].map(() => {
    const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 104;
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(gateGeo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    m.renderOrder = 2; m.visible = false; m.frustumCulled = false; m.layers.enable(1); scene.add(m);
    return { m, cv, tex, text: null };
  });
  function writeGate(G, text, hex) {
    if (G.text === text) return;
    G.text = text;
    const c = ctx2d(G.cv);
    if (!c) return;
    c.clearRect(0, 0, 1024, 104);
    c.font = '900 84px "Orbitron", "Chakra Petch", system-ui, sans-serif'; c.textBaseline = 'middle'; c.textAlign = 'center';
    try { c.letterSpacing = '8px'; } catch { /* an old browser: no tracking */ }
    const tw = c.measureText(text).width, sx = Math.min(1, 980 / Math.max(1, tw));
    c.save(); c.translate(512, 56); c.scale(sx, 1);
    if (day) {   // (BY DAY: white paint, a dark edge — on the painted band the scene lays under it)
      c.lineJoin = 'round'; c.lineWidth = 12; c.strokeStyle = 'rgba(10, 20, 44, 0.9)'; c.strokeText(text, 0, 0); c.fillStyle = '#ffffff'; c.fillText(text, 0, 0);
    } else {
      c.shadowColor = css(hex); c.shadowBlur = 20; c.fillStyle = css(hex); c.fillText(text, 0, 0);
      c.shadowBlur = 0; c.globalAlpha = 0.62; c.fillStyle = '#ffffff'; c.fillText(text, 0, 0);
    }
    c.restore();
    G.tex.needsUpdate = true;
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
    // (H5A's add-on — THE BIG NUMERALS: numerals.js — "YOUR BEST · 172": room between the digits, a 1 with a base foot)
    const FAM = '"Orbitron", "Chakra Petch", system-ui, sans-serif';
    c.font = `900 104px ${FAM}`; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
    const w = numWidth(c, text, 104, FAM, 900), sx = Math.min(1, 984 / Math.max(1, w)), x = k === 'best' ? 20 : 1004;
    c.save(); c.translate(x, 106); c.scale(sx, 1);
    const x0 = k === 'best' ? 0 : -w;
    if (day) {   // (BY DAY: the line's colour as paint, a dark edge all round — it reads on a sunlit lane)
      c.fillStyle = '#0c1022'; for (const [dx, dy] of RING8) drawNum(c, text, x0 + dx * 6, dy * 6, 104, FAM, 900);
      c.fillStyle = css(LINE_HEX[k]); drawNum(c, text, x0, 0, 104, FAM, 900);
      c.globalAlpha = 0.3; c.fillStyle = '#ffffff'; drawNum(c, text, x0, 0, 104, FAM, 900);
    } else {
      c.shadowColor = css(LINE_HEX[k]); c.shadowBlur = 22; c.fillStyle = css(LINE_HEX[k]); drawNum(c, text, x0, 0, 104, FAM, 900);
      c.shadowBlur = 0; c.globalAlpha = 0.5; c.fillStyle = '#ffffff'; drawNum(c, text, x0, 0, 104, FAM, 900);
    }
    c.restore();
    L.tex.needsUpdate = true;
  }
  const LINES = { best: null, friend: null }, crossed = [];   // (crossed: a line's burst — { k, lane, t0 })
  // HE ALWAYS STANDS OUT (H2B): his colour → THE CAP + the shirt (H5A), a rim light of his own (his colour pulled toward white), the glow ring under him
  const rimCol = new THREE.Color();
  let kidHex = 0xff3fb4;
  const tintOf = hex => { kidHex = C.set(hex).getHex(); rimCol.set(hex).lerp(C.set(0xffffff), 0.5); };
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
  for (const [x, y, d] of SKY_LIGHTS) { const i = document.createElement('i'); i.className = 'jw-sky-l'; i.style.cssText = `left:${x}%;top:${y}%;animation-delay:${-d}s`; skyImg.append(i); }
  for (const [x, y, bw, bh, d] of SKY_NEON) { const i = document.createElement('i'); i.className = 'jw-sky-n'; i.style.cssText = `left:${x}%;top:${y}%;width:${bw}%;height:${bh}%;animation-delay:${-d}s`; skyImg.append(i); }
  const skyTint = document.createElement('i'); skyTint.className = 'jw-sky-tint';   // (H5A — the band takes a wash of the area's colour: opacity only)
  sky.append(skyImg, skyTint); host.append(sky);
  const skyMark = createSkyMark(sky);   // (H5B — THE LANDMARKS IN THE SKYLINE: the area's landmark, drawn when the kid crosses a gateway)
  let skyAt = 9, skyArea = -2;

  /**
   * THE LOOK (H5B): 'night' = neon · 'day' = a sunny harbor. ONE scene, switched at once (the game's views re-read the console's
   * `body[data-look]` — per phone, live; the lab has its own switch). A VIEW: the rules, the course, the replay never see it.
   */
  let lookSet = false;
  function setLook(l) {
    const d = l === 'day';
    if (lookSet && d === day) return;
    lookSet = true; day = d;
    const fogHex = day ? DAY_FOG_HEX : FOG_HEX;
    scene.background.setHex(fogHex); scene.fog.color.setHex(fogHex);
    ground.uniforms.uFogCol.value.set(...rgb(fogHex)); ground.uniforms.uDay.value = day ? 1 : 0;
    // the light: a warm SUN high on the front-left + a clear sky's fill (the pink rim is the night's) — the day's own sky in the gloss
    hemi.color.setHex(day ? 0xe6f3ff : 0x8fa0ff); hemi.groundColor.setHex(day ? 0xb5a688 : 0x1a1030); hemi.intensity = day ? 2.25 : 1.5;
    key.color.setHex(day ? 0xfff0d4 : 0xdfe4ff); key.intensity = day ? 2.4 : 1.55; key.position.set(day ? -7 : -5, day ? 13 : 12, day ? 6 : 9);
    rim.color.setHex(day ? 0xffffff : 0xff6ad0); rim.intensity = day ? 0.3 : 1.25;
    if (day && !envDay) { try { envDay = dayEnv(renderer); } catch { envDay = null; } }
    scene.environment = day ? envDay || env : env;
    // the lights that stay become PAINT (alpha-blended in their own colour — night-fx.js GLOW_F); the words on the ground too
    for (const q of [K.flat, K.bill]) { const m = q.mesh.material; m.blending = day ? THREE.NormalBlending : THREE.AdditiveBlending; m.uniforms.uDay.value = day ? 1 : 0; m.needsUpdate = true; }
    for (const m of [...Object.values(LBL).map(L => L.m), ...GATE.map(G => G.m), fish]) { m.material.blending = day ? THREE.NormalBlending : THREE.AdditiveBlending; m.material.needsUpdate = true; }
    for (const k of ['best', 'friend']) { const t = LBL[k].text; LBL[k].text = null; if (t != null) writeLabel(k, t); }
    for (const G of GATE) G.text = null;
    { const c = ctx2d(fishCv); if (c) { drawFishSign(c, 256, 128, day); fishTex.needsUpdate = true; } }
    // THE BLACKOUT's curtain = THE FOG BANK's body by day
    curtain.material.color.setHex(day ? 0xd6dee6 : 0x000000); curtain.material.opacity = day ? 0.97 : 0.93;
    sky.dataset.look = day ? 'day' : 'night'; skyImg.style.backgroundImage = `url("${SKY_URL[day ? 'day' : 'night']}")`;
    skyArea = -2; needWarm = true;
  }
  setLook(o.look === 'day' ? 'day' : 'night');

  let bloom = null, tier = 2, w = 0, h = 0, dpr = devDpr, kAt = 0, reveal = 1, revealT = 1;   // (reveal — H3: 0 = only the start's few lanes out of the dark · 1 = the whole view)
  /** the rig's scale moved (a ZOOM change easing in): the far plane + the fog follow it */
  function depth() {
    const k = rig.k(), key = k + reveal * 7;
    if (key === kAt) return;
    kAt = key; cam.far = 90 * k; cam.updateProjectionMatrix();
    const n = (22 + 4 * reveal) * k, f = (24.5 + 10.5 * reveal) * k;   // (the fog's near / far — the kid stands ≈ 20 k from the lens: the start shows ≈ 3–5 lanes ahead of him, the rest in the dark)
    scene.fog.near = n; scene.fog.far = f; fogV.set(n, f);
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
    d = { obs: [], tufts: [], lamp: 0, lampHex: 0xffc27a };
    const T = L.type === 'grass' ? LOOKS[area(i).index] : null;
    if (T) {
      // (H5A — AN AREA's ground lane: its own obstacles, its edge dressing, its lamps — areas.js; grass tufts only where grass grows)
      dressLane(d, T, i, L, (a, b) => hsh(vseed ^ (i * (131 + b * 46)), a));
      if (T.tufts) { const n = 2 + Math.floor(hsh(vseed ^ i, 9) * 3); for (let t = 0; t < n; t++) { const x = hsh(vseed ^ (i * 53), t * 7 + 1) * 12 - 1.5, c = Math.floor(x); if (c < 0 || c >= COLS || !L.obs[c]) d.tufts.push([x, 0.12 + hsh(vseed ^ (i * 59), t) * 0.76, 0.8 + hsh(vseed ^ i, t + 40) * 0.6]); } }
    } else if (L.type === 'grass') {
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
  // THE SIGNATURE PIECES (H5A — areas.js#sigOf: an area's big pieces, in the edge columns), per stretch → by their lane
  const plots = new Map();
  function sigAt(i) {
    const s = Math.floor(i / 50);
    let m = plots.get(s);
    if (!m) { m = new Map(); for (const P of sigOf(courseRef, s, (a, b) => hsh(vseed ^ (a * 7919), b))) { const l = m.get(P.y0) || []; l.push(P); m.set(P.y0, l); } plots.set(s, m); if (plots.size > 6) plots.delete(plots.keys().next().value); }
    return m.get(i) || null;
  }

  // ---- the kid's feel + the hits: derived from the run between frames (never from the rules' clock)
  const fx = { t: -1, st: 'idle', hits: 0, y: 0, yaw: Math.PI, landAt: -1e9, landOn: '', hit: null, parts: [], wob: null, shake: 0, seen: false, out: 0, endT: -1, after: 0 };
  let clock = 0, kidH = 0;
  const part = (kindOf, x, y, z, life, a = {}) => { if (fx.parts.length < 60) fx.parts.push({ k: kindOf, x, y, z, t0: clock, life, ...a }); };
  function splash(x, z, hex = 0x9fe8ff) {
    part('ring', x, 0.06, z, 520, { hex, r0: 0.25, r1: 1.25 });
    part('ring', x, 0.06, z, 760, { hex, r0: 0.1, r1: 0.9 });
    if (!reduce) for (let j = 0; j < 9; j++) { const a = j / 9 * Math.PI * 2; part('drop', x, 0.1, z, 520, { hex: 0xd8f6ff, vx: Math.cos(a) * (0.9 + (j % 3) * 0.35), vz: Math.sin(a) * 0.7, vy: 3.2 + (j % 4) * 0.5 }); }
  }

  /**
   * H4B — THE START: everything the GPU needs is made BEFORE the first hop frame (the 3 · 2 · 1 / a solo run's wait for GO) — never when
   * a train, a truck or THE UFO first comes into view. A phone builds a program's real pipeline + uploads a mesh's buffers at its FIRST
   * DRAW WITH SOMETHING IN IT — and every kind here starts with 0 instances. So: every kind gets ONE instance far under the ground, the
   * UFO's discs + the lines' words stand there too, the programs are compiled (renderer.compile) and ONE frame is rendered — the bloom's
   * pass included — then all of it is put back. Run at the top of a normal frame (the real picture is drawn right over it: never seen):
   * the first frame, and again in the frame after Kenney's models land.
   */
  function warm() {
    const put = [];
    for (const q of [...Object.values(K), ...Object.values(KM)]) { q.reset(); q.put(0, -60, 0, 0.01, 0.01, 0.01, 0, 0xffffff, 1); q.done(); }
    for (const m of [...ufos.map(q => q.d), ...Object.values(LBL).map(L => L.m), ...GATE.map(G => G.m), fish]) { put.push([m, m.visible, m.position.y]); m.visible = true; m.position.y = -60; }
    try { renderer.compile(scene, cam); renderer.render(scene, cam); if (bloom) bloom.render(scene, cam); } catch { /* a phone that can't: the kinds simply build as they come, as before */ }
    for (const [m, v, y] of put) { m.visible = v; m.position.y = y; }
    for (const q of [...Object.values(K), ...Object.values(KM)]) { q.reset(); q.done(); }
    warmed++;
  }

  /** one frame: the run after its last tick, `a` (0 … 1) into the next one, `dt` ms since the last frame. `o.ghosts` (H4 — a match):
   *  [{ run, hex, out? }] — the other players' runs; each gets `tag` = [x, y] on the screen (CSS px) or null (off screen / gone).
   *  H4B — `o.t` = THE WORLD's TICK (+ its fraction): every car, log, train + light is drawn at it, whatever run the camera follows — the
   *  ghosts are the engine's state at that same tick (ghosts.js). `o.a` = the ghosts' own fraction; `g.vis` / `o.off` = a late hop's
   *  CATCH-UP ({ x, y: cells still to close, u: 0 … 1, d }) — the kid is drawn that far back, in the air: a quick hop, never a teleport;
   *  `g.held` = standing still, unconfirmed (no ride, no bob). */
  function draw(run, course, a, dt, o = null) {
    clock += dt;
    // (H5B — THE LOOK this frame: LF / LB = a light that only GLOWS (a pool, a beam, a halo) — nothing by day; EK = the edge columns'
    //  dim; fogK = what the wall does to a lane's things: the blackout darkens them, THE FOG BANK whitens them out)
    const LF = day ? NOP : K.flat.put, LB = day ? NOP : K.bill.put, EK = day ? 0.8 : 0.5, fogK = day ? 2.4 : -0.96;
    if (needWarm && w && h) { needWarm = false; warm(); }
    if (reveal !== revealT) { reveal = reduce ? revealT : reveal + (revealT - reveal) * Math.min(1, dt / 130); if (Math.abs(revealT - reveal) < 0.004) reveal = revealT; }
    if (course !== courseRef) { courseRef = course; vseed = strSeed(course.seed); decor.clear(); plots.clear(); }
    // (H4: THE WORLD GOES ON after a hit — the run's own tick stops at the hit, the cars + logs drive on: the car rolls OFF the flat kid)
    if (run.st === 'out') { if (fx.endT !== run.end) { fx.endT = run.end; fx.after = 0; } fx.after += dt * 0.06; } else { fx.endT = -1; fx.after = 0; }
    const t = o && o.t != null ? o.t : run.t + a + fx.after, lane = course.lane(run.y);
    if (run.t < fx.t || (run.t === 0 && fx.t !== 0)) { fx.hits = 0; fx.hit = null; fx.parts.length = 0; fx.yaw = Math.PI; fx.landAt = -1e9; fx.wob = null; fx.seen = false; fx.st = 'idle'; fx.out = 0; }
    // ---- the kid between ticks
    let kx = run.x / FP, ky = run.y + 0.5, lift = 0, f = 0, hopDir = '';
    if (run.st === 'hop') {
      f = Math.min(1, (run.k + a) / HOP_TICKS);
      kx = (run.fx + (run.tx - run.fx) * f) / FP; ky = run.fy + 0.5 + (run.ty - run.fy) * f; lift = Math.sin(Math.PI * f) * 0.52;
      hopDir = run.ty > run.fy ? 'u' : run.ty < run.fy ? 'd' : run.tx < run.fx ? 'l' : 'r';
    } else if (run.st === 'idle' && lane.type === 'water') kx += lane.dir * lane.v * a / FP;
    // (H4B — a WATCHED ghost's late hop: drawn back where it was, closing in a quick hop)
    const co = o && o.off && run.st !== 'out' && run.st !== 'taken' ? o.off : null;
    if (co) { kx += co.x; ky += co.y; lift = lift * co.u + Math.sin(Math.PI * co.u) * 0.5 * Math.min(1, co.d); }
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
    if (run.st !== 'out') { if (fx.hit && run.st !== 'taken') fx.hit = null; }
    fx.t = run.t; fx.st = run.st; fx.hits = run.hits; fx.fy = run.fy; fx.fx = run.fx;
    if (run.t > 0 || run.st === 'hop') fx.seen = true;

    // where his feet are: the ground, or a log's back (it bobs)
    const bobOf = (i, j) => (reduce ? 0 : Math.sin(clock / 520 + i * 1.7 + j * 2.3) * 0.028);
    let feet = 0;
    if (run.st !== 'hop' && lane.type === 'water') { const j = logUnder(lane, run.t, run.x); feet = j >= 0 ? LOG_FEET + bobOf(lane.i, j) : 0; }
    else if (run.st === 'hop') { const A = course.lane(run.fy), B = course.lane(run.ty); feet = (A.type === 'water' ? LOG_FEET : 0) * (1 - f) + (B.type === 'water' ? LOG_FEET : 0) * f; }
    // THE HOP: a squash at the push, a stretch in the air, a squash on landing, a small turn the way he hops; an idle bob between
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
    // HIS POSE (H5A — Kenney's clips, a row a frame): the idle loop; a hop = Kenney's JUMP timed to the hop (HOP_TICKS — in on the push, out
    // on the landing); a hit = the fall (flailing) or THE SPLAY (the flattened kid)
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
        // THE FLATTENED KID (H4 — the owner: a funny cartoon flat kid, never a smear; H5A — the new kid, HIS CAP ON TOP): squashed
        // STRAIGHT DOWN under his cap like a cartoon — a tenth as tall, half as wide again — in THE SPLAY: from above his cap sits on
        // top of a flat kid, his arms out left + right, his sneakers kicked out behind him; a quick squash + one small bounce
        const sq = clamp01(e / 90), bounce = reduce ? 0 : Math.exp(-e / 160) * Math.sin(e / 38) * 0.1 * sq;
        flat = { thin: 1 - 0.86 * sq + bounce, wide: 1 + 0.5 * sq - bounce * 0.6 };   // (a PANCAKE: half as wide again, a seventh as thick)
        if (POSE) { poseB = POSE.splay[0]; poseK = sq; }
        fx.yaw += (0 - fx.yaw) * sq; ry = fx.yaw; s3 = [flat.wide, flat.thin, flat.wide];   // (his head up the screen: the sneakers kick out toward the camera)
      } else if (H.cause === 'water' || H.cause === 'edge') {    // (the edge: carried off on the log a moment more, then the splash) + the sink
        const carry = H.cause === 'edge' ? clamp01(e / 260) : 1, sink = clamp01((e - (H.cause === 'edge' ? 260 : 0)) / 380);
        if (H.cause === 'edge') { px += H.dir * 0.9 * carry; if (!H.wet && carry >= 1) { H.wet = 1; splash(px, pz); } py = LOG_FEET * (1 - sink); }
        py -= sink * 1.05; s3 = [1 - sink * 0.3, 1, 1 - sink * 0.3]; rz = sink * 0.5; fallPose(e);
        if (sink >= 1) show = false;
      } else if (H.cause === 'train' || H.cause === 'blackbird') {   // knocked away, spinning
        const v = clamp01(e / 700);
        px += H.dir * v * 9; py = 0.2 + 2.4 * Math.sin(v * Math.PI * 0.85); rz = -H.dir * e * 0.016; ry = fx.yaw + e * 0.01; fallPose(e);
        if (v >= 1) show = false;
      } else if (H.cause === 'wall') {                           // swallowed by the dark
        const v = clamp01(e / 420); lit = day ? 1 + v * 2.4 : 1 - v; py = -v * 0.5; s3 = [1 - v * 0.35, 1 - v * 0.6, 1 - v * 0.35];
        if (v >= 1) show = false;
      } else {                                                   // (the UFO: a placeholder until H6 — beamed up)
        const v = clamp01(e / 650); py = v * 6; ry = fx.yaw + e * 0.012; s3 = [1 - v * 0.6, 1 - v * 0.6, 1 - v * 0.6]; fallPose(e);
        if (v >= 1) show = false;
      }
    } else if (run.st === 'taken') { fx.out += dt; py = Math.min(16, fx.out * 0.007); ry = fx.yaw + fx.out * 0.008; taken = Math.min(1, fx.out / 300); fallPose(fx.out); }   // (THE MOTHERSHIP — a PLACEHOLDER until H6: its green beam takes the kid up)
    // the blackout on him
    const wallE = run.wall / FP, darkOf = i => clamp01(wallE - i), litOf = i => 1 + fogK * darkOf(i);
    lit *= litOf(Math.floor(ky));
    // (the kid himself is laid with the lanes' kinds — below, once they are reset: ONE instance of the skinned kind)
    kidPos.set(px, flat ? 0.02 : py, pz);
    const kidDraw = show ? [px, flat ? 0.02 : py, pz, s3[0] * KID_S, s3[1] * KID_S, s3[2] * KID_S, ry + KID_YAW, kidHex, 1, lit, poseA, rx, rz, poseB, poseK] : null;
    if (kidMat) kidMat.userData.u.uRim.value.copy(rimCol).multiplyScalar((day ? 0.16 : 0.5) * Math.min(1, lit));
    kidH = KID.h * s3[1] * KID_S;

    // ---- THE CAMERA (camera.js): a smooth follow that leads a hop to where it lands — up the lanes AND sideways (clamped at the play
    // area's edges; a log ride is followed) — the slight turn, a short shake on a hit (never with reduce motion)
    const down = run.st === 'out';
    rig.follow(run.st === 'hop' ? run.tx / FP : down && H ? H.x : kx, run.st === 'hop' ? run.ty + 0.5 : down ? (H ? H.y : ky) : ky, dt);
    depth();
    const camY = rig.y();
    let shx = 0, shy = 0;
    if (clock < fx.shake) { const q = (fx.shake - clock) / 240; shx = Math.sin(clock * 0.09) * 0.16 * q; shy = Math.cos(clock * 0.113) * 0.12 * q; }
    rig.apply(cam, shx, shy, heroCam ? [px, pz] : null);
    // the skyline slides against the follow (a far thing barely moves) + sits a step over in the turned view
    const sl = Math.round((rig.x() * 2.2 - rig.yaw() * 28) * 20) / 20;
    if (sl !== skyAt) { skyAt = sl; skyImg.style.transform = `translate3d(${(-50 - sl).toFixed(2)}%,0,0)`; }

    // ---- the lanes
    for (const q of Object.values(K)) q.reset();
    for (const q of Object.values(KM)) q.reset();
    if (kidDraw && KM.kid) KM.kid.put(...kidDraw);
    const kindOf = L => (L.mark ? KIND.mark : KIND[L.type]);
    let beam = null, sign = null, gates = 0;
    for (const G of GATE) G.m.visible = false;
    const base = Math.floor(camY) - BACK, top = base + BACK + Math.min(AHEAD, Math.ceil(24 * rig.k()) + 2);
    let nu = 0, gi = 0;
    for (let i = base; i < top; i++) {
      const L = course.lane(i), z = Z(i + 0.5), dk = darkOf(i), lt = 1 + fogK * dk, on = day ? dk < 0.6 : lt > 0.3;
      let fxv = 0;
      if (L.type === 'grass') {
        const D = decorOf(i, L), SG = sigAt(i), sgL = !!SG && SG.some(P => P.side < 0 && P.what !== 'pylons'), sgR = !!SG && SG.some(P => P.side > 0 && P.what !== 'pylons');
        for (const q of D.obs) {
          if (q.edge && (q.c < 0 ? sgL : sgR)) continue;   // (a signature piece stands on this side of the lane)
          const x = X(q.c + 0.5) + q.dx, zz = z + q.dz, dim = lt * (q.c < 0 || q.c >= COLS ? EK : 1);
          if (q.big) drawBig(q, X(q.c + 0.5), z, { K, A: AK, lt, on: on && !day, day, ek: EK });
          else if (AK[q.k]) { const [ps, sh] = PIECE[q.k]; AK[q.k].put(x, 0, zz, ps, ps, ps, q.ry, 0xffffff, dim * 1.25); K.shadow.put(x, 0.03, zz + 0.06, sh[0], 1, sh[1], 0, 0, 1, 0, 0.45 * lt); }
          else if (q.k === 'tree' || (q.k !== 'barricade' && !KM[q.k])) { const s = 0.72 + q.s * 0.3; K.trees.put(x, 0, zz, s, s, s, q.ry * 3, 0xffffff, dim); K.shadow.put(x, 0.03, zz + 0.1, 1.15 * s, 1, 1.0 * s, 0, 0, 1, 0, 0.5 * lt); }
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
        for (let j = 0; j < L.items.length; j++) {
          const it = L.items[j], len = it.len / FP, l0 = moverLeft(L, it, t) / FP;
          // (the lane is one lap long: the view shows a mover's next lap too, so nothing pops in or out at the screen's side — the copies
          //  are always outside the 9 played columns)
          for (let lap = -1; lap <= 1; lap++) {
            const left = l0 + lap * per;
            if (left > COLS + 9 || left + len < -9) continue;
            const cx = X(left + len / 2), inside = left + len > 0 && left < COLS, dim = lt * (inside ? 1 : EK + 0.05);
            if (car) {
              // (H4 — THE TAXI is a TAXI: yellow, its roof light lit — the cause line "… BY A TAXI" must be true; every other car keeps its neon tint)
              const what = vehicleAt(course, i, j), taxi = what === 'taxi', tint = taxi ? TAXI_HEX : NEON[Math.floor(hsh(vseed ^ (i * 104729), j * 31 + 7) * NEON.length)];
              const name = what === 'truck' ? 'car-van' : `car-${what}`, q = KM[name], B = BOX[name], ry = L.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
              const bodyL = len < 1.5 ? 0.96 : 1.9, sz = B ? bodyL / B.l : 1, sx = B ? (len < 1.5 ? 0.7 : 0.78) / B.w : 1, sy = B ? (len < 1.5 ? 0.42 : 0.52) : 1;
              const nose = left + (L.dir > 0 ? len - 0.02 : 0.02), bx = X(nose - L.dir * bodyL / 2), tail = left + (L.dir > 0 ? 0.02 : len - 0.02);
              const truck = what === 'truck', tz = (len - 0.1) / TRUCK.len;   // (3 cells = THE BOX TRUCK, built in code — models.js#buildTruck)
              if (truck) K.trucks.put(cx, 0, z, 0.94, 0.9, tz, ry, tint, 1, dim);
              else if (q) q.put(bx - L.dir * B.cz * sz, 0, z, sx, sy, sz, ry, tint, 1, dim);
              K.shadow.put(cx, 0.03, z, len * 1.12, 1, 1.05, 0, 0, 1, 0, 0.6 * lt);
              if (on) {
                const [hw, hy] = LAMPS[truck ? 'truck' : name], a1 = dim, back = L.dir > 0 ? 0 : Math.PI;
                // the truck's amber markers along the foot of the box's side (the side the camera sees)
                if (truck) for (const m of [0, 0.34, 0.67, 1]) K.bill.put(cx + L.dir * (TRUCK.box[0] + (TRUCK.box[1] - TRUCK.box[0]) * m) * tz, 0.29, z + 0.4, 0.24, 0.24, 1, 0, 0xff9a1c, 1, 0, a1);
                if (taxi) { K.bill.put(bx, 0.5, z, 0.3, 0.2, 1, 0, 0xfff3b0, 1, 5, a1); LB(bx, 0.5, z, 0.62, 0.42, 1, 0, 0xffc21e, 1, 0, 0.55 * a1); }   // its ROOF LIGHT: a small lit box + its warm halo
                // (H5A — the owner: NO LIGHT TRAILS on any vehicle — from above they read as jet exhaust; afterburners are THE BLACKBIRD's alone, H6)
                for (const e of [-hw, hw]) {   // BOTH headlights + BOTH tail lights, each at its own place on the model
                  // (BY DAY — H5B: the headlights' beams + the tail glows are OFF; a pale lens in front, a small red on the body behind)
                  LF(X(nose + L.dir * HEAD_REACH / 2), 0.04, z + e, HEAD_REACH, 1, 0.8, back, 0xfff0c8, 1, 6, 0.5 * a1);   // a short soft beam on the road ahead
                  LF(X(tail - L.dir * TAIL_REACH * 0.3), 0.04, z + e, TAIL_REACH * 1.05, 1, 0.44, 0, 0xff2030, 1, 0, 0.5 * a1);   // a small red glow behind — one a tail light: two are seen
                  K.bill.put(X(nose), hy, z + e, day ? 0.13 : 0.2, day ? 0.13 : 0.2, 1, 0, 0xfff0c0, 1, 5, (day ? 0.7 : 0.8) * a1);
                  K.bill.put(X(tail), hy + 0.02, z + e, day ? 0.14 : 0.2, day ? 0.14 : 0.2, 1, 0, day ? 0xd81828 : 0xff2840, 1, 5, a1);
                }
              }
            } else {
              // A LOG (models.js#buildLog — H3): its own length (1–4 cells), HALF-SUNK; it bobs + rocks gently (and dips + rolls when the kid lands on it)
              const wob = fx.wob && fx.wob.lane === i && fx.wob.j === j && lap === 0 ? clock - fx.wob.t0 : 9e9, wv = wob < 520 && !reduce ? Math.exp(-wob / 170) * Math.sin(wob / 42) : 0;
              const by = bobOf(i, j) + LOG_FEET - LOG.top - wv * 0.07, rock = reduce ? 0 : Math.sin(clock / 880 + i * 1.3 + j * 2.1) * 0.04 + wv * 0.16;
              const n = Math.max(1, Math.min(4, Math.round(len))), tailX = L.dir > 0 ? left : left + len;
              K[`log${n}`].put(cx, by, z, 1, 1, 1, 0, 0xffffff, dim * 1.12, 1, 1, rock);
              if (on) {
                // THE WATERLINE: a thin ring hugging the log where it sits in the water + a small ripple ring swelling off it. At night the
                // amber is ONLY that thin underglow + a soft light on the water round it — the wood stays visible
                const lw = len + 0.1, ld = 0.92, asp = 7 + Math.min(9.9, lw / ld) / 10, rp = reduce ? 0.4 : (clock / 1700 + j * 0.37 + i * 0.21) % 1;
                // (BY DAY — H5B: no amber — a white foam ring where the warm wood sits in the bright water, its ripple + its wake white)
                LF(cx, 0.045, z, len + 1.1, 1, 1.6, 0, 0xffa23a, 1, 0, 0.17 * dim);
                K.flat.put(cx, 0.05, z, lw, 1, ld, 0, day ? 0xffffff : 0xffb060, 1, asp, (day ? 0.75 : 0.42) * dim);
                K.flat.put(cx, 0.052, z, lw + 0.12 + rp * 0.5, 1, ld + 0.12 + rp * 0.5, 0, day ? 0xffffff : 0xb8dcec, 1, 7 + Math.min(9.9, (lw + 0.12 + rp * 0.5) / (ld + 0.12 + rp * 0.5)) / 10, (day ? 0.5 : 0.2) * (1 - rp) * dim);
                // a small wake trails it: a soft pale ribbon behind its tail
                K.flat.put(X(tailX - L.dir * 0.8), 0.05, z, 1.7, 1, 0.8, L.dir > 0 ? 0 : Math.PI, day ? 0xffffff : 0xa8d4e6, 1, 1, (day ? 0.4 : 0.13) * dim);
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
            // (BY DAY — H5B: the red flash stays BOLD in sunlight: a bigger lens, a red wash on the ground under it — paint, not a glow)
            K.bill.put(x, 0.66, z - 0.44, blink ? (day ? 1.15 : 0.62) : 0.24, blink ? (day ? 1.15 : 0.62) : 0.24, 1, 0, blink ? 0xff2a2a : 0x7a1414, 1, 5, (blink ? 1 : 0.8) * lt);
            if (blink && on) K.flat.put(x, 0.04, z - 0.3, day ? 2.8 : 2.2, 1, day ? 1.9 : 1.5, 0, 0xff2020, 1, 0, (day ? 0.7 : 0.5) * lt);
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
            K.shadow.put(X(left + len / 2), 0.03, z, len * 1.03, 1, 1.25, 0, 0, 1, 0, 0.65 * lt);
            if (on) {
              const [tw, ty] = LAMPS.train, rear = nose - p.dir * len;
              for (const e of [-tw, tw]) {   // the train's front: BOTH headlights cast a soft beam (a little longer than a car's); BOTH tail lights a red glow
                LF(X(nose + p.dir * HEAD_REACH * 0.8), 0.05, z + e, HEAD_REACH * 1.6, 1, 0.95, p.dir > 0 ? 0 : Math.PI, 0xfff2d0, 1, 6, 0.6 * lt);
                K.bill.put(X(nose), ty, z + e, day ? 0.24 : 0.36, day ? 0.24 : 0.36, 1, 0, 0xfff6d8, 1, 5, lt);
                LF(X(rear - p.dir * TAIL_REACH * 0.36), 0.05, z + e, TAIL_REACH * 1.3, 1, 0.56, 0, 0xff2030, 1, 0, 0.4 * lt);
                K.bill.put(X(rear), ty, z + e, day ? 0.18 : 0.24, day ? 0.18 : 0.24, 1, 0, day ? 0xd81828 : 0xff2840, 1, 5, 0.9 * lt);
              }
              LF(X(left + len / 2), 0.045, z + 0.55, len, 1, 0.9, 0, 0x7fd0ff, 1, 4, 0.3 * lt);
            }
          }
        } else {
          const tellF = st.st === 'tell' ? 1 - st.left / p.tell : st.st === 'pass' ? 1 : 0;
          fxv = tellF * p.dir;
          // THE FLIGHT PATH: blue runway lights in the ground; the tell = the lights RACING toward the crossing (bold, unmissable)
          const head = st.st === 'tell' ? (tellF * tellF * 7 + tellF * 2) % 1 * 14 - 2.5 : -99;
          for (let c = -1; c <= COLS; c++) {
            const at = p.dir > 0 ? c : COLS - 1 - c, hot = st.st === 'pass' || (head > -50 && at <= head && at > head - 3.2), far = c < 0 || c >= COLS ? 0.6 : 1;
            // (BY DAY — H5B: the runway lights are DIM lenses in the tarmac until the tell — then they RACE, white-hot in a blue ring,
            //  over the lane's own racing chevrons (the ground shader): the Blackbird's tell is unmistakable in sunlight)
            for (const e of [-0.42, 0.42]) {
              K.bill.put(X(c + 0.5), 0.07, z + e, hot ? (day ? 0.9 : 0.74) : (day ? 0.22 : 0.3), hot ? (day ? 0.9 : 0.74) : (day ? 0.22 : 0.3), 1, 0, hot ? (day ? 0xffffff : 0xd8f0ff) : (day ? 0x1f5fd0 : 0x2f7bff), 1, 5, (hot ? 1 : 0.85) * lt * far);
              if (on) K.flat.put(X(c + 0.5), 0.04, z + e, hot ? 1.7 : 0.8, 1, hot ? 1.2 : 0.6, 0, 0x2a7cff, 1, hot && day ? 3 : 0, (hot ? (day ? 0.95 : 0.75) : (day ? 0 : 0.35)) * lt * far);
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
      const AR = area(i).index;
      if (L.mark && AR >= 0) {
        // THE ARRIVAL GATEWAY (H5A): a neon arch spanning the lane — two posts in the edge columns, a see-through arc of light between
        // them (nothing in the play columns is covered) — + the area's NAME written big on its lane, in the area's own neon
        const hex = LOOKS[AR].accent, xl = X(-0.55), xr = X(COLS + 0.55), zf = z - 0.42;
        if (day) {
          // BY DAY (H5B): a PAINTED arch — white posts banded in the area's colour, the arch in stripes of it, the name in white paint
          // on a band of the area's colour laid across the lane
          const pc = LOOKS[AR].paint, wh = 0xf6f2e8, li = Math.min(1.6, lt);
          for (const x of [xl, xr]) { K.posts.put(x, 1.5, zf, 0.22, 3.0, 0.22, 0, wh, li); K.posts.put(x, 2.86, zf, 0.3, 0.4, 0.3, 0, pc, li); K.posts.put(x, 0.4, zf, 0.3, 0.8, 0.3, 0, pc, li); }
          for (let k = 0; k < 20; k++) {
            const u0 = k / 20, u1 = (k + 1) / 20, ax0 = xl + (xr - xl) * u0, ax1 = xl + (xr - xl) * u1, ay0 = 3.1 + Math.sin(Math.PI * u0) * 1.05, ay1 = 3.1 + Math.sin(Math.PI * u1) * 1.05;
            K.posts.put((ax0 + ax1) / 2, (ay0 + ay1) / 2, zf, Math.hypot(ax1 - ax0, ay1 - ay0) + 0.03, 0.24, 0.16, 0, k % 2 ? wh : pc, li, 1, 1, 0, Math.atan2(ay1 - ay0, ax1 - ax0));
          }
          K.flat.put(0, 0.045, z, 9.6, 1, 1.0, 0, pc, 1, 4, 0.9);
        } else {
        for (const x of [xl, xr]) { K.posts.put(x, 1.5, zf, 0.2, 3.0, 0.2, 0, 0x2b2b3c, lt); K.bill.put(x, 3.1, zf, 0.5, 0.5, 1, 0, hex, 1, 5, lt); for (let k = 0; k < 5; k++) K.bill.put(x, 0.4 + k * 0.55, zf, 0.3, 0.42, 1, 0, hex, 1, 4, 0.85 * lt); if (on) K.flat.put(x, 0.05, zf, 2.6, 1, 2.0, 0, hex, 1, 0, 0.4 * lt); }
        for (let k = 0; k <= 56; k++) { const u = k / 56, ax = xl + (xr - xl) * u, ay = 3.1 + Math.sin(Math.PI * u) * 1.05; K.bill.put(ax, ay, zf, 0.4, 0.4, 1, 0, hex, 1, 0, 0.55 * lt); K.bill.put(ax, ay, zf, 0.2, 0.2, 1, 0, 0xffffff, 1, 0, 0.6 * lt); }   // (a continuous neon TUBE: the glow + its hot core)
        if (on) K.flat.put(0, 0.045, z, 11, 1, 1.5, 0, hex, 1, 4, 0.2 * lt);
        }
        if (gates < 2) { const G = GATE[gates++]; writeGate(G, gateName(i), hex); G.m.visible = lt > 0.2 && dk < 0.8; G.m.position.set(0, 0.07, z); G.m.material.opacity = Math.min(1, lt); }
      }
      const PL = AR >= 0 ? sigAt(i) : null;
      if (PL) for (const P of PL) { const r = drawSig(P, { K, A: AK, KM, BOX, X, Z, lt, on: on && !day, day, ek: EK, T: LOOKS[AR], h: (a, b) => hsh(vseed ^ (a * 2659), b), course }); if (r && r.beam && on) beam = { at: r.beam, side: P.side, lt: Math.min(1, lt) }; if (r && r.sign && on && !sign) sign = { at: r.sign, lt: Math.min(1, lt) }; }
      // (THE CANAL: an arched stone footbridge over a water lane, in an edge column — the logs drift under it)
      if (AR >= 0 && LOOKS[AR].footbridge && L.type === 'water' && i % 2 === 0) AK.footbridge.put(X(i % 4 ? -0.6 : COLS + 0.6), 0, z, 1.05, 1.0, 0.86, 0, 0xffffff, lt * (EK + 0.2));
      // (THE RAIL YARD: a signal gantry over each rail lane's edge columns — two posts on the lane lines' side, a beam, its lamp: the train runs under it)
      if (AR >= 0 && LOOKS[AR].gantry && L.type === 'rail') for (const sd of [-1, 1]) {
        const gx = X(sd < 0 ? -0.55 : COLS + 0.55);
        K.posts.put(gx - 0.42, 0.95, z - 0.47, 0.07, 1.9, 0.07, 0, 0x3a3a48, lt * (EK + 0.2)); K.posts.put(gx + 0.42, 0.95, z - 0.47, 0.07, 1.9, 0.07, 0, 0x3a3a48, lt * (EK + 0.2)); K.posts.put(gx, 1.9, z - 0.47, 0.95, 0.08, 0.08, 0, 0x4a4a5a, lt * (EK + 0.2));
        K.bill.put(gx, 1.72, z - 0.47, 0.26, 0.26, 1, 0, fxv ? 0xff2a2a : 0x40ff80, 1, 5, 0.9 * lt);
      }
      ground.lay(gi++, i, kindOf(L), kindOf(course.lane(i - 1)), kindOf(course.lane(i + 1)), hsh(vseed, i) * 10, dk, fxv, AR + 1);
    }
    ground.done(gi);
    for (let j = nu; j < 2; j++) { ufos[j].d.visible = false; ufos[j].id = -1; }
    // THE LIGHTHOUSE's BEAM (H5A): its lamp lit + a long soft beam lying over the lanes, SWEEPING across them (still with reduce motion)
    if (beam) {
      const [bx, bh, bz] = beam.at, sw = reduce ? 0.25 : Math.sin(clock / 2300) * 0.95, ang = beam.side < 0 ? sw : Math.PI - sw, len = 15;
      // (BY DAY — H5B: its lamp a small bright lens, its beam a faint pale sweep on the sunlit lanes)
      K.bill.put(bx, bh, bz, day ? 0.8 : 1.5, day ? 0.8 : 1.5, 1, 0, 0xfff4c0, 1, 5, beam.lt); LB(bx, bh, bz, 4.2, 3.4, 1, 0, 0xffe9a0, 1, 0, 0.5 * beam.lt);
      K.flat.put(bx + Math.cos(ang) * len / 2, 0.075, bz - Math.sin(ang) * len / 2, len, 1, 3.4, ang, day ? 0xfffbe0 : 0xfff0b0, 1, 2, (day ? 0.2 : 0.5) * beam.lt);
      LF(bx + Math.cos(ang) * len / 2, 0.076, bz - Math.sin(ang) * len / 2, len, 1, 1.3, ang, 0xffffff, 1, 2, 0.28 * beam.lt);
    }
    fish.visible = !!sign;
    if (sign) { fish.position.set(sign.at[0], sign.at[1], sign.at[2]); fish.quaternion.copy(cam.quaternion); fish.material.opacity = sign.lt * (reduce || day ? 1 : 0.88 + 0.12 * Math.sin(clock / 190)); }
    // the skyline band's tint: the colour of the area the kid is in (a change only when he crosses a gateway)
    const ka = area(Math.max(0, Math.floor(ky))).index;
    if (ka !== skyArea) {
      skyArea = ka; skyTint.style.background = ka < 0 ? 'none' : `linear-gradient(to top, ${LOOKS[ka].sky}, transparent 85%)`; skyTint.style.opacity = ka < 0 ? '0' : day ? '0.1' : '0.2';
      skyMark.set(ka, day ? 'day' : 'night', ka < 0 ? 0 : LOOKS[ka].accent);   // (H5B — THE LANDMARKS IN THE SKYLINE: this area's, while the kid is in it)
    }
    // his blob shadow: smaller + fainter as he rises
    if (show && py > -0.2) K.shadow.put(px, feet + 0.035, pz + 0.05, 0.98 * (1 - lift * 0.55) * s3[0], 1, 0.78 * (1 - lift * 0.55) * s3[2], 0, 0, 1, 0, 0.66 * (1 - lift * 0.9) * lit);
    // HE ALWAYS STANDS OUT: a soft pool of his colour on the ground under him + a ring round his feet (it breathes — never with reduce motion)
    if (show && py > -0.2 && lit > 0.25 && !(H && down)) {
      const br = reduce ? 1 : 0.94 + 0.06 * Math.sin(clock / 260);
      LF(px, feet + 0.04, pz + 0.04, 2.3, 1, 1.9, 0, kidHex, 1, 0, 0.3 * lit);   // (H5A: softer — the new kid's own colours (his face, his arms, his sneakers) must read through it)
      // (BY DAY — H5B: his ring is a soft SHADOW-RING on the ground, a ring of his colour painted inside it)
      if (day) K.shadow.raw(px, feet + 0.043, pz + 0.04, 1.72 * br, 1, 1.42 * br, 0, 0, 1, 3, 0.5 * Math.min(1, lit));
      K.flat.put(px, feet + 0.045, pz + 0.04, 1.42 * br, 1, 1.16 * br, 0, kidHex, 1, 3, (day ? 1 : 0.8) * lit);
    }
    // THE GHOSTS (H4): the others' kids from their own runs — see-through, their colour, a thin ring of it under their feet
    const ghosts = (o && o.ghosts) || null;
    const ga = o && o.a != null ? o.a : a;
    if (ghosts) for (const g of ghosts) {
      const r = g.run;
      g.tag = null;
      if (!r) continue;
      if (r.st === 'out' || r.st === 'taken') { if (!g.outAt) g.outAt = clock; } else g.outAt = 0;
      const gone = g.outAt ? clamp01((clock - g.outAt) / 420) : 0;
      if (gone >= 1) continue;
      let gx = r.x / FP, gy = r.y + 0.5, gl = 0, gf = 0;
      const GL = course.lane(r.y);
      if (r.st === 'hop') { gf = Math.min(1, (r.k + ga) / HOP_TICKS); gx = (r.fx + (r.tx - r.fx) * gf) / FP; gy = r.fy + 0.5 + (r.ty - r.fy) * gf; gl = Math.sin(Math.PI * gf) * 0.5; g.dir = r.ty > r.fy ? 'u' : r.ty < r.fy ? 'd' : r.tx < r.fx ? 'l' : 'r'; }
      else if (r.st === 'idle' && GL.type === 'water' && !g.held) gx += GL.dir * GL.v * ga / FP;
      // (H4B — a late hop's catch-up: back where the ghost was drawn, closing in a quick hop through the air)
      const gv = g.vis && !g.outAt ? g.vis : null, air = gv ? Math.sin(Math.PI * gv.u) * 0.5 * Math.min(1, gv.d) : 0;
      if (gv) { gx += gv.x; gy += gv.y; gl = gl * gv.u + air; }
      if (gy < base - 1 || gy > top + 1) continue;
      const onLog = r.st === 'hop' ? (course.lane(r.fy).type === 'water' ? LOG_FEET * (1 - gf) : 0) + (course.lane(r.ty).type === 'water' ? LOG_FEET * gf : 0) : GL.type === 'water' ? LOG_FEET : 0;
      const yawG = g.dir === 'l' ? Math.PI / 2 : g.dir === 'r' ? -Math.PI / 2 : g.dir === 'd' ? Math.PI : 0, gs = KID_S * 0.94 * (1 - gone * 0.6), glit = litOf(Math.floor(gy)) * (1 - gone);
      const gpx = X(gx), gpy = onLog + gl + (r.st === 'taken' ? gone * 3 : 0), gpz = Z(gy);
      // (the same kid: his idle, Kenney's jump through a hop / a catch-up)
      const gq = r.st === 'hop' ? gf : gv ? gv.u : -1, gA = POSE ? POSE.idle[0] + (reduce ? 0 : ((clock + gpx * 400) % IDLE_MS + IDLE_MS) % IDLE_MS / IDLE_MS * POSE.idle[1]) : 0;
      if (KM.ghosts) KM.ghosts.put(gpx, gpy, gpz, gs, gs * (r.st === 'hop' ? 1 + 0.16 * Math.sin(Math.PI * gf) : 1 + 0.32 * air), gs, yawG + KID_YAW, g.hex, 1, glit, gA, 0, 0, POSE && gq >= 0 ? POSE.jump[0] + gq * POSE.jump[1] : 0, gq >= 0 ? Math.min(1, Math.sin(Math.PI * gq) * 1.7) : 0);
      if (glit > 0.25) K.flat.put(gpx, onLog + 0.042, gpz + 0.04, 1.2, 1, 1.0, 0, g.hex, 1, 3, 0.4 * glit);
      g.wx = gpx; g.wy = gpy + KID.h * gs + 0.16; g.wz = gpz; g.tag = gone > 0 ? null : true;
    }
    if (flat) K.shadow.put(px, 0.034, pz + 0.12, 1.5 * flat.wide, 1, 1.3 * flat.wide, 0, 0, 1, 0, 0.5 * lit);
    // THE LINES: the gold band of YOUR BEST + the next friend's — across the whole lane at its far edge; on water a row of glowing
    // buoys on their rope; glints run along it; the words lie on the lane beside it. A crossed line bursts (it flares, then is gone)
    for (const k of ['best', 'friend']) {
      const Ln = LINES[k], lab = LBL[k];
      if (!Ln || Ln.lane < base || Ln.lane >= top) { lab.m.visible = false; continue; }
      const L = course.lane(Ln.lane), ll = litOf(Ln.lane), hex = LINE_HEX[k], both = k === 'friend' && LINES.best && LINES.best.lane === Ln.lane;
      const z = Z(Ln.lane + (both ? 0.8 : 0.93)), hit = crossed.find(q => q.k === k && q.lane === Ln.lane), fl = hit ? Math.max(0, 1 - (clock - hit.t0) / 700) : 0;
      if (L.type === 'water') {
        K.flat.put(0, 0.06, z, 13, 1, 1.0, 0, hex, 1, 4, (0.14 + fl * 0.5) * ll);
        K.flat.put(0, 0.062, z, 13, 1, 0.22, 0, hex, 1, 4, (0.6 + fl) * ll);
        for (let c = -1.5; c <= COLS + 1.5; c += 0.75) { const bob = reduce ? 0 : Math.sin(clock / 480 + c * 1.9) * 0.03; K.bill.put(X(c), 0.15 + bob, z, 0.32 + fl * 0.2, 0.32 + fl * 0.2, 1, 0, hex, 1, 5, ll); K.flat.put(X(c), 0.055, z, 0.8, 1, 0.55, 0, hex, 1, 0, 0.32 * ll); }
      } else {
        // (BOLD — it never reads as a road marking: a wide soft halo, the glowing band, its white-hot core)
        K.flat.put(0, 0.064, z, 13, 1, 1.0, 0, hex, 1, 4, (0.14 + fl * 0.5) * ll);
        K.flat.put(0, 0.066, z, 13, 1, 0.6 + fl * 0.5, 0, hex, 1, 4, (0.95 + fl) * ll);
        K.flat.put(0, 0.068, z, 13, 1, 0.15, 0, 0xffffff, 1, 4, (0.8 + fl * 0.6) * ll);
      }
      if (!reduce) for (let g = 0; g < 3; g++) K.bill.put(((clock / 1500 + g / 3) % 1) * 13 - 6.5, 0.1, z, 0.8, 0.3, 1, 0, hex, 1, 0, 0.7 * ll);
      lab.m.visible = ll > 0.2;
      // (the words read on ANY ground: a soft dark strip under them — grass, asphalt, water, the rails)
      const wz = Z(Ln.lane + (both ? 1.42 : 0.42) - (L.mark ? 1 : 0));   // (H5A — a gateway lane carries its area's name: the line's words lie a lane lower)
      K.shadow.raw(X(k === 'best' ? 3.9 : COLS - 3.9), 0.062, wz, 8.4, 1, 0.9, 0, 0, 1, 4, (day ? 0.5 : 0.6) * Math.min(1, ll));
      lab.m.position.set(X(k === 'best' ? 3.9 : COLS - 3.9), 0.07, wz);
      lab.m.material.opacity = Math.min(1, ll);
    }
    // (a FRIEND's line that was just crossed is no longer the next one: its flare alone, fading where it lay)
    for (let j = crossed.length - 1; j >= 0; j--) {
      const q = crossed[j], u = (clock - q.t0) / 700;
      if (u >= 1) { crossed.splice(j, 1); continue; }
      if (LINES[q.k] && LINES[q.k].lane === q.lane) continue;
      if (q.lane >= base && q.lane < top) K.flat.put(0, 0.066, Z(q.lane + 0.93), 13, 1, 0.8 + (1 - u) * 0.5, 0, LINE_HEX[q.k], 1, 4, 1.5 * (1 - u) * litOf(q.lane));
    }
    if (taken) { K.flat.put(px, 0.06, pz, 3.4, 1, 3.0, 0, 0x6dffb0, 1, 3, 0.9 * taken); K.flat.put(px, 0.055, pz, 3.0, 1, 2.6, 0, 0x3dff9a, 1, 0, 0.5 * taken); K.bill.put(px, 5.5, pz, 3.2, 11, 1, 0, 0x7dffc0, 1, 4, 0.5 * taken); }
    // the small moments: a dust ring, a ripple, a splash
    for (let j = fx.parts.length - 1; j >= 0; j--) {
      const q = fx.parts[j], u = (clock - q.t0) / q.life;
      if (u >= 1) { fx.parts.splice(j, 1); continue; }
      if (q.k === 'ring') { const r = q.r0 + (q.r1 - q.r0) * ease(u); K.flat.put(q.x, q.y, q.z, r * 2, 1, r * 2 * (q.sz || 0.7), 0, q.hex, 1, 3, (1 - u) * (q.al || 0.8)); }
      else { const s = (clock - q.t0) / 1000; K.bill.put(q.x + q.vx * s, q.y + q.vy * s - 6.5 * s * s, q.z + q.vz * s, 0.16, 0.16, 1, 0, q.hex, 1, 0, 1 - u); }
    }
    // THE BLACKOUT: a cold edge where it bites, the black behind it
    if (day) {
      // THE FOG BANK (H5B — the blackout by day: the SAME wall, the same timing, the same rules): a rolling white-grey bank creeping up
      // from the bottom — a soft white edge where it takes a lane, puffs rolling along its face, the bank's body behind (the curtain)
      K.flat.put(0, 0.08, Z(wallE - 0.1), 30, 1, 1.5, 0, 0xffffff, 1, 4, 0.85); K.flat.put(0, 0.07, Z(wallE + 0.8), 30, 1, 3.2, 0, 0xf2f6f8, 1, 4, 0.34);
      for (let r = 0; r < 4; r++) for (let c = -3; c <= COLS + 3; c += 1.5) {
        const ph = c * 1.7 + r * 2.3, dr = reduce ? 0 : Math.sin(clock / 2100 + ph) * 0.6, up = reduce ? 0 : Math.sin(clock / 1300 + ph * 1.3) * 0.12;
        K.bill.put(X(c + 0.75 * (r % 2)) + dr, 0.5 + r * 0.16 + up, Z(wallE + 0.45 - r * 0.8), 3.6, 2.4, 1, 0, r === 0 ? 0xffffff : (Math.round(c / 1.5) + r) % 2 ? 0xf6f8fa : 0xdfe6ec, 1, 0, r ? 0.95 : 0.6);
      }
    } else { K.flat.put(0, 0.08, Z(wallE), 30, 1, 0.5, 0, 0x8fc4ff, 1, 4, 0.5); K.flat.put(0, 0.07, Z(wallE + 0.5), 30, 1, 2.2, 0, 0x2a4a9a, 1, 4, 0.16); }
    curtain.position.set(0, 1.2, Z(wallE - 1.1 - 20)); curtain.scale.set(60, 2.6, 40);
    for (const q of Object.values(K)) q.done();
    for (const q of Object.values(KM)) q.done();
    ground.uniforms.uTime.value = reduce ? 0 : clock / 1000;
    renderer.info.reset();
    renderer.render(scene, cam);
    if (bloom && !day) bloom.render(scene, cam);   // (the bloom is the night's: by day the lights are paint)
    // (H4) THE SHARE IMAGE's frame: asked for → copied off the canvas in THIS frame (a WebGL canvas keeps no picture between frames)
    if (snapAsk) { const ask = snapAsk; snapAsk = null; try { ask(grab(snapW)); } catch { ask(null); } }
    // where each ghost's name tag goes (CSS px from the top left; null = off the screen)
    if (ghosts) for (const g of ghosts) {
      if (!g.tag) continue;
      v3.set(g.wx, g.wy, g.wz).project(cam);
      const sx = (1 + v3.x) / 2, sy = (1 - v3.y) / 2;
      g.tag = v3.z < 1 && sx > 0.04 && sx < 0.96 && sy > 0.2 && sy < 0.9 ? [sx * w, sy * h] : null;
    }
  }
  let snapAsk = null, snapW = 1080;
  /** the picture on the canvas right now → a 2D canvas `width` px wide (the whole frame; null if this phone can't) */
  function grab(width = 1080) {
    const cv = document.createElement('canvas'), k = width / el.width;
    cv.width = width; cv.height = Math.max(1, Math.round(el.height * k));
    const c = ctx2d(cv);
    if (!c) return null;
    c.drawImage(el, 0, 0, cv.width, cv.height);
    return cv;
  }

  const v3 = new THREE.Vector3();
  return {
    /** (H4) the NEXT frame as a 2D canvas → fn(canvas | null): the share image's frame, the poster */
    snap(fn, width = 1080) { snapAsk = fn; snapW = width; },
    /** (H4 add-on — lines.js#linesFor) the lines to draw: { best: { lane, text } | null, friend: { lane, text } | null } */
    setLines(v) { for (const k of ['best', 'friend']) { LINES[k] = (v && v[k]) || null; if (LINES[k]) writeLabel(k, LINES[k].text); else LBL[k].m.visible = false; } },
    /** … a line was CROSSED: a short light burst along it (never with reduce motion: the flare alone) */
    flashLine(k, lane) {
      crossed.push({ k, lane, t0: clock });
      if (reduce) return;
      for (let j = 0; j < 14; j++) part('drop', X(-0.5 + j * 0.78), 0.1, Z(lane + 0.93), 560, { hex: LINE_HEX[k], vx: (j % 3 - 1) * 0.4, vz: 0.15, vy: 2.4 + (j % 4) * 0.5 });
      part('ring', kidPos.x, 0.06, Z(lane + 0.93), 520, { hex: LINE_HEX[k], r0: 0.3, r1: k === 'best' ? 2.6 : 1.6 });
    },
    /** (H4 — SPECTATE: the camera moved to another player's kid) the kid's own feel starts clean */
    resetKid() { fx.t = -1; fx.st = 'idle'; fx.hits = 0; fx.hit = null; fx.parts.length = 0; fx.landAt = -1e9; fx.wob = null; fx.seen = true; fx.out = 0; },
    el, draw, resize: () => fit(), ready, setTier, tier: () => tier,
    /** the lab's switches: ZOOM 7 · 8 · 9 + ANGLE straight · turned (eased; `snap` = at once) */
    setCamera(zoom, angle, snap) { rig.choose(zoom, angle, snap); },
    zoom: () => rig.zoom(), angle: () => rig.angle(),
    /** a ground point (column cells, lane) → where it is on the screen ([x, y] 0 … 1 from the top left) — the framing's checks */
    project(cells, lane) { v3.set(X(cells), 0, Z(lane)).project(cam); return [(1 + v3.x) / 2, (1 - v3.y) / 2]; },
    kidScreenX() { v3.copy(kidPos).project(cam); return (1 + v3.x) / 2; },
    setKidColor: tintOf,
    /** H3 — THE START WHILE THE COURSE LANDS: 0 = only the few lanes at the kid's feet out of the dark, 1 = the whole view (eased; `snap` = at once) */
    setReveal(v, snap) { revealT = v < 0 ? 0 : v > 1 ? 1 : v; if (snap) reveal = revealT; },
    /** where the kid is on the screen (0 … 1 from the top) — the camera's check */
    kidScreenY() { v3.copy(kidPos).project(cam); return (1 - v3.y) / 2; },
    /** how tall he stands on the screen, in CSS px (= pt) — the wider view's readability number */
    kidHeightPx() { v3.copy(kidPos).project(cam); const y0 = v3.y; v3.set(kidPos.x, kidPos.y + kidH, kidPos.z).project(cam); return Math.abs(v3.y - y0) / 2 * h; },
    info: () => ({ warmed, kid: !!kidGeo, programs: renderer.info.programs ? renderer.info.programs.length : 0, calls: renderer.info.render.calls, tris: renderer.info.render.triangles, dpr, w, h, fov: cam.fov, tier, zoom: rig.zoom(), angle: rig.angle(), camX: rig.x(), yaw: rig.yaw(), bloom: !!bloom && !day, look: day ? 'day' : 'night', mark: skyMark.shown() }),
    /** H5B — THE LOOK: 'day' | 'night' (at once; the same scene) */
    setLook, look: () => (day ? 'day' : 'night'),
    destroy() {
      dead = true; ro.disconnect();
      for (const { m, g } of made) { scene.remove(m); m.material.dispose(); if (g) g.dispose(); m.dispose(); }
      for (const g of Object.values(GEO)) g.dispose();
      for (const m of [curtain, ...ufos.map(q => q.d)]) { m.material.dispose(); }
      if (kidGeo) { kidGeo.userData.poses.tex.dispose(); kidGeo.dispose(); }
      for (const L of Object.values(LBL)) { scene.remove(L.m); L.m.material.dispose(); L.tex.dispose(); L.cv.width = 0; L.cv.height = 0; }
      labelGeo.dispose(); gateGeo.dispose(); fishGeo.dispose(); fishTex.dispose(); fish.material.dispose(); scene.remove(fish); fishCv.width = 0;
      for (const G of GATE) { scene.remove(G.m); G.m.material.dispose(); G.tex.dispose(); G.cv.width = 0; G.cv.height = 0; }
      for (const g of Object.values(AGEO)) g.dispose();
      discGeo.dispose(); flatGeo.dispose(); billGeo.dispose(); unit.dispose(); ground.dispose();
      if (bloom) bloom.dispose();
      if (env) env.dispose();
      if (envDay) envDay.dispose();
      skyMark.destroy();
      renderer.dispose();
      try { renderer.forceContextLoss(); } catch { /* fine */ }
      el.remove(); sky.remove();
    },
  };
}
