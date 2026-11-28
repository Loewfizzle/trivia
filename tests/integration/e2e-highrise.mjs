// HIGH RISE — PLAYABLE + COUNTING since THE GO-LIVE (Nov 20), end to end on the LOCAL EMULATORS (NEVER THE LIVE SITE): docs/highrise.md
// "THE CARTRIDGE" · "THE PROOF" · "THE SWITCH" (S4A's hidden-cartridge steps 1 + 2 + 4 rewritten to the playable, counting truth)
//   1. A STRANGER (no owner set-up): the PLAY shelf lists HIGH RISE — five rows, no · TEST, on TOP with NEW its first 14 days
//   2. its row → THE GAME CARD → PLAY NOW → the game
//   3. START → GO (the SERVER's time, read back) → the seed = hash(code + matchId + GO); REAL TAPS drop slabs; the proof node fills with
//      server-stamped chunks; the run HOLDS THE AUDIO CONTEXT AWAKE (music off); THE FUSE ends it → `e` → the console's podium
//   4. THE SWITCH IS ON: /api/report JUDGES the run from its proof node and COUNTS it (results/ done, the best on highrise-solo = the
//      judge's floor); the end screen says YOUR BEST from the server's record, no WOULD COUNT line; SHARE = the LINK (one upload)
//   5. PLAY AGAIN = the console's INSTANT AGAIN (the next run starts with no tap, the scene kept warm) · THE NEXT FRIEND's pink tag + tape
//      (a test fixture) · a FORGED node is refused — NOT COUNTED, no best of it
//   6. A LONG COUNTED RUN: a real run past floor 60 → the floor, XP, the streak, the best (the board
//      highrise-solo), ABOVE THE CLOUDS — and THE HITCH RUN inside the cartridge (no frame over 33 ms after the first second)
//   7. HIGH RISE PAD + GO — THE CONTROLLER: a fake pad drives a solo run (kit/highrise-pad.mjs; WebKit: wk-highrise-pad.mjs)
//   8. … THE SOLO GO: a GO answer 5.5 s late still PROVES + COUNTS; no answer at all → NOT COUNTED — NO CONNECTION on screen + the end card
//   node tests/integration/e2e-highrise.mjs "<chromium>" [outDir] [--fast]     (`--fast` skips step 6's long run)
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { flashWatch } from './kit/flash-watch.mjs';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { verifyNode } from '../../api/_lib/highrise.js';
import { tapsFromChunks, chunkTimes, packFrom } from '../../js/games/highrise/proof.js';
import { isNew, dayKeyOf } from '../../js/core/game-order.js';
import { streakDay } from '../../js/core/streak.js';
import { seedOf, floorOf, perfectsOf, towerScore } from '../../js/games/highrise/logic.js';
import { createRun, stepTo, tap as engineTap } from '../../js/games/highrise/engine.js';
import { padSoloCase } from './kit/highrise-pad.mjs';   // (HIGH RISE PAD + GO — THE CONTROLLER's checks, shared with wk-highrise-pad.mjs)
import { imgSize } from './kit/img-size.mjs';   // (THE FIX PASS: the link card is a JPEG since THE BEFORE-LAUNCH PASS)

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const argv = process.argv.slice(2), FAST = argv.includes('--fast') || process.env.FAST === '1', OUT = argv.slice(1).find(a => !a.startsWith('--')) || null;
// (S4B: `HI_UNTIL=table` stops after THE END SCREEN's checks + YOUR TABLE's fixtures · `S4B_OUT=<dir>` = their shots · `HI_LOOK=day` = by day)
const ONLY_NEW = process.env.HI_ONLY === 'padgo';
const S4B_OUT = process.env.S4B_OUT || null, LOOKN = process.env.HI_LOOK === 'day' ? 'day' : 'night';
if (S4B_OUT) mkdirSync(S4B_OUT, { recursive: true });
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
  // (THE CITY POLISH PASS — the FIX PASS's red: on the Beelink at 4× CPU the run reached floor 58 when a FIXED 240 s ran out — the bot now runs
  //  while the tower still climbs: it stops at the target, a top-out, or 45 s with no new floor (the page's protocolTimeout is 600 s))
  const L = window.__hiStage, play = document.querySelector('.hi-play'), t0 = performance.now();
  let lastF = -1, lastAt = t0;
  (function poll() {
    const s = L.state(), now = performance.now();
    if (s.floor !== lastF) { lastF = s.floor; lastAt = now; }
    if (s.over || s.floor >= target || now - lastAt > 45000 || now - t0 > 560000) return res(s.floor);
    const m = L.msToPerfect();
    if (m != null && m <= 5) { play.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', pointerId: 7 })); return setTimeout(poll, 150); }
    setTimeout(poll, m != null && m > 14 ? Math.min(30, m - 8) : 1);
  })();
}), to);
/** THE GO-LIVE — SHARE with counting ON (JAYWALK's machinery: e2e-jaywalk.mjs#shareLink): the share sheet stubbed → what was shared + its
 *  link's page + its picture (a tap whose activation the upload SPENT → SHARE reads lit; one more tap shares the link in its own gesture) */
