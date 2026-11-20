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
import { slabInto } from './engine.js';
import { CAM, camDist, SLAB_H } from './camera.js';
import { plateMix, plateMixInto, plateDrift, slabColor, sliderColor, hazeInto, SLACK } from './bands.js';
import { PH, EV } from './trace.js';
import { GLASS_V, GLASS_F, PLATE_V, PLATE_F, SPARK_V, SPARK_F, RING_V, RING_F, TAPE_V, TAPE_F, TAPE_BACK, FLY_V, FLY_F, LIGHT_V, LIGHT_F, createBloom } from './night-fx.js';

const U = 1 / START, H = SLAB_H, RAD = Math.PI / 180;
/** the slabs kept drawn under the top (the rest is below the screen) */
export const KEEP = 40;
export const DPR_AT = Object.freeze([1.5, 2, 3]);
/** bump when a picture under assets/highrise/ is replaced */
export const HI_ART_REV = 1;
/** THE LOOK SWITCH (S3): a switch cross-fades in this long — once the other look's pictures are in (never a hitch) */
export const LOOK_FADE_MS = 1500;
/** … and it never waits longer than this for them (a dead connection: the switch goes on, the sky plain until they come) */
export const LOOK_WAIT_MS = 5000;
/** THE DAY LOOK's SUN: behind the tower, on the left (the face turned to it is lit, the other in cool shade; a slab's shadow falls on the ledge towards the camera's right) */
export const SUN = Object.freeze([-0.42, 0.78, 0.46]);
const ART = new URL('../../../assets/highrise/', import.meta.url);
const PLATE_ASPECT = 720 / 1280;
const PIECES = 8, TAPE = 4, BOXES = KEEP + 1 + 2 + PIECES + TAPE, SPARKS = 224, RINGS = 4;
/** THE FLYERS' STAGE (S3): the bodies on screen at once (two jets, or the UFO; THE MOTHERSHIP) · every light they carry */
export const FLY_SLOTS = 3, LIGHTS = 320;
/** DEEP SPACE (S3 — solo, past THE MOTHERSHIP): the drifting stars + the aurora come in over these floors */
export const SPACE_FROM = 200, SPACE_FULL = 212;
/** THE POSES (S4A FIX's add-ons): how far down the screen the tower stands, a share of the screen's height · the end screen's ghost floats this many floors over the top slab */
export const POSE = Object.freeze({ play: 0, welcome: 0.15, end: 0.1 });
/** THE END's GHOST (YOUR BEST still above you — the dashed gold outline): never thinner than GHOST_MIN (world units — a slab's side is 1: a
 *  top slab cut to a sliver still gets an outline that reads), and it FLOATS CLEAR of the tower — its near corner GHOST_GAP floors over
 *  the top slab's far corner as the diagonal camera sees them: ghostUp(sx, sz) = how many floors over the top slab it hangs */
export const GHOST_MIN = 0.62, GHOST_GAP = 1.4;
export const ghostUp = (sx, sz) => GHOST_GAP + (Math.max(GHOST_MIN, sx) + Math.max(GHOST_MIN, sz)) * Math.tan(CAM.pitch * Math.PI / 180) / (Math.SQRT2 * SLAB_H);
const SPARKS_AT = [12, 22, 34];            // a cut's sparks by tier (× its length)
// (S4A FIX — every colour + rect a frame READS is a Float64Array: a list of fractions read as a plain array hands each one over as a
//  small object in a browser's engine once two kinds of list meet at the same line — forty slabs, seven reads a slab, every frame)
const F64 = a => Float64Array.from(a);
const GOLD = F64([1, 0.78, 0.2]), BG = 0x0a0716;
// (THE DAY LOOK's lights are PAINT — night-fx.js: a cut's sparks WARM GOLD, a perfect's ring GOLD-WHITE)
const DAY_SPARK = F64([1, 0.46, 0.03]), DAY_SPARK_HOT = F64([1, 0.76, 0.22]), DAY_RING = F64([1, 0.72, 0.16]), DAY_SPARK_SIZE = 1.7;
const NO_UP = F64([1, 0, 1, 0]);
const KIND = { slab: 0, slider: 2, tape: 3, trail: 4 };
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const LOOK_IDS = ['night', 'day'];

