// GRIDLOCK — the holographic war table (three.js). Boards are tilted tactical displays of light on dark glass,
// ships are geometric light-forms, shots arc across the table as beams. The canvas is transparent: the lit district
// (district/backdrop.js) shows through behind and below it.
//
// World: boards lie flat on y = 0, each BOARD units wide, arranged on a ring; your board sits at the front (θ = 0),
// its far edge pointing at the ring's centre. The camera orbits outside the ring looking in at one board (or above the
// whole table for the overview). Everything expensive is prebuilt once per board; a frame is a handful of draw calls.
import * as THREE from 'three';

export const BOARD = 10;
const TAU = Math.PI * 2;
const TIERS = [
  { dpr: 1, points: 0, trail: 10, shards: 20, sweep: false },
  { dpr: 1.5, points: 220, trail: 18, shards: 36, sweep: true },
  { dpr: 2, points: 420, trail: 26, shards: 48, sweep: true },
];

const BOARD_VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const BOARD_FRAG = `
precision highp float;
uniform vec3 uColor; uniform float uN, uTime, uPower, uSweep, uSweepOn, uPulseT, uBounty, uRippleT, uMine;
uniform vec2 uHover, uRipple;
varying vec2 vUv;
void main(){
  vec2 g = vUv * uN;
  vec2 f = fract(g);
  vec2 w = fwidth(g) * 1.1;
  float lx = smoothstep(w.x, 0., f.x) + smoothstep(w.x, 0., 1. - f.x);
  float ly = smoothstep(w.y, 0., f.y) + smoothstep(w.y, 0., 1. - f.y);
  float line = clamp(lx + ly, 0., 1.);
  vec2 e = min(vUv, 1. - vUv); float edge = min(e.x, e.y);
  float rim = smoothstep(0.022, 0., edge);
  float rimSoft = smoothstep(0.14, 0., edge) * 0.3;
  float sh = 0.5 + 0.5 * sin((vUv.x + vUv.y) * 6. - uTime * 0.55);
  vec2 p = vUv - 0.5;
  float ang = atan(p.y, p.x);
  float s = 1. - fract((uSweep - ang) / 6.2831853);
  float sweep = pow(s, 7.) * 0.7 * uSweepOn * smoothstep(0.52, 0.3, length(p));
  vec2 cell = vec2(floor(vUv.x * uN), floor((1. - vUv.y) * uN));
  float hover = (uHover.x >= 0. && abs(cell.x - uHover.x) < 0.5 && abs(cell.y - uHover.y) < 0.5) ? 1. : 0.;
  float ring = 0.;
  if (uRippleT > 0.) {
    vec2 rc = (uRipple + 0.5) / uN; rc.y = 1. - rc.y;
    float rd = length(vUv - rc); float age = uTime - uRippleT;
    ring = exp(-pow((rd - age * 0.55) * 22., 2.)) * exp(-age * 2.4);
  }
  float pulse = uPulseT > 0. ? exp(-(uTime - uPulseT) * 3.) * 0.28 : 0.;
  float vig = smoothstep(0.75, 0.2, length(p));
  vec3 glass = mix(vec3(0.012, 0.02, 0.06), uColor * 0.06, 0.5) * (0.7 + 0.3 * vig);
  float scan = 0.5 + 0.5 * sin(vUv.y * 420. + uTime * 1.5);
  vec3 col = glass + uColor * scan * 0.012;
  col += uColor * (line * (0.16 + 0.1 * vig) + rim * 1.6 + rimSoft * 0.9 + sh * 0.02 + sweep);
  col += uColor * (hover * 0.45 + ring * 1.1 + pulse);
  col += vec3(1.) * (rim * 0.35 + hover * 0.14 + ring * 0.3);
  vec3 gold = vec3(1., 0.78, 0.32);
  float bb = uBounty * (0.65 + 0.35 * sin(uTime * 2.2));
  col = mix(col, gold * (rim * 1.6 + rimSoft * 1.1 + line * 0.2) + glass, bb * 0.85 * clamp(rim + rimSoft + line * 0.3, 0., 1.));
  float alpha = 0.5 + line * 0.3 + rim * 0.5 + rimSoft * 0.35 + ring * 0.6 + hover * 0.35 + sweep * 0.35 + pulse;
  float pw = mix(0.12, 1., uPower);
  gl_FragColor = vec4(col * pw, clamp(alpha, 0., 1.) * pw);
}`;

