// CITY 2.0 — THE HARBOR, Part 3: NEON (PURE: no DOM; tests/harbor.test.mjs). docs/harbor.md#neon.
//
//  - flattenPath(): an SVG path (absolute M L H V Q C A Z — the marks' and the tube letters' language) → polylines, so a tube
//    can be lit unevenly along its length (hotter on the bends, dimmer at the electrodes) and its ends + clips found.
//  - THE PALETTE: ~8 neon colours in ROLES (base ~60 % electric blue / cyan / ice white · heat ~30 % the NEON pink + violet,
//    mostly on the hero towers · accent ~10 % amber / signal red / acid green, sparingly); a SCHEME maps the roles to colours
//    (the default; holidays, party nights, CITY CONTROL later swap the scheme, never the roles).
//  - outlines(L): THE NEON OUTLINES on the buildings — world polylines tracing the Art Deco shapes: the hero + landmark towers
//    fully (each tier's edges, the setback ledges, the crown), the middle tier on its rooflines + setbacks, the far bands only as
//    a few faint threads; the needle's spire becomes THE NEON NEEDLE. Never across a word tower's face (only its frame).
//  - signSpots(L): where the city's signs hang (named game signs, icon signs, the hotel's blade, JAZZ, billboards), in world
//    units; assignSigns(): which game takes which spot tonight (a new pick each night, never while you watch).
import { REF_TITLE, cameraFor, fxAt, fOf, project, lighthouseBoxes } from './harbor-layout.js';
import { rngFrom, shuffle } from './rng.js';

export { flattenPath, tubeLight } from './tube-path.js';

// ------------------------------------------------------------------ THE PALETTE + SCHEMES
/** the neon colours (sRGB) */
export const NEON = {
  blue: [46, 123, 255], cyan: [46, 230, 255], ice: [214, 240, 255],          // BASE ~60 %
  pink: [255, 46, 151], violet: [168, 82, 255],                               // HEAT ~30 % (the NEON pink is the logo's glow)
  amber: [255, 176, 46], red: [255, 59, 59], acid: [182, 255, 58],            // ACCENT ~10 %
};
/** a role → a colour name: b0 b1 b2 (base) · h0 h1 (heat) · a0 a1 a2 (accent) */
export const SCHEMES = {
  city: { b0: 'blue', b1: 'cyan', b2: 'ice', h0: 'pink', h1: 'violet', a0: 'amber', a1: 'red', a2: 'acid' },
  // later parts (holidays 11a–c, party nights 10, CITY CONTROL) — the same roles, other colours
  halloween: { b0: [255, 122, 18], b1: [155, 61, 255], b2: [255, 170, 80], h0: [255, 122, 18], h1: [155, 61, 255], a0: [120, 255, 90], a1: [255, 60, 40], a2: [120, 255, 90] },
  christmas: { b0: [255, 40, 60], b1: [24, 220, 110], b2: 'ice', h0: [255, 40, 60], h1: [24, 220, 110], a0: 'amber', a1: [255, 40, 60], a2: [24, 220, 110] },
  july4: { b0: [255, 48, 72], b1: [244, 246, 255], b2: [61, 123, 255], h0: [255, 48, 72], h1: [61, 123, 255], a0: [244, 246, 255], a1: [255, 48, 72], a2: [61, 123, 255] },
  valentine: { b0: [255, 46, 110], b1: [255, 156, 194], b2: [255, 230, 240], h0: [255, 46, 110], h1: [255, 106, 152], a0: [255, 200, 220], a1: 'red', a2: [255, 156, 194] },
  stpatrick: { b0: [24, 224, 112], b1: [168, 255, 207], b2: [230, 255, 240], h0: [43, 255, 134], h1: [24, 180, 90], a0: 'amber', a1: [43, 255, 134], a2: 'acid' },
  nye: { b0: [255, 216, 122], b1: [236, 240, 255], b2: [255, 248, 230], h0: [255, 196, 74], h1: [220, 226, 255], a0: [255, 196, 74], a1: [255, 240, 200], a2: [236, 240, 255] },
  thanksgiving: { b0: [255, 138, 30], b1: [255, 176, 80], b2: [255, 230, 190], h0: [255, 138, 30], h1: [200, 90, 40], a0: 'amber', a1: [220, 70, 40], a2: [255, 200, 100] },
  easter: { b0: [138, 216, 255], b1: [255, 179, 224], b2: [255, 240, 200], h0: [255, 138, 208], h1: [180, 138, 255], a0: [255, 216, 106], a1: [255, 138, 208], a2: [160, 255, 190] },
  party: { b0: 'violet', b1: 'pink', b2: 'cyan', h0: 'pink', h1: 'cyan', a0: 'amber', a1: 'acid', a2: 'ice' },
};
/** a role's colour in a scheme: [r, g, b] */
export function roleColour(role, scheme = 'city') {
  const sc = (typeof scheme === 'object' && scheme) || SCHEMES[scheme] || SCHEMES.city;
  const v = sc[role] ?? SCHEMES.city[role] ?? 'ice';
  return Array.isArray(v) ? v : NEON[v] || NEON.ice;
}
/** the role family of a role: base | heat | accent */
export const roleFamily = r => (r[0] === 'b' ? 'base' : r[0] === 'h' ? 'heat' : 'accent');

