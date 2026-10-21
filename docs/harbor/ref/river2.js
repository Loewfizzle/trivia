// CITY 2.0 — RIVERFRONT concepts (mockup renderer only, never shipped). A tiny 3D projector + Canvas 2D:
// true perspective reflections (the world drawn again upside down, rippled line by line), dense windows, night / gold / day.
const q = new URLSearchParams(location.search);
const CITY = q.get('city') || 'bend';
const TOD = q.get('tod') || 'night';
const NIGHT = TOD === 'night', GOLD = TOD === 'gold', DAY = TOD === 'day', LIT = NIGHT || GOLD;
const NEONK = NIGHT ? 1 : GOLD ? 0.8 : 0;
const W = innerWidth, H = innerHeight, DPR = +(q.get('dpr') || 3);
const host = document.querySelector('.nd-scene');
host.querySelector('canvas').style.opacity = '0';
const mkC = () => { const c = document.createElement('canvas'); c.width = W * DPR; c.height = H * DPR; const x = c.getContext('2d'); x.scale(DPR, DPR); return [c, x]; };
const [cv, X0] = mkC(); Object.assign(cv.style, { position: 'absolute', inset: '0', width: W + 'px', height: H + 'px' }); host.append(cv);
const [gc, G0] = mkC();
let X = X0, G = G0, FLIP = false;
let seed = 11; const R = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const rs = s => { seed = (Math.abs(Math.round(s)) % 2147483646) + 1; };
const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => { const A = typeof a === 'string' ? hex(a) : a, B = typeof b === 'string' ? hex(b) : b; return A.map((v, i) => Math.round(v + (B[i] - v) * t)); };
const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

// ---------------------------------------------------------------- camera
let VPX = W / 2, VPY = 560, CAMH = 20, F = 600, ZH0 = 200, ZH1 = 900;
const cam = o => { VPY = o.VPY; CAMH = o.CAMH; F = o.F; ZH0 = o.zh0; ZH1 = o.zh1; };
const P = (x, y, z) => [VPX + F * x / z, VPY + F * (CAMH - (FLIP ? -y : y)) / z];
const S = z => F / z;
const fog = z => clamp01((z - ZH0) / (ZH1 - ZH0));
const SUNX = W * 0.8;

// ---------------------------------------------------------------- palettes
const HAZE = NIGHT ? hex('#2a1546') : GOLD ? hex('#e8a27a') : hex('#dce3ec');
const MAT = {
  lime:   { d: ['#d8ccb4', '#f2e4c8', '#a7997f'], n: ['#1c1b38', '#15142c'] },
  cream:  { d: ['#e6dcc6', '#fbefd6', '#b4a78e'], n: ['#1e1c38', '#16152d'] },
  brick:  { d: ['#9a5440', '#c06a4f', '#6a3428'], n: ['#20152a', '#18101f'] },
  red:    { d: ['#83392f', '#a8483a', '#5a2620'], n: ['#1f1326', '#170e1d'] },
  granite:{ d: ['#5d6170', '#7a7f90', '#3c3f4b'], n: ['#15172c', '#0e1021'] },
  slate:  { d: ['#8791a3', '#a7b1c2', '#5f6878'], n: ['#171a33', '#101326'] },
  terra:  { d: ['#d9b98f', '#f0cfa2', '#a88660'], n: ['#221a34', '#19132a'] },
};
const WARM = ['#ffd08a', '#ffe0ae', '#ffc373', '#fff0d0', '#ffb860'], COOL = ['#a9d6ff', '#cfe6ff'], TV = '#7f9cff';
const AUT = ['#2a1210', '#e8902f', '#d4552c', '#f2b640', '#b8341f'];
const NEON = { pink: '#ff3da5', cyan: '#38d6ff', gold: '#ffd27a', violet: '#b77cff', red: '#ff3d6e', orange: '#ff7a3d', mint: '#5dffc0' };

// ---------------------------------------------------------------- helpers
function poly(c, pts, fill) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } }
function glowDot(x, y, r, col, a, c = X) { if (r <= 0) return; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgb(col, a)); g.addColorStop(0.3, rgb(col, a * 0.32)); g.addColorStop(1, rgb(col, 0));
  c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore(); }
function line(c, pts, col, w) { c.beginPath(); c.moveTo(...pts[0]); for (const p of pts.slice(1)) c.lineTo(...p); c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(); }
function neonLine(pts, col, w, k = 1) {   // a neon tube: wide glow in the bloom, a coloured body, a hot core
  if (!LIT) { line(X, pts, 'rgba(255,255,255,0.28)', Math.max(0.5, w * 0.6)); return; }
  k *= NEONK; const c = typeof col === 'string' ? hex(col) : col;
  line(G, pts, rgb(c, 0.85 * k), w * 5); line(X, pts, rgb(c, 0.9 * k), w * 1.5); line(X, pts, rgb(mix(c, [255, 255, 255], 0.7), k), w * 0.55);
}

// ---------------------------------------------------------------- the sky
function skyGrad(c) {
  const g = c.createLinearGradient(0, 0, 0, VPY);
  const stops = NIGHT ? [[0, '#020314'], [0.35, '#080a2a'], [0.6, '#170f40'], [0.8, '#3a1656'], [0.93, '#62215f'], [1, '#86306a']]
    : GOLD ? [[0, '#1b2766'], [0.3, '#433e8c'], [0.52, '#9c557f'], [0.7, '#e47b5e'], [0.86, '#ffb46c'], [1, '#ffd99a']]
    : [[0, '#3c7dd0'], [0.45, '#80b2e6'], [0.75, '#c8def0'], [1, '#efe5d6']];
  for (const [t, col] of stops) g.addColorStop(t, col);
  c.fillStyle = g; c.fillRect(0, -2000, W, VPY + 4000);
}
function sky() {
  skyGrad(X);
  if (NIGHT) {
    rs(3); for (let i = 0; i < 260; i++) { const x = R() * W, y = R() * VPY * 0.78, a = (0.2 + R() * 0.8) * (1 - y / VPY * 0.9), s = R() < 0.08 ? 1.5 : R() < 0.3 ? 1 : 0.7; X.fillStyle = `rgba(255,255,255,${a})`; X.fillRect(x, y, s, s); }
    // the moon, with a halo
    const mx = W * 0.27, my = 372; glowDot(mx, my, 110, [180, 190, 255], 0.22); glowDot(mx, my, 30, [230, 235, 255], 0.35);
    X.fillStyle = '#eef0ff'; X.beginPath(); X.arc(mx, my, 11, 0, 7); X.fill(); X.fillStyle = 'rgba(180,185,210,0.35)'; for (const [dx, dy, r] of [[-3, -2, 2.4], [3, 3, 1.8], [2, -4, 1.2]]) { X.beginPath(); X.arc(mx + dx, my + dy, r, 0, 7); X.fill(); }
    glowDot(W * 0.5, VPY - 10, 360, [190, 50, 150], 0.25);
  } else if (GOLD) {
    glowDot(SUNX, VPY - 34, 300, [255, 170, 90], 0.55); glowDot(SUNX, VPY - 34, 90, [255, 225, 160], 0.7);
    X.fillStyle = '#fff3d6'; X.beginPath(); X.arc(SUNX, VPY - 34, 15, 0, 7); X.fill();
    rs(5); X.save(); X.filter = 'blur(3px)';
    for (let i = 0; i < 9; i++) { const x = R() * W, y = 330 + R() * 160, w = 50 + R() * 140; const g = X.createLinearGradient(x - w, 0, x + w, 0); g.addColorStop(0, 'rgba(255,150,120,0)'); g.addColorStop(0.5, `rgba(255,${150 + R() * 60 | 0},${120 + R() * 40 | 0},0.6)`); g.addColorStop(1, 'rgba(255,150,120,0)'); X.fillStyle = g; X.beginPath(); X.ellipse(x, y, w, 3 + R() * 4, 0, 0, 7); X.fill(); }
    X.restore();
  } else {
    glowDot(W * 0.9, 150, 300, [255, 240, 210], 0.55);
    rs(5);
    for (let i = 0; i < 6; i++) {   // cumulus: grey bases, sunlit tops
      const cx = R() * W, cy = 330 + R() * 150, w = 40 + R() * 70;
      X.save(); X.filter = 'blur(2.5px)';
      for (let k = 0; k < 14; k++) { const px = cx + (R() - 0.5) * w * 1.6, py = cy - R() * w * 0.35, r = w * (0.18 + R() * 0.22);
        const g = X.createRadialGradient(px + r * 0.3, py - r * 0.4, r * 0.1, px, py, r); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.7, 'rgba(235,240,248,0.85)'); g.addColorStop(1, 'rgba(190,205,225,0)'); X.fillStyle = g; X.beginPath(); X.arc(px, py, r, 0, 7); X.fill(); }
      X.fillStyle = 'rgba(170,185,210,0.35)'; X.beginPath(); X.ellipse(cx, cy + w * 0.08, w * 0.85, w * 0.09, 0, 0, 7); X.fill();
      X.restore();
    }
    X.strokeStyle = 'rgba(60,60,80,0.75)'; X.lineWidth = 1.1; X.lineCap = 'round';
    for (const [gx, gy, s2] of [[150, 470, 4], [168, 462, 3.4], [300, 520, 3], [260, 440, 3.6]]) { X.beginPath(); X.moveTo(gx - s2, gy - s2 * 0.4); X.quadraticCurveTo(gx - s2 * 0.4, gy - s2 * 0.8, gx, gy); X.quadraticCurveTo(gx + s2 * 0.4, gy - s2 * 0.8, gx + s2, gy - s2 * 0.4); X.stroke(); }
  }
}


// ---------------------------------------------------------------- DETAIL PASS: material textures, relief, weathering, clutter
const TILES = {};
function tile(mat) {   // a 128 px tile = 4 world units square (brick coursing, stone joints, terracotta panels, mottling)
  if (TILES[mat]) return TILES[mat];
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); let sd = mat.length * 977; const r = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
  x.fillStyle = 'rgb(128,128,128)'; x.fillRect(0, 0, 128, 128);
  if (mat === 'brick' || mat === 'red') {
    const bh = 128 / 22, bw = bh * 2.7;
    for (let row = 0; row < 22; row++) for (let i = -1; i < 128 / bw + 1; i++) { const ox = (row % 2) * bw / 2, v = 100 + r() * 70; x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(i * bw + ox + 0.6, row * bh + 0.6, bw - 1.2, bh - 1.2); }
    x.fillStyle = 'rgba(200,200,200,0.5)'; for (let row = 0; row <= 22; row++) x.fillRect(0, row * bh - 0.4, 128, 0.8);
  } else if (mat === 'glass') {
    for (let i = 0; i < 128; i += 8) { x.fillStyle = 'rgba(90,90,90,0.6)'; x.fillRect(i, 0, 1, 128); }
  } else {   // stone / terracotta: large blocks, faint joints, mottling
    const bh = 128 / 6, bw = 128 / 3;
    for (let row = 0; row < 6; row++) for (let i = -1; i < 4; i++) { const ox = (row % 2) * bw / 2, v = 118 + r() * 24; x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(i * bw + ox, row * bh, bw, bh); }
    x.fillStyle = 'rgba(80,80,80,0.55)'; for (let row = 0; row <= 6; row++) x.fillRect(0, row * bh - 0.35, 128, 0.7);
    for (let row = 0; row < 6; row++) for (let i = -1; i < 4; i++) x.fillRect(i * bw + (row % 2) * bw / 2 - 0.35, row * bh, 0.7, bh);
  }
  for (let i = 0; i < 260; i++) { const v = r() < 0.5 ? 90 : 170; x.fillStyle = `rgba(${v},${v},${v},${0.05 + r() * 0.08})`; x.beginPath(); x.arc(r() * 128, r() * 128, 1 + r() * 6, 0, 7); x.fill(); }
  return (TILES[mat] = c);
}
function faceDetail(b, f, pts) {
  const sc = S(b.z0); if (sc < 1.3 || FLIP && sc < 2) return;
  const [t, bt] = yrange(pts);
  X.save(); poly(X, pts); X.clip();
  // the material's texture, scaled to the building's distance (a tile = 4 world units)
  const pat = X.createPattern(tile(b.mat), 'repeat'); const o = PW(f, 0, 0);
  pat.setTransform(new DOMMatrix().translateSelf(o[0], o[1]).scaleSelf(sc * 4 / 128, sc * 4 / 128));
  const brick = b.mat === 'brick' || b.mat === 'red'; if (brick && sc < 4.5) pat.setTransform(new DOMMatrix().translateSelf(o[0], o[1]).scaleSelf(sc * 16 / 128, sc * 16 / 128));
  X.globalCompositeOperation = 'overlay'; X.globalAlpha = NIGHT ? 0.45 : brick ? (sc < 4.5 ? 0.16 : clamp01((sc - 4.5) / 3) * 0.85) : clamp01((sc - 1.3) / 2) * 0.55; X.fillStyle = pat; X.fillRect(0, t, W, bt - t);
  X.globalCompositeOperation = 'source-over'; X.globalAlpha = 1;
  if (!NIGHT) {
    // relief: pilasters (a lit edge + a shadow edge) on the stone towers, ledges between tiers, a darker foot, ambient occlusion at the corners
    if (b.mat !== 'brick' && b.mat !== 'red' && sc > 1.8) for (let u = 0; u < f.L; u += (b.cw || 2.3) * 2) { const a = quad(f, u, 0, u + 0.18, b.h), d = quad(f, u + 0.18, 0, u + 0.34, b.h); poly(X, a, 'rgba(255,250,235,0.22)'); poly(X, d, 'rgba(40,30,40,0.16)'); }
    for (const v of [b.h - 0.25, ...(b.h > 12 ? [b.h * 0.5] : [])]) { poly(X, quad(f, 0, v, f.L, v + 0.28), 'rgba(255,248,232,0.4)'); poly(X, quad(f, 0, v - 0.45, f.L, v), 'rgba(30,20,30,0.18)'); }
    const g = X.createLinearGradient(0, bt, 0, bt - Math.min(bt - t, sc * 6)); g.addColorStop(0, 'rgba(30,20,30,0.28)'); g.addColorStop(1, 'rgba(30,20,30,0)'); X.fillStyle = g; X.fillRect(0, t, W, bt - t);
    const xs = pts.map(p => p[0]), xl = Math.min(...xs), xr = Math.max(...xs), aw = Math.min(14, (xr - xl) * 0.12);
    const ga = X.createLinearGradient(xl, 0, xl + aw, 0); ga.addColorStop(0, 'rgba(30,20,40,0.22)'); ga.addColorStop(1, 'rgba(30,20,40,0)'); X.fillStyle = ga; X.fillRect(xl, t, aw, bt - t);
    // weathering: soft streaks running down from the window rows
    if (sc > 2.2) { rs(b.z0 * 13 + b.x0); for (let i = 0; i < f.L * 0.6; i++) { const u = R() * f.L, v = 2 + R() * (b.h - 3), p0 = PW(f, u, v), p1 = PW(f, u, v - 2 - R() * 4); X.fillStyle = 'rgba(40,35,40,0.06)'; X.fillRect(p0[0], p0[1], Math.max(0.6, sc * 0.25), p1[1] - p0[1]); } }
  }
  X.restore();
}
function roofClutter(b) {   // vents, AC boxes, antennas, a flag — the things that make a roofline real
  const sc = S(b.z0); if (FLIP || b.crown || sc < 1.8 || b.noClutter) return;
  rs(b.x0 * 91 + b.z0 * 7 + 3); const top = b.y0 + b.h, n = Math.max(1, Math.round((b.x1 - b.x0) / 5));
  const dark = NIGHT ? '#0d0c1a' : GOLD ? '#6a4a5a' : '#8a8478', lite = NIGHT ? '#15142a' : GOLD ? '#c89a88' : '#b8b2a6';
  for (let i = 0; i < n; i++) {
    const x = b.x0 + 0.6 + R() * (b.x1 - b.x0 - 1.2), k = R();
    if (k < 0.45) { const w = 0.8 + R() * 1.2, hh = 0.6 + R() * 0.8; poly(X, [P(x, top, b.z0 + 1), P(x + w, top, b.z0 + 1), P(x + w, top + hh, b.z0 + 1), P(x, top + hh, b.z0 + 1)], dark); poly(X, [P(x, top + hh, b.z0 + 1), P(x + w, top + hh, b.z0 + 1), P(x + w, top + hh - 0.15, b.z0 + 1), P(x, top + hh - 0.15, b.z0 + 1)], lite); }
    else if (k < 0.7) { line(X, [P(x, top, b.z0 + 1.5), P(x, top + 2 + R() * 3, b.z0 + 1.5)], dark, Math.max(0.5, sc * 0.08)); }
    else if (k < 0.85) { const p = P(x, top, b.z0 + 1.2); X.fillStyle = dark; X.beginPath(); X.arc(p[0], p[1], sc * 0.5, Math.PI, 0); X.fill(); }
    else { const p0 = P(x, top, b.z0 + 1), p1 = P(x, top + 3.2, b.z0 + 1); line(X, [p0, p1], dark, Math.max(0.5, sc * 0.08)); if (!NIGHT) { X.fillStyle = ['#c23a3a', '#2f6fb8', '#e8b83a'][(R() * 3) | 0]; X.beginPath(); X.moveTo(p1[0], p1[1]); X.quadraticCurveTo(p1[0] + sc * 0.7, p1[1] + sc * 0.2, p1[0] + sc * 1.3, p1[1] + sc * 0.1); X.lineTo(p1[0] + sc * 1.2, p1[1] + sc * 0.75); X.quadraticCurveTo(p1[0] + sc * 0.6, p1[1] + sc * 0.8, p1[0], p1[1] + sc * 0.6); X.fill(); } }
  }
}

// ---------------------------------------------------------------- buildings
function shade(b, kind, z) {
  const m = MAT[b.mat] || MAT.lime; const f = fog(z);
  if (NIGHT) { const c = kind === 'front' ? m.n[0] : m.n[1]; return mix(c, HAZE, f * 0.6); }
  let c = kind === 'front' ? m.d[0] : kind === 'lit' ? m.d[1] : m.d[2];
  if (GOLD) c = kind === 'lit' ? mix(c, '#ff9a56', 0.42) : kind === 'front' ? mix(mix(c, '#6b4a78', 0.45), '#ffb070', 0.12) : mix(c, '#3c2f5a', 0.55);
  return mix(c, HAZE, f * (GOLD ? 0.6 : 0.72));
}
function faces(b) {
  const out = [];
  if (b.x1 < -0.01) out.push({ kind: 'lit', L: b.z1 - b.z0, Wp: (u, v) => [b.x1, b.y0 + v, b.z0 + u] });
  if (b.x0 > 0.01) out.push({ kind: 'shade', L: b.z1 - b.z0, Wp: (u, v) => [b.x0, b.y0 + v, b.z0 + u] });
  out.push({ kind: 'front', L: b.x1 - b.x0, Wp: (u, v) => [b.x0 + u, b.y0 + v, b.z0] });
  return out;
}
const PW = (f, u, v) => P(...f.Wp(u, v));
const quad = (f, u0, v0, u1, v1) => [PW(f, u0, v0), PW(f, u0, v1), PW(f, u1, v1), PW(f, u1, v0)];
const yrange = pts => [Math.min(...pts.map(p => p[1])), Math.max(...pts.map(p => p[1]))];

