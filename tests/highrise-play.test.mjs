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
import { BANDS, FADES, SLACK, bandAt, plateMix, plateDrift, SLAB_SETS, setColor, slabColor, sliderColor, DAY_ACCENT, ACCENT_PULL, DAY_HAZE, hazeAt, skyTone } from '../js/games/highrise/bands.js';
import { FLY_FLOORS, FLY_LATE, flyPlan, flyDue, flyNeeds } from '../js/games/highrise/flyplan.js';
import { HI_SPECS, HI_AW, HI_AH } from '../js/fx/hi-specs.js';
import { BEST_KEY, cleanBest, bestView, crossedBest, nextBest, tagY } from '../js/games/highrise/best.js';
import { SOUNDS, SOUND_IDS, SOUND_FILES, VOICES, DROP_VARY, FALL_DELAY_S, STREAK_EVERY, CHIME_STEPS, chimeRate, admit, cuesOf } from '../js/games/highrise/sounds.js';
import { createRun, stepTo, tap, isOver, paletteFor, flyerFor } from '../js/games/highrise/engine.js';
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
  assert.deepEqual(dir, ['audition.js', 'bands.js', 'best.js', 'bot.js', 'camera.js', 'engine.js', 'flyers.js', 'flyplan.js', 'graybox.js', 'lab.js', 'logic.js', 'look.js', 'night-fx.js', 'night.js', 'play.js', 'replay.js', 'sfx.js', 'sounds.js', 'tower.js', 'tuning.js'], 'S3\'s files: still no meta.js / index.js / view.js — nothing a console could load as a game');
  // (S3: THE 2 CARDS' ART is prepared — and NOTHING knows the cards yet: no catalog entry, no strip, no CSS class, no achievement, no import of their specs: S4)
  for (const f of ['js/vault/catalog.js', 'js/vault/strip.js', 'api/_lib/catalog.js', 'api/_lib/lab-text.js', 'css/vault.css', 'js/fx/jw-cards.js']) assert.doesNotMatch(read(f), /abovetheclouds|topoftheworld|above-the-clouds|top-of-the-world|hi-specs|vault\/hi\//i, `${f}: the HIGH RISE cards are S4's`);
  for (const f of readdirSync(new URL('../api/', import.meta.url)).filter(n => n.endsWith('.js'))) assert.doesNotMatch(read(`api/${f}`), /highrise/i, `api/${f}: no endpoint wiring (counting = S4)`);
});

