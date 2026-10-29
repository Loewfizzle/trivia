// CITY 2.0 — THE HARBOR: THE SPEAKEASY — THE BAKE (the walls, the date stone, the windows, the ground floor, the wall-washers, the ivy + the steps that paint them) (FP3b: split out of speakeasy.js, FREV A1's split by responsibility; speakeasy.js
// re-exports everything, so its importers are unchanged).
import { project } from '../../core/harbor-layout.js';
import { SPEAK_V, SPEAK_WIN, SPEAK_PIERS, ROOMS, roomLight } from '../../core/harbor-speakeasy.js';
import { rngFrom } from '../../core/rng.js';
import { rgb, mix, shade, box, poly } from './shapes.js';
import { faces } from './blocks.js';
import { safeCtx } from '../../ui/canvas-safe.js';
import { dayPaint } from './signs.js';
import { paintRoom, createWindowLife, lateOf } from './windows.js';
import { paintShopRoom, shopGlass, boxOf } from './window-rooms.js';
import { wallVP } from '../../core/harbor-rooms.js';
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
  const { hi, lo, trim } = P, win = SPEAK_WIN, rows = V.rows, rs = rngFrom(83), LT = V.lintel ?? 0.26;
  const sd = M.sd;
  // the Deco PIERS between the bays (brick, brought forward: a lit edge toward the light, a shade edge away; terracotta capitals)
  for (const [a, b] of SPEAK_PIERS) {
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
      R(x, a - 0.06, r1 + GLASS_IN * 0, b + 0.06, r1 + LT, shade(M.brick, -0.08));
      x.fillStyle = rgb(shade(M.brick, -0.32)); for (let u = a - 0.06; u < b + 0.06; u += 0.13) x.fillRect(u, r1, 0.025, LT);
      R(x, a - 0.06, r1 + LT - 0.02, b + 0.06, r1 + LT + 0.01, shade(M.brick, -0.3));
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
  // POL4 — THE DATE STONE SET INTO THE PARAPET (the owner: "cheap paper" at night, a pale panel standing on the roof edge): the parapet
  // rises over the middle bay as a brick PANEL flush with the wall (DATE.panel: its half width + its coping's top), and the stone is set
  // INTO it — the coping runs over it, brick round its sides; the Deco steps sit on the panel's coping
  { const D = DATE, hw = D.panel, top = D.top;
    if (P.pat) fillPat(x, P.pat, cm - hw, V.parapet - 0.3, cm + hw, top - 0.12); else R(x, cm - hw, V.parapet - 0.3, cm + hw, top - 0.12, M.brick);
    R(x, cm - hw - 0.05, top - 0.14, cm + hw + 0.05, top, P.trim); stoneTex(x, cm - hw - 0.05, top - 0.14, cm + hw + 0.05, top, P.trim, rngFrom(61));
    R(x, cm - hw - 0.05, top - 0.04, cm + hw + 0.05, top, hi); R(x, cm - hw - 0.05, top - 0.18, cm + hw + 0.05, top - 0.14, lo);
    R(x, cm + hw - 0.05, V.parapet - 0.3, cm + hw, top - 0.18, sd >= 0 ? shade(M.brick, -0.3) : mix(M.brick, hi, 0.3));
    R(x, cm - hw, V.parapet - 0.3, cm - hw + 0.05, top - 0.18, sd >= 0 ? mix(M.brick, hi, 0.2) : shade(M.brick, -0.3)); }
  for (const [hw, v0, v1] of [[0.9, DATE.top, DATE.top + 0.24], [0.42, DATE.top + 0.24, V.crest]]) {
    R(x, cm - hw, v0, cm + hw, v1, shade(M.brick, -0.04)); R(x, cm - hw - 0.04, v1 - 0.1, cm + hw + 0.04, v1, trim); R(x, cm - hw - 0.04, v1 - 0.03, cm + hw + 0.04, v1, hi);
    R(x, cm + hw - 0.05, v0, cm + hw, v1 - 0.1, sd >= 0 ? shade(M.brick, -0.3) : mix(M.brick, hi, 0.3));
  }
  // 8P — THE DATE STONE (Ben: "EST. 1924" on the awning was unreadable): a carved stone tablet at the top centre of the facade, where the
  // sunburst sat — "1924" in big carved numerals, the way a 1920s building showed its year; softly lit at night (paintDateStone)
  paintDateStone(x, M, cm, hi, lo);
  for (const u of [9.95]) { R(x, u - 0.24, V.parapet - 0.02, u + 0.24, V.parapet + 0.18, trim); R(x, u - 0.13, V.parapet + 0.18, u + 0.13, V.parapet + 0.32, trim); R(x, u - 0.24, V.parapet + 0.14, u + 0.24, V.parapet + 0.18, hi); }
}

