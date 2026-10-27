// CITY 2.0 — THE HARBOR, PART 8b2: THE RAID (plan.md Part 7 "THE RAID" + the owner's Oct 25 schedule). PURE — tested in
// tests/harbor-raid.test.mjs; drawn by screens/harbor/raid.js (the wash, the shades, the beam) + people.js (the patrol cars on the back
// road, the officer) + speakeasy.js (its power hook); heard through sounds.js.
//   WHEN   it follows THE BOOTLEGGERS: the night after a delivery (a quiet weeknight one — core/harbor-workers.js#bootlegNight — or
//          Saturday's big one) has RAID.after (~50 %) chance of ONE raid, in prime time (RAID.window, ~9:20–10:45 pm); plus a rare
//          PARTY-NIGHT raid (RAID.party, ~once a month); ~one a week in all; seeded by the date (every phone the same). Never on a
//          holiday, a legendary sky night (core/harbor-legend.js#legendNight — the UFO / the TR-3B own those), nor across a worker's show
//          (it slides off it inside the window, or skips the night); the party's midnight finale is after the window by design.
//   WHAT   a convoy of RAID.cars black-and-white 1920s patrol cars (the vehicle kit's 'police') comes out from behind the speakeasy on
//          the back road's near lane, red + blue washing over the side wall, the wet road, the promenade's back edge + the water; the
//          instant the first appears EVERY speakeasy light cuts out + the shades snap shut; they slow outside; the LAST one stops at the
//          stop line, an officer gets out to the kerb + sweeps the dark windows with his flashlight; the others roll on across the
//          crossing (timed for the road's green — never through the walkers); he gets back in, it pulls away on green; a beat after it's
//          gone one window flickers back, then another, and the party returns (louder on a party night).
//   HOW    raidEvening(key) → the night's raid (or null); raidPlan(t0, L) → the convoy simulated once (every phone the same, joined
//          mid-way) + the officer's visit + the moments; raidAt(plan, t) → what's happening now.
import { rngFrom, hashString } from './rng.js';
import { bootlegNight, workDay, prevKey, dayOf } from './harbor-workers.js';
import { partyAt } from './harbor-moments.js';
import { legendNight } from './harbor-legend.js';
import { holidayOf } from './sky.js';
import { signalAt } from './harbor-promenade.js';
import { trafficLanes } from './harbor-traffic.js';
import { FOLK, folkMap, route } from './harbor-people.js';

const H = 3600;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
/** the numbers: the convoy (cars, the police car's length, the gap between them, cruise + crawl speeds u / s, acceleration + braking,
 *  the sim step), the schedule (the window in local hours, the chances), the officer (s), the lights coming back (s after the last car
 *  is past the crossing), the length of the whole event (cap), the forced preview's period */
export const RAID = Object.freeze({
  cars: 4, len: 4.75, gap: 2.6, v: 4.6, crawl: 2.2, acc: 1.5, brake: 2.4, dt: 0.1,
  window: [21.33, 22.75], after: 0.5, party: 0.12,
  // (C2 — the owner: "he shines on the speakeasy's FRONT while standing at its SIDE — he must WALK to where he can see the front":
  // out of the car he strides (FOLK.speed.brisk) round the bench + the crabapple onto the promenade, to `stand` (in front of the
  // facade, right of its corner — z under the front's z0), turns to the windows, shines for `sweep` s, strides back; the raid ~10 s
  // shorter in all: the sweep 10.5 → 6 s, the stopper leaves on the green that keeps the wait shortest, the lights back sooner)
  officer: { out: 1.4, sweep: [5, 11], back: 1.0, v: 1.9, stand: { x: 1.2, z: 42.6 } },
  back: { delay: 3, stagger: [0, 2.0, 3.6, 4.6, 5.6, 6.8], full: 9 },
  cap: 120, forced: 150,
  // 8b2 add-on — THE RAID FROM THE FRONT: one patrol car pulls up on the FRONT street (under the dock), right below the speakeasy, as the
  // lights cut (it's what they're running from); its car-mounted spotlight sweeps the facade; it leaves with the convoy. `screen`: where
  // its middle stops (a share of the screen's width — under the speakeasy, the whole car on screen when the dock rests)
  front: { v: 6.4, brake: 2.8, acc: 1.4, lead: 3.2, screen: 0.19, on: 1.0, off: 1.2 },
});