function drawBlock(b) {
  b.y0 = b.y0 || 0;
  rs(b.seed || (b.x0 * 131 + b.z0 * 71 + b.h * 31));
  for (const f of faces(b)) {
    const pts = quad(f, 0, 0, f.L, b.h);
    poly(X, pts, rgb(shade(b, f.kind, b.z0)));
    if (!NIGHT) {   // sky light from above, a darker foot
      const [t, bt] = yrange(pts); X.save(); poly(X, pts); X.clip();
      const g = X.createLinearGradient(0, FLIP ? bt : t, 0, FLIP ? t : bt); g.addColorStop(0, 'rgba(255,255,255,0.10)'); g.addColorStop(1, 'rgba(40,30,40,0.18)'); X.fillStyle = g; X.fillRect(0, t, W, bt - t); X.restore();
    } else {        // the city's glow rising on the facades from the street
      const [t, bt] = yrange(pts); X.save(); poly(X, pts); X.clip(); X.globalCompositeOperation = 'lighter';
      const g = X.createLinearGradient(0, FLIP ? t : bt, 0, FLIP ? bt : t); g.addColorStop(0, `rgba(120,40,110,${0.16 * (1 - fog(b.z0) * 0.6)})`); g.addColorStop(0.5, 'rgba(60,20,80,0)'); X.fillStyle = g; X.fillRect(0, t, W, bt - t); X.restore();
    }
    faceDetail(b, f, pts);
    windows(b, f);
    if (b.fire && f.kind === 'front') fireEscape(b, f);
    if (b.store && (f.kind === 'front' || b.storeSide)) storefront(b, f);
  }
  if (b.trim) trim(b);
  if (b.flood) flood(b);
  if (!FLIP) { if (b.crown) crown(b); if (b.water) waterTower(b); roofClutter(b); }
  for (const s of b.signs || []) sign(b, s);
}
function windows(b, f) {
  if (b.noWin) return;
  const fh = b.fh || 3.0, cw = b.cw || 2.3, z = b.z0, sc = S(z);
  if (fh * sc < 1.6) {    // too far: specks of light by night, faint glass by day
    const n = Math.round(f.L * b.h / 5);
    for (let i = 0; i < n; i++) { const p = PW(f, R() * f.L, 1 + R() * (b.h - 2));
      if (LIT && R() < (b.lit ?? 0.6) * (NIGHT ? 0.85 : 0.3)) { const c = hex(R() < 0.85 ? WARM[(R() * 5) | 0] : COOL[0]); X.fillStyle = rgb(c, 0.5 + 0.5 * (1 - fog(z))); X.fillRect(p[0], p[1], 0.8, 0.8); G.fillStyle = rgb(c, 0.32); G.fillRect(p[0] - 0.6, p[1] - 0.6, 2, 2); }
      else if (!NIGHT) { X.fillStyle = GOLD ? 'rgba(255,190,120,0.25)' : 'rgba(40,55,80,0.2)'; X.fillRect(p[0], p[1], 0.7, 1); } }
    return;
  }
  const v0 = b.store ? 4.2 : 0.9;
  const bands = new Set(); for (let i = 0; i < 3; i++) if (R() < 0.35) bands.add((R() * 30) | 0);   // a few fully lit office floors
  let row = 0;
  for (let v = v0; v + fh * 0.7 < b.h - 0.3; v += fh, row++) {
    const band = bands.has(row);
    for (let u = 0.6; u + cw * 0.6 < f.L; u += cw) {
      const pts = quad(f, u + cw * 0.24, v + fh * 0.22, u + cw * 0.76, v + fh * 0.8);
      const litP = (b.lit ?? 0.6) * (NIGHT ? 0.85 : GOLD ? 0.32 : 0);
      if (LIT && (band && NIGHT || R() < litP)) {
        const tv = R() < 0.04, cool = band || R() < 0.12;
        const c = hex(tv ? TV : cool ? COOL[(R() * 2) | 0] : WARM[(R() * 5) | 0]);
        const k = (0.7 + 0.3 * (1 - fog(z))) * (GOLD ? 0.85 : 1);
        poly(X, pts, rgb(c, k));
        if (R() < 0.25) { const [t, bt] = yrange(pts); X.save(); poly(X, pts); X.clip(); X.fillStyle = 'rgba(70,30,40,0.5)'; X.fillRect(0, FLIP ? bt - (bt - t) * 0.35 : t, W, (bt - t) * 0.35); X.restore(); }
        poly(G, pts, rgb(c, 0.38 * k));
      } else if (NIGHT) poly(X, pts, 'rgba(5,5,14,0.9)');
      else {
        const lit = f.kind === 'lit';
        const base = GOLD ? (lit ? mix('#4a3a58', '#ff9a5a', 0.55) : mix('#2a2a48', HAZE, fog(z) * 0.5)) : mix(f.kind === 'shade' ? '#2b3850' : '#3a4c68', HAZE, fog(z) * 0.65);
        poly(X, pts, rgb(base));
        const [t, bt] = yrange(pts); X.save(); poly(X, pts); X.clip();
        const g = X.createLinearGradient(0, FLIP ? bt : t, 0, FLIP ? t : bt);
        g.addColorStop(0, GOLD ? (lit ? 'rgba(255,210,150,0.8)' : 'rgba(255,170,140,0.25)') : lit ? 'rgba(225,238,255,0.75)' : 'rgba(190,212,240,0.45)'); g.addColorStop(0.6, 'rgba(160,190,230,0.08)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        X.fillStyle = g; X.fillRect(0, t, W, bt - t);
        if (sc > 5) { const k = R(), xs = pts.map(p => p[0]), xl = Math.min(...xs), xr = Math.max(...xs);
          if (k < 0.28) { X.fillStyle = GOLD ? 'rgba(170,140,150,0.75)' : 'rgba(150,160,176,0.8)'; X.fillRect(xl, t, xr - xl, (bt - t) * (0.2 + R() * 0.6)); }
          else if (k < 0.38) { X.fillStyle = ['rgba(170,50,60,0.8)', 'rgba(60,110,90,0.8)', 'rgba(200,150,60,0.8)'][(R() * 3) | 0]; X.fillRect(xl, t, (xr - xl) * 0.25, bt - t); X.fillRect(xr - (xr - xl) * 0.25, t, (xr - xl) * 0.25, bt - t); }
          else if (k < 0.43) { X.fillStyle = 'rgba(10,10,20,0.7)'; X.fillRect(xl, t + (bt - t) * 0.5, xr - xl, (bt - t) * 0.5); } }
        X.restore();
        if (sc > 5) { X.strokeStyle = 'rgba(250,246,236,0.55)'; X.lineWidth = Math.max(0.4, sc * 0.05); poly(X, pts); X.stroke(); const sl = quad(f, u + cw * 0.2, v + fh * 0.17, u + cw * 0.8, v + fh * 0.24); poly(X, sl, 'rgba(250,246,236,0.6)'); }
      }
    }
  }
}
function storefront(b, f) {
  for (let u = 0.6; u < f.L - 1.2; u += 4.2) {
    const pts = quad(f, u, 0.3, Math.min(f.L - 0.6, u + 3.4), 3.3);
    if (LIT) { const c = hex(R() < 0.7 ? '#ffcf8f' : '#ffe9c4'); poly(X, pts, rgb(c, GOLD ? 0.75 : 0.92)); poly(G, pts, rgb(c, 0.7)); }
    else { poly(X, pts, '#2c3346'); const [t, bt] = yrange(pts); X.save(); poly(X, pts); X.clip(); const g = X.createLinearGradient(0, t, 0, bt); g.addColorStop(0, 'rgba(230,240,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0.05)'); X.fillStyle = g; X.fillRect(0, t, W, bt - t); X.restore(); }
  }
}
function fireEscape(b, f) {
  const fh = b.fh || 3.0, u0 = f.L * (b.fireU ?? 0.55), w = 3.2;
  X.strokeStyle = NIGHT ? 'rgba(4,4,10,0.95)' : 'rgba(30,22,22,0.85)'; X.lineWidth = Math.max(0.5, S(b.z0) * 0.12);
  for (let v = 4.2; v < b.h - 2; v += fh) { const a = PW(f, u0, v), c = PW(f, u0 + w, v); X.beginPath(); X.moveTo(a[0], a[1]); X.lineTo(c[0], c[1]); X.stroke();
    const s0 = PW(f, u0 + (Math.round(v / fh) % 2 ? 0.3 : w - 0.3), v), s1 = PW(f, u0 + (Math.round(v / fh) % 2 ? w - 0.3 : 0.3), v + fh); if (v + fh < b.h - 2) { X.beginPath(); X.moveTo(s0[0], s0[1]); X.lineTo(s1[0], s1[1]); X.stroke(); } }
}
function trim(b) {
  const z = b.z0, k = 1 - fog(z) * 0.45, lw = Math.max(0.6, S(z) * 0.14);
  const low = b.trimLow ?? b.h * 0.35;
  neonLine([P(b.x0, b.y0 + low, z), P(b.x0, b.y0 + b.h, z), P(b.x1, b.y0 + b.h, z), P(b.x1, b.y0 + low, z)], b.trim, lw, k);
  if (b.x1 < 0) neonLine([P(b.x1, b.y0 + b.h, b.z0), P(b.x1, b.y0 + b.h, b.z1)], b.trim, lw, k);
  if (b.x0 > 0) neonLine([P(b.x0, b.y0 + b.h, b.z0), P(b.x0, b.y0 + b.h, b.z1)], b.trim, lw, k);
}
function flood(b) {
  if (!LIT) return;
  const col = hex(b.flood), z = b.z0;
  const f = { kind: 'front', L: b.x1 - b.x0, Wp: (u, v) => [b.x0 + u, b.y0 + v, z] };
  const pts = quad(f, 0, b.h * 0.5, f.L, b.h), top = P(b.x0, b.y0 + b.h, z)[1], low = P(b.x0, b.y0 + b.h * 0.5, z)[1];
  X.save(); poly(X, pts); X.clip(); X.globalCompositeOperation = 'lighter';
  const g = X.createLinearGradient(0, low, 0, top); g.addColorStop(0, rgb(col, 0)); g.addColorStop(1, rgb(col, 0.42 * NEONK * (1 - fog(z) * 0.4)));
  X.fillStyle = g; X.fillRect(0, Math.min(top, low), W, Math.abs(low - top)); X.restore();
}
function crown(b) {
  const cr = b.crown, z = b.z0, sc = S(z), cx = (b.x0 + b.x1) / 2, w = (b.x1 - b.x0), top = b.y0 + b.h;
  const base = P(cx, top, z), col = hex(cr.c || NEON.gold), f = fog(z);
  const metal = NIGHT ? rgb(mix('#1c1b38', HAZE, f * 0.5)) : GOLD ? rgb(mix(mix('#e8d8c0', '#ffa860', 0.45), HAZE, f * 0.5)) : rgb(mix('#e2e6ee', HAZE, f * 0.5));
  const shadeM = NIGHT ? '#100f24' : GOLD ? rgb(mix('#7a5a7a', HAZE, f * 0.4)) : rgb(mix('#9ea6b6', HAZE, f * 0.4));
  if (cr.t === 'sunburst') {
    const n = 4;
    for (let i = 0; i < n; i++) {
      const r = (w / 2) * (1 - i * 0.2) * sc, y = base[1] - i * (cr.h / n) * sc;
      X.beginPath(); X.ellipse(base[0], y, r, r * 0.9, 0, Math.PI, 0); X.closePath(); X.fillStyle = i % 2 ? shadeM : metal; X.fill();
      for (let k = 0; k < 7; k++) { const a = Math.PI + (k + 0.5) * Math.PI / 7, r1 = r * 0.55, r2 = r * 0.88;
        const tri = [[base[0] + Math.cos(a) * r1, y + Math.sin(a) * r1 * 0.9], [base[0] + Math.cos(a - 0.12) * r2, y + Math.sin(a - 0.12) * r2 * 0.9], [base[0] + Math.cos(a + 0.12) * r2, y + Math.sin(a + 0.12) * r2 * 0.9]];
        if (LIT) { poly(X, tri, rgb(col, 0.95 * NEONK)); poly(G, tri, rgb(col, 0.9 * NEONK)); } else poly(X, tri, 'rgba(60,70,90,0.55)'); }
      if (LIT) { X.beginPath(); X.ellipse(base[0], y, r, r * 0.9, 0, Math.PI, 0); X.strokeStyle = rgb(mix(col, [255, 255, 255], 0.5), 0.9 * NEONK); X.lineWidth = Math.max(0.5, sc * 0.12); X.stroke(); G.beginPath(); G.ellipse(base[0], y, r, r * 0.9, 0, Math.PI, 0); G.strokeStyle = rgb(col, 0.8 * NEONK); G.lineWidth = sc * 0.6; G.stroke(); }
    }
    needle(base[0], base[1] - cr.h * sc * 0.8, cr.h * 1.1 * sc, sc);
  } else if (cr.t === 'spire') {
    const p = [[base[0] - w * 0.18 * sc, base[1]], [base[0], base[1] - cr.h * sc], [base[0] + w * 0.18 * sc, base[1]]];
    poly(X, p, metal); poly(X, [[base[0], base[1]], [base[0], base[1] - cr.h * sc], [base[0] + w * 0.18 * sc, base[1]]], NIGHT ? '#0e0d22' : GOLD ? 'rgba(255,190,120,0.5)' : 'rgba(255,255,255,0.35)');
    if (LIT) neonLine([p[0], p[1], p[2]], col, Math.max(0.5, sc * 0.1));
    needle(base[0], base[1] - cr.h * sc, cr.h * 0.6 * sc, sc);
  } else if (cr.t === 'dome') {
    const r = w * 0.36 * sc;
    X.beginPath(); X.ellipse(base[0], base[1], r, r * 0.95, 0, Math.PI, 0); X.closePath(); X.fillStyle = NIGHT ? '#122028' : rgb(mix(GOLD ? '#7fa080' : '#5fa592', HAZE, f * 0.5)); X.fill();
    if (!NIGHT) { X.beginPath(); X.ellipse(base[0] + r * 0.3, base[1] - r * 0.5, r * 0.25, r * 0.35, 0, 0, 7); X.fillStyle = GOLD ? 'rgba(255,200,140,0.45)' : 'rgba(255,255,255,0.3)'; X.fill(); }
    if (LIT) { const g = X.createLinearGradient(0, base[1], 0, base[1] - r); g.addColorStop(0, rgb(col, 0.55 * NEONK)); g.addColorStop(1, rgb(col, 0.05)); X.save(); X.globalCompositeOperation = 'lighter'; X.beginPath(); X.ellipse(base[0], base[1], r, r * 0.95, 0, Math.PI, 0); X.fillStyle = g; X.fill(); X.restore(); }
    needle(base[0], base[1] - r, r * 0.6, sc);
  } else if (cr.t === 'pyramid') {
    const p = [[base[0] - w * 0.5 * sc, base[1]], [base[0], base[1] - cr.h * sc], [base[0] + w * 0.5 * sc, base[1]]];
    poly(X, p, NIGHT ? '#151330' : rgb(mix(GOLD ? '#5a6a5a' : '#3f7d6c', HAZE, f * 0.5)));
    if (LIT) for (let i = 1; i < 6; i++) { const t = i / 6, y = base[1] - cr.h * sc * t, hw = w * 0.5 * sc * (1 - t); neonLine([[base[0] - hw, y], [base[0] + hw, y]], col, Math.max(0.4, sc * 0.07), 0.8); }
  } else if (cr.t === 'mast') needle(base[0], base[1], cr.h * sc, sc);
}
function needle(x, y, h, sc) {
  X.strokeStyle = NIGHT ? '#2a2840' : '#c9ced8'; X.lineWidth = Math.max(0.5, sc * 0.13); X.beginPath(); X.moveTo(x, y); X.lineTo(x, y - h); X.stroke();
  if (LIT) { X.fillStyle = '#ff3040'; X.beginPath(); X.arc(x, y - h, Math.max(0.8, sc * 0.16), 0, 7); X.fill(); glowDot(x, y - h, sc * 2.2 + 3, [255, 40, 60], 0.7); }
}
function waterTower(b) {
  const z = b.z0 + 2, x = b.waterX ?? (b.x0 + (b.x1 - b.x0) * 0.7), y = b.y0 + b.h, sc = S(z), [bx, by] = P(x, y, z);
  const c = NIGHT ? '#0b0a16' : rgb(mix(GOLD ? '#5a3a3a' : '#6a4b3a', HAZE, fog(z) * 0.6));
  X.strokeStyle = NIGHT ? '#070710' : '#3d3330'; X.lineWidth = Math.max(0.5, sc * 0.1);
  for (const dx of [-0.9, 0.9]) { X.beginPath(); X.moveTo(bx + dx * sc, by); X.lineTo(bx + dx * 0.7 * sc, by - 1.6 * sc); X.stroke(); }
  X.fillStyle = c; X.fillRect(bx - 1.1 * sc, by - 3.6 * sc, 2.2 * sc, 2.1 * sc); poly(X, [[bx - 1.25 * sc, by - 3.6 * sc], [bx, by - 4.6 * sc], [bx + 1.25 * sc, by - 3.6 * sc]], c);
  if (GOLD) { X.fillStyle = 'rgba(255,170,100,0.45)'; X.fillRect(bx + 0.4 * sc, by - 3.6 * sc, 0.7 * sc, 2.1 * sc); }
}
const FONT_BLOCK = '"DejaVu Sans"', FONT_SCRIPT = '"DejaVu Serif"';
function neonText(txt, x, y, size, col, o = {}) {
  const font = `${o.script ? 'italic 700' : '700'} ${size}px ${o.script ? FONT_SCRIPT : FONT_BLOCK}`;
  for (const c of [X, G]) { c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle'; }
  if (LIT) { const k = NEONK; G.fillStyle = rgb(col, 0.95 * k); G.fillText(txt, x, y); X.lineWidth = Math.max(0.5, size * 0.09); X.strokeStyle = rgb(col, k); X.strokeText(txt, x, y); X.fillStyle = rgb(mix(col, [255, 255, 255], 0.75), k); X.fillText(txt, x, y); }
  else { X.fillStyle = 'rgba(250,246,236,0.95)'; X.fillText(txt, x, y); X.lineWidth = Math.max(0.4, size * 0.05); X.strokeStyle = 'rgba(60,40,40,0.45)'; X.strokeText(txt, x, y); }
}
function sign(b, s) {
  const col = hex(s.col || NEON.pink);
  if (s.k === 'vflat' || s.k === 'blade') {
    let p0, p1;
    if (s.k === 'blade') { const z = b.z0 + s.u, xw = b.x1 < 0 ? b.x1 : b.x0, dir = b.x1 < 0 ? 1 : -1; p0 = P(xw + dir * 0.3, b.y0 + s.v1, z); p1 = P(xw + dir * (0.3 + (s.out || 2)), b.y0 + s.v0, z); }
    else { const z = b.z0 - 0.4, cx = b.x0 + s.u; p0 = P(cx - (s.w || 0.8), b.y0 + s.v1, z); p1 = P(cx + (s.w || 0.8), b.y0 + s.v0, z); }
    const x0 = Math.min(p0[0], p1[0]), w = Math.abs(p1[0] - p0[0]), y0 = Math.min(p0[1], p1[1]), h = Math.abs(p1[1] - p0[1]);
    X.fillStyle = NIGHT ? '#0a0814' : '#7a1f2b'; X.beginPath(); X.roundRect(x0, y0, w, h, w * 0.18); X.fill();
    if (LIT) { X.strokeStyle = rgb(col, 0.9 * NEONK); X.lineWidth = Math.max(0.5, w * 0.07); X.stroke(); G.strokeStyle = rgb(col, 0.9 * NEONK); G.lineWidth = w * 0.3; G.beginPath(); G.roundRect(x0, y0, w, h, w * 0.18); G.stroke(); }
    else { X.strokeStyle = 'rgba(240,220,170,0.9)'; X.lineWidth = Math.max(0.4, w * 0.05); X.stroke(); }
    if (FLIP) { if (LIT) { G.fillStyle = rgb(col, 0.5); G.fillRect(x0, y0, w, h); } return; }
    const n = s.text.length, step = h / (n + 0.6), size = Math.min(w * 0.72, step * 0.86);
    [...s.text].forEach((ch, i) => neonText(ch, x0 + w / 2, y0 + step * (i + 0.8), size, col));
  } else if (s.k === 'roof') {
    const z = b.z0 + 0.5, cx = b.x0 + (s.u ?? (b.x1 - b.x0) / 2), sc = S(z), [x, y] = P(cx, b.y0 + b.h + (s.size || 2) * 0.75, z), size = (s.size || 2) * sc;
    if (FLIP) { if (LIT) { G.fillStyle = rgb(col, 0.6); G.fillRect(x - s.text.length * size * 0.27, y - size * 0.4, s.text.length * size * 0.54, size * 0.8); } return; }
    X.strokeStyle = NIGHT ? 'rgba(20,18,36,0.95)' : 'rgba(70,60,60,0.6)'; X.lineWidth = Math.max(0.4, sc * 0.06);
    const tw = s.text.length * size * 0.55; X.beginPath(); for (let gx = -tw / 2; gx <= tw / 2; gx += size * 0.5) { X.moveTo(x + gx, y + size * 0.55); X.lineTo(x + gx, y - size * 0.35); } X.stroke();
    neonText(s.text, x, y, size, col, { script: s.script });
  } else if (s.k === 'script') {
    if (FLIP) return;
    const z = b.z0 - 0.3, sc = S(z), [x, y] = P(b.x0 + s.u, b.y0 + s.v, z); neonText(s.text, x, y, (s.size || 1.4) * sc, col, { script: s.script !== false });
  }
}

// ---------------------------------------------------------------- the river
function waterBand(y0, y1, list, extra) {
  // 1. the world again, upside down (true perspective), into its own canvases
  const [rc, RX] = mkC(), [rgc, RG] = mkC();
  const sx = X, sg = G; X = RX; G = RG; FLIP = true;
  X.save(); X.translate(0, 2 * VPY); X.scale(1, -1); skyGrad(X); if (GOLD) { glowDot(SUNX, VPY - 34, 260, [255, 170, 90], 0.5); glowDot(SUNX, VPY - 34, 60, [255, 230, 170], 0.8); } X.restore();
  if (NIGHT) glowDot(W * 0.27, 2 * VPY - 372, 40, [220, 225, 255], 0.3);
  [...list].sort((a, b) => b.z0 - a.z0).forEach(drawBlock);
  if (extra) extra();
  X = sx; G = sg; FLIP = false;
  // 2. the water: the reflection rippled row by row, darker toward us
  X.save(); X.beginPath(); X.rect(0, y0, W, y1 - y0); X.clip();
  X.fillStyle = NIGHT ? '#04040e' : GOLD ? '#3a2440' : '#3d5a7a'; X.fillRect(0, y0, W, y1 - y0);
  for (let y = Math.floor(y0); y < y1; y += 1 / DPR * 2) {
    const t = (y - y0) / (y1 - y0);
    const dx = Math.sin(y * 0.9 + t * 11) * (0.3 + 2.6 * t) + Math.sin(y * 0.21 + 2) * 1.2 * t;
    const sy = y + Math.sin(y * 0.6) * 0.6 * t;
    X.globalAlpha = (NIGHT ? 0.85 : GOLD ? 0.8 : 0.7) * (1 - 0.3 * t);
    X.drawImage(rc, 0, sy * DPR, rc.width, 2, dx, y, W, 2 / DPR);
  }
  X.globalAlpha = 1;
  // the neon smeared down into long shimmering columns
  X.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 10; k++) { X.globalAlpha = (LIT ? 0.3 : 0) * (1 - k / 10); X.filter = 'blur(1.5px)'; X.drawImage(rgc, 0, y0 * DPR, rgc.width, (y1 - y0) * DPR, Math.sin(k) * 0.8, y0 + k * 2.6, W, y1 - y0); }
  X.filter = 'none'; X.globalAlpha = 1;
  // also feed the bloom so the water glows
  G.drawImage(rgc, 0, y0 * DPR, rgc.width, (y1 - y0) * DPR, 0, y0, W, y1 - y0);
  X.globalCompositeOperation = 'source-over';
  // the water's own colour and depth
  const g = X.createLinearGradient(0, y0, 0, y1);
  if (NIGHT) { g.addColorStop(0, 'rgba(6,6,24,0.1)'); g.addColorStop(1, 'rgba(3,3,12,0.45)'); }
  else if (GOLD) { g.addColorStop(0, 'rgba(90,40,70,0.08)'); g.addColorStop(1, 'rgba(40,20,50,0.4)'); }
  else { g.addColorStop(0, 'rgba(60,100,140,0.1)'); g.addColorStop(1, 'rgba(25,55,85,0.45)'); }
  X.fillStyle = g; X.fillRect(0, y0, W, y1 - y0);
  // glints + wave lines; at sunset a glittering sun path
  rs(77);
  for (let i = 0; i < (NIGHT ? 300 : 520); i++) {
    const t = Math.pow(R(), 0.8), y = y0 + t * (y1 - y0), w = (2 + R() * 10) * (0.3 + t * 1.6);
    let x = R() * W, a = 0.04 + R() * 0.08;
    if (GOLD && R() < 0.55) { x = SUNX + (R() - 0.5) * (14 + t * 120); a = 0.25 + R() * 0.6; X.fillStyle = `rgba(255,${200 + R() * 50 | 0},${140 + R() * 60 | 0},${a})`; }
    else if (DAY && R() < 0.3) { x = W * 0.82 + (R() - 0.5) * (40 + t * 220); a = 0.4 + R() * 0.55; X.fillStyle = `rgba(255,255,250,${a})`; }
    else X.fillStyle = NIGHT ? `rgba(200,190,255,${a})` : GOLD ? `rgba(255,190,160,${a * 1.5})` : `rgba(255,255,255,${a * 2.2})`;
    X.fillRect(x, y, w, Math.max(0.5, 0.5 + t * 0.7));
  }
  for (let i = 0; i < 90; i++) { const t = R(), y = y0 + t * (y1 - y0); X.fillStyle = `rgba(0,0,10,${0.06 + t * 0.08})`; X.fillRect(R() * W, y, 20 + R() * 70 * (0.4 + t), 0.6 + t); }
  X.restore();
}

// ---------------------------------------------------------------- the land, the bridges, the boats
function land(x0, x1, z0, z1, col, ncol) { poly(X, [P(x0, 0, z0), P(x1, 0, z0), P(x1, 0, z1), P(x0, 0, z1)], NIGHT ? ncol : col); }
function quay(x0, x1, z) {   // a lit stone edge along a bank
  poly(X, [P(x0, 0.4, z), P(x1, 0.4, z), P(x1, -1.2, z), P(x0, -1.2, z)], NIGHT ? '#0d0c1c' : GOLD ? '#7a5a5a' : '#8f877b');
}
function lampPost(x, z, dir = 1, col = null) {
  const sc = S(z), [bx, by] = P(x, 0, z), [hx, hy] = P(x + dir * 0.9, 4.5, z);
  X.strokeStyle = NIGHT ? '#100f1e' : '#2b2a33'; X.lineWidth = Math.max(0.6, sc * 0.13); X.lineCap = 'round';
  X.beginPath(); X.moveTo(bx, by); X.lineTo(bx, hy - sc * 0.2); X.quadraticCurveTo(bx, hy - sc * 0.45, hx, hy - sc * 0.2); X.stroke();
  X.fillStyle = NIGHT ? '#22202e' : '#2b2a33'; X.fillRect(hx - sc * 0.32, hy - sc * 0.25, sc * 0.64, sc * 0.2);
  if (LIT) { const c = col || [255, 204, 140]; X.fillStyle = rgb(mix(c, [255, 255, 255], 0.6)); X.fillRect(hx - sc * 0.24, hy - sc * 0.06, sc * 0.48, sc * 0.1);
    glowDot(hx, hy, sc * 3.6, c, GOLD ? 0.4 : 0.55); glowDot(hx, hy, sc, [255, 240, 220], 0.9);
    X.save(); X.globalCompositeOperation = 'lighter'; X.translate(hx, by); X.scale(1, 0.3); const g = X.createRadialGradient(0, 0, 0, 0, 0, sc * 3.6); g.addColorStop(0, rgb(c, 0.62)); g.addColorStop(0.5, rgb(c, 0.22)); g.addColorStop(1, rgb(c, 0)); X.fillStyle = g; X.fillRect(-sc * 3.6, -sc * 3.6, sc * 7.2, sc * 7.2); X.restore(); }
}
function tree(x, z, litX, palette = AUT) {
  const sc = S(z), [bx, by] = P(x, 0, z), [cx, cy] = P(x, 3.1, z), r = 1.45 * sc;
  X.strokeStyle = NIGHT ? '#100a10' : '#3b2a22'; X.lineWidth = Math.max(0.6, sc * 0.18); X.beginPath(); X.moveTo(bx, by); X.lineTo(cx, cy + r * 0.4); X.stroke();
  rs(x * 100 + z); const [lx] = P(litX, 4.5, z);
  for (let i = 0; i < 90; i++) {
    const a = R() * 6.283, rr = r * Math.sqrt(R()), px = cx + Math.cos(a) * rr * 1.1, py = cy + Math.sin(a) * rr * 0.85, s = (0.15 + R() * 0.22) * sc;
    let col = hex(palette[1 + ((R() * (palette.length - 1)) | 0)]);
    if (NIGHT) { const d = Math.abs(px - lx) / (r * 2.4) + (py - cy + r) / (r * 3); col = mix(mix(col, '#000000', 0.78), col, clamp01(1.05 - d) * (0.5 + R() * 0.6)); }
    else { const sun = clamp01((px - cx) / r * 0.5 + 0.5) * (0.6 + R() * 0.5); col = mix(mix(col, GOLD ? '#2a1030' : '#000000', 0.38), mix(col, GOLD ? '#ffc070' : '#fff3d0', GOLD ? 0.35 : 0.15), sun); }
    X.fillStyle = rgb(col); X.beginPath(); X.arc(px, py, s, 0, 7); X.fill();
  }
}
function signal(x, z, dir, state, big = 1) {
  const sc = S(z), [bx, by] = P(x, 0, z), [tx, ty] = P(x, 5.2, z), [ax] = P(x + dir * 3.2, 5.2, z);
  X.strokeStyle = NIGHT ? '#12111f' : '#2c2b35'; X.lineWidth = Math.max(0.7, sc * 0.16);
  X.beginPath(); X.moveTo(bx, by); X.lineTo(tx, ty); X.lineTo(ax, ty); X.stroke();
  const hx = P(x + dir * 2.6, 0, z)[0], hy = ty + sc * 0.15, hw = sc * 0.45 * big, hh = sc * 1.25 * big;
  X.fillStyle = NIGHT ? '#0a0a12' : '#2f3a2c'; X.beginPath(); X.roundRect(hx - hw / 2, hy, hw, hh, sc * 0.1); X.fill();
  const cols = { red: [255, 45, 55], yellow: [255, 190, 40], green: [60, 255, 150] };
  ['red', 'yellow', 'green'].forEach((k, i) => { const on = k === state, yy = hy + hh * (0.2 + i * 0.3);
    X.fillStyle = on ? rgb(mix(cols[k], [255, 255, 255], 0.35)) : (NIGHT ? 'rgba(50,50,70,0.7)' : 'rgba(30,30,30,0.6)'); X.beginPath(); X.arc(hx, yy, hw * 0.32, 0, 7); X.fill();
    if (big > 1) { X.fillStyle = NIGHT ? '#07070e' : '#1f281d'; X.beginPath(); X.arc(hx, yy - hw * 0.05, hw * 0.42, Math.PI * 1.05, Math.PI * 1.95); X.lineTo(hx + hw * 0.42, yy - hw * 0.25); X.fill(); }
    if (on) { glowDot(hx, yy, sc * (LIT ? 3.6 : 1.8) * big, cols[k], LIT ? 0.75 : 0.55); glowDot(hx, yy, sc * 0.8 * big, [255, 255, 255], LIT ? 0.5 : 0.3); if (LIT) streaks.push({ x: hx, col: cols[k], a: 0.5, w: Math.max(1.4, sc * 0.35), z }); } });
}
const streaks = []; let ROAD = null;
function drawStreaks() {
  if (!LIT || !ROAD) return;
  for (const s of streaks) {
    const gy = P(0, 0, s.z)[1], y0 = Math.max(ROAD.y0 + 1, gy + 1), len = Math.min(ROAD.y1 - y0, S(s.z) * 5);
    if (len < 2) continue;
    X.save(); X.globalCompositeOperation = 'lighter'; X.filter = 'blur(1.2px)';
    for (let i = 0; i < 10; i++) { const t = i / 10; X.fillStyle = rgb(s.col, s.a * (1 - t) * 0.85 * (GOLD ? 0.6 : 1)); X.fillRect(s.x - s.w / 2 + Math.sin(i * 2.1) * s.w * 0.25, y0 + t * len, s.w * (1 - t * 0.3), len / 10 - 0.5); }
    X.restore();
  }
}
function car(x, z, dir, kind = 'sedan', color = '#3c4a6a') {
  const sc = S(z), bus = kind === 'bus', len = bus ? 11 : kind === 'suv' ? 4.8 : 4.4, hgt = bus ? 3.1 : kind === 'suv' ? 1.8 : 1.45;
  const [x0, yb] = P(x - len / 2, 0.25, z), [x1, yt] = P(x + len / 2, hgt, z), hh = yb - yt;
  if (bus) {
    X.fillStyle = NIGHT ? '#0c0d1c' : '#2f5fae'; X.beginPath(); X.roundRect(x0, yt, x1 - x0, hh, sc * 0.3); X.fill();
    if (!NIGHT) { X.fillStyle = '#f2f2ee'; X.fillRect(x0, yt + hh * 0.62, x1 - x0, hh * 0.12); X.fillStyle = '#e8b84a'; X.fillRect(x0, yt + hh * 0.76, x1 - x0, hh * 0.05); }
    for (let i = 0; i < 6; i++) { const wx = x0 + (x1 - x0) * (0.1 + i * 0.135), ww = (x1 - x0) * 0.115, wy = yt + hh * 0.14, wh = hh * 0.38;
      if (LIT) { X.fillStyle = '#ffd59a'; X.fillRect(wx, wy, ww, wh); G.fillStyle = 'rgba(255,200,130,0.7)'; G.fillRect(wx, wy, ww, wh); } else { X.fillStyle = '#26324a'; X.fillRect(wx, wy, ww, wh); X.fillStyle = 'rgba(220,235,255,0.5)'; X.fillRect(wx, wy, ww, wh * 0.4); } }
    const fx = dir > 0 ? x1 : x0; X.fillStyle = LIT ? '#ffb040' : '#1a1a1a'; X.font = `700 ${sc * 0.5}px "DejaVu Sans Mono"`; X.textAlign = dir > 0 ? 'right' : 'left'; X.textBaseline = 'top'; X.fillText('12 UPTOWN', fx - dir * sc * 0.3, yt + sc * 0.05);
    if (LIT) { glowDot(fx, yb - sc * 0.6, sc * 2.4, [255, 245, 220], 0.6); streaks.push({ x: (x0 + x1) / 2, col: [255, 200, 130], a: 0.3, w: (x1 - x0) * 0.7, z }); }
    for (const t of [0.15, 0.85]) { X.fillStyle = '#05050a'; X.beginPath(); X.arc(x0 + (x1 - x0) * t, yb, sc * 0.45, Math.PI, 0); X.fill(); }
    return;
  }
  X.fillStyle = NIGHT ? '#0b0b16' : color; X.beginPath(); X.roundRect(x0, yt + hh * 0.38, x1 - x0, hh * 0.62, sc * 0.2); X.fill();
  X.beginPath(); X.roundRect(x0 + (x1 - x0) * 0.22, yt, (x1 - x0) * 0.5, hh * 0.5, sc * 0.25); X.fill();
  if (!NIGHT) { X.fillStyle = GOLD ? 'rgba(255,200,150,0.6)' : 'rgba(200,225,255,0.55)'; X.fillRect(x0 + (x1 - x0) * 0.27, yt + hh * 0.08, (x1 - x0) * 0.4, hh * 0.28); X.fillStyle = '#111'; for (const t of [0.22, 0.78]) { X.beginPath(); X.arc(x0 + (x1 - x0) * t, yb, sc * 0.35, 0, 7); X.fill(); } }
  if (LIT) { const fx = dir > 0 ? x1 : x0, bx = dir > 0 ? x0 : x1, ly = yt + hh * 0.62;
    glowDot(fx, ly, sc * 2.6, [255, 246, 225], 0.7); X.fillStyle = '#fffbe8'; X.fillRect(fx - sc * 0.15, ly - sc * 0.1, sc * 0.3, sc * 0.2);
    glowDot(bx, ly, sc * 1.2, [255, 40, 50], 0.7); X.fillStyle = '#ff3040'; X.fillRect(bx - sc * 0.12, ly - sc * 0.1, sc * 0.24, sc * 0.2);
    if (kind === 'glow') { X.save(); X.globalCompositeOperation = 'lighter'; X.filter = `blur(${sc * 0.4}px)`; X.fillStyle = 'rgba(255,60,190,0.8)'; X.fillRect(x0, yb - sc * 0.1, x1 - x0, sc * 0.35); X.restore(); streaks.push({ x: (x0 + x1) / 2, col: [255, 60, 190], a: 0.4, w: (x1 - x0) * 0.6, z }); }
    streaks.push({ x: fx, col: [255, 240, 220], a: 0.3, w: sc * 0.4, z }); streaks.push({ x: bx, col: [255, 40, 50], a: 0.35, w: sc * 0.3, z }); }
}
function carFront(x, z, toward, y = 0.25) {
  const sc = S(z), [x0, yb] = P(x - 0.95, y, z), [x1, yt] = P(x + 0.95, y + 1.2, z);
  X.fillStyle = NIGHT ? '#0b0b16' : '#4a5878'; X.fillRect(x0, Math.min(yt, yb), x1 - x0, Math.abs(yb - yt));
  const ly = yt + (yb - yt) * 0.62, c = toward ? [255, 246, 225] : [255, 40, 50];
  if (LIT) for (const t of [0.16, 0.84]) { const lx = x0 + (x1 - x0) * t; X.fillStyle = rgb(c); X.fillRect(lx - sc * 0.13, ly - sc * 0.08, sc * 0.26, sc * 0.16); glowDot(lx, ly, sc * (toward ? 2.2 : 1.1), c, 0.7); G.fillStyle = rgb(c, 0.6); G.fillRect(lx - sc * 0.3, ly - sc * 0.3, sc * 0.6, sc * 0.6); }
}
function person(x, z, o = {}) {
  const sc = S(z), [bx, by] = P(x, 0, z), h = (o.h || 1.75) * sc;
  X.fillStyle = NIGHT ? '#0a0912' : GOLD ? '#2a1a2a' : (o.col || '#30303c');
  X.beginPath(); X.roundRect(bx - h * 0.13, by - h * 0.82, h * 0.26, h * 0.46, h * 0.08); X.fill(); X.beginPath(); X.arc(bx, by - h * 0.9, h * 0.1, 0, 7); X.fill();
  X.fillRect(bx - h * 0.1, by - h * 0.38, h * 0.08, h * 0.38); X.fillRect(bx + h * 0.02, by - h * 0.38, h * 0.08, h * 0.38);
}
// a boat on the water, seen from the side (all geometry through P, so it reflects too)
function boat(x, z, kind, dir = 1) {
  const sc = S(z);
  if (kind === 'party') {
    const L = 22, x0 = x - L / 2, x1 = x + L / 2;
    poly(X, [P(x0, 1.6, z), P(x1, 1.6, z), P(x1 - dir * 1.5, -0.3, z), P(x0 + dir * 1.2, -0.3, z)], NIGHT ? '#0c0b18' : GOLD ? '#f0d8c8' : '#f4f1ea');
    poly(X, [P(x0 + 1.5, 1.6, z), P(x1 - 2, 1.6, z), P(x1 - 2, 3.6, z), P(x0 + 1.5, 3.6, z)], NIGHT ? '#15132a' : GOLD ? '#c8a8a8' : '#d9d4ca');
    poly(X, [P(x0 + 3.5, 3.6, z), P(x1 - 5, 3.6, z), P(x1 - 5, 5.4, z), P(x0 + 3.5, 5.4, z)], NIGHT ? '#15132a' : GOLD ? '#c8a8a8' : '#d9d4ca');
    if (!NIGHT) poly(X, [P(x0, 1.6, z), P(x1, 1.6, z), P(x1, 1.1, z), P(x0, 1.1, z)], GOLD ? '#9a3a4a' : '#a8323e');
    for (const [y0, y1, a, b2] of [[2.0, 3.2, x0 + 2, x1 - 2.6], [3.95, 5.0, x0 + 4, x1 - 5.5]]) for (let u = a; u < b2; u += 1.1) {
      const pts = [P(u, y0, z), P(u + 0.75, y0, z), P(u + 0.75, y1, z), P(u, y1, z)];
      if (LIT) { const c = hex(WARM[Math.abs(u * 7 | 0) % 5]); poly(X, pts, rgb(c, 0.95)); poly(G, pts, rgb(c, 0.55)); } else poly(X, pts, GOLD ? 'rgba(255,190,130,0.8)' : '#33445e');
    }
    // the strings of coloured bulbs, bow to stern over the top deck
    const cols = [NEON.pink, NEON.cyan, NEON.gold, NEON.violet, NEON.mint];
    const mastA = P(x0 + 2, 8, z), mastB = P(x1 - 3, 8, z);
    line(X, [P(x0 + 2, 5.4, z), mastA], NIGHT ? '#2a2840' : '#5a5a66', Math.max(0.5, sc * 0.12)); line(X, [P(x1 - 3, 5.4, z), mastB], NIGHT ? '#2a2840' : '#5a5a66', Math.max(0.5, sc * 0.12));
    for (const [pa, pb, sag] of [[P(x0 - 0.5, 1.8, z), mastA, 1.2], [mastA, mastB, 1.8], [mastB, P(x1 + 0.2, 1.8, z), 1.2]]) {
      const n = 14; for (let i = 0; i <= n; i++) { const t = i / n, px = pa[0] + (pb[0] - pa[0]) * t, py = pa[1] + (pb[1] - pa[1]) * t + Math.sin(t * Math.PI) * sag * sc * (FLIP ? -1 : 1);
        const c = hex(cols[i % cols.length]); X.fillStyle = LIT ? rgb(mix(c, [255, 255, 255], 0.4)) : 'rgba(240,240,240,0.9)'; X.beginPath(); X.arc(px, py, Math.max(0.5, sc * 0.13), 0, 7); X.fill();
        if (LIT) { G.fillStyle = rgb(c, 0.9); G.beginPath(); G.arc(px, py, sc * 0.5, 0, 7); G.fill(); } }
    }
    neonLine([P(x0 + 0.3, 1.6, z), P(x1 - 0.3, 1.6, z)], NEON.pink, Math.max(0.5, sc * 0.14));
    if (!FLIP && LIT) { X.font = `700 ${sc * 0.9}px ${FONT_SCRIPT}`; const [tx, ty] = P(x0 + 4.4, 4.5, z - 0.1); neonText('Rosie', tx + sc * 2.4, ty, sc * 0.95, hex(NEON.cyan), { script: true }); }
  } else if (kind === 'taxi') {
    const L = 6; poly(X, [P(x - L / 2, 1.0, z), P(x + L / 2, 1.0, z), P(x + L / 2 - 0.8, -0.2, z), P(x - L / 2 + 0.4, -0.2, z)], NIGHT ? '#0d0c1a' : '#e8c64a');
    poly(X, [P(x - 1.5, 1.0, z), P(x + 1.2, 1.0, z), P(x + 1.0, 2.2, z), P(x - 1.3, 2.2, z)], NIGHT ? '#15132a' : '#f4f0e6');
    if (LIT) { const p = P(x - 0.2, 1.6, z); X.fillStyle = '#ffe2b0'; X.fillRect(p[0] - sc * 0.9, p[1] - sc * 0.35, sc * 1.8, sc * 0.6); G.fillStyle = 'rgba(255,210,150,0.7)'; G.fillRect(p[0] - sc * 1.1, p[1] - sc * 0.5, sc * 2.2, sc); const h2 = P(x + dir * L / 2, 0.9, z); glowDot(h2[0], h2[1], sc * 2, [255, 240, 220], 0.6); const t2 = P(x, 2.6, z); glowDot(t2[0], t2[1], sc, [80, 255, 140], 0.8); }
  } else if (kind === 'sail') {
    poly(X, [P(x - 3, 0.8, z), P(x + 3, 0.8, z), P(x + 2.4, -0.2, z), P(x - 2.6, -0.2, z)], '#f4f1ea');
    line(X, [P(x, 0.8, z), P(x, 9, z)], '#555', Math.max(0.5, sc * 0.1));
    poly(X, [P(x + 0.1, 8.8, z), P(x + 0.1, 1.2, z), P(x + 3.6, 1.2, z)], GOLD ? '#ffd8b0' : '#ffffff'); poly(X, [P(x - 0.1, 7.4, z), P(x - 0.1, 1.2, z), P(x - 2.6, 1.2, z)], GOLD ? '#f0b090' : '#e9eef4');
  } else if (kind === 'tug') {
    poly(X, [P(x - 4, 1.2, z), P(x + 4, 1.2, z), P(x + 3.2, -0.2, z), P(x - 3.6, -0.2, z)], NIGHT ? '#0d0c1a' : '#b2322a');
    poly(X, [P(x - 1.5, 1.2, z), P(x + 1.5, 1.2, z), P(x + 1.5, 3, z), P(x - 1.5, 3, z)], NIGHT ? '#15132a' : '#f0ece2');
    line(X, [P(x + 0.5, 3, z), P(x + 0.5, 4.6, z)], NIGHT ? '#15132a' : '#222', Math.max(0.6, sc * 0.4));
    if (LIT) { for (const [dx, c] of [[-1, [255, 220, 160]], [0.6, [255, 220, 160]]]) { const p = P(x + dx, 2.1, z); X.fillStyle = rgb(c); X.fillRect(p[0] - sc * 0.3, p[1] - sc * 0.3, sc * 0.6, sc * 0.5); glowDot(p[0], p[1], sc * 1.4, c, 0.5); }
      const m = P(x + 0.5, 4.9, z); glowDot(m[0], m[1], sc * 1.4, [255, 60, 60], 0.8); }
  }
  if (!FLIP) {   // a white wake along the hull
    const [a] = P(x - 6, 0, z), [b2, wy] = P(x + 6, 0, z); X.fillStyle = NIGHT ? 'rgba(200,200,255,0.12)' : 'rgba(255,255,255,0.35)'; X.fillRect(Math.min(a, b2), wy, Math.abs(b2 - a), Math.max(0.6, sc * 0.15));
  }
}
function ferris(x, yc, z, r) {   // a big wheel on the pier (in the plane z = const)
  const sc = S(z), n = 18, cols = [NEON.pink, NEON.cyan, NEON.gold, NEON.violet, NEON.mint, NEON.orange];
  const pt = (a, rr) => P(x + Math.cos(a) * rr, yc + Math.sin(a) * rr, z);
  // the legs
  for (const dx of [-0.42, 0.42]) line(X, [P(x, yc, z), P(x + dx * r, 1.5, z)], NIGHT ? '#1a1830' : GOLD ? '#e8c8b8' : '#e8ecf2', Math.max(0.8, sc * 0.4));
  // spokes + rims
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; line(X, [P(x, yc, z), pt(a, r)], NIGHT ? 'rgba(40,38,70,0.9)' : GOLD ? 'rgba(240,210,190,0.9)' : 'rgba(235,240,246,0.95)', Math.max(0.4, sc * 0.1)); }
  for (const rr of [r, r * 0.93]) { const pts = []; for (let i = 0; i <= 72; i++) pts.push(pt(i / 72 * Math.PI * 2, rr)); line(X, pts, NIGHT ? '#22203a' : GOLD ? '#e8a090' : '#c8323e', Math.max(0.6, sc * (rr === r ? 0.32 : 0.16))); }
  if (LIT) {   // the rim's lights in colour bands + lit spokes, the hub
    for (let i = 0; i < 72; i++) { const a = i / 72 * Math.PI * 2, p = pt(a, r * 0.965), c = hex(cols[Math.floor(i / 12) % cols.length]);
      X.fillStyle = rgb(mix(c, [255, 255, 255], 0.5)); X.beginPath(); X.arc(p[0], p[1], Math.max(0.5, sc * 0.16), 0, 7); X.fill(); G.fillStyle = rgb(c, 0.9); G.beginPath(); G.arc(p[0], p[1], sc * 0.6, 0, 7); G.fill(); }
    for (let i = 0; i < n; i += 1) { const a = i / n * Math.PI * 2; neonLine([P(x, yc, z), pt(a, r * 0.9)], cols[i % cols.length], Math.max(0.3, sc * 0.05), 0.22); }
    const hub = P(x, yc, z); glowDot(hub[0], hub[1], sc * 1.6, [255, 220, 160], 0.6);
  }
  // the gondolas hanging from the rim
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + 0.17, p = pt(a, r), gw = sc * 1.1, gh = sc * 1.0 * (FLIP ? -1 : 1);
    X.fillStyle = LIT ? hex(WARM[i % 5]) && rgb(hex(WARM[i % 5]), 0.9) : GOLD ? '#ffd0b0' : ['#d84a4a', '#3a7ad8', '#e8b83a'][i % 3]; X.fillRect(p[0] - gw / 2, p[1], gw, gh); if (LIT) { G.fillStyle = 'rgba(255,200,140,0.5)'; G.fillRect(p[0] - gw / 2, p[1], gw, gh); } }
}

