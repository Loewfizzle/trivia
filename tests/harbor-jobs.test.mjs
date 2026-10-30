// THE HARBOR'S CLOUD JOBS (section 0 m): every e2e-harbor group runs in exactly one GitHub job, and the workflow's matrix lists exactly
// the jobs in tests/integration/harbor-jobs.mjs — so a new group (or job) can never be skipped by the cloud suite silently. Runs in the
// quick `tests` workflow on every push, long before the full harbor suite does.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { CI_JOBS, SERIAL, SECONDS, jobProblems, localShards } from './integration/harbor-jobs.mjs';

const root = new URL('../', import.meta.url);
// (NIGHT-B Group 0: the suite is e2e-harbor.mjs — the entry + the runner — + harbor-e2e/kit.mjs + one file per cloud job)
const dir = new URL('tests/integration/harbor-e2e/', root);
const suite = [readFileSync(new URL('tests/integration/e2e-harbor.mjs', root), 'utf8'),
  ...readdirSync(dir).filter(f => f.endsWith('.mjs')).sort().map(f => readFileSync(new URL(f, dir), 'utf8'))].join('\n');
const groups = [...new Set([...suite.matchAll(/^G\('([\w-]+)'/gm)].map(m => m[1]))];

test('every e2e-harbor group is in exactly one cloud job (add a new group to the lightest job in harbor-jobs.mjs)', () => {
  assert.ok(groups.length >= 10, `found ${groups.length} groups in e2e-harbor.mjs + harbor-e2e/`);
  assert.deepEqual(jobProblems(groups), []);
});

test('the serial groups (panel, perf) run last in their job; every job is under ~5 min of tests', () => {
  for (const [job, list] of Object.entries(CI_JOBS)) {
    const s = list.reduce((a, g) => a + (SECONDS[g] || 30), 0);
    assert.ok(s < 300, `job ${job}: ${s} s of measured tests — split it`);
  }
  assert.ok(SERIAL.every(g => Object.values(CI_JOBS).flat().includes(g)));
  // (a broken order is reported)
  assert.equal(jobProblems(['a', 'panel', 'b'], { x: ['a', 'panel', 'b'] }).length, 1);
  assert.equal(jobProblems(['a', 'b'], { x: ['a'] }).length, 1);
  assert.equal(jobProblems(['a'], { x: ['a'], y: ['a'] }).length, 1);
});

test("harbor.yml's matrix lists exactly the cloud jobs", () => {
  const yml = readFileSync(new URL('.github/workflows/harbor.yml', root), 'utf8');
  const m = /\|\|\s*'(\[[^\]]*\])'\s*\)\s*\}\}/.exec(yml);
  assert.ok(m, `harbor.yml's matrix: job: \${{ fromJSON(… || '["audio",…]') }}`);
  assert.deepEqual(JSON.parse(m[1]).sort(), Object.keys(CI_JOBS).sort());
  const opts = /options:\s*\[([^\]]*)\]/.exec(yml);
  assert.ok(opts, 'the Run workflow choice lists the jobs');
  assert.deepEqual(opts[1].split(',').map(x => x.trim()).filter(x => x !== 'all').sort(), Object.keys(CI_JOBS).sort());
});

test('the laptop shards cover every non-serial group once', () => {
  for (const n of [2, 3]) {
    const flat = localShards(groups, n).flat();
    assert.deepEqual([...flat].sort(), groups.filter(g => !SERIAL.includes(g)).sort());
  }
});
