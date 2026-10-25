// CITY 2.0 — THE HARBOR, Part 5: the BOATS' ROUTES (PURE, tested). Every boat sails on the CLOCK — its place is a function of
// the real time (ms) alone, so every phone shows the same harbor and a refresh lands it where it was: a cycle of segments
// (move with an easing, hold, turn, away). They live in the water right of the pier (it runs from z 118 to the quay: nothing
// beyond its head can cross it) — Rosie docks at her landing beside the pier's platform, the tug noses up to the pier, the
// sailboats reach back and forth — except the water taxi, out in front of the pier head, which zips across the whole harbor.
// 8b2 Group 3 — THE BOATS IN 3D (screens/harbor/boat3d.js): every state carries a real HEADING `hd` (radians in the world's xz
// plane: 0 = heading right +x, π/2 = away from the camera +z, −π/2 = toward it) + its depth `z` (a turn may swing a boat a few
// units nearer); `face` = cos(hd) is kept for anything that reads it. A boat TURNS by sweeping its heading — the model turns on
// the water; never a squashed picture. ROSIE now comes home BOW-FIRST from the right, swings round in the open water right of
// her berth (her bow toward us), then eases the last half length ASTERN into her landing — bow-out as before, at the same times.
// Which boats sail is decided per CYCLE from the hour at the cycle's start (the tug at night, the sailboats by day) — a boat
// never pops in or out while you watch. docs/harbor.md#the-boats.

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const PI = Math.PI;
const EASE = {
  lin: u => u,
  out: u => 1 - (1 - u) * (1 - u),                    // arriving: at speed, slowing to a stop
  in: u => u * u,                                     // leaving: from a stop, gathering way
  both: u => u * u * (3 - 2 * u),
};
// a cubic Hermite (p0 → p1 with the end tangents m0, m1 in units per segment) — a run that arrives still moving
const herm = (p0, p1, m0, m1, k) => { const k2 = k * k, k3 = k2 * k; return (2 * k3 - 3 * k2 + 1) * p0 + (k3 - 2 * k2 + k) * m0 + (-2 * k3 + 3 * k2) * p1 + (k3 - k2) * m1; };
const hdOf = face => (face >= 0 ? 0 : PI);

/** ROSIE's homecoming (154 s, the same window as before): A — in BOW-FIRST from past the right edge along a lane 6 units in front
 *  of her berth (the breakwater at z 150 stays clear of her stern through the turn), slowing; B — the TURN: her bow swings toward
 *  us (a paddle steamer turns nearly in place: her centre drifts a couple of units, nearer at the middle of the swing), 140° round
 *  to a heading 40° off her berth's line; C — ASTERN the last half length into her landing on a gentle curve, straightening to
 *  bow-out as she stops. Times in s. */
