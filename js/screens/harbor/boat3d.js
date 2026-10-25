// CITY 2.0 — THE HARBOR, 8b2 Group 3: THE BOATS' 3-D KIT. A small flat-shaded mesh renderer in the Harbor's own camera
// (core/harbor-layout.js#project): a boat is a list of PARTS (convex pieces — a hull, a cabin, a stack, a sail) in boat-local
// coordinates — a along her length (0 = the stern, len = the stem), u up from the waterline, s across (+ = STARBOARD) — posed by
// her world place (x, z), her HEADING (0 = heading right +x, π/2 = away from the camera, −π/2 = toward it) + a baked roll / pitch,
// projected through the pinhole. Each part: its faces culled by their normals (back faces never drawn), shaded flat from the
// scene's sun side (relative to a face turned to the camera, which keeps the old sprites' colours), batched by colour; its decals
// (windows, stripes, the name) on its visible faces only; its lines (staffs, rails, spars) after. The parts are depth-sorted far
// first, a part resting on another always after it (`on`), `last` parts (the bulb strings) at the end. The caller caches the
// result in a sprite keyed by the quantized heading + view angle + look (boats.js) — a boat sailing straight costs a blit.
//
// Authoring: newPart(id, { on, last, sort }) → box / prismS (a profile in the a–u plane, extruded across s) / prismU (a plan in
// the a–s plane, extruded up) / cylU / loft (a hull from stations) / face / line / dot; decals ride a face (dec(face, pts, c)).
// Colours are ROLES resolved per look by the boat's palette (pal(role) → rgb, already lit for the hour) — the meshes are built once.
import { LEVEL } from './water.js';
import { shade } from './shapes.js';

const ID = (a, u, s) => [a, u, s];
const sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
const cross = (p, q) => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
const dot3 = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
const norm = p => { const l = Math.hypot(p[0], p[1], p[2]) || 1; return [p[0] / l, p[1] / l, p[2] / l]; };

/** a new part. o: { on (the part it rests on — drawn after it), last (drawn at the very end), sort (its faces depth-sorted one by
 *  one: a non-convex piece like a cambered sail), two (every face double-sided), k (a constant shade offset) } */
export function newPart(id, o = {}) { return { id, on: o.on || null, last: !!o.last, sort: !!o.sort, two: !!o.two, faces: [], lines: [], dots: [], texts: [] }; }

/** a polygon face: pts [[a,u,s]…] around it; o: { n (its outward normal, local), out (a point inside the part — orients a computed
 *  normal), two (double-sided), k (shade offset), flat (never shaded: glass, lamps) } → the face (decals go on it) */
export function face(P, pts, c, o = {}) {
  let n = o.n;
  if (!n) {
    let acc = [0, 0, 0];
    for (let i = 1; i + 1 < pts.length; i++) { const cr = cross(sub(pts[i], pts[0]), sub(pts[i + 1], pts[0])); acc = [acc[0] + cr[0], acc[1] + cr[1], acc[2] + cr[2]]; }
    n = norm(acc);
    if (o.out) { const m = pts.reduce((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length, s[2] + p[2] / pts.length], [0, 0, 0]); if (dot3(n, sub(m, o.out)) < 0) n = [-n[0], -n[1], -n[2]]; }
  }
  const F = { p: pts, n, c, two: !!(o.two || P.two), k: o.k || 0, flat: !!o.flat, dec: [] };
  P.faces.push(F);
  return F;
}
/** a decal on a face (drawn only when the face shows): pts in local coords (on the face's plane, nudged out a hair), c a role;
 *  o: { win (a lit window: its glow + the blackout's glass), w (a stroke width: a ring / an outline, not a fill), flat } */
