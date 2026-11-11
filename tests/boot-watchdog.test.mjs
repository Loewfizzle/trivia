// LOAD FIX 3 — THE BOOT SAFETY NET's wiring (docs/harbor/passes/load-fix-3.md). THE FREEZE: one failed or stalled request among the boot's
// ~310 module files held the boot screen forever — the app's graph never ran, and everything that could notice was a module. The proof
// that each forced fault ends in a revealed, tappable city is the harbor `load` group (THE BOOT SAFETY NET) + tests/integration/wk-freeze.mjs
// in WebKit; this keeps the pieces from being moved or dropped by accident.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const html = read('index.html');

test('THE BOOT WATCHDOG is an inline CLASSIC script, ahead of every module, the preload + the stylesheets', () => {
  const at = html.indexOf('W.__boot = {');
  assert.ok(at > 0, 'index.html defines window.__boot (W.__boot)');
  const open = html.lastIndexOf('<script', at), tag = html.slice(open, html.indexOf('>', open) + 1);
  assert.equal(tag, '<script>', `the watchdog is a plain inline script (got ${tag}) — a module would die with the graph it watches`);
  for (const later of ['<script type="importmap">', '<link rel="modulepreload" href="js/app.js">', 'href="css/base.css"', 'window.__bootPre=function', '<script type="module" src="js/app.js">'])
    assert.ok(html.indexOf(later) > at, `the watchdog comes before ${later}`);
  assert.match(html, /LIMIT = 12000/, 'no reveal after 12 s on screen');
  assert.match(html, /D\.visibilityState === 'visible'\) vis \+= d/, 'the 12 s count only while the page is visible');
  assert.match(html, /post\('boot', /, 'it reports a BOOT HANG (kind boot)');
  assert.match(html, /function reloadOnce\(\)[\s\S]{0,200}prevReload\(\)[\s\S]{0,200}offerTap\(\)/, 'ONE reload, then TAP TO TRY AGAIN — never a loop');
  assert.match(html, /\/\\\/js\\\/app\\\.js\$\/\.test\(u\)/, "the app's module graph failing → at once");
  assert.match(html, /new Worker\(URL\.createObjectURL/, 'THE HANG WATCH starts at boot (the worker made here)');
  assert.match(html, /setResourceTimingBufferSize/, "the report's missing-module list sees every file");
});

test('the core sheets: each counted ONCE, a failed one asked for once more', () => {
  for (const s of ['base', 'components', 'screens', 'title'])
    assert.ok(html.includes(`<link rel="stylesheet" href="css/${s}.css" media="print" onload="this.media='all';__cssDone(this)" onerror="__cssFail(this)">`), `css/${s}.css`);
  assert.match(html, /window\.__cssDone = function \(l\) \{ if \(l\) \{ if \(l\.__nsIn\) return;/, 'a second load event (WebKit, print → all) never counts twice');
});

test('the app + the city tell the watchdog where they are; the city feeds the boot-time hang watch', () => {
  const app = read('js/app.js'), report = read('js/screens/harbor/report.js'), title = read('js/screens/title.js'), scene = read('js/screens/harbor/scene.js');
  assert.match(app, /window\.__boot\.stage\('app'\)/);
  assert.match(app, /function bootOut\(el\) \{ if \(window\.__boot\) window\.__boot\.revealed\(\);/, 'the boot screen lifting stops the watchdog');
  assert.match(app, /window\.__bootOut = why =>/, '"reveal what is ready"');
  assert.match(title, /__boot\.stage\(/);
  assert.match(scene, /__boot\.stage\('the city started'\)/);
  assert.match(report, /window\.__boot\.watching/, 'the scene reuses the boot-time worker (one hang watch)');
});

test('the BOOT HANG report: a kind /api/log keeps + /admin names', () => {
  assert.match(read('api/log.js'), /REPORT_KINDS = \[[^\]]*'boot'/);
  assert.match(read('js/admin/groups.js'), /'boot' \? 'BOOT HANG'/);
});

test('the service worker tries the network twice before its cache', () => {
  assert.match(read('sw.js'), /await net\(\)\.catch\(\(\) => new Promise\(r => setTimeout\(r, 250\)\)\.then\(net\)\)/);
});

// LOAD FIX 4 — GROK'S BOOT AUDIT, the small fixes (docs/harbor/passes/load-fix-4.md): the WebKit / Chromium proofs are the harbor load group
// (a core sheet failed TWICE), tests/integration/sw-cache.mjs (the worker's writes + offline) and the pass log's hang-watch measure.
test('#12 — a core sheet that fails TWICE never counts as in (the boot screen holds → the watchdog reloads)', () => {
  const fail = html.slice(html.indexOf('window.__cssFail = function'), html.indexOf('</script>', html.indexOf('window.__cssFail = function')));
  const retry = fail.slice(fail.indexOf("n.onerror"));
  assert.ok(retry.length > 0 && !/n\.onerror = function \(\) \{ __cssDone/.test(retry), 'the retry\'s onerror counts nothing');
  assert.match(fail, /n\.onload = function \(\) \{ n\.media = 'all'; __cssDone\(n\); \}/, 'a retry that loads still counts');
});
test('#10 — the hang watch beats cheaply; the full snapshot every SNAP_MS (5 s) or after a stall > 1.5 s', () => {
  assert.match(html, /SNAP_MS = 5000/);
  assert.match(html, /if \(t - snapAt >= SNAP_MS \|\| gap > 1500\) \{ snapAt = t;/);
  assert.match(html, /taken ≤ 5 s before it stopped/);
});
test('#11 — the service worker writes a copy only when it changed, never a throwaway query, one copy of a page, a capped cache', () => {
  const sw = read('sw.js');
  assert.match(sw, /if \(old && sameCopy\(old, res\)\) \{ stats\.same\+\+; return; \}/);
  assert.match(sw, /const keepable = url => \[\.\.\.url\.searchParams\.keys\(\)\]\.every\(k => k === 'v'\)/);
  assert.match(sw, /req\.mode === 'navigate' \? `\$\{url\.origin\}\$\{url\.pathname\}`/);
  assert.match(sw, /MAX_ENTRIES = \d+/);
  assert.match(sw, /url\.pathname\.startsWith\('\/audio\/'\) \|\| url\.pathname\.startsWith\('\/api\/'\)/, 'never /api or /audio');
  assert.match(sw, /url\.origin !== self\.location\.origin\) return/, 'same-origin only');
});
