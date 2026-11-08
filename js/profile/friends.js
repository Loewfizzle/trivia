// FRIENDS A — this phone's view of YOUR friends list (docs/profiles.md "FRIENDS"). Everything is POLISH: /api down or unconfigured → no
// friends anywhere, nothing breaks (every caller treats a null as "no friends feature right now"). The list comes ONLY from /api (the
// server writes pfr/{pid}); never a socket — a parked title stays parked (CONN).
//   loadFriends({ fresh })   → the state { friends, in, out, blocked, recent, caps } | null
//   relOf(pid) / relOfBid(bid) → 'friend' · 'out' · 'in' · 'blocked' · 'none' · 'self' · null (not known yet)
//   friendDo(action, target)  → the new state (throws ApiFail with the server's sentence)
//   onFriends(fn)             → off()   (repaints: the profile section, a card's button, the dock's badge)
import { api } from './api.js';
import { myPid, myPublic } from './me.js';
import { testMode } from '../identity.js';

let S = null, loading = null, at = 0, badge = 0;
const subs = new Set();
const emit = () => { for (const fn of subs) { try { fn(S); } catch (e) { console.warn('friends', e); } } };
const KEY = 'ns:fr:v1';
try { const c = JSON.parse(localStorage.getItem(KEY) || 'null'); if (c && c.pid && c.s) { S = c.s; S.pid = c.pid; badge = (c.s.in || []).length; } } catch { /* fine */ }
const save = () => { try { if (S && myPid()) localStorage.setItem(KEY, JSON.stringify({ pid: myPid(), s: { ...S, recent: S.recent } })); } catch { /* fine */ } };
/** the cached list belongs to THIS profile (a restore / a new profile drops it) */
const mine = () => (S && S.pid === myPid() ? S : null);

export const friendsNow = () => mine();
export function onFriends(fn) { subs.add(fn); return () => subs.delete(fn); }
/** the pending-requests count (the badge on YOU) — from `me` (fr.in) or the list */
export const pendingBadge = () => (mine() ? (S.in || []).length : badge);
export function setBadge(n) { const v = Math.max(0, n | 0); if (v !== badge) { badge = v; emit(); } }

export async function loadFriends({ fresh = false } = {}) {
  if (testMode || !myPid()) return null;
  if (!fresh && mine() && Date.now() - at < 60e3) return S;
  if (loading) return loading;
  loading = (async () => {
    try { const r = await api('profile', { action: 'friends' }); adopt(r); return S; }
    catch (e) { return mine(); }
    finally { loading = null; }
  })();
  return loading;
}
function adopt(r) {
  if (!r || !Array.isArray(r.friends)) return;
  S = { ...r, pid: myPid() }; at = Date.now(); badge = (r.in || []).length;
  save(); emit();
}

const inList = (k, pid) => !!(S && (S[k] || []).some(c => c.pid === pid));
export function relOf(pid) {
  if (!pid) return null;
  if (pid === myPid()) return 'self';
  if (!mine()) return null;
  return inList('friends', pid) ? 'friend' : inList('blocked', pid) ? 'blocked' : inList('in', pid) ? 'in' : inList('out', pid) ? 'out' : 'none';
}
export function relOfBid(bid) {
  const me = myPublic();
  if (me && me.bid === bid) return 'self';
  if (!mine() || !bid) return mine() ? 'none' : null;
  for (const [k, r] of [['friends', 'friend'], ['blocked', 'blocked'], ['in', 'in'], ['out', 'out']]) if ((S[k] || []).some(c => c.bid === bid)) return r;
  return 'none';
}
/** the friend card for a pid (or a bid) in the list, if any */
export const cardIn = t => (mine() ? ['friends', 'in', 'out', 'blocked', 'recent'].flatMap(k => S[k] || []).find(c => (t.pid ? c.pid === t.pid : c.bid === t.bid)) || null : null);

const ACT = { add: 'friendAdd', accept: 'friendAccept', decline: 'friendDecline', cancel: 'friendCancel', remove: 'friendRemove', block: 'friendBlock', unblock: 'friendUnblock' };
/** one action → the server's answer { rel, pid, state } (the state adopted + every view repainted) */
export async function friendDo(kind, target) {
  const body = { action: ACT[kind] };
  if (target.pid) body.pid = target.pid; else { body.b = target.b; body.bid = target.bid; }
  const r = await api('profile', body);
  adopt(r.state);
  return r;
}

/** the friends IN THIS ROOM with you (the green dot): the room's players whose pid is a friend */
export function friendsHere(players = {}) {
  if (!mine()) return new Set();
  const F = new Set((S.friends || []).map(c => c.pid));
  return new Set(Object.entries(players).filter(([, p]) => p && p.pid && F.has(p.pid)).map(([u]) => u));
}