// ---------------------------------------------------------------- the finish
function bloom() {
  if (!LIT) return;
  X.save(); X.globalCompositeOperation = 'lighter';
  X.filter = 'blur(4px)'; X.globalAlpha = NIGHT ? 0.62 : 0.42; X.drawImage(gc, 0, 0, W, H);
  X.filter = 'blur(14px)'; X.globalAlpha = NIGHT ? 0.45 : 0.3; X.drawImage(gc, 0, 0, W, H);
  X.restore();
}
function vignette() { const g = X.createRadialGradient(W / 2, H * 0.45, H * 0.3, W / 2, H * 0.5, H * 0.75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, NIGHT ? 'rgba(0,0,8,0.5)' : GOLD ? 'rgba(40,10,30,0.25)' : 'rgba(30,30,50,0.12)'); X.fillStyle = g; X.fillRect(0, 0, W, H); }
function tower(o) {
  const out = [], n = o.tiers || 3; let x0 = o.x - o.w / 2, x1 = o.x + o.w / 2, y = 0, z = o.z;
  const fr = o.split || [0.62, 0.22, 0.16];
  for (let i = 0; i < n; i++) {
    const hh = o.h * fr[i];
    out.push({ x0, x1, z0: z, z1: z + (o.d || 14), y0: y, h: hh, mat: o.mat, lit: o.lit, trim: o.trim && i > 0 ? o.trim : null, trimLow: hh * 0.04, flood: i === n - 1 ? o.flood : null, crown: i === n - 1 ? o.crown : null, store: i === 0 && o.store, signs: i === 0 ? o.signs : null, seed: (o.x * 37 + i * 11 + o.z) });
    y += hh; const ins = (x1 - x0) * 0.13; x0 += ins; x1 -= ins; z += 1.3;
  }
  return out;
}
function skyline(o) {   // a far band of city: deterministic varied blocks with occasional crowns
  const out = []; rs(o.seed);
  for (let x = o.x0; x < o.x1; ) {
    const w = o.wMin + R() * (o.wMax - o.wMin), h = o.hMin + R() * (o.hMax - o.hMin), z = o.z + R() * o.dz;
    const mat = ['lime', 'granite', 'brick', 'cream', 'slate', 'terra'][(R() * 6) | 0];
    if (R() < o.towerP) out.push(...tower({ x: x + w / 2, w, z, h: h * 1.25, mat, crown: R() < 0.5 ? { t: ['spire', 'pyramid', 'dome', 'mast'][(R() * 4) | 0], h: 6 + R() * 8, c: [NEON.gold, NEON.cyan, NEON.pink][(R() * 3) | 0] } : null, trim: R() < o.trimP ? [NEON.pink, NEON.cyan, NEON.violet, NEON.gold][(R() * 4) | 0] : null, lit: 0.6 }));
    else out.push({ x0: x, x1: x + w, z0: z, z1: z + 12, h, mat, lit: 0.6, trim: R() < o.trimP * 0.5 ? [NEON.pink, NEON.cyan, NEON.violet][(R() * 3) | 0] : null, trimLow: h * 0.92 });
    x += w + o.gap * R();
  }
  return out;
}

