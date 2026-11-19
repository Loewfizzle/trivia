// HIGH RISE — THE FLYERS (S3 — docs/highrise.md "THE FLYERS"): SPECTACLE ONLY — never a hazard, never over the play zone, never under
// the HUD's numbers. A VIEW + its sounds: the rules, the replay and the judge know nothing of it.
//   THE SKYLINE FLYBY (a seeded floor, 35–45): the seed's flyerFor picks ONE — THE BLACKBIRD alone, or TWO F-22s in tight formation —
//     crossing BEHIND the tower in ~3 s, banking round it so its top side shows. Night: burner glow + nav lights; day: white vapour
//     trails. The city's jet sound, panned with it.
//   THE UFO (floor 85): drifts across behind the tower — AMBER running lights round its rim + a soft VIOLET underglow; NO beam, NO
//     ground ring (never JAYWALK's green). The city's UFO hum, quiet.
//   THE MOTHERSHIP: from floor ~180 a colossal dark ship with many small lights comes down overhead; at FLOOR 200 — SOLO: it passes as
//     a moment (the camera glances up, its lights pulse), then it leaves and the climb goes on into DEEP SPACE · MATCH: THE FINISH —
//     a white-gold light pours onto the top slab.
// ONE module, fetched ON DEMAND by the page (from floor 20); each MODEL + its sounds when its own moment nears (`need`) — the jets'
// from ~floor 20, the UFO's from ~70, THE MOTHERSHIP's from ~160 — its buffers uploaded in an ordinary frame long before it flies
// (night.js#STAGE.upload). The two programs every flyer is drawn with were built in THE WARM FRAME (THE LAG RULES). Each flyer is
// REMOVED + FREED after its moment.
// A flyer is placed in THE CAMERA's OWN FRAME (a place on the screen + a depth BEHIND the tower): it holds its band of sky — between
// the HUD's foot and THE DROP ZONE's upper edge — while the tower climbs.
// MODELS: assets/jaywalk/models/{blackbird,ufo}.glb (JAYWALK's own files — shared, cached; Sr-71 by Kiiba, CC BY 4.0 · Flying
// saucer: Poly by Google, CC BY 3.0) + assets/highrise/models/f22.glb ("F22 Raptor FREE" by NLM, CC BY 4.0 — the city's source model,
// thinned: scripts/bake/highrise-f22.mjs). The credits: assets/highrise/models/CREDITS.md. THE MOTHERSHIP's hull is BUILT IN CODE
// (`shipHull` — a smooth panelled disc: JAYWALK's mothership.glb is a 28-sided saucer, and at 2.7 screen widths its rim read as a
// polygon): nothing is fetched for it but its sounds.
import { parseGlb, MODEL_REV } from '../jaywalk/models.js';
import { getContext, getSfxBus, isUnlocked } from '../../audio/engine.js';

const JW = new URL('../../../assets/jaywalk/models/', import.meta.url), HI = new URL('../../../assets/highrise/models/', import.meta.url), CITY = new URL('../../../audio/city/', import.meta.url);
export const HI_MODEL_REV = 1;   // (bump when f22.glb is replaced)
const MODELS = { blackbird: [JW, MODEL_REV], ufo: [JW, MODEL_REV], mothership: null, f22: [HI, HI_MODEL_REV] };
/** ITS NUMBERS (the tests read them): seconds, shares of the screen's width, floors */
export const FLY = Object.freeze({
  jetS: 3.4, bank: 0.9,                         // the flyby: how long it takes to cross, how far it banks (rad — ≈ 52°)
  jetW: 0.46, f22W: 0.28,                        // a jet's length on the screen (× the screen's width): THE BLACKBIRD · each F-22 of the pair
  ufoS: 8, ufoW: 0.36,                          // the UFO: its drift across, how wide it is
  shipFrom: 178, shipAt: 200, shipW: 2.7,       // THE MOTHERSHIP: seen from this floor, colossal at this one, how wide (× the screen)
  passS: 5.4, pourS: 2.6,                       // solo: the moment + its leaving · the match: the finish's light before the end card
});
/** THE MIX: the city's own files into the SFX bus — the gain, the rate, where the take's loudest moment is (it lands on the pass's middle) */
export const MIX = Object.freeze({
  'jet-scream': { gain: 0.5, peak: 2.4 },                     // THE BLACKBIRD
  'jets-formation': { gain: 0.5, peak: 4.8 },                 // the F-22 pair ("the city's jet sound")
  'ufo-hum': { gain: 0.13, loop: true },                      // THE UFO — quiet
  'ufo-hum@ship': { gain: 0.42, rate: 0.5, loop: true },      // THE MOTHERSHIP — the deep hum, building as it comes down
  'ufo-beam-on@ship': { gain: 0.6, rate: 0.62, at: 2.6 },     // … its light (the finish) / its pulse (the solo moment)
});
const SOUNDS_OF = { blackbird: ['jet-scream'], f22: ['jets-formation'], ufo: ['ufo-hum'], mothership: ['ufo-hum', 'ufo-beam-on'] };

