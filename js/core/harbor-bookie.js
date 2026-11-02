// CITY 2.0 — WINDOWS: THE BOOKIE (the owner, Nov 1 ~9:50 am — DECIDED: replaces the phone argument; the FIRST ROTATING scene). PURE
// (tests/harbor-bookie.test.mjs): every phone the same. His window + nights rotate: THE CITY TIMETABLE's scene.bookie row (seeded — never
// over a fixed slot, never a party night: core/harbor-scenes.js#scenesTonight); the shared shade-up / walk-in / exit: core#sceneAt.
//   HIS WORK      at his desk taking bets all night: WRITING in the book, COUNTING the take, the candlestick PHONE — picked up, the receiver
//                 at his ear (a nod, a word), hung up; PACING with the phone in his hand + the receiver at his head; a draw on the CIGAR (the
//                 ember flaring, the smoke curling up through the lamp's beam); leaning back. RARELY (~once an hour) A CALL GOES BAD: he
//                 SLAMS the phone, snatches his hat off the hook + THROWS it on the floor, a beat, picks it up, hangs it back, sits — the
//                 highlight, never the loop.
//   HIS ENTRANCE  in through the dark (the shade up on an unlit room), his hat on the hook, he sits, CLICKS THE GREEN LAMP ON — the light coming
//                 on IS his entrance; HIS EXIT: the cash into a bag, his hat on, he pulls the shade (the green lamp left burning behind it).
import { hashString, rngFrom } from './rng.js';

/** his room (x: the pane's fraction): the desk (its middle), the lamp on it, the hat's hook on the left wall, his pacing span */
export const BK = Object.freeze({ desk: 0.5, lamp: 0.34, hook: 0.1, pace: [0.2, 0.78] });
const KINDS = [['write', 0.28], ['count', 0.16], ['call', 0.2], ['pace', 0.13], ['smoke', 0.13], ['lean', 0.1]];
const LEN = { write: [10, 30], count: [8, 18], call: [7, 14], pace: [14, 28], smoke: [5, 7], lean: [10, 22], bad: 15 };
const pickW = (list, u) => { let a = 0; for (const [k, w] of list) { a += w; if (u < a) return k; } return list[list.length - 1][0]; };
const memo = new Map();
/** HIS PLAN for the evening's work (len s): [{ t0, d, kind }] — 'bad' about once an hour, never in the first 10 min or the last 5 */
export function bookiePlan(key, len, seed = 1924) {
  const mk = `${key}|${len}|${seed}`;
  if (memo.has(mk)) return memo.get(mk);
  const r = rngFrom(hashString(`bookie|${seed}|${key}`)), out = [];
  let t = 0, nextBad = 600 + r() * 2800, last = '';
  while (t < len - 4) {
    let kind;
    if (t > nextBad && t < len - 300) { kind = 'bad'; nextBad = t + 2400 + r() * 2400; }
    else { kind = pickW(KINDS, r()); if (kind === last && kind !== 'write') kind = 'write'; }
    const L = LEN[kind], d = Array.isArray(L) ? L[0] + r() * (L[1] - L[0]) : L;
    out.push({ t0: t, d: Math.min(d, Math.max(2, len - t)), kind }); t += out[out.length - 1].d; last = kind;
  }
  memo.set(mk, out); if (memo.size > 6) memo.delete(memo.keys().next().value);
  return out;
}
export function doingAt(plan, s) {
  let lo = 0, hi = plan.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (plan[m].t0 <= s) lo = m; else hi = m - 1; }
  const seg = plan[lo];
  return seg ? { seg, i: lo, e: Math.max(0, s - seg.t0) } : null;
}
/** THE BAD CALL's beats (s into it): the slam, to the hook, the hat thrown (flying, landing), the beat, the pick-up, back on the hook, sit */
export const BAD = Object.freeze({ slam: 1.4, toHook: 3.6, throw: 4.4, land: 5.2, beat: 7.4, pick: 9.6, hang: 12, sit: 15 });
/** his entrance (s into it, SCENE_TIMING.bookie.enter long): in through the dark, the hat on the hook, to the desk, sits, the LAMP ON */
export const ENTER = Object.freeze({ toHook: 4.2, hang: 5.6, toDesk: 9.5, sit: 11, lamp: 12.4 });
/** his exit (s into it, SCENE_TIMING.bookie.exit long): the cash in the bag, up, the hat on, to the glass, the pull */
export const EXIT = Object.freeze({ bag: [0, 5], up: 6.2, toHook: 9.5, hatOn: 11, toWindow: 17.5 });
