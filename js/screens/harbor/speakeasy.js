// CITY 2.0 — THE HARBOR, PART 7a: THE SPEAKEASY — the closest, biggest building on screen, so the most crafted thing in the city.
// A once-grand 1920s Deco corner building over warm brick (cream terracotta trim, a carved cornice, spandrel panels, a stepped
// crest), cozy and a bit worn (soot + rain streaks, chipped terracotta, faded gilt, ivy on the corner, a patched awning), its
// BARBERSHOP front the cover (the big window with the chair + the mirror wall + gold-leaf lettering, the turning pole, the
// "EST. 1924" awning, the unmarked side door), ONE quiet hint of the secret (the basement window's amber glow, even by day), and
// on its side wall a weekly GHOST AD for one of our games under three gooseneck lamps (core/harbor-speakeasy.js: the plan).
//
// HOW IT'S DRAWN — every wall is PAINTED FLAT in its own units (u across, v up; the same material system as the skyline: blocks.js
// #faces, the real sun's side + height, the day / golden / night tones) and projected: the front faces us (one affine map), the
// side wall recedes (perspective, one source column per device pixel — exact for a vertical wall). Baked per look into 'stage'
// (speakeasySteps, in small steps); what changes at night is LIVE (createSpeakeasy): the windows' rooms lit (one cached canvas,
// re-rendered only when a window's light changes), their glow on the brick, the shop's one lamp, the sconce, the basement's amber,
// the ad's lamps, the barber pole turning. HOOKS for 7b: windows() (each window's rect + room), light(id, k), mirror(k).
import { project } from '../../core/harbor-layout.js';
import { SPEAK_V, ROOMS, roomLight } from '../../core/harbor-speakeasy.js';
import { rngFrom } from '../../core/rng.js';
import { rgb, mix, shade, box, poly } from './shapes.js';
import { faces } from './blocks.js';
import { safeCtx } from '../../ui/canvas-safe.js';
import { dayPaint, drawGooseneck, LAMP_C } from './signs.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const tri = (T, d, g, n) => [0, 1, 2].map(i => d[i] * (T.day || 0) + g[i] * (T.gold || 0) + n[i] * (T.night || 0));
const FONT = (px, w = 700) => `${w} ${px}px "Chakra Petch", Orbitron, sans-serif`;
const V = SPEAK_V;
const W_FRONT = 11.2;
const GLASS_IN = 0.16;                   // a window's recess (exaggerated a little: the jamb reads as depth at phone size)

// ------------------------------------------------------------------ geometry
/** the building on screen: the front's affine map, the side wall's perspective, the inverse for the strips */
export function speakGeo(L) {
  const cam = L.cam, s = L.speakeasy;
  const K = cam.F / s.z0;
  const front = (u, v) => project(cam, s.x0 + u, v, s.z0);
  const len = Math.hypot(s.side.x - s.x1, s.side.z - s.z0), dx = (s.side.x - s.x1) / len, dz = (s.side.z - s.z0) / len;
  const side = (w, v, out = 0) => project(cam, s.x1 + w * dx + out * dz, v, s.z0 + w * dz - out * dx);
  const wAt = sx => { const X = sx - cam.VPX; return (X * s.z0 - cam.F * s.x1) / (cam.F * dx - X * dz); };
  return { cam, s, K, front, side, len, dx, dz, wAt, zAt: w => s.z0 + w * dz, turned: !!s.turned };
}

// ------------------------------------------------------------------ the materials for a look
function mats(T) {
  const br = faces(T, 'brick', 44), tc = faces(T, 'cream', 44), gr = faces(T, 'granite', 44);
  const sd = T.sunDir || 0, ov = T.ovc || 0;
  // the side wall (facing west, to the right): lit by an afternoon sun, in shade in the morning, a calm step darker at noon
  const sideOf = f => (sd > 0.05 ? mix(f.front, f.lit, Math.min(1, sd) * (1 - ov * 0.7)) : mix(f.front, f.dark, Math.max(0.42, -sd) * (1 - ov * 0.5)));
  const warm = tri(T, [255, 232, 196], [255, 178, 110], [70, 60, 96]);
  return {
    T, sd, day: T.day || 0, gold: T.gold || 0, night: T.night || 0, ov,
    brick: br.front, brickS: sideOf(br), trim: mix(tc.front, br.front, 0.4 * (T.night || 0)), trimS: mix(sideOf(tc), sideOf(br), 0.4 * (T.night || 0)), stone: gr.front, stoneS: sideOf(gr),
    trimHi: mix(tc.front, tri(T, [255, 250, 236], [255, 214, 160], [70, 64, 96]), 0.55), trimLo: shade(tc.front, -0.28),
    frame: tri(T, [30, 54, 46], [40, 40, 40], [11, 12, 22]), frameHi: tri(T, [86, 120, 100], [120, 96, 70], [26, 26, 42]),
    gilt: tri(T, [214, 168, 78], [236, 176, 90], [86, 70, 58]), giltHi: tri(T, [255, 232, 160], [255, 214, 140], [120, 100, 80]),
    giltLo: tri(T, [128, 86, 34], [140, 80, 40], [40, 30, 34]),
    glassTop: T.skyHi ? mix(T.skyHi, [236, 242, 250], 0.25 * (T.day || 0)) : tri(T, [150, 180, 214], [214, 150, 120], [24, 22, 44]),
    glassLo: T.skyLo ? shade(T.skyLo, -0.35) : tri(T, [70, 90, 120], [120, 80, 80], [10, 10, 24]),
    inside: tri(T, [34, 30, 36], [40, 28, 32], [8, 7, 16]),
    blind: tri(T, [232, 220, 192], [240, 196, 150], [36, 30, 44]), wood: tri(T, [74, 46, 32], [84, 46, 34], [18, 13, 20]),
    awnR: tri(T, [172, 42, 46], [190, 56, 50], [52, 18, 30]), awnC: tri(T, [232, 220, 194], [244, 196, 150], [52, 44, 58]),
    iron: tri(T, [32, 32, 38], [30, 26, 30], [10, 10, 18]), warm, soot: tri(T, [36, 24, 22], [40, 22, 22], [6, 4, 10]),
  };
}

// ------------------------------------------------------------------ painting helpers (in wall units, v up)
function wallMap(x, ox, oy, k) { x.transform(k, 0, 0, -k, ox, oy); }
const R = (x, u0, v0, u1, v1, col, a = 1) => { if (col != null) x.fillStyle = typeof col === 'string' ? col : rgb(col, a); x.fillRect(u0, v0, u1 - u0, v1 - v0); };
function devRect(x, u0, v0, u1, v1) {
  const m = x.getTransform(), p = (u, v) => [m.a * u + m.c * v + m.e, m.b * u + m.d * v + m.f];
  const [ax, ay] = p(u0, v0), [bx, by] = p(u1, v1);
  return [Math.min(ax, bx), Math.min(ay, by), Math.abs(bx - ax), Math.abs(by - ay)];
}
function fillPat(x, pat, u0, v0, u1, v1) { const r = devRect(x, u0, v0, u1, v1); x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = pat; x.fillRect(Math.round(r[0]), Math.round(r[1]), Math.round(r[2]), Math.round(r[3])); x.restore(); }
/** text in wall units (v up): centred at (u, v) baseline, size in units */
function text(x, s, u, v, size, { fill, stroke = null, lw = 0, align = 'center', sq = 1, font = FONT, rot = 0 } = {}) {
  x.save(); x.translate(u, v); x.scale(1, -1); if (rot) x.rotate(rot); x.scale(sq / 100, 1 / 100);
  x.font = font(size * 100); x.textAlign = align; x.textBaseline = 'alphabetic';
  if (stroke) { x.lineJoin = 'round'; x.strokeStyle = stroke; x.lineWidth = lw * 100; x.strokeText(s, 0, 0); }
  if (fill) { x.fillStyle = fill; x.fillText(s, 0, 0); }
  x.restore();
}
/** the brick: a tile of courses (device px) with every brick its own kiln colour; the mortar a muted tint of the brick */
function brickTile(base, ch, bl, seed, night) {
  const cols = 16, rows = 16, cv = document.createElement('canvas'); cv.width = cols * bl; cv.height = rows * ch;
  const x = safeCtx(cv), r = rngFrom(seed);
  x.fillStyle = rgb(mix(base, night ? [30, 28, 40] : [150, 138, 124], night ? 0.25 : 0.42)); x.fillRect(0, 0, cv.width, cv.height);
  for (let j = 0; j < rows; j++) {
    const row = Array.from({ length: cols }, () => { const q = r(); let c = shade(base, (r() - 0.5) * 0.2); if (q < 0.05) c = shade(c, -0.24); else if (q < 0.1) c = mix(c, [214, 150, 108], 0.22); else if (q < 0.17) c = mix(c, [112, 52, 44], 0.25); else if (q < 0.22) c = mix(c, [150, 96, 70], 0.2); return c; });
    const off = (j % 2) * (bl >> 1);
    for (let i = -1; i <= cols; i++) {
      const c = row[(i + cols) % cols];
      x.fillStyle = rgb(c); x.fillRect(i * bl + off, j * ch, bl - 1, ch - 1);
      // (a lighter top edge on each brick by day: the course reads as relief, not lines)
      if (!night && ch >= 3) { x.fillStyle = rgb(shade(c, 0.1)); x.fillRect(i * bl + off, j * ch, bl - 1, 1); }
    }
  }
  return cv;
}
/** a soft vertical streak (soot / rain) from (u, v) down `len` */
function streak(x, u, v, w, len, col, a) {
  const g = x.createLinearGradient(0, v, 0, v - len);
  g.addColorStop(0, rgb(col, a)); g.addColorStop(1, rgb(col, 0));
  x.fillStyle = g; x.fillRect(u - w / 2, v - len, w, len);
}
/** a carved Deco fan (a sunburst relief) in a panel */
function fan(x, cx, cy, r, n, hi, lo, a0 = 0, a1 = Math.PI) {
  for (let i = 0; i < n; i++) {
    const t0 = a0 + (a1 - a0) * i / n, t1 = a0 + (a1 - a0) * (i + 0.55) / n;
    x.fillStyle = rgb(i % 2 ? lo : hi);
    x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(t0) * r, cy + Math.sin(t0) * r); x.lineTo(cx + Math.cos(t1) * r, cy + Math.sin(t1) * r); x.closePath(); x.fill();
  }
}
/** a carved chevron frieze along a band */
function chevrons(x, u0, u1, v0, v1, hi, lo, pitch) {
  const h = v1 - v0;
  x.lineWidth = h * 0.16; x.lineJoin = 'miter';
  for (const [col, dv] of [[lo, -h * 0.07], [hi, 0]]) {
    x.strokeStyle = rgb(col); x.beginPath();
    for (let u = u0, i = 0; u <= u1 + 1e-6; u += pitch / 2, i++) { const v = (i % 2 ? v0 + h * 0.25 : v1 - h * 0.25) + dv; if (i) x.lineTo(u, v); else x.moveTo(u, v); }
    x.stroke();
  }
}

// ------------------------------------------------------------------ THE WALLS (flat paintings)
/** the brick field + the Deco structure of a wall: plinth, belt course, spandrels, cornice + dentils, parapet + coping; side:
 *  the side wall's run (its ghost ad comes separately) */
function paintStructure(x, M, o) {
  const { u0, u1, side, pat, front } = o;
  const brick = side ? M.brickS : M.brick, trim = side ? M.trimS : M.trim, stone = side ? M.stoneS : M.stone;
  const hi = mix(trim, M.trimHi, side ? 0.35 : 1), lo = side ? shade(trim, -0.3) : M.trimLo;
  const r = rngFrom(side ? 77 : 41);
  // the brick, in batches (a floor's courses + a bay's a slightly different kiln run)
  fillPat(x, pat, u0, V.plinth, u1, V.parapet);
  for (let v = V.plinth; v < V.parapet; v += 1.15) for (let u = u0; u < u1; u += 1.6 + r() * 1.4) R(x, u, v, Math.min(u1, u + 1.6 + r()), Math.min(V.parapet, v + 1.15), r() < 0.5 ? [255, 210, 170] : [60, 20, 20], 0.035 + r() * 0.04);
  // the granite plinth: rusticated blocks, a lit water table on top, its shadow on the brick
  R(x, u0, 0, u1, V.plinth, stone);
  x.fillStyle = rgb(shade(stone, -0.32)); for (let u = u0 + 0.4; u < u1; u += 1.15) x.fillRect(u, 0, 0.035, V.plinth);
  R(x, u0, 0.27, u1, 0.3, shade(stone, -0.3));
  R(x, u0, V.plinth - 0.07, u1, V.plinth, mix(stone, [255, 250, 240], 0.25 * (1 - M.night)));
  R(x, u0, V.plinth, u1, V.plinth + 0.09, M.soot, 0.25);
  // the belt course over the ground floor: a terracotta band with a carved chevron frieze, its drip's shadow under it
  R(x, u0, V.ground, u1, V.belt, trim);
  chevrons(x, u0, u1, V.ground + 0.08, V.belt - 0.1, hi, lo, 0.42);
  R(x, u0, V.belt - 0.06, u1, V.belt, hi);
  R(x, u0, V.ground - 0.14, u1, V.ground, M.soot, 0.3);
  // the frieze under the cornice + the cornice: dentils, the crown moulding (its top lit, a deep shadow line under it)
  const [c0, c1] = V.cornice;
  R(x, u0, c0, u1, c0 + 0.3, trim);
  x.fillStyle = rgb(lo); for (let u = u0 + 0.06; u < u1; u += 0.24) x.fillRect(u, c0 + 0.05, 0.12, 0.17);
  R(x, u0, c0 + 0.3, u1, c1, hi);
  R(x, u0, c0 + 0.3, u1, c0 + 0.37, shade(lo, -0.25));
  R(x, u0, c1 - 0.06, u1, c1, mix(hi, [255, 255, 255], 0.3 * (1 - M.night)));
  // the cornice's shadow on the brick below it (deeper with a high sun; soft under cloud)
  { const dd = (0.18 + 0.3 * clamp01(((M.T.sunEl || 30) - 6) / 40)) * (1 - 0.6 * M.ov) * (M.day + M.gold * 0.6), g = x.createLinearGradient(0, c0, 0, c0 - 0.2 - dd * 2);
    g.addColorStop(0, rgb(M.soot, 0.55 * (M.day + M.gold) + 0.2 * M.night)); g.addColorStop(1, rgb(M.soot, 0)); x.fillStyle = g; x.fillRect(u0, c0 - 0.2 - dd * 2, u1 - u0, 0.2 + dd * 2); }
  // the parapet: brick, a terracotta coping (lit top), sunk panels
  R(x, u0, V.parapet - 0.16, u1, V.parapet, hi);
  R(x, u0, V.parapet - 0.2, u1, V.parapet - 0.16, lo);
  return { brick, trim, hi, lo, stone };
}

