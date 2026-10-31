// CITY 2.0 — THE HARBOR, PROM: THE CAB STAND's TAXI (the owner, Oct 28: "people walk up + wait there, and a TAXI pulls up on the FRONT
// STREET, they get in, it drives off — another way to leave"). The waiters are planned (core/harbor-cabs.js#standEvents — every phone the
// same); the taxi is THIS DEVICE's: the street under the dock is a stage only while the dock is HIDDEN (9e) — so it comes only when the
// dock has rested a moment and someone has sat at the stand a few seconds; it pulls up on the lane by the promenade's curb (right → left),
// the waiter gets up, walks round behind it to its kerb-side door + in (hidden by its body), its TAXI lamp goes out, it drives off. A
// scene under way finishes under the dock if the dock comes back (the dock draws on top). The one it took is gone from this device's
// promenade for the rest of their planned visit (people.js#override). The cab itself: THE VEHICLE KIT's checker taxi (motorcar.js).
import { createMotorcar } from './motorcar.js';
import { STREET } from '../../core/harbor-promenade.js';
import { project } from '../../core/harbor-layout.js';

/** the scene's numbers (s): the drive in (decelerating), the boarding, the drive out (accelerating); `rest` the dock's rest before it may
 *  start, `sat` how long the waiter has sat, `left` how long their sitting has left at least (so the planned plan never ends mid-scene) */
const CABSTAND = Object.freeze({ inS: 4.2, walkS: 1.7, board: 0.7, wait: 1.1, outS: 4.6, rest: 1.2, sat: 3.5, left: 14, gap: 40 });
const ease = u => (u < 0 ? 0 : u > 1 ? 1 : 1 - (1 - u) * (1 - u));
const easeIn = u => (u < 0 ? 0 : u > 1 ? 1 : u * u);

