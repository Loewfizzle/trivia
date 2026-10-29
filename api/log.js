// POST /api/log { p: 'app'|'board', e: [{ m, s, l, c, k, w, t }] } — errors from players' phones (js/errlog.js).
// (9e: { p: 'report', r: { kind, text } } — a SEND REPORT / hang-watch snapshot, see logReport below)
// No sign-in (sendBeacon can't carry a token), so it is careful instead:
//   · small bodies only, at most 10 errors per request, every field clipped;
//   · the same error from many phones becomes ONE entry with a count: errlog/{sig} { m, s, l, c, k, w, n, first, last,
//     ua, v, d: { device: n }, b: { browser: n }, p } — the log can't grow with traffic, only with distinct errors;
//   · rate limits: 40 errors an hour per IP, 3000 a day in all (beyond that they're dropped, quietly);
//   · no ids, names or room codes are stored; the IP only as a salted hash inside the rate-limit bucket.
// Read and cleared on /admin (api/admin.js: errors, clearErrors). Entries untouched for 30 days are pruned there.
import { createHash } from 'node:crypto';
import { route, send, readBody, clientIp } from './_lib/http.js';
import { ref, fb } from './_lib/fb.js';

export const LOG_LIMITS = { perRequest: 10, ipPerHour: 40, perDay: 3000, maxBody: 32_000 };
// 9e — SEND REPORT (the &debug=1 strip's button) + THE HANG WATCH (a worker that reports when the page's main thread stops answering —
// js/hangwatch.js): POST /api/log { p: 'report', r: { kind: 'tap' | 'hang' | 'stall', text } } → phonelog/{push} { at, kind, text, ua, d,
// b, v } — plain text the owner reads (+ screenshots) on /admin. 8 an hour per IP, 120 a day in all, the newest 40 kept.
export const REPORT_LIMITS = { ipPerHour: 8, perDay: 120, keep: 40, text: 24_000 };
const REPORT_KINDS = ['tap', 'hang', 'stall', 'bench'];   // (C4c: 'bench' — THE PHONE BENCH's report, &bench=1)

/** PURE: a report body → { kind, text } to store, or null */
export function cleanReport(r) {
  if (!r || typeof r !== 'object' || typeof r.text !== 'string' || !r.text.trim()) return null;
  return { kind: REPORT_KINDS.includes(r.kind) ? r.kind : 'tap', text: r.text.slice(0, REPORT_LIMITS.text) };
}

/** Stores one report (rate-limited). Returns 1 when kept, 0 when dropped. */
export async function logReport(body, { ip = '', ua = '', now = Date.now() } = {}) {
  const r = cleanReport(body && body.r);
  if (!r) return 0;
  let n = await take(`rep_ip_${ipKey(ip)}`, 1, REPORT_LIMITS.ipPerHour, 3600_000, now);
  if (n) n = await take(`rep_day_${dayKey(now)}`, 1, REPORT_LIMITS.perDay, 86_400_000, now);
  if (!n) return 0;
  const { d, b } = deviceOf(ua);
  await ref('phonelog').push({ at: now, kind: r.kind, text: r.text, ua: str(ua, 220), d, b, v: str(process.env.VERCEL_GIT_COMMIT_SHA, 7) || 'local' });
  return 1;
}

const str = (x, n) => String(x == null ? '' : x).slice(0, n);

