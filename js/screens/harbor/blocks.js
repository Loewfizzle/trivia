// CITY 2.0 — THE HARBOR: a skyline building, crafted (Part 2). Shared by far.js, mid.js, landmarks.js and quay.js; baked per
// look key (tones.js: the day / golden / night weights + the sun's side and height).
//
// DAY: real materials — limestone and cream stone, terracotta, granite, brick ONLY on the near buildings, glass on the newer
// towers — with Deco piers and recessed spandrels, cornices and their shadows, weathering under the sills, the shadow side and
// the sunlit side from the REAL sun's direction (we face south: a morning sun lights the faces turned east), cast shadows from
// taller neighbours, and windows of dark glass catching the sky (distant windows by day are never light: dark glass, a glint).
// GOLDEN HOUR: the backlit city — the faces toward the sun glow, warm rim light on every edge and crown toward it.
// NIGHT: dark silhouettes against the horizon glow (the far ones softer and bluer), the street's glow at the feet, unlit glass,
// and floodlit crowns (warm light washing up the stone from the setbacks, real falloff). The LIT windows are not here: they
// are their own layer (lights.js), addressable and re-drawn on the light timeline.
import { project } from '../../core/harbor-layout.js';
import { winHash } from '../../core/harbor-windows.js';
import { rgb, mix, shade } from './shapes.js';
import { fog } from './tones.js';

// materials: day front · the sunlit side · the shade side · trim (cornices, piers) · night front · night side
export const MAT = {
  lime: { d: [214, 203, 182], l: [244, 229, 201], s: [160, 148, 126], t: [236, 228, 210], n: [31, 29, 60], ns: [22, 21, 45] },
  cream: { d: [228, 218, 196], l: [252, 240, 214], s: [174, 162, 139], t: [246, 239, 222], n: [33, 31, 60], ns: [24, 22, 46] },
  terra: { d: [214, 178, 136], l: [242, 204, 156], s: [160, 124, 88], t: [236, 214, 182], n: [37, 28, 56], ns: [27, 20, 43] },
  granite: { d: [124, 128, 142], l: [154, 158, 172], s: [86, 89, 103], t: [176, 180, 192], n: [23, 25, 48], ns: [16, 18, 36] },
  slate: { d: [138, 148, 166], l: [170, 180, 196], s: [96, 105, 122], t: [194, 202, 216], n: [25, 28, 54], ns: [18, 20, 40] },
  brick: { d: [150, 82, 62], l: [190, 106, 78], s: [104, 52, 40], t: [218, 200, 174], n: [35, 23, 43], ns: [25, 16, 32] },
  red: { d: [128, 56, 46], l: [166, 72, 58], s: [88, 38, 32], t: [214, 196, 170], n: [33, 20, 39], ns: [23, 14, 29] },
  glass: { d: [112, 142, 182], l: [150, 182, 214], s: [76, 100, 136], t: [206, 220, 234], n: [13, 18, 34], ns: [9, 13, 27] },
};
const DUSK = [176, 112, 132];          // the golden hour's backlit faces lean to this
const SUNLIT = [255, 168, 96];         // … and the faces toward the sun to this
const GLASS_D = [44, 58, 82], GLASS_N = [7, 7, 18];

/** a pane's share of its bay (width: a Deco tower's / a plain block's) and of its floor */
export const WIN_W = { deco: 0.56, plain: 0.5 }, WIN_H = 0.6;
/** is a building drawn as a Deco tower (piers + recessed spandrels)? */
export const isDeco = rank => !!rank && rank !== 'band' && rank !== 'quay' && rank !== 'modern';
/** a window's pane on screen: [x, y, w, h] (pt) — the facade's glass and the lit layer use the same */
export function cellRect(cam, b, col, row, deco) {
  const g = b.win, s = cam.F / b.z0, [pu, pv] = g.pitch;
  const [a] = P(cam, b.x0, 0, b.z0), [, by] = P(cam, 0, b.y0 || 0, b.z0);
  const cw = pu * s, rh = pv * s, ww = Math.max(0.5, cw * (deco ? WIN_W.deco : WIN_W.plain)), wh = Math.max(0.5, rh * WIN_H);
  return [a + (g.u0 + col * pu) * s + (cw - ww) / 2, by - (g.v0 + (row + 1) * pv) * s + (rh - wh) / 2, ww, wh];
}
const lerp3 = (T, d, g, n) => [0, 1, 2].map(i => d[i] * T.day + g[i] * T.gold + n[i] * T.night);
/** a material's three faces for this look, mixed into the haze by depth */
export function faces(T, mat, z) {
  const m = MAT[mat] || MAT.lime, fz = fog(z);
  const hz = c => mix(c, T.haze, fz * (T.night > 0.5 ? 0.62 : 0.7));
  const front = lerp3(T, m.d, mix(m.d, DUSK, 0.5).map(v => v * 0.82), m.n);
  const lit = lerp3(T, m.l, mix(m.l, SUNLIT, 0.55), m.ns);
  const dark = lerp3(T, m.s, mix(m.s, [84, 58, 98], 0.5), m.ns.map(v => v * 0.85));
  const trim = lerp3(T, m.t, mix(m.t, SUNLIT, 0.4), m.n.map(v => v * 1.25));
  return { front: hz(front), lit: hz(lit), dark: hz(dark), trim: hz(trim), fz };
}