export const ROSIE_ARRIVE = Object.freeze({ A: 58, B: 62, C: 34, lane: 6, dip: 2.4, turnAt: 13, endAt: 11, endZ: 6.5, ctl: 4.6, v0: 0.85, v1: 0.15 });
/** the arrival's plan for a layout (berth x xB at depth zB; x0 = where she comes in from, off the right edge) */
function arrivePlan(xB, zB, x0) {
  const P = ROSIE_ARRIVE, zL = zB - P.lane, zE = zB - P.endZ, xT = xB + P.turnAt, xE = xB + P.endAt, c1 = xB + P.ctl;
  const phi = Math.atan2(zB - zE, xE - c1);              // (her heading at the end of the swing: along the astern curve's start)
  return { x0, xT, xE, zL, zE, xB, zB, c1, phi };
}
/** where she is s seconds into her homecoming (PURE) → { x, z, hd, astern, phase } */
export function arriveAt(a, s) {
  const P = ROSIE_ARRIVE;
  if (s < P.A) { const k = clamp01(s / P.A); return { x: herm(a.x0, a.xT, -P.v0 * P.A, -P.v1 * P.A, k), z: a.zL, hd: PI, astern: false, phase: 'in' }; }
  if (s < P.A + P.B) {
    const k = clamp01((s - P.A) / P.B), e = EASE.both(k);
    return { x: herm(a.xT, a.xE, -P.v1 * P.B, 0, k), z: a.zL + (a.zE - a.zL) * e - P.dip * Math.sin(PI * e), hd: PI + (PI - a.phi) * e, astern: false, phase: 'turn' };
  }
  // C: astern on a quadratic curve (P0 = the swing's end, the control on her berth's line, P2 = the berth), eased from rest to rest
  const k = clamp01((s - P.A - P.B) / P.C), u = EASE.both(k), w = 1 - u;
  const x = w * w * a.xE + 2 * w * u * a.c1 + u * u * a.xB, z = w * w * a.zE + 2 * w * u * a.zB + u * u * a.zB;
  const dx = 2 * w * (a.c1 - a.xE) + 2 * u * (a.xB - a.c1), dz = 2 * w * (a.zB - a.zE);
  return { x, z, hd: Math.atan2(-dz, -dx), astern: true, phase: 'astern' };
}
/** THE FISHING TUG's dawn: it backs out of its mooring (bow toward the pier — behind docked Rosie) into OPEN WATER (`turnX`: clear
 *  of her hull + the lighthouse + the keeper's cottage on screen), swings there to head out — its bow toward us, its centre a few
 *  units nearer through the swing — then steams out. back: the astern run (s), d: the swing (s) */
export const FISH_TURN = Object.freeze({ back: 80, d: 44, dip: 3.6, fwd: 1.6 });

/**
 * The routes for a layout: per boat { id, z, len, h, kind, when ('day'|'night'|null), period (s), offset (s), segs: [{ d (s),
 * type: 'move'|'hold'|'turn'|'away'|'arrive', xa, xb, face, ease }], lane: [xMin, xMax] (world, the boat's centre) }.
 */
