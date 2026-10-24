// CITY 2.0 — THE HARBOR: THE LIGHT ON THE PROMENADE, PURE (FP3a, FREV A1 H2 — "the one seam that did not hold is LIGHTING": four
// lamp models for the same lamps lived in stage.js, props.js, trees.js and roadlight.js, and props.js ↔ stage.js imported each other).
// ONE place now for every lamp's light and the sun's shadow; each consumer reads its own PROFILE of the same lamps (the numbers each
// one had — FP3a moved them, it changed no look: pixdiff night / noon / party = the noise floor). 8b's raid, Part 9's wet reflections
// and 6b's sky director plug in here.
//   pieceCtx(L)                     what every piece's art gets: the season, the lamps, Part 9's hooks
//   lightSources(L) / lightField(L, T)   the POOLS on the ground at night (stage.js bakes them; the people read them)
//   sunShadow(T, h)                 the sun's shadow for something h tall (the lamps, the trees, the props, the people, the car)
//   lampOn(lights, x, z, lampK)     the nearest lamp's light on a FACE (props.js#lightFor: its colour, strength, direction)
//   treeLamps(ctx, t)               the lamps near a tree as local lights (trees.js#rigOf)
//   roadLampAt(lamps, x)            the front walk's lamps on a passing car (roadlight.js)
import { PIECE } from './harbor-promenade.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const norm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

/** what every piece's art gets (trees.js, props.js, centre.js): the season + how far into it, the lamps (their light at night: lampK =
 *  the lamps' ramp baked), Part 9's hooks (snow on the ground + branches, a wet sheen) */
export const pieceCtx = L => ({ season: L.season || 'autumn', phase: L.seasonPhase ?? 0.5, lights: L.lamps.map(l => ({ x: l.x, z: l.z, kind: l.kind })), lampK: L.lampK || 0, snow: L.snow || 0, wet: L.wet || 0 });

// ------------------------------------------------------------------ THE POOLS (the ground at night)
// the lamps' light per unit of T.lamps: the tall street lamps a clean cool white, the globes warm, the speakeasy's spill amber
// FP — THE NIGHT LIGHT PLAN (the re-layout): cool pools under the two tall curb lamps (the back row, the road's edge, the bench), warm
// pools from the two corner globes across the front of the open floor, the speakeasy's warm spill in front of it, the cart's
// string-light glow round the cart, the medallion where they overlap; dim (never black) between, no haze
// (FP2 — CRISP LIGHTS: the barber pole's cool LED light LANDS on the cobbles at its foot — a small cool pool, baked like the rest)
export const LIGHT = Object.freeze({ tall: [150, 162, 184], globe: [236, 166, 88], spill: [196, 120, 54], cart: [226, 150, 70], pole: [140, 158, 200] });
// PF — THE LAMPS RE-THOUGHT (the final layout: the tall pair flanking the crossing, the globes at the front corners): wider pools so
// the promenade reads EVERYWHERE people will walk, wait or line up (the bench, the inlay between the flanking lamps — ~0.55 of a
// lamp's heart on its ring, the door's approach, the lobby line along the shopfront toward the bottom-left corner), dim (never black)
// between; the tall pair a touch lower each (TALL_K) where their pools overlap on the curb. (tall 10.5 → 13.5, globe 7.6 → 9.5, the
// speakeasy's spill 4.2 → 5.2 — the shopfront's line). Room left for 8b / holiday lights: the centre's rig.
export const REACH = Object.freeze({ tall: 13.5, globe: 9.5, spill: 5.2, cart: 6, pole: 2.6 });
export const TALL_K = 0.85;

/** the speakeasy's warm spill on the cobbles: its side door's sconce, the shop's one dim lamp through the big window (+ FP2: the
 *  barber pole's small cool pool) */
function speakSpill(L) {
  const s = L.speakeasy, z = s.z0 - 1.3;
  return [{ x: s.x0 + (s.door.u0 + s.door.u1) / 2, z, kind: 'spill', k: 0.95 }, { x: s.x0 + (s.shop.win[0] + s.shop.win[1]) / 2, z, kind: 'spill', k: 0.5 },
    ...(s.shop && s.shop.pole ? [{ x: s.x0 + s.shop.pole.u, z: s.z0 - 0.8, kind: 'pole', k: 0.6 }] : [])];
}
/** every light that pools on the ground: the lamps, the speakeasy's spill, the cart */
export const lightSources = L => [...L.lamps.map(l => ({ x: l.x, z: l.z - (l.kind === 'tall' ? 0.9 : 0.3), kind: l.kind, k: l.kind === 'tall' ? TALL_K : 1 })), ...speakSpill(L), ...(L.cart && L.cart.shown !== false ? [{ x: L.cart.x, z: L.cart.z - 0.4, kind: 'cart', k: 0.62 }] : [])];
/** the light on the ground at (x, z) at night — every lamp's pool (overlapping: every path lit, the shadows between dim) + the
 *  speakeasy's spill; null by day (T.lamps 0) */
