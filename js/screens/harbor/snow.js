// CITY 2.0 — PART 9b: THE SNOW ON THE CITY, BAKED (the stages: core/harbor-snow.js; the state: scene.js#snowTick). Judged unzoomed on
// the iPhone: big areas of white, clear silhouettes, light — no crust textures, no tiny drips on the ground.
//   capStep(o)              SNOW ON EVERY TOP: a layer's own silhouette shifted down + cut out of itself leaves the top band of every
//                           roof, setback, ledge, branch, lamp head, railing + sign box — filled with the snow's tone (GPU only: four
//                           draws on a scratch canvas, never a pixel read back). The far skyline gets a thin, hazy band.
//   groundSteps(L, T, SN)   THE PROMENADE under snow: the whole plaza + the inlay + the walks white (FRESH), off-white with wide
//                           darker FOOTPATHS worn along the walkers' routes (OLDER / BANKS), slushy + patchy (THAW), white PATCHES
//                           left in the shade (SPRING) — lit by the same lamp pools as the stones (warm pools glow on the snow), the
//                           speakeasy's lit shop front warming the snow before it at night; the plowed BANKS along the front curb.
//   roadStep(L, T, SN, mode) THE WATERSIDE ROAD: white with tyre tracks before the plow, then a clear dark wet lane + white kerb strips +
//                           the bank along the promenade's kerb (mode: 'white' | 'plowed'; thaw = slush; spring = the last piles).
//   speakStep(L, T, SN)     THE SPEAKEASY: snow on every sill, the belt course + the cornice, the AWNING heaped + sagging (its lip
//                           curling over the front edge) — the live slab sliding off is snowfx.js.
import { project, groundY } from '../../core/harbor-layout.js';
import { rgb, mix } from './shapes.js';
import { lightField } from '../../core/harbor-light.js';
import { safeCtx } from '../../ui/canvas-safe.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const cl = v => (v < 0 ? 0 : v > 255 ? 255 : v);
const addc = (c, l, k = 1) => [cl(c[0] + l[0] * k), cl(c[1] + l[1] * k), cl(c[2] + l[2] * k)];
const tri = (T, d, g, n) => [0, 1, 2].map(i => d[i] * (T.day || 0) + g[i] * (T.gold || 0) + n[i] * (T.night || 0));
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };

/** the snow's tones in this light: { snow (the lit top), shade (its shadow side), dirt (old, trodden, plowed), wet (slush) } — the
 *  stage's whiteness pulls the snow toward the dirt (fresh = 1: pure; the old pack ~0.7: grey) */
export function snowTones(T, SN) {
  const snow0 = tri(T, [246, 249, 255], [255, 228, 216], [128, 134, 182]);
  const shade = tri(T, [192, 206, 230], [196, 164, 190], [70, 72, 118]);
  const dirt = tri(T, [146, 138, 128], [142, 112, 106], [52, 48, 66]);
  const wet = tri(T, [96, 98, 106], [92, 76, 86], [26, 26, 40]);
  const w = SN ? clamp01(SN.white) : 1;
  return { snow: mix(dirt, snow0, 0.15 + 0.85 * w), shade: mix(dirt, shade, 0.25 + 0.75 * w), dirt, wet, pure: snow0 };
}

/** how much the stage lays on the tops (0..1): the caps' thickness + the props' hooks */
export const topsOf = SN => (!SN || SN.stage === 'none' ? 0 : { fresh: 1, older: 0.8, banks: 0.62, thaw: 0.38, spring: 0.08 }[SN.stage] * clamp01(0.35 + SN.cover));

// ------------------------------------------------------------------ THE CAPS
let scratch = null;
/** free the caps' scratch canvas (the scene calls it when the snow is gone) */
export const releaseSnow = () => { if (scratch) { scratch.width = scratch.height = 0; scratch = null; } };
/**
 * A bake step: the snow on every top of the layer baked so far. o: { pt (the band's thickness, pt), col ([r,g,b]), a (alpha), up (the
 * share of the band lifted above the edge: the snow sits ON the roof) }
 */