export function boatRoutes(L, { taxi = false } = {}) {
  const cam = L.cam, P = L.pier, head = P.head || P;
  // the right edge: just off the screen (the boat's whole length out of sight); the left of the open water right of the pier
  const offR = (z, len) => (cam.W - cam.VPX) * z / cam.F + len / 2 + 2;
  const offL = (z, len) => -cam.VPX * z / cam.F - len / 2 - 2;
  // the pier's right edge at a boat's depth: its walkway — and never left of where the platform's front corner (nearer, drawn
  // under the boats) shows on screen, + 3 pt
  const pierR = z => Math.max(z >= head.z0 - 1 && z <= head.z1 + 1 ? head.x1 : P.x1, (cam.F * head.x1 / head.z0 + 3) * z / cam.F);
  const out = [];
  // (8b1 — THE TIMETABLE: Rosie lies at her landing most of the day now, so the far boats turn + idle CLEAR of her docked hull on
  // screen — never a tack or a wait hidden behind her: `clearOf(z, len)` = the world x at depth z just right of her stern on screen)
  const rb = L.boats.find(b => b.id === 'rosie');
  const rosieRightPt = rb ? cam.VPX + cam.F * (pierR(rb.z) + rb.len / 2 + 1.6 + 1.2 + rb.len / 2) / rb.z : -1e9;
  const clearOf = (z, len) => (rosieRightPt + 6 - cam.VPX) * z / cam.F + len / 2;
  // (C2 — OPEN WATER, the owner: "the far tug + the sailboats never turn behind the lighthouse": a far boat's idle, turn or tack
  // never lands behind the lighthouse + the keeper's cottage on screen either — `openAt(x, z, len)` keeps x when the boat stands
  // clear of them, else moves it just right of the cottage: on a phone the far lane's only open water (Rosie's hull covers it up
  // to the lighthouse); on a wide screen the old spots, left of the lighthouse, are already clear)
  const lh = L.lighthouse, co = L.cottage, scrX = (x, z) => cam.VPX + cam.F * x / z;
  const hidL = lh ? scrX(lh.x - lh.r0, lh.z) - 3 : 1e9, hidR = lh ? (co ? scrX(co.x + co.w + 0.4, co.z + 1) : scrX(lh.x + lh.r0, lh.z)) + 2 : -1e9;
  const openAt = (x, z, len, m = 0) => (scrX(x + len / 2 + m, z) < hidL || scrX(x - len / 2 - m, z) > hidR ? x : (hidR - cam.VPX) * z / cam.F + len / 2 + m);
  for (const b of L.boats) {
    const r = { id: b.id, z: b.z, len: b.len, h: b.h, kind: b.id.startsWith('sail') ? 'sail' : b.id, when: b.when || null, segs: [], period: 0, offset: 0 };
    const R = offR(b.z, b.len), Lf = pierR(b.z) + b.len / 2 + 1.6;   // (≥ 1.6 units of water between the boat and the pier)
    if (b.id === 'fish') {
      // 8b1 — THE FISHING TUG on the day's clock (fishAt): moored just right of the pier overnight, out at dawn, back late afternoon
      r.table = 'fish'; r.kind = 'fish';
      r.lane = [Lf + 0.6, R + 2]; r.segs = [{ d: 1, type: 'hold', xa: Lf + 0.6, face: 1 }];
      r.turnX = Math.max(Lf + 2.6, openAt(clearOf(b.z, b.len), b.z, b.len));   // (C2: its dawn swing out in the open, never behind Rosie)
    } else if (b.id === 'rosie') {
      // ROSIE: home BOW-FIRST from the right, a turn in the open water right of her berth, the last half length astern into her
      // landing (arriveAt); four minutes alongside BOW-OUT (NEON PASS 4: bow-in, her twin stacks + their bulb strings stood in
      // front of THE GAME BLADE's last letters; bow-out they stand clear of every sign: tests/harbor.test.mjs), steams out
      // bow-first; ten minutes a cycle. She reaches her berth at the same moment (154 s into the cycle) and holds at the same spot.
      const out = Lf + 1.2, Rr = R + 3;                 // (Rr: her stern wheel + flagstaff, 2 units past the hull, off too)
      r.arrive = arrivePlan(out, b.z, offR(b.z - ROSIE_ARRIVE.lane, b.len) + 0.8);
      r.offset = 140;
      r.segs = [
        { d: 154, type: 'arrive', xa: r.arrive.x0, xb: out, face: 1 },
        { d: 230, type: 'hold', xa: out, face: 1 },
        { d: 110, type: 'move', xa: out, xb: Rr, face: 1, ease: 'in' },
        { d: 106, type: 'away', xa: Rr, face: 1 },
      ];
      r.lane = [out, Rr];
      r.table = 'rosie';            // (8b1: on the DAY's TIMETABLE — rosieAt — the 10-minute cycle above kept for the tests + a fallback)
    } else if (b.id === 'taxi') {
      // THE WATER TAXI: in front of the pier head — it zips across the whole harbor, one way, then back a minute later
      const A = offL(b.z, b.len), B = R;
      r.offset = 37;
      r.segs = [
        { d: 11, type: 'move', xa: A, xb: B, face: 1, ease: 'lin' },
        { d: 64, type: 'away', xa: B, face: 1 },
        { d: 11, type: 'move', xa: B, xb: A, face: -1, ease: 'lin' },
        { d: 64, type: 'away', xa: A, face: -1 },
      ];
      if (taxi) r.segs = r.segs.map(g => (g.type === 'away' ? { ...g, d: 1.5 } : g));     // (&force=taxi: back and forth, 1.5 s apart — perf + review)
      r.lane = [A, B];
    } else if (b.id === 'tug') {
      // THE TUG (night): noses in toward the pier, idles, swings round (its bow toward us), chugs out
      // (on Rosie's ten minutes, phased so it comes in as she steams out and leaves as she returns: never idling behind her)
      // (NEON PASS 4: a unit nearer the pier — idling, its masthead lights stood against THE GAME BLADE's foot)
      // (C2 — OPEN WATER: where that spot stands behind the lighthouse + the cottage — every phone — it stops just right of the
      // cottage instead, and there it idles BOW-ON (half its swing before, half after): broadside it would run off the screen's edge)
      const near = Math.max(Lf + 5, clearOf(b.z, b.len)), stop = openAt(near, b.z, b.len);
      r.offset = 356;
      r.segs = stop === near ? [
        { d: 140, type: 'move', xa: R, xb: stop, face: -1, ease: 'out' },
        { d: 70, type: 'hold', xa: stop, face: -1 },
        { d: 26, type: 'turn', xa: stop, xb: stop + 0.6, face: -1, to: 1 },
        { d: 140, type: 'move', xa: stop + 0.6, xb: R, face: 1, ease: 'in' },
        { d: 224, type: 'away', xa: R, face: 1 },
      ] : [
        { d: 140, type: 'move', xa: R, xb: stop, face: -1, ease: 'out' },
        { d: 13, type: 'turn', xa: stop, xb: stop + 0.3, face: -1, to: 1, hd0: PI, hd1: 1.5 * PI },
        { d: 70, type: 'hold', xa: stop + 0.3, face: -1, hd: 1.5 * PI },
        { d: 13, type: 'turn', xa: stop + 0.3, xb: stop + 0.6, face: -1, to: 1, hd0: 1.5 * PI, hd1: 2 * PI },
        { d: 140, type: 'move', xa: stop + 0.6, xb: R, face: 1, ease: 'in' },
        { d: 224, type: 'away', xa: R, face: 1 },
      ];
      r.lane = [stop, R];
    } else {
      // THE SAILBOATS (day): a long slow reach toward the pier, a tack (the bow through the wind, toward us), back out past the
      // lighthouse — on Rosie's ten minutes, phased so they reach the pier while her landing is empty (never tacking unseen behind her)
      // (C2 — OPEN WATER: the tack never behind the lighthouse + the cottage — on a phone just right of the cottage)
      const two = b.id === 'sail2', want = Math.max(Lf + (two ? 12 : 4), clearOf(b.z, b.len) + (two ? 4 : 0)), tack = openAt(want, b.z, b.len, 0.6), d1 = 200;     // (0.6: its tack drifts 0.4 back)
      r.offset = two ? 400 : 490;
      // (C2: on a phone the open water right of the cottage is one ~23 pt strip — the second sloop stays out of the harbor there rather
      // than tacking beside / in front of the first; wide screens keep both)
      if (two && Math.abs(tack - want) > 1e-6) r.segs = [{ d: 600, type: 'away', xa: R, face: 1 }];
      else r.segs = [
        { d: d1, type: 'move', xa: R, xb: tack, face: -1, ease: 'both' },
        { d: 18, type: 'turn', xa: tack, xb: tack - 0.4, face: -1, to: 1 },
        { d: d1, type: 'move', xa: tack - 0.4, xb: R, face: 1, ease: 'both' },
        { d: 182, type: 'away', xa: R, face: 1 },
      ];
      r.lane = [tack - 0.4, R];
    }
    r.period = r.segs.reduce((s, g) => s + g.d, 0);
    // RUNS: each stretch of segments in the water between two 'away's is one run (a crossing, a visit) — the thinning skips whole
    // runs, decided while the boat is out of sight (scene: the water lane's quiet; tier 0: every other taxi crossing)
    let run = 0;
    r.segs.forEach((g, i) => { if (g.type === 'away') { if (i && r.segs[i - 1].type !== 'away') run++; g.run = -1; } else g.run = run; });
    r.runs = Math.max(1, r.segs.some(g => g.type === 'away') ? run : 1);
    r.thin = r.id === 'taxi' || r.id === 'tug';                         // (the extra boats: they wait while a big show runs)
    out.push(r);
  }
  return out;
}

