// CITY E — THE NIGHTLY BACKUP on the EMULATORS ONLY (NEVER THE LIVE SITE): the token's door (missing env → 404 · wrong → 401), every part
// exported through the real GET handler (its sha256 header checked), the durable nodes WIPED, restored from the parts → the database IDENTICAL
// (the live nodes + the secrets untouched by both), a part over the limit SPLIT into slices that restore whole, and THE REAL SIZE of a seeded
// big database (SEED=<players>, default 4000 — printed: each part's gz size, the total, 14 nights against the private repo's 500 MB).
//   cd tests/integration && npm run emulators   ·   node --test backup.test.mjs
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
process.env.GCLOUD_PROJECT ||= 'demo-arcade';
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { ref, val, fb } from '../../api/_lib/fb.js';
import { deleteApp } from 'firebase-admin/app';
import adminHandler from '../../api/admin.js';
import { DURABLE, restoreToEmulators } from '../../api/_lib/backup.js';

after(async () => { await deleteApp(fb().app); });
const TOKEN = 'b'.repeat(64);

/** a GET through the REAL handler (api/admin.js) → { status, headers, body } */
async function get(qs, headers = {}) {
  const H = {}; let body = Buffer.alloc(0);
  const res = { statusCode: 200, setHeader: (k, v) => { H[k.toLowerCase()] = v; }, end: b => { if (b) body = Buffer.isBuffer(b) ? b : Buffer.from(String(b)); } };
  await adminHandler({ method: 'GET', url: `/api/admin?${qs}`, headers }, res);
  return { status: res.statusCode, headers: H, body };
}
/** THE FETCHER's loop (what the workflow + the PC script do): the index → every part (a 409 split → its slices), each checked against its header */
async function fetchAll(who = 'gh') {
  const h = { 'x-backup-token': TOKEN, 'x-backup-who': who };
  const idx = JSON.parse((await get('backup=index', h)).body.toString());
  const parts = {};
  let bytes = 0;
  const one = async (qs, name) => {
    const r = await get(qs, h);
    if (r.status === 409) return JSON.parse(r.body.toString()).split;
    assert.equal(r.status, 200, `${name}: ${r.status} ${r.body.toString().slice(0, 80)}`);
    assert.equal(createHash('sha256').update(r.body).digest('hex'), r.headers['x-backup-sha256'], `${name}: its checksum`);
    parts[name] = r.body; bytes += r.body.length;
    return 0;
  };
  for (const node of idx.parts) {
    const k = await one(`backup=${node}`, node);
    for (let i = 0; i < k; i++) await one(`backup=${node}&slice=${i}/${k}`, `${node}@${i}of${k}`);
  }
  const done = await get('backup=done', { ...h, 'x-backup-bytes': String(bytes), 'x-backup-parts': String(Object.keys(parts).length) });
  assert.equal(done.status, 200);
  return { idx, parts, bytes };
}
const snapshot = async nodes => Object.fromEntries(await Promise.all(nodes.map(async n => [n, await val(n)])));

