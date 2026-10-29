// CITY 2.0 — THE HARBOR, Part 6a: THE DRONE SHOW (docs/harbor/passes/part-6a.md; the owner's design, Oct 21 2026). A heavy sky event
// (it quiets the other lanes), at night only:
//   THE BARGE     out on the harbor: a dark steel hull, a deck of landing pads (each a soft blue light), a control hut with a
//                 lit window, red mast lights — it fades in as the show begins
//   POLISH 4 (the owner): THE DRONE SHOW IS A MESSAGE — the NIGHT version of skytyping; no opening figure, no shapes, no closing star.
//   LAUNCH        the drones lift off their pads in a rising stream from below the skyline (reflected in the water as they climb
//                 above the far quay) and CONVERGE STRAIGHT INTO the message's first page, lighting as they arrive
//   THE PAGES     each page of the message (core/harbor-sky.js#messagePages, the skytyping font's dots) held READABLE ~15 s
//                 (DRONE_READ) — the swarm flows into the next page (each drone matched in order across the picture, so they
//                 stream rather than cross; a soft arc on the way, the colour changing mid-flight), holds with a faint hover
//   HOME          a scatter (a slow outward breath + twinkle), then down to the barge, lights off as each one lands
// Every position is a function of the time since the show began (every phone sees the same show; a refresh lands mid-show).
// Drones: 180 / 140 / 90 by tier (the shapes resample to them). The formation fills the sky-low lane (+ a little of the
// skyline below it: the drones are in front of the city, over the harbor); drawn after the city and before the water (the mirror
// doubles them), the ones still low by the barge after the water.
import { droneShape, droneTimeline, hsv, dotLayout, messagePages, fillText } from '../../core/harbor-sky.js';
import { MARKS } from '../district/marks.js';
import { safeCtx } from '../../ui/canvas-safe.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const DRONES_BY_TIER = [90, 140, 180];
// (6b: a page of up to 3 lines × 16 letters needs a drone a dot — the fleet grows to the show's longest page, up to these per tier)
const DRONES_CAP = [200, 280, 360];
const IDLE = [190, 222, 255];

