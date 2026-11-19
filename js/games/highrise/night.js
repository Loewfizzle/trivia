// HIGH RISE — THE NIGHT LOOK (S2 — docs/highrise.md "THE NIGHT LOOK"): the real game's view, on three.js 0.160 core only (the page's
// import map; the bloom + the sparks are ours — night-fx.js). A VIEW: it reads the run + the tower the page builds from the engine's
// EVENTS (tower.js) and eases between two ticks — it never writes them, the rules never import it.
//   THE TOWER — smoked GLASS slabs with lit NEON EDGES: ONE instanced mesh for every box on screen (the slabs, the building's floors
//   under them, the sliding slab + its trail, the falling pieces, YOUR BEST's gold tape) — a custom shader: the slab's colour as dark glass,
//   THE REFLECTION MAP (the night HDRI's sky half), a fresnel lift, edges drawn from each face's own distance to its border. NOT
//   three.js transmission. THE CUT: the overhang tumbles away (a pooled piece) in a burst of GPU SPARKS along the cut. A PERFECT:
//   the slab flashes white-hot + a RING OF LIGHT pulses off its outline. GROW-BACK: the slab swells out to its new size.
//   THE PLATES — the band's painted backdrop behind everything (a screen-filling quad): only the current band's + the next one's
//   picture in memory, cross-faded round a seam, drifting slower than the tower (bands.js).
//   THE CAMERA — camera.js: the lab's diagonal camera, climbing with the top slab.
//   TIERS (the match kit's): 2 = the device's sharpness (DPR ≤ 3) + THE HALF-RES BLOOM · 1 = DPR ≤ 2, no bloom · 0 = DPR ≤ 1.5, fewer
//   sparks, no trail. THE WARM FRAME: every program is built in one hidden frame before the first slab moves.
import * as THREE from 'three';
import { START, TRAVEL } from './tuning.js';
import { slabAt } from './engine.js';
import { CAM, camDist, SLAB_H } from './camera.js';
import { plateMix, plateDrift, slabColor, SLACK } from './bands.js';
import { GLASS_V, GLASS_F, PLATE_V, PLATE_F, SPARK_V, SPARK_F, RING_V, RING_F, TAPE_V, TAPE_F, TAPE_BACK, createBloom } from './night-fx.js';

const U = 1 / START, H = SLAB_H, RAD = Math.PI / 180;
/** the slabs kept drawn under the top (the rest is below the screen) */
export const KEEP = 40;
export const DPR_AT = Object.freeze([1.5, 2, 3]);
/** bump when a picture under assets/highrise/ is replaced */
export const HI_ART_REV = 1;
const ART = new URL('../../../assets/highrise/', import.meta.url);
const PLATE_ASPECT = 720 / 1280;
const PIECES = 8, TAPE = 4, BOXES = KEEP + 1 + 2 + PIECES + TAPE, SPARKS = 224, RINGS = 4;
const SPARKS_AT = [12, 22, 34];            // a cut's sparks by tier (× its length)
const GOLD = [1, 0.78, 0.2], BG = 0x0a0716;
const KIND = { slab: 0, slider: 2, tape: 3, trail: 4 };
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);