// ------------------------------------------------------------------ THE OUTLINES
// Each building gets at most two roles: its main colour and an accent (the crown); neighbours share a family (colour by
// cluster), the heroes carry the heat, the far bands only a few faint threads.
const ROLES = {
  sunburst: ['h0', 'a0'], needle: ['h1', 'h0'], empire: ['b2', 'b0'],
  wordA: ['b1', 'b1'], wordB: ['b1', 'b2'], wordV: ['b0', 'b2'],
  'm-edge': ['b1', 'b1'], 'm-dome': ['b0', 'a0'], 'm-step': ['b0', 'b0'], 'm-twin': ['h1', 'h1'], 'm-right': ['b1', 'a1'],
  glassL: ['b1', 'b1'], glassR: ['b2', 'b2'],
  hotel: ['a1', 'a1'], pulse: ['h1', 'h1'], par: ['b1', 'b1'], jazz: ['a0', 'a0'],
};
/** strength: the brightness hierarchy (tube width in pt at the reference scale, glow, alpha) */
export const STRENGTH = { hero: { w: 1.5, glow: 7, a: 1 }, word: { w: 1.25, glow: 5.5, a: 0.92 }, mid: { w: 1.0, glow: 4.5, a: 0.8 }, quay: { w: 1.1, glow: 5, a: 0.88 }, far: { w: 0.7, glow: 3.2, a: 0.5 }, pano: { w: 1.2, glow: 5.5, a: 0.9 } };

/**
 * The outlines: [{ id, group: 'far'|'near', strength, roles: [main, accent], z, lines: [{ pts: [[x,y,z]…], role, closed?,
 * thin? }], power (the boot-up index group: one per building) }]. World units; the renderer projects them.
 *
 * Part 4 (the owner's review): the outlines FOLLOW THE DECO SHAPES. A tower's outline is one bent tube a side — up the shaft,
 * stepping in at every setback, over the crown's steps when the crown shares its colour, down the other side — so the
 * silhouette reads as stepped, not as stacked rectangles; thin vertical FINS (the Deco piers) run up every tier above the
 * shaft (never where a sign hangs: signRects, host → world rects); the crown is traced by its own shape.
 */