export function lightField(L, T) {
  const k = T.lamps || 0;
  if (k < 0.01) return null;
  const src = lightSources(L);
  return (x, z) => {
    let r = 0, g = 0, b = 0;
    for (const s of src) {
      const R = REACH[s.kind], dx = x - s.x, dz = (z - s.z) * 1.15, d2 = (dx * dx + dz * dz) / (R * R);
      if (d2 >= 1) continue;
      const f = (1 - d2) * (1 - d2) * s.k, c = LIGHT[s.kind];
      r += c[0] * f; g += c[1] * f; b += c[2] * f;
    }
    return r + g + b > 0.5 ? [r * k, g * k, b * k] : null;
  };
}

// ------------------------------------------------------------------ THE SUN'S SHADOW
/** the sun's shadow on the ground for something h units tall: { dx, dz, a } (world units; a = its darkness) or null (night,
 *  overcast). The camera looks north across the harbor: a morning sun on the left throws shadows right, and away from us. */
export function sunShadow(T, h) {
  const day = (T.day || 0) + (T.gold || 0);
  if (day < 0.15 || (T.ovc || 0) >= 0.5) return null;
  const el = Math.max(6, T.sunEl || 30), len = Math.min(3.2, 1 / Math.tan(el * Math.PI / 180)) * h, sd = T.sunDir || 0;
  return { dx: -sd * len * 0.9, dz: len * (0.35 + 0.4 * (1 - Math.abs(sd))), a: 0.3 * Math.min(1, day) * (1 - 0.6 * (T.ovc || 0)) };
}

// ------------------------------------------------------------------ THE FACES (a prop's side turned toward a lamp)
// the lamps' colours on a face (LIGHT, brighter: on a face, not a pool) + how far their light carries onto a prop + the light's height
export const FACE = Object.freeze({ col: { tall: [196, 212, 236], globe: [255, 190, 118] }, reach: { tall: 14, globe: 12 }, y: { tall: 5.8, globe: 3.9 } });
/** the NEAREST lamp's light on a face at (wx, wz): { lk (strength × lampK), lcol, ld (the unit direction toward it) } */
export function lampOn(lights, wx, wz, lampK) {
  let best = null, bd = 1e9;
  for (const l of lights || []) { const d = Math.hypot(l.x - wx, (l.z - wz) * 1.1); if (d < bd) { bd = d; best = l; } }
  const kind = best && best.kind === 'tall' ? 'tall' : 'globe';
  const lk = best ? lampK * Math.min(1, 1.35 * Math.pow(clamp01(1 - bd / FACE.reach[kind]), 1.1)) : 0;
  const ld = best ? norm([best.x - wx, FACE.y[kind] - 1, best.z - wz]) : [0, 1, 0];
  return { lk, lcol: FACE.col[kind], ld };
}

// ------------------------------------------------------------------ THE TREES (lamps as local lights round a crown)
// (PF: a tall lamp 0.8 → 0.58 — the crabapple stands right beside the left flanking lamp: its crown's side went one flat orange)
export const TREE_LAMP = Object.freeze({ tall: { col: [0.84, 0.95, 1.2], k: 0.58 }, globe: { col: [1.35, 0.86, 0.46], k: 1.15 } });
/** the lamps within reach of tree t, in its local frame: [{ x, y, w (toward us), col, k }] (a tall lamp = its two heads) */
export function treeLamps(ctx, t) {
  const out = [];
  for (const l of ctx.lights || []) {
    if (Math.abs(l.x - t.x) > 10 || Math.abs(l.z - t.z) > 14) continue;
    const tall = l.kind === 'tall', w = -(l.z - t.z), P = tall ? TREE_LAMP.tall : TREE_LAMP.globe;
    if (tall) for (const s of [-1, 1]) out.push({ x: l.x - t.x + s * PIECE.tall.arm, y: PIECE.tall.h - 0.45, w, col: P.col, k: P.k });
    else out.push({ x: l.x - t.x, y: PIECE.globe.h + 0.18, w, col: P.col, k: P.k });
  }
  return out;
}

// ------------------------------------------------------------------ THE ROAD (a passing car under the front walk's lamps)
export const ROAD_LAMP = Object.freeze({ reach: 7, zMax: 40 });
/** the front walk's lamps on a car at world x (0..1) */
export function roadLampAt(lamps, x) {
  let k = 0;
  for (const l of lamps) { if (l.z > ROAD_LAMP.zMax) continue; const d = (x - l.x) / ROAD_LAMP.reach; if (d * d < 1) k += (1 - d * d) ** 2; }
  return Math.min(1, k);
}
