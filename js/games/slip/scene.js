// SLIPSTREAM world renderer (Canvas 2D over the WebGL sky).
//
// Back to front: three parallax silhouette layers in the biome's style (dunes, crystal spires, floating islands with
// towers, storm crags, drifting asteroids), atmospheric events (meteors, an airship, light-birds), the ground under
// the track (layered, darker with depth), the track itself — a single bright line of light — then the hazards,
// boost rings, ghost riders, your rider and trails, particles, speed lines. Biomes crossfade over ~90 m.
// Everything is drawn in world metres through one transform; a gravity flip turns the whole view over (scaleY → −1
// through a quick squash). Silhouette shapes come from seeded noise of world x, so every phone sees the same scenery.
import { DX, floorAt, ceilAt, isSolid, firstAfter, biomeAt } from './course.js';
import { laserOn, zapLine } from './physics.js';
import { drawRider, hexA } from './ride.js';

// per-biome look: track light, glow, ground gradient, three silhouette layers (far → near), rim light
export const STYLE = {
  dunes: [
    { track: '#ffe6bf', glow: '#ff9a5c', ground: ['#3a1a3a', '#120818'], layers: ['#7a3a62', '#55284e', '#341a3c'], rim: '#ffb37a' },
    { track: '#ffe0ec', glow: '#ff6aa0', ground: ['#34183e', '#100818'], layers: ['#6a3070', '#4a2258', '#2e163c'], rim: '#ff9ac4' },
    { track: '#ffe2b0', glow: '#ff7a3a', ground: ['#3a160e', '#140708'], layers: ['#6a2a22', '#4a1c1a', '#2c1012'], rim: '#ffa060' },
  ],
  crystal: [
    { track: '#d6f6ff', glow: '#5ad0ff', ground: ['#121a4a', '#050818'], layers: ['#2a3a8a', '#1e2a6a', '#121a48'], rim: '#8ae6ff' },
    { track: '#f4e0ff', glow: '#b36aff', ground: ['#22104a', '#08041a'], layers: ['#4a2a8a', '#361e6a', '#20124a'], rim: '#d4a0ff' },
    { track: '#dcfff0', glow: '#3affc0', ground: ['#0a2a30', '#030c10'], layers: ['#1a5a5a', '#124444', '#0a2a30'], rim: '#8affd8' },
  ],
  city: [
    { track: '#ffe6fa', glow: '#ff6ad5', ground: ['#1e1a4a', '#0a0818'], layers: ['#3a3a7a', '#2a2a62', '#1a1a44'], rim: '#ff9ae0' },
    { track: '#e0fbff', glow: '#3fe0ff', ground: ['#14123a', '#050412'], layers: ['#2a2460', '#1e1a4a', '#120e30'], rim: '#ff3fb0' },
    { track: '#fff4e6', glow: '#8fb8ff', ground: ['#2a3060', '#0e1028'], layers: ['#5a6aa0', '#424e82', '#2a325a'], rim: '#ffd0a0' },
  ],
  storm: [
    { track: '#e8eeff', glow: '#9aa8ff', ground: ['#14182e', '#05060c'], layers: ['#1c2140', '#141832', '#0c0f22'], rim: '#8f9cff' },
    { track: '#f4e8ff', glow: '#c08aff', ground: ['#1a1030', '#05030c'], layers: ['#251838', '#1b112c', '#110a1e'], rim: '#b98cff' },
    { track: '#e6f8ff', glow: '#7ad0ff', ground: ['#0e1a26', '#030609'], layers: ['#16242f', '#101b24', '#0a1218'], rim: '#7ec4ef' },
  ],
  space: [
    { track: '#eafff4', glow: '#5dffb0', ground: ['#0a1630', '#02040a'], layers: ['#1a2a5a', '#121e42', '#0a122a'], rim: '#7affc8' },
    { track: '#fff0f8', glow: '#ff6ad5', ground: ['#1a0e30', '#04020a'], layers: ['#3a1a5a', '#281242', '#180a2a'], rim: '#ffb36a' },
    { track: '#e8f6ff', glow: '#6ad8ff', ground: ['#081028', '#010206'], layers: ['#16205a', '#0e1642', '#080c2a'], rim: '#a58bff' },
  ],
};

