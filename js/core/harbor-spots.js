// CITY 2.0 — THE HARBOR, WIN add-on: THE DRESSING SPOTS (PURE — tests/harbor-spots.test.mjs; docs/harbor.md#win). The owner (Oct 26):
// "named DRESSING SPOTS in the holiday system (bench, lamp posts, hydrant, planters, quay railing, open corners clear of the dock / paths /
// lobby line), so every later holiday fills them with its own big readable set pieces." Every spot comes from the LAYOUT
// (core/harbor-layout.js#harborLayout) — where a set piece may STAND, how big its footprint may be (r, world units), which draw pass
// shows it in depth (near: z-sorted with the walkers through people.js's extras · top: the front strip, nearer than anyone on the floor ·
// far: across the road, with the far pass) — and THE RULES every spot obeys at every phone size (spotProblems): above the dock's top,
// never in the lobby line, the door's approach, the crosswalk's landing or on the cart's rest; on screen with its footprint.
// A holiday fills them by id: core/harbor-holidayprops.js#bigPumpkins (Halloween) is the first; Thanksgiving's bales + cornstalks,
// Christmas's gifts + snowman name the same ids.
import { project } from './harbor-layout.js';
import { linePlaces, FOLK } from './harbor-people.js';

/** the pad under a piece's foot to the dock's top (pt) + the screen's side margin for its footprint (pt) */
export const SPOT_PAD = Object.freeze({ dock: 3, side: 2 });

/** every dressing spot of a layout → [{ id, kind ('bench' | 'lamp' | 'globe' | 'hydrant' | 'rail' | 'corner' | 'planter'), x, z, y, r, face
 *  (−1 / 1: which side of its furniture it sits on), pass ('near' | 'top' | 'far'), by (the furniture's id) }] */
export function dressingSpots(L) {
  const out = [], s = L.speakeasy, cw = L.crosswalk, cx = (cw.x0 + cw.x1) / 2;
  // THE BENCH's two ends (a piece beside the armrest, on the paving)
  if (L.bench) for (const side of [-1, 1]) out.push({ id: side < 0 ? 'bench-left' : 'bench-right', kind: 'bench', x: L.bench.x + side * (L.bench.w / 2 + 0.95), z: L.bench.z + 0.05, y: 0, r: 0.85, face: side, pass: 'near', by: 'bench' });
  // THE TALL LAMP POSTS (the curb row): at each foot, on the side AWAY from the crosswalk, a little toward us
  (L.lamps || []).filter(l => l.kind === 'tall').forEach((l, i) => { const side = l.x < cx ? -1 : 1; out.push({ id: `lamp-${i}`, kind: 'lamp', x: l.x + side * 0.9, z: l.z - 0.35, y: 0, r: 0.72, face: side, pass: 'near', by: `lamp-${i}` }); });
  // THE SHORT GLOBE LAMPS (the front strip's two corners): left of each post (the hydrant stands right of the first; the right edge cuts the other)
  (L.lamps || []).filter(l => l.kind === 'globe').forEach((l, i) => out.push({ id: `globe-${i}`, kind: 'globe', x: l.x - 0.95, z: l.z + 0.05, y: 0, r: 0.72, face: -1, pass: 'top', by: `globe-${i}` }));
  // THE FIRE HYDRANT: beside it, away from its lamp post — the nearest spot, the biggest piece
  if (L.hydrant) out.push({ id: 'hydrant', kind: 'hydrant', x: L.hydrant.x + 1.2, z: L.hydrant.z - 0.1, y: 0, r: 0.8, face: 1, pass: 'top', by: 'hydrant' });
  // THE QUAY RAILING (across the road, the far pavement): three along it, clear of the crosswalk's lantern + its landing
  if (L.rail && cw) { const z = L.rail.z + 0.5, hw = L.cam.hw ? L.cam.hw(z) : L.cam.VPX * z / L.cam.F; for (const [k, f] of [[0, 0.1], [1, 0.42], [2, 0.9]]) { const x = -hw + 2 * hw * f; if (Math.abs(x - (cw.lantern ? cw.lantern.x : cx)) < 1.6 || (x > cw.x0 - 0.8 && x < cw.x1 + 0.8)) continue; out.push({ id: `rail-${k}`, kind: 'rail', x, z, y: 0, r: 0.6, face: x < 0 ? 1 : -1, pass: 'far', by: 'rail' }); } }
  // THE OPEN CORNER on the right: the floor's front-right, before the framing maple's grate, behind the cart's rest
  { const maple = (L.trees || []).find(t => t.kind === 'maple' && t.big) || (L.trees || []).find(t => t.kind === 'maple'); if (maple) out.push({ id: 'corner-right', kind: 'corner', x: maple.x - 1.4, z: 40.6, y: 0, r: 0.9, face: -1, pass: 'near', by: 'maple' }); }
  // THE PLANTERS (none on today's promenade — the ids are ready for the day they return)
  (L.planters || []).forEach((p, i) => out.push({ id: `planter-${i}`, kind: 'planter', x: p.x + p.w / 2 + 0.8, z: p.z, y: 0, r: 0.7, face: 1, pass: 'near', by: `planter-${i}` }));
  // (a desktop PANORAMA keeps the phone's stage beside the speakeasy — its front strip's lamps can fall off the left edge: a spot the
  // screen cuts is dropped there, never on a phone)
  void s; return L.cam.wide ? out.filter(sp => !spotProblems(L, sp).some(m => m.startsWith('off screen'))) : out;
}
export const spotById = (L, id) => dressingSpots(L).find(sp => sp.id === id) || null;

