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
import { partyAtT } from './harbor-moments.js';
import { carsAt } from './harbor-traffic.js';
import { workSpawns, workKey } from './harbor-snowwork.js';
import { trafficHold, inHold } from './harbor-legend.js';
import { DANCE, RING, ringAt, danceSlot, danceSlotsNear, danceSpot, watchSpot, danceLevel, VENDOR, cartEvening, cartAt } from './harbor-routines.js';
import { crewSpan, crewAt, tracesAt } from './harbor-crew.js';
import { witnessWindow, suppressed, reactVisit, hiderOf, WITNESS } from './harbor-witness.js';
import { raidAt, raidHold } from './harbor-raid.js';
import { cabEvents, cabPlan, standEvents, standPlan } from './harbor-cabs.js';
import { totGroups, zombieGroups, procWindow, procWalkers, procHold, PROC, ZOMBIE, halloweenAt } from './harbor-holidayfolk.js';
import { PARADE, paradeWindow, paradeHold, paradeUnits, unitsAt, unitPeople, paradeCrowd } from './harbor-parade.js';

/** the people's numbers (world units, seconds): block length, the cap on screen, gaits (units / s — a person is 2.1 units), the
 *  walkable floor (zMin: behind the front row's globes + maple; zMax: in front of the tall lamps + the bench), the kerbs */
export const FOLK = Object.freeze({
  block: 480, cap: 12, roofCap: 6, h: 2.1,
  // (FP3a, the owner's 8P note 4 — "they walk too fast": the everyday pace ~25 % slower, a relaxed 1920s stroll; strollers + couples
  // the slowest, commuters brisker, joggers clearly faster; each person ±12 % of their gait: planVisit)
  // (FP3b, the owner after FP3a — "a little TOO SLOW now": the everyday gaits back up ~12 %; the jog unchanged)
  // (PEO, Oct 25 — judged against real walking, 1 unit = 0.83 m: a walk 1.3 m/s, a stroll / window-shoppers / couples 1.0, the commuter's
  // brisk 1.5, a kid 1.3, a jog 2.6; each person ± 12 % — before: walk 1.07 m/s, stroll 0.75, brisk 1.4)
  // (11a-1: a zombie's shamble ~0.6 m/s; the procession's slow pace is core/harbor-holidayfolk.js#PROC.v)
  speed: { walk: 1.57, brisk: 1.8, stroll: 1.2, jog: 3.1, kid: 1.57, line: 0.75, shamble: 0.72 },
  zMin: 38.75, zMax: 52.25, curbZ: 53.2, roadZ: 53.6, farZ: 63.55, doorZ: 43.55, busZ: 55.4,
});

/** FP3a (FREV A4) — THE PEOPLE DRAWN BY THE PHONE'S TIER: at most TIER_CAP[tier] heads on screen (the plan is the same on every
 *  phone; an older phone / Low Power draws fewer). Whole visits are kept (a couple, a dog walker + the dog), in a fixed order by
 *  their id — every phone at the same tier keeps the same people. The roof's guests are off at tier 0 (people.js). */
export const TIER_CAP = Object.freeze([6, 9, 12]);
export function capByTier(members, tier = 2) {
  const tt = Math.max(0, Math.min(2, tier | 0));
  // (11a-1 — THE PROCESSION is on top of the crowd, like the dance circle: in the street, not on the promenade; an older phone draws
  // every other walker (tier 0) or two in three (tier 1) — the same ones on every phone of that tier: their running number)
  if (members.some(m => m.kind === 'proc')) {
    const pr = members.filter(m => m.kind === 'proc' && (tt === 2 || (tt === 1 ? (m.m.pn % 3) !== 2 : m.m.pn % 2 === 0)));
    return [...capByTier(members.filter(m => m.kind !== 'proc'), tt), ...pr];
  }
  const cap = TIER_CAP[tt];
  // (FP3b: the dance circle at tier 0 is its first DANCE.tier0 dancers — the square — and a routine's people are kept FIRST)
  // (POLISH 4: the dance circle is ON TOP of the crowd — its dancers always drawn (tier 0: the square), the cap is the crowd's)
  const ms = tt === 0 ? members.filter(m => !(m.routine === 'dance' && m.kind === 'dancer' && m.idx >= DANCE.tier0)) : members;
  if (cap >= FOLK.cap) return ms;
  const dancers = ms.filter(m => m.routine === 'dance' && m.kind === 'dancer'), crowd = ms.filter(m => !(m.routine === 'dance' && m.kind === 'dancer'));
  // (POLISH 4's speed round: at TIER 0 — the slow phone — the square of dancers counts INSIDE the cap again, as before this pass; tiers 1–2
  // keep the circle on top of the crowd)
  return [...dancers, ...capCrowd(crowd, tt === 0 ? Math.max(0, cap - dancers.length) : cap)];
}
function capCrowd(ms, cap) {
  const heads = new Map(), rank = new Map();
  for (const m of ms) { heads.set(m.vid, (heads.get(m.vid) || 0) + (m.m.role === 'dog' ? 0 : 1)); if (m.routine) rank.set(m.vid, m.kind === 'dancer' ? 2 : 1); }
  const keep = new Set(); let n = 0;
  for (const v of [...heads.keys()].sort((a, b) => (rank.get(b) || 0) - (rank.get(a) || 0) || hashString(a) - hashString(b) || (a < b ? -1 : 1))) { const h = heads.get(v); if (n + h <= cap) { n += h; keep.add(v); } }
  return ms.filter(m => keep.has(m.vid));
}

// ------------------------------------------------------------------ WHO'S OUT WHEN (data — tune here)
/** periods of the day (local hours [from, to)): n = the people out on average [weekday, weekend] (~¾ of them on screen: the rest are
 *  walking in / out past the edges or round behind the speakeasy); mix = the kinds' weights
 *  (KINDS below). Weekends: busier (n) and LATER (lateShift moves the evening's hours on by an hour). */
// (POLISH 4 — THE PEOPLE CALMER, the owner: "a little too chaotic — too many people walking briskly, in and out of the speakeasy".
// ON SCREEN: a weekday daytime 4–5; lunch + after work 6–7; a normal night after dark 3–4; weekend + party nights 8–12 (the dance
// circle on top); late at night 0–3 — tests/harbor-people.test.mjs measures it over a simulated day. LINGER MORE, PASS THROUGH LESS:
// the mix is mostly people who STAY a while — the bench (minutes), the railing over the water, a pair stopped chatting, the bus stop,
// the cart — and only a few walking straight through. THE SPEAKEASY STAYS SECRET: nobody walks into it from the mix — the barbershop's
// occasional customer by day; the side door's guests come on their own schedule (DOOR_STREAM) + THE LINE on party nights (lineNight))
export const MIX = Object.freeze([
  { id: 'small-hours', from: 2, to: 5.5, n: [0.3, 0.5], mix: { nightworker: 2, lone: 1 } },
  { id: 'early', from: 5.5, to: 8, n: [2.3, 1.7], mix: { dogwalker: 3, worker: 2, water: 1, bench: 1 } },
  { id: 'commute', from: 8, to: 9.25, n: [5.2, 3.4], mix: { busrider: 4, brisk: 1.6, newsboy: 1.5, dogwalker: 1.5, worker: 1, bench: 0.6 } },
  { id: 'morning', from: 9.25, to: 11.5, n: [3.5, 4.6], mix: { bench: 3, water: 2.5, couple: 2.5, dogwalker: 1.5, window: 1.5, meet: 1.5, busrider: 1.5, stroller: 0.8, customer: 0.3, newsboy: 0.5 } },
  { id: 'midday', from: 11.5, to: 14, n: [5, 5.2], mix: { lunch: 4, bench: 1.2, couple: 2.5, water: 2, meet: 2, window: 1.2, busrider: 1.2, stroller: 0.8, brisk: 0.5, customer: 0.3 } },
  { id: 'afternoon', from: 14, to: 16.25, n: [3.3, 4.6], mix: { bench: 3, water: 2.5, couple: 2.5, skyline: 0.8, dogwalker: 1.5, window: 1, meet: 1.5, busrider: 1.2, newsboy: 0.6, stroller: 0.8, customer: 0.3 } },
  { id: 'homeward', from: 16.25, to: 18.5, n: [5.1, 4.6], mix: { busrider: 3.5, homeward: 1.2, couple: 2, bench: 2, water: 1.5, cart: 1.5, meet: 1.5, dogwalker: 1, stroller: 0.6, customer: 0.2 } },
  { id: 'evening', from: 18.5, to: 22, n: [2.5, 3.3], mix: { couple: 3, water: 2, skyline: 1.4, stargazer: 1.5, dogwalker: 1.5, cart: 2, bench: 1.5, meet: 1, stroller: 0.6, jogger: 0.25 } },
  { id: 'late', from: 22, to: 24, n: [2.3, 3.1], mix: { couple: 2, water: 1.5, skyline: 1, lone: 1.5, stargazer: 1, bench: 0.8, straggler: 0.4 } },
  { id: 'night', from: 24, to: 26, n: [1.3, 1.9], mix: { lone: 2, couple: 1, straggler: 0.6, water: 0.5 } },
]);
/** party nights: the guests' weight × this, the count × partyN; rain (0..1): the count × (1 − rainCut × rain), the gaits × (1 + rainFast) */
export const MOOD = Object.freeze({ party: 3.2, partyN: 3.3, weekendN: 1, lateShift: 1, rainCut: 0.55, rainFast: 0.2, stormCut: 0.4, fogSlow: 0.18 });

/** the period at local hour h (0..24, a weekend shifts the evening on by MOOD.lateShift) */
function periodAt(h, weekend = false) {
  let x = h < MIX[0].from ? h + 24 : h;
  if (weekend && x >= 18.5 && x < 26 + MOOD.lateShift) x = x - MOOD.lateShift < 18.5 ? 18.6 : x - MOOD.lateShift;   // (the evening runs later)
  return MIX.find(p => x >= p.from && x < p.to) || MIX[0];
}
/** how many people on average now + the kinds' weights (PURE). ctx: { h, dow, party, rain, budget } */
export function mixNow({ h = 12, dow = 3, party = false, rain = 0, budget = 1, rush = 0 } = {}) {
  // (9a: a STORM — the heaviest rain — almost empties the promenade: on top of the rain's cut)
  const storm = Math.max(0, Math.min(1, (rain - 0.75) / 0.2));
  const weekend = dow === 0 || dow === 6 || (dow === 5 && h >= 17), p = periodAt(h, weekend);
  let n = p.n[weekend ? 1 : 0] * (party ? MOOD.partyN : 1);
  n *= 1 - MOOD.rainCut * Math.max(0, Math.min(1, rain));
  n *= 1 - MOOD.stormCut * storm;
  // (11a-2 — BLACK FRIDAY's SHOPPING RUSH: more people out, most of them hurrying — core/harbor-xmas.js#xmasPrelude's rush)
  n *= 1 + 0.7 * Math.max(0, Math.min(1, rush));
  n *= Math.max(0, Math.min(1, budget));
  const mix = { ...p.mix };
  if (rush > 0.05) { mix.brisk = (mix.brisk || 0.5) + 2.4 * rush; mix.couple = (mix.couple || 0.5) * (1 + 0.5 * rush); if (mix.bench) mix.bench *= 1 - 0.6 * rush; if (mix.stargazer) delete mix.stargazer; }
  // (POLISH 4: party nights — more people out ENJOYING it: couples, the water, the bench; the guests themselves come by THE LINE)
  if (party) { mix.couple = (mix.couple || 1) * 1.6; mix.meet = (mix.meet || 0) + 1.2; mix.water = (mix.water || 0) + 0.8; }
  // (9e's JOGGERS' hours were weights in this mix — 1 person in ~20, the owner watched minutes and saw none; 9f: they run on their own
  // seeded lane, JOG below, one every ~1–2 min in their hours)
  // WEEKDAY LATE NIGHTS livelier (Mon–Thu, 10 pm → 1 am): more strollers, couples LEAVING THE BAR by the side door arm in arm
  // (the couples leaving the bar come out by the side door's own schedule — streamOf's `late` lane — never the random mix: POLISH 4)
  const lateWk = !weekend && !party && (h >= 22 || h < 1) && dow !== 5 && dow !== 6;
  if (lateWk) { n *= 1.3; mix.stroller = (mix.stroller || 0) + 0.8; mix.stargazer = (mix.stargazer || 0) + 0.4; }
  // A SLOWER SUNDAY MORNING (8:30 → 12:30): nobody hurrying to work — strolling pairs (Sunday best), the bench, the water
  const sunday = dow === 0 && h >= 8.5 && h < 12.5;
  if (sunday) { delete mix.brisk; delete mix.busrider; delete mix.worker; mix.couple = (mix.couple || 1) * 1.6; mix.stroller = (mix.stroller || 0) + 1.5; mix.water = (mix.water || 0) + 0.8; }
  if (rain > 0.3) { delete mix.lunch; delete mix.water; delete mix.stargazer; delete mix.skyline; if (mix.jogger) mix.jogger *= 0.3; if (mix.bench) mix.bench *= 0.15; mix.shelter = 1.6; }
  if (rain > 0.6) delete mix.jogger;
  return { id: p.id, n: Math.min(FOLK.cap, n), mix, weekend, party: !!party, sunday };
}

// ------------------------------------------------------------------ THE WALKABLE MAP (world x, z on the ground)
/**
 * The map for a layout: nodes (where goals are), obstacles (rects + circles the routes go round), exits. Built from the promenade's
 * real pieces (core/harbor-promenade.js): the bench, the cart, the inlay, the crossing, the speakeasy's doors, the bus stop.
 * line: an active lobby line's rect (people route round it).
 */
