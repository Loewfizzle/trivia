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
import { streakDay } from '../../js/core/streak.js';
import { ApiError } from './http.js';

/** Nov 4 2026, 10:30 am Eastern (EST, UTC−5) = 15:30 UTC — the first of the 2B test players */
export const TEST_SINCE = Date.UTC(2026, 10, 4, 15, 30);
const MAX_LIST = 200;
// THE SPEED PASS — ALL OF THEM (the owner, Nov 4 6:07 pm: 46 profiles, most fakes from test runs that reached the live site before the
// live-site guard): the card lists from a CREATED SINCE date (default: the very first profile) with each profile's counted matches, NIGHTS
// (the distinct streak days it played on), last seen, member Nº + created; a "looks like a test" PRE-TICK the owner reviews (never removed
// automatically) — two of: 0 nights · a test-ish name · made in a test burst (3+ profiles within 10 minutes). NEVER pre-ticked: an admin,
// the named ones (TESTER#2599 — his old laptop card), anyone who played on 2+ nights (a real person who came back — his brother).
export const TP_NEVER = ['TESTER#2599'];
const TEST_NAME = /^(test|tester|qa|e2e|bot|fake|dummy|demo|player|guest|slot|check[a-z0-9]*|rules[a-z0-9]*|wk[a-z]?|fg\d*|ava|ben|cat|dan|p\d+|[a-z]{1,4}\d{1,3}|[a-z]\d*|.*test.*)$/i;
const BURST_MS = 10 * 60_000;
/** PURE — does a name look like a test run's? */
export const testName = n => TEST_NAME.test(String(n || '').trim());
/** PURE — the distinct nights (streak days, 4 am Eastern) in a stats node's counted matches */
export function nightsOf(s) { const days = new Set(); for (const at of Object.values((s && s.m) || {})) if (Number(at) > 0) days.add(streakDay(Number(at))); return days.size; }
/** PURE — the pre-tick for every row (rows: { pid, n, t, at, nights, admin }) → each row + { why: [...], pre } */
export function preTick(rows, never = TP_NEVER) {
  const ats = rows.map(r => r.at || 0).filter(Boolean).sort((a, b) => a - b);
  const near = at => { if (!at) return 0; let c = 0; for (const x of ats) if (Math.abs(x - at) <= BURST_MS) c++; return c; };
  return rows.map(r => {
    const why = [];
    if (!r.nights) why.push('0 nights');
    if (testName(r.n)) why.push('test name');
    if (near(r.at) >= 3) why.push('test burst');
    const keep = r.admin || never.includes(`${r.n}#${r.t}`) || (r.nights || 0) >= 2;
    return { ...r, why, pre: !keep && why.length >= 2 };
  });
}

async function row(pid, p) {
  const s = (await val(`pstats/${pid}`)) || {};
  const ms = Object.values(s.m || {}).map(Number).filter(x => x > 0);
  return { pid, n: p.n, t: p.t || null, mn: p.mn || null, xp: s.xp || p.x || 0, m: matchCount(s) || p.m || 0, nights: nightsOf(s), last: Math.max(s.last || 0, ...ms, 0) || null, at: p.at || null, admin: adminPids().includes(pid) };
}

/** the list for the card: newest first. `since` = the CREATED SINCE date (ms; default 0 = the very first profile) */
export async function listTestPlayers({ since = 0, also = [] } = {}) {
  since = Number.isFinite(Number(since)) ? Number(since) : 0;
  const all = (await val('profiles')) || {};
  const pick = new Map();
  let first = null;
  for (const [pid, p] of Object.entries(all)) { if (p && p.n && p.at && (first == null || p.at < first)) first = p.at; if (p && p.n && (p.at || 0) >= since) pick.set(pid, p); }
  for (const q of (Array.isArray(also) ? also : []).slice(0, 10)) {
    const m = /^(.{1,24})#(\d{4})$/.exec(String(q || '').trim());
    if (!m) continue;
    const pid = await val(`tags/${encodeKey(nameKey(m[1]))}/${m[2]}`);
    if (isPid(pid) && all[pid] && all[pid].n) pick.set(pid, all[pid]);
  }
  const rows = preTick(await Promise.all([...pick].map(([pid, p]) => row(pid, p))));
  rows.sort((a, b) => (b.at || 0) - (a.at || 0));
  return { players: rows.slice(0, MAX_LIST), since, first, total: rows.length, next: (await val('members/next')) || null };
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
    for (const k of Object.keys(boardPaths(pid, stats || {}, { hidden: 'opt', now }))) patch[k] = null;
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
