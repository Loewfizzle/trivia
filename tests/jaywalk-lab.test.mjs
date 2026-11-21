// JAYWALK H1 — THE JAYWALK LAB (jaywalk-lab.html + js/games/jaywalk/lab.js · controls.js · graybox.js — docs/jaywalk.md "THE LAB"): the page
// ships at the site ROOT (never under tests/ — it deploys), noindex, OPEN since H2B (no gate, ZERO server calls), NO database write of any kind; the controls'
// rules (PURE): a tap fires on release, a swipe the moment it crosses its threshold. (The browser half: tests/integration/jaywalk-lab.mjs +
// THE PAGES LOAD — a stranger gets the lab, no door.)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { touchStory, dirOf, TAP_PX, SWIPE_PX } from '../js/games/jaywalk/controls.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

test('THE PAGE: at the site root (deployed), noindex nofollow, UNLISTED (nothing links to it), its own import map for three.js 0.160', () => {
  assert.ok(existsSync(new URL('../jaywalk-lab.html', import.meta.url)));
  const html = read('jaywalk-lab.html'), ignore = read('.vercelignore');
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
  assert.match(html, /<script type="importmap">\{ "imports": \{ "three": "https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/build\/three.module.js" \} \}<\/script>/);
  assert.match(html, /Opening the lab…/); assert.doesNotMatch(html, /Checking the door/);
  assert.match(html, /<script type="module" src="js\/games\/jaywalk\/lab\.js"><\/script>/);
  assert.ok(!/jaywalk/.test(ignore) && !/^\*\.html$/m.test(ignore), '.vercelignore keeps it (tests/ never deploys — this page does)');
  assert.match(read('scripts/serve.mjs'), /path === '\/jaywalk-lab'/, 'the local server maps /jaywalk-lab like Vercel\'s cleanUrls');
  assert.match(read('tests/integration/kit/page-loads.mjs'), /\['\/jaywalk-lab', "!!document\.querySelector\('#app \.jw-stage'\) && !document\.querySelector\('#app \.jw-deny'\)"\]/, 'THE PAGES LOAD: a stranger gets the lab — no door');
  // UNLISTED: no page, no script, no manifest links to it (a comment may name it; a link may not)
  for (const f of ['index.html', 'board.html', 'admin.html', 'lab.html', 'daychart.html', '404.html', 'manifest.webmanifest', 'sw.js', 'vercel.json']) assert.doesNotMatch(read(f), /jaywalk-lab/, `${f} never names it`);
  for (const f of readdirSync(new URL('../js/games/jaywalk/', import.meta.url))) assert.doesNotMatch(read(`js/games/jaywalk/${f}`).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1'), /jaywalk-lab/, `${f}: no link to the lab in code`);
  for (const f of ['js/config.js', 'js/app.js', 'js/screens/title.js', 'js/screens/title-dock.js']) assert.doesNotMatch(read(f), /jaywalk-lab/, `${f} never links to it`);
});

test('THE LAB IS OPEN (H2B — the owner: his brother tests it from a shared link): NO gate, NO sign-in, ZERO server calls; three.js + the scene still load lazily', () => {
  const lab = read('js/games/jaywalk/lab.js'), code = lab.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');
  assert.match(code, /async function boot\(\) \{\s*try \{ await mount\(\); \}\s*catch \(e\) \{ cantOpen\(/, 'the page simply opens');
  assert.doesNotMatch(code, /whoami|who\.admin|\bapi\(|profile\/api\.js|firebase\.js|initFirebase|localOpen|identity\.js/, 'no door, no whoami, no Firebase, no /api — nothing asks who is there');
  assert.doesNotMatch(code, /fetch\(|sendBeacon|XMLHttpRequest|WebSocket|EventSource/, 'the page makes no request of its own');
  assert.match(code, /if \(Q\.has\('debug'\)\) \{ try \{ Q\.delete\('debug'\); history\.replaceState\(/, '… and a &debug=1 link can\'t make the shared audio engine report (the flag is dropped first)');
  assert.match(read('js/audio/engine.js'), /const reportable = \(\) => \{ try \{ return document\.body\.classList\.contains\('rd-owner'\) \|\| \/\[\?&\]debug=1\(\?:&\|\$\)\/\.test\(location\.search\); \}/, 'the audio engine reports only from the owner\'s phone in the app, or with &debug=1');
  assert.doesNotMatch(code, /rd-owner/, 'the lab never marks a phone as the owner\'s');
  assert.doesNotMatch(code, /^import [^\n]*(graybox|three|night)/m, 'the views + three.js are never static imports of the page');
  assert.match(lab, /lazyImport\(import\('\.\/graybox\.js'\), '\.\/graybox\.js'\)/);
  assert.match(read('js/games/jaywalk/graybox.js'), /^import \* as THREE from 'three';/m);
  assert.match(code, /catch \{ app\.querySelector\('\.jw-stage'\)\.append\(h\('p\.jw-nogl',/, 'no WebGL: the page still loads and says so');
});

test('NO ROOM, NO DATABASE WRITES: the lab + its view + its controls never import a write, a room, the store or the host', () => {
  for (const f of ['lab.js', 'graybox.js', 'controls.js']) {
    const s = read(`js/games/jaywalk/${f}`).replace(/\/\/[^\n]*/g, '');
    for (const bad of [/(^|[^.\w])(set|update|remove|push|runTransaction|dbRef|onValue)\(/m, /from '[^']*firebase\.js'/, /from '[^']*\/(room|host|store|seat|identity)\.js'/, /fetch\(/, /sendBeacon/, /localStorage\.setItem/]) assert.doesNotMatch(s, bad, `${f}: ${bad}`);
  }
  const lab = read('js/games/jaywalk/lab.js');
  assert.equal((lab.replace(/\/\/[^\n]*/g, '').match(/\bapi\(/g) || []).length, 0, 'ZERO server calls (H2B: the gate is gone)');
  assert.match(lab, /replay\(\{ seed, mode, log(, cv: CV)? \}\)/, 'the run replayed after each end …');
  assert.match(lab, /REPLAY ≠ LIVE/, '… and a red line if the replay ≠ the live run');
  assert.match(lab, /Q\.get\('fps'\) === '1'/, 'the fps readout only with &fps=1');
  assert.match(lab, /if \(!started\) \{ if \(queue\.length \|\| bot\)/, 'tick 0 = the first touch');
});

test('THE CONTROLS (PURE): a tap fires on RELEASE (under ~12 px) · a swipe fires THE MOMENT it crosses its threshold, once · swipe down = back · a short flick still acts', () => {
  assert.ok(TAP_PX === 12 && SWIPE_PX > TAP_PX && SWIPE_PX <= 24);
  let t = touchStory(100, 100);
  assert.equal(t.move(104, 103), null, 'a small wobble is nothing');
  assert.equal(t.end(105, 104), 'u', 'a tap = a hop forward, on release');
  assert.equal(t.end(105, 104), null, 'once');
  t = touchStory(100, 100);
  assert.equal(t.move(110, 101), null); assert.equal(t.move(100 + SWIPE_PX, 101), 'r', 'the swipe fires as it crosses the threshold');
  assert.equal(t.move(160, 101), null, 'and only once'); assert.equal(t.end(160, 101), null, 'the lift adds nothing');
  assert.equal(touchStory(0, 0).move(-30, 4), 'l'); assert.equal(touchStory(0, 0).move(3, 30), 'd', 'swipe down = back'); assert.equal(touchStory(0, 0).move(-2, -30), 'u', 'a swipe up is a hop forward too');
  assert.equal(touchStory(0, 0).end(14, 2), 'r', 'a short flick (past a tap, short of a swipe) is its swipe — never dropped');
  assert.deepEqual([dirOf(5, 4), dirOf(-5, 4), dirOf(1, 9), dirOf(1, -9)], ['r', 'l', 'd', 'u']);
  const c = read('js/games/jaywalk/controls.js');
  assert.match(c, /el\.setAttribute\('data-tap-own', ''\);/, 'the play area keeps its own pointer events (THE TAP WATCH never touches it)');
  assert.doesNotMatch(c.replace(/\/\/[^\n]*/g, ''), /addEventListener\('click'/, 'never a click');
  assert.match(c, /addEventListener\('touchmove', no, \{ passive: false \}\)/, 'no page scroll under a finger');
  assert.match(read('css/jaywalk.css'), /\.jw-play \{[^}]*touch-action: none;/);
  assert.match(read('css/jaywalk.css'), /\.jw-stage \{[^}]*user-select: none;/);
});

test('THE GRAYBOX: THE CAMERA is camera.js (H2B — the proven rig: 16 up / 12 back), pooled lanes (30 alive), instanced boxes, the view interpolates — the rules never read the frame clock', () => {
  const g = read('js/games/jaywalk/graybox.js');
  assert.match(g, /import \{ CAM, createCamera \} from '\.\/camera\.js';/);
  assert.match(read('js/games/jaywalk/camera.js'), /export const CAM = Object\.freeze\(\{ fov: 54, up: 16, back: 12, width: 9\.42, kidAt: 0\.62 \}\);/);
  assert.match(g, /const BACK = 8, AHEAD = 22, POOL = BACK \+ AHEAD;/);
  assert.match(g, /new THREE\.InstancedMesh\(box, mat, n\)/);
  assert.match(g, /function draw\(run, course, a, dt\)/);
  for (const f of ['engine.js', 'course.js', 'replay.js', 'tuning.js']) assert.doesNotMatch(read(`js/games/jaywalk/${f}`).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, ''), /performance\.|requestAnimationFrame/, `${f} never reads a frame clock`);
});