export function dec(F, pts, c, o = {}) { const e = 0.012, n = F.n; F.dec.push({ p: pts.map(p => [p[0] + n[0] * e, p[1] + n[1] * e, p[2] + n[2] * e]), c, win: !!o.win, w: o.w || 0, flat: o.flat ?? !!o.win }); return F; }
/** a rectangle decal on an axis-aligned face: along a (a0..a1) × u (u0..u1) at lateral s (a side face) */
export const decS = (F, a0, a1, u0, u1, s, c, o) => dec(F, [ID(a0, u0, s), ID(a1, u0, s), ID(a1, u1, s), ID(a0, u1, s)], c, o);
/** … across s (s0..s1) × u at a (an end face) */
export const decA = (F, s0, s1, u0, u1, a, c, o) => dec(F, [ID(a, u0, s0), ID(a, u0, s1), ID(a, u1, s1), ID(a, u1, s0)], c, o);
/** an arched window on a side face (a0..a1 × u0..u1, its top a half round) */
export function archS(F, a0, a1, u0, u1, s, c, o) {
  const r = (a1 - a0) / 2, cy = u1 - r, pts = [ID(a0, u0, s), ID(a1, u0, s), ID(a1, cy, s)];
  for (let i = 1; i < 6; i++) { const t = (i / 6) * Math.PI; pts.push(ID(a0 + r + r * Math.cos(t), cy + r * Math.sin(t), s)); }
  pts.push(ID(a0, cy, s));
  return dec(F, pts, c, o);
}
/** a ring on a side face (a lifebuoy, a tyre fender): centre (a, u) at s, radius r, stroke width w */
export function ringS(F, a, u, s, r, w, c, n = 10) { const pts = []; for (let i = 0; i < n; i++) { const t = (i / n) * Math.PI * 2; pts.push(ID(a + r * Math.cos(t), u + r * Math.sin(t), s)); } return dec(F, pts, c, { w }); }

