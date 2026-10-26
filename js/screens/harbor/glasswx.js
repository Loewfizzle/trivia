// CITY 2.0 — PART 9a: THE WEATHER ON THE SIGN + THE GLASS (only when real — the scene's THE WEATHER — or a preview). The owner's quality
// bar (plan.md "(after POLISH 5)"): legit + impressive, never cheap.
//   THE NEON LOGO IN THE RAIN   drops land on the tubes, BEAD (each a tiny LENS: the tube's colour refracted through it, a dark refraction
//                               rim, a hot caustic at its foot, a bright specular point toward the light), GATHER + MERGE, RUN along the
//                               tube's slope to its low points + the tubes' ends, and when one grows heavy it lets go: a DRIP falls with
//                               a glint. Lit at night they glow the tube's colour; by day they catch the sky on the pale glass.
//   FREEZING RAIN (ice)         a clear, slightly UNEVEN GLAZE over the tubes (thicker on their tops) with SPARKLE points catching the glow,
//                               small ICICLES under the mounting brackets + the tubes' low ends; the LIT tubes (warm) shed it — the
//                               glaze thins on them + the icicles drip.
//   THE GLASS UI                the dock (JOIN · the pill · HOST) + the menu / music buttons: rain BEADS on their glass (a few, a runner
//                               now and then down the curve) and, in the COLD, a pale crystalline FROST growing in from the edges with a
//                               cooler tint — only in the rim band: never over a word or an icon (the labels' contrast untouched), no
//                               icicles; taps pass through (pointer-events none). Reduced motion: the glass UI's weather is off; the
//                               sign's beads stay still.
// Small canvases (the sign's box, the dock's, each corner button's) allocated only while there is weather, fixed over the title at
// z-index 72 (over the buttons at 70, under every sheet at 75+), at the phone's dpr (≤ 3) — crisp beads. The tubes' geometry comes from the
// logo's own paths (ui/logo.js), mapped exactly like the scene's dark halo (scene.js#haloSprite).
import { safeCtx } from '../../ui/canvas-safe.js';
import { flattenPath } from '../../core/tube-path.js';
import { LOGO_LETTERS, LOGO_TUBE, LOGO_W } from '../../ui/logo.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// the logo's mounting clips (ui/logo.js#CLIPS — the brackets the icicles hang from), in its 332 × 100 box
const CLIPS = [[0, 30], [64, 70], [92, 30], [92, 76], [176, 50], [240, 50], [268, 30], [332, 70]];
/** the numbers (pt) — the beads' sizes, the drip's weight, the rates */
export const BEAD = Object.freeze({ r0: 0.8, rStick: 1.55, rDrip: 2.35, max: 120, land: 26, g: 1250 });

/** PURE: a polyline resampled every `step` pt → [{ x, y, tx, ty (the tangent), s (the length so far) }] */
export function resample(pts, step) {
  const out = []; let acc = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], d = Math.hypot(bx - ax, by - ay); if (d < 1e-6) continue;
    const tx = (bx - ax) / d, ty = (by - ay) / d;
    for (let u = out.length ? step - (acc % step || step) : 0; u < d; u += step) out.push({ x: ax + tx * u, y: ay + ty * u, tx, ty, s: acc + u });
    acc += d;
  }
  const L = pts[pts.length - 1], p = out[out.length - 1];
  if (L && (!p || Math.hypot(L[0] - p.x, L[1] - p.y) > step * 0.4)) out.push({ x: L[0], y: L[1], tx: p ? p.tx : 0, ty: p ? p.ty : 1, s: acc });
  return out;
}

/** PURE: the logo's tubes on screen from its rect (title.js#logoRect: the letters' inset box) — the same mapping as the scene's dark halo */
export function signGeometry(nr, step = 1.6) {
  const w0 = nr.w / 0.86, h0 = nr.h / 0.64, x0 = nr.x - w0 * 0.07, y0 = nr.y - h0 * 0.18, k = w0 / (LOGO_W + 52);
  const ox = x0 + 26 * k, oy = y0 + 30 * k, tubes = [];
  for (const L of LOGO_LETTERS) for (const poly of flattenPath(L.d, k, ox + L.x * k, oy, 1.5)) {
    const pts = resample(poly.pts, step);
    if (pts.length > 2) tubes.push({ pts, len: pts[pts.length - 1].s });
  }
  return { tubes, k, half: (LOGO_TUBE * k) / 2, clips: CLIPS.map(([x, y]) => [ox + x * k, oy + y * k]), box: { x: x0 - 6, y: y0 - 6, w: w0 + 12, h: h0 + 70 } };
}

