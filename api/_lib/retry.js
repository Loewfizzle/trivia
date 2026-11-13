// FR7 FIXES C2 — THE ONE DAY LINE's retry rules, PURE (no imports): the unit suite reads them without firebase-admin (the cloud's unit job
// installs no root node_modules — tests/one-day-line.test.mjs couldn't load through stats.js → fb.js). stats.js re-exports them unchanged.
/** THE ONE DAY LINE (FR7 FIXES C — M4): an outcome that must be tried again (the 45 s gap's `too_soon`, a transaction that didn't commit) — the
 *  result is then NOT done: the caller answers 425 + retryAfter and keeps the outcomes so far (a retry skips the credited ones as 'counted') */
export const RETRY_SKIPS = Object.freeze(['too_soon', 'busy']);
export const needsRetry = outcomes => Object.values(outcomes || {}).some(o => o && RETRY_SKIPS.includes(o.skip));
/** the outcomes of this try over the ones kept from an earlier try: a player credited before (now skipped 'counted') keeps the earlier one */
export function mergeOutcomes(prev, now) {
  const out = { ...(prev || {}) };
  for (const [pid, o] of Object.entries(now || {})) if (!(o && o.skip === 'counted' && out[pid] && !out[pid].skip)) out[pid] = o;
  return out;
}
