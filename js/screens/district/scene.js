// NEON SPEAKEASY — the title screen's city (the neon district outside the bar) (Canvas 2D, PULSE-style: everything expensive is pre-rendered).
//
//   sky (+ stars, horizon glow) -> 4 skyline layers far→near, each with haze at its feet -> beacons, the signs,
//   planes and satellites (aircraft.js) -> the wet street: the whole city reflected (flipped, squashed, streaked,
//   rippling), sign + logo light spilling onto it, puddle ripples -> rain over everything.
//
// Every skyline layer is drawn once into two offscreen canvases: DARK (silhouettes, unlit window glass) and LIT
// (lit windows, neon trims, rooftop signs). The power-on ("the city wakes up") draws the lit windows one by one
// from the bottom up for ~1.5 s, then hands over to the LIT canvases. Steady state is ~80 drawImage calls.
// The city's signs (signs.js): a rooftop marquee, a blade sign, neon icon signs and a ticker, rotating through the games.
// LIVING CITY: the sky follows the player's real local time (core/sky.js → palette.js): dawn, a hazy matinee day, golden
// hour, night, the small hours; the real sun and moon; the season, holidays and sky events (fx.js). The look is
// recomputed every few seconds; the sky, each layer's composite (tinted silhouettes + the windows lit right now) and the
// reflection are re-baked only when it visibly changes (look.key / the window count), so a steady frame stays cheap.
// Quality tiers (DPR 2 / 1.5 / 1, rain, shimmer, ripples) step down when frames run slow; rendering
// pauses while the tab is hidden; destroy() releases every canvas.
import { createSigns } from './signs.js';
import { createStars } from './stars.js';
import { look as skyLook, skyClock } from '../../core/sky.js';
import { paletteFor, css } from './palette.js';
import { createFx } from './fx.js';
import { createSun } from './sun.js';
import { settings } from '../../audio/settings.js';
import { reportError } from '../../errlog.js';

const TIERS = [
  { dpr: 1, rain: 0, shimmer: false, ripples: false },
  { dpr: 1.5, rain: 1, shimmer: true, ripples: false },
  { dpr: 2, rain: 2, shimmer: true, ripples: true },
];
const WARM = ['#ffd8a0', '#ffcf8a', '#ffe2b8', '#ffc27a'];
const COOL = ['#9fd8ff', '#b8e4ff', '#8fc2ff', '#c9b8ff'];
const NEON = ['#ff3fb0', '#3fe0ff', '#a65bff', '#ff6a6a'];

const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// far -> near. d = parallax depth, h = building heights (fraction of the horizon height), w = widths (css px)
const LAYERS = [
  { d: 0.12, h: [0.28, 0.66], w: [14, 34], body: '#161b44', top: '#232a5e', win: [1.4, 2.2], gap: [3, 4.5], lit: 0.30, fog: 0.62 },
  { d: 0.26, h: [0.22, 0.56], w: [22, 52], body: '#10143a', top: '#1b2152', win: [1.8, 2.8], gap: [3.6, 5.4], lit: 0.28, fog: 0.42 },
  { d: 0.46, h: [0.16, 0.46], w: [34, 72], body: '#0b0e2c', top: '#151a44', win: [2.2, 3.4], gap: [4.4, 6.6], lit: 0.26, fog: 0.24 },
  { d: 0.78, h: [0.10, 0.34], w: [52, 110], body: '#06081c', top: '#0e1232', win: [2.6, 4.2], gap: [5.4, 8], lit: 0.22, fog: 0.08, edges: true },
];