export function createCabStand() {
  const motor = createMotorcar();
  let run = null, taken = new Set(), lastEnd = -1e9, restSince = null, dbg = { runs: 0, last: null };
  /** the scene's timeline from t0 (s, performance time) for a waiter w on a layout L */
  // ATM-C — RIDERS USE THE DOOR THAT OPENS (the owner, Oct 31: the cab's NEAR door — the side facing us — opened + closed to NO ONE while he
  // walked round behind it and "just walked into the car"): the fare walks round the cab's TAIL to its NEAR door (the one the kit draws
  // open), it opens AS he reaches it, he steps up IN through the doorway (drawn between the cab's inside + the swung door — the kit's
  // `inside`), it shuts after him, then the cab pulls away. The PEOPLE RULE: he's never hidden but by the car's body + its door.
  //   from the bench → behind the tail on the promenade's side (the people's own pass draws him: the car stands in front of him)
  //   → round the tail to its near side → along it to the near door (the cab stand draws him AFTER the car: he's in front of it)
  //   → in through the doorway (drawn inside the door's opening, rising onto the running board, gone into the dark)
  function plan(L, w, t0) {
    const st = L.impliedRoad && L.impliedRoad.street, cam = L.cam, lane = st ? st.lanes[0] : { z: 32.5, dir: -1 }, z = lane.z;
    // (it stops by the waiter, its whole body on screen — the screen's edge clamps it; the rear door a step behind its middle)
    const len = STREET.car && STREET.car.len ? STREET.car.len : 4.4, xStop = Math.min(w.x - 0.1, cam.hw(z) - len / 2 - 0.4), doorX = xStop + 0.55;
    const xIn = cam.hw(z) + len / 2 + 2.5, xOut = -cam.hw(z) - len / 2 - 2.5;
    const xT = xStop + len / 2 + 0.55, pFar = { x: xT, z: z + 1.25 }, pNear = { x: xT, z: z - 1.05 }, pDoor = { x: doorX, z: z - 1.05 };
    const V = 1.45, dA = Math.hypot(pFar.x - w.x, pFar.z - w.z) / V, dB = Math.hypot(pNear.x - pFar.x, pNear.z - pFar.z) / V, dC = Math.abs(pNear.x - pDoor.x) / V;
    const tA = t0 + CABSTAND.inS, tW = tA - 0.9, tT = tW + dA, tN = tT + dB, tIn = tN + dC, tGone = tIn + CABSTAND.board, tGo = tGone + CABSTAND.wait, tEnd = tGo + CABSTAND.outS;
    return { vid: w.vid, z, xIn, xOut, xStop, tA, tW, tT, tN, tIn, tGone, tGo, tEnd, from: { x: w.x, z: w.z }, pFar, pNear, pDoor };
  }
  /** the fare's state at t once the cab stand draws him (round the tail → the near door → in): { s (a people state), at: 'front' | 'door' } | null */
  function fareAt(p, t) {
    const walk = (a, b, u, t0) => ({ x: a.x + (b.x - a.x) * u, z: a.z + (b.z - a.z) * u, pose: 'walk', hd: Math.atan2(b.z - a.z, b.x - a.x), v: 1.4, dist: (t - t0) * 1.45, a: 1, since: t - p.tW });
    if (t < p.tT || t >= p.tGone) return null;
    if (t < p.tN) return { s: walk(p.pFar, p.pNear, (t - p.tT) / (p.tN - p.tT), p.tT), at: 'front' };
    if (t < p.tIn) return { s: walk(p.pNear, p.pDoor, (t - p.tN) / (p.tIn - p.tN), p.tN), at: 'front' };
    // (in through the doorway: a step toward the car's middle, up onto the running board, dimming into the dark inside)
    const u = (t - p.tIn) / CABSTAND.board;
    return { s: { x: p.pDoor.x, z: p.pDoor.z + 1.05 * u, pose: 'walk', hd: Math.PI / 2, v: 1, dist: (t - p.tW) * 1.45, y: 0.28 * Math.min(1, u * 1.6), a: 1 - 0.85 * u * u, since: t - p.tW }, at: 'door' };
  }
  /** the taxi's x + speed at t (world units, u / s) */
  function carX(p, t) {
    if (t < p.tA) { const u = (t - (p.tA - CABSTAND.inS)) / CABSTAND.inS, x = p.xIn + (p.xStop - p.xIn) * ease(u); return { x, v: (p.xIn - p.xStop) * 2 * (1 - Math.min(1, Math.max(0, u))) / CABSTAND.inS }; }
    if (t < p.tGo) return { x: p.xStop, v: 0 };
    const u = (t - p.tGo) / CABSTAND.outS; return { x: p.xStop + (p.xOut - p.xStop) * easeIn(u), v: Math.abs(p.xOut - p.xStop) * 2 * Math.min(1, u) / CABSTAND.outS };
  }
  return {
    /**
     * per frame (before the people are drawn): o = { L, t (s), gone (the dock rests), motion, hold (a legendary / a parade: no traffic),
     * busy (another car on the front street), waiters (people.js#waiters), people (its override) } → whether a scene runs
     */
    tick(o) {
      const { L, t } = o;
      if (!L || !L.cabStand) return false;
      restSince = o.gone ? (restSince == null ? t : restSince) : null;
      if (!run && o.motion && o.gone && !o.hold && !o.busy && restSince != null && t - restSince >= CABSTAND.rest && t - lastEnd > CABSTAND.gap) {
        const w = (o.waiters || []).find(q => q.pose === 'sit' && q.since >= CABSTAND.sat && q.left >= CABSTAND.left && !taken.has(q.vid));
        if (w) { run = plan(L, w, t); dbg.runs++; dbg.last = { vid: w.vid, at: t }; }
      }
      if (!run) return false;
      const p = run, ppl = o.people;
      if (ppl) {
        if (t < p.tW) ppl.override(p.vid, null);
        else if (t < p.tT) {
          // (up off the bench, to just behind the cab's tail on the promenade's side — the car in front of him)
          const u = (t - p.tW) / (p.tT - p.tW), x = p.from.x + (p.pFar.x - p.from.x) * u, z = p.from.z + (p.pFar.z - p.from.z) * u;
          ppl.override(p.vid, { x, z, pose: 'walk', hd: Math.atan2(p.pFar.z - p.from.z, p.pFar.x - p.from.x), dist: u * Math.hypot(p.pFar.x - p.from.x, p.pFar.z - p.from.z), v: 1.4, a: 1, since: t - p.tW, left: p.tGone - t });
        } else { ppl.override(p.vid, 'hide'); if (t >= p.tGone) { taken.add(p.vid); if (taken.size > 40) taken.delete(taken.values().next().value); } }   // (from the tail on, the cab stand draws him)
      }
      if (t >= p.tEnd) { run = null; lastEnd = t; }
      return !!run;
    },
    /** the taxi on the front street (after the people's near pass — it's nearer than its fare) */
    draw(c, o) {
      if (!run || !o.L) return;
      // (the near door swings open as he reaches it — starting a step before — and shuts after him; eased in the kit)
      const p = run, t = o.t, cx = carX(p, t), door = t >= p.tIn - 0.3 && t < p.tGone + 0.4 ? Math.min(1, (t - (p.tIn - 0.3)) / 0.4, (p.tGone + 0.4 - t) / 0.4) : 0;
      const F = fareAt(p, t), draw = (cc, s) => { if (o.fare) o.fare(cc, p.vid, s); };
      motor.draw(c, { x: cx.x, z: p.z, dir: -1, speed: cx.v, dist: -cx.x }, { cam: o.L.cam, T: o.T, k: o.fade == null ? 1 : o.fade, night: o.night || 0, lampAt: o.lampAt, vehicle: { model: 'taxi', paint: 0, sign: t < p.tGone ? 1 : 0, door, inside: F && F.at === 'door' ? (cc, box) => { /* centred in the open doorway */ const sx = project(o.L.cam, F.s.x, 0, F.s.z)[0]; cc.save(); if (box) cc.translate(box.x + box.w * 0.5 - sx, 0); draw(cc, F.s); cc.restore(); } : null }, dpr: o.dpr, t, motion: o.motion, wet: o.wet || 0, rails: o.rails, lamps: o.power == null ? 1 : o.power });
      if (F && F.at === 'front') draw(c, F.s);   // (round the tail + along its near side: in front of the cab)
    },
    /** a scene is playing (the title's QUICK FADE + the frame rate) */
    busy: () => !!run,
    debug: () => ({ run: run ? { vid: run.vid, tA: +run.tA.toFixed(2), tIn: +run.tIn.toFixed(2), tGone: +run.tGone.toFixed(2), tEnd: +run.tEnd.toFixed(2), fare: (() => { const F = fareAt(run, performance.now() / 1000); return F ? { at: F.at, x: +F.s.x.toFixed(2), z: +F.s.z.toFixed(2) } : null; })(), carZ: run.z } : null, taken: [...taken], ...dbg }),
    destroy() { motor.destroy(); run = null; },
  };
}