async function shareLink(page, sel) {
  await page.evaluate(() => { window.__shared = []; navigator.share = async d => { window.__shared.push(d); }; navigator.canShare = () => true; });
  await page.evaluate(q => document.querySelector(q).click(), sel);
  let out = null, again = false;
  for (let i = 0; i < 120 && !(out && out.length); i++) {
    out = await page.evaluate(() => window.__shared);
    if (!(out && out.length)) {
      if (!again && await page.evaluate(q => { const b2 = document.querySelector(q); return !!b2 && b2.classList.contains('is-ready') && !b2.classList.contains('is-busy'); }, sel)) { again = true; await page.evaluate(q => document.querySelector(q).click(), sel); }
      await sleep(150);
    }
  }
  const d = (out && out[0]) || {}, url = d.url || '';
  const html = url ? await fetch(url, { redirect: 'manual' }).then(r => r.text()).catch(() => '') : '';
  const meta = k => (new RegExp(`<meta property="${k}" content="([^"]*)"`).exec(html) || [])[1] || '';
  const img = meta('og:image').replace(/&amp;/g, '&');
  const png = img ? Buffer.from(await fetch(img).then(r => r.arrayBuffer())) : Buffer.alloc(0);
  return { again, keys: Object.keys(d).sort(), url, files: (d.files || []).length, img, png: imgSize(png) };
}
/** (the emulator stays clean for the other suites: this phone's run cards removed) */
async function dropRunCards(pid) {
  await sleep(2500);
  const all = (await dbGet('shr')) || {};
  for (const [code, c] of Object.entries(all)) if (c && c.p === pid && c.k === 'run') { await dbPut(`shr/${code}`, null); if (c.d) await dbPut(`shrx/${c.d}/${code}`, null); }
  await dbPut(`shrp/${pid}:highrise`, null);
}
const counted = async (code, m, ms = 25000) => { const end = Date.now() + ms; while (Date.now() < end) { const r = await dbGet(`results/${code}_${m}`); if (r && r.st === 'done') return r; await sleep(200); } return null; };
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
  await dbPut('testHighriseCounts', null);   // (the code's own ON — never a flip a failed suite left behind)
  if (!ONLY_NEW) {   // (`HI_ONLY=padgo`: steps 7 + 8 alone — HIGH RISE PAD + GO's own, each on a new phone)
  // ---- 1. A STRANGER (THE GO-LIVE — HIGH RISE is playable for everyone): the PLAY shelf lists it, no · TEST, no owner set-up
  const P = await phone(`hi${Date.now() % 100000}`);
  const { uid, pid } = await pidOf(P);
  ok(!!pid, 'the phone has its profile');
  ok(await P.ev("import('/js/config.js').then(c => c.isPlayable('highrise') && !c.isOwnerTest('highrise') && c.GAMES.some(g => g.id === 'highrise' && g.playable && !g.preview))"), 'a stranger: HIGH RISE is PLAYABLE — never a TEST');
  await P.tap('.nd-tab-play');
  ok(await P.waitFor("!!document.querySelector('.nd-shelf-sheet.is-in .nd-shelf-row[data-game=\"highrise\"]')", 6000), 'a stranger: the dock\'s PLAY → THE GAMES SHELF lists HIGH RISE');
  const shelf = await P.ev("({ rows: [...document.querySelectorAll('.nd-shelf-sheet .nd-shelf-row')].map(r => r.dataset.game), hi: document.querySelector('.nd-shelf-row[data-game=\"highrise\"]').textContent, isNew: !!document.querySelector('.nd-shelf-row[data-game=\"highrise\"] .gm-new') })");
  ok(shelf.rows.length === 6 && !/TEST/.test(shelf.hi), `… six playable games (${shelf.rows.join(' · ')}) — HIGH RISE with no · TEST ("${shelf.hi.replace(/\s+/g, ' ').trim()}")`);   // (FREEFALL's GO-LIVE, Nov 28: six)
  const freshNow = isNew('2026-11-20', dayKeyOf(streakDay(Date.now())));
  // (FREEFALL's GO-LIVE: a NEWER game NEW too sits above it — the newest go-live first: FREEFALL from the 4 am line of Nov 28)
  const above = isNew('2026-11-28', dayKeyOf(streakDay(Date.now()))) ? 1 : 0;
  if (freshNow) ok(shelf.rows[above] === 'highrise' && shelf.isNew, `… on TOP with NEW (its first 14 days from its go-live, Nov 20): ${shelf.rows[0]}${shelf.isNew ? ' · NEW' : ''}`);
  else ok(!shelf.isNew, '… past its first 14 days: no NEW (the popularity order)');
  await P.shot('stranger-shelf.png');
  await sleep(450);   // (a tap in the shelf sheet's first moment is dropped — its opening guard)
  await P.tap('.nd-shelf-row[data-game="highrise"]');
  ok(await P.waitFor("!!document.querySelector('.nd-card-sheet.is-in .nd-card[data-game=\"highrise\"] .nd-card-solo')", 8000), 'its row → THE GAME CARD with PLAY NOW');
  await P.shot('stranger-card.png');
  await sleep(450);
  const tPlay = Date.now();
  await P.tap('.nd-card-solo');
  ok(await P.waitFor(`${S}.game && ${S}.game.id === 'highrise' && !!document.querySelector('.hi-stage.hi-game canvas.hi-canvas') && !!${G} && ${ST}.state().info.warmed > 0`, 30000), `PLAY NOW → the game's own screen: the stage in the console's frame (${Date.now() - tPlay} ms from the tap — THE SOLO START's walk inside)`);
  let g = await P.ev(`({ code: ${S}.code, m: ${S}.game.matchId, mode: ${S}.game.mode, phase: ${S}.game.phase, hostSeed: ${S}.game.seed, solo: !!(${S}.meta.settings && ${S}.meta.settings.solo && ${S}.meta.settings.solo.on) })`);
  ok(g.mode === 'solo' && g.phase === 'play' && g.m[0] === 's', `PLAY NOW's solo room, SOLO, playing (match ${g.m})`);
  ok(await P.ev("!!document.querySelector('.menu-btn') && !!document.querySelector('.music-btn') && !document.querySelector('.hi-snd') && !document.querySelector('.hi-note') && !document.querySelector('.hi-look')"), 'inside the console\'s game frame: the corner menu + music — none of the test page\'s own pieces (SOUNDS · the note · the look switch)');
  ok(await P.ev(`${ST}.state().look === document.body.dataset.look`), 'the look = the console\'s GAME LOOK (body[data-look])');
  ok(await P.ev(`${G}.state().friends.length === 0 && !${ST}.state().ftag`), 'THE NEXT FRIEND: none (a fresh phone has no friends)');
  await P.shot('start.png');

  // ---- 3. START → GO → the seed; real taps → the proof
  await P.tapAt(195, 620);
  ok(await P.waitFor(`${ST}.state().started && ${G}.state().proven`, 8000), 'START → GO landed: the run is on, PROVEN');
  let node = await nodeOf(g.code, g.m, uid), gs = await P.ev(`${G}.state()`);
  const srv = await P.ev("import('/js/firebase.js').then(f => f.serverNow())");
  ok(node && typeof node.go === 'number' && Math.abs(node.go - srv) < 15000 && gs.go === node.go, `the proof node's GO = the SERVER's time (${node && node.go}), read back by the phone`);
  ok(gs.stage.seed === seedOf(g.code, g.m, node.go) && gs.stage.seed !== g.hostSeed, `THE SEED IS PICKED AFTER GO: hash(code + matchId + GO) = ${gs.stage.seed} — never the host's own (${g.hostSeed})`);
  ok(await P.ev(`import('/js/firebase.js').then(f => f.set(f.dbRef('rooms/' + ${S}.code + '/hr/' + ${S}.game.matchId + '/' + ${S}.uid + '/go'), f.serverTimestamp()).then(() => false, () => true))`), '… GO is written once (a second one is refused)');
  // S4B — THE RULE SET: the run records the rule set it is played on — `rs` on its own proof node, once, right behind GO
  { let rs = null; for (let i = 0; i < 40 && rs == null; i++) { rs = await P.ev(`import('/js/firebase.js').then(f => f.get(f.dbRef('rooms/' + ${S}.code + '/hr/' + ${S}.game.matchId + '/' + ${S}.uid + '/rs')).then(x => x.val()))`); if (rs == null) await sleep(100); }
    ok(rs === 'classic', `the proof node names its RULE SET (rs = ${rs})`); }
  const a0 = await audio(P);
  const d1 = await drops(P, 9, i => (i % 4 === 3 ? 95 : 20));
  await sleep(1300);
  const a1 = await audio(P);
  gs = await P.ev(`${G}.state()`); node = await nodeOf(g.code, g.m, uid);
  const chunks = Object.values(node.c || {}), log = tapsFromChunks(node.c), mine = await P.ev(`${ST}.taps().slice()`);
  ok(d1 >= 8 && gs.stage.floor >= 6, `${d1} REAL taps dropped ${gs.stage.floor} floors (${gs.stage.perfects} perfect)`);
  ok(chunks.length >= 3 && chunks.every(c => typeof c.s === 'string' && Math.abs(c.at - srv) < 60000), `the proof: ${chunks.length} chunks, each stamped by the SERVER`);
  ok(log && JSON.stringify(log) === JSON.stringify(mine.slice(0, log.length)) && log.length >= mine.length - 1, `the chunks joined = the phone's own tap log (${log && log.length} of ${mine.length} taps up)`);
  ok(a1.held && a1.state === 'running' && a1.sound === 'HEAR THE HARBOR', `THE SOUND SYNC in the cartridge (MUSIC OFF = HEAR THE HARBOR): the run's lease held, the context running (${a1.sound})`);
  ok(gs.stage.lates === 0, 'no sound took the late path in play');
  await P.shot('run.png');

  // ---- the fuse ends it → e → the podium; THE SWITCH IS ON → COUNTED
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
  const res1 = await counted(g.code, g.m);
  ok(res1 && res1.g === 'highrise', 'THE SWITCH IS ON: the run is COUNTED from its proof node (results/ done) — no owner, no test flip');
  const best1 = await dbGet(`pstats/${pid}/b/highrise-solo`);
  ok(best1 && floorOf(best1.a) === V.floor, `… the best on the board highrise-solo = THE JUDGE's floor (${best1 && floorOf(best1.a)})`);
  ok(res1 && res1.o && res1.o[pid] && res1.o[pid].xp && res1.o[pid].xp.gain >= 0, `… paid by THE SOLO LANE (+${res1 && res1.o && res1.o[pid] && res1.o[pid].xp ? res1.o[pid].xp.gain : '?'} XP)`);
  await pastMoment(P);
  ok(await P.waitFor(`document.querySelector('.hi-fin .hi-ec-best').textContent === 'YOUR BEST ${V.floor} · AVG —'`, 15000), `the end screen: YOUR BEST ${V.floor} · AVG — from the server's record (a first counted run — never NEW BEST; THE END-BOARD SWITCH-ON's stored average: a dash under 5 runs)`);
  const fin = await P.ev("({ t: document.querySelector('.hi-fin .hi-ec-cause').textContent, n: document.querySelector('.hi-fin .hi-ec-n').getAttribute('aria-label'), w: document.querySelector('.hi-fin-would').textContent, kicker: document.querySelector('.hi-final .sheet-kicker').textContent })");
  ok(fin.t === 'TOO SLOW' && Number(fin.n) === V.floor && fin.kicker === 'HIGH RISE · SOLO', `the end screen: ${fin.kicker} · ${fin.t} · FLOOR ${fin.n}`);
  ok(fin.w === '', 'no WOULD COUNT line (counting is ON)');
  await sleep(1200);
  await P.shot('end-card-390x844.png');

  // ---- S4B — THE END = JAYWALK'S STANDARD, in the console's podium frame (docs/highrise.md "THE END")
  const box = "const q = s => document.querySelector(s), bx = el => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; }, col = s => getComputedStyle(q(s)).color;";
  const E = await P.ev(`(() => { ${box} return { kT: q('.hi-final .sheet-kicker').textContent, hd: bx(q('.hi-final .fn-hd')), kCols: [col('.hi-final .fn-w1'), col('.hi-final .fn-w2'), col('.hi-final .fn-m')], menu: bx(q('.menu-btn')), music: bx(q('.music-btn')),
    cause: bx(q('.hi-fin .hi-ec-cause')), causeCol: col('.hi-fin .hi-ec-cause'), causeFs: parseFloat(getComputedStyle(q('.hi-fin .hi-ec-cause')).fontSize), n: bx(q('.hi-fin .hi-ec-n')), nCol: col('.hi-fin .hi-ec-n'), nFs: parseFloat(getComputedStyle(q('.hi-fin .hi-ec-n')).fontSize), fl: bx(q('.hi-fin .hi-ec-fl')), flT: q('.hi-fin .hi-ec-fl').textContent,
    best: bx(q('.hi-fin .hi-ec-best')), bestCol: col('.hi-fin .hi-ec-best'), line: bx(q('.hi-fin .hi-ec-line')), lineT: q('.hi-fin .hi-ec-line').textContent, would: bx(q('.hi-fin-would')), bar: bx(q('.hi-final .final-bar')), barT: q('.hi-final .final-bar').textContent, barBg: getComputedStyle(q('.hi-final .final-bar')).backgroundColor,
    links: [...document.querySelectorAll('.hi-final .final-link')].map(a => a.textContent), table: !!q('.hi-table'), strip: !!q('.hi-ec-strip, .hi-ec-col'), winner: q('.hi-final .winner') ? getComputedStyle(q('.hi-final .winner')).display : 'none', tag: !!q('.hi-tag:not([hidden])') && getComputedStyle(q('.hi-tag')).display !== 'none',
    veil: getComputedStyle(q('.hi-shade')).opacity, look: q('.hi-stage').dataset.look, scroll: document.documentElement.scrollWidth, w: innerWidth,
    pills: [...document.querySelectorAll('.hi-final *')].filter(el => { const cs = getComputedStyle(el), r = parseFloat(cs.borderTopLeftRadius) || 0, b = el.getBoundingClientRect(); return b.width > b.height * 1.6 && b.height > 12 && r >= b.height / 2 - 0.5 && (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || parseFloat(cs.borderTopWidth) > 0); }).map(el => el.className).slice(0, 4) }; })()`);
  ok(E.kT === 'HIGH RISE · SOLO' && E.kCols.join('|') === 'rgb(255, 79, 216)|rgb(54, 201, 255)|rgb(201, 182, 255)' && E.hd.x >= E.menu.r + 2 && E.hd.r <= E.music.x - 2 && Math.abs((E.hd.x + E.hd.r) / 2 - 195) < 2, `THE HEADER "${E.kT}": HIGH hot pink · RISE cyan · the mode lavender — one line, centred between the corner buttons (${E.hd.x.toFixed(0)}–${E.hd.r.toFixed(0)}; ☰ to ${E.menu.r.toFixed(0)}, music from ${E.music.x.toFixed(0)})`);
  ok(E.causeCol === 'rgb(255, 79, 216)' && E.causeFs >= 30 && E.nCol === 'rgb(255, 255, 255)' && E.nFs >= 84 && E.flT === (V.floor === 1 ? 'FLOOR' : 'FLOORS') && E.bestCol === 'rgb(255, 210, 87)' && /^\d+ PERFECTS? · BEST STREAK \d+$/.test(E.lineT) && E.hd.b <= E.cause.y && E.cause.b <= E.n.y + 4 && E.n.b <= E.fl.y + 8 && E.fl.b <= E.best.y && E.best.b <= E.line.y,
    `top to bottom: the cause in saturated hot pink (${E.causeFs.toFixed(0)} px) · the floor HUGE + white (${E.nFs.toFixed(0)} px) · ${E.flT} · the best in gold · "${E.lineT}"`);
  ok(/PLAY AGAIN/.test(E.barT) && E.barBg === 'rgb(255, 79, 216)' && E.links.join('|') === 'SHARE|HOME' && E.bar.b <= 844, `THE UNIVERSAL FOOTER: the PLAY AGAIN bar in the accent + SHARE · HOME (S5 — THE SHARE IMAGE); no WOULD COUNT line once counting is ON — line just over the bar (${E.would.y.toFixed(0)}–${E.would.b.toFixed(0)}, the bar at ${E.bar.y.toFixed(0)})`);
  // THE GO-LIVE — SHARE with counting ON: THE LINK (JAYWALK's machinery) — the card goes up ONCE, its page's preview = THE POSTER
  {
    const L = await shareLink(P.p, '.hi-final .final-share');
    ok(L.url && L.keys.join() === 'url' && !L.files, `SHARE (counting ON): the LINK alone (${L.url ? L.url.replace(/^https?:\/\/[^/]+/, '') : 'none'}${L.again ? ' — a second tap in its own gesture' : ''})`);
    ok(L.png && L.png.w === 540 && L.png.h === 675, `… its page's preview = the run's card (${L.png ? `${L.png.w} × ${L.png.h}, ${(L.png.bytes / 1024).toFixed(0)} KB` : 'none'})`);
    const heroOk = await P.p.evaluate(() => performance.getEntriesByType('resource').filter(e => /\/assets\/highrise\/share\/[a-z]+\.webp/.test(e.name)).map(e => e.name.split('/').pop()));
    ok(heroOk.length === 1 && heroOk[0].startsWith('rooftops.webp'), `the card's picture = THE POSTER's hero shot for the band reached (${heroOk.join(' ') || 'none'})`);
  }
  ok(!E.table && !E.strip && E.winner === 'none' && !E.tag && !E.pills.length && E.scroll <= E.w, `no YOUR TABLE with no friends (a table of one is nothing); no stats strip, no winner block, no tag over the tower, no pill (${E.pills.join(' ')}), no sideways scroll`);
  if (S4B_OUT) await P.p.screenshot({ path: join(S4B_OUT, `cartridge-${LOOKN}-390x844-tooslow.png`) });
  // YOUR TABLE (THE END-SCREEN BOARD's FRIENDS ONLY since THE END-BOARD SWITCH-ON) — proven with FIXTURES (0 · 1 · 3 · 8 friends — a fresh phone has none of its own): the
  // friends' profiles + their HIGH RISE bests + YOUR list are written straight into the emulator, the table re-asked through the real
  // /api/profile + the real slim cards (JAYWALK's check: e2e-jaywalk.mjs "YOUR TABLE at <w>")
  {
    const FR = [['DIMETIME', 212, 190], ['ZACKATTACK12', 176, 150], ['RYLEN', 88, 61], ['MAXIMILIANOS', 301, 280], ['QUINN', 120, 100], ['HOPPER', 64, 40], ['IVY', 45, 30], ['BO', 9, 2]];
    // (pid-like — p + 11 of the id alphabet: core/friends.js#isPidLike; fresh each run — no state carried between runs)
    const rnd = () => Array.from({ length: 8 }, () => 'abcdefghijkmnpqrstuvwxyz23456789'[Math.floor(Math.random() * 32)]).join(''), base = rnd(), fpid = i => `phi${base}${'abcdefgh'[i]}`;
    const mineWas = await dbGet(`pstats/${pid}/b/highrise-solo`);
    await dbPut(`pstats/${pid}/b/highrise-solo`, { a: towerScore(119, 101, 9000) });
    let seeded = 0;
    for (const k of [0, 1, 3, 8]) {
      for (; seeded < k; seeded++) { const [nm, f, pf] = FR[seeded]; await dbPut(`profiles/${fpid(seeded)}`, { n: nm, x: 4200 + seeded * 900, a: 'bolt', c: ['pink', 'cyan'][seeded % 2], m: 9 }); await dbPut(`pstats/${fpid(seeded)}/b/highrise-solo`, { a: towerScore(f, pf, 7000 + seeded) }); await dbPut(`pfr/${pid}/f/${fpid(seeded)}`, Date.now()); }
      // (THE END-BOARD SWITCH-ON, Nov 27: YOUR TABLE = THE END-SCREEN BOARD's ☐ FRIENDS ONLY — the shared block (ui/end-board.js) mounted again
      //  with the tick on + its reads forgotten, so the re-seeded table is asked again through the real /api/profile)
      await P.ev(`(async () => { const EB = await import('/js/ui/end-board.js'), C = await import('/js/games/highrise/index.js'); EB.forgetReads(); localStorage.setItem(EB.FRIENDS_KEY, '1'); const el = document.querySelector('.hi-final .final-eb'); el.replaceChildren(); el.className = 'final-eb'; EB.mountEndBoard(el, C.END_BOARD, { solo: true }); return 1; })()`);
      // k friends + you: 0 → NO FRIENDS YET (the world stays) · 1 → you + 1 · 3 → the top 3 (you 3rd, 119) · 8 → the top 3 + "YOU · 5TH · 119 FLOORS"
      const want = { 0: [0, ''], 1: [2, ''], 3: [3, ''], 8: [3, 'YOU · 5TH · 119 FLOORS'] }[k];
      if (k) ok(await P.waitFor(`document.querySelectorAll('.hi-final .eb-list li').length === ${want[0]} && document.querySelector('.hi-final .eb-you').textContent === '${want[1]}' && [...document.querySelectorAll('.hi-final .eb-card')].every(c => c.getBoundingClientRect().height > 30)`, 12000), `FRIENDS ONLY with ${k} friend${k === 1 ? '' : 's'}: ${want[0]} rows${want[1] ? ` + "${want[1]}"` : ' (you among them)'}`);
      // (FREEFALL FIX C — S11: a REMEMBERED tick with no friends at all unticks itself + remembers '0'; the line "NO FRIENDS YET" only on
      //  the TAP that asked — this mount had no tap, so it stays quiet: the old "on every later end screen" bug)
      else { const okk = await P.waitFor("document.querySelector('.hi-final .eb-note').textContent === '' && document.querySelector('.hi-final .eb-tick').getAttribute('aria-checked') === 'false' && localStorage.getItem('ns:endb:fr') === '0'", 12000);
        const why = okk ? '' : await P.ev("JSON.stringify({ note: document.querySelector('.hi-final .eb-note').textContent, tick: document.querySelector('.hi-final .eb-tick').getAttribute('aria-checked'), fr: localStorage.getItem('ns:endb:fr'), rows: document.querySelectorAll('.hi-final .eb-list li').length })");
        ok(okk, `FRIENDS ONLY with 0 friends (remembered on, no tap): the tick unticks itself, remembered off, no line — the world stays${why ? ` — the page: ${why}` : ''}`); }
      await sleep(700);
      const T = await P.ev(`(() => { const fr = document.querySelector('.hi-final .final'), li = [...document.querySelectorAll('.hi-final .eb-list li')];
        return { over: fr.scrollHeight - fr.clientHeight, floors: li.map(x => x.querySelector('.eb-v').firstChild.textContent), me: li.map(x => x.classList.contains('is-me')), av: li.map(x => (x.querySelector('.eb-av') || {}).textContent || ''),
          names: [...document.querySelectorAll('.hi-final .eb-card .vl-name')].map(x => ({ t: x.textContent, cut: x.classList.contains('fit-cut') || x.scrollWidth > x.clientWidth + 1 })) }; })()`);
      ok(T.over <= 6 && T.names.every(x => !x.cut) && T.floors.every(f => /^\d{1,3}$/.test(f)) && T.av.every(a => /^AVG (—|\d+)$/.test(a)), `${k}: nothing scrolls (${T.over} px over) · the floors as floors (${T.floors.join(' · ') || 'the world'} — never the tower's sort number) · ${T.av.join(' / ') || 'no rows'} · every name whole`);
      if (k === 3) ok(T.me.indexOf(true) === 2 && T.floors[2] === '119', `3: YOUR row 3rd with your 119 (floors ${T.floors.join(' · ')})`);
      if (S4B_OUT) await P.p.screenshot({ path: join(S4B_OUT, `cartridge-${LOOKN}-390x844-table-${k}.png`) });
    }
    for (let i = 0; i < seeded; i++) { await dbPut(`pfr/${pid}/f/${fpid(i)}`, null); await dbPut(`pstats/${fpid(i)}`, null); await dbPut(`profiles/${fpid(i)}`, null); }
    await dbPut(`pstats/${pid}/b/highrise-solo`, mineWas == null ? null : mineWas);
    await P.ev("import('/js/ui/end-board.js').then(EB => { EB.forgetReads(); localStorage.setItem(EB.FRIENDS_KEY, '0'); })");
  }
  if (process.env.HI_UNTIL === 'table') { await b.close(); console.log(`\n${n - fails.length}/${n} checks (HI_UNTIL=table) — ${fails.length ? `FAILED:\n  ${fails.join('\n  ')}` : 'all green'}`); process.exit(fails.length ? 1 : 0); }

  // ---- 5. PLAY AGAIN = THE INSTANT AGAIN: the next run starts with no tap; THE NEXT FRIEND (a fixture); then a FORGED node
  const scenes0 = await P.ev(`${ST}.state().rebuilds`);
  // (REVIEW FIX A: the cartridge's YOUR BEST = the SERVER's record only. A fixture of the server's best, as YOUR TABLE would leave it on
  //  this phone, so the gold tag stands beside THE NEXT FRIEND's below)
  await P.ev("localStorage.setItem('hi:best', '5')");
  const fw2 = await flashWatch(b, P.cdp);
  await P.ev("(() => { const b = document.querySelector('.hi-final .final-bar') || [...document.querySelectorAll('.hi-final button')].find(x => /PLAY AGAIN/.test(x.textContent)); b.click(); })()");
  ok(await P.waitFor(`${S}.game && ${S}.game.matchId !== '${g.m}' && ${S}.game.phase === 'play' && !!${G} && ${ST}.state().started && ${G}.state().proven`, 15000), 'PLAY AGAIN → the next run, a match of its own — started at once (no START tap), PROVEN');
  await sleep(900);
  const fl2 = await fw2.stop();
  ok(fl2.frames >= 10 && fl2.flash.length === 0, `… and none at PLAY AGAIN, into the next start (${fl2.frames} frames; the pinkest ${fl2.worst ? `${(fl2.worst.pink * 100).toFixed(0)} %` : '—'}, before ${(fl2.before * 100).toFixed(0)} %, settled ${(fl2.after * 100).toFixed(0)} %)`);
  const g2 = await P.ev(`({ code: ${S}.code, m: ${S}.game.matchId })`);
  ok(await P.ev(`!document.querySelector('.hi-final') && ${ST}.state().floor === 0 && ${ST}.state().rebuilds === ${scenes0}`), '… the podium is gone, a fresh tower, the SAME scene (kept warm — never rebuilt)');
  ok(!!(await nodeOf(g.code, g.m, uid)), '… and the finished run\'s proof node is still in the room');
  // THE NEXT FRIEND (a test fixture — a fresh phone has no friends): the pink tag above you → crossed → the pink tape
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
  ok(await P.waitFor("document.querySelector('.hi-fin .hi-ec-cause').textContent === 'NOT COUNTED'", 15000), `… and the server says so (${await P.ev("document.querySelector('.hi-fin .hi-ec-cause').textContent + ' · ' + document.querySelector('.hi-fin-would').textContent")})`);
  { const bf = await dbGet(`pstats/${pid}/b/highrise-solo`); ok(bf && floorOf(bf.a) < 150, `… and no best of it (the board highrise-solo stays on floor ${bf && floorOf(bf.a)}, never 150)`); }

  // ---- 6. A LONG COUNTED RUN: a real run past floor 60 → the floor, XP, the streak, the best, ABOVE THE CLOUDS + THE HITCH RUN
  if (!FAST) {
    await P.ev("(() => { const b = document.querySelector('.hi-final .final-bar') || [...document.querySelectorAll('.hi-final button')].find(x => /PLAY AGAIN/.test(x.textContent)); b.click(); })()");
    await P.waitFor(`${S}.game && ${S}.game.matchId !== '${g3.m}' && ${S}.game.phase === 'play' && ${G}.state().proven`, 15000);
    const g4 = await P.ev(`({ code: ${S}.code, m: ${S}.game.matchId })`);
    const h0 = (await P.ev(`${ST}.hitches()`)).list.length;   // (the earlier runs' own: this check's screenshots stall a frame)
    const top = await botTo(P, 63);
    const hit = await P.ev(`${ST}.hitches()`), a4 = await audio(P);
    ok(top >= 63, `a real run by taps at the touch path: floor ${top}`);
    // (headless Chromium's own ~0.65 s stall two minutes after launch is not the game's — a frame that long, with no mark of the page's
    //  own work on it, is the browser's: S4A FIX's honest counter names it `unknown` — or `gc`, if a collection is known to have run in it)
    //  (THE CLOSE: the stall lands on whatever frame is due — with the bot tapping every floor that frame often carries a TAP's mark
    //  (seen twice, 617 + 633 ms at the same point of the run): what makes it the browser's is its size against the page's OWN measured
    //  work in it (< 12 ms), not the name of the mark)
    const mine = hit.list.slice(h0), bad = mine.filter(h => !(h.gap > 400 && h.work < 12));
    ok(bad.length === 0, `THE HITCH RUN inside the cartridge (${top} floors, ~75 s): no frame over 33 ms after the first second (${bad.length} hitches${mine.length ? ` — seen: ${mine.map(h => `${h.why} ${h.gap} ms (the page's own work ${h.work} ms) @${h.floor}`).join(' · ')}${mine.length > bad.length ? ' (the long one = headless Chromium, not the game)' : ''}` : ''})`);
    ok(a4.held && a4.state === 'running', 'the run holds the audio context awake to the end');
    ok(await toFinal(P, 30000), 'the fuse ends it → the podium');
    const end = Date.now() + 25000; let res = null;
    while (Date.now() < end && !(res && res.st === 'done')) { res = await dbGet(`results/${g4.code}_${g4.m}`); await sleep(200); }
    ok(res && res.st === 'done' && res.g === 'highrise', 'the run is COUNTED (results/ done)');
    const ps = await dbGet(`pstats/${pid}`), bestV = ps && ps.b && ps.b['highrise-solo'] ? ps.b['highrise-solo'].a : null;
    const o = res.o && res.o[pid];
    ok(o && o.xp && o.xp.gain > 0 && ps.xp === o.xp.to, `… XP +${o && o.xp && o.xp.gain}`);
    ok(ps.st && ps.st.n >= 1 && o.streak >= 1, `… the streak day counted (${o && o.streak})`);
    ok(floorOf(bestV) === top + 0 || floorOf(bestV) >= 63, `… the best: floor ${floorOf(bestV)} (${perfectsOf(bestV)} perfects) on the board highrise-solo`);
    ok(ps.pa && ps.pa.gf && ps.pa.gf['highrise-clouds'] === 1 && !ps.pa.gf['highrise-top'], '… the feat flag `clouds` from the server\'s replay (never `top`)');
    ok(ps.it && !!ps.it['card-abovetheclouds'] && (o.ach || []).includes('above-the-clouds') && !ps.it['card-topoftheworld'], `… ABOVE THE CLOUDS awarded (the card + its achievement) — TOP OF THE WORLD not (items ${Object.keys(ps.it || {}).filter(k => /^card-/.test(k)).join(' ')} · ach ${(o.ach || []).join(' ')})`);
    await pastMoment(P);
    ok(await P.waitFor("/^(NEW BEST|YOUR BEST \\d+ · AVG)/.test(document.querySelector('.hi-fin .hi-ec-best').textContent) && !document.querySelector('.hi-fin-would').textContent", 15000), `… the end screen says ${await P.ev("document.querySelector('.hi-fin .hi-ec-best').textContent")} — no WOULD COUNT line`);
    await P.shot('end-card-counted-390x844.png');
  }
  await dropRunCards(pid);
  ok(P.errs.length === 0, `no page error (${P.errs.join(' | ')})`);
  await P.close();
  }
  // ---- 7. HIGH RISE PAD + GO — THE CONTROLLER (kit/highrise-pad.mjs — the SAME checks wk-highrise-pad.mjs runs in WebKit): a FAKE PAD on
  // the Gamepad API drives a solo run on a NEW phone — the first press only CONNECTS · A = TAP TO START · A drops, each logged at THE
  // PRESS's OWN TICK (an injected timestamp) · B / Start / the D-pad nothing · a touch the same · REPLAY = LIVE · the podium: A = PLAY AGAIN, B = HOME
  {
    const Q = await phone(`hp${Date.now() % 100000}`, 'PADDER');
    await Q.ev("import('/js/host.js').then(h => { h.playSolo('highrise'); })");
    ok(await Q.waitFor(`${S}.game && ${S}.game.id === 'highrise' && ${S}.game.phase === 'play' && !!document.querySelector('.hi-stage.hi-game canvas.hi-canvas') && !!${G} && ${ST}.state().info.warmed > 0`, 40000), 'THE CONTROLLER: a new phone, PLAY NOW → HIGH RISE at TAP TO START');
    ok(await Q.ev("import('/js/games/metas.js').then(m => m.META.highrise.CONTROLLER === true && !performance.getEntriesByType('resource').some(e => /kit\\/gamepad\\.js/.test(e.name)))"), '… the PLAY sheet\'s mark is on (metas.js CONTROLLER) — and the kit\'s pad module was NOT fetched before a pad showed (lazy)');
    await padSoloCase(Q, ok, { sleep, verifyNode, nodeOf, shot: OUT ? name => Q.shot(`${name}-390x844.png`) : null });
    ok(await Q.ev("performance.getEntriesByType('resource').filter(e => /kit\\/gamepad\\.js/.test(e.name)).length === 1"), '… the kit\'s pad module: fetched ONCE, on the first pad');
    ok(Q.errs.length === 0, `THE CONTROLLER: no page errors${Q.errs.length ? ` (${Q.errs.slice(0, 3).join(' · ')})` : ''}`);
    await Q.close();
  }

  // ---- 8. HIGH RISE PAD + GO — THE SOLO GO (go.js): the line DEAD for 5.5 s at the START tap (goOffline) — the old ONE 4 s wait went on
  // UNPROVEN; now the answer is still waited for: the run starts PROVEN when the line is back, and COUNTS
  {
    const Q = await phone(`hg${Date.now() % 100000}`, 'LATEGO');
    const who = await pidOf(Q);
    await Q.ev("import('/js/host.js').then(h => { h.playSolo('highrise'); })");
    ok(await Q.waitFor(`${S}.game && ${S}.game.id === 'highrise' && ${S}.game.phase === 'play' && !!${G} && ${ST}.state().info.warmed > 0`, 40000), 'THE SOLO GO: a new phone at TAP TO START');
    const gq = await Q.ev(`({ code: ${S}.code, m: ${S}.game.matchId })`);
    await Q.ev("import('/js/firebase.js').then(f => f.goOffline())");
    const t0 = Date.now();
    await Q.tapAt(195, 620);
    await sleep(4600);
    const mid = await Q.ev(`({ starting: ${ST}.state().starting, started: ${ST}.state().started, proven: ${G}.state().proven, note: ${ST}.pad().note })`);
    ok(mid.starting && !mid.started && !mid.note, `4.6 s after the START tap with NO line: still waiting on the start screen — the old 4 s wait had gone on UNPROVEN by now (${JSON.stringify(mid)})`);
    await sleep(Math.max(0, 5500 - (Date.now() - t0)));
    await Q.ev("import('/js/firebase.js').then(f => f.goOnline())");
    ok(await Q.waitFor(`${ST}.state().started`, 6000), `the line is back at 5.5 s → the run starts (${((Date.now() - t0) / 1000).toFixed(1)} s after the tap)`);
    const late = await Q.ev(`({ proven: ${G}.state().proven, go: ${G}.state().go, note: ${ST}.pad().note, seed: ${ST}.state().seed })`), nodeL = await nodeOf(gq.code, gq.m, who.uid);
    ok(late.proven && nodeL && nodeL.go === late.go && late.seed === seedOf(gq.code, gq.m, nodeL.go) && !late.note, `A LATE ANSWER STILL PROVES THE RUN: PROVEN on the server's GO (${nodeL && nodeL.go}), the seed picked from it — no NOT COUNTED line`);
    const dl = await drops(Q, 4);
    ok(dl >= 3, `… ${dl} real taps drop slabs`);
    ok(await toFinal(Q, 40000), '… the fuse ends it → the podium');
    const resL = await counted(gq.code, gq.m), VL = verifyNode({ code: gq.code, matchId: gq.m, node: await nodeOf(gq.code, gq.m, who.uid) });
    ok(resL && resL.g === 'highrise' && VL.ok && VL.floor >= 3, `… and it COUNTS: results/ done, the judge's replay = ${VL.ok ? VL.floor : VL.why} floors`);
    ok(Q.errs.length === 0, `THE SOLO GO (late): no page errors${Q.errs.length ? ` (${Q.errs.slice(0, 3).join(' · ')})` : ''}`);
    await Q.close();
  }
  // … and TOTAL FAILURE: no line for the whole GO_WAIT_MS → the run plays UNPROVEN and SAYS SO — "NOT COUNTED — NO CONNECTION" on screen for
  // as long as the run is on (the stage's quiet line), and as its end card's reason
  {
    const Q = await phone(`hn${Date.now() % 100000}`, 'NOLINE');
    const who = await pidOf(Q);
    await Q.ev("import('/js/host.js').then(h => { h.playSolo('highrise'); })");
    ok(await Q.waitFor(`${S}.game && ${S}.game.id === 'highrise' && ${S}.game.phase === 'play' && !!${G} && ${ST}.state().info.warmed > 0`, 40000), 'THE SOLO GO (no line): a new phone at TAP TO START');
    const gq = await Q.ev(`({ code: ${S}.code, m: ${S}.game.matchId })`);
    await Q.ev("import('/js/firebase.js').then(f => f.goOffline())");
    const t0 = Date.now();
    await Q.tapAt(195, 620);
    ok(await Q.waitFor(`${ST}.state().started`, 12000), 'no answer at all: the run still STARTS (never a stuck start)');
    const took = Date.now() - t0;
    ok(took >= 8000 && took <= 11500, `… after the whole wait (${(took / 1000).toFixed(1)} s — go.js#GO_WAIT_MS 9 s, not 4)`);
    const un = await Q.ev(`({ proven: ${G}.state().proven, spent: ${G}.state().spent, note: ${ST}.pad().note, vis: (e => !!e && !e.hidden && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0)(document.querySelector('.hi-nc')), box: (r => ({ x: r.left, y: r.top, r: r.right, b: r.bottom }))(document.querySelector('.hi-nc').getBoundingClientRect()), fs: parseFloat(getComputedStyle(document.querySelector('.hi-nc')).fontSize), radius: getComputedStyle(document.querySelector('.hi-nc')).borderRadius, bg: getComputedStyle(document.querySelector('.hi-nc')).backgroundColor, menu: (r => ({ b: r.bottom }))(document.querySelector('.menu-btn').getBoundingClientRect()), w3: 195 - 84 * 0.6 * 3 / 2, net: (e => { if (!e || !e.classList.contains('is-on')) return null; const r = e.getBoundingClientRect(); return { y: r.top, b: r.bottom }; })(document.querySelector('#net')) })`);
    ok(!un.proven && un.spent && un.note === 'NOT COUNTED — NO CONNECTION' && un.vis, `the run is UNPROVEN and SAYS SO on screen: "${un.note}"`);
    ok(un.fs >= 11 && un.box.y >= un.menu.b - 1 && un.box.b < 844 * 0.25 && un.box.r <= un.w3 && (!un.net || un.box.y >= un.net.b) && un.bg === 'rgba(0, 0, 0, 0)' && (un.radius === '0px' || un.radius === ''), `… small, in the top quarter (y ${un.box.y.toFixed(0)}–${un.box.b.toFixed(0)}, ${un.fs} px) — UNDER the console's SIGNAL LOST banner${un.net ? ` (it ends at ${un.net.b.toFixed(0)})` : ' (not up)'}, clear of a THREE-DIGIT floor number (its right edge ${un.box.r.toFixed(0)} ≤ ${un.w3.toFixed(0)}), plain words — no pill, no plate`);
    await Q.shot('not-counted-run-390x844.png');
    await Q.ev("import('/js/firebase.js').then(f => f.goOnline())");
    const dn = await drops(Q, 3);
    ok(dn >= 2 && await Q.ev(`${ST}.pad().note === 'NOT COUNTED — NO CONNECTION' && !${G}.state().proven`), `… ${dn} drops later (the line back): still NOT COUNTED — the line stays for the whole run`);
    for (const [w, hh] of [[402, 874], [430, 932], [1440, 900]]) { await Q.p.setViewport({ width: w, height: hh, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await sleep(350); await Q.shot(`not-counted-run-${w}x${hh}.png`); }
    await Q.p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    ok(await Q.waitFor(`${ST}.state().card && !!document.querySelector('.hi-leave')`, 40000), '… the fuse ends it → the stage\'s OWN card (no podium: nothing to count)');
    const card = await Q.ev(`({ check: ${ST}.state().check, nc: getComputedStyle(document.querySelector('.hi-nc')).display, leave: document.querySelector('.hi-leave').textContent, pad: document.querySelector('.hi-leave').getAttribute('data-pad') })`);
    ok(card.check === 'NOT COUNTED — NO CONNECTION' && card.nc === 'none' && card.leave === 'BACK HOME' && card.pad === 'b', `THE END CARD's reason: "${card.check}" (the run's own line is put away) · ${card.leave} (the pad's B)`);
    await Q.shot('not-counted-end-390x844.png');
    await sleep(2500);
    ok(!(await dbGet(`results/${gq.code}_${gq.m}`)), '… nothing is counted for it (no results/ row)');
    // PLAY AGAIN on that card: this match's one GO is SPENT — the next run starts AT ONCE (never another 9 s), NOT COUNTED on screen
    await sleep(700);
    const t1 = Date.now();
    await Q.tapAt(195, 500);
    ok(await Q.waitFor(`${ST}.state().started && !${ST}.state().card`, 3000) && Date.now() - t1 < 3000, `PLAY AGAIN on that card starts AT ONCE (${Date.now() - t1} ms — this match's one GO is spent: never a second 9 s wait)`);
    ok(await Q.ev(`${ST}.pad().note === 'NOT COUNTED — NO LINE TO THE BOARD' && !${G}.state().proven`), '… and says NOT COUNTED — NO LINE TO THE BOARD (BACK HOME → PLAY NOW is the counted way back)');
    ok(Q.errs.length === 0, `THE SOLO GO (no line): no page errors${Q.errs.length ? ` (${Q.errs.slice(0, 3).join(' · ')})` : ''}`);
    await Q.close();
  }
} catch (e) { ok(false, `FATAL ${e && e.stack ? e.stack : e}`); }
await b.close();
console.log(`\n${n - fails.length}/${n} checks passed`);
if (fails.length) { console.log('FAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
