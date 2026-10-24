// LIVING CITY — THE NEON COMES ALIVE (docs/title.md). PURE: from the day's moments (sun.js#sunMoments: when the sun's disc goes
// behind the rooftops tonight, when it clears them this morning) and a seed (the date and the place), the state of the main
// sign's four letters and of the city's signs at any instant — so opening the page mid-way, reloading and fast-forwarding all
// show the same thing, and the title only has to schedule the next change (neonNext), never poll.
//
// The day (local): night (all lit) → [dawn twilight: the city signs go off one by one, 30–10 min before sunrise] → the logo
// stays on until the sun's disc clears the left rooftops (clearAt), then falters for 6–9 min and dies letter by letter (the last
// one hangs on alone) → day (glass) → from ~10° elevation (startAt) single silent sputters that slowly grow, letters stick in the
// last few minutes → THE CATCH (catchAt: the disc fully behind the rooftops) all four lock on → the city signs answer one at a
// time over the next 10–15 min → night.
import { rngFrom, shuffle } from '../../core/rng.js';

const MIN = 60000;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, t) => a + (b - a) * t;

/** moments: { rise, catchAt, clearAt, startAt } (ms). signs: how many city signs there are. reduced: fades, no sputters.
 *  scale: the clock's speed (the test-only fast-forward) — each sputter keeps its real length on screen, only the waits shrink. */
export function neonPlan({ moments, seed = 'x', signs = 4, reduced = false, scale = 1 }) {
  if (!moments || moments.catchAt == null || moments.clearAt == null) return null;
  const { rise, catchAt, clearAt } = moments;
  const startAt = Math.min(moments.startAt, catchAt - 25 * MIN);
  const L = [0, 1, 2, 3].map(() => ({ ev: [], mo: [], stick: catchAt, death: 0 }));
  // ---- evening: sputters that grow, then letters that stick
  const R = rngFrom(`${seed}|ev`);
  const span = catchAt - startAt;
  const stickWin = Math.max(2 * MIN, Math.min(5 * MIN, span * 0.1));
  shuffle(R, [0, 1, 2, 3]).forEach((i, rank) => { L[i].stick = catchAt - stickWin * [1, 0.68, 0.42, 0.16][rank] * (0.92 + R() * 0.16); });
  if (!reduced) {
    let t = startAt + R() * 8000;
    while (t < catchAt - 3000) {
      const p = clamp01((t - startAt) / span);
      const gap = lerp(25000, 1600, Math.pow(p, 1.35)) * (0.55 + R() * 0.9);
      let dur = p < 0.08 ? 80 + R() * 70 : lerp(110, 900, p * p) * (0.7 + R() * 0.6);
      if (p > 0.25 && R() < 0.3 * p) dur += 900 + R() * 1100;              // later on, now and then it holds a second or two
      dur *= scale;
      const free = [0, 1, 2, 3].filter(i => t < L[i].stick - 300);
      if (free.length) {
        const n = free.length > 1 && R() < 0.1 + 0.35 * p ? 2 : 1;          // sometimes two letters at once
        for (const i of shuffle(R, free).slice(0, n)) L[i].ev.push([t, Math.min(t + dur, L[i].stick - 200)]);
      }
      // a letter that has stuck still drops out now and then (mostly on, still unsteady)
      for (let i = 0; i < 4; i++) if (t >= L[i].stick + 400 * scale && R() < 0.3) { const a = t + R() * 250 * scale; L[i].ev.push([a, Math.min(a + (100 + R() * 300) * scale, catchAt - 50)]); }
      t += Math.max(gap, dur + 700 * scale);                                 // never more than one flash every 0.7 s
    }
    for (const l of L) l.ev = l.ev.filter(e => e[1] > e[0]).sort((x, y) => x[0] - y[0]);
  }
  // ---- morning: a tired sign giving up
  const M = rngFrom(`${seed}|mo`);
  const D = (6 + M() * 3) * MIN, endAt = clearAt + D;
  shuffle(M, [0, 1, 2, 3]).forEach((i, rank) => { L[i].death = rank === 3 ? endAt : clearAt + D * ([0.42, 0.58, 0.74][rank] + M() * 0.06); });
  if (!reduced) {
    let t = clearAt + M() * 20000;
    while (t < endAt - 2000) {
      const p = clamp01((t - clearAt) / D);
      const alive = [0, 1, 2, 3].filter(i => L[i].death > t + 800);
      if (alive.length) {
        const i = alive[Math.floor(M() * alive.length)];
        const dur = lerp(150, 700, p) * (0.7 + M() * 0.6) * scale;
        L[i].mo.push([t, Math.min(t + dur, L[i].death - 300)]);
        t += Math.max(lerp(18000, 2500, p) * (0.6 + M() * 0.8), dur + 700 * scale);
      } else t += 2000;
    }
    for (const l of L) l.mo = l.mo.filter(e => e[1] > e[0]);
  }
  // ---- the city's signs: off one by one in the dawn twilight; on one at a time after the catch
  const S = rngFrom(`${seed}|signs`);
  const offFrom = rise - 30 * MIN, offTo = rise - 10 * MIN;
  const order = shuffle(S, Array.from({ length: signs }, (_, i) => i));
  const signOn = new Array(signs), signOff = new Array(signs);
  order.forEach((i, k) => {
    signOn[i] = catchAt + (1.5 + (12 * k) / Math.max(1, signs - 1) + (S() - 0.5) * Math.min(1.2, 6 / Math.max(1, signs))) * MIN;   // a few minutes apart
    signOff[i] = offFrom + ((k + 0.5) * (offTo - offFrom)) / signs + (S() - 0.5) * 0.8 * MIN;
  });
  // every moment something changes (for neonNext)
  const marks = [offFrom, offTo, clearAt, endAt, startAt, catchAt, ...signOn, ...signOff];
  for (const l of L) { marks.push(l.stick, l.death); for (const [a, b] of l.ev) marks.push(a, b); for (const [a, b] of l.mo) marks.push(a, b); }
  marks.sort((a, b) => a - b);
  return { reduced, rise, startAt, catchAt, clearAt, endAt, offFrom, offTo, letters: L, signOn, signOff, marks };
}

