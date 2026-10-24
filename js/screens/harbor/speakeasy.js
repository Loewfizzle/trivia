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
import { dayPaint } from './signs.js';
import { paintRoom, createWindowLife, SASH_RAIL, lateOf } from './windows.js';
import { createHushSign } from './hushsign.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const tri = (T, d, g, n) => [0, 1, 2].map(i => d[i] * (T.day || 0) + g[i] * (T.gold || 0) + n[i] * (T.night || 0));
const FONT = (px, w = 700) => `${w} ${px}px "Chakra Petch", Orbitron, sans-serif`;
const V = SPEAK_V;
const W_FRONT = 11.2;
const GLASS_IN = 0.16;                   // a window's recess (exaggerated a little: the jamb reads as depth at phone size)
/** FP2 — CRISP LIGHTS, NEVER SMOKE (the owner: the shopfront "looks smoky"): a light is its SOURCE, a small TIGHT halo, and its light
 *  LANDING on the surfaces near it — never a translucent wash. The halos' radii (wall units: × G.K pt) — the shop lamp's globe, the
 *  sconce's glass — and landR: the sconce's light landing on the brick + the door's frame (baked: paintGround), gone by then. */
/** SP2 — the awning's night lamp (wall units): over the shop window's middle; reach: its light's fall along the awning; the canvas's
 *  glow by stripe (the cream ones let more through), the scallops' rim */
/** 8P — THREE LAMPS under the awning (the owner: one lamp lit the middle only): each end + the middle (us), each a little dimmer (k)
 *  than SP2's single one, so together they wash the shopfront EVENLY; crisp SOURCES — a small brass shade hung under the valance's
 *  scallops with a lit bulb + a tight halo (live) — and their light landing on the canvas, the shopfront, the pavement (baked). The
 *  barber pole stays the brightest light on the front (tested). */
const AWNING_LAMP = Object.freeze({ us: [2.5, 5.6, 7.85], k: 0.72, reach: 1.45, cream: 0.3, red: 0.14, rim: 0.55, drop: 0.03, bulb: 0.07, halo: 0.34 });
/** the awning lamps' bulbs (wall units u across + world y / z): just under the valance's foot */
/** 8P — the valance's depth (world units; was 0.42: it hid the window's head — the gold arch + the sign need the room) */
const VAL = 0.34;
const awningBulbs = aw => AWNING_LAMP.us.map(u => ({ u, y: aw.y1 - VAL - AWNING_LAMP.drop, z: aw.z + 0.05 }));
export const SHOP_GLOW = Object.freeze({ lamp: 0.2, sconce: 0.24, landR: 0.95 });   // (SP2: tighter — a few pt)

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
function text(x, s, u, v, size, { fill, stroke = null, lw = 0, align = 'center', sq = 1, font = FONT, rot = 0, glow = null } = {}) {
  x.save(); x.translate(u, v); x.scale(1, -1); if (rot) x.rotate(rot); x.scale(sq / 100, 1 / 100);
  if (glow && glow[0] > 0) { x.shadowBlur = glow[0]; x.shadowColor = glow[1]; }          // (a baked glow: the blade's lit letters — device px)
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
  // 8P — THE DATE STONE (Ben: "EST. 1924" on the awning was unreadable): a carved stone tablet at the top centre of the facade, where the
  // sunburst sat — "1924" in big carved numerals, the way a 1920s building showed its year; softly lit at night (paintDateStone)
  paintDateStone(x, M, cm, hi, lo);
  for (const u of [3.55, 6.75, 9.95]) { R(x, u - 0.24, V.parapet - 0.02, u + 0.24, V.parapet + 0.18, trim); R(x, u - 0.13, V.parapet + 0.18, u + 0.13, V.parapet + 0.32, trim); R(x, u - 0.24, V.parapet + 0.14, u + 0.24, V.parapet + 0.18, hi); }
}

/** 8P — THE DATE STONE: a pale limestone tablet with a moulded frame set into the parapet + the crest's lower step, "1924" in big incised
 *  numerals (one crisp fill — a carved letter is darker than its face; no offset copy), a hidden lamp on the cornice washing it softly
 *  from below at night. DATE: its size + place (wall units) */
export const DATE = Object.freeze({ w: 2.3, v0: 10.58, v1: 11.52, cap: 0.6, text: '1924' });
function paintDateStone(x, M, cm, hi, lo) {
  const D = DATE, a = cm - D.w / 2, b = cm + D.w / 2, stone = mix(mix(M.trim, [236, 228, 208], 0.45 * (1 - M.night)), hi, 0.15 + 0.25 * M.night);
  R(x, a - 0.08, D.v0 - 0.08, b + 0.08, D.v1 + 0.08, shade(stone, -0.22));           // (the moulding's shadowed outer edge)
  R(x, a - 0.04, D.v0 - 0.04, b + 0.04, D.v1 + 0.04, mix(stone, hi, 0.4));             // (its lit fillet)
  R(x, a, D.v0, b, D.v1, stone);
  R(x, a, D.v1 - 0.06, b, D.v1, shade(stone, -0.12));                                  // (the top edge's shade under the coping)
  R(x, a, D.v0, b, D.v0 + 0.04, mix(stone, [255, 255, 255], 0.2 * (1 - M.night)));    // (the sill's lit lower edge)
  // the year: incised — the cut a deep shadow inside the stone (one fill + a thin darker rim), centred
  const carve = mix(shade(stone, -0.55), [40, 30, 28], 0.35);
  text(x, D.text, cm, D.v0 + (D.v1 - D.v0 - D.cap) / 2 + 0.02, D.cap / 0.72, { fill: rgb(carve), stroke: rgb(shade(carve, -0.25)), lw: 0.02, sq: 1.05, font: (px, w = 800) => `${w} ${px}px "Chakra Petch", Orbitron, sans-serif` });
  // at night: a soft warm wash from a lamp hidden on the cornice, brightest at the foot (baked by the lamps' ramp)
  const lk = clamp01(M.T.lamps == null ? M.night : M.T.lamps) * clamp01((M.night - 0.3) / 0.5);
  if (lk > 0.01) {
    x.save(); x.globalCompositeOperation = 'lighter';
    const g = x.createLinearGradient(0, D.v0, 0, D.v1 + 0.3); g.addColorStop(0, rgb([255, 204, 150], 0.72 * lk)); g.addColorStop(0.75, rgb([255, 192, 134], 0.34 * lk)); g.addColorStop(1, rgb([255, 190, 130], 0));
    x.fillStyle = g; x.fillRect(a - 0.1, D.v0 - 0.1, D.w + 0.2, D.v1 - D.v0 + 0.4); x.restore();
    R(x, cm - 0.25, D.v0 - 0.16, cm + 0.25, D.v0 - 0.08, M.iron);                     // (the little lamp's hood on the cornice)
    text(x, D.text, cm, D.v0 + (D.v1 - D.v0 - D.cap) / 2 + 0.02, D.cap / 0.72, { fill: rgb(mix(carve, [30, 18, 16], 0.5)), sq: 1.05, font: (px, w = 800) => `${w} ${px}px "Chakra Petch", Orbitron, sans-serif` });
  }
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
  // SP2 — BIG CLEAN PANES (the owner: the thick bar through the middle split every scene): a slim frame, a 1920s one-over-one sash
  // with its meeting rail HIGH (SASH_RAIL of the glass up: the upper sash a short band) — one big lower pane for the room's scene
  const g0 = gs + 0.05, g1 = b - 0.05, h0 = gb + 0.05, h1 = r1 - 0.06, rail = h0 + (h1 - h0) * SASH_RAIL;
  R(x, gs, gb, b, r1, M.frame);
  const pane = (p0, p1, q0, q1) => {
    if (!night) {
      const g = x.createLinearGradient(0, q1, 0, q0);
      g.addColorStop(0, rgb(M.glassTop)); g.addColorStop(0.45, rgb(mix(M.glassTop, M.glassLo, 0.75))); g.addColorStop(1, rgb(mix(M.inside, M.glassLo, 0.35)));
      x.fillStyle = g; x.fillRect(p0, q0, p1 - p0, q1 - q0);
    } else R(x, p0, q0, p1, q1, mix(M.inside, M.glassTop, 0.25));
  };
  pane(g0, g1, h0, h1);
  // the shade (roller blind) pulled to its height, the curtains framing the edges (never across the middle), by day
  if (!night && o.blind != null) {
    const bv = h1 - (h1 - h0) * o.blind;
    R(x, g0, bv, g1, h1, M.blind); R(x, g0, bv, g1, bv + 0.04, shade(M.blind, -0.25));
    R(x, (g0 + g1) / 2 - 0.03, bv - 0.1, (g0 + g1) / 2 + 0.03, bv, M.frame);
  }
  if (!night && o.curtain) for (const [p, q, d] of [[g0, g0 + 0.2, 1], [g1 - 0.2, g1, -1]]) { R(x, p, h0, q, h1, o.curtain); R(x, d > 0 ? q - 0.04 : p, h0, d > 0 ? q : p + 0.04, h1, shade(o.curtain, 0.12)); R(x, (p + q) / 2 - 0.015, h0, (p + q) / 2 + 0.015, h1, shade(o.curtain, -0.25)); }
  if (!night && o.plant) { x.fillStyle = rgb(tri(M.T, [52, 96, 52], [70, 80, 40], [10, 14, 14])); for (let i = 0; i < 6; i++) { x.beginPath(); x.ellipse(g0 + 0.35 + i * 0.12, h0 + 0.18 + (i % 3) * 0.1, 0.13, 0.08, 0.4 * (i - 3), 0, Math.PI * 2); x.fill(); } R(x, g0 + 0.28, h0, g0 + 0.95, h0 + 0.16, [150, 80, 54]); }
  // the glass's reflections by day: a diagonal sheen, the head's shadow at the top of the panes
  if (!night) {
    x.save(); x.beginPath(); x.rect(g0, h0, g1 - g0, h1 - h0); x.clip();
    x.fillStyle = 'rgba(255,255,255,0.16)'; x.beginPath(); x.moveTo(g0 + 0.2, h1); x.lineTo(g0 + 0.62, h1); x.lineTo(g0 + 0.02, h0 + (h1 - h0) * 0.3); x.lineTo(g0 - 0.4, h0 + (h1 - h0) * 0.3); x.fill();
    const hs = 0.12 + 0.22 * clamp01(((M.T.sunEl || 30) - 10) / 40);
    R(x, g0, h1 - hs, g1, h1, [0, 0, 0], 0.22 * (M.day + M.gold) * (1 - 0.6 * M.ov));
    x.restore();
  }
  // the meeting rail (slim, high) + the frame's lit edges
  R(x, g0, rail - 0.025, g1, rail + 0.025, M.frame); R(x, g0, rail + 0.025, g1, rail + 0.04, M.frameHi); R(x, gs, r1 - 0.02, b, r1, M.frameHi);
  // 8P — THE WINDOW BOX (the apartment), crafted to read at phone size (Ben: "too small, low detail"): a deeper painted planter on two iron
  // brackets under the sill, a trim + its lit lip, a full mound of foliage with BOLD flower heads (by the season: geraniums in summer,
  // bronze + gold mums in autumn, tulips + pansies in spring, evergreen boughs + red berries in winter) and trailing ivy hanging over the front
  if (o.box) {
    const m = o.month || 10, rr = rngFrom(19), x0 = a - 0.02, x1 = b + 0.02, top = r0 - 0.16, bot = r0 - 0.72;
    const boxC = tri(M.T, [46, 86, 64], [62, 66, 46], [12, 16, 22]), trimC = tri(M.T, [96, 140, 110], [110, 104, 70], [22, 26, 34]);
    // the brackets + the box (a darker base, the front panel, a raised trim band, the lit lip)
    for (const u of [x0 + 0.2, x1 - 0.2]) { R(x, u - 0.04, bot - 0.22, u + 0.04, bot, M.iron); R(x, u - 0.04, bot - 0.22, u + 0.22 * (u < (x0 + x1) / 2 ? 1 : -1), bot - 0.16, M.iron); }
    R(x, x0, bot, x1, top, boxC); R(x, x0 + 0.06, bot + 0.07, x1 - 0.06, top - 0.07, shade(boxC, -0.12));
    R(x, x0, top - 0.07, x1, top, trimC); R(x, x0, top - 0.02, x1, top, mix(trimC, [255, 255, 255], 0.25 * (1 - M.night)));
    R(x, x0, bot, x1, bot + 0.04, shade(boxC, -0.35));
    const leaf = m === 12 || m <= 2 ? [[38, 74, 50], [48, 88, 58]] : m <= 5 ? [[96, 160, 70], [120, 176, 84]] : m <= 8 ? [[52, 110, 54], [66, 128, 60]] : [[60, 96, 50], [84, 110, 56]];
    const flowers = m === 12 || m <= 2 ? [[196, 30, 40], [214, 50, 46]] : m <= 5 ? [[236, 120, 160], [248, 214, 80], [150, 90, 200]] : m <= 8 ? [[220, 40, 50], [236, 70, 70], [250, 240, 236]] : [[214, 116, 40], [230, 170, 60], [140, 36, 44]];
    const night = c => mix(c, [12, 12, 22], 0.84 * M.night);
    // the trailing ivy over the front (a few strands with small leaves)
    for (let i = 0; i < 6; i++) { const u = x0 + 0.15 + i * (x1 - x0 - 0.3) / 5 + (rr() - 0.5) * 0.1, len = 0.25 + rr() * 0.35; for (let k = 0; k < 5; k++) { const v = top - 0.05 - k * len / 4; x.fillStyle = rgb(night(leaf[(i + k) % 2])); x.beginPath(); x.ellipse(u + Math.sin(k * 1.3 + i) * 0.04, v, 0.06, 0.045, 0.6, 0, Math.PI * 2); x.fill(); } }
    // the foliage mound (dark under-layer, then the leaves), the bold blooms on top
    for (let i = 0; i < 22; i++) { const u = x0 + 0.08 + rr() * (x1 - x0 - 0.16), v = top + 0.02 + rr() * 0.24; x.fillStyle = rgb(night(shade(leaf[0], -0.3))); x.beginPath(); x.arc(u, v - 0.03, 0.12, 0, Math.PI * 2); x.fill(); }
    for (let i = 0; i < 26; i++) { const u = x0 + 0.08 + rr() * (x1 - x0 - 0.16), v = top + 0.04 + rr() * 0.26; x.fillStyle = rgb(night(leaf[i % 2])); x.beginPath(); x.ellipse(u, v, 0.11, 0.08, rr() * 3, 0, Math.PI * 2); x.fill(); }
    const nB = m === 12 || m <= 2 ? 7 : 9;
    for (let i = 0; i < nB; i++) {
      const u = x0 + 0.18 + (i + 0.5) * (x1 - x0 - 0.36) / nB + (rr() - 0.5) * 0.08, v = top + 0.2 + rr() * 0.16, col = flowers[i % flowers.length];
      if (m === 12 || m <= 2) { x.fillStyle = rgb(night(col)); for (let k = 0; k < 3; k++) { x.beginPath(); x.arc(u + (k - 1) * 0.05, v + (k % 2) * 0.04, 0.035, 0, Math.PI * 2); x.fill(); } continue; }
      x.fillStyle = rgb(night(shade(col, -0.25))); x.beginPath(); x.arc(u + 0.02, v - 0.02, 0.1, 0, Math.PI * 2); x.fill();
      x.fillStyle = rgb(night(col)); x.beginPath(); x.arc(u, v, 0.095, 0, Math.PI * 2); x.fill();
      x.fillStyle = rgb(night(mix(col, [255, 255, 255], 0.35))); x.beginPath(); x.arc(u - 0.03, v + 0.03, 0.035, 0, Math.PI * 2); x.fill();
    }
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
    // (8P — CRISP: the milky street reflection that veiled the lower half of the glass is gone — a clean sky tint at the head + two
    // hard-edged sheens; the shop inside reads sharp)
    const g = x.createLinearGradient(0, wv0, 0, wv1); g.addColorStop(0, 'rgba(236,232,220,0.06)'); g.addColorStop(0.6, 'rgba(255,255,255,0)'); g.addColorStop(1, rgb(M.glassTop, 0.28));
    x.fillStyle = g; x.fillRect(w0, wv0, w1 - w0, wv1 - wv0);
    x.fillStyle = 'rgba(255,255,255,0.08)'; for (const [p, q] of [[0.1, 0.55], [0.62, 0.78]]) { x.beginPath(); x.moveTo(w0 + (w1 - w0) * p, wv1); x.lineTo(w0 + (w1 - w0) * q, wv1); x.lineTo(w0 + (w1 - w0) * (q - 0.22), wv0); x.lineTo(w0 + (w1 - w0) * (p - 0.22), wv0); x.fill(); }
  } else R(x, w0, wv0, w1, wv1, M.inside, 0.55);
  R(x, w0, wv1 - 0.3, w1, wv1, [0, 0, 0], 0.3 * (M.day + M.gold) + 0.1);
  // THE GOLD LEAF: NOT baked (8P — Ben's zoom: the bake's copy + the live layer's copy, a hair apart, read as a ghost — the blur): the live
  // layer draws it ONCE every frame, on the glass, over whatever moves inside (giltOver)
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
  // (8P: the door's tiny OPEN / CLOSED card is gone — a ~3 pt word read as mush; THE HUSH WORD SIGN in the window says OPEN in neon)
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
  // FP2 — THE SCONCE'S LIGHT LANDING (at night, by the lamps' ramp — baked like the cobbles' pools): a warm scallop on the brick round
  // it, falling down over the door's granite frame + the oak, gone within SHOP_GLOW.landR (the live layer adds only the lit glass + a
  // tight halo); its iron cap shades the wall just above it
  { const lk = clamp01(M.T.lamps == null ? M.night : M.T.lamps) * clamp01((M.night - 0.3) / 0.5);
    if (lk > 0.01) { const sc = sh.sconce, R0 = SHOP_GLOW.landR;
      x.save(); x.globalCompositeOperation = 'lighter'; x.translate(sc.u, sc.v - 0.05); x.scale(1, 1.25);
      const g = x.createRadialGradient(0, -0.12, 0, 0, -0.12, R0);
      for (const [t, a] of [[0, 0.46], [0.15, 0.3], [0.35, 0.12], [0.6, 0.03], [1, 0]]) g.addColorStop(t, rgb([255, 184, 116], a * lk));
      x.fillStyle = g; x.fillRect(-R0, -R0 - 0.12, 2 * R0, 2 * R0); x.restore();
      // (SP2 — CRISP: the light catching what's under it — the granite surround's top edge, the door's upper planks fading down, the
      // two steps' fronts faintly; the brick round it only a small tight pool)
      const d = s.door, W = [255, 196, 130];
      x.save(); x.globalCompositeOperation = 'lighter';
      { const g2 = x.createLinearGradient(d.u0 - 0.2, 0, d.u1 + 0.2, 0); g2.addColorStop(0, rgb(W, 0.1 * lk)); g2.addColorStop((sc.u - d.u0 + 0.2) / (d.u1 - d.u0 + 0.4), rgb(W, 0.6 * lk)); g2.addColorStop(1, rgb(W, 0.12 * lk)); x.fillStyle = g2; x.fillRect(d.u0 - 0.2, d.h + 0.2, d.u1 - d.u0 + 0.4, 0.08); }
      { const g3 = x.createLinearGradient(0, d.h, 0, d.h - 1.2); g3.addColorStop(0, rgb(W, 0.3 * lk)); g3.addColorStop(0.4, rgb(W, 0.1 * lk)); g3.addColorStop(1, rgb(W, 0)); x.fillStyle = g3; x.fillRect(d.u0, d.h - 1.2, d.u1 - d.u0, 1.2); }
      x.fillStyle = rgb(W, 0.18 * lk); x.fillRect(d.u0 - 0.3, 0.12, d.u1 - d.u0 + 0.6, 0.02); x.fillRect(d.u0 - 0.15, 0.25, d.u1 - d.u0 + 0.3, 0.02);
      x.restore();
      R(x, sc.u - 0.2, sc.v + 0.38, sc.u + 0.2, sc.v + 0.5, M.soot, 0.25 * lk); } }
}

