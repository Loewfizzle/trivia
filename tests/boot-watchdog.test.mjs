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
  // (THE BEFORE-LAUNCH PASS — THE FIRST-VISIT BUNDLE: the import map + app.js are written by ONE loader, ahead of the stylesheets; the start at the body's end)
  for (const later of ['W.__nsRoot = root', 'href="css/base.css"', 'window.__bootPre=function', '<script>window.__nsGo();</script>'])
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
  assert.match(read('api/_lib/log-pure.js'), /REPORT_KINDS = \[[^\]]*'boot'/);   // (FIXES R1: /api/log's pure half)
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
  assert.match(sw, /url\.pathname\.startsWith\('\/api\/'\) \|\| url\.pathname\.startsWith\('\/_vercel\/'\)/, 'never /api');
  assert.match(sw, /if \(url\.pathname\.startsWith\('\/audio\/'\)\) \{ event\.respondWith\(audioFetch\(req, url, event\)\); return; \}/, 'CITY A — item 14: /audio kept BY VERSION (its own cache), never in a build\'s');
  assert.match(sw, /url\.origin !== self\.location\.origin\) return/, 'same-origin only');
});

// FR7 FIXES C2 — a newline slipped into one of the watchdog's strings once (an edit script): EVERY inline classic script in the page must PARSE —
// a broken watchdog is no watchdog (and THE SUPPORTED FLOOR + THE HAND RELOAD live in it)
test('every inline <script> in index.html parses; the floor + the hand-reload record are wired', async () => {
  const vm = await import('node:vm');
  const bad = [];
  for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) { try { new vm.Script(m[1]); } catch (e) { bad.push(`${e.message}: ${m[1].slice(0, 60)}`); } }
  assert.deepEqual(bad, []);
  assert.match(html, /if \(OLD\) \{ showOld\(\); oldOnce\('at the boot'\); \}/, 'a browser below the floor: the line at once + one count');
  assert.match(html, /function report\(why\) \{ if \(sent\) return; sent = true; if \(OLD\) \{ oldOnce\(why\); return; \}/, 'never a BOOT HANG from an old browser');
  assert.match(html, /W\.addEventListener\('pagehide', function \(\) \{ keepLast\(true\); \}\)/, 'the record kept as the page goes (a hand reload)');
  assert.match(html, /revealed: function \(\) \{ if \(!done\) \{ done = true; dropLast\(\);/, 'a revealed boot leaves no record');
  assert.match(read('js/app.js'), /if \(window\.__boot && window\.__boot\.old\) throw new Error\(/, 'app.js stops at its top below the floor');
});

// CITY PART 1 — A FIRST VISIT THAT NEVER LOADED (the owner's /admin, Nov 20: a Pixel 8 on 4G, nothing cached, BOOT HANG ×2 naming no gate)
test('CITY PART 1: a SLOW LINE is no hang — still arriving at 12 s (the city not started) = a quiet count, no reload; a stall of 4 s or 45 s on screen acts', () => {
  assert.match(html, /STALL_MS = 4000, HARD_MS = 45000/, 'the stall + the hard ceiling');
  assert.match(html, /performance\.getEntriesByType\('resource'\);[\s\S]{0,200}nr\+\+;[\s\S]{0,80}if \(nr > resN\) \{ resN = nr; grewVis = vis; \}/, 'progress = a new boot file (same-origin js / css) finished — once a second; an idle poll never counts (the review)');
  assert.match(html, /CITY_OWN_MS = 8000/, 'a city that started late gets its own 8 s');
  assert.match(html, /onScreen: function \(\) \{ return done \? NaN : vis; \}/, 'the page clock ends at the first reveal (a later scene keeps its own)');
  const at = html.indexOf("if (!acted && vis < HARD_MS && (stage === 'the city started' ? cityAt >= 0 && vis - cityAt < CITY_OWN_MS : vis - grewVis < STALL_MS))");
  assert.ok(at > 0, 'the slow-line rule');
  const body = html.slice(at, html.indexOf('if (!acted) {', at));
  assert.match(body, /post\('slow-boot', 'slow-boot'\)/, "counted quietly ('slow-boot' — api/log.js QUIET_KINDS)");
  assert.match(body, /return;/, 'and nothing else: no report row, no reveal attempt, no reload');
  assert.ok(!/reloadOnce|report\(/.test(body), 'never a reload or a BOOT HANG from the slow-line branch');
});
test('CITY PART 1: the BOOT HANG row names the city\'s gates (+ the line: bytes, the slowest request, whether this load IS the watchdog\'s reload)', async () => {
  assert.match(html, /\+ gatesLine\(\) \+ netLine\(\)/, 'both lines in every boot snapshot');
  assert.match(html, /gates: function \(fn\) \{ gatesFn = fn; \}/, '__boot.gates (the scene registers)');
  assert.match(html, /onScreen: function \(\) \{ return done \? NaN : vis; \}/, '__boot.onScreen (the page\'s clock, until the first reveal)');
  assert.match(html, /this load is the watchdog\u2019s reload: ' \+ \(IS_RELOAD/, 'whether this load is the reload');
  const scene = read('js/screens/harbor/scene.js');
  assert.match(scene, /window\.__boot\.gates\(\(\) => \{/, 'the scene registers its gates');
  for (const g of ['bake', 'fonts', 'wx', 'sky', 'panel', 'songs', 'folk', 'board']) assert.ok(scene.includes(`'${g}'`), `the report names ${g}`);
  assert.match(scene, /window\.__boot\.gates\(null\)/, 'and takes them back when it goes');
  assert.match(read('api/log.js'), /QUIET_KINDS = \[[^\]]*'slow-boot'/, 'slow-boot is a quiet kind (read as text — THE UNIT JOB INSTALLS NOTHING)');
});
test('CITY PART 1: THE PAGE\'S CLOCK — the network gates let go by the page\'s time on screen; a BAKED city reveals from 6.5 s; the bake never early', () => {
  const scene = read('js/screens/harbor/scene.js');
  assert.match(scene, /const NET_LET_GO_MS = 5000, PAGE_LATE_MS = 6500;/);
  assert.match(scene, /const g = \{ bake: ready, fonts: fonts \|\| netGo, wx: wx \|\| netGo, sky: sky \|\| netGo, panel: panel \|\| netGo, songs: songs \|\| netGo, folk: folk \|\| netGo, board: board \|\| netGo \};/, 'every network gate — never the bake');
  assert.match(scene, /const pageLate = pageOn > PAGE_LATE_MS && baker\.bakes >= 1 && litBaker\.bakes >= 1 && bakeCamShown === camSig && !baker\.pending && !litBaker\.pending;/, 'a late page reveals only a CURRENT baked city');
});
