// NEON SPEAKEASY — the title screen's city (the neon district outside the bar) (Canvas 2D, PULSE-style: everything expensive is pre-rendered).
//
//   sky (+ stars, horizon glow) -> 4 skyline layers far→near, each with haze at its feet -> beacons, billboards,
//   flying-vehicle light trails -> the wet street: the whole city reflected (flipped, squashed, streaked,
//   rippling), billboard + logo light spilling onto it, puddle ripples -> rain over everything.
//
// Every skyline layer is drawn once into two offscreen canvases: DARK (silhouettes, unlit window glass) and LIT
// (lit windows, neon trims, rooftop signs). The power-on ("the city wakes up") draws the lit windows one by one
// from the bottom up for ~1.5 s, then hands over to the LIT canvases. Steady state is ~80 drawImage calls.
// Holographic billboards on some buildings cycle through the games' own art (ui/game-art.js).
// LIVING CITY: the sky follows the player's real local time (core/sky.js → palette.js): dawn, a hazy matinee day, golden
// hour, night, the small hours; the real sun and moon; the season, holidays and sky events (fx.js). The look is
// recomputed every few seconds; the sky, each layer's composite (tinted silhouettes + the windows lit right now) and the
// reflection are re-baked only when it visibly changes (look.key / the window count), so a steady frame stays cheap.
// Quality tiers (DPR 2 / 1.5 / 1, rain, shimmer, vehicles, ripples) step down when frames run slow; rendering
// pauses while the tab is hidden; destroy() releases every canvas.
import { gameArtSvg } from '../../ui/game-art.js';
import { look as skyLook, skyClock } from '../../core/sky.js';
import { paletteFor, css } from './palette.js';
import { createFx } from './fx.js';
import { settings } from '../../audio/settings.js';

const TIERS = [
  { dpr: 1, rain: 0, shimmer: false, vehicles: false, ripples: false },
  { dpr: 1.5, rain: 1, shimmer: true, vehicles: true, ripples: false },
  { dpr: 2, rain: 2, shimmer: true, vehicles: true, ripples: true },
];
const ACCENT = { overclock: '#ffb627', gridlock: '#7fb2ff', slip: '#ffc46b', prism: '#c9ecff', golf: '#2ff5d2', agent: '#e6e9ef', pulse: '#a374ff', cipher: '#3dff8b', signal: '#ff4466', bluff: '#efe6d2' };
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
  { d: 0.46, h: [0.16, 0.46], w: [34, 72], body: '#0b0e2c', top: '#151a44', win: [2.2, 3.4], gap: [4.4, 6.6], lit: 0.26, fog: 0.24, billboards: 2 },
  { d: 0.78, h: [0.10, 0.34], w: [52, 110], body: '#06081c', top: '#0e1232', win: [2.6, 4.2], gap: [5.4, 8], lit: 0.22, fog: 0.08, edges: true, billboards: 2 },
];

