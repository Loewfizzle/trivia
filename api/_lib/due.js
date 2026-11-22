// THE FIX PASS — ONE "at most once per window" claim for the server's housekeeping (the prune.js pattern: a transaction on a small marker
// under rl/, so two warm functions — or two cold ones — never both run a job; a module-level memo alone ran it once PER COLD FUNCTION: D2).
// A warm function also skips the transaction itself for `memoMs` after its own claim / refusal (no extra round trip on every call).
import { ref } from './fb.js';

const seen = new Map();
export const forgetDue = () => seen.clear();
/** → true when THIS call won the window (run the job now), false when it is not due / another function has it */
export async function claimDue(key, everyMs, now = Date.now(), { memoMs = 5 * 60_000 } = {}) {
  const last = seen.get(key);
  if (last != null && now - last < Math.min(memoMs, everyMs)) return false;
  seen.set(key, now);
  const t = await ref(`rl/zz_${key}`).transaction(cur => (cur && cur.t > now - everyMs ? undefined : { n: 0, t: now }));
  return !!t.committed;
}
/** the once-A-DAY form (D2): the marker holds the day it ran for → true for the first call of `day` across every function */
export async function claimDay(key, day, now = Date.now(), { memoMs = 10 * 60_000 } = {}) {
  const k = `${key}@${day}`, last = seen.get(k);
  if (last != null && now - last < memoMs) return false;
  seen.set(k, now);
  const t = await ref(`rl/zz_${key}`).transaction(cur => (cur && cur.d === day ? undefined : { d: day, t: now }));
  return !!t.committed;
}
