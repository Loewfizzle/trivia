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
  jetLen: 4.8, jetY: 1.3, jetLead: 16,           // (the SR-71: cells long — H6B: ≈ 1.3× H6A's 3.7; the rules' body is 3 —, how low it flies, the ticks it is drawn before + after its pass)
  glint: 30,                                     // (the tell's LAST 30 ticks = 0.5 s: the glint + the flare at the edge it comes from)
  shake: 0.075, shakeFrom: 5, shakeTicks: 12,    // (cells — ≈ 3.7 px at ZOOM 8 on a 390 pt phone; 12 ticks = 200 ms)
  ring: [6, 40], flash: [6, 8], trail: 34,      // (the shock ring: born 6 ticks into the pass, 40 ticks long · the band's white flash · the contrails' life)
  ufoY: 5.0, ufoD: 2.3,                          // (the saucer: how high, how wide — H6B: SMALLER + HIGHER (was 3.0 across at 4.7; any higher and the skyline band hides it): it stands over the lanes ≈ 5 ahead of its ring, never on a car / a log / a train he must read now; its beam circle is 2.5 cells across)
  abductMs: 2000,                                // (THE ABDUCTION, start to end)
  warn: 10 * TICK_HZ, liftMs: 2600,              // (THE MOTHERSHIP's warning: the cap − 10 s · how long a kid takes to rise into it)
});
/**
 * THE MIX (H6B — docs/jaywalk.md "THE MIX"; measured by tests/integration/jaywalk-mix.mjs): every city sound the moments play — its
 * gain into the SFX bus (the files are levelled: one-shots ≈ −20 LUFS, the hum −24), its rate, where in the file it starts. A `@ship`
 * row is the same file as THE MOTHERSHIP plays it (pitched down). The loops' gains are their LOUDEST (they follow the moment).
 */
export const MIX = Object.freeze({
  'radio-static_1': { gain: 0.34, what: 'THE BLACKBIRD — the radio crackle as its tell starts' },
  'jet-scream': { gain: 0.62, at: 0.4, what: '… its scream, started so its peak lands on the pass' },
  'sonic-boom': { gain: 0.8, what: '… the boom on the pass' },
  'ufo-hum': { gain: 0.3, loop: true, what: 'THE UFO — its hum, nearer = louder (this is its loudest)' },
  'ufo-beam-on': { gain: 0.6, at: 3.0, what: 'THE ABDUCTION — the beam slams down' },
  'ufo-lift': { gain: 0.5, at: 3.4, what: '… the kid goes up' },
  'ufo-depart': { gain: 0.6, at: 1.5, what: '… it zips off' },
  'ufo-beam-off': { gain: 0.46, at: 1.1, what: '… the beam snaps out' },
  'ufo-hum@ship': { gain: 0.75, rate: 0.5, loop: true, what: 'THE MOTHERSHIP — the deep hum, building through the warning (its loudest)' },
  'ufo-beam-on@ship': { gain: 0.72, rate: 0.62, at: 2.6, what: '… its beam as it arrives' },
  'ufo-lift@ship': { gain: 0.6, rate: 0.75, at: 2.6, what: '… every kid goes up' },
});
/** THE MUSIC DUCKS under the big moments (the share of its level it keeps; the view applies it — view.js#applyDuck): THE BLACKBIRD's
 *  pass (its last second → the boom's tail) · THE ABDUCTION · THE MOTHERSHIP's warning → its arrival */
