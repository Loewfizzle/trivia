// FREEFALL F1 — THE FREEFALL LAB (freefall-lab.html + js/games/freefall/lab.js · graybox.js — docs/freefall.md "THE LAB"): the page ships
// at the site ROOT (it deploys), noindex, linked from nowhere — and **THE LAB NEVER COUNTS**: zero server calls, zero database writes,
// nothing from /api, the profile, progression, the report, share or the cards. This file is the STATIC half (THE UNIT JOB INSTALLS
// NOTHING: no browser here) — the lab's WHOLE module graph is walked and proven clean; the BROWSER half (the lab at 390 × 844, a run
// through real drags, the network log, REPLAY = LIVE ✓, the shots) is tests/integration/freefall-lab.mjs, run outside the sandbox.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';

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
  assert.ok(existsSync(new URL('../freefall-lab.html', import.meta.url)));
  const html = read('freefall-lab.html'), ignore = read('.vercelignore');
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
  assert.equal(html.match(/<script type="importmap">[^<]+<\/script>/)[0], read('highrise-play.html').match(/<script type="importmap">[^<]+<\/script>/)[0], 'the same three.js 0.160 import map as HIGH RISE\'s test page');
  assert.match(html, /three@0\.160\.0\/build\/three\.module\.js/);
  assert.match(html, /<script type="module" src="js\/games\/freefall\/lab\.js" onerror=/, 'its one script (a failed load says so — never a blank page)');
  assert.match(html, /Opening the lab…/);
  // its only files: the icon, its own stylesheet, its own script; the only outside address: three.js
  const urls = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(urls, ['assets/favicon-64.png', 'css/freefall-lab.css', 'js/games/freefall/lab.js']);
  assert.deepEqual([...html.matchAll(/https?:\/\/[^\s"'<>]+/g)].map(m => m[0]), ['https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js'], 'no web font, no other host');
  assert.doesNotMatch(read('css/freefall-lab.css'), /url\(|@import|@font-face/, 'its stylesheet loads nothing');
  assert.ok(!/freefall/.test(ignore) && !/^\*\.html$/m.test(ignore), '.vercelignore keeps it (it deploys)');
  assert.match(read('scripts/serve.mjs'), /path === '\/freefall-lab'/, 'the local server maps /freefall-lab like Vercel\'s cleanUrls');
  assert.match(read('tests/integration/kit/page-loads.mjs'), /\['\/freefall-lab', "!!document\.querySelector\('#app \.ff-stage'\)"\]/, 'THE PAGES LOAD: a stranger gets the lab\'s stage');
  // UNLISTED: no page, no script, no manifest names it
  for (const f of ['index.html', 'board.html', 'admin.html', 'lab.html', 'daychart.html', 'jaywalk-lab.html', 'highrise-play.html', '404.html', 'manifest.webmanifest', 'sw.js', 'vercel.json']) assert.doesNotMatch(read(f), /freefall/i, `${f} never names it`);
  for (const f of readdirSync(new URL('../js/games/freefall/', import.meta.url))) assert.doesNotMatch(code(`js/games/freefall/${f}`), /freefall-lab/, `${f}: no link to the lab in code`);
});

test('FREEFALL IS HIDDEN FROM PLAYERS (F1 → F4A: THE HIDDEN CARTRIDGE): a `preview` GAMES row — never playable, the owner\'s live test only; no DAILIES row, no sign, no title / dock / console code knows it; the only endpoint that reads it is the report (behind THE SWITCH, OFF)', async () => {
  const { GAMES, DAILIES, FROZEN_IDS, isPlayable, isOwnerTest } = await import('../js/config.js');
  const row = GAMES.find(g => g.id === 'freefall');
  assert.ok(row && row.playable === false && row.preview === true && !row.live, 'the GAMES row: playable false + preview (THE OWNER\'S LIVE TEST)');
  assert.equal(isPlayable('freefall'), false, 'nobody may start it (this is not the owner\'s phone, not a local preview page)');
  assert.equal(isOwnerTest('freefall'), false);
  assert.ok(!FROZEN_IDS.includes('freefall'), 'being built — not frozen');
  assert.ok(!DAILIES.some(d => d.id === 'freefall'), 'no DAILIES row: the daily stays off');
  for (const f of ['js/app.js', 'js/games/cartridge.js', 'js/games/contract.js', 'js/games/preload.js', 'js/screens/title.js', 'js/screens/title-dock.js', 'js/core/game-order.js', 'js/core/harbor-neon.js', 'index.html']) {
    assert.doesNotMatch(read(f), /freefall/i, `${f} does not know FREEFALL`);
  }
  const dir = readdirSync(new URL('../js/games/freefall/', import.meta.url)).sort();
  assert.deepEqual(dir, ['audition.js', 'bakedtext.js', 'banner.js', 'best.js', 'billboard.js', 'bot.js', 'break-fx.js', 'breaks.js', 'card.js', 'day-fx.js', 'director.js', 'empty.js', 'endscreen.js', 'engine.js', 'final.js', 'ghost-fx.js', 'ghosts.js', 'graybox.js', 'index.js', 'lab.js', 'lines.js', 'logic.js', 'match.js', 'matchhud.js', 'matchsim.js', 'meta.js', 'night-fx.js', 'night.js', 'palettes.js', 'play.js', 'proof.js', 'replay.js', 'send.js', 'sfx.js', 'share.js', 'shot.js', 'sounds.js', 'stage.js', 'tower-gen.js', 'tuning.js', 'veil.js', 'view.js'], 'F1 – F3B\'s files + F4A\'s cartridge: director · final · index · lines · meta · proof · view + F4B\'s SHARE CARD: share · shot + FIX C: empty (the page\'s control) · veil (the darkness in the canvas)');
  // the endpoints: the REPORT alone reads FREEFALL (the solo run's proof node, behind THE SWITCH) — the 8 stay 8
  const fns = readdirSync(new URL('../api/', import.meta.url)).filter(n => n.endsWith('.js'));
  assert.equal(fns.length, 8);
  for (const f of fns.filter(n => n !== 'report.js')) assert.doesNotMatch(read(`api/${f}`), /freefall/i, `api/${f}: no endpoint wiring`);
  assert.match(read('api/_lib/freefall.js'), /export const FREEFALL_COUNTS = false;/, 'THE SWITCH is OFF: judged, never awarded');
  // THE DAILY MODE is daily-ready only: it lives in the engine + the judge, and NOTHING turns it on
  assert.match(read('js/games/freefall/tuning.js'), /daily: \{ finish: 200, capTicks: 3 \* 60 \* TICK_HZ, holds: 0 \}/);
  for (const n of readdirSync(new URL('../js/daily/', import.meta.url)).filter(x => x.endsWith('.js'))) assert.doesNotMatch(read(`js/daily/${n}`), /freefall/i, `js/daily/${n}: no daily path`);
  for (const n of readdirSync(new URL('../api/_lib/', import.meta.url)).filter(x => x.endsWith('.js') && !['freefall.js', 'trust-lists.js', 'catalog.js', 'lab-text.js', 'share-card.js'].includes(x))) assert.doesNotMatch(read(`api/_lib/${n}`), /freefall/i, `api/_lib/${n}: no daily path, no other wiring`);
  // (F4B — THE SHARE CARD: share-card.js#RUN_GAMES names it — a run's card is taken only with the server's own COUNTED result: none while THE SWITCH is off)
  assert.match(read('api/_lib/share-card.js'), /export const RUN_GAMES = Object\.freeze\(\['jaywalk', 'highrise', 'freefall'\]\)/);
});

test('THE LAB NEVER COUNTS — its WHOLE module graph: only its own engine files + the integer hash + three.js; nothing from /api, the profile, progression, the report, share, the cards, Firebase, the store', () => {
  const g = graph('js/games/freefall/lab.js');
  assert.deepEqual(g.files, ['js/core/rng.js', 'js/games/freefall/engine.js', 'js/games/freefall/graybox.js', 'js/games/freefall/lab.js', 'js/games/freefall/logic.js', 'js/games/freefall/replay.js', 'js/games/freefall/tower-gen.js', 'js/games/freefall/tuning.js'], 'every module the page loads');
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
  assert.ok(!g.files.includes('js/games/freefall/bot.js'));
  assert.ok(!g.files.some(f => f.startsWith('api/')));
});

test('THE LAB\'s RUN: a drag ANYWHERE spins the tower 1 : 1 · FAIR INPUT (each move at its own event time → its tick, coalesced samples too) · MAX SPIN\'s rest offered again tick by tick · the moves BEFORE the landings · the replay through a FRESH engine + the judge after every run · ?mode= ?seed= ?fps=1 · RESTART', () => {
  const lab = read('js/games/freefall/lab.js'), s = code('js/games/freefall/lab.js'), css = read('css/freefall-lab.css');
  assert.match(s, /play\.addEventListener\('pointerdown', e => \{/); assert.match(s, /play\.addEventListener\('pointermove', e => \{/);
  assert.doesNotMatch(s, /addEventListener\('click'/, 'never a click');
  assert.match(s, /carry \+= \(s\.clientX - drag\.x\) \* TURN \/ \(2 \* Math\.PI \* view\.pxPerRad\(\)\);/, '1 : 1 — the finger\'s pixels → the ring\'s own radians → angle units');
  assert.match(s, /typeof e\.getCoalescedEvents === 'function' \? e\.getCoalescedEvents\(\) : null/, 'every sample the browser gathered, each at its own time (a 120 Hz finger = a 60 Hz one)');
  assert.match(s, /const T = tickOf\(ts, t0\);/, 'a move\'s event time → its tick');
  assert.match(read('js/games/freefall/logic.js'), /export const tickOf = \(ms, t0\) => Math\.round\(\(ms - t0\) \* TICK_HZ \/ 1000\) \+ 0;/, 'the nearest tick');
  assert.match(s, /owed -= turn\(run, T, owed, ev\);/, 'the engine\'s own turn(): it clamps to MAX SPIN and logs the move');
  assert.match(s, /function settle\(T\) \{\s*for \(let t = Math\.max\(run\.mt \+ 1, run\.ll \+ 1\); t <= T && owed !== 0 && !isOver\(run\); t\+\+\) \{ owed -= turn\(run, t, owed, ev\);/, 'what MAX SPIN held back is offered again, tick by tick');
  assert.match(s, /settle\(T\);[^\n]*\n\s*stepTo\(run, T, ev\);/, 'in a frame: the moves first, THEN the landings up to that tick');
  assert.match(s, /if \(t0 == null\) begin\(stamp\(e\.timeStamp\)\);/, 'tick 0 = the START touch');
  assert.match(s, /replay\(\{ seed, mode, log, ev: evR \}\)/, 'the recorded log replayed after each run through a FRESH engine, event by event');
  assert.match(s, /const verdict = judgeRun\(\{ seed, mode, log \}\);/, '… and THE JUDGE re-plays it');
  assert.match(lab, /REPLAY = LIVE ✓/); assert.match(lab, /REPLAY ≠ LIVE ✗ · first differs at tick/, 'a red line + the first differing tick if it ever differs');
  assert.match(s, /const LAB_MODES = \['solo', 'match'\];/); assert.match(s, /LAB_MODES\.includes\(Q\.get\('mode'\)\) \? Q\.get\('mode'\) : 'solo'/);
  assert.match(s, /const FIXED = \(Q\.get\('seed'\) \|\| ''\)\.replace\(\/\[\^!-~\]\/g, ''\)\.slice\(0, SEED_MAX\);/); assert.match(s, /Q\.get\('fps'\) === '1'/);
  assert.match(lab, /'RESTART'/); assert.match(s, /press\(restartB, \(\) => restart\(\)\);/); assert.match(s, /press\(again, \(\) => restart\(\)\);/);
  assert.match(s, /stats\.textContent = `CLEAN \$\{run\.clean\} · BLAZE \$\{run\.blaze \? 'ON' : '—'\} · DARK \$\{gap\}`;/, 'the plain-text HUD: FLOOR · CLEAN · BLAZE · DARK');
  assert.match(s, /areaN\.textContent = areaOf\(run\.floor\)\.name;/); assert.match(s, /endT\.textContent = endWords\(live\);/, 'the area + the cause\'s words = the game\'s own tables');
  assert.match(s, /catch \{ stage\.append\(el\('p', 'ff-nogl',/, 'no WebGL: the page still loads and says so');
  assert.match(css, /\.ff-play \{[^}]*touch-action: none;[^}]*-webkit-tap-highlight-color: transparent;/, 'no page scroll, no tap flash over the play');
  assert.match(css, /\.ff-btn, \.ff-tab \{[^}]*height: 48px;/); assert.match(css, /\.ff-restart \{[^}]*height: 44px;/, 'every button ≥ 44 pt');
  assert.doesNotMatch(css, /border-radius: (9999|999|[1-9]\d)px|border-radius: 50%/, 'NO PILLS');
  assert.doesNotMatch(css, /:hover/, 'no hover styles');
});

test('THE GRAYBOX: the pillar, ring floors of 12 slices (the gaps open, RED clearly red), the ball at the front; the camera looks down the shaft — the ball\'s floor ≈ 30 % down the screen; it eases the ball between landings itself — the rules never read the frame clock', () => {
  const g = read('js/games/freefall/graybox.js'), s = code('js/games/freefall/graybox.js');
  assert.match(g, /^import \* as THREE from 'three';/m);
  assert.match(g, /export const CAM = Object\.freeze\(\{ fov: 46, pitch: 33, fill: 0\.8, ballY: 0\.34, aspectMax: 0\.47 \}\);/);
  assert.match(g, /export const SHAPE = Object\.freeze\(\{ H: 1, RO: 1, RI: 0\.3, RB: 0\.66, R_BALL: 0\.14, THICK: 0\.1, HOP: 0\.42 \}\);/);
  // a 1-slice gap still fits the ball: the gap's width where the ball rides > the ball
  const RB = 0.66, R_BALL = 0.14;
  assert.ok(2 * Math.PI * RB / 12 > 2 * R_BALL * 1.2, `a 1-slice gap is ${(2 * Math.PI * RB / 12).toFixed(3)} wide at the ball's ring, the ball ${(2 * R_BALL).toFixed(2)}`);
  assert.match(g, /red: 0xff2a3d/, 'RED is red');
  assert.match(g, /const RED_RISE = 0\.07;/); assert.match(s, /const rise = kind === RED \? RED_RISE : 0;/, '… and never by colour alone: a red slice stands proud of the floor (a shape)');
  assert.match(read('css/freefall-lab.css'), /\.ff-dark \{[^}]*radial-gradient\(ellipse 62% 46% at 50% 44%, rgba\(0, 0, 0, 0\) 58%/, 'THE DARKNESS closes in from the edges — never over the ball or its floor');
  assert.match(s, /new THREE\.InstancedMesh\(wedge, new THREE\.MeshLambertMaterial/, 'every solid slice in sight: one instanced mesh of flat-shaded wedges');
  assert.match(s, /if \(kind === GAP \|\| \(\(gone >> s\) & 1\)\) continue;/, 'a gap is simply not there — nor is a slice THE BLAZE broke');
  assert.match(s, /tower\.rotation\.y = run\.a \* UNIT;/, 'the tower stands at the RULES\' own angle — what you see is what the landing reads');
  assert.match(s, /function draw\(run, tau, dt\)/);
  const frame = g.slice(g.indexOf('function draw('), g.indexOf('return {', g.indexOf('function draw(')));
  assert.doesNotMatch(frame, /clientWidth|clientHeight|getBoundingClientRect|offsetWidth/, 'no layout read in the frame (sizes come from the ResizeObserver)');
  for (const f of ['engine.js', 'replay.js', 'tuning.js', 'logic.js', 'tower-gen.js']) assert.doesNotMatch(code(`js/games/freefall/${f}`), /performance\.|requestAnimationFrame/, `${f} never reads a frame clock`);
});