export function outlines(L, signRects = new Map()) {
  const out = [];
  const add = (o) => { if (o.lines.length) out.push(o); };
  const signsOn = id => (signRects instanceof Map ? signRects.get(id) || [] : signRects.has && signRects.has(id) ? [{ x0: -1e9, x1: 1e9, y0: -1e9, y1: 1e9 }] : []);
  // the towers: the heroes + the landmarks + the word towers fully, the middle tier on the setbacks + crowns, the glass towers' roofs
  for (const t of L.towers) {
    const pano = t.rank === 'pano', hero = t.rank === 'hero' || pano, word = t.rank === 'word', mid = t.rank === 'mid', modern = t.rank === 'modern';
    const k = pano ? Math.abs(t.seed) % 4 : 0;
    const roles = ROLES[t.id] || (modern ? ['b1', 'b1'] : pano ? [['b0', 'b1'], ['h0', 'a0'], ['b2', 'b0'], ['h1', 'b1']][k] : ['b0', 'b0']);
    const lines = [], n = t.tiers.length, topT = t.tiers[n - 1];
    if (modern) { const y1 = topT.y0 + topT.h, z = topT.z0 - 0.05; lines.push({ pts: [[topT.x0, y1, z], [topT.x1, y1, z]], role: roles[0] }); }
    else {
      // THE CONTOUR: the heroes + the word towers from up the shaft (the foot is behind the base); the middle tier from its shaft's
      // top (its stepped cap)
      const full = hero || word, left = [], right = [];
      t.tiers.forEach((tr, i) => {
        const y1 = tr.y0 + tr.h, z = tr.z0 - 0.05;
        if (i === 0 && !full) { left.push([tr.x0, y1, z]); right.push([tr.x1, y1, z]); return; }
        const from = i === 0 ? tr.y0 + Math.min(tr.h * 0.45, 30) : tr.y0;
        left.push([tr.x0, from, z], [tr.x0, y1, z]); right.push([tr.x1, from, z], [tr.x1, y1, z]);
      });
      const cr = topT.crown ? crownPath(t, topT) : null;
      const one = cr && cr.path && (roles[1] || roles[0]) === roles[0];
      // one continuous tube when the crown is the building's own colour; else the contour closes over the roof and the crown is its own tube
      const over = one ? cr.path : [[topT.x0, topT.y0 + topT.h, topT.z0 - 0.05], [topT.x1, topT.y0 + topT.h, topT.z0 - 0.05]];
      const pts = dedupe([...left, ...over, ...right.reverse()]);
      if (pts.length > 1) lines.push({ pts, role: roles[0] });
      if (cr) { if (cr.path && !one) lines.push({ pts: cr.path, role: roles[1] || roles[0] }); for (const e of cr.extras) lines.push({ ...e, role: e.needle ? e.role : roles[1] || roles[0] }); }
      // DECO FINS: thin piers up every tier above the shaft (the heroes', the word towers' + the panorama's), never under a sign
      if (full) t.tiers.forEach((tr, i) => {
        if (i === 0) return;
        const w = tr.x1 - tr.x0, z = tr.z0 - 0.05, y0 = tr.y0 + tr.h * 0.08, y1 = tr.y0 + tr.h;
        if (w < 3.2 || signsOn(t.id).some(r => r.y1 > tr.y0 && r.y0 < y1)) return;
        const fr = w >= 9 ? [0.2, 0.4, 0.6, 0.8] : w >= 5.5 ? [0.27, 0.5, 0.73] : [0.34, 0.66];
        for (const f of fr) lines.push({ pts: [[tr.x0 + w * f, y0, z], [tr.x0 + w * f, y1, z]], role: roles[0], thin: true });
      });
    }
    add({ id: t.id, group: t.z0 >= 300 ? 'far' : 'near', strength: hero ? 'hero' : word ? 'word' : modern ? 'far' : pano ? 'pano' : 'mid', roles, z: t.z0, lines });
  }
  // the hero blocks on the quay: their rooflines (their signs are the signs)
  for (const b of L.heroes) add({ id: b.id, group: 'near', strength: 'quay', roles: ROLES[b.id] || ['b0', 'b0'], z: b.z0, lines: [{ pts: [[b.x0, b.h, b.z0 - 0.05], [b.x1, b.h, b.z0 - 0.05]], role: (ROLES[b.id] || ['b0'])[0] }] });
  // the bands: a few faint threads — the roofline of a tall block now and then (by its own dice), colour by cluster
  for (const bd of L.bands) {
    if (bd.id === 'haze') continue;
    const share = bd.id === 'near' ? 0.16 : bd.id === 'mid' ? 0.14 : 0.1;
    const lines = [];
    for (const b of bd.blocks) {
      if (b.cap != null || (b.seed % 1000) / 1000 > share || b.x1 - b.x0 < 4) continue;
      const f = fOf((b.x0 + b.x1) / 2, b.z0), fr = ((f % 1) + 1) % 1;
      const role = fr < 0.3 ? 'b1' : fr < 0.45 ? 'b0' : fr < 0.62 ? 'h1' : fr < 0.8 ? 'b0' : 'b1';
      lines.push({ pts: [[b.x0, b.h, b.z0 - 0.05], [b.x1, b.h, b.z0 - 0.05]], role, z: b.z0, block: b.id });
    }
    add({ id: `threads-${bd.id}`, group: bd.id === 'near' ? 'near' : 'far', strength: bd.id === 'near' ? 'mid' : 'far', roles: ['b0', 'b1'], z: bd.id === 'near' ? 240 : 400, lines, band: bd.id });
  }
  return out;
}
const dedupe = pts => pts.filter((p, i) => !i || Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) > 1e-6);
/** a crown traced (world units; the shapes of blocks.js#crown): path = from the top tier's left roof corner over the crown's
 *  steps to its right one (null when the crown is not a closed silhouette), extras = its other tubes (the sunburst's inner
 *  arch + needle, the mast's antenna, THE NEON NEEDLE) */