export function createDrones() {
  let W = 1, K = 1, dpr = 2, tier = 2, cur = null, bargeCv = null, last = 0;
  const glows = new Map();
  const glow = col => {
    const q = col.map(v => Math.min(255, Math.round(v / 12) * 12)), k = q.join(',');
    let c = glows.get(k);
    if (!c) { c = mk(32, 32); const x = safeCtx(c), g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.16, 'rgba(255,255,255,0.96)'); g.addColorStop(0.24, `rgba(${k},1)`); g.addColorStop(0.42, `rgba(${k},0.5)`); g.addColorStop(1, `rgba(${k},0)`); /* (POLISH 5: a firmer white-hot core — crisp lights) */ x.fillStyle = g; x.fillRect(0, 0, 32, 32); if (glows.size > 48) glows.clear(); glows.set(k, c); }
    return c;
  };

  // ---- the barge's art (screen pt): rect { x, y (the waterline), w } → canvas + the pads' screen points
  function bargeArt(b) {
    const w = b.w, h = w * 0.16, d = Math.min(3, dpr * 1.2), cv = mk((w + 8) * d, (h * 2.4 + 8) * d), x = safeCtx(cv);
    x.setTransform(d, 0, 0, d, 4 * d, (h * 1.4 + 4) * d);
    // the hull (dark steel, its sheer line catching a little light), the deck, the pads, the hut, the masts
    x.fillStyle = '#14161e'; x.beginPath(); x.moveTo(0, -h * 0.5); x.lineTo(w, -h * 0.5); x.lineTo(w - h * 0.5, h * 0.5); x.lineTo(h * 0.5, h * 0.5); x.closePath(); x.fill();
    x.fillStyle = 'rgba(120,130,160,0.35)'; x.fillRect(0, -h * 0.5, w, Math.max(0.4, h * 0.08));
    x.fillStyle = '#1e2230'; x.fillRect(h * 0.2, -h * 0.75, w - h * 0.4, h * 0.25);
    x.fillStyle = '#262a38'; x.fillRect(w * 0.06, -h * 1.35, w * 0.12, h * 0.6);
    x.fillStyle = 'rgba(255,200,120,0.9)'; x.fillRect(w * 0.085, -h * 1.2, w * 0.06, h * 0.22);
    x.strokeStyle = 'rgba(60,66,84,0.9)'; x.lineWidth = 0.5; x.beginPath(); x.moveTo(h * 0.2, -h * 0.95); x.lineTo(w - h * 0.2, -h * 0.95); for (let px = h * 0.2; px < w - h * 0.2; px += w / 16) { x.moveTo(px, -h * 0.95); x.lineTo(px, -h * 0.75); } x.stroke();
    x.beginPath(); x.moveTo(w * 0.04, -h * 0.75); x.lineTo(w * 0.04, -h * 2.2); x.moveTo(w * 0.96, -h * 0.75); x.lineTo(w * 0.96, -h * 2.2); x.stroke();
    const pads = [];
    const cols = 24, rows = 3;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) pads.push([b.x - w / 2 + w * (0.22 + 0.74 * (c + 0.5) / cols), b.y - h * (0.78 + r * 0.06)]);
    // (the empty pads glow faintly blue: baked in — they never change)
    x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.35;
    for (let i = 0; i < pads.length; i += 2) { const p = pads[i]; x.drawImage(glow([90, 150, 255]), p[0] - (b.x - w / 2) - 1.6 * K, p[1] - b.y - 1.2 * K, 3.2 * K, 2.4 * K); }
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    return { cv, w: w + 8, h: h * 2.4 + 8, ox: b.x - w / 2 - 4, oy: b.y - h * 1.4 - 4, h0: h, masts: [[b.x - w / 2 + w * 0.04, b.y - h * 2.2], [b.x - w / 2 + w * 0.96, b.y - h * 2.2]], pads };
  }

  /** a show: specs [{ text } | { shape }], at (clock ms), o: { calm, box: { x, y, w, h } (the formation area), barge: { x, y, w },
   *  waterTop, year, seed } */
  function start(specs, at, o) {
    const need = Math.max(0, ...specs.filter(sp => sp.text != null).map(sp => { const T = dotLayout(Array.isArray(sp.lines) && sp.lines.length ? sp.lines : messagePages(fillText(sp.text, o.year || 2026))[0] || []); return T ? T.dots.length : 0; }));
    const n = Math.min(DRONES_CAP[tier], Math.max(DRONES_BY_TIER[tier], need)), R = rng(o.seed || 11);
    // (POLISH 4: a message only — any shape asked for (an old link, the API) is left out)
    specs = specs.filter(sp => sp && sp.text != null);
    const shapes = specs.map(sp => droneShape(sp, n, { year: o.year || 2026, marks: MARKS })).filter(Boolean);
    if (!shapes.length || !o.box || !o.barge) return false;
    const B = bargeArt(o.barge);
    if (bargeCv && bargeCv.cv) bargeCv.cv.width = 0;
    bargeCv = B;
    const tl = droneTimeline(shapes.length, !!o.calm), box = o.box;
    // the pads (one drone each; the barge has 72: more drones stack a little above), the staging cloud over the harbor
    const home = Array.from({ length: n }, (_, i) => { const p = B.pads[i % B.pads.length]; return [p[0], p[1] - Math.floor(i / B.pads.length) * 1.4]; });
    // (POLISH 4: no staging cloud — the first page is matched to the PADS in order, so the stream rises + fans out into it uncrossed)
    const sets = [home], sizes = [3.3 * K], xns = [home.map(p => clamp01((p[0] - box.x) / Math.max(1, box.w)))];
    const cols = [Array.from({ length: n }, () => IDLE)], on = [Array.from({ length: n }, () => 1)];
    for (const sh of shapes) {
      // (letters: a cell ≤ 13 pt — big enough to read at a glance, tight enough that each cell's drones merge into one pixel)
      const pad = sh.kind === 'text' ? 0.94 : 0.86, sc = Math.min(box.w * pad / sh.w, box.h * pad / sh.h, sh.kind === 'text' ? 13 * K : 1e9);
      const ox = box.x + (box.w - sh.w * sc) / 2, oy = box.y + (box.h - sh.h * sc) / 2;
      const tg = sh.pts.map(p => ({ x: ox + p[0] * sc, y: oy + p[1] * sc, col: [p[2], p[3], p[4]] }));
      const prev = sets[sets.length - 1];
      const order = prev.map((p, i) => i).sort((a, b) => prev[a][0] - prev[b][0] || prev[a][1] - prev[b][1]);
      const tOrder = tg.map((p, i) => i).sort((a, b) => tg[a].x - tg[b].x || tg[a].y - tg[b].y);
      const pos = new Array(n), col = new Array(n), lit = new Array(n);
      // (fewer points than drones: the extra drones fly to a point between their neighbours and turn their lights off)
      let lastTk = -1;
      order.forEach((di, k) => {
        const tk = Math.min(tOrder.length - 1, Math.floor(k * tOrder.length / n)), t = tg[tOrder[tk]];
        pos[di] = [t.x, t.y]; col[di] = t.col; lit[di] = tk !== lastTk ? 1 : 0; lastTk = tk;
      });
      sets.push(pos); cols.push(col); on.push(lit);
      // (each drone's place across the box: the colour wave sweeps left to right through a morph)
      xns.push(pos.map(p => clamp01((p[0] - box.x) / Math.max(1, box.w))));
      // (a letter's drones glow wide enough that each cell's cluster merges into one solid pixel)
      sizes.push(sh.kind === 'text' ? Math.max(3.6 * K, sc * 0.7) : 3.3 * K);   // (POLISH 5: a touch bigger — each letter one clear shape)   // (6b: wider — the dots merge into solid letters at the bigger sizes)
    }
    const glw = cols.map(arr => arr.map(cc => glow(cc)));
    cur = { at, n, home, sets, sizes, cols, glw, xns, idleG: glow(IDLE), on, tl, wave: o.wave !== false, calm: !!o.calm, seed: o.seed || 11, box, waterTop: o.waterTop, phase: Array.from({ length: n }, () => R() * TAU), lift: Array.from({ length: n }, (_, i) => 1.5 + (i / n) * 7 + R() * 0.8), land: Array.from({ length: n }, () => R() * 5), specs };
    return true;
  }
  function stop() { cur = null; if (bargeCv && bargeCv.cv) bargeCv.cv.width = 0; bargeCv = null; }

  // one drone at e: [x, y, col, a]
  function droneAt(i, e, motion) {
    const C = cur, tl = C.tl, ph = C.phase[i];
    const hov = motion ? [Math.sin(e * 1.3 + ph) * 0.45, Math.cos(e * 1.1 + ph * 1.7) * 0.45] : [0, 0];
    if (e < tl.launch) {
      // LAUNCH: on the pad until its turn, then UP (rising first, then fanning out) straight into its place on the first page — its
      // light turning to the page's colour on the way; a drone the page doesn't need dims out as it arrives
      const t0 = C.lift[i], k = clamp01((e - t0) / 5.5), h = C.home[i], c = C.sets[1][i];
      if (k <= 0) return [h[0], h[1], C.idleG, 0.55];
      const u = ease(k), lit = C.on[1][i];
      const x = h[0] + (c[0] - h[0]) * u * u + (k >= 1 ? hov[0] : 0), y = h[1] + (c[1] - h[1]) * Math.sqrt(u) + (k >= 1 ? hov[1] : 0);
      return [x, y, k < 0.55 ? C.idleG : C.glw[1][i], lit ? 0.8 + 0.2 * k : 0.85 * (1 - smoothK(k, 0.55, 1))];
    }
    if (e < tl.scatter) {
      let s = 0; while (s < tl.shapes.length - 1 && e >= tl.shapes[s + 1].t0) s++;
      const sh = tl.shapes[s], a = C.sets[s][i], b = C.sets[s + 1][i], k = sh.morph > 0 ? clamp01((e - sh.t0) / sh.morph) : 1, u = ease(k);
      // the flow: a soft arc sideways on the way (each drone its own lean), the colour switching mid-flight
      const arc = Math.sin(Math.PI * u) * 7 * K * Math.sin(ph);
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
      const x = a[0] + dx * u - dy / L * arc + (k >= 1 ? hov[0] : 0), y = a[1] + dy * u + dx / L * arc + (k >= 1 ? hov[1] : 0);
      const fromLit = C.on[s][i], toLit = C.on[s + 1][i];
      // THE COLOUR WAVE (NEON PASS 2): a drone takes its new colour when the wave reaches it — the change ripples across the swarm
      // left → right through the morph (calm shows: all at once, mid-flight)
      const th = C.wave && !C.calm ? 0.12 + 0.76 * C.xns[s + 1][i] : 0.5;
      let col = k < th ? C.glw[s][i] : C.glw[s + 1][i];
      // a formation that CYCLES (spec.cycle): while it holds, its colours drift slowly round the hues, a wave across it
      const spec = C.specs[s];
      if (spec && spec.cycle && k >= 1 && motion) col = hueGlow(((e - sh.t0) * 0.05 + C.xns[s + 1][i] * 0.6 + 2) % 1);
      const tw = spec && spec.shape === 'burst' && motion && !C.calm ? 0.65 + 0.35 * Math.sin(e * 9 + ph * 3) : 1;
      const a2 = (fromLit && toLit ? 1 : fromLit ? 1 - smoothK(k, th - 0.3, th) : toLit ? smoothK(k, th, th + 0.3) : 0) * tw;
      return [x, y, col, a2];
    }
    const last = C.sets[C.sets.length - 1][i], lastCol = C.glw[C.glw.length - 1][i];
    if (e < tl.home) {
      // THE SCATTER: a slow outward breath from the formation's middle, a twinkle, every light coming back on
      const k = ease(clamp01((e - tl.scatter) / (tl.home - tl.scatter))), cx = C.box.x + C.box.w / 2, cy = C.box.y + C.box.h / 2;
      return [last[0] + (last[0] - cx) * 0.25 * k + hov[0], last[1] + (last[1] - cy) * 0.25 * k + hov[1], lastCol, Math.max(C.on[C.on.length - 1][i], k) * (motion && !C.calm ? 0.7 + 0.3 * Math.sin(e * 7 + ph * 5) : 1)];
    }
    // HOME: down to the barge (staggered), the light off as it lands
    const cx = C.box.x + C.box.w / 2, cy = C.box.y + C.box.h / 2, sx = last[0] + (last[0] - cx) * 0.25, sy = last[1] + (last[1] - cy) * 0.25;
    const k = clamp01((e - tl.home - C.land[i]) / (tl.end - tl.home - 5.5)), u = ease(k), h = C.home[i];
    if (k >= 1) return [h[0], h[1], C.idleG, 0];
    return [sx + (h[0] - sx) * Math.sqrt(u), sy + (h[1] - sy) * u * u, k < 0.4 ? lastCol : C.idleG, 1 - smoothK(k, 0.85, 1) * 0.9];
  }
  const smoothK = (v, a, b) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const hues = [];
  const hueGlow = h => { const q = Math.floor(h * 24) % 24; return hues[q] || (hues[q] = glow(hsv(q / 24, 0.72, 1))); };

  return {
    resize(w) { W = w; K = Math.max(0.9, Math.min(1.35, w / 402)); },
    setDpr(d) { dpr = d; },
    setTier(t) { tier = t; },
    start, stop,
    on: () => !!cur,
    /** the barge (after the harbor layer): its hull, the pads' lights, the masts — while a show runs */
    barge(c, s) {
      if (!cur || !bargeCv) return;
      const e = (s.now - cur.at) / 1000, k = clamp01(Math.min(e / 4 + 0.2, (cur.tl.end + 6 - e) / 6));
      if (k <= 0) return;
      const B = bargeCv;
      c.globalAlpha = k; c.drawImage(B.cv, B.ox, B.oy, B.w, B.h); c.globalAlpha = 1;
      c.save(); c.globalCompositeOperation = 'lighter';
      const blink = s.motion ? (Math.sin(s.t * TAU / 1.4) > 0.3 ? 1 : 0.25) : 0.6;
      for (const m of B.masts) { c.globalAlpha = k * blink; c.drawImage(glow([255, 50, 60]), m[0] - 3 * K, m[1] - 3 * K, 6 * K, 6 * K); }
      c.restore();
    },
    /** the drones: part 'sky' (above the water's top: before the water, so the mirror doubles them) | 'low' (by the barge: after it) */
    draw(c, s, part) {
      if (!cur) return false;
      last = s.now;
      const e = (s.now - cur.at) / 1000;
      if (e > cur.tl.end + 6) { stop(); return false; }
      if (e < 0) return true;
      // (the glow's size: the formation's — a morph eases it between the two)
      const tl = cur.tl; let si = 0; while (si < tl.shapes.length && e >= tl.shapes[si].t0) si++;
      const sh0 = tl.shapes[si - 1], mk0 = sh0 && sh0.morph > 0 ? clamp01((e - sh0.t0) / sh0.morph) : 1;
      const top = cur.waterTop, r = e >= tl.scatter ? 3.3 * K : si === 0 ? 3.3 * K + (cur.sizes[1] - 3.3 * K) * clamp01((e - 6) / 9) : cur.sizes[Math.max(0, si - 1)] + ((cur.sizes[si] || cur.sizes[si - 1]) - cur.sizes[Math.max(0, si - 1)]) * mk0;
      if (!cur.fr || cur.fr.now !== s.now) { const fr = cur.fr || (cur.fr = { x: new Float32Array(cur.n), y: new Float32Array(cur.n), a: new Float32Array(cur.n), g: new Array(cur.n) }); fr.now = s.now; for (let i = 0; i < cur.n; i++) { const d = droneAt(i, e, s.motion); fr.x[i] = d[0]; fr.y[i] = d[1]; fr.g[i] = d[2]; fr.a[i] = d[3]; } }
      const F = cur.fr, sky = part === 'sky';
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < cur.n; i++) {
        const a = F.a[i], y = F.y[i];
        if (a < 0.02 || sky !== (y < top)) continue;
        c.globalAlpha = a > 1 ? 1 : a; c.drawImage(F.g[i], F.x[i] - r, y - r, r * 2, r * 2);
      }
      c.restore();
      return true;
    },
    /** 6b: the sign may come back — the show's last formation has been read (its scatter has begun): clock ms now */
    released: now => !cur || (now - cur.at) / 1000 >= cur.tl.scatter,
    /** s since the show began (clock ms now) */
    since: now => (cur ? (now - cur.at) / 1000 : -1),
    /** what the show is doing (tests + previews) */
    debug: () => {
      if (!cur) return null;
      const e = last ? (last - cur.at) / 1000 : 0;
      let lit = 0, x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      const cs = new Set();
      for (let i = 0; i < cur.n; i++) { const [x, y, g, a] = droneAt(i, e, false); if (a < 0.02) continue; lit++; cs.add(g); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      return { n: cur.n, shapes: cur.specs.map(s => s.text || s.shape), end: cur.tl.end, at: cur.at, e: +e.toFixed(1), calm: cur.calm, lit, colours: cs.size, box: lit ? [x0, y0, x1, y1].map(Math.round) : null };
    },
    destroy() { stop(); for (const c of glows.values()) c.width = 0; glows.clear(); },
  };
}
