// FIXES R1 — THE UNIT JOB NEEDS NO INSTALL (THE REVIEW A3): the cloud's unit job runs `node --test tests/*.test.mjs` with NOTHING installed —
// tests/backup.test.mjs + tests/killed-page.test.mjs imported server files that reach api/_lib/fb.js → firebase-admin ("Cannot find package"),
// red on every tagged push since CITY D; a red that is always there stops meaning anything (THE REVIEW: /admin's dead page was in that run).
// The rule: a tests/*.test.mjs unit test never imports — directly or through any file it imports — api/_lib/fb.js, nor any package (only
// node: builtins). A server test goes in tests/integration/ (the emulators, the installed job); a server file's pure half gets its own module
// (api/_lib/backup-pure.js, api/_lib/log-pure.js). This walks every unit file's STATIC import graph (import / export … from — the code that
// runs at load).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FB = resolve(root, 'api/_lib/fb.js');
const BUILTIN = new Set(builtinModules);
const SPEC = /(?:^|[\s;}])(?:import|export)\s+(?:[^'"`;]*?\s+from\s+)?['"]([^'"]+)['"]/g;

const DYN = /\bimport\(\s*['"]([^'"]+)['"]\s*\)(\s*\.catch\()?/g;   // (an import followed by .catch( tolerates the package's absence: skipped)
/** a file's static specifiers (comments stripped first: a path named in a comment is no import) + — for the unit file itself — its literal
 *  `await import('…')`s (they run when the test does) */
function specs(file, dyn = false) {
  const src = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
  const out = []; let m;
  SPEC.lastIndex = 0;
  while ((m = SPEC.exec(src))) out.push(m[1]);
  if (dyn) { DYN.lastIndex = 0; while ((m = DYN.exec(src))) if (!m[2]) out.push(m[1]); }
  return out;
}
/** the chain from a unit file to the first forbidden import, or null */
function reach(start) {
  const seen = new Set(), stack = [[start, [start]]];
  while (stack.length) {
    const [f, path] = stack.pop();
    if (seen.has(f)) continue;
    seen.add(f);
    for (const s of specs(f, f === start)) {
      if (s.startsWith('node:') || BUILTIN.has(s)) continue;
      if (!s.startsWith('.') && !s.startsWith('/')) return [...path, `package "${s}"`];
      if (/^https?:/.test(s)) continue;
      const t = resolve(dirname(f), s);
      if (t === FB) return [...path, t];
      if (existsSync(t) && /\.(m?js)$/.test(t)) stack.push([t, [...path, t]]);
    }
  }
  return null;
}

test('no tests/*.test.mjs unit file reaches api/_lib/fb.js or a package (the cloud\'s unit job installs nothing)', () => {
  const units = readdirSync(join(root, 'tests')).filter(n => n.endsWith('.test.mjs')).map(n => join(root, 'tests', n));
  assert.ok(units.length > 100, `${units.length} unit files`);
  const bad = units.map(reach).filter(Boolean).map(chain => chain.map(p => (p.startsWith('package') ? p : relative(root, p).split('\\').join('/'))).join(' → '));
  assert.deepEqual(bad, [], 'a unit test that needs firebase-admin (or another package) — move its server half to tests/integration/ or its pure half to a module of its own');
});

test('the walker sees it: the server files themselves DO reach fb.js (a guard that could never fail proves nothing)', () => {
  assert.ok(reach(resolve(root, 'api/_lib/backup.js')), 'backup.js → fb.js');
  assert.ok(reach(resolve(root, 'api/log.js')), 'log.js → fb.js');
  assert.equal(reach(resolve(root, 'api/_lib/backup-pure.js')), null);
  assert.equal(reach(resolve(root, 'api/_lib/log-pure.js')), null);
});
