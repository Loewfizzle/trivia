// CITY E — THE NIGHTLY BACKUP (api/_lib/backup.js — docs/backup.md): the pure pieces + THE CLASSIFICATION RULE — every top-level database node
// the server code names is DURABLE (in the backup), LIVE (left out on purpose) or a DAILY SECRET (never off the database): a NEW node fails here
// until its pass decides which.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
// (FIXES R1: the PURE half — api/_lib/backup.js reaches fb.js / firebase-admin, which the cloud's unit job doesn't install; the HTTP door's
//  401 / 404 answers: tests/integration/backup.test.mjs)
import { DURABLE, LIVE, SECRET, tokenVerdict, sliceOf, packPart, unpackPart, partMax, unitsOf, sliceTree, deepMerge, UNIT_DEPTH, UNIT_MAX_RAW } from '../api/_lib/backup-pure.js';

const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.js') ? [path.join(d, e.name)] : []));

test('THE CLASSIFICATION RULE: every top-level node the /api code reads or writes is DURABLE, LIVE or a SECRET — none twice', () => {
  const all = [...DURABLE, ...LIVE, ...SECRET];
  assert.equal(new Set(all).size, all.length, 'a node in two lists');
  const seen = new Set();
  for (const f of walk('api')) {
    const s = fs.readFileSync(f, 'utf8');
    for (const re of [/\b(?:ref|val)\(\s*[`'"]\/?([a-z][a-zA-Z0-9]*)[/`'"]/g, /\[`([a-z][a-zA-Z0-9]*)\/\$\{/g, /^\s*'([a-z][a-zA-Z0-9]*)\/[a-zA-Z${]/gm]) {
      let m; while ((m = re.exec(s))) seen.add(m[1]);
    }
  }
  const IGNORE = new Set(['test', 'prism', 'oc', 'ocm', 'jw', 'hr', 'subs']);   // (emulator-only switches under test* · paths INSIDE rooms/{CODE} (report.js's proof trees) · radio/push/subs)
  const loose = [...seen].filter(n => !all.includes(n) && !IGNORE.has(n) && !n.startsWith('test'));
  assert.deepEqual(loose, [], `nodes nobody classified (api/_lib/backup.js DURABLE / LIVE / SECRET): ${loose.join(', ')}`);
  for (const must of ['profiles', 'pstats', 'uids', 'seats', 'progress', 'lb', 'dly', 'results', 'ppriv', 'pkeys', 'pfr', 'flink', 'tags', 'vault', 'radio', 'city2']) assert.ok(DURABLE.includes(must), `${must} is backed up`);
  for (const out of ['rooms', 'chats', 'seal', 'hole', 'hrec', 'rl']) assert.ok(LIVE.includes(out), `${out} is left out`);
  assert.deepEqual([...SECRET].sort(), ['dsched', 'dsecret'], 'the daily secrets never leave the database');
});

test('the token: constant-time, BACKUP_TOKEN missing → 404 (no door), wrong / empty → 401', () => {
  assert.equal(tokenVerdict('abc', {}), 404);
  assert.equal(tokenVerdict('', { BACKUP_TOKEN: 'x'.repeat(64) }), 401);
  assert.equal(tokenVerdict('y'.repeat(64), { BACKUP_TOKEN: 'x'.repeat(64) }), 401);
  assert.equal(tokenVerdict('x'.repeat(63), { BACKUP_TOKEN: 'x'.repeat(64) }), 401, 'a different length is no shortcut');
  assert.equal(tokenVerdict('x'.repeat(64), { BACKUP_TOKEN: 'x'.repeat(64) }), 0);
});

test('a part round-trips (gzip JSON + its sha256), slices are stable + cover every key once, the part limit stays under Vercel\'s 4.5 MB', () => {
  const v = { a: { n: 'AVA', x: 12 }, b: [1, 2, 3], c: 'ü' };
  const p = packPart(v);
  assert.deepEqual(unpackPart(p.buf), v); assert.match(p.sha, /^[0-9a-f]{64}$/); assert.deepEqual([...p.buf.subarray(0, 2)], [0x1f, 0x8b]);
  const keys = Array.from({ length: 500 }, (_, i) => `p${i}x${(i * 7919) % 1000}`), k = 4;
  const by = keys.map(key => sliceOf(key, k));
  assert.deepEqual(by, keys.map(key => sliceOf(key, k)), 'stable');
  for (let i = 0; i < k; i++) assert.ok(by.filter(x => x === i).length > 60, `slice ${i} gets its share`);
  assert.ok(partMax({}) < 4.5e6 && partMax({ BACKUP_PART_MAX: '20000' }) === 20000);
});

// THE BEFORE-LAUNCH PASS — A6 (review-nov15): THE DEEP SLICES — units at a fixed depth (dly/<game>/<day>/<field> …), a giant branch descended,
// every unit in exactly ONE slice, the partial trees merged back all the way down
test('THE DEEP SLICES: dly sliced below its few big children; every unit in one slice; the deep merge restores the node exactly', () => {
  assert.deepEqual({ ...UNIT_DEPTH }, { dly: 4, lb: 3, backups: 2 });
  const dly = { jaywalk: { d1: { s: { a: 1, b: { x: 2 } }, r: 7 }, d2: { s: { c: 3 } } }, password: { d1: { s: { z: 9 } } } };
  const U = unitsOf('dly', dly);
  assert.deepEqual(U.map(u => u[0].join('/')), ['jaywalk/d1/s/a', 'jaywalk/d1/s/b', 'jaywalk/d1/r', 'jaywalk/d2/s/c', 'password/d1/s/z']);
  for (const k of [2, 3, 7]) {
    const seen = new Map();
    let back = {};
    for (let i = 0; i < k; i++) { const t = sliceTree(U, i, k); if (t) back = deepMerge(back, t); for (const [p] of U) if (sliceOf(p.join('/'), k) === i) seen.set(p.join('/'), (seen.get(p.join('/')) || 0) + 1); }
    assert.ok([...seen.values()].every(n => n === 1) && seen.size === U.length, `k=${k}: every unit in exactly one slice`);
    assert.deepEqual(back, dly, `k=${k}: merged back exactly`);
  }
  // a branch over UNIT_MAX_RAW is descended further (a fat profile node's one child)
  const big = { p1: { blob: 'x'.repeat(UNIT_MAX_RAW + 10), y: 1 }, p2: { n: 1 } };
  assert.deepEqual(unitsOf('profiles', big).map(u => u[0].join('/')), ['p1/blob', 'p1/y', 'p2']);
  // the merge never lets a partial tree overwrite another's branch
  assert.deepEqual(deepMerge({ a: { b: 1 } }, { a: { c: 2 } }), { a: { b: 1, c: 2 } });
});