export function createNight(host, o = {}) {
  const look = o.look === 'day' ? 'day' : 'night';
  /** THE HITCH COUNTER's cause marks (play.js): 'plate' = a picture uploaded · 'compile' = a program built / the tier stepped */
  const mark = typeof o.mark === 'function' ? o.mark : () => {};
  const reduce = o.reduce != null ? !!o.reduce : (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();
  const devDpr = Math.min(window.devicePixelRatio || 1, 3);
  const renderer = new THREE.WebGLRenderer({ antialias: devDpr < 2, powerPreference: 'high-performance' });
  renderer.info.autoReset = false;   // (a frame = the picture + the bloom's passes: counted together)
  const el = renderer.domElement;
  el.className = 'hi-canvas';
  host.append(el);
  const scene = new THREE.Scene();
  renderer.setClearColor(BG, 1);
  const cam = new THREE.PerspectiveCamera(CAM.fov, 1, 0.5, 80);
  // the uniforms every material shares (one object each: a pass flips them once)
  const G = { uBloom: { value: 0 }, uTime: { value: 0 }, uTopY: { value: 0 }, uFadeH: { value: 3.5 }, uEnv: { value: null }, uEnvOn: { value: 0 }, uEnvRot: { value: 0.18 }, uAspect: { value: 1 } };
  const made = [];   // (everything to dispose)

  // ---- THE PLATES: a screen-filling quad behind everything
  const blank = new THREE.DataTexture(new Uint8Array([10, 7, 22, 255]), 1, 1); blank.needsUpdate = true; made.push(blank);
  const plateU = { tA: { value: blank }, tB: { value: blank }, uMix: { value: 0 }, uHaveA: { value: 0 }, uHaveB: { value: 0 }, uDriftA: { value: 0 }, uDriftB: { value: 0 }, uFit: { value: new THREE.Vector2(1, 1) }, uDim: { value: 0.92 }, uFlipA: { value: 0 }, uFlipB: { value: 0 } };
  const plateMat = new THREE.ShaderMaterial({ vertexShader: PLATE_V, fragmentShader: PLATE_F, uniforms: plateU, depthTest: false, depthWrite: false });
  const plateGeo = new THREE.PlaneGeometry(2, 2), plate = new THREE.Mesh(plateGeo, plateMat);
  plate.frustumCulled = false; plate.renderOrder = -100; scene.add(plate); made.push(plateMat, plateGeo);
  const plates = new Map();   // band → { tex, ok } — ONLY the current band + the next are ever held
  let dead = false, loads = 0, uploads = 0;
  const loader = new THREE.TextureLoader();
  // A PLATE IS DECODED + UPLOADED AHEAD, OFF THE FRAME (S2 FIX — THE LAG HUNT): three's TextureLoader hands the GPU an <img>, and a
  // browser decodes an <img> at its FIRST DRAW — a 720 × 1280 WebP decoded + uploaded inside the very frame a band's seam began (the
  // lag at each seam). Now: the bytes → createImageBitmap (decoded on another thread; an <img>.decode() where it is missing) → the
  // texture is uploaded AT ONCE (renderer.initTexture), a whole band before the seam that first shows it.
  const viaImg = url => new Promise((res, rej) => {
    const im = new Image(); im.decoding = 'async';
    im.onload = () => { const go = () => res({ image: im, flip: 0 }); if (im.decode) im.decode().then(go, go); else go(); };
    im.onerror = () => rej(new Error('no plate')); im.src = url;
  });
  const loadPicture = url => (typeof createImageBitmap === 'function' && typeof fetch === 'function'
    ? fetch(url).then(r => { if (!r.ok) throw new Error('no plate'); return r.blob(); }).then(bl => createImageBitmap(bl)).then(bm => ({ image: bm, flip: 1 })).catch(() => viaImg(url))
    : viaImg(url));
  const dropPlate = rec => { if (rec.tex) { const im = rec.tex.image; rec.tex.dispose(); if (im && im.close) im.close(); rec.tex = null; } rec.ok = false; };
  function wantPlate(band) {
    if (plates.has(band) || band < 0 || band > 4) return;
    const rec = { tex: null, ok: false, flip: 0 };
    plates.set(band, rec); loads++;
    loadPicture(new URL(`plates/${look}-${band + 1}.webp?v=${HI_ART_REV}`, ART).href).then(({ image, flip }) => {
      if (dead || plates.get(band) !== rec) { if (image.close) image.close(); return; }
      const t = new THREE.Texture(image);
      t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false; t.minFilter = t.magFilter = THREE.LinearFilter; t.flipY = !flip; t.needsUpdate = true;
      rec.tex = t; rec.flip = flip;
      mark('plate');
      try { renderer.initTexture(t); } catch { /* it uploads at its first draw */ }
      rec.ok = true; uploads++;
    }, () => { /* a missing picture: the dark sky stays */ });
  }
  let keepFirst = false;   // (the run is over: the FIRST band's plate is asked for again + kept — PLAY AGAIN never starts on a blank sky: the review)
  let heldKey = -1;        // (the plates wanted change only at a seam's edge: the list is walked then, not every frame)
  function holdPlates(a, b) {
    const key = a * 16 + b + (keepFirst ? 256 : 0);
    if (key === heldKey) return;
    heldKey = key;
    wantPlate(a); wantPlate(b); if (a === b) wantPlate(a + 1);
    if (keepFirst) wantPlate(0);
    plates.forEach((rec, k) => { if (k !== a && k !== b && !(a === b && k === a + 1) && !(keepFirst && k === 0)) { dropPlate(rec); plates.delete(k); } });
  }
  // THE REFLECTION MAP (the night HDRI's sky half, 256 × 64 — scripts/build-highrise-assets.py)
  const env = loader.load(new URL(`env-${look}.png?v=${HI_ART_REV}`, ART).href, () => { if (!dead) G.uEnvOn.value = 1; }, undefined, () => { /* no reflections: the glass keeps its colour + edges */ });
  env.colorSpace = THREE.NoColorSpace; env.generateMipmaps = false; env.minFilter = env.magFilter = THREE.LinearFilter; env.wrapS = THREE.RepeatWrapping;
  G.uEnv.value = env; made.push(env);

  // ---- EVERY BOX: one instanced mesh, one draw call
  const P = new THREE.Vector3(), S = new THREE.Vector3(), Q0 = new THREE.Quaternion(), QQ = new THREE.Quaternion(), EU = new THREE.Euler(), M = new THREE.Matrix4(), C = new THREE.Color(), V = new THREE.Vector3();
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const aColor = new THREE.InstancedBufferAttribute(new Float32Array(BOXES * 3), 3), aFx = new THREE.InstancedBufferAttribute(new Float32Array(BOXES * 4), 4);
  aColor.setUsage(THREE.DynamicDrawUsage); aFx.setUsage(THREE.DynamicDrawUsage);
  boxGeo.setAttribute('aColor', aColor); boxGeo.setAttribute('aFx', aFx);
  const glassMat = new THREE.ShaderMaterial({ vertexShader: GLASS_V, fragmentShader: GLASS_F, uniforms: { uBloom: G.uBloom, uTopY: G.uTopY, uFadeH: G.uFadeH, uEnv: G.uEnv, uEnvOn: G.uEnvOn, uEnvRot: G.uEnvRot }, transparent: true, depthWrite: true, extensions: { derivatives: true } });   // (derivatives: the edges' fwidth on a WebGL 1 phone — without it the whole tower failed to build there: the review)
  const boxes = new THREE.InstancedMesh(boxGeo, glassMat, BOXES);
  boxes.instanceMatrix.setUsage(THREE.DynamicDrawUsage); boxes.frustumCulled = false; boxes.count = 0; scene.add(boxes); made.push(boxGeo, glassMat);
  // THE BLOOM PASS's TWINS (S2 FIX — night-fx.js#createBloom "twins"): the same shader + the SAME uniforms, drawn only into the bloom's
  // target — so no material ever changes program between the screen and a target (three.js re-keyed it six times a frame)
  const TWINS = [];
  const twin = (mesh, m) => { const c = m.clone(); c.uniforms = m.uniforms; made.push(c); TWINS.push([mesh, c, null]); };
  twin(boxes, glassMat);
  let nb = 0;
  /** one box: its centre, its size, its colour (linear r g b), its glow · white flash · alpha · kind, its turn */
  function put(x, y, z, sx, sy, sz, c, glow, white, alpha, kind, q) {
    if (nb >= BOXES) return;
    P.set(x, y, z); S.set(sx, sy, sz); M.compose(P, q || Q0, S); boxes.setMatrixAt(nb, M);
    aColor.setXYZ(nb, c[0], c[1], c[2]); aFx.setXYZW(nb, glow, white, alpha, kind); nb++;
  }
  // a floor's colour (linear, cached): bands.js#slabColor — its band's set, blended round a seam
  const cols = new Map();
  let seed = '';
  function colOf(floor) {
    let c = cols.get(floor);
    if (!c) { const s = slabColor(look, seed, floor); C.setRGB(s[0], s[1], s[2], THREE.SRGBColorSpace); c = [C.r, C.g, C.b]; cols.set(floor, c); if (cols.size > 400) cols.delete(cols.keys().next().value); }
    return c;
  }

  // ---- THE SPARKS (GPU: a spark = its start, its throw, its birth — the shader flies it; nothing is stepped on the CPU)
  const quad = new THREE.InstancedBufferGeometry();
  quad.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0]), 3));
  quad.setIndex([0, 1, 2, 0, 2, 3]);
  const spO = new THREE.InstancedBufferAttribute(new Float32Array(SPARKS * 3), 3), spV = new THREE.InstancedBufferAttribute(new Float32Array(SPARKS * 3), 3), spT = new THREE.InstancedBufferAttribute(new Float32Array(SPARKS * 3), 3), spC = new THREE.InstancedBufferAttribute(new Float32Array(SPARKS * 3), 3);
  for (const a of [spO, spV, spT, spC]) a.setUsage(THREE.DynamicDrawUsage);
  for (let i = 0; i < SPARKS; i++) spT.setXYZ(i, -1e6, 1, 0);   // (born long ago: none flies)
  quad.setAttribute('aO', spO); quad.setAttribute('aV', spV); quad.setAttribute('aT', spT); quad.setAttribute('aC', spC);
  quad.instanceCount = SPARKS;
  const sparkMat = new THREE.ShaderMaterial({ vertexShader: SPARK_V, fragmentShader: SPARK_F, uniforms: { uTime: G.uTime, uAspect: G.uAspect }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const sparks = new THREE.Mesh(quad, sparkMat); sparks.frustumCulled = false; sparks.renderOrder = 20; scene.add(sparks); made.push(quad, sparkMat);
  twin(sparks, sparkMat);
  let spAt = 0, sparkN = 0;
  function spark(x, y, z, vx, vy, vz, life, size, c) {
    const i = spAt++ % SPARKS;
    spO.setXYZ(i, x, y, z); spV.setXYZ(i, vx, vy, vz); spT.setXYZ(i, clock / 1000, life, size); spC.setXYZ(i, c[0], c[1], c[2]);
    spO.needsUpdate = spV.needsUpdate = spT.needsUpdate = spC.needsUpdate = true; sparkN++;
  }

  // ---- THE RINGS OF LIGHT (a perfect's pulse, grow-back's, YOUR BEST's flash): flat on the slab's top, drawn in a shader
  const ringGeo = new THREE.InstancedBufferGeometry();
  ringGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, 0, -0.5, 0.5, 0, -0.5, 0.5, 0, 0.5, -0.5, 0, 0.5]), 3));
  ringGeo.setIndex([0, 2, 1, 0, 3, 2]);
  const rgA = new THREE.InstancedBufferAttribute(new Float32Array(RINGS * 4), 4), rgB = new THREE.InstancedBufferAttribute(new Float32Array(RINGS * 4), 4), rgP = new THREE.InstancedBufferAttribute(new Float32Array(RINGS * 4), 4);
  for (const a of [rgA, rgB, rgP]) a.setUsage(THREE.DynamicDrawUsage);
  for (let i = 0; i < RINGS; i++) rgB.setXYZW(i, 0, 0, 0, -1e6);
  ringGeo.setAttribute('aA', rgA); ringGeo.setAttribute('aB', rgB); ringGeo.setAttribute('aP', rgP);
  ringGeo.instanceCount = RINGS;
  const ringMat = new THREE.ShaderMaterial({ vertexShader: RING_V, fragmentShader: RING_F, uniforms: { uTime: G.uTime }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const rings = new THREE.Mesh(ringGeo, ringMat); rings.frustumCulled = false; rings.renderOrder = 15; scene.add(rings); made.push(ringGeo, ringMat);
  twin(rings, ringMat);
  let rgAt = 0, ringN = 0;
  /** a ring off the rect r (rule units) on top of `floor`: it runs `reach` (world) outward in `life` s */
  function ring(r, floor, reach, life, c, k = 1) {
    const i = rgAt++ % RINGS, hx = (r.x1 - r.x0) / 2 * U, hz = (r.z1 - r.z0) / 2 * U;
    rgP.setXYZW(i, (r.x0 + r.x1) / 2 * U, floor * H + 0.004, (r.z0 + r.z1) / 2 * U, k);
    rgA.setXYZW(i, hx, hz, reach, life); rgB.setXYZW(i, c[0], c[1], c[2], clock / 1000);
    rgA.needsUpdate = rgB.needsUpdate = rgP.needsUpdate = true; ringN++;
  }

  // ---- YOUR BEST's GOLD TAPE (S2 FIX): a THIN glowing gold OUTLINE round the slab of that floor — one line of light, no fill
  // (night-fx.js TAPE_F). Two small meshes on one box, only while a tape lies on the tower: the faces TOWARDS the camera, with depth
  // (the sliding slab passes in front of the line); the faces turned AWAY, faint, through the glass — and only once the tape lies
  // well under the top (TAPE_BACK_FROM … TAPE_BACK_FULL floors: never a diamond inside the top slab, where the player aims).
  const TAPE_H = 0.07, TAPE_OUT = 0.004, TAPE_BACK_FROM = 2, TAPE_BACK_FULL = 6;
  const TAPE_GOLD = [1, 0.56, 0.08];   // (a deeper, warmer gold than the flash's: beside the cyan + the blue slabs' own lines the page's #ffc83c read as lemon — the look review, twice)
  const tapeU = { uCol: { value: new THREE.Vector3(TAPE_GOLD[0], TAPE_GOLD[1], TAPE_GOLD[2]) }, uGlow: { value: 1 }, uWhite: { value: 0 }, uH: { value: TAPE_H }, uBloom: G.uBloom, uFace: { value: 1 } };
  const tapeBackU = { ...tapeU, uFace: { value: 0 } };
  const tapeGeo = new THREE.BoxGeometry(1, 1, 1);
  const tapeOpt = { vertexShader: TAPE_V, fragmentShader: TAPE_F, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, extensions: { derivatives: true } };
  const tapeMat = new THREE.ShaderMaterial({ ...tapeOpt, uniforms: tapeU, side: THREE.FrontSide, depthTest: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const tapeBackMat = new THREE.ShaderMaterial({ ...tapeOpt, uniforms: tapeBackU, side: THREE.BackSide, depthTest: false });
  const tape = new THREE.Mesh(tapeGeo, tapeMat); tape.frustumCulled = false; tape.renderOrder = 12; tape.visible = false; scene.add(tape); made.push(tapeGeo, tapeMat, tapeBackMat);
  const tapeBack = new THREE.Mesh(tapeGeo, tapeBackMat); tapeBack.frustumCulled = false; tapeBack.renderOrder = 11; tapeBack.visible = false; scene.add(tapeBack);
  twin(tape, tapeMat);
  twin(tapeBack, tapeBackMat); TWINS[TWINS.length - 1][1].visible = false;   // (the faint back edges are no light: not in the bloom pass)

  // ---- the pieces that fall away (a cut's overhang; a slab that missed) — pooled
  const pieces = Array.from({ length: PIECES }, () => ({ on: false, age: 0, x: 0, y: 0, z: 0, sx: 0, sz: 0, vx: 0, vy: 0, vz: 0, rx: 0, rz: 0, ax: 0, az: 0, c: GOLD, life: 1200 }));
  let pieceAt = 0;

  // ---- the run's own state in the view
  let T = null, slabs = [], top = null, clock = 0, tier = 2, bloom = null;
  let landAt = -1e9, landFloor = -1, perfAt = -1e9, grow = null, bump = 0, outAt = -1e9;
  let tapeFloor = 0, tapeAt = -1e9, sliderGlow = 0;
  let camX = 0, camY = 0, camZ = 0, dist = 14, w = 0, h = 0, dpr = 1, fitAsk = 2;
  let needWarm = true, warmed = 0, frames = 0, progN = 0;
  const HOT = [1, 0.86, 0.6];

  /** a new run / a tower adopted after a rebuild: the tower object (tower.js — the page feeds it the events) */
  function adopt(run, tower, snap = true) {
    T = tower; seed = run.seed; slabs = T.slabs(); top = T.top(); cols.clear(); if (snap) keepFirst = false;
    heldKey = -1;
    if (snap) {
      landAt = perfAt = outAt = tapeAt = -1e9; landFloor = -1; grow = null; bump = 0;
      for (const p of pieces) p.on = false;
      for (let i = 0; i < SPARKS; i++) spT.setX(i, -1e6); spT.needsUpdate = true;
      for (let i = 0; i < RINGS; i++) rgB.setW(i, -1e6); rgB.needsUpdate = true;
    }
    camY = slabs[slabs.length - 1].floor * H; camX = (top.x0 + top.x1) / 2 * U; camZ = (top.z0 + top.z1) / 2 * U;
  }

  /** the tower's hook: a cut's overhang (dx / dz = the side it hangs on) or a WHOLE slab that missed / slipped falls away */
  function fall(r, floor, dx, dz, whole) {
    const p = pieces[pieceAt++ % PIECES], c = colOf(floor);
    p.on = true; p.age = 0; p.c = c; p.life = whole ? 1500 : 1150;
    p.sx = (r.x1 - r.x0) * U; p.sz = (r.z1 - r.z0) * U;
    p.x = (r.x0 + r.x1) / 2 * U; p.y = (floor - 0.5) * H; p.z = (r.z0 + r.z1) / 2 * U;
    p.ax = p.az = 0;
    p.vx = dx * 0.55; p.vz = dz * 0.55; p.vy = whole ? 0 : 0.25;
    p.rx = whole ? 0.25 : dz * 1.9; p.rz = whole ? -0.2 : -dx * 1.9;
    if (whole || reduce) return;
    // THE SPARKS along the cut: the line where the piece left the slab
    const along = dx ? p.sz : p.sx, n = Math.max(6, Math.round(SPARKS_AT[tier] * Math.min(1, 0.35 + along)));
    const ex = dx ? (dx > 0 ? r.x0 : r.x1) * U : 0, ez = dz ? (dz > 0 ? r.z0 : r.z1) * U : 0, y = floor * H;
    for (let i = 0; i < n; i++) {
      const u = Math.random() - 0.5, sp = 0.5 + Math.random() * 1.9, up = 0.6 + Math.random() * 2.1;
      const x = dx ? ex : p.x + u * p.sx, z = dz ? ez : p.z + u * p.sz;
      spark(x, y - Math.random() * H * 0.8, z, dx * sp + (Math.random() - 0.5) * 0.7, up, dz * sp + (Math.random() - 0.5) * 0.7, 0.34 + Math.random() * 0.42, 0.006 + Math.random() * 0.006, Math.random() < 0.4 ? HOT : c);
    }
  }

  /** the run's EVENTS since the last frame, in order — AFTER the page fed them to the tower */
  function events(evs) {
    top = T.top();
    let perfect = 0, grew = null;
    for (const e of evs) {
      if (e.e === 'perfect') perfect = e.streak;
      else if (e.e === 'grow') grew = e;
      else if (e.e === 'land') {
        landAt = clock; landFloor = e.floor; bump = reduce ? 0 : 1;
        if (perfect) {
          perfAt = clock;
          const c = colOf(e.floor);
          ring(e, e.floor, 0.34 + Math.min(perfect, 8) * 0.03, 0.5, [0.55 + 0.45 * c[0], 0.55 + 0.45 * c[1], 0.55 + 0.45 * c[2]]);
          if (grew) { grow = { floor: e.floor, x: grew.axis === 'x', by: grew.by * U, at: clock }; ring(e, e.floor, 0.42, 0.6, c, 0.55); }
        }
        perfect = 0; grew = null;
      } else if (e.e === 'out') { outAt = clock; perfect = 0; grew = null; }
    }
  }

  /** YOUR BEST's gold tape: the floor it lies on (0 = none); `flash` = it was just crossed */
  function setBest(floor, flash = false) {
    tapeFloor = floor > 0 ? floor : 0;
    if (flash && tapeFloor) {
      tapeAt = clock;
      const s = slabOf(tapeFloor);
      if (s) ring(s, tapeFloor, 0.7, 0.9, GOLD, 0.85);
    }
  }
  const slabOf = floor => { for (let i = slabs.length - 1; i >= 0 && slabs[i].floor >= floor; i--) if (slabs[i].floor === floor) return slabs[i]; return null; };

  // ---- the size: a resize only ASKS; draw() resizes FIRST, then renders (JAYWALK's lesson: a resize after the frame = a blank frame)
  const fit = force => { fitAsk = Math.max(fitAsk, force ? 2 : 1); };
  function fitNow(force) {
    const nw = host.clientWidth, nh = host.clientHeight, nd = Math.min(devDpr, DPR_AT[tier]);
    if (!nw || !nh || (!force && nw === w && nh === h && nd === dpr)) return;
    w = nw; h = nh; dpr = nd;
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
    cam.aspect = w / h; dist = camDist(cam.aspect); cam.updateProjectionMatrix();
    G.uAspect.value = cam.aspect;
    // the plate COVERS the screen with SLACK of its height to drift through: what part of it shows (uv width, uv height)
    const tall = (1 + SLACK) * Math.max(1, cam.aspect / (PLATE_ASPECT * (1 + SLACK))), wide = tall * PLATE_ASPECT / cam.aspect;
    plateU.uFit.value.set(1 / wide, 1 / tall);
    if (bloom && tier === 2) bloom.size(Math.round(w * dpr), Math.round(h * dpr));
  }
  const ro = new ResizeObserver(() => fit());
  ro.observe(host);
  function setTier(t) {
    tier = t < 0 ? 0 : t > 2 ? 2 : t | 0;
    // (S2 FIX — THE LAG HUNT: the bloom, once built, is KEPT when the tier steps down — a phone whose frame rate is only CAPPED (Low
    //  Power Mode: the kit's probe steps 2 → 1 → 2 within four seconds) used to throw its programs + targets away and build them again
    //  mid-run; a bloom built AFTER the warm frame gets a warm frame of its own)
    if (tier === 2 && !bloom) { try { bloom = createBloom(renderer, G.uBloom); if (warmed) needWarm = true; } catch { bloom = null; } }
    mark('compile');
    fit(true);
  }
  setTier(o.tier == null ? 2 : o.tier);
  fitNow(true); fitAsk = 0;

  const cp = Math.cos(CAM.pitch * RAD), sp = Math.sin(CAM.pitch * RAD), sy = Math.sin(CAM.yaw * RAD), cy = Math.cos(CAM.yaw * RAD);
  function aim(dt) {
    const k = dt >= 1000 ? 1 : 1 - Math.exp(-dt / 140);
    const ty = slabs[slabs.length - 1].floor * H, tx = (top.x0 + top.x1) / 2 * U, tz = (top.z0 + top.z1) / 2 * U;
    camY += (ty - camY) * k; camX += (tx - camX) * k; camZ += (tz - camZ) * k;
    bump *= Math.exp(-dt / 90);
    const lookY = camY + CAM.lift - bump * 0.022;
    cam.position.set(camX + dist * cp * sy, lookY + dist * sp, camZ + dist * cp * cy);
    cam.lookAt(camX, lookY, camZ);
    cam.updateMatrixWorld();
  }

  /** THE WARM FRAME: a phone builds a program + uploads a mesh at its FIRST DRAW WITH SOMETHING IN IT — one of everything is put far
   *  below the tower, one hidden frame is rendered (the bloom too), then all is put back */
  function warm() {
    const t = clock / 1000;
    spO.setXYZ(0, 0, -60, 0); spT.setXYZ(0, t, 1, 0.01); spO.needsUpdate = spT.needsUpdate = true;
    rgP.setXYZW(0, 0, -60, 0, 1); rgA.setXYZW(0, 0.5, 0.5, 0.3, 1); rgB.setXYZW(0, 1, 1, 1, t); rgA.needsUpdate = rgB.needsUpdate = rgP.needsUpdate = true;
    nb = 0;
    for (const k of [KIND.slab, KIND.slider, KIND.tape, KIND.trail]) put(0, -60, 0, 0.01, 0.01, 0.01, GOLD, 1, 0, 1, k, null);
    boxes.count = nb; boxes.instanceMatrix.needsUpdate = aColor.needsUpdate = aFx.needsUpdate = true;
    const tapeWas = tape.visible, backWas = tapeBack.visible, faceWas = tapeBackU.uFace.value;   // (the tape's programs too: built here, not at the crossing)
    tape.visible = tapeBack.visible = true; tapeBackU.uFace.value = 0.2; tape.position.set(0, -60, 0); tape.scale.set(0.01, 0.01, 0.01); tapeBack.position.copy(tape.position); tapeBack.scale.copy(tape.scale);
    try { renderer.compile(scene, cam); renderer.render(scene, cam); if (bloom) bloom.render(scene, cam, plate, TWINS); } catch { /* a phone that can't: the kinds build as they come */ }
    mark('compile');
    spT.setX(0, -1e6); spT.needsUpdate = true; rgB.setW(0, -1e6); rgB.needsUpdate = true;
    tape.visible = tapeWas; tapeBack.visible = backWas; tapeBackU.uFace.value = faceWas;
    warmed++;
  }

  /** one frame: the run, `tau` = the clock in ticks (a fraction into the next one), `dt` ms since the last frame */
  function draw(run, tau, dt) {
    if (fitAsk) { const f = fitAsk === 2; fitAsk = 0; fitNow(f); }
    clock += dt; G.uTime.value = clock / 1000;
    renderer.info.reset();
    slabs = T.slabs(); top = T.top();
    aim(dt);
    if (needWarm && w && h) { needWarm = false; warm(); }
    const topFloor = slabs[slabs.length - 1].floor;
    G.uTopY.value = camY;
    // ---- the plates behind (the camera's own height in floors picks them: they cross-fade as it CLIMBS, not as a slab lands)
    const cf = Math.max(0, camY / H), mix = plateMix(cf);
    holdPlates(mix.a, mix.b);
    const pa = plates.get(mix.a), pb = plates.get(mix.b);
    plateU.tA.value = pa && pa.ok ? pa.tex : blank; plateU.uHaveA.value = pa && pa.ok ? 1 : 0; plateU.uFlipA.value = pa && pa.ok ? pa.flip : 0;
    plateU.tB.value = pb && pb.ok ? pb.tex : blank; plateU.uHaveB.value = pb && pb.ok ? 1 : 0; plateU.uFlipB.value = pb && pb.ok ? pb.flip : 0;
    plateU.uMix.value = mix.m; plateU.uDriftA.value = plateDrift(mix.a, cf); plateU.uDriftB.value = plateDrift(mix.b, cf);

    // ---- every box
    nb = 0;
    const landAge = clock - landAt, perfAge = clock - perfAt, first = slabs[0].floor;
    // THE BUILDING under the first slab: full-size floors of the same glass, each its own colour (the tower is a tower from the first second)
    if (first <= 0) for (let fl = Math.max(first - KEEP, topFloor - KEEP + 1); fl < first; fl++) put(0, (fl - 0.5) * H, 0, 1, H, 1, colOf(fl), 1, 0, 1, KIND.slab, null);
    for (let i = Math.max(0, slabs.length - KEEP); i < slabs.length; i++) {
      const s = slabs[i], isTop = s.floor === topFloor && s.floor === landFloor;
      let x0 = s.x0 * U, x1 = s.x1 * U, z0 = s.z0 * U, z1 = s.z1 * U, glow = 1, white = 0;
      if (isTop) {
        glow += 1.3 * Math.exp(-landAge / 130);
        if (perfAge < 700) white = 0.95 * Math.exp(-perfAge / 150);
        if (grow && grow.floor === s.floor) {
          // GROW-BACK: the slab swells out from the size it snapped to
          const k = clamp01((clock - grow.at) / 240), left = grow.by * (1 - k) * (1 - k) / 2;
          if (grow.x) { x0 += left; x1 -= left; } else { z0 += left; z1 -= left; }
          glow += 0.9 * (1 - k);
        }
      }
      put((x0 + x1) / 2, (s.floor - 0.5) * H, (z0 + z1) / 2, x1 - x0, H, z1 - z0, colOf(s.floor), glow, white, 1, KIND.slab, null);
    }
    // the sliding slab, eased between its two ticks — a stronger colour, a brighter edge, a short trail behind it
    const k0 = Math.floor(tau), a = slabAt(run, k0);
    if (a) {
      const b = slabAt(run, k0 + 1), f = tau - k0, mx = (a.x0 + a.x1) / 2, mz = (a.z0 + a.z1) / 2, c = colOf(a.floor);
      const x = (mx + ((b.x0 + b.x1) / 2 - mx) * f) * U, z = (mz + ((b.z0 + b.z1) / 2 - mz) * f) * U, y = (a.floor - 0.5) * H, sx = (a.x1 - a.x0) * U, sz = (a.z1 - a.z0) * U;
      sliderGlow += (1 - sliderGlow) * Math.min(1, dt / 90);
      put(x, y, z, sx, H, sz, c, 1.25 + 0.2 * sliderGlow, 0, 1, KIND.slider, null);
      if (tier > 0 && !reduce) {
        const v = (b.off - a.off) * U, dir = v > 0 ? 1 : v < 0 ? -1 : 0, len = Math.min(0.5, Math.abs(v) * 9);
        if (dir && len > 0.02) {
          if (a.axis === 'x') put(x - dir * (sx + len) / 2, y, z, len, H * 0.96, sz * 0.985, c, 1, dir, 0.8, KIND.trail, null);
          else put(x, y, z - dir * (sz + len) / 2, sx * 0.985, H * 0.96, len, c, 1, dir * 2, 0.8, KIND.trail, null);
        }
      }
    } else sliderGlow = 0;
    // the falling pieces
    for (const p of pieces) {
      if (!p.on) continue;
      p.age += dt;
      if (p.age > p.life) { p.on = false; continue; }
      const s = dt / 1000;
      p.vy -= 9 * s; p.x += p.vx * s; p.y += p.vy * s; p.z += p.vz * s; p.ax += p.rx * s; p.az += p.rz * s;
      QQ.setFromEuler(EU.set(p.ax, 0, p.az));
      put(p.x, p.y, p.z, p.sx, H, p.sz, p.c, 1.1, 0, clamp01(1.6 * (1 - p.age / p.life)), KIND.slab, QQ);
    }
    // YOUR BEST's gold tape: a THIN glowing gold OUTLINE round the slab of that floor — a line of light, never a filled band (S2 FIX)
    const ts = tapeFloor ? slabOf(tapeFloor) : null;
    // (the back edges come in as the tower climbs away from the tape — none while it lies just under the top)
    const back = ts ? TAPE_BACK * clamp01((topFloor - ts.floor - TAPE_BACK_FROM) / (TAPE_BACK_FULL - TAPE_BACK_FROM)) : 0;
    tape.visible = !!ts; tapeBack.visible = back > 0.004; tapeBackU.uFace.value = back;
    if (ts) {
      const x0 = ts.x0 * U, x1 = ts.x1 * U, z0 = ts.z0 * U, z1 = ts.z1 * U, age = clock - tapeAt;
      tape.position.set((x0 + x1) / 2, (ts.floor - 0.5) * H, (z0 + z1) / 2); tape.scale.set(x1 - x0 + 2 * TAPE_OUT, TAPE_H, z1 - z0 + 2 * TAPE_OUT);
      tapeBack.position.copy(tape.position); tapeBack.scale.copy(tape.scale);
      tapeU.uGlow.value = 1 + 1.6 * Math.exp(-age / 260); tapeU.uWhite.value = 0.6 * Math.exp(-age / 180);
    }
    boxes.count = nb; boxes.instanceMatrix.needsUpdate = true; aColor.needsUpdate = true; aFx.needsUpdate = true;
    renderer.render(scene, cam);
    if (bloom && tier === 2) bloom.render(scene, cam, plate, TWINS);
    // (a program built in THIS frame — anything the warm frame missed — is a hitch with a name: play.js's counter)
    const pn = renderer.info.programs ? renderer.info.programs.length : 0;
    if (pn !== progN) { progN = pn; mark('compile'); }
    frames++;
  }

  const zoneY = (x, z, f) => { V.set(x * U, f * H, z * U).project(cam); return (1 - V.y) / 2; };
  return {
    el, adopt, events, fall, draw, setTier, setBest, resize: () => fit(true),
    /** the run is over (the end card is up): the first band's plate comes back for the next run */
    rest() { keepFirst = true; },
    /** the view's own top slab (from the events) — the page's check: it equals the engine's */
    top: () => ({ ...top, floor: slabs[slabs.length - 1].floor }),
    /** a point (rule units x, z; y in floors) → [x, y] on the screen, 0 … 1 from the top left (as of the last frame's camera) */
    project(x, floor, z) { V.set(x * U, floor * H, z * U).project(cam); return [(1 + V.x) / 2, (1 - V.y) / 2]; },   // (a point BEHIND the camera comes back mirrored — a caller clamps its height first: play.js's tag)
    /** THE DROP ZONE's upper edge on the screen (0 … 1 from the top): the highest point the sliding slab's path reaches — nothing of a tag / a tape's label may sit under it */
    zoneTop() {
      const cx = (top.x0 + top.x1) / 2, cz = (top.z0 + top.z1) / 2, hw = (top.x1 - top.x0) / 2, hd = (top.z1 - top.z0) / 2, f = slabs[slabs.length - 1].floor + 1;
      // (five corners of the slab's path — no list built: this runs every frame while the tag shows)
      return Math.min(1, zoneY(cx - TRAVEL - hw, cz - hd, f), zoneY(cx - hw, cz - TRAVEL - hd, f), zoneY(cx - hw, cz - hd, f), zoneY(cx + TRAVEL + hw, cz - hd, f), zoneY(cx - hw, cz + TRAVEL + hd, f));
    },
    flashing: () => clock - perfAt < 460,
    falling: () => pieces.filter(p => p.on).length,
    info: () => ({ look, tier, bloom: !!bloom && tier === 2, warmed, uploads, frames, calls: renderer.info.render.calls, tris: renderer.info.render.triangles, programs: renderer.info.programs ? renderer.info.programs.length : 0, dpr, w, h, dist, slabs: slabs.length, boxes: nb, sparks: sparkN, rings: ringN, tape: tapeFloor, env: G.uEnvOn.value === 1, plates: [...plates.entries()].filter(([, r]) => r.ok).map(([k]) => k).sort(), held: [...plates.keys()].sort(), loads, mix: plateMix(Math.max(0, camY / H)), reduce }),
    destroy() {
      dead = true;
      ro.disconnect();
      plates.forEach(dropPlate);
      plates.clear();
      if (bloom) { bloom.dispose(); bloom = null; }
      scene.remove(plate, boxes, sparks, rings, tape, tapeBack);
      for (const m of made) m.dispose();
      renderer.dispose();
      try { renderer.forceContextLoss(); } catch { /* fine */ }
      el.width = el.height = 0;
      el.remove();
    },
  };
}
