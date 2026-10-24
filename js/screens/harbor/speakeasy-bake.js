// CITY 2.0 — THE HARBOR: THE SPEAKEASY — THE BAKE (the walls, the date stone, the windows, the ground floor, the gilt, the wall-washers, the ivy + the steps that paint them) (FP3b: split out of speakeasy.js, FREV A1's split by responsibility; speakeasy.js
// re-exports everything, so its importers are unchanged).
import { project } from '../../core/harbor-layout.js';
import { SPEAK_V, ROOMS, roomLight } from '../../core/harbor-speakeasy.js';
import { rngFrom } from '../../core/rng.js';
import { rgb, mix, shade, box, poly } from './shapes.js';
import { faces } from './blocks.js';
import { safeCtx } from '../../ui/canvas-safe.js';
import { dayPaint } from './signs.js';
import { paintRoom, createWindowLife, SASH_RAIL, lateOf } from './windows.js';
import { createHushSign } from './hushsign.js';
import { clamp01, tri, FONT, V, W_FRONT, GLASS_IN, AWNING_LAMP, VAL, awningBulbs, SHOP_GLOW, speakGeo, mats, wallMap, R, devRect, fillPat, text, brickTile, streak, fan, chevrons } from './speakeasy-geo.js';
import { BLADE, BLADE_GLOW, bladeGeo, bladeOutline, MARQUEE, marqueeBulbs, marqueeScreen, marqueeLevel, LETTER, BLADE_SPLIT, BLADE_ONE, bladeWords, bladeLetters, paintLetters, paintBlade } from './speakeasy-blade.js';

// ------------------------------------------------------------------ THE WALLS (flat paintings)
/** FP3b — THE STONE's texture: a fine speckle of lighter + darker flecks over a trim band (limestone's grain, a terracotta's firing) */
export function stoneTex(x, u0, v0, u1, v1, col, r) {
  const n = Math.round((u1 - u0) * (v1 - v0) * 70);
  for (let i = 0; i < n; i++) { const lt = r() < 0.5; x.fillStyle = rgb(lt ? mix(col, [255, 250, 236], 0.4) : shade(col, -0.28), 0.18 + r() * 0.16); x.fillRect(u0 + r() * (u1 - u0), v0 + r() * (v1 - v0), 0.025 + r() * 0.04, 0.02 + r() * 0.025); }
}
/** FP3b — SOOT streaking down the brick from a ledge at v: irregular thin streaks, darker at the ledge, fading as they run (k: how many) */
export function sootUnder(x, M, u0, u1, v, r, k = 1) {
  const a = (0.16 + 0.1 * (M.day + M.gold)) * (1 - 0.4 * M.night), n = Math.round((u1 - u0) * 1.1 * k);
  for (let i = 0; i < n; i++) streak(x, u0 + r() * (u1 - u0), v, 0.04 + r() * 0.1, 0.3 + r() * 1.1, M.soot, a * (0.5 + r() * 0.7));
}
/** the brick field + the Deco structure of a wall: plinth, belt course, spandrels, cornice + dentils, parapet + coping; side:
 *  the side wall's run (its ghost ad comes separately) */
