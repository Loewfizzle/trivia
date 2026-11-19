// CITY I — DON'T COUNT (owner-only, never automatic — docs/profiles.md "CITY I — SECOND ACCOUNTS + DON'T COUNT"): `nocount/{pid}: { at, by }`, a
// server-only top-level node (the root rule denies every client — no rules change), DURABLE in THE NIGHTLY BACKUP (an owner's decision; no
// address in it). The flag is applied AT READ, never by deleting rows: THE BOARD's top + every rank (api/_lib/lb.js#topRows · #rankOf),
// EVERYONE ON SCORES, the dailies' place line + its N (api/daily.js), THE PENTHOUSE's count (api/_lib/daily-close.js). The account's own
// stats, DAILY BEST, streak, XP, items + achievements are never touched, its own views still count itself, and UNDO (the node removed) puts it
// back everywhere at once — nothing to rebuild, nothing left stale. This module = the set, cached per instance like the boards (15 s).
import { val } from './fb.js';

const CACHE_MS = 15_000;
let cached = { at: 0, set: null };

/** the DON'T COUNT pids (a Set) */
export async function noCountSet(now = Date.now()) {
  if (cached.set && now - cached.at < CACHE_MS) return cached.set;
  let v = null;
  try { v = await val('nocount'); } catch { v = null; }
  cached = { at: now, set: new Set(Object.keys(v || {})) };
  return cached.set;
}
/** after a flag / an undo on this instance (/admin) */
export function clearNoCount() { cached = { at: 0, set: null }; }
