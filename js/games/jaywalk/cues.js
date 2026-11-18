// JAYWALK — THE SOUND CUES (H5A — docs/jaywalk.md "THE SOUNDS"): WHEN the world's sounds play — PURE (no audio, no DOM, no clock: the
// view hands it the run after each tick + that tick's events; sfx.js#onCue plays what it returns). The kid's own sounds (hop · land ·
// hit · splash) stay the engine's events (sfx.js#onEvent). Every cue is about THIS phone's own kid — in a match a ghost makes no sound.
//   · bell-on / bell-off — THE TRAIN BELL loops while a rail lane's signals flash NEAR the kid (its tell) and stops as the train passes
//   · train-pass        — the moment a near train's pass begins (panned to the side it comes from)
//   · train-horn        — H5C: ONE blast a train, the moment its WARNING STARTS (a near rail lane's tell begins), from its side
//   (H5B — the owner: the CAR-PASS near-miss whoosh is GONE — no cue, no sound)
//   · horn              — a car closing on the kid standing in its lane, ≤ 1 every 3 s
//   · truck-horn        — BEFORE THE FLIP: ~1 in 4 of those moments when the one closing is a BOX TRUCK (its deeper air horn; the same 3-s limit)
//   · tick / tick-off   — BEFORE THE FLIP (the owner — it REPLACES "lights-die"): THE STOPWATCH — one loop, silent while the dark waits at its
//                         5 lanes behind, fading in + speeding up as THE BLACKOUT / THE FOG BANK closes on him (tickOf: { level, rate })
// The world's own moments are read straight off the course (pulseAt, moverLeft — pure functions of the tick): nothing here is a rule.
import { FP, KID_HALF, TICK_HZ } from './tuning.js';
import { pulseAt, moverLeft } from './course.js';
import { vehicleAt } from './causes.js';

export const CUE = Object.freeze({
  bellBehind: 2, bellAhead: 6,          // (a rail lane this near the kid — on his screen — rings the bell)
  hornEvery: 3 * TICK_HZ,               // (≤ 1 horn every 3 s)
  hornReach: 2600,                      // (… when a car's nose is within 2.6 cells of him and closing — past the near miss's 1 cell)
  truckEvery: 4,                        // (~1 in 4 of the horn's moments with a box truck closing: its own air horn)
  pan: 0.7,
});

/** a run's cue state (the view makes one a run) */
export const createCues = () => ({ bell: false, passK: {}, tellK: {}, hornAt: -1e9, tick: '' });

/** THE STOPWATCH (BEFORE THE FLIP): the dark's gap behind the kid (lanes) → silent at `far` and beyond (the wall waits 5 lanes back;
 *  3.5 = just outside the old lights-dying's 3 — measured: ≈ 8 % of a moving bot's run, heard in half the runs; at 4.5 it was 24 %, every
 *  run), then fading in from `levelFar` + speeding up to its loudest + fastest at `near` */
export const TICK = Object.freeze({ far: 3.5, near: 1, levelFar: 0.18, rateFar: 0.85, rateNear: 1.75 });
export function tickOf(run) {
  const gap = run.y - run.wall / FP;
  if (!(gap < TICK.far)) return { level: 0, rate: TICK.rateFar };
  const k = Math.min(1, Math.max(0, (TICK.far - gap) / (TICK.far - TICK.near)));
  return { level: TICK.levelFar + (1 - TICK.levelFar) * k, rate: TICK.rateFar + (TICK.rateNear - TICK.rateFar) * k };
}

/** the car on a ROAD lane nearest ahead of the kid's box that is driving AT him: → { gap (FP from its nose to his box), side (−1 it
 *  comes from the left | 1 from the right), j (its place in the lane — causes.js#vehicleAt names it) } or null */
export function carClosing(lane, tick, x) {
  let best = null;
  lane.items.forEach((it, j) => {
    const l = moverLeft(lane, it, tick), gap = lane.dir > 0 ? (x - KID_HALF) - (l + it.len) : l - (x + KID_HALF);
    if (gap >= 0 && (!best || gap < best.gap)) best = { gap, side: lane.dir > 0 ? -1 : 1, j };
  });
  return best;
}

/**
 * ONE TICK: the run after its step (alive), the course → the cues to play now: [{ cue, pan? }] (the engine's events are no longer read:
 * the near miss made the car-pass, gone with H5B).
 * S = createCues(). Deterministic: the same run + course give the same cues.
 */
export function cuesAt(S, run, course) {
  const out = [], T = run.t, y = run.y;
  // THE TRAIN: the bell while a near rail lane is in its tell; the pass (once a pass) the tick it begins — the bell stops with it
  let tell = false;
  for (let i = Math.max(0, y - CUE.bellBehind); i <= y + CUE.bellAhead; i++) {
    const L = course.lane(i);
    if (L.type !== 'rail') continue;
    const st = pulseAt(L.pulse, T);
    if (st.st === 'tell') {
      tell = true;
      // THE TRAIN HORN (H5C): one blast a train, when its warning STARTS — a tell he walks into half-way through is not a start
      if (S.tellK[i] !== st.k) { S.tellK[i] = st.k; if (st.left >= L.pulse.tell - 3) out.push({ cue: 'train-horn', pan: -L.pulse.dir * CUE.pan }); }
    } else if (st.st === 'pass' && S.passK[i] !== st.k) { S.passK[i] = st.k; if (st.s <= 2) out.push({ cue: 'train-pass', pan: -L.pulse.dir * CUE.pan }); }
  }
  if (tell !== S.bell) { S.bell = tell; out.push({ cue: tell ? 'bell-on' : 'bell-off' }); }
  const lane = course.lane(y);
  // THE HORN: he stands in a road lane, a car is closing on him
  if (run.st === 'idle' && lane.type === 'road' && T - S.hornAt >= CUE.hornEvery) {
    const c = carClosing(lane, T, run.x);
    if (c && c.gap > FP && c.gap <= CUE.hornReach) {
      S.hornAt = T;
      // (BEFORE THE FLIP — a BOX TRUCK closing: ~1 in 4 of its horn moments are its own deeper air horn — picked by the lane, the truck + the second)
      const truck = vehicleAt(course, y, c.j) === 'truck' && (y * 31 + c.j * 7 + Math.floor(T / TICK_HZ)) % CUE.truckEvery === 0;
      out.push({ cue: truck ? 'truck-horn' : 'horn', pan: c.side * CUE.pan });
    }
  }
  // THE STOPWATCH (BEFORE THE FLIP — replaces the lights dying): its level + speed follow the dark's gap; a cue only when they change
  const tk = tickOf(run), lv = Math.round(tk.level * 20) / 20, rt = Math.round(tk.rate * 20) / 20, key = lv > 0 ? `${lv}|${rt}` : '';
  if (key !== S.tick) { S.tick = key; out.push(lv > 0 ? { cue: 'tick', level: lv, rate: rt } : { cue: 'tick-off' }); }
  return out;
}