export function folkMap(L, { event = false, line = null, cart = false, ring = false } = {}) {
  const cam = L.cam, s = L.speakeasy, cw = L.crosswalk, b = L.bench, F = FOLK;
  const hwAt = z => cam.hw(z);
  const crab = (L.trees || []).find(t => t.kind === 'crab');
  const cx = (cw.x0 + cw.x1) / 2, cww = cw.x1 - cw.x0;
  const nodes = {
    shopDoor: { x: s.x0 + (s.shop.door[0] + s.shop.door[1]) / 2, z: F.doorZ },
    sideDoor: { x: s.x0 + (s.door.u0 + s.door.u1) / 2, z: F.doorZ },
    shopWin: { x: s.x0 + (s.shop.win[0] + s.shop.win[1]) / 2 + 0.6, z: F.doorZ - 0.35 },
    // (PROM — THE WATER BENCH faces the harbor: its seat behind its back (from us), its sitters face away — reached from the water side)
    bench: b.face === 'water' ? { x: b.x, z: b.z + 0.95 } : { x: b.x, z: b.z - 0.2 },
    benchFront: b.face === 'water' ? { x: b.x, z: b.z + 2.05 } : { x: b.x, z: b.z - 1.4 },
    benchFace: b.face === 'water' ? 2 : 0,
    // (PROM: a couple stopped by the water bench, watching the skyline — seen from behind)
    skyline: { x: b.x + b.w / 2 + 1.1, z: b.z + 1.5 },
    inlay: { x: L.medallion.x, z: L.medallion.z },
    curbWait: { x: cx, z: F.curbZ },
    farWait: { x: cx, z: F.farZ },
    busStop: { x: busStopX(L) + 0.75, z: F.curbZ - 0.05 },
    busDoor: { x: busStopX(L), z: F.busZ },
    // (POLISH 5 — THE HYDRANT: where a dog walker stands so the dog (on the right, a step ahead) has its nose at the hydrant)
    hydrant: L.hydrant ? { x: L.hydrant.x - 1.5, z: F.zMin + 0.02 } : null,
    // (FP3b — the vendor spot at the front curb: the VENDOR beside his tray of chestnuts at the cart's end (behind the cart his head would
    // hide under its counter at phone size), a customer a step further out facing him. SP5 — the owner: the vendor stood on the cart's LEFT,
    // right behind Halloween's front-strip jack-o'-lantern (core/harbor-spots.js#corner-right = the cart's rest − 2.5) → the cart's RIGHT
    // side is his serving spot now, the customer right of him; the newsboy's stand (8b's hook) would share the same rule)
    // (the framing maple's trunk stands at the cart's right end (x + 2.05, nearer the camera): the vendor steps past it, the customer past him)
    // (PROM: on the cart's HANDLE side — L.cart.hand: its left end now, away from the compass)
    cart: L.cart && L.cart.shown !== false ? { x: L.cart.x + (L.cart.hand || 1) * 4.3, z: Math.max(FOLK.zMin + 0.05, L.cart.z + 0.6) } : null,
    vendor: L.cart && L.cart.shown !== false ? { x: L.cart.x + (L.cart.hand || 1) * 2.95, z: L.cart.z + 0.45 } : null,
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
    // (PROM: the water bench is LIVE + faces the harbor — the strip behind it, where its sitters sit, is open from its right; only the
    // corner left of it, under the blade + the crabapple, stays closed)
    ...(b.face === 'water' ? [{ id: 'back-left', x0: -1e3, x1: b.x - b.w / 2 - 0.25, z0: b.z - 0.05, z1: F.roadZ }, { id: 'back-bench', x0: b.x - b.w / 2 - 0.25, x1: b.x + b.w / 2 + 0.55, z0: b.z + 2.6, z1: F.roadZ }, { id: 'bench', x0: b.x - b.w / 2 - 0.15, x1: b.x + b.w / 2 + 0.15, z0: b.z - 0.25, z1: b.z + 0.55 }]
      : [{ id: 'back-left', x0: -1e3, x1: b.x + b.w / 2 + 0.55, z0: b.z - 0.05, z1: F.roadZ }]),
    { id: 'road', x0: -1e3, x1: 1e3, z0: F.roadZ, z1: F.farZ - 0.3 },
    { id: 'curb-l', x0: -1e3, x1: cw.x0 + cww * 0.12, z0: F.zMax + 0.1, z1: F.roadZ },
    { id: 'curb-r', x0: cw.x1 - cww * 0.12, x1: 1e3, z0: F.zMax + 0.1, z1: F.roadZ },
  ];
  if (line) rects.push({ id: 'line', ...line });
  const circles = [];
  for (const l of L.lamps || []) if (l.kind === 'tall') circles.push({ x: l.x, z: l.z, r: 0.5 });
  // (8b1 wildlife: the trash can by the front-left globe stands IN FRONT of the walkable floor — z ≤ FOLK.zMin − 0.55, the layout's
  // CAN — so no route can reach it; a circle here only added way points under the dock: none)
  // (the cart, only while it's OUT — FP3b's vendor spot is shared by time: nobody walks through it or behind its handles; the vendor's
  // own spot behind it stays free for him)
  if (cart && L.cart && L.cart.shown !== false) { const hd = L.cart.hand || 1; rects.push({ id: 'cart', x0: L.cart.x - (hd > 0 ? 1.3 : 2.0), x1: L.cart.x + (hd > 0 ? 2.0 : 1.3), z0: F.zMin - 2, z1: L.cart.z + 0.75 }); }
  // (POL4: the dance circle spreads round the compass — the closed floor reaches its outer dancers: DANCE.reach × the ring)
  // (11a-2: THE GIANT on the inlay (ring) — the closed floor its plinth's corners + a step: RING.clear)
  if (event) { const m = L.medallion; circles.push({ id: 'event', x: m.x, z: m.z, r: ring ? Math.max(m.ring * DANCE.reach + 0.4, RING.clear) + 0.6 : m.ring * DANCE.reach + 0.4 });   // (9f: + a partner's offset round the giant — a pair's chat spot is checked for the lead; the friend stands 0.55 aside)
    for (const sg of [-1, 1]) circles.push({ id: 'event', x: m.x + sg * m.ring * DANCE.side.at, z: m.z, r: DANCE.side.r }); }
  return { nodes, exits, rects, circles, hydrantSpot: L.hydrant || null, face: s.z0, cw: { x0: cw.x0 + cww * 0.22, x1: cw.x1 - cww * 0.22, z0: F.curbZ, z1: F.farZ } };
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
export function route(map, a, b, depth = 0) {
  // (POL4: a start just INSIDE a closed circle — someone planned before the dance circle spread — first steps straight out of it, then
  // routes round it: clear() lets a segment leave a circle, which let them cut straight across the dancers)
  if (depth < 3) for (const c of map.circles) {
    const d = Math.hypot(a.x - c.x, a.z - c.z);
    if (d < c.r - 1e-6 && d > 1e-3 && Math.hypot(b.x - c.x, b.z - c.z) > c.r) {
      const e = { x: c.x + (a.x - c.x) / d * (c.r + 0.36), z: c.z + (a.z - c.z) / d * (c.r + 0.36) };
      if (!map.rects.some(o => inRect(e, o))) return [a, ...route(map, e, b, depth + 1)];
    }
  }
  if (clear(map, a, b)) return [a, b];
  const pad = 0.35, way = [];
  for (const r of map.rects) for (const [x, z] of [[r.x0 - pad, r.z0 - pad], [r.x1 + pad, r.z0 - pad], [r.x0 - pad, r.z1 + pad], [r.x1 + pad, r.z1 + pad]])
    if (z >= FOLK.zMin - 0.3 && Math.abs(x) < 900 && !map.rects.some(o => inRect({ x, z }, o)) && !map.circles.some(c => Math.hypot(x - c.x, z - c.z) < c.r)) way.push({ x, z });   // (FP3b: never a corner inside a circle — the closed compass)
  // (11a-2: a BIG circle — the giant's floor — gets twelve waypoints: six's chords cut inside a wide circle, so no way round was found)
  for (const c of map.circles) for (let i = 0, nw = c.r > 3.5 ? 12 : 6; i < nw; i++) { const a2 = i * 2 * Math.PI / nw, p = { x: c.x + Math.cos(a2) * (c.r + pad), z: c.z + Math.sin(a2) * (c.r + pad) }; if (!map.rects.some(o => inRect(p, o)) && !map.circles.some(o => o !== c && Math.hypot(p.x - o.x, p.z - o.z) < o.r)) way.push(p); }   // (POL4: never a way point inside another circle)
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
export const BUS = Object.freeze({ len: 7.8, v: 6.5, brake: 2.2, go: 1.4, offAt: 2.2, offGap: 1.5, board: 6, shut: [6, 9], go0: 1, perHour: { day: [2, 4], late: [1, 1], night: [0, 0] } });
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
    // the door shuts 6–9 s after the last rider (POL4: between FP3a's 3–5 and the old whole dwell); then away on GREEN with time to clear the crossing (else the next green)
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
  stroller: (r, M) => ({ look: 'stroll', gait: 'stroll', goals: [{ from: anySide(r) }, ...(r() < 0.7 ? [{ at: jitter(r, M.nodes.inlay, 2.5, 1.5) }, { pose: 'look', dur: 8 + r() * 16 }] : []), { exit: 'any' }] }),
  // (POLISH 4 — the bench at any hour: one or two sitting a few minutes, reading the day, watching the harbor)
  bench: (r, M) => ({ look: r() < 0.5 ? 'walker' : 'lady', gait: 'stroll', sit: true, goals: [{ from: anySide(r) }, { at: M.nodes.benchFront }, { at: M.nodes.bench, seat: true }, { pose: 'sit', dur: 120 + r() * 200, face: M.nodes.benchFace || 0 }, { at: M.nodes.benchFront }, { exit: 'any' }] }),
  // (PROM — THE WATER BENCH: a couple stops beside it to watch the skyline, seen from behind)
  skyline: (r, M) => ({ look: 'couple', gait: 'stroll', pair: true, goals: [{ from: anySide(r) }, { at: jitter(r, M.nodes.skyline, 0.4, 0.3) }, { pose: 'watch', dur: 50 + r() * 90, face: 2 }, { exit: 'any' }] }),
  brisk: (r) => ({ look: 'commuter', gait: 'brisk', goals: [{ from: r() < 0.3 ? 'cross' : anySide(r) }, { exit: r() < 0.3 ? 'cross' : 'any' }] }),
  jogger: (r) => ({ look: 'jogger', gait: 'jog', goals: [{ from: r() < 0.25 ? 'cross' : anySide(r) }, { exit: r() < 0.25 ? 'cross' : 'any' }] }),
  // (POLISH 5: now and then the dog stops to SNIFF THE HYDRANT on the way — the walker waits, facing it)
  dogwalker: (r, M) => { const sniff = M.nodes.hydrant && r() < 0.42; return { look: 'walker', gait: 'stroll', dog: true, goals: [{ from: r() < 0.2 ? 'cross' : anySide(r) }, ...(sniff ? [{ at: M.nodes.hydrant }, { pose: 'wait', dur: 4.5 + r() * 3, face: 1, sniff: true }] : []), { at: floor(r, M) }, { pose: 'wait', dur: 14 + r() * 26 }, { exit: 'any' }] }; },
  worker: (r) => ({ look: 'worker', gait: 'walk', goals: [{ from: anySide(r) }, { bus: true }] }),
  busrider: (r) => ({ look: r() < 0.5 ? 'commuter' : 'walker', gait: 'walk', goals: [{ from: r() < 0.3 ? 'cross' : anySide(r) }, { bus: true }] }),
  newsboy: (r, M) => ({ look: 'newsboy', gait: 'kid', goals: [{ from: anySide(r) }, { at: jitter(r, M.nodes.inlay, 3, 1.2) }, { pose: 'wave', dur: 5 + r() * 6 }, { exit: 'any' }] }),
  couple: (r, M) => ({ look: 'couple', gait: 'stroll', pair: true, goals: [{ from: r() < 0.25 ? 'cross' : anySide(r) }, ...(r() < 0.85 ? [{ at: r() < 0.5 || !M.exits ? jitter(r, M.nodes.inlay, 2.5, 1.2) : floor(r, M) }, { pose: 'chat', dur: 30 + r() * 60 }] : []), { exit: r() < 0.25 ? 'cross' : 'any' }] }),
  lunch: (r, M) => ({ look: r() < 0.5 ? 'commuter' : 'walker', gait: 'walk', sit: true, goals: [{ from: anySide(r) }, { at: M.nodes.benchFront }, { at: M.nodes.bench, seat: true }, { pose: 'sit', dur: 60 + r() * 150, face: M.nodes.benchFace || 0 }, { at: M.nodes.benchFront }, { exit: 'any' }] }),
  // 9a — SHELTERING under the awning in the rain: in from either side, a minute or two at the shop window facing out, then on
  shelter: (r, M) => ({ look: r() < 0.5 ? 'lady' : 'walker', gait: 'walk', shelter: true, goals: [{ from: anySide(r) }, { at: jitter(r, M.nodes.shopWin, 0.9, 0.1) }, { pose: 'wait', dur: 40 + r() * 70, face: 0 }, { exit: 'any' }] }),
  window: (r, M) => ({ look: r() < 0.6 ? 'lady' : 'walker', gait: 'stroll', goals: [{ from: anySide(r) }, { at: jitter(r, M.nodes.shopWin, 0.6, 0.15) }, { pose: 'shop', dur: 8 + r() * 14 }, { exit: 'any' }] }),
  customer: (r) => ({ look: 'walker', gait: 'walk', hours: [9, 17.8], goals: [{ from: r() < 0.3 ? 'cross' : anySide(r) }, { door: 'shop' }] }),
  cart: (r, M) => ({ look: r() < 0.5 ? 'lady' : 'walker', gait: 'stroll', need: 'cart', goals: [{ from: anySide(r) }, { at: M.nodes.cart }, { pose: 'cart', dur: 10 + r() * 14, face: 1 }, { exit: 'any' }] }),
  water: (r) => ({ look: r() < 0.5 ? 'stroll' : 'lady', gait: 'stroll', goals: [{ from: anySide(r) }, { cross: 'out' }, { pose: 'lean', dur: 60 + r() * 110, face: 2 }, { exit: r() < 0.5 ? 'farLeft' : 'farRight' }] }),
  meet: (r, M) => ({ look: 'walker', gait: 'walk', pair: 'meet', goals: [{ from: 'left' }, { at: M.nodes.meetA }, { pose: 'chat', dur: 40 + r() * 70 }, { exit: 'any' }] }),
  homeward: (r) => ({ look: 'commuter', gait: 'brisk', goals: [{ from: r() < 0.1 ? 'shop' : anySide(r) }, { exit: r() < 0.35 ? 'cross' : r() < 0.6 ? 'bus' : 'any' }] }),
  guests: (r) => ({ look: 'guest', gait: 'walk', group: 2 + Math.floor(r() * 3), goals: [{ from: r() < 0.3 ? 'cross' : anySide(r) }, { door: 'side' }] }),
  stargazer: (r, M) => ({ look: 'stroll', gait: 'stroll', goals: [{ from: anySide(r) }, { at: jitter(r, M.nodes.sky, 1.5, 0.8) }, { pose: 'point', dur: 6 + r() * 6 }, { pose: 'watch', dur: 20 + r() * 40 }, { exit: 'any' }] }),
  straggler: (r) => ({ look: 'guest', gait: 'stroll', goals: [{ from: r() < 0.5 ? 'side' : anySide(r) }, { exit: r() < 0.3 ? 'cross' : 'any' }] }),
  leaving: (r) => ({ look: 'guest', gait: 'stroll', pair: true, goals: [{ from: 'side' }, { exit: r() < 0.3 ? 'cross' : 'any' }] }),
  lone: (r, M) => ({ look: 'night', gait: 'walk', goals: [{ from: anySide(r) }, ...(r() < 0.6 ? [{ at: floor(r, M) }, { pose: 'watch', dur: 15 + r() * 30 }] : []), { exit: 'any' }] }),
  nightworker: (r) => ({ look: 'worker', gait: 'walk', goals: [{ from: anySide(r) }, { exit: 'any' }] }),
};

// ------------------------------------------------------------------ REAL DOORS (FP3b item 8 — the owner's 8P note 13)
/** Nobody fades in or out at a door: the door SWINGS OPEN (open s), they STEP THROUGH at their gait × pace, it starts to CLOSE once
 *  they're `clear` units past the threshold and is shut `close` s later. Going in, they walk on into the dark while it shuts behind
 *  them (inside: drawn between the doorway + the leaf — screens/harbor/doors.js); coming out, it opens on them standing `inside`
 *  units in. The BUS: its own door is open at the stop — riders step up `bus.floor` onto its floor / down off it. */
// (POL4 — the owner: "the swing is jaggy", "people ENTERING walk in at a WEIRD angle": a slower, eased swing (open 0.8 s, close 0.9 s); the
// last APPROACH units straight at the door, facing it; at the side door they STEP UP its two granite steps (SIDE_STEPS: the treads' z
// from the wall + their heights) through the opening, then down the stair inside)
export const DOOR = Object.freeze({ open: 0.8, close: 1.3, pace: 0.75, step: 0.45, stepSide: 0.95, approach: 1.4, clear: 0.8, inside: 1.3, bus: { open: 0.15, floor: 0.6 } });
export const SIDE_STEPS = Object.freeze([[-0.75, 0.13], [-0.4, 0.26]]);
/** the ground's height at z (world) in front of + through the side door: the two steps up, the stair going down inside (PURE) */
export function sideStepY(z, face) {
  const d = z - face, ease = (a, w) => smooth01((d - a + w) / (2 * w));
  const up = 0.13 * ease(SIDE_STEPS[0][0], 0.06) + 0.13 * ease(SIDE_STEPS[1][0], 0.06);
  return up - Math.max(0, d - 0.35) * 0.45;                    // (inside: down the stair to the club)
}
/** a door leg (PURE): kind 'side' | 'shop' | a bus's id, dir 'in' | 'out', at x, from t, the walker's gait v, the door's plane zFace */
export function doorLeg(kind, dir, x, t, v, zFace, { bus = false } = {}) {
  const u = Math.max(0.5, v * DOOR.pace), zs = zFace - (kind === 'side' ? DOOR.stepSide : DOOR.step), op = bus ? DOOR.bus.open : DOOR.open, tWalk = t + op;
  const y = bus ? DOOR.bus.floor : 0;
  if (dir === 'in') {
    const tClose = tWalk + (zFace + DOOR.clear - zs) / u, t1 = tClose + DOOR.close, z1 = zs + (t1 - tWalk) * u;
    return { k: 'door', door: kind, dir, x0: x, z0: zs, x1: x, z1, t0: t, t1, w0: op / (t1 - t), w1: 1, tOpen: t, tClose, y0: 0, y1: y, ...(bus ? { bus: kind } : {}), ...(kind === 'side' ? { steps: zFace } : {}) };
  }
  const z0 = zFace + (bus ? 0.55 : DOOR.inside), t1 = tWalk + (z0 - zs) / u, tClose = Math.min(t1, tWalk + (z0 - (zFace - DOOR.clear)) / u);
  return { k: 'door', door: kind, dir, x0: x, z0, x1: x, z1: zs, t0: t, t1, w0: op / (t1 - t), w1: 1, tOpen: t, tClose, y0: y, y1: 0, ...(bus ? { bus: kind } : {}), ...(kind === 'side' ? { steps: zFace } : {}) };
}
const smooth01 = u => { const x = Math.max(0, Math.min(1, u)); return x * x * (3 - 2 * x); };
/**
 * 9d — A DOOR CLOSER's swing shut (the owner: "it still just kind of snaps at the end … since that happens so much, we really need to
 * get that right"): how much of the swing is LEFT u (0..1) of the way through the close → 1..0. The SWEEP (the first CLOSER.sweep of
 * the time) starts gently and carries the leaf to the last CLOSER.latch of its angle (~9° of 77°); then the LATCH SPEED — the closer's
 * valve slowing it through those last degrees, decelerating to rest at 0 (no speed left at the latch: a soft click, never a slam).
 * The speed is continuous where the two meet (PURE; tests/harbor-people.test.mjs).
 */
export const CLOSER = Object.freeze({ sweep: 0.6, latch: 0.12 });
export function closerLeft(u) {
  const x = u < 0 ? 0 : u > 1 ? 1 : u, a = CLOSER.sweep, rl = CLOSER.latch;
  if (x >= a) { const q = 1 - (x - a) / (1 - a); return rl * q * q; }
  // (a cubic from rest whose end speed matches the latch's start speed: g' (1) = m)
  const m = (2 * rl * a) / ((1 - rl) * (1 - a)), y = x / a;
  return 1 - (1 - rl) * ((m - 2) * y * y * y + (3 - m) * y * y);
}
/** how open a door leg holds its door at t (0..1, PURE): swinging open from tOpen (eased), shutting from tClose on the closer's curve */
export const doorOpenK = (lg, t) => (t < lg.tOpen || t > lg.tClose + DOOR.close ? 0 : smooth01((t - lg.tOpen) / DOOR.open) * (t <= lg.tClose ? 1 : closerLeft((t - lg.tClose) / DOOR.close)));

// ------------------------------------------------------------------ PLANNING A VISIT → legs on the clock
/**
 * A visit's itinerary from its goals, starting at t (s abs) → { legs: [{ k: 'walk', pts, t0, t1, v } | { k: 'pose', pose, x, z, t0,
 * t1, face } | { k: 'fade', x, z, t0, t1, out: bool }], t0, t1 } or null when it can't be laid out (a closed shop, no bus).
 */
export function planVisit(spec, t, M, ctx = {}) {
  const F = FOLK, r = ctx.r || Math.random, legs = [], rain = ctx.rain || 0;
  // (SP3 — HEAVY RAIN: a share of the few still out RUN for it — the jog's gait + its run cycle; drawn only past the heavy line)
  const dash = rain > 0.8 && (spec.gait === 'walk' || spec.gait === 'brisk' || spec.gait === 'stroll') && r() < 0.65 * Math.min(1, (rain - 0.8) / 0.08);
  const v = dash ? F.speed.jog * (0.8 + r() * 0.15) : F.speed[spec.gait] * (1 + MOOD.rainFast * rain) * (1 - MOOD.fogSlow * Math.max(0, Math.min(1, ctx.fog || 0))) * (0.88 + r() * 0.24);
  let cur = ctx.start ? { ...ctx.start } : null, now = t;
  // (FP3b: a goal inside a closed inlay — the dance circle — moves to just outside it, toward where they came from)
  const ev = M.circles.find(c => c.id === 'event');
  const free = q => q.z >= FOLK.zMin && q.z <= FOLK.zMax && !M.rects.some(o => inRect(q, o)) && !M.circles.some(c => c !== ev && Math.hypot(q.x - c.x, q.z - c.z) < c.r + 0.2);
  const outside = p => {
    const dx = p.x - ev.x, dz = p.z - ev.z, d = Math.hypot(dx, dz), a0 = d > 1e-3 ? Math.atan2(dz, dx) : Math.atan2(cur.z - ev.z, cur.x - ev.x);
    // (POL4: two rings of candidates — the dance circle has a small closed spot out at each side: past it if the near ring is taken)
    for (const rr of [0.4, 1.4]) for (const da of [0, 0.5, -0.5, 1, -1, 1.6, -1.6, 2.2, -2.2, PI]) { const q = { x: ev.x + Math.cos(a0 + da) * (ev.r + rr), z: ev.z + Math.sin(a0 + da) * (ev.r + rr) }; if (free(q)) return q; }
    return { x: ev.x + (ev.r + 0.4), z: ev.z };
  };
  const walkTo = (p0, vv = v) => { let p = p0; if (ev && cur && Math.hypot(p.x - ev.x, p.z - ev.z) < ev.r + 0.3) p = outside(p);
    const pts = route(M, cur, p), len = pathLen(pts); if (len < 0.05) { cur = p; return; } legs.push({ k: 'walk', pts, t0: now, t1: now + len / vv, v: vv }); now += len / vv; cur = { x: p.x, z: p.z }; };
  const exitPt = side => { const ex = M.exits[side]; return Array.isArray(ex) ? ex[Math.floor(r() * ex.length)] : ex; };
  const nearestSide = p => (p.x < 0 ? 'left' : 'right');
  for (const g of spec.goals) {
    // (11a-1: while THE PROCESSION holds the street nobody crosses it — ctx.noCross(t))
    if ((g.from === 'cross' || g.cross === 'out' || g.exit === 'cross') && ctx.noCross && ctx.noCross(now)) return null;
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
        // (FP3b: out through a REAL door — it swings open on them standing inside, they step out onto the step)
        const d = M.nodes[g.from === 'shop' ? 'shopDoor' : 'sideDoor'], lg = doorLeg(g.from, 'out', d.x + (r() - 0.5) * 0.3, now, v, M.face);
        legs.push(lg); now = lg.t1; cur = { x: lg.x1, z: lg.z1 };
        walkTo({ x: cur.x + (r() - 0.5) * 0.6, z: F.doorZ - 0.9 });
      } else if (g.from === 'bus') { cur = ctx.start ? { ...ctx.start } : { ...M.nodes.busDoor }; }
      else cur = { ...exitPt(g.from) };
    } else if (g.at) walkTo(g.at);
    else if (g.pose) { legs.push({ k: 'pose', pose: g.pose, x: cur.x, z: cur.z, t0: now, t1: now + g.dur, face: g.face == null ? (r() < 0.5 ? -1 : 1) : g.face, ...(g.sniff ? { sniff: true } : {}) }); now += g.dur; }
    else if (g.cross === 'out') {
      walkTo({ x: M.cw.x0 + r() * (M.cw.x1 - M.cw.x0), z: F.curbZ });
      const cv = crossV(v), react = 0.3 + r() * 0.9, ws = walkStart(now, (F.farZ - F.curbZ) / cv + react + 0.3);
      if (ws > now) { const w = ws + react; legs.push({ k: 'pose', pose: 'wait', x: cur.x, z: cur.z, t0: now, t1: w, face: 2 }); now = w; }
      else { const S = signalAt(now * 1000); if (S.phase !== 'walk') return null; }
      const p = { x: cur.x + (r() - 0.5) * 0.4, z: F.farZ }, d = Math.hypot(p.x - cur.x, p.z - cur.z);
      legs.push({ k: 'walk', pts: [cur, p], t0: now, t1: now + d / cv, v: cv, cross: true }); now += d / cv; cur = p;
      walkTo({ x: cur.x + (r() - 0.5) * 2, z: F.farZ });
    } else if (g.treat) {
      // 11a-1 — TRICK OR TREAT: up to the door (the side door's pavement before its two steps / the shop's step), a knock, the door swings
      // open on the warm light (the swing rides on the pose leg: folkAt's doors), a treat, it shuts — then on to the next
      const d = M.nodes[g.treat === 'shop' ? 'shopDoor' : 'sideDoor'], dx0 = d.x + (r() - 0.5) * 0.3, zs = M.face - (g.treat === 'side' ? DOOR.stepSide + 0.25 : DOOR.step + 0.3);
      walkTo({ x: dx0, z: zs - DOOR.approach }); walkTo({ x: dx0, z: zs });
      const dur = g.dur || 8;
      legs.push({ k: 'pose', pose: 'treat', x: cur.x, z: cur.z, t0: now, t1: now + dur, face: 2, swing: { door: g.treat, tOpen: now + 1.7, tClose: now + dur - 1.9 } }); now += dur;
    } else if (g.door) {
      if (g.door === 'shop' && ctx.shopOpen === false) return null;
      const d = M.nodes[g.door === 'shop' ? 'shopDoor' : 'sideDoor'];
      // (FP3b: in through a REAL door — up to the step, it swings open, they step through, it shuts behind them)
      // (POL4: the last DOOR.approach units STRAIGHT at the door — facing it, never sidling in at an angle — then the step / the steps)
      const dx0 = d.x + (r() - 0.5) * 0.3, zs = M.face - (g.door === 'side' ? DOOR.stepSide : DOOR.step);
      walkTo({ x: dx0, z: zs - DOOR.approach }); walkTo({ x: dx0, z: zs });
      const lg = doorLeg(g.door, 'in', cur.x, now, v, M.face); legs.push(lg); now = lg.t1; cur = { x: lg.x1, z: lg.z1 };
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
      // (FP3b: up the step through its open door — no fade)
      const dx = bus.x(bus.tA) + bus.len / 2 - 0.9, pts = [cur, { x: dx + 0.15, z: F.curbZ }, { x: dx, z: bus.z - DOOR.step }], dl = pathLen(pts);
      legs.push({ k: 'walk', pts, t0: now, t1: now + dl / (v * 0.8), v: v * 0.8 }); now += dl / (v * 0.8);
      const lg = doorLeg(bus.id, 'in', dx, now, v, bus.z, { bus: true }); legs.push(lg); now = lg.t1; cur = { x: lg.x1, z: lg.z1 };
    } else if (g.exit) {
      let side = g.exit;
      if (side === 'any') side = r() < 0.65 ? nearestSide(cur) === 'left' ? 'right' : 'left' : nearestSide(cur);
      if (side === 'cross') { const sub = planVisit({ ...spec, goals: [{ cross: 'out' }, { exit: r() < 0.5 ? 'farLeft' : 'farRight' }] }, now, M, { ...ctx, r, start: cur }); if (!sub) return null; legs.push(...sub.legs); now = sub.t1; cur = sub.end; continue; }
      if (side === 'bus') { side = 'right'; }
      walkTo(exitPt(side));
    }
  }
  if (dash) for (let i = 0; i < legs.length; i++) if (legs[i].k === 'walk') legs[i] = { ...legs[i], run: true };
  return legs.length ? { legs, t0: t, t1: now, end: cur, v } : null;
}

