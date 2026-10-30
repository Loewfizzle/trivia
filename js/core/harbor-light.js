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
//   impliedAt / castShadow          PROM — THE IMPLIED LAMPS (no lampposts: a row behind the viewer, below the screen) — their light on
//                                   the ground + the shadows they throw UP the screen at night
import { PIECE } from './harbor-promenade.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const norm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };

// ------------------------------------------------------------------ NIGHT-A — THE NIGHT LIGHT, NEW (`&light=new|old` + the panel's row)
// The owner, Oct 29 ("THE NIGHT LIGHTING REWORK — DECIDED"): (1) an even BASE night level over the whole promenade + the street under
// the dock — dim, cool, the city's glow: the cobbles + every walker always readable; (2) the implied lamps behind the viewer are a
// DIRECTION, not lamp positions — ONE broad, soft, warm WASH across the full width, warmest at the screen's foot, fading toward the
// railing: NO pools anywhere (the street under the dock showed the six lamps as spotlight patches: sx 1.2 + 0.09 dz, 9 u apart); (3) only
// TWO places stand out, each with a visible source — the shopfront (the awning + the door's lamp: the speakeasy's spill) + the cab
// stand (its lamp); the POL4 lamp behind the blade + the hydrant corner's lamp fold into the wash; (4) people lit by it — their fronts
// (facing us) catch it, a soft long faint shadow UP the screen (never a hard blob); (6) the blackout takes it all down. One switch for
// every painter (the stage's bake, the street, the people, the props, the trees, the road's cars, the snow, the wildlife, the holiday
// pieces); the scene sets it (scene.js#lightModeNow) and re-bakes on a change. OLD = the light before NIGHT-A, unchanged (A/B only).
export const LIGHT_MODES = Object.freeze(['old', 'new']);
// NIGHT-A2 (the owner, Oct 29 7:13 pm: "I like it, switch it over"): NEW is the default; OLD stays a TOOLS row + &light=old (A/B)
export const LIGHT_DEFAULT = 'new';
let MODE = LIGHT_DEFAULT;
export const lightMode = () => MODE;
/** → true when it changed (the caller re-bakes) */
export function setLightMode(m) { const v = m === 'new' ? 'new' : 'old'; if (v === MODE) return false; MODE = v; return true; }
const NEW = () => MODE === 'new';
// base: the cool city glow (a constant × the lamps' ramp — the city's power: the blackout takes it down with the rest); wash: the
// implied lamps' warm light, its strength by DEPTH only (z0: the screen's foot on every phone ≈ 23–24 u; `fall`: half-strength ~15 u
// in — the curb ≈ 0.6, the compass ≈ 0.4, the railing ≈ 0.2); shadow: the wash's direction (from a far light behind the viewer at
// z = LAMP_Z − back, x pulled toward the middle by `fan` + `side` u to the right: ONE direction for the whole promenade, the shadows
// leaning a little left — straight up they hid behind the figure's own body), long (a lamp ~48 u behind + 5.6 up throws a figure's
// shadow far further; it fades out along its length) + faint; lift: the figures' cloth lit by it
// (× folk.js's 0.1 — mostly silhouette before; facing us, every visible side faces the wash)
export const NIGHT_LIGHT = Object.freeze({ base: [13, 17, 32], wash: [242, 158, 76], washK: 0.95, z0: 24, fall: 15, lampZ: 21.5, lampY: 5.6,
  shadow: { len: 3.4, a: 0.36, back: 30, fan: 0.4, side: 7 }, lift: 2.6, keep: 0.42, treeShadow: { throw: 0.34, a: 2, cap: 0.55, blur: 0.12 }, face: 0.8, tree: { k: 0.55, fall: 24 }, road: 0.7 });
