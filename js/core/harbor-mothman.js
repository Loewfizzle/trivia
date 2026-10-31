// CITY 2.0 — THE MODELS PASS: THE MOTHMAN (decisions.md §9; plan.md OCT 30 (midday) — THE MOTHMAN, TWO MODELS + THE GLIDE; OCT 28 —
// the perch). PURE (tests/harbor-mothman.test.mjs): every phone the same, a late page joins him perched. The numbers live in THE CITY
// TIMETABLE (row `legend.mothman`).
//   HIS NIGHTS   rare (~twice a month), the small hours: he GLIDES IN ~2 → 2:30 am, sits on THE NEON NEEDLE's tip until ~5 → 5:30, then
//                leaves. Never on a legendary's night (the UFO, the TR-3B — "never two legendaries a night"), never Halloween (the ghost
//                ship's), never two nights running; EYES IN THE HAZE never shares his night (core/harbor-moments.js#hazeNights, ctx.mothman).
//   THE SWAP     two baked models (the tucked PERCH + the spread-wing GLIDE — no rig, no unfold): the needle's light STUTTERS DARK and
//                in the dark the one becomes the other; when it flickers back he's perched (the arrival) / already in the air (the leaving).
//   THE GLIDE    no flaps (the Point Pleasant witnesses: it glided) — a slight bank, up + away into the night, seen from behind.
import { knob } from './harbor-schedule.js';
import { hashString, rngFrom } from './rng.js';
import { legendNight } from './harbor-legend.js';

const pad = n => String(n).padStart(2, '0');
const keyOf = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
const prevDay = (y, m, d) => { const t = new Date(Date.UTC(y, m - 1, d - 1)); return [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()]; };
const lerp = (a, b, t) => a + (b - a) * t;

function dice(y, m, d) {
  const P = knob('legend.mothman'), r = rngFrom(hashString(`mothman|${keyOf(y, m, d)}`));
  const u = r(), a = r(), l = r();
  if (u >= P.p) return null;
  return { arrive: Math.round(lerp(P.arriveFrom, P.arriveTo, a) * 60) / 60, leave: Math.round(lerp(P.leaveFrom, P.leaveTo, l) * 60) / 60 };
}
/** his night: (y, m, d) = the EVENING's local date → { arrive, leave } (hours on that evening's clock: 26 = 2 am) | null */
export function mothmanNight(y, m, d) {
  if (m === 10 && d === 31) return null;                          // (the ghost ship's night)
  const t = dice(y, m, d);
  if (!t || legendNight(y, m, d)) return null;
  const [py, pm, pd] = prevDay(y, m, d);
  if (dice(py, pm, pd) && !legendNight(py, pm, pd) && !(pm === 10 && pd === 31)) return null;   // (never two nights running)
  return t;
}

/** the needle's STUTTER s seconds into it (0 … stutter): its light 0..1 + whether the swap has happened (the middle of the long dark) */
export function stutterAt(s) {
  const P = knob('legend.mothman'), u = s / P.stutter;
  if (u <= 0 || u >= 1) return { k: 1, swapped: u >= 1 };
  // (a dying tube: a dip, back, a flick off, a weak return, THE LONG DARK (the swap), a stammer back, on)
  const steps = [[0.08, 0.35], [0.16, 1], [0.22, 0.05], [0.3, 0.6], [0.66, 0], [0.73, 0.55], [0.8, 0.08], [1, 1]];
  let k = 1;
  for (const [end, v] of steps) if (u < end) { k = v; break; }
  return { k, swapped: u >= 0.48 };
}

/**
 * where he is at a local moment → null | {
 *   phase   'in' (the glide in) | 'perch' | 'out' (the leaving) | 'gone'
 *   model   'glide' | 'perch' (which sprite is up — the swap happens in the stutter's dark)
 *   u       0..1 along the glide (in: far → the needle; out: the needle → gone)
 *   needle  0..1 the needle's light (the stutters)
 *   s       seconds into the phase · night { arrive, leave }
 * }  lc: the city clock's local { y, m, d, h, mi, s }; o.force: the preview (&force=mothman — perched NOW; o.leaveAt: seconds since the
 * panel's LEAVE NOW, else null)
 */
export function mothmanAt(lc, o = {}) {
  const P = knob('legend.mothman');
  if (o.force) {
    if (o.leaveAt == null) {
      // (the preview: a short glide in from the page's start (o.since s), then perched)
      const s = o.since == null ? 1e9 : o.since;
      return phaseIn(s, P, { arrive: null, leave: null }) || { phase: 'perch', model: 'perch', u: 1, needle: 1, s: s - P.glideIn - P.stutter, night: null };
    }
    return phaseOut(o.leaveAt, P, null);
  }
  if (!lc) return null;
  const hr0 = lc.h + lc.mi / 60 + (lc.s || 0) / 3600;
  // (the evening a small-hours moment belongs to: after noon → today's evening; before → yesterday's, its hour + 24)
  let y = lc.y, m = lc.m, d = lc.d, hr = hr0;
  if (hr0 < 12) { [y, m, d] = prevDay(lc.y, lc.m, lc.d); hr = hr0 + 24; }
  const n = mothmanNight(y, m, d);
  if (!n) return null;
  const s = (hr - n.arrive) * 3600, sl = (hr - n.leave) * 3600;
  if (s < 0) return null;
  if (sl < 0) return phaseIn(s, P, n) || { phase: 'perch', model: 'perch', u: 1, needle: 1, s: s - P.glideIn - P.stutter, night: n };
  // ('gone' for a minute after — the view lets go — then nothing until his next night)
  return sl < P.stutter + P.glideOut + 60 ? phaseOut(sl, P, n) : null;
}
function phaseIn(s, P, n) {
  if (s < P.glideIn) return { phase: 'in', model: 'glide', u: s / P.glideIn, needle: 1, s, night: n };
  if (s < P.glideIn + P.stutter) { const st = stutterAt(s - P.glideIn); return { phase: 'in', model: st.swapped ? 'perch' : 'glide', u: 1, needle: st.k, s, night: n }; }
  return null;
}
function phaseOut(sl, P, n) {
  if (sl < P.stutter) { const st = stutterAt(sl); return { phase: 'out', model: st.swapped ? 'glide' : 'perch', u: 0, needle: st.k, s: sl, night: n }; }
  if (sl < P.stutter + P.glideOut) return { phase: 'out', model: 'glide', u: (sl - P.stutter) / P.glideOut, needle: 1, s: sl, night: n };
  return { phase: 'gone', model: null, u: 1, needle: 1, s: sl, night: n };
}
