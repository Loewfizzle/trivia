// CITY 2.0 — THE HARBOR, PROM: THE CAB STAND's TAXI (the owner, Oct 28: "people walk up + wait there, and a TAXI pulls up on the FRONT
// STREET, they get in, it drives off — another way to leave"). The waiters are planned (core/harbor-cabs.js#standEvents — every phone the
// same); the taxi is THIS DEVICE's: the street under the dock is a stage only while the dock is HIDDEN (9e) — so it comes only when the
// dock has rested a moment and someone has sat at the stand a few seconds; it pulls up on the lane by the promenade's curb (right → left),
// the waiter gets up, walks round behind it to its kerb-side door + in (hidden by its body), its TAXI lamp goes out, it drives off. A
// scene under way finishes under the dock if the dock comes back (the dock draws on top). The one it took is gone from this device's
// promenade for the rest of their planned visit (people.js#override). The cab itself: THE VEHICLE KIT's checker taxi (motorcar.js).
import { createMotorcar } from './motorcar.js';
import { STREET } from '../../core/harbor-promenade.js';

/** the scene's numbers (s): the drive in (decelerating), the boarding, the drive out (accelerating); `rest` the dock's rest before it may
 *  start, `sat` how long the waiter has sat, `left` how long their sitting has left at least (so the planned plan never ends mid-scene) */
const CABSTAND = Object.freeze({ inS: 4.2, walkS: 1.7, board: 0.7, wait: 1.1, outS: 4.6, rest: 1.2, sat: 3.5, left: 14, gap: 40 });
const ease = u => (u < 0 ? 0 : u > 1 ? 1 : 1 - (1 - u) * (1 - u));
const easeIn = u => (u < 0 ? 0 : u > 1 ? 1 : u * u);

export function createCabStand() {
  const motor = createMotorcar();
  let run = null, taken = new Set(), lastEnd = -1e9, restSince = null, dbg = { runs: 0, last: null };
  /** the scene's timeline from t0 (s, performance time) for a waiter w on a layout L */
  function plan(L, w, t0) {
    const st = L.impliedRoad && L.impliedRoad.street, cam = L.cam, lane = st ? st.lanes[0] : { z: 32.5, dir: -1 }, z = lane.z;
    // (it stops by the waiter, its whole body on screen — the screen's edge clamps it; the kerb-side rear door a step behind its middle)
    const len = STREET.car && STREET.car.len ? STREET.car.len : 4.4, xStop = Math.min(w.x - 0.1, cam.hw(z) - len / 2 - 0.4), doorX = xStop + 0.55;
    const xIn = cam.hw(z) + len / 2 + 2.5, xOut = -cam.hw(z) - len / 2 - 2.5;
    const tA = t0 + CABSTAND.inS, tW = tA - 0.9, tIn = tW + CABSTAND.walkS, tGone = tIn + CABSTAND.board, tGo = tGone + CABSTAND.wait, tEnd = tGo + CABSTAND.outS;
    const kerb = { x: doorX, z: z + 2.35 };
    return { vid: w.vid, z, xIn, xOut, xStop, tA, tW, tIn, tGone, tGo, tEnd, from: { x: w.x, z: w.z }, kerb };
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
        else if (t < p.tIn) {
          // (up off the bench, round to the taxi's kerb-side door — walking TOWARD us, a step aside of the car's tail)
          const u = (t - p.tW) / CABSTAND.walkS, x = p.from.x + (p.kerb.x - p.from.x) * u, z = p.from.z + (p.kerb.z - p.from.z) * u;
          ppl.override(p.vid, { x, z, pose: 'walk', hd: Math.atan2(p.kerb.z - p.from.z, p.kerb.x - p.from.x), dist: u * Math.hypot(p.kerb.x - p.from.x, p.kerb.z - p.from.z), v: 1.4, a: 1, since: t - p.tW, left: p.tIn - t });
        } else if (t < p.tGone) ppl.override(p.vid, { x: p.kerb.x, z: p.kerb.z, pose: 'wait', hd: -Math.PI / 2, v: 0, a: Math.max(0, 1 - (t - p.tIn) / CABSTAND.board), since: t - p.tIn, left: p.tGone - t });
        else { ppl.override(p.vid, 'hide'); taken.add(p.vid); if (taken.size > 40) taken.delete(taken.values().next().value); }
      }
      if (t >= p.tEnd) { run = null; lastEnd = t; }
      return !!run;
    },
    /** the taxi on the front street (after the people's near pass — it's nearer than its fare) */
    draw(c, o) {
      if (!run || !o.L) return;
      const p = run, t = o.t, cx = carX(p, t), door = t >= p.tIn - 0.35 && t < p.tGone + 0.35 ? Math.min(1, (t - (p.tIn - 0.35)) / 0.35, (p.tGone + 0.35 - t) / 0.35) : 0;
      motor.draw(c, { x: cx.x, z: p.z, dir: -1, speed: cx.v, dist: -cx.x }, { cam: o.L.cam, T: o.T, k: o.fade == null ? 1 : o.fade, night: o.night || 0, lampAt: o.lampAt, vehicle: { model: 'taxi', paint: 0, sign: t < p.tGone ? 1 : 0, door }, dpr: o.dpr, t, motion: o.motion, wet: o.wet || 0, rails: o.rails, lamps: o.power == null ? 1 : o.power });
    },
    /** a scene is playing (the title's QUICK FADE + the frame rate) */
    busy: () => !!run,
    debug: () => ({ run: run ? { vid: run.vid, tA: +run.tA.toFixed(2), tEnd: +run.tEnd.toFixed(2) } : null, taken: [...taken], ...dbg }),
    destroy() { motor.destroy(); run = null; },
  };
}
