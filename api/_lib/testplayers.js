// LOBBY FIXES — REMOVE TEST PLAYERS (the owner, Nov 4 2:13–2:41 pm: "anything the owner must do to LIVE data = an /admin button on the
// server's own credentials, never a script + a key on his PC"). /admin's TEST PLAYERS card, admins only (api/admin.js — audited):
//   testPlayers { since?, also? }   → { players: [...], since, next }   every profile created since `since` (default Nov 4 2026 10:30 am
//                                     EST) + any named in `also` ("Name#1234" — an older one he wants to look at, e.g. TESTER#2599, Nº 2)
//   removeTestPlayers { pids, confirm }  → the DRY RUN (confirm false): what goes + what the member counter does; confirm true = removes them
// Removes ONLY the ticked profiles: the profile, its private node, its stats (its items + achievements live there), its key, its tag, its
// device links (uids/{uid} still pointing at it), its seat, its board entries. Never an admin. MEMBER NUMBERS never shift + are never
// re-used: members/next rolls back ONLY when every number from the new top up to the counter belonged to a removed profile (a gap left
// by an earlier deletion stays a gap). The "X% have this" counts (pcount/) are display only and are left as they are.
import { ref, val, adminPids } from './fb.js';
import { isPid, encodeKey, releaseTag } from './profiles.js';
import { boardPaths, matchCount, clearBoardCache } from './lb.js';
import { nameKey } from '../../js/core/names.js';
import { ApiError } from './http.js';

/** Nov 4 2026, 10:30 am Eastern (EST, UTC−5) = 15:30 UTC — the first of the 2B test players */
export const TEST_SINCE = Date.UTC(2026, 10, 4, 15, 30);
const MAX_LIST = 60;

async function row(pid, p) {
  const s = (await val(`pstats/${pid}`)) || {};
  return { pid, n: p.n, t: p.t || null, mn: p.mn || null, xp: s.xp || p.x || 0, m: matchCount(s) || p.m || 0, at: p.at || null, admin: adminPids().includes(pid) };
}

/** the list for the card: newest first */
export async function listTestPlayers({ since = TEST_SINCE, also = [] } = {}) {
  since = Number.isFinite(Number(since)) ? Number(since) : TEST_SINCE;
  const all = (await val('profiles')) || {};
  const pick = new Map();
  for (const [pid, p] of Object.entries(all)) if (p && p.n && (p.at || 0) >= since) pick.set(pid, p);
  for (const q of (Array.isArray(also) ? also : []).slice(0, 10)) {
    const m = /^(.{1,24})#(\d{4})$/.exec(String(q || '').trim());
    if (!m) continue;
    const pid = await val(`tags/${encodeKey(nameKey(m[1]))}/${m[2]}`);
    if (isPid(pid) && all[pid] && all[pid].n) pick.set(pid, all[pid]);
  }
  const rows = await Promise.all([...pick].map(([pid, p]) => row(pid, p)));
  rows.sort((a, b) => (b.at || 0) - (a.at || 0));
  return { players: rows.slice(0, MAX_LIST), since, next: (await val('members/next')) || null };
}

/** PURE — the member counter after removing `gone` numbers: { from, to } (to === from: no roll-back) */
export function counterAfter(next, keptNos, goneNos) {
  if (!next) return { from: next || null, to: next || null };
  const top = Math.max(1, ...keptNos.filter(n => n > 0));
  const gone = new Set(goneNos);
  for (let n = top + 1; n < next; n++) if (!gone.has(n)) return { from: next, to: next };   // (a gap / a kept number above: never re-used)
  return { from: next, to: Math.max(2, top + 1) };
}

/** the dry run (confirm false) or the removal (confirm true) → { remove: [rows], counter: { from, to }, done } */
export async function removeTestPlayers(pids, { confirm = false, now = Date.now() } = {}) {
  const ids = [...new Set((Array.isArray(pids) ? pids : []).map(String))];
  if (!ids.length || ids.length > MAX_LIST || !ids.every(isPid)) throw new ApiError(400, 'bad_pids', 'Tick the players to remove.');
  if (ids.some(p => adminPids().includes(p))) throw new ApiError(400, 'admin_pid', 'An admin profile is never removed here.');
  const all = (await val('profiles')) || {};
  const missing = ids.filter(p => !all[p]);
  if (missing.length) throw new ApiError(404, 'no_profile', `No profile ${missing[0]}.`);
  const rows = await Promise.all(ids.map(p => row(p, all[p])));
  const kept = Object.entries(all).filter(([p]) => !ids.includes(p)).map(([, p]) => (p && p.mn) || 0);
  const counter = counterAfter(await val('members/next'), kept, rows.map(r => r.mn || 0));
  if (!confirm) return { remove: rows, counter, done: false };
  const lb = (await val('lb')) || {};
  for (const pid of ids) {
    const [prof, priv, stats] = await Promise.all([val(`profiles/${pid}`), val(`ppriv/${pid}`), val(`pstats/${pid}`)]);
    const patch = { [`profiles/${pid}`]: null, [`ppriv/${pid}`]: null, [`pstats/${pid}`]: null, [`seats/${pid}`]: null, [`radio/crew/${pid}`]: null };
    if (priv && priv.kh) patch[`pkeys/${priv.kh}`] = null;
    for (const k of Object.keys(boardPaths(pid, stats || {}, { hidden: true, now }))) patch[k] = null;
    // (+ every older week's entry: the boards are walked once — a small node on this site's scale)
    for (const [b, periods] of Object.entries(lb)) for (const [per, rows] of Object.entries(periods || {})) if (rows && rows[pid] != null) patch[`lb/${b}/${per}/${pid}`] = null;
    // (the device links still pointing here — a device that restored another card points there now and is left alone)
    for (const uid of Object.keys((priv && priv.uids) || {})) if ((await val(`uids/${uid}`)) === pid) patch[`uids/${uid}`] = null;
    await ref('/').update(patch);
    if (prof) await releaseTag(prof.nk, prof.t, pid);
  }
  if (counter.to !== counter.from) await ref('members/next').transaction(cur => (cur === counter.from ? counter.to : cur));   // (cur, never undefined: the first call sees the empty cache)
  clearBoardCache();
  return { remove: rows, counter, done: true };
}