export function capStep(o) {
  return x => {
    const cv = x.canvas;
    if (!cv || !cv.width || !cv.height || !(o.pt > 0.05) || !(o.a > 0.01)) return;
    const w = cv.width, h = cv.height, m = x.getTransform ? x.getTransform().a : 2;
    const d = Math.max(1, Math.round(o.pt * m));
    if (!scratch) scratch = document.createElement('canvas');
    if (scratch.width < w || scratch.height < h) { scratch.width = Math.max(w, scratch.width); scratch.height = Math.max(h, scratch.height); }
    const s = safeCtx(scratch);
    s.setTransform(1, 0, 0, 1, 0, 0); s.globalAlpha = 1;
    s.globalCompositeOperation = 'source-over'; s.clearRect(0, 0, w, h); s.drawImage(cv, 0, 0);
    s.globalCompositeOperation = 'destination-out'; s.drawImage(cv, 0, d);          // (what has itself d px above it goes: the top bands stay)
    s.globalCompositeOperation = 'source-in'; s.fillStyle = rgb(o.col); s.fillRect(0, 0, w, h);
    s.globalCompositeOperation = 'source-over';
    x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = o.a;
    x.drawImage(scratch, 0, 0, w, h, 0, -Math.round(d * (o.up == null ? 0.45 : o.up)), w, h);
    x.restore();
  };
}
/** the caps for one group: how thick by the group's depth + the stage; far ones hazier */
export function capFor(group, T, SN) {
  const k = topsOf(SN);
  if (k <= 0.02) return null;
  const tn = snowTones(T, SN);
  const pt = { far: 0.9, near: 1.6, harbor: 1.4, road: 1.6, bill: 1.2, stage: 2.1, front: 2.6 }[group] || 1.4;
  const col = group === 'far' ? mix(tn.snow, T.haze || tn.snow, 0.35) : group === 'near' ? mix(tn.snow, T.haze || tn.snow, 0.12) : tn.snow;
  return capStep({ pt: pt * (0.55 + 0.45 * k), col, a: Math.min(1, 0.45 + 0.6 * k), up: group === 'far' ? 0.3 : 0.5 });
}