/** a box a0..a1 × u0..u1 × s0..s1. o: { c: { top, bot, fore, aft, port, stbd } per-face roles, skip: ['bot', …], k } → { top, bot, fore, aft, port, stbd } */
export function box(P, a0, a1, u0, u1, s0, s1, c, o = {}) {
  const cc = o.c || {}, skip = new Set(o.skip || ['bot']), out = {}, k = o.k || 0;
  const add = (nm, pts, n) => { if (!skip.has(nm)) out[nm] = face(P, pts, cc[nm] || c, { n, k: (o.kk && o.kk[nm]) || k }); };
  add('top', [ID(a0, u1, s0), ID(a1, u1, s0), ID(a1, u1, s1), ID(a0, u1, s1)], [0, 1, 0]);
  add('bot', [ID(a0, u0, s0), ID(a1, u0, s0), ID(a1, u0, s1), ID(a0, u0, s1)], [0, -1, 0]);
  add('fore', [ID(a1, u0, s0), ID(a1, u0, s1), ID(a1, u1, s1), ID(a1, u1, s0)], [1, 0, 0]);
  add('aft', [ID(a0, u0, s0), ID(a0, u0, s1), ID(a0, u1, s1), ID(a0, u1, s0)], [-1, 0, 0]);
  add('stbd', [ID(a0, u0, s1), ID(a1, u0, s1), ID(a1, u1, s1), ID(a0, u1, s1)], [0, 0, 1]);
  add('port', [ID(a0, u0, s0), ID(a1, u0, s0), ID(a1, u1, s0), ID(a0, u1, s0)], [0, 0, -1]);
  return out;
}
/** a profile in the a–u plane (CCW or CW, any convex shape) extruded across s0..s1: { stbd, port, strips[] } */
export function prismS(P, prof, s0, s1, c, o = {}) {
  const ca = prof.reduce((s, p) => s + p[0], 0) / prof.length, cu = prof.reduce((s, p) => s + p[1], 0) / prof.length, inside = [ca, cu, (s0 + s1) / 2];
  const out = { strips: [] };
  if (!(o.skip || []).includes('stbd')) out.stbd = face(P, prof.map(([a, u]) => ID(a, u, s1)), (o.c && o.c.stbd) || c, { n: [0, 0, 1], k: o.k });
  if (!(o.skip || []).includes('port')) out.port = face(P, prof.map(([a, u]) => ID(a, u, s0)), (o.c && o.c.port) || c, { n: [0, 0, -1], k: o.k });
  for (let i = 0; i < prof.length; i++) {
    const [a, u] = prof[i], [b, v] = prof[(i + 1) % prof.length];
    if (o.open && o.open(i)) continue;
    out.strips.push(face(P, [ID(a, u, s0), ID(b, v, s0), ID(b, v, s1), ID(a, u, s1)], (o.c && o.c.strip) || c, { out: inside, k: o.k }));
  }
  return out;
}
/** a plan in the a–s plane (any convex shape) extruded up u0..u1: { top, walls[] } */
export function prismU(P, plan, u0, u1, c, o = {}) {
  const ca = plan.reduce((s, p) => s + p[0], 0) / plan.length, cs = plan.reduce((s, p) => s + p[1], 0) / plan.length, inside = [ca, (u0 + u1) / 2, cs];
  const out = { walls: [] };
  if (!o.noTop) out.top = face(P, plan.map(([a, s]) => ID(a, u1, s)), (o.c && o.c.top) || c, { n: [0, 1, 0], k: (o.kk && o.kk.top) || o.k });
  for (let i = 0; i < plan.length; i++) {
    const [a, s] = plan[i], [b, t] = plan[(i + 1) % plan.length];
    out.walls.push(face(P, [ID(a, u0, s), ID(b, u0, t), ID(b, u1, t), ID(a, u1, s)], (o.c && o.c.wall) || c, { out: inside, k: o.k }));
  }
  return out;
}
/** a vertical cylinder at (a, s), radius r, u0..u1, n sides (+ its top cap) */
export function cylU(P, a, s, r, u0, u1, n, c, o = {}) {
  const plan = [];
  for (let i = 0; i < n; i++) { const t = (i / n) * Math.PI * 2 + (o.rot || 0); plan.push([a + r * Math.cos(t), s + r * Math.sin(t)]); }
  return prismU(P, plan, u0, u1, c, o);
}
/** a HULL from stations [{ a, aw (the waterline's a — a raked stem), b (half-beam at the deck), bw (at the waterline), h (the
 *  sheer) }] stern → stem; bands [[u0, u1, role]] up the side (the boot stripe, the rub rail); deck: its role; transom: true.
 *  Each band's quads between two stations, both sides; the deck's quads; the transom (its bands). bot: the keel's depth. */