/** the wash's strength at depth z (0..washK) — the same at every x */
export function washAt(z) {
  const d = z - NIGHT_LIGHT.z0, w = NIGHT_LIGHT.washK * (d <= 0 ? 1 : 1 / (1 + (d / NIGHT_LIGHT.fall) ** 2));
  return STAGE_ON && z < STAGE.curb[1] ? stageWash(z) : w;
}
// ------------------------------------------------------------------ NIGHT-B — THE STAGE LIGHT (`&stage=1|0` + the panel's row — OFF by default
// until the owner picks; the owner, Oct 29 9:38–9:43 pm — "THE DARKER STREET + THE PARTY DIM", DECIDED): the implied lamps light the PROMENADE
// (aimed at the walkway) — it stays lit like a stage; the FOREGROUND STREET (below the curb, under the dock) falls softly into shadow: ~⅓
// darker than the promenade's front at the curb's foot (base + wash), a little more toward the screen's foot — NEVER black (the base stays:
// still clearly a street; a wet night keeps its reflections), NO hard line at the curb (a smooth falloff across it, curb[0] → curb[1]); the
// neon stays the brightest thing. Every painter reads washAt — the stage's bake, the people's fronts, the props, the trees, the road's cars.
// THE PARTY DIM (scene.js#partyDim — a cheap overlay, never a re-bake): once the party warms up the wash eases down + the street a step darker
// again (STAGE.party), back up as it thins — the neon, the beat, the wands + the street's dancers pop.
// (tuned on the real screen, 402×660: street 0.6 / foot 0.5 read HALF the promenade's front — too dark; at 1.0 / 0.88 the front's wash goes on
// across the curb instead of rising toward the screen's foot, falling a little toward the viewer: with the street's darker setts the street
// reads ~⅓ darker (luma 0.62–0.64 of the promenade's front; × 0.71 against today's light — e2e streetparty), never black)
export const STAGE = Object.freeze({ curb: Object.freeze([34.2, 37.4]), street: 1.0, foot: 0.88, party: Object.freeze({ wash: 0.12, street: 0.16 }) });
let STAGE_ON = false;
export const stageMode = () => STAGE_ON;
/** → true when it changed (the caller re-bakes) */
export function setStageMode(on) { const v = !!on; if (v === STAGE_ON) return false; STAGE_ON = v; return true; }
function stageWash(z) {
  const [c0, c1] = STAGE.curb, d1 = c1 - NIGHT_LIGHT.z0, wP = NIGHT_LIGHT.washK / (1 + (d1 / NIGHT_LIGHT.fall) ** 2);
  if (z >= c0) { const u = clamp01((z - c0) / (c1 - c0)), e = u * u * (3 - 2 * u); return wP * (STAGE.street + (1 - STAGE.street) * e); }
  const u = clamp01((c0 - z) / (c0 - NIGHT_LIGHT.z0)); return wP * (STAGE.street + (STAGE.foot - STAGE.street) * u);
}

/** what every piece's art gets (trees.js, props.js, centre.js): the season + how far into it, the lamps (their light at night: lampK =
 *  the lamps' ramp baked), Part 9's hooks (snow on the ground + branches, a wet sheen) */
export const pieceCtx = L => ({ season: L.season || 'autumn', phase: L.seasonPhase ?? 0.5, lights: [...L.lamps.map(l => ({ x: l.x, z: l.z, kind: l.kind, h: l.h })), ...hiddenLamps(L)], lampK: L.lampK || 0, snow: L.snow || 0, snowBranch: L.snowBranch ?? L.snow ?? 0, snowCol: L.snowCol || null, wet: L.wet || 0 });