// ------------------------------------------------------------------ the noise (seeded, smooth: patches + drifts)
const h2 = (i, j) => { let n = (i * 374761393 + j * 668265263) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
function vnoise(x, y) {
  const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = h2(i, j), b = h2(i + 1, j), c = h2(i, j + 1), d = h2(i + 1, j + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
const fbm = (x, y) => 0.6 * vnoise(x, y) + 0.3 * vnoise(x * 2.1 + 7, y * 2.1 + 3) + 0.1 * vnoise(x * 4.3 + 1, y * 4.3 + 9);

/** PURE-ish: the walkers' worn routes on the promenade (0..1 at x, z) — 9c (the owner: "you can't really tell what that is"): WIDE
 *  trodden LANES along the routes people really take — the crossing → the speakeasy's door (the diagonal), along the railing, round the
 *  compass inlay, the front walk + the door's own short path. 1 = the lane's middle (the cobbles show through), soft at the edges. */
export function pathsOf(L) {
  const e = L.edge, ir = L.impliedRoad, on = L.impliedOn !== false;
  const zF = on ? e.z + e.curbW : ir.z0;
  const s = L.speakeasy, door = s ? s.x0 + (s.door.u0 + s.door.u1) / 2 : null, cw = L.crosswalk ? (L.crosswalk.x0 + L.crosswalk.x1) / 2 : null;
  const m = L.medallion || null;
  const band = (v, a, b, soft) => smooth(a - soft, a + soft, v) * (1 - smooth(b - soft, b + soft, v));
  // a lane along a segment (x0, z0) → (x1, z1), half-width hw, soft edge
  const seg = (x, z, x0, z0, x1, z1, hw, soft) => {
    const dx = x1 - x0, dz = z1 - z0, l2 = dx * dx + dz * dz, t = l2 ? Math.max(0, Math.min(1, ((x - x0) * dx + (z - z0) * dz) / l2)) : 0;
    const d = Math.hypot(x - (x0 + dx * t), z - (z0 + dz * t));
    return 1 - smooth(hw - soft, hw + soft, d);
  };
  return (x, z) => {
    const wob = 0.4 * (vnoise(x * 0.35, z * 0.35) - 0.5);
    let k = band(z + wob, zF + 0.5, zF + 3.3, 0.6);                    // the front walk
    k = Math.max(k, band(z + wob, 49.4, 51.8, 0.55));                   // along the railing (in front of the lamps + the trees)
    if (door != null) k = Math.max(k, band(x + wob, door - 1.1, door + 1.1, 0.45) * band(z, zF + 1, s.z0, 0.3));
    // the crossing → the door: the diagonal everyone takes off the crosswalk to the speakeasy
    if (cw != null && door != null) k = Math.max(k, seg(x + wob, z, cw, 53.6, door + 0.6, s.z0 + 1.2, 1.15, 0.55));
    if (cw != null) k = Math.max(k, band(x + wob, cw - 1.4, cw + 1.4, 0.5) * band(z, 49.5, 54.5, 0.3));
    // round the compass: a ring trodden just outside the inlay
    if (m) { const d = Math.hypot(x - m.x, (z - m.z) * 1.15); k = Math.max(k, band(d + wob * 0.6, m.r + 0.45, m.r + 2.0, 0.45)); }
    return k;
  };
}

// ------------------------------------------------------------------ THE GROUND
export function groundSteps(L, T, SN) {
  if (!SN || SN.stage === 'none') return [];
  const cam = L.cam, e = L.edge, ir = L.impliedRoad, on = L.impliedOn !== false;
  const zFront = on ? e.z + e.curbW : ir.z0, zBack = 54;
  const hw = z => cam.hw(z) * 1.04 + 1;
  const P = (x, z) => project(cam, x, 0, z);
  const tn = snowTones(T, SN), lightAt = lightField(L, T), path = pathsOf(L), night = T.night || 0;
  const st = SN.stage, cover = st === 'spring' ? SN.cover : Math.max(SN.cover, st === 'fresh' ? 0.55 : 0);
  const trod = mix(mix(tn.dirt, tn.wet, 0.5), [70, 56, 44], 0.25 * (1 - night)), slush = mix(tn.wet, tn.dirt, 0.35);   // (9c: darker, browner — the slush)
  const s = L.speakeasy, shopX = s ? s.x0 + (s.shop.win[0] + s.shop.win[1]) / 2 : null, doorX = s ? s.x0 + (s.door.u0 + s.door.u1) / 2 : null;
  // the shade: the last snow hangs on where the sun doesn't reach — along the speakeasy's foot, round the trees' feet
  const shadeK = (x, z) => {
    let k = 0;
    if (s && x > s.x0 - 1 && x < s.x1 + 1) k = Math.max(k, 1 - smooth(0, 4.5, s.z0 - z));
    for (const t of L.trees || []) k = Math.max(k, 1 - smooth(0.6, 2.6, Math.hypot(x - t.x, (z - t.z) * 1.4)));
    return k;
  };
  const DZ = 0.7, DX = 0.9, rows = [];
  for (let z = zFront, i = 0; z < zBack - 0.05; z += DZ, i++) rows.push([z, Math.min(zBack, z + DZ)]);
  const paint = (x, z0, z1) => {
    const zc = (z0 + z1) / 2, H = hw(z0);
    for (let wx = -H - (Math.floor(zc / DZ) % 2) * DX * 0.5; wx < H; wx += DX) {
      const xc = wx + DX / 2;
      // (the cell's screen box: the wider of its far + near edges — perspective skews it, so a plain far-left → near-right box gaps on the left)
      const [a1, ay] = P(wx - 0.08, z1 + 0.05), [b1] = P(wx + DX + 0.08, z1 + 0.05), [a0, by] = P(wx - 0.08, z0 - 0.05), [b0] = P(wx + DX + 0.08, z0 - 0.05);
      const ax = Math.min(a0, a1), bx = Math.max(b0, b1);
      if (bx < -2 || ax > cam.W + 2) continue;
      const n = fbm(xc * 0.32, zc * 0.45), sh = shadeK(xc, zc);
      let a = cover >= 0.97 ? 1 : smooth(1 - cover - 0.1, 1 - cover + 0.1, n + (st === 'spring' ? 0.35 * sh - 0.12 : 0.1 * sh));
      // (the doorman's shovelled path from the speakeasy's steps to the walk: bare, wet stone once he has been out — SN.door)
      if (SN.door && doorX != null) { const dk = Math.max(0, 1 - Math.abs(xc - doorX) / 1.1) * (zc > s.z0 - 3.4 && zc < s.z0 + 0.2 ? 1 : 0); if (dk > 0.25) { a *= 0.12; } }
      const pk = st === 'older' || st === 'banks' ? 0 : path(xc, zc) * (SN.paths || 0);   // (9c: older / banks → pathStrips)
      let c = mix(tn.shade, tn.snow, 0.62 + 0.38 * n);
      if (pk > 0.02) {
        if (st === 'fresh') c = mix(c, tn.shade, 0.55 * pk);                                   // (a few fresh tracks: a soft blue trough)
        else if (st === 'thaw' || st === 'spring') { c = mix(c, slush, pk); a *= 1 - 0.75 * pk; }   // (the walks go bare + wet first)
        else c = mix(c, trod, Math.min(1, 1.1 * pk));
      }
      if (st === 'thaw') c = mix(c, slush, 0.25 * (1 - n));
      const lt = lightAt ? lightAt(xc, zc) : null;
      if (lt) c = addc(c, lt, 0.5);
      // (the barbershop's lit window warms the snow before it at night)
      if (shopX != null && night > 0.05) { const g = night * (1 - smooth(0.6, 3.6, Math.hypot((xc - shopX) * 0.55, (s.z0 - zc) * 1.1))); if (g > 0.01) c = addc(c, [120, 70, 20], 0.55 * g); }
      if (a < 0.02) continue;
      x.fillStyle = rgb(c, Math.min(1, a));
      if (a >= 0.97) x.fillRect(ax, ay, bx - ax, by - ay);
      else { const rx = (bx - ax) * (0.4 + 0.25 * a), ry = (by - ay) * (0.45 + 0.3 * a); x.beginPath(); x.ellipse((ax + bx) / 2, (ay + by) / 2, rx, ry, 0, 0, Math.PI * 2); x.fill(); }
    }
  };
  const steps = [];
  for (let i = 0; i < rows.length; i += 6) { const part = rows.slice(i, i + 6); steps.push(x => { for (const [z0, z1] of part) paint(x, z0, z1); }); }
  if ((st === 'older' || st === 'banks') && (SN.paths || 0) > 0.05) steps.push(x => pathStrips(x, L, tn, T, lightAt, Math.min(1, SN.paths)));
  // THE BANKS along the front curb (the street under the dock's plow piles it up): lumpy grey-brown mounds on the gutter, in front of
  // the curb's face; the last dirty piles in spring
  // + THE BANK along the back kerb (the waterside road's plow throws it onto the plaza's back edge — the biggest, the longest-lasting)
  const bk = Math.max(SN.banks, st === 'older' || st === 'banks' ? 0.55 : 0);   // (9c: the plows have been by on every older pack)
  const gaps = L.crosswalk ? [[L.crosswalk.x0 - 0.5, L.crosswalk.x1 + 0.5], [L.crosswalk.x0 - 1.4 - 1.2, L.crosswalk.x0 - 1.4 + 1.0]] : [];   // (the crossing + the bus door: core/harbor-people.js#busStopX)
  if (bk > 0.05) steps.push(x => bankRow(x, cam, 53.75, hw(53.75), bk, tn, T, 377, gaps, st));
  if (on && bk > 0.05) steps.push(x => bankRow(x, cam, e.z - 0.35, hw(e.z), bk * 0.55, tn, T, 911, [], st));
  return steps;
}

/** PURE-ish: the worn routes as world polylines [{ pts: [[x, z], …], hw (half-width) }] — 9c: the crossing → the speakeasy's door, along
 *  the railing, round the compass, the front walk, the door's own short path, the crosswalk's landing (what pathsOf describes) */
export function pathRoutes(L) {
  const e = L.edge, ir = L.impliedRoad, on = L.impliedOn !== false, cam = L.cam;
  const zF = on ? e.z + e.curbW : ir.z0, H = cam.hw(zF) * 1.05 + 2;
  const s = L.speakeasy, door = s ? s.x0 + (s.door.u0 + s.door.u1) / 2 : null, cw = L.crosswalk ? (L.crosswalk.x0 + L.crosswalk.x1) / 2 : null, m = L.medallion;
  const line = (x0, x1, z, amp, seed) => { const pts = []; for (let x = x0; x <= x1 + 0.01; x += 0.6) pts.push([x, z + amp * (vnoise(x * 0.18 + seed, seed) - 0.5)]); return pts; };
  const out = [{ pts: line(-H, H, zF + 1.9, 0.7, 3), hw: 1.35 }, { pts: line(-cam.hw(50.6) * 1.05 - 2, cam.hw(50.6) * 1.05 + 2, 50.7, 0.6, 11), hw: 1.15 }];
  if (door != null) out.push({ pts: [[door, zF + 1.2], [door + 0.15, s.z0 - 0.2]], hw: 1.05 });
  if (cw != null && door != null) { const pts = []; for (let i = 0; i <= 14; i++) { const t = i / 14, bow = Math.sin(t * Math.PI) * 0.9; pts.push([cw + (door + 0.6 - cw) * t, 53.7 + (s.z0 + 1.0 - 53.7) * t - bow]); } out.push({ pts, hw: 1.1 }); }
  if (cw != null) out.push({ pts: [[cw, 49.6], [cw, 54.2]], hw: 1.3 });
  if (m) { const pts = [], R = m.r + 1.2; for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI * 2; pts.push([m.x + Math.cos(a) * R, m.z + Math.sin(a) * R / 1.15]); } out.push({ pts, hw: 0.75 }); }
  return out;
}
/** the worn lanes on an older pack (9c — the owner: "you can't really tell what that is"): smooth strips in perspective — a soft trodden
 *  edge, the packed grey-brown slush, and a dark wet CORE where the feet have worn through to the cobbles; lit by the lamp pools */
function pathStrips(x, L, tn, T, lightAt, k) {
  const cam = L.cam, night = T.night || 0;
  const trod = mix(mix(tn.dirt, tn.wet, 0.45), [86, 70, 56], 0.3 * (1 - night)), edge = mix(trod, tn.shade, 0.45);
  const core = mix(mix(tn.wet, [58, 46, 40], 0.35 * (1 - night)), [0, 0, 0], 0.1);
  const routes = pathRoutes(L);
  const quad = (pts, i, hw) => {
    const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz) || 1, nx = -dz / l * hw, nz = dx / l * hw;
    const a = project(cam, x0 + nx, 0, z0 + nz), b = project(cam, x1 + nx, 0, z1 + nz), c = project(cam, x1 - nx, 0, z1 - nz), d = project(cam, x0 - nx, 0, z0 - nz);
    x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.lineTo(c[0], c[1]); x.lineTo(d[0], d[1]); x.closePath(); x.fill();
  };
  // (three passes over every route — the soft edge, the lane, the worn core — so crossings merge into one trodden floor)
  for (const [m, col, al] of [[1.45, edge, 0.38 * k], [1, trod, 0.82 * k], [0.48, core, 0.7 * k]]) {
    for (const r of routes) for (let i = 0; i < r.pts.length - 1; i++) {
      const [xc, zc] = r.pts[i];
      if (zc < 36 || zc > 54.4) continue;
      let c = col; const lt = lightAt ? lightAt(xc, zc) : null; if (lt) c = addc(c, lt, m === 0.48 ? 0.3 : 0.42);
      x.fillStyle = rgb(c, al); quad(r.pts, i, r.hw * m * 1.02);
    }
  }
}

/** a row of plowed-snow mounds along z (world): 9c — BIG (k 0.5 ≈ knee-high, 1 ≈ waist-high on a person), lumpy; dirty grey-brown sides
 *  streaked with darker grit, a whiter crust on top, a dark wet foot; cut open at the gaps ([[x0, x1], …] world: the crossing, the bus
 *  door) with a sloped end either side */
function bankRow(x, cam, z, H, k, tn, T, seed, gaps = [], st = 'banks') {
  const night = T.night || 0, spring = st === 'spring', thaw = st === 'thaw';
  const dirty = mix(tn.dirt, [92, 80, 66], 0.35 * (1 - night)), crust = mix(tn.snow, tn.dirt, spring ? 0.55 : thaw ? 0.35 : 0.12);
  const body = mix(dirty, tn.shade, 0.25), dark = mix(dirty, [0, 0, 0], 0.35), hmax = (0.7 + 0.9 * k) * (spring ? 0.55 : thaw ? 0.8 : 1);
  const step = 0.35, pts = [];
  const cutAt = wx => { let c = 0; for (const [g0, g1] of gaps) c = Math.max(c, smooth(g0 - 0.9, g0 + 0.2, wx) * (1 - smooth(g1 - 0.2, g1 + 0.9, wx))); return c; };
  for (let wx = -H - 1; wx <= H + 1; wx += step) {
    const n = 0.62 * vnoise(wx * 0.33 + seed, seed * 0.1) + 0.38 * vnoise(wx * 1.1 + seed * 2, 3.7);
    const h = hmax * (0.55 + 0.45 * n) * (1 - cutAt(wx));
    pts.push([wx, h]);
  }
  const P = (wx, h, dz = 0) => project(cam, wx, h, z + dz);
  const [, yb] = P(0, 0, 0.35);
  // the dark wet foot (the meltwater + the shadow where the mound meets the ground)
  x.fillStyle = rgb(mix(tn.wet, [0, 0, 0], 0.3), 0.55);
  x.beginPath(); pts.forEach(([wx, h], i) => { const [px, py] = P(wx, 0, 0.45), [, py2] = P(wx, h > 0.02 ? 0.12 : 0, 0.45); if (i) x.lineTo(px, py2); else x.moveTo(px, py2); }); for (let i = pts.length - 1; i >= 0; i--) { const [px, py] = P(pts[i][0], 0, 0.5); x.lineTo(px, py); } x.closePath(); x.fill();
  // the body: dirty grey-brown, darker toward the foot
  const sp = pts.map(([wx, h]) => P(wx, h));
  const yTop = Math.min(...sp.map(p => p[1]));
  const g = x.createLinearGradient(0, yTop, 0, yb);
  g.addColorStop(0, rgb(body)); g.addColorStop(1, rgb(dark));
  x.fillStyle = g; x.beginPath(); x.moveTo(sp[0][0], yb);
  for (const p of sp) x.lineTo(p[0], p[1]);
  x.lineTo(sp[sp.length - 1][0], yb); x.closePath(); x.fill();
  // the GRIT: darker streaks down the sides (the road's dirt the plow threw up), seeded
  x.save(); x.clip();
  x.strokeStyle = rgb(mix(dark, [40, 32, 26], 0.4), 0.55); x.lineCap = 'round';
  for (let i = 0; i < pts.length; i += 2) {
    const [wx, h] = pts[i]; if (h < 0.15) continue;
    const r = vnoise(wx * 3.1 + seed, 9.3); if (r < 0.42) continue;
    const [px, py] = P(wx + (r - 0.5) * 0.3, h * (0.45 + 0.3 * r)), [, py1] = P(wx, h * 0.05);
    x.lineWidth = Math.max(0.6, cam.F * (0.05 + 0.06 * r) / z); x.beginPath(); x.moveTo(px, py); x.lineTo(px + (r - 0.6) * 2, py1); x.stroke();
  }
  x.restore();
  // the CRUST: the upper part of the mound white (the snow on top), its lower edge lumpy where it meets the dirty side
  x.fillStyle = rgb(crust); x.beginPath();
  sp.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])));
  for (let i = pts.length - 1; i >= 0; i--) { const [wx, h] = pts[i], d = 0.3 + 0.22 * vnoise(wx * 0.9 + seed * 3, 5.1); const p = P(wx, Math.max(0, h * (1 - d))); x.lineTo(p[0], p[1]); }
  x.closePath(); x.fill();
  const lw = Math.max(1.4, cam.F * 0.2 / z);
  x.strokeStyle = rgb(crust); x.lineWidth = lw; x.lineJoin = 'round'; x.lineCap = 'round';
  x.beginPath(); let on = false;
  sp.forEach((p, i) => { if (pts[i][1] < 0.12) { on = false; return; } if (on) x.lineTo(p[0], p[1] + lw * 0.35); else { x.moveTo(p[0], p[1] + lw * 0.35); on = true; } }); x.stroke();
  // (its light: a bright rim along the very top toward the sky)
  x.strokeStyle = rgb(mix(crust, [255, 255, 255], 0.35 * (1 - night)), 0.8); x.lineWidth = Math.max(0.7, lw * 0.35);
  x.beginPath(); on = false;
  sp.forEach((p, i) => { if (pts[i][1] < 0.12) { on = false; return; } if (on) x.lineTo(p[0], p[1] + lw * 0.1); else { x.moveTo(p[0], p[1] + lw * 0.1); on = true; } }); x.stroke();
}

