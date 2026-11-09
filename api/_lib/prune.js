// FR6 FIXES A (C8) — THE LOGS PRUNED ON WRITE. The phones' REPORTS (phonelog, ≤ 24 KB each × 120 a day) were trimmed only when an admin
// opened /admin (reportList), the errors (errlog) only in errorList, and the rate-limit buckets (rl/) never — weeks of growth against the
// free plan's 1 GB if nobody looked. Now a write to the log (api/log.js) prunes all three AT MOST ONCE AN HOUR (a marker under rl/, a
// transaction: two phones at once never both prune): phonelog → the newest REPORT_KEEP, errlog → nothing quiet for ERR_KEEP_MS, rl/ →
// nothing older than RL_KEEP_MS (every bucket's window is ≤ a day). /admin keeps its own trims too.
import { ref, val } from './fb.js';

export const REPORT_KEEP = 40;
export const ERR_KEEP_MS = 30 * 86_400_000;
export const RL_KEEP_MS = 2 * 86_400_000;
export const PRUNE_EVERY_MS = 3600_000;
const MARK = 'rl/zz_prune';

/** PURE: what to delete → { phonelog: [ids], errlog: [sigs], rl: [keys] } */
export function prunePlan({ phonelog = {}, errlog = {}, rl = {} } = {}, now = Date.now()) {
  const reports = Object.entries(phonelog || {}).map(([id, r]) => ({ id, at: (r && r.at) || 0, k: (r && r.kind) || 'tap' })).sort((a, b) => b.at - a.at);
  // (CITY FIXES: the newest REPORT_KEEP PER KIND — THE TAP WATCH's lost taps never push a hang report out)
  const per = {};
  return {
    phonelog: reports.filter(r => (per[r.k] = (per[r.k] || 0) + 1) > REPORT_KEEP).map(r => r.id),
    errlog: Object.keys(errlog || {}).filter(k => !((errlog[k] && errlog[k].last) > now - ERR_KEEP_MS)),
    rl: Object.keys(rl || {}).filter(k => k !== MARK.slice(3) && !((rl[k] && rl[k].t) > now - RL_KEEP_MS)),
  };
}

/** prune if the last prune is over an hour old → the counts removed, or null (not due / another phone is on it) */
export async function pruneLogsIfDue(now = Date.now()) {
  const t = await ref(MARK).transaction(cur => (cur && cur.t > now - PRUNE_EVERY_MS ? undefined : { n: 0, t: now }));
  if (!t.committed) return null;
  const [phonelog, errlog, rl] = await Promise.all([val('phonelog'), val('errlog'), val('rl')]);
  const plan = prunePlan({ phonelog, errlog, rl }, now);
  const patch = {};
  for (const id of plan.phonelog) patch[`phonelog/${id}`] = null;
  for (const k of plan.errlog) patch[`errlog/${k}`] = null;
  for (const k of plan.rl) patch[`rl/${k}`] = null;
  if (Object.keys(patch).length) await ref('/').update(patch);
  return { phonelog: plan.phonelog.length, errlog: plan.errlog.length, rl: plan.rl.length };
}
