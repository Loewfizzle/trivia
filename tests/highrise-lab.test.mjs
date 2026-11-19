// HIGH RISE S1 — THE HIGH RISE LAB (highrise-lab.html + js/games/highrise/lab.js · graybox.js — docs/highrise.md "THE LAB"): the page ships
// at the site ROOT (it deploys), noindex, linked from nowhere — and **THE LAB NEVER COUNTS**: zero server calls, zero database writes,
// nothing from /api, the profile, progression, the report, share or the cards. This file is the STATIC half (THE UNIT JOB INSTALLS
// NOTHING: no browser here) — the lab's WHOLE module graph is walked and proven clean; the BROWSER half (the lab at 390 × 844, a bot run
// through real taps, the network log, REPLAY = LIVE ✓, the shot) is tests/integration/highrise-lab.mjs, run outside the sandbox.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { createTower } from '../js/games/highrise/tower.js';
import { createRun, stepTo, tap, isOver } from '../js/games/highrise/engine.js';
import { gaussBot } from '../js/games/highrise/bot.js';
import { BEAT, FLOOR_TICKS_MAX, MODE_IDS } from '../js/games/highrise/tuning.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const code = f => read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');
const posix = p => normalize(p).split('\\').join('/');
/** every module the lab page loads: its script + every static import, followed to the end ('three' = the import map's CDN) */
function graph(entry) {
  const seen = new Set(), bare = new Set(), todo = [entry];
  while (todo.length) {
    const f = todo.pop();
    if (seen.has(f)) continue;
    seen.add(f);
    for (const m of code(f).matchAll(/(?:^|\n)\s*(?:import|export)\s[^'"\n]*?from\s*['"]([^'"]+)['"]|(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g)) {
      const spec = m[1] || m[2];
      if (spec.startsWith('.')) todo.push(posix(join(dirname(f), spec))); else bare.add(spec);
    }
  }
  return { files: [...seen].sort(), bare: [...bare].sort() };
}

test('THE PAGE: at the site root (deployed), noindex nofollow, UNLISTED (nothing links to it), three.js 0.160 through its own import map — and nothing else from outside', () => {
  assert.ok(existsSync(new URL('../highrise-lab.html', import.meta.url)));
  const html = read('highrise-lab.html'), ignore = read('.vercelignore');
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
  assert.match(html, /<script type="importmap">\{ "imports": \{ "three": "https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/build\/three\.module\.min\.js" \} \}<\/script>/, 'the same three.js import map as jaywalk-lab.html');
  assert.equal(html.match(/<script type="importmap">[^<]+<\/script>/)[0], read('jaywalk-lab.html').match(/<script type="importmap">[^<]+<\/script>/)[0]);
  assert.match(html, /<script type="module" src="js\/games\/highrise\/lab\.js" onerror=/, 'its one script (a failed load says so — never a blank page)');
  assert.match(html, /Opening the lab…/);
  // its only files: the icon, its own stylesheet, its own script; the only outside address: three.js
  const urls = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(urls, ['assets/favicon-64.png', 'css/highrise.css', 'js/games/highrise/lab.js']);
  assert.deepEqual([...html.matchAll(/https?:\/\/[^\s"'<>]+/g)].map(m => m[0]), ['https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js'], 'no web font, no other host');
  assert.doesNotMatch(read('css/highrise.css'), /url\(|@import|@font-face/, 'its stylesheet loads nothing');
  assert.ok(!/highrise/.test(ignore) && !/^\*\.html$/m.test(ignore), '.vercelignore keeps it (it deploys)');
  assert.match(read('scripts/serve.mjs'), /path === '\/highrise-lab'/, 'the local server maps /highrise-lab like Vercel\'s cleanUrls');
  assert.match(read('tests/integration/kit/page-loads.mjs'), /\['\/highrise-lab', "!!document\.querySelector\('#app \.hi-stage'\)"\]/, 'THE PAGES LOAD: a stranger gets the lab\'s stage');
  // UNLISTED: no page, no script, no manifest names it
  for (const f of ['index.html', 'board.html', 'admin.html', 'lab.html', 'daychart.html', 'jaywalk-lab.html', '404.html', 'manifest.webmanifest', 'sw.js', 'vercel.json']) assert.doesNotMatch(read(f), /highrise/i, `${f} never names it`);
  for (const f of readdirSync(new URL('../js/games/highrise/', import.meta.url))) assert.doesNotMatch(code(`js/games/highrise/${f}`), /highrise-lab/, `${f}: no link to the lab in code`);
});

test('HIGH RISE IS INVISIBLE TO PLAYERS (S1): no GAMES entry, no DAILIES row, no config / boot / cartridge / registry / rules / endpoint knows it', () => {
  for (const f of ['js/config.js', 'js/app.js', 'js/games/registry.js', 'js/games/cartridge.js', 'js/games/preload.js', 'js/games/preload-graph.js', 'js/screens/title.js', 'js/screens/title-dock.js', 'js/core/game-order.js', 'database.rules.json', 'index.html']) {
    assert.doesNotMatch(read(f), /highrise|HIGH RISE/i, `${f} does not know HIGH RISE`);
  }
  // (S2 added the test page's files — tests/highrise-play.test.mjs holds the whole list; still nothing a console could load as a game)
  const dir = readdirSync(new URL('../js/games/highrise/', import.meta.url)).sort();
  for (const f of ['meta.js', 'index.js', 'view.js', 'director.js']) assert.ok(!dir.includes(f), `no ${f} — nothing a console could load as a game`);
  for (const f of readdirSync(new URL('../api/', import.meta.url)).filter(n => n.endsWith('.js'))) assert.doesNotMatch(read(`api/${f}`), /highrise/i, `api/${f}: no endpoint wiring`);
});

test('THE LAB NEVER COUNTS — its WHOLE module graph: only its own engine files + the integer hash + three.js; nothing from /api, the profile, progression, the report, share, the cards, Firebase, the store', () => {
  const g = graph('js/games/highrise/lab.js');
  assert.deepEqual(g.files, ['js/core/rng.js', 'js/games/highrise/engine.js', 'js/games/highrise/graybox.js', 'js/games/highrise/lab.js', 'js/games/highrise/logic.js', 'js/games/highrise/replay.js', 'js/games/highrise/tower.js', 'js/games/highrise/tuning.js'], 'every module the page loads');
  assert.deepEqual(g.bare, ['three'], 'the one outside module: three.js (the import map)');
  for (const f of g.files) {
    const s = code(f);
    assert.doesNotMatch(s, /\bimport\s*\(/, `${f}: no dynamic import (nothing loads later, no skew wrapper, no deploy check)`);
    assert.doesNotMatch(s, /fetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource|navigator\.serviceWorker|importScripts/, `${f}: makes no request of its own`);
    assert.doesNotMatch(s, /firebase|initFirebase|\/api\/|['"`]\/?api\b|profile|progress|report|share|vault|cards?\b|errlog|identity|\bstore\b/i, `${f}: nothing that counts`);
    assert.doesNotMatch(s, /localStorage|sessionStorage|indexedDB|document\.cookie|caches\./, `${f}: stores nothing`);
    assert.doesNotMatch(s, /(^|[^.\w])(set|update|remove|push|runTransaction|onValue)\(\s*(ref|dbRef)\b/m, `${f}: no database write`);
  }
  // the server half never reaches the page; the bots are the sims' (not the page's)
  assert.ok(!g.files.includes('js/games/highrise/bot.js'));
  assert.ok(!g.files.some(f => f.startsWith('api/')));
});

test('THE LAB\'s RUN: FAIR TAPS (pointerdown → event.timeStamp → its tick), a beat\'s tap never logged, the replay through a FRESH engine after every run, ?mode= ?seed= ?fps=1', () => {
  const lab = read('js/games/highrise/lab.js'), s = code('js/games/highrise/lab.js');
  assert.match(s, /play\.addEventListener\('pointerdown', e => \{ if \(e\.pointerType === 'mouse' && e\.button !== 0\) return; touch\(e\.timeStamp\); \}\);/, 'a tap = the pointerdown, at its own timeStamp');
  assert.doesNotMatch(s, /addEventListener\('click'/, 'never a click');
  assert.match(s, /const T = tickOf\(ts, t0\);\s*if \(tap\(run, T, ev\)\) taps\.push\(T\);/, 'the touch\'s time → its tick → the engine\'s own tap(): logged only when it dropped a slab');
  assert.match(read('js/games/highrise/logic.js'), /export const tickOf = \(ms, t0\) => Math\.round\(\(ms - t0\) \* TICK_HZ \/ 1000\);/, 'the nearest tick');
  assert.match(s, /if \(t0 == null\) \{ begin\(ts\); return; \}/, 'tick 0 = the START touch (never a drop)');
  assert.match(s, /replay\(\{ seed, mode, taps \}\)/, 'the recorded log replayed after each run …');
  assert.match(s, /const fresh = createRun\(\{ seed, mode \}\), evR = \[\];/, '… through a FRESH engine, event by event');
  assert.match(lab, /REPLAY = LIVE ✓/); assert.match(lab, /REPLAY ≠ LIVE ✗ · first differs at tick/, 'a red line + the first differing tick if it ever differs');
  assert.match(s, /MODE_IDS\.includes\(Q\.get\('mode'\)\) \? Q\.get\('mode'\) : 'solo'/); assert.match(s, /const FIXED = \(Q\.get\('seed'\) \|\| ''\)\.replace\(\/\[\^!-~\]\/g, ''\)\.slice\(0, SEED_MAX\);/); assert.match(s, /Q\.get\('fps'\) === '1'/);
  assert.match(lab, /TAP TO RETRY/);
  assert.match(s, /const RETRY_MS = 600;/); assert.match(s, /if \(shown\) \{ if \(now - overAt > RETRY_MS\) \{ restart\(\); begin\(ts\); \} return; \}/, 'the end\'s words stay 0.6 s before a tap is the retry');
  assert.match(s, /const begin = ts => \{ t0 = ts; start\.hidden = true; bar\.hidden = true; \};/, 'while a run is LIVE the mode switch is off the screen: a thumb at the foot is a drop, never a restart (the review)');
  assert.match(s, /end\.hidden = false; bar\.hidden = false;/, '… back with the end\'s words'); assert.match(s, /endT\.textContent = endWords\(live\);/, 'the cause\'s words = the game\'s own table');
  assert.match(s, /catch \{ stage\.append\(el\('p', 'hi-nogl',/, 'no WebGL: the page still loads and says so');
  assert.match(read('css/highrise.css'), /\.hi-play \{[^}]*touch-action: none;[^}]*-webkit-tap-highlight-color: transparent;/, 'no page scroll, no tap flash over the play');
  assert.match(read('css/highrise.css'), /\.hi-tab \{[^}]*height: 48px;/, 'the mode tabs ≥ 44 pt');
  assert.doesNotMatch(read('css/highrise.css'), /border-radius: (9999|999|[1-9]\d)px|border-radius: 50%/, 'NO PILLS');
});

test('THE GRAYBOX: flat boxes, THE DIAGONAL CAMERA (45° turn, 33° down, a narrow 20° lens) climbing with the top slab, the first slab 60 % of the screen; it eases between ticks — the rules never read the frame clock', () => {
  const g = read('js/games/highrise/graybox.js');
  assert.match(g, /^import \* as THREE from 'three';/m);
  assert.match(g, /export const CAM = Object\.freeze\(\{ fov: 20, yaw: 45, pitch: 33, fill: 0\.6, aspectMax: 0\.62, lift: 0\.5 \}\);/);
  assert.match(g, /dist = Math\.SQRT2 \/ \(2 \* CAM\.fill \* a \* Math\.tan\(CAM\.fov \* RAD \/ 2\)\);/, 'the first slab (√2 wide seen corner-on) = 60 % of the screen width');
  assert.match(g, /new THREE\.InstancedMesh\(box, new THREE\.MeshLambertMaterial/, 'the tower: one instanced mesh of flat-shaded boxes');
  assert.match(g, /function draw\(run, tau, dt\)/);
  assert.match(g, /T = createTower\(run, \{ onPerfect: \(\) => \{ flashAge = 0; \}, onFall: fall \}, KEEP\);/, 'a perfect flashes the top (its face + its edge, white); the cut piece just falls away — from tower.js\'s hooks');
  assert.match(g, /plateMat\.opacity = fo \* fo \* 0\.9;/, 'the whole top face flashes (a thin outline alone was too weak on a light slab — the review)');
  const frame = g.slice(g.indexOf('function draw('), g.indexOf('return {', g.indexOf('function draw(')));
  assert.doesNotMatch(frame, /clientWidth|clientHeight|getBoundingClientRect|offsetWidth/, 'no layout read in the frame (sizes come from the ResizeObserver)');
  for (const f of ['engine.js', 'replay.js', 'tuning.js', 'logic.js']) assert.doesNotMatch(code(`js/games/highrise/${f}`), /performance\.|requestAnimationFrame/, `${f} never reads a frame clock`);
});

test('THE VIEW\'S TOWER == THE ENGINE\'S, HOWEVER THE EVENTS ARE BATCHED (tower.js — the review: two drops in one batch lost a slab): one batch, one event at a time, random chunks, a tap + the fuse together', () => {
  const rect = r => ({ x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1 });
  let cuts = 0, wholes = 0, flashes = 0;
  for (let i = 0; i < 40; i++) {
    const seed = `tw${i}`, mode = MODE_IDS[i % 3], run = createRun({ seed, mode }), bot = gaussBot({ sigmaMs: [60, 40, 25, 10][i % 4], seed }), ev = [];
    while (!isOver(run) && run.floor < 220) { stepTo(run, run.s0, ev); if (run.st !== 'slide' || !tap(run, bot(run), ev)) break; }
    if (!isOver(run)) stepTo(run, run.t + BEAT + FLOOR_TICKS_MAX, ev);
    assert.ok(isOver(run));
    // the batches: everything at once · one event a batch · chunks of 1–9 (a frame may hold two drops) · split right after every 'drop'
    let k = i + 1;
    const rnd = () => { k = (k * 1103515245 + 12345) % 2147483648; return k; };
    const ways = [
      [ev],
      ev.map(e => [e]),
      (() => { const out = []; for (let a = 0; a < ev.length;) { const n = 1 + rnd() % 9; out.push(ev.slice(a, a + n)); a += n; } return out; })(),
      (() => { const out = [[]]; for (const e of ev) { out[out.length - 1].push(e); if (e.e === 'drop') out.push([]); } return out; })(),
    ];
    for (const [w, batches] of ways.entries()) {
      const fresh = createRun({ seed, mode }), falls = [];
      let perfects = 0;
      const T = createTower(fresh, { onPerfect: () => perfects++, onFall: (r, floor, dx, dz, whole) => falls.push({ r: rect(r), whole }) }, 100000);
      for (const b of batches) T.feed(b);
      assert.deepEqual(rect(T.top()), rect(run), `${seed} way ${w}: the view's top slab = the engine's`);
      assert.equal(T.floor(), run.floor); assert.equal(T.slabs().length, run.floor + 1, 'one slab a floor (+ the base): none lost, none doubled');
      assert.equal(perfects, run.perfects);
      assert.equal(falls.filter(f => !f.whole).length, ev.filter(e => e.e === 'cut').length, 'a piece falls for every cut');
      assert.equal(falls.filter(f => f.whole).length, run.st === 'out' ? 1 : 0, 'the slab that missed / slipped falls whole');
      for (const f of falls) assert.ok(f.r.x1 > f.r.x0 && f.r.z1 > f.r.z0);
      if (!w) { cuts += falls.filter(f => !f.whole).length; wholes += falls.filter(f => f.whole).length; flashes += perfects; }
    }
  }
  assert.ok(cuts > 300 && wholes > 20 && flashes > 500, `cuts ${cuts}, whole falls ${wholes}, perfect flashes ${flashes}`);
  // the two repros of the review, by hand: two taps with no frame between · a tap, then THE FUSE, in one batch
  const a = createRun({ seed: 'two', mode: 'solo' }), ev = [];
  for (let n = 0; n < 2; n++) { stepTo(a, a.s0); let t = a.s0 + Math.floor(a.S / 2) - 6; assert.ok(tap(a, t, ev)); }
  const V = createTower(createRun({ seed: 'two', mode: 'solo' }));
  V.feed(ev);
  assert.deepEqual([V.floor(), V.slabs().length, rect(V.top())], [2, 3, rect(a)]);
  const b = createRun({ seed: 'hid', mode: 'solo' }), evb = [];
  stepTo(b, b.s0); tap(b, b.s0 + Math.floor(b.S / 2), evb); stepTo(b, 100000, evb);
  assert.deepEqual(evb.map(e => e.e), ['drop', 'perfect', 'land', 'spawn', 'drop', 'out']);
  const W = createTower(createRun({ seed: 'hid', mode: 'solo' }));
  W.feed(evb);
  assert.deepEqual([W.floor(), W.slabs().length], [1, 2], 'the floor that landed before the fuse is drawn');
  assert.doesNotMatch(code('js/games/highrise/tower.js'), /from '|document|window|THREE/, 'tower.js is pure: no import, no DOM, no three.js');
});
