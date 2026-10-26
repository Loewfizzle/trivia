// CITY 2.0 — THE HARBOR, PART 11a-1: HALLOWEEN ON THE NEON SIGN — THE WEB + THE SPIDER (drawn by the sign's dressing:
// screens/harbor/signdress.js; docs/harbor.md#part-11a-1). Everything here is in LOGO UNITS (the letters in 0..332 × 0..100, y down).
//
//   THE WEB      two real orb webs strung over the tubes, GROWING day by day with the build-up (core/harbor-holiday.js
//                #halloweenPieces().web): the main one across the N and the E (its hub in the gap between them), the second in the
//                last N's upper triangle late in the month. Built like a garden spider builds: the bridge thread, the frame, the
//                radials (alternating sides), the hub, then the sticky capture spiral from the outside in. Fine sagging silk, a few
//                broken strands, DEW on the spiral catching the tubes' light (the light field: signdress.js#lightField).
//                buildWeb() + webState() are PURE (tests/signdress.test.mjs); paintWeb() bakes into the dressing's cache.
//   THE SPIDER   a garden orb-weaver (Araneus): the big rounded abdomen with its shoulder humps, the dark scalloped folium + the
//                white cross, the glossy cephalothorax, eight banded jointed legs (2-bone IK + the metatarsus' own bend), setae
//                that catch the light. Head-down in the hub most of the time; a STOP-START life on the clock: a leg adjusted now
//                and then, bursts out along a radial + back, a drop on its dragline + the climb home. The feet stay planted on the
//                silk and step in the alternating tetrapod gait. Rim-lit by the neon; by day its own colours.
import { rngFrom, hashString } from '../../core/rng.js';
import { safeCtx } from '../../ui/canvas-safe.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, t) => a + (b - a) * t;
const ease = u => (u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u));
const seg01 = (g, a, b) => clamp01((g - a) / (b - a));

// ------------------------------------------------------------------ THE WEBS (the anchors are ON the tubes)
/** the webs: hub, the frame's support points (on the letters' tubes, in order round the hub), the spiral's spacing, the growth window */
export const WEB_SPECS = Object.freeze([
  // the main web: across the N and the E, its hub in the gap between them (open dark sky behind it)
  { id: 'main', hub: [77, 37], seed: 31, radials: 30, spacing: 3.9, free: 9, g: [0, 0.78],
    anchors: [[5, 3], [138, 0], [142, 50], [97, 97], [47, 76], [0, 22]] },
  // late in the month: a small web nested in the last N's upper triangle (the diagonal, the right stroke, the top-left bend)
  { id: 'corner', hub: [310, 23], seed: 77, radials: 18, spacing: 3.2, free: 5, g: [0.72, 1],
    anchors: [[273, 3], [332, 3], [332, 47], [297, 45]] },
]);
/** a few loose threads (the build-up's last stretch): a bridge line to the O, a broken strand hanging off the E */
const STRAYS = [{ a: [154, 0], b: [197, 1], g: 0.6, sag: 3 }, { a: [142, 50], hang: 15, g: 0.5 }, { a: [64, 90], b: [92, 88], g: 0.88, sag: 2.2 }];

const rayHit = (o, d, a, b) => {
  // ray o + t d against the segment a-b → t or null
  const ex = b[0] - a[0], ey = b[1] - a[1], den = d[0] * ey - d[1] * ex;
  if (Math.abs(den) < 1e-9) return null;
  const qx = a[0] - o[0], qy = a[1] - o[1], t = (qx * ey - qy * ex) / den, u = (qx * d[1] - qy * d[0]) / den;
  return t > 0 && u >= 0 && u <= 1 ? t : null;
};

/** PURE: one web's geometry → { id, hub, frame: [[a, b]…], radials: [{ ang, end, len, order }], spiral: [{ a, b, c (the sagging
 *  control), dew: [{ t, r }] }], hubMesh: [[x, y]…], broken } — everything in the order it is spun */
