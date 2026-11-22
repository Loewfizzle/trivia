// THE CALL BUDGET (DM1 / DFIX3 — api/daily.js's, made ONE helper by THE FIX PASS for /api/report too — S3 b): a per-instance window counter
// decides AT ONCE (never a wait on the request's path); the shared count (rl/<prefix>_{uid} — every warm instance) is written BEHIND it, and
// its refusal lifts the local count, so a flood spread across instances still stops within one round trip. rl/ is pruned (api/_lib/prune.js).
import { take } from './limit.js';

/** → budget(uid, now) — true = go on, false = over `max` calls in `windowMs` (+ .forget() for the tests) */
export function callBudget(prefix, { max, windowMs }) {
  const BUDGET = new Map();
  const budget = (uid, now) => {
    const key = String(uid).replace(/[.#$[\]/]/g, '_');
    let b = BUDGET.get(key);
    if (!b || now - b.t >= windowMs || now < b.t) {
      b = { n: 0, t: now };
      BUDGET.set(key, b);
      if (BUDGET.size > 4000) for (const k of [...BUDGET.keys()].slice(0, 1000)) BUDGET.delete(k);
    }
    if (b.n >= max) return false;
    b.n++;
    take(`${prefix}_${key}`, max, windowMs, now).then(ok => { if (!ok) b.n = Math.max(b.n, max); }).catch(() => {});
    return true;
  };
  budget.forget = () => BUDGET.clear();
  return budget;
}
