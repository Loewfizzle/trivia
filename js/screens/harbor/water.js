// CITY 2.0 — THE HARBOR, Part 4: THE WATER (docs/harbor.md#the-water). The harbor between the far quay (z 230) and the railing
// (z 64) is a real, deep body of water: a MIRROR of everything above it, in perspective, broken by ripples from the real wind.
//
//   the base (baked: waterSteps)   the water's own colour + depth — blue-green and paler where it meets the far quay by day,
//                                  orange-pink at golden hour, near-black at night so the neon pops; darker toward the viewer
//   the mirror (every frame)       the frame ABOVE the waterline, as drawn this frame (the sky, the skyline, its lit windows, the
//                                  neon, the beacons, the searchlights, the quay lamps — whatever later parts add too, and the
//                                  construction tower at whatever stage it is), copied once, flipped about the waterline
//   the light columns (night)      a bright-pass of that copy (src³: only the lights survive) smeared into vertical columns by
//                                  stretched copies — a light high on a tower reflects as a long column reaching into the near
//                                  water, a low sign as a short one by the quay; calm = short and crisp, wind = long and broken
//   the ripples                    the mirror drawn row by row (strips thin far, thick near) with a sideways wobble + a vertical
//                                  break per row (waves are wavefronts parallel to the shore: one phase per depth), the rows'
//                                  brightness flickering crest / trough — so every reflected light breaks into shimmering bands
//   the wavelets                   two baked textures of perspective dashes (sky-lit crests, dark troughs) sliding against each
//                                  other; their density follows the wind
//   the paths                      the SUN's gold glitter path toward us when it is low (golden hour / dawn), the MOON's silver
//                                  one at night (its real place + phase; none when down or behind real cloud), sun glints by day
//   the near edge                  the water lapping at the foot of the near quay wall, behind the railing
//
// Cost: the work is split over frames — one BUILDS the mirror, the next COMPOSES the water (tier 2: 30 water frames a second;
// tier 1: 20, wider strips, fewer copies); tier 0 and reduced motion = a calm baked mirror, re-drawn about once a second with the
// ripples still (the lights still follow the city). HOOKS for later parts (docs/harbor.md
// "stubs"): reflect(fn, axisY) — an object standing in the water drawn flipped about its own waterline (the wheel + the
// lighthouse use it now; Part 5's boats, Rosie, the train, the beam) · light(x, y, col, a, w) — a light that is not in the frame
// above the waterline (fireworks high in the sky, Part 10; the ghost ship's glow, 11a) as a column in the water · wake(o) — Part 5
// draws boat wakes · set({ rain, fog }) — Part 9 (rain roughens the mirror now; the rings + the fog over the water: Part 9).
import { rgb, mix } from './shapes.js';
import { blit, safeCtx, BAKE_CAP } from '../../ui/canvas-safe.js';
import { groundY, project } from '../../core/harbor-layout.js';

/** the water's surface (world y): the far quay wall stands 1.2 above it (its stones show between the lamps + the water) */
export const LEVEL = -0.8;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const fract = v => v - Math.floor(v);
const hash = n => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);

/** the water's screen band (pt): top = the waterline at the far quay, bottom = the near edge (the road covers below it) */
export function waterBand(L) {
  const cam = L.cam;
  return { y0: project(cam, 0, LEVEL, L.water.z1)[1], y1: groundY(cam, L.water.z0) };
}
/** the screen y where the water meets something standing in it at depth z (the axis its reflection flips about) */
export const axisAt = (L, z) => project(L.cam, 0, LEVEL, z)[1];

// the water's own colour: far (grazing: the low sky's light on it), middle, near (looking down into it)
const TINT = {
  // (THE DAY PASS: a deeper blue-green harbor, the far end paler with the sky's light on it)
  day: [[124, 178, 210], [26, 102, 140], [6, 50, 88]],
  gold: [[226, 146, 108], [150, 76, 82], [58, 28, 56]],
  night: [[22, 18, 46], [9, 9, 26], [3, 3, 11]],
};
export function waterTint(T) {
  const out = [0, 1, 2].map(i => [0, 1, 2].map(c => TINT.day[i][c] * T.day + TINT.gold[i][c] * T.gold + TINT.night[i][c] * T.night));
  return out;
}

