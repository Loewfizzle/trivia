// THE HOUSEKEEPING PASS (Nov 25) — THE DEPLOY BUILD (docs/harbor.md "THE FIRST-VISIT BUNDLE" → "BUILT AT DEPLOY"; scripts/deploy-build.mjs):
// the ONE narrow exception to "no build step" — /boot-bundle.json is never committed; Vercel's buildCommand generates it together with the
// page's ?v= and THE CARRY's row for it, checked against each other (a mismatch = the deploy fails). These pin the rule:
//   · the bundle is NOT tracked + ignored; the committed page names it with no ?v=; the committed list has no row for it
//   · vercel.json runs the step; .vercelignore keeps exactly the step's own import graph in the build (and nothing else of scripts/)
//   · deployFiles() = three files that agree (checkDeploy: none wrong); every way they can disagree is caught
//   · the local server answers the same three from memory (never written to the working tree)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { deployFiles, checkDeploy, HTML } from '../scripts/deploy-build.mjs';
import { bundleList, htmlV, BUNDLE_FILE } from '../scripts/build-boot-bundle.mjs';
import { hashOf, withFile, BUNDLE_PATH, OUT } from '../scripts/build-file-hashes.mjs';

const at = p => new URL(`../${p}`, import.meta.url);
const read = p => readFileSync(at(p), 'utf8');
const LIST = bundleList();
const FILES = deployFiles(read(HTML), read(OUT), LIST);

test('the bundle is NEVER committed: not tracked, ignored by git, the committed page + list carry nothing of it', () => {
  assert.equal(execSync(`git ls-files ${BUNDLE_FILE}`, { encoding: 'utf8' }).trim(), '', `${BUNDLE_FILE} is not tracked`);
  assert.equal(execSync(`git check-ignore ${BUNDLE_FILE}`, { encoding: 'utf8' }).trim(), BUNDLE_FILE, 'ignored (a local copy to look at never lands in a commit)');
  assert.equal(htmlV(read(HTML)), null, 'the committed index.html asks for boot-bundle.json with NO ?v= (the deploy stamps it)');
  assert.match(read(HTML), /fetch\('boot-bundle\.json', ab \? \{ signal: ab\.signal \} : undefined\)/);
  assert.ok(!(BUNDLE_PATH in JSON.parse(read(OUT)).files), 'the committed file-hashes.json has no row for it (the deploy adds it)');
});

test('vercel.json runs THE DEPLOY BUILD; the deploy tags rule + the root as the output are unchanged', () => {
  const v = JSON.parse(read('vercel.json'));
  assert.equal(v.buildCommand, 'node scripts/deploy-build.mjs --prune');
  assert.match(v.ignoreCommand, /\\\[\(harbor\|ci\|deploy\)\\\]/, 'only tagged pushes deploy');
  // (THE FIRST REAL DEPLOY, Nov 25 — 53e3b6d8 FAILED in ~13 s and shipped nothing: with a build command Vercel no longer falls back to the
  //  repo root — it wants its output folder NAMED; "." = the root, as it always was)
  assert.equal(v.outputDirectory, '.', 'the output is NAMED: the repo root (a build command alone makes Vercel look for public/)');
  assert.ok(!('framework' in v) && !('installCommand' in v), 'the preset + the install for /api unchanged');
  assert.ok(!existsSync(at('public')), 'no public/ folder (Vercel would serve IT instead of the root)');
  assert.ok(!('rewrites' in v), 'still no rewrites (THE WRONG DOOR)');
  const pkg = JSON.parse(read('package.json'));
  assert.ok(!pkg.scripts.build && !pkg.scripts['vercel-build'], 'ONE build entry: vercel.json (no package script Vercel would also pick)');
  assert.deepEqual(Object.keys(pkg.dependencies).sort(), ['@simplewebauthn/server', 'firebase-admin'], 'the build installs nothing new');
});

test('.vercelignore keeps exactly the step\'s own import graph in the BUILD — every other script stays out; --prune takes them out of the output', () => {
  // (the step's static import graph, from the files themselves)
  const seen = new Set(), todo = ['scripts/deploy-build.mjs'];
  while (todo.length) {
    const f = todo.pop();
    if (seen.has(f)) continue;
    seen.add(f);
    for (const m of read(f).matchAll(/^import [^\n]*? from '(\.\/[^']+)';/gm)) todo.push(`scripts/${m[1].slice(2)}`);
    for (const m of read(f).matchAll(/^import [^\n]*? from '([^.'][^']*)';/gm)) assert.match(m[1], /^node:/, `${f}: only node's own modules (the build installs nothing) — ${m[1]}`);
  }
  const ignored = new Set(execSync('git ls-files -i -c --exclude-from=.vercelignore', { encoding: 'utf8' }).split('\n').filter(Boolean));
  const kept = execSync('git ls-files scripts', { encoding: 'utf8' }).split('\n').filter(Boolean).filter(f => !ignored.has(f)).sort();
  // (deploy-build.mjs itself is new in this pass: tracked from its commit on — counted from the working tree until then)
  const want = [...seen].sort();
  assert.deepEqual(kept.filter(f => f !== 'scripts/deploy-build.mjs'), want.filter(f => f !== 'scripts/deploy-build.mjs'), 'in the build: the step + what it imports, nothing else of scripts/');
  for (const f of want) assert.match(read('.vercelignore'), new RegExp(`^!/${f.replace(/[.]/g, '\\.')}$`, 'm'), `${f} is named`);
  for (const f of ['tests/boot-bundle.test.mjs', 'docs/harbor.md', 'CLAUDE.md', 'scripts/serve.mjs', 'database.rules.json']) assert.ok(ignored.has(f), `${f} still never deploys`);
  for (const f of ['index.html', 'sw.js', 'file-hashes.json', 'js/app.js', 'api/time.js', 'package.json', 'vercel.json']) assert.ok(!ignored.has(f), `${f} deploys`);
  assert.match(read('scripts/deploy-build.mjs'), /if \(process\.argv\.includes\('--prune'\)\) rmSync\(at\('scripts'\), \{ recursive: true, force: true \}\);/, 'the builders leave the output');
});