function crownPath(t, tr) {
  const c = tr.crown, y = tr.y0 + tr.h, z = tr.z0 - 0.05, cx = (tr.x0 + tr.x1) / 2, hw = (tr.x1 - tr.x0) / 2, H = c.h;
  const extras = [];
  const arc = (rx, ry, yc, n = 14) => { const p = []; for (let i = 0; i <= n; i++) { const a = Math.PI + Math.PI * i / n; p.push([cx + Math.cos(a) * rx, yc - Math.sin(a) * ry, z]); } return p; };
  const L0 = [cx - hw, y, z], R0 = [cx + hw, y, z];
  const sym = (half, apex) => [...half, ...(apex ? [apex] : []), ...half.map(([x, yy]) => [2 * cx - x, yy, z]).reverse()];
  let path = null;
  if (c.t === 'sunburst') {
    path = [L0, ...arc(hw, Math.min(hw * 0.95, H * 0.3), y).slice(1, -1), R0];
    const rx = hw * 0.6; extras.push({ pts: arc(rx, Math.min(rx * 0.95, H * 0.3 * 0.8), y + 2 * H * 0.11) });
    extras.push({ pts: [[cx, y + H * 0.3, z], [cx, y + H, z]] });
  } else if (c.t === 'spire') {
    const bw = hw * 0.62;
    path = [L0, [cx - bw, y, z], [cx, y + H * 0.8, z], [cx + bw, y, z], R0];
    if (t.id === 'needle') extras.push({ pts: [[cx, y - 1, z - 0.1], [cx, y + H + (t.needle || 0), z - 0.1]], role: (ROLES.needle || [])[1], needle: true });
  } else if (c.t === 'mast') {
    const dw = hw * 0.62;
    path = sym([L0, [cx - dw, y, z], [cx - dw, y + H * 0.22, z], [cx - dw * 0.72, y + H * 0.22, z], [cx - dw * 0.72, y + H * 0.42, z], [cx - dw * 0.5, y + H * 0.42, z]], [cx, y + H * 0.78, z]);
    extras.push({ pts: [[cx, y + H * 0.78, z], [cx, y + H, z]] });
  } else if (c.t === 'pyramid') {
    path = [L0, [cx - hw * 0.72, y + H * 0.27, z], [cx - hw * 0.52, y + H * 0.54, z], [cx - hw * 0.3, y + H * 0.81, z], [cx, y + H, z], [cx + hw * 0.3, y + H * 0.81, z], [cx + hw * 0.52, y + H * 0.54, z], [cx + hw * 0.72, y + H * 0.27, z], R0];
  } else if (c.t === 'dome') {
    path = [L0, [cx - hw * 0.82, y, z], ...arc(hw * 0.74, Math.max(0.5, H * 0.62), y), [cx + hw * 0.82, y, z], R0];
  } else if (c.t === 'stepped') {
    const p = [L0];
    for (let i = 0; i < 3; i++) { const w0 = hw * (0.9 - i * 0.24); p.push([cx - w0, y + i * H * 0.24, z], [cx - w0, y + (i + 1) * H * 0.24, z]); }
    path = sym(p);
  } else if (c.t === 'deco') {
    // the word towers' parapet: the full-width bar, the stepped centre (the Deco ziggurat)
    path = sym([L0, [cx - hw, y + H * 0.4, z], [cx - hw * 0.5, y + H * 0.4, z], [cx - hw * 0.5, y + H * 0.75, z], [cx - hw * 0.2, y + H * 0.75, z], [cx - hw * 0.2, y + H, z]]);
  } else if (c.t === 'slant') {
    extras.push({ pts: [[cx - hw, y + H, z], [cx + hw, y + H * 0.25, z]] });
  }
  return { path: path && dedupe(path), extras };
}