// ------------------------------------------------------------------ THE WATERSIDE ROAD
/** mode: 'white' (before the plow: the road white, tyre tracks) | 'plowed' (a clear dark wet lane, white kerb strips) */
export function roadStep(L, T, SN, mode = 'plowed') {
  if (!SN || SN.stage === 'none' || !L.road) return null;
  return x => {
    const cam = L.cam, r = L.road, tn = snowTones(T, SN), W = cam.W;
    const yRail = groundY(cam, r.z1), yCurb = groundY(cam, r.z0), Y = z => groundY(cam, z);
    const st = SN.stage;
    if (mode === 'white' && st !== 'spring' && st !== 'thaw') {
      x.fillStyle = rgb(mix(tn.shade, tn.snow, 0.7)); x.fillRect(0, yRail, W, yCurb - yRail);
      // the tyres' tracks: two soft grey lines per lane
      const lanes = [(r.z0 + r.lane) / 2, (r.lane + r.z1) / 2];
      x.fillStyle = rgb(mix(tn.shade, tn.dirt, 0.4), 0.8);
      for (const zc of lanes) for (const dz of [-0.55, 0.55]) { const y = Y(zc + dz), t = Math.max(0.6, cam.F * 0.22 / zc); x.fillRect(0, y - t / 2, W, t); }
    } else {
      // the plowed + salted lane: the asphalt darker + wet (a gloss band), the kerb strips white / slushy
      // (9c: BLACK + WET beside the banks — "the plow piled this" reads from the contrast: white mounds, a black cleared road)
      const lane = mix(T.road, [10, 10, 14], st === 'older' || st === 'banks' || st === 'fresh' ? 0.55 : 0.3), gloss = mix(tn.wet, [255, 255, 255], 0.22);
      x.fillStyle = rgb(lane, 0.8); x.fillRect(0, yRail, W, yCurb - yRail);
      x.fillStyle = rgb(gloss, 0.32); x.fillRect(0, Y((r.z0 + r.lane) / 2 + 0.4), W, Math.max(0.8, (yCurb - yRail) * 0.12));
      x.fillStyle = rgb(gloss, 0.22); x.fillRect(0, Y((r.lane + r.z1) / 2 + 0.4), W, Math.max(0.6, (yCurb - yRail) * 0.08));
      const edge = st === 'thaw' || st === 'spring' ? mix(tn.wet, tn.dirt, 0.5) : mix(tn.dirt, tn.snow, 0.6);
      const a = st === 'spring' ? 0.35 : 0.95;
      x.fillStyle = rgb(edge, a); x.fillRect(0, Y(r.z0 + 0.9), W, yCurb - Y(r.z0 + 0.9));     // (the near kerb's strip)
      x.fillStyle = rgb(edge, a * 0.9); x.fillRect(0, yRail, W, Y(r.z1 - 0.7) - yRail);      // (the far kerb's)
    }
    // the bank along the promenade's kerb (visible over the plaza's back edge)
  };
}

