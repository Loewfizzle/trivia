// CITY 2.0 — THE HARBOR, Part 6a: SKYWRITING + SKYTYPING (docs/harbor.md#part-6a). In the sky-high lane, over the NEON sign.
//   SKYWRITING   one small aerobatic plane draws a word or two (≤ 10 characters) in HUGE smoke letters, stroke by stroke —
//                the smoke on along each stroke, off while it swings to the next one (core/harbor-sky.js#skywriteStrokes)
//   SKYTYPING    five planes line abreast (one per row of the window font: core/harbor-sky.js#skytypeLayout) fly across and
//                each puffs a dot as it passes a lit column — ≤ 16 characters a line; a second line on the way back
// THE SMOKE: every puff is born at a known time (a function of the time since the writing began: every phone sees the same
// letters, a refresh lands mid-word), then drifts on the REAL WIND, swells and softens (the blur) and fades — legible for about
// a minute and a half after the last stroke, gone by three. Drawn cheaply: all the older puffs are re-rendered into ONE layer a
// few times a second (8 while writing, 3 after) and drawn as one image shifted by the drift since; only the newest puffs (the
// last ~0.1 s at the planes' tails) are drawn live. Only on clear, low-wind days (core/harbor-sky.js#smokeWeather) — the
// API and &force= previews draw whatever the weather. API: skywrite(text) / skytype(text) via screens/harbor/skyfx.js.
import { skywriteStrokes, skytypeLayout } from '../../core/harbor-sky.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
const HOLD = 95, FADE = 80;                           // s legible after the last puff, then s to fade out

/** a small sleek smoke plane (low wing, a canopy, a smoke tank), nose to +x → canvas (len pt, its light) */
function smokePlane(len, day, gold, dpr) {
  const W = len * 1.2, H = len * 0.7, d = Math.min(3, dpr * 1.5);
  const cv = mk(W * d, H * d), x = cv.getContext('2d');
  x.setTransform(d, 0, 0, d, (W / 2) * d, (H / 2) * d); x.scale(len, len);
  const body = [Math.round(40 + 160 * day + 40 * gold), Math.round(44 + 150 * day + 10 * gold), Math.round(60 + 150 * day - 30 * gold)];
  const dark = body.map(v => Math.round(v * 0.55)), red = [190, 34, 40];
  const P = (pts, col) => { x.fillStyle = col; x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.fill(); };
  P([[0.05, 0.0], [-0.08, -0.16], [-0.16, -0.16], [-0.08, 0.0]], `rgb(${dark})`);
  P([[-0.36, -0.02], [-0.46, -0.2], [-0.52, -0.2], [-0.5, -0.02]], `rgb(${red})`);
  x.fillStyle = `rgb(${body})`; x.beginPath(); x.ellipse(0, 0, 0.5, 0.075, 0, 0, TAU); x.fill();
  x.fillStyle = `rgb(${red})`; x.fillRect(-0.4, -0.012, 0.85, 0.022);
  x.fillStyle = `rgba(30,44,70,0.9)`; x.beginPath(); x.ellipse(0.12, -0.065, 0.13, 0.05, 0, Math.PI, 0); x.fill();
  P([[0.08, 0.03], [-0.1, 0.24], [-0.19, 0.24], [-0.1, 0.03]], `rgb(${body.map(v => Math.round(v * 0.85))})`);
  P([[-0.38, 0.02], [-0.48, 0.1], [-0.52, 0.1], [-0.46, 0.02]], `rgb(${body.map(v => Math.round(v * 0.85))})`);
  return { cv, w: W, h: H };
}

