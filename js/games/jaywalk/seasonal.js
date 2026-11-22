// JAYWALK — THE SEASONAL PACK (JT1 — docs/jaywalk.md "JT1 — SEASONS"; J4 "WINTER" moved here): every seasonal layer lives HERE, fetched only
// on a season day (season-gate.js#seasonWindow — Oct 20 → Mar 1) or when the lab forces a date — never in the start bundle (ROOM FIRST,
// tests/jaywalk-jt1.test.mjs). night.js hands it its pieces (`A` — the kinds, the instanced puts, the particles) and calls it at fixed
// points of a frame; it draws from (the run's day, the run, the course) and writes nothing of theirs: a VIEW (THE GAMEPLAY LOCK).
//   J4 — WINTER: the snowy ground, plowed roads, snow on the tops, snow pines · lit Christmas trees · snowmen (the models: models.js#loadWinter),
//        THE FALLING SNOW (ONE draw), WET NEON STREETS (the lab's &wet=1 — ships OFF)
//   JT1 — AUTUMN: the round trees turned (orange · red · gold, in their own shader), golden grass + fallen leaves (the ground's shader — no
//        draw), DRIFTING LEAVES (THE FALL's leaf mode — the snow's one draw), LEAF PILES (ONE instanced draw) that BURST when the kid hops in
//   JT1 — THE HATS: Santa Dec 1–31 · the striped party hat Jan 1 — merged INTO the kid's own geometry (no draw call of their own)
//   JT1 — FOOTPRINTS on the snow (paired prints on the blob shadows' kind — no draw of their own) + a snow puff on each landing (the particles)
//   JT1 — NEW YEAR'S: fireworks over the skyline (fireworks.js — fetched only on Dec 31 / Jan 1)
import * as THREE from 'three';
import { seasonOf, modelsDay, packDay } from './season.js';
import { SEA_GLSL, seaPatch, createFall } from './seasonal-fx.js';
import { lazyImport } from '../../ui/lazy-import.js';

// ---- J4 — WINTER (moved from night.js VERBATIM): the sizes of the pack's models on the lane (native metres → cells)
const WIN_S = Object.freeze({ pine: 0.62, xmas: 0.6, snowman: 0.62 });   // (the CANDY CANE was DROPPED — the draw-call order: DOWNTOWN's Christmas Eve night runway measured 65 with it, 63 without)
/** THE TREE LIGHTS (code-drawn, ONE kind with every light in the scene — the glow billboards): red · gold · green · blue · pink */
const XMAS_HEX = [0xff3046, 0xffc23a, 0x36ff7a, 0x4a86ff, 0xff4fd8];
/** each light's place on the plain tree (native metres, a spiral round its cone — the camera sees the front half) + the star on top */
const XMAS_AT = Array.from({ length: 22 }, (_, k) => { const u = (k + 0.5) / 22, r = (0.68 * (1 - u) + 0.1) * 1.04, a = k * 2.4 + 0.6; return [Math.sin(a) * r, 0.36 + u * 1.62, Math.cos(a) * r]; });
const XMAS_TOP = 2.2;   // (the decorated tree's star, native metres: a soft gold glow round it by night)
const WK = Object.freeze(['w-pine', 'w-xmas', 'w-snowman']);   // (the pack's kinds)
/** the falling snow: how many flakes (light · heavy) · JT1: the drifting leaves (at full autumn) */
const FLAKES = Object.freeze({ light: 300, heavy: 760, leaves: 150 });
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const NONE = Object.freeze({ day: '', winter: 0, christmas: 0, snowfall: 'none', wet: 0, melt: false, autumn: 0, hat: '', fireworks: '', any: false });

/** JT1 — THE LEAF PILES: at most one in a block of `every` lanes, on these areas' walkable cells (the opening's grass · DOWNTOWN's sidewalks ·
 *  the canal's mossy pavers · the dunes' scrub — areas.js LOOKS index; -1 = the opening), from lane `from`; `share` of the blocks at full autumn */
