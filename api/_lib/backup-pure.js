// CITY E — THE NIGHTLY BACKUP's PURE half (FIXES R1 — THE REVIEW A3: a tests/*.test.mjs unit test never imports a file that reaches
// api/_lib/fb.js — firebase-admin isn't installed in the cloud's unit job, so tests/backup.test.mjs failed there on every run since CITY E).
// The lists, the token's verdict, the slices + the packing; api/_lib/backup.js (the database half) re-exports every one of them.
import { createHash, timingSafeEqual } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';

/** every node a restore needs — the players' progress, their keys, the boards, the dailies' results, the Lab, the radio, the city */
export const DURABLE = Object.freeze(['profiles', 'pstats', 'uids', 'seats', 'progress', 'lb', 'dly', 'results', 'ppriv', 'pkeys', 'pfr', 'flink', 'tags',
  'vault', 'radio', 'city2', 'members', 'gifts', 'streak', 'gplay', 'pcount', 'pkc', 'pkx', 'audit', 'flags', 'logstats', 'errlog', 'phonelog', 'backups',
  'nocount', 'ffheld']);   // (CITY I — DON'T COUNT: the owner's decisions — no address in it · FREEFALL GO-LIVE: THE HELD LIST — api/_lib/held.js)
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
/**
 * THE BEFORE-LAUNCH PASS — THE DEEP SLICES (review-nov15 A6: `dly` has one child per daily — a child alone past the 4.5 MB answer limit could
 * never be sliced by its first-level key, and the backup would fail every night from then on). A slice is now made of UNITS: the node's
 * branches at a FIXED depth (UNIT_DEPTH — `dly/<game>/<day>/<field>`, `lb/<board>/<scope>`, `backups/<stamp>`; 1 for the rest), a branch
 * still over UNIT_MAX_RAW descended further — each unit to slice fnv(its path) % k: the same units on every request (the database is live),
 * a slice = a partial tree, the restore a DEEP merge (deepMerge). The fetchers' protocol is unchanged (?backup=<node>&slice=i/k).
 */
export const UNIT_DEPTH = Object.freeze({ dly: 4, lb: 3, backups: 2 });
export const UNIT_MAX_RAW = 512 * 1024;
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
/** a node's value → its units [[path[], value]] (PURE) */
export function unitsOf(node, v, depth = UNIT_DEPTH[node] || 1) {
  const out = [];
  const walk = (val, path) => {
    const deep = path.length < depth || (isObj(val) && Buffer.byteLength(JSON.stringify(val)) > UNIT_MAX_RAW);
    if (path.length && (!isObj(val) || !deep || !Object.keys(val).length)) { out.push([path, val]); return; }
    if (!isObj(val)) { out.push([path, val]); return; }
    for (const k of Object.keys(val)) walk(val[k], [...path, k]);
  };
  walk(v, []);
  return out;
}
/** slice i of k: the units whose path hashes to i, as ONE partial tree (PURE) — null when none */
export function sliceTree(units, i, k) {
  let out = null;
  for (const [path, val] of units) {
    if (sliceOf(path.join('/'), k) !== i) continue;
    if (!path.length) return val;
    out = out || {};
    let o = out;
    for (let d = 0; d < path.length - 1; d++) o = o[path[d]] = isObj(o[path[d]]) ? o[path[d]] : {};
    o[path[path.length - 1]] = val;
  }
  return out;
}
/** the restore's merge: b's branches into a, all the way down (PURE — a slice's partial tree never overwrites another's branch) */
export function deepMerge(a, b) {
  if (!isObj(a) || !isObj(b)) return b === undefined ? a : b;
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = k in out ? deepMerge(out[k], v) : v;
  return out;
}
/** a value → its gzipped JSON part (PURE) → { buf, sha, raw } */
export function packPart(value) {
  const raw = Buffer.from(JSON.stringify(value === undefined ? null : value));
  const buf = gzipSync(raw, { level: 9 });
  return { buf, sha: sha(buf), raw: raw.length };
}
/** a part's bytes → its value (the restore; PURE) */
export const unpackPart = buf => JSON.parse(gunzipSync(buf).toString('utf8'));

