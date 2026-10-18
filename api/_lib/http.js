// Request plumbing shared by every /api function. Works on Vercel's Node runtime and on scripts/serve.mjs alike
// (plain node:http request/response objects; Vercel's req.body is used when it is already parsed).
import { fb } from './fb.js';

export class ApiError extends Error {
  constructor(status, code, message, extra = {}) { super(message || code); this.status = status; this.code = code; this.extra = extra; }
}

export async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body || '{}'); } catch { throw new ApiError(400, 'bad_json'); } }
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > 2_000_000) throw new ApiError(413, 'too_large');
    chunks.push(c);
  }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new ApiError(400, 'bad_json'); }
}

export function send(res, status, body, headers = {}) {
  const text = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (!headers['Cache-Control']) res.setHeader('Cache-Control', 'no-store');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(text);
}

/** Verifies the Firebase ID token in "Authorization: Bearer …" and returns the caller's uid. */
export async function requireUser(req) {
  const h = req.headers.authorization || req.headers.Authorization || '';
  const m = /^Bearer\s+(.+)$/i.exec(h);
  if (!m) throw new ApiError(401, 'no_token');
  const { auth } = fb();   // unconfigured → 503, not a token error
  try {
    const t = await auth.verifyIdToken(m[1]);
    return t.uid;
  } catch {
    throw new ApiError(401, 'bad_token');
  }
}

export const clientIp = req => String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();

/** Wraps a handler: JSON errors, method check. */
export function route(methods, fn) {
  return async (req, res) => {
    try {
      if (!methods.includes(req.method)) throw new ApiError(405, 'method');
      await fn(req, res);
    } catch (e) {
      const status = e.status || 500;
      if (status >= 500) console.error('api', e);
      send(res, status, { error: e.code || 'server', message: status >= 500 ? 'server error' : e.message, ...(e.extra || {}) });
    }
  };
}
