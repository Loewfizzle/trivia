// CITY G — THE RESULTS COMPACTION, run by THE DAY'S CLOSE (api/daily.js 'today' — once a day per warm function, never waited on; no idle poll,
// no new schedule). The rule + who reads results/: js/core/results-compact.js. One read of results/ (what /admin's STATS snapshot reads every
// 5 min anyway) → ≤ COMPACT_MAX records rewritten in ONE update.
import { ref, val } from './fb.js';
import { claimDay, forgetDue } from './due.js';
import { streakDay } from '../../js/core/streak.js';
import { toCompact, compactRecord } from '../../js/core/results-compact.js';

// (THE FIX PASS — D2: "done today" was a module-level Set — every COLD function re-read the whole results/ node once more. Now the day is
//  CLAIMED in the database (due.js#claimDay — a transaction on rl/zz_results): ONE compaction a day across every function.)
export const forgetResultsSweep = () => forgetDue();
/** → { n: records compacted, before, after (bytes of those records) } */
export async function compactResults({ now = Date.now() } = {}) {
  const today = streakDay(now);
  if (!(await claimDay('results', today, now))) return { n: 0 };
  const all = (await val('results')) || {};
  const keys = toCompact(all, now);
  if (!keys.length) return { n: 0 };
  const up = {};
  let before = 0, after = 0;
  for (const k of keys) { const c = compactRecord(all[k]); up[`results/${k}`] = c; before += JSON.stringify(all[k]).length; after += JSON.stringify(c).length; }
  await ref().update(up);
  return { n: keys.length, before, after };
}
