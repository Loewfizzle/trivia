// PLAY NOW — the dock's PLAY → THE GAMES SHELF → THE GAME CARD → a SOLO RUN IN ONE TAP (+ PLAY WITH FRIENDS, a sign tap, HOLD'EM's card),
// in Safari's engine AND Chromium (Playwright's WebKit / Chromium, 390×844 as a phone), on the emulators (scripts/serve.mjs --emu):
//   solo     PLAY → PRISM DROP → PLAY NOW: playing (the SOLO START's walk ends) within ~3 s of the tap · the room LOCKED + flagged, its code
//            NOT a hush word, never on screen / in the address bar, no hush/ entry · the run ended → the podium's foot = PLAY AGAIN + BACK TO
//            THE CITY (no BACK TO THE ROOM) · PLAY AGAIN → a new run (the 's' start) · BACK TO THE CITY → the room node GONE, no hush/
//            rested, the database line PARKED (0 sockets after the grace — CONN)
//   friends  PRISM DROP's card → PLAY WITH FRIENDS → a normal room (unlocked, not solo) with PRISM DROP's options open
//   holdem   HOLD'EM's card: no PLAY NOW — "Needs 2+ players" + PLAY WITH FRIENDS (the main) → a room with HOLD'EM's options open
//   sign     a tap on the PRISM DROP sign in the skyline → PRISM DROP's card
//   (PD-6: the solo case also checks BOTH solo tubes, PLAY AGAIN keeping the mode, and the podium's XP line — runs 1, 3, 4 pay; the 5th says DONE)
//   node tests/integration/e2e-playnow.mjs [--browser webkit|chromium] [--base http://localhost:5173] [--only solo,one,friends,holdem,sign] [--shots DIR]
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync, readFileSync } from 'node:fs';
import { guardUrl } from './kit/live-guard.mjs';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const BASE = opt('base', 'http://localhost:5173'), BROWSER = opt('browser', 'webkit'), ONLY = (opt('only', '') || '').split(',').filter(Boolean), SHOTS = opt('shots', '');
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const pw = await import(pathToFileURL(process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs')).href);
const browser = await pw[BROWSER].launch(BROWSER === 'chromium' ? { executablePath: process.env.CHROME || 'C:/Users/benja/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe' } : {});
const DB = 'http://127.0.0.1:9000', NS = 'ns=demo-arcade-default-rtdb';
const dbGet = path => fetch(`${DB}/${path}.json?${NS}`, { headers: { Authorization: 'Bearer owner' } }).then(r => r.json());
const HUSH = new Set(JSON.parse(readFileSync(new URL('../../data/hushwords.json', import.meta.url), 'utf8')).map(w => w.toUpperCase()));
const results = [];
const ok = (c, what) => { results.push({ ok: !!c, what }); console.log(c ? 'OK  ' : 'FAIL', `${BROWSER}: ${what}`); };
const UP = '!!(window.__district && window.__district.harbor() && window.__district.harbor().shown) && !!window.__arcade';

async function phone(name) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: BROWSER === 'webkit', hasTouch: true });
  const slot = `pn${name.slice(0, 3)}${Date.now() % 1000}`;
  await ctx.addInitScript(([s, n]) => { try { localStorage.setItem('nd:entered', '1'); localStorage.setItem(`na:${s}:profile`, JSON.stringify({ name: n, color: 'magenta', avatar: 'bolt' })); } catch { /* fine */ } }, [slot, name.toUpperCase().slice(0, 8)]);
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  if (process.env.PN_DEBUG) p.on('console', m => console.log(`   [${name} ${m.type()}] ${m.text().slice(0, 240)}`));
  const ev = js => p.evaluate(js);
  const waitFor = async (js, ms = 20000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* navigating */ } await sleep(80); } return false; };
  await p.goto(guardUrl(`${BASE}/?emu&slot=${slot}&city=2&when=2026-11-10T20:30&conngrace=4000`, 'e2e-playnow.mjs'));
  if (!await waitFor(UP, 45000)) throw new Error(`${name}: the city never came up`);
  await waitFor('!!(window.__arcade.state.ready && window.__arcade.state.uid)', 20000);
  return { ctx, p, ev, waitFor, errs, shot: async n => { if (SHOTS) await p.screenshot({ path: join(SHOTS, `${BROWSER}-${n}.png`) }); } };
}
const S = 'window.__arcade.state';
async function openCard(P, game) {
  await P.ev("document.querySelector('.nd-tab-play').click()");
  if (!await P.waitFor("!!document.querySelector('.nd-shelf-sheet.is-in .nd-shelf-row')", 5000)) throw new Error('the shelf never opened');
  await P.ev(`document.querySelector('.nd-shelf-row[data-game="${game}"]').click()`);
  if (!await P.waitFor(`!!document.querySelector('.nd-card-sheet.is-in .nd-card[data-game="${game}"]')`, 5000)) throw new Error(`${game}'s card never opened`);
}
/** the run to its end: the clock pushed past endAt (the host is this phone) → the podium */
async function endRun(P) {
  await P.ev(`(async () => { const s = ${S}, f = await import('/js/firebase.js'), g = s.game, n = f.serverNow(), sh = (g.endAt || n) - n + 2000;
    const patch = {}; for (const k of ['songStartAt', 'playStartAt', 'endAt', 'startAt', 'at']) if (typeof g[k] === 'number') patch[k] = g[k] - sh;
    await f.update(f.dbRef('rooms/' + s.code + '/game'), patch); })()`).catch(() => {});
  return P.waitFor(`${S}.game && ${S}.game.phase === 'final' && !!document.querySelector('.final .final-actions')`, 60000);
}

