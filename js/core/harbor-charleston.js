// CITY 2.0 — WINDOWS: THE CHARLESTON REHEARSAL (the owner, Nov 1 ~9:50 + 10:54 am — DECIDED; plan.md "OWNER'S NOTES — NOV 1 (late
// morning)"). PURE (tests/harbor-charleston.test.mjs): every phone the same. Her hours + window: THE CITY TIMETABLE's scene.charleston row
// (the bottom middle, 7 → 10 pm); the shared shade-up / walk-in / exit: core/harbor-scenes.js#sceneAt.
//   HER WORK      A REHEARSAL, seeded by the evening: THE BASIC (the twist — knees + heels in, out — a kick front, a kick back, the arms
//                 swinging against the legs), BIG KICKS, CROSSING KNEES (the hands swapping on them), SWINGING ARMS travelling side to side,
//                 a BREATHER (hands on her hips, fanning herself), FIXING HER ANKLE STRAP, A COMBINATION tried (she misses a beat, stops,
//                 laughs it off) + tried again + NAILED (a "ta-da"), now + then THE LAUGHING COLLAPSE into the chair. Counts on a ~200-bpm
//                 phonograph beat.
//   HER ENTRANCE  she walks in, sets the needle on the phonograph, kicks off her heels, starts; HER EXIT the collapse into the chair, she fans
//                 herself, then pulls the shade.
import { hashString, rngFrom } from './rng.js';

/** her room (x: the pane's fraction): the rosy fringed lamp (left), the chair (left), the phonograph (right), where she dances */
export const CHA = Object.freeze({ lamp: 0.13, chair: 0.17, phono: 0.84, spot: 0.5, beat: 0.3 });
const STEPS = [['basic', 0.3], ['kicks', 0.16], ['knees', 0.15], ['swing', 0.17], ['breather', 0.08], ['fix', 0.05], ['combo', 0.09]];
const pickW = (list, u) => { let a = 0; for (const [k, w] of list) { a += w; if (u < a) return k; } return list[list.length - 1][0]; };
const memo = new Map();
/** HER PLAN for the evening's work (len s): [{ t0, d, kind, try?: 'miss' | 'nail' }] — runs of whole 8-counts; the chair ~every 25–40 min */
export function charlestonPlan(key, len, seed = 1924) {
  const mk = `${key}|${len}|${seed}`;
  if (memo.has(mk)) return memo.get(mk);
  const r = rngFrom(hashString(`charleston|${seed}|${key}`)), out = [], B8 = 8 * CHA.beat;
  let t = 0, nextChair = 1400 + r() * 900, last = '';
  const push = s => { out.push(s); t += s.d; last = s.kind; };
  while (t < len - 5) {
    if (t > nextChair && t < len - 240) { push({ t0: t, d: 16 + r() * 8, kind: 'chair' }); nextChair = t + 1500 + r() * 900; continue; }
    let kind = pickW(STEPS, r()); if (kind === last && kind !== 'basic') kind = 'basic';
    if (kind === 'breather') { push({ t0: t, d: 6 + r() * 7, kind }); continue; }
    if (kind === 'fix') { push({ t0: t, d: 5 + r() * 2, kind }); continue; }
    if (kind === 'combo') {
      // (tried: half-way through she misses, stops, laughs it off — then again, nailed, a ta-da)
      push({ t0: t, d: B8 * 2 + 2.6, kind: 'combo', try: 'miss' }); push({ t0: t, d: 2.2, kind: 'breather' });
      push({ t0: t, d: B8 * 3 + 2.4, kind: 'combo', try: 'nail' }); continue;
    }
    push({ t0: t, d: B8 * (2 + Math.floor(r() * 4)), kind });
  }
  if (out.length) { const l = out[out.length - 1]; if (l.t0 + l.d > len) l.d = Math.max(1, len - l.t0); }
  memo.set(mk, out); if (memo.size > 6) memo.delete(memo.keys().next().value);
  return out;
}
export function stepAt(plan, s) {
  let lo = 0, hi = plan.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (plan[m].t0 <= s) lo = m; else hi = m - 1; }
  const seg = plan[lo];
  return seg ? { seg, i: lo, e: Math.max(0, s - seg.t0) } : null;
}
const sm = u => { const v = u < 0 ? 0 : u > 1 ? 1 : u; return v * v * (3 - 2 * v); };
/** a count's bounce: up on the off-beat (0..1, smooth) */
const pulse = p => 0.5 - 0.5 * Math.cos(2 * Math.PI * p);
/**
 * HER MOVES at e (s into a dance segment) → { twist (−1..1 knees + heels in / out), kick: [L, R] (0..1 a kick in front: the foot up),
 * back: [L, R] (0..1 a kick behind), knees (0..1 crossing knees: the knees bent + together), cross (−1..1 which hand on which knee),
 * arms: [L, R] (−1 back … +1 forward-up: the swing), dx (her travel across the room, × her height), bob, open (0..1 the arms flung wide),
 * stop (0..1 a miss: everything stops, a hand to her head), tada (0..1 the arms up, the finish) }
 */
