// JAYWALK H3 — THE SOLO RUN end to end, on the emulators + scripts/serve.mjs --emu (NEVER THE LIVE SITE), Chromium as a phone (390 × 844):
//   · THE OWNER'S LIVE TEST: a stranger's PLAY shelf has no JAYWALK and PLAY NOW refuses it; the OWNER's phone (the server's own yes — the
//     radio gate; on the emulators testAdmins/{pid}) gets JAYWALK · TEST → its card → PLAY NOW
//   · GO with the server's time: the proof node's `go` ≈ the server clock, written once; the course = seedOf(code, matchId, go)
//   · hops → the chunks, each { s, at: the server's time }; a forged chunk time is refused by the rules
//   · out → the end screen (the cause in big words, the lanes, PLAY AGAIN · SHARE · BACK TO THE CITY — the non-pill tubes); the report COUNTED FROM THE REPLAY →
//     the solo board's best = the server's own lanes + NEW BEST on the end screen
//   · PLAY AGAIN (THE INSTANT AGAIN): tap → the next run's course is up (ready to hop) — MEASURED; a new match id + its own proof + its own report; the scene
//     kept warm (one WebGL scene the whole session)
//   · a FORGED log (hops the clock never saw) → counted as nothing: the best untouched
//   · BACK TO THE CITY → the room gone
//   · THE SHARE IMAGE: the frame of the moment the kid went out + the cause + the lanes + THE SIGNAL (drawn on the phone; saved to outDir)
//   · THE LINES (H4 add-on): a first-ever run has NO gold line; THE NEXT FRIEND'S LINE (a friend's server-counted best, from YOUR TABLE's
//     read — asked ONCE) is seen coming and crossed (a burst + a quiet chime; then no friend ahead = no line); the next run draws YOUR
//     BEST LINE at the server's best — crossing it: the burst, the new-best sound, the lane counter flashes + stays gold
//   · --perf: the real view at 390 × 844 @3 under a 4× CPU throttle — fps, frame time p95 / worst, the work a frame, per tier
//   · --drop (H4 — THE DROPPED SIGNAL, a REAL offline gap): the bot plays, the phone's database line is cut for 30 s, then 60 s
//     (goOffline / goOnline), the queued chunks land together → the SERVER's replay counts the FULL honest run, no cut
//   node tests/integration/e2e-jaywalk.mjs "<chromium>" [outDir] [--perf] [--drop]
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { verifyNode } from '../../api/_lib/jaywalk.js';
import { chunkTimes } from '../../js/games/jaywalk/replay.js';
import { CAUSE_LINES, hitVehicle } from '../../js/games/jaywalk/causes.js';
import { createCourse } from '../../js/games/jaywalk/course.js';
import { seedOf } from '../../js/games/jaywalk/logic.js';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const argv = process.argv.slice(2), PERF = argv.includes('--perf'), DROP = argv.includes('--drop'), OUT = argv.slice(1).find(a => !a.startsWith('--')) || null;
if (OUT) mkdirSync(OUT, { recursive: true });
const DB = 'http://127.0.0.1:9000', NS = 'ns=demo-arcade-default-rtdb', AUTH = { Authorization: 'Bearer owner' };
const dbGet = path => fetch(`${DB}/${path}.json?${NS}`, { headers: AUTH }).then(r => r.json());
const dbPut = (path, v) => fetch(`${DB}/${path}.json?${NS}`, { method: 'PUT', headers: AUTH, body: JSON.stringify(v) }).then(r => r.json());
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fails = [];
let n = 0;
const ok = (c, what) => { n++; if (!c) fails.push(what); console.log(c ? 'OK  ' : 'FAIL', what); };
const b = await puppeteer.launch({ executablePath: argv[0], headless: true, args: ['--enable-gpu', '--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const UP = '!!(window.__district && window.__district.harbor() && window.__district.harbor().shown) && !!window.__arcade && window.__arcade.state.ready && !!window.__arcade.state.uid';
const S = 'window.__arcade.state', G = 'window.__jwGame';

async function phone(slot, dpr = 2, name = 'HOPPER') {
  const ctx = await b.createBrowserContext();
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e.message || e)));
  if (process.env.JW_DEBUG) p.on('console', m => console.log(`   [${m.type()}] ${m.text().slice(0, 240)}`));
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: dpr, isMobile: true, hasTouch: true });
  await p.evaluateOnNewDocument(s => { try { localStorage.setItem('nd:entered', '1'); localStorage.setItem(`na:${s[0]}:profile`, JSON.stringify({ name: s[1], color: 'cyan', avatar: 'bolt' })); } catch { /* fine */ } }, [slot, name]);
  const waitFor = async (js, ms = 20000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* navigating */ } await sleep(50); } return false; };
  const open = async () => { await p.goto(guardUrl(`${BASE}/?emu&slot=${slot}&city=2&when=2026-11-10T20:30`, 'e2e-jaywalk.mjs'), { waitUntil: 'domcontentloaded' }); if (!await waitFor(UP, 60000)) throw new Error('the city never came up'); };
  await open();
  const ev = js => p.evaluate(js);
  const tap = async sel => { const r = await p.evaluate(q => { const el = document.querySelector(q); if (!el) return null; const x = el.getBoundingClientRect(); return [x.left + x.width / 2, x.top + x.height / 2, x.width, x.height]; }, sel); if (!r) return null; await p.touchscreen.tap(r[0], r[1]); return r; };
  const shot = async name => { if (OUT) await p.screenshot({ path: join(OUT, name) }); };
  return { p, ev, waitFor, open, tap, shot, errs, close: () => ctx.close() };
}
const hopUp = async (P, k) => { for (let i = 0; i < k; i++) { await P.p.touchscreen.tap(195, 520); await sleep(230); } };
const pidOf = async P => { const uid = await P.ev(`${S}.uid`); for (let i = 0; i < 60; i++) { const pid = await dbGet(`uids/${uid}`); if (pid) return { uid, pid }; await sleep(250); } return { uid, pid: null }; };
const nodeOf = async (code, m, uid) => dbGet(`rooms/${code}/jw/${m}/${uid}`);
/** the run on screen to its end: the kid stands still — the blackout (or the traffic) takes them */
const toEnd = async (P, ms = 45000) => P.waitFor(`${S}.game && ${S}.game.phase === 'final' && !!document.querySelector('.jw-final .jw-fin-cause')`, ms);
const board = async pid => { const s = await dbGet(`pstats/${pid}`); return s && s.b && s.b['jaywalk-solo'] ? s.b['jaywalk-solo'].a : null; };
/** H4B's add-on — THE SHARE = THE PICTURE ONLY: tap `sel` with the share sheet stubbed → what was shared + the link's page + its picture */
async function shareLink(page, sel) {
  await page.evaluate(() => { window.__shared = []; navigator.share = async d => { window.__shared.push(d); }; navigator.canShare = () => true; });
  await page.evaluate(q => document.querySelector(q).click(), sel);
  let out = null;
  for (let i = 0; i < 100 && !(out && out.length); i++) { out = await page.evaluate(() => window.__shared); if (!(out && out.length)) await new Promise(r => setTimeout(r, 150)); }
  const d = (out && out[0]) || {}, url = d.url || '';
  const html = url ? await fetch(url, { redirect: 'manual' }).then(r => r.text()).catch(() => '') : '';
  const meta = k => (new RegExp(`<meta property="${k}" content="([^"]*)"`).exec(html) || [])[1] || '';
  const img = meta('og:image').replace(/&amp;/g, '&');
  const png = img ? Buffer.from(await fetch(img).then(r => r.arrayBuffer())) : Buffer.alloc(0);
  return { keys: Object.keys(d).sort(), url, code: (/[?&]s=([A-Za-z0-9_-]{12})/.exec(url) || [])[1] || '', title: meta('og:title'), img, go: (/url=([^"]*)"/.exec(html) || [])[1] || '',
    png: png.length > 24 && png.toString('latin1', 1, 4) === 'PNG' ? { w: png.readUInt32BE(16), h: png.readUInt32BE(20), bytes: png.length } : null, buf: png };
}
/** (the emulator stays clean for the other suites: every run card these phones uploaded — the end screens warm one each — is removed) */
async function dropRunCards(pids) {
  await new Promise(r => setTimeout(r, 2500));   // (an upload still on its way lands first)
  const all = (await dbGet('shr')) || {};
  for (const [code, c] of Object.entries(all)) if (c && pids.includes(c.p) && c.k === 'run') { await dbPut(`shr/${code}`, null); if (c.d) await dbPut(`shrx/${c.d}/${code}`, null); }
  for (const pid of pids) await dbPut(`shrp/${pid}:jaywalk`, null);
}
const counted = async (code, m, ms = 20000) => { const end = Date.now() + ms; while (Date.now() < end) { const r = await dbGet(`results/${code}_${m}`); if (r && r.st === 'done') return r; await sleep(150); } return null; };

try {
  // ---- 1. nobody but the owner ever sees it
  const P = await phone(`jw${Date.now() % 100000}`);
  const { uid, pid } = await pidOf(P);
  ok(!!pid, 'the phone has its profile');
  await P.tap('.nd-tab-play');
  ok(await P.waitFor("!!document.querySelector('.nd-shelf-sheet.is-in .nd-shelf-row')", 6000), 'a stranger: the dock\'s PLAY opens THE GAMES SHELF');
  ok(await P.ev("!document.querySelector('.nd-shelf-row[data-game=\"jaywalk\"]') && document.querySelectorAll('.nd-shelf-row').length === 3"), '… the three playable games — NO JAYWALK');
  ok(await P.ev("import('/js/host.js').then(m => m.playSolo('jaywalk'))") === false && !(await P.ev(`${S}.code`)), '… and PLAY NOW refuses it (COMING SOON): nobody else can start it');
  // ---- 2. THE OWNER'S LIVE TEST: the server's own yes → JAYWALK · TEST on the shelf → its card → PLAY NOW
  await dbPut(`testAdmins/${pid}`, true);
  await P.ev('sessionStorage.clear()');   // (the gate remembers a NO for the tab: this tab was a stranger a moment ago — a real owner is the owner from his first load)
  await P.open();
  ok(await P.waitFor("import('/js/config.js').then(c => c.isOwnerTest('jaywalk'))", 20000), 'THE OWNER\'s phone: the server\'s yes arrives (the radio gate) → JAYWALK is his to test');
  await P.tap('.nd-tab-play');
  ok(await P.waitFor("!!document.querySelector('.nd-shelf-sheet.is-in .nd-shelf-row[data-game=\"jaywalk\"]')", 6000), 'PLAY → the shelf lists JAYWALK');
  ok(/JAYWALK · TEST/.test(await P.ev("document.querySelector('.nd-shelf-row[data-game=\"jaywalk\"]').textContent")), '… marked · TEST');
  await P.shot('owner-shelf.png');
  // (THE LINES: a FRIEND with a server-counted JAYWALK best of 7 lanes — a real profile of their own, on the owner's friends list)
  const FR = await phone(`jwf${Date.now() % 100000}`, 1, 'LIAM');
  const friend = await pidOf(FR);
  await FR.close();
  await dbPut(`pstats/${friend.pid}/b/jaywalk-solo`, { a: 7 });
  await dbPut(`pfr/${pid}/f/${friend.pid}`, Date.now());
  await P.tap('.nd-shelf-row[data-game="jaywalk"]');
  ok(await P.waitFor("!!document.querySelector('.nd-card-sheet.is-in .nd-card[data-game=\"jaywalk\"] .nd-card-solo')", 8000), 'its row → THE GAME CARD with PLAY NOW');
  await P.shot('owner-card.png');
  const tPlay = Date.now();
  await P.tap('.nd-card-solo');
  ok(await P.waitFor(`${S}.game && ${S}.game.id === 'jaywalk' && !!document.querySelector('.jw-game canvas.jw-canvas') && !!${G}`, 25000), `PLAY NOW → the game's own screen (${Date.now() - tPlay} ms from the tap — THE SOLO START's walk inside)`);
  // ---- 3. GO with the server's time → the course
  ok(await P.waitFor(`${G}.state().mode === 'run'`, 8000), 'GO landed: the run is on');
  let g = await P.ev(`({ code: ${S}.code, m: ${S}.game.matchId, mode: ${S}.game.mode, phase: ${S}.game.phase, hostSeed: ${S}.game.seed, solo: !!(${S}.meta.settings && ${S}.meta.settings.solo && ${S}.meta.settings.solo.on) })`);
  ok(g.mode === 'solo' && g.phase === 'play' && g.solo && g.m[0] === 's', `PLAY NOW's solo room, SOLO ENDLESS, playing (match ${g.m})`);
  let node = await nodeOf(g.code, g.m, uid), st = await P.ev(`${G}.state()`);
  const srv = await P.ev("import('/js/firebase.js').then(f => f.serverNow())");
  ok(node && typeof node.go === 'number' && Math.abs(node.go - srv) < 15000 && st.go === node.go, `the proof node's GO = the SERVER's time (${node && node.go}), read back by the phone`);
  const want = await P.ev(`import('/js/games/jaywalk/logic.js').then(L => L.seedOf(${S}.code, ${S}.game.matchId, ${node.go}))`);
  ok(st.proven && st.seed === want && st.seed !== g.hostSeed, `THE COURSE IS PICKED AFTER GO: seed = hash(code + matchId + GO) = ${st.seed} — never the host's own (${g.hostSeed})`);
  ok(await P.ev(`import('/js/firebase.js').then(f => f.set(f.dbRef('rooms/' + ${S}.code + '/jw/' + ${S}.game.matchId + '/' + ${S}.uid + '/go'), f.serverTimestamp()).then(() => false, () => true))`), '… GO is written once (a second one is refused)');
  ok(await P.ev("!!document.querySelector('.jw-hint') && /TAP TO HOP · SWIPE TO STEP/.test(document.querySelector('.jw-hint').textContent)"), 'the first-run hint: TAP TO HOP · SWIPE TO STEP');
  ok(await P.ev("document.body.dataset.look === 'night' && !!document.querySelector('.menu-btn') && !!document.querySelector('.music-btn')"), 'inside the console\'s game frame: the corner menu + music, the NIGHT look');
  await P.shot('run-start.png');
  // ---- 3b. THE LINES — a first-ever run: NO gold line; THE NEXT FRIEND'S LINE from the server's table (asked once)
  ok(await P.waitFor(`${G}.state().lines.friends.length === 1`, 10000), 'the table landed (ONE call at the run\'s start): a friend with a best');
  let ln = (await P.ev(`${G}.state()`)).lines;
  ok(ln.best === 0 && ln.shown === '0|LIAM · 7' && !ln.gold, `a FIRST-EVER run: no YOUR BEST line; THE NEXT FRIEND'S LINE = "${ln.shown.slice(2)}"`);
  // ---- 4. hops → the chunks, each stamped by the server
  await hopUp(P, 2);   // (two real taps on the calm opening lanes — nothing can hit there)
  await P.shot('line-friend-coming.png');
  // … THE NEXT FRIEND'S LINE crossed (the bot hops on through the same input path): a small burst + a quiet chime — then no friend ahead
  await P.ev(`${G}.bot(true)`);
  const crossedF = await P.waitFor(`${G}.state().best > 7`, 30000);
  await P.shot('line-friend-crossed.png');
  await P.ev(`${G}.bot(false)`);
  ln = (await P.ev(`${G}.state()`)).lines;
  const chime = await P.ev("import('/js/games/jaywalk/sfx.js').then(S => S.wanted().filter(x => x.id === 'landmark').map(x => x.vol))");
  ok(crossedF && ln.shown === '0|' && chime.length === 1 && chime[0] < 0.6, `LIAM's line crossed (lane ${(await P.ev(`${G}.state()`)).best}): a quiet chime (vol ${chime.join()}), and no friend ahead = no line ("${ln.shown}")`);
  await sleep(1400);
  st = await P.ev(`${G}.state()`); node = await nodeOf(g.code, g.m, uid);
  const chunks = Object.values(node.c || {});
  ok(st.best >= 3 && st.hops >= 5 && !(await P.ev("!!document.querySelector('.jw-hint')")), `taps hop (lane ${st.best}); the hint is gone on the first hop`);
  ok(chunks.length >= 1 && chunks.every(c => typeof c.s === 'string' && /^([UDLR][0-9a-z]+)+$/.test(c.s) && typeof c.at === 'number' && c.at >= node.go && Math.abs(c.at - srv) < 60000), `THE PROOF: ${chunks.length} chunk(s), each { s, at: the server's time }`);
  ok(await P.ev(`import('/js/firebase.js').then(f => f.set(f.dbRef('rooms/' + ${S}.code + '/jw/' + ${S}.game.matchId + '/' + ${S}.uid + '/c/777'), { s: 'U1', at: Date.now() - 30000 }).then(() => false, () => true))`), '… a chunk with a time of the phone\'s own choosing is refused by the rules');
  ok(await P.ev("document.querySelector('.jw-lanes').textContent") === String(st.best), 'the lane count on the HUD');
  await P.shot('run-hops.png');
  // ---- 5. out → the end screen → the report counted from the replay
  ok(await toEnd(P), 'the kid stands still → out → the match ends on the proof\'s `e` → THE END SCREEN');
  await sleep(600);
  let end = await P.ev(`({ cause: document.querySelector('.jw-fin-cause').textContent, n: document.querySelector('.jw-fin-n b').textContent, unit: document.querySelector('.jw-fin-n span').textContent, foot: [...document.querySelectorAll('.final-actions button')].map(x => x.textContent.trim()), res: ${S}.game.results[${S}.uid], hud: getComputedStyle(document.querySelector('.jw-hud')).visibility, confetti: !!document.querySelector('.jw-final .burst') && getComputedStyle(document.querySelector('.jw-final .burst')).display !== 'none' })`);
  ok(Object.values(CAUSE_LINES).includes(end.cause), `HOW YOU WENT OUT, in big neon words: "${end.cause}"`);
  // (H4 add-on: a car hit is named by THE VEHICLE on that lane at that tick — worked out here from the course alone; never a generic line)
  { const veh = end.res.w === 'car' ? hitVehicle(createCourse(seedOf(g.code, g.m, node.go)), { y: end.res.y, x: end.res.px, end: end.res.e }) : '';
    ok(end.res.w !== 'car' || (!!veh && end.cause === CAUSE_LINES[`car:${veh}`]), end.res.w === 'car' ? `… it names the vehicle that hit (${veh}) — never "HIT BY A CAR"` : `… (this run ended by "${end.res.w}": no vehicle to name)`); }
  ok(end.n === String(end.res.l) && /^LANES?$/.test(end.unit) && end.res.l >= 3, `the lanes: ${end.n} ${end.unit} (the host's replay of the log)`);
  ok(JSON.stringify(end.foot) === JSON.stringify(['PLAY AGAIN', 'SHARE', 'BACK TO THE CITY']), `the foot: ${end.foot.join(' · ')} (PLAY AGAIN first — never "HOP AGAIN")`);
  ok(parseFloat(await P.ev("getComputedStyle(document.querySelector('.jw-final .final-again')).borderRadius")) <= 12, 'the end screen\'s buttons: the site\'s non-pill tube (10 px corners)');
  // THE SHARE IMAGE (H4B's add-on — THE FRAME IS THE HERO, the cause ONCE): the run's own frame on the share kit's card (drawn on the phone)
  const card = await P.p.evaluate(async () => {
    const s = window.__arcade.state, [Sh, T] = await Promise.all([import('/js/games/jaywalk/share.js'), import('/js/games/jaywalk/shot.js')]);
    const shot = T.shotFor(s.game.matchId), me = s.players[s.uid], c = Sh.jwRunCard(s.game, { uid: s.uid, name: me.name });
    const cv = Sh.drawJwCard(s.game, { uid: s.uid, name: me.name, code: s.code });
    return { shot: !!shot, w: cv && cv.width, h: cv && cv.height, line: shot && shot.line, lanes: shot && shot.lanes, mode: c.mode, result: c.result, box: Sh.JW_CARD.box, url: cv ? cv.toDataURL('image/png') : null };
  });
  ok(card.shot && card.w === 1080 && card.h === 1350 && card.line === end.cause && card.lanes === end.res.l && card.mode === 'SOLO', `THE SHARE IMAGE: the run's own frame + "${card.line}" + ${card.lanes} lanes (${card.w} × ${card.h})`);
  ok(card.result === '' && card.box.w * card.box.h > 800 * 690 * 1.35, `H4B — the cause is on the card ONCE (no result line under the name) and THE FRAME IS THE HERO (${card.box.w} × ${card.box.h} of 1080 × 1350 — was 800 × 690)`);
  if (OUT && card.url) writeFileSync(join(OUT, 'share-card-solo.png'), Buffer.from(card.url.split(',')[1], 'base64'));
  ok(end.hud === 'hidden' && !end.confetti, 'the HUD is off under it; no confetti over a run\'s end');
  const r1 = await counted(g.code, g.m);
  node = await nodeOf(g.code, g.m, uid);
  const v1 = verifyNode({ code: g.code, matchId: g.m, node });
  ok(!!r1 && v1.ok && !v1.cut && v1.result.lanes === end.res.l, `the report is COUNTED — and the SERVER's own replay of the proof = ${v1.ok ? v1.result.lanes : '?'} lanes, the phone's ${end.res.l}`);
  // H4B's add-on — THE SHARE = THE PICTURE ONLY: SHARE sends ONLY THE LINK; its preview IS the run's card; a tap on it opens the site
  const L1 = await shareLink(P.p, '.jw-final .final-share');
  ok(JSON.stringify(L1.keys) === '["url"]' && /\/api\/daily\?s=[A-Za-z0-9_-]{12}$/.test(L1.url), `H4B — SHARE sends ONLY THE LINK (${JSON.stringify(L1.keys)} — no text, no file, no site line): ${L1.url}`);
  ok(/ · JAYWALK · /.test(L1.title) && L1.go === '/' && !!L1.png && L1.png.w === 540 && L1.png.h === 675 && L1.png.bytes <= 300 * 1024, `… the link's preview IS the card (og:image ${L1.png ? `${L1.png.w} × ${L1.png.h}, ${Math.round(L1.png.bytes / 1024)} KB` : 'none'}; "${L1.title}") and a tap on it opens the site ("${L1.go}")`);
  if (OUT && L1.png) writeFileSync(join(OUT, 'share-link-solo-540.png'), L1.buf);
  const slot = await dbGet(`shrp/${pid}:jaywalk`);
  ok(slot && Object.values(slot).length === 1 && Object.values(slot)[0] === L1.code, 'ONE run card a player a day — its own slot (never the day\'s DAILIES card\'s)');
  ok(await board(pid) === v1.result.lanes, `the solo board (jaywalk-solo): best ${await board(pid)} — from the replay`);
  ok(await P.waitFor("!!document.querySelector('.jw-fin-best.is-new') && /NEW BEST/.test(document.querySelector('.jw-fin-best').textContent)", 10000), 'NEW BEST on the end screen — from the server\'s own answer');
  await P.shot('end-new-best.png');
  // ---- 6. PLAY AGAIN — measured: the tap → the next run's course is up (ready to hop)
  const times = [];
  const again = async () => {
    const m0 = await P.ev(`${S}.game.matchId`);
    await P.ev("window.__t0 = 0; document.querySelector('.final-again').addEventListener('click', () => { window.__t0 = performance.now(); }, { capture: true, once: true })");
    await P.tap('.final-again');
    const up = await P.waitFor(`${S}.game && ${S}.game.matchId !== '${m0}' && !!${G} && ${G}.state().matchId === ${S}.game.matchId && ${G}.state().mode === 'run'`, 15000);
    const ms = await P.ev('window.__t0 ? performance.now() - window.__t0 : -1');
    return { up, ms, m0 };
  };
  let A = await again();
  times.push(A.ms);
  ok(A.up, `PLAY AGAIN → the next run is on (${A.ms.toFixed(0)} ms from the tap to a course ready to hop)`);
  g = await P.ev(`({ code: ${S}.code, m: ${S}.game.matchId, phase: ${S}.game.phase })`);
  st = await P.ev(`${G}.state()`);
  ok(g.m !== A.m0 && g.m[0] === 's' && g.phase === 'play' && st.proven && st.t < 600, `… a match of its own (${g.m}), proven, on a fresh clock`);
  ok(st.scenes === 1, '… the scene stayed warm: ONE night scene the whole session (no new WebGL context)');
  const keptOld = await nodeOf(g.code, A.m0, uid), fresh = await nodeOf(g.code, g.m, uid);
  ok(keptOld && keptOld.go > 0 && keptOld.e && fresh && fresh.go > keptOld.go && !fresh.e, '… the last run\'s proof is kept; the new run has its own GO');
  ok(await P.ev("!document.querySelector('.jw-final') && !document.querySelector('.jw-hint')") , '… no end screen, no hint (once per phone)');
  await hopUp(P, 2);
  ok((await P.ev(`${G}.state()`)).best >= 1, '… and it hops');
  // ---- 6b. YOUR BEST LINE: gold, at the SERVER's best — seen coming, then crossed: the burst, the new-best sound, the counter gold
  const B1 = await board(pid);
  ln = (await P.ev(`${G}.state()`)).lines;
  ok(ln.best === B1 && B1 === v1.result.lanes && ln.shown.startsWith(`${B1}|`) && !ln.record, `YOUR BEST LINE at lane ${B1} — the server-counted best (the board's ${B1}); the friend's line again ahead ("${ln.shown}")`);
  const nb0 = await P.ev("import('/js/games/jaywalk/sfx.js').then(S => S.wanted().filter(x => x.id === 'new-best').length)");
  await P.shot('line-best-coming.png');   // (two lanes up the calm opening: the gold line + its words ahead)
  await P.ev(`${G}.bot(true)`);
  const crossedB = await P.waitFor(`${G}.state().lines.record`, 30000);
  await P.shot('line-best-crossed.png');
  ln = (await P.ev(`${G}.state()`)).lines;
  await P.ev(`${G}.bot(false)`);
  const nb1 = await P.ev("import('/js/games/jaywalk/sfx.js').then(S => S.wanted().filter(x => x.id === 'new-best').length)");
  ok(crossedB && ln.record && ln.gold && (await P.ev(`${G}.state()`)).best > B1, `… CROSSED at lane ${(await P.ev(`${G}.state()`)).best}: the run is a NEW RECORD — the lane counter flashes and stays gold`);
  ok(nb1 === nb0 + 1, '… the new-best sound, once');
  ok(await toEnd(P), 'run 2 ends');
  const r2 = await counted(g.code, g.m);
  ok(!!r2, 'run 2 — seconds after run 1 — is counted too (its own report; THE 45 s GAP never holds a quick solo run)');
  ok(await P.waitFor("/YOUR BEST|NEW BEST/.test(document.querySelector('.jw-fin-best').textContent)", 10000), `… its end screen: "${await P.ev("document.querySelector('.jw-fin-best').textContent")}"`);
  const bestNow = await board(pid);
  // a few more, for the measure
  for (let i = 0; i < 3; i++) { A = await again(); if (A.up) times.push(A.ms); await hopUp(P, 1); if (i < 2) await toEnd(P); }
  times.sort((x, y) => x - y);
  console.log('PLAY_AGAIN_MS', JSON.stringify(times.map(t => Math.round(t))));
  ok(times.length >= 4 && times[Math.floor(times.length / 2)] < 1000, `PLAY AGAIN, ${times.length} taps: median ${times[Math.floor(times.length / 2)].toFixed(0)} ms, worst ${times[times.length - 1].toFixed(0)} ms (the target ≤ ~1 s)`);
  // ---- 7. a FORGED log: hops the clock never saw (tick 5000 at second 2) — written honestly stamped; the server counts it as NOTHING
  g = await P.ev(`({ code: ${S}.code, m: ${S}.game.matchId })`);
  ok(await P.ev(`import('/js/firebase.js').then(f => f.set(f.dbRef('rooms/' + ${S}.code + '/jw/' + ${S}.game.matchId + '/' + ${S}.uid + '/c/900'), { s: 'U3uwU8U8U8U8U8U8U8U8', at: f.serverTimestamp() }).then(() => true, () => false))`), 'a forged chunk (well-formed, stamped by the server) can be written …');
  await dbPut(`rooms/${g.code}/jw/${g.m}/${uid}/c`, { 0: { s: 'U3uwU8U8U8U8U8U8U8U8U8U8U8U8', at: (await nodeOf(g.code, g.m, uid)).go + 1500 } });
  ok(await toEnd(P), '… the run ends');
  const rf = await counted(g.code, g.m);
  const vf = verifyNode({ code: g.code, matchId: g.m, node: await nodeOf(g.code, g.m, uid) });
  ok(!!rf && vf.ok === false && vf.why === 'ahead of the clock', `… and the server REFUSES it (${vf.why})`);
  ok(await board(pid) === bestNow, `… the best is untouched (${bestNow})`);
  // ---- 8. BACK TO THE CITY
  await P.tap('.final-city');
  ok(await P.waitFor(`!${S}.code && !!document.querySelector('.nd-tab-play')`, 20000), 'BACK TO THE CITY → the city');
  await sleep(1200);
  ok((await dbGet(`rooms/${g.code}`)) == null, '… the solo room is gone');
  ok(!P.errs.length, `no page error (${P.errs.slice(0, 2).join(' | ') || 'none'})`);
  await P.close();
  await dropRunCards([pid]);

  // ---- 8b. THE DROPPED SIGNAL (H4 — `--drop`): a REAL offline gap mid-run — the phone's database line cut, the run played on, the
  // queued chunks landing together when it is back → the server's own replay counts the FULL honest run (never cut, never refused)
  if (DROP) {
    const Q = await phone(`jwd${Date.now() % 100000}`);
    const who = await pidOf(Q);
    await dbPut(`testAdmins/${who.pid}`, true);
    await Q.ev('sessionStorage.clear()');
    await Q.open();
    await Q.waitFor("import('/js/config.js').then(c => c.isOwnerTest('jaywalk'))", 20000);
    await Q.ev("import('/js/host.js').then(m => m.playSolo('jaywalk'))");
    for (const secs of [30, 60]) {
      let done = false;
      for (let attempt = 0; attempt < 4 && !done; attempt++) {
        await Q.waitFor(`!!${G} && ${G}.state().mode === 'run' && ${G}.state().proven && ${S}.game.phase === 'play'`, 30000);
        const gd = await Q.ev(`({ code: ${S}.code, m: ${S}.game.matchId })`);
        await Q.ev(`${G}.bot(true, { lazy: true })`);
        await Q.waitFor(`${G}.state().chunks >= 2 || ${G}.state().over`, 30000);   // (mid-run: a few hops are already proven when the line goes)
        await sleep(1200);
        const alive = async () => !(await Q.ev(`${G}.state().over`));
        if (await alive()) {
          const sent0 = (await Q.ev(`${G}.state()`)).chunks;
          await Q.ev("import('/js/firebase.js').then(f => f.goOffline())");
          const tOff = Date.now();
          while (Date.now() - tOff < secs * 1000 && await alive()) await sleep(500);
          const lasted = (Date.now() - tOff) / 1000, stillIn = await alive(), offline = await Q.ev(`${G}.state()`);
          if (lasted >= secs - 1) {
            const before = await nodeOf(gd.code, gd.m, who.uid), nBefore = Object.keys((before && before.c) || {}).length;
            await Q.ev("import('/js/firebase.js').then(f => f.goOnline())");
            await Q.ev(`${G}.bot(false)`);
            ok(await toEnd(Q, 90000), `a ${secs} s DROP mid-run (the line cut for ${lasted.toFixed(0)} s, the kid ${stillIn ? 'still hopping' : 'out meanwhile'}; ${offline.chunks - sent0} chunk(s) queued): back online → the run ends on the podium`);
            const node = await nodeOf(gd.code, gd.m, who.uid), times = chunkTimes(node.c), v = verifyNode({ code: gd.code, matchId: gd.m, node });
            let gap = 0, prev = node.go; for (const t of times) { gap = Math.max(gap, t.at - prev); prev = t.at; }
            const res = await Q.ev(`${S}.game.results[${S}.uid]`), mine = await Q.ev(`${G}.state()`);
            ok(nBefore < times.length && gap >= (secs - 3) * 1000, `… the server saw a SILENCE of ${(gap / 1000).toFixed(1)} s, then ${times.length - nBefore} chunk(s) landing together`);
            ok(v.ok && !v.cut && v.result.lanes === mine.best && res.l === mine.best && !res.cut && !res.bad, `… THE FULL HONEST RUN COUNTS: the server's replay = ${v.ok ? v.result.lanes : v.why} lanes = the phone's ${mine.best} (no cut, not refused)`);
            ok(!!(await counted(gd.code, gd.m, 30000)), '… and the report is counted');
            done = true;
          } else await Q.ev("import('/js/firebase.js').then(f => f.goOnline())");
        }
        if (!done) { await Q.ev(`${G}.bot(false)`); await toEnd(Q, 60000); }
        // the next run (PLAY AGAIN)
        await Q.waitFor("!!document.querySelector('.final-again')", 15000);
        const m0 = await Q.ev(`${S}.game.matchId`);
        await Q.tap('.final-again');
        await Q.waitFor(`${S}.game && ${S}.game.matchId !== '${m0}'`, 15000);
      }
      ok(done, `the ${secs} s drop was played (a bot that lived through it)`);
    }
    ok(!Q.errs.length, `no page error in the drop runs (${Q.errs.slice(0, 2).join(' | ') || 'none'})`);
    await Q.close();
  }

  // ---- 9. PERFORMANCE: the real view, 390 × 844 @3, 4× CPU, the bot playing — per tier
  if (PERF) {
    const Q = await phone(`jwp${Date.now() % 100000}`, 3);
    const who = await pidOf(Q);
    await dbPut(`testAdmins/${who.pid}`, true);
    await Q.ev('sessionStorage.clear()');
    await Q.open();
    await Q.waitFor("import('/js/config.js').then(c => c.isOwnerTest('jaywalk'))", 20000);
    await Q.ev("import('/js/host.js').then(m => m.playSolo('jaywalk'))");
    await Q.waitFor(`!!${G} && ${G}.state().mode === 'run'`, 30000);
    const cdp = await Q.p.createCDPSession();
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const rows = [];
    for (const tier of [2, 1, 0]) {
      await Q.ev(`${G}.setTier(${tier}); ${G}.bot(true)`);
      await sleep(1200);
      await Q.ev(`${G}.clearFrames()`);
      const end = Date.now() + 7000;
      while (Date.now() < end) {   // (the bot plays on: a run that ends is hopped again at once)
        if (await Q.ev(`${S}.game && ${S}.game.phase === 'final' && !!document.querySelector('.final-again')`)) { await Q.ev("document.querySelector('.final-again').click()"); await Q.waitFor(`!!${G} && ${G}.state().mode === 'run'`, 8000); await Q.ev(`${G}.setTier(${tier}); ${G}.bot(true)`); }
        await sleep(200);
      }
      const m = await Q.ev(`(() => { const f = ${G}.frames().slice().sort((a, b) => a - b), c = ${G}.cost().slice().sort((a, b) => a - b), q = (a, p) => a[Math.min(a.length - 1, Math.floor(a.length * p))], avg = f.reduce((a, b) => a + b, 0) / f.length, i = ${G}.state().info; return { n: f.length, fps: 1000 / avg, avg, p95: q(f, 0.95), worst: f[f.length - 1], work: c.reduce((a, b) => a + b, 0) / c.length, work95: q(c, 0.95), calls: i.calls, tris: i.tris, dpr: i.dpr, tier: i.tier, bloom: i.bloom }; })()`);
      rows.push(m);
      console.log('PERF', JSON.stringify({ tier, fps: +m.fps.toFixed(1), frame: +m.avg.toFixed(1), p95: +m.p95.toFixed(1), worst: +m.worst.toFixed(1), work: +m.work.toFixed(2), work95: +m.work95.toFixed(2), calls: m.calls, tris: m.tris, dpr: m.dpr, frames: m.n }));
      ok(m.tier === tier && m.n > 150 && m.fps > 50, `4× CPU, tier ${tier} (@${m.dpr}${m.bloom ? ', bloom' : ''}): ${m.fps.toFixed(1)} fps · ${m.avg.toFixed(1)} ms a frame (p95 ${m.p95.toFixed(1)}, worst ${m.worst.toFixed(1)}) · ${m.work.toFixed(2)} ms of work · ${m.calls} draw calls`);
    }
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await Q.close();
  }
} catch (e) { fails.push(`threw: ${e && e.stack || e}`); }
await b.close();
console.log(`\n${n - fails.length}/${n} checks — ${fails.length ? `FAILED:\n  ${fails.join('\n  ')}` : 'all green'}`);
process.exit(fails.length ? 1 : 0);