const P = (cam, x, y, z) => project(cam, x, y, z);
function quad(x, cam, pts, fill) {
  x.beginPath();
  pts.forEach(([a, b, c], i) => { const [sx, sy] = P(cam, a, b, c); if (i) x.lineTo(sx, sy); else x.moveTo(sx, sy); });
  x.closePath(); x.fillStyle = fill; x.fill();
}

/**
 * A building (a band block, a tower's tier, a hero block): b = { x0, x1, z0, z1, h, y0?, mat, win, crown, seed, kind, rank }.
 * o: { rank, tierIndex, tiers (the tower's tier count), flood: [r,g,b] | null, gold }
 */
export function skyBlock(x, cam, b, T, o = {}) {
  const y0 = b.y0 || 0, y1 = y0 + b.h, F = faces(T, b.mat, b.z0), s = cam.F / b.z0;
  const glass = b.mat === 'glass';
  // ---- the side face the camera sees (the one turned to the middle), lit or in shade by the real sun
  const sideOf = right => (T.sunDir === 0 ? mix(F.lit, F.dark, 0.5) : (right ? T.sunDir > 0 : T.sunDir < 0) ? F.lit : F.dark);
  if (b.x1 < 0) quad(x, cam, [[b.x1, y0, b.z0], [b.x1, y1, b.z0], [b.x1, y1, b.z1], [b.x1, y0, b.z1]], rgb(sideOf(true)));
  if (b.x0 > 0) quad(x, cam, [[b.x0, y0, b.z0], [b.x0, y1, b.z0], [b.x0, y1, b.z1], [b.x0, y0, b.z1]], rgb(sideOf(false)));
  // ---- the front
  const [a, ty] = P(cam, b.x0, y1, b.z0), [c, by] = P(cam, b.x1, y0, b.z0), w = c - a, h = by - ty;
  if (w <= 0.2 || h <= 0.2) return;
  x.fillStyle = rgb(F.front); x.fillRect(a, ty, w, h);
  if (glass) glassFace(x, cam, b, T, F, a, ty, w, h, s);
  else stoneFace(x, cam, b, T, F, a, ty, w, h, s, o);
  // ---- light over the whole front: day — the sky from above and the ground's shade below; night — the street's glow at the
  // feet (the near rows); golden hour — the edge toward the sun catches it
  if (T.day > 0.05 && w > 3) {
    const sd = T.sunDir || 0, gx = x.createLinearGradient(a, 0, c, 0), k = T.day * (1 - F.fz * 0.6);
    gx.addColorStop(0, sd < 0 ? `rgba(255,250,236,${0.12 * k})` : `rgba(28,24,48,${0.12 * k})`);
    gx.addColorStop(0.5, 'rgba(128,128,128,0)');
    gx.addColorStop(1, sd > 0 ? `rgba(255,250,236,${0.12 * k})` : `rgba(28,24,48,${0.12 * k})`);
    x.fillStyle = gx; x.fillRect(a, ty, w, h);
  }
  if (T.day > 0.05) {
    const g = x.createLinearGradient(0, ty, 0, by);
    g.addColorStop(0, `rgba(255,255,255,${0.1 * T.day})`); g.addColorStop(0.55, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(30,24,40,${0.16 * T.day * (1 - F.fz)})`);
    x.fillStyle = g; x.fillRect(a, ty, w, h);
  }
  if (T.night > 0.05 && !o.tierIndex && b.z0 < 400) {
    const up = Math.min(h, 60 * s / 2.4), g = x.createLinearGradient(0, by, 0, by - up), k = T.night * (1 - F.fz) * 0.28;
    g.addColorStop(0, `rgba(150,60,130,${k})`); g.addColorStop(1, 'rgba(150,60,130,0)');
    x.fillStyle = g; x.fillRect(a, by - up, w, up);
  }
  if (T.gold > 0.05 && T.sunDir !== 0 && w > 2) {
    const edge = T.sunDir > 0 ? c - Math.max(0.6, w * 0.06) : a;
    x.fillStyle = rgb([255, 190, 120], 0.55 * T.gold * (1 - F.fz * 0.6)); x.fillRect(edge, ty, Math.max(0.6, w * 0.06), h);
  }
  // a setback tier stands on a ledge: the ledge's parapet catches the light, and the tier throws a soft shadow on it
  if (o.tierIndex > 0 && w > 3) {
    const pw = (b.x1 - b.x0) * 0.14 * s;
    x.fillStyle = rgb(shade(F.trim, T.night > 0.5 ? -0.1 : 0.06), 0.9); x.fillRect(a - pw, by - Math.max(0.6, 0.35 * s), w + pw * 2, Math.max(0.6, 0.35 * s));
    const sg = x.createLinearGradient(0, by, 0, by - Math.min(h, 2.2 * s));
    sg.addColorStop(0, `rgba(24,20,40,${0.3 * (1 - T.night * 0.5)})`); sg.addColorStop(1, 'rgba(24,20,40,0)');
    x.fillStyle = sg; x.fillRect(a, by - Math.min(h, 2.2 * s), w, Math.min(h, 2.2 * s));
  }
  // the cornice: the top edge catches the light, a shadow line under it (the silhouettes read against each other)
  x.fillStyle = rgb(shade(F.trim, T.night > 0.5 ? 0.12 : 0.05), T.night > 0.5 ? 0.6 : 0.9); x.fillRect(a - 0.2, ty, w + 0.4, Math.max(0.6, 0.3 * s));
  x.fillStyle = `rgba(20,16,30,${0.18 + 0.12 * T.day})`; x.fillRect(a, ty + Math.max(0.6, 0.3 * s), w, Math.max(0.5, 0.18 * s));
  // ---- night: floodlights wash up the crown's stone from the setback below (real falloff), in the tower's colour
  if (o.flood && T.night > 0.05) flood(x, a, ty, w, h, s, o.flood, T.night * (1 - F.fz * 0.5), b.seed);
  if (b.crown) crown(x, cam, b, T, F, o);
  if (o.roof !== false && !b.crown && b.kind !== 'landmark' && s > 1.3) roofClutter(x, cam, b, T, F, s);
}

// stone, terracotta, brick: piers + spandrels on the towers, floors on the blocks, the glass, the weathering
function stoneFace(x, cam, b, T, F, a, ty, w, h, s, o) {
  const g = b.win, by = ty + h;
  const deco = isDeco(o.rank);
  const brick = (b.mat === 'brick' || b.mat === 'red');
  // texture: brick courses near, stone joints, a mottling (deterministic, cheap)
  if (s > 1.9 && T.day > 0.05) {
    x.fillStyle = rgb(shade(F.front, brick ? -0.14 : -0.06), (brick ? 0.35 : 0.22) * T.day);
    const step = (brick ? 0.36 : 1.0) * s;
    for (let yy = by - step; yy > ty + 1; yy -= step) x.fillRect(a, yy, w, Math.max(0.35, step * 0.12));
  }
  const r = (k) => winHash(b.seed, o.tierIndex || 0, k, 0, 11);
  for (let i = 0; i < 3 + w / 12; i++) { x.fillStyle = rgb(shade(F.front, r(i) < 0.5 ? -0.06 : 0.05), 0.35); const mw = w * (0.1 + r(i + 20) * 0.3); x.fillRect(a + r(i + 40) * (w - mw), ty + r(i + 60) * h * 0.8, mw, h * (0.05 + r(i + 80) * 0.2)); }
  if (!g || g.rows <= 0) return;
  const [pu, pv] = g.pitch, cw = pu * s, rh = pv * s;
  if (cw < 0.9 || rh < 1.1) return;
  const xOf = col => a + (g.u0 + col * pu) * s, yOf = row => by - (g.v0 + (row + 1) * pv) * s;
  const glassC = mix(lerp3(T, GLASS_D, [70, 52, 80], GLASS_N), T.haze, F.fz * 0.6);
  const winW = deco ? WIN_W.deco : WIN_W.plain, winH = WIN_H;
  // Deco: each column of windows sits in a recessed strip (the spandrels between floors), the piers stand proud between
  if (deco) {
    // the recessed strip of each column of windows; its spandrels (between the floors) in the Deco contrast tone — terracotta
    // or bronze on the stone towers — with a thin lit band, so the shaft reads as piers rising past panels
    const top0 = yOf(g.rows - 1) - rh * 0.1, hh = g.rows * rh;
    const span = mix(shade(F.front, -0.16), lerp3(T, [150, 104, 84], [170, 96, 82], F.front.map(v => v * 0.8)), 0.45 * (1 - F.fz));
    x.fillStyle = rgb(span);
    x.beginPath(); for (let col = 0; col < g.cols; col++) x.rect(xOf(col) + cw * 0.16, top0, cw * 0.68, hh); x.fill();
    if (rh > 2.6 && T.night < 0.8) {
      x.fillStyle = rgb(shade(span, 0.22), 0.55 * (1 - T.night));
      x.beginPath(); for (let row = 0; row < g.rows; row++) for (let col = 0; col < g.cols; col++) x.rect(xOf(col) + cw * 0.2, yOf(row) + rh * 0.86, cw * 0.6, Math.max(0.35, rh * 0.06)); x.fill();
    }
    if (T.day + T.gold > 0.1 && cw > 1.8) {   // the piers: their edge toward the sun lit, the other in shade
      const sd = T.sunDir || 1, lit = T.sunDir < 0 ? 0.16 : 0.84, dark = T.sunDir < 0 ? 0.84 : 0.16;
      x.fillStyle = rgb(shade(F.trim, 0.12), 0.6 * (T.day + T.gold));
      x.beginPath(); for (let col = 0; col <= g.cols; col++) x.rect(xOf(col) + cw * lit - (sd > 0 ? 0.6 : 0), top0, 0.6, hh); x.fill();
      x.fillStyle = `rgba(30,24,44,${0.28 * (T.day + T.gold)})`;
      x.beginPath(); for (let col = 0; col < g.cols; col++) x.rect(xOf(col) + cw * dark - (sd > 0 ? 0 : 0.6), top0, 0.6, hh); x.fill();
    }
  } else if (s > 1.6) {
    // a block: the floor lines (a sill under every row of windows)
    x.fillStyle = rgb(shade(F.trim, T.night > 0.5 ? -0.2 : 0), 0.35 * (1 - F.fz));
    x.beginPath(); for (let row = 0; row < g.rows; row++) x.rect(a, yOf(row) + rh * (0.5 + winH / 2) + 0.2, w, Math.max(0.4, 0.16 * s)); x.fill();
  }
  // the glass: dark by day (the sky's colour in it), dark at night (the lit ones are lights.js); far away by day only a hint
  const farDay = s < 1.25;
  x.fillStyle = rgb(glassC, farDay ? 0.28 + 0.5 * T.night : 0.9);
  const ww = Math.max(0.5, cw * winW), wh = Math.max(0.5, rh * winH);
  x.beginPath();
  for (let row = 0; row < g.rows; row++) for (let col = 0; col < g.cols; col++) x.rect(xOf(col) + (cw - ww) / 2, yOf(row) + (rh - wh) / 2, ww, wh);
  x.fill();
  // the sky in the glass (day): a glint at the top of some panes — cool, never warm, never a lit window
  if (T.day > 0.15 && !farDay) {
    const sky = T.skyHi || [190, 214, 240];
    x.fillStyle = rgb(mix(sky, [255, 255, 255], 0.35), 0.6 * T.day * (1 - F.fz * 0.5));
    x.beginPath();
    for (let row = 0; row < g.rows; row++) for (let col = 0; col < g.cols; col++) if (winHash(b.seed, o.tierIndex || 0, col, row, 5) < 0.4) x.rect(xOf(col) + (cw - ww) / 2, yOf(row) + (rh - wh) / 2, ww, wh * 0.45);
    x.fill();
  }
  // golden hour: panes toward the sun flash orange
  if (T.gold > 0.2 && T.sunDir !== 0 && !farDay) {
    x.fillStyle = rgb([255, 176, 96], 0.7 * T.gold);
    x.beginPath();
    const n = g.cols;
    for (let row = 0; row < g.rows; row++) for (let col = 0; col < n; col++) {
      const side = T.sunDir > 0 ? col >= n * 0.66 : col < n * 0.34;
      if (side && winHash(b.seed, o.tierIndex || 0, col, row, 6) < 0.3) x.rect(xOf(col) + (cw - ww) / 2, yOf(row) + (rh - wh) / 2, ww, wh);
    }
    x.fill();
  }
  // weathering: streaks under the sills, the near buildings only (day)
  if (T.day > 0.1 && s > 2.2) {
    x.fillStyle = rgb(shade(F.front, -0.25), 0.12 * T.day);
    x.beginPath();
    for (let col = 0; col < g.cols; col++) if (winHash(b.seed, 7, col, 0, 8) < 0.45) { const sx = xOf(col) + cw * (0.3 + 0.4 * winHash(b.seed, 7, col, 1, 8)); x.rect(sx, yOf(g.rows - 1), Math.max(0.4, cw * 0.12), g.rows * rh * (0.4 + 0.6 * winHash(b.seed, 7, col, 2, 8))); }
    x.fill();
  }
}

// the newer city's glass: the sky's colour mirrored (lighter low, the sky's top high), mullions, a sheen; night: dark glass
function glassFace(x, cam, b, T, F, a, ty, w, h, s) {
  const sky0 = T.skyHi || [150, 180, 220], sky1 = T.skyLo || [210, 225, 240];
  if (T.night < 0.95) {
    const g = x.createLinearGradient(0, ty, 0, ty + h), k = 1 - T.night;
    g.addColorStop(0, rgb(mix(mix(sky0, F.front, 0.35), T.haze, F.fz * 0.5), 0.85 * k));
    g.addColorStop(1, rgb(mix(mix(sky1, F.front, 0.25), T.haze, F.fz * 0.5), 0.85 * k));
    x.fillStyle = g; x.fillRect(a, ty, w, h);
    // the sheen: a diagonal band of brighter sky
    x.save(); x.beginPath(); x.rect(a, ty, w, h); x.clip();
    x.fillStyle = `rgba(255,255,255,${0.16 * k})`;
    x.beginPath(); x.moveTo(a + w * 0.15, ty); x.lineTo(a + w * 0.5, ty); x.lineTo(a + w * 0.05, ty + h * 0.55); x.lineTo(a - w * 0.3, ty + h * 0.55); x.fill();
    x.restore();
  }
  // mullions + floor lines
  x.fillStyle = rgb(shade(F.front, T.night > 0.5 ? 0.06 : -0.12), 0.45);
  const g = b.win;
  if (g && g.pitch[0] * s > 1.3) for (let col = 0; col <= g.cols; col++) x.fillRect(a + (g.u0 + col * g.pitch[0]) * s, ty, 0.4, h);
  if (g && g.pitch[1] * s > 1.6) { x.fillStyle = rgb(shade(F.front, -0.08), 0.25); for (let row = 0; row < g.rows; row++) x.fillRect(a, ty + h - (g.v0 + row * g.pitch[1]) * s, w, 0.35); }
}

// floodlights on a tower's top tiers: three cones from the setback, warm on the stone, fading up
function flood(x, a, ty, w, h, s, col, k, seed) {
  x.save();
  x.globalCompositeOperation = 'lighter';
  const n = Math.max(2, Math.min(4, Math.round(w / 9)));
  for (let i = 0; i < n; i++) {
    const cx = a + w * (i + 0.5) / n, rw = w / n * 0.75, up = h * 1.05;
    const g = x.createRadialGradient(cx, ty + h, 0, cx, ty + h, up);
    g.addColorStop(0, rgb(col, 0.5 * k)); g.addColorStop(0.45, rgb(col, 0.2 * k)); g.addColorStop(1, rgb(col, 0));
    x.fillStyle = g;
    x.beginPath(); x.moveTo(cx - rw * 0.2, ty + h); x.lineTo(cx - rw, ty); x.lineTo(cx + rw, ty); x.lineTo(cx + rw * 0.2, ty + h); x.fill();
  }
  // the whole face, softly (the light bouncing off the stone)
  const g2 = x.createLinearGradient(0, ty + h, 0, ty);
  g2.addColorStop(0, rgb(col, 0.22 * k)); g2.addColorStop(1, rgb(col, 0.04 * k));
  x.fillStyle = g2; x.fillRect(a, ty, w, h);
  x.restore();
}

/** the crowns: the sunburst, the mooring mast, spires, domes, pyramids, the stepped tops, the Deco parapets, water tanks, the
 *  glass towers' slants — crafted by day (metal, copper, stone), floodlit or dark at night, rim-lit at golden hour */
export function crown(x, cam, b, T, F, o = {}) {
  const c = b.crown, y = (b.y0 || 0) + b.h, z = b.z0, cx = (b.x0 + b.x1) / 2, bw = b.x1 - b.x0;
  const [sx, sy] = P(cam, cx, y, z), s = cam.F / z, hw = bw / 2 * s, hh = c.h * s;
  const metal = lerp3(T, [214, 220, 230], [255, 196, 130], [40, 38, 66]);
  const gold = lerp3(T, [222, 184, 104], [255, 190, 110], [120, 92, 50]);
  const copper = lerp3(T, [96, 160, 140], [140, 150, 120], [24, 40, 46]);
  const hz = col => mix(col, T.haze, F.fz * 0.55);
  const sunX = T.sunDir || 0;
  const rim = (path) => { if (T.gold > 0.1 && sunX) { x.save(); x.clip(path); x.fillStyle = rgb([255, 200, 130], 0.6 * T.gold); x.fillRect(sunX > 0 ? sx : sx - hw * 2, sy - hh * 2, hw * 2, hh * 2); x.restore(); } };
  const nightK = T.night * (1 - F.fz * 0.4);
  if (c.t === 'sunburst') {
    // stacked arches, each with its sunburst of triangular windows; a needle above. The city's one gold crown.
    const body = hz(o.gold ? mix(metal, gold, 0.55) : metal);
    for (let i = 0; i < 4; i++) {
      const r = hw * (1 - 0.2 * i), yy = sy - i * hh * 0.11, ry = Math.min(r * 0.95, hh * 0.3 * (1 - 0.1 * i));
      const p = new Path2D(); p.ellipse(sx, yy, r, ry, 0, Math.PI, 0); p.closePath();
      x.fillStyle = rgb(i % 2 ? shade(body, -0.12) : body); x.fill(p);
      // the left half in shade (day) — the right in shade at the other end of the day
      x.save(); x.clip(p); x.fillStyle = `rgba(30,24,50,${0.2 * T.day})`; x.fillRect(sunX > 0 ? sx - r : sx, yy - r, r, r); x.restore();
      rim(p);
      // the sunburst windows: rays of triangles
      const lit = nightK > 0.1;
      x.fillStyle = lit ? rgb([255, 214, 140], 0.85 * nightK) : rgb([40, 46, 70], 0.55);
      for (let k = 0; k < 7; k++) {
        const ang = Math.PI + (k + 0.5) * Math.PI / 7, r0 = r * 0.5, r1 = r * 0.86, da = 0.11;
        const q = ry / r;
        x.beginPath(); x.moveTo(sx + Math.cos(ang) * r0, yy + Math.sin(ang) * r0 * q);
        x.lineTo(sx + Math.cos(ang - da) * r1, yy + Math.sin(ang - da) * r1 * q); x.lineTo(sx + Math.cos(ang + da) * r1, yy + Math.sin(ang + da) * r1 * q); x.fill();
      }
    }
    needle(x, sx, sy - hh * 0.55, hh * 0.45, s, T, F, body);
    if (nightK > 0.05) glow(x, sx, sy - hh * 0.25, hw * 2.2, [255, 196, 110], 0.4 * nightK);
  } else if (c.t === 'mast') {
    // the mooring mast: a drum, a lantern, the tapering spire, the antenna (its beacon blinks: lights.js)
    const body = hz(lerp3(T, [210, 214, 222], [255, 200, 150], [44, 42, 70]));
    const dw = hw * 0.62;
    x.fillStyle = rgb(shade(body, -0.05)); x.fillRect(sx - dw, sy - hh * 0.22, dw * 2, hh * 0.22);
    x.fillStyle = rgb(shade(body, 0.08)); x.fillRect(sx - dw * 0.72, sy - hh * 0.42, dw * 1.44, hh * 0.2);
    for (let i = 0; i < 5; i++) { x.fillStyle = rgb(shade(body, -0.25), 0.7); x.fillRect(sx - dw * 0.72 + i * dw * 0.36, sy - hh * 0.42, Math.max(0.4, s * 0.12), hh * 0.2); }
    x.fillStyle = rgb(body); x.beginPath(); x.moveTo(sx - dw * 0.5, sy - hh * 0.42); x.lineTo(sx, sy - hh * 0.78); x.lineTo(sx + dw * 0.5, sy - hh * 0.42); x.fill();
    x.fillStyle = rgb(shade(body, -0.3)); x.fillRect(sx - Math.max(0.3, s * 0.07), sy - hh, Math.max(0.6, s * 0.14), hh * 0.24);
    if (nightK > 0.05) glow(x, sx, sy - hh * 0.32, dw * 3, [220, 230, 255], 0.35 * nightK);
  } else if (c.t === 'spire') {
    // a slim spire with fins, its lit side and shade side, a needle
    const body = hz(lerp3(T, [222, 216, 200], [255, 198, 140], [42, 40, 70]));
    const bw2 = hw * 0.62;
    x.fillStyle = rgb(body); x.beginPath(); x.moveTo(sx - bw2, sy); x.lineTo(sx, sy - hh * 0.8); x.lineTo(sx + bw2, sy); x.fill();
    x.fillStyle = rgb(shade(body, -0.22)); x.beginPath(); x.moveTo(sunX > 0 ? sx - bw2 : sx + bw2, sy); x.lineTo(sx, sy - hh * 0.8); x.lineTo(sx, sy); x.fill();
    for (const f of [-1, 1]) { x.fillStyle = rgb(shade(body, -0.1)); x.beginPath(); x.moveTo(sx + f * bw2 * 1.25, sy); x.lineTo(sx + f * bw2 * 0.4, sy - hh * 0.42); x.lineTo(sx + f * bw2 * 0.4, sy); x.fill(); }
    needle(x, sx, sy - hh * 0.76, hh * 0.24, s, T, F, body);
    if (nightK > 0.05 && o.flood) glow(x, sx, sy - hh * 0.3, bw2 * 3, o.flood, 0.3 * nightK);
  } else if (c.t === 'dome') {
    const body = hz(copper);
    const dh = Math.max(1, hh * 0.62);
    const p = new Path2D(); p.ellipse(sx, sy, hw * 0.74, dh, 0, Math.PI, 0); p.closePath();
    x.fillStyle = rgb(shade(body, -0.06)); x.fillRect(sx - hw * 0.82, sy - Math.max(0.6, s * 0.3), hw * 1.64, Math.max(0.6, s * 0.3));
    x.fillStyle = rgb(body); x.fill(p);
    x.save(); x.clip(p);
    x.fillStyle = rgb(shade(body, 0.25), 0.5 * (1 - T.night)); x.beginPath(); x.ellipse(sx + (sunX > 0 ? hw * 0.25 : -hw * 0.25), sy - dh * 0.6, hw * 0.22, dh * 0.3, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = rgb(shade(body, -0.3), 0.6); for (let i = -2; i <= 2; i++) x.fillRect(sx + i * hw * 0.28 - 0.2, sy - dh, 0.4, dh);
    x.restore(); rim(p);
    x.fillStyle = rgb(shade(body, 0.1)); x.fillRect(sx - hw * 0.16, sy - hh * 0.8, hw * 0.32, hh * 0.2);
    needle(x, sx, sy - hh * 0.8, hh * 0.2, s, T, F, body);
  } else if (c.t === 'pyramid') {
    const body = hz(copper);
    for (let i = 0; i < 3; i++) {
      const w0 = hw * (1 - i * 0.28), y0 = sy - i * hh * 0.27;
      x.fillStyle = rgb(i % 2 ? shade(body, -0.08) : body);
      x.beginPath(); x.moveTo(sx - w0, y0); x.lineTo(sx - w0 * 0.72, y0 - hh * 0.27); x.lineTo(sx + w0 * 0.72, y0 - hh * 0.27); x.lineTo(sx + w0, y0); x.fill();
    }
    x.fillStyle = rgb(shade(body, -0.05)); x.beginPath(); x.moveTo(sx - hw * 0.3, sy - hh * 0.81); x.lineTo(sx, sy - hh); x.lineTo(sx + hw * 0.3, sy - hh * 0.81); x.fill();
  } else if (c.t === 'stepped') {
    const body = hz(F.trim);
    for (let i = 0; i < 3; i++) { const w0 = hw * (0.9 - i * 0.24); x.fillStyle = rgb(shade(body, i * 0.04 - 0.04)); x.fillRect(sx - w0, sy - (i + 1) * hh * 0.24, w0 * 2, hh * 0.24 + 0.3); }
    x.fillStyle = rgb(shade(body, -0.4)); x.fillRect(sx - 0.25, sy - hh, 0.5, hh * 0.28);
  } else if (c.t === 'deco') {
    // the word towers' parapet: a stepped centre and fins (kept low: the words live below)
    const body = hz(F.trim);
    x.fillStyle = rgb(shade(body, -0.04)); x.fillRect(sx - hw, sy - hh * 0.4, hw * 2, hh * 0.4);
    x.fillStyle = rgb(body); x.fillRect(sx - hw * 0.5, sy - hh * 0.75, hw, hh * 0.35); x.fillRect(sx - hw * 0.2, sy - hh, hw * 0.4, hh * 0.25);
    x.fillStyle = rgb(shade(body, -0.2), 0.8); for (let i = 0; i < 6; i++) x.fillRect(sx - hw + (i + 0.5) * hw / 3 - 0.25, sy - hh * 0.55, 0.5, hh * 0.55);
  } else if (c.t === 'tank') {
    tank(x, sx + hw * 0.3, sy, s, T, F);
  } else if (c.t === 'slant') {
    const body = mix(F.front, T.skyHi || [150, 180, 220], 0.35 * (1 - T.night));
    x.fillStyle = rgb(body); x.beginPath(); x.moveTo(sx - hw, sy); x.lineTo(sx - hw, sy - hh); x.lineTo(sx + hw, sy - hh * 0.25); x.lineTo(sx + hw, sy); x.fill();
  } else if (c.t === 'flat') {
    x.fillStyle = rgb(shade(F.front, 0.08)); x.fillRect(sx - hw, sy - hh, hw * 2, hh);
  }
}
function needle(x, sx, sy, len, s, T, F, body) {
  x.fillStyle = rgb(shade(body, -0.15)); x.fillRect(sx - Math.max(0.25, s * 0.06), sy - len, Math.max(0.5, s * 0.12), len);
}
function tank(x, sx, sy, s, T, F) {
  // a wooden water tank on its legs, a conical cap
  const w = 1.5 * s, h = 1.5 * s, leg = 0.8 * s;
  const wood = mix(lerp3(T, [128, 92, 64], [150, 90, 70], [30, 24, 34]), T.haze, F.fz * 0.6);
  x.fillStyle = rgb(shade(wood, -0.3)); x.fillRect(sx - w * 0.4, sy - leg, Math.max(0.4, s * 0.1), leg); x.fillRect(sx + w * 0.4 - s * 0.1, sy - leg, Math.max(0.4, s * 0.1), leg);
  x.fillStyle = rgb(wood); x.fillRect(sx - w / 2, sy - leg - h, w, h);
  x.fillStyle = rgb(shade(wood, -0.25), 0.7); for (let i = 1; i < 3; i++) x.fillRect(sx - w / 2, sy - leg - h * i / 3, w, Math.max(0.3, s * 0.06));
  x.fillStyle = rgb(shade(wood, -0.1)); x.beginPath(); x.moveTo(sx - w * 0.58, sy - leg - h); x.lineTo(sx, sy - leg - h - w * 0.45); x.lineTo(sx + w * 0.58, sy - leg - h); x.fill();
}
// the roofs of the plain blocks: a water tank, a stair bulkhead, a vent, an aerial (by the block's own dice)
function roofClutter(x, cam, b, T, F, s) {
  const k = b.k ?? winHash(b.seed, 3, 3, 3, 3), [a, ty] = P(cam, b.x0, (b.y0 || 0) + b.h, b.z0), [c] = P(cam, b.x1, 0, b.z0), w = c - a;
  if (w < 4) return;
  const col = shade(F.front, T.night > 0.5 ? 0.04 : -0.12);
  x.fillStyle = rgb(col);
  if (k < 0.3) tank(x, a + w * (0.25 + k), ty, s, T, F);
  else if (k < 0.62) { x.fillRect(a + w * 0.2, ty - 0.9 * s, w * 0.22, 0.9 * s); x.fillRect(a + w * 0.62, ty - 0.45 * s, w * 0.14, 0.45 * s); }
  else if (k < 0.8) { x.fillRect(a + w * 0.55, ty - 0.6 * s, w * 0.3, 0.6 * s); x.fillRect(a + w * 0.3, ty - 2.2 * s, Math.max(0.4, 0.08 * s), 2.2 * s); }
}
/** a soft additive glow (night lights on the stone) */
export function glow(x, cx, cy, r, col, a) {
  if (r <= 0 || a <= 0) return;
  x.save(); x.globalCompositeOperation = 'lighter';
  const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, rgb(col, a)); g.addColorStop(1, rgb(col, 0));
  x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2);
  x.restore();
}

/**
 * Cast shadows (day, golden hour): a taller neighbour on the sun's side throws a slanted shadow across a building's front
 * (the real sun's side and height: a low sun throws it long). items: one baked group's buildings; returns Map(b → triangle),
 * drawn right after that building (drawShadow) so whatever stands nearer covers it.
 */
export function shadowsFor(cam, blocks, T) {
  const out = new Map(), k = T.day + 0.6 * T.gold;
  if (k < 0.08 || !T.sunDir) return out;
  const slope = Math.max(0.35, Math.min(2.6, Math.tan(Math.max(4, T.sunEl || 20) * Math.PI / 180)));
  const bx = blocks.map(b => { const [a, ty] = P(cam, b.x0, (b.y0 || 0) + b.h, b.z0), [c, by] = P(cam, b.x1, b.y0 || 0, b.z0); return { a, c, ty, by, b }; });
  for (const me of bx) {
    const edge = T.sunDir > 0 ? me.c : me.a;
    let best = null;
    for (const n of bx) {
      if (n === me || n.b.z0 > me.b.z0 + 4 || n.ty >= me.ty - 2 || n.by < me.ty) continue;
      const nEdge = T.sunDir > 0 ? n.a : n.c;
      if (Math.abs(nEdge - edge) > 2.5 || (T.sunDir > 0 ? n.c < me.c : n.a > me.a)) continue;
      if (!best || n.ty < best.ty) best = n;
    }
    if (!best) continue;
    const w = me.c - me.a, len = Math.min(w * 0.85, (me.ty - best.ty) * 0.9 / slope + 4), drop = len * slope;
    out.set(me.b, { pts: [[edge, me.ty], [edge - T.sunDir * len, me.ty], [edge, Math.min(me.by, me.ty + drop)]], a: 0.2 * k * (1 - fog(me.b.z0) * 0.7) });
  }
  return out;
}
export function drawShadow(x, sh) {
  if (!sh) return;
  x.fillStyle = `rgba(36,30,62,${sh.a})`;
  x.beginPath(); sh.pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.fill();
}

/** a haze veil at a band's feet (the distance dissolves): from the ground line up `up` pt, in the haze colour */
export function hazeVeil(x, cam, z, up, T, a) {
  const y = cam.VPY + cam.F * cam.CAMH / z;
  const g = x.createLinearGradient(0, y - up, 0, y + 2);
  g.addColorStop(0, rgb(T.haze, 0)); g.addColorStop(1, rgb(T.haze, a));
  x.fillStyle = g; x.fillRect(0, y - up, cam.W, up + 2);
}
