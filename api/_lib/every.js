// DFIX5 — EVERYONE ON SCORES, the server half (js/core/every.js = the pure rules; docs/progression.md "EVERYONE ON SCORES"):
//   dly/{game}/{day}/t   the day's top counting finishers (≤ TOP_KEEP — one small node, ONE transaction per counting finish)
//   dly/{game}/{day}/e/{pid}   a cartridge's EXTRA for a finished run, from the SERVER's own record (COAST CLEAR: { sp: spots } — the spot icons;
//                              never the phone's claim) — written at the finish, for every finish (counted or not)
//   ensureTop(cart, base)   the node, built ONCE from r/ − x/ for a day that had finishers before DFIX5 (the deploy day) — else as stored
//   addTop(cart, base, …)   a counting finish → its row in (a retried finish = the same node)
//   extraOf(cart, …)        a run's extra (stored; a run finished before DFIX5 → computed from its record once + stored)
// Server-only nodes (the rules' default deny). Never throws into a finish: the caller catches.
import { ref, val } from './fb.js';
import { topRows, insertTop, buildTop, TOP_KEEP } from '../../js/core/every.js';

/** a run's extra (COAST CLEAR's spots) from the stored node — or, for a run finished before DFIX5, from its record (computed once, stored) */
export async function extraOf(cart, base, pid, { day, now = Date.now() } = {}) {
  if (!cart || typeof cart.extra !== 'function') return null;
  const got = await val(`${base}/e/${pid}`);
  if (got != null) return got;
  const [record, startedAt] = await Promise.all([val(`${base}/p/${pid}`), val(`${base}/s/${pid}`)]);
  if (!record) return null;
  const data = cart.load ? await cart.load(day, now) : null;
  const e = cart.extra({ record, data, startedAt, day });
  if (e) await ref(`${base}/e/${pid}`).set(e);
  return e || null;
}

/** the day's kept top (sorted rows) — built once from the day's scores when the node is missing but the day has counting finishers */
export async function ensureTop(cart, base, { day, now = Date.now() } = {}) {
  const t = await val(`${base}/t`);
  if (t) return topRows(t, cart.better);
  const n = Number(await val(`${base}/n`)) || 0;
  if (!n) return [];
  const [r, x, e] = await Promise.all([val(`${base}/r`), val(`${base}/x`), val(`${base}/e`)]);
  const built = buildTop(r || {}, x || {}, e || {}, cart.better, TOP_KEEP);
  // (the runs of the kept rows finished before DFIX5: their extra from their records, once)
  if (typeof cart.extra === 'function') {
    for (const row of built.rows) if (!row.e) { const ex = await extraOf(cart, base, row.k, { day, now }).catch(() => null); if (ex) row.e = ex; }
  }
  const tx = await ref(`${base}/t`).transaction(cur => (cur ? undefined : built));
  return topRows(tx.snapshot.val() || built, cart.better);
}

/** a COUNTING finish → its row in the day's top (ONE transaction; the backfill first, so no earlier finisher is lost) */
export async function addTop(cart, base, { pid, score, at, e = null, day, now = Date.now() }) {
  await ensureTop(cart, base, { day, now });
  await ref(`${base}/t`).transaction(cur => insertTop(cur, { k: pid, s: score, at, ...(e ? { e } : {}) }, cart.better, TOP_KEEP));
}