/** THE FRONT (u 0 … 11.2): piers + spandrels + the crest over the structure */
function paintFrontDeco(x, M, P) {
  const { hi, lo, trim } = P, win = [[1.0, 2.9], [4.2, 6.1], [7.4, 9.3]], rows = V.rows;
  const sd = M.sd;
  // the Deco PIERS between the bays (brick, brought forward: a lit edge toward the light, a shade edge away; terracotta capitals)
  for (const [a, b] of [[-0.4, 1.0], [2.9, 4.2], [6.1, 7.4], [9.3, 11.2]]) {
    const lit = mix(M.brick, [255, 230, 200], 0.18 * (M.day + M.gold)), dk = shade(M.brick, -0.22);
    R(x, a, V.belt, a + 0.06, V.cornice[0], sd >= 0 ? dk : lit, 0.8);
    R(x, b - 0.06, V.belt, b, V.cornice[0], sd >= 0 ? lit : dk, 0.8);
    // the capital: a stepped terracotta block with a little fan, where the pier meets the frieze
    const m = (a + b) / 2, hw = Math.min(0.55, (b - a) / 2 - 0.05);
    R(x, m - hw, V.cornice[0] - 0.42, m + hw, V.cornice[0], trim);
    R(x, m - hw * 0.7, V.cornice[0] - 0.62, m + hw * 0.7, V.cornice[0] - 0.42, trim);
    fan(x, m, V.cornice[0] - 0.42, hw * 0.85, 7, hi, lo, 0, Math.PI);
    R(x, m - hw, V.cornice[0] - 0.46, m + hw, V.cornice[0] - 0.42, lo);
  }
  // the CORNER: stone QUOINS (alternating long + short blocks up the corner pier), their joints
  for (let v = V.belt, i = 0; v < V.cornice[0] - 0.7; v += 0.42, i++) {
    const w = i % 2 ? 0.42 : 0.7;
    R(x, W_FRONT - w, v + 0.03, W_FRONT, v + 0.39, trim);
    R(x, W_FRONT - w, v + 0.03, W_FRONT - w + 0.04, v + 0.39, lo);
    R(x, W_FRONT - w, v + 0.35, W_FRONT, v + 0.39, lo);
  }
  // the SPANDRELS between the floors (carved terracotta panels: a raised border, a fan, chevron wings) + the lintels over each
  // window (a SOLDIER course: bricks on end) + the sills (projecting terracotta)
  for (const [a, b] of win) {
    const s0 = rows[0][1] + 0.12, s1 = rows[1][0] - 0.12;
    R(x, a - 0.08, s0, b + 0.08, s1, trim);
    R(x, a - 0.08, s0, b + 0.08, s0 + 0.05, lo); R(x, a - 0.08, s1 - 0.05, b + 0.08, s1, hi);
    R(x, a + 0.05, s0 + 0.09, b - 0.05, s1 - 0.09, mix(trim, lo, 0.35));
    fan(x, (a + b) / 2, s0 + 0.1, (s1 - s0) * 0.78, 9, hi, lo, 0, Math.PI);
    chevrons(x, a + 0.1, (a + b) / 2 - 0.5, s0 + 0.16, s1 - 0.16, hi, lo, 0.3);
    chevrons(x, (a + b) / 2 + 0.5, b - 0.1, s0 + 0.16, s1 - 0.16, hi, lo, 0.3);
    for (const [r0, r1] of rows) {
      // the soldier course over the opening (vertical bricks: their joints)
      R(x, a - 0.06, r1 + GLASS_IN * 0, b + 0.06, r1 + 0.26, shade(M.brick, -0.08));
      x.fillStyle = rgb(shade(M.brick, -0.32)); for (let u = a - 0.06; u < b + 0.06; u += 0.13) x.fillRect(u, r1, 0.025, 0.26);
      R(x, a - 0.06, r1 + 0.24, b + 0.06, r1 + 0.27, shade(M.brick, -0.3));
      // the sill: a terracotta slab, its lit top, its shadow on the brick under it
      R(x, a - 0.16, r0 - 0.16, b + 0.16, r0, trim); R(x, a - 0.16, r0 - 0.03, b + 0.16, r0, hi);
      R(x, a - 0.12, r0 - 0.26, b + 0.12, r0 - 0.16, M.soot, 0.28 * (M.day + M.gold) + 0.15);
    }
  }
  // THE CREST: a stepped Deco ziggurat over the middle bay, a sunburst relief, the pier finials
  const cm = 5.6;
  for (const [hw, v0, v1] of [[1.38, V.parapet - 0.02, V.parapet + 0.3], [0.9, V.parapet + 0.3, V.parapet + 0.55], [0.42, V.parapet + 0.55, V.crest]]) {
    R(x, cm - hw, v0, cm + hw, v1, shade(M.brick, -0.04)); R(x, cm - hw - 0.04, v1 - 0.1, cm + hw + 0.04, v1, trim); R(x, cm - hw - 0.04, v1 - 0.03, cm + hw + 0.04, v1, hi);
    R(x, cm + hw - 0.05, v0, cm + hw, v1 - 0.1, sd >= 0 ? shade(M.brick, -0.3) : mix(M.brick, hi, 0.3));
  }
  x.fillStyle = rgb(trim); x.beginPath(); x.arc(cm, V.parapet + 0.02, 0.52, 0, Math.PI); x.fill();
  fan(x, cm, V.parapet + 0.02, 0.46, 9, mix(trim, hi, 0.5), shade(trim, -0.16), 0, Math.PI);
  x.fillStyle = rgb(M.gilt); x.beginPath(); x.arc(cm, V.parapet + 0.02, 0.12, 0, Math.PI); x.fill();
  for (const u of [3.55, 6.75, 9.95]) { R(x, u - 0.24, V.parapet - 0.02, u + 0.24, V.parapet + 0.18, trim); R(x, u - 0.13, V.parapet + 0.18, u + 0.13, V.parapet + 0.32, trim); R(x, u - 0.24, V.parapet + 0.14, u + 0.24, V.parapet + 0.18, hi); }
}

/** an upper window, by day (the sky in the glass, a shade at its height, curtains) or dark (the night's base: the lit layer
 *  paints the room over it) */
function paintWindow(x, M, a, b, r0, r1, o) {
  const night = M.night > 0.5, sd = M.sd;
  // the recess: its back in shadow, the left jamb's inner face (we see into the opening from the right), the sill's top
  R(x, a, r0, b, r1, shade(M.brick, -0.5));
  const j = 0.13, gs = a + j, gb = r0 + 0.07;
  R(x, a, r0, gs, r1, sd > 0.1 ? shade(M.brick, -0.32) : mix(M.brick, [255, 226, 190], 0.12 * (M.day + M.gold)));
  R(x, a, r0, b, gb, mix(M.trim, [255, 250, 236], 0.15 * M.day));
  // the sash: a frame, the meeting rail, three lites over one
  const g0 = gs + 0.05, g1 = b - 0.05, h0 = gb + 0.05, h1 = r1 - 0.06, mid = h0 + (h1 - h0) * 0.46;
  R(x, gs, gb, b, r1, M.frame);
  const pane = (p0, p1, q0, q1) => {
    if (!night) {
      const g = x.createLinearGradient(0, q1, 0, q0);
      g.addColorStop(0, rgb(M.glassTop)); g.addColorStop(0.45, rgb(mix(M.glassTop, M.glassLo, 0.75))); g.addColorStop(1, rgb(mix(M.inside, M.glassLo, 0.35)));
      x.fillStyle = g; x.fillRect(p0, q0, p1 - p0, q1 - q0);
    } else R(x, p0, q0, p1, q1, mix(M.inside, M.glassTop, 0.25));
  };
  pane(g0, g1, h0, mid - 0.04);
  for (let i = 0; i < 3; i++) { const w = (g1 - g0 - 0.12) / 3; pane(g0 + i * (w + 0.06), g0 + i * (w + 0.06) + w, mid + 0.04, h1); }
  // the shade (roller blind) pulled to its height, the curtains, by day; a soft shadow line under the blind
  if (!night && o.blind != null) {
    const bv = h1 - (h1 - h0) * o.blind;
    R(x, g0, bv, g1, h1, M.blind); R(x, g0, bv, g1, bv + 0.04, shade(M.blind, -0.25));
    x.fillStyle = rgb(shade(M.blind, -0.12)); for (let v = bv + 0.18; v < h1; v += 0.22) x.fillRect(g0, v, g1 - g0, 0.012);
    R(x, (g0 + g1) / 2 - 0.03, bv - 0.1, (g0 + g1) / 2 + 0.03, bv, M.frame);
  }
  if (!night && o.curtain) for (const [p, q] of [[g0, g0 + 0.32], [g1 - 0.32, g1]]) { R(x, p, h0, q, h1, o.curtain); x.fillStyle = rgb(shade(o.curtain, -0.3)); for (let u = p + 0.06; u < q; u += 0.1) x.fillRect(u, h0, 0.03, h1 - h0); }
  if (!night && o.plant) { x.fillStyle = rgb(tri(M.T, [52, 96, 52], [70, 80, 40], [10, 14, 14])); for (let i = 0; i < 6; i++) { x.beginPath(); x.ellipse(g0 + 0.35 + i * 0.12, h0 + 0.18 + (i % 3) * 0.1, 0.13, 0.08, 0.4 * (i - 3), 0, Math.PI * 2); x.fill(); } R(x, g0 + 0.28, h0, g0 + 0.95, h0 + 0.16, [150, 80, 54]); }
  // the glass's reflections by day: a diagonal sheen, the head's shadow at the top of the panes
  if (!night) {
    x.save(); x.beginPath(); x.rect(g0, h0, g1 - g0, h1 - h0); x.clip();
    x.fillStyle = 'rgba(255,255,255,0.16)'; x.beginPath(); x.moveTo(g0 + 0.2, h1); x.lineTo(g0 + 0.62, h1); x.lineTo(g0 + 0.02, h0 + (h1 - h0) * 0.3); x.lineTo(g0 - 0.4, h0 + (h1 - h0) * 0.3); x.fill();
    const hs = 0.12 + 0.22 * clamp01(((M.T.sunEl || 30) - 10) / 40);
    R(x, g0, h1 - hs, g1, h1, [0, 0, 0], 0.22 * (M.day + M.gold) * (1 - 0.6 * M.ov));
    x.restore();
  }
  // the frame's lit edges
  R(x, gs, mid - 0.04, b, mid + 0.04, M.frame); R(x, gs, r1 - 0.02, b, r1, M.frameHi);
  for (let i = 1; i < 3; i++) { const w = (g1 - g0 - 0.12) / 3; R(x, g0 + i * (w + 0.06) - 0.06, mid, g0 + i * (w + 0.06), h1, M.frame); }
  // the WINDOW BOX (the apartment): geraniums by day
  if (o.box) {
    R(x, a + 0.05, r0 - 0.5, b - 0.05, r0 - 0.16, tri(M.T, [44, 82, 60], [60, 64, 44], [12, 16, 22]));
    R(x, a + 0.05, r0 - 0.2, b - 0.05, r0 - 0.16, tri(M.T, [80, 130, 100], [96, 96, 64], [20, 24, 32]));
    const rr = rngFrom(19), leaf = tri(M.T, [58, 112, 54], [74, 90, 40], [12, 16, 16]), red = tri(M.T, [214, 44, 52], [226, 70, 50], [40, 14, 22]);
    for (let i = 0; i < 16; i++) { const u = a + 0.15 + rr() * (b - a - 0.3), v = r0 - 0.16 + rr() * 0.26; x.fillStyle = rgb(leaf); x.beginPath(); x.arc(u, v, 0.09, 0, Math.PI * 2); x.fill(); }
    for (let i = 0; i < 9; i++) { const u = a + 0.2 + rr() * (b - a - 0.4), v = r0 + 0.02 + rr() * 0.2; x.fillStyle = rgb(red); x.beginPath(); x.arc(u, v, 0.075, 0, Math.PI * 2); x.fill(); }
  }
}

