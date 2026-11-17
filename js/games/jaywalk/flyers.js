// JAYWALK — THE BIG MOMENTS (H6A — docs/jaywalk.md "THE BLACKBIRD" · "THE UFO" · "THE MOTHERSHIP"): the game's three showpieces — VIEW +
// SOUND around the rules' existing ticks (course.js#pulseAt · ufoX / ufoY · MODES.cap). Nothing here is a rule: the engine, the replay
// and the server never import it (tests/jaywalk-night.test.mjs). FETCHED ON DEMAND (night.js#flyGet — out of the cartridge's eager
// graph: THE PER-GAME BUDGET is full): the module when a flight path / a UFO's zone first comes into the window or a capped run starts;
// each MODEL when its own moment nears (assets/jaywalk/models/ — re-packed by scripts/build-jaywalk-assets.py: blackbird.glb — Kiiba's
// Sr-71, CC BY 4.0 · ufo.glb + mothership.glb — Poly by Google's Flying saucers, CC BY 3.0; the credits: CREDITS.md + ui/credits.js);
// each SOUND from the city's own, already-credited set (audio/city/).
//   · THE BLACKBIRD — every number a pure function of `u` (the ticks into the flight path's lap): the tell's last 0.5 s = a GLINT + an
//     afterburner flare at the screen edge it comes from (inside the tell: the ≥ 1.5 s warning is never shortened); the pass = the real
//     SR-71 low across the band, two blue-white afterburners + their shock diamonds, the vapor ring it punches through, the shockwave ring
//     on the ground, a white flash on the band, two fading contrails, a tiny screen shake (≤ 4 px, ≤ 200 ms — none with reduce motion);
//     the radio crackle at the tell, the jet scream timed to peak on the pass, the sonic boom on it. By day: a black jet, its shadow
//     sweeping the lanes, heat shimmer behind the burners.
//   · THE UFO — the saucer drifts on the rules' path, HIGH (it goes see-through while it would cover the kid), spinning, its rim lights
//     chasing; its beam circle on the ground = a bright GREEN ring (never blue — blue on the ground = water) that pulses, a faint beam
//     down to it (pale green + drifting motes by day); a soft hum that rises as it nears. THE ABDUCTION (≈ 2 s, the rules' hit tick
//     unchanged): the kid freezes mid-step → the circle flares → a bright beam slams down → he floats up spinning + shrinking into the
//     saucer → its lights pulse → it zips off → the beam snaps out.
//   · THE MOTHERSHIP (a capped run: a match / the daily — never solo) = A FINISH LINE: THE WARNING (the cap − 10 s: a red pulsing
//     "THE MOTHERSHIP · 0:10", a giant soft shadow sliding down the road, the skyline darkening, a deep hum + a rumble building), then
//     THE ARRIVAL: the colossal ship comes down over the top third (the model BAKED ONCE into a sprite through the scene's own renderer —
//     the skyline band is DOM over the canvas, so the ship stands over it), its underside a vast ring of lights, ONE huge white-gold beam
//     over the whole road; every kid still in lifts up glowing in their colour.
import * as THREE from 'three';
import { FP, COLS, TICK_HZ } from './tuning.js';
import { pulseLeft, ufoX, ufoY } from './course.js';
import { parseGlb, MODEL_REV } from './models.js';
import { getContext, getSfxBus, isUnlocked } from '../../audio/engine.js';
import { ctx2d } from '../../ui/canvas-safe.js';

const MODELS = new URL('../../../assets/jaywalk/models/', import.meta.url), AUDIO = new URL('../../../audio/city/', import.meta.url);
const X = c => c - COLS / 2, Z = l => -l;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v), ease = t => t * t * (3 - 2 * t), easeOut = t => 1 - (1 - t) * (1 - t) * (1 - t);
/** THE NUMBERS (view only — the tests read them) */
export const FLY = Object.freeze({
  jetLen: 3.7, jetY: 1.15, jetLead: 16,          // (the SR-71: cells long — the rules' body is 3 —, how low it flies, the ticks it is drawn before + after its pass)
  glint: 30,                                     // (the tell's LAST 30 ticks = 0.5 s: the glint + the flare at the edge it comes from)
  shake: 0.075, shakeFrom: 5, shakeTicks: 12,    // (cells — ≈ 3.7 px at ZOOM 8 on a 390 pt phone; 12 ticks = 200 ms)
  ring: [6, 40], flash: [5, 10], trail: 46,      // (the shock ring: born 6 ticks into the pass, 40 ticks long · the band's white flash · the contrails' life)
  ufoY: 4.7, ufoD: 3.0,                          // (the saucer: how high, how wide — its beam circle is 2.5 cells across)
  abductMs: 2000,                                // (THE ABDUCTION, start to end)
  warn: 10 * TICK_HZ, liftMs: 2600,              // (THE MOTHERSHIP's warning: the cap − 10 s · how long a kid takes to rise into it)
});
/** how long the scene is held on a run's end before the end screen may cover it (ms): the abduction + the lift are SEEN */
export const holdMs = run => (run.st === 'taken' ? 3400 : run.cause === 'ufo' ? FLY.abductMs + 250 : run.cause === 'blackbird' ? 1100 : 0);

