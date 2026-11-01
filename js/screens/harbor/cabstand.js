// CITY 2.0 — THE HARBOR, PROM: THE CAB STAND's TAXI (the owner, Oct 28: "people walk up + wait there, and a TAXI pulls up on the FRONT
// STREET, they get in, it drives off — another way to leave"). The waiters are planned (core/harbor-cabs.js#standEvents — every phone the
// same); the taxi is THIS DEVICE's: the street under the dock is a stage only while the dock is HIDDEN (9e) — so it comes only when the
// dock has rested a moment and someone has sat at the stand a few seconds; it pulls up on the lane by the promenade's curb (right → left),
// the waiter gets up, walks to the curb by its far rear door + ducks in (hidden by its body), its TAXI lamp goes out, it drives off. A
// scene under way finishes under the dock if the dock comes back (the dock draws on top). The one it took is gone from this device's
// promenade for the rest of their planned visit (people.js#override). The cab itself: THE VEHICLE KIT's checker taxi (motorcar.js).
import { createMotorcar } from './motorcar.js';
import { project } from '../../core/harbor-layout.js';
import { pickupPlan, pickupFareAt } from '../../core/harbor-cabs.js';

/** the scene's numbers (s): the drive in (decelerating), the boarding, the drive out (accelerating); `rest` the dock's rest before it may
 *  start, `sat` how long the waiter has sat, `left` how long their sitting has left at least (so the planned plan never ends mid-scene) */
const CABSTAND = Object.freeze({ inS: 4.2, walkS: 1.7, board: 0.7, wait: 1.1, outS: 4.6, rest: 1.2, sat: 3.5, left: 14, gap: 40 });
const ease = u => (u < 0 ? 0 : u > 1 ? 1 : 1 - (1 - u) * (1 - u));
const easeIn = u => (u < 0 ? 0 : u > 1 ? 1 : u * u);

export function createCabStand() {
  const motor = createMotorcar();
  let run = null, taken = new Set(), lastEnd = -1e9, restSince = null, dbg = { runs: 0, last: null, fareFrames: 0, fareListed: 0, rose: null };
  /** the scene's timeline from t0 (s, performance time) for a waiter w on a layout L */
  // ATM-D — THE CURB SIDE (the owner, Oct 31 4:50 pm: the cab stops on the street with the CURB on the FAR side; the fare boards from the curb,
  // but ATM-C opened the CAMERA-side door + faded him into the car — "I don't care how you fix it": the REAR door, never the driver's, the
  // rider SITS DOWN + the door CLOSES, no obvious fade). The chat's pick, built: the FAR REAR door —
  //   from the bench → to the curb beside the cab's far rear door (behind the car: the cab stand draws him BEFORE the car, so its body
  //   covers everything below his shoulders) → the far rear door swings open (from our side only its TOP EDGE rising above the roofline)
  //   → he steps in toward the car + DUCKS DOWN behind its body as he sits (sinking out of sight — no fade) → the door shuts → it pulls away.
  //   The camera-side doors stay closed. THE PEOPLE RULE: he's only ever hidden by the car's body.
  // (PART 10 Group 0: the timeline + the fare's path are PURE now — core/harbor-cabs.js#pickupPlan / pickupFareAt: he STANDS UP off the
  // seat, steps out clear of the bench + walks round anything in the way to the curb; redrawn over the bench's sharp overlay too)
  const plan = (L, w, t0) => pickupPlan(L, w, t0);
  const fareAt = pickupFareAt;
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
        if (w) { run = plan(L, w, t); dbg.runs++; dbg.last = { vid: w.vid, at: t, sat: { x: +w.x.toFixed(3), z: +w.z.toFixed(3) } }; dbg.rose = null; }
      }
      if (!run) return false;
      const p = run, ppl = o.people;
      if (ppl) {
        if (t < p.tW) ppl.override(p.vid, null);
        else { ppl.override(p.vid, 'hide'); if (t >= p.tSat) { taken.add(p.vid); if (taken.size > 40) taken.delete(taken.values().next().value); } }   // (from his first step the cab stand draws him — behind the car)
      }
      if (t >= p.tEnd) { run = null; lastEnd = t; }
      return !!run;
    },
    /** the taxi on the front street (after the people's near pass — it's nearer than its fare) */
    draw(c, o) {
      if (!run || !o.L) return;
      // (the FAR rear door swings open as he reaches the curb + shuts once he's sat — only its top edge shows above the roof; the
      // camera-side doors stay shut. He's drawn FIRST: the car's body stands in front of him)
      const p = run, t = o.t, cx = carX(p, t), farDoor = t >= p.tOpen && t < p.tGone ? Math.min(1, (t - p.tOpen) / 0.5, (p.tGone - t) / 0.55) : 0;
      const F = fareAt(p, t);
      // (clipped at the car's near wheel line: as he sinks onto the seat nothing of him ever shows UNDER the car — only its body hides him)
      if (F && o.fare) { const gy = project(o.L.cam, cx.x, 0, p.z)[1] - 1; c.save(); c.beginPath(); c.rect(-50, gy - 4000, 4000, 4000); c.clip(); const drew = o.fare(c, p.vid, F, gy); c.restore(); dbg.fareFrames++; if (drew) dbg.fareListed++; if (F.prev === 'sit' && !dbg.rose) dbg.rose = { x: +F.x.toFixed(3), z: +F.z.toFixed(3), from: { ...p.from } }; }   // (the e2e: every frame he's drawn he's listed for the bench's sharp overlay)
      motor.draw(c, { x: cx.x, z: p.z, dir: -1, speed: cx.v, dist: -cx.x }, { cam: o.L.cam, T: o.T, k: o.fade == null ? 1 : o.fade, night: o.night || 0, lampAt: o.lampAt, vehicle: { model: 'taxi', paint: 0, sign: t < p.tGone ? 1 : 0, door: 0, farDoor }, dpr: o.dpr, t, motion: o.motion, wet: o.wet || 0, rails: o.rails, lamps: o.power == null ? 1 : o.power });
    },
    /** a scene is playing (the title's QUICK FADE + the frame rate) */
    busy: () => !!run,
    debug: () => ({ run: run ? { vid: run.vid, tA: +run.tA.toFixed(2), tIn: +run.tIn.toFixed(2), tGone: +run.tGone.toFixed(2), tEnd: +run.tEnd.toFixed(2), fare: (() => { const F = fareAt(run, performance.now() / 1000); return F ? { x: +F.x.toFixed(2), z: +F.z.toFixed(2), y: +F.y.toFixed(2), pose: F.pose } : null; })(), carZ: run.z } : null, taken: [...taken], ...dbg }),
    destroy() { motor.destroy(); run = null; },
  };
}
