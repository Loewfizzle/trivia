// FREEFALL — THE CARTRIDGE (F4A; PLAYABLE since THE GO-LIVE, Nov 28), end to end on the LOCAL EMULATORS (NEVER THE LIVE SITE): docs/freefall.md
//   "THE CARTRIDGE" · "THE PROOF" · "THE SWITCH"
//   1–2. A STRANGER (no owner, no flag): PLAY → FREEFALL on top with NEW (never · TEST) → its card → PLAY NOW → the game
//   3. THE FIRST DRAG → GO (the SERVER's time, read back) → the seed = hash(code + matchId + GO), tick 0 = GO + 600 ms; the run plays; the
//      proof node fills with server-stamped chunks of the packed input log; the end → `e` → the console's podium
//   4. THE SWITCH IS ON (the code's own — THE GO-LIVE): the run is COUNTED — results/ done, XP, the best on freefall-solo = the server's
//      replay, THE AVERAGE's day row, the streak day
//   5. PLAY AGAIN = the console's INSTANT AGAIN (a match of its own, back on THE OPENING, the scene kept warm)
//   6. THE HOLD in the cartridge: the page hidden mid-run → the hold goes up with the log; back → the way back is STAMPED by the server
//      (h/0), the run goes on 2.4 s after it; the judge accepts the held run whole
//   7. THE KILL SWITCH (the emulators' two-way flip testFreefallCounts = false — FREEFALL_COUNTS false in production): /api/report still
//      JUDGES the run — WOULD COUNT matches the phone's own result — and writes NOTHING (pstats, the profile, the board, results/ untouched)
//   8. an UNPROVEN run (the proof node refused — no GO): it plays on its own seed, says NOT COUNTED, ends on the stage's own card
//   node tests/integration/e2e-freefall.mjs "<chromium>" [outDir]
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { verifyRun } from '../../api/_lib/freefall.js';
import { logFromChunks, chunkTimes, stampsOf, START_LEAD_MS, RESUME_LEAD_MS } from '../../js/games/freefall/proof.js';
import { seedOf } from '../../js/games/freefall/logic.js';
import { createRun } from '../../js/games/freefall/engine.js';
import { floorInto } from '../../js/games/freefall/tower-gen.js';
import { isNew, dayKeyOf } from '../../js/core/game-order.js';
import { streakDay } from '../../js/core/streak.js';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const argv = process.argv.slice(2), OUT = argv.slice(1).find(a => !a.startsWith('--')) || null;
if (OUT) mkdirSync(OUT, { recursive: true });
const DB = 'http://127.0.0.1:9000', NS = 'ns=demo-arcade-default-rtdb', AUTH = { Authorization: 'Bearer owner' };
const dbGet = path => fetch(`${DB}/${path}.json?${NS}`, { headers: AUTH }).then(r => r.json());
const dbPut = (path, v) => fetch(`${DB}/${path}.json?${NS}`, { method: 'PUT', headers: AUTH, body: JSON.stringify(v) }).then(r => r.json());
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fails = [];
let n = 0;
const ok = (c, what) => { n++; if (!c) fails.push(what); console.log(c ? 'OK  ' : 'FAIL', what); };
const b = await puppeteer.launch({ executablePath: argv[0], headless: true, protocolTimeout: 600000, args: ['--enable-gpu', '--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const UP = '!!(window.__district && window.__district.harbor() && window.__district.harbor().shown) && !!window.__arcade && window.__arcade.state.ready && !!window.__arcade.state.uid';
const S = 'window.__arcade.state', G = 'window.__ffGame', ST = 'window.__ffStage';

async function phone(slot, name = 'FALLER') {
  const ctx = await b.createBrowserContext();
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e.message || e)));
  if (process.env.FF_DEBUG) p.on('console', m => console.log(`   [${m.type()}] ${m.text().slice(0, 240)}`));
  const cdp = await p.createCDPSession();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.evaluateOnNewDocument(s => { try { localStorage.setItem('nd:entered', '1'); localStorage.setItem(`na:${s[0]}:profile`, JSON.stringify({ name: s[1], color: 'cyan', avatar: 'bolt' })); localStorage.setItem('na:settings', JSON.stringify({ musicOff: true })); localStorage.setItem('ns:look', s[2]); } catch { /* fine */ } }, [slot, name, process.env.FF_LOOK === 'day' ? 'day' : 'night']);
  const waitFor = async (js, ms = 20000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* navigating */ } await sleep(50); } return false; };
  const open = async () => { await p.goto(guardUrl(`${BASE}/?emu&slot=${slot}&city=2&when=2026-11-10T20:30`, 'e2e-freefall.mjs'), { waitUntil: 'domcontentloaded' }); if (!await waitFor(UP, 60000)) throw new Error('the city never came up'); };
  await open();
  const ev = js => p.evaluate(js);
  const tap = async sel => { const r = await p.evaluate(q => { const el = document.querySelector(q); if (!el) return null; const x = el.getBoundingClientRect(); return [x.left + x.width / 2, x.top + x.height / 2]; }, sel); if (!r) return null; await p.touchscreen.tap(r[0], r[1]); return r; };
  /** a REAL finger: down, across by `dx` px, up — the first one of a run is its START */
  const drag = async (dx = 24, y = 600) => {
    const pt = x => ({ x, y, id: 1, radiusX: 4, radiusY: 4, force: 1 });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt(195)] });
    for (let k = 1; k <= 3; k++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [pt(195 + dx * k / 3)] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  const hideShow = hidden => p.evaluate(hd => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (hd ? 'hidden' : 'visible') }); document.dispatchEvent(new Event('visibilitychange')); }, hidden);
  const shot = async name => { if (OUT) await p.screenshot({ path: join(OUT, name) }); };
  return { p, ev, waitFor, open, tap, drag, hideShow, shot, errs, close: () => ctx.close() };
}
const pidOf = async P => { const uid = await P.ev(`${S}.uid`); for (let i = 0; i < 60; i++) { const pid = await dbGet(`uids/${uid}`); if (pid) return { uid, pid }; await sleep(250); } return { uid, pid: null }; };
const nodeOf = (code, m, uid) => dbGet(`rooms/${code}/ff/${m}/${uid}`);
const toFinal = (P, ms = 30000) => P.waitFor(`${S}.game && ${S}.game.phase === 'final' && !!document.querySelector('.ff-final .ff-fin .ff-ec-n')`, ms);
const snap = async pid => JSON.stringify([await dbGet(`pstats/${pid}`), await dbGet(`profiles/${pid}`), await dbGet('lb/freefall-solo'), await dbGet(`ppriv/${pid}`), Object.keys((await dbGet('results')) || {}).filter(k => !/^_/.test(k)).length]);
const again = P => P.ev("(() => { const b = document.querySelector('.ff-final .final-bar') || [...document.querySelectorAll('.ff-final button')].find(x => /PLAY AGAIN/.test(x.textContent)); b.click(); })()");
/** the console's END-OF-ROUND MOMENT (a run that paid XP): waited out / continued */
const pastMoment = async P => {
  for (let i = 0; i < 30 && !(await P.ev("!!document.querySelector('.pg-moment')")); i++) await sleep(200);
  for (let i = 0; i < 10 && await P.ev("!!document.querySelector('.pg-moment')"); i++) {
    await P.ev("(() => { const m = document.querySelector('.pg-moment'), b = m && m.querySelector('.pg-btn'); if (b && m.classList.contains('is-end')) b.click(); else if (m) m.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); })()");
    await sleep(700);
  }
};
/** F5C — THE CAUSE IS CERTAIN: does the run's OWN tower (its seed — the proof's: hash(code + matchId + GO), never a test's) carry red on
 *  floor i? (a floor without red — the blind floors 40 + 120, a red-free layout — left the 'red' hand bouncing there until the darkness took it:
 *  F5B's one red run "caught by the darkness at floor 12") */