const lerp = (a, b, k) => a + (b - a) * k;
const hexRgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const mixHex = (a, b, k) => { if (!b || k <= 0) return a; const A = hexRgb(a), B = hexRgb(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`; };
function hash(n) { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15); return (n >>> 0) / 4294967296; }
function vnoise(x, seed) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hash(i * 374761 + seed) * (1 - u) + hash((i + 1) * 374761 + seed) * u; }

const TIER = [
  { glowPasses: 1, layers: 2, particles: 60, speedLines: 0, events: false },
  { glowPasses: 2, layers: 3, particles: 140, speedLines: 10, events: true },
  { glowPasses: 3, layers: 3, particles: 260, speedLines: 18, events: true },
];

export function createScene(canvas, course) {
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1, tier = 2;
  let parts = [];
  let hS = null, horizon = 0.4;
  const tags = [];
  const flashes = [];
  const seedN = Math.floor(hash(course.sig.length * 7919 + course.h.length) * 1e6);
  // seeded atmospheric events along the course: [x, kind]
  const events = [];
  for (let i = 0; i < 60; i++) {
    const x = 300 + i * 260 + hash(i * 31 + seedN) * 180;
    events.push({ x, kind: ['birds', 'meteors', 'airship'][Math.floor(hash(i * 17 + seedN) * 3)], y: 0.18 + hash(i * 13 + seedN) * 0.25 });
  }

  let cw = 0, ch = 0;
  const ro = new ResizeObserver(() => { const r = canvas.getBoundingClientRect(); cw = r.width; ch = r.height; });
  ro.observe(canvas);
  function resize(maxDpr = 2) {
    if (!cw) { const b = canvas.getBoundingClientRect(); cw = b.width; ch = b.height; }
    const r = { width: cw, height: ch };
    dpr = Math.min(maxDpr, window.devicePixelRatio || 1);
    const nw = Math.round(r.width * dpr), nh = Math.round(r.height * dpr);
    if (nw !== canvas.width || nh !== canvas.height) { canvas.width = nw; canvas.height = nh; }
    W = r.width; H = r.height;
  }

  /**
   * f: { camX, camY, scale (px/m), ax, ay (rider anchor on screen, px), flip (1..-1), t (seconds, match clock),
   *      riders: [{ x, y, a, g, color, ride, trail, ghost, crouch, tuck, inv, name, st, pts }], speed, airLift,
   *      flash (lightning 0..1), reduced }
   */
  function draw(f) {
    const T = TIER[tier];
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const bi = biomeAt(course, f.camX);
    const sA = STYLE[bi.a.id][bi.a.variant], sB = bi.b ? STYLE[bi.b.id][bi.b.variant] : null;
    const mixK = bi.b ? bi.mix * bi.mix * (3 - 2 * bi.mix) : 0;
    const style = k => mixHex(sA[k], sB && sB[k], mixK);
    // the view flip (gravity flip zones) mirrors around the rider's screen height
    ctx.save();
    if (f.flip !== 1) { ctx.translate(0, f.ay); ctx.scale(1, f.flip); ctx.translate(0, -f.ay); }
    // ---- world transform: metres -> screen
    const sx = x => (x - f.camX) * f.scale + f.ax;
    const sy = y => f.ay - (y - f.camY) * f.scale;
    const x0 = f.camX - f.ax / f.scale - 4, x1 = f.camX + (W - f.ax) / f.scale + 4;
    const step = Math.max(DX * 2, 2.5 / f.scale);
    // a slow-moving horizon: the terrain height, heavily smoothed (the distance does not bob with every hill)
    const here = floorAt(course, f.camX);
    hS = hS == null ? here : hS + (here - hS) * 0.02;
    const yH = sy(hS);
    const Hm = Math.min(W, H) * 0.92;
    horizon = 1 - Math.max(0, Math.min(H, lerp(f.ay, yH, 0.2) - Hm * 0.02)) / H;
    // ---- parallax silhouettes (far -> near), each with a rim of sky light and haze at its feet
    for (let L = 3 - T.layers; L < 3; L++) {
      drawLayer(bi.a, L, f, sA, 1, yH, Hm);
      if (bi.b && mixK > 0.01) drawLayer(bi.b, L, f, sB, mixK, yH, Hm);
    }
    if (T.events && !f.reduced) drawEvents(f, bi);
    if (f.flash > 0.01 && (bi.a.id === 'storm' || (bi.b && bi.b.id === 'storm'))) drawBolt(f);
    // ---- the ground: filled under the track, layered strata, depth
    const top = [];
    for (let x = x0; x <= x1; x += step) top.push(x);
    ctx.lineJoin = 'round';
    const g0 = mixHex(sA.ground[0], sB && sB.ground[0], mixK), g1 = mixHex(sA.ground[1], sB && sB.ground[1], mixK);
    const surfTop = sy(here) - 60;
    const ground = ctx.createLinearGradient(0, surfTop, 0, surfTop + Hm * 1.1);
    // in OPEN SPACE the path is a translucent ribbon of rock: the stars show through it
    const sp = (bi.a.id === 'space' ? 1 - mixK : 0) + (bi.b && bi.b.id === 'space' ? mixK : 0);
    const ga = a => (sp > 0 ? `rgba(${a.match(/\d+/g).slice(0, 3).join(',')},${(1 - sp * 0.55).toFixed(3)})` : a);
    const rgb = h => (h.startsWith('#') ? `rgb(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)})` : h);
    ground.addColorStop(0, ga(rgb(g0))); ground.addColorStop(0.12, ga(rgb(mixHex(g0, g1, 0.55)))); ground.addColorStop(0.45, ga(rgb(g1))); ground.addColorStop(1, ga('rgb(5,3,10)'));
    // solid runs of floor (gaps and flip zones break it)
    const runs = [];
    let run = null;
    for (const x of top) {
      if (isSolid(course, x)) { if (!run) runs.push(run = []); run.push(x); } else run = null;
    }
    const bottom = Math.max(H + 20, sy(f.camY) + H * 2);
    const surface = (r, d, amp) => { r.forEach((x, k) => { const yy = sy(floorAt(course, x) - d - (amp ? amp * vnoise(x * 0.07, d * 13) : 0)); if (k) ctx.lineTo(sx(x), yy); else ctx.moveTo(sx(x), yy); }); };
    for (const r of runs) {
      ctx.beginPath();
      surface(r, 0, 0);
      ctx.lineTo(sx(r[r.length - 1]), bottom); ctx.lineTo(sx(r[0]), bottom);
      ctx.closePath();
      ctx.fillStyle = ground; ctx.fill();
    }
    // thin strata catching the light (fewer on the lower tiers)
    ctx.lineWidth = 1;
    for (const [d, amp, a] of [[1.3, 0.6, 0.26], [2.6, 1.4, 0.18], [4.6, 2, 0.11], [7.5, 3, 0.08]].slice(0, [1, 2, 4][tier])) {
      ctx.strokeStyle = hexA(sA.rim, a);
      for (const r of runs) { ctx.beginPath(); surface(r, d, amp); ctx.stroke(); }
    }
    // bounce light on the face just under the line
    ctx.lineWidth = 9; ctx.strokeStyle = hexA(sA.glow, 0.13);
    ctx.save(); ctx.translate(0, 5);
    for (const r of runs) { ctx.beginPath(); surface(r, 0, 0); ctx.stroke(); }
    ctx.restore();
    const track = style('track'), glow = style('glow');
    // ---- the track: a line of light (glow passes on the higher tiers) with a white-hot core
    const passes = [[20, 0.06], [8, 0.2], [2.6, 1]].slice(3 - T.glowPasses);
    ctx.lineCap = 'round';
    for (const [w, a] of passes) {
      ctx.lineWidth = w;
      ctx.strokeStyle = a < 1 ? hexA(sA.glow, a) : track;
      for (const r of runs) { ctx.beginPath(); surface(r, 0, 0); ctx.stroke(); }
    }
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    for (const r of runs) { ctx.beginPath(); surface(r, 0, 0); ctx.stroke(); }
    // crumbling tiles: the cracks, and tiles that have given way (for the local rider) dropping
    drawCrumbles(f, sx, sy, track);
    // gravity-flip zones: the ceiling track, an arch at the entry
    drawFlips(f, sx, sy, track, glow);
    // gap lips
    for (let i = firstAfter(course.hz.gaps, x0, 'x0'); i < course.hz.gaps.length && course.hz.gaps[i].x0 < x1; i++) {
      const gp = course.hz.gaps[i];
      for (const ex of [gp.x0, gp.x1]) {
        const ey = floorAt(course, ex);
        const g = ctx.createRadialGradient(sx(ex), sy(ey), 0, sx(ex), sy(ey), 22);
        g.addColorStop(0, hexA('#ffffff', 0.8)); g.addColorStop(0.25, hexA(sA.glow, 0.5)); g.addColorStop(1, hexA(sA.glow, 0));
        ctx.fillStyle = g; ctx.fillRect(sx(ex) - 22, sy(ey) - 22, 44, 44);
      }
    }
    drawZaps(f, sx, sy);
    drawLasers(f, sx, sy);
    drawRings(f, sx, sy);
    // ---- riders: ghosts first, then you
    tags.length = 0;
    for (const r of f.riders) if (r.ghost) drawOne(r, f, sx, sy, T);
    for (const r of f.riders) if (!r.ghost) drawOne(r, f, sx, sy, T);
    // ---- particles + flashes
    stepParticles(f, sx, sy);
    ctx.restore();
    if (T.speedLines && !f.reduced) speedLines(f, T);
  }

  // ------------------------------------------------------------------ silhouette layers
  // Each silhouette layer is painted once into an image strip 1.6 screens wide and slid across the screen; it is
  // repainted only when it has scrolled past its edge (every few seconds at most) or the screen size changes.
  // Per frame a layer costs one drawImage + one rect (repainting every hill as a gradient path each frame was
  // pure fill-rate, and the far layers barely move).
  const tiles = new Map();
  function drawLayer(b, L, f, st, alpha, yH, Hm) {
    const color = st.layers[L];
    const par = [0.08, 0.2, 0.38][L];
    const baseY = lerp(f.ay, yH, [0.2, 0.4, 0.65][L]) + Hm * [-0.02, 0.03, 0.09][L];
    const amp = Hm * [0.34, 0.26, 0.18][L];
    const off = f.camX * f.scale * par;
    const key = `${b.id}:${b.variant}:${L}`;
    const top = amp * 1.25 + 8, depth = Hm * 0.35;
    const TW = Math.ceil(W * 1.6), TH = Math.ceil(top + depth);
    const td = Math.min(dpr, 1.5);
    let t = tiles.get(key);
    if (!t || t.W !== W || t.Hm !== Hm || t.td !== td || off < t.x0 || off + W > t.x0 + TW) {
      if (!t) { t = { cv: document.createElement('canvas') }; tiles.set(key, t); }
      Object.assign(t, { W, Hm, td, x0: off - W * 0.3 });
      t.cv.width = Math.ceil(TW * td); t.cv.height = Math.ceil(TH * td);
      const c = t.cv.getContext('2d');
      c.setTransform(td, 0, 0, td, 0, 0);
      c.clearRect(0, 0, TW, TH);
      paintLayer(c, b, L, st, Hm, top, t.x0, TW, TH, amp);
    }
    // keep only the strips of the biomes on screen (memory)
    if (tiles.size > 6) for (const k of tiles.keys()) if (!k.startsWith(`${b.id}:`) && tiles.size > 6) { tiles.get(k).cv.width = 0; tiles.delete(k); }
    ctx.globalAlpha = alpha;
    if (b.id === 'space' && L === 0) drawPlanet(st, color, baseY - amp * 1.5, off, Hm);
    ctx.drawImage(t.cv, t.x0 - off, baseY - top, TW, TH);
    // below the strip: the layer's own colour, as deep as the view needs (turned over: the whole screen)
    const foot = f.flip < 0.999 ? Math.max(H, 2 * f.ay) + H * 0.25 : H + 10;
    ctx.fillStyle = color;
    ctx.fillRect(0, baseY + depth - 1, W, Math.max(0, foot - (baseY + depth - 1)));
    ctx.globalAlpha = 1;
  }

  function drawPlanet(st, color, py, off, Hm) {
    const R = Hm * 0.16;
    const pxp = W * 0.78 - ((off * 0.4) % (W * 2.4));
    if (pxp < -R * 2 || pxp > W + R * 2) return;
    const g = ctx.createRadialGradient(pxp - R * 0.4, py - R * 0.4, R * 0.1, pxp, py, R);
    g.addColorStop(0, '#e8f0ff'); g.addColorStop(0.55, mixHex(st.rim, color, 0.4)); g.addColorStop(1, color);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(pxp, py, R, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = hexA(st.rim, 0.45); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(pxp, py, R * 1.8, R * 0.32, -0.25, 0, Math.PI * 2); ctx.stroke();
  }

  // paints a strip: x in [0, TW) is the layer at absolute offset x0 + x; the baseline sits at y = baseY
  function paintLayer(c, b, L, st, Hm, baseY, x0, TW, TH, amp) {
    const color = st.layers[L];
    const kind = b.id;
    const seed = L * 1000 + b.variant * 77 + seedN;
    const wid = [300, 220, 160][L];
    const pts = [];
    const sStep = (kind === 'crystal' || kind === 'storm' || kind === 'city') ? 3 : 8;
    for (let px = -sStep; px <= TW + sStep; px += sStep) {
      const u = (px + x0) / wid;
      let hgt;
      if (kind === 'dunes') hgt = 0.42 + 0.3 * Math.sin(u * 1.1 + seed) + 0.28 * vnoise(u * 0.7, seed) + 0.05 * Math.sin(u * 6 + seed);
      else if (kind === 'crystal') { const cell = Math.floor(u * 2.4), fr = u * 2.4 - cell; const pk = 0.25 + 0.85 * hash(cell * 97 + seed); const sk = (hash(cell * 31 + seed) - 0.5) * 0.4; hgt = pk * Math.max(0, 1 - Math.abs(fr - 0.5 - sk) * 2.2) + 0.12 * vnoise(u * 2, seed); }
      else if (kind === 'storm') hgt = 0.22 + 0.7 * Math.pow(Math.abs(vnoise(u * 1.2, seed) - 0.5) * 2, 0.8) + 0.18 * vnoise(u * 6, seed + 3);
      else if (kind === 'city') { const cell = Math.floor(u * 3.2), on = hash(cell * 53 + seed) > 0.3; hgt = on ? 0.3 + 0.75 * hash(cell * 131 + seed) : 0.08 + 0.08 * vnoise(u * 3, seed); if (on && hash(cell * 7 + seed) > 0.8) { const fr = u * 3.2 - cell; if (fr > 0.45 && fr < 0.55) hgt += 0.2; } }
      else hgt = 0.12 + 0.18 * vnoise(u * 0.6, seed) + 0.06 * vnoise(u * 3, seed + 1);
      pts.push(px, baseY - hgt * amp);
    }
    c.beginPath();
    c.moveTo(pts[0], TH + 2);
    for (let k = 0; k < pts.length; k += 2) c.lineTo(pts[k], pts[k + 1]);
    c.lineTo(pts[pts.length - 2], TH + 2);
    c.closePath();
    // body: lit from the sky above, haze at its feet, then its own colour
    const hzA = (0.1 + 0.04 * (2 - L)) * ({ dunes: 1, crystal: 0.8, city: 0.7, storm: 0.3, space: 0.35 }[kind] ?? 1);
    const gr = c.createLinearGradient(0, baseY - amp, 0, TH);
    gr.addColorStop(0, mixHex(color, st.rim, 0.18 - L * 0.04)); gr.addColorStop(0.55, color);
    gr.addColorStop(0.82, mixHex(color, st.glow, hzA * 1.6)); gr.addColorStop(1, color);
    c.fillStyle = gr;
    c.fill();
    if (kind === 'crystal') {
      c.fillStyle = hexA(st.rim, 0.1 + 0.04 * (2 - L));
      const c0 = Math.floor((x0 - 40) / wid * 2.4), c1 = Math.ceil((x0 + TW + 40) / wid * 2.4);
      for (let cell = c0; cell <= c1; cell++) {
        const pk = 0.25 + 0.85 * hash(cell * 97 + seed), sk = (hash(cell * 31 + seed) - 0.5) * 0.4;
        const px = (cell + 0.5 + sk) / 2.4 * wid - x0, half = 0.5 / 2.2 / 2.4 * wid * 2;
        c.beginPath(); c.moveTo(px, baseY - pk * amp); c.lineTo(px - half * 0.95, baseY); c.lineTo(px - half * 0.15, baseY); c.closePath(); c.fill();
      }
    }
    // a rim of light along the top
    c.beginPath();
    for (let k = 0; k < pts.length; k += 2) { if (k) c.lineTo(pts[k], pts[k + 1]); else c.moveTo(pts[k], pts[k + 1]); }
    c.lineWidth = 1.2; c.strokeStyle = hexA(st.rim, 0.22 + 0.12 * (2 - L));
    c.stroke();
    // lit windows on the city's towers
    if (kind === 'city' && L > 0) {
      c.fillStyle = L === 2 ? 'rgba(255,214,150,0.6)' : 'rgba(170,200,255,0.45)';
      for (let px = -((x0 % 5) + 5) % 5; px < TW; px += 5) {
        const u = (px + x0) / wid;
        const cell = Math.floor(u * 3.2);
        if (hash(cell * 53 + seed) <= 0.3) continue;
        const hgt = 0.3 + 0.75 * hash(cell * 131 + seed);
        const topY = baseY - hgt * amp;
        const col = Math.round(px + x0);
        for (let yy = topY + 6; yy < TH; yy += 6) if (hash(col * 7 + Math.floor((yy - baseY) / 6) * 13 + seed) < 0.16) c.fillRect(px, yy, 1.6, 2.2);
      }
    }
  }

  function drawEvents(f, bi) {
    for (let i = firstAfter(events, f.camX - 400); i < events.length && events[i].x < f.camX + 500; i++) {
      const e = events[i];
      const k = (f.camX - e.x + 400) / 900;           // 0..1 as the rider passes
      if (k < 0 || k > 1) continue;
      const a = Math.sin(k * Math.PI);
      if (e.kind === 'birds' && bi.a.id !== 'space') {
        // a flock of light-birds gliding across
        for (let j = 0; j < 9; j++) {
          const bx = W * (1.1 - k * 1.3) + (j % 3) * 14 + Math.floor(j / 3) * 9, by = H * e.y + Math.abs((j % 3) - 1) * 8 + Math.floor(j / 3) * 12 + Math.sin(f.t * 3 + j) * 2;
          const wing = Math.sin(f.t * 8 + j) * 3;
          ctx.strokeStyle = `rgba(255,240,220,${0.75 * a})`; ctx.lineWidth = 1.3;
          ctx.beginPath(); ctx.moveTo(bx - 5, by - wing); ctx.lineTo(bx, by); ctx.lineTo(bx + 5, by - wing); ctx.stroke();
        }
      } else if (e.kind === 'meteors' && (bi.a.id === 'space' || bi.a.id === 'dunes' || bi.a.id === 'crystal')) {
        for (let j = 0; j < 5; j++) {
          const ph = (f.t * 0.6 + j * 0.37 + i) % 1.6;
          if (ph > 1) continue;
          const mx = W * (0.2 + 0.7 * hash(j * 11 + i)) + ph * 140, my = H * (0.05 + 0.2 * hash(j * 7 + i)) + ph * 90;
          const g = ctx.createLinearGradient(mx - 60, my - 38, mx, my);
          g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(255,255,255,${0.8 * a * (1 - ph)})`);
          ctx.strokeStyle = g; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(mx - 60, my - 38); ctx.lineTo(mx, my); ctx.stroke();
        }
      } else if (e.kind === 'airship' && bi.a.id !== 'space') {
        const sc = Math.min(W, H) / 400;
        const ax = W * (1.15 - k * 1.4), ay = H * e.y * 0.8 + Math.sin(f.t * 0.6) * 3;
        const L2 = 54 * sc, R2 = 14 * sc;
        ctx.save();
        ctx.globalAlpha = 0.9 * a;
        ctx.translate(ax, ay);
        // fins
        ctx.fillStyle = '#100c24';
        ctx.beginPath(); ctx.moveTo(L2 * 0.7, -R2 * 0.2); ctx.lineTo(L2 * 1.12, -R2 * 1.25); ctx.lineTo(L2 * 1.02, 0); ctx.lineTo(L2 * 1.12, R2 * 1.25); ctx.lineTo(L2 * 0.7, R2 * 0.2); ctx.closePath(); ctx.fill();
        // envelope
        const eg = ctx.createLinearGradient(0, -R2, 0, R2);
        eg.addColorStop(0, '#3a2f5a'); eg.addColorStop(0.35, '#1a1534'); eg.addColorStop(1, '#0a0818');
        ctx.fillStyle = eg;
        ctx.beginPath(); ctx.ellipse(0, 0, L2, R2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,214,170,0.35)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(0, 0, L2, R2, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
        for (const q of [-0.5, 0, 0.5]) { ctx.beginPath(); ctx.ellipse(q * L2 * 0.9, 0, L2 * 0.04, R2 * 0.96, 0, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.stroke(); }
        // gondola + windows
        ctx.fillStyle = '#0c0a1e';
        ctx.beginPath(); ctx.roundRect(-L2 * 0.28, R2 * 0.8, L2 * 0.56, R2 * 0.6, 3 * sc); ctx.fill();
        ctx.fillStyle = 'rgba(255,200,140,0.95)';
        for (let j = -3; j <= 3; j++) ctx.fillRect(j * L2 * 0.07 - sc, R2 * 0.98, 2 * sc, 2.2 * sc);
        // a soft lamp under it + the blinking nav light
        const lg = ctx.createRadialGradient(0, R2 * 1.4, 0, 0, R2 * 1.4, R2 * 3);
        lg.addColorStop(0, 'rgba(255,190,130,0.22)'); lg.addColorStop(1, 'rgba(255,190,130,0)');
        ctx.fillStyle = lg; ctx.fillRect(-R2 * 3, R2 * 0.2, R2 * 6, R2 * 4);
        ctx.fillStyle = (Math.floor(f.t * 1.6) % 2) ? '#ff4060' : 'rgba(255,255,255,0.9)';
        ctx.beginPath(); ctx.arc(-L2, 0, 1.6 * sc, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }
  }

  function drawBolt(f) {
    const seed = Math.floor(f.boltSeed || 1);
    let x = W * (0.25 + 0.5 * hash(seed)), y = 0;
    ctx.strokeStyle = `rgba(230,240,255,${0.9 * f.flash})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let i = 1; i < 12; i++) { x += (hash(seed * 13 + i) - 0.5) * 40; y += H * 0.045; ctx.lineTo(x, y); }
    ctx.stroke();
  }

  // ------------------------------------------------------------------ hazards
  function drawLasers(f, sx, sy) {
    const L = course.hz.lasers;
    const x0 = f.camX - f.ax / f.scale, x1 = f.camX + (W - f.ax) / f.scale;
    for (let i = firstAfter(L, x0 - 2); i < L.length && L[i].x < x1 + 2; i++) {
      const l = L[i];
      const X = sx(l.x), lo = sy(l.lo), hi = sy(l.hi), gr = sy(l.ground);
      const lowOn = laserOn(l, f.t);
      const pulse = 0.8 + 0.2 * Math.sin(f.t * 30 + i);
      // posts
      ctx.fillStyle = '#0a0b18';
      ctx.fillRect(X - 3, gr - 2, 6, 6);
      // beams: the low one (ground -> lo) and the high one (hi -> sky)
      const beam = (ya, yb, on) => {
        if (!on) {
          ctx.setLineDash([4, 7]); ctx.strokeStyle = 'rgba(255,80,120,0.35)'; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(X, ya); ctx.lineTo(X, yb); ctx.stroke(); ctx.setLineDash([]); return;
        }
        ctx.strokeStyle = `rgba(255,40,100,${0.22 * pulse})`; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(X, ya); ctx.lineTo(X, yb); ctx.stroke();
        ctx.strokeStyle = `rgba(255,90,140,${0.6 * pulse})`; ctx.lineWidth = 4; ctx.stroke();
        ctx.strokeStyle = '#fff2f6'; ctx.lineWidth = 1.5; ctx.stroke();
      };
      beam(gr, lo, lowOn);
      beam(hi, hi - 2000, true);
      // the opening, framed
      ctx.strokeStyle = 'rgba(255,200,220,0.85)'; ctx.lineWidth = 2;
      for (const yy of [lo, hi]) { ctx.beginPath(); ctx.moveTo(X - 7, yy); ctx.lineTo(X + 7, yy); ctx.stroke(); }
    }
  }

  function drawZaps(f, sx, sy) {
    const Z = course.hz.zaps;
    const x0 = f.camX - f.ax / f.scale, x1 = f.camX + (W - f.ax) / f.scale;
    for (let i = Math.max(0, firstAfter(Z, x0, 'x0') - 1); i < Z.length && Z[i].x0 < x1; i++) {
      const z = Z[i];
      const a = Math.max(z.x0, x0), b = Math.min(z.x1, x1);
      if (b <= a) continue;
      // the zap line: a crackling electric ceiling (jitters every frame), a soft field above it
      const pts = [];
      const raw = [];
      for (let x = a - 3; x <= b + 3; x += 1) raw.push([x, zapLine(course, z, x)]);
      for (let pass = 0; pass < 3; pass++) for (let k = 1; k < raw.length - 1; k++) raw[k][1] = (raw[k - 1][1] + raw[k][1] * 2 + raw[k + 1][1]) / 4;
      for (const [x, yy] of raw) if (x >= a && x <= b) pts.push([sx(x), sy(yy) + Math.sin(x * 2.3 + f.t * 40) * 0.8 + (Math.random() - 0.5) * 1.2]);
      if (pts.length < 2) continue;
      // the ceiling itself: a dark slab above the electric line (in a turned-over view it extends the other way)
      const lid = -Math.max(H, 2 * f.ay) * 1.2;
      let minY = Infinity; for (const p of pts) minY = Math.min(minY, p[1]);
      const slab = ctx.createLinearGradient(0, minY, 0, minY - 140);
      slab.addColorStop(0, 'rgba(14,18,40,0.88)'); slab.addColorStop(1, 'rgba(10,12,28,0.7)');
      ctx.fillStyle = slab;
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts) ctx.lineTo(p[0], p[1]); ctx.lineTo(pts.at(-1)[0], lid); ctx.lineTo(pts[0][0], lid); ctx.closePath(); ctx.fill();
      // a soft charge glowing just under it
      const under = ctx.createLinearGradient(0, minY, 0, minY + 26);
      under.addColorStop(0, 'rgba(120,220,255,0.16)'); under.addColorStop(1, 'rgba(120,220,255,0)');
      ctx.fillStyle = under;
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts) ctx.lineTo(p[0], p[1]); for (let k = pts.length - 1; k >= 0; k--) ctx.lineTo(pts[k][0], pts[k][1] + 26); ctx.closePath(); ctx.fill();
      for (const [w, c] of [[8, 'rgba(90,200,255,0.18)'], [2.5, 'rgba(160,235,255,0.75)'], [1, '#ffffff']]) {
        ctx.lineWidth = w; ctx.strokeStyle = c;
        ctx.beginPath(); pts.forEach((p, k) => (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
      }
      // emitters at both ends
      for (const ex of [z.x0, z.x1]) if (ex >= x0 && ex <= x1) {
        const ey = sy(zapLine(course, z, ex));
        ctx.fillStyle = '#0a0b18'; ctx.fillRect(sx(ex) - 4, ey - 4, 8, 8);
        ctx.fillStyle = 'rgba(160,235,255,0.9)'; ctx.fillRect(sx(ex) - 1.5, ey - 1.5, 3, 3);
      }
    }
  }

  function drawCrumbles(f, sx, sy, track) {
    const T2 = course.hz.crumbleTiles;
    const x0 = f.camX - f.ax / f.scale, x1 = f.camX + (W - f.ax) / f.scale;
    const touched = f.touched || [];
    for (let i = Math.max(0, firstAfter(T2, x0, 'x0') - 1); i < T2.length && T2[i].x0 < x1; i++) {
      const tl = T2[i];
      const tt = touched.find(e => e[0] === tl.id);
      const since = tt ? f.t - tt[1] : -1;
      const gone = tt && since > tl.delay;
      const midX = (tl.x0 + tl.x1) / 2;
      // a seam at each joint
      ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx(tl.x0), sy(floorAt(course, tl.x0)) - 3); ctx.lineTo(sx(tl.x0), sy(floorAt(course, tl.x0)) + 6); ctx.stroke();
      // cracks (more as it's about to go), a shake, then the slab falls away
      const shake = tt && !gone ? Math.sin(f.t * 70 + i) * 1.2 : 0;
      if (gone) {
        const fall = Math.min(40, (since - tl.delay) * (since - tl.delay) * 30);
        ctx.globalAlpha = Math.max(0, 1 - (since - tl.delay) * 1.5);
        ctx.fillStyle = '#1a1424';
        ctx.beginPath();
        ctx.moveTo(sx(tl.x0), sy(floorAt(course, tl.x0) - fall));
        ctx.lineTo(sx(tl.x1), sy(floorAt(course, tl.x1) - fall));
        ctx.lineTo(sx(tl.x1), sy(floorAt(course, tl.x1) - fall - 1.2));
        ctx.lineTo(sx(tl.x0), sy(floorAt(course, tl.x0) - fall - 1.2));
        ctx.fill();
        ctx.globalAlpha = 1;
        // the hole it leaves: cover the lit track there
        ctx.strokeStyle = '#05040c'; ctx.lineWidth = 16;
        ctx.beginPath(); ctx.moveTo(sx(tl.x0), sy(floorAt(course, tl.x0))); ctx.lineTo(sx(midX), sy(floorAt(course, midX))); ctx.lineTo(sx(tl.x1), sy(floorAt(course, tl.x1))); ctx.stroke();
      } else {
        ctx.strokeStyle = `rgba(255,200,160,${tt ? 0.9 : 0.45})`; ctx.lineWidth = 1;
        const cx = sx(midX) + shake, cy = sy(floorAt(course, midX));
        ctx.beginPath(); ctx.moveTo(cx - 5, cy + 1); ctx.lineTo(cx, cy + 6); ctx.lineTo(cx + 4, cy + 2); ctx.lineTo(cx + 7, cy + 9); ctx.stroke();
      }
    }
    void track;
  }

  function drawFlips(f, sx, sy, track, glow) {
    const F = course.hz.flips;
    const x0 = f.camX - f.ax / f.scale, x1 = f.camX + (W - f.ax) / f.scale;
    for (let i = Math.max(0, firstAfter(F, x0, 'x0') - 1); i < F.length && F[i].x0 < x1 + 60; i++) {
      const z = F[i];
      // the ceiling track
      const a = Math.max(z.x0, x0), b = Math.min(z.x1, x1);
      if (b > a) {
        for (const [w, al] of [[14, 0.1], [6, 0.25], [2.2, 1]]) {
          ctx.lineWidth = w; ctx.strokeStyle = al < 1 ? hexA('#c8a0ff', al) : '#f0e6ff';
          ctx.beginPath();
          for (let x = a; x <= b; x += 1) { const y = sy(ceilAt(course, x)); x === a ? ctx.moveTo(sx(x), y) : ctx.lineTo(sx(x), y); }
          ctx.stroke();
        }
        // the ceiling's mass above it
        ctx.fillStyle = 'rgba(20,10,40,0.85)';
        ctx.beginPath(); ctx.moveTo(sx(a), sy(ceilAt(course, a)) - 600);
        for (let x = a; x <= b; x += 2) ctx.lineTo(sx(x), sy(ceilAt(course, x)));
        ctx.lineTo(sx(b), sy(ceilAt(course, b)) - 600); ctx.closePath(); ctx.fill();
      }
      // the arch at the entry: a ring of light with turning arrows (seen well ahead)
      if (z.x0 > x0 - 10 && z.x0 < x1 + 10) {
        const X = sx(z.x0), Yb = sy(floorAt(course, z.x0 - 3)), Yt = sy(z.cy);
        const midY = (Yb + Yt) / 2, rad = Math.abs(Yb - Yt) / 2;
        ctx.strokeStyle = hexA('#c8a0ff', 0.25); ctx.lineWidth = 14; ctx.beginPath(); ctx.ellipse(X, midY, rad * 0.32, rad, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = '#f0e6ff'; ctx.lineWidth = 2; ctx.stroke();
        for (let k = 0; k < 4; k++) {
          const ph = ((f.t * 0.8 + k / 4) % 1);
          const ay = Yb - ph * (Yb - Yt);
          ctx.fillStyle = hexA('#f0e6ff', Math.sin(ph * Math.PI));
          ctx.beginPath(); ctx.moveTo(X - 6, ay + 5); ctx.lineTo(X, ay - 4); ctx.lineTo(X + 6, ay + 5); ctx.closePath(); ctx.fill();
        }
      }
    }
    void track; void glow;
  }

  function drawRings(f, sx, sy) {
    const R = course.hz.rings;
    const x0 = f.camX - f.ax / f.scale, x1 = f.camX + (W - f.ax) / f.scale;
    const taken = f.ringsTaken || new Set();
    for (let i = firstAfter(R, x0 - 3); i < R.length && R[i].x < x1 + 3; i++) {
      const r = R[i];
      if (taken.has(r.id)) continue;
      const X = sx(r.x), Y = sy(r.y), rad = r.r * f.scale;
      const spin = Math.sin(f.t * 2 + i) * 0.25 + 0.4;
      ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(255,210,110,0.22)';
      ctx.beginPath(); ctx.ellipse(X, Y, rad * spin, rad, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 2.2; ctx.strokeStyle = '#ffe9b0'; ctx.stroke();
    }
  }

  // ------------------------------------------------------------------ riders
  function drawOne(r, f, sx, sy, T) {
    if (r.st === 'out') return;
    const X = sx(r.x), Y = sy(r.y);
    if (X < -80 || X > W + 80) return;
    // drawn a little larger than the world scale (never under ~24 px per metre): visual only, the hitbox is fixed
    const s = Math.max(f.scale * 1.2, 24);
    const up = r.g < 0 ? -1 : 1;
    if (r.pts && r.pts.length > 1) drawTrail(r, f, sx, sy, T);
    // LAST RIDERS: both remaining riders carry a soft halo
    if (r.hl) {
      const R = 2.2 * s;
      const g = ctx.createRadialGradient(X, Y - R * 0.3 * up, 0, X, Y - R * 0.3 * up, R);
      g.addColorStop(0, hexA(r.color, 0.38)); g.addColorStop(1, hexA(r.color, 0));
      ctx.fillStyle = g; ctx.fillRect(X - R, Y - R * 1.3, R * 2, R * 2.6);
    }
    const alpha = r.ghost ? (r.hl ? 0.8 : 0.5) : (r.inv > 0 ? 0.55 + 0.45 * Math.abs(Math.sin(f.t * 14)) : 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(X, Y);
    // the rider sits on the surface: in a flip zone its "down" is up the screen (the frame mirror undoes it)
    ctx.rotate(-r.a);
    ctx.scale(s, -s * up);
    drawRider(ctx, { ride: r.ride, color: r.color, crouch: r.crouch, tuck: r.tuck, t: f.t, ghost: r.ghost, px: 1 / s });
    ctx.restore();
    // invulnerable: a soft shimmer ring
    if (r.inv > 0 && !r.ghost) {
      ctx.strokeStyle = hexA(r.color, 0.35 + 0.25 * Math.sin(f.t * 10)); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(X, Y - 0.9 * s * up, 1.35 * s, 0, Math.PI * 2); ctx.stroke();
    }
    // name tags on ghosts (not right on top of the rider you follow, never two on top of each other)
    if (r.ghost && r.name && Math.abs(r.x - f.camX) > 4.5) {
      const ty = Y - 2.45 * s * up;
      if (tags.some(([a, b]) => Math.abs(a - X) < 46 && Math.abs(b - ty) < 13)) return;
      tags.push([X, ty]);
      ctx.save();
      ctx.translate(X, ty);
      if (f.flip < 0) ctx.scale(1, -1);
      ctx.font = '700 10px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(6,6,18,0.55)'; ctx.strokeText(r.name, 0, 0);
      ctx.fillStyle = hexA(r.color, 0.95);
      ctx.fillText(r.name, 0, 0);
      ctx.restore();
    }
  }

  function drawTrail(r, f, sx, sy, T) {
    const pts = r.pts;
    const n = pts.length;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const off = 0.35;                              // the trail rides a little above the surface
    if (r.trail === 'ribbon') {
      const P = pts.map(p => [sx(p[0]), sy(p[1] + off * p[2])]);
      const wMax = Math.max(4, Math.min(11, f.scale * 0.55));
      const L = [], R = [];
      for (let i = 0; i < n; i++) {
        const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)];
        let nx = -(b[1] - a[1]), ny = b[0] - a[0];
        const len = Math.hypot(nx, ny) || 1; nx /= len; ny /= len;
        const w = wMax * Math.pow(i / (n - 1), 1.4) * 0.5;
        L.push([P[i][0] + nx * w, P[i][1] + ny * w]); R.push([P[i][0] - nx * w, P[i][1] - ny * w]);
      }
      const gr = ctx.createLinearGradient(P[0][0], P[0][1], P[n - 1][0], P[n - 1][1]);
      gr.addColorStop(0, hexA(r.color, 0)); gr.addColorStop(0.7, hexA(r.color, r.ghost ? 0.25 : 0.5)); gr.addColorStop(1, hexA(r.color, r.ghost ? 0.4 : 0.85));
      ctx.fillStyle = gr;
      ctx.beginPath();
      L.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      for (let i = n - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
      ctx.closePath(); ctx.fill();
      // a bright core line
      ctx.beginPath(); P.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.lineWidth = 1.2; ctx.strokeStyle = hexA('#ffffff', r.ghost ? 0.25 : 0.5); ctx.stroke();
    } else if (r.trail === 'sparks') {
      for (let i = 0; i < n; i++) {
        const k = i / n;
        for (let j = 0; j < 2; j++) {
          const jx = Math.sin(f.t * 9 + i * 2.7 + j * 1.3) * 4, jy = Math.cos(f.t * 7 + i * 1.9 + j) * 4 * (1 - k) + (1 - k) * 8;
          ctx.fillStyle = hexA(j ? r.color : '#ffffff', (r.ghost ? 0.4 : 0.85) * k);
          ctx.fillRect(sx(pts[i][0]) + jx, sy(pts[i][1] + off * pts[i][2]) + jy, 2.2, 2.2);
        }
      }
    } else {
      // a light wall standing up from the path (Tron)
      const hgt = 1.1 * f.scale;
      for (let i = 1; i < n; i++) {
        const k = i / n;
        const ax = sx(pts[i - 1][0]), ay = sy(pts[i - 1][1]), bx = sx(pts[i][0]), by = sy(pts[i][1]);
        const up = pts[i][2] || 1;
        const g = ctx.createLinearGradient(0, by - hgt * up, 0, by);
        g.addColorStop(0, hexA(r.color, 0)); g.addColorStop(1, hexA(r.color, (r.ghost ? 0.25 : 0.45) * k));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(bx, by - hgt * up); ctx.lineTo(ax, ay - hgt * up); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = hexA('#ffffff', 0.4 * k); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(ax, ay - hgt * up); ctx.lineTo(bx, by - hgt * up); ctx.stroke();
      }
    }
    ctx.restore();
    void T;
  }

  // ------------------------------------------------------------------ particles + effects
  function burst(x, y, color, { n = 24, speed = 9, life = 0.8, up = 1, size = 2.4, shards = false } = {}) {
    const cap = TIER[tier].particles;
    for (let i = 0; i < n; i++) {
      if (parts.length >= cap) parts.shift();
      const a = Math.random() * Math.PI * 2;
      const sp = speed * (0.35 + Math.random() * 0.8);
      parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.abs(Math.sin(a)) * sp * up + Math.sin(a) * sp * (1 - up), life, max: life, color, size: size * (0.6 + Math.random() * 0.8), shards, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 10 });
    }
  }
  function flash(x, y, color, rad = 5, ms = 380) { flashes.push({ x, y, color, rad, t0: performance.now(), ms }); if (flashes.length > 8) flashes.shift(); }
  let lastT = 0;
  function stepParticles(f, sx, sy) {
    const now = performance.now();
    const dt = Math.min(0.05, lastT ? (now - lastT) / 1000 : 0.016);
    lastT = now;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = flashes.length - 1; i >= 0; i--) {
      const fl = flashes[i];
      const k = (now - fl.t0) / fl.ms;
      if (k >= 1) { flashes.splice(i, 1); continue; }
      const rad = fl.rad * f.scale * (0.6 + k * 1.2);
      const g = ctx.createRadialGradient(sx(fl.x), sy(fl.y), 0, sx(fl.x), sy(fl.y), rad);
      g.addColorStop(0, hexA('#ffffff', 0.55 * (1 - k))); g.addColorStop(0.3, hexA(fl.color, 0.4 * (1 - k))); g.addColorStop(1, hexA(fl.color, 0));
      ctx.fillStyle = g; ctx.fillRect(sx(fl.x) - rad, sy(fl.y) - rad, rad * 2, rad * 2);
    }
    const next = [];
    for (const p of parts) {
      p.life -= dt;
      if (p.life <= 0) continue;
      p.vy -= 14 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      const k = p.life / p.max;
      ctx.fillStyle = hexA(p.color, 0.9 * k);
      if (p.shards) {
        ctx.save(); ctx.translate(sx(p.x), sy(p.y)); ctx.rotate(p.rot);
        ctx.beginPath(); ctx.moveTo(0, -p.size * 2); ctx.lineTo(p.size * 1.4, p.size); ctx.lineTo(-p.size, p.size * 0.8); ctx.closePath(); ctx.fill();
        ctx.restore();
      } else ctx.fillRect(sx(p.x) - p.size / 2, sy(p.y) - p.size / 2, p.size, p.size);
      next.push(p);
    }
    parts = next;
    ctx.restore();
  }

  const lines = [];
  function speedLines(f, T) {
    const k = Math.max(0, Math.min(1, (f.speed - 26) / 26));
    if (k <= 0.02) return;
    while (lines.length < T.speedLines) lines.push({ x: Math.random() * W, y: Math.random() * H, l: 40 + Math.random() * 90, v: 0.6 + Math.random() * 0.8 });
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const ln of lines) {
      ln.x -= ln.v * f.speed * 0.9;
      if (ln.x + ln.l < 0) { ln.x = W + Math.random() * 80; ln.y = Math.random() * H; }
      const g = ctx.createLinearGradient(ln.x, 0, ln.x + ln.l, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(255,255,255,${0.22 * k})`);
      ctx.strokeStyle = g; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(ln.x, ln.y); ctx.lineTo(ln.x + ln.l, ln.y); ctx.stroke();
    }
    ctx.restore();
  }

  return {
    resize,
    draw,
    burst,
    flash,
    setTier(t) { tier = Math.max(0, Math.min(2, t)); },
    get tier() { return tier; },
    get particles() { return parts.length; },
    get horizon() { return horizon; },
    clear() { parts = []; flashes.length = 0; },
    destroy() { ro.disconnect(); for (const t of tiles.values()) t.cv.width = 0; tiles.clear(); parts = []; },
  };
}
