// FIXES R1 — EVERY SHIPPED FILE PARSES (THE REVIEW A1): CITY E's js/admin/admin.js declared `async function backups()` twice — a module may not
// declare one name twice, so the whole file failed to parse and /admin hung on "Signing in…" (nothing local opened /admin; the cloud's red
// was not read). This walks every shipped .js (js/, api/, sw.js — git's list) and PARSES each one, as `node --check` would, in ONE child process
// (vm.SourceTextModule = the module grammar + its early errors: a duplicate declaration, a stray await, a bad import / export) — seconds, not
// one process a file. sw.js is a classic script (vm.Script). The page-level twin (the pages really load in Chromium + WebKit) is
// tests/integration/kit/page-loads.mjs, run first by the smoke test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const files = execFileSync('git', ['ls-files', '-z', '--', 'js/*.js', 'api/*.js', 'sw.js'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);

const CHILD = `
const vm = require('node:vm'), fs = require('node:fs'), path = require('node:path');
const files = JSON.parse(fs.readFileSync(0, 'utf8')), bad = [];
for (const f of files) {
  const src = fs.readFileSync(path.join(process.cwd(), f), 'utf8');
  try { f === 'sw.js' ? new vm.Script(src, { filename: f }) : new vm.SourceTextModule(src, { identifier: f }); }
  catch (e) { bad.push(f + ': ' + e.message); }
}
process.stdout.write(JSON.stringify(bad));
`;

test('every shipped js/ · api/ · sw.js file parses (a duplicate declaration = /admin dead)', () => {
  assert.ok(files.length > 500, `git listed ${files.length} files`);
  const out = execFileSync(process.execPath, ['--experimental-vm-modules', '--no-warnings', '--input-type=commonjs', '-e', CHILD], { cwd: root, input: JSON.stringify(files), encoding: 'utf8', maxBuffer: 1 << 24 });
  assert.deepEqual(JSON.parse(out), [], 'files that do not parse');
});

test('the checker catches the CITY E bug (two top-level functions of one name)', () => {
  const out = execFileSync(process.execPath, ['--experimental-vm-modules', '--no-warnings', '-e',
    "const vm=require('node:vm');try{new vm.SourceTextModule('async function a(){}\\nasync function a(){}\\nexport {}');console.log('parsed')}catch(e){console.log('refused')}"], { encoding: 'utf8' });
  assert.equal(out.trim(), 'refused');
});
