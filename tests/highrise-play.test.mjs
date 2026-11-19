// HIGH RISE S2 — THE TEST PAGE (highrise-play.html + js/games/highrise/play.js · night.js · night-fx.js · bands.js · best.js · camera.js ·
// sounds.js · sfx.js · audition.js — docs/highrise.md "THE TEST PAGE"): the real game's night look + SOLO on an UNLISTED page, and
// **NOTHING COUNTS UNTIL GO-LIVE** — zero server calls, zero database writes, nothing from /api, the profile, progression, the report,
// share or the cards; YOUR BEST = this phone only. This file is the STATIC half (THE UNIT JOB INSTALLS NOTHING: no browser, no three.js)
// + the PURE view modules' own rules; the BROWSER half is tests/integration/highrise-play.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { CAM, camDist, SLAB_H } from '../js/games/highrise/camera.js';
import { BANDS, FADES, SLACK, bandAt, plateMix, plateDrift, SLAB_SETS, setColor, slabColor } from '../js/games/highrise/bands.js';
import { BEST_KEY, cleanBest, bestView, crossedBest, nextBest, tagY } from '../js/games/highrise/best.js';
import { SOUNDS, SOUND_IDS, SOUND_FILES, VOICES, DROP_VARY, FALL_DELAY_S, STREAK_EVERY, CHIME_STEPS, chimeRate, admit, cuesOf } from '../js/games/highrise/sounds.js';
import { createRun, stepTo, tap, isOver, paletteFor } from '../js/games/highrise/engine.js';
import { gaussBot } from '../js/games/highrise/bot.js';
import { PALETTE_N, TIGHT, CLOUDS_FLOOR, TOP_FLOOR } from '../js/games/highrise/tuning.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const code = f => read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');
const posix = p => normalize(p).split('\\').join('/');
/** every module the page can load: its script + every static AND dynamic import, followed to the end ('three' = the import map's CDN) */
function graph(entry) {
  const seen = new Set(), bare = new Set(), todo = [entry];
  while (todo.length) {
    const f = todo.pop();
    if (seen.has(f)) continue;
    seen.add(f);
    const s = code(f);
    const specs = [...s.matchAll(/(?:^|\n)\s*(?:import|export)\s[^'"\n]*?from\s*['"]([^'"]+)['"]|(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g)].map(m => m[1] || m[2]).concat([...s.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g)].map(m => m[1]));
    for (const spec of specs) { if (spec.startsWith('.')) todo.push(posix(join(dirname(f), spec))); else bare.add(spec); }
  }
  return { files: [...seen].sort(), bare: [...bare].sort() };
}
const HI = 'js/games/highrise/';

test('THE PAGE: at the site root (deployed), noindex nofollow, UNLISTED (nothing links to it), three.js 0.160 through the same import map as the labs', () => {
  assert.ok(existsSync(new URL('../highrise-play.html', import.meta.url)));
  const html = read('highrise-play.html'), ignore = read('.vercelignore');
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
  assert.equal(html.match(/<script type="importmap">[^<]+<\/script>/)[0], read('jaywalk-lab.html').match(/<script type="importmap">[^<]+<\/script>/)[0], 'the same three.js import map');
  assert.match(html, /<script type="module" src="js\/games\/highrise\/play\.js" onerror=/, 'its one script (a failed load says so — never a blank page)');
  const urls = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(urls.filter(u => !/^https:\/\/fonts\.(googleapis|gstatic)\.com/.test(u)), ['assets/favicon-64.png', 'css/base.css', 'css/components.css', 'css/highrise-play.css', 'js/games/highrise/play.js'], 'its own files + the fonts — nothing else');
  assert.deepEqual([...new Set([...html.matchAll(/https?:\/\/[^\s"'<>/]+/g)].map(m => m[0]))].sort(), ['https://cdn.jsdelivr.net', 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'], 'the only outside hosts: three.js + the fonts');
  assert.ok(!/highrise/.test(ignore) && !/^\*\.html$/m.test(ignore), '.vercelignore keeps it (it deploys)');
  assert.match(read('scripts/serve.mjs'), /path === '\/highrise-play'/, 'the local server maps /highrise-play like Vercel\'s cleanUrls');
  assert.match(read('tests/integration/kit/page-loads.mjs'), /\['\/highrise-play', "!!document\.querySelector\('#app \.hi-stage'\)"\]/, 'THE PAGES LOAD: a stranger gets the game\'s stage');
  // UNLISTED: no page, no script, no manifest names it
  for (const f of ['index.html', 'board.html', 'admin.html', 'lab.html', 'daychart.html', 'jaywalk-lab.html', 'highrise-lab.html', '404.html', 'manifest.webmanifest', 'sw.js', 'vercel.json']) assert.doesNotMatch(read(f), /highrise-play/i, `${f} never names it`);
  for (const f of readdirSync(new URL(`../${HI}`, import.meta.url))) assert.doesNotMatch(code(`${HI}${f}`), /highrise-play|highrise-lab/, `${f}: no link to a HIGH RISE page in code`);
  assert.doesNotMatch(read('css/highrise-play.css'), /border-radius: (9999|999|[1-9]\d)px|border-radius: 50%/, 'NO PILLS');
  assert.doesNotMatch(read('css/highrise-play.css'), /url\(|@import|@font-face/, 'its stylesheet loads nothing');
});

test('HIGH RISE IS STILL INVISIBLE TO PLAYERS (S2): no GAMES entry, no DAILIES row, no config / boot / cartridge / registry / rules / endpoint knows it', () => {
  for (const f of ['js/config.js', 'js/app.js', 'js/games/registry.js', 'js/games/cartridge.js', 'js/games/preload.js', 'js/games/preload-graph.js', 'js/screens/title.js', 'js/screens/title-dock.js', 'js/core/game-order.js', 'database.rules.json', 'index.html', 'js/ui/credits.js', 'js/ui/help.js']) {
    assert.doesNotMatch(read(f), /highrise|HIGH RISE/i, `${f} does not know HIGH RISE`);
  }
  const dir = readdirSync(new URL(`../${HI}`, import.meta.url)).sort();
  assert.deepEqual(dir, ['audition.js', 'bands.js', 'best.js', 'bot.js', 'camera.js', 'engine.js', 'graybox.js', 'lab.js', 'logic.js', 'night-fx.js', 'night.js', 'play.js', 'replay.js', 'sfx.js', 'sounds.js', 'tower.js', 'tuning.js'], 'S2\'s files: still no meta.js / index.js / view.js — nothing a console could load as a game');
  for (const f of readdirSync(new URL('../api/', import.meta.url)).filter(n => n.endsWith('.js'))) assert.doesNotMatch(read(`api/${f}`), /highrise/i, `api/${f}: no endpoint wiring (counting = S4)`);
});

test('NOTHING COUNTS UNTIL GO-LIVE — the page\'s WHOLE module graph (static + lazy): its own files, the kit\'s tiers, the shared sheet + audio engine, three.js; nothing from /api, the profile, progression, the report, share, the cards, Firebase, the store', () => {
  const g = graph(`${HI}play.js`);
  const own = g.files.filter(f => f.startsWith(HI)).map(f => f.slice(HI.length));
  assert.deepEqual(own, ['audition.js', 'bands.js', 'best.js', 'camera.js', 'engine.js', 'logic.js', 'night-fx.js', 'night.js', 'play.js', 'replay.js', 'sfx.js', 'sounds.js', 'tower.js', 'tuning.js'], 'the game\'s own modules (never the lab\'s, never the sim bots)');
  assert.deepEqual(g.files.filter(f => !f.startsWith(HI)), ['js/audio/engine.js', 'js/audio/leave-text.js', 'js/audio/settings.js', 'js/audio/sound-state.js', 'js/core/bot-ua.js', 'js/core/rng.js', 'js/errlog.js', 'js/games/kit/tiers.js', 'js/ui/dom.js', 'js/ui/layers.js', 'js/ui/lazy-import.js', 'js/ui/sheet.js'], 'the shared modules: the integer hash, the tiers, the DOM helper + THE SHEET, the skew wrapper, the audio engine (+ what IT may load lazily: its leave text, the quiet counter) — the JAYWALK lab\'s kind');
  assert.deepEqual(g.bare, ['three'], 'the one outside module: three.js (the import map)');
  for (const f of g.files) assert.ok(!/\/(profile|progress|board|daily|vault|chat|admin|screens)\/|js\/(firebase|store|room|host|identity|seat|app|config)\.js|^api\//.test(f), `${f}: nothing that counts is in the graph`);
  // THE DOOR: the shared audio engine COUNTS a leave once (errlog.js#countQuiet → /api/log) and the skew wrapper may ask /api/time — on
  // THIS page every request to /api/ is stopped before it leaves the phone (the browser check hides the page with its sound on: 0 calls)
  const door = code(`${HI}play.js`);
  assert.ok(door.includes("const toApi = u => { try { return new URL(String((u && u.url) || u), location.href).pathname.startsWith('/api/'); } catch { return false; } };"));
  assert.ok(door.includes("window.fetch = (u, o) => (toApi(u) ? Promise.reject(new TypeError('this page never calls the server')) : pageFetch(u, o));"));
  assert.ok(door.includes('if (pageBeacon) navigator.sendBeacon = (u, d) => (toApi(u) ? true : pageBeacon(u, d));'));
  assert.ok(door.indexOf('window.fetch = ') > 0 && door.indexOf('window.fetch = ') < door.indexOf('function mount()'), 'the door is shut before the page mounts (before the audio engine is ever installed)');
  assert.ok(read('js/errlog.js').includes("navigator.sendBeacon && navigator.sendBeacon('/api/log', blob))) fetch('/api/log'"), '(the quiet counter goes through sendBeacon / fetch — the two the door holds)');
  const doorText = door.slice(door.indexOf('const toApi'), door.indexOf('const newSeed'));
  for (const f of own) {
    const s = code(`${HI}${f}`).replace(doorText, '');
    assert.doesNotMatch(s, /XMLHttpRequest|sendBeacon|WebSocket|EventSource|navigator\.serviceWorker|importScripts/, `${f}: no beacon, no socket`);
    assert.doesNotMatch(s, /firebase|initFirebase|\/api\/|['"`]\/?api\b|whoami|identity|errlog|\bstore\.|reportError|countQuiet/i, `${f}: no server, no Firebase, no report`);
    assert.doesNotMatch(s, /(^|[^.\w])(set|update|remove|push|runTransaction|onValue)\(\s*(ref|dbRef)\b/m, `${f}: no database write`);
    assert.doesNotMatch(s, /sessionStorage|indexedDB|document\.cookie|caches\./, `${f}: no other storage`);
  }
  // the ONE fetch: the sounds' own files; the pictures come through three's loader — both from the page's own folders
  assert.deepEqual(own.filter(f => /(^|[^.\w])fetch\s*\(/.test(code(`${HI}${f}`))), ['sfx.js'], 'only sfx.js fetches');
  assert.match(code(`${HI}sfx.js`), /const DIR = new URL\('\.\.\/\.\.\/\.\.\/audio\/highrise\/', import\.meta\.url\);/); assert.match(code(`${HI}sfx.js`), /fetch\(new URL\(`\$\{f\}\.wav\?v=\$\{HI_SFX_REV\}`, DIR\)\)/, '… its own WAVs');
  assert.match(code(`${HI}night.js`), /const ART = new URL\('\.\.\/\.\.\/\.\.\/assets\/highrise\/', import\.meta\.url\);/);
  // the ONLY thing stored: this phone's best + its audition picks (`hi:play:*`)
  const stores = own.filter(f => /localStorage/.test(code(`${HI}${f}`)));
  assert.deepEqual(stores, ['play.js', 'sfx.js']);
  assert.equal(BEST_KEY, 'hi:play:best'); assert.match(code(`${HI}sfx.js`), /const KEY = 'hi:play:snd:';/);
  assert.match(code(`${HI}play.js`), /localStorage\.getItem\(BEST_KEY\)/); assert.match(code(`${HI}play.js`), /localStorage\.setItem\(BEST_KEY, String\(n\)\)/);
  assert.equal((code(`${HI}play.js`).match(/localStorage\./g) || []).length, 2, 'play.js: the best, read + written — nothing else');
  // every dynamic import through THE SKEW WRAPPER; a &debug=1 link can't make the shared audio engine report
  const play = code(`${HI}play.js`);
  for (const m of play.matchAll(/\bimport\(/g)) assert.equal(play.slice(m.index - 11, m.index), 'lazyImport(', 'every dynamic import through lazyImport');
  assert.match(play, /if \(Q\.has\('debug'\)\) \{ try \{ Q\.delete\('debug'\); history\.replaceState\(/);
  assert.doesNotMatch(play, /rd-owner/);
  // the rules never import a view
  for (const f of ['tuning.js', 'engine.js', 'logic.js', 'replay.js']) assert.doesNotMatch(code(`${HI}${f}`), /night|bands|best\.js|sounds|sfx|play\.js|three/, `${f} (the rules) never imports the view`);
});

test('THE RUN ON THE PAGE: FAIR TAPS, tick 0 = the START touch, a beat\'s tap never logged, NO PAUSE (the clock runs on behind a hidden tab), REPLAY = LIVE after every run, SOLO', () => {
  const s = code(`${HI}play.js`), raw = read(`${HI}play.js`);
  assert.match(s, /play\.addEventListener\('pointerdown', e => \{ if \(e\.pointerType === 'mouse' && e\.button !== 0\) return; touch\(e\.timeStamp\); \}\);/, 'a tap = the pointerdown, at its own timeStamp');
  assert.doesNotMatch(s, /addEventListener\('click'/, 'never a click');
  assert.match(s, /const tk = tickOf\(ts, t0\);\s*if \(tap\(run, tk, ev\)\) taps\.push\(tk\);/, 'the touch\'s time → its tick → the engine\'s own tap(): logged only when it dropped a slab');
  assert.match(s, /if \(t0 == null\) \{ begin\(ts\); return; \}/, 'tick 0 = the START touch (never a drop)');
  assert.match(s, /tau = Math\.max\(0, \(now - t0\) \/ TICK_MS\);/, 'the run is on the page\'s clock from the start touch — nothing pauses it');
  assert.doesNotMatch(s, /visibilitychange'[^\n]*t0\s*[+-]?=/, 'a hidden tab never moves the run\'s start (NO PAUSE: THE FUSE ends it — TOO SLOW)');
  assert.match(s, /const MODE = MODE_IDS\.includes\(Q\.get\('mode'\)\) \? Q\.get\('mode'\) : 'solo';/, 'the page is SOLO (`?mode=` is the pass\'s own check of the finish + the cap)');
  assert.match(s, /replay\(\{ seed, mode: MODE, taps \}\)/); assert.match(s, /const fresh = createRun\(\{ seed, mode: MODE \}\), evR = \[\];/, 'the recorded log replayed through a FRESH engine, event by event');
  assert.match(raw, /REPLAY = LIVE ✓/); assert.match(raw, /REPLAY ≠ LIVE ✗ · first differs at tick/);
  assert.match(s, /const RETRY_MS = 600;/); assert.match(s, /if \(shown\) \{ if \(now - overAt > RETRY_MS\) \{ restart\(\); begin\(ts\); \} return; \}/, 'the end card stays 0.6 s before a tap is PLAY AGAIN');
  assert.match(s, /const begin = ts => \{ t0 = ts; start\.hidden = true; soundsBtn\.hidden = true; note\.hidden = true;/, 'while a run is LIVE the SOUNDS button is off the screen: a thumb anywhere is a drop');
  assert.match(s, /T\.feed\(ev\); view\.events\(ev\);/, 'the tower is tower.js\'s (the engine\'s own land events) — then the view\'s moments');
  assert.ok(s.includes("catch { stage.append(noGL()); return; }") && s.includes("const noGL = () => h('p.hi-nogl',"), 'no WebGL: the page still loads and says so');
  // NO LAYOUT READ IN THE FRAME — nor in what the frame calls (the review: say() + moments() forced a layout on every perfect): the
  // ONLY layout reads of the whole page are sized()'s, a ResizeObserver's
  const layout = /clientWidth|clientHeight|getBoundingClientRect|offsetWidth|offsetHeight|offsetTop|scrollWidth|scrollHeight|getComputedStyle/g;
  assert.equal(s.replace('function sized() { stageH = stage.clientHeight; hudFoot = hud.offsetTop + hud.offsetHeight; }', '').match(layout), null, 'no layout read anywhere but sized()');
  assert.ok(s.includes('new ResizeObserver(sized).observe(stage); new ResizeObserver(sized).observe(hud);'));
  assert.ok(s.includes("if (call.animate) callAnim = call.animate(POP, { duration: ms, fill: 'both' }); else call.style.opacity = '1';"), 'the announcer\'s one-shot = the Web Animations API (opacity + transform), restarted without a reflow');
  assert.doesNotMatch(read('css/highrise-play.css'), /@keyframes (?!hi-breathe)/, 'the only CSS keyframes left: the two breathing lines (opacity)');
  // THE END HOLD holds for EVERY end — THE FUSE's (in the frame) and a TAP's (in the touch handler: the review)
  assert.ok(s.includes('if (isOver(run) && !endedAt) endedAt = now;') && s.includes('if (isOver(run) && !shown && now - endedAt >= END_HOLD_MS) showEnd(now);'));
  assert.equal((s.match(/endedAt = now/g) || []).length, 1, 'ONE place sets the end\'s time: the frame that first sees the run over');
  assert.match(s, /const END_HOLD_MS = 700;/);
  assert.ok(s.includes("document.addEventListener('keydown', e => { if (sheetOpen) return;"), 'the SOUNDS sheet keeps its own keys');
  // THE LOST CONTEXT: rebuilt on the same tower; the listeners come off before any destroy
  assert.match(s, /const onLost = e => \{ e\.preventDefault\(\); if \(!lostTimer\) lostTimer = setTimeout\(rebuild, 1500\); \};/);
  assert.match(s, /function rebuild\(\) \{\s*clearTimeout\(lostTimer\); lostTimer = 0;\s*offGL\(\);\s*try \{ view\.destroy\(\); \}/, 'offGL BEFORE destroy (its own forceContextLoss is never "lost")');
  assert.ok(s.includes('view.adopt(run, T, false); view.setBest(tapeFloor); if (shown) view.rest();'), '… the same tower, the tape on ITS OWN floor (not the best the end card moved on)');
  // a rebuild that gets NO context keeps trying (the review: one failure used to end the page until a reload)
  assert.ok(s.includes('view = NO_VIEW; hook.view = view;') && s.includes('if (++tries <= 8) lostTimer = setTimeout(rebuild, 1500);'));
  assert.ok(s.includes("if (glDown && document.visibilityState === 'visible') { tries = 0; rebuild(); }"), '… and at once when the page is back in front');
  assert.ok(s.includes('if (glDown) { glDown.remove(); glDown = null; }'), 'the "no WebGL" line leaves when the scene is back');
  assert.match(read('css/highrise-play.css'), /\.hi-play \{[^}]*touch-action: none;[^}]*-webkit-tap-highlight-color: transparent;/);
  assert.match(read('css/highrise-play.css'), /\.hi-snd \{[^}]*min-height: 44px; min-width: 44px;/, 'the corner button ≥ 44 pt');
});

test('THE CAMERA: the lab\'s diagonal camera, pinned equal (45° turn, 33° down, a 20° lens, the first slab 60 % of the screen — of a phone-shaped column on a wide one)', () => {
  assert.deepEqual({ ...CAM }, { fov: 20, yaw: 45, pitch: 33, fill: 0.6, aspectMax: 0.62, lift: 0.5 });
  const lab = read(`${HI}graybox.js`).match(/export const CAM = Object\.freeze\((\{[^}]+\})\);/)[1];
  assert.deepEqual((0, eval)(`(${lab})`), { ...CAM }, 'camera.js#CAM == graybox.js#CAM');
  assert.equal(SLAB_H, 0.14); assert.match(read(`${HI}graybox.js`), /const H = 0\.14;/, 'the same slab thickness as the graybox');
  // the first slab (√2 wide seen corner-on) = 60 % of the screen width: half the view's width at the camera's distance × 0.6 = √2 / 2
  for (const a of [375 / 667, 390 / 844, 430 / 932]) { const d = camDist(a), half = d * Math.tan(10 * Math.PI / 180) * a; assert.ok(Math.abs(Math.SQRT2 / 2 / half - 0.6) < 1e-9, `aspect ${a.toFixed(3)}`); }
  assert.equal(camDist(1.6), camDist(0.62), 'a wide screen: the phone column\'s distance (DESKTOP COMES FREE)');
  const n = code(`${HI}night.js`);
  assert.match(n, /import \{ CAM, camDist, SLAB_H \} from '\.\/camera\.js';/);
  const draw = n.slice(n.indexOf('function draw(run, tau, dt)'), n.indexOf('return {', n.indexOf('function draw(run, tau, dt)')));
  assert.doesNotMatch(draw, /clientWidth|clientHeight|getBoundingClientRect|offsetWidth/, 'no layout read in the frame');
  assert.match(draw, /if \(fitAsk\) \{ const f = fitAsk === 2; fitAsk = 0; fitNow\(f\); \}/, 'a resize only ASKS; the frame resizes first, then renders');
});

test('THE HEIGHT AREAS (bands.js — PURE): 0–25 the rooftops · 25–60 the skyline · 60–110 the clouds · 110–170 the stars · 170 on deep space; the plates cross-fade over ~8 floors (~12 at the skyline → clouds seam) and drift 0 → 1', () => {
  assert.deepEqual(BANDS.map(b => [b.id, b.name, b.from]), [['rooftops', 'THE ROOFTOPS', 0], ['skyline', 'THE SKYLINE', 25], ['clouds', 'THE CLOUDS', 60], ['stars', 'THE STARS', 110], ['space', 'DEEP SPACE', 170]]);
  assert.deepEqual([...FADES], [8, 12, 8, 8]);
  assert.equal(BANDS[2].from, CLOUDS_FLOOR, 'the clouds begin at the ABOVE THE CLOUDS feat\'s floor'); assert.ok(BANDS[4].from < TOP_FLOOR);
  assert.deepEqual([0, 24, 25, 59, 60, 109, 110, 169, 170, 200, 5000].map(bandAt), [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 4]);
  // outside a fade: one plate; in a fade: the two neighbours, the weight rising 0 → 1, half way at the seam
  assert.deepEqual(plateMix(0), { a: 0, b: 0, m: 0 }); assert.deepEqual(plateMix(20.9), { a: 0, b: 0, m: 0 });
  assert.deepEqual(plateMix(25), { a: 0, b: 1, m: 0.5 }); assert.deepEqual(plateMix(29), { a: 1, b: 1, m: 0 });
  assert.deepEqual(plateMix(54), { a: 1, b: 2, m: 0 }); assert.deepEqual(plateMix(60), { a: 1, b: 2, m: 0.5 }); assert.deepEqual(plateMix(66), { a: 2, b: 2, m: 0 });
  assert.deepEqual(plateMix(9999), { a: 4, b: 4, m: 0 });
  let prev = null;
  for (let f = 0; f <= 260; f += 0.25) {
    const m = plateMix(f);
    assert.ok(m.b === m.a || m.b === m.a + 1); assert.ok(m.m >= 0 && m.m < 1);
    if (prev && prev.a === m.a && prev.b === m.b && m.b !== m.a) assert.ok(m.m >= prev.m, 'a fade only rises');
    if (prev) assert.ok(m.a >= prev.a, 'the plates only go up');
    for (const band of new Set([m.a, m.b])) { const d = plateDrift(band, f); assert.ok(d >= 0 && d <= 1, `drift ${band} at ${f}`); }
    prev = m;
  }
  // a plate is at its FOOT as it fades in and at its TOP as the next takes over; the last one drifts on, ever slower, never past its top
  for (let b = 1; b < 4; b++) { assert.equal(plateDrift(b, BANDS[b].from - FADES[b - 1] / 2), 0); assert.equal(plateDrift(b, BANDS[b + 1].from + FADES[b] / 2), 1); }
  assert.equal(plateDrift(0, 0), 0); assert.equal(plateDrift(0, 29), 1);
  assert.ok(plateDrift(4, 200) > 0.2 && plateDrift(4, 400) > plateDrift(4, 300) && plateDrift(4, 100000) <= 1);
  assert.ok(SLACK > 0.05 && SLACK <= 0.25);
  // only the current band's plate + the next one's are ever held (night.js#holdPlates) — and only the current LOOK's set is asked for
  const n = code(`${HI}night.js`);
  assert.ok(n.includes('for (const [k, rec] of plates) if (k !== a && k !== b && !(a === b && k === a + 1) && !(keepFirst && k === 0)) { if (rec.tex) rec.tex.dispose(); plates.delete(k); }'));
  // (+ the FIRST band's plate again while the end card is up — PLAY AGAIN never starts on a blank sky: the review)
  assert.ok(n.includes('rest() { keepFirst = true; },') && n.includes('if (snap) keepFirst = false;') && code(`${HI}play.js`).includes('view.rest();'));
  assert.match(n, /new URL\(`plates\/\$\{look\}-\$\{band \+ 1\}\.webp\?v=\$\{HI_ART_REV\}`, ART\)/);
  for (let i = 1; i <= 5; i++) { const f = new URL(`../assets/highrise/plates/night-${i}.webp`, import.meta.url); assert.ok(existsSync(f) && statSync(f).size < 90 * 1024, `night-${i}.webp ships, small`); }
  assert.ok(statSync(new URL('../assets/highrise/env-night.png', import.meta.url)).size < 24 * 1024, 'the reflection map: a small picture, never the HDRI');
  assert.ok(!existsSync(new URL('../assets/highrise/night.hdr', import.meta.url)));
});

test('THE SLAB COLOURS: each band its own set of four neons, walked one step a floor (the engine\'s palette), blended round a seam', () => {
  assert.equal(SLAB_SETS.night.length, BANDS.length);
  for (const set of SLAB_SETS.night) { assert.equal(set.length, 4); for (const c of set) for (const v of c) assert.ok(v >= 0 && v <= 1); }
  for (let b = 0; b < BANDS.length; b++) {
    assert.deepEqual(setColor('night', b, 0), SLAB_SETS.night[b][0]); assert.deepEqual(setColor('night', b, PALETTE_N / 4), SLAB_SETS.night[b][1]);
    assert.deepEqual(setColor('night', b, PALETTE_N), setColor('night', b, 0), 'the walk is a loop'); assert.deepEqual(setColor('night', b, -1), setColor('night', b, PALETTE_N - 1));
    // every step is a bright neon (its strongest channel ≥ 0.75) — a slab is never a dull colour
    for (let p = 0; p < PALETTE_N; p++) assert.ok(Math.max(...setColor('night', b, p)) >= 0.75, `band ${b} step ${p}`);
  }
  assert.deepEqual(slabColor('night', 's', 10), setColor('night', 0, paletteFor('s', 10)), 'deep in a band: its own set');
  assert.deepEqual(slabColor('night', 's', 40), setColor('night', 1, paletteFor('s', 40)));
  const mid = slabColor('night', 's', 25), a = setColor('night', 0, paletteFor('s', 25)), b = setColor('night', 1, paletteFor('s', 25));
  for (let i = 0; i < 3; i++) assert.ok(Math.abs(mid[i] - (a[i] + b[i]) / 2) < 1e-9, 'at a seam: half of each set');
  assert.deepEqual(slabColor('night', 's', -7), setColor('night', 0, paletteFor('s', -7)), 'the building\'s floors under the first slab have their colours too');
  assert.deepEqual(slabColor('night', 'same', 77), slabColor('night', 'same', 77));
});

test('YOUR BEST (best.js — PURE): no best = nothing · above you = the right-edge tag "BEST 57 ▲12" · on it = ONE MORE · the landing over it = the gold tape + NEW BEST, once · the tag never enters THE DROP ZONE', () => {
  assert.equal(bestView(0, 12), null, 'a first-ever run: no tag, no tape');
  assert.deepEqual(bestView(57, 45), { tag: 'BEST 57 ▲12', gap: 12 }); assert.deepEqual(bestView(57, 0), { tag: 'BEST 57 ▲57', gap: 57 });
  assert.deepEqual(bestView(57, 56), { tag: 'BEST 57 ▲1', gap: 1 }); assert.deepEqual(bestView(57, 57), { tag: 'BEST 57 · ONE MORE', gap: 0 });
  assert.deepEqual(bestView(57, 58), { tape: 57, passed: 1 }); assert.deepEqual(bestView(57, 90), { tape: 57, passed: 33 });
  assert.deepEqual([56, 57, 58, 59].map(f => crossedBest(57, f)), [false, false, true, false], 'crossed on the first floor over it — once');
  assert.equal(crossedBest(0, 1), false, 'no best: nothing to cross');
  assert.deepEqual([nextBest(57, 40), nextBest(57, 57), nextBest(57, 58), nextBest(0, 3)], [57, 57, 58, 3]);
  assert.deepEqual(['57', 57, '0', -3, 'x', null, 1.5, '1e9', undefined].map(cleanBest), [57, 57, 0, 0, 0, 0, 0, 0, 0], 'a stored value → a whole best floor, or none');
  // the tag's height: its floor's own, held between the HUD's foot and the drop zone's upper edge
  assert.equal(tagY(300, 150, 400), 300); assert.equal(tagY(20, 150, 400), 172, 'never under the HUD'); assert.equal(tagY(480, 150, 400), 378, 'never in the drop zone');
  for (let y = -200; y < 900; y += 7) { const t = tagY(y, 150, 400); assert.ok(t - 14 >= 150 + 8 && t + 14 <= 400 - 8); }
  assert.equal(tagY(300, 380, 400), 402, 'no clear column at all: just under the HUD');
  // the page wires it: the best BEFORE the run, the tag while above, the crossing → the tape + NEW BEST, stored at the end
  const s = code(`${HI}play.js`);
  assert.ok(s.includes("if (crossedBest(best, e.floor)) {") && s.includes("tapeFloor = best; newBest = true; view.setBest(tapeFloor, true); stage.classList.add('is-gold');") && s.includes("say('NEW BEST', 'is-gold', 5, 1900, now);"));
  assert.ok(s.includes('y = tagY(view.project((tp.x0 + tp.x1) / 2, Math.min(best, run.floor + 100), (tp.z0 + tp.z1) / 2)[1] * stageH, hudFoot, view.zoneTop() * stageH);'), 'the tag: its floor\'s height (clamped 100 floors up — a point behind the camera projects mirrored: the review), clear of the HUD + THE DROP ZONE');
  assert.ok(s.includes('best = Math.max(best, readBest());'), 'a phone whose storage is blocked keeps its best for the visit');
  assert.ok(s.includes("endBest.textContent = !best ? '' : !was ? `YOUR BEST ${best}`"), 'a first run that never landed a slab shows no "YOUR BEST 0"');
  assert.match(s, /best = nextBest\(was, live\.floor\);\s*if \(best > was\) writeBest\(best\);/);
  assert.match(read('css/highrise-play.css'), /\.hi-tag \{ position: absolute; right: 0;/, 'the tag sits at the RIGHT edge');
});

test('THE SOUNDS\' TABLE (sounds.js — PURE): nine sounds, every file ships, the takes (a second file or an in-code variant), THE PERFECT CHIME up a major-pentatonic scale holding after 8', () => {
  assert.deepEqual([...SOUND_IDS], ['drop', 'perfect', 'slice', 'falling-piece', 'grow-back', 'streak', 'out', 'band-arrival', 'pass']);
  assert.deepEqual([...SOUND_FILES].sort(), ['band-arrival', 'drop', 'falling-piece', 'grow-back', 'out', 'pass', 'perfect', 'slice', 'slice-b', 'streak']);
  let total = 0;
  for (const f of SOUND_FILES) { const u = new URL(`../audio/highrise/${f}.wav`, import.meta.url); assert.ok(existsSync(u), `${f}.wav ships`); total += statSync(u).size; const b = readFileSync(u); assert.equal(b.toString('latin1', 0, 4), 'RIFF'); assert.equal(b.readUInt16LE(22), 1, `${f}.wav is mono`); assert.equal(b.readUInt32LE(24), 44100); }
  assert.ok(total < 700 * 1024, `the sounds: ${(total / 1024).toFixed(0)} KB`);
  assert.deepEqual(readdirSync(new URL('../audio/highrise/', import.meta.url)).filter(f => f.endsWith('.wav')).map(f => f.slice(0, -4)).sort(), [...SOUND_FILES].sort(), 'no stray file ships');
  assert.match(read('audio/highrise/CREDITS.md'), /CC0/); assert.ok(existsSync(new URL('../audio/highrise/LICENSE.txt', import.meta.url)));
  for (const s of SOUNDS) {
    assert.ok(s.takes.a && s.label && s.pri >= 1 && s.pri <= 4);
    const g = typeof s.gain === 'number' ? [s.gain] : Object.values(s.gain); for (const v of g) assert.ok(v > 0.2 && v < 2.5, `${s.id} gain`);
    if (s.takes.b) assert.ok(s.about && s.about.a && s.about.b, `${s.id}: the audition says what A and B are`);
  }
  assert.deepEqual(SOUNDS.filter(s => s.takes.b).map(s => s.id), ['drop', 'perfect', 'slice'], 'the A / B choices: the slice\'s delivered backup + two in-code variants');
  assert.equal(SOUNDS.find(s => s.id === 'slice').takes.b.file, 'slice-b'); assert.equal(SOUNDS.find(s => s.id === 'drop').takes.b.file, 'drop', 'an in-code variant = the same file at another pitch');
  assert.deepEqual(SOUNDS.filter(s => !s.play).map(s => s.id), ['pass'], 'PASS is the match\'s (S4): in the audition only');
  assert.equal(SOUNDS.find(s => s.id === 'out').pri, 4, 'your own OUT outranks everything');
  // THE CHIME: do re mi so la do′ re′ mi′ — one step a perfect in a row, holding at the top after 8
  assert.deepEqual([...CHIME_STEPS], [0, 2, 4, 7, 9, 12, 14, 16]);
  const r = n => +chimeRate(n).toFixed(4);
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8].map(r), [0, 2, 4, 7, 9, 12, 14, 16].map(s => +Math.pow(2, s / 12).toFixed(4)));
  assert.equal(r(1), 1); assert.equal(r(6), 2, 'the 6th perfect = the octave'); assert.equal(r(9), r(8)); assert.equal(r(500), r(8), 'it HOLDS at the top'); assert.equal(r(0), 1);
  for (let n = 1; n < 8; n++) assert.ok(chimeRate(n + 1) > chimeRate(n), 'it only climbs');
  assert.equal(VOICES, 8); assert.deepEqual({ ...DROP_VARY }, { rate: 0.04, db: 1.5 }); assert.equal(FALL_DELAY_S, 0.1); assert.equal(STREAK_EVERY, 10);
  // the voice rule
  const eight = Array.from({ length: 8 }, (_, i) => ({ pri: 1, at: i }));
  assert.deepEqual(admit(eight.slice(0, 7), 1), { ok: true, drop: -1 }); assert.deepEqual(admit(eight, 1), { ok: false, drop: -1 }, 'a full house drops a new drop');
  assert.deepEqual(admit(eight, 4), { ok: true, drop: 0 }, 'your OUT takes the oldest drop\'s voice');
});

test('THE TRIGGERS (sounds.js#cuesOf — PURE, on REAL runs): drop on every landing · the chime on a perfect, at its streak\'s pitch · slice + the falling piece 0.1 s after on a cut · grow-back · the streak\'s sparkle every 10 · out — and a batch that came back from a hidden tab sounds only its OUT', () => {
  const tally = { drop: 0, perfect: 0, slice: 0, fall: 0, grow: 0, streak: 0, out: 0 };
  for (let i = 0; i < 12; i++) {
    const seed = `cue${i}`, run = createRun({ seed, mode: 'solo' }), bot = gaussBot({ sigmaMs: [10, 25, 40][i % 3], seed });
    while (!isOver(run) && run.floor < 150) {
      const ev = [];
      stepTo(run, run.s0, ev);
      if (run.st !== 'slide') break;
      const landed = tap(run, bot(run), ev), cues = cuesOf(ev);
      const kinds = ev.map(e => e.e);
      if (kinds.includes('land')) { assert.equal(cues.filter(c => c.id === 'drop').length, 1); assert.ok(cues.find(c => c.id === 'drop').vary, 'a drop is never the same twice'); tally.drop++; }
      else assert.ok(!cues.some(c => c.id === 'drop'), 'no landing, no drop sound');
      const p = ev.find(e => e.e === 'perfect');
      if (p) { const c = cues.find(q => q.id === 'perfect'); assert.equal(c.rate, chimeRate(p.streak), 'the chime at its streak\'s step'); tally.perfect++; assert.equal(cues.some(q => q.id === 'streak'), p.streak % 10 === 0); if (p.streak % 10 === 0) tally.streak++; }
      else assert.ok(!cues.some(c => c.id === 'perfect' || c.id === 'streak'));
      if (kinds.includes('cut')) { assert.ok(cues.some(c => c.id === 'slice')); assert.equal(cues.find(c => c.id === 'falling-piece').delay, 0.1); tally.slice++; tally.fall++; }
      else assert.ok(!cues.some(c => c.id === 'slice' || c.id === 'falling-piece'));
      assert.equal(cues.some(c => c.id === 'grow-back'), kinds.includes('grow')); if (kinds.includes('grow')) tally.grow++;
      assert.equal(cues.some(c => c.id === 'out'), kinds.includes('out')); if (kinds.includes('out')) tally.out++;
      assert.ok(!cues.some(c => c.id === 'pass' || c.id === 'band-arrival'), 'a pass is the match\'s; a band\'s arrival is the page\'s');
      // LATE (the tab was away): only the OUT
      assert.deepEqual(cuesOf(ev, true), kinds.includes('out') ? [{ id: 'out' }] : []);
      if (!landed) break;
    }
  }
  assert.ok(tally.drop > 600 && tally.perfect > 300 && tally.slice > 150 && tally.grow > 20 && tally.streak > 5 && tally.out > 5, JSON.stringify(tally));
  // the fuse behind a hidden tab: its OUT sounds, nothing else
  const r = createRun({ seed: 'away', mode: 'solo' }), ev = [];
  stepTo(r, 100000, ev);
  assert.deepEqual(cuesOf(ev, true), [{ id: 'out' }]);
  // the page: the cues of the frame's events, LATE after a long gap; the band's arrival + NEW BEST are its own
  const s = code(`${HI}play.js`);
  assert.match(s, /const late = gap > LATE_MS;/); assert.match(s, /if \(snd\) \{ snd\.playCues\(snd\.cuesOf\(ev, late\)\); if \(more\.length\) snd\.playCues\(more\); \}/);
  assert.match(s, /if \(!late\) cues\.push\(\{ id: 'band-arrival' \}\);/);
  // SOLO PAST 200: every notch of the tightening is called FASTER
  assert.ok(s.includes("if (e.floor > TIGHT.from) { const k = Math.floor((e.floor + 1 - TIGHT.from) / TIGHT.every); if (k > notch) { notch = k; if (!say('FASTER', 'is-fast', 2, 1100, now)) later = ['FASTER', 'is-fast', 2, 1100]; } }"), 'every notch is called — under a bigger call it waits its turn (the review)');
  assert.ok(s.includes('if (later) { const l = later; later = null; say(l[0], l[1], l[2], l[3], now); }'));
  assert.equal(TIGHT.every, 10);
});

test('THE NIGHT LOOK (night.js + night-fx.js — static): ONE instanced mesh for every box, glass = reflections + a fresnel lift + lit edges (NOT transmission), GPU sparks, the half-res bloom at tier 2 only, the warm frame, the teardown', () => {
  const n = code(`${HI}night.js`), fx = read(`${HI}night-fx.js`);
  assert.match(n, /^import \* as THREE from 'three';/m);
  assert.doesNotMatch(n + fx, /MeshPhysicalMaterial|transmission|three\/addons|three\/examples|EffectComposer|UnrealBloom/, 'no three.js transmission, no add-on');
  assert.equal((n.match(/new THREE\.InstancedMesh\(/g) || []).length, 1, 'every box on screen = ONE instanced mesh (the slabs, the building, the slider + its trail, the pieces, the tape)');
  assert.match(n, /const PIECES = 8, TAPE = 4, BOXES = KEEP \+ 1 \+ 2 \+ PIECES \+ TAPE, SPARKS = 224, RINGS = 4;/);
  assert.match(fx, /vec3 R = reflect\(-V, N\);/); assert.match(fx, /float fres = 0\.1 \+ 0\.9 \* pow\(1\.0 - max\(dot\(N, V\), 0\.0\), 5\.0\);/, 'a fresnel lift');
  assert.match(fx, /vec3 d = vHalf - abs\(vLocal\);/, 'the lit edges from each face\'s own distance to its border');
  assert.match(fx, /float v = asin\(clamp\(abs\(r\.y\), 0\.0, 1\.0\)\) \* 0\.63661977;/, 'the reflection map = the sky half: a ray below the horizon mirrors up into it');
  assert.match(fx, /vec3 at\(float t\) \{ return aO \+ aV \* t \+ vec3\(0\.0, -4\.5 \* t \* t, 0\.0\); \}/, 'a spark is flown in the shader (its start, its throw, gravity)');
  const draw = n.slice(n.indexOf('function draw(run, tau, dt)'), n.indexOf('return {', n.indexOf('function draw(run, tau, dt)')));
  assert.doesNotMatch(draw, /spO\.|spV\.|spark\(/, 'no spark is stepped on the CPU in the frame');
  assert.match(n, /if \(whole \|\| reduce\) return;/, 'reduced motion: no sparks');
  assert.ok(n.includes('transparent: true, depthWrite: true, extensions: { derivatives: true } });'), 'the glass asks for derivatives: its edges\' fwidth builds on a WebGL 1 phone too (the review: without it the whole tower was missing there)');
  assert.ok(code(`${HI}sfx.js`).includes('if (!isUnlocked() || !ctx || !bufs.get(tk.file) || bufCtx !== ctx) {') && !/ctx\.state !== 'running'/.test(code(`${HI}sfx.js`)), 'the sounds play on a NAPPING context too (PODCAST MODE — the review: the game was silent with the site\'s music off)');
  assert.match(n, /if \(tier === 2 && !bloom\) \{ try \{ bloom = createBloom\(renderer, G\.uBloom\); \} catch \{ bloom = null; \} \}\s*if \(tier < 2 && bloom\) \{ bloom\.dispose\(\); bloom = null; \}/, 'the bloom at the top tier only');
  assert.match(n, /export const DPR_AT = Object\.freeze\(\[1\.5, 2, 3\]\);/, 'the tiers\' sharpness: ≤ 1.5 · ≤ 2 · ≤ 3');
  assert.match(n, /if \(needWarm && w && h\) \{ needWarm = false; warm\(\); \}/); assert.match(n, /renderer\.compile\(scene, cam\); renderer\.render\(scene, cam\); if \(bloom\) bloom\.render\(scene, cam, plate\);/, 'THE WARM FRAME: every program built in one hidden frame');
  assert.match(n, /try \{ renderer\.forceContextLoss\(\); \} catch \{\s*\}\s*el\.width = el\.height = 0;\s*el\.remove\(\);/, 'the teardown frees the context + zeroes the canvas');
  for (const f of ['night.js', 'night-fx.js']) assert.doesNotMatch(code(`${HI}${f}`), /performance\.now|requestAnimationFrame|Date\b/, `${f} keeps no clock of its own (the page hands it dt)`);
});
