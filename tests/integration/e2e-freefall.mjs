// FREEFALL F4A — THE HIDDEN CARTRIDGE, end to end on the LOCAL EMULATORS (NEVER THE LIVE SITE): docs/freefall.md "THE CARTRIDGE" · "THE PROOF" · "THE SWITCH"
//   1. A STRANGER never sees it: no row on the PLAY shelf, PLAY NOW refuses it
//   2. THE OWNER'S LIVE TEST (the server's yes — on the emulators testAdmins/{pid}): PLAY → FREEFALL · TEST → its card → PLAY NOW → the game
//   3. THE FIRST DRAG → GO (the SERVER's time, read back) → the seed = hash(code + matchId + GO), tick 0 = GO + 600 ms; the run plays; the
//      proof node fills with server-stamped chunks of the packed input log; the end → `e` → the console's podium
//   4. THE SWITCH IS OFF: /api/report JUDGES the run — WOULD COUNT matches the phone's own result — and writes NOTHING (pstats, the
//      profile, the boards, results/ untouched)
//   5. PLAY AGAIN = the console's INSTANT AGAIN (a match of its own, back on THE OPENING, the scene kept warm)
//   6. THE HOLD in the cartridge: the page hidden mid-run → the hold goes up with the log; back → the way back is STAMPED by the server
//      (h/0), the run goes on 2.4 s after it; the judge accepts the held run whole
//   7. COUNTING ON (a test-only flip: testFreefallCounts): the floor, XP, the best on the board freefall-solo
//   8. an UNPROVEN run (the proof node refused — no GO): it plays on its own seed, says NOT COUNTED, ends on the stage's own card
//   node tests/integration/e2e-freefall.mjs "<chromium>" [outDir]
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { verifyRun } from '../../api/_lib/freefall.js';
import { logFromChunks, chunkTimes, stampsOf, START_LEAD_MS, RESUME_LEAD_MS } from '../../js/games/freefall/proof.js';
import { seedOf } from '../../js/games/freefall/logic.js';

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
/** play to `floor` with the checks' own hand, then onto the red (the run ends) → the page's own result */
async function playTo(P, floor) {
  await P.ev(`${ST}.auto = 'play'`);
  await P.waitFor(`${ST}.state().floor >= ${floor} || ${ST}.state().over`, 90000);
  await P.ev(`${ST}.auto = 'red'`);
  await P.waitFor(`${ST}.state().over`, 20000);
  return P.ev(`${ST}.result()`);
}