export function createSmoke() {
  let W = 1, H = 1, K = 1, dpr = 2, tier = 2;
  let cur = null;                                       // the writing in the sky: { kind, at, puffs, legs, end, … }
  let layer = null, layerAt = -1e9, layerE = 0, puffSpr = null, puffKey = '', planeSpr = null, planeKey = '';

  // ---- the plans (pure geometry in screen pt; times in s since the writing began)
  function planWrite(text, lane, at) {
    const S = skywriteStrokes(text);
    if (!S || !lane) return null;
    const u = Math.min(lane.w * 0.8 / S.w, lane.h * 0.74 / 14, 6.6 * K);
    const ox = lane.x + (lane.w - S.w * u) / 2, oy = lane.y + (lane.h - 14 * u) / 2;
    const P = ([a, b]) => [ox + a * u, oy + b * u];
    const v = 46 * K, vc = 70 * K, gap = 1.45 * K;      // pt/s writing, pt/s between strokes, pt between puffs
    const legs = [], puffs = [];
    let t = 0, pos = [lane.x - 40 * K, P(S.strokes[0].pts[0])[1]];
    const go = (to, speed, smoke) => {
      const d = Math.hypot(to[0] - pos[0], to[1] - pos[1]), dur = Math.max(0.15, d / speed);
      legs.push({ a: pos, b: to, t0: t, t1: t + dur, smoke });
      if (smoke) { const n = Math.max(1, Math.round(d / gap)); for (let i = 0; i <= n; i++) { const k = i / n; puffs.push({ x: pos[0] + (to[0] - pos[0]) * k, y: pos[1] + (to[1] - pos[1]) * k, t: t + dur * k, r0: 2.7 * K * Math.max(0.85, u / 5.5) }); } }
      t += dur; pos = to;
    };
    for (const st of S.strokes) {
      const pts = st.pts.map(P);
      go(pts[0], vc, false);
      for (let i = 1; i < pts.length; i++) go(pts[i], v, true);
    }
    go([lane.x + lane.w + 50 * K, pos[1] - 10 * K], vc, false);
    const last = puffs.length ? puffs[puffs.length - 1].t : 0;
    return { kind: 'skywrite', text: S.text, at, legs, puffs, planes: 1, last, end: last + HOLD + FADE, u };
  }
  function planType(text, lane, at) {
    const T = skytypeLayout(text);
    if (!T || !lane) return null;
    const p = Math.min(lane.w * 0.86 / T.cols, lane.h * 0.92 / T.rows, 9 * K);         // (a margin each side: the smoke drifts)
    const ox = lane.x + (lane.w - T.cols * p) / 2 + p / 2, oy = lane.y + (lane.h - T.rows * p) / 2 + p / 2;
    const v = 52 * K, lead = 50 * K;
    const legs = [], puffs = [];
    // line 1 left → right, line 2 right → left (a turn between: off the edge and back, a beat later)
    let t = 0;
    T.lines.forEach((ln, i) => {
      const dir = i % 2 ? -1 : 1, rowY = oy + i * 6 * p;
      const xs = dir > 0 ? lane.x - lead : lane.x + lane.w + lead, xe = dir > 0 ? lane.x + lane.w + lead : lane.x - lead, dur = Math.abs(xe - xs) / v;
      legs.push({ a: [xs, rowY], b: [xe, rowY], t0: t, t1: t + dur, smoke: true, type: true, line: i, dir });
      for (const [cx, cy, li] of T.dots) if (li === i) { const x = ox + cx * p; puffs.push({ x, y: oy + cy * p, t: t + (x - xs) / (xe - xs) * dur, r0: p * 0.42, pop: true }); }
      t += dur + 3.5;
    });
    puffs.sort((a, b) => a.t - b.t);
    return { kind: 'skytype', text: T.lines.join(' / '), at, legs, puffs, planes: 5, pitch: p, last: puffs[puffs.length - 1].t, end: puffs[puffs.length - 1].t + HOLD + FADE };
  }

  // ---- the smoke
  function puffSprite(light) {
    const key = `${Math.round(light.day * 6)}${Math.round(light.gold * 6)}`;
    if (puffSpr && key === puffKey) return puffSpr;
    puffKey = key;
    puffSpr = puffSpr || mk(64, 64);
    const x = puffSpr.getContext('2d'); x.clearRect(0, 0, 64, 64);
    // a soft round puff: lit from above (white / warm at sunset), its underside a cool grey — the smoke has volume
    const top = light.gold > 0.3 ? [255, 228, 214] : [255, 255, 255], under = light.gold > 0.3 ? [196, 160, 176] : [196, 206, 224];
    let g = x.createRadialGradient(32, 37, 2, 32, 37, 30); g.addColorStop(0, `rgba(${under},0.55)`); g.addColorStop(0.6, `rgba(${under},0.22)`); g.addColorStop(1, `rgba(${under},0)`);
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    g = x.createRadialGradient(31, 29, 1, 32, 31, 27); g.addColorStop(0, `rgba(${top},0.95)`); g.addColorStop(0.45, `rgba(${top},0.55)`); g.addColorStop(1, `rgba(${top},0)`);
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return puffSpr;
  }
  // one puff's look at e (s since the writing began): { r, a } (null = not yet / gone)
  function puffNow(q, e, motion) {
    const age = e - q.t;
    if (age < 0) return null;
    const since = e - cur.last;                               // the whole message done → hold, then fade
    const fade = 1 - smooth(HOLD, HOLD + FADE, since);
    if (fade <= 0) return null;
    const form = q.pop ? smooth(0, 0.3, age) : 0.35 + 0.65 * smooth(0, 0.6, age);
    const grow = motion ? Math.min(age, HOLD + FADE) * (q.pop ? 0.035 : 0.045) * K : 0;
    const soft = 1 - 0.45 * smooth(20, HOLD + FADE * 0.5, age);   // (the blur: wider, thinner)
    return { r: q.r0 * (q.pop ? 0.5 + 0.5 * smooth(0, 0.25, age) : 1) + grow, a: form * fade * soft };
  }
  function drift(s) {
    const w = s.L.wind == null ? 2 : Math.min(10, s.L.wind), dir = s.L.windDir == null ? 250 : s.L.windDir;
    return [Math.sin(dir * Math.PI / 180) * w * 0.12 * K, -0.04 * K];        // pt/s (east is screen-left: facing south)
  }
  function renderLayer(s, e, light) {
    const d = Math.min(2, dpr), x = layer.getContext('2d'), spr = puffSprite(light);
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, layer.width, layer.height);
    x.setTransform(d, 0, 0, d, 0, 0);
    const [vx, vy] = drift(s);
    for (const q of cur.puffs) {
      if (q.t > e) break;
      const n = puffNow(q, e, s.motion);
      if (!n || n.a < 0.01) continue;
      const age = e - q.t, px = q.x + (s.motion ? vx * age : 0), py = q.y + (s.motion ? vy * age : 0);
      x.globalAlpha = Math.min(1, n.a); x.drawImage(spr, px - n.r * 1.25, py - n.r * 1.25, n.r * 2.5, n.r * 2.5);
    }
    x.globalAlpha = 1;
    layerAt = performance.now(); layerE = e;
  }

  // where the planes are (e s since the start) → [{ x, y, ang, dir }]
  function planesAt(e) {
    const leg = cur.legs.find(l => e >= l.t0 && e < l.t1);
    if (!leg) return [];
    const k = (e - leg.t0) / (leg.t1 - leg.t0), x = leg.a[0] + (leg.b[0] - leg.a[0]) * k, y = leg.a[1] + (leg.b[1] - leg.a[1]) * k;
    if (leg.type) { const out = []; for (let r = 0; r < 5; r++) out.push({ x: x - leg.dir * Math.abs(r - 2) * cur.pitch * 0.9, y: y + r * cur.pitch, ang: 0, dir: leg.dir }); return out; }
    return [{ x, y, ang: Math.atan2(leg.b[1] - leg.a[1], leg.b[0] - leg.a[0]), dir: 1 }];
  }

  return {
    resize(w, h) { W = w; H = h; K = Math.max(0.9, Math.min(1.35, w / 402)); if (layer) { layer.width = layer.height = 0; layer = null; } },
    setDpr(d) { dpr = d; },
    setTier(t) { tier = t; },
    /** start a writing at clock ms `at` in the lane (sky-high): kind 'skywrite' | 'skytype'. → true if it could be laid out */
    start(kind, text, lane, at) {
      const p = kind === 'skytype' ? planType(text, lane, at) : planWrite(text, lane, at);
      if (!p) return false;
      cur = p; layerAt = -1e9;
      return true;
    },
    on: () => !!cur,
    kind: () => (cur ? cur.kind : null),
    stop() { cur = null; },
    /** the sky layer (after the planes, before the clouds) */
    draw(c, s) {
      if (!cur) return false;
      const e = (s.now - cur.at) / 1000;
      if (e > cur.end) { cur = null; return false; }
      if (e < 0) return true;
      const L = s.L, day = clamp01(L.w.day + L.w.golden * 0.8 + L.w.dawn * 0.7) * (1 - clamp01(L.w.night + L.w.late) * 0.85), gold = clamp01((L.w.golden + L.w.dawn) * 1.3);
      const light = { day: Math.max(0.12, day), gold };
      if (!layer) { const d = Math.min(2, dpr); layer = mk(W * d, H * 0.62 * d); }
      // the layer: all the puffs up to its time, re-rendered 8 times a second while the planes write, 3 after (2 at tier 0)
      const writing = e < cur.last + 0.5, every = writing ? 125 : tier === 0 ? 500 : 333;
      if (performance.now() - layerAt > every || layerE > e) renderLayer(s, e, light);
      const [vx, vy] = drift(s), dt = s.motion ? e - layerE : 0, d = Math.min(2, dpr);
      c.drawImage(layer, vx * dt, vy * dt, layer.width / d, layer.height / d);
      // the newest puffs (born since the layer): live
      const spr = puffSprite(light);
      for (const q of cur.puffs) {
        if (q.t <= layerE) continue;
        if (q.t > e) break;
        const n = puffNow(q, e, s.motion);
        if (!n) continue;
        c.globalAlpha = Math.min(1, n.a); c.drawImage(spr, q.x - n.r * 1.25, q.y - n.r * 1.25, n.r * 2.5, n.r * 2.5);
      }
      c.globalAlpha = 1;
      // the planes
      const ps = planesAt(e);
      if (ps.length) {
        const len = (cur.kind === 'skytype' ? 11 : 12) * K, key = `${Math.round(light.day * 6)}${Math.round(gold * 6)}|${len.toFixed(1)}`;
        if (!planeSpr || key !== planeKey) { if (planeSpr) planeSpr.cv.width = 0; planeSpr = smokePlane(len, light.day, gold, dpr); planeKey = key; }
        const S = planeSpr;
        for (const p of ps) {
          c.save(); c.translate(p.x, p.y);
          if (cur.kind === 'skywrite') c.rotate(p.ang); else if (p.dir < 0) c.scale(-1, 1);
          // (the smoke comes out of its tail: the plane is drawn just ahead of the newest puff)
          c.drawImage(S.cv, -S.w * 0.5 + len * 0.45, -S.h / 2, S.w, S.h);
          c.restore();
        }
      }
      return true;
    },
    /** what's written (tests + previews): { kind, text, puffs, done (all puffs out), k (0..1 of its whole life) } */
    debug: () => (cur ? { kind: cur.kind, text: cur.text, puffs: cur.puffs.length, last: +cur.last.toFixed(1), end: +cur.end.toFixed(1) } : null),
    destroy() { if (layer) layer.width = layer.height = 0; if (puffSpr) puffSpr.width = 0; if (planeSpr) planeSpr.cv.width = 0; layer = null; cur = null; },
  };
}
