// THE BEFORE-LAUNCH PASS — THE FIRST-VISIT BUNDLE (docs/harbor.md "THE FIRST-VISIT BUNDLE"; scripts/build-boot-bundle.mjs): the generated
// /boot-bundle.json is CURRENT (like the preload graph's), every module rewritten the one way, index.html's loader chooses it only for a
// visit but Safari's (THE FIX PASS) and falls back to the modules on any failure; the worker keeps it per build (THE CARRY moves it unchanged).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { bundleList, sourcesHash, sourceOf, buildBundle, bundleText, nsImports, lf, rewrite, BUNDLE_FILE } from '../scripts/build-boot-bundle.mjs';
import { preloadList } from '../scripts/build-boot-preload.mjs';
import { bootGraph } from '../scripts/boot-bytes.mjs';

const at = p => new URL(`../${p}`, import.meta.url);
const read = p => readFileSync(at(p), 'utf8');
// (THE HOUSEKEEPING PASS — the bundle is BUILT AT DEPLOY, never committed: built HERE, once, from the working tree)
const LIST = bundleList(), BUILT = buildBundle(LIST), TEXT = bundleText(BUILT);

test('THE FIRST-VISIT BUNDLE covers the WHOLE boot graph: js/app.js first, exactly THE BOOT PRELOAD\'s modules, every static import inside it', () => {
  assert.deepEqual(BUILT.f.map(x => x[0]), LIST, 'the boot list, in order (js/app.js first)');
  assert.equal(LIST[0], 'js/app.js');
  assert.deepEqual(LIST.slice(1), preloadList(), 'exactly THE BOOT PRELOAD\'s modules');
  const have = new Set(LIST);
  for (const r of bootGraph('js/app.js').rows) assert.ok(have.has(r.f), `${r.f}: in js/app.js's static graph — in the bundle`);
  assert.ok(LIST.length > 250 && new Set(LIST).size === LIST.length, `${LIST.length} modules, none twice`);
  for (const [p, src] of BUILT.f) {
    assert.ok(!/(\b(?:from|import)\s*)(['"])\.{1,2}\//.test(src), `${p}: no relative static import left`);
    assert.ok(!/\bimport\.meta\b/.test(src), `${p}: no import.meta left (a blob URL is no base)`);
    for (const d of nsImports(src)) assert.ok(have.has(d), `${p} imports ${d}: in the bundle (a module the bundle lacks would not resolve)`);
  }
});

test('the builder is DETERMINISTIC: the same sources = the same bytes; a CRLF working copy builds the SAME bundle (THE CRLF TRAP)', () => {
  assert.equal(bundleText(buildBundle(LIST)), TEXT, 'built twice: byte for byte');
  assert.equal(BUILT.v, sourcesHash(LIST), 'its ?v= = the hash of its sources');
  // a Windows checkout with CRLF line endings (git + Vercel hold LF): the same bundle, the same hash
  const crlf = p => sourceOf(p).replace(/\n/g, '\r\n'), sub = LIST.slice(0, 40);
  assert.ok(crlf(sub[0]).includes('\r\n'));
  assert.equal(sourcesHash(sub, p => lf(crlf(p))), sourcesHash(sub));
  assert.equal(bundleText(buildBundle(sub, p => lf(crlf(p)))), bundleText(buildBundle(sub)));
  assert.equal(lf('a\r\nb\nc\r\n'), 'a\nb\nc\n');
  for (const [, src] of BUILT.f) assert.ok(!src.includes('\r'), 'no CR in a bundled module');
  // one changed byte in one module = another ?v= (a new URL, never a stale copy kept a year)
  assert.notEqual(sourcesHash(sub, p => (p === sub[3] ? `${sourceOf(p)} ` : sourceOf(p))), sourcesHash(sub));
  assert.match(read('scripts/build-boot-bundle.mjs'), /export const sourceOf = p => lf\(readFileSync\(resolve\(ROOT, p\), 'utf8'\)\);/, 'every source read through the LF reader');
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
  const lines = out.split('\n'), cut = lines[0].indexOf('__nsI = s => import(__nsR(s)); ') + '__nsI = s => import(__nsR(s)); '.length, pre = lines[0].slice(0, cut);
  lines[0] = lines[0].slice(cut);
  assert.match(pre, /^const __nsMeta = globalThis\.__nsRoot \+ "js\/screens\/title\.js", __nsR = /, 'the prelude ON the first line (a stack\'s lines = the file\'s)');
  assert.equal(lines.length, src.split('\n').length, 'no line added');
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

test('index.html: ONE loader picks the bundle for EVERY visit but Safari’s (THE FIX PASS — D3 + P6 + P7); the modules otherwise and on any failure; nothing loads a module before its import map', () => {
  const html = read('index.html');
  assert.ok(!/<script type="importmap">/.test(html), 'no static import map (the loader writes the ONE map)');
  assert.ok(!/<script type="module" src="js\/app\.js">/.test(html), 'no static app.js script (the loader starts it)');
  assert.ok(!/<link rel="modulepreload" href="js\/app\.js">/.test(html), 'no static modulepreload before the map (a module loading first would refuse the map)');
  assert.ok(!/navigator\.serviceWorker\.controller/.test(html.split('THE FIRST-VISIT BUNDLE (THE BEFORE-LAUNCH PASS')[1].split('</script>')[0]), 'P6: a returning visitor takes the bundle too (the worker keeps it — ONE request, never the ~300-module refill)');
  assert.ok(html.includes(String.raw`apple = /AppleWebKit\//.test(ua) && !/(Chrome|Chromium|Edg|OPR|SamsungBrowser)\//.test(ua)`),'D3: Safari (any WebKit — every iPhone browser) = the modules');
  assert.match(html, /crawl = !!C && \(\/\(\^\|-\)2g\$\/\.test\(C\.effectiveType \|\| ''\) \|\| \(C\.downlink > 0 && C\.downlink < 0\.4\)\)/, 'P7: never on 2g / under 0.4 Mbps');
  assert.match(html, /late = B\.z > 0 && B\.bytes > 0 && el > 4000 && el \* B\.z \/ B\.bytes > BAIL_MS/, 'P7: a download that projects past BAIL_MS is left early');
  assert.match(html, /BAIL_MS = 35000/);
  assert.match(html, /HTMLScriptElement\.supports\('importmap'\)/, 'an old browser = the modules');
  assert.match(html, /\[\?&\]nobundle/, '?nobundle = the modules');
  assert.match(html, /\.catch\(function \(e\) \{ clearInterval\(dog\); done\(modules\(/, 'any failure of the bundle = the modules');
  assert.match(html, /m\['@ns\/' \+ p\] = u; m\[root \+ p\] = u;/, 'each module under its @ns name AND its real URL: one instance, whoever asks');
  assert.match(html, /<script>window\.__nsGo\(\);<\/script>\s*<\/body>/, 'started where app.js was: at the body\'s end');
  assert.match(html, /window\.__bootPre=function\(\)\{if\(window\.__bootPre\.done\|\|window\.__nsBundle\)return;/, 'THE BOOT PRELOAD never fetches the modules beside the bundle');
  assert.match(html, /W\.__nsBundle && W\.__nsBundle\.grew > bundleSeen/, 'THE BOOT WATCHDOG: the bundle\'s bytes arriving = still arriving (a slow line is no hang)');
});

test('THE FIX PASS — P6: the bundle IS a build file — pinned to its build by the worker (CODE_RE), carried while unchanged (the DEPLOY\'s file-hashes.json), deployed; its size `z` in its first bytes (P7)', () => {
  assert.ok(!BUNDLE_FILE.includes('/'), 'at the root');
  // (THE HOUSEKEEPING PASS: THE CARRY's row for it is written by the deploy's step, with the bundle itself — tests/deploy-build.test.mjs)
  assert.match(read('scripts/deploy-build.mjs'), /\[OUT\]: withFile\(listText, BUNDLE_PATH, text\)/, 'in THE CARRY’s list (the deploy adds its row)');
  assert.ok(read('sw.js').includes(String.raw`const CODE_RE = /^\/((js|css)\/|boot-bundle\.json$)/;`), 'pinned like a module (a miss is the network only while it is still this build)');
  const ign = read('.vercelignore').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  assert.ok(!ign.some(l => l === BUNDLE_FILE || l === '*.json' || l === '/' + BUNDLE_FILE), 'deployed');
  assert.equal(BUILT.z, Buffer.byteLength(TEXT), 'z = the file’s own byte length');
  assert.ok(TEXT.slice(0, 80).includes(`"z":${BUILT.z}`), 'z in the first bytes');
});
