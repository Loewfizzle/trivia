// GET /api/board?b=<board>&p=week|all[&start=0&n=100] — a board's top 100, public (no sign-in: the /board page and
// non-players read it too), joined with each profile's current name / tag / emblem. Cached in memory for a few
// seconds and by Vercel's CDN (s-maxage), so a busy night costs a handful of database reads a minute.
// The caller's own exact rank comes from POST /api/profile { action: 'ranks' } (not cacheable).
import { route, send, ApiError } from './_lib/http.js';
import { topRows, TOP_N } from './_lib/lb.js';
import { boardDef } from '../js/core/boards.js';
import { weekEndsAt } from '../js/core/week.js';
import { activity } from './_lib/activity.js';

export async function boardQuery(q, now = Date.now()) {
  const b = String(q.b || '');
  const p = q.p === 'all' ? 'all' : 'week';
  if (!boardDef(b)) throw new ApiError(400, 'bad_board');
  const start = Math.max(0, Math.min(TOP_N, Number(q.start) || 0));
  const n = Math.max(1, Math.min(TOP_N, Number(q.n) || TOP_N));
  const data = await topRows(b, p, now);
  return { b, p, key: data.p, rows: data.rows.slice(start, start + n), more: data.rows.length > start + n, at: data.at, ends: p === 'week' ? weekEndsAt(now) : null };
}

export default route(['GET'], async (req, res) => {
  const q = Object.fromEntries(new URL(req.url, 'http://x').searchParams);
  // ?active=1: which games are played most (THE BOARD opens on the busiest one)
  if (q.active) { send(res, 200, await activity(), { 'Cache-Control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=600' }); return; }
  send(res, 200, await boardQuery(q), { 'Cache-Control': 'public, max-age=10, s-maxage=20, stale-while-revalidate=60' });
});