test('NOTHING COUNTS UNTIL GO-LIVE — the page\'s WHOLE module graph (static + lazy): its own files, the kit\'s tiers, the shared sheet + audio engine, three.js; nothing from /api, the profile, progression, the report, share, the cards, Firebase, the store', () => {
  const g = graph(`${HI}play.js`);
  const own = g.files.filter(f => f.startsWith(HI)).map(f => f.slice(HI.length));
  assert.deepEqual(own, ['audition.js', 'bands.js', 'best.js', 'camera.js', 'engine.js', 'flyers.js', 'flyplan.js', 'logic.js', 'look.js', 'night-fx.js', 'night.js', 'play.js', 'replay.js', 'sfx.js', 'sounds.js', 'tower.js', 'tuning.js'], 'the game\'s own modules (never the lab\'s, never the sim bots) — S3: + the look\'s choice, the flyers\' plan + the flyers (lazy)');
  assert.deepEqual(g.files.filter(f => !f.startsWith(HI)), ['js/audio/engine.js', 'js/audio/leave-text.js', 'js/audio/settings.js', 'js/audio/sound-state.js', 'js/core/bot-ua.js', 'js/core/harbor-weather.js', 'js/core/party.js', 'js/core/rng.js', 'js/core/sky.js', 'js/core/weather.js', 'js/errlog.js', 'js/games/jaywalk/models.js', 'js/games/kit/look.js', 'js/games/kit/tiers.js', 'js/ui/dom.js', 'js/ui/layers.js', 'js/ui/lazy-import.js', 'js/ui/sheet.js'], 'the shared modules: the integer hash, the tiers, the DOM helper + THE SHEET, the skew wrapper, the audio engine (+ what IT may load lazily: its leave text, the quiet counter) — the JAYWALK lab\'s kind; S3: + THE SITE\'s OWN SUN RULE (kit/look.js → core/sky.js + the three pure modules it reads — AUTO only) + JAYWALK\'s GLB reader (the flyers\' models, three.js only)');
  assert.ok(code('js/games/jaywalk/models.js').includes("const DIR = new URL('../../../assets/jaywalk/models/', import.meta.url);") && !/\/api\/|firebase|sendBeacon|WebSocket/i.test(code('js/games/jaywalk/models.js')), 'JAYWALK\'s GLB reader: three.js + its own model files, nothing else');
  for (const f of ['js/core/sky.js', 'js/core/weather.js', 'js/core/harbor-weather.js', 'js/core/party.js', 'js/games/kit/look.js']) assert.doesNotMatch(code(f), /(^|[^.\w])fetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|firebase/i, `${f}: pure — it asks nothing of any server`);
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
  // (S2 FIX: + night.js — a plate's bytes, for createImageBitmap: decoded off the frame, uploaded a band ahead — THE LAG HUNT)
  assert.deepEqual(own.filter(f => /(^|[^.\w])fetch\s*\(/.test(code(`${HI}${f}`))), ['flyers.js', 'night.js', 'sfx.js'], 'only sfx.js (its sounds) + night.js (its plates + reflection maps) + flyers.js (its models + the city\'s jet / UFO sounds) fetch');
  // (S3 — flyers.js: JAYWALK's own model files (shared, cached), HIGH RISE's F-22, the city's sound files — static files, nothing else)
  { const fl = code(`${HI}flyers.js`);
    assert.ok(fl.includes("const JW = new URL('../../../assets/jaywalk/models/', import.meta.url), HI = new URL('../../../assets/highrise/models/', import.meta.url), CITY = new URL('../../../audio/city/', import.meta.url);"));
    assert.ok(fl.includes('fetch(new URL(`${n}.mp3`, CITY))') && fl.includes('fetch(new URL(`${kind}.glb?v=${rev}`, dir))') && (fl.match(/(^|[^.\w])fetch\s*\(/g) || []).length === 2, 'two fetches: a city sound, a model'); }
  assert.ok(code(`${HI}night.js`).includes('loadPicture(new URL(`env-${look}.png?v=${HI_ART_REV}`, ART).href)'), '… night.js: + each look\'s reflection map, through the same decode-ahead loader');
  assert.ok(code(`${HI}night.js`).includes('loadPicture(new URL(`plates/${look}-${band + 1}.webp?v=${HI_ART_REV}`, ART).href)') && (code(`${HI}night.js`).match(/(^|[^.\w])fetch\s*\(/g) || []).length === 1, '… night.js: its own plates, nothing else');
  assert.match(code(`${HI}sfx.js`), /const DIR = new URL\('\.\.\/\.\.\/\.\.\/audio\/highrise\/', import\.meta\.url\);/); assert.match(code(`${HI}sfx.js`), /fetch\(new URL\(`\$\{f\}\.mp3\?v=\$\{HI_SFX_REV\}`, DIR\)\)/, '… its own sounds (MP3 since S2 FIX)');
  assert.match(code(`${HI}night.js`), /const ART = new URL\('\.\.\/\.\.\/\.\.\/assets\/highrise\/', import\.meta\.url\);/);
  // the ONLY thing stored: this phone's best + its look (`hi:play:*`; S3: the audition's picks are gone — the owner's are final)
  const stores = own.filter(f => /localStorage/.test(code(`${HI}${f}`)));
  assert.deepEqual(stores, ['look.js', 'play.js']);
  assert.equal(BEST_KEY, 'hi:play:best'); assert.match(code(`${HI}look.js`), /export const LOOK_KEY = 'hi:play:look';/);
  assert.equal((code(`${HI}look.js`).match(/localStorage\./g) || []).length, 2, 'look.js: the look, read + written');
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
  assert.ok(s.includes('if (isOver(run) && !endedAt) endedAt = now;') && s.includes("if (isOver(run) && !shown && now - endedAt >= (run.st === 'made' ? MADE_HOLD_MS : END_HOLD_MS)) showEnd(now);"));
  assert.equal((s.match(/endedAt = now/g) || []).length, 1, 'ONE place sets the end\'s time: the frame that first sees the run over');
  assert.match(s, /const END_HOLD_MS = 700;/); assert.match(s, /const MADE_HOLD_MS = 2600;/, 'THE FINISH: the white-gold light is seen pouring first');
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
  assert.ok(n.includes('plates.forEach((rec, k) => { if (k !== a && k !== b && !(a === b && k === a + 1) && !(keepFirst && k === 0)) { dropPlate(rec); plates.delete(k); } });'));
  // (+ the FIRST band's plate again while the end card is up — PLAY AGAIN never starts on a blank sky: the review)
  assert.ok(n.includes('rest() { keepFirst = true; },') && n.includes('if (snap) keepFirst = false;') && code(`${HI}play.js`).includes('view.rest();'));
  assert.match(n, /new URL\(`plates\/\$\{look\}-\$\{band \+ 1\}\.webp\?v=\$\{HI_ART_REV\}`, ART\)/);
  for (let i = 1; i <= 5; i++) { const f = new URL(`../assets/highrise/plates/night-${i}.webp`, import.meta.url); assert.ok(existsSync(f) && statSync(f).size < 90 * 1024, `night-${i}.webp ships, small`); }
  assert.ok(statSync(new URL('../assets/highrise/env-night.png', import.meta.url)).size < 24 * 1024, 'the reflection map: a small picture, never the HDRI');
  assert.ok(!existsSync(new URL('../assets/highrise/night.hdr', import.meta.url)));
  // (S3 — THE DAY SET: five plates + the day reflection map, small; day 1 = the owner's approved v2 redo — the builder's table)
  for (let i = 1; i <= 5; i++) { const f = new URL(`../assets/highrise/plates/day-${i}.webp`, import.meta.url); assert.ok(existsSync(f) && statSync(f).size < 90 * 1024, `day-${i}.webp ships, small`); }
  assert.ok(statSync(new URL('../assets/highrise/env-day.png', import.meta.url)).size < 24 * 1024); assert.ok(!existsSync(new URL('../assets/highrise/day.hdr', import.meta.url)));
  assert.match(read('scripts/build-highrise-assets.py'), /'day': \['day-1-rooftops-v2', 'day-2-skyline', 'day-3-clouds', 'day-4-stars', 'day-5-space'\]/);
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
  assert.match(s, /best = FROM \? was : nextBest\(was, live\.floor\);[^\n]*\n\s*if \(best > was\) writeBest\(best\);/, 'a run moves YOUR BEST — a `?floor=N` look check never does');
  assert.ok(s.includes("const FROM = Math.max(0, Math.min(400, Math.floor(Number(Q.get('floor')) || 0)));") && s.includes('if (FROM) climbBy(FROM, null);'), '`?floor=N`: the START tap plays N clean drops through the real engine (the lab\'s `?lane=N`)');
  assert.match(read('css/highrise-play.css'), /\.hi-tag \{ position: absolute; right: 0;/, 'the tag sits at the RIGHT edge');
});

test('THE SOUNDS\' TABLE (sounds.js — PURE): nine sounds, every file ships, ONE take each (S3 — the owner\'s picks are FINAL: ALL A; the B takes left the game), THE PERFECT CHIME up a major-pentatonic scale holding after 8', () => {
  assert.deepEqual([...SOUND_IDS], ['drop', 'perfect', 'slice', 'falling-piece', 'grow-back', 'streak', 'out', 'band-arrival', 'pass']);
  assert.deepEqual([...SOUND_FILES].sort(), ['band-arrival', 'drop', 'falling-piece', 'grow-back', 'out', 'pass', 'perfect', 'slice', 'streak']);
  let total = 0;
  // THE SOUNDS SHIP COMPRESSED (S2 FIX — the owner; scripts/build-highrise-sounds.mjs): MPEG-1 Layer III, 44.1 kHz, MONO; no WAV ships
  for (const f of SOUND_FILES) {
    const u = new URL(`../audio/highrise/${f}.mp3`, import.meta.url); assert.ok(existsSync(u), `${f}.mp3 ships`); total += statSync(u).size;
    const b = readFileSync(u);
    assert.ok(b[0] === 0xff && (b[1] & 0xfe) === 0xfa, `${f}.mp3 begins with an MPEG-1 Layer III frame (no tag in front)`);
    assert.equal((b[2] >> 2) & 3, 0, `${f}.mp3 is 44.1 kHz`); assert.equal(b[3] >> 6, 3, `${f}.mp3 is mono`);
  }
  assert.ok(total < 130 * 1024, `the sounds: ${(total / 1024).toFixed(0)} KB`);
  assert.deepEqual(readdirSync(new URL('../audio/highrise/', import.meta.url)).filter(f => !/^(CREDITS\.md|LICENSE\.txt)$/.test(f)).sort(), SOUND_FILES.map(f => `${f}.mp3`).sort(), 'no stray file ships (no WAV, no B take)');
  // an MP3's lead-in is skipped at play: a drop's sound stays on its tap
  { const sx = code(`${HI}sfx.js`); assert.ok(sx.includes('leads.set(k, leadOf(b));') && sx.includes("src.start(ctx.currentTime + (o.delay || 0), leads.get(tk.file) || 0);"), 'each sound starts at its first audible sample'); }
  assert.match(read('audio/highrise/CREDITS.md'), /CC0/); assert.ok(existsSync(new URL('../audio/highrise/LICENSE.txt', import.meta.url)));
  assert.doesNotMatch(read('audio/highrise/CREDITS.md'), /slice-b/, 'the credits name only what ships');
  for (const s of SOUNDS) {
    assert.ok(s.label && s.file === s.id && s.rate > 0 && s.pri >= 1 && s.pri <= 4);
    assert.ok(typeof s.gain === 'number' && s.gain > 0.2 && s.gain < 2.5, `${s.id} gain`);
    assert.ok(!('takes' in s) && !('about' in s), `${s.id}: one take — nothing to choose`);
  }
  // THE PICKS (the owner, Nov 19 — ALL A): drop as recorded · the chime starts an octave down · the slice = the glassy snap (its own file)
  assert.equal(SOUNDS.find(s => s.id === 'drop').rate, 1); assert.equal(SOUNDS.find(s => s.id === 'perfect').rate, 0.5); assert.equal(SOUNDS.find(s => s.id === 'slice').file, 'slice');
  assert.deepEqual(SOUNDS.map(s => s.gain), [1.5, 0.7, 1.18, 0.32, 0.4, 0.78, 2.1, 0.53, 0.65], 'the A takes\' own levels, unchanged');
  for (const f of ['sounds.js', 'sfx.js', 'audition.js', 'play.js']) assert.doesNotMatch(code(`${HI}${f}`), /slice-b|setPick|picksLine|PLAY B|COPY MY PICKS|hi:play:snd/, `${f}: no B take, no pick, nothing stored for the sounds`);
  assert.ok(code(`${HI}audition.js`).includes("const b = tube('PLAY', () => (s.chime ? scale() : play(s.id)));"), 'the SOUNDS sheet = a plain list: every sound, one PLAY (the chime climbs its scale)');
  assert.deepEqual(SOUNDS.filter(s => !s.play).map(s => s.id), ['pass'], 'PASS is the match\'s (S4): in the list only');
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
  // (S2 FIX: the bloom is BUILT at the top tier only, DRAWN at the top tier only — and KEPT through a step down: no rebuild mid-run)
  assert.ok(n.includes('if (tier === 2 && !bloom) { try { bloom = createBloom(renderer, G.uBloom); if (warmed) needWarm = true; } catch { bloom = null; } }') && n.includes('if (bloom && tier === 2 && dayK < 1) bloom.render(scene, cam, plate, TWINS, 1 - dayK);') && n.includes('bloom: !!bloom && tier === 2') && !/tier < 2 && bloom\) \{ bloom\.dispose/.test(n), 'the bloom at the top tier only');
  assert.match(n, /export const DPR_AT = Object\.freeze\(\[1\.5, 2, 3\]\);/, 'the tiers\' sharpness: ≤ 1.5 · ≤ 2 · ≤ 3');
  assert.match(n, /if \(needWarm && w && h\) \{ needWarm = false; warm\(\); \}/); assert.match(n, /renderer\.compile\(scene, cam\); renderer\.render\(scene, cam\); if \(bloom\) bloom\.render\(scene, cam, plate, TWINS\);/, 'THE WARM FRAME: every program built in one hidden frame (the bloom pass\'s twins too)');
  assert.match(n, /try \{ renderer\.forceContextLoss\(\); \} catch \{\s*\}\s*el\.width = el\.height = 0;\s*el\.remove\(\);/, 'the teardown frees the context + zeroes the canvas');
  for (const f of ['night.js', 'night-fx.js']) assert.doesNotMatch(code(`${HI}${f}`), /performance\.now|requestAnimationFrame|Date\b/, `${f} keeps no clock of its own (the page hands it dt)`);
});

// ================================================================================================================================
// S3 — THE DAY LOOK · THE LOOK SWITCH · THE FLYERS · DEEP SPACE · THE CARDS' ART (docs/highrise.md; docs/games/passes/highrise-s3.md)
// ================================================================================================================================

test('THE DAY LOOK (S3 — static): the SAME programs as the night (uDay in every material — a switch builds nothing), frosted glass lit by ONE sun, the day\'s lights as PAINT, no bloom by day, the day colours + the sliding slab\'s accent + the haze (bands.js)', () => {
  const n = code(`${HI}night.js`), fx = read(`${HI}night-fx.js`);
  // ONE set of programs: every fragment shader that draws the world carries uDay; nothing is built per look
  for (const name of ['GLASS_F', 'PLATE_F', 'SPARK_F', 'RING_F', 'TAPE_F', 'FLY_F']) { const at = fx.indexOf(`export const ${name} = `); assert.ok(at > 0 && /uniform [^;]*\buDay\b/.test(fx.slice(at, fx.indexOf('}`;', at))), `${name} carries uDay`); }
  assert.doesNotMatch(n, /look === 'day' \? new THREE\.ShaderMaterial|needsUpdate = true;[^\n]*look/, 'no material is made or rebuilt for a look');
  assert.ok(n.includes('uDay: { value: dayK }') && n.includes('G.uDay.value = dayK;'), 'ONE uniform, shared by every material');
  // the glass: frosted, one sun, the ledge's shadow, a chrome rim, the height haze — and the night's maths behind `uDay > 0.001`
  assert.ok(fx.includes('if (uDay > 0.001 && uBloom < 0.5) {') && fx.includes('col = mix(col, dcol, uDay); alpha = mix(alpha, vFx.z, uDay);'), 'the day glass is mixed in by uDay (at 0 the night\'s picture is untouched)');
  assert.ok(fx.includes('float ndl = max(dot(N, uSun), 0.0);') && fx.includes('float sdUp(vec2 p)') && fx.includes('dcol = mix(dcol, uHaze, (1.0 - fall) * 0.36 * (1.0 - slider));') && fx.includes('float shadeSide = top > 0.5 ? 0.0 : step(0.5, an.x);'), 'ONE sun · the slab above throws its shadow on a ledge · a light height haze');
  assert.ok(fx.includes('float rim = 1.0 - smoothstep(lw - aa, lw + aa, e);') && fx.includes('float inner = (1.0 - smoothstep(lw * 3.0 - aa, lw * 3.0 + aa, e)) * (1.0 - rim);'), 'the chrome rim: a bright line + a darker line inside it');
  assert.ok(n.includes("boxGeo.setAttribute('aUp', aUp);") && n.includes('put((x0 + x1) / 2, (s.floor - 0.5) * H, (z0 + z1) / 2, x1 - x0, H, z1 - z0, colMix(s.floor), glow, white, 1, KIND.slab, null, up);'), 'each slab is told the slab lying on it');
  assert.match(n, /export const SUN = Object\.freeze\(\[-0\.42, 0\.78, 0\.46\]\);/);
  // the lights are PAINT by day (ONE · ONE_MINUS_SRC_ALPHA: alpha 0 = the night's added light, as before)
  assert.ok(n.includes('const LIGHT_BLEND = { blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor };'));
  assert.ok(fx.includes('gl_FragColor = vec4(mix(hue * a * 1.7, hue * pa, uDay), pa * uDay);'), 'a spark: added light by night, paint by day');
  assert.ok(n.includes('const DAY_SPARK = [1, 0.46, 0.03], DAY_SPARK_HOT = [1, 0.76, 0.22], DAY_RING = [1, 0.72, 0.16], DAY_SPARK_SIZE = 1.7;'), 'day sparks warm gold (bigger: paint must be seen), the perfect\'s ring gold-white');
  assert.ok(fx.includes('float dark = (1.0 - smoothstep(hw + 1.6 * px, hw + 3.6 * px, a)) * (1.0 - line) * uDay * 0.9;') && fx.includes('float hw = (1.0 + 0.9 * uDay) * max(1.1 * px, '), 'the gold tape by day: twice as thick, a darker outline under it');
  assert.ok(n.includes('const back = ts ? TAPE_BACK * (1 - dayK) *'), '… and no back edges through frosted glass');
  // no bloom by day (it fades with the night through a switch)
  assert.ok(n.includes('if (bloom && tier === 2 && dayK < 1) bloom.render(scene, cam, plate, TWINS, 1 - dayK);') && fx.includes('add.uniforms.uK.value = BLOOM_K * k;'));
  // THE DAY COLOURS: the owner's pairs, a band; every step a real colour; the sliding slab pulled to its band's accent
  assert.equal(SLAB_SETS.day.length, BANDS.length);
  for (const set of SLAB_SETS.day) { assert.equal(set.length, 4); for (const c of set) for (const v of c) assert.ok(v >= 0 && v <= 1); }
  for (let b = 0; b < BANDS.length; b++) { assert.deepEqual(setColor('day', b, 0), SLAB_SETS.day[b][0]); for (let p = 0; p < PALETTE_N; p++) assert.ok(Math.max(...setColor('day', b, p)) >= 0.7, `day band ${b} step ${p}`); }
  assert.deepEqual(slabColor('day', 's', 10), setColor('day', 0, paletteFor('s', 10)));
  assert.notDeepEqual(slabColor('day', 's', 10), slabColor('night', 's', 10));
  assert.equal(DAY_ACCENT.length, BANDS.length); assert.equal(ACCENT_PULL, 0.7);
  assert.deepEqual(sliderColor('night', 's', 40), slabColor('night', 's', 40), 'by night the sliding slab is its floor\'s own neon');
  for (const f of [3, 40, 80, 130, 190, 250]) {
    const c = sliderColor('day', 's', f), own = slabColor('day', 's', f), acc = DAY_ACCENT[bandAt(f)];
    for (let i = 0; i < 3; i++) assert.ok(Math.abs(c[i] - (own[i] + (acc[i] - own[i]) * 0.7)) < 1e-9, `floor ${f}: 70 % of the way to its band's accent`);
    // a strong colour: its channels are far apart (a silver / white step would vanish on a sunlit sky)
    assert.ok(Math.max(...c) - Math.min(...c) >= 0.42, `floor ${f}: saturated (${c.map(v => v.toFixed(2))})`);
  }
  assert.equal(DAY_HAZE.length, BANDS.length); assert.deepEqual(hazeAt(10), [...DAY_HAZE[0]]); { const h = hazeAt(25); for (let i = 0; i < 3; i++) assert.ok(Math.abs(h[i] - (DAY_HAZE[0][i] + DAY_HAZE[1][i]) / 2) < 1e-9); }
  // THE WORDS ON THE SKY: dark navy + a light halo under a sunlit sky; light again from THE STARS up (the day plates are dark there)
  assert.deepEqual([0, 60, 107, 108, 150, 250].map(f => skyTone('day', f)), ['bright', 'bright', 'bright', 'dark', 'dark', 'dark']);
  assert.deepEqual([0, 60, 250].map(f => skyTone('night', f)), ['dark', 'dark', 'dark']);
  const css = read('css/highrise-play.css');
  assert.match(css, /\.hi-stage\[data-sky='bright'\] \{ --hi-ink: #0d1740;/); assert.match(css, /\.hi-stage\[data-sky='bright'\] \.hi-num, \.hi-stage\[data-sky='bright'\] \.hi-end-n \{ color: var\(--hi-ink\);/);
  assert.doesNotMatch(css, /data-sky='bright'\][^{]*\.hi-again/, 'the PLAY AGAIN bar keeps HIGH RISE\'s hot pink by day');
  assert.ok(code(`${HI}play.js`).includes("if (lk !== lookSeen || tone !== toneSeen) { lookSeen = lk; toneSeen = tone; mark('dom'); stage.dataset.look = lk; stage.dataset.sky = tone; }"), 'the page\'s words follow the picture — written only at a change');
});

test('THE LOOK SWITCH (S3): AUTO · DAY · NIGHT on the start screen (this phone remembers), AUTO = the site\'s own sun rule, a 1.5 s cross-fade AFTER the other look\'s pictures are in, only the look(s) on screen keep theirs', async () => {
  const L = await import('../js/games/highrise/look.js'), K = await import('../js/games/kit/look.js');
  assert.equal(L.LOOK_KEY, 'hi:play:look'); assert.deepEqual([...L.LOOKS], ['auto', 'day', 'night']); assert.deepEqual({ ...L.LOOK_LABEL }, { auto: 'AUTO', day: 'DAY', night: 'NIGHT' });
  assert.equal(L.resolveLook, K.resolveLook); assert.equal(L.sunUpNow, K.sunUpNow, 'AUTO = the site\'s own sun rule (kit/look.js → core/sky.js), not a copy');
  assert.deepEqual(['day', 'night', 'auto', 'x', null, undefined, 'DAY'].map(L.cleanLook), ['day', 'night', 'auto', 'auto', 'auto', 'auto', 'auto']);
  assert.deepEqual([0, 6, 7, 12, 18, 19, 23].map(L.guessLook), ['night', 'night', 'day', 'day', 'day', 'night', 'night']);
  assert.equal(L.readLook(), 'auto', 'no storage (node): AUTO — and nothing throws'); L.writeLook('day');
  assert.deepEqual([L.resolveLook('auto', true), L.resolveLook('auto', false), L.resolveLook('day', false), L.resolveLook('night', true)], ['day', 'night', 'day', 'night']);
  const s = code(`${HI}play.js`), n = code(`${HI}night.js`), css = read('css/highrise-play.css');
  // the three choices: plain neon-underline tabs on their own press + lift, under the sign — never the START tap
  assert.ok(s.includes("const lookTabs = LOOKS.map(l => press(h('button.hi-tab.hi-look-b', { type: 'button', 'data-pick': l, 'aria-pressed': 'false' }, LOOK_LABEL[l]), () => pickLook(l)));"));
  assert.match(css, /\.hi-look \{[^}]*pointer-events: auto; \}/); assert.match(css, /\.hi-tab \{ min-height: 44px; min-width: 44px;/, 'each choice ≥ 44 pt');
  assert.ok(s.includes("const LOOK_Q = Q.get('look') === 'day' || Q.get('look') === 'night' ? Q.get('look') : null;") && s.includes('let choice = LOOK_Q || readLook(),'), '?look= for a visit; else this phone\'s choice');
  assert.ok(s.includes("choice = cleanLook(l); writeLook(choice); markLook();") && s.includes("if (choice === 'auto') askSun(); else setLook(choice);"));
  assert.ok(s.includes("sunUpNow(Date.now()).then(up => { if (choice !== 'auto') return; const first = !sunKnown; sunKnown = true; setLook(resolveLook('auto', up), first && t0 == null); }, () => {});"), 'AUTO asks the sun rule (the first answer before a run snaps; later ones cross-fade)');
  assert.ok(s.includes("setInterval(() => { if (document.visibilityState === 'visible') askSun(); }, 60000);"), '… again every minute');
  assert.ok(s.includes('try { view = createNight(play, { tier: tiers.get(), mark, look: lookT }); }'), 'a rebuilt scene keeps the look');
  // the scene: the other look's pictures FIRST (the decode-ahead loader), then the fade; settled, the old look's go
  assert.match(n, /export const LOOK_FADE_MS = 1500;/); assert.match(n, /export const LOOK_WAIT_MS = 5000;/);
  assert.ok(n.includes('if (!fading && (lookReady(target, mix.a, mix.b) || (waited += dt) > LOOK_WAIT_MS)) fading = true;'), 'the cross-fade waits for the look\'s two plates + its reflection map');
  assert.ok(n.includes("const lookReady = (look, a, b) => { const e = ENVS[look], pa = SETS[look].get(a), pb = SETS[look].get(b); return e.done && !!pa && pa.done && !!pb && pb.done; };"));
  assert.ok(n.includes("dayK += (want ? 1 : -1) * dt / LOOK_FADE_MS;") && n.includes('if (want ? dayK >= 1 : dayK <= 0) { dayK = want; fading = false; waited = 0; heldKey = -1; switches++; }'));
  assert.ok(n.includes("const holds = look => (look === 'day' ? dayK > 0 || target === 'day' : dayK < 1 || target === 'night');") && n.includes('if (!holds(look)) { plates.forEach(dropPlate); plates.clear(); dropEnv(look); continue; }'), 'only the look(s) on screen keep their plates + reflection map');
  assert.ok(n.includes('try { renderer.initTexture(t); } catch {') && n.includes('upload(image, flip, rec, false, true);'), 'every picture — a plate, a reflection map — is decoded + uploaded off the frame');
  assert.doesNotMatch(n, /TextureLoader/, 'no picture is handed to the GPU as an <img> (decoded at its first draw: a hitch)');
  // the plate shader holds both looks' pairs: ONE program, ONE draw
  const fx = read(`${HI}night-fx.js`);
  assert.ok(fx.includes('uniform sampler2D tA, tB, tC, tD;') && fx.includes('vec3 c = mix(n, d, uDay);'));
});

test('THE FLYERS\' PLAN (flyplan.js — PURE): the seed picks THE BLACKBIRD or the F-22 PAIR (engine.js#flyerFor) and its floor in 35 … 45; the UFO at 85; THE MOTHERSHIP at 200; each model asked for well before its floor', () => {
  assert.deepEqual({ ...FLY_FLOORS }, { jetFrom: 35, jetTo: 45, ufo: 85, shipFrom: 180, ship: 200, loadJet: 20, loadUfo: 70, loadShip: 160 });
  assert.equal(FLY_FLOORS.ship, TOP_FLOOR); assert.equal(FLY_LATE, 2);
  const kinds = new Set(), floors = new Set(), dirs = new Set();
  for (let i = 0; i < 400; i++) {
    const seed = `seed${i}`, p = flyPlan(seed);
    assert.equal(p.jet, flyerFor(seed), 'the jets\' choice follows the seed (the engine\'s own flyerFor)');
    assert.ok(p.jet === 'blackbird' || p.jet === 'f22'); assert.ok(Number.isInteger(p.jetAt) && p.jetAt >= 35 && p.jetAt <= 45);
    assert.ok(Math.abs(p.jetDir) === 1 && Math.abs(p.ufoDir) === 1); assert.equal(p.ufoAt, 85);
    assert.deepEqual(flyPlan(seed), p, 'the same seed, the same plan — on every phone');
    kinds.add(p.jet); floors.add(p.jetAt); dirs.add(p.jetDir);
  }
  assert.equal(kinds.size, 2, 'both flyers come up'); assert.equal(floors.size, 11, 'every floor 35 … 45 comes up'); assert.equal(dirs.size, 2);
  // what a landing starts: each once; a landing that jumped past a moment (two drops in a frame) still starts it; far past = missed
  const p = flyPlan('plan'), done = { jet: false, ufo: false, ship: false };
  assert.equal(flyDue(p, p.jetAt - 1, done), ''); assert.equal(flyDue(p, p.jetAt, done), 'jet'); assert.equal(flyDue(p, p.jetAt + 2, done), 'jet'); assert.equal(flyDue(p, p.jetAt + 3, done), 'jet-missed');
  done.jet = true;
  assert.equal(flyDue(p, 60, done), ''); assert.equal(flyDue(p, 85, done), 'ufo'); done.ufo = true;
  assert.equal(flyDue(p, 199, done), ''); assert.equal(flyDue(p, 200, done), 'ship'); done.ship = true; assert.equal(flyDue(p, 201, done), '');
  // the models: each asked for at its load floor — 15+ floors before its moment
  assert.deepEqual(flyNeeds(p, 19), []); assert.deepEqual(flyNeeds(p, 20), [p.jet]); assert.deepEqual(flyNeeds(p, p.jetAt + 3), []);
  assert.deepEqual(flyNeeds(p, 70), ['ufo']); assert.deepEqual(flyNeeds(p, 100), []); assert.deepEqual(flyNeeds(p, 160), ['mothership']); assert.deepEqual(flyNeeds(p, 203), []);
  assert.ok(FLY_FLOORS.jetFrom - FLY_FLOORS.loadJet >= 15 && FLY_FLOORS.ufo - FLY_FLOORS.loadUfo >= 15 && FLY_FLOORS.shipFrom - FLY_FLOORS.loadShip >= 15);
  assert.doesNotMatch(code(`${HI}flyplan.js`), /three|Math\.random|Date\b|performance|document|window/, 'pure');
  for (const f of ['tuning.js', 'engine.js', 'logic.js', 'replay.js']) assert.doesNotMatch(code(`${HI}${f}`), /flyplan|flyers|look\.js/, `${f} (the rules) never reads the flyers`);
  // the page: the plan from the run's seed, a moment at its landing; floor 200 — SOLO: the pass + THE MOTHERSHIP in the lane + the band-arrival sound · a finishing mode: THE FINISH
  const s = code(`${HI}play.js`);
  assert.ok(s.includes('plan = flyPlan(seed); flown.jet = flown.ufo = flown.ship = false; wanted.clear(); needFloor = -1;') && s.includes('view.adopt(run, T); view.setBest(0); view.flyReset();'));
  assert.ok(s.includes("if (due === 'jet') view.fly(plan.jet, plan.jetDir);") && s.includes("else if (due === 'ufo') view.fly('ufo', plan.ufoDir);"));
  assert.ok(s.includes("else if (due === 'ship' && MODE === 'solo') { view.fly('pass'); say('THE MOTHERSHIP', 'is-gold', 6, 2600, now); if (!late) cues.push({ id: 'band-arrival' }); }"));
  assert.ok(s.includes("} else if (e.e === 'made') {") && s.includes("view.fly('pour');"), 'a match\'s floor 200 = THE FINISH');
  assert.ok(s.includes('view.flyHush();'), 'the end card up: a flyer still in the sky fades away');
});

test('THE FLYERS (S3 — flyers.js + night.js\'s stage, static): a LAZY module, its two programs built in THE WARM FRAME, a model\'s buffers uploaded in an ordinary frame, placed in the camera\'s own frame (the sky band — never the play zone), freed after its moment; the UFO amber + violet; the sounds through the engine (a napping context plays)', async () => {
  const s = code(`${HI}play.js`), n = code(`${HI}night.js`), fl = code(`${HI}flyers.js`), fx = read(`${HI}night-fx.js`);
  // LAZY: the page never imports flyers.js statically; it is fetched from floor 20, through THE SKEW WRAPPER
  assert.doesNotMatch(s, /from '\.\/flyers\.js'/); assert.doesNotMatch(n, /flyers\.js/);
  assert.ok(s.includes("lazyImport(import('./flyers.js'), './flyers.js').then(M => { FlyMod = M; view.flyers(M); needFloor = -1; return M; })") && s.includes('if (run.floor < FLY_FLOORS.loadJet) return;'));
  assert.ok(s.includes('for (const k of flyNeeds(plan, run.floor)) if (!wanted.has(k)) { wanted.add(k); view.need(k); }'));
  assert.ok(s.includes('if (FlyMod) { view.flyers(FlyMod); wanted.clear(); needFloor = -1; }'), 'a rebuilt scene (a lost context) gets its flyers again');
  // THE LAG RULES: both programs (+ their twins) on a stand-in triangle in the warm frame; a model's buffers in an ordinary frame, before its moment
  assert.ok(n.includes('const mesh = new THREE.Mesh(standIn, m);') && n.includes('twin(mesh, m);') && n.includes('twin(lightsMesh, lightMat);'));
  assert.ok(n.includes('for (const f of flySlots) { f.mesh.visible = true; f.mesh.matrix.makeTranslation(0, -60, 0); f.mesh.matrixWorldNeedsUpdate = true; }') && n.includes('lgGeo.instanceCount = 1; lightsMesh.visible = true;'), 'the warm frame draws the flyers\' two programs');
  assert.ok(n.includes('upload(geo) { if (geo) toUpload.push(geo); },') && n.includes('const f = flySlots.find(q => !q.mesh.visible);') && n.includes('if (upSlot) { upSlot.mesh.visible = false; upSlot.mesh.geometry = standIn; upSlot = null; }'));
  assert.match(n, /export const FLY_SLOTS = 3, LIGHTS = 320;/); assert.equal((n.match(/new THREE\.ShaderMaterial\(/g) || []).length, 8, 'the scene\'s materials: the plate, the glass, the sparks, the rings, the tape\'s two, a flyer\'s body (× its slots, one program), the lights');
  // behind the tower, in the camera's own frame; the band = the HUD's foot … THE DROP ZONE's upper edge
  assert.ok(n.includes('mesh.renderOrder = -50;') && n.includes('lightsMesh.renderOrder = -40;'), 'drawn before the tower (it covers them)');
  assert.ok(fl.includes('const toWorld = (out, F, x, y, D) => out.set(F.px, F.py, F.pz).addScaledVector(F.Z, -D).addScaledVector(F.X, x * D * F.th * F.aspect).addScaledVector(F.Y, y * D * F.th);'));
  assert.ok(fl.includes('const bandY = (F, k) => 1 - 2 * (F.top + (Math.max(F.top + 0.08, F.bot) - F.top) * k);') && n.includes('FR.top = band0; FR.bot = zoneNow();') && s.includes('view.band(stageH ? hudFoot / stageH : 0.2);'));
  assert.ok(fl.includes('F.dist * (1.05 + 0.2 * sn)') && fl.includes('const D = F.dist * 1.2,') && fl.includes('const D = F.dist * 2.2,'), 'every flyer is FURTHER than the tower');
  // (flyers.js imports three.js + the audio engine: its numbers are read as text — THE UNIT JOB INSTALLS NOTHING)
  const num = k => Number(new RegExp(`\\b${k}: ([0-9.]+)`).exec(fl)[1]);
  assert.equal(num('jetS'), 3.4, 'the flyby ≈ 3 s'); assert.ok(num('jetW') >= 0.4 && num('f22W') >= 0.28 && num('ufoW') >= 0.3, 'big enough to read at 390 pt — never a speck'); assert.ok(num('shipW') >= 2.5, 'THE MOTHERSHIP: colossal');
  assert.equal(num('shipAt'), TOP_FLOOR); assert.ok(num('shipFrom') <= FLY_FLOORS.shipFrom);
  // the UFO: amber rim lights + a violet underglow — no beam, no ground ring, no green (never JAYWALK's)
  assert.ok(fl.includes('const AMBER = [1.0, 0.6, 0.1], VIOLET = [0.5, 0.2, 1.0],') && fl.includes('LAMP = [1.0, 0.46, 0.02];'), 'amber lamps, a violet underglow');
  const ufo = fl.slice(fl.indexOf('function frameUfo(F)'), fl.indexOf('function endUfo()'));
  assert.doesNotMatch(ufo, /beam|GREEN|S\.ring|S\.pour|, 3, [rwf]/, 'the UFO: no beam (light kind 3), no ring');
  // freed after its moment
  assert.ok(fl.includes("function endJet() { if (!jet) return; if (jet.snd) jet.snd.stop(0.6); hide(0); hide(1); drop(jet.kind); jet = null; boxes.jet = null; }") && fl.includes("function endUfo() { if (!ufo) return; if (ufo.hum) ufo.hum.stop(0.8); hide(0); drop('ufo'); ufo = null; boxes.ufo = null; }") && fl.includes("drop('mothership');"));
  // the sounds: the city's own files through the engine's SFX bus; an effect asks isUnlocked() — never the context's state (PODCAST MODE)
  assert.doesNotMatch(fl, /ctx\.state|\.state === 'running'|\.state !== 'running'/); assert.ok(fl.includes('if (!isUnlocked()) return H;') && fl.includes('tail.connect(getSfxBus() || ctx.destination);'));
  for (const f of ['jet-scream', 'jets-formation', 'ufo-hum', 'ufo-beam-on']) assert.ok(existsSync(new URL(`../audio/city/${f}.mp3`, import.meta.url)), `audio/city/${f}.mp3`);
  assert.ok(fl.includes("jet.snd = play(J.snd, { at: Math.max(0, m.peak - FLY.jetS / 2), pan: [-0.85 * jet.dir, 0.85 * jet.dir, FLY.jetS] });"), 'the jet sound: its loudest moment on the pass\'s middle, panned with it');
  assert.ok(fl.includes("(globalThis.__nsAudioBeds || (() => () => {}))({ pause() { quiet(0.02); }, resume() {} })"), 'a hum stops at once when the page is left (the engine\'s bed hub)');
  // THE MODELS: JAYWALK's own Blackbird + UFO (shared, cached); the city's F-22, thinned — small, in the flyers' GLB format, credited
  assert.ok(fl.includes("const MODELS = { blackbird: [JW, MODEL_REV], ufo: [JW, MODEL_REV], mothership: null, f22: [HI, HI_MODEL_REV] };") && fl.includes("import { parseGlb, MODEL_REV } from '../jaywalk/models.js';"));
  for (const f of ['blackbird', 'ufo']) assert.ok(existsSync(new URL(`../assets/jaywalk/models/${f}.glb`, import.meta.url)));
  // A MODEL IS READ FAST (THE LAG RULES — it lands mid-run): the flyers' one layout straight through typed arrays; any other → the general reader
  assert.ok(fl.includes('export function readFlyer(THREE, buf) {') && fl.includes('const g = readFlyer(THREE, buf); geo[kind] = g; S.upload(g);') && fl.includes('} catch { return parseGlb(buf); }'));
  assert.ok(fl.includes("if ((V[0].byteStride || 0) !== 16 || A[0].componentType !== 5122 || A[1].componentType !== 5120 || A[2].componentType !== 5121 || A[3].componentType !== 5123 || at % 2) return parseGlb(buf);"));
  for (const f of ['../assets/jaywalk/models/blackbird.glb', '../assets/jaywalk/models/ufo.glb', '../assets/highrise/models/f22.glb']) {
    const b = readFileSync(new URL(f, import.meta.url)), j = JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString('utf8'));
    assert.deepEqual([j.bufferViews[0].byteStride, ...j.accessors.slice(0, 4).map(a => a.componentType)], [16, 5122, 5120, 5121, 5123], `${f}: the flyers' one layout (the fast reader takes it)`);
  }
  const f22 = readFileSync(new URL('../assets/highrise/models/f22.glb', import.meta.url));
  assert.ok(f22.length < 1.5 * 1024 * 1024, `f22.glb: ${(f22.length / 1024).toFixed(0)} KB — under 1.5 MB`); assert.equal(f22.readUInt32LE(0), 0x46546c67);
  { const j = JSON.parse(f22.subarray(20, 20 + f22.readUInt32LE(12)).toString('utf8'));
    assert.deepEqual(j.extensionsRequired, ['KHR_mesh_quantization']); assert.equal(j.meshes.length, 1); assert.ok(j.accessors[0].count <= 16000 && j.accessors[0].count > 8000);
    assert.match(j.asset.copyright, /F22 Raptor FREE.*NLM.*CC BY 4\.0/); assert.deepEqual(Object.keys(j.meshes[0].primitives[0].attributes).sort(), ['COLOR_0', 'NORMAL', 'POSITION']);
    const a = j.accessors[0], sc = j.nodes[0].scale[0];
    assert.ok(Math.abs((a.max[2] - a.min[2]) * sc - 1) < 0.01 && Math.abs(a.min[1] * sc) < 1e-3, '1 long (nose + z), its belly on y = 0'); assert.ok((a.max[1] - a.min[1]) * sc < 0.24, 'the gear is UP (a jet with its gear down stands taller)'); }
  assert.match(read('assets/highrise/models/CREDITS.md'), /F22 Raptor FREE.*NLM.*CC BY 4\.0/s); assert.match(read('assets/highrise/models/CREDITS.md'), /Kiiba/); assert.match(read('assets/highrise/models/CREDITS.md'), /Poly by Google/);
  assert.ok(existsSync(new URL('../scripts/bake/highrise-f22.mjs', import.meta.url)) && /art\/models\/f22\/f22_raptor_free\.glb/.test(read('scripts/bake/highrise-f22.mjs')), 'built from the city\'s source model');
  // THE MOTHERSHIP + DEEP SPACE: seen from ~180, the solo moment (the camera glances up), the finish's light; the stars + the aurora past 200
  assert.ok(fl.includes('ease((F.cf - FLY.shipFrom) / (FLY.shipAt - FLY.shipFrom))') && fl.includes('S.glance(gl);') && fl.includes('S.pour(beam * (0.8 + 0.2 * Math.sin(tq * 7)));'));
  assert.ok(n.includes('const lookY = camY + CAM.lift - bump * 0.022 + glance * 0.42;') && n.includes('glance(v) { glance = reduce ? 0 : v; }'), 'the camera glances up (not with reduce motion)');
  assert.match(n, /export const SPACE_FROM = 200, SPACE_FULL = 212;/); assert.ok(n.includes('plateU.uSpace.value = cf <= SPACE_FROM ? 0 : cf >= SPACE_FULL ? 1 : (cf - SPACE_FROM) / (SPACE_FULL - SPACE_FROM);') && fx.includes('if (uSpace > 0.001) c += space() * uSpace;'));
  assert.match(read('css/highrise-play.css'), /\.hi-stage\.is-made \.hi-end-n \{ color: #fff6d8;/, 'THE FINISH: the end card in gold — the words, the floor, the perfects');
  assert.doesNotMatch(fl, /performance\.now|requestAnimationFrame|\bDate\b/, 'flyers.js keeps no clock of its own (night.js hands it the frame)');
  for (const l of fl.split('\n').filter(x => /Math\.random/.test(x))) assert.match(l, /S\.spark\(/, 'its only dice are the finish\'s sparks');
});

test('THE CARDS\' ART, PREPARED (S3): ABOVE THE CLOUDS + TOP OF THE WORLD through JAYWALK\'s card pipeline — the masters copied, 1280 × 720 WebP, the slim + full crops (the subject RIGHT, the left dark for the name); nothing reads them until S4', () => {
  assert.deepEqual(Object.keys(HI_SPECS), ['card-abovetheclouds', 'card-topoftheworld']); assert.equal(HI_AW, 1280); assert.equal(HI_AH, 720);
  for (const [id, S] of Object.entries(HI_SPECS)) {
    const web = readFileSync(new URL(`../assets/vault/hi/${S.art}.webp`, import.meta.url));
    assert.ok(web.subarray(0, 4).toString() === 'RIFF' && web.subarray(8, 12).toString() === 'WEBP', `${S.art}.webp`); assert.ok(web.length < 70 * 1024, `${S.art}.webp: ${(web.length / 1024).toFixed(0)} KB`);
    // (a lossy WebP's own header: 'VP8 ' — 14 bits of width + height at byte 26)
    const kind = web.subarray(12, 16).toString(), wh = kind === 'VP8X' ? [web.readUIntLE(24, 3) + 1, web.readUIntLE(27, 3) + 1] : [web.readUInt16LE(26) & 0x3fff, web.readUInt16LE(28) & 0x3fff];
    assert.ok(kind === 'VP8X' || kind === 'VP8 '); assert.deepEqual(wh, [1280, 720], `${S.art}.webp is 1280 × 720`);
    const png = readFileSync(new URL(`../art/highrise-cards/src/${S.art}.png`, import.meta.url));
    assert.equal(png.readUInt32BE(16), 1280); assert.equal(png.readUInt32BE(20), 720, `${S.art}.png: the master, 1280 × 720`);
    // JAYWALK's format: the picture set RIGHT (100 %), zoomed out; the full card's art right at 80 % by its width
    assert.equal(S.strip.length, 3); assert.equal(S.strip[0], 100); assert.ok(S.strip[1] >= 0 && S.strip[1] <= 100 && S.strip[2] >= 0.6 && S.strip[2] <= 0.9);
    assert.deepEqual(S.full, [100, 50, 0.8, 'w']); assert.match(S.ground, /^#0[0-9a-f]0[0-9a-f]0[0-9a-f]$/, 'a dark ground for the name');
    // THE SLIM-CARD LONG-NAME STANDARD: on a 358 × 64 strip the hero sits ≈ 0.78 across, whole inside the strip's height; the picture begins right of the name's first letters
    const k = Math.max(358 / 1280, 64 / 720) * S.strip[2], ox = (358 - 1280 * k) * S.strip[0] / 100, oy = (64 - 720 * k) * S.strip[1] / 100;
    const hx = (ox + (S.hero[0] + S.hero[2] / 2) * k) / 358, y0 = oy + S.hero[1] * k, y1 = oy + (S.hero[1] + S.hero[3]) * k;
    assert.ok(hx >= 0.74 && hx <= 0.83, `${id}: the hero ${hx.toFixed(2)} across the strip`); assert.ok(y0 >= -2 && y1 <= 66, `${id}: the hero inside the strip (${y0.toFixed(0)} … ${y1.toFixed(0)})`);
    assert.ok(ox / 358 >= 0.1, `${id}: the left of the strip is the dark ground`);
    for (const box of [S.hero, S.heroFull]) assert.ok(box[0] >= 640 && box[0] + box[2] <= 1280 && box[1] >= 0 && box[1] + box[3] <= 720, `${id}: its hero is on the RIGHT half of the art`);
  }
  assert.match(read('art/highrise-cards/src/notes.txt'), /top-of-the-world-v2\.png\s+official pick/, 'TOP OF THE WORLD = Grok\'s v2 (the colossal ship)');
  assert.doesNotMatch(code('js/fx/hi-specs.js'), /import /, 'pure data');
  // NOTHING READS THEM YET (S4 adds + awards the cards)
  for (const f of ['js/vault/catalog.js', 'js/vault/strip.js', 'js/vault/full.js', 'js/fx/jw-cards.js', 'api/_lib/catalog.js']) assert.doesNotMatch(read(f), /hi-specs|HI_SPECS/, `${f} does not read the HIGH RISE cards' specs`);
  assert.match(read('.vercelignore'), /^\/art$/m, 'the masters never deploy');
});
