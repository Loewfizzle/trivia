// PRISM DROP — THE DAY LOOK's PAGE (PD-4; docs/prism.md "THE CRAYON LOOK"): the paper fills the screen behind everything (the WebGL world is NOT
// drawn by day — the view skips its work). ONE canvas (`.pd-page`, under the board), redrawn only when something it shows changes — the paper (the
// match's deal), the world (the song), the screen / the board's place — never in the frame loop:
//   THE PAPER — its grain (assets/prism/paper/<id>.webp, CC0, tiled) + what's printed on it, DRAWN IN CODE: the notepad's ruled lines + its red
//   margin, the graph paper's grid, the coloring page's thick frame (construction paper: just the paper).
//   THE WORLD DOODLE — each song's world as a FAINT crayon line drawing behind the board (SYNTH SUNSET a striped half sun over a road + mountains,
//   NEON CITY a skyline in the rain, CRYSTAL CAVE crystals, DEEP NEBULA a swirl of stars + a ringed planet, AURORA OCEAN wavy light ribbons over
//   waves) — drawn once per song into its own canvas (cached), in crayon colours (the coloring page: black outlines, like a coloring book).
//   THE BOARD — the well washed with the paper (the doodle only faintly through it) + a hand-drawn PENCIL frame (two passes, corners overshooting).
// The papers + the font load ONLY when the day look shows (warmDay — never in the boot graph); until a paper arrives the page is its flat colour.
import { CRAYON, GRAPHITE, PAPERS } from './crayon.js';
import { punchTiled } from './crayon-art.js';

const BASE = new URL('../../../assets/prism/paper/', import.meta.url);
const FONT = new URL('../../../assets/fonts/prism/permanent-marker-latin-400.woff2', import.meta.url);
const imgs = new Map();   // file → { img, ready }
let fontP = null;

/** load a paper's grain (once); resolves when decoded */
export function loadPaper(paper) {
  let e = imgs.get(paper.file);
  if (!e) {
    const img = new Image();
    img.decoding = 'async';
    e = { img, ready: false, p: null };
    e.p = new Promise(res => { img.onload = () => { e.ready = true; res(img); }; img.onerror = () => res(null); });
    img.src = new URL(paper.file, BASE).href;
    imgs.set(paper.file, e);
  }
  return e.p;
}
/** the day look's own files, fetched only when it shows (the papers ~80 KB, the marker font ~30 KB) — the callouts fall back until it's in */
export function warmDay(first) {
  if (first) loadPaper(first);
  for (const p of PAPERS) loadPaper(p);
  if (!fontP && typeof FontFace === 'function' && document.fonts) {
    fontP = new FontFace('PD Marker', `url(${FONT.href}) format('woff2')`, { display: 'swap' }).load()
      .then(f => { document.fonts.add(f); return true; }).catch(() => false);
  }
  return fontP;
}

// ---- a seeded random (the doodle draws the same on every phone)
function rng(seed) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

/** a crayon line through pts (CSS px): two passes, the second a little off the first — the hand that drew it */
function crayonLine(x, pts, { w = 3, col = GRAPHITE, a = 1, close = false, r }) {
  if (pts.length < 2) return;
  x.lineCap = 'round';
  x.lineJoin = 'round';
  for (let pass = 0; pass < 2; pass++) {
    const j = pass ? w * 0.35 : 0;
    x.beginPath();
    pts.forEach(([px, py], i) => { const dx = j ? (r() - 0.5) * j : 0, dy = j ? (r() - 0.5) * j : 0; if (i) x.lineTo(px + dx, py + dy); else x.moveTo(px + dx, py + dy); });
    if (close) x.closePath();
    x.lineWidth = pass ? w * 0.6 : w;
    x.strokeStyle = rgba(col, a * (pass ? 0.7 : 1));
    x.stroke();
  }
}
/** a smooth curve through pts (quadratics through the midpoints) as a polyline — for the hand's lines */
function smooth(pts, n = 6) {
  if (pts.length < 3) return pts;
  const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = i === 1 ? pts[0] : [(pts[i - 1][0] + pts[i][0]) / 2, (pts[i - 1][1] + pts[i][1]) / 2];
    const b = pts[i], c = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2];
    for (let k = 1; k <= n; k++) { const t = k / n; out.push([(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * b[0] + t * t * c[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * b[1] + t * t * c[1]]); }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
const circle = (cx, cy, rx, ry, a0 = 0, a1 = Math.PI * 2, n = 40, wob = 0, r) => Array.from({ length: n + 1 }, (_, i) => {
  const a = a0 + (a1 - a0) * (i / n), k = 1 + (wob && r ? (r() - 0.5) * wob : 0);
  return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k];
});
const star5 = (cx, cy, R, rot = 0) => Array.from({ length: 10 }, (_, i) => { const a = rot + (i / 10) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? R * 0.45 : R; return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]; });

