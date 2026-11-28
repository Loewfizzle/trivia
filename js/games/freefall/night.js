// FREEFALL — THE SCENE: THE NIGHT LOOK (F2) + THE DAY LOOK … night.js#1
import * as THREE from 'three';
import { TURN, SLICES, AREAS, FIRST, FALL, RULE_SETS, RULES_DEFAULT } from './tuning.js';
import { floorInto, sliceStart, sliceUnder, moversAt } from './tower-gen.js';
import { areaIndex } from './logic.js';
import { PALETTES, TRENCH_PALETTES, GOLD_AREAS } from './palettes.js';
import { WALL_V, WALL_F, SKY_V, SKY_F, COPY_V, COPY_F, SLICE_V, SLICE_F, PILLAR_V, PILLAR_F, BALL_V, BALL_F, LIGHT_V, LIGHT_F, SHARD_V, SHARD_F, SPARK_V, SPARK_F, TAPE_V, TAPE_F, FLAME_V, FLAME_F, RIBBON_V, RIBBON_F, createBloom } from './night-fx.js';
import { MOTE_V, MOTE_F } from './day-fx.js';
import { createBreaks, SKYLIGHT, BREAK_FLOORS } from './breaks.js';
import { createGhostLayer, GHOST_STRIDE } from './ghost-fx.js';
import { createVeil } from './veil.js';

/** bump when a picture is replaced (the walls' cache key) */
export const FF_ART_REV = 1;
/** the world (the lab's graybox numbers — the DRAG's 1 : 1 scale is the owner's phone check): a floor every H down the shaft; the ring
 *  from the pillar (RI) out to RO; the ball rides at RB. The ball is drawn a little smaller than the graybox's (its CENTRE decides: less
 *  of it hangs over the neighbour) — still ≥ 34 pt at 390 wide; a red slice stands RISE proud of the floor */
export const SHAPE = Object.freeze({ H: 1, RO: 1, RI: 0.2, RB: 0.66, R_BALL: 0.125, THICK: 0.2, HOP: 0.42, RISE: 0.1, RW: 2.7 });
// THE CAMERA (the graybox's): in front of the ball, `pitch`° … night.js#2
export const CAM = Object.freeze({ fov: 46, pitch: 33, fill: 0.8, ballY: 0.34, aspectMax: 0.47 });
// THE POSES: `play` (the graybox's camera) · `open` (THE … night.js#3
export const POSE = Object.freeze({ play: Object.freeze({ pitch: 33, back: 1, ballY: 0.34 }), open: Object.freeze({ pitch: 27, back: 0.94, ballY: 0.56 }),
  // (F3B — the fresh-eyes review: THE FINISH's own camera — the … night.js#4
  finish: Object.freeze({ pitch: 29, back: 0.9, ballY: 0.55 }) });
// a FINISH: the tower's core ends as a broken stump in the … night.js#5
export const SHOT_HALO = 0.35;
export const STUMP = 0; // night#6
export const POSE_MS = 950;
/** the floors drawn under the ball's (only the nearest ~10 are ever in sight) */
export const BELOW = 9;
const RAD = Math.PI / 180, UNIT = 2 * Math.PI / TURN, WEDGE = 2 * Math.PI / SLICES, MARGIN = 0.02, SEG = 6;
const RING = 32;                 // the floors kept (a ring of records)
const MAXI = (BELOW + 3) * SLICES;
const SHARDS = 48, SPARKS = 192, LIGHTS = 8, PUNCH0 = 3, PUNCHES = 4;
// THE BLAZE's flame sprites: a FIXED pool — the tiers trim … night.js#7
export const FLAMES = 96, FLAME_RATE = Object.freeze([46, 84, 128]), EMBER_RATE = Object.freeze([10, 22, 36]);
/** a flame's longest life in seconds (F3 — the owner: the column ~2× longer, a little wider; F2's was 0.41): the ball falls away from its flames, so a
 *  flame's life IS the column's length — the pool still holds every flame alive at once (128 a second × ≤ 0.82 s × ¾ on average < 96) */
export const FLAME_LIFE = 0.82;
/** the wall of each area (tuning.js#AREAS, in order): null = the open sky (THE ROOFTOP) */
export const WALLS = Object.freeze([null, 'offices', 'speakeasy', 'harbor', 'deep', 'deep', 'deep']);
/** an area's numbers by look (tuning.js#AREAS' order — THE BOTTOM + THE TRENCH wear THE DEEP's): the wall's tint (3) · BY DAY: the haze the
 *  tower fades into below (3) · THE DARKNESS's colour — THE STORM CLOUD on the rooftop, the lights out indoors, THE MURK under the water (3)
 *  · 1 = under the water (the water's gradient, the sun rays, the caustics) · its MOTES (0 none · 1 rising bubbles · 2 drifting particles ·
 *  3 dust in a sunlit room) · how often its wall repeats round the shaft (4 — THE DEEP's night wall 2: a LARGER scale, its vents made a
 *  lattice at 4). Linear light. THE NIGHT WALLS v2 (the add-on, Nov 26: offices · harbor · deep, relit from the day walls) are shown near
 *  their own light (the old offices wall was held down to 0.5, the old harbor wall pushed × 2). */
const DEEP_N = [1.25, 1.25, 1.4, 0, 0, 0, 0, 0, 0, 0, 0, 2], DEEP_D = [0.9, 1.0, 1.5, 0.004, 0.012, 0.05, 0.006, 0.02, 0.022, 0, 2, 4];
// (F5B — THE WATER SWAP: UNDER THE HARBOR by night is UNDER … night.js#8
export const AREA_NIGHT = Object.freeze([[1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 4], [1.3, 1.3, 1.45, 0, 0, 0, 0, 0, 0, 0, 0, 4], [0.95, 0.86, 1, 0, 0, 0, 0, 0, 0, 0, 0, 4], [1.05, 1.1, 1.15, 0, 0, 0, 0, 0, 0, 1, 1, 4], DEEP_N, DEEP_N, DEEP_N]);
export const AREA_DAY = Object.freeze([
  [1, 1, 1, 0.56, 0.74, 0.93, 0.09, 0.105, 0.15, 0, 0, 4],           // THE ROOFTOP: the open air · THE STORM CLOUD
  [0.5, 0.62, 0.86, 0.2, 0.37, 0.72, 0.03, 0.04, 0.08, 0, 3, 4], // night#9
  [0.82, 0.68, 0.6, 0.5, 0.33, 0.22, 0.035, 0.02, 0.02, 0, 3, 4],      // THE SPEAKEASY: brick + brass, a warm dusty haze
  [1, 1.08, 1.1, 0.0018, 0.042, 0.107, 0.012, 0.045, 0.04, 1, 1, 4],   // UNDER THE HARBOR: the water (#063a5c below) · THE MURK · bubbles
  DEEP_D, DEEP_D, DEEP_D,                                             // THE DEEP: deep blue, the wreck's warm lamps · drifting particles
]);
// an area's haze strength by day (how far the tower's lower … night.js#10
export const FOG_K = Object.freeze([0.2, 1, 1, 1, 1, 1, 1]);
/** F5A's ADD-ON — THE DAY OFFICES FOG (the owner's iPhone: by day the offices' floors washed into pale blue from the 3rd floor under the
 *  ball, ~40 % down the screen — the speakeasy + the harbor fade from 60 – 70 %): how far down the haze STARTS, as a share of its 7 floors
 *  (0 = from the ball's own floor, as every other area: a dark haze only shows 4 – 5 floors down; THE OFFICES' pale floors on a pale blue
 *  ground showed it at once) — its floors keep their colour + contrast as far down the screen as the other areas' */
export const FOG_START = Object.freeze([0, 0.36, 0, 0, 0, 0, 0]);
/** THE ROOF BELOW (F3B — docs/freefall.md): the painting's skylight (its centre + its frame's half size, as fractions of the picture —
 *  scripts/build-freefall-assets.py ROOF_SKY measures them) · how much of the painting's width the screen's width shows: `s0` on the
 *  title screen + floor 0 → `s1` by floor `to` (it RISES toward you floor by floor, by the same share each floor — then it stops: the
 *  painting was made at 1024, it is never shown closer than about 2½ screen pixels a source texel on a phone at 3×) · `tilt`° = how
 *  steeply the roof's plane is seen (a flat roof from high above) · `curl` = how fast the city past its far edge runs off to the horizon */
export const ROOF = Object.freeze({ cx: 0.505, cy: 0.472, sky: 0.130, s0: 0.92, s1: 0.4, to: 34, tilt: 40, curl: 2.2, far: 30, land: 38.6 });
/** … ONE PLANE ALL THE WAY DOWN: from floor `to` to floor `land` the roof's plane settles into THE TRUE ROOF — the painting at the skylight's
 *  real size (this many world units wide), level, at the skylight's own height: the 3D skylight that rode on it is then exactly where the ball hits it */