// POL4 — THE HIDDEN LAMP (the owner: at night the tree just left of the crossing — behind the blade sign — and the bench under it were the
// darkest spot on the promenade): a street lamp standing just BEHIND the speakeasy's corner + the blade sign, never drawn (on every
// upright phone its head + post sit behind the blade: 390 / 402 / 430 checked in node), its warm light falling from the LEFT onto the
// crabapple's side + crown and the bench's top, fading off naturally to the right. HIDDEN: where it stands from the crabapple (world
// units: dx left, dz behind), its height; its light is baked like every lamp's (the pools, the trees' rig, the props' faces).
export const HIDDEN = Object.freeze({ dx: -3.2, dz: 1.5, h: 4.0, k: 1 });
export function hiddenLamps(L) {
  const t = (L.trees || []).find(o => o.kind === 'crab'), cab = cabLamp(L), cor = cornerLamp(L);
  if (NEW()) return cab ? [cab] : [];   // (NIGHT-A: the blade's hidden lamp + the hydrant corner's fold into the wash)
  return [...(t ? [{ x: t.x + HIDDEN.dx, z: t.z + HIDDEN.dz, h: HIDDEN.h, kind: 'hidden', k: HIDDEN.k, pool: { dx: 1.6, dz: -0.8, k: 0.5 } }] : []), ...(cab ? [cab] : []), ...(cor ? [cor] : [])];
}
// C4b — THE CAB STAND's OWN LAMP (the owner, Oct 28 10:03 + 10:37 pm — DECIDED): the cab-stand bench in front of the framing maple
// blocks the light that lit it → one more lamp nobody sees, just OFF-SCREEN RIGHT at the front curb, high (on every upright phone ~2
// units past the right edge): a streetlamp's soft warm SPILL from above-right — never a spotlight (no edge, no cone). It lights the
// maple's LOWER-RIGHT crown (the leaf clusters nearest it catch it one by one, brightest nearest the lamp, falling off up + left into
// the crown's shade — trees.js's per-leaf light, `tree`), its trunk, the bench's seat + its waiters (props / people: lampOn's hidden
// light, the pool), a soft pool on the cobbles; the bench's + the waiters' shadows fall LEFT (lampShadow: within `shadowR`). Kind
// 'hidden' like POL4's: baked with the lamps' ramp, so its hours + the blackout are the implied lamps'. dx / dz from the cab bench.
const CAB_LAMP = Object.freeze({ dx: 4.0, dz: -1.3, h: 4.8, k: 0.9, pool: { dx: -3.1, dz: 1.2, k: 0.42 }, shadowR: 7.5 });
// C4c — THE HYDRANT CORNER's LAMP (the owner, Oct 29 7:47 am: "you can't even tell it's a hydrant" — the bottom-left corner the darkest
// spot of the promenade, its holiday pieces unread): the cab stand's twin on the LEFT — a lamp nobody sees ~3 u past the left edge at the
// front curb, a little dimmer (k 0.7 vs 0.9: never brighter than the shopfront), its soft spill on the hydrant + the pieces beside it,
// a pool on the cobbles, the shadows falling RIGHT. Kind 'hidden': baked with the lamps' ramp — their hours + the blackout. dx / dz from the hydrant.
export const CORNER_LAMP = Object.freeze({ dx: -3.4, dz: -1.2, h: 4.8, k: 0.7, pool: { dx: 2.9, dz: 1.3, k: 0.27 }, shadowR: 6.5 });
export function cornerLamp(L) {
  const h = L.hydrant;
  return h ? { x: h.x + CORNER_LAMP.dx, z: h.z + CORNER_LAMP.dz, h: CORNER_LAMP.h, kind: 'hidden', corner: true, k: CORNER_LAMP.k, pool: CORNER_LAMP.pool } : null;
}
export function cabLamp(L) {
  const c = L.cabStand;
  return c ? { x: c.x + CAB_LAMP.dx, z: c.z + CAB_LAMP.dz, h: CAB_LAMP.h, kind: 'hidden', cab: true, k: CAB_LAMP.k, pool: CAB_LAMP.pool } : null;
}

