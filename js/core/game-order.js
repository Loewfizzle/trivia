// CITY H2 — THE GAMES LIST BY POPULARITY (the owner, Nov 18 — docs/progression.md "THE GAMES LIST ORDER"). PURE (the server + the phones; no
// imports beyond the streak's day): the PLAY sheet (outside a room) + GAMES / PICK A GAME (in a room) order the playable games by the number of
// DIFFERENT PLAYERS who played each in the last 14 days (ties: the matches); a game in its first 14 days after its go-live (config.js GAMES[].live)
// sits ON TOP with a NEW foil line (the newest first). THE SERVER works the order out ONCE a streak day (the 4 am turn — api/_lib/activity.js
// #gameOrder → progress/gameOrder) and serves only the ORDER — no counts — inside the cached GET ?live=1 the city already reads (no new idle
// poll — THE CITY'S IDLE POLLS rule); every phone the same; the config's own order is the fallback when it can't be read.
import { streakDay } from './streak.js';

export const POP_DAYS = 14, NEW_DAYS = 14;
const DAY = 864e5;
const KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const dayNum = k => { const [y, m, d] = String(k).split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / DAY); };

/** results/ (counted matches: { st: 'done', g, at, o: { pid: … } }) → { [game]: { p: DIFFERENT players, m: matches } } in the last `days` */
export function popularity(results = {}, now = Date.now(), days = POP_DAYS) {
  const since = now - days * DAY, seen = {}, out = {};
  for (const r of Object.values(results || {})) {
    if (!r || r.st !== 'done' || !r.g || !(r.at >= since) || r.at > now + 60e3) continue;
    const o = out[r.g] || (out[r.g] = { p: 0, m: 0 }), s = seen[r.g] || (seen[r.g] = new Set());
    o.m++;
    for (const pid of Object.keys(r.o || {})) if (!s.has(pid)) { s.add(pid); o.p++; }
  }
  return out;
}

/** the ORDER the server serves: `ids` by players (most first), then matches, then the fallback's own order */
export function popularOrder(ids = [], pop = {}, fallback = ids) {
  const at = id => { const i = fallback.indexOf(id); return i < 0 ? 999 : i; }, P = id => pop[id] || { p: 0, m: 0 };
  return [...ids].sort((a, b) => P(b).p - P(a).p || P(b).m - P(a).m || at(a) - at(b));
}

/** a streak-day key ('dYYYYMMDD' or 'YYYY-MM-DD') → 'YYYY-MM-DD' */
export const dayKeyOf = k => { const s = String(k || ''); const m = /^d(\d{4})(\d{2})(\d{2})$/.exec(s); return m ? `${m[1]}-${m[2]}-${m[3]}` : s; };
/** is a game whose go-live day is `live` NEW on `dayKey` (its first `days` days, the go-live day counted) */
export function isNew(live, dayKey, days = NEW_DAYS) {
  if (!KEY_RE.test(String(live || '')) || !KEY_RE.test(String(dayKey || ''))) return false;
  const d = dayNum(dayKey) - dayNum(live);
  return d >= 0 && d < days;
}

/** the list a phone shows: the NEW games on top (the newest go-live first), then the SERVED order, then any game the order lacks (the config's
 *  order). `served` invalid / empty → the config's order (the fallback). → [{ ...game, isNew }] */
export function shelfOrder(games = [], served = null, now = Date.now()) {
  const day = dayKeyOf(streakDay(now));
  const ord = Array.isArray(served) ? served.filter(x => typeof x === 'string') : [];
  const rank = g => { const i = ord.indexOf(g.id); return i < 0 ? 500 + games.indexOf(g) : i; };
  const fresh = g => isNew(g.live, day);
  return [...games].sort((a, b) => (fresh(b) - fresh(a)) || (fresh(a) && fresh(b) ? dayNum(b.live) - dayNum(a.live) : 0) || rank(a) - rank(b))
    .map(g => ({ ...g, isNew: fresh(g) }));
}

/** the phone's copy of the served order (THE CITY's feed → localStorage 'nd:gorder', harbor/remote.js) — null when none / unreadable */
export const ORDER_LS = 'nd:gorder';
export function storedOrder() { try { const v = JSON.parse(localStorage.getItem(ORDER_LS) || 'null'); return Array.isArray(v) ? v : null; } catch { return null; } }
