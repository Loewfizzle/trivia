// CITY 2.0 — THE HARBOR, Part 5: THE BOATS (docs/harbor/passes/part-5.md#the-boats). Each sails on the clock (core/harbor-boats.js: the
// routes, pure + tested). 8b2 Group 3 — THE BOATS IN 3D: every boat is a real MODEL now (boat-models.js on boat3d.js's kit) in
// the Harbor's own camera, posed by its heading, so it TURNS on the water (bow, three-quarter, side and stern views all true):
//
//   ROSIE      the riverboat: a white hull over a broad navy boot-top + a gold pinstripe (9a), three decks of arched windows, the pilothouse, twin black
//              stacks with feathered crowns + a gold band, the stern PADDLEWHEEL under its red hood with her name (the wheel
//              turns live — between her back and front: you see it from astern, it hides behind her from ahead), flagstaffs +
//              pennants, lifebuoys; at night every window warm and STRINGS OF BULBS from the bow staff over the stacks to the
//              stern staff (a scheme hook: set({ rosie: 'valentine' }) — 11c's dinner cruise; 'parade' — 11b's lit boat parade;
//              set({ chase }) — Part 10's chase along the strings); coal smoke off her stacks while she's under way
//   THE TAXI   a yellow water taxi with its checker band, zipping across in front of the pier head, bow up
//   THE TUG    (night) red + black, its fender at the bow, the wheelhouse high, the stack, the towing lights on the mast
//   THE FISHING TUG  the tug's build in white + green; its bow lantern at the stem while it's out in the dark
//   SAILBOATS  (day) a white sloop, main + jib on the leeward side, cambered, heeling in the real wind; they TACK through it
//
// THE CACHE: each boat's look is rendered into a sprite keyed by its heading (½° Rosie, 1° the rest), its view angle (the
// perspective shifts as it crosses: x / z in steps of 0.012), its depth, the tones + the scheme — a boat sailing straight costs
// a blit; it re-renders only when the key changes (a turn: a few times a second). Live per frame: the bob, Rosie's wheel, the
// bulbs while they chase, the running lights (green starboard / red port on the TRUE heading: the side facing us), the smoke,
// the noon steam plume, the lantern, the blackout's dark glass (f.power), the wakes (curving with the turn) and the
// REFLECTIONS (the same sprites, mirrored about each boat's waterline through water.reflect; the taxi's own per frame).
import { project } from '../../core/harbor-layout.js';
import { boatRoutes, boatAt, cycleOf } from '../../core/harbor-boats.js';
import { mix, rgb, shade, clamp01 } from './shapes.js';
import { LEVEL, axisAt } from './water.js';
import { safeCtx, BAKE_CAP } from '../../ui/canvas-safe.js';
import { pose, paint, windowsOf } from './boat3d.js';
import { rosieModel, taxiModel, tugModel, sailModel } from './boat-models.js';

const WAKE = { rosie: { life: 10, spread: 0.55, n: 16 }, taxi: { life: 3.4, spread: 1.6, n: 14 }, tug: { life: 8, spread: 0.6, n: 12 }, sail: { life: 6, spread: 0.45, n: 10 }, fish: { life: 7, spread: 0.5, n: 10 } };
const BULBS = { city: [[255, 214, 140]], valentine: [[255, 90, 140], [255, 200, 220]], parade: [[255, 70, 70], [80, 255, 120], [255, 214, 120], [90, 160, 255]], party: [[255, 70, 190], [70, 220, 255], [255, 214, 90]], halloween: [[255, 140, 30], [170, 70, 255]], christmas: [[255, 60, 60], [80, 255, 120], [255, 236, 200]] };
const TAU = Math.PI * 2, DEG = Math.PI / 180;
const FLAT = new Set(['win', 'winDim', 'shadow', 'wire', 'none']);
const GAIN = { stack: 2.6, hull: 1.6, fender: 1.6, trim: 1.4, spar: 1.5 };     // (dark enamel + brass catch the light harder than white paint)

