// CITY 2.0 — THE HARBOR, PART 11a-1: DAY OF THE DEAD ON THE NEON SIGN (drawn by the sign's dressing: screens/harbor/signdress.js;
// docs/harbor.md#part-11a-1) — warm + colourful remembrance, never spooky. In LOGO UNITS (the letters 0..332 × 0..100, y down).
//   THE MARIGOLD GARLAND   cempasúchil pompoms (dense ruffled petals: deep orange at the rim, gold toward the heart, a shadow under
//                          each) on a rope of dark leaves, draped along the letters' tops + swagging into the gaps, strands of
//                          VARYING lengths hanging at the gaps + the ends, each finished with a bigger bloom
//   PAPEL PICADO           cut tissue flags (a border of scallops, a flower cut in the middle, diamonds + dots, a fringed foot) on
//                          strings between the letters — magenta, orange, purple, green, yellow, turquoise — fluttering in the REAL
//                          wind (a breath of air when it's calm), backlit by the neon at night
//   CANDLES                pillar candles in twos + threes at the sign's foot (LOGO_ANCHORS.base): wax drips, a flickering flame each,
//                          their warm light pooled on the tubes' feet
// The dressing goes up with `k` (core/harbor-holiday.js#dotdPieces().sign: the crew's morning) and comes down the same way on Nov 3.
import { rngFrom, hashString } from '../../core/rng.js';
import { LOGO_ANCHORS } from '../../ui/logo.js';
import { safeCtx } from '../../ui/canvas-safe.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, t) => a + (b - a) * t;

// ------------------------------------------------------------------ the geometry (PURE)
/** the garland's run: swags along the letters' tops (control points: [x, y], the sag between them is the swag's own) */
const RUN = [
  { a: [-3, 6], b: [64, -1], sag: 13 }, { a: [64, -1], b: [103, -1], sag: 11 }, { a: [103, -1.5], b: [154, -1.5], sag: 1.5 },
  { a: [154, -1], b: [196, 1], sag: 10 }, { a: [196, 1], b: [222, 1], sag: -6 }, { a: [222, 1], b: [271, 2], sag: 12 }, { a: [271, 2], b: [334, 4], sag: 13 },
];
/** the hanging strands: where (on the run), how long (VARYING) */
const STRANDS = [{ x: -2, len: 34 }, { x: 80, len: 17 }, { x: 87, len: 10 }, { x: 173, len: 12 }, { x: 246, len: 19 }, { x: 255, len: 11 }, { x: 335, len: 28 }];
/** papel picado: strings between the letters, their flags */
const PAPEL = [{ a: [64, 30], b: [92, 26], sag: 6, n: 2 }, { a: [148, 52], b: [180, 44], sag: 7, n: 2 }, { a: [236, 44], b: [268, 52], sag: 7, n: 2 }];
const FLAG_COLS = [[255, 52, 150], [255, 140, 24], [150, 70, 235], [52, 196, 104], [255, 210, 40], [30, 200, 210]];
/** points along a swag (a sagging curve a → b) */
function swag(a, b, sag, n) { const out = []; for (let i = 0; i <= n; i++) { const t = i / n; out.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t) + Math.sin(Math.PI * t) * sag]); } return out; }
/** PURE: the blooms (+ their leaves) of the garland + its strands: [{ x, y, r, col, order }] — order: when it goes up (0..1) */
export function garlandBlooms() {
  const R = rngFrom(hashString('dotd|garland')), out = [], leaves = [];
  for (const s of RUN) {
    const len = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]) + Math.abs(s.sag) * 1.2, n = Math.max(3, Math.round(len / 4.4));
    const pts = swag(s.a, s.b, s.sag, n);
    pts.forEach(([x, y], i) => { if (i === 0 && out.length) return; out.push({ x: x + (R() - 0.5) * 0.8, y: y + (R() - 0.5) * 1.1 - 0.6, r: 2.7 + R() * 0.9, c: R(), order: 0 }); if (R() < 0.7) leaves.push({ x: x + (R() - 0.5) * 3, y: y + 1.2 + R() * 1.4, a: (R() - 0.5) * 2.4, l: 2.4 + R() * 1.4 }); });
  }
  for (const st of STRANDS) {
    // the strand hangs from the run at x: find the run's y there
    let y0 = 0; for (const s of RUN) if (st.x >= Math.min(s.a[0], s.b[0]) - 3 && st.x <= Math.max(s.a[0], s.b[0]) + 3) { const t = clamp01((st.x - s.a[0]) / (s.b[0] - s.a[0])); y0 = lerp(s.a[1], s.b[1], t) + Math.sin(Math.PI * t) * s.sag; break; }
    const n = Math.max(2, Math.round(st.len / 3.9));
    for (let i = 1; i <= n; i++) { const last = i === n; out.push({ x: st.x + Math.sin(i * 0.9) * 0.5, y: y0 + i * st.len / n, r: last ? 3.5 : 2.2 + R() * 0.5, c: R(), order: 0, strand: true }); }
  }
  // the order they go up: the crew works left → right, with a little seeded jitter
  for (const b of out) b.order = clamp01((b.x + 10) / 360 * 0.85 + R() * 0.15);
  return { blooms: out, leaves };
}
/** PURE: the candles: [{ x, base, h, w, ph }] — in twos + threes at the sign's foot */
export function candleSet() {
  const R = rngFrom(hashString('dotd|candles')), out = [];
  LOGO_ANCHORS.base.forEach(([ax], gi) => {
    const n = gi % 2 ? 2 : 3;
    for (let i = 0; i < n; i++) out.push({ x: ax + (i - (n - 1) / 2) * 6.2 + (R() - 0.5) * 1.2, base: 111, h: 9 + R() * 9, w: 4.3 + R() * 1.2, ph: R() * 100, g: gi, order: clamp01(gi / 6 + R() * 0.1) });
  });
  return out;
}
/** PURE: the papel picado flags: [{ x, y (the string's point it hangs from), w, h, col, ph }] */
export function papelFlags() {
  const R = rngFrom(hashString('dotd|papel')), out = [];
  PAPEL.forEach((s, si) => { for (let i = 0; i < s.n; i++) { const t = (i + 0.5) / s.n; out.push({ x: lerp(s.a[0], s.b[0], t), y: lerp(s.a[1], s.b[1], t) + Math.sin(Math.PI * t) * s.sag, w: 10.5, h: 13, col: FLAG_COLS[(si * 2 + i + 1) % FLAG_COLS.length], ph: R() * TAU, s: si }); } });
  return out;
}