// ---- THE SOUNDS: the city's own files, through the SHARED engine's SFX bus (the Effects slider, the toggle, THE ONE MUTE + THE CUT apply
// there). Audio is polish: locked, muted, a missing file → nothing plays, nothing throws.
const bytes = new Map(), bufs = new Map();
let bufCtx = null;
function sfetch(n) { if (!bytes.has(n)) bytes.set(n, fetch(new URL(`${n}.mp3`, AUDIO)).then(r => (r.ok ? r.arrayBuffer() : null)).catch(() => null)); return bytes.get(n); }
function sbuf(n) {
  const ctx = getContext();
  if (!ctx) return Promise.resolve(null);
  if (bufCtx !== ctx) { bufs.clear(); bufCtx = ctx; }
  if (!bufs.has(n)) bufs.set(n, sfetch(n).then(a => (a ? new Promise((res, rej) => { const q = ctx.decodeAudioData(a.slice(0), res, rej); if (q && q.catch) q.catch(rej); }) : null)).catch(() => null));
  return bufs.get(n);
}
const played = [];   // (the test hook: every sound asked for)
/** play `n` now → a handle { gain(v, s), stop(fadeS) } at once (it sounds as soon as its bytes are decoded — if it is still wanted) */
function play(n, { gain = 1, rate = 1, loop = false, at = 0, pan = 0 } = {}) {
  played.push(n); if (played.length > 80) played.shift();
  const H = { src: null, g: null, want: gain, dead: false,
    gain(v, s = 0.2) { H.want = v; try { if (H.g) H.g.gain.setTargetAtTime(v, getContext().currentTime, Math.max(0.01, s / 3)); } catch { /* silent */ } },
    stop(f = 0.25) { H.dead = true; try { if (H.src) { const c = getContext(), t = c.currentTime; H.g.gain.cancelScheduledValues(t); H.g.gain.setValueAtTime(H.g.gain.value, t); H.g.gain.linearRampToValueAtTime(0, t + f); H.src.stop(t + f + 0.03); } } catch { /* ended */ } } };
  try {
    if (!isUnlocked()) return H;
    const t0 = performance.now();
    sbuf(n).then(b => {
      const ctx = getContext();
      if (!b || H.dead || !ctx || ctx.state !== 'running' || (!loop && performance.now() - t0 > 400)) return;
      const src = ctx.createBufferSource(), g = ctx.createGain();
      src.buffer = b; src.playbackRate.value = rate; src.loop = loop;
      if (loop) { src.loopStart = 0.08; src.loopEnd = Math.max(0.2, b.duration - 0.08); }
      g.gain.value = loop ? 0 : H.want; if (loop) g.gain.setTargetAtTime(H.want, ctx.currentTime, 0.25);
      let tail = g;
      if (pan && ctx.createStereoPanner) { try { const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p); tail = p; } catch { tail = g; } }
      src.connect(g); tail.connect(getSfxBus() || ctx.destination);
      src.start(0, Math.min(at, Math.max(0, b.duration - 0.05)));
      H.src = src; H.g = g;
    }).catch(() => {});
  } catch { /* silent */ }
  return H;
}
/** THE MOTHERSHIP's low rumble: two seconds of brown noise under an 85 Hz low-pass, looped (made once — no file) */
function rumble() {
  const H = { src: null, g: null, gain(v) { try { if (H.g) H.g.gain.setTargetAtTime(v, getContext().currentTime, 0.2); } catch { /* silent */ } }, stop(f = 0.6) { try { if (H.src) { const c = getContext(), t = c.currentTime; H.g.gain.setTargetAtTime(0, t, f / 3); H.src.stop(t + f + 0.1); } } catch { /* ended */ } } };
  try {
    const ctx = getContext();
    if (!isUnlocked() || !ctx || ctx.state !== 'running') return H;
    const n = Math.floor(ctx.sampleRate * 2), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    let v = 0;
    for (let i = 0; i < n; i++) { v = (v + (Math.random() * 2 - 1) * 0.06) / 1.006; d[i] = v * 3.2; }
    for (let i = 0; i < 2000; i++) { const k = i / 2000; d[i] *= k; d[n - 1 - i] *= k; }   // (the loop's seam: both ends eased to nothing)
    const src = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = b; src.loop = true; lp.type = 'lowpass'; lp.frequency.value = 85; g.gain.value = 0;
    src.connect(lp); lp.connect(g); g.connect(getSfxBus() || ctx.destination); src.start();
    H.src = src; H.g = g;
  } catch { /* silent */ }
  return H;
}

/**
 * C = night.js's own: { renderer, scene, cam, host, K (its instanced light / shadow kinds), hazeAt(x, y, z), rewarm(), reduce }.
 * → the calls night.js#draw makes each frame: begin → jet · ufo (per lane) → abduct / lift / ship → end.
 */