try {
  await dbPut('testFreefallCounts', null);
  // ---- 1. nobody but the owner ever sees it
  const P = await phone(`ff${Date.now() % 100000}`);
  const { uid, pid } = await pidOf(P);
  ok(!!pid, 'the phone has its profile');
  ok(await P.ev("import('/js/config.js').then(c => !c.isPlayable('freefall') && !c.isOwnerTest('freefall') && c.GAMES.some(g => g.id === 'freefall' && g.preview && !g.playable))"), 'a stranger: FREEFALL is a game BEING BUILT — not playable, never a TEST');
  await P.tap('.nd-tab-play');
  ok(await P.waitFor("!!document.querySelector('.nd-shelf-sheet.is-in .nd-shelf-row')", 6000), 'a stranger: the dock\'s PLAY opens THE GAMES SHELF');
  ok(await P.ev("import('/js/config.js').then(c => !document.querySelector('.nd-shelf-row[data-game=\"freefall\"]') && document.querySelectorAll('.nd-shelf-row').length === c.GAMES.filter(g => g.playable).length && !/FREEFALL/i.test(document.querySelector('.nd-shelf-sheet').textContent))"), '… the playable games — NO FREEFALL anywhere on it');
  ok(await P.ev("import('/js/host.js').then(m => m.playSolo('freefall'))") === false && !(await P.ev(`${S}.code`)), '… and PLAY NOW refuses it: nobody else can start it');
  ok(await P.ev("!/FREEFALL|freefall/i.test(document.body.innerText)"), '… nothing on the city\'s screen names it');

  // ---- 2. THE OWNER'S LIVE TEST: the server's own yes → FREEFALL · TEST on the shelf → its card → PLAY NOW
  await dbPut(`testAdmins/${pid}`, true);
  await P.ev('sessionStorage.clear()');   // (the gate remembers a NO for the tab: this tab was a stranger a moment ago)
  await P.open();
  ok(await P.waitFor("import('/js/config.js').then(c => c.isOwnerTest('freefall'))", 20000), 'THE OWNER\'s phone: the server\'s yes arrives (the radio gate) → FREEFALL is his to test');
  await P.tap('.nd-tab-play');
  ok(await P.waitFor("!!document.querySelector('.nd-shelf-sheet.is-in .nd-shelf-row[data-game=\"freefall\"]')", 6000), 'PLAY → the shelf lists FREEFALL');
  ok(/FREEFALL · TEST/.test(await P.ev("document.querySelector('.nd-shelf-row[data-game=\"freefall\"]').textContent")), '… marked · TEST');
  await P.shot('f4a-owner-shelf.png');
  await sleep(450);   // (the shelf sheet's first moment drops a tap)
  await P.tap('.nd-shelf-row[data-game="freefall"]');
  ok(await P.waitFor("!!document.querySelector('.nd-card-sheet.is-in .nd-card[data-game=\"freefall\"] .nd-card-solo')", 8000), 'its row → THE GAME CARD with PLAY NOW');
  await P.shot('f4a-owner-card.png');
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
  const before = await snap(pid);
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
  ok(fin.t === 'HIT THE RED' && fin.n === String(res1.floor) && /FREE\s*FALL/.test(fin.kicker) && /PLAY AGAIN/.test(fin.bar || ''), `the podium: ${fin.t} · ${fin.n} FLOORS · ${fin.kicker} · ${String(fin.bar).trim()}`);

  // ---- 4. THE SWITCH IS OFF: judged, WOULD COUNT, nothing written
  ok(await P.waitFor("/^WOULD (NOT )?COUNT/.test(document.querySelector('.ff-fin-would').textContent)", 20000), 'the server\'s answer arrives: the would-be line');
  const would = await P.ev("document.querySelector('.ff-fin-would').textContent");
  ok(new RegExp(`^WOULD COUNT · FLOOR ${res1.floor} · \\+\\d+ XP`).test(would), `THE SWITCH is OFF: "${would}" — the server's own floor = the phone's`);
  await sleep(400);
  await P.shot('f4a-cartridge-end-would-count.png');
  await sleep(1200);
  ok(await snap(pid) === before, '… and NOTHING was written: pstats, the profile, the board freefall-solo, ppriv, results/ are as before');

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
  ok(await P.waitFor(`/^WOULD COUNT · FLOOR ${res6.floor} /.test(document.querySelector('.ff-fin-would').textContent)`, 20000), `… and the server says so: "${await P.ev("document.querySelector('.ff-fin-would').textContent")}"`);
  ok(await snap(pid) === before, '… still nothing written');

  // ---- 7. COUNTING ON (the test-only flip)
  await dbPut('testFreefallCounts', true);
  await again(P);
  await P.waitFor(`${S}.game && ${S}.game.matchId !== '${g2.m}' && ${S}.game.phase === 'play' && !${ST}.state().started`, 15000);
  const g3 = await P.ev(`({ code: ${S}.code, m: ${S}.game.matchId })`);
  await sleep(500);
  await P.drag();
  await P.waitFor(`${G}.state().proven && ${ST}.state().started`, 15000);
  const res7 = await playTo(P, 8);
  ok(await toFinal(P), 'COUNTING ON: a run → the podium');
  const end7 = Date.now() + 25000; let done = null;
  while (Date.now() < end7 && !(done && done.st === 'done')) { done = await dbGet(`results/${g3.code}_${g3.m}`); await sleep(200); }
  ok(done && done.st === 'done' && done.g === 'freefall', 'COUNTING ON: the run is COUNTED (results/ done)');
  const stats = await dbGet(`pstats/${pid}`), o7 = done && done.o && done.o[pid];
  ok(o7 && o7.xp && o7.xp.gain > 0 && stats.xp === o7.xp.to, `… XP +${o7 && o7.xp && o7.xp.gain}`);
  ok(stats && stats.b && stats.b['freefall-solo'] && stats.b['freefall-solo'].a === res7.floor, `… the best: floor ${res7.floor} on the board freefall-solo (the server's replay)`);
  ok(stats && stats.av && stats.av['freefall-solo'] && stats.st && stats.st.n >= 1, '… the day row of THE AVERAGE written (pstats.av/freefall-solo — as on JAYWALK) + the streak day');
  await pastMoment(P);
  ok(await P.waitFor("/^(NEW BEST|YOUR BEST · \\d+)/.test(document.querySelector('.ff-fin .ff-ec-best').textContent) && !document.querySelector('.ff-fin-would').textContent", 15000), `… the end screen says ${await P.ev("document.querySelector('.ff-fin .ff-ec-best').textContent")} — no WOULD COUNT line`);
  await P.shot('f4a-cartridge-end-counted.png');
  await dbPut('testFreefallCounts', null);
  ok(P.errs.length === 0, `no page errors${P.errs.length ? ` (${P.errs.slice(0, 3).join(' · ')})` : ''}`);
  await P.close();

  // ---- 8. UNPROVEN: the proof node refused (the game the room plays is not FREEFALL to the rules: its phase is flipped under the page)
  {
    const Q = await phone(`fu${Date.now() % 100000}`, 'NOLINE');
    const q = await pidOf(Q);
    await dbPut(`testAdmins/${q.pid}`, true);
    await Q.ev('sessionStorage.clear()');
    await Q.open();
    await Q.waitFor("import('/js/config.js').then(c => c.isOwnerTest('freefall'))", 20000);
    ok(await Q.ev("import('/js/host.js').then(m => m.playSolo('freefall'))") !== false, 'the owner\'s PLAY NOW starts it');
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
    await sleep(300);
    await Q.shot('f4a-cartridge-unproven.png');
    ok(Q.errs.length === 0, `no page errors${Q.errs.length ? ` (${Q.errs.slice(0, 3).join(' · ')})` : ''}`);
    await Q.close();
  }
} catch (e) { ok(false, `FATAL ${e && e.stack ? e.stack : e}`); }
await dbPut('testFreefallCounts', null);
await b.close();
console.log(`\n${n - fails.length}/${n} checks passed`);
if (fails.length) { console.log('FAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