export function createNight(host, o = {}) {
  // THE LOOK (S3 — docs/highrise.md "THE LOOK SWITCH"): `target` = the look asked for; `dayK` = where the picture is (0 night … 1 day).
  // A switch first brings the other look's pictures in (decoded + uploaded off the frame), THEN cross-fades over LOOK_FADE_MS; when
  // it has settled only the look on screen keeps its plates + its reflection map.
  let target = o.look === 'day' ? 'day' : 'night', dayK = target === 'day' ? 1 : 0, fading = false, waited = 0, switches = 0;
  const lookNow = () => (dayK >= 0.5 ? 'day' : 'night');
  /** THE HITCH COUNTER's cause marks (play.js): 'plate' = a picture uploaded · 'compile' = a program built / the tier stepped */
  const mark = typeof o.mark === 'function' ? o.mark : () => {};
  /** THE ON-PHONE TRACE (S4A FIX 2 — `?trace=1`: trace.js): the frame's phases inside the scene (the flyers · the render · the bloom); null = off */
  const TRC = o.trace || null;
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
  const G = { uBloom: { value: 0 }, uTime: { value: 0 }, uTopY: { value: 0 }, uFadeH: { value: 3.5 }, uEnv: { value: null }, uEnvOn: { value: 0 }, uEnvFlip: { value: 0 }, uEnvD: { value: null }, uEnvDOn: { value: 0 }, uEnvDFlip: { value: 0 }, uEnvRot: { value: 0.18 }, uAspect: { value: 1 },
    uDay: { value: dayK }, uSun: { value: new THREE.Vector3(SUN[0], SUN[1], SUN[2]).normalize() }, uHaze: { value: new THREE.Vector3(0.4, 0.65, 0.9) } };
  const made = [];   // (everything to dispose)

  // ---- THE PLATES: a screen-filling quad behind everything
  const blank = new THREE.DataTexture(new Uint8Array([10, 7, 22, 255]), 1, 1); blank.needsUpdate = true; made.push(blank);
  const plateU = { tA: { value: blank }, tB: { value: blank }, tC: { value: blank }, tD: { value: blank }, uMix: { value: 0 }, uHaveA: { value: 0 }, uHaveB: { value: 0 }, uHaveC: { value: 0 }, uHaveD: { value: 0 }, uDriftA: { value: 0 }, uDriftB: { value: 0 }, uFit: { value: new THREE.Vector2(1, 1) }, uDim: { value: 0.92 }, uFlipA: { value: 0 }, uFlipB: { value: 0 }, uFlipC: { value: 0 }, uFlipD: { value: 0 },
    uDay: G.uDay, uSpace: { value: 0 }, uTime: G.uTime, uAspect: G.uAspect };
  const plateMat = new THREE.ShaderMaterial({ vertexShader: PLATE_V, fragmentShader: PLATE_F, uniforms: plateU, depthTest: false, depthWrite: false });
  const plateGeo = new THREE.PlaneGeometry(2, 2), plate = new THREE.Mesh(plateGeo, plateMat);
  plate.frustumCulled = false; plate.renderOrder = -100; scene.add(plate); made.push(plateMat, plateGeo);
  const SETS = { night: new Map(), day: new Map() };   // look → band → { tex, ok, done } — ONLY the look(s) on screen, ONLY the current band + the next
  let dead = false, loads = 0, uploads = 0;
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
  /** a picture of ours (a plate, a reflection map) → a texture already ON the GPU: decoded off the frame, uploaded at once */
  const upload = (image, flip, rec, srgb, wrap) => {
    const t = new THREE.Texture(image);
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.generateMipmaps = false; t.minFilter = t.magFilter = THREE.LinearFilter; t.flipY = !flip; if (wrap) t.wrapS = THREE.RepeatWrapping; t.needsUpdate = true;
    rec.tex = t; rec.flip = flip;
    mark('plate');
    try { renderer.initTexture(t); } catch { /* it uploads at its first draw */ }
    rec.ok = true; uploads++;
  };
  function wantPlate(look, band) {
    const plates = SETS[look];
    if (plates.has(band) || band < 0 || band > 4) return;
    const rec = { tex: null, ok: false, flip: 0, done: false };
    plates.set(band, rec); loads++;
    loadPicture(new URL(`plates/${look}-${band + 1}.webp?v=${HI_ART_REV}`, ART).href).then(({ image, flip }) => {
      rec.done = true;
      if (dead || plates.get(band) !== rec) { if (image.close) image.close(); return; }
      upload(image, flip, rec, true, false);
    }, () => { rec.done = true; /* a missing picture: the plain sky stays */ });
  }
  let keepFirst = false;   // (the run is over: the FIRST band's plate is asked for again + kept — PLAY AGAIN never starts on a blank sky: the review)
  let heldKey = -1;        // (the plates wanted change only at a seam's edge — or at a look switch: the list is walked then, not every frame)
  /** the look(s) whose pictures are held now: the one on screen — and, through a switch, the one coming */
  const holds = look => (look === 'day' ? dayK > 0 || target === 'day' : dayK < 1 || target === 'night');
  // (S4A FIX — ZERO GARBAGE: holdPlates runs EVERY frame, so it holds no function of its own inside it — a function whose own numbers
  //  an inner function reads is given a fresh record for them at EVERY call, used or not; the two plates wanted sit out here instead)
  let wantA = -1, wantB = -1;
  const dropUnwanted = (rec, k, plates) => { if (k !== wantA && k !== wantB && !(wantA === wantB && k === wantA + 1) && !(keepFirst && k === 0)) { dropPlate(rec); plates.delete(k); } };
  function holdPlates(a, b) {
    const key = a * 16 + b + (keepFirst ? 256 : 0) + (holds('night') ? 512 : 0) + (holds('day') ? 1024 : 0) + (target === 'day' ? 2048 : 0);
    if (key === heldKey) return;
    heldKey = key; wantA = a; wantB = b;
    for (let li = 0; li < LOOK_IDS.length; li++) {
      const look = LOOK_IDS[li], plates = SETS[look];
      if (!holds(look)) { plates.forEach(dropPlate); plates.clear(); dropEnv(look); continue; }
      wantEnv(look);
      // S4B — PRE-WARM (the owner's iPhone trace: a 65 ms first-time set-up at floor 80): THE LOOK ON SCREEN holds ALL FIVE of its
      // plates from the welcome screen on — decoded + uploaded before the first tap, never at a seam (18 MB on the GPU; it was two).
      // A look on its way OUT through a switch keeps what it has until it is let go.
      if (look === target) { for (let k = 0; k < 5; k++) wantPlate(look, k); continue; }
      wantPlate(look, a); wantPlate(look, b); if (a === b) wantPlate(look, a + 1);
      if (keepFirst) wantPlate(look, 0);
      plates.forEach(dropUnwanted);
    }
  }
  // THE REFLECTION MAPS (each look's HDRI — its sky half, 256 × 64: scripts/build-highrise-assets.py): the night's in uEnv, the day's in
  // uEnvD; only the look(s) on screen keep theirs. Through the same decode-ahead loader as the plates (a look switch never hitches).
  const ENVS = { night: { tex: null, ok: false, flip: 0, done: false, asked: false, u: G.uEnv, on: G.uEnvOn, fl: G.uEnvFlip }, day: { tex: null, ok: false, flip: 0, done: false, asked: false, u: G.uEnvD, on: G.uEnvDOn, fl: G.uEnvDFlip } };
  G.uEnv.value = blank; G.uEnvD.value = blank;
  function wantEnv(look) {
    const rec = ENVS[look];
    if (rec.asked) return;
    rec.asked = true; rec.done = false;
    loadPicture(new URL(`env-${look}.png?v=${HI_ART_REV}`, ART).href).then(({ image, flip }) => {
      rec.done = true;
      if (dead || !rec.asked) { if (image.close) image.close(); return; }
      if (rec.tex) dropPlate(rec);   // (asked twice through a quick switch there and back: the first one goes)
      upload(image, flip, rec, false, true);
      rec.u.value = rec.tex; rec.fl.value = flip; rec.on.value = 1;
    }, () => { rec.done = true; /* no reflections: the glass keeps its colour + edges */ });
  }
  function dropEnv(look) { const rec = ENVS[look]; if (!rec.asked) return; rec.asked = false; rec.on.value = 0; rec.u.value = blank; dropPlate(rec); }
  /** the look coming: are its pictures in (or known missing)? — the cross-fade waits for them */
  const lookReady = (look, a, b) => { const e = ENVS[look], pa = SETS[look].get(a), pb = SETS[look].get(b); return e.done && !!pa && pa.done && !!pb && pb.done; };

  // ---- EVERY BOX: one instanced mesh, one draw call
  const P = new THREE.Vector3(), S = new THREE.Vector3(), Q0 = new THREE.Quaternion(), QQ = new THREE.Quaternion(), EU = new THREE.Euler(), M = new THREE.Matrix4(), C = new THREE.Color(), V = new THREE.Vector3();
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const aColor = new THREE.InstancedBufferAttribute(new Float32Array(BOXES * 3), 3), aFx = new THREE.InstancedBufferAttribute(new Float32Array(BOXES * 4), 4), aUp = new THREE.InstancedBufferAttribute(new Float32Array(BOXES * 4), 4);
  aColor.setUsage(THREE.DynamicDrawUsage); aFx.setUsage(THREE.DynamicDrawUsage); aUp.setUsage(THREE.DynamicDrawUsage);
  boxGeo.setAttribute('aColor', aColor); boxGeo.setAttribute('aFx', aFx); boxGeo.setAttribute('aUp', aUp);
  const glassMat = new THREE.ShaderMaterial({ vertexShader: GLASS_V, fragmentShader: GLASS_F, uniforms: { uBloom: G.uBloom, uTopY: G.uTopY, uFadeH: G.uFadeH, uEnv: G.uEnv, uEnvOn: G.uEnvOn, uEnvFlip: G.uEnvFlip, uEnvD: G.uEnvD, uEnvDOn: G.uEnvDOn, uEnvDFlip: G.uEnvDFlip, uEnvRot: G.uEnvRot, uDay: G.uDay, uSun: G.uSun, uHaze: G.uHaze }, transparent: true, depthWrite: true, extensions: { derivatives: true } });   // (derivatives: the edges' fwidth on a WebGL 1 phone — without it the whole tower failed to build there: the review)
  const boxes = new THREE.InstancedMesh(boxGeo, glassMat, BOXES);
  boxes.instanceMatrix.setUsage(THREE.DynamicDrawUsage); boxes.frustumCulled = false; boxes.count = 0; scene.add(boxes); made.push(boxGeo, glassMat);
  // THE BLOOM PASS's TWINS (S2 FIX — night-fx.js#createBloom "twins"): the same shader + the SAME uniforms, drawn only into the bloom's
  // target — so no material ever changes program between the screen and a target (three.js re-keyed it six times a frame)
  const TWINS = [];
  const twin = (mesh, m) => { const c = m.clone(); c.uniforms = m.uniforms; made.push(c); TWINS.push([mesh, c, null]); };
  twin(boxes, glassMat);
  let nb = 0;
  // ZERO GARBAGE (S4A FIX): a box's NUMBERS go through ONE scratch of doubles — BX = its centre (0 1 2), its size (3 4 5), its glow ·
  // white flash · alpha · kind (6 7 8 9) — and from there straight into the instance buffers (a call that hands a browser's engine
  // ten fractions makes ten small objects of them, fifty boxes a frame; a slab that is not turned needs no matrix maths at all)
  const BX = new Float64Array(10), IM = boxes.instanceMatrix.array, AC = aColor.array, AF = aFx.array, AU = aUp.array;
  /** one box: BX (above) + its colour (linear r g b), its turn (null = none); `up` = the slab lying ON it (world x0, x1, z0, z1 — THE
   *  DAY LOOK's ledge shadow), or none */
  function put(c, q, up) {
    if (nb >= BOXES) return;
    const o = nb * 16, o3 = nb * 3, o4 = nb * 4, u = up || NO_UP;
    if (q) { P.set(BX[0], BX[1], BX[2]); S.set(BX[3], BX[4], BX[5]); M.compose(P, q, S); M.toArray(IM, o); }
    else {
      IM[o] = BX[3]; IM[o + 1] = 0; IM[o + 2] = 0; IM[o + 3] = 0; IM[o + 4] = 0; IM[o + 5] = BX[4]; IM[o + 6] = 0; IM[o + 7] = 0;
      IM[o + 8] = 0; IM[o + 9] = 0; IM[o + 10] = BX[5]; IM[o + 11] = 0; IM[o + 12] = BX[0]; IM[o + 13] = BX[1]; IM[o + 14] = BX[2]; IM[o + 15] = 1;
    }
    AC[o3] = c[0]; AC[o3 + 1] = c[1]; AC[o3 + 2] = c[2];
    AF[o4] = BX[6]; AF[o4 + 1] = BX[7]; AF[o4 + 2] = BX[8]; AF[o4 + 3] = BX[9];
    AU[o4] = u[0]; AU[o4 + 1] = u[1]; AU[o4 + 2] = u[2]; AU[o4 + 3] = u[3];
    nb++;
  }
  // a floor's colour (linear, cached a look): bands.js#slabColor — its band's set, blended round a seam; through a look switch the
  // two looks' colours are blended (one scratch colour: put() copies it at once)
  // (the cache: a RING of 128 kept colours a look — a floor's slot = floor & 127; the floors on screen (forty slabs + the building's
  //  forty under the first) never share one. A floor's colour is worked out once, when it first shows — nothing is made after that)
  const COL_N = 128, mkCols = () => ({ at: new Int32Array(COL_N).fill(-1e9), c: Array.from({ length: COL_N }, () => new Float64Array(3)) });
  const COLS = { night: mkCols(), day: mkCols() }, CMIX = new Float64Array(3), UPV = new Float64Array(4);
  let seed = '';
  function colIn(look, floor) {
    const cols = COLS[look], k = floor & (COL_N - 1), c = cols.c[k];
    if (cols.at[k] !== floor) { const s = slabColor(look, seed, floor); C.setRGB(s[0], s[1], s[2], THREE.SRGBColorSpace); c[0] = C.r; c[1] = C.g; c[2] = C.b; cols.at[k] = floor; }
    return c;
  }
  const colOf = floor => colIn(lookNow(), floor);
  // (the SLIDING slab's: by day its band's accent — bands.js#sliderColor; one slab at a time: worked out when its floor / the look changes)
  const SLD = new Float64Array(3);
  let sldFloor = -1, sldK = -1;
  function colSlider(floor) {
    if (floor !== sldFloor || dayK !== sldK) {
      sldFloor = floor; sldK = dayK;
      const n = colIn('night', floor);
      if (dayK <= 0) { SLD[0] = n[0]; SLD[1] = n[1]; SLD[2] = n[2]; }
      else { const d = sliderColor('day', seed, floor); C.setRGB(d[0], d[1], d[2], THREE.SRGBColorSpace); SLD[0] = n[0] + (C.r - n[0]) * dayK; SLD[1] = n[1] + (C.g - n[1]) * dayK; SLD[2] = n[2] + (C.b - n[2]) * dayK; }
    }
    return SLD;
  }
  function colMix(floor) {
    if (dayK <= 0) return colIn('night', floor);
    if (dayK >= 1) return colIn('day', floor);
    const a = colIn('night', floor), b = colIn('day', floor);
    CMIX[0] = a[0] + (b[0] - a[0]) * dayK; CMIX[1] = a[1] + (b[1] - a[1]) * dayK; CMIX[2] = a[2] + (b[2] - a[2]) * dayK;
    return CMIX;
  }

  // (S3 — a LIGHT in both looks through ONE program: ONE · ONE_MINUS_SRC_ALPHA — by night its alpha is 0 (added light, as it was), by
  //  day it is paint in its own colour: night-fx.js)
  const LIGHT_BLEND = { blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor };
  // ---- THE SPARKS (GPU: a spark = its start, its throw, its birth — the shader flies it; nothing is stepped on the CPU)
  const quad = new THREE.InstancedBufferGeometry();
  quad.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0]), 3));
  quad.setIndex([0, 1, 2, 0, 2, 3]);
  const spO = new THREE.InstancedBufferAttribute(new Float32Array(SPARKS * 3), 3), spV = new THREE.InstancedBufferAttribute(new Float32Array(SPARKS * 3), 3), spT = new THREE.InstancedBufferAttribute(new Float32Array(SPARKS * 3), 3), spC = new THREE.InstancedBufferAttribute(new Float32Array(SPARKS * 3), 3);
  for (const a of [spO, spV, spT, spC]) a.setUsage(THREE.DynamicDrawUsage);
  for (let i = 0; i < SPARKS; i++) spT.setXYZ(i, -1e6, 1, 0);   // (born long ago: none flies)
  quad.setAttribute('aO', spO); quad.setAttribute('aV', spV); quad.setAttribute('aT', spT); quad.setAttribute('aC', spC);
  quad.instanceCount = SPARKS;
  const sparkMat = new THREE.ShaderMaterial({ vertexShader: SPARK_V, fragmentShader: SPARK_F, uniforms: { uTime: G.uTime, uAspect: G.uAspect, uDay: G.uDay }, transparent: true, depthWrite: false, ...LIGHT_BLEND });
  const sparks = new THREE.Mesh(quad, sparkMat); sparks.frustumCulled = false; sparks.renderOrder = 20; scene.add(sparks); made.push(quad, sparkMat);
  twin(sparks, sparkMat);
  let spAt = 0, sparkN = 0, spLo = 0, spCount = 0;
  // (S4A FIX 2 — ONLY THE CHANGED RANGE goes to the GPU: the sparks written since the last frame are one run of the ring — `spLo`,
  //  `spCount` — sent at the frame's draw; a run that wraps round the ring's end sends the whole buffer)
  function spark(x, y, z, vx, vy, vz, life, size, c) {
    const i = spAt++ % SPARKS;
    if (!spCount) spLo = i;
    spO.setXYZ(i, x, y, z); spV.setXYZ(i, vx, vy, vz); spT.setXYZ(i, NUM[CLK] / 1000, life, size); spC.setXYZ(i, c[0], c[1], c[2]);
    spCount++; sparkN++;
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
  const ringMat = new THREE.ShaderMaterial({ vertexShader: RING_V, fragmentShader: RING_F, uniforms: { uTime: G.uTime, uDay: G.uDay }, transparent: true, depthWrite: false, ...LIGHT_BLEND, side: THREE.DoubleSide });
  const rings = new THREE.Mesh(ringGeo, ringMat); rings.frustumCulled = false; rings.renderOrder = 15; scene.add(rings); made.push(ringGeo, ringMat);
  twin(rings, ringMat);
  let rgAt = 0, ringN = 0;
  /** a ring off the rect r (rule units) on top of `floor`: it runs `reach` (world) outward in `life` s */
  function ring(r, floor, reach, life, c, k = 1) {
    const i = rgAt++ % RINGS, hx = (r.x1 - r.x0) / 2 * U, hz = (r.z1 - r.z0) / 2 * U;
    rgP.setXYZW(i, (r.x0 + r.x1) / 2 * U, floor * H + 0.004, (r.z0 + r.z1) / 2 * U, k);
    rgA.setXYZW(i, hx, hz, reach, life); rgB.setXYZW(i, c[0], c[1], c[2], NUM[CLK] / 1000);
    rgA.needsUpdate = rgB.needsUpdate = rgP.needsUpdate = true; ringN++;
  }

  // ONE RANGE OF AN ATTRIBUTE TO THE GPU (S4A FIX 2): three's own kept range record (`_updateRange` — its `addUpdateRange()` makes a new
  // record at every call: garbage in a frame); a three without it sends the whole buffer, as before
  const upRange = (a, off, cnt) => { const u = a._updateRange; if (u && cnt > 0) { u.offset = off; u.count = cnt; } a.needsUpdate = true; };
  // THE LANDING FRAME's LATER JOBS (S4A FIX 2 — the owner's iPhone: a stall after a touch, the UFO jumping at every landing): the frame a
  // slab lands draws ONLY what must be instant — the slab snapped into place (+ the overhang it lost, beside it: the same box, one
  // record) and its flash; its sound started in the touch itself. A perfect's RING, grow-back's, and a cut's SPARK BURST are JOBS for the
  // NEXT frame: a tiny queue, its room made once (JQ slots — a kind, the frame it is due, its numbers).
  const JQ = 8, JN = 12, jKind = new Int8Array(JQ), jDue = new Int32Array(JQ), jArg = new Float64Array((JQ + 1) * JN), JR = { x0: 0, x1: 0, z0: 0, z1: 0 }, JC = new Float64Array(3);
  const J_RING = 1, J_SPARKS = 2;
  let jobsRun = 0;
  /** a job's slot (its numbers are written straight into jArg at slot × JN) — −1 = the queue is full: the caller does it now */
  function jobSlot(kind) { for (let i = 0; i < JQ; i++) if (!jKind[i]) { jKind[i] = kind; jDue[i] = frames + 1; return i; } return -1; }
  function ringLater(r, floor, reach, life, c, k = 1) {
    const i = jobSlot(J_RING);
    if (i < 0) { ring(r, floor, reach, life, c, k); return; }
    const o = i * JN;
    jArg[o] = r.x0; jArg[o + 1] = r.x1; jArg[o + 2] = r.z0; jArg[o + 3] = r.z1; jArg[o + 4] = floor; jArg[o + 5] = reach; jArg[o + 6] = life; jArg[o + 7] = c[0]; jArg[o + 8] = c[1]; jArg[o + 9] = c[2]; jArg[o + 10] = k;
  }
  function runJobs() {
    for (let i = 0; i < JQ; i++) {
      if (!jKind[i] || jDue[i] > frames) continue;
      const o = i * JN, kind = jKind[i];
      jKind[i] = 0; jobsRun++;
      if (TRC) TRC.ev |= EV.deferred;
      if (kind === J_RING) { JR.x0 = jArg[o]; JR.x1 = jArg[o + 1]; JR.z0 = jArg[o + 2]; JR.z1 = jArg[o + 3]; JC[0] = jArg[o + 7]; JC[1] = jArg[o + 8]; JC[2] = jArg[o + 9]; ring(JR, jArg[o + 4], jArg[o + 5], jArg[o + 6], JC, jArg[o + 10]); }
      else if (kind === J_SPARKS) sparksNow(o);
    }
  }

  // ---- YOUR BEST's GOLD TAPE (S2 FIX): a THIN glowing gold OUTLINE round the slab of that floor — one line of light, no fill
  // (night-fx.js TAPE_F). Two small meshes on one box, only while a tape lies on the tower: the faces TOWARDS the camera, with depth
  // (the sliding slab passes in front of the line); the faces turned AWAY, faint, through the glass — and only once the tape lies
  // well under the top (TAPE_BACK_FROM … TAPE_BACK_FULL floors: never a diamond inside the top slab, where the player aims).
  const TAPE_H = 0.07, TAPE_OUT = 0.004, TAPE_BACK_FROM = 2, TAPE_BACK_FULL = 6;
  const TAPE_GOLD = [1, 0.56, 0.08];   // (a deeper, warmer gold than the flash's: beside the cyan + the blue slabs' own lines the page's #ffc83c read as lemon — the look review, twice)
  const tapeU = { uCol: { value: new THREE.Vector3(TAPE_GOLD[0], TAPE_GOLD[1], TAPE_GOLD[2]) }, uGlow: { value: 1 }, uWhite: { value: 0 }, uH: { value: TAPE_H }, uBloom: G.uBloom, uFace: { value: 1 }, uDay: G.uDay, uCore: { value: 0 }, uDash: { value: 0 } };
  const tapeBackU = { ...tapeU, uFace: { value: 0 } };
  const tapeGeo = new THREE.BoxGeometry(1, 1, 1);
  const tapeOpt = { vertexShader: TAPE_V, fragmentShader: TAPE_F, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, extensions: { derivatives: true } };
  const tapeMat = new THREE.ShaderMaterial({ ...tapeOpt, uniforms: tapeU, side: THREE.FrontSide, depthTest: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const tapeBackMat = new THREE.ShaderMaterial({ ...tapeOpt, uniforms: tapeBackU, side: THREE.BackSide, depthTest: false });
  const tape = new THREE.Mesh(tapeGeo, tapeMat); tape.frustumCulled = false; tape.renderOrder = 12; tape.visible = false; scene.add(tape); made.push(tapeGeo, tapeMat, tapeBackMat);
  const tapeBack = new THREE.Mesh(tapeGeo, tapeBackMat); tapeBack.frustumCulled = false; tapeBack.renderOrder = 11; tapeBack.visible = false; scene.add(tapeBack);
  twin(tape, tapeMat);
  twin(tapeBack, tapeBackMat); TWINS[TWINS.length - 1][1].visible = false;   // (the faint back edges are no light: not in the bloom pass)
  // ---- THE NEXT FRIEND's PINK TAPE (S4A — the owner: "the gold tape's style", in PINK): the SAME box, the SAME shader — so the SAME
  // program (a second tape builds nothing: THE LAG RULES) — with its own colour + its own flash; its twins for the bloom pass too
  const TAPE_PINK = [1, 0.2, 0.72];
  // (S4A FIX — A WHITE CORE inside the pink: uCore = 1 — night-fx.js TAPE_F; it read only by its glow over the rooftops' own pink slabs)
  const ftapeU = { ...tapeU, uCol: { value: new THREE.Vector3(TAPE_PINK[0], TAPE_PINK[1], TAPE_PINK[2]) }, uGlow: { value: 1 }, uWhite: { value: 0 }, uCore: { value: 1 }, uDash: { value: 0 } };
  const ftapeBackU = { ...ftapeU, uFace: { value: 0 } };
  const ftapeMat = new THREE.ShaderMaterial({ ...tapeOpt, uniforms: ftapeU, side: THREE.FrontSide, depthTest: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const ftapeBackMat = new THREE.ShaderMaterial({ ...tapeOpt, uniforms: ftapeBackU, side: THREE.BackSide, depthTest: false });
  const ftape = new THREE.Mesh(tapeGeo, ftapeMat); ftape.frustumCulled = false; ftape.renderOrder = 12; ftape.visible = false; scene.add(ftape); made.push(ftapeMat, ftapeBackMat);
  const ftapeBack = new THREE.Mesh(tapeGeo, ftapeBackMat); ftapeBack.frustumCulled = false; ftapeBack.renderOrder = 11; ftapeBack.visible = false; scene.add(ftapeBack);
  twin(ftape, ftapeMat);
  twin(ftapeBack, ftapeBackMat); TWINS[TWINS.length - 1][1].visible = false;

  // ---- THE FLYERS' STAGE (S3 — docs/highrise.md "THE FLYERS"): what flyers.js (a LAZY module — its models + sounds come with it)
  // draws through. Its two programs are BUILT IN THE WARM FRAME on a stand-in triangle; a model that lands later brings only its
  // buffers. FLY_SLOTS bodies (each its own material: its opacity, its tint, its lights), ONE instanced quad for every light.
  const standIn = new THREE.BufferGeometry();
  standIn.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0.01, 0, 0, 0, 0.01, 0], 3));
  standIn.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
  standIn.setAttribute('color', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0, 0, 0, 0], 3));
  made.push(standIn);
  const flySlots = [];
  for (let i = 0; i < FLY_SLOTS; i++) {
    const u = { uDay: G.uDay, uBloom: G.uBloom, uSun: G.uSun, uOpacity: { value: 1 }, uHazeK: { value: 0 }, uHazeC: { value: new THREE.Vector3() }, uLift: { value: 0 }, uTint: { value: new THREE.Vector3(1, 1, 1) }, uRim: { value: new THREE.Vector3() }, uEmit: { value: new THREE.Vector3() } };
    const m = new THREE.ShaderMaterial({ vertexShader: FLY_V, fragmentShader: FLY_F, uniforms: u, transparent: true, depthWrite: true, side: THREE.DoubleSide, forceSinglePass: true });
    const mesh = new THREE.Mesh(standIn, m);
    mesh.frustumCulled = false; mesh.renderOrder = -50; mesh.visible = false; mesh.matrixAutoUpdate = false; scene.add(mesh); made.push(m);
    twin(mesh, m);
    flySlots.push({ mesh, u });
  }
  const lgGeo = new THREE.InstancedBufferGeometry();
  lgGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0]), 3));
  lgGeo.setIndex([0, 1, 2, 0, 2, 3]);
  const lgP = new THREE.InstancedBufferAttribute(new Float32Array(LIGHTS * 4), 4), lgQ = new THREE.InstancedBufferAttribute(new Float32Array(LIGHTS * 4), 4), lgC = new THREE.InstancedBufferAttribute(new Float32Array(LIGHTS * 3), 3), lgA = new THREE.InstancedBufferAttribute(new Float32Array(LIGHTS * 3), 3);
  for (const a of [lgP, lgQ, lgC, lgA]) a.setUsage(THREE.DynamicDrawUsage);
  lgGeo.setAttribute('aP', lgP); lgGeo.setAttribute('aQ', lgQ); lgGeo.setAttribute('aC', lgC); lgGeo.setAttribute('aAx', lgA);
  lgGeo.instanceCount = 0;
  const lightMat = new THREE.ShaderMaterial({ vertexShader: LIGHT_V, fragmentShader: LIGHT_F, uniforms: { uAspect: G.uAspect }, transparent: true, depthWrite: false, depthTest: false, ...LIGHT_BLEND });
  const lightsMesh = new THREE.Mesh(lgGeo, lightMat);
  lightsMesh.frustumCulled = false; lightsMesh.renderOrder = -40; lightsMesh.visible = false; scene.add(lightsMesh); made.push(lgGeo, lightMat);
  twin(lightsMesh, lightMat);
  let nl = 0, fly = null, glance = 0, pour = 0, band0 = 0.2, hazeCf = -9;
  // (a model's buffers go to the GPU in an ordinary frame BEFORE its moment — drawn once, a speck far under the tower, in a free slot)
  const toUpload = [];
  let upSlot = null;
  function uploadOne() {
    if (!toUpload.length) return;
    const f = flySlots.find(q => !q.mesh.visible);
    if (!f) return;
    upSlot = f; f.mesh.geometry = toUpload.shift(); f.mesh.visible = true; f.u.uOpacity.value = 1;
    f.mesh.matrix.makeScale(1e-4, 1e-4, 1e-4); f.mesh.matrix.setPosition(NUM[CAMX], NUM[CAMY] - 60, NUM[CAMZ]); f.mesh.matrixWorldNeedsUpdate = true;
    mark('plate');
  }
  /** a flyer's light this frame — its 14 numbers in LG (S4A FIX — ZERO GARBAGE: a call that hands a browser's engine fourteen fractions
   *  makes fourteen small objects of them, two hundred lights a frame under THE MOTHERSHIP): 0 1 2 its place · 3 half its width · 4 half
   *  its length (0 = round) along the axis in 11 12 13 · 5 6 7 its colour · 8 its strength · 9 PAINT (0 light … 1 paint) · 10 its kind
   *  (night-fx.js LIGHT_F) */
  const LG = new Float64Array(14), LP = lgP.array, LQ = lgQ.array, LC = lgC.array, LA = lgA.array;
  function lit() {
    if (nl >= LIGHTS || LG[8] <= 0.003) return;
    const o4 = nl * 4, o3 = nl * 3;
    LP[o4] = LG[0]; LP[o4 + 1] = LG[1]; LP[o4 + 2] = LG[2]; LP[o4 + 3] = LG[3];
    LQ[o4] = LG[4]; LQ[o4 + 1] = LG[10]; LQ[o4 + 2] = LG[8]; LQ[o4 + 3] = LG[9];
    LC[o3] = LG[5]; LC[o3 + 1] = LG[6]; LC[o3 + 2] = LG[7];
    LA[o3] = LG[11]; LA[o3 + 1] = LG[12]; LA[o3 + 2] = LG[13];
    nl++;
  }
  // (the frame a flyer is placed in: the camera's own — its place, its three axes, its lens — so a flyer holds its place ON THE SCREEN
  //  while the tower climbs: never over the play zone, never under the HUD's numbers)
  const FR = { px: 0, py: 0, pz: 0, X: new THREE.Vector3(), Y: new THREE.Vector3(), Z: new THREE.Vector3(), th: Math.tan(CAM.fov * RAD / 2), aspect: 1, dist: 14, t: 0, dt: 0, day: 0, cf: 0, top: 0.2, bot: 0.4, reduce, hz: new THREE.Vector3(), tx: 0, ty: 0, tz: 0, tier: 2 };
  FR.X.set(0, 0, 0); FR.Y.set(0, 0, 0); FR.Z.set(0, 0, 1);   // (the camera's axes — filled in once the camera is turned: below)
  const STAGE = {
    THREE, slots: flySlots, standIn, LG, lit, mark,
    /** a model's buffers go to the GPU now (a frame that draws nothing new), not in its moment's first frame */
    upload(geo) { if (geo) toUpload.push(geo); },
    /** the camera glances UP (0 … 1 — THE MOTHERSHIP's moment) · the white-gold light on the top slab (0 … 1 — THE FINISH) */
    glance(v) { glance = reduce ? 0 : v; }, pour(v) { pour = v; },
    ring: (k, life, c, reach) => { if (top) ring(top, slabs[slabs.length - 1].floor, reach, life, c, k); },
    spark,
  };

  // THE DRAW ORDER IS FIXED (S4A FIX — ZERO GARBAGE): every mesh has its own renderOrder and nothing is ever added later, so the
  // scene's list is put in that order ONCE and three.js is told not to sort it — it sorted the same dozen objects every pass, five
  // passes a frame (a sort makes its own scratch list each time, and works every object's depth out first). The plate is the one
  // opaque mesh (drawn first, as before); two meshes that share an order (the gold + the pink tape) never overlap.
  scene.children.sort((a, b) => a.renderOrder - b.renderOrder);
  renderer.sortObjects = false;
  // THE STATIC SCENE (S4A FIX 2): no mesh moves by itself — the plate, the boxes, the sparks, the rings, the lights sit at the origin
  // (their numbers move in their buffers), a tape's matrix is set when it is laid, a flyer's when it moves — so three.js composes no
  // matrix a frame, and the scene is walked ONCE a frame (draw: updateMatrixWorld), never by each of the bloom's passes
  for (const m of scene.children) { m.updateMatrix(); m.matrixAutoUpdate = false; }
  scene.matrixAutoUpdate = false; scene.matrixWorldAutoUpdate = false; scene.updateMatrixWorld(true);

  // ---- the pieces that fall away (a cut's overhang; a slab that missed) — pooled
  const pieces = Array.from({ length: PIECES }, () => ({ on: false, age: 0, x: 0, y: 0, z: 0, sx: 0, sz: 0, vx: 0, vy: 0, vz: 0, rx: 0, rz: 0, ax: 0, az: 0, fl: 0, life: 1200 }));
  let pieceAt = 0;

  // ---- the run's own state in the view
  let T = null, slabs = [], top = null, tier = 2, bloom = null;
  let landAt = -1e9, landFloor = -1, perfAt = -1e9, outAt = -1e9;
  // THE FRAME's OWN FRACTIONS (S4A FIX — ZERO GARBAGE): a fraction kept in a plain variable that functions share is a small object every
  // time it is written — the view's clock, the camera's ease, its place, the landing's bump, the slider's glow, the plates' drift are
  // written every frame: they live in ONE scratch of doubles instead (NUM[…] below — written in place, nothing made)
  const NUM = new Float64Array(20), FBOT = 17, CLK = 0, CAMX = 1, CAMY = 2, CAMZ = 3, BUMP = 4, EYEX = 5, EYEY = 6, EYEZ = 7, SGLOW = 8, CF = 9, DRA = 10, DRB = 11, ZONE = 12, BACK = 13, FBACK = 14, LIFT = 15, WSL = 16;
  /** what the stage hands a frame: IO[0] = `tau`, the clock in ticks (a fraction into the next one) · IO[1] = `dt`, ms since the last frame ·
   *  IO[2] = the frame's timestamp (performance.now's clock — the flyers fly by it) */
  const IO = new Float64Array(3), RX = new Float64Array(4);   // (S4A FIX 2: IO[2] = the frame's own timestamp, ms — THE FLYERS' CLOCK)   // (RX: a slab's four edges while its box is worked out)
  let tapeDrawn = -1, ftapeDrawn = -1;   // (the floor each tape's outline was last laid round: it is placed once, not every frame)
  // THE WELCOME + THE END POSE (S4A FIX's add-ons — the owner's picks "A · THE SIGN" + "A · THE HERO NUMBER"): `liftTo` = how far DOWN the
  // screen the tower stands (a share of its height) — 0 in play, POSE.welcome on the start screen (its top ≈ 70 % down: the sign has the
  // sky), POSE.end under the end screen's stats; the camera eases there. `welc` = the first slab already sliding in (a stand-in drawn
  // only on the start screen — the run's own first slab enters at its first beat); `tapeWelc` = YOUR BEST's gold tape round the
  // waiting tower's top slab; `ghost` = YOUR BEST still above you at the end: the gold outline DASHED, floating over the top slab.
  let liftTo = 0, welc = false, tapeWelc = false, ghost = false, pathWant = false;   // (pathWant: THE FLYER PATH CHECK asked before the flyers' module came)
  const WPINK = F64([1, 0.074, 0.69]);   // (the sign's pink #ff4fd8, linear)
  NUM[CF] = -1; NUM[FBOT] = -1;
  // (the frame's kept records — nothing is made in a frame: the plates' mix, the sliding slab at two ticks, the day's air, a grow-back,
  //  a perfect's ring colour, the few numbers `?fps=1` shows)
  const MIX = { a: 0, b: 0, m: 0 }, SA = { floor: 0, axis: 'x', off: 0, x0: 0, x1: 0, z0: 0, z1: 0 }, SB = { floor: 0, axis: 'x', off: 0, x0: 0, x1: 0, z0: 0, z1: 0 };
  const HZ = [0, 0, 0], GROW = { on: false, floor: 0, x: false, by: 0, at: 0 }, RINGC = new Float64Array(3);
  const STAT = { tier: 2, bloom: false, calls: 0, tris: 0, w: 0, h: 0, dpr: 1 };
  let tapeFloor = 0, tapeAt = -1e9, ftapeFloor = 0, ftapeAt = -1e9;
  let dist = 14, w = 0, h = 0, dpr = 1, fitAsk = 2;
  let needWarm = true, warmed = 0, frames = 0, progN = 0;
  const HOT = F64([1, 0.86, 0.6]);

  /** a new run / a tower adopted after a rebuild: the tower object (tower.js — the page feeds it the events) */
  function adopt(run, tower, snap = true) {
    T = tower; seed = run.seed; slabs = T.slabs(); top = T.top(); COLS.night.at.fill(-1e9); COLS.day.at.fill(-1e9); sldFloor = -1; if (snap) keepFirst = false;
    heldKey = -1; tapeDrawn = ftapeDrawn = -1;
    if (snap) {
      landAt = perfAt = outAt = tapeAt = ftapeAt = -1e9; ftapeFloor = 0; landFloor = -1; GROW.on = false; NUM[BUMP] = 0;
      for (let i = 0; i < PIECES; i++) pieces[i].on = false;
      for (let i = 0; i < SPARKS; i++) spT.setX(i, -1e6); spT.needsUpdate = true; spCount = 0; jKind.fill(0);
      for (let i = 0; i < RINGS; i++) rgB.setW(i, -1e6); rgB.needsUpdate = true;
    }
    NUM[CAMY] = slabs[slabs.length - 1].floor * H; NUM[CAMX] = (top.x0 + top.x1) / 2 * U; NUM[CAMZ] = (top.z0 + top.z1) / 2 * U;
  }

  /** the tower's hook: a cut's overhang (dx / dz = the side it hangs on) or a WHOLE slab that missed / slipped falls away */
  function fall(r, floor, dx, dz, whole) {
    const p = pieces[pieceAt++ % PIECES], day = lookNow() === 'day', c = colOf(floor);
    p.on = true; p.age = 0; p.fl = floor; p.life = whole ? 1500 : 1150;
    p.sx = (r.x1 - r.x0) * U; p.sz = (r.z1 - r.z0) * U;
    p.x = (r.x0 + r.x1) / 2 * U; p.y = (floor - 0.5) * H; p.z = (r.z0 + r.z1) / 2 * U;
    p.ax = p.az = 0;
    p.vx = dx * 0.55; p.vz = dz * 0.55; p.vy = whole ? 0 : 0.25;
    p.rx = whole ? 0.25 : dz * 1.9; p.rz = whole ? -0.2 : -dx * 1.9;
    if (whole || reduce) return;
    // THE SPARKS along the cut: the line where the piece left the slab — THE NEXT FRAME's job (S4A FIX 2: the landing frame draws the
    // slab + its piece; the burst's numbers are worked out + sent one frame later)
    const along = dx ? p.sz : p.sx, n = Math.max(6, Math.round(SPARKS_AT[tier] * Math.min(1, 0.35 + along)));
    const ex = dx ? (dx > 0 ? r.x0 : r.x1) * U : 0, ez = dz ? (dz > 0 ? r.z0 : r.z1) * U : 0, y = floor * H;
    let i = jobSlot(J_SPARKS), o = i * JN;
    if (i < 0) { i = JQ; o = JQ * JN; }   // (the queue is full: the burst now, through the spare slot past the queue — a waiting job is never overwritten: the review)
    jArg[o] = dx; jArg[o + 1] = dz; jArg[o + 2] = ex; jArg[o + 3] = ez; jArg[o + 4] = y; jArg[o + 5] = p.x; jArg[o + 6] = p.z; jArg[o + 7] = p.sx; jArg[o + 8] = p.sz; jArg[o + 9] = n; jArg[o + 10] = floor; jArg[o + 11] = day ? 1 : 0;
    if (i === JQ) sparksNow(o);
  }
  /** a cut's spark burst from its job's numbers (jArg at `o`) */
  function sparksNow(o) {
    const dx = jArg[o], dz = jArg[o + 1], ex = jArg[o + 2], ez = jArg[o + 3], y = jArg[o + 4], px = jArg[o + 5], pz = jArg[o + 6], psx = jArg[o + 7], psz = jArg[o + 8], n = jArg[o + 9], day = jArg[o + 11] > 0, c = colOf(jArg[o + 10]);
    for (let i = 0; i < n; i++) {
      const u = Math.random() - 0.5, sp = 0.5 + Math.random() * 1.9, up = 0.6 + Math.random() * 2.1;
      const x = dx ? ex : px + u * psx, z = dz ? ez : pz + u * psz;
      spark(x, y - Math.random() * H * 0.8, z, dx * sp + (Math.random() - 0.5) * 0.7, up, dz * sp + (Math.random() - 0.5) * 0.7, 0.34 + Math.random() * 0.42, (0.006 + Math.random() * 0.006) * (day ? DAY_SPARK_SIZE : 1), day ? (Math.random() < 0.4 ? DAY_SPARK_HOT : DAY_SPARK) : Math.random() < 0.4 ? HOT : c);
    }
  }

  /** the run's EVENTS since the last frame, in order — AFTER the page fed them to the tower */
  function events(evs) {
    top = T.top();
    let perfect = 0, grew = null;
    for (let i = 0; i < evs.length; i++) {
      const e = evs[i];
      if (e.e === 'perfect') perfect = e.streak;
      else if (e.e === 'grow') grew = e;
      else if (e.e === 'land') {
        landAt = NUM[CLK]; landFloor = e.floor; NUM[BUMP] = reduce ? 0 : 1;
        if (perfect) {
          perfAt = NUM[CLK];
          const c = colOf(e.floor);
          RINGC[0] = 0.55 + 0.45 * c[0]; RINGC[1] = 0.55 + 0.45 * c[1]; RINGC[2] = 0.55 + 0.45 * c[2];
          ringLater(e, e.floor, 0.34 + Math.min(perfect, 8) * 0.03, 0.5, lookNow() === 'day' ? DAY_RING : RINGC);
          if (grew) { GROW.on = true; GROW.floor = e.floor; GROW.x = grew.axis === 'x'; GROW.by = grew.by * U; GROW.at = NUM[CLK]; ringLater(e, e.floor, 0.42, 0.6, c, 0.55); }
        }
        perfect = 0; grew = null;
      } else if (e.e === 'out') { outAt = NUM[CLK]; perfect = 0; grew = null; }
    }
  }

  /** YOUR BEST's gold tape: the floor it lies on (0 = none); `flash` = it was just crossed */
  function setBest(floor, flash = false) {
    tapeFloor = floor > 0 ? floor : 0;
    if (flash && tapeFloor) {
      tapeAt = NUM[CLK];
      const s = slabOf(tapeFloor);
      if (s) ring(s, tapeFloor, 0.7, 0.9, GOLD, 0.85);
    }
  }
  /** THE NEXT FRIEND's pink tape: the floor of the friend best just crossed (0 = none); `flash` = it was just crossed */
  const PINK = F64([1, 0.31, 0.85]);
  function setFriend(floor, flash = false) {
    ftapeFloor = floor > 0 ? floor : 0;
    if (flash && ftapeFloor) {
      ftapeAt = NUM[CLK];
      const s = slabOf(ftapeFloor);
      if (s) ring(s, ftapeFloor, 0.7, 0.9, PINK, 0.85);
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

  // THE CAMERA ONLY EVER SLIDES (S4A FIX — ZERO GARBAGE): it looks along ONE fixed line (the diagonal, 33° down) — its turn is worked
  // out ONCE, here, by three's own lookAt; a frame then only moves it: three numbers into its matrix + three into the matrix's
  // inverse (the turn's own transpose never changes). No lookAt, no quaternion, no matrix inverse a frame — and its three axes
  // (CX · CY · CZ: right, up, back) are plain numbers the tags + the drop zone are worked out from.
  const cp = Math.cos(CAM.pitch * RAD), sp = Math.sin(CAM.pitch * RAD), sy = Math.sin(CAM.yaw * RAD), cy = Math.cos(CAM.yaw * RAD);
  cam.position.set(cp * sy, sp, cp * cy); cam.lookAt(0, 0, 0); cam.updateMatrix(); cam.updateMatrixWorld(true);
  cam.matrixAutoUpdate = false; cam.matrixWorldAutoUpdate = false;
  const CE = cam.matrix.elements, CW = cam.matrixWorld.elements, CI = cam.matrixWorldInverse.elements;
  const CXx = CE[0], CXy = CE[1], CXz = CE[2], CYx = CE[4], CYy = CE[5], CYz = CE[6], CZx = CE[8], CZy = CE[9], CZz = CE[10], TH = Math.tan(CAM.fov * RAD / 2);
  function place(x, y, z) {
    NUM[EYEX] = x; NUM[EYEY] = y; NUM[EYEZ] = z;   // (where the camera stands, this frame)
    cam.position.set(x, y, z);
    CE[12] = CW[12] = x; CE[13] = CW[13] = y; CE[14] = CW[14] = z;
    CI[12] = -(CXx * x + CXy * y + CXz * z); CI[13] = -(CYx * x + CYy * y + CYz * z); CI[14] = -(CZx * x + CZy * y + CZz * z);
  }
  place(cp * sy, sp, cp * cy);
  FR.X.set(CXx, CXy, CXz); FR.Y.set(CYx, CYy, CYz); FR.Z.set(CZx, CZy, CZz);
  function aim() {
    const dt = IO[1], k = 1 - Math.exp(-dt / 140) * (dt >= 1000 ? 0 : 1);   // (a long gap: it snaps — the 0 / 1 is a whole number, the fraction crosses no branch)
    const ty = slabs[slabs.length - 1].floor * H, tx = (top.x0 + top.x1) / 2 * U, tz = (top.z0 + top.z1) / 2 * U;
    NUM[CAMY] += (ty - NUM[CAMY]) * k; NUM[CAMX] += (tx - NUM[CAMX]) * k; NUM[CAMZ] += (tz - NUM[CAMZ]) * k;
    NUM[BUMP] *= Math.exp(-dt / 90);
    NUM[LIFT] += (liftTo - NUM[LIFT]) * (1 - Math.exp(-dt / 170) * (dt >= 1000 ? 0 : 1));   // (the pose: the tower eases down the screen / back up)
    const lookY = NUM[CAMY] + CAM.lift - NUM[BUMP] * 0.022 + glance * 0.42 + NUM[LIFT] * 2 * dist * TH / cp, x = NUM[CAMX] + dist * cp * sy, y = lookY + dist * sp, z = NUM[CAMZ] + dist * cp * cy;
    NUM[EYEX] = x; NUM[EYEY] = y; NUM[EYEZ] = z;
    cam.position.x = x; cam.position.y = y; cam.position.z = z;
    CE[12] = CW[12] = x; CE[13] = CW[13] = y; CE[14] = CW[14] = z;
    CI[12] = -(CXx * x + CXy * y + CXz * z); CI[13] = -(CYx * x + CYy * y + CYz * z); CI[14] = -(CZx * x + CZy * y + CZz * z);
  }
  // WHERE THE CAMERA WILL REST on the top slab (it eases there after a landing): the stage places its right-edge tags for THAT view,
  // once a landing — and lets a CSS transition ride them there (never a style write a frame)
  const restX = () => (top.x0 + top.x1) / 2 * U + dist * cp * sy, restH = () => slabs[slabs.length - 1].floor * H + CAM.lift + dist * sp, restZ = () => (top.z0 + top.z1) / 2 * U + dist * cp * cy;
  /** a point's height on the screen (0 … 1 from the top), given where it lies FROM the camera (the point − the camera) */
  const scrY = (rx, ry, rz) => (1 - (CYx * rx + CYy * ry + CYz * rz) / (-(CZx * rx + CZy * ry + CZz * rz) * TH)) / 2;
  /** THE DROP ZONE's upper edge (0 … 1 from the top): the highest point the sliding slab's path reaches — as the camera stands NOW, or (`rest`) once it rests on the top slab */
  function zoneFrom(rest) {
    const cx = rest ? restX() : NUM[EYEX], cy = rest ? restH() : NUM[EYEY], cz = rest ? restZ() : NUM[EYEZ];
    const mx = (top.x0 + top.x1) / 2, mz = (top.z0 + top.z1) / 2, hw = (top.x1 - top.x0) / 2, hd = (top.z1 - top.z0) / 2, ry = (slabs[slabs.length - 1].floor + 1) * H - cy;
    // (five corners of the slab's path, each written out — no list, no call: this runs every frame while a flyer is in the sky)
    const ky = CYy * ry, kz = CZy * ry, xa = (mx - hw) * U - cx, za = (mz - hd) * U - cz, xl = xa - TRAVEL * U, xr = (mx + TRAVEL + hw) * U - cx, zn = za - TRAVEL * U, zf = (mz + TRAVEL + hd) * U - cz;
    NUM[ZONE] = Math.min(1,
      (1 - (CYx * xl + ky + CYz * za) / (-(CZx * xl + kz + CZz * za) * TH)) / 2, (1 - (CYx * xa + ky + CYz * zn) / (-(CZx * xa + kz + CZz * zn) * TH)) / 2,
      (1 - (CYx * xa + ky + CYz * za) / (-(CZx * xa + kz + CZz * za) * TH)) / 2, (1 - (CYx * xr + ky + CYz * za) / (-(CZx * xr + kz + CZz * za) * TH)) / 2,
      (1 - (CYx * xa + ky + CYz * zf) / (-(CZx * xa + kz + CZz * zf) * TH)) / 2);
  }

  /** THE WARM FRAME: a phone builds a program + uploads a mesh at its FIRST DRAW WITH SOMETHING IN IT — one of everything is put far
   *  below the tower, one hidden frame is rendered (the bloom too), then all is put back */
  function warm() {
    const t = NUM[CLK] / 1000;
    spO.setXYZ(0, 0, -60, 0); spT.setXYZ(0, t, 1, 0.01); spO.needsUpdate = spT.needsUpdate = true;
    rgP.setXYZW(0, 0, -60, 0, 1); rgA.setXYZW(0, 0.5, 0.5, 0.3, 1); rgB.setXYZW(0, 1, 1, 1, t); rgA.needsUpdate = rgB.needsUpdate = rgP.needsUpdate = true;
    nb = 0;
    for (const k of [KIND.slab, KIND.slider, KIND.tape, KIND.trail]) { BX[0] = 0; BX[1] = -60; BX[2] = 0; BX[3] = 0.01; BX[4] = 0.01; BX[5] = 0.01; BX[6] = 1; BX[7] = 0; BX[8] = 1; BX[9] = k; put(GOLD, null, null); }
    // (S4A FIX 2 — PREWARM: a falling piece's TURNED box too (its matrix path), the whole pool's room: nothing a drop uses is met first in a drop)
    for (let k = 0; k < PIECES; k++) { QQ.setFromEuler(EU.set(0.1 * k, 0, 0.05 * k)); put(GOLD, QQ, null); }
    boxes.count = nb; boxes.instanceMatrix.needsUpdate = aColor.needsUpdate = aFx.needsUpdate = aUp.needsUpdate = true;
    const tapeWas = tape.visible, backWas = tapeBack.visible, faceWas = tapeBackU.uFace.value;   // (the tape's programs too: built here, not at the crossing)
    tape.visible = tapeBack.visible = true; tapeBackU.uFace.value = 0.2; tape.position.set(0, -60, 0); tape.scale.set(0.01, 0.01, 0.01); tapeBack.position.copy(tape.position); tapeBack.scale.copy(tape.scale);
    ftape.visible = ftapeBack.visible = true; ftapeBackU.uFace.value = 0.2; ftape.position.copy(tape.position); ftape.scale.copy(tape.scale); ftapeBack.position.copy(tape.position); ftapeBack.scale.copy(tape.scale);
    tape.updateMatrix(); tapeBack.updateMatrix(); ftape.updateMatrix(); ftapeBack.updateMatrix();   // (S4A: the pink tape is the same program — drawn here once all the same)
    // (THE FLYERS' two programs + their twins: built here on the stand-in triangle — a model brings only buffers later)
    const flyWas = flySlots.map(f => f.mesh.visible), lgWas = lightsMesh.visible, lgN = lgGeo.instanceCount;
    for (const f of flySlots) { f.mesh.visible = true; f.mesh.matrix.makeTranslation(0, -60, 0); f.mesh.matrixWorldNeedsUpdate = true; }
    lgP.setXYZW(0, 0, -60, 0, 0.01); lgQ.setXYZW(0, 0, 0, 1, 0); lgC.setXYZ(0, 1, 1, 1); lgA.setXYZ(0, 0, 0, 0); lgP.needsUpdate = lgQ.needsUpdate = lgC.needsUpdate = lgA.needsUpdate = true;
    lgGeo.instanceCount = 1; lightsMesh.visible = true;
    scene.updateMatrixWorld();
    try { renderer.compile(scene, cam); renderer.render(scene, cam); if (bloom) bloom.render(scene, cam, plate, TWINS); } catch { /* a phone that can't: the kinds build as they come */ }
    mark('compile');
    spT.setX(0, -1e6); spT.needsUpdate = true; rgB.setW(0, -1e6); rgB.needsUpdate = true;
    tape.visible = tapeWas; tapeBack.visible = backWas; tapeBackU.uFace.value = faceWas; ftape.visible = ftapeBack.visible = false; ftapeBackU.uFace.value = 0;
    flySlots.forEach((f, i) => { f.mesh.visible = flyWas[i]; }); lightsMesh.visible = lgWas; lgGeo.instanceCount = lgN;
    tapeDrawn = ftapeDrawn = -1;
    warmed++;
  }

  const setPlate = (t, have, flip, rec) => { const ok = !!rec && rec.ok; plateU[t].value = ok ? rec.tex : blank; plateU[have].value = ok ? 1 : 0; plateU[flip].value = ok ? rec.flip : 0; };
  /** one frame: the run — and, in IO (the stage writes them: no call hands a fraction over), `tau` = the clock in ticks (a fraction
   *  into the next one) + `dt` = ms since the last frame */
  function draw(run) {
    const tau = IO[0], dt = IO[1];
    if (fitAsk) { const f = fitAsk === 2; fitAsk = 0; fitNow(f); }
    NUM[CLK] += dt; G.uTime.value = NUM[CLK] / 1000;
    renderer.info.reset();
    slabs = T.slabs(); top = T.top();
    runJobs();   // (S4A FIX 2: the landing's later jobs — a ring, a spark burst — one frame after it)
    aim();
    if (needWarm && w && h) { needWarm = false; warm(); }
    const topFloor = slabs[slabs.length - 1].floor;
    if (G.uTopY.value !== NUM[CAMY]) G.uTopY.value = NUM[CAMY];
    // ---- the plates behind (the camera's own height in floors picks them: they cross-fade as it CLIMBS, not as a slab lands)
    const cf = Math.max(0, NUM[CAMY] / H), mix = MIX;
    if (cf !== NUM[CF]) { NUM[CF] = cf; plateMixInto(cf, MIX); NUM[DRA] = plateDrift(MIX.a, cf); NUM[DRB] = plateDrift(MIX.b, cf); }
    holdPlates(mix.a, mix.b);
    // THE LOOK SWITCH: the look coming waits for its pictures (a band's two plates + its reflection map — all decoded + uploaded off
    // the frame), then the two looks cross-fade; settled, the other look's pictures go
    const want = target === 'day' ? 1 : 0;
    if (dayK !== want) {
      if (!fading && (lookReady(target, mix.a, mix.b) || (waited += dt) > LOOK_WAIT_MS)) fading = true;
      if (fading) {
        dayK += (want ? 1 : -1) * dt / LOOK_FADE_MS;
        if (want ? dayK >= 1 : dayK <= 0) { dayK = want; fading = false; waited = 0; heldKey = -1; switches++; }
      }
      G.uDay.value = dayK;
    }
    if (dayK > 0 && Math.abs(cf - hazeCf) > 0.05) { hazeCf = cf; const hz = hazeInto(cf, HZ); C.setRGB(hz[0], hz[1], hz[2], THREE.SRGBColorSpace); G.uHaze.value.set(C.r, C.g, C.b); }   // (the band's air: worked out as the camera climbs, not every frame)
    setPlate('tA', 'uHaveA', 'uFlipA', SETS.night.get(mix.a)); setPlate('tB', 'uHaveB', 'uFlipB', SETS.night.get(mix.b));
    setPlate('tC', 'uHaveC', 'uFlipC', SETS.day.get(mix.a)); setPlate('tD', 'uHaveD', 'uFlipD', SETS.day.get(mix.b));
    // (a uniform's number is written only when it CHANGED: a fraction stored into a record every frame is a small object every frame)
    if (plateU.uMix.value !== mix.m) plateU.uMix.value = mix.m;
    if (plateU.uDriftA.value !== NUM[DRA]) plateU.uDriftA.value = NUM[DRA];
    if (plateU.uDriftB.value !== NUM[DRB]) plateU.uDriftB.value = NUM[DRB];
    // DEEP SPACE (solo, past THE MOTHERSHIP): the drifting stars + the aurora over the last plate
    const space = cf <= SPACE_FROM ? 0 : cf >= SPACE_FULL ? 1 : (cf - SPACE_FROM) / (SPACE_FULL - SPACE_FROM);
    if (plateU.uSpace.value !== space) plateU.uSpace.value = space;
    // ---- THE FLYERS (flyers.js, once the page has handed it in): placed in the camera's own frame, drawn BEHIND the tower
    nl = 0;
    if (TRC) TRC.lap(PH.view);
    if (fly) {
      FR.px = NUM[EYEX]; FR.py = NUM[EYEY]; FR.pz = NUM[EYEZ];   // (its three axes never change: set once, below)
      // FLYERS ON REAL TIME (S4A FIX 2 — the owner: the UFO JUMPED at every landing): a flyer's place is a function of the REAL clock
      // (the frame's own timestamp — a slow frame never makes it skip or lurch: it is simply where it should be by then) and of its SKY
      // BAND — whose lower edge is THE DROP ZONE's upper edge as it will stand once the camera RESTS on the top slab (a landing moves the
      // top slab up a floor at once while the camera eases after it: the zone as seen NOW leapt a floor's height up the screen and eased
      // back — and the flyer with it). The rested zone moves only when the top slab's size does (a cut) — and is eased (≈ 0.6 s) even then.
      FR.aspect = cam.aspect; FR.dist = dist; FR.t = (IO[2] > 0 ? IO[2] : NUM[CLK]) / 1000; FR.dt = dt; FR.day = dayK; FR.cf = cf; FR.top = band0; FR.tier = tier;
      zoneFrom(true); if (NUM[FBOT] < 0 || dt >= 1000) NUM[FBOT] = NUM[ZONE]; else NUM[FBOT] += (NUM[ZONE] - NUM[FBOT]) * (1 - Math.exp(-dt / 600)); FR.bot = NUM[FBOT];
      if (dayK > 0) FR.hz.copy(G.uHaze.value).multiplyScalar(dayK); else FR.hz.set(0, 0, 0);
      FR.hz.x += 0.012 * (1 - dayK); FR.hz.y += 0.008 * (1 - dayK); FR.hz.z += 0.03 * (1 - dayK);
      FR.tx = (top.x0 + top.x1) / 2 * U; FR.ty = topFloor * H; FR.tz = (top.z0 + top.z1) / 2 * U;
      fly.frame(FR);
    }
    if (TRC) TRC.lap(PH.flyers);
    uploadOne();
    lgGeo.instanceCount = nl; lightsMesh.visible = nl > 0;
    if (nl) { upRange(lgP, 0, nl * 4); upRange(lgQ, 0, nl * 4); upRange(lgC, 0, nl * 3); upRange(lgA, 0, nl * 3); }

    // ---- every box
    nb = 0;
    const landAge = NUM[CLK] - landAt, perfAge = NUM[CLK] - perfAt, first = slabs[0].floor;
    // THE BUILDING under the first slab: full-size floors of the same glass, each its own colour (the tower is a tower from the first second)
    if (first <= 0) for (let fl = Math.max(first - KEEP, topFloor - KEEP + 1); fl < first; fl++) { BX[0] = 0; BX[1] = (fl - 0.5) * H; BX[2] = 0; BX[3] = 1; BX[4] = H; BX[5] = 1; BX[6] = 1; BX[7] = 0; BX[8] = 1; BX[9] = KIND.slab; put(colMix(fl), null, null); }
    for (let i = Math.max(0, slabs.length - KEEP); i < slabs.length; i++) {
      const s = slabs[i], isTop = s.floor === topFloor && s.floor === landFloor;
      // (a slab's own numbers are worked out IN the scratch — RX its four edges, BX[6] its glow, BX[7] its white flash: a fraction that a
      //  branch may change is a small object in a browser engine's middle tier, and there are forty slabs a frame)
      RX[0] = s.x0 * U; RX[1] = s.x1 * U; RX[2] = s.z0 * U; RX[3] = s.z1 * U; BX[6] = 1; BX[7] = 0;
      if (s.floor === topFloor && pour > 0) { BX[7] = 0.85 * pour; BX[6] += 1.2 * pour; }   // (THE FINISH: the white-gold light pours onto the top slab)
      if (isTop) {
        BX[6] += 1.3 * Math.exp(-landAge / 130);
        if (perfAge < 700) BX[7] = 0.95 * Math.exp(-perfAge / 150);
        if (GROW.on && GROW.floor === s.floor) {
          // GROW-BACK: the slab swells out from the size it snapped to
          const k = clamp01((NUM[CLK] - GROW.at) / 240), left = GROW.by * (1 - k) * (1 - k) / 2;
          if (GROW.x) { RX[0] += left; RX[1] -= left; } else { RX[2] += left; RX[3] -= left; }
          BX[6] += 0.9 * (1 - k);
        }
      }
      // (the slab lying ON this one: THE DAY LOOK's shadow on the ledge it leaves)
      let up = null;
      if (i + 1 < slabs.length) { const n = slabs[i + 1]; UPV[0] = n.x0 * U; UPV[1] = n.x1 * U; UPV[2] = n.z0 * U; UPV[3] = n.z1 * U; up = UPV; }
      BX[0] = (RX[0] + RX[1]) / 2; BX[1] = (s.floor - 0.5) * H; BX[2] = (RX[2] + RX[3]) / 2; BX[3] = RX[1] - RX[0]; BX[4] = H; BX[5] = RX[3] - RX[2]; BX[8] = 1; BX[9] = KIND.slab; put(colMix(s.floor), null, up);
    }
    // the sliding slab, eased between its two ticks — a stronger colour, a brighter edge, a short trail behind it
    const k0 = Math.floor(tau), a = slabInto(run, k0, SA);
    if (a) {
      const b = slabInto(run, k0 + 1, SB), f = tau - k0, mx = (a.x0 + a.x1) / 2, mz = (a.z0 + a.z1) / 2, c = colSlider(a.floor);
      const x = (mx + ((b.x0 + b.x1) / 2 - mx) * f) * U, z = (mz + ((b.z0 + b.z1) / 2 - mz) * f) * U, y = (a.floor - 0.5) * H, sx = (a.x1 - a.x0) * U, sz = (a.z1 - a.z0) * U;
      NUM[SGLOW] += (1 - NUM[SGLOW]) * Math.min(1, dt / 90);
      BX[0] = x; BX[1] = y; BX[2] = z; BX[3] = sx; BX[4] = H; BX[5] = sz; BX[6] = 1.25 + 0.2 * NUM[SGLOW]; BX[7] = 0; BX[8] = 1; BX[9] = KIND.slider; put(c, null, null);
      if (tier > 0 && !reduce) {
        const v = (b.off - a.off) * U, dir = v > 0 ? 1 : v < 0 ? -1 : 0, len = Math.min(0.5, Math.abs(v) * 9);
        if (dir && len > 0.02) {
          if (a.axis === 'x') { BX[0] = x - dir * (sx + len) / 2; BX[1] = y; BX[2] = z; BX[3] = len; BX[4] = H * 0.96; BX[5] = sz * 0.985; BX[6] = 1; BX[7] = dir; BX[8] = 0.8; BX[9] = KIND.trail; }
          else { BX[0] = x; BX[1] = y; BX[2] = z - dir * (sz + len) / 2; BX[3] = sx * 0.985; BX[4] = H * 0.96; BX[5] = len; BX[6] = 1; BX[7] = dir * 2; BX[8] = 0.8; BX[9] = KIND.trail; }
          put(c, null, null);
        }
      }
    } else NUM[SGLOW] = 0;
    // THE WELCOME's SLAB (the start screen — the owner's picture): a first slab already sliding in from the far left (− x: up and to
    // the left on the screen, clear of the sign above and the words at the foot) — the sign's pink, its soft trail behind it, a slow
    // breath to and fro; it fades the moment the run starts (the run's own first slab enters at its first beat, on its own side)
    NUM[WSL] += ((welc ? 1 : 0) - NUM[WSL]) * Math.min(1, dt / (welc ? 260 : 120));
    if (NUM[WSL] > 0.01) {
      const sx = (top.x1 - top.x0) * U, sz = (top.z1 - top.z0) * U, off = -(0.42 + 0.09 * Math.sin(NUM[CLK] / 1000 * 0.9));
      BX[0] = (top.x0 + top.x1) / 2 * U + off; BX[1] = (topFloor + 0.5) * H; BX[2] = (top.z0 + top.z1) / 2 * U; BX[3] = sx; BX[4] = H; BX[5] = sz; BX[6] = 1.3; BX[7] = 0; BX[8] = NUM[WSL]; BX[9] = KIND.slider; put(WPINK, null, null);
      if (tier > 0 && !reduce) { BX[0] -= (sx + 0.34) / 2; BX[3] = 0.34; BX[4] = H * 0.96; BX[5] = sz * 0.985; BX[6] = 1; BX[7] = 1; BX[8] = 0.8 * NUM[WSL]; BX[9] = KIND.trail; put(WPINK, null, null); }
    }
    // the falling pieces
    for (let i = 0; i < PIECES; i++) {
      const p = pieces[i];
      if (!p.on) continue;
      p.age += dt;
      if (p.age > p.life) { p.on = false; continue; }
      const s = dt / 1000;
      p.vy -= 9 * s; p.x += p.vx * s; p.y += p.vy * s; p.z += p.vz * s; p.ax += p.rx * s; p.az += p.rz * s;
      QQ.setFromEuler(EU.set(p.ax, 0, p.az));
      BX[0] = p.x; BX[1] = p.y; BX[2] = p.z; BX[3] = p.sx; BX[4] = H; BX[5] = p.sz; BX[6] = 1.1; BX[7] = 0; BX[8] = clamp01(1.6 * (1 - p.age / p.life)); BX[9] = KIND.slab; put(colMix(p.fl), QQ, null);
    }
    // YOUR BEST's gold tape: a THIN glowing gold OUTLINE round the slab of that floor — a line of light, never a filled band (S2 FIX)
    const ts = tapeFloor ? slabOf(tapeFloor) : tapeWelc ? slabs[slabs.length - 1] : null, gh = !ts && ghost;
    // (the back edges come in as the tower climbs away from the tape — none while it lies just under the top)
    // (… and none by day: frosted glass is not seen through)
    NUM[BACK] = 0; if (ts) NUM[BACK] = TAPE_BACK * (1 - dayK) * clamp01((topFloor - ts.floor - TAPE_BACK_FROM) / (TAPE_BACK_FULL - TAPE_BACK_FROM));
    tape.visible = !!ts || gh; tapeBack.visible = NUM[BACK] > 0.004; if (tapeBackU.uFace.value !== NUM[BACK]) tapeBackU.uFace.value = NUM[BACK];
    if (tapeU.uDash.value !== (gh ? 1 : 0)) tapeU.uDash.value = gh ? 1 : 0;
    if (gh && tapeDrawn !== -2) {
      // (the ghost: the top slab's own outline, floating clear over it)
      tapeDrawn = -2;
      const x0 = top.x0 * U, x1 = top.x1 * U, z0 = top.z0 * U, z1 = top.z1 * U;
      tape.position.set((x0 + x1) / 2, (topFloor + ghostUp(x1 - x0, z1 - z0) - 0.5) * H, (z0 + z1) / 2); tape.scale.set(Math.max(GHOST_MIN, x1 - x0) + 2 * TAPE_OUT, TAPE_H, Math.max(GHOST_MIN, z1 - z0) + 2 * TAPE_OUT); tape.updateMatrix();
      tapeU.uGlow.value = 1; tapeU.uWhite.value = 0;
    }
    if (ts) {
      // (the outline is laid ONCE round its slab — a slab never moves; only its flash is a frame's)
      if (tapeDrawn !== ts.floor) {
        tapeDrawn = ts.floor;
        const x0 = ts.x0 * U, x1 = ts.x1 * U, z0 = ts.z0 * U, z1 = ts.z1 * U;
        tape.position.set((x0 + x1) / 2, (ts.floor - 0.5) * H, (z0 + z1) / 2); tape.scale.set(x1 - x0 + 2 * TAPE_OUT, TAPE_H, z1 - z0 + 2 * TAPE_OUT);
        tapeBack.position.copy(tape.position); tapeBack.scale.copy(tape.scale); tape.updateMatrix(); tapeBack.updateMatrix();
      }
      const age = NUM[CLK] - tapeAt, tg = 1 + 1.6 * Math.exp(-age / 260), tw = 0.6 * Math.exp(-age / 180);
      if (tapeU.uGlow.value !== tg) tapeU.uGlow.value = tg; if (tapeU.uWhite.value !== tw) tapeU.uWhite.value = tw;
    }
    // THE NEXT FRIEND's pink tape (S4A): the same thin outline at the friend best just crossed — never on the gold tape's own floor
    const fs = ftapeFloor && ftapeFloor !== tapeFloor ? slabOf(ftapeFloor) : null;
    NUM[FBACK] = 0; if (fs) NUM[FBACK] = TAPE_BACK * (1 - dayK) * clamp01((topFloor - fs.floor - TAPE_BACK_FROM) / (TAPE_BACK_FULL - TAPE_BACK_FROM));
    ftape.visible = !!fs; ftapeBack.visible = NUM[FBACK] > 0.004; if (ftapeBackU.uFace.value !== NUM[FBACK]) ftapeBackU.uFace.value = NUM[FBACK];
    if (fs) {
      if (ftapeDrawn !== fs.floor) {
        ftapeDrawn = fs.floor;
        const x0 = fs.x0 * U, x1 = fs.x1 * U, z0 = fs.z0 * U, z1 = fs.z1 * U;
        ftape.position.set((x0 + x1) / 2, (fs.floor - 0.5) * H, (z0 + z1) / 2); ftape.scale.set(x1 - x0 + 2 * TAPE_OUT, TAPE_H, z1 - z0 + 2 * TAPE_OUT);
        ftapeBack.position.copy(ftape.position); ftapeBack.scale.copy(ftape.scale); ftape.updateMatrix(); ftapeBack.updateMatrix();
      }
      const age = NUM[CLK] - ftapeAt, tg = 1 + 1.6 * Math.exp(-age / 260), tw = 0.6 * Math.exp(-age / 180);
      if (ftapeU.uGlow.value !== tg) ftapeU.uGlow.value = tg; if (ftapeU.uWhite.value !== tw) ftapeU.uWhite.value = tw;
    }
    // (S4A FIX 2: only the boxes drawn this frame go to the GPU — never the pool's empty room — and only the sparks written since the last frame)
    boxes.count = nb; upRange(boxes.instanceMatrix, 0, nb * 16); upRange(aColor, 0, nb * 3); upRange(aFx, 0, nb * 4); upRange(aUp, 0, nb * 4);
    if (spCount) { if (spCount >= SPARKS || spLo + spCount > SPARKS) { spO.needsUpdate = spV.needsUpdate = spT.needsUpdate = spC.needsUpdate = true; } else { upRange(spO, spLo * 3, spCount * 3); upRange(spV, spLo * 3, spCount * 3); upRange(spT, spLo * 3, spCount * 3); upRange(spC, spLo * 3, spCount * 3); } spCount = 0; }
    // (ONE walk of the scene's matrices a frame: every mesh holds its matrix still (matrixAutoUpdate off — a tape's is set when it is
    //  laid, a flyer's when it moves) and the scene is walked HERE, once — not again by each of the bloom's passes)
    scene.updateMatrixWorld();
    if (TRC) TRC.lap(PH.view);
    renderer.render(scene, cam);
    if (TRC) TRC.lap(PH.render);
    // (THE DAY LOOK has NO bloom — added light washes a bright sky out; through a switch it fades with the night)
    if (bloom && tier === 2 && dayK < 1) bloom.render(scene, cam, plate, TWINS, 1 - dayK);
    if (TRC) TRC.lap(PH.bloom);
    if (upSlot) { upSlot.mesh.visible = false; upSlot.mesh.geometry = standIn; upSlot = null; }
    // (a program built in THIS frame — anything the warm frame missed — is a hitch with a name: play.js's counter)
    const pn = renderer.info.programs ? renderer.info.programs.length : 0;
    if (pn !== progN) { progN = pn; mark('compile'); }
    STAT.tier = tier; STAT.bloom = !!bloom && tier === 2; STAT.calls = renderer.info.render.calls; STAT.tris = renderer.info.render.triangles; STAT.w = w; STAT.h = h; STAT.dpr = dpr;
    frames++;
  }

  /** THE DROP ZONE's upper edge on the screen (0 … 1 from the top), as the camera stands NOW */
  const zoneNow = () => { zoneFrom(false); return NUM[ZONE]; };
  return {
    el, adopt, events, fall, draw, setTier, setBest, setFriend, resize: () => fit(true),
    /** THE LOOK SWITCH: 'day' | 'night' — the other look's pictures come in off the frame, then a LOOK_FADE_MS cross-fade (`now`: at once) */
    setLook(l, now = false) {
      const t = l === 'day' ? 'day' : 'night';
      if (now) { target = t; dayK = t === 'day' ? 1 : 0; G.uDay.value = dayK; fading = false; waited = 0; heldKey = -1; return; }
      if (t === target) return;
      target = t; waited = 0; heldKey = -1;
    },
    /** the look asked for · the look on screen (it turns half way through a cross-fade) */
    look: () => target, lookNow,
    /** the run is over (the end card is up): the first band's plate comes back for the next run */
    rest() { keepFirst = true; },
    /** the view's own top slab (from the events) — the page's check: it equals the engine's */
    top: () => ({ ...top, floor: slabs[slabs.length - 1].floor }),
    /** a point (rule units x, z; y in floors) → [x, y] on the screen, 0 … 1 from the top left (as of the last frame's camera) */
    project(x, floor, z) { V.set(x * U, floor * H, z * U).project(cam); return [(1 + V.x) / 2, (1 - V.y) / 2]; },   // (a point BEHIND the camera comes back mirrored — a caller clamps its height first: play.js's tag)
    /** THE DROP ZONE's upper edge on the screen (0 … 1 from the top): the highest point the sliding slab's path reaches — nothing of a tag / a tape's label may sit under it */
    zoneTop: zoneNow,
    /** … and once the camera RESTS on the top slab · the height on the screen (0 … 1 from the top) of `floor`, over the top slab's centre, in that rested view */
    restZone: () => { zoneFrom(true); return NUM[ZONE]; },
    restY: floor => scrY(-dist * cp * sy, floor * H - restH(), -dist * cp * cy),
    /** what the stage writes before draw(): [tau, dt] */
    io: IO,
    // ---- THE WELCOME + THE END POSE (S4A FIX's add-ons)
    /** where the tower stands: 'play' · 'welcome' (the start screen: its top ≈ 70 % down) · 'end' (under the end screen's stats); the camera eases there (at once before the first frame) */
    pose(kind) { liftTo = POSE[kind] || 0; if (!frames) NUM[LIFT] = liftTo; },
    /** the start screen's scene: a first slab already sliding in · `best`: YOUR BEST's gold tape round the waiting tower's top slab */
    welcome(on, best = false) { welc = !!on; tapeWelc = !!on && !!best; tapeDrawn = -1; },
    /** the end screen: YOUR BEST still above you — the gold outline DASHED, floating clear over the top slab (ghostUp) */
    ghostBest(on) { ghost = !!on; tapeDrawn = -1; },
    /** a point (rule units x, z; y in floors) in the POSE the tower is easing to → out[0], out[1] = its place on the screen (0 … 1 from the top left) */
    poseXY(x, floor, z, out) {
      const rx = x * U - restX(), ry = floor * H - restH(), rz = z * U - restZ(), vz = -(CZx * rx + CZy * ry + CZz * rz) * TH;
      out[0] = (1 + (CXx * rx + CXy * ry + CXz * rz) / (vz * cam.aspect)) / 2; out[1] = (1 - (CYx * rx + CYy * ry + CYz * rz) / vz) / 2 + liftTo;
    },
    /** the few numbers the `?fps=1` line shows — ONE kept record, written in the frame (never the whole info below) */
    stat: () => STAT,
    // ---- THE FLYERS (S3): the page hands the lazy module in (again after a rebuild); the calls below are no-ops until it has
    /** flyers.js's own module → its flyers on this scene's stage */
    flyers(M) { if (!fly && M && M.createFlyers) { try { fly = M.createFlyers(STAGE); if (pathWant && fly.path) fly.path(true); } catch { fly = null; } } return !!fly; },
    /** the sky band the flyers keep to: its upper edge = the HUD's foot (0 … 1 from the top; the lower = THE DROP ZONE's own upper edge) */
    band(topFrac) { band0 = topFrac; },
    /** fetch a flyer's model + sounds ahead: 'blackbird' | 'f22' | 'ufo' | 'mothership' */
    need(kind) { if (fly) fly.need(kind); },
    /** a moment: 'blackbird' | 'f22' (the skyline flyby) · 'ufo' · 'pass' (solo: past THE MOTHERSHIP) · 'pour' (the match's finish); `dir` ±1 = the side it comes from → true = it flies */
    fly(kind, dir) { return fly ? fly.start(kind, dir) : false; },
    /** a new run: every flyer off the screen, its model freed */
    flyReset() { if (fly) fly.reset(); glance = 0; pour = 0; },
    /** the end card is up: the flyers leave the sky behind its words */
    flyHush() { if (fly) fly.hush(); },
    flyInfo: () => (fly ? fly.info() : { ready: false }),
    /** S4B — PRE-WARM: is everything a run can need ON THE GPU? the warm frame drawn, the look on screen's five plates + its
     *  reflection map in (or failed: a missing picture never holds a start), no model still waiting for its upload frame */
    warm() {
      if (!warmed || toUpload.length || upSlot) return false;
      const plates = SETS[target], env = ENVS[target];
      for (let k = 0; k < 5; k++) { const r = plates.get(k); if (!r || !r.done) return false; }
      return env.done;
    },
    /** … and every flyer's model read (flyers.js — the lazy module itself too) */
    flyReady: () => !!fly && fly.ready(),
    flyPath: on => { pathWant = !!on; return fly && fly.path ? fly.path(on) : null; },
    flashing: () => NUM[CLK] - perfAt < 460,
    /** S4A FIX 2: the landing's later jobs run so far (the pass's check) */
    jobs: () => jobsRun,
    falling: () => pieces.filter(p => p.on).length,
    info: () => ({ look: lookNow(), target, dayK, fading, switches, tier, bloom: !!bloom && tier === 2, warmed, uploads, frames, calls: renderer.info.render.calls, tris: renderer.info.render.triangles, programs: renderer.info.programs ? renderer.info.programs.length : 0, dpr, w, h, dist, slabs: slabs.length, boxes: nb, lights: nl, space: plateU.uSpace.value, sparks: sparkN, rings: ringN, tape: tapeFloor, env: (target === 'day' ? G.uEnvDOn : G.uEnvOn).value === 1, envs: ['night', 'day'].filter(l => ENVS[l].ok), plates: [...SETS[target].entries()].filter(([, r]) => r.ok).map(([k]) => k).sort(), held: [...SETS[target].keys()].sort(), heldAll: { night: [...SETS.night.keys()].sort(), day: [...SETS.day.keys()].sort() }, loads, mix: plateMix(Math.max(0, NUM[CAMY] / H)), reduce }),
    destroy() {
      dead = true;
      ro.disconnect();
      if (fly) { try { fly.destroy(); } catch { /* gone */ } fly = null; }
      for (const l of ['night', 'day']) { SETS[l].forEach(dropPlate); SETS[l].clear(); dropEnv(l); }
      if (bloom) { bloom.dispose(); bloom = null; }
      scene.remove(plate, boxes, sparks, rings, tape, tapeBack, ftape, ftapeBack, lightsMesh, ...flySlots.map(f => f.mesh));
      for (const m of made) m.dispose();
      renderer.dispose();
      try { renderer.forceContextLoss(); } catch { /* fine */ }
      el.width = el.height = 0;
      el.remove();
    },
  };
}
