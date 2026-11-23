// JAYWALK — THE SOUND CUES (H5A — docs/jaywalk.md "THE SOUNDS"): WHEN the world's sounds play — PURE (no audio, no DOM, no clock: the
// The long notes: docs/games/jaywalk-notes.md
import { FP, KID_HALF, TICK_HZ } from './tuning.js';
import { pulseAt, moverLeft } from './course.js';

export const CUE = Object.freeze({
  bellBehind: 2, bellAhead: 6,
  hornEvery: 3 * TICK_HZ,               // (≤ 1 horn every 3 s)
  hornReach: 2600,
  pan: 0.7,
});

/** a run's cue state (the view makes one a run) */
export const createCues = () => ({ bell: false, passK: {}, tellK: {}, hornAt: -1e9, hornN: 0, tick: '' });

/** THE STOPWATCH (BEFORE THE FLIP): the dark's gap behind the kid (lanes) → silent at `far` and beyond (the wall waits 5 lanes back; … */
export const TICK = Object.freeze({ far: 3.5, near: 1, levelFar: 0.18, rateFar: 0.85, rateNear: 1.75 });
export function tickOf(run) {
  const gap = run.y - run.wall / FP;
  if (!(gap < TICK.far)) return { level: 0, rate: TICK.rateFar };
  const k = Math.min(1, Math.max(0, (TICK.far - gap) / (TICK.far - TICK.near)));
  return { level: TICK.levelFar + (1 - TICK.levelFar) * k, rate: TICK.rateFar + (TICK.rateNear - TICK.rateFar) * k };
}

/** the car on a ROAD lane nearest ahead of the kid's box that is driving AT him: → { gap (FP from its nose to his box), side (−1 it … */
export function carClosing(lane, tick, x) {
  let best = null;
  lane.items.forEach((it, j) => {
    const l = moverLeft(lane, it, tick), gap = lane.dir > 0 ? (x - KID_HALF) - (l + it.len) : l - (x + KID_HALF);
    if (gap >= 0 && (!best || gap < best.gap)) best = { gap, side: lane.dir > 0 ? -1 : 1, j };
  });
  return best;
}

/** … */
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
      // (BEFORE THE FLIP — the owner: the same horn moments, ALTERNATING car horn · truck horn for variety — never a horn more)
      out.push({ cue: S.hornN++ % 2 ? 'truck-horn' : 'horn', pan: c.side * CUE.pan });
    }
  }
  // THE STOPWATCH (BEFORE THE FLIP — replaces the lights dying): its level + speed follow the dark's gap; a cue only when they change
  const tk = tickOf(run), lv = Math.round(tk.level * 20) / 20, rt = Math.round(tk.rate * 20) / 20, key = lv > 0 ? `${lv}|${rt}` : '';
  if (key !== S.tick) { S.tick = key; out.push(lv > 0 ? { cue: 'tick', level: lv, rate: rt } : { cue: 'tick-off' }); }
  return out;
}