export function createDistrict(canvas, { seed = 1984, tier: tier0 = 2, games = [], billboards: withBillboards = true, clock = skyClock() } = {}) {
  const ctx = canvas.getContext('2d', { alpha: false });
  let tier = tier0;
  let W = 0, H = 0, dpr = 1, HZ = 0;
  let sky = null, skyLit = null, street = null, refl = null, reflLit = null, rainTile = null, vignette = null;
  let layers = [];
  let billboards = [];
  let beacons = [];
  let vehicles = [];
  let ripples = [];
  let textures = [];         // billboard textures, one per game (when its art has loaded)
  let raf = 0, last = 0, running = false, destroyed = false;
  // the living sky
  const fx = createFx();
  let LK = skyLook(clock.now(), clock.tz, { alwaysNight: !!settings.alwaysNight });
  let P = paletteFor(LK);
  let skyKey = '', lookAt = 0, nearRoofs = [], pokes = 0;
  const nightness = () => P.dark;
  const frames = [];
  let cool = 0;
  const S = {                // driven by the title's timeline
    wave: 0,                 // 0..1 how far the lights have climbed (bottom -> top)
    lit: 0,                  // 0..1 overall "the city is on" (haze colour, trims, reflections, signs)
    bill: 0,                 // 0..1 billboards booting
    logo: 0,                 // 0..1 the neon sign's glow (its light on the haze and the street)
    logoRect: null,          // { x, y, w, h } in css px
    motion: 1,               // 0 = reduced effects (no drift, no rain motion, no vehicles)
  };
  let cam = { x: 0, y: 0, tx: 0, ty: 0 };
  const t0 = performance.now();

  // ------------------------------------------------------------------ build
  function build() {
    const r = canvas.getBoundingClientRect();
    W = Math.max(320, r.width); H = Math.max(480, r.height);
    dpr = Math.min(window.devicePixelRatio || 1, TIERS[tier].dpr);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    HZ = Math.round(H * (W > H ? 0.74 : 0.665));
    const rand = rng(seed);
    // building scale follows the screen height; on wide screens the skyline sits lower so the sign floats in clear sky
    const k = Math.min(1.25, Math.max(0.85, H / 844)) * (W > H ? 0.78 : 1);
    const margin = 60 + W * 0.08;                      // room for the camera drift
    // sky (painted from the palette; repainted when the look changes)
    paintSky();
    // skyline layers
    layers = []; billboards = []; beacons = [];
    LAYERS.forEach((L, li) => {
      const lw = W + margin * 2;
      const top = Math.round(HZ - HZ * L.h[1] * k * 1.02);
      const lh = HZ - top + 2;
      const dark = mk(lw * dpr, lh * dpr), lit = mk(lw * dpr, lh * dpr);
      const dx = dark.getContext('2d'), lx = lit.getContext('2d');
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
        const bh = HZ * hf * k;
        const by = lh - bh; // y in layer space
        drawBuilding(dx, lx, x, by, bw, bh, L, li, rand, windows, false, rects);
        // roofline extras: setbacks, spires (with beacons), antennas
        if (rand() < 0.35) {
          const sw = bw * (0.45 + rand() * 0.3), sh = bh * (0.06 + rand() * 0.1);
          drawBuilding(dx, lx, x + (bw - sw) / 2, by - sh, sw, sh, L, li, rand, windows, true, rects);
          if (rand() < 0.6) spire(dx, x + bw / 2, by - sh, 10 + rand() * 26 * k, L, li, rand);
        } else if (rand() < 0.25) spire(dx, x + bw * (0.3 + rand() * 0.4), by, 8 + rand() * 18 * k, L, li, rand);
        // billboards: on mid / near buildings big enough, away from the centre column
        const side = cx < W / 2 ? 'l' : 'r';
        if (withBillboards && L.billboards && billboards.filter(b => b.li === li).length < L.billboards && !billboards.some(b => b.li === li && b.side === side) && bw > 46 && bh > HZ * 0.14 && Math.abs(cx - W / 2) > W * 0.16 && cx > 30 && cx < W - 30 && rand() < 0.85) {
          const bbw = Math.min(bw * 0.9, 76 * k + li * 22), bbh = bbw * 0.62;
          billboards.push({ li, side, x: x + (bw - bbw) / 2, y: by + Math.min(bh * (0.1 + rand() * 0.14), bh - bbh - 8), w: bbw, h: bbh, idx: billboards.length * 3, phase: rand() * 6, on: rand() * 0.35 });
        }
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
      layers.push({ ...L, dark, lit, lw, lh, top, windows, margin, rects });
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
    fx.resize(W, H, HZ);
    // rain tile
    rainTile = mk(220 * dpr, 220 * dpr);
    const rx = rainTile.getContext('2d');
    rx.scale(dpr, dpr);
    const rr = rng(seed + 11);
    rx.lineCap = 'round';
    for (let i = 0; i < 46; i++) {
      const x0 = rr() * 220, y0 = rr() * 220, len = 10 + rr() * 22, a = 0.18 + rr() * 0.4;
      const g = rx.createLinearGradient(x0, y0, x0 - len * 0.12, y0 + len);
      g.addColorStop(0, 'rgba(190,210,255,0)'); g.addColorStop(1, `rgba(190,210,255,${a})`);
      rx.strokeStyle = g; rx.lineWidth = 0.8;
      for (const ox of [0, -220, 220]) for (const oy of [0, -220]) { rx.beginPath(); rx.moveTo(x0 + ox, y0 + oy); rx.lineTo(x0 + ox - len * 0.12, y0 + oy + len); rx.stroke(); }
    }
    vignette = mk(W * dpr / 2, H * dpr / 2);
    const vx = vignette.getContext('2d');
    const vg = vx.createRadialGradient(vignette.width / 2, vignette.height * 0.42, Math.min(vignette.width, vignette.height) * 0.3, vignette.width / 2, vignette.height * 0.45, Math.max(vignette.width, vignette.height) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(1,1,6,0.62)');
    vx.fillStyle = vg; vx.fillRect(0, 0, vignette.width, vignette.height);
    vehicles = []; ripples = [];
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
    for (let i = 0; i < 90; i++) {
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
    const k = `${skyKey}|${Math.round(winOn * 60)}|${pokes}`;
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
    if (P.rim[3] > 0.08) { x.fillStyle = css(P.rim, P.rim[3] * 0.6); for (const r of L.rects) x.fillRect((r.x + r.w - 1.2) * dpr, r.y * dpr, 1.2 * dpr, r.h * dpr); }
    // winter: a line of frost on the roofs
    const frost = Math.max(0, (LK.season.winter - 0.5) * 2) * 0.55;
    if (frost > 0.02) { x.fillStyle = `rgba(235,242,255,${frost})`; for (const r of L.rects) x.fillRect(r.x * dpr, r.y * dpr, r.w * dpr, 1.6 * dpr); }
    x.globalCompositeOperation = 'source-over';
    // the windows lit right now
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const warm = P.winWarm || 0;
    for (const w of L.windows) {
      if ((w.order > winOn) !== !!w.flip) continue;
      x.fillStyle = warm > 0.05 && !w.neon ? mixHex(w.col, '#ffc27a', warm * 0.6, w.a) : rgba(w.col, w.a);
      x.fillRect(w.x, w.y, w.w, w.h);
    }
    // trims, rooftop signs, the bloom: with the evening
    const tr = P.trims * Math.min(1, winOn * 1.5);
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
    LK = skyLook(clock.now(), clock.tz, { alwaysNight: !!settings.alwaysNight });
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
    if (li >= 2 && !isSetback && rand() < (L.edges ? 0.5 : 0.3)) {
      const col = NEON[Math.floor(rand() * NEON.length)];
      lx.save();
      lx.shadowColor = col; lx.shadowBlur = 8;
      lx.strokeStyle = rgba(col, 0.85); lx.lineWidth = 1.4;
      lx.beginPath();
      if (rand() < 0.5) { lx.moveTo(x + 2, y + h); lx.lineTo(x + 2, y + 2); lx.lineTo(x + w - 2, y + 2); }
      else { const sx = x + w * (0.2 + rand() * 0.6); lx.moveTo(sx, y + h * 0.15); lx.lineTo(sx, y + h * 0.85); }
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

  // billboard textures from the games' art (SVG -> image -> holo panel)
  function loadTextures() {
    // the billboards' names use the display face: wait for it (briefly) so they never render in a fallback font
    const fontReady = (document.fonts && document.fonts.load ? document.fonts.load('700 16px Orbitron') : Promise.resolve()).catch(() => {});
    Promise.race([fontReady, new Promise(r => setTimeout(r, 1500))]).then(() => { if (!destroyed) games.forEach(makeTexture); });
  }
  function makeTexture(g, i) {
    {
      const svg = gameArtSvg(g.id);
      if (!svg) return;
      const xml = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      img.onload = () => {
        if (destroyed) return;
        const tw = 192, th = 120;
        const c = mk(tw, th), x = c.getContext('2d');
        const acc = ACCENT[g.id] || '#9fd8ff';
        x.fillStyle = '#05060f'; x.fillRect(0, 0, tw, th);
        x.drawImage(img, 6, 6, th - 12, th - 12);
        x.fillStyle = rgba(acc, 0.9);
        x.textBaseline = 'middle';
        const words = g.name.split(' ');
        const room = tw - th - 8;
        let fs = 16;
        x.font = `700 ${fs}px Orbitron, sans-serif`;
        while (fs > 8 && Math.max(...words.map(wd => x.measureText(wd).width)) > room) { fs -= 1; x.font = `700 ${fs}px Orbitron, sans-serif`; }
        words.forEach((wd, k) => x.fillText(wd, th + 2, th / 2 + (k - (words.length - 1) / 2) * (fs + 3)));
        // holo scanlines + an edge glow
        x.fillStyle = 'rgba(0,0,0,0.28)';
        for (let yy = 0; yy < th; yy += 3) x.fillRect(0, yy, tw, 1);
        x.strokeStyle = rgba(acc, 0.8); x.lineWidth = 2; x.strokeRect(1, 1, tw - 2, th - 2);
        textures[i] = { c, acc, id: g.id };
      };
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
    }
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
    const fs = { L: LK, P, t, dt, tier, motion: S.motion, force: clock.force, skyPos, cam, signRect: S.logoRect };
    // sky
    c.globalAlpha = 1;
    c.drawImage(skyLit, 0, cam.y * 0.1, W, HZ);
    // the sun, the moon, aurora, shooting stars, fireworks (behind the skyline)
    fx.back(c, fs);
    // the neon sign lights the haze around it (after dark)
    const signLight = S.logo * Math.max(P.sign, 0.15 * night);
    if (signLight > 0 && S.logoRect) {
      const r = S.logoRect;
      const cx = r.x + r.w / 2, cy = r.y + r.h / 2, rad = r.w * 0.9;
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = signLight;
      c.drawImage(radial(S.signCol || '#ff3caa', [[0, 0.16], [0.5, 0.06], [1, 0]]), cx - rad, cy - rad, rad * 2, rad * 2);
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';
    }
    // two searchlights sweep slowly behind the skyline; vehicles fly between the far layers (after dark)
    if (lit > 0.2 && night > 0.1) searchlights(c, t, lit * night);
    if (TIERS[tier].vehicles && S.motion && lit > 0.5 && night > 0.3) vehiclesStep(t, dt, night);
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
      c.globalAlpha = 1;
      // beacons on this layer
      for (const b of beacons) if (b.li === li) {
        const on = ((t + b.phase) % b.period) < 0.18;
        c.globalAlpha = (on ? 1 : 0.18) * (0.35 + 0.65 * lit) * (0.25 + 0.75 * night);
        const r5 = b.r * 5;
        c.drawImage(radial(b.col, [[0, 0.9], [0.25, 0.35], [1, 0]]), ox + b.x - r5, oy + b.y - r5, r5 * 2, r5 * 2);
      }
      c.globalAlpha = 1;
      // billboards on this layer (dimmer in daylight)
      for (const b of billboards) if (b.li === li) drawBillboard(c, b, ox, oy, t, 0.55 + 0.45 * night);
      // the near layer: string lights, window glyphs, holiday neon signs
      if (li === layers.length - 2) {
        fs.mid = { rects: L.rects, ox, oy, top: L.top, margin: L.margin };
        fx.mid(c, fs, { roofs: L.rects.filter(r => r.h > HZ * 0.06), windows: L.windows.filter(w => w.order <= Math.max(0.35, winNow) && w.h >= 2.6), ox, oy, top: L.top, margin: L.margin });
      }
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
    // light spilling onto the wet street: billboards + the sign (after dark)
    c.globalCompositeOperation = 'lighter';
    for (const b of billboards) {
      const L = layers[b.li];
      const a = S.bill * (0.9 + 0.1 * Math.sin(t * 3 + b.phase)) * (0.3 + 0.7 * night);
      if (a <= 0.02) continue;
      const tx = textures[(b.idx + Math.floor((t + b.phase) / 7)) % Math.max(1, games.length)];
      const bx = -L.margin + cam.x * L.d + b.x + b.w / 2;
      streak(c, bx, b.w * 0.9, (H - HZ) * 0.5, tx ? tx.acc : '#9fd8ff', 0.1 * a, t, b.phase);
    }
    if (signLight > 0 && S.logoRect) {
      const r = S.logoRect;
      streak(c, r.x + r.w / 2, r.w * 0.85, (H - HZ) * 0.95, S.signCol || '#ff3fae', 0.22 * signLight, t, 0.5);
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    // puddle ripples + rain (on rainy hours)
    if (TIERS[tier].ripples && S.motion && lit > 0.3 && LK.rain) ripplesStep(c, dt);
    const nr = LK.rain ? TIERS[tier].rain : 0;
    if (nr && S.motion) {
      for (let i = 0; i < nr; i++) {
        const sp = i === 0 ? 1 : 0.62, sc = i === 0 ? 2 : 1.4;
        const tw = 220 * sc;
        const ox = ((t * 26 * sp) % tw) - tw, oy = ((t * 560 * sp) % tw) - tw;
        c.globalAlpha = (i === 0 ? 0.32 : 0.22) * (0.6 + 0.4 * lit) * (0.6 + 0.4 * night);
        for (let x = ox; x < W; x += tw) for (let y = oy; y < H; y += tw) c.drawImage(rainTile, x, y, tw, tw);
      }
      c.globalAlpha = 1;
    }
    // snow, petals, leaves, fireflies, bats
    fx.front(c, fs);
    c.globalAlpha = 0.55 + 0.45 * night;
    c.drawImage(vignette, 0, 0, W, H);
    c.globalAlpha = 1;
  }

  function searchlights(c, t, lit) {
    c.globalCompositeOperation = 'lighter';
    for (const [x0, sp, ph, col] of [[0.28, 0.11, 0, '170,150,255'], [0.74, 0.08, 2.1, '120,200,255']]) {
      const ang = Math.sin(t * sp + ph) * 0.42 * (S.motion ? 1 : 0);
      const bx = W * x0 + cam.x * 0.15, by = HZ * 0.9;
      const len = HZ * 1.2, wid = len * 0.14;
      c.save();
      c.translate(bx, by); c.rotate(ang);
      c.globalAlpha = 0.11 * lit;
      c.drawImage(beam(col), -wid / 2, -len, wid, len);
      c.restore();
    }
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

  function drawBillboard(c, b, ox, oy, t, day = 1) {
    const x = ox + b.x, y = oy + b.y;
    b.sx = x; b.sy = y;
    const on = clamp01((S.bill - b.on) / 0.4);
    if (on <= 0) return; // before it boots the billboard is just part of the dark facade
    // the panel's frame fades in with it
    c.globalAlpha = Math.min(1, on * 2);
    c.fillStyle = '#04050c'; c.fillRect(x - 2, y - 2, b.w + 4, b.h + 4);
    c.globalAlpha = 1;
    const n = Math.max(1, games.length);
    const slot = Math.floor((t + b.phase) / 7);
    const k = ((t + b.phase) % 7) / 7;
    const tx = textures[(b.idx + slot) % n];
    b.gid = tx && on > 0.5 ? tx.id : null;
    // boot / change: a short glitch (scan bars) instead of a hard cut
    const changing = k > 0.965 || k < 0.03;
    const booting = on < 1;
    const flick = booting ? (Math.sin(t * 60 + b.phase * 9) > 0 ? on : on * 0.3) : 1;
    c.globalCompositeOperation = 'lighter';
    if (tx) {
      c.globalAlpha = 0.78 * flick * (changing ? 0.45 : 1) * day;
      c.drawImage(tx.c, x, y, b.w, b.h);
      // glow around the panel
      c.globalAlpha = 0.12 * flick;
      c.drawImage(radial(tx.acc, [[0, 1], [0.35, 0.6], [1, 0]]), x - b.w * 0.45, y - b.h * 0.7, b.w * 1.9, b.h * 2.4);
    }
    if (changing || booting) {
      c.globalAlpha = 0.5 * flick;
      c.fillStyle = 'rgba(160,220,255,0.5)';
      for (let i = 0; i < 4; i++) { const yy = y + ((t * 97 + i * 37 + b.phase * 50) % b.h); c.fillRect(x, yy, b.w, 1.4); }
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
  }

  function vehiclesStep(t, dt, a) {
    if (vehicles.length < 2 && Math.random() < dt / 7000) {
      const dir = Math.random() < 0.5 ? 1 : -1;
      vehicles.push({ x: dir > 0 ? -80 : W + 80, y: HZ * (0.25 + Math.random() * 0.35), v: (40 + Math.random() * 70) * dir, d: 0.2 + Math.random() * 0.3, len: 50 + Math.random() * 90 });
    }
    const c = ctx;
    c.globalCompositeOperation = 'lighter';
    vehicles = vehicles.filter(v => {
      v.x += v.v * dt / 1000;
      const x = v.x + cam.x * v.d, y = v.y + cam.y * v.d + Math.sin(t * 0.8 + v.len) * 2;
      const tail = x - Math.sign(v.v) * v.len;
      const g = c.createLinearGradient(tail, 0, x, 0);
      g.addColorStop(0, 'rgba(255,220,180,0)'); g.addColorStop(1, `rgba(255,226,190,${0.5 * a})`);
      c.strokeStyle = g; c.lineWidth = 1.2; c.beginPath(); c.moveTo(tail, y); c.lineTo(x, y); c.stroke();
      c.fillStyle = `rgba(255,250,240,${0.9 * a})`; c.fillRect(x - 1.2, y - 1.2, 2.4, 2.4);
      if ((t * 2 + v.len) % 1 < 0.15) { c.fillStyle = 'rgba(255,60,80,0.9)'; c.fillRect(x - Math.sign(v.v) * 5 - 1, y + 1, 2, 2); }
      return v.x > -200 && v.x < W + 200;
    });
    c.globalCompositeOperation = 'source-over';
  }

  function ripplesStep(c, dt) {
    if (ripples.length < 7 && Math.random() < dt / 240) ripples.push({ x: Math.random() * W, y: HZ + 8 + Math.random() * (H - HZ - 16), t: 0, r: 6 + Math.random() * 12 });
    c.lineWidth = 0.8;
    ripples = ripples.filter(p => {
      p.t += dt / 900;
      const r = p.r * p.t * 2;
      c.strokeStyle = `rgba(170,170,255,${0.16 * (1 - p.t)})`;
      c.beginPath(); c.ellipse(p.x, p.y, r, r * 0.22, 0, 0, Math.PI * 2); c.stroke();
      return p.t < 1;
    });
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
  loadTextures();
  start();

  return {
    set(v) { Object.assign(S, v); },
    /** the sky right now (core/sky.js#look) and whether the sign should be lit at this hour */
    look: () => LK,
    /** a tap on the city: the UFO / cat / moon (fx), a billboard (→ { kind: 'billboard', id }), a window (turns its light
     *  on or off). Returns { kind, id? } or null. */
    hit(x, y) {
      const f = fx.hit(x, y);
      if (f) return { kind: f };
      for (const b of billboards) if (b.gid && x >= b.sx - 8 && x <= b.sx + b.w + 8 && y >= b.sy - 8 && y <= b.sy + b.h + 8) return { kind: 'billboard', id: b.gid };
      for (let li = layers.length - 1; li >= 0; li--) {
        const L = layers[li];
        if (L.ox == null) continue;
        const px = x - L.ox, py = y - L.oy;
        if (!L.rects.some(r => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h)) continue;
        let best = null, bd = 9;
        for (const w of L.windows) { const d = Math.hypot(px - (w.x + w.w / 2), py - (w.y + w.h / 2)); if (d < bd) { bd = d; best = w; } }
        if (!best) return { kind: 'building' };
        best.flip = !best.flip; pokes++; refl = null;
        return { kind: 'window', on: (best.order <= P.win) !== best.flip };
      }
      return null;
    },
    signOn: () => P.sign > 0.5,
    refresh: () => { lookAt = 0; skyKey = ''; },
    safeTop: v => fx.safeTop(v),
    get state() { return S; },
    get tier() { return tier; },
    setTier,
    frames: () => frames.slice(),
    debug: () => ({ bills: billboards.filter(b => b.gid).map(b => ({ x: b.sx, y: b.sy, w: b.w, h: b.h, id: b.gid })), tier, dpr, W, H, running, layers: layers.length, windows: layers.reduce((n, L) => n + L.windows.length, 0), billboards: billboards.length, textures: textures.filter(Boolean).length, ...S, logoRect: undefined, w: LK.w, holiday: LK.holiday, rain: LK.rain, snow: LK.snow, moon: LK.moon, fx: fx.debug() }),
    destroy() {
      destroyed = true;
      stop();
      window.removeEventListener('deviceorientation', onOrient);
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', onResize);
      // release the pixel memory right away (mobile browsers keep canvases until GC otherwise)
      for (const L of layers) for (const c of [L.dark, L.lit, L.comp]) if (c) { c.width = 0; c.height = 0; }
      fx.destroy();
      for (const c of [sky, skyLit, street, refl, reflLit, rainTile, vignette, canvas, ...sprites.values()]) if (c) { c.width = 0; c.height = 0; }
      sprites.clear();
      for (const tx of textures) if (tx) { tx.c.width = 0; tx.c.height = 0; }
      layers = []; textures = []; billboards = []; beacons = [];
    },
  };
}
