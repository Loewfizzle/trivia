// CITY 2.0 — THE HARBOR, PART 8P: THE PEOPLE (PURE — tested in tests/harbor-people.test.mjs; drawn by screens/harbor/people.js +
// folk.js). The owner's "8b PEOPLE — DECIDED": GUIDED FREE WILL — a small walkable map of the promenade + small GOALS (stroll
// through, sit on the bench, stop at the cart, look at the water, wait for the bus, cross, meet a friend, walk a dog, window-shop,
// enter / leave a door) + routes between them; never fixed scripts, never physics. Each visitor picks goals, walks there on the map,
// does it a while, then picks the next or leaves.
//
// HOW IT STAYS THE SAME ON EVERY PHONE + JOINS MID-WAY: the visits are PLANNED, not simulated — whole itineraries (walk legs along
// routes at a constant gait, pose legs) generated per BLOCK of time from a seed (the local date + the block), so the promenade at
// any moment is a pure function of the clock (folkAt). Two overlapping block PHASES (A at k·B, B at k·B + B/2) — a visit lives inside
// its block, so the blocks are independent, and the other phase is mid-block whenever one ends (the promenade never empties at a
// seam). The count never passes FOLK.cap: the B phase is planned against the A phase's occupancy (+ the bus's riders).
// WHO'S OUT WHEN (the owner, Oct 24) is DATA: MIX — a behaviour mix + a count by the clock; weekends busier + later; party nights a
// stream of guests to the side door (+ the roof); rain (Part 9's hook: ctx.rain) fewer people, faster. ctx.budget: 6b's director
// (0..1 — a big sky moment can thin the street).
//
// ADDING A GOAL / A KIND OF VISITOR: a builder in KINDS (its goals: walk to a node, a pose for a while, cross, a door, the bus, leave) +
// its weight in MIX's periods; a new look: folk.js#LOOKS (+ its name in the builder's `look`).
import { rngFrom, hashString } from './rng.js';
import { signalAt, SIGNAL_CYCLE, xOfF } from './harbor-promenade.js';
import { partyAt } from './harbor-moments.js';

/** the people's numbers (world units, seconds): block length, the cap on screen, gaits (units / s — a person is 2.1 units), the
 *  walkable floor (zMin: behind the front row's globes + maple; zMax: in front of the tall lamps + the bench), the kerbs */
export const FOLK = Object.freeze({
  block: 480, cap: 12, roofCap: 6, h: 2.1,
  // (FP3a, the owner's 8P note 4 — "they walk too fast": the everyday pace ~25 % slower, a relaxed 1920s stroll; strollers + couples
  // the slowest, commuters brisker, joggers clearly faster; each person ±12 % of their gait: planVisit)
  speed: { walk: 1.15, brisk: 1.5, stroll: 0.8, jog: 3.1, kid: 1.35, line: 0.7 },
  zMin: 38.75, zMax: 52.25, curbZ: 53.2, roadZ: 53.6, farZ: 63.55, doorZ: 43.55, busZ: 55.4,
});

/** FP3a (FREV A4) — THE PEOPLE DRAWN BY THE PHONE'S TIER: at most TIER_CAP[tier] heads on screen (the plan is the same on every
 *  phone; an older phone / Low Power draws fewer). Whole visits are kept (a couple, a dog walker + the dog), in a fixed order by
 *  their id — every phone at the same tier keeps the same people. The roof's guests are off at tier 0 (people.js). */
export const TIER_CAP = Object.freeze([6, 9, 12]);
export function capByTier(members, tier = 2) {
  const cap = TIER_CAP[Math.max(0, Math.min(2, tier | 0))];
  if (cap >= FOLK.cap) return members;
  const heads = new Map();
  for (const m of members) heads.set(m.vid, (heads.get(m.vid) || 0) + (m.m.role === 'dog' ? 0 : 1));
  const keep = new Set(); let n = 0;
  for (const v of [...heads.keys()].sort((a, b) => hashString(a) - hashString(b) || (a < b ? -1 : 1))) { const h = heads.get(v); if (n + h <= cap) { n += h; keep.add(v); } }
  return members.filter(m => keep.has(m.vid));
}

// ------------------------------------------------------------------ WHO'S OUT WHEN (data — tune here)
/** periods of the day (local hours [from, to)): n = the people out on average [weekday, weekend] (~¾ of them on screen: the rest are
 *  walking in / out past the edges or round behind the speakeasy); mix = the kinds' weights
 *  (KINDS below). Weekends: busier (n) and LATER (lateShift moves the evening's hours on by an hour). */
export const MIX = Object.freeze([
  { id: 'small-hours', from: 2, to: 5.5, n: [0.4, 0.7], mix: { nightworker: 3, lone: 1 } },
  { id: 'early', from: 5.5, to: 8, n: [4.4, 3.1], mix: { jogger: 4, dogwalker: 4, worker: 3, stroller: 1 } },
  { id: 'commute', from: 8, to: 9.25, n: [8.8, 5], mix: { brisk: 5, busrider: 4, newsboy: 1.5, dogwalker: 1.5, worker: 1 } },
  { id: 'morning', from: 9.25, to: 11.5, n: [7.5, 8.8], mix: { stroller: 3, couple: 1.5, window: 1.5, customer: 1.2, cart: 1, water: 1.2, dogwalker: 1.5, busrider: 1, meet: 1 } },
  { id: 'midday', from: 11.5, to: 14, n: [11.2, 12], mix: { stroller: 3, couple: 2, lunch: 2.5, window: 1.2, customer: 1.2, cart: 2, water: 1.2, meet: 1.2, brisk: 1.5, busrider: 1 } },
  { id: 'afternoon', from: 14, to: 16.25, n: [8.8, 11.2], mix: { stroller: 3, couple: 2, window: 1, customer: 1, cart: 1.5, water: 1.5, dogwalker: 1.5, newsboy: 1, meet: 1 } },
  { id: 'homeward', from: 16.25, to: 18.5, n: [11.2, 11.2], mix: { homeward: 5, busrider: 3, stroller: 1.5, cart: 1.2, couple: 1.2, dogwalker: 1 } },
  { id: 'evening', from: 18.5, to: 22, n: [10, 12], mix: { couple: 4, guests: 3, jogger: 0.8, dogwalker: 2, water: 1.5, stargazer: 1, stroller: 1.5 } },
  { id: 'late', from: 22, to: 26, n: [5, 7.5], mix: { straggler: 3, leaving: 2.5, lone: 2, couple: 1.2, guests: 1 } },
]);
/** party nights: the guests' weight × this, the count × partyN; rain (0..1): the count × (1 − rainCut × rain), the gaits × (1 + rainFast) */
export const MOOD = Object.freeze({ party: 3.2, partyN: 1.3, weekendN: 1, lateShift: 1, rainCut: 0.55, rainFast: 0.2 });

/** the period at local hour h (0..24, a weekend shifts the evening on by MOOD.lateShift) */
function periodAt(h, weekend = false) {
  let x = h < MIX[0].from ? h + 24 : h;
  if (weekend && x >= 18.5 && x < 26 + MOOD.lateShift) x = x - MOOD.lateShift < 18.5 ? 18.6 : x - MOOD.lateShift;   // (the evening runs later)
  return MIX.find(p => x >= p.from && x < p.to) || MIX[0];
}
/** how many people on average now + the kinds' weights (PURE). ctx: { h, dow, party, rain, budget } */
export function mixNow({ h = 12, dow = 3, party = false, rain = 0, budget = 1 } = {}) {
  const weekend = dow === 0 || dow === 6 || (dow === 5 && h >= 17), p = periodAt(h, weekend);
  let n = p.n[weekend ? 1 : 0] * (party ? MOOD.partyN : 1);
  n *= 1 - MOOD.rainCut * Math.max(0, Math.min(1, rain));
  n *= Math.max(0, Math.min(1, budget));
  const mix = { ...p.mix };
  if (party && mix.guests) mix.guests *= MOOD.party;
  if (party && !mix.guests) mix.guests = 2;
  if (rain > 0.3) { delete mix.lunch; delete mix.water; delete mix.stargazer; if (mix.jogger) mix.jogger *= 0.3; }
  return { id: p.id, n: Math.min(FOLK.cap, n), mix, weekend };
}

