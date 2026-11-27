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
import { SOUNDS, SOUND_IDS, SOUND_FILES, VOICES, BOUNCE_VARY_DB, MUSIC, SCALE_STEPS, scaleRate, cuesOf, admitSlot, CUE_NEW_BEST, CUE_FIREWORKS, BREAK_AT, BREAK_HIT_S, BOTTOM_HIT_S } from '../js/games/freefall/sounds.js';
import { createRun, stepTo, turn, isOver } from '../js/games/freefall/engine.js';
import { makeBot, planFlight } from '../js/games/freefall/bot.js';
import { MODES, AREAS, DARK } from '../js/games/freefall/tuning.js';
import { PALETTES, TRENCH_PALETTES, GOLD_AREAS } from '../js/games/freefall/palettes.js';
import { nextArrival, isArrival, arrivalWords } from '../js/games/freefall/logic.js';

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
  // UNLISTED: no page, no script, no manifest names it
  for (const f of ['index.html', 'board.html', 'admin.html', 'lab.html', 'daychart.html', 'jaywalk-lab.html', 'highrise-play.html', 'freefall-lab.html', '404.html', 'manifest.webmanifest', 'sw.js', 'vercel.json']) assert.doesNotMatch(read(f), /freefall-play/i, `${f} never names it`);
  // (F4A — THE HIDDEN CARTRIDGE: FREEFALL is registered as a `preview` row — the owner's live test only, never playable; the console's own
  //  code + the page's shell still do not know it)
  for (const f of ['js/app.js', 'js/games/cartridge.js', 'js/games/contract.js', 'js/games/preload.js', 'js/core/game-order.js', 'index.html']) assert.doesNotMatch(read(f), /freefall/i, `${f} does not know FREEFALL`);
  assert.match(read('js/config.js'), /\{ id: 'freefall', name: 'FREEFALL', theme: 'freefall', [^\n]*playable: false, preview: true \}/, 'HIDDEN: playable false + preview');
  // (F4A — THE HIDDEN CARTRIDGE: meta.js · index.js · view.js · director.js are there now — and the PAGE loads none of them: its graph below)
  for (const n of ['meta.js', 'index.js', 'view.js', 'director.js']) assert.ok(existsSync(new URL(`../${FF}${n}`, import.meta.url)), `${n}: the cartridge's own file`);
  assert.doesNotMatch(read(`${FF}play.js`) + read(`${FF}stage.js`), /from '\.\/(view|index|director|final|proof|lines|meta)\.js'|from '[^']*(firebase|profile\/|errlog|store)[^']*'/, 'the page + the stage import nothing of the cartridge\'s writes');
  for (const f of readdirSync(new URL('../api/', import.meta.url)).filter(n => n.endsWith('.js') && n !== 'report.js')) assert.doesNotMatch(read(`api/${f}`), /freefall/i, `api/${f}: no endpoint wiring (F4A: the REPORT alone reads it — the cartridge's run, behind THE SWITCH)`);
});