/** THE DATE STONE — POL4 (the owner's FP3b notes 4 + 10: "at night it looks like CHEAP PAPER with words on it", "must not look so WHITE /
 *  clean"): an old carved stone SET INTO the parapet's raised panel over the middle bay (paintFrontDeco) — flush with the brick, a fine
 *  mortar joint round it, the coping running over it; never a pale tablet standing on the roof edge. AGED: a warm grey-buff limestone
 *  (never white), a century of WEATHERING — dark streaks running down from its top edge, soot settled in the cut letters, a few chips +
 *  spots, lichen-dark corners. "EST. 1924" INCISED: by day the light from above catches the cut's lower wall; at night the stone keeps its
 *  own dim tone, washed softly from BELOW (a lamp hidden on the cornice) — the cut's upper wall catches it, so the letters cast shadows.
 *  DATE: the panel (its half width + its coping's top), the stone (u half width, v0 → v1, wall units), the two words + their cap heights */
export const DATE = Object.freeze({ panel: 1.95, top: V.parapet + 0.37, hw: 1.66, v0: 10.62, v1: 11.4, est: 'EST.', year: '1924', capE: 0.27, capY: 0.42, gap: 0.2 });
export function paintDateStone(x, M, cm) {
  const D = DATE, a = cm - D.hw, b = cm + D.hw, h = D.v1 - D.v0, day = clamp01((M.day || 0) + (M.gold || 0)), night = M.night || 0, r = rngFrom(1924);
  const stone = tri(M.T, [178, 165, 140], [190, 156, 118], [40, 37, 42]);
  const stain = tri(M.T, [92, 82, 66], [96, 74, 56], [30, 27, 32]), lichen = tri(M.T, [70, 72, 52], [76, 66, 46], [24, 25, 26]);
  const font = (px, w = 800) => `${w} ${px}px "Chakra Petch", Orbitron, sans-serif`;
  // the mortar joint round it (a crisp dark line: the stone is IN the wall, not on it)
  R(x, a - 0.04, D.v0 - 0.04, b + 0.04, D.v1 + 0.04, shade(M.brick, -0.45));
  // the face: the stone, a soft fall of tone (a touch lighter where the weather washed it, darker low where the soot settles)
  { const g = x.createLinearGradient(0, D.v1, 0, D.v0); g.addColorStop(0, rgb(shade(stone, 0.05))); g.addColorStop(0.6, rgb(stone)); g.addColorStop(1, rgb(shade(stone, -0.1)));
    x.fillStyle = g; x.fillRect(a, D.v0, b - a, h); }
  stoneTex(x, a, D.v0, b, D.v1, stone, r);
  // THE WEATHERING: streaks from the top edge (rain carrying the coping's grime down the face), the lichen-dark corners, spots
  for (let i = 0; i < 16; i++) { const u = a + 0.06 + r() * (b - a - 0.12); streak(x, u, D.v1, 0.03 + r() * 0.1, h * (0.25 + r() * 0.75), stain, 0.16 + r() * 0.26); }
  for (const [cu, cv] of [[a, D.v0], [b, D.v0], [a, D.v1], [b, D.v1]]) {
    const g = x.createRadialGradient(cu, cv, 0, cu, cv, 0.42); g.addColorStop(0, rgb(lichen, 0.55)); g.addColorStop(1, rgb(lichen, 0));
    x.fillStyle = g; x.fillRect(Math.max(a, cu - 0.42), Math.max(D.v0, cv - 0.42), 0.42, 0.42);
  }
  for (let i = 0; i < 12; i++) { x.fillStyle = rgb(r() < 0.6 ? lichen : stain, 0.18 + r() * 0.22); x.beginPath(); x.ellipse(a + r() * (b - a), D.v0 + r() * h, 0.03 + r() * 0.06, 0.02 + r() * 0.04, r() * 3, 0, Math.PI * 2); x.fill(); }
  // a fine incised rule round the face (the mason's border), its lower edge lit by day / its upper edge at night
  { const m = 0.1, lw = 0.028, cut = mix(shade(stone, -0.55), [24, 20, 20], 0.4), lip = mix(stone, [255, 246, 226], 0.3 * day + 0.12);
    x.lineWidth = lw; x.strokeStyle = rgb(lip, 0.7); x.strokeRect(a + m, D.v0 + m - (day > 0.5 ? 0.012 : -0.012), b - a - 2 * m, h - 2 * m);
    x.strokeStyle = rgb(cut, 0.85); x.strokeRect(a + m, D.v0 + m, b - a - 2 * m, h - 2 * m); }
  // THE CHIPS: a few bites out of the edges (the joint + shadow showing in them, a paler fresh break beside)
  for (let i = 0; i < 5; i++) {
    const top = r() < 0.6, u = a + 0.15 + r() * (b - a - 0.3), w = 0.06 + r() * 0.08, d = 0.03 + r() * 0.04, v = top ? D.v1 : D.v0, s = top ? -1 : 1;
    x.fillStyle = rgb(shade(M.brick, -0.5)); x.beginPath(); x.moveTo(u - w / 2, v); x.lineTo(u - w * 0.1, v + s * d); x.lineTo(u + w * 0.3, v + s * d * 0.6); x.lineTo(u + w / 2, v); x.closePath(); x.fill();
    x.fillStyle = rgb(mix(stone, [255, 248, 230], 0.18 * day + 0.06), 0.6); x.fillRect(u - w * 0.1, v + s * d, w * 0.4, s * 0.012);
  }
  // THE LETTERS — incised; soot settled in the cut. The light: from above by day (the cut's LOWER wall lit), from below at night (its
  // UPPER wall lit — a lamp hidden on the cornice): the lit wall drawn first, the shadowed cut over it a hair toward the light
  const carve = mix(shade(stone, -0.62), [26, 20, 18], 0.55), lipC = mix(stone, [255, 244, 222], 0.28 * day);
  const base = D.v0 + (h - D.capY) / 2 + 0.005, sz = c => c / 0.72;
  x.save(); x.font = font(sz(D.capE) * 100); const wE = x.measureText(D.est).width / 100; x.font = font(sz(D.capY) * 100); const wY = x.measureText(D.year).width / 100; x.restore();
  const tw = wE + D.gap + wY, uE = cm - tw / 2 + wE / 2, uY = cm + tw / 2 - wY / 2, sqz = Math.min(1, (b - a - 0.5) / tw);
  const word = (s, u, cap, col, dv = 0) => text(x, s, cm + (u - cm) * sqz, base + dv, sz(cap), { fill: rgb(col), sq: sqz, font });
  const up = night > 0.5;                                   // (the light's side: from below at night)
  for (const [s, u, cap] of [[D.est, uE, D.capE], [D.year, uY, D.capY]]) {
    word(s, u, cap, up ? mix(stone, [255, 200, 140], 0.5) : lipC);
    word(s, u, cap, carve, up ? -0.03 : 0.03);
  }
  // at night: the soft wash from below (strongest at the stone's foot, gone two thirds of the way up) + the cornice lamp's warm line
  const lk = clamp01(M.T.lamps == null ? night : M.T.lamps) * clamp01((night - 0.3) / 0.5);
  if (lk > 0.01) {
    x.save(); x.globalCompositeOperation = 'lighter';
    const g = x.createLinearGradient(0, D.v0, 0, D.v0 + h * 0.9); g.addColorStop(0, rgb([255, 190, 128], 0.62 * lk)); g.addColorStop(0.35, rgb([255, 184, 122], 0.26 * lk)); g.addColorStop(0.7, rgb([255, 180, 120], 0.07 * lk)); g.addColorStop(1, rgb([255, 190, 130], 0));
    x.fillStyle = g; x.fillRect(a, D.v0, b - a, h);
    // (the hidden lamp itself: a warm line along the cornice's lip under the stone, its light spilling onto the joint)
    const gl = x.createLinearGradient(a, 0, b, 0); gl.addColorStop(0, rgb([255, 200, 140], 0)); gl.addColorStop(0.5, rgb([255, 214, 160], 0.7 * lk)); gl.addColorStop(1, rgb([255, 200, 140], 0));
    x.fillStyle = gl; x.fillRect(a - 0.2, D.v0 - 0.09, b - a + 0.4, 0.05);
    x.restore();
    // (the cuts stay in shadow — the wash lights the face, not the bottom of the letters)
    for (const [s, u, cap] of [[D.est, uE, D.capE], [D.year, uY, D.capY]]) word(s, u, cap, carve, -0.03);
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
  // POLISH 5 — SINGLE BIG PANES (the owner: "the whole point is to be able to see the scenes"): a slim frame round ONE clear pane — no
  // meeting rail; the deep reveal (the jamb's inner face, the head) + the sill keep it a real 1920s window, a faint sheen by day
  const g0 = gs + 0.05, g1 = b - 0.05, h0 = gb + 0.05, h1 = r1 - 0.06;
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
  // the frame's lit sill edge (POLISH 5 — SINGLE BIG PANES, the owner: no meeting rail — the deep reveal + the sill keep it a real 1920s window)
  R(x, gs, r1 - 0.02, b, r1, M.frameHi);
}

/** THE GROUND FLOOR: the barbershop (its window with the chair + the mirror wall + gold leaf, its door + the OPEN / CLOSED card),
 *  the pole's brackets, the unmarked side door, the basement window, the sconce */
// 9d — THE DOORS' LEAVES, shared: the bake paints them in place and doors.js paints the SAME leaf (+ the wall's light over it: paintLight,
// + the sconce's light on its upper planks) onto the swinging door — so the door that swings shut IS the baked door (the owner: "it
// still just kind of snaps at the end"; the live leaf was a plain amber-tinted board that turned into the detailed bake at the latch)
/** the sconce's lamp level on the side door (0..1) — the bake's own reading of the tones */
export const sideLampK = M => clamp01(M.T.lamps == null ? M.night : M.T.lamps) * clamp01((M.night - 0.3) / 0.5);
/** THE UNMARKED SIDE DOOR's leaf (wall units, v up; d = s.door): heavy oak planks, iron strap hinges, the grille (the peephole), a brass knob */
export function paintSideLeaf(x, M, d) {
  const oak = tri(M.T, [66, 40, 28], [80, 44, 30], [16, 11, 16]);
  R(x, d.u0, 0.12, d.u1, d.h, oak);
  x.fillStyle = rgb(shade(oak, -0.3)); for (let u = d.u0 + 0.25; u < d.u1; u += 0.25) x.fillRect(u, 0.12, 0.02, d.h - 0.12);
  x.fillStyle = rgb(shade(oak, 0.12)); for (let u = d.u0 + 0.05; u < d.u1; u += 0.25) x.fillRect(u, 0.12, 0.02, d.h - 0.12);   // (C4c: the bake's sill covers its foot to 0.27; the live leaf crops there)
  // (C4c: the strap hinges on the RIGHT — the door is hinged on the doorman's side + swings out: screens/harbor/doors.js)
  for (const v of [0.6, d.h - 0.55]) { R(x, d.u1 - 0.75, v, d.u1, v + 0.09, M.iron); x.fillStyle = rgb(M.iron); x.beginPath(); x.arc(d.u1 - 0.75, v + 0.045, 0.07, 0, Math.PI * 2); x.fill(); }
  const gu = (d.u0 + d.u1) / 2; R(x, gu - 0.2, 1.62, gu + 0.2, 1.98, M.iron); R(x, gu - 0.15, 1.67, gu + 0.15, 1.93, tri(M.T, [20, 16, 18], [24, 16, 18], [4, 4, 8]));
  x.fillStyle = rgb(M.iron); for (let u = gu - 0.1; u <= gu + 0.11; u += 0.1) x.fillRect(u - 0.015, 1.67, 0.03, 0.26);
  x.fillStyle = rgb(M.gilt); x.beginPath(); x.arc(d.u0 + 0.22, 1.18, 0.06, 0, Math.PI * 2); x.fill();   // (the knob on the free edge, the LEFT)
}
/** THE SHOP DOOR's leaf (wall units): the glazed wood door — the wood, the glass (the shop inside at night), the lower panel, the knob */
export function paintShopLeaf(x, M, sh) {
  const night = M.night > 0.5, [d0, d1, dh] = sh.door;
  R(x, d0, V.plinth - 0.05, d1, dh, M.wood);
  R(x, d0 + 0.12, 1.25, d1 - 0.12, dh - 0.12, night ? mix(M.inside, M.glassTop, 0.15) : mix(M.glassTop, M.inside, 0.45));
  R(x, d0 + 0.12, V.plinth + 0.1, d1 - 0.12, 1.1, shade(M.wood, -0.15));
  R(x, d1 - 0.2, 1.05, d1 - 0.13, 1.18, M.gilt);
}
export function paintGround(x, M, s, vp = null) {
  const night = M.night > 0.5, sd = M.sd, sh = s.shop;
  const [w0, w1, wv0, wv1] = sh.win, [d0, d1, dh] = sh.door;
  // the shopfront's surround: bottle-green painted wood, a gilt pinstripe, panelled stall-risers under the window
  const sf = mix(M.frame, [40, 70, 58], 0.3 * M.day);
  R(x, d0 - 0.18, V.plinth, w1 + 0.22, V.ground - 0.02, sf);
  R(x, d0 - 0.08, V.ground - 0.24, w1 + 0.12, V.ground - 0.2, M.gilt, 0.8);
  R(x, w0, V.plinth + 0.06, w1, wv0 - 0.06, mix(sf, M.frameHi, 0.25));
  for (let u = w0 + 0.1; u < w1 - 0.5; u += 1.05) { R(x, u, V.plinth + 0.12, u + 0.92, wv0 - 0.12, shade(sf, -0.2)); R(x, u + 0.04, V.plinth + 0.16, u + 0.88, wv0 - 0.16, mix(sf, M.frameHi, 0.4)); }
  // THE BIG WINDOW — inside (C4a): THE SHOP AS A ROOM (window-rooms.js#paintShopRoom: the box in the street's perspective, the tiled
  // floor, the MIRROR WALL at the back, the barber chair mid-room, the lamp with its shade) in the day's light; at night dark + closed
  // (the lit canvas lays the lamp's dim light over it: speakeasy.js#paintLit). No veil, no sheen baked: the glass's own reflection is
  // the live glass layer's (speakeasy.js#glassOver — in front of the barber, as glass is)
  x.save(); x.beginPath(); x.rect(w0, wv0, w1 - w0, wv1 - wv0); x.clip();
  { const G0 = shopGlass(sh.win); paintShopRoom(x, G0, boxOf(G0, vp), { T: M.T }); }
  R(x, w0, wv1 - 0.3, w1, wv1, [0, 0, 0], 0.3 * (M.day + M.gold) + 0.1);
  x.restore();
  // the window's frame: a bronze bar sash, mullion
  R(x, w0 - 0.07, wv0 - 0.07, w1 + 0.07, wv0, M.frameHi); R(x, w0 - 0.07, wv1, w1 + 0.07, wv1 + 0.07, M.frame);
  R(x, w0 - 0.07, wv0, w0, wv1, M.frame); R(x, w1, wv0, w1 + 0.07, wv1, M.frame);
  // THE SHOP DOOR: a glazed wood door, a transom, the card (OPEN by day, CLOSED at night)
  R(x, d0 - 0.1, V.plinth - 0.05, d1 + 0.1, dh + 0.5, sf);
  paintShopLeaf(x, M, sh);
  R(x, d0 + 0.08, dh + 0.08, d1 - 0.08, dh + 0.42, night ? M.inside : mix(M.glassTop, M.inside, 0.3));
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
    paintSideLeaf(x, M, d);
    // (C4c: the granite SILL up to the top step's tread, 0.27 — the door swings OUT over the steps now, so its leaf stands on the sill;
    // the live doorway + leaf stop at the same line: screens/harbor/doors.js DOORS.side.sill)
    R(x, d.u0 - 0.1, 0, d.u1 + 0.1, 0.27, shade(g, 0.1)); R(x, d.u0 - 0.1, 0.25, d.u1 + 0.1, 0.27, mix(g, [255, 250, 240], 0.12 * (1 - M.night))); }
  // THE BASEMENT WINDOW in the plinth: a dark opening, its iron bars (the amber glow inside is live: day + night)
  { const [b0, b1, bv0, bv1] = sh.basement;
    R(x, b0 - 0.06, bv0 - 0.04, b1 + 0.06, bv1 + 0.05, shade(M.stone, -0.3));
    const g = x.createLinearGradient(0, bv0, 0, bv1); g.addColorStop(0, 'rgb(64,30,12)'); g.addColorStop(1, 'rgb(28,14,10)'); x.fillStyle = g; x.fillRect(b0, bv0, b1 - b0, bv1 - bv0);
    x.fillStyle = rgb(M.iron); for (let u = b0 + 0.2; u < b1; u += 0.24) x.fillRect(u - 0.025, bv0, 0.05, bv1 - bv0); }
  // THE SCONCE over the side door (its bracket + lantern; lit at night: live)
  { const sc = sh.sconce; R(x, sc.u - 0.05, sc.v - 0.32, sc.u + 0.05, sc.v + 0.02, M.iron); R(x, sc.u - 0.14, sc.v - 0.05, sc.u + 0.14, sc.v + 0.32, M.iron); R(x, sc.u - 0.1, sc.v, sc.u + 0.1, sc.v + 0.26, night ? [60, 40, 26] : mix(M.glassTop, [255, 240, 200], 0.4)); R(x, sc.u - 0.17, sc.v + 0.32, sc.u + 0.17, sc.v + 0.38, M.iron); }
  // FP2's SCONCE LANDING (an additive scallop + glints baked over the brick, the granite + the oak) is gone — 9d: THE DOOR's LIGHT is
  // real light now, live (speakeasy.js#doorLight: a mask that MULTIPLIES what it reaches); only the iron cap's soot over it stays
  { const lk = sideLampK(M);
    if (lk > 0.01) { const sc = sh.sconce;
      R(x, sc.u - 0.2, sc.v + 0.38, sc.u + 0.2, sc.v + 0.5, M.soot, 0.25 * lk); } }
}