// ================================================================ THE WORLD DOODLES — each in the page's CSS px (w × h), the board's rect b
const C = { cyan: CRAYON[1], yellow: CRAYON[2], violet: CRAYON[3], green: CRAYON[4], red: CRAYON[5], blue: CRAYON[6], orange: CRAYON[7], grey: CRAYON[8], pink: '#e86fb0' };
export const DOODLES = {
  /** SYNTH SUNSET: a striped half sun on the horizon, mountains across it, a road running down to the foot of the page (+ the ground's grid) */
  sunset(x, w, h, ink, r) {
    const hz = h * 0.55, cx = w * 0.5, R = Math.min(w * 0.4, h * 0.24);
    // the sun's stripes (horizontal strokes inside the half circle — the gaps widen toward the horizon)
    x.save();
    x.beginPath(); x.arc(cx, hz, R, Math.PI, 0); x.closePath(); x.clip();
    let y = hz - R, gap = R * 0.04, k = 0;
    while (y < hz) {
      const band = R * 0.12;
      const t = (y - (hz - R)) / R;
      const col = ink || (t < 0.4 ? C.yellow : t < 0.75 ? C.orange : C.pink);
      for (let yy = y; yy < Math.min(hz, y + band); yy += 3.2) crayonLine(x, [[cx - R - 4, yy + (r() - 0.5)], [cx + R + 4, yy + (r() - 0.5)]], { w: 3.4, col, a: ink ? 0.0 : 0.6, r });
      y += band + gap; gap *= 1.45; k++;
    }
    x.restore();
    crayonLine(x, circle(cx, hz, R, R, Math.PI, Math.PI * 2, 46, 0.012, r), { w: 3.2, col: ink || C.orange, r });
    if (ink) { let yy = hz - R * 0.55, g = R * 0.05; while (yy < hz) { const half = Math.sqrt(Math.max(0, R * R - (hz - yy) ** 2)); crayonLine(x, [[cx - half, yy], [cx + half, yy]], { w: 2.2, col: ink, r }); yy += R * 0.1 + g; g *= 1.4; } }
    // the mountains: two ranges, zig-zag peaks across the horizon
    for (const [side, from, to] of [[-1, -0.04, 0.42], [1, 0.58, 1.04]]) {
      const pts = [[w * from, hz]];
      const n = 4;
      for (let i = 1; i <= n * 2; i++) pts.push([w * (from + (to - from) * i / (n * 2)), i % 2 ? hz - h * (0.07 + r() * 0.07) : hz - h * (0.015 + r() * 0.02)]);
      pts.push([w * to, hz]);
      crayonLine(x, pts, { w: 3, col: ink || C.violet, r });
      void side;
    }
    crayonLine(x, [[0, hz], [w, hz]], { w: 2.6, col: ink || C.violet, r });
    // the road: two edges to the foot of the page + the centre dashes; the ground's grid lines (closer together toward the horizon)
    crayonLine(x, [[cx - w * 0.03, hz], [w * 0.06, h]], { w: 3, col: ink || C.grey, r });
    crayonLine(x, [[cx + w * 0.03, hz], [w * 0.94, h]], { w: 3, col: ink || C.grey, r });
    for (let t = 0.08; t < 1; t += 0.13) { const y0 = hz + (h - hz) * t * t, y1 = hz + (h - hz) * Math.min(1, (t + 0.05) ** 2); crayonLine(x, [[cx, y0], [cx, y1]], { w: 2.6 + t * 3, col: ink || C.yellow, r }); }
    for (let t = 0.12; t < 1; t += 0.16) { const yy = hz + (h - hz) * t * t; crayonLine(x, [[0, yy], [w, yy]], { w: 1.6, col: ink || C.pink, a: 0.6, r }); }
  },
  /** NEON CITY: a skyline (lit windows) under the rain, puddles at the foot */
  city(x, w, h, ink, r) {
    const base = h * 0.7;
    let px = -w * 0.02;
    const cols = [C.blue, C.violet, C.cyan, C.pink];
    let i = 0;
    while (px < w) {
      const bw = w * (0.1 + r() * 0.1), bh = h * (0.12 + r() * 0.22), col = ink || cols[i++ % cols.length];
      crayonLine(x, [[px, base], [px, base - bh], [px + bw, base - bh], [px + bw, base]], { w: 3, col, r });
      if (r() < 0.4) crayonLine(x, [[px + bw * 0.5, base - bh], [px + bw * 0.5, base - bh - h * 0.04]], { w: 2.4, col, r });   // an antenna
      // the windows: small squares in rows
      for (let wy = base - bh + h * 0.02; wy < base - h * 0.03; wy += h * 0.035) for (let wx = px + bw * 0.18; wx < px + bw * 0.8; wx += bw * 0.3) {
        if (r() < 0.55) { const s = Math.min(bw * 0.14, h * 0.014); crayonLine(x, [[wx, wy], [wx + s, wy], [wx + s, wy + s], [wx, wy + s]], { w: 2, col: ink || C.yellow, close: true, r }); }
      }
      px += bw + w * 0.01;
    }
    crayonLine(x, [[0, base], [w, base]], { w: 2.6, col: ink || C.grey, r });
    // the rain: short slanted strokes over the sky + the street
    for (let k = 0; k < 120; k++) {
      const rx = r() * w * 1.1, ry = r() * h, l = h * 0.025;
      crayonLine(x, [[rx, ry], [rx - l * 0.35, ry + l]], { w: 1.6, col: ink || C.blue, a: 0.75, r });
    }
    // puddles + their ripples
    for (let k = 0; k < 4; k++) { const cx = w * (0.15 + k * 0.24 + r() * 0.05), cy = base + h * (0.08 + r() * 0.16); crayonLine(x, circle(cx, cy, w * 0.07, h * 0.012, 0, Math.PI * 2, 30, 0.04, r), { w: 2.2, col: ink || C.cyan, r }); }
  },
  /** CRYSTAL CAVE: crystal clusters rising from the floor, stalactites hanging from the top */
  crystal(x, w, h, ink, r) {
    const crystal = (bx, by, len, wd, ang, col) => {
      const ca = Math.cos(ang), sa = Math.sin(ang), px = -sa, py = ca;   // up along (sa, -ca)
      const P = (u, v) => [bx + sa * u + px * v, by - ca * u + py * v];
      const pts = [P(0, -wd), P(len * 0.78, -wd), P(len, 0), P(len * 0.78, wd), P(0, wd)];
      crayonLine(x, pts, { w: 3, col, r });
      crayonLine(x, [P(len * 0.1, 0), P(len, 0)], { w: 1.8, col, a: 0.7, r });   // the facet's edge
      crayonLine(x, [P(len * 0.78, -wd), P(len * 0.78, wd)], { w: 1.6, col, a: 0.6, r });
    };
    const clusters = [[0.14, 0.98, 1], [0.52, 0.99, 1.25], [0.88, 0.97, 0.95], [0.32, 0.93, 0.7]];
    clusters.forEach(([u, v, s], k) => {
      for (let i = 0; i < 4; i++) {
        const ang = (i - 1.5) * 0.32 + (r() - 0.5) * 0.15;
        crystal(w * u + (i - 1.5) * w * 0.03, h * v, h * (0.12 + r() * 0.12) * s, w * 0.028 * s, ang, ink || [C.cyan, C.violet, C.blue, C.pink][(i + k) % 4]);
      }
    });
    // stalactites
    for (let i = 0; i < 7; i++) {
      const cx = w * (0.06 + i * 0.15 + r() * 0.04), l = h * (0.05 + r() * 0.09), ww = w * (0.025 + r() * 0.02);
      crayonLine(x, [[cx - ww, -2], [cx, l], [cx + ww, -2]], { w: 2.6, col: ink || C.violet, r });
    }
    // the glints: little four-point sparkles
    for (let i = 0; i < 9; i++) { const cx = r() * w, cy = h * (0.15 + r() * 0.6), s = w * 0.018; crayonLine(x, [[cx - s, cy], [cx + s, cy]], { w: 2, col: ink || C.cyan, r }); crayonLine(x, [[cx, cy - s * 1.4], [cx, cy + s * 1.4]], { w: 2, col: ink || C.cyan, r }); }
  },
  /** DEEP NEBULA: a swirl of stars (two arms) + a ringed planet + scattered stars */
  nebula(x, w, h, ink, r) {
    const cx = w * 0.45, cy = h * 0.5;
    for (let arm = 0; arm < 2; arm++) {
      const pts = [];
      for (let t = 0; t < 1; t += 0.02) { const a = arm * Math.PI + t * Math.PI * 3.2, rr = w * 0.04 + t * w * 0.42; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.75]); }
      crayonLine(x, pts, { w: 3, col: ink || (arm ? C.pink : C.violet), r });
      // the arm's stars: dots + little crosses along it
      for (let t = 0.1; t < 1; t += 0.07) { const a = arm * Math.PI + t * Math.PI * 3.2 + 0.25, rr = w * 0.04 + t * w * 0.42 + (r() - 0.5) * w * 0.06; const sx = cx + Math.cos(a) * rr, sy = cy + Math.sin(a) * rr * 0.75, s = 2.5 + r() * 3; crayonLine(x, [[sx - s, sy], [sx + s, sy]], { w: 1.8, col: ink || C.yellow, r }); crayonLine(x, [[sx, sy - s], [sx, sy + s]], { w: 1.8, col: ink || C.yellow, r }); }
    }
    crayonLine(x, circle(cx, cy, w * 0.035, w * 0.035, 0, Math.PI * 2, 20, 0.05, r), { w: 3, col: ink || C.yellow, r });
    // the ringed planet (top right)
    const px = w * 0.76, py = h * 0.17, pr = w * 0.09;
    crayonLine(x, circle(px, py, pr, pr, 0, Math.PI * 2, 40, 0.02, r), { w: 3.2, col: ink || C.orange, r });
    crayonLine(x, circle(px, py, pr * 1.75, pr * 0.42, Math.PI * 0.06, Math.PI * 0.94, 30, 0, r), { w: 2.8, col: ink || C.yellow, r });
    crayonLine(x, circle(px, py, pr * 1.75, pr * 0.42, Math.PI * 1.08, Math.PI * 1.25, 8, 0, r), { w: 2.8, col: ink || C.yellow, r });
    crayonLine(x, circle(px, py, pr * 1.75, pr * 0.42, Math.PI * 1.75, Math.PI * 1.92, 8, 0, r), { w: 2.8, col: ink || C.yellow, r });
    for (let i = 0; i < 3; i++) crayonLine(x, [[px - pr * 0.8, py - pr * (0.3 - i * 0.3)], [px + pr * 0.8, py - pr * (0.3 - i * 0.3) + pr * 0.1]], { w: 1.6, col: ink || C.orange, a: 0.6, r });
    // stars
    for (let i = 0; i < 14; i++) crayonLine(x, star5(r() * w, r() * h, 4 + r() * 6, r()), { w: 1.8, col: ink || [C.yellow, C.cyan, C.pink][i % 3], close: true, r });
  },
  /** AURORA OCEAN: wavy ribbons of light (curtains of short strokes) over the sea's waves */
  aurora(x, w, h, ink, r) {
    const cols = [C.green, C.cyan, C.violet];
    for (let k = 0; k < 3; k++) {
      const y0 = h * (0.14 + k * 0.1), amp = h * (0.035 + r() * 0.02), ph = r() * 6, f = 1.6 + r();
      const yAt = u => y0 + Math.sin(u * Math.PI * f + ph) * amp + Math.sin(u * 9 + ph) * amp * 0.25;
      const col = ink || cols[k];
      const top = [];
      for (let u = -0.02; u <= 1.02; u += 0.02) top.push([u * w, yAt(u)]);
      crayonLine(x, top, { w: 3, col, r });
      // the curtain: vertical strokes hanging under the ribbon, fading in length
      for (let u = 0; u < 1; u += 0.018) { const yy = yAt(u), l = h * (0.05 + r() * 0.05); crayonLine(x, [[u * w, yy], [u * w + (r() - 0.5) * 3, yy + l]], { w: 1.8, col, a: 0.7, r }); }
    }
    // the sea: rows of waves, smaller toward the horizon
    for (let row = 0; row < 7; row++) {
      const yy = h * (0.64 + row * 0.055), amp = h * (0.006 + row * 0.003), n = 7 + row;
      const pts = [];
      for (let i = 0; i <= n * 8; i++) { const u = i / (n * 8); pts.push([u * w * 1.04 - w * 0.02, yy - Math.abs(Math.sin(u * Math.PI * n + row)) * amp * 2]); }
      crayonLine(x, pts, { w: 2.4, col: ink || (row % 2 ? C.blue : C.cyan), r });
    }
    crayonLine(x, circle(w * 0.18, h * 0.58, w * 0.05, w * 0.05, Math.PI, Math.PI * 2, 20, 0.03, r), { w: 2.6, col: ink || C.yellow, r });   // the moon on the horizon
  },
};

