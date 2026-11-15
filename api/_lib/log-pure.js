// FIXES R1 — /api/log's PURE half (THE REVIEW A3: a unit test never imports a file that reaches api/_lib/fb.js — tests/killed-page.test.mjs
// failed in the cloud's unit job on every run since CITY D). api/log.js re-exports these.
export const REPORT_LIMITS = { ipPerHour: 8, perDay: 120, keep: 40, text: 24_000 };
export const REPORT_KINDS = ['tap', 'hang', 'stall', 'bench', 'lost', 'boot', 'old', 'gone', 'ext', 'reload', 'killed'];   // (CITY D: 'killed' = A KILLED PAGE — js/errlog.js's marker found at the next load: the screen, the device, the build)   // (CITY A — item 10: 'reload' = a CATCH-UP RELOAD, logged as a row: the build from → to, the screen, the reason)
/** PURE: a report body → { kind, text } to store, or null */
export function cleanReport(r) {
  if (!r || typeof r !== 'object' || typeof r.text !== 'string' || !r.text.trim()) return null;
  return { kind: REPORT_KINDS.includes(r.kind) ? r.kind : 'tap', text: r.text.slice(0, REPORT_LIMITS.text) };
}

