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
// THE DAY PASS — the day's colours, richer (the day channel only: golden hour, dusk and the night keep theirs): the stone a touch
// more saturated and, near, warmed by the sun; the sunlit side bright and warm; the SHADE cool and blue (the sky lights it); the
// far ones dissolve into a paler, bluer haze (aerial perspective) — the near ones stay warm, darker and crisp
const SUN_WARM = [255, 226, 178], SKY_SHADE = [62, 76, 142], OVC_GREY = [164, 170, 182], OVC_SHADE = [104, 112, 132];
// (DT2 — the owner: "push the 3D further at phone size": the lit side warmer + brighter, the shade deeper + bluer, the near ones richer;
// SP: one more step — the sunlit side a touch brighter, the shade a touch deeper + cooler)
const sat = (c, k) => { const l = (c[0] + c[1] + c[2]) / 3; return c.map(v => Math.max(0, Math.min(255, l + (v - l) * k))); };
export function faces(T, mat, z) {
  const m = MAT[mat] || MAT.lime, fz = fog(z);
  const hz = c => mix(c, T.haze, fz * (T.night > 0.5 ? 0.62 : 0.7 + 0.22 * T.day));
  const near = 1 - Math.min(1, fz * 2.2);
  const dFront = shade(mix(sat(m.d, 1.32 + 0.12 * near), SUN_WARM, 0.15 * near), -0.1 * Math.abs(T.sunDir || 0)), dLit = shade(mix(sat(m.l, 1.24), SUN_WARM, 0.34), 0.13), dDark = shade(mix(sat(m.s, 1.14), SKY_SHADE, 0.54), -0.27);
  // (SP — OVERCAST by day: the faces converge on a soft cool grey — the material still reads, muted; the sides barely differ)
  const ov = T.ovc || 0, flat = ov ? mix(sat(m.d, 0.78), OVC_GREY, 0.22) : null;
  const dF = ov ? mix(dFront, flat, ov) : dFront, dL = ov ? mix(dLit, shade(flat, 0.05), ov) : dLit, dD = ov ? mix(dDark, shade(mix(flat, OVC_SHADE, 0.2), -0.1), ov) : dDark;
  const front = lerp3(T, dF, mix(m.d, DUSK, 0.5).map(v => v * 0.82), m.n);
  const lit = lerp3(T, dL, mix(m.l, SUNLIT, 0.55), m.ns);
  const dark = lerp3(T, dD, mix(m.s, [84, 58, 98], 0.5), m.ns.map(v => v * 0.85));
  const trim = lerp3(T, mix(m.t, [255, 246, 226], 0.2), mix(m.t, SUNLIT, 0.4), m.n.map(v => v * 1.25));
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
/** NEON PASS 4 (the owner: the wheel reads clean WITHOUT a veil): is this building one of the quiet office blocks right behind the
 *  wheel — further away than the wheel, its middle inside the wheel's disc, its top above the hub (cam.wheelQuiet: scene.js) */
export function behindWheel(cam, b) {
  const w = cam.wheelQuiet;
  if (!w || b.z0 <= w.z + 4) return false;
  const [a, ty] = project(cam, b.x0, (b.y0 || 0) + b.h, b.z0), [c] = project(cam, b.x1, 0, b.z0), mx = (a + c) / 2;
  return Math.abs(mx - w.x) < w.r * 0.82 && ty < w.y + w.r * 0.2;
}
/**
 * NEON PASS 6 (the owner: the buildings behind the wheel "read as a dark blob at phone size"): at night each of them is lifted a
 * step to a DUSKY VIOLET-BLUE (still darker than the wheel), each its own tone so they separate. → the faces, tinted.
 */
const BW_TONES = [[60, 54, 108], [52, 56, 106], [68, 56, 112], [56, 50, 98], [64, 60, 116]];
function wheelBackdrop(F, T, seed) {
  const k = 0.62 * T.night, tone = BW_TONES[Math.floor(winHash(seed, 7, 7, 7, 7) * BW_TONES.length) % BW_TONES.length];
  const tint = (c, d) => mix(c, shade(tone, d), k);
  return { ...F, front: tint(F.front, 0), lit: tint(F.lit, -0.1), dark: tint(F.dark, -0.2), trim: tint(F.trim, 0.12) };
}
const FLOOD_C = [255, 186, 120];
/** DT1: the floodlights' strength (the darkness's flood ramp, scene.js#lookTones — they fade up through the blue hour); the tone
 *  weights only where no scene passed it (tests, previews) */
export const floodK = T => (T.flood != null ? T.flood : T.night);
/** DT1 — the blocks standing right behind the lighthouse (the wall it pops against): cam.lhWall = { x, ty, hw, z } (scene.js) */
export function behindLighthouse(cam, b) {
  const l = cam.lhWall;
  if (!l || !(b.z0 > l.z) || (b.band !== 'near' && b.band !== 'mid')) return false;
  const [a, ty] = project(cam, b.x0, (b.y0 || 0) + b.h, b.z0), [c] = project(cam, b.x1, 0, b.z0);
  return c > l.x - l.hw && a < l.x + l.hw && ty < l.ty + 120 * cam.F / 600;
}
/**
 * DT1 — THE UPLIT LANDMARKS (the owner handed us the picks: "uplit facades on 2–4 mid-distance buildings, so the skyline reads in
 * layers"): warm / cool uplights washing up the shafts of the EMPIRE (cool white, its crown's floodlight's colour), the SUNBURST
 * (gold) and the right edge's middle-tier tower (warm) — each standing in front of the darker far towers. Softer than the wheel's
 * backdrop (the wheel stays the focal point).
 */
const UPLIT = { empire: [226, 232, 255], sunburst: [255, 204, 136], 'm-right': [255, 210, 160] };
/** a wash of light up a face from its foot, in a colour (the floodWash's shape, its own colour + strength) */
function upWash(x, cam, b, a, w, ty, h, s, k, col, frac = 0.88, tower = null) {
  const topY = tower ? (() => { const t = tower.tiers[tower.tiers.length - 1]; return t.y0 + t.h; })() : (b.y0 || 0) + b.h;
  // (from the VISIBLE foot: the ground floor + its storefront strip at the water hide the real one — waterfront.js STOREY)
  const foot = project(cam, 0, Math.min(3.6, topY * 0.3), b.z0)[1], top = project(cam, 0, topY, b.z0)[1], up = Math.max(18 * s, (foot - top) * frac);
  if (foot - up >= ty + h) return;
  const g = x.createLinearGradient(0, foot, 0, foot - up);
  g.addColorStop(0, rgb(col, 0.42 * k)); g.addColorStop(0.45, rgb(col, 0.22 * k)); g.addColorStop(0.8, rgb(col, 0.06 * k)); g.addColorStop(1, rgb(col, 0));
  x.fillStyle = g; x.fillRect(a, ty, w, h);
}
function floodWash(x, cam, b, a, w, ty, h, s, k, tower) {
  // (the feet stand behind the near band + the quay: the light is scaled to the building's whole height — the part we see
  // above the roofs in front still catches it, the top ~15 % sinks into the night)
  const topY = tower ? (() => { const t = tower.tiers[tower.tiers.length - 1]; return t.y0 + t.h; })() : (b.y0 || 0) + b.h;
  const foot = project(cam, 0, 0, b.z0)[1], top = project(cam, 0, topY, b.z0)[1], up = Math.max(27 * s, (foot - top) * 0.88);
  if (foot - up >= ty + h) return;
  const g = x.createLinearGradient(0, foot, 0, foot - up);
  g.addColorStop(0, rgb(FLOOD_C, 0.62 * k)); g.addColorStop(0.45, rgb(FLOOD_C, 0.36 * k)); g.addColorStop(0.8, rgb(FLOOD_C, 0.1 * k)); g.addColorStop(1, rgb(FLOOD_C, 0));
  x.fillStyle = g; x.fillRect(a, ty, w, h);
}
/** 9e — THE CONSTRUCTION SLOT's FRAME (core/harbor-tower.js: rising / topping out): a steel skeleton — the columns at every bay, the floor
 *  beams, cross-bracing now + then; the lower floors CLAD in raw concrete (the cladding follows the frame up), the top ones open to the
 *  sky. Dark rust-brown steel by day, a near-black silhouette at night. Phone size: a clear lattice, no rivets. */
function worksBlock(x, cam, b, T) {
  const y0 = b.y0 || 0, y1 = y0 + b.h, [a, ty] = P(cam, b.x0, y1, b.z0), [c, by] = P(cam, b.x1, y0, b.z0), w = c - a, h = by - ty, s = cam.F / b.z0;
  if (w <= 0.2 || h <= 0.2) return;
  const night = T.night || 0, steel = night > 0.5 ? [26, 24, 32] : [96, 62, 46], clad = night > 0.5 ? [40, 40, 50] : [176, 170, 160];
  const cladTo = by - h * 0.62;   // (the concrete reaches ~62 % up the frame: the top floors are bare steel)
  x.fillStyle = rgb(mix(clad, [120, 120, 130], 0.2 * night)); x.fillRect(a, cladTo, w, by - cladTo);
  x.fillStyle = night > 0.5 ? 'rgba(10,10,16,0.55)' : 'rgba(70,64,60,0.35)';
  for (let yy = by - 3 * s; yy > cladTo; yy -= 3 * s) x.fillRect(a + 0.5, yy - 1.1 * s, w - 1, 1.1 * s);   // (the window openings, dark)
  x.strokeStyle = rgb(steel); x.lineWidth = Math.max(0.7, 0.32 * s);
  const bays = Math.max(3, Math.round(w / (2.3 * s))), floors = Math.max(2, Math.round(h / (3 * s)));
  x.beginPath();
  for (let i = 0; i <= bays; i++) { const xx = a + w * i / bays; x.moveTo(xx, ty); x.lineTo(xx, by); }
  for (let j = 0; j <= floors; j++) { const yy = by - h * j / floors; x.moveTo(a, yy); x.lineTo(c, yy); }
  x.stroke();
  x.lineWidth = Math.max(0.5, 0.18 * s); x.beginPath();
  for (let j = 0; j < floors; j++) { if (j % 3) continue; const yA = by - h * j / floors, yB = by - h * (j + 1) / floors; x.moveTo(a, yA); x.lineTo(a + w / bays, yB); x.moveTo(c, yA); x.lineTo(c - w / bays, yB); }
  x.stroke();
}
export function skyBlock(x, cam, b, T, o = {}) {
  if (b.works === 'frame') { worksBlock(x, cam, b, T); return; }
  // (the quiet blocks behind the wheel: a touch further back in the haze — lower contrast, never blurred; NEON PASS 6: lifted to a
  // dusky violet-blue, each its own tone; THE DAY PASS: floodlit from their feet, the owner's pick d — floodWash)
  const bw = behindWheel(cam, b);
  const y0 = b.y0 || 0, y1 = y0 + b.h, s = cam.F / b.z0;
  // (THE DAY PASS: by day only a little further back — a full +150 washed them out to a pale grey; the night keeps +150)
  let F = faces(T, b.mat, bw ? b.z0 + 150 - 100 * T.day : b.z0);
  if (bw && T.night > 0.05) F = wheelBackdrop(F, T, b.seed);
  const glass = b.mat === 'glass';
  // ---- the side face the camera sees (the one turned to the middle), lit or in shade by the real sun
  // (THE DAY PASS: the sun's side is continuous by day — a noon sun lights its side a little less than a low one; ±1 / 0 at night as before)
  const sdA = Math.abs(T.sunDir || 0), sideK = 0.5 + 0.5 * sdA + T.day * 0.25 * (1 - sdA);
  // (7a — THE RETURNS IN SHADE, the near blocks by day: a side face turned to a high sun only grazes the light — it reads a step
  // darker than the front, so the block reads as a volume, not a pale slab; a low sun (|side| → 1) lights it fully as before)
  const nearDay = T.day > 0.05 && s > 1.3 && !glass && (b.band === 'near' || o.rank === 'quay');
  const sideOf = right => {
    const old = T.sunDir === 0 ? mix(F.lit, F.dark, 0.5) : mix(mix(F.lit, F.dark, 0.5), (right ? T.sunDir > 0 : T.sunDir < 0) ? F.lit : F.dark, sideK);
    if (!nearDay) return old;
    const toSun = right ? T.sunDir > 0 : T.sunDir < 0, ret = toSun ? mix(mix(F.front, F.dark, 0.45), F.lit, sm01(0.5, 1, sdA)) : mix(F.dark, shade(F.dark, -0.06), 0.5);
    return mix(old, ret, T.day);
  };
  const brickDay = (b.mat === 'brick' || b.mat === 'red') && T.day * (1 - (T.ovc || 0) * 0.5) > 0.05 && s > 1.3;
  if (b.x1 < 0) { quad(x, cam, [[b.x1, y0, b.z0], [b.x1, y1, b.z0], [b.x1, y1, b.z1], [b.x1, y0, b.z1]], rgb(sideOf(true))); if (nearDay) brickSide(x, cam, b, b.x1, y0, y1, T, F, brickDay); }
  if (b.x0 > 0) { quad(x, cam, [[b.x0, y0, b.z0], [b.x0, y1, b.z0], [b.x0, y1, b.z1], [b.x0, y0, b.z1]], rgb(sideOf(false))); if (nearDay) brickSide(x, cam, b, b.x0, y0, y1, T, F, brickDay); }
  // ---- the front
  const [a, ty] = P(cam, b.x0, y1, b.z0), [c, by] = P(cam, b.x1, y0, b.z0), w = c - a, h = by - ty;
  if (w <= 0.2 || h <= 0.2) return;
  x.fillStyle = rgb(F.front); x.fillRect(a, ty, w, h);
  // (THE DAY PASS §0 — the owner's pick d, ARCHITECTURAL FLOODLIGHTING behind the wheel: warm uplights at the buildings' feet
  // washing up the stone — brightest at the base, gone ~60 pt up so the tops sink into the night; drawn under the windows, so the
  // panes stay dark shut rectangles against lit stone; one smooth glow, no points, no rim light)
  if (bw && floodK(T) > 0.05) floodWash(x, cam, b, a, w, ty, h, s, floodK(T), o.tower);
  if (glass) glassFace(x, cam, b, T, F, a, ty, w, h, s);
  else stoneFace(x, cam, b, T, F, a, ty, w, h, s, o);
  // DT1 — MORE FLOODLIGHTS (in the blue hour's power-up, never by day): the wall behind the lighthouse (soft light on its brick —
  // a touch softer than the wheel's backdrop, its windows kept: they are their own layer). Laid OVER the finished face, additive: the light falls on the brick + the glass alike, the uplit landmarks, and THE WATERFRONT
  // ROW (&force=flood-front: the front buildings along the water, a low warm uplight on their bottom third, uneven, a few gaps)
  if (!bw && floodK(T) > 0.05) {
    x.save(); x.globalCompositeOperation = 'lighter';
    const fk = floodK(T);
    if (behindLighthouse(cam, b)) upWash(x, cam, b, a, w, ty, h, s, fk * (b.band === 'near' ? 0.74 : 0.5), FLOOD_C);
    else if (o.tower && UPLIT[o.tower.id]) upWash(x, cam, b, a, w, ty, h, s, fk * 0.5 * (1 - F.fz * 0.5), UPLIT[o.tower.id], 0.62, o.tower);
    else if (T.floodFront && b.band === 'near' && !b.billboard) {
      const d1 = winHash(b.seed, 5, 5, 5, 5), d2 = winHash(b.seed, 6, 6, 6, 6);
      if (d1 > 0.22) upWash(x, cam, b, a, w, ty, h, s, fk * (0.38 + 0.42 * d2), FLOOD_C, 0.36);
    }
    x.restore();
  }
  // ---- light over the whole front: day — the sky from above and the ground's shade below; night — the street's glow at the
  // feet (the near rows); golden hour — the edge toward the sun catches it
  if (T.day > 0.05 && w > 3) {
    // (THE DAY PASS: the front turns from the sun — warm light on its sunny edge, the cool sky's shade on the other: a mass, not a card)
    const sd = T.sunDir || 0, gx = x.createLinearGradient(a, 0, c, 0), k = T.day * (1 - F.fz * 0.55), kl = 0.3 * k * (0.6 + 0.4 * Math.abs(sd)), ks = 0.42 * k * (0.6 + 0.4 * Math.abs(sd));
    gx.addColorStop(0, sd < 0 ? `rgba(255,244,222,${kl})` : `rgba(34,46,92,${ks})`);
    gx.addColorStop(0.5, 'rgba(128,128,128,0)');
    gx.addColorStop(1, sd > 0 ? `rgba(255,244,222,${kl})` : `rgba(34,46,92,${ks})`);
    x.fillStyle = gx; x.fillRect(a, ty, w, h);
    // the sunny corner: a crisp bright arris down the front's edge toward the sun (the stone turning into the light)
    if (Math.abs(sd) > 0.1 && s > 0.9) { x.fillStyle = rgb(mix(F.lit, [255, 252, 240], 0.6), 0.9 * k); x.fillRect(sd > 0 ? c - Math.max(0.5, 0.24 * s) : a, ty, Math.max(0.5, 0.24 * s), h); }
    // (DT2: where the front meets the side in shade, a fine cool line — the corner reads as a corner)
    if (Math.abs(sd) > 0.1 && s > 0.9 && ((sd > 0 && b.x0 > 0) || (sd < 0 && b.x1 < 0))) { x.fillStyle = `rgba(28,34,78,${(0.34 * k).toFixed(3)})`; x.fillRect(sd > 0 ? a : c - Math.max(0.5, 0.2 * s), ty, Math.max(0.5, 0.2 * s), h); }
  }
  if (T.day > 0.05) {
    // (M2: a clearer gradient up each facade — brighter toward the top where it sees more sky, darker at the base; the foot's own
    // occlusion where it meets the street / the water)
    const ov = 1 - (T.ovc || 0) * 0.5, g = x.createLinearGradient(0, ty, 0, by);
    g.addColorStop(0, `rgba(255,240,210,${(0.14 * T.day * ov).toFixed(3)})`); g.addColorStop(0.5, 'rgba(255,240,210,0)'); g.addColorStop(1, `rgba(30,24,52,${(0.22 * T.day * (1 - F.fz)).toFixed(3)})`);
    x.fillStyle = g; x.fillRect(a, ty, w, h);
    if (!(b.y0 > 0.5) && !o.tierIndex) {
      const fh = Math.min(h * 0.3, 7 * s), fg = x.createLinearGradient(0, by - fh, 0, by);
      fg.addColorStop(0, 'rgba(26,28,62,0)'); fg.addColorStop(1, `rgba(26,28,62,${(0.3 * T.day * (1 - F.fz * 0.7)).toFixed(3)})`);
      x.fillStyle = fg; x.fillRect(a, by - fh, w, fh);
    }
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
    if (T.day > 0.05) { x.fillStyle = rgb([255, 250, 238], 0.8 * T.day * (1 - F.fz * 0.6)); x.fillRect(a - pw, by - Math.max(0.6, 0.35 * s), w + pw * 2, Math.max(0.4, 0.12 * s)); }
    const sl = Math.min(h, (2.2 + 1.6 * T.day) * s), sg = x.createLinearGradient(0, by, 0, by - sl);
    sg.addColorStop(0, `rgba(24,20,40,${0.3 * (1 - T.night * 0.5) + 0.2 * T.day})`); sg.addColorStop(1, 'rgba(24,20,40,0)');
    x.fillStyle = sg; x.fillRect(a, by - sl, w, sl);
    // (DT2: the tier above throws its shadow across the ledge on the side away from the sun — a cool wedge on the parapet)
    if (T.day > 0.05 && Math.abs(T.sunDir || 0) > 0.1 && pw > 0.6) {
      const right = T.sunDir < 0, ex = right ? c : a - pw, lw = pw * (0.6 + 0.4 * Math.abs(T.sunDir));
      x.fillStyle = `rgba(30,38,86,${(0.32 * T.day * (1 - F.fz * 0.6)).toFixed(3)})`; x.fillRect(right ? ex : ex + pw - lw, by - Math.max(0.6, 0.35 * s), lw, Math.max(1.2, 0.9 * s));
    }
  }
  // the cornice: the top edge catches the light, a shadow line under it (the silhouettes read against each other)
  x.fillStyle = rgb(shade(F.trim, T.night > 0.5 ? 0.12 : 0.05), T.night > 0.5 ? 0.6 : 0.9); x.fillRect(a - 0.2, ty, w + 0.4, Math.max(0.6, 0.3 * s));
  // (THE DAY PASS: the cornice's top catches the sun — a bright line — and throws a cool shadow band under it)
  if (T.day > 0.05) { x.fillStyle = rgb([255, 251, 240], 0.95 * T.day * (1 - F.fz * 0.55)); x.fillRect(a - 0.2, ty, w + 0.4, Math.max(0.5, 0.15 * s)); }
  if (T.day > 0.05) { x.fillStyle = `rgba(30,36,70,${0.18 + 0.2 * T.day})`; x.fillRect(a, ty + Math.max(0.6, 0.3 * s), w, Math.max(0.5, 0.22 * s)); }
  else { x.fillStyle = `rgba(20,16,30,${0.18 + 0.12 * T.day})`; x.fillRect(a, ty + Math.max(0.6, 0.3 * s), w, Math.max(0.5, 0.18 * s)); }
  // (7a: a brick block's stone cornice by day — a band, its dentils, its shadow — over the plain line above)
  if (brickDay && !glass && w > 4) brickCornice(x, T, F, a, ty, w, h, s, T.day * (1 - (T.ovc || 0) * 0.5) * (1 - F.fz * 0.8));
  // ---- night: floodlights wash up the crown's stone from the setback below (real falloff), in the tower's colour
  if (o.flood && floodK(T) > 0.05) flood(x, a, ty, w, h, s, o.flood, floodK(T) * (1 - F.fz * 0.5), b.seed);
  if (b.crown) crown(x, cam, b, T, F, o);
  if (o.roof !== false && !b.crown && b.kind !== 'landmark' && s > 1.3 && !(bw && T.night > 0.05)) roofClutter(x, cam, b, T, F, s);
}

// stone, terracotta, brick: piers + spandrels on the towers, floors on the blocks, the glass, the weathering
function stoneFace(x, cam, b, T, F, a, ty, w, h, s, o) {
  const g = b.win, by = ty + h;
  const deco = isDeco(o.rank);
  const brick = (b.mat === 'brick' || b.mat === 'red');
  // texture: stone joints, a mottling (deterministic, cheap); brick has its own below (M3 — brickFace)
  if (s > 1.9 && T.day > 0.05 && !brick) {
    x.fillStyle = rgb(shade(F.front, -0.06), 0.22 * T.day);
    const step = 1.0 * s;
    for (let yy = by - step; yy > ty + 1; yy -= step) x.fillRect(a, yy, w, Math.max(0.35, step * 0.12));
  }
  const r = (k) => winHash(b.seed, o.tierIndex || 0, k, 0, 11);
  for (let i = 0; i < 3 + w / 12; i++) { x.fillStyle = rgb(shade(F.front, r(i) < 0.5 ? -0.06 : 0.05), 0.35); const mw = w * (0.1 + r(i + 20) * 0.3); x.fillRect(a + r(i + 40) * (w - mw), ty + r(i + 60) * h * 0.8, mw, h * (0.05 + r(i + 80) * 0.2)); }
  // M2 — MATERIAL by day (near + mid): brick laid in batches (each floor's courses a slightly different tone), a rusticated stone base
  // (channelled joints, a water-table line on top), belt courses (limestone on brick, terracotta on stone) — quiet at phone size
  const dk = T.day * (1 - (T.ovc || 0) * 0.5) * (1 - F.fz * 0.8);
  if (dk > 0.05 && s > 1.3 && w > 3) {
    // (7a: brickFace lays its own batches — panel by panel, bays × floors — so the old floor-by-floor tint is gone for brick)
    if (brick) brickFace(x, b, T, F, o, a, ty, w, h, s, dk);
    const tall = (b.y0 || 0) < 0.5 && !o.tierIndex;
    const baseH = tall ? Math.min(h * 0.16, Math.max(2.2 * s, ((g && g.v0) || 2.5) * s * 0.9)) : 0;
    if (brick) brickQuoins(x, b, T, F, a, ty, w, h, s, dk, baseH > 2 ? baseH : 0);
    if (baseH > 2) {
      const stone = brick ? mix(F.front, [196, 186, 168], 0.6) : shade(F.front, -0.07);
      x.fillStyle = rgb(stone, 0.9 * dk); x.fillRect(a, by - baseH, w, baseH);
      x.fillStyle = rgb(shade(stone, -0.3), 0.6 * dk); x.beginPath();
      const jt = Math.max(0.9, 0.7 * s);
      for (let yy = by - jt; yy > by - baseH + 0.6; yy -= jt) x.rect(a, yy, w, Math.max(0.3, 0.1 * s));
      x.fill();
      x.fillStyle = rgb([255, 250, 238], 0.75 * dk); x.fillRect(a, by - baseH, w, Math.max(0.4, 0.14 * s));
      x.fillStyle = rgb([24, 26, 56], 0.3 * dk); x.fillRect(a, by - baseH + Math.max(0.4, 0.14 * s), w, Math.max(0.4, 0.2 * s));
    }
    if (g && g.rows >= 4 && s > 1.6) {
      const band = brick ? [232, 222, 200] : (b.mat === 'lime' || b.mat === 'cream') ? [200, 150, 112] : shade(F.front, 0.14);
      const bc = mix(band, F.front, brick ? 0.2 : 0.45), bh = Math.max(0.5, 0.32 * s);
      x.fillStyle = rgb(bc, 0.85 * dk); x.beginPath();
      for (const row of [g.rows - 1, ...(g.rows >= 8 ? [Math.floor(g.rows / 2) - 1] : [])]) x.rect(a, by - (g.v0 + (row + 1) * g.pitch[1]) * s - bh * 0.3, w, bh);
      x.fill();
    }
  }
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
  // (DT2: far away by day the grid gives way to tone bands — farBands; the grid's hint fades with the day's share)
  x.fillStyle = rgb(glassC, farDay ? (0.28 + 0.5 * T.night) * (1 - 0.85 * T.day) : 0.9);
  const ww = Math.max(0.5, cw * winW), wh = Math.max(0.5, rh * winH);
  x.beginPath();
  for (let row = 0; row < g.rows; row++) for (let col = 0; col < g.cols; col++) x.rect(xOf(col) + (cw - ww) / 2, yOf(row) + (rh - wh) / 2, ww, wh);
  x.fill();
  // THE DAY PASS — WINDOWS BY DAY: the glass mirrors the sky (lighter up the facade, where it sees more sky; darker low, where it
  // sees the buildings across), some blinds half down, a few windows open (dark), the odd sun glint on the sunny side — quiet
  // enough that the building reads first. Far away by day only the faint hint above.
  if (T.day > 0.15 && !farDay) dayPanes(x, b, T, F, o, g, xOf, yOf, cw, rh, ww, wh, ty, by);
  if (brick && !farDay && dk > 0.05 && s > 1.3 && cw >= 1.4 && rh >= 2) brickTrim(x, b, T, g, xOf, yOf, cw, rh, ww, wh, s, dk, F);
  if (T.day > 0.05 && farDay) farBands(x, g, T, F, xOf, yOf, cw, rh, ww, wh);
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

// M3 + 7a — BRICK BY DAY, STYLISED + READABLE (the owner: "smooth salmon slabs + a window grid at noon" — real-scale courses are
// sub-pixel at this distance, so they vanished). Drawn like an illustrator, on the DEVICE-PIXEL grid of the bake (pxGrid): courses
// every few device px with a darker mortar tint, a running bond's head joints, the kiln's colours brick by brick, panel-to-panel
// batches (bays × floors), soldier-course heads over the windows, stone quoins at the corners, a stone cornice with dentils,
// weathering under the sills, the returns coursed in perspective. Near + mid only (brick is only ever near; the mid ones fade in by
// scale), baked per look, the day's share only (dk): golden hour, dusk + the night never see any of it. SHARED: the speakeasy's
// brick (speakeasy.js) can call the same exports with its own rect + a seed.
const noonK = T => Math.max(0, Math.min(1, ((T.sunEl || 30) - 10) / 30));
/** the bake's device-pixel grid from the context's transform: D (device px a pt), px (one device px in pt), sx / sy (snap a pt
 *  coordinate to the nearest device-pixel edge) — so 1-px mortar lines land on whole pixels, crisp, never a half-tone smear */
export function pxGrid(x) {
  const t = x && x.getTransform ? x.getTransform() : null, D = (t && Math.abs(t.a)) || 2, ox = t ? t.e : 0, oy = t ? t.f : 0;
  return { D, px: 1 / D, sx: v => (Math.round(v * D + ox) - ox) / D, sy: v => (Math.round(v * D + oy) - oy) / D };
}
/** the course height in device px for a scale (pt a world unit): 3 on the near blocks (2 brick + 1 mortar), 2 on the mid ones */
export const brickCourse = s => (s >= 1.9 ? 3 : 2);
/**
 * A wall of brick on a front: b = { seed, win? } (win = the window grid: the batches follow its bays + floors), F = faces() (F.front
 * the brick's tone), o = { tierIndex }, the rect a, ty, w, h (pt), s = scale (pt a world unit), dk = the day's strength (0..1).
 */
export function brickFace(x, b, T, F, o, a, ty, w, h, s, dk) {
  const nk = noonK(T), k = dk * (0.8 + 0.2 * nk), by = ty + h, H = (i, j, n) => winHash(b.seed, ((o && o.tierIndex) || 0) + 40, i, j, n);
  const G = pxGrid(x), px = G.px, p = brickCourse(s), cp = p * px, vis = sm01(1.3, 2.1, s), g = b.win;
  const x0 = G.sx(a), x1 = G.sx(a + w), yB = G.sy(by), yT = ty;
  // 1. BATCHES: panel to panel (2–4 bays × 2–3 floors) a slightly different brick — lighter, darker, a warmer or a browner kiln
  if (g && g.rows > 0 && g.cols > 0) {
    const pu = g.pitch[0] * s, pv = g.pitch[1] * s, xc = c => (c <= 0 ? x0 : c >= g.cols ? x1 : G.sx(a + (g.u0 * s) + c * pu)), yr = r => (r <= 0 ? yB : r >= g.rows ? yT : G.sy(by - (g.v0 * s) - r * pv));
    const cb = [0]; for (let c = 0; c < g.cols;) { c += 2 + Math.floor(H(c, 0, 51) * 3); cb.push(Math.min(g.cols, c)); }
    const rb = [0]; for (let r = 0; r < g.rows;) { r += 2 + Math.floor(H(0, r, 52) * 2); rb.push(Math.min(g.rows, r)); }
    const BATCH = [shade(F.front, 0.08), shade(F.front, -0.09), mix(F.front, [176, 84, 52], 0.28), mix(F.front, [118, 72, 64], 0.24)];
    for (let t = 0; t < BATCH.length; t++) {
      x.fillStyle = rgb(BATCH[t], 0.62 * k); x.beginPath();
      for (let i = 0; i + 1 < cb.length; i++) for (let j = 0; j + 1 < rb.length; j++) {
        const v = H(i, j, 53); if (v < 0.22 || Math.floor((v - 0.22) / 0.78 * BATCH.length) !== t) continue;
        const l = xc(cb[i]), r = xc(cb[i + 1]), bt = yr(rb[j]), tp = yr(rb[j + 1]);
        if (r > l && bt > tp) x.rect(l, tp, r - l, bt - tp);
      }
      x.fill();
    }
  }
  // 2. THE KILN'S COLOURS brick by brick (a running bond: each course offset by half a brick), then the joints over them
  const Lb = (p >= 3 ? 8 : 6) * px, half = (p >= 3 ? 4 : 3) * px;
  const tones = [shade(F.front, 0.15), shade(F.front, -0.17), mix(F.front, [150, 60, 40], 0.42), shade(F.front, -0.32)];
  const runs = [[], [], [], []], heads = [], beds = [];
  for (let row = 0, yy = yB - cp; yy > yT - cp; row++, yy -= cp) {
    if (yy >= yT) beds.push(yy);
    const bt = Math.max(yT, yy + px), bh = yy + cp - bt;
    if (bh <= 0) continue;
    for (let i = 0, xx = x0 - (row % 2 ? half : 0); xx < x1; i++, xx += Lb) {
      if (xx > x0) heads.push(xx, bt, bh);
      const r = H(i, row, 22), t = r < 0.13 ? 0 : r > 0.89 ? 1 : r > 0.81 ? 2 : r > 0.78 ? 3 : -1;
      if (t >= 0) { const l = Math.max(x0, xx + px), rr = Math.min(x1, xx + Lb); if (rr > l) runs[t].push(l, bt, rr - l, bh); }
    }
  }
  const ta = [0.5, 0.46, 0.44, 0.4];
  runs.forEach((R, t) => { if (!R.length) return; x.fillStyle = rgb(tones[t], ta[t] * k * vis); x.beginPath(); for (let i = 0; i < R.length; i += 4) x.rect(R[i], R[i + 1], R[i + 2], R[i + 3]); x.fill(); });
  // 3. THE MORTAR, a darker tint (the joint in its own shadow — what makes the course rhythm read at phone size): the bed joints
  // full width, the head joints fainter
  const mortar = shade(mix(F.front, [96, 74, 78], 0.3), -0.34);
  x.fillStyle = rgb(mortar, 0.3 * k * vis); x.beginPath();
  for (let i = 0; i < heads.length; i += 3) x.rect(heads[i], heads[i + 1], px, heads[i + 2]);
  x.fill();
  x.fillStyle = rgb(mortar, (0.4 + 0.1 * nk) * k * vis); x.beginPath();
  for (const yy of beds) x.rect(x0, yy, x1 - x0, px);
  x.fill();
  // 4. the base: a darker band of soot + damp where the wall meets the street (under the stone base on a tall block, it rises above it)
  const bh = Math.min(h * 0.16, 9 * s), gb = x.createLinearGradient(0, by, 0, by - bh);
  gb.addColorStop(0, rgb([40, 24, 26], 0.42 * dk)); gb.addColorStop(0.5, rgb([52, 32, 32], 0.16 * dk)); gb.addColorStop(1, rgb([52, 32, 32], 0));
  x.fillStyle = gb; x.fillRect(a, by - bh, w, bh);
}
/** STONE QUOINS up both corners of a brick front (long / short, a joint between, each lit on top); foot = the stone base's height
 *  (they stop on it) */
export function brickQuoins(x, b, T, F, a, ty, w, h, s, dk, foot = 0) {
  if (w < 5 || h < 6 || dk <= 0.05) return;
  const G = pxGrid(x), px = G.px, nk = noonK(T), k = dk * (0.8 + 0.2 * nk), p = brickCourse(s);
  const qh = 2 * p * px, long = G.sx(a + Math.max(4 * px, Math.min(w * 0.1, 1.15 * s))) - G.sx(a), short = Math.max(2 * px, G.sx(a + long * 0.6) - G.sx(a));
  const stone = mix(F.trim, [236, 226, 206], 0.25), x0 = G.sx(a), x1 = G.sx(a + w), yB = G.sy(ty + h - foot), yT = G.sy(ty) + 3 * px;
  const blocks = [];
  for (let i = 0, yy = yB - qh; yy > yT; i++, yy -= qh) { const lw = i % 2 ? short : long; blocks.push([x0, yy, lw], [x1 - lw, yy, lw]); }
  x.fillStyle = rgb(stone, 0.92 * k); x.beginPath();
  for (const [u, v, lw] of blocks) x.rect(u, v, lw, qh - px);
  x.fill();
  // each block's top catches the sun, the joint under it is in shadow, its inner edge throws a fine shadow onto the brick
  x.fillStyle = rgb([255, 252, 240], 0.5 * k * (0.5 + 0.5 * nk)); x.beginPath();
  for (const [u, v, lw] of blocks) x.rect(u, v, lw, px);
  x.fill();
  x.fillStyle = rgb([40, 30, 44], 0.34 * k); x.beginPath();
  for (const [u, v, lw] of blocks) { x.rect(u, v + qh - px, lw, px); x.rect(u === x0 ? u + lw : u - px, v, px, qh - px); }
  x.fill();
}
/** a brick block's STONE CORNICE (the top of a front: a band, a row of dentils, its shadow on the brick, a soldier-course frieze) */
export function brickCornice(x, T, F, a, ty, w, h, s, dk) {
  if (dk <= 0.05 || h < 8) return;
  const G = pxGrid(x), px = G.px, nk = noonK(T), k = dk * (0.8 + 0.2 * nk);
  const x0 = G.sx(a - 0.3), x1 = G.sx(a + w + 0.3), y0 = G.sy(ty), band = Math.max(3, Math.round(0.55 * s * G.D)) * px;
  const stone = mix(F.trim, [236, 226, 206], 0.25);
  x.fillStyle = rgb(stone, 0.95 * k); x.fillRect(x0, y0, x1 - x0, band);
  x.fillStyle = rgb([255, 252, 242], 0.85 * k); x.fillRect(x0, y0, x1 - x0, px);                 // its lit top
  // the dentils: little stone teeth under the band, the gaps between them dark (one device px each)
  const dy = y0 + band;
  x.fillStyle = rgb(shade(stone, -0.08), 0.9 * k); x.fillRect(x0 + px, dy, x1 - x0 - 2 * px, 2 * px);
  x.fillStyle = rgb([44, 30, 40], 0.5 * k); x.beginPath();
  for (let xx = x0 + 2 * px; xx < x1 - px; xx += 3 * px) x.rect(xx, dy, px, 2 * px);
  x.fill();
  // the shadow it throws on the brick (longer with the sun high)
  const sh = (nk > 0.5 ? 3 : 2) * px;
  x.fillStyle = rgb([34, 22, 38], 0.4 * k); x.fillRect(x0 + px, dy + 2 * px, x1 - x0 - 2 * px, sh);
  // a frieze of soldiers (bricks on end) under it
  const fy = dy + 2 * px + sh + px, fh = 3 * px;
  if (fy + fh < ty + h * 0.5) soldiers(x, F, G, G.sx(a), fy, G.sx(a + w) - G.sx(a), fh, k);
}
/** a SOLDIER COURSE (bricks standing on end: a band a little darker + redder, a joint every 2 device px) */
function soldiers(x, F, G, u, v, w, hh, k) {
  const px = G.px;
  x.fillStyle = rgb(mix(shade(F.front, -0.06), [128, 46, 34], 0.32), 0.9 * k); x.fillRect(u, v, w, hh);
  x.fillStyle = rgb(shade(mix(F.front, [96, 74, 78], 0.3), -0.36), 0.45 * k); x.beginPath();
  for (let xx = u + px; xx < u + w; xx += 2 * px) x.rect(xx, v, px, hh);
  x.rect(u, v + hh - px, w, px);
  x.fill();
}
/** the openings' stone + brick: a SOLDIER-COURSE head over each window, a stone sill under it catching the light (its shadow on the
 *  brick below, longer with the sun high), faint WEATHERING streaks running down from the sills. F (7a) optional: the faces. */
export function brickTrim(x, b, T, g, xOf, yOf, cw, rh, ww, wh, s, dk, F = null) {
  const hi = noonK(T), k = dk * (0.6 + 0.4 * hi), stone = [226, 212, 186], G = pxGrid(x), px = G.px;
  const sh = Math.max(2 * px, G.sy(rh * 0.1) - G.sy(0) || 2 * px), ov = Math.max(px, Math.round(ww * 0.14 * G.D) * px);
  const px0 = col => G.sx(xOf(col) + (cw - ww) / 2), pw = G.sx(ww) - G.sx(0) || px, py = row => G.sy(yOf(row) + (rh - wh) / 2), ph = G.sy(wh) - G.sy(0) || px;
  const H = (c, r, n) => winHash(b.seed, 61, c, r, n);
  // the soldier heads (a flat arch of bricks on end over each opening) — the stone lintel of M3 when no faces are given
  const hh = (rh * G.D >= 12 ? 3 : 2) * px;
  if (F) { for (let row = 0; row < g.rows; row++) for (let col = 0; col < g.cols; col++) soldiers(x, F, G, px0(col) - ov, py(row) - hh, pw + 2 * ov, hh, k); }
  else { x.fillStyle = rgb(stone, 0.78 * k); x.beginPath(); for (let row = 0; row < g.rows; row++) for (let col = 0; col < g.cols; col++) x.rect(px0(col) - ov, py(row) - hh, pw + 2 * ov, hh); x.fill(); }
  // the sills: stone, their lit top edge, their shadow on the brick
  x.fillStyle = rgb(stone, 0.85 * k); x.beginPath();
  for (let row = 0; row < g.rows; row++) for (let col = 0; col < g.cols; col++) x.rect(px0(col) - ov, py(row) + ph, pw + 2 * ov, sh);
  x.fill();
  x.fillStyle = rgb([255, 250, 236], 0.6 * k * (0.5 + 0.5 * hi)); x.beginPath();
  for (let row = 0; row < g.rows; row++) for (let col = 0; col < g.cols; col++) x.rect(px0(col) - ov, py(row) + ph, pw + 2 * ov, px);
  x.fill();
  const dh = (hi > 0.5 ? 2 : 1) * px;
  x.fillStyle = rgb([34, 20, 30], 0.36 * k); x.beginPath();
  for (let row = 0; row < g.rows; row++) for (let col = 0; col < g.cols; col++) x.rect(px0(col) - ov + px, py(row) + ph + sh, pw + 2 * ov - px, dh);
  x.fill();
  // weathering: the rain off a sill leaves a faint dark streak down the brick under some of them (two strengths: it fades down)
  const streaks = [[], []];
  for (let row = 0; row < g.rows; row++) for (let col = 0; col < g.cols; col++) {
    const v = H(col, row, 71); if (v > 0.42) continue;
    const u = px0(col) - ov + (v < 0.21 ? 0 : pw + 2 * ov - 2 * px), top = py(row) + ph + sh, len = rh * (0.45 + 1.1 * H(col, row, 72)), sw = (H(col, row, 73) < 0.5 ? 1 : 2) * px;
    streaks[0].push(u, top, sw, len * 0.45); streaks[1].push(u, top + len * 0.45, sw, len * 0.55);
  }
  [0.27, 0.13].forEach((al, i) => { x.fillStyle = rgb([52, 30, 30], al * k); x.beginPath(); const R = streaks[i]; for (let j = 0; j < R.length; j += 4) x.rect(R[j], R[j + 1], R[j + 2], R[j + 3]); x.fill(); });
}
/** a block's RETURN (its side face, near blocks by day): brick courses in perspective (brick only — the same rhythm as the front's,
 *  converging to the back) + the face turning away from us a touch darker toward the back, a fine shadow down the corner */
export function brickSide(x, cam, b, xs, y0, y1, T, F, brick) {
  const G = pxGrid(x), s = cam.F / b.z0, dk = T.day * (1 - (T.ovc || 0) * 0.5) * (1 - F.fz * 0.8);
  const [fx, fy0] = P(cam, xs, y0, b.z0), [bx, by0] = P(cam, xs, y0, b.z1), [, fy1] = P(cam, xs, y1, b.z0), [, by1] = P(cam, xs, y1, b.z1);
  if (Math.abs(fx - bx) < 0.8 || dk <= 0.05) return;
  const face = () => { x.beginPath(); x.moveTo(fx, fy0); x.lineTo(fx, fy1); x.lineTo(bx, by1); x.lineTo(bx, by0); x.closePath(); };
  if (brick) {
    const p = brickCourse(s), cp = p * G.px / s, sb = cam.F / b.z1, t0 = G.px, t1 = G.px * sb / s;
    x.fillStyle = rgb(shade(mix(F.front, [96, 74, 78], 0.3), -0.36), 0.5 * dk * sm01(1.3, 2.1, s)); x.beginPath();
    for (let y = y0 + cp; y < y1; y += cp) { const [, ay] = P(cam, xs, y, b.z0), [, cy] = P(cam, xs, y, b.z1); x.moveTo(fx, ay); x.lineTo(bx, cy); x.lineTo(bx, cy + t1); x.lineTo(fx, ay + t0); x.closePath(); }
    x.fill();
  }
  const gr = x.createLinearGradient(fx, 0, bx, 0);
  gr.addColorStop(0, 'rgba(30,26,64,0)'); gr.addColorStop(1, `rgba(30,26,64,${(0.2 * dk).toFixed(3)})`);
  x.fillStyle = gr; face(); x.fill();
  x.fillStyle = `rgba(24,20,52,${(0.3 * dk).toFixed(3)})`; x.fillRect(fx < bx ? fx : fx - G.px, Math.min(fy0, fy1), G.px, Math.abs(fy0 - fy1));
}

// DT2 — WINDOWS BY DAY, NOT A GRID (the owner: "they still read as a uniform grid from a distance"). Each building its own window
// character (by its seed): OFFICE floors (the panes joined into ribbon bands of glass, thin mullions), APARTMENTS (framed panes,
// curtains in a few colours, blinds, a few open), DECO towers (tall windows: two floors' panes joined in their recessed strips).
// The glass mirrors the sky (lighter up the facade, the odd pane catching more of it, a few dark — the room behind), mullions on
// the near ones, the odd sun glint on the sunny side. Quiet enough that the building reads first. All of it by the day's share:
// golden hour, dusk + the night never see it (the lit windows keep their panes exactly).
const CURTAINS = [[214, 196, 168], [196, 132, 120], [150, 168, 132], [214, 172, 96], [168, 120, 140]];
export function windowStyle(b, deco) {
  const r = winHash(b.seed, 9, 9, 9, 9);
  if (deco) return r < 0.5 ? 'tall' : 'deco';
  return b.mat === 'brick' || b.mat === 'red' ? (r < 0.25 ? 'office' : 'flat') : (r < 0.55 ? 'office' : r < 0.8 ? 'flat' : 'wide');
}
function dayPanes(x, b, T, F, o, g, xOf, yOf, cw, rh, ww, wh, ty, by) {
  const k = T.day * (1 - F.fz * 0.5), ti = o.tierIndex || 0, sky = T.skyHi || [150, 196, 236], top = T.skyTop || [40, 96, 180], n = g.cols;
  const sd = T.sunDir || 0, deco = isDeco(o.rank), style = windowStyle(b, deco), H = (c, r, s) => winHash(b.seed, ti, c, r, s);
  const px0 = col => xOf(col) + (cw - ww) / 2, py0 = row => yOf(row) + (rh - wh) / 2;
  const pane = (col, row, f0 = 0, f1 = 1) => x.rect(px0(col), py0(row) + wh * f0, ww, wh * (f1 - f0));
  const glass = mix(lerp3(T, GLASS_D, [70, 52, 80], GLASS_N), T.haze, F.fz * 0.6);
  // the joins (by day only): OFFICE ribbons — the gaps between a floor's panes filled with glass; TALL Deco windows — two floors'
  // panes joined through the spandrel between them
  if (style === 'office' && ww > 1 && n > 1) {
    x.fillStyle = rgb(glass, 0.9 * k); x.beginPath();
    for (let row = 0; row < g.rows; row++) x.rect(px0(0), py0(row), px0(n - 1) + ww - px0(0), wh);
    x.fill();
  } else if (style === 'tall' && g.rows > 1 && wh > 1) {
    x.fillStyle = rgb(glass, 0.9 * k); x.beginPath();
    for (let row = 0; row + 1 < g.rows; row += 2) for (let col = 0; col < n; col++) x.rect(px0(col), py0(row + 1), ww, py0(row) + wh - py0(row + 1));
    x.fill();
  }
  const span = (col, row) => style === 'office' ? [px0(0), py0(row), px0(n - 1) + ww - px0(0), wh] : style === 'tall' ? null : [px0(col), py0(row), ww, wh];
  // the sky in the glass: one gradient down the whole facade (lighter high, where it sees more sky)
  const gr = x.createLinearGradient(0, ty, 0, by);
  gr.addColorStop(0, rgb(mix(sky, [255, 255, 255], 0.34), 0.66 * k)); gr.addColorStop(0.45, rgb(mix(top, sky, 0.5), 0.38 * k)); gr.addColorStop(1, rgb(top, 0.12 * k));
  x.fillStyle = gr; x.beginPath();
  if (style === 'office') for (let row = 0; row < g.rows; row++) { const [a0, b0, w0, h0] = span(0, row); x.rect(a0, b0, w0, h0); }
  else if (style === 'tall') for (let row = 0; row < g.rows; row += 2) for (let col = 0; col < n; col++) { const r1 = Math.min(g.rows - 1, row + 1); x.rect(px0(col), py0(r1), ww, py0(row) + wh - py0(r1)); }
  else for (let row = 0; row < g.rows; row++) for (let col = 0; col < n; col++) pane(col, row);
  x.fill();
  // pane by pane the reflection varies: some catch more sky (brighter), some show the dark room behind — never one even tone
  x.fillStyle = rgb([255, 255, 255], 0.16 * k); x.beginPath();
  for (let row = 0; row < g.rows; row++) for (let col = 0; col < n; col++) if (H(col, row, 31) < 0.26) pane(col, row, 0, 0.55 + 0.4 * H(col, row, 32));
  x.fill();
  x.fillStyle = rgb([22, 26, 44], 0.32 * k); x.beginPath();
  for (let row = 0; row < g.rows; row++) for (let col = 0; col < n; col++) { const h = H(col, row, 31); if (h > 0.88) pane(col, row, 0.1 + 0.3 * H(col, row, 33), 1); }
  x.fill();
  // each pane's upper part a touch brighter (the frame's shadow below it)
  x.fillStyle = rgb([255, 255, 255], 0.08 * k); x.beginPath();
  for (let row = 0; row < g.rows; row++) for (let col = 0; col < n; col++) pane(col, row, 0, 0.38);
  x.fill();
  if (wh < 1.2) return;
  // M2 — RECESSED WINDOWS (the owner: "a little flat" — the windows were printed on the wall): each opening sits INTO the wall. Its
  // head and the jamb on the sun's side throw a thin shadow onto the glass; the jamb across catches the light inside the opening and
  // the sill below it a bright line. By the openings this building has (an office floor's ribbon, a Deco tower's tall window, a pane).
  if (ww > 1.1 && wh > 1.3) {
    const ops = [];
    if (style === 'office' && n > 1) for (let row = 0; row < g.rows; row++) ops.push([px0(0), py0(row), px0(n - 1) + ww - px0(0), wh, 0]);
    else if (style === 'tall' && g.rows > 1) for (let row = 0; row < g.rows; row += 2) for (let col = 0; col < n; col++) { const r1 = Math.min(g.rows - 1, row + 1); ops.push([px0(col), py0(r1), ww, py0(row) + wh - py0(r1), 1]); }
    else for (let row = 0; row < g.rows; row++) for (let col = 0; col < n; col++) ops.push([px0(col), py0(row), ww, wh, 1]);
    const left = sd <= 0, lw = Math.max(0.5, Math.min(ww * 0.24, 1.2)), lh = Math.max(0.5, Math.min(wh * 0.26, 1.3)), kk = k * (1 - (T.ovc || 0) * 0.6);
    x.fillStyle = rgb([20, 24, 52], 0.58 * kk); x.beginPath();
    for (const [u, v, w0, h0, j] of ops) { x.rect(u, v, w0, lh); if (j) x.rect(left ? u : u + w0 - lw, v + lh, lw, h0 - lh); }
    x.fill();
    // (the bright lines only where the opening is big enough to show them: on a dense grid they bleached the stone)
    if (wh > 2) {
      x.fillStyle = rgb([255, 249, 234], 0.4 * kk); x.beginPath();
      for (const [u, v, w0, h0, j] of ops) { x.rect(u - 0.25, v + h0, w0 + 0.5, Math.max(0.4, lh * 0.6)); if (j && ww > 2.2) x.rect(left ? u + w0 - Math.max(0.35, lw * 0.4) : u, v + lh, Math.max(0.35, lw * 0.4), h0 - lh); }
      x.fill();
    }
    // (the sill's own shadow on the wall under it: the stone stands out from the facade)
    x.fillStyle = rgb([24, 26, 56], 0.22 * kk); x.beginPath();
    for (const [u, v, w0, h0] of ops) x.rect(u - 0.25 + (left ? 0.4 : -0.4), v + h0 + Math.max(0.4, lh * 0.75), w0 + 0.5, Math.max(0.35, lh * 0.5));
    x.fill();
  }
  // mullions + transoms on the near ones (a frame colour: the trim)
  if (ww > 2.2 && wh > 2.2) {
    x.fillStyle = rgb(mix(F.trim, [255, 255, 255], 0.2), 0.62 * k); x.beginPath();
    const mw = Math.max(0.35, ww * 0.07);
    for (let row = 0; row < g.rows; row++) for (let col = 0; col < n; col++) {
      if (style === 'office') { x.rect(px0(col) - mw / 2, py0(row), mw, wh); if (col < n - 1) x.rect(px0(col) + ww + (cw - ww) / 2 - mw / 2, py0(row), mw, wh); }
      else { x.rect(px0(col) + ww / 2 - mw / 2, py0(row), mw, wh); if (style !== 'tall') x.rect(px0(col), py0(row) + wh * 0.36, ww, mw); }
    }
    x.fill();
  }
  // apartments + brick: curtains drawn to the sides, blinds half down; offices: blinds only, fewer; open windows (the dark room)
  const homes = style === 'flat' || style === 'wide';
  if (homes && ww > 1.6) for (let v = 0; v < CURTAINS.length; v++) {
    x.fillStyle = rgb(mix(CURTAINS[v], F.front, 0.22), 0.9 * k); x.beginPath();
    for (let row = 0; row < g.rows; row++) for (let col = 0; col < n; col++) { const r = H(col, row, 24); if (r < 0.2 && Math.floor(r * 25) === v) { const cwid = ww * (0.18 + 0.1 * H(col, row, 25)); x.rect(px0(col), py0(row), cwid, wh); x.rect(px0(col) + ww - cwid, py0(row), cwid, wh); } }
    x.fill();
  }
  const blind = [mix([236, 226, 204], F.front, 0.25), mix([214, 222, 196], F.front, 0.3)], bShare = homes ? 0.16 : 0.1;
  for (let v = 0; v < 2; v++) {
    x.fillStyle = rgb(blind[v], 0.92 * k); x.beginPath();
    for (let row = 0; row < g.rows; row++) for (let col = 0; col < n; col++) { const r = H(col, row, 21); if (v ? r < 0.04 : r >= 0.04 && r < bShare + 0.03) pane(col, row, 0, 0.22 + 0.5 * H(col, row, 22)); }
    x.fill();
  }
  x.fillStyle = rgb([28, 24, 34], 0.7 * k); x.beginPath();
  for (let row = 0; row < g.rows; row++) for (let col = 0; col < n; col++) { const r = H(col, row, 21); if (homes && r >= 0.2 && r < 0.235) pane(col, row, 0.08, 1); }
  x.fill();
  // the sun's glint on the sunny half (a bright bar high in the pane)
  if (Math.abs(sd) > 0.05 && ww > 1) {
    x.fillStyle = rgb([255, 254, 246], 0.95 * k); x.beginPath();
    for (let row = 0; row < g.rows; row++) for (let col = 0; col < n; col++) {
      const side = sd > 0 ? col >= n * 0.5 : col < n * 0.5;
      if (side && H(col, row, 23) < 0.035) x.rect(px0(col) + ww * 0.12, py0(row) + wh * 0.1, ww * 0.76, Math.max(0.4, wh * 0.3));
    }
    x.fill();
  }
}
/** DT2: far away by day the windows merge into soft tone bands (a band per floor) instead of tiny squares */
function farBands(x, g, T, F, xOf, yOf, cw, rh, ww, wh) {
  const k = T.day * (0.55 - 0.25 * F.fz), n = g.cols;
  if (k <= 0.01 || n < 1) return;
  const glass = mix(GLASS_D, T.haze, 0.45 + 0.3 * F.fz);
  x.fillStyle = rgb(glass, k * 0.55); x.beginPath();
  for (let row = 0; row < g.rows; row++) x.rect(xOf(0) + (cw - ww) / 2, yOf(row) + (rh - wh) / 2 + wh * 0.15, xOf(n - 1) - xOf(0) + ww, wh * 0.7);
  x.fill();
}

// the newer city's glass: the sky's colour mirrored (lighter low, the sky's top high), mullions, a sheen; night: dark glass
function glassFace(x, cam, b, T, F, a, ty, w, h, s) {
  const sky0 = T.skyHi || [150, 180, 220], sky1 = T.skyLo || [210, 225, 240];
  if (T.night < 0.95) {
    const g = x.createLinearGradient(0, ty, 0, ty + h), k = 1 - T.night;
    g.addColorStop(0, rgb(mix(mix(T.day > 0.3 && T.skyTop ? mix(sky0, T.skyTop, 0.5) : sky0, F.front, 0.3), T.haze, F.fz * 0.5), 0.85 * k));
    g.addColorStop(1, rgb(mix(mix(sky1, F.front, 0.25), T.haze, F.fz * 0.5), 0.85 * k));
    x.fillStyle = g; x.fillRect(a, ty, w, h);
    // (THE DAY PASS: clouds in the glass — a few soft white reflections, by the day's share)
    if (T.day > 0.1 && w > 4) {
      const gw = b.win && b.win.pitch[0] * s > 2.2 ? b.win.pitch[0] * s : w, nCol = Math.max(1, Math.ceil(w / gw)), ca = 0.34 * T.day * (1 - F.fz * 0.5);
      for (let col = 0; col < nCol; col++) {
        const cx0 = a + col * gw, jy = (winHash(b.seed, 4, col, 7, 43) - 0.5) * Math.min(6, h * 0.03);
        x.save(); x.beginPath(); x.rect(cx0, ty, Math.min(gw, a + w - cx0), h); x.clip(); x.translate(0, jy);
        for (let i = 0; i < 6; i++) {
          const r1 = winHash(b.seed, 4, i, 1, 41), r2 = winHash(b.seed, 4, i, 2, 41), cx = a + w * (r1 * 1.2 - 0.1), cy = ty + h * (0.06 + 0.62 * r2), rx = w * (0.28 + 0.4 * r2), ry = Math.max(1.5, h * (0.04 + 0.05 * r1));
          x.save(); x.translate(cx, cy); x.scale(1, ry / rx);
          const cg = x.createRadialGradient(0, 0, 0, 0, 0, rx); cg.addColorStop(0, `rgba(255,255,255,${ca * (0.6 + 0.4 * r1)})`); cg.addColorStop(0.55, `rgba(246,250,255,${ca * 0.35})`); cg.addColorStop(1, 'rgba(255,255,255,0)');
          x.fillStyle = cg; x.fillRect(-rx, -rx, rx * 2, rx * 2); x.restore();
        }
        x.restore();
      }
      x.save(); x.beginPath(); x.rect(a, ty, w, h); x.clip();
      // (low on the glass: the city across, darker)
      const lo = x.createLinearGradient(0, ty + h * 0.55, 0, ty + h);
      lo.addColorStop(0, 'rgba(30,40,70,0)'); lo.addColorStop(1, `rgba(30,40,70,${0.3 * T.day})`);
      x.fillStyle = lo; x.fillRect(a, ty + h * 0.55, w, h * 0.45);
      // (the sun's streak down the sunny edge of the glass)
      const sd = T.sunDir || 0;
      if (Math.abs(sd) > 0.1) { const sx0 = sd > 0 ? a + w * 0.72 : a + w * 0.08, sg = x.createLinearGradient(sx0, 0, sx0 + w * 0.2, 0); sg.addColorStop(0, 'rgba(255,252,240,0)'); sg.addColorStop(0.5, `rgba(255,252,240,${0.3 * T.day * Math.abs(sd)})`); sg.addColorStop(1, 'rgba(255,252,240,0)'); x.fillStyle = sg; x.fillRect(sx0, ty, w * 0.2, h); }
      x.restore();
    }
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
  const copper = lerp3(T, [82, 168, 146], [140, 150, 120], [24, 40, 46]);
  const hz = col => mix(col, T.haze, F.fz * 0.55);
  const sunX = T.sunDir || 0;
  const rim = (path) => { if (T.gold > 0.1 && sunX) { x.save(); x.clip(path); x.fillStyle = rgb([255, 200, 130], 0.6 * T.gold); x.fillRect(sunX > 0 ? sx : sx - hw * 2, sy - hh * 2, hw * 2, hh * 2); x.restore(); } };
  const nightK = floodK(T) * (1 - F.fz * 0.4);          // (DT1: the crowns' floodlights + lit crown windows come up with the floodlights)
  if (c.t === 'sunburst') {
    // stacked arches, each with its sunburst of triangular windows; a needle above. The city's one gold crown.
    const body = hz(o.gold ? mix(metal, gold, 0.55 + 0.3 * T.day) : metal);
    for (let i = 0; i < 4; i++) {
      const r = hw * (1 - 0.2 * i), yy = sy - i * hh * 0.11, ry = Math.min(r * 0.95, hh * 0.3 * (1 - 0.1 * i));
      const p = new Path2D(); p.ellipse(sx, yy, r, ry, 0, Math.PI, 0); p.closePath();
      x.fillStyle = rgb(i % 2 ? shade(body, -0.12) : body); x.fill(p);
      // the left half in shade (day) — the right in shade at the other end of the day
      x.save(); x.clip(p); x.fillStyle = `rgba(30,24,50,${0.2 * T.day})`; x.fillRect(sunX > 0 ? sx - r : sx, yy - r, r, r); x.restore();
      rim(p);
      // (DT2: by day the sun catches the metal — a bright band on each arch's sunny side, the gold crown glinting)
      if (T.day > 0.1) { x.save(); x.clip(p); const bx = sx + (sunX >= 0 ? 0.32 : -0.62) * r, bg = x.createLinearGradient(bx, 0, bx + r * 0.3, 0); bg.addColorStop(0, 'rgba(255,250,226,0)'); bg.addColorStop(0.5, `rgba(255,250,226,${(0.6 * T.day).toFixed(3)})`); bg.addColorStop(1, 'rgba(255,250,226,0)'); x.fillStyle = bg; x.fillRect(bx, yy - r, r * 0.3, r); x.restore(); }
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
    out.set(me.b, { pts: [[edge, me.ty], [edge - T.sunDir * len, me.ty], [edge, Math.min(me.by, me.ty + drop)]], a: (0.2 + 0.18 * T.day) * k * (1 - fog(me.b.z0) * 0.7), day: T.day > 0.3 });
  }
  return out;
}
export function drawShadow(x, sh) {
  if (!sh) return;
  x.fillStyle = sh.day ? `rgba(32,40,84,${sh.a})` : `rgba(36,30,62,${sh.a})`;
  x.beginPath(); sh.pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.fill();
}

/**
 * DAY BUILDINGS (M2 — the owner: by day "a little flat"): CAST SHADOWS BETWEEN BUILDINGS + CONTACT OCCLUSION, the day channel only.
 * The light: the sun's side (sunDir: morning from the left, afternoon from the right) and height, and — the illustration's convention
 * the whole day look already uses — from the viewer's side, so the fronts are lit and a box throws its shadow onto the fronts BEHIND
 * it. A box (its front at z0, its back at z1) seen along the light is its front rect pushed by the depth to the wall behind plus its
 * back rect pushed less: the hull of the two is the shadow on that wall (attached to the box where they touch, long when the depth
 * gap is big or the sun low). Soft-edged (a penumbra growing with the gap), cool blue-violet. A nearer roofline that cuts across a
 * wall behind darkens that wall just above it (where the forms meet). Golden hour, dusk + the night: none (T.day), and an overcast
 * deck fades them out. → { get(box) → { cast: [{ pts, a, pen }], ao: [{ x0, x1, y, h, a }] } | undefined, values() } in screen pt.
 */
export const CAST = { kx: 1.1, ty: 0.45, a: 0.72, ao: 0.5, col: [124, 130, 208], aoCol: [100, 106, 170] };
export function castShadows(cam, boxes, T) {
  const out = new Map(), none = { get: () => undefined, values: () => [].values() }, k = T.day * (1 - (T.ovc || 0)) * ((T.cloud || 0) > 0.6 ? 0.55 : 1);   // (the cloud as the bake key has it)
  if (k < 0.05) return none;
  const sd = T.sunDir || 0, lx = -sd * CAST.kx, drop = Math.max(0.07, Math.min(0.62, CAST.ty * Math.tan(Math.max(4, T.sunEl || 30) * Math.PI / 180)));
  const scr = boxes.map(b => { const y0 = b.y0 || 0, [a, ty] = P(cam, b.x0, y0 + b.h, b.z0), [c, by] = P(cam, b.x1, y0, b.z0); return { b, a, c, ty, by, y0, y1: y0 + b.h }; });
  const byBox = new Map(scr.map(R => [R.b, R]));
  // (lazy: a wall's shadows are worked out when its bake step draws it — the work spreads over the sliced bake, never one long frame)
  const one = R => {
    if (R.c - R.a < 1.5 || R.by - R.ty < 1.5) return undefined;
    const zr = R.b.z0, fz = fog(zr), kr = k * (1 - fz * 0.75), cast = [], ao = [];
    for (const O of scr) {
      const ob = O.b;
      if (O === R || ob.z0 >= zr - 0.5 || ob.tower && ob.tower === R.b.tower) continue;
      // contact occlusion: a nearer box (≤ 30 deep in front) whose roofline cuts across this wall
      if (zr - ob.z0 < 30 && O.ty > R.ty + 1 && O.ty < R.by && O.c > R.a && O.a < R.c) {
        const s = cam.F / zr;
        ao.push({ x0: Math.max(R.a, O.a), x1: Math.min(R.c, O.c), y: O.ty, h: Math.min(O.ty - R.ty, (1.6 + 0.04 * (zr - ob.z0)) * s), a: CAST.ao * kr });
      }
      if (!sd) continue;
      const d0 = zr - ob.z0, d1 = Math.max(0, zr - ob.z1);
      if (d0 > 120) continue;
      // the shadow's top on this wall is the box's top pushed down by the light: nothing to see once it's under the wall's foot
      const top = O.y1 - drop * d1;
      if (top <= R.y0 + 0.3) continue;
      // (cheap first: where the shadow lands across, in the world — most pairs never meet; only then project the 8 corners)
      const s0 = lx * d0, s1 = lx * d1;
      if (ob.x1 + Math.max(s0, s1) <= R.b.x0 || ob.x0 + Math.min(s0, s1) >= R.b.x1) continue;
      const pts = [];
      for (const d of [d0, d1]) for (const [X, Y] of [[ob.x0, O.y0], [ob.x1, O.y0], [ob.x1, O.y1], [ob.x0, O.y1]]) pts.push(P(cam, X + lx * d, Y - drop * d, zr));
      const hull = hull2(pts), xs = hull.map(p => p[0]);
      if (Math.max(...xs) < R.a || Math.min(...xs) > R.c) continue;
      cast.push({ pts: hull, a: CAST.a * kr, pen: Math.min(2.4, 0.3 + 0.035 * d0) * cam.F / zr * 0.5 });
    }
    return cast.length || ao.length ? { cast, ao, a: R.a, c: R.c, ty: R.ty, by: R.by } : undefined;
  };
  const get = b => { if (!out.has(b)) { const R = byBox.get(b); out.set(b, R ? one(R) : undefined); } return out.get(b); };
  return { get, values: () => scr.map(R => get(R.b)).filter(Boolean).values() };
}
const sm01 = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
// the convex hull of a few points (monotone chain)
function hull2(p) {
  const q = p.slice().sort((u, v) => u[0] - v[0] || u[1] - v[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const v of q) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], v) <= 0) lo.pop(); lo.push(v); }
  for (let i = q.length - 1; i >= 0; i--) { const v = q[i]; while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], v) <= 0) up.pop(); up.push(v); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