// (C4b — THE GOLD LEAF OFF THE GLASS, the owner, Oct 28 10:41 pm — DECIDED: "HARBOR BARBERS" removed in every state; the barber pole says
// barbershop. paintGilt + GILT gone; the glass keeps only its faint reflection: speakeasy.js#glassOver)

// ------------------------------------------------------------------ 7b — THE WALL-WASHERS (the owner: "something's missing" at night)
/** small warm lamps under the capitals, aimed DOWN, GRAZING the brick PIERS between the windows (never the windows): from dusk all
 *  night. SP2 (the owner: the lit piers read as more ARCHED WINDOWS — tall, evenly bright, a hard rounded top): ACCENTS, not panels —
 *  a hot spot just under each VISIBLE fixture, fanning DOWN in a soft V and gone within the top third of the pier (drop units); no
 *  outline anywhere (the cone's edges + its foot fade per pixel); dimmer. The pier's own bricks re-laid in their LIT colour (the same
 *  tile seed: the courses line up), so the brick's texture shows through the light. washCone(): the light at (du across from the
 *  pier's middle, d down from the lamp) — PURE, tested. piers: the front's brick piers [u0, u1] (the edge one is off screen) */
export const WASH = Object.freeze({ piers: SPEAK_PIERS.slice(1).map(p => [...p]), lampV: 9.13, brick: [196, 112, 74], a: 0.6, drop: 1.75, w0: 0.1, spread: 0.42, hot: 0.3 });
export function washCone(du, d) {
  const W = WASH;
  if (d <= 0 || d >= W.drop) return 0;
  const hw = W.w0 + d * W.spread, xn = Math.abs(du) / hw;
  if (xn >= 1) return 0;
  const side = 1 - smooth(0.45, 1, xn), on = smooth(0, 0.07, d), fall = (0.3 + 0.7 * Math.exp(-d / W.hot)) * (1 - smooth(0.45 * W.drop, W.drop, d));
  return on * side * fall;
}
export const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
export function paintWashers(x, M, lk, tile, piers = WASH.piers) {
  const m = x.getTransform(), top = WASH.lampV - 0.05, foot = top - WASH.drop;
  for (const [a0, b0] of piers) {
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
export function paintWasherLamps(x, M, lk, piers = WASH.piers) {
  for (const [a0, b0] of piers) {
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
      paintFrontDeco(x, M, { ...st.P, pat });
      const lk = clamp01(M.T.lamps == null ? M.night : M.T.lamps) * clamp01((M.night - 0.3) / 0.5);
      // (WIN2: the corner pier's washer — its cone + its fixture — is gone while the lobby's hush sign is lit there: ctx.hushLit)
      const piers = ctx.hushLit ? WASH.piers.slice(0, -1) : WASH.piers;
      if (lk > 0.01) paintWashers(x, M, lk, brickTile(WASH.brick, course(dpr), blen(dpr), 9, false), piers);
      paintWasherLamps(x, M, lk, piers);
      x.restore();
    },
    // the upper windows (by day: the sky in the glass, shades at their heights, curtains, the plant)
    x => {
      x.save(); frontMap(x);
      const r = rngFrom(23), curtains = [tri(T, [140, 40, 44], [150, 50, 44], [20, 10, 18]), tri(T, [70, 92, 58], [90, 80, 50], [12, 14, 16]), tri(T, [196, 168, 110], [200, 150, 100], [26, 22, 30])];
      ROOMS.forEach(rm => {
        const [a, b] = s.windows[rm.col], [r0, r1] = s.rows[rm.floor - 2];
        // (SP4 — the owner: the panes rendered NON-UNIFORM by day — the apartment's + the edge windows' day curtains covered 0.2 units of
        // glass each side and read as frame: the upper-right pane ~22 % narrower than its neighbour. No day curtains: every pane the
        // same glass; the night rooms keep their own tied-back curtains inside the room's paint)
        const o = { blind: rm.clear ? 0.12 : 0.25 + r() * 0.45, curtain: null, plant: rm.id === 'edge2' };
        void curtains;
        paintWindow(x, M, a, b, r0, r1, o);
      });
      x.restore();
    },
    // the ground floor: the barbershop, the side door, the basement window, the sconce
    x => { x.save(); frontMap(x); paintGround(x, M, s, wallVP(...G.front(0, 0), G.K, G.cam.VPX, G.cam.VPY)); x.restore(); },
    // the light + the weather (POL4: the ivy removed — the owner)
    x => { x.save(); frontMap(x); paintLight(x, M, 0, W_FRONT, false, 51); x.restore(); },
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
      // (PROM — the owner's "B", Oct 28: the awning's three little lamps — their fixtures + their baked light on the canvas, the shopfront
      // + the pavement — are gone: the awning is lit from UNDERNEATH, live, by a hidden strip on its own hours: speakeasy.js#awningUnder)
      // the side door's two worn granite steps (a dip worn in the middle)
      const d = s.door;
      box(x, cam, { x0: s.x0 + d.u0 - 0.3, x1: s.x0 + d.u1 + 0.3, z0: s.z0 - 0.75, z1: s.z0, h: 0.13 }, shade(M.stone, 0.05), { light: 1, sideK: 0.12 });
      box(x, cam, { x0: s.x0 + d.u0 - 0.15, x1: s.x0 + d.u1 + 0.15, z0: s.z0 - 0.4, z1: s.z0, h: 0.13 }, shade(M.stone, 0.12), { y0: 0.13, light: 1, sideK: 0.12 });
      { const [a, y] = project(cam, s.x0 + (d.u0 + d.u1) / 2, 0.26, s.z0 - 0.2), w = 0.5 * cam.F / s.z0; x.fillStyle = rgb(M.soot, 0.25); x.beginPath(); x.ellipse(a, y, w, w * 0.12, 0, 0, Math.PI * 2); x.fill(); }
      // (SP2: the café canopy's posts stand on the roof deck, set back — drawn live with the lights: strings.js)
    },
  ];
}