// the near side, shared: the promenade (railing, lamp + tree pairs, people) and the road with its two stop lights
function nearSide(o) {
  // promenade
  land(-400, 400, o.zRoad1, o.zRail, '#c8bfae', '#0d0c1a');
  // the road
  land(-400, 400, 1, o.zRoad1, GOLD ? '#4a3a48' : '#55555f', '#06060e');
  const lz = (o.zRoad0 + o.zRoad1) / 2, ly = P(0, 0, lz)[1];
  for (let x = 0; x < W; x += 24) { X.fillStyle = LIT ? 'rgba(255,200,90,0.35)' : 'rgba(255,214,90,0.85)'; X.fillRect(x, ly, 12, Math.max(0.8, S(lz) * 0.12)); }
  ROAD = { y0: P(0, 0, o.zRoad1)[1], y1: H };
  // the curb between the road and the promenade
  poly(X, [P(-400, 0.25, o.zRoad1), P(400, 0.25, o.zRoad1), P(400, 0, o.zRoad1 - 0.2), P(-400, 0, o.zRoad1 - 0.2)], NIGHT ? '#15142a' : '#9a9282');
  // the railing at the water's edge
  const rz = o.zRail - 0.4, ry = P(0, 1.1, rz)[1], ry0 = P(0, 0, rz)[1]; X.fillStyle = NIGHT ? '#0b0a16' : '#34313c'; X.fillRect(0, ry, W, Math.max(1.2, S(rz) * 0.12));
  for (let x = -40; x < 40; x += 1.1) { const p = P(x, 0, rz); X.fillRect(p[0] - 0.3, ry, 0.6, ry0 - ry); }
  const pz = o.zRail - 2.5;
  o.lamps.forEach(([x, d]) => lampPost(x, pz, d));
  o.trees.forEach(([x, lx]) => tree(x, pz + 0.4, lx));
  o.people.forEach(([x, dz, h]) => person(x, pz - dz, { h }));
  o.signals.forEach(([x, d, st]) => signal(x, o.zRoad1 - 0.6, d, st));
  o.cars.forEach(([x, dz, d, k, c]) => car(x, o.zRoad0 + dz, d, k, c));
}


