// FREEFALL — THE NIGHT LOOK (F2 — docs/freefall.md "THE NIGHT LOOK"): the neon tower on three.js 0.160 (the page's import map, its
// READABLE build — HIGH RISE's LAG RULES 7) with our own shaders (night-fx.js): the slices in ONE instanced mesh (only the floors in
// sight), the pillar, the ball + its lights, THE BLAZE's trail, a shatter's shards + sparks, YOUR BEST's gold tape, THE SHAFT behind it
// all (the area's painted wall, drawn at half resolution), the half-res bloom (tier 2).
// A VIEW: it reads the run + its EVENTS (engine.js) and eases the ball between two landings itself — it never writes them; the rules
// never import it. ZERO GARBAGE IN PLAY (HIGH RISE's LAG RULES): a frame makes no objects — the instances are written into typed arrays
// made once, the floors in sight live in a ring of records written INTO (tower-gen.js#floorInto), every uniform is a kept object.
import * as THREE from 'three';
import { TURN, SLICES, AREAS, FIRST, RULE_SETS, RULES_DEFAULT } from './tuning.js';
import { floorInto, sliceStart, sliceUnder, moversAt } from './tower-gen.js';
import { areaIndex } from './logic.js';
import { PALETTES, TRENCH_PALETTES } from './palettes.js';
import { WALL_V, WALL_F, COPY_V, COPY_F, SLICE_V, SLICE_F, PILLAR_V, PILLAR_F, BALL_V, BALL_F, LIGHT_V, LIGHT_F, SHARD_V, SHARD_F, SPARK_V, SPARK_F, TAPE_V, TAPE_F, FLAME_V, FLAME_F, RIBBON_V, RIBBON_F, createBloom } from './night-fx.js';

/** bump when a picture is replaced (the walls' cache key) */
export const FF_ART_REV = 1;
/** the world (the lab's graybox numbers — the DRAG's 1 : 1 scale is the owner's phone check): a floor every H down the shaft; the ring
 *  from the pillar (RI) out to RO; the ball rides at RB. The ball is drawn a little smaller than the graybox's (its CENTRE decides: less
 *  of it hangs over the neighbour) — still ≥ 34 pt at 390 wide; a red slice stands RISE proud of the floor */
export const SHAPE = Object.freeze({ H: 1, RO: 1, RI: 0.2, RB: 0.66, R_BALL: 0.125, THICK: 0.2, HOP: 0.42, RISE: 0.1, RW: 2.7 });
/** THE CAMERA (the graybox's): in front of the ball, `pitch`° down, a `fov`° lens; `ballY` = where the ball's floor sits on the screen */
export const CAM = Object.freeze({ fov: 46, pitch: 33, fill: 0.8, ballY: 0.34, aspectMax: 0.47 });
/** THE POSES: `play` (the graybox's camera) · `open` (THE OPENING: high over the tower top, further back — the skyline in sight) */
export const POSE = Object.freeze({ play: Object.freeze({ pitch: 33, back: 1, ballY: 0.34 }), open: Object.freeze({ pitch: 27, back: 0.94, ballY: 0.56 }) });
export const POSE_MS = 950;
/** the floors drawn under the ball's (only the nearest ~10 are ever in sight) */
export const BELOW = 9;
const RAD = Math.PI / 180, UNIT = 2 * Math.PI / TURN, WEDGE = 2 * Math.PI / SLICES, MARGIN = 0.02, SEG = 6;
const RING = 32;                 // the floors kept (a ring of records)
const MAXI = (BELOW + 3) * SLICES;
const SHARDS = 48, SPARKS = 192, LIGHTS = 8, PUNCH0 = 3, PUNCHES = 4;
/** THE BLAZE's flame sprites: a FIXED pool — the tiers trim how many are lit a second (FLAME_RATE: tier 0 · 1 · 2), never the pool */
export const FLAMES = 96, FLAME_RATE = Object.freeze([46, 84, 128]), EMBER_RATE = Object.freeze([10, 22, 36]);
/** a flame's longest life in seconds (F3 — the owner: the column ~2× longer, a little wider; F2's was 0.41): the ball falls away from its flames, so a
 *  flame's life IS the column's length — the pool still holds every flame alive at once (128 a second × ≤ 0.82 s × ¾ on average < 96) */
export const FLAME_LIFE = 0.82;
/** the wall of each area (tuning.js#AREAS, in order): null = the open sky (THE ROOFTOP) */
export const WALLS = Object.freeze([null, 'offices', 'speakeasy', 'harbor', 'deep', 'deep', 'deep']);
const WALL_TINT = { offices: [0.5, 0.56, 0.82], speakeasy: [0.82, 0.74, 0.86], harbor: [1.9, 2.3, 2.5], deep: [1.5, 1.45, 1.7] };
const GOLD = 0xffc83c, LAP = 40, TRENCH_FROM = 201;

const wedgeGeo = () => {
  // a slice = a wedge of the ring: its top, its outer wall, its two cut sides (the foot + the pillar's side are never seen)
  const P = [], N = [], E = [];
  const { RO, RI, THICK } = SHAPE, a0 = MARGIN, a1 = WEDGE - MARGIN;
  const pt = (r, th, y) => [r * Math.sin(th), y, r * Math.cos(th)];
  const tri = (A, B, C, n, ea, eb, ec) => {
    // (the winding follows the normal asked for: front faces only are drawn)
    const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
    const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx, flip = cx * n[0] + cy * n[1] + cz * n[2] < 0;
    const L = flip ? [A, C, B] : [A, B, C], Le = flip ? [ea, ec, eb] : [ea, eb, ec];
    for (let k = 0; k < 3; k++) { P.push(...L[k]); N.push(...n); E.push(...Le[k]); }
  };
  const quad = (A, B, C, D, n, ea, eb, ec, ed) => { tri(A, B, C, n, ea, eb, ec); tri(A, C, D, n, ea, ec, ed); };
  for (let k = 0; k < SEG; k++) {
    const t0 = a0 + (a1 - a0) * k / SEG, t1 = a0 + (a1 - a0) * (k + 1) / SEG, g0 = -1 + 2 * k / SEG, g1 = -1 + 2 * (k + 1) / SEG;
    // the top (face 0)
    quad(pt(RI, t0, 0), pt(RO, t0, 0), pt(RO, t1, 0), pt(RI, t1, 0), [0, 1, 0], [g0, 0, 0, 0], [g0, 1, 0, 0], [g1, 1, 0, 0], [g1, 0, 0, 0]);
    // the outer wall (face 1): aE.w = 0 at its top … 1 at its foot
    const tm = (t0 + t1) / 2, n = [Math.sin(tm), 0, Math.cos(tm)];
    quad(pt(RO, t0, 0), pt(RO, t1, 0), pt(RO, t1, -THICK), pt(RO, t0, -THICK), n, [g0, 1, 1, 0], [g1, 1, 1, 0], [g1, 1, 1, 1], [g0, 1, 1, 1]);
  }
  // the two cut sides (face 2)
  quad(pt(RI, a0, 0), pt(RO, a0, 0), pt(RO, a0, -THICK), pt(RI, a0, -THICK), [-Math.cos(a0), 0, Math.sin(a0)], [-1, 0, 2, 0], [-1, 1, 2, 0], [-1, 1, 2, 1], [-1, 0, 2, 1]);
  quad(pt(RI, a1, 0), pt(RO, a1, 0), pt(RO, a1, -THICK), pt(RI, a1, -THICK), [Math.cos(a1), 0, -Math.sin(a1)], [1, 0, 2, 0], [1, 1, 2, 0], [1, 1, 2, 1], [1, 0, 2, 1]);
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('aE', new THREE.Float32BufferAttribute(E, 4));
  return g;
};
const chipGeo = () => {
  // a shard: a thin three-sided chip
  const A = [-0.5, 0, -0.38], B = [0.52, 0, -0.26], C = [0.02, 0, 0.6], h = 0.09, P = [], N = [];
  const up = v => [v[0], h, v[2]], dn = v => [v[0], -h, v[2]];
  const face = (a, b, c) => { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]; const n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx], l = Math.hypot(...n) || 1; for (const p of [a, b, c]) { P.push(...p); N.push(n[0] / l, n[1] / l, n[2] / l); } };
  face(up(A), up(C), up(B)); face(dn(A), dn(B), dn(C));
  for (const [a, b] of [[A, B], [B, C], [C, A]]) { face(up(a), up(b), dn(b)); face(up(a), dn(b), dn(a)); }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  return g;
};
const quadGeo = () => { const g = new THREE.InstancedBufferGeometry(), p = new THREE.PlaneGeometry(1, 1); g.index = p.index; g.setAttribute('position', p.getAttribute('position')); g.setAttribute('uv', p.getAttribute('uv')); return g; };
const inst = (g, name, n, size) => { const a = new THREE.InstancedBufferAttribute(new Float32Array(n * size), size); a.setUsage(THREE.DynamicDrawUsage); g.setAttribute(name, a); return a; };