// ------------------------------------------------------------------ THE POOLS (the ground at night)
// the lamps' light per unit of T.lamps: the tall street lamps a clean cool white, the globes warm, the speakeasy's spill amber
// FP — THE NIGHT LIGHT PLAN (the re-layout): cool pools under the two tall curb lamps (the back row, the road's edge, the bench), warm
// pools from the two corner globes across the front of the open floor, the speakeasy's warm spill in front of it, the cart's
// string-light glow round the cart, the medallion where they overlap; dim (never black) between, no haze
// (FP2 — CRISP LIGHTS: the barber pole's cool LED light LANDS on the cobbles at its foot — a small cool pool, baked like the rest)
export const LIGHT = Object.freeze({ tall: [150, 162, 184], globe: [236, 166, 88], spill: [196, 120, 54], cart: [226, 150, 70], pole: [140, 158, 200], hidden: [226, 156, 84], implied: [228, 164, 96] });
// PF — THE LAMPS RE-THOUGHT (the final layout: the tall pair flanking the crossing, the globes at the front corners): wider pools so
// the promenade reads EVERYWHERE people will walk, wait or line up (the bench, the inlay between the flanking lamps — ~0.55 of a
// lamp's heart on its ring, the door's approach, the lobby line along the shopfront toward the bottom-left corner), dim (never black)
// between; the tall pair a touch lower each (TALL_K) where their pools overlap on the curb. (tall 10.5 → 13.5, globe 7.6 → 9.5, the
// speakeasy's spill 4.2 → 5.2 — the shopfront's line). Room left for 8b / holiday lights: the centre's rig.
export const REACH = Object.freeze({ tall: 13.5, globe: 9.5, spill: 5.2, cart: 6, pole: 2.6, hidden: 7.5, implied: 17 });

// PROM — THE IMPLIED LAMPS (the owner, Oct 28 — LOCKED: "no lampposts"): street lamps on OUR side of the front street, below the screen
// (core/harbor-promenade.js#IMPLIED), never drawn. Their light on the ground at (x, z) for a lamp s: a cone fanning out from the lamp —
// across, a gaussian `sx0 + sxK × dz` wide (distinct POOLS on the street under the dock, merging into one warm wash up the promenade);
// along, falling off with the distance (`near` + `fall`: brightest on the street + at the front curb, the back half toward the railing
// a soft dim — the skyline + its reflection carry the back). k: the strength against a globe's heart. ELL: the ground ellipse that holds
// a lamp's light (the baked low glow in the joints + the dusk's dimming: stage.js)
export const IMPLIED_LIGHT = Object.freeze({ sx0: 1.2, sxK: 0.09, near: 8, fall: 6.5, k: 1.5, ell: { dz: 13, rz: 15, rx: 10 } });
export function impliedAt(s, x, z) {
  const dz = z - s.z;
  if (dz <= 0.4) return 0;
  const I = IMPLIED_LIGHT, sx = I.sx0 + I.sxK * dz, dx = x - s.x, ramp = dz < 2.4 ? dz / 2.4 : 1;
  return ramp * Math.exp(-(dx * dx) / (2 * sx * sx)) / (1 + ((dz - I.near) / I.fall) ** 2) * I.k * (s.k ?? 1);
}

/** the speakeasy's warm spill on the cobbles: its side door's sconce, the shop's one dim lamp through the big window (+ FP2: the
 *  barber pole's small cool pool) */
function speakSpill(L) {
  // (NIGHT-A: the new light's wash adds under the spill — trimmed to keep the shopfront where it was, below the windows: THE LADDER)
  const s = L.speakeasy, z = s.z0 - 1.3, sk = NEW() ? 0.8 : 1;
  return [{ x: s.x0 + (s.door.u0 + s.door.u1) / 2, z, kind: 'spill', k: 0.95 * sk }, { x: s.x0 + (s.shop.win[0] + s.shop.win[1]) / 2, z, kind: 'spill', k: 0.5 * sk },
    ...(s.shop && s.shop.pole ? [{ x: s.x0 + s.shop.pole.u, z: s.z0 - 0.8, kind: 'pole', k: 0.6 }] : [])];
}
/** every light that pools on the ground: the lamps, the speakeasy's spill, the cart */
export const lightSources = L => [...(NEW() ? [] : L.lamps).map(l => ({ x: l.x, z: l.z, kind: 'implied', k: 1, implied: true })), ...speakSpill(L), ...(L.cart && L.cart.shown !== false && !L.cart.live ? [{ x: L.cart.x, z: L.cart.z - 0.4, kind: 'cart', k: 0.62 }] : []), ...hiddenLamps(L).map(h => ({ x: h.x + h.pool.dx, z: h.z + h.pool.dz, kind: 'hidden', k: h.pool.k }))];   // (FP3b: the live cart lays its own pool — people.js; POL4: the hidden lamp's pool, its heart a little toward the tree — the lamp itself is behind the blade, its light falls forward + right)
/** the light on the ground at (x, z) at night — every lamp's pool (overlapping: every path lit, the shadows between dim) + the
 *  speakeasy's spill; null by day (T.lamps 0) */