// ------------------------------------------------------------------ 8b1 — THE HARBOR'S TIMETABLE (plan.md "THE HARBOR" under the workers)
/** ROSIE's day (local hours): she lies at her landing between runs; out at 10, 2 and 6 (the excursions, back ~1 h 40 later / the
 *  sunset run back by 6:50) and the DINNER CRUISE at 7 pm, lit up, back ~9:40; at the landing overnight. Her horn as she casts off. */
export const ROSIE_TABLE = Object.freeze([{ dep: 10, ret: 11.67, horn: 'day' }, { dep: 14, ret: 15.67, horn: 'day' }, { dep: 18, ret: 18.82, horn: 'day' }, { dep: 19, ret: 21.67, horn: 'dinner' }]);
/** the fishing tug: out at dawn (FISH.out — a fixed early hour, its bow lantern lit while it's dark), back in the late afternoon */
export const FISH = Object.freeze({ out: 6.15, back: 16.5, move: 170 });
const ROSIE_OUT = 110, ROSIE_IN = 154;
const dayStartOf = (ms, off) => { const lt = ms / 1000 + off * 60, d = Math.floor(lt / 86400); return (d * 86400 - off * 60) * 1000; };
const withHd = (st, hd, z) => ({ ...st, hd, z, face: Math.cos(hd) });
/** a timetabled boat at ms (PURE: off = the local minutes from UTC) → the same shape as boatAt; + horn: the departure it is leaving on */
export function tableAt(r, ms, off = 0) {
  const d0 = dayStartOf(ms, off), H = 3600e3, inLane = r.lane[0], outLane = r.lane[1];
  const move = (xa, xb, t0, d, ease, face, extra = {}) => withHd({ x: xa + (xb - xa) * EASE[ease](clamp01((ms - t0) / (d * 1000))), on: true, moving: true, seg: 'move', run: Math.floor(t0 / 1000), ...extra }, hdOf(face), r.z);
  const hold = (x, hd = 0) => withHd({ x, on: true, moving: false, seg: 'hold', run: 0 }, hd, r.z);
  if (r.table === 'rosie') {
    for (const e of ROSIE_TABLE) {
      const dep = d0 + e.dep * H, ret = d0 + e.ret * H;
      if (ms >= dep && ms < dep + ROSIE_OUT * 1000) return move(inLane, outLane, dep, ROSIE_OUT, 'in', 1, { cruise: e.horn });
      if (ms >= dep + ROSIE_OUT * 1000 && ms < ret - ROSIE_IN * 1000) return withHd({ x: outLane, on: false, moving: false, seg: 'away', next: Math.floor(ret / 1000), cruise: e.horn }, PI, r.z);
      if (ms >= ret - ROSIE_IN * 1000 && ms < ret) { const t0 = ret - ROSIE_IN * 1000, a = arriveAt(r.arrive, (ms - t0) / 1000); return withHd({ x: a.x, on: true, moving: true, seg: 'move', run: Math.floor(t0 / 1000), phase: a.phase, cruise: e.horn, ...(a.astern ? { astern: true } : null) }, a.hd, a.z); }
    }
    return hold(inLane);
  }
  // THE FISHING TUG: at dawn it backs out of its mooring (bow toward the pier) into open water, swings there and heads out bow-first
  // to the right; back (bow-first, heading left) in the late afternoon; its bow lantern on while it moves
  const out = d0 + FISH.out * H, back = d0 + FISH.back * H, D = FISH.move, T = FISH_TURN, xT = r.turnX ?? inLane, sw = out + T.back * 1000;
  if (ms >= out && ms < sw) return withHd({ x: inLane + (xT - inLane) * EASE.both(clamp01((ms - out) / (T.back * 1000))), on: true, moving: true, seg: 'move', run: Math.floor(out / 1000), lantern: true, astern: true }, PI, r.z);
  if (ms >= sw && ms < sw + T.d * 1000) {
    const e = EASE.both(clamp01((ms - sw) / (T.d * 1000)));
    return withHd({ x: xT + T.fwd * e, on: true, moving: true, seg: 'turn', run: Math.floor(out / 1000), lantern: true }, PI + PI * e, r.z - T.dip * Math.sin(PI * e));
  }
  if (ms >= sw + T.d * 1000 && ms < out + D * 1000) return move(xT + T.fwd, outLane, sw + T.d * 1000, D - T.back - T.d, 'in', 1, { lantern: true });
  if (ms >= out + D * 1000 && ms < back - D * 1000) return withHd({ x: outLane, on: false, moving: false, seg: 'away', next: Math.floor(back / 1000) }, 0, r.z);
  if (ms >= back - D * 1000 && ms < back) return move(outLane, inLane, back - D * 1000, D, 'out', -1, { lantern: true });
  return { ...hold(inLane, PI), moored: true };
}
/** the timetable's moments between a and b (ms, PURE): [{ t, kind: 'rosie-day' | 'rosie-dinner' }] — the horn as she casts off */
export function hornsBetween(a, b, off = 0) {
  const out = [];
  for (const d0 of new Set([dayStartOf(a, off), dayStartOf(b, off)])) for (const e of ROSIE_TABLE) { const t = d0 + e.dep * 3600e3 + 1500; if (t > a && t <= b) out.push({ t, kind: `rosie-${e.horn}` }); }
  return out;
}

