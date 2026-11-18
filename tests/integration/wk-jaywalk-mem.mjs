// JAYWALK — THE GO-LIVE REVIEW: THE MEMORY ON WEBKIT (the engine an iPhone runs — H6B measured Chromium only; the owner's /admin:
// "PAGE KILLED (likely memory) · game:jaywalk/final · iPhone"). Playwright's WebKit (~/wk) as a phone, 390 × 844 @3, on the LOCAL server
// + the emulators (NEVER THE LIVE SITE):
//   · SOLO: the owner's phone plays TEN runs in a row (PLAY AGAIN each time). On every FINAL screen: what the page HOLDS, counted in the
//     page (kit/jaywalk-mem.mjs — the 3D buffer + the bloom + every canvas + the kept picture; the SAME sum as the Chromium checks) must
//     stay under THE FINAL SCREEN's BUDGET (JW_FINAL_BUDGET_MB) — and the WEB PROCESS's own working set (Windows: the real memory of the
//     tab's process — the nearest thing to a phone's number a desktop can give) must not climb run over run (a leak)
//   · A 4-PHONE MATCH (four WebKit phones in one room, the owner hosts): everyone's FINAL screen (the podium) under the same budget
//   · THE LEAVE (BEFORE THE FLIP — the inbox's Nov 17 5:55 pm entry: /admin's "the WebGL context was lost" with screen = title): the runs
//     in a row keep no old view alive (a listener on the kept canvas held each one); BACK TO THE CITY → NO REPORT, NO REBUILD, no live
//     JAYWALK GL context / canvas left; 5 × (a run + leave) → back to the city's baseline (+ the web process printed); PLAY AGAIN's
//     parked scene let go by its timeout the same; a REAL loss mid-run still rebuilds + reports once
//   node tests/integration/wk-jaywalk-mem.mjs [outDir] [--runs=10] [--no-match] [--no-leave] [--leave-only]     (exit 0 + "SKIPPED" where ~/wk is not installed: the cloud)
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';
import { guardUrl } from './kit/live-guard.mjs';
import { memAt, memLine, JW_FINAL_BUDGET_MB } from './kit/jaywalk-mem.mjs';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const argv = process.argv.slice(2), OUT = argv.find(a => !a.startsWith('--')) || null, RUNS = Number((argv.find(a => a.startsWith('--runs=')) || '').slice(7)) || 10, MATCH = !argv.includes('--no-match') && !argv.includes('--leave-only'), LEAVE = !argv.includes('--no-leave'), LEAVES = Number((argv.find(a => a.startsWith('--leaves=')) || '').slice(9)) || 5;
const at = process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs');
if (!existsSync(at)) { console.log('SKIPPED — Playwright\'s WebKit is not installed here (~/wk)'); process.exit(0); }
if (OUT) mkdirSync(OUT, { recursive: true });
const { webkit } = await import(pathToFileURL(at).href);
const DB = 'http://127.0.0.1:9000', NS = 'ns=demo-arcade-default-rtdb', AUTH = { Authorization: 'Bearer owner' };
const dbGet = path => fetch(`${DB}/${path}.json?${NS}`, { headers: AUTH }).then(r => r.json());
const dbPut = (path, v) => fetch(`${DB}/${path}.json?${NS}`, { method: 'PUT', headers: AUTH, body: JSON.stringify(v) }).then(r => r.json());
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fails = [];
let n = 0;
const ok = (c, what) => { n++; if (!c) fails.push(what); console.log(c ? 'OK  ' : 'FAIL', what); };
const UP = '!!(window.__district && window.__district.harbor() && window.__district.harbor().shown) && !!window.__arcade && window.__arcade.state.ready && !!window.__arcade.state.uid';
const S = 'window.__arcade.state', G = 'window.__jwGame';
const FINAL = `${S}.game && ${S}.game.phase === 'final' && !!document.querySelector('.jw-final')`;

/** the WebKit processes' working sets (MB, Windows): { web: every WebKitWebProcess (one a page), all: + the UI, network + GPU ones } */
function wkMb() {
  if (process.platform !== 'win32') return null;
  try {
    const out = execSync('powershell -NoProfile -Command "Get-Process | Where-Object { $_.ProcessName -match \'^(WebKitWebProcess|WebKitNetworkProcess|WebKitGPUProcess|Playwright)$\' } | ForEach-Object { $_.ProcessName + \' \' + $_.WorkingSet64 }"', { encoding: 'utf8', timeout: 20000 });
    let web = 0, all = 0, webN = 0;
    for (const l of out.split(/\r?\n/)) { const m = /^(\S+) (\d+)$/.exec(l.trim()); if (!m) continue; all += +m[2]; if (m[1] === 'WebKitWebProcess') { web += +m[2]; webN++; } }
    return { web: Math.round(web / 1048576), all: Math.round(all / 1048576), webN };
  } catch { return null; }
}