const SHIP_VERT = `varying vec3 vN; varying vec3 vV; varying vec3 vP; varying vec3 vNl;
void main(){ vNl = normal; vP = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalMatrix * normal; vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`;
const SHIP_FRAG = `
precision highp float;
uniform vec3 uColor; uniform float uTime, uAlpha, uLen, uWid, uHot;
varying vec3 vN; varying vec3 vV; varying vec3 vP; varying vec3 vNl;
void main(){
  float fres = pow(1. - abs(dot(normalize(vN), normalize(vV))), 2.2);
  // circuit etching on the top face: a spine, cross traces every half cell, a few pads
  float etch = 0.;
  float top = step(0.5, vNl.y);
  float x = vP.x / uLen + 0.5, z = vP.z / uWid + 0.5;
  // a spine of light along the hull, a brighter pulse travelling along it, dotted traces either side
  float spine = smoothstep(0.07, 0.015, abs(z - 0.5)) * smoothstep(0.0, 0.08, x) * smoothstep(1.0, 0.92, x);
  float travel = exp(-pow((fract(uTime * 0.35 + vP.x * 0.05) - x) * 6., 2.)) * 0.8;
  float dots = smoothstep(0.3, 0.1, length(vec2(fract(x * uLen * 3.0) - 0.5, (abs(z - 0.5) - 0.3) * 3.))) * 0.6;
  float edgeLine = smoothstep(0.1, 0.03, abs(abs(z - 0.5) - 0.44)) * 0.5;
  etch = top * max(spine * (0.8 + travel), max(dots, edgeLine));
  float side = 1. - top;
  float glow = 0.5 + 0.5 * sin(uTime * 2.1 + vP.x * 1.5);
  vec3 body = vec3(0.02, 0.03, 0.075);
  vec3 col = body + uColor * (fres * 1.35 + etch * (0.7 + 0.2 * glow) + 0.06 + side * 0.18 + uHot * 0.9);
  col += vec3(1.) * (fres * 0.35 + spine * top * 0.45 + uHot * 0.3);
  gl_FragColor = vec4(col, uAlpha);
}`;

const MARK_VERT = `attribute vec3 aColor; attribute float aSeed; varying vec2 vUv; varying vec3 vColor; varying float vSeed;
void main(){ vUv = uv; vColor = aColor; vSeed = aSeed; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }`;
const HIT_FRAG = `
precision highp float;
uniform float uTime; varying vec2 vUv; varying vec3 vColor; varying float vSeed;
float hash(float n){ return fract(sin(n) * 43758.5453); }
void main(){
  vec2 p = vUv * 2. - 1.;
  float gl = step(0.975, hash(floor(uTime * 8.) + vSeed));
  p.x += gl * 0.14 * (hash(vSeed * 3.1) - 0.5);
  float r = length(p);
  float a = atan(p.y, p.x);
  // a white-hot core, a scorched disc, five jagged cracks radiating out, a thin broken ring
  float core = exp(-r * r * 9.);
  float scorch = smoothstep(0.62, 0.1, r) * 0.55;
  float cracks = 0.;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float ca = hash(vSeed + fi * 7.3) * 6.2831853;
    float wob = sin(r * 18. + fi * 2.) * 0.12;
    float d = abs(sin(a - ca + wob));
    cracks += smoothstep(0.08 + r * 0.05, 0., d) * smoothstep(0.98, 0.2, r) * step(0.18, r) * (0.6 + 0.4 * hash(vSeed + fi));
  }
  cracks = min(cracks, 1.);
  float ring = smoothstep(0.05, 0., abs(r - 0.78)) * step(0.35, fract(a * 1.1 + vSeed)) * 0.6;
  vec3 col = vColor * (core * 1.3 + scorch * 0.9 + cracks * 1.1 + ring) + vec3(1.) * (core * 0.9 + cracks * 0.25);
  float alpha = clamp(core * 1.3 + scorch * 0.8 + cracks + ring, 0., 1.) * (1. - gl * 0.6);
  gl_FragColor = vec4(col, alpha);
}`;
const MISS_FRAG = `
precision highp float;
varying vec2 vUv; varying vec3 vColor;
void main(){
  vec2 p = vUv * 2. - 1.; float r = length(p);
  float dot_ = exp(-r * r * 14.) * 0.5;
  float ring = smoothstep(0.08, 0., abs(r - 0.55)) * 0.35;
  gl_FragColor = vec4(mix(vec3(0.75, 0.8, 1.), vColor, 0.35) * (dot_ + ring), (dot_ + ring) * 0.9);
}`;
const TABLE_FRAG = `
precision highp float;
uniform float uTime, uR; varying vec2 vUv;
void main(){
  vec2 p = (vUv - 0.5) * 2.; float r = length(p);
  float rings = smoothstep(0.02, 0., abs(fract(r * 7. - uTime * 0.03) - 0.5) - 0.47) * 0.08;
  float fade = smoothstep(1., 0.35, r);
  float grid = (smoothstep(0.012, 0., abs(fract(p.x * uR * 0.5) - 0.5) - 0.485) + smoothstep(0.012, 0., abs(fract(p.y * uR * 0.5) - 0.5) - 0.485)) * 0.05;
  vec3 col = vec3(0.03, 0.05, 0.12) * 0.9 + vec3(0.25, 0.45, 0.9) * (rings + grid);
  gl_FragColor = vec4(col, (0.5 + rings + grid) * fade);
}`;

