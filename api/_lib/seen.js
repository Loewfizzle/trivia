// CITY I — SECOND ACCOUNTS, the database half (the pure rules: ./seen-pure.js — docs/profiles.md "CITY I — SECOND ACCOUNTS"). noteSeen = one
// read + at most one write of seen/{h} (a sighting younger than SEEN_REFRESH_MS writes nothing); a failure never touches the caller's answer
// (profiles are polish — the sign-in / the report go on without it).
import { fb, ref, val } from './fb.js';
import { addrHash, seenPatch, seenGroups } from './seen-pure.js';

/** the account `pid` was seen on `ip` at `now` (api/profile.js 'ensure' + api/report.js) — never throws */
export async function noteSeen(pid, ip, now = Date.now()) {
  try {
    if (!pid || !ip) return;
    const h = addrHash(ip, fb().pepper);
    if (!h) return;
    const patch = seenPatch(await val(`seen/${h}`), pid, now);
    if (patch) await ref(`seen/${h}`).update(patch);
  } catch { /* polish */ }
}

/** /admin (owner-only): the whole seen node → the groups (seen-pure.js#seenGroups); the stale entries it meets are dropped on the way */
export async function seenGroupsNow(now = Date.now()) {
  return seenGroups((await val('seen')) || {}, now);
}