export function buildWeb(spec) {
  const R = rngFrom(hashString(`web|${spec.id}|${spec.seed}`)), [hx, hy] = spec.hub, A = spec.anchors;
  const frame = A.map((p, i) => [p, A[(i + 1) % A.length]]);
  const n = spec.radials, radials = [];
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * TAU + (R() - 0.5) * 0.11, d = [Math.cos(ang), Math.sin(ang)];
    let best = Infinity;
    for (const [a, b] of frame) { const t = rayHit([hx, hy], d, a, b); if (t != null && t < best) best = t; }
    if (!isFinite(best)) continue;
    radials.push({ ang, end: [hx + d[0] * best, hy + d[1] * best], len: best });
  }
  radials.sort((p, q) => p.ang - q.ang);
  // the order the radials are spun: alternating sides of the hub (a spider balances its web as it goes)
  const ord = radials.map((_, i) => i).sort((p, q) => ((p % 2) - (q % 2)) || (((p * 7) % n) - ((q * 7) % n)));
  ord.forEach((ri, k) => { radials[ri].order = k; });
  // THE CAPTURE SPIRAL: from the outside in, one continuous thread round the radials; each crossing a little nearer the hub
  const m = radials.length, spiral = [], sp = spec.spacing;
  let ring = 0, i = 0;
  const rAt = (ri, rr) => { const r = radials[ri]; return r.len * 0.94 - rr * sp * (0.9 + 0.2 * ((ri * 13 + 7) % 5) / 5); };
  for (let guard = 0; guard < 4000; guard++) {
    const ri = i % m, rj = (i + 1) % m, rr = ring + (i % m) / m, rr2 = ring + ((i % m) + 1) / m;
    const r0 = rAt(ri, rr), r1 = rAt(rj, rr2);
    const lim0 = Math.max(spec.free, radials[ri].len * 0.24), lim1 = Math.max(spec.free, radials[rj].len * 0.24);
    if (r0 < lim0 && r1 < lim1) break;
    if (r0 >= lim0 && r1 >= lim1 && R() > 0.025) {       // (~2.5 % of the spiral torn: real webs have holes)
      const a0 = radials[ri].ang, a1 = radials[rj].ang;
      const a = [hx + Math.cos(a0) * r0, hy + Math.sin(a0) * r0], b = [hx + Math.cos(a1) * r1, hy + Math.sin(a1) * r1];
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, ch = Math.hypot(b[0] - a[0], b[1] - a[1]);
      // the sag: toward the hub a touch (the radials pull) + down under the dew's weight
      const c = [mx + (hx - mx) * 0.05, my + (hy - my) * 0.05 + ch * 0.06];
      const dew = [];
      const nd = R() < 0.58 ? (R() < 0.22 ? 2 : 1) : 0;
      for (let q = 0; q < nd; q++) dew.push({ t: 0.18 + R() * 0.64, r: 0.32 + R() * R() * 0.6 + (R() < 0.04 ? 0.4 : 0) });
      spiral.push({ a, b, c, dew, rr });
    }
    i++; if (i % m === 0) ring++;
  }
  // the hub: a small tangle of fine threads round the centre (the spider's platform)
  const hubMesh = [];
  for (let k = 0; k < 16; k++) { const a = R() * TAU, r = 1.2 + R() * (spec.free * 0.55); hubMesh.push([hx + Math.cos(a) * r, hy + Math.sin(a) * r]); }
  // the dew on the radials (fewer: they're dry silk) + the frame
  const radDew = [];
  for (const r of radials) for (let q = 0; q < 2; q++) if (R() < 0.28) radDew.push({ ri: radials.indexOf(r), t: 0.3 + R() * 0.65, r: 0.28 + R() * 0.3 });
  return { id: spec.id, hub: [hx, hy], frame, radials, spiral, hubMesh, radDew, g: spec.g };
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

const qAt = (s, t) => { const u = 1 - t; return [u * u * s.a[0] + 2 * u * t * s.c[0] + t * t * s.b[0], u * u * s.a[1] + 2 * u * t * s.c[1] + t * t * s.b[1]]; };

/**
 * paintWeb(x, web, g, o): bake one web into a layer. o = { layer: 'silk' | 'glow', day (0..1), light(x, y) → { r, g, b, i, dx, dy }
 * (the neon's light here: colour 0..255, intensity 0..~1.4, its direction), px (one device pixel in logo units: the thinnest line) }.
 *   silk  the threads themselves (moonlit grey at night, silvery by day) + the dew's bodies
 *   glow  what the NEON lights (× the sign's live level when composited): the threads' sheen near the tubes, the dew's lenses
 */
