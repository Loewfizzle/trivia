// CITY 2.0 — THE HARBOR, PART 11a-1: THE SIGN DECORATION SYSTEM (docs/harbor.md#part-11a-1) — every holiday's + special event's
// dressing on the NEON sign, hung on the logo's own geometry (ui/logo.js: LOGO_LETTERS, LOGO_ANCHORS — logo units, the letters in
// 0..332 × 0..100, y down).
//
//   THE OVERLAY   one canvas INSIDE the logo's wrap (.nd-logo-wrap — title.js hands it over: scene.set({ dressHost })), absolutely
//                 placed over the SVG with margins (BOX: a web spans past the corners, candles stand under the base, a garland
//                 above), sized by a ResizeObserver, at the phone's FULL dpr (crisp at 3×). Inside the wrap it inherits the sign's
//                 opacity + transforms (the boot, the dims, the entrance).
//   THE KINDS     (the plan's section) WRAP (along the tubes, growing), PERCH (on the tops), TUBE (add-on tube pieces), SPARKLE,
//                 VISITOR (a creature over the sign). A piece = { id, kind, paint(x, o) [static], dyn(x, o) [moving, optional],
//                 moving(o) }; PIECES() picks them from the holiday state (core/harbor-holiday.js#holidayAt + its pieces).
//   THE LIGHT     the neon's light field over the box (lightField: each cell's colour, strength + direction from the tubes, built
//                 once per colour set) — the dew, the silk's sheen, the spider's rim, the blooms all read it.
//   THE COST      the static pieces are baked into two caches — 'silk' (the things themselves in the ambient light: rebaked on a
//                 change of stage / day / size) and 'glow' (what the NEON lights: composited × the sign's live level, so the boot,
//                 a dim or the TR-3B's blackout cost one blit, no rebake) — the canvas redraws only when something changed; a moving
//                 piece (the spider walking, candle flames, papel picado in the wind) at ≤ 30 fps (tier 0: 15), clipped to its box.
// ADD A DRESSING: a module like dress-halloween.js / dress-dotd.js + its entry in PIECES() (+ its pieces in core/harbor-holiday.js).
import { safeCtx } from '../../ui/canvas-safe.js';
import { LOGO_LETTERS } from '../../ui/logo.js';
import { flattenPath } from '../../core/tube-path.js';
import { WEB_SPECS, buildWeb, webGrowth, paintWeb, paintStrays, createSpider, createShimmer } from './dress-halloween.js';
import { createDotdDress } from './dress-dotd.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
/** the overlay's box in logo units (the SVG's viewBox is −26 −30 384 160) */
export const BOX = Object.freeze({ x0: -60, y0: -50, x1: 392, y1: 150 });
const VB = { x: -26, y: -30, w: 384 };
const PINK = [255, 46, 151];

// ------------------------------------------------------------------ THE LIGHT FIELD (PURE)
/** the tubes' sample points per letter (logo units, ~2 apart) */
let SAMPLES = null;
export function tubeSamples() {
  if (SAMPLES) return SAMPLES;
  // (evenly every ~2 units: a straight stroke comes out of flattenPath as its two ends only)
  SAMPLES = LOGO_LETTERS.map(L => {
    const out = [];
    for (const p of flattenPath(L.d, 1, L.x, 0, 2)) for (let i = 0; i < p.pts.length - 1; i++) {
      const [ax, ay] = p.pts[i], [bx, by] = p.pts[i + 1], n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / 2));
      for (let j = 0; j < n; j++) out.push([ax + (bx - ax) * j / n, ay + (by - ay) * j / n]);
    }
    return out;
  });
  return SAMPLES;
}
/**
 * lightField(cols, step) → { at(x, y) → { r, g, b, i, dx, dy } } — the neon's light at a point: its colour (0..255),
 * the strength i (~1.6 on a tube, ~0.8 ten units off, ~0.1 thirty off) and the unit direction TOWARD the light. cols: 4 × [r,g,b] (one
 * per letter: N E O N). A line source: a tight term (σ 6) + a broad one (σ 16). LAZY + SHARED: each grid cell's per-letter light is
 * computed on its first use (a web's bake touches a few hundred; the spider's walk a few more) and kept for every colour set —
 * the colours are mixed at the lookup (a full field up front cost ~190 ms on the laptop).
 */