export function loft(P, st, bands, deckC, o = {}) {
  const bot = o.bot ?? -0.12, inside = [(st[0].a + st[st.length - 1].a) / 2, 0.5, 0];
  // a station's side point at height u: its a + half-width interpolated from the waterline to the deck
  const side = (S, u) => { const k = Math.max(0, Math.min(1, u / Math.max(0.01, S.h))); return [S.aw + (S.a - S.aw) * k, S.bw + (S.b - S.bw) * k]; };
  const sides = { stbd: [], port: [] };
  for (const [u0, u1, role, bo] of bands) {
    for (let i = 0; i + 1 < st.length; i++) {
      const A = st[i], B = st[i + 1];
      const uA0 = u0 < 0 ? bot : Math.min(u0, A.h), uA1 = Math.min(u1 >= 99 ? A.h : u1, A.h), uB0 = u0 < 0 ? bot : Math.min(u0, B.h), uB1 = Math.min(u1 >= 99 ? B.h : u1, B.h);
      if (uA1 <= uA0 + 1e-3 && uB1 <= uB0 + 1e-3) continue;
      for (const sg of [1, -1]) {
        const [a0, w0] = side(A, uA0), [a1, w1] = side(B, uB0), [a2, w2] = side(B, uB1), [a3, w3] = side(A, uA1);
        const F = face(P, [ID(a0, uA0, sg * w0), ID(a1, uB0, sg * w1), ID(a2, uB1, sg * w2), ID(a3, uA1, sg * w3)], role, { out: inside, k: (bo && bo.k) || 0 });
        F.band = role; F.i = i; F.span = [A.a, B.a]; F.ub = [u0, u1];
        (sg > 0 ? sides.stbd : sides.port).push(F);
      }
    }
  }
  const deck = [];
  if (deckC) for (let i = 0; i + 1 < st.length; i++) { const A = st[i], B = st[i + 1]; deck.push(face(P, [ID(A.a, A.h, -A.b), ID(B.a, B.h, -B.b), ID(B.a, B.h, B.b), ID(A.a, A.h, A.b)], deckC, { n: [0, 1, 0] })); }
  const tr = [];
  if (o.transom !== false) {
    const A = st[0];
    for (const [u0, u1, role] of bands) {
      const v0 = u0 < 0 ? bot : Math.min(u0, A.h), v1 = Math.min(u1 >= 99 ? A.h : u1, A.h);
      if (v1 <= v0 + 1e-3) continue;
      const [a0, w0] = side(A, v0), [a1, w1] = side(A, v1);
      tr.push(face(P, [ID(a0, v0, -w0), ID(a0, v0, w0), ID(a1, v1, w1), ID(a1, v1, -w1)], role, { out: inside }));
    }
  }
  // the hull's surface at (a, u) on a side (sg +1 starboard, −1 port) + the face it lies on (a decal's: culled with it)
  const at = (a, u, sg) => {
    let i = 0; while (i + 2 < st.length && a > st[i + 1].a) i++;
    const A = st[i], B = st[i + 1], t = Math.max(0, Math.min(1, (a - A.a) / Math.max(1e-6, B.a - A.a))), L = (p, q) => p + (q - p) * t;
    const S = { a: L(A.a, B.a), aw: L(A.aw, B.aw), b: L(A.b, B.b), bw: L(A.bw, B.bw), h: L(A.h, B.h) }, [pa, w] = side(S, u);
    return [pa, u, sg * w];
  };
  const faceAt = (a, u, sg) => { const L = sg > 0 ? sides.stbd : sides.port; return L.find(F => a >= F.span[0] - 1e-6 && a <= F.span[1] + 1e-6 && (u >= (F.ub[0] < 0 ? -9 : F.ub[0]) && u <= F.ub[1])) || L[0]; };
  /** a decal on the hull's side: pts [[a,u]…] mapped onto its surface (o as dec's) */
  const decal = (sg, pts, c, o) => { const F = faceAt(pts[0][0], pts[0][1], sg); return dec(F, pts.map(([a, u]) => at(a, u, sg)), c, o); };
  return { sides, deck, transom: tr, side, at, faceAt, decal };
}
/** a line (a staff, a rail, a spar): pts [[a,u,s]…], c a role, w its width (world units; ≥ 0.5 device px) */
export function line(P, pts, c, w = 0.08) { P.lines.push({ p: pts, c, w }); }
/** a point the caller draws (a bulb, a running light): returned projected */
export function dotAt(P, p, kind, data = {}) { P.dots.push({ p, kind, ...data }); }
/** her name (or any word) painted on a face: o the centre of its baseline, ax the text's direction, ay its up (local unit vectors) */
export function text(P, F, str, o, ax, ay, size, c, font = '700 62px "Chakra Petch", system-ui, sans-serif') { P.texts.push({ F, str, o, ax, ay, size, c, font }); }

// ------------------------------------------------------------------ posing (world transform + projection + culling + the sort)
/**
 * Pose a mesh (an array of parts): V = { cam, X, Z (her centre's world place), hd, roll, pitch, c0 (the a of her centre), sun
 * ([x,y,z] toward the light, world), shK (the sun's shading strength), topK (the sky's light on the tops), pal (role → rgb),
 * flat (role → bool: unshaded) } → { list (parts in draw order, each with its projected faces / decals / lines), bounds,
 * P(a,u,s) (anchor-relative screen pt), W(a,u,s) (world), dir(v) (a local vector in world), seen(n, p) (a face's normal shows),
 * dots [{ x, y, kind, …, n, w (world) }] }. gain(role): a role's shading strength (×; black enamel catches the light harder).
 */
