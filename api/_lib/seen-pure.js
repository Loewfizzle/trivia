// CITY I — SECOND ACCOUNTS (the PURE half — tests/seen.test.mjs; THE UNIT JOB INSTALLS NOTHING: no fb.js here). The server notes a HASHED
// address per account at its sign-in (api/profile.js 'ensure') and its reports (api/report.js): `seen/{h}/{pid}: { f, l }` — h = an HMAC of the
// address keyed by a salt DERIVED from the existing pepper (fb.js's KEY_PEPPER, or its service-account fallback) — never the raw address, never a
// new env var, the pepper itself never changed. Only RECENT days are kept (SEEN_DAYS): a pid not seen on an address for that long is dropped
// from it at the next write there (+ /admin's list drops the stale ones as it reads). `seen` is a LIVE node in THE NIGHTLY BACKUP (never
// DURABLE with addresses — api/_lib/backup-pure.js). /admin's SECOND ACCOUNTS list = the groups of accounts that share an address; it only
// FLAGS — nothing happens until the owner taps DON'T COUNT on an account (api/_lib/nocount.js).
import { createHmac } from 'node:crypto';

/** how long an account stays noted on an address — 14 days (two weeks of play: a household / a second phone shows; an old café visit fades) */
export const SEEN_DAYS = 14;
export const SEEN_MS = SEEN_DAYS * 86_400_000;
/** a sighting younger than this is not written again (one write per account + address per 6 h — every app load calls 'ensure') */
export const SEEN_REFRESH_MS = 6 * 3_600_000;

/** PURE: the address as one household sees it — an IPv4 as it is; an IPv6 by its /64 (a phone's privacy addresses rotate inside it) */
export function addrKey(ip) {
  let s = String(ip || '').trim().toLowerCase();
  if (!s) return '';
  if (s.startsWith('::ffff:') && s.includes('.')) s = s.slice(7);   // (an IPv4 mapped into IPv6)
  if (!s.includes(':')) return s;
  const [head] = s.split('%');
  const parts = head.split('::');
  const left = parts[0] ? parts[0].split(':') : [], right = parts.length > 1 && parts[1] ? parts[1].split(':') : [];
  const full = [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill('0'), ...right].map(x => (x || '0').replace(/^0+(?=.)/, ''));
  return `${full.slice(0, 4).join(':')}::/64`;
}
/** PURE: the stored key of an address — an HMAC (sha256) keyed by a salt derived from the pepper; 24 hex chars. '' for no address */
export function addrHash(ip, pepper) {
  const k = addrKey(ip);
  if (!k) return '';
  return createHmac('sha256', `neon-seen:${String(pepper || '')}`).update(k).digest('hex').slice(0, 24);
}
/** PURE: one address's record after `pid` is seen there at `now` → the patch for seen/{h} (null = nothing to write), the stale pids dropped */
export function seenPatch(rec, pid, now) {
  const cur = (rec && typeof rec === 'object') ? rec : {};
  const out = {};
  const me = cur[pid];
  if (!me || !(Number(me.l) > now - SEEN_REFRESH_MS)) out[pid] = { f: me && Number(me.f) > 0 ? Number(me.f) : now, l: now };
  for (const [p, v] of Object.entries(cur)) if (p !== pid && !(v && Number(v.l) > now - SEEN_MS)) out[p] = null;
  return Object.keys(out).length ? out : null;
}
/**
 * PURE: the whole `seen` node → the groups of accounts that share an address within SEEN_DAYS: [{ pids: [...], first: { pid: ms }, last: { pid:
 * ms }, shared: n }] — accounts linked through ANY shared address end in one group (home + work); a lone account on an address is no group.
 * Biggest groups first, then the newest sighting.
 */
export function seenGroups(seen, now) {
  const parent = new Map(), first = {}, last = {}, shared = new Map();
  const find = x => { while (parent.get(x) !== x) { parent.set(x, parent.get(parent.get(x))); x = parent.get(x); } return x; };
  const add = x => { if (!parent.has(x)) parent.set(x, x); };
  for (const rec of Object.values(seen || {})) {
    const live = Object.entries(rec || {}).filter(([, v]) => v && Number(v.l) > now - SEEN_MS);
    for (const [p, v] of live) { add(p); first[p] = Math.min(first[p] ?? Infinity, Number(v.f) || Number(v.l)); last[p] = Math.max(last[p] ?? 0, Number(v.l)); }
    if (live.length < 2) continue;
    for (let i = 1; i < live.length; i++) { const a = find(live[0][0]), b = find(live[i][0]); if (a !== b) parent.set(a, b); }
    const root = live.map(([p]) => p);
    for (const p of root) shared.set(p, (shared.get(p) || 0) + 1);
  }
  const by = new Map();
  for (const p of parent.keys()) { if (!shared.has(p)) continue; const r = find(p); if (!by.has(r)) by.set(r, []); by.get(r).push(p); }
  return [...by.values()].filter(g => g.length >= 2).map(pids => {
    pids.sort((a, b) => first[a] - first[b] || (a < b ? -1 : 1));
    return { pids, first: Object.fromEntries(pids.map(p => [p, first[p]])), last: Object.fromEntries(pids.map(p => [p, last[p]])), shared: Math.max(...pids.map(p => shared.get(p) || 0)) };
  }).sort((a, b) => b.pids.length - a.pids.length || Math.max(...Object.values(b.last)) - Math.max(...Object.values(a.last)));
}