export function movesAt(seg, e) {
  const b = CHA.beat, cnt = e / b, c8 = cnt % 8, k = Math.floor(c8), p = c8 - k, o = { twist: 0, kick: [0, 0], back: [0, 0], knees: 0, cross: 0, arms: [0, 0], dx: 0, bob: 0, open: 0, stop: 0, tada: 0 };
  const swing = Math.sin(Math.PI * cnt);
  o.twist = Math.sin(Math.PI * cnt) * 0.9; o.bob = 0.012 * pulse(p);
  const kind = seg.kind === 'combo' ? ['basic', 'kicks', 'knees'][Math.floor(cnt / 8) % 3] : seg.kind;
  if (kind === 'basic' || kind === 'swing') {
    // (the basic: step, kick front (count 2), step back, kick back (count 4); the other leg the next four — the arms swing against them)
    const leg = k < 4 ? 0 : 1, q = k % 4;
    if (q === 1) o.kick[leg] = Math.sin(Math.PI * p) * 0.75; if (q === 3) o.back[leg] = Math.sin(Math.PI * p) * 0.8;
    o.arms = [swing, -swing];
    if (kind === 'swing') { o.open = 0.6 + 0.4 * Math.abs(swing); o.dx = 0.2 * Math.sin(Math.PI * cnt / 8); }
  } else if (kind === 'kicks') {
    const leg = Math.floor(cnt / 2) % 2, ph = (cnt % 2) / 2;
    o.kick[leg] = Math.sin(Math.PI * ph) * 1.0; o.arms = leg ? [0.9 * Math.sin(Math.PI * ph), -0.5] : [-0.5, 0.9 * Math.sin(Math.PI * ph)]; o.twist *= 0.4;
  } else if (kind === 'knees') {
    o.knees = 0.85; o.cross = Math.sin(Math.PI * cnt); o.twist = 0; o.arms = [-0.7, -0.7];
  }
  if (seg.kind === 'combo' && seg.try === 'miss') { const at = 8 * b * 1.4; if (e > at) { o.stop = sm((e - at) / 0.4); for (const key2 of ['twist', 'knees', 'cross', 'dx', 'open']) o[key2] *= 1 - o.stop; o.kick = o.kick.map(v => v * (1 - o.stop)); o.back = o.back.map(v => v * (1 - o.stop)); } }
  if (seg.kind === 'combo' && seg.try === 'nail') { const at = seg.d - 2.4; if (e > at) { o.tada = sm((e - at) / 0.35) * (1 - sm((e - seg.d + 0.5) / 0.5)); o.kick = [0, 0]; o.back = [0, 0]; o.knees = 0; o.twist = 0; } }
  return o;
}
/** her entrance (s into it, SCENE_TIMING.charleston.enter long): in from the side, to the phonograph, the needle down, the heels kicked off */
export const ENTER = Object.freeze({ walk: 4.2, needle: [4.6, 7.2], heels: [8.4, 10.8], toSpot: 13.5 });
/** her exit (s into it, SCENE_TIMING.charleston.exit long): the laughing collapse into the chair, fanning herself, up, to the glass, the pull */
export const EXIT = Object.freeze({ toChair: 3.2, flop: 4.2, laugh: [4.2, 9], fan: [9, 16], up: 17.5, toWindow: 21.5 });