/** THE RULES: what is wrong with a spot (or a piece standing on it: { x, z, r }) at this layout → [] = fine */
export function spotProblems(L, sp) {
  const cam = L.cam, s = L.speakeasy, out = [], r = sp.r || 0.6;
  const [sx, sy] = project(cam, sp.x, 0, sp.z), rp = r * cam.F / sp.z;
  const dockY = cam.dock && cam.dock.y && !cam.wide ? cam.dock.y : cam.H;
  if (sy > dockY - SPOT_PAD.dock) out.push(`under the dock (${sy.toFixed(0)} > ${dockY - SPOT_PAD.dock})`);
  if (sx - rp < SPOT_PAD.side || sx + rp > cam.W - SPOT_PAD.side) out.push(`off screen (${(sx - rp).toFixed(0)} … ${(sx + rp).toFixed(0)} of ${cam.W})`);
  // the lobby line (a full line of 8 + their waiting friends) — nothing stands where the guests stand
  const line = linePlaces(L, 8); for (const g of line) if (Math.hypot(g.x - sp.x, g.z - sp.z) < r + 0.55) { out.push('in the lobby line'); break; }
  // the door's approach: the side door's width + a margin, from the facade out to the floor
  { const u = sp.x - s.x0; if (u > s.door.u0 - 0.7 - r && u < s.door.u1 + 0.7 + r && sp.z > FOLK.doorZ - 2.4 - r && sp.z < s.z0 + 0.5) out.push("in the door's approach"); }
  // the crosswalk's landing on the promenade's kerb
  if (L.crosswalk && sp.x + r > L.crosswalk.x0 - 0.5 && sp.x - r < L.crosswalk.x1 + 0.5 && sp.z + r > 50.5 && sp.z - r < 54.6) out.push("on the crosswalk's landing");
  // the cart's rest (+ its route) and the medallion's ring
  if (L.cart && L.cart.shown && Math.hypot(sp.x - L.cart.x, (sp.z - L.cart.z) * 1.5) < 1.6 + r) out.push("on the cart's rest");
  if (L.medallion && Math.hypot(sp.x - L.medallion.x, sp.z - L.medallion.z) < L.medallion.ring + r) out.push("on the medallion's ring");
  return out;
}
