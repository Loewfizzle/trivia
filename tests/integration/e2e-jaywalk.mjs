// JAYWALK H3 — THE SOLO RUN end to end, on the emulators + scripts/serve.mjs --emu (NEVER THE LIVE SITE), Chromium as a phone (390 × 844):
//   · A STRANGER PLAYS IT (THE GO-LIVE PASS — JAYWALK is playable): their PLAY shelf lists JAYWALK (no · TEST) → its card → PLAY NOW; the
//     stranger's run is COUNTED (no owner set-up anywhere)
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
import { CAUSE_LINES, DAY_LINES, hitVehicle } from '../../js/games/jaywalk/causes.js';
import { knowAll } from '../../js/games/jaywalk/variety.js';   // (VARIETY B1 — the area traffic: the names as the phone drew them)
import { createCourse } from '../../js/games/jaywalk/course.js';
import { seedOf } from '../../js/games/jaywalk/logic.js';
import { memAt, memLine, seasonLine, browserMb, JW_FINAL_BUDGET_MB } from './kit/jaywalk-mem.mjs';
import { imgSize } from './kit/img-size.mjs';   // (THE FIX PASS: the link card is a JPEG since THE BEFORE-LAUNCH PASS)

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
// (J2 — COURSE RULES v2: JW_CV=0 plays v2 from the start — serve.mjs started with JW_CV_SWITCH_MS=0 so the local /api agrees; without it the
//  version is the one in force at the run's GO — today v1, from 2026-11-22 09:00 UTC v2)
const JW_CV = process.env.JW_CV != null ? Number(process.env.JW_CV) : null;
// (J4 — WINTER: JW_DAY=2026-12-24 plays on that season's day (the page's test-only `&jwday=`) — the run must count exactly as on any other day)
const JW_DAY = /^\d{4}-\d{2}-\d{2}$/.test(process.env.JW_DAY || '') ? process.env.JW_DAY : null;
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

