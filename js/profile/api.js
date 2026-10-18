// The /api client. Every call is optional polish: a server that is down, slow or not deployed never blocks a game.
//   api('profile', { action: 'me' })  → JSON (throws ApiFail with .status / .code; status 0 = unreachable)
//   board(b, p, start)                → GET /api/board (public, cached here for a few seconds too)
import { idToken, firebaseReady } from '../firebase.js';

export class ApiFail extends Error {
  constructor(status, code, message, body = {}) { super(message || code); this.status = status; this.code = code; this.body = body; }
}

const TIMEOUT = 9000;

async function fetchJson(url, opts = {}) {
  const ctl = typeof AbortController === 'function' ? new AbortController() : null;
  const t = ctl ? setTimeout(() => ctl.abort(), opts.timeout || TIMEOUT) : 0;
  let res;
  try {
    res = await fetch(url, { ...opts, signal: ctl ? ctl.signal : undefined });
  } catch (e) {
    throw new ApiFail(0, 'offline', 'Couldn’t reach the server.');
  } finally { clearTimeout(t); }
  let body = null;
  try { body = await res.json(); } catch { body = null; }
  if (!res.ok || !body) throw new ApiFail(body ? res.status : (res.status === 404 ? 0 : res.status), (body && body.error) || 'http', (body && body.message) || `HTTP ${res.status}`, body || {});
  return body;
}

/** Authenticated POST to /api/<name>. */
export async function api(name, body) {
  await firebaseReady;
  const token = await idToken();
  return fetchJson(`/api/${name}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify(body || {}),
  });
}

const cache = new Map();
const BOARD_CACHE_MS = 12_000;

/** A board's rows (top 100, or a page): { b, p, key, rows: [{ rank, pid, n, t, a, c, r, v }], more, ends }. */
export async function board(b, p = 'week', { start = 0, n = 100, fresh = false } = {}) {
  const key = `${b}|${p}|${start}|${n}`;
  const hit = cache.get(key);
  if (!fresh && hit && Date.now() - hit.at < BOARD_CACHE_MS) return hit.data;
  const q = new URLSearchParams({ b, p });
  if (start) q.set('start', String(start));
  if (n !== 100) q.set('n', String(n));
  const data = await fetchJson(`/api/board?${q}`, { timeout: 7000 });
  cache.set(key, { at: Date.now(), data });
  return data;
}

export const clearBoardCache = () => cache.clear();