// ---------------------------------------------------------------- HARBOR 2.0 helpers: the stage at readable sizes
function shadowUnder(x, z, w, len = 1) {   // a soft shadow on the ground (by day the sun is in the west: shadows fall left)
  if (NIGHT) return; const [px, py] = P(x, 0, z), sc = S(z);
  X.save(); X.fillStyle = `rgba(20,15,30,${GOLD ? 0.35 : 0.22})`; X.filter = `blur(${Math.max(1, sc * 0.25)}px)`;
  X.beginPath(); X.ellipse(px - sc * w * 0.35 * len, py + 0.5, sc * w * (0.6 + 0.5 * len), sc * 0.28, 0, 0, 7); X.fill(); X.restore();
}
const CLOTHES = ['#c8423a', '#2f6fb8', '#e0a83a', '#3c8a5a', '#8a4fa8', '#e8e2d6', '#2a2a36', '#d86a8a'];
function walker(x, z, o = {}) {   // a person ~20 pt tall: head, coat, arms, legs mid-stride, a rim of lamp light at night
  const sc = S(z), [bx, by] = P(x, o.y || 0, z), h = (o.h || 1.75) * sc, st = o.stride ?? 0.5, dir = o.dir || 1;
  if (!o.y) shadowUnder(x, z, 0.5);
  const coat = NIGHT ? '#0c0b16' : (o.col || CLOTHES[Math.abs(Math.round(x * 7 + z)) % CLOTHES.length]), skin = NIGHT ? '#0c0b16' : (o.skin || '#e0b896'), pants = NIGHT ? '#08070f' : '#2a2a36';
  X.lineCap = 'round';
  // legs
  X.strokeStyle = pants; X.lineWidth = h * 0.1;
  X.beginPath(); X.moveTo(bx, by - h * 0.44); X.lineTo(bx - h * 0.12 * st * dir, by - h * 0.02); X.moveTo(bx, by - h * 0.44); X.lineTo(bx + h * 0.12 * st * dir, by - h * 0.02); X.stroke();
  // coat (a soft trapezoid), arms
  const hem = o.long ? 0.24 : 0.4; X.fillStyle = coat; X.beginPath(); X.moveTo(bx - h * 0.12, by - h * 0.8); X.lineTo(bx + h * 0.12, by - h * 0.8); X.lineTo(bx + h * 0.16, by - h * hem); X.lineTo(bx - h * 0.16, by - h * hem); X.closePath(); X.fill();
  if (!NIGHT) { X.fillStyle = 'rgba(255,255,255,0.18)'; X.fillRect(bx + h * 0.04, by - h * 0.8, h * 0.06, h * (0.8 - hem)); }
  if (o.scarf) { X.fillStyle = NIGHT ? '#140a12' : o.scarf; X.fillRect(bx - h * 0.12, by - h * 0.82, h * 0.24, h * 0.07); X.fillRect(bx + h * 0.02, by - h * 0.8, h * 0.06, h * 0.18); }
  X.strokeStyle = coat; X.lineWidth = h * 0.08; X.beginPath();
  if (o.wave) { X.moveTo(bx + h * 0.1, by - h * 0.76); X.lineTo(bx + h * 0.26, by - h * 1.05); } else { X.moveTo(bx + h * 0.11, by - h * 0.76); X.lineTo(bx + h * 0.14 + h * 0.08 * st * dir, by - h * 0.48); }
  X.moveTo(bx - h * 0.11, by - h * 0.76); X.lineTo(bx - h * 0.14 - h * 0.08 * st * dir, by - h * 0.48); X.stroke();
  // head + hair / hat
  X.fillStyle = skin; X.beginPath(); X.arc(bx, by - h * 0.9, h * 0.085, 0, 7); X.fill();
  X.fillStyle = NIGHT ? '#08070f' : '#3a2a22'; X.beginPath(); X.arc(bx, by - h * 0.93, h * 0.085, Math.PI, 0); X.fill();
  if (o.hat) { X.fillStyle = NIGHT ? '#08070f' : (typeof o.hat === 'string' ? o.hat : '#2a2230'); X.fillRect(bx - h * 0.16, by - h * 0.965, h * 0.32, h * 0.03); X.beginPath(); X.roundRect(bx - h * 0.09, by - h * 1.07, h * 0.18, h * 0.11, h * 0.03); X.fill(); X.fillStyle = NIGHT ? '#1a1018' : '#7a2a2a'; X.fillRect(bx - h * 0.09, by - h * 0.985, h * 0.18, h * 0.02); }
  if (o.beanie) { X.fillStyle = NIGHT ? '#08070f' : o.beanie; X.beginPath(); X.arc(bx, by - h * 0.94, h * 0.095, Math.PI, 0); X.fill(); X.fillRect(bx - h * 0.1, by - h * 0.95, h * 0.2, h * 0.03); X.beginPath(); X.arc(bx, by - h * 1.04, h * 0.025, 0, 7); X.fill(); }
  if (NIGHT && o.rim) {   // the lamp's light on one side
    X.fillStyle = 'rgba(255,200,140,0.75)'; X.fillRect(bx + o.rim * h * 0.1, by - h * 0.8, h * 0.035, h * 0.4); X.beginPath(); X.arc(bx + o.rim * h * 0.05, by - h * 0.91, h * 0.045, 0, 7); X.fill();
  }
  if (o.dog) { const dx = bx + h * 0.35 * dir, dy = by; X.fillStyle = NIGHT ? '#0c0b16' : '#7a5236'; X.beginPath(); X.roundRect(dx - h * 0.14, dy - h * 0.2, h * 0.28, h * 0.11, h * 0.05); X.fill(); X.fillRect(dx - h * 0.12, dy - h * 0.1, h * 0.04, h * 0.1); X.fillRect(dx + h * 0.08, dy - h * 0.1, h * 0.04, h * 0.1); X.beginPath(); X.arc(dx + h * 0.16 * dir, dy - h * 0.24, h * 0.06, 0, 7); X.fill();
    X.strokeStyle = NIGHT ? 'rgba(40,36,60,0.9)' : '#333'; X.lineWidth = Math.max(0.4, h * 0.015); X.beginPath(); X.moveTo(bx + h * 0.14 + h * 0.08 * st * dir, by - h * 0.48); X.lineTo(dx, dy - h * 0.2); X.stroke(); }
}
function bench(x, z) {
  const sc = S(z), [a, y0] = P(x - 1.2, 0.45, z), [b] = P(x + 1.2, 0.45, z), [, y1] = P(x, 0.9, z);
  shadowUnder(x, z, 1.2);
  X.fillStyle = NIGHT ? '#140f14' : '#7a4a2e'; X.fillRect(a, y0 - sc * 0.08, b - a, sc * 0.12); X.fillRect(a, y1, b - a, sc * 0.1);
  X.fillStyle = NIGHT ? '#0a0a12' : '#2a2a30'; for (const t of [0.1, 0.9]) X.fillRect(a + (b - a) * t - sc * 0.05, y0, sc * 0.1, sc * 0.45);
}
function lighthouse(x, z, h) {
  const sc = S(z), wdt = 2.6;
  poly(X, [P(x - wdt, 0, z), P(x + wdt, 0, z), P(x + wdt * 0.7, h, z), P(x - wdt * 0.7, h, z)], NIGHT ? '#26243e' : GOLD ? '#f4dcc8' : '#f6f3ec');
  if (!NIGHT || LIT) for (const y of [h * 0.22, h * 0.55]) { const a = 1 - y / h * 0.3; poly(X, [P(x - wdt * a, y, z - 0.05), P(x + wdt * a, y, z - 0.05), P(x + wdt * (a - 0.06), y + h * 0.14, z - 0.05), P(x - wdt * (a - 0.06), y + h * 0.14, z - 0.05)], NIGHT ? '#5a1c24' : '#c23a3a'); }
  if (NIGHT) { const f = { kind: 'front', L: 1, Wp: (u, v) => [x - wdt + u * wdt * 2, v, z - 0.1] }; X.save(); poly(X, quad(f, 0, 0, 1, h)); X.clip(); X.globalCompositeOperation = 'lighter'; const [, yb] = P(0, 0, z), [, yt] = P(0, h, z); const g = X.createLinearGradient(0, yb, 0, yt); g.addColorStop(0, 'rgba(255,220,180,0.32)'); g.addColorStop(1, 'rgba(255,220,180,0.05)'); X.fillStyle = g; X.fillRect(0, Math.min(yt, yb), W, Math.abs(yb - yt)); X.restore(); }
  poly(X, [P(x - wdt * 0.9, h, z), P(x + wdt * 0.9, h, z), P(x + wdt * 0.9, h + 0.8, z), P(x - wdt * 0.9, h + 0.8, z)], NIGHT ? '#100f1e' : '#2a2a30');
  poly(X, [P(x - wdt * 0.55, h + 0.8, z), P(x + wdt * 0.55, h + 0.8, z), P(x + wdt * 0.55, h + 3.6, z), P(x - wdt * 0.55, h + 3.6, z)], LIT ? '#fff1c8' : 'rgba(170,200,220,0.9)');
  poly(X, [P(x - wdt * 0.75, h + 3.6, z), P(x + wdt * 0.75, h + 3.6, z), P(x, h + 5.6, z)], NIGHT ? '#100f1e' : '#2a2a30');
  if (LIT) { const lp = P(x, h + 2.2, z); poly(G, [P(x - wdt * 0.55, h + 0.8, z), P(x + wdt * 0.55, h + 0.8, z), P(x + wdt * 0.55, h + 3.6, z), P(x - wdt * 0.55, h + 3.6, z)], 'rgba(255,236,190,1)'); glowDot(lp[0], lp[1], sc * 9, [255, 236, 190], 0.85);
    if (!FLIP) { X.save(); X.globalCompositeOperation = 'lighter'; const g = X.createLinearGradient(lp[0], lp[1], lp[0] - 300, lp[1] + 10); g.addColorStop(0, `rgba(255,240,205,${NIGHT ? 0.5 : 0.3})`); g.addColorStop(1, 'rgba(255,240,205,0)'); X.fillStyle = g; X.beginPath(); X.moveTo(lp[0], lp[1]); X.lineTo(lp[0] - 320, lp[1] - 30); X.lineTo(lp[0] - 320, lp[1] + 34); X.closePath(); X.fill(); X.restore(); } }
}
function speakeasyBuilding(o) {   // our side: the speakeasy itself, big enough to see into its windows
  const { x0, x1, z0, z1, h } = o, b = { x0, x1, z0, z1, h, mat: 'brick', noWin: true, seed: 4242, store: false, cornice: true, noClutter: true };
  drawBlock(b);
  const f = { kind: 'front', L: x1 - x0, Wp: (u, v) => [x0 + u, v, z0] }, fs = { kind: 'lit', L: z1 - z0, Wp: (u, v) => [x1, v, z0 + u] };
  const sc = S(z0);
  // a cornice + a band between floors
  for (const v of [h - 0.6, 3.9]) poly(X, quad(f, -0.2, v, f.L + 0.2, v + 0.45), NIGHT ? '#140c16' : '#c9b49a');
  // the windows: 2 upper floors × 2, the life inside
  const scenes = NIGHT ? [['tv', 'dance', 'dance'], ['plant', 'cat', 'tv']] : [['blind', 'plant', 'blind'], ['plant', 'curtain', 'plant']];
  [[4.5, 6.9], [7.5, 9.9]].forEach(([v0, v1], r) => [[1.0, 2.9], [4.2, 6.1], [7.4, 9.3]].forEach(([u0, u1], c) => {
    const pts = quad(f, u0, v0, u1, v1), [t, bt] = yrange(pts), xl = pts[0][0], xr = pts[2][0], kind = scenes[1 - r][c];
    poly(X, quad(f, u0 - 0.15, v0 - 0.2, u1 + 0.15, v0), NIGHT ? '#1a1018' : '#d8c8b0');   // the sill
    if (NIGHT) {
      const g = X.createLinearGradient(0, t, 0, bt); g.addColorStop(0, kind === 'tv' ? '#5a6cff' : '#ffc77a'); g.addColorStop(1, kind === 'tv' ? '#2a3080' : '#ff9a4a'); poly(X, pts, g); poly(G, pts, kind === 'tv' ? 'rgba(120,140,255,0.7)' : 'rgba(255,180,100,0.75)');
      // curtains at the sides
      X.fillStyle = 'rgba(120,20,40,0.85)'; X.fillRect(xl, t, (xr - xl) * 0.16, bt - t); X.fillRect(xr - (xr - xl) * 0.16, t, (xr - xl) * 0.16, bt - t);
      X.fillStyle = 'rgba(20,8,14,0.92)';
      if (kind === 'dance') { for (const [fx, up] of [[0.38, 1], [0.64, 0]]) { const cx = xl + (xr - xl) * fx, hh = (bt - t) * 0.62, by = bt;
        X.beginPath(); X.arc(cx, by - hh, hh * 0.13, 0, 7); X.fill(); X.beginPath(); X.moveTo(cx - hh * 0.16, by - hh * 0.85); X.lineTo(cx + hh * 0.16, by - hh * 0.85); X.lineTo(cx + hh * 0.2, by); X.lineTo(cx - hh * 0.2, by); X.fill();
        X.strokeStyle = 'rgba(20,8,14,0.92)'; X.lineWidth = hh * 0.09; X.lineCap = 'round'; X.beginPath(); X.moveTo(cx + hh * 0.14, by - hh * 0.8); X.lineTo(cx + hh * (up ? 0.32 : 0.3), by - hh * (up ? 1.15 : 0.6)); X.moveTo(cx - hh * 0.14, by - hh * 0.8); X.lineTo(cx - hh * (up ? 0.28 : 0.34), by - hh * (up ? 1.1 : 0.95)); X.stroke(); } }
      if (kind === 'cat') { const cx = xl + (xr - xl) * 0.5, by = bt, s2 = (bt - t) * 0.22; X.beginPath(); X.ellipse(cx, by - s2 * 0.9, s2 * 0.75, s2 * 0.9, 0, 0, 7); X.fill(); X.beginPath(); X.arc(cx, by - s2 * 2.05, s2 * 0.48, 0, 7); X.fill();
        poly(X, [[cx - s2 * 0.45, by - s2 * 2.25], [cx - s2 * 0.3, by - s2 * 2.8], [cx - s2 * 0.05, by - s2 * 2.4]], 'rgba(20,8,14,0.92)'); poly(X, [[cx + s2 * 0.45, by - s2 * 2.25], [cx + s2 * 0.3, by - s2 * 2.8], [cx + s2 * 0.05, by - s2 * 2.4]], 'rgba(20,8,14,0.92)');
        X.strokeStyle = 'rgba(20,8,14,0.92)'; X.lineWidth = s2 * 0.25; X.beginPath(); X.moveTo(cx + s2 * 0.6, by - s2 * 0.3); X.quadraticCurveTo(cx + s2 * 1.6, by - s2 * 0.2, cx + s2 * 1.3, by - s2 * 1.4); X.stroke(); }
      if (kind === 'tv') { const cx = xl + (xr - xl) * 0.42, by = bt, hh = (bt - t) * 0.42; X.beginPath(); X.arc(cx, by - hh, hh * 0.22, 0, 7); X.fill(); X.fillRect(cx - hh * 0.36, by - hh * 0.8, hh * 0.72, hh * 0.8); X.fillRect(cx - hh * 0.6, by - hh * 0.5, hh * 1.4, hh * 0.5); }
    } else {
      poly(X, pts, '#33415a'); X.save(); poly(X, pts); X.clip(); const g = X.createLinearGradient(0, t, 0, bt); g.addColorStop(0, 'rgba(220,235,255,0.7)'); g.addColorStop(0.6, 'rgba(160,190,230,0.1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); X.fillStyle = g; X.fillRect(0, t, W, bt - t);
      if (kind === 'blind') { X.fillStyle = 'rgba(240,230,210,0.9)'; X.fillRect(xl, t, xr - xl, (bt - t) * 0.45); }
      if (kind === 'curtain') { X.fillStyle = 'rgba(170,40,60,0.9)'; X.fillRect(xl, t, (xr - xl) * 0.22, bt - t); X.fillRect(xr - (xr - xl) * 0.22, t, (xr - xl) * 0.22, bt - t); }
      X.restore();
      if (kind === 'plant') { const cx = xl + (xr - xl) * 0.5, by = bt; X.fillStyle = '#b8643a'; X.fillRect(cx - (xr - xl) * 0.14, by - (bt - t) * 0.16, (xr - xl) * 0.28, (bt - t) * 0.16); for (let i = 0; i < 9; i++) { X.fillStyle = ['#3c8a4a', '#2f6e3c', '#58a25a'][i % 3]; X.beginPath(); X.ellipse(cx + Math.sin(i * 1.7) * (xr - xl) * 0.16, by - (bt - t) * (0.22 + (i % 4) * 0.06), (xr - xl) * 0.07, (bt - t) * 0.05, i, 0, 7); X.fill(); } }
    }
    // the window frame + mullion
    X.strokeStyle = NIGHT ? '#0e0810' : '#efe6d6'; X.lineWidth = Math.max(0.8, sc * 0.14); poly(X, pts); X.stroke(); X.beginPath(); X.moveTo((xl + xr) / 2, t); X.lineTo((xl + xr) / 2, bt); X.stroke();
  }));
  // the side wall's windows (smaller, lit)
  for (const v of [4.8, 7.8]) for (const u of [1.2, 4.4, 7.6]) { const pts = quad(fs, u, v, u + 1.6, v + 2.0); if (NIGHT) { poly(X, pts, 'rgba(255,200,120,0.85)'); poly(G, pts, 'rgba(255,190,110,0.5)'); } else poly(X, pts, '#3a4c68'); }
  // the door: unmarked, a sconce, the peephole slot, the little neon cocktail glass
  const du = f.L - 1.4, d = quad(f, du - 0.75, 0, du + 0.75, 2.6);
  poly(X, quad(f, du - 0.95, 0, du + 0.95, 2.85), '#07050a'); poly(X, d, NIGHT ? '#3c1e14' : '#5a2c1a');
  X.strokeStyle = NIGHT ? 'rgba(255,190,120,0.25)' : 'rgba(255,220,180,0.35)'; X.lineWidth = 0.8; poly(X, quad(f, du - 0.5, 1.45, du + 0.5, 2.35)); X.stroke(); poly(X, quad(f, du - 0.5, 0.2, du + 0.5, 1.25)); X.stroke();
  poly(X, quad(f, du - 0.3, 1.95, du + 0.3, 2.07), NIGHT ? '#ffbe5c' : '#1a1008'); if (NIGHT) glowDot(...PW(f, du, 2.0), sc * 0.7, [255, 180, 80], 0.8);
  const kn = PW(f, du + 0.5, 1.25); X.fillStyle = '#e8c070'; X.beginPath(); X.arc(kn[0], kn[1], Math.max(0.8, sc * 0.08), 0, 7); X.fill();
  const sp = PW(f, du, 3.2); X.fillStyle = NIGHT ? '#ffe6c0' : '#2a2a30'; X.fillRect(sp[0] - sc * 0.22, sp[1] - sc * 0.1, sc * 0.44, sc * 0.18); if (NIGHT) glowDot(sp[0], sp[1], sc * 3.2, [255, 196, 120], 0.55);
  const gp = PW(f, du + 1.6, 3.1), gc2 = hex(NEON.pink), s3 = sc * 0.42;
  if (NIGHT) { X.save(); X.shadowColor = rgb(gc2); X.shadowBlur = 8; }
  X.strokeStyle = NIGHT ? rgb(mix(gc2, [255, 255, 255], 0.4)) : 'rgba(120,90,100,0.85)'; X.lineWidth = Math.max(0.8, sc * 0.07);
  X.beginPath(); X.moveTo(gp[0] - s3, gp[1] - s3 * 0.8); X.lineTo(gp[0] + s3, gp[1] - s3 * 0.8); X.lineTo(gp[0], gp[1] + s3 * 0.2); X.closePath(); X.moveTo(gp[0], gp[1] + s3 * 0.2); X.lineTo(gp[0], gp[1] + s3 * 0.9); X.moveTo(gp[0] - s3 * 0.5, gp[1] + s3 * 0.9); X.lineTo(gp[0] + s3 * 0.5, gp[1] + s3 * 0.9); X.stroke();
  if (NIGHT) { X.restore(); glowDot(gp[0], gp[1], sc * 1.8, gc2, 0.6); }
  // a striped awning over the ground floor window to the left of the door
  { // a crafted awning: it slopes out from the wall, stripes, a scalloped valance with lettering, its shadow on the wall
    const ua = f.L - 5.3, ub = f.L - 2.4, top = 3.75, bot = 2.95, out = 1.3;
    const T0 = PW(f, ua, top), T1 = PW(f, ub, top), B0 = P(x0 + ua, bot, z0 - out), B1 = P(x0 + ub, bot, z0 - out);
    if (!NIGHT) { X.fillStyle = 'rgba(30,20,30,0.28)'; X.filter = 'blur(1.5px)'; poly(X, [PW(f, ua - 0.2, bot + 0.1), PW(f, ub - 0.3, bot + 0.1), PW(f, ub - 0.6, bot - 0.9), PW(f, ua - 0.5, bot - 0.9)]); X.fill(); X.filter = 'none'; }
    const n = 8; for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n, l = (a2, b2, t) => [a2[0] + (b2[0] - a2[0]) * t, a2[1] + (b2[1] - a2[1]) * t];
      const q = [l(T0, T1, t0), l(T0, T1, t1), l(B0, B1, t1), l(B0, B1, t0)]; const gg = X.createLinearGradient(0, q[0][1], 0, q[3][1]);
      const base = i % 2 ? (NIGHT ? '#2a1418' : '#f4ead0') : (NIGHT ? '#3a0e1a' : '#a8242e'); gg.addColorStop(0, rgb(mix(base, '#ffffff', NIGHT ? 0 : 0.12))); gg.addColorStop(1, rgb(mix(base, '#000000', 0.22))); poly(X, q, gg); }
    const V0 = P(x0 + ua, bot - 0.45, z0 - out), V1 = P(x0 + ub, bot - 0.45, z0 - out);
    poly(X, [B0, B1, V1, V0], NIGHT ? '#2a0c16' : '#8a1c24');
    const sw2 = (B1[0] - B0[0]) / 10; for (let i = 0; i < 10; i++) { X.fillStyle = NIGHT ? '#2a0c16' : '#8a1c24'; X.beginPath(); X.arc(V0[0] + sw2 * (i + 0.5), V0[1], sw2 * 0.5, 0, Math.PI); X.fill(); }
    X.font = `700 ${Math.abs(V0[1] - B0[1]) * 0.6}px Inter`; X.textAlign = 'center'; X.textBaseline = 'middle'; X.letterSpacing = '1px'; X.fillStyle = NIGHT ? 'rgba(255,214,160,0.75)' : '#f4ead0'; X.fillText('EST. 1924', (B0[0] + B1[0]) / 2, (B0[1] + V0[1]) / 2); X.letterSpacing = '0px';
  }
  const sw = quad(f, f.L - 5.1, 0.4, f.L - 2.6, 2.8); if (NIGHT) { poly(X, sw, 'rgba(255,205,140,0.9)'); poly(G, sw, 'rgba(255,190,110,0.6)'); } else { poly(X, sw, '#2c3346'); }
  if (o.waterTower) waterTower({ x0, x1, z0, h, y0: 0, waterX: x0 + 1.6 });
  rooftopLane(o);
}


function stageDetails() {
  if (!NIGHT) {   // paving stones with a faint texture
    const [, y0] = P(0, 0, 54), [, y1] = P(0, 0, 30); X.save(); X.beginPath(); X.rect(0, y0, W, y1 - y0); X.clip();
    rs(17); for (let z = 30; z < 54; z += 1.2) for (let x = -24; x < 24; x += 1.2) { const a = P(x, 0.005, z), c = P(x + 1.15, 0.005, z + 1.15); X.fillStyle = `rgba(${R() < 0.5 ? '255,250,240' : '120,100,80'},${0.025 + R() * 0.035})`; X.fillRect(a[0], c[1], c[0] - a[0], a[1] - c[1]); }
    X.restore();
  }
  // planters with flowers along the speakeasy
  for (const x of [-5.4, 0.4]) { const z = 43, sc = S(z), [a, y] = P(x - 0.7, 0.9, z), [b2, yb] = P(x + 0.7, 0, z);
    shadowUnder(x, z, 0.8); X.fillStyle = NIGHT ? '#100c12' : '#8a5a3a'; X.fillRect(a, y, b2 - a, yb - y); X.fillStyle = NIGHT ? '#160f16' : '#a06a44'; X.fillRect(a - sc * 0.08, y, b2 - a + sc * 0.16, sc * 0.12);
    rs(x * 9 + 5); for (let i = 0; i < 16; i++) { X.fillStyle = NIGHT ? '#140c14' : ['#3c8a4a', '#2f6e3c'][i % 2]; X.beginPath(); X.arc(a + R() * (b2 - a), y - R() * sc * 0.5, sc * 0.16, 0, 7); X.fill(); }
    for (let i = 0; i < 9; i++) { X.fillStyle = NIGHT ? '#2a1420' : ['#e84a6a', '#f2c23a', '#ff8a3a', '#d86af0'][i % 4]; X.beginPath(); X.arc(a + R() * (b2 - a), y - R() * sc * 0.55, sc * 0.1, 0, 7); X.fill(); } }
  // a hydrant + a newspaper box
  { const z = 41, sc = S(z), [hx, hy] = P(14.2, 0, z); shadowUnder(14.2, z, 0.3); X.fillStyle = NIGHT ? '#140a0e' : '#c8322e'; X.fillRect(hx - sc * 0.18, hy - sc * 0.75, sc * 0.36, sc * 0.75); X.beginPath(); X.arc(hx, hy - sc * 0.75, sc * 0.2, Math.PI, 0); X.fill(); X.fillRect(hx - sc * 0.3, hy - sc * 0.55, sc * 0.6, sc * 0.12); }
  { const z = 42, sc = S(z), [nx, ny] = P(-1.6, 0, z); shadowUnder(-1.6, z, 0.4); X.fillStyle = NIGHT ? '#0a0c16' : '#2f5fae'; X.fillRect(nx - sc * 0.3, ny - sc * 1.1, sc * 0.6, sc * 1.1); X.fillStyle = NIGHT ? '#151a2a' : '#e8eef6'; X.fillRect(nx - sc * 0.24, ny - sc * 1.0, sc * 0.48, sc * 0.3); }
}