function cvs(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
const wrapA = a => ((a % TAU) + TAU) % TAU;

export function createBoats() {
  let L = null, cam = null, dpr = 2, tier = 2, routes = [], states = [], rosieScheme = 'city', chase = null, mb = 0;
  const spr = new Map();                 // id → the sprite record (canvases + the pose they were rendered at)
  const models = new Map();              // id → its model (built once a layout; the sloop's sails per pose)
  const stats = { renders: 0, ms: 0, last: 0, max: 0 };
  let dot = null;
  const glow = () => { if (dot) return dot; dot = cvs(32, 32); const x = safeCtx(dot), g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.2, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); return dot; };

  function layout(l, o) {
    L = l; cam = l.cam; dpr = Math.min(BAKE_CAP, o.dpr || 1); tier = o.tier ?? 2; turnLoop = !!o.turn;
    routes = boatRoutes(L, { taxi: !!o.taxi });
    for (const p of spr.values()) freePool(p);
    spr.clear(); models.clear();
    for (const r of routes) models.set(r.id, r.kind === 'rosie' ? rosieModel() : r.kind === 'taxi' ? taxiModel() : r.kind === 'tug' ? tugModel(r.len, r.h, false) : r.kind === 'fish' ? tugModel(r.len, r.h, true) : null);
  }
  function freeRec(s) { for (const k of ['body', 'back', 'lights', 'comp']) if (s[k]) { s[k].width = 0; s[k].height = 0; } }
  function freePool(p) { for (const s of p.recs) freeRec(s); for (const q of ['mix', 'mixB']) if (p[q]) p[q].width = 0; }

  // ---------------------------------------------------------------- THE LOOK (the tones → each boat's palette)
  let look = null;
  function lookOf(T, heel) {
    const hb = Math.round(heel * 40) / 40;
    const key = `${Math.round(T.day * 6)}${Math.round(T.gold * 6)}${Math.round(T.night * 6)}|${T.sunDir || 0}|${cam.F.toFixed(0)}|${dpr}|${rosieScheme}|${chase ? 'c' : ''}|${tier === 0 ? 0 : 1}`;
    if (look && look.key === key && look.hb === hb) return look;
    const day = clamp01(T.day + 0.8 * T.gold), night = T.night, gold = T.gold / Math.max(0.01, T.day + T.gold), sd = T.sunDir || 0;
    const lit = (c, k = 1) => mix(mix(c, shade(c, 0.12), day * 0.5), mix(c, [30, 26, 48], 0.86), night * k);
    const glass = night > 0.35 ? [255, 204, 128] : mix([70, 96, 126], [170, 196, 214], day * 0.5);
    const white = lit([244, 240, 230]), navy = lit([30, 44, 86]), dark = lit([30, 28, 36], 0.4);
    const common = { win: glass, shadow: [20, 16, 30, 0.28 + 0.2 * night], wire: [...dark, 0.6], none: null, dark, trim: lit([206, 170, 90]) };
    const P = {
      // (POLISH 5 — TOO MUCH RED + WHITE, the owner: Rosie WHITE with DEEP NAVY trim — her boot stripe, the paddle box, the roof, the
      // pennants — + BLACK stacks; the gold only where it is big enough to read: her name on the paddle box, the stacks' bands)
      rosie: { ...common, white, shadeW: shade(white, -0.18), edge: shade(white, 0.1), rail: shade(white, 0.15), red: lit([30, 46, 96], 0.6), redD: shade(navy, -0.35), roof: shade(navy, -0.1), pin: lit([226, 186, 96], 0.42),   /* (9a: the boot-top keeps its navy at night + the pinstripe a lamp-lit gold) */ stack: lit([16, 15, 19], 0.3), buoy: lit([236, 96, 40]), deck: lit([186, 166, 136]) },
      taxi: { ...common, yellow: lit([244, 196, 40]), white: lit([240, 238, 230]), black: lit([24, 22, 28], 0.3), teak: lit([170, 120, 70]), flag: lit([60, 120, 220]), win: night > 0.35 ? [255, 214, 150] : mix([60, 84, 110], [160, 190, 210], day * 0.5) },
      tug: { ...common, hull: lit([22, 20, 26], 0.3), band: lit([176, 36, 36]), cream: lit([236, 226, 200]), buff: lit([200, 160, 90]), deck: lit([120, 100, 80]), tyre: lit([14, 12, 16], 0.3), fender: shade(lit([22, 20, 26], 0.3), 0.1), win: night > 0.35 ? [255, 206, 130] : mix([60, 84, 110], [160, 190, 210], day * 0.5), winDim: night > 0.35 ? [120, 96, 70] : shade(lit([236, 226, 200]), -0.3) },
      fish: { ...common, hull: lit([226, 224, 216]), band: lit([44, 104, 74]), cream: lit([214, 196, 150]), buff: lit([44, 104, 74]), deck: lit([150, 130, 100]), tyre: lit([14, 12, 16], 0.3), fender: shade(lit([226, 224, 216]), 0.1), win: night > 0.35 ? [255, 206, 130] : mix([60, 84, 110], [160, 190, 210], day * 0.5), winDim: night > 0.35 ? [120, 96, 70] : shade(lit([214, 196, 150]), -0.3) },
      sail: { ...common, hullW: lit([246, 244, 238]), stripe: lit([30, 70, 140]), teak: lit([176, 136, 92]), cabinT: shade(lit([246, 244, 238]), -0.2), spar: lit([60, 56, 60]), stay: [...lit([60, 56, 60]), 0.55], seam: [0, 0, 0, 0.12 + 0.1 * night], sail: mix(mix([252, 250, 244], [255, 224, 196], gold), [70, 66, 90], night) },
    };
    // the sun on the faces: toward the light (we face south: −1 a morning sun on the left; the light from behind the city, +z);
    // at night a faint sky light from above. The colours as authored on a face turned to the camera.
    const sun = night > 0.6 ? [0, 0.9, 0.3] : (() => { const v = [sd * 0.85, 0.55, 0.4], l = Math.hypot(...v); return v.map(c => c / l); })();
    look = { key, hb, day, night, gold, sd, pal: P, sun, shK: 0.05 + 0.13 * day, topK: 0.04 + 0.06 * day, wheel: { board: rgb(mix([34, 50, 96], [16, 18, 34], night)), boardD: rgb(mix([22, 32, 64], [12, 12, 24], night)), rim: rgb(mix([206, 170, 90], [70, 56, 40], night)), spoke: rgb(mix([60, 20, 26], [22, 12, 18], night)) } };
    return look;
  }

  // ---------------------------------------------------------------- THE SPRITES (a boat's model rendered at its pose)
  // THE SLOOP's sails swing to leeward of the wind (a fixed breeze off the camera's side + the real wind's side): close-hauled →
  // reaching → running; head to wind (the tack) the sails go slack and the boom crosses over
  function sailTrim(st, f) {
    const wx = Math.max(-0.7, Math.min(0.7, (f.wind || 0) / 8)), W = [wx, -1], wl = Math.hypot(W[0], W[1]); W[0] /= wl; W[1] /= wl;     // (the wind comes FROM W)
    const fw = [Math.cos(st.hd), Math.sin(st.hd)], sb = [Math.sin(st.hd), -Math.cos(st.hd)];
    const ca = fw[0] * W[0] + fw[1] * W[1], ws = sb[0] * W[0] + sb[1] * W[1];          // (the wind off the bow; from starboard > 0)
    const side = ws >= 0 ? -1 : 1, luff = clamp01((ca - 0.82) / 0.16);
    const boom = (0.28 + 0.85 * (1 - ca) / 2) * (1 - luff) + 0.04 * luff, heel = (f.heel || 0) * Math.sqrt(Math.max(0, 1 - ca * ca)) * (1 - luff) * side;
    // (quantized: a new sprite only when the trim visibly changes)
    return { side, boom: Math.round(boom * 20) / 20, luff: Math.round(luff * 4) / 4, heel: Math.round(heel * 40) / 40 };
  }
  // C2 — THE GLIDE (the owner's iPhone: "Rosie's 3D turn feels choppy"). A sprite is a model rendered at a QUANTIZED heading
  // (½° Rosie at tier 2, ¾° tier 1, 1° tier 0 + the rest) — on its own a turning boat held each step for ~5 drawn frames and then
  // jumped ½–1° (her far end 0.6–1.1 pt, 1.7–3.3 device px on an iPhone) about 5.5 times a second: the judder. Now a turning boat
  // is drawn from a PAIR of sprites, the steps either side of her true heading, CROSSFADED by where she is between them (summed
  // with 'lighter' in a scratch canvas: exact where both cover, each edge weighted by its own share) — a new step costs one
  // render as before (the old upper step becomes the lower one), but the picture moves every frame. Her depth's ½-unit step is
  // scaled away (zq / z) and her wheel, running lights, lantern + steam ride the TRUE pose (a pose with no parts: its transform).
  const stepOf = kind => (kind === 'rosie' ? (tier >= 2 ? 0.5 : tier === 1 ? 0.75 : 1) : 1) * DEG;
  const NOPARTS = [];
  const shown = new Map();               // (debug: the heading each boat was last DRAWN at — the pair's blend, in degrees)
  /** the pair of sprites for a state: { A, B (null: one is enough), k (B's share), zk (her depth's scale: zq / z) } */
  function pairOf(st, f, lk) {
    const r = st.r, kind = r.kind, step = stepOf(kind);
    const h = wrapA(st.hd) / step, i0 = Math.floor(h), fr = h - i0;
    const zq = Math.round(st.z * 2) / 2, tq = Math.round((st.x / zq) / 0.012) * 0.012, xq = tq * zq;
    const live = kind === 'rosie' && tier > 0;
    const base = `${Math.round(tq / 0.012)}|${zq}|${lk.key}|${lk.hb}|${live ? 1 : 0}`;
    let pool = spr.get(r.id);
    if (!pool) { pool = { recs: [{ key: '' }, { key: '' }], mk: {} }; spr.set(r.id, pool); }
    const idx = fr < 0.02 ? [i0] : fr > 0.98 ? [i0 + 1] : [i0, i0 + 1];
    const ks = idx.map(i => { const hq = i * step, trim = kind === 'sail' ? sailTrim({ hd: hq }, f) : null; return { hq, trim, key: `${Math.round(hq / DEG * 100)}|${base}|${trim ? `${trim.side}${trim.boom}${trim.luff}${trim.heel}` : ''}` }; });
    const got = ks.map(k => pool.recs.find(s => s.key === k.key) || null);
    for (let j = 0; j < ks.length; j++) if (!got[j]) { const s = pool.recs.find(o => !got.includes(o)); render(s, r, f, lk, ks[j], xq, zq, live); got[j] = s; }
    const now = performance.now();
    for (const s of got) s.used = now;
    // (a sprite not needed for 2 s — a turn over, a boat sailing straight — gives its canvases back; so does the blend's scratch)
    for (const s of pool.recs) if (!got.includes(s) && s.key && now - s.used > 2000) { freeRec(s); s.key = ''; }
    if (got.length === 1 && (pool.mix || pool.mixB) && now - (pool.mixAt || 0) > 2000) { for (const q of ['mix', 'mixB']) if (pool[q]) { pool[q].width = 0; pool[q] = null; } pool.mk = {}; }
    return { A: got[0], B: got[1] || null, k: got.length > 1 ? fr : 0, zk: zq / st.z, pool };
  }
  /** a pair's layer ('body' | 'back') crossfaded into the pool's scratch for it (A × (1 − k) + B × k, 'lighter' — premultiplied,
   *  so the sum is exact) → { cv, x, y, cw, ch } (x, y: its corner in anchor-relative pt). Every sprite's anchor sits on a whole
   *  device pixel, so both copies land 1:1 — never resampled. Cached per layer: the water's mirror (10 a second) and the frame
   *  share one blend (a scratch rewritten after it was drawn would make the canvas copy it). While a boat turns only: given back
   *  2 s after. */
  function mixOf(pr, layer) {
    const { A, B, k, pool } = pr, slot = layer === 'back' ? 'mixB' : 'mix';
    const x0 = Math.min(-A.ox, -B.ox), y0 = Math.min(-A.oy, -B.oy), x1 = Math.max(A.w - A.ox, B.w - B.ox), y1 = Math.max(A.h - A.oy, B.h - B.oy);
    const cw = Math.ceil((x1 - x0) * dpr), ch = Math.ceil((y1 - y0) * dpr), mk = `${A.key}#${B.key}#${k.toFixed(4)}#${A.n}#${B.n}`;
    let cv = pool[slot];
    if (pool.mk[slot] === mk && cv) return { cv, x: x0, y: y0, cw, ch };
    if (!cv) cv = pool[slot] = cvs(cw, ch); else if (cv.width < cw || cv.height < ch) { cv.width = Math.max(cv.width, cw); cv.height = Math.max(cv.height, ch); }
    const x = safeCtx(cv);
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, cv.width, cv.height);
    x.globalCompositeOperation = 'lighter';
    for (const [S, a] of [[A, 1 - k], [B, k]]) {
      const sw = Math.min(S[layer].width, Math.ceil(S.w * dpr)), sh = Math.min(S[layer].height, Math.ceil(S.h * dpr));
      x.globalAlpha = a; x.drawImage(S[layer], 0, 0, sw, sh, Math.round((-S.ox - x0) * dpr), Math.round((-S.oy - y0) * dpr), sw, sh);
    }
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    pool.mk[slot] = mk; pool.mixAt = performance.now();
    return { cv, x: x0, y: y0, cw, ch };
  }
  function render(s, r, f, lk, K, xq, zq, live) {
    const kind = r.kind, hq = K.hq, trim = K.trim;
    const t0 = performance.now();
    s.key = K.key; s.n = (s.n || 0) + 1; s.hq = hq;
    const M = kind === 'sail' ? sailModel(r.len, r.h, trim) : models.get(r.id);
    const pal = lk.pal[kind] || lk.pal.tug;
    const V = { cam, X: xq, Z: zq, hd: hq, c0: M.c0, roll: trim ? trim.heel : 0, pitch: kind === 'taxi' ? 0.035 : 0, sun: lk.sun, shK: lk.shK, topK: lk.topK, pal: role => pal[role] ?? (role === 'none' ? null : [255, 0, 255]), flat: role => FLAT.has(role), gain: role => GAIN[role] || 1 };
    s.roll = V.roll; s.pitch = V.pitch;
    const tA = performance.now();
    const P = pose(M.parts, V);
    stats.pose = (stats.pose || 0) + performance.now() - tA;
    const [bx0, by0, bx1, by1] = P.bounds, pad = 8;
    // (the anchor on a whole device pixel: a pair's two sprites crossfade 1:1, never resampled)
    const ox = Math.ceil((-bx0 + pad) * dpr) / dpr, oy = Math.ceil((-by0 + pad) * dpr) / dpr, w = ox + bx1 + pad, h = oy + by1 + pad;
    const need = (cv) => { const cw = Math.ceil(w * dpr), ch = Math.ceil(h * dpr); if (!cv) cv = cvs(cw, ch); else if (cv.width < cw || cv.height < ch) { cv.width = Math.max(cv.width, cw); cv.height = Math.max(cv.height, ch); } const x = safeCtx(cv); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, cv.width, cv.height); x.setTransform(dpr, 0, 0, dpr, ox * dpr, oy * dpr); return cv; };
    s.body = need(s.body);
    const bx = safeCtx(s.body);
    if (live) { s.back = need(s.back); } else if (s.back) { s.back.width = 0; s.back = null; }
    s.ox = ox; s.oy = oy; s.w = w; s.h = h; s.P = P; s.M = M; s.st = { hd: hq, x: xq, z: zq }; s.kind = kind;
    s.fwd = P.dir([1, 0, 0]);
    const onPart = {};
    if (kind === 'rosie' && !live) onPart.wheel = cx => drawWheel(cx, P, M, zq, 0, lk);
    const tB = performance.now();
    paint(bx, P, live ? { back: safeCtx(s.back), front: bx, split: 'wheel' } : { onPart });
    stats.paint = (stats.paint || 0) + performance.now() - tB;
    // the day's bulbs: small white beads on the wire (lit at night by the lights layer)
    const bulbs = P.dots.filter(d => d.kind === 'bulb');
    if (bulbs.length) { bx.fillStyle = `rgba(250,246,230,${(0.7 * lk.day + 0.1).toFixed(3)})`; bx.beginPath(); for (const b of bulbs) bx.rect(b.x - 0.3, b.y - 0.3, 0.6, 0.6); bx.fill(); }
    // the blackout's glass + the night's glows: the windows this pose shows
    const wins = windowsOf(P);
    s.wins = new Path2D(); for (const q of wins) { s.wins.moveTo(q[0], q[1]); for (let i = 2; i < q.length; i += 2) s.wins.lineTo(q[i], q[i + 1]); s.wins.closePath(); }
    s.bulbs = bulbs.map(b => ({ x: b.x, y: b.y, i: b.i }));
    // THE LIGHTS (night): every lit window's glow, the bulbs (unless they chase: then live), the deck lamps facing us, the tug's
    // masthead lights, the cabins' warm glow
    const tC = performance.now();
    if (lk.night > 0.05) {
      s.lights = need(s.lights);
      const g = safeCtx(s.lights); g.globalCompositeOperation = 'lighter';
      const u = cam.F / zq, d = glow();
      const bulb = (px, py, col, rr = 1, k = 1) => { g.globalAlpha = k; const sz = Math.max(1.2, u * 0.32) * rr; g.drawImage(d, px - sz, py - sz, sz * 2, sz * 2); g.globalAlpha = 1; };
      if (lk.night > 0.35 && wins.length) {
        // the lit windows' glow: a soft halo round every window this pose shows — two strokes of the windows' own path (one op
        // each, not one image a window: a turned-away window glows as little as it shows; neighbours merge into a warm band)
        g.lineJoin = 'round';
        g.strokeStyle = 'rgba(255,190,110,0.08)'; g.lineWidth = Math.max(1.2, 1.2 * u); g.stroke(s.wins);
        g.strokeStyle = 'rgba(255,206,140,0.14)'; g.lineWidth = Math.max(0.6, 0.4 * u); g.stroke(s.wins);
      }
      if (!chase && bulbs.length) {
        // her bulbs: a white glow (two soft discs) + the scheme's coloured core — batched by colour
        const cols = BULBS[rosieScheme] || BULBS.city, sz = Math.max(1.2, u * 0.32) * 1.15, core = Math.max(0.35, u * 0.07);
        const disc = (r, fill, list) => { g.fillStyle = fill; g.beginPath(); for (const b of list) { g.moveTo(b.x + r, b.y); g.arc(b.x, b.y, r, 0, TAU); } g.fill(); };
        disc(sz * 0.95, 'rgba(255,255,255,0.16)', bulbs); disc(sz * 0.5, 'rgba(255,255,255,0.32)', bulbs);
        cols.forEach((c, ci) => disc(core, `rgb(${mix(c, [255, 255, 255], 0.6).map(Math.round)})`, bulbs.filter(b => b.i % cols.length === ci)));
      }
      for (const dt of P.dots) {
        if (dt.kind === 'lamp' && P.seen(P.dir(dt.n), dt.w)) bulb(dt.x, dt.y, null, 0.8, 0.6);
        else if (dt.kind === 'mast') bulb(dt.x, dt.y, null, 1.2, 1);
        else if (dt.kind === 'glow') { g.globalAlpha = kind === 'taxi' ? 0.45 : 0.4; const rr = (kind === 'taxi' ? 1.8 : 2) * u, gg = g.createRadialGradient(dt.x, dt.y, 0, dt.x, dt.y, rr); gg.addColorStop(0, 'rgba(255,200,120,0.85)'); gg.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = gg; g.fillRect(dt.x - rr, dt.y - rr, rr * 2, rr * 2); g.globalAlpha = 1; }
      }
    } else if (s.lights) { s.lights.width = 0; s.lights = null; }
    stats.lights = (stats.lights || 0) + performance.now() - tC;
    const ms = performance.now() - t0;
    stats.renders++; stats.ms += ms; stats.last = ms; stats.max = Math.max(stats.max, ms);
    mb = memMB();
    return s;
  }
  const area = cv => (cv ? cv.width * cv.height * 4 : 0);
  const memMB = () => [...spr.values()].reduce((a, p) => a + area(p.mix) + area(p.mixB) + p.recs.reduce((b, o) => b + ['body', 'back', 'lights', 'comp'].reduce((c, k) => c + area(o[k]), 0), 0), 0) / 1e6;

  // ---------------------------------------------------------------- ROSIE'S WHEEL (live: its boards turning, in 3-D)
  // (P: a pose — a sprite's, or the TRUE one while she moves (C2: the wheel glides with her); M her model; z her depth)
  function drawWheel(c, P, M, z, ang, lk) {
    const Wh = M.wheel, n = Wh.n;
    const near = P.seen(P.dir([0, 0, 1]), P.W(Wh.a, Wh.u, Wh.hw)) ? 1 : -1;   // (the rim on the side we see)
    const pt = (r, t, sd) => P.P(Wh.a + r * Math.cos(t), Wh.u + r * Math.sin(t), sd);
    const rim = (sd, col, w) => {
      c.strokeStyle = col; c.lineWidth = w; c.beginPath(); let pen = false;
      for (let i = 0; i <= 20; i++) { const t = (i / 20) * TAU, u = Wh.u + Wh.r * Math.sin(t); if (u < -0.04) { pen = false; continue; } const [x, y] = pt(Wh.r, t, sd); if (pen) c.lineTo(x, y); else { c.moveTo(x, y); pen = true; } }
      c.stroke();
    };
    const u0 = cam.F / z, lw = Math.max(0.35, 0.1 * u0);
    rim(-near * Wh.hw, lk.wheel.boardD, lw);
    // the boards: each a plank across the wheel from the hub's reach to the rim — two fills (the shaded lower ones, then the lit
    // upper ones: the far side's planks never cross the near side's on screen at this size)
    for (const lit of [false, true]) {
      c.fillStyle = lit ? lk.wheel.board : lk.wheel.boardD; c.beginPath();
      for (let i = 0; i < n; i++) {
        const t = ang + (i / n) * TAU, sn = Math.sin(t);
        if ((sn > 0) !== lit || Wh.u + Wh.r * sn < -0.05) continue;     // (under the water: unseen)
        const p0 = pt(Wh.r * 0.62, t, -Wh.hw), p1 = pt(Wh.r, t, -Wh.hw), p2 = pt(Wh.r, t, Wh.hw), p3 = pt(Wh.r * 0.62, t, Wh.hw);
        c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.lineTo(p2[0], p2[1]); c.lineTo(p3[0], p3[1]); c.closePath();
      }
      c.fill();
    }
    // the near side: its spokes + the rim (gold-edged) + the hub
    c.strokeStyle = lk.wheel.spoke; c.lineWidth = Math.max(0.3, 0.07 * u0); c.beginPath();
    for (let i = 0; i < 8; i++) { const t = ang + (i / 8) * TAU + 0.2; if (Wh.u + Wh.r * Math.sin(t) < -0.04) continue; const [x0, y0] = pt(0.2, t, near * Wh.hw), [x1, y1] = pt(Wh.r, t, near * Wh.hw); c.moveTo(x0, y0); c.lineTo(x1, y1); }
    c.stroke();
    rim(near * Wh.hw, lk.wheel.rim, lw);
    const [hx, hy] = pt(0, 0, near * Wh.hw); c.fillStyle = lk.wheel.rim; c.beginPath(); c.arc(hx, hy, Math.max(0.5, 0.18 * u0), 0, TAU); c.fill();
  }

  // ---------------------------------------------------------------- per frame
  /** the boats' places now (once a frame): ms = the clock, nightAt(ms) → bool (a day / night boat, per cycle) */
  // THE THINNING (the owner's call): while the water lane is QUIET (a big show: the party peak + the searchlights + a word; a
  // heavy event; tier 1's party night) the extra boats wait — the taxi skips its next crossing, the tug its next visit — decided
  // only while the boat is out of sight, so nothing pops; one already on the water finishes. Tier 0 (the calm city): the taxi
  // crosses every other time.
  const skipped = new Set();
  let offNow = null;                 // (8b1: the local minutes from UTC — Rosie + the fishing tug run on the DAY's timetable)
  // (&force=rosie-turn — perf + review: ROSIE's homecoming turn on a loop: her swing (58 → 120 s of the arrival) over and over)
  let turnLoop = false, turnAt = 0;              // (POLISH 5: the loop counts from the moment it was fired — set({ turnAt }) — her swing from its start)
  const at = (r, ms, nightAt) => {
    if (turnLoop && r.kind === 'rosie') return boatAt(r, cycleOf(r, ms).start + (58 + ((((ms / 1000 - turnAt) % 62) + 62) % 62)) * 1000, nightAt);
    return boatAt(r, ms, nightAt, { off: offNow });
  };
  function tick(ms, nightAt, { quiet = false, off = null } = {}) {
    offNow = off;
    states = routes.map(r => {
      const st = { r, ...at(r, ms, nightAt), ms };
      if (!r.thin) return st;
      if (!st.on && st.next != null && quiet) { skipped.add(`${r.id}|${st.next}`); if (skipped.size > 64) skipped.delete(skipped.values().next().value); }
      if (st.on && (skipped.has(`${r.id}|${st.run}`) || (tier === 0 && r.id === 'taxi' && st.run % 2 === 1))) { st.on = false; st.moving = false; st.seg = 'waits'; }
      return st;
    });
  }
  // a boat-local point at a state (its true place now — for the smoke's past positions)
  const worldOf = (r, st, a, u, s, c0) => { const ca = Math.cos(st.hd), sa = Math.sin(st.hd), A = a - c0; return [st.x + A * ca + s * sa, LEVEL + u, st.z + A * sa - s * ca]; };
  let puffCv = null, puffKey = '';
  function puff(lk) {
    const key = lk.night > 0.5 ? 'n' : 'd';
    if (puffCv && puffKey === key) return puffCv;
    puffKey = key; puffCv = puffCv || cvs(48, 48);
    const x = safeCtx(puffCv); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, 48, 48);
    const body = key === 'n' ? [78, 76, 92] : [118, 112, 112], hi = key === 'n' ? [110, 106, 124] : [178, 172, 170];
    let g = x.createRadialGradient(24, 26, 0, 24, 26, 24); g.addColorStop(0, `rgba(${body},0.9)`); g.addColorStop(0.55, `rgba(${body},0.45)`); g.addColorStop(1, `rgba(${body},0)`); x.fillStyle = g; x.fillRect(0, 0, 48, 48);
    g = x.createRadialGradient(20, 18, 0, 20, 18, 14); g.addColorStop(0, `rgba(${hi},0.7)`); g.addColorStop(1, `rgba(${hi},0)`); x.fillStyle = g; x.fillRect(0, 0, 48, 48);
    return puffCv;
  }
  /** THE SMOKE off her stacks while she's under way: soft puffs left where the stack was (the boat's own past places), rising,
   *  spreading + drifting with the real wind, fading */
  function smoke(c, st, f, lk) {
    const r = st.r, M = models.get(r.id);
    if (!M || !M.smoke || !st.moving || !f.motion) return;
    const n = tier === 0 ? 3 : r.kind === 'rosie' ? 7 : 4, life = r.kind === 'rosie' ? 6 : 3.5, tt = f.t || 0, img = puff(lk);
    const wind = f.wind == null ? 1 : Math.max(-1.4, Math.min(1.4, f.wind / 5));
    const k0 = (r.kind === 'rosie' ? 0.55 : 0.3) * (lk.night > 0.5 ? 0.6 : 1);
    for (const [a, u, s] of M.smoke) {
      for (let i = n - 1; i >= 0; i--) {
        const q = ((tt / life + i / n + (s > 0 ? 0.37 : 0)) % 1 + 1) % 1, age = q * life;
        const p = age < 0.05 ? st : { ...at(r, st.ms - age * 1000, f.nightAt) };
        if (!p.on && p !== st) continue;
        const w = worldOf(r, p, a, u, s, M.c0);
        const x = w[0] + wind * age * 0.55, y = w[1] + age * 0.75 + age * age * 0.03, z = w[2] + age * 0.25;
        const [sx, sy] = project(cam, x, y, z), rr = (0.35 + 0.42 * age) * cam.F / z;
        const al = k0 * (1 - q) ** 1.3 * Math.min(1, q / 0.06);
        if (al < 0.01) continue;
        c.globalAlpha = al; c.drawImage(img, sx - rr, sy - rr, rr * 2, rr * 2);
      }
    }
    c.globalAlpha = 1;
  }
  /** a boat on screen: its sprite at its place (+ the live pieces), the bob; mirror: in the water's mirror */
  function drawOne(c, st, f, mirror) {
    const lk = look; if (!lk) return;
    // (C2 — THE GLIDE: the pair either side of her heading, crossfaded; s = the nearer one, for what isn't blended)
    const pr = pairOf(st, f, lk), r = st.r, s = pr.B && pr.k > 0.5 ? pr.B : pr.A, zk = pr.zk, scaled = Math.abs(zk - 1) > 1e-5;
    if (!mirror) shown.set(r.id, pr.B ? +(pr.A.hq / DEG + pr.k * (pr.B.hq - pr.A.hq) / DEG).toFixed(3) : +(pr.A.hq / DEG).toFixed(3));
    const [sx, sy] = project(cam, st.x, LEVEL, st.z), u = cam.F / st.z;
    // the TRUE pose (no parts — only its transform, a few multiplies): the wheel, the running lights, the lantern + the steam ride it
    const LP = pose(NOPARTS, { cam, X: st.x, Z: st.z, hd: st.hd, c0: s.M.c0, roll: s.roll, pitch: s.pitch });
    // (a sprite's layer: the pair's blend, or the one sprite; zIn: the sprite's frame — her depth's ½-unit step scaled away)
    const lay = name => {
      if (pr.B) { const m = mixOf(pr, name); c.drawImage(m.cv, 0, 0, m.cw, m.ch, m.x, m.y, m.cw / dpr, m.ch / dpr); }
      else c.drawImage(s[name], 0, 0, s.w * dpr, s.h * dpr, -s.ox, -s.oy, s.w, s.h);
    };
    const zIn = () => { c.save(); if (scaled) c.scale(zk, zk); };
    const fast = r.kind === 'taxi';
    const bob = f.motion ? Math.sin(f.t * (fast ? 3.2 : 0.9) + r.z) * u * (fast ? 0.06 : 0.05) : 0;
    c.save();
    c.translate(sx, sy + bob);
    // Rosie's paddlewheel (turning while she moves: backing as she goes astern; idling slow at her landing)
    const rate = st.moving ? (st.astern ? 1.6 : -1.6) : -0.15, ang = (f.motion ? (f.t || 0) * rate : 0) % TAU;
    if (s.back && !st.moving) {
      // (at her landing the wheel only idles: her back + the wheel + her front composited into ONE image, refreshed 2.5 times a
      // second — the rim moves < ½ pt a refresh — so a docked Rosie costs one blit, like the old sprite)
      const now = performance.now();
      if (!s.comp || s.compKey !== s.key || now - s.compAt > 400) {
        s.comp = s.comp || cvs(1, 1);
        if (s.comp.width !== s.body.width || s.comp.height !== s.body.height) { s.comp.width = s.body.width; s.comp.height = s.body.height; }
        const x = safeCtx(s.comp); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, s.comp.width, s.comp.height);
        x.drawImage(s.back, 0, 0); x.setTransform(dpr, 0, 0, dpr, s.ox * dpr, s.oy * dpr); drawWheel(x, s.P, s.M, s.st.z, ang, lk);
        x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(s.body, 0, 0);
        s.compKey = s.key; s.compAt = now;
      }
      zIn(); c.drawImage(s.comp, 0, 0, s.w * dpr, s.h * dpr, -s.ox, -s.oy, s.w, s.h); c.restore();
    } else {
      // (moving: her back, the wheel turning on her TRUE pose, her front — each sprite layer crossfaded while she turns)
      if (s.back) { zIn(); lay('back'); c.restore(); drawWheel(c, LP, s.M, st.z, ang, lk); }
      zIn(); lay('body'); c.restore();
    }
    // (8b1 — THE FISHING TUG's BOW LANTERN while she heads out at dawn / comes home: a warm white point + a tight glow at her stem —
    // only while it's dark enough to need one)
    if (r.kind === 'fish' && st.lantern && f.T && (f.T.night + 0.6 * (1 - Math.min(1, f.T.day + f.T.gold))) > 0.3 && (f.power == null || f.power > 0.3)) {
      const lt = s.P.dots.find(d => d.kind === 'lantern');
      if (lt) {
        const [bx, by] = LP.P(...lt.p), k = Math.min(1, (f.T.night || 0) + 0.5) * (f.power == null ? 1 : f.power);
        const gg = c.createRadialGradient(bx, by, 0, bx, by, Math.max(3, 1.6 * u)); gg.addColorStop(0, `rgba(255,236,190,${(0.95 * k).toFixed(3)})`); gg.addColorStop(0.25, `rgba(255,214,150,${(0.45 * k).toFixed(3)})`); gg.addColorStop(1, 'rgba(255,200,120,0)');
        c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = gg; c.fillRect(bx - 1.6 * u - 3, by - 1.6 * u - 3, 3.2 * u + 6, 3.2 * u + 6); c.fillStyle = `rgba(255,250,236,${k.toFixed(3)})`; c.beginPath(); c.arc(bx, by, Math.max(0.7, 0.2 * u), 0, TAU); c.fill(); c.restore();
      }
    }
    // (8b1 — THE NOON STEAM WHISTLE: a white plume off Rosie's stacks, puffing up + drifting with the wind, f.steam 0..1 its envelope)
    if (r.kind === 'rosie' && (f.steam || 0) > 0.01 && !mirror) {
      const [sx0, sy0] = LP.P(...s.M.steam), tt = f.t || 0, n = 14;
      // (8b1 — the steam SHADED, not just white: on the city's cream towers a white puff vanished — each puff a grey body, a darker
      // underside + a bright crown toward the sky, so it reads against light stone by day + glows faintly at night)
      const night = f.T ? f.T.night || 0 : 0;
      for (let i = n - 1; i >= 0; i--) {
        const q = ((tt / 2.2 + i / n) % 1 + 1) % 1, rise = q * 8.5 * u, drift = q * q * 3.2 * u * (f.wind == null ? 1 : Math.max(-1.3, Math.min(1.3, f.wind / 5))), rr = (0.7 + 2.7 * q) * u;
        const a = 0.9 * (1 - q) ** 0.8 * Math.min(1, q / 0.05) * f.steam, cx2 = sx0 + drift, cy2 = sy0 - rise;
        if (a < 0.01) continue;
        const body = night > 0.5 ? [120, 124, 140] : [196, 200, 210], under = night > 0.5 ? [70, 72, 88] : [132, 138, 154], crown = night > 0.5 ? [180, 184, 200] : [255, 255, 255];
        const lo = c.createRadialGradient(cx2, cy2 + rr * 0.25, 0, cx2, cy2 + rr * 0.25, rr);
        lo.addColorStop(0, `rgba(${under.join(',')},${(a * 0.75).toFixed(3)})`); lo.addColorStop(1, `rgba(${under.join(',')},0)`);
        c.fillStyle = lo; c.fillRect(cx2 - rr, cy2 - rr * 0.75, rr * 2, rr * 2);
        const md = c.createRadialGradient(cx2, cy2, 0, cx2, cy2, rr * 0.85);
        md.addColorStop(0, `rgba(${body.join(',')},${(a * 0.9).toFixed(3)})`); md.addColorStop(1, `rgba(${body.join(',')},0)`);
        c.fillStyle = md; c.fillRect(cx2 - rr, cy2 - rr, rr * 2, rr * 2);
        const hi = c.createRadialGradient(cx2 - rr * 0.15, cy2 - rr * 0.3, 0, cx2 - rr * 0.15, cy2 - rr * 0.3, rr * 0.55);
        hi.addColorStop(0, `rgba(${crown.join(',')},${(a * 0.85).toFixed(3)})`); hi.addColorStop(1, `rgba(${crown.join(',')},0)`);
        c.fillStyle = hi; c.fillRect(cx2 - rr, cy2 - rr, rr * 2, rr * 2);
      }
    }
    // (POLISH 4 — THE TR-3B's BLACKOUT: the lit windows are painted into the night sprites — dark glass laid over the ones this pose
    // shows, by the power)
    zIn();
    if (f.power != null && f.power < 0.99 && f.T && f.T.night > 0.35 && s.wins) { c.globalAlpha = 1 - f.power; c.fillStyle = 'rgb(26,22,34)'; c.fill(s.wins); c.globalAlpha = 1; }
    // (the lights are additive: the pair's two layers simply weighted — exact)
    if (f.lights > 0.01) {
      c.globalCompositeOperation = 'lighter';
      for (const [R, w] of pr.B ? [[pr.A, 1 - pr.k], [pr.B, pr.k]] : [[s, 1]]) if (R.lights && w > 0.002) { c.globalAlpha = Math.min(1, f.lights) * (mirror ? 0.9 : 1) * w; c.drawImage(R.lights, 0, 0, R.w * dpr, R.h * dpr, -R.ox, -R.oy, R.w, R.h); }
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    }
    // PART 10's HOOK — THE CHASE: with set({ chase: { rate, k, span } }) her bulbs are drawn live, a bright band running along the
    // strings (rate bulbs a second; k its depth 0..1; span bulbs between bands) — the scheme's colours
    if (chase && s.bulbs && s.bulbs.length && f.lights > 0.01) {
      const cols = BULBS[rosieScheme] || BULBS.city, d = glow(), ph = (f.motion ? (f.t || 0) : 0) * (chase.rate || 8), span = chase.span || 6, kk = clamp01(chase.k ?? 0.8);
      c.save(); c.globalCompositeOperation = 'lighter';
      for (const b of s.bulbs) {
        const w = 0.5 + 0.5 * Math.cos(TAU * (b.i - ph) / span), a = Math.min(1, f.lights) * (1 - kk + kk * w * w);
        const sz = Math.max(1.2, u * 0.32) * 1.15 * (0.8 + 0.4 * w);
        c.globalAlpha = a; c.drawImage(d, b.x - sz, b.y - sz, sz * 2, sz * 2);
        const col = cols[b.i % cols.length]; c.fillStyle = `rgb(${mix(col, [255, 255, 255], 0.6).map(Math.round)})`; c.beginPath(); c.arc(b.x, b.y, Math.max(0.35, u * 0.07), 0, TAU); c.fill();
      }
      c.restore();
    }
    c.restore();
    c.restore();
    // the running lights on the TRUE heading: green to starboard, red to port — each seen only from its own side (and ahead), the
    // stern light from astern
    if (f.lights > 0.05 && !mirror) {
      const fwd = LP.dir([1, 0, 0]), toCam = [-st.x, cam.CAMH - LEVEL, -st.z], tl = Math.hypot(...toCam), fwdDot = (fwd[0] * toCam[0] + fwd[2] * toCam[2]) / tl;
      for (const d of s.P.dots) {
        if (d.kind !== 'side' && d.kind !== 'stern') continue;
        const n = LP.dir(d.n), sideDot = (n[0] * toCam[0] + n[2] * toCam[2]) / tl;
        const show = d.kind === 'side' ? sideDot > -0.05 && fwdDot > -0.4 : fwdDot < -0.3;
        if (!show) continue;
        const rr = Math.max(1.4, u * 0.45), k = d.kind === 'side' ? clamp01((sideDot + 0.05) / 0.25) * clamp01((fwdDot + 0.4) / 0.2) : clamp01((-0.3 - fwdDot) / 0.2);
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = f.lights * 0.9 * k;
        const [dx, dy] = LP.P(...d.p);
        c.drawImage(tint(d.col || [255, 250, 236]), sx + dx - rr, sy + bob + dy - rr, rr * 2, rr * 2);
        c.restore();
      }
    }
    if (!mirror && tier > 0) smoke(c, st, f, lk);
  }
  const tints = new Map();
  function tint(col) { const k = col.join(','); if (tints.has(k)) return tints.get(k); const c = cvs(32, 32), x = safeCtx(c), g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.2, `rgba(${k},0.9)`); g.addColorStop(1, `rgba(${k},0)`); x.fillStyle = g; x.fillRect(0, 0, 32, 32); tints.set(k, c); return c; }


  /** THE WAKE: the foam where the hull passed (anchored in the water, spreading + fading with age) — a Kelvin V (the near arm
   *  shows below the hull; the far arm half behind it), the churn behind the stern, a darker trough along the track. 8b2: from
   *  the boat's true heading — the stern's place + the arms across it curve with a turn */
  const sternOf = (r, p) => [p.x - Math.cos(p.hd) * r.len * 0.47, p.z - Math.sin(p.hd) * r.len * 0.47];
  function wake(c, st, f) {
    const r = st.r, W = WAKE[r.kind]; if (!W || !st.on) return;
    const n = tier === 0 ? Math.ceil(W.n / 2) : W.n, nightK = f.T.night > 0.5;
    const foam = nightK ? '170,178,226' : '255,255,255', fk = nightK ? 0.5 : 0.9;
    // the samples: where the stern was `age` seconds ago (that water keeps the foam), how fast she went then — re-sampled 10
    // times a second (the foam fades over seconds); every frame only the head follows the hull
    const now = performance.now(), wc = wakeCache.get(r.id);
    let pts;
    let img = wc && wc.img;
    if (wc && now - wc.at < 95 && wc.n === n && wc.night === nightK) { pts = wc.pts; const h = pts[0]; if (h) { const [a, b] = sternOf(r, st); h.sx = a; h.sz = b; h.px = Math.sin(st.hd); h.pz = -Math.cos(st.hd); } }
    else {
      // (the older two thirds of the wake — it only fades — drawn once into its own small image at each re-sample)
      pts = sample(r, st, f, n, W);
      img = wakeImage(wc && wc.img && wc.img.cv, r, W, pts, f, nightK, fk, foam);
      wakeCache.set(r.id, { at: now, pts, n, night: nightK, img });
    }
    if (img && img.w > 0) c.drawImage(img.cv, img.x, img.y, img.w, img.h);
    if (r.kind === 'taxi') draw3(c, r, W, pts, f, nightK, fk, foam, [0]);      // (only the fast taxi's head is drawn live)
    // the bow wave (moving: a white curl at the stem — at the leading end: going astern (Rosie backing in), her stern)
    if (r.kind === 'rosie' && st.moving) churn(c, r, st, f, pts.length ? pts[0].vc : 0, foam, fk);
    // (C2 — THE SWING's bow wave: a boat turning nearly in place pushes her stem SIDEWAYS through the water — a white curl on the
    // side it swings toward, by that sideways speed (Rosie's bow toward us through her turn; the tug, the sloops, the fishing tug))
    if (st.moving && r.kind !== 'taxi') {
      const q = at(r, st.ms - 250, f.nightAt);
      if (q.on) {
        const bl = r.len * 0.47, ca = Math.cos(st.hd), sa = Math.sin(st.hd);
        const vx = (st.x + ca * bl - q.x - Math.cos(q.hd) * bl) * 4, vz = (st.z + sa * bl - q.z - Math.sin(q.hd) * bl) * 4, lat = vx * -sa + vz * ca;
        const al = 0.55 * fk * clamp01((Math.abs(lat) - 0.06) / 0.4);
        if (al > 0.02) {
          const sg = Math.sign(lat), fb = bl + 0.4, [a, ya] = project(cam, st.x + ca * fb - sa * sg * 0.45, LEVEL, st.z + sa * fb + ca * sg * 0.45), s = cam.F / st.z, rx = s * (0.7 + 0.8 * Math.min(1, Math.abs(lat)));
          c.fillStyle = `rgba(${foam},${al.toFixed(3)})`; c.beginPath(); c.ellipse(a, ya, rx, Math.max(0.6, rx * 0.3), 0, 0, TAU); c.fill();
        }
      }
    }
    if (st.moving && st.seg !== 'turn' && pts.length && pts[0].vc > 0.15) {
      const k = (st.astern ? -1 : 1) * r.len * 0.47, [a, ya] = project(cam, st.x + Math.cos(st.hd) * k, LEVEL, st.z + Math.sin(st.hd) * k - 0.2), s = cam.F / st.z, side = Math.abs(Math.cos(st.hd));
      c.fillStyle = `rgba(${foam},${(0.6 * fk * Math.min(1, pts[0].vc / 1.2)).toFixed(3)})`; c.beginPath(); c.ellipse(a, ya, s * (r.kind === 'taxi' ? 0.9 : 0.55) * (0.45 + 0.55 * side), Math.max(0.45, s * 0.14), 0, 0, TAU); c.fill();
    }
  }
  const wakeCache = new Map();
  /** C2 — ROSIE's PADDLE-WHEEL CHURN (live, under her): white water boiling up behind the wheel while it turns — thrown aft, fanning
   *  out both sides of her stern (so it shows past her hull when she points at us), strongest when she's barely making way (the
   *  turn: the wheel working, the hull hardly moving); going astern the wheel throws it forward along her quarters. vc: her speed. */
  function churn(c, r, st, f, vc, foam, fk) {
    const n = 12, life = 2.6, tt = f.t || 0, ca = Math.cos(st.hd), sa = Math.sin(st.hd);
    const k0 = Math.max(fk, 0.7) * (0.55 + 0.35 * (1 - Math.min(1, vc / 0.7))), dir = st.astern ? 0.55 : -1;    // (aft, or forward along her quarters)
    const [wx, wz] = sternOf(r, st);
    c.save();
    for (let i = 0; i < n; i++) {
      const q = ((tt / life + i / n) % 1 + 1) % 1, side = i % 2 ? 1 : -1, wob = Math.sin(i * 2.3 + tt * 1.7) * 0.25;
      const along = 0.3 + q * 2.6, across = side * (0.9 + q * (st.astern ? 4.6 : 4.2) + wob);
      const x = wx + ca * along * dir + sa * across, z = wz + sa * along * dir - ca * across;
      const [px, py] = project(cam, x, LEVEL, z), s = cam.F / z, rx = (0.5 + 1.6 * q) * s;
      const a = k0 * (1 - q) ** 1.4 * Math.min(1, q / 0.12);
      if (a < 0.02) continue;
      c.fillStyle = `rgba(${foam},${a.toFixed(3)})`;
      c.beginPath(); c.ellipse(px, py, rx, Math.max(0.6, rx * 0.28), 0, 0, TAU); c.fill();
    }
    // (the boil itself, right behind the wheel: a bright patch)
    { const [px, py] = project(cam, wx + ca * 0.6 * dir, LEVEL, wz + sa * 0.6 * dir), s = cam.F / st.z, pulse = 0.85 + 0.15 * Math.sin(tt * 5.3);
      c.fillStyle = `rgba(${foam},${(k0 * 0.85 * pulse).toFixed(3)})`; c.beginPath(); c.ellipse(px, py, 2.3 * s, Math.max(0.8, 0.45 * s), 0, 0, TAU); c.fill(); }
    c.restore();
  }
  function sample(r, st, f, n, W) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const age = (i / n) * W.life, p = i ? at(r, st.ms - age * 1000, f.nightAt) : st;
      if (!p.on) break;
      const q = i ? at(r, st.ms - age * 1000 + 250, f.nightAt) : at(r, st.ms - 250, f.nightAt);
      // (C2: the foam follows the STERN's speed — a boat swinging in place sweeps her stern round at ~⅔ unit a second while her
      // centre barely drifts: the old centre speed left Rosie's turn without a wake; vc, the centre's, still drives the bow wave)
      const [sx, sz] = sternOf(r, p), [qx, qz] = sternOf(r, q);
      const v = Math.hypot(qx - sx, qz - sz) * 4, vc = Math.hypot(q.x - p.x, q.z - p.z) * 4;
      pts.push({ age, v, vc, sx, sz, px: Math.sin(p.hd), pz: -Math.cos(p.hd), spread: 0.2 + age * W.spread * Math.min(1.4, v / 2), k: (1 - age / W.life) * Math.min(1, v / 0.7) });
    }
    return pts;
  }
  // a wake point: the stern's track + an offset across the boat (+ = to starboard) in world units
  const wp = (p, o) => project(cam, p.sx + p.px * o, LEVEL, p.sz + p.pz * o);
  // the older bands of a wake into a small image (screen-aligned; the foam stays where the hull passed, so it only fades)
  function wakeImage(cv, r, W, pts, f, nightK, fk, foam) {
    if (pts.length < 3) return null;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of pts) for (const o of [-p.spread, p.spread, 0]) { const [x, y] = wp(p, o); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    x0 = Math.floor(x0 - 4); y0 = Math.floor(y0 - 4); x1 = Math.ceil(x1 + 4); y1 = Math.ceil(y1 + 4);
    const w = Math.max(1, Math.min(cam.W + 40, x1 - x0)), h = Math.max(1, Math.min(cam.H, y1 - y0));
    cv = cv || cvs(1, 1);
    const cw = Math.ceil(w * dpr), ch = Math.ceil(h * dpr);
    if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
    const x = safeCtx(cv);
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, cw, ch);
    x.setTransform(dpr, 0, 0, dpr, -x0 * dpr, -y0 * dpr);
    draw3(x, r, W, pts, f, nightK, fk, foam, r.kind === 'taxi' ? [1, 2] : [0, 1, 2]);
    return { cv, x: x0, y: y0, w, h };
  }
  // the foam drawn in three bands of strength per line (a stroke each — not one per segment); which: the bands to draw
  function draw3(c, r, W, pts, f, nightK, fk, foam, which = [0, 1, 2]) {
    if (pts.length < 2 || (pts[0].k < 0.02 && pts[1].k < 0.02)) return;
    c.save(); c.lineCap = 'round';
    // the wash on the track (white water right behind the stern, tapering + fading — Rosie's paddlewheel the most)
    const wash = r.kind === 'rosie' ? 0.62 : r.kind === 'taxi' ? 0.55 : 0.4;
    const s0 = cam.F / r.z, m = pts.length - 1, bands = [[0, Math.ceil(m / 3)], [Math.ceil(m / 3), Math.ceil(2 * m / 3)], [Math.ceil(2 * m / 3), m]];
    const line = (from, to, off, al, lw) => {
      if (al < 0.02 || to <= from) return;
      c.strokeStyle = `rgba(${foam},${al.toFixed(3)})`; c.lineWidth = lw;
      c.beginPath();
      for (let i = from; i <= to; i++) { const p = pts[i], [x, y] = wp(p, off(p)); if (i === from) c.moveTo(x, y); else c.lineTo(x, y); }
      c.stroke();
    };
    for (const [a, b] of which.map(i => bands[i])) {
      const mid = pts[(a + b) >> 1], k = mid.k, age = mid.age / W.life;
      line(a, b, () => 0, k * fk * wash, Math.max(0.5, s0 * (0.32 - 0.22 * age) * (r.kind === 'taxi' ? 1.2 : 1)));
      // the Kelvin V: two arms opening behind her — the near one (toward us) stronger, the far one fainter (half behind her)
      const nearSg = mid.pz <= 0 ? 1 : -1;
      line(a, b, p => nearSg * p.spread, k * fk * 0.9, Math.max(0.45, s0 * 0.1));
      if (tier > 0) line(a, b, p => -nearSg * p.spread, k * fk * 0.45, Math.max(0.45, s0 * 0.09));      // (tier 0: the far arm, half hidden, off)
    }
    c.restore();
  }

  return {
    layout, tick,
    /** draw the boats between depths z0..z1 (far first) with their wakes. f: { t, T, lights, motion, heel, nightAt, fade } */
    draw(c, f, z0, z1) {
      if (!L || f.fade <= 0) return;
      look = lookOf(f.T, f.heel || 0);
      c.save(); c.globalAlpha = f.fade;
      const list = states.filter(s => s.on && s.r.z >= z0 && s.r.z < z1).sort((a, b) => b.z - a.z);
      for (const st of list) {
        if (f.motion && !f.noWake && tier > 0) wake(c, st, f);          // (tier 0, the calm city: no wakes)
        // the taxi's own reflection, per frame (fast: the mirror's 10 a second would step it)
        if (st.r.kind === 'taxi' && tier > 0) { const ax = axisAt(L, st.z); c.save(); c.globalAlpha = f.fade * 0.38; c.translate(0, 2 * ax); c.scale(1, -1); drawOne(c, st, f, true); c.restore(); c.globalAlpha = f.fade; }
        drawOne(c, st, f, false);
      }
      c.restore();
    },
    /** the slow boats' reflections into the water's mirror (each about its own waterline: the model's sprite, mirrored) */
    mirrors(water, f) {
      if (!L || f.fade <= 0) return;
      look = lookOf(f.T, f.heel || 0);
      for (const st of states) if (st.on && (st.r.kind !== 'taxi' || tier === 0)) water.reflect(cx => { cx.save(); cx.globalAlpha = f.fade; drawOne(cx, st, f, true); cx.restore(); }, axisAt(L, st.z));
    },
    /** anything fast on the water (the taxi crossing): the scene keeps 60 fps */
    busy: () => states.some(s => s.on && s.moving && s.r.kind === 'taxi'),
    /** SKY-B: where each boat on the water is on screen (the patrol's searchlight picks one to look at) */
    spots: () => (cam ? states.filter(s => s.on).map(s => ({ id: s.r.id, x: project(cam, s.x, 0, s.z)[0], y: project(cam, s.x, LEVEL, s.z)[1] })) : []),
    /** HOOKS: { rosie: 'city' | 'valentine' | 'parade' | 'party' | 'halloween' | 'christmas' } — her bulb strings (11b/11c, 10);
     *  { chase: { rate (bulbs a second, 8), k (0..1, the band's depth), span (bulbs between bands, 6) } | null } — PART 10's chase */
    set(o) {
      if (o && o.rosie && BULBS[o.rosie] && o.rosie !== rosieScheme) rosieScheme = o.rosie;
      if (o && 'chase' in o) chase = o.chase ? { rate: 8, k: 0.8, span: 6, ...o.chase } : null;
      if (o && o.turnAt != null) turnAt = o.turnAt;
    },
    setTier(t) { tier = t; },
    hit(x, y) { for (const st of states) if (st.on) { const p = spr.get(st.r.id), s = p && p.recs.find(o => o.key && o.P); if (!s) continue; const [ax, ay] = project(cam, st.x, LEVEL, st.z), [x0, y0, x1, y1] = s.P.bounds; if (x >= ax + x0 - 4 && x <= ax + x1 + 4 && y >= ay + y0 - 4 && y <= ay + y1 + 4) return st.r.id; } return null; },
    debug: () => ({ boats: states.map(s => ({ id: s.r.id, on: s.on, x: +project(cam, s.x, 0, s.z)[0].toFixed(1), y: +project(cam, s.x, LEVEL, s.z)[1].toFixed(1), z: +s.z.toFixed(2), hd: +(s.hd / DEG).toFixed(1), face: +s.face.toFixed(2), shown: shown.get(s.r.id) ?? null, seg: s.seg, ...(s.phase ? { phase: s.phase } : null) })), mb: +(mb = memMB()).toFixed(2), mem: Object.fromEntries([...spr].map(([id, p]) => [id, { recs: p.recs.map(o => (o.key ? ['body', 'back', 'lights', 'comp'].filter(k => o[k] && o[k].width).map(k => `${k} ${o[k].width}x${o[k].height}`).join(' ') : '-')), mix: [p.mix, p.mixB].filter(Boolean).map(cv => `${cv.width}x${cv.height}`).join(' ') }])), scheme: rosieScheme, chase: !!chase, renders: stats.renders, split: { pose: +(stats.pose / Math.max(1, stats.renders)).toFixed(3), paint: +(stats.paint / Math.max(1, stats.renders)).toFixed(3), lights: +(stats.lights / Math.max(1, stats.renders)).toFixed(3) }, renderMs: { mean: +(stats.ms / Math.max(1, stats.renders)).toFixed(3), last: +stats.last.toFixed(3), max: +stats.max.toFixed(3) } }),
    destroy() { for (const w of wakeCache.values()) if (w.img) w.img.cv.width = 0; wakeCache.clear(); for (const p of spr.values()) freePool(p); spr.clear(); for (const t of tints.values()) t.width = 0; tints.clear(); if (dot) dot.width = 0; if (puffCv) puffCv.width = 0; L = null; },
  };
}