export function createFlyers(C) {
  const { scene, cam, K, reduce } = C;
  let dead = false, day = false;
  const F = { t: 0, clock: 0, dt: 16, camX: 0, kx: 0, kz: 0, ky: 0, own: true, alive: true };
  const geo = {}, asked = {};
  function need(n) {
    if (asked[n]) return;
    asked[n] = 1;
    fetch(new URL(`${n}.glb?v=${MODEL_REV}`, MODELS)).then(r => (r.ok ? r.arrayBuffer() : null)).then(b => { if (b && !dead) { geo[n] = parseGlb(b); built(n); } }).catch(() => {});
  }
  const v3 = new THREE.Vector3();
  // THE BLACKBIRD: two of them at the very most in view (THE AIRFIELD has two bands) — one geometry, one material
  const jetMat = new THREE.MeshStandardMaterial({ vertexColors: true, color: 0xffffff, roughness: 0.36, metalness: 0.6, envMapIntensity: 1.5, side: THREE.DoubleSide });
  const jets = [];
  // THE UFO: chrome by day, cool steel by night — two in view at the most
  const ufoMat = () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.2, metalness: 0.85, envMapIntensity: 1.6, transparent: true });
  const ufos = [];
  const mk = (g, m) => { const o = new THREE.Mesh(g, m); o.visible = false; o.frustumCulled = false; scene.add(o); return o; };
  function built(n) {
    if (n === 'blackbird') for (let i = 0; i < 2; i++) { const m = mk(geo[n], jetMat); m.scale.setScalar(FLY.jetLen); m.rotation.order = 'YXZ'; jets.push(m); }
    if (n === 'ufo') for (let i = 0; i < 2; i++) { const m = mk(geo[n], ufoMat()); m.scale.setScalar(FLY.ufoD); m.rotation.order = 'YXZ'; ufos.push({ m, id: -1 }); }
    if (n === 'mothership') bakeAsk = true;
    C.rewarm();
  }
  let nj = 0, nu = 0, shakeNow = 0, humD = 99;
  // (the kid's own moments are asked for BEFORE night.js resets its instanced kinds for the frame: what they lay waits here)
  const pend = [], flush = () => { for (const f of pend) f(); pend.length = 0; };
  const snd = { bands: new Map(), hum: null, abd: 0, ship: null, rum: null, shipAt: -1 };
  // (THE BEDS — audio/engine.js: every LOOPING source stops AT ONCE when the page is left; back on screen the next frame starts what is still wanted)
  const offBed = (globalThis.__nsAudioBeds || (() => () => {}))({ pause() { for (const k of ['hum', 'ship', 'rum']) if (snd[k]) { snd[k].stop(0.02); snd[k] = null; } }, resume() {} });

  /** a frame begins: the world's tick, the frame clock, the look, the kid on screen (his world x / z, his lane), the camera's column */
  function begin(o) {
    Object.assign(F, o);
    if (o.day !== day) { day = o.day; jetMat.metalness = day ? 0.35 : 0.6; jetMat.roughness = day ? 0.42 : 0.36; jetMat.envMapIntensity = day ? 0.9 : 1.5; for (const q of ufos) { q.m.material.metalness = day ? 0.95 : 0.8; q.m.material.roughness = day ? 0.12 : 0.24; q.m.material.envMapIntensity = day ? 2.0 : 1.5; } }
    nj = 0; nu = 0; shakeNow = 0; humD = 99;
    if (bakeAsk && C.renderer) { bakeAsk = false; try { bakeShip(); } catch { ship.cv = null; } }
    flush();
  }
  const LF = (...a) => { if (!day) K.flat.put(...a); }, LB = (...a) => { if (!day) K.bill.put(...a); };

  // ------------------------------------------------------------------------------------------------ THE BLACKBIRD
  /** one flight band this frame: its pulse, `u` = the ticks into its lap (0 = the pass begins), the band's middle z, how lit it is */
  function jet(p, u, zc, lt) {
    need('blackbird'); sfetch('jet-scream'); sfetch('sonic-boom'); sfetch('radio-static_1');
    const dir = p.dir, left0 = p.period - u, tell = u >= p.period - p.tell, near = Math.abs(-zc - F.ky) < 10;
    // THE SOUNDS — this phone's own living kid's, the band on his screen: the radio crackle as the warning starts, the jet scream
    // (started so its peak lands on the pass), the sonic boom on it
    if (F.own && F.alive && near) {
      const k = Math.floor((F.t - p.phase) / p.period) + (tell ? 1 : 0), key = p.band, S = snd.bands.get(key) || { k: -1, s: 0 };
      if (S.k !== k) { S.k = k; S.s = 0; snd.bands.set(key, S); if (snd.bands.size > 6) snd.bands.delete(snd.bands.keys().next().value); }
      const pan = -dir * 0.6;
      if (tell && !(S.s & 1) && left0 > p.tell - 20) { S.s |= 1; play('radio-static_1', { gain: 0.5 }); play('jet-scream', { gain: 0.75, at: Math.max(0, 2.4 - left0 / TICK_HZ), pan }); }
      if (!(S.s & 2) && ((tell && left0 <= 14) || (!tell && u < 20))) { S.s |= 2; play('sonic-boom', { gain: 1, pan: pan * 0.5 }); }
    }
    // THE GLINT (the tell's last 0.5 s): a star that grows at the screen edge it comes from + the first blue of its burners
    if (tell && left0 <= FLY.glint) {
      const g = 1 - left0 / FLY.glint, ex = F.camX - dir * 3.45, tw = reduce ? 1 : 0.72 + 0.28 * Math.sin(F.clock / 34), a = Math.min(1, lt) * (0.55 + 0.45 * g) * tw;
      if (day) K.bill.put(ex, 0.7, zc, 3.0 + 3.0 * g, 2.2 + 2.0 * g, 1, 0, 0x0c1c3c, 1, 0, 0.5 * a);    // (in sunlight the glint stands on a dark halo)
      K.bill.put(ex, 0.7, zc, 3.0 + 4.2 * g, 2.3 + 3.0 * g, 1, 0, day ? 0x2f7fe0 : 0x4aa8ff, 1, 0, (day ? 0.5 : 0.7) * a);   // the afterburners' blue flare
      K.bill.put(ex, 0.7, zc, 1.6 + 4.6 * g, 0.2 + 0.14 * g, 1, 0, 0xffffff, 1, 0, a);                  // the star's long arm
      K.bill.put(ex, 0.7, zc, 0.19 + 0.12 * g, 1.1 + 2.9 * g, 1, 0, 0xffffff, 1, 0, a);                 // … its tall arm
      K.bill.put(ex, 0.7, zc, 0.5 + 0.6 * g, 0.5 + 0.6 * g, 1, 0, 0xffffff, 1, 5, a);                   // … its white-hot core
      LF(ex, 0.05, zc, 4.4, 1, 3.0, 0, 0x6ab8ff, 1, 0, 0.5 * a);
    }
    // THE PASS: the jet (drawn a little before + after it too — it is seen coming through the edge column)
    const s = u < p.pass + FLY.jetLead ? u : u > p.period - FLY.jetLead ? u - p.period : null;
    if (s !== null) {
      const len = p.len / FP, cx = X(pulseLeft(p, s) / FP + len / 2), M = jets[nj++], nx = cx - dir * 0.4 * FLY.jetLen, y = FLY.jetY;
      if (M) { M.visible = true; M.position.set(cx, y, zc); M.rotation.set(0, dir * Math.PI / 2, dir * 0.24); }
      K.shadow.put(cx, 0.03, zc, FLY.jetLen * 1.05, 1.4, 2.1, 0, 0, 1, 0, 0.85 * Math.min(1, lt));
      LF(cx, 0.045, zc, 5.4, 1, 3.0, 0, 0xffe2b0, 1, 0, 0.3 * lt);                                      // (the runway's own lights catch its belly)
      const fl = reduce ? 1 : 0.8 + 0.2 * Math.sin(F.clock / 17), ry = dir > 0 ? 0 : Math.PI;
      for (const e of [-0.43, 0.43]) {
        // THE AFTERBURNERS: a blue-white flame from each nozzle (a tapered ribbon, white-hot inside), its shock diamonds, the nozzle's ring
        K.flat.put(nx - dir * 1.9, y, zc + e, 3.8, 1, 1.05, ry, day ? 0x1f7fff : 0x3d9cff, 1, 1, fl * lt);
        K.flat.put(nx - dir * 1.3, y + 0.01, zc + e, 2.6, 1, 0.5, ry, 0xf2faff, 1, 1, fl * lt);
        for (let d = 0; d < 3; d++) K.bill.put(nx - dir * (0.55 + d * 0.6), y, zc + e, 0.4 - d * 0.08, 0.4 - d * 0.08, 1, 0, 0xffffff, 1, 5, (0.95 - d * 0.2) * fl * lt);
        K.bill.put(nx, y, zc + e, 0.8, 0.8, 1, 0, 0x9fd4ff, 1, 5, lt); LB(nx - dir * 0.8, y, zc + e, 3.2, 1.8, 1, 0, 0x4aa8ff, 1, 0, 0.6 * fl * lt);
        // (BY DAY: heat shimmer behind the burners — pale wavering ribbons, further back)
        if (day && !reduce) K.flat.put(nx - dir * (3.4 + 0.3 * Math.sin(F.clock / 23 + e * 9)), y, zc + e * (1.2 + 0.3 * Math.sin(F.clock / 31)), 3.2, 1, 0.9, ry, 0xffffff, 1, 1, 0.16);
      }
      // the vapor ring it punches through (it rides the jet's shoulders for the first ticks, swelling)
      if (s > 2 && s < 16) { const q = (s - 2) / 14; K.bill.put(cx - dir * 0.2, y, zc, 1.6 + 3.6 * q, 1.6 + 3.6 * q, 1, 0, 0xeaf6ff, 1, 3, (1 - q) * (day ? 0.8 : 0.9) * lt); }
    }
    if (tell) return;
    // AFTER IT: the contrails fading along the band, the shockwave ring on the ground, the white flash on the band, the shake
    if (u < FLY.trail) {
      const a = (1 - u / FLY.trail) * lt, end = X(pulseLeft(p, Math.min(u, p.pass + FLY.jetLead)) / FP + (dir > 0 ? 0 : p.len / FP)), start = X(dir > 0 ? -3.5 : COLS + 3.5), mid = (start + end) / 2, w = Math.abs(end - start);
      for (const e of [-0.43, 0.43]) { K.flat.put(mid, FLY.jetY - 0.02, zc + e, w, 1, 0.34 + 0.5 * (u / FLY.trail), 0, day ? 0xffffff : 0x9fd0ff, 1, 4, (day ? 0.55 : 0.6) * a); K.flat.put(mid, FLY.jetY - 0.01, zc + e, w, 1, 0.1, 0, 0xffffff, 1, 4, 0.8 * a); }
    }
    if (u >= FLY.ring[0] && u < FLY.ring[0] + FLY.ring[1]) {
      const q = (u - FLY.ring[0]) / FLY.ring[1], r = 0.9 + 6.6 * easeOut(q), a = Math.pow(1 - q, 1.4) * 0.62 * lt;
      K.flat.put(F.camX, 0.07, zc, r * 2.5, 1, r * 2.5 * 0.62, 0, 0xeaf6ff, 1, 3, a);
      if (q > 0.12) { const r2 = 0.9 + 6.6 * easeOut(q - 0.12); K.flat.put(F.camX, 0.068, zc, r2 * 2.5, 1, r2 * 2.5 * 0.62, 0, 0x8ec8ff, 1, 3, 0.6 * a); }
      if (day) K.shadow.raw(F.camX, 0.066, zc, r * 2.56, 1, r * 2.56 * 0.62, 0, 0, 1, 3, 0.4 * a);
    }
    if (u >= FLY.flash[0] && u < FLY.flash[0] + FLY.flash[1]) {
      const a = 1 - (u - FLY.flash[0]) / FLY.flash[1];
      K.flat.put(F.camX, 0.08, zc, 12.5, 1, 2.1, 0, 0xffffff, 1, 4, (day ? 0.5 : 0.42) * a * lt); LF(F.camX, 0.081, zc, 13, 1, 3.0, 0, 0xbfe2ff, 1, 0, 0.22 * a * lt);
    }
    if (!reduce && near && u >= FLY.shakeFrom && u < FLY.shakeFrom + FLY.shakeTicks) shakeNow = FLY.shake * (1 - (u - FLY.shakeFrom) / FLY.shakeTicks);
  }

  // ------------------------------------------------------------------------------------------------ THE UFO
  const abd = { on: false, id: -1, t0: 0, x: 0, z: 0, sx: 0, sz: 0 };
  /** a UFO over its zone this frame (once a UFO — night.js's lane loop): the saucer, its ring on the ground, the faint beam, the hum */
  function ufo(U, t, lt) {
    need('ufo'); sfetch('ufo-hum'); sfetch('ufo-beam-on'); sfetch('ufo-lift'); sfetch('ufo-depart'); sfetch('ufo-beam-off');
    const bx = X(ufoX(U, t) / FP), bz = Z(ufoY(U, t) / FP), r = U.r / FP, hz = 1 - C.hazeAt(bx, 0, bz), T = F.clock / 1000;
    const pu = reduce ? 0.85 : 0.75 + 0.25 * Math.sin(T * 5.2), taking = abd.on && abd.id === U.id, dim = taking ? 0.45 : 1;
    // THE RING ON THE GROUND — the rules' warning, ALWAYS where the rules have it: bright GREEN (never blue), pulsing; a second ring
    // closing in on its middle; a soft green pool inside. By day: green paint on a dark ring (it reads on a sunlit lane)
    if (day) K.shadow.raw(bx, 0.048, bz, r * 2.62, 1, r * 2.62, 0, 0, 1, 3, 0.5 * dim);
    K.flat.put(bx, 0.05, bz, r * 2.5, 1, r * 2.5, 0, day ? 0x10c654 : 0x3dff7a, 1, 3, (day ? 1 : 0.95) * pu * dim);
    LF(bx, 0.049, bz, r * 2.5, 1, r * 2.5, 0, 0x7dffb0, 1, 3, 0.5 * pu * dim);
    if (!reduce) { const q = (T * 0.9) % 1; K.flat.put(bx, 0.051, bz, r * 2.5 * (1 - 0.72 * q), 1, r * 2.5 * (1 - 0.72 * q), 0, day ? 0x10c654 : 0x8dffc0, 1, 3, 0.7 * (1 - q) * dim); }
    K.flat.put(bx, 0.045, bz, r * 2.2, 1, r * 2.2, 0, day ? 0x35e07a : 0x3dff9a, 1, 0, (day ? 0.32 : 0.4) * dim);
    if (hz < 0.02) return;
    // THE SAUCER, high over its ring: it spins + bobs; SEE-THROUGH while it would cover the kid on the screen
    const q = ufos[nu++], bob = reduce ? 0 : Math.sin(T * 1.7 + U.id) * 0.12;
    let sx = bx, sy = FLY.ufoY + bob, sz = bz, sc = 1, show = hz, pulse = 0;
    if (taking) { const A = abductAt(F.clock - abd.t0); sx = A.sx; sy = A.sy; sz = A.sz; sc = A.sc; show *= A.sa; pulse = A.pulse; }
    if (q) {
      v3.set(sx, sy, sz).project(cam); const ux = v3.x, uy = v3.y; v3.set(F.kx, 0.6, F.kz).project(cam);
      const over = taking ? 0 : clamp01(1.5 - Math.hypot((ux - v3.x) * 2.2, uy - v3.y) / 0.2);
      q.id = U.id; q.m.visible = show > 0.02; q.m.position.set(sx, sy, sz); q.m.rotation.set(reduce ? 0.08 : 0.1 * Math.sin(T * 1.3), reduce ? 0 : T * 0.9, reduce ? 0 : 0.07 * Math.cos(T * 1.1));
      q.m.scale.set(FLY.ufoD * sc, FLY.ufoD * (taking ? 1 / Math.sqrt(Math.max(0.3, sc)) : 1), FLY.ufoD * sc); q.m.material.opacity = show * (1 - 0.72 * over);
      // its rim lights (a chase round the rim) + the glow under its belly
      const a0 = reduce ? 0 : T * 0.9, R = FLY.ufoD * 0.47 * sc, la = show * (1 - 0.7 * over);
      for (let i = 0; i < 10; i++) {
        const a = a0 + i * Math.PI / 5, hot = pulse > 0 ? pulse : reduce ? 0.8 : 0.45 + 0.55 * Math.max(0, Math.sin(T * 6 - i * 1.26));
        K.bill.put(sx + Math.cos(a) * R, sy + 0.2 * sc, sz - Math.sin(a) * R * 0.92, 0.22 + 0.2 * hot, 0.22 + 0.2 * hot, 1, 0, i % 2 ? 0xffffff : 0x7dffb0, 1, 5, (0.5 + 0.5 * hot) * la);
      }
      K.bill.put(sx, sy - 0.05, sz, 2.4 * sc, 0.9, 1, 0, day ? 0xc8ffe0 : 0x7dffc0, 1, 0, (day ? 0.5 : 0.75) * (0.7 + 0.3 * pu + pulse) * la);
      K.shadow.put(bx, 0.03, bz, 2.4, 1, 1.8, 0, 0, 1, 0, day ? 0.3 * hz : 0);
    }
    // the faint beam from its belly to its ring (it never hides the lane: thin by night, a pale-green column + drifting motes by day)
    if (!taking) {
      K.bill.put(bx, FLY.ufoY / 2, bz, r * 2.1, FLY.ufoY, 1, 0, day ? 0xa8f5c8 : 0x4dff9a, 1, 9, (day ? 0.3 : 0.2) * (0.8 + 0.2 * pu) * hz);
      if (day && !reduce) for (let i = 0; i < 5; i++) { const m = (T * 0.35 + i / 5) % 1; K.bill.put(bx + Math.sin(i * 2.4 + T) * r * 0.5 * (1 - m * 0.5), 0.2 + m * (FLY.ufoY - 0.6), bz, 0.14, 0.14, 1, 0, 0xffffff, 1, 0, Math.sin(m * Math.PI) * 0.8 * hz); }
    }
    humD = Math.min(humD, Math.hypot(bx - F.kx, bz - F.kz));
  }
  /** THE ABDUCTION's own clock (ms since the hit) → where the saucer is (it locks on over him, pulses, zips off), the beam, the kid */
  function abductAt(e) {
    const lock = ease(clamp01(e / 220)), go = clamp01((e - 1650) / 260), back = clamp01((e - FLY.abductMs - 300) / 500);
    const sx = abd.sx + (abd.x - abd.sx) * lock, sz = abd.sz + (abd.z - abd.sz) * lock;
    return {
      sx: sx + go * go * 5, sy: FLY.ufoY - 0.5 * lock + go * go * 16, sz: sz - go * go * 11, sc: 1 + 0.25 * go, sa: back > 0 ? back : 1 - go,
      pulse: e > 1250 && e < 1700 ? 0.6 + 0.4 * Math.sin((e - 1250) / 24) : 0,
      beam: clamp01((e - 160) / 110) * (1 - clamp01((e - 1850) / 130)),                 // slams down · snaps out
      flare: 1 - clamp01(Math.abs(e - 150) / 170),                                      // the circle flares as it locks on
      rise: ease(clamp01((e - 380) / 1150)),                                            // the kid: up, spinning, shrinking
    };
  }
  /**
   * the kid THE UFO took (the view's own reading of the hit — night.js): `e` ms since it, where he stood (world x / z), the UFO, the
   * world's tick → how he is drawn: { y, spin, s (his size), show } — and the beam + the flare are laid here. null = not loaded yet.
   */
  function abduct(e, x, z, U, t, hex) {
    if (!U) return null;
    if (!abd.on || abd.id !== U.id || e < F.dt * 1.5) {
      abd.on = true; abd.id = U.id; abd.t0 = F.clock - e; abd.x = x; abd.z = z; abd.sx = X(ufoX(U, t) / FP); abd.sz = Z(ufoY(U, t) / FP);
      if (F.own && e < 400 && snd.abd !== abd.t0) { snd.abd = abd.t0; play('ufo-beam-on', { gain: 0.7, at: 3.0 }); play('ufo-lift', { gain: 0.6, at: 3.4 }); setTimeout(() => { if (!dead) { play('ufo-depart', { gain: 0.7, at: 1.5 }); play('ufo-beam-off', { gain: 0.6, at: 1.1 }); } }, 1350); }
    }
    const A = abductAt(e), top = A.sy - 0.2, by = top * A.rise;
    pend.push(() => {
      beam(x, z, top, A.beam, A.flare, 0x7dffb0, 0xeafff2, 1.25);
      // (he glows as he goes: a halo of his colour, brighter toward the top)
      if (A.rise < 1) K.bill.put(x, by + 0.5, z, 1.5 - 0.9 * A.rise, 1.7 - 1.0 * A.rise, 1, 0, hex, 1, 0, (0.35 + 0.5 * A.rise) * A.beam);
    });
    return { y: by, spin: reduce ? 0 : e * 0.011 * (0.4 + A.rise), s: 1 - 0.86 * A.rise, show: A.rise < 0.995 && e < 1800 };
  }
  /** a beam standing on the ground at (x, z) up to `top`: `k` 0 … 1 = how far it has come down / how open it is; `fl` = the ground's flare */
  function beam(x, z, top, k, fl, hex, core, r) {
    if (k > 0.004) {
      const h = top * Math.min(1, k * 1.15), y = top - h / 2, a = day ? 0.62 : 0.85;
      K.bill.put(x, y, z, r * 2.5 * (0.35 + 0.65 * k), h, 1, 0, hex, 1, 9, a * k);
      K.bill.put(x, y, z, r * 1.0 * k, h, 1, 0, core, 1, 9, 0.4 * a * k);
      K.flat.put(x, 0.055, z, r * 2.6, 1, r * 2.6, 0, core, 1, 0, 0.32 * k); K.flat.put(x, 0.056, z, r * 2.5, 1, r * 2.5, 0, hex, 1, 3, k);
      if (!reduce) for (let i = 0; i < 6; i++) { const m = (F.clock / 700 + i / 6) % 1; K.bill.put(x + Math.sin(i * 2.4) * r * 0.55 * (1 - m * 0.6), m * top, z, 0.13, 0.13, 1, 0, 0xffffff, 1, 0, Math.sin(m * Math.PI) * k); }
    }
    if (fl > 0.004) { K.flat.put(x, 0.057, z, r * 2.5 * (1 + 0.5 * fl), 1, r * 2.5 * (1 + 0.5 * fl), 0, 0xffffff, 1, 3, fl); K.flat.put(x, 0.054, z, r * 4, 1, r * 4, 0, hex, 1, 0, 0.7 * fl); }
  }
  /** a GHOST going up (night.js's ghost loop): a smaller beam of the moment's own colour under them, their colour's halo round them */
  function lift(x, y, z, q, hex, ship) {
    pend.push(() => {
      if (!ship) beam(x, z, FLY.ufoY, Math.sin(Math.min(1, q * 1.3) * Math.PI) * 0.9, 0, 0x7dffb0, 0xeafff2, 0.8);
      K.bill.put(x, y + 0.5, z, 1.9, 2.1, 1, 0, hex, 1, 0, 0.8 * (1 - q * 0.5));
      if (ship) { K.flat.put(x, 0.06, z, 2.2, 1, 1.8, 0, hex, 1, 3, 0.9 * (1 - q)); K.bill.put(x, y + 0.5, z, 0.7, 0.8, 1, 0, 0xffffff, 1, 5, 0.55 * (1 - q * 0.5)); }
    });
  }

  // ------------------------------------------------------------------------------------------------ THE MOTHERSHIP
  // THE SHIP = the model BAKED ONCE into a sprite (the scene's own renderer → a render target → a 2D canvas): the skyline band is DOM
  // over the 3D canvas, and the ship must stand over it. Its underside's lights are drawn on the bake (projected through the bake's own
  // camera), a second small canvas of the brightest ones shimmers over it (opacity only).
  const ship = { el: null, cv: null, glow: null, dim: null, wash: null, txt: null, key: '', sec: -1, on: false };
  let bakeAsk = false;
  const SHIP_W = 1408, SHIP_H = 768;
  function bakeShip() {
    const R = C.renderer, rt = new THREE.WebGLRenderTarget(SHIP_W, SHIP_H, { samples: 4 }), sc = new THREE.Scene(), cm = new THREE.PerspectiveCamera(13.6, SHIP_W / SHIP_H, 0.1, 30);
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, color: 0xd2d8ec, roughness: 0.42, metalness: 0.45, envMapIntensity: 1.0 });
    const m = new THREE.Mesh(geo.mothership, mat); m.rotation.y = 0.26;
    const hemi = new THREE.HemisphereLight(0x6a7ab0, 0xffe2b0, 2.6), key = new THREE.DirectionalLight(0xffecc8, 4.6), rim = new THREE.DirectionalLight(0x8fb4ff, 2.6);
    key.position.set(0.2, -2.2, 1.4); rim.position.set(-1.5, 1.2, -1.5);
    sc.add(m, hemi, key, rim); sc.environment = scene.environment;
    cm.position.set(0, -0.9, 2.3); cm.lookAt(0, 0.1, 0); cm.updateMatrixWorld(); cm.updateProjectionMatrix();
    const col = new THREE.Color(), alpha = R.getClearAlpha(); R.getClearColor(col);
    R.setRenderTarget(rt); R.setClearColor(0x000000, 0); R.clear(); R.render(sc, cm);
    const px = new Uint8Array(SHIP_W * SHIP_H * 4); R.readRenderTargetPixels(rt, 0, 0, SHIP_W, SHIP_H, px);
    R.setRenderTarget(null); R.setClearColor(col, alpha); rt.dispose(); mat.dispose();
    const cv = document.createElement('canvas'); cv.width = SHIP_W; cv.height = SHIP_H; cv.className = 'jw-ship-hull';
    const c = ctx2d(cv); if (!c) return;
    const img = c.createImageData(SHIP_W, SHIP_H), o = img.data, lut = new Uint8Array(256);
    for (let i = 0; i < 256; i++) { const v = i / 255; lut[i] = Math.round(255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055)); }
    for (let y = 0; y < SHIP_H; y++) { const s = (SHIP_H - 1 - y) * SHIP_W * 4, d = y * SHIP_W * 4; for (let x = 0; x < SHIP_W * 4; x += 4) { const a = px[s + x + 3]; if (!a) continue; const k = 255 / a; o[d + x] = lut[Math.min(255, px[s + x] * k) | 0]; o[d + x + 1] = lut[Math.min(255, px[s + x + 1] * k) | 0]; o[d + x + 2] = lut[Math.min(255, px[s + x + 2] * k) | 0]; o[d + x + 3] = a; } }
    c.putImageData(img, 0, 0);
    // ITS LIGHTS: rings of warm dashes round the underside (each a soft blob stretched along the ring), the white-gold lens in its middle
    const gv = document.createElement('canvas'); gv.width = SHIP_W / 2; gv.height = SHIP_H / 2; gv.className = 'jw-ship-glow';
    const g = ctx2d(gv), P = (r, y, a) => { v3.set(Math.cos(a) * r, y, Math.sin(a) * r).project(cm); return [(1 + v3.x) / 2 * SHIP_W, (1 - v3.y) / 2 * SHIP_H]; };
    const blob = (q, x, y, rx, ry, ang, rgb, al) => { q.save(); q.translate(x, y); q.rotate(ang); q.scale(rx, ry); const gr = q.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, `rgba(${rgb},${al})`); gr.addColorStop(0.45, `rgba(${rgb},${al * 0.55})`); gr.addColorStop(1, `rgba(${rgb},0)`); q.fillStyle = gr; q.beginPath(); q.arc(0, 0, 1, 0, 7); q.fill(); q.restore(); };
    c.globalCompositeOperation = 'lighter'; if (g) { g.scale(0.5, 0.5); g.globalCompositeOperation = 'lighter'; }
    const ring = (r, y, n, len, w, rgb, al) => { for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + 0.1, [x, yy] = P(r, y, a), [x2, y2] = P(r, y, a + 0.02), ang = Math.atan2(y2 - yy, x2 - x), near = 0.55 + 0.45 * Math.sin(a); blob(c, x, yy, len * near, w * near, ang, rgb, al * 0.8); blob(c, x, yy, len * 0.5 * near, w * 0.5 * near, ang, '255,255,255', al); if (g && i % 2) blob(g, x, yy, len * 1.9 * near, w * 2.4 * near, ang, rgb, al); } };
    ring(0.455, 0.07, 40, 15, 5.5, '255,214,140', 0.95); ring(0.325, 0.045, 28, 13, 5, '255,226,170', 0.9); ring(0.2, 0.03, 18, 10, 4.5, '255,236,200', 0.9);
    { const [x, y] = P(0, 0, 0), [x1] = P(0.105, 0.005, 0), [, y1] = P(0.105, 0.005, Math.PI / 2), rx = Math.abs(x1 - x), ry = Math.max(8, Math.abs(y1 - y)); blob(c, x, y, rx * 1.5, ry * 1.5, 0, '255,244,214', 1); blob(c, x, y, rx * 0.8, ry * 0.8, 0, '255,255,255', 1); if (g) blob(g, x, y, rx * 3.4, ry * 4.2, 0, '255,232,180', 0.9); }
    const el = document.createElement('div'); el.className = 'jw-ship'; el.setAttribute('aria-hidden', 'true'); el.append(cv); if (g) el.append(gv);
    C.host.append(el); ship.el = el; ship.cv = cv; ship.glow = g ? gv : null;
  }
  function shipDom() {
    if (ship.dim) return;
    const mk2 = cls => { const e = document.createElement('div'); e.className = cls; e.setAttribute('aria-hidden', 'true'); C.host.append(e); return e; };
    ship.dim = mk2('jw-ship-dim'); ship.wash = mk2('jw-ship-wash'); ship.txt = mk2('jw-ship-t'); ship.txt.removeAttribute('aria-hidden'); ship.txt.setAttribute('role', 'status');
  }
  const set = (el, k, v) => { if (el && el.dataset[k] !== v) { el.dataset[k] = v; if (k === 'o') el.style.opacity = v; else el.style.transform = v; } };
  /**
   * THE MOTHERSHIP this frame: `t` = the world's tick, `cap` = its tick (0 = never — solo), `after` = ms since the kid on screen was
   * taken (−1 = not yet). The warning from the cap − 10 s; the arrival from the cap.
   */
  function shipAt(t, cap, after, lt) {
    if (cap) need('mothership');   // (… and its bake: in the run's first frames — the count — never at the warning)
    const w = cap ? clamp01((t - (cap - FLY.warn)) / FLY.warn) : 0, arr = after >= 0 ? after : cap && t >= cap ? (t - cap) * 1000 / TICK_HZ : -1;
    if (!cap || (w <= 0 && arr < 0)) { if (ship.on) shipOff(); return; }
    sfetch('ufo-hum'); sfetch('ufo-beam-on'); sfetch('ufo-lift');
    shipDom(); ship.on = true;
    const down = arr >= 0 ? easeOut(clamp01(arr / 700)) : 0, peek = ease(clamp01((w - 0.7) / 0.3)), b0 = arr >= 0 ? ease(clamp01((arr - 380) / 420)) : 0;
    // the words: THE MOTHERSHIP · 0:10 — red, pulsing (the css); gone as it arrives
    const sec = Math.max(0, Math.ceil((cap - t) / TICK_HZ));
    if (sec !== ship.sec) { ship.sec = sec; ship.txt.textContent = arr >= 0 ? '' : `THE MOTHERSHIP · 0:${String(sec).padStart(2, '0')}`; }
    set(ship.txt, 'o', arr >= 0 ? '0' : '1'); ship.txt.classList.toggle('is-still', reduce);
    // the skyline darkens under it; the giant soft shadow slides down the road toward him
    set(ship.dim, 'o', (0.62 * Math.max(w, down)).toFixed(2));
    const sh = arr >= 0 ? 1 : w, sz = F.kz - 16 + 13.5 * ease(sh);
    K.shadow.raw(F.camX, 0.09, sz, 32, 1, 18, 0, 0, 1, 0, (day ? 0.72 : 0.8) * (0.3 + 0.7 * sh) * (1 - 0.5 * b0) * Math.min(1, lt));
    // THE SHIP: its rim peeks over the top in the warning's last 3 s, then it comes down over the top third
    if (ship.el) {
      const y = -100 + 30 * peek + 62 * down;   // (% of its own height: −100 = wholly above the screen · 0 = its top at the screen's top)
      set(ship.el, 't', `translate3d(-50%,${y.toFixed(1)}%,0)`); set(ship.el, 'o', peek > 0 || down > 0 ? '1' : '0');
      if (ship.glow) set(ship.glow, 'o', (reduce ? 0.7 : 0.45 + 0.4 * Math.sin(F.clock / 190) + 0.15 * down).toFixed(2));
    }
    // THE BEAM (the arrival): ONE huge white-gold beam over the whole road — a cone from the ship, its pool + ring on the lanes, motes rising
    const b = arr >= 0 ? ease(clamp01((arr - 380) / 420)) : 0;
    set(ship.wash, 'o', (arr >= 0 ? Math.min(1, b * 0.34 + 0.5 * Math.max(0, 1 - Math.abs(arr - 560) / 240)) : 0).toFixed(2));
    if (b > 0.004) {
      const cz = F.kz - 3.5, pu = reduce ? 1 : 0.88 + 0.12 * Math.sin(F.clock / 150);
      K.bill.put(F.camX, 8.5, cz - 2, 19, 19, 1, 0, 0xffe2a4, 1, 9, (day ? 0.36 : 0.34) * b * pu);
      K.bill.put(F.camX, 8.5, cz - 2, 8, 19, 1, 0, 0xfff6e0, 1, 9, (day ? 0.26 : 0.2) * b * pu);
      K.flat.put(F.camX, 0.085, cz, 24, 1, 17, 0, 0xffe0a0, 1, 0, (day ? 0.36 : 0.36) * b); K.flat.put(F.camX, 0.086, cz, 15.5, 1, 11, 0, 0xfff0c8, 1, 3, (day ? 0.8 : 0.5) * b * pu);
      if (!reduce) for (let i = 0; i < 16; i++) { const m = (F.clock / 1300 + i * 0.618) % 1, a = i * 2.39; K.bill.put(F.camX + Math.cos(a) * (1.2 + (i % 5) * 0.9), m * 9, cz + Math.sin(a) * (0.8 + (i % 4) * 0.8), 0.16, 0.16, 1, 0, 0xfff6dc, 1, 0, Math.sin(m * Math.PI) * b); }
    }
    // THE SOUNDS: the UFO's hum pitched down + the rumble, both building through the warning; the beam + the lift as it arrives
    if (!snd.ship) { snd.ship = play('ufo-hum', { gain: 0.02, rate: 0.5, loop: true }); snd.rum = rumble(); }
    if (arr < 0) snd.shipAt = -1;
    const lv = arr >= 0 ? Math.max(0, 1 - Math.max(0, arr - 2600) / 1500) : 0.12 + 0.88 * w * w;
    snd.ship.gain(0.5 * lv, 0.3); if (snd.rum) snd.rum.gain(0.55 * lv);
    if (arr >= 0 && arr < 900 && snd.shipAt < 0) { snd.shipAt = F.clock; play('ufo-beam-on', { gain: 0.8, rate: 0.62, at: 2.6 }); setTimeout(() => { if (!dead && ship.on) play('ufo-lift', { gain: 0.7, rate: 0.75, at: 2.6 }); }, 600); }
  }
  function shipOff() {
    ship.on = false; ship.sec = -1;
    for (const e of [ship.el, ship.dim, ship.wash, ship.txt]) set(e, 'o', '0');
    if (snd.ship) snd.ship.stop(0.5); if (snd.rum) snd.rum.stop(0.5); snd.ship = snd.rum = null;
  }
  /** how far a kid THE MOTHERSHIP is lifting has risen: ms since it took him → { y, spin, glow } */
  const lifted = ms => { const q = clamp01((ms - 520) / FLY.liftMs); return { y: 15 * q * q * (3 - 2 * q), spin: reduce ? 0 : ms * 0.0022, glow: clamp01(ms / 500) * (1 - 0.4 * q), q }; };

  /** the frame's end: what was not drawn this frame is put away; the UFO's hum follows how near it is */
  function end() {
    flush();
    for (let i = nj; i < jets.length; i++) jets[i].visible = false;
    for (let i = nu; i < ufos.length; i++) { ufos[i].m.visible = false; ufos[i].id = -1; }
    if (abd.on && F.clock - abd.t0 > FLY.abductMs + 900) abd.on = false;
    const want = F.own && F.alive && humD < 8 ? 0.34 * Math.pow(1 - humD / 8, 1.5) : 0;
    if (want > 0.004 && !snd.hum) snd.hum = play('ufo-hum', { gain: want, loop: true });
    else if (snd.hum) { if (want <= 0.004 && humD > 12) { snd.hum.stop(0.6); snd.hum = null; } else snd.hum.gain(want, 0.25); }
  }
  return {
    begin, jet, ufo, abduct, lift, lifted, ship: shipAt, end, holdMs,
    /** the camera's small shake this frame (cells — THE BLACKBIRD's pass; 0 with reduce motion) */
    shake: () => shakeNow,
    /** the meshes night.js's warm frame must have seen (their programs + buffers made before the moment, never in it) */
    meshes: () => [...jets, ...ufos.map(q => q.m)],
    info: () => ({ models: Object.keys(geo), jets: jets.filter(m => m.visible && Math.abs(m.position.x) < 6.5).length, ufos: ufos.filter(q => q.m.visible).length, ship: !!ship.cv, shipOn: ship.on, shipText: ship.txt ? ship.txt.textContent : '', abducting: abd.on, sounds: played.slice() }),
    /** the world goes quiet (a run's end / a new run / the view leaves): the loops fade */
    quiet() { if (snd.hum) { snd.hum.stop(0.4); snd.hum = null; } if (snd.ship && !ship.on) { snd.ship.stop(0.4); if (snd.rum) snd.rum.stop(0.4); snd.ship = snd.rum = null; } },
    destroy() {
      dead = true; offBed();
      if (snd.hum) snd.hum.stop(0.2); if (snd.ship) snd.ship.stop(0.2); if (snd.rum) snd.rum.stop(0.2);
      for (const m of jets) scene.remove(m); for (const q of ufos) { scene.remove(q.m); q.m.material.dispose(); }
      jetMat.dispose(); for (const g of Object.values(geo)) g.dispose();
      for (const e of [ship.el, ship.dim, ship.wash, ship.txt]) if (e) e.remove();
      for (const cv of [ship.cv, ship.glow]) if (cv) { cv.width = 0; cv.height = 0; }
    },
  };
}