// ------------------------------------------------------------------ THE HEADING (FP3b — the owner's 8P notes 1 + 2)
// A person FACES WHERE THEY'RE GOING: `hd` = the heading on the ground (radians: 0 → right, π/2 → away from us toward the water,
// π → left, −π/2 → toward the camera). folk.js draws one 2.5-D rig from it: side-on only crossing the screen, 3/4 on diagonals, the
// front walking toward us, the back walking away. Turns are never a snap: at a route's corner the heading blends over ~0.55 units
// either side; a pose turns from the arrival heading to its own facing over ~0.6 s; a walk after a pose turns over its first steps.
// `dir` (the old 4-way facing: −1 left, 1 right, 0 toward the camera, 2 away) is derived from hd for the code that still reads it.
export const TURN = Object.freeze({ corner: 0.55, pose: 0.6, start: 0.6 });
/** 8b2 — a ladder climbed rung by rung: the rungs' pitch (world units — workers.js's ladders: top.y / n ≈ 0.32), the share of each
 *  rung's time spent moving (the rest a beat on the rung) */
export const CLIMB = Object.freeze({ rung: 0.32, move: 0.7 });
const PI = Math.PI;
/** a pose's facing (−1 left, 1 right, 0 toward the camera, 2 away) → a heading */
export const hdOfDir = d => (d === 1 ? 0 : d === -1 ? PI : d === 2 ? PI / 2 : -PI / 2);
/** the old 4-way facing from a heading (|cos| > 0.33 → side) */
export const dirOfHd = h => { const c = Math.cos(h); return Math.abs(c) > 0.33 ? (c > 0 ? 1 : -1) : Math.sin(h) > 0 ? 2 : 0; };
/** the shortest turn a → b at t (0..1); a half turn goes through the FRONT (a person turns to face us, never away) */
export function lerpHd(a, b, t) {
  let d = ((b - a) % (2 * PI) + 3 * PI) % (2 * PI) - PI;
  if (Math.abs(d) > PI - 0.35) { const alt = d - Math.sign(d || 1) * 2 * PI; if (Math.sin(a + alt / 2) < Math.sin(a + d / 2)) d = alt; }
  return a + d * Math.max(0, Math.min(1, t));
}
const segHd = (a, b) => Math.atan2(b.z - a.z, b.x - a.x);
/** a walk leg's point at distance d along it */
function pointAt(pts, d) {
  let c = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], sl = Math.hypot(b.x - a.x, b.z - a.z);
    if (d <= c + sl || i === pts.length - 1) { const u = sl ? Math.max(0, Math.min(1, (d - c) / sl)) : 1; return { x: a.x + (b.x - a.x) * u, z: a.z + (b.z - a.z) * u }; }
    c += sl;
  }
  return { ...pts[pts.length - 1] };
}
/** a walk leg's position + heading at distance d along it: the heading is the CHORD from TURN.corner behind to TURN.corner ahead on
 *  the route — straight on a straight, turning smoothly through a corner (any corner, however short its segments: never a snap) */
function alongLeg(pts, d, len = pathLen(pts)) {
  const p = pointAt(pts, d), a = pointAt(pts, Math.max(0, d - TURN.corner)), b = pointAt(pts, Math.min(len, d + TURN.corner));
  const dx = b.x - a.x, dz = b.z - a.z;
  return { x: p.x, z: p.z, hd: Math.hypot(dx, dz) > 1e-4 ? Math.atan2(dz, dx) : (endHd(pts) || 0) };
}
const endHd = pts => { for (let i = pts.length - 1; i > 0; i--) if (Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z) > 1e-3) return segHd(pts[i - 1], pts[i]); return null; };

// ------------------------------------------------------------------ A MEMBER'S STATE at t (PURE)
/**
 * Where a visit's lead is at t → { x, z, pose ('walk' | a pose), hd (the heading — above), dir (the 4-way facing from hd), dist (along
 * its walk — the stride's phase: never sliding), v, a (0..1 — fading onto the bus's far side only), since / left (a pose: s into it /
 * to go), door (a door leg: { id, k ('in' | 'out'), u }) } or null (not on screen).
 */