export function paintWeb(x, web, g, o) {
  const st = webState(web, g), day = o.day || 0, px = o.px || 0.3, glow = o.layer === 'glow', part = o.part || 'all', ns = Math.floor(st.spiral), fr = st.spiral - ns;
  if (st.g <= 0) return 0;
  let n = 0;
  const silkW = Math.max(px * 1.1, 0.34), frameW = Math.max(px * 1.3, 0.44);
  x.save(); x.lineCap = 'round'; x.lineJoin = 'round';
  // the colour of the silk itself: night = faint grey-lilac (the moon, the city's glow) · day = bright silvery
  const silkA = lerp(0.3, 0.55, day), silkC = day > 0.5 ? '248,250,255' : '222,214,240';
  const lineA = (al) => `rgba(${silkC},${al.toFixed(3)})`;
  // a thread's sheen in the neon (glow layer): the light's colour, its strength with the distance to the tubes
  const sheen = (mx, my, w, k) => {
    const L = o.light(mx, my), a = Math.min(0.62, (L.i * 0.5 + 0.04) * k);
    if (a < 0.02) return false;
    x.strokeStyle = `rgba(${Math.min(255, L.r * 0.45 + 140) | 0},${Math.min(255, L.g * 0.45 + 130) | 0},${Math.min(255, L.b * 0.45 + 145) | 0},${a.toFixed(3)})`;
    x.lineWidth = w; return true;
  };
  const line = (a, b, w, k, sag = 0) => {
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + sag;
    if (glow) { if (!sheen(mx, my, w * 1.1, k)) return; } else { x.strokeStyle = lineA(silkA * k); x.lineWidth = w; }
    x.beginPath(); x.moveTo(a[0], a[1]); if (sag) x.quadraticCurveTo(mx, my, b[0], b[1]); else x.lineTo(b[0], b[1]); x.stroke(); n++;
  };
  // ---- the frame (+ the bridge first): drawn as far as it is spun
  if (part !== 'dew') {
  for (let i = 0; i < web.frame.length; i++) {
    const f = clamp01(st.frame - i); if (f <= 0) break;
    const [a, b] = web.frame[i], e = [lerp(a[0], b[0], f), lerp(a[1], b[1], f)], ch = Math.hypot(e[0] - a[0], e[1] - a[1]);
    line(a, e, frameW, 1.15, ch * 0.045);
  }
  // ---- the radials, in the order they were spun (each from the hub out)
  const m = web.radials.length;
  for (const r of web.radials) {
    const f = clamp01(st.radials - r.order); if (f <= 0) continue;
    const e = [lerp(web.hub[0], r.end[0], f), lerp(web.hub[1], r.end[1], f)];
    line(web.hub, e, silkW * 1.05, 0.95);
  }
  // ---- the hub's tangle
  if (st.hub > 0) {
    for (let k = 0; k < web.hubMesh.length * st.hub - 1; k++) line(web.hubMesh[k], web.hubMesh[k + 1], silkW * 0.8, 0.6);
  }
  // ---- the capture spiral (outside in), sagging between the radials
  for (let k = 0; k < Math.min(web.spiral.length, ns + 1); k++) {
    const s = web.spiral[k], f = k < ns ? 1 : fr; if (f <= 0) break;
    const mx = s.c[0], my = s.c[1];
    if (glow) { if (!sheen(mx, my, silkW * 1.05, 0.85)) continue; } else { x.strokeStyle = lineA(silkA * 0.95); x.lineWidth = silkW; }
    x.beginPath(); x.moveTo(s.a[0], s.a[1]);
    if (f >= 1) x.quadraticCurveTo(s.c[0], s.c[1], s.b[0], s.b[1]);
    else { const e = qAt(s, f), c = [lerp(s.a[0], s.c[0], f), lerp(s.a[1], s.c[1], f)]; x.quadraticCurveTo(c[0], c[1], e[0], e[1]); }
    x.stroke(); n++;
  }
  }
  // ---- THE DEW: beads on the spiral (+ a few on the radials) — bodies in the silk layer, their neon lenses in the glow layer
  const drops = [];
  if (part !== 'threads') {
  for (let k = 0; k < Math.min(web.spiral.length, ns); k++) for (const d of web.spiral[k].dew) drops.push([...qAt(web.spiral[k], d.t), d.r]);
  for (const d of web.radDew) { const r = web.radials[d.ri]; if (clamp01(st.radials - r.order) >= 1 && st.spiral > web.spiral.length * 0.3) drops.push([lerp(web.hub[0], r.end[0], d.t), lerp(web.hub[1], r.end[1], d.t), d.r]); }
  for (const [dx, dy, r0] of drops) {
    const r = Math.max(r0, px * 0.9);
    if (!glow) {
      // by day: clear water — the sky through it, a darker rim, a crisp white glint · at night: a faint moonlit bead (the neon's light
      // comes in the glow layer) — one sprite each, drawn to size
      const sp = dewSprite(day > 0.5 ? 'day' : 'night');
      if (sp) x.drawImage(sp, dx - r, dy - r, r * 2, r * 2);
    } else {
      // the neon in the drop: a hot lens in the tubes' colour + a small halo (stronger nearer the tubes), a white point toward the light
      const L = o.light(dx, dy), k = Math.min(1.25, L.i + 0.12);
      if (k < 0.04) continue;
      const halo = dewSprite('halo', L), lens = dewSprite('lens', L);
      if (halo) { x.globalAlpha = Math.min(1, 0.34 * k); x.drawImage(halo, dx - r * 4.2, dy - r * 4.2, r * 8.4, r * 8.4); }
      if (lens) { x.globalAlpha = Math.min(1, 0.95 * k); x.drawImage(lens, dx - r * 1.05 - (L.dx || 0) * r * 0.2, dy - r * 1.05 - (L.dy || 0) * r * 0.2, r * 2.1, r * 2.1); }
      x.globalAlpha = Math.min(1, 0.9 * k); x.fillStyle = '#fff'; x.beginPath(); x.arc(dx + (L.dx || 0) * r * 0.38, dy + (L.dy || 0) * r * 0.38 - r * 0.1, Math.max(px * 0.55, r * 0.28), 0, TAU); x.fill();
      x.globalAlpha = 1;
    }
  }
  }
  x.restore();
  return n + drops.length;
}

// the dew's sprites (32 px, drawn to size; the colour in steps of 32 — a few dozen gradients for a whole web instead of a thousand)
const DEW = new Map();
function dewSprite(kind, L) {
  if (typeof document === 'undefined') return null;
  const q = v => Math.min(255, Math.round(v / 32) * 32);
  const key = L ? `${kind}|${q(L.r)},${q(L.g)},${q(L.b)}` : kind;
  let c = DEW.get(key);
  if (c) return c;
  c = document.createElement('canvas'); c.width = c.height = 32;
  const x = safeCtx(c);
  const g = x.createRadialGradient(kind === 'day' ? 12 : 16, kind === 'day' ? 11 : 16, kind === 'day' ? 1 : 0, 16, 16, 16);
  if (kind === 'day') { g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.35, 'rgba(214,228,246,0.6)'); g.addColorStop(0.85, 'rgba(120,140,170,0.55)'); g.addColorStop(1, 'rgba(80,96,120,0)'); }
  else if (kind === 'night') { g.addColorStop(0, 'rgba(236,230,255,0.5)'); g.addColorStop(0.4, 'rgba(210,202,238,0.3)'); g.addColorStop(0.9, 'rgba(200,192,232,0.16)'); g.addColorStop(1, 'rgba(200,192,232,0)'); }
  else {
    const col = [q(L.r), q(L.g), q(L.b)].join(','), hot = [q(L.r) * 0.45 + 150, q(L.g) * 0.45 + 135, q(L.b) * 0.45 + 150].map(v => Math.min(255, v) | 0).join(',');
    if (kind === 'halo') { g.addColorStop(0, `rgba(${col},1)`); g.addColorStop(1, `rgba(${col},0)`); }
    else { g.addColorStop(0, `rgba(${hot},1)`); g.addColorStop(0.55, `rgba(${col},0.84)`); g.addColorStop(1, `rgba(${col},0)`); }
  }
  x.fillStyle = g; x.fillRect(0, 0, 32, 32);
  DEW.set(key, c);
  return c;
}