export function paintStructure(x, M, o) {
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
  stoneTex(x, u0, V.ground, u1, V.belt, trim, r);
  chevrons(x, u0, u1, V.ground + 0.08, V.belt - 0.1, hi, lo, 0.42);
  R(x, u0, V.belt - 0.06, u1, V.belt, hi);
  // (FP3b: its shadow on the brick — a CRISP dark line right under the drip, then a soft fall; soot streaking down from it)
  R(x, u0, V.ground - 0.06, u1, V.ground, M.soot, 0.55 * (M.day + M.gold) + 0.3);
  R(x, u0, V.ground - 0.16, u1, V.ground - 0.06, M.soot, 0.22);
  sootUnder(x, M, u0, u1, V.ground - 0.06, r, 0.9);
  // the frieze under the cornice + the cornice: dentils, the crown moulding (its top lit, a deep shadow line under it)
  const [c0, c1] = V.cornice;
  R(x, u0, c0, u1, c0 + 0.3, trim);
  stoneTex(x, u0, c0, u1, c0 + 0.3, trim, r);
  // the DENTILS (FP3b: each block lit on its face, its shadow under it on the frieze — crisp, the light from above)
  for (let u = u0 + 0.06; u < u1; u += 0.24) { R(x, u, c0 + 0.08, u + 0.12, c0 + 0.22, mix(trim, hi, 0.35)); R(x, u, c0 + 0.05, u + 0.12, c0 + 0.08, shade(lo, -0.35)); R(x, u + 0.1, c0 + 0.05, u + 0.12, c0 + 0.22, lo); }
  R(x, u0, c0 + 0.3, u1, c1, hi);
  stoneTex(x, u0, c0 + 0.3, u1, c1, hi, r);
  R(x, u0, c0 + 0.3, u1, c0 + 0.37, shade(lo, -0.25));
  R(x, u0, c1 - 0.06, u1, c1, mix(hi, [255, 255, 255], 0.3 * (1 - M.night)));
  // the cornice's shadow on the brick below it (deeper with a high sun; soft under cloud)
  { const dd = (0.18 + 0.3 * clamp01(((M.T.sunEl || 30) - 6) / 40)) * (1 - 0.6 * M.ov) * (M.day + M.gold * 0.6), g = x.createLinearGradient(0, c0, 0, c0 - 0.2 - dd * 2);
    g.addColorStop(0, rgb(M.soot, 0.55 * (M.day + M.gold) + 0.2 * M.night)); g.addColorStop(1, rgb(M.soot, 0)); x.fillStyle = g; x.fillRect(u0, c0 - 0.2 - dd * 2, u1 - u0, 0.2 + dd * 2);
    // (FP3b: a CRISP edge to it — the cornice's hard shadow line — + the soot of a century streaking down from the ledge)
    R(x, u0, c0 - 0.07, u1, c0, M.soot, 0.6 * (M.day + M.gold) + 0.25);
    sootUnder(x, M, u0, u1, c0 - 0.07, r, 1.3); }
  // the parapet: brick, a terracotta coping (lit top), sunk panels
  R(x, u0, V.parapet - 0.16, u1, V.parapet, hi);
  stoneTex(x, u0, V.parapet - 0.16, u1, V.parapet, hi, r);
  R(x, u0, V.parapet - 0.2, u1, V.parapet - 0.16, lo);
  R(x, u0, V.parapet - 0.26, u1, V.parapet - 0.2, M.soot, 0.3 * (M.day + M.gold) + 0.15);
  return { brick, trim, hi, lo, stone };
}

/** THE FRONT (u 0 … 11.2): piers + spandrels + the crest over the structure */
export function paintFrontDeco(x, M, P) {
  const { hi, lo, trim } = P, win = [[1.0, 2.9], [4.2, 6.1], [7.4, 9.3]], rows = V.rows, rs = rngFrom(83);
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
    R(x, W_FRONT - w, v + 0.03, W_FRONT, v + 0.39, trim); stoneTex(x, W_FRONT - w, v + 0.03, W_FRONT, v + 0.39, trim, rs);
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
      R(x, a - 0.16, r0 - 0.16, b + 0.16, r0, trim); stoneTex(x, a - 0.16, r0 - 0.16, b + 0.16, r0, trim, rs); R(x, a - 0.16, r0 - 0.03, b + 0.16, r0, hi);
      // (FP3b: the sill's shadow — a crisp line under its drip, a soft fall below — + the soot it sheds down the brick)
      R(x, a - 0.12, r0 - 0.21, b + 0.12, r0 - 0.16, M.soot, 0.5 * (M.day + M.gold) + 0.25);
      R(x, a - 0.12, r0 - 0.3, b + 0.12, r0 - 0.21, M.soot, 0.2 * (M.day + M.gold) + 0.1);
      sootUnder(x, M, a - 0.05, b + 0.05, r0 - 0.21, rs, 1.6);
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
  for (const u of [9.95]) { R(x, u - 0.24, V.parapet - 0.02, u + 0.24, V.parapet + 0.18, trim); R(x, u - 0.13, V.parapet + 0.18, u + 0.13, V.parapet + 0.32, trim); R(x, u - 0.24, V.parapet + 0.14, u + 0.24, V.parapet + 0.18, hi); }
}

