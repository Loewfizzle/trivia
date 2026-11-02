// "X% OF PLAYERS HAVE THIS" (PROGRESSION A) — server-only counts, cheap on the free plans: ONE small node, read once a minute per
// function instance (+ the CDN), never a scan of profiles.
//   pcount/n        players with a counted match (or a counted daily) — the denominator
//   pcount/i/{id}   owners of an item (a card, an emblem shape, a tube style, a name glow, a favor)
//   pcount/a/{id}   holders of an achievement
// A count is DISPLAY ONLY (a crash between the award and the count undercounts by one — never a double award: the award itself is the
// player's own transaction, keyed by the match). The client never writes here (the rules' default deny).
import { ref, val } from './fb.js';
import { ServerValue } from 'firebase-admin/database';

const inc = n => ServerValue.increment(n);

/** items: new item ids; newPlayer: this was the player's first counted match / daily; achs: new achievement ids. */
export async function bumpOwners(items = [], newPlayer = false, achs = []) {
  const patch = {};
  if (newPlayer) patch['pcount/n'] = inc(1);
  for (const id of items || []) patch[`pcount/i/${id}`] = inc(1);
  for (const id of achs || []) patch[`pcount/a/${id}`] = inc(1);
  if (Object.keys(patch).length) { await ref('/').update(patch); cache = null; }
}

let cache = null;
const TTL_MS = 60_000;
/** { n, i: { id: count }, a: { id: count } } — cached a minute per instance. */
export async function ownerCounts(now = Date.now()) {
  if (cache && now - cache.at < TTL_MS) return cache.v;
  const v = (await val('pcount')) || {};
  const out = { n: v.n || 0, i: v.i || {}, a: v.a || {} };
  cache = { at: now, v: out };
  return out;
}
/** A whole percent for display (never 0 % for something someone owns; never over 100). */
export const pctOf = (count, n) => (!count || !n ? 0 : Math.max(1, Math.min(100, Math.round((100 * count) / n))));