// ------------------------------------------------------------------ the sprites (baked at the device scale)
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
/** a cempasúchil pompom: ~70 small ruffled petals packed in a disc, deep orange at the rim → gold at the heart, shaded below */
function bloomSprite(px, hue, night, seed) {
  const S = Math.ceil(px * 2.3), c = mk(S, S), x = safeCtx(c), R = rngFrom(seed), cx = S / 2, cy = S / 2, r = px;
  const base = hue < 0.5 ? [[200, 66, 4], [250, 122, 12], [255, 176, 40]] : [[222, 112, 8], [255, 168, 22], [255, 212, 76]];
  const k = night ? 0.42 : 1;
  const col = (t, j) => { const a = t < 0.5 ? base[0] : base[1], b = t < 0.5 ? base[1] : base[2], u = t < 0.5 ? t * 2 : (t - 0.5) * 2; return a.map((v, i) => Math.min(255, (lerp(v, b[i], u) + j) * k) | 0); };
  // the body's shadow side first (a pompom is a ball)
  const g0 = x.createRadialGradient(cx - r * 0.25, cy - r * 0.3, r * 0.2, cx, cy, r * 1.05); g0.addColorStop(0, `rgb(${col(0.8, 0)})`); g0.addColorStop(1, `rgb(${col(0, -40)})`);
  x.fillStyle = g0; x.beginPath(); x.arc(cx, cy, r * 0.98, 0, TAU); x.fill();
  const petals = [];
  for (let i = 0; i < 74; i++) { const d = Math.sqrt(R()) * r * 0.92, a = R() * TAU; petals.push([d, a]); }
  petals.sort((p, q) => q[0] - p[0]);
  for (const [d, a] of petals) {
    const px2 = cx + Math.cos(a) * d, py2 = cy + Math.sin(a) * d * 0.94, t = 1 - d / r, shade = (py2 - cy) / r * -26 + (R() - 0.5) * 22;
    const pr = r * (0.2 + 0.12 * (1 - t)) * (0.8 + R() * 0.4);
    x.fillStyle = `rgb(${col(clamp01(t * 1.2), shade)})`;
    x.beginPath();
    // a ruffled petal: a scalloped half-disc facing out
    const n = 5, oa = a + (R() - 0.5) * 0.6;
    for (let j = 0; j <= n; j++) { const u = oa - Math.PI / 2 + Math.PI * j / n, rr = pr * (0.82 + 0.18 * (j % 2)); x.lineTo(px2 + Math.cos(u) * rr, py2 + Math.sin(u) * rr); }
    x.closePath(); x.fill();
    x.strokeStyle = `rgba(${night ? '60,20,0' : '150,52,0'},0.32)`; x.lineWidth = Math.max(0.5, pr * 0.14); x.stroke();
  }
  // the heart + a soft light from above-left, the shadow under
  x.fillStyle = `rgba(${col(0.15, -30)},0.85)`; x.beginPath(); x.arc(cx + r * 0.04, cy + r * 0.04, r * 0.14, 0, TAU); x.fill();
  const g1 = x.createRadialGradient(cx - r * 0.35, cy - r * 0.4, 0, cx - r * 0.35, cy - r * 0.4, r * 0.9);
  g1.addColorStop(0, `rgba(255,236,170,${night ? 0.08 : 0.32})`); g1.addColorStop(1, 'rgba(255,236,170,0)'); x.fillStyle = g1; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill();
  const g2 = x.createRadialGradient(cx + r * 0.2, cy + r * 0.55, 0, cx + r * 0.2, cy + r * 0.55, r * 0.9);
  g2.addColorStop(0, 'rgba(40,10,0,0.4)'); g2.addColorStop(1, 'rgba(40,10,0,0)'); x.fillStyle = g2; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill();
  return c;
}
/** a papel picado flag: tissue colour, a scalloped border, a flower cut in the middle, diamonds + dots, a fringed foot */
function flagSprite(pw, ph, col, night) {
  const c = mk(pw, ph + 2), x = safeCtx(c), w = pw, h = ph, k = night ? 0.5 : 1;
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, `rgb(${col.map(v => Math.min(255, v * k * 1.08) | 0)})`); g.addColorStop(1, `rgb(${col.map(v => v * k * 0.86 | 0)})`);
  x.fillStyle = g; x.fillRect(0, 0, w, h * 0.9);
  // the fringed foot (zigzag)
  x.beginPath(); x.moveTo(0, h * 0.9); const nz = 7; for (let i = 0; i <= nz; i++) x.lineTo(w * i / nz, h * (i % 2 ? 1 : 0.9)); x.lineTo(w, h * 0.9); x.closePath(); x.fill();
  // the cuts
  x.globalCompositeOperation = 'destination-out';
  const u = w / 8.2;
  const hole = (fn) => { x.beginPath(); fn(); x.fill(); };
  // a border of small scallops just inside the edge
  for (let i = 0; i < 6; i++) hole(() => x.arc(w * (i + 0.5) / 6, h * 0.1, u * 0.32, 0, TAU));
  for (let i = 0; i < 5; i++) { hole(() => x.arc(w * 0.1, h * (0.25 + i * 0.14), u * 0.26, 0, TAU)); hole(() => x.arc(w * 0.9, h * (0.25 + i * 0.14), u * 0.26, 0, TAU)); }
  // the flower: six petals round a dot
  const fx = w / 2, fy = h * 0.46;
  for (let i = 0; i < 6; i++) { const a = i * TAU / 6; hole(() => x.ellipse(fx + Math.cos(a) * u * 1.15, fy + Math.sin(a) * u * 1.15, u * 0.7, u * 0.38, a, 0, TAU)); }
  hole(() => x.arc(fx, fy, u * 0.42, 0, TAU));
  // diamonds above + below
  for (const dy of [-1, 1]) hole(() => { const cy = fy + dy * u * 2.55; x.moveTo(fx, cy - u * 0.45); x.lineTo(fx + u * 0.6, cy); x.lineTo(fx, cy + u * 0.45); x.lineTo(fx - u * 0.6, cy); x.closePath(); });
  for (const dx of [-1, 1]) hole(() => x.arc(fx + dx * u * 2.4, fy + u * 2.4, u * 0.3, 0, TAU));
  x.globalCompositeOperation = 'source-over';
  // the tissue's fold at the top (it hangs over the string)
  x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(0, 0, w, Math.max(1, h * 0.04));
  return c;
}