export function createDistrict(canvas, { seed = 1984, tier: tier0 = 2, games = [], signs: withSigns = true, clock = skyClock() } = {}) {
  const ctx = canvas.getContext('2d', { alpha: false });
  let tier = tier0;
  let W = 0, H = 0, dpr = 1, HZ = 0;
  let sky = null, skyLit = null, street = null, refl = null, reflLit = null, vignette = null;
  let layers = [];
  const signs = createSigns({ games: withSigns ? games : [] });
  const stars = createStars();
  let beacons = [];
  let raf = 0, last = 0, running = false, destroyed = false;
  // the living sky
  const fx = createFx();
  // LIVE WEATHER (weather-fx.js: clouds, lightning, fog; rain.js; live-weather.js) and the city's life (wildlife.js, street.js)
  // load right after the first paint — the title never waits for them; until then these stand-ins draw nothing
  const NOOP = () => {};
  let wfx = { resize: NOOP, sky: NOOP, fogLayer: NOOP, flash: NOOP, flashNow: () => 0, moonVeil: () => 1, debug: () => ({}), destroy: NOOP };
  let rain = { resize: NOOP, veils: NOOP, drops: NOOP, debug: () => ({}), destroy: NOOP };
  let road = { resize: NOOP, train: NOOP, steam: NOOP, traffic: NOOP, debug: () => ({}) };
  let birds = { resize: NOOP, sky: NOOP, low: NOOP, mid: NOOP, hit: () => null, debug: () => ({}) };
  let liveWeather = () => null;
  let frost = { resize: NOOP, pane: NOOP, decorate: NOOP, debug: () => ({}), destroy: NOOP };
  let air = { resize: NOOP, draw: NOOP, debug: () => ({}) };      // planes + satellites (aircraft.js)
  const sun = createSun();           // the real sun (sun.js): loaded with the first paint (a morning title shows it at once)
  let safeTopV = 0, safeBotV = 0;
  setTimeout(() => {
    Promise.all([import('./weather-fx.js'), import('./rain.js'), import('./wildlife.js'), import('./street.js'), import('./live-weather.js'), import('./frost.js'), import('./aircraft.js')]).then(([a, b, c, d, e, f, g]) => {
      if (destroyed) return;
      wfx = a.createWeatherFx({ onFlash: ev => { if (S.onFlash) S.onFlash(ev); } }); rain = b.createRain(); birds = c.createWildlife(); road = d.createStreet(); frost = f.createFrost(); air = g.createAircraft();
      for (const m of [wfx, rain, birds, road, frost, air]) m.resize(W, H, HZ);
      if (LK.freeze > 0.02) for (const L of layers) L.compKey = '';      // re-bake the rows for the icicles (only on a freezing day)
      if (!clock.preview) e.startWeather();
      liveWeather = e.liveWeather;
      lookAt = 0;                       // pick the live weather up at once
    }).catch(e => { console.warn('city extras', e); reportError(e, 'city extras'); });   // shows on /admin: Errors from phones
  }, 1200);
  const wxNow = () => clock.wx || (clock.preview ? null : liveWeather());
  let LK = skyLook(clock.now(), clock.tz, { alwaysNight: !!settings.alwaysNight, wx: wxNow() });
  let P = paletteFor(LK);
  let skyKey = '', lookAt = 0, nearRoofs = [], skyline = null;
  let NX = null, HZ0g = 1;   // the neon canvas of the layer being built
  const nightness = () => P.dark;
  const frames = [];
  let cool = 0;
  const S = {                // driven by the title's timeline
    wave: 0,                 // 0..1 how far the lights have climbed (bottom -> top)
    lit: 0,                  // 0..1 overall "the city is on" (haze colour, trims, reflections, signs)
    bill: 0,                 // 0..1 the signs booting
    logo: 0,                 // 0..1 the neon sign's glow (its light on the haze and the street)
    logoRect: null,          // { x, y, w, h } in css px
    motion: 1,               // 0 = reduced effects (no drift, no rain motion; planes fewer, lights steady)
  };
  let cam = { x: 0, y: 0, tx: 0, ty: 0 };
  const t0 = performance.now();

  // ------------------------------------------------------------------ build
  function build() {
    const r = canvas.getBoundingClientRect();
    W = Math.max(320, r.width); H = Math.max(480, r.height);
    dpr = Math.min(window.devicePixelRatio || 1, TIERS[tier].dpr);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    // the skyline's tops are laid out against HZ0. On a portrait phone (all mobile, Oct 19 2026) the rooftops come down a little
    // (`drop`) and the street comes down to just above the dock (a strip for the road, the cars and their reflection), so the
    // towers grow taller: more skyline, and a band of open sky between the rooftops and the tagline for the sun (sun.js)
    const HZ0 = Math.round(H * (W > H ? 0.74 : 0.665));
    HZ0g = HZ0 * Math.min(1.25, Math.max(0.85, H / 844)) * (W > H ? 0.78 : 1);
    const portrait = W <= H;
    const dockTop = H - Math.max(safeBotV + 6, 20) - 64;          // the dock bar's top (css/title.css: the bar is 64 px)
    HZ = portrait ? Math.round(Math.min(H * 0.84, Math.max(H * 0.735, dockTop - Math.max(56, H * 0.075)))) : HZ0;
    const drop = portrait ? Math.round(H * 0.036) : 0;
    const T0 = HZ0 + drop;                                        // the rooftops' reference line
    const ext = HZ - T0;
    const rand = rng(seed);
    // building scale follows the screen height; on wide screens the skyline sits lower so the sign floats in clear sky
    const k = Math.min(1.25, Math.max(0.85, H / 844)) * (W > H ? 0.78 : 1);
    const margin = 60 + W * 0.08;                      // room for the camera drift
    // sky (painted from the palette; repainted when the look changes)
    paintSky();
    // skyline layers
    layers = []; beacons = [];
    signs.reset();
    LAYERS.forEach((L, li) => {
      const lw = W + margin * 2;
      const top = Math.round(T0 - HZ0 * L.h[1] * k * 1.02);
      const lh = HZ - top + 2;
      const dark = mk(lw * dpr, lh * dpr), lit = mk(lw * dpr, lh * dpr), neon = mk(lw * dpr, lh * dpr);
      const dx = dark.getContext('2d'), lx = lit.getContext('2d');
      NX = neon.getContext('2d'); NX.scale(dpr, dpr);
      dx.scale(dpr, dpr); lx.scale(dpr, dpr);
      const windows = [];
      const rects = [];
      let x = -rand() * 20;
      while (x < lw) {
        const bw = L.w[0] + rand() * (L.w[1] - L.w[0]);
        let hf = L.h[0] + rand() * (L.h[1] - L.h[0]);
        const cx = x + bw / 2 - margin;
        // near layer frames the view: tall at the sides, low in the middle (the logo glows above it)
        if (L.edges) { const c = Math.abs(cx - W / 2) / (W / 2); hf = L.h[0] + (L.h[1] - L.h[0]) * Math.pow(clamp01(c * 1.1), 1.6) * (0.6 + rand() * 0.4); }
        else if (li === 2) hf *= 0.75 + 0.35 * Math.abs(cx - W / 2) / (W / 2);
        // portrait: the far rows dip in the middle too, so the sun's low arc crosses open sky under the tagline (sun.js)
        if (portrait && li <= 1) hf *= 0.6 + 0.52 * Math.pow(clamp01(Math.abs(cx - W / 2) / (W / 2)), 1.3);
        const bh = HZ0 * hf * k + ext;
        const by = lh - bh; // y in layer space
        drawBuilding(dx, lx, x, by, bw, bh, L, li, rand, windows, false, rects);
        // roofline extras: setbacks, spires (with beacons), antennas
        if (rand() < 0.35) {
          const sw = bw * (0.45 + rand() * 0.3), sh = (bh - ext) * (0.06 + rand() * 0.1);
          drawBuilding(dx, lx, x + (bw - sw) / 2, by - sh, sw, sh, L, li, rand, windows, true, rects);
          if (rand() < 0.6) spire(dx, x + bw / 2, by - sh, 10 + rand() * 26 * k, L, li, rand);
        } else if (rand() < 0.25) spire(dx, x + bw * (0.3 + rand() * 0.4), by, 8 + rand() * 18 * k, L, li, rand);
        x += bw + (L.gap[0] * 0.4) + rand() * 6;
      }
      // bloom: the lit layer, blurred (drawn tiny and scaled back up) and added on top of itself
      { const s = 0.14, b = mk(lit.width * s, lit.height * s), bx = b.getContext('2d');
        bx.drawImage(lit, 0, 0, b.width, b.height);
        const b2 = mk(lit.width * 0.05, lit.height * 0.05); b2.getContext('2d').drawImage(b, 0, 0, b2.width, b2.height);
        lx.save(); lx.setTransform(1, 0, 0, 1, 0, 0); lx.globalCompositeOperation = 'lighter';
        lx.globalAlpha = 0.55; lx.drawImage(b, 0, 0, lit.width, lit.height);
        lx.globalAlpha = 0.4; lx.drawImage(b2, 0, 0, lit.width, lit.height);
        lx.restore(); b.width = b.height = b2.width = b2.height = 0; }
      // window delays: bottom first, with scatter
      for (const w of windows) { w.delay = clamp01((1 - (w.y / lh)) * 0.82 + rand() * 0.16); w.order = rand(); }
      layers.push({ ...L, dark, lit, neon, lw, lh, top, windows, margin, rects });
    });
    // street (wet asphalt) + the city's reflection
    const sh = H - HZ + 2;
    street = mk(W * dpr, sh * dpr);
    const sx = street.getContext('2d');
    sx.scale(dpr, dpr);
    const sg = sx.createLinearGradient(0, 0, 0, sh);
    sg.addColorStop(0, '#0c0b22'); sg.addColorStop(0.25, '#08081a'); sg.addColorStop(1, '#030309');
    sx.fillStyle = sg; sx.fillRect(0, 0, W, sh);
    // faint wet sheen + a kerb line
    sx.fillStyle = 'rgba(160,140,255,0.08)'; sx.fillRect(0, 0, W, 1.2);
    const sr2 = rng(seed + 3);
    for (let i = 0; i < 26; i++) { // puddles: slightly lighter, flat ellipses
      const px = sr2() * W, py = sh * (0.08 + sr2() * 0.8), pw = 40 + sr2() * 160;
      const pg = sx.createRadialGradient(px, py, 0, px, py, pw);
      pg.addColorStop(0, 'rgba(70,60,140,0.07)'); pg.addColorStop(1, 'rgba(0,0,0,0)');
      sx.save(); sx.translate(px, py); sx.scale(1, 0.12); sx.translate(-px, -py); sx.fillStyle = pg; sx.fillRect(px - pw, py - pw, pw * 2, pw * 2); sx.restore();
    }
    refl = null; reflLit = reflection(true);
    nearRoofs = layers[layers.length - 1].rects.filter(r => r.h > HZ * 0.08);
    // the skyline's outline on screen (the highest roof over every 4 px): the planes keep their whole path above it
    skyline = new Float32Array(Math.ceil(W / 4) + 1).fill(HZ);
    for (const L of layers) for (const r of L.rects) {
      const y = L.top + r.y, a = Math.max(0, Math.floor((r.x - L.margin) / 4)), b = Math.min(skyline.length - 1, Math.ceil((r.x + r.w - L.margin) / 4));
      for (let i = a; i <= b; i++) if (y < skyline[i]) skyline[i] = y;
    }
    fx.resize(W, H, HZ);
    wfx.resize(W, H, HZ); rain.resize(W, H, HZ); birds.resize(W, H, HZ); road.resize(W, H, HZ); frost.resize(W, H); air.resize(W, H, HZ); sun.resize(W, H, HZ);
    vignette = mk(W * dpr / 2, H * dpr / 2);
    const vx = vignette.getContext('2d');
    const vg = vx.createRadialGradient(vignette.width / 2, vignette.height * 0.42, Math.min(vignette.width, vignette.height) * 0.3, vignette.width / 2, vignette.height * 0.45, Math.max(vignette.width, vignette.height) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(1,1,6,0.62)');
    vx.fillStyle = vg; vx.fillRect(0, 0, vignette.width, vignette.height);
  }

  function paintSky() {
    if (!skyLit || skyLit.width !== Math.round(W * dpr) || skyLit.height !== Math.round(HZ * dpr)) { if (skyLit) skyLit.width = 0; skyLit = mk(W * dpr, HZ * dpr); }
    const x = skyLit.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = x.createLinearGradient(0, 0, 0, HZ);
    g.addColorStop(0, css(P.sky[0])); g.addColorStop(0.45, css(P.sky[1])); g.addColorStop(0.8, css(P.sky[2])); g.addColorStop(1, css(P.sky[3]));
    x.fillStyle = g; x.fillRect(0, 0, W, HZ);
    // the city's glow (night) / the sun's glow on the haze (day): low on the horizon
    const hg = x.createRadialGradient(W * 0.5, HZ * 1.02, 0, W * 0.5, HZ * 1.02, Math.max(W, HZ) * 0.9);
    hg.addColorStop(0, css(P.glow)); hg.addColorStop(0.45, css(P.glow2)); hg.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = hg; x.fillRect(0, 0, W, HZ);
    // stars, high up and few (fewer as the sky brightens)
    const sr = rng(seed + 7);
    for (let i = 0; i < 0; i++) {   // (the stars are the real sky now: stars.js)
      const sx = sr() * W, sy = sr() * HZ * 0.5, big = sr() < 0.12, a = (0.15 + sr() * 0.55) * (1 - sy / (HZ * 0.55)) * Math.min(1.2, P.stars);
      if (a <= 0.01) continue;
      x.fillStyle = `rgba(220,230,255,${Math.min(1, a)})`;
      x.fillRect(sx, sy, big ? 1.6 : 1, big ? 1.6 : 1);
    }
    // cloud banks catching the light
    for (let i = 0; i < 6; i++) {
      const cy = HZ * (0.14 + sr() * 0.5), cw = W * (0.5 + sr() * 0.8), cx = sr() * W;
      const cg = x.createRadialGradient(cx, cy, 0, cx, cy, cw * 0.5);
      cg.addColorStop(0, css(P.cloud)); cg.addColorStop(1, 'rgba(0,0,0,0)');
      x.save(); x.translate(cx, cy); x.scale(1, 0.16 + sr() * 0.06); x.translate(-cx, -cy);
      x.fillStyle = cg; x.fillRect(cx - cw, cy - cw, cw * 2, cw * 2); x.restore();
    }
    sky = skyLit;
  }

  // each layer's look right now: the silhouettes tinted by the hour (atmospheric perspective by day) and frosted roofs in
  // winter, the windows lit right now (one by one as the hour changes), the trims and rooftop signs after dark
  function compose(L, winOn) {
    const k = `${skyKey}|${Math.round(winOn * 60)}`;
    if (L.compKey === k && L.comp) return L.comp;
    if (!L.comp || L.comp.width !== L.dark.width || L.comp.height !== L.dark.height) { if (L.comp) L.comp.width = 0; L.comp = mk(L.dark.width, L.dark.height); }
    const x = L.comp.getContext('2d');
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
    x.clearRect(0, 0, L.comp.width, L.comp.height);
    x.drawImage(L.dark, 0, 0);
    // the hour's tint on the silhouettes (only where buildings are): far layers fade the most into the haze
    const ta = P.tintA * (1.15 - L.d * 0.7);
    if (ta > 0.01) { x.globalCompositeOperation = 'source-atop'; x.fillStyle = css(P.tint, Math.min(0.92, ta)); x.fillRect(0, 0, L.comp.width, L.comp.height); }
    // the light on the sun-facing edges (dawn, day, golden hour)
    const sunLeft = (LK.sun.az < 180) !== !!LK.south;          // facing south, the morning sun is on the left
    if (P.rim[3] > 0.08) { x.fillStyle = css(P.rim, P.rim[3] * 0.6); for (const r of L.rects) x.fillRect((sunLeft ? r.x : r.x + r.w - 1.2) * dpr, r.y * dpr, 1.2 * dpr, r.h * dpr); }
    // winter: a line of frost on the roofs
    // (and real snow settles on them: a thicker, brighter line while it snows)
    const frostK = Math.max(Math.max(0, (LK.season.winter - 0.5) * 2) * 0.55, (LK.snow || 0) * 0.85, (LK.freeze || 0) * 0.8);
    const fh = 1.6 + 2.2 * Math.max(LK.snow || 0, (LK.freeze || 0) * 0.5);
    if (frostK > 0.02) { x.fillStyle = (LK.freeze || 0) > (LK.snow || 0) ? `rgba(222,238,255,${frostK})` : `rgba(235,242,255,${frostK})`; for (const r of L.rects) x.fillRect(r.x * dpr, r.y * dpr, r.w * dpr, fh * dpr); }
    x.globalCompositeOperation = 'source-over';
    // the windows lit right now
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const warm = P.winWarm || 0;
    for (const w of L.windows) {
      if (w.order > winOn) continue;
      x.fillStyle = warm > 0.05 && !w.neon ? mixHex(w.col, '#ffc27a', warm * 0.6, w.a) : rgba(w.col, w.a);
      x.fillRect(w.x, w.y, w.w, w.h);
    }
    // a deep freeze: frosted glass on the lit windows, icicles under the nearer roofs
    const fz = LK.freeze || 0;
    if (fz > 0.02) {
      x.fillStyle = `rgba(226,238,255,${0.2 * fz})`;
      for (const w of L.windows) if (w.order <= winOn) x.fillRect(w.x, w.y, w.w, w.h);
      frost.decorate(x, L.rects, LAYERS.indexOf(LAYERS.find(q => q.d === L.d)), fz, P);
    }
    // a low sun on a clear morning / evening: a few windows on the sun-facing side of the nearer towers flash gold
    const glint = (LK.w.golden + LK.w.dawn) * (LK.sun.el > 0 && LK.sun.el < 14 ? 1 : 0) * (1 - Math.min(1, (LK.cloud || 0) * 1.4)) * (LK.rain ? 0 : 1);
    if (glint > 0.2 && L.d >= 0.4) {
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const r of L.rects) {
        const x0 = sunLeft ? r.x : r.x + r.w * 0.72, x1 = sunLeft ? r.x + r.w * 0.28 : r.x + r.w;
        for (const w of L.windows) {
          if (w.x < x0 || w.x > x1 || w.y < r.y || w.y > r.y + r.h) continue;
          if (((w.x * 7.3 + w.y * 3.1) | 0) % 23 !== 0) continue;                 // a sparse, fixed few
          x.fillStyle = `rgba(255,214,150,${0.75 * glint})`; x.fillRect(w.x, w.y, w.w, w.h);
        }
      }
    }
    // trims, rooftop signs, the bloom: with the evening
    const tr = P.trims * Math.min(1, Math.max(winOn, P.dark) * 1.5);
    if (tr > 0.02) { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = tr; x.drawImage(L.lit, 0, 0); x.globalAlpha = 1; }
    L.compKey = k;
    return L.comp;
  }
  const mixHex = (hex, to, t, a) => { const n = parseInt(hex.slice(1), 16), m = parseInt(to.slice(1), 16); const r = (n >> 16) + (((m >> 16) - (n >> 16)) * t), g = ((n >> 8) & 255) + ((((m >> 8) & 255) - ((n >> 8) & 255)) * t), b = (n & 255) + (((m & 255) - (n & 255)) * t); return `rgba(${r | 0},${g | 0},${b | 0},${a})`; };

  // where a body in the sky (azimuth, elevation) appears: facing south, east on the left, the horizon at the skyline
  function skyPos(az, el) {
    const x = W * (0.5 + ((((az - 180) + 540) % 360) - 180) / 200);
    const y = HZ * 0.92 - (el / 55) * HZ * 0.95;
    return { x: Math.max(-60, Math.min(W + 60, x)), y };
  }

  function refreshLook(now) {
    if (now - lookAt < 2500 && skyKey) return;
    lookAt = now;
    LK = skyLook(clock.now(), clock.tz, { alwaysNight: !!settings.alwaysNight, wx: wxNow() });
    P = paletteFor(LK);
    if (LK.key !== skyKey) { skyKey = LK.key; paintSky(); refl = null; reflLit = reflection(true); }
  }

  function drawBuilding(dx, lx, x, y, w, h, L, li, rand, windows, isSetback = false, rects = null) {
    if (rects) rects.push({ x, y, w, h });
    // body: a touch lighter at the top (sky light), darker at the feet (haze takes over there)
    const g = dx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, L.top); g.addColorStop(0.35, L.body); g.addColorStop(1, L.body);
    dx.fillStyle = g; dx.fillRect(x, y, w, h);
    // a faint rim on the city-facing edge
    dx.fillStyle = 'rgba(150,140,255,0.07)'; dx.fillRect(x + w - 1, y, 1, h);
    dx.fillStyle = 'rgba(0,0,0,0.25)'; dx.fillRect(x, y, 1, h);
    // windows
    const ww = L.win[0] + rand() * (L.win[1] - L.win[0]);
    const wh = ww * (1.2 + rand() * 0.8);
    const gx = L.gap[0] + rand() * (L.gap[1] - L.gap[0]);
    const gy = wh + 1.6 + rand() * 3;
    const style = rand();
    const warm = rand() < 0.62;
    const pad = 3 + rand() * 3;
    const litP = L.lit * (0.55 + rand() * 0.9);
    // some buildings are "dark office" (few lit), some have whole lit floors
    for (let yy = y + pad + (isSetback ? 2 : 4); yy < y + h - 6; yy += gy) {
      const floorLit = rand() < 0.07;
      for (let xx = x + pad; xx < x + w - pad - ww; xx += gx) {
        if (style < 0.12 && rand() < 0.6) continue; // vertical stripe buildings: gaps
        dx.fillStyle = 'rgba(140,160,255,0.045)';
        dx.fillRect(xx, yy, ww, wh);
        if (floorLit || rand() < litP) {
          const pal = warm ? WARM : COOL;
          const col = rand() < 0.06 ? NEON[Math.floor(rand() * NEON.length)] : pal[Math.floor(rand() * pal.length)];
          const a = 0.45 + rand() * 0.55;
          windows.push({ x: xx, y: yy, w: ww, h: wh, col, a, dim: rand() < 0.05, neon: NEON.includes(col) });
          lx.fillStyle = rgba(col, a);
          lx.fillRect(xx, yy, ww, wh);
          if (li >= 2 && rand() < 0.4) { lx.fillStyle = rgba(col, a * 0.12); lx.fillRect(xx - 1.5, yy - 1.5, ww + 3, wh + 3); }
        }
      }
    }
    // neon trims on near buildings (vertical light strips / roof outlines) — lit only
    // neon on the buildings: outlines, roof lines, corner strips — near rows most, the far rows too (thinner, softer)
    const tallBack = li <= 1 && h > (L.h[0] + (L.h[1] - L.h[0]) * 0.55) * HZ0g;
    const neonP = tallBack ? 0.6 : [0.38, 0.4, 0.45, 0.55][li];
    if (!isSetback && rand() < neonP && w > 8) {
      const col = NEON[Math.floor(rand() * NEON.length)];
      const lw = [0.9, 1, 1.2, 1.4][li], blur = [5, 5, 6, 8][li], a = [1, 1, 0.9, 0.85][li];
      const lx = NX;
      lx.save();
      lx.shadowColor = col; lx.shadowBlur = blur;
      lx.strokeStyle = rgba(col, a); lx.lineWidth = lw; lx.lineJoin = 'round';
      lx.beginPath();
      const kind = rand(), i0 = lw + 0.6;
      if (kind < (tallBack ? 0.85 : li <= 1 ? 0.62 : 0.3)) { lx.moveTo(x + i0, y + h); lx.lineTo(x + i0, y + i0); lx.lineTo(x + w - i0, y + i0); lx.lineTo(x + w - i0, y + h); }      // full outline
      else if (kind < 0.55) { lx.moveTo(x + i0, y + h); lx.lineTo(x + i0, y + i0); lx.lineTo(x + w - i0, y + i0); }                            // corner + roof
      else if (kind < 0.75) { lx.moveTo(x + i0, y + i0); lx.lineTo(x + w - i0, y + i0); }                                                       // roof line
      else if (kind < 0.9) { const sx = x + w * (0.2 + rand() * 0.6); lx.moveTo(sx, y + h * 0.12); lx.lineTo(sx, y + h * 0.88); }              // a vertical strip
      else { const yy = y + h * (0.15 + rand() * 0.3); lx.moveTo(x + i0, yy); lx.lineTo(x + w - i0, yy); lx.moveTo(x + i0, yy + 4); lx.lineTo(x + w - i0, yy + 4); }   // two bands
      lx.stroke();
      lx.restore();
    }
    // a rooftop sign (small glowing bar) now and then
    if (li >= 1 && !isSetback && rand() < 0.16 && w > 30) {
      const col = NEON[Math.floor(rand() * NEON.length)];
      const sw = w * (0.35 + rand() * 0.4), sx = x + (w - sw) / 2;
      lx.save(); lx.shadowColor = col; lx.shadowBlur = 10;
      lx.fillStyle = rgba(col, 0.75); lx.fillRect(sx, y - 5, sw, 2.2);
      lx.restore();
      dx.fillStyle = 'rgba(0,0,0,0.6)'; dx.fillRect(sx, y - 6, sw, 4);
    }
  }

  function spire(dx, x, y, len, L, li, rand) {
    dx.strokeStyle = L.top; dx.lineWidth = li >= 2 ? 1.6 : 1; dx.beginPath(); dx.moveTo(x, y); dx.lineTo(x, y - len); dx.stroke();
    beacons.push({ li, x, y: y - len, col: rand() < 0.75 ? '#ff3b4f' : '#e9f2ff', period: 1.6 + rand() * 1.8, phase: rand() * 3, r: li >= 2 ? 2.4 : 1.6 });
  }

  function reflection(on) {
    // the city flipped under the horizon, squashed, streaked down and softly blurred (drawn small, scaled up)
    const s = 0.35;
    const rw = Math.ceil(W * s), rh = Math.ceil((H - HZ) * s);
    const c = mk(rw, rh), x = c.getContext('2d');
    const src = mk(rw, Math.ceil(HZ * s)), sxx = src.getContext('2d');
    sxx.drawImage(skyLit, 0, 0, src.width, src.height);
    void on;
    for (const L of layers) {
      const ox = -L.margin;
      const img = compose(L, P.win);
      sxx.drawImage(img, 0, 0, img.width, img.height, ox * s, L.top * s, L.lw * s, L.lh * s);
    }
    x.save();
    x.translate(0, 0); x.scale(1, -0.62); x.translate(0, -src.height);
    for (let i = 0; i < 7; i++) { x.globalAlpha = 0.34 / (1 + i * 0.7); x.drawImage(src, 0, -i * 3 * s); } // streaked down
    x.restore();
    x.globalAlpha = 1;
    // fade with distance from the horizon
    const fg = x.createLinearGradient(0, 0, 0, rh);
    fg.addColorStop(0, 'rgba(3,3,10,0.15)'); fg.addColorStop(0.55, 'rgba(3,3,10,0.7)'); fg.addColorStop(1, 'rgba(3,3,10,0.96)');
    x.fillStyle = fg; x.fillRect(0, 0, rw, rh);
    return c;
  }

  // ------------------------------------------------------------------ frame
  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(100, now - last || 16.7);
    last = now;
    perf(dt);
    const t = (now - t0) / 1000;
    // camera: a slow drift + the tilt / pointer target
    const mo = S.motion;
    cam.x += ((Math.sin(t * 0.07) * 14 + cam.tx * 26) * mo - cam.x) * 0.04;
    cam.y += ((Math.sin(t * 0.05 + 1) * 4 + cam.ty * 8) * mo - cam.y) * 0.04;
    draw(t, dt);
  }

  // ------------------------------------------------------------------ sprites (every gradient is drawn once, reused)
  const sprites = new Map();
  function sprite(key, w, h, paint) {
    let c = sprites.get(key);
    if (!c) { c = mk(w, h); paint(c.getContext('2d'), w, h); sprites.set(key, c); }
    return c;
  }
  const radial = (col, stops) => sprite(`r|${col}|${stops}`, 64, 64, (x, w) => {
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    for (const [o, a] of stops) g.addColorStop(o, rgba(col, a));
    x.fillStyle = g; x.fillRect(0, 0, w, w);
  });
  const band = col => sprite(`b|${col}`, 64, 4, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, rgba(col, 0)); g.addColorStop(0.5, rgba(col, 1)); g.addColorStop(1, rgba(col, 0));
    x.fillStyle = g; x.fillRect(0, 0, w, h);
  });
  const beam = col => sprite(`s|${col}`, 96, 384, (x, w, h) => {
    const g = x.createLinearGradient(0, h, 0, 0);
    g.addColorStop(0, `rgba(${col},1)`); g.addColorStop(0.6, `rgba(${col},0.32)`); g.addColorStop(1, `rgba(${col},0)`);
    x.fillStyle = g; x.beginPath(); x.moveTo(w / 2, h); x.lineTo(0, 0); x.lineTo(w, 0); x.closePath(); x.fill();
  });
  // on: an 'r,g,b' string (the palette's haze) or false (before the power-on)
  const hazeBand = (L, on) => sprite(`h|${L.d}|${on}`, 1, 64, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, on ? `rgba(${on},${L.fog})` : `rgba(14,14,40,${L.fog * 0.8})`);
    x.fillStyle = g; x.fillRect(0, 0, w, h);
  });
  const hazeH = L => HZ * (0.16 + 0.1 * (1 - L.d));

  const hazeKey = () => P.haze.map(v => Math.round(v / 6) * 6).join(',');

  function draw(t, dt) {
    const c = ctx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    refreshLook(performance.now());
    const lit = S.lit;
    const night = nightness();
    const fs = { skyline, L: LK, P, t, dt, tier, motion: S.motion, force: clock.force, skyPos, cam, signRect: S.logoRect, firstSnow: S.firstSnow || 0, clear: S.clear, safeTop: safeTopV };
    // sky
    c.globalAlpha = 1;
    c.drawImage(skyLit, 0, cam.y * 0.1, W, HZ);
    // the real night sky: stars and the Milky Way, turning over the night (richer late, washed by a bright moon, hidden by rain)
    { const dk = LK.w.night + LK.w.late, moonWash = LK.moon.el > 0 ? 1 - 0.5 * LK.moon.illum : 1;
      const milky = LK.rain ? 0 : clamp01((dk - 0.5) * 2) * (0.6 + 0.4 * clamp01(LK.w.late / Math.max(0.01, dk))) * moonWash;
      // the planets show from dusk (Venus first), unless the cloud hides them
      const twilight = clamp01((-LK.sun.el - 1) / 5) * (1 - smooth(0.55, 0.92, LK.cloud || 0)) * (LK.rain ? 0.1 : 1);
      stars.draw(c, W, HZ, LK, clock.now(), P.stars * (LK.rain ? 0.15 : 1), milky, t, S.motion, cam.y * 0.1, twilight); }
    // the sun, the moon, aurora, shooting stars, fireworks (behind the skyline)
    fs.moonVeil = wfx.moonVeil(LK);       // thick cloud swallows the moon's disc (weather-fx draws its glow through it)
    fx.back(c, fs);
    // the weather behind the skyline: clouds (the moon through them), lightning, distant shafts of rain
    // the sun: its disc and bloom (behind the planes, the clouds and the skyline)
    sun.draw(c, fs);
    // planes and satellites: in the sky, behind the clouds and the skyline, never across the sign or the buttons
    if (!clock.force.has('no-planes')) air.draw(c, fs);
    const off = clock.force;           // test only: &force=no-clouds,no-road,no-birds,no-rain (performance checks)
    if (!off.has('no-clouds')) wfx.sky(c, fs);
    sun.through(c, fs, (x, y) => wfx.coverAt ? wfx.coverAt(x, y) : 0);   // glowing through thin cloud
    if (!off.has('no-rain')) rain.veils(c, fs);
    if (!off.has('no-birds')) birds.sky(c, fs);              // geese in the migrations, the heron across the moon
    // the neon sign lights the haze around it (after dark)
    const signLight = S.logo * Math.max(P.sign, 0.15 * night);
    if (signLight > 0 && S.logoRect) {
      const r = S.logoRect;
      const cx = r.x + r.w / 2, cy = r.y + r.h / 2, rad = r.w * (0.9 + 0.7 * LK.fog);   // fog and rain spread the neon's halo
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = Math.min(1, signLight * (1 + 0.8 * LK.fog + (LK.rain ? 0.25 : 0)));
      c.drawImage(radial(S.signCol || '#ff3caa', [[0, 0.16], [0.5, 0.06], [1, 0]]), cx - rad, cy - rad, rad * 2, rad * 2);
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';
    }
    // two searchlights sweep slowly behind the skyline (after dark)
    if (lit > 0.2 && night > 0.1) { const sl = searchOn(); if (sl > 0.01) searchlights(c, t, lit * night * sl); }
    // the signs: placement (around the title's clear zones), power, rotation, the ticker
    signs.tick(t, dt, { W, H, HZ, layers, clear: S.clear, L: LK, P, bill: S.bill, motion: S.motion, tier });
    // skyline layers + haze
    const hz = hazeKey();
    const winNow = P.win;
    layers.forEach((L, li) => {
      const ox = -L.margin + cam.x * L.d;
      L.ox = ox; L.oy = L.top + cam.y * L.d;
      const oy = L.top + cam.y * L.d;
      if (S.wave >= 1) c.drawImage(compose(L, winNow), ox, oy, L.lw, L.lh);
      else {
        // the power-on: windows light up one by one, bottom first, with a flicker as each catches
        c.drawImage(compose(L, 0), ox, oy, L.lw, L.lh);
        const wv = S.wave;
        for (const w of L.windows) {
          if (w.order > winNow) continue;
          const k2 = (wv - w.delay) / 0.07;
          let a;
          if (k2 <= 0) { if (!w.dim) continue; a = 0.35; } else a = k2 >= 1 ? 1 : (Math.sin(k2 * 31 + w.x) > -0.2 ? k2 : 0.15);
          c.fillStyle = rgba(w.col, w.a * a);
          c.fillRect(ox + w.x, oy + w.y, w.w, w.h);
        }
        const tl = smooth(0.82, 1, wv) * P.trims;
        if (tl > 0) { c.globalAlpha = tl; c.drawImage(L.lit, ox, oy, L.lw, L.lh); c.globalAlpha = 1; }
      }
      // haze at the feet of the layer, in the hour's colour
      const hh = hazeH(L);
      c.globalAlpha = Math.min(1, P.hazeA);
      c.drawImage(hazeBand(L, false), 0, HZ - hh, W, hh + 1);
      if (lit > 0) { c.globalAlpha = lit * Math.min(1, P.hazeA); c.drawImage(hazeBand(L, hz), 0, HZ - hh, W, hh + 1); }
      // the buildings' neon outlines, over the fog (a little softer further back), at full strength all night
      const na = (S.wave >= 1 ? 1 : smooth(0.82, 1, S.wave)) * P.trims * [0.42, 0.56, 0.85, 1][li];
      if (na > 0.02) { c.globalAlpha = na; c.drawImage(L.neon, ox, oy, L.lw, L.lh); }
      c.globalAlpha = 1;
      // beacons on this layer
      for (const b of beacons) if (b.li === li) {
        const on = ((t + b.phase) % b.period) < 0.18;
        c.globalAlpha = (on ? 1 : 0.18) * (0.35 + 0.65 * lit) * (0.25 + 0.75 * night);
        const r5 = b.r * 5;
        c.drawImage(radial(b.col, [[0, 0.9], [0.25, 0.35], [1, 0]]), ox + b.x - r5, oy + b.y - r5, r5 * 2, r5 * 2);
      }
      c.globalAlpha = 1;
      // this layer's signs (the haze at its feet is drawn after, so far signs sit back in it)
      signs.drawLayer(c, li, ox, oy, night);
      if (li === 1) { sun.halo(c, fs); sun.rays(c, fs); birds.low(c, fs); }   // low sun over the far rooftops; swifts   // swifts over the far rows on summer evenings   // swifts over the far rows on summer evenings
      // live fog: a veil after each far row (the distance dissolves), banks drifting through the near towers
      wfx.fogLayer(c, fs, li, t);
      // the near layer: string lights, window glyphs, holiday neon signs
      if (li === layers.length - 2) {
        fs.mid = { rects: L.rects, ox, oy, top: L.top, margin: L.margin };
        const mg = { roofs: L.rects.filter(r => r.h > HZ * 0.06), windows: L.windows.filter(w => w.order <= Math.max(0.35, winNow) && w.h >= 2.6), ox, oy, top: L.top, margin: L.margin };
        fx.mid(c, fs, mg);
        if (!off.has('no-birds')) birds.mid(c, fs, mg);        // pigeons on a roof by day
        // the elevated line: just above the low roofs in the middle of the near row (seen across the centre, behind the tall
        // corner towers and the blade signs)
        const near = layers[li + 1];
        const mids = near.rects.filter(r => { const cx = r.x - near.margin + r.w / 2; return cx > W * 0.32 && cx < W * 0.68; });
        if (mids.length && !off.has('no-road')) road.train(c, fs, near.top + Math.min(...mids.map(r => r.y)) - 2 + cam.y * near.d);
      }
      if (li === layers.length - 1 && !off.has('no-road')) road.steam(c, fs, { rects: L.rects, ox, oy, top: L.top, margin: L.margin });
    });
    // a soft dimming behind the sign + tagline so they always read cleanly over the windows (and the bright day sky)
    if (S.logoRect) {
      const r = S.logoRect, cx = r.x + r.w / 2, cy = r.y + r.h * 1.05, rx = r.w * 0.78, ry = r.h * 1.5;
      c.globalAlpha = 0.6 + 0.4 * night;
      c.drawImage(radial('#03030c', [[0, 0.5], [0.6, 0.28], [1, 0]]), cx - rx, cy - ry, rx * 2, ry * 2);
      c.globalAlpha = 1;
    }
    // before the power-on the district sits in near-darkness (only at night)
    if (lit < 1) { c.fillStyle = `rgba(2,2,9,${0.58 * (1 - lit) * night})`; c.fillRect(0, 0, W, HZ); }
    // the street + the city in it
    const shimmer = TIERS[tier].shimmer && S.motion;
    c.drawImage(street, 0, HZ, W, H - HZ);
    if (P.street[3] > 0.01) { c.fillStyle = css(P.street, P.street[3]); c.fillRect(0, HZ, W, H - HZ); }
    drawRefl(c, reflLit, clamp01(lit * 1.1) * (0.35 + 0.65 * P.refl), shimmer, t);
    // light spilling onto the wet street: the signs + the main sign (after dark)
    c.globalCompositeOperation = 'lighter';
    signs.reflect((x, w, len, col, al, tt, ph) => streak(c, x, w, len, col, al, tt, ph), H, HZ, t);
    if (signLight > 0 && S.logoRect) {
      const r = S.logoRect;
      streak(c, r.x + r.w / 2, r.w * 0.85, (H - HZ) * 0.95, S.signCol || '#ff3fae', 0.22 * signLight, t, 0.5);
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    // the street's traffic: headlights and tail lights at the towers' feet, their light in the wet street
    if (!off.has('no-road')) road.traffic(c, fs, (x, w, len, col, al, tt, ph) => streak(c, x, w, len, col, al, tt, ph));
    // the rain: drops in depth, slanted by the wind, splashes and rings on the street (only when it really rains)
    if (!off.has('no-rain')) rain.drops(c, fs, wfx.flashNow());
    if (LK.rain && S.motion) signs.rain(c, dt);
    // snow, petals, leaves, fireflies, bats
    fx.front(c, fs);
    // a lightning strike lights the whole street for an instant
    wfx.flash(c);
    // a deep freeze: frost creeping in from the edges of the screen
    frost.pane(c, fs);
    sun.dim(c, fs);                    // the light of a total eclipse
    c.globalAlpha = 0.55 + 0.45 * night;
    c.drawImage(vignette, 0, 0, W, H);
    c.globalAlpha = 1;
  }

  // searchlights are an occasion: Friday and Saturday nights (fading out toward midnight) and holiday nights; never while
  // the Milky Way is strong. 0..1
  function searchOn() {
    const p = LK.local || {}, hol = LK.holiday;
    const hr = (p.h || 0) + (p.mi || 0) / 60;
    const weekend = (p.dow === 5 || p.dow === 6) && hr >= 15 ? 1 - smooth(23, 24, hr) : 0;
    const holiday = hol && hol.full && hr >= 15 ? 1 - smooth(23.5, 24, hr) : 0;
    const on = clock.force.has('searchlights') ? 1 : Math.max(weekend, holiday);
    const dk = LK.w.night + LK.w.late, milky = LK.rain ? 0 : clamp01((dk - 0.5) * 2) * clamp01(LK.w.late / Math.max(0.01, dk));
    return on * (1 - 0.85 * milky);
  }
  const SL_COLS = { christmas: ['255,90,100', '110,255,160'], halloween: ['255,150,60', '190,110,255'], july4: ['255,90,100', '120,160,255'], valentine: ['255,120,170', '255,170,200'], stpatrick: ['110,255,160', '170,255,200'], nye: ['255,220,140', '200,220,255'] };
  function searchlights(c, t, lit) {
    c.globalCompositeOperation = 'lighter';
    const hol = LK.holiday && LK.holiday.full ? SL_COLS[LK.holiday.id] : null;
    const cols = hol || ['185,170,255', '150,210,255'];
    // rooted behind the skyline near the sides, nearly upright, swaying slowly — framing the city, never across the sign
    [[0.07, 0.1, 0, -1], [0.93, 0.08, 2.1, 1]].forEach(([x0, sp, ph, side], i) => {
      const ang = side * (-0.03 + Math.sin(t * sp + ph) * 0.13 * (S.motion ? 1 : 0));   // nearly upright, swaying
      const bx = W * x0 + cam.x * 0.15, by = HZ * 0.92;
      const len = HZ * (W < 700 ? 0.82 : 1.2), wid = len * 0.1;
      c.save();
      c.translate(bx, by); c.rotate(ang);
      c.globalAlpha = 0.13 * lit;
      c.drawImage(beam(cols[i]), -wid / 2, -len, wid, len);
      c.restore();
    });
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
  }

  function drawRefl(c, img, alpha, shimmer, t) {
    c.globalAlpha = alpha;
    const rh = H - HZ;
    if (!shimmer) { c.drawImage(img, 0, HZ, W, rh); c.globalAlpha = 1; return; }
    const strips = 14;
    const sh = img.height / strips;
    for (let i = 0; i < strips; i++) {
      const y = HZ + (i / strips) * rh;
      const amp = 0.6 + i * 0.25;
      const off = Math.sin(t * 1.3 + i * 0.9) * amp + cam.x * 0.3;
      c.drawImage(img, 0, i * sh, img.width, sh + 0.5, off - 4, y, W + 8, rh / strips + 0.6);
    }
    c.globalAlpha = 1;
  }

  // a vertical, rippled streak of light on the wet street under a light source
  function streak(c, x, w, len, col, a, t, ph) {
    const bands = 9;
    const img = band(col);
    for (let i = 0; i < bands; i++) {
      const y = HZ + 2 + (i / bands) * len;
      const bw = w * (1 - i / bands * 0.55) * (0.85 + 0.15 * Math.sin(t * 1.7 + i * 1.3 + ph));
      c.globalAlpha = Math.max(0, a * (1 - i / bands) * (0.7 + 0.3 * Math.sin(t * 2.3 + i * 2.1 + ph)));
      c.drawImage(img, x - bw / 2, y, bw, len / bands * 0.62);
    }
  }

  function perf(dt) {
    frames.push(dt);
    if (frames.length > 90) frames.shift();
    if (cool > 0) { cool--; return; }
    if (frames.length < 90 || document.visibilityState !== 'visible') return;
    const s = [...frames].sort((a, b) => a - b);
    if (s[67] > 19.5 && tier > 0) { setTier(tier - 1); cool = 150; frames.length = 0; }
  }

  function setTier(t) {
    tier = Math.max(0, Math.min(2, t));
    build();
  }

  // ------------------------------------------------------------------ input: tilt / pointer parallax
  const onOrient = e => {
    if (e.gamma == null) return;
    cam.tx = Math.max(-1, Math.min(1, e.gamma / 25));
    cam.ty = Math.max(-1, Math.min(1, ((e.beta || 45) - 45) / 30));
  };
  const onPointer = e => {
    if (e.pointerType !== 'mouse') return;
    cam.tx = (e.clientX / W - 0.5) * 1.4;
    cam.ty = (e.clientY / H - 0.5) * 0.8;
  };
  const onVis = () => { if (document.visibilityState === 'visible') start(); else stop(); };
  let resizeT = 0;
  const onResize = () => { clearTimeout(resizeT); resizeT = setTimeout(() => { if (!destroyed) build(); }, 180); };
  window.addEventListener('deviceorientation', onOrient); // no permission prompt: iOS just never fires it
  window.addEventListener('pointermove', onPointer, { passive: true });
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('resize', onResize);

  function start() { if (running || destroyed) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  build();
  start();

  return {
    set(v) { Object.assign(S, v); },
    /** the sky right now (core/sky.js#look) and whether the sign should be lit at this hour */
    look: () => LK,
    /** a tap on the city: the UFO / cat / moon (fx), or a sign (→ { kind: 'sign', id }). Returns { kind, id? } or null. */
    hit(x, y) {
      const f = fx.hit(x, y) || birds.hit(x, y);
      if (f) return { kind: f };
      const sg = signs.hit(x, y);
      if (sg) return { kind: 'sign', id: sg.id, sign: sg.sign };
      return null;
    },
    signOn: () => P.sign > 0.5,
    /** the hour's colours (palette.js) and the sign's light: the title's glass takes its tint from them */
    palette: () => P,
    signCol: () => S.signCol || null,
    refresh: () => { lookAt = 0; skyKey = ''; },
    safeTop: v => { safeTopV = v || 0; fx.safeTop(v); },
    safeBottom: v => { const n = v || 0; if (n !== safeBotV) { safeBotV = n; if (W <= H) build(); } },
    get state() { return S; },
    get tier() { return tier; },
    setTier,
    tier: () => tier,
    sun: () => sun.debug(),
    skyline: () => (skyline ? Array.from(skyline) : null),
    frames: () => frames.slice(),
    debug: () => ({ ...signs.debug(), tier, dpr, W, H, running, layers: layers.length, windows: layers.reduce((n, L) => n + L.windows.length, 0), ...S, logoRect: undefined, w: LK.w, holiday: LK.holiday, rain: LK.rain, snow: LK.snow, storm: LK.storm, fog: LK.fog, cloud: LK.cloud, wind: LK.wind, live: LK.live, wxKind: LK.wxKind, moon: LK.moon, fx: fx.debug(), wfx: wfx.debug(), rainFx: rain.debug(), birds: birds.debug(), road: road.debug(), air: air.debug(), sun: sun.debug() }),
    destroy() {
      destroyed = true;
      stop();
      window.removeEventListener('deviceorientation', onOrient);
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', onResize);
      // release the pixel memory right away (mobile browsers keep canvases until GC otherwise)
      for (const L of layers) for (const c of [L.dark, L.lit, L.comp, L.neon]) if (c) { c.width = 0; c.height = 0; }
      fx.destroy(); wfx.destroy(); rain.destroy(); frost.destroy(); sun.destroy();
      for (const c of [sky, skyLit, street, refl, reflLit, vignette, canvas, ...sprites.values()]) if (c) { c.width = 0; c.height = 0; }
      sprites.clear();
      signs.destroy();
      layers = []; beacons = [];
    },
  };
}