// PD-6 ADD-ON: the solo podium's XP line (the server's outcome — it lands a moment after the podium)
const LINE = "(document.querySelector('.final .rc-solo') || {}).textContent || ''";
const soloLine = (P, want) => P.waitFor(`${LINE} === ${JSON.stringify(want)} && !document.querySelector('.final .rc-xp')`, 75000);   // (a run within 45 s of the last credit waits for the server's retryAfter — M4)
/** the test bot plays a few seconds (a run the server can verify) · a SURVIVAL run to its podium (topOut) */
async function botPlays(P, ms = 8000) {
  await P.waitFor('!!(window.__prism && window.__prism.engine && window.__prism.engine() && window.__prism.engine().cur)', 30000);
  await P.ev('window.__prism.bot({ skill: 0.85, every: 90, seed: 7 })'); await sleep(ms);
  await P.ev('window.__prism.stopBot()');
}
async function topOut(P) {   // (a REAL top-out the server's replay accepts: a careless bot dropping fast — never injected rows)
  await P.waitFor('!!(window.__prism && window.__prism.engine && window.__prism.engine() && window.__prism.engine().cur)', 30000);
  await sleep(1500);
  await P.ev('window.__prism.bot({ skill: 0, every: 40, seed: 3 })');
  const end = await P.waitFor(`${S}.game && ${S}.game.phase === 'final' && !!document.querySelector('.final .final-actions')`, 90000);
  await P.ev('window.__prism && window.__prism.stopBot && window.__prism.stopBot()').catch(() => {});
  return end;
}

