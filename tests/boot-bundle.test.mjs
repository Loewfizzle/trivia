// THE BEFORE-LAUNCH PASS — THE FIRST-VISIT BUNDLE (docs/harbor.md "THE FIRST-VISIT BUNDLE"; scripts/build-boot-bundle.mjs): the generated
// /boot-bundle.json is CURRENT (like the preload graph's), every module rewritten the one way, index.html's loader chooses it only for a
// first visit and falls back to the modules on any failure, THE CARRY never sees it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { bundleList, sourcesHash, rewrite, BUNDLE_FILE } from '../scripts/build-boot-bundle.mjs';
import { preloadList } from '../scripts/build-boot-preload.mjs';

const at = p => new URL(`../${p}`, import.meta.url);
const read = p => readFileSync(at(p), 'utf8');

test('THE FIRST-VISIT BUNDLE is current (node scripts/build-boot-bundle.mjs after ANY boot module changes) and holds the whole boot list', () => {
  assert.ok(existsSync(at(BUNDLE_FILE)), `${BUNDLE_FILE} exists`);
  const b = JSON.parse(read(BUNDLE_FILE));
  assert.equal(b.v, sourcesHash(), `${BUNDLE_FILE} is stale — run node scripts/build-boot-bundle.mjs`);
  assert.deepEqual(b.f.map(x => x[0]), bundleList(), 'the boot list, in order (js/app.js first)');
  assert.deepEqual(bundleList().slice(1), preloadList(), 'exactly THE BOOT PRELOAD\'s modules');
  for (const [p, src] of b.f) {
    assert.ok(!/(\b(?:from|import)\s*)(['"])\.{1,2}\//.test(src), `${p}: no relative static import left`);
    assert.ok(!/\bimport\.meta\b/.test(src), `${p}: no import.meta left (a blob URL is no base)`);
  }
});

test('the rewrite: static relative imports → @ns/<path>; import.meta.url → the real URL; dynamic import → __nsI (relative resolved against the real URL)', () => {
  const src = [
    "import { h } from '../ui/dom.js';",
    "import './side.js';",
    "export * from './more.js';",
    "export { a as b } from \"../core/x.js\";",
    "import three from 'three';",
    "const u = new URL('../../data/a.json', import.meta.url);",
    "const m = await import('./lazy.js'), n = lazyImport(import(`./help.js?again=${k}`), './help.js');",
    "x.import('./nope.js');",
  ].join('\n');
  const out = rewrite('js/screens/title.js', src);
  const [pre, ...lines] = out.split('\n');
  assert.match(pre, /^const __nsMeta = globalThis\.__nsRoot \+ "js\/screens\/title\.js", __nsR = /, 'ONE prelude line');
  assert.equal(lines[0], "import { h } from '@ns/js/ui/dom.js';");
  assert.equal(lines[1], "import '@ns/js/screens/side.js';");
  assert.equal(lines[2], "export * from '@ns/js/screens/more.js';");
  assert.equal(lines[3], 'export { a as b } from "@ns/js/core/x.js";');
  assert.equal(lines[4], "import three from 'three';", 'a bare name untouched (the import map has it)');
  assert.equal(lines[5], "const u = new URL('../../data/a.json', __nsMeta);");
  assert.equal(lines[6], "const m = await __nsI('./lazy.js'), n = lazyImport(__nsI(`./help.js?again=${k}`), './help.js');");
  assert.equal(lines[7], "x.import('./nope.js');", 'a method named import is no import');
  // the prelude's resolver, run: a relative name against the real URL; anything else as it is
  globalThis.__nsRoot = 'https://example.test/';
  const R = new Function(`${pre}; return __nsR;`)();
  assert.equal(R('./lazy.js'), 'https://example.test/js/screens/lazy.js');
  assert.equal(R('../games/x/index.js'), 'https://example.test/js/games/x/index.js');
  assert.equal(R('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'), 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js');
  delete globalThis.__nsRoot;
});

test('index.html: ONE loader picks the bundle only for a FIRST visit; the modules as before otherwise and on any failure; nothing loads a module before its import map', () => {
  const html = read('index.html');
  assert.ok(!/<script type="importmap">/.test(html), 'no static import map (the loader writes the ONE map)');
  assert.ok(!/<script type="module" src="js\/app\.js">/.test(html), 'no static app.js script (the loader starts it)');
  assert.ok(!/<link rel="modulepreload" href="js\/app\.js">/.test(html), 'no static modulepreload before the map (a module loading first would refuse the map)');
  assert.match(html, /navigator\.serviceWorker\.controller/, 'a returning visitor (the worker in charge) = the modules');
  assert.match(html, /HTMLScriptElement\.supports\('importmap'\)/, 'an old browser = the modules');
  assert.match(html, /\[\?&\]nobundle/, '?nobundle = the modules');
  assert.match(html, /var C = navigator\.connection, slow = /, 'a SLOW line only (the measured win) — or ?bundle=1');
  assert.match(html, /\.catch\(function \(e\) \{ clearInterval\(dog\); done\(modules\(/, 'any failure of the bundle = the modules');
  assert.match(html, /m\['@ns\/' \+ p\] = u; m\[root \+ p\] = u;/, 'each module under its @ns name AND its real URL: one instance, whoever asks');
  assert.match(html, /<script>window\.__nsGo\(\);<\/script>\s*<\/body>/, 'started where app.js was: at the body\'s end');
  assert.match(html, /window\.__bootPre=function\(\)\{if\(window\.__bootPre\.done\|\|window\.__nsBundle\)return;/, 'THE BOOT PRELOAD never fetches the modules beside the bundle');
  assert.match(html, /W\.__nsBundle && W\.__nsBundle\.grew > bundleSeen/, 'THE BOOT WATCHDOG: the bundle\'s bytes arriving = still arriving (a slow line is no hang)');
});

test('THE CARRY + the deploy never see the bundle as a build file: outside js/ css/ assets/ data/, not in file-hashes.json, not ignored by Vercel', () => {
  assert.ok(!BUNDLE_FILE.includes('/'), 'at the root');
  assert.ok(!(JSON.parse(read('file-hashes.json')).files || {})[BUNDLE_FILE], 'not in THE CARRY\'s list');
  const ign = read('.vercelignore').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  assert.ok(!ign.some(l => l === BUNDLE_FILE || l === '*.json' || l === '/' + BUNDLE_FILE), 'deployed');
});