// ------------------------------------------------------------------ WHEN
const ymd = key => key.split('-').map(Number);
const dowOf = key => { const [y, m, d] = ymd(key); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); };
/**
 * The raid of the evening of local day `key` (PURE): ctx { seed, off, day0 (key's local midnight, abs s), noShows? } → { key, t0 (abs s:
 * the lead car enters), party, why: 'after-delivery' | 'party' } | null
 */
export function raidEvening(key, ctx = {}) {
  const r = rngFrom(hashString(`raid|${ctx.seed || 1924}|${key}`)), uA = r(), uP = r(), uT = r();
  const dow = dowOf(key), prev = prevKey(key), [y, m, d] = ymd(key);
  const delivered = bootlegNight(prev, ctx) || dowOf(prev) === 6;      // (a quiet weeknight delivery, or Saturday's big one)
  const party = partyAt(dow, 22, key);
  const why = delivered && uA < RAID.after ? 'after-delivery' : party && uP < RAID.party ? 'party' : null;
  if (!why) return null;
  const hol = holidayOf(y, m, d);
  if (hol && hol.full) return null;
  if (legendNight(y, m, d)) return null;
  const day0 = ctx.day0 != null ? ctx.day0 : null;
  if (day0 == null) return null;
  let h = RAID.window[0] + uT * (RAID.window[1] - RAID.window[0]);
  // (never across a worker's show: slide later past it inside the window, else earlier, else skip the night)
  if (!ctx.noShows) {
    const shows = workDay(key, { seed: ctx.seed, off: ctx.off, day0 }).filter(w => w.show);
    const clash = hh => shows.find(w => day0 + hh * H < w.t1 + 60 && day0 + hh * H + RAID.cap > w.t0 - 60);
    for (let k = 0; k < 6 && clash(h); k++) { const w = clash(h); h = (w.t1 + 90 - day0) / H; }
    if (h > RAID.window[1] || clash(h)) { h = RAID.window[0]; if (clash(h)) return null; }
  }
  return { key, t0: Math.round(day0 + h * H), party, why };
}
/** the raid whose span covers t (this evening's or yesterday's) — ctx as raidEvening + off (minutes) → the raid or null */
export function raidNear(t, ctx = {}) {
  for (const back of [0, 1]) {
    const dd = dayOf(t - back * 86400, ctx.off || 0), rd = raidEvening(dd.key, { ...ctx, day0: dd.day0 });
    if (rd && t >= rd.t0 - 20 && t < rd.t0 + RAID.cap) return rd;
  }
  return null;
}
/** the forced preview (&force=raid): one every RAID.forced s from `since` (the city clock, s) — a party feel on a party night */
export function forcedRaid(t, since = 0, party = false) {
  const n = Math.floor((t - since) / RAID.forced);
  return { key: `forced-${n}`, t0: since + n * RAID.forced + 3, party, why: 'forced' };   // (POLISH 5: the siren at once, the convoy ~7 s in)
}

// ------------------------------------------------------------------ WHAT (the convoy simulated once)
/**
 * The raid's plan for a layout (PURE): → { t0, cars: [{ id, n, ts, xs (Float32Array: x every dt), len, z, dir, stopper }], tAppear,
 * tStop, tReady, tDepart, tPast (the last car beyond the crossing), tBack (the lights start coming back), tEnd, officer (a people visit),
 * stopX, party }. The convoy comes out of the near lane's left (behind the speakeasy); its timing is shifted (≤ one signal cycle) so the
 * cars that roll on cross the crosswalk on the road's GREEN.
 */