/** PURE: which device and browser a user agent is (coarse, for counting). */
export function deviceOf(ua = '') {
  const d = /iPad/.test(ua) || (/Macintosh/.test(ua) && /Mobile\//.test(ua)) ? 'iPad' : /iPhone|iPod/.test(ua) ? 'iPhone' : /Android/.test(ua) ? 'Android'
    : /Macintosh|Mac OS X/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : /CrOS/.test(ua) ? 'ChromeOS' : /Linux/.test(ua) ? 'Linux' : 'Other';
  const b = /FBAN|FBAV|Instagram|Snapchat|Line\/|TikTok|musical_ly|GSA\//.test(ua) ? 'In-app' : /EdgA?\//.test(ua) ? 'Edge' : /SamsungBrowser/.test(ua) ? 'Samsung'
    : /CriOS|Chrome\//.test(ua) ? 'Chrome' : /FxiOS|Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Other';
  return { d, b };
}

/** PURE: the id two reports of the same error share. Long numbers are folded so "id 48213" and "id 99120" group. */
export function errorSig(e) {
  const m = str(e.m, 300).replace(/\d{3,}/g, 'N');
  return 'e' + createHash('sha1').update(`${m}|${str(e.s, 120)}|${Number(e.l) || 0}`).digest('hex').slice(0, 15);
}

/** PURE: one reported item, cleaned (null when it's not a usable report). */
export function cleanItem(x) {
  if (!x || typeof x !== 'object' || !x.m) return null;
  return { m: str(x.m, 300), s: str(x.s, 120), l: Math.max(0, Math.min(1e7, Number(x.l) || 0)), c: Math.max(0, Math.min(1e7, Number(x.c) || 0)), k: str(x.k, 700), w: str(x.w, 60) };
}

const dayKey = now => new Date(now).toISOString().slice(0, 10).replace(/-/g, '');
const ipKey = ip => createHash('sha256').update(`neon-log:${fb().pepper}:${ip}`).digest('hex').slice(0, 20);

async function take(bucket, n, max, windowMs, now) {
  let granted = 0;
  const r = await ref(`rl/${bucket}`).transaction(cur => {
    const x = cur && now - cur.t < windowMs ? cur : { n: 0, t: now };
    granted = Math.max(0, Math.min(n, max - x.n));
    if (!granted) return undefined;
    return { n: x.n + granted, t: x.t };
  });
  return r.committed ? granted : 0;
}

/** Stores a batch of reports. Returns how many were kept. */
export async function logErrors(body, { ip = '', ua = '', now = Date.now() } = {}) {
  const items = (Array.isArray(body && body.e) ? body.e : []).slice(0, LOG_LIMITS.perRequest).map(cleanItem).filter(Boolean);
  if (!items.length) return 0;
  let n = await take(`log_ip_${ipKey(ip)}`, items.length, LOG_LIMITS.ipPerHour, 3600_000, now);
  if (n) n = await take(`log_day_${dayKey(now)}`, n, LOG_LIMITS.perDay, 86_400_000, now);
  if (!n) return 0;
  const { d, b } = deviceOf(ua);
  const p = body.p === 'board' ? 'board' : 'app';
  const v = str(process.env.VERCEL_GIT_COMMIT_SHA, 7) || 'local';
  await Promise.all(items.slice(0, n).map(e => ref(`errlog/${errorSig(e)}`).transaction(cur => {
    const x = cur || { m: e.m, s: e.s, l: e.l, c: e.c, n: 0, first: now, d: {}, b: {} };
    x.n = (x.n || 0) + 1;
    x.last = now;
    x.k = e.k || x.k || '';
    x.w = e.w || x.w || '';
    x.ua = str(ua, 220);
    x.v = v;
    x.p = p;
    x.d = { ...(x.d || {}), [d]: ((x.d || {})[d] || 0) + 1 };
    x.b = { ...(x.b || {}), [b]: ((x.b || {})[b] || 0) + 1 };
    return x;
  })));
  return n;
}

export default route(['POST', 'GET'], async (req, res) => {
  // (HOTFIX Oct 29: GET = THE BUILD ID — the deployed commit, for City 2.0's &debug=1 readout's first line; nothing stored, nothing read)
  if (req.method === 'GET') { send(res, 200, { v: str(process.env.VERCEL_GIT_COMMIT_SHA, 7) || 'local' }, { 'Cache-Control': 'public, max-age=0, s-maxage=60' }); return; }
  if (Number(req.headers['content-length'] || 0) > LOG_LIMITS.maxBody) { send(res, 413, { error: 'too_large' }); return; }
  const body = await readBody(req);
  const meta = { ip: clientIp(req), ua: String(req.headers['user-agent'] || ''), now: Date.now() };
  const kept = body && body.p === 'report' ? await logReport(body, meta) : await logErrors(body, meta);
  send(res, 200, { kept });
});
