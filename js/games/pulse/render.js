// PULSE renderer: a night drive. The note highway is the road; a procedural city scrolls behind it.
// Everything expensive (skyline, haze, road, glows, sprites) is pre-rendered to offscreen canvases
// once per resize/tier; a frame is only drawImage calls plus a few thin polygons. No shadowBlur per
// frame. Quality tiers step down automatically when frames start to drop.
import { rngFrom } from '../../core/rng.js';

export const LANE_COLORS = ['#a374ff', '#36e6ff', '#e46bff'];
const TIERS = [
  { name: 'low', dpr: 1, layers: 2, rain: 0, bokeh: 0, particles: 28, reflections: false, lights: 6 },
  { name: 'mid', dpr: 1.5, layers: 3, rain: 0, bokeh: 6, particles: 70, reflections: true, lights: 9 },
  { name: 'high', dpr: 2, layers: 4, rain: 46, bokeh: 10, particles: 140, reflections: true, lights: 12 },
];
const Z_FAR = 14;          // world units visible ahead
const MARK_GAP = 1.6;      // road marking spacing (world units)
const LIGHT_GAP = 3.2;     // streetlight spacing

const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };

export function initialTier() {
  try {
    const cores = navigator.hardwareConcurrency || 4;
    const mem = navigator.deviceMemory || 4;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return 1;
    return cores >= 6 && mem >= 4 ? 2 : 1;
  } catch { return 1; }
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d', { alpha: false }); // not desynchronized: front-buffer drawing can show half-drawn frames
  let tier = initialTier();
  let T = TIERS[tier];
  let W = 0, H = 0, dpr = 1;
  let G = null;          // geometry
  let S = null;          // pre-rendered surfaces
  const fx = { particles: [], rings: [], flashes: [0, 0, 0], pads: [0, 0, 0], judg: [], surge: 0, streak: 0, streakTarget: 0, dim: 0 };
  let rain = [], bokeh = [];
  let lastT = 0;
  const frameLog = [];
  let tierLockUntil = 0;
  let monitorTick = 0;
  let autoTier = true;
  let onTier = null;

  // ------------------------------------------------------------ geometry
  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, T.dpr);
    W = Math.max(1, Math.round(r.width * dpr));
    H = Math.max(1, Math.round(r.height * dpr));
    canvas.width = W;
    canvas.height = H;
    const yH = H * 0.3;
    const yHit = H * 0.8;
    const halfW = Math.min(W * 0.47, (yHit - yH) * 0.95);
    G = { yH, yHit, cx: W / 2, halfW, laneW: (halfW * 2) / 3, sBottom: (H - yH) / (yHit - yH), u: Math.min(W, H * 0.6) / 400 };
    build();
    seedWeather();
  }
  const sOf = z => 1 / (1 + z);
  const yOf = s => G.yH + (G.yHit - G.yH) * s;
  const xOf = (lo, s) => G.cx + lo * G.halfW * s; // lo: -1..1 across the road
  const laneLo = l => (l - 1) * (2 / 3);

  // ------------------------------------------------------------ pre-rendering
  function build() {
    const rnd = rngFrom('pulse-city');
    S = {};
    const bandH = Math.ceil(G.yH + H * 0.06); // skyline lives above (and just under) the horizon
    // sky
    S.sky = mk(4, bandH);
    {
      const c = S.sky.getContext('2d');
      const g = c.createLinearGradient(0, 0, 0, bandH);
      g.addColorStop(0, '#05040d');
      g.addColorStop(0.55, '#0d0a24');
      g.addColorStop(0.86, '#2a1650');
      g.addColorStop(1, '#3a1d63');
      c.fillStyle = g; c.fillRect(0, 0, 4, bandH);
    }
    // haze (cool / warm) for between layers; brightness follows the song's energy at draw time
    S.hazeCool = gradBand(bandH, 'rgba(70,90,200,0)', 'rgba(70,90,200,0.32)');
    S.hazeWarm = gradBand(bandH, 'rgba(190,70,230,0)', 'rgba(190,70,230,0.36)');
    // skyline layers, far -> near
    const specs = [
      { h: [0.14, 0.32], w: [8, 22], col: [44, 34, 86], win: 0.08, lit: 0.45, speed: 2.5, holo: 0, beacon: 0 },
      { h: [0.2, 0.5], w: [14, 34], col: [26, 20, 56], win: 0.1, lit: 0.6, speed: 6, holo: 2, beacon: 2 },
      { h: [0.28, 0.7], w: [20, 48], col: [14, 11, 32], win: 0.11, lit: 0.8, speed: 11, holo: 3, beacon: 2 },
      { h: [0.38, 0.86], w: [30, 70], col: [7, 6, 17], win: 0.08, lit: 0.9, speed: 18, holo: 2, beacon: 1 },
    ].slice(4 - T.layers);
    S.layers = specs.map((sp, li) => cityLayer(sp, bandH, rnd, li, specs.length));
    // a soft dark pool at the vanishing point keeps far notes readable against the city
    S.center = mk(W, G.yH * 2);
    {
      const c = S.center.getContext('2d');
      const g = c.createRadialGradient(G.cx, G.yH, 0, G.cx, G.yH, Math.min(W * 0.42, G.yH * 0.98));
      g.addColorStop(0, 'rgba(3,2,10,0.5)');
      g.addColorStop(1, 'rgba(3,2,10,0)');
      c.fillStyle = g; c.fillRect(0, 0, W, G.yH * 2);
    }
    // horizon: a wide violet/cyan glow where the road meets the city, and fog over the skyline's feet
    S.horizon = mk(W, H * 0.3);
    {
      const c = S.horizon.getContext('2d'), hh = H * 0.3, cyH = hh / 2;
      const g = c.createRadialGradient(G.cx, cyH, 0, G.cx, cyH, W * 0.62);
      g.addColorStop(0, 'rgba(200,150,255,0.55)');
      g.addColorStop(0.18, 'rgba(150,90,255,0.32)');
      g.addColorStop(0.5, 'rgba(70,60,200,0.12)');
      g.addColorStop(1, 'rgba(40,30,120,0)');
      c.save(); c.translate(0, cyH); c.scale(1, 0.32); c.translate(0, -cyH);
      c.fillStyle = g; c.fillRect(0, -hh * 2, W, hh * 5); c.restore(); // fill beyond the squash so the glow fades out, never clips
      const l = c.createLinearGradient(0, 0, W, 0);
      l.addColorStop(0, 'rgba(120,220,255,0)'); l.addColorStop(0.5, 'rgba(190,235,255,0.55)'); l.addColorStop(1, 'rgba(120,220,255,0)');
      c.fillStyle = l; c.fillRect(0, cyH - 0.6 * dpr, W, 1.2 * dpr);
    }
    S.fog = mk(4, H * 0.16);
    {
      const c = S.fog.getContext('2d'), fh = H * 0.16;
      const g = c.createLinearGradient(0, 0, 0, fh);
      g.addColorStop(0, 'rgba(48,26,92,0)'); g.addColorStop(0.55, 'rgba(48,26,92,0.7)'); g.addColorStop(1, 'rgba(20,12,44,0.95)');
      c.fillStyle = g; c.fillRect(0, 0, 4, fh);
    }
    buildRoad(rnd);
    buildSprites();
    S.vignette = mk(W, H);
    {
      const c = S.vignette.getContext('2d');
      const g = c.createRadialGradient(G.cx, H * 0.55, Math.min(W, H) * 0.25, G.cx, H * 0.55, Math.max(W, H) * 0.75);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.62)');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
    }
  }

  function gradBand(bandH, top, bottom) {
    const c = mk(4, bandH);
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, bandH);
    const peak = Math.min(0.97, G.yH / bandH);
    g.addColorStop(0, top);
    g.addColorStop(peak * 0.7, bottom.replace(/[\d.]+\)$/, m => `${parseFloat(m) * 0.6})`));
    g.addColorStop(peak, bottom);
    g.addColorStop(1, top);
    x.fillStyle = g; x.fillRect(0, 0, 4, bandH);
    return c;
  }

  function cityLayer(sp, bandH, rnd, li, count) {
    const LW = Math.ceil(W * 1.6); // wraps horizontally
    const base = G.yH + H * 0.012 * (li + 1);
    const c = mk(LW, bandH), x = c.getContext('2d');
    const glow = mk(LW, bandH), gx = glow.getContext('2d'); // windows that pulse with the beat
    const meta = { holos: [], beacons: [] };
    const [r, g, b] = sp.col;
    let px = -rnd() * 20 * G.u;
    while (px < LW) {
      const bw = (sp.w[0] + rnd() * (sp.w[1] - sp.w[0])) * G.u;
      const bh = (sp.h[0] + rnd() * (sp.h[1] - sp.h[0])) * G.yH * (rnd() < 0.12 ? 1.25 : 1);
      const top = base - bh;
      // body: subtle vertical gradient so towers read as volumes, not cutouts
      const bg = x.createLinearGradient(0, top, 0, base);
      bg.addColorStop(0, `rgb(${r + 8},${g + 6},${b + 14})`);
      bg.addColorStop(1, `rgb(${r},${g},${b})`);
      x.fillStyle = bg;
      x.fillRect(px, top, bw, bh + 2);
      const roof = rnd();
      if (roof < 0.28) x.fillRect(px + bw * 0.18, top - bh * 0.07, bw * 0.64, bh * 0.07 + 1); // stepped crown
      else if (roof < 0.42) { x.beginPath(); x.moveTo(px, top + 1); x.lineTo(px + bw, top + 1); x.lineTo(px + bw * (rnd() < 0.5 ? 0.15 : 0.85), top - bh * 0.12); x.closePath(); x.fill(); } // slanted top
      else if (roof < 0.52) { x.fillRect(px + bw * 0.46, top - bh * 0.22, Math.max(1, bw * 0.06), bh * 0.22); } // spire
      // windows: small, irregular, some whole floors lit
      const ws = Math.max(1.1, 1.5 * G.u * (0.7 + li * 0.2)) * dpr / 1.5;
      for (let wy = top + ws * 3; wy < base - ws * 2; wy += ws * 2.8) {
        const floorLit = rnd() < 0.06;
        for (let wx = px + ws * 1.5; wx < px + bw - ws * 1.5; wx += ws * 2.1) {
          if (!floorLit && rnd() > sp.win * 2.2) continue;
          const warm = rnd() < 0.55;
          const a = (0.25 + rnd() * 0.5) * sp.lit;
          const col = warm ? `rgba(255,${190 + (rnd() * 40) | 0},${120 + (rnd() * 50) | 0},${a})` : `rgba(${120 + (rnd() * 60) | 0},${200 + (rnd() * 50) | 0},255,${a})`;
          const target = rnd() < 0.25 ? gx : x; // a quarter of the windows pulse with the beat
          target.fillStyle = col;
          target.fillRect(wx, wy, ws * (floorLit ? 1.6 : 0.9), ws * 1.15);
        }
      }
      if (sp.beacon && bh > sp.h[1] * G.yH * 0.7 && meta.beacons.length < sp.beacon * 2) meta.beacons.push({ x: px + bw / 2, y: top - 2, ph: rnd() * 6 });
      if (sp.holo && rnd() < 0.16 && meta.holos.length < sp.holo * 2) {
        const hw = bw * (0.6 + rnd() * 0.5), hh = hw * (0.35 + rnd() * 0.5);
        const hy = top + bh * (0.1 + rnd() * 0.3);
        const col = ['#a374ff', '#36e6ff', '#ff4fd8', '#7c5cff'][(rnd() * 4) | 0];
        meta.holos.push({ x: px + bw / 2, y: hy + hh / 2, w: hw, h: hh, col, shape: (rnd() * 3) | 0 });
        holo(x, px + bw / 2 - hw / 2, hy, hw, hh, col, (rnd() * 3) | 0);
      }
      px += bw + (rnd() < 0.3 ? rnd() * 10 * G.u : 0);
    }
    return { c, glow, meta, speed: sp.speed * G.u, lw: LW, li, depth: (li + 1) / count };
  }

  // abstract holographic sign: soft panel + glyph-like bars or rings (no text, no brands)
  function holo(x, l, t, w, h, col, shape) {
    const g = x.createLinearGradient(l, t, l, t + h);
    g.addColorStop(0, rgba(col, 0.22));
    g.addColorStop(1, rgba(col, 0.05));
    x.fillStyle = g;
    x.fillRect(l, t, w, h);
    x.strokeStyle = rgba(col, 0.55);
    x.lineWidth = Math.max(1, G.u);
    x.strokeRect(l + 0.5, t + 0.5, w - 1, h - 1);
    x.fillStyle = rgba(col, 0.5);
    if (shape === 0) for (let i = 0; i < 3; i++) x.fillRect(l + w * 0.12, t + h * (0.22 + i * 0.22), w * (0.75 - i * 0.18), Math.max(1, h * 0.08));
    else if (shape === 1) { x.beginPath(); x.arc(l + w / 2, t + h / 2, Math.min(w, h) * 0.32, 0, Math.PI * 2); x.lineWidth = Math.max(1, h * 0.07); x.strokeStyle = rgba(col, 0.6); x.stroke(); }
    else { x.beginPath(); x.moveTo(l + w * 0.2, t + h * 0.75); x.lineTo(l + w * 0.5, t + h * 0.22); x.lineTo(l + w * 0.8, t + h * 0.75); x.closePath(); x.fill(); }
  }

  function roadPath(c, lo1 = -1, lo2 = 1) {
    const sB = G.sBottom;
    c.beginPath();
    c.moveTo(xOf(lo1, 0.012), yOf(0.012));
    c.lineTo(xOf(lo2, 0.012), yOf(0.012));
    c.lineTo(xOf(lo2, sB), H);
    c.lineTo(xOf(lo1, sB), H);
    c.closePath();
  }

  function buildRoad(rnd) {
    // asphalt: dark, wet, with a faint sheen that brightens toward the horizon glow
    S.road = mk(W, H);
    const c = S.road.getContext('2d');
    // ground beyond the road edges
    const gg = c.createLinearGradient(0, G.yH, 0, H);
    gg.addColorStop(0, '#120b26');
    gg.addColorStop(0.25, '#07060f');
    gg.addColorStop(1, '#030308');
    c.fillStyle = gg; c.fillRect(0, G.yH, W, H - G.yH);
    for (let i = 0; i < 70; i++) { // far city lights on the plain, thinning toward the viewer
      const d = Math.pow(rnd(), 2.6);
      const y = G.yH + d * (H - G.yH) * 0.35 + 1;
      const x = rnd() * W;
      const near = d * 3;
      c.fillStyle = rnd() < 0.6 ? `rgba(255,200,150,${0.3 - d * 0.6})` : `rgba(140,200,255,${0.3 - d * 0.6})`;
      c.fillRect(x, y, (0.8 + near) * dpr, (0.8 + near * 0.5) * dpr);
    }
    roadPath(c);
    const rg = c.createLinearGradient(0, G.yH, 0, H);
    rg.addColorStop(0, '#1d1238');
    rg.addColorStop(0.18, '#0e0a1e');
    rg.addColorStop(0.65, '#08070f');
    rg.addColorStop(1, '#0b0915');
    c.fillStyle = rg; c.fill();
    // fine grain
    c.save(); roadPath(c); c.clip();
    for (let i = 0; i < 2200; i++) {
      const y = G.yH + Math.pow(rnd(), 0.7) * (H - G.yH);
      c.fillStyle = `rgba(${150 + rnd() * 80},${140 + rnd() * 80},255,${rnd() * 0.035})`;
      c.fillRect(rnd() * W, y, 1.2 * dpr, 1.2 * dpr);
    }
    c.restore();
    // lane dividers + edges (dim base; edge glow is a separate overlay that follows the streak)
    for (const lo of [-1 / 3, 1 / 3]) line(c, lo, 'rgba(160,140,255,0.28)', 1.2);
    for (const lo of [-1, 1]) line(c, lo, 'rgba(120,200,255,0.35)', 1.6);
    // edge glow overlay (pre-blurred once)
    S.edge = mk(W, H);
    {
      const e = S.edge.getContext('2d');
      e.shadowColor = '#7c5cff'; e.shadowBlur = 18 * dpr;
      for (const lo of [-1, 1]) line(e, lo, 'rgba(150,120,255,0.95)', 3);
      e.shadowColor = '#36e6ff'; e.shadowBlur = 8 * dpr;
      for (const lo of [-1, 1]) line(e, lo, 'rgba(120,235,255,0.9)', 1.4);
      e.shadowBlur = 0;
    }
    // wet reflections: soft vertical streaks of city light, clipped to the road
    S.refl = mk(W, H);
    {
      const x = S.refl.getContext('2d');
      x.save(); roadPath(x); x.clip();
      const cols = ['#a374ff', '#36e6ff', '#ff4fd8', '#ffb46b', '#7c5cff'];
      if ('filter' in x) x.filter = `blur(${Math.round(7 * dpr)}px)`; // once, at build time
      for (let i = 0; i < 14; i++) {
        const sx = G.cx + (rnd() - 0.5) * G.halfW * 0.5;
        const col = cols[(rnd() * cols.length) | 0];
        const w = (12 + rnd() * 30) * G.u * dpr / 1.5;
        const len = (0.14 + rnd() * 0.32) * (H - G.yH);
        const g = x.createLinearGradient(0, G.yH, 0, G.yH + len);
        g.addColorStop(0, rgba(col, 0.16 + rnd() * 0.12));
        g.addColorStop(1, rgba(col, 0));
        x.fillStyle = g;
        // streaks fan out with perspective
        const spread = (sx - G.cx) * 2.2;
        x.beginPath();
        x.moveTo(sx - w * 0.15, G.yH);
        x.lineTo(sx + w * 0.15, G.yH);
        x.lineTo(sx + spread + w, G.yH + len);
        x.lineTo(sx + spread - w, G.yH + len);
        x.closePath(); x.fill();
      }
      // horizon glow pooling on the wet surface
      const hg = x.createRadialGradient(G.cx, G.yH, 0, G.cx, G.yH, G.halfW * 0.9);
      hg.addColorStop(0, 'rgba(170,110,255,0.35)');
      hg.addColorStop(1, 'rgba(170,110,255,0)');
      x.fillStyle = hg; x.fillRect(0, G.yH, W, H - G.yH);
      if ('filter' in x) x.filter = 'none';
      x.restore();
    }
    // per-lane flash (bright at the hit line, fading toward the horizon)
    S.laneFlash = [0, 1, 2].map(l => {
      const f = mk(W, H), x = f.getContext('2d');
      const lo = laneLo(l), half = 1 / 3;
      x.beginPath();
      x.moveTo(xOf(lo - half, 0.05), yOf(0.05)); x.lineTo(xOf(lo + half, 0.05), yOf(0.05));
      x.lineTo(xOf(lo + half, G.sBottom), H); x.lineTo(xOf(lo - half, G.sBottom), H); x.closePath();
      const g = x.createLinearGradient(0, yOf(0.05), 0, H);
      g.addColorStop(0, rgba(LANE_COLORS[l], 0));
      g.addColorStop(0.75, rgba(LANE_COLORS[l], 0.22));
      g.addColorStop(0.86, rgba(LANE_COLORS[l], 0.42));
      g.addColorStop(1, rgba(LANE_COLORS[l], 0.1));
      x.fillStyle = g; x.fill();
      return f;
    });
  }

  function line(c, lo, style, width) {
    const g = c.createLinearGradient(0, G.yH, 0, H);
    g.addColorStop(0, style.replace(/[\d.]+\)$/, '0)'));
    g.addColorStop(0.35, style);
    g.addColorStop(1, style);
    c.strokeStyle = g;
    c.lineWidth = width * dpr;
    c.beginPath();
    c.moveTo(xOf(lo, 0.012), yOf(0.012));
    c.lineTo(xOf(lo, G.sBottom), H);
    c.stroke();
  }

  function buildSprites() {
    const lw = G.laneW;
    // notes: sleek light-bars (white core, lane-colored body and halo)
    const nw = lw * 0.76, nh = nw * 0.24, pad = nh * 1.6;
    S.note = LANE_COLORS.map(col => {
      const c = mk(nw + pad * 2, nh + pad * 2), x = c.getContext('2d');
      x.shadowColor = col; x.shadowBlur = pad * 0.9;
      rrect(x, pad, pad, nw, nh, nh / 2); x.fillStyle = rgba(col, 0.95); x.fill();
      x.shadowBlur = pad * 0.35;
      rrect(x, pad, pad, nw, nh, nh / 2); x.fill();
      x.shadowBlur = 0;
      const g = x.createLinearGradient(0, pad, 0, pad + nh);
      g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.55, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0.05)');
      rrect(x, pad + nh * 0.35, pad + nh * 0.18, nw - nh * 0.7, nh * 0.42, nh * 0.21); x.fillStyle = g; x.fill();
      return c;
    });
    S.noteDims = { w: nw + pad * 2, h: nh + pad * 2 };
    // pads at the hit line
    const pw = lw * 0.86, ph = pw * 0.2;
    const padSprite = (col, lit) => {
      const p2 = ph * 1.8;
      const c = mk(pw + p2 * 2, ph + p2 * 2), x = c.getContext('2d');
      if (lit) { x.shadowColor = col; x.shadowBlur = p2; }
      rrect(x, p2, p2, pw, ph, ph / 2);
      const fg = x.createLinearGradient(0, p2, 0, p2 + ph);
      fg.addColorStop(0, lit ? rgba(col, 0.75) : 'rgba(30,24,60,0.7)');
      fg.addColorStop(1, lit ? rgba(col, 0.35) : 'rgba(8,6,20,0.75)');
      x.fillStyle = fg; x.fill();
      x.shadowBlur = 0;
      x.lineWidth = Math.max(1, 1.4 * dpr);
      x.strokeStyle = lit ? 'rgba(255,255,255,0.95)' : rgba(col, 0.7);
      rrect(x, p2, p2, pw, ph, ph / 2); x.stroke();
      // glass highlight
      const hl = x.createLinearGradient(0, p2, 0, p2 + ph * 0.5);
      hl.addColorStop(0, `rgba(255,255,255,${lit ? 0.5 : 0.16})`); hl.addColorStop(1, 'rgba(255,255,255,0)');
      rrect(x, p2 + ph * 0.3, p2 + ph * 0.12, pw - ph * 0.6, ph * 0.36, ph * 0.18); x.fillStyle = hl; x.fill();
      return c;
    };
    S.pad = LANE_COLORS.map(col => padSprite(col, false));
    S.padLit = LANE_COLORS.map(col => padSprite(col, true));
    S.padDims = { w: pw + ph * 3.6, h: ph + ph * 3.6 };
    // hit line
    S.hitLine = mk(G.halfW * 2 + 40 * dpr, 30 * dpr);
    {
      const x = S.hitLine.getContext('2d');
      x.shadowColor = '#a374ff'; x.shadowBlur = 12 * dpr;
      const g = x.createLinearGradient(0, 0, S.hitLine.width, 0);
      g.addColorStop(0, 'rgba(163,116,255,0)'); g.addColorStop(0.15, 'rgba(163,116,255,0.8)'); g.addColorStop(0.5, 'rgba(200,240,255,0.95)'); g.addColorStop(0.85, 'rgba(163,116,255,0.8)'); g.addColorStop(1, 'rgba(163,116,255,0)');
      x.fillStyle = g; x.fillRect(0, 15 * dpr - 1.2 * dpr, S.hitLine.width, 2.4 * dpr);
    }
    // glow dot (particles, beacons, streetlights, bokeh)
    S.dot = radial(64, [[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,255,255,0.65)'], [1, 'rgba(255,255,255,0)']]);
    S.dotCol = LANE_COLORS.map(col => radial(64, [[0, 'rgba(255,255,255,1)'], [0.3, rgba(col, 0.75)], [1, rgba(col, 0)]]));
    S.beacon = radial(32, [[0, 'rgba(255,90,110,1)'], [1, 'rgba(255,60,90,0)']]);
    S.street = radial(48, [[0, 'rgba(235,250,255,1)'], [0.12, 'rgba(200,235,255,0.9)'], [0.32, 'rgba(150,120,255,0.28)'], [1, 'rgba(120,90,255,0)']]);
    S.bokeh = ['#a374ff', '#36e6ff', '#ff4fd8', '#ffb46b'].map(col => radial(96, [[0, rgba(col, 0.5)], [0.7, rgba(col, 0.18)], [1, rgba(col, 0)]]));
    S.ring = LANE_COLORS.map(col => {
      const c = mk(128, 128), x = c.getContext('2d');
      x.shadowColor = col; x.shadowBlur = 12;
      x.strokeStyle = 'rgba(255,255,255,0.95)'; x.lineWidth = 4;
      x.beginPath(); x.ellipse(64, 64, 52, 52, 0, 0, Math.PI * 2); x.stroke();
      return c;
    });
    S.flare = mk(256, 32);
    {
      const x = S.flare.getContext('2d');
      const g = x.createLinearGradient(0, 0, 256, 0);
      g.addColorStop(0, 'rgba(160,230,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.95)'); g.addColorStop(1, 'rgba(160,230,255,0)');
      x.fillStyle = g; x.fillRect(0, 14, 256, 4);
      const r = x.createRadialGradient(128, 16, 0, 128, 16, 16);
      r.addColorStop(0, 'rgba(255,255,255,0.9)'); r.addColorStop(1, 'rgba(160,230,255,0)');
      x.fillStyle = r; x.fillRect(96, 0, 64, 32);
    }
    S.rain = mk(4, 40);
    {
      const x = S.rain.getContext('2d');
      const g = x.createLinearGradient(0, 0, 0, 40);
      g.addColorStop(0, 'rgba(190,200,255,0)'); g.addColorStop(1, 'rgba(190,210,255,0.55)');
      x.fillStyle = g; x.fillRect(1, 0, 1.4, 40);
    }
  }

  function radial(size, stops) {
    const c = mk(size, size), x = c.getContext('2d');
    const g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    for (const [o, col] of stops) g.addColorStop(o, col);
    x.fillStyle = g; x.fillRect(0, 0, size, size);
    return c;
  }

  function rrect(x, l, t, w, h, r) {
    x.beginPath();
    x.moveTo(l + r, t); x.lineTo(l + w - r, t); x.arc(l + w - r, t + r, r, -Math.PI / 2, Math.PI / 2);
    x.lineTo(l + r, t + h); x.arc(l + r, t + r, r, Math.PI / 2, Math.PI * 1.5); x.closePath();
  }

  function seedWeather() {
    const rnd = rngFrom('pulse-weather');
    rain = Array.from({ length: T.rain }, () => ({ x: rnd() * W, y: rnd() * H, v: (0.9 + rnd() * 0.6) * H * 0.9, a: 0.15 + rnd() * 0.25, l: (0.6 + rnd() * 0.8) }));
    bokeh = Array.from({ length: T.bokeh }, () => ({ x: rnd() * W, y: G.yH * (0.4 + rnd() * 1.4), r: (30 + rnd() * 60) * G.u, c: (rnd() * 4) | 0, v: (2 + rnd() * 6) * G.u, a: 0.08 + rnd() * 0.12, ph: rnd() * 6 }));
  }

  // ------------------------------------------------------------ frame
  /**
   * f: { t: song time (s, calibration-corrected), notes: [[t, lane]], done: Uint8Array|null, speed,
   *      energy 0..1, pulse 0..1 (beat), down 0..1 (downbeat), combo, ghost: [{ t, lane }] (Echo demo),
   *      now: performance ms }
   */
  function frame(f) {
    const now = f.now;
    const dt = lastT ? Math.min(0.1, (now - lastT) / 1000) : 0.016;
    lastT = now;
    monitor(dt);
    const time = now / 1000;
    const e = f.energy ?? 0.5;
    const pulse = f.pulse || 0;
    // streak: rises with the combo, dims gently on a miss
    fx.streakTarget = Math.min(1, (f.combo || 0) / 40);
    fx.streak += (fx.streakTarget - fx.streak) * (fx.streakTarget > fx.streak ? 0.05 : 0.025);
    fx.surge = Math.max(0, fx.surge - dt * 1.3);

    // --- sky + city (top band)
    const bandH = S.sky.height;
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.drawImage(S.sky, 0, 0, W, bandH);
    const cityLight = 0.5 + 0.5 * e;
    for (const L of S.layers) {
      const ox = -((time * L.speed) % L.lw);
      for (const x0 of [ox, ox + L.lw]) {
        if (x0 > W || x0 + L.lw < 0) continue;
        ctx.globalAlpha = 0.55 + 0.45 * cityLight * (0.6 + 0.4 * L.depth);
        ctx.drawImage(L.c, x0, 0);
        ctx.globalAlpha = (0.25 + 0.75 * pulse * (0.5 + 0.5 * e)) * (0.5 + 0.5 * L.depth);
        ctx.drawImage(L.glow, x0, 0);
        // holo signs breathe on the downbeat; beacons blink
        ctx.globalCompositeOperation = 'lighter';
        for (const hs of L.meta.holos) {
          const x = x0 + hs.x;
          if (x < -hs.w || x > W + hs.w) continue;
          ctx.globalAlpha = (0.12 + 0.35 * f.down + 0.15 * e) * (0.6 + 0.4 * L.depth);
          const s = Math.max(hs.w, hs.h) * 1.6;
          ctx.drawImage(S.dotCol[hs.col === '#36e6ff' ? 1 : hs.col === '#a374ff' ? 0 : 2], x - s / 2, hs.y - s / 2, s, s);
        }
        for (const b of L.meta.beacons) {
          const x = x0 + b.x;
          if (x < -10 || x > W + 10) continue;
          ctx.globalAlpha = 0.35 + 0.65 * (Math.sin(time * 2.2 + b.ph) > 0.6 ? 1 : 0.15);
          const s = 6 * G.u * dpr;
          ctx.drawImage(S.beacon, x - s / 2, b.y - s / 2, s, s);
        }
        ctx.globalCompositeOperation = 'source-over';
      }
      // haze between layers: cool and moody when calm, violet and vivid in high energy
      ctx.globalAlpha = (0.35 + 0.4 * (1 - L.depth)) * (1 - e * 0.5);
      ctx.drawImage(S.hazeCool, 0, 0, W, bandH);
      ctx.globalAlpha = (0.2 + 0.5 * e) * (1 - L.depth * 0.5);
      ctx.drawImage(S.hazeWarm, 0, 0, W, bandH);
    }
    ctx.globalAlpha = 1;
    ctx.drawImage(S.fog, 0, G.yH - H * 0.13, W, H * 0.16);
    ctx.drawImage(S.center, 0, 0);

    // --- road
    ctx.drawImage(S.road, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.55 + 0.35 * e + 0.12 * f.down;
    ctx.drawImage(S.horizon, 0, G.yH - S.horizon.height / 2);
    ctx.globalCompositeOperation = 'source-over';
    if (T.reflections) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.28 + 0.45 * e + 0.15 * pulse;
      ctx.drawImage(S.refl, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
    }
    // streetlights streaming along both edges (sells the speed)
    const speed = (f.speed || 8) * (1 + 0.35 * fx.streak);
    const travel = time * speed;
    ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < T.lights; k++) {
      const z = Z_FAR - ((travel + k * LIGHT_GAP) % (T.lights * LIGHT_GAP)) * (Z_FAR / (T.lights * LIGHT_GAP)) * 1.15;
      if (z < -0.3) continue;
      const s = sOf(z);
      const a = smooth(Z_FAR, Z_FAR * 0.7, z) * smooth(-0.3, 1.2, z);
      const sz = Math.min(26 * G.u * dpr / 1.5 * 1.6, 30 * G.u * dpr / 1.5 * s);
      for (const side of [-1, 1]) {
        ctx.globalAlpha = 0.75 * a;
        ctx.drawImage(S.street, xOf(side * 1.1, s) - sz / 2, yOf(s) - G.halfW * 0.42 * s - sz / 2, sz, sz);
      }
    }
    // lane flashes
    for (let l = 0; l < 3; l++) {
      if (fx.flashes[l] <= 0.01) continue;
      ctx.globalAlpha = Math.min(1, fx.flashes[l]);
      ctx.drawImage(S.laneFlash[l], 0, 0);
      fx.flashes[l] *= Math.pow(0.0009, dt); // fast decay
    }
    // edge glow follows the streak (+ milestone surge)
    ctx.globalAlpha = Math.min(1, 0.22 + 0.6 * fx.streak + 0.6 * fx.surge + 0.1 * pulse);
    ctx.drawImage(S.edge, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    // road markings stream toward the player
    ctx.fillStyle = `rgba(190,170,255,${0.18 + 0.25 * fx.streak + 0.3 * fx.surge})`;
    const mOff = (travel * (1 + 0.5 * fx.streak)) % MARK_GAP;
    for (const lo of [-1 / 3, 1 / 3]) {
      for (let z = Z_FAR - mOff; z > 0.02; z -= MARK_GAP) { // markings end at the hit line (below it they'd balloon into bars)
        const z2 = Math.max(0, z - 0.55);
        const s1 = sOf(z), s2 = sOf(z2);
        const w1 = 1.6 * dpr * s1 * 1.4, w2 = 1.6 * dpr * s2 * 1.4;
        ctx.beginPath();
        ctx.moveTo(xOf(lo, s1) - w1, yOf(s1)); ctx.lineTo(xOf(lo, s1) + w1, yOf(s1));
        ctx.lineTo(xOf(lo, s2) + w2, yOf(s2)); ctx.lineTo(xOf(lo, s2) - w2, yOf(s2));
        ctx.fill();
      }
    }

    // --- hit line + pads
    ctx.globalAlpha = 0.85;
    ctx.drawImage(S.hitLine, G.cx - S.hitLine.width / 2, G.yHit - S.hitLine.height / 2);
    for (let l = 0; l < 3; l++) {
      const x = xOf(laneLo(l), 1);
      const lit = fx.pads[l];
      ctx.globalAlpha = 1;
      ctx.drawImage(S.pad[l], x - S.padDims.w / 2, G.yHit - S.padDims.h / 2);
      if (lit > 0.01) { ctx.globalAlpha = Math.min(1, lit); ctx.drawImage(S.padLit[l], x - S.padDims.w / 2, G.yHit - S.padDims.h / 2); }
      fx.pads[l] = Math.max(f.held && f.held[l] ? 0.55 : 0, lit - dt * 5);
    }

    // --- notes (far to near so near ones draw on top)
    const v = f.speed || 8;
    const notes = f.notes || [];
    ctx.globalCompositeOperation = 'lighter';
    if (notes.length) {
      const tFar = f.t + Z_FAR / v;
      let lo = 0, hi = notes.length;
      while (lo < hi) { const m = (lo + hi) >> 1; if (notes[m][0] < f.t - 0.6 / v - 0.15) lo = m + 1; else hi = m; }
      let last = lo;
      while (last < notes.length && notes[last][0] <= tFar) last++;
      for (let i = last - 1; i >= lo; i--) {
        if (f.done && f.done[i]) continue;
        drawNote(notes[i][1], (notes[i][0] - f.t) * v);
      }
    }
    if (f.ghost) for (const gN of f.ghost) drawNote(gN.lane, (gN.t - f.t) * v, 0.75);

    // --- fx
    for (let i = fx.rings.length - 1; i >= 0; i--) {
      const r = fx.rings[i];
      r.life -= dt / r.dur;
      if (r.life <= 0) { fx.rings.splice(i, 1); continue; }
      const k = 1 - r.life;
      const size = G.laneW * (0.45 + k * (r.big ? 1.1 : 0.75));
      ctx.globalAlpha = r.life * 0.9;
      ctx.drawImage(S.ring[r.lane], r.x - size / 2, r.y - size * 0.32 / 2, size, size * 0.32);
      if (r.big) { ctx.globalAlpha = r.life; const fw = G.laneW * (1.6 + k); ctx.drawImage(S.flare, r.x - fw / 2, r.y - fw / 16, fw, fw / 8); }
    }
    for (let i = fx.particles.length - 1; i >= 0; i--) {
      const p = fx.particles[i];
      p.life -= dt / p.dur;
      if (p.life <= 0) { fx.particles[i] = fx.particles[fx.particles.length - 1]; fx.particles.pop(); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 900 * dpr * dt * 0.35;
      ctx.globalAlpha = p.life;
      const s = p.size * (0.6 + 0.4 * p.life);
      ctx.drawImage(S.dotCol[p.lane], p.x - s / 2, p.y - s / 2, s, s);
    }
    // weather (restrained)
    if (rain.length) {
      ctx.globalAlpha = 0.5;
      for (const d of rain) {
        d.y += d.v * dt; d.x -= d.v * dt * 0.12;
        if (d.y > H) { d.y = -40 * dpr; d.x = Math.random() * W * 1.1; }
        ctx.globalAlpha = d.a;
        ctx.drawImage(S.rain, d.x, d.y, 2 * dpr, 34 * dpr * d.l);
      }
    }
    for (const b of bokeh) {
      b.x -= b.v * dt; if (b.x < -b.r * 2) b.x = W + b.r;
      ctx.globalAlpha = b.a * (0.7 + 0.3 * Math.sin(time * 0.8 + b.ph)) * (0.6 + 0.6 * e);
      ctx.drawImage(S.bokeh[b.c], b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
    }
    ctx.globalCompositeOperation = 'source-over';

    // judgment text (small, refined, quick)
    for (let i = fx.judg.length - 1; i >= 0; i--) {
      const j = fx.judg[i];
      j.life -= dt / 0.5;
      if (j.life <= 0) { fx.judg.splice(i, 1); continue; }
      ctx.globalAlpha = Math.min(1, j.life * 1.8);
      ctx.font = `700 ${Math.round(12.5 * dpr * (G.u > 1.15 ? 1.1 : 1))}px "Chakra Petch", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = j.col;
      ctx.fillText(j.text, j.x, G.yHit - G.laneW * 0.42 - (1 - j.life) * 14 * dpr);
    }
    // vignette
    ctx.globalAlpha = 1;
    ctx.drawImage(S.vignette, 0, 0);
  }

  function drawNote(lane, z, alphaMul = 1) {
    if (z > Z_FAR || z < -0.3) return;
    const s = sOf(z);
    const a = smooth(Z_FAR, Z_FAR * 0.78, z) * (z < 0 ? Math.max(0, 1 + z * 4) : 1) * alphaMul;
    if (a <= 0.01) return;
    const x = xOf(laneLo(lane), s), y = yOf(s);
    const w = S.noteDims.w * s, hh = S.noteDims.h * s * (0.55 + 0.45 * s);
    ctx.globalAlpha = a * Math.min(1, 0.35 + 0.9 * s);
    ctx.drawImage(S.note[lane], x - w / 2, y - hh / 2, w, hh);
    if (T.reflections && s > 0.12 && z > 0.05) {
      ctx.globalAlpha = a * 0.22 * s * Math.min(1, z / 1.2); // fades as the note reaches its pad (never reads as a second note)
      ctx.drawImage(S.note[lane], x - w / 2, y + hh * 0.18, w, hh * 0.8);
    }
  }

  // ------------------------------------------------------------ events
  function hit(lane, kind) {
    const x = xOf(laneLo(lane), 1), y = G.yHit;
    const big = kind === 'perfect';
    fx.flashes[lane] = Math.max(fx.flashes[lane], big ? 0.75 : kind === 'great' ? 0.55 : 0.38);
    fx.pads[lane] = 1;
    fx.rings.push({ lane, x, y, life: 1, dur: big ? 0.36 : 0.28, big });
    const n = Math.min(T.particles - fx.particles.length, big ? 16 : kind === 'great' ? 10 : 6);
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      const sp = (160 + Math.random() * 300) * dpr * (big ? 1.2 : 1);
      fx.particles.push({ lane, x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp * 0.75, life: 1, dur: 0.35 + Math.random() * 0.3, size: (6 + Math.random() * 10) * dpr });
    }
    const label = { perfect: ['PERFECT', '#e8fbff'], great: ['GREAT', '#c7a8ff'], good: ['GOOD', '#9fa3d6'] }[kind];
    if (label) fx.judg.push({ text: label[0].split('').join(String.fromCharCode(8202)), col: label[1], x, life: 1 });
  }
  function miss(lane) {
    fx.judg.push({ text: 'MISS', col: 'rgba(255,90,120,0.85)', x: xOf(laneLo(lane), 1), life: 0.8 });
    fx.streak *= 0.6; // dims gently, never a hard cut
  }
  function press(lane) { fx.pads[lane] = Math.max(fx.pads[lane], 0.7); }
  function surge() { fx.surge = 1; }
  function echoLight(lane) { fx.pads[lane] = 1; fx.flashes[lane] = Math.max(fx.flashes[lane], 0.5); }

  /** Lane under a pointer (client coordinates), or -1 if above the road area. */
  function laneAt(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    const x = (clientX - r.left) * dpr;
    const y = (clientY - r.top) * dpr;
    if (y < G.yH + (G.yHit - G.yH) * 0.25) return -1;
    const s = Math.max(0.3, (y - G.yH) / (G.yHit - G.yH));
    const lo = (x - G.cx) / (G.halfW * s);
    return lo < -1 / 3 ? 0 : lo > 1 / 3 ? 2 : 1;
  }

  // ------------------------------------------------------------ quality tiers
  function monitor(dt) {
    if (!autoTier) return;
    frameLog.push(dt);
    if (frameLog.length > 90) frameLog.shift();
    if (++monitorTick % 15) return; // judge every 15th frame (sorting 90 numbers each frame is waste)
    const now = performance.now();
    if (frameLog.length < 90 || now < tierLockUntil || tier === 0) return;
    const sorted = [...frameLog].sort((a, b) => a - b);
    const p75 = sorted[Math.floor(sorted.length * 0.75)];
    if (p75 > 0.0195) { // most frames slower than ~51 fps: step down
      setTier(tier - 1);
      tierLockUntil = now + 3000;
    }
  }
  function setTier(n) {
    const t = Math.max(0, Math.min(TIERS.length - 1, n));
    if (t === tier && S) return;
    tier = t; T = TIERS[tier];
    frameLog.length = 0;
    fx.particles.length = Math.min(fx.particles.length, T.particles);
    resize();
    onTier && onTier(T.name);
  }

  resize();
  return {
    frame, resize, hit, miss, press, surge, echoLight, laneAt, setTier,
    get tier() { return tier; }, get tierName() { return T.name; },
    set autoTier(v) { autoTier = v; }, set onTier(fn) { onTier = fn; },
    geometry: () => ({ ...G, dpr, W, H }),
    destroy() { S = null; },
  };
}