/** THE GOLD LEAF on the shop window: "HARBOR BARBERS" arched, "SHAVE & HAIRCUT" under it — gilt with a dark keyline and a shade, a
 *  little faded (in wall units; the bake paints it on the glass, the live layer lays it again over whatever moves inside) */
function paintGilt(x, M, sh) {
  const [w0, w1, , wv1] = sh.win, G0 = GILT;
  // (8P — THE BARBERSHOP FRONT WAS BLURRY, the owner's biggest note: the letters were ~3 pt caps with a drop-shade offset by under a
  // point — at phone size that read as a double image, a smear. Now bigger, ONE crisp dark keyline round a clean gold fill, no offset
  // shade; the arch flatter + higher (THE HUSH WORD SIGN hangs under it); "SHAVE & HAIRCUT" gone — the sign has that spot. At night
  // the leaf catches the awning's lamps: a warm lit gold, never the murky brown it was.)
  const cx = (w0 + w1) / 2, R0 = G0.R, word = 'HARBOR BARBERS', size = G0.size, cy = wv1 - G0.top - R0;
  const lampK = clamp01(M.lamps != null ? M.lamps : M.T && M.T.lamps != null ? M.T.lamps : M.night) * clamp01(M.night || 0);
  const gi = mix(mix(M.gilt, M.giltHi, 0.3 * (1 - M.night)), G0.lit, 0.62 * lampK), key = rgb(mix([20, 12, 10], [8, 6, 10], M.night || 0), 0.92);
  const span = (w1 - w0) * G0.span / R0, step = span / (word.length - 1);
  for (let i = 0; i < word.length; i++) {
    const a = -span / 2 + i * step, u = cx + Math.sin(a) * R0, v = cy + Math.cos(a) * R0;
    text(x, word[i], u, v, size, { fill: rgb(gi), stroke: key, lw: G0.key, rot: a });
  }
}
/** 8P — the gold leaf's arch (wall units): font size, the apex's baseline under the window's head (top), the arch's radius (flat),
 *  its span (of the window's width), the keyline's width, the leaf's colour when the awning's lamps light it */
export const GILT = Object.freeze({ size: 0.44, top: 0.55, R: 10, span: 0.84, key: 0.06, lit: [236, 184, 104] });

// ------------------------------------------------------------------ 7b — THE WALL-WASHERS (the owner: "something's missing" at night)
/** small warm lamps under the capitals, aimed DOWN, GRAZING the brick PIERS between the windows (never the windows): from dusk all
 *  night. SP2 (the owner: the lit piers read as more ARCHED WINDOWS — tall, evenly bright, a hard rounded top): ACCENTS, not panels —
 *  a hot spot just under each VISIBLE fixture, fanning DOWN in a soft V and gone within the top third of the pier (drop units); no
 *  outline anywhere (the cone's edges + its foot fade per pixel); dimmer. The pier's own bricks re-laid in their LIT colour (the same
 *  tile seed: the courses line up), so the brick's texture shows through the light. washCone(): the light at (du across from the
 *  pier's middle, d down from the lamp) — PURE, tested. piers: the front's brick piers [u0, u1] (the edge one is off screen) */
export const WASH = Object.freeze({ piers: [[2.9, 4.2], [6.1, 7.4], [9.3, 11.2]], lampV: 9.13, brick: [196, 112, 74], a: 0.6, drop: 1.75, w0: 0.1, spread: 0.42, hot: 0.3 });
export function washCone(du, d) {
  const W = WASH;
  if (d <= 0 || d >= W.drop) return 0;
  const hw = W.w0 + d * W.spread, xn = Math.abs(du) / hw;
  if (xn >= 1) return 0;
  const side = 1 - smooth(0.45, 1, xn), on = smooth(0, 0.07, d), fall = (0.3 + 0.7 * Math.exp(-d / W.hot)) * (1 - smooth(0.45 * W.drop, W.drop, d));
  return on * side * fall;
}
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
function paintWashers(x, M, lk, tile) {
  const m = x.getTransform(), top = WASH.lampV - 0.05, foot = top - WASH.drop;
  for (const [a0, b0] of WASH.piers) {
    const a = a0 + 0.07, b = b0 - 0.07, mid = (a + b) / 2;
    // the pier's rect in device px (the bake's own pixels): an offscreen of lit brick, aligned to the wall's pattern, its alpha the cone
    const p = (u, v) => [m.a * u + m.c * v + m.e, m.b * u + m.d * v + m.f], [X0, Y0] = p(a, top), [X1, Y1] = p(b, foot);
    const X = Math.floor(Math.min(X0, X1)), Y = Math.floor(Math.min(Y0, Y1)), W = Math.ceil(Math.abs(X1 - X0)) + 1, H = Math.ceil(Math.abs(Y1 - Y0)) + 1;
    if (W < 2 || H < 2) continue;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const o = safeCtx(cv); if (!o || !o.getImageData) continue;
    o.setTransform(1, 0, 0, 1, -X, -Y); o.fillStyle = o.createPattern(tile, 'repeat'); o.fillRect(X, Y, W, H);
    const im = o.getImageData(0, 0, W, H), d = im.data;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const u = (X + i + 0.5 - m.e) / m.a, v = (Y + j + 0.5 - m.f) / m.d;
      const al = u < a || u > b ? 0 : washCone(u - mid, top - v) * WASH.a * lk;
      d[(j * W + i) * 4 + 3] = Math.round(d[(j * W + i) * 4 + 3] * al);
    }
    o.putImageData(im, 0, 0);
    x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(cv, X, Y); x.restore();
    cv.width = cv.height = 0;
  }
}
/** the washers' fixtures, VISIBLE (by day too): a short iron arm out of the capital's foot, a black bowl-shaped hood aimed down; lit,
 *  its rim a crisp warm line + a white-hot lamp just showing under it */
