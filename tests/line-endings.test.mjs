// LF everywhere, in the working copy too (.gitattributes). THE BOOT BUNDLE hashes raw bytes, so ONE CRLF boot module on the build machine made a
// bundle the cloud's LF checkout called stale (the red "FIRST-VISIT BUNDLE" on JAYWALK B1 + B2's pushes: js/screens/harbor/scene-holiday.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

test('every tracked text file is LF in the index AND the working copy (the fix: delete it + git checkout -- <file>)', () => {
  const out = execFileSync('git', ['ls-files', '--eol'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  const bad = out.split('\n').filter(l => /^i\/(crlf|mixed)|\bw\/(crlf|mixed)/.test(l)).map(l => l.split('\t').pop());
  assert.deepEqual(bad, [], `not LF: ${bad.slice(0, 8).join(', ')}`);
});