export function pose(parts, V) {
  const { cam, X, Z } = V, ca = Math.cos(V.hd), sa = Math.sin(V.hd), c0 = V.c0 || 0;
  const cr = Math.cos(V.roll || 0), sr = Math.sin(V.roll || 0), cp = Math.cos(V.pitch || 0), spp = Math.sin(V.pitch || 0);
  const F = cam.F, VPX = cam.VPX, VPY = cam.VPY, CAMH = cam.CAMH;
  const ax = VPX + F * X / Z, ay = VPY + F * (CAMH - LEVEL) / Z;
  // the pose as one matrix: local (a − c0, u, s) → the world offset (pitch about the beam, then roll about her length, then her heading)
  const m00 = ca * cp + sa * sr * spp, m01 = -ca * spp + sa * sr * cp, m02 = sa * cr;
  const m10 = spp * cr, m11 = cp * cr, m12 = -sr;
  const m20 = sa * cp - ca * sr * spp, m21 = -sa * spp - ca * sr * cp, m22 = -ca * cr;
  const W = (a, u, s) => { const A = a - c0; return [X + m00 * A + m01 * u + m02 * s, LEVEL + m10 * A + m11 * u + m12 * s, Z + m20 * A + m21 * u + m22 * s]; };
  const PJ = w => [VPX + F * w[0] / w[2] - ax, VPY + F * (CAMH - w[1]) / w[2] - ay];
  const P = (a, u, s) => PJ(W(a, u, s));
  const dir = v => [m00 * v[0] + m01 * v[1] + m02 * v[2], m10 * v[0] + m11 * v[1] + m12 * v[2], m20 * v[0] + m21 * v[1] + m22 * v[2]];
  const seen = (n, w) => n[0] * -w[0] + n[1] * (CAMH - w[1]) + n[2] * -w[2] > 0;
  const sun = V.sun || [0, 0.6, 0.4], ref = -sun[2];             // (a face turned to the camera, n = (0,0,−1): the colours as authored)
  const pal = V.pal, flatRole = V.flat || (() => false), shK = V.shK ?? 0.15, topK = V.topK ?? 0.08;
  const styles = new Map();
  const styleOf = (c, adj) => { const q = Math.round(adj * 50) / 50, key = c + '|' + q; let s = styles.get(key); if (s !== undefined) return s; const base = Array.isArray(c) ? c : pal(c); if (!base) { styles.set(key, null); return null; } const col = q ? shade(base, Math.max(-0.6, Math.min(0.6, q))) : base; s = base.length > 3 ? `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${base[3]})` : `rgb(${col[0] | 0},${col[1] | 0},${col[2] | 0})`; styles.set(key, s); return s; };
  const gain = V.gain || (() => 1);
  const shadeOf = (nx, ny, nz, k, c) => (flatRole(c) ? 0 : k + shK * gain(c) * (nx * sun[0] + ny * sun[1] + nz * sun[2] - ref) + topK * ny);
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  // project local points straight into a flat [x0, y0, x1, y1, …] (no per-vertex arrays), growing the bounds
  const flatL = (pts, grow) => {
    const q = new Array(pts.length * 2);
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], A = p[0] - c0, u = p[1], s = p[2];
      const wx = X + m00 * A + m01 * u + m02 * s, wy = LEVEL + m10 * A + m11 * u + m12 * s, wz = Z + m20 * A + m21 * u + m22 * s;
      const x = VPX + F * wx / wz - ax, y = VPY + F * (CAMH - wy) / wz - ay;
      q[2 * i] = x; q[2 * i + 1] = y;
      if (grow) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    return q;
  };
  const cen = pts => { let a = 0, u = 0, s = 0; for (const p of pts) { a += p[0]; u += p[1]; s += p[2]; } const n = pts.length || 1; return [a / n, u / n, s / n]; };
  const distL = c => { const w = W(c[0], c[1], c[2]); return Math.hypot(w[0], w[1] - CAMH, w[2]); };
  const out = [], dots = [];
  for (const pt of parts) {
    // (a part's centre + each face's, in its own coordinates: computed once, kept on the mesh)
    if (!pt._c) { const all = []; for (const f of pt.faces) { f._c = cen(f.p); all.push(...f.p); } for (const l of pt.lines) all.push(...l.p); pt._c = cen(all); }
    const pp = { id: pt.id, on: pt.on, last: pt.last, sort: pt.sort, vis: [], decs: [], lines: [], texts: [], d: distL(pt._c) - (pt.lift || 0) };
    for (const f of pt.faces) {
      const p0 = f.p[0], A = p0[0] - c0, u = p0[1], s = p0[2], n = f.n;
      let nx = m00 * n[0] + m01 * n[1] + m02 * n[2], ny = m10 * n[0] + m11 * n[1] + m12 * n[2], nz = m20 * n[0] + m21 * n[1] + m22 * n[2];
      const wx = X + m00 * A + m01 * u + m02 * s, wy = LEVEL + m10 * A + m11 * u + m12 * s, wz = Z + m20 * A + m21 * u + m22 * s;
      const show = nx * -wx + ny * (CAMH - wy) + nz * -wz > 0;
      if (!show && !f.two) continue;
      if (!show) { nx = -nx; ny = -ny; nz = -nz; }
      const st = styleOf(f.c, shadeOf(nx, ny, nz, f.k, f.c));
      if (!st) continue;
      pp.vis.push({ q: flatL(f.p, true), st, d: pt.sort ? distL(f._c) : 0, seam: !f.two && st.charCodeAt(3) !== 97 });   // ('rgba': no seam)
      for (const d of f.dec) { const st2 = styleOf(d.c, d.flat ? 0 : shadeOf(nx, ny, nz, f.k, d.c)); if (st2) pp.decs.push({ q: flatL(d.p, false), st: st2, w: d.w ? Math.max(0.3, d.w * F / wz) : 0, win: d.win }); }
    }
    for (const l of pt.lines) {
      const st = styleOf(l.c, 0); if (!st) continue;
      const w0 = W(l.p[0][0], l.p[0][1], l.p[0][2]);
      pp.lines.push({ q: flatL(l.p, true), st, w: Math.max(0.25, l.w * F / w0[2]) });
    }
    for (const t of pt.texts) {
      const n = dir(t.F.n), w0 = W(...t.o), v = [-w0[0], CAMH - w0[1], -w0[2]];
      if ((n[0] * v[0] + n[1] * v[1] + n[2] * v[2]) / Math.hypot(v[0], v[1], v[2]) < 0.25) continue;   // (turned away or edge-on: no name)
      const o = PJ(w0), Ap = PJ(W(t.o[0] + t.ax[0], t.o[1] + t.ax[1], t.o[2] + t.ax[2])), U = PJ(W(t.o[0] + t.ay[0], t.o[1] + t.ay[1], t.o[2] + t.ay[2]));
      const m = [(Ap[0] - o[0]) / 100, (Ap[1] - o[1]) / 100, (o[0] - U[0]) / 100, (o[1] - U[1]) / 100];
      const st = styleOf(t.c, 0); if (st) pp.texts.push({ o, m, str: t.str, size: t.size, st, font: t.font });
    }
    for (const d of pt.dots) { const w = W(d.p[0], d.p[1], d.p[2]), [x, y] = PJ(w); dots.push({ ...d, x, y, w, part: pt.id }); }
    if (pt.sort) pp.vis.sort((a, b) => b.d - a.d);
    out.push(pp);
  }
  // the order: far first; a part resting on another after it (its children wait for it); `last` parts at the very end
  const byD = out.filter(p => !p.last).sort((a, b) => b.d - a.d), ids = new Set(byD.map(p => p.id)), done = new Set(), wait = new Map(), list = [];
  const emit = p => { list.push(p); done.add(p.id); const w = wait.get(p.id); if (w) { wait.delete(p.id); for (const c of w) emit(c); } };
  for (const p of byD) { if (p.on && !done.has(p.on) && ids.has(p.on)) { if (!wait.has(p.on)) wait.set(p.on, []); wait.get(p.on).push(p); } else emit(p); }
  for (const w of wait.values()) for (const c of w) emit(c);
  for (const p of out) if (p.last) list.push(p);
  return { list, bounds: [x0, y0, x1, y1], P, W, dir, seen, dots, ax, ay };
}