export const ROOF_WIDE = (SKYLIGHT.half + SKYLIGHT.bar) / ROOF.sky, ROOF_Y = -BREAK_FLOORS.skylight * SHAPE.H + SKYLIGHT.up;
// THE MOTES by kind: [the shader's kind (1 a bubble · 2 a … night.js#11
export const MOTE_KINDS = Object.freeze([null, [1, 0.55, 0.05, 0.9, 0.85, 1, 1], [2, -0.07, 0.024, 0.7, 0.75, 0.9, 1], [2, 0.04, 0.015, 0.5, 1, 0.98, 0.9]]);
/** F5B — THE WATER SWAP: the night's bubbles glow CYAN on the dark teal (the day's are white-aqua) · F5C: brighter + MOTE_NIGHT_SIZE bigger —
 *  as clearly seen as DAY UNDER's */
export const MOTE_NIGHT = Object.freeze([0.55, 1.0, 1.0]);
export const MOTE_NIGHT_SIZE = 1.35;
/** the motes' FIXED pool — the tiers trim how many are drawn (tier 0 · 1 · 2) */
/** THE ROOFTOP's PANORAMA (the add-on, Nov 26 — FREEFALL's own, 3072 × 1024, a 360° picture): shown across `az` radians of the compass (it
 *  repeats round it — a texel is never stretched past ~1.3 screen pixels on a 390 / 430-wide phone at 3×), `el` radians tall, its top at
 *  `top` (so its horizon — 63 % down it — sits in the upper quarter of the opening); it rises up to `rise` as the ball goes down; the
 *  night's GLOW FROM BELOW (`glow`: 0.4 — it was 0.85 and washed every area purple) */
export const PANO = Object.freeze({ az: 1.2, el: 0.4, top: 0.012, rise: 0.06, riseK: 0.004, glow: 0.4 });
export const MOTES = 48, MOTE_N = Object.freeze([18, 32, 48]), MOTE_SPAN = 12;
const GOLD = 0xffc83c, GOLD_DAY = 0xe89400, LAP = 40, TRENCH_FROM = 201;