test('THE NIGHTLY BACKUP: the door, export → wipe → restore = identical, a big part split, the live + secret nodes left alone', async () => {
  const keepToken = process.env.BACKUP_TOKEN, keepMax = process.env.BACKUP_PART_MAX;
  try {
    // THE DOOR: no BACKUP_TOKEN in the env → 404 (no door at all); a wrong / missing header → 401
    delete process.env.BACKUP_TOKEN;
    assert.equal((await get('backup=index', { 'x-backup-token': TOKEN })).status, 404);
    process.env.BACKUP_TOKEN = TOKEN;
    assert.equal((await get('backup=index', { 'x-backup-token': 'nope' })).status, 401);
    assert.equal((await get('backup=index', {})).status, 401);
    assert.equal((await get('backup=profiles', { 'x-backup-token': 'c'.repeat(64) })).status, 401);
    assert.equal((await get('backup=rooms', { 'x-backup-token': TOKEN })).status, 404, 'a live node is no part');
    assert.equal((await get('backup=dsecret', { 'x-backup-token': TOKEN })).status, 404, 'the daily secret is no part');
    // a small known world
    await ref().update({
      'profiles/pbk000000001': { n: 'BackAmy', x: 120, a: 'bolt', c: 'cyan', at: 1 }, 'pstats/pbk000000001': { m: 3, g: { prism: { b: 4100 } } },
      'uids/ubk1': 'pbk000000001', 'lb/xp/all/pbk000000001': 120, 'dly/password/d20261115/r/pbk000000001': 4, 'vault/lab/card-x': { m: 'fix', note: 'é ü 🚀', v: 2 },
      'radio/presets/a': { name: 'NIGHT', on: true }, 'city2/settings': { quiet: true }, 'flink/abc': { p: 'pbk000000001', at: 5 },
      'rooms/BKUP/meta': { status: 'lobby' }, 'dsecret/v': 9, 'rl/x': { n: 1 },
    });
    const before = await snapshot(DURABLE), live0 = await val('rooms/BKUP'), sec0 = await val('dsecret');
    const { parts } = await fetchAll('gh');
    assert.equal(Object.keys(parts).length, DURABLE.length, 'one part per durable node (all small)');
    const rec = await val('progress/backup/gh');
    assert.ok(rec && rec.bytes > 0 && rec.parts === DURABLE.length, 'the pickup recorded: progress/backup/gh');
    // WIPE every durable node, RESTORE from the parts → IDENTICAL
    await ref().update(Object.fromEntries(DURABLE.map(n => [n, null])));
    assert.equal(await val('profiles'), null);
    const fresh = await fetchAll('pc').catch(() => null); void fresh;   // (an export of an empty database still works)
    await ref().update(Object.fromEntries(DURABLE.map(n => [n, null])));
    await restoreToEmulators(parts);
    const after0 = await snapshot(DURABLE);
    for (const n of DURABLE) assert.deepEqual(after0[n], before[n], `${n} restored identical`);   // (the pickup record came AFTER its parts: not in this copy)
    assert.deepEqual(await val('rooms/BKUP'), live0, 'a live node: never in the backup, never touched by the restore');
    assert.deepEqual(await val('dsecret'), sec0, 'the daily secret: never in the backup');
    // A PART OVER THE LIMIT IS SPLIT: 300 profiles with a 4 KB limit → 409 { split } → slices → the same profiles back
    await ref('profiles').update(Object.fromEntries(Array.from({ length: 300 }, (_, i) => [`pbs${String(i).padStart(9, '0')}`, { n: `SPLIT${i}`, x: i * 37, a: 'bolt', c: 'cyan', at: i, t: String(1000 + i), m: i % 9, r: i % 5 }])));
    const prof0 = await val('profiles');
    process.env.BACKUP_PART_MAX = '4000';
    const S = await fetchAll('gh');
    const slices = Object.keys(S.parts).filter(k => k.startsWith('profiles@'));
    assert.ok(slices.length >= 2, `profiles split into ${slices.length} slices`);
    for (const k of slices) assert.ok(S.parts[k].length <= 4000, `${k}: ${S.parts[k].length} B under the limit`);
    await ref('profiles').remove();
    await restoreToEmulators(S.parts);
    assert.deepEqual(await val('profiles'), prof0, 'the split part restores whole');
    // THE BEFORE-LAUNCH PASS — A6, THE FAT `dly` (review-nov15): ONE child per daily, each alone past the limit — first-level slices could
    // never fit (3 of 13 were over it, forever). The deep slices: every slice under the limit, the restore identical
    const fatDay = n => Object.fromEntries(Array.from({ length: 60 }, (_, d) => [`d2026${String(1000 + d)}`, { s: Object.fromEntries(Array.from({ length: n }, (_, i) => [`p${i}x${d}`, { v: (i * 7919 + d) % 100000, t: i * 13 + d }])) }]));
    await ref('dly').set({ jaywalk: fatDay(40), password: fatDay(40), coastclear: fatDay(40) });
    const dly0 = await val('dly');
    process.env.BACKUP_PART_MAX = '12000';   // (each child alone ~18 KB gzipped — over the limit: the first-level slices could never fit)
    const D = await fetchAll('gh');
    const dslices = Object.keys(D.parts).filter(k => k.startsWith('dly@'));
    assert.ok(dslices.length >= 3, `dly split into ${dslices.length} slices`);
    for (const k of dslices) assert.ok(D.parts[k].length <= 12000, `${k}: ${D.parts[k].length} B under the limit`);
    await ref('dly').remove();
    await restoreToEmulators(D.parts);
    assert.deepEqual(await val('dly'), dly0, 'the fat dly restores whole (the deep merge)');
    await ref('dly').remove();
  } finally {
    if (keepToken == null) delete process.env.BACKUP_TOKEN; else process.env.BACKUP_TOKEN = keepToken;
    if (keepMax == null) delete process.env.BACKUP_PART_MAX; else process.env.BACKUP_PART_MAX = keepMax;
    await ref().update({ 'rooms/BKUP': null, dsecret: null, 'rl/x': null, 'progress/backup': null });
  }
});