/** paint a posed mesh: x (or { back, front, split: a part id — the parts drawn before it go to back, it + after to front }) —
 *  each context already set to the sprite's origin (anchor-relative pt). seam: the hairline that closes faces' AA gaps (pt). */
export function paint(x, posed, o = {}) {
  const seam = o.seam ?? 0.3;
  let ctx = o.back || x, front = o.front || x;
  for (const pp of posed.list) {
    if (o.split && pp.id === o.split) ctx = front;
    if (o.onPart && o.onPart[pp.id]) o.onPart[pp.id](ctx);
    if (pp.sort) for (const f of pp.vis) { poly(ctx, f.q); ctx.fillStyle = f.st; ctx.fill(); if (f.seam && seam) { ctx.strokeStyle = f.st; ctx.lineWidth = seam; ctx.stroke(); } }
    else {
      const g = new Map();
      for (const f of pp.vis) { let a = g.get(f.st); if (!a) g.set(f.st, a = { seam: f.seam, qs: [] }); a.qs.push(f.q); }
      for (const [st, a] of g) { ctx.beginPath(); for (const q of a.qs) sub2(ctx, q); ctx.fillStyle = st; ctx.fill(); if (a.seam && seam) { ctx.strokeStyle = st; ctx.lineWidth = seam; ctx.lineJoin = 'round'; ctx.stroke(); } }
    }
    if (pp.decs.length) {
      const g = new Map();
      for (const d of pp.decs) { const k = d.st + '|' + d.w; let a = g.get(k); if (!a) g.set(k, a = { st: d.st, w: d.w, qs: [] }); a.qs.push(d.q); }
      for (const a of g.values()) { ctx.beginPath(); for (const q of a.qs) sub2(ctx, q); if (a.w) { ctx.strokeStyle = a.st; ctx.lineWidth = a.w; ctx.stroke(); } else { ctx.fillStyle = a.st; ctx.fill(); } }
    }
    for (const t of pp.texts) { ctx.save(); ctx.transform(t.m[0], t.m[1], t.m[2], t.m[3], t.o[0], t.o[1]); ctx.fillStyle = t.st; ctx.font = t.font.replace('62px', `${(t.size * 100).toFixed(1)}px`); ctx.textAlign = 'center'; ctx.fillText(t.str, 0, 0); ctx.restore(); }
    if (pp.lines.length) {
      ctx.lineCap = 'round';
      for (const l of pp.lines) { ctx.beginPath(); ctx.moveTo(l.q[0], l.q[1]); for (let i = 2; i < l.q.length; i += 2) ctx.lineTo(l.q[i], l.q[i + 1]); ctx.strokeStyle = l.st; ctx.lineWidth = l.w; ctx.stroke(); }
    }
  }
}
function poly(c, q) { c.beginPath(); sub2(c, q); }
function sub2(c, q) { c.moveTo(q[0], q[1]); for (let i = 2; i < q.length; i += 2) c.lineTo(q[i], q[i + 1]); c.closePath(); }
/** the lit windows of a posed mesh as one path (anchor-relative): the blackout's dark glass, their glows */
export function windowsOf(posed) { const out = []; for (const pp of posed.list) for (const d of pp.decs) if (d.win) out.push(d.q); return out; }
