// FREEFALL — THE GRAYBOX (F1 — docs/freefall.md "THE LAB"): the engine drawn in flat-shaded shapes on three.js 0.160 (the page's import
// map) — NO ART, no sounds: the pillar, ring floors of 12 slices (the gaps open, RED clearly red AND standing proud of the floor), the ball at the front. THE CAMERA looks
// down the shaft from in front of the ball: the ball about 30 % from the top of the screen, 4–5 floors in sight below it. A floor the ball
// has passed is gone (nothing ever hangs between the camera and the ball). The looks: F2.
// VIEW ONLY: it reads the run + its EVENTS (engine.js) and eases the ball between two landings itself — the rules never read the frame clock.
import * as THREE from 'three';
import { TURN, SLICES, GAP, RED } from './tuning.js';
import { buildFloor, sliceStart, sliceUnder } from './tower-gen.js';

const BG = 0x07060b;
/** the world: a floor every H down the shaft; the ring from the pillar (RI) out to RO; the ball rides at RB, R_BALL wide */
export const SHAPE = Object.freeze({ H: 1, RO: 1, RI: 0.3, RB: 0.66, R_BALL: 0.14, THICK: 0.1, HOP: 0.42 });
/** THE CAMERA: in front of the ball (the +Z side), `pitch`° down, a `fov`° lens; `ballY` = where the ball's floor sits on the screen (0 = the top); on a wide screen the tower is framed as on a phone-shaped column */
export const CAM = Object.freeze({ fov: 46, pitch: 33, fill: 0.8, ballY: 0.34, aspectMax: 0.47 });
const BELOW = 8;                // the floors drawn under the ball's
const RAD = Math.PI / 180, UNIT = 2 * Math.PI / TURN;
const COL = Object.freeze({ safeA: 0x8b90a4, safeB: 0x6d7286, red: 0xff2a3d, pillar: 0x2b2e3a, ball: 0xf4f2ff, blaze: 0xffb020, out: 0xff2a3d, gone: 0x5a5f72, dim: 0x2a2c36 });
/** RED IS NEVER RED BY COLOUR ALONE (the reviewer's find — its brightness is the greys'): a red slice stands this much PROUD of the floor */
const RED_RISE = 0.07;

