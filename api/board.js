// GET /api/board?b=<board>&p=week|all[&start=0&n=100] — a board's top 100, public (no sign-in: the /board page and
// non-players read it too), joined with each profile's emblem / colour / rank. Cached in memory for a few
// seconds and by Vercel's CDN (s-maxage), so a busy night costs a handful of database reads a minute.
// BNAME (Oct 28): a row is { id, n, t, a, c, r, rank, v } — `id` the opaque board id, `n` + `t` the HOUSE NICKNAME
// (js/core/nicknames.js); never the typed name, never the profile id. Your own row is found by `profile.bid` on your device.
// The caller's own exact rank comes from POST /api/profile { action: 'ranks' } (not cacheable).
//
// POST /api/board { action: 'report', b, id, why: 'score' | 'name', dev? } — REPORT a row (no sign-in): stored in
// flags/{id} for /admin (api/admin.js `flags`), rate-limited per device + IP + day. → { ok: true }
import { createHash } from 'node:crypto';
import { route, send, readBody, clientIp, ApiError } from './_lib/http.js';
import { ref, fb } from './_lib/fb.js';
import { topRows, TOP_N } from './_lib/lb.js';
import { boardDef } from '../js/core/boards.js';
import { isBoardId } from '../js/core/nicknames.js';
import { weekEndsAt } from '../js/core/week.js';
import { activity } from './_lib/activity.js';

const pub = r => ({ id: r.id, n: r.n, t: r.t, a: r.a, c: r.c, r: r.r, rank: r.rank, v: r.v });

export async function boardQuery(q, now = Date.now()) {
  const b = String(q.b || '');
  const p = q.p === 'all' ? 'all' : 'week';
  if (!boardDef(b)) throw new ApiError(400, 'bad_board');
  const start = Math.max(0, Math.min(TOP_N, Number(q.start) || 0));
  const n = Math.max(1, Math.min(TOP_N, Number(q.n) || TOP_N));
  const data = await topRows(b, p, now);
  return { b, p, key: data.p, rows: data.rows.slice(start, start + n).map(pub), more: data.rows.length > start + n, at: data.at, ends: p === 'week' ? weekEndsAt(now) : null };
}

export const FLAG_LIMITS = { ipPerHour: 8, devPerHour: 5, perDay: 400 };
export const FLAG_WHY = ['score', 'name'];

async function take(bucket, max, windowMs, now) {
  const r = await ref(`rl/${bucket}`).transaction(cur => {
    const x = cur && now - cur.t < windowMs ? cur : { n: 0, t: now };
    if (x.n >= max) return undefined;
    return { n: x.n + 1, t: x.t };
  });
  return r.committed;
}
const hashOf = (kind, s) => createHash('sha256').update(`neon-flag:${kind}:${fb().pepper}:${s}`).digest('hex').slice(0, 20);

/** REPORT a board row: finds whose row it is (this week's or the all-time top 100) and counts the report under flags/{id}. */
export async function flagRow(body, { ip = '', now = Date.now() } = {}) {
  const b = String((body && body.b) || '');
  const id = String((body && body.id) || '');
  const why = String((body && body.why) || '');
  if (!boardDef(b) || !isBoardId(id) || !FLAG_WHY.includes(why)) throw new ApiError(400, 'bad_report');
  const dev = /^[a-z0-9]{8,32}$/.test(String(body.dev || '')) ? String(body.dev) : '';
  if (!(await take(`flag_ip_${hashOf('ip', ip)}`, FLAG_LIMITS.ipPerHour, 3600_000, now))) throw new ApiError(429, 'report_limit', 'Too many reports — try again later.');
  if (dev && !(await take(`flag_dev_${hashOf('dev', dev)}`, FLAG_LIMITS.devPerHour, 3600_000, now))) throw new ApiError(429, 'report_limit', 'Too many reports — try again later.');
  if (!(await take(`flag_day_${new Date(now).toISOString().slice(0, 10).replace(/-/g, '')}`, FLAG_LIMITS.perDay, 86_400_000, now))) throw new ApiError(429, 'report_limit', 'Too many reports today — try again tomorrow.');
  let row = null;
  for (const p of ['week', 'all']) {
    const data = await topRows(b, p, now);
    row = data && data.rows.find(r => r.id === id);
    if (row) break;
  }
  if (!row) throw new ApiError(404, 'no_row', 'That row is no longer on the board.');
  await ref(`flags/${id}`).transaction(cur => {
    const x = cur || { pid: row.pid, n: 0, first: now, why: {}, b: {} };
    x.pid = row.pid;
    x.n = (x.n || 0) + 1;
    x.last = now;
    x.why = { ...(x.why || {}), [why]: ((x.why || {})[why] || 0) + 1 };
    x.b = { ...(x.b || {}), [b]: ((x.b || {})[b] || 0) + 1 };
    return x;
  });
  return { ok: true };
}

export default route(['GET', 'POST'], async (req, res) => {
  if (req.method === 'POST') {
    const body = await readBody(req);
    if (body.action !== 'report') throw new ApiError(400, 'bad_action');
    send(res, 200, await flagRow(body, { ip: clientIp(req) }));
    return;
  }
  const q = Object.fromEntries(new URL(req.url, 'http://x').searchParams);
  // ?active=1: which games are played most (THE BOARD opens on the busiest one)
  if (q.active) { send(res, 200, await activity(), { 'Cache-Control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=600' }); return; }
  send(res, 200, await boardQuery(q), { 'Cache-Control': 'public, max-age=10, s-maxage=20, stale-while-revalidate=60' });
});