/** THE GROUND FLOOR: the barbershop (its window with the chair + the mirror wall + gold leaf, its door + the OPEN / CLOSED card),
 *  the pole's brackets, the unmarked side door, the basement window, the sconce */
function paintGround(x, M, s) {
  const night = M.night > 0.5, open = !night, sd = M.sd, sh = s.shop;
  const [w0, w1, wv0, wv1] = sh.win, [d0, d1, dh] = sh.door;
  // the shopfront's surround: bottle-green painted wood, a gilt pinstripe, panelled stall-risers under the window
  const sf = mix(M.frame, [40, 70, 58], 0.3 * M.day);
  R(x, d0 - 0.18, V.plinth, w1 + 0.22, V.ground - 0.02, sf);
  R(x, d0 - 0.08, V.ground - 0.24, w1 + 0.12, V.ground - 0.2, M.gilt, 0.8);
  R(x, w0, V.plinth + 0.06, w1, wv0 - 0.06, mix(sf, M.frameHi, 0.25));
  for (let u = w0 + 0.1; u < w1 - 0.5; u += 1.05) { R(x, u, V.plinth + 0.12, u + 0.92, wv0 - 0.12, shade(sf, -0.2)); R(x, u + 0.04, V.plinth + 0.16, u + 0.88, wv0 - 0.16, mix(sf, M.frameHi, 0.4)); }
  // THE BIG WINDOW — inside: a black + white tiled floor, the MIRROR WALL across the back (a shelf of tonics in front of it), the
  // BARBER CHAIR (porcelain base, red leather, chrome), a hanging lamp; then the glass: the street's reflection, a sheen
  x.save(); x.beginPath(); x.rect(w0, wv0, w1 - w0, wv1 - wv0); x.clip();
  const lightIn = open ? 1 : 0.18;
  const wall = mix(tri(M.T, [214, 204, 180], [220, 180, 140], [18, 16, 26]), [0, 0, 0], 0.2);
  R(x, w0, wv0, w1, wv1, wall);
  // the mirror wall: silvered panels (reflecting the shop: a soft lighter band), bevelled frames
  for (let u = w0 + 0.15; u < w1 - 0.3; u += 1.0) {
    R(x, u, wv0 + 0.65, u + 0.9, wv1 - 0.3, shade(M.gilt, -0.35));
    const g = x.createLinearGradient(u, 0, u + 0.86, 0); const mc = tri(M.T, [176, 190, 200], [200, 170, 150], [22, 22, 34]);
    g.addColorStop(0, rgb(shade(mc, -0.15))); g.addColorStop(0.5, rgb(shade(mc, 0.12 * lightIn))); g.addColorStop(1, rgb(shade(mc, -0.2)));
    x.fillStyle = g; x.fillRect(u + 0.04, wv0 + 0.69, 0.82, wv1 - wv0 - 1.03);
  }
  // the shelf of tonics
  R(x, w0, wv0 + 0.62, w1, wv0 + 0.68, M.wood);
  { const rr = rngFrom(7), cols = [[60, 140, 90], [170, 60, 50], [220, 170, 80], [90, 120, 190], [230, 230, 220]];
    for (let u = w0 + 0.2; u < w1 - 0.2; u += 0.16 + rr() * 0.1) { const c = cols[Math.floor(rr() * cols.length)], h = 0.18 + rr() * 0.14; R(x, u, wv0 + 0.68, u + 0.08, wv0 + 0.68 + h, mix(c, M.inside, night ? 0.7 : 0.15)); } }
  // the counter + the floor's tiles
  R(x, w0, wv0, w1, wv0 + 0.45, M.wood); R(x, w0, wv0 + 0.42, w1, wv0 + 0.47, mix(M.wood, [255, 230, 200], 0.2 * (1 - M.night)));
  // THE CHAIR (facing right): the porcelain pedestal, the footrest, the seat, the back + the headrest, the chrome arm
  { const cx = w0 + (w1 - w0) * 0.36, base = wv0 + 0.02, leather = tri(M.T, [150, 26, 34], [170, 40, 40], [26, 10, 18]), por = tri(M.T, [236, 234, 226], [240, 216, 190], [30, 28, 40]), chrome = tri(M.T, [200, 204, 210], [230, 200, 170], [40, 40, 54]);
    R(x, cx - 0.2, base, cx + 0.2, base + 0.12, por); R(x, cx - 0.08, base + 0.12, cx + 0.08, base + 0.62, por);
    R(x, cx + 0.3, base + 0.3, cx + 0.62, base + 0.36, chrome);                                   // the footrest
    R(x, cx - 0.36, base + 0.62, cx + 0.46, base + 0.86, leather); R(x, cx - 0.36, base + 0.84, cx + 0.46, base + 0.88, shade(leather, 0.25));
    R(x, cx - 0.42, base + 0.66, cx - 0.22, base + 1.62, leather); R(x, cx - 0.4, base + 1.58, cx - 0.24, base + 1.62, shade(leather, 0.3));
    R(x, cx - 0.36, base + 1.66, cx - 0.26, base + 1.86, chrome); R(x, cx - 0.48, base + 1.86, cx - 0.12, base + 2.04, leather);   // the headrest
    R(x, cx - 0.3, base + 1.02, cx + 0.42, base + 1.07, chrome); }
  // the hanging lamp (a milk-glass globe)
  { const lx = w0 + (w1 - w0) * 0.38; R(x, lx - 0.01, wv1 - 0.4, lx + 0.01, wv1, M.iron); x.fillStyle = rgb(tri(M.T, [240, 236, 220], [250, 220, 180], [40, 36, 46])); x.beginPath(); x.arc(lx, wv1 - 0.48, 0.12, 0, Math.PI * 2); x.fill(); }
  // the glass: the street's pale reflection low, a soft diagonal sheen, a little of the sky up top (by day); the awning's shadow
  if (!night) {
    const g = x.createLinearGradient(0, wv0, 0, wv1); g.addColorStop(0, 'rgba(236,232,220,0.3)'); g.addColorStop(0.35, 'rgba(236,232,220,0.06)'); g.addColorStop(0.75, 'rgba(255,255,255,0)'); g.addColorStop(1, rgb(M.glassTop, 0.35));
    x.fillStyle = g; x.fillRect(w0, wv0, w1 - w0, wv1 - wv0);
    x.fillStyle = 'rgba(255,255,255,0.13)'; for (const [p, q] of [[0.1, 0.55], [0.62, 0.78]]) { x.beginPath(); x.moveTo(w0 + (w1 - w0) * p, wv1); x.lineTo(w0 + (w1 - w0) * q, wv1); x.lineTo(w0 + (w1 - w0) * (q - 0.22), wv0); x.lineTo(w0 + (w1 - w0) * (p - 0.22), wv0); x.fill(); }
  } else R(x, w0, wv0, w1, wv1, M.inside, 0.55);
  R(x, w0, wv1 - 0.38, w1, wv1, [0, 0, 0], 0.32 * (M.day + M.gold) + 0.1);
  // THE GOLD LEAF: "HARBOR BARBERS" arched, "SHAVE & HAIRCUT" under it — gilt with a dark keyline and a shade, a little faded
  { const cx = (w0 + w1) / 2, R0 = 3.4, cy = wv1 - 0.98 - R0, word = 'HARBOR BARBERS', size = 0.34;
    const gi = mix(M.gilt, M.giltHi, 0.2 * (1 - M.night)), sz = 1;
    x.font = FONT(size * 100);
    const span = (w1 - w0) * 0.86 / R0, step = span / (word.length - 1);
    for (let i = 0; i < word.length; i++) {
      const a = -span / 2 + i * step, u = cx + Math.sin(a) * R0, v = cy + Math.cos(a) * R0;
      text(x, word[i], u + 0.03, v - 0.03, size, { fill: rgb(M.giltLo, 0.9), rot: a });
      text(x, word[i], u, v, size, { fill: rgb(gi), stroke: rgb([24, 16, 14], 0.85), lw: 0.05, rot: a });
    }
    text(x, 'SHAVE & HAIRCUT', cx, wv1 - 1.78, 0.26 * sz, { fill: rgb(gi), stroke: rgb([24, 16, 14], 0.85), lw: 0.04, sq: 0.92 });
    R(x, cx - 1.25, wv1 - 1.9, cx + 1.25, wv1 - 1.88, gi, 0.85); }
  x.restore();
  // the window's frame: a bronze bar sash, mullion
  R(x, w0 - 0.07, wv0 - 0.07, w1 + 0.07, wv0, M.frameHi); R(x, w0 - 0.07, wv1, w1 + 0.07, wv1 + 0.07, M.frame);
  R(x, w0 - 0.07, wv0, w0, wv1, M.frame); R(x, w1, wv0, w1 + 0.07, wv1, M.frame);
  // THE SHOP DOOR: a glazed wood door, a transom, the card (OPEN by day, CLOSED at night)
  R(x, d0 - 0.1, V.plinth - 0.05, d1 + 0.1, dh + 0.5, sf);
  R(x, d0, V.plinth - 0.05, d1, dh, M.wood);
  R(x, d0 + 0.12, 1.25, d1 - 0.12, dh - 0.12, night ? mix(M.inside, M.glassTop, 0.15) : mix(M.glassTop, M.inside, 0.45));
  R(x, d0 + 0.12, V.plinth + 0.1, d1 - 0.12, 1.1, shade(M.wood, -0.15));
  R(x, d0 + 0.08, dh + 0.08, d1 - 0.08, dh + 0.42, night ? M.inside : mix(M.glassTop, M.inside, 0.3));
  R(x, d1 - 0.2, 1.05, d1 - 0.13, 1.18, M.gilt);
  { const cu = (d0 + d1) / 2, cv = 2.05, card = tri(M.T, [244, 240, 228], [250, 226, 196], [56, 50, 60]);
    x.strokeStyle = rgb(M.iron); x.lineWidth = 0.02; x.beginPath(); x.moveTo(cu - 0.18, cv + 0.2); x.lineTo(cu, cv + 0.42); x.lineTo(cu + 0.18, cv + 0.2); x.stroke();
    R(x, cu - 0.3, cv - 0.02, cu + 0.3, cv + 0.2, card);
    text(x, open ? 'OPEN' : 'CLOSED', cu, cv + 0.035, open ? 0.15 : 0.11, { fill: rgb(open ? [190, 30, 36] : [30, 30, 40]) }); }
  // the pole's brackets (the pole itself is live: it turns)
  R(x, sh.pole.u - 0.22, sh.pole.v1 - 0.05, sh.pole.u + 0.22, sh.pole.v1 + 0.12, M.iron); R(x, sh.pole.u - 0.22, sh.pole.v0 - 0.12, sh.pole.u + 0.22, sh.pole.v0 + 0.05, M.iron);
  // the pole's shadow on the wall by day
  if (M.day + M.gold > 0.2) { const off = 0.35 + 0.2 * Math.abs(sd); R(x, sh.pole.u - sd * off - 0.12, sh.pole.v0 - 0.25, sh.pole.u - sd * off + 0.12, sh.pole.v1 - 0.2, [0, 0, 0], 0.16 * (M.day + M.gold) * (1 - M.ov)); }
  // THE UNMARKED SIDE DOOR: a granite surround, heavy oak planks, iron strap hinges, the little GRILLE (the peephole), a brass knob
  { const d = s.door, g = M.stone;
    R(x, d.u0 - 0.2, 0, d.u1 + 0.2, d.h + 0.28, g);
    R(x, d.u0 - 0.2, d.h + 0.2, d.u1 + 0.2, d.h + 0.28, mix(g, [255, 250, 240], 0.2 * (1 - M.night)));
    R(x, d.u0 - 0.2, 0, d.u0 - 0.17, d.h + 0.2, shade(g, -0.3));
    const oak = tri(M.T, [66, 40, 28], [80, 44, 30], [16, 11, 16]);
    R(x, d.u0, 0.12, d.u1, d.h, oak);
    x.fillStyle = rgb(shade(oak, -0.3)); for (let u = d.u0 + 0.25; u < d.u1; u += 0.25) x.fillRect(u, 0.12, 0.02, d.h - 0.12);
    x.fillStyle = rgb(shade(oak, 0.12)); for (let u = d.u0 + 0.05; u < d.u1; u += 0.25) x.fillRect(u, 0.12, 0.02, d.h - 0.12);
    for (const v of [0.6, d.h - 0.55]) { R(x, d.u0, v, d.u0 + 0.75, v + 0.09, M.iron); x.fillStyle = rgb(M.iron); x.beginPath(); x.arc(d.u0 + 0.75, v + 0.045, 0.07, 0, Math.PI * 2); x.fill(); }
    const gu = (d.u0 + d.u1) / 2; R(x, gu - 0.2, 1.62, gu + 0.2, 1.98, M.iron); R(x, gu - 0.15, 1.67, gu + 0.15, 1.93, tri(M.T, [20, 16, 18], [24, 16, 18], [4, 4, 8]));
    x.fillStyle = rgb(M.iron); for (let u = gu - 0.1; u <= gu + 0.11; u += 0.1) x.fillRect(u - 0.015, 1.67, 0.03, 0.26);
    x.fillStyle = rgb(M.gilt); x.beginPath(); x.arc(d.u1 - 0.22, 1.18, 0.06, 0, Math.PI * 2); x.fill();
    R(x, d.u0 - 0.1, 0, d.u1 + 0.1, 0.12, shade(g, 0.1)); }
  // THE BASEMENT WINDOW in the plinth: a dark opening, its iron bars (the amber glow inside is live: day + night)
  { const [b0, b1, bv0, bv1] = sh.basement;
    R(x, b0 - 0.06, bv0 - 0.04, b1 + 0.06, bv1 + 0.05, shade(M.stone, -0.3));
    const g = x.createLinearGradient(0, bv0, 0, bv1); g.addColorStop(0, 'rgb(64,30,12)'); g.addColorStop(1, 'rgb(28,14,10)'); x.fillStyle = g; x.fillRect(b0, bv0, b1 - b0, bv1 - bv0);
    x.fillStyle = rgb(M.iron); for (let u = b0 + 0.2; u < b1; u += 0.24) x.fillRect(u - 0.025, bv0, 0.05, bv1 - bv0); }
  // THE SCONCE over the side door (its bracket + lantern; lit at night: live)
  { const sc = sh.sconce; R(x, sc.u - 0.05, sc.v - 0.32, sc.u + 0.05, sc.v + 0.02, M.iron); R(x, sc.u - 0.14, sc.v - 0.05, sc.u + 0.14, sc.v + 0.32, M.iron); R(x, sc.u - 0.1, sc.v, sc.u + 0.1, sc.v + 0.26, night ? [60, 40, 26] : mix(M.glassTop, [255, 240, 200], 0.4)); R(x, sc.u - 0.17, sc.v + 0.32, sc.u + 0.17, sc.v + 0.38, M.iron); }
}