// ------------------------------------------------------------------ THE WALKABLE MAP (world x, z on the ground)
/**
 * The map for a layout: nodes (where goals are), obstacles (rects + circles the routes go round), exits. Built from the promenade's
 * real pieces (core/harbor-promenade.js): the bench, the cart, the inlay, the crossing, the speakeasy's doors, the bus stop.
 * line: an active lobby line's rect (people route round it).
 */
export function folkMap(L, { event = false, line = null } = {}) {
  const cam = L.cam, s = L.speakeasy, cw = L.crosswalk, b = L.bench, F = FOLK;
  const hwAt = z => cam.hw(z);
  const crab = (L.trees || []).find(t => t.kind === 'crab');
  const cx = (cw.x0 + cw.x1) / 2, cww = cw.x1 - cw.x0;
  const nodes = {
    shopDoor: { x: s.x0 + (s.shop.door[0] + s.shop.door[1]) / 2, z: F.doorZ },
    sideDoor: { x: s.x0 + (s.door.u0 + s.door.u1) / 2, z: F.doorZ },
    shopWin: { x: s.x0 + (s.shop.win[0] + s.shop.win[1]) / 2 + 0.6, z: F.doorZ - 0.35 },
    bench: { x: b.x, z: b.z - 0.2 },
    benchFront: { x: b.x, z: b.z - 1.4 },
    inlay: { x: L.medallion.x, z: L.medallion.z },
    curbWait: { x: cx, z: F.curbZ },
    farWait: { x: cx, z: F.farZ },
    busStop: { x: busStopX(L) + 0.75, z: F.curbZ - 0.05 },
    busDoor: { x: busStopX(L), z: F.busZ },
    cart: L.cart && L.cart.shown !== false ? { x: L.cart.x - 2.35, z: L.cart.z - 0.1 } : null,
    vendor: L.cart && L.cart.shown !== false ? { x: L.cart.x + 1.55, z: L.cart.z + 0.45 } : null,
    view: { x: cx + cww * 0.15, z: F.zMax - 0.15 },
    sky: { x: L.medallion.x - 2.2, z: L.medallion.z - 1.2 },
    meetA: { x: L.medallion.x + 2.6, z: L.medallion.z - 1.8 },
  };
  // the screen's edges (just off it) at a few depths; the waterside sidewalk's two ends (left: behind the speakeasy — just keep going)
  const exits = {
    left: [40.0, 42.4].map(z => ({ x: -hwAt(z) - 1.4, z, side: 'left' })),
    right: [40.6, 44.5, 48.4, 51.6].map(z => ({ x: hwAt(z) + 1.4, z, side: 'right' })),
    farLeft: { x: s.x1 - 3.5, z: F.farZ, side: 'farLeft' },
    farRight: { x: hwAt(F.farZ) + 1.5, z: F.farZ, side: 'farRight' },
  };
  const rects = [
    { id: 'building', x0: -1e3, x1: s.x1 + 0.35, z0: F.doorZ + 0.2, z1: 61 },
    // (behind the bench + the crabapple, and under the blade: nobody — they're baked with the stage, the walkers drawn over it)
    { id: 'back-left', x0: -1e3, x1: b.x + b.w / 2 + 0.55, z0: b.z - 0.05, z1: F.roadZ },
    { id: 'road', x0: -1e3, x1: 1e3, z0: F.roadZ, z1: F.farZ - 0.3 },
    { id: 'curb-l', x0: -1e3, x1: cw.x0 + cww * 0.12, z0: F.zMax + 0.1, z1: F.roadZ },
    { id: 'curb-r', x0: cw.x1 - cww * 0.12, x1: 1e3, z0: F.zMax + 0.1, z1: F.roadZ },
  ];
  if (line) rects.push({ id: 'line', ...line });
  const circles = [];
  for (const l of L.lamps || []) if (l.kind === 'tall') circles.push({ x: l.x, z: l.z, r: 0.5 });
  // (the cart: nobody walks IN FRONT of it — it bakes with the front row, nearer than the floor behind it — or through it)
  if (L.cart && L.cart.shown !== false) { rects.push({ id: 'cart', x0: L.cart.x - 2.1, x1: L.cart.x + 2.1, z0: F.zMin - 2, z1: L.cart.z + 0.35 }); circles.push({ x: L.cart.x, z: L.cart.z, r: 1.75 }); }
  if (event) circles.push({ x: L.medallion.x, z: L.medallion.z, r: L.medallion.ring + 0.5 });
  return { nodes, exits, rects, circles, cw: { x0: cw.x0 + cww * 0.22, x1: cw.x1 - cww * 0.22, z0: F.curbZ, z1: F.farZ } };
}
/** the bus's door at the stop (world x): the stop is just LEFT of the crossing — in clear view (right of it the framing maple + the
 *  cart's umbrella hide the road) — the bus's front stops short of the crosswalk (never on it), its rear clear of the speakeasy */
export function busStopX(L) { return L.crosswalk.x0 - 1.4; }

