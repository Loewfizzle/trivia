// FREEFALL GO-LIVE — THE /admin HELD LIST (docs/freefall.md "THE HELD LIST"; the owner, Nov 27). A run THE HOLD kept off (core/match-report.js#
// ffTooPerfect — too perfect for a human: its XP WAS paid; its board row, THE AVERAGE + the cards were not) is kept at ffheld/{id} for the
// owner: RELEASE = the row reaches the board, the average + the cards exactly once (core/progress.js#releaseStep — pstats.rl/{id}), never XP
// or a win; REJECT = off the list (the XP stays). SERVER-ONLY: no client reads or writes ffheld (the rules' root is closed); /admin's two
// buttons go through api/admin.js (owner-only, every one audited). A DURABLE node (api/_lib/backup-pure.js).
import { ref, val } from './fb.js';
import { ApiError } from './http.js';
import { releaseStep } from '../../js/core/progress.js';
import { heldNode, heldId } from '../../js/core/match-report.js';
import { syncBoards, playCount, minMatches } from './lb.js';
import { founderOpen } from './founder.js';
import { bumpOwners } from './owners.js';

export const HELD_ID = /^[A-Za-z0-9_-]{4,120}$/;
const BOARD = 'freefall-solo';
/** api/report.js#credit — a counted match's held rows → ffheld/{id} (once each: a resend finds its row) */
export async function recordHeld({ key, ex, pids, at, now }) {
  const held = (ex.rejected || []).filter(r => r && r.v === 'held' && pids[r.uid]);
  await Promise.all(held.map(async r => {
    const pid = pids[r.uid], prof = (await val(`profiles/${pid}`)) || {};
    await ref(`ffheld/${heldId(key, pid)}`).transaction(cur => cur || heldNode({ key, pid, name: prof.n, tag: prof.t, r, gid: ex.gid, at, now }));
  }));
  return held.length;
}
/** the list, newest first (the owner's card) */
export async function heldList() {
  const all = (await val('ffheld')) || {};
  return Object.entries(all).map(([id, x]) => ({ id, ...x })).sort((a, b) => (b.at || 0) - (a.at || 0)).slice(0, 200);
}
/** RELEASE: claimed first (one tap = one release), then the pure step in ONE pstats transaction, the board row from the stats, off the list */
export async function heldRelease(id, now = Date.now()) {
  if (!HELD_ID.test(String(id))) throw new ApiError(400, 'bad_id');
  // (a transaction's first pass may see NO cached value: null is kept as null — the server then runs it again on the real row; undefined would abort)
  const claim = await ref(`ffheld/${id}`).transaction(cur => (cur == null ? null : cur.st === 'busy' && now - (cur.bt || 0) < 60_000 ? undefined : { ...cur, st: 'busy', bt: now }));
  if (!claim.committed || !claim.snapshot.val()) throw new ApiError(409, 'gone', 'Already handled.');
  const h = claim.snapshot.val(), fo = await founderOpen(now).catch(() => false);
  let res = null;
  const tx = await ref(`pstats/${h.pid}`).transaction(cur => { res = releaseStep(cur, { id, b: BOARD, v: h.f, solo: !!h.so, ft: h.ff, gid: h.g || 'freefall', at: h.at }, now, { founderOpen: fo }); return res.skip ? undefined : res.next; });
  let all = false;
  if (res && !res.skip) {
    const played = playCount(tx.snapshot.val());
    all = playCount(res.prevStats) < minMatches() && played >= minMatches();   // (this release is the play that LISTS them: every game's boards up at once — stats.js's rule)
    const patch = { [`profiles/${h.pid}/m`]: played };
    for (const [b, v] of Object.entries(res.av || {})) patch[`profiles/${h.pid}/av/${b}`] = v == null ? null : v;
    if (Object.keys(patch).length) await ref('/').update(patch);
    await bumpOwners(res.items, false, res.ach).catch(e => console.warn('owners', e && e.message));
  }
  await syncBoards(h.pid, { now, only: all ? null : h.g || 'freefall' });   // (the board rows from the stats — the same rows a counted run writes)
  await ref(`ffheld/${id}`).remove();
  return { id, pid: h.pid, skip: (res && res.skip) || null, pbs: (res && res.pbs) || [], ach: (res && res.ach) || [], items: (res && res.items) || [] };
}
/** REJECT: off the list — nothing else moves (the XP it was paid stays) */
export async function heldReject(id) {
  if (!HELD_ID.test(String(id))) throw new ApiError(400, 'bad_id');
  const cur = await val(`ffheld/${id}`);
  if (!cur || (cur.st === 'busy' && Date.now() - (cur.bt || 0) < 60_000)) throw new ApiError(409, 'gone', 'Already handled.');   // (a RELEASE in flight — never REJECTED under it)
  await ref(`ffheld/${id}`).remove();
  return { id, pid: cur.pid };
}