// ------------------------------------------------------------------ THE SIGNS' SPOTS
// Designed on the reference phone (402×874, pt: x across, y down the screen) at a depth z — each spot is in front of the
// building it hangs on (its host). Converted to world units once with the reference camera, so every upright phone shows the
// same signs scaled to its width (like the skyline) and a wide screen keeps them in its centre group. Checked against the
// layout (tests): on screen, never over a word face, the wheel, the lighthouse or the sign; clear of each other; nothing
// nearer in front.
//   kind: named (a game's NAME + mark; cap = the longest name it takes) · icon (a game's tube mark) · fixed (HOTEL, JAZZ) ·
//   billboard (painted, gooseneck lamps; CITY CONTROL changes what it shows). type: vbox (vertical) · box · icon · script.
// Part 4 (the owner's review): the icons are ~20–21 pt (they read at a glance; were 11–18) and stand on the calm walls — the
// near band's corners left and right, under the word tower, on JAZZ + PAR — never in the busy centre (the NEON NEEDLE, the
// sunburst's sign, the wheel, the HOTEL blade breathe), never on the construction tower's spot (wordV, behind JAZZ); the
// billboard is half as big again (66×32) on the left near band's wall.
export const SPOTS = [
  { id: 'n-roof', kind: 'named', type: 'box', host: 'near', mount: 'roof', x: [23, 71], y: [458, 478], z: 240, cap: 9 },
  { id: 'n-par', kind: 'named', type: 'vbox', host: 'par', x: [294.5, 305], y: [494, 545], z: 233.6, cap: 6 },
  { id: 'n-empire', kind: 'named', type: 'vbox', host: 'empire', x: [38, 49], y: [418, 455], z: 265.4, cap: 5 },
  // Part 6a (the owner's SIGN PLACEMENT RULE: no sign covers a hero tower's face or outline): the sunburst's named sign is gone
  // and the HOTEL blade with it (its thin letters didn't read) — THE GAME BLADE takes the hotel's spot: a projecting vertical
  // cabinet with chasing bulbs, tonight's game (≤ 6 letters: they stand ~9 pt tall on a phone, the glance test)
  { id: 'n-blade', kind: 'named', type: 'vbox', host: 'hotel', bulbs: true, x: [248.5, 264.5], y: [475.5, 546], z: 229.4, cap: 6 },
  { id: 'jazz', kind: 'fixed', type: 'script', host: 'jazz', text: 'JAZZ', col: [255, 176, 46], x: [74, 100], y: [494, 506], z: 229.4 },
  { id: 'i-par', kind: 'icon', type: 'icon', host: 'par', x: [309, 329], y: [493, 513], z: 233.6 },
  { id: 'i-jazz', kind: 'icon', type: 'icon', host: 'jazz', x: [77, 98], y: [509, 530], z: 229.4 },
  { id: 'i-left', kind: 'icon', type: 'icon', host: 'near', mount: 'roof', x: [1, 21], y: [459, 479], z: 238 },
  { id: 'i-c1', kind: 'icon', type: 'icon', host: 'near', mount: 'wall', x: [266, 286], y: [492, 512], z: 232.1 },
  { id: 'i-r1', kind: 'icon', type: 'icon', host: 'near', mount: 'wall', x: [356, 377], y: [494, 515], z: 235.1 },
  { id: 'i-r2', kind: 'icon', type: 'icon', host: 'near', mount: 'wall', x: [380, 401], y: [524, 545], z: 235.1 },
  // Part 5 (the owner's call): two NAMED ROOF SIGNS on the word towers' roofs, in the open sky above their crowns (they took
  // i-c2 + i-par2 off the crowded right wall) — under the skyline limit, out of the sun corridors, the towers' beacons on top
  // of their frames; while a tower spells a word its roof sign dims (the message is the star). Placed from the tower's own
  // top roof (towerRoofSign), not from reference pt: wpt × hpt is the cabinet at the reference scale.
  { id: 'n-roofA', kind: 'named', type: 'box', host: 'wordA', mount: 'tower', wpt: 52, hpt: 18, cap: 7 },
  { id: 'n-roofB', kind: 'named', type: 'box', host: 'wordB', mount: 'tower', wpt: 52, hpt: 18, cap: 7 },
  { id: 'bb-left', kind: 'billboard', type: 'billboard', host: 'near', mount: 'wall', x: [3, 69], y: [490, 522], z: 233.1, show: 'rum' },
];
let refCam = null;
const ref = () => refCam || (refCam = cameraFor(REF_TITLE.W, REF_TITLE.H, { tag: REF_TITLE.tag, dock: REF_TITLE.dock }, REF_TITLE.safe));
/** a spot in world units: { x0, x1, y0 (bottom), y1 (top), z } */
export function spotWorld(sp) {
  const c = ref(), X = sx => (sx - c.VPX) * sp.z / c.F, Y = sy => c.CAMH - (sy - c.VPY) * sp.z / c.F;
  return { x0: X(sp.x[0]), x1: X(sp.x[1]), y0: Y(sp.y[1]), y1: Y(sp.y[0]), z: sp.z };
}
/**
 * The spots for a layout: the reference phone's, in world units (+ on a panorama, a named vertical sign on every other extra
 * tower and named roof signs along the near band, so every game gets its name on a wide screen). Each: { ...spot, w: world
 * rect, rect: screen rect (pt) }.
 */
