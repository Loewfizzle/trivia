// HIGH RISE S4A — THE HIDDEN CARTRIDGE, end to end on the LOCAL EMULATORS (NEVER THE LIVE SITE): docs/highrise.md "THE CARTRIDGE" · "THE PROOF" · "THE SWITCH"
//   1. A STRANGER never sees it: no row on the PLAY shelf, PLAY NOW refuses it (COMING SOON)
//   2. THE OWNER'S LIVE TEST (the server's yes — on the emulators testAdmins/{pid}): PLAY → HIGH RISE · TEST → its card → PLAY NOW → the game
//   3. START → GO (the SERVER's time, read back) → the seed = hash(code + matchId + GO); REAL TAPS drop slabs; the proof node fills with
//      server-stamped chunks; the run HOLDS THE AUDIO CONTEXT AWAKE (music off); THE FUSE ends it → `e` → the console's podium
//   4. THE SWITCH IS OFF: /api/report JUDGES the run — WOULD COUNT matches the phone's own result — and writes NOTHING (pstats, the
//      profile, the boards, results/ untouched)
//   5. PLAY AGAIN = the console's INSTANT AGAIN (the next run starts with no tap, the scene kept warm) · THE NEXT FRIEND's pink tag + tape
//      (a test fixture: none while counting is OFF) · a FORGED node is refused
//   6. COUNTING ON (a test-only flip: testHighriseCounts): a real run past floor 60 → the floor, XP, the streak, the best (the board
//      highrise-solo), ABOVE THE CLOUDS — and THE HITCH RUN inside the cartridge (no frame over 33 ms after the first second)
//   node tests/integration/e2e-highrise.mjs "<chromium>" [outDir] [--fast]     (`--fast` skips step 6's long run)
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { flashWatch } from './kit/flash-watch.mjs';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { verifyNode } from '../../api/_lib/highrise.js';
import { tapsFromChunks, chunkTimes, packFrom } from '../../js/games/highrise/proof.js';
import { seedOf, floorOf, perfectsOf } from '../../js/games/highrise/logic.js';
import { createRun, stepTo, tap as engineTap } from '../../js/games/highrise/engine.js';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const argv = process.argv.slice(2), FAST = argv.includes('--fast') || process.env.FAST === '1', OUT = argv.slice(1).find(a => !a.startsWith('--')) || null;
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
const S = 'window.__arcade.state', G = 'window.__hiGame', ST = 'window.__hiStage';

