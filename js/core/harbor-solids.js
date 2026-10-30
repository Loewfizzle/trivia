// CITY 2.0 — THE HARBOR, NIGHT-B Group 0: THE SOLIDS (the owner, Oct 29 9:33 pm: "a walker walked THROUGH THE CHESTNUT CART — it went
// round the harvest display"). ONE registry of every solid thing standing on the promenade — the furniture, the cart, the trees' trunks,
// the crossing's poles + every holiday piece (core/harbor-holidayprops.js#standingFootprints) — as GROUND FOOTPRINTS (world rects,
// padded by a person's half-width + a step). core/harbor-people.js#aroundSolids bends EVERY visit round them as it reaches the frame —
// whoever planned it (the blocks, the cart's roll, the dog walker, the line, the cabs' riders, the street party's pockets + dancers) —
// so no planner can forget one. PURE (tests: tests/harbor-solids.test.mjs + the long seeded sims in tests/harbor-people.test.mjs).
//
// A footprint: { id, x0, x1, z0, z1 } + optional
//   t0, t1   a time window (s, the city clock): solid only then (the chestnut cart: parked = its whole rest; rolling = the corridor it
//            rolls through, so people step aside — never through it)
//   sit      the bench's own sitters are not pushed out of it (a visit with a 'sit' pose inside it)
//   owner    visit kinds that work AT it (the vendor behind his cart)
//   onBench  (a visit's own `onBench` = this id): the street party's bench dancers stand ON the cab-stand bench in a dance break
// ADDING A SOLID: one line in furnitureSolids (or the holiday's piece in standingFootprints) — nothing else; the sims check it.
import { standingFootprints } from './harbor-holidayprops.js';   // (its SOLID_PAD is the same 0.45 — tests/harbor-solids.test.mjs; not imported: a cycle at load)

/** the furniture's drawn sizes (world units; screens/harbor/props.js): the benches' seat (front edge b.z → back b.z + depth), a trunk's
 *  half-width, the crossing's signal poles, the hydrant (a smaller pad: the dog's nose sniffs it from 0.62 to its right), the cart's
 *  body (X ± 1.22, depth 0.12…1.18 × the frame's 1.5 depth exaggeration) + its handles (hand side) + the HOT CIDER board in front of
 *  the handle end */
export const SOLID = Object.freeze({
  pad: 0.45, benchDepth: 1.66, trunk: 0.3, pole: 0.14, hydrantPad: 0.28,
  cart: Object.freeze({ body: 1.22, handle: 2.0, near: 1.3, d0: -0.55, d1: 1.82 }),
});

const box = (out, id, x0, x1, z0, z1, pad, extra = {}) => out.push({ id, x0: +(x0 - pad).toFixed(3), x1: +(x1 + pad).toFixed(3), z0: +(z0 - pad).toFixed(3), z1: +(z1 + pad).toFixed(3), ...extra });

/** the furniture that never moves: both benches (their sitters excepted), the two trees' trunks, the hydrant, the crossing's poles */
export function furnitureSolids(L) {
  if (!L) return [];
  const out = [], P = SOLID.pad;
  for (const b of [L.bench, L.cabStand].filter(Boolean)) {
    const id = b.face === 'water' ? 'water-bench' : 'cab-bench';
    box(out, id, b.x - b.w / 2, b.x + b.w / 2, b.z, b.z + SOLID.benchDepth, P, { sit: true });
  }
  for (const t of L.trees || []) box(out, `trunk-${t.kind}`, t.x - SOLID.trunk, t.x + SOLID.trunk, t.z - SOLID.trunk, t.z + SOLID.trunk, P);
  if (L.hydrant) { const r = L.hydrant.r || 0.24; box(out, 'hydrant', L.hydrant.x - r, L.hydrant.x + r, L.hydrant.z - r, L.hydrant.z + r, SOLID.hydrantPad); }
  for (const s of L.signals || []) box(out, `pole-${s.id}`, s.x - SOLID.pole, s.x + SOLID.pole, s.z - SOLID.pole, s.z + SOLID.pole, P);
  return out;
}

/** THE CHESTNUT CART on its evening `ev` (core/harbor-routines.js#cartEvening) → its footprints: PARKED (ev.ta → ev.tb) its body +
 *  handles (+ the cider board), and while it ROLLS (t0 → ta, tb → t1) the corridor it rolls along, so people step aside. `x` / `z`: its
 *  rest; `below`: it comes up from the front street (its corridor runs along z), else along x from `xIn` */
export function cartSolids(L, ev, { below = false, xIn = null } = {}) {
  if (!ev || !L || !L.cart || L.cart.shown === false) return [];
  const c = L.cart, C = SOLID.cart, hd = c.hand || 1, P = SOLID.pad, out = [];
  const x0 = c.x - (hd > 0 ? C.near : C.handle), x1 = c.x + (hd > 0 ? C.handle : C.near), z0 = c.z + C.d0, z1 = c.z + C.d1;
  box(out, 'cart', x0, x1, z0, z1, P, { t0: ev.ta, t1: ev.tb, owner: ['vendor'], front: false });   // (front: false — passed BEHIND it, never round its front under the dock)
  const key = Math.round(ev.t0);
  if (below) {
    // (the corridor from the front street up over the curb: only its last part reaches the walkers' floor)
    box(out, 'cart-roll', x0, x1, Math.min(z0, (xIn == null ? z0 - 8 : xIn) + C.d0), z1, P, { t0: ev.t0, t1: ev.ta, owner: ['vendor'], key, front: false });
    box(out, 'cart-roll', x0, x1, Math.min(z0, (xIn == null ? z0 - 8 : xIn) + C.d0), z1, P, { t0: ev.tb, t1: ev.t1, owner: ['vendor'], key, front: false });
  } else if (xIn != null) {
    const a = Math.min(x0, xIn - C.handle), b = Math.max(x1, xIn + C.handle);
    box(out, 'cart-roll', a, b, z0, z1, P, { t0: ev.t0, t1: ev.ta, owner: ['vendor'], key, front: false });
    box(out, 'cart-roll', a, b, z0, z1, P, { t0: ev.tb, t1: ev.t1, owner: ['vendor'], key, front: false });
  }
  return out;
}

/** EVERY solid on the promenade now (the furniture + the holiday's standing pieces; the cart is added by folkAt, which knows its evening) */
export function promenadeSolids(L, HP) {
  return [...furnitureSolids(L), ...standingFootprints(L, HP)];
}

/** does visit `vis` USE footprint q (a sitter's bench, the vendor's cart, a bench dancer's bench) — it isn't pushed out of it */
export function usesSolid(vis, q) {
  if (q.owner && q.owner.includes(vis.kind)) return true;
  if (vis.onBench && vis.onBench === q.id) return true;
  if (q.sit && vis.legs) for (const lg of vis.legs) if (lg.k === 'pose' && lg.pose === 'sit' && lg.x > q.x0 && lg.x < q.x1 && lg.z > q.z0 && lg.z < q.z1) return true;
  return false;
}
/** the footprints that hold over [a, b] (s): the timeless ones + any whose window overlaps */
export const solidsDuring = (S, a, b) => S.filter(q => q.t0 == null || (b > q.t0 && a < q.t1));
/** a key for a set of footprints (the visits' cache): ids + boxes + windows */
export const solidsKeyOf = S => S.map(q => `${q.id}:${q.x0},${q.x1},${q.z0},${q.z1}${q.t0 == null ? '' : `@${Math.round(q.t0)}-${Math.round(q.t1)}`}`).join('|');