export function createNight(host, o = {}) {
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const devDpr = Math.min(window.devicePixelRatio || 1, 3), dprMax = o.dprMax > 0 ? o.dprMax : 3;
  const renderer = new THREE.WebGLRenderer({ antialias: devDpr < 2, powerPreference: 'high-performance' });
  renderer.setClearColor(0x030108, 1);
  renderer.sortObjects = false;
  const el = renderer.domElement;
  el.className = 'ff-canvas';
  host.append(el);
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(CAM.fov, 1, 0.5, 80), pcam = new THREE.PerspectiveCamera(CAM.fov, 1, 0.5, 80);
  const R = RULE_SETS[RULES_DEFAULT], PACE = R.gen.move.pace;
  const col = new THREE.Color();
  const lin = hex => { col.set(hex); return [col.r, col.g, col.b]; };
  // (the palettes in linear light, flat: an area's 12 numbers — a · b · rim · day; the trench's laps after the areas')
  const PL = new Float32Array((PALETTES.length + TRENCH_PALETTES.length) * 12);
  [...PALETTES, ...TRENCH_PALETTES].forEach((p, i) => { PL.set([...lin(p.a), ...lin(p.b), ...lin(p.rim), ...lin(p.day)], i * 12); });

  // ---- the uniforms every material shares (ONE object each: a twin material in the bloom pass reads the same values)
  const G = { uBloom: { value: 0 }, uTime: { value: 0 }, uTopY: { value: 0 }, uSpin: { value: 0 }, uAspect: { value: 1 }, uGrey: { value: 0 } };
  const TWINS = [];
  // (a twin is BUILT from the material's own pieces + the SAME uniforms object — never cloned: a clone copies every uniform, the wall's target too)
  const twin = (mesh, mat) => {
    const t = new THREE.ShaderMaterial({ vertexShader: mat.vertexShader, fragmentShader: mat.fragmentShader, uniforms: mat.uniforms, extensions: mat.extensions, transparent: mat.transparent, depthTest: mat.depthTest, depthWrite: mat.depthWrite, side: mat.side, blending: mat.blending, blendEquation: mat.blendEquation, blendSrc: mat.blendSrc, blendDst: mat.blendDst });
    TWINS.push([mesh, t, null]);
    return mesh;
  };
  const derivs = { derivatives: true };
  const premul = { transparent: true, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor };

  // ---- THE SHAFT: the wall, drawn into a half-res target by its own little scene, then copied up behind everything
  const wallU = {
    tA: { value: null }, tB: { value: null }, tSky: { value: null }, uCam: { value: new THREE.Vector3() }, uRight: { value: new THREE.Vector3() }, uUp: { value: new THREE.Vector3() }, uFwd: { value: new THREE.Vector3() },
    uTintA: { value: new THREE.Vector3(1, 1, 1) }, uTintB: { value: new THREE.Vector3(1, 1, 1) }, uTan: { value: Math.tan(CAM.fov * RAD / 2) }, uAspect: G.uAspect,
    uHaveA: { value: 0 }, uHaveB: { value: 0 }, uFlipA: { value: 0 }, uFlipB: { value: 0 }, uSkyA: { value: 1 }, uSkyB: { value: 0 }, uHaveSky: { value: 0 }, uFlipSky: { value: 0 },
    uSeamY: { value: -1e4 }, uBallY: { value: 0 }, uDarkY: { value: 1e4 }, uTime: G.uTime, uRW: { value: SHAPE.RW }, uTile: { value: 4 }, uSink: { value: 0 },
  };
  const wallScene = new THREE.Scene(), wallCam = new THREE.Camera();
  const wallQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ vertexShader: WALL_V, fragmentShader: WALL_F, uniforms: wallU, depthTest: false, depthWrite: false }));
  wallQuad.frustumCulled = false; wallScene.add(wallQuad);
  let wallRT = new THREE.WebGLRenderTarget(4, 4, { depthBuffer: false, stencilBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
  const copyU = { tMap: { value: wallRT.texture }, uBloom: G.uBloom };
  const copyMat = new THREE.ShaderMaterial({ vertexShader: COPY_V, fragmentShader: COPY_F, uniforms: copyU, depthTest: false, depthWrite: false });
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), copyMat);
  backdrop.frustumCulled = false; backdrop.renderOrder = -100; scene.add(backdrop); twin(backdrop, copyMat);

  // the pictures: decoded off the frame (createImageBitmap) and uploaded AT ONCE (HIGH RISE's LAG RULES 1) — never at their first draw
  const texs = new Map();   // name → { tex, flip, have }
  let gone = false, workAt = 0;
  const viaImg = url => new Promise((res, rej) => { const im = new Image(); im.onload = () => (im.decode ? im.decode().then(() => res({ image: im, flip: 0 }), () => res({ image: im, flip: 0 })) : res({ image: im, flip: 0 })); im.onerror = rej; im.src = url; });
  const loadPicture = url => (typeof createImageBitmap === 'function' && typeof fetch === 'function'
    ? fetch(url).then(r => { if (!r.ok) throw new Error('no picture'); return r.blob(); }).then(bl => createImageBitmap(bl)).then(bm => ({ image: bm, flip: 1 })).catch(() => viaImg(url))
    : viaImg(url));
  function picture(name, url, repeat) {
    let t = texs.get(name);
    if (t) return t;
    t = { tex: null, flip: 0, have: 0 };
    texs.set(name, t);
    loadPicture(url).then(({ image, flip }) => {
      if (gone) { if (image.close) image.close(); return; }
      const tex = new THREE.Texture(image);
      tex.wrapS = tex.wrapT = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
      if (!repeat) tex.wrapS = THREE.RepeatWrapping;
      tex.generateMipmaps = !!repeat; tex.minFilter = repeat ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;
      tex.flipY = false; tex.needsUpdate = true;
      try { renderer.initTexture(tex); } catch { /* it uploads at its first draw */ }
      t.tex = tex; t.flip = flip; t.have = 1; workAt = performance.now(); wK = -1;
    }).catch(() => { texs.delete(name); });
    return t;
  }
  const wallUrl = name => new URL(`../../../assets/freefall/walls/${name}-night.webp?v=${FF_ART_REV}`, import.meta.url).href;
  const wantWall = name => (name ? picture(name, wallUrl(name), true) : null);
  const skyTex = picture('sky', new URL('../../../assets/jaywalk/skyline-night.webp', import.meta.url).href, false);
  // (THE BLAZE's sprites — Kenney's Particle Pack: two flames, the hot speckle, the smoke, side by side)
  const fxTex = picture('blaze', new URL(`../../../assets/freefall/fx/blaze.webp?v=${FF_ART_REV}`, import.meta.url).href, false);

  // ---- THE TOWER: the pillar + the slices (ONE instanced mesh)
  const pillarMat = new THREE.ShaderMaterial({ vertexShader: PILLAR_V, fragmentShader: PILLAR_F, uniforms: { uBloom: G.uBloom, uTopY: G.uTopY, uCol: { value: new THREE.Color(0x2a1466) } } });
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(SHAPE.RI - 0.004, SHAPE.RI - 0.004, 44, 28, 1, false), pillarMat);   // (capped: the tower's top is its end — nothing stands over the ball's floor)
  pillar.frustumCulled = false; scene.add(pillar); twin(pillar, pillarMat);
  const sGeo = wedgeGeo(), aI = inst(sGeo, 'aI', MAXI, 4), aC = inst(sGeo, 'aC', MAXI, 4), aF = inst(sGeo, 'aF', MAXI, 4), aR = inst(sGeo, 'aR', MAXI, 3);
  const sliceMat = new THREE.ShaderMaterial({ vertexShader: SLICE_V, fragmentShader: SLICE_F, uniforms: { uBloom: G.uBloom, uTopY: G.uTopY, uTime: G.uTime, uSpin: G.uSpin, uGrey: G.uGrey, uRing: { value: SHAPE.RO - SHAPE.RI }, uWidth: { value: SHAPE.RO * (WEDGE - 2 * MARGIN) / 2 } }, extensions: derivs, ...premul });
  const slices = new THREE.Mesh(sGeo, sliceMat);
  slices.frustumCulled = false; sGeo.instanceCount = 0; scene.add(slices); twin(slices, sliceMat);

  // ---- YOUR BEST's gold tape (round the rim of that floor — only while it is in sight)
  const tapeU = { uCol: { value: new THREE.Color(GOLD) }, uGlow: { value: 1 }, uBloom: G.uBloom, uHalf: { value: 0.05 } };
  const tapeMat = new THREE.ShaderMaterial({ vertexShader: TAPE_V, fragmentShader: TAPE_F, uniforms: tapeU, extensions: derivs, side: THREE.DoubleSide, depthWrite: false, ...premul });
  const tape = new THREE.Mesh(new THREE.CylinderGeometry(SHAPE.RO + 0.02, SHAPE.RO + 0.02, 0.1, 72, 1, true), tapeMat);
  tape.frustumCulled = false; tape.visible = false; scene.add(tape); twin(tape, tapeMat);

  // ---- THE BALL (at the FRONT — the rules' fixed angle 0 = +Z here; it never turns with the tower)
  const ballU = { uBloom: G.uBloom, uBlaze: { value: 0 }, uTime: G.uTime, uOut: { value: 0 }, uSquash: { value: new THREE.Vector3(1, 1, 1) }, uEdge: { value: new THREE.Color(0xff8a5c) } };
  const ballMat = new THREE.ShaderMaterial({ vertexShader: BALL_V, fragmentShader: BALL_F, uniforms: ballU });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(SHAPE.R_BALL, 28, 18), ballMat);
  ball.frustumCulled = false; scene.add(ball); twin(ball, ballMat);

  // ---- THE SHARDS + THE SPARKS + THE LIGHTS (pools — a shatter writes into the next free records, the shaders fly them)
  const cGeo = chipGeo(), cO = inst(cGeo, 'aO', SHARDS, 3), cV = inst(cGeo, 'aV', SHARDS, 3), cAx = inst(cGeo, 'aAx', SHARDS, 3), cC = inst(cGeo, 'aC', SHARDS, 3), cT = inst(cGeo, 'aT', SHARDS, 4);
  for (let i = 0; i < SHARDS; i++) { cT.array[i * 4] = -100; cT.array[i * 4 + 1] = 1; cAx.array[i * 3 + 1] = 1; }
  cGeo.instanceCount = SHARDS;
  const shardMat = new THREE.ShaderMaterial({ vertexShader: SHARD_V, fragmentShader: SHARD_F, uniforms: { uTime: G.uTime, uBloom: G.uBloom }, side: THREE.DoubleSide, ...premul });
  const shards = new THREE.Mesh(cGeo, shardMat);
  shards.frustumCulled = false; scene.add(shards); twin(shards, shardMat);
  const pGeo = quadGeo(), pO = inst(pGeo, 'aO', SPARKS, 3), pV = inst(pGeo, 'aV', SPARKS, 3), pT = inst(pGeo, 'aT', SPARKS, 3), pC = inst(pGeo, 'aC', SPARKS, 3);
  for (let i = 0; i < SPARKS; i++) { pT.array[i * 3] = -100; pT.array[i * 3 + 1] = 1; }
  pGeo.instanceCount = SPARKS;
  const addOpt = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor };
  const sparkMat = new THREE.ShaderMaterial({ vertexShader: SPARK_V, fragmentShader: SPARK_F, uniforms: { uTime: G.uTime, uAspect: G.uAspect, uGrav: { value: -4.2 } }, ...addOpt });
  const sparks = new THREE.Mesh(pGeo, sparkMat);
  sparks.frustumCulled = false; scene.add(sparks); twin(sparks, sparkMat);
  const lGeo = quadGeo(), lP = inst(lGeo, 'aP', LIGHTS, 4), lQ = inst(lGeo, 'aQ', LIGHTS, 4), lC = inst(lGeo, 'aC', LIGHTS, 3);
  lGeo.instanceCount = LIGHTS;
  const lightMat = new THREE.ShaderMaterial({ vertexShader: LIGHT_V, fragmentShader: LIGHT_F, uniforms: { uTime: G.uTime, uBloom: G.uBloom, uAspect: G.uAspect }, side: THREE.DoubleSide, ...addOpt });
  // THE BLAZE = NEON FIRE: the flame sprites (a fixed pool, flown in their shader) + the ribbon behind the ball
  const fGeo = quadGeo(), fO = inst(fGeo, 'aO', FLAMES, 3), fV = inst(fGeo, 'aV', FLAMES, 3), fT = inst(fGeo, 'aT', FLAMES, 4);
  for (let i = 0; i < FLAMES; i++) { fT.array[i * 4] = -100; fT.array[i * 4 + 1] = 1; }
  fGeo.instanceCount = FLAMES;
  const flameU = { uTime: G.uTime, uBloom: G.uBloom, tFx: { value: null }, uHave: { value: 0 }, uFlip: { value: 0 } };
  const flameMat = new THREE.ShaderMaterial({ vertexShader: FLAME_V, fragmentShader: FLAME_F, uniforms: flameU, ...addOpt });
  const flames = new THREE.Mesh(fGeo, flameMat);
  flames.frustumCulled = false; scene.add(flames); twin(flames, flameMat);
  const ribbonU = { uAt: { value: new THREE.Vector3() }, uLen: { value: 1 }, uWid: { value: SHAPE.R_BALL * 1.8 }, uTime: G.uTime, uOn: { value: 0 }, uBloom: G.uBloom };
  const ribbonMat = new THREE.ShaderMaterial({ vertexShader: RIBBON_V, fragmentShader: RIBBON_F, uniforms: ribbonU, side: THREE.DoubleSide, ...addOpt });
  const ribbon = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 2, 16), ribbonMat);
  ribbon.frustumCulled = false; scene.add(ribbon); twin(ribbon, ribbonMat);
  const lights = new THREE.Mesh(lGeo, lightMat);
  lights.frustumCulled = false; scene.add(lights); twin(lights, lightMat);
  // (the draw order, fixed once: the shaft · the pillar · the slices · the tape · the shards · the fire's ribbon + flames · the ball — its white heart on top of its own fire · the lights · the sparks)
  backdrop.renderOrder = -100; pillar.renderOrder = 0; slices.renderOrder = 1; tape.renderOrder = 2; shards.renderOrder = 3; ribbon.renderOrder = 3.4; flames.renderOrder = 3.6; ball.renderOrder = 4; lights.renderOrder = 5; sparks.renderOrder = 6;
  scene.children.sort((a, b) => a.renderOrder - b.renderOrder);

  // ---- the floors in sight: a ring of records written INTO (never a new object in play) + what happened to each (broken · cracked · its flashes)
  let run0 = null, h = 0, RR = R;
  const FL = [], FLi = new Int32Array(RING).fill(-1), broken = new Uint16Array(RING), cracked = new Uint16Array(RING), flash = new Float32Array(RING * SLICES), fcol = new Float32Array(RING * 3), frim = new Float32Array(RING * 3), fday = new Float32Array(RING * 3);
  for (let i = 0; i < RING; i++) FL.push({ i: -1, twist: 0, gap: 0, red: 0, m1: 0, m2: 0 });
  /** a floor's palette (its place in PL): its area's — THE TRENCH's by its lap */
  const palOf = i => { const k = areaIndex(i); return (k >= 6 ? PALETTES.length + Math.floor((i - TRENCH_FROM) / LAP) % TRENCH_PALETTES.length : k) * 12; };
  function colourOf(i, slot) {
    // THE AREA PALETTE, DEPTH-RELATIVE: this floor's own colour — a → b down its area; its last three floors lean to the next area's
    const k = areaIndex(i), p = palOf(i), from = k >= 6 ? TRENCH_FROM + Math.floor((i - TRENCH_FROM) / LAP) * LAP : AREAS[k].from, len = k === 5 ? 1 : LAP;
    const t = len > 1 ? (i - from) / (len - 1) : 0, d = from + len - i, q = d <= 3 ? palOf(i + d) : p, tt = q !== p ? (4 - d) / 4 : 0;
    const s3 = slot * 3, lean = i & 1 ? 0.9 : 1;   // (a floor a shade off its neighbours: every second one a little deeper)
    for (let c = 0; c < 3; c++) {
      const top = PL[p + c] + (PL[p + 3 + c] - PL[p + c]) * t;
      fcol[s3 + c] = (top + (PL[q + c] - top) * tt) * lean;
      frim[s3 + c] = PL[p + 6 + c] + (PL[q + 6 + c] - PL[p + 6 + c]) * tt;
      fday[s3 + c] = PL[p + 9 + c] + (PL[q + 9 + c] - PL[p + 9 + c]) * tt;
    }
  }
  function floorRec(i) {
    const slot = i % RING;
    if (FLi[slot] !== i) {
      floorInto(h, i, RR, FL[slot]); FLi[slot] = i; broken[slot] = 0; cracked[slot] = 0;
      for (let s = 0; s < SLICES; s++) flash[slot * SLICES + s] = 0;
      colourOf(i, slot);
    }
    return FL[slot];
  }

  // ---- the scratch numbers a frame shares (typed: never a boxed fraction two functions pass)
  const S = new Float64Array(24);
  const CAMY = 0, KICK = 1, SQUASH = 2, BLAZE = 3, TIME = 4, GH0 = 5, GH1 = 6, GT0 = 7, GT1 = 8, PITCH = 9, BACK = 10, BALLY = 11, PF = 12, PT = 13, OUTK = 14, BEST = 15, LANDT = 16, SHAKE = 17, LASTFLOOR = 18;
  S[GH0] = S[GH1] = -1; S[PITCH] = POSE.play.pitch; S[BACK] = 1; S[BALLY] = POSE.play.ballY; S[BEST] = 0; S[LANDT] = -10;
  let poseFrom = POSE.play, poseTo = POSE.play, poseT0 = -1e9, state = 'live', tier = o.tier == null ? 2 : o.tier, bloom = null, day = o.look === 'day';
  let shardN = 0, sparkN = 0, punchN = 0, flameN = 0, flameOwed = 0, emberOwed = 0, fxHave = 0, wK = -1, wA = 0, wB = 0, wS = 0, areaA = 0;
  const punchAt = new Float64Array(PUNCHES).fill(-10);
  const rnd = (() => { let x = 0x2545f491; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; })();

  function reset(run) {
    run0 = run; h = run.h; RR = run.R;
    FLi.fill(-1); broken.fill(0); cracked.fill(0); flash.fill(0);
    S[CAMY] = 0; S[KICK] = 0; S[SQUASH] = 0; S[BLAZE] = 0; S[GH0] = S[GH1] = -1; S[OUTK] = 0; S[LANDT] = -10; S[SHAKE] = 0; S[LASTFLOOR] = 0;
    state = 'live'; areaA = 0; wK = -1;
    for (let i = 0; i < SHARDS; i++) cT.array[i * 4] = -100;
    for (let i = 0; i < SPARKS; i++) pT.array[i * 3] = -100;
    for (let i = 0; i < FLAMES; i++) fT.array[i * 4] = -100;
    cT.needsUpdate = true; pT.needsUpdate = true; fT.needsUpdate = true; punchAt.fill(-10); flameOwed = 0; emberOwed = 0;
    wantWall('offices');
  }

  // ---- THE EFFECTS a shatter / a landing spawns (written into the pools — no object made)
  function spark(x, y, z, vx, vy, vz, life, wid, r, g, b) {
    const i = sparkN++ % SPARKS;
    pO.array[i * 3] = x; pO.array[i * 3 + 1] = y; pO.array[i * 3 + 2] = z;
    pV.array[i * 3] = vx; pV.array[i * 3 + 1] = vy; pV.array[i * 3 + 2] = vz;
    pT.array[i * 3] = S[TIME]; pT.array[i * 3 + 1] = life; pT.array[i * 3 + 2] = wid;
    pC.array[i * 3] = r; pC.array[i * 3 + 1] = g; pC.array[i * 3 + 2] = b;
  }
  function burst(n, y, r, g, b, speed, up) {
    if (reduce) n = Math.min(n, 4);
    for (let k = 0; k < n; k++) {
      const a = rnd() * 6.2832, v = speed * (0.4 + 0.8 * rnd());
      spark((rnd() - 0.5) * 0.2, y, SHAPE.RB + (rnd() - 0.5) * 0.2, Math.cos(a) * v, up * (0.5 + rnd()), Math.sin(a) * v * 0.7 + 0.4, 0.35 + rnd() * 0.4, 0.012 + rnd() * 0.012, r, g, b);
    }
    pO.needsUpdate = pV.needsUpdate = pT.needsUpdate = pC.needsUpdate = true;
  }
  /** one flame sprite into the pool (its start, its drift, its life, its size — the shader flies it) */
  function flame(x, y, z, vx, vy, vz, life, size) {
    const i = flameN++ % FLAMES;
    fO.array[i * 3] = x; fO.array[i * 3 + 1] = y; fO.array[i * 3 + 2] = z;
    fV.array[i * 3] = vx; fV.array[i * 3 + 1] = vy; fV.array[i * 3 + 2] = vz;
    fT.array[i * 4] = S[TIME]; fT.array[i * 4 + 1] = life; fT.array[i * 4 + 2] = size; fT.array[i * 4 + 3] = rnd();
  }
  function shatter(floor, red) {
    const y = -floor * SHAPE.H - SHAPE.THICK / 2, slot = floor % RING;
    const cr = red ? 1 : fcol[slot * 3], cg = red ? 0.03 : fcol[slot * 3 + 1], cb = red ? 0.09 : fcol[slot * 3 + 2];
    const n = reduce ? 4 : tier === 0 ? 8 : 14;
    for (let k = 0; k < n; k++) {
      const i = shardN++ % SHARDS, a = (rnd() - 0.5) * 1.5, v = 1.2 + rnd() * 2.2, rr = SHAPE.RI + (SHAPE.RO - SHAPE.RI) * (0.2 + 0.75 * rnd()), th = (rnd() - 0.5) * 0.45;
      cO.array[i * 3] = rr * Math.sin(th); cO.array[i * 3 + 1] = y; cO.array[i * 3 + 2] = rr * Math.cos(th);
      cV.array[i * 3] = Math.sin(a) * v; cV.array[i * 3 + 1] = 0.6 + rnd() * 2.4; cV.array[i * 3 + 2] = 0.3 + Math.cos(a) * v * 0.6;
      cAx.array[i * 3] = rnd() - 0.5; cAx.array[i * 3 + 1] = rnd() - 0.5; cAx.array[i * 3 + 2] = rnd() - 0.5;
      const shade = 0.75 + 0.5 * rnd();
      cC.array[i * 3] = cr * shade; cC.array[i * 3 + 1] = cg * shade; cC.array[i * 3 + 2] = cb * shade;
      cT.array[i * 4] = S[TIME]; cT.array[i * 4 + 1] = 0.75 + rnd() * 0.45; cT.array[i * 4 + 2] = 0.07 + rnd() * 0.11; cT.array[i * 4 + 3] = (rnd() - 0.5) * 22;
    }
    cO.needsUpdate = cV.needsUpdate = cAx.needsUpdate = cC.needsUpdate = cT.needsUpdate = true;
    burst(tier === 0 ? 8 : 16, y + 0.08, 1, 0.78, 0.3, 3.4, 2.6); burst(tier === 0 ? 4 : 10, y + 0.08, 1, 0.2, 0.62, 3, 2.2);   // (gold + neon-pink sparks)
    const p = punchN++ % PUNCHES;
    punchAt[p] = S[TIME];
    lP.array[(PUNCH0 + p) * 4] = 0; lP.array[(PUNCH0 + p) * 4 + 1] = -floor * SHAPE.H + 0.02; lP.array[(PUNCH0 + p) * 4 + 2] = SHAPE.RB; lP.array[(PUNCH0 + p) * 4 + 3] = 0.95;
    lP.array[(PUNCH0 + p) * 4 + 3] = 1.2;   // (THE FIRE SHOCKWAVE: its colours are the fire's own ramp — night-fx.js LIGHT_F kind 3)
    // … and THE FIRE goes through with the ball: a burst of flame along the floor (its shockwave ring is the punch)
    const fb = reduce ? 3 : tier === 0 ? 7 : 12;
    for (let k = 0; k < fb; k++) { const a = rnd() * 6.2832, v = 1.1 + rnd() * 1.6; flame((rnd() - 0.5) * 0.15, y + 0.12, SHAPE.RB + (rnd() - 0.5) * 0.15, Math.cos(a) * v, 0.5 + rnd() * 0.9, Math.sin(a) * v * 0.6 + 0.3, 0.3 + rnd() * 0.25, 0.2 + rnd() * 0.16); }
    fO.needsUpdate = fV.needsUpdate = fT.needsUpdate = true;
    if (!reduce) { S[KICK] = 0.2; S[SHAKE] = 1; }
  }

  /** the run's EVENTS since the last frame, in order (engine.js) — `n` of them from `from` (the stage's kept list) */
  function feed(events, from = 0, n = events.length) {
    for (let k = from; k < n; k++) {
      const e = events[k];
      if (e.e === 'shatter') { floorRec(e.floor); broken[e.floor % RING] |= 1 << e.slice; shatter(e.floor, e.red); S[BLAZE] = 0; }
      else if (e.e === 'bounce') {
        S[SQUASH] = 1; S[LANDT] = S[TIME];
        floorRec(e.floor);
        flash[(e.floor % RING) * SLICES + e.slice] = e.red ? 1.2 : 0.32;
        if (e.red) { cracked[e.floor % RING] |= 1 << e.slice; burst(tier === 0 ? 6 : 14, -e.floor * SHAPE.H + 0.1, 1, 0.15, 0.2, 2.4, 2.2); if (!reduce) S[SHAKE] = 0.6; }
      } else if (e.e === 'fall') {
        // the floor just passed lets go (it fades as the ball drops through it)
        const f = e.floor - 1;
        if (S[GH0] < 0 || S[TIME] - S[GT0] > 0.3) { S[GH0] = f; S[GT0] = S[TIME]; } else { S[GH1] = f; S[GT1] = S[TIME]; }
      } else if (e.e === 'blaze') { S[BLAZE] = 1; burst(tier === 0 ? 6 : 12, -e.floor * SHAPE.H + SHAPE.H * 0.8, 1, 0.78, 0.28, 2.2, 1.6); burst(tier === 0 ? 3 : 8, -e.floor * SHAPE.H + SHAPE.H * 0.8, 1, 0.2, 0.62, 2, 1.4); }   // (it catches fire: gold + pink sparks)
      else if (e.e === 'out') {
        state = e.cause;
        if (e.cause === 'red') { burst(tier === 0 ? 14 : 30, -run0.floor * SHAPE.H + 0.14, 1, 0.2, 0.25, 3.6, 3); if (!reduce) { S[KICK] = 0.12; S[SHAKE] = 1; } const fr = floorRec(run0.floor), su = sliceUnder(run0.a, fr.twist); flash[(run0.floor % RING) * SLICES + su] = 1.4; }
      } else if (e.e === 'made' || e.e === 'cap') state = e.e;
    }
  }

  /** a scene built again mid-run (a lost context): what the events so far did to the floors still in sight — no effect is played again */
  function adopt(run, events, n = events.length) {
    for (let k = 0; k < n; k++) {
      const e = events[k];
      if (e.floor == null || e.floor < run.floor - 1) continue;
      if (e.e === 'shatter') { floorRec(e.floor); broken[e.floor % RING] |= 1 << e.slice; }
      else if (e.e === 'bounce' && e.red) { floorRec(e.floor); cracked[e.floor % RING] |= 1 << e.slice; }
      else if (e.e === 'out') state = e.cause;
    }
    S[CAMY] = run.floor;
  }

  // ---- the size, the tiers, the camera
  let w = 0, hh = 0, dist = 6, ppr = 100, dpr = 1, sized = false, cssW = 0, cssH = 0;
  function measure() { cssW = host.clientWidth; cssH = host.clientHeight; sized = false; }
  const ro = new ResizeObserver(measure);
  ro.observe(host);
  measure();
  function place(c, pitchDeg, back, ballY, camY, kick) {
    // the camera looks at a point below the ball's floor so that floor sits `ballY` down the screen (the graybox's maths)
    const p = pitchDeg * RAD, cp = Math.cos(p), sp = Math.sin(p), n = 1 - 2 * ballY, t = Math.tan(CAM.fov * RAD / 2), d = dist * back, drop = n * t * d / (cp + n * t * sp);
    const lookY = -camY * SHAPE.H - drop + kick;
    c.position.set(0, lookY + d * sp, SHAPE.RB + d * cp);
    c.lookAt(0, lookY, SHAPE.RB);
    c.updateMatrixWorld();
    return lookY;
  }
  const V = new THREE.Vector3();
  function size() {
    if (!cssW || !cssH) return;
    sized = true;
    w = cssW; hh = cssH;
    dpr = Math.min(devDpr, dprMax, tier === 2 ? 3 : tier === 1 ? 2 : 1.5);
    renderer.setPixelRatio(dpr); renderer.setSize(w, hh, false);
    cam.aspect = pcam.aspect = w / hh;
    // THE RING ≈ CAM.fill OF THE SCREEN WIDTH (on a wide screen: of a phone-shaped column in its middle)
    const a = Math.min(cam.aspect, CAM.aspectMax);
    dist = SHAPE.RO / (CAM.fill * a * Math.tan(CAM.fov * RAD / 2));
    cam.updateProjectionMatrix(); pcam.updateProjectionMatrix();
    G.uAspect.value = w / hh;
    const bw = Math.max(2, Math.round(w * dpr)), bh = Math.max(2, Math.round(hh * dpr));
    wallRT.setSize(Math.max(2, bw >> 1), Math.max(2, bh >> 1));
    if (bloom) bloom.size(bw, bh);
    // the screen pixels ONE RADIAN of tower turn moves the ring under the ball IN THE PLAY POSE (the drag's 1 : 1 — never the opening's)
    place(pcam, POSE.play.pitch, 1, POSE.play.ballY, 0, 0);
    V.set(0, 0, SHAPE.RB).project(pcam); const x0 = V.x;
    V.set(0.05, 0, SHAPE.RB).project(pcam);
    ppr = Math.abs(V.x - x0) * w / 2 / 0.05 * SHAPE.RB;
  }
  function setTier(t) {
    tier = t;
    if (t === 2 && !bloom) { try { bloom = createBloom(renderer, G.uBloom); } catch { bloom = null; } }
    sized = false;
  }
  setTier(tier);
  size();

  function pose(name, now = false) {
    const to = POSE[name] || POSE.play;
    if (to === poseTo && !now) return;
    poseFrom = { pitch: S[PITCH], back: S[BACK], ballY: S[BALLY] }; poseTo = to; poseT0 = now ? -1e9 : S[TIME];
    if (now) { S[PITCH] = to.pitch; S[BACK] = to.back; S[BALLY] = to.ballY; }
  }

  /** the ball's height over its floor's top (world units) at `tau` ticks — the VIEW's own arc between the landings the engine gave */
  function ballLift(run, tau) {
    const span = run.nl - run.pl, u = span > 0 ? Math.min(1, Math.max(0, (tau - run.pl) / span)) : 1;
    if (run.st !== 'live') return run.cause === 'red' || run.st === 'made' ? 0 : SHAPE.HOP * 0.5;
    if (run.fl === 'bounce') return SHAPE.HOP * 4 * u * (1 - u);
    if (run.fl === 'drop') return SHAPE.HOP * 0.55 * 4 * u * (1 - u);   // (the start: one small hop on floor 0 — the ball was resting there)
    // a fall: from the floor above — one H up — down to this one, speeding up
    return SHAPE.H * (1 - u) * (1 - 0.45 * u);
  }

  /** the walls the shaft shows now: the camera's area (A) + the next one (B), the seam between them at a world height */
  function walls(floor) {
    const k = areaIndex(Math.max(0, floor - 5));   // (the seam stays in sight a few floors after the ball crossed it)
    const nk = Math.min(AREAS.length - 1, k + 1), seam = k === nk ? -1e5 : -AREAS[nk].from * SHAPE.H;
    const an = WALLS[k], bn = WALLS[nk], A = wantWall(an), B = floor > AREAS[nk].from - 34 ? wantWall(bn) : null;
    const ha = A ? A.have : 0, hb = B ? B.have : 0;
    if (k === wK && ha === wA && hb === wB && skyTex.have === wS) return;   // (asked every frame: four numbers compared — no key built)
    wK = k; wA = ha; wB = hb; wS = skyTex.have; areaA = k;
    wallU.uSkyA.value = an ? 0 : 1; wallU.uSkyB.value = bn ? 0 : 1;
    wallU.tA.value = A && A.tex; wallU.uHaveA.value = A ? A.have : 0; wallU.uFlipA.value = A ? A.flip : 0;
    wallU.tB.value = B && B.tex; wallU.uHaveB.value = B ? B.have : 0; wallU.uFlipB.value = B ? B.flip : 0;
    wallU.tSky.value = skyTex.tex; wallU.uHaveSky.value = skyTex.have; wallU.uFlipSky.value = skyTex.flip;
    const ta = WALL_TINT[an] || WALL_TINT.deep, tb = WALL_TINT[bn] || WALL_TINT.deep;
    wallU.uTintA.value.set(ta[0], ta[1], ta[2]); wallU.uTintB.value.set(tb[0], tb[1], tb[2]);
    wallU.uSeamY.value = seam;
  }

  /** one floor's solid slices into the instance arrays from record `n` → the next free record */
  function putFloor(i, n, alpha, out, tick) {
    const rec = floorRec(i), slot = i % RING, gone_ = broken[slot], crk = cracked[slot];
    const mv = rec.m1 ? moversAt(rec, tick, RR) : 0;
    let warn = 0, wk = 0;
    if (rec.m1) { warn = moversAt(rec, tick + PACE, RR) & ~mv; const into = tick % PACE; wk = 0.35 + 0.65 * Math.min(1, Math.max(0, (into - (PACE - 18)) / 18)); }
    const y = -i * SHAPE.H, s3 = slot * 3, tc = day ? fday : fcol, r = tc[s3], g = tc[s3 + 1], b = tc[s3 + 2], I = aI.array, C = aC.array, F = aF.array, RM = aR.array;
    for (let s = 0; s < SLICES; s++) {
      if (((rec.gap | gone_) >> s) & 1) continue;
      if (n >= MAXI) return n;
      const kind = (rec.red >> s) & 1 ? 1 : (mv >> s) & 1 ? 2 : 0, q = n * 4, shade = s & 1 ? 1 : 0.93;
      I[q] = (sliceStart(s) + rec.twist) * UNIT; I[q + 1] = y; I[q + 2] = kind ? SHAPE.RISE : 0; I[q + 3] = kind;
      C[q] = r * shade; C[q + 1] = g * shade; C[q + 2] = b * shade; C[q + 3] = alpha;
      F[q] = flash[slot * SLICES + s]; F[q + 1] = (warn >> s) & 1 ? wk : 0; F[q + 2] = (crk >> s) & 1; F[q + 3] = out;
      RM[n * 3] = frim[s3]; RM[n * 3 + 1] = frim[s3 + 1]; RM[n * 3 + 2] = frim[s3 + 2];
      n++;
    }
    return n;
  }

  let frames = 0;
  /** one frame: the run, `tau` = the clock in ticks (a fraction into the next one), `dt` ms since the last frame, `extra` = angle units the tower shows ahead of the run (the finger's moves before tick 0) */
  function draw(run, tau, dt, extra = 0) {
    if (!sized) size();
    if (!w) return;
    frames++;
    const sec = dt / 1000;
    S[TIME] += sec;
    const time = S[TIME], tick = Math.floor(tau);
    G.uTime.value = time;
    const k = dt >= 1000 ? 1 : 1 - Math.exp(-dt / 110);
    // the pose eases (THE OPENING → the play camera: one sweep)
    const pk = Math.min(1, Math.max(0, (time - poseT0) * 1000 / POSE_MS)), pe = pk * pk * (3 - 2 * pk);
    S[PITCH] = poseFrom.pitch + (poseTo.pitch - poseFrom.pitch) * pe; S[BACK] = poseFrom.back + (poseTo.back - poseFrom.back) * pe; S[BALLY] = poseFrom.ballY + (poseTo.ballY - poseFrom.ballY) * pe;
    // the camera follows the ball's FLOOR (never its bounce); in a fall it glides down with the ball
    const span = run.nl - run.pl, u = run.st === 'live' && run.fl === 'fall' && span > 0 ? Math.min(1, Math.max(0, (tau - run.pl) / span)) : 1;
    const want = run.floor - (1 - u);
    S[CAMY] += (want - S[CAMY]) * k;
    S[KICK] *= Math.exp(-sec * 9); S[SHAKE] *= Math.exp(-sec * 11);
    const shake = S[SHAKE] > 0.01 ? Math.sin(time * 71) * 0.035 * S[SHAKE] : 0;
    const lookY = place(cam, S[PITCH], S[BACK], S[BALLY], S[CAMY], -S[KICK] + shake);
    pillar.position.y = -(want > S[CAMY] ? want : S[CAMY]) * SHAPE.H - 0.004 - 22; pillar.updateMatrix(); pillar.matrixWorld.copy(pillar.matrix);   // (its cap flush with the ball's floor — the dark eye in the middle of the top ring; it goes down with the BALL's own glide: never a stub over the floor it lands on)
    G.uSpin.value = (run.a + extra) * UNIT;
    G.uTopY.value = -S[CAMY] * SHAPE.H;

    // the flashes fade
    for (let i = 0; i < RING * SLICES; i++) if (flash[i] > 0) { flash[i] -= sec * 3.2; if (flash[i] < 0) flash[i] = 0; }
    // the slices: the deepest floor first, the ball's last, then the floors just passed (fading out)
    let n = 0;
    for (let i = run.floor + BELOW; i >= run.floor; i--) n = putFloor(i, n, 1, 0, tick);
    for (let gi = 0; gi < 2; gi++) {
      const gf = S[GH0 + gi];
      if (gf < 0) continue;
      const age = (time - S[GT0 + gi]) / 0.22;
      if (age >= 1 || gf >= run.floor) { if (age >= 1) S[GH0 + gi] = -1; if (gf >= run.floor) continue; }
      if (S[GH0 + gi] >= 0) { const e = Math.max(0, (age - 0.25) / 0.75); n = putFloor(gf, n, 1 - e * e, e, tick); }
    }
    sGeo.instanceCount = n;
    aI.needsUpdate = aC.needsUpdate = aF.needsUpdate = aR.needsUpdate = true;

    // the ball
    const lift = ballLift(run, tau), by = -run.floor * SHAPE.H + SHAPE.R_BALL + lift;
    const fr = floorRec(run.floor), su = sliceUnder(run.a, fr.twist), solid = !(((fr.gap | broken[run.floor % RING]) >> su) & 1);
    const raised = solid && ((((fr.red | (fr.m1 ? moversAt(fr, tick, RR) : 0)) >> su) & 1)) ? SHAPE.RISE : 0;
    ball.position.set(0, by + (lift < 0.02 ? raised : 0), SHAPE.RB); ball.updateMatrix(); ball.matrixWorld.copy(ball.matrix);
    S[SQUASH] *= Math.exp(-sec * 14);
    const sq = reduce ? 0 : S[SQUASH] * 0.28;
    ballU.uSquash.value.set(1 + sq * 0.6, 1 - sq, 1 + sq * 0.6);
    const lit = run.blaze && run.st === 'live' ? 1 : 0;
    S[BLAZE] += (lit - S[BLAZE]) * Math.min(1, sec * 10);
    ballU.uBlaze.value = S[BLAZE];
    S[OUTK] += ((state === 'dark' ? 1 : 0) - S[OUTK]) * Math.min(1, sec * 6);
    ballU.uOut.value = S[OUTK];
    ball.visible = state !== 'red';   // (HIT THE RED: the ball bursts — the sparks are what is left)

    // THE LIGHTS: 0 the ball's halo · 1 its trail · 2 THE MARK where its centre comes down · 3… the punches
    const P = lP.array, Q = lQ.array, LC = lC.array, alive = state === 'live' || state === 'made' || state === 'cap' ? 1 : 0, bz = S[BLAZE];
    P[0] = 0; P[1] = ball.position.y; P[2] = SHAPE.RB; P[3] = SHAPE.R_BALL * (3.6 + 1.6 * bz);
    Q[0] = 0; Q[1] = (0.5 + 0.45 * bz) * alive; Q[2] = 0; Q[3] = 0;
    LC[0] = 1; LC[1] = 0.42 - 0.2 * bz; LC[2] = 0.36 + 0.22 * bz;   // (lit: the fire's own neon-pink outer glow; unlit: as it was)
    const falling = run.st === 'live' && run.fl === 'fall' ? 1 : 0;
    P[4] = 0; P[5] = ball.position.y; P[6] = SHAPE.RB; P[7] = SHAPE.R_BALL * (1.25 + 0.5 * bz);
    Q[4] = 1; Q[5] = falling * 0.3 * (1 - bz) * alive; Q[6] = 0.55; Q[7] = 1.7;   // (the plain fall's faint streak; THE BLAZE has its ribbon + its flames)
    LC[3] = 1; LC[4] = 0.47 + 0.2 * (1 - bz); LC[5] = 0.08 + 0.6 * (1 - bz);
    // THE MARK: on the slice under the ball's centre — through a gap, on the floor below (dimmer)
    let my = -run.floor * SHAPE.H + raised + 0.008, ms = solid ? 0.95 : 0;
    if (!solid) {
      const nf = floorRec(run.floor + 1), ns = sliceUnder(run.a, nf.twist);
      if (!((nf.gap >> ns) & 1)) { my = -(run.floor + 1) * SHAPE.H + ((((nf.red | (nf.m1 ? moversAt(nf, tick, RR) : 0)) >> ns) & 1) ? SHAPE.RISE : 0) + 0.008; ms = 0.5; }
    }
    P[8] = 0; P[9] = my; P[10] = SHAPE.RB; P[11] = SHAPE.R_BALL * 1.35;
    Q[8] = 2; Q[9] = ms * alive * (1 - 0.5 * Math.min(1, lift / SHAPE.HOP)); Q[10] = 0; Q[11] = 0;
    LC[6] = 1; LC[7] = 0.82; LC[8] = 0.95;
    for (let p = 0; p < PUNCHES; p++) { const age = (time - punchAt[p]) / 0.5, q = (PUNCH0 + p) * 4; Q[q] = 3; Q[q + 1] = age >= 0 && age < 1 ? 1.2 : 0; Q[q + 2] = Math.min(1, Math.max(0, age)); Q[q + 3] = 0; }
    lP.needsUpdate = lQ.needsUpdate = lC.needsUpdate = true;

    // THE BLAZE = NEON FIRE: the ribbon behind the ball, flames shed where it has just been (it falls away from them: a billowing
    // column), embers drifting off it — a fixed budget, the tier trims the rate
    ribbonU.uAt.value.set(0, ball.position.y, SHAPE.RB); ribbonU.uOn.value = bz * alive; ribbonU.uLen.value = 0.9 + 1.0 * falling;
    if (fxTex.have !== fxHave) { fxHave = fxTex.have; flameU.tFx.value = fxTex.tex; flameU.uHave.value = 1; flameU.uFlip.value = fxTex.flip; }
    if (bz > 0.4 && alive && !reduce) {
      flameOwed += sec * FLAME_RATE[tier]; emberOwed += sec * EMBER_RATE[tier];
      let made = 0;
      while (flameOwed >= 1 && made < 6) {
        flameOwed -= 1; made++;
        flame((rnd() - 0.5) * 0.15, ball.position.y + rnd() * 0.12, SHAPE.RB + (rnd() - 0.5) * 0.12, (rnd() - 0.5) * 0.9, 0.08 + rnd() * 0.4, (rnd() - 0.5) * 0.42 + 0.12, FLAME_LIFE * (0.54 + rnd() * 0.46), 0.2 + rnd() * 0.14);
      }
      if (flameOwed > 6) flameOwed = 0;
      if (made) fO.needsUpdate = fV.needsUpdate = fT.needsUpdate = true;
      if (emberOwed >= 1) {
        emberOwed -= 1;
        // an ember: gold or neon pink, slow, drifting out + up as the ball leaves it behind
        const pink = rnd() < 0.4 ? 1 : 0, a = rnd() * 6.2832, v = 0.3 + rnd() * 0.8;
        spark((rnd() - 0.5) * 0.14, ball.position.y + rnd() * 0.2, SHAPE.RB + (rnd() - 0.5) * 0.1, Math.cos(a) * v, 0.4 + rnd() * 1.1, Math.sin(a) * v * 0.6 + 0.2, 0.45 + rnd() * 0.45, 0.009 + rnd() * 0.009, 1, pink ? 0.2 : 0.74, pink ? 0.62 : 0.26);
        pO.needsUpdate = pV.needsUpdate = pT.needsUpdate = pC.needsUpdate = true;
        if (emberOwed > 4) emberOwed = 0;
      }
    } else { flameOwed = 0; emberOwed = 0; }

    // YOUR BEST's tape: round the rim of that floor while it is in sight below
    const best = S[BEST];
    tape.visible = best > 0 && best >= run.floor && best <= run.floor + BELOW;
    if (tape.visible) { tape.position.y = -best * SHAPE.H - 0.045; tape.updateMatrix(); tape.matrixWorld.copy(tape.matrix); tapeU.uGlow.value = 0.85 + 0.15 * Math.sin(time * 3); }

    // THE SHAFT → its half-res target, then the picture
    walls(run.floor);
    const e = cam.matrixWorld.elements;
    wallU.uCam.value.copy(cam.position); wallU.uRight.value.set(e[0], e[1], e[2]); wallU.uUp.value.set(e[4], e[5], e[6]); wallU.uFwd.value.set(-e[8], -e[9], -e[10]);
    wallU.uBallY.value = -S[CAMY] * SHAPE.H;
    wallU.uDarkY.value = run.st === 'live' || state === 'dark' ? -run.dk * SHAPE.H : 1e4;
    wallU.uSink.value = Math.min(0.9, S[CAMY] * 0.022);
    renderer.setRenderTarget(wallRT); renderer.render(wallScene, wallCam); renderer.setRenderTarget(null);
    renderer.render(scene, cam);
    if (bloom && tier === 2) bloom.render(scene, cam, TWINS, 1);
  }

  // (a static scene: no mesh composes its matrix a frame — the ones that move set theirs in draw)
  for (const m of scene.children) { m.updateMatrix(); m.matrixAutoUpdate = false; m.matrixWorld.copy(m.matrix); }
  scene.matrixAutoUpdate = false; scene.matrixWorldAutoUpdate = false;
  cam.matrixWorldAutoUpdate = false;   // (place() sets it — once a frame)
  size();

  /** THE WARM FRAME: one of everything, drawn once before the first drag — every program built, every buffer uploaded (HIGH RISE's LAG RULES 3) */
  function warm(run) {
    if (!w) return false;
    try {
      const t = S[TIME];
      shatter(BELOW, false); burst(4, -3, 1, 1, 1, 1, 1); tape.visible = true; ribbonU.uOn.value = 1;
      renderer.compile(scene, cam); renderer.compile(wallScene, wallCam);
      draw(run, FIRST, 16);
      for (let i = 0; i < SHARDS; i++) cT.array[i * 4] = -100;
      for (let i = 0; i < SPARKS; i++) pT.array[i * 3] = -100;
      for (let i = 0; i < FLAMES; i++) fT.array[i * 4] = -100;
      cT.needsUpdate = true; pT.needsUpdate = true; fT.needsUpdate = true; punchAt.fill(-10); S[KICK] = 0; S[SHAKE] = 0; S[TIME] = t;
      return true;
    } catch { return false; }
  }

  const proj = (x, y, z, c = cam) => { V.set(x, y, z).project(c); return [(1 + V.x) / 2, (1 - V.y) / 2]; };
  return {
    el, reset, feed, adopt, draw, pose, setTier, warm,
    /** YOUR BEST's floor (0 = none): the gold tape lies round its rim */
    setBest(floor) { S[BEST] = floor > 0 ? floor : 0; },
    /** the review's shot: the picture with the colour removed (red must still read) */
    grey(on) { G.uGrey.value = 0; el.style.filter = on ? 'grayscale(1)' : ''; },   // (the WHOLE picture — the fire too; a check's tool, never on in play)
    /** the page went away / came back: the targets are let go while nobody looks (the memory a hidden tab holds) */
    rest(hidden) { if (hidden) { wallRT.setSize(2, 2); if (bloom) bloom.size(4, 4); } else sized = false; },
    /** the screen pixels one RADIAN of tower turn moves the ring under the ball (the play pose) — the drag's 1 : 1 */
    pxPerRad: () => ppr,
    project: (x, y, z) => proj(x, y, z),
    /** where things are on the screen — the page's own check: the ball (its centre + its size in px), its floor's line, the floors in sight under it */
    frame(run) {
      const c = proj(ball.position.x, ball.position.y, ball.position.z), top = proj(0, ball.position.y + SHAPE.R_BALL, SHAPE.RB), bot = proj(0, ball.position.y - SHAPE.R_BALL, SHAPE.RB), edge = proj(SHAPE.R_BALL, ball.position.y, SHAPE.RB);
      const rows = [];
      for (let i = 0; i <= BELOW; i++) rows.push(proj(0, -(run.floor + i) * SHAPE.H, SHAPE.RO)[1]);
      const ringL = proj(-SHAPE.RO, -run.floor * SHAPE.H, 0), ringR = proj(SHAPE.RO, -run.floor * SHAPE.H, 0);
      return { ball: { x: c[0] * w, y: c[1] * hh, d: Math.max(Math.abs(bot[1] - top[1]) * hh, Math.abs(edge[0] - c[0]) * w * 2) }, floorY: proj(0, -run.floor * SHAPE.H, SHAPE.RB)[1], rows, ring: [ringL[0], ringR[0]], w, h: hh };
    },
    /** the screen y (0 … 1) of the TOP of the ball at the top of a bounce on its floor, in the PLAY pose — the HUD must end above it */
    apexY(run) { place(pcam, POSE.play.pitch, 1, POSE.play.ballY, run.floor, 0); return proj(0, -run.floor * SHAPE.H + 2 * SHAPE.R_BALL + SHAPE.HOP, SHAPE.RB, pcam)[1]; },
    info: () => ({ flames: FLAMES, fx: fxTex.have, calls: renderer.info.render.calls, tris: renderer.info.render.triangles, programs: renderer.info.programs ? renderer.info.programs.length : 0, dpr, w, h: hh, tier, bloom: !!bloom && tier === 2, slices: sGeo.instanceCount, area: areaA, walls: [...texs.entries()].map(([k, t]) => `${k}:${t.have}`).join(' '), frames, pose: [S[PITCH], S[BACK], S[BALLY]] }),
    /** the last time a picture landed (a frame after it may be a long one: the stage's hitch counter names it) */
    lastWork: () => workAt,
    destroy() {
      gone = true;
      ro.disconnect();
      for (const t of texs.values()) if (t.tex) { const im = t.tex.image; t.tex.dispose(); if (im && im.close) im.close(); }
      for (const m of [pillar, slices, tape, ball, shards, sparks, flames, ribbon, lights, backdrop, wallQuad]) { m.geometry.dispose(); m.material.dispose(); }
      for (const t of TWINS) t[1].dispose();
      wallRT.dispose(); if (bloom) bloom.dispose();
      renderer.dispose();
      try { renderer.forceContextLoss(); } catch { /* fine */ }
      el.remove();
    },
  };
}
