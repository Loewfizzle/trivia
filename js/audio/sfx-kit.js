// THE HOUSEKEEPING + AUDIO PASS (Nov 25) — THE EFFECTS' SHARED KIT (docs/audio.md "THE AUDIO FIXES (Nov 25)"): the small pieces every game's
// sound module needs ONE copy of. LAZY (only a game's sounds import it — never the boot graph); it reads engine.js through exports that module
// has had for a long time (THE STALE-MODULE RULE: a page on an older boot graph still runs this).
//   leadOf / leadIn   an MP3 begins with its encoder's LEAD-IN (15–50 ms of near-silence a WAV never had): a sound is started at its first
//                     audible sample (less a millisecond), so a hop / a drop sounds ON its moment. Measured once a buffer, then remembered.
//   lateGate()        a sound asked while nothing can sound: ONE wait, never one per call — before the first tap for the unlock; with the
//                     context suspended / interrupted for its return (onResume); MUTED / ALL OFF: no wait at all (NOTHING RUNS).
//   decodeOnce()      one decodeAudioData a file a context — a decode in flight is shared, a failed one is forgotten (the next ask retries).
import { isUnlocked, audioUnlocked, audioHushed, onUnlock, onResume } from './engine.js';

export const LEAD_AT = 0.003, LEAD_MAX = 0.08;
/** PURE: an AudioBuffer → the seconds of near-silence at its start to skip (0 = none / an odd buffer) */
export function leadOf(b) {
  try {
    const d = b.getChannelData(0), n = Math.min(d.length, Math.floor(b.sampleRate * LEAD_MAX));
    for (let i = 0; i < n; i++) if (d[i] > LEAD_AT || d[i] < -LEAD_AT) return Math.max(0, i / b.sampleRate - 0.001);
  } catch { /* an odd buffer: from its start */ }
  return 0;
}
const leads = new WeakMap();   // AudioBuffer → its lead-in (a buffer let go takes its entry with it)
/** a buffer's lead-in, measured ONCE (a play reads it: no scan, nothing made) */
export function leadIn(b) {
  if (!b) return 0;
  let v = leads.get(b);
  if (v === undefined) { v = leadOf(b); leads.set(b, v); }
  return v;
}

/** ONE wait for "a sound may start now": when(fn) runs fn at once while the context runs; else keeps ONLY the latest fn and ONE listener —
 *  the first tap (onUnlock) before it, the context's return (onResume) after it; hushed (muted / ALL OFF) = fn is dropped, nothing waits.
 *  `eng` = the engine's five reads (the tests pass their own). */
export function lateGate(eng = { isUnlocked, audioUnlocked, audioHushed, onUnlock, onResume }) {
  let pending = null, waiting = 0, off = null;   // waiting: 0 none · 1 the first tap · 2 the context's return
  const fire = () => {
    waiting = 0;
    if (off) { try { off(); } catch { /* gone */ } off = null; }
    const fn = pending; pending = null;
    if (fn) fn();
  };
  return {
    when(fn) {
      if (eng.isUnlocked()) { fn(); return; }
      if (eng.audioUnlocked() && eng.audioHushed()) return;
      pending = fn;
      if (waiting) return;
      if (!eng.audioUnlocked()) { waiting = 1; off = eng.onUnlock(fire) || null; }
      else { waiting = 2; off = eng.onResume(fire) || null; }
    },
    /** 0 none · 1 waiting for the first tap · 2 waiting for the context's return (the tests) */
    waiting: () => waiting,
    /** a new context / the game left: forget what waited */
    reset() { pending = null; },
  };
}

/** one decode a key a context: decodeOnce(ctx, key, bytesPromise, inFlight, land) → Promise<AudioBuffer | null>. `inFlight` (a Map the
 *  caller keeps, cleared when its context changes) shares a decode that is running — `land(buffer | null, hadBytes)` runs ONCE, for the call
 *  that started it; a failure resolves null and is forgotten (the caller drops its bytes: the next ask fetches + decodes again). The bytes
 *  are decoded from a COPY (a.slice(0)): decodeAudioData detaches its buffer — the kept bytes stay good for the next context. */
export function decodeOnce(ctx, key, bytesP, inFlight, land) {
  let d = inFlight.get(key);
  if (d) return d;
  let had = false;
  d = Promise.resolve(bytesP)
    .then(a => { had = !!a; return a ? new Promise((res, rej) => { const q = ctx.decodeAudioData(a.slice(0), res, rej); if (q && q.catch) q.catch(rej); }) : null; })
    .then(b => b || null, () => null)
    .then(b => { if (inFlight.get(key) === d) inFlight.delete(key); if (land) { try { land(b, had); } catch { /* the caller's */ } } return b; });
  inFlight.set(key, d);
  return d;
}