async function phone(slot, dpr = Number(process.env.E2E_DPR) || 2, name = 'HOPPER') {   // (E2E_DPR=3: THE END SCREEN's MEMORY measured at a phone's own pixel ratio)
  const ctx = await b.createBrowserContext();
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e.message || e)));
  let ups = 0;   // (BEFORE THE FLIP: the run card's uploads — every /api/daily shareCard this phone sends)
  p.on('request', r => { try { if (/\/api\/daily/.test(r.url()) && /"shareCard"/.test(r.postData() || '')) ups++; } catch { /* fine */ } });
  if (process.env.JW_DEBUG) p.on('console', m => console.log(`   [${m.type()}] ${m.text().slice(0, 240)}`));
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: dpr, isMobile: true, hasTouch: true });
  await p.evaluateOnNewDocument(s => { try { localStorage.setItem('nd:entered', '1'); localStorage.setItem(`na:${s[0]}:profile`, JSON.stringify({ name: s[1], color: 'cyan', avatar: 'bolt' })); } catch { /* fine */ } }, [slot, name]);
  // (BEFORE THE FLIP — THE CAMERA + THE TAKES ARE PINNED: this phone has the LAB's odd picks saved — ZOOM 7, TURNED, every B take; the game ignores them)
  await p.evaluateOnNewDocument(() => { try { for (const [k, v] of [['zoom', '7'], ['angle', 'turned'], ['snd:hop', 'b'], ['snd:land-wood', 'b'], ['snd:train-pass', 'b']]) localStorage.setItem(`jw:lab:${k}`, v); } catch { /* fine */ } });
  const waitFor = async (js, ms = 20000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* navigating */ } await sleep(50); } return false; };
  const open = async () => { await p.goto(guardUrl(`${BASE}/?emu&slot=${slot}&city=2&when=2026-11-10T20:30${JW_CV != null ? `&jwcv=${JW_CV}` : ''}${JW_DAY ? `&jwday=${JW_DAY}` : ''}`, 'e2e-jaywalk.mjs'), { waitUntil: 'domcontentloaded' }); if (!await waitFor(UP, 60000)) throw new Error('the city never came up'); };
  await open();
  const ev = js => p.evaluate(js);
  // (THE PROOF PASS — the inbox's "e2e-jaywalk red at PLAY NOW", Nov 20 ~4:45 am: the tap read its target's place while its SHEET WAS STILL
  //  SLIDING IN (the card is `.is-in` from the first frame of its entry) — the finger landed where the button had been, nothing started,
  //  25 s later the check failed; on a slow moment only. THE WAITS RULE: wait for the actual condition — the target has stopped moving
  //  (the same box three samples running) — then tap it.)
  const boxOf = sel => p.evaluate(q => { const el = document.querySelector(q); if (!el) return null; const x = el.getBoundingClientRect(); return [x.left + x.width / 2, x.top + x.height / 2, x.width, x.height]; }, sel);
  const tap = async sel => { let r = await boxOf(sel), same = 0; for (let i = 0; r && same < 3 && i < 60; i++) { await sleep(50); const q = await boxOf(sel); if (!q) { r = null; break; } same = Math.abs(q[0] - r[0]) + Math.abs(q[1] - r[1]) < 0.5 ? same + 1 : 0; r = q; } if (!r) return null; await p.touchscreen.tap(r[0], r[1]); return r; };
  const shot = async name => { if (OUT) await p.screenshot({ path: join(OUT, name) }); };
  return { p, ev, waitFor, open, tap, shot, errs, uploads: () => ups, close: () => ctx.close() };
}
const hopUp = async (P, k) => { for (let i = 0; i < k; i++) { await P.p.touchscreen.tap(195, 520); await sleep(230); } };
const pidOf = async P => { const uid = await P.ev(`${S}.uid`); for (let i = 0; i < 60; i++) { const pid = await dbGet(`uids/${uid}`); if (pid) return { uid, pid }; await sleep(250); } return { uid, pid: null }; };
const nodeOf = async (code, m, uid) => dbGet(`rooms/${code}/jw/${m}/${uid}`);
/** the run on screen to its end: the kid stands still — the blackout (or the traffic) takes them */
// H6B — THE END SCREEN's MEMORY (kit/jaywalk-mem.mjs): what the page holds on each run's FINAL screen (a beat after it is up: the scene
// resting, the share card built) + once mid-run for scale
const mems = [], bpid = b.process() && b.process().pid;
const memFinal = async (P, tag) => { await sleep(1500); const m = await memAt(P.p); mems.push({ tag, ...m }); console.log(memLine(tag, m, browserMb(bpid))); console.log(seasonLine(tag, m)); return m; };
let endAt = 0;   // (when the last end screen came up)
const toEnd = async (P, ms = 45000) => { const up = await P.waitFor(`${S}.game && ${S}.game.phase === 'final' && !!document.querySelector('.jw-final .jw-fin-cause')`, ms); endAt = Date.now(); return up; };
// (H6B — a run that PAID XP opens the console's END-OF-ROUND MOMENT ≈ 4.5 s after the end screen, OVER its buttons: a kid run down early
//  got it here (the course is picked after GO: about 1 run in 3), the usual first run — lost standing in the fog — never showed one. Its window is
//  waited out; CONTINUE if it came — as the match check does.)
const pastMoment = async P => {
  while (Date.now() - endAt < 6500 && !(await P.ev("!!document.querySelector('.pg-moment')"))) await sleep(200);
  for (let i = 0; i < 10 && await P.ev("!!document.querySelector('.pg-moment')"); i++) {
    await P.ev("(() => { const m = document.querySelector('.pg-moment'), b = m && m.querySelector('.pg-btn'); if (b && m.classList.contains('is-end')) b.click(); else if (m) m.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); })()");
    await sleep(700);
  }
};
const board = async pid => { const s = await dbGet(`pstats/${pid}`); return s && s.b && s.b['jaywalk-solo'] ? s.b['jaywalk-solo'].a : null; };
/** H4B's add-on — THE SHARE = THE PICTURE ONLY: tap `sel` with the share sheet stubbed → what was shared + the link's page + its picture */
async function shareLink(page, sel, spent = false, onReady = null) {
  // (`spent`: the tap's user activation is gone by the time the upload answers — an iPhone's case: navigator.userActivation says so)
  await page.evaluate(sp => { window.__shared = []; navigator.share = async d => { window.__shared.push(d); }; navigator.canShare = () => true; try { if (sp) Object.defineProperty(navigator, 'userActivation', { configurable: true, get: () => ({ isActive: false, hasBeenActive: true }) }); else delete navigator.userActivation; } catch { /* fine */ } }, spent);
  await page.evaluate(q => document.querySelector(q).click(), sel);
  // (BEFORE THE FLIP — THE CARD UPLOADS ONLY ON SHARE: a tap the upload SPENT → the console's SHARE reads lit ("ready"): one more tap
  //  shares the link inside its own gesture; a live tap shares at once)
  let out = null, again = false;
  for (let i = 0; i < 100 && !(out && out.length); i++) {
    out = await page.evaluate(() => window.__shared);
    if (!(out && out.length)) {
      if (!again && await page.evaluate(q => { const b = document.querySelector(q); return !!b && b.classList.contains('is-ready') && !b.classList.contains('is-busy'); }, sel)) { again = true; if (onReady) await onReady(); await page.evaluate(q => document.querySelector(q).click(), sel); }
      await new Promise(r => setTimeout(r, 150));
    }
  }
  const d = (out && out[0]) || {}, url = d.url || '';
  const html = url ? await fetch(url, { redirect: 'manual' }).then(r => r.text()).catch(() => '') : '';
  const meta = k => (new RegExp(`<meta property="${k}" content="([^"]*)"`).exec(html) || [])[1] || '';
  const img = meta('og:image').replace(/&amp;/g, '&');
  const png = img ? Buffer.from(await fetch(img).then(r => r.arrayBuffer())) : Buffer.alloc(0);
  return { again, keys: Object.keys(d).sort(), url, code: (/[?&]s=([A-Za-z0-9_-]{12})/.exec(url) || [])[1] || '', title: meta('og:title'), img, go: (/url=([^"]*)"/.exec(html) || [])[1] || '',
    png: imgSize(png), buf: png };
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
  // ---- 1. A STRANGER (THE GO-LIVE PASS — JAYWALK is playable for everyone): the PLAY shelf lists it, no · TEST, no owner set-up
  const P = await phone(`jw${Date.now() % 100000}`);
  const { uid, pid } = await pidOf(P);
  ok(!!pid, 'the phone has its profile');
  ok(await P.ev("import('/js/config.js').then(c => c.isPlayable('jaywalk') && !c.isOwnerTest('jaywalk'))"), 'a stranger: JAYWALK is playable — never a TEST');
  await P.tap('.nd-tab-play');
  ok(await P.waitFor("!!document.querySelector('.nd-shelf-sheet.is-in .nd-shelf-row[data-game=\"jaywalk\"]')", 6000), 'a stranger: the dock\'s PLAY → THE GAMES SHELF lists JAYWALK');
  // (THE PROOF PASS: the count is the config's — HIGH RISE's go-live made it five; this check still said four)
  ok(await P.ev("import('/js/config.js').then(c => document.querySelectorAll('.nd-shelf-row').length === c.GAMES.filter(g => g.playable).length && !/TEST/.test(document.querySelector('.nd-shelf-row[data-game=\"jaywalk\"]').textContent))"), '… every playable game, no more — JAYWALK unmarked (no · TEST)');
  await P.shot('stranger-shelf.png');
  // (THE LINES: a FRIEND with a server-counted JAYWALK best of 7 lanes — a real profile of their own, on the stranger's friends list)
  const FR = await phone(`jwf${Date.now() % 100000}`, 1, 'LIAM');
  const friend = await pidOf(FR);
  await FR.close();
  await dbPut(`pstats/${friend.pid}/b/jaywalk-solo`, { a: 7 });
  await dbPut(`pfr/${pid}/f/${friend.pid}`, Date.now());
  await P.tap('.nd-shelf-row[data-game="jaywalk"]');
  ok(await P.waitFor("!!document.querySelector('.nd-card-sheet.is-in .nd-card[data-game=\"jaywalk\"] .nd-card-solo')", 8000), 'its row → THE GAME CARD with PLAY NOW');
  await P.shot('stranger-card.png');
  const tPlay = Date.now();
  await P.tap('.nd-card-solo');
  ok(await P.waitFor(`${S}.game && ${S}.game.id === 'jaywalk' && !!document.querySelector('.jw-game canvas.jw-canvas') && !!${G}`, 25000), `PLAY NOW → the game's own screen (${Date.now() - tPlay} ms from the tap — THE SOLO START's walk inside)`);
  ok(await P.ev("getComputedStyle(document.querySelector('.bg')).display === 'none' && document.body.classList.contains('jw-on')"), 'SMOOTH 3: the app\'s animated background is off behind the full-screen stage');
  // ---- 2b. JT2 — TAP TO START: the kid waits on the start line; NOTHING ticks, nothing is written (no stamp, no GO) — a WAIT of 60 s
  // (THE PROOF's "GO within 5 s of the stamp" must hold however long the wait), then ONE tap starts the run — it counts (step 5's report)
  { ok(await P.waitFor(`${G}.state().waiting && !!document.querySelector('.jw-start .jw-start-go')`, 8000), 'TAP TO START: the start line, its words up');
    const w = await P.ev(`({ s: ${G}.state(), go: document.querySelector('.jw-start-go').textContent, fs: parseFloat(getComputedStyle(document.querySelector('.jw-start-go')).fontSize), menu: !!document.querySelector('.menu-btn'), music: !!document.querySelector('.music-btn') })`);
    ok(w.go === 'TAP TO START' && w.fs >= 24 && w.s.mode === 'wait' && w.s.t === 0 && w.menu && w.music, `… "${w.go}" (${w.fs} px — over the end card's main button), mode ${w.s.mode}, tick ${w.s.t}; ☰ + the sound still there`);
    for (const lk of ['night', 'day']) { await P.ev(`import('/js/games/kit/look.js').then(m => m.saveLook('${lk}'))`); await P.waitFor(`${G}.state().info.look === '${lk}'`, 6000); await sleep(1800); await P.shot(`jt2-tap-to-start-${lk}-390.png`); }
    const g0 = await P.ev(`({ code: ${S}.code, m: ${S}.game.matchId })`);
    const WAIT = Number(process.env.JT2_WAIT_MS || 60000);
    await sleep(WAIT);
    const w2 = await P.ev(`${G}.state()`), tree = await dbGet(`rooms/${g0.code}/jw/${g0.m}`);
    ok(w2.waiting && w2.mode === 'wait' && w2.t === 0 && w2.hops === 0 && tree == null, `… ${Math.round(WAIT / 1000)} s on the start screen: still waiting — no tick, no stamp, no GO (the proof tree: ${tree == null ? 'empty' : JSON.stringify(tree).slice(0, 60)})`);
    ok(await P.ev("document.querySelector('.jw-start-l').textContent") === 'TAP TO HOP · SWIPE TO STEP' && await P.ev("!document.querySelector('.jw-game.is-veiled')"), '… the controls under it (the first-run hint\'s words); a solo start is never veiled');
    await P.p.touchscreen.tap(195, 520); }
  // ---- 3. GO with the server's time → the course
  ok(await P.waitFor(`${G}.state().mode === 'run'`, 8000), 'GO landed: the run is on — THE TAP started it');
  { const g1 = await P.ev(`({ code: ${S}.code, m: ${S}.game.matchId })`), tr = await dbGet(`rooms/${g1.code}/jw/${g1.m}`), me = tr && tr[uid];
    ok(!!tr && typeof tr.t0 === 'number' && !!me && me.go - tr.t0 >= 0 && me.go - tr.t0 <= 5000, `THE STAMP AT THE TAP: t0 then the GO ${me ? me.go - tr.t0 : '?'} ms after it (≤ 5 s — the rules' window, after a 60 s wait)`);
    ok(await P.waitFor(`${G}.state().best >= 1 && !document.querySelector('.jw-start')`, 4000), '… the tap that started it was its first hop (HOP TO START); the start words gone'); }
  if (JW_DAY) { await P.waitFor(`${G}.state().season && (${G}.state().season.pack || !!${G}.state().season.sp && !(${G}.state().season.winter > 0))`, 8000); const se = await P.ev(`${G}.state().season`); ok(se && se.day === `d${JW_DAY.replace(/-/g, '')}` && !!se.sp, `J4 + JT1 SEASONS: the run's season = ${se && se.day} · autumn ${se && se.autumn} · winter ${se && se.winter} · christmas ${se && se.christmas} · snow ${se && se.snowfall} · hat ${se && se.hat} · fireworks ${se && se.fireworks} · THE SEASONAL PACK ${se && se.sp ? 'in' : 'not in by GO (the normal look)'}${se && se.pack ? ' + the winter models' : ''}`); }
  { const i = await P.ev(`${G}.state().info`); ok(i.zoom === 8 && i.angle === 'straight', `THE CAMERA IS PINNED: the lab's ZOOM 7 · TURNED saved on this phone — the game draws ZOOM ${i.zoom} · ${String(i.angle).toUpperCase()}`); }
  let g = await P.ev(`({ code: ${S}.code, m: ${S}.game.matchId, mode: ${S}.game.mode, phase: ${S}.game.phase, hostSeed: ${S}.game.seed, solo: !!(${S}.meta.settings && ${S}.meta.settings.solo && ${S}.meta.settings.solo.on) })`);
  ok(g.mode === 'solo' && g.phase === 'play' && g.solo && g.m[0] === 's', `PLAY NOW's solo room, SOLO ENDLESS, playing (match ${g.m})`);
  let node = await nodeOf(g.code, g.m, uid), st = await P.ev(`${G}.state()`);
  const srv = await P.ev("import('/js/firebase.js').then(f => f.serverNow())");
  ok(node && typeof node.go === 'number' && Math.abs(node.go - srv) < 15000 && st.go === node.go, `the proof node's GO = the SERVER's time (${node && node.go}), read back by the phone`);
  const want = await P.ev(`import('/js/games/jaywalk/logic.js').then(L => L.seedOf(${S}.code, ${S}.game.matchId, ${node.go}))`);
  ok(st.proven && st.seed === want && st.seed !== g.hostSeed, `THE COURSE IS PICKED AFTER GO: seed = hash(code + matchId + GO) = ${st.seed} — never the host's own (${g.hostSeed})`);
  // J2 — COURSE RULES v2: the proof carries the version in force at its GO (`cv`, written once beside it) — the phone plays exactly that one
  { const V = await import('../../js/games/jaywalk/versions.js'); if (JW_CV != null) V.setCvSwitch(JW_CV);
    const wantCv = V.versionAt(node.go); let cvNode = null;
    for (let k = 0; k < 40 && cvNode == null; k++) { cvNode = (await nodeOf(g.code, g.m, uid) || {}).cv ?? null; if (cvNode == null) await sleep(150); }
    const stCv = (await P.ev(`${G}.state()`)).cv;
    ok(cvNode === wantCv && stCv === wantCv, `COURSE RULES v${wantCv}: the proof's cv (${cvNode}) = the version in force at its GO = the course the phone plays (v${stCv})`);
    ok(await P.ev(`import('/js/firebase.js').then(f => f.set(f.dbRef('rooms/' + ${S}.code + '/jw/' + ${S}.game.matchId + '/' + ${S}.uid + '/cv'), ${wantCv === 2 ? 1 : 2}).then(() => false, () => true))`), '… cv is written once (another version is refused)'); }
  ok(await P.ev(`import('/js/firebase.js').then(f => f.set(f.dbRef('rooms/' + ${S}.code + '/jw/' + ${S}.game.matchId + '/' + ${S}.uid + '/go'), f.serverTimestamp()).then(() => false, () => true))`), '… GO is written once (a second one is refused)');
  ok(await P.ev("!document.querySelector('.jw-hint')"), 'the first-run hint said its words on the start line — gone with the start tap (JT2)');
  // (H5B — BOTH looks: the phone's GAME LOOK decides (AUTO = the real sun — so the check picks one: NIGHT first, DAY below))
  await P.ev("import('/js/games/kit/look.js').then(m => m.saveLook('night'))");
  ok(await P.waitFor(`document.body.dataset.look === 'night' && ${G}.state().info.look === 'night' && document.querySelector('.jw-game').dataset.look === 'night'`, 6000) && await P.ev("!!document.querySelector('.menu-btn') && !!document.querySelector('.music-btn')"), 'inside the console\'s game frame: the corner menu + music; GAME LOOK NIGHT → the night look (the scene, the stage, the console)');
  await P.waitFor(`(() => { const s = ${G}.state().info.sky; return !!s && /night/.test(s.now) && !s.fading; })()`, 8000);   // (the shot waits the look switch's cross-fade out — a day band over a night world read as broken)
  await P.shot('run-start.png');
  // ---- 3b. THE LINES — a first-ever run: NO gold line; THE NEXT FRIEND'S LINE from the server's table (asked once)
  ok(await P.waitFor(`${G}.state().lines.friends.length === 1`, 10000), 'the table landed (ONE call at the run\'s start): a friend with a best');
  // (THE POLISH PASS — YOUR TABLE's grid: three more friends — a 3 / 2 / 2-digit best + names of 12 · 10 · 8 letters (HOPPER = 6) — so the
  //  table has 4 rows of uneven scores + the owner's name lengths (LIAM drops off: 4 rows at most). Seeded only now: this run's lines were read (above), the end screen's table is asked later; removed again after the table's shots)
  const fpid = () => 'pjw' + Array.from({ length: 9 }, () => 'abcdefghijkmnpqrstuvwxyz23456789'[Math.floor(Math.random() * 32)]).join('');   // (fresh each run — no state carried between runs)
  const TBL = [[fpid(), 'MAXIMILIANOS', 212], [fpid(), 'ALEXANDRIA', 98], [fpid(), 'DIMETIME', 41]]   // (pid-like: p + 11 — core/friends.js#isPidLike);
  for (const [fp, n, v] of TBL) { await dbPut(`profiles/${fp}`, { n, x: 4200, a: 'bolt', c: 'pink', m: 9 }); await dbPut(`pstats/${fp}/b/jaywalk-solo`, { a: v }); await dbPut(`pfr/${pid}/f/${fp}`, Date.now()); }
  let ln = (await P.ev(`${G}.state()`)).lines;
  ok(ln.best === 0 && ln.shown === '0|LIAM · 7' && !ln.gold, `a FIRST-EVER run: no YOUR BEST line; THE NEXT FRIEND'S LINE = "${ln.shown.slice(2)}"`);
  // ---- 4. hops → the chunks, each stamped by the server
  await hopUp(P, 2);   // (two real taps on the calm opening lanes — nothing can hit there)
  await P.shot('line-friend-coming.png');
  // … THE NEXT FRIEND'S LINE crossed (the bot hops on through the same input path): a small burst + a quiet chime — then no friend ahead
  await P.ev(`${G}.bot(true, { steady: true })`);   // (B2 — THE FLAKE's second spot: the greedy bot died at lane 5, short of LIAM's 7 — and the YOU ROW's places follow this run's best)
  const crossedF = await P.waitFor(`${G}.state().best > 7`, 30000);
  await P.shot('line-friend-crossed.png');
  await P.ev(`${G}.bot(false)`);
  ln = (await P.ev(`${G}.state()`)).lines;
  const chime = await P.ev("import('/js/games/jaywalk/sfx.js').then(S => S.wanted().filter(x => x.id === 'area-arrive').map(x => x.vol))");
  { const tk = await P.ev("import('/js/games/jaywalk/sfx.js').then(S => S.wanted().filter(x => x.id === 'hop' || x.id === 'land-wood' || x.id === 'train-pass').map(x => x.ab))");
    ok(tk.length > 0 && tk.every(x => x === 'a'), `THE TAKES ARE PINNED: the lab's B takes saved on this phone — the game played take A (${tk.length} hops / landings, ${[...new Set(tk)].join(' ')})`); }
  ok(crossedF && ln.shown === '0|' && chime.length === 1 && chime[0] < 0.6, `LIAM's line crossed (lane ${(await P.ev(`${G}.state()`)).best}): a quiet chime (vol ${chime.join()}), and no friend ahead = no line ("${ln.shown}")`);
  await sleep(1400);
  st = await P.ev(`${G}.state()`); node = await nodeOf(g.code, g.m, uid);
  const chunks = Object.values(node.c || {});
  ok(st.best >= 3 && st.hops >= 5 && !(await P.ev("!!document.querySelector('.jw-hint')")), `taps hop (lane ${st.best}); the hint is gone on the first hop`);
  ok(chunks.length >= 1 && chunks.every(c => typeof c.s === 'string' && /^([UDLR][0-9a-z]+)+$/.test(c.s) && typeof c.at === 'number' && c.at >= node.go && Math.abs(c.at - srv) < 60000), `THE PROOF: ${chunks.length} chunk(s), each { s, at: the server's time }`);
  ok(await P.ev(`import('/js/firebase.js').then(f => f.set(f.dbRef('rooms/' + ${S}.code + '/jw/' + ${S}.game.matchId + '/' + ${S}.uid + '/c/777'), { s: 'U1', at: Date.now() - 30000 }).then(() => false, () => true))`), '… a chunk with a time of the phone\'s own choosing is refused by the rules');
  ok(await P.ev("document.querySelector('.jw-lanes').textContent") === String(st.best), 'the lane count on the HUD');
  await P.shot('run-hops.png');
  console.log(memLine('mid-run (for scale)', await memAt(P.p), browserMb(bpid)));
  // H5B — THE DAY LOOK in a solo run: ☰ → Settings → GAME LOOK: DAY re-themes the run at once (read live); the run goes on
  const before = await P.ev(`${G}.state()`);
  await P.ev("import('/js/games/kit/look.js').then(m => m.saveLook('day'))");
  ok(await P.waitFor(`document.body.dataset.look === 'day' && ${G}.state().info.look === 'day' && document.querySelector('.jw-game').dataset.look === 'day' && document.querySelector('.jw-skyline').dataset.look === 'day'`, 6000), 'GAME LOOK: DAY mid-run → the day look at once (the scene, the stage, the band)');
  { const now = await P.ev(`${G}.state()`); ok(now.seed === before.seed && now.best >= before.best && now.go === before.go && now.info.bloom === false, `the same run (the look is a view): the same course + clock, its lanes kept (${now.best}); no bloom by day`); }
  ok(await P.ev("import('/js/games/jaywalk/index.js').then(m => m.musicFor()[0])") === 'mood:day', 'the music follows the look: the day deck');
  ok(await P.waitFor(`(() => { const q = document.querySelectorAll('.jw-sky-pic'), op = +getComputedStyle(q[1]).opacity, on = op === 1 ? q[1] : op === 0 ? q[0] : null; return !!on && on.style.backgroundImage.includes('skyline-day'); })()`, 9000), 'THE LOOK SWITCH (H6B): the band cross-fades to the DAY picture — never a jump');
  await P.shot('run-day.png');
  // ---- 5. out → the end screen → the report counted from the replay
  ok(await toEnd(P),'the kid stands still → out → the match ends on the proof\'s `e` → THE END SCREEN');
  await sleep(600);
  await memFinal(P, 'run 1 — the final screen');
  let end = await P.ev(`({ cause: document.querySelector('.jw-fin-cause').textContent, n: document.querySelector('.jw-fin-n b').textContent, unit: document.querySelector('.jw-fin-n > span').textContent, foot: [...document.querySelectorAll('.final-actions button')].map(x => x.textContent.trim()), res: ${S}.game.results[${S}.uid], hud: getComputedStyle(document.querySelector('.jw-hud')).visibility, confetti: !!document.querySelector('.jw-final .burst') && getComputedStyle(document.querySelector('.jw-final .burst')).display !== 'none' })`);
  ok([...Object.values(CAUSE_LINES), ...Object.values(DAY_LINES)].includes(end.cause), `HOW YOU WENT OUT, in big neon words: "${end.cause}"`);
  // (H4 add-on: a car hit is named by THE VEHICLE on that lane at that tick — worked out here from the course alone; never a generic line)
  { const hc = () => hitVehicle(createCourse(seedOf(g.code, g.m, node.go), { cv: end.res.cv === 2 ? 2 : 1 }), { y: end.res.y, x: end.res.px, end: end.res.e });   // (J2 FIX: the row's own course version — a v2 run was rebuilt on v1)
    // (VARIETY B1: the phone names the vehicle IT drew — the area's model once that model was in on the page, else the plain one: either is right)
    knowAll(false); const veh = end.res.w === 'car' ? hc() : ''; knowAll(true); const vehA = end.res.w === 'car' ? hc() : ''; knowAll(false);
    ok(end.res.w !== 'car' || (!!veh && (end.cause === CAUSE_LINES[`car:${veh}`] || end.cause === CAUSE_LINES[`car:${vehA}`])), end.res.w === 'car' ? `… it names the vehicle that hit (${veh}${vehA !== veh ? ` / its area's ${vehA}` : ''}) — never "HIT BY A CAR"` : `… (this run ended by "${end.res.w}": no vehicle to name)`); }
  ok(end.n === String(end.res.l) && /^LANES?$/.test(end.unit) && end.res.l >= 3, `the lanes: ${end.n} ${end.unit} (the host's replay of the log)`);
  ok(await P.ev("document.querySelector('.jw-final .sheet-kicker').textContent") === 'JAYWALK · SOLO' && parseFloat(await P.ev("getComputedStyle(document.querySelector('.jw-final .sheet-kicker')).fontSize")) >= 17, 'THE HEADER: JAYWALK · SOLO — big + bold (H5B)');
  await pastMoment(P);   // (the console's XP moment fades in over the end screen a beat after it: the shot is of the end screen itself)
  await P.shot('end-day.png');
  await P.ev("import('/js/games/kit/look.js').then(m => m.saveLook('night'))");
  ok(await P.waitFor("document.body.dataset.look === 'night'", 6000) && await P.ev("import('/js/games/jaywalk/index.js').then(m => m.musicFor()[0])") === 'mood:evening', '… back to NIGHT for the rest: the evening deck');
  ok(JSON.stringify(end.foot) === JSON.stringify(['PLAY AGAIN', 'SHARE', 'HOME']), `END-SCREEN STANDARD A (CITY F) — the foot: ${end.foot.join(' · ')} (THE BAR first — never "HOP AGAIN"; then the quiet SHARE · CITY)`);
  { const bar = await P.ev("(() => { const b = document.querySelector('.jw-final .final-bar.final-again'), cs = getComputedStyle(b), r = b.getBoundingClientRect(), l = [...document.querySelectorAll('.jw-final .final-link')].map(x => { const q = x.getBoundingClientRect(); return [q.width, q.height, getComputedStyle(x).backgroundColor, getComputedStyle(x).borderTopWidth]; }); return { rad: parseFloat(cs.borderRadius), h: r.height, w: r.width, vw: innerWidth, bg: cs.backgroundColor, ink: cs.color, l }; })()");
    ok(bar.rad >= 10 && bar.rad <= 14 && bar.h >= 60 && bar.w >= bar.vw - 40 && bar.bg === 'rgb(255, 79, 196)' && bar.ink === 'rgb(11, 10, 20)', `… THE BAR: solid JAYWALK pink (${bar.bg}), dark words (${bar.ink}), ${Math.round(bar.w)} × ${Math.round(bar.h)} of ${bar.vw}, ${bar.rad} px corners (never a pill)`);
    ok(bar.l.length === 2 && bar.l.every(([w, h, bg, bw]) => w >= 44 && h >= 44 && /rgba\(0, 0, 0, 0\)|transparent/.test(bg) && bw === '0px'), `… the quiet links: no box, each ≥ 44 pt (${bar.l.map(([w, h]) => `${Math.round(w)} × ${Math.round(h)}`).join(' · ')})`); }
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
  // BEFORE THE FLIP — THE RUN CARD UPLOADS ONLY ON SHARE: the end screen has been up (the card drawn behind it) — NOTHING has gone up
  await sleep(4500);
  ok(P.uploads() === 0 && !(await dbGet(`shrp/${pid}:jaywalk`)), `THE RUN CARD ONLY ON SHARE: the end screen read for 4.5 s, no SHARE tap → ${P.uploads()} uploads, no run card on the server`);
  await P.shot('end-before-share.png');
  const L1 = await shareLink(P.p, '.jw-final .final-share', true, async () => { await sleep(520); await P.shot('end-share-ready.png'); });
  ok(P.uploads() === 1 && L1.again, `… SHARE → ONE upload + the link (${P.uploads()}); a tap whose activation the upload spent reads SHARE again (lit) — one more tap shares it (${L1.again})`);
  const L1b = await shareLink(P.p, '.jw-final .final-share');
  ok(P.uploads() === 1 && L1b.url === L1.url && !L1b.again, `… a SECOND SHARE the same run → the same link at once, no second upload (${P.uploads()})`);
  ok(JSON.stringify(L1.keys) === '["url"]' && /\/api\/daily\?s=[A-Za-z0-9_-]{12}$/.test(L1.url), `H4B — SHARE sends ONLY THE LINK (${JSON.stringify(L1.keys)} — no text, no file, no site line): ${L1.url}`);
  ok(/ · JAYWALK · /.test(L1.title) && L1.go === '/' && !!L1.png && L1.png.w === 540 && L1.png.h === 675 && L1.png.bytes <= 300 * 1024, `… the link's preview IS the card (og:image ${L1.png ? `${L1.png.w} × ${L1.png.h}, ${Math.round(L1.png.bytes / 1024)} KB` : 'none'}; "${L1.title}") and a tap on it opens the site ("${L1.go}")`);
  if (OUT && L1.png) writeFileSync(join(OUT, 'share-link-solo-540.png'), L1.buf);
  const slot = await dbGet(`shrp/${pid}:jaywalk`);
  ok(slot && Object.values(slot).length === 1 && Object.values(slot)[0] === L1.code, 'ONE run card a player a day — its own slot (never the day\'s DAILIES card\'s)');
  ok(await board(pid) === v1.result.lanes, `the solo board (jaywalk-solo): best ${await board(pid)} — from the replay`);
  ok(await P.waitFor("!!document.querySelector('.jw-fin-best.is-new') && /NEW BEST/.test(document.querySelector('.jw-fin-best').textContent)", 10000), 'NEW BEST on the end screen — from the server\'s own answer');
  await P.shot('end-new-best.png');
  // J1 — YOUR SPLITS: OFF the end screen (THE END-BOARD SWITCH-ON's add-on, the owner Nov 27 9:46 am — room for THE END-SCREEN BOARD); the
  // run's splits are still the server's own replay (kept for the player's best splits) + the shared block is on the end screen
  { const sp = await P.ev(`({ boxes: document.querySelectorAll('.jw-final .jw-sp-box').length, eb: !!document.querySelector('.jw-final .final.has-eb .eb') })`);
    const srv = v1.result.splits || [];
    ok(sp.boxes === 0 && srv.length === Math.floor(v1.result.lanes / 50) && sp.eb, `J1 — no YOUR SPLITS card on the end screen (the server's replay still made ${srv.length} split(s)); THE END-SCREEN BOARD is on it`); }
  // CITY H1 — THE FADE NEVER SLICES A BOX (the polish reviewer: PERSONAL BEST SET cut in half by MORE BELOW's fade at 390): with the cue up, no
  // callout plaque crosses the fade's top line — one that would is moved down whole under the foot (ui/final.js#unslice)
  await P.ev("(() => { const f = document.querySelector('.final'); if (f) f.scrollTop = 0; return 1; })()"); await sleep(1500);
  const sl = await P.ev(`(() => { const f = document.querySelector('.final'), a = f && f.querySelector('.final-actions'); if (!f || !a) return null; const foot = a.getBoundingClientRect().top;
    const rs = [...f.querySelectorAll('.rc-plaque, [data-box]')].map(b => b.getBoundingClientRect()), cut = rs.filter(r => r.height && r.top < foot - 1 && r.bottom > foot + 1).length;
    return { more: f.classList.contains('has-more') && !f.classList.contains('is-scrolled'), cut, n: rs.length, gap: !!f.querySelector('.final-gap'), at: rs.map(r => Math.round(r.top) + '-' + Math.round(r.bottom)).join(' '), foot: Math.round(foot) }; })()`);
  ok(sl && sl.cut === 0, `THE FADE NEVER SLICES A BOX: MORE BELOW ${sl && sl.more ? 'up' : 'not needed'} · ${sl && sl.n} plaque(s), ${sl && sl.cut} cut by the foot / its fade (a gap moved one down whole: ${sl && sl.gap}; boxes ${sl && sl.at}, the foot at ${sl && sl.foot})`);
  await P.shot('end-fade-390.png');
  // THE END-BOARD SWITCH-ON (Nov 27) — YOUR TABLE is THE END-SCREEN BOARD's ☐ FRIENDS ONLY (ui/end-board.js — the console's ONE shared block,
  // index.js#END_BOARD): ticked = the top 3 of you + your friends + "YOU · 4TH · n LANES" (you are 4th of 4); unticked = the world's top 3 —
  // here YOUR card leads it and wears THE YOU ROW's glow, your rank in JAYWALK's own colour. Nothing scrolls at 360 / 390 / 430 / 1440.
  const ebTick = async on => { if (await P.ev("(() => { const t = document.querySelector('.jw-final .eb-tick'); return t ? t.getAttribute('aria-checked') : ''; })()") !== String(on)) await P.p.click('.jw-final .eb-tick'); };
  ok(await P.waitFor("!!document.querySelector('.jw-final .eb-tick')", 10000), 'THE END-SCREEN BOARD on the solo end screen (☐ FRIENDS ONLY)');
  await ebTick(true);
  ok(await P.waitFor("document.querySelectorAll('.jw-final .eb-list li').length === 3 && /^YOU · 4TH · \\d+ LANES$/.test(document.querySelector('.jw-final .eb-you').textContent)", 12000), `FRIENDS ONLY: your 3 friends + "${await P.ev("(document.querySelector('.jw-final .eb-you') || {}).textContent")}" (12 · 10 · 8-letter names; 3-digit + 2-digit bests)`);
  for (const [w, hgt] of [[360, 780], [390, 844], [430, 932], [1440, 900]]) {
    await P.p.setViewport({ width: w, height: hgt, deviceScaleFactor: w > 500 ? 1 : 2, isMobile: true, hasTouch: true });   // (isMobile kept: changing it reloads the page)
    await sleep(500);
    await P.ev("import('/js/ui/fit.js').then(m => document.querySelectorAll('.jw-final .eb-card .vl-name').forEach(m.refit))");
    await sleep(250);
    const t = await P.ev(`(() => { const f = document.querySelector('.jw-final .final'), nm = [...document.querySelectorAll('.jw-final .eb-card .vl-name')].map(x => ({ t: x.textContent, cut: x.classList.contains('fit-cut') || x.scrollWidth > x.clientWidth + 1, px: parseFloat(getComputedStyle(x).fontSize) })); return { over: f.scrollHeight - f.clientHeight, nm }; })()`);
    ok(t.over <= 6 && t.nm.length === 3 && t.nm.every(x => !x.cut && x.px >= 12), `THE END SCREEN + THE BLOCK at ${w} × ${hgt}: nothing scrolls (${t.over} px over), every name whole (${t.nm.map(x => x.t + ' ' + x.px + 'px').join(' · ')})`);
    await P.shot(`endboard-${w}.png`);
  }
  await P.p.setViewport({ width: 390, height: 844, deviceScaleFactor: Number(process.env.E2E_DPR) || 2, isMobile: true, hasTouch: true });
  await ebTick(false);
  ok(await P.waitFor("[...document.querySelectorAll('.jw-final .eb-list li')].some(li => li.classList.contains('is-me'))", 12000), 'unticked: the world\'s top 3 — your run among them');
  const gy = await P.ev(`(() => { const li = [...document.querySelectorAll('.jw-final .eb-list li')], me = li.find(x => x.classList.contains('is-me')), st = me && me.querySelector('.vl-strip'), b = st ? getComputedStyle(st, '::after') : null;
    return { sb: !!(st && st.classList.contains('sb-me')), sbN: document.querySelectorAll('.jw-final .eb-list .sb-me').length, anim: b ? b.animationName : '', rank: getComputedStyle(me.querySelector('.eb-n')).color, h: [...new Set(li.map(x => Math.round(x.getBoundingClientRect().height)))] }; })()`);
  ok(gy.sb && gy.sbN === 1 && gy.anim === 'sb-breathe' && gy.rank === 'rgb(255, 79, 196)' && gy.h.length === 1, `THE YOU ROW: the shared breathing glow on YOUR card only (${gy.sbN}, ${gy.anim}); your rank in JAYWALK's own colour (${gy.rank} = #ff4fc4 — the owner's add-on: the block wears the game's look); every row one height`);
  for (const look of ['night', 'day']) {
    await P.ev(`import('/js/games/kit/look.js').then(m => m.saveLook('${look}'))`);
    await P.waitFor(`document.querySelector('.jw-game').dataset.look === '${look}'`, 6000); await sleep(400);
    const over = await P.ev("(() => { const f = document.querySelector('.jw-final .final'); return f.scrollHeight - f.clientHeight; })()");
    ok(over <= 6, `by ${look}: the end screen + the block on one screen (${over} px over)`);
    if (look === 'day') { const top = await P.ev("getComputedStyle(document.querySelector('.jw-final')).backgroundImage"); ok(/rgba\(7, 6, 11, 0\.84\)/.test(top), 'THE END SCREEN\'s TOP by day: a soft dark fade under the title (0.84 at the top)'); }
    await P.shot(`endboard-${look}-390.png`);
  }
  await P.ev("import('/js/games/kit/look.js').then(m => m.saveLook('night'))");
  for (const [fp] of TBL) { await dbPut(`pfr/${pid}/f/${fp}`, null); await dbPut(`pstats/${fp}`, null); await dbPut(`profiles/${fp}`, null); }
  if (process.env.JW_UNTIL === 'table') { await b.close(); console.log(`\n${n - fails.length}/${n} checks (JW_UNTIL=table) — ${fails.length ? `FAILED:\n  ${fails.join('\n  ')}` : 'all green'}`); process.exit(fails.length ? 1 : 0); }
  // ---- 6. PLAY AGAIN — measured: the tap → the next run's course is up (ready to hop)
  const times = [];
  const again = async () => {
    await pastMoment(P);
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
  await P.ev(`${G}.bot(true, { steady: true })`);   // (B2 — THE DEC 24 FLAKE: the greedy bot could die short of the best on a slow box; THE STEADY BOT stays in)
  const crossedB = await P.waitFor(`${G}.state().lines.record || ${G}.state().over`, 60000) && await P.ev(`${G}.state().lines.record`);
  await P.shot('line-best-crossed.png');
  ln = (await P.ev(`${G}.state()`)).lines;
  await P.ev(`${G}.bot(false)`);
  const nb1 = await P.ev("import('/js/games/jaywalk/sfx.js').then(S => S.wanted().filter(x => x.id === 'new-best').length)");
  ok(crossedB && ln.record && ln.gold && (await P.ev(`${G}.state()`)).best > B1, `… CROSSED at lane ${(await P.ev(`${G}.state()`)).best}: the run is a NEW RECORD — the lane counter flashes and stays gold`);
  ok(nb1 === nb0 + 1, '… the new-best sound, once');
  ok(await toEnd(P), 'run 2 ends'); await memFinal(P, 'run 2 — the final screen');
  const r2 = await counted(g.code, g.m);
  ok(!!r2, 'run 2 — seconds after run 1 — is counted too (its own report; THE 45 s GAP never holds a quick solo run)');
  ok(await P.waitFor("/YOUR BEST|NEW BEST/.test(document.querySelector('.jw-fin-best').textContent)", 10000), `… its end screen: "${await P.ev("document.querySelector('.jw-fin-best').textContent")}"`);
  let bestNow = await board(pid);
  // a few more, for the measure
  for (let i = 0; i < 3; i++) { A = await again(); if (A.up) times.push(A.ms); await hopUp(P, 1); if (i < 2) { await toEnd(P); await memFinal(P, `run ${i + 3} — the final screen`); } }
  times.sort((x, y) => x - y);
  console.log('PLAY_AGAIN_MS', JSON.stringify(times.map(t => Math.round(t))));
  ok(times.length >= 4 && times[Math.floor(times.length / 2)] < 1000, `PLAY AGAIN, ${times.length} taps: median ${times[Math.floor(times.length / 2)].toFixed(0)} ms, worst ${times[times.length - 1].toFixed(0)} ms (the target ≤ ~1 s)`);
  // ---- 6c. H5A — THROUGH THE AREAS: the bot plays a solo run past lane 155 (THE DOCKS → THE FISH MARKET → THE RAIL YARD + the
  // opening = 4 stretches): each gateway's name flashes under the lane count + the landmark sound; the world's cues play (this kid's
  // own); THE NEW KID is the one drawn; the SERVER's replay counts the same lanes — the same course on the phone + the server
  {
    await P.ev("window.__marks = new Set(); window.__markT = setInterval(() => { const m = document.querySelector('.jw-mark'); if (m && m.textContent) window.__marks.add(m.textContent); }, 120)");
    // (BEFORE THE FLIP — THE AREA ARRIVAL, the owner's DAY run: this run is played BY DAY; the GATE SIGN is sampled on the real game's
    // screen as the kid comes up to each gate (its canvas's own opacity + box), THE ARRIVAL BANNER at each crossing)
    await P.ev("import('/js/games/kit/look.js').then(m => m.saveLook('day'))");
    await P.waitFor(`${G}.state().info.look === 'day'`, 6000);
    await P.ev(`window.__gates = {}; window.__banners = []; window.__gateT = setInterval(() => { const i = (${G}.state().info || {}), cv = document.querySelector('.jw-game .jw-gate'), b = document.querySelector('.jw-game .jw-arrive');
      if (i.gate && cv) { const r = cv.getBoundingClientRect(), o = +getComputedStyle(cv).opacity, k = i.gate.text, g = window.__gates[k] || (window.__gates[k] = { a: 0, d: [], top: r.top, h: r.height, look: i.look }); g.a = Math.max(g.a, o); if (o > 0.9 && !g.d.includes(i.gate.d)) g.d.push(i.gate.d); }
      if (b && b.classList.contains('is-on')) { const t = b.textContent; if (!window.__banners.some(x => x.t === t)) { const r = b.getBoundingClientRect(); window.__banners.push({ t, top: r.top, bottom: r.bottom, look: document.querySelector('.jw-game').dataset.look }); } } }, 90)`);
    let far = null, tries = 0, lm0 = 0;
    for (; tries < 10 && !far; tries++) {
      if (tries) { if (!(await toEnd(P, 60000))) break; const N = await again(); if (!N.up) break; }
      lm0 = (await P.ev(`${G}.state().snd.by['area-arrive']`)) || 0;   // (the totals: the lists keep only their last 200 — a long run's first gateways scroll out)
      await P.ev(`window.__marks.clear(); window.__gates = {}; window.__banners = []; ${G}.bot(true)`);
      await P.waitFor(`${G}.state().best >= 156 || ${G}.state().over`, 150000);
      const st = await P.ev(`${G}.state()`);
      if (st.best >= 156) { far = st; await P.shot('areas-rail-yard-run.png'); }
      if (far) await P.ev("clearInterval(window.__gateT); import('/js/games/kit/look.js').then(m => m.saveLook('night'))");
      await P.ev(`${G}.bot(false)`);
    }
    ok(!!far, `a bot's solo run got THROUGH 3 AREAS in ${tries} ${tries === 1 ? 'try' : 'tries'} (lane ${far ? far.best : '—'}: the opening → THE DOCKS → THE FISH MARKET → THE RAIL YARD)`);
    if (far) {
      const marks = await P.ev('[...window.__marks]'), snd = far.snd, lm = (snd.by['area-arrive'] || 0) - lm0;
      ok(marks.length === 0, `the old small name under the lane count is RETIRED — THE ARRIVAL BANNER says it (${marks.join(' · ') || 'nothing under the count'})`);
      ok(lm >= 3, `… with THE AREA ARRIVAL sound (${lm} asked)`);
      const gates = await P.ev('window.__gates'), banners = await P.ev('window.__banners'), vh = await P.ev('innerHeight');
      console.log('   the gate signs seen (by day):', JSON.stringify(gates), '· the banners:', JSON.stringify(banners));
      ok(['THE DOCKS', 'THE FISH MARKET', 'THE RAIL YARD'].every(n => gates[n] && gates[n].a > 0.9 && gates[n].look === 'day' && gates[n].top > vh * 0.2 && gates[n].top < vh * 0.4),
        `THE APPROACH SIGN in the REAL GAME, BY DAY: each gate's sign up whole (opacity > 0.9) on the approach, under the band (${Object.entries(gates).map(([k, g]) => `${k} ${g.a.toFixed(2)} at ${g.d.join('/')} lanes, top ${Math.round(g.top)} pt`).join(' · ')})`);
      ok(['THE DOCKS', 'THE FISH MARKET', 'THE RAIL YARD'].every(n => banners.some(b => b.t.startsWith(n) && /LANE \d+/.test(b.t) && b.bottom < vh * 0.27)),
        `THE ARRIVAL BANNER at each crossing — the name + its LANE, at the top over the skyline band, never over the lanes (${banners.map(b => `${b.t} ${Math.round(b.top)}–${Math.round(b.bottom)} pt`).join(' · ')})`);
      ok(snd.cues.includes('car-pass') || snd.cues.includes('horn') || snd.cues.includes('bell-on'), `THE WORLD's SOUNDS were cued for this kid (${[...new Set(snd.cues)].join(' · ')})`);
      ok(far.info.kid === true && far.kidPx >= 30 && far.kidPx <= 58, `THE NEW KID is the one drawn — ${far.kidPx.toFixed(1)} pt tall on this 390 pt phone at that moment (mid-hop he stretches; standing: ≈ 38.5 pt — the lab check)`);
      const gA = await P.ev(`({ code: ${S}.code, m: ${S}.game.matchId })`);
      ok(await toEnd(P, 60000), '… the run ends');
      const rA = await counted(gA.code, gA.m, 30000), seen = await P.ev(`${G}.state().best`);
      const vA = verifyNode({ code: gA.code, matchId: gA.m, node: await nodeOf(gA.code, gA.m, uid) });
      ok(!!rA && vA.ok && !vA.cut && vA.result.lanes === seen && seen >= 156, `the report is COUNTED — the SERVER's own replay of the proof = ${vA.ok ? vA.result.lanes : vA.why} lanes = the phone's ${seen}: the same course on both, areas and all`);
      ok(await board(pid) === seen, `… and it is the solo best now (${await board(pid)})`);
      bestNow = await board(pid);
    }
    await P.ev('clearInterval(window.__markT)');
    // ---- 6d. JT2 — THE CONTROLLER (kit/gamepad.js): a FAKE PAD on the Gamepad API (an Xbox pad's standard mapping) drives one solo run —
    // its first press only CONNECTS it (the line, no move); A = PLAY AGAIN on the end card (its data-pad="a") — the run on at once (that press
    // WAS the start); the D-pad = hops (ONE per press); the left stick = a step (past the deadzone, once); the run's end → the end card again
    if (await P.ev(`${S}.game && ${S}.game.phase === 'final'`)) {
      await P.ev(`(() => { const b = () => ({ pressed: false, value: 0 }); window.__pad = { id: 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)', index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, b) };
        Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [window.__pad, null, null, null] }); window.dispatchEvent(new Event('gamepadconnected')); })()`);
      const press = async (i, ms = 110) => { await P.ev(`window.__pad.buttons[${i}] = { pressed: true, value: 1 }`); await sleep(ms); await P.ev(`window.__pad.buttons[${i}] = { pressed: false, value: 0 }`); await sleep(140); };
      const stick = async (x, y) => { await P.ev(`window.__pad.axes = [${x}, ${y}, 0, 0]`); await sleep(160); await P.ev('window.__pad.axes = [0, 0, 0, 0]'); await sleep(160); };
      const m0 = await P.ev(`${S}.game.matchId`);
      // (VARIETY B1 — the flake: a fixed 3 s ran out once on a loaded winter run while the kit's lazy chunk came in. Now a WATCH records the
      //  line the moment it shows — the wait is for that state, however long the chunk takes; the line itself still lasts ~2 s)
      await P.ev(`(() => { window.__padSeen = false; const seen = () => { const e = document.querySelector('.jw-pad'); if (e && e.classList.contains('is-on') && e.textContent === '🎮 CONNECTED') window.__padSeen = true; }; new MutationObserver(seen).observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true }); seen(); })()`);
      await press(0);   // (Safari shows a pad only after a press: this one CONNECTS it)
      ok(await P.waitFor('window.__padSeen === true', 20000), 'THE CONTROLLER: its first press → "🎮 CONNECTED" (the quiet line, ~2 s) — and nothing else');
      await P.shot('jt2-pad-connected-390.png');
      ok(await P.ev(`${S}.game.phase === 'final' && ${S}.game.matchId === '${m0}'`), '… the connecting press did not press PLAY AGAIN');
      await sleep(400); await press(0);
      ok(await P.waitFor(`${S}.game && ${S}.game.matchId !== '${m0}' && !!${G} && ${G}.state().matchId === ${S}.game.matchId && ${G}.state().mode === 'run' && !${G}.state().waiting`, 15000), '… A = PLAY AGAIN on the end card → the next run on at once (that press was its start — no TAP TO START)');
      ok(await P.waitFor(`${G}.state().pad`, 4000), '… the new screen wired the pad (the kit, fetched once)');
      const y0 = (await P.ev(`${G}.state()`)).y;
      for (let k = 0; k < 3; k++) await press(12);
      const p1 = await P.ev(`${G}.state()`);
      ok(p1.y === y0 + 3 && p1.hops === 3, `… the D-pad: 3 presses = 3 hops, one each (lane ${y0} → ${p1.y}, ${p1.hops} hops logged — the same input path as a swipe)`);
      const x0 = (await P.ev(`${G}.state()`)).x;
      await stick(0.95, 0.1);
      const p2 = await P.ev(`${G}.state()`);
      ok(p2.hops === 4, `… the left stick past the deadzone = ONE step sideways (x ${x0} → ${p2.x}${p2.x === x0 ? ', a bump' : ''}), no repeat while held`);
      await stick(0.3, 0); ok((await P.ev(`${G}.state()`)).hops === 4, '… inside the deadzone: nothing');
      ok(await toEnd(P, 60000), '… the pad run ends (the kid left standing)');
      const gp = await P.ev(`({ code: ${S}.code, m: ${S}.game.matchId })`), vp = verifyNode({ code: gp.code, matchId: gp.m, node: await nodeOf(gp.code, gp.m, uid) });
      ok(vp.ok && vp.result.lanes >= 3, `… THE PROOF saw ordinary hops: the server's replay counts the pad run (${vp.ok ? vp.result.lanes : vp.why} lanes)`);
    }
    // (the next step wants a run in play)
    if (await P.ev(`${S}.game && ${S}.game.phase === 'final'`)) { const N = await again(); ok(N.up, 'PLAY AGAIN after the long run'); await hopUp(P, 1); }
  }
  // ---- 7. a FORGED log: hops the clock never saw (tick 5000 at second 2) — written honestly stamped; the server counts it as NOTHING
  g = await P.ev(`({ code: ${S}.code, m: ${S}.game.matchId })`);
  ok(await P.ev(`import('/js/firebase.js').then(f => f.set(f.dbRef('rooms/' + ${S}.code + '/jw/' + ${S}.game.matchId + '/' + ${S}.uid + '/c/900'), { s: 'U3uwU8U8U8U8U8U8U8U8', at: f.serverTimestamp() }).then(() => true, () => false))`), 'a forged chunk (well-formed, stamped by the server) can be written …');
  await dbPut(`rooms/${g.code}/jw/${g.m}/${uid}/c`, { 0: { s: 'U3uwU8U8U8U8U8U8U8U8U8U8U8U8', at: (await nodeOf(g.code, g.m, uid)).go + 1500 } });
  ok(await toEnd(P), '… the run ends');
  {
    // THE END SCREEN's MEMORY, five solo runs in a row: each final screen holds a small RESTING scene — under the budget, never growing
    const m5 = await memFinal(P, 'run 5 — the final screen'), peak = Math.max(...mems.map(m => m.pix));
    ok(mems.length >= 5 && mems.every(m => m.rest), `on every run's final screen the scene RESTS (a small still, nothing drawn): ${mems.map(m => m.buf).join(' · ')}`);
    ok(peak <= JW_FINAL_BUDGET_MB, `THE END SCREEN's MEMORY: the most held on a final screen in ${mems.length} solo runs = ${peak} MB of pixels (the budget ${JW_FINAL_BUDGET_MB}; before H6B's fix: 40 at @3)`);
    ok(m5.pix <= mems[0].pix + 3, `… and it does not grow run over run (${mems.map(m => m.pix).join(' → ')} MB)`);
    // (JT2's add-on — THE FINAL SCREEN's MEMORY with THE SEASONAL PACK in (JW_DAY = a heavy day): nothing seasonal alive behind any final
    //  screen — the fall, the footprints, the burst piles, the fireworks' canvas freed; the final screen's own canvases never pile up)
    ok(mems.every(m => m.seasonRest), `THE SEASON AT REST behind every final screen${JW_DAY ? ` (${JW_DAY})` : ''}: ${[...new Set(mems.map(m => m.season))].slice(0, 2).join(' | ')}`);
    ok(m5.canvases <= mems[0].canvases + 1, `… the final screen's own canvases never pile up (${mems.map(m => m.canvases).join(' → ')})`);
  }
  const rf = await counted(g.code, g.m);
  const vf = verifyNode({ code: g.code, matchId: g.m, node: await nodeOf(g.code, g.m, uid) });
  ok(!!rf && vf.ok === false && vf.why === 'ahead of the clock', `… and the server REFUSES it (${vf.why})`);
  ok(await board(pid) === bestNow, `… the best is untouched (${bestNow})`);
  // ---- 7c. THE LOST CONTEXT (THE GO-LIVE REVIEW — the audit): iOS can take the WebGL context mid-run; the run goes on (the server's
  //          clock) — the scene must come back by itself, never a blank playfield under a live run
  {
    const N = await again(); ok(N.up, 'PLAY AGAIN (for the lost-context check)'); await hopUp(P, 2);
    const s0 = await P.ev(`${G}.state()`);
    // (THE POLISH PASS — the far lanes after a REAL loss: the playfield's far half (above the kid — the lanes ahead, under the band), its
    //  mean brightness on a fresh scene vs the rebuilt one — the solo rebuild came back at reveal 0: the far lanes dark)
    const farLum = async () => { const b64 = await P.p.screenshot({ encoding: 'base64', clip: { x: 0, y: 300, width: 390, height: 230 } }); return P.ev(`new Promise(r => { const i = new Image(); i.onload = () => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; let s = 0; for (let k = 0; k < d.length; k += 4) s += 0.2126 * d[k] + 0.7152 * d[k + 1] + 0.0722 * d[k + 2]; r(s / (d.length / 4) / 255); }; i.src = 'data:image/png;base64,${b64}'; })`); };
    await sleep(700); const lum0 = await farLum();
    const lost = await P.ev("(() => { const cv = document.querySelector('canvas.jw-canvas'); cv.__old = 1; const gl = cv.getContext('webgl2') || cv.getContext('webgl'), x = gl && gl.getExtension('WEBGL_lose_context'); if (!x) return false; x.loseContext(); return true; })()");
    if (!lost) ok(true, '(this browser has no WEBGL_lose_context: the lost-context check is skipped)');
    else {
      ok(await P.waitFor("(() => { const cv = document.querySelector('canvas.jw-canvas'); return !!cv && !cv.__old; })()", 4000), 'the WebGL context is LOST mid-run → a NEW scene is up within 1.5 s (+ its build)');
      await sleep(900);
      const s1 = await P.ev(`(() => { const s = ${G}.state(); return { scenes: s.scenes, calls: s.info && s.info.calls, look: s.info && s.info.look, t: s.t, mode: s.mode, canvases: document.querySelectorAll('canvas.jw-canvas').length }; })()`);
      ok(s1.scenes === s0.scenes + 1 && s1.canvases === 1 && s1.calls > 0, `… it DRAWS again (${s1.calls} draw calls a frame; ONE canvas; scene ${s0.scenes} → ${s1.scenes})`);
      ok(s1.mode === 'run' && s1.t > s0.t, `… and the run never stopped (tick ${s0.t} → ${s1.t})`);
      ok(P.errs.length === 0, `… no page error (${P.errs.slice(0, 2).join(' | ')})`);
      await sleep(600); const lum1 = await farLum();
      ok(lum1 >= lum0 * 0.7 && lum1 > 0.04, `… the REBUILT scene's far lanes are lit like the fresh one's (the far half's brightness ${lum0.toFixed(3)} → ${lum1.toFixed(3)})`);
      await P.shot('lost-context-rebuilt.png');
    }
    ok(await toEnd(P), '… that run ends (the kid stood still)');
  }
  // ---- 8. BACK TO THE CITY
  await pastMoment(P);
  await P.tap('.final-city');
  ok(await P.waitFor(`!${S}.code && !!document.querySelector('.nd-tab-play')`, 20000), 'BACK TO THE CITY → the city');
  ok(await P.ev("!document.body.classList.contains('jw-on')"), 'SMOOTH 3: the game\'s background switch is gone with the game');
  await sleep(1200);
  ok((await dbGet(`rooms/${g.code}`)) == null, '… the solo room is gone');
  ok(!P.errs.length, `no page error (${P.errs.slice(0, 2).join(' | ') || 'none'})`);
  await P.close();
  await dropRunCards([pid]);

  // ---- 8a. SMOOTH 4 — A CONTEXT THAT DID NOT START: the first two WebGL contexts refused (a busy GPU) → the view asks again and the run screen comes up
  { const Q = await phone(`jwg${Date.now() % 100000}`), warns = [];
    Q.p.on('console', m => { if (/the WebGL context did not start/.test(m.text())) warns.push(m.text()); });
    await pidOf(Q);
    await Q.ev('globalThis.__jwGlFail = 2');
    await Q.ev("import('/js/host.js').then(m => m.playSolo('jaywalk'))");
    const up = await Q.waitFor(`!!${G} && !!document.querySelector('.jw-game canvas.jw-canvas') && ${G}.state().waiting && !document.querySelector('.jw-nogl')`, 30000);
    ok(up && warns.length === 2, `SMOOTH 4 — A REFUSED WebGL CONTEXT is asked again: the run screen up after ${warns.length} refusals (never a dead match screen)`);
    await Q.close(); }

  // ---- 8b. THE DROPPED SIGNAL (H4 — `--drop`): a REAL offline gap mid-run — the phone's database line cut, the run played on, the
  // queued chunks landing together when it is back → the server's own replay counts the FULL honest run (never cut, never refused)
  if (DROP) {
    const Q = await phone(`jwd${Date.now() % 100000}`);
    await pidOf(Q);   // (THE GO-LIVE PASS: a plain phone — no owner set-up)
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
        await pastMoment(Q);
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
    await pidOf(Q);   // (THE GO-LIVE PASS: a plain phone — no owner set-up)
    await Q.ev("import('/js/host.js').then(m => m.playSolo('jaywalk'))");
    await Q.waitFor(`!!${G} && ${G}.state().mode === 'run'`, 30000);
    const cdp = await Q.p.createCDPSession();
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const rows = [];
    for (const tier of [2, 1, 0]) {
      await Q.ev(`${G}.setTier(${tier}); ${G}.bot(true)`);
      await sleep(1200);
      await Q.ev(`${G}.clearFrames()`);
      let end = Date.now() + 7000, redo = 0;
      while (Date.now() < end) {   // (the bot plays on: a run that ends is hopped again at once — and the 7 s are measured again: the next run is a fresh view, its frame list starts over)
        if (await Q.ev(`${S}.game && ${S}.game.phase === 'final' && !!document.querySelector('.final-again')`)) { await Q.ev("document.querySelector('.final-again').click()"); await Q.waitFor(`!!${G} && ${G}.state().mode === 'run'`, 8000); await Q.ev(`${G}.setTier(${tier}); ${G}.bot(true)`); if (redo++ < 4) { await sleep(1200); await Q.ev(`${G}.clearFrames()`); end = Date.now() + 7000; } }
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
