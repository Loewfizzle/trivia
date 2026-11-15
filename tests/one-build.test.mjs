// PLAY NOW — Group 0a: ONE BUILD PER PAGE — a phone never runs two deploys' code at once (C2: the owner's iPhone ran an OLD cached
// js/audio/music.js beside the NEW radio-ledger.js). The worker pins every page to the build it booted on; these pin the shape so a later
// pass can't drift it back. The behaviour itself: tests/integration/wk-onebuild.mjs (WebKit + Chromium, a deploy under an open page).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { goneAnswer, reloadAtReturn } from '../js/ui/lazy-import.js';

const sw = fs.readFileSync('sw.js', 'utf8');

test('the page\'s answer to ns:build-gone (CITY A — item 10): keep going on the live files, the ONE reload QUEUED for the next return; never a loop', () => {
  assert.deepEqual(goneAnswer({ reloadedFor: null, live: 'b' }), { mix: true, reload: true }, 'mid-tap / any screen: the file served, the reload waits for a return');
  assert.deepEqual(goneAnswer({ reloadedFor: 'b', live: 'b' }), { mix: true, reload: false }, 'already reloaded for b: never again');
  assert.deepEqual(goneAnswer({ reloadedFor: undefined, live: 'b' }), { mix: true, reload: false }, 'no session storage: no reload (no loop guard)');
  assert.deepEqual(goneAnswer({ reloadedFor: 'a', live: 'b' }), { mix: true, reload: true }, 'a reload for an older deploy doesn\'t count');
  // the gate: only at a RETURN, never mid-match, never with a sheet open / a finger down
  assert.equal(reloadAtReturn({ returning: true, holding: false, gated: false }), true);
  assert.equal(reloadAtReturn({ returning: false, holding: false, gated: false }), false, 'never mid-tap: a tap is not a return');
  assert.equal(reloadAtReturn({ returning: true, holding: true, gated: false }), false, 'never mid-match');
  assert.equal(reloadAtReturn({ returning: true, holding: false, gated: true }), false, 'never with a sheet open');
  // (FIXES R1 — THE SHARE HOLD: a return within 60 s of a share's start / end — the share sheet, Messages — is no return)
  assert.equal(reloadAtReturn({ returning: true, holding: false, gated: false, sharedAgo: 2000 }), false, 'never right after a share');
  assert.equal(reloadAtReturn({ returning: true, holding: false, gated: false, sharedAgo: 59_000 }), false);
  assert.equal(reloadAtReturn({ returning: true, holding: false, gated: false, sharedAgo: 61_000 }), true, 'a later return still reloads');
  assert.equal(reloadAtReturn({ returning: true, holding: false, gated: false, sharedAgo: Infinity }), true, 'no share = the old rule');
  const L = fs.readFileSync('js/ui/lazy-import.js', 'utf8');
  assert.doesNotMatch(L.slice(L.indexOf('function checkSkew'), L.indexOf('function queueReload')), /location\.reload\(\)/, 'a failed import never reloads on the spot');
  assert.match(L, /kind: 'reload', text/, 'each one logged to /admin');
  assert.match(fs.readFileSync('js/app.js', 'utf8'), /gate: \(\) => \{ try \{ return layersOpen\(\) > 0 \|\| !!\(window\.__tapwatch && window\.__tapwatch\.pressing\(\)\)/);
});

test('the worker: every page pinned (in memory + META), a miss reaches the network only while it is that build, a build\'s cache kept under its pages', () => {
  assert.match(sw, /const CODE_RE = \/\^\\\/\(js\|css\)\\\/\/;/, '/js + /css are the code');
  assert.match(sw, /modes\.set\(id, modeP\); modeP\.then\(M => pin\(id, M\)\)/, 'a page load pins its client');
  assert.match(sw, /caches\.open\(META\)\.then\(c => c\.put\('\/__pins'/, 'the pins persisted (a restarted worker still knows)');
  assert.match(sw, /const live = await liveBuild\(\);\s*if \(live && live !== M\.v\) \{[\s\S]{0,120}if \(!await askPage\(cid, M\.v, live\)\) \{ stats\.refused\+\+; return Response\.error\(\); \}/, 'the build is gone: ask the page, else refuse');
  assert.match(sw, /else if \(!live\) keepIt = false;/, 'an unchecked build: never kept as this build\'s');
  assert.match(sw, /event\.waitUntil\(kept\.then\(\(\) => noteKept\(M, key\)\)\)/, 'each burst of misses checked again once it settles');
  assert.match(sw, /if \(live && live !== b\.v\) \{[\s\S]{0,200}for \(const k of b\.keys\) await c\.delete\(k\);\s*await tellGone\(b\.v, live\);/, 'a deploy mid-burst: copies dropped, pages told');
  assert.match(sw, /k\.startsWith\(BUILD_PREFIX\) && k !== name && !keepC\.has\(k\)/, 'a build\'s cache stays while a page is on it');
  assert.match(sw, /M\.mode === 'build' && code \? null : await within\(caches\.match\(req/, 'offline: a page\'s code only from its own build, never another build\'s copy');
  assert.match(sw, /LIVE_FRESH_MS = 3e3/);
});

test('the edge header on the code revalidates (an uncontrolled load never boots on the HTTP cache\'s older copy)', () => {
  const cfg = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  for (const d of ['js', 'css']) {
    const r = cfg.headers.find(x => x.source === `/${d}/(.*)`);
    assert.equal(r.headers.find(h => h.key === 'Cache-Control').value, 'public, max-age=300', 'no stale-while-revalidate: never a day-old copy');
  }
});

test('the page asks the worker for its build at boot (the truest — the build its files come from)', () => {
  const li = fs.readFileSync('js/ui/lazy-import.js', 'utf8');
  assert.match(li, /sw\.controller\.postMessage\(\{ t: 'ns:build\?' \}\)/);
  assert.match(li, /if \(d\.t === 'ns:build'\) \{ if \(d\.v\) \{ workerV = String\(d\.v\);/);
  assert.match(sw, /if \(d\.t === 'ns:build\?'\)/);
});