export const PILE = Object.freeze({ every: 3, from: 4, share: 0.62, areas: [-1, 4, 5, 6], max: 24, burstMs: 520 });
/** JT1 — THE FOOTPRINTS: a pooled ring of pairs, each fading over `ms` */
export const PRINT = Object.freeze({ ring: 96, ms: 3600, len: 0.25, wide: 0.12, apart: 0.105 });
/** JT1 — THE HATS' colours (the owner's mockups: a red Santa hat — white fur band + pom-pom; a striped party cone) */
const HAT = Object.freeze({ red: 0xd41e2c, fur: 0xf6f3ee, stripes: [0xff3fb4, 0x29d8ff, 0xffd23a], tassel: 0xffd23a });
const LEAF_HEX = [0xff7a12, 0xf0381c, 0xffc624, 0xff9a2a];

/** FNV-1a of a string (the day) — a pile plan the same on every phone */
const fnv = s => { let x = 0x811c9dc5; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 0x01000193) >>> 0; } return x; };

/** J4 — THE WINTER MODELS (Kenney Holiday Kit 2.0, CC0 — scripts/build-jaywalk-assets.py --only=winter; moved here from models.js): fetched
 *  ONLY on a winter / Christmas day (or the lab's forced one) — never in the preload graph; their own cap 150 KB (tests/jaywalk-winter.test.mjs).
 *  → { name: geometry } once ALL are in, else null (that run keeps the normal look). Kept once loaded (this module lives on). */
const WDIR = new URL('../../../assets/jaywalk/winter/', import.meta.url);
export const WINTER_REV = 1;
export const WINTER_MODELS = Object.freeze(['snow-pine', 'xmas-tree', 'snowman']);   // (J4: the candy cane DROPPED — the draw-call limit)
let winterP = null;
function loadWinter(parseGlb) {
  if (!winterP) winterP = Promise.all(WINTER_MODELS.map(n => fetch(new URL(`${n}.glb?v=${WINTER_REV}`, WDIR)).then(r => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(n)))).then(parseGlb)))
    .then(gs => Object.fromEntries(WINTER_MODELS.map((n, i) => [n, gs[i]])), () => { winterP = null; return null; });   // (a failed pack: tried again next time — never thrown)
  return winterP;
}