function paintWasherLamps(x, M, lk) {
  for (const [a0, b0] of WASH.piers) {
    const u = (a0 + b0) / 2, v = WASH.lampV;
    R(x, u - 0.03, v + 0.06, u + 0.03, v + 0.32, M.iron);
    x.fillStyle = rgb(M.iron); x.beginPath(); x.moveTo(u - 0.2, v - 0.04); x.lineTo(u + 0.2, v - 0.04); x.quadraticCurveTo(u + 0.2, v + 0.12, u + 0.06, v + 0.14); x.lineTo(u - 0.06, v + 0.14); x.quadraticCurveTo(u - 0.2, v + 0.12, u - 0.2, v - 0.04); x.closePath(); x.fill();
    R(x, u - 0.2, v + 0.02, u + 0.2, v + 0.045, shade(M.iron, 0.6));
    if (lk > 0.01) { R(x, u - 0.19, v - 0.06, u + 0.19, v - 0.025, rgb([255, 214, 160], lk)); R(x, u - 0.08, v - 0.075, u + 0.08, v - 0.04, rgb([255, 252, 236], lk)); }
  }
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

/** 8P — BOSTON IVY up the corner pier (Ben: the little plant by the door was barely visible): from a small bed at the pier's foot, climbing
 *  the brick past the door to about the first floor — a dense mat of three-lobed leaves (a dark under-layer + the leaves, lighter toward the
 *  sky) on a network of woody vines. By the season: deep RED / crimson in autumn, green in summer, fresh light green (thinner) in spring,
 *  bare woody vines in winter. width(v): how far from the corner it may spread at height v (never over the door, the sconce or the blade) */
export const IVY = Object.freeze({ top: 5.6, bed: [10.78, 11.2] });
function ivyColours(m) {
  if (m >= 9 && m <= 11) return { leaves: [[150, 22, 32], [176, 30, 38], [128, 18, 34], [196, 46, 40], [112, 20, 42], [206, 84, 44]], k: 1 };
  if (m === 12 || m <= 2) return { leaves: null, k: 0 };
  if (m <= 5) return { leaves: [[108, 168, 78], [128, 186, 88], [94, 150, 66]], k: 0.7 };
  return { leaves: [[44, 96, 44], [56, 114, 50], [36, 84, 40], [70, 126, 56]], k: 1 };
}
function paintIvy(x, M, u, dir, seed, month, width = () => 0.4) {
  const r = rngFrom(seed), m = month || 10, C = ivyColours(m), top = IVY.top;
  const stem = tri(M.T, [92, 66, 50], [100, 64, 46], [22, 16, 20]), dark = c => mix(c, [12, 8, 20], 0.82 * M.night);
  // the woody vines: a few leaders up from the bed, branching sideways (they ARE the look in winter)
  x.strokeStyle = rgb(dark(stem), 0.9); x.lineCap = 'round';
  for (let sI = 0; sI < 5; sI++) {
    let pu = u + dir * (0.04 + r() * 0.12), pv = 0.25; x.lineWidth = 0.035; x.beginPath(); x.moveTo(pu, pv);
    while (pv < top - 0.1) { pv += 0.16; pu = u + dir * Math.min(width(pv) - 0.05, Math.max(0.03, Math.abs(pu - u) + (r() - 0.35) * 0.12)); x.lineTo(pu, pv);
      if (r() < 0.35) { x.moveTo(pu, pv); x.lineTo(u + dir * Math.min(width(pv), Math.abs(pu - u) + 0.25 + r() * 0.3), pv + 0.1 + r() * 0.15); x.moveTo(pu, pv); } }
    x.stroke();
  }
  if (!C.leaves) return;
  // the mat: leaves where the shape allows, denser low down, a ragged top
  const leaves = [];
  for (let v = 0.3; v < top; v += 0.07) {
    const w = width(v) * (0.62 + 0.38 * (0.5 + 0.5 * Math.sin(v * 5.3 + seed) * Math.cos(v * 2.1))), fade = v > top - 0.7 ? (top - v) / 0.7 : 1, n = Math.round(w / 0.085 * C.k * fade);
    for (let i = 0; i < n; i++) if (r() < 0.85) leaves.push([u + dir * r() * w, v + (r() - 0.5) * 0.06, r()]);
  }
  for (const [lu, lv] of leaves) { x.fillStyle = rgb(dark(shade(C.leaves[0], -0.45)), 0.9); x.beginPath(); x.arc(lu, lv - 0.035, 0.075, 0, Math.PI * 2); x.fill(); }
  for (const [lu, lv, q] of leaves) {
    const c = dark(shade(C.leaves[Math.floor(q * C.leaves.length)], (r() - 0.4) * 0.22 + 0.08 * (lv / top)));
    x.fillStyle = rgb(c); const a = 0.05 + r() * 0.015, rot = (r() - 0.5) * 1.2;
    // a three-lobed leaf: three small rounds round a point
    for (const t of [rot - 1.1, rot, rot + 1.1]) { x.beginPath(); x.arc(lu + Math.sin(t) * a * 0.75, lv + Math.cos(t) * a * 0.75, a, 0, Math.PI * 2); x.fill(); }
  }
}
/** the bed at the corner pier's foot: a little granite kerb + its soil (the ivy's roots) */
function paintIvyBed(x, M) {
  const [a, b] = IVY.bed, g = M.stone;
  R(x, a, 0, b + 0.02, 0.3, shade(g, -0.05)); R(x, a, 0.26, b + 0.02, 0.3, mix(g, [255, 250, 240], 0.2 * (1 - M.night)));
  R(x, a + 0.05, 0.22, b - 0.03, 0.27, tri(M.T, [58, 40, 30], [64, 40, 30], [14, 10, 14]));
}

// ------------------------------------------------------------------ THE BLADE SIGN (the weekly ghost ad's home — the owner's pick, 8a)
/** the BLADE: a board on iron brackets out from the side wall near the corner, facing us (parallel to the front), the same weekly game
 *  as the ghost ad. Board units: b 0 … bw across (from the brackets), v up (wall units).
 *  SP2 — THE CLASSIC 1920s THEATRE BLADE (the owner: "you just can't read it well at all" — thin dark letters on a dim board, the bulbs
 *  crowding it): a DARK enamel board (deep navy-black) for every game, the name in BIG BOLD letters filling the board's width — cream +
 *  gold paint by day, LIT warm-white at night (they light themselves: a crisp tube-bright letter + a tight glow) — the marquee bulbs only
 *  along the stepped crest + the foot (none on the long sides: the letters get the room), the game's colour a thin pinstripe. It can't
 *  grow right (the wheel's left leg is ~1.5 pt away): it gains its width from shorter brackets + the thin side frame, and it rises to
 *  the parapet (the classic blade tops the cornice) — ~25 × 112 pt on a 402 phone (was 24 × 102, its letters ~30 % narrower). */
export const BLADE = Object.freeze({ w: 0.42, out: 0.22, bw: 1.86, v0: 2.75, v1: 11.0 });
/** the lit letters' glow (pt — tight: the letter stays crisp, never a haze) */
const BLADE_GLOW = 1.6;
export function bladeGeo(G) {
  const B = BLADE, [ox, oy] = G.side(B.w, 0, B.out), z = G.zAt(B.w), k = G.cam.F / z;
  const [x0, y0] = G.side(B.w, B.v1, B.out), [x1, y1] = G.side(B.w, B.v0, B.out + B.bw);
  return { ox, oy, k, z, rect: { x: Math.min(x0, x1), y: y0, w: Math.abs(x1 - x0), h: y1 - y0 } };
}
/** the board's stepped Deco outline (board units, v up) */
const bladeOutline = (bw = BLADE.bw, v0 = BLADE.v0, v1 = BLADE.v1) => [[0, v1 - 0.35], [0.25, v1 - 0.35], [0.25, v1 - 0.18], [0.5, v1 - 0.18], [0.5, v1], [bw - 0.5, v1], [bw - 0.5, v1 - 0.18], [bw - 0.25, v1 - 0.18], [bw - 0.25, v1 - 0.35], [bw, v1 - 0.35], [bw, v0], [0, v0]];
/** 7b — THE MARQUEE (SP2: the crest + the foot only): soft warm-white BULBS — steady at night, a slow CHASE on party nights (a step a
 *  beat), unlit glass globes by day. gap / inset / r: board units; edge: the thin gilt frame down the long sides; halo: × r */
export const MARQUEE = Object.freeze({ gap: 0.34, inset: 0.1, r: 0.08, edge: 0.07, halo: 3.1, chase: 3 });
/** the bulbs along the stepped crest (left → right) then the foot (right → left), in board units, in order round the board */
export function marqueeBulbs(bw = BLADE.bw, v0 = BLADE.v0, v1 = BLADE.v1) {
  const i = MARQUEE.inset, out = [];
  // the crest: one on each outer step, one on each middle step, the top flat evenly (symmetric — the steps' corners never crowd a pair)
  const flat = [0.5 + i, bw - 0.5 - i], nf = Math.max(1, Math.round((flat[1] - flat[0]) / MARQUEE.gap));
  out.push([i, v1 - 0.35 - i], [0.375, v1 - 0.18 - i]);
  for (let q = 0; q <= nf; q++) out.push([flat[0] + (flat[1] - flat[0]) * q / nf, v1 - i]);
  out.push([bw - 0.375, v1 - 0.18 - i], [bw - i, v1 - 0.35 - i]);
  // the foot, right → left
  const nb = Math.max(1, Math.round((bw - 2 * i) / MARQUEE.gap));
  for (let q = 0; q <= nb; q++) out.push([bw - i - (bw - 2 * i) * q / nb, v0 + i]);
  return out;
}
/** the marquee's bulbs on screen (pt): { x, y, r, i } */
export function marqueeScreen(bg) { return marqueeBulbs().map(([u, v], i) => ({ x: bg.ox + bg.k * u, y: bg.oy - bg.k * v, r: bg.k * MARQUEE.r, i })); }
/** a bulb's brightness (PURE): steady 1; on a party night (party = its ramp 0..1) the slow chase — every third bulb leads, stepping
 *  one bulb a beat (beats + beatU: the beat clock), the others at 0.5, crossfading over the first third of the beat */
export function marqueeLevel(i, party = 0, beats = 0, beatU = 0) {
  if (party <= 0.01) return 1;
  const n = MARQUEE.chase, on = j => (((i + j) % n) + n) % n === 0 ? 1 : 0.5, f = Math.min(1, Math.max(0, beatU * 3));
  return 1 + (on(beats) * f + on(beats - 1) * (1 - f) - 1) * party;
}
/** SP2 — the name's layout on the board (PURE): one column a word (a two-word name side by side: each column reads top-down), the
 *  letters as big as the column allows — each letter's slot height, its cap height (never taller than LETTER.tall × the column's width:
 *  a sliver of a letter doesn't read) and its width (filling LETTER.fill of the column, at most LETTER.wide × a natural letter) →
 *  { cols: [{ word, cx, lh, cap, top }], cw, cap } (board units) */
export const LETTER = Object.freeze({ fill: 0.86, tall: 1.5, wide: 1.9, gap: 0.08, v0: 0.32, v1: 0.52 });
/** 8P — a long ONE-WORD name reads as two stacked columns at its seam (the owner: SLIPSTREAM was ~8.6 pt, under the 10 pt rule; one
 *  column of 9–10 letters can't get bigger on a ~25 pt board): SLIP / STREAM like the two-word names. Unknown long words split at
 *  their middle; ≤ BLADE_ONE letters stay one column. */
const BLADE_SPLIT = Object.freeze({ SLIPSTREAM: ['SLIP', 'STREAM'], RUMRUNNER: ['RUM', 'RUNNER'], OVERCLOCK: ['OVER', 'CLOCK'] });
export const BLADE_ONE = 8;
export function bladeWords(name) {
  const words = String(name || '').toUpperCase().split(/\s+/).filter(Boolean).slice(0, 2);
  if (words.length !== 1 || words[0].length <= BLADE_ONE) return words;
  const w = words[0];
  return BLADE_SPLIT[w] ? [...BLADE_SPLIT[w]] : [w.slice(0, Math.ceil(w.length / 2)), w.slice(Math.ceil(w.length / 2))];
}
export function bladeLetters(name, bw = BLADE.bw, v0 = BLADE.v0, v1 = BLADE.v1) {
  const words = bladeWords(name), nc = Math.max(1, words.length);
  const x0 = MARQUEE.edge + 0.05, x1 = bw - MARQUEE.edge - 0.05, top = v1 - LETTER.v1, foot = v0 + LETTER.v0, ih = top - foot;
  const cw = (x1 - x0 - LETTER.gap * (nc - 1)) / nc, n = Math.max(1, ...words.map(w => w.length)), lh = ih / n;
  const cap = Math.min(lh * 0.86, cw * LETTER.tall);
  return { cw, cap, lh, cols: words.map((w, ci) => ({ word: w, cx: x0 + cw * (ci + 0.5) + LETTER.gap * ci, lh, cap, top: top - (ih - lh * w.length) / 2 })) };
}
/** paint the name (board units, v up): each letter centred in its slot, squeezed / stretched to fill the column; style: 'day' (cream +
 *  gold paint, a dark keyline, a drop shade), 'dark' (the night's unlit letters: dull paint), 'lit' (the warm-white self-lit letter
 *  + a tight glow — the live layer) */
function paintLetters(x, game, style, M) {
  const L = bladeLetters(game.name || game.id);
  x.save(); x.font = FONT(100); const cap = (x.measureText('H').actualBoundingBoxAscent || 70) / 100; x.restore();
  for (const col of L.cols) [...col.word].forEach((ch, i) => {
    const size = col.cap / cap, vb = col.top - col.lh * (i + 1) + (col.lh - col.cap) / 2;
    // (one stretch for every letter, from an H: an I stays a narrow stroke, never a block)
    x.save(); x.font = FONT(size * 100); const nat = x.measureText('H').width / 100, own = x.measureText(ch).width / 100; x.restore();
    const sq = Math.max(0.6, Math.min(LETTER.wide, (L.cw * LETTER.fill) / Math.max(1e-3, nat), (L.cw * 0.98) / Math.max(1e-3, own)));   // (a wide M / W never past its column)
    if (style === 'day') {
      text(x, ch, col.cx + size * 0.05, vb - size * 0.05, size, { fill: rgb(mix(M.giltLo, [10, 10, 20], 0.3), 0.85), sq });
      text(x, ch, col.cx, vb, size, { fill: rgb(mix([246, 232, 196], M.inside, 0.5 * M.night)), stroke: rgb(mix(M.gilt, M.inside, 0.5 * M.night)), lw: size * 0.07, sq });
    } else if (style === 'dark') text(x, ch, col.cx, vb, size, { fill: rgb(M.letterN), stroke: rgb(M.letterN), lw: size * 0.06, sq });
    else {
      text(x, ch, col.cx, vb, size, { fill: 'rgb(255,214,150)', stroke: 'rgb(255,190,120)', lw: size * 0.1, sq, glow: [M.glowPx, 'rgba(255,170,90,0.95)'] });
      text(x, ch, col.cx, vb, size, { fill: 'rgb(255,246,226)', stroke: 'rgb(255,236,200)', lw: size * 0.05, sq });
    }
  });
}
/** the board, painted (by day / the night's unlit board: the baked layer; lit: only what lights — the letters + the bulbs' glass) */
function paintBlade(x, M, game, lit = false) {
  const B = BLADE, p = dayPaint(game), bw = B.bw, v0 = B.v0, v1 = B.v1, r = rngFrom(17), outline = bladeOutline(bw, v0, v1);
  if (lit) {
    paintLetters(x, game, 'lit', M);
    return;
  }
  const enamel = tri(M.T, [24, 30, 50], [30, 28, 44], [10, 11, 22]), giltE = mix(M.gilt, enamel, 0.15);
  // the iron brackets from the wall (scrolled arms) at the top and the foot
  x.strokeStyle = rgb(M.iron); x.lineWidth = 0.07; x.lineCap = 'round';
  for (const v of [v1 - 0.55, v0 + 0.35]) { x.beginPath(); x.moveTo(-B.out, v); x.lineTo(0.1, v); x.stroke(); x.beginPath(); x.arc(-B.out * 0.45, v - 0.12, 0.09, 0, Math.PI * 1.6); x.stroke(); }
  // the board: a thin gilt frame (the crest a little deeper — its bulbs ride on it), the dark enamel face with a soft sheen
  x.fillStyle = rgb(giltE); x.beginPath(); outline.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.fill();
  const e = MARQUEE.edge;
  { const g = x.createLinearGradient(0, 0, bw, 0); g.addColorStop(0, rgb(shade(enamel, -0.25))); g.addColorStop(0.35, rgb(shade(enamel, 0.18 * (M.day + M.gold)))); g.addColorStop(1, rgb(shade(enamel, -0.12)));
    x.fillStyle = g; x.beginPath(); bladeOutline(bw - 2 * e, v0 + e, v1 - e).forEach(([a, b], i) => (i ? x.lineTo(a + e, b) : x.moveTo(a + e, b))); x.closePath(); x.fill(); }
  // the game's colour: a thin pinstripe just inside the frame (the board's identity — the name itself is the theatre's white + gold)
  { const pc = mix(p.face, enamel, 0.25 + 0.55 * M.night), q = 0.14;
    x.strokeStyle = rgb(pc); x.lineWidth = 0.035; x.beginPath(); bladeOutline(bw - 2 * q, v0 + q, v1 - q).forEach(([a, b], i) => (i ? x.lineTo(a + q, b) : x.moveTo(a + q, b))); x.closePath(); x.stroke(); }
  // the name: painted cream + gold by day (the night's bake: the letters' dull paint — the live layer lights them)
  paintLetters(x, game, M.night > 0.5 ? 'dark' : 'day', { ...M, letterN: mix([120, 108, 92], enamel, 0.55) });
  // the weather: a few chips in the enamel at the edges, a rain streak from the crest
  for (let i = 0; i < 12; i++) { const ed = r() < 0.5, u = ed ? e + r() * 0.08 : bw - e - 0.1 + r() * 0.08, v = v0 + 0.2 + r() * (v1 - v0 - 0.8); R(x, u, v, u + 0.03 + r() * 0.04, v + 0.03 + r() * 0.06, rgb(mix(enamel, [120, 110, 100], 0.4), 0.7)); }
  streak(x, bw * 0.7, v1 - 0.5, 0.1, 1.4, M.soot, 0.14 * (M.day + M.gold));
  // THE MARQUEE'S BULBS (crest + foot): a dark socket ring, the glass globe — unlit: pale glass + a highlight (the live layer lights them)
  const glass = mix(tri(M.T, [226, 222, 210], [240, 214, 180], [44, 40, 52]), [255, 255, 255], 0.1), ring = shade(M.iron, 0.25);
  for (const [u, v] of marqueeBulbs(bw, v0, v1)) {
    x.fillStyle = rgb(ring); x.beginPath(); x.arc(u, v, MARQUEE.r * 1.32, 0, Math.PI * 2); x.fill();
    x.fillStyle = rgb(glass); x.beginPath(); x.arc(u, v, MARQUEE.r, 0, Math.PI * 2); x.fill();
    x.fillStyle = rgb([255, 255, 255], 0.75 * (1 - 0.8 * M.night)); x.beginPath(); x.arc(u - MARQUEE.r * 0.35, v + MARQUEE.r * 0.35, MARQUEE.r * 0.36, 0, Math.PI * 2); x.fill();
  }
}

// ------------------------------------------------------------------ THE BAKE
/**
 * The speakeasy's baked steps (into 'stage'), far → near: the rooftop's pieces behind the parapet (the stair bulkhead, the
 * chimney, the string lights' pole), the side wall (painted flat, projected in strips), the front (the structure, the Deco, the
 * windows, the ground floor, the light + weather, the ivy), then what stands out from the walls (the awning, the door's steps,
 * the parapet's posts, the ad's lamps' hardware). ctx: { game (this week's ghost ad), month }
 */
/** THE BLADE's bake step on its own (FP — the owner: the blade hangs off the building, nearer to us than the curb trees beside the side
 *  wall: the scene bakes it AFTER them — scene.js#rebake) */
export function bladeStep(L, T, ctx = {}) {
  const G = speakGeo(L), M = mats(T);
  return x => {
    if (!ctx.game) return;
    const bg = bladeGeo(G); x.save(); wallMap(x, bg.ox, bg.oy, bg.k); paintBlade(x, M, ctx.game); x.restore();
    // (7b: the gooseneck lamps gone — the marquee's bulbs light the board now; drawGooseneck stays for the billboard)
  };
}
export function speakeasySteps(L, T, ctx = {}, { blade = true } = {}) {
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
      paintLight(sx, M, 0, len, true, 33);
      paintIvy(sx, M, 0.04, 1, 3, ctx.month, () => 0.3);
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
    // THE BLADE (the corner as it is): the painted board + its brackets, in front of the side wall (FP: { blade: false } — the scene
    // bakes it later, in front of the trees beside the side wall: bladeStep)
    blade ? bladeStep(L, T, ctx) : () => {},
    // THE FRONT: the brick + the structure + the Deco (+ 7b: THE WALL-WASHERS' light on the piers at night, their lamps by day too)
    x => {
      const dpr = dprOf(x); x.save(); frontMap(x);
      const pat = x.createPattern(brickTile(M.brick, course(dpr), blen(dpr), 9, M.night > 0.5), 'repeat');
      st.P = paintStructure(x, M, { u0: 0, u1: W_FRONT, side: false, pat });
      paintFrontDeco(x, M, st.P);
      const lk = clamp01(M.T.lamps == null ? M.night : M.T.lamps) * clamp01((M.night - 0.3) / 0.5);
      if (lk > 0.01) paintWashers(x, M, lk, brickTile(WASH.brick, course(dpr), blen(dpr), 9, false));
      paintWasherLamps(x, M, lk);
      x.restore();
    },
    // the upper windows (by day: the sky in the glass, shades at their heights, curtains, the plant, the window box)
    x => {
      x.save(); frontMap(x);
      const r = rngFrom(23), curtains = [tri(T, [140, 40, 44], [150, 50, 44], [20, 10, 18]), tri(T, [70, 92, 58], [90, 80, 50], [12, 14, 16]), tri(T, [196, 168, 110], [200, 150, 100], [26, 22, 30])];
      ROOMS.forEach(rm => {
        const [a, b] = s.windows[rm.col], [r0, r1] = s.rows[rm.floor - 2];
        const o = { blind: rm.clear ? 0.12 : 0.25 + r() * 0.45, curtain: rm.edge || rm.room === 'apartment' ? curtains[(rm.floor + rm.col) % 3] : null, plant: rm.id === 'edge2', box: rm.room === 'apartment', month: ctx.month };
        paintWindow(x, M, a, b, r0, r1, o);
      });
      x.restore();
    },
    // the ground floor: the barbershop, the side door, the basement window, the sconce
    x => { x.save(); frontMap(x); paintGround(x, M, s); x.restore(); },
    // the light + the weather + the ivy on the corner
    x => { x.save(); frontMap(x); paintLight(x, M, 0, W_FRONT, false, 51); paintIvyBed(x, M); paintIvy(x, M, W_FRONT - 0.03, -1, 4, ctx.month, v => (v < 3.0 ? 0.38 : v < 3.6 ? 0.38 + (v - 3.0) * 0.6 : v < 4.4 ? 0.74 + (v - 3.6) * 0.75 : 1.34)); x.restore(); },
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
      // (8P — Ben: a notch broke the stripes near the right end — the side flap's triangle + the patch: both gone, the stripes run clean)
      { const [a, y0] = project(cam, s.x0 + aw.u0, aw.y0, s.z0), [b, y1] = project(cam, s.x0 + aw.u1, aw.y1, aw.z), g = x.createLinearGradient(0, y0, 0, y1);
        g.addColorStop(0, `rgba(255,248,230,${(0.18 * M.day).toFixed(3)})`); g.addColorStop(1, 'rgba(0,0,0,0.12)'); x.fillStyle = g; x.fillRect(a, y0, b - a, y1 - y0); }
      // the valance: a red band with the year, the scallops under it
      const [va, vy0] = project(cam, s.x0 + aw.u0, aw.y1, aw.z), [vb, vy1] = project(cam, s.x0 + aw.u1, aw.y1 - VAL, aw.z), vh = vy1 - vy0, sc = cam.F / aw.z;
      x.fillStyle = rgb(shade(M.awnR, -0.08)); x.fillRect(va, vy0, vb - va, vh);
      x.fillStyle = rgb(shade(M.awnR, -0.08)); const ns = 14, sw = (vb - va) / ns;
      for (let i = 0; i < ns; i++) { x.beginPath(); x.arc(va + sw * (i + 0.5), vy1, sw / 2, 0, Math.PI); x.fill(); }
      x.fillStyle = rgb(M.awnC, 0.9); x.fillRect(va, vy0 + vh * 0.1, vb - va, Math.max(0.4, vh * 0.05)); x.fillRect(va, vy1 - vh * 0.14, vb - va, Math.max(0.4, vh * 0.05));
      // (8P: "EST. 1924" was unreadable on the valance — the year is the DATE STONE in the parapet now: paintDateStone)
      // the awning's iron arms
      x.strokeStyle = rgb(M.iron); x.lineWidth = Math.max(0.5, 0.05 * sc);
      for (const u of [aw.u0 + 0.1, aw.u1 - 0.1]) { const [p, py] = project(cam, s.x0 + u, aw.y0 - 0.9, s.z0), [q, qy] = project(cam, s.x0 + u, aw.y1, aw.z); x.beginPath(); x.moveTo(p, py); x.lineTo(q, qy); x.stroke(); }
      // SP2 — THE AWNING AT NIGHT, the 1920s way (the owner; never a backlit 1980s awning): a small shaded lamp under it at the wall over
      // the shop window, lighting the canvas from beneath — warm near the lamp, fading out to the front edge, the cream stripes glowing a
      // little through (the canvas is thin) — the scallops catching a warm rim, the shopfront under it + the pavement below a soft pool.
      // Subtle: the barber pole stays the brightest light on the front. Baked (by the lamps' ramp).
      { const lk = clamp01(M.T.lamps == null ? M.night : M.T.lamps) * clamp01((M.night - 0.3) / 0.5);
        if (lk > 0.01) {
          const A = AWNING_LAMP, W = [255, 196, 132], fall = u => Math.min(1.25, A.us.reduce((sum, lu) => sum + A.k * Math.exp(-(((u - lu) / A.reach) ** 2)), 0));
          x.save(); x.globalCompositeOperation = 'lighter';
          for (let i = 0; i < n; i++) {
            const u0 = aw.u0 + i * du, u1 = u0 + du, f = fall((u0 + u1) / 2) * lk * (i % 2 ? A.cream : A.red);
            const [, ya] = project(cam, s.x0 + u0, aw.y0, s.z0), [, yb] = project(cam, s.x0 + u0, aw.y1, aw.z), g = x.createLinearGradient(0, ya, 0, yb);
            g.addColorStop(0, rgb(W, f * 0.55)); g.addColorStop(1, rgb(W, f));
            poly(x, cam, [at(u0, aw.y0, s.z0), at(u1, aw.y0, s.z0), at(u1, aw.y1, aw.z), at(u0, aw.y1, aw.z)], g);
          }
          // the scallops' warm rim (their lower edges), brightest by each lamp
          x.lineWidth = Math.max(0.5, 0.035 * sc);
          for (let i = 0; i < ns; i++) { const cx = va + sw * (i + 0.5), u = aw.u0 + (aw.u1 - aw.u0) * (i + 0.5) / ns; x.strokeStyle = rgb([255, 214, 160], A.rim * Math.min(1, fall(u)) * lk); x.beginPath(); x.arc(cx, vy1, sw / 2 - x.lineWidth / 2, 0.15, Math.PI - 0.15); x.stroke(); }
          // each lamp's light LANDING: a short crisp fan down the shopfront under it (the window's head + frame, the stall riser) + a small
          // pool on the pavement in front — three of them overlapping, so the front reads evenly lit, no fog
          for (const b of awningBulbs(aw)) {
            const [p0, py0] = project(cam, s.x0 + b.u, b.y, s.z0), [, py1] = project(cam, s.x0 + b.u, 0.5, s.z0), r = py1 - py0, wv = 1.15 * cam.F / s.z0;
            const g = x.createRadialGradient(p0, py0, 0, p0, py0, r); g.addColorStop(0, rgb(W, 0.2 * A.k * lk)); g.addColorStop(0.45, rgb(W, 0.08 * A.k * lk)); g.addColorStop(1, rgb(W, 0));
            x.save(); x.beginPath(); x.moveTo(p0 - wv * 0.25, py0); x.lineTo(p0 + wv * 0.25, py0); x.lineTo(p0 + wv, py1); x.lineTo(p0 - wv, py1); x.closePath(); x.clip();
            x.fillStyle = g; x.fillRect(p0 - wv, py0, wv * 2, r); x.restore();
            const [pc, pyc] = project(cam, s.x0 + b.u, 0, s.z0 - 0.8), rw = 1.5 * cam.F / s.z0, g2 = x.createRadialGradient(pc, pyc, 0, pc, pyc, rw);
            g2.addColorStop(0, rgb(W, 0.13 * A.k * lk)); g2.addColorStop(0.6, rgb(W, 0.04 * A.k * lk)); g2.addColorStop(1, rgb(W, 0));
            x.save(); x.translate(pc, pyc); x.scale(1, 0.2); x.translate(-pc, -pyc); x.fillStyle = g2; x.fillRect(pc - rw, pyc - rw, 2 * rw, 2 * rw); x.restore();
          }
          x.restore();
        }
        // the lamps' fixtures (by day too): a short brass stem under the valance's foot, a small bell shade, the bulb's glass under it
        for (const b of awningBulbs(aw)) {
          const [bx, by] = project(cam, s.x0 + b.u, b.y, b.z), [, ty] = project(cam, s.x0 + b.u, aw.y1 - VAL, aw.z), k2 = cam.F / b.z, r = AWNING_LAMP.bulb * k2;
          x.fillStyle = rgb(M.gilt); x.fillRect(bx - Math.max(0.3, 0.012 * k2), ty, Math.max(0.6, 0.024 * k2), by - ty - r * 0.6);
          x.fillStyle = rgb(shade(M.gilt, -0.25)); x.beginPath(); x.moveTo(bx - r * 1.7, by - r * 0.1); x.lineTo(bx + r * 1.7, by - r * 0.1); x.lineTo(bx + r * 0.7, by - r * 1.3); x.lineTo(bx - r * 0.7, by - r * 1.3); x.closePath(); x.fill();
          x.fillStyle = rgb(lk > 0.01 ? mix(M.glassTop, [255, 230, 190], lk) : mix(M.glassTop, [236, 232, 222], 0.5)); x.beginPath(); x.arc(bx, by + r * 0.3, r, 0, Math.PI * 2); x.fill();
        } }
      // the side door's two worn granite steps (a dip worn in the middle)
      const d = s.door;
      box(x, cam, { x0: s.x0 + d.u0 - 0.3, x1: s.x0 + d.u1 + 0.3, z0: s.z0 - 0.75, z1: s.z0, h: 0.13 }, shade(M.stone, 0.05), { light: 1, sideK: 0.12 });
      box(x, cam, { x0: s.x0 + d.u0 - 0.15, x1: s.x0 + d.u1 + 0.15, z0: s.z0 - 0.4, z1: s.z0, h: 0.13 }, shade(M.stone, 0.12), { y0: 0.13, light: 1, sideK: 0.12 });
      { const [a, y] = project(cam, s.x0 + (d.u0 + d.u1) / 2, 0.26, s.z0 - 0.2), w = 0.5 * cam.F / s.z0; x.fillStyle = rgb(M.soot, 0.25); x.beginPath(); x.ellipse(a, y, w, w * 0.12, 0, 0, Math.PI * 2); x.fill(); }
      // (SP2: the café canopy's posts stand on the roof deck, set back — drawn live with the lights: strings.js)
    },
  ];
}