/** THE BASE (baked with the look): the water's colour + depth, the shadow along the far quay's foot */
export function waterSteps(L, T) {
  const cam = L.cam, { y0, y1 } = waterBand(L), [far0, mid, near] = waterTint(T);
  // (by day the grazing far water takes the real sky's own blue near the horizon)
  const far = T.skyLo && T.day > 0 ? mix(far0, mix(T.skyLo, T.skyHi || T.skyLo, 0.5), 0.35 * T.day) : far0;
  return [x => {
    const g = x.createLinearGradient(0, y0, 0, y1 + 8);
    g.addColorStop(0, rgb(far)); g.addColorStop(0.18, rgb(mix(far, mid, 0.7))); g.addColorStop(0.55, rgb(mid)); g.addColorStop(1, rgb(near));
    x.fillStyle = g; x.fillRect(0, y0, cam.W, y1 + 8 - y0);
    // the quay wall's foot: wet, dark stone just above the water + a contact shadow on the water under it
    x.fillStyle = rgb(mix(near, [0, 0, 0], 0.4), 0.55); x.fillRect(0, y0, cam.W, 0.8);
  }];
}

/** THE REFLECTION ENGINE (per frame): see the top of this file */
export function createWater() {
  const mk = () => document.createElement('canvas');
  const src = mk(), bright = mk(), sm = mk(), R = mk(), wc = mk(), cols = new Map();
  const tex = [mk(), mk()];
  let L = null, cam = null, W = 0, y0 = 0, y1 = 0, Hw = 0, top = 0, sh = 0, dpr = 1, rr = 1, tier = 2, A0 = 0, oy = 0, oyD = 0;
  let strips = [], dashes = [], glints = [], texKey = '', lastT = 0, updAt = -1e9, ready = false, set0 = { rain: 0, fog: 0 };
  let queue = [], mirrors = [], wakes = [], stats = { strips: 0, copies: 0, lights: 0, paths: '' };

  function size(cv, w, h) { const cw = Math.max(1, Math.ceil(w)), ch = Math.max(1, Math.ceil(h)); if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; } return safeCtx(cv); }
  /** the layout: the band, the canvases, the strips (thin far, thick near: one wave phase per depth) */
  function layout(l, o) {
    L = l; cam = l.cam; W = cam.W; tier = o.tier ?? 2; dpr = Math.min(BAKE_CAP, o.dpr || 1);
    ({ y0, y1 } = waterBand(L)); Hw = Math.max(4, y1 - y0);
    A0 = y0;
    top = Math.max(0, cam.limitY - 12); sh = Math.max(Hw + 4, y0 - top);
    rr = 1;                                       // (a reflection is soft: the mirror at 1 px a pt, the light columns at half)
    size(src, W * rr, sh * rr); size(bright, W * rr * 0.5, sh * rr * 0.5); size(sm, W * rr * 0.5, (Hw + 6) * rr * 0.5);
    size(R, W * rr, (Hw + 6) * rr);
    // THE WATER'S CANVAS SITS ON WHOLE DEVICE ROWS (NEON PASS 4 — the owner's "thin black bars" on her iPhone): its top is the
    // waterline rounded to the scene's device row (it is blitted 1:1, never resampled), and every strip below covers whole
    // device rows, edge to edge. (Strips at fractional rows anti-aliased their edges: two half-covered, half-transparent rows
    // over the black base read as a thin dark line at every strip's seam — WebKit's drawImage shows it most.)
    oyD = Math.round(y0 * dpr); oy = oyD / dpr;
    size(wc, W * dpr, (y1 + 2 - oy) * dpr);
    strips = [];
    const k = tier === 2 ? 1 : 1.55, rEnd = Math.max(1, Math.round((y1 - oy) * dpr));
    const zAt = y => cam.F * (cam.CAMH - LEVEL) / Math.max(1, y - cam.VPY);
    for (let r = 0; r < rEnd;) {
      const y = oy + r / dpr, u = clamp01((y - y0) / Hw);
      const hd = Math.min(rEnd - r, Math.max(1, Math.round((0.7 + 2.7 * Math.pow(u, 1.25)) * k * (cam.F / 600) * dpr))), h = hd / dpr;
      const z = zAt(y + h / 2);
      // the crest / trough is box-filtered over the strip: a far strip spans many wave crests (its brightness is their average),
      // so its contrast fades with the wave phase it covers — no near-random bright / dark alternation in thin far rows
      const dph = 1.21 * Math.abs(zAt(y) - zAt(y + h));
      strips.push({ r, hd, y, h, u, z, s: cam.F / z, ck: Math.min(1, 1.6 / Math.max(1e-3, dph)), seed: hash(strips.length + 1) });
      r += hd;
    }
    // the paths' dashes + the day's glints: their dice once (the compose only twinkles them)
    const at = u => { const y = y0 + u * Hw, z = cam.F * (cam.CAMH - LEVEL) / Math.max(1, y - cam.VPY); return { y, s: cam.F / z }; };
    dashes = Array.from({ length: 200 }, (_, i) => { const u = Math.pow(hash(i * 1.37 + 0.5), 0.85), p = at(u); return { u, y: p.y, s: p.s, off: (hash(i * 2.11 + 7) - 0.5) * 2 * (0.4 + 0.6 * hash(i * 5.3)), fr: 2.2 + 3.5 * hash(i * 4.7), ph: hash(i * 8.3) * 6.28, st: 0.35 + 0.65 * hash(i * 9.1), len: 0.5 + 1.6 * hash(i * 3.3), th: Math.max(0.45, p.s * 0.07) }; });
    glints = Array.from({ length: 110 }, (_, i) => { const u = Math.pow(hash(i * 3.91 + 2), 0.9), y = y0 + 2 + u * (Hw - 3), z = cam.F * (cam.CAMH - LEVEL) / Math.max(1, y - cam.VPY), sc = cam.F / z;
      return { u, y, near: hash(i * 1.7) < 0.55, off: hash(i * 6.1) - 0.5, wx: hash(i * 7.7) * W, fr: 3 + 4 * hash(i * 5.5), ph: hash(i * 8.8) * 6.28, st: hash(i * 2.9) > 0.6 ? 0.8 : 0, len: sc * (0.3 + 0.7 * hash(i * 4.1)), th: Math.max(0.5, sc * 0.08) }; });
    texKey = ''; ready = true; updAt = -1e9; built = composed = false;
  }

  // ---------------------------------------------------------------- the wavelets: two perspective dash textures
  function bakeTex(T, rough) {
    const skyC = T.day > 0 && T.skyHi ? mix(T.skyHi, [255, 255, 255], 0.38) : null;
    const key = `${Math.round(T.day * 6)}${Math.round(T.gold * 6)}${Math.round(T.night * 6)}|${Math.round(rough * 4)}|${W}|${dpr}${skyC ? '|' + skyC.map(v => v >> 4).join('.') : ''}`;
    if (key === texKey) return;
    texKey = key;
    // (THE DAY PASS: by day the crests carry the real sky's colour — a blue sky in every ripple)
    const crest = mix(mix(skyC || [214, 232, 244], [255, 196, 140], T.gold / Math.max(0.01, T.day + T.gold)), [150, 140, 210], T.night);
    tex.forEach((cv, n) => {
      const x = size(cv, W * dpr, (Hw + 2) * dpr);
      x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, Hw + 2);
      let sd = 17 + n * 101;
      const R1 = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
      const count = Math.round((W / 402) * (260 + 360 * rough) * (n ? 0.7 : 1));
      for (let i = 0; i < count; i++) {
        const u = Math.pow(R1(), 0.75), y = u * Hw, z = cam.F * (cam.CAMH - LEVEL) / Math.max(1, y + y0 - cam.VPY), s = cam.F / z;
        const len = s * (0.6 + R1() * (1.6 + 2.4 * rough)), th = Math.max(0.35, s * (0.05 + 0.04 * rough));
        const lightK = R1() < 0.55;
        x.fillStyle = lightK ? rgb(crest, (0.18 + 0.4 * R1()) * (0.55 + 0.45 * u)) : `rgba(0,0,8,${(0.12 + 0.22 * R1()) * (0.5 + 0.5 * u)})`;
        x.fillRect(R1() * W, y + (lightK ? 0 : th * 0.9), len, th);
      }
    });
  }

  // ---------------------------------------------------------------- a light's column sprite (per colour, white-hot core)
  function column(col) {
    const key = col.map(v => v >> 3).join(',');
    if (cols.has(key)) return cols.get(key);
    const c = mk(), x = size(c, 16, 96);
    for (let y = 0; y < 96; y++) {
      const v = y / 96, a = Math.pow(1 - v, 1.4) * (0.55 + 0.45 * hash(y * 3.7 + col[0]));
      const g = x.createLinearGradient(0, 0, 16, 0);
      g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(0.5, `rgba(${mix(col, [255, 255, 255], 0.35).map(Math.round)},${a})`); g.addColorStop(1, `rgba(${col},0)`);
      x.fillStyle = g; x.fillRect(0, y, 16, 1);
    }
    if (cols.size > 24) { const [k0, c0] = cols.entries().next().value; c0.width = 0; cols.delete(k0); }
    cols.set(key, c);
    return c;
  }

  /**
   * Draw the water. c: the scene's context (dpr transform), main: the scene's canvas (the frame so far — everything above the
   * waterline is drawn), f: { t, T (tones), night (0..1 dark), fade, motion, wind (m/s), cloud, rain, sun: sun.debug(), moon:
   * { x, y, r, k } | null, mirrors: [{ cv, sx, sy, sw, sh (device px), x, y, w, h (pt), axis }], punch (the neon's beat punch now) }
   * The work is split over two frames (30 water frames a second, an even cost every frame; tier 1: three, 20 a second): one
   * frame BUILDS the mirror (the copy of the frame above the waterline, the objects in the water, the light columns), the next
   * COMPOSES the water from it (the ripples, the wavelets, the paths, the lapping) into its canvas; every frame shows it. Tier 0 and reduced
   * motion: a still mirror, built + composed about once a second.
   */
  function draw(c, main, f) {
    if (!ready || f.fade <= 0 || set0.off) { queue = []; mirrors = []; return; }
    const still = !f.motion || tier === 0, now = performance.now();
    if (still) { if (now - updAt > 1000 || !composed) { build(main, f, lastT, true); compose(f, lastT, true); updAt = now; } }
    else {
      // the cycle ON THE CLOCK (cleanup pass 1: the scene draws at 30 fps when the city is calm — the water keeps its rates):
      // the mirror's SOURCE is re-read 10 times a second (the city's lights change slowly, the ripples hide the rest), the
      // ripples composed 30 times a second at tier 2 (20 at tier 1); never both in one frame
      // (C1.5: never on a PUNCH frame — the neon's second, additive draw is the frame's heaviest fill; the build waits for the
      // punch to pass, ≤ 160 ms after the last one: the mirror is 0–95 ms old anyway, so it never shows — review-2.md §1b-2)
      if (!built || (now - builtAt >= 95 && !(f.punch > 0.2 && now - builtAt < 160))) { build(main, f, f.t, false); builtAt = now; }
      else if (now - composedAt >= (tier === 2 ? 30 : 46)) { compose(f, f.t, false); composedAt = now; }
      lastT = f.t;
    }
    queue = []; mirrors = [];
    if (!composed) return;
    const tb = performance.now();
    // (1:1 onto the scene's device pixels: its top on a whole row, its size its own — never resampled, so never a soft seam)
    c.save(); c.globalAlpha = f.fade; c.drawImage(wc, 0, oy, wc.width / dpr, wc.height / dpr); c.restore();
    ema('blit', performance.now() - tb);
  }
  // (the steps' cost, smoothed: harbor().water.ms — tests + the perf budget)
  const ema = (k, v) => { const m = stats.ms || (stats.ms = {}); m[k] = +((m[k] || 0) * 0.92 + v * 0.08).toFixed(3); };
  let built = false, composed = false, builtAt = -1e9, composedAt = -1e9;
  const roughOf = f => clamp01(smooth(1.2, 11, Math.max(0, f.wind || 0)) + 0.35 * (f.rain || set0.rain || 0));

  // BUILD: the mirror (R) from the frame above the waterline, the objects in the water, the light columns
  function build(main, f, t, still) {
    const md = main.width / W;
    // ROUGHNESS from the real wind (m/s): glassy under ~1.5, choppy past ~11; real rain roughens it too (Part 9 adds the rings)
    const rough = roughOf(f);
    stats.rough = +rough.toFixed(2);
    // 1. the frame above the waterline, as drawn (one copy, at the mirror's resolution)
    const tm0 = performance.now();
    const sx = safeCtx(src);
    sx.setTransform(1, 0, 0, 1, 0, 0); sx.globalCompositeOperation = 'copy'; sx.globalAlpha = 1;
    blit(sx, main, 0, top * md, W * md, sh * md, 0, 0, src.width, src.height);
    sx.globalCompositeOperation = 'source-over';
    const tm1 = performance.now(); ema('copy', tm1 - tm0);
    // 2. the mirror: flipped about the waterline (an R row r pt below it ↔ the frame r pt above it)
    const rx = safeCtx(R);
    rx.setTransform(1, 0, 0, 1, 0, 0); rx.globalAlpha = 1; rx.globalCompositeOperation = 'copy';
    rx.setTransform(rr, 0, 0, -rr, 0, rr * A0);
    blit(rx, src, 0, (sh - Hw - 6) * rr, src.width, (Hw + 6) * rr, 0, A0 - Hw - 6, W, Hw + 6);
    rx.globalCompositeOperation = 'source-over';
    // objects standing in the water, each about its own waterline (the wheel, the lighthouse; Part 5: the boats, Rosie, the train)
    for (const m of [...(f.mirrors || []), ...mirrors]) {
      rx.setTransform(rr, 0, 0, -rr, 0, rr * (2 * m.axis - A0));
      if (m.fn) m.fn(rx); else if (m.cv && m.sw > 0 && m.sh > 0) blit(rx, m.cv, m.sx, m.sy, m.sw, m.sh, m.x, m.y, m.w, m.h);
    }
    // 3. the lights' columns (night): src³ keeps only the lights; stretched copies (at half resolution: they are soft) smear
    //    each into a column — a light high on a tower reaches into the near water, a low sign stays by the quay; calm: short +
    //    crisp, wind: long + broken
    const tmM = performance.now(); ema('mirror', tmM - tm1);
    const lk = clamp01(f.night) * (tier === 0 ? 0.85 : 1);
    stats.copies = 0;
    if (lk > 0.03) {
      const bx = safeCtx(bright), bw = bright.width, bh = bright.height;
      bx.setTransform(1, 0, 0, 1, 0, 0); bx.globalAlpha = 1; bx.globalCompositeOperation = 'copy';
      bx.drawImage(src, 0, 0, bw, bh);
      bx.globalCompositeOperation = 'multiply'; bx.drawImage(src, 0, 0, bw, bh); bx.drawImage(src, 0, 0, bw, bh);
      const smx = safeCtx(sm), h2 = rr * 0.5;
      smx.setTransform(1, 0, 0, 1, 0, 0); smx.globalAlpha = 1; smx.globalCompositeOperation = 'source-over'; smx.clearRect(0, 0, sm.width, sm.height);
      const K = tier === 2 ? Math.round(5 + 5 * rough) : tier === 1 ? Math.round(3 + 3 * rough) : 4;
      const s0 = 0.6 - 0.36 * rough, s1 = 1.12 + 0.16 * rough;
      smx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < K; k++) {
        const q = K > 1 ? k / (K - 1) : 1, s = s0 + (s1 - s0) * q, near1 = 1 - Math.min(1, Math.abs(s - 1) / Math.max(0.2, 1 - s0));
        const dx = Math.sin(k * 2.1) * (0.4 + 1.2 * rough);
        smx.globalAlpha = lk * (0.24 + 0.46 * near1) * (0.95 - 0.2 * rough);
        smx.setTransform(h2, 0, 0, -h2 * s, h2 * dx, h2 * s * A0);
        // (only the rows that land in the water: a light e pt up lands s·e pt down)
        const eMax = (Hw + 6) / s, y1s = Math.max(top, A0 - eMax);
        blit(smx, bright, 0, (y1s - top) / sh * bh, bw, (A0 - y1s) / sh * bh, 0, y1s, W, A0 - y1s);
        stats.copies++;
      }
      rx.setTransform(1, 0, 0, 1, 0, 0); rx.globalAlpha = 1; rx.globalCompositeOperation = 'lighter';
      rx.drawImage(sm, 0, 0, R.width, R.height);
    }
    // lights that are not in the frame above the waterline (fireworks high in the sky, Part 10; the ghost ship's glow): columns
    rx.globalCompositeOperation = 'lighter';
    for (const p of queue) {
      const e = A0 - p.y, r = Math.max(2, e * 0.95), len = p.len ? Math.min(Hw * 1.2, p.len * (0.85 + 0.5 * rough)) : Math.max(10, Math.min(Hw * 1.2, e * (0.5 + rough)));
      rx.setTransform(rr, 0, 0, rr, 0, -rr * A0); rx.globalAlpha = clamp01(p.a);
      const w = Math.max(2, p.w || 3) * 2.4;
      rx.drawImage(column(p.col), p.x - w / 2, A0 + r - len * 0.35, w, len);
    }
    stats.lights = queue.length;
    rx.globalAlpha = 1; rx.globalCompositeOperation = 'source-over';
    built = true;
    const tm2 = performance.now(); ema('columns', tm2 - tmM); ema('build', tm2 - tm0);
  }

  // COMPOSE: the water's canvas from the mirror — the ripples, the wavelets, the paths, the lapping (screen coordinates)
  function compose(f, t, still) {
    if (!built) return;
    const tm2 = performance.now(), T = f.T, rough = roughOf(f), fa = 1;
    const x = safeCtx(wc), Wd = wc.width;
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, wc.width, wc.height);
    // 4. the ripples: the mirror row by row (one wave phase per depth: a sideways wobble, a vertical break, crest / trough) —
    //    in device pixels: each strip fills its own whole rows (st.r, st.hd), wider than the canvas (no edge inside it)
    const dayK = Math.min(1, T.day + T.gold * 0.6);
    const amp = 0.05 + 0.3 * rough, jit = 0.03 + 0.22 * rough;
    for (const st of strips) {
      const ph = st.z * 0.92 - t * 1.35, ph2 = st.z * 2.37 + t * 1.9 + st.seed * 6.28;
      const A = amp * st.s, dx = A * (0.66 * Math.sin(ph) + 0.34 * Math.sin(ph2));
      const dy = jit * st.s * Math.sin(st.z * 1.71 + t * 1.1 + st.seed * 3);
      // FRESNEL + DEPTH: a mirror at the grazing far end; looking down near us more of the water's own colour (the base under
      // it: blue-green by day, orange at golden hour, black at night) — so it darkens toward us; the wind breaks it up
      // (THE DAY PASS: a stronger mirror by day — the wheel, the lighthouse and the sunlit city read in the water; golden hour + night as before)
      const fres = (0.93 - (0.42 + 0.26 * dayK - 0.16 * T.day) * Math.pow(st.u, 0.8)) * (1 - 0.3 * rough) * (1 - 0.26 * dayK + 0.17 * T.day);
      const crest = 0.5 + 0.5 * Math.sin(st.z * 1.21 - t * 1.6 + st.seed * 2);
      const sk = (0.12 + 0.38 * rough + 0.1 * st.u) * st.ck;
      x.globalAlpha = clamp01(fres * (1 - sk + sk * crest)) * fa;
      const ry = Math.max(0, Math.min(Hw + 6 - st.h, st.y - y0 + dy));
      const pad = Math.abs(A) + 1;
      blit(x, R, 0, ry * rr, R.width, Math.max(1, st.h * rr), (dx - pad) * dpr, st.r, Wd + 2 * pad * dpr, st.hd);
    }
    stats.strips = strips.length;
    x.globalAlpha = 1;
    x.setTransform(dpr, 0, 0, dpr, 0, -oyD);
    const tS = performance.now(); ema('strips', tS - tm2);
    // 5. the wavelets: sky-lit crests + dark troughs sliding against each other (their density follows the wind)
    bakeTex(T, rough);
    const ta = (0.95 * dayK + 0.45 * T.night) * (0.55 + 0.45 * rough) * fa * (1 - 0.3 * T.day);
    if (ta > 0.01) {
      const o1 = still ? 0 : ((t * (3 + 9 * rough)) % W + W) % W, o2 = still ? W * 0.37 : ((-t * (2 + 6 * rough)) % W + W) % W;
      for (const [cv, o0, al] of [[tex[0], o1, ta], [tex[1], o2, ta * 0.8]].slice(0, tier === 2 ? 2 : 1)) {
        x.globalAlpha = al;
        // (the texture wraps: its two pieces, each drawn once, 1:1 — the wrap on a whole device column, so no seam there either)
        const o = Math.round(o0 * dpr) / dpr, th = cv.height / dpr;
        if (o > 0.5) blit(x, cv, (W - o) * dpr, 0, o * dpr, cv.height, 0, oy, o, th);
        if (W - o > 0.5) blit(x, cv, 0, 0, (W - o) * dpr, cv.height, o, oy, W - o, th);
      }
      x.globalAlpha = 1;
    }
    const tT = performance.now(); ema('tex', tT - tS);
    // 6. the paths: the sun's gold (low: golden hour, dawn), the moon's silver (night), the sun's glints by day
    x.globalCompositeOperation = 'lighter';
    stats.paths = '';
    const sun = f.sun, cloud = clamp01(f.cloud || 0);
    if (sun && sun.vis > 0.02 && sun.el > -2 && sun.el < 16) {
      const k = smooth(16, 3, sun.el) * smooth(-2, 0.5, sun.el) * Math.min(1, sun.vis * 1.2) * (1 - 0.85 * smooth(0.55, 0.95, cloud)) * fa;
      if (k > 0.02) { glitter(x, sun.x, k, [255, 196, 120], [255, 240, 200], t, still, rough, 1); stats.paths += 'sun '; }
    }
    if (f.moon && f.moon.k > 0.02) { glitter(x, f.moon.x, f.moon.k * T.night * fa, [178, 192, 236], [238, 242, 255], t, still, rough, 0.62); stats.paths += 'moon '; }
    // (THE DAY PASS — the sun's glitter path by day: a high sun's narrow white trail of sparkle under it, toward us)
    if (T.day > 0.05 && sun && sun.vis > 0.1 && sun.el >= 12 && sun.x > -40 && sun.x < W + 40) {
      const kd = 0.5 * T.day * Math.min(1, sun.vis * 1.2) * smooth(12, 20, sun.el) * (1 - 0.9 * smooth(0.4, 0.85, cloud)) * fa;
      if (kd > 0.02) { glitter(x, sun.x, kd * 1.4, [236, 244, 255], [255, 255, 250], t, still, rough, 0.78); stats.paths += 'daypath '; }
    }
    if (T.day > 0.05 && sun && sun.vis > 0.1) { sparkle(x, sun.x, T.day * (1 - 0.8 * smooth(0.4, 0.9, cloud)) * fa, t, still, rough); stats.paths += 'glints '; }
    x.globalCompositeOperation = 'source-over';
    const tP = performance.now(); ema('paths', tP - tT);
    // 7. the near edge: the water lapping at the near quay wall, behind the railing (a slow surge)
    x.globalAlpha = fa; lap(x, T, t, still, rough); x.globalAlpha = 1;
    composed = true;
    ema('compose', performance.now() - tm2);
  }

  /** a glitter path toward us from x: a soft column + broken dashes twinkling, wider near; k strength */
  function glitter(x, sx, k, col, hot, t, still, rough, size) {
    const n = Math.min(dashes.length, Math.round((tier === 2 ? 200 : tier === 1 ? 110 : 80) * size));
    // the soft column under the dashes
    const g = x.createLinearGradient(0, y0, 0, y1);
    // (the sun's path has a hot core by the quay; the moon's is mostly its glints — a solid bar reads as a light, not a path)
    const ck = size >= 1 ? 1 : 0.32;
    g.addColorStop(0, rgb(hot, Math.min(1, 0.85 * k * ck))); g.addColorStop(0.3, rgb(col, 0.42 * k * ck)); g.addColorStop(1, rgb(col, 0.1 * k * ck));
    x.fillStyle = g;
    for (const [wTop, wBot, a] of [[3, 18, 1], [6, 36, 0.55], [10, 64, 0.25]]) {
      const wt = wTop * size * (1 + rough), wb = wBot * size * (0.7 + rough);
      x.globalAlpha = a; x.beginPath(); x.moveTo(sx - wt, y0); x.lineTo(sx + wt, y0); x.lineTo(sx + wb, y1); x.lineTo(sx - wb, y1); x.fill();
    }
    x.globalAlpha = 1;
    const hotS = rgb(hot), colS = rgb(col);
    let lastHot = null;
    const sw = Math.sqrt(size) * (0.65 + 1.1 * rough), lk = 0.6 + 0.6 * rough;
    for (let i = 0; i < n; i++) {
      const d = dashes[i], s = d.s, y = d.y;
      const spread = (4 + 44 * d.u) * sw;
      const xx = sx + d.off * spread;
      const sn = still ? 0 : Math.sin(t * d.fr + d.ph), tw = still ? d.st : sn > 0 ? sn * sn * sn : 0;
      const centre = 1 - Math.min(1, Math.abs(xx - sx) / Math.max(1, spread));
      const a = k * (0.25 + 1.1 * tw) * (0.3 + 0.7 * centre);
      if (a < 0.03) continue;
      const hotK = centre * tw > 0.45;
      if (hotK !== lastHot) { x.fillStyle = hotK ? hotS : colS; lastHot = hotK; }
      x.globalAlpha = Math.min(1, a);
      const len = s * d.len * lk;
      x.fillRect(xx - len / 2, y, len, d.th);
    }
    x.globalAlpha = 1;
  }
  /** sun glints by day: sparkles across the water, thicker toward the sun's side */
  function sparkle(x, sx, k, t, still, rough) {
    const n = Math.min(glints.length, tier === 2 ? 110 : tier === 1 ? 60 : 40), kk = k * (0.7 + 0.3 * rough);
    x.fillStyle = 'rgb(255,252,236)';
    for (let i = 0; i < n; i++) {
      const g = glints[i];
      let tw = g.st;
      if (!still) { const sn = Math.sin(t * g.fr + g.ph); if (sn <= 0.67) continue; const q = sn * sn; tw = q * q * q * q; }   // (sin⁸ < 0.04 below 0.67)
      const a = kk * tw;
      if (a < 0.04) continue;
      const xx = g.near ? sx + g.off * (60 + 180 * g.u) : g.wx;
      x.globalAlpha = Math.min(1, a);
      x.fillRect(xx - g.len / 2, g.y, g.len, g.th);
    }
    x.globalAlpha = 1;
  }
  /** the near edge: a slow surge lapping at the wall's foot behind the railing (a wet band + a bright crest line) */
  function lap(x, T, t, still, rough) {
    const surge = still ? 0.5 : 0.5 + 0.5 * Math.sin(t * 0.85), sN = cam.F / 64;
    const base = y1 - (0.18 + 0.12 * surge + 0.08 * rough) * sN;
    const wave = xx => base - (0.06 + 0.07 * rough) * sN * Math.sin(xx * 0.05 + t * 1.25) - 0.04 * sN * Math.sin(xx * 0.13 - t * 0.8);
    x.beginPath(); x.moveTo(0, y1 + 2);
    for (let xx = 0; xx <= W + 6; xx += 6) x.lineTo(xx, wave(xx));
    x.lineTo(W, y1 + 2); x.closePath();
    const [, , near] = waterTint(T);
    x.fillStyle = rgb(mix(near, [0, 0, 0], 0.35), 0.5); x.fill();
    const crest = mix(mix([226, 238, 246], [255, 206, 150], T.gold / Math.max(0.01, T.day + T.gold)), [255, 206, 150], T.night);
    x.strokeStyle = rgb(crest, (0.28 * (T.day + T.gold) + 0.2 * T.night) * (0.7 + 0.3 * surge)); x.lineWidth = Math.max(0.6, 0.06 * sN);
    x.beginPath(); for (let xx = 0; xx <= W + 6; xx += 6) { const yy = wave(xx); if (xx) x.lineTo(xx, yy); else x.moveTo(xx, yy); } x.stroke();
  }

  return {
    layout, draw,
    /** HOOK: an object standing in the water, drawn flipped about its own waterline axisY (screen pt) this frame: fn(ctx) draws
     *  it in screen coordinates (Part 5: the boats, Rosie and her bulbs, the train, the lighthouse beam) */
    reflect(fn, axisY) { mirrors.push({ fn, axis: axisY }); },
    /** HOOK: a light not in the frame above the waterline (fireworks high up — Part 10; the ghost ship's glow — 11a): its
     *  column in the water this frame. x, y: the light on screen (pt), col [r,g,b], a 0..1, w its size (pt), len: its column's
     *  length (pt; NEON PASS 2 — the waterfront's long streaks; default: by its height above the water) */
    light(x, y, col, a = 1, w = 3, len = 0) { if (queue.length < 400) queue.push({ x, y, col, a, w, len }); },
    /** HOOK (Part 5): a boat's wake — { x, z, len, dir, k } world units; stored, not yet drawn */
    wake(o) { wakes.push(o); if (wakes.length > 16) wakes.shift(); },
    /** HOOK (Part 9): { rain: 0..1 (roughens the mirror now; the rings: Part 9), fog: 0..1 (the fog over the water: Part 9) } */
    set(o) { Object.assign(set0, o || {}); },
    band: () => ({ y0, y1 }),
    mem: () => +([src, bright, sm, R, wc, ...tex, ...cols.values()].reduce((s, cv) => s + cv.width * cv.height * 4, 0) / 1e6).toFixed(2),
    debug: () => ({ y0: +y0.toFixed(1), y1: +y1.toFixed(1), strips: stats.strips, copies: stats.copies, lights: stats.lights, paths: stats.paths.trim(), rough: stats.rough, ms: stats.ms, rr, tier,
      // (NEON PASS 4: every strip on whole device rows, edge to edge from the canvas's top — no seam can anti-alias)
      grid: Number.isInteger(oyD) && strips.every((s, i) => Number.isInteger(s.r) && Number.isInteger(s.hd) && s.hd >= 1 && s.r === (i ? strips[i - 1].r + strips[i - 1].hd : 0)) && !!strips.length && strips[strips.length - 1].r + strips[strips.length - 1].hd <= wc.height, rows: [oyD, ...strips.map(s => s.r)], wakes: wakes.length, mb: +([src, bright, sm, R, wc, ...tex].reduce((s, cv) => s + cv.width * cv.height * 4, 0) / 1e6).toFixed(2) }),
    destroy() { for (const cv of [src, bright, sm, R, wc, ...tex, ...cols.values()]) { cv.width = 0; cv.height = 0; } cols.clear(); ready = false; },
  };
}
