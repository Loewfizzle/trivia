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
import { FOLK } from './harbor-people.js';

const H = 3600;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
/** the numbers: the convoy (cars, the police car's length, the gap between them, cruise + crawl speeds u / s, acceleration + braking,
 *  the sim step), the schedule (the window in local hours, the chances), the officer (s), the lights coming back (s after the last car
 *  is past the crossing), the length of the whole event (cap), the forced preview's period */
export const RAID = Object.freeze({
  cars: 4, len: 4.75, gap: 2.6, v: 4.6, crawl: 2.2, acc: 1.5, brake: 2.4, dt: 0.1,
  window: [21.33, 22.75], after: 0.5, party: 0.12,
  officer: { out: 1.4, sweep: 10.5, back: 1.2, kerb: 0.45 },
  back: { delay: 4.5, stagger: [0, 2.4, 4.4, 5.6, 6.8, 8.2], full: 11 },
  cap: 120, forced: 150,
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
  const party = partyAt(dow, 22);
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
  return { key: `forced-${n}`, t0: since + n * RAID.forced + 6, party, why: 'forced' };
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
  // the speed a rolling car wants at x: cruise in, CRAWL from the speakeasy's corner past the crossing, then away
  const vWant = x => (x < slow0 ? RAID.v : x < past ? RAID.crawl : RAID.v + 0.4);
  const simulate = t0 => {
    const cars = Array.from({ length: N }, (_, i) => ({ i, x: ln.xIn - i * spacing, vel: RAID.v, xs: [], stopper: i === N - 1, held: false, ts: t0 }));
    let tStop = null, tReady = null, tDepart = null, onCross = [];
    const tMax = t0 + RAID.cap;
    for (let t = t0; t < tMax; t += dt) {
      for (const c of cars) {
        let vT = vWant(c.x), room = Infinity;
        if (c.stopper && tDepart == null) { room = stopX - c.x; vT = Math.min(vT, Math.sqrt(2 * RAID.brake * 0.7 * Math.max(0, room - 0.02))); }
        if (c.stopper && tDepart != null && t >= tDepart) vT = RAID.v + 0.4;
        const ahead = cars[c.i - 1];
        if (ahead) { const d = ahead.x - c.x - len; vT = Math.min(vT, Math.sqrt(2 * RAID.brake * 0.7 * Math.max(0, d - 1.4))); }
        let v = vT > c.vel ? Math.min(vT, c.vel + RAID.acc * dt) : Math.max(vT, c.vel - RAID.brake * 1.4 * dt);
        if (c.stopper && tDepart == null && v * dt > room) v = Math.max(0, room / dt);
        c.vel = Math.max(0, v); c.x += c.vel * dt; c.xs.push(c.x);
        if (c.stopper && tStop == null && c.vel < 0.03 && c.x > stopX - 0.3) { tStop = t; tReady = t + RAID.officer.out + 2 * 1.4 + RAID.officer.sweep + RAID.officer.back + 1.4; }
        if (!c.stopper && c.x + len / 2 > crossSpan[0] && c.x - len / 2 < crossSpan[1]) onCross.push(t);
      }
      if (tReady != null && tDepart == null && t >= tReady) {
        // (it pulls away only on the road's green with time to clear the crosswalk — like the trucks)
        const S = signalAt(t * 1000); if (S.road === 'green' && S.left > 4.5) tDepart = t;
      }
      if (cars.every(c => c.x > Math.abs(ln.xOut) + len)) break;
    }
    return { cars, tStop, tReady, tDepart, onCross };
  };
  // the shift: the first t0 (from the raid's own, in 1 s steps over a signal cycle) whose rolling cars only cross on green
  let best = null;
  for (let s = 0; s <= 60; s += 1) {
    const sim = simulate(raid.t0 + s);
    if (sim.onCross.every(t => signalAt(t * 1000).road === 'green')) { best = { sim, t0: raid.t0 + s }; break; }
    if (!best) best = { sim, t0: raid.t0 + s };
  }
  const { sim, t0 } = best, last = sim.cars[N - 1];
  const tAt = (c, x) => { const i = c.xs.findIndex(v => v >= x); return i < 0 ? null : t0 + i * dt; };
  const tAppear = tAt(sim.cars[0], appearX - len / 2) ?? t0 + 3;
  const tPast = tAt(last, cw.x1 + len / 2 + 1.5) ?? (sim.tDepart || t0 + 60) + 3;
  const tEnd = t0 + Math.max(...sim.cars.map(c => c.xs.length)) * dt;
  const tBack = tPast + RAID.back.delay;
  // THE OFFICER: out of the stopped car's kerb side, a few steps to the kerb, the flashlight swept over the speakeasy's dark windows,
  // back in (a people visit: folk.js draws him; raid.js draws the beam from his hand)
  let officer = null;
  if (sim.tStop != null) {
    const O = RAID.officer, x0 = stopX + 0.55, z0 = ln.z - 1.15, kz = FOLK.roadZ + O.kerb, kx = stopX - 0.4;
    const ta = sim.tStop + O.out, tb = ta + 1.4, ts = tb + O.sweep, tc = ts + 1.4;
    const aim = Math.atan2((L.speakeasy ? L.speakeasy.z0 : 44) - kz, sx - 3 - kx);
    officer = {
      id: `raid.${raid.key}.officer`, kind: 'officer', routine: 'raid', idx: 0, look: 'cop', gait: 'walk', t0: ta, t1: tc, tEnd: tc,
      legs: [
        { k: 'walk', pts: [{ x: x0, z: z0 }, { x: kx, z: kz }], t0: ta, t1: tb, v: Math.hypot(kx - x0, kz - z0) / 1.4 },
        { k: 'pose', pose: 'flash', x: kx, z: kz, t0: tb, t1: ts, hd: aim, carry: 'flashlight' },
        { k: 'walk', pts: [{ x: kx, z: kz }, { x: x0, z: z0 }], t0: ts, t1: tc, v: Math.hypot(kx - x0, kz - z0) / 1.4 },
      ],
      members: [{ role: 'lead', dx: 0, dz: 0, lag: 0, seed: 4471 }],
      beam: { t0: tb, t1: ts },
    };
  }
  return {
    key: raid.key, party: !!raid.party, why: raid.why, t0, tAppear, tStop: sim.tStop, tReady: sim.tReady, tDepart: sim.tDepart, tPast, tBack, tEnd: Math.max(tEnd, tBack + RAID.back.full + 2),
    stopX, appearX, z: ln.z, dir: ln.dir, len,
    cars: sim.cars.map(c => ({ id: `raid.${raid.key}.${c.i}`, n: c.i, ts: t0, xs: Float32Array.from(c.xs), len, z: ln.z, dir: ln.dir, stopper: c.stopper })),
    officer,
  };
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
  return { on: true, cars, power, shades, win, wash, beam, sweep, club, phase, dark };
}
/** the convoy as a hold on the near lane (core/harbor-traffic.js: no car enters the near lane while it's on the road; they wait behind
 *  its last car) — { tE, tX, hold, x(t), len } */
export function raidHold(P) {
  const last = P.cars[P.cars.length - 1];
  return { id: `${P.key}.hold`, tE: P.t0 - 2, tX: P.tEnd, hold: true, len: P.len, x: t => { const s = raidCarAt(last, t); return s ? s.x : -99; }, riders: { off: 0, on: 0 } };
}