/** THE DATE STONE — FP3b (the owner's 8P note 7: "a flat white box with 1924 — not clear it's a year"): an intricate CARVED TABLET of
 *  warm limestone set across the parapet under the crest — "EST. 1924" in INCISED letters (the cut in shadow, its lower lip catching the
 *  light), a RAISED MOULDED BORDER (lit top, shadowed foot), small Deco SCROLLS at its ends; a hidden lamp on the cornice washes it softly
 *  from below at night. DATE: its size + place (wall units), the two words + their cap heights */
export const DATE = Object.freeze({ w: 4.1, v0: 10.6, v1: 11.62, est: 'EST.', year: '1924', capE: 0.4, capY: 0.6, gap: 0.2, ear: 0.36 });
export function paintDateStone(x, M, cm, hi, lo) {
  const D = DATE, a = cm - D.w / 2, b = cm + D.w / 2, day = 1 - M.night;
  const stone = mix(mix(M.trim, [232, 214, 178], 0.45 * day), hi, 0.12 + 0.25 * M.night), lit = mix(stone, [255, 248, 230], 0.35 * day), dk = shade(stone, -0.3);
  const font = (px, w = 800) => `${w} ${px}px "Chakra Petch", Orbitron, sans-serif`;
  // its shadow on the brick + the parapet under it (the tablet stands proud of the wall)
  R(x, a + 0.05, D.v0 - 0.13, b + 0.07, D.v0 - 0.02, M.soot, 0.35 * day + 0.2);
  // the Deco SCROLLS at the ends: a stepped ear + a curl, either side
  for (const s of [-1, 1]) {
    const e = s < 0 ? a : b, o = e + s * D.ear;
    R(x, Math.min(e, o), D.v0 + 0.16, Math.max(e, o), D.v1 - 0.16, stone);
    R(x, Math.min(e, e + s * D.ear * 0.55), D.v0 + 0.06, Math.max(e, e + s * D.ear * 0.55), D.v1 - 0.06, stone);
    R(x, Math.min(e, o), D.v1 - 0.2, Math.max(e, o), D.v1 - 0.16, lit); R(x, Math.min(e, o), D.v0 + 0.16, Math.max(e, o), D.v0 + 0.2, dk);
    x.strokeStyle = rgb(dk); x.lineWidth = 0.045; x.beginPath(); x.arc(e + s * D.ear * 0.6, (D.v0 + D.v1) / 2, 0.16, 0, Math.PI * 2); x.stroke();
    x.strokeStyle = rgb(lit); x.lineWidth = 0.03; x.beginPath(); x.arc(e + s * D.ear * 0.6, (D.v0 + D.v1) / 2 + 0.01, 0.075, s < 0 ? 0 : Math.PI, s < 0 ? Math.PI * 1.5 : Math.PI * 2.5); x.stroke();
  }
  // the tablet: the raised border (lit top, shadowed foot + side), a sunk field inside it
  R(x, a, D.v0, b, D.v1, stone);
  R(x, a, D.v1 - 0.06, b, D.v1, lit); R(x, a, D.v0, b, D.v0 + 0.06, dk); R(x, b - 0.05, D.v0, b, D.v1, M.sd >= 0 ? dk : lit); R(x, a, D.v0, a + 0.05, D.v1, M.sd >= 0 ? lit : dk);
  const f0 = a + 0.17, f1 = b - 0.17, g0 = D.v0 + 0.15, g1 = D.v1 - 0.15;
  R(x, f0, g0, f1, g1, shade(stone, -0.06));
  R(x, f0, g1 - 0.045, f1, g1, dk); R(x, f0, g0, f1, g0 + 0.035, lit);                 // (the field is SUNK: its top edge in shadow, its foot lit)
  stoneTex(x, a, D.v0, b, D.v1, stone, rngFrom(1924));
  // the letters — INCISED: the lower lip catching the light (a light copy a hair below), the cut itself dark, its floor a shade lighter
  const carve = mix(shade(stone, -0.6), [44, 32, 28], 0.35), floor = shade(stone, -0.4), base = D.v0 + (D.v1 - D.v0 - D.capY) / 2 + 0.01, sz = c => c / 0.72;
  x.save(); x.font = font(sz(D.capE) * 100); const wE = x.measureText(D.est).width / 100; x.font = font(sz(D.capY) * 100); const wY = x.measureText(D.year).width / 100; x.restore();
  const tw = wE + D.gap + wY, uE = cm - tw / 2 + wE / 2, uY = cm + tw / 2 - wY / 2, sqz = Math.min(1, (f1 - f0 - 0.2) / tw);
  const word = (s, u, cap, col, du = 0, dv = 0) => text(x, s, cm + (u - cm) * sqz + du, base + dv, sz(cap), { fill: rgb(col), sq: sqz, font });
  for (const [s, u, cap] of [[D.est, uE, D.capE], [D.year, uY, D.capY]]) {
    word(s, u, cap, mix(lit, [255, 255, 250], 0.3 * day), 0.012, -0.03);    // the lit lower lip
    word(s, u, cap, carve);                                                   // the cut (in shadow)
    word(s, u, cap, floor, 0.008, -0.012);                                    // its floor, a shade lighter toward the lit lip
  }
  // at night: a soft warm wash from a lamp hidden on the cornice, brightest at the foot (baked by the lamps' ramp)
  const lk = clamp01(M.T.lamps == null ? M.night : M.T.lamps) * clamp01((M.night - 0.3) / 0.5);
  if (lk > 0.01) {
    x.save(); x.globalCompositeOperation = 'lighter';
    const g = x.createLinearGradient(0, D.v0, 0, D.v1 + 0.3); g.addColorStop(0, rgb([255, 204, 150], 0.7 * lk)); g.addColorStop(0.75, rgb([255, 192, 134], 0.32 * lk)); g.addColorStop(1, rgb([255, 190, 130], 0));
    x.fillStyle = g; x.fillRect(a - D.ear, D.v0 - 0.1, D.w + D.ear * 2, D.v1 - D.v0 + 0.4); x.restore();
    R(x, cm - 0.3, D.v0 - 0.18, cm + 0.3, D.v0 - 0.1, M.iron);                       // (the little lamp's hood on the cornice)
    for (const [s, u, cap] of [[D.est, uE, D.capE], [D.year, uY, D.capY]]) word(s, u, cap, mix(carve, [30, 18, 16], 0.5));
  }
}