export function createGraybox(host) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(dpr);
  const el = renderer.domElement;
  el.className = 'ff-canvas';
  host.append(el);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 7, 15);
  const cam = new THREE.PerspectiveCamera(CAM.fov, 1, 0.5, 60);
  scene.add(new THREE.AmbientLight(0xffffff, 1.5));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  scene.add(sun, sun.target);

  // THE TOWER turns as ONE group (the rules' angle A, a whole number of units); everything in it is laid in the floors' own angles
  const tower = new THREE.Group();
  scene.add(tower);
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(SHAPE.RI, SHAPE.RI, 40, 24, 1, true), new THREE.MeshLambertMaterial({ color: COL.pillar }));
  tower.add(pillar);
  // a slice = a wedge of the ring (a hair narrower than its 30°: the slices read apart) — ONE instanced mesh for every solid slice in sight
  const wedge = new THREE.CylinderGeometry(SHAPE.RO, SHAPE.RO, SHAPE.THICK, 6, 1, false, 0.012, (2 * Math.PI) / SLICES - 0.024);
  const slices = new THREE.InstancedMesh(wedge, new THREE.MeshLambertMaterial({ color: 0xffffff }), (BELOW + 1) * SLICES);
  slices.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  slices.frustumCulled = false; slices.count = 0;
  const C = new THREE.Color();
  slices.setColorAt(0, C.set(0xffffff));
  tower.add(slices);
  // the ball: at the FRONT (the rules' fixed angle 0 = +Z here), never turning with the tower
  const ballMat = new THREE.MeshLambertMaterial({ color: COL.ball });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(SHAPE.R_BALL, 20, 14), ballMat);
  scene.add(ball);
  // … and its SHADOW on the slice under it (which slice the ball is over reads at a glance; none over a gap)
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(SHAPE.R_BALL * 0.95, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  scene.add(shadow);

  const P = new THREE.Vector3(), S = new THREE.Vector3(1, 1, 1), Q = new THREE.Quaternion(), M = new THREE.Matrix4(), Y = new THREE.Vector3(0, 1, 0), V = new THREE.Vector3();
  // ---- the floors in sight (built once each — buildFloor is pure) + the slices THE BLAZE broke
  let seed = '', floors = new Map(), broken = new Map(), laidFrom = -1, laidKey = '';
  const floorOf = i => { let f = floors.get(i); if (!f) { f = buildFloor(seed, i); floors.set(i, f); if (floors.size > 40) for (const k of floors.keys()) { if (k < i - 12) floors.delete(k); } } return f; };
  function lay(from, dark) {
    const key = `${from}|${dark}|${broken.size}`;
    if (key === laidKey) return;
    laidKey = key; laidFrom = from;
    let n = 0;
    for (let i = from; i <= from + BELOW; i++) {
      const f = floorOf(i), gone = broken.get(i) || 0;
      for (let s = 0; s < SLICES; s++) {
        const kind = f.slices[s];
        if (kind === GAP || ((gone >> s) & 1)) continue;
        Q.setFromAxisAngle(Y, (sliceStart(s) + f.twist) * UNIT);
        // (a red slice is a taller block: its top RED_RISE above the floor — a shape, not only a colour)
        const rise = kind === RED ? RED_RISE : 0;
        P.set(0, -i * SHAPE.H - SHAPE.THICK / 2 + rise / 2, 0);
        S.set(1, (SHAPE.THICK + rise) / SHAPE.THICK, 1);
        M.compose(P, Q, S);
        slices.setMatrixAt(n, M);
        slices.setColorAt(n, C.set(i <= dark ? COL.dim : kind === RED ? COL.red : s & 1 ? COL.safeA : COL.safeB));
        n++;
      }
    }
    slices.count = n; slices.instanceMatrix.needsUpdate = true; slices.instanceColor.needsUpdate = true;
  }

  let camY = 0, state = 'live', lit = false;
  function reset(run) {
    seed = run.seed; floors = new Map(); broken = new Map(); laidKey = ''; camY = 0; state = 'live'; lit = false;
    ballMat.color.set(COL.ball);
    lay(0, run.dk);
  }
  /** the run's EVENTS since the last frame, in order (engine.js) */
  function feed(events) {
    for (const e of events) {
      if (e.e === 'shatter') broken.set(e.floor, (broken.get(e.floor) || 0) | (1 << e.slice));
      else if (e.e === 'blaze') lit = true;
      else if (e.e === 'out') state = e.cause;
      else if (e.e === 'made' || e.e === 'cap') state = e.e;
      if (e.e === 'shatter' || e.e === 'bounce') lit = false;
    }
  }

  let w = 0, h = 0, dist = 6, ppr = 100;
  const cp = Math.cos(CAM.pitch * RAD), sp = Math.sin(CAM.pitch * RAD);
  function place() {
    // the camera looks at a point `look` below the ball's floor so that floor sits CAM.ballY down the screen
    // (the ball's floor is `drop` above the point looked at: its height on the screen n = 1 − 2 × ballY = drop × cos / ((dist − drop × sin) × tan(fov / 2)))
    const n = 1 - 2 * CAM.ballY, t = Math.tan(CAM.fov * RAD / 2), drop = n * t * dist / (cp + n * t * sp);
    const lookY = -camY * SHAPE.H - drop;
    cam.position.set(0, lookY + dist * sp, SHAPE.RB + dist * cp);
    cam.lookAt(0, lookY, SHAPE.RB);
    sun.position.set(-2.5, cam.position.y + 4, cam.position.z + 2); sun.target.position.set(0, lookY, 0);
    pillar.position.y = lookY;
  }
  function resize() {
    const nw = host.clientWidth, nh = host.clientHeight;
    if (!nw || !nh || (nw === w && nh === h)) return;
    w = nw; h = nh;
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    // THE RING ≈ CAM.fill OF THE SCREEN WIDTH (on a wide screen: of a phone-shaped column in its middle)
    const a = Math.min(cam.aspect, CAM.aspectMax);
    dist = SHAPE.RO / (CAM.fill * a * Math.tan(CAM.fov * RAD / 2));
    cam.updateProjectionMatrix();
    place(); cam.updateMatrixWorld();
    // the screen pixels ONE RADIAN of tower turn moves the ring under the ball (the drag's 1 : 1)
    V.set(0, -camY * SHAPE.H, SHAPE.RB).project(cam); const x0 = V.x;
    V.set(0.05, -camY * SHAPE.H, SHAPE.RB).project(cam);
    ppr = Math.abs(V.x - x0) * w / 2 / 0.05 * SHAPE.RB;
  }
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  /** the ball's height over its floor's top (world units) at `tau` ticks — the VIEW's own arc between the landings the engine gave */
  function ballY(run, tau) {
    const span = run.nl - run.pl, u = span > 0 ? Math.min(1, Math.max(0, (tau - run.pl) / span)) : 1;
    if (run.st !== 'live') return run.cause === 'red' || run.st === 'made' ? 0 : SHAPE.HOP * 0.5;
    if (run.fl === 'bounce') return SHAPE.HOP * 4 * u * (1 - u);
    // a fall (or the drop in): from the floor above — one H up — down to this one, speeding up
    return SHAPE.H * (1 - u) * (1 - 0.45 * u);
  }

  /** one frame: the run, `tau` = the clock in ticks (a fraction into the next one), `dt` ms since the last frame */
  function draw(run, tau, dt) {
    const k = dt >= 1000 ? 1 : 1 - Math.exp(-dt / 110);
    // the camera follows the ball's FLOOR (never its bounce); in a fall it glides down with the ball
    const span = run.nl - run.pl, u = run.st === 'live' && run.fl !== 'bounce' && span > 0 ? Math.min(1, Math.max(0, (tau - run.pl) / span)) : 1;
    const want = run.floor - (1 - u);
    camY += (want - camY) * k;
    place();
    tower.rotation.y = run.a * UNIT;
    lay(run.floor, run.dk);
    const y = -run.floor * SHAPE.H + SHAPE.R_BALL + ballY(run, tau);
    ball.position.set(0, y, SHAPE.RB);
    const f = floorOf(run.floor), su = sliceUnder(run.a, f.twist);
    shadow.visible = f.slices[su] !== GAP && !(((broken.get(run.floor) || 0) >> su) & 1);
    shadow.position.set(0, -run.floor * SHAPE.H + 0.006, SHAPE.RB);
    ballMat.color.set(state === 'red' ? COL.out : state === 'dark' ? COL.gone : (run.blaze || lit) && run.st === 'live' ? COL.blaze : COL.ball);
    renderer.render(scene, cam);
  }

  return {
    el, reset, feed, draw, resize,
    /** the screen pixels one RADIAN of tower turn moves the ring under the ball — the drag's 1 : 1 */
    pxPerRad: () => ppr,
    /** a world point (x, y in world units, z) → [x, y] on the screen, 0 … 1 from the top left */
    project(x, y, z) { V.set(x, y, z).project(cam); return [(1 + V.x) / 2, (1 - V.y) / 2]; },
    /** where things are on the screen — the lab's own check: the ball (its centre + its size in px), its floor's line, the floors in sight under it */
    frame(run) {
      cam.updateMatrixWorld();
      const c = this.project(ball.position.x, ball.position.y, ball.position.z), top = this.project(0, ball.position.y + SHAPE.R_BALL, SHAPE.RB), bot = this.project(0, ball.position.y - SHAPE.R_BALL, SHAPE.RB);
      const edge = this.project(SHAPE.R_BALL, ball.position.y, SHAPE.RB);
      const rows = [];
      for (let i = 0; i <= BELOW; i++) rows.push(this.project(0, -(run.floor + i) * SHAPE.H, SHAPE.RO)[1]);
      const ringL = this.project(-SHAPE.RO, -run.floor * SHAPE.H, 0), ringR = this.project(SHAPE.RO, -run.floor * SHAPE.H, 0);
      return { ball: { x: c[0] * w, y: c[1] * h, d: Math.max(Math.abs(bot[1] - top[1]) * h, Math.abs(edge[0] - c[0]) * w * 2) }, floorY: this.project(0, -run.floor * SHAPE.H, SHAPE.RB)[1], rows, ring: [ringL[0], ringR[0]], w, h };
    },
    /** the screen y (0 … 1) of the TOP of the ball at the top of a bounce on its floor — the HUD must end above it */
    apexY(run) { cam.updateMatrixWorld(); return this.project(0, -run.floor * SHAPE.H + 2 * SHAPE.R_BALL + SHAPE.HOP, SHAPE.RB)[1]; },
    info: () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles, dpr, w, h, dist, slices: slices.count, from: laidFrom }),
    destroy() {
      ro.disconnect();
      scene.remove(tower, ball, shadow);
      shadow.geometry.dispose(); shadow.material.dispose();
      pillar.geometry.dispose(); pillar.material.dispose(); wedge.dispose(); slices.material.dispose(); ball.geometry.dispose(); ballMat.dispose();
      renderer.dispose();
      try { renderer.forceContextLoss(); } catch { /* fine */ }
      el.remove();
    },
  };
}