// is t inside one of these sorted intervals? (binary search)
function inside(list, t) {
  let lo = 0, hi = list.length - 1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (list[m][1] <= t) lo = m + 1; else if (list[m][0] > t) hi = m - 1; else return true; }
  return false;
}

/** The state at t: { stage: 'night'|'goodbye'|'day'|'ramp'|'lit', letters: [4 bools], signs: [bools], fade (0..1, Reduced
 *  effects only: how far the sign has faded in), caught (the letters are lit for good: night / after the catch) }. */
export function neonState(plan, t) {
  if (!plan) return null;
  const { letters: L } = plan;
  const signs = plan.signOn.map((on, i) => t < plan.signOff[i] || t >= on);
  let stage, lit, fade = 1;
  if (t < plan.clearAt) { stage = 'night'; lit = [true, true, true, true]; }
  else if (t < plan.endAt) {
    stage = 'goodbye';
    lit = L.map(l => (t < l.death) !== inside(l.mo, t));
    if (plan.reduced) { fade = 1 - clamp01((t - plan.clearAt) / (plan.endAt - plan.clearAt)); lit = [true, true, true, true]; }
  } else if (t < plan.startAt) { stage = 'day'; lit = [false, false, false, false]; fade = 0; }
  else if (t < plan.catchAt) {
    stage = 'ramp';
    lit = L.map(l => (t >= l.stick) !== inside(l.ev, t));
    if (plan.reduced) { fade = clamp01((t - plan.startAt) / (plan.catchAt - plan.startAt)); lit = [true, true, true, true]; }
  } else { stage = 'lit'; lit = [true, true, true, true]; }
  return { stage, letters: lit, signs, fade, caught: stage === 'night' || stage === 'lit' };
}

/** THE EVENING WARM-UP WINDOW's start: the first letter sticking (the last ~2–5 min before the catch, when the sign is visibly almost
 *  on) — the golden hour's early sputters before it are still "the sign isn't on" (8a, the owner) */
export const warmAt = plan => Math.min(...plan.letters.map(l => l.stick));

/**
 * 8a — THE MUSIC'S FIRST TAP (City 2.0, the owner): what the NEON sign does when the visit's first tap starts the music, from the
 * sign's REAL state (neonState, or the title's lit / day stand-ins) — never a day / night guess:
 *   'catch'  the evening warm-up window (stage 'ramp', from warmAt to the catch): the tap catches it — the sign lights for good
 *   'first'  the sign is lit (night, after the catch, ALWAYS NIGHT): a quick brighter race through the lit tubes
 *   'surge'  any moment the sign is NOT lit — morning goodbye, day, golden hour's early sputters, a polar day: a surge races
 *            N → E → O → N through the glass and fades back to unlit
 *   'soft'   reduced effects / motion (anything but the catch): one gentle brighten
 *   'skip:intro' (the power-on is the answer) · 'skip:busy' (a race / the catch already running)
 * o: { intro, busy, reduced }
 */
export function firstTapAnswer(st, plan, t, o = {}) {
  if (o.intro) return 'skip:intro';
  if (o.busy) return 'skip:busy';
  if (st && st.stage === 'ramp' && plan && t >= warmAt(plan) && t < plan.catchAt) return 'catch';
  if (o.reduced) return 'soft';
  return st && st.caught ? 'first' : 'surge';
}

/** The next moment after t at which anything changes (ms), or t + 1 h. */
export function neonNext(plan, t) {
  if (!plan) return t + 60 * MIN;
  const m = plan.marks;
  let lo = 0, hi = m.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (m[mid] <= t) lo = mid + 1; else hi = mid; }
  return lo < m.length ? m[lo] : t + 60 * MIN;
}