// ---- routes: a tiny visibility graph round the obstacles (rect corners + points round the circles), shortest path
const segRect = (a, b, r) => {
  // does the segment a → b pass through the rect's interior? (Liang–Barsky)
  let t0 = 0, t1 = 1; const dx = b.x - a.x, dz = b.z - a.z;
  for (const [p, q] of [[-dx, a.x - r.x0], [dx, r.x1 - a.x], [-dz, a.z - r.z0], [dz, r.z1 - a.z]]) {
    if (Math.abs(p) < 1e-12) { if (q <= 1e-9) return false; continue; }
    const t = q / p; if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return t1 - t0 > 1e-6;
};
const segCircle = (a, b, c) => {
  const dx = b.x - a.x, dz = b.z - a.z, l2 = dx * dx + dz * dz, t = l2 ? Math.max(0, Math.min(1, ((c.x - a.x) * dx + (c.z - a.z) * dz) / l2)) : 0;
  return Math.hypot(a.x + dx * t - c.x, a.z + dz * t - c.z) < c.r - 1e-6;
};
const inRect = (p, r) => p.x > r.x0 + 1e-6 && p.x < r.x1 - 1e-6 && p.z > r.z0 + 1e-6 && p.z < r.z1 - 1e-6;
export function clear(map, a, b) {
  for (const r of map.rects) if (!inRect(a, r) && !inRect(b, r) && segRect(a, b, r)) return false;
  for (const c of map.circles) if (segCircle(a, b, c) && Math.hypot(a.x - c.x, a.z - c.z) > c.r && Math.hypot(b.x - c.x, b.z - c.z) > c.r) return false;
  return true;
}
/** the shortest route a → b round the obstacles: [{ x, z }, …] (a and b included); straight when clear */
export function route(map, a, b) {
  if (clear(map, a, b)) return [a, b];
  const pad = 0.35, way = [];
  for (const r of map.rects) for (const [x, z] of [[r.x0 - pad, r.z0 - pad], [r.x1 + pad, r.z0 - pad], [r.x0 - pad, r.z1 + pad], [r.x1 + pad, r.z1 + pad]])
    if (z >= FOLK.zMin - 0.3 && Math.abs(x) < 900 && !map.rects.some(o => inRect({ x, z }, o))) way.push({ x, z });
  for (const c of map.circles) for (let i = 0; i < 6; i++) { const a2 = i * Math.PI / 3, p = { x: c.x + Math.cos(a2) * (c.r + pad), z: c.z + Math.sin(a2) * (c.r + pad) }; if (!map.rects.some(o => inRect(p, o))) way.push(p); }
  const pts = [a, ...way, b], n = pts.length, dist = new Array(n).fill(Infinity), prev = new Array(n).fill(-1), done = new Array(n).fill(false);
  dist[0] = 0;
  for (;;) {
    let u = -1; for (let i = 0; i < n; i++) if (!done[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0 || u === n - 1) break;
    done[u] = true;
    for (let v = 0; v < n; v++) if (!done[v] && v !== u) { const d = Math.hypot(pts[u].x - pts[v].x, pts[u].z - pts[v].z); if (dist[u] + d < dist[v] && clear(map, pts[u], pts[v])) { dist[v] = dist[u] + d; prev[v] = u; } }
  }
  if (dist[n - 1] === Infinity) return [a, b];
  const out = []; for (let v = n - 1; v >= 0; v = prev[v]) { out.unshift(pts[v]); if (v === 0) break; }
  return out;
}
const pathLen = pts => { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z); return s; };

// ------------------------------------------------------------------ THE CROSSING: wait for WALK (core/harbor-promenade.js#signalAt)
/** the next moment (s, absolute) at or after t when a walker may start across: in the WALK phase, early enough to be over before the
 *  blinking WAIT ends (`cross` s to cross — a walker may finish during the blink, never start in it) */
function walkStart(t, cross = 8) {
  let u = t;
  for (let i = 0; i < 14; i++) {
    const S = signalAt(u * 1000);
    if (S.phase === 'walk' && S.left + SIGNAL_CYCLE.blink - 0.6 >= cross && S.left >= 2) return u;
    u += S.left + 0.02;                       // (on to the next phase's start)
  }
  return t;
}
/** a crosser's pace: at least a brisk walk (FOLK.speed.brisk × 0.85) — the crossing is never strolled */
const crossV = v => Math.max(v, FOLK.speed.brisk * 0.85);

// ------------------------------------------------------------------ THE BUS (a 1920s bus on the back road: arrive, stop, pull away)
/** the bus's numbers: its length (units), cruising speed, braking + pulling-away (units / s²), the riders' timing at the stop (s) */
// (FP3a, the owner's 8P note 12 — "the door stays open far too long": the stop is the riders' — off first (offAt, offGap), then the
// boarders' window (board s, when someone boards), the door SHUTS 3–5 s after the LAST rider (folkAt#doorShut, from the riders the
// planner really placed) and the bus pulls away on the next green after a beat (go0) — its departure planned for the latest shut)
export const BUS = Object.freeze({ len: 7.8, v: 6.5, brake: 2.2, go: 1.4, offAt: 2.2, offGap: 1.5, board: 6, shut: [3, 5], go0: 1, perHour: { day: [2, 4], late: [1, 1], night: [0, 0] } });
/**
 * The buses of local hour `hour` on day `key` (PURE): [{ id, tE (enters the screen, s abs), tA (stops), tD (pulls away), tX (gone),
 * x(t) (its centre, world), riders: { off, on } }]. It comes from behind the speakeasy (left), stops at the curb just short of the
 * crossing (its door by the people waiting), and pulls away through the crossing only on GREEN (it waits at the red like a real bus).
 * t0: the hour's start (s abs).
 */
export function busesOf(L, key, hour, t0, { force = false } = {}) {
  const r = rngFrom(hashString(`bus|${key}|${hour}`)), cam = L.cam, B = BUS, cw = L.crosswalk;
  const per = hour >= 6 && hour < 23 ? B.perHour.day : hour === 23 || hour === 0 ? B.perHour.late : B.perHour.night;
  const n = force ? 60 : per[0] + Math.floor(r() * (per[1] - per[0] + 1)), out = [];   // (&force=bus: one a minute — the preview)
  const xIn = -cam.hw(FOLK.busZ) - B.len, xOut = cam.hw(FOLK.busZ) + B.len;
  const xc = busStopX(L) + 0.9 - B.len / 2;      // (the bus's centre when its door — 0.9 behind its front — is at the stop)
  const dBrake = B.v * B.v / (2 * B.brake), tBr = B.v / B.brake, dCruise = Math.max(0, xc - xIn - dBrake);
  const through = (cw.x1 + 0.4) - (xc - B.len / 2), tThrough = Math.sqrt(2 * Math.max(0, through) / B.go) + 0.5;
  for (let i = 0; i < n; i++) {
    const tA = t0 + (force ? i + 0.25 : i + 0.15 + r() * 0.7) * 3600 / n, tE = tA - tBr - dCruise / B.v, tb = tA - tBr;
    // the riders: off first (one every offGap from offAt), then the boarders' window [tB, tB + board] (only when someone boards: on);
    // the door shuts 3–5 s after the last rider; then away on GREEN with time to clear the crossing (else the next green)
    const off = hour >= 6 && hour < 23 ? Math.floor(r() * 3.2) : Math.floor(r() * 1.5), on = Math.floor(r() * 3);
    const tB = tA + B.offAt + off * B.offGap, last = on ? tB + B.board : off ? tA + B.offAt + (off - 1) * B.offGap : tA + 1;
    const tShut = last + B.shut[1];                    // (the latest the door can shut: the departure waits for it)
    let tD = tShut + B.go0;
    for (let k = 0; k < 40; k++) { const S = signalAt(tD * 1000); if (S.road === 'green' && S.left >= tThrough + 1) break; tD += S.road === 'green' ? S.left + 0.05 : S.left + 0.05; }
    const dGo = xOut - xc, tGo = Math.sqrt(2 * dGo / B.go);
    const x = tt => (tt <= tE ? xIn : tt < tb ? xIn + (tt - tE) * B.v : tt < tA ? (u => xIn + dCruise + B.v * u - 0.5 * B.brake * u * u)(tt - tb) : tt < tD ? xc : xc + 0.5 * B.go * (tt - tD) * (tt - tD));
    out.push({ id: `bus-${key}-${hour}-${i}`, tE, tA, tB, tShut, tD, tX: tD + tGo, xc, len: B.len, z: FOLK.busZ + 0.9, x, riders: { off, on } });
  }
  return out;
}

// ------------------------------------------------------------------ THE KINDS (each a builder of goals)
/** a goal list: { at: node | {x,z}, gait? } walk there · { pose, dur, face? } stay · { cross: 'out' | 'in' } · { door: 'shop' | 'side' }
 *  (go in) · { exit: 'left' | 'right' | 'farLeft' | 'farRight' | 'any' } · { from: … } where it appears (an exit, a door, the bus) */
const pickW = (r, w) => { let s = 0; for (const k in w) s += w[k]; let u = r() * s; for (const k in w) { u -= w[k]; if (u <= 0) return k; } return Object.keys(w)[0]; };
const jitter = (r, p, dx = 0.8, dz = 0.6) => ({ x: p.x + (r() - 0.5) * 2 * dx, z: Math.max(FOLK.zMin, Math.min(FOLK.zMax, p.z + (r() - 0.5) * 2 * dz)) });
const anySide = r => (r() < 0.5 ? 'left' : 'right');
const floor = (r, M) => {
  // a spot on the open floor — never inside the building, the bench's corner, the cart, a lamp
  for (let i = 0; i < 12; i++) { const p = { x: (r() - 0.5) * 1.6 * Math.abs(M.exits.right[1].x), z: FOLK.zMin + 0.4 + r() * (FOLK.zMax - FOLK.zMin - 1.2) }; if (!M.rects.some(o => inRect(p, o)) && !M.circles.some(c => Math.hypot(p.x - c.x, p.z - c.z) < c.r + 0.3)) return p; }
  return { ...M.nodes.inlay };
};
export const KINDS = {
  stroller: (r, M) => ({ look: 'stroll', gait: 'stroll', goals: [{ from: anySide(r) }, ...(r() < 0.5 ? [{ at: jitter(r, M.nodes.inlay, 2.5, 1.5) }, { pose: 'look', dur: 3 + r() * 8 }] : []), { exit: 'any' }] }),
  brisk: (r) => ({ look: 'commuter', gait: 'brisk', goals: [{ from: r() < 0.3 ? 'cross' : anySide(r) }, { exit: r() < 0.3 ? 'cross' : 'any' }] }),
  jogger: (r) => ({ look: 'jogger', gait: 'jog', goals: [{ from: r() < 0.25 ? 'cross' : anySide(r) }, { exit: r() < 0.25 ? 'cross' : 'any' }] }),
  dogwalker: (r, M) => ({ look: 'walker', gait: 'stroll', dog: true, goals: [{ from: r() < 0.2 ? 'cross' : anySide(r) }, { at: floor(r, M) }, { pose: 'wait', dur: 4 + r() * 10 }, { exit: 'any' }] }),
  worker: (r) => ({ look: 'worker', gait: 'walk', goals: [{ from: anySide(r) }, { bus: true }] }),
  busrider: (r) => ({ look: r() < 0.5 ? 'commuter' : 'walker', gait: 'walk', goals: [{ from: r() < 0.3 ? 'cross' : anySide(r) }, { bus: true }] }),
  newsboy: (r, M) => ({ look: 'newsboy', gait: 'kid', goals: [{ from: anySide(r) }, { at: jitter(r, M.nodes.inlay, 3, 1.2) }, { pose: 'wave', dur: 5 + r() * 6 }, { exit: 'any' }] }),
  couple: (r, M) => ({ look: 'couple', gait: 'stroll', pair: true, goals: [{ from: r() < 0.25 ? 'cross' : anySide(r) }, ...(r() < 0.45 ? [{ at: jitter(r, M.nodes.inlay, 2.5, 1.2) }, { pose: 'chat', dur: 6 + r() * 12 }] : []), { exit: r() < 0.25 ? 'cross' : 'any' }] }),
  lunch: (r, M) => ({ look: r() < 0.5 ? 'commuter' : 'walker', gait: 'walk', goals: [{ from: anySide(r) }, { at: M.nodes.benchFront }, { at: { x: M.nodes.bench.x + (r() < 0.5 ? -0.75 : 0.75), z: M.nodes.bench.z } }, { pose: 'sit', dur: 60 + r() * 150, face: 0 }, { at: M.nodes.benchFront }, { exit: 'any' }] }),
  window: (r, M) => ({ look: r() < 0.6 ? 'lady' : 'walker', gait: 'stroll', goals: [{ from: anySide(r) }, { at: jitter(r, M.nodes.shopWin, 0.6, 0.15) }, { pose: 'shop', dur: 8 + r() * 14 }, { exit: 'any' }] }),
  customer: (r) => ({ look: 'walker', gait: 'walk', hours: [9, 17.8], goals: [{ from: r() < 0.3 ? 'cross' : anySide(r) }, { door: 'shop' }] }),
  cart: (r, M) => ({ look: r() < 0.5 ? 'lady' : 'walker', gait: 'stroll', need: 'cart', goals: [{ from: anySide(r) }, { at: M.nodes.cart }, { pose: 'cart', dur: 10 + r() * 14, face: 1 }, { exit: 'any' }] }),
  water: (r) => ({ look: r() < 0.5 ? 'stroll' : 'lady', gait: 'stroll', goals: [{ from: anySide(r) }, { cross: 'out' }, { pose: 'lean', dur: 18 + r() * 40, face: 2 }, { exit: r() < 0.5 ? 'farLeft' : 'farRight' }] }),
  meet: (r, M) => ({ look: 'walker', gait: 'walk', pair: 'meet', goals: [{ from: 'left' }, { at: M.nodes.meetA }, { pose: 'chat', dur: 14 + r() * 24 }, { exit: 'any' }] }),
  homeward: (r) => ({ look: 'commuter', gait: 'brisk', goals: [{ from: r() < 0.5 ? 'shop' : anySide(r) }, { exit: r() < 0.35 ? 'cross' : r() < 0.6 ? 'bus' : 'any' }] }),
  guests: (r) => ({ look: 'guest', gait: 'walk', group: 2 + Math.floor(r() * 3), goals: [{ from: r() < 0.3 ? 'cross' : anySide(r) }, { door: 'side' }] }),
  stargazer: (r, M) => ({ look: 'stroll', gait: 'stroll', goals: [{ from: anySide(r) }, { at: jitter(r, M.nodes.sky, 1.5, 0.8) }, { pose: 'point', dur: 5 + r() * 6 }, { exit: 'any' }] }),
  straggler: (r) => ({ look: 'guest', gait: 'stroll', goals: [{ from: r() < 0.5 ? 'side' : anySide(r) }, { exit: r() < 0.3 ? 'cross' : 'any' }] }),
  leaving: (r) => ({ look: 'guest', gait: 'stroll', pair: true, goals: [{ from: 'side' }, { exit: r() < 0.3 ? 'cross' : 'any' }] }),
  lone: (r, M) => ({ look: 'night', gait: 'walk', goals: [{ from: anySide(r) }, ...(r() < 0.4 ? [{ at: floor(r, M) }, { pose: 'watch', dur: 4 + r() * 5 }] : []), { exit: 'any' }] }),
  nightworker: (r) => ({ look: 'worker', gait: 'walk', goals: [{ from: anySide(r) }, { exit: 'any' }] }),
};

// ------------------------------------------------------------------ PLANNING A VISIT → legs on the clock
/**
 * A visit's itinerary from its goals, starting at t (s abs) → { legs: [{ k: 'walk', pts, t0, t1, v } | { k: 'pose', pose, x, z, t0,
 * t1, face } | { k: 'fade', x, z, t0, t1, out: bool }], t0, t1 } or null when it can't be laid out (a closed shop, no bus).
 */
function planVisit(spec, t, M, ctx = {}) {
  const F = FOLK, r = ctx.r || Math.random, legs = [], rain = ctx.rain || 0;
  const v = F.speed[spec.gait] * (1 + MOOD.rainFast * rain) * (0.88 + r() * 0.24);
  let cur = ctx.start ? { ...ctx.start } : null, now = t;
  const walkTo = (p, vv = v) => { const pts = route(M, cur, p), len = pathLen(pts); if (len < 0.05) { cur = p; return; } legs.push({ k: 'walk', pts, t0: now, t1: now + len / vv, v: vv }); now += len / vv; cur = { x: p.x, z: p.z }; };
  const exitPt = side => { const ex = M.exits[side]; return Array.isArray(ex) ? ex[Math.floor(r() * ex.length)] : ex; };
  const nearestSide = p => (p.x < 0 ? 'left' : 'right');
  for (const g of spec.goals) {
    if (g.from) {
      if (g.from === 'cross') {
        // across from the waterside sidewalk: along it to the crossing, wait for WALK, cross
        cur = { ...M.exits[r() < 0.5 ? 'farLeft' : 'farRight'] };
        walkTo({ x: M.cw.x0 + r() * (M.cw.x1 - M.cw.x0), z: F.farZ });
        const cv = crossV(v), react = 0.3 + r() * 0.8, ws = walkStart(now, (F.farZ - F.curbZ) / cv + react + 0.3);
        if (ws > now) { legs.push({ k: 'pose', pose: 'wait', x: cur.x, z: cur.z, t0: now, t1: ws + react, face: 0 }); now = ws + react; }
        else if (signalAt(now * 1000).phase !== 'walk') return null;
        const p = { x: cur.x + (r() - 0.5) * 0.4, z: F.curbZ }, d = Math.hypot(p.x - cur.x, p.z - cur.z);
        legs.push({ k: 'walk', pts: [cur, p], t0: now, t1: now + d / cv, v: cv, cross: true }); now += d / cv; cur = p;
      } else if (g.from === 'shop' || g.from === 'side') {
        const d = M.nodes[g.from === 'shop' ? 'shopDoor' : 'sideDoor'];
        cur = { x: d.x + (r() - 0.5) * 0.3, z: F.doorZ + 0.25 }; legs.push({ k: 'fade', x: cur.x, z: cur.z, t0: now, t1: now + 0.7, out: false, door: g.from }); now += 0.7;
        walkTo({ x: cur.x + (r() - 0.5) * 0.6, z: F.doorZ - 0.9 });
      } else if (g.from === 'bus') { cur = { ...M.nodes.busDoor }; }
      else cur = { ...exitPt(g.from) };
    } else if (g.at) walkTo(g.at);
    else if (g.pose) { legs.push({ k: 'pose', pose: g.pose, x: cur.x, z: cur.z, t0: now, t1: now + g.dur, face: g.face == null ? (r() < 0.5 ? -1 : 1) : g.face }); now += g.dur; }
    else if (g.cross === 'out') {
      walkTo({ x: M.cw.x0 + r() * (M.cw.x1 - M.cw.x0), z: F.curbZ });
      const cv = crossV(v), react = 0.3 + r() * 0.9, ws = walkStart(now, (F.farZ - F.curbZ) / cv + react + 0.3);
      if (ws > now) { const w = ws + react; legs.push({ k: 'pose', pose: 'wait', x: cur.x, z: cur.z, t0: now, t1: w, face: 2 }); now = w; }
      else { const S = signalAt(now * 1000); if (S.phase !== 'walk') return null; }
      const p = { x: cur.x + (r() - 0.5) * 0.4, z: F.farZ }, d = Math.hypot(p.x - cur.x, p.z - cur.z);
      legs.push({ k: 'walk', pts: [cur, p], t0: now, t1: now + d / cv, v: cv, cross: true }); now += d / cv; cur = p;
      walkTo({ x: cur.x + (r() - 0.5) * 2, z: F.farZ });
    } else if (g.door) {
      if (g.door === 'shop' && ctx.shopOpen === false) return null;
      const d = M.nodes[g.door === 'shop' ? 'shopDoor' : 'sideDoor'];
      walkTo({ x: d.x + (r() - 0.5) * 0.3, z: F.doorZ - 0.5 }); walkTo({ x: cur.x, z: F.doorZ + 0.25 }, v * 0.7);
      legs.push({ k: 'fade', x: cur.x, z: cur.z, t0: now, t1: now + 0.7, out: true, door: g.door }); now += 0.7;
    } else if (g.bus) {
      // (a bus someone boards — riders.on — with time to walk to the stop; they step up in its boarders' window, right after the
      // riders off: the door shuts 3–5 s after them — FP3a)
      const bus = (ctx.buses || []).find(b => b.riders.on > 0 && b.tB > now + 20 && b.tA < now + 240);
      if (!bus) return null;
      walkTo({ x: M.nodes.busStop.x + (r() - 0.3) * 0.9, z: M.nodes.busStop.z - r() * 0.25 });
      if (now > bus.tB + 1.4) return null;                 // (too slow to make it: no such visit)
      const tb = bus.tB + r() * 1.4;
      if (tb > now) { legs.push({ k: 'pose', pose: r() < 0.5 ? 'wait' : 'watch', x: cur.x, z: cur.z, t0: now, t1: tb, face: -1 }); now = tb; }
      // (to the door: a few direct steps from the kerb — the stop is right beside it)
      const door = { x: bus.x(bus.tA) + bus.len / 2 - 0.9, z: F.busZ }, pts = [cur, { x: door.x + 0.15, z: F.curbZ }, door], dl = pathLen(pts);
      legs.push({ k: 'walk', pts, t0: now, t1: now + dl / (v * 0.8), v: v * 0.8 }); now += dl / (v * 0.8); cur = door;
      legs.push({ k: 'fade', x: cur.x, z: cur.z, t0: now, t1: now + 0.5, out: true, bus: bus.id }); now += 0.5;
    } else if (g.exit) {
      let side = g.exit;
      if (side === 'any') side = r() < 0.65 ? nearestSide(cur) === 'left' ? 'right' : 'left' : nearestSide(cur);
      if (side === 'cross') { const sub = planVisit({ ...spec, goals: [{ cross: 'out' }, { exit: r() < 0.5 ? 'farLeft' : 'farRight' }] }, now, M, { ...ctx, r, start: cur }); if (!sub) return null; legs.push(...sub.legs); now = sub.t1; cur = sub.end; continue; }
      if (side === 'bus') { side = 'right'; }
      walkTo(exitPt(side));
    }
  }
  return legs.length ? { legs, t0: t, t1: now, end: cur, v } : null;
}

// ------------------------------------------------------------------ A MEMBER'S STATE at t (PURE)
/**
 * Where a visit's lead is at t → { x, z, pose ('walk' | a pose), dir (−1 left, 1 right, 0 toward the water), dist (along its walk —
 * the stride's phase: never sliding), v, a (0..1 — fading through a door / onto the bus), leg } or null (not on screen).
 */
function visitAt(vis, t) {
  if (t < vis.t0 || t >= vis.t1) return null;
  let dist = 0, lastDir = 1;
  for (const lg of vis.legs) {
    if (lg.k === 'walk') {
      const len = pathLen(lg.pts);
      if (t < lg.t1) {
        if (t < lg.t0) break;
        let d = (t - lg.t0) * lg.v; const d0 = d;
        for (let i = 1; i < lg.pts.length; i++) {
          const a = lg.pts[i - 1], b = lg.pts[i], sl = Math.hypot(b.x - a.x, b.z - a.z);
          if (d <= sl || i === lg.pts.length - 1) { const u = sl ? Math.min(1, d / sl) : 1, dx = b.x - a.x, dz = b.z - a.z; return { x: a.x + dx * u, z: a.z + dz * u, pose: 'walk', dir: Math.abs(dx) > Math.abs(dz) * 0.35 ? Math.sign(dx) : dz > 0 ? 2 : 0, dist: dist + d0, v: lg.v, a: 1, cross: !!lg.cross }; }
          d -= sl;
        }
      }
      dist += len;
      const e = lg.pts[lg.pts.length - 1], s0 = lg.pts[lg.pts.length - 2] || e; if (Math.abs(e.x - s0.x) > 1e-3) lastDir = Math.sign(e.x - s0.x);
    } else if (t < lg.t1 && t >= lg.t0) {
      if (lg.k === 'pose') return { x: lg.x, z: lg.z, pose: lg.pose, dir: lg.face === 0 ? 0 : lg.face || lastDir, dist, v: 0, a: 1, since: t - lg.t0, left: lg.t1 - t };
      const u = (t - lg.t0) / (lg.t1 - lg.t0);
      return { x: lg.x, z: lg.z, pose: 'walk', dir: lg.out ? 2 : 0, dist: dist + u * 0.6, v: 0.8, a: lg.out ? 1 - u : u, door: lg.door || null };
    }
  }
  return null;
}

// ------------------------------------------------------------------ THE BLOCKS (the promenade over time)
const localOf = (t, off) => { const lt = t + (off || 0) * 60, d = new Date(lt * 1000); return { key: `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`, dow: d.getUTCDay(), h: ((lt / 3600) % 24 + 24) % 24, month: d.getUTCMonth() + 1 }; };
/** members of a visit (the lead, a partner, a group, a dog): offsets behind / beside the lead (world units) + their own looks */
function membersOf(spec, r) {
  const m = [{ role: 'lead', dx: 0, dz: 0, lag: 0, seed: Math.floor(r() * 1e6) }];
  if (spec.pair) m.push({ role: spec.pair === 'meet' ? 'friend' : 'partner', dx: 0, dz: 0.55, lag: spec.pair === 'meet' ? 0 : 0.05, seed: Math.floor(r() * 1e6), arm: spec.pair !== 'meet' });
  if (spec.group) for (let i = 1; i < spec.group; i++) m.push({ role: 'guest', dx: -0.9 * Math.ceil(i / 2), dz: (i % 2 ? 0.5 : -0.3), lag: 0.55 * i, seed: Math.floor(r() * 1e6) });
  if (spec.dog) m.push({ role: 'dog', dx: 1.05, dz: -0.25, lag: -0.35, seed: Math.floor(r() * 1e6) });
  return m;
}
const heads = m => m.filter(x => x.role !== 'dog').length;
const tailOf = m => Math.max(0, ...m.map(x => x.lag));
/**
 * One phase-block's visits (PURE, cached by the caller): phase 0 | 1, k (the block index), M (the map), ctx { off, seed, party(t),
 * rain, budget, shopOpen(t), buses(t0, t1), others (the occupancy to respect: [{ t0, t1, n }]) } → [{ id, kind, look, gait, t0, t1,
 * legs, members }]
 */
function blockVisits(phase, k, M, ctx = {}) {
  const B = FOLK.block, t0 = k * B + (phase ? B / 2 : 0), t1 = t0 + B, loc = localOf(t0 + B / 2, ctx.off);
  const r = rngFrom(hashString(`folk|${ctx.seed || 1924}|${loc.key}|${phase}|${k}`));
  const party = ctx.party ? ctx.party(t0 + B / 2) : partyAt(loc.dow, loc.h);
  const mn = mixNow({ h: loc.h, dow: loc.dow, party, rain: ctx.rain || 0, budget: ctx.budget == null ? 1 : ctx.budget });
  // (×1.3: a phase's visits must fit inside its block, so its load falls off toward the block's end — the other phase fills in)
  const want = mn.n / 2 * B * 1.3, cap = phase === 0 ? Math.ceil(FOLK.cap * 0.65) : FOLK.cap, out = [];
  const occ = [...(ctx.others || [])];
  // (the peak count over [a, b): exact — it can only rise at a or where someone arrives inside it)
  const load = (a, b) => { let mx = 0; for (const tt of [a, ...occ.filter(o => o.t0 > a && o.t0 < b).map(o => o.t0)]) { let n = 0; for (const o of occ) if (tt >= o.t0 && tt < o.t1) n += o.n; if (n > mx) mx = n; } return mx; };
  let spent = 0;
  for (let tries = 0; tries < 140 && spent < want; tries++) {
    const kind = pickW(r, mn.mix), spec = KINDS[kind](r, M);
    if (spec.need === 'cart' && !M.nodes.cart) continue;
    if (spec.hours && (loc.h < spec.hours[0] || loc.h >= spec.hours[1])) continue;
    const start = t0 + 2 + r() * (B * 0.75);
    const vis = planVisit(spec, start, M, { r, rain: ctx.rain || 0, shopOpen: ctx.shopOpen ? ctx.shopOpen(start) : true, buses: ctx.buses ? ctx.buses(start, start + 300) : [] });
    if (!vis || vis.t1 > t1 - 1 || vis.t1 - vis.t0 < 4) continue;
    const members = membersOf(spec, r), n = heads(members);
    if (load(vis.t0, vis.t1) + n > cap) continue;
    if (vis.t1 + tailOf(members) > t1 - 0.5) continue;
    occ.push({ t0: vis.t0, t1: vis.t1 + tailOf(members), n });
    out.push({ id: `${phase}.${k}.${out.length}`, kind, look: spec.look, gait: spec.gait, ...vis, tEnd: vis.t1 + tailOf(members), members, party });
    spent += n * (vis.t1 - vis.t0);
  }
  return out;
}
/** the bus riders of a bus (PURE): who steps off at the stop + walks away; who boards (planned by blockVisits via { bus: true }) */
function busRiders(bus, M, ctx = {}) {
  const r = rngFrom(hashString(`riders|${bus.id}`)), out = [];
  for (let i = 0; i < bus.riders.off; i++) {
    const t = bus.tA + BUS.offAt + i * BUS.offGap, door = { x: bus.x(bus.tA) + bus.len / 2 - 0.9, z: FOLK.busZ };
    const spec = { look: r() < 0.5 ? 'commuter' : r() < 0.5 ? 'lady' : 'walker', gait: 'walk', goals: [{ from: 'bus' }, { at: { x: door.x + 0.7, z: FOLK.curbZ - 0.3 } }, ...(r() < 0.3 ? [{ door: 'shop' }] : [{ exit: r() < 0.25 ? 'cross' : 'any' }])] };
    const vis = planVisit(spec, t, M, { r, rain: ctx.rain || 0, shopOpen: ctx.shopOpen ? ctx.shopOpen(t) : true });
    if (!vis) continue;
    vis.legs.unshift({ k: 'fade', x: door.x, z: door.z, t0: t - 0.4, t1: t, out: false, bus: bus.id }); vis.t0 = t - 0.4;
    const members = membersOf(spec, r);
    out.push({ id: `${bus.id}.off${i}`, kind: 'busrider', look: spec.look, gait: 'walk', ...vis, tEnd: vis.t1 + tailOf(members), members });
  }
  return out;
}

/**
 * EVERYONE ON THE PROMENADE at t (PURE given the caches): → { visits: [visit], members: [{ vid, m (member), s (its state), look, kind }],
 * buses: [bus on screen + its x] }. world: { L, M, ctx } — the caller passes `cache` (a Map) so the blocks are planned once.
 */
export function folkAt(t, world, cache = new Map()) {
  const { M, ctx = {} } = world, L = world.L, B = FOLK.block;
  const get = (key, make) => { if (!cache.has(key)) { cache.set(key, make()); if (cache.size > 40) cache.delete(cache.keys().next().value); } return cache.get(key); };
  const hourBuses = hAbs => get(`bus|${hAbs}|${ctx.forceBus ? 1 : 0}`, () => { const loc = localOf(hAbs * 3600 + 1, ctx.off); return busesOf(L, loc.key, Math.floor(loc.h), hAbs * 3600 - (((ctx.off || 0) * 60) % 3600 + 3600) % 3600, { force: !!ctx.forceBus }); });
  const busesNear = (a, b) => { const out = []; for (let h = Math.floor(a / 3600) - 1; h <= Math.floor(b / 3600) + 1; h++) out.push(...hourBuses(h)); return out.filter(x => x.tE < b + 600 && x.tX > a - 600); };
  const riders = bus => get(`riders|${bus.id}`, () => busRiders(bus, M, ctx));
  // (FP3a: the bus's door shuts 3–5 s after the LAST rider the planner placed — off or on — seeded per bus; never after the departure)
  const doorShut = b => get(`shut|${b.id}`, () => {
    let last = b.tA + 1;
    const k0 = Math.floor(b.tB / B);
    for (let k = k0 - 1; k <= k0 + 1; k++) for (const v of [...A(k), ...Bv(k)]) for (const lg of v.legs) if (lg.k === 'fade' && lg.bus === b.id) last = Math.max(last, lg.t1);
    for (const v of riders(b)) for (const lg of v.legs) if (lg.k === 'fade' && lg.bus === b.id) last = Math.max(last, lg.t1);
    const r = rngFrom(hashString(`shut|${b.id}`));
    return Math.min(b.tD - 0.5, last + BUS.shut[0] + r() * (BUS.shut[1] - BUS.shut[0]));
  });
  const cx = { ...ctx, buses: busesNear };
  const occOf = vs => vs.map(v => ({ t0: v.t0, t1: v.tEnd || v.t1, n: heads(v.members) }));
  const A = k => get(`A|${k}`, () => { const t0 = k * B; return blockVisits(0, k, M, { ...cx, others: busesNear(t0, t0 + B).flatMap(b => occOf(riders(b))) }); });
  const Bv = k => get(`B|${k}`, () => { const t0 = k * B + B / 2, bs = busesNear(t0, t0 + B); return blockVisits(1, k, M, { ...cx, others: [...occOf(A(k)), ...occOf(A(k + 1)), ...bs.flatMap(b => occOf(riders(b)))] }); });
  const ka = Math.floor(t / B), kb = Math.floor((t - B / 2) / B);
  const buses = busesNear(t, t).filter(b => t >= b.tE && t < b.tX);
  const all = [...A(ka), ...Bv(kb), ...busesNear(t - 400, t + 10).flatMap(b => riders(b))].filter(v => t >= v.t0 && t < (v.tEnd || v.t1));
  const members = [];
  for (const v of all) {
    for (const m of v.members) {
      const s = visitAt(v, t - m.lag);
      if (!s) continue;
      const ang = s.dir === 1 || s.dir === -1 ? 0 : 1;   // (walking along x: a partner beside = deeper; along z: beside = across)
      let off = ang ? { x: m.dz, z: -m.dx * (s.dir === 2 ? -1 : 1) } : { x: m.dx * (s.dir || 1), z: m.dz }, dir = s.dir;
      // (talking: the partner / friend steps round to face the lead; sitting: beside on the bench; a group at a pose: in a loose knot)
      if (m.role !== 'lead' && m.role !== 'dog' && s.pose !== 'walk') {
        const d = s.dir === 1 || s.dir === -1 ? s.dir : 1;
        if (s.pose === 'chat' || s.pose === 'shop' || s.pose === 'cart') { off = { x: d * 0.95, z: 0.12 }; dir = s.pose === 'chat' ? -d : s.dir; }
        else if (s.pose === 'sit') off = { x: 0.72, z: 0 };
        else { const i = Math.max(1, Math.round(Math.abs(m.dx) / 0.9)); off = { x: (m.lag % 1.1 > 0.5 ? -1 : 1) * 0.75 * i, z: (i % 2 ? 0.2 : -0.15) }; }   // (waiting: a loose knot beside the lead)
      }
      // (never past the railing, never under the dock)
      const zz = s.z + (m.role === 'lead' ? 0 : off.z);
      if (m.role !== 'lead' && (zz > FOLK.farZ + 0.25 || zz < FOLK.zMin - 0.3)) off.z = Math.max(FOLK.zMin - 0.3, Math.min(FOLK.farZ + 0.25, zz)) - s.z;
      members.push({ vid: v.id, kind: v.kind, look: v.look, gait: v.gait, party: !!v.party, m, s: { ...s, dir, x: s.x + (m.role === 'lead' ? 0 : off.x), z: s.z + (m.role === 'lead' ? 0 : off.z) } });
    }
  }
  return { visits: all, members, buses: buses.map(b => { const sh = doorShut(b); return { ...b, shut: sh, xNow: b.x(t), door: t >= b.tA + 0.8 && t < sh }; }) };
}

// ------------------------------------------------------------------ THE LOBBY LINE (Lobby 2.0's hook — the owner's "LINE AT THE SPEAKEASY")
/**
 * Where n guests stand in the line (PURE): from beside the side door going LEFT along the shopfront, then bending down toward the
 * bottom-left corner (two-deep once it runs out of room); guests past `queue` wait on the open floor beside it. Never cut by the
 * screen's left edge (margin pt), never under the dock (z ≥ FOLK.zMin), the door always clear. → [{ x, z, i, wait: bool }]
 */
export function linePlaces(L, n, { margin = 9, queue = 5 } = {}) {
  const cam = L.cam, s = L.speakeasy, F = FOLK, gap = 0.95, out = [];
  const doorL = s.x0 + s.door.u0 - 0.7;                     // (left of the door, its front clear)
  const xMin = z => (margin - cam.VPX) * z / cam.F + 0.45;   // (the screen's left edge + a margin, at depth z)
  // the run along the shopfront (z just in front of the facade), then the bend down toward the corner
  const run = [];
  for (let x = doorL; x >= xMin(F.doorZ - 0.35); x -= gap) run.push({ x, z: F.doorZ - 0.35 });
  const bendX = run.length ? run[run.length - 1].x : doorL;
  for (let z = F.doorZ - 0.35 - gap; z >= F.zMin + 0.05; z -= gap * 0.85) run.push({ x: Math.max(xMin(z), bendX + 0.25), z });
  for (let i = 0; i < Math.min(n, queue); i++) out.push({ ...(run[i] || { x: bendX + 0.9, z: F.zMin + 0.2 + i * 0.3 }), i, wait: false });
  // two-deep: a second file just in front when the queue is long; the extra guests beside it on the open floor
  const xs0 = Math.max(xMin(F.doorZ - 2), bendX + 0.6), xs1 = doorL - 0.4;
  for (let i = queue; i < n; i++) { const j = i - queue, cols = Math.max(1, Math.floor((xs1 - xs0) / 1.05) + 1); out.push({ x: xs1 - (j % cols) * 1.05, z: F.doorZ - 1.85 - Math.floor(j / cols) * 1.0 - (j % 2) * 0.2, i, wait: true }); }
  return out;
}
/** the line's rect (the routes go round it) */
export function lineRect(L, n) {
  const P = linePlaces(L, n); if (!P.length) return null;
  return { x0: Math.min(...P.map(p => p.x)) - 0.6, x1: Math.max(...P.map(p => p.x)) + 0.6, z0: Math.min(...P.map(p => p.z)) - 0.5, z1: FOLK.doorZ + 0.2 };
}

// ------------------------------------------------------------------ THE ROOFTOP (its own small zone: the hatch, the railing, the bar cart)
/** the roof's numbers: who's up there by the clock — party nights + summer weekend nights a crowd (cap), otherwise 0–1 */
export function roofCrowd({ h = 12, dow = 3, month = 10, party = false, rain = 0 } = {}) {
  if (rain > 0.3) return { n: 0, kinds: {} };
  const summer = month >= 6 && month <= 8, weekendNight = (dow === 5 || dow === 6) && (h >= 19 || h < 1);
  if (party || (summer && weekendNight)) return { n: h >= 20 || h < 1.5 ? 5 : h >= 19 ? 3 : 0, kinds: { dancer: 3, toast: 2, railing: 2, bar: 1.5 } };
  if (h >= 9 && h < 11.5 && month >= 4 && month <= 10) return { n: 0.6, kinds: { gardener: 1 } };
  if ((h >= 18 && h < 23)) return { n: 0.5, kinds: { view: 1 } };
  return { n: 0.08, kinds: { view: 1 } };
}
/** the roof's map (world x / z on the deck): the hatch (the stair house's door), the front parapet's spots, the dance floor, the bar
 *  cart, the garden beds; R.y: the deck's height */
export function roofMap(L) {
  const s = L.speakeasy, rf = L.roof, bk = rf.bulkhead, y = s.h;
  return {
    y, hatch: { x: (bk.x0 + bk.x1) / 2, z: bk.z0 - 0.3 },
    rail: u => ({ x: s.x0 + u, z: s.z0 + 0.8 }),
    floor: (u, d) => ({ x: s.x0 + u, z: s.z0 + 1.4 + d }),
    bar: { x: s.x0 + 7.4, z: s.z0 + 2.3 },
    beds: (rf.planters || []).map(p => ({ x: p.x, z: p.z - 0.7 })),
    rects: [{ x0: bk.x0 - 0.2, x1: bk.x1 + 0.2, z0: bk.z0, z1: bk.z1 + 0.5 }], circles: [{ x: rf.chimney.x, z: rf.chimney.z + rf.chimney.w / 2, r: rf.chimney.w }],
  };
}
/**
 * The roof's visits of one phase-block (PURE): everyone comes up through the hatch + goes back down it (never pops in). Party nights +
 * summer weekend nights: guests (dancing in pairs, a toast, at the bar cart, at the parapet); otherwise 0–1 (someone stepping out for
 * the view; the gardener by day in the growing months). ctx: { off, seed, party(t), rain }
 */
function roofVisits(phase, k, L, ctx = {}) {
  const B = 600, t0 = k * B + (phase ? B / 2 : 0), t1 = t0 + B, loc = localOf(t0 + B / 2, ctx.off), R = roofMap(L), F = FOLK;
  const r = rngFrom(hashString(`roof|${ctx.seed || 1924}|${loc.key}|${phase}|${k}`));
  const party = ctx.party ? ctx.party(t0 + B / 2) : partyAt(loc.dow, loc.h), crowd = roofCrowd({ h: loc.h, dow: loc.dow, month: loc.month, party, rain: ctx.rain || 0 });
  const want = crowd.n / 2 * B, out = [], occ = [...(ctx.others || [])];
  const load = (a, b) => { let mx = 0; for (const tt of [a, ...occ.filter(o => o.t0 > a && o.t0 < b).map(o => o.t0)]) { let n = 0; for (const o of occ) if (tt >= o.t0 && tt < o.t1) n += o.n; mx = Math.max(mx, n); } return mx; };
  const M = { rects: R.rects, circles: R.circles };
  let spent = 0;
  for (let tries = 0; tries < 30 && spent < want; tries++) {
    const kind = pickW(r, crowd.kinds); if (!kind) break;
    const pair = kind === 'dancer' || (kind === 'toast' && r() < 0.6), n = pair ? 2 : 1;
    const start = t0 + 3 + r() * B * 0.5, stay = kind === 'gardener' ? 150 + r() * 200 : kind === 'view' ? 40 + r() * 80 : 90 + r() * 200;
    const spot = kind === 'dancer' ? R.floor(4.2 + r() * 3, r() * 1.2) : kind === 'bar' ? { x: R.bar.x - 1.0, z: R.bar.z } : kind === 'gardener' ? R.beds[Math.floor(r() * R.beds.length)] || R.rail(6) : R.rail(3.4 + r() * 6.6);
    const pose = { dancer: 'dance', toast: 'toast', railing: 'lean', bar: 'cart', gardener: 'garden', view: 'lean' }[kind];
    const face = kind === 'railing' || kind === 'view' ? (r() < 0.5 ? 0 : 2) : kind === 'bar' ? 1 : r() < 0.5 ? -1 : 1, v = F.speed.stroll;
    const legs = [], st = { ...R.hatch };
    let now = start;
    legs.push({ k: 'fade', x: st.x, z: st.z, t0: now, t1: now + 0.8, out: false }); now += 0.8;
    const p1 = route(M, st, spot), l1 = pathLen(p1); legs.push({ k: 'walk', pts: p1, t0: now, t1: now + l1 / v, v }); now += l1 / v;
    legs.push({ k: 'pose', pose, x: spot.x, z: spot.z, t0: now, t1: now + stay, face }); now += stay;
    const p2 = route(M, spot, st), l2 = pathLen(p2); legs.push({ k: 'walk', pts: p2, t0: now, t1: now + l2 / v, v }); now += l2 / v;
    legs.push({ k: 'fade', x: st.x, z: st.z, t0: now, t1: now + 0.8, out: true }); now += 0.8;
    if (now > t1 - 1) continue;
    if (load(start, now) + n > FOLK.roofCap) continue;
    const look = kind === 'gardener' ? 'worker' : party || kind === 'dancer' || kind === 'toast' ? 'guest' : 'stroll';
    const members = [{ role: 'lead', dx: 0, dz: 0, lag: 0, seed: Math.floor(r() * 1e6) }];
    if (pair) members.push({ role: 'partner', dx: 0, dz: 0.5, lag: 0.6, seed: Math.floor(r() * 1e6) });
    occ.push({ t0: start, t1: now + 0.6, n });
    out.push({ id: `r${phase}.${k}.${out.length}`, kind, look, gait: 'stroll', legs, t0: start, t1: now, tEnd: now + 0.6, members, party, roof: true });
    spent += n * (now - start);
  }
  return out;
}
/** who's on the roof at t (PURE given the cache) → members like folkAt's (s.y: the deck) */
export function roofAt(t, L, ctx = {}, cache = new Map()) {
  const B = 600, get = (key, make) => { if (!cache.has(key)) { cache.set(key, make()); if (cache.size > 12) cache.delete(cache.keys().next().value); } return cache.get(key); };
  const A = k => get(`RA|${k}`, () => roofVisits(0, k, L, ctx));
  const Bv = k => get(`RB|${k}`, () => roofVisits(1, k, L, { ...ctx, others: [...A(k), ...A(k + 1)].map(v => ({ t0: v.t0, t1: v.tEnd, n: v.members.length })) }));
  const all = [...A(Math.floor(t / B)), ...Bv(Math.floor((t - B / 2) / B))].filter(v => t >= v.t0 && t < v.tEnd);
  const members = [];
  for (const v of all) for (const m of v.members) {
    const s = visitAt(v, t - m.lag); if (!s) continue;
    let off = { x: (s.dir === 1 || s.dir === -1 ? -s.dir * 0.4 : 0.5), z: m.role === 'lead' ? 0 : 0.35 }, dir = s.dir;
    if (m.role !== 'lead' && s.pose !== 'walk') { const d = s.dir === 1 || s.dir === -1 ? s.dir : 1; off = { x: d * 0.85, z: 0.1 }; if (s.pose === 'dance' || s.pose === 'toast') dir = -d; }
    members.push({ vid: v.id, kind: v.kind, look: v.look, party: !!v.party, m, s: { ...s, dir, x: s.x + (m.role === 'lead' ? 0 : off.x), z: s.z + (m.role === 'lead' ? 0 : off.z) } });
  }
  return { visits: all, members };
}
