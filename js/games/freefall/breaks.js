// FREEFALL — THE BREAKTHROUGHS (F3B — docs/freefall.md "THE BREAKTHROUGHS"): THE SKYLIGHT (floor 40, the rooftop → the offices) · THE
// SPLASHDOWN (floor 120, the speakeasy → under the harbor) · THE BOTTOM (floor 200 — the seabed; SOLO: it cracks open into THE TRENCH ·
// MATCH + DAILY: their finish). A VIEW ONLY: the rules never change, the clock never stops, no slow motion — the pieces read the run's
// EVENTS (the `area` event's tick is the tick the ball leaves the floor above) and the run's own clock, and play at full speed.
// The pieces are REAL 3D, in the ONE scene night.js owns (their shaders: break-fx.js), each drawn only while its floor is near:
//   · a pane that breaks (the skylight's glass · the seabed) = ONE instanced mesh of the triangles it breaks into (fractureGeo) — intact
//     at rest, the cracks along its own break lines, then the pieces fly in the shader
//   · the skylight's frame + neon tubes (instanced boxes), the roof's deck round it · the water (a normal-mapped plane) · the seabed + rocks
//   · THE SPRITES: a FIXED pool of GPU particles (dust, foam, bubbles, plankton, sediment, a firework's stars) — the tiers trim how many
//     are shed, never the look's shape; the sparks ride night.js's own streak pool
// ZERO GARBAGE IN PLAY (HIGH RISE's LAG RULES): update() + the emitters write into typed arrays made once; no object is made in a frame.
import * as THREE from 'three';
import { HIT_TICKS, CRACK, BURST_V, BURST_F, FRACT_V, GLASS_F, FRAME_V, FRAME_F, DECK_V, DECK_F, WATER_V, WATER_F, SEABED_V, SEABED_F, CHUNK_F, ROCK_V, ROCK_F } from './break-fx.js';

/** the three breakthroughs' floors (tuning.js#AREAS' starts: THE OFFICES · UNDER THE HARBOR · THE BOTTOM) */
export const BREAK_FLOORS = Object.freeze({ skylight: 40, splash: 120, bottom: 200 });
/** the sprites' FIXED pool · how much of a burst each tier sheds (tier 0 · 1 · 2) */
export const BURSTS = 176, BURST_K = Object.freeze([0.45, 0.7, 1]);
/** the skylight: its glass's half size (the ring is 1 wide: it passes inside the frame) · how far above floor 40 the pane lies · its frame's bar */
export const SKYLIGHT = Object.freeze({ half: 1.25, up: 0.4, bar: 0.07 });
/** the water: how far above floor 120 the surface lies · THE WATERLINE's sweep up the screen (s after the plunge, for how long) */
export const WATER = Object.freeze({ up: 0.45, lineAt: 0.05, lineFor: 0.3 });   // (F4A — THE HAZE: the surface is off the floors 0.35 s after the plunge — it was 0.6 s)
/** the seabed: how far under floor 200's top it lies in SOLO (under that floor's own slab — a finish has no floor 200: the bed IS the floor) · the square that cracks open */
export const SEABED = Object.freeze({ down: 0.26, half: 3.3, mouth: 1.14 });   // (mouth — SOLO: the half-width of THE TRENCH's MOUTH, the cleft the tower goes on down: the rings' 1.0 + a margin)
/** a break is only PLAYED when its moment is fresh: an event this many ticks old (a batch that came back from a hidden page) just happens */
const STALE = 90;

/** the pieces a square pane breaks into: triangles laid out round the point of impact (ix, iz) — `sectors` round it, `rings` out to the pane's own edge (its four corners are among the rays: the pane is covered exactly) */
export function fractureGeo(half, ix, iz, sectors, rings, seed, throwK = 1, up = 0.2, spinK = 1) {
  let s = seed >>> 0;
  const rnd = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  const ang = [];
  for (let j = 0; j < sectors; j++) ang.push((j + 0.5 + (rnd() - 0.5) * 0.5) * 2 * Math.PI / sectors);
  // (the four corners' own directions replace the rays nearest them)
  for (const [cx, cz] of [[half, half], [half, -half], [-half, -half], [-half, half]]) {
    const a = (Math.atan2(cx - ix, cz - iz) + 2 * Math.PI) % (2 * Math.PI);
    let best = 0, bd = 9;
    for (let j = 0; j < sectors; j++) { let d = Math.abs(ang[j] - a); if (d > Math.PI) d = 2 * Math.PI - d; if (d < bd) { bd = d; best = j; } }
    ang[best] = a;
  }
  ang.sort((a, b) => a - b);
  const edge = a => { const dx = Math.sin(a), dz = Math.cos(a), tx = Math.abs(dx) < 1e-9 ? 1e9 : ((dx > 0 ? half : -half) - ix) / dx, tz = Math.abs(dz) < 1e-9 ? 1e9 : ((dz > 0 ? half : -half) - iz) / dz; return Math.min(tx, tz); };
  const P = [];   // P[j][r] = [x, z]
  for (let j = 0; j < sectors; j++) {
    const row = [], rho = edge(ang[j]);
    for (let r = 0; r < rings.length; r++) {
      const last = r === rings.length - 1, f = last ? 1 : rings[r] * (0.8 + 0.4 * rnd()), a = ang[j] + (last ? 0 : (rnd() - 0.5) * 0.16);
      const rr = last ? rho : Math.min(edge(a), rho) * f;
      row.push([ix + Math.sin(a) * rr, iz + Math.cos(a) * rr]);
    }
    P.push(row);
  }
  const tris = [];
  for (let j = 0; j < sectors; j++) {
    const k = (j + 1) % sectors;
    tris.push([[ix, iz], P[j][0], P[k][0]]);
    for (let r = 0; r + 1 < rings.length; r++) {
      if ((j + r) & 1) { tris.push([P[j][r], P[j][r + 1], P[k][r + 1]]); tris.push([P[j][r], P[k][r + 1], P[k][r]]); }
      else { tris.push([P[j][r], P[j][r + 1], P[k][r]]); tris.push([P[j][r + 1], P[k][r + 1], P[k][r]]); }
    }
  }
  const n = tris.length, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0, 0, 0, 0], 3));
  g.setAttribute('aB', new THREE.Float32BufferAttribute([1, 0, 0, 0, 1, 0, 0, 0, 1], 3));
  const a0 = new Float32Array(n * 3), a1 = new Float32Array(n * 3), a2 = new Float32Array(n * 3), aV = new Float32Array(n * 3), aR = new Float32Array(n * 4), aD = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    const [A, B, C] = tris[i], cx = (A[0] + B[0] + C[0]) / 3, cz = (A[1] + B[1] + C[1]) / 3, dx = cx - ix, dz = cz - iz, d = Math.hypot(dx, dz) || 1e-3;
    a0.set([A[0], 0, A[1]], i * 3); a1.set([B[0], 0, B[1]], i * 3); a2.set([C[0], 0, C[1]], i * 3);
    // its throw: out from the impact (the nearest pieces the hardest) + a little up, then gravity has it
    const out = (0.5 + 1.4 * rnd()) / (0.6 + d) * throwK;
    aV.set([dx / d * out + (rnd() - 0.5) * 0.5 * throwK, up + rnd() * 1.1 * throwK - d * 0.25 * throwK, dz / d * out + (rnd() - 0.5) * 0.5 * throwK], i * 3);
    aR.set([rnd() - 0.5, (rnd() - 0.5) * 0.5, rnd() - 0.5, (rnd() < 0.5 ? -1 : 1) * (3 + rnd() * 8) * spinK], i * 4);
    aD.set([d / CRACK + rnd() * 0.03, rnd()], i * 2);
  }
  const put = (name, arr, size) => g.setAttribute(name, new THREE.InstancedBufferAttribute(arr, size));
  put('aP0', a0, 3); put('aP1', a1, 3); put('aP2', a2, 3); put('aV', aV, 3); put('aR', aR, 4); put('aD', aD, 2);
  g.instanceCount = n;
  return g;
}