/** the live plowed lane behind the plow (snowfx draws it while it passes): the same look as roadStep's plowed lane, x0 → x1 on screen */
export function plowedStrip(c, L, T, SN, x0, x1) {
  const cam = L.cam, r = L.road, tn = snowTones(T, SN), Y = z => groundY(cam, z);
  const a = Math.min(x0, x1), w = Math.abs(x1 - x0);
  const ya = Y(r.z1 - 0.7), yb = Y(r.z0 + 0.9);
  c.fillStyle = rgb(mix(T.road, [0, 0, 0], 0.08)); c.fillRect(a, ya, w, yb - ya);
  c.fillStyle = rgb(mix(tn.wet, [255, 255, 255], 0.12), 0.28); c.fillRect(a, Y((r.z0 + r.lane) / 2 + 0.4), w, Math.max(0.8, (yb - ya) * 0.12));
}

// ------------------------------------------------------------------ THE SPEAKEASY
/** the awning's snow as world points (the scene's slab slides off its front edge): { u0, u1, yW (at the wall), yF (the front edge), zF } */
export const awningSnow = s => ({ u0: s.awning.u0, u1: s.awning.u1, yW: s.awning.y0, yF: s.awning.y1, zF: s.awning.z });

export function speakStep(L, T, SN) {
  const k = topsOf(SN);
  if (k <= 0.05 || !L.speakeasy) return null;
  return x => {
    const cam = L.cam, s = L.speakeasy, tn = snowTones(T, SN), night = T.night || 0;
    const z0 = s.z0 - 0.04, P = (u, v, z = z0) => project(cam, s.x0 + u, v, z);
    const warm = night > 0.05 ? addc(tn.snow, [70, 42, 10], 0.6 * night) : tn.snow;
    const th = 0.16 * (0.5 + 0.7 * k);                                  // (the snow's depth on a ledge, world units)
    // a pillow along a ledge: u0 → u1 at height v (overhanging a little each end), its top rounded up by th
    const ledge = (u0, u1, v, col, deep = th) => {
      const [ax, ay] = P(u0 - 0.08, v), [bx, by] = P(u1 + 0.08, v), t = (ay - P(u0, v + deep)[1]);
      x.fillStyle = rgb(col); x.beginPath(); x.moveTo(ax, ay + t * 0.35);
      x.quadraticCurveTo(ax + 0.15 * (bx - ax), ay - t * 1.05, (ax + bx) / 2, ay - t);
      x.quadraticCurveTo(ax + 0.85 * (bx - ax), by - t * 1.05, bx, by + t * 0.35);
      x.closePath(); x.fill();
      x.fillStyle = rgb(tn.shade, 0.55); x.fillRect(ax, ay, bx - ax, Math.max(0.5, t * 0.3));   // (its shaded front lip)
    };
    // the windows' sills (warm under the lit rooms at night) + the shop window's
    for (const [u0, u1] of s.windows) for (const [v0] of s.rows) ledge(u0, u1, v0, warm);
    ledge(s.shop.win[0], s.shop.win[1], s.shop.win[2], warm, th * 0.7);
    // the belt course + the cornice: a line of snow across the whole front
    const W0 = -0.4, W1 = 11.2;
    ledge(W0, W1, 4.3, tn.snow, th * 0.8);
    ledge(W0, W1, 10.5, tn.snow, th * 1.1);
    // THE AWNING: its slope heaped with snow, sagging in the middle, the lip curling over the front edge
    const a = awningSnow(s), sag = 0.1 * k, deep = th * 1.6;
    const wall0 = P(a.u0, a.yW + deep * 0.6), wall1 = P(a.u1, a.yW + deep * 0.6);
    const f0 = P(a.u0 - 0.06, a.yF + deep, a.zF - 0.05), f1 = P(a.u1 + 0.06, a.yF + deep, a.zF - 0.05), fm = P((a.u0 + a.u1) / 2, a.yF + deep - sag, a.zF - 0.05);
    const lip0 = P(a.u0 - 0.06, a.yF - deep * 0.35, a.zF - 0.08), lip1 = P(a.u1 + 0.06, a.yF - deep * 0.35, a.zF - 0.08), lipm = P((a.u0 + a.u1) / 2, a.yF - deep * 0.35 - sag * 1.4, a.zF - 0.08);
    x.fillStyle = rgb(mix(tn.shade, tn.snow, 0.8)); x.beginPath();
    x.moveTo(wall0[0], wall0[1]); x.lineTo(wall1[0], wall1[1]); x.lineTo(f1[0], f1[1]);
    x.quadraticCurveTo(2 * fm[0] - (f0[0] + f1[0]) / 2, 2 * fm[1] - (f0[1] + f1[1]) / 2, f0[0], f0[1]); x.closePath(); x.fill();
    // the lip over the front edge (the brightest: it faces us + catches the lamps)
    x.fillStyle = rgb(warm); x.beginPath(); x.moveTo(f0[0], f0[1]);
    x.quadraticCurveTo(2 * fm[0] - (f0[0] + f1[0]) / 2, 2 * fm[1] - (f0[1] + f1[1]) / 2, f1[0], f1[1]);
    x.lineTo(lip1[0], lip1[1]); x.quadraticCurveTo(2 * lipm[0] - (lip0[0] + lip1[0]) / 2, 2 * lipm[1] - (lip0[1] + lip1[1]) / 2, lip0[0], lip0[1]); x.closePath(); x.fill();
  };
}
