// CITY E — THE NIGHTLY BACKUP (the owner, Nov 15: the players' progress lives only in Firebase, on the free Spark plan — a private GitHub repo
// (the main copy, off-site) + the mini PC (the second copy), 14 days each; never in the public repo; the service account stays in Vercel).
// THE EXPORT, inside api/admin.js (no new function): GET /api/admin?backup=<part> with the header x-backup-token = env BACKUP_TOKEN (a BACKUP-ONLY
// token — never the owner's login, never the service account), compared in constant time; no BACKUP_TOKEN in the env → 404 (the door isn't there).
//   ?backup=index            → { v, at, parts: [node…], left: { live: [...], secret: [...] } }   (plain JSON — the list to fetch)
//   ?backup=<node>           → that node as GZIPPED JSON (application/gzip) + x-backup-sha256 (the gz body's sha256 — the fetcher checks it) +
//                              x-backup-bytes; a node whose gz is over PART_MAX answers 409 { split: k } → fetch ?backup=<node>&slice=i/k (i < k):
//                              its children by a stable hash of their key (fnv1a % k) — every slice under Vercel's 4.5 MB answer limit
//   ?backup=done             → records progress/backup/{who} = { at, bytes, parts } (who = x-backup-who: gh | pc) — /admin's BACKUPS row
// Every DURABLE node is in it; left out: the LIVE ones (a room's, presence, rate limits, caches, the share cards' 7-day pictures) and the two
// DAILY SECRETS (dsecret + dsched — the key + the frozen schedule that make FUTURE days' answers: they stay ONLY in the database; a restore
// without them = /admin → RESEED). docs/backup.md has the list, the restore steps and what to do if the token leaks.
// THE CHECKSUMS: each part's sha256 travels WITH that part (its header) — the database is live, so an index computed first would not match parts
// read seconds later; the fetcher checks every part against its own header and writes the folder's checksums.sha256 for the restore's check.
import { ref, val, emulated } from './fb.js';
import { ApiError } from './http.js';

// (FIXES R1: the lists, the token's verdict, the slices + the packing live in ./backup-pure.js — the unit tests import that, never this file)
export { DURABLE, LIVE, SECRET, partMax, WHO, tokenVerdict, sliceOf, packPart, unpackPart } from './backup-pure.js';
import { DURABLE, LIVE, SECRET, partMax, WHO, tokenVerdict, sliceOf, packPart, unpackPart } from './backup-pure.js';
/** the token check (constant time; the env's token missing → 404: no backup door at all) */
export function checkToken(given, env = process.env) {
  const v = tokenVerdict(given, env);
  if (v === 404) throw new ApiError(404, 'not_found');
  if (v) throw new ApiError(401, 'bad_token');
}

/** ONE part: the node (or its slice i/k) → { buf, sha } | { split: k } when the whole node is over the limit */
export async function exportPart(node, slice = null, env = process.env) {
  if (!DURABLE.includes(node)) throw new ApiError(404, 'no_part');
  const v = await val(node);
  if (slice) {
    const [i, k] = slice;
    const sub = v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).filter(([key]) => sliceOf(key, k) === i)) : (i === 0 ? v : null);
    return { ...packPart(sub), slice: [i, k] };
  }
  const p = packPart(v);
  if (p.buf.length > partMax(env) && v && typeof v === 'object') return { split: Math.min(64, Math.ceil(p.buf.length / (partMax(env) * 0.5))) };   // (half the limit a slice: a slice compresses a little worse than the whole)
  return p;
}

/** the GET door (api/admin.js) */
export async function backupGet(req, res, now = Date.now(), env = process.env) {
  const q = new URL(req.url || '/', 'http://x').searchParams;
  const hd = k => req.headers[k] || req.headers[k.toLowerCase()] || '';
  checkToken(hd('x-backup-token'), env);
  const part = String(q.get('backup') || '');
  const json = (status, body) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(body)); };
  if (part === 'index') return json(200, { v: 1, at: now, parts: [...DURABLE], left: { live: [...LIVE], secret: [...SECRET] }, max: partMax(env) });
  if (part === 'done') {
    const who = String(hd('x-backup-who') || '');
    if (!WHO.includes(who)) throw new ApiError(400, 'bad_who');
    const bytes = Math.max(0, Math.min(1e10, Number(hd('x-backup-bytes')) || 0)), parts = Math.max(0, Math.min(1000, Number(hd('x-backup-parts')) || 0));
    await ref(`progress/backup/${who}`).set({ at: now, bytes, parts });
    return json(200, { ok: true, who, at: now });
  }
  let slice = null;
  if (q.get('slice')) {
    const m = /^(\d{1,2})\/(\d{1,2})$/.exec(q.get('slice'));
    if (!m || +m[2] < 2 || +m[1] >= +m[2]) throw new ApiError(400, 'bad_slice');
    slice = [+m[1], +m[2]];
  }
  const out = await exportPart(part, slice, env);
  if (out.split) return json(409, { split: out.split, part });
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/gzip');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('x-backup-sha256', out.sha);
  res.setHeader('x-backup-bytes', String(out.buf.length));
  res.setHeader('x-backup-part', slice ? `${part}@${slice[0]}of${slice[1]}` : part);
  res.end(out.buf);
}

/** THE RESTORE — the EMULATORS ONLY (the live database is the owner's Firebase-console Import, never automated): parts { name: Buffer } where
 *  name = <node> or <node>@<i>of<k> → each node written back whole (its slices merged) */
export async function restoreToEmulators(parts) {
  if (!emulated()) throw new Error('restoreToEmulators: the EMULATORS only — the live database is restored by hand (docs/backup.md)');
  const nodes = {};
  for (const [name, buf] of Object.entries(parts)) {
    const [node] = name.split('@');
    if (!DURABLE.includes(node)) continue;
    const v = unpackPart(buf);
    if (name.includes('@')) nodes[node] = { ...(nodes[node] || {}), ...(v || {}) };
    else nodes[node] = v;
  }
  for (const [node, v] of Object.entries(nodes)) await ref(node).set(v && (typeof v !== 'object' || Object.keys(v).length) ? v : null);
  return Object.keys(nodes);
}