/** the cycle a moment is in: { n (the cycle's number), u (s into it), start (ms) } */
export function cycleOf(r, ms) {
  const s = ms / 1000 + r.offset, n = Math.floor(s / r.period);
  return { n, u: s - n * r.period, start: (n * r.period - r.offset) * 1000 };
}

/**
 * Where a boat is at ms: { x, z (world, its centre), hd (its heading, radians), face (= cos hd), on (in the water this cycle and
 * not away), moving, seg }. nightAt(ms) → bool decides a day / night boat per cycle (at its start).
 * A 'turn' sweeps the heading through its bow toward the camera (face −1 → 1: π → 2π; 1 → −1: 0 → −π).
 */
export function boatAt(r, ms, nightAt = () => true, o = {}) {
  if (r.table && o.off != null) return tableAt(r, ms, o.off);
  const c = cycleOf(r, ms);
  if (r.when) { const night = !!nightAt(c.start); if ((r.when === 'night') !== night) return withHd({ x: r.lane[1], on: false, moving: false, seg: 'off' }, 0, r.z); }
  let u = c.u;
  for (let i = 0; i < r.segs.length; i++) {
    const g = r.segs[i];
    if (u > g.d) { u -= g.d; continue; }
    const k = clamp01(u / g.d), run = g.run >= 0 ? c.n * (r.runs || 1) + g.run : -1;
    if (g.type === 'arrive') { const a = arriveAt(r.arrive, u); return withHd({ x: a.x, on: true, moving: true, seg: 'move', run, phase: a.phase, ...(a.astern ? { astern: true } : null) }, a.hd, a.z); }
    if (g.type === 'move') return withHd({ x: g.xa + (g.xb - g.xa) * EASE[g.ease || 'lin'](k), on: true, moving: true, seg: 'move', run, ...(g.astern ? { astern: true } : null) }, hdOf(g.face), r.z);
    if (g.type === 'hold') return withHd({ x: g.xa, on: true, moving: false, seg: 'hold', run }, g.hd ?? hdOf(g.face), r.z);
    // (a turn sweeps hd0 → hd1 when it names them — the tug's two half swings round its bow-on idle — else a half circle)
    if (g.type === 'turn') { const e = EASE.both(k), h0 = g.hd0 ?? hdOf(g.face); return withHd({ x: g.xa + (g.xb - g.xa) * e, on: true, moving: true, seg: 'turn', run }, g.hd0 != null ? h0 + (g.hd1 - g.hd0) * e : h0 + (g.to > g.face ? PI : -PI) * e, r.z); }
    // (away: the run that comes next — the thinning decides it while the boat is out of sight)
    let next = -1;
    for (let j = i + 1; j < r.segs.length; j++) if (r.segs[j].run >= 0) { next = c.n * (r.runs || 1) + r.segs[j].run; break; }
    if (next < 0) next = (c.n + 1) * (r.runs || 1);
    return withHd({ x: g.xa, on: false, moving: false, seg: 'away', next }, hdOf(g.face), r.z);
  }
  return withHd({ x: r.lane[1], on: false, moving: false, seg: 'away' }, 0, r.z);
}