export function createPage(canvas) {
  const ctx = canvas.getContext('2d');
  let st = { paper: null, world: '', w: 0, h: 0, board: null, on: false };
  let sig = '';
  const doodles = new Map();   // `${world}|${style}|${w}|${h}` → canvas
  let waitFor = '';

  /** the doodle for a world (cached): drawn on its own canvas at the page's size, the tooth punched through it */
  function doodle(world, style, w, h, dpr) {
    const key = `${world}|${style}|${w}|${h}|${dpr}`;
    let d = doodles.get(key);
    if (d) return d;
    if (doodles.size > 4) doodles.clear();
    d = document.createElement('canvas');
    d.width = Math.round(w * dpr); d.height = Math.round(h * dpr);
    const x = d.getContext('2d');
    x.scale(dpr, dpr);
    const fn = DOODLES[world] || DOODLES.sunset;
    fn(x, w, h, style === 'outline' ? '#2a2c31' : null, rng(world.length * 131 + 7));
    x.setTransform(1, 0, 0, 1, 0, 0);
    punchTiled(x, d.width, d.height, 0.45, Math.max(1, dpr * 0.8));
    doodles.set(key, d);
    return d;
  }

  function rulings(x, p, w, h, r) {
    x.save();
    if (p.rule === 'lines') {
      // a notepad: the ruled lines (a plain top band), the red margin (doubled), three punched holes
      for (let y = 72; y < h; y += 26) { x.fillStyle = rgba(p.line, 0.62); x.fillRect(0, y, w, 1); }
      x.fillStyle = rgba(p.margin, 0.7);
      x.fillRect(30, 0, 1.2, h); x.fillRect(33.5, 0, 0.8, h);
    } else if (p.rule === 'grid') {
      for (let k = 0, X = 0; X < w; X += 13, k++) { x.fillStyle = rgba(k % 5 ? p.line : p.major, k % 5 ? 0.42 : 0.58); x.fillRect(Math.round(X), 0, k % 5 ? 0.8 : 1.2, h); }
      for (let k = 0, Y = 0; Y < h; Y += 13, k++) { x.fillStyle = rgba(k % 5 ? p.line : p.major, k % 5 ? 0.42 : 0.58); x.fillRect(0, Math.round(Y), w, k % 5 ? 0.8 : 1.2); }
    } else if (p.rule === 'frame') {
      // a coloring page: a thick hand-drawn frame round the page
      const i = 7, pts = [[i, i], [w - i, i], [w - i, h - i], [i, h - i]];
      crayonLine(x, [...pts, pts[0], [pts[0][0] + 20, pts[0][1]]], { w: 3.4, col: p.line, a: 0.85, r });
    }
    x.restore();
  }

  /** the board: the well washed with the paper (the doodle only faintly through it) + the pencil frame (two passes, the corners overshooting) */
  function boardOn(x, p, pat, b, r) {
    const pad = 3;
    x.save();
    x.globalAlpha = p.well;
    x.fillStyle = pat || p.base;
    x.fillRect(b.x - pad, b.y - pad, b.w + 2 * pad, b.h + 2 * pad);
    x.restore();
    const o = 5, L = b.x - o, T = b.y - o, R = b.x + b.w + o, B = b.y + b.h + o, ov = 7;
    for (let pass = 0; pass < 2; pass++) {
      const j = () => (r() - 0.5) * (pass ? 2.2 : 1.2);
      x.lineCap = 'round';
      x.lineWidth = pass ? 1.3 : 2.2;
      x.strokeStyle = rgba(GRAPHITE, pass ? 0.5 : 0.82);
      x.beginPath();
      x.moveTo(L - ov * r(), T + j()); x.lineTo(R + ov * r(), T + j());
      x.moveTo(R + j(), T - ov * r()); x.lineTo(R + j(), B + ov * r());
      x.moveTo(R + ov * r(), B + j()); x.lineTo(L - ov * r(), B + j());
      x.moveTo(L + j(), B + ov * r()); x.lineTo(L + j(), T - ov * r());
      x.stroke();
    }
  }

  function draw() {
    const { paper: p, world, w, h, board } = st;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const e = imgs.get(p.file);
    const img = e && e.ready ? e.img : null;
    // the paper: the grain tiled at its own size (one tile pixel = one CSS px ÷ 2 — the tooth stays fine on a phone)
    let pat = null;
    if (img) { pat = ctx.createPattern(img, 'repeat'); if (pat.setTransform) pat.setTransform(new DOMMatrix().scale(0.5)); }
    ctx.fillStyle = pat || p.base;
    ctx.fillRect(0, 0, w, h);
    const r = rng(17);
    rulings(ctx, p, w, h, r);
    // the doodle: faint (the coloring page's black lines a little firmer)
    const d = doodle(world || 'sunset', p.doodle, Math.round(w), Math.round(h), dpr);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = p.doodle === 'outline' ? 0.2 : 0.24;
    ctx.drawImage(d, 0, 0);
    ctx.restore();
    if (board) boardOn(ctx, p, pat, board, r);
  }

  return {
    /** o: { paper, world, w, h (the page in CSS px), board ({ x, y, w, h } CSS px), on } — redraws only when one of them changed */
    set(o) {
      st = { ...st, ...o };
      if (!st.on || !st.paper || !st.w) return false;
      const e = imgs.get(st.paper.file);
      const ready = !!(e && e.ready);
      const s = [st.paper.id, ready, st.world, st.w, st.h, st.board ? [st.board.x, st.board.y, st.board.w, st.board.h].map(Math.round).join(',') : ''].join('|');
      if (s === sig) return false;
      sig = s;
      draw();
      if (!ready && waitFor !== st.paper.file) { waitFor = st.paper.file; loadPaper(st.paper).then(() => { waitFor = ''; sig = ''; if (st.on) this.set({}); }); }
      return true;
    },
    get paper() { return st.paper; },
    destroy() { doodles.clear(); },
  };
}