export function lightField(L, T) {
  const k = T.lamps || 0;
  if (k < 0.01) return null;
  const src = lightSources(L), nw = NEW(), B = NIGHT_LIGHT.base, C = NIGHT_LIGHT.wash;
  return (x, z) => {
    let r = 0, g = 0, b = 0;
    if (nw) { const w = washAt(z); r = B[0] + C[0] * w; g = B[1] + C[1] * w; b = B[2] + C[2] * w; }   // (NIGHT-A: the base + the wash, no pools)
    for (const s of src) {
      if (s.implied) { const f = impliedAt(s, x, z); if (f > 0.002) { const c = LIGHT.implied; r += c[0] * f; g += c[1] * f; b += c[2] * f; } continue; }
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
/** PROM — THE IMPLIED LAMPS' SHADOW at night for something h tall standing at (x, z): thrown AWAY from the lamps behind the viewer — UP
 *  the screen, fanning a little sideways from the nearest lamp — { dx, dz, a } (world units) or null by day / with the lamps off.
 *  lamps: L.lamps; k: the lamps' ramp now (× the power). LEN: its length per unit of height (moderate — a long shadow reads, a 14-unit
 *  one would cross the whole promenade) */
const LAMP_SHADOW = Object.freeze({ len: 0.95, a: 0.42 });
export function lampShadow(lamps, h, x, z, k) {
  if (!(k > 0.05) || x == null || z == null) return null;
  if (NEW()) {
    // (NIGHT-A: the wash's shadow — away from a far light behind the viewer, a slight fan outward; long, faint, fainter up the promenade
    // where the wash is weaker. Beside the cab stand its own lamp throws it (LEFT, C4b's) — the lamp you can see the light of)
    const S = NIGHT_LIGHT.shadow, cab = (lamps || []).find(l => l.cab && Math.hypot(l.x - x, l.z - z) < CAB_LAMP.shadowR);
    const sx = cab ? cab.x : x * S.fan + S.side, sz = cab ? cab.z : NIGHT_LIGHT.lampZ - S.back, d = Math.hypot(x - sx, z - sz) || 1;
    const len = S.len * h * (cab ? 0.75 : 1), a = S.a * Math.min(1, k) * (cab ? 0.9 : 0.55 + 0.45 * washAt(z) / NIGHT_LIGHT.washK);
    return { dx: (x - sx) / d * len, dz: (z - sz) / d * len, a, soft: true };
  }
  let best = null, bd = 1e9;
  for (const l of lamps || []) { if (!l.implied && l.kind !== 'implied' && !l.cab && !l.corner) continue; const d = Math.hypot(l.x - x, l.z - z); if ((l.cab && d > CAB_LAMP.shadowR) || (l.corner && d > CORNER_LAMP.shadowR)) continue; if (d < bd) { bd = d; best = l; } }   // (C4b: the cab stand's lamp near it — the bench's shadow falls LEFT)
  if (!best) return null;
  const ux = (x - best.x) / bd, uz = (z - best.z) / bd, len = LAMP_SHADOW.len * h * (0.8 + 0.4 * Math.min(1, bd / 26));
  return { dx: ux * len, dz: uz * len, a: LAMP_SHADOW.a * Math.min(1, k) * (1 - 0.45 * Math.min(1, Math.max(0, (bd - 16) / 18))) };
}
/** the shadow on the ground for something h tall at (x, z): the sun's by day, the implied lamps' at night (whichever is stronger) */
export function castShadow(T, h, x, z, lamps, k = null) {
  const sun = sunShadow(T, h), lk = k != null ? k : (T.lamps || 0) * Math.min(1, (T.night || 0) * 1.4);
  const lmp = lampShadow(lamps, h, x, z, lk);
  if (!lmp) return sun;
  if (!sun) return lmp;
  return sun.a >= lmp.a ? sun : lmp;
}

// ------------------------------------------------------------------ THE FACES (a prop's side turned toward a lamp)
// the lamps' colours on a face (LIGHT, brighter: on a face, not a pool) + how far their light carries onto a prop + the light's height
export const FACE = Object.freeze({ col: { tall: [196, 212, 236], globe: [255, 190, 118], hidden: [255, 184, 108], implied: [255, 194, 128] }, reach: { tall: 14, globe: 12, hidden: 9, implied: 36 }, y: { tall: 5.8, globe: 3.9, hidden: 4.0, implied: 5.6 } });
/** the NEAREST lamp's light on a face at (wx, wz): { lk (strength × lampK), lcol, ld (the unit direction toward it) } */
export function lampOn(lights, wx, wz, lampK) {
  if (NEW()) {
    // (NIGHT-A: the wash on a face — from the front + a little above (the implied lamps' heads behind the viewer), its strength by depth;
    // the cab stand's lamp blended in near it, as before)
    let lk = lampK * Math.min(1, NIGHT_LIGHT.face * washAt(wz) / NIGHT_LIGHT.washK + 0.12), lcol = FACE.col.implied;
    let ld = norm([-wx * 0.3, NIGHT_LIGHT.lampY - 1, (NIGHT_LIGHT.lampZ - NIGHT_LIGHT.shadow.back) - wz]);
    for (const h of lights || []) {
      if (h.kind !== 'hidden') continue;
      const d = Math.hypot(h.x - wx, (h.z - wz) * 1.1), hk = lampK * (h.k || 1) * 0.9 * Math.pow(clamp01(1 - d / FACE.reach.hidden), 1.3);
      if (hk < 0.01) continue;
      const w = hk / (lk + hk), hd = norm([h.x - wx, h.h - 1, h.z - wz]);
      lcol = lcol.map((v, i) => v * (1 - w) + FACE.col.hidden[i] * w); ld = norm(ld.map((v, i) => v * (1 - w) + hd[i] * w)); lk = Math.min(1, lk + hk);
    }
    return { lk, lcol, ld };
  }
  let best = null, bd = 1e9;
  for (const l of lights || []) { if (l.kind === 'hidden') continue; const d = Math.hypot(l.x - wx, (l.z - wz) * 1.1); if (d < bd) { bd = d; best = l; } }
  const kind = best && (best.kind === 'tall' || best.kind === 'implied') ? best.kind : 'globe';
  let lk = best ? lampK * Math.min(1, 1.35 * Math.pow(clamp01(1 - bd / FACE.reach[kind]), 1.1)) : 0;
  let ld = best ? norm([best.x - wx, FACE.y[kind] - 1, best.z - wz]) : [0, 1, 0], lcol = FACE.col[kind];
  // (POL4: the hidden lamp ADDS its warm light from the left to a face within its reach — the bench's top — blended in by strength)
  for (const h of lights || []) {
    if (h.kind !== 'hidden') continue;
    const d = Math.hypot(h.x - wx, (h.z - wz) * 1.1), hk = lampK * (h.k || 1) * 0.9 * Math.pow(clamp01(1 - d / FACE.reach.hidden), 1.3);
    if (hk < 0.01) continue;
    const w = hk / (lk + hk), hd = norm([h.x - wx, h.h - 1, h.z - wz]);
    lcol = lcol.map((v, i) => v * (1 - w) + FACE.col.hidden[i] * w); ld = norm(ld.map((v, i) => v * (1 - w) + hd[i] * w)); lk = Math.min(1, lk + hk);
  }
  return { lk, lcol, ld };
}

// ------------------------------------------------------------------ THE TREES (lamps as local lights round a crown)
// (PF: a tall lamp 0.8 → 0.58 — the crabapple stands right beside the left flanking lamp: its crown's side went one flat orange)
export const TREE_LAMP = Object.freeze({ tall: { col: [0.84, 0.95, 1.2], k: 0.58 }, globe: { col: [1.35, 0.86, 0.46], k: 1.15 }, hidden: { col: [1.38, 0.9, 0.48], k: 0.85 }, cab: { col: [1.42, 0.94, 0.5], k: 0.95, fall: 2.1, wK: 0.4, y: -0.6 }, implied: { col: [1.32, 0.9, 0.52], k: 0.28, fall: 16 } });
/** the lamps within reach of tree t, in its local frame: [{ x, y, w (toward us), col, k }] (a tall lamp = its two heads) */
export function treeLamps(ctx, t) {
  const out = [];
  // (NIGHT-A: the wash lights a crown evenly from the FRONT — one broad far light straight in front of it, not the 2–3 nearest lamps)
  if (NEW()) out.push({ x: -t.x * 0.3, y: NIGHT_LIGHT.lampY, w: t.z - (NIGHT_LIGHT.lampZ - 8), col: TREE_LAMP.implied.col, k: NIGHT_LIGHT.tree.k, fall: NIGHT_LIGHT.tree.fall });
  for (const l of ctx.lights || []) {
    if (l.kind === 'implied' && NEW()) continue;
    // (PROM: the implied lamps light a crown from the FRONT + below — the nearer ones only, each a far light: `fall` long)
    if (l.kind === 'implied') { if (Math.abs(l.x - t.x) < 11) out.push({ x: l.x - t.x, y: l.h ?? 5.6, w: -(l.z - t.z), col: TREE_LAMP.implied.col, k: TREE_LAMP.implied.k, fall: TREE_LAMP.implied.fall }); continue; }
    if (Math.abs(l.x - t.x) > 10 || Math.abs(l.z - t.z) > 14) continue;
    const w = -(l.z - t.z), P = TREE_LAMP.globe;   // (the speakeasy's spill, the pole, the cart: a low warm light like the old globe's)
    // (C4b: the cab lamp on the maple — its depth offset compressed (wK) + a little lower (y): seen from 5 u in front, every leaf on the
    // crown's right was the same distance from it — a flat half; nearer + lower, the LOWER RIGHT catches it and it falls off up + left)
    if (l.kind === 'hidden') { const H = l.cab ? TREE_LAMP.cab : TREE_LAMP.hidden; out.push({ x: l.x - t.x, y: l.h + (H.y || 0), w: w * (H.wK || 1), col: H.col, k: H.k, fall: H.fall }); continue; }
    out.push({ x: l.x - t.x, y: PIECE.globe.h + 0.18, w, col: P.col, k: P.k });
  }
  return out;
}

// ------------------------------------------------------------------ THE ROAD (a passing car under the front walk's lamps)
const ROAD_LAMP = Object.freeze({ reach: 7, zMax: 40 });
/** the front walk's lamps on a car at world x (0..1) */
export function roadLampAt(lamps, x) {
  if (NEW()) return NIGHT_LIGHT.road;   // (NIGHT-A: the wash is even along the road — a car never passes through pools)
  let k = 0;
  for (const l of lamps) { if (l.z > ROAD_LAMP.zMax) continue; const d = (x - l.x) / ROAD_LAMP.reach; if (d * d < 1) k += (1 - d * d) ** 2; }
  return Math.min(1, k);
}