async function phone(slot, name = 'STACKER') {
  const ctx = await b.createBrowserContext();
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e.message || e)));
  if (process.env.HI_DEBUG) p.on('console', m => console.log(`   [${m.type()}] ${m.text().slice(0, 240)}`));
  const cdp = await p.createCDPSession();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  // (MUSIC OFF — the owner's own setting: PODCAST MODE — the sound sync's case)
  await p.evaluateOnNewDocument(s => { try { localStorage.setItem('nd:entered', '1'); localStorage.setItem(`na:${s[0]}:profile`, JSON.stringify({ name: s[1], color: 'cyan', avatar: 'bolt' })); localStorage.setItem('na:settings', JSON.stringify({ musicOff: true })); localStorage.setItem('ns:look', s[2]); } catch { /* fine */ } }, [slot, name, process.env.HI_LOOK === 'day' ? 'day' : 'night']);   // (the console's GAME LOOK: NIGHT unless HI_LOOK=day — the shots in both looks)
  const waitFor = async (js, ms = 20000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* navigating */ } await sleep(50); } return false; };
  const open = async () => { await p.goto(guardUrl(`${BASE}/?emu&slot=${slot}&city=2&when=2026-11-10T20:30`, 'e2e-highrise.mjs'), { waitUntil: 'domcontentloaded' }); if (!await waitFor(UP, 60000)) throw new Error('the city never came up'); };
  await open();
  const ev = js => p.evaluate(js);
  const tap = async sel => { const r = await p.evaluate(q => { const el = document.querySelector(q); if (!el) return null; const x = el.getBoundingClientRect(); return [x.left + x.width / 2, x.top + x.height / 2]; }, sel); if (!r) return null; await p.touchscreen.tap(r[0], r[1]); return r; };
  const tapAt = async (x, y) => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1, radiusX: 4, radiusY: 4, force: 1 }] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
  const shot = async name => { if (OUT) await p.screenshot({ path: join(OUT, name) }); };
  return { p, cdp, ev, waitFor, open, tap, tapAt, shot, errs, close: () => ctx.close() };
}
const pidOf = async P => { const uid = await P.ev(`${S}.uid`); for (let i = 0; i < 60; i++) { const pid = await dbGet(`uids/${uid}`); if (pid) return { uid, pid }; await sleep(250); } return { uid, pid: null }; };
const nodeOf = (code, m, uid) => dbGet(`rooms/${code}/hr/${m}/${uid}`);
/** wait IN THE PAGE until the sliding slab is `lead` ms before dead on → 'go' | 'over' | 'timeout' */
const atPerfect = (P, lead) => P.p.evaluate(ld => new Promise(res => {
  const t0 = performance.now();
  (function poll() { const L = window.__hiStage; if (L.state().over) return res('over'); const m = L.msToPerfect(); if (m != null && m <= ld) return res('go'); if (performance.now() - t0 > 9000) return res('timeout'); setTimeout(poll, m != null && m - ld > 12 ? Math.min(40, m - ld - 6) : 1); })();
}), lead);
/** `k` REAL taps (CDP touches), each at the slab's perfect moment (`early(i)` ms before it: a cut) */
async function drops(P, k, early = () => 20) { let d = 0; for (let i = 0; i < k; i++) { if (await atPerfect(P, early(i)) !== 'go') break; await P.tapAt(195, 620); d++; await sleep(240); } return d; }
/** a run to floor `to` by a bot INSIDE the page (a pointerdown on the play area at each slab's perfect moment — the touch path's own handler) */
const botTo = (P, to) => P.p.evaluate(target => new Promise(res => {
  const L = window.__hiStage, play = document.querySelector('.hi-play'), t0 = performance.now();
  (function poll() {
    const s = L.state();
    if (s.over || s.floor >= target || performance.now() - t0 > 240000) return res(s.floor);
    const m = L.msToPerfect();
    if (m != null && m <= 5) { play.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', pointerId: 7 })); return setTimeout(poll, 150); }
    setTimeout(poll, m != null && m > 14 ? Math.min(30, m - 8) : 1);
  })();
}), to);
const toFinal = (P, ms = 30000) => P.waitFor(`${S}.game && ${S}.game.phase === 'final' && !!document.querySelector('.hi-final .hi-fin .hi-ec-cause')`, ms);
const audio = P => P.ev("import('/js/audio/engine.js').then(E => E.audioHealth())");
const snap = async pid => JSON.stringify([await dbGet(`pstats/${pid}`), await dbGet(`profiles/${pid}`), await dbGet('lb/highrise-solo'), await dbGet(`ppriv/${pid}`)]);
/** the console's END-OF-ROUND MOMENT (a run that paid XP): waited out / continued */
const pastMoment = async P => {
  for (let i = 0; i < 30 && !(await P.ev("!!document.querySelector('.pg-moment')")); i++) await sleep(200);
  for (let i = 0; i < 10 && await P.ev("!!document.querySelector('.pg-moment')"); i++) {
    await P.ev("(() => { const m = document.querySelector('.pg-moment'), b = m && m.querySelector('.pg-btn'); if (b && m.classList.contains('is-end')) b.click(); else if (m) m.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); })()");
    await sleep(700);
  }
};

try {
  await dbPut('testHighriseCounts', null);
  // ---- 1. nobody but the owner ever sees it
  const P = await phone(`hi${Date.now() % 100000}`);
  const { uid, pid } = await pidOf(P);
  ok(!!pid, 'the phone has its profile');
  ok(await P.ev("import('/js/config.js').then(c => !c.isPlayable('highrise') && !c.isOwnerTest('highrise') && c.GAMES.some(g => g.id === 'highrise' && g.preview && !g.playable))"), 'a stranger: HIGH RISE is a game BEING BUILT — not playable, never a TEST');
  await P.tap('.nd-tab-play');
  ok(await P.waitFor("!!document.querySelector('.nd-shelf-sheet.is-in .nd-shelf-row')", 6000), 'a stranger: the dock\'s PLAY opens THE GAMES SHELF');
  ok(await P.ev("!document.querySelector('.nd-shelf-row[data-game=\"highrise\"]') && document.querySelectorAll('.nd-shelf-row').length === 4 && !/HIGH RISE/i.test(document.querySelector('.nd-shelf-sheet').textContent)"), '… the four playable games — NO HIGH RISE anywhere on it');
  ok(await P.ev("import('/js/host.js').then(m => m.playSolo('highrise'))") === false && !(await P.ev(`${S}.code`)), '… and PLAY NOW refuses it (COMING SOON): nobody else can start it');
  ok(await P.ev("!/HIGH RISE|highrise/i.test(document.body.innerText)"), '… nothing on the city\'s screen names it');

  // ---- 2. THE OWNER'S LIVE TEST: the server's own yes → HIGH RISE · TEST on the shelf → its card → PLAY NOW
  await dbPut(`testAdmins/${pid}`, true);
  await P.ev('sessionStorage.clear()');   // (the gate remembers a NO for the tab: this tab was a stranger a moment ago)
  await P.open();
  ok(await P.waitFor("import('/js/config.js').then(c => c.isOwnerTest('highrise'))", 20000), 'THE OWNER\'s phone: the server\'s yes arrives (the radio gate) → HIGH RISE is his to test');
  await P.tap('.nd-tab-play');
  ok(await P.waitFor("!!document.querySelector('.nd-shelf-sheet.is-in .nd-shelf-row[data-game=\"highrise\"]')", 6000), 'PLAY → the shelf lists HIGH RISE');
  ok(/HIGH RISE · TEST/.test(await P.ev("document.querySelector('.nd-shelf-row[data-game=\"highrise\"]').textContent")), '… marked · TEST');
  await P.shot('owner-shelf.png');
  await P.tap('.nd-shelf-row[data-game="highrise"]');
  ok(await P.waitFor("!!document.querySelector('.nd-card-sheet.is-in .nd-card[data-game=\"highrise\"] .nd-card-solo')", 8000), 'its row → THE GAME CARD with PLAY NOW');
  await P.shot('owner-card.png');
  await sleep(450);   // (a tap in the card sheet's first moment is dropped — its opening guard; with no outDir there is no shot to wait on)
  const tPlay = Date.now();
  await P.tap('.nd-card-solo');
  ok(await P.waitFor(`${S}.game && ${S}.game.id === 'highrise' && !!document.querySelector('.hi-stage.hi-game canvas.hi-canvas') && !!${G} && ${ST}.state().info.warmed > 0`, 30000), `PLAY NOW → the game's own screen: the stage in the console's frame (${Date.now() - tPlay} ms from the tap — THE SOLO START's walk inside)`);
  let g = await P.ev(`({ code: ${S}.code, m: ${S}.game.matchId, mode: ${S}.game.mode, phase: ${S}.game.phase, hostSeed: ${S}.game.seed, solo: !!(${S}.meta.settings && ${S}.meta.settings.solo && ${S}.meta.settings.solo.on) })`);
  ok(g.mode === 'solo' && g.phase === 'play' && g.m[0] === 's', `PLAY NOW's solo room, SOLO, playing (match ${g.m})`);
  ok(await P.ev("!!document.querySelector('.menu-btn') && !!document.querySelector('.music-btn') && !document.querySelector('.hi-snd') && !document.querySelector('.hi-note') && !document.querySelector('.hi-look')"), 'inside the console\'s game frame: the corner menu + music — none of the test page\'s own pieces (SOUNDS · the note · the look switch)');
  ok(await P.ev(`${ST}.state().look === document.body.dataset.look`), 'the look = the console\'s GAME LOOK (body[data-look])');
  ok(await P.ev(`${G}.state().friends.length === 0 && !${ST}.state().ftag`), 'THE NEXT FRIEND: none (counting is OFF — the board has no rows)');
  await P.shot('start.png');

  // ---- 3. START → GO → the seed; real taps → the proof
  const before = await snap(pid);
  await P.tapAt(195, 620);
  ok(await P.waitFor(`${ST}.state().started && ${G}.state().proven`, 8000), 'START → GO landed: the run is on, PROVEN');
  let node = await nodeOf(g.code, g.m, uid), gs = await P.ev(`${G}.state()`);
  const srv = await P.ev("import('/js/firebase.js').then(f => f.serverNow())");
  ok(node && typeof node.go === 'number' && Math.abs(node.go - srv) < 15000 && gs.go === node.go, `the proof node's GO = the SERVER's time (${node && node.go}), read back by the phone`);
  ok(gs.stage.seed === seedOf(g.code, g.m, node.go) && gs.stage.seed !== g.hostSeed, `THE SEED IS PICKED AFTER GO: hash(code + matchId + GO) = ${gs.stage.seed} — never the host's own (${g.hostSeed})`);
  ok(await P.ev(`import('/js/firebase.js').then(f => f.set(f.dbRef('rooms/' + ${S}.code + '/hr/' + ${S}.game.matchId + '/' + ${S}.uid + '/go'), f.serverTimestamp()).then(() => false, () => true))`), '… GO is written once (a second one is refused)');
  const a0 = await audio(P);
  const d1 = await drops(P, 9, i => (i % 4 === 3 ? 95 : 20));
  await sleep(1300);
  const a1 = await audio(P);
  gs = await P.ev(`${G}.state()`); node = await nodeOf(g.code, g.m, uid);
  const chunks = Object.values(node.c || {}), log = tapsFromChunks(node.c), mine = await P.ev(`${ST}.taps().slice()`);
  ok(d1 >= 8 && gs.stage.floor >= 6, `${d1} REAL taps dropped ${gs.stage.floor} floors (${gs.stage.perfects} perfect)`);
  ok(chunks.length >= 3 && chunks.every(c => typeof c.s === 'string' && Math.abs(c.at - srv) < 60000), `the proof: ${chunks.length} chunks, each stamped by the SERVER`);
  ok(log && JSON.stringify(log) === JSON.stringify(mine.slice(0, log.length)) && log.length >= mine.length - 1, `the chunks joined = the phone's own tap log (${log && log.length} of ${mine.length} taps up)`);
  ok(a1.held && a1.state === 'running' && a1.podcast && a1.naps === a0.naps, `THE SOUND SYNC in the cartridge (MUSIC OFF): the run HOLDS the context awake — running, ${a1.naps - a0.naps} naps`);
  ok(gs.stage.lates === 0, 'no sound took the late path in play');
  await P.shot('run.png');

  // ---- the fuse ends it → e → the podium; THE SWITCH IS OFF → WOULD COUNT, nothing written
  // (S4A FIX — THE PINK FLASH, the owner's iPhone: every frame the browser presents from the last seconds of the run to the settled end
  //  screen — the console's podium frame flashed the game's accent, hot pink, over the whole screen as it came up)
  const fw = await flashWatch(b, P.cdp);
  ok(await toFinal(P), 'THE FUSE ends the run → `e` → the host\'s step → the console\'s podium frame');
  await sleep(3900);   // (the console CROWNS its podium frame 2.5 s after it stands — that was the flash: its ::before, the accent at 55 %, over the whole screen)
  const fl = await fw.stop({ settle: 400 });
  ok(fl.frames >= 20 && fl.flash.length === 0, `NO PINK FLASH as the end screen comes up: ${fl.frames} frames over ${fl.ms} ms — the pinkest ${fl.worst ? `${(fl.worst.pink * 100).toFixed(0)} % of the screen at ${fl.worst.t} ms` : '—'} (before ${(fl.before * 100).toFixed(0)} %, settled ${(fl.after * 100).toFixed(0)} %)${fl.flash.length ? ` — FLASH: ${fl.flash.slice(0, 4).map(f => `${(f.pink * 100).toFixed(0)} % at ${f.t} ms`).join(' · ')}` : ''}`);
  node = await nodeOf(g.code, g.m, uid);
  const game = await dbGet(`rooms/${g.code}/game`), mineRes = await P.ev(`${ST}.result()`), row = game.results[uid];
  ok(node.e && node.e.f === mineRes.floor && node.e.w === 'slow', `the end marker: floor ${node.e && node.e.f}, TOO SLOW`);
  const V = verifyNode({ code: g.code, matchId: g.m, node });
  ok(V.ok && V.floor === mineRes.floor && V.perfects === mineRes.perfects && V.tick === mineRes.tick && V.cause === mineRes.cause, `THE JUDGE's replay of the node == the phone's own run (floor ${V.floor} · ${V.perfects} perfects · tick ${V.tick} · ${V.cause})`);
  ok(row && row.f === V.floor && row.p === V.perfects && !row.bad, 'the host\'s podium row = the judge\'s');
  const times = chunkTimes(node.c);
  ok(times && times.every(k => k.at >= node.go), 'the chunks\' clock runs forward from GO');
  ok(await P.waitFor("/^WOULD COUNT · FLOOR \\d+ · \\+\\d+ XP/.test((document.querySelector('.hi-fin-would') || {}).textContent || '')", 20000), 'THE SWITCH IS OFF: the server judged the run → the end card\'s small line WOULD COUNT');
  const fin = await P.ev("({ t: document.querySelector('.hi-fin .hi-ec-cause').textContent, n: document.querySelector('.hi-fin .hi-ec-n').getAttribute('aria-label'), w: document.querySelector('.hi-fin-would').textContent, kicker: document.querySelector('.hi-final .sheet-kicker').textContent, bar: !!document.querySelector('.hi-final .final-bar, .hi-final .btn-primary') })");
  ok(fin.t === 'TOO SLOW' && Number(fin.n) === V.floor && fin.kicker === 'HIGH RISE · SOLO', `the end screen: ${fin.kicker} · ${fin.t} · FLOOR ${fin.n}`);
  ok(new RegExp(`^WOULD COUNT · FLOOR ${V.floor} · `).test(fin.w), `WOULD COUNT matches the phone's own result (${fin.w})`);
  ok(await P.ev("document.querySelector('.hi-fin .hi-ec-col.is-best .hi-ec-k').textContent === 'NEW BEST' && document.querySelector('.hi-fin .hi-ec-col.is-best').classList.contains('is-new')"), 'the end screen: NEW BEST (this phone’s own record while counting is OFF — stored before the screen was built)');
  await sleep(1200);
  await P.shot('end-card-390x844.png');
  ok((await dbGet(`results/${g.code}_${g.m}`)) == null, 'counting OFF: no results/ record');
  ok((await snap(pid)) === before, 'counting OFF: NOTHING written — pstats, the profile, the board highrise-solo, the private profile all untouched');

  // ---- 5. PLAY AGAIN = THE INSTANT AGAIN: the next run starts with no tap; THE NEXT FRIEND (a fixture); then a FORGED node
  const scenes0 = await P.ev(`${ST}.state().rebuilds`);
  const fw2 = await flashWatch(b, P.cdp);
  await P.ev("(() => { const b = document.querySelector('.hi-final .final-bar') || [...document.querySelectorAll('.hi-final button')].find(x => /PLAY AGAIN/.test(x.textContent)); b.click(); })()");
  ok(await P.waitFor(`${S}.game && ${S}.game.matchId !== '${g.m}' && ${S}.game.phase === 'play' && !!${G} && ${ST}.state().started && ${G}.state().proven`, 15000), 'PLAY AGAIN → the next run, a match of its own — started at once (no START tap), PROVEN');
  await sleep(900);
  const fl2 = await fw2.stop();
  ok(fl2.frames >= 10 && fl2.flash.length === 0, `… and none at PLAY AGAIN, into the next start (${fl2.frames} frames; the pinkest ${fl2.worst ? `${(fl2.worst.pink * 100).toFixed(0)} %` : '—'}, before ${(fl2.before * 100).toFixed(0)} %, settled ${(fl2.after * 100).toFixed(0)} %)`);
  const g2 = await P.ev(`({ code: ${S}.code, m: ${S}.game.matchId })`);
  ok(await P.ev(`!document.querySelector('.hi-final') && ${ST}.state().floor === 0 && ${ST}.state().rebuilds === ${scenes0}`), '… the podium is gone, a fresh tower, the SAME scene (kept warm — never rebuilt)');
  ok(!!(await nodeOf(g.code, g.m, uid)), '… and the finished run\'s proof node is still in the room');
  // THE NEXT FRIEND (a test fixture — YOUR TABLE is empty while counting is OFF): the pink tag above you → crossed → the pink tape
  await P.ev(`${G}.setFriends([{ n: 'LIAM', v: 3 }, { n: 'MAYA', v: 7 }])`);
  ok(await P.waitFor(`/^LIAM 3 ▲\\d$/.test(${ST}.state().ftag) || ${ST}.state().ftag === 'LIAM 3 · ONE MORE'`, 4000), `THE NEXT FRIEND above you: the pink tag "${await P.ev(`${ST}.state().ftag`)}"`);
  await sleep(900);   // (S4A FIX: a tag is placed once a landing and rides to its place on a 0.56 s transition — measured once it rests)
  const zone = await P.ev(`(() => { const t = document.querySelector('.hi-ftag').getBoundingClientRect(), s = document.querySelector('.hi-stage').getBoundingClientRect(); return { y: t.top + t.height / 2, right: Math.round(s.right - t.right), zone: ${ST}.view.zoneTop() * s.height, pink: getComputedStyle(document.querySelector('.hi-ftag')).boxShadow, core: getComputedStyle(document.querySelector('.hi-ftag')).borderLeftColor }; })()`);
  const order = await P.ev("(() => { const f = document.querySelector('.hi-ftag'), g = document.querySelector('.hi-tag:not(.hi-ftag)'); return g.hidden ? null : { f: f.getBoundingClientRect().top, g: g.getBoundingClientRect().top, t: g.textContent }; })()");
  await sleep(120);
  const order2 = await P.ev("(() => { const f = document.querySelector('.hi-ftag'), g = document.querySelector('.hi-tag:not(.hi-ftag)'); return g.hidden ? null : { f: f.getBoundingClientRect().top, g: g.getBoundingClientRect().top, t: g.textContent }; })()");
  ok(!!order2 && order2.f - order2.g >= 28, `the two tags keep the floors' order: LIAM 3 sits UNDER ${order2 && order2.t} (${order2 && (order2.f - order2.g).toFixed(0)} px apart)${order ? '' : ''}`);
  ok(zone.right === 0 && zone.y < zone.zone && /255, 79, 216/.test(zone.pink) && zone.core === 'rgb(255, 255, 255)', `… at the right edge, in PINK round a WHITE core, above THE DROP ZONE (y ${zone.y.toFixed(0)} < ${zone.zone.toFixed(0)})`);
  await drops(P, 5);
  ok(await P.waitFor(`${ST}.state().friendTape === 3 && /^MAYA 7/.test(${ST}.state().ftag)`, 6000), 'crossing LIAM\'s floor → the pink tape lies on the tower at floor 3 — and the next friend (MAYA) takes the tag');
  await P.shot('pink-tape-390x844.png');
  await drops(P, 4);
  await sleep(500);
  await P.shot('pink-tape-2-390x844.png');
  ok(await toFinal(P), 'the run ends → the podium');
  // A FORGED NODE: the next run's node written whole — a perfect 150-floor log "played" in two seconds
  await P.ev("(() => { const b = document.querySelector('.hi-final .final-bar') || [...document.querySelectorAll('.hi-final button')].find(x => /PLAY AGAIN/.test(x.textContent)); b.click(); })()");
  await P.waitFor(`${S}.game && ${S}.game.matchId !== '${g2.m}' && ${S}.game.phase === 'play' && ${G}.state().proven`, 15000);
  const g3 = await P.ev(`({ code: ${S}.code, m: ${S}.game.matchId })`);
  const real = await nodeOf(g3.code, g3.m, uid), seed3 = seedOf(g3.code, g3.m, real.go), run = createRun({ seed: seed3, mode: 'solo' }), forged = [];
  for (let i = 0; i < 150; i++) { stepTo(run, run.s0); const tk = run.s0 + Math.floor(run.S / 2); if (engineTap(run, tk)) forged.push(tk); }
  await dbPut(`rooms/${g3.code}/hr/${g3.m}/${uid}/c`, { 0: { s: packFrom(forged, 0, 150), at: real.go + 2000 } });
  await dbPut(`rooms/${g3.code}/hr/${g3.m}/${uid}/e`, { f: 150, t: forged[149], w: 'miss' });
  ok(await toFinal(P, 20000), 'a FORGED node (150 perfect floors "played" in 2 s): the match ends on its `e`');
  const fg = await dbGet(`rooms/${g3.code}/game`);
  ok(fg.results[uid].f === 0 && /ahead/.test(fg.results[uid].bad || ''), `… THE JUDGE refuses it (${fg.results[uid].bad}) — floor 0, never 150`);
  ok(await P.waitFor("/^WOULD NOT COUNT/.test((document.querySelector('.hi-fin-would') || {}).textContent || '') || document.querySelector('.hi-fin .hi-ec-cause').textContent === 'NOT COUNTED'", 15000), `… and the server says so (${await P.ev("document.querySelector('.hi-fin .hi-ec-cause').textContent + ' · ' + document.querySelector('.hi-fin-would').textContent")})`);
  ok((await snap(pid)) === before, '… still nothing written');

  // ---- 6. COUNTING ON (a test-only flip): a real run past floor 60 → the floor, XP, the streak, the best, ABOVE THE CLOUDS + THE HITCH RUN
  if (!FAST) {
    await dbPut('testHighriseCounts', true);
    await P.ev("(() => { const b = document.querySelector('.hi-final .final-bar') || [...document.querySelectorAll('.hi-final button')].find(x => /PLAY AGAIN/.test(x.textContent)); b.click(); })()");
    await P.waitFor(`${S}.game && ${S}.game.matchId !== '${g3.m}' && ${S}.game.phase === 'play' && ${G}.state().proven`, 15000);
    const g4 = await P.ev(`({ code: ${S}.code, m: ${S}.game.matchId })`);
    const h0 = (await P.ev(`${ST}.hitches()`)).list.length;   // (the earlier runs' own: this check's screenshots stall a frame)
    const top = await botTo(P, 63);
    const hit = await P.ev(`${ST}.hitches()`), a4 = await audio(P);
    ok(top >= 63, `a real run by taps at the touch path: floor ${top}`);
    // (headless Chromium's own ~0.65 s stall two minutes after launch is not the game's — a frame that long, with no mark of the page's
    //  own work on it, is the browser's: S4A FIX's honest counter names it `unknown` — or `gc`, if a collection is known to have run in it)
    const mine = hit.list.slice(h0), bad = mine.filter(h => !((h.why === 'gc' || h.why === 'unknown') && h.gap > 400 && h.work < 12));
    ok(bad.length === 0, `THE HITCH RUN inside the cartridge (${top} floors, ~75 s): no frame over 33 ms after the first second (${bad.length} hitches${mine.length ? ` — seen: ${mine.map(h => `${h.why} ${h.gap} ms @${h.floor}`).join(' · ')}${mine.length > bad.length ? ' (the long one = headless Chromium, not the game)' : ''}` : ''})`);
    ok(a4.held && a4.state === 'running', 'the run holds the audio context awake to the end');
    ok(await toFinal(P, 30000), 'the fuse ends it → the podium');
    const end = Date.now() + 25000; let res = null;
    while (Date.now() < end && !(res && res.st === 'done')) { res = await dbGet(`results/${g4.code}_${g4.m}`); await sleep(200); }
    ok(res && res.st === 'done' && res.g === 'highrise', 'COUNTING ON: the run is COUNTED (results/ done)');
    const ps = await dbGet(`pstats/${pid}`), bestV = ps && ps.b && ps.b['highrise-solo'] ? ps.b['highrise-solo'].a : null;
    const o = res.o && res.o[pid];
    ok(o && o.xp && o.xp.gain > 0 && ps.xp === o.xp.to, `… XP +${o && o.xp && o.xp.gain}`);
    ok(ps.st && ps.st.n >= 1 && o.streak >= 1, `… the streak day counted (${o && o.streak})`);
    ok(floorOf(bestV) === top + 0 || floorOf(bestV) >= 63, `… the best: floor ${floorOf(bestV)} (${perfectsOf(bestV)} perfects) on the board highrise-solo`);
    ok(ps.pa && ps.pa.gf && ps.pa.gf['highrise-clouds'] === 1 && !ps.pa.gf['highrise-top'], '… the feat flag `clouds` from the server\'s replay (never `top`)');
    ok(ps.it && !!ps.it['card-abovetheclouds'] && (o.ach || []).includes('above-the-clouds') && !ps.it['card-topoftheworld'], `… ABOVE THE CLOUDS awarded (the card + its achievement) — TOP OF THE WORLD not (items ${Object.keys(ps.it || {}).filter(k => /^card-/.test(k)).join(' ')} · ach ${(o.ach || []).join(' ')})`);
    await pastMoment(P);
    ok(await P.waitFor("/^NEW BEST/.test(document.querySelector('.hi-fin .hi-ec-col.is-best').textContent) && !document.querySelector('.hi-fin-would').textContent", 15000), `… the end screen says ${await P.ev("document.querySelector('.hi-fin .hi-ec-col.is-best').textContent")} — no WOULD COUNT line`);
    await P.shot('end-card-counted-390x844.png');
    await dbPut('testHighriseCounts', null);
  }
  ok(P.errs.length === 0, `no page error (${P.errs.join(' | ')})`);
  await P.close();
} catch (e) { ok(false, `FATAL ${e && e.stack ? e.stack : e}`); }
await dbPut('testHighriseCounts', null);
await b.close();
console.log(`\n${n - fails.length}/${n} checks passed`);
if (fails.length) { console.log('FAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