/** THE LIGHT on a painted wall (day: warm at the top, the street's occlusion at the foot, the sun's side across; night: the
 *  street's warm glow at the foot) + its WEATHER (soot from the cornice + under the sills, chipped terracotta) */
function paintLight(x, M, u0, u1, side, seed) {
  const day = M.day + M.gold, r = rngFrom(seed);
  if (day > 0.05) {
    const g = x.createLinearGradient(0, 0, 0, V.parapet);
    g.addColorStop(0, rgb([20, 12, 20], 0.34 * day)); g.addColorStop(0.18, rgb([20, 12, 20], 0.08 * day)); g.addColorStop(0.6, 'rgba(0,0,0,0)'); g.addColorStop(1, rgb([255, 236, 200], 0.1 * day * (1 - M.ov)));
    x.fillStyle = g; x.fillRect(u0, 0, u1 - u0, V.parapet);
    if (!side && Math.abs(M.sd) > 0.1) { const h = x.createLinearGradient(u0, 0, u1, 0), a = 0.1 * day * Math.abs(M.sd) * (1 - M.ov);
      h.addColorStop(0, M.sd < 0 ? rgb([255, 236, 200], a) : rgb([10, 10, 30], a)); h.addColorStop(1, M.sd < 0 ? rgb([10, 10, 30], a) : rgb([255, 236, 200], a)); x.fillStyle = h; x.fillRect(u0, 0, u1 - u0, V.parapet); }
  }
  if (M.night > 0.3) {
    // the promenade's lamps wash the lower wall warm; the sky's cool light on the upper wall
    const g = x.createLinearGradient(0, 0, 0, 5); g.addColorStop(0, rgb([255, 170, 100], 0.2 * M.night)); g.addColorStop(1, 'rgba(255,170,100,0)'); x.fillStyle = g; x.fillRect(u0, 0, u1 - u0, 5);
  }
  // soot from the cornice + the coping; rain streaks; dirt splash at the foot
  for (let i = 0; i < 22; i++) { const u = u0 + r() * (u1 - u0); streak(x, u, V.cornice[0] - 0.05, 0.15 + r() * 0.35, 0.8 + r() * 2.6, M.soot, 0.12 + r() * 0.12); }
  for (let i = 0; i < 10; i++) { const u = u0 + r() * (u1 - u0); streak(x, u, V.parapet, 0.1 + r() * 0.2, 0.4 + r() * 0.5, M.soot, 0.15); }
  { const g = x.createLinearGradient(0, V.plinth + 0.9, 0, 0); g.addColorStop(0, rgb(M.soot, 0)); g.addColorStop(1, rgb(M.soot, 0.3)); x.fillStyle = g; x.fillRect(u0, 0, u1 - u0, V.plinth + 0.9); }
  // chipped terracotta on the belt course + the cornice (the brick showing through)
  for (let i = 0; i < 10; i++) { const u = u0 + r() * (u1 - u0), v = r() < 0.5 ? V.ground + 0.05 + r() * 0.35 : V.cornice[0] + r() * 0.6, w = 0.04 + r() * 0.07; x.fillStyle = rgb(shade(mix(side ? M.trimS : M.trim, side ? M.brickS : M.brick, 0.45), -0.12), 0.7); x.beginPath(); x.ellipse(u, v, w, w * (0.5 + r() * 0.4), r() * 3, 0, Math.PI * 2); x.fill(); }
}

/** IVY up the corner (both walls meet there): stems + leaves, the season's colour (autumn red, summer green, winter bare twigs) */
function paintIvy(x, M, u, dir, seed, month) {
  const r = rngFrom(seed), m = month || 10;
  const leafC = m >= 9 && m <= 11 ? [[138, 36, 34], [164, 58, 38], [112, 30, 36], [178, 96, 44], [96, 70, 40]] : m === 12 || m <= 2 ? null : m <= 5 ? [[96, 150, 64], [124, 170, 76]] : [[48, 104, 50], [64, 124, 56], [40, 86, 44]];
  const stem = tri(M.T, [86, 62, 46], [96, 62, 44], [20, 14, 18]);
  // the vine's shape: a fan from the foot of the corner — wide and thick low down, a few runners climbing the quoins
  const pts = [];
  for (let i = 0; i < 260; i++) {
    const t = Math.pow(r(), 0.75), v = 0.3 + t * 4.6, spread = 0.25 + (1 - t) * 0.55 + 0.25 * Math.sin(v * 2.1 + seed);
    if (v > 3.6 && r() < 0.7) continue;                       // (only runners above the belt course)
    pts.push([u + dir * r() * spread, v]);
  }
  x.strokeStyle = rgb(stem, 0.8); x.lineWidth = 0.025; x.lineCap = 'round';
  for (let sI = 0; sI < 4; sI++) { x.beginPath(); let pu = u + dir * r() * 0.15, pv = 0.2; x.moveTo(pu, pv); while (pv < 2.4 + sI * 0.7) { pv += 0.2; pu += dir * (r() - 0.4) * 0.12; x.lineTo(pu, pv); } x.stroke(); }
  if (!leafC) return;
  for (const [lu, lv] of pts) {
    const c = leafC[Math.floor(r() * leafC.length)], lc = mix(shade(c, (r() - 0.5) * 0.25), [12, 8, 20], 0.86 * M.night);
    x.fillStyle = rgb(lc); const rr = 0.045 + r() * 0.04;
    x.beginPath(); x.ellipse(lu, lv, rr, rr * 0.75, r() * 3, 0, Math.PI * 2); x.fill();
    if (r() < 0.3) { x.fillStyle = rgb(shade(lc, 0.2)); x.beginPath(); x.arc(lu - rr * 0.3, lv + rr * 0.3, rr * 0.35, 0, Math.PI * 2); x.fill(); }
  }
}

// ------------------------------------------------------------------ THE GHOST AD (the side wall, the corner turned)
/** the ad painted flat: a faded 1920s hand-painted wall sign for this week's game (the full name, its tag, the mark's colours),
 *  sun-bleached, flaking so the bricks show through */
function paintGhostAd(x0, M, game, a0, a1, v0, v1, seed) {
  if (!game) return;
  const m = x0.getTransform(), k = Math.abs(m.a), tmp = document.createElement('canvas');
  tmp.width = Math.ceil((a1 - a0) * k) + 2; tmp.height = Math.ceil((v1 - v0) * k) + 2;
  const x = safeCtx(tmp); x.setTransform(k, 0, 0, -k, -a0 * k, v1 * k);
  const p = dayPaint(game), r = rngFrom(seed), fade = 0.42, wall = M.brickS;
  const f = c => mix(mix(c, [236, 226, 204], 0.25), wall, fade);
  const w = a1 - a0, h = v1 - v0, cx = (a0 + a1) / 2;
  x.save();
  x.globalAlpha = 0.9;
  R(x, a0, v0, a1, v1, f(p.edge));
  R(x, a0 + 0.12, v0 + 0.12, a1 - 0.12, v1 - 0.12, f(p.face));
  R(x, a0 + 0.24, v0 + 0.24, a1 - 0.24, v0 + 0.3, f(p.edge)); R(x, a0 + 0.24, v1 - 0.3, a1 - 0.24, v1 - 0.24, f(p.edge));
  // the name: big, condensed, a drop shade; the tag line above; a strap line below
  const name = String(game.name || game.id).toUpperCase(), tag = String(game.tag || '').toUpperCase();
  x.font = FONT(100);
  const nw = x.measureText(name).width / 100, size = Math.min(h * 0.36, (w * 0.86) / (nw * 0.82));
  text(x, name, cx + 0.07, v0 + h * 0.36 - 0.07, size, { fill: rgb(f(p.shade || [0, 0, 0]), 0.8), sq: 0.82 });
  text(x, name, cx, v0 + h * 0.36, size, { fill: rgb(f(p.ink)), stroke: rgb(f(p.edge)), lw: size * 0.06, sq: 0.82 });
  if (tag) text(x, tag, cx, v1 - h * 0.25, Math.min(h * 0.13, w * 0.9 / Math.max(6, tag.length * 0.62)), { fill: rgb(f(p.ink)), sq: 0.9 });
  text(x, '— PLAY TONIGHT —', cx, v0 + h * 0.13, h * 0.09, { fill: rgb(f(p.edge)), sq: 0.9 });
  x.restore();
  // the paint flaking: bricks + patches where it's gone (destination-out), the mortar lines through what's left
  x.save(); x.beginPath(); x.rect(a0, v0, w, h); x.clip();
  x.globalCompositeOperation = 'destination-out';
  const course = 0.11;
  for (let i = 0; i < 300; i++) { const u = a0 + r() * w, v = v0 + Math.floor(r() * h / course) * course; x.fillStyle = `rgba(0,0,0,${(0.2 + r() * 0.5).toFixed(2)})`; x.fillRect(u, v, 0.14 + r() * (r() < 0.15 ? 0.9 : 0.3), course * 0.82); }
  // (the weather's worst: the lower corners + a streak down from the top where the rain runs)
  for (let i = 0; i < 70; i++) { const c = r() < 0.5, u = c ? a0 + r() * w * 0.25 : a1 - r() * w * 0.25, v = v0 + Math.floor(r() * h * 0.4 / course) * course; x.fillStyle = 'rgba(0,0,0,0.5)'; x.fillRect(u, v, 0.2 + r() * 0.4, course * 0.82); }
  { const g = x.createLinearGradient(0, v1, 0, v0); g.addColorStop(0, 'rgba(0,0,0,0.05)'); g.addColorStop(1, 'rgba(0,0,0,0.3)'); x.fillStyle = g; x.fillRect(a0, v0, w, h); }
  // the courses read through what paint is left (the mortar's shadow lines)
  x.globalCompositeOperation = 'destination-out'; x.fillStyle = 'rgba(0,0,0,0.28)';
  for (let v = v0; v < v1; v += 0.11) x.fillRect(a0, v, w, 0.025);
  x.restore();
  const [dx, dy] = [m.a * a0 + m.c * v1 + m.e, m.b * a0 + m.d * v1 + m.f];
  x0.save(); x0.setTransform(1, 0, 0, 1, 0, 0); x0.drawImage(tmp, Math.round(dx), Math.round(dy)); x0.restore();
  tmp.width = tmp.height = 0;
}

// ------------------------------------------------------------------ THE BLADE SIGN (the fallback: the corner NOT turned)
/** the painted BLADE: a wooden board on iron brackets out from the side wall near the corner, facing us (parallel to the front),
 *  the same weekly game as the ghost ad — the plan's fallback (3) while the corner stays as it is (the turned wall hides the
 *  wheel's legs + the pier). Board units: b 0 … bw across (from the brackets), v up (wall units). */