export function raidPlan(raid, L) {
  const ln = trafficLanes(L).near, cw = L.crosswalk, dt = RAID.dt, len = RAID.len, sx = L.speakeasy ? L.speakeasy.x1 : -6;
  const appearX = sx + 0.3, stopX = ln.line - len / 2, slow0 = appearX - 1, past = cw.x1 + len / 2 + 2;
  // (the crossing's span the rolling cars occupy: their nose at the stop line → their tail past the far edge)
  const crossSpan = [ln.line - 0.2, cw.x1 + len + 0.3];
  const N = RAID.cars, spacing = len + RAID.gap;
  // THE OFFICER's walk (planned first: the stopper waits for him): out of the kerb-side door → round the furniture → `stand`
  const O = RAID.officer, door = { x: ln.line - len / 2 + 0.55, z: ln.z - 1.15 };
  // (a cop steps straight over the kerb — the people's map keeps walkers to the crosswalk; his has no road / kerb blocks, still round
  // the bench + the crabapple's baked corner)
  const M0 = folkMap(L), M = { ...M0, rects: M0.rects.filter(r => !['road', 'curb-l', 'curb-r'].includes(r.id)) };
  const pathTo = route(M, door, O.stand), pathBack = [...pathTo].reverse();
  let walkLen = 0; for (let i = 1; i < pathTo.length; i++) walkLen += Math.hypot(pathTo[i].x - pathTo[i - 1].x, pathTo[i].z - pathTo[i - 1].z);
  const walkS = walkLen / O.v, offBase = O.out + walkS + walkS + O.back + 0.8;   // (+ his sweep: it fits the next green — below)
  // the speed a rolling car wants at x: cruise in, CRAWL from the speakeasy's corner past the crossing, then away
  const vWant = x => (x < slow0 ? RAID.v : x < past ? RAID.crawl : RAID.v + 0.4);
  // (the time a crawling car needs to clear the crossing: it only enters with that much green left — out before the walkers' WALK)
  const holdRed = raid.why === 'forced', clearS = (crossSpan[1] - crossSpan[0]) / RAID.crawl + 0.5;
  const simulate = t0 => {
    const cars = Array.from({ length: N }, (_, i) => ({ i, x: ln.xIn - i * spacing, vel: RAID.v, xs: [], stopper: i === N - 1, held: false, ts: t0 }));
    let tStop = null, tReady = null, tDepart = null, sweep = O.sweep[0], onCross = [];
    const tMax = t0 + RAID.cap;
    for (let t = t0; t < tMax; t += dt) {
      for (const c of cars) {
        let vT = vWant(c.x), room = Infinity;
        if (c.stopper && tDepart == null) { room = stopX - c.x; vT = Math.min(vT, Math.sqrt(2 * RAID.brake * 0.7 * Math.max(0, room - 0.02))); }
        if (c.stopper && tDepart != null && t >= tDepart) vT = RAID.v + 0.4;
        const ahead = cars[c.i - 1];
        if (ahead) { const d = ahead.x - c.x - len; vT = Math.min(vT, Math.sqrt(2 * RAID.brake * 0.7 * Math.max(0, d - 1.4))); }
        // (POLISH 5 — a FORCED raid starts at once: its rolling cars keep to the light like the trucks — held at the line on red, away on
        // the green — so the convoy needn't be timed to arrive on a green)
        if (holdRed && !c.stopper && c.x + len / 2 < ln.line - 0.05) { const S = signalAt(t * 1000); if (S.road !== 'green' || S.left < clearS) { const rm = ln.line - len / 2 - 0.35 - c.x; vT = Math.min(vT, Math.sqrt(2 * RAID.brake * 0.7 * Math.max(0, rm))); } }
        let v = vT > c.vel ? Math.min(vT, c.vel + RAID.acc * dt) : Math.max(vT, c.vel - RAID.brake * 1.4 * dt);
        if (c.stopper && tDepart == null && v * dt > room) v = Math.max(0, room / dt);
        c.vel = Math.max(0, v); c.x += c.vel * dt; c.xs.push(c.x);
        if (c.stopper && tStop == null && c.vel < 0.03 && c.x > stopX - 0.3) { tStop = t; 
          // (C2: his sweep — O.sweep s — stretched so he's back in just as the road turns green: the car leaves straight away)
          const b0 = t + offBase; tReady = b0 + O.sweep[0];
          for (let u = b0 + O.sweep[0]; u <= b0 + O.sweep[1]; u += 0.25) { const S = signalAt(u * 1000); if (S.road === 'green' && S.left > 4.5) { tReady = u; break; } if (u + 0.25 > b0 + O.sweep[1]) tReady = b0 + O.sweep[0]; }
          sweep = tReady - b0; }
        if (!c.stopper && c.x + len / 2 > crossSpan[0] && c.x - len / 2 < crossSpan[1]) onCross.push(t);
      }
      if (tReady != null && tDepart == null && t >= tReady) {
        // (it pulls away only on the road's green with time to clear the crosswalk — like the trucks)
        const S = signalAt(t * 1000); if (S.road === 'green' && S.left > 4.5) tDepart = t;
      }
      if (cars.every(c => c.x > Math.abs(ln.xOut) + len)) break;
    }
    return { cars, tStop, tReady, tDepart, sweep, onCross };
  };
  // the shift (from the raid's own t0, in 1 s steps over a signal cycle): its rolling cars only cross on green, and — C2 — of those,
  // the one whose stopper waits LEAST for its green to pull away (it waited ~17 s every time: the convoy's phase was always the same)
  let best = null, bestWait = Infinity, fallback = null;
  for (let s = 0; s <= 60; s += 1) {
    const sim = simulate(raid.t0 + s);
    if (!fallback) fallback = { sim, t0: raid.t0 + s };
    if (!holdRed && !sim.onCross.every(t => signalAt(t * 1000).road === 'green')) continue;
    if (holdRed && !sim.onCross.every(t => signalAt(t * 1000).walk !== 'walk')) continue;   // (held at the line: never on the crossing during WALK)
    // (scored: the wait + a little for each second it starts later — a preview from the panel shouldn't keep him waiting either)
    // (POLISH 5 — a FORCED raid starts at once: the earliest start whose rolling cars still cross on green wins — the officer's own
    // wait at the end is the event's middle, not a delay before it)
    const wait = (sim.tDepart != null && sim.tReady != null ? sim.tDepart - sim.tReady : 99) + (raid.why === 'forced' ? 3 : 0.3) * s;
    if (wait < bestWait - 0.2) { best = { sim, t0: raid.t0 + s }; bestWait = wait; }
    if (wait < 2.5 || holdRed) break;               // (forced: the first start that works)
  }
  if (!best) best = fallback;
  const { sim, t0 } = best, last = sim.cars[N - 1];
  const tAt = (c, x) => { const i = c.xs.findIndex(v => v >= x); return i < 0 ? null : t0 + i * dt; };
  const tAppear = tAt(sim.cars[0], appearX - len / 2) ?? t0 + 3;
  const tPast = tAt(last, cw.x1 + len / 2 + 1.5) ?? (sim.tDepart || t0 + 60) + 3;
  const tEnd = t0 + Math.max(...sim.cars.map(c => c.xs.length)) * dt;
  const tBack = tPast + RAID.back.delay;
  // THE OFFICER: out of the stopped car's kerb side, striding round the bench + the crabapple onto the promenade IN FRONT of the
  // facade (C2), turned to the windows, the flashlight swept over them from his hand, back the same way + in (a people visit: folk.js
  // draws him; raid.js draws the beam from his hand)
  let officer = null;
  if (sim.tStop != null) {
    const ta = sim.tStop + O.out, tb = ta + walkS, ts = tb + sim.sweep, tc = ts + walkS;
    const fx = L.speakeasy ? (L.speakeasy.x0 + L.speakeasy.x1) / 2 + 2 : -9, fz = L.speakeasy ? L.speakeasy.z0 : 44;
    const aim = Math.atan2(fz - O.stand.z, fx - O.stand.x);
    officer = {
      id: `raid.${raid.key}.officer`, kind: 'officer', routine: 'raid', idx: 0, look: 'cop', gait: 'walk', t0: ta, t1: tc, tEnd: tc,
      legs: [
        { k: 'walk', pts: pathTo, t0: ta, t1: tb, v: O.v },
        { k: 'pose', pose: 'flash', x: O.stand.x, z: O.stand.z, t0: tb, t1: ts, hd: aim, carry: 'flashlight' },
        { k: 'walk', pts: pathBack, t0: ts, t1: tc, v: O.v },
      ],
      members: [{ role: 'lead', dx: 0, dz: 0, lag: 0, seed: 4471 }],
      beam: { t0: tb + 0.5, t1: ts },
    };
  }
  // THE FRONT CAR (the add-on): in from the right on the street's far lane (westbound, by the curb), braking to its stop below the
  // speakeasy as the lights cut, its spotlight on, away to the left once the last of the convoy is past the crossing
  let front = null;
  const st = L.impliedRoad && L.impliedRoad.street, cam = L.cam;
  if (st && cam) {
    const F = RAID.front, lane = st.lanes[0], z = lane.z, hw = cam.hw(z), xStop = ((F.screen * cam.W - cam.VPX) * z) / cam.F;
    const xIn = hw + len, dB = F.v * F.v / (2 * F.brake), tB = F.v / F.brake;
    const tStopF = tAppear + F.lead, tBrake = tStopF - tB, tEnter = tBrake - Math.max(0, xIn - xStop - dB) / F.v;
    const tGo = Math.max(tStopF + 8, tPast + 1.5), xOut = -hw - len;
    const tOut = tGo + Math.sqrt(2 * Math.abs(xOut - xStop) / F.acc);
    front = { z, dir: -1, len, xStop, xIn, tEnter, tBrake, tStop: tStopF, tGo, tOut, spot: { t0: tStopF + F.on, t1: tGo - F.off } };
  }
  return {
    key: raid.key, party: !!raid.party, why: raid.why, t0, tAppear, front, tStop: sim.tStop, tReady: sim.tReady, tDepart: sim.tDepart, tPast, tBack, tEnd: Math.max(tEnd, tBack + RAID.back.full + 2),
    stopX, appearX, z: ln.z, dir: ln.dir, len,
    cars: sim.cars.map(c => ({ id: `raid.${raid.key}.${c.i}`, n: c.i, ts: t0, xs: Float32Array.from(c.xs), len, z: ln.z, dir: ln.dir, stopper: c.stopper })),
    officer,
  };
}
/** the front car at t → { x, z, dir, speed, dist, stopped } | null (off the street) */
export function frontCarAt(f, t) {
  if (!f || t < f.tEnter || t > f.tOut) return null;
  const F = RAID.front, dB = F.v * F.v / (2 * F.brake);
  let x, v;
  if (t < f.tBrake) { x = f.xStop + dB + (f.tBrake - t) * F.v; v = F.v; }
  else if (t < f.tStop) { const u = f.tStop - t; x = f.xStop + 0.5 * F.brake * u * u; v = F.brake * u; }
  else if (t < f.tGo) { x = f.xStop; v = 0; }
  else { const u = t - f.tGo; x = f.xStop - 0.5 * F.acc * u * u; v = F.acc * u; }
  return { x, z: f.z, dir: f.dir, speed: v, dist: Math.abs(f.xIn - x), stopped: t >= f.tStop && t < f.tGo };
}
/** a convoy car at t → { x, speed, dist } | null (THE BACK ROAD's carState shape) */
export function raidCarAt(car, t) {
  const u = (t - car.ts) / RAID.dt, i = Math.floor(u);
  if (u < 0 || i >= car.xs.length - 1) return null;
  const f = u - i, x = car.xs[i] + (car.xs[i + 1] - car.xs[i]) * f;
  return { x, speed: Math.abs(car.xs[i + 1] - car.xs[i]) / RAID.dt, dist: Math.abs(x - car.xs[0]) };
}
/**
 * The raid now (PURE): → { on (the event's span), cars: [car + its state] (on the road), power (the speakeasy's 0..1 — snapped dark the
 * instant the first car shows, back after), shades (0..1 — the shades down), win(i) (window i's own level as the lights come back: null =
 * untouched), wash (0..1 — the red + blue on), beam (0..1 the flashlight on), sweep (−1..1 the beam's aim across the windows), club (the
 * club's murmur × — out, creeping back, a party night's swell), phase }
 */