export function visitAt(vis, t) {
  if (t < vis.t0 || t >= vis.t1) return null;
  let dist = 0, lastHd = null;
  const out = (s, hd) => ({ ...s, hd, dir: dirOfHd(hd) });
  // (8b2 — NO SNAPPING BETWEEN POSES: each state names the leg before + after it (`prev` / `next`: 'walk' or the pose) with `since` / `left`,
  // so folk.js#rigOf blends one into the other over a third of a second)
  const kindOf = lg => (!lg ? null : lg.k === 'pose' ? lg.pose : lg.k === 'walk' || lg.k === 'door' ? 'walk' : null);
  for (let li = 0; li < vis.legs.length; li++) {
    const lg = vis.legs[li], prev = kindOf(vis.legs[li - 1]), next = kindOf(vis.legs[li + 1]);
    if (lg.k === 'walk') {
      const len = pathLen(lg.pts);
      if (t < lg.t1) {
        if (t < lg.t0) break;
        const d = (t - lg.t0) * lg.v, p = alongLeg(lg.pts, d, len);
        // (setting off after a pose / a door: turn from where they faced over the first steps)
        let hd = p.hd; if (lastHd != null && d < TURN.start) hd = lerpHd(lastHd, p.hd, d / TURN.start);
        return out({ x: p.x, z: p.z, y: lg.y || 0, pose: 'walk', dist: dist + d, v: lg.v, a: 1, cross: !!lg.cross, carry: lg.carry, run: !!lg.run, since: t - lg.t0, left: lg.t1 - t, prev, next }, hd);
      }
      dist += len;
      // (the heading they really ended the leg with — a short leg may end mid-turn: the next leg turns on from there)
      if (len > 1e-3) { const e = alongLeg(lg.pts, len, len).hd; lastHd = lastHd != null && len < TURN.start ? lerpHd(lastHd, e, len / TURN.start) : e; }
    } else if (lg.k === 'door') {
      // a REAL door (FP3b item 8): walking through it — in: from the step into the dark doorway; out: from the doorway onto the step
      const ln = Math.hypot(lg.x1 - lg.x0, lg.z1 - lg.z0);
      if (t < lg.t1 && t >= lg.t0) {
        const u = (t - lg.t0) / (lg.t1 - lg.t0), w = Math.max(0, Math.min(1, (u - lg.w0) / (lg.w1 - lg.w0))), hd = segHd({ x: lg.x0, z: lg.z0 }, { x: lg.x1, z: lg.z1 });
        const moving = u >= lg.w0 && u < lg.w1;
        // (the bus's floor: on it for the first part of the walk out / the last part in — a step up or down over ~0.3 of the walk)
        const zNow = lg.z0 + (lg.z1 - lg.z0) * w, yy = lg.steps != null ? sideStepY(zNow, lg.steps) : lg.y0 === lg.y1 ? lg.y0 || 0 : lg.dir === 'in' ? lg.y1 * smooth01((w - 0.32) / 0.3) : lg.y0 * (1 - smooth01((w - 0.38) / 0.3));
        return out({ x: lg.x0 + (lg.x1 - lg.x0) * w, z: zNow, y: yy, pose: moving ? 'walk' : 'wait', dist: dist + ln * w, v: moving ? ln / ((lg.w1 - lg.w0) * (lg.t1 - lg.t0)) : 0, a: 1, door: { id: lg.door, k: lg.dir, u, bus: !!lg.bus }, carry: lg.carry }, lastHd != null && !moving && u < lg.w0 ? lerpHd(lastHd, hd, u / Math.max(1e-3, lg.w0)) : hd);
      }
      dist += ln; lastHd = segHd({ x: lg.x0, z: lg.z0 }, { x: lg.x1, z: lg.z1 });
    } else if (lg.k === 'gap') {
      if (t < lg.t1 && t >= lg.t0) return null;           // (8b1: indoors between two doors — not on the promenade)
    } else if (t < lg.t1 && t >= lg.t0) {
      if (lg.k === 'pose') {
        const want = lg.hd != null ? lg.hd : hdOfDir(lg.face === 0 ? 0 : lg.face || (lastHd != null && Math.cos(lastHd) < 0 ? -1 : 1)), since = t - lg.t0;
        // (8b1 — the workers: a carried prop, a height — a ladder's rungs, the platform, the catwalk — and a climb moving along its ladder)
        // (8b2 — RUNG BY RUNG: a climb moves one rung (CLIMB.rung units) at a time — a step up, a beat's pause on the rung — never a glide;
        // `rung` = { n (the step), q (0..1 through it) } for the arms + legs)
        let uu = (t - lg.t0) / Math.max(1e-3, lg.t1 - lg.t0), rung = null;
        if (lg.pose === 'climb' && lg.y0 != null) { const nR = Math.max(1, Math.round(Math.abs(lg.y1 - lg.y0) / CLIMB.rung)), w = uu * nR, n = Math.min(nR - 1, Math.floor(w)), q = w - n, e = q < CLIMB.move ? smooth01(q / CLIMB.move) : 1; uu = (n + e) / nR; rung = { n, q: Math.min(1, q / CLIMB.move), up: lg.y1 >= lg.y0 }; }
        const px = lg.x1 != null ? lg.x + (lg.x1 - lg.x) * uu : lg.x, pz = lg.z1 != null ? lg.z + (lg.z1 - lg.z) * uu : lg.z, py = lg.y0 != null ? lg.y0 + (lg.y1 - lg.y0) * uu : lg.y || 0;
        return out({ x: px, z: pz, y: py, pose: lg.pose, dist, v: 0, a: 1, since, left: lg.t1 - t, from: lastHd == null ? want : lastHd, to: want, carry: lg.carry, plat: !!lg.plat, sniff: !!lg.sniff, prev, next, rung }, lastHd != null && since < TURN.pose ? lerpHd(lastHd, want, since / TURN.pose) : want);
      }
      const u = (t - lg.t0) / (lg.t1 - lg.t0);
      return out({ x: lg.x, z: lg.z, y: lg.y || 0, pose: 'walk', dist: dist + u * 0.6, v: 0.8, a: lg.out ? 1 - u : u, bus: lg.bus || null, carry: lg.carry }, lg.out ? PI / 2 : -PI / 2);
    } else if (lg.k === 'pose' && t >= lg.t1) lastHd = lg.hd != null ? lg.hd : hdOfDir(lg.face === 0 ? 0 : lg.face || (lastHd != null && Math.cos(lastHd) < 0 ? -1 : 1));
  }
  return null;
}

// ------------------------------------------------------------------ POLISH 4 — THE SPEAKEASY STAYS SECRET (the owner)
/** THE SIDE DOOR's own schedule (never the random mix): evenings a trickle — a pair going in every few minutes (`inGap` s, from
 *  `inHours`), leavers later (`outGap`, from `outHours`); party nights only the leavers here (the guests queue in THE LINE); by day
 *  nobody. `gap`: two arrivals on the promenade at least this far apart (never a burst). Hours on the evening's clock (25 = 1 am). */
// 9f — THE JOGGERS ON THEIR OWN LANE (the owner, Oct 28: "the joggers didn't show"): one passes every gap s (seeded per block — every phone
// the same) in their hours: the early block (5:30–8), lunch (12–13), after work (17–19), weekend mornings (8–10); fewer in rain, none in
// heavy rain or a storm; &force=joggers (the panel's JOGGERS row) sends one through every ~20 s at any hour
export const JOG = Object.freeze({ gap: [45, 90], forced: [17, 23], hours: [[5.5, 8], [12, 13], [17, 19]], weekend: [8, 10], wetCut: 0.3, noRain: 0.6 });
export function jogHour(h, weekend) { return JOG.hours.some(([a, b]) => h >= a && h < b) || (weekend && h >= JOG.weekend[0] && h < JOG.weekend[1]); }
export const STREAM = Object.freeze({ gap: 9, inGap: [170, 290], inHours: [18.5, 23.25], outGap: [220, 380], outHours: [21, 25.75], party: { outGap: [95, 165], outHours: [21.5, 26.25] }, late: { outGap: [260, 420], outHours: [22, 25] } });
const evHour = (tt, off) => { const h = localOf(tt, off).h; return h < 12 ? h + 24 : h; };
function streamOf(k, t0, ctx, party) {
  const B = FOLK.block, out = [], r = rngFrom(hashString(`stream|${ctx.seed || 1924}|${k}`));
  const P = party ? STREAM.party : STREAM;
  const lane = (gap, hours, make) => {
    for (let tt = t0 + r() * gap[0]; tt < t0 + B - 70; tt += gap[0] + r() * (gap[1] - gap[0])) { const h = evHour(tt, ctx.off); if (h >= hours[0] && h < hours[1]) { const e = make(tt); if (e) out.push(e); } }
  };
  if (!party) lane(STREAM.inGap, STREAM.inHours, tt => ({ t: tt, kind: 'guests', seed: Math.floor(r() * 2147483647), spec: { look: 'guest', gait: 'walk', group: 2, goals: [{ from: r() < 0.25 ? 'cross' : anySide(r) }, { door: 'side' }] } }));
  // (9e — WEEKDAY LATE NIGHTS livelier: Sun–Thu evenings 10 pm → 1 am more couples leave the bar arm in arm — a second, closer lane)
  if (!party) { const wk = tt => { const lc = localOf(tt, ctx.off), dw = lc.h < 12 ? (lc.dow + 6) % 7 : lc.dow; return dw <= 4; };
    lane(STREAM.late.outGap, STREAM.late.outHours, tt => (wk(tt) ? { t: tt, kind: 'leaving', seed: Math.floor(r() * 2147483647), spec: { look: 'guest', gait: 'stroll', pair: true, goals: [{ from: 'side' }, { exit: r() < 0.3 ? 'cross' : 'any' }] } } : null)); }
  // (9f — THE JOGGERS' lane: in their hours; the rain thins them, heavy rain stops them; forced: every ~20 s)
  { const rain = ctx.rain || 0, forced = !!ctx.forceJog;
    if (forced || rain < JOG.noRain) lane(forced ? JOG.forced : JOG.gap, [0, 48], tt => {
      const lc = localOf(tt, ctx.off), we = lc.dow === 0 || lc.dow === 6;
      if (!forced && (!jogHour(lc.h, we) || (rain > JOG.wetCut && r() < 0.6))) return null;
      return { t: tt, kind: 'jogger', seed: Math.floor(r() * 2147483647), spec: KINDS.jogger(r) };
    }); }
  lane(P.outGap, P.outHours, tt => ({ t: tt, kind: 'leaving', seed: Math.floor(r() * 2147483647), spec: { look: 'guest', gait: 'stroll', pair: true, goals: [{ from: 'side' }, { exit: r() < 0.3 ? 'cross' : 'any' }] } }));
  return out.sort((a, b) => a.t - b.t);
}

/**
 * THE LINE AT THE DOOR on party nights (the owner: "a steady stream + A LINE AT THE DOOR — queued where the lobby line forms, the doorman
 * letting them in a few at a time"). PURE, one simulation a night (seeded by the evening's date): groups of 1–3 arrive every `arrive` s
 * from `from` to `to` (evening hours), walk in from an edge to the back of the queue (linePlaces: along the shopfront left of the side
 * door, bending toward the corner); every `admit` s the DOORMAN (beside the door, facing the line) lets in up to `batch` (whole
 * groups); the rest shuffle up. Never longer than `max` (a group that would make it longer doesn't come); emptied by `to`.
 * → { visits (each guest + the doorman), admits: [t] } — the same on every phone, joined mid-way.
 */
export const LINE = Object.freeze({ from: 20.6, to: 25.4, arrive: [55, 95], admit: [70, 105], batch: 3, max: 7, slots: 12, step: 0.85 });
export function lineNight(day0, key, M, L, ctx = {}) {
  const r = rngFrom(hashString(`line|${ctx.seed || 1924}|${key}`)), T0 = day0 + LINE.from * 3600, T1 = day0 + LINE.to * 3600;
  const P = linePlaces(L, LINE.slots), D = M.nodes.sideDoor;
  const groups = [];
  for (let t = T0 + 20 + r() * 20; t < T1 - 300; t += LINE.arrive[0] + r() * (LINE.arrive[1] - LINE.arrive[0])) groups.push({ ta: t, n: r() < 0.6 ? 2 : r() < 0.5 ? 1 : 3, side: r() < 0.62 ? 'right' : 'left', seed: Math.floor(r() * 2147483647), moves: [] });
  // the queue, event by event (an arrival joins the back; an admission lets the front in; the rest step up)
  const queue = [], admits = [];
  let gi = 0, d = T0 + 50 + r() * 25;
  for (let guard = 0; guard < 5000 && (gi < groups.length || queue.length); guard++) {
    if (gi < groups.length && groups[gi].ta <= d) {
      const g = groups[gi++], n0 = queue.reduce((a, q) => a + q.n, 0);
      if (n0 + g.n > LINE.max) { g.skip = true; continue; }
      g.at = n0; queue.push(g);
    } else {
      let h = 0; const inn = [];
      while (queue.length && (!inn.length || h + queue[0].n <= LINE.batch)) { const g = queue.shift(); g.tIn = d; h += g.n; inn.push(g); }
      if (inn.length) { admits.push(d); for (const g of queue) g.moves.push({ t: d + 1.6, by: h }); }
      d += LINE.admit[0] + r() * (LINE.admit[1] - LINE.admit[0]);
    }
  }
  const visits = [];
  const hdAt = i => (i <= 0 ? 0 : Math.atan2(P[i - 1].z - P[i].z, P[i - 1].x - P[i].x));
  for (const g of groups) {
    if (g.skip || g.tIn == null) continue;
    for (let j = 0; j < g.n; j++) {
      const rr = rngFrom(g.seed + j * 7919), slot0 = g.at + j;
      const ap = planVisit({ look: 'guest', gait: 'walk', goals: [{ from: g.side }, { at: P[slot0] }] }, 0, M, { r: rr });
      if (!ap) continue;
      const sh = g.ta + j * 0.7 - ap.t1, legs = ap.legs.map(lg => ({ ...lg, t0: lg.t0 + sh, t1: lg.t1 + sh }));
      let now = g.ta + j * 0.7, i = slot0;
      for (const mv of g.moves) {
        if (mv.t <= now) continue;
        legs.push({ k: 'pose', pose: 'wait', x: P[i].x, z: P[i].z, t0: now, t1: mv.t, hd: hdAt(i) });
        const to = Math.max(j, i - mv.by), pts = []; for (let q = i; q >= to; q--) pts.push({ x: P[q].x, z: P[q].z });
        const len = pathLen(pts), dt = Math.max(0.6, len / LINE.step);
        legs.push({ k: 'walk', pts, t0: mv.t, t1: mv.t + dt, v: len / dt }); now = mv.t + dt; i = to;
      }
      const tGo = Math.max(now + 0.3, g.tIn + 0.6 + j * 0.9);
      legs.push({ k: 'pose', pose: 'wait', x: P[i].x, z: P[i].z, t0: now, t1: tGo, hd: hdAt(i) });
      const inn = planVisit({ look: 'guest', gait: 'walk', goals: [{ door: 'side' }] }, tGo, M, { r: rr, start: { x: P[i].x, z: P[i].z } });
      if (!inn) continue;
      legs.push(...inn.legs);
      visits.push({ id: `line.${key}.${groups.indexOf(g)}.${j}`, kind: 'liner', look: 'guest', gait: 'walk', party: true, legs, t0: legs[0].t0, t1: inn.t1, tEnd: inn.t1, members: [{ role: 'lead', dx: 0, dz: 0, lag: 0, seed: Math.floor(rr() * 1e6) }] });
    }
  }
  // THE DOORMAN: out of the side door before the first guests, beside it facing the line; a beckoning wave at each admission
  if (admits.length) {
    const spot = { x: D.x + 1.15, z: FOLK.doorZ - 0.8 }, rr = rngFrom(hashString(`doorman|${key}`));
    const out = planVisit({ look: 'doorman', gait: 'walk', goals: [{ from: 'side' }, { at: spot }] }, T0 - 40, M, { r: rr });
    if (out) {
      const legs = [...out.legs]; let now = out.t1;
      // (PROM: between admissions he leans at the wall right of the door (people.js turns his head after the guests); at each admission he
      // steps out to beckon them in, then back to the brick)
      const wall = { x: L.speakeasy.x0 + Math.min(L.speakeasy.door.u1 + 0.5, (L.speakeasy.door.u1 + (L.speakeasy.x1 - L.speakeasy.x0)) / 2 + 0.05), z: L.speakeasy.z0 - 0.24 };
      const step = (a, b, t) => { const d = Math.hypot(b.x - a.x, b.z - a.z), t1 = t + d / 1.1; legs.push({ k: 'walk', pts: [a, b], t0: t, t1, v: 1.1 }); return t1; };
      for (const a of admits) {
        if (a - 4.5 > now) { now = step(spot, wall, now); legs.push({ k: 'pose', pose: 'wall', x: wall.x, z: wall.z, t0: now, t1: a - 2.2, hd: -PI / 2 }); now = step(wall, spot, a - 2.2); }
        const e = Math.max(now, a - 0.6); if (e > now) legs.push({ k: 'pose', pose: 'watch', x: spot.x, z: spot.z, t0: now, t1: e, hd: PI }); legs.push({ k: 'pose', pose: 'wave', x: spot.x, z: spot.z, t0: e, t1: e + 2.4, hd: PI }); now = e + 2.4;
      }
      const back = planVisit({ look: 'doorman', gait: 'walk', goals: [{ door: 'side' }] }, now + 12, M, { r: rr, start: spot });
      if (back) { legs.push({ k: 'pose', pose: 'watch', x: spot.x, z: spot.z, t0: now, t1: now + 12, hd: PI }, ...back.legs); visits.push({ id: `line.${key}.doorman`, kind: 'doorman', look: 'doorman', gait: 'walk', party: true, legs, t0: legs[0].t0, t1: back.t1, tEnd: back.t1, members: [{ role: 'lead', dx: 0, dz: 0, lag: 0, seed: Math.floor(rr() * 1e6) }] }); }
    }
  }
  return { visits, admits, T0, T1 };
}