try {
  if (!ONLY.length || ONLY.includes('solo')) {
    const P = await phone('soloist');
    await openCard(P, 'prism');
    // (PD-6 — TWO SOLO BUTTONS: PRISM DROP's SOLO_RUNS → SCORE RUSH · ONE SONG (the pink MAIN) + SURVIVAL · UNTIL YOU TOP OUT (plain) + PLAY WITH FRIENDS)
    const btns = await P.ev("[...document.querySelectorAll('.nd-card-actions .btn')].map(b => [b.dataset.act, b.dataset.mode || '', (b.querySelector('span') || b).textContent.trim(), (b.querySelector('small') || {}).textContent || '', /btn-primary/.test(b.className) ? 'MAIN' : 'plain'].join(':'))");
    ok(btns.length === 3 && btns[0] === 'solo:rush:SCORE RUSH:ONE SONG:MAIN' && btns[1] === 'solo:survival:SURVIVAL:UNTIL YOU TOP OUT:plain' && btns[2] === 'friends::PLAY WITH FRIENDS::plain', `PRISM DROP's card: SCORE RUSH · ONE SONG (the pink MAIN) + SURVIVAL · UNTIL YOU TOP OUT + PLAY WITH FRIENDS (${btns.join(' | ')})`);
    await P.shot('card-prism');
    const t0 = Date.now();
    await P.ev("document.querySelector('.nd-card-solo[data-mode=\"rush\"]').click()");
    const live = await P.waitFor(`(() => { const s = ${S}; const go = s.meta && s.meta.go; return !!(s.game && s.game.id === 'prism' && (s.game.phase === 'count' || s.game.phase === 'play') && go && go.m === s.game.matchId && window.__arcade.serverNow() >= go.at + 2000); })()`, 15000);
    const ms = Date.now() - t0;
    const st = await P.ev(`(() => { const s = ${S}; return { code: s.code, locked: !!(s.meta && s.meta.locked), solo: !!(s.meta && s.meta.settings && s.meta.settings.solo && s.meta.settings.solo.on), m: s.game && s.game.matchId, mode: s.game && s.game.settings && s.game.settings.mode, url: location.href, host: s.meta && s.meta.hostId === s.uid }; })()`);
    ok(live && ms <= 4000, `PLAY NOW → playing ${ms} ms after the tap (the SOLO START's walk done; ≤ ~3 s + the line)`);
    ok(st.locked && st.solo && st.host && /^s/.test(st.m || '') && st.mode === 'rush', `a PRIVATE one-seat room: locked ${st.locked}, flagged ${st.solo}, the host ${st.host}, the solo start's id ${st.m}, SCORE RUSH (${st.mode})`);
    const shown = await P.ev(`(() => { const c = ${S}.code; const txt = document.body.innerText || ''; return { inText: txt.includes(c), inUrl: location.href.includes('room=') }; })()`);
    const hushE = await dbGet(`hush/${st.code}`);
    ok(!HUSH.has(st.code) && !shown.inText && !shown.inUrl && hushE == null, `its code is no hush word (${HUSH.has(st.code) ? 'IS ONE' : 'not one'}), never on screen (${shown.inText}) or in the address bar (${shown.inUrl}), no hush/ entry`);
    await P.shot('solo-playing');
    await botPlays(P);   // (PD-6: a run the server can verify — the XP line needs a counted run)
    // the end: the podium's foot
    if (!await endRun(P)) ok(false, 'the run reached its podium');
    await sleep(800);
    const foot = await P.ev("({ again: !!document.querySelector('.final .final-again'), city: !!document.querySelector('.final .final-city'), back: !!document.querySelector('.final .final-back'), solo: document.querySelector('.final').classList.contains('is-solo') })");
    ok(foot.again && foot.city && !foot.back, `the solo podium's foot: PLAY AGAIN + BACK TO THE CITY, no BACK TO THE ROOM (${JSON.stringify(foot)})`);
    // (PD-6 ADD-ON — THE SOLO PODIUM SAYS WHAT IT PAID: the server's outcome → ONE line under the score, in place of the XP box)
    ok(await soloLine(P, '+15 XP · SOLO RUN · 1 OF 4 TODAY'), `a paying solo run: "${await P.ev(LINE)}" (want +15 XP · SOLO RUN · 1 OF 4 TODAY), no XP box (${await P.ev("!document.querySelector('.final .rc-xp')")})`);
    if (process.env.PN_DEBUG) console.log('   outcomes:', await P.ev("JSON.stringify(Object.keys(sessionStorage).filter(k => k.startsWith('rc:')).map(k => sessionStorage.getItem(k).slice(0, 300)))"), await P.ev("JSON.stringify(Object.keys(localStorage).filter(k => /queue|report|done/i.test(k)).map(k => k + '=' + localStorage.getItem(k).slice(0, 200)))"));
    await P.shot('solo-podium');
    // (the owner's add-on: SHARE YOUR RUN — the tube on the solo podium; a tap draws the card ON THE PHONE (no share sheet in a test browser →
    //  the image saved); no /api call, no error)
    { const api0 = []; const onReq = r => { if (r.url().includes('/api/')) api0.push(r.url()); }; P.p.on('request', onReq);
      const has = await P.ev("!!document.querySelector('.final .final-share')");
      // (the phone's share sheet stood in for: it receives the IMAGE + the line — a desktop / headless sheet would never answer)
      await P.ev("(() => { window.__shared = null; navigator.canShare = () => true; navigator.share = async d => { window.__shared = { files: (d.files || []).map(f => ({ n: f.name, t: f.type, s: f.size })), text: d.text }; }; })()");
      await P.ev("document.querySelector('.final .final-share').click()").catch(() => {});
      const done = await P.waitFor("!!window.__shared && !document.querySelector('.final .final-share.is-busy')", 8000);
      const sh = await P.ev('window.__shared');
      ok(!!sh && sh.files.length === 1 && sh.files[0].t === 'image/png' && sh.files[0].s > 10000 && /neonspeakeasy\.com/.test(sh.text || ''), `the share sheet gets ONE image (${sh && sh.files[0] ? `${sh.files[0].n}, ${Math.round(sh.files[0].s / 1024)} KB` : 'none'}) + the line with the site ("${sh && sh.text}")`);
      const bad = await P.ev("[...document.querySelectorAll('.toast, .tm')].some(t => /Couldn.t draw/.test(t.textContent))").catch(() => false);
      P.p.off('request', onReq);
      ok(has && done && !bad && !api0.some(u => !/\/api\/(time|log|admin)/.test(u)), `SHARE YOUR RUN on the solo podium: drawn on the phone (${has ? 'the tube' : 'NO tube'}, ${done ? 'done' : 'stuck'}${bad ? ', FAILED' : ''}) — no new /api call`); }
    // PLAY AGAIN → a new run, the solo start again
    const m1 = st.m, ta = Date.now();
    await P.ev("document.querySelector('.final .final-again').click()");
    // (the walk is over when the server clock passes the start's stamp + THE SOLO START's 2 s)
    const again = await P.waitFor(`(() => { const s = ${S}; const go = s.meta && s.meta.go; return !!(s.game && s.game.matchId !== ${JSON.stringify(m1)} && /^s/.test(s.game.matchId) && (s.game.phase === 'count' || s.game.phase === 'play') && go && go.m === s.game.matchId && window.__arcade.serverNow() >= go.at + 2000); })()`, 15000);
    ok(again && Date.now() - ta <= 4000, `PLAY AGAIN → a new run, THE SOLO START again — playing ${Date.now() - ta} ms after the tap`);
    ok(await P.ev(`${S}.game.settings.mode`) === 'rush', `PLAY AGAIN keeps the mode (${await P.ev(`${S}.game.settings.mode`)})`);
    await botPlays(P);   // (counted too — the day's 2nd solo run)
    // BACK TO THE CITY from the second podium
    if (!await endRun(P)) ok(false, 'the second run reached its podium');
    ok(await soloLine(P, '+15 XP · SOLO RUN · 2 OF 4 TODAY'), `the day's 2nd solo run: "${await P.ev(LINE)}"`);
    const code = await P.ev(`${S}.code`);
    await P.ev("document.querySelector('.final .final-city').click()");
    const gone = await P.waitFor(`!${S}.code && ${S}.view === 'title'`, 15000);
    await sleep(500);
    const node = await dbGet(`rooms/${code}/meta`), hush2 = await dbGet(`hush/${code}`);
    ok(gone && node == null && hush2 == null, `BACK TO THE CITY: back on the title (${gone}), the room node gone (${node == null}), no word rested (${hush2 == null})`);
    // the parked line: no 'room' want; the socket parks after its grace
    const parked = await P.waitFor("(() => { const l = window.__arcade.line(); return !l.wants.includes('room') && l.parked; })()", 30000);
    const L = await P.ev('window.__arcade.line()');
    ok(parked, `the database line PARKED after the grace (the grace 4 s here — 30 s live) — 0 sockets (wants: ${L.wants.join(', ') || 'none'}, parked ${L.parked})${parked ? '' : ` — touches ${L.touches} from ${JSON.stringify(L.touchFrom).slice(0, 200)} · ${JSON.stringify(L.log.slice(-6)).slice(0, 500)}`}`);
    // (PD-6 — the SECOND tube: SURVIVAL lands in a solo room with its mode; PLAY AGAIN keeps it; the day's 3rd + 4th runs pay, the 5th says DONE)
    await openCard(P, 'prism');
    await P.ev("document.querySelector('.nd-card-solo[data-mode=\"survival\"]').click()");
    const sv = await P.waitFor(`(() => { const s = ${S}; return !!(s.game && s.game.id === 'prism' && /^s/.test(s.game.matchId || '') && (s.game.phase === 'count' || s.game.phase === 'play')); })()`, 15000);
    const sst = await P.ev(`(() => { const s = ${S}; return { solo: !!(s.meta && s.meta.settings && s.meta.settings.solo && s.meta.settings.solo.on), locked: !!(s.meta && s.meta.locked), mode: s.game && s.game.settings && s.game.settings.mode }; })()`);
    ok(sv && sst.solo && sst.locked && sst.mode === 'survival', `SURVIVAL's tube → a private solo room in SURVIVAL (${JSON.stringify(sst)})`);
    const lines = [];
    for (let run = 3; run <= 5; run++) {
      if (!await topOut(P)) { ok(false, `solo run ${run} reached its podium`); break; }
      const want = run <= 4 ? `+15 XP · SOLO RUN · ${run} OF 4 TODAY` : 'TODAY’S SOLO XP DONE · MORE AT 4 AM';
      const got = await soloLine(P, want);
      if (!got && process.env.PN_DEBUG) console.log('   outcomes:', await P.ev("JSON.stringify(Object.keys(sessionStorage).filter(k => k.startsWith('rc:')).map(k => k + ' ' + sessionStorage.getItem(k).slice(0, 90)))"), await P.ev("JSON.stringify(Object.keys(localStorage).filter(k => /:rq|queue|rdone/i.test(k)).map(k => k + '=' + localStorage.getItem(k).slice(0, 300)))"), await P.ev(`JSON.stringify({ m: ${S}.game.matchId, code: ${S}.code, ph: ${S}.game.phase })`));
      if (!got && process.env.PN_DEBUG) console.log('   again:', await P.ev(`import('/js/profile/api.js').then(m => m.api('report', { code: ${S}.code, matchId: ${S}.game.matchId })).then(r => JSON.stringify(r).slice(0, 200), e => 'ERR ' + e.status + ' ' + e.code + ' ' + e.message)`), await P.ev(`import('/js/firebase.js').then(f => f.get(f.dbRef('rooms/' + ${S}.code + '/night/' + ${S}.game.matchId))).then(x => JSON.stringify(x.val()))`).catch(e => 'night ' + e.message));
      lines.push(await P.ev(LINE));
      if (run === 5) await P.shot('solo-podium-5th');
      if (!got || run === 5) { ok(got, `solo run ${run} of the day: "${lines[lines.length - 1]}" (want "${want}")`); if (!got) break; continue; }
      const m0 = await P.ev(`${S}.game.matchId`);
      await P.ev("document.querySelector('.final .final-again').click()");
      await P.waitFor(`(() => { const s = ${S}; return !!(s.game && s.game.matchId !== ${JSON.stringify(m0)} && (s.game.phase === 'count' || s.game.phase === 'play')); })()`, 15000);
      if (run === 3) ok(await P.ev(`${S}.game.settings.mode`) === 'survival', 'PLAY AGAIN after SURVIVAL keeps SURVIVAL');
    }
    ok(lines.length === 3 && lines[0].endsWith('3 OF 4 TODAY') && lines[1].endsWith('4 OF 4 TODAY'), `the 3rd + 4th runs pay (${lines.slice(0, 2).join(' | ')})`);
    await P.ev("document.querySelector('.final .final-city') && document.querySelector('.final .final-city').click()").catch(() => {});
    await P.waitFor(`!${S}.code`, 15000);
    ok(P.errs.length === 0, `no page error (${P.errs.slice(0, 2).join(' | ') || 'none'})`);
    await P.ctx.close();
  }
  if (!ONLY.length || ONLY.includes('one')) {
    // (the owner's add-on: ALONE IN A ROOM — the old way: HOST → a room of one → its podium offers PLAY AGAIN (the quick start) beside BACK TO
    //  THE ROOM, + SHARE)
    const P = await phone('lonely');
    await P.ev("document.querySelector('.nd-hostbtn').click()");
    if (!await P.waitFor(`!!(${S}.code && ${S}.meta && ${S}.meta.hostId === ${S}.uid && window.__arcade.state.presence && Object.keys(${S}.players || {}).length === 1)`, 20000)) ok(false, 'a room of one');
    await sleep(1200);
    await P.ev("import('/js/host.js').then(m => m.startGame('prism', { mode: 'rush' }))");
    await P.waitFor(`${S}.game && (${S}.game.phase === 'count' || ${S}.game.phase === 'play')`, 20000);
    await sleep(1500);
    if (!await endRun(P)) ok(false, 'the room of one reached its podium');
    await sleep(800);
    const foot = await P.ev("({ again: !!document.querySelector('.final .final-again'), back: !!document.querySelector('.final .final-back'), city: !!document.querySelector('.final .final-city'), share: !!document.querySelector('.final .final-share') })");
    ok(foot.again && foot.back && !foot.city && foot.share, `a ROOM OF ONE's podium: PLAY AGAIN + BACK TO THE ROOM + SHARE (${JSON.stringify(foot)})`);
    await P.shot('one-podium');
    const m1 = await P.ev(`${S}.game.matchId`);
    await P.ev("document.querySelector('.final .final-again').click()");
    const again = await P.waitFor(`!!(${S}.game && ${S}.game.matchId !== ${JSON.stringify(m1)} && /^q/.test(${S}.game.matchId))`, 15000);
    ok(again, 'PLAY AGAIN in a room of one → the same game again, THE QUICK START (a q… match)');
    await P.ev("import('/js/room.js').then(m => m.leaveRoom())"); await sleep(800);
    await P.ctx.close();
  }
  if (!ONLY.length || ONLY.includes('friends')) {
    const P = await phone('friendly');
    await openCard(P, 'prism');
    await P.ev("document.querySelector('.nd-card-friends').click()");
    const inRoom = await P.waitFor(`!!(${S}.code && ${S}.meta && ${S}.meta.hostId === ${S}.uid)`, 20000);
    const opts = await P.waitFor("[...document.querySelectorAll('.sh.options.is-in .sh-t b')].some(b => /PRISM DROP/.test(b.textContent))", 6000);
    if (!opts) console.log('   sheets:', await P.ev("JSON.stringify([...document.querySelectorAll('.sh')].map(e => e.className + ' :: ' + ((e.querySelector('.sh-t b') || {}).textContent || '')))"), await P.ev("(() => { try { return sessionStorage.getItem('nd:pick'); } catch { return 'x'; } })()"));
    const st = await P.ev(`(() => { const s = ${S}; return { locked: !!s.meta.locked, solo: !!(s.meta.settings && s.meta.settings.solo) }; })()`);
    ok(inRoom && opts && !st.locked && !st.solo, `PLAY WITH FRIENDS → a normal room (unlocked ${!st.locked}, not solo ${!st.solo}) with PRISM DROP's options open (${opts})`);
    await P.shot('friends-options');
    await P.ev("import('/js/room.js').then(m => m.leaveRoom())"); await sleep(800);
    await P.ctx.close();
  }
  if (!ONLY.length || ONLY.includes('holdem')) {
    const P = await phone('holder');
    await openCard(P, 'holdem');
    const c = await P.ev("({ solo: !!document.querySelector('.nd-card-solo'), main: (document.querySelector('.nd-card-actions .btn-primary') || {}).textContent, note: (document.querySelector('.nd-card-note') || {}).textContent })");
    ok(!c.solo && /PLAY WITH FRIENDS/.test(c.main || '') && c.note === 'Needs 2+ players', `HOLD'EM's card: no PLAY NOW, PLAY WITH FRIENDS the main, "${c.note}"`);
    await P.shot('card-holdem');
    await P.ev("document.querySelector('.nd-card-friends').click()");
    const opts = await P.waitFor(`!!${S}.code && [...document.querySelectorAll('.sh.options.is-in .sh-t b')].some(b => /HOLD/.test(b.textContent))`, 20000);
    ok(opts, 'PLAY WITH FRIENDS → a room with HOLD\'EM picked (its options open)');
    await P.ev("import('/js/room.js').then(m => m.leaveRoom())"); await sleep(800);
    await P.ctx.close();
  }
  if (!ONLY.length || ONLY.includes('sign')) {
    const P = await phone('signer');
    await P.ev('window.__district.idle && window.__district.idle()').catch(() => {});
    const r = await P.ev("(() => { const n = window.__district.harbor().neon; const s = n.signs.find(x => x.game === 'prism' && x.rect); return s ? s.rect : null; })()");
    if (!r) ok(false, 'the PRISM DROP sign on screen');
    else {
      const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
      await P.p.mouse.move(cx, cy); await P.p.mouse.down(); await sleep(60); await P.p.mouse.up();   // (pointerdown + pointerup, as a finger)
      let card = await P.waitFor("!!document.querySelector('.nd-card-sheet.is-in .nd-card[data-game=\"prism\"]')", 4000);
      if (!card) { await P.p.mouse.move(cx, cy); await P.p.mouse.down(); await sleep(60); await P.p.mouse.up(); card = await P.waitFor("!!document.querySelector('.nd-card-sheet.is-in .nd-card[data-game=\"prism\"]')", 4000); }   // (the first touch may only wake a resting dock)
      ok(card, `a tap on the PRISM DROP sign (${Math.round(cx)}, ${Math.round(cy)}) → PRISM DROP's card`);
      await P.shot('sign-card');
    }
    await P.ctx.close();
  }
} catch (e) { ok(false, `the run: ${e.message}`); }
await browser.close();
const bad = results.filter(r => !r.ok);
console.log(`e2e-playnow (${BROWSER}): ${results.length - bad.length}/${results.length} passed`);
process.exit(bad.length ? 1 : 0);