export function createDotdDress() {
  const G = garlandBlooms(), C = candleSet(), F = papelFlags();
  let spr = null, sprKey = '', lastK = 0;
  /** the sprites at this scale + light, built in slices: prepare(sc, day) → [fn…] (one sprite each — the bake runs them across
   *  frames); sprites() builds whatever is still missing */
  function prepare(sc, day) {
    const key = `${sc.toFixed(2)}|${day}`;
    if (key !== sprKey || !spr) { sprKey = key; spr = { bloom: [], flag: [] }; }
    const night = day < 0.5, out = [];
    for (let i = 0; i < 4; i++) out.push(() => { if (!spr.bloom[i]) spr.bloom[i] = { base: bloomSprite(3.6 * sc, i % 2 ? 0.7 : 0.3, night, 101 + i), lit: bloomSprite(3.6 * sc, i % 2 ? 0.7 : 0.3, false, 101 + i) }; });
    FLAG_COLS.forEach((col, i) => out.push(() => { if (!spr.flag[i]) spr.flag[i] = { base: flagSprite(10.5 * sc, 13 * sc, col, night), lit: flagSprite(10.5 * sc, 13 * sc, col, false) }; }));
    return out;
  }
  function sprites(sc, day) { for (const fn of prepare(sc, day)) fn(); return spr; }
  const scOf = x => { const m = x.getTransform ? x.getTransform() : { a: 3 }; return m.a || 3; };

  /** the static pieces (the caches): the garland + its strands, the strings, the candles' bodies. o = { layer, day, light, px } */
  function paint(x, k, o) {
    lastK = k;
    const sc = scOf(x), S = sprites(sc, o.day), glow = o.layer === 'glow';
    x.save(); x.lineCap = 'round'; x.lineJoin = 'round';
    const doG = o.part !== 'rest', doR = o.part !== 'garland';
    // ---- the garland's leafy rope (silk layer only) + the strands' threads
    const up = b => b.order <= k * 1.02;
    if (!glow && doG) {
      const g = o.day > 0.5 ? 'rgb(44,92,40)' : 'rgb(18,36,20)';
      x.strokeStyle = g; x.lineWidth = 1.6;
      for (const s of RUN) { const pts = swag(s.a, s.b, s.sag, 12), f = clamp01((k * 1.05 - (s.a[0] + 10) / 360 * 0.85) * 6); if (f <= 0) continue; x.beginPath(); pts.slice(0, Math.max(2, Math.ceil(pts.length * f))).forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py))); x.stroke(); }
      x.lineWidth = 0.35; x.strokeStyle = o.day > 0.5 ? 'rgb(60,80,40)' : 'rgb(24,30,18)';
      for (const lf of G.leaves) { if ((lf.x + 10) / 360 * 0.85 > k) continue; x.fillStyle = g; x.save(); x.translate(lf.x, lf.y); x.rotate(lf.a); x.beginPath(); x.ellipse(0, 0, lf.l, lf.l * 0.32, 0, 0, TAU); x.fill(); x.restore(); }
    }
    // ---- the blooms: their colour in the ambient light (silk) · their glow in the neon (glow: the bright sprite × the light there)
    if (doG) for (let i = 0; i < G.blooms.length; i++) {
      const b = G.blooms[i]; if (!up(b)) continue;
      const sp = S.bloom[(i * 7 + (b.c > 0.5 ? 1 : 0)) % 4], d = b.r * 2.3 / 2;
      if (!glow) { x.drawImage(sp.base, b.x - d, b.y - d, d * 2, d * 2); continue; }
      const L = o.light(b.x, b.y), a = clamp01(L.i * 0.4); if (a < 0.03) continue;
      x.globalAlpha = a; x.drawImage(sp.lit, b.x - d, b.y - d, d * 2, d * 2); x.globalAlpha = 1;
    }
    // ---- papel picado: the strings (the flags are dyn — they flutter)
    if (!glow && doR && k > 0.3) { x.strokeStyle = o.day > 0.5 ? 'rgba(250,246,236,0.85)' : 'rgba(120,110,120,0.6)'; x.lineWidth = 0.28; for (const s of PAPEL) { if (!s.n) continue; const pts = swag(s.a, s.b, s.sag, 10); x.beginPath(); pts.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py))); x.stroke(); } }
    // ---- the candles' bodies (the flames are dyn)
    if (!glow && doR) for (const cd of C) {
      if (cd.order > k * 1.7 - 0.55) continue;
      const x0 = cd.x - cd.w / 2, top = cd.base - cd.h;
      const g = x.createLinearGradient(x0, 0, x0 + cd.w, 0), dk = o.day > 0.5 ? 1 : 0.78;
      g.addColorStop(0, `rgb(${150 * dk | 0},${122 * dk | 0},${92 * dk | 0})`); g.addColorStop(0.35, `rgb(${244 * dk | 0},${232 * dk | 0},${204 * dk | 0})`); g.addColorStop(1, `rgb(${170 * dk | 0},${142 * dk | 0},${110 * dk | 0})`);
      x.fillStyle = g; x.beginPath(); x.moveTo(x0, cd.base); x.lineTo(x0, top + 0.5); x.quadraticCurveTo(cd.x, top - 0.6, x0 + cd.w, top + 0.5); x.lineTo(x0 + cd.w, cd.base); x.closePath(); x.fill();
      // the wax lit from within near the flame (translucent: a warm glow in its top)
      const tg = x.createLinearGradient(0, top, 0, top + Math.min(5, cd.h * 0.6)); tg.addColorStop(0, 'rgba(255,190,90,0.75)'); tg.addColorStop(1, 'rgba(255,190,90,0)');
      x.fillStyle = tg; x.fillRect(x0, top, cd.w, Math.min(5, cd.h * 0.6));
      // the drips
      x.fillStyle = `rgb(${250 * dk | 0},${240 * dk | 0},${214 * dk | 0})`;
      for (const [u, l] of [[0.22, 2.2 + (cd.ph % 2)], [0.7, 1.4 + (cd.ph % 1.5)]]) { const dx = x0 + cd.w * u; x.beginPath(); x.moveTo(dx - 0.45, top + 0.3); x.lineTo(dx - 0.45, top + l); x.arc(dx, top + l, 0.45, Math.PI, 0, true); x.lineTo(dx + 0.45, top + 0.3); x.fill(); }
      // the wick
      x.strokeStyle = 'rgb(30,20,16)'; x.lineWidth = 0.32; x.beginPath(); x.moveTo(cd.x, top); x.lineTo(cd.x + 0.15, top - 1.1); x.stroke();
    }
    x.restore();
  }
  /** the moving pieces: the flags fluttering, the flames + their light. o = { day, light, lit, t, motion, wind } */
  function dyn(x, k, o) {
    const sc = scOf(x), S = sprites(sc, o.day), t = o.t || 0, mo = o.motion !== false;
    const wind = o.wind == null ? 2 : o.wind, amp = (0.06 + 0.32 * clamp01(wind / 9)) * (mo ? 1 : 0);
    // ---- the flags: hung from the string at their top edge, swinging + twisting a little in the air
    if (k > 0.3) for (let i = 0; i < F.length; i++) {
      const f = F[i], sp = S.flag[FLAG_COLS.indexOf(f.col)], tw = Math.sin(t * (1.6 + wind * 0.12) + f.ph) * amp + Math.sin(t * 3.7 + f.ph * 2) * amp * 0.35;
      x.save(); x.translate(f.x, f.y);
      x.transform(1, 0, tw * 0.55, 1, 0, 0);          // (skew: the foot swings)
      x.scale(1 - Math.abs(tw) * 0.25, 1 - Math.abs(tw) * 0.08);
      x.drawImage(sp.base, -f.w / 2, 0, f.w, f.h + 2 / sc);
      const L = o.light(f.x, f.y + f.h / 2), a = clamp01(L.i * 0.7 * (o.lit == null ? 1 : o.lit)) + (o.day > 0.5 ? 0 : 0);
      if (a > 0.03) { x.globalCompositeOperation = 'lighter'; x.globalAlpha = a * 0.7; x.drawImage(sp.lit, -f.w / 2, 0, f.w, f.h + 2 / sc); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; }
      x.restore();
    }
    // ---- the flames + their light on the tubes' feet
    const night = 1 - (o.day || 0) * 0.75;
    x.save();
    for (const cd of C) {
      if (cd.order > k * 1.7 - 0.55) continue;
      const top = cd.base - cd.h, n = mo ? Math.sin(t * 9.1 + cd.ph) * 0.5 + Math.sin(t * 15.7 + cd.ph * 1.7) * 0.3 + Math.sin(t * 2.3 + cd.ph) * 0.2 : 0;
      const fh = 4.0 * (1 + 0.12 * n), sway = mo ? Math.sin(t * 3.1 + cd.ph) * 0.35 + n * 0.15 : 0, fx = cd.x + 0.15, fy = top - 1.0;
      // the light: a warm pool on the tubes' feet + the halo round the flame (additive)
      x.globalCompositeOperation = 'lighter';
      const pg = x.createRadialGradient(fx, fy - 1, 0, fx, fy - 1, 15);
      pg.addColorStop(0, `rgba(255,170,70,${(0.42 * night * (1 + 0.08 * n)).toFixed(3)})`); pg.addColorStop(0.45, `rgba(255,130,40,${(0.12 * night).toFixed(3)})`); pg.addColorStop(1, 'rgba(255,120,30,0)');
      x.fillStyle = pg; x.fillRect(fx - 15, fy - 16, 30, 30);
      const hg = x.createRadialGradient(fx, fy - fh * 0.45, 0, fx, fy - fh * 0.45, 3.4);
      hg.addColorStop(0, `rgba(255,214,140,${(0.55 * night).toFixed(3)})`); hg.addColorStop(1, 'rgba(255,170,80,0)'); x.fillStyle = hg; x.fillRect(fx - 4, fy - fh - 3, 8, 8);
      x.globalCompositeOperation = 'source-over';
      // the flame: a teardrop — a blue foot, an orange skin, a near-white heart
      const tip = [fx + sway, fy - fh], tear = (w, hh, col) => { x.fillStyle = col; x.beginPath(); x.moveTo(fx, fy + 0.3); x.bezierCurveTo(fx - w, fy - 0.2, fx - w * 0.7 + sway * 0.4, fy - hh * 0.55, tip[0] - (tip[0] - fx) * (1 - hh / fh), fy - hh); x.bezierCurveTo(fx + w * 0.7 + sway * 0.4, fy - hh * 0.55, fx + w, fy - 0.2, fx, fy + 0.3); x.fill(); };
      tear(0.95, fh, 'rgba(255,140,30,0.92)');
      tear(0.62, fh * 0.72, 'rgba(255,214,110,0.98)');
      tear(0.34, fh * 0.42, 'rgba(255,250,228,1)');
      x.fillStyle = 'rgba(90,120,255,0.55)'; x.beginPath(); x.ellipse(fx, fy + 0.05, 0.42, 0.3, 0, 0, TAU); x.fill();
    }
    x.restore();
  }
  /** the moving parts' boxes (logo units): each candle group's flames + their pooled light, each flag's swing — the dirty rects */
  function boxes() {
    const out = [], groups = new Map();
    for (const cd of C) { if (cd.order > lastK * 1.7 - 0.55) continue; const g = groups.get(cd.g) || { x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9 }; g.x0 = Math.min(g.x0, cd.x); g.x1 = Math.max(g.x1, cd.x); g.y0 = Math.min(g.y0, cd.base - cd.h); g.y1 = Math.max(g.y1, cd.base - cd.h); groups.set(cd.g, g); }
    for (const g of groups.values()) out.push({ x0: g.x0 - 16, y0: g.y0 - 19, x1: g.x1 + 16, y1: g.y1 + 15 });
    if (lastK > 0.3) for (const f of F) out.push({ x0: f.x - f.w, y0: f.y - 1, x1: f.x + f.w, y1: f.y + f.h + 3 });
    return out;
  }
  return {
    paint, dyn, boxes, prepare,
    moving: o => o.motion !== false,
    debug: () => ({ blooms: G.blooms.filter(b => b.order <= lastK * 1.02).length, of: G.blooms.length, candles: C.filter(c => c.order <= lastK * 1.7 - 0.55).length, flags: lastK > 0.3 ? F.length : 0 }),
  };
}