test('deployFiles(): the bundle, the page and the list AGREE — the page asks for the bundle by its own hash, the list carries its row', () => {
  assert.deepEqual(checkDeploy(FILES, LIST), [], 'nothing wrong');
  const b = JSON.parse(FILES[BUNDLE_FILE]), h = JSON.parse(FILES[OUT]);
  assert.equal(htmlV(FILES[HTML]), b.v);
  assert.equal(h.files[BUNDLE_PATH], hashOf(Buffer.from(FILES[BUNDLE_FILE], 'utf8')));
  assert.equal(h.n, JSON.parse(read(OUT)).n + 1, 'the committed list + ONE row');
  const committed = JSON.parse(read(OUT)).files;
  for (const k of Object.keys(committed)) assert.equal(h.files[k], committed[k], k);
  assert.deepEqual(Object.keys(h.files), Object.keys(h.files).slice().sort(), 'rows in path order (as the list always was)');
  // (the page differs from the committed one ONLY by the ?v= — THE BOOT PRELOAD's block is already current in git: tests/boot-preload.test.mjs)
  assert.equal(FILES[HTML].replace(`boot-bundle.json?v=${b.v}`, 'boot-bundle.json'), read(HTML).replace(/\r\n/g, '\n'));
});

test('checkDeploy catches every way the three can disagree (each = a FAILED deploy, never a half one)', () => {
  const b = JSON.parse(FILES[BUNDLE_FILE]);
  const wrong = (patch, re) => { const bad = checkDeploy({ ...FILES, ...patch }, LIST); assert.ok(bad.some(x => re.test(x)), `${re} in ${JSON.stringify(bad).slice(0, 300)}`); };
  wrong({ [HTML]: FILES[HTML].replace(b.v, '0'.repeat(16)) }, /asks for boot-bundle\.json\?v=0000/);
  wrong({ [HTML]: read(HTML) }, /asks for boot-bundle\.json\?v=null/);
  wrong({ [OUT]: read(OUT) }, /the bundle's row is not the bundle's hash/);
  wrong({ [OUT]: withFile(read(OUT), BUNDLE_PATH, 'another bundle') }, /the bundle's row is not the bundle's hash/);
  wrong({ [BUNDLE_FILE]: FILES[BUNDLE_FILE].slice(0, 5000) }, /does not parse/);
  wrong({ [BUNDLE_FILE]: FILES[BUNDLE_FILE].replace('"z":', '"z":1') }, /z \d+ ≠ its/);
  // a module gone from the bundle (a missing file on the deploy's checkout): its importers name it
  const less = { ...b, f: b.f.filter(x => x[0] !== 'js/store.js') }; less.n = less.f.length;
  wrong({ [BUNDLE_FILE]: `${JSON.stringify(less)}\n` }, /imports js\/store\.js — NOT in the bundle/);
  wrong({ [BUNDLE_FILE]: `${JSON.stringify({ ...b, f: b.f.map(x => (x[0] === 'js/store.js' ? [x[0], "import './x.js';"] : x)) })}\n` }, /js\/store\.js: not rewritten/);
});

test('the local server answers the deploy\'s three files FROM MEMORY through the same deployFiles() — nothing written, never a stale bundle', () => {
  const s = read('scripts/serve.mjs');
  assert.match(s, /deployLib\.deployFiles\(readFileSync\(join\(root, 'index\.html'\), 'utf8'\), readFileSync\(join\(root, 'file-hashes\.json'\), 'utf8'\), list\)/);
  assert.match(s, /vp === '\/boot-bundle\.json' \|\| vp === '\/index\.html' \|\| vp === '\/file-hashes\.json'/);
  assert.match(s, /if \(built && stamp\(built\.list\) === built\.key\) return built\.files;/, 'rebuilt when a boot module, the page or the list changed on disk');
  assert.ok(!/writeFileSync/.test(s), 'the server writes no file');
  assert.match(s, /const RAW = ARGV\.includes\('--raw'\) \|\| root !== HERE;/, '--raw / --root: a deploy\'s output served as it is');
});