const FIELD = { step: 4, nx: 0, ny: 0, cells: null, done: null, boxes: null };
function cellAt(i, j) {
  const F = FIELD, idx = j * F.nx + i;
  if (F.done[idx]) return idx;
  const S = tubeSamples(), x = BOX.x0 + i * F.step, y = BOX.y0 + j * F.step, s1 = 6, s2 = 16, k1 = 2 / (s1 * Math.sqrt(2 * Math.PI)), k2 = 0.5 * 2 / (s2 * Math.sqrt(2 * Math.PI));
  for (let l = 0; l < S.length; l++) {
    const b = F.boxes[l]; let I = 0, DX = 0, DY = 0;
    if (x > b[0] - 50 && x < b[2] + 50 && y > b[1] - 50 && y < b[3] + 50) for (const [sx, sy] of S[l]) {
      const ex = sx - x, ey = sy - y; if (ex > 50 || ex < -50 || ey > 50 || ey < -50) continue;
      const d2 = ex * ex + ey * ey, w = k1 * Math.exp(-d2 / (2 * s1 * s1)) + k2 * Math.exp(-d2 / (2 * s2 * s2)), d = Math.sqrt(d2) || 1;
      I += w; DX += w * ex / d; DY += w * ey / d;
    }
    const o = idx * 12 + l * 3; F.cells[o] = I; F.cells[o + 1] = DX; F.cells[o + 2] = DY;
  }
  F.done[idx] = 1;
  return idx;
}
function fieldInit() {
  const F = FIELD;
  if (F.cells) return F;
  F.nx = Math.ceil((BOX.x1 - BOX.x0) / F.step) + 1; F.ny = Math.ceil((BOX.y1 - BOX.y0) / F.step) + 1;
  F.cells = new Float32Array(F.nx * F.ny * 12); F.done = new Uint8Array(F.nx * F.ny);
  F.boxes = tubeSamples().map(pts => pts.reduce((b, [px, py]) => [Math.min(b[0], px), Math.min(b[1], py), Math.max(b[2], px), Math.max(b[3], py)], [1e9, 1e9, -1e9, -1e9]));
  return F;
}
/** the field's cells over a box (logo units) computed ahead, until performance.now() passes `until` → true when the box is done
 *  (the dressing warms what it will read over a few frames — never one long frame) */
export function warmField(b, until) {
  const F = fieldInit(), i0 = Math.max(0, Math.floor((b[0] - BOX.x0) / F.step)), i1 = Math.min(F.nx - 1, Math.ceil((b[2] - BOX.x0) / F.step));
  const j0 = Math.max(0, Math.floor((b[1] - BOX.y0) / F.step)), j1 = Math.min(F.ny - 1, Math.ceil((b[3] - BOX.y0) / F.step));
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { if (F.done[j * F.nx + i]) continue; cellAt(i, j); if (performance.now() > until) return false; }
  return true;
}
export function lightField(cols) {
  const F = fieldInit();
  const C = [0, 1, 2, 3].map(l => cols[l] || PINK);
  // a corner's light: the letters' strengths summed, their colours weighted by them
  const corner = (i, j, out) => {
    const o = cellAt(i, j) * 12; let I = 0, R = 0, G = 0, B = 0, DX = 0, DY = 0;
    for (let l = 0; l < 4; l++) { const w = F.cells[o + l * 3]; I += w; R += w * C[l][0]; G += w * C[l][1]; B += w * C[l][2]; DX += F.cells[o + l * 3 + 1]; DY += F.cells[o + l * 3 + 2]; }
    out[0] = I ? R / I : 0; out[1] = I ? G / I : 0; out[2] = I ? B / I : 0; out[3] = I; out[4] = DX; out[5] = DY;
  };
  const q = [new Float32Array(6), new Float32Array(6), new Float32Array(6), new Float32Array(6)];
  const at = (x, y) => {
    const fx = clamp01((x - BOX.x0) / (BOX.x1 - BOX.x0)) * (F.nx - 1), fy = clamp01((y - BOX.y0) / (BOX.y1 - BOX.y0)) * (F.ny - 1);
    const i0 = Math.min(F.nx - 2, Math.floor(fx)), j0 = Math.min(F.ny - 2, Math.floor(fy)), u = fx - i0, v = fy - j0;
    corner(i0, j0, q[0]); corner(i0 + 1, j0, q[1]); corner(i0, j0 + 1, q[2]); corner(i0 + 1, j0 + 1, q[3]);
    const m = k => (q[0][k] * (1 - u) + q[1][k] * u) * (1 - v) + (q[2][k] * (1 - u) + q[3][k] * u) * v;
    const dx = m(4), dy = m(5), dl = Math.hypot(dx, dy) || 1;
    return { r: m(0), g: m(1), b: m(2), i: m(3), dx: dx / dl, dy: dy / dl };
  };
  return { at, nx: F.nx, ny: F.ny };
}