function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function labelTexture(n, color) {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const x = c.getContext('2d');
  x.clearRect(0, 0, 512, 512);
  const m = 44, inner = 512 - m * 2, cell = inner / n;
  x.fillStyle = color; x.globalAlpha = 0.72;
  x.font = `700 ${Math.round(cell * 0.42)}px "JetBrains Mono", "Chakra Petch", monospace`;
  x.textAlign = 'center'; x.textBaseline = 'middle';
  for (let i = 0; i < n; i++) {
    x.fillText('ABCDEFGHIJ'[i], m + cell * (i + 0.5), m * 0.5);                 // columns along the far edge
    x.fillText(String(i + 1), m * 0.5, m + cell * (i + 0.5));                    // rows down the left
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

export function createScene(canvas, { size, reduced = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 400);
  let tier = 2, W = 1, H = 1, portrait = true;
  const N = size;
  const CELL = BOARD / N;
  const clock = { t: 0 };
  const boards = new Map();   // uid -> board record
  let ring = 7, order = [];
  const glow = glowTexture();
  const disposables = [];
  let sweepA = 0, sweepOn = 0, sweepNext = 4;
  let onSweep = null;

  // ---- camera
  const cam = { pos: new THREE.Vector3(0, 14, 16), look: new THREE.Vector3(0, 0, 0), goalPos: new THREE.Vector3(0, 14, 16), goalLook: new THREE.Vector3(), speed: 4, shake: 0 };
  let focusUid = 'overview';
  let focusPush = 0;

  // ---- the table + ambience
  const tableGeo = new THREE.CircleGeometry(1, 64);
  const tableMat = new THREE.ShaderMaterial({ vertexShader: BOARD_VERT, fragmentShader: TABLE_FRAG, uniforms: { uTime: { value: 0 }, uR: { value: 1 } }, transparent: true, depthWrite: false });
  const table = new THREE.Mesh(tableGeo, tableMat); table.rotation.x = -Math.PI / 2; table.position.y = -0.08; scene.add(table);
  disposables.push(tableGeo, tableMat);
  let points = null;
  function buildPoints() {
    if (points) { scene.remove(points); points.geometry.dispose(); points.material.dispose(); points = null; }
    const n = reduced ? 0 : TIERS[tier].points;
    if (!n) return;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const a = Math.random() * TAU, r = 6 + Math.random() * 60; pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = -14 + Math.random() * 22; pos[i * 3 + 2] = Math.sin(a) * r; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ size: 0.09, map: glow, color: 0x8fb8ff, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
    points = new THREE.Points(g, m); scene.add(points);
  }
  buildPoints();

  // ---- shared geometries
  const planeGeo = new THREE.PlaneGeometry(BOARD, BOARD);
  const markGeo = new THREE.PlaneGeometry(CELL * 0.86, CELL * 0.86);
  const ringGeo = new THREE.RingGeometry(0.7, 0.86, 48);
  const shardGeo = new THREE.TetrahedronGeometry(CELL * 0.17, 0);
  const labelGeo = new THREE.PlaneGeometry(BOARD * 512 / 424, BOARD * 512 / 424);
  disposables.push(planeGeo, markGeo, ringGeo, shardGeo, labelGeo);

  function boardColor(hex) { return new THREE.Color(hex); }

  /** Lay the boards out: uids in order, [0] = this phone's (front). */
  function layout(uids, colors) {
    for (const uid of [...boards.keys()]) if (!uids.includes(uid)) removeBoard(uid);
    order = uids.slice();
    const n = uids.length;
    ring = n <= 2 ? 6.8 : n === 3 ? 8.4 : n <= 5 ? 10.5 : 13.5;
    uids.forEach((uid, i) => {
      const th = (i / n) * TAU;                     // mine at θ=0 (front, +z), the rest around the ring
      let b = boards.get(uid);
      if (!b) { b = makeBoard(uid, colors[uid]); boards.set(uid, b); }
      b.theta = th;
      b.group.position.set(Math.sin(th) * ring, 0, Math.cos(th) * ring);
      b.group.rotation.y = th;
      b.index = i;
    });
    tableMat.uniforms.uR.value = ring;
    table.scale.setScalar(ring + BOARD * 0.9);
    refocus(true);
  }

  function makeBoard(uid, hex) {
    const color = boardColor(hex);
    const group = new THREE.Group();
    const mat = new THREE.ShaderMaterial({
      vertexShader: BOARD_VERT, fragmentShader: BOARD_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { uColor: { value: color }, uN: { value: N }, uTime: { value: 0 }, uPower: { value: 1 }, uSweep: { value: 0 }, uSweepOn: { value: 0 }, uPulseT: { value: 0 }, uBounty: { value: 0 }, uRippleT: { value: 0 }, uMine: { value: 0 }, uHover: { value: new THREE.Vector2(-1, -1) }, uRipple: { value: new THREE.Vector2(0, 0) } },
    });
    const halo = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: glow, color, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo.rotation.x = -Math.PI / 2; halo.position.y = -0.03; halo.scale.setScalar(1.55); group.add(halo);
    const plane = new THREE.Mesh(planeGeo, mat); plane.rotation.x = -Math.PI / 2; group.add(plane);
    const labelTex = labelTexture(N, hex);
    const labels = new THREE.Mesh(labelGeo, new THREE.MeshBasicMaterial({ map: labelTex, transparent: true, depthWrite: false, opacity: 0.9 }));
    labels.rotation.x = -Math.PI / 2; labels.position.y = 0.01;
    // the label canvas has its margin on the far/left sides: shift so the grid lines up
    const scale = BOARD / 424; labels.position.x = -44 * scale / 2 * 0 - (44 * scale) / 2 + (44 * scale) / 2; labels.position.set(-(44 * scale) / 2, 0.01, -(44 * scale) / 2);
    group.add(labels);
    const cap = N * N;
    const hits = new THREE.InstancedMesh(markGeo, new THREE.ShaderMaterial({ vertexShader: MARK_VERT, fragmentShader: HIT_FRAG, uniforms: { uTime: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), cap);
    const misses = new THREE.InstancedMesh(markGeo, new THREE.ShaderMaterial({ vertexShader: MARK_VERT, fragmentShader: MISS_FRAG, transparent: true, depthWrite: false }), cap);
    for (const im of [hits, misses]) {
      im.geometry = markGeo.clone();
      im.geometry.setAttribute('aColor', new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3));
      im.geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(new Float32Array(cap), 1));
      im.count = 0; im.frustumCulled = false; group.add(im);
    }
    const reticle = new THREE.Group();
    const rr = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }));
    rr.rotation.x = -Math.PI / 2; rr.scale.setScalar(CELL * 0.62); reticle.add(rr);
    const cross = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const bar = new THREE.Mesh(new THREE.PlaneGeometry(CELL * 0.26, CELL * 0.05), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthWrite: false }));
      bar.rotation.x = -Math.PI / 2; bar.rotation.z = (i * Math.PI) / 2;
      bar.position.set(Math.cos(i * Math.PI / 2) * CELL * 0.58, 0, -Math.sin(i * Math.PI / 2) * CELL * 0.58);
      cross.add(bar);
    }
    reticle.add(cross); reticle.position.y = 0.06; reticle.visible = false; group.add(reticle);
    scene.add(group);
    return { uid, color, hex, group, mat, plane, halo, labels, labelTex, hits, misses, reticle, ships: [], ghost: null, power: 1, shards: [], flickerT: 0, theta: 0, index: 0 };
  }

  function removeBoard(uid) {
    const b = boards.get(uid);
    if (!b) return;
    scene.remove(b.group);
    b.mat.dispose(); b.labelTex.dispose(); b.labels.material.dispose();
    b.hits.geometry.dispose(); b.hits.material.dispose(); b.misses.geometry.dispose(); b.misses.material.dispose();
    for (const s of b.ships) { s.mesh.geometry.dispose(); s.mesh.material.dispose(); if (s.pool) s.pool.material.dispose(); }
    if (b.halo) b.halo.material.dispose();
    boards.delete(uid);
  }

  const cellLocal = (r, c) => new THREE.Vector3(-BOARD / 2 + (c + 0.5) * CELL, 0, -BOARD / 2 + (r + 0.5) * CELL);
  const cellWorld = (b, r, c, y = 0) => b.group.localToWorld(cellLocal(r, c).setY(y));

  /** Public marks for a board (hits/misses). `pending` = Set of "r,c" keys not to show yet (this volley's cinematic). */
  function setMarks(uid, cells, pending = null, colorOf = () => '#ffffff') {
    const b = boards.get(uid); if (!b) return;
    const m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)), sc = new THREE.Vector3(1, 1, 1);
    let hi = 0, mi = 0;
    const hc = b.hits.geometry.getAttribute('aColor'), hs = b.hits.geometry.getAttribute('aSeed');
    const mc = b.misses.geometry.getAttribute('aColor');
    const col = new THREE.Color();
    for (const [key, v] of Object.entries(cells || {})) {
      if (pending && pending.has(key)) continue;
      const [r, c] = key.split(',').map(Number);
      const im = v.h === 1 ? b.hits : b.misses;
      const i = v.h === 1 ? hi++ : mi++;
      m.compose(cellLocal(r, c).setY(0.035), q, sc);
      im.setMatrixAt(i, m);
      col.set(colorOf(v.by));
      if (v.h === 1) { hc.setXYZ(i, col.r, col.g, col.b); hs.setX(i, (r * 31 + c * 17) % 97); } else mc.setXYZ(i, col.r, col.g, col.b);
    }
    b.hits.count = hi; b.misses.count = mi;
    b.hits.instanceMatrix.needsUpdate = true; b.misses.instanceMatrix.needsUpdate = true;
    hc.needsUpdate = true; hs.needsUpdate = true; mc.needsUpdate = true;
  }

  function hullGeometry(L, Wd, Ht) {
    // a sleek hull: a rounded body with a pointed bow (+x) and a squared stern, extruded and bevelled
    const w = Wd / 2, nose = Math.min(Wd * 0.9, L * 0.28);
    const shape = new THREE.Shape();
    shape.moveTo(-L / 2 + w * 0.3, -w); shape.lineTo(L / 2 - nose, -w); shape.quadraticCurveTo(L / 2, -w * 0.55, L / 2, 0);
    shape.quadraticCurveTo(L / 2, w * 0.55, L / 2 - nose, w); shape.lineTo(-L / 2 + w * 0.3, w);
    shape.quadraticCurveTo(-L / 2, w, -L / 2, w * 0.6); shape.lineTo(-L / 2, -w * 0.6); shape.quadraticCurveTo(-L / 2, -w, -L / 2 + w * 0.3, -w);
    const g = new THREE.ExtrudeGeometry(shape, { depth: Ht, bevelEnabled: true, bevelThickness: Ht * 0.35, bevelSize: w * 0.18, bevelSegments: 2, curveSegments: 6 });
    g.rotateX(-Math.PI / 2);                       // extrude along +y
    g.translate(0, -Ht * 0.35, 0);
    g.computeVertexNormals();
    return g;
  }
  function shipMesh(b, s, { alpha = 1, hot = 0 } = {}) {
    const L = s.len * CELL * 0.9, Wd = CELL * 0.6;
    const geo = hullGeometry(L, Wd, CELL * 0.22);
    const mat = new THREE.ShaderMaterial({ vertexShader: SHIP_VERT, fragmentShader: SHIP_FRAG, transparent: true, depthWrite: alpha >= 1,
      uniforms: { uColor: { value: b.color.clone() }, uTime: { value: 0 }, uAlpha: { value: alpha }, uLen: { value: L }, uWid: { value: Wd }, uHot: { value: hot } } });
    const mesh = new THREE.Mesh(geo, mat);
    placeShipMesh(mesh, s);
    return mesh;
  }
  function placeShipMesh(mesh, s) {
    const cx = -BOARD / 2 + (s.d ? s.c + 0.5 : s.c + s.len / 2) * CELL;
    const cz = -BOARD / 2 + (s.d ? s.r + s.len / 2 : s.r + 0.5) * CELL;
    mesh.position.set(cx, 0.26, cz);
    mesh.rotation.y = s.d ? Math.PI / 2 : 0;
  }

  /** The fleet shown on a board (your own, or revealed wrecks). */
  function setShips(uid, ships) {
    const b = boards.get(uid); if (!b) return;
    for (const s of b.ships) { b.group.remove(s.mesh); s.mesh.geometry.dispose(); s.mesh.material.dispose(); if (s.pool) { b.group.remove(s.pool); s.pool.material.dispose(); } }
    b.ships = [];
    (ships || []).forEach((s, i) => {
      if (!s) return;
      const mesh = shipMesh(b, s);
      const pool = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: glow, color: b.color, transparent: true, opacity: 0.32, depthWrite: false, blending: THREE.AdditiveBlending }));
      pool.rotation.x = -Math.PI / 2; pool.position.copy(mesh.position).setY(0.045); pool.rotation.z = s.d ? Math.PI / 2 : 0;
      pool.scale.set((s.len * CELL * 1.25) / BOARD, (CELL * 1.6) / BOARD, 1);
      b.group.add(mesh, pool);
      b.ships.push({ mesh, pool, ship: s, idx: i, phase: i * 1.7 });
    });
  }
  function hideShip(uid, idx) {
    const b = boards.get(uid); if (!b) return;
    const s = b.ships.find(x => x.idx === idx);
    if (s) { b.group.remove(s.mesh); s.mesh.geometry.dispose(); s.mesh.material.dispose(); if (s.pool) { b.group.remove(s.pool); s.pool.material.dispose(); } b.ships = b.ships.filter(x => x !== s); }
  }
  /** Placement preview: a ship ghost (valid = player colour, invalid = red). */
  function setGhost(uid, ship, valid) {
    const b = boards.get(uid); if (!b) return;
    if (b.ghost) { b.group.remove(b.ghost); b.ghost.geometry.dispose(); b.ghost.material.dispose(); b.ghost = null; }
    if (!ship) return;
    const g = shipMesh(b, ship, { alpha: 0.55, hot: valid ? 0.25 : 0 });
    if (!valid) g.material.uniforms.uColor.value.set('#ff3355');
    g.position.y = 0.42;
    b.group.add(g); b.ghost = g;
  }

  function hover(uid, r, c) { for (const b of boards.values()) b.mat.uniforms.uHover.value.set(b.uid === uid && r != null ? c : -1, b.uid === uid && r != null ? r : -1); }
  function reticle(uid, r, c) {
    for (const b of boards.values()) {
      const on = b.uid === uid && r != null;
      b.reticle.visible = on;
      if (on) b.reticle.position.copy(cellLocal(r, c).setY(0.06));
    }
  }
  function setPower(uid, p) { const b = boards.get(uid); if (b) { b.power = p; b.mat.uniforms.uPower.value = p; } }
  function setBounty(uid) { for (const b of boards.values()) b.mat.uniforms.uBounty.value = b.uid === uid ? 1 : 0; }

  // ---- effects
  const fx = [];   // { update(dt, t) -> alive }
  function miss(uid, r, c) {
    const b = boards.get(uid); if (!b) return;
    b.mat.uniforms.uRipple.value.set(c, r); b.mat.uniforms.uRippleT.value = clock.t;
  }
  function hit(uid, r, c, hex) {
    const b = boards.get(uid); if (!b) return;
    b.mat.uniforms.uPulseT.value = clock.t;
    const p = cellWorld(b, r, c, 0.08);
    const col = new THREE.Color(hex);
    // flash + shockwave ring
    const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: col, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending }));
    flash.position.copy(p); flash.scale.setScalar(CELL * 2.4); scene.add(flash);
    const rg = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    rg.rotation.x = -Math.PI / 2; rg.position.copy(p); rg.scale.setScalar(CELL * 0.3); scene.add(rg);
    let age = 0;
    fx.push({ update(dt) { age += dt; const k = age / 0.55; flash.material.opacity = Math.max(0, 1 - k * 1.6); flash.scale.setScalar(CELL * (2.4 + k * 2)); rg.scale.setScalar(CELL * (0.3 + k * 3.4)); rg.material.opacity = Math.max(0, 0.95 - k); if (k >= 1) { scene.remove(flash, rg); flash.material.dispose(); rg.material.dispose(); return false; } return true; } });
    if (!reduced) cam.shake = Math.max(cam.shake, 0.35);
  }
  /** A beam from one board to a cell on another. Resolves (calls onImpact) when it lands. */
  function fire({ from, to, r, c, hex, duration = 0.75 }, onImpact) {
    const a = boards.get(from), b = boards.get(to);
    if (!a || !b) { onImpact && onImpact(); return; }
    const p0 = a.group.position.clone().setY(0.9), p2 = cellWorld(b, r, c, 0.1);
    const dist = p0.distanceTo(p2);
    const p1 = p0.clone().lerp(p2, 0.5).setY(Math.max(p0.y, p2.y) + dist * 0.38 + 2.5);
    const curve = new THREE.QuadraticBezierCurve3(p0, p1, p2);
    const col = new THREE.Color(hex);
    const head = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    head.scale.setScalar(CELL * 1.1); scene.add(head);
    const nTrail = TIERS[tier].trail;
    const tg = new THREE.BufferGeometry(); const tp = new Float32Array(nTrail * 3); tg.setAttribute('position', new THREE.BufferAttribute(tp, 3));
    const trail = new THREE.Line(tg, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending }));
    trail.frustumCulled = false; scene.add(trail);
    let age = 0, done = false;
    const hist = [];
    fx.push({ update(dt) {
      age += dt;
      const k = Math.min(1, age / duration);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;   // ease in-out
      const p = curve.getPoint(e);
      head.position.copy(p);
      hist.push(p.clone()); while (hist.length > nTrail) hist.shift();
      for (let i = 0; i < nTrail; i++) { const q = hist[Math.max(0, hist.length - 1 - (nTrail - 1 - i))] || p; tp[i * 3] = q.x; tp[i * 3 + 1] = q.y; tp[i * 3 + 2] = q.z; }
      tg.attributes.position.needsUpdate = true;
      if (k >= 1 && !done) { done = true; onImpact && onImpact(); }
      if (age > duration + 0.25) { scene.remove(head, trail); head.material.dispose(); tg.dispose(); trail.material.dispose(); return false; }
      if (done) { head.material.opacity = Math.max(0, 1 - (age - duration) / 0.25); trail.material.opacity = head.material.opacity * 0.75; }
      return true;
    } });
  }
  /** A ship reveals, cracks and shatters into shards that sink through the table. */
  function sink(uid, ship, idx) {
    const b = boards.get(uid); if (!b) return;
    hideShip(uid, idx);
    const wreck = shipMesh(b, ship, { alpha: 1, hot: 1 });
    b.group.add(wreck);
    b.mat.uniforms.uPulseT.value = clock.t;
    const n = Math.min(TIERS[tier].shards, ship.len * 9 + 6);
    const im = new THREE.InstancedMesh(shardGeo, new THREE.MeshBasicMaterial({ color: b.color, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending }), n);
    im.frustumCulled = false;
    const parts = [];
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(1, 1, 1);
    const centre = wreck.position.clone();
    for (let i = 0; i < n; i++) {
      const along = (Math.random() - 0.5) * ship.len * CELL * 0.9;
      const pos = ship.d ? new THREE.Vector3(centre.x + (Math.random() - 0.5) * CELL * 0.5, 0.3, centre.z + along) : new THREE.Vector3(centre.x + along, 0.3, centre.z + (Math.random() - 0.5) * CELL * 0.5);
      parts.push({ pos, vel: new THREE.Vector3((Math.random() - 0.5) * 2.2, 1.2 + Math.random() * 2.4, (Math.random() - 0.5) * 2.2), rot: new THREE.Vector3(Math.random() * 6, Math.random() * 6, 0), spin: (Math.random() - 0.5) * 9 });
    }
    let age = 0;
    fx.push({ update(dt) {
      age += dt;
      if (age < 0.5) { wreck.material.uniforms.uHot.value = 1 + Math.sin(age * 40) * 0.5; wreck.position.y = 0.22 + Math.sin(age * 60) * 0.03; return true; }
      if (wreck.parent) { b.group.remove(wreck); wreck.geometry.dispose(); wreck.material.dispose(); b.group.add(im); if (!reduced) cam.shake = Math.max(cam.shake, 0.7); }
      const t2 = age - 0.5;
      parts.forEach((p, i) => {
        p.vel.y -= 7 * dt; p.pos.addScaledVector(p.vel, dt); p.rot.x += p.spin * dt; p.rot.y += p.spin * 0.7 * dt;
        e.set(p.rot.x, p.rot.y, 0); q.setFromEuler(e);
        const s = Math.max(0.05, 1 - t2 / 1.6); sc.setScalar(s);
        m.compose(p.pos, q, sc); im.setMatrixAt(i, m);
      });
      im.instanceMatrix.needsUpdate = true;
      im.material.opacity = Math.max(0, 1 - t2 / 1.6);
      if (t2 > 1.6) { b.group.remove(im); im.material.dispose(); im.dispose(); return false; }
      return true;
    } });
  }
  /** The whole board flickers, glitches and powers down to dark. */
  function eliminate(uid) {
    const b = boards.get(uid); if (!b) return;
    for (const s of b.ships.slice()) hideShip(uid, s.idx);
    let age = 0;
    fx.push({ update(dt) {
      age += dt;
      const k = age / 1.4;
      const flicker = Math.random() < 0.5 ? 1 : 0.25;
      setPower(uid, k < 1 ? Math.max(0.08, (1 - k) * flicker + 0.08) : 0.08);
      b.group.position.x = Math.sin(b.theta) * ring + (k < 1 ? (Math.random() - 0.5) * 0.12 * (1 - k) : 0);
      if (k >= 1) { setPower(uid, 0.08); b.group.position.x = Math.sin(b.theta) * ring; return false; }
      return true;
    } });
  }

  // ---- camera
  function fitDistance(span, aspectFactor = 1) {
    const vfov = (camera.fov * Math.PI) / 180;
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
    const dw = (span * (portrait ? 0.63 : 0.56) * aspectFactor) / Math.tan(hfov / 2);
    const dh = (span * (portrait ? 0.74 : 0.92)) / Math.tan(vfov / 2);
    return Math.max(dw, dh);
  }
  function refocus(instant = false) {
    const elev = portrait ? 0.98 : 0.86;   // radians above the table
    if (focusUid === 'overview' || !boards.has(focusUid)) {
      const span = ring * 2 + BOARD * 1.1;
      const d = fitDistance(span, 0.95) * 0.78;
      const mine = boards.get(order[0]);
      const th = mine ? mine.theta : 0;
      cam.goalPos.set(Math.sin(th) * Math.cos(elev + 0.25) * d, Math.sin(elev + 0.25) * d, Math.cos(th) * Math.cos(elev + 0.25) * d);
      cam.goalLook.set(0, -1.5, 0);
    } else {
      const b = boards.get(focusUid);
      const d = fitDistance(BOARD * (1 + focusPush * -0.18)) * (portrait ? 1 : 0.94);
      const out = new THREE.Vector3(Math.sin(b.theta), 0, Math.cos(b.theta));
      const pos = b.group.position.clone().addScaledVector(out, Math.cos(elev) * d).setY(Math.sin(elev) * d);
      cam.goalPos.copy(pos);
      // look a little past the board (inward) in portrait so it sits lower, leaving the top for the HUD
      cam.goalLook.copy(b.group.position).addScaledVector(out, portrait ? -BOARD * 0.22 : BOARD * 0.08);
    }
    if (instant) { cam.pos.copy(cam.goalPos); cam.look.copy(cam.goalLook); }
  }
  function focus(uid, { instant = false, push = 0, speed = 4 } = {}) { focusUid = uid; focusPush = push; cam.speed = speed; refocus(instant); }

  // ---- picking
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const planeY = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  function pick(x, y, onlyUid = null) {
    ndc.set((x / W) * 2 - 1, -(y / H) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hitP = new THREE.Vector3();
    if (!ray.ray.intersectPlane(planeY, hitP)) return null;
    let best = null;
    for (const b of boards.values()) {
      if (onlyUid && b.uid !== onlyUid) continue;
      const local = b.group.worldToLocal(hitP.clone());
      const c = Math.floor((local.x + BOARD / 2) / CELL), r = Math.floor((local.z + BOARD / 2) / CELL);
      const inside = c >= 0 && r >= 0 && c < N && r < N;
      if (inside) return { uid: b.uid, r, c };
      const d = Math.max(Math.abs(local.x), Math.abs(local.z));
      if (!best || d < best.d) best = { uid: b.uid, d, r: Math.max(0, Math.min(N - 1, r)), c: Math.max(0, Math.min(N - 1, c)) };
    }
    return best && best.d < BOARD * 0.75 ? { uid: best.uid, r: best.r, c: best.c, near: true } : null;
  }

  // ---- frame
  let last = 0;
  const frameTimes = [];
  function frame(now) {
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    clock.t += dt;
    const t = clock.t;
    // radar sweep: a pass every ~9 s
    if (TIERS[tier].sweep && !reduced) {
      if (t > sweepNext) { sweepOn = 1; sweepA = 0; sweepNext = t + 9 + Math.random() * 3; if (onSweep) onSweep(); }
      if (sweepOn) { sweepA += dt * (TAU / 2.6); if (sweepA >= TAU) { sweepOn = 0; sweepA = 0; } }
    }
    for (const b of boards.values()) {
      const lit = focusUid === b.uid ? 0.9 : focusUid === 'overview' ? 0.45 : 0.0;   // other boards face away: their labels would read mirrored
      b.labels.material.opacity += (lit - b.labels.material.opacity) * Math.min(1, dt * 5);
      if (b.halo) b.halo.material.opacity = 0.22 * b.power;
      b.mat.uniforms.uTime.value = t; b.mat.uniforms.uSweep.value = sweepA; b.mat.uniforms.uSweepOn.value = sweepOn;
      b.hits.material.uniforms.uTime.value = t;
      for (const s of b.ships) { s.mesh.material.uniforms.uTime.value = t; s.mesh.position.y = 0.26 + Math.sin(t * 1.3 + s.phase) * 0.04; if (s.pool) s.pool.material.opacity = 0.26 + Math.sin(t * 1.3 + s.phase) * 0.06; }
      if (b.ghost) b.ghost.material.uniforms.uTime.value = t;
    }
    tableMat.uniforms.uTime.value = t;
    if (points) points.rotation.y = t * 0.012;
    for (let i = fx.length - 1; i >= 0; i--) if (!fx[i].update(dt, t)) fx.splice(i, 1);
    // camera: smooth pursuit + a little shake on impacts
    const k = 1 - Math.exp(-dt * cam.speed);
    cam.pos.lerp(cam.goalPos, k); cam.look.lerp(cam.goalLook, k);
    cam.shake = Math.max(0, cam.shake - dt * 2.2);
    const sh = cam.shake * cam.shake * 0.25;
    camera.position.copy(cam.pos); if (sh) camera.position.x += (Math.random() - 0.5) * sh, camera.position.y += (Math.random() - 0.5) * sh;
    camera.lookAt(cam.look);
    renderer.render(scene, camera);
    frameTimes.push(dt * 1000); if (frameTimes.length > 120) frameTimes.shift();
  }

  function resize(w, h) {
    W = w; H = h; portrait = h > w;
    const dpr = Math.min(TIERS[tier].dpr, window.devicePixelRatio || 1);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    refocus(false);
  }
  function setTier(t) { tier = Math.max(0, Math.min(2, t)); buildPoints(); resize(W, H); }

  return {
    layout, setMarks, setShips, hideShip, setGhost, hover, reticle, setPower, setBounty, miss, hit, fire, sink, eliminate,
    focus, pick, frame, resize, setTier,
    get tier() { return tier; },
    get focusUid() { return focusUid; },
    get fps() { return frameTimes.slice(); },
    onSweep(fn) { onSweep = fn; },
    camera: () => ({ pos: cam.pos.toArray().map(v => +v.toFixed(2)), look: cam.look.toArray().map(v => +v.toFixed(2)), focus: focusUid }),
    stats: () => ({ boards: boards.size, fx: fx.length, calls: renderer.info.render.calls, tris: renderer.info.render.triangles }),
    destroy() {
      for (const uid of [...boards.keys()]) removeBoard(uid);
      for (const d of disposables) d.dispose();
      if (points) { points.geometry.dispose(); points.material.dispose(); }
      glow.dispose();
      renderer.dispose();
      try { renderer.forceContextLoss(); } catch { /* fine */ }
    },
  };
}