const wedgeGeo = () => {
  // a slice = a wedge of the ring: its top, its outer wall, its … night.js#12
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
  // (the palettes in linear light, flat: an area's 15 numbers — … night.js#13
  const PL = new Float32Array((PALETTES.length + TRENCH_PALETTES.length) * 15);
  [...PALETTES, ...TRENCH_PALETTES].forEach((p, i) => { PL.set([...lin(p.a), ...lin(p.b), ...lin(p.rim), ...lin(p.day), ...lin(p.dayRim)], i * 15); });

  // ---- the uniforms every material shares (ONE object each: a twin material in the bloom pass reads the same values)
  const G = { uBloom: { value: 0 }, uTime: { value: 0 }, uTopY: { value: 0 }, uSpin: { value: 0 }, uAspect: { value: 1 }, uGrey: { value: 0 },
    // (F3 — THE LOOK) 1 = day · by day a light COVERS what is … night.js#14
    uDay: { value: 0 }, uCover: { value: 0 }, uFog: { value: new THREE.Vector3(0.62, 0.84, 0.98) }, uCaust: { value: 0 },
    // (F4A — THE HAZE FOLLOWS THE FLOOR: the area BELOW the … night.js#15
    uFogB: { value: new THREE.Vector3(0.62, 0.84, 0.98) }, uFogKB: { value: FOG_K[0] }, uCaustB: { value: 0 }, uFogSeam: { value: -1e5 },
    // (F3B) how strongly the tower fades into that haze (the area's — THE ROOFTOP: almost none)
    uFogK: { value: FOG_K[0] }, uFogS: { value: 0 }, uFogSB: { value: 0 },
    // (F3B) the pillar is not drawn under this height: THE ROOF is shut until the skylight breaks
    uCutY: { value: -1e9 } };
  const TWINS = [];
  // (a twin is BUILT from the material's own pieces + the SAME … night.js#16
  const twin = (mesh, mat) => {
    const t = new THREE.ShaderMaterial({ vertexShader: mat.vertexShader, fragmentShader: mat.fragmentShader, uniforms: mat.uniforms, extensions: mat.extensions, transparent: mat.transparent, depthTest: mat.depthTest, depthWrite: mat.depthWrite, side: mat.side, blending: mat.blending, blendEquation: mat.blendEquation, blendSrc: mat.blendSrc, blendDst: mat.blendDst });
    TWINS.push([mesh, t, null]);
    return mesh;
  };
  const derivs = { derivatives: true };
  const premul = { transparent: true, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor };

  // ---- THE SHAFT: the wall, drawn into a half-res target by its own little scene, then copied up behind everything
  const wallU = {
    tA: { value: null }, tB: { value: null }, uCam: { value: new THREE.Vector3() }, uRight: { value: new THREE.Vector3() }, uUp: { value: new THREE.Vector3() }, uFwd: { value: new THREE.Vector3() },
    uTintA: { value: new THREE.Vector3(1, 1, 1) }, uTintB: { value: new THREE.Vector3(1, 1, 1) }, uTan: { value: Math.tan(CAM.fov * RAD / 2) }, uAspect: G.uAspect,
    uHaveA: { value: 0 }, uHaveB: { value: 0 }, uFlipA: { value: 0 }, uFlipB: { value: 0 }, uSkyA: { value: 1 }, uSkyB: { value: 0 },
    uSeamY: { value: -1e4 }, uBallY: { value: 0 }, uDarkY: { value: 1e4 }, uTime: G.uTime, uRW: { value: SHAPE.RW }, uTileA: { value: 4 }, uTileB: { value: 4 }, uGlow: { value: PANO.glow },
    uDay: G.uDay, uAreaA: { value: 0 }, uAreaB: { value: 0 }, uWetA: { value: 0 }, uWetB: { value: 0 }, uSurfY: { value: -AREAS[3].from * SHAPE.H },
    uFogA: { value: new THREE.Vector3() }, uFogB: { value: new THREE.Vector3() }, uDarkA: { value: new THREE.Vector3() }, uDarkB: { value: new THREE.Vector3() },
    // (F3B — THE BREAKTHROUGHS) the room's lights come on under a … night.js#17
    uLitT: { value: -1000 }, uLitY: { value: -AREAS[1].from * SHAPE.H }, uShafts: { value: 1 },
  };
  const wallScene = new THREE.Scene(), wallCam = new THREE.Camera();
  const wallQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ vertexShader: WALL_V, fragmentShader: WALL_F, uniforms: wallU, depthTest: false, depthWrite: false }));
  wallQuad.frustumCulled = false; wallScene.add(wallQuad);
  let wallRT = new THREE.WebGLRenderTarget(4, 4, { depthBuffer: false, stencilBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
  const copyU = { tMap: { value: wallRT.texture }, uBloom: G.uBloom };
  const copyMat = new THREE.ShaderMaterial({ vertexShader: COPY_V, fragmentShader: COPY_F, uniforms: copyU, depthTest: false, depthWrite: false });
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), copyMat);
  backdrop.frustumCulled = false; backdrop.renderOrder = -100; scene.add(backdrop); twin(backdrop, copyMat);
  // THE ROOFTOP's SKY (the add-on, Nov 26): FREEFALL's own … night.js#18
  const skyU = { tPano: { value: null }, uHave: { value: 0 }, uFlip: { value: 0 }, uCam: wallU.uCam, uRight: wallU.uRight, uUp: wallU.uUp, uFwd: wallU.uFwd, uDarkA: wallU.uDarkA,
    uTan: wallU.uTan, uAspect: G.uAspect, uSeamY: wallU.uSeamY, uBallY: wallU.uBallY, uDarkY: wallU.uDarkY, uTime: G.uTime, uRW: wallU.uRW, uRise: { value: 0 }, uShift: { value: Number(o.skyShift) || 0 },
    uDay: G.uDay, uBloom: G.uBloom, uSpanAz: { value: PANO.az }, uSpanEl: { value: PANO.el }, uTopEl: { value: PANO.top }, uGlow: wallU.uGlow,
    // THE ROOF BELOW (F3B): the painting + the city's tile, its … night.js#19
    tRoof: { value: null }, tCity: { value: null }, uHaveR: { value: 0 }, uFlipR: { value: 0 }, uHaveC: { value: 0 }, uFlipC: { value: 0 },
    uGN: { value: new THREE.Vector3(0, 1, 0) }, uGV: { value: new THREE.Vector3(0, 0, -1) }, uGC: { value: new THREE.Vector3(0, -80, -60) }, uGK: { value: -80 }, uGW: { value: 0.01 },
    uGA: { value: 1 }, uGCurl: { value: ROOF.curl }, uOpen: { value: 0 }, uRoof: { value: new THREE.Vector2(ROOF.cx, ROOF.cy) },
    tGrain: { value: null }, uHaveG: { value: 0 }, uGrain: { value: 0 } }; // night#20
  const skyMat = new THREE.ShaderMaterial({ vertexShader: SKY_V, fragmentShader: SKY_F, uniforms: skyU, depthTest: false, depthWrite: false,
    // (NOT `transparent`: three.js draws every transparent mesh … night.js#21
    transparent: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor });
  const skyQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), skyMat);
  skyQuad.frustumCulled = false; skyQuad.renderOrder = -99; scene.add(skyQuad); twin(skyQuad, skyMat);

  // the pictures: decoded off the frame (createImageBitmap) and … night.js#22
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
      // (`repeat`: true = it tiles both ways · 2 = THE PANORAMA, … night.js#23
      tex.wrapS = tex.wrapT = repeat === true ? THREE.RepeatWrapping : repeat === 3 ? THREE.MirroredRepeatWrapping : THREE.ClampToEdgeWrapping;
      if (repeat !== true && repeat !== 3 && repeat !== 4) tex.wrapS = THREE.RepeatWrapping;
      tex.generateMipmaps = !!repeat; tex.minFilter = repeat ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;
      // (`repeat` 2 = THE PANORAMA: it repeats on u only, its … night.js#24
      if (repeat === 2) { try { tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); } catch { /* none */ } }
      tex.flipY = false; tex.needsUpdate = true;
      try { renderer.initTexture(tex); } catch { /* it uploads at its first draw */ }
      // (F3B: every picture of the look is in memory at once now — … night.js#25
      try { if (flip === 1 && image.close && renderer.properties.get(tex).__webglTexture) image.close(); } catch { /* kept, then */ }
      t.tex = tex; t.flip = flip; t.have = 1; workAt = performance.now(); wK = -1; landed++;
    }).catch(() => { texs.delete(name); });
    return t;
  }
  // (a wall's name + its address by look, made ONCE — a frame … night.js#26
  const WALL_KEY = ['night', 'day'].map(lk => WALLS.map(name => (name ? (lk === 'day' ? `${name}-day` : name) : null)));
  const WALL_URL = ['night', 'day'].map(lk => WALLS.map(name => (name ? new URL(`../../../assets/freefall/walls/${name}-${lk}.webp?v=${FF_ART_REV}`, import.meta.url).href : null)));
  const wantWall = k => { const L = day ? 1 : 0; return WALL_KEY[L][k] ? picture(WALL_KEY[L][k], WALL_URL[L][k], true) : null; };
  // THE ROOFTOP: FREEFALL's own panoramas — the night's, the … night.js#27
  const PANO_URL = ['night', 'day'].map(lk => new URL(`../../../assets/freefall/sky/rooftop-${lk}.webp?v=${FF_ART_REV}`, import.meta.url).href);
  const skyNow = () => (day ? picture('pano-day', PANO_URL[1], 2) : picture('pano', PANO_URL[0], 2));
  // THE ROOF BELOW (F3B): the building's own roof from above + the city round it, by look
  const ROOF_URL = ['night', 'day'].map(lk => [new URL(`../../../assets/freefall/roof/below-${lk}.webp?v=${FF_ART_REV}`, import.meta.url).href, new URL(`../../../assets/freefall/roof/city-${lk}.webp?v=${FF_ART_REV}`, import.meta.url).href]);
  const roofNow = () => (day ? picture('roof-day', ROOF_URL[1][0], 4) : picture('roof', ROOF_URL[0][0], 4));
  const cityNow = () => (day ? picture('city-day', ROOF_URL[1][1], 3) : picture('city', ROOF_URL[0][1], 3));
  // THE BREAKTHROUGHS' textures (F3B): the sprites, the … night.js#28
  const fxUrl = name => new URL(`../../../assets/freefall/fx/${name}.webp?v=${FF_ART_REV}`, import.meta.url).href;
  const PICS = { roof: roofNow, pano: () => skyNow(), burst: picture('burst', fxUrl('burst'), false), grain: picture('grain', new URL(`../../../assets/freefall/roof/grain.webp?v=${FF_ART_REV}`, import.meta.url).href, true), sand: picture('sand', fxUrl('sand'), true), sandN: picture('sand-normal', fxUrl('sand-normal'), true), rip: picture('water-normal', fxUrl('water-normal'), true) };
  // THE STUTTERS (F3B — the owner's iPhone: HITCH 9 a run): a … night.js#29
  let landed = 0;
  function preload() { for (let k = 1; k <= 4; k++) wantWall(k); skyNow(); roofNow(); cityNow(); }
  // (THE BLAZE's sprites — Kenney's Particle Pack: two flames, the hot speckle, the smoke, side by side)
  const fxTex = picture('blaze', new URL(`../../../assets/freefall/fx/blaze.webp?v=${FF_ART_REV}`, import.meta.url).href, false);

  // ---- THE TOWER: the pillar + the slices (ONE instanced mesh)
  const pillarMat = new THREE.ShaderMaterial({ vertexShader: PILLAR_V, fragmentShader: PILLAR_F, uniforms: { uBloom: G.uBloom, uTopY: G.uTopY, uDay: G.uDay, uFog: G.uFog, uFogK: G.uFogK, uFogS: G.uFogS, uFogSB: G.uFogSB, uFogB: G.uFogB, uFogKB: G.uFogKB, uFogSeam: G.uFogSeam, uCutY: G.uCutY, uCol: { value: new THREE.Color(0x2a1466) } } });
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(SHAPE.RI - 0.004, SHAPE.RI - 0.004, 44, 28, 1, false), pillarMat);   // (capped: the tower's top is its end — nothing stands over the ball's floor)
  pillar.frustumCulled = false; scene.add(pillar); twin(pillar, pillarMat);
  const sGeo = wedgeGeo(), aI = inst(sGeo, 'aI', MAXI, 4), aC = inst(sGeo, 'aC', MAXI, 4), aF = inst(sGeo, 'aF', MAXI, 4), aR = inst(sGeo, 'aR', MAXI, 3);
  const sliceMat = new THREE.ShaderMaterial({ vertexShader: SLICE_V, fragmentShader: SLICE_F, uniforms: { uBloom: G.uBloom, uTopY: G.uTopY, uTime: G.uTime, uSpin: G.uSpin, uGrey: G.uGrey, uDay: G.uDay, uCaust: G.uCaust, uFog: G.uFog, uFogK: G.uFogK, uFogS: G.uFogS, uFogSB: G.uFogSB, uFogB: G.uFogB, uFogKB: G.uFogKB, uCaustB: G.uCaustB, uFogSeam: G.uFogSeam, uRing: { value: SHAPE.RO - SHAPE.RI }, uWidth: { value: SHAPE.RO * (WEDGE - 2 * MARGIN) / 2 } }, extensions: derivs, ...premul });
  const slices = new THREE.Mesh(sGeo, sliceMat);
  slices.frustumCulled = false; sGeo.instanceCount = 0; scene.add(slices); twin(slices, sliceMat);

  // ---- YOUR BEST's gold tape (round the rim of that floor — only while it is in sight)
  const tapeU = { uCol: { value: new THREE.Color(GOLD) }, uGlow: { value: 1 }, uBloom: G.uBloom, uHalf: { value: 0.05 }, uDark: { value: 0 } };
  const tapeMat = new THREE.ShaderMaterial({ vertexShader: TAPE_V, fragmentShader: TAPE_F, uniforms: tapeU, extensions: derivs, side: THREE.DoubleSide, depthWrite: false, ...premul });
  const tape = new THREE.Mesh(new THREE.CylinderGeometry(SHAPE.RO + 0.02, SHAPE.RO + 0.02, 0.1, 72, 1, true), tapeMat);
  tape.frustumCulled = false; tape.visible = false; scene.add(tape); twin(tape, tapeMat);

  // ---- THE BALL (at the FRONT — the rules' fixed angle 0 = +Z here; it never turns with the tower)
  const ballU = { uBloom: G.uBloom, uDay: G.uDay, uBlaze: { value: 0 }, uTime: G.uTime, uOut: { value: 0 }, uSquash: { value: new THREE.Vector3(1, 1, 1) }, uEdge: { value: new THREE.Color(0xff8a5c) } };
  const ballMat = new THREE.ShaderMaterial({ vertexShader: BALL_V, fragmentShader: BALL_F, uniforms: ballU });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(SHAPE.R_BALL, 28, 18), ballMat);
  ball.frustumCulled = false; scene.add(ball); twin(ball, ballMat);

  // ---- THE SHARDS + THE SPARKS + THE LIGHTS (pools — a … night.js#30
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
  const sparkMat = new THREE.ShaderMaterial({ vertexShader: SPARK_V, fragmentShader: SPARK_F, uniforms: { uTime: G.uTime, uAspect: G.uAspect, uCover: G.uCover, uGrav: { value: -4.2 } }, ...addOpt });
  const sparks = new THREE.Mesh(pGeo, sparkMat);
  sparks.frustumCulled = false; scene.add(sparks); twin(sparks, sparkMat);
  const lGeo = quadGeo(), lP = inst(lGeo, 'aP', LIGHTS, 4), lQ = inst(lGeo, 'aQ', LIGHTS, 4), lC = inst(lGeo, 'aC', LIGHTS, 3);
  lGeo.instanceCount = LIGHTS;
  const lightMat = new THREE.ShaderMaterial({ vertexShader: LIGHT_V, fragmentShader: LIGHT_F, uniforms: { uTime: G.uTime, uBloom: G.uBloom, uAspect: G.uAspect, uCover: G.uCover, uHalo: { value: 1 }, uOnBed: { value: 0 } }, side: THREE.DoubleSide, ...addOpt });
  // THE BLAZE = NEON FIRE: the flame sprites (a fixed pool, flown in their shader) + the ribbon behind the ball
  const fGeo = quadGeo(), fO = inst(fGeo, 'aO', FLAMES, 3), fV = inst(fGeo, 'aV', FLAMES, 3), fT = inst(fGeo, 'aT', FLAMES, 4);
  for (let i = 0; i < FLAMES; i++) { fT.array[i * 4] = -100; fT.array[i * 4 + 1] = 1; }
  fGeo.instanceCount = FLAMES;
  const flameU = { uTime: G.uTime, uBloom: G.uBloom, uCover: G.uCover, tFx: { value: null }, uHave: { value: 0 }, uFlip: { value: 0 } };
  const flameMat = new THREE.ShaderMaterial({ vertexShader: FLAME_V, fragmentShader: FLAME_F, uniforms: flameU, ...addOpt });
  const flames = new THREE.Mesh(fGeo, flameMat);
  flames.frustumCulled = false; scene.add(flames); twin(flames, flameMat);
  const ribbonU = { uAt: { value: new THREE.Vector3() }, uLen: { value: 1 }, uWid: { value: SHAPE.R_BALL * 1.8 }, uTime: G.uTime, uOn: { value: 0 }, uBloom: G.uBloom, uCover: G.uCover };
  const ribbonMat = new THREE.ShaderMaterial({ vertexShader: RIBBON_V, fragmentShader: RIBBON_F, uniforms: ribbonU, side: THREE.DoubleSide, ...addOpt });
  const ribbon = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 2, 16), ribbonMat);
  ribbon.frustumCulled = false; scene.add(ribbon); twin(ribbon, ribbonMat);
  const lights = new THREE.Mesh(lGeo, lightMat);
  lights.frustumCulled = false; scene.add(lights); twin(lights, lightMat);
  // THE MOTES (F3 — by day: UNDER THE HARBOR's rising bubbles, … night.js#31
  const mGeo = quadGeo(), mS = inst(mGeo, 'aS', MOTES, 4);
  for (let i = 0; i < MOTES * 4; i++) mS.array[i] = Math.random();
  mGeo.instanceCount = MOTES;
  const moteU = { uTime: G.uTime, uBloom: G.uBloom, uBaseY: { value: 0 }, uSpan: { value: MOTE_SPAN }, uSpeed: { value: 0 }, uSize: { value: 0.03 }, uKind: { value: 1 }, uAlpha: { value: 0 }, uCol: { value: new THREE.Vector3(1, 1, 1) } };
  const moteMat = new THREE.ShaderMaterial({ vertexShader: MOTE_V, fragmentShader: MOTE_F, uniforms: moteU, ...addOpt });
  const motes = new THREE.Mesh(mGeo, moteMat);
  motes.frustumCulled = false; motes.visible = false; scene.add(motes); twin(motes, moteMat);
  // THE ROOF's PLANE in the world (set every frame — … night.js#32
  const roofM = new THREE.Matrix4();
  // THE BREAKTHROUGHS (F3B — breaks.js): the skylight (its … night.js#33
  const BX = {
    scene, twin, G, SHAPE, ROOF, FALL, PAL: PALETTES, pics: PICS, wallU, lin, reduce, roofM,
    spark: (x, y, z, vx, vy, vz, life, wid, r, g, b) => spark(x, y, z, vx, vy, vz, life, wid, r, g, b),
    sparksDirty() { pO.needsUpdate = pV.needsUpdate = pT.needsUpdate = pC.needsUpdate = true; },
    kick(k, sh) { if (!reduce) { S[KICK] = k; S[SHAKE] = sh; } },
    flashFloors(from, to, v) { for (let f = from; f <= to; f++) { if (f < 0) continue; floorRec(f); const o = (f % RING) * SLICES; for (let s = 0; s < SLICES; s++) flash[o + s] = v; } },
  };
  const breaks = createBreaks(BX);
  // (the draw order, fixed once: the shaft · the pillar · the … night.js#34
  backdrop.renderOrder = -100; pillar.renderOrder = 0; slices.renderOrder = 1; tape.renderOrder = 2; shards.renderOrder = 3; motes.renderOrder = 3.2; ribbon.renderOrder = 3.4; flames.renderOrder = 3.6; ball.renderOrder = 4; lights.renderOrder = 5; sparks.renderOrder = 6;
  scene.children.sort((a, b) => a.renderOrder - b.renderOrder);

  // ---- the floors in sight: a ring of records written INTO … night.js#35
  let run0 = null, h = 0, RR = R;
  const FL = [], FLi = new Int32Array(RING).fill(-1), broken = new Uint16Array(RING), cracked = new Uint16Array(RING), flash = new Float32Array(RING * SLICES), fcol = new Float32Array(RING * 3), frim = new Float32Array(RING * 3), fday = new Float32Array(RING * 3), fdrim = new Float32Array(RING * 3);
  for (let i = 0; i < RING; i++) FL.push({ i: -1, twist: 0, gap: 0, red: 0, m1: 0, m2: 0 });
  /** a floor's palette (its place in PL): its area's — THE TRENCH's by its lap */
  const palOf = i => { const k = areaIndex(i); return (k >= 6 ? PALETTES.length + Math.floor((i - TRENCH_FROM) / LAP) % TRENCH_PALETTES.length : k) * 15; };
  function colourOf(i, slot) {
    // THE AREA PALETTE, DEPTH-RELATIVE: this floor's own colour — … night.js#36
    const k = areaIndex(i), p = palOf(i), from = k >= 6 ? TRENCH_FROM + Math.floor((i - TRENCH_FROM) / LAP) * LAP : AREAS[k].from, len = k === 5 ? 1 : LAP;
    const t = len > 1 ? (i - from) / (len - 1) : 0, d = from + len - i, q = d <= 3 ? palOf(i + d) : p, tt = q !== p ? (4 - d) / 4 : 0;
    const s3 = slot * 3, lean = i & 1 ? 0.9 : 1;   // (a floor a shade off its neighbours: every second one a little deeper)
    for (let c = 0; c < 3; c++) {
      const top = PL[p + c] + (PL[p + 3 + c] - PL[p + c]) * t;
      fcol[s3 + c] = (top + (PL[q + c] - top) * tt) * lean;
      frim[s3 + c] = PL[p + 6 + c] + (PL[q + 6 + c] - PL[p + 6 + c]) * tt;
      fday[s3 + c] = (PL[p + 9 + c] + (PL[q + 9 + c] - PL[p + 9 + c]) * tt) * (i & 1 ? 0.94 : 1);
      fdrim[s3 + c] = PL[p + 12 + c] + (PL[q + 12 + c] - PL[p + 12 + c]) * tt;
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
  const CAMY = 0, KICK = 1, SQUASH = 2, BLAZE = 3, TIME = 4, GH0 = 5, GH1 = 6, GT0 = 7, GT1 = 8, PITCH = 9, BACK = 10, BALLY = 11, PF = 12, PT = 13, OUTK = 14, BEST = 15, LANDT = 16, SHAKE = 17, LASTFLOOR = 18, ENDAGE = 19, ROOFA = 20;
  S[GH0] = S[GH1] = -1; S[PITCH] = POSE.play.pitch; S[BACK] = 1; S[BALLY] = POSE.play.ballY; S[BEST] = 0; S[LANDT] = -10; S[ROOFA] = 1;
  let poseFrom = POSE.play, poseTo = POSE.play, poseT0 = -1e9, state = 'live', tier = o.tier == null ? 2 : o.tier, bloom = null, day = o.look === 'day';
  // FIX B — THE TEST PAGE's A/B SWITCHES (`o.ab` — play.js; the … night.js#37
  const AB = o.ab || {}, AB_BLOOM = AB.bloom !== false, AB_FX = AB.fx !== false, AB_WALL = AB.wall !== false, AB_GHOSTS = AB.ghosts !== false;
  const plainC = new THREE.Color(), keepC = new THREE.Color(), drawnV = new Float64Array(3);
  let subAt = 0;
  let shardN = 0, sparkN = 0, punchN = 0, flameN = 0, flameOwed = 0, emberOwed = 0, fxHave = 0, wK = -1, wA = 0, wB = 0, wS = 0, wR = 0, wC = 0, areaA = 0, moteKind = 0, moteA = 0, fogSnap = true;
  // a FINISH's floor (match + daily: THE BOTTOM — no floor is … night.js#38
  let fin = -1, tauNow = 0;
  // (F5A — THE SHARE CARD's STAGED frame, shot() below: the … night.js#39
  let staged = false, shotZoom = 1, shotBloom = 1, shotGlow = 0;
  const SV = new Float64Array(24);
  const punchAt = new Float64Array(PUNCHES).fill(-10);
  const rnd = (() => { let x = 0x2545f491; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; })();

  function reset(run) {
    run0 = run; h = run.h; RR = run.R;
    FLi.fill(-1); broken.fill(0); cracked.fill(0); flash.fill(0);
    S[CAMY] = 0; S[KICK] = 0; S[SQUASH] = 0; S[BLAZE] = 0; S[GH0] = S[GH1] = -1; S[OUTK] = 0; S[LANDT] = -10; S[SHAKE] = 0; S[LASTFLOOR] = 0; S[ENDAGE] = 0; S[ROOFA] = 1;
    state = 'live'; areaA = 0; wK = -1;
    breaks.reset(run); fin = breaks.out[4] > 0.5 ? RR.modes[run.mode].finish : -1;
    for (let i = 0; i < SHARDS; i++) cT.array[i * 4] = -100;
    for (let i = 0; i < SPARKS; i++) pT.array[i * 3] = -100;
    for (let i = 0; i < FLAMES; i++) fT.array[i * 4] = -100;
    cT.needsUpdate = true; pT.needsUpdate = true; fT.needsUpdate = true; punchAt.fill(-10); flameOwed = 0; emberOwed = 0;
    preload();
    fogSnap = true; moteA = 0; moteKind = 0;
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
    // (by day a shard is the floor's own pastel glass, a little frosted)
    const cr = red ? 1 : day ? 0.25 + 0.75 * fday[slot * 3] : fcol[slot * 3], cg = red ? 0.03 : day ? 0.25 + 0.75 * fday[slot * 3 + 1] : fcol[slot * 3 + 1], cb = red ? 0.09 : day ? 0.25 + 0.75 * fday[slot * 3 + 2] : fcol[slot * 3 + 2];
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
      breaks.feed(e, tauNow);
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

  // a scene built again mid-run (a lost context): what the … night.js#40
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
    // the camera looks at a point below the ball's floor so that … night.js#41
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
    // the screen pixels ONE RADIAN of tower turn moves the ring … night.js#42
    place(pcam, POSE.play.pitch, 1, POSE.play.ballY, 0, 0);
    V.set(0, 0, SHAPE.RB).project(pcam); const x0 = V.x;
    V.set(0.05, 0, SHAPE.RB).project(pcam);
    ppr = Math.abs(V.x - x0) * w / 2 / 0.05 * SHAPE.RB;
  }
  function setTier(t) {
    tier = t;
    if (t === 2 && !bloom && AB_BLOOM) { try { bloom = createBloom(renderer, G.uBloom); } catch { bloom = null; } }
    mGeo.instanceCount = MOTE_N[t];
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

  // the ball's height over its floor's top (world units) at … night.js#43
  function ballLift(run, tau) {
    const span = run.nl - run.pl, u = span > 0 ? Math.min(1, Math.max(0, (tau - run.pl) / span)) : 1;
    if (run.st === 'made') return SHAPE.H * (1 - u) * (1 - 0.45 * u); // night#44
    if (run.st !== 'live') return run.cause === 'red' ? 0 : SHAPE.HOP * 0.5;
    if (run.fl === 'bounce') return SHAPE.HOP * 4 * u * (1 - u);
    if (run.fl === 'drop') return SHAPE.HOP * 0.55 * 4 * u * (1 - u);   // (the start: one small hop on floor 0 — the ball was resting there)
    // a fall: from the floor above — one H up — down to this one, speeding up
    return SHAPE.H * (1 - u) * (1 - 0.45 * u);
  }

  // the walls the shaft shows now: the camera's area (A) + the … night.js#45
  function walls(floor) {
    const k = areaIndex(Math.max(0, floor - 5));   // (the seam stays in sight a few floors after the ball crossed it)
    const nk = Math.min(AREAS.length - 1, k + 1), seam = k === nk ? -1e5 : -AREAS[nk].from * SHAPE.H;
    const A = wantWall(k), B = floor > AREAS[nk].from - 34 ? wantWall(nk) : null, sk = skyNow(), rf = roofNow(), ct = cityNow();
    const ha = A ? A.have : 0, hb = B ? B.have : 0;
    if (k === wK && ha === wA && hb === wB && sk.have === wS && rf.have === wR && ct.have === wC) return;   // (asked every frame: a few numbers compared — no key built; a look change resets wK)
    wK = k; wA = ha; wB = hb; wS = sk.have; wR = rf.have; wC = ct.have; areaA = k;
    skyU.tRoof.value = rf.tex; skyU.uHaveR.value = rf.have; skyU.uFlipR.value = rf.flip; skyU.tCity.value = ct.tex; skyU.uHaveC.value = ct.have; skyU.uFlipC.value = ct.flip;
    wallU.uSkyA.value = WALLS[k] ? 0 : 1; wallU.uSkyB.value = WALLS[nk] ? 0 : 1;
    wallU.tA.value = A && A.tex; wallU.uHaveA.value = A ? A.have : 0; wallU.uFlipA.value = A ? A.flip : 0;
    wallU.tB.value = B && B.tex; wallU.uHaveB.value = B ? B.have : 0; wallU.uFlipB.value = B ? B.flip : 0;
    skyU.tPano.value = sk.tex; skyU.uHave.value = sk.have; skyU.uFlip.value = sk.flip;
    wallU.uTileA.value = (day ? AREA_DAY : AREA_NIGHT)[k][11]; wallU.uTileB.value = (day ? AREA_DAY : AREA_NIGHT)[nk][11];
    const T = day ? AREA_DAY : AREA_NIGHT, ta = T[k], tb = T[nk];
    wallU.uTintA.value.set(ta[0], ta[1], ta[2]); wallU.uTintB.value.set(tb[0], tb[1], tb[2]);
    wallU.uFogA.value.set(ta[3], ta[4], ta[5]); wallU.uFogB.value.set(tb[3], tb[4], tb[5]);
    wallU.uDarkA.value.set(ta[6], ta[7], ta[8]); wallU.uDarkB.value.set(tb[6], tb[7], tb[8]);
    wallU.uWetA.value = ta[9]; wallU.uWetB.value = tb[9]; wallU.uAreaA.value = k; wallU.uAreaB.value = nk;
    wallU.uSeamY.value = seam;
  }

  /** one floor's solid slices into the instance arrays from record `n` → the next free record */
  function putFloor(i, n, alpha, out, tick) {
    const rec = floorRec(i), slot = i % RING, gone_ = broken[slot], crk = cracked[slot];
    const mv = rec.m1 ? moversAt(rec, tick, RR) : 0;
    let warn = 0, wk = 0;
    if (rec.m1) { warn = moversAt(rec, tick + PACE, RR) & ~mv; const into = tick % PACE; wk = 0.35 + 0.65 * Math.min(1, Math.max(0, (into - (PACE - 18)) / 18)); }
    const y = -i * SHAPE.H, s3 = slot * 3, tc = day ? fday : fcol, rc = day ? fdrim : frim, r = tc[s3], g = tc[s3 + 1], b = tc[s3 + 2], I = aI.array, C = aC.array, F = aF.array, RM = aR.array;
    for (let s = 0; s < SLICES; s++) {
      if (((rec.gap | gone_) >> s) & 1) continue;
      if (n >= MAXI) return n;
      const kind = (rec.red >> s) & 1 ? 1 : (mv >> s) & 1 ? 2 : 0, q = n * 4, shade = s & 1 ? 1 : 0.93;
      I[q] = (sliceStart(s) + rec.twist) * UNIT; I[q + 1] = y; I[q + 2] = kind ? SHAPE.RISE : 0; I[q + 3] = kind;
      C[q] = r * shade; C[q + 1] = g * shade; C[q + 2] = b * shade; C[q + 3] = alpha;
      F[q] = flash[slot * SLICES + s]; F[q + 1] = (warn >> s) & 1 ? wk : 0; F[q + 2] = (crk >> s) & 1; F[q + 3] = out;
      RM[n * 3] = rc[s3]; RM[n * 3 + 1] = rc[s3 + 1]; RM[n * 3 + 2] = rc[s3 + 2];
      n++;
    }
    return n;
  }

  /**
   * THE ROOF BELOW's PLANE (F3B — once a frame, before anything is drawn on it): ONE plane all the way down.
   *  · FAR (the title screen … floor ROOF.to): its centre on the camera's ray through the tower's top ring — the skylight straight under the
   *    tower on the screen —, leaning toward the viewer (a flat roof seen from high above); its scale = how much of the painting the screen's
   *    width shows: it RISES floor by floor (the same share a floor), then it has risen as far as the painting stays sharp.
   *  · LANDING (ROOF.to … ROOF.land): it settles into THE TRUE ROOF — level, at the skylight's own height + real size — so the 3D skylight
   *    that rode on it all the way (sharp at every distance) is exactly where the ball hits it. From there on it is the world's own roof.
   * → roofM (the pieces' matrix) + the sky layer's plane uniforms.
   */
  function roofPlane() {
    const camy = S[CAMY], px = cam.position.y, pz = cam.position.z;
    const oy = -camy * SHAPE.H - px, oz = -pz, ol = Math.sqrt(oy * oy + oz * oz), ry = oy / ol, rz = oz / ol;
    let t = (camy - ROOF.to) / (ROOF.land - ROOF.to);
    t = t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
    // its centre: on the ray (far) → the skylight's own place in the world
    const cy = px + ry * ROOF.far, cz = pz + rz * ROOF.far, Cy = cy + (ROOF_Y - cy) * t, Cz = cz + (0 - cz) * t;
    const dy = Cy - px, dz = Cz - pz, dist = Math.sqrt(dy * dy + dz * dz);
    const lean = (ROOF.tilt * RAD - Math.atan2(-ry, -rz)) * (1 - t), ca = Math.cos(lean), sa = Math.sin(lean);
    // its scale: painting widths the screen's width shows (far) → the true roof's size at its true distance
    const rise = camy < ROOF.to ? camy / ROOF.to : 1, shows = ROOF.s0 * Math.exp(Math.log(ROOF.s1 / ROOF.s0) * rise);
    const farK = 2 * Math.tan(CAM.fov * RAD / 2) * (cam.aspect < CAM.aspectMax ? cam.aspect : CAM.aspectMax) / shows, trueK = ROOF_WIDE / dist;
    const wide = dist * farK * Math.exp(Math.log(trueK / farK) * t), k = wide / ROOF_WIDE;
    const e = roofM.elements;
    e[0] = k; e[1] = 0; e[2] = 0; e[3] = 0; e[4] = 0; e[5] = k * ca; e[6] = k * sa; e[7] = 0; e[8] = 0; e[9] = -k * sa; e[10] = k * ca; e[11] = 0; e[12] = 0; e[13] = Cy; e[14] = Cz; e[15] = 1;
    skyU.uGN.value.set(0, ca, sa); skyU.uGV.value.set(0, sa, -ca); skyU.uGC.value.set(0, dy, dz); skyU.uGK.value = dy * ca + dz * sa; skyU.uGW.value = 1 / wide;
    // (F5A — THE ROOF GRAIN comes in as the roof comes close: the deck's own measure — the plane's scale, 0.3 → 0.8)
    { const gk = (k - 0.3) / 0.5, gp = PICS.grain; skyU.uGrain.value = gk <= 0 ? 0 : gk >= 1 ? 1 : gk; skyU.tGrain.value = gp.tex; skyU.uHaveG.value = gp.have; }
    G.uCutY.value = breaks.out[0] > 0.5 ? -1e9 : Cy;   // (the roof is shut: the pillar ends where it goes into it)
  }

  // F4B — THE GHOSTS (ghost-fx.js): the match's rivals on MY … night.js#46
  const veil = createVeil(renderer, reduce);   // (FIX C — THE VEIL: the darkness + the shade, the frame's last pass)
  const ghostLayer = createGhostLayer({ renderer, cam, uDay: G.uDay, RB: SHAPE.RB, R_BALL: SHAPE.R_BALL });
  let ghostN = 0, ghostData = null;
  // a rival passed a BREAKTHROUGH (the skylight · the … night.js#47
  function ghostEcho(i) {
    if (!ghostData || i < 0 || i >= ghostN || reduce) return;
    const o = i * GHOST_STRIDE, phi = ghostData[o], x = SHAPE.RB * Math.sin(phi), y = ghostData[o + 1] + SHAPE.R_BALL, z = SHAPE.RB * Math.cos(phi);
    for (let k = 0; k < 8; k++) { const a = rnd() * 6.2832, v = 0.6 + rnd() * 0.9; spark(x, y, z, Math.cos(a) * v, 0.5 + rnd() * 1.2, Math.sin(a) * v, 0.3 + rnd() * 0.25, 0.012, ghostData[o + 2], ghostData[o + 3], ghostData[o + 4]); }
    pO.needsUpdate = pV.needsUpdate = pT.needsUpdate = pC.needsUpdate = true;
  }

  let frames = 0;
  // one frame: the run, `tau` = the clock in ticks (a fraction … night.js#48
  function draw(run, tau, dt, extra = 0) {
    if (!sized) size();
    if (!w) return;
    frames++;
    const sec = dt / 1000;
    S[TIME] += sec;
    // (F3B — a FINISH: the run is over at the tick the 200th … night.js#49
    S[ENDAGE] = run.st === 'live' ? 0 : S[ENDAGE] + sec;
    if (run.st === 'made') { tau = run.end + S[ENDAGE] * 60; if (S[ENDAGE] >= 0.3 && S[ENDAGE] - sec < 0.3) { S[SQUASH] = 1; S[LANDT] = S[TIME]; } if (poseTo !== POSE.finish) pose('finish'); }
    tauNow = tau;
    const time = S[TIME], tick = Math.floor(tau);
    G.uTime.value = time;
    const k = dt >= 1000 ? 1 : 1 - Math.exp(-dt / 110);
    // the pose eases (THE OPENING → the play camera: one sweep)
    const pk = Math.min(1, Math.max(0, (time - poseT0) * 1000 / POSE_MS)), pe = pk * pk * (3 - 2 * pk);
    S[PITCH] = poseFrom.pitch + (poseTo.pitch - poseFrom.pitch) * pe; S[BACK] = poseFrom.back + (poseTo.back - poseFrom.back) * pe; S[BALLY] = poseFrom.ballY + (poseTo.ballY - poseFrom.ballY) * pe;
    // the camera follows the ball's FLOOR (never its bounce); in a fall it glides down with the ball
    const span = run.nl - run.pl, u = (run.st === 'live' || run.st === 'made') && run.fl === 'fall' && span > 0 ? Math.min(1, Math.max(0, (tau - run.pl) / span)) : 1;
    const want = run.floor - (1 - u);
    S[CAMY] += (want - S[CAMY]) * k;
    S[KICK] *= Math.exp(-sec * 9); S[SHAKE] *= Math.exp(-sec * 11);
    const shake = S[SHAKE] > 0.01 ? Math.sin(time * 71) * 0.035 * S[SHAKE] : 0;
    const lookY = place(cam, S[PITCH], S[BACK] * shotZoom, S[BALLY], S[CAMY], -S[KICK] + shake);
    // (a FINISH: over the last floor's fall the core stays behind … night.js#50
    const stump = fin >= 0 && S[CAMY] > fin - 1 ? STUMP * (S[CAMY] - fin + 1 > 1 ? 1 : S[CAMY] - fin + 1) : 0;
    pillar.position.y = -(want > S[CAMY] ? want : S[CAMY]) * SHAPE.H - 0.004 - 22 + stump; pillar.updateMatrix(); pillar.matrixWorld.copy(pillar.matrix); // night#51
    G.uSpin.value = (run.a + extra) * UNIT;
    G.uTopY.value = -S[CAMY] * SHAPE.H;

    // the flashes fade
    for (let i = 0; i < RING * SLICES; i++) if (flash[i] > 0) { flash[i] -= sec * 3.2; if (flash[i] < 0) flash[i] = 0; }
    // the slices: the deepest floor first, the ball's last, then the floors just passed (fading out)
    let n = 0;
    // (a finish: no floor from THE BOTTOM down — the seabed is … night.js#52
    const roofAt = breaks.out[0] > 0.5 ? 1e9 : BREAK_FLOORS.skylight;
    for (let i = run.floor + BELOW; i >= run.floor; i--) if ((fin < 0 || i < fin) && i < roofAt) n = putFloor(i, n, 1, 0, tick);
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
    const bed = fin >= 0 && run.floor >= fin;   // (a finish: the ball is over the seabed itself)
    lightMat.uniforms.uOnBed.value = bed ? 1 : 0;
    const fr = floorRec(run.floor), su = sliceUnder(run.a, fr.twist), solid = bed || !(((fr.gap | broken[run.floor % RING]) >> su) & 1);
    const raised = !bed && solid && ((((fr.red | (fr.m1 ? moversAt(fr, tick, RR) : 0)) >> su) & 1)) ? SHAPE.RISE : 0;
    ball.position.set(0, by + (lift < 0.02 ? raised : 0), SHAPE.RB); ball.updateMatrix(); ball.matrixWorld.copy(ball.matrix);
    roofPlane();
    // THE BREAKTHROUGHS: each piece shown while its floor is near, each moment played once when its tick comes
    breaks.update(run, tau, time, sec, S[CAMY], 0, ball.position.y, SHAPE.RB, tier);
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
    Q[0] = 0; Q[1] = (day ? 0.34 + 0.56 * bz : 0.5 + 0.45 * bz) * alive; Q[2] = 0; Q[3] = 0;
    LC[0] = 1; LC[1] = day ? 0.09 + 0.13 * bz : 0.42 - 0.2 * bz; LC[2] = day ? 0.42 + 0.16 * bz : 0.36 + 0.22 * bz; // night#53
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
    LC[6] = day ? 0.92 : 1; LC[7] = day ? 0.05 : 0.82; LC[8] = day ? 0.36 : 0.95;   // (by day THE MARK is a pink ring on the ice — white light is lost on it)
    if (staged && shotGlow > 0 && solid) { P[11] = SHAPE.R_BALL * 3.4; Q[9] = shotGlow; LC[6] = 1; LC[7] = 0.1; LC[8] = 0.16; }   // (F5A — the staged frame: the slice it is about to land on GLOWS RED)
    for (let p = 0; p < PUNCHES; p++) { const age = (time - punchAt[p]) / 0.5, q = (PUNCH0 + p) * 4; Q[q] = 3; Q[q + 1] = !staged && age >= 0 && age < 1 ? 1.2 : 0; Q[q + 2] = Math.min(1, Math.max(0, age)); Q[q + 3] = 0; }
    lP.needsUpdate = lQ.needsUpdate = lC.needsUpdate = true;

    // THE BLAZE = NEON FIRE: the ribbon behind the ball, flames … night.js#54
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

    // THE LOOK's own (F3 — by day): the haze the tower fades into … night.js#55
    const fa = areaIndex(run.floor), fn = fa + 1 < AREAS.length && AREAS[fa + 1].from <= run.floor + BELOW + 1 ? fa + 1 : fa, fk = fn > fa ? fa : fa > 0 ? fa - 1 : fa;
    const AD = AREA_DAY[fa], FA = AREA_DAY[fk], FB = AREA_DAY[fn > fa ? fn : fa];
    G.uFog.value.set(FA[3], FA[4], FA[5]); G.uFogB.value.set(FB[3], FB[4], FB[5]);
    G.uFogK.value = FOG_K[fk]; G.uFogKB.value = FOG_K[fn > fa ? fn : fa];
    G.uFogS.value = FOG_START[fk]; G.uFogSB.value = FOG_START[fn > fa ? fn : fa];
    const NA = AREA_NIGHT[fk], NB = AREA_NIGHT[fn > fa ? fn : fa];   // (F5B — THE WATER SWAP: by night UNDER THE HARBOR's slices shimmer too)
    G.uCaust.value = tier > 0 ? (day ? FA : NA)[9] : 0; G.uCaustB.value = tier > 0 ? (day ? FB : NB)[9] : 0;
    G.uFogSeam.value = -AREAS[fn > fa ? fn : fa].from * SHAPE.H + 0.5;   // (half a floor above the border's first floor)
    fogSnap = false;
    const mk = (day ? AD : AREA_NIGHT[fa])[10];
    if (mk !== moteKind) {
      moteA -= sec * 3;
      if (moteA <= 0) {
        moteA = 0; moteKind = mk;
        if (mk) { const M = MOTE_KINDS[mk]; moteU.uKind.value = M[0]; moteU.uSpeed.value = M[1] * SHAPE.H; moteU.uSize.value = M[2] * (day || M[0] !== 1 ? 1 : MOTE_NIGHT_SIZE); if (day) moteU.uCol.value.set(M[4], M[5], M[6]); else moteU.uCol.value.set(MOTE_NIGHT[0], MOTE_NIGHT[1], MOTE_NIGHT[2]); }
      }
    } else if (moteA < 1) moteA = Math.min(1, moteA + sec * 1.6);
    motes.visible = moteKind > 0 && moteA > 0;
    if (motes.visible) { moteU.uAlpha.value = MOTE_KINDS[moteKind][3] * moteA; moteU.uBaseY.value = -S[CAMY] * SHAPE.H - MOTE_SPAN * 0.72; }

    // THE SHAFT → its half-res target, then the picture
    walls(run.floor);
    const e = cam.matrixWorld.elements;
    wallU.uCam.value.copy(cam.position); wallU.uRight.value.set(e[0], e[1], e[2]); wallU.uUp.value.set(e[4], e[5], e[6]); wallU.uFwd.value.set(-e[8], -e[9], -e[10]);
    wallU.uBallY.value = -S[CAMY] * SHAPE.H;
    wallU.uDarkY.value = run.st === 'live' || state === 'dark' ? -run.dk * SHAPE.H : 1e4;
    skyQuad.visible = wallU.uSkyA.value > 0.5;   // (only while the rooftop is on screen — no full-screen pass below it)
    skyU.uRise.value = Math.min(PANO.rise, S[CAMY] * PANO.riseK);
    // THE BREAKTHROUGHS' word back: the skylight open (the room … night.js#56
    const BO = breaks.out;
    skyU.uOpen.value = BO[0]; wallU.uLitT.value = BO[2]; wallU.uShafts.value = BO[3];
    S[ROOFA] += (BO[1] - S[ROOFA]) * Math.min(1, sec * 6); skyU.uGA.value = S[ROOFA];
    if (staged) { sparks.visible = false; if (state === 'made') shards.visible = false; } // night#57
    if (!AB_FX) { sparks.visible = flames.visible = ribbon.visible = shards.visible = motes.visible = false; }
    drawnV[0] = G.uSpin.value; drawnV[1] = S[CAMY]; drawnV[2] = ball.position.y;
    subAt = performance.now();
    renderer.setRenderTarget(wallRT);
    if (AB_WALL) renderer.render(wallScene, wallCam);
    else { const f = G.uFog.value, a0 = renderer.getClearAlpha(); renderer.getClearColor(keepC); plainC.setRGB(f.x, f.y, f.z); renderer.setClearColor(plainC, 1); renderer.clear(true, false, false); renderer.setClearColor(keepC, a0); }
    renderer.setRenderTarget(null);
    renderer.render(scene, cam);
    if (bloom && tier === 2) bloom.render(scene, cam, TWINS, (day ? 0.4 : 1) * shotBloom); // night#58
    // F4B — THE GHOSTS: over the finished picture, on its own … night.js#59
    if (ghostN > 0 && AB_GHOSTS) {
      V.copy(ball.position).project(cam);
      ghostLayer.place(ghostN, ghostData, w, hh, dpr, (V.x + 1) * 0.5 * w, (1 - V.y) * 0.5 * hh);
      ghostLayer.draw();
    }
    if (!staged) veil.draw(subAt);
  }

  // (a static scene: no mesh composes its matrix a frame — the ones that move set theirs in draw)
  for (const m of scene.children) { m.updateMatrix(); m.matrixAutoUpdate = false; m.matrixWorld.copy(m.matrix); }
  scene.matrixAutoUpdate = false; scene.matrixWorldAutoUpdate = false;
  cam.matrixWorldAutoUpdate = false;   // (place() sets it — once a frame)
  size();

  // THE WARM FRAME: one of everything, drawn once before the … night.js#60
  function warm(run) {
    if (!w) return false;
    try {
      const t = S[TIME];
      shatter(BELOW, false); burst(4, -3, 1, 1, 1, 1, 1); tape.visible = true; ribbonU.uOn.value = 1; skyQuad.visible = true;
      breaks.force(true); // night#61
      renderer.compile(scene, cam); renderer.compile(wallScene, wallCam);
      draw(run, FIRST, 16);
      ghostLayer.warm(); veil.warm();   // (F4B: the ghosts' three programs too — a match builds nothing at its first rival)
      breaks.force(false);
      for (let i = 0; i < SHARDS; i++) cT.array[i * 4] = -100;
      for (let i = 0; i < SPARKS; i++) pT.array[i * 3] = -100;
      for (let i = 0; i < FLAMES; i++) fT.array[i * 4] = -100;
      cT.needsUpdate = true; pT.needsUpdate = true; fT.needsUpdate = true; punchAt.fill(-10); S[KICK] = 0; S[SHAKE] = 0; S[TIME] = t;
      return true;
    } catch { return false; }
  }

  const proj = (x, y, z, c = cam) => { V.set(x, y, z).project(c); return [(1 + V.x) / 2, (1 - V.y) / 2]; };
  // THE LOOK, live (F3): 'day' | 'night' — at once (the other … night.js#62
  function setLook(l) {
    day = l === 'day';
    G.uDay.value = day ? 1 : 0; G.uCover.value = day ? 1 : 0;
    tapeLook();
    breaks.setLook(day);
    if (moteKind > 0) moteKind = -1;   // (F5B: the motes' colour is the look's — they come back in its own)
    preload(); // night#63
    wK = -1; fogSnap = true;
  }
  // YOUR BEST's tape: gold — but on GOLD floors (THE … night.js#64
  function tapeLook() {
    const gold = S[BEST] > 0 && GOLD_AREAS.includes(areaIndex(S[BEST]));
    if (gold) tapeU.uCol.value.setRGB(1.15, 1.15, 1.15); else tapeU.uCol.value.set(day ? GOLD_DAY : GOLD);
    tapeU.uDark.value = gold ? 1 : 0;
  }
  setLook(day ? 'day' : 'night');

  return {
    el, reset, feed, adopt, draw, pose, setTier, warm, setLook,
    lookNow: () => (day ? 'day' : 'night'),
    /** F4B — THE GHOSTS: the stage's records (ghost-fx.js GHOST_STRIDE numbers a ghost — the array is READ each frame, never copied) · their
     *  names' tags (baked once: [{ name, hex }]) · a rival's small echo at a breakthrough */
    ghosts(n, data) { ghostN = data ? n : 0; ghostData = data || null; if (!ghostN) ghostLayer.clear(); },
    ghostNames(list) { ghostLayer.names(list, dpr); workAt = performance.now(); },
    ghostEcho,
    /** FIX C — THE VEIL: the stage's darkness step (0 · 1 · 2 · 3) + the shade + the ink's area */
    veil(dark, shade, area) { veil.set(dark, shade, day, area); },
    veilInfo: () => veil.info(),
    ghostInfo: () => ghostLayer.info(),
    /** YOUR BEST's floor (0 = none): the gold tape lies round its rim */
    setBest(floor) { S[BEST] = floor > 0 ? floor : 0; tapeLook(); },
    /** the review's shot: the picture with the colour removed (red must still read) */
    grey(on) { G.uGrey.value = 0; el.style.filter = on ? 'grayscale(1)' : ''; },   // (the WHOLE picture — the fire too; a check's tool, never on in play)
    /** the page went away / came back: the targets are let go while nobody looks (the memory a hidden tab holds) */
    rest(hidden) { if (hidden) { wallRT.setSize(2, 2); if (bloom) bloom.size(4, 4); } else sized = false; },
    /** the screen pixels one RADIAN of tower turn moves the ring under the ball (the play pose) — the drag's 1 : 1 */
    pxPerRad: () => ppr,
    project: (x, y, z) => proj(x, y, z),
    /** (F4B — THE SHARE CARD's frame; HIGH RISE S5's night.js#snap) the picture on the canvas NOW → a 2D canvas `bw` × `bh` of the part
     *  `rect(width, height, ballX, ballY, column)` names (shot.js#shotCrop — the ball's place 0 … 1 of the picture, the phone column's
     *  shape) + where the ball stands on it (ballX / ballY, 0 … 1); null = this phone can't. ONLY RIGHT AFTER draw(), IN THE SAME FRAME:
     *  the drawing buffer is that frame's until the browser shows it (no preserveDrawingBuffer). Asked once a run (its end + a beat —
     *  stage.js#takeShot): never in play. */
    snap(bw, bh, rect) {
      if (!w || !el.width || !el.height) return null;
      const b = proj(ball.position.x, ball.position.y, ball.position.z), q = rect(el.width, el.height, b[0], b[1], CAM.aspectMax);
      const cv = document.createElement('canvas'); cv.width = bw; cv.height = bh;
      const c = cv.getContext('2d');
      if (!c) return null;
      c.imageSmoothingQuality = 'high'; c.drawImage(el, q.x, q.y, q.w, q.h, 0, 0, bw, bh);
      cv.ballX = (b[0] * el.width - q.x) / q.w; cv.ballY = (b[1] * el.height - q.y) / q.h;
      return cv;
    },
    /** F5A — THE SHARE CARD's STAGED FRAME (shot.js: the hero frame tells the story): the scene drawn ONCE MORE for the card alone — the
     *  run `runX` at its clock `tauX` (stage.js: the moment a beat before the end, replayed; THE BOTTOM: the run itself at the impact),
     *  the camera a step back (o.zoom), the ball alive (o.alive), the slice under it glowing (o.glow), the glow's share (o.bloom), no
     *  punch light + no sparks — then copied off the canvas as snap() does. Nothing of it stays: the view's own eased numbers, the
     *  slice's flash + the sparks are put back; the stage draws the screen's own frame again right after (the same animation frame — the
     *  staged picture is never shown). Once a run, after its end: never in play. */
    shot(runX, tauX, bw, bh, rect, o) {
      if (!w || !el.width || !el.height) return null;
      SV.set(S);
      const st0 = state, sv0 = sparks.visible, sh0 = shards.visible;
      let fi = -1, f0 = 0;
      try {
        staged = true; shotZoom = o.zoom > 0 ? o.zoom : 1; shotBloom = o.bloom >= 0 ? o.bloom : 1;
        S[KICK] = 0; S[SHAKE] = 0; S[SQUASH] = 0;
        if (o.alive) {
          state = 'live'; S[OUTK] = 0;
          // (the camera stands where it stood THEN: on the ball's floor — in a fall, gliding down with it)
          const span = runX.nl - runX.pl, u = runX.fl === 'fall' && span > 0 ? Math.min(1, Math.max(0, (tauX - runX.pl) / span)) : 1;
          S[CAMY] = runX.floor - (1 - u);
        }
        if (!o.alive) { if (!o.party) breaks.quiet(true); breaks.crisp(true); lightMat.uniforms.uHalo.value = SHOT_HALO; } // night#65
        shotGlow = o.glow > 0 ? o.glow : 0;
        // (the slice under the ball wears no leftover flash in the … night.js#66
        if (shotGlow > 0) { const fr = floorRec(runX.floor), su = sliceUnder(runX.a, fr.twist); fi = (runX.floor % RING) * SLICES + su; f0 = flash[fi]; flash[fi] = 0; }
        draw(runX, tauX, 0);
        return this.snap(bw, bh, rect);
      } finally {
        if (fi >= 0) flash[fi] = f0;
        breaks.quiet(false); breaks.crisp(false); lightMat.uniforms.uHalo.value = 1;
        S.set(SV); state = st0; sparks.visible = sv0; shards.visible = sh0; staged = false; shotZoom = 1; shotBloom = 1; shotGlow = 0; frames--;
      }
    },
    // where things are on the screen — the page's own check: the … night.js#67
    frame(run) {
      const c = proj(ball.position.x, ball.position.y, ball.position.z), top = proj(0, ball.position.y + SHAPE.R_BALL, SHAPE.RB), bot = proj(0, ball.position.y - SHAPE.R_BALL, SHAPE.RB), edge = proj(SHAPE.R_BALL, ball.position.y, SHAPE.RB);
      const rows = [];
      for (let i = 0; i <= BELOW; i++) rows.push(proj(0, -(run.floor + i) * SHAPE.H, SHAPE.RO)[1]);
      const ringL = proj(-SHAPE.RO, -run.floor * SHAPE.H, 0), ringR = proj(SHAPE.RO, -run.floor * SHAPE.H, 0);
      return { ball: { x: c[0] * w, y: c[1] * hh, d: Math.max(Math.abs(bot[1] - top[1]) * hh, Math.abs(edge[0] - c[0]) * w * 2) }, floorY: proj(0, -run.floor * SHAPE.H, SHAPE.RB)[1], rows, ring: [ringL[0], ringR[0]], w, h: hh };
    },
    // the screen y (0 … 1) of the TOP of the ball at the top of a … night.js#68
    apexY(run) { place(pcam, POSE.play.pitch, 1, POSE.play.ballY, run.floor, 0); return proj(0, -run.floor * SHAPE.H + 2 * SHAPE.R_BALL + SHAPE.HOP, SHAPE.RB, pcam)[1]; },
    // FIX A — THE TITLE's FIRST LOOK: the look's panorama + the … night.js#69
    skyIn: () => !!(skyNow().have && roofNow().have && cityNow().have),
    info: () => ({ breaks: breaks.info(), landed, roof: [S[ROOFA], skyU.uGW.value, skyU.uHaveR.value, skyU.uHaveC.value], look: day ? 'day' : 'night', motes: motes.visible ? mGeo.instanceCount : 0, moteKind, caust: S[CAMY] * SHAPE.H > -G.uFogSeam.value ? G.uCaustB.value : G.uCaust.value, fog: [G.uFog.value.x, G.uFog.value.y, G.uFog.value.z, G.uFogB.value.x, G.uFogB.value.y, G.uFogB.value.z, G.uFogSeam.value, G.uFogK.value, G.uFogKB.value], flames: FLAMES, fx: fxTex.have, calls: renderer.info.render.calls, tris: renderer.info.render.triangles, programs: renderer.info.programs ? renderer.info.programs.length : 0, dpr, w, h: hh, tier, bloom: !!bloom && tier === 2, slices: sGeo.instanceCount, area: areaA, walls: [...texs.entries()].map(([k, t]) => `${k}:${t.have}`).join(' '), frames, pose: [S[PITCH], S[BACK], S[BALLY]] }),
    /** YOUR BEST's tape as it is drawn (the checks): its colour, its dark edge */
    tapeInfo: () => ({ col: [tapeU.uCol.value.r, tapeU.uCol.value.g, tapeU.uCol.value.b], dark: tapeU.uDark.value, on: tape.visible }),
    /** the last time a picture landed (a frame after it may be a long one: the stage's hitch counter names it) */
    lastWork: () => workAt,
    submitAt: () => subAt, drawn: () => drawnV,
    destroy() {
      gone = true;
      ro.disconnect();
      for (const t of texs.values()) if (t.tex) { const im = t.tex.image; t.tex.dispose(); if (im && im.close) im.close(); }
      for (const m of [pillar, slices, tape, ball, shards, sparks, flames, ribbon, lights, motes, backdrop, skyQuad, wallQuad, ...breaks.meshes]) { m.geometry.dispose(); m.material.dispose(); }
      for (const t of TWINS) t[1].dispose();
      wallRT.dispose(); if (bloom) bloom.dispose(); ghostLayer.dispose(); veil.dispose();
      renderer.dispose();
      try { renderer.forceContextLoss(); } catch { /* fine */ }
      el.remove();
    },
  };
}