test('THE REAL SIZE: a seeded big database (SEED players, their stats, boards, 30 days of dailies, results) — every part under the limit', async () => {
  const N = Number(process.env.SEED || 4000), up = {};
  const R = (i, k) => ((i * 2654435761 + k * 40503) >>> 0) % 1000;
  for (let i = 0; i < N; i++) {
    const pid = `pz${String(i).padStart(10, '0')}`;
    up[`profiles/${pid}`] = { n: `PLAYER${i}`, nk: `player${i}`, t: String(1000 + (i % 9000)), a: ['bolt', 'crown', 'hex'][i % 3], c: ['cyan', 'magenta', 'yellow'][i % 3], x: R(i, 1) * 40, r: i % 5, at: 1.76e12 + i * 6e4, m: R(i, 2) % 80, l: R(i, 3) % 60, cd: 'card-midnight', bid: `b${pid}` };
    up[`pstats/${pid}`] = { m: R(i, 2) % 80, w: R(i, 4) % 30, g: { prism: { b: R(i, 5) * 10, n: R(i, 6) % 40 }, overclock: { b: R(i, 7), n: R(i, 8) % 40 }, holdem: { w: R(i, 9) % 5 } }, s: { n: R(i, 10) % 30, d: 'd20261115' }, it: { 'card-midnight': 1, 'emb-bolt': 1 }, ach: { first: 1.76e12 } };
    up[`ppriv/${pid}`] = { kh: createHash('sha256').update(pid).digest('hex'), at: 1.76e12, uids: { [`u${i}`]: 1.76e12 } };
    up[`uids/u${i}`] = pid; up[`pkeys/${createHash('sha256').update(pid).digest('hex').slice(0, 40)}`] = pid;
    up[`lb/xp/all/b${pid}`] = R(i, 1) * 40; up[`lb/xp/w20261109/b${pid}`] = R(i, 11) * 3; up[`lb/prism-score/all/b${pid}`] = R(i, 5) * 10;
  }
  for (let d = 0; d < 30; d++) for (const g of ['password', 'coastclear', 'drop']) {
    const day = `d202610${String(d + 1).padStart(2, '0')}`;
    for (let i = 0; i < N; i += 3) { const pid = `pz${String(i).padStart(10, '0')}`; up[`dly/${g}/${day}/s/${pid}`] = 1.76e12 + i; up[`dly/${g}/${day}/r/${pid}`] = R(i, d) % 300; }
  }
  for (let m = 0; m < N * 2; m++) up[`results/R${m}_m${m}`] = { st: 'done', at: 1.76e12 + m, g: 'prism', n: 4, o: { [`pz${String(m % N).padStart(10, '0')}`]: { xp: 40, p: 1 } } };
  const keys = Object.keys(up);
  for (let i = 0; i < keys.length; i += 20000) await ref().update(Object.fromEntries(keys.slice(i, i + 20000).map(k => [k, up[k]])));
  process.env.BACKUP_TOKEN = TOKEN;
  try {
    const t0 = Date.now();
    const { parts, bytes } = await fetchAll('gh');
    const sizes = Object.entries(parts).map(([k, b]) => [k, b.length]).sort((a, b) => b[1] - a[1]);
    const mb = n => `${(n / 1e6).toFixed(2)} MB`;
    console.log(`THE REAL SIZE (${N} players, 30 days × 3 dailies, ${N * 2} results): ${mb(bytes)} gzipped in ${Object.keys(parts).length} parts, ${Date.now() - t0} ms`);
    console.log(`  the biggest: ${sizes.slice(0, 6).map(([k, n]) => `${k} ${mb(n)}`).join(' · ')}`);
    console.log(`  14 nights = ${mb(bytes * 14)} of the private repo's 500 MB artifact storage (${((bytes * 14) / 5e8 * 100).toFixed(1)} %) · per player ≈ ${(bytes / N / 1024).toFixed(2)} KB gz`);
    for (const [k, n] of sizes) assert.ok(n < 4.5e6, `${k}: ${mb(n)} under Vercel's 4.5 MB`);
  } finally {
    delete process.env.BACKUP_TOKEN;
    await ref().update({ profiles: null, pstats: null, ppriv: null, uids: null, pkeys: null, lb: null, dly: null, results: null, 'progress/backup': null });
  }
});
