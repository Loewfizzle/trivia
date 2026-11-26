// FREEFALL F2 — THE TEST PAGE (freefall-play.html + js/games/freefall/play.js · stage.js · night.js · night-fx.js · sfx.js … —
// docs/freefall.md "THE TEST PAGE"): the real game's night look + SOLO, UNLISTED, and **NOTHING COUNTS UNTIL GO-LIVE**. This file is the
// STATIC half (THE UNIT JOB INSTALLS NOTHING: no browser here) — the page's WHOLE module graph is walked and proven clean, the pure
// modules (best.js · sounds.js) are run, the frame functions are scanned (ZERO GARBAGE IN PLAY); the BROWSER half (the page at
// 390 × 844, real drags, the hold, the end, the network log, the shots, the speed) is tests/integration/freefall-play.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { BEST_KEY, cleanBest, bestLine, crossedBest, nextBest } from '../js/games/freefall/best.js';
import { SOUNDS, SOUND_IDS, SOUND_FILES, VOICES, BOUNCE_VARY_DB, MUSIC, SCALE_STEPS, scaleRate, cuesOf, admitSlot, CUE_NEW_BEST } from '../js/games/freefall/sounds.js';
import { createRun, stepTo, turn, isOver } from '../js/games/freefall/engine.js';
import { makeBot, planFlight } from '../js/games/freefall/bot.js';
import { MODES, AREAS } from '../js/games/freefall/tuning.js';
import { PALETTES, TRENCH_PALETTES } from '../js/games/freefall/palettes.js';

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
const FF = 'js/games/freefall/';
/** a function's body (from its head line to its closing brace) */
function body(src, head) {
  const i = src.indexOf(head);
  assert.ok(i >= 0, `the source still has "${head}"`);
  let d = 0;
  for (let k = src.indexOf('{', i + head.length - 1); k < src.length; k++) { if (src[k] === '{') d++; else if (src[k] === '}' && --d === 0) return src.slice(i + head.length, k); }
  throw new Error(`no end of ${head}`);
}
/** code only: block + line comments and string / template contents out (a comment may say anything) */
const bare = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').replace(/`(?:[^`\\]|\\.)*`/g, '``').replace(/'(?:[^'\\\n]|\\.)*'/g, "''");

test('THE PAGE: at the site root (deployed), noindex nofollow, UNLISTED (nothing links to it), three.js 0.160 through the same import map as HIGH RISE\'s test page', () => {
  assert.ok(existsSync(new URL('../freefall-play.html', import.meta.url)));
  const html = read('freefall-play.html'), ignore = read('.vercelignore');
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
  assert.equal(html.match(/<script type="importmap">[^<]+<\/script>/)[0], read('highrise-play.html').match(/<script type="importmap">[^<]+<\/script>/)[0], 'the same three.js 0.160 READABLE build as HIGH RISE\'s (LAG RULES 7)');
  assert.match(html, /three@0\.160\.0\/build\/three\.module\.js/); assert.doesNotMatch(html, /three\.module\.min\.js/);
  assert.match(html, /<script type="module" src="js\/games\/freefall\/play\.js" onerror=/, 'its one script (a failed load says so — never a blank page)');
  assert.match(html, /Opening Freefall…/);
  const urls = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(urls.filter(u => !u.startsWith('https://fonts.')), ['assets/favicon-64.png', 'css/base.css', 'css/components.css', 'css/freefall-play.css', 'js/games/freefall/play.js']);
  assert.deepEqual([...new Set([...html.matchAll(/https?:\/\/([^\s"'<>/]+)/g)].map(m => m[1]))].sort(), ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'], 'three.js + the site\'s fonts: no other host');
  assert.ok(!/freefall/.test(ignore) && !/^\*\.html$/m.test(ignore), '.vercelignore keeps it (it deploys)');
  assert.match(read('scripts/serve.mjs'), /path === '\/freefall-play'/, 'the local server maps /freefall-play like Vercel\'s cleanUrls');
  assert.match(read('tests/integration/kit/page-loads.mjs'), /\['\/freefall-play', "!!document\.querySelector\('#app \.ff-stage'\)"\]/, 'THE PAGES LOAD: a stranger gets the stage');
  // UNLISTED: no page, no script, no manifest names it — and FREEFALL is still registered NOWHERE
  for (const f of ['index.html', 'board.html', 'admin.html', 'lab.html', 'daychart.html', 'jaywalk-lab.html', 'highrise-play.html', 'freefall-lab.html', '404.html', 'manifest.webmanifest', 'sw.js', 'vercel.json']) assert.doesNotMatch(read(f), /freefall-play/i, `${f} never names it`);
  for (const f of ['js/config.js', 'js/app.js', 'js/games/registry.js', 'js/games/cartridge.js', 'js/games/metas.js', 'js/games/contract.js', 'js/games/preload.js', 'js/games/preload-graph.js', 'js/core/game-order.js', 'js/core/proof.js', 'database.rules.json', 'index.html']) assert.doesNotMatch(read(f), /freefall/i, `${f} does not know FREEFALL`);
  for (const n of ['meta.js', 'index.js', 'view.js', 'director.js']) assert.ok(!existsSync(new URL(`../${FF}${n}`, import.meta.url)), `no ${n}: nothing a console could load as a game`);
  for (const f of readdirSync(new URL('../api/', import.meta.url)).filter(n => n.endsWith('.js'))) assert.doesNotMatch(read(`api/${f}`), /freefall/i, `api/${f}: no endpoint wiring`);
});

test('NOTHING COUNTS UNTIL GO-LIVE — the page\'s WHOLE module graph (static + lazy): its own files, the kit\'s tiers, the shared sheet + audio engine, three.js; nothing from /api, the profile, progression, the report, share, the cards, Firebase, the store; THE DOOR is shut before the stage mounts', () => {
  const g = graph(`${FF}play.js`);
  const own = g.files.filter(f => f.startsWith(FF)).map(f => f.slice(FF.length));
  assert.deepEqual(own, ['audition.js', 'bakedtext.js', 'best.js', 'endscreen.js', 'engine.js', 'logic.js', 'night-fx.js', 'night.js', 'palettes.js', 'play.js', 'replay.js', 'sfx.js', 'sounds.js', 'stage.js', 'tower-gen.js', 'tuning.js'], 'the game\'s own modules (never the bots, the lab or the graybox)');
  assert.deepEqual(g.files.filter(f => !f.startsWith(FF)), ['js/audio/engine.js', 'js/audio/leave-text.js', 'js/audio/settings.js', 'js/audio/sfx-kit.js', 'js/audio/sound-state.js', 'js/core/bot-ua.js', 'js/core/quiet-kinds.js', 'js/core/rng.js', 'js/errlog.js', 'js/games/kit/tiers.js', 'js/ui/dom.js', 'js/ui/layers.js', 'js/ui/lazy-import.js', 'js/ui/sheet.js'], 'the shared modules: the audio engine + its helpers, the kit\'s tiers, THE SHEET, the lazy loader, the integer hash');
  assert.deepEqual(g.bare, ['three'], 'the one outside module: three.js (the import map)');
  for (const f of g.files) assert.ok(!/\/(profile|progress|board|daily|vault|chat|admin|screens)\/|js\/(firebase|store|room|host|identity|seat|app|config)\.js|^api\//.test(f), `${f}: nothing that counts is in the graph`);
  // THE DOOR (HIGH RISE's): the shared audio engine COUNTS a leave once (errlog.js#countQuiet → /api/log) and the skew wrapper may ask
  // /api/time — on THIS page every request to /api/ is stopped before it leaves the phone
  const door = code(`${FF}play.js`);
  assert.ok(door.includes("const toApi = u => { try { return new URL(String((u && u.url) || u), location.href).pathname.startsWith('/api/'); } catch { return false; } };"));
  assert.ok(door.includes("window.fetch = (u, o) => (toApi(u) ? Promise.reject(new TypeError('this page never calls the server')) : pageFetch(u, o));"));
  assert.ok(door.includes('if (pageBeacon) navigator.sendBeacon = (u, d) => (toApi(u) ? true : pageBeacon(u, d));'));
  assert.ok(door.indexOf('window.fetch = ') > 0 && door.indexOf('window.fetch = ') < door.indexOf('createStage(app,'), 'the door is shut before the page mounts (before the audio engine is ever installed)');
  const doorText = door.slice(door.indexOf('const toApi'), door.indexOf('const FIXED'));
  for (const f of own) {
    const s = code(`${FF}${f}`).replace(doorText, '');
    assert.doesNotMatch(s, /XMLHttpRequest|sendBeacon|WebSocket|EventSource|navigator\.serviceWorker|importScripts/, `${f}: no beacon, no socket`);
    assert.doesNotMatch(s, /firebase|initFirebase|\/api\/|['"`]\/?api\b|whoami|identity|errlog|\bstore\.|reportError|countQuiet/i, `${f}: no server, no Firebase, no report`);
    assert.doesNotMatch(s, /(^|[^.\w])(set|update|remove|push|runTransaction|onValue)\(\s*(ref|dbRef)\b/m, `${f}: no database write`);
    assert.doesNotMatch(s, /sessionStorage|indexedDB|document\.cookie|caches\./, `${f}: no other storage`);
    if (f !== 'play.js') assert.doesNotMatch(s, /localStorage/, `${f}: stores nothing (the page hands the stage its best)`);
    // its only fetches: the pictures (night.js) + the sounds (sfx.js) — its own static files
    if (!['night.js', 'sfx.js', 'play.js'].includes(f)) assert.doesNotMatch(s, /(^|[^.\w])fetch\s*\(/, `${f}: makes no request`);
  }
  assert.match(code(`${FF}night.js`), /fetch\(url\)\.then\(r => \{ if \(!r\.ok\) throw new Error\('no picture'\); return r\.blob\(\); \}\)/, 'night.js fetches its pictures only');
  assert.match(code(`${FF}sfx.js`), /fetch\(new URL\(`\$\{s\.dir\}\/\$\{s\.file\}\.mp3\?v=\$\{FF_SFX_REV\}`, DIR\)\)/, 'sfx.js fetches its sound files only');
  // its ONE stored value: YOUR BEST — this phone's
  const p = code(`${FF}play.js`);
  assert.deepEqual([...p.matchAll(/localStorage\.(\w+)\(([A-Z_]+)/g)].map(m => `${m[1]} ${m[2]}`), ['getItem BEST_KEY', 'setItem BEST_KEY']);
  assert.equal(BEST_KEY, 'ff:play:best');
  // every lazy chunk goes through the skew wrapper (never a bare dynamic import)
  for (const f of own) for (const m of code(`${FF}${f}`).matchAll(/(\w+)?\(?\s*import\(\s*'([^']+)'\s*\)/g)) assert.equal(m[1], 'lazyImport', `${f}: the lazy chunk ${m[2]} goes through lazyImport`);
});

test('THE RUN ON THE PAGE: FAIR INPUT (each move at its own event time, coalesced samples too), the drag 1 : 1, MAX SPIN\'s rest offered again, the moves BEFORE the landings, tick 0 = the first drag (after the sounds\' decode), THE HOLD on hide + 3 · 2 · 1, REPLAY = LIVE after every run (the console)', () => {
  const s = code(`${FF}stage.js`);
  assert.match(s, /app\.addEventListener\('pointerdown', e => \{/); assert.match(s, /app\.addEventListener\('pointermove', e => \{/);   // (THE REVIEW: the whole page is the drag's ground — the bars beside the column too)
  assert.match(s, /if \(drag\) return; /, 'THE REVIEW: a second finger never steals the drag');
  assert.match(s, /if \(t0 == null\) \{ if \(performance\.now\(\) - restartAt < RESTART_GUARD_MS\) return; begin\(stamp\(e\.timeStamp\)\); \}/, 'THE REVIEW: the tail of a double tap on PLAY AGAIN is not a start');
  assert.match(s, /if \(held\) \{ countAt = 0; countShown = 0; holdN\.textContent = ''; return; \}/, 'THE REVIEW: hidden again during the 3 · 2 · 1 — the count starts over, never skipped');
  assert.match(s, /if \(document\.visibilityState === 'hidden'\) hide\(\);/, 'THE REVIEW: a run that goes live behind a hidden page is held at once');
  assert.doesNotMatch(s, /addEventListener\('click'/, 'never a click (TAPS ON PLAIN PAGE AREAS)');
  assert.match(s, /carry \+= \(s\.clientX - drag\.x\) \* TURN \/ \(2 \* Math\.PI \* view\.pxPerRad\(\)\);/, '1 : 1 — the finger\'s pixels → the ring\'s own radians → angle units (F1\'s scale)');
  assert.match(s, /typeof e\.getCoalescedEvents === 'function' \? e\.getCoalescedEvents\(\) : null/, 'every sample the browser gathered, each at its own time');
  assert.match(s, /const T = tickOf\(ts, t0\);/, 'a move\'s event time → its tick');
  assert.match(s, /owed -= turn\(run, T, owed, ev\);/, 'the engine\'s own turn(): it clamps to MAX SPIN and logs the move');
  assert.match(s, /export const OWED_MAX = 8 \* MAX_SPIN;/);
  assert.match(s, /settle\(T\);[^\n]*\n\s*stepTo\(run, T, ev\);/, 'in a frame: the moves first, THEN the landings up to that tick');
  assert.match(s, /begin\(stamp\(e\.timeStamp\)\);/, 'the first drag starts the run');
  assert.match(s, /snd\.whenReady\(START_WAIT_MS\)/); assert.match(s, /export const START_WAIT_MS = 600;/);
  assert.match(s, /if \(t0 == null\) \{ if \(starting\) pre \+= units; return; \}/, 'the finger\'s moves before tick 0 are kept');
  // THE HOLD
  assert.match(s, /if \(!isOver\(run\) && hold\(run, Math\.max\(T \+ 1, run\.mt\), ev\)\) \{/, 'the page hidden: the run is stepped to now, then HELD at the next free tick (engine.js#hold)');
  assert.match(s, /document\.addEventListener\('visibilitychange', \(\) => \{ if \(document\.visibilityState === 'hidden'\) hide\(\); else show\(\); \}, sig\);/);
  assert.match(s, /if \(held && !countAt\) countAt = performance\.now\(\) \+ 3 \* COUNT_MS;/, 'back: 3 · 2 · 1');
  assert.match(s, /held = false; countAt = 0; t0 = now - heldT \* TICK_MS;/, '… then on from the hold\'s tick: the time away never was run time');
  assert.match(s, /\} else away = true;/, 'no hold left / a match: the run goes on unseen');
  assert.deepEqual([MODES.solo.holds, MODES.match.holds], [3, 0]);
  // REPLAY = LIVE: the console only
  assert.match(s, /const evR = \[\], \{ used, bad, why, \.\.\.r \} = replay\(\{ seed, mode: MODE, log, ev: evR \}\);/);
  assert.match(s, /const verdict = judgeRun\(\{ seed, mode: MODE, log \}\);/);
  assert.match(s, /console\[same \? 'info' : 'error'\]\(same \? `\[freefall\] REPLAY = LIVE ✓/);
  assert.doesNotMatch(read('css/freefall-play.css'), /ff-check/, 'no REPLAY = LIVE line on the card (the console only)');
  // a `?floor=N` start is not a run: it never moves YOUR BEST
  assert.match(s, /const isNew = !fromRun && res\.floor > was;/);
  // the sound sync: a live run holds the audio context awake (a lease), let go at the end / a hold / a hide
  assert.match(s, /const awake = on => \{ const f = globalThis\.__nsHoldAwake; if \(f\) \{ try \{ f\(on, 'freefall'\); \}/);
});

test('YOUR BEST (best.js — PURE): this phone\'s; no best = no line; the fall that passes it = the crossing, once; the best after a run', () => {
  assert.deepEqual([cleanBest('88'), cleanBest(88), cleanBest(null), cleanBest('x'), cleanBest(-3), cleanBest(1.5), cleanBest(1e9)], [88, 88, 0, 0, 0, 0, 0]);
  assert.equal(bestLine(88), 'YOUR BEST 88'); assert.equal(bestLine(0), '');
  assert.equal(crossedBest(88, 88), false); assert.equal(crossedBest(88, 89), true); assert.equal(crossedBest(88, 90), false, 'once'); assert.equal(crossedBest(0, 1), false, 'a first run crosses nothing');
  assert.equal(nextBest(88, 60), 88); assert.equal(nextBest(88, 141), 141);
  const src = code(`${FF}best.js`);
  assert.doesNotMatch(src, /\bimport\b|document|window|localStorage/, 'pure: no DOM, no storage');
});

test('THE SOUNDS\' TABLE (sounds.js — PURE): nine sounds, every file ships (seven of FREEFALL\'s + JAYWALK\'s two), THE NOTE up a major-pentatonic scale holding after 8; the triggers on REAL runs', () => {
  assert.deepEqual(SOUND_IDS, ['bounce', 'whoosh', 'blaze', 'shatter', 'crash', 'lights-out', 'bottom', 'area-arrive', 'new-best']);
  for (const [dir, file] of SOUND_FILES) { const u = new URL(`../audio/${dir}/${file}.mp3`, import.meta.url); assert.ok(existsSync(u), `audio/${dir}/${file}.mp3 ships`); assert.ok(statSync(u).size > 2000); }
  assert.deepEqual(SOUNDS.filter(s => s.dir === 'jaywalk').map(s => s.id), ['area-arrive', 'new-best'], 'area arrival + NEW BEST are JAYWALK\'s files (reused, no copy)');
  assert.deepEqual(readdirSync(new URL('../audio/freefall/', import.meta.url)).sort(), ['CREDITS.md', 'blaze.mp3', 'bottom.mp3', 'bounce.mp3', 'crash.mp3', 'lights-out.mp3', 'shatter.mp3', 'whoosh.mp3'], 'the seven picks (take A) + their credits: no B take ships');
  const credits = read('audio/freefall/CREDITS.md');
  for (const id of ['bounce', 'whoosh', 'blaze', 'shatter', 'crash', 'lights-out', 'bottom']) assert.match(credits, new RegExp(`\\| \`${id}\\.mp3\` \\| ".+CC0 1\\.0`), `${id}: its source is credited (CC0)`);
  assert.equal((credits.match(/CC BY/g) || []).length, 1, 'no CC BY source (the one mention says so)');
  for (const s of SOUNDS) assert.ok(s.gain > 0 && s.gain <= 1.5 && s.pri >= 1 && s.pri <= 4 && Object.isFrozen(s));
  assert.equal(SOUNDS.find(s => s.id === 'bottom').play, false, 'THE BOTTOM is ready for F3\'s finish — in the list, not in a solo run');
  assert.ok(SOUNDS.find(s => s.id === 'bounce').gain < SOUNDS.find(s => s.id === 'crash').gain, 'the bounce is SOFT (it sounds every 0.6 s)');
  assert.deepEqual([VOICES, BOUNCE_VARY_DB], [8, 1.5]); assert.deepEqual(MUSIC, ['mood:evening', 'menu']);
  // THE NOTE's scale: do re mi so la do′ re′ mi′ — one step a clean floor in a row, holding at the top
  assert.deepEqual(SCALE_STEPS, [0, 2, 4, 7, 9, 12, 14, 16]);
  assert.equal(scaleRate(0), 1); assert.equal(scaleRate(1), 1); assert.ok(Math.abs(scaleRate(6) - 2) < 1e-9, 'the sixth clean floor: an octave up'); assert.equal(scaleRate(8), scaleRate(99), 'it holds at the top');
  for (let n = 2; n <= 8; n++) assert.ok(scaleRate(n) > scaleRate(n - 1));
  // THE TRIGGERS, on hand-made events
  const ids = evs => cuesOf(evs).map(c => `${c.id}${c.rate ? `@${c.rate.toFixed(3)}` : ''}`);
  assert.deepEqual(ids([{ e: 'land' }, { e: 'bounce', floor: 3, slice: 2 }]), ['bounce'], 'a landing on solid ground: the note as recorded');
  assert.deepEqual(ids([{ e: 'fall', floor: 4, clean: 1 }]), ['whoosh', 'bounce@1.000']); assert.deepEqual(ids([{ e: 'fall', floor: 5, clean: 2 }]), ['whoosh', `bounce@${scaleRate(2).toFixed(3)}`]);
  assert.deepEqual(ids([{ e: 'fall', floor: 9, clean: 40 }]), ['whoosh', `bounce@${scaleRate(8).toFixed(3)}`], 'a long dive holds the top note');
  assert.deepEqual(ids([{ e: 'shatter', floor: 5 }, { e: 'fall', floor: 6, clean: 0 }]), ['shatter', 'whoosh'], 'a shatter: no note (the clean count is spent)');
  assert.deepEqual(ids([{ e: 'bounce', floor: 6, slice: 1, red: true }]), ['bounce', 'crash@1.600'], 'the landing right after a shatter on red: the bounce + a short high crack');
  assert.deepEqual(ids([{ e: 'blaze', floor: 7 }]), ['blaze']); assert.deepEqual(ids([{ e: 'area', id: 'offices', floor: 40 }]), ['area-arrive']);
  assert.deepEqual(ids([{ e: 'out', cause: 'red' }]), ['crash']); assert.deepEqual(ids([{ e: 'out', cause: 'dark' }]), ['lights-out']); assert.deepEqual(ids([{ e: 'made' }]), ['bottom']);
  assert.deepEqual(ids([{ e: 'hold', t: 5 }, { e: 'dark', floor: 2 }, { e: 'cap' }]), [], 'a hold, the darkness\'s steps, the cap: silent');
  // a late batch (the page was away, the run went on): only its END sounds
  assert.deepEqual(cuesOf([{ e: 'bounce' }, { e: 'fall', clean: 1 }, { e: 'blaze' }, { e: 'out', cause: 'dark' }], true).map(c => c.id), ['lights-out']);
  // from an index, into a kept list (ZERO GARBAGE: the cues are constants)
  const kept = [], evs = [{ e: 'bounce' }, { e: 'bounce' }, { e: 'fall', clean: 3 }];
  assert.equal(cuesOf(evs, false, kept, 2), kept); assert.deepEqual(kept.map(c => c.id), ['whoosh', 'bounce']); assert.equal(cuesOf(evs, false, kept, 2)[1], cuesOf(evs, false, [], 2)[1], 'the same constant record');
  assert.equal(CUE_NEW_BEST.id, 'new-best');
  // … and on REAL runs: every bounce event has its note, every clean fall its whoosh + the scale's step, a run's end its end sound
  let bounces = 0, falls = 0, top = 0;
  for (let k = 0; k < 20; k++) {
    const run = createRun({ seed: `snd${k}`, mode: 'solo' }), ev = [], bot = makeBot(k % 2 ? 'good' : 'great', `snd${k}`);
    // (the bot's own flight-by-flight play, its events kept: bot.js#playBot keeps none)
    while (!isOver(run) && run.floor < 120) { const N = run.nl, pl = planFlight(run, bot), spin = bot.P.spin; let rest = pl.d; for (let t = run.t + 1 + pl.wait; t <= N && rest !== 0 && !isOver(run); t++) { const step = rest > spin ? spin : rest < -spin ? -spin : rest; turn(run, t, -step, ev); rest -= step; } stepTo(run, N, ev); }
    stepTo(run, MODES.solo.capTicks, ev);
    const cues = cuesOf(ev);
    const nB = ev.filter(e => e.e === 'bounce').length, nF = ev.filter(e => e.e === 'fall').length, nClean = ev.filter(e => e.e === 'fall' && e.clean > 0).length;
    assert.equal(cues.filter(c => c.id === 'bounce' && c.vary).length, nB); assert.equal(cues.filter(c => c.id === 'whoosh').length, nF); assert.equal(cues.filter(c => c.id === 'bounce' && !c.vary).length, nClean);
    assert.equal(cues.filter(c => c.id === 'shatter').length, ev.filter(e => e.e === 'shatter').length);
    assert.equal(cues.filter(c => c.id === 'area-arrive').length, ev.filter(e => e.e === 'area').length);
    assert.equal(cues.filter(c => c.id === 'crash' && !c.rate).length + cues.filter(c => c.id === 'lights-out').length, 1, 'ONE end sound');
    bounces += nB; falls += nF; top = Math.max(top, ...ev.filter(e => e.e === 'fall').map(e => e.clean));
  }
  assert.ok(bounces > 500 && falls > 800 && top >= 4);
  // PRIORITY on the voice pool: a full house drops a bounce, never an end sound
  const slots = Array.from({ length: 11 }, (_, i) => ({ on: i < 8, pri: 1, at: i }));
  assert.equal(admitSlot(slots.map(s => ({ ...s, on: false })), 1), -1); assert.equal(admitSlot(slots, 1), -2, 'outranked: dropped'); assert.equal(admitSlot(slots, 4), 0, 'the oldest low voice goes');
  assert.doesNotMatch(code(`${FF}sounds.js`), /\bimport\b|document|window|AudioContext/, 'pure, no imports');
});

test('THE SOUNDS\' PLAYER (sfx.js — static): the shared engine\'s SFX bus through a soft limiter, 8 voices from a pool, an effect asks isUnlocked() — never the context\'s state —, the lead-in skipped, nothing thrown when silent', () => {
  const s = code(`${FF}sfx.js`);
  assert.match(s, /import \{ getContext, getSfxBus, isUnlocked, onUnlock, onRebuild, audioUnlocked, audioHushed \} from '\.\.\/\.\.\/audio\/engine\.js';/);
  assert.match(s, /import \{ leadIn, lateGate, decodeOnce \} from '\.\.\/\.\.\/audio\/sfx-kit\.js';/, 'the shared sfx kit (THE AUDIO FIXES): the late gate, one decode a file, the lead-in');
  assert.match(s, /if \(!isUnlocked\(\) \|\| !ctx \|\| !buf \|\| bufCtx !== ctx\)/); assert.doesNotMatch(s, /\.state\s*===?\s*'running'/, 'AN EFFECT ASKS isUnlocked(), NEVER THE CONTEXT\'s STATE');
  assert.match(s, /trim\.connect\(getSfxBus\(\) \|\| ctx\.destination\);/); assert.match(s, /src\.start\(t \+ delay, leadIn\(buf\)\);/);
  assert.match(s, /const POOL = VOICES \+ 3;/); assert.match(s, /if \(audioUnlocked\(\) && audioHushed\(\)\) return;/, 'MUTED: nothing waits, nothing is made');
  assert.match(code(`${FF}audition.js`), /openSheet\(\{ title: 'SOUNDS', kicker: 'FREEFALL · EVERY SOUND'/, 'the SOUNDS list = THE SHEET');
});

test('THE NIGHT LOOK (night.js + night-fx.js — static): ONE instanced mesh for the slices (only the floors in sight), our own bloom at tier 2 only, the walls at half resolution, the warm frame, the pictures decoded off the frame, RED is more than a colour, the darkness never dims the ball', () => {
  const n = code(`${FF}night.js`), fx = read(`${FF}night-fx.js`);
  assert.match(n, /export const BELOW = 9;/, 'only the ~10 nearest floors are drawn');
  assert.match(n, /const sGeo = wedgeGeo\(\), aI = inst\(sGeo, 'aI', MAXI, 4\), aC = inst\(sGeo, 'aC', MAXI, 4\), aF = inst\(sGeo, 'aF', MAXI, 4\), aR = inst\(sGeo, 'aR', MAXI, 3\);/, 'the slices: ONE instanced mesh (aR — F3: its area\'s rim colour)');
  assert.match(n, /export const SHAPE = Object\.freeze\(\{ H: 1, RO: 1, RI: 0\.2, RB: 0\.66, R_BALL: 0\.125, THICK: 0\.2, HOP: 0\.42, RISE: 0\.1, RW: 2\.7 \}\);/);
  assert.match(n, /export const CAM = Object\.freeze\(\{ fov: 46, pitch: 33, fill: 0\.8, ballY: 0\.34, aspectMax: 0\.47 \}\);/, 'the play camera = F1\'s graybox camera (the drag\'s 1 : 1 scale is the owner\'s phone check)');
  assert.match(read(`${FF}graybox.js`), /export const CAM = Object\.freeze\(\{ fov: 46, pitch: 33, fill: 0\.8, ballY: 0\.34, aspectMax: 0\.47 \}\);/);
  assert.match(n, /if \(bloom && tier === 2\) bloom\.render\(scene, cam, TWINS, 1\);/, 'the bloom: tier 2 only — every mesh has its twin material in that pass');
  assert.match(n, /dpr = Math\.min\(devDpr, dprMax, tier === 2 \? 3 : tier === 1 \? 2 : 1\.5\);/, 'the tiers: full 3× · 2× no bloom · 1.5×');
  assert.match(n, /wallRT\.setSize\(Math\.max\(2, bw >> 1\), Math\.max\(2, bh >> 1\)\);/, 'the shaft\'s wall is drawn at HALF resolution, then copied up');
  assert.match(n, /createImageBitmap\(bl\)/); assert.match(n, /try \{ renderer\.initTexture\(tex\); \}/, 'a picture is decoded off the frame + uploaded at once (LAG RULES 1)');
  assert.match(n, /renderer\.compile\(scene, cam\); renderer\.compile\(wallScene, wallCam\);/, 'THE WARM FRAME builds every program');
  assert.match(n, /renderer\.sortObjects = false;/); assert.match(n, /scene\.matrixAutoUpdate = false; scene\.matrixWorldAutoUpdate = false;/);
  assert.match(n, /assets\/freefall\/walls\/\$\{name\}-night\.webp/); assert.match(n, /assets\/jaywalk\/skyline-night\.webp/, 'THE ROOFTOP: JAYWALK\'s night skyline (reused, no copy)');
  for (const w of ['offices', 'speakeasy', 'harbor', 'deep']) { const u = new URL(`../assets/freefall/walls/${w}-night.webp`, import.meta.url); assert.ok(existsSync(u) && statSync(u).size < 120000, `${w}: its night wall ships, small`); }
  // RED: hsl(352) — and readable with the colour removed: it stands proud, dark chevrons, a pulse
  assert.match(fx, /const vec3 RED = vec3\(1\.0, 0\.03, 0\.09\), RED_DARK/); assert.match(fx, /float cx = rad \* 2\.6 - abs\(ang\) \* 0\.9 \+ 0\.15, cw = fwidth\(cx\) \* 1\.2 \+ 1e-4, cf = abs\(fract\(cx\) - 0\.75\) - 0\.24;/, 'the chevrons, their edges smoothed by their own width on the screen (THE REVIEW: never a stair-step)'); assert.match(fx, /vec3 rimC = red > 0\.5 \? vec3\(1\.0, 0\.2, 0\.24\) \* 1\.7 : mix\(rimHue, vec3\(1\.0\), 0\.22\) \* 1\.75;/, 'THE REVIEW: a red slice\'s rim is hot red — never the safe slices\' white line'); assert.match(fx, /float pulse = 0\.86 \+ 0\.14 \* sin\(uTime \* 3\.1/);
  assert.match(n, /I\[q \+ 2\] = kind \? SHAPE\.RISE : 0;/, 'a red slice stands proud of the floor');
  // THE DARKNESS: the wall only (above its line) + the screen's edges — never the slices, never the ball
  assert.match(fx, /float lit = smoothstep\(uDarkY \+ 0\.9, uDarkY - 0\.25, hitY\);/); assert.doesNotMatch(fx.slice(fx.indexOf('export const SLICE_F'), fx.indexOf('export const PILLAR_V')), /uDarkY/, 'the slices never read the darkness');
  assert.doesNotMatch(fx.slice(fx.indexOf('export const BALL_F'), fx.indexOf('export const LIGHT_V')), /uDarkY/);
  assert.match(read('css/freefall-play.css'), /\.ff-dark \{[^}]*radial-gradient\(ellipse 66% 46% at 50% 45%, rgba\(3, 0, 10, 0\) 44%/, 'the edges close in round a clear window where the ball is');
  // THE COLOURS: red is danger on the tower and NOTHING else — no red in the page's stylesheet, the end's cause is ultraviolet
  const css = read('css/freefall-play.css').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of css.matchAll(/rgba?\((\d+),\s*(\d+),\s*(\d+)/g)) { const [r, g, b] = [+m[1], +m[2], +m[3]]; assert.ok(!(r > 200 && g < 90 && b < 110), `no red in the stylesheet: ${m[0]}`); }
  assert.doesNotMatch(css, /border-radius:\s*(999|9999|50)px|border-radius:\s*100px/, 'NO PILLS');
  assert.match(code(`${FF}endscreen.js`), /export const NEON = Object\.freeze\(\{ pink: '#ff4fa8', teal: '#27e0e6', mode: '#cfeff5', gold: '#ffc83c' \}\);/, 'FREEFALL\'s ACCENT (F3 — the owner): title-05\'s hot pink + electric teal');
});

test('ZERO GARBAGE IN PLAY (HIGH RISE\'s LAG RULES — static): no function that runs every frame builds a list, a record, a closure, a spread or a string; the big number is BAKED', () => {
  const BUILDS = [[/=>/, 'an arrow function'], [/\bfunction\b/, 'an inner function'], [/\.\.\./, 'a spread'], [/`/, 'a template string'], [/[=(,:?]\s*\[/, 'a list'], [/[=(,:?]\s*\{/, 'a record'],
    [/\bnew\s+[A-Z]/, 'a new object'], [/\.(map|filter|slice|concat|flatMap|reduce|split|join|keys|values|entries|toFixed|toString|padStart)\(/, 'a list- / string-making call'], [/Array\.from|Object\.(assign|keys|values|entries)|JSON\.|String\(/, 'a builder'], [/\bfor\s*\([^)]*\bof\b/, 'a for … of (an iterator)']];
  const frameFns = {
    'stage.js': ['  function frame(now) {', '  function settle(T) {'],
    'night.js': ['  function draw(run, tau, dt, extra = 0) {', '  function putFloor(i, n, alpha, out, tick) {', '  function floorRec(i) {', '  function colourOf(i, slot) {', '  function ballLift(run, tau) {', '  function place(c, pitchDeg, back, ballY, camY, kick) {', '  function walls(floor) {'],
    'night-fx.js': ['    render(scene, cam, twins, k = 1) {'],
    'sounds.js': ['export function cuesOf(events, late = false, out = [], from = 0) {'],
  };
  for (const [file, heads] of Object.entries(frameFns)) {
    const src = bare(read(`${FF}${file}`));
    for (const h of heads) for (const [re, what] of BUILDS) assert.doesNotMatch(body(src, h), re, `${file} ${h.trim()} builds ${what}`);
  }
  const s = bare(read(`${FF}stage.js`));
  assert.doesNotMatch(body(s, '  function frame(now) {'), /getBoundingClientRect|clientHeight|clientWidth|offsetTop|offsetHeight|\.style\./, 'the frame reads no layout and writes no style (the HUD\'s two change functions do)');
  assert.match(s, /if \(run\.floor !== hudFloor\) hudFloorNow\(\);/); assert.match(s, /if \(gap !== hudGap\) hudDarkNow\(gap, over\);/);
  const n = bare(read(`${FF}night.js`));
  assert.match(n, /const S = new Float64Array\(24\);/, 'the frame\'s fractions live in ONE typed scratch array');
  assert.match(n, /const ro = new ResizeObserver\(measure\);/, 'the sizes come from a ResizeObserver — never a layout read in a frame');
  assert.doesNotMatch(body(n, '  function draw(run, tau, dt, extra = 0) {'), /clientWidth|clientHeight|getBoundingClientRect/);
  // THE BAKED NUMBER: a floor copies bitmaps — no text-shadow is re-rasterised in play; the gold set is warmed behind the opening
  assert.match(code(`${FF}bakedtext.js`), /for \(let i = 0; i < count; i\+\+\) \{ const d = s\.charCodeAt\(i\) - 48; c\.drawImage\(glyphs\[d\], Math\.round\(x \* dpr\), 0\); x \+= gw\[d\] \+ gap; \}/);
  assert.match(code(`${FF}stage.js`), /stage\.classList\.add\('is-gold'\); BN\.warm\(\); stage\.classList\.remove\('is-gold'\); BN\.dirty\(\);/);
  assert.match(read('css/freefall-play.css'), /\.ff-num\.is-baked \.ff-dg \{ color: transparent; text-shadow: none; \}/);
});

test('THE AREA PALETTES (F3 — DEPTH-RELATIVE: a floor wears its OWN area\'s colour): one palette an area in tuning.js#AREAS\' order, each its own hue, RED IS THE ONLY RED — no colour within 25° of hue 352; the last three floors of an area lean to the next one\'s', () => {
  const hsl = hex => { const r = (hex >> 16 & 255) / 255, g = (hex >> 8 & 255) / 255, b = (hex & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0; if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [(h * 60 + 360) % 360, d ? d / (1 - Math.abs(mx + mn - 1)) : 0, (mx + mn) / 2]; };
  const far = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
  assert.equal(PALETTES.length, AREAS.length - 1, 'one palette an area — THE TRENCH has its own four (a lap each)');
  for (const [i, p] of [...PALETTES, ...TRENCH_PALETTES].entries()) for (const k of ['a', 'b', 'rim', 'day']) {
    const [h, s] = hsl(p[k]);
    assert.ok(s < 0.12 || far(h, 352) > 25, `palette ${i}.${k} #${p[k].toString(16)} — hue ${h.toFixed(0)}: RED IS THE ONLY RED`);
  }
  // each area clearly its own colour: pink · violet → blue · rose + plum (brass rims) · teal + aqua · dark indigo (ultraviolet rims)
  const hue = hex => hsl(hex)[0], inR = (v, lo, hi) => v >= lo && v <= hi;
  assert.ok(inR(hue(PALETTES[0].a), 300, 327) && inR(hue(PALETTES[0].b), 290, 327), 'THE ROOFTOP: hot pink + magenta');
  assert.ok(inR(hue(PALETTES[1].a), 255, 285) && inR(hue(PALETTES[1].b), 215, 240), 'THE OFFICES: electric violet → blue');
  assert.ok(inR(hue(PALETTES[2].a), 300, 327) && inR(hue(PALETTES[2].b), 280, 300) && inR(hue(PALETTES[2].rim), 30, 55) && hsl(PALETTES[2].a)[2] < hsl(PALETTES[0].a)[2] - 0.1, 'THE SPEAKEASY: DEEP rose + plum, warm brass rims');
  assert.ok(inR(hue(PALETTES[3].a), 165, 185) && inR(hue(PALETTES[3].b), 180, 195), 'UNDER THE HARBOR: teal + aqua');
  assert.ok(inR(hue(PALETTES[4].a), 235, 255) && hsl(PALETTES[4].a)[2] < 0.35 && inR(hue(PALETTES[4].rim), 265, 285) && hsl(PALETTES[4].rim)[2] > 0.6, 'THE DEEP: dark indigo, glowing ultraviolet rims');
  // the scene: a floor's own colour (never its place on the screen), the border's lean
  const n = code(`${FF}night.js`), fx = read(`${FF}night-fx.js`);
  assert.match(n, /const t = len > 1 \? \(i - from\) \/ \(len - 1\) : 0, d = from \+ len - i, q = d <= 3 \? palOf\(i \+ d\) : p, tt = q !== p \? \(4 - d\) \/ 4 : 0;/, 'a → b down the area; its last three floors lean ¼ · ½ · ¾ to the next area\'s');
  const sl = fx.slice(fx.indexOf('export const SLICE_F'), fx.indexOf('// ---- THE PILLAR'));
  assert.doesNotMatch(sl, /vec3 walk =/, 'F2\'s gradient on one screen is gone: under the ball the tower only dims');
  assert.match(sl, /vec3 rimHue = vR;/);
});

test('THE AREAS\' WALLS + THE END (static): each area its wall (THE ROOFTOP = the open sky), THE TRENCH cycles the deep\'s palettes; the end = JAYWALK\'s standard — header, cause, number, YOUR BEST, one line, the table\'s slot, PLAY AGAIN · SHARE | CITY', () => {
  const n = code(`${FF}night.js`);
  assert.match(n, /export const WALLS = Object\.freeze\(\[null, 'offices', 'speakeasy', 'harbor', 'deep', 'deep', 'deep'\]\);/);
  assert.equal(AREAS.length, 7, 'one wall an area');
  assert.equal(TRENCH_PALETTES.length, 4, 'THE TRENCH = THE DEEP\'s, cycled: four laps\' rims'); assert.deepEqual([TRENCH_PALETTES[0].a, TRENCH_PALETTES[0].b, TRENCH_PALETTES[0].rim], [PALETTES[4].a, PALETTES[4].b, PALETTES[4].rim], 'its first lap = the deep\'s own');
  const e = code(`${FF}endscreen.js`), s = code(`${FF}stage.js`);
  assert.match(e, /const el = h\('div\.ff-ec', hd, cause, n, fl, bestL, line, table\);/, 'top to bottom: the header · the cause · the number · FLOORS · YOUR BEST · the line · the table\'s slot');
  assert.match(e, /w\('b\.fn-w\.fn-w1', 'FREE', NEON\.pink, NEON\.pink\), w\('b\.fn-w\.fn-w2', 'FALL', NEON\.teal, NEON\.teal\), w\('i\.fn-m', ` · \$\{m\}`, NEON\.mode, NEON\.teal\)/, 'FREE hot pink · FALL electric teal · the mode a pale ice (THE END NEON\'s classes)');
  assert.match(e, /cause\.style\.setProperty\('--fn', NEON\.teal\);/, 'the cause in teal — never red');
  assert.match(s, /h\('div\.ff-endfoot', again, h\('div\.ff-foot-row', share, city\)\)/, 'the foot: PLAY AGAIN, then SHARE | CITY');
  assert.match(s, /'SHARE · SOON'\), city = h\('a\.ff-foot-b\.ff-city', \{ href: '\/' \}, 'CITY'\)/, 'SHARE is a placeholder until F4; CITY goes home');
  assert.match(read('css/freefall-play.css'), /\.ff-again \{[^}]*border-radius: 8px;[^}]*background: var\(--ff-teal\); color: #04262a;/, 'PLAY AGAIN: one solid bar in FREEFALL\'s accent, a rounded rectangle');
  assert.doesNotMatch(read('css/freefall-play.css'), /\.final\.crowned|ff-flash/, 'no pink flash at the end (the page builds its own card — the console\'s crown never runs here)');
});

test('THE BLAZE = NEON FIRE (the F2 add-on — the owner, Nov 26): ONE ramp white → yellow → orange → neon pink for everything that burns; flame SPRITES from Kenney\'s pack (only the four used), a FIXED pool the tiers only trim; a ribbon, embers, fire-lit shards, a fire shockwave; the unlit ball as it was', () => {
  const fx = read(`${FF}night-fx.js`), n = code(`${FF}night.js`);
  // the ramp: its four colours in order, the white heart on top
  const ramp = fx.slice(fx.indexOf('export const FIRE_RAMP'), fx.indexOf('// ---- THE SHAFT'));
  assert.ok(ramp.indexOf('vec3(1.0, 0.07, 0.6)') > 0 && ramp.indexOf('vec3(1.0, 0.07, 0.6)') < ramp.indexOf('vec3(1.0, 0.36, 0.04)') && ramp.indexOf('vec3(1.0, 0.36, 0.04)') < ramp.indexOf('vec3(1.0, 0.84, 0.16)') && ramp.indexOf('vec3(1.0, 0.84, 0.16)') < ramp.indexOf('vec3(1.0, 1.0, 0.92)'), 'neon pink → orange → yellow → white, by heat');
  assert.ok(fx.indexOf('export const FIRE_RAMP') < fx.indexOf('export const WALL_V'), 'the ramp is defined before every shader that reads it');
  for (const name of ['FLAME_F', 'RIBBON_F', 'BALL_F', 'LIGHT_F']) { const at = fx.indexOf(`export const ${name}`), end = fx.indexOf('export const', at + 20); assert.ok(fx.slice(at, end < 0 ? undefined : end).includes('${FIRE_RAMP}'), `${name} burns on the ONE ramp`); }
  // the flames: GPU sprites, a FIXED pool — the tiers trim the rate only
  assert.match(n, /export const FLAMES = 96, FLAME_RATE = Object\.freeze\(\[46, 84, 128\]\), EMBER_RATE = Object\.freeze\(\[10, 22, 36\]\);/);
  assert.match(n, /flameOwed \+= sec \* FLAME_RATE\[tier\]; emberOwed \+= sec \* EMBER_RATE\[tier\];/);
  assert.match(n, /fGeo\.instanceCount = FLAMES;/, 'the pool never changes size');
  assert.match(fx, /vec3 curl = vec3\(sin\(age \* 7\.3 \+ s6 \* 3\.0\)/, 'each flame swirls off its line (a curl of sines by its own seed)');
  assert.match(fx, /float body = mix\(fl, sm, smoothstep\(0\.4, 1\.0, k\)\)/, 'a flame turns to smoke as it ages');
  assert.doesNotMatch(fx.slice(fx.indexOf('export const FLAME_V'), fx.indexOf('// ---- THE SHARDS')), /arc|bolt|lightning/i, 'no electric arcs');
  // the sprites: ONLY the four used, CC0, read straight out of the archive
  assert.deepEqual(readdirSync(new URL('../assets/freefall/fx/', import.meta.url)), ['blaze.webp']);
  assert.ok(statSync(new URL('../assets/freefall/fx/blaze.webp', import.meta.url)).size < 30000, 'the atlas is small');
  const build = read('scripts/build-freefall-assets.py');
  assert.match(build, /SPRITES = \['flame_01', 'flame_03', 'fire_01', 'smoke_01'\]/); assert.doesNotMatch(build, /extractall|\.extract\(/, 'nothing is unpacked to disk');
  assert.match(read('assets/freefall/CREDITS.md'), /Particle Pack\*\* by Kenney Vleugels \(kenney\.nl\),\s+Creative Commons Zero \(CC0 1\.0/);
  // the ribbon + the embers + the fire-lit shards + the fire shockwave
  assert.match(n, /const ribbon = new THREE\.Mesh\(new THREE\.PlaneGeometry\(1, 1, 2, 16\), ribbonMat\);/, 'the ribbon: a strip mesh behind the ball');
  assert.match(read(`${FF}night.js`), /an ember: gold or neon pink/); assert.match(fx, /LIT BY THE FIRE \(a shard only ever flies from THE BLAZE's shatter\): gold glints on the faces turned to it, a neon-pink rim/);
  assert.match(fx, /THE FIRE SHOCKWAVE: a ring running out from the shatter — white-yellow at its inner lip, orange, neon pink at its outer edge/);
  // the ball's normal UNLIT glow stays as it was (the halo's colour + size at blaze 0 = F2's own numbers)
  assert.match(n, /LC\[0\] = 1; LC\[1\] = 0\.42 - 0\.2 \* bz; LC\[2\] = 0\.36 \+ 0\.22 \* bz;/); assert.match(n, /P\[3\] = SHAPE\.R_BALL \* \(3\.6 \+ 1\.6 \* bz\);/);
  assert.match(fx, /vec3 col = mix\(uEdge \* 1\.1, core, k \* k\);/, 'unlit: the white-hot core + its warm edge');
  // the greyscale check greys the WHOLE picture (the fire too)
  assert.match(n, /grey\(on\) \{ G\.uGrey\.value = 0; el\.style\.filter = on \? 'grayscale\(1\)' : ''; \}/);
  // ZERO GARBAGE: a flame is written into the pool
  const bareN = bare(read(`${FF}night.js`));
  for (const [re, what] of [[/=>/, 'an arrow'], [/\.\.\./, 'a spread'], [/[=(,:?]\s*\{/, 'a record'], [/`/, 'a template string']]) assert.doesNotMatch(body(bareN, '  function flame(x, y, z, vx, vy, vz, life, size) {'), re, `flame() builds ${what}`);
});
