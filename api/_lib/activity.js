// Matches played per game: gplay/{all|w<week>}/{game} = count of verified (counted) matches. Server-only (firebase-admin;
// the database rules deny clients). Bumped by /api/report when a match is counted; the first read after deploy fills
// it once from results/ (the matches counted before the counter existed).
import { ref, val } from './fb.js';
import { weekKey } from '../../js/core/week.js';
import { streakDay } from '../../js/core/streak.js';
import { popularity, popularOrder } from '../../js/core/game-order.js';
import { GAMES } from '../../js/config.js';

export async function bumpPlayed(game, now = Date.now()) {
  const inc = p => ref(`gplay/${p}/${game}`).transaction(n => (n || 0) + 1);
  await Promise.all([inc('all'), inc(weekKey(now))]);
}

let cache = null;
/** { week: { game: n }, all: { game: n }, order: [game ids, most played this week first, then all time] } */
export async function activity(now = Date.now()) {
  if (cache && now - cache.at < 60_000) return cache.data;
  const wk = weekKey(now);
  let [all, week, filled] = await Promise.all([val('gplay/all'), val(`gplay/${wk}`), val('gplay/filled')]);
  if (!filled) {
    // one-time: count the matches counted before the counter existed
    const res = (await val('results')) || {};
    const a = {}, w = {};
    for (const r of Object.values(res)) {
      if (!r || r.st !== 'done' || !r.g) continue;
      a[r.g] = (a[r.g] || 0) + 1;
      if (weekKey(r.at || 0) === wk) w[r.g] = (w[r.g] || 0) + 1;
    }
    await Promise.all([ref('gplay/all').set(a), ref(`gplay/${wk}`).set(w), ref('gplay/filled').set(now)]);
    all = a; week = w;
  }
  all = all || {}; week = week || {};
  const order = Object.keys({ ...all, ...week }).sort((x, y) => (week[y] || 0) - (week[x] || 0) || (all[y] || 0) - (all[x] || 0));
  const data = { week, all, order };
  cache = { at: now, data };
  return data;
}

// CITY H2 — THE GAMES LIST BY POPULARITY (js/core/game-order.js): the playable games' ORDER, worked out ONCE a streak day (the first read after the
// 4 am turn — progress/gameOrder { day, order, at }; every warm function + every phone the same copy), served in the cached GET ?live=1 — the
// order only, never the counts. Unreadable → null (the phones keep their last copy / the config's order).
let orderCache = null;
export async function gameOrder(now = Date.now()) {
  const day = streakDay(now);
  if (orderCache && orderCache.day === day) return orderCache.order;
  const cur = await val('progress/gameOrder').catch(() => null);
  if (cur && cur.day === day && Array.isArray(cur.order)) { orderCache = { day, order: cur.order }; return cur.order; }
  const ids = GAMES.filter(g => g.playable).map(g => g.id);
  const order = popularOrder(ids, popularity((await val('results')) || {}, now), ids);
  await ref('progress/gameOrder').set({ day, order, at: now }).catch(() => {});
  orderCache = { day, order };
  return order;
}