/**
 * createBreaks(X) — X = the scene's own hands (night.js): { scene, twin(mesh, mat), G (the shared uniforms), pics: { roof(), pano(),
 * burst, water, sand, sandN }, wallU, SHAPE, ROOF, FALL, spark(…), sparksDirty(), kick(k, shake), flashFloors(from, to, v), lin(hex),
 * PAL (the palettes), reduce }
 * → { reset(run), feed(e, tau), update(run, tau, time, sec, camY, bx, by, bz, tier), setLook(day), out (what the scene reads back:
 *     [0] the skylight is open · [1] how much of THE ROOF BELOW is there · [2] the time the room's lights come on (−1000 = long since) ·
 *     [3] the light shafts under the harbor (0 … 1) · [4] 1 = a FINISH: no floor at THE BOTTOM, the bed is the floor), meshes, info() }
 */
export function createBreaks(X) {
  const { scene, twin, G, SHAPE, ROOF } = X;
  // (its own dice: where a spark flies is the view's alone — never the rules')
  let dice = 0x3c6ef372;
  const rnd = () => { dice ^= dice << 13; dice >>>= 0; dice ^= dice >>> 17; dice ^= dice << 5; dice >>>= 0; return dice / 4294967296; };
  const meshes = [];
  const add = (mesh, order, mat) => { mesh.frustumCulled = false; mesh.visible = false; mesh.renderOrder = order; scene.add(mesh); twin(mesh, mat); meshes.push(mesh); return mesh; };
  const blend = { transparent: true, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor };
  const derivs = { derivatives: true };
  const plane = size => { const g = new THREE.PlaneGeometry(size, size); g.rotateX(-Math.PI / 2); return g; };
  const out = new Float64Array(6);

  // ---- THE SPRITES (a fixed pool)
  const bGeo = new THREE.InstancedBufferGeometry(), q0 = new THREE.PlaneGeometry(1, 1);
  bGeo.index = q0.index; bGeo.setAttribute('position', q0.getAttribute('position'));
  const inst = (g, name, n, size) => { const a = new THREE.InstancedBufferAttribute(new Float32Array(n * size), size); a.setUsage(THREE.DynamicDrawUsage); g.setAttribute(name, a); return a; };
  const bO = inst(bGeo, 'aO', BURSTS, 3), bV = inst(bGeo, 'aV', BURSTS, 3), bT = inst(bGeo, 'aT', BURSTS, 4), bK = inst(bGeo, 'aK', BURSTS, 4), bC = inst(bGeo, 'aC', BURSTS, 4), bM = inst(bGeo, 'aM', BURSTS, 2);
  for (let i = 0; i < BURSTS; i++) { bT.array[i * 4] = -100; bT.array[i * 4 + 1] = 1; }
  bGeo.instanceCount = BURSTS;
  const burstU = { uTime: G.uTime, uBloom: G.uBloom, uCover: G.uCover, tFx: { value: null }, uHave: { value: 0 }, uFlip: { value: 0 } };
  const burstMat = new THREE.ShaderMaterial({ vertexShader: BURST_V, fragmentShader: BURST_F, uniforms: burstU, depthWrite: false, ...blend });
  const bursts = add(new THREE.Mesh(bGeo, burstMat), 6.5, burstMat);
  let burstN = 0, burstDirty = false, burstUntil = -1, time = 0, tierK = 1, day = false, fxHave = -1;
  /** one sprite into the pool: its start, its throw, its life, its size (birth → end), its cell, its gravity, its drag, how far it swirls, its spin, its colour, how much it covers */
  function puff(x, y, z, vx, vy, vz, life, s0, s1, cell, grav, drag, swirl, spin, r, g, b, cover) {
    const i = burstN++ % BURSTS, i3 = i * 3, i4 = i * 4;
    bO.array[i3] = x; bO.array[i3 + 1] = y; bO.array[i3 + 2] = z;
    bV.array[i3] = vx; bV.array[i3 + 1] = vy; bV.array[i3 + 2] = vz;
    bT.array[i4] = time; bT.array[i4 + 1] = life; bT.array[i4 + 2] = s0; bT.array[i4 + 3] = s1;
    bK.array[i4] = cell; bK.array[i4 + 1] = grav; bK.array[i4 + 2] = drag; bK.array[i4 + 3] = rnd();
    bC.array[i4] = r; bC.array[i4 + 1] = g; bC.array[i4 + 2] = b; bC.array[i4 + 3] = cover;
    bM.array[i * 2] = swirl; bM.array[i * 2 + 1] = spin;
    burstDirty = true;
    if (time + life > burstUntil) burstUntil = time + life;
  }
  /** how many of `n` this tier sheds (never none) */
  const share = n => { const k = Math.round(n * tierK); return k < 1 ? 1 : k; };

  // ---- THE SKYLIGHT: the deck round it (the roof's own painting, at the skylight's true size), its frame + neon tubes, its glass
  const skyY = -BREAK_FLOORS.skylight * SHAPE.H + SKYLIGHT.up, H = SKYLIGHT.half;
  const breakT = { value: 1e9 };
  const deckU = { tRoof: { value: null }, uHaveR: { value: 0 }, uFlipR: { value: 0 }, uDay: G.uDay, uBloom: G.uBloom, uNear: { value: 0 }, uHalf: { value: H + 0.07 }, uWide: { value: 2 * (H + 0.07) / (2 * ROOF.sky) }, uTime: G.uTime, uBreakT: breakT, uRoof: { value: new THREE.Vector2(ROOF.cx, ROOF.cy) } };
  const deckMat = new THREE.ShaderMaterial({ vertexShader: DECK_V, fragmentShader: DECK_F, uniforms: deckU, ...blend });
  const deckGeo = plane(9); deckGeo.translate(0, -0.05, 0);
  const deck = add(new THREE.Mesh(deckGeo, deckMat), 1.5, deckMat);
  // (the frame: four outer bars · the glazing bars — 5 each way, the painting's 6 × 6 panes · eight neon tubes, two a side)
  const boxes = [];
  const bar = 0.07, tube = 0.035;
  for (const [x, z, sx, sz] of [[0, H + bar / 2, 2 * H + 2 * bar, bar], [0, -H - bar / 2, 2 * H + 2 * bar, bar], [H + bar / 2, 0, bar, 2 * H], [-H - bar / 2, 0, bar, 2 * H]]) boxes.push([x, 0, z, sx, 0.09, sz, 0, 0, rnd()]);
  // (each glazing bar in three lengths: it comes down in pieces, never as one long rod)
  for (let k = 1; k < 6; k++) for (let j = 0; j < 3; j++) { const o = -H + k * 2 * H / 6, m = (j - 1) * 2 * H / 3, len = 2 * H / 3; boxes.push([o, 0.01, m, 0.022, 0.05, len, 1, 0, rnd()]); boxes.push([m, 0.01, o, len, 0.05, 0.022, 1, 0, rnd()]); }
  // (the tubes go round the frame from the front left: the short runs out in that order)
  const T = H + bar + tube, L = H + bar;
  [[-L / 2, T, L, 0], [L / 2, T, L, 0], [T, L / 2, 0, L], [T, -L / 2, 0, L], [L / 2, -T, L, 0], [-L / 2, -T, L, 0], [-T, -L / 2, 0, L], [-T, L / 2, 0, L]].forEach(([x, z, lx, lz], i) => boxes.push([x, 0.06, z, lx ? lx - 0.06 : tube, tube, lz ? lz - 0.06 : tube, 2, i, rnd()]));
  const fGeo = new THREE.InstancedBufferGeometry(), box0 = new THREE.BoxGeometry(1, 1, 1);
  fGeo.index = box0.index; fGeo.setAttribute('position', box0.getAttribute('position')); fGeo.setAttribute('normal', box0.getAttribute('normal'));
  const fP = new Float32Array(boxes.length * 3), fS = new Float32Array(boxes.length * 3), fQ = new Float32Array(boxes.length * 3);
  boxes.forEach((b, i) => { fP.set([b[0], b[1], b[2]], i * 3); fS.set([b[3], b[4], b[5]], i * 3); fQ.set([b[6], b[7], b[8]], i * 3); });
  fGeo.setAttribute('aP', new THREE.InstancedBufferAttribute(fP, 3)); fGeo.setAttribute('aS', new THREE.InstancedBufferAttribute(fS, 3)); fGeo.setAttribute('aQ', new THREE.InstancedBufferAttribute(fQ, 3));
  fGeo.instanceCount = boxes.length;
  // (THE ROOF's PLANE — night.js's own matrix, set every frame: the skylight rides the roof seen far below, and IS the true roof at the hit)
  const roofM = { value: X.roofM };
  const frameMat = new THREE.ShaderMaterial({ vertexShader: FRAME_V, fragmentShader: FRAME_F, uniforms: { uTime: G.uTime, uBreakT: breakT, uM: roofM, uDay: G.uDay, uBloom: G.uBloom }, ...blend });
  const frame = add(new THREE.Mesh(fGeo, frameMat), 1.6, frameMat);
  const glassU = { tPano: { value: null }, uHaveP: { value: 0 }, uFlipP: { value: 0 }, uTime: G.uTime, uBreakT: breakT, uGrav: { value: -5.2 }, uLife: { value: 1.0 }, uM: roofM, uDay: G.uDay, uBloom: G.uBloom, uCrack: { value: CRACK * 1.25 }, uHalf: { value: H }, uImpact: { value: new THREE.Vector2(0, SHAPE.RB) } };
  const glassMat = new THREE.ShaderMaterial({ vertexShader: FRACT_V, fragmentShader: GLASS_F, uniforms: glassU, extensions: derivs, side: THREE.DoubleSide, ...blend });
  deckMat.extensions = derivs;
  const glass = add(new THREE.Mesh(fractureGeo(H, 0, SHAPE.RB, 12, [0.2, 0.55, 1], 0x51f15e, 1.7), glassMat), 1.7, glassMat);

  // ---- THE WATER
  const waterY = -BREAK_FLOORS.splash * SHAPE.H + WATER.up;
  const W = X.wallU;
  // (F5A — THE WATER SURFACE: worked out in its shader — the wall's own painting is all it reads; its ripple LINES need the derivatives)
  const waterU = { tWall: W.tA, uHaveW: W.uHaveA, uTileW: W.uTileA, uTime: G.uTime, uDay: G.uDay, uBloom: G.uBloom, uRW: { value: SHAPE.RW }, uRP: { value: SHAPE.RI },
    uSplashT: { value: 1e9 }, uLine: { value: -2 }, uBall: { value: new THREE.Vector3() }, uImpact: { value: new THREE.Vector2(0, SHAPE.RB) } };
  const waterMat = new THREE.ShaderMaterial({ vertexShader: WATER_V, fragmentShader: WATER_F, uniforms: waterU, extensions: derivs, ...blend });
  const water = add(new THREE.Mesh(plane(22), waterMat), 1.5, waterMat);
  water.position.set(0, waterY, 0);

  // ---- THE SEABED: the plane (outside the square that cracks) · the pieces (the square) · a few rocks
  const bedOrigin = { value: new THREE.Vector3(0, 0, 0) }, bedBreak = { value: 1e9 }, bedM = { value: new THREE.Matrix4() };
  const sandU = () => ({ tSand: { value: null }, tSandN: { value: null }, uHaveS: { value: 0 }, uFlipS: { value: 0 }, uHaveSN: { value: 0 }, uFlipSN: { value: 0 }, uTime: G.uTime, uDay: G.uDay, uBloom: G.uBloom, uImpT: bedImp, uRW: { value: SHAPE.RW }, uRimC: bedRim, uBall: waterU.uBall, uImpact: { value: new THREE.Vector2(0, SHAPE.RB) }, uHole: bedHole });
  const bedImp = { value: 1e9 }, bedRim = { value: new THREE.Vector3() }, bedHole = { value: 0 };
  const bedU = { ...sandU(), uHalf: { value: SEABED.half }, uOuter: { value: 1 } };
  const bedMat = new THREE.ShaderMaterial({ vertexShader: SEABED_V, fragmentShader: SEABED_F, uniforms: bedU, ...blend });
  const bed = add(new THREE.Mesh(plane(22), bedMat), 1.5, bedMat);
  const chunkU = { ...sandU(), uBreakT: bedBreak, uGrav: { value: -3.4 }, uLife: { value: 1.5 }, uM: bedM, uCrack: { value: CRACK } };
  const chunkMat = new THREE.ShaderMaterial({ vertexShader: FRACT_V, fragmentShader: CHUNK_F, uniforms: chunkU, extensions: derivs, side: THREE.DoubleSide, ...blend });
  const chunks = add(new THREE.Mesh(fractureGeo(SEABED.half, 0, SHAPE.RB, 12, [0.15, 0.45, 1], 0x5eabed, 0.35, -0.6, 0.22), chunkMat), 1.52, chunkMat);
  // (… + FRONT_ROCKS more in front of the ball, a FINISH's only — the last ones of the list: the bed there is whole, and never an empty beach)
  const FRONT_ROCKS = 5, rockN = 9 + FRONT_ROCKS, rGeo = new THREE.InstancedBufferGeometry(), ico = new THREE.IcosahedronGeometry(1, 1);
  { // (a boulder: the ball of an icosahedron, knocked about a little — the same vertex gets the same knock)
    const p = ico.getAttribute('position');
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 0.82 + 0.3 * (Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453 % 1 + 1) % 1; p.setXYZ(i, x * k, y * k * 0.7, z * k); }
    // (round, not faceted: a boulder worn by the water — its normal is its own direction from its middle)
    const nn = ico.getAttribute('normal');
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i) / 0.7, z = p.getZ(i), l = Math.hypot(x, y, z) || 1; nn.setXYZ(i, x / l, y / l, z / l); }
  }
  rGeo.setAttribute('position', ico.getAttribute('position')); rGeo.setAttribute('normal', ico.getAttribute('normal'));
  const rP = new Float32Array(rockN * 4), rS = new Float32Array(rockN * 3);
  for (let i = 0; i < rockN; i++) {
    // (round the tower's foot, behind + beside it — the front sector is the ball's)
    const back = rockN - FRONT_ROCKS, a = (0.2 + 0.6 * (i + 0.5 * rnd()) / back) * 2 * Math.PI + Math.PI * 0.8, r = 1.35 + rnd() * 1.1, size = 0.1 + rnd() * 0.17;
    if (i >= back) { const j = i - back, fx = (j & 1 ? 1 : -1) * (0.35 + rnd() * 0.75) + (j === 4 ? 0.2 : 0), fz = SHAPE.RB + 0.75 + j * 0.42 + rnd() * 0.2, fs = 0.09 + rnd() * 0.13; rP.set([fx, fs * 0.3, fz, fs], i * 4); rS.set([0.8 + rnd() * 0.5, 0.7 + rnd() * 0.4, rnd() * 6.2832], i * 3); continue; }
    // (… and never in THE TRENCH's MOUTH — the cleft that runs from the tower toward the viewer: a rock there would hang in the air in SOLO)
    let x = Math.sin(a) * r;
    const z = Math.cos(a) * r;
    if (z > -SEABED.mouth && Math.abs(x) < SEABED.mouth + 0.42) x = (x < 0 ? -1 : 1) * (SEABED.mouth + 0.42 + rnd() * 0.5);
    rP.set([x, size * 0.3, z, size], i * 4); rS.set([0.8 + rnd() * 0.5, 0.7 + rnd() * 0.4, rnd() * 6.2832], i * 3);
  }
  rGeo.setAttribute('aP', new THREE.InstancedBufferAttribute(rP, 4)); rGeo.setAttribute('aS', new THREE.InstancedBufferAttribute(rS, 3));
  rGeo.instanceCount = rockN;
  const rockMat = new THREE.ShaderMaterial({ vertexShader: ROCK_V, fragmentShader: ROCK_F, uniforms: { uOrigin: bedOrigin, uTime: G.uTime, uBreakT: bedBreak, uDay: G.uDay, uBloom: G.uBloom, uRimC: bedRim }, ...blend });
  const rocks = add(new THREE.Mesh(rGeo, rockMat), 1.55, rockMat);

  // ---- the state (numbers only): each breakthrough's stage · the tick its moment is due · the scene time it happened at
  let fin = -1;
  let skSt = 0, skHit = -1, skT = 1e9;                       // THE SKYLIGHT: 0 whole · 1 breaking · 2 gone
  let spSt = 0, spHit = -1, spT = 1e9, spBub = 0, spWake = 0; // THE SPLASHDOWN: 0 calm · 1 plunged (the waterline sweeping) · 2 under
  let boSt = 0, boHit = -1, boT = 1e9, boCrack = -1, boCT = 1e9, fwAt = 1e9, fwN = 0;   // THE BOTTOM: 0 · 1 hit · 2 cracking open · 3 gone
  let bedY = 0, played = 0;

  function reset(run) {
    const M = run.R.modes[run.mode];
    fin = M.finish == null ? -1 : M.finish;
    skSt = 0; skHit = -1; skT = 1e9; spSt = 0; spHit = -1; spT = 1e9; spBub = 0; spWake = 0;
    boSt = 0; boHit = -1; boT = 1e9; boCrack = -1; boCT = 1e9; fwAt = 1e9; fwN = 0; played = 0;
    breakT.value = 1e9; waterU.uSplashT.value = 1e9; waterU.uLine.value = -2; bedImp.value = 1e9; bedBreak.value = 1e9; bedU.uOuter.value = 1;
    rGeo.instanceCount = fin === BREAK_FLOORS.bottom ? rockN : rockN - FRONT_ROCKS;
    bedHole.value = fin === BREAK_FLOORS.bottom ? 0 : SEABED.mouth;   // (SOLO: the tower goes on down THE TRENCH's MOUTH — the floor under the ball is always in sight)
    bedY = -BREAK_FLOORS.bottom * SHAPE.H - (fin === BREAK_FLOORS.bottom ? 0 : SEABED.down);
    bed.position.set(0, bedY, 0); bed.updateMatrix(); bed.matrixWorld.copy(bed.matrix);
    bedOrigin.value.set(0, bedY, 0); bedM.value.makeTranslation(0, bedY, 0);
    for (let i = 0; i < BURSTS; i++) bT.array[i * 4] = -100;
    bT.needsUpdate = true; burstUntil = -1;
    out[0] = 0; out[1] = 1; out[2] = -1000; out[3] = 1; out[4] = fin === BREAK_FLOORS.bottom ? 1 : 0;
  }
  /** an event of the run (engine.js) at the run's clock `tau`: an `area` event's tick is the tick the ball leaves the floor above */
  function feed(e, tau) {
    if (e.e === 'area') {
      const fresh = tau - e.t < STALE;
      if (e.floor === BREAK_FLOORS.skylight && skSt === 0) { if (fresh) skHit = e.t + HIT_TICKS; else skSt = 2; }
      else if (e.floor === BREAK_FLOORS.splash && spSt === 0) { if (fresh) spHit = e.t + HIT_TICKS; else spSt = 2; }
      else if (e.floor === BREAK_FLOORS.bottom && boSt === 0) { if (fresh) boHit = e.t + X.FALL; else boSt = fin < 0 ? 3 : 1; }
    } else if (e.e === 'fall' && e.floor === BREAK_FLOORS.bottom + 1 && boSt < 2) { if (tau - e.t < STALE) boCrack = e.t + 3; else boSt = 3; }
  }

  // ---- the moments (each called ONCE, from update — never an object made)
  function breakSkylight() {
    skSt = 1; skT = time; breakT.value = time; played++;
    out[0] = 1; out[2] = time + 0.12;
    const y = skyY, n = X.reduce ? 6 : share(46);
    // the impact: a white burst + glints where the ball went through
    puff(0, y + 0.05, SHAPE.RB, 0, 0.2, 0, 0.2, 0.3, 1.3, 6, 0, 0, 0, 0, 0.85, 0.85, 0.85, 0);
    for (let k = 0; k < share(6); k++) puff((rnd() - 0.5) * 0.7, y + 0.1 + rnd() * 0.3, SHAPE.RB + (rnd() - 0.5) * 0.6, (rnd() - 0.5) * 1.2, 0.6 + rnd(), (rnd() - 0.5) * 1.2, 0.3 + rnd() * 0.3, 0.05, 0.26, 5, -2, 0, 0, 3, 1, 1, 1, 0);
    // a puff of glass dust
    for (let k = 0; k < share(5); k++) puff((rnd() - 0.5) * 1.2, y, SHAPE.RB * 0.5 + (rnd() - 0.5) * 1.2, (rnd() - 0.5) * 0.6, -0.4 - rnd() * 0.6, (rnd() - 0.5) * 0.6, 0.28 + rnd() * 0.14, 0.2, 0.6, 1, -0.3, 1.2, 0.05, 0.6, day ? 0.42 : 0.3, day ? 0.45 : 0.27, day ? 0.5 : 0.42, day ? 0.3 : 0.25);   // (F4A — THE HAZE: gone in 0.4 s — it lay over the floors below for a second)
    // THE SHORT (night): the neon tubes throw a shower of sparks — white-blue + orange — from all round the frame; by day a few white glints of glass
    for (let k = 0; k < n; k++) {
      const side = k & 3, u = (rnd() - 0.5) * 2 * H, e = H + 0.12, x = side === 0 ? u : side === 1 ? e : side === 2 ? u : -e, z = side === 0 ? e : side === 1 ? u : side === 2 ? -e : u;
      const hot = rnd() < 0.5, v = 1.2 + rnd() * 2.6, a = rnd() * 6.2832;
      if (day) X.spark(x * 0.6, y + 0.05, z * 0.6, Math.cos(a) * v * 0.6, 0.4 + rnd() * 1.6, Math.sin(a) * v * 0.6, 0.3 + rnd() * 0.4, 0.008 + rnd() * 0.008, 0.9, 0.97, 1);
      else X.spark(x, y + 0.08, z, Math.cos(a) * v * 0.7 + x * 0.5, 1 + rnd() * 2.8, Math.sin(a) * v * 0.7 + z * 0.5, 0.35 + rnd() * 0.6, 0.009 + rnd() * 0.011, hot ? 1 : 0.6, hot ? 0.55 : 0.82, hot ? 0.16 : 1);
      if (day && k > n / 3) break;
    }
    X.sparksDirty();
    X.flashFloors(BREAK_FLOORS.skylight - 1, BREAK_FLOORS.skylight + 3, 0.9);
    X.kick(0.24, 1);
  }
  function splash(bx, bz) {
    spSt = 1; spT = time; waterU.uSplashT.value = time; played++; spBub = time + 0.16; spWake = time + 3.2;
    const y = waterY;
    // the crown: drops thrown up + out in a cone (lit from above by night), spray, a ring of foam
    for (let k = 0; k < (X.reduce ? 6 : share(34)); k++) { const a = rnd() * 6.2832, o = 0.5 + rnd() * 1.5, up = 1.8 + rnd() * 2.6; X.spark(bx + Math.cos(a) * 0.12, y + 0.04, bz + Math.sin(a) * 0.12, Math.cos(a) * o, up, Math.sin(a) * o * 0.8, 0.45 + rnd() * 0.45, 0.01 + rnd() * 0.012, day ? 0.82 : 1, day ? 0.96 : 0.88, day ? 1 : 0.66); }
    X.sparksDirty();
    for (let k = 0; k < share(9); k++) { const a = rnd() * 6.2832, o = 0.6 + rnd() * 1.1; puff(bx + Math.cos(a) * 0.15, y + 0.12, bz + Math.sin(a) * 0.15, Math.cos(a) * o, 1.6 + rnd() * 1.6, Math.sin(a) * o, 0.34 + rnd() * 0.14, 0.07, 0.26, 4, -5.5, 0, 0, 2, day ? 0.72 : 0.9, day ? 0.92 : 0.98, 1, 0.3); }   // (F5A: by day a touch of the water's own aqua, born smaller + clear of the surface — the crown was one clipped white lump cut flat by the water)
    for (let k = 0; k < share(7); k++) { const a = k / 7 * 6.2832 + rnd() * 0.5, o = 0.7 + rnd() * 0.6; puff(bx + Math.cos(a) * 0.25, y + 0.05, bz + Math.sin(a) * 0.25, Math.cos(a) * o, 0.2 + rnd() * 0.3, Math.sin(a) * o, 0.3 + rnd() * 0.12, 0.14, 0.46, k & 1, -0.4, 1.5, 0, 0.5, 0.5, 0.56, 0.6, 0.28); }
    X.kick(0.32, 0.5);
  }
  /** SOLO: a place on the bed's own sand — the shelves beside the mouth (two of three) or behind the tower — and the way out from it → sx, sz, svx, svz.
   *  (The fresh-eyes review: a cloud over the cleft would hide the floors below — the very thing the mouth is open for.) */
  let sx = 0, sz = 0, svx = 0, svz = 0;
  function shelf(k) {
    if (k % 3 === 2) { sx = (rnd() - 0.5) * 2.6; sz = -1.5 - rnd() * 0.7; svx = sx * 0.4; svz = -0.6 - rnd() * 0.5; return; }
    const side = k & 1 ? 1 : -1;
    sx = side * (SEABED.mouth + 0.5 + rnd() * 0.7); sz = -1.1 + rnd() * 2.4; svx = side * (0.5 + rnd() * 0.8); svz = (rnd() - 0.6) * 0.5;
  }
  function hitBottom(bx, bz) {
    boSt = 1; boT = time; bedImp.value = time; played++;
    const y = bedY, n = X.reduce ? 4 : share(14), solo = fin < 0;
    // the dust cloud: sand lifted off the bed, rolling out + up, slowed by the water (a FINISH: all round the ball · SOLO: off the shelves)
    for (let k = 0; k < n; k++) {
      const a = k / n * 6.2832 + rnd() * 0.6, o = 0.8 + rnd() * 1.1, c = 0.85 + rnd() * 0.3;
      if (solo) shelf(k); else { sx = bx + Math.cos(a) * 0.3; sz = bz + Math.sin(a) * 0.3; svx = Math.cos(a) * o; svz = Math.sin(a) * o; }
      puff(sx, y + 0.1, sz, svx, 0.35 + rnd() * 0.7, svz, 1.4 + rnd() * 0.8, 0.26, solo ? 0.78 : 1.0, k & 1, -0.12, 2.2, 0.04, 0.4, (day ? 0.17 : 0.1) * c, (day ? 0.165 : 0.08) * c, (day ? 0.13 : 0.17) * c, day ? 0.92 : 0.8);
    }
    for (let k = 0; k < share(7); k++) {
      const a = rnd() * 6.2832, o = 0.6 + rnd() * 1.2;
      if (solo) shelf(k); else { sx = bx + Math.cos(a) * 0.2; sz = bz + Math.sin(a) * 0.2; svx = Math.cos(a) * o; svz = Math.sin(a) * o; }
      puff(sx, y + 0.08, sz, svx, 1 + rnd() * 1.4, svz, 0.7 + rnd() * 0.4, 0.1, 0.28, 4, -2.6, 1, 0, 2, day ? 0.5 : 0.36, day ? 0.47 : 0.3, day ? 0.38 : 0.5, 0.6);
    }
    // by night: GLOWING SEDIMENT drifts up out of the ring of light
    if (!day) for (let k = 0; k < share(22); k++) { const a = rnd() * 6.2832, r = 0.3 + rnd() * 1.4, cy = rnd() < 0.55; puff(bx + Math.cos(a) * r, y + 0.1, bz + Math.sin(a) * r, Math.cos(a) * 0.5, 0.25 + rnd() * 0.55, Math.sin(a) * 0.5, 2 + rnd() * 1.1, 0.07, 0.022, 2, 0.05, 1.2, 0.28, 0, cy ? 0.3 : 0.75, cy ? 0.95 : 0.4, 1, 0); }
    X.kick(0.3, 1);
    X.flashFloors(BREAK_FLOORS.bottom - 2, BREAK_FLOORS.bottom, 0.6);
    // a FINISH by night: the firework comes right after
    if (fin === BREAK_FLOORS.bottom && !day && !X.reduce) { fwAt = time + 0.9; fwN = 0; }
  }
  /** one firework-style burst: glowing stars thrown out all round a point, slowed by the water, + a glint at its heart */
  function firework(x, y, z, r, g, b) {
    played++;
    // (the fresh-eyes review: its heart is a GLINT in a soft glow — the scorch's cell read as a dark spiky disc)
    puff(x, y, z, 0, 0, 0, 0.3, 0.16, 0.72, 5, 0, 0, 0, 1.2, r * 0.9 + 0.15, g * 0.9 + 0.15, b * 0.9 + 0.15, 0);
    puff(x, y, z, 0, 0, 0, 0.55, 0.35, 1.2, 2, 0, 0, 0, 0, r * 0.45, g * 0.45, b * 0.45, 0);
    for (let k = 0; k < share(30); k++) {
      const u = rnd() * 2 - 1, a = rnd() * 6.2832, s = Math.sqrt(1 - u * u), v = 1.9 + rnd() * 1.1;   // (… a ball of stars about 1 across: all of it on a phone's screen)
      puff(x, y, z, Math.cos(a) * s * v, u * v, Math.sin(a) * s * v * 0.6, 1.1 + rnd() * 0.5, 0.17, 0.045, 2, -0.9, 2.2, 0.03, 0, r * 1.8, g * 1.8, b * 1.8, 0);
    }
    for (let k = 0; k < share(18); k++) { const a = rnd() * 6.2832, v = 1.3 + rnd() * 1.6; X.spark(x, y, z, Math.cos(a) * v, Math.sin(a) * v + 0.8, (rnd() - 0.5) * v * 0.6, 0.45 + rnd() * 0.45, 0.011 + rnd() * 0.01, r, g, b); }
    X.sparksDirty();
  }
  function crackOpen(bx, bz) {
    boSt = 2; boCT = time; bedBreak.value = time; played++;
    for (let k = 0; k < share(8); k++) { shelf(k); puff(sx, bedY + 0.05, sz, svx * 0.6, 0.3 + rnd() * 0.6, svz * 0.6, 1.1 + rnd() * 0.7, 0.28, 0.78, k & 1, -0.2, 1.8, 0.05, 0.4, day ? 0.17 : 0.1, day ? 0.165 : 0.08, day ? 0.13 : 0.17, day ? 0.92 : 0.8); }
    X.kick(0.16, 0.7);
  }

  /** the look turned: the colours the water + the bed mirror */
  function setLook(d) {
    day = !!d;
    const dp = X.PAL[4];
    const b = X.lin(day ? dp.dayRim : dp.rim); bedRim.value.set(b[0], b[1], b[2]);
  }

  /**
   * one frame: the run, its clock `tau` (ticks — a finish's own drop goes on past the run's end), the scene's time + step (s), the floor
   * the camera is at, the ball's place, the tier. Shows each piece only while its floor is near, plays each moment once when its tick
   * comes, keeps the pictures' uniforms current (numbers compared — nothing built).
   */
  function update(run, tau, now, sec, camY, bx, by, bz, tier) {
    time = now; tierK = BURST_K[tier];
    const pics = X.pics;
    // a run that jumped past a breakthrough (a `?floor=` start, a scene built again): it just happened
    if (skSt === 0 && skHit < 0 && run.floor >= BREAK_FLOORS.skylight) skSt = 2;
    if (spSt === 0 && spHit < 0 && run.floor >= BREAK_FLOORS.splash) spSt = 2;
    if (boSt === 0 && boHit < 0 && run.floor > BREAK_FLOORS.bottom) boSt = 3;
    if (fxHave !== pics.burst.have) { fxHave = pics.burst.have; burstU.tFx.value = pics.burst.tex; burstU.uHave.value = pics.burst.have; burstU.uFlip.value = pics.burst.flip; }

    // ---- THE SKYLIGHT
    if (skSt === 0 && skHit >= 0 && tau >= skHit) breakSkylight();
    const skNear = skSt < 2 && camY < 46.5;   // (it rides the roof below from the title screen on — sharp at every distance)
    if (skSt === 1 && camY >= 46.5) skSt = 2;
    // (F4B — THE FRAME BAR: once the pane breaks nothing of the skylight / the roof stays between the camera and the floors — the deck +
    //  the outer frame + its tubes are gone in 0.25 s (their shaders), the glazing bars fall with the shards: not drawn at all 1.6 s on)
    deck.visible = skNear && (skSt === 0 || now - skT < 0.3); frame.visible = skNear && (skSt === 0 || now - skT < 0.8); glass.visible = skNear && (skSt === 0 || now - skT < 2.2);
    if (skNear) {
      deck.matrixWorld.copy(X.roofM);
      const near = (X.roofM.elements[0] - 0.3) / 0.5; deckU.uNear.value = near <= 0 ? 0 : near >= 1 ? 1 : near;
      const r = pics.roof(), p = pics.pano();
      deckU.tRoof.value = r.tex; deckU.uHaveR.value = r.have; deckU.uFlipR.value = r.flip;
      glassU.tPano.value = p.tex; glassU.uHaveP.value = p.have; glassU.uFlipP.value = p.flip;
    }
    out[0] = skSt > 0 ? 1 : 0;
    out[1] = skSt > 0 ? 0 : 1;
    if (skSt === 2 && now - skT > 30) out[2] = -1000;
    else if (skSt === 2 && skT > 1e8) out[2] = -1000;

    // ---- THE SPLASHDOWN
    if (spSt === 0 && spHit >= 0 && tau >= spHit) splash(bx, bz);
    if (spSt === 1) {
      const k = (now - spT - WATER.lineAt) / WATER.lineFor;
      waterU.uLine.value = k <= 0 ? -2 : -1.15 + 2.4 * (k >= 1 ? 1 : k * k * (3 - 2 * k));
      if (k >= 1) spSt = 2;
      // the bubbles burst up from where it went in — once, just after
      if (spBub > 0 && now >= spBub) {
        spBub = 0;
        for (let i = 0; i < share(16); i++) { const a = rnd() * 6.2832, o = 0.2 + rnd() * 0.6; puff(bx + Math.cos(a) * 0.15, by + (rnd() - 0.3) * 0.5, bz + Math.sin(a) * 0.15, Math.cos(a) * o, 0.7 + rnd() * 1.3, Math.sin(a) * o, 1 + rnd() * 0.7, 0.035, 0.08, 3, 0.5, 0.8, 0.06, 0, 0.8, 1, 1, 0.12); }
      }
    }
    const spNear = spSt < 2 && camY > 104 && camY < 128;   // (asked AFTER the sweep's own step: the plane is gone in the very frame the camera is under)
    water.visible = spNear;
    if (spNear) waterU.uBall.value.set(bx, by, bz);
    // THE WAKE under the surface: by night glowing cyan PLANKTON swirls where the ball has just been; by day a trail of small bubbles
    if (spSt > 0 && now < spWake && !X.reduce) {
      const rate = (day ? 14 : 26) * tierK * (now < spT + 1.6 || !day ? 1 : 0);
      spWakeOwed += sec * rate;
      if (spWakeOwed >= 1) {
        spWakeOwed -= 1;
        if (day) puff(bx + (rnd() - 0.5) * 0.3, by + rnd() * 0.3, bz + (rnd() - 0.5) * 0.3, (rnd() - 0.5) * 0.3, 0.5 + rnd() * 0.8, (rnd() - 0.5) * 0.3, 0.9 + rnd() * 0.6, 0.02, 0.05, 3, 0.4, 0.6, 0.05, 0, 0.85, 1, 1, 0.1);
        else puff(bx + (rnd() - 0.5) * 0.4, by + rnd() * 0.5, bz + (rnd() - 0.5) * 0.4, (rnd() - 0.5) * 0.4, 0.15 + rnd() * 0.5, (rnd() - 0.5) * 0.4, 1.3 + rnd() * 0.8, 0.05, 0.016, 2, 0.02, 1, 0.22, 0, 0.2, 1, 0.88, 0);
        if (spWakeOwed > 3) spWakeOwed = 0;
      }
    }
    // (the light shafts under the surface fade in after the plunge)
    const sh = spSt === 0 ? 0 : spT > 1e8 ? 1 : (now - spT - 0.5) / 1.5;
    out[3] = run.floor < BREAK_FLOORS.splash - 12 ? 1 : sh < 0 ? 0 : sh > 1 ? 1 : sh;

    // ---- THE BOTTOM
    if (boSt === 0 && boHit >= 0 && tau >= boHit) hitBottom(bx, bz);
    if (boSt === 1 && boCrack >= 0 && tau >= boCrack) crackOpen(bx, bz);
    if (boSt === 0 && boCrack >= 0 && tau >= boCrack + 30) boSt = 3;
    if (now >= fwAt) {
      // (the fresh-eyes review: ROUND THE BALL — over the sand, between the ball and the band; never up at the number or off the sides)
      if (fwN === 0) { firework(bx - 0.48, by + 0.42, bz - 0.25, 1, 0.76, 0.22); fwN = 1; fwAt = now + 0.3; }
      else if (fwN === 1) { firework(bx + 0.52, by + 0.62, bz - 0.35, 0.25, 0.92, 1); fwN = 2; fwAt = now + 0.34; }
      else { firework(bx + 0.02, by + 0.95, bz - 0.6, 1, 0.84, 0.36); fwAt = 1e9; }
    }
    if (boSt === 2) {
      const k = (now - boCT - 0.2) / 0.5;
      bedU.uOuter.value = k <= 0 ? 1 : k >= 1 ? 0 : 1 - k;
      if (now - boCT > 1.7) boSt = 3;
    }
    const boNear = boSt < 3 && camY > 184 && camY < 207;
    bed.visible = boNear && bedU.uOuter.value > 0.003; chunks.visible = boNear; rocks.visible = boNear;
    if (boNear) {
      const s = pics.sand, sn = pics.sandN;
      if (bedU.tSand.value !== s.tex || bedU.tSandN.value !== sn.tex) {
        bedU.tSand.value = s.tex; bedU.uHaveS.value = s.have; bedU.uFlipS.value = s.flip; bedU.tSandN.value = sn.tex; bedU.uHaveSN.value = sn.have; bedU.uFlipSN.value = sn.flip;
        chunkU.tSand.value = s.tex; chunkU.uHaveS.value = s.have; chunkU.uFlipS.value = s.flip; chunkU.tSandN.value = sn.tex; chunkU.uHaveSN.value = sn.have; chunkU.uFlipSN.value = sn.flip;
      }
      waterU.uBall.value.set(bx, by, bz);
    }

    // the sprites: drawn only while one is alive
    bursts.visible = now < burstUntil;
    if (forced) for (let i = 0; i < meshes.length; i++) meshes[i].visible = true;
    if (burstDirty) { burstDirty = false; bO.needsUpdate = bV.needsUpdate = bT.needsUpdate = bK.needsUpdate = bC.needsUpdate = bM.needsUpdate = true; }
  }
  let spWakeOwed = 0, forced = false;

  /** THE WARM FRAME's share: every piece drawn once (their programs — the picture's + the bloom pass's — are built behind the opening) */
  function force(on) { forced = !!on; for (let i = 0; i < meshes.length; i++) meshes[i].visible = forced; }
  reset({ R: { modes: { solo: { finish: null } } }, mode: 'solo' });
  return {
    reset, feed, update, setLook, out, meshes, force,
    /** the seabed's height (a finish: the ball comes to rest on it) */
    bedY: () => bedY,
    info: () => ({ skylight: skSt, splash: spSt, bottom: boSt, played, mouth: bedHole.value, rocks: rGeo.instanceCount, line: waterU.uLine.value, sprites: bursts.visible ? BURSTS : 0, deck: deck.visible, frame: frame.visible, glass: glass.visible, water: water.visible, bed: bed.visible || chunks.visible, pieces: [glass.geometry.instanceCount, chunks.geometry.instanceCount] }),
  };
}