/** a bead's lens sprite: the refracted colour, the dark rim, the caustic below, the specular above (16 px, scaled down) */
function lensSprite(col, lit = false, amb = 1) {
  const S = 32, c = mk(S, S), x = safeCtx(c), r = S / 2 - 1, cx = S / 2, cy = S / 2;
  const g = x.createRadialGradient(cx - r * 0.2, cy - r * 0.25, r * 0.1, cx, cy, r);
  // (a drop on a LIT tube glows its colour — a bright lens with only a thin dark refraction edge; by day / on glass: a clear lens, its
  // edge darker — the background bent through it)
  const hot = col.map(v => Math.min(255, Math.round(v * 0.55 + 125)));
  if (lit) { g.addColorStop(0, `rgba(${hot[0]},${hot[1]},${hot[2]},0.92)`); g.addColorStop(0.62, `rgba(${col[0]},${col[1]},${col[2]},0.9)`); g.addColorStop(0.9, `rgba(${Math.round(col[0] * 0.45)},${Math.round(col[1] * 0.3)},${Math.round(col[2] * 0.45)},0.8)`); g.addColorStop(1, 'rgba(0,0,0,0)'); }
  else { g.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},0.32)`); g.addColorStop(0.72, `rgba(${col[0]},${col[1]},${col[2]},0.62)`); g.addColorStop(0.93, `rgba(${Math.round(col[0] * 0.3)},${Math.round(col[1] * 0.25)},${Math.round(col[2] * 0.35)},0.75)`); g.addColorStop(1, 'rgba(0,0,0,0)'); }
  x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
  // the caustic: the light focused through the drop, at its foot (the tube's colour, hotter)
  const gc = x.createRadialGradient(cx + r * 0.1, cy + r * 0.5, 0, cx + r * 0.1, cy + r * 0.5, r * 0.45);
  gc.addColorStop(0, `rgba(${hot[0]},${hot[1]},${hot[2]},0.95)`); gc.addColorStop(1, `rgba(${hot[0]},${hot[1]},${hot[2]},0)`);
  if (lit || amb > 0.5) { x.fillStyle = gc; x.fillRect(0, 0, S, S); }
  // the specular: a crisp bright point toward the light (up-left) + a faint second one
  x.fillStyle = `rgba(255,255,255,${lit ? 0.98 : (0.3 + 0.68 * amb).toFixed(2)})`; x.beginPath(); x.ellipse(cx - r * 0.32, cy - r * 0.36, r * (lit ? 0.26 : 0.2), r * (lit ? 0.2 : 0.15), -0.6, 0, Math.PI * 2); x.fill();
  x.fillStyle = `rgba(255,255,255,${(0.4 * (lit ? 1 : amb)).toFixed(2)})`; x.beginPath(); x.arc(cx + r * 0.32, cy + r * 0.12, r * 0.08, 0, Math.PI * 2); x.fill();
  return c;
}

export function createGlassWeather({ host = typeof document !== 'undefined' ? document.body : null } = {}) {
  let dpr = 1, geo = null, signRect = null, glass = [], idle = false;
  const layers = new Map();                  // id → { cv, x, y, w, h, ctx }
  let beads = [], drips = [], sprites = new Map(), on = false, R = rng(1924);
  let frostCv = new Map(), frostK = 0, iceK = 0, spawnAcc = 0, first = true, icDrip = 0, frameN = 0, glassKey = '';
  const water = new Map(), elLayers = new Map();   // (SP3: each glass shape's water + its canvas inside the element)

  function layer(id, box) {
    if (!host) return null;
    let L = layers.get(id);
    const bw = Math.ceil(box.w), bh = Math.ceil(box.h);
    if (!L) { const cv = mk(1, 1); cv.className = 'nd-wxc'; cv.setAttribute('aria-hidden', 'true'); Object.assign(cv.style, { position: 'fixed', pointerEvents: 'none', zIndex: '72', left: '0px', top: '0px' }); host.append(cv); L = { cv, ctx: null }; layers.set(id, L); }
    if (L.x !== box.x || L.y !== box.y || L.w !== bw || L.h !== bh || L.d !== dpr) {
      Object.assign(L, { x: box.x, y: box.y, w: bw, h: bh, d: dpr });
      L.cv.width = Math.ceil(bw * dpr); L.cv.height = Math.ceil(bh * dpr);
      L.cv.style.left = `${box.x}px`; L.cv.style.top = `${box.y}px`; L.cv.style.width = `${bw}px`; L.cv.style.height = `${bh}px`;
      L.ctx = safeCtx(L.cv);
    }
    L.ctx.setTransform(dpr, 0, 0, dpr, -L.x * dpr, -L.y * dpr);
    L.ctx.clearRect(L.x, L.y, L.w, L.h);
    return L.ctx;
  }
  function dropLayers() { for (const L of layers.values()) L.cv.remove(); layers.clear(); }
  const sprite = (col, lit = false, amb = 1) => { const aq = Math.round(amb * 4) / 4, k = col.map(v => Math.round(v / 24) * 24).join(',') + (lit ? 'L' : '') + aq; let s = sprites.get(k); if (!s) { s = lensSprite(col.map(v => Math.round(v / 24) * 24), lit, aq); sprites.set(k, s); if (sprites.size > 24) sprites.delete(sprites.keys().next().value); } return s; };

  // ---------------------------------------------------------------- THE SIGN's beads (on its tubes)
  const tubeAt = b => geo.tubes[b.t].pts[Math.max(0, Math.min(geo.tubes[b.t].pts.length - 1, b.i))];
  function underside(p, side) {
    // the normal pointing DOWN (a horizontal tube: under it; a vertical one: its side — the bead's own)
    let nx = -p.ty, ny = p.tx; if (ny < 0 || (Math.abs(ny) < 0.25 && Math.sign(nx || 1) !== side)) { nx = -nx; ny = -ny; }
    return [nx, ny];
  }
  function stepBeads(sec, o) {
    if (!geo) return;
    // drops landing: on the tubes' TOPS mostly (where they fall) — they gather + run down to the underside
    spawnAcc += sec * o.rain * 34 * (o.tier === 0 ? 0.5 : 1);
    while (spawnAcc >= 1 && beads.length < (o.tier === 0 ? BEAD.max * 0.5 : BEAD.max)) {
      spawnAcc--;
      const t = Math.floor(R() * geo.tubes.length), pts = geo.tubes[t].pts;
      beads.push({ t, i: Math.floor(R() * pts.length), f: 0, r: BEAD.r0 + R() * 0.5, side: R() < 0.5 ? -1 : 1, age: 0 });
    }
    if (spawnAcc > 4) spawnAcc = 4;
    for (const b of beads) {
      b.age += sec;
      const pts = geo.tubes[b.t].pts, p = pts[b.i];
      // the slope: gravity along the tube; a bead over its stick size RUNS down it (faster the bigger + the steeper)
      const g = p.ty, slope = Math.abs(g);
      if (b.r > BEAD.rStick * (1 - 0.5 * slope) && slope > 0.12) {
        const v = (8 + 26 * (b.r - BEAD.rStick * 0.6)) * slope, dir = g > 0 ? 1 : -1;
        b.f += dir * v * sec / 1.6;
        while (b.f >= 1 && b.i < pts.length - 1) { b.f -= 1; b.i++; }
        while (b.f <= -1 && b.i > 0) { b.f += 1; b.i--; }
        if (b.i === 0 || b.i === pts.length - 1) b.f = 0;
      }
    }
    // MERGE: two beads close on the same tube become one (the volumes add)
    beads.sort((a, b) => a.t - b.t || a.i - b.i);
    for (let n = 1; n < beads.length; n++) {
      const a = beads[n - 1], b = beads[n];
      if (a.t === b.t && Math.abs(a.i - b.i) * 1.6 < (a.r + b.r) * 0.9 && !a.gone) { b.r = Math.cbrt(a.r ** 3 + b.r ** 3); b.side = a.r > b.r ? a.side : b.side; a.gone = true; }
    }
    // THE DRIP: a heavy bead at a low point (or a tube's end) lets go — a drop falls with a glint, the bead left smaller
    for (const b of beads) {
      if (b.gone || b.r < BEAD.rDrip) continue;
      const pts = geo.tubes[b.t].pts, p = pts[b.i], prev = pts[Math.max(0, b.i - 1)], next = pts[Math.min(pts.length - 1, b.i + 1)];
      const low = (p.y >= prev.y - 0.01 && p.y >= next.y - 0.01) || b.i === 0 || b.i === pts.length - 1 || Math.abs(p.ty) < 0.3;
      if (!low && Math.abs(p.ty) > 0.3) continue;
      const [nx, ny] = underside(p, b.side), off = geo.half * 0.9;
      drips.push({ x: p.x + nx * off, y: p.y + ny * off + b.r, v: 10, r: b.r * 0.62, y1: geo.box.y + geo.box.h - 4 });
      b.r *= 0.55;
    }
    beads = beads.filter(b => !b.gone && b.r > 0.3);
    // (the warm lit tubes shed the ice: a drop from an icicle's tip now and then)
    if (iceK > 0.1 && o.lit > 0.4 && icicleTips.length) { icDrip += sec * 0.9 * o.lit; while (icDrip >= 1) { icDrip--; const [ix, iy] = icicleTips[Math.floor(R() * icicleTips.length)]; drips.push({ x: ix, y: iy, v: 6, r: 0.8, y1: geo.box.y + geo.box.h - 4 }); } }
    for (const d of drips) { d.v += BEAD.g * sec; d.y += d.v * sec; }
    drips = drips.filter(d => d.y < d.y1);
  }
  let icicleTips = [];
  function drawSign(x, o) {
    const lit = clamp01(o.lit), day = clamp01(o.day), col = o.signCol || [255, 95, 180];
    // what a bead shows: the lit tube's colour (hot) at night; by day the pale pink glass + the sky
    // (SP3 — the owner's blackout-in-the-rain bug: the beads glowed PINK on dark letters. A bead only shows the light that's THERE: the
    // tube's colour × the sign's LIVE level (the blackout, the boot flicker, a sky message's dim — o.lit); unlit by day = clear water on
    // the pale glass with the sky's highlight; unlit at night = a dark clear drop with a faint glint of the night)
    const amb = clamp01(0.12 + 0.88 * day), glassC = [226, 222, 234], nightC = [64, 66, 92];
    const bc = [0, 1, 2].map(i => Math.round((glassC[i] * amb + nightC[i] * (1 - amb)) * (1 - lit) + col[i] * lit));
    // the FREEZING GLAZE (under the beads): a clear uneven sheet thicker on the tubes' tops, thinning on a lit (warm) tube + sparkles
    const ice = iceK * (1 - 0.45 * lit);
    if (ice > 0.01) {
      x.save(); x.lineCap = 'round'; x.lineJoin = 'round';
      for (const tb of geo.tubes) {
        const P = tb.pts;
        for (let i = 0; i < P.length - 1; i += 3) {
          const j = Math.min(P.length - 1, i + 3), uneven = 0.6 + 0.4 * Math.sin(P[i].s * 0.21 + tb.len) * Math.sin(P[i].s * 0.073);
          x.strokeStyle = `rgba(220,236,255,${(0.2 * ice * uneven).toFixed(3)})`; x.lineWidth = geo.half * 2 * (1.18 + 0.12 * uneven);
          x.beginPath(); x.moveTo(P[i].x, P[i].y - geo.half * 0.12); x.lineTo(P[j].x, P[j].y - geo.half * 0.12); x.stroke();
          // the glaze's edge highlight on the top
          x.strokeStyle = `rgba(255,255,255,${(0.32 * ice * uneven).toFixed(3)})`; x.lineWidth = 0.5;
          const [nx, ny] = underside(P[i], 1);
          x.beginPath(); x.moveTo(P[i].x - nx * geo.half * 1.1, P[i].y - ny * geo.half * 1.1); x.lineTo(P[j].x - nx * geo.half * 1.1, P[j].y - ny * geo.half * 1.1); x.stroke();
        }
      }
      // sparkle: points on the glaze catching the glow (seeded spots, twinkling)
      const sr = rng(77);
      for (let n = 0; n < 34; n++) {
        const tb = geo.tubes[Math.floor(sr() * geo.tubes.length)], p = tb.pts[Math.floor(sr() * tb.pts.length)], tw = 0.5 + 0.5 * Math.sin((o.t || 0) * (1.3 + sr() * 2.2) + sr() * 9);
        if (tw < 0.55) continue;
        const s = (0.5 + sr() * 0.9) * tw * ice, [nx, ny] = underside(p, 1), px = p.x - nx * geo.half * 0.7, py = p.y - ny * geo.half * 0.7;
        x.fillStyle = `rgba(255,255,255,${(0.95 * tw * ice * Math.max(amb, lit)).toFixed(3)})`; x.fillRect(px - s * 1.6, py - 0.25, s * 3.2, 0.5); x.fillRect(px - 0.25, py - s * 1.6, 0.5, s * 3.2);
      }
      // THE BRACKETS glazed (a pale sheen over each clip) + ICICLES under them and under the tubes' low ends — catching the tube's glow at
      // night (their colour + a bright edge), clear + pale by day; the warm lit tubes drip them (o.lit: icDrip)
      const ir = rng(31), ic = lit > 0.3 ? col.map(v => Math.round(v * 0.45 + 140)) : [232, 244, 255].map((v, i) => Math.round(v * amb + nightC[i] * (1 - amb))), il = 0.35 + 0.65 * Math.max(amb, lit);
      const spots = [...geo.clips.map(([cx, cy]) => [cx, cy + geo.half * 1.6, 1]), ...geo.tubes.flatMap(tb => [tb.pts[0], tb.pts[tb.pts.length - 1]].filter(p => p.ty > 0.6 || Math.abs(p.ty) < 0.2).map(p => [p.x, p.y + geo.half * 0.9, 0.8]))];
      for (const [cx, cy] of geo.clips) { x.fillStyle = `rgba(226,240,255,${(0.24 * iceK).toFixed(3)})`; x.fillRect(cx - geo.half * 0.55, cy - geo.half * 1.75, geo.half * 1.1, geo.half * 3.5); }
      icicleTips = [];
      for (const [cx, top, sz] of spots) for (let n = 0; n < 2 + Math.floor(ir() * 2); n++) {
        const ix = cx + (ir() - 0.5) * geo.half * 2.4, len = (3 + ir() * 7.5) * sz * (0.35 + 0.65 * iceK), w = (0.8 + ir() * 0.8) * sz;
        const g = x.createLinearGradient(0, top, 0, top + len); g.addColorStop(0, `rgba(${ic},${(0.9 * iceK * il).toFixed(3)})`); g.addColorStop(0.7, `rgba(${ic},${(0.45 * iceK * il).toFixed(3)})`); g.addColorStop(1, `rgba(${ic},0.06)`);
        x.fillStyle = g; x.beginPath(); x.moveTo(ix - w, top); x.lineTo(ix + w, top); x.quadraticCurveTo(ix + w * 0.3, top + len * 0.6, ix + (ir() - 0.5) * 0.3, top + len); x.quadraticCurveTo(ix - w * 0.35, top + len * 0.55, ix - w, top); x.fill();
        x.fillStyle = `rgba(255,255,255,${(0.9 * iceK * il).toFixed(3)})`; x.fillRect(ix - w * 0.45, top + 0.5, 0.55, len * 0.55);
        icicleTips.push([ix, top + len]);
      }
      x.restore();
    }
    // the beads: each a lens on the tube's underside (its own side on a vertical tube)
    const sp = sprite(bc, lit > 0.5, Math.max(amb, lit));
    x.save();
    for (const b of beads) {
      const p = tubeAt(b), [nx, ny] = underside(p, b.side), off = geo.half * (0.72 + 0.18 * clamp01(b.r / 2)), cx = p.x + nx * off, cy = p.y + ny * off + b.r * 0.15;
      const rr = b.r * (Math.abs(p.ty) > 0.5 ? 1 : 1.12);
      x.globalAlpha = 0.95; x.drawImage(sp, cx - rr, cy - rr * 1.08, rr * 2, rr * 2.2);
    }
    // the drips: a falling drop (stretched by its speed) with its glint
    for (const d of drips) {
      const st = Math.min(4, 1 + d.v / 220);
      x.globalAlpha = 0.9; x.drawImage(sp, d.x - d.r, d.y - d.r * st, d.r * 2, d.r * 2 * st);
      x.fillStyle = `rgba(255,255,255,${(0.95 * Math.max(amb, lit)).toFixed(2)})`; x.fillRect(d.x - 0.35, d.y - d.r * st * 0.6, 0.7, 0.9);
    }
    x.restore();
  }

  // ---------------------------------------------------------------- THE GLASS UI (the dock + the corner buttons)
  // the rim band each shape keeps its weather in: a circle's outer ring; the pill's top + bottom edges and its ends
  function bandPath(x, g, inset = 0) {
    x.beginPath();
    if (g.kind === 'circle') { const cx = g.x + g.w / 2, cy = g.y + g.h / 2, r = g.w / 2 - inset; x.arc(cx, cy, r, 0, Math.PI * 2); x.arc(cx, cy, r * g.inner, 0, Math.PI * 2, true); }
    else { const r = g.h / 2 - inset; x.roundRect(g.x + inset, g.y + inset, g.w - inset * 2, g.h - inset * 2, r); x.roundRect(g.x + g.edge, g.y + g.edge, g.w - g.edge * 2, g.h - g.edge * 2, Math.max(0, r - g.edge)); }
  }
  function frostSprite(g) {
    const key = `${g.id}|${Math.round(g.w)}x${Math.round(g.h)}|${g.kind}`;
    let f = frostCv.get(key); if (f) return f;
    const S = 2, cv = mk(g.w * S, g.h * S), x = safeCtx(cv), r = rng(g.id.length * 977 + Math.round(g.w));
    x.scale(S, S); x.lineCap = 'round';
    const W2 = g.w, H2 = g.h, cx = W2 / 2, cy = H2 / 2;
    // the rime: a frosted haze thickest at the rim + its grain
    if (g.kind === 'circle') { const gr = x.createRadialGradient(cx, cy, W2 / 2 * g.inner, cx, cy, W2 / 2); gr.addColorStop(0, 'rgba(220,236,255,0)'); gr.addColorStop(0.7, 'rgba(220,236,255,0.18)'); gr.addColorStop(1, 'rgba(232,244,255,0.42)'); x.fillStyle = gr; x.fillRect(0, 0, W2, H2); }
    else { for (const [y0, y1] of [[0, g.edge], [H2, H2 - g.edge]]) { const gr = x.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, 'rgba(232,244,255,0.42)'); gr.addColorStop(1, 'rgba(220,236,255,0)'); x.fillStyle = gr; x.fillRect(0, Math.min(y0, y1), W2, g.edge); } }
    for (let i = 0; i < W2 * H2 / 18; i++) { const px = r() * W2, py = r() * H2; x.fillStyle = `rgba(244,250,255,${(0.15 + r() * 0.35).toFixed(2)})`; x.fillRect(px, py, 0.5 + r() * 0.6, 0.5 + r() * 0.6); }
    // the feathers: dendrites from seeds on the rim, growing inward (a stem, twigs at ±60°, twigs again) — fine, pale blue-white
    const segs = [];
    const fern = (px, py, ang, len, w, depth) => {
      const steps = Math.max(3, Math.round(len / 1.4)); let qx = px, qy = py, dir = ang;
      for (let i = 0; i < steps; i++) {
        dir += (r() - 0.5) * 0.16; const st = len / steps, nx = qx + Math.cos(dir) * st, ny = qy + Math.sin(dir) * st, fade = 1 - i / steps;
        segs.push([qx, qy, nx, ny, w * (0.45 + 0.55 * fade), 0.5 + 0.5 * fade]);
        if (depth < 2 && i > 0 && r() < 0.62) { const tl = len * (depth ? 0.3 : 0.42) * fade * (0.5 + r() * 0.8), a1 = (0.8 + r() * 0.5); if (tl > 0.8) { if (r() < 0.85) fern(nx, ny, dir + a1, tl, w * 0.6, depth + 1); if (r() < 0.85) fern(nx, ny, dir - (0.8 + r() * 0.5), tl * (0.6 + r() * 0.6), w * 0.6, depth + 1); } }
        qx = nx; qy = ny;
      }
    };
    const n = Math.round((g.kind === 'circle' ? Math.PI * W2 : 2 * (W2 + H2)) / 4.6);
    for (let i = 0; i < n; i++) {
      let sx, sy, a;
      if (g.kind === 'circle') { const th = r() * Math.PI * 2; sx = cx + Math.cos(th) * W2 / 2 * 0.99; sy = cy + Math.sin(th) * H2 / 2 * 0.99; a = th + Math.PI + (r() - 0.5) * 0.9; }
      else { const e = r(); if (e < 0.4) { sx = r() * W2; sy = 0.5; a = Math.PI / 2 + (r() - 0.5) * 0.9; } else if (e < 0.8) { sx = r() * W2; sy = H2 - 0.5; a = -Math.PI / 2 + (r() - 0.5) * 0.9; } else { sx = e < 0.9 ? 0.5 : W2 - 0.5; sy = r() * H2; a = (e < 0.9 ? 0 : Math.PI) + (r() - 0.5) * 0.9; } }
      fern(sx, sy, a + (r() - 0.5) * 0.8, (g.kind === 'circle' ? W2 * 0.15 : g.edge * 1.05) * (0.35 + r() * r() * 1.1), 0.55 + r() * 0.35, 0);
    }
    for (const [ax, ay, bx, by, w, a] of segs) { x.strokeStyle = `rgba(214,234,255,${(0.18 * a).toFixed(3)})`; x.lineWidth = w * 2.2; x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke(); }
    for (const [ax, ay, bx, by, w, a] of segs) { x.strokeStyle = `rgba(248,252,255,${(0.7 * a).toFixed(3)})`; x.lineWidth = Math.max(0.25, w * 0.5); x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke(); }
    f = cv; frostCv.set(key, f);
    return f;
  }
  // SP3 — REAL WATER on the glass (the owner, Oct 26: "the real rain-on-a-window effect"): drops LAND + BEAD UP, GROW as more land and
  // MERGE with their neighbours; one heavy enough BREAKS the surface tension and STREAKS DOWN — picking up the drops in its path, leaving a
  // thin wet trail that beads back up — and FALLS OFF the bottom edge (a tiny drip). Each drop a little LENS (the sky / the city behind
  // FLIPPED into its lower half, the button's light, a bright specular point, a darker rim). More + faster in heavier rain; they dry off
  // slowly after it stops. Each shape's canvas lives INSIDE its element (z-index −1 in the corner buttons: over the glass, under the
  // icon) — so the weather fades / hides WITH its button every time (rest, menus, games, the TR-3B) and the labels draw on top.
  const inShape = (g, x, y, pad = 0.8) => {
    if (g.kind === 'circle') { const R = g.w / 2 - pad; return (x - g.w / 2) ** 2 + (y - g.h / 2) ** 2 < R * R; }
    const r = g.h / 2; if (x < pad || x > g.w - pad || y < pad || y > g.h - pad) return false;
    const cx = x < r ? r : x > g.w - r ? g.w - r : x; return (x - cx) ** 2 + (y - r) ** 2 < (r - pad) ** 2;
  };
  const bottomAt = (g, x) => {
    if (g.kind === 'circle') { const R = g.w / 2, dx = x - g.w / 2; return dx * dx >= R * R ? g.h / 2 : g.h / 2 + Math.sqrt(R * R - dx * dx); }
    const r = g.h / 2, cx = x < r ? r : x > g.w - r ? g.w - r : x, dx = x - cx; return r + Math.sqrt(Math.max(0, r * r - dx * dx));
  };
  /** the numbers (pt): a drop's landing size, the size that breaks the surface tension, the caps (the owner: a handful per button, a dozen
   *  or two on the dock), the streak's speed */
  const WATER = { r0: 0.6, r1: 1.25, rc: 1.65, capS: 8, capM: 12, capPill: 22, vMax: 52, acc: 95, dry: 0.006 };
  function waterOf(g) {
    let w = water.get(g.id);
    if (!w) { w = { drops: [], trails: [], drips: [], acc: 0, R: rng(g.id.length * 131 + 7), dirty: true, lastDry: 0 }; water.set(g.id, w); }
    return w;
  }
  function capOf(g) { return g.kind === 'pill' ? WATER.capPill : g.w > 50 ? WATER.capM : WATER.capS; }
  function mergeAll(w) {
    const D = w.drops;
    for (let i = 0; i < D.length; i++) {
      const a = D[i]; if (a.gone) continue;
      for (let j = i + 1; j < D.length; j++) {
        const b = D[j]; if (b.gone) continue;
        const dx = a.x - b.x, dy = a.y - b.y, rr = (a.r + b.r) * 0.82;
        if (dx * dx + dy * dy >= rr * rr) continue;
        const va = a.r ** 3, vb = b.r ** 3, keep = va >= vb || b.sl ? (b.sl && !a.sl ? b : a) : b, lose = keep === a ? b : a;
        keep.x = (a.x * va + b.x * vb) / (va + vb); keep.y = Math.max(a.y, b.y) - (keep.sl ? 0 : Math.abs(a.y - b.y) * 0.5);
        if (keep.sl) { keep.x = keep === a ? a.x : b.x; keep.y = Math.max(a.y, b.y); }
        keep.r = Math.cbrt(va + vb); lose.gone = true; w.dirty = true;
      }
    }
    if (D.some(d => d.gone)) w.drops = D.filter(d => !d.gone);
  }
  function stepWater(g, w, sec, o, now) {
    const R = w.R, rate = o.rain, heavy = smooth(0.6, 0.95, rate);
    // landing: drizzle a few, rain steady, heavy a lot (per unit of glass) — the cap keeps it a handful
    if (rate > 0.02) {
      w.acc += sec * (g.w * g.h / 1100) * (0.25 + 3.2 * rate * rate + 3 * heavy) * (o.tier === 0 ? 0.6 : 1);
      const cap = Math.round(capOf(g) * (o.tier === 0 ? 0.6 : 1) * (0.55 + 0.45 * smooth(0.2, 0.7, rate)));
      while (w.acc >= 1) {
        w.acc--;
        // (a drop landing ON a bead merges into it — the bead grows; else a new bead, while there's room)
        const x = R() * g.w, y = R() * g.h, hit = w.drops.find(d => (d.x - x) ** 2 + (d.y - y) ** 2 < (d.r + 0.6) ** 2);
        if (hit) { hit.r = Math.cbrt(hit.r ** 3 + (WATER.r0 + R() * 0.5) ** 3); w.dirty = true; }
        else if (w.drops.length < cap && inShape(g, x, y, 1.2)) { w.drops.push({ x, y, r: WATER.r0 + R() * R() * (WATER.r1 - WATER.r0), v: 0, sl: false, wob: R() * 6.28, d: 0, hold: 0 }); w.dirty = true; }
        else if (w.drops.length >= cap) { const s = w.drops.filter(d => !d.sl); if (s.length) { s.sort((a, b) => b.r - a.r); const d = s[Math.floor(R() * R() * s.length)]; d.r = Math.cbrt(d.r ** 3 + (WATER.r0 + R() * 0.5) ** 3); w.dirty = true; } }
      }
    } else w.acc = 0;
    // THE STREAK: over the critical size a drop breaks free — stick-slip down the glass (pauses + surges), a small sideways wander,
    // losing water to its trail (it shrinks) and leaving tiny beads behind; picks up what it meets (mergeAll); drips off the bottom edge
    const rc = WATER.rc * (g.kind === 'circle' && g.w < 50 ? 0.78 : 1);
    for (const d of w.drops) {
      if (!d.sl && d.r > rc) { d.sl = true; d.v = 2; d.trail = { pts: [[d.x, d.y]], t: now, r: d.r }; w.trails.push(d.trail); }
      if (!d.sl) continue;
      if (d.hold > 0) { d.hold -= sec; continue; }
      const vMax = WATER.vMax * (0.55 + 0.45 * smooth(rc, rc * 2.2, d.r)) * (1 + 0.35 * heavy);
      d.v = Math.min(vMax, d.v + WATER.acc * sec);
      const dy = d.v * sec; d.y += dy; d.d += dy;
      d.x += (Math.sin(d.y * 0.21 + d.wob) * 0.07 + Math.sin(d.y * 0.83 + d.wob * 3) * 0.03) * dy;   // (a near-straight run that meanders a little)
      d.r -= dy * 0.012; w.dirty = true;
      const tp = d.trail.pts, last = tp[tp.length - 1];
      if (Math.hypot(d.x - last[0], d.y - last[1]) > 1.1) { tp.push([d.x, d.y]); d.trail.t = now; }
      if (R() < dy * 0.07 && d.r > rc * 0.75) { w.drops.push({ x: d.x + (R() - 0.5) * 0.6, y: d.y - d.r * 1.4, r: 0.28 + R() * 0.2, v: 0, sl: false, wob: 0, d: 0, hold: 0 }); d.r = Math.cbrt(Math.max(0.01, d.r ** 3 - 0.03)); }
      if (R() < sec * 1.6) { d.hold = 0.08 + R() * 0.35; d.v *= 0.25; }      // (the stick-slip: it catches, then lets go)
      if (d.r < rc * 0.62) { d.sl = false; d.v = 0; }                          // (it ran out of water: a bead again)
      if (d.y > bottomAt(g, d.x) - d.r * 0.6) { w.drips.push({ x: d.x, y: d.y, v: d.v + 10, r: d.r * 0.75, a: 1 }); d.gone = true; }
    }
    if (w.drops.some(d => d.gone)) w.drops = w.drops.filter(d => !d.gone);
    mergeAll(w);
    // the drips falling off the bottom edge (a short fall — out of the canvas)
    for (const p of w.drips) { p.v += 900 * sec; p.y += p.v * sec; p.a -= sec * 3; }
    if (w.drips.length) { w.drips = w.drips.filter(p => p.a > 0 && p.y < g.h + 9); w.dirty = true; }
    // trails fade over ~2.5 s (a wet line that beads back up)
    if (w.trails.length) { w.trails = w.trails.filter(tr => now - tr.t < 2600); w.dirty = true; }
    // DRYING: no rain → the beads shrink + vanish over a minute or two (faster as the air dries); redrawn a few times a second
    if (rate <= 0.02 && w.drops.length) {
      const k = WATER.dry * (1 + 4 * (1 - clamp01(o.glassWet * 2)));
      for (const d of w.drops) { d.r -= k * sec; if (d.sl) d.sl = d.r > rc * 0.62; }
      w.drops = w.drops.filter(d => d.r > 0.22);
      if (now - w.lastDry > 250) { w.lastDry = now; w.dirty = true; }
    }
  }
  /** a drop's lens on the glass (48 px, drawn ~2–5 pt): the darker rim, the sky / city FLIPPED into its lower half, the button's light
   *  in that crescent, the specular point up-left */
  function waterSprite(sky, light) {
    const S = 48, c = mk(S, S), x = safeCtx(c), r = S / 2 - 1, cx = S / 2, cy = S / 2;
    x.save(); x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.clip();
    const g = x.createRadialGradient(cx, cy - r * 0.15, r * 0.1, cx, cy, r);
    g.addColorStop(0, `rgba(${sky[0] * 0.35 | 0},${sky[1] * 0.35 | 0},${sky[2] * 0.4 | 0},0.16)`); g.addColorStop(0.7, 'rgba(0,0,0,0.22)'); g.addColorStop(0.9, 'rgba(0,0,0,0.5)'); g.addColorStop(1, 'rgba(0,0,0,0.35)');
    x.fillStyle = g; x.fillRect(0, 0, S, S);
    // the flipped background: the bright sky / the lit city appears in the drop's LOWER half (a lens inverts)
    const gl = x.createRadialGradient(cx, cy + r * 0.62, 0, cx, cy + r * 0.62, r * 0.9);
    gl.addColorStop(0, `rgba(${light[0]},${light[1]},${light[2]},0.85)`); gl.addColorStop(0.55, `rgba(${sky[0]},${sky[1]},${sky[2]},0.45)`); gl.addColorStop(1, `rgba(${sky[0]},${sky[1]},${sky[2]},0)`);
    x.fillStyle = gl; x.beginPath(); x.ellipse(cx, cy + r * 0.5, r * 0.78, r * 0.48, 0, 0, Math.PI * 2); x.fill();
    x.restore();
    // a thin bright refraction edge along the bottom + the specular point (crisp) + a faint second one
    x.strokeStyle = `rgba(${light[0]},${light[1]},${light[2]},0.5)`; x.lineWidth = S * 0.04; x.beginPath(); x.arc(cx, cy, r * 0.9, Math.PI * 0.18, Math.PI * 0.82); x.stroke();
    x.fillStyle = 'rgba(255,255,255,0.96)'; x.beginPath(); x.ellipse(cx - r * 0.34, cy - r * 0.4, r * 0.24, r * 0.16, -0.6, 0, Math.PI * 2); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.35)'; x.beginPath(); x.arc(cx + r * 0.3, cy - r * 0.1, r * 0.08, 0, Math.PI * 2); x.fill();
    return c;
  }
  const wSprite = (sky, light) => { const q = v => Math.round(v / 20) * 20, s = sky.map(q), l = light.map(q), k = `W${s}|${l}`; let sp = sprites.get(k); if (!sp) { sp = waterSprite(s, l); sprites.set(k, sp); if (sprites.size > 24) sprites.delete(sprites.keys().next().value); } return sp; };
  // (reduced motion: a few still beads, seeded per shape — no landing, no streaks)
  function stillDrops(g, wet) {
    const R = rng(g.id.length * 97 + 3), n = Math.round(capOf(g) * 0.5 * wet), out = [];
    for (let i = 0; i < 40 && out.length < n; i++) { const x = R() * g.w, y = R() * g.h; if (inShape(g, x, y, 1.5)) out.push({ x, y, r: 0.4 + R() * 0.7 }); }
    return out;
  }
  function glassLayer(g) {
    let L = elLayers.get(g.id);
    if (L && (L.el !== g.el || !L.cv.isConnected)) { L.cv.remove(); elLayers.delete(g.id); L = null; }
    if (!L) {
      const cv = mk(1, 1); cv.className = 'nd-wxg'; cv.setAttribute('aria-hidden', 'true');
      Object.assign(cv.style, { position: 'absolute', left: '0px', top: '0px', pointerEvents: 'none', zIndex: g.group === 'corner' ? '-1' : '0' });
      g.el.prepend(cv); L = { cv, el: g.el, ctx: null }; elLayers.set(g.id, L);
    }
    const bw = Math.ceil(g.w), bh = Math.ceil(g.h) + 10;
    if (L.w !== bw || L.h !== bh || L.d !== dpr) { Object.assign(L, { w: bw, h: bh, d: dpr }); L.cv.width = Math.ceil(bw * dpr); L.cv.height = Math.ceil(bh * dpr); L.cv.style.width = `${bw}px`; L.cv.style.height = `${bh}px`; L.ctx = safeCtx(L.cv); }
    L.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); L.ctx.clearRect(0, 0, bw, bh);
    return L.ctx;
  }
  function dropGlassLayers(keep) { for (const [id, L] of elLayers) if (!keep || !keep.has(id)) { L.cv.remove(); elLayers.delete(id); } }
  function drawGlass(x, g, o, w) {
    const lg = { ...g, x: 0, y: 0 }, cold = frostK, day = clamp01(o.day);
    // COLD GLASS: a cooler tint over the rim band + the frost growing in from the rim (9a, unchanged)
    if (cold > 0.01) {
      x.save(); bandPath(x, lg); x.clip('evenodd');
      x.fillStyle = `rgba(190,214,250,${(0.14 * cold).toFixed(3)})`; x.fillRect(0, 0, g.w, g.h);
      x.globalAlpha = smooth(0, 0.6, cold) * 0.95; x.drawImage(frostSprite(lg), 0, 0, g.w, g.h); x.globalAlpha = 1;
      x.strokeStyle = `rgba(236,246,255,${(0.45 * cold).toFixed(3)})`; x.lineWidth = 0.8;
      x.beginPath(); if (g.kind === 'circle') x.arc(g.w / 2, g.h / 2, g.w / 2 - 0.6, 0, Math.PI * 2); else x.roundRect(0.6, 0.6, g.w - 1.2, g.h - 1.2, g.h / 2 - 0.6); x.stroke();
      x.restore();
    }
    const drops = w ? w.drops : stillDrops(g, clamp01(o.glassWet));
    if (!drops.length && !(w && (w.trails.length || w.drips.length))) return;
    // what the lenses show: the sky by day; at night the city's glow (the sign's colour, cooled) + the button's own light
    const sky = day > 0.5 ? [200, 216, 240] : [70, 74, 120], sc = o.signCol || [255, 95, 180];
    const light = day > 0.5 ? [236, 244, 255] : [Math.round(sc[0] * 0.55 + 100), Math.round(sc[1] * 0.45 + 110), Math.round(sc[2] * 0.5 + 120)];
    const sp = wSprite(sky, light);
    x.save();
    x.beginPath(); if (g.kind === 'circle') x.arc(g.w / 2, g.h / 2, g.w / 2, 0, Math.PI * 2); else x.roundRect(0, 0, g.w, g.h, g.h / 2); x.clip();
    // the wet trails: a thin film (a faint highlight with a darker edge), fading
    if (w) for (const tr of w.trails) {
      const a = 1 - (o.nowMs - tr.t) / 2600; if (a <= 0 || tr.pts.length < 2) continue;
      x.lineCap = 'round'; x.lineJoin = 'round';
      for (const [col, lw, al] of [['0,0,0', 0.8, 0.12], [day > 0.5 ? '240,246,255' : '196,200,236', 0.38, 0.24]]) {
        x.strokeStyle = `rgba(${col},${(al * a).toFixed(3)})`; x.lineWidth = Math.max(0.3, tr.r * lw);
        x.beginPath(); x.moveTo(tr.pts[0][0], tr.pts[0][1]); for (let i = 1; i < tr.pts.length; i++) x.lineTo(tr.pts[i][0], tr.pts[i][1]); x.stroke();
      }
    }
    for (const d of drops) {
      const st = d.sl ? 1 + Math.min(0.5, d.v / 60) : 1, rr = d.r;
      x.globalAlpha = 0.92; x.drawImage(sp, d.x - rr, d.y - rr * st * 1.05, rr * 2, rr * 2 * st * 1.05);
    }
    x.restore();
    // the drips falling off the bottom edge (outside the clip)
    if (w) for (const p of w.drips) { x.globalAlpha = 0.9 * clamp01(p.a); x.drawImage(sp, p.x - p.r, p.y - p.r * 1.6, p.r * 2, p.r * 3.2); }
    x.globalAlpha = 1;
  }

  return {
    /** the sign's rect (title.js#logoRect) — the tubes re-laid when it moves */
    setSign(nr) { if (!nr) return; if (signRect && Math.abs(signRect.x - nr.x) < 0.5 && Math.abs(signRect.y - nr.y) < 0.5 && Math.abs(signRect.w - nr.w) < 0.5) return; signRect = { ...nr }; geo = signGeometry(nr); beads = []; drips = []; },
    /** the glass shapes: [{ id, kind: 'circle' | 'pill', group, el, x, y, w, h }] (title.js: JOIN · the pill · HOST · ☰ · ♪); idle: the dock at rest */
    setGlass(list, isIdle = false) {
      glass = (list || []).filter(g => g.el).map(g => ({ ...g, inner: g.kind === 'circle' ? (g.w > 50 ? 0.7 : 0.66) : 0, edge: g.kind === 'pill' ? Math.min(9, g.h * 0.16) : 0 }));
      idle = !!isIdle;
    },
    /** o: { rain, drip, ice, cold (0..1), glassWet, lit (the sign's LIVE level 0..1), signCol, day, t, dt (ms), motion, tier, dpr } */
    frame(o) {
      const sec = Math.min(0.1, (o.dt || 16) / 1000), nowMs = performance.now();
      dpr = Math.min(3, o.dpr || 1); o.nowMs = nowMs;
      // (the frost forms over ~a minute + melts the same; a city OPENED on a cold day already has it — joined, never forming after the reveal)
      if (first && o.shown) { first = false; frostK = o.motion ? clamp01(o.cold) : 0; iceK = clamp01(o.ice); }
      frostK += ((o.motion ? clamp01(o.cold) : 0) - frostK) * Math.min(1, sec / 12);
      iceK += (clamp01(o.ice) - iceK) * Math.min(1, sec / 20);
      const signOn = !!geo && (o.rain > 0.02 || beads.length || drips.length || iceK > 0.01);
      if (signOn && o.motion && !(o.rain > 0.02) && iceK > 0.01) stepBeads(0, o);
      const anyWater = [...water.values()].some(w => w.drops.length || w.drips.length || w.trails.length);
      const glassOn = glass.length && (o.glassWet > 0.01 || frostK > 0.01 || o.rain > 0.02 || (o.motion && anyWater));
      on = signOn || glassOn;
      if (!on) { if (layers.size) dropLayers(); if (elLayers.size) dropGlassLayers(); return; }
      frameN++;
      if (signOn) {
        if (o.motion) stepBeads(sec, o);
        // (the speed round: tier 0 redraws the sign's beads every other frame — they move slowly; the drips at 30 fps still read)
        if (o.tier !== 0 || frameN % 2 === 0 || !layers.has('sign')) { const x = layer('sign', geo.box); if (x) drawSign(x, o); }
      } else if (layers.has('sign')) { layers.get('sign').cv.remove(); layers.delete('sign'); }
      if (glassOn) {
        const keep = new Set();
        const gk = `${Math.round(frostK * 40)}|${Math.round(o.day * 4)}|${o.motion ? 1 : Math.round(o.glassWet * 10)}`;
        const keyMoved = gk !== glassKey; glassKey = gk;
        for (const g of glass) {
          keep.add(g.id);
          // (the dock at rest is faded out — its water waits, still, and picks up where it was)
          if (g.group === 'dock' && idle) continue;
          const w = o.motion ? waterOf(g) : null;
          if (w) stepWater(g, w, sec, o, nowMs);
          const L = elLayers.get(g.id), sized = L && L.w === Math.ceil(g.w) && L.el === g.el && L.cv.isConnected;
          if ((w && w.dirty) || keyMoved || !sized) { const x = glassLayer(g); drawGlass(x, g, o, w); if (w) w.dirty = false; }
        }
        dropGlassLayers(keep);
      } else if (elLayers.size) dropGlassLayers();
    },
    debug: () => ({ on, beads: beads.length, drips: drips.length, frost: +frostK.toFixed(3), ice: +iceK.toFixed(3), layers: [...layers.keys()], glassLayers: [...elLayers.keys()], tubes: geo ? geo.tubes.length : 0, glass: glass.map(g => g.id),
      water: Object.fromEntries([...water].map(([id, w]) => [id, { drops: w.drops.length, streaking: w.drops.filter(d => d.sl).length, trails: w.trails.length, drips: w.drips.length }])) }),
    destroy() { dropLayers(); dropGlassLayers(); water.clear(); sprites.clear(); for (const f of frostCv.values()) f.width = 0; frostCv.clear(); geo = null; },
  };
}