export function createSeasonal(A) {
  const { kind, K, KM, X, Z, COLS, hsh, reduce } = A;
  // the season's ground uniforms (J4 — the snow, THE LIGHTS: the ≤ 16 nearest the kid this frame — x + 4.5, lane y, strength + their colours,
  // the wet streets' streaks + the snow's catch-light · JT1 — autumn), added to the ground's own before its GLSL comes in
  const LIGHTS = { n: { value: 0 }, pos: Array.from({ length: 16 }, () => new THREE.Vector4()), col: Array.from({ length: 16 }, () => new THREE.Vector3()) };
  const U = { snow: { value: 0 }, aut: { value: 0 } };
  Object.assign(A.ground.uniforms, { uSnow: U.snow, uAut: U.aut, uLN: LIGHTS.n, uL: { value: LIGHTS.pos }, uLC: { value: LIGHTS.col } });
  const LQ = { n: 0, x: new Float32Array(16), z: new Float32Array(16), k: new Float32Array(16), c: new Int32Array(16), p: new Float32Array(16) };
  let lkx = 0, lkz = 0;
  /** a light this frame — kept if it is among the 16 that matter most (the lanes ahead of the kid; far behind the camera never) */
  function glow(x, z, hex, k) {
    const pr = Math.abs(z - lkz) + 0.35 * Math.abs(x - lkx) + (z > lkz + 3 ? 6 : 0);
    let i = LQ.n;
    if (i >= 16) { let wi = 0; for (let j = 1; j < 16; j++) if (LQ.p[j] > LQ.p[wi]) wi = j; if (LQ.p[wi] <= pr) return; i = wi; } else LQ.n++;
    LQ.x[i] = x + COLS / 2; LQ.z[i] = -z; LQ.k[i] = k; LQ.c[i] = hex; LQ.p[i] = pr;
  }
  function lightsDone() {
    for (let i = 0; i < LQ.n; i++) { const hx = LQ.c[i]; LIGHTS.pos[i].set(LQ.x[i], LQ.z[i], LQ.k[i], 0); LIGHTS.col[i].set(((hx >> 16) & 255) / 255, ((hx >> 8) & 255) / 255, (hx & 255) / 255); }
    LIGHTS.n.value = LQ.n;
  }
  let SZ = NONE, shaders = false, models = null, modelsP = null, seasonWarm = false, xtN = 0, nowFn = null, labClock = -1, labT0 = 0;
  const XT_MAX = 48, XT = new Float32Array(XT_MAX * 6);   // (this frame's Christmas trees, for their lights at the end — no garbage)
  const fall = createFall(FLAKES.heavy, A.fogV, LIGHTS);
  A.scene.add(fall.mesh);

  // ---- THE SHADERS (the ground's season + the lit materials' patch): applied at a QUIET frame (a run's tick 0 / its end — never mid-run:
  //  a program rebuilt mid-run is a hitch), then the scene warms them
  function shadersOn() {
    if (shaders) return;
    shaders = true;
    A.ground.setSea(SEA_GLSL);
    for (const [m, leaf] of A.mats) seaPatch(m, U, leaf);
    A.rewarm();
  }
  /** a lit material made after the pack came in (Kenney's models landing late): patched at once (it has never been compiled) */
  const patch = (m, leaf) => { if (shaders) seaPatch(m, U, leaf); };

  // ---- J4 — THE WINTER MODELS (models.js#loadWinter): in season only; hidden until a quiet frame shows + warms them
  function loadModels() {
    if (models || modelsP) return modelsP || Promise.resolve(true);
    modelsP = loadWinter(A.parseGlb).then(gs => {
      modelsP = null;
      if (!gs || A.dead()) return false;
      models = gs;
      KM['w-pine'] = kind(gs['snow-pine'], A.lambert(), 150); KM['w-xmas'] = kind(gs['xmas-tree'], A.lambert(), 60);
      KM['w-snowman'] = kind(gs.snowman, A.lambert(), 70);
      for (const k of WK) KM[k].mesh.visible = false;   // (the review: hidden — nothing of theirs is built until the quiet frame shows them)
      seasonWarm = true;   // (their programs + buffers made at the next quiet frame — never mid-run)
      return true;
    });
    return modelsP;
  }

  // ---- JT1 — THE FIREWORKS (fireworks.js — Dec 31 · Jan 1 only)
  let FW = null, fwP = null;
  function loadFireworks() {
    if (FW || fwP) return fwP || Promise.resolve(true);
    fwP = lazyImport(import('./fireworks.js'), './fireworks.js').then(M => { fwP = null; if (A.dead()) return false; FW = M.createFireworks({ host: A.sky(), reduce, sound: A.sound }); if (SZ.fireworks) FW.on(SZ.fireworks); return true; }, () => { fwP = null; return false; });
    return fwP;
  }

  // ---- JT1 — THE HATS: one extra piece of the kid's OWN geometry (skinned by his head bone: it moves with every pose) — no draw call
  const HG = { want: '', on: '', orig: null, made: [] };
  let headInfo = null;
  function headOf(g) {
    if (headInfo && headInfo.g === g) return headInfo;
    const P = g.attributes.position, B = g.attributes.bone;
    let top = 0;
    for (let v = 1; v < P.count; v++) if (P.getY(v) > P.getY(top)) top = v;
    const hb = B.getX(top), box = [1e9, -1e9, 1e9, -1e9, 1e9, -1e9];
    for (let v = 0; v < P.count; v++) if (B.getX(v) === hb) { const x = P.getX(v), y = P.getY(v), z = P.getZ(v); box[0] = Math.min(box[0], x); box[1] = Math.max(box[1], x); box[2] = Math.min(box[2], y); box[3] = Math.max(box[3], y); box[4] = Math.min(box[4], z); box[5] = Math.max(box[5], z); }
    headInfo = { g, bone: hb, cx: (box[0] + box[1]) / 2, cz: (box[4] + box[5]) / 2, top: box[3], hw: (box[1] - box[0]) / 2, hd: (box[5] - box[4]) / 2, hh: box[3] - box[2] };
    return headInfo;
  }
  /** the hat on its own (upright, its brim at y 0, in the head's units) → ONE geometry (models.js#build — color + paint 0) */
  function hatParts(which, hw) {
    const r = hw * 0.5, hgt = hw * 1.18, parts = [];
    if (which === 'party') {
      const n = 4, sh = (hgt * 1.05) / n;
      for (let k = 0; k < n; k++) { const r0 = r * (1 - k / n), r1 = r * (1 - (k + 1) / n) + 0.0005; parts.push({ g: new THREE.CylinderGeometry(r1, r0, sh, 14, 1, true), color: HAT.stripes[k % 3], at: [0, sh * (k + 0.5), 0] }); }
      parts.push({ g: new THREE.CircleGeometry(r, 14).rotateX(Math.PI / 2), color: HAT.stripes[0], at: [0, 0.0005, 0] });
      parts.push({ g: new THREE.SphereGeometry(hw * 0.13, 8, 6), color: HAT.tassel, at: [0, hgt * 1.05, 0] });
      return { parts, bend: 0 };
    }
    parts.push({ g: new THREE.ConeGeometry(r * 0.92, hgt, 14, 4, true), color: HAT.red, at: [0, hgt / 2 + hw * 0.08, 0] });
    parts.push({ g: new THREE.TorusGeometry(r * 0.96, hw * 0.13, 6, 16).rotateX(Math.PI / 2), color: HAT.fur, at: [0, hw * 0.1, 0] });
    parts.push({ g: new THREE.SphereGeometry(hw * 0.17, 8, 6), color: HAT.fur, at: [0, hgt + hw * 0.08, 0] });
    return { parts, bend: hw * 0.36 };
  }
  function hatGeo(which, kg) {
    const H = headOf(kg), { parts, bend } = hatParts(which, H.hw);
    const g = A.build(parts), P = g.attributes.position, top = H.hw * 1.3;
    if (bend) for (let v = 0; v < P.count; v++) { const y = P.getY(v), u = Math.max(0, y / top); P.setX(v, P.getX(v) + bend * u * u); P.setY(v, y - bend * 0.35 * u * u * u); }   // (the Santa hat's tip flops to one side)
    // PERCHED: on the crown, a little sunk in + tipped back and to the side — the player colour still frames it (the owner: the big one was rejected)
    const M = new THREE.Matrix4().compose(new THREE.Vector3(H.cx + H.hw * 0.06, H.top - H.hw * 0.2, H.cz - H.hd * 0.08), new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.32, 0, -0.22, 'YXZ')), new THREE.Vector3(1, 1, 1));
    g.applyMatrix4(M);
    return { g, bone: H.bone };
  }
  /** the kid's geometry + the hat's vertices (every attribute carried over; the hat's `bone` = the head's; paint 0: its own colours) */
  function withHat(kg, hat) {
    const out = new THREE.BufferGeometry(), nk = kg.attributes.position.count, h = hat.g, nh = h.attributes.position.count;
    for (const [name, a] of Object.entries(kg.attributes)) {
      if (a.isInstancedBufferAttribute) { out.setAttribute(name, a); continue; }
      const it = a.itemSize, arr = new a.array.constructor((nk + nh) * it), src = h.attributes[name], sit = src ? src.itemSize : 0;
      const scale = a.normalized && !(arr instanceof Float32Array) ? (arr instanceof Uint8Array ? 255 : arr instanceof Uint16Array ? 65535 : 1) : 1;
      arr.set(a.array.subarray(0, nk * it));
      for (let v = 0; v < nh; v++) for (let c = 0; c < it; c++) arr[(nk + v) * it + c] = name === 'bone' ? hat.bone : src ? (c < sit ? src.array[v * sit + c] : 1) * scale : 0;
      out.setAttribute(name, new THREE.BufferAttribute(arr, it, a.normalized));
    }
    if (kg.index) { const I = kg.index.array, idx = new Uint32Array(I.length + nh); idx.set(I); for (let v = 0; v < nh; v++) idx[I.length + v] = nk + v; out.setIndex(new THREE.BufferAttribute(idx, 1)); }
    out.userData = kg.userData; out.computeBoundingBox(); out.computeBoundingSphere();
    return out;
  }
  /** put THE HAT on (or take it off) — every kid: yours + the rivals' (the two kinds of the one kid model) */
  function hatsTo(which) {
    HG.want = which;
    const kid = A.kid();
    if (!kid || HG.on === which) return;
    const ms = [kid.kid, kid.ghosts].filter(Boolean).map(k => k.mesh);
    if (!HG.orig) HG.orig = ms.map(m => m.geometry);
    for (const g of HG.made) g.dispose();
    HG.made = [];
    ms.forEach((m, i) => {
      if (!which) { m.geometry = HG.orig[i]; return; }
      const hat = hatGeo(which, HG.orig[i]), g = withHat(HG.orig[i], hat);
      hat.g.dispose(); HG.made.push(g); m.geometry = g;
    });
    HG.on = which; A.rewarm();
  }

  // ---- JT1 — THE LEAF PILES (ONE instanced draw): a low mound of leaves; bursts when the kid lands in it (then lies scattered)
  let KP = null, pileSeed = 0, pilesN = 0;
  const burst = new Map();   // ('lane:col' → when it burst — this run)
  function pileKind() {
    if (KP) return KP;
    const parts = [{ g: new THREE.SphereGeometry(0.3, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), color: 0xb8561a, at: [0, 0, 0], scale: [1.2, 0.42, 1.0], shade: y => 0.7 + y * 2.2 }];
    for (let k = 0; k < 16; k++) {
      const a = k * 2.399, rr = 0.07 + 0.26 * Math.sqrt((k + 0.5) / 16), x = Math.cos(a) * rr * 1.15, z = Math.sin(a) * rr, y = 0.11 * (1 - (rr / 0.33) ** 2) + 0.03;
      parts.push({ g: new THREE.SphereGeometry(0.075, 6, 3), color: LEAF_HEX[k % 4], at: [x, Math.max(0.02, y), z], rot: [0.5 * Math.sin(k * 1.7), a, 0.4 * Math.cos(k * 2.3)], scale: [1.5, 0.22, 0.85] });
    }
    KP = KM['s-pile'] = kind(A.build(parts), A.lambert(), PILE.max);   // (in KM: the scene resets + uploads it with its own kinds each frame)
    KP.mesh.visible = false; seasonWarm = true;   // (warmed at a quiet frame with the rest)
    return KP;
  }
  /** the pile on lane i (its column) or -1 — PURE from the course's seed + the run's day: the same on every phone */
  function pileAt(i, L, AR, vseed) {
    if (!(SZ.autumn > 0) || i < PILE.from || L.type !== 'grass' || L.mark || !PILE.areas.includes(AR)) return -1;
    const b = Math.floor(i / PILE.every), h = k => hsh(vseed ^ pileSeed ^ Math.imul(b, 7349), k);
    if (i !== b * PILE.every + Math.floor(h(1) * PILE.every)) return -1;
    if (h(2) > PILE.share * (0.45 + 0.55 * SZ.autumn)) return -1;
    const c0 = Math.floor(h(3) * COLS);
    for (let d = 0; d < COLS; d++) { const c = (c0 + d) % COLS; if (!L.obs[c]) return c; }
    return -1;
  }

  // ---- JT1 — THE FOOTPRINTS (a ring of pairs on the blob shadows' kind — K.shadow.raw: no draw of their own)
  const PR = new Float32Array(PRINT.ring * 5);   // x, z, yaw, t0, strength
  let prAt = 0, prN = 0;
  let F = null;   // (this frame's numbers — night.js)
  /** a QUIET moment (a run's start · its tick 0 · its end — never mid-run) brings in what came: the shaders, the kinds, the hats */
  function quiet() {
    if (SZ.any && !shaders) shadersOn();
    if (seasonWarm) { seasonWarm = false; for (const k of WK) if (KM[k]) KM[k].mesh.visible = true; if (KP) KP.mesh.visible = true; A.rewarm(); }   // (J4 — the pack's kinds warmed at a quiet frame, never mid-run)
    if (HG.want !== HG.on) hatsTo(HG.want);   // (the kid model landed after the start)
  }

  return {
    /** the day's pieces in now (the models · the fireworks) → a promise (true = all in). The menu / the count asks it: never blocking GO */
    prep(day) {
      const s = seasonOf(day), ps = [];
      if (modelsDay(s)) ps.push(loadModels());
      if (s.fireworks) ps.push(loadFireworks());
      return Promise.all(ps).then(r => r.every(Boolean));
    },
    /** the season for the run starting now (its day) · { snow (the lab's forced fall), wet, clock (the lab's local minutes), now } → what it applied */
    apply(day, o = {}) {
      let s = day ? seasonOf(day) : NONE;
      if (o.snow) s = { ...s, snowfall: o.snow };
      if (modelsDay(s) || s.snowfall !== 'none') loadModels();
      if (s.fireworks) loadFireworks();
      if (modelsDay(s) && !models) s = { ...s, winter: 0, christmas: 0, snowfall: o.snow || 'none' };   // (J4: the pack's models not in by the start = this run's normal winter look — no swap mid-run)
      SZ = { ...s, any: packDay(s) || s.snowfall !== 'none' || !!o.wet };
      pileSeed = fnv(SZ.day || 'none'); burst.clear(); prN = 0;
      nowFn = o.now || null; labClock = o.clock >= 0 ? o.clock : -1; labT0 = performance.now();
      if (SZ.autumn > 0) pileKind();
      hatsTo(o.hat === false ? '' : SZ.hat);
      if (FW) FW.on(SZ.fireworks);
      if (!SZ.any) { fall.show(0); LIGHTS.n.value = 0; U.snow.value = 0; U.aut.value = 0; }   // (no season this run: nothing of the pack's is left on — the scene stops calling it)
      else quiet();   // (a run's START is a quiet moment: what is in comes in now)
      return SZ;
    },
    season: () => SZ,
    patch, glow,
    /** (a look check) the first leaf pile from lane `from` → { lane, col } | null */
    pileFind(from) { const C = A.course(); if (!C || !F) return null; for (let i = Math.max(0, from); i < from + 300; i++) { const c = pileAt(i, C.lane(i), A.area(i).index, F.vseed); if (c >= 0) return { lane: i, col: c }; } return null; },
    quiet,
    /** this frame's numbers: `f` = night.js's ({ day, tier, clock, vseed, LF, … }) */
    frame(f) {
      F = f;
      const WIN = SZ.winter > 0 && !!KM['w-pine'];
      U.snow.value = WIN && shaders ? SZ.winter : 0;   // (every frame: another scene's teardown never zeroes this one's snow)
      U.aut.value = shaders ? SZ.autumn : 0;
      f.WIN = WIN; f.XM = WIN ? SZ.christmas : 0; xtN = 0; pilesN = 0; LQ.n = 0; lkx = f.px; lkz = f.pz;
    },
    /** a round tree at (x, zz) — winter's swap: a SNOW PINE or a lit CHRISTMAS TREE (true = drawn here; false = the round tree, as before —
     *  autumn turns it in its own shader) */
    tree(x, zz, s, q, i, dim, on, lt) {
      if (!F.WIN) return false;
      if (hsh(F.vseed ^ (i * 313), q.c * 7 + 5) < F.XM * 0.5) {   // J4 — A CHRISTMAS TREE (its presents baked in) + its lights
        const ws = WIN_S.xmas * (0.88 + q.s * 0.14), ry = q.ry * 0.5, ph = hsh(F.vseed ^ i, q.c + 90) * 40;
        KM['w-xmas'].put(x, 0, zz, ws, ws, ws, ry, 0xffffff, dim);
        if (xtN < XT_MAX) { const o = xtN++ * 6; XT[o] = x; XT[o + 1] = zz; XT[o + 2] = ws; XT[o + 3] = ry; XT[o + 4] = ph; XT[o + 5] = Math.min(1, dim); }   // (its lights: put LAST — the review: never one gameplay light lost to them)
        if (on) { F.LF(x, 0.035, zz, 1.7, 1, 1.5, 0, XMAS_HEX[(ph | 0) % 5], 1, 0, 0.16 * lt); if (F.lights) glow(x, zz, XMAS_HEX[(ph | 0) % 5], 0.5); }
      } else { const ws = WIN_S.pine * s; KM['w-pine'].put(x, 0, zz, ws, ws, ws, q.ry * 3, 0xffffff, dim); }   // J4 — a SNOW PINE
      return true;
    },
    /** a planter — J4: some → SNOWMEN (more as the snow deepens) (true = drawn here) */
    planter(x, zz, q, i, dim) {
      const wk = F.WIN && q.k === 'bush-planter' && hsh(F.vseed ^ (i * 271), q.c * 11 + 3) < 0.55 * clamp01((SZ.winter - 0.3) / 0.4) ? 'w-snowman' : '';
      if (wk) { const ws = WIN_S.snowman; KM[wk].put(x, 0, zz, ws, ws, ws, q.ry * 0.4, 0xffffff, dim * 1.1); return true; }
      return false;
    },
    /** a grass lane in view — JT1's LEAF PILE on it, if it has one (whole, or scattered once burst) */
    grass(i, L, z, lt, AR) {
      if (!KP || !shaders) return;
      const c = pileAt(i, L, AR, F.vseed);
      if (c < 0) return;
      const x = X(c + 0.5), b = burst.get(`${i}:${c}`), ry = hsh(F.vseed ^ (i * 191), 9) * 6.28, dim = lt * (F.day ? 1.05 : 1.25);
      if (b == null) { KP.put(x, 0, z, 1.32, 1.25, 1.32, ry, 0xffffff, dim); K.shadow.put(x, 0.03, z + 0.04, 1.2, 1, 0.95, 0, 0, 1, 0, 0.45 * lt); }
      else { const u = clamp01((F.clock - b) / 260); KP.put(x, 0, z, 1.32 + 0.55 * u, 1.25 - 0.95 * u, 1.32 + 0.55 * u, ry, 0xffffff, dim * 0.92); }   // (scattered: spread + flattened, it stays)
      pilesN++;
    },
    /** a kid LANDED (yours: own · a rival's: not) on lane `L` at (cx cells, ly lanes) facing `dir` → the footprints + the snow puff on snow;
     *  a leaf pile there bursts (its crunch: your own kid's only) */
    land(L, cx, ly, dir, own, AR) {
      if (!F || !shaders) return;
      const i = Math.floor(ly), c = Math.floor(cx), x = X(cx), z = Z(ly);
      if (SZ.autumn > 0 && KP) {
        const pc = pileAt(i, L, AR, F.vseed), key = `${i}:${c}`;
        if (pc === c && !burst.has(key)) {
          burst.set(key, F.clock);
          if (!reduce) for (let k = 0; k < 22; k++) { const a = k / 22 * Math.PI * 2 + (k % 3) * 0.3, sp = 1.8 + (k % 4) * 0.55; A.part('drop', X(c + 0.5), 0.12, z, PILE.burstMs, { hex: LEAF_HEX[k % 4], vx: Math.cos(a) * sp, vz: Math.sin(a) * sp * 0.6, vy: 1.6 + (k % 5) * 0.38, sz: k % 3 ? 0.17 : 0.22, al: F.day ? 1 : 0.85, g: 6.5, sh: 11 }); }   // (outward + low: past the kid's edge in 0.5 s — never over him or a lane's danger for long)
          if (own) A.sound('leaf-crunch');
        }
      }
      if (!(SZ.winter > 0) || !U.snow.value || (L.type !== 'grass')) return;
      const yaw = dir === 'l' ? Math.PI / 2 : dir === 'r' ? -Math.PI / 2 : 0;
      const o = prAt * 5; PR[o] = x; PR[o + 1] = z; PR[o + 2] = yaw; PR[o + 3] = F.clock; PR[o + 4] = (own ? 1 : 0.8) * clamp01(0.35 + SZ.winter * 1.2) * (L.mark ? 0.7 : 1);
      prAt = (prAt + 1) % PRINT.ring; prN = Math.min(PRINT.ring, prN + 1);
      if (!reduce) for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + 0.4; A.part('drop', x, 0.06, z + 0.05, 420, { hex: F.day ? 0xe4ecf8 : 0xc8ccf0, vx: Math.cos(a) * 0.55, vz: Math.sin(a) * 0.35, vy: 0.75 + (k % 3) * 0.2, sz: 0.2, al: F.day ? 0.85 : 0.3, g: 2.2 }); }   // (the small snow puff)
    },
    /** the end of a frame (after every gameplay light): the tree lights (LAST), THE FALL, the prints, the fireworks */
    end(f) {
      const day = f.day, LB = f.LB, clock = f.clock;
      // J4 — THE TREE LIGHTS, LAST: whatever room the glow billboards have left after every gameplay light (a tree at a time, whole)
      for (let j = 0; j < xtN && K.bill.left() > XMAS_AT.length + 2; j++) {
        const o = j * 6, x = XT[o], zz = XT[o + 1], ws = XT[o + 2], ry = XT[o + 3], ph = XT[o + 4], dm = XT[o + 5], cr = Math.cos(ry), sr = Math.sin(ry);
        for (let k = 0; k < XMAS_AT.length; k++) {
          const L3 = XMAS_AT[k], lx = L3[0], ly = L3[1], lz = L3[2], tw = reduce ? 1 : 0.62 + 0.38 * Math.sin(clock / (820 + k * 37) + ph + k * 1.7);
          K.bill.put(x + (lx * cr + lz * sr) * ws, ly * ws, zz + (-lx * sr + lz * cr) * ws, day ? 0.085 : 0.2, day ? 0.085 : 0.2, 1, 0, XMAS_HEX[(k + (ph | 0)) % 5], 1, day ? 11 : 5, (day ? 1 : 0.95) * tw * dm);
        }
        LB(x, XMAS_TOP * ws, zz, 0.42, 0.42, 1, 0, 0xffd27a, 1, 0, 0.6 * dm);   // (the star's glow — the model's own star by day)
      }
      // JT1 — THE FOOTPRINTS: paired soft-edged dents, fading behind the kid (night: a lavender shadow on the snow · day: blue-grey)
      for (let n = 0; n < prN; n++) {
        const o = ((prAt - 1 - n + PRINT.ring) % PRINT.ring) * 5, u = (clock - PR[o + 3]) / PRINT.ms;
        if (u >= 1 || u < 0) continue;
        const a = PR[o + 4] * (1 - u) * (1 - u * 0.4) * (day ? 0.34 : 0.42), yaw = PR[o + 2], cs = Math.cos(yaw), sn = Math.sin(yaw);
        for (const sd of [-1, 1]) {
          const dx = cs * PRINT.apart * sd, dz = -sn * PRINT.apart * sd, back = sd * 0.03;
          K.shadow.raw(PR[o] + dx + sn * back, 0.028, PR[o + 1] + dz + cs * back, PRINT.wide, 1, PRINT.len, yaw, 0, 1, 11, a);
        }
      }
      lightsDone();
      // J4 — THE FALL (ONE draw): the falling snow · JT1 — or the drifting leaves (light, see-through; never over the lane in front of the kid)
      const falling = SZ.snowfall !== 'none', leaves = !falling && SZ.autumn > 0 && shaders;
      if (falling || leaves) {
        const heavy = falling && SZ.snowfall === 'heavy', Uf = fall.uniforms;
        fall.show(Math.round((leaves ? FLAKES.leaves * (0.4 + 0.6 * SZ.autumn) : FLAKES[heavy ? 'heavy' : 'light']) * (f.tier === 0 || reduce ? 0.5 : 1)));
        Uf.uTime.value = reduce ? 0 : clock / 1000; Uf.uFocus.value.set(f.camX, 0, Z(f.camY + 7)); Uf.uAspect.value = f.w / Math.max(1, f.h);
        Uf.uDay.value = day ? 1 : 0; Uf.uFall.value = leaves ? 0.34 : heavy ? 1.7 : 1; Uf.uNear.value = heavy ? 1 : 0; Uf.uLeaf.value = leaves ? 1 : 0;
        Uf.uKid.value.set(f.kidX, f.kidY, 0);
      } else fall.show(0);
      // JT1 — NEW YEAR'S: the fireworks over the skyline (their own small canvas in the skyline layer — no draw call of the scene's)
      if (FW) FW.frame(clock, f.dt, day, localMinutes());
    },
    /** J4 — the fall's program warmed with the scene's (the start frame): → a function that puts it back */
    warmIn() {
      const sg = fall.mesh.geometry, v = fall.mesh.visible, c = sg.instanceCount;
      fall.mesh.visible = true; sg.instanceCount = Math.max(1, c);
      return () => { fall.mesh.visible = v; sg.instanceCount = c; };
    },
    /** the end screen covers the scene: the fireworks stop drawing (their canvas cleared) */
    rest(on) { if (FW) FW.rest(on); },
    info: () => ({ shaders, models: !!models, hat: HG.on, prints: prN, piles: pilesN, bursts: burst.size, fall: fall.mesh.visible ? fall.mesh.geometry.instanceCount : 0, leaves: fall.uniforms.uLeaf.value === 1, fw: FW ? FW.info() : null }),
    destroy() {
      A.scene.remove(fall.mesh); fall.dispose(); U.snow.value = 0; U.aut.value = 0; LIGHTS.n.value = 0;
      for (const g of HG.made) g.dispose();
      HG.made = [];
      if (FW) FW.destroy();
    },
  };
  /** the phone's LOCAL time of day in minutes (the lab's &clock= when it forces one) — the New Year's finale before local midnight */
  function localMinutes() {
    if (labClock >= 0) return (labClock + (performance.now() - labT0) / 60000) % 1440;
    const d = new Date(nowFn ? nowFn() : Date.now());
    return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
  }
}
