// CITY 2.0 — THE HARBOR, SP4 (after 11a-1): HALLOWEEN ON THE NEON SIGN — THE WEB + THE SPIDER, FUTURISTIC (drawn by the sign's
// dressing: screens/harbor/signdress.js; docs/harbor.md#sp4). Everything here is in LOGO UNITS (the letters in 0..332 × 0..100, y down).
// The owner's verdict (plan.md, Oct 26): the realistic pair looked cheap → a deliberate FUTURISTIC NEON design, premium + menacing-cool.
//
//   THE WEB      a fine GEOMETRIC web of thin glowing filaments: laser-thin threads of light (an ice-white core, a cool violet halo),
//                a PERFECT geometry — radials evenly spaced, one Archimedean spiral from the outside in, straight threads under
//                tension (no sag), tiny bright NODES where the threads cross like dew of light, a faint SHIMMER travelling along
//                the threads. Still GROWING day by day through October (core/harbor-holiday.js#halloweenPieces().web — the bridge,
//                the frame, the radials, the hub, the spiral). Two webs: the main one across the N and the E, a small one late in
//                the month in the last N's upper triangle. buildWeb() + webState() are PURE (tests/signdress.test.mjs); paintWeb()
//                bakes into the dressing's caches (silk = the filaments' own faint body, glow = their light × the sign's level).
//   THE SPIDER   a sleek BIO-MECHANICAL spider: a glossy black-chrome body in machined plates, faint neon seams where the plates
//                meet, glowing eyes, eight precisely articulated legs (rods + knuckles + a claw) that catch the NEON's colour on their
//                chrome. A MECHANICAL stop-start gait: quick snapped steps in the alternating tetrapod groups, long holds; every foot
//                kept inside its leg's own SECTOR of the body (legSectors / legCheck — PURE, tested: it can never tangle, even
//                mid-turn). Head-down in the hub most of the time; bursts out along a radial and back; a drop on a GLOWING thread
//                + the climb home; a tap → it bolts down its line.
import { rngFrom, hashString } from '../../core/rng.js';
import { safeCtx } from '../../ui/canvas-safe.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, t) => a + (b - a) * t;
const ease = u => (u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u));
const snap = u => 1 - Math.pow(1 - u, 3);                   // (a mechanical step: fast, then settles)
const seg01 = (g, a, b) => clamp01((g - a) / (b - a));

/** the web's light: the ice-white core, the violet halo (the owner's cool violet / ice white) */
export const WEB_COL = Object.freeze({ core: [236, 240, 255], halo: [150, 112, 255], node: [255, 255, 255], nodeHalo: [176, 150, 255] });

// ------------------------------------------------------------------ THE WEBS (the anchors are ON the tubes)
/** the webs: hub, the frame's support points (on the letters' tubes, in order round the hub), the radials' count, the spiral's
 *  spacing, the growth window (the build-up's stage this web is spun over) */
export const WEB_SPECS = Object.freeze([
  // the main web: across the N and the E, its hub in the gap between them (open dark sky behind it)
  { id: 'main', hub: [77, 37], seed: 31, radials: 22, spacing: 5.7, free: 8, g: [0, 0.78], a0: 0.13,
    anchors: [[5, 3], [138, 0], [142, 50], [97, 97], [47, 76], [0, 22]] },
  // late in the month: a small web nested in the last N's upper triangle (the diagonal, the right stroke, the top-left bend)
  { id: 'corner', hub: [310, 23], seed: 77, radials: 12, spacing: 4.3, free: 4.5, g: [0.72, 1], a0: 0.2,
    anchors: [[273, 3], [332, 3], [332, 47], [297, 45]] },
]);
/** a few loose threads late in the build-up: a bridge line to the O, a strand hanging off the E, one low across the gap */
const STRAYS = [{ a: [154, 0], b: [197, 1], g: 0.6 }, { a: [142, 50], hang: 15, g: 0.5 }, { a: [64, 90], b: [92, 88], g: 0.88 }];

const rayHit = (o, d, a, b) => {
  // ray o + t d against the segment a-b → t or null
  const ex = b[0] - a[0], ey = b[1] - a[1], den = d[0] * ey - d[1] * ex;
  if (Math.abs(den) < 1e-9) return null;
  const qx = a[0] - o[0], qy = a[1] - o[1], t = (qx * ey - qy * ex) / den, u = (qx * d[1] - qy * d[0]) / den;
  return t > 0 && u >= 0 && u <= 1 ? t : null;
};

/** PURE: one web's geometry → { id, hub, frame: [[a, b]…], radials: [{ ang, end, len, order }], spiral: [{ a, b, ri, rj, ring, dew:
 *  [{ t: 0, r }] (the NODE at the crossing — 'dew' for the catalogue's sake) }], nodes: [[x, y, r]…] (the frame's anchor nodes + the
 *  hub), g } — a perfect geometry, in the order it is spun */
export function buildWeb(spec) {
  const R = rngFrom(hashString(`web|${spec.id}|${spec.seed}`)), [hx, hy] = spec.hub, A = spec.anchors;
  const frame = A.map((p, i) => [p, A[(i + 1) % A.length]]);
  const n = spec.radials, radials = [];
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * TAU + (spec.a0 || 0), d = [Math.cos(ang), Math.sin(ang)];
    let best = Infinity;
    for (const [a, b] of frame) { const t = rayHit([hx, hy], d, a, b); if (t != null && t < best) best = t; }
    if (!isFinite(best)) continue;
    radials.push({ ang, end: [hx + d[0] * best, hy + d[1] * best], len: best });
  }
  radials.sort((p, q) => p.ang - q.ang);
  // the order the radials are spun: alternating sides of the hub (a spider balances its web as it goes)
  const ord = radials.map((_, i) => i).sort((p, q) => ((p % 2) - (q % 2)) || (((p * 7) % n) - ((q * 7) % n)));
  ord.forEach((ri, k) => { radials[ri].order = k; });
  // THE SPIRAL: one Archimedean spiral from the outside in (r falls by `spacing` every turn), clipped where the frame is near:
  // a crossing exists where the spiral fits inside the radial (the frame's shape cuts the outer turns — like a real orb web's)
  const m = radials.length, spiral = [], sp = spec.spacing, Rmax = Math.max(...radials.map(r => r.len)) * 0.96;
  const rAt = (ri, k) => Rmax - (k + ri / m) * sp;
  const fits = (ri, r) => r >= spec.free && r <= radials[ri].len * 0.93;
  const rings = Math.ceil((Rmax - spec.free) / sp) + 1;
  for (let k = 0; k < rings; k++) for (let i = 0; i < m; i++) {
    const ri = i, rj = (i + 1) % m, kk = rj === 0 ? k + 1 : k, r0 = rAt(ri, k), r1 = rAt(rj, kk);
    if (!fits(ri, r0) || !fits(rj, r1)) continue;
    const a0 = radials[ri].ang, a1 = radials[rj].ang;
    const a = [hx + Math.cos(a0) * r0, hy + Math.sin(a0) * r0], b = [hx + Math.cos(a1) * r1, hy + Math.sin(a1) * r1];
    // the node at this crossing: most crossings carry a tiny bead of light, a few a brighter one (dew of light)
    const u = R(), dew = u < 0.58 ? [{ t: 0, r: u < 0.1 ? 0.88 : 0.46 + R() * 0.22 }] : [];
    spiral.push({ a, b, ri, rj, ring: k + i / m, dew });
  }
  // the frame's anchor nodes (where a radial meets the frame — brighter) + the hub's own
  const nodes = radials.map(r => [r.end[0], r.end[1], 0.62]);
  nodes.push([hx, hy, 1.0]);
  // the hub: a small ring of fine threads round the centre (the spider's platform)
  const hubMesh = [];
  for (let k = 0; k <= 12; k++) { const a = (k / 12) * TAU, r = spec.free * 0.5; hubMesh.push([hx + Math.cos(a) * r, hy + Math.sin(a) * r]); }
  return { id: spec.id, hub: [hx, hy], frame, radials, spiral, hubMesh, nodes, g: spec.g };
}

/** PURE: how much of a web is spun at its growth g (0..1) → { bridge, frame (0..A), radials (0..m — fractional), hub, spiral (0..n) } */
export function webState(web, g) {
  g = clamp01(g);
  const A = web.frame.length, m = web.radials.length, n = web.spiral.length;
  return {
    g,
    frame: g <= 0 ? 0 : A * seg01(g, 0.0, 0.18),          // (the first edge is the bridge thread)
    radials: m * seg01(g, 0.16, 0.44),
    hub: seg01(g, 0.3, 0.42),
    spiral: n * seg01(g, 0.44, 0.97),
  };
}
/** the web's growth on the build-up's stage (0..1: the dressing's HP.web) */
export const webGrowth = (web, stage) => seg01(stage, web.g[0], web.g[1]);