export function signSpots(L, { all = false } = {}) {
  const cam = L.cam, out = SPOTS.map(sp => ({ ...sp, w: sp.mount === 'tower' ? towerRoofSign(L, sp) : spotWorld(sp) })).filter(sp => sp.w);
  // a sign on a tower hangs down the middle of its shaft, never past a setback: centred on the tower, as wide as the narrowest
  // tier it crosses allows
  for (const sp of out) {
    const t = L.towers.find(tt => tt.id === sp.host);
    if (!t || sp.type !== 'vbox') continue;
    const cross = t.tiers.filter(tr => tr.y0 < sp.w.y1 && tr.y0 + tr.h > sp.w.y0);
    if (!cross.length) continue;
    const minW = Math.min(...cross.map(tr => tr.x1 - tr.x0)), cx = (t.tiers[0].x0 + t.tiers[0].x1) / 2, ww = Math.min(sp.w.x1 - sp.w.x0, minW - 1.6);
    sp.w = { ...sp.w, x0: cx - ww / 2, x1: cx + ww / 2, z: cross[cross.length - 1].z0 - 0.4 };
  }
  const rectOf = w => { const [a, b] = project(cam, w.x0, w.y1, w.z), [c, d] = project(cam, w.x1, w.y0, w.z); return { x: a, y: b, w: c - a, h: d - b }; };
  if (cam.wide) {
    // the panorama's towers: a named vertical sign on each, from above the near band's roofs in front of it up the shaft
    const base = [...L.bands.find(b => b.id === 'near').blocks, ...L.heroes];
    let i = 0;
    for (const t of L.towers.filter(t => t.rank === 'pano')) {
      // (on the shaft: the highest tier the sign still fits inside, so it never hangs past a setback)
      const sw = Math.min(4.8, (t.tiers[0].x1 - t.tiers[0].x0) * 0.36), zz = t.tiers[0].z0 - 0.6;
      const inner = t.tiers.filter(q => q.x1 - q.x0 >= sw * 1.5), tr = inner[inner.length - 1] || t.tiers[0], w = tr.x1 - tr.x0, x = tr.x0 + w * (t.x0 < 0 ? 0.72 : 0.28);
      const [sa] = project(cam, x - sw / 2, 0, zz), [sb] = project(cam, x + sw / 2, 0, zz);
      let top = groundOf(cam, zz);
      for (const b of base) { const p = Math.min(project(cam, b.x0, 0, b.z0)[0], project(cam, b.x0, 0, b.z1)[0]), [q0, y] = project(cam, b.x1, b.h, b.z0), q = Math.max(q0, project(cam, b.x1, 0, b.z1)[0]); if (q > sa - 2 && p < sb + 2) top = Math.min(top, y); }
      const y0 = cam.CAMH - (top - 8 - cam.VPY) * zz / cam.F, y1 = Math.min(y0 + sw * 7.6, tr.y0 + tr.h - 1.5);
      if (y1 - y0 > sw * 3.2) out.push({ id: `n-pano${i++}`, kind: 'named', type: 'vbox', host: t.id, cap: Math.floor((y1 - y0) / (sw * 0.78)), w: { x0: x - sw / 2, x1: x + sw / 2, y0, y1, z: zz } });
    }
  }
  for (const s of out) s.rect = rectOf(s.w);
  // on a wide screen the near band is its own (generated across the width): a phone's spot that ends up hidden there is
  // dropped (the panorama's named signs take the games); on a phone every spot is clear (tested)
  return out.filter(s => s.rect.x + s.rect.w > -2 && s.rect.x < cam.W + 2 && (all || !cam.wide || !spotConflicts(L, s, out).length));
}
const groundOf = (cam, z) => cam.VPY + cam.F * cam.CAMH / z;
const ovr = (a, b, m = 0) => a.x < b.x + b.w + m && b.x < a.x + a.w + m && a.y < b.y + b.h + m && b.y < a.y + a.h + m;
/** the margin (pt) a roof sign keeps from a sun corridor's edge */
export const CORRIDOR_PAD = 3;
/**
 * A NAMED ROOF SIGN on a tower's top roof (Part 5): its cabinet in world units { x0, x1, y0, y1, z, roof, legs: [x0, x1],
 * beacon: [x, y] } — centred over the roof, in the open sky above the crown (a clearance over the crown's tip for the frame),
 * narrowed so it keeps CORRIDOR_PAD pt clear of every sun corridor, shrunk so its beacon stays under the skyline limit; null
 * when it cannot stand there (less than 60 % of its width or height left).
 */