/** the loose threads late in the build-up (a bridge to the O, a broken strand hanging off the E, one low across the gap) */
export function paintStrays(x, stage, o) {
  const glow = o.layer === 'glow', day = o.day || 0, px = o.px || 0.3;
  x.save(); x.lineCap = 'round';
  for (const s of STRAYS) {
    const f = seg01(stage, s.g, s.g + 0.08); if (f <= 0) continue;
    let pts;
    if (s.hang) { const L = s.hang * f; pts = [s.a, [s.a[0] + 1.2, s.a[1] + L * 0.5], [s.a[0] - 0.6, s.a[1] + L]]; }
    else { const e = [lerp(s.a[0], s.b[0], f), lerp(s.a[1], s.b[1], f)]; pts = [s.a, [(s.a[0] + e[0]) / 2, (s.a[1] + e[1]) / 2 + s.sag * f], e]; }
    if (glow) { const L = o.light(pts[1][0], pts[1][1]), a = Math.min(0.8, L.i * 0.8); if (a < 0.03) continue; x.strokeStyle = `rgba(${Math.min(255, L.r * 0.55 + 120) | 0},${Math.min(255, L.g * 0.55 + 105) | 0},${Math.min(255, L.b * 0.55 + 125) | 0},${a.toFixed(3)})`; }
    else x.strokeStyle = day > 0.5 ? 'rgba(248,250,255,0.5)' : 'rgba(196,190,214,0.2)';
    x.lineWidth = Math.max(px, 0.27);
    x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); x.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1]); x.stroke();
  }
  x.restore();
}

// ------------------------------------------------------------------ THE SPIDER
// local frame: origin at the pedicel (the waist), +y FORWARD (the head), +x its left when seen from above (mirrored: both sides alike)
const LEGS = [
  // hip (local, the +x side), rest foot, the hanging (drop) foot, L1 (femur + patella), L2 (tibia + metatarsus + tarsus)
  { hip: [1.45, 4.3], rest: [10.6, 21.2], hang: [4.6, 10.5], L1: 8.6, L2: 12.2 },     // I   (the longest: forward)
  { hip: [1.85, 3.4], rest: [16.2, 10.4], hang: [6.8, 5.2], L1: 7.6, L2: 10.6 },      // II
  { hip: [1.9, 2.3], rest: [12.6, -2.6], hang: [5.6, -0.6], L1: 5.6, L2: 7.6 },      // III (the shortest: sideways)
  { hip: [1.5, 1.3], rest: [8.4, -14.6], hang: [4.8, -7.4], L1: 7.1, L2: 11.2 },    // IV  (back, along the abdomen)
];
/** the spider's size: × the drawn units (1 = a 13-unit body) — 1.32: ~15 pt of body, ~36 pt across the legs on a 402 phone */
const SC = 1.32;
const SPIDER_LEN = 13.2 * SC;
/** the spider's colours by day (a garden spider: warm tan + brown, the white cross); at night × the ambient, + the neon's rim */
const COL = { abd: [176, 116, 62], abdEdge: [86, 52, 26], fol: [52, 30, 16], folEdge: [204, 158, 104], cross: [240, 232, 214], leg: [80, 52, 30], band: [184, 146, 100], ceph: [112, 74, 42], cephEdge: [54, 34, 20] };

function solveKnee(hx, hy, fx, fy, L1, L2, side) {
  let dx = fx - hx, dy = fy - hy, d = Math.hypot(dx, dy) || 1e-6;
  const dc = Math.max(Math.abs(L1 - L2) + 0.05, Math.min(L1 + L2 - 0.05, d));
  const a = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + dc * dc - L2 * L2) / (2 * L1 * dc))));
  dx /= d; dy /= d;
  const k1 = [hx + (dx * Math.cos(a) - dy * Math.sin(a)) * L1, hy + (dx * Math.sin(a) + dy * Math.cos(a)) * L1];
  const k2 = [hx + (dx * Math.cos(-a) - dy * Math.sin(-a)) * L1, hy + (dx * Math.sin(-a) + dy * Math.cos(-a)) * L1];
  // (the knee bends OUTWARD: away from the body's axis — the femur rises up + out, seen from above it stands out past the line)
  return (k1[0] * side > k2[0] * side) ? k1 : k2;
}

/**
 * createSpider(web) — the spider on a built web (buildWeb: its hub + radials). step(t, env) advances its life (the clock's seconds);
 * draw(x, look) paints it (look: { day 0..1, light(x, y) }). bbox() → its box (logo units) for the dirty rect; moving() → is it moving.
 */