export function raidAt(P, t) {
  if (!P || t < P.t0 - 12 || t > P.tEnd + 30) return null;
  const cars = [];
  for (const c of P.cars) { const s = raidCarAt(c, t); if (s) cars.push({ ...c, xs: undefined, model: 'police', paint: 0, lane: 'near', glow: -1, beacon: true, ...s }); }
  const dark = t >= P.tAppear && t < P.tBack;
  const B = RAID.back, sinceBack = t - P.tBack;
  // the lights coming back: one window, then another (each a short stutter as it catches), the rest of the facade with the last
  const win = i => {
    if (t < P.tBack) return t >= P.tAppear ? 0 : null;
    const s0 = B.stagger[i % B.stagger.length] + (i >= B.stagger.length ? 1.1 * i : 0), u = sinceBack - s0;
    if (u < 0) return 0;
    if (u > 1.6) return null;
    const fl = [[0, 0.7], [0.12, 0.05], [0.3, 0.85], [0.42, 0.2], [0.6, 1]];
    let k = 0; for (const [a, v] of fl) if (u >= a) k = v; return k;
  };
  const power = t < P.tAppear ? 1 : dark ? Math.max(0, 1 - (t - P.tAppear) / 0.12) : clamp01(sinceBack / B.full);
  const shades = t < P.tAppear ? 0 : dark ? Math.min(1, (t - P.tAppear) / 0.18) : 1 - clamp01((sinceBack - 1) / (B.full - 1));
  const wash = cars.length ? 1 : 0;
  const ob = P.officer && P.officer.beam, beam = ob && t >= ob.t0 && t < ob.t1 ? Math.min(1, (t - ob.t0) / 0.35, (ob.t1 - t) / 0.35) : 0;
  const sweep = ob ? Math.sin(((t - ob.t0) / (ob.t1 - ob.t0)) * Math.PI * 2.5) : 0;
  const club = t < P.tAppear ? 1 : dark ? 0.04 : Math.min(P.party ? 1.35 : 1, 0.04 + sinceBack / 12) * (P.party && sinceBack > 12 ? Math.max(1, 1.35 - (sinceBack - 24) / 30) : 1);
  const phase = t < P.tAppear ? 'coming' : P.tStop != null && t >= P.tStop && t < (P.tDepart || P.tStop) ? 'stopped' : dark ? 'dark' : 'back';
  // the front car + its spotlight (0..1) + the sweep's place along its path (u: 0..1 a cycle — screens/harbor/raid.js#spotPath maps it)
  const fc = frontCarAt(P.front, t), fs = P.front && P.front.spot, spot = fs && t >= fs.t0 && t < fs.t1 ? Math.min(1, (t - fs.t0) / 0.4, (fs.t1 - t) / 0.4) : 0;
  const spotT = fs ? Math.max(0, t - fs.t0) : 0;
  return { on: true, key: P.key, cars, power, shades, win, wash: wash || (fc ? 1 : 0), beam, sweep, club, phase, dark, front: fc, spot, spotT };
}
/** the convoy as a hold on the near lane (core/harbor-traffic.js: no car enters the near lane while it's on the road; they wait behind
 *  its last car) — { tE, tX, hold, x(t), len } */