// ------------------------------------------------------------------ THE SYSTEM
export function createSignDress() {
  let host = null, cv = null, x = null, ro = null, wpx = 0, dpr = 1, sc = 1, PW = 0, PH = 0;
  const cache = { silk: null, glow: null };
  let slowTask = { ms: 0 }, colsRef = null, colRef = null, job = null, staticKey = '', glowA = -1, lastDyn = 0, wasDyn = false, draws = 0, bakes = 0, lastMs = 0, lfKey = '', LF = null, on = false;
  const webs = WEB_SPECS.map(buildWeb);
  let spider = null, dotd = null, shimmer = null, lastEnv = null, prevBox = null, prevShim = [];

  function setHost(el) {
    if (el === host && cv && cv.isConnected) return;
    detach();
    host = el; if (!host || typeof document === 'undefined') return;
    cv = document.createElement('canvas'); cv.className = 'nd-dress-cv'; cv.setAttribute('aria-hidden', 'true');
    Object.assign(cv.style, { position: 'absolute', pointerEvents: 'none', left: '0px', top: '0px', display: 'none' });
    host.append(cv);
    if (typeof ResizeObserver === 'function') { ro = new ResizeObserver(es => { const w = es[0] && es[0].contentRect.width; if (w && Math.abs(w - wpx) > 0.25) { wpx = w; staticKey = ''; } }); ro.observe(host); }
    wpx = host.clientWidth || 0;           // (once, at attach — never in the frame loop)
    staticKey = '';
  }
  function detach() { if (ro) { ro.disconnect(); ro = null; } if (cv) cv.remove(); cv = null; x = null; host = null; free(); }
  function free() { if (job) { job.silk.width = job.silk.height = 0; job.glow.width = job.glow.height = 0; job = null; } for (const k of ['silk', 'glow']) if (cache[k]) { cache[k].width = cache[k].height = 0; cache[k] = null; } staticKey = ''; }
  function size() {
    dpr = Math.min(3, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
    const k = wpx / VB.w; sc = k * dpr;                       // device px per logo unit
    PW = Math.ceil((BOX.x1 - BOX.x0) * sc); PH = Math.ceil((BOX.y1 - BOX.y0) * sc);
    if (cv.width !== PW || cv.height !== PH) { cv.width = PW; cv.height = PH; x = safeCtx(cv); }
    Object.assign(cv.style, { left: `${((BOX.x0 - VB.x) * k).toFixed(2)}px`, top: `${((BOX.y0 - VB.y) * k).toFixed(2)}px`, width: `${(PW / dpr).toFixed(2)}px`, height: `${(PH / dpr).toFixed(2)}px` });
    return k;
  }
  const mk = () => { const c = document.createElement('canvas'); c.width = PW; c.height = PH; return c; };
  const toLogo = c => c.setTransform(sc, 0, 0, sc, -BOX.x0 * sc, -BOX.y0 * sc);

  /** the pieces up now (from the holiday + its pieces) */
  function want(env) {
    const H = env.holiday, P = env.pieces, out = [];
    if (H && H.id === 'halloween' && P) {
      if (P.web > 0) out.push('web');
      if (P.spider && webGrowth(webs[0], P.web) >= 0.36) out.push('spider');
    }
    if (H && H.id === 'dotd' && P && P.sign > 0.01) out.push('dotd');
    return out;
  }

  function frame(env) {
    lastEnv = env;
    if (!host || !cv) return;
    const ids = want(env);
    if (!ids.length) { if (on) { on = false; cv.style.display = 'none'; free(); spider = null; dotd = null; shimmer = null; } return; }
    if (!wpx) return;
    if (!on) { on = true; cv.style.display = ''; }
    const t0 = performance.now();
    const day = clamp01(1 - (env.dark == null ? 1 : env.dark)), dayB = Math.round(day * 2) / 2;
    if (env.letterCols !== colsRef || env.signCol !== colRef || !LF) {
      colsRef = env.letterCols; colRef = env.signCol;
      const cols = env.letterCols || [0, 1, 2, 3].map(() => env.signCol || PINK), ck = cols.map(c => c.join(',')).join('|');
      if (ck !== lfKey) { lfKey = ck; LF = lightField(cols); staticKey = ''; }
    }
    const ck = lfKey;
    const P = env.pieces || {};
    const stageQ = ids.includes('web') ? Math.round(P.web * 400) : 0, dotQ = ids.includes('dotd') ? Math.round(P.sign * 40) : 0;
    const key = `${ids.join(',')}|${stageQ}|${dotQ}|${dayB}|${ck}|${wpx.toFixed(1)}|${env.tier}`;
    const lightAt = (px, py) => LF.at(px, py);
    let rebaked = false;
    // ---- THE BAKE, in slices (never one long frame): warm the light field over what will be drawn, then each piece into fresh caches
    // (the old picture stays up meanwhile), then swap
    if (key !== staticKey && (!job || job.key !== key)) {
      if (job) { job.silk.width = job.silk.height = 0; job.glow.width = job.glow.height = 0; }
      size();
      const tasks = [];
      for (const L of ['silk', 'glow']) {
        const o = { layer: L, day: dayB, light: lightAt, px: 1 / sc, tier: env.tier };
        if (ids.includes('web')) { for (const w of webs) for (const part of ['threads', 'dew']) tasks.push([L, c => paintWeb(c, w, webGrowth(w, P.web), { ...o, part })]); tasks.push([L, c => paintStrays(c, P.web, o)]); }
        if (ids.includes('dotd')) {
          if (!dotd) dotd = createDotdDress();
          if (L === 'silk') for (const fn of dotd.prepare(sc, dayB)) tasks.push([L, fn]);
          for (const part of ['garland', 'rest']) tasks.push([L, c => dotd.paint(c, P.sign, { ...o, part })]);
        }
      }
      const boxes = [];
      if (ids.includes('web')) boxes.push([-14, -14, 152, 106], [262, -8, 342, 58], [140, -6, 210, 8]);
      if (ids.includes('dotd')) boxes.push([-16, -16, 348, 120]);
      job = { key, tasks, boxes, silk: mk(), glow: mk(), n: 0 };
      for (const L of ['silk', 'glow']) { const c = safeCtx(job[L]); toLogo(c); }
    }
    if (job) {
      const until = performance.now() + (cache.silk ? 3 : 5);
      while (job.boxes.length && performance.now() < until) { if (warmField(job.boxes[0], until)) job.boxes.shift(); }
      while (!job.boxes.length && job.n < job.tasks.length && (performance.now() < until || job.n === 0)) { const [L, fn] = job.tasks[job.n++], tq = performance.now(); fn(safeCtx(job[L])); const tm = performance.now() - tq; if (tm > slowTask.ms) slowTask = { ms: +tm.toFixed(1), n: job.n - 1, L }; }
      if (!job.boxes.length && job.n >= job.tasks.length) {
        for (const L of ['silk', 'glow']) { if (cache[L]) cache[L].width = cache[L].height = 0; cache[L] = job[L]; }
        staticKey = job.key; job = null; rebaked = true; bakes++;
      } else if (!cache.silk) return;
    }
    if (rebaked) {
      if (ids.includes('spider') && !spider) { spider = createSpider(webs[0], { seed: 11 }); }
      if (spider) spider.setReach(Math.max(10, 34 * webGrowth(webs[0], P.web)));
    }
    if (!ids.includes('spider')) spider = null;
    if (!ids.includes('dotd')) dotd = null;
    // SP4: the web's shimmer (a faint light travelling along the threads) — only on a web that is spun
    if (ids.includes('web') && !shimmer) shimmer = createShimmer(webs);
    if (!ids.includes('web')) shimmer = null;
    // ---- what moves this frame
    const t = env.t || 0, motion = env.motion !== false;
    if (spider) spider.step(t, { motion });
    if (shimmer) shimmer.step(t, { motion: motion && env.tier !== 0, growth: webs.map(w => webGrowth(w, P.web)) });
    const dyn = (spider && spider.moving()) || (shimmer && shimmer.moving()) || (dotd && dotd.moving({ motion, wind: env.wind, tier: env.tier }));
    const lit = clamp01(env.signLit == null ? 1 : env.signLit), gA = Math.round(lit * 48) / 48;
    const now = performance.now(), fps = env.tier === 0 ? 15 : 30;
    const due = rebaked || gA !== glowA || (dyn && now - lastDyn >= 1000 / fps - 2) || (!dyn && wasDyn);
    if (!due) return;
    const full = rebaked || gA !== glowA || !(spider || dotd || shimmer);
    glowA = gA; lastDyn = now; wasDyn = !!dyn; draws++;
    // ---- compose: silk, the neon's glow × the sign's level, then the moving things — a frame where only they moved is CLIPPED to
    // their boxes (the spider's last + this frame's; the flames + their light, the flags)
    const look = { day: dayB, light: lightAt, lit, t, motion, wind: env.wind, tier: env.tier, px: 1 / sc };
    const boxNow = spider ? spider.bbox() : null, shimNow = shimmer ? shimmer.boxes() : [];
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.save();
    if (!full) {
      const rs = [];
      if (boxNow) { const pb = prevBox || boxNow; rs.push({ x0: Math.min(boxNow.x0, pb.x0), y0: Math.min(boxNow.y0, pb.y0), x1: Math.max(boxNow.x1, pb.x1), y1: Math.max(boxNow.y1, pb.y1) }); }
      rs.push(...shimNow, ...prevShim);
      if (dotd) rs.push(...dotd.boxes());
      x.beginPath();
      for (const u of rs) { const rx = Math.floor((u.x0 - BOX.x0) * sc) - 2, ry = Math.floor((u.y0 - BOX.y0) * sc) - 2; x.rect(rx, ry, Math.ceil((u.x1 - u.x0) * sc) + 4, Math.ceil((u.y1 - u.y0) * sc) + 4); }
      x.clip();
    }
    x.clearRect(0, 0, PW, PH);
    x.globalAlpha = 1; x.drawImage(cache.silk, 0, 0);
    if (gA > 0.01) { x.globalCompositeOperation = 'lighter'; x.globalAlpha = gA; x.drawImage(cache.glow, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; }
    toLogo(x);
    if (dotd) dotd.dyn(x, P.sign, look);
    if (shimmer) shimmer.draw(x, look);
    if (spider) spider.draw(x, look);
    x.restore();
    prevBox = boxNow; prevShim = shimNow;
    lastMs = performance.now() - t0;
  }

  /** a tap (screen pt): the spider bolts down its line → { kind: 'spider' } | null */
  function hit(px, py) {
    if (!cv || !on || !spider || !lastEnv) return null;
    const r = cv.getBoundingClientRect(); if (!r.width) return null;
    const lx = BOX.x0 + (px - r.left) / r.width * (BOX.x1 - BOX.x0), ly = BOX.y0 + (py - r.top) / r.height * (BOX.y1 - BOX.y0);
    return spider.near(lx, ly, lastEnv.t || 0) ? { kind: 'spider' } : null;
  }

  return {
    setHost, frame, hit,
    debug: () => ({ on, pieces: lastEnv ? want(lastEnv) : [], web: lastEnv && lastEnv.pieces ? lastEnv.pieces.web : null, webs: webs.map(w => ({ id: w.id, radials: w.radials.length, spiral: w.spiral.length })),
      spider: spider ? spider.state() : null, legs: spider ? spider.legCheck() : null, shimmer: shimmer ? shimmer.state() : null, dotd: dotd ? dotd.debug() : null, draws, bakes, slowTask, ms: +lastMs.toFixed(2), canvas: cv ? [cv.width, cv.height] : null, dpr }),
    destroy: detach,
  };
}
