// CITY 2.0 — WINDOWS: THE CRATE GUY (the owner, Nov 1 ~9:50 am + 10:06 am — DECIDED; plan.md "OWNER'S NOTES — NOV 1 (late morning)").
// PURE (tests/harbor-crate.test.mjs): every phone the same. His hours + window: THE CITY TIMETABLE's scene.crate row (the bottom right,
// 9:45 pm → midnight, after the juggler's shade); the shared shade-up / walk-in / exit: core/harbor-scenes.js#sceneAt.
//   HIS WORK      THE CARRIES: every ~7–10 min he goes out the side + comes back with a full crate (a two-armed lift, leaning back from the
//                 weight) and STACKS it on the pile in the corner — THE PILE GROWS over the shift: three columns, up to head height (a
//                 different size every glance). Between carries (seeded): he PRIES ONE OPEN with the crowbar (a big arm motion) + holds ONE
//                 BOTTLE up against the bulb, WIPES HIS BROW, stops to LISTEN at the window, LEANS on the pile, a RARE SWIG.
//   THE BULB      one bare bulb on a cord, cold white, swinging a little all the time; every crate set down BUMPS it (it swings more,
//                 settling) — bulbAt(); the shadows sway with it.
//   HIS ENTRANCE  he BACKS IN through the side carrying the first crate (SCENE_TIMING.crate.enter); HIS EXIT: he sits on his pile, a
//                 cigarette's ember glowing on its draws, then comes to the glass + pulls the shade.
import { hashString, rngFrom } from './rng.js';
import { SCENE_TIMING } from './harbor-scenes.js';

/** the room (x: the pane's fraction): the pile's three columns in the left corner (their full heights), the side door at the right edge,
 *  where he stands between jobs; crate: w × h (his heights) */
export const CRATE = Object.freeze({ cols: [0.13, 0.33, 0.53], full: [5, 4, 2], crate: [0.3, 0.19], side: 1.12, home: 0.72, window: 0.6 });
export const PILE_MAX = CRATE.full.reduce((a, b) => a + b, 0);
/** the jobs + their lengths (s): a carry (out the side, the walk back in with the crate, the lift onto the pile); the in-between ones */
export const JOB = Object.freeze({ carry: 30, pry: 9, bottle: 7, wipe: 3.4, listen: 13, lean: [18, 34], swig: 4.5, stand: [4, 9], count: 5 });
const CARRY = Object.freeze({ out: 4.2, gone: [9, 14], back: 5.2, lift: 3.4 });   // (the carry's parts; gone: out of view, fetching it)

/** the slot (column, row) of the n-th crate on the pile (0-based): the back column first, up to its height, then the next */
export function slotOf(n) {
  let k = n;
  for (let c = 0; c < CRATE.cols.length; c++) { if (k < CRATE.full[c]) return { col: c, row: k }; k -= CRATE.full[c]; }
  return { col: CRATE.cols.length - 1, row: CRATE.full[CRATE.cols.length - 1] - 1 };
}

const memo = new Map();
/**
 * HIS PLAN for the evening's work (len s): [{ t0, d, kind, n? (a carry's crate: its place on the pile), gone? (s out of view), at? (the
 * crate the job is at), down? (s into the job: a crate set down — the bulb's bump) }]. The carries spread so the pile is full near the end.
 */