export const BLADE = Object.freeze({ w: 0.42, out: 0.32, bw: 1.62, v0: 4.55, v1: 10.05 });
export function bladeGeo(G) {
  const B = BLADE, [ox, oy] = G.side(B.w, 0, B.out), z = G.zAt(B.w), k = G.cam.F / z;
  const [x0, y0] = G.side(B.w, B.v1, B.out), [x1, y1] = G.side(B.w, B.v0, B.out + B.bw);
  return { ox, oy, k, z, rect: { x: Math.min(x0, x1), y: y0, w: Math.abs(x1 - x0), h: y1 - y0 } };
}
/** the blade's two gooseneck lamps over its top edge (the billboard's lamp, scaled to the board) */
export function bladeLamps(bg) {
  const R = bg.rect, W = Math.max(4.6, Math.min(6.5, R.w * 0.3)), a = W * 1.25;
  return [0.22, 0.78].map(f => { const dir = f < 0.5 ? 1 : -1, x0 = R.x + R.w * f; return { x: x0 + dir * W * 0.45, y: R.y - W * 0.3, top: R.y - a * 1.15, x0, dir, a, W }; });
}
/** the board, painted (lit: under its lamps' warm light, for the live layer) */
function paintBlade(x, M, game, lit = false) {
  const B = BLADE, p = dayPaint(game), bw = B.bw, v0 = B.v0, v1 = B.v1, r = rngFrom(17);
  const fade = lit ? 0.12 : 0.22, f = c => (lit ? c : mix(mix(c, [236, 226, 204], fade), M.inside, 0.82 * M.night));
  const iron = lit ? [40, 34, 32] : M.iron;
  // the iron brackets from the wall (scrolled arms) at the top and the foot
  x.strokeStyle = rgb(iron); x.lineWidth = 0.07; x.lineCap = 'round';
  for (const v of [v1 - 0.35, v0 + 0.35]) { x.beginPath(); x.moveTo(-B.out, v); x.lineTo(0.15, v); x.stroke(); x.beginPath(); x.arc(-B.out * 0.4, v - 0.14, 0.12, 0, Math.PI * 1.6); x.stroke(); }
  x.lineWidth = 0.045; x.beginPath(); x.moveTo(-B.out, v1 - 0.9); x.lineTo(0.05, v1 - 0.38); x.stroke();
  // the board: a moulded frame, a stepped Deco top, the painted face
  const top = [[0, v1 - 0.35], [0.25, v1 - 0.35], [0.25, v1 - 0.18], [0.5, v1 - 0.18], [0.5, v1], [bw - 0.5, v1], [bw - 0.5, v1 - 0.18], [bw - 0.25, v1 - 0.18], [bw - 0.25, v1 - 0.35], [bw, v1 - 0.35], [bw, v0], [0, v0]];
  x.fillStyle = rgb(f(p.edge)); x.beginPath(); top.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.fill();
  R(x, 0.1, v0 + 0.1, bw - 0.1, v1 - 0.45, f(p.face));
  R(x, 0.6, v1 - 0.3, bw - 0.6, v1 - 0.1, f(p.face));
  R(x, 0.17, v0 + 0.17, bw - 0.17, v0 + 0.21, f(p.edge)); R(x, 0.17, v1 - 0.56, bw - 0.17, v1 - 0.52, f(p.edge));
  // the name: stacked letters, one column a word (two words: side by side), the keyline + a drop shade
  const words = String(game.name || game.id).toUpperCase().split(/s+/).slice(0, 2), nc = words.length, iw = bw - 0.42, ih = (v1 - 0.62) - (v0 + 0.28);
  const n = Math.max(...words.map(w => w.length)), lh = Math.min(ih / n, (iw / nc) * 1.15), size = lh * 0.94;
  words.forEach((w, ci) => { const cx = 0.21 + iw * (ci + 0.5) / nc, start = v1 - 0.62 - (ih - lh * w.length) / 2;
    [...w].forEach((ch, i) => { const vb = start - lh * (i + 1) + lh * 0.12;
      text(x, ch, cx + 0.05, vb - 0.05, size, { fill: rgb(f(p.shade || [0, 0, 0]), 0.6) });
      text(x, ch, cx, vb, size, { fill: rgb(f(p.ink)), stroke: rgb(f(p.edge)), lw: size * 0.1 }); }); });
  // the weather: the wood's grain + the paint worn at the edges + a rain streak
  x.fillStyle = 'rgba(0,0,0,0.07)'; for (let v = v0 + 0.2; v < v1 - 0.4; v += 0.13 + r() * 0.1) x.fillRect(0.1, v, bw - 0.2, 0.012);
  for (let i = 0; i < 26; i++) { const e = r() < 0.5, u = e ? 0.1 + r() * 0.12 : bw - 0.22 + r() * 0.12, v = v0 + 0.1 + r() * (v1 - v0 - 0.5); R(x, u, v, u + 0.05 + r() * 0.06, v + 0.05 + r() * 0.12, f(shade(p.face, -0.25)), 0.6); }
  if (!lit) streak(x, bw * 0.3, v1 - 0.45, 0.12, 1.6, M.soot, 0.18);
}

// ------------------------------------------------------------------ THE BAKE
/**
 * The speakeasy's baked steps (into 'stage'), far → near: the rooftop's pieces behind the parapet (the stair bulkhead, the
 * chimney, the string lights' pole), the side wall (painted flat, projected in strips), the front (the structure, the Deco, the
 * windows, the ground floor, the light + weather, the ivy), then what stands out from the walls (the awning, the door's steps,
 * the parapet's posts, the ad's lamps' hardware). ctx: { game (this week's ghost ad), month }
 */
export function speakeasySteps(L, T, ctx = {}) {
  const G = speakGeo(L), cam = L.cam, s = L.speakeasy, M = mats(T), roof = L.roof;
  const st = {};
  const dprOf = x => x.getTransform().a;
  const frontMap = x => { const [ox, oy] = G.front(0, 0); wallMap(x, ox, oy, G.K); };
  const course = dpr => Math.max(2, Math.round(0.11 * G.K * dpr)), blen = dpr => Math.max(4, Math.round(0.26 * G.K * dpr));
  return [
    // the rooftop behind the parapet
    x => {
      const top = shade(M.brick, -0.05), sl = { sideK: 0.2, light: 1 };
      const bk = roof.bulkhead; box(x, cam, { x0: bk.x0, x1: bk.x1, z0: bk.z0, z1: bk.z1, h: bk.h }, mix(M.brick, M.trim, 0.1), { ...sl, y0: s.h });
      { const [a, y0] = project(cam, bk.x0 + 0.7, s.h + 1.5, bk.z0), [b, y1] = project(cam, bk.x0 + 1.3, s.h, bk.z0); x.fillStyle = rgb(M.wood); x.fillRect(a, y0, b - a, y1 - y0); }
      box(x, cam, { x0: bk.x0 - 0.1, x1: bk.x1 + 0.1, z0: bk.z0 - 0.1, z1: bk.z1 + 0.1, h: 0.15 }, M.trim, { ...sl, y0: s.h + bk.h });
      const ch = roof.chimney; box(x, cam, { x0: ch.x - ch.w / 2, x1: ch.x + ch.w / 2, z0: ch.z, z1: ch.z + ch.w, h: ch.h }, top, { ...sl, y0: s.h });
      box(x, cam, { x0: ch.x - ch.w / 2 - 0.08, x1: ch.x + ch.w / 2 + 0.08, z0: ch.z - 0.08, z1: ch.z + ch.w + 0.08, h: 0.14 }, M.trim, { ...sl, y0: s.h + ch.h });
    },
    // the side wall, painted flat (its own canvas, the front's scale at the corner)
    x => {
      const dpr = dprOf(x), k = G.K * dpr, len = G.len, H = V.parapet;
      const cv = st.side = document.createElement('canvas'); cv.width = Math.ceil(len * k); cv.height = Math.ceil(H * k);
      const sx = safeCtx(cv); sx.setTransform(k, 0, 0, -k, 0, cv.height);
      const pat = sx.createPattern(brickTile(M.brickS, course(dpr), blen(dpr), 5, M.night > 0.5), 'repeat');
      paintStructure(sx, { ...M, brick: M.brickS }, { u0: 0, u1: len, side: true, pat });
      // the corner's quoins seen from the side; a bricked-up arch + a small barred window on the ground floor
      for (let v = V.belt, i = 0; v < V.cornice[0] - 0.7; v += 0.42, i++) { const w = i % 2 ? 0.7 : 0.42; R(sx, 0, v + 0.03, w, v + 0.39, M.trimS); R(sx, w - 0.04, v + 0.03, w, v + 0.39, shade(M.trimS, -0.3)); R(sx, 0, v + 0.35, w, v + 0.39, shade(M.trimS, -0.3)); }
      if (len > 6) {
        const a0 = len * 0.55, a1 = a0 + 1.5; R(sx, a0 - 0.1, 0.9, a1 + 0.1, 3.0, shade(M.brickS, -0.12)); sx.fillStyle = rgb(shade(M.brickS, 0.08)); sx.beginPath(); sx.arc((a0 + a1) / 2, 3.0, 0.85, 0, Math.PI); sx.fill();
        sx.fillStyle = rgb(shade(M.brickS, -0.3)); for (let a = 0; a <= Math.PI + 1e-6; a += Math.PI / 9) sx.fillRect((a0 + a1) / 2 + Math.cos(a) * 0.85 - 0.02, 3.0 + Math.sin(a) * 0.85 - 0.02, 0.05, 0.05);
        R(sx, len * 0.2, 1.5, len * 0.2 + 0.9, 2.6, shade(M.brickS, -0.5)); sx.fillStyle = rgb(M.iron); for (let u = len * 0.2 + 0.15; u < len * 0.2 + 0.9; u += 0.2) sx.fillRect(u, 1.5, 0.04, 1.1);
        R(sx, len * 0.2 - 0.08, 1.38, len * 0.2 + 0.98, 1.5, M.trimS);
      }
      if (G.turned && ctx.game) paintGhostAd(sx, M, ctx.game, 0.85, len - 0.6, 4.75, 9.3, 12);
      paintLight(sx, M, 0, len, true, 33);
      paintIvy(sx, M, 0.05, 1, 3, ctx.month);
      st.sideK = k;
    },
    // … projected: one source column per device pixel (exact perspective for a vertical wall)
    x => {
      const cv = st.side; if (!cv) return;
      const dpr = dprOf(x), step = 1 / dpr, [ax] = G.side(0, 0), [bx] = G.side(G.len, 0), k = st.sideK;
      for (let px = Math.floor(ax * dpr) / dpr; px < bx; px += step) {
        const wa = Math.max(0, G.wAt(px)), wb = Math.min(G.len, G.wAt(px + step));
        if (!(wb > wa)) continue;
        const wm = (wa + wb) / 2, [, yt] = G.side(wm, V.parapet), [, yb] = G.side(wm, 0);
        x.drawImage(cv, wa * k, 0, Math.max(0.5, (wb - wa) * k), cv.height, px, yt, step + 0.25 / dpr, yb - yt);
      }
      cv.width = cv.height = 0; st.side = null;
    },
    // THE BLADE (the corner as it is): the painted board + its brackets, in front of the side wall
    x => {
      if (G.turned || !ctx.game) return;
      const bg = bladeGeo(G); x.save(); wallMap(x, bg.ox, bg.oy, bg.k); paintBlade(x, M, ctx.game); x.restore();
      drawGooseneck(x, bladeLamps(bg), M.day + M.gold * 0.8, M.sd);
    },
    // THE FRONT: the brick + the structure + the Deco
    x => {
      const dpr = dprOf(x); x.save(); frontMap(x);
      const pat = x.createPattern(brickTile(M.brick, course(dpr), blen(dpr), 9, M.night > 0.5), 'repeat');
      st.P = paintStructure(x, M, { u0: 0, u1: W_FRONT, side: false, pat });
      paintFrontDeco(x, M, st.P);
      x.restore();
    },
    // the upper windows (by day: the sky in the glass, shades at their heights, curtains, the plant, the window box)
    x => {
      x.save(); frontMap(x);
      const r = rngFrom(23), curtains = [tri(T, [140, 40, 44], [150, 50, 44], [20, 10, 18]), tri(T, [70, 92, 58], [90, 80, 50], [12, 14, 16]), tri(T, [196, 168, 110], [200, 150, 100], [26, 22, 30])];
      ROOMS.forEach(rm => {
        const [a, b] = s.windows[rm.col], [r0, r1] = s.rows[rm.floor - 2];
        const o = { blind: rm.clear ? 0.12 : 0.25 + r() * 0.45, curtain: rm.edge || rm.room === 'apartment' ? curtains[(rm.floor + rm.col) % 3] : null, plant: rm.id === 'edge2', box: rm.room === 'apartment' };
        paintWindow(x, M, a, b, r0, r1, o);
      });
      x.restore();
    },
    // the ground floor: the barbershop, the side door, the basement window, the sconce
    x => { x.save(); frontMap(x); paintGround(x, M, s); x.restore(); },
    // the light + the weather + the ivy on the corner
    x => { x.save(); frontMap(x); paintLight(x, M, 0, W_FRONT, false, 51); paintIvy(x, M, W_FRONT - 0.05, -1, 4, ctx.month); x.restore(); },
    // what stands out from the walls: the awning, the side door's steps, the parapet's posts, the ad's lamps
    x => {
      const aw = s.awning, at = (u, y, z) => [s.x0 + u, y, z];
      // the awning: striped canvas sloping out from the wall, its side flap, a patch, the valance with "EST. 1924" + scallops
      const n = 12, du = (aw.u1 - aw.u0) / n;
      for (let i = 0; i < n; i++) {
        const u0 = aw.u0 + i * du, u1 = u0 + du, col = i % 2 ? M.awnC : M.awnR;
        poly(x, cam, [at(u0, aw.y0, s.z0), at(u1, aw.y0, s.z0), at(u1, aw.y1, aw.z), at(u0, aw.y1, aw.z)], rgb(mix(col, [255, 240, 220], 0.1 * M.day)));
      }
      // (the patch: a newer, redder square sewn over a tear; the canvas's sun-fade toward the top)
      poly(x, cam, [at(aw.u0 + 3.1, aw.y0 - 0.22, s.z0 - 0.45), at(aw.u0 + 3.75, aw.y0 - 0.22, s.z0 - 0.45), at(aw.u0 + 3.75, aw.y0 - 0.5, s.z0 - 0.98), at(aw.u0 + 3.1, aw.y0 - 0.5, s.z0 - 0.98)], rgb(shade(M.awnR, 0.06)));
      { const [a, y0] = project(cam, s.x0 + aw.u0, aw.y0, s.z0), [b, y1] = project(cam, s.x0 + aw.u1, aw.y1, aw.z), g = x.createLinearGradient(0, y0, 0, y1);
        g.addColorStop(0, `rgba(255,248,230,${(0.18 * M.day).toFixed(3)})`); g.addColorStop(1, 'rgba(0,0,0,0.12)'); x.fillStyle = g; x.fillRect(a, y0, b - a, y1 - y0); }
      poly(x, cam, [at(aw.u1, aw.y0, s.z0), at(aw.u1, aw.y1, aw.z), at(aw.u1, aw.y1 - 0.42, aw.z)], rgb(shade(M.awnR, -0.25)));
      // the valance: a red band with the year, the scallops under it
      const [va, vy0] = project(cam, s.x0 + aw.u0, aw.y1, aw.z), [vb, vy1] = project(cam, s.x0 + aw.u1, aw.y1 - 0.42, aw.z), vh = vy1 - vy0, sc = cam.F / aw.z;
      x.fillStyle = rgb(shade(M.awnR, -0.08)); x.fillRect(va, vy0, vb - va, vh);
      x.fillStyle = rgb(shade(M.awnR, -0.08)); const ns = 14, sw = (vb - va) / ns;
      for (let i = 0; i < ns; i++) { x.beginPath(); x.arc(va + sw * (i + 0.5), vy1, sw / 2, 0, Math.PI); x.fill(); }
      x.fillStyle = rgb(M.awnC, 0.9); x.fillRect(va, vy0 + vh * 0.1, vb - va, Math.max(0.4, vh * 0.05)); x.fillRect(va, vy1 - vh * 0.14, vb - va, Math.max(0.4, vh * 0.05));
      x.save(); x.font = FONT(vh * 0.6); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = rgb(mix(M.awnC, M.gilt, 0.35)); x.fillText('EST.  1924', project(cam, s.x0 + 6.0, 0, aw.z)[0], vy0 + vh * 0.52); x.restore();
      // the awning's iron arms
      x.strokeStyle = rgb(M.iron); x.lineWidth = Math.max(0.5, 0.05 * sc);
      for (const u of [aw.u0 + 0.1, aw.u1 - 0.1]) { const [p, py] = project(cam, s.x0 + u, aw.y0 - 0.9, s.z0), [q, qy] = project(cam, s.x0 + u, aw.y1, aw.z); x.beginPath(); x.moveTo(p, py); x.lineTo(q, qy); x.stroke(); }
      // the side door's two worn granite steps (a dip worn in the middle)
      const d = s.door;
      box(x, cam, { x0: s.x0 + d.u0 - 0.3, x1: s.x0 + d.u1 + 0.3, z0: s.z0 - 0.75, z1: s.z0, h: 0.13 }, shade(M.stone, 0.05), { light: 1, sideK: 0.12 });
      box(x, cam, { x0: s.x0 + d.u0 - 0.15, x1: s.x0 + d.u1 + 0.15, z0: s.z0 - 0.4, z1: s.z0, h: 0.13 }, shade(M.stone, 0.12), { y0: 0.13, light: 1, sideK: 0.12 });
      { const [a, y] = project(cam, s.x0 + (d.u0 + d.u1) / 2, 0.26, s.z0 - 0.2), w = 0.5 * cam.F / s.z0; x.fillStyle = rgb(M.soot, 0.25); x.beginPath(); x.ellipse(a, y, w, w * 0.12, 0, 0, Math.PI * 2); x.fill(); }
      // the string lights' iron posts on the parapet (front, then down the side wall)
      x.strokeStyle = rgb(M.iron); x.lineWidth = Math.max(0.6, 0.06 * G.K);
      for (const px of roof.posts) { const [a, y0] = project(cam, px, V.parapet, s.z0 - 0.05), [, y1] = project(cam, px, V.parapet + 1.15, s.z0 - 0.05); x.beginPath(); x.moveTo(a, y0); x.lineTo(a, y1); x.stroke(); }
      for (const f of [0.4, 0.75, 1]) { const [a, y0] = G.side(G.len * f - 0.1, V.parapet), [, y1] = G.side(G.len * f - 0.1, V.parapet + 1.15); x.beginPath(); x.moveTo(a, y0); x.lineTo(a, y1); x.stroke(); }
      // the GHOST AD's three gooseneck lamps (hardware; their light is live)
      if (G.turned) drawGooseneck(x, adLamps(G), M.day + M.gold * 0.8, M.sd);
    },
  ];
}