export function towerRoofSign(L, sp) {
  const cam = L.cam, t = L.towers.find(tt => tt.id === sp.host);
  if (!t || !t.tiers) return null;
  const top = t.tiers[t.tiers.length - 1], roof = top.y0 + top.h, z = top.z0 + Math.min(1.2, (top.z1 - top.z0) * 0.4);
  const crownH = top.crown ? top.crown.h : t.crown ? t.crown.h : 0;
  const u = z / 600;                                  // world units per reference pt at this depth (the city's scale)
  const w = sp.wpt * u;
  let h = sp.hpt * u;
  const cx = (top.x0 + top.x1) / 2;
  let x0 = cx - w / 2, x1 = cx + w / 2;
  // out of the sun corridors (screen): trim the side that reaches into one, then the other side to match (centred on the roof)
  const sxOf = x => project(cam, x, 0, z)[0], xOf = sx => (sx - cam.VPX) * z / cam.F;
  for (const g of L.gaps || []) {
    const a = g.sx - g.w / 2 - CORRIDOR_PAD, b = g.sx + g.w / 2 + CORRIDOR_PAD;
    if (sxOf(x1) <= a || sxOf(x0) >= b) continue;
    if (g.sx < sxOf(cx)) x0 = Math.max(x0, xOf(b)); else x1 = Math.min(x1, xOf(a));
  }
  const half = Math.min(cx - x0, x1 - cx); x0 = cx - half; x1 = cx + half;
  if (x1 - x0 < w * 0.6) return null;
  // the frame lifts it 4 ref pt over the crown's tip; the beacon's post (3 ref pt) stays under the skyline limit
  const y0 = roof + crownH + 4 * u, post = 3 * u;
  const yLimit = cam.CAMH - (cam.limitY + 2 - cam.VPY) * z / cam.F;          // the world height whose top lands on the limit
  if (y0 + h + post > yLimit) h = yLimit - post - y0;
  if (h < sp.hpt * u * 0.6) return null;
  return { x0, x1, y0, y1: y0 + h, z, roof, legs: [top.x0 + 0.4, top.x1 - 0.4], beacon: [cx, y0 + h + post] };
}