export function createSpider(web, { seed = 7 } = {}) {
  const hub = web.hub;
  const legs = [], S2 = ([a, b]) => [a * SC, b * SC];
  for (let s of [1, -1]) LEGS.forEach((L0, i) => { const L = { hip: S2(L0.hip), rest: S2(L0.rest), hang: S2(L0.hang), L1: L0.L1 * SC, L2: L0.L2 * SC }; legs.push({ s, i, L, foot: null, step: null, group: (i + (s > 0 ? 0 : 1)) % 2, adj: null }); });
  let tl = [], tlEnd = 0, cyc = 0, last = null, lastT = -1, flee = -1e9, maxR = 30, body = { x: hub[0], y: hub[1], h: Math.PI / 2, mode: 'hub', hang: 0, sway: 0 };
  const R0 = rngFrom(hashString(`spider|${seed}`));
  const W = (lx, ly, b = body) => { const fx = Math.cos(b.h), fy = Math.sin(b.h), rx = -fy, ry = fx; return [b.x + rx * lx + fx * ly, b.y + ry * lx + fy * ly]; };
  const angTo = (a, b, u) => { let d = ((b - a + Math.PI) % TAU + TAU) % TAU - Math.PI; return a + d * u; };

  // ---- THE LIFE on the clock: a timeline of segments built ahead, seeded per cycle (stop-start: still, bursts, turns, the drop)
  function plan(t0) {
    const R = rngFrom(hashString(`spider-life|${seed}|${cyc++}`)), out = [];
    let t = t0;
    const at = { x: hub[0], y: hub[1], h: Math.PI / 2 };
    const push = (kind, dur, to, o = {}) => { out.push({ kind, t0: t, t1: t + dur, from: { ...at }, to: { ...at, ...to }, ...o }); t += dur; Object.assign(at, to); };
    push('still', 7 + R() * 9, {});
    const act = R();
    if (act < 0.55 && web.radials.length) {
      // an EXCURSION: turn to a radial, out in bursts, a look round, back in bursts, head-down again
      const usable = web.radials.filter(r => r.len > 14);
      const rd = usable[Math.floor(R() * usable.length)] || web.radials[0];
      const ang = rd.ang, dist = Math.min(maxR, rd.len * (0.45 + R() * 0.3));
      push('turn', 0.55 + R() * 0.25, { h: ang });
      push('still', 0.4 + R() * 0.6, {});
      let r = 0;
      while (r < dist - 0.5) { const step = Math.min(dist - r, 5 + R() * 7); r += step; push('move', step / (24 + R() * 10), { x: hub[0] + Math.cos(ang) * r, y: hub[1] + Math.sin(ang) * r }); push('still', 0.35 + R() * 1.4, {}); }
      push('still', 1.5 + R() * 2.5, {});
      push('turn', 0.7 + R() * 0.3, { h: ang + Math.PI });
      while (r > 0.5) { const step = Math.min(r, 6 + R() * 8); r -= step; push('move', step / (26 + R() * 10), { x: hub[0] + Math.cos(ang) * r, y: hub[1] + Math.sin(ang) * r }); push('still', 0.25 + R() * 0.9, {}); }
      push('turn', 0.6, { h: Math.PI / 2, x: hub[0], y: hub[1] });
    } else if (act < 0.8) {
      // THE DROP: down on the dragline (fast, easing off), hangs turning a little, reels itself back up
      const depth = 26 + R() * 18;
      push('drop', 0.7 + R() * 0.25, {}, { depth });
      push('hang', 3 + R() * 4, {}, { depth });
      push('climb', 2.4 + R() * 1.2, {}, { depth });
      push('still', 0.6, {});
    } else {
      // a TURN in the hub (a look round) + a leg adjusted
      const h2 = Math.PI / 2 + (R() < 0.5 ? -1 : 1) * (0.35 + R() * 0.4);
      push('turn', 0.5, { h: h2 }); push('still', 2 + R() * 3, {}); push('turn', 0.5, { h: Math.PI / 2 });
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
    else if (s.kind === 'turn') { const e = ease(u); b.h = angTo(s.from.h, s.to.h, e); b.x = lerp(s.from.x, s.to.x, e); b.y = lerp(s.from.y, s.to.y, e); }
    else if (s.kind === 'drop') { b.hang = s.depth * (1 - Math.pow(1 - u, 2.6)); }
    else if (s.kind === 'hang') { b.hang = s.depth + Math.sin(u * Math.PI) * 1.2; b.sway = Math.sin((t - s.t0) * 1.7) * 0.18 * Math.sin(u * Math.PI); }
    else if (s.kind === 'climb') { b.hang = s.depth * (1 - u); b.sway = Math.sin((t - s.t0) * 2.1) * 0.08 * (1 - u); }
    if (b.mode === 'still' && s.from.h !== undefined) b.h = s.to.h;
    return b;
  }

  /** advance to t (s). env: { motion } — reduced motion: the spider holds still in its hub */
  function step(t, env = {}) {
    const dt = lastT < 0 ? 0 : Math.min(0.25, t - lastT); lastT = t;
    if (env.motion === false) { body = { x: hub[0], y: hub[1], h: Math.PI / 2, mode: 'still', hang: 0, sway: 0 }; settleAll(); return; }
    // a tap: it bolts down its dragline (+ a slow climb home), whatever it was doing
    if (t - flee < 9) {
      const e = t - flee;
      body = { ...body, x: hub[0], y: hub[1], h: Math.PI / 2, mode: e < 0.45 ? 'drop' : e < 6 ? 'hang' : 'climb', sway: 0, hang: e < 0.45 ? 34 * (1 - Math.pow(1 - e / 0.45, 2.2)) : e < 6 ? 34 : 34 * (1 - (e - 6) / 3) };
    } else body = bodyAt(t);
    const hanging = body.hang > 0.3;
    for (const g of legs) {
      const tgtL = hanging ? g.L.hang : g.L.rest, tgt = W(tgtL[0] * g.s, tgtL[1]);
      if (hanging) { g.foot = tgt; g.step = null; continue; }
      if (!g.foot || dt === 0 && !g.foot) { g.foot = tgt; continue; }
      if (g.step) {
        g.step.u += dt / g.step.dur;
        if (g.step.u >= 1) { g.foot = g.step.to; g.step = null; } else continue;
      }
      // (a planted foot steps when the body has carried it too far from its place — never while the other group's feet are up)
      const err = Math.hypot(g.foot[0] - tgt[0], g.foot[1] - tgt[1]);
      const busy = legs.some(o => o.step && o.group !== g.group);
      const moving = body.mode === 'move' || body.mode === 'turn';
      if (!busy && err > (moving ? 2.6 : 1.3)) {
        const lead = moving ? 0.6 : 0, v = body.mode === 'move' && body.seg ? [(body.seg.to.x - body.seg.from.x), (body.seg.to.y - body.seg.from.y)] : [0, 0], vl = Math.hypot(v[0], v[1]) || 1;
        g.step = { from: g.foot, to: [tgt[0] + v[0] / vl * lead * 2.2, tgt[1] + v[1] / vl * lead * 2.2], u: 0, dur: moving ? 0.1 : 0.22 };
      }
    }
    // now and then, at rest, one leg lifts + resets (the stop-start of a living spider)
    if (body.mode === 'still' && !hanging) {
      const slot = Math.floor(t / 2.7), pick = Math.floor(rngFrom(hashString(`adj|${seed}|${slot}`))() * 16);
      if (pick < 8 && t - slot * 2.7 < 0.05 && !legs.some(o => o.step)) { const g = legs[pick]; const tl0 = g.L.rest, tgt = W(tl0[0] * g.s, tl0[1]); g.step = { from: g.foot || tgt, to: [tgt[0] + (R0() - 0.5) * 1.6, tgt[1] + (R0() - 0.5) * 1.6], u: 0, dur: 0.38 }; }
    }
    last = t;
  }
  function settleAll() { for (const g of legs) { const tgt = W(g.L.rest[0] * g.s, g.L.rest[1]); g.foot = tgt; g.step = null; } }
  const footOf = g => (g.step ? (() => { const u = ease(clamp01(g.step.u)); return [lerp(g.step.from[0], g.step.to[0], u), lerp(g.step.from[1], g.step.to[1], u), Math.sin(Math.PI * clamp01(g.step.u))]; })() : [...(g.foot || W(g.L.rest[0] * g.s, g.L.rest[1])), 0]);

  /** paint: look = { day (0..1), light(x, y) → { r, g, b, i, dx, dy } }, lit (the sign's live level: the neon's share of the light) */
  function draw(x, look) {
    const day = look.day || 0, lit = look.lit == null ? 1 : look.lit, amb = lerp(0.26, 1, day);
    const b = { ...body, y: body.y + body.hang, h: body.h + body.sway };
    const L0 = look.light(b.x, b.y), Li = Math.min(1.3, L0.i) * lit;
    const rim = [L0.r, L0.g, L0.b];
    const shade = (c, k = 1) => `rgb(${Math.min(255, c[0] * amb * k + rim[0] * Li * 0.11 * k) | 0},${Math.min(255, c[1] * amb * k + rim[1] * Li * 0.11 * k) | 0},${Math.min(255, c[2] * amb * k + rim[2] * Li * 0.11 * k) | 0})`;
    const rimC = a => `rgba(${Math.min(255, rim[0] * 0.3 + 182) | 0},${Math.min(255, rim[1] * 0.3 + 168) | 0},${Math.min(255, rim[2] * 0.3 + 184) | 0},${clamp01(a).toFixed(3)})`;
    x.save();
    // the dragline: from the hub to the spinnerets while it hangs
    if (body.hang > 0.2) {
      const sp = W(0, -10.6 * SC, b);
      x.strokeStyle = day > 0.5 ? 'rgba(250,252,255,0.6)' : rimC(0.25 + 0.5 * Li); x.lineWidth = 0.3; x.beginPath(); x.moveTo(hub[0], hub[1]); x.lineTo(sp[0], sp[1]); x.stroke();
    }
    // ---- the legs (the back pairs first: they lie under the abdomen's edge)
    const order = [3, 2, 1, 0];
    for (const i of order) for (const g of legs.filter(o => o.i === i)) {
      const hip = W(g.L.hip[0] * g.s, g.L.hip[1], b), [fx, fy, lift] = footOf(g);
      // (lifted: the foot's tip pulled in a little — seen from above a raised leg foreshortens)
      const f = lift > 0 ? [lerp(fx, hip[0], 0.12 * lift), lerp(fy, hip[1], 0.12 * lift)] : [fx, fy];
      // (the side: the knee bends away from the body's axis — in the world frame, the body's right vector × side)
      const rx = -Math.sin(b.h), ry = Math.cos(b.h);
      const kn = solveKnee(hip[0], hip[1], f[0], f[1], g.L.L1, g.L.L2 * (1 - 0.06 * lift), 1);
      const kn2 = solveKnee(hip[0], hip[1], f[0], f[1], g.L.L1, g.L.L2 * (1 - 0.06 * lift), -1);
      const out = (p) => (p[0] - b.x) * rx * g.s + (p[1] - b.y) * ry * g.s;
      const knee = out(kn) > out(kn2) ? kn : kn2;
      // the metatarsus' own bend: the tibia–metatarsus joint ~45 % of the way, nudged outward
      const mx = lerp(knee[0], f[0], 0.46), my = lerp(knee[1], f[1], 0.46), ux = f[0] - knee[0], uy = f[1] - knee[1], ul = Math.hypot(ux, uy) || 1;
      let nx = -uy / ul, ny = ux / ul; if ((nx * rx + ny * ry) * g.s < 0) { nx = -nx; ny = -ny; }
      const mid = [mx + nx * 0.4 * SC, my + ny * 0.4 * SC];
      const segs = [[hip, knee, 1.3 * SC, 1.1 * SC], [knee, mid, 1.0 * SC, 0.84 * SC], [mid, f, 0.78 * SC, 0.4 * SC]];
      x.lineCap = 'round'; x.lineJoin = 'round';
      for (const [p, q, w0, w1] of segs) {
        // the segment as a tapered quad (thicker at its root), dark + banded, its edge toward the light rim-lit
        const dx = q[0] - p[0], dy = q[1] - p[1], dl = Math.hypot(dx, dy) || 1, px = -dy / dl, py = dx / dl;
        x.fillStyle = shade(COL.leg);
        x.beginPath(); x.moveTo(p[0] + px * w0 / 2, p[1] + py * w0 / 2); x.lineTo(q[0] + px * w1 / 2, q[1] + py * w1 / 2); x.lineTo(q[0] - px * w1 / 2, q[1] - py * w1 / 2); x.lineTo(p[0] - px * w0 / 2, p[1] - py * w0 / 2); x.closePath(); x.fill();
        x.beginPath(); x.arc(p[0], p[1], w0 * 0.55, 0, TAU); x.fill();
        // the pale bands near each joint (a garden spider's ringed legs) — warm by day, faint at night
        x.strokeStyle = shade(COL.band, day > 0.5 ? 1 : 1.25); x.lineWidth = w0 * 0.92;
        x.beginPath(); x.moveTo(lerp(p[0], q[0], 0.06), lerp(p[1], q[1], 0.06)); x.lineTo(lerp(p[0], q[0], 0.2), lerp(p[1], q[1], 0.2)); x.stroke();
        // the rim: the neon along the edge that faces it (+ a fainter one on the other edge: the sign is on both sides)
        if (Li > 0.04) {
          const Lp = look.light((p[0] + q[0]) / 2, (p[1] + q[1]) / 2), s1 = Math.sign(Lp.dx * px + Lp.dy * py) || 1;
          for (const [side, a] of [[s1, 1], [-s1, 0.4]]) {
            x.strokeStyle = rimC(a * Math.min(1, Lp.i * lit * 1.4)); x.lineWidth = Math.max(0.3, w1 * 0.4);
            x.beginPath(); x.moveTo(p[0] + side * px * w0 * 0.42, p[1] + side * py * w0 * 0.42); x.lineTo(q[0] + side * px * w1 * 0.42, q[1] + side * py * w1 * 0.42); x.stroke();
          }
        }
        // a few spines (the legs' bristles)
        x.strokeStyle = shade(COL.leg, 0.7); x.lineWidth = 0.08;
        for (const u of [0.45, 0.78]) { const sx = lerp(p[0], q[0], u), sy = lerp(p[1], q[1], u); x.beginPath(); x.moveTo(sx + px * w0 * 0.4, sy + py * w0 * 0.4); x.lineTo(sx + px * w0 * 0.4 + dx / dl * 0.45 + px * 0.28, sy + py * w0 * 0.4 + dy / dl * 0.45 + py * 0.28); x.stroke(); }
      }
      // the tarsus' claw: a hair darker point
      x.fillStyle = shade(COL.leg, 0.5); x.beginPath(); x.arc(f[0], f[1], 0.2, 0, TAU); x.fill();
    }
    // ---- the body in its own frame
    x.translate(b.x, b.y); x.rotate(b.h - Math.PI / 2); x.scale(SC, SC);   // (local +y = forward = the heading)
    const Ll = look.light(b.x, b.y), ldx = Ll.dx || 0, ldy = Ll.dy || 0;
    // the light's direction in the body's frame
    const cr = Math.cos(-(b.h - Math.PI / 2)), sr = Math.sin(-(b.h - Math.PI / 2)), lx = ldx * cr - ldy * sr, ly = ldx * sr + ldy * cr;
    // THE ABDOMEN: an egg with shoulder humps, behind the waist
    const abd = () => { x.beginPath(); x.moveTo(0, -0.9); x.bezierCurveTo(2.4, -0.7, 4.35, -2.3, 4.1, -4.6); x.bezierCurveTo(3.9, -7.1, 2.6, -9.9, 0, -11); x.bezierCurveTo(-2.6, -9.9, -3.9, -7.1, -4.1, -4.6); x.bezierCurveTo(-4.35, -2.3, -2.4, -0.7, 0, -0.9); x.closePath(); };
    // the setae round its edge first (a fuzz that catches the light)
    x.strokeStyle = Li > 0.05 ? rimC(0.55 * Li) : shade(COL.abdEdge, 1.2); x.lineWidth = 0.09;
    for (let k = 0; k < 46; k++) {
      const a = (k / 46) * TAU, ex = Math.cos(a) * 4.15, ey = -5.8 + Math.sin(a) * 5.2;
      x.beginPath(); x.moveTo(ex * 0.97, ey); x.lineTo(ex * 1.07 + Math.cos(a + 0.4) * 0.12, ey + Math.sin(a) * 0.32); x.stroke();
    }
    abd();
    { const g = x.createRadialGradient(-lx * 1.6, -5.2 - ly * 1.6, 0.5, 0, -5.6, 5.6);
      g.addColorStop(0, shade(COL.abd, 1.08)); g.addColorStop(0.7, shade(COL.abd, 0.72)); g.addColorStop(1, shade(COL.abdEdge, 0.9)); x.fillStyle = g; x.fill(); }
    // the shoulder humps (a lighter bump each side at the front)
    for (const sx of [-1, 1]) { const g = x.createRadialGradient(sx * 2.9, -2.6, 0, sx * 2.9, -2.6, 1.3); g.addColorStop(0, shade(COL.folEdge, 0.9)); g.addColorStop(1, shade(COL.abd, 0.75)); x.fillStyle = g; x.beginPath(); x.arc(sx * 2.9, -2.6, 1.15, 0, TAU); x.fill(); }
    // THE FOLIUM: the dark scalloped leaf down the back, its pale wavy edge
    x.save(); abd(); x.clip();
    const fol = () => { x.beginPath(); const lobes = [[-2.4, 1.45], [-3.6, 2.35], [-4.5, 1.5], [-5.4, 2.2], [-6.3, 1.35], [-7.2, 1.85], [-8.1, 1.05], [-9.0, 1.3], [-10.2, 0.55]];
      x.moveTo(0, -1.6); for (const [y, w] of lobes) x.lineTo(w, y); x.lineTo(0, -11); for (let i = lobes.length - 1; i >= 0; i--) x.lineTo(-lobes[i][1], lobes[i][0]); x.closePath(); };
    fol(); x.fillStyle = shade(COL.fol); x.fill();
    x.strokeStyle = shade(COL.folEdge, 0.95); x.lineWidth = 0.32; x.stroke();
    // the cross: the white dots down the middle + across the shoulders
    x.fillStyle = shade(COL.cross, day > 0.5 ? 1 : 0.75);
    for (const [cx, cy, rx, ry, a] of [[0, -2.45, 0.22, 0.34, 0], [0.05, -3.3, 0.26, 0.42, 0.1], [-0.04, -4.35, 0.24, 0.46, -0.1], [0, -5.4, 0.2, 0.36, 0], [0, -6.25, 0.14, 0.24, 0], [0.95, -3.55, 0.36, 0.2, 0.25], [-0.95, -3.55, 0.36, 0.2, -0.25], [1.85, -3.3, 0.24, 0.15, 0.4], [-1.85, -3.3, 0.24, 0.15, -0.4], [1.3, -6.2, 0.16, 0.12, 0], [-1.3, -6.2, 0.16, 0.12, 0], [0.8, -8.1, 0.13, 0.1, 0], [-0.8, -8.1, 0.13, 0.1, 0]]) { x.beginPath(); x.ellipse(cx, cy, rx, ry, a, 0, TAU); x.fill(); }
    // the sheen: a soft gloss where the neon catches the round of the abdomen (lighter blend), + the night's rim on its edge
    if (Li > 0.04) {
      x.globalCompositeOperation = 'lighter';
      const hx = lx * 2.2, hy = -5.2 + ly * 2.8, g = x.createRadialGradient(hx, hy, 0, hx, hy, 3.6);
      g.addColorStop(0, rimC(0.42 * Li)); g.addColorStop(1, rimC(0)); x.fillStyle = g; x.fillRect(-5, -12, 10, 12);
      x.globalCompositeOperation = 'source-over';
    }
    // the gloss: a crisp specular on the round of the abdomen, toward the light (+ a fainter one by day from the sky)
    { const sa = day > 0.5 ? 0.35 : 0.75 * Li, sx = -1.4 + lx * 1.2, sy = -4.3 + ly * 1.4;
      if (sa > 0.03) { const g = x.createRadialGradient(sx, sy, 0, sx, sy, 1.5); g.addColorStop(0, `rgba(255,246,252,${sa.toFixed(3)})`); g.addColorStop(1, 'rgba(255,246,252,0)'); x.fillStyle = g; x.beginPath(); x.ellipse(sx, sy, 1.5, 0.9, -0.5, 0, TAU); x.fill(); } }
    x.restore();
    if (Li > 0.04) { abd(); x.strokeStyle = rimC(0.8 * Li); x.lineWidth = 0.3; x.stroke(); }
    // the spinnerets' tip
    x.fillStyle = shade(COL.abdEdge, 0.7); x.beginPath(); x.ellipse(0, -10.8, 0.5, 0.35, 0, 0, TAU); x.fill();
    // THE CEPHALOTHORAX: a glossy flattened oval, the head narrowing forward, the fovea groove, the eyes, the chelicerae + palps
    const ceph = () => { x.beginPath(); x.moveTo(0, 0.2); x.bezierCurveTo(2.5, 0.2, 2.7, 3.2, 1.6, 4.9); x.quadraticCurveTo(0, 5.9, -1.6, 4.9); x.bezierCurveTo(-2.7, 3.2, -2.5, 0.2, 0, 0.2); x.closePath(); };
    // the palps (short leg-like feelers at the front)
    x.strokeStyle = shade(COL.leg); x.lineWidth = 0.42; x.lineCap = 'round';
    for (const sx of [-1, 1]) { x.beginPath(); x.moveTo(sx * 0.9, 5.0); x.lineTo(sx * 1.7, 6.5); x.lineTo(sx * 1.5, 7.6); x.stroke(); }
    // the chelicerae
    x.fillStyle = shade(COL.cephEdge, 1.1); for (const sx of [-1, 1]) { x.beginPath(); x.ellipse(sx * 0.55, 5.6, 0.5, 0.75, 0, 0, TAU); x.fill(); }
    ceph();
    { const g = x.createRadialGradient(-lx * 0.9, 2.6 - ly * 0.9, 0.2, 0, 2.6, 3); g.addColorStop(0, shade(COL.ceph, 1.15)); g.addColorStop(1, shade(COL.cephEdge)); x.fillStyle = g; x.fill(); }
    x.strokeStyle = shade(COL.cephEdge, 0.6); x.lineWidth = 0.18; x.beginPath(); x.moveTo(0, 1.4); x.lineTo(0, 3.0); x.moveTo(-1.1, 2.0); x.lineTo(0, 2.9); x.lineTo(1.1, 2.0); x.stroke();
    if (Li > 0.04) { ceph(); x.strokeStyle = rimC(0.6 * Li); x.lineWidth = 0.22; x.stroke(); }
    // the eyes: eight small dark beads near the front, two of them catching a point of light
    x.fillStyle = 'rgb(10,6,6)';
    for (const [ex, ey, r] of [[0.32, 4.9, 0.26], [-0.32, 4.9, 0.26], [0.34, 4.35, 0.22], [-0.34, 4.35, 0.22], [1.05, 4.55, 0.18], [-1.05, 4.55, 0.18], [1.15, 4.1, 0.16], [-1.15, 4.1, 0.16]]) { x.beginPath(); x.arc(ex, ey, r, 0, TAU); x.fill(); }
    x.fillStyle = day > 0.5 ? 'rgba(255,255,255,0.85)' : rimC(0.4 + 0.6 * Li);
    for (const sx of [-1, 1]) { x.beginPath(); x.arc(sx * 0.27, 4.98, 0.09, 0, TAU); x.fill(); }
    x.restore();
  }

  return {
    step, draw,
    /** its box in logo units (the legs' reach round the body + the dragline) */
    bbox() { const r = 18 * SC; return { x0: Math.min(body.x, hub[0]) - r, y0: Math.min(body.y, hub[1]) - r, x1: Math.max(body.x, hub[0]) + r, y1: body.y + body.hang + r }; },
    moving: () => body.mode !== 'still' || body.hang > 0.2 || legs.some(g => g.step),
    /** a tap near it: it bolts down its line */
    near: (px, py, t) => { const d = Math.hypot(px - body.x, py - (body.y + body.hang)); if (d < 16) { flee = t; return true; } return false; },
    setReach: r => { maxR = r; },
    state: () => ({ mode: body.mode, x: +body.x.toFixed(1), y: +(body.y + body.hang).toFixed(1), h: +body.h.toFixed(2), stepping: legs.filter(g => g.step).length }),
  };
}
export { SPIDER_LEN };
