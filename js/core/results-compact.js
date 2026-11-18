// CITY G — RESULTS NEVER PRUNED (the Nov 17 2:50 pm inbox entry, item 4): results/{CODE}_{matchId} — the server's record of a counted match — grew
// forever (solo PLAY AGAIN its fastest writer), each player's outcome carrying the WHOLE end-of-round payload (the XP parts, items,
// achievements, ranks, bests, the streak…) that only the podium reads, within hours. PURE (the server + the tests).
// WHO READS results/ (named first): api/report.js + api/_lib/holdem-store.js (a duplicate report / a resend — the 6 h cap REPORT_MAX_AGE_MS,
// a queued report until it answers; a 'retry' record's checked extract `xs` = THE LOST RUN) · api/_lib/share-card.js (a RUN's link card: a
// counted run of today or yesterday) · /admin's STATS history (js/core/insights.js#summarize — every 'done' record: g, at, n, the players' ids)
// · THE BOARD's back-fill (js/core/board-fill.js — counted plays: o.skip / o.n; this week's XP: o.xp.gain; HOLD'EM: o.win, r.ko, r.mode, r.src)
// · the activity counter's one-time fill (done). THE RULE: a 'done' record older than RESULTS_KEEP_DAYS is COMPACTED — every field those
// readers use kept, the podium's payload dropped — never deleted (the history stays whole), never a 'retry' / 'busy' one (a pending report).
// The nightly backup keeps the full records of the days before.
export const RESULTS_KEEP_DAYS = 14;
export const COMPACT_MAX = 300;   // (records a run: bounded work — the rest the next day)
const DAY_MS = 86_400_000;
/** one player's outcome → what the long-term readers use (never empty — an empty object is no node in the database) */
export function compactOutcome(o) {
  if (!o || typeof o !== 'object') return { k: 1 };
  const out = {};
  for (const f of ['gid', 'rank', 'win', 'n', 'skip', 'cap']) if (o[f] != null && o[f] !== false) out[f] = o[f];
  if (o.xp && Number(o.xp.gain)) out.xp = { gain: Number(o.xp.gain) };
  return Object.keys(out).length ? out : { k: 1 };
}
/** a record → its compact form (marked c: 1) */
export function compactRecord(r) {
  const out = { c: 1 };
  for (const f of ['st', 'at', 'g', 'mode', 'n', 'src', 'pre', 'rej', 'ko']) if (r[f] != null) out[f] = r[f];
  out.o = Object.fromEntries(Object.entries(r.o || {}).map(([pid, o]) => [pid, compactOutcome(o)]));
  if (!Object.keys(out.o).length) delete out.o;
  return out;
}
/** the keys to compact now: 'done', older than the keep, not compacted yet — oldest first, ≤ max */
export function toCompact(results, now, { keepDays = RESULTS_KEEP_DAYS, max = COMPACT_MAX } = {}) {
  const cut = now - keepDays * DAY_MS;
  return Object.entries(results || {})
    .filter(([, r]) => r && r.st === 'done' && !r.c && Number(r.at) > 0 && Number(r.at) < cut && r.o && typeof r.o === 'object')
    .sort((a, b) => a[1].at - b[1].at).slice(0, max).map(([k]) => k);
}
