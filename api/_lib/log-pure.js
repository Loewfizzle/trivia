// FIXES R1 — /api/log's PURE half (THE REVIEW A3: a unit test never imports a file that reaches api/_lib/fb.js — tests/killed-page.test.mjs
// failed in the cloud's unit job on every run since CITY D). api/log.js re-exports these.
export const REPORT_LIMITS = { ipPerHour: 8, perDay: 120, keep: 40, text: 24_000 };
export const REPORT_KINDS = ['tap', 'hang', 'stall', 'bench', 'lost', 'boot', 'old', 'gone', 'ext', 'reload', 'killed', 'audio', 'leave', 'snd', 'slow'];   // (CITY G: 'snd' = a NON-admin phone's audio leave / cut, COUNTED · 'slow' = a slow / timed-out HOLD'EM dealer call, COUNTED)   // (FIXES R3: 'leave' = AN AUDIO LEAVE — engine.js's leave record: every leave signal + what was sounding)   // (FIXES R2: 'audio' = AN AUDIO CUT — js/audio/engine.js's trace of an effects cut / a leave, the owner's phone only)
//   // (CITY D: 'killed' = A KILLED PAGE — js/errlog.js's marker found at the next load: the screen, the device, the build)   // (CITY A — item 10: 'reload' = a CATCH-UP RELOAD, logged as a row: the build from → to, the screen, the reason)
/** PURE: a report body → { kind, text } to store, or null */
export function cleanReport(r) {
  if (!r || typeof r !== 'object' || typeof r.text !== 'string' || !r.text.trim()) return null;
  return { kind: REPORT_KINDS.includes(r.kind) ? r.kind : 'tap', text: r.text.slice(0, REPORT_LIMITS.text) };
}