/** 8P — THE BASEMENT WINDOW's colours (the only window this colour: a smoky amber edging to copper — darker + smokier at the top) */
export const BASEMENT = Object.freeze({ top: [150, 52, 22], mid: [236, 112, 44], low: [255, 150, 70], day: 0.38, night: 0.34, pass: 13, beat: 0.32 });
const hh01 = (n, s) => { let h = (n * 374761393 + s * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
/**
 * The basement's light at t (s) — PURE: { a (its level), shadows: [{ x (0..1 across), s (size × the opening's height), a }], flick }.
 * night 0..1 (brighter after dark), beat 0..1 (a party night's punch × its ramp). A pass every BASEMENT.pass s or so (seeded by the
 * slot: ~3 in 5 slots), one or two figures walking across in ~3–4 s, dimming the light a little as they pass; a flicker ~once in 8
 * minutes (two quick dips).
 */
export function basementLight(t, { night = 0, beat = 0 } = {}) {
  const B = BASEMENT, slot = Math.floor(t / B.pass), u = t - slot * B.pass, shadows = [];
  let dim = 0;
  if (hh01(slot, 3) < 0.6) {
    const dur = 3 + hh01(slot, 4) * 1.4, dir = hh01(slot, 5) < 0.5 ? 1 : -1, n = hh01(slot, 6) < 0.35 ? 2 : 1, t0 = 1 + hh01(slot, 7) * (B.pass - dur - 2);
    for (let i = 0; i < n; i++) {
      const p = (u - t0 - i * 0.55) / dur;
      if (p <= 0 || p >= 1) continue;
      const x = dir > 0 ? -0.15 + 1.3 * p : 1.15 - 1.3 * p;
      shadows.push({ x, s: 0.95 + 0.25 * hh01(slot, 8 + i), a: 0.55 + 0.2 * hh01(slot, 10 + i) });
      dim = Math.max(dim, 0.14 * Math.sin(Math.PI * p));
    }
  }
  // the rare flicker: one slot in ~8 minutes, two quick dips at a seeded second
  const fs = Math.floor(t / 480), ft = t - fs * 480 - (20 + hh01(fs, 21) * 440);
  const flick = hh01(fs, 20) < 0.5 && ft > 0 && ft < 0.45 ? (ft < 0.08 || (ft > 0.18 && ft < 0.26) ? 0.45 : 0) : 0;
  const a = (B.day + B.night * Math.max(0, Math.min(1, night))) * (1 - dim) * (1 + B.beat * beat) * (1 - flick);
  return { a, shadows, flick };
}
// ------------------------------------------------------------------ LIVE: the lit rooms, the glows, the pole, the ad's lamps
/** THE BARBER POLE's turn (FP, PURE): the stripes' phase (0..1 of a period) after dt s — the shop's pace by day, the slow night turn
 *  when lit; continuous (never rounded to a pixel or a frame: the strip slides at a fractional offset) */
export const POLE_DAY = 0.42, POLE_NIGHT = 0.16;        // (periods a second)
export const poleRate = lit => POLE_DAY + (POLE_NIGHT - POLE_DAY) * clamp01(lit);
export const poleTurn = (ph, dt, lit) => (ph + Math.max(0, dt) * poleRate(lit)) % 1;
/** FP2 — THE TURN BY REAL TIME (the owner: "still jittery" on her iPhone): the phase is a pure function of the frame's timestamp from
 *  an ANCHOR { t, ph, rate } — never a sum of frame steps (a skipped frame, the 30 fps battery saver or a long frame can't step it).
 *  poleAnchor() re-anchors only when the rate changes (dusk's ramp, the raid, reduced motion), keeping the phase continuous. */
export const polePhase = (a, t) => { const v = a.ph + Math.max(0, t - a.t) * a.rate; return v - Math.floor(v); };
export const poleAnchor = (a, t, rate, ph0 = 0.3) => (a && Math.abs(a.rate - rate) < 1e-9 && t >= a.t ? a : { t, ph: a ? polePhase(a, t) : ph0, rate });   // (a clock that went back: re-anchored, held)
/** the helix's stripes at a point (PURE): v = the distance along the glass in the helix's frame (pt), band (pt), w = the pixel's
 *  footprint along v (pt: a box filter — the analytic antialiasing) → [red, blue] coverage 0..1 (the rest: the white) */
const POLE_RISE = 0.9, POLE_TH = 0.42;          // (a helix's rise across the glass's front, the stripe's thickness — in bands)
export function poleStripe(v, band, w) {
  const P = 2 * band, TH = POLE_TH * band, hw = Math.max(1e-4, w) / 2;
  const seg = a => { let u = v - a; u -= Math.floor(u / P) * P; let s = 0; for (const o of [-P, 0, P]) s += Math.max(0, Math.min(u + hw, o + TH) - Math.max(u - hw, o)); return Math.min(1, s / (2 * hw)); };
  return [seg(0), seg(band)];
}
/** the pole's three colours (PURE): the paint by day (dimmed by the light: lum), the glass LIT from inside at night (FP2: a cool,
 *  LED-bright white, the red + blue vivid), a PARTY night's neon (red → magenta, blue → electric blue, white → gold; party = the
 *  party's ramp × lit — back to red / white / blue as the 2 am wind-down ramps it out), punch: the beat's gentle lift */
export const POLE_PAINT = { w: [244, 242, 236], r: [200, 30, 40], b: [30, 60, 160] };
export const POLE_LIT = { w: [240, 247, 255], r: [255, 52, 70], b: [58, 112, 255] };
export function poleColours({ lum = 1, lit = 0, party = 0, pal = null, punch = 0 } = {}) {
  const P = pal && pal.length >= 2 ? pal : [[255, 63, 176], [63, 224, 255], [166, 91, 255], [255, 204, 90]];
  const neon = { r: P[0], b: mix(P[1], [60, 110, 255], 0.35), w: mix([255, 246, 226], P[3] || P[2] || [255, 204, 90], 0.62) };
  const lift = 1 + 0.22 * clamp01(punch) * clamp01(party);
  const o = {};
  for (const k of ['w', 'r', 'b']) {
    const day = POLE_PAINT[k].map(v => v * lum + 8 * (1 - lum));
    const c = mix(mix(day, POLE_LIT[k], clamp01(lit)), neon[k], clamp01(party));
    o[k] = c.map(v => Math.min(255, v * lift));
  }
  return o;
}
/** the light round the lit glass (PURE, FP2 — no smoke): a TIGHT halo hugging the glass (gone within POLE_HALO.tight glass radii of
 *  its edge) + the light LANDING on the brick beside it (faint, gone within POLE_HALO.land radii). d = the distance from the glass (pt),
 *  r = its radius (pt) → alpha 0..1 */
export const POLE_HALO = Object.freeze({ tight: 1.8, land: 4.2, a: 0.42, aLand: 0.17 });
export function poleHalo(d, r) {
  const H = POLE_HALO, t = Math.max(0, d) / r;
  return (t < H.tight ? H.a * Math.pow(1 - t / H.tight, 2) : 0) + (t < H.land ? H.aLand * Math.pow(1 - t / H.land, 2) : 0);
}
/**
 * createSpeakeasy(): what changes at night (and the pole by day). layout(L, { dpr }) → the windows on screen; draw(c, f) with
 * f = { k (the windows' light 0..1), lamp (the ad's lamps), sconce, day, night, t (the frame's timestamp, s), motion, fade, hour, game,
 * party: { ramp, punch, pal } | null (FP2: the barber pole's party neon + the beat) }.
 * HOOKS (7b): windows() → [{ id, room, floor, col, edge, rect }], light(id, k|null) (a window's own level, null = the
 * timeline's), mirror(k) (the hidden door's opening 0..1 — 7b animates it; today a hook only), roomDraw(id, fn) (a moment's own
 * painter over a window).
 */
export function createSpeakeasy() {
  let G = null, dpr = 1, wins = [], box = null, litCv = null, litKey = '', basement = null;
  const own = new Map(), drawers = new Map();
  let mirror = 0, lastK = -1;   // (mirror: the hidden door's hook — FP3b's real doors read it; lastK: debug().k)
  // PART 7b — THE LIFE: the window moments, the rooms' states, the taps (screens/harbor/windows.js; the plan: core/harbor-moments.js)
  const life = createWindowLife();
  // 8P — THE HUSH WORD SIGN in the shop window (hushsign.js; Lobby 2.0: hush(word))
  const hush = createHushSign();
  let basementDbg = null;
  let giltCv = null, giltKey = '', giltAt = null, lastT = 0, lastGame = null, bedsNow = { club: 0, tv: 0, party: false };
  function layout(L, o = {}) {
    G = speakGeo(L); dpr = Math.min(2, o.dpr || 1);
    const s = G.s;
    wins = ROOMS.map(rm => { const [a, b] = s.windows[rm.col], [r0, r1] = s.rows[rm.floor - 2], [x0, y0] = G.front(a, r1), [x1, y1] = G.front(b, r0); return { ...rm, u: [a, b], v: [r0, r1], rect: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } }; });
    bulbKey = '';
    const [bx0, by0] = G.front(0, V.crest + 0.2), [bx1] = G.side(G.len, 0), [, by1] = G.front(0, 0);
    box = { x: Math.max(0, Math.floor(bx0)), y: Math.floor(by0), w: Math.ceil(Math.min(G.cam.W, bx1) - Math.max(0, bx0)) + 1, h: Math.ceil(by1 - by0) + 1 };
    const [b0, b1, bv0, bv1] = s.shop.basement, [p, py] = G.front(b0, bv1), [q, qy] = G.front(b1, bv0);
    basement = { x: p, y: py, w: q - p, h: qy - py };
    litKey = bladeKey = '';
    hush.layout(G, { dpr });
  }
  // the window's level now: its own (a hook) or the timeline's (core/harbor-speakeasy.js#roomLight)
  const levelOf = (rm, f) => (own.has(rm.id) ? own.get(rm.id) : roomLight(rm.id, f.hour));
  function canvasFor(cv) { cv = cv || document.createElement('canvas'); const w = Math.ceil(box.w * dpr), h = Math.ceil(box.h * dpr); if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; } return cv; }
  // the rooms, lit (one canvas over the speakeasy's box; re-painted only when a window's level moves a step)
  function paintLit(levels, late = 0) {
    litCv = canvasFor(litCv);
    const x = safeCtx(litCv);
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, litCv.width, litCv.height);
    x.setTransform(dpr, 0, 0, dpr, -box.x * dpr, -box.y * dpr);
    const [ox, oy] = G.front(0, 0);
    x.save(); wallMap(x, ox, oy, G.K);
    wins.forEach((w, i) => { const a = levels[i]; if (a > 0.01) { x.globalAlpha = a; paintRoom(x, w, { late }); x.globalAlpha = 1; } });
    // the barbershop after hours: one dim lamp over the empty chair, its pool on the floor + the chair, the mirror catching it
    const [w0, w1, wv0, wv1] = G.s.shop.win, lx = w0 + (w1 - w0) * 0.38;
    x.save(); x.beginPath(); x.rect(w0, wv0, w1 - w0, wv1 - wv0); x.clip();
    // SP2 — CRISP, the shop the cleanest warm-white of the facade (the owner): the globe a bright source with a TIGHT halo, its light
    // LANDING — a cone down the back wall + the mirror panels under it, the chair's top edges + the headrest catching it, a pool on the
    // floor, a glint in the mirror; the dark shop round it stays dark (no wide glow over the glass)
    { const ly = wv1 - 0.48, W = [255, 238, 210], c = a => `rgba(${W},${a})`;
      // (the pool on the back wall + the mirrors under the lamp: an upright oval, bright near the lamp, gone within ~1.3 units)
      { const g = x.createRadialGradient(lx, ly - 0.25, 0, lx, ly - 0.25, 1.35); g.addColorStop(0, c(0.55)); g.addColorStop(0.35, c(0.28)); g.addColorStop(0.7, c(0.08)); g.addColorStop(1, c(0));
        x.save(); x.translate(lx, ly - 0.25); x.scale(0.72, 1); x.translate(-lx, -(ly - 0.25)); x.fillStyle = g; x.fillRect(lx - 1.35, ly - 1.6, 2.7, 2.7); x.restore(); }
      const cx = w0 + (w1 - w0) * 0.36, base = wv0 + 0.02;
      x.fillStyle = c(0.9); x.fillRect(cx - 0.36, base + 0.84, 0.82, 0.05); x.fillRect(cx - 0.42, base + 1.58, 0.2, 0.05); x.fillRect(cx - 0.48, base + 1.99, 0.36, 0.05); x.fillRect(cx - 0.3, base + 1.03, 0.72, 0.03);
      const fl = x.createRadialGradient(lx, wv0 + 0.44, 0, lx, wv0 + 0.44, 1.1); fl.addColorStop(0, c(0.4)); fl.addColorStop(1, c(0));
      x.save(); x.translate(lx, wv0 + 0.44); x.scale(1, 0.18); x.translate(-lx, -(wv0 + 0.44)); x.fillStyle = fl; x.fillRect(lx - 1.1, wv0 + 0.44 - 1.1, 2.2, 2.2); x.restore();
      x.fillStyle = c(0.55); x.fillRect(lx + 0.62, wv0 + 1.0, 0.035, 0.9);
      const hg = x.createRadialGradient(lx, ly, 0, lx, ly, 0.28); hg.addColorStop(0, c(0.9)); hg.addColorStop(0.45, c(0.3)); hg.addColorStop(1, c(0)); x.fillStyle = hg; x.fillRect(lx - 0.28, ly - 0.28, 0.56, 0.56); }
    x.fillStyle = 'rgb(255,250,236)'; x.beginPath(); x.arc(lx, wv1 - 0.48, 0.1, 0, Math.PI * 2); x.fill();
    x.restore();
    x.restore();
  }
  // SP2 — THE BLADE AT NIGHT: its letters LIT (warm-white, a crisp bright letter + a tight baked glow), one canvas per game + size
  let bladeCv = null, bladeKey = '', bladeAt = null;
  function paintBladeLit(game) {
    const bg = bladeGeo(G), R0 = bg.rect, pad = 4, ow = R0.w + pad * 2 + G.K, oh = R0.h + pad * 2;
    bladeCv = bladeCv || document.createElement('canvas');
    bladeCv.width = Math.ceil(ow * dpr); bladeCv.height = Math.ceil(oh * dpr);
    const x = safeCtx(bladeCv), ox = R0.x - pad - G.K * 0.5, oy = R0.y - pad;
    x.setTransform(dpr, 0, 0, dpr, -ox * dpr, -oy * dpr); x.clearRect(ox, oy, ow, oh);
    x.save(); wallMap(x, bg.ox, bg.oy, bg.k);
    paintBlade(x, { ...mats({ day: 0, gold: 0, night: 1, sunDir: 0, sunEl: 30, ovc: 0, haze: [40, 40, 70] }), glowPx: BLADE_GLOW * dpr }, game, true);
    x.restore();
    return { x: ox, y: oy, w: ow, h: oh };
  }
  // the gold leaf laid again over whatever moves behind the shop's glass (7b: the barber, the customer, the mirror door's light) —
  // one small canvas per look (the gilt's colours by the day / golden / night tones), drawn 1:1 over the window
  function giltOver(c, f) {
    const T = f.tw || { day: 1, gold: 0, night: 0 }, key = [T.day || 0, T.gold || 0, T.night || 0].map(v => v.toFixed(1)).join(',') + '|' + dpr + '|' + G.K.toFixed(2);
    if (key !== giltKey || !giltCv) {
      giltKey = key;
      const [w0, w1, wv0, wv1] = G.s.shop.win, [ax, ay] = G.front(w0, wv1), [bx, by] = G.front(w1, wv0);
      // (on whole DEVICE pixels, drawn at its natural size: never resampled)
      giltAt = { x: Math.floor(ax * dpr) / dpr, y: Math.floor(ay * dpr) / dpr, w: 0, h: 0 };
      giltCv = giltCv || document.createElement('canvas'); giltCv.width = Math.ceil((bx - giltAt.x + 2) * dpr); giltCv.height = Math.ceil((by - giltAt.y + 2) * dpr);
      giltAt.w = giltCv.width / dpr; giltAt.h = giltCv.height / dpr;
      const x = safeCtx(giltCv), [ox, oy] = G.front(0, 0);
      x.setTransform(dpr, 0, 0, dpr, -giltAt.x * dpr, -giltAt.y * dpr);
      x.save(); wallMap(x, ox, oy, G.K); x.beginPath(); x.rect(w0, wv0, w1 - w0, wv1 - wv0); x.clip();
      paintGilt(x, { gilt: tri(T, [214, 168, 78], [236, 176, 90], [86, 70, 58]), giltHi: tri(T, [255, 232, 160], [255, 214, 140], [120, 100, 80]), giltLo: tri(T, [128, 86, 34], [140, 80, 40], [40, 30, 34]), night: T.night || 0, lamps: T.night || 0 }, G.s.shop);
      x.restore();
    }
    c.drawImage(giltCv, giltAt.x, giltAt.y, giltAt.w, giltAt.h);
  }
  // THE MARQUEE's lit bulbs, all in one sprite over the blade (screen pt + a halo's pad): each a crisp warm-white globe (the hot core) + a
  // small TIGHT halo (none at tier 0) at its level (steady; the party's slow chase: marqueeLevel)
  let bulbCv = null, bulbKey = '', bulbAt = null;
  function paintBulbs(a, tier, pk, beats, beatU) {
    const S = marqueeScreen(bladeGeo(G)), pad = S[0].r * MARQUEE.halo + 2;
    const x0 = Math.min(...S.map(b => b.x)) - pad, y0 = Math.min(...S.map(b => b.y)) - pad, x1 = Math.max(...S.map(b => b.x)) + pad, y1 = Math.max(...S.map(b => b.y)) + pad;
    bulbAt = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    bulbCv = bulbCv || document.createElement('canvas'); bulbCv.width = Math.ceil(bulbAt.w * dpr); bulbCv.height = Math.ceil(bulbAt.h * dpr);
    const x = safeCtx(bulbCv); x.setTransform(dpr, 0, 0, dpr, -x0 * dpr, -y0 * dpr); x.clearRect(x0, y0, bulbAt.w, bulbAt.h);
    x.globalCompositeOperation = 'lighter';
    for (const b of S) {
      const lv = marqueeLevel(b.i, pk, beats, beatU) * a;
      if (tier !== 0) soft(x, [255, 206, 140], b.x, b.y, b.r * MARQUEE.halo, 0.55 * lv);
      soft(x, [255, 236, 196], b.x, b.y, b.r * 1.7, 0.9 * lv);
      soft(x, [255, 252, 240], b.x, b.y, b.r * 0.95, lv);
    }
  }
  // FP — A SOFT GLOW (the owner: the sconce + the shop's lamp read as hard-edged blobs): a near-gaussian falloff, no knee, per colour
  const softs = new Map();
  function softGlow(col) {
    const key = col.join(','); let cv = softs.get(key);
    if (cv) return cv;
    cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const x = safeCtx(cv), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    for (const [t, a] of [[0, 1], [0.1, 0.86], [0.22, 0.6], [0.36, 0.34], [0.52, 0.15], [0.7, 0.05], [0.86, 0.012], [1, 0]]) g.addColorStop(t, `rgba(${key},${a})`);
    x.fillStyle = g; x.fillRect(0, 0, 128, 128); softs.set(key, cv);
    return cv;
  }
  const soft = (c, col, cx, cy, r, a, sy = 1) => { if (a <= 0.004) return; c.globalAlpha = Math.min(1, a); c.drawImage(softGlow(col), cx - r, cy - r * sy, r * 2, r * 2 * sy); };
  // THE BARBER POLE (live): a glass cylinder of red / white / blue spirals in chrome caps. It ALWAYS turns — by day unlit, at the
  // shop's pace; from DUSK until MORNING lit from inside and turning SLOWLY, even with the CLOSED card up: the secret "we're open".
  // (7b's raid: pole({ on: false }) snaps it dark and stops it; pole({ on: true }) gives it back.)
  // FP2 — the owner, on her iPhone: "still jittery". FP slid a strip texture (3 px a point) under the glass: on the phone's canvas
  // (dpr 1.5 at tier 1, 2 at tier 2) that is a 2:1 / 3:2 DOWNSAMPLE every frame — bilinear minification aliases a slow slide (the
  // helices' edges crawl + shimmer), and any browser that snaps an image to whole pixels steps it. Now the glass is computed PER
  // DEVICE PIXEL every drawn frame (a ~10 × 60 px patch: < 0.1 ms): each pixel's helix coordinate at the exact fractional phase, its
  // stripe coverage box-filtered over the pixel's footprint (analytic antialiasing, band-limited: no crawl), the cylinder's edges
  // antialiased the same way — then put at a WHOLE device pixel, 1:1, so nothing resamples it at all. The phase is a pure function
  // of the frame's timestamp (polePhase: never a sum of frame steps), so the 30 fps battery saver only draws fewer, evenly spaced
  // positions of the same smooth slide (night 1.6 pt/s ≈ 0.05 pt a frame; day ≈ 0.14 pt). Lit: an LED-bright cool white, the red +
  // blue vivid, a TIGHT halo + a little light on the brick beside it (no smoky wash: poleHalo); a party night: neon colours + the beat.
  let poleA = null, polePh = 0.3, poleOff = false, poleRect = null, polePx = null;
  const glowAt = {};                                    // (the e2e: where the sconce + the shop lamp glow)
  let poleCv = null, poleImg = null, haloCv = null, haloKey = '';
  // the glass, per device pixel (m: the canvas's transform — device px a point + its offset): → { cv, X, Y } (whole device pixels)
  function poleGlass(m, gx, gy, gh, cx, r, band, ph, C) {
    const k = m.a, X0 = Math.floor((cx - r) * k + m.e), X1 = Math.ceil((cx + r) * k + m.e), Y0 = Math.floor(gy * k + m.f), Y1 = Math.ceil((gy + gh) * k + m.f);
    const W = Math.max(1, X1 - X0), H = Math.max(1, Y1 - Y0);
    if (!poleCv) poleCv = document.createElement('canvas');
    if (poleCv.width !== W || poleCv.height !== H) { poleCv.width = W; poleCv.height = H; poleImg = null; }
    const x = safeCtx(poleCv); if (!x || !x.createImageData) return null;
    if (!poleImg) poleImg = x.createImageData(W, H);
    const d = poleImg.data, P = 2 * band, rise = POLE_RISE * band / 2, off = ph * P, top = gy - r * 0.35 - off - band;
    for (let i = 0; i < W; i++) {
      const px = (X0 + i + 0.5 - m.e) / k, dx = px - cx, cvx = clamp01(0.5 + (r - Math.abs(dx)) * k);
      const xn = Math.max(-0.995, Math.min(0.995, dx / r)), dy = -rise * Math.asin(xn) / (Math.PI / 2);
      const slope = rise * (2 / Math.PI) / Math.sqrt(1 - xn * xn) / r, w = Math.min(band * 0.8, Math.hypot(1, slope) * 1.15 / k);
      for (let j = 0; j < H; j++) {
        const o = (j * W + i) * 4;
        if (cvx <= 0) { d[o + 3] = 0; continue; }
        const py = (Y0 + j + 0.5 - m.f) / k, cvy = clamp01(0.5 + Math.min(py - gy, gy + gh - py) * k);
        const [cr, cb] = poleStripe(py - top - dy, band, w), cw = 1 - cr - cb;
        d[o] = C.w[0] * cw + C.r[0] * cr + C.b[0] * cb; d[o + 1] = C.w[1] * cw + C.r[1] * cr + C.b[1] * cb; d[o + 2] = C.w[2] * cw + C.r[2] * cr + C.b[2] * cb;
        d[o + 3] = 255 * cvx * cvy;
      }
    }
    x.putImageData(poleImg, 0, 0);
    return { cv: poleCv, X: X0, Y: Y0, W, H };
  }
  // the halo sprite (per size + colour step; device pixels): the tight halo + the light landing on the brick beside the glass
  function poleHaloCv(m, gx, gy, gh, r, col) {
    const k = m.a, R = POLE_HALO.land * r, key = [r, gh, k, col.join(',')].map(v => (typeof v === 'number' ? v.toFixed(2) : v)).join('|');
    const X0 = Math.floor((gx - R) * k + m.e), Y0 = Math.floor((gy - R) * k + m.f), W = Math.ceil((2 * r + 2 * R) * k) + 2, H = Math.ceil((gh + 2 * R) * k) + 2;
    if (haloCv && haloKey === key) return { cv: haloCv, X: X0, Y: Y0 };
    haloCv = haloCv || document.createElement('canvas'); haloCv.width = W; haloCv.height = H; haloKey = key;
    const x = safeCtx(haloCv); if (!x || !x.createImageData) return null;
    const im = x.createImageData(W, H), d = im.data;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const px = (X0 + i + 0.5 - m.e) / k, py = (Y0 + j + 0.5 - m.f) / k;
      const ex = Math.max(gx - px, 0, px - gx - 2 * r), ey = Math.max(gy - py, 0, py - gy - gh), a = poleHalo(Math.hypot(ex, ey), r), o = (j * W + i) * 4;
      d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = Math.min(255, 255 * a);
    }
    x.putImageData(im, 0, 0);
    return { cv: haloCv, X: X0, Y: Y0 };
  }
  function drawPole(c, f) {
    const s = G.s, p = s.shop.pole, z = s.z0 - 0.42, [cx, y0] = project(G.cam, s.x0 + p.u, p.v1, z), [, y1] = project(G.cam, s.x0 + p.u, p.v0, z), sc = G.cam.F / z, r = 0.17 * sc, h = y1 - y0;
    const day = clamp01(f.day), lit = poleOff ? 0 : clamp01(f.pole == null ? f.k : f.pole), fade = f.fade == null ? 1 : f.fade;
    const pt = f.party || null, partyK = pt ? clamp01(pt.ramp == null ? pt.on : pt.ramp) * lit : 0, punch = pt && f.motion ? clamp01(pt.punch || 0) : 0;
    const lum = 0.2 + 0.8 * day;
    // the turn: the frame's timestamp → the phase (re-anchored only when the rate changes; still when the motion is off or the raid)
    poleA = poleAnchor(poleA, f.t, f.motion && !poleOff ? poleRate(lit) : 0, polePh); polePh = polePhase(poleA, f.t);
    poleRect = { x: cx - r, y: y0, w: 2 * r, h };
    const m = c.getTransform(), kk = m.a || 1, band = r * 2.2;
    const gx = cx - r, gy = y0 + r * 0.35, gh = h - r * 0.7, C = poleColours({ lum, lit, party: partyK, pal: pt && pt.pal, punch });
    c.save();
    // the TIGHT halo + the light on the brick beside it (FP2: no wide wash — poleHalo), cool white; tinted by a party night's neon
    if (lit > 0.01) {
      const q = Math.round(partyK * 8) / 8, hc = mix([214, 232, 255], mix(C.r, C.b, 0.5), q * 0.6).map(Math.round), hs = poleHaloCv(m, gx, gy, gh, r, hc);
      if (hs) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, lit * fade * (f.tier === 0 ? 0.8 : 1) * (1 + 0.5 * punch)); c.drawImage(hs.cv, hs.X, hs.Y); c.restore(); }
    }
    c.globalAlpha = fade;
    // the chrome cap + finial, the base (lit: catching the glass's cool light)
    c.fillStyle = rgb(mix([196, 200, 210].map(v => v * lum + 8 * (1 - lum)), [206, 218, 236], lit * 0.6)); c.beginPath(); c.ellipse(cx, y0, r * 1.25, r * 0.5, 0, Math.PI, 0); c.fill(); c.fillRect(cx - r * 1.25, y0, r * 2.5, r * 0.35);
    c.beginPath(); c.arc(cx, y0 - r * 0.85, r * 0.35, 0, Math.PI * 2); c.fill();
    c.fillRect(cx - r * 1.25, y1 - r * 0.35, r * 2.5, r * 0.5);
    // the glass: computed per device pixel at the exact phase, put at a whole device pixel (no resampling: never stepped, never crawling)
    const pg = poleGlass(m, gx, gy, gh, cx, r, band, polePh, C);
    if (pg) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = fade; c.drawImage(pg.cv, pg.X, pg.Y); c.restore(); polePx = { X: pg.X, Y: pg.Y, W: pg.W, H: pg.H, band: +band.toFixed(3), k: kk }; }
    c.beginPath(); c.rect(gx, gy, r * 2, gh); c.clip();
    // the glass's roundness: lit — the edges a cool dark, an LED-bright core ADDED down the middle; by day dark edges + a highlight
    const g = c.createLinearGradient(gx, 0, gx + r * 2, 0);
    if (lit > 0.01) { const e0 = (0.46 - 0.2 * lit).toFixed(3), e1 = (0.5 - 0.18 * lit).toFixed(3); g.addColorStop(0, `rgba(16,20,40,${e0})`); g.addColorStop(0.3, 'rgba(16,20,40,0)'); g.addColorStop(0.7, 'rgba(12,14,32,0)'); g.addColorStop(1, `rgba(12,14,32,${e1})`); }
    else { g.addColorStop(0, 'rgba(0,0,0,0.45)'); g.addColorStop(0.3, 'rgba(255,255,255,0.32)'); g.addColorStop(0.42, 'rgba(255,255,255,0.05)'); g.addColorStop(1, 'rgba(0,0,0,0.5)'); }
    c.fillStyle = g; c.fillRect(gx, gy, r * 2, gh);
    if (lit > 0.01) {
      const hg = c.createLinearGradient(gx, 0, gx + r * 2, 0), a = (0.5 * lit * (1 + 0.4 * punch)).toFixed(3);
      hg.addColorStop(0.2, 'rgba(236,244,255,0)'); hg.addColorStop(0.45, `rgba(236,244,255,${a})`); hg.addColorStop(0.7, 'rgba(236,244,255,0)');
      c.globalCompositeOperation = 'lighter'; c.fillStyle = hg; c.fillRect(gx, gy, r * 2, gh); c.globalCompositeOperation = 'source-over';
    }
    c.restore();
  }
  // FP3a (FREV H1) — THE FACADE'S ONE POWER HOOK: power(k) dims every light on the building at once — the rooms (k), the blade +
  // its bulbs (lamp), the sconce + the awning's lamps, the barber pole, the basement, the hush sign. 1 = untouched (the frame f
  // passes through as it is); 8b's raid drives it (harbor().raid → speak.power)
  let power = 1;
  function draw(c, f0) {
    if (!G) return;
    const P = power, f = P >= 1 ? f0 : { ...f0, k: clamp01(f0.k) * P, lamp: (f0.lamp || 0) * P, sconce: clamp01(f0.sconce == null ? f0.k : f0.sconce) * P, pole: clamp01(f0.pole == null ? f0.k : f0.pole) * P };
    const fade = f.fade == null ? 1 : f.fade;
    c.save();
    const k = clamp01(f.k) * fade; lastK = k; lastT = f.t || 0; lastGame = f.game || null;
    // (7b: the life's frame first — a window it draws whole this frame (the TV, the night lamp, a routine) is 0 in the lit canvas)
    const fr = life.frame(f);
    const levels = wins.map(w => (fr.full.has(w.id) ? 0 : Math.round(levelOf(w, f) * 8) / 8));
    if (k > 0.004) {
      const late = Math.round(lateOf(f.hour) * 4) / 4, key = levels.join(',') + '|' + late + '|' + dpr;
      if (key !== litKey || !litCv) { paintLit(levels, late); litKey = key; }
      c.globalAlpha = k; c.drawImage(litCv, box.x, box.y, box.w, box.h);
      // (SP2 — no smoke: the soft blob round each lit window is gone; their light LANDS on the sill, the reveal + the sill's edge — the lit
      // canvas: windows.js#landing)
      c.globalCompositeOperation = 'lighter';
      // (FP2 — no smoke: the shop lamp's light lands INSIDE the window — paintLit's pool on the floor, the chair, the mirror — and the globe
      // keeps a small tight halo; the 14 pt soft cloud it threw over the glass + the gold leaf is gone)
      const [w0, w1, , wv1] = G.s.shop.win, [lx, ly] = G.front(w0 + (w1 - w0) * 0.38, wv1 - 0.48); soft(c, [255, 222, 172], lx, ly, G.K * SHOP_GLOW.lamp, 0.62 * k); glowAt.lamp = [lx, ly];
      c.globalCompositeOperation = 'source-over';
    }
    // PART 7b — THE LIFE: the people, the cat, the TV, the night lamp, the bar's afternoon + last light, the shop's day, the mirror door
    c.globalAlpha = 1;
    const [ox, oy] = G.front(0, 0);
    life.draw(c, { map: x => wallMap(x, ox, oy, G.K), wins, levels, k, f, shopWin: G.s.shop.win, card: null, gilt: null, play: f.play });
    // 8P — THE HUSH WORD SIGN: bare neon tubes inside the lower-right upstairs window (the jazz room — its life shows between the letters),
    // only while a lobby is open (hushsign.js); the window's meeting rail laid back over them (they hang inside the glass)
    { if (f.hush !== undefined) hush.set(f.hush);
      hush.draw(c, { t: f.t || 0, T: f.tw || { day: 1 - k, gold: 0, night: k }, fade: fade * P, motion: f.motion });
      if (hush.debug().text) { const [a, b] = G.s.windows[2], [r0, r1] = G.s.rows[0], h0 = r0 + 0.12, h1 = r1 - 0.06, rail = h0 + (h1 - h0) * SASH_RAIL;
        c.save(); wallMap(c, ox, oy, G.K); c.globalAlpha = fade; R(c, a + 0.18, rail - 0.025, b - 0.05, rail + 0.025, k > 0.3 ? 'rgb(26,18,20)' : 'rgb(30,48,42)'); c.restore(); } }
    // THE GOLD LEAF on the glass — once (8P), over the shop's life + the sign inside
    c.save(); c.globalAlpha = fade; giltOver(c, f); c.restore();
    bedsNow = { ...life.bedLevels(k, !!(f.party && (f.party.ramp == null ? 1 : f.party.ramp) > 0.3)), fr, k, motion: f.motion !== false };   // (8P: the moments' + the shop's sound cues read the frame — sounds.js)
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    // for 7b: a moment's own painter over its window
    for (const [id, fn] of drawers) { const w = wins.find(o => o.id === id); if (w) fn(c, w, f); }
    c.globalCompositeOperation = 'lighter';
    // the sconce by the side door (warm, from dusk). FP2 — no smoke: the SOURCE (its glass lit: a warm bright pane), a small TIGHT halo,
    // and its light LANDING on the brick, the door's granite frame + the oak (baked into the night's facade: paintGround) — the 46 pt
    // soft wash it threw over the door is gone
    { const sc = G.s.shop.sconce, [sx, sy] = G.front(sc.u, sc.v + 0.13), a = clamp01(f.sconce == null ? f.k : f.sconce) * fade;
      if (a > 0.004) { const [p, py] = G.front(sc.u - 0.1, sc.v + 0.26), [q, qy] = G.front(sc.u + 0.1, sc.v); c.globalCompositeOperation = 'source-over'; c.globalAlpha = Math.min(1, a); c.fillStyle = 'rgb(255,226,170)'; c.fillRect(p, py, q - p, qy - py); c.globalCompositeOperation = 'lighter'; }
      soft(c, [255, 210, 150], sx, sy, G.K * SHOP_GLOW.sconce, 0.72 * a); glowAt.sconce = [sx, sy]; }
    // 8P — THE AWNING'S THREE LAMPS lit: each bulb a crisp warm globe + a small TIGHT halo (their light on the canvas, the shopfront and
    // the pavement is baked — speakeasySteps); the barber pole stays the brightest light on the front
    { const a = clamp01(f.sconce == null ? f.k : f.sconce) * fade;
      if (a > 0.004) for (const b of awningBulbs(G.s.awning)) {
        const [bx, by0] = project(G.cam, G.s.x0 + b.u, b.y, b.z), r = AWNING_LAMP.bulb * G.cam.F / b.z, by = by0 + r * 0.3;
        soft(c, [255, 204, 146], bx, by, AWNING_LAMP.halo * G.cam.F / b.z, 0.55 * a * AWNING_LAMP.k);
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = Math.min(1, a); c.fillStyle = 'rgb(255,238,208)'; c.beginPath(); c.arc(bx, by, r, 0, Math.PI * 2); c.fill();
        c.fillStyle = 'rgb(255,252,240)'; c.beginPath(); c.arc(bx, by + r * 0.15, r * 0.5, 0, Math.PI * 2); c.fill(); c.globalCompositeOperation = 'lighter';
      } }
    // THE BASEMENT WINDOW: the one hint of the secret — 8P (the owner: "you can't really tell"): the club's heart, unlike every room above —
    // a DEEPER smoky amber edging to copper, a bit brighter; alive through MOVEMENT: now and then the shadows of people passing behind it
    // (the light warming + dimming as they pass), a gentle pulse with the beat on party nights (the music's heart is down there), a very
    // rare brief flicker (an old wire). basementLight() is PURE (tested).
    { const b = basement, t = f.t || 0, pt = f.party, beat = pt && f.motion ? clamp01(pt.ramp == null ? 1 : pt.ramp) * clamp01(pt.punch || 0) : 0;
      const L1 = basementLight(f.motion ? t : 0, { night: clamp01(f.night), beat }), L0 = P >= 1 ? L1 : { ...L1, a: L1.a * P };
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = Math.min(1, L0.a * fade);
      const g = c.createLinearGradient(0, b.y, 0, b.y + b.h); g.addColorStop(0, rgb(BASEMENT.top)); g.addColorStop(0.55, rgb(BASEMENT.mid)); g.addColorStop(1, rgb(BASEMENT.low));
      c.fillStyle = g; c.fillRect(b.x, b.y, b.w, b.h);
      // the shadows passing (head + shoulders, soft-edged, against the light) — clipped to the opening
      if (L0.shadows.length) {
        c.save(); c.beginPath(); c.rect(b.x, b.y, b.w, b.h); c.clip(); c.fillStyle = 'rgb(34,12,8)';
        for (const sh of L0.shadows) {
          const sx = b.x + b.w * sh.x, hh = b.h * sh.s, hy = b.y + b.h * 0.42;
          c.globalAlpha = Math.min(1, sh.a * fade);
          c.beginPath(); c.ellipse(sx, hy, hh * 0.26, hh * 0.3, 0, 0, Math.PI * 2); c.fill();
          c.beginPath(); c.ellipse(sx, hy + hh * 0.78, hh * 0.62, hh * 0.5, 0, Math.PI, 0); c.fill(); c.fillRect(sx - hh * 0.62, hy + hh * 0.78, hh * 1.24, b.h);
        }
        c.restore();
      }
      // its light landing on the sill under it + the iron bars over the glow (the bake's bars are under this layer)
      c.globalAlpha = Math.min(1, L0.a * 0.75 * fade); c.fillStyle = rgb(BASEMENT.low); c.fillRect(b.x - 1, b.y + b.h, b.w + 2, Math.max(0.6, b.h * 0.12));
      c.globalAlpha = fade; c.fillStyle = 'rgb(16,12,14)';
      const [b0, b1] = G.s.shop.basement;
      for (let u = b0 + 0.2; u < b1; u += 0.24) { const [px] = G.front(u - 0.025, 0); c.fillRect(px, b.y, Math.max(0.6, 0.05 * G.K), b.h); }
      basementDbg = L0; }
    c.globalCompositeOperation = 'source-over';
    // THE BLADE AT NIGHT: the lit letters, the bulbs
    if (f.game && (f.lamp || 0) > 0.004) {
      const key = f.game.id + '|' + dpr + '|' + G.K.toFixed(2);
      if (key !== bladeKey || !bladeCv) { bladeAt = paintBladeLit(f.game); bladeKey = key; }
      const a = clamp01(f.lamp) * fade;
      c.globalAlpha = a; c.drawImage(bladeCv, bladeAt.x, bladeAt.y, bladeAt.w, bladeAt.h);
      c.globalCompositeOperation = 'lighter';
      // 7b — THE MARQUEE'S BULBS lit: each a crisp warm-white globe (the hot core) + a small TIGHT halo (none at tier 0) — steady; a
      // party night's slow chase (marqueeLevel: a step a beat)
      const pt = f.party, pk = pt && f.motion ? clamp01(pt.ramp == null ? 1 : pt.ramp) : 0;
      // (one sprite of every lit bulb, re-painted only when the level or the chase steps — a steady night is one drawImage a frame)
      const beats = pt ? pt.beats || 0 : 0, fq = pt ? Math.round(clamp01((pt.beatU || 0) * 3) * 4) / 4 : 1, aq = Math.round(a * 16) / 16;
      const bk = `${aq}|${f.tier === 0 ? 0 : 1}|${pk > 0.01 ? `${((beats % 3) + 3) % 3}|${fq}|${Math.round(pk * 8)}` : 's'}|${dpr}|${G.K.toFixed(2)}`;
      if (bk !== bulbKey) { bulbKey = bk; paintBulbs(aq, f.tier, pk, beats, fq / 3); }
      if (bulbCv && bulbAt) { c.globalAlpha = 1; c.drawImage(bulbCv, bulbAt.x, bulbAt.y, bulbAt.w, bulbAt.h); }
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
    /** FP3a: every light on the facade × k (0 = dark, 1 = as the night has it) → the level now; power() reads it */
    power(k) { if (k !== undefined) power = clamp01(+k); return power; },
    /** the barber pole: { on: false } dark + still (7b's raid), { on: true } back to its lamp + its turn */
    pole(o = {}) { if ('on' in o) poleOff = !o.on; },
    roomDraw(id, fn) { if (fn) drawers.set(id, fn); else drawers.delete(id); },
    /** 8P — THE HUSH WORD SIGN: hush(word) sets the lobby's word (null = no lobby); hush() → the sign's state */
    hush(w) { if (w !== undefined) hush.set(w); return hush.debug(); },
    /** PART 7b: a tap on the speakeasy's windows → { kind: 'window', id, tap } | { kind: 'cat', id } | null */
    hit: (x, y) => (G ? life.hit(x, y, wins, lastT) : null),
    life: () => life.debug(),
    /** PART 7b: the speakeasy's sound beds now (sounds.js#speakeasy): { club, tv, party } */
    beds: () => bedsNow,
    debug: () => ({ basement: basementDbg ? { a: +basementDbg.a.toFixed(3), shadows: basementDbg.shadows.length, flick: basementDbg.flick } : null, marquee: G && lastGame ? marqueeScreen(bladeGeo(G)).map(b => ({ x: +b.x.toFixed(1), y: +b.y.toFixed(1) })) : [], poleRect, glowAt: { ...glowAt }, turned: G ? G.turned : null, side: G ? +G.len.toFixed(2) : 0, sidePt: G ? Math.round(G.side(G.len, 0)[0] - G.side(0, 0)[0]) : 0, windows: wins.length, mirror, poleOn: !poleOff, polePh: +polePh.toFixed(4), poleRate: poleA ? +poleA.rate.toFixed(3) : 0, polePx, box, dpr, k: lastK, lit: !!litCv, mb: +(((litCv ? litCv.width * litCv.height : 0) + (bladeCv ? bladeCv.width * bladeCv.height : 0)) * 4 / 1e6).toFixed(2) }),
    destroy() { life.destroy(); hush.destroy(); for (const cv of [litCv, bladeCv, poleCv, haloCv, giltCv, bulbCv, ...softs.values()]) if (cv) cv.width = cv.height = 0; giltCv = bulbCv = null; bulbKey = ''; litCv = bladeCv = poleCv = haloCv = poleImg = null; haloKey = ''; softs.clear(); },
  };
}