export function cratePlan(key, len, seed = 1924) {
  const mk = `${key}|${len}|${seed}`;
  if (memo.has(mk)) return memo.get(mk);
  const r = rngFrom(hashString(`crate|${seed}|${key}`)), out = [];
  // (the first crate came in with him; the rest arrive over the shift — the last a few minutes before its end)
  const carries = PILE_MAX - 1, every = (len - 240) / carries;
  let t = 0, n = 1, nextCarry = every * (0.55 + 0.3 * r()), swigs = 0;
  const push = j => { out.push(j); t += j.d; };
  while (t < len - 6) {
    if (t >= nextCarry && n < PILE_MAX && t + JOB.carry + 14 < len) {
      const gone = CARRY.gone[0] + r() * (CARRY.gone[1] - CARRY.gone[0]), d = CARRY.out + gone + CARRY.back + CARRY.lift;
      push({ t0: t, d, kind: 'carry', n, gone, down: CARRY.out + gone + CARRY.back + CARRY.lift * 0.62 });
      n++; nextCarry = t + every * (0.8 + 0.4 * r()); continue;
    }
    const u = r();
    let kind = u < 0.2 ? 'pry' : u < 0.34 ? 'wipe' : u < 0.48 ? 'listen' : u < 0.62 ? 'lean' : u < 0.72 ? 'count' : u < 0.76 && swigs < 4 ? 'swig' : 'stand';
    if (kind === 'swig') swigs++;
    if (kind === 'pry') { push({ t0: t, d: JOB.pry, kind, at: Math.max(0, n - 1) }); if (r() < 0.75) push({ t0: t, d: JOB.bottle, kind: 'bottle', at: Math.max(0, n - 1) }); continue; }
    const d = Array.isArray(JOB[kind]) ? JOB[kind][0] + r() * (JOB[kind][1] - JOB[kind][0]) : JOB[kind];
    push({ t0: t, d: Math.min(d, Math.max(2, len - t)), kind });
  }
  memo.set(mk, out); if (memo.size > 6) memo.delete(memo.keys().next().value);
  return out;
}
/** the job at s (s into his work) → { job, i, e } */
export function jobAt(plan, s) {
  let lo = 0, hi = plan.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (plan[m].t0 <= s) lo = m; else hi = m - 1; }
  const job = plan[lo];
  return job ? { job, i: lo, e: Math.max(0, s - job.t0) } : null;
}
/** the crates on the pile at s into his work (the first came in with him; a carry's crate counts once it's set down) */
export function pileAt(plan, s) {
  let n = 1;
  for (const j of plan) { if (j.t0 > s) break; if (j.kind === 'carry' && s >= j.t0 + j.down) n = Math.max(n, j.n + 1); }
  return Math.min(PILE_MAX, n);
}
/** a carry's parts at e → { part: 'out' | 'gone' | 'back' | 'lift', u (0..1 through it) } */
export function carryPart(j, e) {
  if (e < CARRY.out) return { part: 'out', u: e / CARRY.out };
  if (e < CARRY.out + j.gone) return { part: 'gone', u: (e - CARRY.out) / j.gone };
  if (e < CARRY.out + j.gone + CARRY.back) return { part: 'back', u: (e - CARRY.out - j.gone) / CARRY.back };
  return { part: 'lift', u: Math.min(1, (e - CARRY.out - j.gone - CARRY.back) / CARRY.lift) };
}
/**
 * THE BULB at s (s into the scene — from the shade's start): its swing (rad, + = to the right): a slow small drift always (the cord never
 * quite still) + every crate set down a kick (damped, ~2.3 s a swing) → { a, kick (the last bump's strength now 0..1) }. bumps: [s, …]
 */
export function bulbAt(s, bumps = []) {
  let a = 0.035 * Math.sin(s * 2 * Math.PI / 5.3) + 0.018 * Math.sin(s * 2 * Math.PI / 8.9 + 1.3), kick = 0;
  for (const b of bumps) { const d = s - b; if (d < 0 || d > 22) continue; const k = Math.exp(-d / 5.5); a += 0.16 * k * Math.sin(d * 2 * Math.PI / 2.3); kick = Math.max(kick, k); }
  return { a, kick };
}
/** the bumps tonight on the scene's own clock (s from its start): the first crate set down in his entrance + every carry's */
export function crateBumps(plan, T = SCENE_TIMING.crate) {
  const w0 = T.up + T.enter, out = [T.up + ENTER.down];
  for (const j of plan) if (j.kind === 'carry') out.push(w0 + j.t0 + j.down);
  return out;
}
/** his sounds on the evening's clock: a muffled clink of bottles as each crate is set down (crates-clink, quiet) → [{ at, slot, gain }] */
export function crateSceneCues(sc, a0, a1, key, seed = 1924) {
  const T = SCENE_TIMING.crate, len = Math.max(1, sc.end - sc.start - T.up - T.enter - T.exit), out = [];
  for (const b of crateBumps(cratePlan(key, len, seed), T)) { const at = sc.start + b; if (at > a0 && at <= a1) out.push({ at, slot: 'crates-clink', gain: 0.55 }); }
  return out;
}
/** his entrance (s into it, SCENE_TIMING.crate.enter long): backing in from the side with the first crate, set down on the pile's corner */
export const ENTER = Object.freeze({ back: 5.6, down: 7.0, up: 8.2 });
/** his exit (s into it, SCENE_TIMING.crate.exit long): to the pile, sits on it, the cigarette (lit, three draws), up, to the glass, the pull */
export const EXIT = Object.freeze({ toPile: 3, sit: 4.2, light: 6, smoke: [9, 14, 19], up: 21.5, toWindow: 25.5 });
