// CITY 2.0 — THE HARBOR, Part 5: the BOATS' ROUTES (PURE, tested). Every boat sails on the CLOCK — its place is a function of
// the real time (ms) alone, so every phone shows the same harbor and a refresh lands it where it was: a cycle of segments
// (move with an easing, hold, turn, away). They live in the water right of the pier (it runs from z 118 to the quay: nothing
// beyond its head can cross it) — Rosie docks at her landing beside the pier's platform, the tug noses up to the pier, the
// sailboats reach back and forth — except the water taxi, out in front of the pier head, which zips across the whole harbor.
// A boat turns by foreshortening (its side view squeezes to its bow and opens the other way: `face` −1 … 1) — the small ones
// only: Rosie never turns in sight (she backs in to her landing, `astern`: moving against her face).
// Which boats sail is decided per CYCLE from the hour at the cycle's start (the tug at night, the sailboats by day) — a boat
// never pops in or out while you watch. docs/harbor.md#the-boats.

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const EASE = {
  lin: u => u,
  out: u => 1 - (1 - u) * (1 - u),                    // arriving: at speed, slowing to a stop
  in: u => u * u,                                     // leaving: from a stop, gathering way
  both: u => u * u * (3 - 2 * u),
};

/**
 * The routes for a layout: per boat { id, z, len, h, kind, when ('day'|'night'|null), period (s), offset (s), segs: [{ d (s),
 * type: 'move'|'hold'|'turn'|'away', xa, xb, face, ease }], lane: [xMin, xMax] (world, the boat's centre) }.
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
  for (const b of L.boats) {
    const r = { id: b.id, z: b.z, len: b.len, h: b.h, kind: b.id.startsWith('sail') ? 'sail' : b.id, when: b.when || null, segs: [], period: 0, offset: 0 };
    const R = offR(b.z, b.len), Lf = pierR(b.z) + b.len / 2 + 1.6;   // (≥ 1.6 units of water between the boat and the pier)
    if (b.id === 'fish') {
      // 8b1 — THE FISHING TUG on the day's clock (fishAt): moored just right of the pier overnight, out at dawn, back late afternoon
      r.table = 'fish'; r.kind = 'fish';
      r.lane = [Lf + 0.6, R + 2]; r.segs = [{ d: 1, type: 'hold', xa: Lf + 0.6, face: 1 }];
    } else if (b.id === 'rosie') {
      // ROSIE: she BACKS IN from the right to her landing beside the platform (astern, slowing to a stop), four minutes alongside
      // BOW-OUT, steams out bow-first; ten minutes a cycle. She NEVER TURNS IN SIGHT (the owner, Oct 24: her flat side view
      // squeezing round on open water looked like a picture flipping — until her 3D model, she keeps facing out the whole cycle:
      // nothing in view hides her — the pier, the platform and the breakwater are drawn UNDER her — so the only blind spot is past
      // the right edge, and a turn there is never needed). She reaches her berth at the same moment (154 s into the cycle) and
      // holds at the same spot. (NEON PASS 4: she rests facing out — bow-in, her twin stacks + their bulb strings stood right in
      // front of THE GAME BLADE's last letters for the whole four minutes; bow-out they stand clear of every sign:
      // tests/harbor.test.mjs)
      const out = Lf + 1.2, Rr = R + 3;                 // (Rr: her stern wheel + flagstaff, 2 units past the hull, off too)
      r.offset = 140;
      r.segs = [
        { d: 154, type: 'move', xa: Rr, xb: out, face: 1, ease: 'out', astern: true },
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
      // THE TUG (night): noses in toward the pier, idles, swings round, chugs out
      // (on Rosie's ten minutes, phased so it comes in as she steams out and leaves as she returns: never idling behind her)
      // (NEON PASS 4: a unit nearer the pier — idling, its masthead lights stood against THE GAME BLADE's foot)
      const stop = Math.max(Lf + 5, clearOf(b.z, b.len));
      r.offset = 356;
      r.segs = [
        { d: 140, type: 'move', xa: R, xb: stop, face: -1, ease: 'out' },
        { d: 70, type: 'hold', xa: stop, face: -1 },
        { d: 26, type: 'turn', xa: stop, xb: stop + 0.6, face: -1, to: 1 },
        { d: 140, type: 'move', xa: stop + 0.6, xb: R, face: 1, ease: 'in' },
        { d: 224, type: 'away', xa: R, face: 1 },
      ];
      r.lane = [stop, R];
    } else {
      // THE SAILBOATS (day): a long slow reach toward the pier, a tack, back out past the lighthouse — on Rosie's ten minutes,
      // phased so they reach the pier while her landing is empty (never tacking unseen behind her)
      const two = b.id === 'sail2', tack = Math.max(Lf + (two ? 12 : 4), clearOf(b.z, b.len) + (two ? 4 : 0)), d1 = 200;
      r.offset = two ? 400 : 490;
      r.segs = [
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
/** a timetabled boat at ms (PURE: off = the local minutes from UTC) → the same shape as boatAt; + horn: the departure it is leaving on */
export function tableAt(r, ms, off = 0) {
  const d0 = dayStartOf(ms, off), H = 3600e3, inLane = r.lane[0], outLane = r.lane[1];
  const move = (xa, xb, t0, d, ease, face, extra = {}) => ({ x: xa + (xb - xa) * EASE[ease](clamp01((ms - t0) / (d * 1000))), face, on: true, moving: true, seg: 'move', run: Math.floor(t0 / 1000), ...extra });
  const hold = x => ({ x, face: 1, on: true, moving: false, seg: 'hold', run: 0 });
  if (r.table === 'rosie') {
    for (const e of ROSIE_TABLE) {
      const dep = d0 + e.dep * H, ret = d0 + e.ret * H;
      if (ms >= dep && ms < dep + ROSIE_OUT * 1000) return move(inLane, outLane, dep, ROSIE_OUT, 'in', 1, { cruise: e.horn });
      if (ms >= dep + ROSIE_OUT * 1000 && ms < ret - ROSIE_IN * 1000) return { x: outLane, face: 1, on: false, moving: false, seg: 'away', next: Math.floor(ret / 1000), cruise: e.horn };
      if (ms >= ret - ROSIE_IN * 1000 && ms < ret) return move(outLane, inLane, ret - ROSIE_IN * 1000, ROSIE_IN, 'out', 1, { astern: true, cruise: e.horn });
    }
    return hold(inLane);
  }
  // THE FISHING TUG: out bow-first to the right at dawn, back (turned, bow-first) in the late afternoon; its bow lantern on while it moves
  const out = d0 + FISH.out * H, back = d0 + FISH.back * H, D = FISH.move;
  if (ms >= out && ms < out + D * 1000) return move(inLane, outLane, out, D, 'in', 1, { lantern: true });
  if (ms >= out + D * 1000 && ms < back - D * 1000) return { x: outLane, face: 1, on: false, moving: false, seg: 'away', next: Math.floor(back / 1000) };
  if (ms >= back - D * 1000 && ms < back) return move(outLane, inLane, back - D * 1000, D, 'out', -1, { lantern: true });
  return { ...hold(inLane), face: -1, moored: true };
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
 * Where a boat is at ms: { x (world, its centre), face (−1 facing left … 1 facing right; |face| < 1 while turning), on (in the
 * water this cycle and not away), moving, seg }. nightAt(ms) → bool decides a day / night boat per cycle (at its start).
 */
export function boatAt(r, ms, nightAt = () => true, o = {}) {
  if (r.table && o.off != null) return tableAt(r, ms, o.off);
  const c = cycleOf(r, ms);
  if (r.when) { const night = !!nightAt(c.start); if ((r.when === 'night') !== night) return { x: r.lane[1], face: 1, on: false, moving: false, seg: 'off' }; }
  let u = c.u;
  for (let i = 0; i < r.segs.length; i++) {
    const g = r.segs[i];
    if (u > g.d) { u -= g.d; continue; }
    const k = clamp01(u / g.d), run = g.run >= 0 ? c.n * (r.runs || 1) + g.run : -1;
    if (g.type === 'move') return { x: g.xa + (g.xb - g.xa) * EASE[g.ease || 'lin'](k), face: g.face, on: true, moving: true, seg: 'move', run, ...(g.astern ? { astern: true } : null) };
    if (g.type === 'hold') return { x: g.xa, face: g.face, on: true, moving: false, seg: 'hold', run };
    if (g.type === 'turn') { const e = EASE.both(k); return { x: g.xa + (g.xb - g.xa) * e, face: g.face + (g.to - g.face) * e, on: true, moving: true, seg: 'turn', run }; }
    // (away: the run that comes next — the thinning decides it while the boat is out of sight)
    let next = -1;
    for (let j = i + 1; j < r.segs.length; j++) if (r.segs[j].run >= 0) { next = c.n * (r.runs || 1) + r.segs[j].run; break; }
    if (next < 0) next = (c.n + 1) * (r.runs || 1);
    return { x: g.xa, face: g.face, on: false, moving: false, seg: 'away', next };
  }
  return { x: r.lane[1], face: 1, on: false, moving: false, seg: 'away' };
}