/** an upper window, by day (the sky in the glass, a shade at its height, curtains) or dark (the night's base: the lit layer
 *  paints the room over it) */
export function paintWindow(x, M, a, b, r0, r1, o) {
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
  // (FP3b, the owner: the mound + the blooms rose above the sill into the glass and hid the TV room at night — now NOTHING rises above
  // the sill line: the plants sit inside the box's top edge — clipped there — the trailing ivy hangs down its front; the morning's
  // watering — windows.js 'wake' — still pours onto them)
  if (o.box) {
    const m = o.month || 10, rr = rngFrom(19), x0 = a - 0.02, x1 = b + 0.02, top = r0 - 0.16, bot = r0 - 0.72;
    x.save(); x.beginPath(); x.rect(x0 - 0.5, bot - 0.6, x1 - x0 + 1, r0 - 0.02 - (bot - 0.6)); x.clip();
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
    for (let i = 0; i < 22; i++) { const u = x0 + 0.08 + rr() * (x1 - x0 - 0.16), v = top - 0.1 + rr() * 0.1; x.fillStyle = rgb(night(shade(leaf[0], -0.3))); x.beginPath(); x.arc(u, v - 0.03, 0.1, 0, Math.PI * 2); x.fill(); }
    for (let i = 0; i < 26; i++) { const u = x0 + 0.08 + rr() * (x1 - x0 - 0.16), v = top - 0.08 + rr() * 0.12; x.fillStyle = rgb(night(leaf[i % 2])); x.beginPath(); x.ellipse(u, v, 0.1, 0.07, rr() * 3, 0, Math.PI * 2); x.fill(); }
    const nB = m === 12 || m <= 2 ? 7 : 9;
    for (let i = 0; i < nB; i++) {
      const u = x0 + 0.18 + (i + 0.5) * (x1 - x0 - 0.36) / nB + (rr() - 0.5) * 0.08, v = top - 0.02 + rr() * 0.06, col = flowers[i % flowers.length];
      if (m === 12 || m <= 2) { x.fillStyle = rgb(night(col)); for (let k = 0; k < 3; k++) { x.beginPath(); x.arc(u + (k - 1) * 0.05, v + (k % 2) * 0.04, 0.035, 0, Math.PI * 2); x.fill(); } continue; }
      x.fillStyle = rgb(night(shade(col, -0.25))); x.beginPath(); x.arc(u + 0.02, v - 0.02, 0.1, 0, Math.PI * 2); x.fill();
      x.fillStyle = rgb(night(col)); x.beginPath(); x.arc(u, v, 0.095, 0, Math.PI * 2); x.fill();
      x.fillStyle = rgb(night(mix(col, [255, 255, 255], 0.35))); x.beginPath(); x.arc(u - 0.03, v + 0.03, 0.035, 0, Math.PI * 2); x.fill();
    }
    x.restore();
  }
}

