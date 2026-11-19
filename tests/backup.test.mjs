// CITY E — THE NIGHTLY BACKUP (api/_lib/backup.js — docs/backup.md): the pure pieces + THE CLASSIFICATION RULE — every top-level database node
// the server code names is DURABLE (in the backup), LIVE (left out on purpose) or a DAILY SECRET (never off the database): a NEW node fails here
// until its pass decides which.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
// (FIXES R1: the PURE half — api/_lib/backup.js reaches fb.js / firebase-admin, which the cloud's unit job doesn't install; the HTTP door's
//  401 / 404 answers: tests/integration/backup.test.mjs)
import { DURABLE, LIVE, SECRET, tokenVerdict, sliceOf, packPart, unpackPart, partMax } from '../api/_lib/backup-pure.js';

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
