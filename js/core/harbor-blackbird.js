// CITY 2.0 — SKY-A: THE BLACKBIRD (plan.md "OCT 28 (PROM's review)" 5:33–5:37 pm + "OCT 30 (morning)"; decisions.md §9). PURE
// (tests/harbor-blackbird.test.mjs). ONE FLYBY for every trigger — the triggers only decide WHEN, the DIRECTION + the HEIGHT:
//   THE FLYBY    the radio-static TELL ~3 s before → it ENTERS at a screen edge, straight + level, much faster than the jets (~1 s
//                across) → just after it enters it BREAKS THE SOUND BARRIER: a VAPOR CONE round its tail half (~0.4 s) + ONE thin SHOCK
//                RING expanding from that point (~0.8 s), the plumes going to full MACH DIAMONDS → the DOUBLE BOOM ("ba-BOOM") ~0.9 s
//                after the cone (the sound arrives late, like the real thing), the city shaking a touch (the glass glints, the roof
//                signs flicker once, a few pigeons lift — never the NEON logo) → its SCREAM (a higher, tearing whine, not the F-22s' roar)
//   THE TRIGGERS (THE CITY TIMETABLE: blackbird.*) — EVERY TR-3B CHASE (once the F-22s are ~⅓ across, the same direction, ACROSS the dark
//                NEON sign while the drain holds it, above it if it's powering back) · its rare SOLO sightings (a seeded ~2 a month +
//                ~5 passes on July 4, above the lit sign) · THE WATCHER's REWARD (60 visible minutes: under 5 min away pauses, longer
//                resets; personal, once a device a day, never announced)
import { knob } from './harbor-schedule.js';
import { hashString, rngFrom } from './rng.js';
import { legendNight, CHASE } from './harbor-legend.js';

// SKY-B — the owner's review (Oct 30 12:32 pm): THE VAPOR CONE in the MIDDLE of the screen ("the sound barrier breaks at centre stage"),
// MUCH more noticeable — bigger + brighter — and it LINGERS: it forms round the craft, stays where it broke through as the craft tears on
// out of it, holds ~0.5 s, then dissipates slowly (~1.4 s); the shock ring with it. A LONGER body (a long, needle-nosed SR-71 that reads
// at phone size). The boom keeps its place after the cone.
export const BB = Object.freeze({
  tell: 3,            // the static's lead (s before it enters)
  cross: 1.0,         // across the screen (its nose from one edge to the other), s — ~1.8× the F-22s: it passes them + is gone first
  cone: 0.6,          // the vapor cone forms (s after it enters) — the craft's middle at the screen's centre …
  coneIn: 0.08,       // … blooms in this fast …
  coneHold: 2.34,     // … holds full this long (the craft tears on out of it) — MODELS: ~2.6 s; ATM-A (the owner, Oct 31: it lingers a little too long) 10 % shorter …
  coneFade: 2.6,      // … then dissipates slowly (MODELS: ~5 s in all)
  ring: 2.52,         // the shock ring's life (it expands + fades with the cone, where it formed — ATM-A: 10 % shorter with the cone's hold)
  boom: 0.9,          // the double boom: s after the cone
  boomGap: 0.22,      // the second hit after the first (0.15–0.3)
  streak: 1.0,        // the speed streak's fade
  len: 0.24,          // its body: a fraction of the screen's width (~96 pt at 402) — clamped 84–110 pt by the drawer
  plume: 1.3,         // the plumes: body lengths at full burn
});
/** the cone's strength s after it formed: a fast bloom, a hold, a slow dissipating fade (0 outside) */
export function coneK(cs) {
  if (cs < 0) return 0;
  if (cs < BB.coneIn) return Math.sin((Math.PI / 2) * (cs / BB.coneIn));
  if (cs < BB.coneIn + BB.coneHold) return 1;
  const f = (cs - BB.coneIn - BB.coneHold) / BB.coneFade;
  return f >= 1 ? 0 : (1 - f) ** 1.6;
}

const sm = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

/**
 * THE FLYBY at s seconds after it entered (s < 0: before — the tell runs from −BB.tell) → { on, u (its nose across the screen: 0 = the
 * entry edge, 1 = the far edge — it keeps going past 1 until its plumes are gone), cone (0..1 the vapor cone), ring { k (0..1 its life),
 * u (where it formed) } | null, burn (0..1: the plumes, full Mach diamonds from the cone), streak (0..1), boom (s since the first hit,
 * or null), done }
 */