const redOn = (seed, i) => { const r = createRun({ seed: String(seed), mode: 'solo' }), f = floorInto(r.h, i, r.R, { i: -1, twist: 0, gap: 0, red: 0, m1: 0, m2: 0 }); return !!(f.red || f.m1); };
/** play to `floor` with the checks' own hand, then onto the red ON THE FIRST FLOOR FROM THERE THAT HAS RED (the run ends) → the page's own result */
async function playTo(P, floor) {
  await P.ev(`${ST}.auto = 'play'`);
  await P.waitFor(`${ST}.state().floor >= ${floor} || ${ST}.state().over`, 90000);
  for (let k = 0; k < 60; k++) {
    const s = await P.ev(`(() => { const s = ${ST}.state(); return { over: !!s.over, floor: s.floor, seed: s.seed }; })()`);
    if (s.over) break;
    const red = redOn(s.seed, s.floor);
    await P.ev(`${ST}.auto = '${red ? 'red' : 'play'}'`);
    await P.waitFor(`${ST}.state().over || ${ST}.state().floor !== ${s.floor}`, red ? 20000 : 30000);
  }
  await P.waitFor(`${ST}.state().over`, 20000);
  return P.ev(`${ST}.result()`);
}

try {
  await dbPut('testFreefallCounts', null);
  // ---- 1–2. A STRANGER: FREEFALL is PLAYABLE — on the shelf (NEW, on top — its first 14 days), its card, PLAY NOW (THE GO-LIVE, Nov 28)
  const P = await phone(`ff${Date.now() % 100000}`);
  const { uid, pid } = await pidOf(P);
  ok(!!pid, 'the phone has its profile');
  ok(await P.ev("import('/js/config.js').then(c => c.isPlayable('freefall') && !c.isOwnerTest('freefall') && c.GAMES.some(g => g.id === 'freefall' && g.playable && !g.preview && g.live === '2026-11-28'))"), 'a stranger: FREEFALL is PLAYABLE — no owner, no TEST (THE GO-LIVE)');
  await P.tap('.nd-tab-play');
  ok(await P.waitFor("!!document.querySelector('.nd-shelf-sheet.is-in .nd-shelf-row[data-game=\"freefall\"]')", 6000), 'a stranger: the dock\'s PLAY → THE GAMES SHELF lists FREEFALL');
  const row1 = await P.ev("(() => { const r = [...document.querySelectorAll('.nd-shelf-row')]; const f = document.querySelector('.nd-shelf-row[data-game=\"freefall\"]'); return { first: r[0] === f, text: f.textContent, n: r.length, isNew: !!f.querySelector('.gm-new') }; })()");
  ok(row1.n === 6 && !/TEST/.test(row1.text), `… six playable games — FREEFALL never · TEST ("${row1.text.replace(/\s+/g, ' ').trim()}")`);
  // (NEW from its go-live STREAK DAY — the 4 am line of Nov 28 — for 14 days: HIGH RISE's rule; before 4 am the day is still Nov 27)
  const freshNow = isNew('2026-11-28', dayKeyOf(streakDay(Date.now())));
  if (freshNow) ok(row1.first && row1.isNew, `… on TOP with NEW (its first 14 days from its go-live, Nov 28)${row1.isNew ? ' · NEW' : ''}`);
  else ok(!row1.isNew, `… not NEW yet / any more: the streak day is ${dayKeyOf(streakDay(Date.now()))} (NEW from the 4 am line of Nov 28 for 14 days)`);
  await P.shot('golive-stranger-shelf.png');
  await sleep(450);   // (the shelf sheet's first moment drops a tap)
  await P.tap('.nd-shelf-row[data-game="freefall"]');
  ok(await P.waitFor("!!document.querySelector('.nd-card-sheet.is-in .nd-card[data-game=\"freefall\"] .nd-card-solo')", 8000), 'its row → THE GAME CARD with PLAY NOW');
  await P.shot('golive-stranger-card.png');
  const tPlay = Date.now();
  await sleep(450);   // (the card sheet's first moment drops a tap)
  await P.tap('.nd-card-solo');
  ok(await P.waitFor(`${S}.game && ${S}.game.id === 'freefall' && !!document.querySelector('.ff-stage.ff-game canvas.ff-canvas') && !!${G} && ${ST}.state().info.frames > 3`, 40000), `PLAY NOW → the game's own screen: the stage in the console's frame (${Date.now() - tPlay} ms from the tap)`);
  let g = await P.ev(`({ code: ${S}.code, m: ${S}.game.matchId, mode: ${S}.game.mode, phase: ${S}.game.phase })`);
  ok(g.mode === 'solo' && g.phase === 'play', `PLAY NOW's solo room, SOLO, playing (match ${g.m})`);
  ok(await P.ev("!!document.querySelector('.menu-btn') && !!document.querySelector('.music-btn') && !document.querySelector('.ff-snd') && !document.querySelector('.ff-note').textContent"), 'inside the console\'s game frame: the corner menu + music — none of the test page\'s own pieces (SOUNDS · the TEST PAGE note)');
  ok(await P.ev(`${ST}.state().look === document.body.dataset.look && ${ST}.state().cls.includes('is-open') && !${ST}.state().started`), 'THE OPENING (the look = the console\'s GAME LOOK): the run waits for the first drag');
  await P.waitFor(`${ST}.state().info.landed >= 12`, 20000);
  const box = await P.ev("(r => [Math.round(r.left), Math.round(r.right), Math.round(r.top), Math.round(r.bottom)])(document.querySelector('.ff-stage').getBoundingClientRect())");
  ok(box[0] === 0 && box[1] === 390 && box[2] === 0 && box[3] === 844, `the stage fills the window inside the console's frame (${box.join(' ')}) — never pushed aside by the screen's own padding`);
  await P.shot('f4a-cartridge-opening.png');

  // ---- 3. THE FIRST DRAG → GO → the seed + tick 0; a run; the proof
  const standIn = await P.ev(`${ST}.state().seed`);
  await P.drag();
  ok(await P.waitFor(`${G}.state().proven && ${G}.state().go > 0 && ${ST}.state().started`, 15000), 'the first drag → GO: the run is PROVEN');
  let gs = await P.ev(`${G}.state()`), node = await nodeOf(g.code, g.m, uid);
  const stamp = await dbGet(`rooms/${g.code}/ff/${g.m}/t0`), pt = await dbGet(`rooms/${g.code}/pt`);
  ok(node && node.go === gs.go && Math.abs(node.go - Date.now()) < 60000, 'GO = the SERVER\'s time in the proof node (rooms/{CODE}/ff/{matchId}/{uid}/go)');
  ok(typeof stamp === 'number' && stamp <= node.go && node.go - stamp < 5000 && pt && pt.g === 'ff' && pt.m === g.m, `THE STAMP first: t0 ${node.go - stamp} ms before the GO, the room's tree counter with it (pt.n ${pt && pt.n}, g ff)`);
  const seed = seedOf(g.code, g.m, node.go), seedNow = await P.ev(`${ST}.state().seed`);
  ok(seedNow === seed && seedNow !== standIn, `the run's seed = hash(code + matchId + GO) — picked AFTER the first drag (${seed}); the opening stood on a stand-in`);
  const res1 = await playTo(P, 12);
  ok(res1.over && res1.floor >= 12 && res1.cause === 'red', `a run: floor ${res1.floor}, ${res1.cause}`);
  ok(await toFinal(P), 'the end → `e` → the host\'s step → the console\'s podium with FREEFALL\'s body');
  node = await nodeOf(g.code, g.m, uid);
  const L = logFromChunks(node.c), T = chunkTimes(node.c);
  ok(L && T && T.length >= 2 && T.every(k => k.at >= node.go && Math.abs(k.at - Date.now()) < 120000) && node.e && node.e.f === res1.floor, `THE PROOF: ${T ? T.length : 0} server-stamped chunks, ${L ? L.log.length : 0} log events, then the end (e.f ${node.e && node.e.f})`);
  // (each chunk went up while its events were fresh: its last event at most ~1.5 s of play before its arrival)
  const lag = T.map(k => k.at - (node.go + START_LEAD_MS + k.t1 * 1000 / 60));
  ok(Math.max(...lag) < 2500 && Math.min(...lag) > -300, `… each chunk on the clock: its last event ${Math.round(Math.min(...lag))} … ${Math.round(Math.max(...lag))} ms before its arrival`);
  const v1 = verifyRun({ code: g.code, matchId: g.m, node });
  ok(v1.ok && v1.floor === res1.floor && v1.tick === res1.tick && v1.end === res1.end && v1.cause === res1.cause && !v1.cut, `THE JUDGE (the server's own replay of the node) == the phone's run: floor ${v1.floor}, tick ${v1.tick}, ${v1.cause}${v1.ok ? '' : ` — refused: ${v1.why}`}`);
  const fin = await P.ev("({ t: document.querySelector('.ff-fin .ff-ec-cause').textContent, n: document.querySelector('.ff-fin .ff-ec-n').getAttribute('aria-label'), kicker: document.querySelector('.ff-final .sheet-kicker').textContent, bar: (document.querySelector('.ff-final .final-bar') || {}).textContent })");
  ok(fin.t === 'HIT THE RED' && fin.n === String(res1.floor) && /^SOLO$/.test(fin.kicker.trim()) && /PLAY AGAIN/.test(fin.bar || ''), `the podium: ${fin.t} · ${fin.n} FLOORS · ${fin.kicker} · ${String(fin.bar).trim()}`);
  // F4B — THE END SCREEN: the header = THE LOGO (the lettering in the frame's own header slot, the mode under it); the universal footer: PLAY AGAIN · SHARE | HOME
  const hd = await P.ev("(() => { const k = document.querySelector('.ff-final .sheet-kicker'), im = k && k.querySelector('.ff-ec-logo-img'), r = im && im.getBoundingClientRect(), links = [...document.querySelectorAll('.ff-final .final-links .final-link')].map(x => x.textContent.trim()); return { w: r ? r.width : 0, src: im ? im.currentSrc : '', label: k && k.querySelector('.ff-ec-logo') ? k.querySelector('.ff-ec-logo').getAttribute('aria-label') : '', links }; })()");
  ok(hd.w >= 210 && hd.w <= 250 && /lettering-/.test(hd.src) && hd.label === 'Freefall, solo' && hd.links.join('|') === 'SHARE|HOME', `F4B — THE LOGO header (${hd.w.toFixed(0)} pt wide, "${hd.label}") · the universal footer's links: ${hd.links.join(' | ')}`);

  // ---- 4. THE SWITCH IS ON (the code's own — THE GO-LIVE): COUNTED
  const counted = async (code, m, ms = 30000) => { const end = Date.now() + ms; let d = null; while (Date.now() < end && !(d && d.st === 'done')) { d = await dbGet(`results/${code}_${m}`); await sleep(250); } return d; };
  const done1 = await counted(g.code, g.m);
  const stats1 = await dbGet(`pstats/${pid}`), o1 = done1 && done1.o && done1.o[pid];
  ok(done1 && done1.st === 'done' && done1.g === 'freefall', 'THE SWITCH ON: the run is COUNTED (results/ done) — a stranger\'s, with no flip');
  ok(o1 && o1.xp && o1.xp.gain > 0 && stats1.xp === o1.xp.to, `… XP +${o1 && o1.xp && o1.xp.gain}`);
  ok(stats1 && stats1.b && stats1.b['freefall-solo'] && stats1.b['freefall-solo'].a === res1.floor, `… the best: floor ${res1.floor} on the board freefall-solo (the server's replay)`);
  ok(stats1 && stats1.av && stats1.av['freefall-solo'] && stats1.st && stats1.st.n >= 1, '… the day row of THE AVERAGE written (pstats.av/freefall-solo — as on JAYWALK) + the streak day');
  ok(await P.ev("!document.querySelector('.ff-fin[data-would]') && !document.querySelector('.ff-fin-would')"), '… no WOULD COUNT anywhere (the answer is the counted one)');
  await pastMoment(P);
  // F5B — THE END-SCREEN BOARD (ui/end-board.js — FREEFALL's END_BOARD): the board's top 3 under ONE header — F5C: the tick FRIENDS ONLY alone; the screen does not scroll
  ok(await P.waitFor("!!document.querySelector('.ff-final .final-eb.eb .eb-head .eb-tick[role=checkbox]')", 15000), 'F5B — the shared board block is up: its heading + the FRIENDS tick');
  const eb = await P.ev("(() => { const f = document.querySelector('.ff-final .final'); return { k: document.querySelector('.eb-head').textContent + (document.querySelector('.eb-k') ? ' + a heading' : ''), rows: document.querySelectorAll('.eb-list li').length, note: document.querySelector('.eb-note').textContent, scroll: f.scrollHeight - f.clientHeight, winner: getComputedStyle(document.querySelector('.ff-final .winner')).display, stats: !!document.querySelector('.ff-fin .ff-ec-line') }; })()");
  await P.ev("document.querySelector('.eb-tick').click()");
  ok(await P.waitFor("document.querySelector('.eb-note').textContent === 'NO FRIENDS YET' && document.querySelector('.eb-k').textContent === 'GLOBAL TOP 3' && document.querySelector('.eb-tick').getAttribute('aria-checked') === 'false'", 15000), `F5B — FRIENDS ticked with no friends yet: "${await P.ev("document.querySelector('.eb-note').textContent")}" — everyone stays (the server's YOUR TABLE asked once; THE FREEFALL CITY PASS: the heading back to GLOBAL TOP 3)`);
  ok(await P.ev("localStorage.getItem('ns:endb:fr')") === '0', 'FIX C — S11: the tick that unticked itself is REMEMBERED off (\'0\') — the next end screen never says NO FRIENDS YET again');
  ok(eb.k === 'GLOBAL TOP 3FRIENDS ONLY + a heading' && eb.rows <= 3 && eb.winner === 'none' && !eb.stats && eb.scroll <= 1, `… "${eb.k}" (${eb.rows} rows${eb.note ? ` — ${eb.note}` : ''}), no winner line, no stats line, NOTHING SCROLLS (${eb.scroll} px over)`);
  await sleep(400);
  ok(await P.waitFor("/^(NEW BEST · \\d+|YOUR BEST \\d+ · AVG (\\d+|—))$/.test(document.querySelector('.ff-fin .ff-ec-best').textContent)", 15000), `… the end screen says ${await P.ev("document.querySelector('.ff-fin .ff-ec-best').textContent")}`);
  await P.shot('golive-counted-solo-end.png');

  // ---- 5. PLAY AGAIN = THE INSTANT AGAIN
  const canvasId = await P.ev("(() => { const c = document.querySelector('canvas.ff-canvas'); c.dataset.e2e = 'kept'; return 1; })()");
  await again(P);
  ok(await P.waitFor(`${S}.game && ${S}.game.matchId !== '${g.m}' && ${S}.game.phase === 'play' && !!${G} && !${ST}.state().started && ${ST}.state().cls.includes('is-open') && !document.querySelector('.ff-final')`, 15000), 'PLAY AGAIN → the next run, a match of its own — back on THE OPENING (the first drag starts it)');
  ok(canvasId && await P.ev("document.querySelector('canvas.ff-canvas').dataset.e2e === 'kept'"), '… the scene kept warm: the SAME canvas (no new WebGL context)');
  const g2 = await P.ev(`({ code: ${S}.code, m: ${S}.game.matchId })`);

  // ---- 6. THE HOLD in the cartridge
  await sleep(500);   // (a press within 350 ms of a restart starts nothing — the tail of a double tap on PLAY AGAIN)
  await P.drag();
  ok(await P.waitFor(`${G}.state().proven && ${ST}.state().started`, 15000), `the next run's first drag → its own GO: PROVEN (${JSON.stringify(await P.ev(`(s => ({ proven: s.proven, go: s.go > 0, started: s.started, why: s.whyNot, spent: s.spent, stage: s.stage }))(${G}.state())`))})`);
  await P.ev(`${ST}.auto = 'play'`);
  await P.waitFor(`${ST}.state().floor >= 4`, 30000);
  await P.hideShow(true);
  ok(await P.waitFor(`${ST}.state().held`, 4000), 'the page hidden mid-run: the run is HELD');
  const heldFloor = await P.ev(`${ST}.state().floor`);
  let nh = null;
  for (let i = 0; i < 40 && !(nh && logFromChunks(nh.c) && logFromChunks(nh.c).log.some(e => e.k === 'hold')); i++) { await sleep(150); nh = await nodeOf(g2.code, g2.m, uid); }
  ok(nh && logFromChunks(nh.c).log.some(e => e.k === 'hold') && !nh.h, 'the hold goes up with the log as the page hides (a logged event) — no way back stamped yet');
  await sleep(1500);   // (away)
  await P.hideShow(false);
  ok(await P.waitFor(`!${ST}.state().held && !${ST}.state().over`, 8000), 'back: 3 · 2 · 1, then the run goes on');
  nh = await nodeOf(g2.code, g2.m, uid);
  const st6 = stampsOf(nh);
  ok(st6.length === 1 && st6[0] > nh.go && Math.abs(st6[0] - Date.now()) < 60000, `the way back is STAMPED by the server (h/0, ${Date.now() - st6[0]} ms ago — the run went on ${RESUME_LEAD_MS} ms after it)`);
  const res6 = await playTo(P, heldFloor + 5);
  ok(await toFinal(P), 'the held run ends on the podium');
  nh = await nodeOf(g2.code, g2.m, uid);
  const v6 = verifyRun({ code: g2.code, matchId: g2.m, node: nh });
  ok(v6.ok && v6.holds === 1 && !v6.cut && v6.floor === res6.floor && v6.tick === res6.tick && v6.end === res6.end, `THE JUDGE accepts the held run whole: floor ${v6.floor} (the phone's ${res6.floor}), 1 hold, nothing cut${v6.ok ? '' : ` — refused: ${v6.why}`}`);
  const done6 = await counted(g2.code, g2.m, 90000);   // (two runs a minute apart: the server's 45 s gap may ask the phone to resend — it does)
  ok(done6 && done6.st === 'done' && done6.o && done6.o[pid] && !done6.o[pid].skip, `… and it is COUNTED whole (results/ done${done6 && done6.o && done6.o[pid] && done6.o[pid].skip ? `, skipped: ${done6.o[pid].skip}` : ''})`);

  // ---- 6b. A PAUSE WITH NO LINE (F4B — THE PAUSE GAP on the phone; the fresh-eyes review's HIGH): the line drops, THEN the page hides — the
  // hold's chunk can not leave. Back on screen with the line still down, the phone must NOT call the pause granted off its own UNSENT write
  // (its mirror shows that chunk with the phone's own guess of the time): no stamp, the count runs its three times, the run goes on and
  // SAYS it is not counted past the pause; when the line is back the chunk lands LATE — the judge cuts the run before the pause
  await again(P);
  await P.waitFor(`${S}.game && ${S}.game.matchId !== '${g2.m}' && ${S}.game.phase === 'play' && !${ST}.state().started`, 15000);
  const g2b = await P.ev(`({ code: ${S}.code, m: ${S}.game.matchId })`);
  await sleep(500);
  await P.drag();
  await P.waitFor(`${G}.state().proven && ${ST}.state().started`, 15000);
  await P.ev(`${ST}.auto = 'play'`);
  await P.waitFor(`${ST}.state().floor >= 4`, 30000);
  await P.ev("import('/js/firebase.js').then(f => f.goOffline())");
  await sleep(400);
  await P.hideShow(true);
  await P.waitFor(`${ST}.state().held`, 4000);
  const heldFloorB = await P.ev(`${ST}.state().floor`);
  await sleep(3300);   // (away, longer than the judge's 2 s grant)
  await P.hideShow(false);
  ok(await P.waitFor(`!${ST}.state().held`, 14000), 'back with NO LINE: the count runs (no answer — up to three times), then the run goes on');
  const noteB = await P.ev(`${ST}.state().note`), nodeB0 = await nodeOf(g2b.code, g2b.m, uid);
  ok(/NOT COUNTED PAST THE PAUSE/.test(noteB) && !(nodeB0 && nodeB0.h), `… it SAYS so ("${noteB}") and no way back was stamped — the pause was never called granted off the phone's own unsent chunk`);
  await P.ev("import('/js/firebase.js').then(f => f.goOnline())");
  await P.ev(`${ST}.auto = 'red'`);
  ok(await toFinal(P), 'the run ends on the podium');
  const nodeB = await nodeOf(g2b.code, g2b.m, uid), vB = verifyRun({ code: g2b.code, matchId: g2b.m, node: nodeB });
  ok(vB.ok && vB.cut && (vB.cut.why === 'pause' || vB.cut.why === 'hold') && vB.floor <= heldFloorB + 1, `THE JUDGE: the hold's chunk landed late — the run is CUT at the pause (${vB.ok ? `floor ${vB.floor}, cut: ${vB.cut && vB.cut.why}` : `refused: ${vB.why}`}; held on floor ${heldFloorB})`);

  // ---- 7. THE KILL SWITCH (FREEFALL_COUNTS = false — here the emulators' two-way flip): judged, WOULD COUNT, NOTHING written
  await counted(g2b.code, g2b.m, 90000);   // (the cut run's own count lands first — never inside the snapshot below)
  await dbPut('testFreefallCounts', false);
  const before = await snap(pid);
  await again(P);
  await P.waitFor(`${S}.game && ${S}.game.matchId !== '${g2b.m}' && ${S}.game.phase === 'play' && !${ST}.state().started`, 15000);
  const g3 = await P.ev(`({ code: ${S}.code, m: ${S}.game.matchId })`);
  await sleep(500);
  await P.drag();
  await P.waitFor(`${G}.state().proven && ${ST}.state().started`, 15000);
  const res7 = await playTo(P, 8);
  ok(await toFinal(P), 'THE KILL SWITCH OFF: a run → the podium');
  ok(await P.waitFor("!!document.querySelector('.ff-fin[data-would]')", 20000), 'the server\'s answer arrives (kept on the body — no line on the screen)');
  const would = await P.ev("({ floor: document.querySelector('.ff-fin').dataset.would, line: !!document.querySelector('.ff-fin-would') })");
  ok(would.floor === String(res7.floor) && !would.line, `THE SWITCH OFF: WOULD COUNT at floor ${would.floor} — the server's own floor = the phone's; no WOULD COUNT line takes room`);
  await sleep(1200);
  ok(await snap(pid) === before, '… and NOTHING was written: pstats, the profile, the board freefall-solo, ppriv, results/ are as before');
  await P.shot('golive-killswitch-would-count.png');
  await dbPut('testFreefallCounts', null);
  ok(P.errs.length === 0, `no page errors${P.errs.length ? ` (${P.errs.slice(0, 3).join(' · ')})` : ''}`);
  await P.close();

  // ---- 8. UNPROVEN: the proof node refused (the game the room plays is not FREEFALL to the rules: its phase is flipped under the page)
  {
    const Q = await phone(`fu${Date.now() % 100000}`, 'NOLINE');
    const q = await pidOf(Q);
    ok(await Q.ev("import('/js/host.js').then(m => m.playSolo('freefall'))") !== false, 'a stranger\'s PLAY NOW starts it');
    await Q.waitFor(`${S}.game && ${S}.game.id === 'freefall' && !!${G} && ${ST}.state().info.frames > 3`, 40000);
    // (the rules take a GO only while the room's game is THIS match: the tree already "begun" by a stray child → no stamp, no GO)
    const gq = await Q.ev(`({ code: ${S}.code, m: ${S}.game.matchId })`);
    await dbPut(`rooms/${gq.code}/ff/${gq.m}/zz`, { x: 1 });
    await Q.drag();
    ok(await Q.waitFor(`${ST}.state().started && !${G}.state().proven`, 20000), 'the proof node refused (no stamp, no GO): the run still PLAYS — UNPROVEN');
    ok(/^NOT COUNTED — /.test(await Q.ev(`${ST}.state().note || document.querySelector('.ff-note').textContent`)), `… and says so while it is on: "${await Q.ev("document.querySelector('.ff-note').textContent")}"`);
    await Q.ev(`${ST}.auto = 'red'`);
    await Q.waitFor(`${ST}.state().over`, 30000);
    ok(await Q.waitFor("!document.querySelector('.ff-end').hidden && /^NOT COUNTED — /.test(document.querySelector('.ff-note').textContent) && !document.querySelector('.ff-final')", 8000), 'it ends on the stage\'s OWN card — NOT COUNTED — never the podium');
    const nq = await nodeOf(gq.code, gq.m, q.uid);
    ok(!nq || !nq.go, '… nothing of it is in the proof tree');
    const card = await Q.ev("(q => { const r = document.querySelector(q).getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right)]; })('.ff-again')");
    ok(card[0] >= 12 && card[1] <= 378, `its PLAY AGAIN bar lies inside the screen (${card.join(' … ')} of 390)`);
    ok(await Q.ev("!document.querySelector('.ff-share') && /BACK/.test(document.querySelector('.ff-city').textContent)"), '… its foot: PLAY AGAIN + the way out — no SHARE · SOON in the cartridge');
    await sleep(300);
    await Q.shot('f4a-cartridge-unproven.png');
    // PLAY AGAIN on that card = a NEW match (the fresh-eyes review: the spent match would stay uncounted for ever) — its own GO, PROVEN
    await Q.tap('.ff-again');
    ok(await Q.waitFor(`${S}.game && ${S}.game.id === 'freefall' && ${S}.game.matchId !== '${gq.m}' && ${S}.game.phase === 'play' && !!${G} && ${G}.state().matchId !== '${gq.m}' && !${ST}.state().started && ${ST}.state().info.frames > 3`, 40000), 'PLAY AGAIN on the NOT COUNTED card → the console starts a NEW match (back on THE OPENING)');
    await sleep(600);
    await Q.drag();
    ok(await Q.waitFor(`${G}.state().proven && ${G}.state().go > 0 && ${ST}.state().started && !${ST}.state().note`, 20000), '… and its first drag is PROVEN again: the next run can count');
    ok(Q.errs.length === 0, `no page errors${Q.errs.length ? ` (${Q.errs.slice(0, 3).join(' · ')})` : ''}`);
    await Q.close();
  }
} catch (e) { ok(false, `FATAL ${e && e.stack ? e.stack : e}`); }
await dbPut('testFreefallCounts', null);
await b.close();
console.log(`\n${n - fails.length}/${n} checks passed`);
if (fails.length) { console.log('FAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