/** the ghost ad's lamps on screen (the billboard's lamp, reused: { x, y (the mouth), top, x0, dir, a, W }) */
export function adLamps(G) {
  return [0.22, 0.5, 0.78].map(f => {
    const w = 0.85 + (G.len - 1.45) * f, [x, y] = G.side(w, 9.62, 0.55), [x0] = G.side(w, 9.62, 0), z = G.zAt(w), W = 0.52 * G.cam.F / z, a = W * 1.25;
    return { x, y, top: y - a * 1.05, x0, dir: x > x0 ? 1 : -1, a, W, z };
  });
}

// ------------------------------------------------------------------ LIVE: the lit rooms, the glows, the pole, the ad's lamps
/**
 * createSpeakeasy(): what changes at night (and the pole by day). layout(L, { dpr }) → the windows on screen; draw(c, f) with
 * f = { k (the windows' light 0..1), lamp (the ad's lamps), sconce, day, night, t, motion, fade, hour, game }.
 * HOOKS (7b): windows() → [{ id, room, floor, col, edge, rect }], light(id, k|null) (a window's own level, null = the
 * timeline's), mirror(k) (the hidden door's opening 0..1 — 7b animates it; today a hook only), roomDraw(id, fn) (a moment's own
 * painter over a window).
 */
