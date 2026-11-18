// CITY G — THE RESULTS COMPACTION, run by THE DAY'S CLOSE (api/daily.js 'today' — once a day per warm function, never waited on; no idle poll,
// no new schedule). The rule + who reads results/: js/core/results-compact.js. One read of results/ (what /admin's STATS snapshot reads every
// 5 min anyway) → ≤ COMPACT_MAX records rewritten in ONE update.
import { ref, val } from './fb.js';
import { streakDay } from '../../js/core/streak.js';
import { toCompact, compactRecord } from '../../js/core/results-compact.js';

const DONE = new Set();
export const forgetResultsSweep = () => DONE.clear();
/** → { n: records compacted, before, after (bytes of those records) } */
export async function compactResults({ now = Date.now() } = {}) {
  const today = streakDay(now);
  if (DONE.has(today)) return { n: 0 };
  DONE.add(today);
  const all = (await val('results')) || {};
  const keys = toCompact(all, now);
  if (!keys.length) return { n: 0 };
  const up = {};
  let before = 0, after = 0;
  for (const k of keys) { const c = compactRecord(all[k]); up[`results/${k}`] = c; before += JSON.stringify(all[k]).length; after += JSON.stringify(c).length; }
  await ref().update(up);
  return { n: keys.length, before, after };
}