/** what a spot conflicts with (→ [] when it is clear): off screen, a word face, the lighthouse, the wheel (an icon may sit
 *  behind its spokes), another spot, anything nearer standing in front of it */
export function spotConflicts(L, sp, spots = []) {
  const cam = L.cam, R = sp.rect, P = (x, y, z) => project(cam, x, y, z), bad = [];
  const rectOf = (x0, x1, y0, y1, z) => { const [a, b] = P(x0, y1, z), [c, d] = P(x1, y0, z); return { x: a, y: b, w: c - a, h: d - b }; };
  if (R.x < 0 || R.x + R.w > cam.W) bad.push('off screen');
  for (const t of L.towers) if (t.word && t.face) { const tr = t.tiers[0], f = rectOf(tr.x0, tr.x1, 0, tr.y0 + tr.h, tr.z0); f.h = t.face.y - f.y; if (ovr(R, f, 1)) bad.push(`the ${t.id} face`); }
  for (const b of lighthouseBoxes(L.lighthouse)) if (ovr(R, rectOf(b.x0, b.x1, b.y0, b.y1, b.z0), 1)) { bad.push('the lighthouse'); break; }
  const w = L.wheel, [cx, cy] = P(w.x, w.y, w.z), r = cam.F * w.r / w.z;
  if (sp.kind !== 'icon' && Math.hypot(Math.max(R.x - cx, 0, cx - (R.x + R.w)), Math.max(R.y - cy, 0, cy - (R.y + R.h))) < r + 2) bad.push('the wheel');
  for (const o of spots) if (o !== sp && o.rect && ovr(R, o.rect, 1)) bad.push(o.id);
  for (const o of [...L.bands.flatMap(b => b.blocks), ...L.heroes, ...L.towers.flatMap(t => t.tiers.map(tr => ({ ...tr, id: t.id })))]) {
    if (o.z0 >= sp.w.z - 0.01 || o.id === sp.host) continue;
    if (ovr(R, rectOf(o.x0, o.x1, o.y0 || 0, (o.y0 || 0) + o.h + (o.crown ? o.crown.h : 0), o.z0), -0.5)) bad.push(`hidden by ${o.id}`);
  }
  return bad;
}

/** tonight's key: the local date of the evening (before noon it is still last night) — the pick changes by day, unlit */
export function nightKey(local) {
  if (!local) return 'x';
  const d = new Date(Date.UTC(local.y, local.m - 1, local.d) - (local.h < 12 ? 86400000 : 0));
  return d.toISOString().slice(0, 10);
}

/**
 * Which game takes which spot tonight. games: [{ id, name, short }] (short: the name a sign spells — the blade word); spots:
 * signSpots(). A new shuffle each night (key): the named spots get the first games whose name fits (cap), the icon spots the
 * rest in order — every game has a sign while there are spots enough (12 games: 4 named + 8 icons on a phone); a game list
 * that grows or shrinks just fills more or fewer spots (an empty spot hangs nothing). → Map(spot id → game id).
 */
export function assignSigns(games, spots, key = 'x') {
  const R = rngFrom(`signs|${key}`);
  const order = shuffle(R, games.map(g => g.id));
  const byId = new Map(games.map(g => [g.id, g]));
  const out = new Map(), used = new Set();
  const named = spots.filter(s => s.kind === 'named'), icons = spots.filter(s => s.kind === 'icon');
  // the named spots, the wide/long ones first (they take the long names)
  for (const s of [...named].sort((a, b) => (b.cap || 0) - (a.cap || 0))) {
    const g = order.find(id => !used.has(id) && (byId.get(id).short || '').replace(/ /g, '').length <= (s.cap || 99));
    if (g) { out.set(s.id, g); used.add(g); }
  }
  for (const s of icons) { const g = order.find(id => !used.has(id)); if (g) { out.set(s.id, g); used.add(g); } }
  return out;
}
export { fxAt };
