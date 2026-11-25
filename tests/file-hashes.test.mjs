// CITY A — item 14, THE PHONE KEEPS ITS FILES: /file-hashes.json (scripts/build-file-hashes.mjs) is CURRENT — every kept file's hash matches
// its bytes. A stale list would make the worker carry an OLD copy into a new build (or download what didn't change). Run the script after any edit.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { render, OUT } from '../scripts/build-file-hashes.mjs';

test('file-hashes.json is current (node scripts/build-file-hashes.mjs after changing any file under js/ css/ assets/ data/)', () => {
  const want = JSON.parse(render()), have = JSON.parse(readFileSync(OUT, 'utf8'));
  const stale = Object.keys(want.files).filter(f => have.files[f] !== want.files[f]), gone = Object.keys(have.files).filter(f => !(f in want.files));
  assert.deepEqual({ stale: stale.slice(0, 10), gone: gone.slice(0, 10) }, { stale: [], gone: [] }, `run: node scripts/build-file-hashes.mjs (${stale.length} stale, ${gone.length} gone)`);
});
test('the worker reads the list + carries unchanged files from the old build (sw.js)', () => {
  const sw = readFileSync('sw.js', 'utf8');
  assert.match(sw, /const HASH_URL = '\/file-hashes\.json',/);
  assert.match(sw, /async function carryUnchanged\(/);
  assert.match(readFileSync('.vercelignore', 'utf8'), /^\/scripts\/\*$/m, 'the generators never ship (THE HOUSEKEEPING PASS: the deploy\'s own step + its imports are in the BUILD only — tests/deploy-build.test.mjs)');
});
