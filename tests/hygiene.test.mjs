// Source hygiene: no stray control characters (a backspace or other control byte that sneaks in through
// shell-escaped edits turns a regex like /\bfoo/ into a different, silently broken one).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SKIP = new Set(['node_modules', '.git', 'audio', 'assets', 'data', 'screenshots']);
function* files(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name) || name.startsWith('shots')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* files(p);
    else if (/\.(m?js|css|html|json|webmanifest)$/.test(name)) yield p;
  }
}

test('no control characters in source files', () => {
  const bad = [];
  for (const f of files(ROOT)) {
    const s = readFileSync(f, 'utf8');
    const m = /[\x00-\x08\x0b\x0c\x0e-\x1f]/.exec(s);
    if (m) bad.push(`${f}:${s.slice(0, m.index).split('\n').length}`);
  }
  assert.deepEqual(bad, []);
});