export const DUCK = Object.freeze({ jet: 0.45, ufo: 0.4, warn: 0.62, ship: 0.3, rumble: 0.5 });
/** how long the scene is held on a run's end before the end screen may cover it (ms): the abduction + the lift are SEEN */
export const holdMs = run => (run.st === 'taken' ? 4200 : run.cause === 'ufo' ? FLY.abductMs + 250 : run.cause === 'blackbird' ? 1100 : 0);

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
/** CITY PART 1 — the music-off sweep's seam (tests/integration/podcast-sweep.mjs): one flyer sound by its MIX id, as the run plays it */
export const playFlyerSound = id => play(String(id).replace(/@.*/, ''), { ...(MIX[id] || {}), loop: false, at: 0 });
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
      if (!b || H.dead || !ctx || !isUnlocked() || (!loop && performance.now() - t0 > 400)) return;   // (CITY PART 1 — SILENT WITH MUSIC OFF, THE SWEEP: an effect asks isUnlocked() — running OR napping, its own start wakes the nap: engine.js#wakeFor — never the context's state)
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
    if (!isUnlocked() || !ctx) return H;   // (CITY PART 1 — SILENT WITH MUSIC OFF, THE SWEEP: an effect asks isUnlocked() — running OR napping, its own start wakes the nap: engine.js#wakeFor — never the context's state)
    const n = Math.floor(ctx.sampleRate * 2), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    let v = 0;
    for (let i = 0; i < n; i++) { v = (v + (Math.random() * 2 - 1) * 0.06) / 1.006; d[i] = v * 3.2; }
    { let pk = 1e-6; for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(d[i])); for (let i = 0; i < n; i++) d[i] *= 0.9 / pk; }   // (a KNOWN peak: 0.9 × DUCK.rumble = −7 dBFS at the bus at most — raw, it ran several dB over full scale)
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
  // ITS AFTERBURNERS = SOLID FLAME CONES (H6B's second review: the additive ribbons washed to a white smear over the lit runway + the
  // ring by night, and read as see-through motion stripes by day): one opaque tapered cone a nozzle, unlit — white-hot at the nozzle,
  // blue, then orange, a pink tip — the same fire in both looks, drawn in front of everything on the ground; it glows by night (the
  // bloom's layer). Four at the most in view (two jets).
  const flameMat = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, toneMapped: false }), flames = [];
  function flameGeo() {
    const pos = [], col = [], idx = [], c = new THREE.Color(), SEG = 12;
    const rings = [[0, 0.62, 0xffffff], [0.07, 1, 0xf2f8ff], [0.2, 0.96, 0x7fc0ff], [0.34, 0.86, 0x3f8cff], [0.5, 0.72, 0xff8a1e], [0.72, 0.46, 0xff5a2a], [0.9, 0.2, 0xff4f9a], [1, 0.02, 0xff8ac8]];
    for (const [t, r, hex] of rings) { c.setHex(hex); for (let k = 0; k < SEG; k++) { const a = k / SEG * Math.PI * 2; pos.push(t, Math.cos(a) * r, Math.sin(a) * r); col.push(c.r, c.g, c.b); } }
    for (let i = 0; i < rings.length - 1; i++) for (let k = 0; k < SEG; k++) { const a = i * SEG + k, b = i * SEG + (k + 1) % SEG; idx.push(a, a + SEG, b, b, a + SEG, b + SEG); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
    return g;
  }
  // THE UFO: a SOLID saucer (H6B — never see-through: no transparency anywhere) — chrome catching the sun by day, dark metal by
  // night; two in view at the most. It takes the far haze's own colour as its ring nears the wall (solid to the last)
  const ufoMat = () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.2, metalness: 0.85, envMapIntensity: 1.6 });
  const UFO_HEX = [0x7e88b0, 0xa9bad6], UFO_ENV = [1.5, 2.3], cA = new THREE.Color();
  const ufos = [];
  const mk = (g, m) => { const o = new THREE.Mesh(g, m); o.visible = false; o.frustumCulled = false; scene.add(o); return o; };
  function built(n) {
    if (n === 'blackbird') { for (let i = 0; i < 2; i++) { const m = mk(geo[n], jetMat); m.scale.setScalar(FLY.jetLen); m.rotation.order = 'YXZ'; jets.push(m); } geo.flame = flameGeo(); for (let i = 0; i < 4; i++) { const m = mk(geo.flame, flameMat); m.layers.enable(1); flames.push(m); } }
    if (n === 'ufo') for (let i = 0; i < 2; i++) { const m = mk(geo[n], ufoMat()); m.scale.setScalar(FLY.ufoD); m.rotation.order = 'XYZ'; ufos.push({ m, id: -1 }); }
    if (n === 'mothership') { bakeAsk = true; return; }
    // NO HITCH WHEN IT LANDS: the new material's program is compiled OFF the frame (three's compileAsync — the browser's parallel shader
    // compile), the meshes shown far under the ground for that one call; a browser without it falls back to the scene's own warm frame
    const ms = n === 'blackbird' ? [...jets, ...flames] : ufos.map(q => q.m);
    for (const m of ms) { m.visible = true; m.position.set(0, -60, 0); }
    const done = () => { for (const m of ms) if (m.position.y === -60) m.visible = false; };
    try { const q = C.renderer.compileAsync(scene, cam); if (q && q.then) q.then(done, done); else { done(); C.rewarm(); } } catch { done(); C.rewarm(); }
  }
  let nj = 0, nf = 0, nu = 0, nk = 0, shakeNow = 0, humD = 99, dimNow = 0, duckK = 1, duckJ = 1;
  /** play one of THE MIX's rows (`o` adds to it: a pan, a start that follows the moment) */
  const mix = (id, o) => play(id.replace(/@.*/, ''), { ...MIX[id], ...o });
  // (the kid's own moments are asked for BEFORE night.js resets its instanced kinds for the frame: what they lay waits here)
  const pend = [], flush = () => { for (const f of pend) f(); pend.length = 0; };
  const snd = { bands: new Map(), hum: null, abd: 0, ship: null, rum: null, shipAt: -1 };
  // (THE BEDS — audio/engine.js: every LOOPING source stops AT ONCE when the page is left; back on screen the next frame starts what is still wanted)
  const offBed = (globalThis.__nsAudioBeds || (() => () => {}))({ pause() { for (const k of ['hum', 'ship', 'rum']) if (snd[k]) { snd[k].stop(0.02); snd[k] = null; } }, resume() {} });

  /** a frame begins: the world's tick, the frame clock, the look, the kid on screen (his world x / z, his lane), the camera's column */
  function begin(o) {
    Object.assign(F, o);
    if (o.day !== day) {
      day = o.day; jetMat.metalness = day ? 0.35 : 0.6; jetMat.roughness = day ? 0.42 : 0.36; jetMat.envMapIntensity = day ? 0.9 : 2.0;
      jetMat.emissive.setHex(day ? 0 : 0x1a2440);   // (by night a cool light of its own: the near-black airframe was lost against the dark road)
      // THE UFO: CHROME in the sun (a cool tint, a hard gloss) · bright cool steel by night
      for (const q of ufos) { const m = q.m.material; m.metalness = day ? 1 : 0.92; m.roughness = day ? 0.14 : 0.26; }
      if (ship.el) bakeAsk = true;   // (THE MOTHERSHIP's sprite is baked for the look: sunlit rim by day)
    }
    nj = 0; nf = 0; nu = 0; shakeNow = 0; humD = 99;
    if (bakeAsk && C.renderer && geo.mothership) { bakeAsk = false; try { bakeShip(); } catch { ship.cv = null; } }
    flush();
  }
  const LF = (...a) => { if (!day) K.flat.put(...a); }, LB = (...a) => { if (!day) K.bill.put(...a); };
  /** the world x that sits `ndc` across the screen (−1 left … 1 right) at this height + lane — the camera's own edge, any zoom / turn */
  function edgeX(ndc, y, z) { v3.set(0, y, z).project(cam); const a = v3.x; v3.set(1, y, z).project(cam); const k = v3.x - a; return Math.abs(k) < 1e-6 ? ndc * 4 : (ndc - a) / k; }
  /** a ring on the ground THICK enough to read at phone size: the shader's ring is a hairline once it is big — three laid a hair apart */
  function ring(x, y, z, d, sq, hex, a) { for (let i = 0; i < 3; i++) K.flat.put(x, y + i * 0.001, z, d * (1 - i * 0.045), 1, d * (1 - i * 0.045) * sq, 0, hex, 1, 3, a); }

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
      if (tell && !(S.s & 1) && left0 > p.tell - 20) { S.s |= 1; mix('radio-static_1'); mix('jet-scream', { at: Math.max(0, 2.4 - left0 / TICK_HZ), pan }); }
      if (!(S.s & 2) && ((tell && left0 <= 14) || (!tell && u < 20))) { S.s |= 2; mix('sonic-boom', { pan: pan * 0.5 }); }
      // (the music ducks under it: from the tell's last second — the scream's peak — to the boom's tail)
      if ((tell && left0 <= TICK_HZ) || (!tell && u < 100)) duckJ = DUCK.jet;
    }
    // THE GLINT (the tell's last 0.5 s): AT THE SCREEN EDGE IT COMES FROM (the camera's own edge on the band's row) — a big four-point
    // star + the afterburners' flare (a blue-white heart in an orange rim), on a dark halo by day; it grows as the jet nears
    if (tell && left0 <= FLY.glint) {
      const g = 0.45 + 0.55 * (1 - left0 / FLY.glint), ex = edgeX(-dir * 0.84, 0.7, zc), tw = reduce ? 1 : 0.78 + 0.22 * Math.sin(F.clock / 34), a = Math.min(1, lt) * tw;
      if (day) {
        // (BY DAY — the go-live review: a pale star on a pale lane was quiet. A SOLID dark disc behind it, a solid orange flare on
        //  that, a yellow-hot heart, fat white arms — paint, edge to edge readable in full sun)
        const A = Math.min(1, lt);
        K.bill.put(ex, 0.7, zc, 8.4 * g, 5.8 * g, 1, 0, 0x060a18, 1, 5, 0.82 * A);
        K.bill.put(ex, 0.7, zc, 6.2 * g, 4.4 * g, 1, 0, 0xff6a14, 1, 5, 0.95 * a);
        K.bill.put(ex, 0.7, zc, 3.6 * g, 2.6 * g, 1, 0, 0xffe45a, 1, 5, a);
        K.bill.put(ex, 0.7, zc, 9.0 * g, 0.62 * g, 1, 0, 0xffffff, 1, 4, a);
        K.bill.put(ex, 0.7, zc, 0.5 * g, 5.6 * g, 1, 0, 0xffffff, 1, 0, a);
        K.bill.put(ex, 0.7, zc, 2.0 * g, 2.0 * g, 1, 0, 0xffffff, 1, 5, a);
      } else {
      K.bill.put(ex, 0.7, zc, 6.4 * g, 4.4 * g, 1, 0, 0xff8a2a, 1, 0, 0.5 * a);                        // the flare's orange rim
      K.bill.put(ex, 0.7, zc, 4.0 * g, 2.9 * g, 1, 0, 0x58b4ff, 1, 0, 0.9 * a);                        // … its blue heart
      K.bill.put(ex, 0.7, zc, 7.6 * g, 0.34 * g, 1, 0, 0xffffff, 1, 0, a);                             // the star's long arm
      K.bill.put(ex, 0.7, zc, 0.3 * g, 4.6 * g, 1, 0, 0xffffff, 1, 0, a);                              // … its tall arm
      K.bill.put(ex, 0.7, zc, 1.5 * g, 1.5 * g, 1, 0, 0xffffff, 1, 5, a);                              // … its white-hot core
      }
      LF(ex, 0.05, zc, 6, 1, 3.4, 0, 0x6ab8ff, 1, 0, 0.5 * a);
    }
    // THE PASS: the jet (drawn a little before + after it too — it is seen coming through the edge column)
    const s = u < p.pass + FLY.jetLead ? u : u > p.period - FLY.jetLead ? u - p.period : null;
    let burn = null;
    if (s !== null) {
      const len = p.len / FP, cx = X(pulseLeft(p, s) / FP + len / 2), M = jets[nj++], nx = cx - dir * 0.4 * FLY.jetLen, y = FLY.jetY;
      if (M) { M.visible = true; M.position.set(cx, y, zc); M.rotation.set(0, dir * Math.PI / 2, dir * 0.24); }
      // ITS SHADOW sweeps the band's two lanes right under it: a hard jet-sized heart in a soft edge (by day it is laid as dark paint,
      // over the band's own lights + flash — the day's signature)
      if (day) K.flat.put(cx + 0.35, 0.083, zc + 0.2, 13.5, 1, 5.4, 0, 0x0a1430, 1, 0, 0.62 * Math.min(1, lt));   // (soft + cool: the second review — a hard black oval looked pasted on)
      else K.shadow.put(cx, 0.03, zc, FLY.jetLen * 1.05, 1.4, 2.7, 0, 0, 1, 0, 0.85 * Math.min(1, lt));
      LF(cx, 0.045, zc, 5.4, 1, 2.6, 0, 0xffd9a0, 1, 0, 0.14 * lt);                                    // (a thin warm rim: the runway's lights on its belly)
      const fl = reduce ? 1 : 0.84 + 0.16 * Math.sin(F.clock / 17), ry = dir > 0 ? Math.PI : 0, rz = dir > 0 ? 0 : Math.PI;
      // THE AFTERBURNERS — BLAZING (H6B): from each nozzle a SOLID flame cone (white-hot → blue → orange → a pink tip; it flickers in
      // length), ONE hot core at the nozzle, a faint long pink tail behind it, a soft warm glow round it — laid LAST (burn): nothing
      // washes it out, in either look
      const fy = dir > 0 ? Math.PI : 0;
      for (const e of [-0.56, 0.56]) { const m = flames[nf++]; if (m) { m.visible = lt > 0.15; m.position.set(nx, y, zc + e); m.rotation.set(0, fy, 0); const k = reduce ? 1 : 0.9 + 0.2 * Math.sin(F.clock / 19 + e * 7); m.scale.set(3.3 * k, 0.3, 0.3); } }
      burn = () => {
        for (const e of [-0.56, 0.56]) {
          K.flat.put(nx - dir * 5.4, y - 0.02, zc + e, 7.4, 1, 0.8, rz, 0xff4f9a, 1, 1, (day ? 0.5 : 0.3) * fl * lt);                 // the faint long tail
          K.flat.put(nx - dir * 1.9, y - 0.03, zc + e, 5.2, 1, 1.5, 0, 0xff7a2a, 1, 0, (day ? 0.3 : 0.22) * fl * lt);               // a soft warm glow round the flame
          K.bill.put(nx - dir * 0.1, y, zc + e, 0.8, 0.8, 1, 0, 0xeaf4ff, 1, 5, lt);                                                 // ONE hot core a nozzle
          // (BY DAY: heat shimmer behind the burners — pale wavering ribbons, further back)
          if (day && !reduce) for (let h = 0; h < 2; h++) K.flat.put(nx - dir * (9.4 + h * 2.4 + 0.4 * Math.sin(F.clock / 23 + e * 9 + h)), y, zc + e * (1.15 + 0.3 * Math.sin(F.clock / 31 + h * 2)), 3.8, 1, 1.2, rz, 0xffffff, 1, 1, 0.2 - h * 0.07);
        }
      };
    }
    if (tell) { if (burn) burn(); return; }
    // AFTER IT: the contrails (a soft trail that widens as it fades — never a hairline), THE SHOCKWAVE RING on the ground (ONE thick ring,
    // a dark trailing edge by day), a short flash on the band (capped: the runway's lights still read), the shake
    if (u < FLY.trail) {
      const q = u / FLY.trail, a = (1 - q) * (1 - q) * lt, end = X(pulseLeft(p, Math.min(u, p.pass + FLY.jetLead)) / FP + (dir > 0 ? 0 : p.len / FP)) - dir * 8.5, start = X(dir > 0 ? -3.5 : COLS + 3.5), mid = (start + end) / 2, w = Math.abs(end - start);
      if ((end - start) * dir > 0.5) for (const e of [-0.56, 0.56]) K.flat.put(mid, FLY.jetY - 0.02, zc + e, w, 1, 0.5 + 1.3 * q, 0, day ? 0xffffff : 0x9fd0ff, 1, 4, (day ? 0.6 : 0.5) * a);
    }
    if (u >= FLY.ring[0] && u < FLY.ring[0] + FLY.ring[1]) {
      const q = (u - FLY.ring[0]) / FLY.ring[1], d = (0.9 + 6.6 * easeOut(q)) * 2.5, a = Math.pow(1 - q, 1.3) * lt;
      if (day) K.shadow.raw(F.camX, 0.066, zc, d * 1.05, 1, d * 1.05 * 0.62, 0, 0, 1, 3, 0.75 * a);
      ring(F.camX, 0.07, zc, d, 0.62, 0xeaf6ff, (day ? 1 : 0.5) * a);
    }
    if (u >= FLY.flash[0] && u < FLY.flash[0] + FLY.flash[1]) {
      const a = 1 - (u - FLY.flash[0]) / FLY.flash[1];
      K.flat.put(F.camX, 0.08, zc, 12.5, 1, 2.0, 0, 0xffffff, 1, 4, (day ? 0.45 : 0.24) * a * lt);
    }
    if (!reduce && near && u >= FLY.shakeFrom && u < FLY.shakeFrom + FLY.shakeTicks) shakeNow = FLY.shake * (1 - (u - FLY.shakeFrom) / FLY.shakeTicks);
    if (burn) burn();
  }
  /** THE BLACKBIRD's HIT (night.js — the kid it blasted): `e` ms since it, where he stood, the way the jet flew — THE SHOCKWAVE is
   *  SEEN: a white flash where he stood, a thick ring bursting out from him, a bright streak along his throw, sparks */
  function blast(x, z, e, dir) {
    pend.push(() => {
      const q = clamp01(e / 520), a = (1 - q) * (1 - q);
      if (e < 130) K.flat.put(x, 0.09, z, 9, 1, 5, 0, 0xffffff, 1, 0, (day ? 0.8 : 0.7) * (1 - e / 130));
      if (day) K.shadow.raw(x, 0.07, z, (1.2 + 8 * easeOut(q)) * 1.05, 1, (1.2 + 8 * easeOut(q)) * 0.66, 0, 0, 1, 3, 0.7 * a);
      ring(x, 0.075, z, 1.2 + 8 * easeOut(q), 0.62, 0xeaf6ff, a);
      K.flat.put(x + dir * 1.9 * easeOut(q), 0.6, z + 0.5 * q, 4.2 * easeOut(q) + 0.4, 1, 0.9, dir > 0 ? 0 : Math.PI, day ? 0xffffff : 0xcfe8ff, 1, 1, 0.9 * a);
      if (!reduce) for (let i = 0; i < 8; i++) { const an = i * 0.785 + 0.3, r = (0.5 + 3.2 * easeOut(q)) * (0.7 + (i % 3) * 0.2); K.bill.put(x + Math.cos(an) * r, 0.25 + 1.4 * Math.sin(q * Math.PI) * (0.5 + (i % 2) * 0.5), z - Math.sin(an) * r * 0.6, 0.2, 0.2, 1, 0, 0xffffff, 1, 5, a); }
    });
  }

  // ------------------------------------------------------------------------------------------------ THE UFO
  const abd = { on: false, id: -1, t0: 0, x: 0, z: 0, sx: 0, sz: 0 };
  // (H6B — on the abducted player's OWN phone the world dims round the beam for its ≈ 2 s: one soft shade over the scene, its clear
  //  heart set on the beam once, as it starts — after that its opacity alone moves)
  const dimAt = [50, 50]; let dimEl = null, dimO = '0', duckNow = 1;
  function dimSet() {
    const o = dimNow < 0.01 ? '0' : (0.8 * dimNow).toFixed(2);
    if (o === dimO) return;
    if (!dimEl) { dimEl = document.createElement('div'); dimEl.className = 'jw-ufo-shade'; dimEl.setAttribute('aria-hidden', 'true'); C.host.append(dimEl); }
    if (dimO === '0') { dimEl.style.setProperty('--x', `${dimAt[0].toFixed(1)}%`); dimEl.style.setProperty('--y', `${dimAt[1].toFixed(1)}%`); }
    dimO = o; dimEl.style.opacity = o;
  }
  const GREEN = 0x4dff5a, GREEN_D = 0x12d83c;   // (the ring: a clear YELLOW-GREEN — never blue, never the mint of a kid's own ring)
  /** a UFO over its zone this frame (once a UFO — night.js's lane loop): the saucer, its ring on the ground, its beam, the hum */
  function ufo(U, t, lt) {
    need('ufo'); sfetch('ufo-hum'); sfetch('ufo-beam-on'); sfetch('ufo-lift'); sfetch('ufo-depart'); sfetch('ufo-beam-off');
    const bx = X(ufoX(U, t) / FP), bz = Z(ufoY(U, t) / FP), r = U.r / FP, hz = 1 - C.hazeAt(bx, 0, bz), T = F.clock / 1000;
    const bob = reduce ? 0 : Math.sin(T * 1.7 + U.id) * 0.12;
    const pu = reduce ? 0.9 : 0.8 + 0.2 * Math.sin(T * 5.2), taking = abd.on && abd.id === U.id, A = taking ? abductAt(F.clock - abd.t0, bx, FLY.ufoY + bob, bz) : null;
    // THE RING ON THE GROUND — the rules' warning, ALWAYS where the rules have it: a bright GREEN ring, pulsing (thick: three laid a hair
    // apart; a white inner edge; by day opaque green paint on a dark ring); a second ring closing in on its middle; a soft green pool.
    // While its saucer is away with a kid the ring is dim (it comes back with the saucer)
    const dim = (A ? 0.3 + 0.7 * A.back : 1) * Math.min(1, hz * 1.5), d = r * 2.5;   // (… and it goes with the far haze: never a dim crescent under the wall with nothing over it)
    if (day) K.shadow.raw(bx, 0.048, bz, d * 1.07, 1, d * 1.07, 0, 0, 1, 3, 0.8 * dim);
    ring(bx, 0.05, bz, d, 1, day ? GREEN_D : GREEN, pu * dim);
    K.flat.put(bx, 0.054, bz, d * 0.9, 1, d * 0.9, 0, 0xffffff, 1, 3, (day ? 0.85 : 0.5) * pu * dim);
    if (!reduce) { const q = (T * 0.9) % 1; K.flat.put(bx, 0.051, bz, d * (1 - 0.72 * q), 1, d * (1 - 0.72 * q), 0, day ? GREEN_D : 0x9dff8a, 1, 3, 0.8 * (1 - q) * dim); }
    K.flat.put(bx, 0.045, bz, r * 2.2, 1, r * 2.2, 0, day ? 0x35e060 : 0x3dff6a, 1, 0, (day ? 0.4 : 0.42) * dim);
    if (hz < 0.02) return;
    // THE SAUCER, high over its ring: SOLID — it spins + bobs; by day chrome in the sun, by night dark metal under bright rim lights
    const q = ufos[nu++];
    let sx = bx, sy = FLY.ufoY + bob, sz = bz, sc = 1, pulse = 0, tip = 0, hatch = 0;
    // (the review: far up the screen its top half sat in the haze under the wall — a dull smudge. It hovers LOWER there: its top
    //  stays 31 % down the screen or more, never under 2.6 high; as its ring nears him it is back at its full height)
    if (!A) { v3.set(bx, sy + 0.5, bz).project(cam); const y0 = v3.y, yf = (1 - y0) / 2; if (yf < 0.31) { v3.set(bx, sy - 0.5, bz).project(cam); const per = (y0 - v3.y) / 2; if (per > 1e-4) sy = Math.max(2.6, sy - (0.31 - yf) / per); } }
    if (A) { sx = A.sx; sy = A.sy; sz = A.sz; sc = A.sc; pulse = A.pulse; tip = A.tip; hatch = A.hatch; }
    if (q) {
      const m = q.m.material, fogC = scene.fog ? scene.fog.color : cA.setHex(0);
      q.id = U.id; q.m.visible = sc > 0.03; q.m.position.set(sx, sy, sz);
      // (its near rim LIFTS a little as it locks on: the glowing hatch under its belly is seen — the kid goes up INTO it, the solid hull closing over him)
      q.m.rotation.set((reduce ? 0.08 : 0.1 * Math.sin(T * 1.3)) + tip, reduce ? 0 : T * 0.9, reduce ? 0 : 0.07 * Math.cos(T * 1.1) * (1 - Math.min(1, tip * 3)));
      q.m.scale.set(FLY.ufoD * sc, FLY.ufoD * sc, FLY.ufoD * sc);
      // (never a pale disc on the backdrop — H5C: SOLID, it takes the haze's own colour as its ring nears the wall)
      m.color.setHex(UFO_HEX[day ? 1 : 0]).lerp(fogC, 1 - hz); m.emissive.copy(fogC).multiplyScalar((1 - hz) * 0.8); m.envMapIntensity = UFO_ENV[day ? 1 : 0] * hz;
      // its rim lights (BRIGHT — a chase round the rim), the glow under its belly, by day a hard SUN STAR on its shoulder
      const a0 = reduce ? 0 : T * 0.9, R = FLY.ufoD * (day ? 0.5 : 0.47) * sc, la = hz * Math.min(1, sc * 1.4), ct = Math.cos(tip), st = Math.sin(tip);
      for (let i = 0; i < 10; i++) {
        const a = a0 + i * Math.PI / 5, hot = pulse > 0 ? pulse : reduce ? 0.8 : 0.5 + 0.5 * Math.max(0, Math.sin(T * 6 - i * 1.26)), lz = -Math.sin(a) * R * 0.92, ly = (day ? 0.24 : 0.16) * sc;   // (by day they sit ON its upper rim — the second review: tucked under it)
        K.bill.put(sx + Math.cos(a) * R, sy + ly * ct - lz * st, sz + lz * ct + ly * st, (0.3 + 0.28 * hot) * (day ? 1.7 : 1.25), (0.3 + 0.28 * hot) * (day ? 1.7 : 1.25), 1, 0, day ? (i % 2 ? 0xfff6a0 : 0x10d848) : i % 2 ? 0xffffff : 0x8dff9a, 1, 5, (day ? 1 : 0.65 + 0.35 * hot) * la);   // (by day: bigger, saturated green + warm white — they read on the chrome)
      }
      K.bill.put(sx, sy - 0.05, sz, 2.2 * sc, 0.8 * sc, 1, 0, day ? 0xc8ffd8 : 0x7dffa0, 1, 0, (day ? 0.35 : 0.7) * (0.7 + 0.3 * pu + pulse) * la);
      if (day) K.bill.put(sx, sy + 0.2 * sc, sz + 0.36 * sc, 1.5 * sc, 0.13 * sc, 1, 0, 0xffffff, 1, 4, 0.85 * la);   // (a hard highlight band along its near rim: chrome, not a pot lid)
      if (day) { const gx = sx - 0.5 * sc, gy = sy + 0.4 * sc, tw = reduce ? 1 : 0.8 + 0.2 * Math.sin(T * 3.1); K.bill.put(gx, gy, sz, 1.5 * tw * sc, 0.11, 1, 0, 0xffffff, 1, 0, la); K.bill.put(gx, gy, sz, 0.11, 1.3 * tw * sc, 1, 0, 0xffffff, 1, 0, la); K.bill.put(gx, gy, sz, 0.38, 0.38, 1, 0, 0xffffff, 1, 5, la); }
      // ITS HATCH: a glowing port under its belly, on the side the lens sees — it opens wide as it takes him
      { const hy = sy - 0.24 * sc * ct + 0.3 * sc * st, hzz = sz + 0.3 * sc * ct + 0.3 * sc * st, hk = 0.55 + 0.45 * pu + hatch * 1.4; K.bill.put(sx, hy, hzz, (0.8 + 0.9 * hatch) * sc, (0.3 + 0.5 * hatch) * sc, 1, 0, day ? 0xd6ffe0 : 0x9dffb4, 1, 0, Math.min(1, (day ? 0.5 : 0.75) * hk) * la); if (hatch > 0.05) K.bill.put(sx, hy, hzz, 0.5 * hatch * sc, 0.26 * hatch * sc, 1, 0, 0xffffff, 1, 5, hatch * la); }
      K.shadow.put(bx, 0.03, bz, 2.0, 1, 1.5, 0, 0, 1, 0, day ? 0.3 * hz * dim : 0);
    }
    // ITS BEAM, from its belly to its ring — STRONG (H6B): by night a glowing green column, by day bright pale green between two
    // darker edge lines, motes drifting up it in both; and it LIGHTS what drives through it (a green wash laid over the cars in the ring)
    if (!A) {
      const h = sy, k = (0.85 + 0.15 * pu) * hz;
      K.bill.put(bx, h / 2, bz, r * 2.3, h, 1, 0, day ? 0x30d868 : 0x4dff7a, 1, 9, (day ? 1.5 : 0.62) * k);   // (by day a DENSE saturated green: pale green vanished over the tan paving)
      K.bill.put(bx, h / 2, bz, r * 1.0, h, 1, 0, day ? 0xd8ffe4 : 0xc8ffd6, 1, 9, (day ? 0.6 : 0.3) * k);
      if (!reduce) for (let i = 0; i < 6; i++) { const m = (T * 0.35 + i / 6) % 1; K.bill.put(bx + Math.sin(i * 2.4 + T) * r * 0.5 * (1 - m * 0.5), 0.2 + m * Math.max(0.5, h - 0.8), bz, 0.17, 0.17, 1, 0, 0xffffff, 1, 5, Math.sin(m * Math.PI) * hz); }
      K.bill.put(bx, 0.6, bz + r * 0.95, r * 2.5, 1.5, 1, 0, day ? 0x6dffa0 : 0x4dff7a, 1, 0, (day ? 0.3 : 0.34) * k);
    }
    humD = Math.min(humD, Math.hypot(bx - F.kx, bz - F.kz));
  }
  /** THE ABDUCTION's own clock (ms since the hit) → where the saucer is (it locks on over him and CLIMBS — a long beam —, TIPS its
   *  hatch toward the lens, pulses, zips off — small + far, never see-through — and comes back down over its ring: bx / by / bz), the
   *  beam, the kid */
  function abductAt(e, bx = abd.sx, by = FLY.ufoY, bz = abd.sz) {
    const lock = ease(clamp01(e / 240)), go = clamp01((e - 1650) / 260), back = ease(clamp01((e - FLY.abductMs - 150) / 450)), away = go * go * (1 - back);
    const top = FLY.ufoY + 0.6 * lock, lx = abd.sx + (abd.x - abd.sx) * lock, lz = abd.sz + (abd.z - abd.sz) * lock;
    return {
      sx: lx + (bx - lx) * back + away * 5, sy: top + (by - top) * back + away * 15, sz: lz + (bz - lz) * back - away * 11, sc: 1 - 0.95 * away, top, back,
      tip: -0.2 * lock * (1 - clamp01((e - 1600) / 200)),                                // its near rim lifts a little: the glowing hatch under it is seen
      hatch: clamp01((e - 200) / 300) * (1 - clamp01((e - 1560) / 140)),                // the hatch opens wide · shuts as he is in
      pulse: e > 1250 && e < 1700 ? 0.6 + 0.4 * Math.sin((e - 1250) / 24) : 0,
      beam: clamp01((e - 170) / 90) * (1 - clamp01((e - 1850) / 130)),                  // slams down · snaps out
      flare: 1 - clamp01(Math.abs(e - 150) / 170),                                      // the circle flares as it locks on
      hit: clamp01((e - 170) / 420),                                                    // the ground's shock ring as the beam lands
      rise: ease(clamp01((e - 380) / 1150)),                                            // the kid: up, spinning, shrinking — INTO the hatch
      dim: clamp01((e - 120) / 260) * (1 - clamp01((e - 1800) / 220)),                  // the world dims round the beam (his own phone)
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
      if (F.own && e < 400 && snd.abd !== abd.t0) { snd.abd = abd.t0; mix('ufo-beam-on'); mix('ufo-lift'); setTimeout(() => { if (!dead) { mix('ufo-depart'); mix('ufo-beam-off'); } }, 1350); }
    }
    // (he rises INTO the saucer — H6B: it is solid, so its hull hides him as he goes in through the hatch; never left under its rim)
    const A = abductAt(e), top = A.top - 0.1, by = top * A.rise;
    if (F.own) dimNow = Math.max(dimNow, A.dim);
    if (F.own && A.dim > 0) { v3.set(x, top * 0.55, z).project(cam); dimAt[0] = (1 + v3.x) * 50; dimAt[1] = (1 - v3.y) * 50; }
    pend.push(() => {
      beam(x, z, top, A.beam, A.flare, day ? 0x8dffb0 : 0x4dff7a, 1.25);
      if (A.hit > 0 && A.hit < 1) ring(x, 0.058, z, 2.6 + 5.5 * easeOut(A.hit), 0.9, day ? GREEN_D : 0xbfffc8, (1 - A.hit) * (1 - A.hit));
      // (he is SEEN all the way up: a thick halo of his own colour round him, a white heart, a short trail under him)
      if (A.rise < 1 && A.beam > 0) {
        const k = 1 - 0.6 * A.rise;
        K.bill.put(x, by + 0.55, z, 2.4 * k, 2.6 * k, 1, 0, hex, 1, 0, (day ? 0.85 : 0.9) * A.beam);
        K.bill.put(x, by + 0.55, z, 1.1 * k, 1.2 * k, 1, 0, 0xffffff, 1, 0, 0.45 * A.beam);
        for (let i = 1; i <= 3; i++) K.bill.put(x, by + 0.4 - i * 0.5 * A.rise, z, 0.7 * k, 0.5 * k, 1, 0, hex, 1, 0, (0.5 - i * 0.13) * A.rise * A.beam);
      }
    });
    return { y: by, spin: reduce ? 0 : e * 0.011 * (0.4 + A.rise), s: 1 - 0.7 * A.rise * A.rise, show: A.rise < 0.992 && e < 1800 };
  }
  /** a beam standing on the ground at (x, z) up to `top`: `k` 0 … 1 = how far it has come down / how open it is; `fl` = the ground's
   *  flare. SEE-THROUGH in its heart (what it lifts is seen): its light is in its edge, its foot and its ring */
  function beam(x, z, top, k, fl, hex, r) {
    if (k > 0.004) {
      const h = top * Math.min(1, k * 1.15), y = top - h / 2;
      K.bill.put(x, y, z, r * 2.7 * (0.35 + 0.65 * k), h, 1, 0, hex, 1, 9, (day ? 0.74 : 0.6) * k);
      K.flat.put(x, 0.055, z, r * 2.9, 1, r * 2.9, 0, hex, 1, 0, (day ? 0.55 : 0.4) * k); ring(x, 0.056, z, r * 2.5, 1, day ? GREEN_D : 0xcfffd8, k);
      if (!reduce) for (let i = 0; i < 7; i++) { const m = (F.clock / 700 + i / 7) % 1; K.bill.put(x + Math.sin(i * 2.4) * r * 0.75 * (1 - m * 0.5), m * top, z, 0.15, 0.15, 1, 0, 0xffffff, 1, 5, Math.sin(m * Math.PI) * k); }
    }
    if (fl > 0.004) { ring(x, 0.057, z, r * 2.5 * (1 + 0.6 * fl), 1, 0xffffff, fl); K.flat.put(x, 0.054, z, r * 4.2, 1, r * 4.2, 0, hex, 1, 0, 0.6 * fl); }
  }
  /** a kid going up (night.js — a GHOST the UFO took; every kid THE MOTHERSHIP lifts): a thick halo of their OWN colour, a white heart,
   *  a short trail under them — the brightest things in the beam; under a UFO's ghost its own smaller beam */
  function lift(x, y, z, q, hex, ship) {
    if (ship) spark(x, y, z, q, hex);
    pend.push(() => {
      if (!ship) beam(x, z, FLY.ufoY, Math.sin(Math.min(1, q * 1.3) * Math.PI) * 0.9, 0, day ? 0x8dffb0 : 0x4dff7a, 0.8);
      const a = (1 - 0.35 * q) * (ship ? Math.min(1, 0.35 + q * 5) : 1);
      if (day && ship) K.bill.put(x, y + 0.55, z, 2.9, 3.1, 1, 0, 0x0c1430, 1, 0, 0.55 * a);   // (by day a dark heart behind the colour: it was washed out in the cream beam)
      K.bill.put(x, y + 0.55, z, 2.5, 2.7, 1, 0, hex, 1, 0, (day ? 0.9 : 0.85) * a);
      K.bill.put(x, y + 0.55, z, 1.0, 1.1, 1, 0, 0xffffff, 1, 0, 0.3 * a);
      for (let i = 1; i <= 4; i++) K.bill.put(x, y + 0.5 - i * 0.55, z, 0.9 - i * 0.12, 0.7, 1, 0, hex, 1, 0, (0.6 - i * 0.12) * a * Math.min(1, q * 6));
      if (ship) K.flat.put(x, 0.06, z, 2.4 + 1.2 * q, 1, 1.9 + q, 0, hex, 1, 3, 0.8 * (1 - q));
    });
  }
  // THE MOTHERSHIP's KIDS GO INTO ITS PORT (H6B): the ship is a sprite OVER the canvas — a kid rising behind it would only slip under
  // its rim. From the rim on each kid is carried on as a small light of their own colour that flies to the port's lens and goes in —
  // drawn on ONE small canvas inside the ship's own sprite (made at the bake; a few dots a frame, only while a kid is on it)
  const sparks = [];
  let fxUsed = false, fxHad = false;
  function spark(x, y, z, q, hex) {
    const S = sparks[nk] || (sparks[nk] = { q0: -1, x: 0, y: 0 }); nk++;
    if (!ship.fx || !ship.port || !F.w) return 0;
    const W = 1.72 * F.w, H = W * SHIP_H / SHIP_W;
    v3.set(x, y + 0.6, z).project(cam);
    const sx = ((1 + v3.x) / 2 * F.w - (F.w - W) / 2) / W, sy = ((1 - v3.y) / 2 * F.h - ship.y / 100 * H) / H;   // (where he is, in the sprite's own 0 … 1)
    if (sy > 0.96 || q <= 0 || q >= 1) { S.q0 = -1; return 0; }
    if (S.q0 < 0 || q < S.q0) { S.q0 = q; S.x = sx; S.y = Math.min(0.96, sy); }   // (the moment + the place he went behind its rim: from here he is its light — STRAIGHT to the port)
    const c = ship.fxc, k = ease(clamp01((q - S.q0) / Math.max(0.05, 0.94 - S.q0))), cw = ship.fx.width, ch = ship.fx.height;
    if (!fxUsed) { fxUsed = true; c.clearRect(0, 0, cw, ch); }
    const px = (S.x + (ship.port[0] - S.x) * k) * cw, py = (S.y + (ship.port[1] - S.y) * k) * ch, r = (16 - 9 * k) * cw / W, col = `#${hex.toString(16).padStart(6, '0')}`;
    const g = c.createRadialGradient(px, py, 0, px, py, r);
    c.globalAlpha = (q > 0.94 ? Math.max(0, (1 - q) / 0.06) : 1) * 0.55; c.fillStyle = '#0a1024'; c.beginPath(); c.arc(px, py, r * 0.78, 0, 7); c.fill();   // (a dark ring behind it: it reads on the bright hull + the cream beam by day)
    g.addColorStop(0, '#fff'); g.addColorStop(0.28, '#fff'); g.addColorStop(0.42, col); g.addColorStop(0.7, col); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.globalAlpha = q > 0.94 ? Math.max(0, (1 - q) / 0.06) : 1; c.fillStyle = g; c.beginPath(); c.arc(px, py, r, 0, 7); c.fill();
    return k;
  }

  // ------------------------------------------------------------------------------------------------ THE MOTHERSHIP
  // THE SHIP = the model BAKED into a sprite (the scene's own renderer → a render target → a 2D canvas; once a look): the skyline band is
  // DOM over the 3D canvas, and the ship must stand over it. Its panel lines, its rings of lights, its lit rim and its lens are drawn on
  // the bake (projected through the bake's own camera); a second small canvas of the brightest lights shimmers over it (opacity only).
  const ship = { el: null, cv: null, glow: null, fx: null, fxc: null, dim: null, wash: null, shade: null, txt: null, sec: -1, on: false, prime: 0, y: -100, port: null };
  let bakeAsk = false;
  const SHIP_W = 1408, SHIP_H = 768;
  function bakeShip() {
    const R = C.renderer, rt = new THREE.WebGLRenderTarget(SHIP_W, SHIP_H, { samples: 4 }), sc = new THREE.Scene(), cm = new THREE.PerspectiveCamera(13.6, SHIP_W / SHIP_H, 0.1, 30);
    // (BY NIGHT: dark steel lit from below by its own beam, a cool rim · BY DAY: the sky on its flanks, the SUN on its rim)
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, color: day ? 0xf0f4ff : 0xd2d8ec, roughness: day ? 0.34 : 0.42, metalness: day ? 0.55 : 0.45, envMapIntensity: day ? 1.5 : 1.0 });
    const m = new THREE.Mesh(geo.mothership, mat); m.rotation.y = 0.26;
    const hemi = new THREE.HemisphereLight(day ? 0xbcd6ff : 0x6a7ab0, day ? 0xf2e2c0 : 0xffe2b0, day ? 3.6 : 2.6), key = new THREE.DirectionalLight(0xffecc8, day ? 3.4 : 4.6), rim = new THREE.DirectionalLight(day ? 0xfff6dc : 0x8fb4ff, day ? 6 : 2.6);
    key.position.set(0.2, -2.2, 1.4); rim.position.set(day ? -1.8 : -1.5, day ? 0.9 : 1.2, day ? 0.6 : -1.5);
    sc.add(m, hemi, key, rim); sc.environment = scene.environment;
    cm.position.set(0, -0.9, 2.3); cm.lookAt(0, 0.1, 0); cm.updateMatrixWorld(); cm.updateProjectionMatrix();
    const col = new THREE.Color(), alpha = R.getClearAlpha(); R.getClearColor(col);
    R.setRenderTarget(rt); R.setClearColor(0x000000, 0); R.clear(); R.render(sc, cm);
    const px = new Uint8Array(SHIP_W * SHIP_H * 4); R.readRenderTargetPixels(rt, 0, 0, SHIP_W, SHIP_H, px);
    R.setRenderTarget(null); R.setClearColor(col, alpha); rt.dispose(); mat.dispose();
    const cv = ship.cv || document.createElement('canvas'); cv.width = SHIP_W; cv.height = SHIP_H; cv.className = 'jw-ship-hull';
    const c = ctx2d(cv); if (!c) return;
    const img = c.createImageData(SHIP_W, SHIP_H), o = img.data, lut = new Uint8Array(256);
    for (let i = 0; i < 256; i++) { const v = i / 255; lut[i] = Math.round(255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055)); }
    for (let y = 0; y < SHIP_H; y++) { const s = (SHIP_H - 1 - y) * SHIP_W * 4, d = y * SHIP_W * 4; for (let x = 0; x < SHIP_W * 4; x += 4) { const a = px[s + x + 3]; if (!a) continue; const k = 255 / a; o[d + x] = lut[Math.min(255, px[s + x] * k) | 0]; o[d + x + 1] = lut[Math.min(255, px[s + x + 1] * k) | 0]; o[d + x + 2] = lut[Math.min(255, px[s + x + 2] * k) | 0]; o[d + x + 3] = a; } }
    c.putImageData(img, 0, 0);
    const gv = ship.glow || document.createElement('canvas'); gv.width = SHIP_W / 2; gv.height = SHIP_H / 2; gv.className = 'jw-ship-glow';
    const g = ctx2d(gv), P = (r, y, a) => { v3.set(Math.cos(a) * r, y, Math.sin(a) * r).project(cm); return [(1 + v3.x) / 2 * SHIP_W, (1 - v3.y) / 2 * SHIP_H]; };
    const loop = (q, r, y) => { q.beginPath(); for (let i = 0; i <= 96; i++) { const [x, yy] = P(r, y, i / 96 * Math.PI * 2 - Math.PI); if (i) q.lineTo(x, yy); else q.moveTo(x, yy); } };
    // (its underside's height at a radius — the model's own profile: the hanging dish, the long slope out to the rim)
    const yAt = r => (r < 0.115 ? 0.004 + r * 0.2 : 0.03 + (r - 0.115) * 0.115);
    c.save(); c.globalCompositeOperation = 'source-atop';
    // PANEL LINES: concentric seams + radial spokes on the underside (drawn only where the hull is)
    c.lineWidth = 2; for (const r of [0.15, 0.2, 0.26, 0.32, 0.385, 0.44]) { loop(c, r, yAt(r)); c.strokeStyle = 'rgba(8,10,24,0.5)'; c.stroke(); loop(c, r + 0.004, yAt(r)); c.strokeStyle = day ? 'rgba(255,255,255,0.22)' : 'rgba(170,190,255,0.16)'; c.stroke(); }
    c.lineWidth = 1.5; c.strokeStyle = 'rgba(8,10,24,0.36)'; for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2 + 0.05, [x0, y0] = P(0.15, yAt(0.15), a), [x1, y1] = P(0.47, yAt(0.47), a); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
    // ITS LIT RIM: a warm line of light round its edge (it rounds the model's own faceted outline)
    c.shadowColor = day ? 'rgba(255,244,214,0.9)' : 'rgba(255,196,110,0.95)'; c.shadowBlur = 16; c.lineWidth = 7; c.strokeStyle = day ? 'rgba(255,250,236,0.95)' : 'rgba(255,214,150,0.95)'; loop(c, 0.487, 0.072); c.stroke();
    c.shadowBlur = 8; c.lineWidth = 3; c.strokeStyle = 'rgba(255,190,230,0.75)'; loop(c, 0.118, 0.026); c.stroke();
    c.restore();
    const blob = (q, x, y, rx, ry, ang, rgb, al) => { q.save(); q.translate(x, y); q.rotate(ang); q.scale(rx, ry); const gr = q.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, `rgba(${rgb},${al})`); gr.addColorStop(0.45, `rgba(${rgb},${al * 0.55})`); gr.addColorStop(1, `rgba(${rgb},0)`); q.fillStyle = gr; q.beginPath(); q.arc(0, 0, 1, 0, 7); q.fill(); q.restore(); };
    c.globalCompositeOperation = 'lighter'; if (g) { g.clearRect(0, 0, gv.width, gv.height); g.setTransform(0.5, 0, 0, 0.5, 0, 0); g.globalCompositeOperation = 'lighter'; }
    // ITS LIGHTS: five rings of warm dashes round the underside (each a soft blob stretched along its ring), the white-gold lens
    const lights = (r, n, len, w, rgb, al) => { const y = yAt(r); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + 0.1 + r * 9, [x, yy] = P(r, y, a), [x2, y2] = P(r, y, a + 0.02), ang = Math.atan2(y2 - yy, x2 - x), near = 0.55 + 0.45 * Math.sin(a); blob(c, x, yy, len * near, w * near, ang, rgb, al * 0.85); blob(c, x, yy, len * 0.5 * near, w * 0.5 * near, ang, '255,255,255', al); if (g && i % 2) blob(g, x, yy, len * 1.9 * near, w * 2.4 * near, ang, rgb, al); } };
    lights(0.462, 44, 17, 6, '255,208,130', 1); lights(0.412, 40, 13, 5, '255,220,160', 0.9); lights(0.352, 34, 14, 5.5, '255,214,140', 0.95); lights(0.29, 28, 12, 5, '255,226,170', 0.9); lights(0.23, 22, 11, 4.6, '255,232,190', 0.9); lights(0.175, 16, 9, 4.2, '255,238,206', 0.9);
    { const [x, y] = P(0, 0, 0), [x1] = P(0.105, 0.005, 0), [, y1] = P(0.105, 0.005, Math.PI / 2), rx = Math.abs(x1 - x), ry = Math.max(8, Math.abs(y1 - y)); ship.port = [x / SHIP_W, y / SHIP_H]; blob(c, x, y, rx * 2.0, ry * 2.0, 0, '255,232,180', 0.9); blob(c, x, y, rx * 1.25, ry * 1.25, 0, '255,246,220', 1); blob(c, x, y, rx * 0.8, ry * 0.8, 0, '255,255,255', 1); if (g) blob(g, x, y, rx * 3.6, ry * 4.4, 0, '255,232,180', 0.9); }
    if (!ship.el) {
      const el = document.createElement('div'); el.className = 'jw-ship'; el.setAttribute('aria-hidden', 'true'); el.append(cv); if (g) el.append(gv);
      // (the kids' sparks: one small canvas over the hull, in the sprite's own box — spark())
      const fv = document.createElement('canvas'); fv.width = SHIP_W / 2; fv.height = SHIP_H / 2; fv.className = 'jw-ship-fx'; ship.fxc = ctx2d(fv, { willReadFrequently: true });   // (a plain BITMAP canvas — measured: a default one is moved to the GPU at its first real draws, one 150 ms frame as the first kid reached the rim)
      if (ship.fxc) { el.append(fv); ship.fx = fv; }
      C.host.append(el); ship.el = el;
    }
    ship.cv = cv; ship.glow = g ? gv : null;
    if (ship.fx && !ship.fx.width) { ship.fx.width = SHIP_W / 2; ship.fx.height = SHIP_H / 2; }   // (let go while the scene rested — rest())
    // (its first paint happens NOW, unseen — on screen at 1 % for a few frames — never as it arrives)
    if (!ship.on) {
      ship.el.style.transform = 'translate3d(-50%,-38%,0)'; ship.el.style.opacity = '0.01'; ship.el.dataset.o = ship.el.dataset.t = ''; ship.prime = 8;
    }
  }
  function shipDom() {
    if (ship.dim) return;
    const mk2 = cls => { const e = document.createElement('div'); e.className = cls; e.setAttribute('aria-hidden', 'true'); C.host.append(e); return e; };
    ship.dim = mk2('jw-ship-dim'); ship.shade = mk2('jw-ship-shade'); ship.wash = mk2('jw-ship-wash'); ship.txt = mk2('jw-ship-t'); ship.txt.removeAttribute('aria-hidden'); ship.txt.setAttribute('role', 'status');
  }
  const set = (el, k, v) => { if (el && el.dataset[k] !== v) { el.dataset[k] = v; if (k === 'o') el.style.opacity = v; else el.style.transform = v; } };
  /**
   * THE MOTHERSHIP this frame: `t` = the world's tick, `cap` = its tick (0 = never — solo), `after` = ms since the kid on screen was
   * taken (−1 = not yet). The warning from the cap − 10 s; the arrival from the cap.
   */
  function shipAt(t, cap, after, lt) {
    if (cap) need('mothership');   // (… and its bake: in the run's first frames — the count — never at the warning)
    if (ship.prime > 0 && --ship.prime === 0 && !ship.on) { ship.el.dataset.o = ship.el.dataset.t = ''; set(ship.el, 'o', '0'); }
    const w = cap ? clamp01((t - (cap - FLY.warn)) / FLY.warn) : 0, arr = after >= 0 ? after : cap && t >= cap ? (t - cap) * 1000 / TICK_HZ : -1;
    if (!cap || (w <= 0 && arr < 0)) { if (ship.on) shipOff(); return; }
    sfetch('ufo-hum'); sfetch('ufo-beam-on'); sfetch('ufo-lift');
    shipDom(); ship.on = true;
    const down = arr >= 0 ? easeOut(clamp01(arr / 700)) : 0, peek = ease(clamp01((w - 0.62) / 0.38)), b = arr >= 0 ? ease(clamp01((arr - 380) / 420)) : 0;
    // the words: THE MOTHERSHIP · 0:10 — red, pulsing (the css; on a dark band — they read over the day's skyline); gone as it arrives
    const sec = Math.max(0, Math.ceil((cap - t) / TICK_HZ));
    if (sec !== ship.sec) { ship.sec = sec; ship.txt.textContent = arr >= 0 ? '' : `THE MOTHERSHIP · 0:${String(sec).padStart(2, '0')}`; }
    set(ship.txt, 'o', arr >= 0 ? '0' : '1'); ship.txt.classList.toggle('is-still', reduce);
    // the skyline darkens under it from the warning's first seconds
    set(ship.dim, 'o', (0.72 * Math.max(Math.min(1, w * 2.6), down)).toFixed(2));
    // THE GIANT SHADOW: a hard-edged ellipse that comes in from the far side and crosses the road lane after lane toward him — by the
    // warning's end it lies over him (a dark heart, a soft rim)
    const sh = arr >= 0 ? 1 : w, sz = F.kz - 21 + 21.5 * sh;
    K.shadow.raw(F.camX, 0.09, sz, 44, 1, 27, 0, 0, 1, 5, (day ? 0.62 : 0.74) * Math.min(1, 0.45 + sh) * (1 - 0.6 * b) * Math.min(1, lt));
    if (!day && sh > 0.3) for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2 + F.clock / 2600; K.flat.put(F.camX + Math.cos(a) * 8.6, 0.092, sz - Math.sin(a) * 5.2, 1.5, 1, 1.0, 0, 0xffd28a, 1, 0, 0.3 * (sh - 0.3) * (1 - b)); }   // (its rim lights on the road)
    // THE SHIP: its lit rim peeks over the top in the warning's last seconds, then it comes down over the top third
    if (ship.el && !ship.prime) {
      const y = -100 + 32 * peek + 60 * down;   // (% of its own height: −100 = wholly above the screen)
      ship.y = y;
      set(ship.el, 't', `translate3d(-50%,${y.toFixed(1)}%,0)`); set(ship.el, 'o', peek > 0 || down > 0 ? '1' : '0');
      if (ship.glow) set(ship.glow, 'o', (reduce ? 0.7 : 0.45 + 0.4 * Math.sin(F.clock / 190) + 0.15 * down).toFixed(2));
    }
    // THE BEAM (the arrival): ONE huge white-gold beam from its port over the road — a real cone (a bright heart, a soft edge), its pool
    // + ring on the lanes, motes rising — and everything OUTSIDE it goes dark (.jw-ship-shade): the beam + the kids are what is lit
    set(ship.shade, 'o', b.toFixed(2));
    set(ship.wash, 'o', (arr >= 0 ? 0.55 * Math.max(0, 1 - Math.abs(arr - 520) / 200) : 0).toFixed(2));
    if (b > 0.004) {
      const cz = F.kz - 4.5, pu = reduce ? 1 : 0.9 + 0.1 * Math.sin(F.clock / 150), h = 17, y = h / 2 - 0.2;
      K.bill.put(F.camX, y, cz - 1.5, 12.5, h, 1, 0, 0xffd98a, 1, 9, (day ? 0.5 : 0.3) * b * pu);
      K.bill.put(F.camX, y, cz - 1.5, 6.5, h, 1, 0, 0xfff4d2, 1, 9, (day ? 0.34 : 0.13) * b * pu);
      K.flat.put(F.camX, 0.085, cz + 1, 14, 1, 11, 0, 0xffe0a0, 1, 0, (day ? 0.4 : 0.2) * b); K.flat.put(F.camX, 0.086, cz + 1, 12.5, 1, 9, 0, 0xfff0c8, 1, 3, (day ? 0.9 : 0.55) * b * pu);
      if (!reduce) for (let i = 0; i < 18; i++) { const m = (F.clock / 1300 + i * 0.618) % 1, a = i * 2.39; K.bill.put(F.camX + Math.cos(a) * (0.8 + (i % 5) * 0.75) * (1 - 0.6 * m), m * 10, cz + Math.sin(a) * (0.8 + (i % 4) * 0.8), 0.2, 0.2, 1, 0, 0xfff6dc, 1, 5, Math.sin(m * Math.PI) * b); }
    }
    // THE SOUNDS: the UFO's hum pitched down + the rumble, both building through the warning; the beam + the lift as it arrives
    if (!snd.ship) { snd.ship = mix('ufo-hum@ship', { gain: 0.02 }); snd.rum = rumble(); }
    if (arr < 0) snd.shipAt = -1;
    const lv = arr >= 0 ? Math.max(0, 1 - Math.max(0, arr - 2600) / 1500) : 0.12 + 0.88 * w * w;
    snd.ship.gain(MIX['ufo-hum@ship'].gain * lv, 0.3); if (snd.rum) snd.rum.gain(DUCK.rumble * lv);
    duckK = Math.min(duckK, arr >= 0 ? DUCK.ship + (1 - DUCK.ship) * clamp01((arr - 3000) / 1500) : DUCK.warn + (1 - DUCK.warn) * (1 - Math.min(1, w * 4)));
    if (arr >= 0 && arr < 900 && snd.shipAt < 0) { snd.shipAt = F.clock; mix('ufo-beam-on@ship'); setTimeout(() => { if (!dead && ship.on) mix('ufo-lift@ship'); }, 600); }
  }
  function shipOff() {
    ship.on = false; ship.sec = -1;
    for (const e of [ship.el, ship.dim, ship.shade, ship.wash, ship.txt]) set(e, 'o', '0');
    if (snd.ship) snd.ship.stop(0.5); if (snd.rum) snd.rum.stop(0.5); snd.ship = snd.rum = null;
  }
  /** how far a kid THE MOTHERSHIP is lifting has risen: ms since it took him → { y, spin, q (0 … 1; 1 = inside it) } — he is drawn to
   *  the beam's own middle as he goes (night.js) */
  const lifted = ms => { const q = clamp01((ms - 520) / FLY.liftMs); return { y: 13 * q * q * (3 - 2 * q), spin: reduce ? 0 : ms * 0.0022, q }; };

  /** the frame's end: what was not drawn this frame is put away; the UFO's hum follows how near it is */
  function end() {
    flush();
    for (let i = nj; i < jets.length; i++) jets[i].visible = false;
    for (let i = nf; i < flames.length; i++) flames[i].visible = false;
    for (let i = nu; i < ufos.length; i++) { ufos[i].m.visible = false; ufos[i].id = -1; }
    // (the kid's own moments are asked for BEFORE begin(): what they counted is closed here, at the frame's end)
    for (let i = nk; i < sparks.length; i++) sparks[i].q0 = -1;
    if (!fxUsed && fxHad && ship.fxc) ship.fxc.clearRect(0, 0, ship.fx.width, ship.fx.height);
    fxHad = fxUsed; fxUsed = false;
    // THE MUSIC's DUCK this frame: the deepest of what is on — THE ABDUCTION (his own) · THE BLACKBIRD's pass · THE MOTHERSHIP
    duckNow = Math.min(duckK, duckJ, dimNow > 0.02 ? DUCK.ufo : 1); duckK = 1; duckJ = 1;
    dimSet(); nk = 0; dimNow = 0;
    if (abd.on && F.clock - abd.t0 > FLY.abductMs + 900) abd.on = false;
    const want = F.own && F.alive && humD < 8 ? MIX['ufo-hum'].gain * Math.pow(1 - humD / 8, 1.5) : 0;
    if (want > 0.004 && !snd.hum) snd.hum = mix('ufo-hum', { gain: want });
    else if (snd.hum) { if (want <= 0.004 && humD > 12) { snd.hum.stop(0.6); snd.hum = null; } else snd.hum.gain(want, 0.25); }
  }
  return {
    begin, jet, blast, ufo, abduct, lift, lifted, ship: shipAt, end, holdMs,
    /** how much of its level the music keeps under the moment on screen (1 = no moment — DUCK) */
    duck: () => duckNow,
    /** the camera's small shake this frame (cells — THE BLACKBIRD's pass; 0 with reduce motion) */
    shake: () => shakeNow,
    /** the meshes night.js's warm frame must have seen (their programs + buffers made before the moment, never in it) */
    meshes: () => [...jets, ...flames, ...ufos.map(q => q.m)],
    info: () => ({ models: Object.keys(geo), jets: jets.filter(m => m.visible && Math.abs(m.position.x) < 6.5).length, ufos: ufos.filter(q => q.m.visible).length, ship: !!(ship.cv && ship.cv.width), shipOn: ship.on, shipText: ship.txt ? ship.txt.textContent : '', abducting: abd.on, dim: dimO, sparks: sparks.filter(q => q.q0 >= 0).length, sounds: played.slice() }),
    /** H6B — THE END SCREEN's MEMORY (night.js#rest): THE MOTHERSHIP's sprite — 6.5 MB of canvases, baked at a match's start so her
     *  arrival costs no frame — is LET GO while the end screen covers the scene, unless she is up on it (the gold finish: the top of
     *  the end screen is see-through); baked again as the scene wakes (the next match's count) */
    rest(on) {
      // (the go-live review: behind an end screen nothing is drawn — the Mothership's hum + rumble stayed at the level of their last
      //  frame and the music stayed ducked through the whole podium. They fade out as the scene rests; the music comes back up.)
      if (on) { const f = ship.on ? 2.4 : 0.6; if (snd.ship) snd.ship.stop(f); if (snd.rum) snd.rum.stop(f); snd.ship = snd.rum = null; duckNow = 1; }
      if (!ship.el || !ship.cv) return;
      if (!on) { if (!ship.cv.width) bakeAsk = true; return; }
      if (ship.on) return;
      for (const cv of [ship.cv, ship.glow, ship.fx]) if (cv) { cv.width = 0; cv.height = 0; }
    },
    /** the world goes quiet (a run's end / a new run / the view leaves): the loops fade */
    quiet() { if (snd.hum) { snd.hum.stop(0.4); snd.hum = null; } if (snd.ship && !ship.on) { snd.ship.stop(0.4); if (snd.rum) snd.rum.stop(0.4); snd.ship = snd.rum = null; } },
    destroy() {
      dead = true; offBed(); bufs.clear(); bufCtx = null;   // (the decoded moments' sounds — the hum alone is ≈ 6 MB — go with the scene; the fetched bytes stay)
      if (snd.hum) snd.hum.stop(0.2); if (snd.ship) snd.ship.stop(0.2); if (snd.rum) snd.rum.stop(0.2);
      for (const m of [...jets, ...flames]) scene.remove(m); for (const q of ufos) { scene.remove(q.m); q.m.material.dispose(); }
      jetMat.dispose(); flameMat.dispose(); for (const g of Object.values(geo)) g.dispose();
      for (const e of [ship.el, ship.dim, ship.shade, ship.wash, ship.txt, dimEl]) if (e) e.remove();
      for (const cv of [ship.cv, ship.glow, ship.fx]) if (cv) { cv.width = 0; cv.height = 0; }
    },
  };
}