test('NOTHING COUNTS UNTIL GO-LIVE — the page\'s WHOLE module graph (static + lazy): its own files, the kit\'s tiers, the shared sheet + audio engine, three.js; nothing from /api, the profile, progression, the report, share, the cards, Firebase, the store; THE DOOR is shut before the stage mounts', () => {
  const g = graph(`${FF}play.js`);
  const own = g.files.filter(f => f.startsWith(FF)).map(f => f.slice(FF.length));
  // (F4B — THE MATCH on the page: the ghosts + the match's HUD are the stage's own; THE BOT ROOM — matchsim.js + the sims' bots + the proof's
  //  pure chunk maths — is LAZY: loaded only with `?mode=match&rivals=N`; nothing of it writes or counts)
  assert.deepEqual(own, ['audition.js', 'bakedtext.js', 'banner.js', 'best.js', 'bot.js', 'break-fx.js', 'breaks.js', 'day-fx.js', 'endscreen.js', 'engine.js', 'ghost-fx.js', 'ghosts.js', 'logic.js', 'matchhud.js', 'matchsim.js', 'night-fx.js', 'night.js', 'palettes.js', 'play.js', 'proof.js', 'replay.js', 'sfx.js', 'shot.js', 'sounds.js', 'stage.js', 'tower-gen.js', 'tuning.js'], 'the game\'s own modules (never the lab or the graybox; the bots only in the lazy bot room)');
  assert.match(read(`${FF}stage.js`), /lazyImport\(import\('\.\/matchsim\.js'\), '\.\/matchsim\.js'\)/, 'the bot room is lazy'); assert.doesNotMatch(read(`${FF}stage.js`), /^import .*matchsim/m);
  assert.deepEqual(g.files.filter(f => !f.startsWith(FF)), ['js/audio/engine.js', 'js/audio/leave-text.js', 'js/audio/settings.js', 'js/audio/sfx-kit.js', 'js/audio/sound-state.js', 'js/core/bot-ua.js', 'js/core/harbor-weather.js', 'js/core/party.js', 'js/core/proof.js', 'js/core/quiet-kinds.js', 'js/core/rng.js', 'js/core/sky.js', 'js/core/weather.js', 'js/errlog.js', 'js/games/kit/look.js', 'js/games/kit/tiers.js', 'js/ui/dom.js', 'js/ui/layers.js', 'js/ui/lazy-import.js', 'js/ui/sheet.js'], 'the shared modules: the audio engine + its helpers, the kit\'s tiers + its LOOK (F3 — AUTO asks the site\'s own sun rule: core/sky.js + what it reads), THE SHEET, the lazy loader, the integer hash');
  // (HIGH RISE's page carries the same five: they are PURE — the sun's place is worked out on the phone, nothing is asked of a server)
  for (const f of ['js/core/sky.js', 'js/core/weather.js', 'js/core/harbor-weather.js', 'js/core/party.js', 'js/games/kit/look.js']) assert.doesNotMatch(code(f), /(^|[^.\w])fetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|firebase/i, `${f}: pure — it asks nothing of any server`);
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
  assert.match(s, /if \(t0 == null && !\(match && !o\.rivals\)\) \{ if \(performance\.now\(\) - restartAt < RESTART_GUARD_MS\) return; begin\(stamp\(e\.timeStamp\)\); \}/, 'THE REVIEW: the tail of a double tap on PLAY AGAIN is not a start (F4B: a MATCH starts on its count — never on a drag)');
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
  assert.match(s, /if \(held && !countAt\) startCount\(\);/, 'back: 3 · 2 · 1');
  assert.match(s, /countAt = performance\.now\(\) \+ 3 \* COUNT_MS; countShown = 0; stamped = false; countTries\+\+;\n    if \(!o\.resume\) return;/, 'F4A: the page\'s count is the same 3 × COUNT_MS — only the cartridge stamps the way back');
  assert.match(s, /held = false; t0 = \(stamped \? countAt : now\) - heldT \* TICK_MS; countAt = 0;/, '… then on from the hold\'s tick: the time away never was run time');
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

test('THE SOUNDS\' TABLE (sounds.js — PURE): twelve sounds (F3B: + the breakthroughs\' three), every file ships (ten of FREEFALL\'s + JAYWALK\'s two), THE NOTE up a major-pentatonic scale holding after 8; the triggers on REAL runs', () => {
  assert.deepEqual(SOUND_IDS, ['bounce', 'whoosh', 'blaze', 'shatter', 'crash', 'lights-out', 'bottom', 'area-arrive', 'new-best', 'skylight', 'splashdown', 'fireworks']);
  for (const [dir, file] of SOUND_FILES) { const u = new URL(`../audio/${dir}/${file}.mp3`, import.meta.url); assert.ok(existsSync(u), `audio/${dir}/${file}.mp3 ships`); assert.ok(statSync(u).size > 2000); }
  assert.deepEqual(SOUNDS.filter(s => s.dir === 'jaywalk').map(s => s.id), ['area-arrive', 'new-best'], 'area arrival + NEW BEST are JAYWALK\'s files (reused, no copy)');
  assert.deepEqual(readdirSync(new URL('../audio/freefall/', import.meta.url)).sort(), ['CREDITS.md', 'blaze.mp3', 'bottom.mp3', 'bounce.mp3', 'crash.mp3', 'fireworks.mp3', 'lights-out.mp3', 'shatter.mp3', 'skylight.mp3', 'splashdown.mp3', 'whoosh.mp3'], 'the seven picks (take A) + the breakthroughs\' three + their credits: no B take, no -backup ships');
  const credits = read('audio/freefall/CREDITS.md');
  for (const id of ['bounce', 'whoosh', 'blaze', 'shatter', 'crash', 'lights-out', 'bottom', 'skylight', 'splashdown', 'fireworks']) assert.match(credits, new RegExp(`\\| \`${id}\\.mp3\` \\| ".+CC0 1\\.0`), `${id}: its source is credited (CC0)`);
  assert.equal((credits.match(/CC BY/g) || []).length, 1, 'no CC BY source (the one mention says so)');
  for (const s of SOUNDS) assert.ok(s.gain > 0 && s.gain <= (s.id === 'skylight' || s.id === 'splashdown' ? 2.2 : 1.5) && s.pri >= 1 && s.pri <= 4 && Object.isFrozen(s));
  // F3B — the two that come in ≈ 7 dB quiet (−23.4 / −23.7 LUFS against ≈ −16) are LOUDNESS-MATCHED BY THEIR GAIN (no MP3 encoder on the build machine)
  const gainOf = id => SOUNDS.find(s => s.id === id).gain, dB = x => 20 * Math.log10(x);
  assert.ok(Math.abs(dB(gainOf('skylight') / gainOf('shatter')) - 7.4) < 0.4 && Math.abs(dB(gainOf('splashdown') / gainOf('shatter')) - 7.7) < 0.4, `skylight + ${dB(gainOf('skylight') / gainOf('shatter')).toFixed(1)} dB · splashdown + ${dB(gainOf('splashdown') / gainOf('shatter')).toFixed(1)} dB over a shatter`);
  assert.ok(gainOf('fireworks') <= 0.6, 'the firework: soft');
  assert.equal(SOUNDS.find(s => s.id === 'bottom').play, true, 'F3B: THE BOTTOM sounds in a solo run too (the ball hits the seabed)');
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
  assert.deepEqual(ids([{ e: 'blaze', floor: 7 }]), ['blaze']); assert.deepEqual(ids([{ e: 'area', id: 'speakeasy', floor: 80 }]), ['area-arrive']); assert.deepEqual(ids([{ e: 'area', id: 'deep', floor: 160 }, { e: 'area', id: 'trench', floor: 201 }]), ['area-arrive', 'area-arrive']);
  // F3B — THE BREAKTHROUGHS: their own sound takes the arrival's place, each timed to the moment the ball gets there (the glass + the water 8 ticks on, the seabed a whole fall on)
  const timed = evs => cuesOf(evs).map(c => `${c.id}+${(c.delay || 0).toFixed(3)}`);
  assert.deepEqual(timed([{ e: 'area', id: 'offices', floor: 40 }]), ['skylight+0.133']); assert.deepEqual(timed([{ e: 'area', id: 'harbor', floor: 120 }]), ['splashdown+0.133']); assert.deepEqual(timed([{ e: 'area', id: 'bottom', floor: 200 }]), ['bottom+0.300']);
  assert.deepEqual([BREAK_AT.skylight, BREAK_AT.splash, BREAK_AT.seabed, BREAK_HIT_S, BOTTOM_HIT_S], [40, 120, 200, 8 / 60, 18 / 60]);
  assert.deepEqual(timed([{ e: 'fall', floor: 200, clean: 0 }, { e: 'area', id: 'bottom', floor: 200 }, { e: 'made' }]), ['whoosh+0.000', 'bottom+0.300'], 'a FINISH: ONE seabed sound (the arrival\'s — the `made` right after it adds none)');
  assert.deepEqual(cuesOf([{ e: 'area', id: 'bottom', floor: 200 }, { e: 'made' }], true).map(c => `${c.id}+${c.delay || 0}`), ['bottom+0'], '… a late batch: only the end\'s own');
  assert.deepEqual([CUE_FIREWORKS.id, +CUE_FIREWORKS.delay.toFixed(2)], ['fireworks', 1.2], 'the firework (a finish by night — the stage plays it): right after the seabed\'s hit');
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
    assert.equal(cues.filter(c => c.id === 'area-arrive').length, ev.filter(e => e.e === 'area' && ![40, 120, 200].includes(e.floor)).length);
    assert.equal(cues.filter(c => c.id === 'skylight').length, ev.filter(e => e.e === 'area' && e.floor === 40).length, 'the skylight breaks once a run that gets there');
    assert.equal(cues.filter(c => c.id === 'splashdown').length, ev.filter(e => e.e === 'area' && e.floor === 120).length);
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
  assert.match(s, /comp\.connect\(trim\); trim\.connect\(lp\); lp\.connect\(getSfxBus\(\) \|\| ctx\.destination\);/, 'the limiter → its trim → THE MUFFLE\'s low-pass (F3B — wide open but for the splashdown) → the console\'s SFX bus'); assert.match(s, /src\.start\(t \+ delay, leadIn\(buf\)\);/);
  assert.match(s, /export const MUFFLE = Object\.freeze\(\{ open: 20000, shut: 420, close: 0\.07 \}\);/); assert.match(s, /if \(!ctx \|\| !isUnlocked\(\)\) return false;\n    if \(!lp \|\| busCtx !== ctx\) out\(ctx\);/, 'the muffle asks isUnlocked() too');
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
  assert.match(n, /if \(bloom && tier === 2\) bloom\.render\(scene, cam, TWINS, \(day \? 0\.4 : 1\) \* shotBloom\);/, 'the bloom: tier 2 only — every mesh has its twin material in that pass (F5A: × the share card\'s staged frame\'s share — 1 in play)');
  assert.match(n, /dpr = Math\.min\(devDpr, dprMax, tier === 2 \? 3 : tier === 1 \? 2 : 1\.5\);/, 'the tiers: full 3× · 2× no bloom · 1.5×');
  assert.match(n, /wallRT\.setSize\(Math\.max\(2, bw >> 1\), Math\.max\(2, bh >> 1\)\);/, 'the shaft\'s wall is drawn at HALF resolution, then copied up');
  assert.match(n, /createImageBitmap\(bl\)/); assert.match(n, /try \{ renderer\.initTexture\(tex\); \}/, 'a picture is decoded off the frame + uploaded at once (LAG RULES 1)');
  assert.match(n, /renderer\.compile\(scene, cam\); renderer\.compile\(wallScene, wallCam\);/, 'THE WARM FRAME builds every program');
  assert.match(n, /renderer\.sortObjects = false;/); assert.match(n, /scene\.matrixAutoUpdate = false; scene\.matrixWorldAutoUpdate = false;/);
  assert.match(n, /assets\/freefall\/walls\/\$\{name\}-\$\{lk\}\.webp/); assert.match(n, /assets\/freefall\/sky\/rooftop-\$\{lk\}\.webp/, 'THE ROOFTOP: FREEFALL\'s own panorama (the add-on, Nov 26)'); assert.doesNotMatch(n, /assets\/jaywalk/, 'JAYWALK\'s skyline is no longer used');
  for (const w of ['offices', 'speakeasy', 'harbor', 'deep']) { const u = new URL(`../assets/freefall/walls/${w}-night.webp`, import.meta.url); assert.ok(existsSync(u) && statSync(u).size < 120000, `${w}: its night wall ships, small`); }
  // RED: hsl(352) — and readable with the colour removed: it stands proud, dark chevrons, a pulse
  assert.match(fx, /const vec3 RED = vec3\(1\.0, 0\.03, 0\.09\), RED_DARK/); assert.match(fx, /float cx = rad \* 2\.6 - abs\(ang\) \* 0\.9 \+ 0\.15, cw = fwidth\(cx\) \* 1\.2 \+ 1e-4, cf = abs\(fract\(cx\) - 0\.75\) - 0\.24;/, 'the chevrons, their edges smoothed by their own width on the screen (THE REVIEW: never a stair-step)'); assert.match(fx, /vec3 rimC = red > 0\.5 \? vec3\(1\.0, 0\.2, 0\.24\) \* 1\.7 : mix\(rimHue, vec3\(1\.0\), 0\.22\) \* 1\.75;/, 'THE REVIEW: a red slice\'s rim is hot red — never the safe slices\' white line'); assert.match(fx, /float pulse = 0\.86 \+ 0\.14 \* sin\(uTime \* 3\.1/);
  assert.match(n, /I\[q \+ 2\] = kind \? SHAPE\.RISE : 0;/, 'a red slice stands proud of the floor');
  // THE DARKNESS: the wall only (above its line) + the screen's edges — never the slices, never the ball
  assert.match(fx, /float lit = smoothstep\(uDarkY \+ 0\.9, uDarkY - 0\.25, hitY\);/); assert.doesNotMatch(fx.slice(fx.indexOf('export const SLICE_F'), fx.indexOf('export const PILLAR_V')), /uDarkY/, 'the slices never read the darkness');
  assert.doesNotMatch(fx.slice(fx.indexOf('export const BALL_F'), fx.indexOf('export const LIGHT_V')), /uDarkY/);
  assert.match(read('css/freefall-play.css'), /\.ff-dark::after \{[^}]*radial-gradient\(ellipse 66% 46% at 50% 45%, rgba\(var\(--ff-dk\), 0\) 44%/, 'the edges close in round a clear window where the ball is');
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
    'stage.js': ['  function frame(now) {', '  function settle(T) {', '  function ghostsFrame(now, tauW, R0, tauD, lead) {'],   // (F4B: + the match's own frame)
    'ghosts.js': ['export function stepGhost(G, tau, now) {', 'export function liftOf(run, tau) {', 'export function copyState(to, from) {'],
    'ghost-fx.js': ['  function place(n, data, w, h, dpr, ballX, ballY) {'],
    'night.js': ['  function draw(run, tau, dt, extra = 0) {', '  function putFloor(i, n, alpha, out, tick) {', '  function floorRec(i) {', '  function colourOf(i, slot) {', '  function ballLift(run, tau) {', '  function place(c, pitchDeg, back, ballY, camY, kick) {', '  function walls(floor) {', '  const wantWall = k => {'],
    'night-fx.js': ['    render(scene, cam, twins, k = 1) {'],
    'sounds.js': ['export function cuesOf(events, late = false, out = [], from = 0) {'],
  };
  for (const [file, heads] of Object.entries(frameFns)) {
    const src = bare(read(`${FF}${file}`));
    for (const h of heads) for (const [re, what] of BUILDS) assert.doesNotMatch(body(src, h), re, `${file} ${h.trim()} builds ${what}`);
  }
  const s = bare(read(`${FF}stage.js`));
  assert.doesNotMatch(body(s, '  function frame(now) {'), /getBoundingClientRect|clientHeight|clientWidth|offsetTop|offsetHeight|\.style\./, 'the frame reads no layout and writes no style (the HUD\'s two change functions do)');
  assert.match(s, /if \(R0\.floor !== hudFloor\) hudFloorNow\(R0\);/); assert.match(s, /if \(gap !== hudGap\) hudDarkNow\(gap, overD\);/);   // (F4B: R0 = the run on screen — this phone's own, or the one WATCHED)
  const n = bare(read(`${FF}night.js`));
  assert.match(n, /const S = new Float64Array\(24\);/, 'the frame\'s fractions live in ONE typed scratch array');
  assert.match(n, /const ro = new ResizeObserver\(measure\);/, 'the sizes come from a ResizeObserver — never a layout read in a frame');
  assert.doesNotMatch(body(n, '  function draw(run, tau, dt, extra = 0) {'), /clientWidth|clientHeight|getBoundingClientRect/);
  // THE BAKED NUMBER: a floor copies bitmaps — no text-shadow is re-rasterised in play; the gold set is warmed behind the opening
  assert.match(code(`${FF}bakedtext.js`), /for \(let i = 0; i < count; i\+\+\) \{ const d = s\.charCodeAt\(i\) - 48; c\.drawImage\(glyphs\[d\], Math\.round\(x \* dpr\), 0\); x \+= gw\[d\] \+ gap; \}/);
  assert.match(code(`${FF}stage.js`), /stage\.classList\.add\('is-gold'\); BN\.warm\(\); stage\.classList\.remove\('is-gold'\); BN\.dirty\(\);/);
  assert.match(read('css/freefall-play.css'), /\.ff-num\.is-baked \.ff-dg \{ color: transparent; text-shadow: none; \}/);
});

test('THE ADD-ONS (the owner, Nov 26) — THE LIGHTS GO OUT = JAYWALK-STYLE PRESSURE seen + heard · FREEFALL\'s OWN ROOFTOP PANORAMAS at full resolution · THE NIGHT WALLS v2, a scale a wall, the glow from below eased', () => {
  const n = code(`${FF}night.js`), fx = read(`${FF}night-fx.js`), st = code(`${FF}stage.js`), sf = code(`${FF}sfx.js`), css = read('css/freefall-play.css').replace(/\/\*[\s\S]*?\*\//g, '');
  // THE PRESSURE: the rule's numbers (the rules tests prove what they do); the stage's data-dark = the floors the darkness is above the ball
  assert.deepEqual(DARK, { grace: 180, pace: 120, lead: 3, paceDeep: 160, easeFrom: 100, easeTo: 160 }, 'a stopped ball has 6 s (F3B: easing to 8 s from floor 160); the darkness is never more than 3 floors above');
  assert.match(st, /stage\.dataset\.dark = on \? String\(Math\.max\(1, Math\.min\(3, gap\)\)\) : '';/);
  assert.match(css, /\.ff-stage\[data-dark='3'\] \.ff-dark::before \{ transform: translate3d\(0, -80%, 0\); \}/, '3 floors off: a faint edge at the very top — a calm run sees no more');
  assert.match(css, /\.ff-stage\[data-dark='2'\] \.ff-dark::before \{ transform: translate3d\(0, -36%, 0\); \}/); assert.match(css, /\.ff-stage\[data-dark='1'\] \.ff-dark::before \{ transform: translate3d\(0, 0, 0\); \}/, 'it creeps down IN STEP: one transform a step');
  assert.match(css, /\.ff-dark::before \{[^}]*height: 24%;/, 'the edge ends above the ball\'s bounce: never over the ball or its floor');
  assert.doesNotMatch(body(bare(read(`${FF}stage.js`)), '  function frame(now) {'), /dataset|rumble/, 'the frame writes neither (the gap\'s change function does)');
  // THE RUMBLE: the lights-out sound an octave down through a low-pass, looped softly, its own voice; the full sound only when it catches
  assert.match(sf, /export const RUMBLE = Object\.freeze\(\{ id: 'lights-out', rate: 0\.5, lowpass: 240, max: 0\.36, ease: 0\.3 \}\);/);
  assert.match(sf, /if \(!lv \|\| !ctx \|\| !isUnlocked\(\)\) return false;/, 'an effect asks isUnlocked()'); assert.match(sf, /src\.loop = true;/);
  assert.match(st, /if \(snd && snd\.rumble\) snd\.rumble\(!on \|\| held \|\| watchUid \|\| spect \? 0 : gap <= 1 \? 1 : gap === 2 \? 0\.5 : 0\);/, 'it swells as the darkness closes; silent 3 floors off, held, or over (F4B: never for a WATCHED player\'s run)');
  // THE PANORAMAS: FREEFALL's own files, kept 3072 wide; a FULL-RESOLUTION layer of its own (never the half-res wall pass), mipmaps + anisotropy
  for (const lk of ['night', 'day']) { const u = new URL(`../assets/freefall/sky/rooftop-${lk}.webp`, import.meta.url); assert.ok(existsSync(u) && statSync(u).size < 420000, `rooftop-${lk}.webp ships`); }
  assert.deepEqual(readdirSync(new URL('../assets/freefall/sky/', import.meta.url)).sort(), ['rooftop-day.webp', 'rooftop-night.webp']);
  assert.match(n, /const skyQuad = new THREE\.Mesh\(new THREE\.PlaneGeometry\(2, 2\), skyMat\);/); assert.match(n, /skyQuad\.frustumCulled = false; skyQuad\.renderOrder = -99; scene\.add\(skyQuad\);/, 'in the MAIN scene (full resolution) — right over the half-res wall');
  assert.doesNotMatch(fx.slice(fx.indexOf('export const WALL_F'), fx.indexOf('export const SKY_V')), /tPano|tSky/, 'the half-res wall pass draws no sky picture any more');
  assert.match(n, /if \(repeat === 2\) \{ try \{ tex\.anisotropy = Math\.min\(8, renderer\.capabilities\.getMaxAnisotropy\(\)\); \}/, 'mipmaps + anisotropy');
  assert.match(n, /skyQuad\.visible = wallU\.uSkyA\.value > 0\.5;/, 'drawn only while the rooftop is on screen');
  assert.match(n, /transparent: false, blending: THREE\.CustomBlending,/, 'an opaque-pass mesh (three.js draws transparent meshes after the pillar + the ball)');
  assert.match(n, /export const PANO = Object\.freeze\(\{ az: 1\.2, el: 0\.4, top: 0\.012, rise: 0\.06, riseK: 0\.004, glow: 0\.4 \}\);/);
  // (no stretching past ~1.3 ×: the panorama's texels a radian against a 390 / 430-wide phone's pixels a radian at 3×)
  const texPerRad = 3072 / 1.2, pxPerRad = w => w * 3 / (2 * Math.atan(Math.tan(23 * Math.PI / 180) * w / (w === 390 ? 844 : 932)));
  assert.ok(pxPerRad(390) / texPerRad < 1.3 && pxPerRad(430) / texPerRad < 1.35, `a texel is ${(pxPerRad(390) / texPerRad).toFixed(2)} screen pixels at 390 @3, ${(pxPerRad(430) / texPerRad).toFixed(2)} at 430 @3`);
  assert.match(fx, /p\.b = mix\(p\.b, max\(p\.b, p\.r \* 0\.85\), step\(p\.g, p\.r \* 0\.5\)\);/, 'the red guard stays: a red light of the painting leans to pink');
  const build = read('scripts/build-freefall-assets.py');
  assert.match(build, /SMEAR = \(930, 360, 1270, 575\)/, 'the day file\'s smear patch is softened in the script, in that patch only'); assert.match(build, /'only the patch is touched'/);
  // THE NIGHT WALLS v2: the three relit walls under the SAME names; a scale a wall (THE DEEP's night wall larger); the glow from below eased
  assert.match(build, /WALL_SRC = \{\('offices', 'night'\): 'ff-offices-night-v2\.png', \('harbor', 'night'\): 'ff-harbor-night-v2\.png', \('deep', 'night'\): 'ff-deep-night-v2\.png'\}/);
  assert.match(n, /const DEEP_N = \[1\.25, 1\.25, 1\.4, 0, 0, 0, 0, 0, 0, 0, 0, 2\]/, 'THE DEEP by night repeats twice round the shaft (the others four times): a larger scale');
  assert.match(fx, /vec3 A = uSkyA > 0\.5 \? sky\(d\) : wallTex\(tA, uHaveA, uFlipA, uTintA, uv \* uTileA\);/);
  assert.match(fx, /col = mix\(col, glow, fog \* uGlow\);/, 'the pink / violet glow from below: eased (0.4 — it was 0.85)');
});

test('THE ARRIVAL BANNERS (F3): an arrival = an area\'s first floor, a trench lap\'s first floor (pure — logic.js); the band\'s words BAKED ahead of the arrival, one one-shot of opacity + transform, 1.6 s; night a dark band between pink rules, day a frosted pale band with navy words; F2\'s small area name is gone', () => {
  assert.deepEqual([0, 1, 39, 40, 79, 80, 119, 159, 160, 199, 200, 201, 240, 241, 280, 281, 600].map(nextArrival), [40, 40, 40, 80, 80, 120, 120, 160, 200, 200, 201, 241, 241, 281, 281, 321, 601]);
  const arrivals = []; for (let i = 0; i <= 330; i++) if (isArrival(i)) arrivals.push(i);
  assert.deepEqual(arrivals, [40, 80, 120, 160, 200, 201, 241, 281, 321], '40 · 80 · 120 · 160 · 200 (+ THE TRENCH at 201), then a lap every 40 floors');
  for (const bad of [0, -1, 1.5, NaN, '40', null]) assert.equal(isArrival(bad), false);
  assert.deepEqual([40, 80, 120, 160, 200, 201, 241, 281].map(f => { const w = arrivalWords(f); return `${w.name} / ${w.sub}`; }), ['THE OFFICES / FLOOR 40', 'THE SPEAKEASY / FLOOR 80', 'UNDER THE HARBOR / FLOOR 120', 'THE DEEP / FLOOR 160', 'THE BOTTOM / FLOOR 200', 'THE TRENCH / FLOOR 201', 'THE TRENCH / LAP 2 · FLOOR 241', 'THE TRENCH / LAP 3 · FLOOR 281']);
  const b = code(`${FF}banner.js`), st = code(`${FF}stage.js`), css = read('css/freefall-play.css').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.match(b, /export const BANNER_MS = 1600;/, '~1.6 s in + out');
  assert.match(b, /export const BANNER_KEYS = Object\.freeze\(\[\{ opacity: BANNER_REST, transform: 'translate3d\(-5%, 0, 0\)' \}/); assert.match(b, /export const BANNER_REST = 0\.001;/, 'at rest a band is all but clear — never 0: its layer stays painted'); assert.doesNotMatch(b.slice(b.indexOf('export const BANNER_KEYS'), b.indexOf('const fontOf')).replace(/opacity|transform|offset/g, ''), /[a-zA-Z]+: /, 'opacity + transform only');
  assert.match(b, /import \{ parseShadows \} from '\.\/bakedtext\.js';/, 'BAKED text — the big number\'s way');
  // made ready AHEAD of the arrival — F3B (THE STUTTERS): EVERY band a run meets (the areas' six + the trench's first lap) behind the opening, each
  // in a canvas of its own, KEPT (the next run bakes nothing); an arrival only swaps the canvas shown
  assert.match(st, /for \(let k = 0; k < 7; k\+\+\) \{ f = nextArrival\(f\); const w = arrivalWords\(f\); BNR\.prepare\(bandName\(f, w\), w\.sub, bandCls\(f\)\); if \(f > LAP0\) break; \}/);
  assert.match(b, /const bands = new Map\(\);/); assert.match(b, /if \(bands\.has\(keyOf\(name, sub\)\) \|\| performance\.now\(\) < until\) return;/, 'a kept band is never built twice — and never while a band is up');
  // AN ARRIVAL TOUCHES NO DOM: a band that was made ready is shown by ONE one-shot on its own node — no text, no class, no child changed
  const showFn = body(bare(read(`${FF}banner.js`)), '    show(name, sub, onDone, cls) {');
  assert.match(showFn, /anim = b\.node\.animate \? b\.node\.animate\(gold \? \(reduce \? BANNER_GOLD_KEYS_STILL : BANNER_GOLD_KEYS\) : reduce \? BANNER_KEYS_STILL : BANNER_KEYS/);   // (F4A: THE BOTTOM's gold band snaps in + stays — its own keys)
  assert.doesNotMatch(showFn.replace(/if \(!b\) \{[^}]*\}/, '').replace(/sayTimer = setTimeout\([^;]*;[^;]*;/, ''), /textContent|classList|replaceChildren|append|innerHTML|\.style\./, 'show() itself writes nothing to the page (a reader is told a moment later)');
  assert.match(read('css/freefall-play.css'), /\.ff-banner \{[^}]*opacity: 0\.001; will-change: transform, opacity;/);
  // F3B: THE BOTTOM's band is the GOLD one — "YOU HIT THE BOTTOM" — and comes with the impact (a whole fall after the arrival's event)
  assert.match(st, /export const BOTTOM_WORDS = 'YOU HIT THE BOTTOM';/); assert.match(st, /const bandName = \(floor, w\) => \(floor === BREAK_AT\.seabed \? BOTTOM_WORDS : w\.name\), bandCls = floor => \(floor === BREAK_AT\.seabed \? 'is-gold' : ''\);/);
  // (the fresh-eyes review: the wait is THE FRAME's — never a wall timer that could cross behind THE TRENCH's band; a ball already past it: THE BOTTOM's band first)
  assert.match(st, /if \(floor === BREAK_AT\.seabed\) \{ bedDue = performance\.now\(\) \+ BOTTOM_HIT_S \* 1000; return; \}\n    if \(bedDue\) \{ bedDue = 0; band\(BREAK_AT\.seabed\); \}/);
  assert.match(st, /if \(bedDue && now >= bedDue && !held\) \{ bedDue = 0; band\(BREAK_AT\.seabed\); \}/); assert.doesNotMatch(st, /bedTimer/);
  // (… and a call that is UP when a band comes is taken down — said again after it, if its moment is not long gone)
  assert.match(st, /if \(at < callUntil\) \{\n      if \(callPri >= pendPri\) \{ pendText = callText; pendCls = callCls; pendPri = callPri; pendMs = callMs; pendAt = callAt; \}\n      callUntil = 0; callPri = 0; if \(callAnim\) \{ callAnim\.cancel\(\); callAnim = null; \}/);
  assert.match(css, /\.ff-stage\[data-look\] \.ff-banner\.is-gold \{ border-block-color: var\(--ff-gold\);/, 'gold rules, in both looks');
  // F3B: the announcer never talks over a band (the band lies in its lane now): a call waits for it to leave
  assert.match(st, /if \(BNR\.showing\(\)\) \{ if \(pri >= pendPri\) \{ pendText = text; pendCls = cls; pendPri = pri; pendMs = ms; pendAt = now; \} return; \}/);
  assert.match(st, /bnrQueued = -1; clearTimeout\(bnrTimer\); BNR\.clear\(\); prepBanner\(0\);/);
  assert.match(st, /bnrTimer = setTimeout\(\(\) => \{ if \(!gone && !BNR\.showing\(\)\) prepBanner\(run\.floor\); \}, \(bandCls\(floor\) \? BANNER_GOLD_MS : BANNER_MS\) \+ 250\);/, 'the next band is baked after this one has left — never over it');
  assert.match(st, /else if \(e\.e === 'area'\) arrive\(e\.floor\);\s+else if \(e\.e === 'fall' && e\.floor > LAP0 && isArrival\(e\.floor\)\) arrive\(e\.floor\);/);
  assert.match(st, /if \(BNR\.showing\(\)\) \{ bnrQueued = floor; return; \}/, 'an arrival while a band is up crosses after it');
  assert.doesNotMatch(body(bare(read(`${FF}stage.js`)), '  function frame(now) {'), /BNR\.|prepBanner|arrive\(/, 'the frame itself never touches the band (a landing\'s moment shows it)');
  // the looks
  assert.match(css, /\.ff-banner \{[^}]*top: var\(--ff-band-top\);[^}]*border-block: 1\.5px solid var\(--ff-pink\);/, 'night: a dark band between two thin pink rules — F3B (the owner): UNDER THE BIG NUMBER, never over a floor below the ball');
  assert.match(css, /\.ff-stage \{ --ff-band-top: calc\(env\(safe-area-inset-top, 0px\) \+ 50px \+ clamp\(64px, calc\(var\(--ff-w\) \* 0\.2\), 84px\) \* 0\.95 \+ 5px\); \}/, 'its top = the number\'s foot');
  assert.doesNotMatch(css, /\.ff-banner \{[^}]*bottom:/, 'no longer at the foot of the screen');
  assert.match(css, /\.ff-stage\[data-look='day'\] \.ff-banner \{ background: linear-gradient\(to right, rgba\(236, 247, 255, 0\.62\)/, 'day: a frosted pale band');
  assert.match(css, /\.ff-stage\[data-look='day'\] \.ff-banner-n \{ color: #0b2a4a; text-shadow: none; \}/, '… with navy words');
  assert.doesNotMatch(css.replace(/@supports[^{]*\{ \.ff-hold \{[^}]*\} \}/, ''), /backdrop-filter/, 'no backdrop blur in play (a frame cost): the frost is the band\'s own colour — the ONE blur is PAUSED\'s cover (F3B)');
  // F3B — PAUSED: a dark, BLURRED cover over the tower while the run is held (the count + PAUSES LEFT stay sharp on it)
  assert.match(css, /@supports \(\(-webkit-backdrop-filter: blur\(1px\)\) or \(backdrop-filter: blur\(1px\)\)\) \{ \.ff-hold \{ background: rgba\(5, 3, 13, 0\.8\); -webkit-backdrop-filter: blur\(18px\); backdrop-filter: blur\(18px\); \} \}/);
  assert.match(css, /\.ff-hold \{[^}]*background: rgba\(5, 3, 13, 0\.95\); \}/, 'a browser without the blur: a cover dark enough by itself');
  assert.doesNotMatch(st + css, /ff-area\b/, 'F2\'s small area name under the number is gone');
});

test('THE DAY LOOK (F3 — static): ONE scene, a LOOK read LIVE (every material carries uDay; the day pieces in day-fx.js), the four day walls + JAYWALK\'s day skyline, the areas\' day numbers, THE MOTES a fixed pool the tiers trim, by day light COVERS, the caustics are the shader\'s; the stage: the kit\'s shared look — the console\'s read live, the page ?look= or AUTO', () => {
  const n = code(`${FF}night.js`), fx = read(`${FF}night-fx.js`), dfx = read(`${FF}day-fx.js`), st = code(`${FF}stage.js`), css = read('css/freefall-play.css').replace(/\/\*[\s\S]*?\*\//g, '');
  // the pictures: the APPROVED day walls ship, small; the rooftop = JAYWALK's day skyline (reused, no copy); the caustics picture is NOT shipped
  for (const w of ['offices', 'speakeasy', 'harbor', 'deep']) { const u = new URL(`../assets/freefall/walls/${w}-day.webp`, import.meta.url); assert.ok(existsSync(u) && statSync(u).size < 160000, `${w}: its day wall ships, small`); }
  assert.deepEqual(readdirSync(new URL('../assets/freefall/walls/', import.meta.url)).sort(), ['deep-day.webp', 'deep-night.webp', 'harbor-day.webp', 'harbor-night.webp', 'offices-day.webp', 'offices-night.webp', 'speakeasy-day.webp', 'speakeasy-night.webp'], 'eight walls — no caustics picture, no -v1 / -v2');
  assert.match(n, /const skyNow = \(\) => \(day \? picture\('pano-day', PANO_URL\[1\], 2\) : picture\('pano', PANO_URL\[0\], 2\)\);/, 'the day panorama is asked for only when the look is day');
  // ONE scene: the look is a uniform every material reads — never a second scene, never a rebuild
  assert.match(n, /uDay: \{ value: 0 \}, uCover: \{ value: 0 \}, uFog: \{ value: new THREE\.Vector3\(0\.62, 0\.84, 0\.98\) \}, uCaust: \{ value: 0 \}/);
  assert.match(n, /function setLook\(l\) \{\s+day = l === 'day';\s+G\.uDay\.value = day \? 1 : 0; G\.uCover\.value = day \? 1 : 0;/, 'setLook: at once');
  for (const name of ['WALL_F', 'SLICE_F', 'PILLAR_F', 'BALL_F']) { const at = fx.indexOf(`export const ${name}`), end = fx.indexOf('export const', at + 20); assert.match(fx.slice(at, end), /uDay/, `${name} has its day half`); }
  for (const name of ['LIGHT_F', 'FLAME_F', 'RIBBON_F', 'SPARK_F']) { const at = fx.indexOf(`export const ${name}`), end = fx.indexOf('export const', at + 20); assert.match(fx.slice(at, end < 0 ? undefined : end), /uCover/, `${name}: by day its light COVERS (added light is lost on a bright ground)`); }
  // RED by day = the same red, the same chevrons + pulse (readable with the colour removed); the slices + the ball never read the darkness
  assert.match(dfx, /float cx = rad \* 2\.6 - abs\(ang\) \* 0\.9 \+ 0\.15, cw = fwidth\(cx\) \* 1\.2 \+ 1e-4, cf = abs\(fract\(cx\) - 0\.75\) - 0\.24;/, 'the day slice: the same chevrons');
  assert.match(dfx, /col = mix\(RED \* 0\.92, RED_DARK \* 1\.3, chev \* 0\.84\) \* \(0\.86 \+ 0\.2 \* rad\) \* pulse;/);
  assert.doesNotMatch(dfx.slice(dfx.indexOf('export const DAY_SLICE'), dfx.indexOf('export const MOTE_V')), /uDarkY|uDarkA/, 'the day slices never read the darkness');
  // the water (the owner's ff-day.png): its four colours top to bottom, the sun rays in the WORLD, the caustics the shader's own
  const main = dfx.slice(dfx.indexOf('export const DAY_MAIN'), dfx.indexOf('export const DAY_SLICE'));
  assert.ok(main.indexOf('vec3(0.0018, 0.042, 0.107)') < main.indexOf('vec3(0.0033, 0.147, 0.275)') && main.indexOf('vec3(0.0033, 0.147, 0.275)') < main.indexOf('vec3(0.0242, 0.462, 0.584)') && main.indexOf('vec3(0.0242, 0.462, 0.584)') < main.indexOf('vec3(0.212, 0.768, 0.823)'), '#063a5c · #0b6b8f · #2bb5c9 · #7fe3ea, the foot of the screen to its top (linear light)');
  assert.match(main, /float ru = atan\(hit\.x, -hit\.z\) \* 3\.2 \+ hit\.y \* 0\.16;/, 'the sun rays stand in the world (the wall\'s own angle + height) — and drift');
  assert.match(dfx, /float caust\(vec2 p, float t\)/); assert.doesNotMatch(n + code(`${FF}day-fx.js`), /ff-caustics|caustics\.(png|webp)/, 'no caustics picture');
  // THE DARKNESS by day: the same line + timing, another look (the wall + the screen's edges; never the ball or its floor)
  assert.match(main, /float lit = smoothstep\(uDarkY \+ 0\.9, uDarkY - 0\.25, hitY\);/, 'the same line as the night\'s');
  assert.match(css, /\.ff-stage\[data-look='day'\]\[data-area='rooftop'\] \.ff-dark \{ --ff-dk: 50, 56, 74; --ff-dk-edge: 26, 30, 44; \}/, 'THE STORM CLOUD over the rooftop (F4A: its edge a DARKER rim — no pale stripe through the big number)');
  assert.match(css, /\.ff-stage\[data-look='day'\]:is\(\[data-area='harbor'\], \[data-area='deep'\], \[data-area='bottom'\], \[data-area='trench'\]\) \.ff-dark \{ --ff-dk: 5, 36, 40; --ff-dk-edge: 1, 16, 19; \}/, 'THE MURK under the water');
  assert.match(css, /\.ff-stage\[data-look='day'\] \.ff-dark \{ --ff-dk: 12, 14, 26;/, 'the same dark edge + clear window, in the day\'s colours — round the ball');
  // THE MOTES: a fixed pool, the tiers trim how many are drawn; an area's kind
  assert.match(n, /export const MOTES = 48, MOTE_N = Object\.freeze\(\[18, 32, 48\]\), MOTE_SPAN = 12;/); assert.match(n, /mGeo\.instanceCount = MOTE_N\[t\];/);
  assert.equal(AREA_DAY_KINDS(n).join(' '), '0 3 3 1 2', 'the rooftop none · dust in the two rooms · bubbles under the harbor · drifting particles in the deep');
  assert.match(dfx, /float y = uBaseY \+ mod\(aS\.y \* uSpan \+ uSpeed \* \(0\.6 \+ 0\.8 \* seed\) \* uTime - uBaseY, uSpan\);/, 'a mote stands in the WORLD (wrapped round the camera) — a pure function of the time');
  // the big number by day: pink #ff3fa8 in a soft dark outline; the ball pink
  assert.match(css, /\.ff-stage\[data-look='day'\] \.ff-num \{ color: #ff3fa8; text-shadow: var\(--ff-out\)/);
  assert.match(fx, /col = mix\(vec3\(1\.0, 0\.08, 0\.4\), vec3\(1\.0, 0\.4, 0\.7\), k \* k\);/, 'the day ball: pink (#ff50aa in linear light)');
  // the stage: the kit's shared look
  assert.match(st, /import \{ resolveLook, sunUpNow \} from '\.\.\/kit\/look\.js';/, 'the match kit\'s shared DAY / NIGHT');
  assert.match(st, /let lookT = o\.lookNow \? cleanLk\(o\.lookNow\(\)\) : LOOK_Q \|\| guessLook\(new Date\(\)\.getHours\(\)\), lookSeen = '';/, 'the console\'s look · ?look= · AUTO by the phone\'s clock');
  assert.match(st, /if \(o\.lookNow && frameN % 15 === 0\) \{ const l = cleanLk\(o\.lookNow\(\)\); if \(l !== lookT\) setLook\(l\); \}/, 'the console\'s GAME LOOK read LIVE');
  assert.match(st, /if \(!o\.lookNow && !LOOK_Q\) \{ askSun\(\); sunTimer = setInterval\(askSun, SUN_EVERY_MS\); \}/, 'AUTO: the site\'s own sun rule, asked again every minute');
  assert.match(code(`${FF}play.js`), /const LOOK = Q\.get\('look'\) === 'day' \|\| Q\.get\('look'\) === 'night' \? Q\.get\('look'\) : null;/);
  assert.doesNotMatch(st, /ff-look|LOOK_LABEL|look-b/, 'no look switch of its own on the screen');
});

/** the motes' kind of the five areas' day rows (night.js#AREA_DAY — its 11th number) */
function AREA_DAY_KINDS(src) {
  const at = src.indexOf('export const AREA_DAY = Object.freeze(['), rows = [...src.slice(at, src.indexOf(']);', at)).matchAll(/\[([\d., ]+)\]/g)].map(m => m[1].split(',').map(Number));
  const deep = src.match(/DEEP_D = \[([\d., ]+)\]/)[1].split(',').map(Number);
  return [...rows.slice(0, 4).map(r => r[10]), deep[10]];
}

test('THE OPENING = title-05 (F3 — the owner\'s pick): Grok\'s lettering + tagline as two pictures over the LIVE tower (WebP with alpha, two widths, small), 85 % of the width in the top third; F2\'s tube sign + its dropping ball are gone; THE GLINT = a CSS band masked to the lettering\'s alpha every 7 s while the opening waits — transform + opacity only, ONE sweep under reduced motion', () => {
  const st = code(`${FF}stage.js`), css = read('css/freefall-play.css').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const [name, max] of [['lettering-1170', 190000], ['lettering-780', 110000], ['tagline-1170', 40000], ['tagline-780', 26000]]) { const u = new URL(`../assets/freefall/title/${name}.webp`, import.meta.url); assert.ok(existsSync(u) && statSync(u).size < max, `${name}.webp ships, small`); }
  assert.deepEqual(readdirSync(new URL('../assets/freefall/title/', import.meta.url)).sort(), ['lettering-1170.webp', 'lettering-780.webp', 'tagline-1170.webp', 'tagline-780.webp']);
  assert.match(st, /const titleImg = h\('img\.ff-title-img', \{ alt: 'Freefall'/); assert.match(st, /srcset: `\$\{art\('lettering', 780\)\} 780w, \$\{art\('lettering', 1170\)\} 1170w`/, 'two widths: the phone picks its own');
  assert.match(st, /const tagline = h\('img\.ff-tagline', \{ alt: 'Fall as deep as you can'/);
  assert.match(st, /const open = h\('div\.ff-open', title, tagline\);/);
  assert.doesNotMatch(st + css, /ff-logo|ff-free|ff-fall\b|ff-drop|ff-tag\b/, 'F2\'s tube sign FREE / FALL + its dropping ball are REMOVED');
  assert.match(css, /\.ff-title \{ position: relative; width: calc\(var\(--ff-w\) \* 0\.85\); aspect-ratio: 2340 \/ 1137; \}/, '85 % of the width (≈ 330 pt at 390)');
  // THE GLINT: masked to the lettering's own alpha — the mask is the very file the picture picked (no second download)
  assert.match(st, /const maskNow = \(\) => \{ const u = titleImg\.currentSrc \|\| titleImg\.src;/); assert.match(st, /glint\.style\.webkitMaskImage = v; glint\.style\.maskImage = v;/);
  assert.match(css, /\.ff-stage\.is-open \.ff-title\.is-ready \.ff-glint::before \{ animation: ff-glint 7s /, 'every 7 s, only while the opening waits (is-open leaves at the first drag: it stops)');
  assert.match(css, /@keyframes ff-glint \{ 0% \{ transform: translate3d\(-150%, 0, 0\) skewX\(-22deg\); \} 11\.4%, 100% \{ transform: translate3d\(330%, 0, 0\) skewX\(-22deg\); \} \}/, 'the sweep = 0.8 s of the 7 (LEFT → RIGHT), a transform only');
  assert.match(css, /\.ff-stage\.is-open \.ff-title\.is-ready \.ff-star \{ animation: ff-star 7s /, 'the 4-point star on the last letter');
  assert.match(css, /clip-path: polygon\(50% 0%, 58% 42%, 100% 50%, 58% 58%, 50% 100%, 42% 58%, 0% 50%, 42% 42%\)/, 'a 4-point star');
  assert.match(css, /\.ff-stage\[data-look='day'\] \.ff-glint \{ --ff-glint: 255, 255, 255;/, 'by day: a clean white sun glint (the night\'s is pink-white)');
  assert.match(css, /\.ff-stage\.is-open \.ff-title\.is-ready \.ff-glint::before \{ animation: ff-glint-once 0\.8s [^;]* 1 both; \}/, 'reduced motion: ONE sweep only');
  const frames = [...css.matchAll(/@keyframes (ff-glint[\w-]*|ff-star[\w-]*|ff-title-in) \{((?:[^{}]|\{[^{}]*\})*)\}/g)];
  assert.equal(frames.length, 5, 'the glint, its star (each + its one-sweep twin), the title\'s way in');
  for (const k of frames) assert.doesNotMatch(k[2].replace(/transform|opacity/g, ''), /[a-z-]+\s*:/, `${k[1]} moves transform + opacity only`);
  assert.match(css, /\.ff-stage\[data-look='day'\] \.ff-tagline \{ filter: drop-shadow\(/, 'by day the tagline wears a deeper dark shadow (white caps on a pale sky)');
  assert.doesNotMatch(css, /184, 255, 59|ff-lime|ff-uv\b|#b8ff3b|#9b5cff/i, 'F2\'s ultraviolet + lime are gone from the stylesheet');
});

test('THE AREA PALETTES (F3 — DEPTH-RELATIVE: a floor wears its OWN area\'s colour · F3B — THE COLOUR FIXES + THE COLOUR RULE): one palette an area in tuning.js#AREAS\' order, each its own hue; RED IS THE ONLY RED — by night no colour within 25° of hue 352, BY DAY every colour ≥ 60° from it (THE SPEAKEASY\'s gold = the owner\'s own hexes, the one named exception) and red the darkest + most saturated thing on a day floor; the last three floors of an area lean to the next one\'s', () => {
  const hsl = hex => { const r = (hex >> 16 & 255) / 255, g = (hex >> 8 & 255) / 255, b = (hex & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0; if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [(h * 60 + 360) % 360, d ? d / (1 - Math.abs(mx + mn - 1)) : 0, (mx + mn) / 2]; };
  const far = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
  assert.equal(PALETTES.length, AREAS.length - 1, 'one palette an area — THE TRENCH has its own four (a lap each)');
  for (const [i, p] of [...PALETTES, ...TRENCH_PALETTES].entries()) for (const k of ['a', 'b', 'rim', 'day', 'dayRim']) {
    const [h, s] = hsl(p[k]);
    assert.ok(s < 0.12 || far(h, 352) > 25, `palette ${i}.${k} #${p[k].toString(16)} — hue ${h.toFixed(0)}: RED IS THE ONLY RED`);
  }
  // each area clearly its own colour: pink · violet → blue · BRASS GOLD (F3B — it was rose + plum: close to red) · teal + aqua · dark indigo (ultraviolet rims)
  const hue = hex => hsl(hex)[0], inR = (v, lo, hi) => v >= lo && v <= hi;
  assert.ok(inR(hue(PALETTES[0].a), 300, 327) && inR(hue(PALETTES[0].b), 290, 327), 'THE ROOFTOP: hot pink + magenta');
  assert.ok(inR(hue(PALETTES[1].a), 255, 285) && inR(hue(PALETTES[1].b), 215, 240), 'THE OFFICES: electric violet → blue');
  assert.ok(inR(hue(PALETTES[2].a), 32, 46) && inR(hue(PALETTES[2].b), 30, 46) && inR(hue(PALETTES[2].rim), 40, 56) && hsl(PALETTES[2].rim)[2] > hsl(PALETTES[2].a)[2] + 0.15, 'THE SPEAKEASY (F3B): BRASS GOLD — warm neon gold faces, brighter gold rims');
  assert.deepEqual(GOLD_AREAS, [2], 'the gold floors: YOUR BEST\'s gold tape turns white with a dark edge there');
  assert.ok(inR(hue(PALETTES[3].a), 165, 185) && inR(hue(PALETTES[3].b), 180, 195), 'UNDER THE HARBOR: teal + aqua');
  assert.ok(inR(hue(PALETTES[4].a), 235, 255) && hsl(PALETTES[4].a)[2] < 0.35 && inR(hue(PALETTES[4].rim), 265, 285) && hsl(PALETTES[4].rim)[2] > 0.6, 'THE DEEP: dark indigo, glowing ultraviolet rims');
  // BY DAY — CLEARLY COLOURED (the owner's add-on, Nov 26: never near-white ice everywhere): each area's faces a pastel of 35–55 % saturation,
  // its rim a brighter (more saturated, no lighter) version of that colour; five clearly different towers; the rooftop cool — never peach.
  // F3B (the owner): UNDER THE HARBOR = PEARL (about 15 % saturation — contrast by LIGHTNESS against the teal water) with bright cyan rims;
  // THE OFFICES a lighter, whiter periwinkle (they sat close to the blue glass wall)
  const sat = hex => { const r = (hex >> 16 & 255) / 255, g = (hex >> 8 & 255) / 255, b = (hex & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx ? (mx - mn) / mx : 0; };   // (HSV: how far from white a face is)
  for (const [i, p] of [...PALETTES, ...TRENCH_PALETTES].entries()) {
    const l = hsl(p.day)[2];
    const [lo, hi, lmax] = i === 3 ? [0.1, 0.2, 0.92] : i === 1 ? [0.2, 0.34, 0.88] : [0.35, 0.55, 0.86];
    assert.ok(sat(p.day) >= lo && sat(p.day) <= hi && l > 0.6 && l < lmax, `palette ${i}: its day face #${p.day.toString(16)} — ${(100 * sat(p.day)).toFixed(0)} % saturation (pearl ≈ 15 % · the offices whitish · the rest the owner's 35–55 %), lightness ${l.toFixed(2)}`);
    assert.ok(sat(p.dayRim) > sat(p.day) + 0.1 && hsl(p.dayRim)[2] < l, `palette ${i}: its day rim is a brighter version of the colour`);
  }
  const dayHues = PALETTES.slice(0, 5).map(p => hue(p.day));
  assert.ok(inR(dayHues[0], 280, 315), 'THE ROOFTOP by day: a soft pink-lavender — cool, never peach / orange'); assert.ok(inR(dayHues[1], 215, 240), 'THE OFFICES: periwinkle blue');
  assert.deepEqual([PALETTES[2].day, PALETTES[2].dayRim], [0xf0d590, 0xe0a83a], 'THE SPEAKEASY by day: champagne gold — the owner\'s own hexes'); assert.ok(inR(dayHues[3], 160, 185) && inR(hue(PALETTES[3].dayRim), 180, 192), 'UNDER THE HARBOR: pearl with a faint aqua tint, bright cyan rims'); assert.ok(inR(dayHues[4], 245, 265), 'THE DEEP: soft indigo / lilac');
  assert.ok(hsl(PALETTES[1].day)[2] > 0.8 && sat(PALETTES[1].dayRim) > 0.6, 'THE OFFICES by day: a lighter, whiter periwinkle with brighter rims');
  // THE COLOUR RULE BY DAY (F3B — tightened): every day colour ≥ 60° of hue from red (352); THE SPEAKEASY's gold is the owner's own hex
  // (51° / 48° away — brass can not be 60° from red and stay brass: the ONE named exception, held ≥ 45°)
  for (const [i, p] of [...PALETTES, ...TRENCH_PALETTES].entries()) for (const k of ['day', 'dayRim']) {
    const d = far(hue(p[k]), 352), need = GOLD_AREAS.includes(i) ? 45 : 60;
    assert.ok(d >= need, `palette ${i}.${k} #${p[k].toString(16)} — ${d.toFixed(1)}° from red (≥ ${need}°)`);
  }
  // … and RED IS THE DARKEST + THE MOST SATURATED THING ON A DAY FLOOR (the slice shader's RED = vec3(1.0, 0.03, 0.09) in linear light)
  const lin = v => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)), lum = hex => 0.2126 * lin((hex >> 16 & 255) / 255) + 0.7152 * lin((hex >> 8 & 255) / 255) + 0.0722 * lin((hex & 255) / 255);
  const RED_LUM = 0.2126 * 1 + 0.7152 * 0.03 + 0.0722 * 0.09, RED_SAT = 1 - 0.03;   // (linear: its lightness · how far from grey)
  for (const [i, p] of [...PALETTES, ...TRENCH_PALETTES].entries()) {
    assert.ok(lum(p.day) > RED_LUM * 1.3, `palette ${i}: its day face is clearly lighter than red (${lum(p.day).toFixed(2)} · red ${RED_LUM.toFixed(2)})`);
    assert.ok(sat(p.day) < RED_SAT - 0.35, `palette ${i}: … and far less saturated`);
    assert.ok(lum(p.dayRim) >= RED_LUM * 0.95, `palette ${i}: its day rim is no darker than red`);
  }
  for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) assert.ok(far(dayHues[i], dayHues[j]) >= 18, `five clearly different towers by day (${i} · ${j}: ${dayHues[i].toFixed(0)}° · ${dayHues[j].toFixed(0)}°)`);
  assert.match(read(`${FF}day-fx.js`), /vec3 tint = vC\.rgb, ice = tint, rimC = vR;/, 'the day face IS the area\'s pastel — white only in the frost, the highlights + the seams');
  assert.match(read(`${FF}day-fx.js`), /caust\(vW\.xz \* 3\.2 \+ vW\.y, uTime\) \* 0\.12 \* caK/, 'F3B: the caustic ripples stay ON THE WATER — only a faint shimmer on the slices (it was 0.5)');
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
  assert.ok(e.includes("const el = h('div.ff-ec', hd, cause, n, fl, bestL, avgL, line, table);"), 'top to bottom: THE LOGO · the cause · the number · FLOORS · YOUR BEST (· AVG) · the line · the table\'s slot');
  // F4B — THE HEADER = THE LOGO (the owner's approved mock): title-05's lettering — the opening's own WebP — + the mode in small teal caps; never the words FREE FALL
  assert.ok(e.includes("h('img.ff-ec-logo-img', { alt: '', decoding: 'async', draggable: 'false', width: '780', height: '379', sizes: '250px', srcset: `${art(780)} 780w, ${art(1170)} 1170w`, src: art(780) })") && e.includes("h('div.ff-ec-mode', { 'aria-hidden': 'true' }, m)"), 'the logo + the mode line');
  assert.ok(!/FREE FALL|'FREE'|'FALL'/.test(e), 'FREEFALL is ONE word — the header is the lettering itself');
  assert.equal(Number(/export const LOGO_REV = (\d+);/.exec(e)[1]), Number(/export const FF_ART_REV = (\d+);/.exec(code(`${FF}night.js`))[1]), 'the lettering\'s cache key = the scene\'s');
  assert.match(read('css/freefall-play.css'), /\.ff-ec-logo-img \{ display: block; width: clamp\(210px, calc\(var\(--ff-w\) \* 0\.58\), 320px\);/, '~58 % of the card — never under 210 pt: the script must read');
  assert.match(e, /cause\.style\.setProperty\('--fn', NEON\.teal\);/, 'the cause in teal — never red');
  assert.ok(s.includes("h('div.ff-endfoot', again, h('div.ff-links', ...(o.onLeave ? [city] : [share, h('i.ff-link-div', { 'aria-hidden': 'true' }), city])))"), 'F4B — THE UNIVERSAL FOOTER: PLAY AGAIN, then SHARE | HOME (the cartridge\'s own card: the way out alone)');
  assert.ok(!s.includes('SOON') && s.includes("h('a.ff-link.ff-city', { href: '/' }, linkIco('home'), h('span', 'HOME'))") && s.includes('press(share, sharePage);'), 'SHARE works (the phone\'s own share sheet — a line + this page\'s link: no card, no server); HOME goes home');
  assert.match(read('css/freefall-play.css'), /\.ff-again \{[^}]*border-radius: 12px;[^}]*background: var\(--ff-teal\); color: #04262a;/, 'PLAY AGAIN: one solid bar in FREEFALL\'s accent, a rounded rectangle (the universal footer\'s 12 px — never a pill)');
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
  assert.deepEqual(readdirSync(new URL('../assets/freefall/fx/', import.meta.url)).sort(), ['blaze.webp', 'burst.webp', 'sand-normal.webp', 'sand.webp'], 'THE BLAZE\'s atlas + F3B\'s: the breakthroughs\' sprites, the water\'s normal map, the seabed\'s sand');
  assert.ok(statSync(new URL('../assets/freefall/fx/blaze.webp', import.meta.url)).size < 30000, 'the atlas is small');
  const build = read('scripts/build-freefall-assets.py');
  assert.match(build, /SPRITES = \['flame_01', 'flame_03', 'fire_01', 'smoke_01'\]/); assert.doesNotMatch(build, /extractall|\.extract\(/, 'nothing is unpacked to disk');
  assert.match(read('assets/freefall/CREDITS.md'), /Particle Pack\*\* by Kenney Vleugels \(kenney\.nl\),\s+Creative Commons Zero \(CC0 1\.0/);
  // the ribbon + the embers + the fire-lit shards + the fire shockwave
  assert.match(n, /const ribbon = new THREE\.Mesh\(new THREE\.PlaneGeometry\(1, 1, 2, 16\), ribbonMat\);/, 'the ribbon: a strip mesh behind the ball');
  assert.match(read(`${FF}night.js`), /an ember: gold or neon pink/); assert.match(fx, /LIT BY THE FIRE \(a shard only ever flies from THE BLAZE's shatter\): gold glints on the faces turned to it, a neon-pink rim/);
  assert.match(fx, /THE FIRE SHOCKWAVE: a ring running out from the shatter — white-yellow at its inner lip, orange, neon pink at its outer edge/);
  // the ball's normal UNLIT glow stays as it was (the halo's colour + size at blaze 0 = F2's own numbers)
  assert.match(n, /LC\[0\] = 1; LC\[1\] = day \? 0\.09 \+ 0\.13 \* bz : 0\.42 - 0\.2 \* bz; LC\[2\] = day \? 0\.42 \+ 0\.16 \* bz : 0\.36 \+ 0\.22 \* bz;/); assert.match(n, /P\[3\] = SHAPE\.R_BALL \* \(3\.6 \+ 1\.6 \* bz\);/);
  assert.match(fx, /vec3 col = mix\(uEdge \* 1\.1, core, k \* k\);/, 'unlit: the white-hot core + its warm edge');
  // the greyscale check greys the WHOLE picture (the fire too)
  assert.match(n, /grey\(on\) \{ G\.uGrey\.value = 0; el\.style\.filter = on \? 'grayscale\(1\)' : ''; \}/);
  // ZERO GARBAGE: a flame is written into the pool
  const bareN = bare(read(`${FF}night.js`));
  for (const [re, what] of [[/=>/, 'an arrow'], [/\.\.\./, 'a spread'], [/[=(,:?]\s*\{/, 'a record'], [/`/, 'a template string']]) assert.doesNotMatch(body(bareN, '  function flame(x, y, z, vx, vy, vz, life, size) {'), re, `flame() builds ${what}`);
});

test('F3B — THE ROOF BELOW + THE BREAKTHROUGHS (static): a VIEW only (the rules never import them); the roof\'s painting + its city ship small and the skylight\'s place is the build script\'s own measure; ONE plane all the way down; the pieces are real 3D with a FIXED particle pool the tiers only trim; ZERO GARBAGE in their frame code; THE STUTTERS: every picture of the look asked for behind the opening; the finish\'s hook', async () => {
  const n = code(`${FF}night.js`), bk = code(`${FF}breaks.js`), bfx = read(`${FF}break-fx.js`), st = code(`${FF}stage.js`), fx = read(`${FF}night-fx.js`), build = read('scripts/build-freefall-assets.py');
  // A VIEW ONLY: the rules' files know nothing of it — the rules never change, the clock never stops
  for (const f of ['engine.js', 'tuning.js', 'tower-gen.js', 'logic.js', 'replay.js', 'bot.js']) assert.doesNotMatch(code(`${FF}${f}`), /breaks|break-fx|night|three/, `${f}: the rules never import the view`);
  assert.doesNotMatch(bk + n, /TICK_MS\s*\*=|slow|timeScale/i, 'no slow motion');
  const B = await import('../js/games/freefall/break-fx.js');
  assert.deepEqual([B.HIT_TICKS, B.CRACK], [8, 11], 'the ball meets the glass / the water 8 ticks after it leaves the floor above');
  // the pictures: small, the look's own; the skylight's place = the build script's measure
  for (const [f, max] of [['roof/below-night.webp', 260000], ['roof/below-day.webp', 340000], ['roof/city-night.webp', 80000], ['roof/city-day.webp', 90000], ['fx/burst.webp', 40000], ['fx/sand.webp', 40000], ['fx/sand-normal.webp', 200000]]) { const u = new URL(`../assets/freefall/${f}`, import.meta.url); assert.ok(existsSync(u) && statSync(u).size < max, `${f} ships, small (${existsSync(u) ? statSync(u).size : 0} B)`); }
  assert.deepEqual(readdirSync(new URL('../assets/freefall/roof/', import.meta.url)).sort(), ['below-day.webp', 'below-night.webp', 'city-day.webp', 'city-night.webp', 'grain.webp']);
  // F5A — THE ROOF GRAIN: a small detail tile MADE IN CODE by the build script (no source, no credit), read the same way by the roof below + the deck
  { const u = new URL('../assets/freefall/roof/grain.webp', import.meta.url); assert.ok(statSync(u).size < 45000, `roof/grain.webp ships, small (${statSync(u).size} B)`); }
  assert.match(build, /def grain\(\):/, 'the grain tile is the build script\'s own');
  assert.match(fx, /texture2D\(tGrain, ru \* 15\.0\)\.r - 0\.5\) \* 0\.62 \+ \(texture2D\(tGrain, vec2\(ru\.y, -ru\.x\) \* 5\.7 \+ 0\.31\)\.r - 0\.5\) \* 0\.38;\n {4}rf \*= 1\.0 \+ gr \* uGrain/, 'THE ROOF GRAIN: on the roof below, in as it comes close');
  assert.match(bfx, /texture2D\(tGrain, ru \* 15\.0\)\.r - 0\.5\) \* 0\.62 \+ \(texture2D\(tGrain, vec2\(ru\.y, -ru\.x\) \* 5\.7 \+ 0\.31\)\.r - 0\.5\) \* 0\.38;\n {2}c \*= 1\.0 \+ gr \* uNear/, '… and on the deck: the same reading (one roof)');
  assert.match(build, /ROOF_SKY = \(0\.505, 0\.472, 0\.130\)/); assert.match(n, /export const ROOF = Object\.freeze\(\{ cx: 0\.505, cy: 0\.472, sky: 0\.130, s0: 0\.92, s1: 0\.4, to: 34, tilt: 40, curl: 2\.2, far: 30, land: 38\.6 \}\);/, 'the same numbers as the build script measured');
  assert.match(build, /BURST = \['smoke_07', 'smoke_04', 'circle_05', 'circle_02', 'dirt_02', 'star_06', 'scorch_01'\]/, 'ONLY the sprites used'); assert.doesNotMatch(build, /glass-cracks\.png'\)|water-normal\.png'/, 'the cracks are drawn in code; the 4.6 MB water PNG is never read');
  const credits = read('assets/freefall/CREDITS.md');
  for (const w of ['Ground 055 S', 'ambientCG', 'Particle Pack', 'roof/below-night.webp']) assert.ok(credits.includes(w), `the credits name ${w}`);
  // THE ROOF BELOW: no fog wash — only a light distance haze far out; the roof is shut until the skylight breaks
  const sky = fx.slice(fx.indexOf('export const SKY_F'), fx.indexOf('export const COPY_V'));
  assert.match(sky, /g = mix\(g, hz, smoothstep\(0\.7, 2\.6, q\.y\) \* mix\(0\.75, 0\.6, uDay\)\);/, 'the haze begins well past the roof\'s far edge');
  assert.match(sky, /gl_FragColor = vec4\(col, \(1\.0 - k \* uOpen\) \* \(1\.0 - uBloom\)\);/, 'the room below shows under the seam only once the skylight is open');
  assert.match(n, /export const FOG_K = Object\.freeze\(\[0\.2, 1, 1, 1, 1, 1, 1\]\);/, 'the tower barely fades into haze on the rooftop');
  assert.match(n, /const roofAt = breaks\.out\[0\] > 0\.5 \? 1e9 : BREAK_FLOORS\.skylight;/, 'no floor under the shut roof is drawn'); assert.match(fx, /if \(vW\.y < uCutY\) discard;/);
  // ONE PLANE ALL THE WAY DOWN: far (leaning, on the camera's ray) → the true roof by ROOF.land; the 3D skylight rides its matrix
  assert.match(n, /const lean = \(ROOF\.tilt \* RAD - Math\.atan2\(-ry, -rz\)\) \* \(1 - t\), ca = Math\.cos\(lean\), sa = Math\.sin\(lean\);/); assert.match(n, /const wide = dist \* farK \* Math\.exp\(Math\.log\(trueK \/ farK\) \* t\), k = wide \/ ROOF_WIDE;/);
  assert.match(bfx, /vW = \(uM \* vec4\(p, 1\.0\)\)\.xyz;/); assert.match(bk, /deck\.matrixWorld\.copy\(X\.roofM\);/);
  // the pieces: a pane = ONE instanced mesh of the triangles it breaks into; a FIXED sprite pool, the tiers trim the share
  const K = await import('../js/games/freefall/breaks.js').catch(() => null);
  assert.equal(K, null, 'breaks.js needs three.js (the browser\'s import map): it is never loaded by a unit test — read as text here');
  assert.match(bk, /export const BURSTS = 176, BURST_K = Object\.freeze\(\[0\.45, 0\.7, 1\]\);/); assert.match(bk, /bGeo\.instanceCount = BURSTS;/, 'the pool never changes size');
  assert.match(bk, /const share = n => \{ const k = Math\.round\(n \* tierK\); return k < 1 \? 1 : k; \};/, 'a tier sheds a share — never none: the look\'s shape stays');
  assert.match(bk, /export const BREAK_FLOORS = Object\.freeze\(\{ skylight: 40, splash: 120, bottom: 200 \}\);/);
  assert.match(bk, /fractureGeo\(H, 0, SHAPE\.RB, 12, \[0\.2, 0\.55, 1\], 0x51f15e, 1\.7\)/, 'the glass: 60 pieces laid out round the ball\'s own point of impact');
  assert.match(bfx, /float e = min\(vB\.x, min\(vB\.y, vB\.z\)\), ew = fwidth\(e\) \* 1\.4 \+ 0\.0015, line = 1\.0 - smoothstep\(0\.0, ew \* 1\.5, e\);/, 'the cracks are drawn IN CODE along the lines the pane breaks on');
  assert.doesNotMatch(bk + bfx + n, /glass-cracks|chandelier/i, 'no crack picture, no chandelier');
  assert.match(bfx, /if \(ndc\.y < wl\) discard;/, 'THE WATERLINE: under it the plane is gone');
  // F5A — THE WATER SURFACE REBUILT (the owner's two targets): worked out in its shader — THE SWELL (long slow waves), the wall's own COLUMN
  // of light as broken streaks, plankton; by day turquoise + thin lines + foam. Never the normal map, never the tower's floors mirrored.
  const wf = bfx.slice(bfx.indexOf('export const WATER_F'), bfx.indexOf('// ---- THE SEABED'));
  assert.match(wf, /vec2 swell\(vec2 p, float t\)/, 'THE SWELL: long, slow waves — worked out in the shader');
  assert.match(wf, /texture2D\(tWall, vec2\(u, 0\.125\), bias\)/, 'a streak = the wall painting\'s own column of light, read soft');
  assert.match(wf, /float lines\(vec2 p, float t\)/, 'the day\'s thin ripple lines'); assert.match(wf, /THE FOAM/, 'the foam line at the wall + round the pillar');
  assert.doesNotMatch(wf, /tN\b|uRingC|uFaceC|uFloorY/, 'no normal map (crinkled foil), no floors mirrored (the brown blob)');
  assert.match(wf, /gl_FragColor = vec4\(col, 1\.0\);/, 'the surface hides what is under it');
  // (F5A — THE DAY CELEBRATION: a finish celebrates in BOTH looks — by night the firework, by day a burst of bubbles + the sun rays)
  assert.match(bk, /if \(fin === BREAK_FLOORS\.bottom && !X\.reduce\) \{ fwAt = time \+ 0\.9; fwN = 0; \}/, 'the celebration: a FINISH only, never with reduced motion');
  assert.match(bk, /if \(day\) \{ bubbles\(bx - 0\.48, by \+ 0\.42, bz - 0\.25\); raysU\.uT0\.value = now;/, 'by day: the bubbles + the sun rays'); assert.match(bk, /else firework\(bx - 0\.48, by \+ 0\.42, bz - 0\.25, 1, 0\.76, 0\.22\);/, 'by night: the firework');
  assert.match(bfx, /export const RAYS_F/, 'the sun rays\' shader'); assert.match(bfx, /export const RSHADOW_F/, 'a rock\'s soft shadow'); assert.match(bk, /new THREE\.IcosahedronGeometry\(1, 3\)/, 'a boulder: a finer ball, pushed about by a slow noise');
  assert.match(bfx, /float soft = step\(vC\.a, -0\.001\), own = abs\(vC\.a\);/, 'THE DUST: a soft cloud keeps its own thin cover'); assert.match(bfx, /c\.z = cn\.z \/ cn\.w \* c\.w;/, 'a puff\'s depth is its near side\'s');
  // ZERO GARBAGE in the new frame code
  const BUILDS = [[/=>/, 'an arrow function'], [/\bfunction\b/, 'an inner function'], [/\.\.\./, 'a spread'], [/`/, 'a template string'], [/[=(,:?]\s*\[/, 'a list'], [/[=(,:?]\s*\{/, 'a record'], [/\bnew\s+[A-Z]/, 'a new object'], [/\.(map|filter|slice|concat|flatMap|reduce|split|join|keys|values|entries|toFixed|toString|padStart)\(/, 'a list- / string-making call'], [/\bfor\s*\([^)]*\bof\b/, 'a for … of']];
  const frameFns = { 'night.js': ['  function roofPlane() {'], 'breaks.js': ['  function update(run, tau, now, sec, camY, bx, by, bz, tier) {', '  function puff(x, y, z, vx, vy, vz, life, s0, s1, cell, grav, drag, swirl, spin, r, g, b, cover) {', '  function breakSkylight() {', '  function splash(bx, bz) {', '  function hitBottom(bx, bz) {', '  function firework(x, y, z, r, g, b) {', '  function crackOpen(bx, bz) {', '  function feed(e, tau) {'] };
  for (const [file, heads] of Object.entries(frameFns)) { const src = bare(read(`${FF}${file}`)); for (const h of heads) for (const [re, what] of BUILDS) assert.doesNotMatch(body(src, h), re, `${file} ${h.trim()} builds ${what}`); }
  // THE STUTTERS: every picture of the look is asked for behind the opening — the bitmap decoded off the frame and uploaded at once
  assert.match(n, /function preload\(\) \{ for \(let k = 1; k <= 4; k\+\+\) wantWall\(k\); skyNow\(\); roofNow\(\); cityNow\(\); \}/); assert.match(n, /    preload\(\);\n    fogSnap = true; moteA = 0; moteKind = 0;/, 'at every (re)start');
  assert.match(n, /breaks\.force\(true\);/, 'THE WARM FRAME builds the breakthroughs\' programs too');
  assert.match(read('css/freefall-play.css'), /\.ff-dark::after \{[^}]*will-change: opacity;/, 'the darkness\'s side layer keeps its own layer');
  assert.match(st, /const HLOG = 24, hMs = new Float32Array\(HLOG\), hFloor = new Int32Array\(HLOG\), hWhy = new Uint8Array\(HLOG\), WHY = \['frame', 'pic', 'snd', 'band', 'tier', 'dom'\];/, 'THE HITCH LOG names what landed before a long frame');
  // THE FINISH: the moment plays (the card waits for it), then the run is handed on ONCE
  assert.match(st, /export const END_HOLD_MADE_MS = 2600;/); assert.match(st, /if \(over && !shown && now - endedAt >= \(run\.st === 'made' \? END_HOLD_MADE_MS : END_HOLD_MS\)\) showEnd\(now\);/);
  // (the fresh-eyes review: handed on AT THE `made` EVENT — the frame it ends in, or the hide that steps into it; only the card waits)
  assert.match(st, /function handOn\(\) \{\n    if \(handed \|\| run\.st !== 'made'\) return;\n    handed = true;\n    const res = resultOf\(run\), log = logOf\(run\);\n    finished = \{ seed, mode: MODE, floor: res\.floor, tick: res\.tick, look: lookT, same: null, judged: null \};\n    if \(o\.onFinish\) \{ try \{ o\.onFinish\(finished, log\); \}/, 'the hook F4 wires the match on');
  assert.match(st, /if \(over && !endedAt\) \{ endedAt = now; awake\(false\); handOn\(\); \}/); assert.match(st, /if \(t0 == null \|\| isOver\(run\) \|\| spect\) \{ if \(t0 != null && !spect\) handOn\(\); return; \}/); assert.match(st, /settle\(T\); stepTo\(run, T, ev\);\n    handOn\(\);/);
  assert.match(st, /if \(res\.made\) \{ handOn\(\); finished\.same = same; finished\.judged = verdict\.ok === true; \}/);
  // THE TRENCH's MOUTH (the fresh-eyes review — SOLO: the floor under the ball is ALWAYS in sight): the bed is open round the tower + along the cleft toward the viewer; a finish's bed is whole
  const bfx2 = read(`${FF}break-fx.js`), brk2 = read(`${FF}breaks.js`);
  assert.match(bfx2, /float mouth\(vec2 xz\) \{\n  float d = length\(vec2\(xz\.x, min\(xz\.y, 0\.0\)\)\);/); assert.equal((bfx2.match(/if \(uHole > 0\.0 && m < 0\.0\) discard;/g) || []).length, 2, 'the plane + the pieces');
  assert.match(brk2, /bedHole\.value = fin === BREAK_FLOORS\.bottom \? 0 : SEABED\.mouth;/); assert.match(brk2, /export const SEABED = Object\.freeze\(\{ down: 0\.26, half: 3\.3, mouth: 1\.14 \}\);/);
  assert.match(brk2, /if \(solo\) shelf\(k\); else/, 'SOLO: the dust rises off the shelves — never over the floors below');
  assert.match(n, /if \(poseTo !== POSE\.finish\) pose\('finish'\);/, 'THE FINISH has its own camera'); assert.match(n, /export const STUMP = 0\.36;/);
  assert.match(n, /if \(run\.st === 'made'\) return SHAPE\.H \* \(1 - u\) \* \(1 - 0\.45 \* u\);/, 'the last drop onto the seabed is the view\'s own');
  assert.match(st, /if \(e\.e === 'area' && e\.floor === BREAK_AT\.splash && snd && snd\.muffle\) snd\.muffle\(MUFFLE_S, BREAK_HIT_S \+ MUFFLE_AFTER_S\);/, 'THE SPLASHDOWN muffles the mix');
  assert.match(st, /if \(e\.e === 'made' && snd && !reduceM\) snd\.playCues\(FIREWORK_CUES\);/, 'the celebration\'s sound: a finish in both looks (F5A) — and never without its celebration (reduced motion)');
});