/** THE GROUND FLOOR: the barbershop (its window with the chair + the mirror wall + gold leaf, its door + the OPEN / CLOSED card),
 *  the pole's brackets, the unmarked side door, the basement window, the sconce */
export function paintGround(x, M, s) {
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
export function paintGilt(x, M, sh) {
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
export const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
export function paintWashers(x, M, lk, tile) {
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
export function paintWasherLamps(x, M, lk) {
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
export function paintLight(x, M, u0, u1, side, seed) {
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

/** BOSTON IVY up the corner pier — FP3b (the owner: the 8P mat "reads like FIRE", then FP3a's "a bunch of fall leaves stuck against the
 *  wall"): a FEW branching woody VINES climbing the corner from the bed by the door ALL THE WAY UP to the parapet, the brick showing
 *  between them, small CLUSTERS of three-lobed leaves at the nodes — fuller low down, sparse at the top. By the month: September still
 *  mostly green turning, October crimson + scarlet with a few amber + green, November thinning to a few dark reds, winter BARE vines,
 *  spring a fresh light green (small), summer deep green. width(v): how far from the corner it may wander at height v (never over the
 *  door, the sconce or the blade). o: { top (wall units — default the parapet), leaders } */
export const IVY = Object.freeze({ top: V.parapet - 0.12, bed: [10.78, 11.2], leaders: 3, node: 0.2, leaf: 0.065 });
export function ivyColours(m) {
  if (m === 9) return { leaves: [[62, 110, 52], [92, 120, 48], [150, 40, 36], [178, 70, 40], [70, 104, 46]], k: 0.9 };
  if (m === 10) return { leaves: [[150, 22, 32], [178, 32, 38], [196, 46, 40], [128, 18, 34], [214, 112, 46], [92, 112, 50]], k: 0.62 };
  if (m === 11) return { leaves: [[124, 22, 34], [150, 30, 36], [104, 20, 40]], k: 0.4 };
  if (m === 12 || m <= 3) return { leaves: null, k: 0 };
  if (m <= 5) return { leaves: [[108, 168, 78], [128, 186, 88], [94, 150, 66]], k: 0.55 };
  return { leaves: [[44, 96, 44], [56, 114, 50], [36, 84, 40], [70, 126, 56]], k: 0.9 };
}
export function paintIvy(x, M, u, dir, seed, month, width = () => 0.4, o = {}) {
  const r = rngFrom(seed), m = month || 10, C = ivyColours(m), top = o.top || IVY.top, nLead = o.leaders || IVY.leaders;
  const stem = tri(M.T, [96, 70, 52], [104, 66, 48], [22, 16, 20]), dark = c => mix(c, [12, 8, 20], 0.82 * M.night);
  const nodes = [];
  // a vine: a wandering climb (the lateral distance from the corner, inside width(v)), a node every IVY.node, side shoots now and then
  const vine = (u0, v0, v1, w0, depth) => {
    let d = u0, v = v0, lw = w0; const pts = [[u + dir * d, v]];
    while (v < v1) {
      v += IVY.node * (0.8 + r() * 0.4);
      d = Math.max(0.03, Math.min(width(v) - 0.04, d + (r() - 0.46) * 0.2));
      pts.push([u + dir * d, v]); nodes.push({ u: u + dir * d, v, depth, f: v / top });
      if (depth < 2 && r() < (depth ? 0.14 : 0.42)) {
        // a side shoot: out + up, short, leaves along it
        const len = 0.4 + r() * 0.7, a = 0.5 + r() * 0.7, ud = Math.min(width(v + len) - 0.04, d + Math.sin(a) * len);
        branches.push([d, v, ud, v + Math.cos(a) * len, lw * 0.6, depth + 1]);
      }
    }
    x.lineWidth = lw; x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) x.lineTo(p[0], p[1]); x.stroke();
    // (thinner toward the top: the upper third drawn again finer over the first pass — cheap tapering)
  };
  const branches = [];
  x.strokeStyle = rgb(dark(stem), 0.95); x.lineCap = 'round'; x.lineJoin = 'round';
  for (let i = 0; i < nLead; i++) vine(0.06 + r() * 0.16, 0.26, i === 0 ? top : top * (0.45 + r() * 0.35), 0.05 - i * 0.008, 0);
  for (const [d0, v0, d1, v1, lw, depth] of branches) {
    x.lineWidth = lw; x.beginPath(); x.moveTo(u + dir * d0, v0);
    const mid = [u + dir * ((d0 + d1) / 2 + 0.05), (v0 + v1) / 2 + 0.04]; x.quadraticCurveTo(mid[0], mid[1], u + dir * d1, v1); x.stroke();
    for (let k = 1; k <= 3; k++) { const t = k / 3; nodes.push({ u: u + dir * (d0 + (d1 - d0) * t), v: v0 + (v1 - v0) * t, depth, f: v1 / top }); }
  }
  if (!C.leaves) return;
  // the leaves: a small cluster at most nodes — fuller low down, sparse up high; the brick shows between
  for (const n of nodes) {
    if (r() > C.k * (0.8 - 0.4 * n.f)) continue;
    const cnt = 2 + Math.floor(r() * 3);
    for (let k = 0; k < cnt; k++) {
      const lu = n.u + (r() - 0.5) * 0.18, lv = n.v + (r() - 0.4) * 0.14, a = IVY.leaf * (0.8 + r() * 0.45) * (1 - 0.25 * n.f);
      const c = dark(shade(C.leaves[Math.floor(r() * C.leaves.length)], (r() - 0.45) * 0.24));
      x.fillStyle = rgb(dark(shade(c, -0.5)), 0.85); x.beginPath(); x.arc(lu + 0.012, lv - 0.02, a * 1.05, 0, Math.PI * 2); x.fill();   // (its shadow on the brick)
      x.fillStyle = rgb(c); const rot = (r() - 0.5) * 1.4;
      for (const t of [rot - 1.15, rot, rot + 1.15]) { x.beginPath(); x.arc(lu + Math.sin(t) * a * 0.72, lv + Math.cos(t) * a * 0.72, a * 0.78, 0, Math.PI * 2); x.fill(); }
      if (M.day + M.gold > 0.3) { x.fillStyle = rgb(mix(c, [255, 240, 210], 0.28), 0.7); x.beginPath(); x.arc(lu - a * 0.2, lv + a * 0.45, a * 0.32, 0, Math.PI * 2); x.fill(); }   // (a lit lobe)
    }
  }
}
/** the bed at the corner pier's foot: a little granite kerb + its soil (the ivy's roots) */
export function paintIvyBed(x, M) {
  const [a, b] = IVY.bed, g = M.stone;
  R(x, a, 0, b + 0.02, 0.3, shade(g, -0.05)); R(x, a, 0.26, b + 0.02, 0.3, mix(g, [255, 250, 240], 0.2 * (1 - M.night)));
  R(x, a + 0.05, 0.22, b - 0.03, 0.27, tri(M.T, [58, 40, 30], [64, 40, 30], [14, 10, 14]));
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
      paintIvy(sx, M, 0.04, 1, 3, ctx.month, () => 0.3, { leaders: 2, top: V.rows[1][0] });
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
    x => { x.save(); frontMap(x); paintLight(x, M, 0, W_FRONT, false, 51); paintIvyBed(x, M); paintIvy(x, M, W_FRONT - 0.03, -1, 4, ctx.month, v => (v < 3.0 ? 0.38 : v < 3.6 ? 0.38 + (v - 3.0) * 0.6 : v < 4.4 ? 0.74 + (v - 3.6) * 0.5 : 1.2)); x.restore(); },
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