const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${(a < 0 ? 0 : a > 1 ? 1 : a).toFixed(3)})`;

/**
 * paintWeb(x, web, g, o): bake one web into a layer. o = { layer: 'silk' | 'glow', day (0..1), light(x, y) → { r, g, b, i, dx, dy }
 * (the neon's light: colour 0..255, intensity 0..~1.4, its direction), px (one device pixel in logo units: the thinnest line), part
 * ('threads' | 'dew' | 'all') }.
 *   silk  the filaments' own bodies: a hair-thin ice-white core (silvery by day, faint at night) + the nodes' points
 *   glow  their LIGHT (× the sign's live level when composited): the violet halo along every thread, the nodes' glow, and near the
 *         tubes a tint of the neon's own colour
 */
export function paintWeb(x, web, g, o) {
  const st = webState(web, g), day = o.day || 0, px = o.px || 0.3, glow = o.layer === 'glow', part = o.part || 'all', ns = Math.floor(st.spiral), fr = st.spiral - ns;
  if (st.g <= 0) return 0;
  let n = 0;
  const coreW = Math.max(px * 1.0, 0.26), frameW = Math.max(px * 1.25, 0.36);
  x.save(); x.lineCap = 'round'; x.lineJoin = 'round';
  const coreA = lerp(0.42, 0.7, day);
  // a thread: the silk layer draws the core; the glow layer its violet halo (wider, soft) + a faint brighter line, tinted by the neon
  const line = (a, b, w, k) => {
    if (glow) {
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, L = o.light(mx, my), li = Math.min(1, L.i);
      const tint = [lerp(WEB_COL.halo[0], L.r, li * 0.35), lerp(WEB_COL.halo[1], L.g, li * 0.35), lerp(WEB_COL.halo[2], L.b, li * 0.35)];
      x.strokeStyle = rgba(tint, 0.42 * k); x.lineWidth = w * 3.6;
      x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke();
      x.strokeStyle = rgba(WEB_COL.core, 0.5 * k); x.lineWidth = w * 1.25;
    } else { x.strokeStyle = rgba(WEB_COL.core, coreA * k); x.lineWidth = w; }
    x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); n++;
  };
  if (part !== 'dew') {
    // ---- the frame (+ the bridge first): drawn as far as it is spun
    for (let i = 0; i < web.frame.length; i++) {
      const f = clamp01(st.frame - i); if (f <= 0) break;
      const [a, b] = web.frame[i];
      line(a, [lerp(a[0], b[0], f), lerp(a[1], b[1], f)], frameW, 1.1);
    }
    // ---- the radials, in the order they were spun (each from the hub out)
    for (const r of web.radials) {
      const f = clamp01(st.radials - r.order); if (f <= 0) continue;
      line(web.hub, [lerp(web.hub[0], r.end[0], f), lerp(web.hub[1], r.end[1], f)], coreW * 1.05, 0.95);
    }
    // ---- the hub's ring
    if (st.hub > 0) for (let k = 0; k < (web.hubMesh.length - 1) * st.hub; k++) line(web.hubMesh[k], web.hubMesh[k + 1], coreW * 0.8, 0.7);
    // ---- the spiral (outside in), straight threads between the radials
    for (let k = 0; k < Math.min(web.spiral.length, ns + 1); k++) {
      const s = web.spiral[k], f = k < ns ? 1 : fr; if (f <= 0) break;
      line(s.a, f >= 1 ? s.b : [lerp(s.a[0], s.b[0], f), lerp(s.a[1], s.b[1], f)], coreW, 0.9);
    }
  }
  // ---- THE NODES: dew of light at the crossings (+ the frame's anchors + the hub) — points in the silk layer, their glow in the glow layer
  const drops = [];
  if (part !== 'threads') {
    for (let k = 0; k < Math.min(web.spiral.length, ns); k++) for (const d of web.spiral[k].dew) drops.push([web.spiral[k].a[0], web.spiral[k].a[1], d.r]);
    if (st.hub >= 1) drops.push(web.nodes[web.nodes.length - 1]);
    web.radials.forEach((r, i) => { if (clamp01(st.radials - r.order) >= 1) drops.push(web.nodes[i]); });
    for (const [dx, dy, r0] of drops) {
      const r = Math.max(r0, px * 0.8);
      if (!glow) {
        // the node's body: a crisp point of ice white (brighter by day on the silver threads)
        x.fillStyle = rgba(WEB_COL.node, lerp(0.6, 0.95, day)); x.beginPath(); x.arc(dx, dy, r * 0.62, 0, TAU); x.fill();
      } else {
        // its light: a violet halo (the neon's colour mixed in near the tubes) + a white-hot centre
        const L = o.light(dx, dy), li = Math.min(1, L.i);
        const sp = nodeSprite([lerp(WEB_COL.nodeHalo[0], L.r, li * 0.4), lerp(WEB_COL.nodeHalo[1], L.g, li * 0.4), lerp(WEB_COL.nodeHalo[2], L.b, li * 0.4)]);
        if (sp) { x.globalAlpha = 0.95; x.drawImage(sp, dx - r * 4, dy - r * 4, r * 8, r * 8); x.globalAlpha = 1; }
        x.fillStyle = rgba(WEB_COL.node, 0.95); x.beginPath(); x.arc(dx, dy, r * 0.7, 0, TAU); x.fill();
      }
    }
  }
  x.restore();
  return n + drops.length;
}

// the nodes' glow sprites (32 px, drawn to size; the colour in steps of 32 — a few gradients for a whole web)
const NODES = new Map();
function nodeSprite(c) {
  if (typeof document === 'undefined') return null;
  const q = v => Math.min(255, Math.round(v / 32) * 32), key = `${q(c[0])},${q(c[1])},${q(c[2])}`;
  let cv = NODES.get(key);
  if (cv) return cv;
  cv = document.createElement('canvas'); cv.width = cv.height = 32;
  const x = safeCtx(cv), g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, `rgba(${key},0.9)`); g.addColorStop(0.3, `rgba(${key},0.45)`); g.addColorStop(1, `rgba(${key},0)`);
  x.fillStyle = g; x.fillRect(0, 0, 32, 32);
  NODES.set(key, cv);
  return cv;
}

/** the loose threads late in the build-up (a bridge to the O, a strand hanging off the E, one low across the gap) — straight, taut */
export function paintStrays(x, stage, o) {
  const glow = o.layer === 'glow', day = o.day || 0, px = o.px || 0.3;
  x.save(); x.lineCap = 'round';
  for (const s of STRAYS) {
    const f = seg01(stage, s.g, s.g + 0.08); if (f <= 0) continue;
    const e = s.hang ? [s.a[0] - 0.4, s.a[1] + s.hang * f] : [lerp(s.a[0], s.b[0], f), lerp(s.a[1], s.b[1], f)];
    if (glow) { x.strokeStyle = rgba(WEB_COL.halo, 0.28); x.lineWidth = Math.max(px, 0.26) * 3; x.beginPath(); x.moveTo(s.a[0], s.a[1]); x.lineTo(e[0], e[1]); x.stroke(); x.strokeStyle = rgba(WEB_COL.core, 0.4); }
    else x.strokeStyle = rgba(WEB_COL.core, lerp(0.3, 0.55, day));
    x.lineWidth = Math.max(px, 0.26);
    x.beginPath(); x.moveTo(s.a[0], s.a[1]); x.lineTo(e[0], e[1]); x.stroke();
    if (s.hang) { x.fillStyle = rgba(WEB_COL.node, glow ? 0.9 : 0.7); x.beginPath(); x.arc(e[0], e[1], 0.42, 0, TAU); x.fill(); }
  }
  x.restore();
}

// ------------------------------------------------------------------ THE SHIMMER (a faint light travelling along the threads)
/**
 * createShimmer(webs) — pulses of light running out along a radial (now and then round one turn of the spiral) on the webs that are
 * spun. step(t, { motion, growth: [g per web] }); draw(x, look); boxes() → the dirty rects (logo units); moving().
 */
export function createShimmer(webs) {
  let pulses = [], lastT = -1, nextAt = 0, R = rngFrom(hashString('shimmer|1'));
  const LEN = 11;
  function step(t, env = {}) {
    const dt = lastT < 0 ? 0 : Math.min(0.25, t - lastT); lastT = t;
    if (env.motion === false) { pulses = []; return; }
    const gr = env.growth || [];
    for (const p of pulses) p.u += dt / p.dur;
    pulses = pulses.filter(p => p.u < 1.15);
    if (t >= nextAt && pulses.length < 3) {
      nextAt = t + 0.9 + R() * 1.6;
      const cands = webs.map((w, i) => [w, gr[i] == null ? 1 : gr[i]]).filter(([w, g]) => webState(w, g).radials >= 2);
      if (cands.length) {
        const [w, g] = cands[Math.floor(R() * cands.length)], st = webState(w, g);
        if (R() < 0.22 && st.spiral > w.radials.length * 2) {
          // round one turn of the spiral (the ring that is fully spun)
          const ring = Math.floor(R() * Math.floor(st.spiral / w.radials.length));
          const segs = w.spiral.filter(s => Math.floor(s.ring) === ring);
          if (segs.length > 3) pulses.push({ web: w, pts: segs.map(s => s.a).concat([segs[segs.length - 1].b]), u: 0, dur: 1.6, k: 0.8 });
        } else {
          const done = w.radials.filter(r => st.radials - r.order >= 1);
          const r = done[Math.floor(R() * done.length)];
          if (r) pulses.push({ web: w, pts: [w.hub, r.end], u: 0, dur: 0.7 + R() * 0.4, k: 1 });
        }
      }
    }
  }
  const along = (pts, f) => {
    // the point f (0..1) of the way along a polyline
    const L = []; let tot = 0;
    for (let i = 0; i < pts.length - 1; i++) { const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); L.push(l); tot += l; }
    let d = f * tot;
    for (let i = 0; i < L.length; i++) { if (d <= L[i] || i === L.length - 1) { const u = L[i] ? Math.min(1, d / L[i]) : 0; return [lerp(pts[i][0], pts[i + 1][0], u), lerp(pts[i][1], pts[i + 1][1], u)]; } d -= L[i]; }
    return pts[pts.length - 1];
  };
  const extent = pts => pts.reduce((s, p, i) => s + (i ? Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
  function draw(x, look) {
    const a = (0.35 + 0.65 * (look.lit == null ? 1 : look.lit)) * (1 - 0.5 * (look.day || 0));
    if (a < 0.03 || !pulses.length) return;
    x.save(); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
    for (const p of pulses) {
      const tot = extent(p.pts), head = Math.min(1, p.u), tail = Math.max(0, p.u - LEN / tot), k = p.k * (p.u > 1 ? 1 - (p.u - 1) / 0.15 : 1);
      if (k <= 0 || head <= tail) continue;
      const H = along(p.pts, head), T = along(p.pts, tail), M = along(p.pts, (head + tail) / 2);
      const g = x.createLinearGradient(T[0], T[1], H[0], H[1]);
      g.addColorStop(0, rgba(WEB_COL.halo, 0)); g.addColorStop(0.75, rgba(WEB_COL.halo, 0.5 * a * k)); g.addColorStop(1, rgba(WEB_COL.core, 0.9 * a * k));
      x.strokeStyle = g; x.lineWidth = 0.9;
      x.beginPath(); x.moveTo(T[0], T[1]); x.lineTo(M[0], M[1]); x.lineTo(H[0], H[1]); x.stroke();
      x.fillStyle = rgba(WEB_COL.node, 0.9 * a * k); x.beginPath(); x.arc(H[0], H[1], 0.55, 0, TAU); x.fill();
    }
    x.restore();
  }
  return {
    step, draw,
    moving: () => pulses.length > 0,
    boxes: () => pulses.map(p => { const xs = p.pts.map(q => q[0]), ys = p.pts.map(q => q[1]); return { x0: Math.min(...xs) - 2, y0: Math.min(...ys) - 2, x1: Math.max(...xs) + 2, y1: Math.max(...ys) + 2 }; }),
    state: () => pulses.length,
  };
}

// ------------------------------------------------------------------ THE SPIDER
// local frame: origin at the pedicel (the waist), +y FORWARD (the head), +x its left when seen from above (mirrored: both sides alike)
export const LEGS = Object.freeze([
  // hip (local, the +x side), rest foot, the hanging (drop) foot, L1 (the femur), L2 (tibia + tarsus)
  { hip: [1.45, 4.3], rest: [10.6, 21.2], hang: [4.6, 10.5], L1: 8.6, L2: 12.2 },     // I   (the longest: forward)
  { hip: [1.85, 3.4], rest: [16.2, 10.4], hang: [6.8, 5.2], L1: 7.6, L2: 10.6 },      // II
  { hip: [1.9, 2.3], rest: [12.6, -2.6], hang: [5.8, 0.5], L1: 5.6, L2: 7.6 },       // III (the shortest: sideways)
  { hip: [1.5, 1.3], rest: [8.4, -14.6], hang: [4.8, -7.4], L1: 7.1, L2: 11.2 },    // IV  (back, along the abdomen)
]);
/** the spider's size: × the drawn units (1 = a 13-unit body) — 1.5: ~17 pt of body, ~41 pt across the legs on a 402 phone */
const SC = 1.5;
const SPIDER_LEN = 13.2 * SC;
/** each leg's SECTOR: the angle (hip → foot, the body's frame) it rests at, and how far a foot may stray from it before the leg
 *  MUST step (soft: with its group; hard: at once; a step in flight follows the body) — the neighbouring sectors are ≥ 0.62 rad
 *  apart, so two feet within ±0.26 can never cross. The body turns at a fixed mechanical rate (TURN_RATE) the feet keep up with. */
export const SECTOR = Object.freeze({ soft: 0.16, hard: 0.26 });
export const TURN_RATE = 1.5;                                 // rad/s (a π turn ≈ 2.1 s: precise, never a whip)
/** WIN3 — THE LEG POSES ON THE THREAD (the owner: it DANGLES — body below the thread, legs tucked / relaxed round it, never stretched to
 *  the letters): each foot a FRACTION of its leg's rest reach ALONG ITS OWN SECTOR (the sectors never move, so a tucked foot can never
 *  cross a leg — legCheck holds). tuck = hanging, the legs folded in (knees out, feet in) · reach = the touch-down, the front legs
 *  unfolding a little toward the tubes · reel = the climb head-up, the front legs working the line hand over hand */
export const POSES = Object.freeze({ tuck: [0.4, 0.36, 0.38, 0.42], reach: [0.5, 0.45, 0.4, 0.4], stand: [0.85, 0.85, 0.85, 0.85], reel: [0.46, 0.36, 0.34, 0.36] });
const poseF = (pose, i, k, pose2) => (pose2 ? lerp(POSES[pose][i], POSES[pose2][i], k) : lerp(1, POSES[pose][i], k));
export const legSectors = () => LEGS.map(L => Math.atan2(L.rest[1] - L.hip[1], L.rest[0] - L.hip[0]));
/** the chrome: near-black plates, a cool grey sheen, the seams' + eyes' light */
const CH = { base: [14, 14, 20], sheen: [168, 176, 198], edge: [4, 4, 8], seam: [160, 128, 255], eye: [222, 196, 255], eyeHot: [255, 252, 255] };

function solveKnee(hx, hy, fx, fy, L1, L2, side) {
  let dx = fx - hx, dy = fy - hy, d = Math.hypot(dx, dy) || 1e-6;
  const dc = Math.max(Math.abs(L1 - L2) + 0.05, Math.min(L1 + L2 - 0.05, d));
  const a = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + dc * dc - L2 * L2) / (2 * L1 * dc))));
  dx /= d; dy /= d;
  const k1 = [hx + (dx * Math.cos(a) - dy * Math.sin(a)) * L1, hy + (dx * Math.sin(a) + dy * Math.cos(a)) * L1];
  const k2 = [hx + (dx * Math.cos(-a) - dy * Math.sin(-a)) * L1, hy + (dx * Math.sin(-a) + dy * Math.cos(-a)) * L1];
  return (k1[0] * side > k2[0] * side) ? k1 : k2;
}

/**
 * createSpider(web) — the spider on a built web (buildWeb: its hub + radials). step(t, env) advances its life (the clock's seconds);
 * draw(x, look) paints it (look: { day 0..1, light(x, y), lit }). bbox() → its box (logo units) for the dirty rect; moving() → is it
 * moving; legCheck() → { maxDev (rad, from each leg's sector), crossed } — the proof it never tangles.
 */
export function createSpider(web, { seed = 7 } = {}) {
  const hub = web.hub;
  const legs = [], S2 = ([a, b]) => [a * SC, b * SC], SEC = legSectors();
  for (let s of [1, -1]) LEGS.forEach((L0, i) => { const L = { hip: S2(L0.hip), rest: S2(L0.rest), hang: S2(L0.hang), L1: L0.L1 * SC, L2: L0.L2 * SC }; legs.push({ s, i, L, sec: SEC[i], foot: null, step: null, group: (i + (s > 0 ? 0 : 1)) % 2 }); });
  let tl = [], cyc = 0, lastT = -1, maxR = 30, body = { x: hub[0], y: hub[1], h: Math.PI / 2, mode: 'hub', hang: 0, sway: 0 };
  // WIN2 — THE TAP's TRIP (the owner): down the glowing thread to the SPEAKEASY word, a crawl back + forth along its tubes (stop-start, a
  // pause on a letter, a leg test-tapping a tube), the climb home reeling the thread in; a second tap mid-way is ignored (a cooldown).
  // ITS NERVES: a flicker / blink / race / blackout / lightning near it → it freezes, crouches, skitters a short burst (home, or away
  // from the flicker), eyes + seams flaring, then calms + resumes. word: { x0, x1, y } (logo units: the tubes' line) — setWord()
  let word = null, trip = null, tripEnd = -1e9, scare = null, crouch = 0, flare = 0, lastScare = -1e9;
  const TRIP = Object.freeze({ drop: 2.3, land: 0.55, crawl: [10, 15], climb: 3.4, cool: 3 });   // (WIN3: a slower drop — the dangle must read)
  const LAND_H = 11;   // (logo units: the body hangs this far above the tubes when its tucked front feet touch them — it lands FEET FIRST)
  const R0 = rngFrom(hashString(`spider|${seed}`));
  /** WIN3 — the body ON ITS THREAD, `hang` below the hub: the pendulum's gentle sway (the x + the body tilted along the line) and the
   *  slow spin (draw-only: the apparent width turning about the line). head: 1 = head down (the drop, the hang), −1 = head up (the climb) */
  function dangle(t, hang, { pose, poseK = 1, pose2 = null, spinK = 1, swayK = 1, mode, head = 1 }) {
    const a = Math.sin(t * 3.9) * 0.09 * swayK * Math.min(1, hang / 20);
    return { x: hub[0] + Math.sin(a) * hang, y: hub[1], h: head * Math.PI / 2 - a, mode, hang: Math.cos(a) * hang, sway: 0, pose, poseK, pose2, spin: t * 1.25, spinK, head, thread: hang };
  }
  const W = (lx, ly, b = body) => { const fx = Math.cos(b.h), fy = Math.sin(b.h), rx = -fy, ry = fx; return [b.x + rx * lx + fx * ly, b.y + ry * lx + fy * ly]; };
  /** a world point → the body's frame (lx, ly) */
  const Wi = (px, py, b = body) => { const fx = Math.cos(b.h), fy = Math.sin(b.h), rx = -fy, ry = fx, dx = px - b.x, dy = py - b.y; return [dx * rx + dy * ry, dx * fx + dy * fy]; };
  const angTo = (a, b, u) => { let d = ((b - a + Math.PI) % TAU + TAU) % TAU - Math.PI; return a + d * u; };
  const wrap = d => ((d + Math.PI) % TAU + TAU) % TAU - Math.PI;

  // ---- THE LIFE on the clock: a timeline of segments built ahead, seeded per cycle (stop-start: still, bursts, turns, the drop)
  function plan(t0) {
    const R = rngFrom(hashString(`spider-life|${seed}|${cyc++}`)), out = [];
    let t = t0;
    const at = { x: hub[0], y: hub[1], h: Math.PI / 2 };
    const push = (kind, dur, to, o = {}) => {
      if (kind === 'turn' && to.h != null) dur = Math.abs(wrap(to.h - at.h)) / TURN_RATE + 0.06;   // (a turn takes what its angle takes)
      out.push({ kind, t0: t, t1: t + dur, from: { ...at }, to: { ...at, ...to }, ...o }); t += dur; Object.assign(at, to);
    };
    push('still', 7 + R() * 9, {});
    const act = R();
    if (act < 0.55 && web.radials.length) {
      // an EXCURSION: turn to a radial, out in bursts, a look round, back in bursts, head-down again
      const usable = web.radials.filter(r => r.len > 14);
      const rd = usable[Math.floor(R() * usable.length)] || web.radials[0];
      const ang = rd.ang, dist = Math.min(maxR, rd.len * (0.45 + R() * 0.3));
      push('turn', 0.6 + R() * 0.3, { h: ang });
      push('still', 0.4 + R() * 0.6, {});
      let r = 0;
      while (r < dist - 0.5) { const step = Math.min(dist - r, 5 + R() * 7); r += step; push('move', step / (26 + R() * 10), { x: hub[0] + Math.cos(ang) * r, y: hub[1] + Math.sin(ang) * r }); push('still', 0.35 + R() * 1.4, {}); }
      push('still', 1.5 + R() * 2.5, {});
      push('turn', 0.8 + R() * 0.3, { h: ang + Math.PI });
      while (r > 0.5) { const step = Math.min(r, 6 + R() * 8); r -= step; push('move', step / (28 + R() * 10), { x: hub[0] + Math.cos(ang) * r, y: hub[1] + Math.sin(ang) * r }); push('still', 0.25 + R() * 0.9, {}); }
      push('turn', 0.7, { h: Math.PI / 2, x: hub[0], y: hub[1] });
    } else if (act < 0.8) {
      // THE DROP: down on the glowing thread (fast, easing off), hangs turning a little, reels itself back up
      const depth = 26 + R() * 18;
      push('drop', 1.1 + R() * 0.3, {}, { depth });
      push('hang', 3 + R() * 4, {}, { depth });
      push('climb', 2.6 + R() * 1.2, { h: -Math.PI / 2 }, { depth });   // (WIN3: head-up, reeling; then the turn back to head-down)
      push('turn', 0, { h: Math.PI / 2 });
      push('still', 0.6, {});
    } else {
      // a TURN in the hub (a look round)
      const h2 = Math.PI / 2 + (R() < 0.5 ? -1 : 1) * (0.35 + R() * 0.4);
      push('turn', 0.55, { h: h2 }); push('still', 2 + R() * 3, {}); push('turn', 0.55, { h: Math.PI / 2 });
    }
    return out;
  }
  function ensure(t) {
    if (!tl.length || tl[0].t0 > t) { tl = plan(t); }
    while (tl[tl.length - 1].t1 < t + 1) tl.push(...plan(tl[tl.length - 1].t1));
    while (tl.length > 2 && tl[0].t1 < t - 1) tl.shift();
  }
  function bodyAt(t) {
    ensure(t);
    const s = tl.find(o => t >= o.t0 && t < o.t1) || tl[tl.length - 1], u = clamp01((t - s.t0) / (s.t1 - s.t0));
    const b = { x: s.from.x, y: s.from.y, h: s.from.h, mode: s.kind, hang: 0, sway: 0, seg: s };
    if (s.kind === 'move') { const e = ease(u); b.x = lerp(s.from.x, s.to.x, e); b.y = lerp(s.from.y, s.to.y, e); }
    else if (s.kind === 'turn') { b.h = angTo(s.from.h, s.to.h, u); b.x = lerp(s.from.x, s.to.x, u); b.y = lerp(s.from.y, s.to.y, u); }   // (linear: a motor's turn)
    // (WIN3: the life's drop is the trip's dangle in small — the legs gather, a sway + a slow spin on the line, the climb head-up reeling)
    else if (s.kind === 'drop') { Object.assign(b, dangle(t, s.depth * (1 - Math.pow(1 - u, 2.6)), { pose: 'tuck', poseK: Math.min(1, u * 5), mode: 'drop', spinK: Math.min(1, u * 3), swayK: Math.min(1, u * 2) })); }
    else if (s.kind === 'hang') { Object.assign(b, dangle(t, s.depth + Math.sin(u * Math.PI) * 1.2, { pose: 'tuck', mode: 'hang' })); }
    else if (s.kind === 'climb') { const v = clamp01(u / 0.15), e = ease(clamp01((u - 0.15) / 0.85)); Object.assign(b, dangle(t, s.depth * (1 - e), { pose: 'reel', mode: 'climb', head: -1, spinK: Math.min(1, (1 - e) * 4), swayK: 0.4 })); if (v < 1) b.h = Math.PI / 2 - Math.PI * v; }   // (the flip first: head down → head up)
    if (b.mode === 'still' && s.from.h !== undefined) b.h = s.to.h;
    return b;
  }
  // ---- THE TRIP (lazy phases: drop → land → [still | turn | move]* along the word → climb → home)
  function tripStart(t) {
    const R = rngFrom(hashString(`trip|${seed}|${Math.floor(t * 10)}`));
    const depth = word ? Math.max(12, word.y - hub[1]) : 34;
    trip = { phase: 'drop', t0: t, dur: TRIP.drop, depth, x: hub[0], h: Math.PI / 2, until: t + TRIP.drop + TRIP.land + TRIP.crawl[0] + R() * (TRIP.crawl[1] - TRIP.crawl[0]), R, dir: 1, from: hub[0], to: hub[0], hFrom: Math.PI / 2, hTo: Math.PI / 2 };
  }   // (WIN3: no settleAll — the legs GATHER from where they stand)
  function tripAt(t) {
    const T = trip; let u = (t - T.t0) / T.dur;
    while (u >= 1) {
      T.t0 += T.dur;
      if (T.phase === 'drop') { T.phase = 'land'; T.dur = TRIP.land; T.hFrom = Math.PI / 2; T.hTo = word && hub[0] > (word.x0 + word.x1) / 2 ? Math.PI : 0; }   // (it lands turning toward the word's middle)
      else if (T.phase === 'land') { T.phase = 'still'; T.h = T.hTo; T.dur = 0.35; }
      else if (T.phase === 'climb') { T.phase = 'home'; T.hFrom = T.h; T.hTo = Math.PI / 2; T.dur = Math.abs(wrap(T.hTo - T.hFrom)) / TURN_RATE + 0.3; }
      else if (T.phase === 'home') { trip = null; tripEnd = t; tl = []; return bodyAt(t); }   // (the life resumes from the hub)
      else if (t >= T.until && T.phase !== 'turn') { T.phase = 'climb'; T.dur = TRIP.climb; T.from = T.x; T.hFrom = T.h; }
      else if (T.phase === 'move') { T.phase = 'still'; T.dur = 0.4 + T.R() * 1.3; }
      else if (T.phase === 'turn') { T.h = T.hTo; T.phase = 'move'; T.from = T.x; T.dur = Math.abs(T.to - T.x) / (16 + T.R() * 10); }
      else {
        // after a landing or a pause: the next run along the word (the tubes' line), a turn first when it faces the other way
        const x0 = word ? word.x0 + 8 : hub[0] - 40, x1 = word ? word.x1 - 8 : hub[0] + 40;
        let to = T.x + (T.R() < 0.5 ? -1 : 1) * (6 + T.R() * 22); to = Math.max(x0, Math.min(x1, to));
        if (Math.abs(to - T.x) < 4) to = T.x + (T.x < (x0 + x1) / 2 ? 12 : -12);
        T.to = to; T.dir = to > T.x ? 1 : -1;
        const hTo = T.dir > 0 ? 0 : Math.PI;
        if (Math.abs(wrap(hTo - T.h)) > 0.05) { T.phase = 'turn'; T.hFrom = T.h; T.hTo = hTo; T.dur = Math.abs(wrap(hTo - T.h)) / TURN_RATE + 0.06; }
        else { T.phase = 'move'; T.from = T.x; T.dur = Math.abs(to - T.x) / (16 + T.R() * 10); }
      }
      u = (t - T.t0) / T.dur;
    }
    u = clamp01(u);
    // WIN3 — THE DROP (the owner): it descends ON ITS THREAD and DANGLES — the legs gather into a tuck first, the body hangs below the
    // line swaying + slowly spinning, then the spin settles and the front legs unfold a little as it touches the tubes FEET FIRST
    if (T.phase === 'drop') {
      const D = T.depth - LAND_H;
      if (u < 0.2) return dangle(t, 0, { pose: 'tuck', poseK: u / 0.2, mode: 'drop', swayK: 0, spinK: 0 });   // (the legs gather first: ~0.45 s)
      if (u < 0.8) { const v = (u - 0.2) / 0.6; return dangle(t, D * (1 - Math.pow(1 - v, 2.3)), { pose: 'tuck', mode: 'drop', spinK: Math.min(1, v * 3) }); }
      const w = (u - 0.8) / 0.2;
      return dangle(t, D + 1.5 * w, { pose: 'tuck', pose2: 'reach', poseK: w, mode: 'drop', spinK: 1 - w, swayK: 1 - w });
    }
    // THE LANDING: the body settles the last bit onto the word turning to face along it; the legs step out to their stance
    // (the legs stay pose-locked — unfolding from the reach to a near-stance as the body comes down, never the full stance in the air)
    if (T.phase === 'land') { const e = ease(u); return { x: hub[0], y: hub[1], h: angTo(T.hFrom, T.hTo, e), mode: 'land', hang: T.depth - LAND_H * (1 - e), sway: 0, thread: T.depth, pose: 'reach', pose2: 'stand', poseK: e }; }
    if (T.phase === 'move') T.x = lerp(T.from, T.to, ease(u));
    if (T.phase === 'turn') T.h = angTo(T.hFrom, T.hTo, u);
    // THE CLIMB HOME, the same in reverse: it lifts off the tubes turning head-up to face the hub, the legs gathered to the line, and
    // reels itself up it (the front legs hand over hand, a slow spin) to settle in the hub
    if (T.phase === 'climb') {
      const lift = clamp01(u / 0.18), e = ease(clamp01((u - 0.18) / 0.72)), top = clamp01((u - 0.9) / 0.1);
      const x0 = T.from, y0 = hub[1] + T.depth - LAND_H * lift, bx = lerp(x0, hub[0], e), by = lerp(y0, hub[1], e);
      const up = Math.atan2(hub[1] - by, hub[0] - bx);
      const h = lift < 1 ? angTo(T.hFrom, up, ease(lift)) : up + Math.sin(t * 4) * 0.05 * (1 - e);
      T.h = h;
      if (top > 0) return { x: bx, y: hub[1], h, mode: 'climb', hang: by - hub[1], sway: 0, thread: 0.01 };
      return { x: bx, y: hub[1], h, mode: 'climb', hang: by - hub[1], sway: 0, pose: 'reel', poseK: Math.min(1, lift * 1.5), spin: t * 1.25, spinK: Math.min(1, lift, (1 - e) * 4), head: -1, thread: Math.hypot(bx - hub[0], by - hub[1]) };
    }
    if (T.phase === 'home') return { x: hub[0], y: hub[1], h: angTo(T.hFrom, T.hTo, u), mode: 'home', hang: 0, sway: 0 };
    // on the word: the body ON the tubes (its thread still up to the hub), walking / turning / pausing
    return { x: T.x, y: hub[1] + T.depth, h: T.h, mode: 'crawl', hang: 0, sway: 0, thread: T.depth, sub: T.phase, seg: T.phase === 'move' ? { from: { x: T.from, y: hub[1] + T.depth }, to: { x: T.to, y: hub[1] + T.depth } } : null };
  }
  // ---- THE SCARE
  function scareNow(ev, t) {
    if (t - lastScare < 4) return false;
    const k = clamp01(ev.k == null ? 0.6 : ev.k), far = ev.x == null ? 0 : Math.abs(ev.x - body.x), reach = 60 + 120 * k;
    if (far > reach) return false;
    const kk = Math.max(0.3, k * (ev.x == null ? 1 : 1 - 0.5 * far / reach));
    lastScare = t;
    const pos = { x: body.x, y: body.y, h: body.h, hang: body.hang, thread: body.thread || 0, mode: body.mode === 'crawl' ? 'crawl' : 'web' };
    let to;
    if (pos.mode === 'crawl') { const dir = ev.x == null ? (trip ? -trip.dir : 1) : (ev.x > body.x ? -1 : 1), x0 = word ? word.x0 + 8 : body.x - 30, x1 = word ? word.x1 - 8 : body.x + 30; to = { x: Math.max(x0, Math.min(x1, body.x + dir * (8 + 10 * kk))), y: body.y }; }
    else if (Math.hypot(body.x - hub[0], body.y - hub[1]) > 3 || body.hang > 0.5) to = { x: hub[0], y: hub[1] };
    else { const a = ev.x == null ? Math.PI / 2 + (R0() - 0.5) : (ev.x > body.x ? Math.PI : 0) + (R0() - 0.5) * 0.8, d = 7 + 8 * kk; to = { x: hub[0] + Math.cos(a) * d, y: hub[1] + Math.sin(a) * d, back: true }; }
    scare = { t0: t, k: kk, pos, to, freeze: 0.25 + 0.4 * kk, dash: 0.3, hold: 0.8 + 1.5 * kk, calm: 2.2 };
    trip && (trip.scared = true);
    return true;
  }
  function scareAt(t) {
    const S = scare, e = t - S.t0, crawl = S.pos.mode === 'crawl';
    const base = { x: S.pos.x, y: S.pos.y, h: S.pos.h, mode: crawl ? 'crawl' : 'scared', hang: S.pos.hang, sway: 0, thread: S.pos.thread };
    if (e < S.freeze) { crouch = Math.max(crouch, Math.min(1, e / 0.18)); flare = 1; return base; }   // (down on its legs within 0.18 s)
    const e2 = e - S.freeze;
    if (e2 < S.dash) { const u = ease(e2 / S.dash); return { ...base, x: lerp(S.pos.x, S.to.x, u), y: lerp(S.pos.y, S.to.y, u), hang: S.pos.hang * (1 - u), h: crawl ? (S.to.x >= S.pos.x ? 0 : Math.PI) : Math.atan2(S.to.y - S.pos.y, S.to.x - S.pos.x), mode: crawl ? 'crawl' : 'skitter' }; }
    const e3 = e2 - S.dash, goBack = S.to.back && e3 > S.hold, backing = goBack && e3 < S.hold + S.dash;
    if (backing) { const u = ease((e3 - S.hold) / S.dash); return { ...base, x: lerp(S.to.x, hub[0], u), y: lerp(S.to.y, hub[1], u), hang: 0, h: Math.PI / 2, mode: 'skitter' }; }
    const at = goBack ? { x: hub[0], y: hub[1] } : S.to;
    crouch = Math.max(0, crouch - 0.012); flare = Math.max(0, 1 - e3 / S.calm);
    if (e3 > S.hold + (S.to.back ? S.dash : 0) + S.calm) {
      scare = null; crouch = 0; flare = 0;
      if (trip) { trip.x = at.x; trip.h = crawl ? (S.to.x >= S.pos.x ? 0 : Math.PI) : trip.h; trip.phase = 'still'; trip.t0 = t; trip.dur = 0.5; return tripAt(t); }
      tl = []; return bodyAt(t);
    }
    return { ...base, x: at.x, y: at.y, hang: 0, h: crawl ? (S.to.x >= S.pos.x ? 0 : Math.PI) : Math.PI / 2, mode: crawl ? 'crawl' : 'scared' };
  }
  /** a foot's angular deviation from its leg's sector (the body's frame; rad, signed) */
  const dev = (g, foot, b = body) => { const [lx, ly] = Wi(foot[0], foot[1], b); return wrap(Math.atan2(ly - g.L.hip[1], lx * g.s - g.L.hip[0]) - g.sec); };

  /** advance to t (s). env: { motion } — reduced motion: the spider holds still in its hub */
  function step(t, env = {}) {
    const dt = lastT < 0 ? 0 : Math.min(0.25, t - lastT); lastT = t;
    if (env.motion === false) { body = { x: hub[0], y: hub[1], h: Math.PI / 2, mode: 'still', hang: 0, sway: 0 }; trip = null; scare = null; crouch = flare = 0; settleAll(); return; }
    // (WIN2: a scare overrides everything for a few seconds; a tap's trip overrides the life; else the life on the clock)
    if (scare) body = scareAt(t); else if (trip) body = tripAt(t); else { body = bodyAt(t); if (crouch > 0) crouch = Math.max(0, crouch - 0.03); if (flare > 0) flare = Math.max(0, flare - 0.02); }
    const pose = body.pose || null, hanging = !!pose;            // (WIN3: on the thread = a leg POSE, never the stance)
    const moving = body.mode === 'move' || body.mode === 'turn' || (body.mode === 'crawl' && (body.sub === 'move' || body.sub === 'turn')) || body.mode === 'skitter';
    const bs = { ...body, h: body.h + body.sway };               // (hanging, the feet sway with the body)
    const spread = 1 + 0.3 * crouch;                             // (crouching: the legs out wide, the body low)
    for (const g of legs) {
      if (hanging) {
        // on the thread: each foot a fraction of its rest reach ALONG ITS OWN SECTOR, chased in the body's frame (the legs gather or
        // unfold over ~0.1 s and never leave their rays); the reel's front legs work the line hand over hand
        let f = poseF(pose, g.i, body.poseK == null ? 1 : body.poseK, body.pose2 || null);
        if (pose === 'reel' && g.i <= 1) f += (g.i === 0 ? 0.12 : 0.06) * Math.sin(t * 7.5 + (g.s > 0 ? 0 : Math.PI) + g.i * 1.3);
        g.pf = g.pf == null ? 1 : g.pf + (f - g.pf) * Math.min(1, dt * 9);
        const hx = g.L.hip[0], hy = g.L.hip[1];
        g.foot = W((hx + (g.L.rest[0] - hx) * g.pf) * g.s, hy + (g.L.rest[1] - hy) * g.pf, bs); g.step = null; continue;
      }
      g.pf = null;
      const tgt = W(g.L.rest[0] * g.s * spread, g.L.rest[1] * spread, body);
      if (!g.foot) { g.foot = tgt; continue; }
      if (g.step) {
        g.step.u += dt / g.step.dur;
        // (a step in flight lands where the body is NOW: the foot follows the turn instead of landing behind it)
        g.step.to = [tgt[0] + g.step.lead[0], tgt[1] + g.step.lead[1]];
        if (g.step.u >= 1) { g.foot = g.step.to; g.step = null; } else continue;
      }
      // a planted foot steps when the body has carried it too far from its place, or out of its leg's sector — in its group's turn
      // (never while the other group's feet are up), at once when past the hard limit (a mechanical safety: no tangling, ever)
      const err = Math.hypot(g.foot[0] - tgt[0], g.foot[1] - tgt[1]), d = Math.abs(dev(g, g.foot));
      const busy = legs.some(o => o.step && o.group !== g.group);
      const need = d > SECTOR.hard || (!busy && (err > (moving ? 2.4 : 1.2) || d > SECTOR.soft));
      if (need) {
        const lead = body.mode === 'move' ? 0.6 : 0, v = body.mode === 'move' && body.seg ? [(body.seg.to.x - body.seg.from.x), (body.seg.to.y - body.seg.from.y)] : [0, 0], vl = Math.hypot(v[0], v[1]) || 1;
        const ld = [v[0] / vl * lead * 2.2, v[1] / vl * lead * 2.2];
        g.step = { from: g.foot, to: [tgt[0] + ld[0], tgt[1] + ld[1]], lead: ld, u: 0, dur: moving ? 0.085 : 0.16 };
        if (body.mode === 'skitter') g.step.dur = 0.06;
      }
    }
    // now and then, at rest, one leg lifts + resets (the stop-start of a living machine)
    if ((body.mode === 'still' || (body.mode === 'crawl' && body.sub === 'still')) && !hanging) {
      const slot = Math.floor(t / 2.7), pick = Math.floor(rngFrom(hashString(`adj|${seed}|${slot}`))() * 16);
      if (pick < 8 && t - slot * 2.7 < 0.05 && !legs.some(o => o.step)) { const g = legs[pick]; const tl0 = g.L.rest, tgt = W(tl0[0] * g.s, tl0[1]); const ld = [(R0() - 0.5) * 1.4, (R0() - 0.5) * 1.4]; g.step = { from: g.foot || tgt, to: [tgt[0] + ld[0], tgt[1] + ld[1]], lead: ld, u: 0, dur: 0.3 }; }
    }
  }
  function settleAll() { for (const g of legs) { const tgt = W(g.L.rest[0] * g.s, g.L.rest[1]); g.foot = tgt; g.step = null; } }
  const footOf = g => (g.step ? (() => { const u = snap(clamp01(g.step.u)); return [lerp(g.step.from[0], g.step.to[0], u), lerp(g.step.from[1], g.step.to[1], u), Math.sin(Math.PI * clamp01(g.step.u))]; })() : [...(g.foot || W(g.L.rest[0] * g.s, g.L.rest[1])), 0]);

  /** the proof: every foot (planted or mid-step) inside its sector; the legs on each side in order (no crossing) */
  function legCheck() {
    const b = { ...body, h: body.h + body.sway };
    let maxDev = 0, crossed = false;
    for (const s of [1, -1]) {
      const angs = legs.filter(g => g.s === s).map(g => { const [fx, fy] = footOf(g); const d = dev(g, [fx, fy], b); maxDev = Math.max(maxDev, Math.abs(d)); return g.sec + d; });
      for (let i = 1; i < angs.length; i++) if (angs[i] >= angs[i - 1]) crossed = true;
    }
    return { maxDev, crossed };
  }

  /** paint: look = { day (0..1), light(x, y) → { r, g, b, i, dx, dy }, lit (the sign's live level) } */
  function draw(x, look) {
    const day = look.day || 0, lit = look.lit == null ? 1 : look.lit, amb = lerp(0.3, 1, day);
    const b = { ...body, y: body.y + body.hang, h: body.h + body.sway };
    const L0 = look.light(b.x, b.y), Li = Math.min(1.3, L0.i) * lit, neon = [L0.r, L0.g, L0.b];
    const seamA = Math.min(1, (0.3 + 0.6 * lit) * (1 - 0.45 * day) * (1 + 0.9 * flare)), glowK = Math.min(1.6, (0.6 + 0.4 * lit) * (1 + 0.6 * flare));   // (WIN2: scared — the seams + eyes flare)
    const chrome = k => rgba([lerp(CH.base[0], CH.sheen[0], k * amb), lerp(CH.base[1], CH.sheen[1], k * amb), lerp(CH.base[2], CH.sheen[2], k * amb)], 1);
    const neonC = a => rgba([lerp(neon[0], 255, 0.25), lerp(neon[1], 255, 0.25), lerp(neon[2], 255, 0.25)], a * Math.min(1, Li));
    x.save();
    // the thread it hangs on: a glowing filament from the hub to the spinnerets (the web's own light), a bead at each end
    if (body.hang > 0.2 || body.thread) {
      const sp = body.head === -1 ? W(0, 6.4 * SC, b) : W(0, -10.6 * SC, b);   // (WIN3: climbing head-up it holds the line at its front)
      x.strokeStyle = rgba(WEB_COL.halo, 0.6 * glowK); x.lineWidth = 1.3; x.beginPath(); x.moveTo(hub[0], hub[1]); x.lineTo(sp[0], sp[1]); x.stroke();
      x.strokeStyle = rgba(WEB_COL.core, 0.7 + 0.3 * lit); x.lineWidth = 0.36; x.beginPath(); x.moveTo(hub[0], hub[1]); x.lineTo(sp[0], sp[1]); x.stroke();
      x.fillStyle = rgba(WEB_COL.node, 0.9); x.beginPath(); x.arc(sp[0], sp[1], 0.42, 0, TAU); x.fill();
    }
    // WIN3 — THE SLOW SPIN on the thread: the body turning about the line = its apparent width (a symmetric body: its mirror image
    // continues the turn); the thread above is drawn unscaled
    const sk = body.spinK || 0;
    // (at the sign's size an edge-on view read as a dark stick — the width only BREATHES between 0.74 and 1: a slow turn, never a line)
    if (sk > 0.001) { const sx = 1 - 0.13 * (1 - Math.cos(body.spin || 0)) * sk; x.translate(b.x, 0); x.scale(sx, 1); x.translate(-b.x, 0); }
    // ---- THE LEGS (the back pairs first: they lie under the abdomen's edge): machined rods, a knuckle at each joint, a claw
    const rx = -Math.sin(b.h), ry = Math.cos(b.h);
    for (const i of [3, 2, 1, 0]) for (const g of legs) {
      if (g.i !== i) continue;
      const hip = W(g.L.hip[0] * g.s, g.L.hip[1], b), [fx, fy, lift] = footOf(g);
      const f = lift > 0 ? [lerp(fx, hip[0], 0.1 * lift), lerp(fy, hip[1], 0.1 * lift)] : [fx, fy];
      const kn = solveKnee(hip[0], hip[1], f[0], f[1], g.L.L1, g.L.L2 * (1 - 0.05 * lift), 1);
      const kn2 = solveKnee(hip[0], hip[1], f[0], f[1], g.L.L1, g.L.L2 * (1 - 0.05 * lift), -1);
      const out = p => (p[0] - b.x) * rx * g.s + (p[1] - b.y) * ry * g.s;
      const knee = out(kn) > out(kn2) ? kn : kn2;
      // the tibia–tarsus joint ~46 % down the lower leg, bent a touch outward
      const mx = lerp(knee[0], f[0], 0.46), my = lerp(knee[1], f[1], 0.46), ux = f[0] - knee[0], uy = f[1] - knee[1], ul = Math.hypot(ux, uy) || 1;
      let nx = -uy / ul, ny = ux / ul; if ((nx * rx + ny * ry) * g.s < 0) { nx = -nx; ny = -ny; }
      const mid = [mx + nx * 0.35 * SC, my + ny * 0.35 * SC];
      const segs = [[hip, knee, 1.7 * SC, 1.25 * SC], [knee, mid, 1.15 * SC, 0.85 * SC], [mid, f, 0.75 * SC, 0.12 * SC]];
      x.lineJoin = 'round'; x.lineCap = 'round';
      for (const [p, q, w0, w1] of segs) {
        const dx = q[0] - p[0], dy = q[1] - p[1], dl = Math.hypot(dx, dy) || 1, px = -dy / dl, py = dx / dl;
        // the rod: a tapered plate of black chrome, a hard dark edge
        x.fillStyle = chrome(0.12);
        x.beginPath(); x.moveTo(p[0] + px * w0 / 2, p[1] + py * w0 / 2); x.lineTo(q[0] + px * w1 / 2, q[1] + py * w1 / 2); x.lineTo(q[0] - px * w1 / 2, q[1] - py * w1 / 2); x.lineTo(p[0] - px * w0 / 2, p[1] - py * w0 / 2); x.closePath(); x.fill();
        x.strokeStyle = rgba(CH.edge, 0.9); x.lineWidth = Math.max(0.12, w1 * 0.16); x.stroke();
        // the sheen down its length (a cylinder's highlight, off-centre toward the sky) + the NEON caught on the edge that faces the sign
        x.strokeStyle = chrome(0.9); x.lineWidth = Math.max(0.18, w1 * 0.34);
        x.beginPath(); x.moveTo(p[0] - px * w0 * 0.18, p[1] - py * w0 * 0.18); x.lineTo(q[0] - px * w1 * 0.18, q[1] - py * w1 * 0.18); x.stroke();
        if (Li > 0.04) {
          const Lp = look.light((p[0] + q[0]) / 2, (p[1] + q[1]) / 2), s1 = Math.sign(Lp.dx * px + Lp.dy * py) || 1;
          x.strokeStyle = neonC(0.85); x.lineWidth = Math.max(0.16, w1 * 0.26);
          x.beginPath(); x.moveTo(p[0] + s1 * px * w0 * 0.38, p[1] + s1 * py * w0 * 0.38); x.lineTo(q[0] + s1 * px * w1 * 0.38, q[1] + s1 * py * w1 * 0.38); x.stroke();
        }
        // the knuckle at the root: a dark sphere with a point of light + a faint neon seam ring
        x.fillStyle = chrome(0.08); x.beginPath(); x.arc(p[0], p[1], w0 * 0.58, 0, TAU); x.fill();
        x.strokeStyle = rgba(CH.seam, seamA * 0.8); x.lineWidth = 0.12; x.beginPath(); x.arc(p[0], p[1], w0 * 0.5, 0, TAU); x.stroke();
        x.fillStyle = rgba(CH.eyeHot, 0.5 + 0.3 * day); x.beginPath(); x.arc(p[0] - px * w0 * 0.2, p[1] - py * w0 * 0.2, w0 * 0.14, 0, TAU); x.fill();
      }
      // the claw: a hard point, its tip a bead of light
      x.fillStyle = rgba(CH.seam, 0.5 * glowK); x.beginPath(); x.arc(f[0], f[1], 0.24, 0, TAU); x.fill();
    }
    // ---- THE BODY in its own frame (local +y = forward = the heading)
    x.translate(b.x, b.y); x.rotate(b.h - Math.PI / 2); x.scale(SC * (1 + 0.1 * crouch), SC * (1 - 0.22 * crouch));   // (crouched: a flatter, wider body)
    const Ll = look.light(b.x, b.y), ldx = Ll.dx || 0, ldy = Ll.dy || 0;
    const cr = Math.cos(-(b.h - Math.PI / 2)), sr = Math.sin(-(b.h - Math.PI / 2)), lx = ldx * cr - ldy * sr, ly = ldx * sr + ldy * cr;
    // THE ABDOMEN: a machined teardrop shell in facets — a long plate with two shoulder plates, the dorsal seam, three cross seams
    const abd = () => { x.beginPath(); x.moveTo(0, -0.8); x.lineTo(2.6, -1.4); x.lineTo(4.0, -3.6); x.lineTo(4.05, -6.2); x.lineTo(2.7, -9.4); x.lineTo(0.9, -11); x.lineTo(-0.9, -11); x.lineTo(-2.7, -9.4); x.lineTo(-4.05, -6.2); x.lineTo(-4.0, -3.6); x.lineTo(-2.6, -1.4); x.closePath(); };
    abd();
    { const g = x.createLinearGradient(-4, 0, 4, 0); g.addColorStop(0, chrome(0.05)); g.addColorStop(0.32, chrome(0.5)); g.addColorStop(0.5, chrome(0.22)); g.addColorStop(0.78, chrome(0.04)); g.addColorStop(1, chrome(0.16)); x.fillStyle = g; x.fill(); }
    x.strokeStyle = rgba(CH.edge, 1); x.lineWidth = 0.22; x.stroke();
    // the NEON's reflection on the round of the shell: a broad band on the side that faces the sign, in its colour
    if (Li > 0.04) {
      x.save(); abd(); x.clip();
      const hx = lx * 2.6, g = x.createLinearGradient(hx - 2.2, 0, hx + 2.2, 0);
      g.addColorStop(0, neonC(0)); g.addColorStop(0.5, neonC(0.9)); g.addColorStop(1, neonC(0)); x.fillStyle = g; x.fillRect(-5, -12, 10, 12);
      x.restore();
    }
    // the sky's specular: a crisp streak along the lit facet (white)
    { const sa = 0.28 + 0.4 * day; x.strokeStyle = rgba(CH.eyeHot, sa); x.lineWidth = 0.34; x.lineCap = 'round';
      x.beginPath(); x.moveTo(-2.6 + lx * 0.6, -2.4); x.lineTo(-3.3 + lx * 0.6, -6.0); x.stroke(); }
    // the seams: the dorsal line + three cross seams (a dark cut with the neon-violet light in it)
    const seam = fn => { x.strokeStyle = rgba(CH.edge, 0.9); x.lineWidth = 0.3; fn(); x.stroke(); x.strokeStyle = rgba(CH.seam, seamA); x.lineWidth = 0.13; fn(); x.stroke(); };
    seam(() => { x.beginPath(); x.moveTo(0, -1.4); x.lineTo(0, -10.4); });
    for (const [y, w] of [[-3.6, 3.9], [-6.2, 4.0], [-8.6, 3.2]]) seam(() => { x.beginPath(); x.moveTo(-w, y); x.quadraticCurveTo(0, y + 0.9, w, y); });
    // the spinnerets: a small dark cone with a bead of the thread's light
    x.fillStyle = chrome(0.1); x.beginPath(); x.moveTo(-0.7, -10.8); x.lineTo(0.7, -10.8); x.lineTo(0, -11.9); x.closePath(); x.fill();
    x.fillStyle = rgba(WEB_COL.node, 0.6 * glowK); x.beginPath(); x.arc(0, -11.6, 0.26, 0, TAU); x.fill();
    // THE CEPHALOTHORAX: a hexagonal head plate, a chevron seam, the eyes, the fangs
    const ceph = () => { x.beginPath(); x.moveTo(0, 0.2); x.lineTo(2.4, 1.0); x.lineTo(2.5, 3.8); x.lineTo(1.3, 5.6); x.lineTo(-1.3, 5.6); x.lineTo(-2.5, 3.8); x.lineTo(-2.4, 1.0); x.closePath(); };
    // the fangs: two angled blades under the head, a point of light at each tip
    x.fillStyle = chrome(0.14);
    for (const s of [-1, 1]) { x.beginPath(); x.moveTo(s * 0.4, 5.2); x.lineTo(s * 1.3, 5.6); x.lineTo(s * 0.9, 7.4); x.closePath(); x.fill(); x.strokeStyle = rgba(CH.edge, 1); x.lineWidth = 0.14; x.stroke(); }
    ceph();
    { const g = x.createLinearGradient(-2.5, 0, 2.5, 0); g.addColorStop(0, chrome(0.06)); g.addColorStop(0.35, chrome(0.48)); g.addColorStop(0.6, chrome(0.2)); g.addColorStop(1, chrome(0.05)); x.fillStyle = g; x.fill(); }
    x.strokeStyle = rgba(CH.edge, 1); x.lineWidth = 0.22; x.stroke();
    if (Li > 0.04) { ceph(); x.strokeStyle = neonC(0.7); x.lineWidth = 0.16; x.stroke(); }
    seam(() => { x.beginPath(); x.moveTo(-1.7, 1.4); x.lineTo(0, 3.0); x.lineTo(1.7, 1.4); });
    // THE EYES: two main eyes glowing violet-white with their halo, two small pairs beside them
    x.globalCompositeOperation = 'lighter';
    for (const [ex, ey, r] of [[0.66, 4.4, 0.6], [-0.66, 4.4, 0.6]]) {
      const rr = r * (2.8 + 1.6 * flare), g = x.createRadialGradient(ex, ey, 0, ex, ey, rr); g.addColorStop(0, rgba(CH.eye, 0.95 * glowK)); g.addColorStop(0.4, rgba(CH.seam, 0.5 * glowK)); g.addColorStop(1, rgba(CH.seam, 0)); x.fillStyle = g; x.beginPath(); x.arc(ex, ey, rr, 0, TAU); x.fill();
    }
    x.globalCompositeOperation = 'source-over';
    for (const [ex, ey, r] of [[0.66, 4.4, 0.6], [-0.66, 4.4, 0.6], [1.6, 3.7, 0.24], [-1.6, 3.7, 0.24], [1.35, 4.8, 0.18], [-1.35, 4.8, 0.18]]) {
      x.fillStyle = rgba(CH.eye, 0.85 + 0.15 * lit); x.beginPath(); x.arc(ex, ey, r, 0, TAU); x.fill();
      x.fillStyle = rgba(CH.eyeHot, 0.95); x.beginPath(); x.arc(ex - r * 0.25, ey + r * 0.2, r * 0.45, 0, TAU); x.fill();
    }
    x.restore();
  }

  return {
    step, draw, legCheck,
    /** its box in logo units (the legs' reach round the body + the thread) */
    bbox() { const r = 18 * SC * (1 + 0.3 * crouch) + 4 * flare; return { x0: Math.min(body.x, hub[0]) - r, y0: Math.min(body.y, hub[1]) - r, x1: Math.max(body.x, hub[0]) + r, y1: body.y + body.hang + r }; },
    moving: () => body.mode !== 'still' || body.hang > 0.2 || !!body.pose || legs.some(g => g.step) || !!trip || !!scare || crouch > 0 || flare > 0,
    /** a tap near it (its drawn body): the trip to the SPEAKEASY word — ignored while one runs or just ended (a cooldown); true = consumed */
    near: (px, py, t) => { const d = Math.hypot(px - body.x, py - (body.y + body.hang)); if (d >= 16 + 6 * crouch) return false; if (!trip && t - tripEnd >= TRIP.cool) { if (scare) { scare = null; crouch = flare = 0; } tripStart(t); } return true; },   // (a tap mid-scare: the drop is its answer)
    /** WIN2: the SPEAKEASY word's tubes (logo units: { x0, x1, y }) — where the trip lands */
    setWord: w => { word = w && Number.isFinite(w.y) ? { x0: w.x0, x1: w.x1, y: w.y } : null; },
    /** WIN2 — ITS NERVES: a flicker near it (ev: { kind, x (logo units | null = the whole sign), k 0..1 }) → true when it reacts */
    scare: (ev, t) => scareNow(ev || {}, t),
    setReach: r => { maxR = r; },
    state: () => ({ mode: body.mode, sub: body.sub || null, x: +body.x.toFixed(1), y: +(body.y + body.hang).toFixed(1), h: +body.h.toFixed(2), stepping: legs.filter(g => g.step).length, trip: trip ? trip.phase : null, scared: +flare.toFixed(2), crouch: +crouch.toFixed(2), word: word ? +word.y.toFixed(1) : null,
      // WIN3: the pose on the thread (tuck / reach / reel | null), the spin's weight, head −1 = up; the legs' mean reach (a fraction of the stance: ~0.3 tucked, 1 standing)
      pose: body.pose || null, spin: +(body.spinK || 0).toFixed(2), head: body.head || 1, reach: +(legs.reduce((s, g) => s + (g.pf == null ? 1 : g.pf), 0) / legs.length).toFixed(2) }),
  };
}
export { SPIDER_LEN };
