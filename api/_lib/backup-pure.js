// CITY E — THE NIGHTLY BACKUP's PURE half (FIXES R1 — THE REVIEW A3: a tests/*.test.mjs unit test never imports a file that reaches
// api/_lib/fb.js — firebase-admin isn't installed in the cloud's unit job, so tests/backup.test.mjs failed there on every run since CITY E).
// The lists, the token's verdict, the slices + the packing; api/_lib/backup.js (the database half) re-exports every one of them.
import { createHash, timingSafeEqual } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';

/** every node a restore needs — the players' progress, their keys, the boards, the dailies' results, the Lab, the radio, the city */
export const DURABLE = Object.freeze(['profiles', 'pstats', 'uids', 'seats', 'progress', 'lb', 'dly', 'results', 'ppriv', 'pkeys', 'pfr', 'flink', 'tags',
  'vault', 'radio', 'city2', 'members', 'gifts', 'streak', 'gplay', 'pcount', 'pkc', 'pkx', 'audit', 'flags', 'logstats', 'errlog', 'phonelog', 'backups',
  'nocount']);   // (CITY I — DON'T COUNT: the owner's decisions — no address in it)
/** left out — live / ephemeral (a room's nodes, presence, the rate limits, caches, a passkey's one-time challenge, the 7-day share pictures) */
export const LIVE = Object.freeze(['rooms', 'hush', 'chats', 'fleets', 'glsonar', 'spy', 'hsbet', 'rrp', 'rrsec', 'seal', 'hole', 'hrec', 'rl', 'here', 'wx',
  'pkch', 'shr', 'shrx', 'shrp', 'testAdmins', 'testReportAll', 'testHoldemGate', 'testHostTrustOff',
  'seen']);   // (CITY I — SECOND ACCOUNTS: hashed addresses, 14 days — LIVE, never DURABLE with addresses)
/** left out ON PURPOSE — THE DAILY SECRET + THE FROZEN SCHEDULE (future answers): only in the database (tests/daily-secrets.test.mjs) */
export const SECRET = Object.freeze(['dsecret', 'dsched']);
/** the biggest gzipped part an answer may carry (Vercel answers at most 4.5 MB) — BACKUP_PART_MAX lowers it (the tests) */
export const partMax = (env = process.env) => Math.max(1024, Number(env.BACKUP_PART_MAX) || 4_200_000);
export const WHO = Object.freeze(['gh', 'pc']);

/** the token's verdict (constant time; PURE) → 0 = the right token · 404 = no BACKUP_TOKEN in the env (no backup door at all) · 401 = wrong */
export function tokenVerdict(given, env = process.env) {
  const want = String(env.BACKUP_TOKEN || '');
  if (!want) return 404;
  const a = createHash('sha256').update(String(given || '')).digest(), b = createHash('sha256').update(want).digest();
  return !given || !timingSafeEqual(a, b) ? 401 : 0;
}

/** fnv1a over a key → a stable slice index (PURE) */
export function sliceOf(key, k) {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h % k;
}
const sha = buf => createHash('sha256').update(buf).digest('hex');
/** a value → its gzipped JSON part (PURE) → { buf, sha, raw } */
export function packPart(value) {
  const raw = Buffer.from(JSON.stringify(value === undefined ? null : value));
  const buf = gzipSync(raw, { level: 9 });
  return { buf, sha: sha(buf), raw: raw.length };
}
/** a part's bytes → its value (the restore; PURE) */
export const unpackPart = buf => JSON.parse(gunzipSync(buf).toString('utf8'));