// ---- THE SOUNDS: the city's own files through the SHARED engine's SFX bus (the Effects slider, the toggle, THE ONE MUTE + THE CUT
// apply there). Audio is polish: locked, muted, a missing file → nothing plays, nothing throws. An effect asks isUnlocked() — a
// NAPPING context (the site's music off) is woken by a source's own start.
const bytes = new Map(), bufs = new Map(), played = [];
let bufCtx = null;
function sfetch(n) { if (!bytes.has(n)) bytes.set(n, fetch(new URL(`${n}.mp3`, CITY)).then(r => (r.ok ? r.arrayBuffer() : null)).catch(() => null)); return bytes.get(n); }
function sbuf(n) {
  const ctx = getContext();
  if (!ctx) return Promise.resolve(null);
  if (bufCtx !== ctx) { bufs.clear(); bufCtx = ctx; }
  if (!bufs.has(n)) bufs.set(n, sfetch(n).then(a => (a ? new Promise((res, rej) => { const q = ctx.decodeAudioData(a.slice(0), res, rej); if (q && q.catch) q.catch(rej); }) : null)).catch(() => null));
  return bufs.get(n);
}
/** play one of THE MIX's rows now → a handle { gain(v, s), stop(fadeS) }; `pan` = a number, or [from, to, seconds] (it rides with the flyer) */
function play(id, o = {}) {
  const n = id.replace(/@.*/, ''), m = { ...MIX[id], ...o };
  played.push(id); if (played.length > 40) played.shift();
  const H = { src: null, g: null, want: m.gain == null ? 1 : m.gain, dead: false,
    gain(v, s = 0.3) { H.want = v; try { if (H.g) H.g.gain.setTargetAtTime(v, getContext().currentTime, Math.max(0.01, s / 3)); } catch { /* silent */ } },
    stop(f = 0.4) { H.dead = true; try { if (H.src) { const c = getContext(), t = c.currentTime; H.g.gain.cancelScheduledValues(t); H.g.gain.setValueAtTime(H.g.gain.value, t); H.g.gain.linearRampToValueAtTime(0, t + f); H.src.stop(t + f + 0.03); } } catch { /* ended */ } } };
  try {
    if (!isUnlocked()) return H;
    const born = getContext().currentTime;
    sbuf(n).then(b => {
      const ctx = getContext();
      if (!b || H.dead || !ctx || !isUnlocked() || (!m.loop && ctx.currentTime - born > 0.5)) return;
      const src = ctx.createBufferSource(), g = ctx.createGain(), t = ctx.currentTime;
      src.buffer = b; src.playbackRate.value = m.rate || 1; src.loop = !!m.loop;
      if (m.loop) { src.loopStart = 0.08; src.loopEnd = Math.max(0.2, b.duration - 0.08); }
      g.gain.value = 0; g.gain.setTargetAtTime(H.want, t, m.loop ? 0.3 : 0.04);
      let tail = g;
      if (m.pan != null && ctx.createStereoPanner) {
        try {
          const p = ctx.createStereoPanner(), cl = v => Math.max(-1, Math.min(1, v));
          if (Array.isArray(m.pan)) { p.pan.setValueAtTime(cl(m.pan[0]), t); p.pan.linearRampToValueAtTime(cl(m.pan[1]), t + m.pan[2]); } else p.pan.value = cl(m.pan);
          g.connect(p); tail = p;
        } catch { tail = g; }
      }
      src.connect(g); tail.connect(getSfxBus() || ctx.destination);
      src.start(0, Math.min(Math.max(0, m.at || 0), Math.max(0, b.duration - 0.05)));
      H.src = src; H.g = g;
    }).catch(() => {});
  } catch { /* silent */ }
  return H;
}

/**
 * A FLYER's MODEL, READ FAST (THE LAG RULES — a model lands mid-run, on a slow phone too): our flyers' GLBs are ONE layout (16 bytes a
 * vertex: position int16 × 3 · a pad · normal int8 × 3 · a spare byte · colour u8 × 4 — scripts/build-jaywalk-assets.py#write_glb,
 * scripts/bake/highrise-f22.mjs), so they are read straight through typed arrays — ~0.3 ms for the F-22's 16,000 vertices, where the
 * general reader (JAYWALK's parseGlb: one DataView call a number) takes ~10. Any other layout → the general reader.
 */
const LIN = new Float32Array(256);
for (let i = 0; i < 256; i++) { const c = i / 255; LIN[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
export function readFlyer(THREE, buf) {
  try {
    const dv = new DataView(buf);
    if (dv.getUint32(0, true) !== 0x46546c67) return parseGlb(buf);
    const jl = dv.getUint32(12, true), json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jl))), bin = 20 + jl + 8;
    const A = json.accessors, V = json.bufferViews, n = A[0].count, at = bin + (V[0].byteOffset || 0), k = ((json.nodes[0].scale || [1])[0]) / 32767;
    if ((V[0].byteStride || 0) !== 16 || A[0].componentType !== 5122 || A[1].componentType !== 5120 || A[2].componentType !== 5121 || A[3].componentType !== 5123 || at % 2) return parseGlb(buf);
    const i16 = new Int16Array(buf, at, n * 8), i8 = new Int8Array(buf, at, n * 16), u8 = new Uint8Array(buf, at, n * 16);
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (let v = 0, o = 0; v < n; v++, o += 3) {
      const a = v * 8, b2 = v * 16;
      pos[o] = i16[a] * k; pos[o + 1] = i16[a + 1] * k; pos[o + 2] = i16[a + 2] * k;
      nor[o] = i8[b2 + 8] / 127; nor[o + 1] = i8[b2 + 9] / 127; nor[o + 2] = i8[b2 + 10] / 127;
      col[o] = LIN[u8[b2 + 12]]; col[o + 1] = LIN[u8[b2 + 13]]; col[o + 2] = LIN[u8[b2 + 14]];
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setIndex(new THREE.BufferAttribute(new Uint16Array(buf, bin + (V[1].byteOffset || 0), A[3].count), 1));
    return g;
  } catch { return parseGlb(buf); }
}

/** THE UFO's rim lamps (the tests read them): a lamp is OFF while its face is turned from the lens (facing ≤ LAMP_FROM), full from LAMP_FULL */
export const LAMP_FROM = 0.03, LAMP_FULL = 0.25;
const PI = Math.PI, TAU = PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = v => { const t = clamp01(v); return t * t * (3 - 2 * t); };
// where a jet's lights sit, in its own model (1 long, nose + z, + x = its LEFT wing): the two nozzles · the wing tips · the tail
const JET = {
  blackbird: { noz: [[0.118, 0.05, -0.47], [-0.118, 0.05, -0.47]], tip: [0.25, 0.035, -0.3], tail: [0, 0.12, -0.42], mid: 0.06, tint: 1.5, tintDay: 0.3, lift: 0.8, rim: [0.3, 0.58, 1.0], burn: [0.55, 0.78, 1.0], w: 'jetW', snd: 'jet-scream' },
  f22: { noz: [[0.045, 0.085, -0.47], [-0.045, 0.085, -0.47]], tip: [0.35, 0.07, -0.26], tail: [0, 0.2, -0.38], mid: 0.09, tint: 1.7, tintDay: 0.9, lift: 0.62, rim: [1.0, 0.42, 0.78], burn: [1.0, 0.5, 0.55], w: 'f22W', snd: 'jets-formation' },
};
// THE MOTHERSHIP's lights: rings on its belly (its share of the ship's width, how many, their colour, the way the ring turns)
// THE MOTHERSHIP's lights: MANY SMALL ONES — rings on its belly (its share of the ship's width, how many, their colour, the way the ring
// turns, its height on the hull), every `BIG`-th one a brighter lamp; its rim's; a lens at its heart
const RINGS = [[0.095, 14, [1.0, 0.92, 0.72], -1, -0.034], [0.15, 26, [1.0, 0.92, 0.72], 1, -0.03], [0.27, 48, [1.0, 0.68, 0.28], -1, -0.012], [0.39, 72, [0.6, 0.9, 1.0], 1, 0.014]];
const RIM = [0.5, 64, [0.85, 0.92, 1.0], 0.078], BIG = 8;
const GOLD = [1, 0.84, 0.42];
/**
 * THE MOTHERSHIP's HULL, built in code: a disc of revolution 1 across (its belly down, − y) — a lens at its heart, three stepped
 * terraces (the lights' rings sit on their lips), a thick rim — 120 sides (smooth at any size). DARK STEEL PLATING: every terrace is
 * three bands of plates, each plate its own near-black shade, a darker seam between two (finer toward the rim: 15 · 30 · 40 · 60
 * plates a band), the steps between the terraces darker still. Seen only from below. → a geometry: position · normal · color (linear).
 */