/** draws a box's cast shadows + contact occlusion onto its front (clipped to it), right after the box */
export function drawCast(x, cs) {
  if (!cs) return;
  x.save(); x.beginPath(); x.rect(cs.a, cs.ty, cs.c - cs.a, cs.by - cs.ty); x.clip();
  x.globalCompositeOperation = 'multiply';
  for (const o of cs.ao) {
    const g = x.createLinearGradient(0, o.y, 0, o.y - o.h);
    g.addColorStop(0, rgb(CAST.aoCol, o.a)); g.addColorStop(1, rgb(CAST.aoCol, 0));
    x.fillStyle = g; x.fillRect(o.x0, o.y - o.h, o.x1 - o.x0, o.h);
  }
  // the penumbra: the shadow four times, a step apart along both axes, each a quarter — soft edges, a solid core
  // (MULTIPLY: the stone darkens + cools the way its own shade side does, and its windows still show through the shadow)
  x.globalCompositeOperation = 'multiply';
  for (const sh of cs.cast) {
    x.fillStyle = rgb(CAST.col, sh.a / 4);
    for (let i = 0; i < 4; i++) {
      const o = (i - 1.5) * sh.pen;
      x.beginPath(); sh.pts.forEach(([u, v], j) => (j ? x.lineTo(u + o, v + o * 0.6) : x.moveTo(u + o, v + o * 0.6))); x.closePath(); x.fill();
    }
  }
  x.restore();
}

/** a haze veil at a band's feet (the distance dissolves): from the ground line up `up` pt, in the haze colour */
export function hazeVeil(x, cam, z, up, T, a) {
  const y = cam.VPY + cam.F * cam.CAMH / z;
  const g = x.createLinearGradient(0, y - up, 0, y + 2);
  g.addColorStop(0, rgb(T.haze, 0)); g.addColorStop(1, rgb(T.haze, a));
  x.fillStyle = g; x.fillRect(0, y - up, cam.W, up + 2);
}