export function bbAt(s, wPt = 402, lenPt = 96) {
  const span = 1 + (lenPt * (1 + BB.plume)) / Math.max(1, wPt);           // (until the plumes' end is off the far edge)
  const u = s / BB.cross, coneS = s - BB.cone;
  const cone = coneK(coneS);
  const ring = coneS >= 0 && coneS < BB.ring ? { k: coneS / BB.ring, u: BB.cone / BB.cross } : null;
  const burn = s < 0 ? 0 : 0.55 + 0.45 * sm(BB.cone - 0.05, BB.cone + 0.12, s);
  const boomS = s - BB.cone - BB.boom;
  return { on: s >= 0 && u < span, u, cone, coneS, coneU: BB.cone / BB.cross, ring, burn, streak: s < 0 ? 0 : Math.max(0, 1 - Math.max(0, s - BB.cross * 0.3) / BB.streak), boom: boomS >= 0 ? boomS : null,
    tell: s >= -BB.tell && s < 0, done: u >= span && boomS > 2.5 && coneS > BB.coneIn + BB.coneHold + BB.coneFade };
}
/** the flyby's whole life after it enters (s): its crossing + the plumes off the edge + the boom + the scream's tail */
export const bbLife = (wPt = 402, lenPt = 96) => Math.max(BB.cross * (1 + (lenPt * (1 + BB.plume)) / Math.max(1, wPt)), BB.cone + BB.boom + 2.6, BB.cone + BB.coneIn + BB.coneHold + BB.coneFade + 0.2);

/** THE CHASE's BLACKBIRD: it enters when the F-22s' lead is ~⅓ across (core/harbor-legend.js#chaseX: x = lerp(−0.25, 1.25, u)) — s into
 *  the TR-3B, the same direction as the chase */
export function bbChaseAt() {
  const C = knob('blackbird.chase'), u = (C.jetsAcross + 0.25) / 1.5;
  return CHASE.t0 + CHASE.dur * u;
}

const DAY = 86400;
/** the local calendar day of abs s t at offset off (min) → { day0, y, m, d, key } */
function localDay(t, off) {
  const lt = t + off * 60, day0 = Math.floor(lt / DAY) * DAY - off * 60, dd = new Date(Math.floor(lt / DAY) * DAY * 1000);
  return { day0, y: dd.getUTCFullYear(), m: dd.getUTCMonth() + 1, d: dd.getUTCDate(), key: `${dd.getUTCFullYear()}-${dd.getUTCMonth() + 1}-${dd.getUTCDate()}` };
}
/**
 * THE SOLO SIGHTINGS of a local day → [{ id, t (abs s: it enters), dir (±1) }] — every phone the same. ~`perMonth` a month (a seeded draw
 * per day), at a seeded time between `from` and `to` (local hours); July 4: `july4` passes between its own hours. Never on a legendary
 * night's evening (that night has its own sky).
 */
export function soloDay(t, off = 0, seed = 1924) {
  const P = knob('blackbird.solo'), D = localDay(t, off), r = rngFrom(hashString(`bb|${seed}|${D.key}`)), out = [];
  if (D.m === 7 && D.d === 4) {
    for (let i = 0; i < P.july4; i++) { const h = P.july4From + (P.july4To - P.july4From) * ((i + 0.2 + r() * 0.6) / P.july4); out.push({ id: `bb.${D.key}.j${i}`, t: Math.round(D.day0 + h * 3600), dir: r() < 0.5 ? 1 : -1 }); }
    return out;
  }
  const dim = new Date(Date.UTC(D.y, D.m, 0)).getUTCDate();
  if (r() < P.perMonth / dim && !legendNight(D.y, D.m, D.d)) {
    const h = P.from + r() * (P.to - P.from);
    out.push({ id: `bb.${D.key}.s`, t: Math.round(D.day0 + h * 3600), dir: r() < 0.5 ? 1 : -1 });
  }
  return out;
}
/** the solo flyby that entered within the last `within` s of t (or enters in the next `ahead` s — the tell's lead) → it or null */
export function soloNear(t, off = 0, seed = 1924, within = 6, ahead = BB.tell + 0.5) {
  for (const tt of [t - DAY / 2, t, t + DAY / 2]) for (const f of soloDay(tt, off, seed)) if (f.t > t - within && f.t < t + ahead) return f;
  return null;
}

/**
 * THE WATCHER's REWARD — one device's own clock (localStorage; never announced). state: { day, acc (s watched), last (abs s last
 * counted), got (the day it was given) }; step(state, now, visible, dayKey) → { state, fire } — fire once acc reaches `minutes`: the
 * visible time ACCUMULATES; a gap under `pauseMin` minutes (the tab hidden, the phone locked) only pauses it; a longer one RESETS it;
 * once a day (got === today → no more).
 */
export function watcherStep(st0, now, visible, dayKey) {
  const P = knob('blackbird.watcher'), st = { day: dayKey, acc: 0, last: 0, got: null, ...(st0 || {}) };
  if (st.day !== dayKey) { st.day = dayKey; st.acc = 0; }
  if (!visible) return { state: st, fire: false };
  const gap = st.last ? now - st.last : 0;
  if (gap > P.pauseMin * 60) st.acc = 0;                       // (away too long: start over)
  else if (gap > 0 && gap <= P.step * 3) st.acc += gap;        // (watching: count it; a pause under pauseMin only stops the count)
  st.last = now;
  if (st.got !== dayKey && st.acc >= P.minutes * 60) { st.got = dayKey; st.acc = 0; return { state: st, fire: true }; }
  return { state: st, fire: false };
}