const HULL = [[0, -0.036], [0.052, -0.036], [0.064, -0.02], [0.14, -0.03], [0.152, -0.018], [0.26, -0.012], [0.272, 0.0], [0.38, 0.014], [0.392, 0.026], [0.468, 0.05], [0.5, 0.07], [0.5, 0.088], [0.44, 0.104], [0.3, 0.135], [0.15, 0.2], [0, 0.22]];
export function shipHull(THREE, sides = 120) {
  const hash = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };
  // the bands: a terrace (a long shallow segment) is split in three, a step / the lens / the rim / the top stay whole
  const bands = [];
  for (let j = 0; j + 1 < HULL.length; j++) {
    const [r0, y0] = HULL[j], [r1, y1] = HULL[j + 1], step = Math.abs(y1 - y0) > Math.abs(r1 - r0) * 0.8, n = !step && j > 0 && j < 10 && r1 - r0 > 0.05 ? 3 : 1;
    for (let k = 0; k < n; k++) bands.push({ r0: r0 + (r1 - r0) * k / n, y0: y0 + (y1 - y0) * k / n, r1: r0 + (r1 - r0) * (k + 1) / n, y1: y0 + (y1 - y0) * (k + 1) / n, step, lens: j === 0, rim: j === 10, top: j > 10 });
  }
  const pos = new Float32Array(bands.length * sides * 18), nor = new Float32Array(pos.length), col = new Float32Array(pos.length);
  let o = 0;
  bands.forEach((B, j) => {
    let nr = B.y1 - B.y0, ny = -(B.r1 - B.r0); const nl = Math.hypot(nr, ny) || 1; nr /= nl; ny /= nl;   // (the band's own normal: outward — down under the belly)
    const mid = (B.r0 + B.r1) / 2, per = mid < 0.1 ? 8 : mid < 0.2 ? 4 : mid < 0.33 ? 3 : 2, shift = j % 2 ? per >> 1 : 0;
    for (let i = 0; i < sides; i++) {
      const a0 = i / sides * TAU, a1 = (i + 1) / sides * TAU, k = Math.floor((i + shift) / per), seam = (i + shift) % per === 0 && !B.step && !B.lens && !B.rim;
      const sh = B.lens ? 1 : B.rim ? 0.1 : B.step ? 0.006 : B.top ? 0.03 : Math.max(0.008, 0.026 + 0.05 * hash(j, k) - (seam ? 0.022 : 0));
      const c0 = B.lens ? 0.5 : sh * 0.9, c1 = B.lens ? 0.4 : sh, c2 = B.lens ? 0.24 : sh * (B.rim ? 1.16 : 1.26);
      const ca0 = Math.cos(a0), sa0 = Math.sin(a0), ca1 = Math.cos(a1), sa1 = Math.sin(a1);
      // (two triangles: inner·a0, outer·a0, outer·a1 — inner·a0, outer·a1, inner·a1: outward-facing)
      const P6 = [B.r0, B.y0, ca0, sa0, B.r1, B.y1, ca0, sa0, B.r1, B.y1, ca1, sa1, B.r0, B.y0, ca0, sa0, B.r1, B.y1, ca1, sa1, B.r0, B.y0, ca1, sa1];
      for (let v = 0; v < 6; v++) {
        const r = P6[v * 4], y = P6[v * 4 + 1], cc = P6[v * 4 + 2], ss = P6[v * 4 + 3];
        pos[o] = r * cc; pos[o + 1] = y; pos[o + 2] = r * ss; nor[o] = nr * cc; nor[o + 1] = ny; nor[o + 2] = nr * ss; col[o] = c0; col[o + 1] = c1; col[o + 2] = c2; o += 3;
      }
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

/** the flyers on a scene's stage (night.js#STAGE) → { need, start, frame, reset, info, destroy } */
export function createFlyers(S) {
  const { THREE } = S, V3 = () => new THREE.Vector3(), LG = S.LG;   // (LG: a light's 14 numbers — written here, read by S.lit(): no call ever hands a fraction over — S4A FIX)
  const P = V3(), P1 = V3(), Pb = V3(), f = V3(), r = V3(), u = V3(), r2 = V3(), u2 = V3(), b = V3(), c = V3(), q = V3(), w = V3(), UP = new THREE.Vector3(0, 1, 0), M = new THREE.Matrix4(), SC = V3();
  const geo = {}, asked = {};
  let dead = false, jet = null, ufo = null, sparkAt = 0, hushed = false;
  const ship = { k: 0, vis: false, pass: null, pour: null, done: false, force: false, hum: null, ringT: -9, cut: null };
  const boxes = { jet: null, ufo: null, ship: null };
  const offBed = (globalThis.__nsAudioBeds || (() => () => {}))({ pause() { quiet(0.02); }, resume() {} });
  function quiet(fade) { for (const o of [jet, ufo, ship]) if (o && o.hum) { o.hum.stop(fade); o.hum = null; } if (jet && jet.snd) { jet.snd.stop(fade); jet.snd = null; } }

  /** a flyer's model + sounds, AHEAD of its moment: the bytes now, the model's buffers to the GPU in the next ordinary frame */
  function need(kind) {
    if (!(kind in MODELS)) return;
    for (const n of SOUNDS_OF[kind]) { sfetch(n); try { if (isUnlocked()) sbuf(n); } catch { /* at its play, then */ } }
    if (asked[kind]) return;
    asked[kind] = true;
    if (kind === 'mothership') { const g = shipHull(THREE); geo[kind] = g; S.upload(g); return; }   // (built in code — ~5 ms, forty floors before it shows)
    const [dir, rev] = MODELS[kind];
    fetch(new URL(`${kind}.glb?v=${rev}`, dir)).then(res => (res.ok ? res.arrayBuffer() : null)).then(buf => {
      if (!buf || dead || !asked[kind]) { if (!buf) asked[kind] = false; return; }
      const g = readFlyer(THREE, buf); geo[kind] = g; S.upload(g);
    }).catch(() => { asked[kind] = false; });
  }
  /** FREED after its moment (the next run fetches it again — from the phone's own cache) */
  function drop(kind) { const g = geo[kind]; if (g) { try { g.dispose(); } catch { /* gone */ } delete geo[kind]; } asked[kind] = false; }
  const hide = i => { const s = S.slots[i]; s.mesh.visible = false; s.mesh.geometry = S.standIn; };

  // ---- the camera's own frame (night.js#FR): a place on the screen (x, y in −1 … 1, y up) at a depth → the world
  const toWorld = (out, F, x, y, D) => out.set(F.px, F.py, F.pz).addScaledVector(F.Z, -D).addScaledVector(F.X, x * D * F.th * F.aspect).addScaledVector(F.Y, y * D * F.th);
  /** the sky band the flyers keep to (the HUD's foot … THE DROP ZONE's upper edge): its k-th share → y on the screen (−1 … 1, up) */
  const bandY = (F, k) => 1 - 2 * (F.top + (Math.max(F.top + 0.08, F.bot) - F.top) * k);
  /** a world length that is `share` of the screen's width at depth D */
  const widthAt = (F, D, share) => share * 2 * D * F.th * F.aspect;
  /** a body in its slot: its axes (x, y, z), its size, its origin */
  function body(i, g, ax, ay, az, size, at, F, o) {
    const s = S.slots[i];
    if (s.mesh.geometry !== g) s.mesh.geometry = g;
    s.mesh.visible = true;
    M.makeBasis(ax, ay, az).scale(SC.set(size, size, size)).setPosition(at);
    s.mesh.matrix.copy(M); s.mesh.matrixWorldNeedsUpdate = true;
    s.u.uOpacity.value = o.op; s.u.uHazeK.value = o.haze; s.u.uHazeC.value.copy(F.hz); s.u.uLift.value = o.lift;
    s.u.uTint.value.setScalar(o.tint); s.u.uRim.value.set(o.rim[0], o.rim[1], o.rim[2]); s.u.uEmit.value.set(o.em[0], o.em[1], o.em[2]);
  }
  /** a point → its place on the screen (0 … 1 from the top left) — grows a flyer's box (the pass's own check: never in the play zone) */
  function seen(F, p, box) {
    w.set(p.x - F.px, p.y - F.py, p.z - F.pz);
    const z = -w.dot(F.Z), x = (w.dot(F.X) / (z * F.th * F.aspect) + 1) / 2, y = (1 - w.dot(F.Y) / (z * F.th)) / 2;
    if (x < box[0]) box[0] = x; if (y < box[1]) box[1] = y; if (x > box[2]) box[2] = x; if (y > box[3]) box[3] = y;
  }
  // (a flyer's box + its body's numbers are kept — nothing is made in a frame: THE LAG RULES)
  const BOX = { jet: [0, 0, 0, 0], ufo: [0, 0, 0, 0], ship: [0, 0, 0, 0] }, newBox = k => { const b2 = BOX[k]; b2[0] = b2[1] = 9; b2[2] = b2[3] = -9; return b2; }, JET_O = { op: 1, haze: 0.2, lift: 0, tint: 1, rim: null, em: null };

  /** THE END CARD IS UP (the run is over): a flyer still in the sky fades out in a third of a second — never behind the card's words */
  const cutOf = (o, F) => { if (!hushed) return 1; if (o.cut == null) o.cut = F.t; return 1 - (F.t - o.cut) / 0.35; };
  // ---- THE SKYLINE FLYBY
  const EM0 = [0, 0, 0];
  function jetLights(F, kind, at, len, fade) {
    const J = JET[kind], n = (1 - F.day) * fade, d = F.day * fade;
    for (let k = 0; k < 2; k++) {
      const z = J.noz[k];
      q.copy(at).addScaledVector(r2, z[0] * len).addScaledVector(u2, z[1] * len).addScaledVector(f, z[2] * len);
      if (n > 0.01) {
        // NIGHT: the burner's glow + its flame behind it
        LG[0] = q.x; LG[1] = q.y; LG[2] = q.z; LG[3] = 0.085 * len; LG[4] = 0; LG[5] = J.burn[0]; LG[6] = J.burn[1]; LG[7] = J.burn[2]; LG[8] = 0.95 * n; LG[9] = 0; LG[10] = 0; LG[11] = 0; LG[12] = 0; LG[13] = 0; S.lit();
        LG[0] = q.x - f.x * 0.2 * len; LG[1] = q.y - f.y * 0.2 * len; LG[2] = q.z - f.z * 0.2 * len; LG[3] = 0.034 * len; LG[4] = 0.2 * len; LG[5] = J.burn[0]; LG[6] = J.burn[1]; LG[7] = J.burn[2]; LG[8] = 0.9 * n; LG[9] = 0; LG[10] = 1; LG[11] = f.x; LG[12] = f.y; LG[13] = f.z; S.lit();
      }
      // DAY: a white vapour trail from each engine (a faint cool one by night)
      const tl = 1.05 * len;
      LG[0] = q.x - f.x * tl; LG[1] = q.y - f.y * tl; LG[2] = q.z - f.z * tl; LG[3] = 0.03 * len; LG[4] = tl; LG[5] = 1; LG[6] = 1; LG[7] = 1; LG[8] = 0.78 * d; LG[9] = 1; LG[10] = 2; LG[11] = f.x; LG[12] = f.y; LG[13] = f.z; S.lit();
      if (n > 0.01) { LG[0] = q.x - f.x * tl * 0.7; LG[1] = q.y - f.y * tl * 0.7; LG[2] = q.z - f.z * tl * 0.7; LG[3] = 0.03 * len; LG[4] = tl * 0.7; LG[5] = 0.55; LG[6] = 0.7; LG[7] = 1; LG[8] = 0.16 * n; LG[9] = 0; LG[10] = 2; LG[11] = f.x; LG[12] = f.y; LG[13] = f.z; S.lit(); }
    }
    if (n > 0.01) {
      // the nav lights: red on the left tip, green on the right — and a white strobe on the tail (two quick flashes)
      const ph = (F.t * 1.1) % 1, strobe = ph < 0.06 || (ph > 0.14 && ph < 0.2) ? 1 : 0, T = J.tip;
      q.copy(at).addScaledVector(r2, T[0] * len).addScaledVector(u2, T[1] * len).addScaledVector(f, T[2] * len);
      LG[0] = q.x; LG[1] = q.y; LG[2] = q.z; LG[3] = 0.05 * len; LG[4] = 0; LG[5] = 1; LG[6] = 0.12; LG[7] = 0.1; LG[8] = 0.9 * n; LG[9] = 0; LG[10] = 0; LG[11] = 0; LG[12] = 0; LG[13] = 0; S.lit();
      q.copy(at).addScaledVector(r2, -T[0] * len).addScaledVector(u2, T[1] * len).addScaledVector(f, T[2] * len);
      LG[0] = q.x; LG[1] = q.y; LG[2] = q.z; LG[3] = 0.05 * len; LG[4] = 0; LG[5] = 0.15; LG[6] = 1; LG[7] = 0.3; LG[8] = 0.9 * n; LG[9] = 0; LG[10] = 0; LG[11] = 0; LG[12] = 0; LG[13] = 0; S.lit();
      if (strobe) { q.copy(at).addScaledVector(u2, J.tail[1] * len).addScaledVector(f, J.tail[2] * len); LG[0] = q.x; LG[1] = q.y; LG[2] = q.z; LG[3] = 0.07 * len; LG[4] = 0; LG[5] = 1; LG[6] = 1; LG[7] = 1; LG[8] = n; LG[9] = 0; LG[10] = 0; LG[11] = 0; LG[12] = 0; LG[13] = 0; S.lit(); }
    }
  }
  function frameJet(F) {
    const J = JET[jet.kind], g = geo[jet.kind];
    if (!g) { endJet(); return; }
    if (jet.t0 < 0) {
      jet.t0 = F.t;
      // (its take's loudest moment lands on the pass's middle; panned from the side it comes from to the side it leaves by)
      const m = MIX[J.snd];
      jet.snd = play(J.snd, { at: Math.max(0, m.peak - FLY.jetS / 2), pan: [-0.85 * jet.dir, 0.85 * jet.dir, FLY.jetS] });
    }
    const s = (F.t - jet.t0) / FLY.jetS;
    if (s >= 1) { endJet(); return; }
    const dir = jet.dir, sn = Math.sin(PI * s), Dm = F.dist * 1.25, len = widthAt(F, Dm, FLY[J.w]), two = jet.kind === 'f22';
    // THE PATH: in from one side NEAR, round BEHIND the tower (its far point at the middle), out by the other side
    // (the pair's two jets are centred on the path: it runs a little lower in the band and nearly level — both stay under the HUD's foot)
    const by = bandY(F, two ? 0.53 : 0.5), arc = two ? 0.012 : 0.05;
    toWorld(P, F, dir * (-1.6 + 3.2 * s), by + arc * sn, F.dist * (1.05 + 0.2 * sn));
    const s1 = s + 0.01, sn1 = Math.sin(PI * s1);
    toWorld(P1, F, dir * (-1.6 + 3.2 * s1), by + arc * sn1, F.dist * (1.05 + 0.2 * sn1));
    f.subVectors(P1, P).normalize();
    r.crossVectors(UP, f).normalize(); u.crossVectors(f, r);
    // IT BANKS ROUND THE TOWER: its top side turns to the lens for a beat
    c.set(F.px - P.x, F.py - P.y, F.pz - P.z).normalize();
    const bank = FLY.bank * Math.pow(Math.max(0, sn), 0.8) * (r.dot(c) > 0 ? -1 : 1), cb = Math.cos(bank), sb = Math.sin(bank);
    r2.copy(r).multiplyScalar(cb).addScaledVector(u, sb); u2.copy(u).multiplyScalar(cb).addScaledVector(r, -sb);
    const cut = cutOf(jet, F), fade = Math.min(1, s / 0.05, (1 - s) / 0.05) * cut, o = JET_O, box = newBox('jet');
    o.op = fade; o.lift = J.lift; o.tint = J.tint + (J.tintDay - J.tint) * F.day; o.rim = J.rim; o.em = EM0;
    o.haze = 0.2 - 0.16 * F.day;   // (by day a jet is the DARKEST thing in the sky: hardly any air over it — the review)
    if (cut <= 0) { endJet(); return; }
    const side = r2.dot(c) > 0 ? -1 : 1;
    for (let k = 0; k < (two ? 2 : 1); k++) {
      // (the pair: the wingman a little behind + beside the leader, the same bank — the two CENTRED on the path: neither leaves the band)
      Pb.copy(P); if (two) Pb.addScaledVector(r2, (k ? 0.5 : -0.5) * side * 0.46 * len).addScaledVector(f, (k ? -0.5 : 0.5) * 0.86 * len);
      q.copy(Pb).addScaledVector(u2, -J.mid * len);
      body(k, g, r2, u2, f, len, q, F, o);
      Pb.copy(q);   // (jetLights works in q)
      jetLights(F, jet.kind, Pb, len, fade);
      for (let e = -0.5; e <= 0.5; e += 1) { w.copy(Pb).addScaledVector(f, e * len); seen(F, w, box); w.copy(Pb).addScaledVector(r2, e * 0.74 * len); seen(F, w, box); w.copy(Pb).addScaledVector(u2, e * 0.3 * len); seen(F, w, box); }
    }
    boxes.jet = box;
  }
  function endJet() { if (!jet) return; if (jet.snd) jet.snd.stop(0.6); hide(0); hide(1); drop(jet.kind); jet = null; boxes.jet = null; }

  // ---- THE UFO: amber running lights round its rim + a soft violet underglow — no beam, no ring on anything
  // (a rim lamp's facing — how far its face is turned to the lens, −1 … 1: off at LAMP_FROM and under, full from LAMP_FULL up)
  const AMBER = [1.0, 0.6, 0.1], VIOLET = [0.5, 0.2, 1.0], UFO_O = { op: 1, haze: 0.22, lift: 0.4, tint: 0.68, rim: [1.0, 0.62, 0.2], em: [0, 0, 0] }, LAMP = [1.0, 0.46, 0.02];
  function frameUfo(F) {
    const g = geo.ufo;
    if (!g) { endUfo(); return; }
    if (ufo.t0 < 0) { ufo.t0 = F.t; ufo.hum = play('ufo-hum', { gain: 0, pan: [-0.7 * ufo.dir, 0.7 * ufo.dir, FLY.ufoS] }); }
    const s = (F.t - ufo.t0) / FLY.ufoS;
    if (s >= 1) { endUfo(); return; }
    const D = F.dist * 1.2, wd = widthAt(F, D, FLY.ufoW), cut = cutOf(ufo, F), fade = Math.min(1, s / 0.06, (1 - s) / 0.06) * cut, n = 1 - F.day, d = F.day;
    if (cut <= 0) { endUfo(); return; }
    if (ufo.hum) ufo.hum.gain(MIX['ufo-hum'].gain * Math.min(1, s / 0.15, (1 - s) / 0.2), 0.4);
    toWorld(P, F, ufo.dir * (-1.45 + 2.9 * s), bandY(F, 0.48) + 0.05 * Math.sin(TAU * 1.25 * s), D);
    // seen almost from the side (the lens looks 33° down: it tips ~20° away, wobbling) — the classic saucer, its glow under it
    const a = 0.34 + 0.09 * Math.sin(F.t * 1.3);
    b.set(-F.Z.x, 0, -F.Z.z).normalize();                    // (level, away from the lens)
    u.copy(UP).multiplyScalar(Math.cos(a)).addScaledVector(b, Math.sin(a));
    r.copy(F.X); b.crossVectors(r, u);
    const spin = F.t * 0.9, cs = Math.cos(spin), sn = Math.sin(spin);
    r2.copy(r).multiplyScalar(cs).addScaledVector(b, sn); u2.crossVectors(r2, u);
    q.copy(P).addScaledVector(u, -0.18 * wd);
    UFO_O.op = fade; UFO_O.haze = 0.22 - 0.16 * d; UFO_O.em[0] = VIOLET[0] * (0.9 * n + 0.3 * d); UFO_O.em[1] = VIOLET[1] * (0.9 * n + 0.3 * d); UFO_O.em[2] = VIOLET[2] * (0.9 * n + 0.3 * d);
    body(0, g, r2, u, u2, wd, q, F, UFO_O);
    // THE VIOLET UNDERGLOW: a soft flat pool of light under its belly
    LG[0] = q.x - u.x * 0.04 * wd; LG[1] = q.y - u.y * 0.04 * wd; LG[2] = q.z - u.z * 0.04 * wd; LG[3] = 0.15 * wd; LG[4] = 0.5 * wd; LG[5] = VIOLET[0]; LG[6] = VIOLET[1]; LG[7] = VIOLET[2]; LG[8] = (0.8 * n + 0.5 * d) * fade; LG[9] = 0.45 * d; LG[10] = 0; LG[11] = r.x; LG[12] = r.y; LG[13] = r.z; S.lit();
    // THE AMBER RUNNING LIGHTS: ten round its rim, chasing. A LAMP ON THE FAR SIDE IS HIDDEN BY THE HULL (S4A FIX — the owner: they
    // showed THROUGH the saucer, dimmed to 40 % — a lamp is a glow drawn over the body, so nothing hid it): each lamp sits on the rim's
    // outer face, which looks straight OUT from the saucer's axis (`w`) — it is lit only while that face is turned to the lens
    // (w · the way to the lens > 0): fully off behind the hull, a short smooth fade as it rounds the rim (≈ 13° of its turn), full in front
    c.set(F.px - P.x, F.py - P.y, F.pz - P.z).normalize();
    for (let i = 0; i < 10; i++) {
      const al = i * TAU / 10 + spin, ca = Math.cos(al), sa = Math.sin(al);
      w.copy(r).multiplyScalar(ca).addScaledVector(b, sa);
      const face = ease((w.dot(c) - LAMP_FROM) / (LAMP_FULL - LAMP_FROM)), ch =0.45 + 0.55 * Math.pow(Math.max(0, Math.cos(al - spin - F.t * 3.2)), 3);
      LG[0] = q.x + w.x * 0.47 * wd + u.x * 0.115 * wd; LG[1] = q.y + w.y * 0.47 * wd + u.y * 0.115 * wd; LG[2] = q.z + w.z * 0.47 * wd + u.z * 0.115 * wd; LG[3] = 0.058 * wd; LG[4] = 0; LG[5] = LAMP[0]; LG[6] = LAMP[1]; LG[7] = LAMP[2]; LG[8] = face * ch * fade; LG[9] = 0.9 * d; LG[10] = 4; LG[11] = 0; LG[12] = 0; LG[13] = 0; S.lit();
    }
    const box = newBox('ufo');
    for (let e = -0.5; e <= 0.5; e += 1) { w.copy(P).addScaledVector(r, e * wd); seen(F, w, box); w.copy(P).addScaledVector(u, e * 0.42 * wd); seen(F, w, box); }
    boxes.ufo = box;
  }
  function endUfo() { if (!ufo) return; if (ufo.hum) ufo.hum.stop(0.8); hide(0); drop('ufo'); ufo = null; boxes.ufo = null; }

  // ---- THE MOTHERSHIP
  const SHIP_O = { op: 1, haze: 0.03, lift: 0, tint: 0.5, rim: [0.07, 0.1, 0.22], em: [0, 0, 0] };
  function frameShip(F) {
    const g = geo.mothership, t = F.t;
    if (!ship.vis && !ship.hum && !ship.force && !ship.pass && !ship.pour && (ship.done || F.cf <= FLY.shipFrom)) { ship.k = 0; return; }   // (not in the sky: nothing to work out)
    let k = ship.done ? 0 : ship.force ? 1 : ease((F.cf - FLY.shipFrom) / (FLY.shipAt - FLY.shipFrom));
    if (ship.pass && ship.pass.t0 < 0) { ship.pass.t0 = t; play('ufo-beam-on@ship', { gain: 0.4 }); }
    if (ship.pour && ship.pour.t0 < 0) { ship.pour.t0 = t; play('ufo-beam-on@ship'); }
    if (k <= 0 && !ship.pass && !ship.pour) { if (ship.vis) { hide(2); ship.vis = false; boxes.ship = null; } if (ship.hum) { ship.hum.stop(0.8); ship.hum = null; } ship.k = 0; return; }
    if (ship.pass || ship.pour) k = 1;
    ship.k = k;
    let x = 0.1, y = 2.3 - 1.22 * k, K = 1, op = Math.min(1, k * 2.5), pulse = 0.5 + 0.5 * Math.sin(t * 1.7), gl = 0;
    // (the run ended under it — not THE FINISH: it fades behind the end card's words; THE FINISH's own ship stays, but its lens + the
    //  head of its light are turned down behind the gold card's words)
    let calm = 1;
    if (hushed) { if (ship.cut == null) ship.cut = t; const q2 = Math.min(1, (t - ship.cut) / 0.5); if (ship.pour) calm = 1 - 0.72 * q2; else op *= Math.max(0.22, 1 - q2); }
    if (ship.pass) {
      // SOLO, FLOOR 200: the camera glances up, its lights pulse — then it leaves (up and away) and the climb goes on
      const tp = t - ship.pass.t0, go = clamp01((tp - 2.3) / (FLY.passS - 2.3));
      gl = tp < 1.2 ? ease(tp / 1.2) : tp < 2.4 ? 1 : 1 - ease((tp - 2.4) / 1.6);
      y -= 0.12 * ease(tp / 1.2); pulse = 0.5 + 0.5 * Math.sin(tp * 9);
      x += 1.9 * go * go; y += 1.5 * go * go; K = 1 - 0.45 * go; op = 1 - Math.pow(go, 1.6);
      if (tp >= FLY.passS) { ship.pass = null; ship.done = true; S.glance(0); hide(2); ship.vis = false; boxes.ship = null; drop('mothership'); if (ship.hum) { ship.hum.stop(1.2); ship.hum = null; } return; }
    }
    let beam = 0;
    if (ship.pour) {
      // THE MATCH, FLOOR 200 — THE FINISH: a white-gold light pours onto the top slab
      const tq = t - ship.pour.t0;
      beam = ease(tq / 0.5); gl = 0.5 * ease(tq / 0.9); y -= 0.1 * ease(tq / 0.9); pulse = 0.6 + 0.4 * Math.sin(tq * 6);
      S.pour(beam * (0.8 + 0.2 * Math.sin(tq * 7)));
      if (!F.reduce && t - sparkAt > 0.09 && tq < 6) { sparkAt = t; S.spark(F.tx + (Math.random() - 0.5) * 0.7, F.ty + 0.02, F.tz + (Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.3, 1.6 + Math.random() * 1.4, (Math.random() - 0.5) * 0.3, 0.5 + Math.random() * 0.4, 0.007, GOLD); }
    }
    S.glance(gl);
    if (!ship.hum && !ship.done) ship.hum = play('ufo-hum@ship', { gain: 0 });
    if (ship.hum) ship.hum.gain(MIX['ufo-hum@ship'].gain * k * op, 0.5);
    const D = F.dist * 2.2, wd = widthAt(F, D, FLY.shipW * K), d = F.day;
    toWorld(P, F, x, y, D);
    // seen FROM BELOW: its belly turned down to the lens (26° under its rim's plane); it turns slowly
    const e = 0.45;
    u.copy(F.Y).multiplyScalar(Math.cos(e)).addScaledVector(F.Z, -Math.sin(e));
    r.copy(F.X); b.crossVectors(r, u);
    const spin = t * 0.045, cs = Math.cos(spin), sn = Math.sin(spin);
    r2.copy(r).multiplyScalar(cs).addScaledVector(b, sn); u2.crossVectors(r2, u);
    if (g) {
      // (the hull stays DARK — at THE FINISH too: only its lens + its lights give light; the gold card's words stand on it)
      SHIP_O.op = op; SHIP_O.tint = 0.5 + 0.4 * d; const em = 0.012 + 0.014 * pulse; SHIP_O.em[0] = em; SHIP_O.em[1] = em * 0.74; SHIP_O.em[2] = em * 0.42;
      body(2, g, r2, u, u2, wd, P, F, SHIP_O); ship.vis = true;
      // ITS MANY SMALL LIGHTS: three rings on its belly, each turning its own way, a wave running through them; its rim's; its lens
      const hw = 0.0027 * wd, paint = 0.2 * d;
      for (let j = 0; j < RINGS.length; j++) {
        const R = RINGS[j], col = R[2];
        for (let i = 0; i < R[1]; i++) {
          const al = i * TAU / R[1] + spin * R[3] * 3, ca = Math.cos(al), sa = Math.sin(al), br = (0.5 + 0.5 * Math.sin(t * 2.2 - j * 1.4 + i * 0.7)) * (0.55 + 0.45 * pulse);
          const h = (R[4] - 0.004) * wd, big = i % BIG === 0;
          LG[0] = P.x + (r.x * ca + b.x * sa) * R[0] * wd + u.x * h; LG[1] = P.y + (r.y * ca + b.y * sa) * R[0] * wd + u.y * h; LG[2] = P.z + (r.z * ca + b.z * sa) * R[0] * wd + u.z * h; LG[3] = big ? hw * 2.3 : hw; LG[4] = 0; LG[5] = col[0]; LG[6] = col[1]; LG[7] = col[2]; LG[8] = (big ? 0.6 + 0.4 * br : 0.4 + 0.6 * br) * op; LG[9] = paint; LG[10] = 0; LG[11] = 0; LG[12] = 0; LG[13] = 0; S.lit();
        }
      }
      for (let i = 0; i < RIM[1]; i++) {
        const al = i * TAU / RIM[1] - spin * 2, ca = Math.cos(al), sa = Math.sin(al), col = RIM[2];
        LG[0] = P.x + (r.x * ca + b.x * sa) * RIM[0] * wd + u.x * RIM[3] * wd; LG[1] = P.y + (r.y * ca + b.y * sa) * RIM[0] * wd + u.y * RIM[3] * wd; LG[2] = P.z + (r.z * ca + b.z * sa) * RIM[0] * wd + u.z * RIM[3] * wd; LG[3] = hw; LG[4] = 0; LG[5] = col[0]; LG[6] = col[1]; LG[7] = col[2]; LG[8] = (0.55 + 0.3 * pulse) * op; LG[9] = paint; LG[10] = 0; LG[11] = 0; LG[12] = 0; LG[13] = 0; S.lit();
      }
      LG[0] = P.x - u.x * 0.04 * wd; LG[1] = P.y - u.y * 0.04 * wd; LG[2] = P.z - u.z * 0.04 * wd; LG[3] = 0.085 * wd; LG[4] = 0; LG[5] = 1; LG[6] = 0.88; LG[7] = 0.58; LG[8] = (0.55 + 0.35 * pulse + beam) * op * calm; LG[9] = paint; LG[10] = 0; LG[11] = 0; LG[12] = 0; LG[13] = 0; S.lit();
      const box = newBox('ship');
      for (let s = -0.5; s <= 0.5; s += 1) { w.copy(P).addScaledVector(r, s * wd); seen(F, w, box); w.copy(P).addScaledVector(b, s * wd); seen(F, w, box); }
      boxes.ship = box;
    } else if (ship.vis) { hide(2); ship.vis = false; }
    if (beam > 0.01) {
      // THE LIGHT: a cone from where the ship's lens is SEEN down to the top slab — its head is put at the SLAB's own depth (an axis
      // square to the lens: both its ends land where they are seen — the ship itself is far behind the tower), wide + brightest on the
      // slab; warm gold in its own colour (added to an aurora it went white); a pool on the slab's top
      q.set(F.tx, F.ty + 0.02, F.tz);
      w.set(P.x - u.x * 0.04 * wd - F.px, P.y - u.y * 0.04 * wd - F.py, P.z - u.z * 0.04 * wd - F.pz);
      const zl = -w.dot(F.Z), xn = w.dot(F.X) / (zl * F.th * F.aspect), yn = Math.min(1.3, w.dot(F.Y) / (zl * F.th));
      w.set(q.x - F.px, q.y - F.py, q.z - F.pz);
      toWorld(P1, F, xn, yn, -w.dot(F.Z));
      w.subVectors(P1, q);
      const L = w.length(), keep = 0.5 + 0.5 * calm; w.multiplyScalar(1 / L);
      LG[0] = (P1.x + q.x) / 2; LG[1] = (P1.y + q.y) / 2; LG[2] = (P1.z + q.z) / 2; LG[3] = 0.66; LG[4] = L / 2; LG[5] = 1; LG[6] = 0.8; LG[7] = 0.36; LG[8] = 0.66 * beam * keep; LG[9] = 0.45 + 0.2 * d; LG[10] = 3; LG[11] = w.x; LG[12] = w.y; LG[13] = w.z; S.lit();
      LG[0] = q.x; LG[1] = q.y; LG[2] = q.z; LG[3] = 0.36; LG[4] = 0.95; LG[5] = 1; LG[6] = 0.84; LG[7] = 0.42; LG[8] = 0.85 * beam; LG[9] = 0.35; LG[10] = 0; LG[11] = F.X.x; LG[12] = F.X.y; LG[13] = F.X.z; S.lit();
      // … and gold rings keep running off the slab while it pours
      if (ship.pour && t - ship.ringT > 0.8 && t - ship.pour.t0 < 7) { ship.ringT = t; S.ring(0.85, 1.0, GOLD, 0.75); }
    }
  }

  function frame(F) {
    if (jet) frameJet(F);
    if (ufo) frameUfo(F);
    frameShip(F);
  }
  /** a moment: 'blackbird' | 'f22' · 'ufo' · 'pass' · 'pour' · ('ship' = THE MOTHERSHIP fully down — the pass's look check); `dir` ±1 → true = it flies */
  function start(kind, dir = 1) {
    const d = dir < 0 ? -1 : 1;
    if (hushed && kind !== 'pour' && kind !== 'ship') return false;
    if (kind === 'blackbird' || kind === 'f22') { if (!geo[kind] || jet || ufo) return false; jet = { kind, t0: -1, dir: d, snd: null }; return true; }
    if (kind === 'ufo') { if (!geo.ufo || jet || ufo) return false; ufo = { t0: -1, dir: d, hum: null }; return true; }
    if (kind === 'pass') { if (ship.done || ship.pass) return false; need('mothership'); ship.pass = { t0: -1 }; return true; }
    if (kind === 'pour') { if (ship.pour) return false; need('mothership'); ship.pour = { t0: -1 }; ship.ringT = -9; return true; }
    if (kind === 'ship') { need('mothership'); ship.force = true; return true; }
    return false;
  }
  /** a new run: every flyer off the screen (a model already in stays for its next moment) */
  function reset() {
    quiet(0.15);
    if (jet) { hide(0); hide(1); jet = null; }
    if (ufo) { hide(0); ufo = null; }
    hide(2);
    ship.k = 0; ship.vis = false; ship.pass = ship.pour = null; ship.done = false; ship.force = false; ship.ringT = -9; ship.cut = null; hushed = false;
    boxes.jet = boxes.ufo = boxes.ship = null;
    S.glance(0); S.pour(0);
  }
  return {
    need, start, frame, reset,
    /** the end card is up: what is in the sky fades away (THE FINISH's ship + its light stay) */
    hush() { hushed = true; },
    info: () => ({ ready: true, models: Object.keys(geo).sort(), asked: Object.keys(asked).filter(k => asked[k]).sort(), jet: jet ? jet.kind : '', jetDir: jet ? jet.dir : 0, ufo: !!ufo, ship: { k: +ship.k.toFixed(3), vis: ship.vis, pass: !!ship.pass, pour: !!ship.pour, done: ship.done }, boxes: { jet: boxes.jet && boxes.jet.slice(), ufo: boxes.ufo && boxes.ufo.slice(), ship: boxes.ship && boxes.ship.slice() }, played: played.slice() }),
    destroy() { dead = true; quiet(0.02); try { offBed(); } catch { /* fine */ } for (const k of Object.keys(geo)) drop(k); },
  };
}
