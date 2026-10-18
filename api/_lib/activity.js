// Matches played per game: gplay/{all|w<week>}/{game} = count of verified (counted) matches. Server-only (firebase-admin;
// the database rules deny clients). Bumped by /api/report when a match is counted; the first read after deploy fills
// it once from results/ (the matches counted before the counter existed).
import { ref, val } from './fb.js';
import { weekKey } from '../../js/core/week.js';

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
