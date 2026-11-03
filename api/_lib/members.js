// THE VAULT 2B — MEMBER NUMBERS (the owner, Nov 3 12:17 pm: "I am member Nº 0001"). A real member number, separate from the name tag's
// four digits (Name#3112 keeps them): server-assigned, SEQUENTIAL by when the profile was made, NEVER reused (a deleted profile's
// number is gone), NEVER changes. The OWNER's profile (the first id in ADMIN_PIDS) = Nº 1, reserved; everyone else from Nº 2 in join order.
//   profiles/{pid}/mn : n          public (the membership card, FOUNDING MEMBER's gold stamp, the DEV cards) — server-written only
//   members: { next, filled }      server only (the rules' default deny): the counter + when the one-time back-fill ran
// THE BACK-FILL (once, the first time any profile asks): every existing profile by its `at` (then its id), the owner first, numbered from
// 2 — then every NEW profile takes `next` in one transaction. Shown as `0001` (memberLabel); past 9999 just the number.
import { ref, val, adminPids } from './fb.js';

/** the owner's profile id (Nº 1): the first in ADMIN_PIDS */
export const ownerPid = () => adminPids()[0] || null;
export { memberLabel } from '../../js/core/member.js';

let filling = null;
/** the one-time back-fill (idempotent: a profile that has a number keeps it; claimed by a transaction so two can't run at once) */
export async function backfill(now = Date.now()) {
  if (await val('members/filled')) return false;
  const claim = await ref('members/claim').transaction(cur => (cur && now - cur < 60_000 ? undefined : now));
  if (!claim.committed) { await waitFilled(); return false; }
  const all = (await val('profiles')) || {};
  const owner = ownerPid();
  const order = Object.entries(all).filter(([, p]) => p && p.n)
    .sort(([a, p], [b, q]) => ((a === owner) - (b === owner)) * -1 || (p.at || 0) - (q.at || 0) || (a < b ? -1 : 1));
  let next = 2; const patch = {};
  const taken = Object.values(all).map(p => (p && p.mn) || 0);
  next = Math.max(2, ...taken.map(n => n + 1));
  for (const [pid, p] of order) {
    if (p.mn) continue;
    if (pid === owner && !taken.includes(1)) { patch[`profiles/${pid}/mn`] = 1; continue; }
    patch[`profiles/${pid}/mn`] = next++;
  }
  patch['members/next'] = next; patch['members/filled'] = now; patch['members/claim'] = null;
  await ref('/').update(patch);
  return true;
}
async function waitFilled() { for (let i = 0; i < 40; i++) { if (await val('members/filled')) return; await new Promise(r => setTimeout(r, 250)); } }

/** this profile's member number — assigned now if it has none (the owner → 1; anyone else → the next, in one transaction) */
export async function memberNo(pid, now = Date.now()) {
  const have = await val(`profiles/${pid}/mn`);
  if (have) return have;
  if (!(await val('members/filled'))) { filling = filling || backfill(now).finally(() => { filling = null; }); await filling; const n = await val(`profiles/${pid}/mn`); if (n) return n; }
  if (!(await val(`profiles/${pid}/n`))) return null;
  if (pid === ownerPid()) {
    const r = await ref(`profiles/${pid}/mn`).transaction(cur => cur || 1);
    return r.snapshot.val();
  }
  let got = null;
  const t = await ref('members/next').transaction(cur => { got = Math.max(2, cur || 2); return got + 1; });
  if (!t.committed) return null;
  // (two racing calls for one profile: the first number written wins; the other is simply never used — "never reused" holds)
  const w = await ref(`profiles/${pid}/mn`).transaction(cur => cur || got);
  return w.snapshot.val();
}