const b = await webkit.launch();
async function phone(slot, name, qs = '') {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  // (THE LEAVE's counters: every WebGL context + every canvas the page makes, held WEAKLY — "alive" = still reachable after a GC)
  await ctx.addInitScript(() => {
    const gls = [], cvs = [], gc0 = HTMLCanvasElement.prototype.getContext, ce = Document.prototype.createElement;
    HTMLCanvasElement.prototype.getContext = function (t, o) { const c = gc0.call(this, t, o); if (c && /webgl/.test(t) && !gls.some(r => r.deref() === c)) gls.push(new WeakRef(c)); return c; };
    Document.prototype.createElement = function (n, o) { const e = ce.call(this, n, o); if (String(n).toLowerCase() === 'canvas') { cvs.push(new WeakRef(e)); if (window.__cvStack) window.__cvStack.set(e, (new Error().stack || '').split('\n').slice(1, 5).map(l => l.replace(/^.*\/(js|assets)\//, '').replace(/\?[^:]*/, '')).join(' < ')); } return e; };
    window.__cvStack = new WeakMap(); window.__cvMark = () => { window.__cvBase = new WeakSet(cvs.map(r => r.deref()).filter(Boolean)); };
    window.__cvNew = () => { const out = {}; for (const r of cvs) { const x = r.deref(); if (!x || x.width * x.height === 0 || (window.__cvBase && window.__cvBase.has(x))) continue; const k = window.__cvStack.get(x) || '?'; out[k] = (out[k] || 0) + 1; } return out; };
    window.__leak = () => {
      const g = gls.map(r => r.deref()).filter(Boolean), c = cvs.map(r => r.deref()).filter(Boolean);
      const jw = x => typeof x.className === 'string' && /^jw-/.test(x.className);
      return { glLive: g.filter(x => !x.isContextLost()).length, glJw: g.filter(x => !x.isContextLost() && jw(x.canvas)).length, glHeld: g.filter(x => jw(x.canvas)).length,
        cvPix: c.filter(x => x.width * x.height > 0).length, cvKinds: (() => { const m = {}; for (const x of c) if (x.width * x.height > 0) { let e = x, t = ''; for (let k = 0; e && k < 4 && !t; k++, e = e.parentElement) t = typeof e.className === 'string' && e.className ? e.className.split(' ')[0] : ''; t = (x.isConnected ? '' : '(detached) ') + (t || 'canvas'); m[t] = (m[t] || 0) + 1; } return m; })(), cvJw: c.filter(x => jw(x) && x.width * x.height > 0).length, jwInDom: !!document.querySelector('canvas.jw-canvas') };
    };
  });
  await ctx.addInitScript(s => { try { localStorage.setItem('nd:entered', '1'); if (s[1]) localStorage.setItem(`na:${s[0]}:profile`, JSON.stringify({ name: s[1], color: 'cyan', avatar: 'bolt' })); } catch { /* fine */ } }, [slot, name]);
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => { const m = String(e.message || e); if (!/ResizeObserver loop/.test(m)) errs.push(m); });   // (WebKit's benign "ResizeObserver loop completed with undelivered notifications": no error — the site's own errlog drops it too)
  const ev = js => p.evaluate(js);
  const waitFor = async (js, ms = 20000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* navigating */ } await sleep(60); } return false; };
  const open = async () => { await p.goto(guardUrl(`${BASE}/?emu&slot=${slot}&city=2&when=2026-11-10T20:30${qs}`, 'wk-jaywalk-mem.mjs'), { waitUntil: 'domcontentloaded' }); if (!await waitFor(UP, 90000)) throw new Error(`${name}: the city never came up`); };
  const tap = async sel => { const r = await p.evaluate(q => { const el = document.querySelector(q); if (!el) return null; const x = el.getBoundingClientRect(); return [x.left + x.width / 2, x.top + x.height / 2]; }, sel); if (!r) return null; await p.touchscreen.tap(r[0], r[1]); return r; };
  /** a tap on something that may still be sliding in (a sheet): its box read until it stands still, the tap repeated until `then` holds */
  const tapUntil = async (sel, then, ms = 12000) => {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      let last = null;
      for (let i = 0; i < 20; i++) { const r = await p.evaluate(q => { const el = document.querySelector(q); if (!el) return null; const x = el.getBoundingClientRect(); return [Math.round(x.left + x.width / 2), Math.round(x.top + x.height / 2)]; }, sel); if (r && last && r[0] === last[0] && r[1] === last[1]) break; last = r; await sleep(120); }
      if (last) await p.touchscreen.tap(last[0], last[1]);
      if (await waitFor(then, 3000)) return true;
    }
    return false;
  };
  const shot = async f => { if (OUT) await p.screenshot({ path: join(OUT, f) }).catch(() => {}); };
  await open();
  return { p, ev, waitFor, open, tap, tapUntil, shot, errs, name, close: () => ctx.close() };
}
const pidOf = async P => { const uid = await P.ev(`${S}.uid`); for (let i = 0; i < 80; i++) { const pid = await dbGet(`uids/${uid}`); if (pid) return { uid, pid }; await sleep(250); } return { uid, pid: null }; };
/** the console's end-of-round moment (XP, a level, a card) opens over the end screen a beat after it: wait its window out, tap it away */
async function pastMoment(P, endAt) {
  while (Date.now() - endAt < 6500 && !(await P.ev("!!document.querySelector('.pg-moment')"))) await sleep(200);
  for (let i = 0; i < 10 && await P.ev("!!document.querySelector('.pg-moment')"); i++) {
    await P.ev("(() => { const m = document.querySelector('.pg-moment'), b = m && m.querySelector('.pg-btn'); if (b && m.classList.contains('is-end')) b.click(); else if (m) m.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); })()");
    await sleep(700);
  }
}
/** (the emulator stays clean for the other suites: the run cards these phones' end screens uploaded are removed) */
async function dropRunCards(pids) {
  await sleep(2500);
  const all = (await dbGet('shr')) || {};
  for (const [code, c] of Object.entries(all)) if (c && pids.includes(c.p) && c.k === 'run') { await dbPut(`shr/${code}`, null); if (c.d) await dbPut(`shrx/${c.d}/${code}`, null); }
  for (const pid of pids) await dbPut(`shrp/${pid}:jaywalk`, null);
}
/** WebKit gives no gc(): a burst of short-lived garbage makes it collect (WeakRefs clear only after a GC + the job's end) */
// (+ big buffers: an old-generation object's WeakRef clears only after a FULL collection — a burst of small objects alone may be young-only)
async function churn(P) { for (let k = 0; k < 6; k++) { await P.ev('(() => { let n = 0; for (let i = 0; i < 60; i++) { const a = []; for (let j = 0; j < 40000; j++) a.push({ j, s: "x" + j }); n += a.length; } for (let i = 0; i < 12; i++) { const b = new Float64Array(4e6); b[i] = i; n += b.length; } return n; })()'); await sleep(250); } }
const WEBGL_LOST = "(window.__errlog ? window.__errlog.seen() : []).filter(k => /WebGL context was lost/.test(k)).length";
const CITY_BACK = `!${S}.game && !document.querySelector('.jw-game') && !!(window.__district && window.__district.harbor() && window.__district.harbor().shown)`;
async function toGame(P) {
  const step = (ok, what) => { if (!ok) console.log('   toGame stopped at:', what); return ok; };
  if (!step(await P.tapUntil('.nd-tab-play', "!!document.querySelector('.nd-shelf-sheet.is-in .nd-shelf-row[data-game=\"jaywalk\"]')"), 'the shelf')) return false;
  if (!step(await P.tapUntil('.nd-shelf-row[data-game="jaywalk"]', "!!document.querySelector('.nd-card-sheet.is-in .nd-card[data-game=\"jaywalk\"] .nd-card-solo')"), 'the card')) return false;
  if (!step(await P.tapUntil('.nd-card-solo', `${S}.game && ${S}.game.id === 'jaywalk' && !!document.querySelector('.jw-game canvas.jw-canvas') && !!${G}`, 45000), 'PLAY NOW → the game')) return false;
  return step(await P.waitFor(`${G}.state().mode === 'run'`, 12000), 'GO');
}
async function oneRun(P) { await P.ev(`${G}.bot(true)`); await sleep(2500); await P.ev(`${G}.bot(false)`); const up = await P.waitFor(FINAL, 70000); if (up) await pastMoment(P, Date.now()); return up; }
async function toCity(P, parkIt = false) {
  if (parkIt) await P.ev('globalThis.__nsAgainAt = performance.now()');   // (as if PLAY AGAIN had just been tapped: the scene is PARKED, then let go by park()'s 2.5 s timeout)
  await P.tap('.final-city');
  const back = await P.waitFor(CITY_BACK, 20000);
  await sleep(3400);   // (past park()'s 2.5 s + the lost event's own task)
  return back;
}
async function leaveChecks(P) {
  // (1) the runs in a row: no old view kept alive (a GC can lag one beat behind: asked up to three times)
  let alive = -1;
  // (WebKit's GC scans the stack conservatively: the last 2–3 views can stay reachable a while — measured 2 · 3 · 7 (small churn); the BUG
  //  held every one: 10 after 10 runs, 8 after 5 leaves — the line is 3)
  for (let k = 0; k < 3 && (alive < 0 || alive > 3); k++) { await churn(P); alive = await P.ev('globalThis.__jwViews ? globalThis.__jwViews() : -1'); }
  ok(alive >= 1 && alive <= 3, `THE LEAVE — ${RUNS} runs in a row (PLAY AGAIN): ${alive} JAYWALK views still alive after a full GC (≤ 3 — the last few a conservative GC may keep; the listener on the kept canvas that held each old view made it ${RUNS})`);
  const scenes0 = await P.ev('globalThis.__jwScenes()'), lost0 = await P.ev(WEBGL_LOST);
  // (2) BACK TO THE CITY
  ok(await toCity(P), 'THE LEAVE: BACK TO THE CITY → the city');
  await churn(P);
  let L = await P.ev('window.__leak()');
  const lost1 = await P.ev(WEBGL_LOST), scenes1 = await P.ev('globalThis.__jwScenes()');
  console.log('   after the leave:', JSON.stringify(L), '· WebGL-lost reports', lost1, '· scenes', scenes0, '→', scenes1);
  ok(lost1 === lost0 && lost1 === 0, `THE LEAVE: our own teardown is NOT reported as a lost context (${lost1} "WebGL context was lost" reports on this page)`);
  ok(scenes1 === scenes0, `THE LEAVE: nothing is rebuilt after the game has gone (scenes made ${scenes0} → ${scenes1})`);
  ok(L.glJw === 0 && !L.jwInDom && L.cvJw === 0, `THE LEAVE: no live JAYWALK GL context (${L.glJw}), no JAYWALK canvas holding pixels (${L.cvJw}), none in the page (${L.jwInDom})`);
  await P.ev('window.__cvMark()');
  const base = { ...L, mb: wkMb() };
  console.log('MEM the city after the first leave (the baseline):', JSON.stringify(base));
  // (3) LEAVES (5) × (a run + leave) — the 3rd one through PLAY AGAIN's parked scene + its timeout
  const per = [];
  for (let k = 1; k <= LEAVES; k++) {
    if (!await toGame(P)) { ok(false, `THE LEAVE ${k}/5: back into the game`); return; }
    if (!await oneRun(P)) { ok(false, `THE LEAVE ${k}/5: the run's end`); return; }
    if (!await toCity(P, k === 3)) { ok(false, `THE LEAVE ${k}/5: back to the city`); return; }
    await churn(P); const wm = wkMb(); per.push(wm ? wm.web : null);
  }
  console.log('MEM the web process after each leave:', per.join(' → '), 'MB');
  let views = 99;
  for (let k = 0; k < 3 && views > 3; k++) { await churn(P); views = await P.ev('globalThis.__jwViews()'); }
  L = await P.ev('window.__leak()');
  const w = wkMb(), lost2 = await P.ev(WEBGL_LOST);
  console.log(`MEM after ${LEAVES} × (a run + leave):`, JSON.stringify({ ...L, mb: w, views }));
  ok(lost2 === 0 && await P.ev('globalThis.__jwScenes()') === scenes1 + LEAVES, `THE LEAVE × ${LEAVES} (one through the PARKED scene's timeout): no lost-context report (${lost2}), exactly one scene a run (no rebuild)`);
  // (the canvases made since the baseline, by who made them: the city re-bakes its own on every return — its count moves both ways)
  const made = await P.ev('window.__cvNew()'), ours = Object.entries(made).filter(([k]) => /games\/jaywalk\//.test(k));
  console.log('   the views alive:', JSON.stringify(await P.ev('globalThis.__jwViewIds ? globalThis.__jwViewIds() : null')), '· canvases made since the baseline (by who):', Object.keys(made).length, 'kinds');
  ok(L.glJw === 0 && L.cvJw === 0 && L.glLive <= base.glLive && ours.length === 0, `THE LEAVE × ${LEAVES}: back to the city's baseline — live GL contexts ${base.glLive} → ${L.glLive} (JAYWALK's ${L.glJw}, held at all ${L.glHeld}), no canvas made by JAYWALK still holding pixels (${ours.map(([k, n]) => n + ' × ' + k).join(' | ') || 'none'}) — the city's own ${base.cvPix} → ${L.cvPix}`);
  ok(views <= 3, `THE LEAVE × ${LEAVES}: ${views} JAYWALK views alive after a full GC (≤ 3 — the test hook's last one + what a conservative GC keeps a while; the bug held ${RUNS + LEAVES - 2}+)`);
  // (the web process is PRINTED, never asserted: WebKit's GPU + allocator swing it ± 350 MB between two leaves with no trend — measured
  // 927 → 777 → 1005 → 1132 → 795; the counts above are the proof)
  if (w && base.mb) console.log(`MEM the tab's own process: ${base.mb.web} MB at the baseline → ${w.web} MB after ${LEAVES} leaves`);
  // (4) A REAL loss mid-run: rebuilt + reported once
  if (!await toGame(P)) { ok(false, 'THE REAL LOSS: back into the game'); return; }
  const s0 = await P.ev('globalThis.__jwScenes()');
  await P.ev("(() => { const c = document.querySelector('canvas.jw-canvas'), g = c && (c.getContext('webgl2') || c.getContext('webgl')), x = g && g.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); return !!x; })()");
  const re = await P.waitFor(`globalThis.__jwScenes() === ${s0 + 1} && !!document.querySelector('.jw-game canvas.jw-canvas')`, 8000);
  await sleep(1200);
  const lost3 = await P.ev(WEBGL_LOST), cvN = await P.ev("document.querySelectorAll('.jw-game canvas.jw-canvas').length");
  ok(re && lost3 === 1 && cvN === 1, `THE REAL LOSS mid-run: the scene is rebuilt (scenes ${s0} → ${await P.ev('globalThis.__jwScenes()')}, one 3D canvas: ${cvN}) + /admin hears of it ONCE (${lost3})`);
  await P.ev(`${G}.bot(true)`); await sleep(1500); await P.ev(`${G}.bot(false)`); await P.waitFor(FINAL, 70000);
  await pastMoment(P, Date.now()); await toCity(P);
}
const pids = [];
let soloPeak = 0, matchPeak = 0, webFirst = null, webLast = null, webPeak = 0;

try {
  // ------------------------------------------------------------------------------------------------ SOLO × RUNS
  const P = await phone(`wkm${Date.now() % 100000}`, 'HOPPER');
  const { pid } = await pidOf(P);
  ok(!!pid, 'WebKit, 390 × 844 @3: the phone has its profile'); pids.push(pid);
  await dbPut(`testAdmins/${pid}`, true);
  await P.ev('sessionStorage.clear()'); await P.open();
  ok(await P.waitFor("import('/js/config.js').then(c => c.isOwnerTest('jaywalk'))", 25000), 'the owner\'s phone: JAYWALK is his to test');
  ok(await P.tapUntil('.nd-tab-play', "!!document.querySelector('.nd-shelf-sheet.is-in .nd-shelf-row[data-game=\"jaywalk\"]')"), 'PLAY → the shelf lists JAYWALK');
  ok(await P.tapUntil('.nd-shelf-row[data-game="jaywalk"]', "!!document.querySelector('.nd-card-sheet.is-in .nd-card[data-game=\"jaywalk\"] .nd-card-solo')"), 'its card');
  console.log('MEM the city, before the game:', JSON.stringify(wkMb()));
  ok(await P.tapUntil('.nd-card-solo', `${S}.game && ${S}.game.id === 'jaywalk' && !!document.querySelector('.jw-game canvas.jw-canvas') && !!${G}`, 45000), 'PLAY NOW → the game\'s own screen (WebKit renders the 3D scene)');
  ok(await P.waitFor(`${G}.state().mode === 'run'`, 12000), 'GO landed: the run is on');
  const info = await P.ev(`(() => { const i = ${G}.state().info || {}; return { dpr: i.dpr, tier: i.tier, w: i.w, h: i.h }; })()`);
  console.log('   the scene:', JSON.stringify(info));
  for (let r = 1; r <= RUNS; r++) {
    // a few hops (the bot — the page's own input path), then the kid stands: the blackout or the traffic takes them
    await P.ev(`${G}.bot(true)`); await sleep(r % 3 === 0 ? 6000 : 2500); await P.ev(`${G}.bot(false)`);
    if (r === 1) { const m = await memAt(P.p), w = wkMb(); console.log(memLine('mid-run (for scale)', m, null), w ? `· the web process ${w.web} MB` : ''); await P.shot('wk-solo-mid-run.png'); }
    const up = await P.waitFor(FINAL, 70000), endAt = Date.now();
    if (!up) { ok(false, `run ${r}: its end screen never came`); break; }
    await pastMoment(P, endAt);
    await sleep(1500);
    const m = await memAt(P.p), w = wkMb();
    soloPeak = Math.max(soloPeak, m.pix);
    if (w) { if (webFirst == null && r >= 2) webFirst = w.web; webLast = w.web; webPeak = Math.max(webPeak, w.web); }
    console.log(memLine(`run ${r} — the final screen`, m, null), w ? `· the web process ${w.web} MB (every WebKit process ${w.all})` : '');
    ok(m.pix <= JW_FINAL_BUDGET_MB && m.rest !== false, `run ${r}: the final screen holds ${m.pix} MB of pixels — the scene RESTING (≤ ${JW_FINAL_BUDGET_MB})`);
    if (r === 1 || r === RUNS) await P.shot(`wk-solo-final-run-${r}.png`);
    if (r === RUNS) break;
    const m0 = await P.ev(`${S}.game.matchId`);
    await P.tap('.final-again');
    if (!await P.waitFor(`${S}.game && ${S}.game.matchId !== '${m0}' && !!${G} && ${G}.state().matchId === ${S}.game.matchId && ${G}.state().mode === 'run'`, 20000)) { ok(false, `run ${r}: PLAY AGAIN never brought the next run`); break; }
  }
  ok(soloPeak <= JW_FINAL_BUDGET_MB, `WEBKIT, ${RUNS} SOLO RUNS IN A ROW: the most held on a final screen = ${soloPeak} MB of pixels (the budget ${JW_FINAL_BUDGET_MB})`);
  if (webFirst != null) ok(webLast - webFirst <= 80, `… and the tab's own process does not climb: ${webFirst} MB on run 2's final screen → ${webLast} MB on run ${RUNS}'s (peak ${webPeak}; a leak would add up)`);
  ok(P.errs.length === 0, `no page error in ${RUNS} runs (${P.errs.slice(0, 2).join(' | ')})`);
  if (LEAVE) await leaveChecks(P);
  else { await P.tap('.final-city'); await sleep(800); }
  await P.close();

  // ------------------------------------------------------------------------------------------------ A 4-PHONE MATCH's FINAL
  if (MATCH) {
    const NAMES = ['ALICE', 'BOB', 'CHARLIE', 'DANA'], slot = `wkr${Date.now() % 100000}`, Q = [];
    const H = await phone(`${slot}0`, '');
    for (let k = 0; k < 5 && !(await H.ev("!!document.querySelector('.setup-screen input.input')")); k++) { await H.p.click('.nd-host').catch(() => {}); await H.waitFor("!!document.querySelector('.setup-screen input.input')", 6000); }
    await H.p.fill('.setup-screen input.input', NAMES[0]); await H.p.click('.form-cta .btn-primary');
    ok(await H.waitFor(`!!${S}.code && !!document.querySelector('.title-screen.is-room .rdk-dock, .lobby-screen .room-code')`, 25000), 'the host\'s room is open (WebKit)');
    const code = await H.ev(`${S}.code`); Q.push(H);
    for (let i = 1; i < 4; i++) {
      const J = await phone(`${slot}${i}`, '', `&room=${code}`);
      await J.waitFor("!!document.querySelector('.nd-go') && !document.getElementById('boot')", 25000);
      await J.p.click('.nd-go'); await J.waitFor("!!document.querySelector('.input-code')", 10000);
      await J.p.fill('.setup-screen input.input:not(.input-code)', NAMES[i]); await J.p.click('.form-cta .btn-primary');
      ok(await J.waitFor(`!!${S}.code && !!document.querySelector('.title-screen.is-room, .lobby-screen')`, 25000), `${NAMES[i]} joined`);
      Q.push(J);
    }
    ok(await H.waitFor(`Object.keys(${S}.players || {}).length === 4`, 30000), 'four WebKit phones in the room');
    const hp = await pidOf(H); pids.push(hp.pid);
    for (const J of Q.slice(1)) { const q = await pidOf(J); if (q.pid) pids.push(q.pid); }
    await dbPut(`testAdmins/${hp.pid}`, true);
    await H.ev('sessionStorage.clear()'); await H.p.reload();
    await H.waitFor(`${S}.ready && !!${S}.code && Object.keys(${S}.players || {}).length === 4`, 40000);
    ok(await H.waitFor("import('/js/config.js').then(c => c.isOwnerTest('jaywalk'))", 25000), 'the owner hosts');
    ok(await H.p.evaluate(() => import('/js/host.js').then(m => m.startGame('jaywalk', {}))), 'the owner starts JAYWALK');
    for (const J of Q) ok(await J.waitFor(`${S}.game && ${S}.game.id === 'jaywalk' && !!${G} && !!document.querySelector('.jw-game canvas.jw-canvas')`, 45000), `${J.name || 'ALICE'}: the match screen`);
    for (const J of Q) await J.waitFor(`${G}.state().mode === 'run'`, 20000);
    for (const J of Q) await J.ev(`${G}.bot(true, { lazy: true })`);
    await sleep(7000);
    { const w = wkMb(); console.log('MEM mid-match, four phones:', JSON.stringify(w)); await Q[1].shot('wk-match-mid.png'); }
    for (const J of Q) await J.ev(`${G}.bot(false)`);
    for (let i = 0; i < 4; i++) ok(await Q[i].waitFor(`${FINAL} && !!document.querySelector('.jw-final .final')`, 90000), `${NAMES[i]}: the podium`);
    const endAt = Date.now();
    for (const J of Q) await pastMoment(J, endAt);
    await sleep(2000);
    for (let i = 0; i < 4; i++) {
      const m = await memAt(Q[i].p); matchPeak = Math.max(matchPeak, m.pix);
      console.log(memLine(`${NAMES[i]} — the match's final screen`, m, null));
      ok(m.pix <= JW_FINAL_BUDGET_MB && m.rest !== false, `${NAMES[i]}: the podium holds ${m.pix} MB of pixels — the scene RESTING (≤ ${JW_FINAL_BUDGET_MB})`);
    }
    { const w = wkMb(); if (w) console.log(`MEM the match's final, four phones: the web processes ${w.web} MB together (${w.webN} of them — ≈ ${Math.round(w.web / Math.max(1, w.webN))} MB a phone) · every WebKit process ${w.all} MB`); }
    await Q[0].shot('wk-match-podium-host.png'); await Q[2].shot('wk-match-podium-guest.png');
    ok(matchPeak <= JW_FINAL_BUDGET_MB, `WEBKIT, A 4-PHONE MATCH's FINAL: the most a phone holds = ${matchPeak} MB of pixels (the budget ${JW_FINAL_BUDGET_MB})`);
    ok(Q.every(J => J.errs.length === 0), `no page error on the four phones (${Q.flatMap(J => J.errs).slice(0, 2).join(' | ')})`);
    for (const J of Q) await J.close();
  }
} catch (e) { ok(false, `the check itself failed: ${e && e.stack ? e.stack.split('\n').slice(0, 3).join(' / ') : e}`); }
finally { try { await dropRunCards(pids.filter(Boolean)); } catch { /* the emulator is gone */ } await b.close().catch(() => {}); }
console.log(`\nWK-MEM solo peak ${soloPeak} MB · match peak ${matchPeak} MB (pixels held, the budget ${JW_FINAL_BUDGET_MB}) · the tab's process: run 2 ${webFirst} → run ${RUNS} ${webLast} MB (peak ${webPeak})`);
console.log(`${n - fails.length}/${n} checks${fails.length ? ' — FAILED:\n  ' + fails.join('\n  ') : ' — all green'}`);
process.exit(fails.length ? 1 : 0);