export function raidHold(P) {
  const last = P.cars[P.cars.length - 1];
  return { id: `${P.key}.hold`, tE: P.t0 - 2, tX: P.tEnd, hold: true, len: P.len, x: t => { const s = raidCarAt(last, t); return s ? s.x : -99; }, riders: { off: 0, on: 0 } };
}

// ------------------------------------------------------------------ THE FRONT CAR's SPOTLIGHT TOUR (C2)
/**
 * The owner (8b2 review): "the SPOTLIGHT must land on the WINDOWS (and the door), never the building's corners / blank brick, and sweep
 * FLUIDLY with randomness (lingering on a window, darting to another, a different eased path every raid — no fixed back-and-forth)".
 * The targets (spotTargets) are the facade's own openings in its units (u along the front from x0, v up from the pavement — a
 * half-width + half-height each): the side door, the shop door, the shop window's two halves, the six upper windows. The tour
 * (spotTour, seeded by the raid's key — every phone the same, every raid different) is a list of STOPS: the circle rests on a target
 * (lingering — a slow searching drift inside it — or a quick glance), then moves on: to a NEIGHBOUR (a slow eased sweep) or DARTS across
 * the front. spotOn(tour, T, t) → { u, v } t s into the spotlight. PURE.
 */
export const SPOT = Object.freeze({ linger: [1.4, 2.5], glance: [0.5, 0.95], sweep: [0.8, 1.3], dart: [0.32, 0.48], pLinger: 0.38, pDart: 0.32, drift: 0.32 });
export function spotTargets(s) {
  if (!s || !s.shop || !s.door) return [];
  const T = [], box = (id, u0, u1, v0, v1) => T.push({ id, u: (u0 + u1) / 2, v: (v0 + v1) / 2, hu: (u1 - u0) / 2, hv: (v1 - v0) / 2 });
  box('side', s.door.u0, s.door.u1, 0.12, s.door.h);
  const [w0, w1, v0, v1] = s.shop.win, wm = (w0 + w1) / 2;
  box('shopL', w0, wm, v0, v1); box('shopR', wm, w1, v0, v1);
  box('shopDoor', s.shop.door[0], s.shop.door[1], 0.55, s.shop.door[2]);
  (s.rows || []).forEach((r, j) => (s.windows || []).forEach(([a, b], i) => box(`w${j}${i}`, a, b, r[0], r[1])));
  return T;
}
export function spotTour(key, T, dur = 60) {
  const n = T.length; if (!n) return [];
  const r = rngFrom(hashString(`raid-spot|${key}`)), pick = ([a, b]) => a + (b - a) * r(), out = [];
  // (it opens on a door — the side door most raids: what they're after — then wanders)
  let cur = r() < 0.6 ? 0 : Math.floor(r() * n), prev = -1, t = 0;
  while (t < dur) {
    const lg = r() < SPOT.pLinger, d = lg ? pick(SPOT.linger) : pick(SPOT.glance);
    const cand = T.map((q, j) => ({ j, d: Math.hypot(q.u - T[cur].u, (q.v - T[cur].v) * 1.15) })).filter(o => o.j !== cur && o.j !== prev).sort((a, b) => a.d - b.d);
    const dart = cand.length > 3 && r() < SPOT.pDart;
    const nx = cand.length ? (dart ? cand[2 + Math.floor(r() * (cand.length - 2))] : cand[Math.floor(r() * Math.min(2, cand.length))]) : { j: cur, d: 0 };
    const mv = dart ? Math.max(pick(SPOT.dart), nx.d / 16) : pick(SPOT.sweep) * Math.min(1.4, 0.65 + nx.d / 7);   // (a dart: quick, never a jump — ≤ ~32 units / s at its fastest)
    out.push({ i: cur, t0: t, t1: t + d, t2: t + d + mv, lg, dart, ph: r() < 0.5 ? 1 : -1, to: nx.j });
    t += d + mv; prev = cur; cur = nx.j;
  }
  return out;
}
const smoother = k => k * k * k * (k * (k * 6 - 15) + 10);
export function spotOn(tour, T, t) {
  if (!tour.length) return null;
  let a = 0, b = tour.length - 1;
  while (a < b) { const m = (a + b + 1) >> 1; if (tour[m].t0 <= t) a = m; else b = m - 1; }
  const S = tour[a], P = T[S.i];
  if (t < S.t1) {
    // resting: a searching drift inside the opening (zero at both ends, no jolt — a loop through its corners when it lingers)
    const k = Math.max(0, (t - S.t0) / (S.t1 - S.t0)), A = S.lg ? SPOT.drift : SPOT.drift * 0.35;
    return { u: P.u + S.ph * P.hu * A * Math.sin(2 * Math.PI * k) * Math.sin(Math.PI * k), v: P.v + P.hv * A * 0.8 * (1 - Math.cos(2 * Math.PI * k)) / 2 * (S.lg ? 1 : -1) };
  }
  const Q = T[S.to], k = Math.min(1, (t - S.t1) / (S.t2 - S.t1));
  // moving: a slow eased sweep to a neighbour, or a dart — fast off the mark, settling onto the next (a gentle arc either way)
  const e = S.dart ? 1 - Math.pow(1 - smoother(k), 1.6) : smoother(k), arc = Math.sin(Math.PI * e) * Math.min(0.6, Math.hypot(Q.u - P.u, Q.v - P.v) * 0.08) * S.ph;
  return { u: P.u + (Q.u - P.u) * e, v: P.v + (Q.v - P.v) * e + arc };
}