// ------------------------------------------------------------------ THE BLOCKS (the promenade over time)
const localOf = (t, off) => { const lt = t + (off || 0) * 60, d = new Date(lt * 1000); return { key: `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`, dow: d.getUTCDay(), h: ((lt / 3600) % 24 + 24) % 24, month: d.getUTCMonth() + 1 }; };
/** members of a visit (the lead, a partner, a group, a dog): offsets behind / beside the lead (world units) + their own looks */
/** 8b2 — THE BENCH's SEATS (the owner: "a person walks to the bench where someone already sits, sits ON TOP of them and disappears"):
 *  three seats along its 3.3 units (x offsets from its middle); a seat is RESERVED from the step toward it until they've stood up and
 *  walked off (`seat: { i, t0, t1 }` on the visit) — a taken seat is never chosen; with the bench full they walk on (no such visit) */
export const SEATS = Object.freeze([-1.05, 0, 1.05]);
const seatFree = (taken, i, a, b) => !taken.some(o => o.i === i && b > o.t0 - 1 && a < o.t1 + 1);
/** a sitter's visit on the first free seat (in a seeded order) — or null when the bench is full the whole time they'd sit */
function planSeated(spec, start, M, vctx, vseed, taken, order) {
  for (const i of order) {
    const goals = spec.goals.map(g => (g.seat ? { at: { x: M.nodes.bench.x + SEATS[i], z: M.nodes.bench.z } } : g));
    const vis = planVisit({ ...spec, goals }, start, M, { ...vctx, r: rngFrom(vseed) });
    if (!vis) return null;
    const j = vis.legs.findIndex(lg => lg.k === 'pose' && lg.pose === 'sit');
    if (j < 0) return vis;
    const a = (vis.legs[j - 1] || vis.legs[j]).t0, b = (vis.legs[j + 1] || vis.legs[j]).t1;
    if (seatFree(taken, i, a, b)) { vis.seat = { i, t0: a, t1: b }; return vis; }
  }
  return null;
}
export const seatsOf = vs => vs.filter(v => v.seat).map(v => v.seat);
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
  const party = ctx.party ? ctx.party(t0 + B / 2) : partyAtT(t0 + B / 2, ctx.off);
  const mn = mixNow({ h: loc.h, dow: loc.dow, party, rain: ctx.rain || 0, budget: ctx.budget == null ? 1 : ctx.budget, rush: ctx.rush ? ctx.rush(t0 + B / 2) : 0 });
  const rushK = ctx.rush ? ctx.rush(t0 + B / 2) : 0;
  // (×1.3: a phase's visits must fit inside its block, so its load falls off toward the block's end — the other phase fills in)
  const want = mn.n / 2 * B * 1.3, cap = phase === 0 ? Math.ceil(FOLK.cap * 0.65) : FOLK.cap, out = [];
  const occ = [...(ctx.others || [])], taken = [...(ctx.seats || [])];
  // (the peak count over [a, b): exact — it can only rise at a or where someone arrives inside it)
  const load = (a, b) => { let mx = 0; for (const tt of [a, ...occ.filter(o => o.t0 > a && o.t0 < b).map(o => o.t0)]) { let n = 0; for (const o of occ) if (tt >= o.t0 && tt < o.t1) n += o.n; if (n > mx) mx = n; } return mx; };
  // (8b1 — THE WORKERS ARE PART OF THE COUNT: the crowd gives way to them — a phase's budget starts with half the workers' time out
  // on the promenade in its block already spent, so the owner's calmer counts hold with the milkman, the newsboy, the cop out)
  let spent = ctx.workLoad ? ctx.workLoad(t0, t1) / 2 : 0;
  // (POLISH 4 — NEVER A BURST: two arrivals at least STREAM.gap s apart, whoever they are — the other phase's, the bus's riders' too)
  const spaced = tt => !occ.some(o => Math.abs(o.t0 - tt) < STREAM.gap);
  // (POLISH 4 — THE SIDE DOOR's GUESTS on their own schedule, before the mix: phase A only, seeded per block — a pair now and then in the
  // evening, leavers later; on party nights the guests go in by THE LINE (lineNight) and only the leavers come out here)
  if (phase === 0) for (const e of streamOf(k, t0, ctx, party)) {
    if (!spaced(e.t)) continue;
    const vis = planVisit(e.spec, e.t, ctx.mapAt ? ctx.mapAt(e.t, e.t + 60, M) : M, { rain: ctx.rain || 0, fog: ctx.fog || 0, r: rngFrom(e.seed), noCross: ctx.noCross || null });   // (9f: + noCross — a stream's jogger never crosses through the procession)
    if (!vis || vis.t1 > t1 - 1) continue;
    const members = membersOf(e.spec, rngFrom(e.seed + 1)), n = heads(members);
    if (load(vis.t0, vis.t1) + n > cap) continue;
    occ.push({ t0: vis.t0, t1: vis.t1 + tailOf(members), n });
    out.push({ id: `${phase}.${k}.${out.length}`, kind: e.kind, look: e.spec.look, gait: e.spec.gait, ...vis, tEnd: vis.t1 + tailOf(members), members, party });
    spent += n * (vis.t1 - vis.t0);
  }
  for (let tries = 0; tries < 140 && spent < want; tries++) {
    const kind = pickW(r, mn.mix);
    let spec = KINDS[kind](r, M);
    // (11a-2 — Black Friday: everyone in a hurry — a stroll becomes a walk, a walk brisk)
    if (rushK > 0.3 && !spec.sit && !spec.pair) spec = { ...spec, gait: spec.gait === 'stroll' ? 'walk' : spec.gait === 'walk' ? 'brisk' : spec.gait };
    // (9e: a slower Sunday morning — a walk becomes a stroll; the joggers keep their pace)
    if (mn.sunday && (spec.gait === 'walk' || spec.gait === 'brisk')) spec = { ...spec, gait: 'stroll' };
    if (spec.need === 'cart' && (!M.nodes.cart || !ctx.cartOut)) continue;
    if (spec.hours && (loc.h < spec.hours[0] || loc.h >= spec.hours[1])) continue;
    const start = t0 + 2 + r() * (B * 0.75);
    // (FP3b: each visit on its own seed — one that would still be out while the dance circle closes the compass is planned again
    // round it: ctx.closed(t0, t1) + ctx.Mev)
    const vseed = Math.floor(r() * 2147483647), vctx = { rain: ctx.rain || 0, fog: ctx.fog || 0, shopOpen: ctx.shopOpen ? ctx.shopOpen(start) : true, buses: ctx.buses ? ctx.buses(start, start + 300) : [], noCross: ctx.noCross || null };
    if (!spaced(start)) continue;
    // (8b2: a sitter takes a FREE seat — this block's own sitters + the other phase's: ctx.seats — the seat order seeded with the visit)
    const order = spec.sit ? (r() < 0.5 ? [0, 2, 1] : [2, 0, 1]) : null, plan = Mx => (spec.sit ? planSeated(spec, start, Mx, vctx, vseed, taken, order) : planVisit(spec, start, Mx, { ...vctx, r: rngFrom(vseed) }));
    let vis = plan(M);
    // (a visit while the dance circle closes the compass / the cart stands / THE LINE queues: planned again on that map — mapAt)
    if (vis && ctx.mapAt) { const Mx = ctx.mapAt(vis.t0, vis.t1, M); if (Mx !== M) vis = plan(Mx); }
    if (vis && spec.need === 'cart' && !(ctx.cartParked && ctx.cartParked(vis.t0, vis.t1))) continue;
    if (!vis || vis.t1 > t1 - 1 || vis.t1 - vis.t0 < 4) continue;
    const members = membersOf(spec, r), n = heads(members);
    if (load(vis.t0, vis.t1) + n > cap) continue;
    if (vis.t1 + tailOf(members) > t1 - 0.5) continue;
    occ.push({ t0: vis.t0, t1: vis.t1 + tailOf(members), n });
    if (vis.seat) taken.push(vis.seat);
    out.push({ id: `${phase}.${k}.${out.length}`, kind, look: spec.look, gait: spec.gait, ...vis, tEnd: vis.t1 + tailOf(members), members, party });
    spent += n * (vis.t1 - vis.t0);
  }
  return out;
}
/** the bus riders of a bus (PURE): who steps off at the stop + walks away; who boards (planned by blockVisits via { bus: true }) */
function busRiders(bus, M, ctx = {}) {
  const r = rngFrom(hashString(`riders|${bus.id}`)), out = [];
  for (let i = 0; i < bus.riders.off; i++) {
    // (FP3b: each steps DOWN out of the open door onto the road by the kerb — no fade)
    const t = bus.tA + BUS.offAt + i * BUS.offGap, dx = bus.x(bus.tA) + bus.len / 2 - 0.9, lg = doorLeg(bus.id, 'out', dx, t - 1.2, FOLK.speed.walk, bus.z, { bus: true });
    const spec = { look: r() < 0.5 ? 'commuter' : r() < 0.5 ? 'lady' : 'walker', gait: 'walk', goals: [{ from: 'bus' }, { at: { x: dx + 0.7, z: FOLK.curbZ - 0.3 } }, ...(r() < 0.3 ? [{ door: 'shop' }] : [{ exit: r() < 0.25 ? 'cross' : 'any' }])] };
    const vis = planVisit(spec, lg.t1, M, { r, rain: ctx.rain || 0, fog: ctx.fog || 0, shopOpen: ctx.shopOpen ? ctx.shopOpen(lg.t1) : true, start: { x: lg.x1, z: lg.z1 } });
    if (!vis) continue;
    vis.legs.unshift(lg); vis.t0 = lg.t0;
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
  const { M, ctx = {} } = world, L = world.L, B = FOLK.block, cx0 = {};
  const get = (key, make) => { if (!cache.has(key)) { cache.set(key, make()); if (cache.size > 80) cache.delete(cache.keys().next().value); } return cache.get(key); };   // (PEO: 80 — the next block is warmed 70 s ahead; it must not evict the current one)
  // (Oct 25 — NO TRAFFIC DURING THE LEGENDARIES: core/harbor-legend.js#trafficHold from ctx.legend { kind, t0 } — a bus, a cab or a car
  // that would ENTER inside the hold never comes; one already on screen when it starts finishes its business)
  // 11a-1 — THE PROCESSION (Nov 2 at dusk, or &force=procession): its window near t; while it's in the street NO car, bus or cab enters
  // (its hold — the same rule as a legendary's); otherwise a legendary's hold
  const HF = ctx.hforce || {}, PW = procWindow(t, { off: ctx.off, dusk: ctx.dusk, forceAt: HF.procession == null ? null : HF.procession });
  const procX0 = L.speakeasy ? L.speakeasy.x1 - 2.6 : -20, procX1 = z => (L.cam && L.cam.hw ? L.cam.hw(z) : 20) + 1.6, procCross = (procX1(PROC.files[1]) - procX0 + 2) / PROC.v;
  // 11a-2 — THE PARADE (core/harbor-parade.js — Thanksgiving morning, or &force=parade): the same route + rule as the procession
  const PA = paradeWindow(t, { off: ctx.off, forceAt: HF.parade == null ? null : HF.parade }), paraCross = (procX1(PARADE.files[1]) - procX0 + 12) / PARADE.v;
  const hold = PW ? procHold(PW, procCross) : PA ? paradeHold(PA, paraCross) : trafficHold(ctx.legend), hk = hold ? Math.round(hold[0]) : '';
  const hourBuses = hAbs => get(`bus|${hAbs}|${ctx.forceBus ? 1 : 0}`, () => { const loc = localOf(hAbs * 3600 + 1, ctx.off); return busesOf(L, loc.key, Math.floor(loc.h), hAbs * 3600 - (((ctx.off || 0) * 60) % 3600 + 3600) % 3600, { force: !!ctx.forceBus }); });
  const busesNear = (a, b) => { const out = []; for (let h = Math.floor(a / 3600) - 1; h <= Math.floor(b / 3600) + 1; h++) out.push(...hourBuses(h)); return out.filter(x => x.tE < b + 600 && x.tX > a - 600 && !inHold(hold, x.tE) && !busBlocked(x) && !(ctx.forceBus && ctx.forceBusAt != null && x.tE < ctx.forceBusAt)); };   // (POLISH 5: a forced bus never joins mid-stop — the first one drives in after the fire)
  // (8b1: a bus due while a worker's truck holds the stop rides on — it never comes)
  const busBlocked = x => get(`BB|${x.id}`, () => trucksNear(x.tE - 60, x.tX + 60).some(T => x.tE < T.tX + 12 && x.tX > T.tE - 35));
  // (FP3b: while the dance circle holds the promenade, nobody gets off here — they ride on: the circle's people stay within the cap)
  const riders = bus => get(`riders|${bus.id}`, () => (closed(bus.tA - 20, bus.tA + 90) ? [] : busRiders(bus, M, ctx)));
  // (FP3a, POL4: the bus's door shuts 6–9 s after the LAST rider the planner placed — off or on — seeded per bus; never after the departure)
  const doorShut = b => get(`shut|${b.id}`, () => {
    let last = b.tA + 1;
    const k0 = Math.floor(b.tB / B);
    // (FP3b: a rider is through once past the threshold — the door leg's tClose; the last of a group lags behind the lead)
    const through = v => { let e = 0; for (const lg of v.legs) if (lg.k === 'door' && lg.bus === b.id) e = Math.max(e, lg.tClose + tailOf(v.members)); return e; };
    for (let k = k0 - 1; k <= k0 + 1; k++) for (const v of [...A(k), ...Bv(k)]) last = Math.max(last, through(v));
    for (const v of riders(b)) last = Math.max(last, through(v));
    const r = rngFrom(hashString(`shut|${b.id}`));
    return Math.min(b.tD - 0.5, last + BUS.shut[0] + r() * (BUS.shut[1] - BUS.shut[0]));
  });
  const occOf = vs => vs.map(v => ({ t0: v.t0, t1: v.tEnd || v.t1, n: heads(v.members) }));
  // 8b1 — THE CREW (core/harbor-crew.js): the workers' visits on the clock (planned on the base map: every phone the same), their trucks
  // at the stop (leaders for the back road's cars; a bus due while one stands there doesn't come); their people count against the cap
  const fKey = `${ctx.forceWork || ''}|${ctx.forceWorkAt == null ? '' : Math.round(ctx.forceWorkAt)}`;
  if (cache.crewM !== M || cache.crewF !== fKey) { cache.crew = new Map(); cache.crewM = M; cache.crewF = fKey; }
  const crewW = { L, M, ctx: { off: ctx.off, seed: ctx.seed, party: ctx.party, force: ctx.forceWork || null, forceAt: ctx.forceWorkAt == null ? null : ctx.forceWorkAt, dusk: ctx.dusk || null, hot: ctx.hot || null, flush: ctx.flush || null } };
  const crewIn = (a, b) => (ctx.noWork ? { visits: [], roof: [], trucks: [], props: [], marks: {} } : crewSpan(a, b, crewW, cache.crew));
  const trucksNear = (a, b) => crewIn(a - 300, b + 300).trucks.filter(T => T.tX > a && T.tE < b);
  // 8b2 — THE CABS (core/harbor-cabs.js): the night's cab calls near [a, b] — each kept only with the stop free (no bus, no worker's truck,
  // no raid, no other cab) — their cab holds the near lane like a truck; their riders walk the promenade like the bus's
  const cabBlock = k => get(`CB|${k}|${hk}`, () => {
    const out = [];
    for (const e of cabEvents(k, ctx)) {
      const pl = cabPlan(e, L, M); if (!pl) continue;
      const T = pl.T, clash = (x0, x1) => x0 < T.tX + 18 && x1 > T.tE - 18;
      if (inHold(hold, T.tE)) continue;                                   // (no cab during a legendary)
      if (ctx.raid && clash(ctx.raid.t0 - 30, ctx.raid.tEnd)) continue;
      if (busesNear(T.tE - 120, T.tX + 120).some(bb => clash(bb.tE, bb.tX))) continue;
      if (trucksNear(T.tE - 60, T.tX + 60).some(tr => clash(tr.tE, tr.tX))) continue;
      out.push(pl);
    }
    return out;
  });
  // PROM — THE CAB STAND (core/harbor-cabs.js#standEvents): its waiters near [a, b]; a waiter who gives up by HAILING on the back road
  // brings a cab of their own — kept only where the stop is free (else they simply walk off)
  const standBlock = k => get(`SB|${k}|${hk}`, () => {
    if (!L.cabStand || ctx.noCabs) return [];
    const out = [];
    for (const e of standEvents(k, ctx)) {
      let pl = standPlan(e, L, M); if (!pl) continue;
      if (pl.cab) {
        const T = pl.cab.T, clash = (x0, x1) => x0 < T.tX + 18 && x1 > T.tE - 18;
        if (inHold(hold, T.tE) || (ctx.raid && clash(ctx.raid.t0 - 30, ctx.raid.tEnd)) || busesNear(T.tE - 120, T.tX + 120).some(bb => clash(bb.tE, bb.tX)) || trucksNear(T.tE - 60, T.tX + 60).some(tr => clash(tr.tE, tr.tX))) pl = standPlan({ ...e, hail: false }, L, M);
        if (!pl) continue;
      }
      out.push(pl);
    }
    return out;
  });
  const standsNear = (a, b) => { const all = []; for (let k = Math.floor(a / B) - 1; k <= Math.floor(b / B) + 1; k++) all.push(...standBlock(k)); return all.filter(pl => pl.rider.tEnd > a - 60 && pl.rider.t0 < b + 60); };
  const cabsNear = (a, b) => {
    if (ctx.noCabs) return [];
    const all = [], mine = []; for (let k = Math.floor(a / B) - 1; k <= Math.floor(b / B) + 1; k++) { all.push(...cabBlock(k)); mine.push(...standBlock(k).filter(p => p.cab).map(p => p.cab)); }
    all.sort((p, q) => p.T.tE - q.T.tE);
    // (a cab-stand waiter's hail first — someone is standing at the curb waving for it — then the night's own calls round it)
    const kept = [...mine]; for (const pl of all) if (!kept.some(o => pl.T.tE < o.T.tX + 10 && pl.T.tX > o.T.tE - 10)) kept.push(pl);
    return kept.filter(pl => pl.T.tX > a - 60 && pl.T.tE < b + 60);
  };
  // THE ROUTINES (FP3b — core/harbor-routines.js): the dance circle's sessions near t, their people; while one runs the inlay is
  // CLOSED to the crowd (the blocks route round it: Mev) and its people count against the cap (the blocks plan around them)
  const rctx = { off: ctx.off, seed: ctx.seed, party: ctx.party, force: !!ctx.forceDance, forceAt: ctx.forceDance && ctx.forceDanceAt != null ? ctx.forceDanceAt : null, event: !!ctx.event, ring: !!ctx.ring, blocked: ctx.blocked || null };   // (SP5: no circle under a centrepiece, during a raid or a legendary)
  const sess = j => get(`DS|${j}|${rctx.force ? 1 : 0}|${rctx.forceAt == null ? '' : Math.round(rctx.forceAt)}|${rctx.event ? 1 : 0}${rctx.ring ? 1 : 0}`, () => danceSlot(j, rctx));
  const sessionsNear = (a, b) => (ctx.noDance ? [] : danceSlotsNear(a, b, rctx).map(sess).filter(x => x && x.s1 + 90 > a && x.s0 - 40 < b));
  const danceVisits = x => get(`DV|${x.id}|${x.ring ? 1 : 0}`, () => planDance(x, M, L));
  const Mev = get(`Mev|${ctx.ring ? 1 : 0}`, () => folkMap(L, { event: true, ring: !!ctx.ring }));
  const closed = (a, b) => sessionsNear(a, b).some(x => b > x.s0 - 30 && a < x.s1 + 60);
  // THE VENDOR SPOT (FP3b — core/harbor-routines.js#VENDOR): the chestnut cart's evening, wheeled in from the right edge + out again;
  // never while the inlay is in use (a centrepiece: ctx.event; the dance circle: &force=dance — the real circles start after it's gone)
  // (PROM: from the cart's handle side — the LEFT edge now: the cab stand stands on its old way in from the right)
  const cartX = L.cart ? L.cart.x : 0, cartHand = (L.cart && L.cart.hand) || 1, cartIn = cam => cartHand * (cam ? cam.hw(L.cart.z) + 3.2 : Math.abs(cartX) + 12);
  // (Part 9's hook: in HEAVY rain — ctx.rain > 0.6 — the cart doesn't come out; in drizzle people.js puts its little hood up)
  const cartEv = tt => { if (!L.cart || L.cart.shown === false || (ctx.event && !ctx.ring) || ctx.forceDance || (ctx.rain || 0) > 0.6) return null; const loc = localOf(tt, ctx.off), day0 = tt - loc.h * 3600;
    return get(`CE|${loc.key}`, () => cartEvening(loc.key, loc.month, day0, cartIn(L.cam), cartX, { seed: ctx.seed })); };
  const cartOut = (a, b) => { for (const tt of [a, b]) { const e = cartEv(tt); if (e && b > e.t0 - 10 && a < e.t1 + 10) return true; } return false; };
  const cartParked = (a, b) => { const e = cartEv(a); return !!(e && a >= e.ta && b <= e.tb); };
  const Mc = get('Mc', () => folkMap(L, { cart: true }));
  const vendorVisit = e => get(`VV|${e.t0}`, () => {
    // (the vendor wheels the cart in from the right edge — walking with it at its pace — sells from behind it facing the promenade,
    // then wheels it out the way he came)
    const v = M.nodes.vendor, dx = v.x - cartX, xin = cartIn(L.cam) + dx, r = rngFrom(hashString(`vendor|${e.t0}`));
    const legs = [{ k: 'walk', pts: [{ x: xin, z: v.z }, { x: v.x, z: v.z }], t0: e.t0, t1: e.ta, v: VENDOR.roll },
      { k: 'pose', pose: 'cart', x: v.x, z: v.z, t0: e.ta, t1: e.tb, hd: -PI / 2 + 0.55 * cartHand },   // (SP5: on the cart's handle side, turned a little toward his customer beyond it)
      { k: 'walk', pts: [{ x: v.x, z: v.z }, { x: xin, z: v.z }], t0: e.tb, t1: e.t1, v: VENDOR.roll }];
    return { id: `vendor.${Math.round(e.t0)}`, kind: 'vendor', routine: 'cart', idx: 0, look: 'worker', gait: 'walk', legs, t0: e.t0, t1: e.t1, tEnd: e.t1, members: [{ role: 'lead', dx: 0, dz: 0, lag: 0, seed: Math.floor(r() * 1e6) }] };
  });
  // POLISH 4 — THE LINE AT THE DOOR (party nights — lineNight): one simulation an evening, its guests + the doorman; never with Lobby
  // 2.0's own line (ctx.lobby) or the &force=doors preview
  const lineOf = tt => { if (ctx.lobby || ctx.forceDoors) return null; const lc = localOf(tt, ctx.off), eh = lc.h < 12 ? lc.h + 24 : lc.h, day0 = tt - eh * 3600, ek = localOf(day0 + 43200, ctx.off);
    if (eh < LINE.from - 0.1 || eh > LINE.to + 0.2) return null; const party = ctx.party ? ctx.party(day0 + 22 * 3600) : partyAtT(day0 + 22 * 3600, ctx.off);
    if (!party) return null; return get(`LN|${ek.key}`, () => lineNight(day0, ek.key, Mev, L, ctx)); };   // (planned round the compass: the dance circle may close it)
  const linesNear = (a, b) => [...new Set([a, b].map(lineOf).filter(Boolean))];
  const lineOn = (a, b) => linesNear(a, b).some(x => b > x.T0 - 60 && a < x.T1 + 60);
  const lineVisits = (a, b) => linesNear(a, b).flatMap(x => x.visits).filter(v => v.tEnd > a && v.t0 < b);
  // (the map a visit is planned on: the compass closed by the dance circle, the cart standing, the line queuing — any mix of them)
  // (11a-2: a centrepiece standing on the inlay (ctx.event — the giant) keeps its closed floor on every map, the cart's + the line's too)
  const mapAt = (a, b, M0) => { const ev = closed(a, b) || !!ctx.event, ct = cartOut(a, b), ln = lineOn(a, b); if (!closed(a, b) && !ct && !ln) return M0;
    return get(`MX|${ev ? 1 : 0}${ct ? 1 : 0}${ln ? 1 : 0}${ctx.ring ? 1 : 0}`, () => folkMap(L, { event: ev, ring: !!ctx.ring, cart: ct, line: ln ? lineRect(L, LINE.max) : null })); };
  // 11a-1 — the holidays' visits near t: [visit] (each block / chunk planned once: cached)
  const HB = 600, totOf = k => get(`TOT|${k}|${HF.tot == null ? '' : Math.round(HF.tot)}`, () => totGroups(k, { off: ctx.off, seed: ctx.seed, forceAt: HF.tot == null ? null : HF.tot }).map(g => totVisit(g, M)).filter(Boolean));
  const zomOf = k => get(`ZOM|${k}|${HF.zombies == null ? '' : Math.round(HF.zombies)}`, () => zombieGroups(k, { off: ctx.off, seed: ctx.seed, forceAt: HF.zombies == null ? null : HF.zombies }).map(g => zombieVisit(g, M)).filter(Boolean));
  const procOf = c => get(`PR|${Math.round(PW.T0)}|${c}`, () => procWalkers(c, PW, { seed: ctx.seed }).map(e => procVisit(e, procX0, procX1)));
  // 11a-2 — THE PARADE's people: each unit's band / handlers / crew marching along the near lane at the parade's pace; the crowd at the kerb
  const paraUnits = () => get(`PU|${Math.round(PA.T0)}`, () => paradeUnits(PA));
  const paraOf = u => get(`PV|${Math.round(PA.T0)}|${u.i}`, () => unitPeople(u).map((p, j) => paradeVisit(u, p, j, procX0, procX1)));
  const xsKerb = () => [Math.max(procX0 + 1.5, (L.speakeasy ? L.speakeasy.x1 : -6) + 1.2), (L.cam && L.cam.hw ? L.cam.hw(PARADE.kerb[0]) : 18) - 1.2];
  const crowdOf = () => get(`PC|${Math.round(PA.T0)}`, () => paradeCrowd(PA, paraUnits(), procX0, xsKerb()).map(s => crowdVisit(s, M, L)).filter(Boolean));
  function holidayVisits(tt) {
    const out = [], kb = Math.floor(tt / HB);
    if (PA && tt > PA.T0 - 1300 && tt < PA.T1 + paraCross + 900) {
      for (const u of unitsAt(paraUnits(), tt + 4, procX0 - 6, procX1(PARADE.files[1]) + 8)) out.push(...paraOf(u));
      out.push(...crowdOf());
    }
    for (const k of [kb - 1, kb]) out.push(...totOf(k), ...zomOf(k));
    if (PW && tt > PW.T0 - 10 && tt < PW.T1 + procCross + 10) { const c1 = Math.floor((tt - PW.T0) / PROC.chunk), c0 = Math.floor((tt - procCross - 8 - PW.T0) / PROC.chunk); for (let c = Math.max(0, c0); c <= c1; c++) out.push(...procOf(c)); }
    return out.filter(v => tt >= v.t0 - 1 && tt < (v.tEnd || v.t1) + 1);
  }
  // (11a-1: while THE PROCESSION is in the street, nobody crosses it — the crowd's visits are planned without a crossing then)
  cx0.noCross = PW ? tt => tt > PW.T0 - PROC.lead - 60 && tt < PW.T1 + procCross : PA ? tt => tt > PA.T0 - PARADE.lead - 60 && tt < PA.T1 + paraCross : null;
  // (POLISH 4: the dance circle is ON TOP of the crowd's count — the owner: "8–12 (the dance circle on top)"; the vendor + the line count)
  const routineOcc = (a, b) => [...[a, b].map(cartEv).filter((e, i, arr) => e && arr.indexOf(e) === i && b > e.t0 && a < e.t1).map(e => ({ t0: e.t0, t1: e.t1, n: 1 })), ...occOf(lineVisits(a, b)), ...occOf(crewIn(a, b).visits)];
  // (8b2: the cabs' riders count in the crowd's budget too — the calmer counts hold on a night of cabs)
  const workLoad = (a, b) => get(`WL|${a}`, () => [...crewIn(a, b).visits.filter(v => !v.plat), ...cabsNear(a, b).flatMap(pl => pl.riders)].reduce((s, v) => s + Math.max(0, Math.min(b, v.tEnd || v.t1) - Math.max(a, v.t0)), 0));
  const cx = { ...ctx, buses: busesNear, closed, Mev, cartOut, cartParked, Mc, mapAt, workLoad, noCross: cx0.noCross };
  const cabOcc = (a, b) => [...cabsNear(a, b).flatMap(pl => occOf(pl.riders)), ...occOf(standsNear(a, b).map(pl => pl.rider))];
  const A = k => get(`A|${k}`, () => { const t0 = k * B; return blockVisits(0, k, M, { ...cx, others: [...busesNear(t0, t0 + B).flatMap(b => occOf(riders(b))), ...routineOcc(t0, t0 + B), ...cabOcc(t0, t0 + B)] }); });
  const Bv = k => get(`B|${k}`, () => { const t0 = k * B + B / 2, bs = busesNear(t0, t0 + B); return blockVisits(1, k, M, { ...cx, others: [...occOf(A(k)), ...occOf(A(k + 1)), ...bs.flatMap(b => occOf(riders(b))), ...routineOcc(t0, t0 + B), ...cabOcc(t0, t0 + B)], seats: [...seatsOf(A(k)), ...seatsOf(A(k + 1))] }); });
  const ka = Math.floor(t / B), kb = Math.floor((t - B / 2) / B);
  const buses = busesNear(t, t).filter(b => t >= b.tE && t < b.tX);
  // 11a-1 — THE PEOPLE OF THE HOLIDAYS (core/harbor-holidayfolk.js): Halloween night's trick-or-treaters + zombies (seeded per block, on
  // the base map — they're on top of the crowd's count, like the routines), Nov 2's procession in the street (seeded per chunk)
  const hol = holidayVisits(t);
  // (&force=doors — the preview: every 24 s someone walks through a door — at night guests in at the side door / a pair out of it, by
  // day a customer into the barbershop / one out of it — planned on the clock like the rest)
  const forced = ctx.forceDoors ? [-1, 0].map(o => get(`D|${Math.floor(t / 24) + o}`, () => { const k = Math.floor(t / 24) + o, r = rngFrom(hashString(`doors|${k}`)), loc = localOf(k * 24, ctx.off), day = loc.h >= 9 && loc.h < 18;
    const spec = day ? (k % 2 ? { look: 'walker', gait: 'walk', goals: [{ from: 'right' }, { door: 'shop' }] } : { look: 'lady', gait: 'stroll', goals: [{ from: 'shop' }, { exit: 'right' }] })
      : (k % 2 ? { look: 'guest', gait: 'walk', group: 2, goals: [{ from: 'right' }, { door: 'side' }] } : { look: 'guest', gait: 'stroll', pair: true, goals: [{ from: 'side' }, { exit: 'right' }] });
    const st0 = k * 24 + (spec.goals[0].from === 'right' ? -9 : 1), vis = planVisit(spec, st0, M, { r, shopOpen: true });
    if (!vis) return null; const members = membersOf(spec, r); return { id: `door.${k}`, kind: spec.group ? 'guests' : spec.pair ? 'leaving' : 'customer', look: spec.look, gait: spec.gait, ...vis, tEnd: vis.t1 + tailOf(members), members };
  })).filter(Boolean) : [];
  const crewNow = ctx.noWork ? { visits: [], roof: [], trucks: [], props: [], marks: {} } : crewAt(t, crewW, cache.crew);
  const evNow = cartEv(t), nowSess = sessionsNear(t - 120, t + 10), routine = [...nowSess.flatMap(danceVisits), ...(evNow && t >= evNow.t0 && t < evNow.t1 ? [vendorVisit(evNow)] : []), ...lineVisits(t - 2, t + 2), ...crewNow.visits];
  // 8b2 — THE RAID (ctx.raid: core/harbor-raid.js#raidPlan): its officer is a routine visit while he's out; the crowd reacts (the witnesses'
  // 'raid' kind: freeze / casually away / look away, the doorman in at the side door) from the moment the first car shows
  const RP = ctx.raid && t >= ctx.raid.t0 - 20 && t < ctx.raid.tEnd + 4 * 3600 ? ctx.raid : null;
  if (RP && RP.officer && t >= RP.officer.t0 && t < RP.officer.t1) routine.push(RP.officer);
  let all = [...A(ka), ...Bv(kb), ...busesNear(t - 400, t + 10).flatMap(b => riders(b)), ...cabsNear(t - 400, t + 10).flatMap(pl => pl.riders), ...standsNear(t - 400, t + 10).map(pl => pl.rider), ...forced, ...routine, ...hol].filter(v => t >= v.t0 && t < (v.tEnd || v.t1));
  // 8b1 — THE WITNESSES (core/harbor-witness.js): a legendary night (ctx.legend: { kind, t0 }) — everyone on the promenade when it comes
  // reacts (the UFO: they look up, then FLEE; the TR-3B: they stare up, a few hurry indoors); nobody new comes until the empty spell ends
  // (the reaction holds after the window too — a routine back at its post on its new path, never the old one popping back — for a few hours)
  const LG = ctx.legend && t >= ctx.legend.t0 && t < ctx.legend.t0 + 4 * 3600 ? ctx.legend : RP && t >= RP.tAppear ? { kind: 'raid', t0: RP.tAppear, len: Math.max(8, RP.tPast - RP.tAppear) } : null, inWin = LG && witnessWindow(LG, t);
  let reacted = [];
  if (LG) {
    reacted = get(`WIT|${LG.kind}|${LG.t0}`, () => {
      const T = LG.t0 + 3, kA = Math.floor(T / B), kB = Math.floor((T - B / 2) / B), ev = cartEv(T);
      const cand = [...A(kA), ...Bv(kB), ...busesNear(T - 400, T + 10).flatMap(b => riders(b)), ...cabsNear(T - 400, T + 10).flatMap(pl => pl.riders), ...standsNear(T - 400, T + 10).map(pl => pl.rider), ...sessionsNear(T - 120, T + 10).flatMap(danceVisits), ...(ev && T >= ev.t0 && T < ev.t1 ? [vendorVisit(ev)] : []), ...lineVisits(T - 30, T + 30), ...(ctx.noWork ? [] : crewAt(T, crewW, cache.crew).visits)]
        .filter((v, i, arr) => arr.findIndex(o => o.id === v.id) === i && v.t0 < LG.t0 + 1 && (v.tEnd || v.t1) > LG.t0);
      const hide = LG.kind === 'ufo' ? hiderOf(cand, LG, M) : null;
      if (LG.kind === 'raid') return cand.filter(v => v.kind !== 'officer').map(v => reactVisit(v, LG, M, {})).filter(Boolean);
      return cand.map(v => reactVisit(v, LG, M, { hide })).filter(Boolean);
    });
    const ids = new Set(reacted.map(v => v.id));
    all = [...reacted.filter(v => t >= v.t0 && t < (v.tEnd || v.t1)), ...all.filter(v => !ids.has(v.id) && (!inWin || v.t0 < LG.t0 + 1 || !suppressed(LG, v) || v.kind === 'officer'))];   // (someone out of reach — on the road, in a doorway — carries on)
  }
  const members = [];
  // (11a-1: on Halloween night the speakeasy's own guests come in costume — its costume party: the side door's pairs, THE LINE)
  const hween = halloweenAt(t, ctx.off).zombies || halloweenAt(t, ctx.off).tot || HF.zombies != null, HWK = { guests: 1, leaving: 1, liner: 1, straggler: 1 };
  for (const v of all) {
    const hw = hween && HWK[v.kind] ? true : undefined;
    for (const m of v.members) {
      const s = visitAt(v, t - m.lag);
      if (!s) continue;
      if (m.role === 'lead') { members.push({ vid: v.id, kind: v.kind, look: v.look, gait: v.gait, party: !!v.party, routine: v.routine || null, idx: v.idx, m, s, plat: !!v.plat, hween: hw }); continue; }
      // (FP3b: beside / behind the lead in the lead's OWN frame — forward along its heading, the lateral to its left — so the offset
      // turns smoothly with it, never jumping at a 4-way threshold; a dog keeps the old world offsets: it trots on the walker's right)
      // (in a pose: the walking offset of the heading they arrived with / will leave with — fixed, never the lead's turn in place)
      const fh = s.pose === 'walk' ? s.hd : (s.since || 0) < (s.left || 0) ? (s.from == null ? s.hd : s.from) : (s.to == null ? s.hd : s.to);
      const cx = Math.cos(fh), cz = Math.sin(fh);
      const walkOff = { x: m.dx * cx - m.dz * cz, z: m.dx * cz + m.dz * cx };
      let off = walkOff, hd = s.hd, st = s;
      // (talking: the partner / friend steps round to face the lead; sitting: beside on the bench; a group at a pose: in a loose knot —
      // FP3b: walked into place over ~0.8 s at the pose's start + back at its end, never a jump)
      if (m.role !== 'dog' && s.pose !== 'walk') {
        const dd = dirOfHd(s.to == null ? s.hd : s.to), d = dd === 1 || dd === -1 ? dd : 1;   // (the lead's settled facing, not its turn)
        let poseOff, poseHd = s.hd;
        if (s.pose === 'chat' || s.pose === 'shop' || s.pose === 'cart') { poseOff = { x: d * 0.95, z: 0.12 }; if (s.pose === 'chat') poseHd = hdOfDir(-d); }
        // (11a-1 — TRICK OR TREAT: the kids in a little row at the door beside the first, the grown-up a step back watching)
        else if (s.pose === 'treat') poseOff = m.role === 'chap' ? { x: 1.95, z: -0.6 } : { x: (m.slot % 2 ? 1 : -1) * 0.56 * Math.ceil(m.slot / 2), z: -0.12 * (m.slot % 2) };   // (the grown-up a step to the side: never between us + the kids)
        else if (s.pose === 'sit') poseOff = { x: 0.72, z: 0 };
        else { const i = Math.max(1, Math.round(Math.abs(m.dx) / 0.9)); poseOff = { x: (m.lag % 1.1 > 0.5 ? -1 : 1) * 0.75 * i, z: (i % 2 ? 0.2 : -0.15) }; }   // (waiting: a loose knot beside the lead)
        // (a short pose — a moment at the kerb — keeps the walking formation: nobody shuffles round for a second and a half)
        const total = (s.since || 0) + (s.left || 0), B = Math.min(1.2, total / 2);
        if (total < 3) poseOff = walkOff;
        const k = B <= 0 ? 1 : Math.max(0, Math.min(1, Math.min(s.since == null ? B : s.since, s.left == null ? B : s.left) / B));
        off = { x: walkOff.x + (poseOff.x - walkOff.x) * k, z: walkOff.z + (poseOff.z - walkOff.z) * k };
        if (k < 1) {
          // (stepping into place: turning from where they faced onto the move, a few steps, then turning to where they face next)
          const mx = poseOff.x - walkOff.x, mz = poseOff.z - walkOff.z, ml = Math.hypot(mx, mz), entering = (s.since || 0) < (s.left || 0);
          // (fixed ends — the lead's arrival heading + its pose's facing — never a heading that is itself still turning)
          const leadTo = s.to == null ? s.hd : s.to, poseTo = s.pose === 'chat' ? poseHd : leadTo;
          const u = entering ? k : 1 - k, hs = entering ? (s.from == null ? s.hd : s.from) : poseTo, he = entering ? poseTo : leadTo;
          if (ml > 0.05) {
            const mh = Math.atan2(entering ? mz : -mz, entering ? mx : -mx);
            st = { ...s, pose: 'walk', v: ml / B, dist: (m.seed % 97) + ml * u };
            hd = u < 0.4 ? lerpHd(hs, mh, u / 0.4) : u > 0.6 ? lerpHd(mh, he, (u - 0.6) / 0.4) : mh;
          } else hd = lerpHd(hs, he, u);
        } else hd = s.pose === 'chat' ? poseHd : s.hd;
      }
      let sniffK = 0;
      if (m.role === 'dog') { const dd = s.dir === 1 || s.dir === -1 ? s.dir : 1, ang = s.dir === 1 || s.dir === -1 ? 0 : 1; off = ang ? { x: m.dz, z: -m.dx * (s.dir === 2 ? -1 : 1) } : { x: m.dx * dd, z: m.dz };
        // (POLISH 5 — THE SNIFF: the dog trots forward on its leash off the floor's edge to the hydrant, its nose at it, and back — 0.9 s each way)
        if (s.sniff && M.hydrantSpot) { sniffK = Math.max(0, Math.min(1, (s.since || 0) / 0.9, (s.left == null ? 1 : s.left) / 0.9)); const tx = M.hydrantSpot.x - 0.78 - s.x, tz = M.hydrantSpot.z + 0.1 - s.z, e = sniffK * sniffK * (3 - 2 * sniffK);
          off = { x: off.x + (tx - off.x) * e, z: off.z + (tz - off.z) * e }; if (sniffK < 1) st = { ...st, v: 1.4, dist: (m.seed % 97) + (s.since || 0) * 1.4 }; } }
      // (FP3b — REAL DOORS: near a doorway a group falls into SINGLE FILE — each on the lead's path, its own lag behind — so nobody walks
      // through the wall beside the door; through the door itself, exactly on the path)
      else if (s.door) off = { x: 0, z: 0 };
      else if (s.z > M.face - 2.4 && s.pose !== 'treat') {   // (11a-1: the trick-or-treaters' row at the door keeps its spacing)
        const dn = Math.min(Math.abs(s.x - M.nodes.sideDoor.x), Math.abs(s.x - M.nodes.shopDoor.x)); if (dn < 1.8) { const k = Math.max(0, Math.min(1, (M.face - 0.6 - s.z) / 1.8)); off = { x: off.x * k, z: off.z * k }; } }
      // (never past the railing, never under the dock)
      const zz = s.z + off.z;
      if (!sniffK && (zz > FOLK.farZ + 0.25 || zz < FOLK.zMin - 0.3)) off.z = Math.max(FOLK.zMin - 0.3, Math.min(FOLK.farZ + 0.25, zz)) - s.z;
      members.push({ vid: v.id, kind: v.kind, look: v.look, gait: v.gait, party: !!v.party, m, s: { ...st, hd, dir: dirOfHd(hd), x: s.x + off.x, z: s.z + off.z }, hween: hw });
    }
  }
  // 11a-1 — A ZOMBIE NOTICES YOU: whoever walks within ZOMBIE.notice of a shambling zombie startles (arms up, a step back, then a laugh) and
  // the zombie reaches for them — a smooth function of the distance (PURE: positions are), never a jump
  const zs = members.filter(x => x.kind === 'zombie' && x.s.pose === 'walk');
  if (zs.length) for (const x of members) {
    if (x.kind === 'zombie' || x.kind === 'proc' || x.m.role === 'dog' || x.s.door) continue;
    let best = null, bd = ZOMBIE.notice;
    for (const z of zs) { const dd = Math.hypot(z.s.x - x.s.x, (z.s.z - x.s.z) * 1.3); if (dd < bd) { bd = dd; best = z; } }
    if (!best) continue;
    const k = smooth01((ZOMBIE.notice - bd) / 0.75);
    x.s = { ...x.s, startle: k, startleDir: best.s.x < x.s.x ? -1 : 1 };
    best.s = { ...best.s, reach: Math.max(best.s.reach || 0, k) };
  }
  // THE DOORS' openness now (FP3b: the leaf's swing — every member through it, each on its own lag, the closing tail included)
  const doors = { side: 0, shop: 0 };
  for (const v of LG ? all : [...A(ka), ...Bv(kb), ...forced, ...routine, ...hol]) {
    if (t < v.t0 - 1 || t > (v.tEnd || v.t1) + 2) continue;
    for (const lg of v.legs) {
      if (lg.k === 'door' && lg.door in doors) for (const m of v.members) if (m.role !== 'dog') doors[lg.door] = Math.max(doors[lg.door], doorOpenK(lg, t - m.lag));
      // (11a-1 — trick or treat: the door swings open on the kids at the step + shuts again — no one goes through)
      if (lg.swing && lg.swing.door in doors) doors[lg.swing.door] = Math.max(doors[lg.swing.door], doorOpenK(lg.swing, t));
    }
  }
  // the circle now: its level (0..1 formed — the floor spots + the moves follow it), its session
  const live = nowSess.find(x => t > x.s0 - 5 && t < x.s1 + 40), dance = live ? { on: true, k: danceLevel(live, t), id: live.id, s0: live.s0, s1: live.s1 } : { on: false, k: 0 };
  // the cart now: where it is (wheeled in / parked / wheeled out) — people.js draws it
  const cart = evNow ? { ...cartAt(evNow, t, cartIn(L.cam), cartX), z: L.cart.z, parked: t >= evNow.ta && t < evNow.tb } : { on: false };
  // POL4 — THE BACK ROAD'S TRAFFIC (core/harbor-traffic.js): the motorcars on the waterside road, queued behind the bus, on the signal
  // (8b2: the raid's convoy holds the near lane — nobody enters it behind them — and its patrol cars join the road's cars)
  const raidIn = (a, b) => (ctx.raid && ctx.raid.tEnd > a && ctx.raid.t0 < b ? [raidHold(ctx.raid)] : []);
  const cars = ctx.noCars ? [] : carsAt(t, { L, busesIn: (a, b) => [...busesNear(a, b), ...trucksNear(a, b), ...raidIn(a, b), ...cabsNear(a, b).map(pl => pl.T)], off: ctx.off, seed: ctx.seed, party: ctx.party, tag: ctx.raid ? ctx.raid.key : '', extra: ctx.snowWork ? (j, lane) => workSpawns(j, lane, ctx.snowWork) : null, extraKey: workKey(ctx.snowWork), hold });
  // (8b2: the cabs at the curb — the back road's cars drawn the same way; sign: the TAXI lamp, lit when free)
  if (!ctx.noCars) for (const pl of cabsNear(t - 5, t + 5)) { const T = pl.T; if (t < T.tE || t > T.tX) continue; const x = T.x(t); cars.push({ id: T.id, model: 'taxi', paint: 0, len: T.len, z: T.z, dir: 1, x, dist: T.dist(t), speed: t < T.tA ? Math.max(0, (T.x(t + 0.05) - x) / 0.05) : t >= T.tD ? (T.x(t + 0.05) - x) / 0.05 : 0, n: 5, glow: -1, cab: true, sign: T.sign(t), door: T.door ? T.door(t) : 0, ts: T.tE }); }
  if (RP) { const R = raidAt(RP, t); if (R) cars.push(...R.cars); }
  // 8b1 — THE CREW now: the roof's workers (the billposter, the gardener, the cleanup crew), their props, their trucks, the traces
  const crewRoof = [];
  for (const v of crewNow.roof) { const s = visitAt(v, t); if (s) crewRoof.push({ vid: v.id, kind: v.kind, look: v.look, party: false, routine: 'work', m: v.members[0], s, roof: true }); }
  const trucks = crewNow.trucks.map(T => { const x = T.x(t); return { id: T.id, model: T.model, word: T.word, trade: T.trade, paint: T.paint, dark: T.dark, len: T.len, z: T.z, dir: 1, x, dist: T.dist(t), speed: t < T.tA ? Math.max(0, (T.x(t + 0.05) - x) / 0.05) : t >= T.tD ? (T.x(t + 0.05) - x) / 0.05 : 0, n: 3, glow: -1, truck: true, parked: t >= T.tA && t < T.tD, tA: T.tA, tD: T.tD }; });
  const crew = { roof: crewRoof, props: crewNow.props, trucks, marks: crewNow.marks, traces: ctx.noWork ? null : tracesAt(t, crewW, cache.crew), spots: cache.crew.get('P') || null, works: (crewNow.works || []).map(w => w.kind) };
  const ln = lineOf(t), line = ln && t >= ln.T0 - 60 && t < ln.T1 + 120 ? { on: true, n: members.filter(m => m.kind === 'liner' && m.s.pose === 'wait' && !m.s.door).length, admits: ln.admits.filter(a => a > t - 600 && a < t + 600).length } : { on: false, n: 0 };
  return { visits: all, members, doors, dance, cart, cars, line, crew, witness: inWin ? { kind: LG.kind, t0: LG.t0, n: reacted.length } : null, buses: buses.map(b => { const sh = doorShut(b); return { ...b, shut: sh, xNow: b.x(t), door: t >= b.tA + 0.8 && t < sh }; }) };
}

// ------------------------------------------------------------------ 11a-1 — THE PEOPLE OF THE HOLIDAYS: the visits (PURE)
/** a trick-or-treat group (core/harbor-holidayfolk.js#totGroups) → a visit: in from an edge, to the door (the treat), on to the other
 *  side; the first kid leads, the others beside + behind it, the grown-up a step behind them all */
function totVisit(g, M) {
  const r = rngFrom(g.seed), spec = { look: 'trick', gait: 'walk', goals: [{ from: g.from }, { treat: g.door, dur: g.treat }, { exit: g.from === 'left' ? 'right' : r() < 0.6 ? 'left' : 'right' }] };
  const vis = planVisit(spec, g.t, M, { r, shopOpen: true });
  if (!vis) return null;
  const members = g.kids.map((k, i) => ({ role: i ? 'kid' : 'lead', slot: i, costume: k.costume, carry: k.carry, glowstick: k.glow, dx: i ? -0.42 * Math.ceil(i / 2) : 0, dz: i ? (i % 2 ? 0.55 : -0.5) : 0, lag: i * 0.24, seed: k.seed }));
  members.push({ role: 'chap', dx: -0.9, dz: 1.0, lag: 0.45, seed: g.chap.seed, hat: g.chap.hat, torch: g.chap.torch });
  return { id: `tot.${Math.round(g.t * 10)}`, kind: 'trick', routine: 'holiday', look: 'trick', gait: 'walk', ...vis, tEnd: vis.t1 + 1, members };
}
/** a zombie group → a visit: shambling in from an edge, across the promenade + away, or in at the side door (the party) */
function zombieVisit(g, M) {
  const r = rngFrom(g.seed), spec = { look: 'zombie', gait: 'shamble', goals: [{ from: g.from }, ...(g.inside ? [{ door: 'side' }] : [{ at: { x: M.nodes.inlay.x + (r() - 0.5) * 6, z: M.nodes.inlay.z + (r() - 0.5) * 2.5 } }, { exit: g.from === 'left' ? 'right' : 'left' }])] };
  const vis = planVisit(spec, g.t, M, { r, shopOpen: true });
  if (!vis) return null;
  const members = g.looks.map((o, i) => ({ role: i ? 'guest' : 'lead', zlook: o.look, dx: i ? -0.85 * Math.ceil(i / 2) : 0, dz: i ? (i % 2 ? 0.5 : -0.35) : 0, lag: i * 0.8, seed: o.seed }));
  return { id: `zom.${Math.round(g.t * 10)}`, kind: 'zombie', routine: 'holiday', look: 'zombie', gait: 'shamble', ...vis, tEnd: vis.t1 + (g.n - 1) * 0.8, members };
}
/** a procession walker (or its trio / its ofrenda's two bearers) → a visit: out from behind the speakeasy, along the near lane, off the
 *  right edge, at the procession's pace */
function procVisit(e, x0, x1) {
  const X1 = x1(e.z), t1 = e.t + (X1 - x0) / PROC.v;
  const legs = [{ k: 'walk', pts: [{ x: x0, z: e.z }, { x: X1, z: e.z }], t0: e.t, t1, v: PROC.v }];
  const members = e.members ? e.members.map((m, i) => ({ role: i ? 'guest' : 'lead', costume: e.role, inst: m.inst || null, bearer: e.group === 'ofrenda' ? i : null, dx: m.dx, dz: m.dz, lag: 0, seed: e.seed + i * 7, pn: e.n }))
    : [{ role: 'lead', costume: e.role, dx: 0, dz: 0, lag: 0, seed: e.seed, pn: e.n }];
  const back = e.members ? Math.max(...e.members.map(m => -m.dx)) : 0;
  return { id: `proc.${Math.round(e.t * 10)}`, kind: 'proc', routine: 'proc', idx: e.n, group: e.group || null, look: 'proc', gait: 'stroll', legs, t0: e.t, t1, tEnd: t1 + back / PROC.v + 0.5, members };
}

/** 11a-2 — a parade marcher (a band member, a balloon's handler, a float's farmer) → a visit: in from behind the speakeasy at the unit's
 *  pace — the moment its place in the unit (dx behind the head) reaches the route's start — off the right edge */
function paradeVisit(u, p, j, x0, x1) {
  const X1 = x1(p.z) + 2, t0 = u.t + (-p.dx) / PARADE.v, t1 = t0 + (X1 - x0) / PARADE.v;
  return { id: `par.${u.i}.${j}`, kind: 'parade', routine: 'parade', idx: u.i, unit: u.kind, look: 'parade', gait: 'walk', legs: [{ k: 'walk', pts: [{ x: x0, z: p.z }, { x: X1, z: p.z }], t0, t1, v: PARADE.v }],
    t0, t1, tEnd: t1 + 0.5, members: [{ role: 'lead', costume: p.role, inst: p.role === 'brass' ? 'trumpet' : p.role === 'drum' ? 'drum' : p.role === 'tuba' ? 'tuba' : p.role === 'drummajor' ? 'baton' : p.role === 'handler' ? 'rope' : null, dx: 0, dz: 0, lag: 0, seed: p.seed }] };
}
/** 11a-2 — a spectator: in from the nearer edge before the parade, at the kerb facing the road — WAVING (arms up, a cheer) while a balloon
 *  is in front, watching between — off again after */
function crowdVisit(s, M, L) {
  const r = rngFrom(s.seed), spot = { x: s.x, z: s.z }, kid = r() < 0.3;
  const a = planVisit({ look: kid ? 'kid' : r() < 0.5 ? 'walker' : 'stroll', gait: kid ? 'kid' : 'stroll', goals: [{ from: s.x < 4 ? 'left' : 'right' }, { at: spot }] }, s.t0, M, { r });
  if (!a) return null;
  const legs = [...a.legs], hd = PI / 2 + (r() - 0.5) * 0.5;
  let t = a.t1;
  for (const [c0, c1] of s.cheers) { if (c1 <= t) continue; if (c0 > t) legs.push({ k: 'pose', pose: 'watch', x: spot.x, z: spot.z, t0: t, t1: c0, hd }); legs.push({ k: 'pose', pose: 'wave', x: spot.x, z: spot.z, t0: Math.max(t, c0), t1: c1, hd }); t = c1; }
  if (s.t1 > t) legs.push({ k: 'pose', pose: 'watch', x: spot.x, z: spot.z, t0: t, t1: s.t1, hd });
  const b = planVisit({ look: 'stroll', gait: 'stroll', goals: [{ exit: 'any' }] }, Math.max(t, s.t1), M, { r, start: spot });
  if (!b) return null;
  return { id: `pc.${s.k}.${Math.round(s.t0)}`, kind: 'spectator', routine: 'parade', look: kid ? 'kid' : 'stroll', gait: kid ? 'kid' : 'stroll', legs: [...legs, ...b.legs], t0: a.t0, t1: b.t1, tEnd: b.t1, members: [{ role: 'lead', dx: 0, dz: 0, lag: 0, seed: s.seed }] };
}

// ------------------------------------------------------------------ THE DANCE CIRCLE's people (FP3b item 9 — core/harbor-routines.js)
/** a circle's visits (PURE): the dancers out of the side door (real doors) to their spots round the compass, dancing (pose 'wands')
 *  until it ends, then back in one by one; the watchers in from the edges to spots behind + beside it, clapping / bobbing / watching,
 *  then away. Each visit: { routine: 'dance', idx } (people.js#wands reads the index: the moves, the colour, the race) */
function planDance(sess, M, L) {
  if (sess.ring) return planRing(sess, M, L);
  const m = L.medallion, r = rngFrom(sess.seed), out = [];
  const lead = () => [{ role: 'lead', dx: 0, dz: 0, lag: 0, seed: Math.floor(r() * 1e6) }];
  for (let i = 0; i < sess.dancers; i++) {
    const spot = danceSpot(m, i, sess.seed), start = sess.s0 + i * DANCE.stagger;
    const a = planVisit({ look: 'guest', gait: 'walk', goals: [{ from: 'side' }, { at: spot }] }, start, M, { r });
    const tEnd = sess.s1 + i * 1.3;
    if (!a || a.t1 >= tEnd - 20) continue;
    // (facing mostly toward us — the moves read — turned a little toward the compass's centre)
    const hd = lerpHd(-PI / 2, Math.atan2(m.z - spot.z, m.x - spot.x), 0.3);
    const b = planVisit({ look: 'guest', gait: 'walk', goals: [{ door: 'side' }] }, tEnd, M, { r, start: spot });
    if (!b) continue;
    out.push({ id: `${sess.id}.d${i}`, kind: 'dancer', routine: 'dance', idx: i, look: 'guest', gait: 'walk', party: true,
      legs: [...a.legs, { k: 'pose', pose: 'wands', x: spot.x, z: spot.z, t0: a.t1, t1: tEnd, hd }, ...b.legs], t0: a.t0, t1: b.t1, tEnd: b.t1, members: lead() });
  }
  for (let k = 0; k < sess.watchers; k++) {
    // (a watcher's spot: behind / beside the circle, never in a no-go area — the bench's corner, the building, a lamp)
    let spot = null;
    for (let tries = 0; tries < 8 && !spot; tries++) { const p = watchSpot(m, k, sess.watchers, r); if (p.z <= FOLK.zMax && p.z >= FOLK.zMin + 0.3 && !M.rects.some(o => inRect(p, o)) && !M.circles.some(c => c.id !== 'event' && Math.hypot(p.x - c.x, p.z - c.z) < c.r + 0.3)) spot = p; }
    if (!spot) continue;
    const start = sess.s0 + 4 + r() * 30;
    const a = planVisit({ look: r() < 0.5 ? 'guest' : 'couple', gait: 'stroll', goals: [{ from: spot.x < m.x ? 'left' : 'right' }, { at: spot }] }, start, M, { r });
    const tEnd = sess.s1 + 4 + r() * 14;
    if (!a || a.t1 >= tEnd - 20) continue;
    const b = planVisit({ look: 'guest', gait: 'stroll', goals: [{ exit: 'any' }] }, tEnd, M, { r, start: spot });
    if (!b) continue;
    const pose = ['clap', 'bob', 'watch', 'bob', 'clap'][k % 5];
    out.push({ id: `${sess.id}.w${k}`, kind: 'watcher', routine: 'dance', idx: k, look: 'guest', gait: 'stroll', party: true,
      legs: [...a.legs, { k: 'pose', pose, x: spot.x, z: spot.z, t0: a.t1, t1: tEnd, hd: Math.atan2(m.z - spot.z, m.x - spot.x) }, ...b.legs], t0: a.t0, t1: b.t1, tEnd: b.t1, members: lead() });
  }
  return out;
}

/** 11a-2 — THE RING round the giant jack-o'-lantern (core/harbor-routines.js#RING): the dancers out of the side door to their places evenly
 *  round it (a late one goes straight to where the ring has got to), dancing in place for a phrase, then all stepping one place on along
 *  the arc together (a walk leg along the circle — never a slide), again + again, then back in; the watchers as the circle's */
function planRing(sess, M, L) {
  const m = L.medallion, r = rngFrom(sess.seed), out = [], n = sess.dancers, step = 2 * PI / n, P = RING.phrase + RING.move, T0 = sess.s0 + RING.first;
  const angle = (i, pos) => -PI / 2 + step / 2 + (i + pos) * step;
  const spotAt = (i, pos) => ringAt(m, angle(i, pos));
  const posAt = tA => (tA < T0 ? 0 : Math.floor((tA - T0) / P) + 1);         // (the places the ring has moved on by tA)
  const face = sp => lerpHd(-PI / 2, Math.atan2(m.z - sp.z, m.x - sp.x), 0.3);
  const lead = () => [{ role: 'lead', dx: 0, dz: 0, lag: 0, seed: Math.floor(r() * 1e6) }];
  for (let i = 0; i < n; i++) {
    const start = sess.s0 + i * DANCE.stagger, tEnd = sess.s1 + i * 1.3;
    let a = planVisit({ look: 'guest', gait: 'walk', goals: [{ from: 'side' }, { at: spotAt(i, 0) }] }, start, M, { r });
    if (!a) continue;
    let pos = posAt(a.t1 + 1);
    if (pos > 0) { a = planVisit({ look: 'guest', gait: 'walk', goals: [{ from: 'side' }, { at: spotAt(i, pos) }] }, start, M, { r }); if (!a) continue; pos = posAt(a.t1 + 1); }
    if (a.t1 >= tEnd - 20) continue;
    const legs = [...a.legs];
    let t = a.t1;
    for (let guard = 0; guard < 64; guard++) {
      const Tm = T0 + pos * P, sp = spotAt(i, pos);
      if (Tm + RING.move >= tEnd - 1) { legs.push({ k: 'pose', pose: 'wands', x: sp.x, z: sp.z, t0: t, t1: tEnd, hd: face(sp) }); break; }
      if (Tm > t) legs.push({ k: 'pose', pose: 'wands', x: sp.x, z: sp.z, t0: t, t1: Tm, hd: face(sp) });
      const a0 = angle(i, pos), pts = []; for (let q = 0; q <= 8; q++) pts.push(ringAt(m, a0 + step * q / 8));
      const t1 = Math.max(Tm, t) + RING.move;
      legs.push({ k: 'walk', pts, t0: Math.max(Tm, t), t1, v: pathLen(pts) / RING.move });
      t = t1; pos++;
    }
    const last = legs[legs.length - 1], end = { x: last.x, z: last.z };
    const b = planVisit({ look: 'guest', gait: 'walk', goals: [{ door: 'side' }] }, tEnd, M, { r, start: end });
    if (!b) continue;
    out.push({ id: `${sess.id}.d${i}`, kind: 'dancer', routine: 'dance', idx: i, look: 'guest', gait: 'walk', party: true, ring: true, legs: [...legs, ...b.legs], t0: a.t0, t1: b.t1, tEnd: b.t1, members: lead() });
  }
  // (the watchers: the circle's own — behind + beside, further out than the ring)
  const base = planDance({ ...sess, ring: false, dancers: 0 }, M, L);
  return [...out, ...base];
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
/** POLISH 5 — THE LOBBY LINE, WHO IS WHO: a FEASIBILITY layout only (behind &lineproto=1 — never shipped on; Lobby 2.0 decides): ALL the
 *  lobby's players (up to 8) in a STAGGERED TWO-DEEP LINE — pairs offset half a step so every head is clear, the front pair at the
 *  door, the line running left along the barbershop front and stepping DOWN the sidewalk toward the camera (nearer = a little bigger),
 *  clear of the left edge + the dock → [{ x, z, i, j (0 the back file, 1 the front) }] */
export function linePlaces2(L, n, { margin = 14 } = {}) {
  const cam = L.cam, s = L.speakeasy, F = FOLK, out = [];
  const doorL = s.x0 + s.door.u0 - 0.5, xMin = z => (margin - cam.VPX) * z / cam.F + 0.5, step = 1.12, z0 = F.doorZ - 0.32;
  for (let i = 0; i < n; i++) {
    const k = Math.floor(i / 2), j = i % 2;
    const z = Math.max(F.zMin + 0.12, z0 - j * 0.9 - k * 0.62), x = Math.max(xMin(z) + j * 0.55, doorL - k * step - j * step * 0.5);
    out.push({ x, z, i, j });
  }
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
  const party = ctx.party ? ctx.party(t0 + B / 2) : partyAtT(t0 + B / 2, ctx.off), crowd = roofCrowd({ h: loc.h, dow: loc.dow, month: loc.month, party, rain: ctx.rain || 0 });
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
    let off = { x: (s.dir === 1 || s.dir === -1 ? -s.dir * 0.4 : 0.5), z: m.role === 'lead' ? 0 : 0.35 }, hd = s.hd;
    if (m.role !== 'lead' && s.pose !== 'walk') { const d = s.dir === 1 || s.dir === -1 ? s.dir : 1; off = { x: d * 0.85, z: 0.1 }; if (s.pose === 'dance' || s.pose === 'toast') hd = hdOfDir(-d); }
    members.push({ vid: v.id, kind: v.kind, look: v.look, party: !!v.party, m, s: { ...s, hd, dir: dirOfHd(hd), x: s.x + (m.role === 'lead' ? 0 : off.x), z: s.z + (m.role === 'lead' ? 0 : off.z) } });
  }
  return { visits: all, members };
}