export function createSpeakeasy() {
  let G = null, dpr = 1, wins = [], box = null, litCv = null, adCv = null, litKey = '', adKey = '', glowCv = null, basement = null;
  const own = new Map(), drawers = new Map();
  let mirror = 0, lastK = -1;
  function layout(L, o = {}) {
    G = speakGeo(L); dpr = Math.min(2, o.dpr || 1);
    const s = G.s;
    wins = ROOMS.map(rm => { const [a, b] = s.windows[rm.col], [r0, r1] = s.rows[rm.floor - 2], [x0, y0] = G.front(a, r1), [x1, y1] = G.front(b, r0); return { ...rm, u: [a, b], v: [r0, r1], rect: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } }; });
    const [bx0, by0] = G.front(0, V.crest + 0.2), [bx1] = G.side(G.len, 0), [, by1] = G.front(0, 0);
    box = { x: Math.max(0, Math.floor(bx0)), y: Math.floor(by0), w: Math.ceil(Math.min(G.cam.W, bx1) - Math.max(0, bx0)) + 1, h: Math.ceil(by1 - by0) + 1 };
    const [b0, b1, bv0, bv1] = s.shop.basement, [p, py] = G.front(b0, bv1), [q, qy] = G.front(b1, bv0);
    basement = { x: p, y: py, w: q - p, h: qy - py };
    litKey = adKey = bladeKey = '';
  }
  // the window's level now: its own (a hook) or the timeline's (core/harbor-speakeasy.js#roomLight)
  const levelOf = (rm, f) => (own.has(rm.id) ? own.get(rm.id) : roomLight(rm.id, f.hour));
  function canvasFor(cv) { cv = cv || document.createElement('canvas'); const w = Math.ceil(box.w * dpr), h = Math.ceil(box.h * dpr); if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; } return cv; }
  // the rooms, lit (one canvas over the speakeasy's box; re-painted only when a window's level moves a step)
  function paintLit(levels) {
    litCv = canvasFor(litCv);
    const x = safeCtx(litCv);
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, litCv.width, litCv.height);
    x.setTransform(dpr, 0, 0, dpr, -box.x * dpr, -box.y * dpr);
    const [ox, oy] = G.front(0, 0);
    x.save(); wallMap(x, ox, oy, G.K);
    wins.forEach((w, i) => { const a = levels[i]; if (a > 0.01) { x.globalAlpha = a; room(x, w); x.globalAlpha = 1; } });
    // the barbershop after hours: one dim lamp over the empty chair, its pool on the floor + the chair, the mirror catching it
    const [w0, w1, wv0, wv1] = G.s.shop.win, lx = w0 + (w1 - w0) * 0.38;
    x.save(); x.beginPath(); x.rect(w0, wv0, w1 - w0, wv1 - wv0); x.clip();
    const g = x.createRadialGradient(lx, wv1 - 0.5, 0, lx, wv1 - 0.5, 2.6); g.addColorStop(0, 'rgba(255,214,150,0.55)'); g.addColorStop(0.4, 'rgba(230,160,90,0.22)'); g.addColorStop(1, 'rgba(120,70,40,0)');
    x.fillStyle = g; x.fillRect(w0, wv0, w1 - w0, wv1 - wv0);
    x.fillStyle = 'rgba(255,240,210,0.95)'; x.beginPath(); x.arc(lx, wv1 - 0.48, 0.12, 0, Math.PI * 2); x.fill();
    x.restore();
    x.restore();
  }
  // a room's still look at night (7a; 7b's moments draw over these)
  function room(x, w) {
    const [a, b] = w.u, [r0, r1] = w.v, g0 = a + 0.13 + 0.05, g1 = b - 0.05, h0 = r0 + 0.12, h1 = r1 - 0.06, mid = h0 + (h1 - h0) * 0.46, cw = g1 - g0, ch = h1 - h0;
    x.save(); x.beginPath(); x.rect(g0, h0, cw, ch); x.clip();
    const warm = (c0, c1) => { const g = x.createLinearGradient(0, h1, 0, h0); g.addColorStop(0, c0); g.addColorStop(1, c1); x.fillStyle = g; x.fillRect(g0, h0, cw, ch); };
    if (w.lit === 'bar') {
      // THE BAR — the one clear window: the back-bar mirror glowing gold, three shelves of bottles, a pendant, the counter, a patron
      warm('rgb(255,196,112)', 'rgb(176,98,46)');
      const r = rngFrom(31), bc = [[255, 170, 60], [90, 200, 110], [230, 60, 60], [255, 230, 170], [120, 170, 255], [255, 140, 40]];
      for (const v of [h0 + ch * 0.42, h0 + ch * 0.62, h0 + ch * 0.8]) {
        R(x, g0, v - 0.04, g1, v, 'rgb(96,52,28)');
        for (let u = g0 + 0.05; u < g1 - 0.05; u += 0.09 + r() * 0.05) { const c = bc[Math.floor(r() * bc.length)], hh = 0.12 + r() * 0.1; R(x, u, v, u + 0.055, v + hh, c); R(x, u + 0.012, v + hh * 0.4, u + 0.024, v + hh * 0.9, 'rgba(255,255,240,0.7)'); }
      }
      const px = g0 + cw * 0.5; R(x, px - 0.008, h1 - 0.25, px + 0.008, h1, 'rgb(60,40,30)');
      const lg = x.createRadialGradient(px, h1 - 0.3, 0, px, h1 - 0.3, 0.6); lg.addColorStop(0, 'rgba(255,250,220,1)'); lg.addColorStop(0.25, 'rgba(255,214,140,0.6)'); lg.addColorStop(1, 'rgba(255,190,100,0)'); x.fillStyle = lg; x.fillRect(px - 0.6, h1 - 0.9, 1.2, 1.2);
      R(x, g0, h0, g1, h0 + ch * 0.3, 'rgb(70,34,20)'); R(x, g0, h0 + ch * 0.3 - 0.05, g1, h0 + ch * 0.3, 'rgb(230,170,90)');
      // a patron at the bar (his back to us: hat, shoulders)
      x.fillStyle = 'rgb(28,14,14)'; const hx = g0 + cw * 0.72, hy = h0 + ch * 0.3;
      x.beginPath(); x.ellipse(hx, hy + 0.1, 0.32, 0.26, 0, 0, Math.PI * 2); x.fill(); x.beginPath(); x.arc(hx, hy + 0.48, 0.13, 0, Math.PI * 2); x.fill();
      R(x, hx - 0.2, hy + 0.56, hx + 0.2, hy + 0.6); R(x, hx - 0.11, hy + 0.6, hx + 0.11, hy + 0.72);
    } else if (w.lit === 'shade') {
      // THE JAZZ ROOM behind an amber shade (three quarters down): the glowing shade, the sax player's shadow on it
      warm('rgb(255,170,90)', 'rgb(150,70,40)');
      const sv = h0 + ch * 0.26;
      const g = x.createLinearGradient(0, sv, 0, h1); g.addColorStop(0, 'rgb(255,200,120)'); g.addColorStop(1, 'rgb(236,150,70)'); x.fillStyle = g; x.fillRect(g0, sv, cw, h1 - sv);
      x.fillStyle = 'rgba(120,52,24,0.55)'; const sx = g0 + cw * 0.46, sy = sv + 0.05;
      x.beginPath(); x.ellipse(sx, sy + 0.62, 0.24, 0.5, 0.1, 0, Math.PI * 2); x.fill(); x.beginPath(); x.arc(sx + 0.03, sy + 1.25, 0.15, 0, Math.PI * 2); x.fill();
      x.lineWidth = 0.09; x.strokeStyle = 'rgba(120,52,24,0.55)'; x.beginPath(); x.moveTo(sx + 0.12, sy + 1.12); x.quadraticCurveTo(sx + 0.42, sy + 0.8, sx + 0.3, sy + 0.42); x.quadraticCurveTo(sx + 0.24, sy + 0.25, sx + 0.42, sy + 0.32); x.stroke();
      R(x, g0, sv, g1, sv + 0.05, 'rgba(110,60,30,0.8)');
      x.fillStyle = 'rgba(110,60,30,0.25)'; for (let v = sv + 0.22; v < h1; v += 0.22) x.fillRect(g0, v, cw, 0.012);
    } else if (w.lit === 'lamp') {
      // THE APARTMENT: warm wallpaper, a fringed floor lamp, a picture, the armchair's back, the curtains tied back
      warm('rgb(250,190,120)', 'rgb(190,110,64)');
      x.fillStyle = 'rgba(150,80,40,0.18)'; for (let u = g0; u < g1; u += 0.16) x.fillRect(u, h0, 0.05, ch);
      R(x, g0 + cw * 0.55, h0 + ch * 0.55, g0 + cw * 0.85, h0 + ch * 0.8, 'rgb(120,64,36)'); R(x, g0 + cw * 0.58, h0 + ch * 0.58, g0 + cw * 0.82, h0 + ch * 0.77, 'rgb(214,150,90)');
      const lx = g0 + cw * 0.22; R(x, lx - 0.01, h0, lx + 0.01, h0 + ch * 0.66, 'rgb(70,40,26)');
      x.fillStyle = 'rgb(255,232,170)'; x.beginPath(); x.moveTo(lx - 0.2, h0 + ch * 0.66); x.lineTo(lx + 0.2, h0 + ch * 0.66); x.lineTo(lx + 0.12, h0 + ch * 0.8); x.lineTo(lx - 0.12, h0 + ch * 0.8); x.fill();
      const lg = x.createRadialGradient(lx, h0 + ch * 0.72, 0, lx, h0 + ch * 0.72, 0.9); lg.addColorStop(0, 'rgba(255,240,200,0.7)'); lg.addColorStop(1, 'rgba(255,200,120,0)'); x.fillStyle = lg; x.fillRect(lx - 0.9, h0, 1.8, ch);
      x.fillStyle = 'rgb(84,34,30)'; x.beginPath(); x.ellipse(g0 + cw * 0.6, h0 + 0.05, 0.42, 0.32, 0, Math.PI, 0, true); x.fill();
      for (const [p, q, d] of [[g0, g0 + 0.3, 1], [g1 - 0.3, g1, -1]]) { x.fillStyle = 'rgb(130,36,40)'; x.beginPath(); x.moveTo(p, h1); x.lineTo(q, h1); x.quadraticCurveTo(d > 0 ? q - 0.05 : p + 0.05, h0 + ch * 0.45, d > 0 ? q - 0.12 : p + 0.12, h0); x.lineTo(d > 0 ? p : q, h0); x.fill(); }
    } else if (w.lit === 'table') {
      // THE BACK ROOM: dark, a green-shaded lamp low over a round table, its pool of light, three heads around it, a soft haze
      R(x, g0, h0, g1, h1, 'rgb(70,40,26)');
      const tx = g0 + cw / 2, ty = h0 + ch * 0.22;
      const pg = x.createRadialGradient(tx, ty + 0.2, 0, tx, ty + 0.2, 1.1); pg.addColorStop(0, 'rgba(255,214,140,0.95)'); pg.addColorStop(0.5, 'rgba(200,130,70,0.5)'); pg.addColorStop(1, 'rgba(70,40,26,0)'); x.fillStyle = pg; x.fillRect(g0, h0, cw, ch);
      // three players seated round it (silhouettes: shoulders + heads, one in a hat), the table in front of them
      const sil = 'rgb(22,12,10)';
      for (const [dx, sc, hat] of [[0.02, 0.82, false], [-0.56, 1, true], [0.58, 0.96, false]]) {
        const px = tx + dx, sh = 0.34 * sc;
        x.fillStyle = sil; x.beginPath(); x.moveTo(px - 0.25 * sc, ty); x.quadraticCurveTo(px - 0.25 * sc, ty + sh, px, ty + sh + 0.02); x.quadraticCurveTo(px + 0.25 * sc, ty + sh, px + 0.25 * sc, ty); x.fill();
        x.beginPath(); x.arc(px, ty + sh + 0.13 * sc, 0.12 * sc, 0, Math.PI * 2); x.fill();
        if (hat) { R(x, px - 0.19 * sc, ty + sh + 0.2 * sc, px + 0.19 * sc, ty + sh + 0.235 * sc, sil); R(x, px - 0.11 * sc, ty + sh + 0.23 * sc, px + 0.11 * sc, ty + sh + 0.33 * sc, sil); }
        // (the lamp's rim light on the shoulders)
        x.fillStyle = 'rgba(255,190,110,0.35)'; x.beginPath(); x.arc(px + (dx < 0 ? 0.06 : -0.06) * sc, ty + sh + 0.16 * sc, 0.1 * sc, 0, Math.PI); x.fill();
      }
      x.fillStyle = 'rgb(46,104,62)'; x.beginPath(); x.ellipse(tx, ty, 0.66, 0.14, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = 'rgb(92,160,98)'; x.beginPath(); x.ellipse(tx, ty + 0.02, 0.5, 0.08, 0, 0, Math.PI * 2); x.fill();
      R(x, tx - 0.66, ty - 0.1, tx + 0.66, ty - 0.02, 'rgb(40,22,14)');
      x.fillStyle = 'rgba(250,246,236,0.9)'; for (const d of [-0.22, 0.05, 0.28]) x.fillRect(tx + d, ty + 0.01, 0.07, 0.04);
      // the lamp: its cord, a green glass shade low over the table, the cone of light down to the felt
      R(x, tx - 0.008, ty + 0.92, tx + 0.008, h1, 'rgb(30,20,16)');
      x.fillStyle = 'rgba(255,214,140,0.16)'; x.beginPath(); x.moveTo(tx - 0.16, ty + 0.78); x.lineTo(tx + 0.16, ty + 0.78); x.lineTo(tx + 0.62, ty + 0.04); x.lineTo(tx - 0.62, ty + 0.04); x.fill();
      x.fillStyle = 'rgb(36,104,58)'; x.beginPath(); x.moveTo(tx - 0.1, ty + 0.94); x.lineTo(tx + 0.1, ty + 0.94); x.lineTo(tx + 0.24, ty + 0.78); x.lineTo(tx - 0.24, ty + 0.78); x.fill();
      R(x, tx - 0.24, ty + 0.76, tx + 0.24, ty + 0.79, 'rgb(255,226,160)');
      R(x, g0, h0 + ch * 0.6, g1, h1, 'rgba(255,220,180,0.06)');
    } else {
      // an EDGE window: curtains drawn, glowing with the room's light; a brighter gap between them
      warm('rgb(240,150,80)', 'rgb(170,80,44)');
      R(x, g0 + cw * 0.46, h0, g0 + cw * 0.56, h1, 'rgb(255,214,150)');
      x.fillStyle = 'rgba(120,40,24,0.35)'; for (let u = g0 + 0.05; u < g1; u += 0.12) x.fillRect(u, h0, 0.035, ch);
      if (w.id === 'edge2') { x.fillStyle = 'rgba(30,20,14,0.9)'; for (let i = 0; i < 6; i++) { x.beginPath(); x.ellipse(g0 + 0.32 + i * 0.12, h0 + 0.2 + (i % 3) * 0.1, 0.13, 0.08, 0.4 * (i - 3), 0, Math.PI * 2); x.fill(); } R(x, g0 + 0.28, h0, g0 + 0.95, h0 + 0.16, 'rgb(30,18,14)'); }
    }
    x.restore();
    // the sash over the light (dark against it): the meeting rail, the muntins
    const fc = 'rgb(26,18,20)';
    R(x, g0, mid - 0.04, g1, mid + 0.04, fc);
    for (let i = 1; i < 3; i++) { const ww = (cw - 0.12) / 3; R(x, g0 + i * (ww + 0.06) - 0.06, mid, g0 + i * (ww + 0.06), h1, fc); }
    // the sill catching the light
    R(x, a - 0.16, r0 - 0.03, b + 0.16, r0, 'rgba(255,200,140,0.55)');
  }
  // the ghost ad under its lamps: the wall + the ad in the lamps' warm light, kept only where the light falls (its pools)
  function paintAd(game) {
    adCv = canvasFor(adCv);
    const x = safeCtx(adCv), k = G.K * dpr, len = G.len;
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, adCv.width, adCv.height);
    const fl = document.createElement('canvas'); fl.width = Math.ceil(len * k); fl.height = Math.ceil(V.parapet * k);
    const fx = safeCtx(fl); fx.setTransform(k, 0, 0, -k, 0, fl.height);
    const DT = { day: 1, gold: 0, night: 0, sunDir: 0, sunEl: 30, ovc: 0, haze: [188, 208, 232] };
    const M = mats(DT);
    const pat = fx.createPattern(brickTile(mix(M.brickS, [150, 80, 60], 0.3), Math.max(2, Math.round(0.11 * k)), Math.max(4, Math.round(0.26 * k)), 5, false), 'repeat');
    fx.fillStyle = pat; fx.save(); fx.setTransform(1, 0, 0, 1, 0, 0); fx.fillRect(0, 0, fl.width, fl.height); fx.restore();
    paintGhostAd(fx, M, game, 0.85, len - 0.6, 4.75, 9.3, 12);
    // the lamps' light: warm, a pool under each lamp brightest at the top, fading down the wall
    fx.globalCompositeOperation = 'multiply'; fx.fillStyle = 'rgb(255,186,120)'; fx.fillRect(0, 0, len, V.parapet);
    fx.globalCompositeOperation = 'destination-in';
    const mask = document.createElement('canvas'); mask.width = fl.width; mask.height = fl.height; const mx = safeCtx(mask); mx.setTransform(k, 0, 0, -k, 0, fl.height);
    for (const f of [0.22, 0.5, 0.78]) { const w = 0.85 + (len - 1.45) * f; mx.save(); mx.translate(w, 9.55); mx.scale(1, 1.55); const g = mx.createRadialGradient(0, 0, 0, 0, 0, 2.2); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.35, 'rgba(0,0,0,0.75)'); g.addColorStop(0.7, 'rgba(0,0,0,0.3)'); g.addColorStop(1, 'rgba(0,0,0,0)'); mx.fillStyle = g; mx.fillRect(-2.3, -2.3, 4.6, 4.6); mx.restore(); }
    fx.setTransform(1, 0, 0, 1, 0, 0); fx.drawImage(mask, 0, 0); fx.globalCompositeOperation = 'source-over';
    mask.width = mask.height = 0;
    // projected like the baked wall
    x.setTransform(dpr, 0, 0, dpr, -box.x * dpr, -box.y * dpr);
    const step = 1 / dpr, [ax] = G.side(0, 0), [bx] = G.side(len, 0);
    for (let px = Math.floor(ax * dpr) / dpr; px < bx; px += step) {
      const wa = Math.max(0, G.wAt(px)), wb = Math.min(len, G.wAt(px + step)); if (!(wb > wa)) continue;
      const wm = (wa + wb) / 2, [, yt] = G.side(wm, V.parapet), [, yb] = G.side(wm, 0);
      x.drawImage(fl, wa * k, 0, Math.max(0.5, (wb - wa) * k), fl.height, px, yt, step + 0.25 / dpr, yb - yt);
    }
    fl.width = fl.height = 0;
  }
  // the blade under its lamps (the corner as it is): the board painted in their warm light, brightest at the top
  let bladeCv = null, bladeKey = '', bladeAt = null;
  function paintBladeLit(game) {
    const bg = bladeGeo(G), R0 = bg.rect, pad = 2, ow = R0.w + pad * 2 + G.K, oh = R0.h + pad * 2;
    bladeCv = bladeCv || document.createElement('canvas');
    bladeCv.width = Math.ceil(ow * dpr); bladeCv.height = Math.ceil(oh * dpr);
    const x = safeCtx(bladeCv), ox = R0.x - pad - G.K * 0.5, oy = R0.y - pad;
    x.setTransform(dpr, 0, 0, dpr, -ox * dpr, -oy * dpr);
    x.save(); wallMap(x, bg.ox, bg.oy, bg.k);
    paintBlade(x, mats({ day: 1, gold: 0, night: 0, sunDir: 0, sunEl: 30, ovc: 0, haze: [188, 208, 232] }), game, true);
    x.restore();
    const keep = document.createElement('canvas'); keep.width = bladeCv.width; keep.height = bladeCv.height; safeCtx(keep).drawImage(bladeCv, 0, 0);
    x.globalCompositeOperation = 'multiply'; x.fillStyle = 'rgb(255,190,126)'; x.fillRect(ox, oy, ow, oh);
    x.globalCompositeOperation = 'destination-in'; x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(keep, 0, 0); x.restore(); keep.width = keep.height = 0;
    const g = x.createLinearGradient(0, R0.y, 0, R0.y + R0.h); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.55, 'rgba(0,0,0,0.75)'); g.addColorStop(1, 'rgba(0,0,0,0.4)');
    x.fillStyle = g; x.fillRect(ox, oy, ow, oh);
    x.globalCompositeOperation = 'source-over';
    return { x: ox, y: oy, w: ow, h: oh };
  }
  function glow() {
    if (glowCv) return glowCv;
    glowCv = document.createElement('canvas'); glowCv.width = glowCv.height = 64;
    const x = safeCtx(glowCv), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,200,130,1)'); g.addColorStop(0.35, 'rgba(255,170,90,0.4)'); g.addColorStop(1, 'rgba(255,150,70,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return glowCv;
  }
  const blob = (c, cx, cy, r, a, sy = 1) => { if (a <= 0.004) return; c.globalAlpha = Math.min(1, a); c.drawImage(glow(), cx - r, cy - r * sy, r * 2, r * 2 * sy); };
  // THE BARBER POLE (live): a glass cylinder of red / white / blue spirals in chrome caps. It ALWAYS turns — by day unlit, at the
  // shop's pace; from DUSK until MORNING lit from inside with a soft old-school incandescent glow (warm yellow through the glass, never
  // LED-bright) and turning SLOWLY, even with the CLOSED card up: the secret "we're open". (7b's raid: pole({ on: false }) snaps it
  // dark and stops it; pole({ on: true }) gives it back.)
  let polePh = 0.3, poleT = -1, poleOff = false;
  const POLE_DAY = 0.42, POLE_NIGHT = 0.16;             // (stripes a second: the shop's pace / the slow night turn)
  function drawPole(c, f) {
    const s = G.s, p = s.shop.pole, z = s.z0 - 0.42, [cx, y0] = project(G.cam, s.x0 + p.u, p.v1, z), [, y1] = project(G.cam, s.x0 + p.u, p.v0, z), sc = G.cam.F / z, r = 0.17 * sc, h = y1 - y0;
    const day = clamp01(f.day), lit = poleOff ? 0 : clamp01(f.pole == null ? f.k : f.pole);
    const lum = 0.2 + 0.8 * day, dim = c2 => c2.map(v => Math.round(v * lum + 8 * (1 - lum)));
    // (the lamp inside: each colour seen through warm-lit glass — the white a soft cream-yellow, the red warm, the blue a dusky violet)
    const WARM = { r: [255, 112, 64], w: [255, 222, 150], b: [128, 104, 168] };
    const col = (c2, key) => (lit > 0 ? mix(dim(c2), WARM[key], lit * 0.92) : dim(c2));
    const dt = poleT < 0 ? 0 : Math.min(0.1, Math.max(0, f.t - poleT)); poleT = f.t;
    if (f.motion && !poleOff) polePh = (polePh + dt * (POLE_DAY + (POLE_NIGHT - POLE_DAY) * lit)) % 1;
    c.save();
    // the warm halo the lit glass throws on the wall + the pavement (soft, small)
    if (lit > 0.01 && f.tier !== 0) { c.globalCompositeOperation = 'lighter'; blob(c, cx, (y0 + y1) / 2, h * 0.75, 0.32 * lit, 1.15); c.globalCompositeOperation = 'source-over'; c.globalAlpha = f.fade == null ? 1 : f.fade; }
    // the chrome cap + finial, the base
    c.fillStyle = rgb(mix(dim([196, 200, 210]), [120, 96, 70], lit * 0.5)); c.beginPath(); c.ellipse(cx, y0, r * 1.25, r * 0.5, 0, Math.PI, 0); c.fill(); c.fillRect(cx - r * 1.25, y0, r * 2.5, r * 0.35);
    c.beginPath(); c.arc(cx, y0 - r * 0.85, r * 0.35, 0, Math.PI * 2); c.fill();
    c.fillRect(cx - r * 1.25, y1 - r * 0.35, r * 2.5, r * 0.5);
    c.beginPath(); c.rect(cx - r, y0 + r * 0.35, r * 2, h - r * 0.7); c.clip();
    c.fillStyle = rgb(col([244, 242, 236], 'w')); c.fillRect(cx - r, y0, r * 2, h);
    const band = r * 2.2, cols = [[[200, 30, 40], 'r'], null, [[30, 60, 160], 'b'], null];
    for (let i = -2, k = 0; i * band < h + band * 2; i++, k++) {
      const yy = y1 - (i + polePh * 4) * band / 2, cc = cols[((k % 4) + 4) % 4];
      if (!cc) continue;
      c.fillStyle = rgb(col(cc[0], cc[1]));
      c.beginPath(); c.moveTo(cx - r, yy); c.lineTo(cx + r, yy - band * 0.7); c.lineTo(cx + r, yy - band * 0.7 - band * 0.42); c.lineTo(cx - r, yy - band * 0.42); c.fill();
    }
    // the glass's roundness: dark edges, a bright highlight (lit: the glow brightest down the middle, the edges warm-dark)
    const g = c.createLinearGradient(cx - r, 0, cx + r, 0);
    if (lit > 0.01) { g.addColorStop(0, `rgba(60,24,10,${(0.55 - 0.15 * lit).toFixed(3)})`); g.addColorStop(0.45, `rgba(255,236,180,${(0.22 * lit).toFixed(3)})`); g.addColorStop(1, 'rgba(50,20,10,0.55)'); }
    else { g.addColorStop(0, 'rgba(0,0,0,0.45)'); g.addColorStop(0.3, 'rgba(255,255,255,0.32)'); g.addColorStop(0.42, 'rgba(255,255,255,0.05)'); g.addColorStop(1, 'rgba(0,0,0,0.5)'); }
    c.fillStyle = g; c.fillRect(cx - r, y0, r * 2, h);
    c.restore();
  }
  function draw(c, f) {
    if (!G) return;
    const fade = f.fade == null ? 1 : f.fade;
    c.save();
    const k = clamp01(f.k) * fade; lastK = k;
    if (k > 0.004) {
      const levels = wins.map(w => Math.round(levelOf(w, f) * 8) / 8), key = levels.join(',') + '|' + dpr;
      if (key !== litKey || !litCv) { paintLit(levels); litKey = key; }
      c.globalAlpha = k; c.drawImage(litCv, box.x, box.y, box.w, box.h);
      // the light spilling onto the brick round each lit window + the shop's lamp + the sconce
      c.globalCompositeOperation = 'lighter';
      if (f.tier !== 0) wins.forEach((w, i) => { const r = w.rect; blob(c, r.x + r.w / 2, r.y + r.h * 0.55, Math.max(r.w, r.h) * 1.05, 0.22 * k * levels[i]); });
      const [w0, w1, , wv1] = G.s.shop.win, [lx, ly] = G.front(w0 + (w1 - w0) * 0.38, wv1 - 0.48); blob(c, lx, ly, G.K * 0.9, 0.5 * k);
      c.globalCompositeOperation = 'source-over';
    }
    // for 7b: a moment's own painter over its window
    for (const [id, fn] of drawers) { const w = wins.find(o => o.id === id); if (w) fn(c, w, f); }
    c.globalCompositeOperation = 'lighter';
    // the sconce by the side door (warm, from dusk)
    { const sc = G.s.shop.sconce, [sx, sy] = G.front(sc.u, sc.v + 0.13), a = clamp01(f.sconce == null ? f.k : f.sconce) * fade; blob(c, sx, sy, G.K * 0.45, a); if (f.tier !== 0) blob(c, sx, sy + G.K * 0.6, G.K * 2.2, 0.35 * a, 1.2); }
    // THE BASEMENT WINDOW: the one hint of the secret — a faint warm amber, day + night, breathing a little
    { const b = basement, br = 0.75 + 0.1 * (f.motion ? Math.sin(f.t * 1.3) + 0.5 * Math.sin(f.t * 3.7) : 0), a = (0.26 + 0.2 * clamp01(f.night)) * br * fade;
      c.globalAlpha = Math.min(1, a); c.fillStyle = 'rgb(255,150,60)'; c.fillRect(b.x, b.y, b.w, b.h);
      blob(c, b.x + b.w / 2, b.y + b.h * 0.5, b.w * 0.75, a * 0.45, 0.4); }
    c.globalCompositeOperation = 'source-over';
    // THE GHOST AD'S LAMPS: their light on the ad (the lit painting), the bulbs
    if (G.turned && f.game && (f.lamp || 0) > 0.004) {
      const key = f.game.id + '|' + dpr;
      if (key !== adKey || !adCv) { paintAd(f.game); adKey = key; }
      c.globalAlpha = clamp01(f.lamp) * fade; c.drawImage(adCv, box.x, box.y, box.w, box.h);
      c.globalCompositeOperation = 'lighter';
      for (const l of adLamps(G)) { blob(c, l.x, l.y + l.W * 0.1, l.W * 0.7, f.lamp * fade); blob(c, l.x, l.y + l.W * 1.8, l.W * 3.2, 0.25 * f.lamp * fade, 1.4); }
      c.globalCompositeOperation = 'source-over';
    }
    // THE BLADE'S LAMPS (the corner as it is): the lit board, the bulbs
    if (!G.turned && f.game && (f.lamp || 0) > 0.004) {
      const key = f.game.id + '|' + dpr + '|' + G.K.toFixed(2);
      if (key !== bladeKey || !bladeCv) { bladeAt = paintBladeLit(f.game); bladeKey = key; }
      c.globalAlpha = clamp01(f.lamp) * fade; c.drawImage(bladeCv, bladeAt.x, bladeAt.y, bladeAt.w, bladeAt.h);
      c.globalCompositeOperation = 'lighter';
      for (const l of bladeLamps(bladeGeo(G))) { blob(c, l.x, l.y + l.W * 0.1, l.W * 0.75, f.lamp * fade); if (f.tier !== 0) blob(c, l.x, l.y + l.W * 2.4, l.W * 3, 0.22 * f.lamp * fade, 1.6); }
      c.globalCompositeOperation = 'source-over';
    }
    c.globalAlpha = fade;
    drawPole(c, f);
    c.restore();
  }
  return {
    layout, draw,
    windows: () => wins.map(w => ({ id: w.id, room: w.room, floor: w.floor, col: w.col, edge: !!w.edge, rect: { ...w.rect } })),
    light(id, k) { if (k == null) own.delete(id); else own.set(id, clamp01(k)); },
    mirror(k) { mirror = clamp01(k || 0); },
    /** the barber pole: { on: false } dark + still (7b's raid), { on: true } back to its lamp + its turn */
    pole(o = {}) { if ('on' in o) poleOff = !o.on; },
    roomDraw(id, fn) { if (fn) drawers.set(id, fn); else drawers.delete(id); },
    debug: () => ({ turned: G ? G.turned : null, side: G ? +G.len.toFixed(2) : 0, sidePt: G ? Math.round(G.side(G.len, 0)[0] - G.side(0, 0)[0]) : 0, windows: wins.length, mirror, poleOn: !poleOff, polePh: +polePh.toFixed(3), box, dpr, k: lastK, lit: !!litCv, adLit: !!adCv, mb: +(((litCv ? litCv.width * litCv.height : 0) + (adCv ? adCv.width * adCv.height : 0) + (bladeCv ? bladeCv.width * bladeCv.height : 0)) * 4 / 1e6).toFixed(2) }),
    destroy() { for (const cv of [litCv, adCv, glowCv, bladeCv]) if (cv) cv.width = cv.height = 0; litCv = adCv = glowCv = bladeCv = null; },
  };
}