// ---------------------------------------------------------------- HERO PIECES (crafted): tube neon, signs, the riverboat, the lighthouse, the cart
function tubeText(txt, x, y, size, col, o = {}) {   // neon as bent glass tubes: a coloured body, a thinner white-hot core, a wide glow; clear glass by day
  const c = typeof col === 'string' ? hex(col) : col, sp = o.spacing ?? 0.08;
  const set = (ctx, wgt) => { ctx.font = `${wgt} ${size}px Inter`; ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle'; ctx.letterSpacing = `${size * sp}px`; };
  if (LIT && !o.off) {
    set(G, 600); G.lineWidth = size * 0.16; G.lineJoin = 'round'; G.strokeStyle = rgb(c, 0.95 * NEONK); G.strokeText(txt, x, y); G.fillStyle = rgb(c, NEONK); G.fillText(txt, x, y);
    set(X, 400); X.lineWidth = size * 0.07; X.lineJoin = 'round'; X.strokeStyle = rgb(c, 0.95 * NEONK); X.strokeText(txt, x, y); X.fillStyle = rgb(mix(c, [255, 255, 255], 0.35), NEONK); X.fillText(txt, x, y);
    set(X, 200); X.fillStyle = rgb(mix(c, [255, 255, 255], 0.85), NEONK); X.fillText(txt, x, y);
    glowDot(x, y, size * txt.length * 0.45, c, 0.12 * NEONK);
  } else {
    set(X, 400); X.fillStyle = 'rgba(40,40,55,0.35)'; X.fillText(txt, x + size * 0.03, y + size * 0.03);   // the tube's shadow on the backing
    X.fillStyle = rgb(mix(c, [255, 255, 255], 0.55), 0.85); X.fillText(txt, x, y);
    set(X, 200); X.fillStyle = 'rgba(255,255,255,0.85)'; X.fillText(txt, x - size * 0.01, y - size * 0.02);  // a glint along the glass
  }
  X.letterSpacing = '0px'; G.letterSpacing = '0px';
}
function roofTube(b, s) {   // letters on a steel scaffold with a catwalk, standing on a roof
  if (FLIP) { if (LIT) { const sc = S(b.z0), [x, y] = P(b.x0 + (b.x1 - b.x0) / 2, b.y0 + b.h + s.size * 0.7, b.z0); G.fillStyle = rgb(hex(s.col), 0.5); G.fillRect(x - s.text.length * s.size * sc * 0.33, y - s.size * sc * 0.4, s.text.length * s.size * sc * 0.66, s.size * sc * 0.8); } return; }
  const z = b.z0 + 0.6, sc = S(z), cx = b.x0 + (s.u ?? (b.x1 - b.x0) / 2), size = s.size * sc, [x, y] = P(cx, b.y0 + b.h + s.size * 0.85, z), [, ybase] = P(cx, b.y0 + b.h, z);
  X.font = `400 ${size}px Inter`; X.letterSpacing = `${size * 0.08}px`; const tw = X.measureText(s.text).width; X.letterSpacing = '0px';
  const steel = NIGHT ? '#141226' : GOLD ? '#6a5060' : '#6a6a74';
  X.strokeStyle = steel; X.lineWidth = Math.max(0.5, sc * 0.08); X.beginPath();
  for (let gx = -tw / 2 - size * 0.1; gx <= tw / 2 + size * 0.15; gx += size * 0.45) { X.moveTo(x + gx, ybase); X.lineTo(x + gx, y - size * 0.45); }
  for (const fy of [ybase, y + size * 0.55, y - size * 0.45]) { X.moveTo(x - tw / 2 - size * 0.15, fy); X.lineTo(x + tw / 2 + size * 0.15, fy); }
  for (let gx = -tw / 2; gx < tw / 2; gx += size * 0.45) { X.moveTo(x + gx, ybase); X.lineTo(x + gx + size * 0.45, y + size * 0.55); }
  X.stroke();
  X.fillStyle = steel; X.fillRect(x - tw / 2 - size * 0.2, y + size * 0.55, tw + size * 0.4, Math.max(0.8, sc * 0.18));   // the catwalk
  tubeText(s.text, x, y, size, s.col);
  if (LIT) { glowDot(x, y, tw * 0.7, hex(s.col), 0.22 * NEONK); }
}
function bladeCab(b, s) {   // a blade sign built like a real one: an enamel cabinet with depth, chaser bulbs, brackets, tube letters, light spilling on the wall
  const z = b.z0 - 1.4, sc = S(z), cx = b.x0 + s.u, wU = s.w || 2.2, a = P(cx - wU / 2, b.y0 + s.v1, z), c = P(cx + wU / 2, b.y0 + s.v0, z);
  const x0 = a[0], y0 = a[1], w = c[0] - a[0], h = c[1] - a[1], d = sc * 0.55, col = hex(s.col), face = s.face || '#5a1420';
  if (FLIP) { if (LIT) { G.fillStyle = rgb(col, 0.55); G.fillRect(x0, y0, w, h); } return; }
  // brackets + conduit to the wall
  const [wx] = P(cx + wU / 2 + 1.2, 0, b.z0); X.strokeStyle = NIGHT ? '#0c0b16' : '#2a2a30'; X.lineWidth = Math.max(0.8, sc * 0.12);
  for (const yy of [y0 + h * 0.08, y0 + h * 0.92]) { X.beginPath(); X.moveTo(x0 + w, yy); X.lineTo(wx, yy); X.stroke(); }
  X.lineWidth = Math.max(0.5, sc * 0.06); X.beginPath(); X.moveTo(x0 + w * 0.5, y0 + h); X.lineTo(x0 + w * 0.5, y0 + h + sc * 0.8); X.lineTo(wx, y0 + h + sc * 0.8); X.stroke();
  X.fillStyle = NIGHT ? '#0c0b16' : '#3a3a42'; X.fillRect(wx - sc * 0.5, y0 + h + sc * 0.4, sc * 0.5, sc * 0.8);
  // the day shadow on the wall (the sun is to the right)
  if (!NIGHT) { X.fillStyle = 'rgba(30,20,30,0.22)'; X.beginPath(); X.roundRect(x0 - sc * 0.9, y0 + sc * 0.5, w, h, w * 0.1); X.fill(); }
  // the cabinet's side, then its face
  poly(X, [[x0 + w, y0], [x0 + w + d, y0 + d * 0.3], [x0 + w + d, y0 + h - d * 0.3], [x0 + w, y0 + h]], NIGHT ? '#0b0910' : rgb(mix(face, '#000000', 0.45)));
  const g = X.createLinearGradient(x0, 0, x0 + w, 0); g.addColorStop(0, rgb(mix(face, '#000000', NIGHT ? 0.75 : 0.15))); g.addColorStop(0.5, rgb(mix(face, '#ffffff', NIGHT ? 0 : 0.12))); g.addColorStop(1, rgb(mix(face, '#000000', NIGHT ? 0.8 : 0.25)));
  X.fillStyle = g; X.beginPath(); X.roundRect(x0, y0, w, h, w * 0.12); X.fill();
  X.strokeStyle = NIGHT ? 'rgba(255,215,150,0.35)' : 'rgba(236,200,120,0.95)'; X.lineWidth = Math.max(0.6, w * 0.05); X.stroke();   // the brass trim
  // chaser bulbs around the edge
  const n = Math.round((w + h) * 2 / (sc * 0.75));
  for (let i = 0; i < n; i++) { const t = i / n * 2 * (w + h); let px, py; if (t < w) { px = x0 + t; py = y0 + w * 0.09; } else if (t < w + h) { px = x0 + w - w * 0.09; py = y0 + (t - w); } else if (t < 2 * w + h) { px = x0 + w - (t - w - h); py = y0 + h - w * 0.09; } else { px = x0 + w * 0.09; py = y0 + h - (t - 2 * w - h); }
    const on = LIT && i % 3 !== 0; X.fillStyle = on ? '#fff0c8' : NIGHT ? '#3a3020' : '#f4ead0'; X.beginPath(); X.arc(px, py, Math.max(0.5, sc * 0.11), 0, 7); X.fill(); if (on) { G.fillStyle = 'rgba(255,210,140,0.8)'; G.beginPath(); G.arc(px, py, sc * 0.4, 0, 7); G.fill(); } }
  // rivets
  if (!NIGHT) for (const [rx, ry] of [[0.25, 0.2], [0.75, 0.2], [0.25, 0.8], [0.75, 0.8]]) { X.fillStyle = 'rgba(255,255,255,0.4)'; X.beginPath(); X.arc(x0 + w * rx, y0 + h * (ry < 0.5 ? 0.04 : 0.96), Math.max(0.4, sc * 0.05), 0, 7); X.fill(); }
  // the tube letters, stacked
  const m = s.text.length, step = (h * 0.86) / m, size = Math.min(w * 0.62, step * 0.95);
  [...s.text].forEach((ch, i) => tubeText(ch, x0 + w / 2, y0 + h * 0.07 + step * (i + 0.5), size, col, { spacing: 0 }));
  // its light spilling onto the wall and into the street below
  if (LIT) { glowDot(x0 + w / 2, y0 + h / 2, Math.max(w, h) * 0.9, col, 0.28 * NEONK); streaks.push({ x: x0 + w / 2, col, a: 0.35, w: w * 0.6, z: b.z0 }); }
}
function riverboat(x, z, dir = 1) {   // ROSIE: a 1920s riverboat with a curved bow, decks, railings, a stack, lifebuoys, bulbs
  const sc = S(z), L = 26, x0 = x - L / 2, x1 = x + L / 2, bow = dir > 0 ? x1 : x0, stern = dir > 0 ? x0 : x1, s1 = dir;
  const Pp = (xx, yy) => P(xx, yy, z);
  const night = NIGHT;
  // the hull: a sweeping sheer line rising to the bow, a curved stem, a dark boot-top at the waterline
  const hullTop = [Pp(stern, 2.6), Pp(x - s1 * 4, 2.5), Pp(bow - s1 * 2, 3.0), Pp(bow + s1 * 0.6, 3.6)];
  X.beginPath(); X.moveTo(...hullTop[0]); X.bezierCurveTo(...hullTop[1], ...hullTop[2], ...hullTop[3]);
  const st = Pp(bow - s1 * 1.6, -0.2), sb = Pp(stern + s1 * 0.8, -0.2), sm = Pp(bow + s1 * 0.2, 0.6);
  X.quadraticCurveTo(sm[0], sm[1], st[0], st[1]); X.lineTo(sb[0], sb[1]); const sq = Pp(stern - s1 * 0.3, 1.0); X.quadraticCurveTo(sq[0], sq[1], hullTop[0][0], hullTop[0][1]); X.closePath();
  const [, ht] = Pp(0, 3.6), [, hb] = Pp(0, -0.2); const g = X.createLinearGradient(0, FLIP ? hb : ht, 0, FLIP ? ht : hb);
  if (night) { g.addColorStop(0, '#1c1a34'); g.addColorStop(1, '#08070f'); } else { g.addColorStop(0, GOLD ? '#fff0e0' : '#ffffff'); g.addColorStop(0.6, GOLD ? '#e8c8b8' : '#e8e4dc'); g.addColorStop(1, GOLD ? '#a88a8a' : '#b8b2a6'); }
  X.fillStyle = g; X.fill();
  X.save(); X.clip(); const bt = Pp(0, 0.75); X.fillStyle = night ? '#120810' : '#8a1f2a'; X.fillRect(0, Math.min(bt[1], hb), W, Math.abs(hb - bt[1])); X.fillStyle = night ? 'rgba(0,0,0,0)' : 'rgba(255,255,255,0.35)'; const gl = Pp(0, 2.3); X.fillRect(0, gl[1], W, Math.max(0.6, sc * 0.08)); X.restore();
  // portholes
  for (let u = stern + s1 * 2.2; (u - bow) * s1 < -3; u += s1 * 1.4) { const p = Pp(u, 1.55); X.fillStyle = night ? '#ffcf86' : '#2a3448'; X.beginPath(); X.arc(p[0], p[1], Math.max(0.6, sc * 0.17), 0, 7); X.fill(); X.strokeStyle = night ? 'rgba(255,200,120,0.4)' : '#c8c0b0'; X.lineWidth = Math.max(0.3, sc * 0.05); X.stroke(); if (night) { G.fillStyle = 'rgba(255,190,110,0.8)'; G.beginPath(); G.arc(p[0], p[1], sc * 0.4, 0, 7); G.fill(); } }
  // the decks: a long cabin, an upper cabin, the pilot house, each with windows and a railing above
  const deck = (xa, xb, ya, yb, n) => {
    const pts = [Pp(xa, ya), Pp(xb, ya), Pp(xb, yb), Pp(xa, yb)];
    const gg = X.createLinearGradient(0, pts[2][1], 0, pts[0][1]); gg.addColorStop(0, night ? '#22203c' : GOLD ? '#f6e2d4' : '#faf8f2'); gg.addColorStop(1, night ? '#15132a' : GOLD ? '#d8b8a8' : '#dcd6ca'); poly(X, pts, gg);
    const wn = n, ww = (xb - xa) / wn;
    for (let i = 0; i < wn; i++) { const u0 = xa + ww * (i + 0.18), u1 = xa + ww * (i + 0.82), q2 = [Pp(u0, ya + (yb - ya) * 0.25), Pp(u1, ya + (yb - ya) * 0.25), Pp(u1, ya + (yb - ya) * 0.8), Pp(u0, ya + (yb - ya) * 0.8)];
      if (LIT) { const cc = hex(WARM[Math.abs(i * 3 + Math.round(xa)) % 5]); poly(X, q2, rgb(cc)); poly(G, q2, rgb(cc, 0.55)); } else { poly(X, q2, GOLD ? '#ffb07a' : '#34465e'); const q3 = [q2[0], q2[1], Pp(u1, ya + (yb - ya) * 0.55), Pp(u0, ya + (yb - ya) * 0.55)]; poly(X, q3, GOLD ? 'rgba(255,230,190,0.5)' : 'rgba(200,225,250,0.45)'); } }
    // railing
    const r0 = Pp(xa - 0.3, yb + 0.9), r1 = Pp(xb + 0.3, yb + 0.9); line(X, [r0, r1], night ? '#3a3858' : '#f4f2ec', Math.max(0.4, sc * 0.07));
    for (let u = xa - 0.3; u <= xb + 0.3; u += 0.8) line(X, [Pp(u, yb), Pp(u, yb + 0.9)], night ? '#2a2846' : '#e8e4dc', Math.max(0.3, sc * 0.05));
    poly(X, [Pp(xa - 0.4, yb), Pp(xb + 0.4, yb), Pp(xb + 0.4, yb + 0.25), Pp(xa - 0.4, yb + 0.25)], night ? '#0e0c1c' : '#7a1f2a');
  };
  const lo = Math.min(stern + s1 * 2, bow - s1 * 4.5), hi = Math.max(stern + s1 * 2, bow - s1 * 4.5);
  deck(lo, hi, 2.6, 4.9, 12);
  const lo2 = lo + 3, hi2 = hi - 4; deck(lo2, hi2, 4.9, 6.9, 8);
  const ph = dir > 0 ? hi2 - 2.6 : lo2 + 0.6; deck(ph, ph + 2, 6.9, 8.4, 2);
  // the smokestack (a band, a black top), a little smoke by day
  const sx = dir > 0 ? lo2 + 2.5 : hi2 - 2.5, stk = [Pp(sx - 0.6, 6.9), Pp(sx + 0.6, 6.9), Pp(sx + 0.7, 11), Pp(sx - 0.5, 11)];
  poly(X, stk, night ? '#1a1020' : '#b8323e'); poly(X, [Pp(sx - 0.55, 9.6), Pp(sx + 0.65, 9.6), Pp(sx + 0.68, 10.3), Pp(sx - 0.52, 10.3)], night ? '#0e0c1c' : '#f4f0e6'); poly(X, [Pp(sx - 0.5, 10.6), Pp(sx + 0.7, 10.6), Pp(sx + 0.7, 11), Pp(sx - 0.5, 11)], '#111');
  if (!FLIP && !NIGHT) for (let i = 0; i < 5; i++) { const p = Pp(sx + 0.1 - s1 * i * 0.9, 11.6 + i * 0.8); X.fillStyle = `rgba(240,240,245,${0.35 - i * 0.06})`; X.beginPath(); X.arc(p[0], p[1], sc * (0.6 + i * 0.25), 0, 7); X.fill(); }
  // lifebuoys on the cabin
  for (const u of [lo + 2.2, hi - 2.2]) { const p = Pp(u, 3.75), r = Math.max(1, sc * 0.42); X.strokeStyle = night ? '#3a1020' : '#e8e2d6'; X.lineWidth = r * 0.5; X.beginPath(); X.arc(p[0], p[1], r * 0.75, 0, 7); X.stroke(); if (!night) { X.strokeStyle = '#c8323e'; for (let k = 0; k < 4; k++) { X.beginPath(); X.arc(p[0], p[1], r * 0.75, k * Math.PI / 2, k * Math.PI / 2 + 0.5); X.stroke(); } } }
  // flag staffs fore + aft, the strings of bulbs over the top
  const fA = Pp(stern, 2.6), fA2 = Pp(stern, 7.6), fB = Pp(bow + s1 * 0.3, 3.6), fB2 = Pp(bow + s1 * 0.3, 8.6), top = Pp(sx, 11);
  line(X, [fA, fA2], night ? '#2a2846' : '#555', Math.max(0.4, sc * 0.07)); line(X, [fB, fB2], night ? '#2a2846' : '#555', Math.max(0.4, sc * 0.07));
  if (!FLIP && !NIGHT) for (const [p, c2] of [[fA2, '#2f6fb8'], [fB2, '#c8323e']]) { X.fillStyle = c2; X.beginPath(); X.moveTo(p[0], p[1]); X.quadraticCurveTo(p[0] - s1 * sc * 0.6, p[1] + sc * 0.2, p[0] - s1 * sc * 1.3, p[1] + sc * 0.1); X.lineTo(p[0] - s1 * sc * 1.2, p[1] + sc * 0.8); X.lineTo(p[0], p[1] + sc * 0.7); X.fill(); }
  const cols = [NEON.pink, NEON.cyan, NEON.gold, NEON.violet, NEON.mint];
  for (const [pa, pb] of [[fA2, top], [top, fB2]]) { const n = 16; for (let i = 1; i < n; i++) { const t = i / n, px = pa[0] + (pb[0] - pa[0]) * t, py = pa[1] + (pb[1] - pa[1]) * t + Math.sin(t * Math.PI) * sc * 1.1 * (FLIP ? -1 : 1);
    if (i === 1) { X.strokeStyle = night ? 'rgba(60,58,90,0.6)' : 'rgba(80,80,90,0.5)'; X.lineWidth = 0.5; X.beginPath(); for (let k = 0; k <= n; k++) { const tt = k / n; const qx = pa[0] + (pb[0] - pa[0]) * tt, qy = pa[1] + (pb[1] - pa[1]) * tt + Math.sin(tt * Math.PI) * sc * 1.1 * (FLIP ? -1 : 1); k ? X.lineTo(qx, qy) : X.moveTo(qx, qy); } X.stroke(); }
    const c = hex(cols[i % cols.length]); X.fillStyle = LIT ? rgb(mix(c, [255, 255, 255], 0.45)) : rgb(mix(c, [255, 255, 255], 0.5), 0.9); X.beginPath(); X.arc(px, py, Math.max(0.6, sc * 0.15), 0, 7); X.fill(); if (LIT) { G.fillStyle = rgb(c, 0.9); G.beginPath(); G.arc(px, py, sc * 0.55, 0, 7); G.fill(); } } }
  // the neon line along the sheer + her name on the bow
  if (LIT) { X.save(); X.beginPath(); X.moveTo(...Pp(stern, 2.45)); X.bezierCurveTo(...Pp(x - s1 * 4, 2.35), ...Pp(bow - s1 * 2, 2.85), ...Pp(bow + s1 * 0.4, 3.45)); X.strokeStyle = rgb(hex(NEON.pink), 0.95 * NEONK); X.lineWidth = Math.max(0.6, sc * 0.14); X.stroke(); G.strokeStyle = rgb(hex(NEON.pink), 0.9); G.lineWidth = sc * 0.7; G.beginPath(); G.moveTo(...Pp(stern, 2.45)); G.bezierCurveTo(...Pp(x - s1 * 4, 2.35), ...Pp(bow - s1 * 2, 2.85), ...Pp(bow + s1 * 0.4, 3.45)); G.stroke(); X.restore(); }
  if (!FLIP) { const p = Pp(bow - s1 * 3.4, 1.6); X.font = `italic 700 ${sc * 1.05}px "DejaVu Serif"`; X.textAlign = 'center'; X.textBaseline = 'middle'; X.fillStyle = night ? '#ffd27a' : '#c9a24a'; X.fillText('Rosie', p[0], p[1]); if (night) { G.font = X.font; G.textAlign = 'center'; G.textBaseline = 'middle'; G.fillStyle = 'rgba(255,200,110,0.8)'; G.fillText('Rosie', p[0], p[1]); } }
  // the wake: foam at the bow and along the hull
  if (!FLIP) { const w0 = Pp(stern - s1 * 6, 0), w1 = Pp(bow + s1 * 1.2, 0); X.fillStyle = night ? 'rgba(200,200,255,0.16)' : 'rgba(255,255,255,0.75)'; X.beginPath(); X.ellipse((w0[0] + w1[0]) / 2, w0[1] + 0.5, Math.abs(w1[0] - w0[0]) / 2, Math.max(0.8, sc * 0.18), 0, 0, 7); X.fill();
    const bw = Pp(bow + s1 * 0.4, 0); X.fillStyle = night ? 'rgba(220,220,255,0.25)' : 'rgba(255,255,255,0.9)'; X.beginPath(); X.ellipse(bw[0], bw[1], sc * 1.4, sc * 0.3, 0, 0, 7); X.fill(); }
}
function lighthouse2(x, z, h) {   // a round tower (lit on the sun's side), a stone base, a gallery with its railing, a glass lantern, a dome; the keeper's cottage
  const sc = S(z), r0 = 2.4, r1 = 1.7, Pp = (xx, yy) => P(xx, yy, z);
  // the keeper's cottage beside it
  const kx = x + 3.4, kw = 5;
  poly(X, [Pp(kx, 1.4), Pp(kx + kw, 1.4), Pp(kx + kw, 4.6), Pp(kx, 4.6)], NIGHT ? '#1c1a34' : GOLD ? '#f0d8c4' : '#f2ece0');
  poly(X, [Pp(kx - 0.4, 4.6), Pp(kx + kw + 0.4, 4.6), Pp(kx + kw / 2, 6.6)], NIGHT ? '#140f1c' : '#8a2a2a');
  poly(X, [Pp(kx + kw * 0.72, 5.2), Pp(kx + kw * 0.85, 5.2), Pp(kx + kw * 0.85, 6.8), Pp(kx + kw * 0.72, 6.8)], NIGHT ? '#100d18' : '#6a4a3a');
  for (const u of [0.18, 0.62]) { const q = [Pp(kx + kw * u, 2.4), Pp(kx + kw * (u + 0.2), 2.4), Pp(kx + kw * (u + 0.2), 3.9), Pp(kx + kw * u, 3.9)]; if (LIT) { poly(X, q, '#ffcf86'); poly(G, q, 'rgba(255,190,110,0.7)'); } else poly(X, q, '#34465e'); }
  // the stone base
  poly(X, [Pp(x - r0 - 1, 0), Pp(x + r0 + 1, 0), Pp(x + r0 + 0.8, 2.2), Pp(x - r0 - 0.8, 2.2)], NIGHT ? '#151428' : GOLD ? '#a89080' : '#9a9284');
  if (!NIGHT) for (let yy = 0.5; yy < 2.2; yy += 0.55) { const a = Pp(x - r0 - 0.9, yy), b2 = Pp(x + r0 + 0.9, yy); X.fillStyle = 'rgba(40,35,40,0.25)'; X.fillRect(a[0], a[1], b2[0] - a[0], 0.6); }
  // the tower: a round gradient (the sun to the right by day; floodlit from below at night)
  const tw = [Pp(x - r0, 2.2), Pp(x + r0, 2.2), Pp(x + r1, h), Pp(x - r1, h)];
  const gx0 = tw[0][0], gx1 = tw[1][0], g = X.createLinearGradient(gx0, 0, gx1, 0);
  if (NIGHT) { g.addColorStop(0, '#16142a'); g.addColorStop(0.55, '#2a2846'); g.addColorStop(1, '#1c1a34'); } else { g.addColorStop(0, GOLD ? '#a88c98' : '#bdb8b0'); g.addColorStop(0.45, GOLD ? '#f0d8c8' : '#f2efe8'); g.addColorStop(0.8, GOLD ? '#ffe0c0' : '#ffffff'); g.addColorStop(1, GOLD ? '#e8b898' : '#e2ddd4'); }
  poly(X, tw, g);
  X.save(); poly(X, tw); X.clip();
  for (const [ya, yb] of [[h * 0.25, h * 0.38], [h * 0.6, h * 0.73]]) { const a = Pp(x - r0, ya), b2 = Pp(x + r0, yb); const gr = X.createLinearGradient(gx0, 0, gx1, 0); gr.addColorStop(0, NIGHT ? '#2a0e16' : '#7a1f24'); gr.addColorStop(0.6, NIGHT ? '#4a1620' : '#d23a3a'); gr.addColorStop(1, NIGHT ? '#3a1018' : '#b8302e'); X.fillStyle = gr; X.fillRect(0, b2[1], W, a[1] - b2[1]); }
  if (NIGHT) { const [, yb] = Pp(0, 2.2), [, yt] = Pp(0, h); const fg = X.createLinearGradient(0, yb, 0, yt); fg.addColorStop(0, 'rgba(255,214,170,0.4)'); fg.addColorStop(0.6, 'rgba(255,214,170,0.08)'); fg.addColorStop(1, 'rgba(255,214,170,0)'); X.globalCompositeOperation = 'lighter'; X.fillStyle = fg; X.fillRect(0, yt, W, yb - yt); X.globalCompositeOperation = 'source-over'; }
  X.restore();
  // a door + two little windows up the tower
  poly(X, [Pp(x - 0.5, 2.2), Pp(x + 0.5, 2.2), Pp(x + 0.5, 4.2), Pp(x - 0.5, 4.2)], NIGHT ? '#0a0810' : '#3a2a22');
  for (const yy of [h * 0.48, h * 0.85]) { const q = [Pp(x - 0.3, yy), Pp(x + 0.3, yy), Pp(x + 0.3, yy + 1.1), Pp(x - 0.3, yy + 1.1)]; if (LIT) { poly(X, q, '#ffcf86'); poly(G, q, 'rgba(255,190,110,0.6)'); } else poly(X, q, '#2a3448'); }
  // the gallery + its railing
  poly(X, [Pp(x - r1 - 1, h), Pp(x + r1 + 1, h), Pp(x + r1 + 1, h + 0.45), Pp(x - r1 - 1, h + 0.45)], NIGHT ? '#0e0d1c' : '#2a2a30');
  line(X, [Pp(x - r1 - 1, h + 1.4), Pp(x + r1 + 1, h + 1.4)], NIGHT ? '#2a2846' : '#2a2a30', Math.max(0.4, sc * 0.08));
  for (let u = -r1 - 1; u <= r1 + 1.01; u += 0.55) line(X, [Pp(x + u, h + 0.45), Pp(x + u, h + 1.4)], NIGHT ? '#2a2846' : '#2a2a30', Math.max(0.3, sc * 0.05));
  // the lantern: glass panes with mullions, the lamp inside
  const lp = [Pp(x - r1 * 0.7, h + 0.45), Pp(x + r1 * 0.7, h + 0.45), Pp(x + r1 * 0.7, h + 3.4), Pp(x - r1 * 0.7, h + 3.4)];
  poly(X, lp, LIT ? '#fff3cf' : GOLD ? 'rgba(255,200,150,0.9)' : 'rgba(175,205,225,0.95)');
  if (!LIT) { const c0 = Pp(x, h + 1.9); X.fillStyle = 'rgba(255,240,200,0.9)'; X.beginPath(); X.arc(c0[0], c0[1], sc * 0.5, 0, 7); X.fill(); }
  for (let u = -r1 * 0.7; u <= r1 * 0.7 + 0.01; u += r1 * 0.47) line(X, [Pp(x + u, h + 0.45), Pp(x + u, h + 3.4)], NIGHT ? '#3a3020' : '#2a2a30', Math.max(0.4, sc * 0.08));
  // the dome cap, the ball vent, the rod
  const dc = Pp(x, h + 3.4); X.fillStyle = NIGHT ? '#140f1c' : '#2a2a30'; X.beginPath(); X.ellipse(dc[0], dc[1], r1 * 0.95 * sc, 1.6 * sc, 0, Math.PI, 0); X.fill();
  const bv = Pp(x, h + 5.1); X.beginPath(); X.arc(bv[0], bv[1], sc * 0.3, 0, 7); X.fill(); line(X, [bv, Pp(x, h + 6.4)], NIGHT ? '#140f1c' : '#2a2a30', Math.max(0.4, sc * 0.05));
  if (!NIGHT && !GOLD) { X.fillStyle = 'rgba(255,255,255,0.35)'; X.beginPath(); X.ellipse(dc[0] + r1 * 0.35 * sc, dc[1] - 0.8 * sc, r1 * 0.25 * sc, 0.5 * sc, 0, 0, 7); X.fill(); }
  if (LIT) { const lc = Pp(x, h + 1.9); poly(G, lp, 'rgba(255,236,190,1)'); glowDot(lc[0], lc[1], sc * 8, [255, 236, 190], 0.85);
    if (!FLIP) { X.save(); X.globalCompositeOperation = 'lighter'; const gb = X.createLinearGradient(lc[0], lc[1], lc[0] - 300, lc[1]); gb.addColorStop(0, `rgba(255,240,205,${NIGHT ? 0.45 : 0.25})`); gb.addColorStop(1, 'rgba(255,240,205,0)'); X.fillStyle = gb; X.beginPath(); X.moveTo(lc[0], lc[1]); X.lineTo(lc[0] - 330, lc[1] - 26); X.lineTo(lc[0] - 330, lc[1] + 30); X.closePath(); X.fill(); X.restore(); } }
}
function vendorCart(x, z, kind) {   // the seasonal cart at the front of the promenade (autumn: roasted chestnuts)
  const sc = S(z), Pp = (xx, yy) => P(xx, yy, z);
  shadowUnder(x, z, 1.6, 0.6);
  // wheels, the body, a wooden trim, the sign board
  for (const dx of [-0.8, 0.8]) { const p = Pp(x + dx, 0.45); X.fillStyle = NIGHT ? '#0a0810' : '#2a2026'; X.beginPath(); X.arc(p[0], p[1], sc * 0.45, 0, 7); X.fill(); X.strokeStyle = NIGHT ? '#1a1418' : '#8a7a6a'; X.lineWidth = Math.max(0.4, sc * 0.06); X.beginPath(); X.arc(p[0], p[1], sc * 0.3, 0, 7); X.stroke(); }
  const body = [Pp(x - 1.2, 0.7), Pp(x + 1.2, 0.7), Pp(x + 1.2, 1.75), Pp(x - 1.2, 1.75)];
  const g = X.createLinearGradient(0, body[2][1], 0, body[0][1]); g.addColorStop(0, NIGHT ? '#2a1418' : '#3a6a52'); g.addColorStop(1, NIGHT ? '#1a0c10' : '#2a4a3a'); poly(X, body, g);
  poly(X, [Pp(x - 1.25, 1.75), Pp(x + 1.25, 1.75), Pp(x + 1.25, 1.9), Pp(x - 1.25, 1.9)], NIGHT ? '#3a2418' : '#c9a24a');
  const sb = Pp(x, 1.22); X.font = `700 ${sc * 0.34}px Inter`; X.textAlign = 'center'; X.textBaseline = 'middle'; X.letterSpacing = `${sc * 0.04}px`; X.fillStyle = NIGHT ? '#ffd9a0' : '#f4ead0'; X.fillText('CHESTNUTS', sb[0], sb[1]); X.letterSpacing = '0px';
  // the brazier: glowing coals, a little smoke
  const br = Pp(x - 0.4, 2.05); X.fillStyle = NIGHT ? '#140a08' : '#2a2026'; X.fillRect(br[0] - sc * 0.5, br[1] - sc * 0.15, sc * 1, sc * 0.3);
  X.fillStyle = '#ff7a2a'; X.fillRect(br[0] - sc * 0.4, br[1] - sc * 0.2, sc * 0.8, sc * 0.08); glowDot(br[0], br[1], sc * (LIT ? 2 : 0.9), [255, 130, 50], LIT ? 0.7 : 0.4);
  for (let i = 0; i < 4; i++) { const p = Pp(x - 0.4 + Math.sin(i * 2) * 0.2, 2.4 + i * 0.5); X.fillStyle = NIGHT ? `rgba(200,190,220,${0.12 - i * 0.02})` : `rgba(235,235,240,${0.45 - i * 0.09})`; X.beginPath(); X.arc(p[0], p[1], sc * (0.22 + i * 0.12), 0, 7); X.fill(); }
  // the striped umbrella on its pole
  const pole0 = Pp(x + 0.7, 1.9), pole1 = Pp(x + 0.7, 3.5); line(X, [pole0, pole1], NIGHT ? '#140f14' : '#4a4048', Math.max(0.5, sc * 0.08));
  const uc = Pp(x + 0.7, 3.5), ur = sc * 1.5;
  for (let k = 0; k < 6; k++) { X.fillStyle = k % 2 ? (NIGHT ? '#2a1018' : '#f4ead0') : (NIGHT ? '#3a1420' : '#c8323e'); X.beginPath(); X.moveTo(uc[0], uc[1] - ur * 0.42); const a0 = Math.PI + k * Math.PI / 6, a1 = a0 + Math.PI / 6; X.lineTo(uc[0] + Math.cos(a0) * ur, uc[1] + Math.sin(a0) * ur * 0.15 + ur * 0.12); X.lineTo(uc[0] + Math.cos(a1) * ur, uc[1] + Math.sin(a1) * ur * 0.15 + ur * 0.12); X.closePath(); X.fill(); }
  if (LIT) { const lamp = Pp(x + 0.7, 2.9); X.fillStyle = '#fff0c8'; X.beginPath(); X.arc(lamp[0], lamp[1], sc * 0.16, 0, 7); X.fill(); glowDot(lamp[0], lamp[1], sc * 2.6, [255, 200, 130], 0.7); }
}
function rooftopLane(o) {   // the speakeasy's roof, visible from the promenade: a parapet, planters, string lights to the water tower, people at the rail
  const { x0, x1, z0, z1, h } = o, Pp = (xx, yy, zz) => P(xx, yy, zz);
  poly(X, [Pp(x0, h, z0), Pp(x1, h, z0), Pp(x1, h, z1), Pp(x0, h, z1)], NIGHT ? '#0c0a14' : '#6a5a52');   // the roof deck
  // planters along the front edge (autumn: mums + a pumpkin)
  for (let u = x0 + 1.2; u < x1 - 0.8; u += 2.2) { const sc = S(z0 + 0.8), [a, y] = P(u - 0.7, h + 0.75, z0 + 0.8), [b2, yb] = P(u + 0.7, h, z0 + 0.8);
    X.fillStyle = NIGHT ? '#0e0a10' : '#7a4a30'; X.fillRect(a, y, b2 - a, yb - y);
    rs(u * 31); for (let i = 0; i < 12; i++) { X.fillStyle = NIGHT ? '#1a1014' : ['#e8902f', '#d4552c', '#f2b640', '#3c7a3a'][i % 4]; X.beginPath(); X.arc(a + R() * (b2 - a), y - R() * sc * 0.45, sc * 0.17, 0, 7); X.fill(); } }
  // people at the rail (silhouettes against the harbor)
  walker(x1 - 2.4, z0 + 1.6, { y: h, stride: 0.05, rim: 1, col: '#2a2a36', long: true, hat: true });
  walker(x1 - 1.5, z0 + 1.8, { y: h, stride: 0.05, h: 1.62, rim: 1, col: '#a83a5a' });
  // a pole at the front corner, string lights to the water tower and across
  const pa = Pp(x1 - 0.3, h, z0 + 0.5), pb = Pp(x1 - 0.3, h + 4, z0 + 0.5), wt = Pp(x0 + 1.6, h + 3.2, z0 + 2), mid = Pp(x0 + 5, h + 4.2, z1 - 2);
  line(X, [pa, pb], NIGHT ? '#140f14' : '#3a3036', Math.max(0.6, S(z0) * 0.1));
  for (const [qa, qb] of [[pb, wt], [pb, mid], [mid, wt]]) { const n = 14; X.strokeStyle = NIGHT ? 'rgba(40,36,50,0.8)' : 'rgba(60,55,60,0.6)'; X.lineWidth = 0.6; X.beginPath(); for (let k = 0; k <= n; k++) { const t = k / n, px = qa[0] + (qb[0] - qa[0]) * t, py = qa[1] + (qb[1] - qa[1]) * t + Math.sin(t * Math.PI) * 6; k ? X.lineTo(px, py) : X.moveTo(px, py); } X.stroke();
    for (let k = 1; k < n; k++) { const t = k / n, px = qa[0] + (qb[0] - qa[0]) * t, py = qa[1] + (qb[1] - qa[1]) * t + Math.sin(t * Math.PI) * 6; X.fillStyle = LIT ? '#fff0c8' : 'rgba(250,246,236,0.9)'; X.beginPath(); X.arc(px, py, 1.1, 0, 7); X.fill(); if (LIT) { G.fillStyle = 'rgba(255,205,140,0.9)'; G.beginPath(); G.arc(px, py, 3.4, 0, 7); G.fill(); } } }
}

// ================================================================= THE THREE RIVER CITIES
const cities = {
  // A — THE BEND: the river crosses the screen and bends away on the right; a lit suspension bridge spans the bend
  bend() {
    cam({ VPY: 560, CAMH: 20, F: 600, zh0: 300, zh1: 1100 });
    sky();
    const B = [];
    // the far city beyond the bend (small, hazy)
    B.push(...skyline({ seed: 7, x0: 60, x1: 260, z: 560, dz: 160, wMin: 10, wMax: 22, hMin: 40, hMax: 110, gap: 6, towerP: 0.35, trimP: 0.3 }));
    B.push(...skyline({ seed: 9, x0: -260, x1: 40, z: 520, dz: 160, wMin: 10, wMax: 22, hMin: 60, hMax: 150, gap: 5, towerP: 0.35, trimP: 0.3 }));
    // the main skyline on the left bank (z 300+), the landmarks
    B.push(...tower({ x: -78, w: 18, z: 320, h: 168, mat: 'lime', crown: { t: 'sunburst', h: 18, c: NEON.gold }, trim: NEON.pink, flood: NEON.gold }));
    B.push(...tower({ x: -36, w: 16, z: 360, h: 150, mat: 'cream', crown: { t: 'spire', h: 26, c: NEON.cyan }, trim: NEON.cyan, flood: '#9fe0ff' }));
    B.push(...tower({ x: 10, w: 14, z: 395, h: 118, mat: 'granite', crown: { t: 'pyramid', h: 14, c: NEON.gold }, trim: NEON.violet }));
    B.push(...tower({ x: -110, w: 16, z: 340, h: 120, mat: 'terra', crown: { t: 'dome', h: 8, c: NEON.mint }, tiers: 2, split: [0.8, 0.2] }));
    B.push(...skyline({ seed: 21, x0: -150, x1: 32, z: 306, dz: 22, wMin: 9, wMax: 16, hMin: 30, hMax: 70, gap: 1.5, towerP: 0.12, trimP: 0.25 }));
    // the right bank beyond the channel: a lower district (+ a hotel with a roof sign)
    B.push(...skyline({ seed: 31, x0: 98, x1: 230, z: 340, dz: 40, wMin: 10, wMax: 16, hMin: 26, hMax: 60, gap: 2, towerP: 0.2, trimP: 0.3 }));
    B.push({ x0: 98, x1: 112, z0: 336, z1: 350, h: 56, mat: 'red', lit: 0.65, trim: NEON.red, trimLow: 54, signs: [{ k: 'vflat', u: 3, v0: 22, v1: 50, text: 'HOTEL', col: NEON.red, w: 2.4 }] });
    B.push({ x0: -62, x1: -40, z0: 302, z1: 314, h: 40, mat: 'brick', lit: 0.65, signs: [{ k: 'roof', text: 'Bluebird', col: NEON.cyan, script: true, size: 7 }] });
    const bankY = P(0, 0, 300)[1], nearY = P(0, 0, 100)[1];
    // the bridge (also reflected)
    const bridge = () => {
      const z = 420, deck = 9, t1 = 46, t2 = 86, top = 58;
      poly(X, [P(18, deck, z), P(116, deck, z), P(116, deck - 1.6, z), P(18, deck - 1.6, z)], NIGHT ? '#100f22' : GOLD ? '#6a4a5a' : '#7a7686');
      for (const tx of [t1, t2]) { poly(X, [P(tx - 3, 0, z), P(tx + 3, 0, z), P(tx + 2.2, top, z), P(tx - 2.2, top, z)], NIGHT ? '#141230' : GOLD ? rgb(mix('#c8a090', '#ff9a5a', 0.3)) : '#a4a0ac');
        poly(X, [P(tx - 1.2, top - 14, z), P(tx + 1.2, top - 14, z), P(tx + 1.2, top - 26, z), P(tx - 1.2, top - 26, z)], NIGHT ? '#06060e' : '#5a5664');
        if (LIT) { const p = P(tx, top + 2, z); glowDot(p[0], p[1], S(z) * 4, [255, 50, 70], 0.7); neonLine([P(tx - 2.2, top, z), P(tx - 3, 0, z)], NEON.gold, Math.max(0.5, S(z) * 0.35), 0.7); neonLine([P(tx + 2.2, top, z), P(tx + 3, 0, z)], NEON.gold, Math.max(0.5, S(z) * 0.35), 0.7); } }
      const cable = (xa, ya, xb, yb, sag) => { const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push(P(xa + (xb - xa) * t, ya + (yb - ya) * t - Math.sin(t * Math.PI) * sag, z)); } return pts; };
      for (const c of [cable(18, deck + 1, t1, top, 8), cable(t1, top, t2, top, 32), cable(t2, top, 116, deck + 1, 8)]) {
        line(X, c, NIGHT ? '#22203a' : GOLD ? '#f0c8a8' : '#b8b4c0', Math.max(0.5, S(z) * 0.3));
        if (LIT) c.forEach((p, i) => { if (i % 2) return; X.fillStyle = '#fff2d6'; X.beginPath(); X.arc(p[0], p[1], Math.max(0.6, S(z) * 0.4), 0, 7); X.fill(); G.fillStyle = 'rgba(255,214,150,0.95)'; G.beginPath(); G.arc(p[0], p[1], S(z) * 1.6, 0, 7); G.fill(); });
        for (let i = 2; i < c.length - 1; i += 3) { const [px, py] = c[i]; const dy = P(0, deck, z)[1]; line(X, [[px, py], [px, dy]], NIGHT ? 'rgba(40,38,70,0.7)' : 'rgba(150,145,160,0.7)', 0.5); }
      }
      if (LIT) for (let x = 22; x < 114; x += 9) { carFront(x, z, (x | 0) % 2 === 0, deck); }
    };
    waterBand(VPY, nearY, B, null);
    // the land: the left bank, the right bank beyond the channel
    land(-400, 32, 300, 3000, '#7d776c', '#09080f'); land(96, 400, 332, 3000, '#7d776c', '#09080f');
    quay(-400, 32, 300); quay(96, 400, 332);
    [...B].sort((a, b) => b.z0 - a.z0).forEach(drawBlock);
    bridge();
    // the far quays' lamps
    for (let x = -100; x < 30; x += 12) lampPost(x, 301, 1); for (let x = 100; x < 220; x += 14) lampPost(x, 333, 1);
    // boats
    boat(-38, 205, 'party', 1); boat(54, 250, NIGHT ? 'tug' : 'sail', -1); boat(22, 150, 'taxi', -1); if (DAY) boat(-80, 270, 'sail', 1);
    nearSide({ zRail: 100, zRoad1: 80, zRoad0: 54, lamps: [[-26, 1], [-11, 1], [7, -1], [24, -1]], trees: [[-22.6, -25], [10.6, 8]], people: [[-4, 0.5, 1.75], [-3.3, 0.6, 1.62], [16, 1, 1.7], [-17, 0.8, 1.7]], signals: [[-8, 1, 'red'], [14, -1, 'green']], cars: [[-14, 8, 1, 'bus'], [6, 14, -1, 'glow', '#d8d2c4'], [21, 9, 1, 'sedan', '#7a2a2a'], [-28, 15, -1, 'suv', '#2c4a3a']] });
    drawStreaks(); bloom(); vignette();
  },

  // B — THE HARBOR: a wide harbor, the skyline across it, a lit pier with a Ferris wheel, a lighthouse, a ferry
  harbor() {
    cam({ VPY: 560, CAMH: 20, F: 600, zh0: 320, zh1: 1100 });
    sky();
    const B = [];
    B.push(...skyline({ seed: 41, x0: -280, x1: 280, z: 520, dz: 200, wMin: 10, wMax: 24, hMin: 50, hMax: 140, gap: 5, towerP: 0.35, trimP: 0.3 }));
    B.push(...tower({ x: 62, w: 18, z: 345, h: 165, mat: 'lime', crown: { t: 'sunburst', h: 18, c: NEON.gold }, trim: NEON.pink, flood: NEON.gold }));
    B.push(...tower({ x: 100, w: 15, z: 380, h: 140, mat: 'cream', crown: { t: 'spire', h: 24, c: NEON.cyan }, trim: NEON.cyan, flood: '#9fe0ff' }));
    B.push(...tower({ x: 20, w: 14, z: 400, h: 120, mat: 'slate', crown: { t: 'pyramid', h: 14 }, trim: NEON.violet }));
    B.push(...tower({ x: -20, w: 15, z: 380, h: 104, mat: 'terra', crown: { t: 'dome', h: 8, c: NEON.mint }, tiers: 2, split: [0.8, 0.2] }));
    B.push(...tower({ x: -96, w: 15, z: 370, h: 112, mat: 'granite', crown: { t: 'mast', h: 20 }, trim: NEON.orange }));
    B.push(...skyline({ seed: 43, x0: -170, x1: 170, z: 324, dz: 26, wMin: 9, wMax: 16, hMin: 28, hMax: 66, gap: 1.2, towerP: 0.12, trimP: 0.25 }));
    B.push({ x0: 20, x1: 40, z0: 322, z1: 334, h: 46, mat: 'red', lit: 0.65, signs: [{ k: 'roof', text: 'Hotel Grand', col: NEON.red, script: true, size: 7 }] });
    B.push({ x0: -64, x1: -46, z0: 322, z1: 334, h: 40, mat: 'brick', lit: 0.65, signs: [{ k: 'roof', text: 'JAZZ', col: NEON.violet, size: 7 }] });
    const nearY = P(0, 0, 100)[1];
    // the pier with its wheel, the lighthouse (reflected too)
    const pier = () => {
      poly(X, [P(-52, 3, 150), P(-32, 3, 150), P(-32, 3, 322), P(-52, 3, 322)], NIGHT ? '#0e0d1c' : GOLD ? '#a8786a' : '#b8ad9c');
      poly(X, [P(-32, 3, 150), P(-32, 3, 322), P(-32, 0, 322), P(-32, 0, 150)], NIGHT ? '#151430' : GOLD ? '#7a5258' : '#8a8070');
      for (let z = 154; z < 320; z += 8) { line(X, [P(-32, 0, z), P(-32, -4, z)], NIGHT ? '#0a0914' : '#5a5248', Math.max(0.5, S(z) * 0.4)); }
      for (let z = 156; z < 320; z += 10) { const p = P(-33, 7, z); line(X, [P(-33, 3, z), p], NIGHT ? '#1a1830' : '#44424e', Math.max(0.4, S(z) * 0.12)); if (LIT) { glowDot(p[0], p[1], S(z) * 3, [255, 210, 150], 0.6); X.fillStyle = '#fff0d0'; X.fillRect(p[0] - 0.6, p[1] - 0.6, 1.2, 1.2); } }
      // a pavilion at the end with a neon sign
      poly(X, [P(-50, 3, 300), P(-34, 3, 300), P(-34, 12, 300), P(-50, 12, 300)], NIGHT ? '#16142c' : GOLD ? '#e8c8b0' : '#efe6d4');
      poly(X, [P(-52, 12, 300), P(-32, 12, 300), P(-42, 17, 300)], NIGHT ? '#122028' : '#5fa592');
      for (let x = -48; x < -36; x += 3) { const pts = [P(x, 4.5, 299.5), P(x + 1.8, 4.5, 299.5), P(x + 1.8, 9.5, 299.5), P(x, 9.5, 299.5)]; if (LIT) { poly(X, pts, '#ffd28a'); poly(G, pts, 'rgba(255,200,130,0.6)'); } else poly(X, pts, '#33445e'); }
      ferris(-42, 31, 230, 25);
      // the lighthouse on the breakwater, right
      poly(X, [P(36, 2.2, 250), P(110, 2.2, 250), P(110, 0, 250), P(36, 0, 250)], NIGHT ? '#0e0d1c' : '#8a8274');
      poly(X, [P(68, 2, 250), P(74, 2, 250), P(72.8, 30, 250), P(69.2, 30, 250)], NIGHT ? '#1a1830' : '#f4f1ea');
      if (!NIGHT) for (const y of [8, 18]) poly(X, [P(68.4, y, 249.9), P(73.6, y, 249.9), P(73.4, y + 4, 249.9), P(68.6, y + 4, 249.9)], '#c23a3a');
      poly(X, [P(68.6, 30, 250), P(73.4, 30, 250), P(73, 34, 250), P(69, 34, 250)], NIGHT ? '#0a0a14' : '#333');
      const lp = P(71, 32, 250);
      if (LIT) { glowDot(lp[0], lp[1], S(250) * 10, [255, 236, 190], 0.9); if (!FLIP) { X.save(); X.globalCompositeOperation = 'lighter'; const g = X.createLinearGradient(lp[0], lp[1], lp[0] - 240, lp[1] - 30); g.addColorStop(0, 'rgba(255,240,200,0.4)'); g.addColorStop(1, 'rgba(255,240,200,0)'); X.fillStyle = g; X.beginPath(); X.moveTo(lp[0], lp[1]); X.lineTo(lp[0] - 260, lp[1] - 46); X.lineTo(lp[0] - 260, lp[1] - 6); X.closePath(); X.fill(); X.restore(); } }
    };
    waterBand(VPY, nearY, B, pier);
    land(-400, 400, 320, 3000, '#7d776c', '#09080f'); quay(-400, 400, 320);
    [...B].sort((a, b) => b.z0 - a.z0).forEach(drawBlock);
    for (let x = -150; x < 170; x += 13) lampPost(x, 321, 1);
    pier();
    boat(14, 190, 'party', -1); boat(52, 150, 'taxi', 1); boat(-18, 270, NIGHT ? 'tug' : 'sail', 1); if (DAY) boat(90, 230, 'sail', -1);
    nearSide({ zRail: 100, zRoad1: 80, zRoad0: 54, lamps: [[-25, 1], [-9, 1], [8, -1], [25, -1]], trees: [[-21.6, -24], [11.6, 9]], people: [[-2, 0.5, 1.75], [-1.3, 0.6, 1.6], [18, 1, 1.7], [-15, 0.8, 1.7]], signals: [[-12, 1, 'green'], [16, -1, 'red']], cars: [[10, 8, -1, 'bus'], [-10, 14, 1, 'glow', '#d8d2c4'], [-24, 9, -1, 'sedan', '#7a2a2a'], [26, 15, 1, 'suv', '#2c4a3a']] });
    drawStreaks(); bloom(); vignette();
  },


  // HARBOR 2.0 — the near stage at readable sizes: people ~20 pt, the bus ~110 pt, the speakeasy with windows you can see into
  harbor2() {
    cam({ VPY: 540, CAMH: 13.5, F: 600, zh0: 230, zh1: 1000 });
    sky();
    const B = [];
    B.push(...skyline({ seed: 41, x0: -200, x1: 200, z: 380, dz: 180, wMin: 7, wMax: 16, hMin: 40, hMax: 100, gap: 4, towerP: 0.35, trimP: 0.3 }));
    B.push(...tower({ x: 30, w: 13, z: 255, h: 112, mat: 'lime', crown: { t: 'sunburst', h: 13, c: NEON.gold }, trim: NEON.pink, flood: NEON.gold }));
    B.push(...tower({ x: 56, w: 11, z: 280, h: 100, mat: 'cream', crown: { t: 'spire', h: 18, c: NEON.cyan }, trim: NEON.cyan, flood: '#9fe0ff' }));
    B.push(...tower({ x: 4, w: 10, z: 290, h: 86, mat: 'slate', crown: { t: 'pyramid', h: 10 }, trim: NEON.violet }));
    B.push(...tower({ x: -26, w: 11, z: 280, h: 78, mat: 'terra', crown: { t: 'dome', h: 6, c: NEON.mint }, tiers: 2, split: [0.8, 0.2] }));
    B.push(...tower({ x: -64, w: 11, z: 270, h: 92, mat: 'granite', crown: { t: 'mast', h: 14 }, trim: NEON.orange }));
    B.push(...skyline({ seed: 43, x0: -120, x1: 110, z: 232, dz: 18, wMin: 6, wMax: 11, hMin: 22, hMax: 48, gap: 1, towerP: 0.1, trimP: 0.25 }));
    B.push({ x0: 12, x1: 26, z0: 230, z1: 240, h: 36, mat: 'red', lit: 0.65, hotel: true });
    B.push({ x0: -14, x1: 2, z0: 233, z1: 243, h: 28, mat: 'slate', lit: 0.65, tubeRoof: { text: 'PULSE', col: NEON.violet, size: 5.5 } });
    B.push({ x0: 38, x1: 56, z0: 234, z1: 244, h: 32, mat: 'cream', lit: 0.65, tubeRoof: { text: 'NEON PAR', col: NEON.mint, size: 4.4 } });
    B.push({ x0: -50, x1: -38, z0: 230, z1: 240, h: 30, mat: 'brick', lit: 0.65, tubeRoof: { text: 'JAZZ', col: NEON.gold, size: 5 } });
    const railZ = 64, railY = P(0, 0, railZ)[1];
    const things = () => {
      // the pier reaching out from the far bank on the left, the wheel on it
      poly(X, [P(-34, 2.4, 140), P(-20, 2.4, 140), P(-20, 2.4, 230), P(-34, 2.4, 230)], NIGHT ? '#0e0d1c' : GOLD ? '#a8786a' : '#b8ad9c');
      poly(X, [P(-20, 2.4, 140), P(-20, 2.4, 230), P(-20, 0, 230), P(-20, 0, 140)], NIGHT ? '#151430' : GOLD ? '#7a5258' : '#8a8070');
      for (let z = 144; z < 230; z += 6) line(X, [P(-20, 0, z), P(-20, -3, z)], NIGHT ? '#0a0914' : '#5a5248', Math.max(0.5, S(z) * 0.4));
      for (let z = 144; z < 228; z += 9) { const p = P(-21, 6, z); line(X, [P(-21, 2.4, z), p], NIGHT ? '#1a1830' : '#44424e', Math.max(0.4, S(z) * 0.14)); if (LIT) { glowDot(p[0], p[1], S(z) * 2.6, [255, 210, 150], 0.6); X.fillStyle = '#fff0d0'; X.fillRect(p[0] - 0.7, p[1] - 0.7, 1.4, 1.4); } }
      ferris(-24, 23, 165, 17);
      // the breakwater + the lighthouse in open water on the right
      poly(X, [P(26, 1.6, 150), P(80, 1.6, 150), P(80, 0, 150), P(26, 0, 150)], NIGHT ? '#100f1e' : '#8a8274');
      for (let x = 28; x < 80; x += 3) { const p = P(x, 1.6, 150); X.fillStyle = NIGHT ? '#151428' : '#9a9284'; X.beginPath(); X.arc(p[0], p[1], S(150) * 0.9, Math.PI, 0); X.fill(); }
      lighthouse2(46, 150, 26);
    };
    waterBand(VPY, railY, B, things);
    land(-400, 400, 230, 3000, '#7d776c', '#09080f'); quay(-400, 400, 230);
    [...B].sort((a, b) => b.z0 - a.z0).forEach(b => { drawBlock(b); if (b.tubeRoof) roofTube(b, b.tubeRoof); if (b.hotel) bladeCab(b, { u: 3.4, v0: 5, v1: 34, text: 'HOTEL', col: NEON.red, w: 4.6, face: '#1a3a4a' }); });
    for (let x = -110; x < 110; x += 11) lampPost(x, 231, 1);
    things();
    riverboat(4, 128, -1);
    if (false) boat(4, 128, 'party', -1); boat(32, 100, 'taxi', 1); boat(-60, 190, NIGHT ? 'tug' : 'sail', 1); if (!NIGHT) boat(70, 200, 'sail', -1);
    // ---------------- the stage: the waterside road, then the promenade nearest us
    land(-400, 400, 54, railZ, GOLD ? '#4a3a48' : '#56565f', '#06060e');        // the road (behind the promenade)
    land(-400, 400, 1, 54, '#cfc5b2', '#0e0d1a');                                 // the promenade
    for (let x = -30; x < 30; x += 2.4) line(X, [P(x, 0.01, 30), P(x, 0.01, 54)], NIGHT ? 'rgba(255,255,255,0.025)' : 'rgba(120,100,80,0.18)', 0.6);   // paving lines
    for (let z = 34; z < 54; z += 2.4) { const y = P(0, 0, z)[1]; X.fillStyle = NIGHT ? 'rgba(255,255,255,0.02)' : 'rgba(120,100,80,0.15)'; X.fillRect(0, y, W, 0.6); }
    const lz = 59, ly = P(0, 0, lz)[1]; for (let x = 0; x < W; x += 26) { X.fillStyle = LIT ? 'rgba(255,200,90,0.4)' : 'rgba(255,214,90,0.9)'; X.fillRect(x, ly, 13, Math.max(0.8, S(lz) * 0.1)); }
    ROAD = { y0: railY, y1: P(0, 0, 54)[1] };
    // the railing at the water's edge (behind the road), the curb in front of it
    const ry = P(0, 1.1, railZ)[1]; X.fillStyle = NIGHT ? '#0b0a16' : '#34313c'; X.fillRect(0, ry, W, Math.max(1.2, S(railZ) * 0.1)); for (let x = -40; x < 40; x += 1.1) { const p = P(x, 0, railZ); X.fillRect(p[0] - 0.3, ry, 0.7, p[1] - ry); }
    poly(X, [P(-400, 0.22, 54), P(400, 0.22, 54), P(400, 0, 53.6), P(-400, 0, 53.6)], NIGHT ? '#15142a' : '#a39a8a');
    // the traffic (behind the promenade, ~110 pt bus, ~50 pt cars), two stop lights at the near curb
    car(8, 60, -1, 'bus'); car(-8, 57, 1, 'glow', '#d8d2c4'); car(14.5, 57.5, 1, 'sedan', '#7a2a2a'); car(-15, 61, -1, 'suv', '#2c4a3a');
    for (const [x, z, w] of [[8, 60, 5.5], [-8, 57, 2.2], [14.5, 57.5, 2.2], [-15, 61, 2.4]]) shadowUnder(x, z, w, 0.4);
    signal(-3, 54.6, 1, 'red', 1.35); signal(12.5, 54.6, -1, 'green', 1.35);
    // the speakeasy on our side, left edge
    speakeasyBuilding({ x0: -16.8, x1: -5.6, z0: 44, z1: 60, h: 10.5, waterTower: true });
    stageDetails();
    // lamps + paired trees, a bench, people (~20 pt)
    const pz = 47;
    [[-3.6, 1], [5.4, 1], [12.6, -1]].forEach(([x, d]) => lampPost(x, pz, d));
    tree(-1.2, pz + 0.3, -2.7); tree(9.8, pz + 0.3, 11.7);
    lampPost(8.6, 37, -1); tree(11.0, 37.4, 7.8); tree(-11.6, 37.4, -9); vendorCart(3.6, 37.6, 'chestnuts'); walker(5.6, 37.2, { stride: 0.1, dir: -1, beanie: '#c8323e', scarf: '#f2b640' });
    bench(7.2, pz + 0.8);
    walker(-4.4, 44.2, { hat: true, rim: 1, stride: 0.1, col: '#1e1e28', long: true });                 // the doorman by the speakeasy's door
    walker(0.4, 40, { stride: 0.7, dir: 1, rim: -1, hat: '#5a3a2a', col: '#3a4a6a', long: true, scarf: '#c8323e' }); walker(1.2, 40.3, { stride: 0.6, dir: 1, h: 1.62, rim: -1, col: '#c8423a', beanie: '#e8e2d6' });   // a couple
    walker(-6.8, 39.5, { stride: 0.8, dir: 1, dog: true, rim: 1, col: '#3c7a5a', beanie: '#2f6fb8' });           // the dog walker
    walker(14.6, 45, { wave: true, stride: 0.1, rim: -1, col: '#e0a83a', hat: '#2a2230' });                 // hailing a cab
    walker(4.6, 46.6, { stride: 0.2, h: 1.7, rim: 1, col: '#8a4fa8', scarf: '#f4ead0' }); walker(-2.4, 41.5, { stride: 0.8, dir: -1, h: 1.68, rim: 1, col: '#2a2a36', long: true, hat: true });
    drawStreaks(); bloom(); vignette();
  },

  // C — THE CANAL: the river runs straight away from you to the horizon, buildings on both banks, a Deco drawbridge
  canal() {
    cam({ VPY: 520, CAMH: 20, F: 300, zh0: 60, zh1: 520 });
    sky();
    const B = [];
    B.push(...skyline({ seed: 51, x0: -120, x1: 120, z: 420, dz: 160, wMin: 8, wMax: 18, hMin: 40, hMax: 120, gap: 4, towerP: 0.35, trimP: 0.3 }));
    B.push(...tower({ x: 0, w: 22, z: 380, h: 112, mat: 'lime', crown: { t: 'sunburst', h: 16, c: NEON.gold }, trim: NEON.pink, flood: NEON.gold }));
    // both banks: blocks facing the canal, varied heights, blade signs
    const LB = [[44, 64, 52, 'brick', NEON.pink], [64, 84, 66, 'lime', null], [84, 104, 40, 'red', NEON.cyan], [112, 140, 78, 'cream', NEON.gold], [140, 170, 46, 'brick', null], [170, 210, 60, 'terra', NEON.violet], [210, 260, 44, 'granite', null], [260, 320, 52, 'brick', NEON.pink]];
    const RB = [[44, 60, 44, 'terra', NEON.gold], [60, 82, 72, 'cream', NEON.cyan], [82, 104, 50, 'brick', null], [112, 136, 62, 'granite', NEON.violet], [136, 168, 84, 'lime', NEON.pink], [168, 206, 48, 'red', null], [206, 250, 58, 'cream', NEON.cyan], [250, 320, 42, 'brick', null]];
    const blades = { 0: ['HOTEL', NEON.red], 2: ['JAZZ', NEON.violet], 4: ['BAR', NEON.cyan] }, bladesR = { 0: ['PALACE', NEON.gold], 2: ['EAT', NEON.orange], 3: ['CLUB', NEON.pink] };
    LB.forEach(([z0, z1, h, mat, tr], i) => B.push({ x0: -60, x1: -22, z0, z1, h, mat, lit: i < 2 ? 0.38 : 0.62, store: true, storeSide: true, trim: tr, trimLow: h, fire: mat === 'brick', seed: 900 + i, water: i === 2 || i === 6, waterX: -40, signs: blades[i] ? [{ k: 'blade', u: (z1 - z0) * 0.5, v0: 6, v1: 6 + blades[i][0].length * 2.6, text: blades[i][0], col: blades[i][1], out: 2.4 }] : [] }));
    RB.forEach(([z0, z1, h, mat, tr], i) => B.push({ x0: 22, x1: 60, z0, z1, h, mat, lit: i < 2 ? 0.38 : 0.62, store: true, storeSide: true, trim: tr, trimLow: h, fire: mat === 'brick', seed: 950 + i, water: i === 1, waterX: 40, signs: bladesR[i] ? [{ k: 'blade', u: (z1 - z0) * 0.5, v0: 6, v1: 6 + bladesR[i][0].length * 2.6, text: bladesR[i][0], col: bladesR[i][1], out: 2.4 }] : [] }));
    // the quays along both banks (a walk between the buildings and the water)
    const nearY = P(0, 0, 40)[1];
    const raised = GOLD;
    const bridge = () => {
      const z = 108, deck = 5;
      for (const sx of [-1, 1]) {   // the bridge houses: little Deco towers at each end
        const x0 = sx < 0 ? -22 : 16, x1 = sx < 0 ? -16 : 22;
        poly(X, [P(x0, 0, z), P(x1, 0, z), P(x1, 18, z), P(x0, 18, z)], NIGHT ? '#18163a' : GOLD ? rgb(mix('#e8d8c0', '#ff9a5a', sx > 0 ? 0.1 : 0.4)) : '#e6dcc6');
        poly(X, [P(x0 - 0.6, 18, z), P(x1 + 0.6, 18, z), P((x0 + x1) / 2, 24, z)], NIGHT ? '#122028' : '#5fa592');
        for (const y of [6, 11]) { const pts = [P(x0 + 1.5, y, z - 0.1), P(x1 - 1.5, y, z - 0.1), P(x1 - 1.5, y + 3, z - 0.1), P(x0 + 1.5, y + 3, z - 0.1)]; if (LIT) { poly(X, pts, '#ffd28a'); poly(G, pts, 'rgba(255,200,130,0.6)'); } else poly(X, pts, '#33445e'); }
        if (LIT) { neonLine([P(x0, 18, z), P(x1, 18, z)], NEON.gold, Math.max(0.5, S(z) * 0.22)); const tp = P((x0 + x1) / 2, 24.6, z); glowDot(tp[0], tp[1], S(z) * 2, [255, 50, 70], 0.8); }
      }
      // the two leaves: down (a deck with its lights) or raised for a boat
      const leaf = (sx) => { const piv = sx < 0 ? -16 : 16, ang = raised ? 1.2 : 0, L = 16;
        const ex = piv - sx * Math.cos(ang) * L, ey = deck + Math.sin(ang) * L;
        poly(X, [P(piv, deck, z), P(ex, ey, z), P(ex, ey - 1.6, z), P(piv, deck - 1.6, z)], NIGHT ? '#100f22' : GOLD ? '#6a4a5a' : '#7a7686');
        const n = 7; for (let i = 0; i <= n; i++) { const t = i / n, px = piv + (ex - piv) * t, py = deck + (ey - deck) * t; const p = P(px, py + 0.8, z);
          if (LIT) { X.fillStyle = '#fff0d0'; X.beginPath(); X.arc(p[0], p[1], Math.max(0.6, S(z) * 0.3), 0, 7); X.fill(); G.fillStyle = 'rgba(255,210,150,0.9)'; G.beginPath(); G.arc(p[0], p[1], S(z) * 1.2, 0, 7); G.fill(); } }
        if (raised && LIT) { const tip = P(ex, ey, z); glowDot(tip[0], tip[1], S(z) * 2.2, [255, 50, 60], 0.9); } };
      leaf(-1); leaf(1);
      if (!raised && LIT) [-10, -4, 3, 9].forEach((x, i) => carFront(x, z + 0.3, i % 2 === 0, deck));
    };
    waterBand(VPY, nearY, B, null);
    // the quays + the far bank across the end
    land(-22, -16, 40, 3000, '#b8ae9c', '#0c0b18'); land(16, 22, 40, 3000, '#b8ae9c', '#0c0b18');
    land(-400, -22, 40, 3000, '#8a8274', '#09080f'); land(22, 400, 40, 3000, '#8a8274', '#09080f');
    land(-400, 400, 340, 3000, '#8a8274', '#09080f');
    [...B].sort((a, b) => b.z0 - a.z0).forEach(drawBlock);
    for (let z = 50; z < 330; z += 16) { lampPost(-17.2, z, 1); lampPost(17.2, z + 8, -1); }
    for (let z = 52; z < 300; z += 34) { person(-19.5, z, {}); person(19.8, z + 13, { h: 1.6 }); }
    bridge();
    if (GOLD) boat(-2, 100, 'party', 1); else boat(-6, 160, 'party', 1);
    boat(9, 76, 'taxi', -1); boat(-8, 240, NIGHT ? 'tug' : 'sail', 1);
    // our bank: the promenade + the road with its two stop lights at the canal's mouth
    nearSide({ zRail: 40, zRoad1: 33, zRoad0: 22, lamps: [[-20, 1], [-9, 1], [9, -1], [20, -1]], trees: [[-16.6, -19], [12.6, 10]], people: [[-3, 0.6, 1.75], [-2.4, 0.7, 1.6], [4, 0.9, 1.7]], signals: [[-12, 1, 'red'], [12.5, -1, 'green']], cars: [[-6, 5, 1, 'bus'], [11, 3, -1, 'glow', '#d8d2c4'], [-22, 6, -1, 'sedan', '#7a2a2a']] });
    drawStreaks(); bloom(); vignette();
  },
};
(cities[CITY] || cities.bend)();
window.__cc = true;
