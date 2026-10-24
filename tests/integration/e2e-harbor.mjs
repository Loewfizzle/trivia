// CITY 2.0 — THE HARBOR end to end (docs/harbor.md). Needs the emulators + scripts/serve.mjs --emu.
//   node e2e-harbor.mjs "<browser path>" ./shots-harbor        (env SHOTS=0, CPU=4, GPU=1)
// ?city=2 loads the Harbor with no errors and with every title flag (&when &tz &at &wx &force &speed &grid &debug); a normal
// visit (no flag) gets today's city and never loads a harbor file; the flag is never saved (localStorage, sessionStorage,
// cookies) — a reload without it is today's city; the dock: HOST opens a room, JOIN by typing joins it, a knock on the
// speakeasy's door opens JOIN; frame pacing within the City 2.0 budget at 4× CPU; 20 title ↔ setup cycles leave one city, no
// growing heap and the same offscreen memory; a hidden tab stops rendering. Screens at the six review sizes. THE PREVIEW PANEL
// (JUST ME live + kept for the tab + CLEAR ALL; EVERYONE: city2/live on two phones in sync, a late arrival, until, clear) —
// ONLY=panel runs just that part.
//
// GROUPS (NEON PASS 5 — the suite had grown to ~90 checks and 3 ½ minutes): ONLY=core,flags,skyline,neon,water,harbor,sky,
// party,panel,dock,music,perf (comma-separated) runs those groups in this process. With no ONLY the independent groups run in PARALLEL
// shards (SHARDS=3 child processes, each its own browser — the same checks), then the two that must run alone: panel (it writes
// the shared city2/live node every ?city=2 page listens to) and perf (CPU-throttled timing). SHARDS=1: everything in this process.
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const BROWSER = process.argv[2];
const OUT = (process.argv[3] || './shots-harbor').replace(/\/?$/, '/');
mkdirSync(OUT, { recursive: true });
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const SHOTS = process.env.SHOTS !== '0';
const CPU = Number(process.env.CPU || 4);
// City 2.0's absolute budgets per tier (ms of scene work a frame): WARNINGS only since C1.5 — this laptop's no-GPU number is
// not the phone's (docs/harbor.md#performance). The gate is a relative A/B (title-perf.mjs --ab) + the owner's iPhone.
const BUDGET_MS = { 2: 8, 1: 6, 0: 4 };
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = [], checks = [];
const ok = (cond, what) => { checks.push({ what, ok: !!cond }); log(cond ? 'OK  ' : 'FAIL', what); if (!cond) errors.push(`check failed: ${what}`); };
// THE CLOUD'S SLOWER MACHINE (Oct 24): a check that measures pure SPEED — frames drawn in a window, a bake finished in time, a sound's
// peak landing in a window, a punch sampled while the loop restarts — is a WARNING there (CI=true, which GitHub sets; or TIMING=warn
// locally): it is logged, counted (`timing warnings N`) and shown in the summary, but never fails the run. A red cloud run always
// means a real problem. Everything else (layout, colours, memory, data, the rules of the city) stays a hard check everywhere.
const TIMING_WARN = process.env.TIMING === 'warn' || (!!process.env.CI && process.env.TIMING !== 'strict');
const warnings = [];
const okT = (cond, what) => { if (cond || !TIMING_WARN) return ok(cond, what); checks.push({ what, ok: true, warn: true }); warnings.push(what); log('WARN', `${what} (a timing check: a warning on this machine)`); };
const GR = '&tz=America/Detroit&at=42.96,-85.67';
const NIGHT = `when=2026-10-21T22:00${GR}`;

let browser = null;               // (launched when this process first runs a group itself: a parent that only shards never opens one)
const launch = async () => browser || (browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio', ...(process.env.GPU ? ['--enable-gpu', '--use-angle=d3d11'] : [])] }));
async function open({ slot = 'h', qs = '', city = true, view = [390, 844], profile = true, dpr = 0, cores = 0, init = null } = {}) {
  const ctx = await (await launch()).createBrowserContext();
  const p = await ctx.newPage();
  const files = [];
  p.on('pageerror', e => { errors.push(`${slot} pageerror: ${e.message}`); log(slot, 'PAGEERROR', e.message); });
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/favicon|ERR_|Failed to load|permission_denied|PERMISSION_DENIED|Client is offline/i.test(t)) { errors.push(`${slot}: ${t}`); log(slot, 'console.error', t); } });
  p.on('request', r => files.push(r.url()));
  const [w, h] = view, mobile = w < 1000;
  await p.setViewport({ width: w, height: h, deviceScaleFactor: dpr || (mobile ? 2 : 1), isMobile: mobile, hasTouch: mobile });
  // (an iPhone: DPR 3, and iOS reports a capped core count — Part 6a's tier check)
  if (cores) await p.evaluateOnNewDocument(n => { Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => n }); }, cores);
  if (init) await p.evaluateOnNewDocument(init.fn, init.arg);
  await p.evaluateOnNewDocument((slotName, prof) => {
    try { localStorage.setItem('nd:entered', '1'); if (prof) localStorage.setItem(`na:${slotName}:profile`, JSON.stringify({ name: 'AVA', color: 'magenta', avatar: 'bolt' })); } catch { /* fine */ }
  }, slot, profile);
  await p.goto(`${BASE}/?emu&slot=${slot}&${qs}${city ? '&city=2' : ''}`);
  await waitFor(p, '!!window.__district && window.__district.phase().done', `title ${slot}`, 25000);
  return { ctx, page: p, files };
}
const ev = (p, js) => p.evaluate(js);
async function waitFor(p, js, what, timeout = 20000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { try { if (await ev(p, js)) return true; } catch { /* navigating */ } await sleep(100); }
  throw new Error(`timeout: ${what}`);
}
async function tapAt(p, x, y) {
  const c = await p.target().createCDPSession();
  await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await c.detach();
}
async function tap(p, sel) {
  const r = await p.evaluate(s => { const el = document.querySelector(s); if (!el) return null; const b = el.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }, sel);
  if (!r) throw new Error(`no ${sel}`);
  await tapAt(p, r.x, r.y);
}
const harborUp = p => waitFor(p, '!!(window.__district.harbor() && window.__district.harbor().shown)', 'the harbor baked', 15000);
const DB = 'http://127.0.0.1:9000';
const dbPut = (path, v) => fetch(`${DB}/${path}.json?ns=demo-arcade-default-rtdb`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: JSON.stringify(v) });
const flags = p => ev(p, 'window.__district.harbor().flags');
const settled = (p, what = 'settled', ms = 15000) => waitFor(p, '!window.__district.harbor().pending && !window.__district.harbor().fading', what, ms);

// ================================================================ THE PREVIEW PANEL (the owner's test remote; ONLY=panel runs just this)
async function panelSection() {
  // ---- JUST ME: the TEST pill + the sheet (&panel=1 under ?emu: the test switch — no admin profile here), live, no reload
  const O = await open({ slot: 'hp', qs: `${NIGHT}&panel=1` });
  await harborUp(O.page);
  await waitFor(O.page, '!!document.querySelector(".hr-pill")', 'the TEST pill', 10000);
  const pill = await ev(O.page, `(() => { const b = document.querySelector('.hr-pill').getBoundingClientRect(); const hits = [...document.querySelectorAll('.menu-btn, .music-btn, .nd-actions, .nd-sign')].map(e => e.getBoundingClientRect()).filter(r => r.width && b.left < r.right && r.left < b.right && b.top < r.bottom && r.top < b.bottom); return { w: b.width, h: b.height, hits: hits.length }; })()`);
  ok(pill.w >= 44 && pill.h >= 44 && pill.hits === 0, `PANEL: the TEST pill (${Math.round(pill.w)}×${Math.round(pill.h)} pt target) clear of the corner buttons, the sign and the dock`);
  await tap(O.page, '.hr-pill');
  await waitFor(O.page, '!!document.querySelector(".hr-sheet")', 'the sheet', 5000); await waitFor(O.page, "document.querySelector('.hr-sheet').getAnimations().every(x => x.playState === 'finished')", 'the sheet up', 5000);
  await sleep(450);
  // PART 7a §0 — THE CATEGORIES: collapsed by default; each preview sits in its registry category (no positions hard-coded here)
  {
    const { PANEL_EVENTS, CATS } = await import('../../js/core/harbor-remote.js');
    const c = await ev(O.page, `(() => { const secs = [...document.querySelectorAll('.hr-sheet .hr-sec')]; return { cats: secs.map(s => s.dataset.cat), open: secs.filter(s => s.classList.contains('is-open') || !s.querySelector('.hr-body').hidden).length,
      heads: secs.map(s => s.querySelector('.hr-cat').getBoundingClientRect().height).filter(h => h > 0), ev: Object.fromEntries([...document.querySelectorAll('.hr-sheet .hr-b[data-ev]')].map(b => [b.dataset.ev, b.closest('.hr-sec').dataset.cat])) }; })()`);
    const wrong = PANEL_EVENTS.filter(e => c.ev[e.id] !== e.cat).map(e => `${e.id}→${c.ev[e.id]}`);
    ok(c.open === 0 && !wrong.length && c.cats.join() === CATS.map(x => x.id).filter(id => c.cats.includes(id)).join() && c.heads.every(h => h >= 44),
      `PANEL: ${c.cats.length} categories (${c.cats.join(' · ')}), all collapsed at first, headers ≥ 44 pt (${Math.min(...c.heads)}), every preview in its registry category${wrong.length ? ` — WRONG: ${wrong.join(', ')}` : ''}`);
  }
  // 8a — PULSE STRENGTH (LIGHTS): the slider drags the city's punch live (JUST ME), the number shown, the status says it, BACK TO 130 %
  {
    await ev(O.page, "window.__district.remote().openCats(['lights'])");
    await waitFor(O.page, "!!document.querySelector('.hr-sec[data-cat=\"lights\"] .hr-range')", 'the slider', 3000);
    const s0 = await ev(O.page, `(() => { const r = document.querySelector('.hr-range'), b = r.getBoundingClientRect(); return { v: r.value, min: r.min, max: r.max, h: b.height, w: b.width, num: document.querySelector('.hr-pv').textContent }; })()`);
    await ev(O.page, `(() => { const r = document.querySelector('.hr-range'); r.value = '180'; r.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    await waitFor(O.page, "window.__district.harbor().flags.q.pulse === '180'", 'the pulse flag live', 3000).catch(() => {});
    await waitFor(O.page, 'window.__district.party().pulse === 1.8', 'the scene read the flag (a frame)', 3000).catch(() => {});   // (the scene reads it once a frame: the cloud's machine needed one)
    const live = await ev(O.page, `({ q: window.__district.harbor().flags.q.pulse, pulse: window.__district.party().pulse, num: document.querySelector('.hr-pv').textContent })`);
    await ev(O.page, `(() => { const r = document.querySelector('.hr-range'); r.dispatchEvent(new Event('change', { bubbles: true })); })()`);
    await sleep(200);
    const st = await ev(O.page, "document.querySelector('.hr-sec[data-cat=\"lights\"] .hr-cat').textContent + ' | ' + document.querySelector('.hr-status').textContent");
    ok(s0.v === '175' && s0.min === '50' && s0.max === '250' && s0.num === '175 %' && s0.h >= 44 && live.q === '180' && live.pulse === 1.8 && live.num === '180 %' && /PULSE 180 %/.test(st),
      `PANEL: PULSE STRENGTH — ${s0.min}–${s0.max} %, starts at ${s0.num} (${Math.round(s0.w)}×${Math.round(s0.h)} pt); dragged to 180 % the city's punch ×${live.pulse} live (&pulse=${live.q}), the number "${live.num}", the status "${st.slice(0, 90)}"`);
    const back = await O.page.evaluate(() => { const b = [...document.querySelectorAll('.hr-sec[data-cat="lights"] .hr-b')].find(x => /^BACK TO 175/.test(x.textContent)); if (b) b.click(); return !!b; });
    await sleep(200);
    const q2 = await ev(O.page, 'window.__district.harbor().flags.q.pulse || null');
    ok(back && q2 === null && (await ev(O.page, 'window.__district.party().pulse')) === 1.75, `PANEL: BACK TO 175 % — the default again (no &pulse: ${q2})`);
    await ev(O.page, 'window.__district.remote().openCats([])');
  }
  // FP — THE DEBUG TOOLS (TOOLS): READOUT + AUDIO PANEL on this phone, live on / off, remembered (no &debug=1 on this page)
  {
    await ev(O.page, "window.__district.remote().openCats(['tools'])");
    await waitFor(O.page, "!!document.querySelector('.hr-sec[data-cat=\"tools\"] [data-tool=\"audio\"]')", 'the tool switches', 3000);
    const st = () => ev(O.page, `({ ro: window.__district.harbor().flags.readout, diag: !!document.querySelector('.ad-diag'), on: [...document.querySelectorAll('.hr-sec[data-cat="tools"] [data-tool]')].filter(b => b.classList.contains('is-on')).map(b => b.dataset.tool), saved: localStorage.getItem('na:dbgtools'), h: Math.min(...[...document.querySelectorAll('.hr-sec[data-cat="tools"] [data-tool]')].map(b => b.getBoundingClientRect().height)) })`);
    const t0 = await st();
    const flipT = id => ev(O.page, `document.querySelector('.hr-sec[data-cat="tools"] [data-tool="${id}"]').click()`);
    await flipT('audio'); await flipT('readout');
    await waitFor(O.page, "!!document.querySelector('.ad-diag') && window.__district.harbor().flags.readout", 'both on', 4000).catch(() => {});
    const t1 = await st();
    await flipT('audio'); await flipT('readout');
    await waitFor(O.page, "!document.querySelector('.ad-diag') && !window.__district.harbor().flags.readout", 'both off', 4000).catch(() => {});
    const t2 = await st();
    ok(!t0.ro && !t0.diag && !t0.on.length && t0.h >= 44 && t1.ro && t1.diag && t1.on.join() === 'readout,audio' && /"audio":true/.test(t1.saved) && /"readout":true/.test(t1.saved) && !t2.ro && !t2.diag && !t2.on.length && /"audio":false/.test(t2.saved),
      `PANEL TOOLS: READOUT + AUDIO PANEL off → on live (readout ${t1.ro}, panel ${t1.diag}, saved ${t1.saved}) → off (${t2.saved}); buttons ≥ 44 pt`);
    // remembered: a fresh visit on this device (no &debug=1) shows both
    const M = await open({ slot: 'hpt', qs: NIGHT, init: { fn: () => { try { localStorage.setItem('na:dbgtools', JSON.stringify({ readout: true, audio: true })); } catch { /* fine */ } }, arg: null } });
    await harborUp(M.page);
    await waitFor(M.page, "!!document.querySelector('.ad-diag') && window.__district.harbor().flags.readout", 'remembered tools', 8000).catch(() => {});
    const m = await ev(M.page, "({ ro: window.__district.harbor().flags.readout, diag: !!document.querySelector('.ad-diag') })");
    ok(m.ro && m.diag, `PANEL TOOLS: remembered on this device — a visit without &debug=1 shows the readout (${m.ro}) + the AUDIO panel (${m.diag})`);
    await M.ctx.close();
    await ev(O.page, 'window.__district.remote().openCats([])');
  }
  // a row's category opens (a real tap on its header) before the row is tapped
  const reveal = async label => {
    const hd = await O.page.evaluate(l => { const b = [...document.querySelectorAll('.hr-sheet .hr-b')].find(x => x.textContent.replace('☾', '').trim() === l); const s = b && b.closest('.hr-sec'); if (!s || s.classList.contains('is-open')) return null; const hh = s.querySelector('.hr-cat'); hh.scrollIntoView({ block: 'center', behavior: 'instant' }); const q = hh.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2, cat: s.dataset.cat }; }, label);
    if (!hd) return;
    await tapAt(O.page, hd.x, hd.y);
    await waitFor(O.page, `document.querySelector('.hr-sec[data-cat="${hd.cat}"]').classList.contains('is-open')`, `${hd.cat} opens`, 3000);
  };
  const chip = async label => {
    // (NEON PASS 5: a sky piece switched on makes the sheet PEEK — wait for its height to settle before measuring a button)
    await waitFor(O.page, "!document.querySelector('.hr-sheet') || document.querySelector('.hr-sheet').getAnimations().every(x => x.playState !== 'running')", "the sheet still", 3000).catch(() => {});
    await reveal(label);
    const r = await O.page.evaluate(l => { const b = [...document.querySelectorAll('.hr-sheet .hr-b')].find(x => x.textContent.replace('☾', '').trim() === l); if (!b) return null; b.scrollIntoView({ block: 'center', behavior: 'instant' }); const q = b.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2 }; }, label);
    if (!r) throw new Error(`no chip ${label}`);
    await tapAt(O.page, r.x, r.y); await sleep(200);
  };
  const small = await ev(O.page, `[...document.querySelectorAll('.hr-sheet button')].filter(b => { const r = b.getBoundingClientRect(); return r.width && (r.height < 44 || r.width < 44); }).length`);
  ok(small === 0, `PANEL: every button in the sheet is a ≥ 44 pt target (${small} smaller)`);
  await chip('AURORA'); await chip('RAIN'); await chip('20×');
  let f1 = await flags(O.page);
  ok(f1.remote && f1.force.includes('aurora') && f1.wx === 'rain' && f1.speed === 20, `JUST ME: AURORA + RAIN + 20× live, no reload (force ${f1.force}, wx ${f1.wx}, ${f1.speed}×)`);
  await waitFor(O.page, 'window.__district.scene().rain > 0', 'the rain falls', 6000);
  await chip('DAWN');
  await waitFor(O.page, 'window.__district.scene().w.night < 0.5', 'the clock at dawn', 8000);
  f1 = await flags(O.page);
  ok(/T0[5-8]:\d\d$/.test(f1.q.when || ''), `JUST ME: DAWN from the real sun (${f1.q.when}), the city's look follows`);
  await chip('BACK TO NOW'); await chip('REAL'); await chip('1×');
  await chip('WORDS IN THE WINDOWS');
  await O.page.evaluate(() => { const i = document.querySelector('.hr-text'); i.scrollIntoView({ block: 'center', behavior: 'instant' }); i.focus(); });
  await O.page.keyboard.type('hey you');
  await waitFor(O.page, "window.__district.harbor().flags.q.text === 'HEY YOU'", 'the text applied', 5000);
  await waitFor(O.page, "!!window.__district.harbor().windows.spelling && window.__district.harbor().windows.spelling.text === 'HEY YOU'", 'the word in the windows', 8000);
  ok(true, 'JUST ME: WORDS IN THE WINDOWS + typed text ("hey you" → HEY YOU) lights on the word towers');
  if (SHOTS) await O.page.screenshot({ path: `${OUT}panel-me-390x844.png` });
  // the tab keeps it (like a preview link survives a refresh)
  await O.page.reload();
  await waitFor(O.page, '!!window.__district && window.__district.phase().done', 'reload', 25000);
  await harborUp(O.page);
  await waitFor(O.page, "window.__district.harbor().flags.remote && window.__district.harbor().flags.force.includes('spell')", 'JUST ME after a reload', 8000);
  ok((await flags(O.page)).q.text === 'HEY YOU', 'JUST ME: a refresh keeps it (this tab)');
  // CLEAR ALL: back to the real city (the page's own flags: the link's &at keeps clear weather)
  await tap(O.page, '.hr-pill'); await waitFor(O.page, '!!document.querySelector(".hr-sheet")', 'the sheet', 5000); await waitFor(O.page, "document.querySelector('.hr-sheet').getAnimations().every(x => x.playState === 'finished')", 'the sheet up', 5000); await sleep(450);
  // (7a §0: the categories opened before the reload are open again — this device remembers; the pinned top stays in view at the bottom)
  { const r = await ev(O.page, `(() => { const s = document.querySelector('.hr-sheet'); s.scrollTop = s.scrollHeight; const open = [...document.querySelectorAll('.hr-sec.is-open')].map(x => x.dataset.cat).sort();
      const sb = s.getBoundingClientRect(), cb = document.querySelector('.hr-clear').getBoundingClientRect(); return { open, pinned: s.scrollTop > 100 && cb.top >= sb.top && cb.bottom <= sb.top + sb.height * 0.6, stored: JSON.parse(localStorage.getItem('nd:hr-open') || '[]').sort() }; })()`);
    ok(['lights', 'sky', 'time', 'weather'].every(c => r.open.includes(c) && r.stored.includes(c)) && r.pinned, `PANEL: the open categories remembered on this device (${r.open.join(', ')}); CLEAR ALL pinned at the top when scrolled to the bottom (${r.pinned})`); }
  await tap(O.page, '.hr-clear');
  await waitFor(O.page, '!window.__district.harbor().flags.remote', 'cleared', 5000);
  await waitFor(O.page, '!window.__district.harbor().windows.spelling', 'the word gone', 5000);
  f1 = await flags(O.page);
  ok(!f1.force.length && !f1.q.text && f1.speed === 1 && f1.wx === 'clear', `JUST ME: CLEAR ALL — the real city again (force [${f1.force}], wx ${f1.wx} from the link's own &at)`);
  // 7a §0 — THE WORD TOWERS from the panel: one word per tower, the one too long for its tower scrolls on it; the readout says so
  await ev(O.page, "window.__district.remote().setMine({ force: ['spell'], text: 'HAPPY BIRTHDAY SAM', tower: 'wordA,wordB,wordV' })");
  await waitFor(O.page, "(() => { const s = window.__district.harbor().windows.spelling; return !!s && s.towers.length === 3; })()", 'three towers', 8000).catch(() => {});
  { const s = await ev(O.page, 'window.__district.harbor().windows.spelling');
    await ev(O.page, "window.__district.remote().open(), window.__district.remote().openCats(['lights'])");
    await waitFor(O.page, "!!document.querySelector('.hr-fit')", 'the readout', 4000).catch(() => {});
    const fit = await ev(O.page, "(() => { const f = document.querySelector('.hr-fit'); return f ? [...f.querySelectorAll('.hr-fit-row')].map(r => r.textContent).join(' | ') + ' || ' + [...f.querySelectorAll('.hr-fit-n')].map(r => r.textContent).join(' | ') : ''; })()");
    if (SHOTS) await O.page.screenshot({ path: `${OUT}panel-towers-390x844.png` });
    ok(s && ['wordA', 'wordB', 'wordV'].every(t => s.towers.includes(t)) && s.scrolls.join() === 'wordB' && /BIRTHDAY.*SCROLLS/.test(fit) && /ROOM/.test(fit),
      `THE WORD TOWERS (JUST ME): "${s && s.text}" on ${s && s.towers} — ${s && s.scrolls} scrolls; the readout: "${fit}"`);
    await ev(O.page, 'window.__district.remote().close(), window.__district.remote().setMine({})'); }
  await O.ctx.close();

  // ---- EVERYONE ON CITY 2: the server's node (written here with the emulator's owner rights; the /api path: server.test) —
  // phones on ?city=2 play it in sync from startAt; a late arrival joins mid-way; until → the real city; the default city never listens
  const B = await open({ slot: 'he1', qs: NIGHT });
  await harborUp(B.page);
  await waitFor(B.page, '!!window.__district.remote()', 'the listener up', 10000);
  const startAt = Date.now() - 3000;
  await dbPut('city2/live', { v: 1, kind: 'preview', state: { force: ['banner', 'spell'], text: 'HI ALL', when: '2026-10-24T23:00' }, params: {}, label: 'test', startAt, until: Date.now() + 120_000, by: 'ptest00000000' });
  await waitFor(B.page, "window.__district.harbor().flags.remote && window.__district.harbor().flags.force.includes('banner')", 'EVERYONE on phone 1', 8000);
  const C = await open({ slot: 'he2', qs: NIGHT, view: [430, 932] });
  await harborUp(C.page);
  await waitFor(C.page, "window.__district.harbor().flags.remote && window.__district.harbor().flags.force.includes('banner')", 'EVERYONE on a late arrival', 10000);
  await waitFor(B.page, '!!window.__district.harbor().sky.state.banner', 'the banner flies (1)', 10000);
  await waitFor(C.page, '!!window.__district.harbor().sky.state.banner', 'the banner flies (2)', 10000);
  const [b, c] = await Promise.all([B.page, C.page].map(p => ev(p, '({ f: window.__district.harbor().flags, at: window.__district.harbor().sky.state.banner.at, now: window.__district.harbor().flags.now })')));
  const expect = Date.UTC(2026, 9, 25, 3, 0) + (Date.now() - startAt);            // (23:00 in Detroit = 03:00 UTC, running since startAt)
  ok(b.f.q.text === 'HI ALL' && c.f.q.text === 'HI ALL' && Math.abs(b.now - c.now) < 2000 && Math.abs(b.now - expect) < 5000,
    `EVERYONE: two phones (one arriving late) on the same minute (clocks ${Math.round(Math.abs(b.now - c.now))} ms apart, ${Math.round((b.now - expect) / 1000)} s from startAt's 23:00)`);
  ok(Math.abs(b.at - c.at) < 1500 && Math.abs(b.at - Date.UTC(2026, 9, 25, 3, 0)) < 1500, `EVERYONE: the banner's first flight starts at startAt on both phones (${Math.round(Math.abs(b.at - c.at))} ms apart) — the late one joins mid-flight`);
  if (SHOTS) await C.page.screenshot({ path: `${OUT}panel-everyone-430x932.png` });
  // the default city never subscribes
  { const N = await open({ slot: 'he3', qs: NIGHT, city: false }); await sleep(2500);
    ok(!N.files.some(u => /remote\.js|harbor-remote/.test(u)) && (await ev(N.page, 'window.__district.harbor()')) === null && !(await ev(N.page, '!!document.querySelector(".hr-pill")')), 'EVERYONE: the default city never loads the panel or listens to city2/live');
    await N.ctx.close(); }
  // until passes → the real city again; CLEAR (the node removed) → the real city at once
  await dbPut('city2/live', { v: 1, kind: 'preview', state: { force: ['aurora'] }, params: {}, label: 'test', startAt: Date.now(), until: Date.now() + 2500, by: 'ptest00000000' });
  await waitFor(B.page, "window.__district.harbor().flags.force.includes('aurora')", 'the new state', 6000);
  await waitFor(B.page, '!window.__district.harbor().flags.remote', 'until passed', 12000);
  ok(true, 'EVERYONE: when `until` passes, the phone goes back to the real city on its own');
  await dbPut('city2/live', { v: 1, kind: 'preview', state: { force: ['searchlights'] }, params: {}, label: 'test', startAt: Date.now(), until: Date.now() + 120_000, by: 'ptest00000000' });
  await waitFor(C.page, "window.__district.harbor().flags.force.includes('searchlights')", 'searchlights', 6000);
  // (7a §0: THE WORD TOWERS from EVERYONE — one word per tower through city2/live; NIGHT too wide for B: it scrolls there)
  await dbPut('city2/live', { v: 1, kind: 'preview', state: { force: ['spell'], text: 'JAZZ NIGHT', tower: 'wordA,wordB', when: '2026-10-24T23:00' }, params: {}, label: 'test', startAt: Date.now(), until: Date.now() + 120_000, by: 'ptest00000000' });
  { const okk = await waitFor(C.page, "(() => { const s = window.__district.harbor().windows.spelling; return !!s && s.text === 'JAZZ NIGHT'; })()", 'the towers for everyone', 8000).then(() => true).catch(() => false);
    const s = await ev(C.page, 'window.__district.harbor().windows.spelling');
    ok(okk && s.towers.join() === 'wordA,wordB' && s.scrolls.join() === 'wordB', `THE WORD TOWERS (EVERYONE): "${s && s.text}" — JAZZ still on A, NIGHT scrolling on B (${s && s.scrolls})`); }
  await dbPut('city2/live', null);
  await waitFor(C.page, '!window.__district.harbor().flags.remote', 'cleared for everyone', 6000);
  ok(true, 'EVERYONE: CLEAR — the node removed, every phone back to the real city');
  await B.ctx.close(); await C.ctx.close();
}

// ================================================================ NEON PASS 5 — the owner's iPhone view: the party at 11 pm, 402×874
// (every hero + word tower's sky beam rising behind the sign, the rotating palette, the racing light moving, the beat half-time,
// the NEON logo punching, the tired tube) + A CAPPED FRAME RATE (iOS Low Power Mode's 30 Hz) keeps the tier
async function neonPass5Party() {
  const Q = await open({ slot: 'h13', qs: `when=2026-10-24T23:00${GR}`, view: [402, 874] });
  await harborUp(Q.page);
  await ev(Q.page, 'window.__district.setTier(2)');
  await waitFor(Q.page, "(() => { const p = window.__district.party(), n = window.__district.harbor().neon; return p.show.racing > 0 && n.pal && n.pal.built > 20 && !n.queued && !window.__district.harbor().pending; })()", 'the party + its palette', 25000);
  const h = await ev(Q.page, 'window.__district.harbor()'), tr = (await ev(Q.page, 'window.__district.scene()')).textRects;
  const towers = h.towers.filter(t => (t.rank === 'hero' || t.rank === 'word') && t.x + t.w / 2 > 6 && t.x + t.w / 2 < 396).length;
  const free = h.skyBeams.beams.filter(b => b.top < tr.tag.y);
  ok(h.skyBeams.beams.length >= Math.min(6, towers) && free.length >= h.skyBeams.beams.length - 1,
    `THE SKY BEAMS (NEON PASS 5): every hero + word tower's beam (${h.skyBeams.beams.map(b => b.id).join(', ')} — ${h.skyBeams.beams.length} of ${towers} towers), ${free.length} rising behind the sign to the top`);
  ok(h.neon.pal.on && h.neon.pal.mains >= 5 && h.neon.scheme === 'city', `THE PARTY PALETTE: the rotating palette on (${h.neon.pal.mains} main colours built, scene ${h.neon.pal.scene}) — never one pink scheme`);
  // the motion at phone size: the share of skyline pixels changing by > 24 between frames 250 ms apart (the racing light, the
  // sweeps, the beat) + the half-time beat + the NEON logo's punch, sampled together over ~3 s
  const m = await ev(Q.page, `new Promise(res => {
    const cv = document.querySelector('.nd-scene canvas'), x = cv.getContext('2d'), k = cv.width / cv.clientWidth, hb = window.__district.harbor();
    const y0 = Math.round(hb.cam.limitY * k), y1 = Math.round((hb.cam.VPY + 10) * k), w = cv.width;
    const grab = () => x.getImageData(0, y0, w, y1 - y0).data;
    const shares = [], beats = [0, 0, 0, 0], lg = document.querySelector('.nd-logo-glow'); let prev = null, lo = 9, hi = 0, t0 = performance.now(), n = 0;
    const tick = () => {
      const p = window.__district.party(); if (p.beatIdx % 2 === 0 || (p.beatU > 0.2 && p.beatU < 0.8)) beats[p.beatIdx] = Math.max(beats[p.beatIdx], p.punch);   // (beats 2 + 4: mid-beat — their last 50 ms are the next strong beat's attack)
      const o = lg ? +getComputedStyle(lg).opacity : -1; lo = Math.min(lo, o); hi = Math.max(hi, o);
      if (++n % 15 === 0) { const d = grab(); if (prev) { let c = 0, s = 0; for (let i = 0; i < d.length; i += 16) { s++; if (Math.abs(d[i] - prev[i]) + Math.abs(d[i + 1] - prev[i + 1]) + Math.abs(d[i + 2] - prev[i + 2]) > 24) c++; } shares.push(c / s); } prev = d; }
      if (performance.now() - t0 < 3200) requestAnimationFrame(tick); else res({ shares, beats, lo, hi, tired: document.querySelectorAll('.nd-logo .ndl.is-tired').length });
    };
    requestAnimationFrame(tick);
  })`);
  const share = m.shares.reduce((a, b) => a + b, 0) / Math.max(1, m.shares.length);
  ok(share > 0.05, `THE PARTY MOVES at phone size: ${(100 * share).toFixed(1)} % of the skyline's pixels change between frames ~250 ms apart`);
  ok(m.beats[0] > 0.5 && m.beats[1] < m.beats[0] * 0.35 && m.beats[3] < m.beats[0] * 0.35 && m.beats[2] > m.beats[0] * 0.5,
    `HALF-TIME: the punch on beats 1 + 3 (${m.beats[0].toFixed(2)}, ${m.beats[2].toFixed(2)}), beats 2 + 4 calm (${m.beats[1].toFixed(2)}, ${m.beats[3].toFixed(2)})`);
  ok(m.hi > 0.35 && m.lo < 0.15, `THE NEON LOGO PUNCHES with the city: its glow layer ${m.lo.toFixed(2)} → ${m.hi.toFixed(2)} (gentler than the skyline)`);
  ok(m.tired <= 2, `THE TIRED TUBE: ${m.tired} tired letter(s) right now (0–2, rotating)`);
  // NEON PASS 6 (the owner, her iPhone: "they almost stop between pulses and jitter"): the racing light's speed comes from the tempo
  // alone — sampled through ~2 s (several beats), it never dips between the punches
  const rv = await ev(Q.page, `new Promise(res => { const v = []; const iv = setInterval(() => { v.push(window.__district.harbor().neon.show.raceV || 0); if (v.length >= 20) { clearInterval(iv); res(v); } }, 100); })`);
  const rlo = Math.min(...rv), rhi = Math.max(...rv);
  ok(rlo > 20 && rlo / rhi > 0.85, `THE RACING FLOWS: a steady ${rlo.toFixed(0)}–${rhi.toFixed(0)} pt/s through the beats (never a stop-and-go)`);
  if (SHOTS) await Q.page.screenshot({ path: `${OUT}np5-party-402x874.png` });
  await Q.ctx.close();
  // NEON PASS 6 — THE NEON LOGO RACES (&force=race: every 6 s): a head running the letters by transform, each letter blazing in turn,
  // then SPEAKEASY's sweep
  { const R = await open({ slot: 'h16', qs: `${NIGHT}&force=race`, view: [402, 874] });
    await waitFor(R.page, 'window.__district.harbor().neon.signs.every(s => s.on)', 'the neon on', 15000);
    const r = await ev(R.page, `new Promise(res => {
      const ls = [...document.querySelectorAll('.nd-race-l')], hd = document.querySelector('.ndr-hd'), w = [...document.querySelectorAll('.nd-word-r i')];
      const peak = [0, 0, 0, 0], first = [-1, -1, -1, -1], pos = new Set(); let word = 0, t0 = performance.now();
      const tick = () => { const e = performance.now() - t0;
        ls.forEach((l, i) => { const o = +getComputedStyle(l).opacity; if (o > peak[i]) peak[i] = o; if (o > 0.5 && first[i] < 0) first[i] = e; });
        if (+getComputedStyle(hd).opacity > 0.5) pos.add(hd.getAttribute('transform'));
        for (const x of w) word = Math.max(word, +getComputedStyle(x).opacity);
        if (e < 8500) requestAnimationFrame(tick); else res({ peak, first, moves: pos.size, word });
      };
      requestAnimationFrame(tick);
    })`);
    const inTurn = r.first.every(v => v >= 0) && r.first[0] < r.first[1] && r.first[1] < r.first[2] && r.first[2] < r.first[3];
    ok(inTurn && Math.min(...r.peak) > 0.6 && r.moves > 20 && r.word > 0.5, `THE NEON LOGO RACES: N → E → O → N blaze in turn (at ${r.first.map(v => Math.round(v)).join(' / ')} ms, peaks ${r.peak.map(v => v.toFixed(2)).join(' ')}), the head moved through ${r.moves} places, SPEAKEASY swept (${r.word.toFixed(2)})`);
    await R.ctx.close(); }
  // A 30 Hz FRAME RATE (iOS Low Power Mode): the city tries one step down, sees no faster frames, steps back up + stays (the owner's
  // iPhone ran a party night at tier 0: nothing racing). requestAnimationFrame throttled to 30 Hz in the page.
  const C = await open({ slot: 'h14', qs: NIGHT, view: [402, 874], init: { fn: () => { const raf = window.requestAnimationFrame.bind(window); let q = [], last = 0, armed = false, id = 0; const pump = t => { if (t - last < 31) { raf(pump); return; } last = t; const run = q; q = []; armed = false; for (const e of run) e[1](t); }; window.requestAnimationFrame = cb => { q.push([++id, cb]); if (!armed) { armed = true; raf(pump); } return id; }; window.cancelAnimationFrame = i => { q = q.filter(e => e[0] !== i); }; }, arg: null } });
  await harborUp(C.page);
  await waitFor(C.page, '(() => { const t = window.__district.tiering(); return t.capped > 0 && !t.probe && t.tier === 2; })()', 'the cap found, the tier back', 40000).catch(() => {});
  const ti = await ev(C.page, 'window.__district.tiering()');
  ok(ti.tier === 2 && ti.capped >= 24 && ti.capped <= 36, `A 30 Hz PHONE KEEPS ITS TIER: tier ${ti.tier} (${ti.hist.join('→')}), the cap found: ${ti.capped} Hz — no step down for a frame rate the city can't change`);
  await C.ctx.close();
}

// ================================================================ NEON PASS 5 — the panel: a link's own settings win, the JUST ME chip,
// PARTY ON = the party link, every sky event fired from the panel appears
async function neonPass5Panel() {
  // a JUST ME state left in the tab (PARTY OFF + rain) and a party link opened in it: the link wins
  const L1 = await open({ slot: 'hl', qs: `when=2026-10-24T23:00${GR}&panel=1`, view: [402, 874], init: { fn: st => { try { sessionStorage.setItem('nd:hr-me', JSON.stringify({ state: st, ui: {} })); } catch { /* fine */ } }, arg: { party: 'off', wx: 'rain' } } });
  await harborUp(L1.page);
  await waitFor(L1.page, '!!window.__district.remote()', 'the panel loaded', 10000);
  await waitFor(L1.page, 'window.__district.party().on > 0.5', 'the link\'s party', 10000).catch(() => {});
  const f1 = await flags(L1.page), p1 = await ev(L1.page, 'window.__district.party()');
  ok(!f1.remote && p1.on > 0.5 && f1.wx !== 'rain', `A LINK'S OWN SETTINGS WIN: a leftover JUST ME (party off, rain) dropped for the party link (party ${p1.on}, wx ${f1.wx})`);
  // the chip: JUST ME on → the pill says what, the ✕ clears it in one tap
  await ev(L1.page, "window.__district.remote().setMine({ party: 'on', force: ['aurora'] })");
  await waitFor(L1.page, "!!document.querySelector('.hr-pill') && /JUST ME/.test(document.querySelector('.hr-lbl').textContent) && !document.querySelector('.hr-x').hidden", 'the JUST ME chip', 6000);
  const chipTxt = await ev(L1.page, "document.querySelector('.hr-lbl').textContent"), xr = await ev(L1.page, "(() => { const r = document.querySelector('.hr-x').getBoundingClientRect(); return { w: r.width, h: r.height }; })()");
  await tap(L1.page, '.hr-x');
  await waitFor(L1.page, '!window.__district.harbor().flags.remote', 'cleared by the ✕', 5000);
  ok(/AURORA/.test(chipTxt) && xr.w >= 44 && xr.h >= 44, `THE JUST ME CHIP: "${chipTxt}" + a ${Math.round(xr.w)}×${Math.round(xr.h)} pt ✕ — one tap back to the link`);
  const linkParty = await ev(L1.page, '({ beams: window.__district.harbor().skyBeams.beams.length, pal: window.__district.harbor().neon.pal.on })');
  await L1.ctx.close();
  // PARTY ON by day (no time picked) = the party link: the clock jumps to tonight, the same show
  const D = await open({ slot: 'hd2', qs: `when=2026-10-22T13:00${GR}&panel=1`, view: [402, 874] });
  await harborUp(D.page);
  await waitFor(D.page, '!!document.querySelector(".hr-pill")', 'the TEST pill', 10000);
  await tap(D.page, '.hr-pill');
  await waitFor(D.page, "!!document.querySelector('.hr-sheet') && document.querySelector('.hr-sheet').getAnimations().every(x => x.playState === 'finished')", 'the sheet up', 6000);
  // (7a §0: PARTY ON sits in the PARTY SHOW category — collapsed at first: a tap on its header opens it)
  const ph = await ev(D.page, `(() => { const h = document.querySelector('.hr-sec[data-cat="party"] .hr-cat'); h.scrollIntoView({ block: 'center', behavior: 'instant' }); const q = h.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2 }; })()`);
  await tapAt(D.page, ph.x, ph.y);
  await waitFor(D.page, `document.querySelector('.hr-sec[data-cat="party"]').classList.contains('is-open')`, 'PARTY SHOW opens', 3000);
  const on = await ev(D.page, `(() => { const b = [...document.querySelectorAll('.hr-sec[data-cat="party"] .hr-b')].filter(x => x.textContent.trim() === 'ON')[0]; if (!b) return null; b.scrollIntoView({ block: 'center', behavior: 'instant' }); const q = b.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2 }; })()`);
  await tapAt(D.page, on.x, on.y);
  await waitFor(D.page, "(() => { const p = window.__district.party(), n = window.__district.harbor().neon; return p.on > 0.5 && n.pal && n.pal.on && window.__district.harbor().skyBeams.beams.length > 0 && window.__district.scene().w.night > 0.6; })()", 'PARTY ON at night', 20000).catch(() => {});
  const fd = await flags(D.page), pd = await ev(D.page, '({ on: window.__district.party().on, name: window.__district.party().name, night: window.__district.scene().w.night, beams: window.__district.harbor().skyBeams.beams.length, pal: window.__district.harbor().neon.pal.on })');
  ok(pd.on > 0.5 && pd.night > 0.6 && pd.pal && pd.beams === linkParty.beams && /T2[0-3]:\d\d$/.test(fd.q.when || ''), `PARTY ON BY DAY = THE PARTY LINK: the clock jumps to tonight (${fd.q.when}), the show at its ${pd.name} — ${pd.beams} beams (the link: ${linkParty.beams}), the palette ${pd.pal ? 'on' : 'off'}`);
  await D.ctx.close();
  // every sky piece fired from the panel appears within a few seconds (JUST ME; the night pieces at night, the day ones by day)
  const SKY = [
    ['banner', 'st.banner'], ['skywrite', 'st.smoke && st.smoke.kind === "skywrite"'], ['skytype', 'st.smoke && st.smoke.kind === "skytype"'], ['helicopter', 'st.air.heli'],
    ['balloons', 'st.balloons'], ['balloon-festival', 'st.balloons'], ['planes', 'st.air.planes.length > 0'], ['approach', 'st.air.planes.some(p => p.approach)'],
    ['geese', 'st.birds.geese > 0'], ['swifts', 'st.birds.swifts > 0'], ['bats-dusk', 'st.birds.bats > 0'], ['heron', 'st.birds.heron'],
  ];
  const NIGHT_SKY = [['satellites', 'st.air.train'], ['drones', 'st.drones']];
  for (const [when, list] of [[`when=2026-10-21T13:00${GR}&wind=2`, SKY], [NIGHT, NIGHT_SKY]]) {
    const P = await open({ slot: `hs${list.length}`, qs: `${when}&panel=1`, view: [402, 874] });
    await harborUp(P.page);
    await waitFor(P.page, '!!window.__district.remote() && !!window.__district.scene().textRects', 'the panel + the sign', 10000);
    const got = [], missing = [];
    for (const [id, cond] of list) {
      await ev(P.page, `window.__district.remote().setMine({ force: ['${id}'] })`);
      const okk = await waitFor(P.page, `(() => { const st = window.__district.harbor().sky.state; return !!(${cond}); })()`, id, 6000).then(() => true).catch(() => false);
      (okk ? got : missing).push(id);
      await ev(P.page, 'window.__district.remote().setMine({})');
      await waitFor(P.page, '!window.__district.harbor().flags.remote', 'cleared', 4000).catch(() => {});
    }
    ok(!missing.length, `THE PANEL'S SKY EVENTS (${/T13/.test(when) ? 'by day' : 'at night'}): ${got.join(', ')} each appeared within 6 s${missing.length ? ` — MISSING: ${missing.join(', ')}` : ''}`);
    await P.ctx.close();
  }
}

const GROUPS = new Map();
const G = (name, fn) => { if (!GROUPS.has(name)) GROUPS.set(name, []); GROUPS.get(name).push(fn); };
G('core', async () => {
  // ================================================================ 1. ?city=2: the Harbor, no errors, every size
  const A = await open({ slot: 'ha', qs: NIGHT });
  await harborUp(A.page);
  const d = await ev(A.page, 'window.__district.scene()');
  const hb = await ev(A.page, 'window.__district.harbor()');
  ok(d.city === 2 && hb && hb.shown && hb.bakes >= 1, `CITY 2: ?city=2 shows the Harbor (baked ${hb && hb.bakes}×, ${hb && hb.mem.mb} MB of ${hb && hb.mem.budget} MB)`);
  ok(hb.mem.mb <= hb.mem.budget, `MEMORY BUDGET: the baked layers fit the tier's budget (${hb.mem.mb} ≤ ${hb.mem.budget} MB; main canvas ${hb.main.mb} MB)`);
  ok(hb.mem.layers.every(l => l.dpr <= 2), 'MEMORY: baked layers capped at DPR 2 on a phone');
  ok(A.files.some(u => /\/js\/screens\/harbor\/scene\.js/.test(u)), 'CITY 2: the harbor modules load with the flag');
  if (SHOTS) for (const [w, h] of [[390, 844], [402, 874], [412, 915], [430, 932], [874, 402], [1440, 900]]) {
    await A.page.setViewport({ width: w, height: h, deviceScaleFactor: w < 1000 ? 2 : 1, isMobile: w < 1000, hasTouch: w < 1000 });
    await waitFor(A.page, `window.__district.harbor().cam.W === ${w}`, 'the re-layout', 8000); await settled(A.page);
    await A.page.screenshot({ path: `${OUT}night-${w}x${h}.png` });
  }
  await A.page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await waitFor(A.page, 'window.__district.harbor().cam.W === 390', 'back at 390', 8000); await settled(A.page);

  // ================================================================ 1b. the lanes (real rects); a re-layout never blanks the city
  { const h1 = await ev(A.page, 'window.__district.harbor()'), sc = await ev(A.page, 'window.__district.scene()');
    const tr = sc.textRects || {}, corners = (sc.clear || []).filter(r => r.w < 70 && r.h < 70);
    // (the tagline lane IS the tagline's band: the slot later parts bring a line back in — it is checked against the rest)
    const hit = Object.entries(h1.lanes).filter(([n, r]) => [tr.neon, tr.word, n === 'tagline' ? null : tr.tag, ...corners].some(z => z && r.x < z.x + z.w && z.x < r.x + r.w && r.y < z.y + z.h && z.y < r.y + r.h)).map(([n]) => n);
    ok(!!tr.neon && hit.length === 0 && h1.lanes['sky-high'].h >= 40 && h1.lanes['sky-low'].h >= 24, `LANES: ${Object.keys(h1.lanes).length} lane rects, clear of the real sign + corner buttons (sky-high ${Math.round(h1.lanes['sky-high'].h)} pt, sky-low ${Math.round(h1.lanes['sky-low'].h)} pt${hit.length ? `; over: ${hit}` : ''})`); }
  { const D = await open({ slot: 'hd', qs: `when=2026-10-21T13:00${GR}` });
    await harborUp(D.page);
    await waitFor(D.page, '!window.__district.harbor().pending && !window.__district.harbor().fading', 'settled', 15000);
    // every frame from just before setTier(1) until the new bake has landed and faded: the speakeasy's wall (stage band) and
    // the bottom of the sky, sampled after the scene drew
    const run = await ev(D.page, `new Promise(res => {
      const cv = document.querySelector('.nd-scene canvas'), d = window.__district.door(), hb = window.__district.harbor();
      // (8a: a patch of the baked stage — the cobbles in front of the shop, averaged over 8 × 8 pt so the setts' texture doesn't read as a
      // change when the DPR does; Part 1's probe sat on the placeholder corner tree, gone in 8a)
      const f = d.w / 1.5, px = d.x - 6.3 * f, py = d.y + 1.1 * f, sy = hb.cam.VPY - 30;
      const x = cv.getContext('2d');
      const read = (X, Y) => { const k = cv.width / cv.clientWidth, w = Math.round(8 * k), d2 = x.getImageData(Math.round((X - 4) * k), Math.round((Y - 4) * k), w, w).data; let r = 0, g = 0, b = 0; const n = d2.length / 4; for (let i = 0; i < d2.length; i += 4) { r += d2[i]; g += d2[i + 1]; b += d2[i + 2]; } return [r / n, g / n, b / n].map(Math.round); };
      // (NEON PASS 5: the first sample inside a frame too — read between frames under load it could catch the canvas mid-commit)
      let before = null, sky = null, prevP = null, steadyN = 0, waitN = 0; const out = [];
      let n = 0, sawPending = false;
      const bakes0 = hb.bakes;
      const tick = () => {
        // (start once the pixel holds steady for 8 frames — the stage settling after the first bakes is not a re-layout)
        if (!before) { const p = read(px, py); steadyN = prevP && Math.abs(p[0] - prevP[0]) + Math.abs(p[1] - prevP[1]) + Math.abs(p[2] - prevP[2]) < 6 ? steadyN + 1 : 0; prevP = p; if (steadyN >= 8 || ++waitN > 240) { before = p; sky = read(4, sy); } requestAnimationFrame(tick); return; }
        out.push(read(px, py)); n++;
        if (n === 3) window.__district.setTier(1);
        const h = window.__district.harbor();
        if (n >= 3 && h.pending) sawPending = true;
        if ((n > 6 && h.bakes > bakes0 && !h.pending && !h.fading) || n > 900) return res({ before, sky, out, n, sawPending, baked: h.bakes > bakes0 && !h.pending, tier: window.__district.scene().tier, hist: (window.__district.tiering() || {}).hist, first: out.findIndex(p => p[0] + p[1] + p[2] < 24) });
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    })`);
    const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    const worst = Math.max(...run.out.map(p => dist(p, run.before))), nearSky = run.out.filter(p => dist(p, run.sky) < 12).length, black = run.out.filter(p => p[0] + p[1] + p[2] < 24).length;
    ok(run.baked && run.tier <= 1 && worst < 60 && !nearSky && !black, `RE-LAYOUT: setTier(1) mid-session (then t${run.tier}: the per-frame reads slow it, so the scene may step down again) — over ${run.n} frames (bake + crossfade) the stage-band pixel never went blank (worst Δ ${Math.round(worst)} from rgb(${run.before}); bare sky ${nearSky}×, black ${black}× — the tiers ${(run.hist || []).join("→")}, the first black frame ${run.first})`);
    await D.ctx.close(); }

  // ================================================================ 2. the flag is never saved; a normal visit is today's city
  const stored = await ev(A.page, `JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }) + document.cookie`);
  ok(!/city/i.test(stored), 'NEVER SAVED: ?city=2 leaves nothing in localStorage, sessionStorage or cookies');
  { let files = []; A.page.on('request', r => files.push(r.url()));
    // (PF — the CI's slower machine: the ?city=2 page's late requests never count, and today's signs may come up after phase().done)
    await A.page.goto('about:blank'); files = [];
    await A.page.goto(`${BASE}/?emu&slot=ha&${NIGHT}`);
    await waitFor(A.page, '!!window.__district && window.__district.phase().done', 'reload without the flag');
    await waitFor(A.page, '(window.__district.scene().signs || []).length >= 4', "today's signs", 10000).catch(() => {});
    const d2 = await ev(A.page, 'window.__district.scene()'), hb = await ev(A.page, 'window.__district.harbor()'), hf = files.filter(u => /\/harbor\//.test(u));
    const good = d2.city !== 2 && d2.signs.length >= 4 && hb === null && !hf.length;
    ok(good, `NO FLAG: a reload without ?city=2 is today's city (its signs up, no harbor file loaded)${good ? '' : ` — city ${d2.city}, signs ${d2.signs.length}, harbor ${hb === null ? 'none' : 'up'}, harbor files: ${hf.slice(0, 3).join(' ')}`}`); }
  await A.ctx.close();
  { const N = await open({ slot: 'hn', qs: NIGHT, city: false });
    ok(!N.files.some(u => /\/harbor\//.test(u)) && (await ev(N.page, 'window.__district.scene()')).city !== 2, 'NORMAL VISIT: the default city, no harbor module requested');
    await N.ctx.close(); }

});
G('flags', async () => {
  // ================================================================ 3. every title flag works with ?city=2
  { const X = await open({ slot: 'hf', qs: `when=2026-10-14T13:00${GR}&wx=rain&speed=60&force=demo&grid=1&debug=1` });
    await harborUp(X.page);
    await waitFor(X.page, "window.__district.harbor().events.some(e => e.id === 'demo')", 'the demo event', 10000).catch(() => {});
    const s = await ev(X.page, 'window.__district.scene()'), h2 = await ev(X.page, 'window.__district.harbor()');
    const sp = await ev(X.page, 'window.__district.neon().now');
    await sleep(1200);
    const sp2 = await ev(X.page, 'window.__district.neon().now');
    ok(s.rain > 0 && Math.abs(s.w.day - 1) < 0.5 && h2.events.some(e => e.id === 'demo') && sp2 - sp > 30000,
      `FLAGS: &when &tz &at (day), &wx=rain (rain ${s.rain}), &speed=60 (+${Math.round((sp2 - sp) / 1000)} s of clock in ~1.2 s), &force=demo (the demo event in lane ${h2.events.map(e => e.lanes).join()}), &grid=1, &debug=1 — no errors`);
    if (SHOTS) await X.page.screenshot({ path: `${OUT}flags-grid-390x844.png` });
    await X.ctx.close(); }

});
G('skyline', async () => {
  // ================================================================ 3b. Part 2 (+ Part 5): the tagline rests with the dock, the words, the searchlights, the wheel
  { const T = await open({ slot: 'h7', qs: `${NIGHT}&force=spell,searchlights&text=2027` });
    // (the city laid out on the title's REAL text rects before the first reading: a sub-pt re-layout after it is not the bug)
    await harborUp(T.page);
    await waitFor(T.page, '(() => { const h = window.__district.harbor(), tr = window.__district.scene().textRects; return h && !h.pending && tr && Math.abs(h.cam.limitY - (tr.tag.y + tr.tag.h + 10)) < 1; })()', 'the city laid out on the real text rects', 9000);
    const h0 = await ev(T.page, 'window.__district.harbor()');
    // PART 5 (the owner's call): the tagline stays while the dock is up — no timer — and rests WITH the dock
    await sleep(2500);
    const up = await ev(T.page, `(() => { const t = document.querySelector('.nd-tag'); return { o: +getComputedStyle(t).opacity, gone: window.__district.harbor().cam.tagGone }; })()`);
    ok(up.o > 0.9 && !up.gone, `TAGLINE ON ARRIVAL: shown with the dock (opacity ${up.o}), its band not the sky's`);
    await ev(T.page, 'window.__district.idle()');
    await waitFor(T.page, `(() => { const t = document.querySelector('.nd-tag'), d = document.querySelector('.nd-actions'); return t && getComputedStyle(t).opacity < 0.05 && getComputedStyle(d).opacity < 0.05 && window.__district.harbor().cam.tagGone; })()`, 'the tagline gone with the dock', 9000);
    await sleep(600);
    const h1 = await ev(T.page, 'window.__district.harbor()');
    // the real bug (fixed in Part 4): a re-layout forgetting the faded tagline — cam.tagGone off again, the lane shrunk back.
    // The positions get 1 pt (a sub-pt re-layout on a slow machine); the tagline's band is ≥ 10 pt, so the lane's move is clear.
    ok(h1.cam.tagGone && h1.lanes['sky-low'].y < h0.lanes['sky-low'].y - 8 && Math.abs(h1.cam.limitY - h0.cam.limitY) < 1 && Math.abs(h1.cam.VPY - h0.cam.VPY) < 1,
      `TAGLINE AT REST: fades out together with the dock; nothing in the city moves (limit ${h0.cam.limitY.toFixed(1)} → ${h1.cam.limitY.toFixed(1)}, horizon ${h0.cam.VPY.toFixed(1)} → ${h1.cam.VPY.toFixed(1)}), the freed band joins sky-low (${Math.round(h0.lanes['sky-low'].y)} → ${Math.round(h1.lanes['sky-low'].y)})`);
    // a touch brings the dock back — and the tagline with it (its band leaves sky-low again)
    await T.page.touchscreen.tap(20, 200);
    await waitFor(T.page, `(() => { const t = document.querySelector('.nd-tag'), d = document.querySelector('.nd-actions'); return t && getComputedStyle(t).opacity > 0.9 && getComputedStyle(d).opacity > 0.9 && !window.__district.harbor().cam.tagGone; })()`, 'the tagline back with the dock', 9000);
    ok(true, 'TAGLINE ON A TAP: back together with the dock, its band the tagline\'s again');
    await waitFor(T.page, '!!(window.__district.harbor().windows.spelling) && window.__district.harbor().beams > 0.3', 'the word + the searchlights', 9000);
    const h2 = await ev(T.page, 'window.__district.harbor()');
    ok(h2.windows.spelling.text === '2027' && h2.windows.spelling.cells > 30 && h2.beams > 0.3 && h2.windows.share > 0.9,
      `WORDS + SEARCHLIGHTS: "${h2.windows.spelling.text}" lit on ${h2.windows.spelling.towers} (${h2.windows.spelling.cells} windows), beams ${h2.beams}, the night's share ${h2.windows.share}`);
    const w = h2.wheel, sp = await ev(T.page, 'window.__district.door()');
    ok(w.legs[0] > 0 && w.deck > w.y && h2.mem.layers.some(l => l.name === 'nearLit') && h2.mem.mb <= h2.mem.budget,
      `WHEEL + LIT LAYER: the wheel's legs at ${Math.round(w.legs[0])}–${Math.round(w.legs[1])} pt, deck ${Math.round(w.deck)}; lit windows baked in their own layers (${h2.mem.mb} of ${h2.mem.budget} MB)`);
    if (SHOTS) await T.page.screenshot({ path: `${OUT}part2-words-390x844.png` });
    void sp;
    await T.ctx.close();
  }
});
G('neon', async () => {
  // ================================================================ 3c. Part 3: the neon — signs, outlines, billboards, beacons, the scroll, moments
  { const N = await open({ slot: 'h8', qs: NIGHT });
    await waitFor(N.page, '(() => { const n = window.__district.harbor().neon; return n.items > 20 && n.built >= n.items && !n.queued && n.signs.every(s => s.on); })()', 'the neon built + lit', 15000);
    const h = await ev(N.page, 'window.__district.harbor()'), sc = await ev(N.page, 'window.__district.scene()');
    const games = h.neon.signs.filter(s => s.game).map(s => s.game), bb = h.neon.boards[0] && h.neon.boards[0].show;
    // (NEON PASS 5: 4 named + 6 icons — the small icon left of the wheel and PAR's narrow name are gone; the billboard advertises a
    // game with no sign tonight, the nightly shuffle rotates the rest)
    // (NEON PASS 6, the owner: the tiny floating icons are gone — 4 named signs + the billboard a fifth game)
    // (DT1: the left roof slot is gone — 3 named signs: the blade + the two roof signs; the billboard a fourth game)
    ok(new Set(games).size === 3 && h.neon.signs.filter(s => s.kind === 'named').length === 3 && !h.neon.signs.some(s => s.kind === 'icon') && h.neon.signs.every(s => s.on) && bb && !games.includes(h.neon.boards[0].game),
      `SIGNS: 3 named games in the skyline tonight (${h.neon.signs.filter(s => s.kind === 'named').map(s => s.game).join(', ')}; stacked roof signs + the blade), no icons, the billboard a fourth (${bb}), every sign lit at night`);
    ok(h.neon.outlines.length >= 12 && h.neon.outlines.some(o => o.id === 'needle') && h.neon.led === 2 && h.beacons.length >= 10,
      `NEON OUTLINES: ${h.neon.outlines.length} buildings outlined (the needle, the heroes…), the 2 glass towers' LED facades, ${h.beacons.length} aircraft beacons`);
    const sg = h.neon.signs.find(s => s.game), hit = await ev(N.page, `window.__district.hit(${sg.rect.x + sg.rect.w / 2}, ${sg.rect.y + sg.rect.h / 2})`);
    ok(hit && hit.kind === 'sign' && hit.id === sg.game, `A TAP ON A SIGN: ${sg.id} → ${hit && hit.kind} ${hit && hit.id} (its HOW TO PLAY)`);
    // (DT1 — THE BLUE-HOUR POWER-UP: the Harbor's neon follows the darkness's stagger, not the title's plan — at night all of it)
    ok(h.powerUp && h.powerUp.on === h.powerUp.of && h.power === 1, `THE POWER-UP at night: every light on (${h.powerUp && h.powerUp.on} of ${h.powerUp && h.powerUp.of}, tonight's sweep ${h.powerUp && h.powerUp.sweep})`);
    const scroll = await ev(N.page, "(() => { const hb = window.__district.harbor(); const okk = hb.spell('HAPPY BIRTHDAY SAMANTHA', { style: 'scroll' }); return okk && window.__district.harbor().windows.spelling; })()");
    ok(scroll && scroll.style === 'scroll' && scroll.towers[0] === 'wordA', `THE SCROLL: a long message tickers across ${scroll && scroll.towers}`);
    await ev(N.page, "window.__district.harbor().moment('flash', { game: 'pulse' }), window.__district.harbor().billboard('bb-left', { game: 'rum' })");
    await waitFor(N.page, 'window.__district.harbor().neon.moment.flash', 'the flash', 3000);
    const h2 = await ev(N.page, 'window.__district.harbor()');
    ok(h2.neon.moment.flash && h2.neon.boards[0].show === 'RUMRUNNER', `MOMENTS + BILLBOARDS: a game's flash sweeps the skyline; a billboard shows ${h2.neon.boards[0].show}`);
    ok(h2.mem.mb + h2.neon.mb <= h2.mem.budget, `MEMORY (neon): the sprites ${h2.neon.mb} MB + the baked layers ${h2.mem.mb} MB ≤ ${h2.mem.budget}`);
    if (SHOTS) await N.page.screenshot({ path: `${OUT}part3-neon-390x844.png` });
    void sc;
    await N.ctx.close();
  }
  // DT1 — THE BLUE-HOUR POWER-UP: late golden hour = sunlight (no building neon, the billboard's lamps the first light, a few
  // windows); mid blue hour = some lit, some still dark (never all at once); the sign + the billboard on the darkness's stagger
  { const out = [];
    for (const [when, label] of [['2026-10-22T18:30', 'golden'], ['2026-10-22T19:04', 'blue']]) {
      const P = await open({ slot: `hp${label}`, qs: `when=${when}${GR}` });
      await harborUp(P.page);
      await waitFor(P.page, '(() => { const n = window.__district.harbor().neon; return n.items > 20 && n.built >= n.items && !n.queued; })()', 'the neon built', 15000);
      out.push({ label, h: await ev(P.page, '(() => { const h = window.__district.harbor(); return { pu: h.powerUp, lamps: h.lamps, power: h.power, share: h.windows.share, dark: h.dark }; })()') });
      await P.ctx.close();
    }
    const [g, b] = out.map(o => o.h);
    ok(g.pu && g.pu.on <= 1 && g.lamps > 0.5 && g.power === 0 && g.share > 0 && g.share < 0.2 && b.pu.on > 2 && b.pu.on < b.pu.of && b.power > 0.2 && b.power < 0.9,
      `THE POWER-UP: golden hour ${g.pu && g.pu.on} lit (the billboard's lamps ${g.lamps}), ${Math.round(g.share * 100)} % of the windows; mid blue hour ${b.pu && b.pu.on} of ${b.pu && b.pu.of} lit (power ${b.power}), the rest still to come`);
  }
  { const D = await open({ slot: 'h9', qs: `when=2026-10-21T13:00${GR}` });
    await harborUp(D.page);
    await waitFor(D.page, '(() => { const n = window.__district.harbor().neon; return n.items > 20 && n.built >= n.items; })()', 'the neon built (by day)', 15000);
    const h = await ev(D.page, 'window.__district.harbor()');
    ok(h.neon.signs.every(s => !s.on), 'BY DAY: the neon is off (the signs + outlines as unlit glass)');
    await D.ctx.close();
  }

});
G('water', async () => {
  // ================================================================ 3d. Part 4: the water — the mirror, the light columns, the wind, the paths
  { const N = await open({ slot: 'hw', qs: `${NIGHT}&wind=0.5` });
    await harborUp(N.page);
    await waitFor(N.page, '(() => { const h = window.__district.harbor(); return h.neon.signs.every(s => s.on) && h.neon.built >= h.neon.items && !h.neon.queued && h.water.copies > 0 && h.water.strips > 30; })()', 'the neon built + on, the mirror + its columns', 15000);
    await sleep(500);                                                       // (the mirror is rebuilt 10× a second: a few rebuilds with the lit neon)
    await waitFor(N.page, 'window.__district.harbor().rate.drawn > 0', 'a frame', 2000);
    const h = await ev(N.page, 'window.__district.harbor()');
    ok(h.water.strips > 30 && h.water.copies > 0, `THE WATER: the mirror rippled row by row (${h.water.strips} rows), the lights' columns at night (${h.water.copies} copies)`);
    ok(h.water.rough < 0.05, `A CALM NIGHT (wind 0.5 m/s): a glassy mirror (roughness ${h.water.rough})`);
    // THE GAME BLADE's neon + its chasing bulbs show in the water below it (Part 6a: it took the HOTEL's spot; its mirror image:
    // as far under the waterline as the sign is above it)
    const hot = h.neon.signs.find(s => s.id === 'n-blade');
    const red = await ev(N.page, `(() => { const cv = document.querySelector('canvas'), x = cv.getContext('2d'), k = cv.width / innerWidth, y0 = ${h.water.y0}, y1 = ${h.water.y1};
      const cx = ${hot.rect.x + hot.rect.w / 2}, my = Math.min(y1 - 4, 2 * y0 - (${hot.rect.y + hot.rect.h * 0.8}));
      let best = 0; for (let dx = -4; dx <= 4; dx += 2) for (let dy = -8; dy <= 8; dy += 2) { const d = x.getImageData((cx + dx) * k, (my + dy) * k, 1, 1).data; best = Math.max(best, (d[0] + d[1] + d[2]) / 3); }
      return best; })()`);
    ok(red > 80, `THE NEON IN THE WATER: the game blade mirrored under it (brightness ${Math.round(red)})`);
    ok(await ev(N.page, "['reflect', 'light', 'wake', 'set'].every(k => typeof window.__district.harbor().water[k] === 'function')"), 'THE HOOKS: reflect (boats, Part 5), light (fireworks, Part 10), wake (Part 5), set (rain + fog, Part 9)');
    ok(h.mem.mb + h.neon.mb <= h.mem.budget, `MEMORY (the water): ${h.mem.layers.find(l => /mirror/.test(l.name)).mb} MB in the ${h.mem.mb} MB of layers + the neon ${h.neon.mb} MB ≤ ${h.mem.budget}`);
    // NEON PASS 4 — THE THIN BLACK BARS (the owner's iPhone): every ripple strip on whole device rows (an edge at a fractional row
    // anti-aliased into a dark seam), and the pixels agree — in the lit water, the rows where two strips meet are no darker than
    // their neighbours, against every other row (tier 1, DPR 1.5, where the seams showed most here: 3 % darker before the fix)
    for (const tr of [2, 1]) {
      await ev(N.page, `window.__district.setTier(${tr})`);
      await waitFor(N.page, `window.__district.harbor().water.tier === ${tr}`, `the water at tier ${tr}`, 5000); await sleep(700);
      const sm = await ev(N.page, `(async () => { const cv = document.querySelector('canvas'), x = cv.getContext('2d'), k = cv.width / innerWidth, at = [], rest = [];
        for (let n = 0; n < 4; n++) { await new Promise(r => setTimeout(r, 130));
          const wt = window.__district.harbor().water, E = new Set(wt.rows.slice(2).map(r => wt.rows[0] + r)), r0 = Math.ceil(wt.y0 * k) + 1, r1 = Math.floor(wt.y1 * k) - 8, w = cv.width;
          const d = x.getImageData(0, r0 - 1, w, r1 - r0 + 2).data, Lm = (r, c) => { const i = ((r - r0 + 1) * w + c) * 4; return d[i] + d[i + 1] + d[i + 2]; };
          for (let r = r0 + 1; r < r1; r++) { let s = 0, m = 0; for (let c = 0; c < w; c += 2) { const a = Lm(r - 1, c), z = Lm(r + 1, c); if (Math.min(a, z) < 120) continue; s += 2 * Lm(r, c) / (a + z); m++; } if (m > 20) (E.has(r) ? at : rest).push(s / m); } }
        const mean = a => a.reduce((s, v) => s + v, 0) / Math.max(1, a.length), wt = window.__district.harbor().water;
        return { grid: wt.grid, edge: mean(at), rest: mean(rest), n: at.length }; })()`);
      ok(sm.grid && sm.n > 20 && sm.edge >= sm.rest - 0.025, `NO SEAMS IN THE WATER (tier ${tr}): every strip on whole device rows; the rows where strips meet ${(100 * sm.edge).toFixed(1)} % of their neighbours' light, every other row ${(100 * sm.rest).toFixed(1)} % (${sm.n} meeting rows sampled)`);
    }
    await ev(N.page, 'window.__district.setTier(0)'); await waitFor(N.page, 'window.__district.harbor().water.tier === 0 && window.__district.harbor().water.strips > 0', 'the calm mirror', 8000);
    const h0 = await ev(N.page, 'window.__district.harbor()');
    ok(h0.water.tier === 0 && h0.water.strips > 0, `TIER 0: the calm baked mirror (${h0.water.strips} rows, re-drawn once a second)`);
    if (SHOTS) await N.page.screenshot({ path: `${OUT}part4-water-calm-390x844.png` });
    await N.ctx.close();
  }
  { const N = await open({ slot: 'hx', qs: `${NIGHT}&wind=13` });
    await harborUp(N.page); await waitFor(N.page, 'window.__district.harbor().water.rough > 0.85 && window.__district.harbor().water.copies >= 8', 'the chop', 10000).catch(() => {});
    const h = await ev(N.page, 'window.__district.harbor()');
    ok(h.water.rough > 0.85 && h.water.copies >= 8, `A WINDY NIGHT (13 m/s): choppy (roughness ${h.water.rough}), longer broken columns (${h.water.copies} copies)`);
    if (SHOTS) await N.page.screenshot({ path: `${OUT}part4-water-windy-390x844.png` });
    await N.ctx.close();
  }
  { const G = await open({ slot: 'hy', qs: `when=2026-10-20T18:30${GR}&wind=3` });
    await harborUp(G.page); await waitFor(G.page, "/sun/.test(window.__district.harbor().water.paths)", 'the sun\'s path', 10000).catch(() => {});
    const g = await ev(G.page, 'window.__district.harbor().water');
    ok(/sun/.test(g.paths), `GOLDEN HOUR: the sun's gold path on the water (${g.paths})`);
    await G.ctx.close();
    const D = await open({ slot: 'hz', qs: `when=2026-10-21T13:00${GR}` });
    await harborUp(D.page); await waitFor(D.page, "/glints/.test(window.__district.harbor().water.paths)", 'the glints', 10000).catch(() => {});
    const d = await ev(D.page, 'window.__district.harbor().water');
    ok(/glints/.test(d.paths) && d.copies === 0, `BY DAY: sun glints on the water, no light columns (${d.paths}; ${d.copies} copies)`);
    await D.ctx.close();
  }

});
G('harbor', async () => {
  // ================================================================ 3e. Part 5: the harbor's hero pieces — the wheel, the lighthouse, the boats, the roof signs
  { const H = await open({ slot: 'h9', qs: `${NIGHT}&force=taxi` });
    await harborUp(H.page);
    await waitFor(H.page, '(() => { const n = window.__district.harbor().neon; return n.items > 20 && n.built >= n.items && !n.queued; })()', 'the neon built', 15000);
    await waitFor(H.page, "window.__district.harbor().boats.boats.some(b => b.on && b.id === 'taxi')", 'the taxi out', 10000).catch(() => {});
    const h = await ev(H.page, 'window.__district.harbor()');
    const w = h.wheel;
    ok(w.legs[0] > w.head[0] && w.legs[1] < w.head[1] && w.r > 40 && w.mb > 0,
      `THE WHEEL ON ITS PIER: the A-frame's feet at ${Math.round(w.legs[0])} + ${Math.round(w.legs[1])} pt stand on the platform (${Math.round(w.head[0])}..${Math.round(w.head[1])}); r ${Math.round(w.r)} pt, its sprites ${w.mb} MB`);
    const on = h.boats.boats.filter(b => b.on).map(b => b.id);
    ok(on.includes('taxi') && !on.includes('sail') && !on.includes('sail2') && h.rate.fast !== '' && h.mem.layers.some(l => /harbor sprites/.test(l.name)) && h.mem.mb <= h.mem.budget,
      `THE BOATS AT NIGHT: ${on.join(', ')} on the water (no sailboats after dark); the taxi keeps 60 fps (${h.rate.fast}); memory ${h.mem.mb} of ${h.mem.budget} MB`);
    // the lighthouse: three quick taps spin the beam (Part 12's egg hook)
    const lx = h.lighthouse.x, ly = h.lighthouse.y + 40;
    const taps = [];
    for (let i = 0; i < 3; i++) taps.push(await ev(H.page, `window.__district.hit(${lx}, ${ly})`));
    const spin = await ev(H.page, 'window.__district.harbor().lighthouse');
    ok(taps.every(t => t && t.kind === 'lighthouse') && taps[2].spun && spin.spinning, `THE LIGHTHOUSE: tapped 3× → the beam spins (${taps.map(t => t && t.kind).join(', ')})`);
    // the roof signs' frames carry the word towers' beacons; the wheel's colour hook
    const rs = h.neon.signs.filter(s => /^n-roof[AB]$/.test(s.id));
    const bc = rs.map(s => h.beacons.find(b => Math.abs(b.x - (s.rect.x + s.rect.w / 2)) < 2 && b.y < s.rect.y && b.y > s.rect.y - 12));
    const sch = await ev(H.page, `window.__district.harbor().wheel.scheme('halloween')`);
    ok(rs.length === 2 && bc.every(Boolean) && rs.every(s => s.rect.y > h.cam.limitY) && sch === 'halloween',
      `ROOF SIGNS + HOOKS: ${rs.map(s => `${s.id} ${s.game}`).join(', ')} over the word towers, under the limit, their towers' beacons on top; the wheel's scheme hook → ${sch}`);
    if (SHOTS) await H.page.screenshot({ path: `${OUT}part5-harbor-390x844.png` });
    await H.ctx.close();
  }
});
G('sky', async () => {
  // ================================================================ 3f. Part 6a: THE EVERYDAY SKY — the tier on an iPhone, the sky's pieces + API, lanes, the moon
  { const I = await open({ slot: 'h6', qs: `when=2026-10-21T13:00${GR}&wind=2`, dpr: 3, cores: 2 });
    await harborUp(I.page);
    const sc = await ev(I.page, 'window.__district.scene()');
    ok(sc.tier === 2 && sc.dpr === 2, `THE TIER ON AN iPHONE: DPR 3 + iOS's capped core count start the Harbor at tier ${sc.tier} (DPR ${sc.dpr}) — the step-down still guards a slow phone`);
    await waitFor(I.page, '!!window.__district.scene().textRects', 'the sign measured', 8000);
    const b = await ev(I.page, "window.__district.harbor().sky.banner(['FRESH LEMONADE', 'AT THE PIER'])");
    const t = await ev(I.page, "window.__district.harbor().sky.skytype('HAPPY BIRTHDAY STEVE')");
    await waitFor(I.page, '(() => { const h = window.__district.harbor(), st = h.sky.state; return st.banner && st.smoke && st.smoke.puffs > 100 && h.density.road < 1; })()', 'the banner + the skytypers (+ the city calmed)', 8000).catch(() => {});
    const st = (await ev(I.page, 'window.__district.harbor()')).sky.state;
    ok(b && st.banner && st.banner.lines.length === 2 && st.banner.panels.every(p => p.h >= 19), `THE BANNER PLANE (API): ${st.banner && st.banner.lines.join(' / ')} — panels ${st.banner && st.banner.panels.map(p => p.w + '×' + p.h).join(', ')} pt`);
    ok(t && st.smoke && st.smoke.kind === 'skytype' && st.smoke.text === 'HAPPY BIRTHDAY / STEVE' && st.smoke.puffs > 100, `SKYTYPING (API): "${st.smoke && st.smoke.text}" — ${st.smoke && st.smoke.puffs} puffs, 16 a line, 2 lines`);
    const h = await ev(I.page, 'window.__district.harbor()');
    ok(st.used.includes('sky-high') && st.used.includes('sky-low') && st.heavy && h.density.road < 1 && h.density['sky-high'] === 1, `HEAVY SKY: the skytypers hold both sky lanes (no plane there), the rest of the city calms (road density ${h.density.road})`);
    ok(h.rate.fast !== '', `THE SKY KEEPS 60 FPS while it writes (${h.rate.fast})`);
    if (SHOTS) await I.page.screenshot({ path: `${OUT}part6-skytype-390x844.png` });
    await I.ctx.close(); }
  // (the drone show runs on the clock: &speed=4 flies its first formation in a quarter of the time — the same checks)
  { const D = await open({ slot: 'h7', qs: `${NIGHT}&force=drones&text=HELLO&show=heart&speed=4` });
    await harborUp(D.page);
    await waitFor(D.page, '!!window.__district.harbor().sky.state.drones', 'the drone show', 10000);
    await waitFor(D.page, '(() => { const d = window.__district.harbor().sky.state.drones; return d && d.lit > 100; })()', 'the formation lit', 30000);
    const st = (await ev(D.page, 'window.__district.harbor()')).sky.state;
    ok(st.drones && st.drones.n >= 140 && st.drones.lit > 100 && st.used.includes('water') && st.barge && st.barge.w > 40,
      `THE DRONE SHOW (&force=drones): ${st.drones && st.drones.n} drones, ${st.drones && st.drones.lit} lit in "${st.drones && st.drones.shapes.join(' → ')}" at ${st.drones && st.drones.e} s; the barge ${st.barge && Math.round(st.barge.w)} pt on the harbor`);
    const m = st.cel && st.cel.moon;
    ok(m && m.discA > 0.6 && m.r > 14, `THE MOON (the Harbor's art): drawn at r ${m && m.r} pt, visible ${m && m.discA}, amber ${m && m.amber}`);
    if (SHOTS) await D.page.screenshot({ path: `${OUT}part6-drones-390x844.png` });
    await D.ctx.close(); }
});
G('neon', async () => {
  // ================================================================ 3g. NEON PASS 2: clean tubes, solid signs, the waterfront, the drones' colours
  for (const view of [[390, 844], [430, 932]]) {
    const P = await open({ slot: `hn${view[0]}`, qs: NIGHT, view });
    await harborUp(P.page);
    await waitFor(P.page, 'window.__district.harbor().neon.signs.every(s => s.on)', 'the neon on', 15000);
    const r = await ev(P.page, `(() => { const h = window.__district.harbor(), W = innerWidth; let pts = 0, edge = 0, inSign = 0;
      const rs = h.neon.signs.map(s => s.rect);
      for (const o of h.neonRuns()) for (const run of o.runs) for (const [x, y] of run) { pts++; if (x < 2.4 || x > W - 2.4) edge++; if (rs.some(q => x > q.x && x < q.x + q.w && y > q.y && y < q.y + q.h)) inSign++; }
      return { pts, edge, inSign, clipped: h.neon.signs.filter(s => s.rect.x < 3 || s.rect.x + s.rect.w > W - 3).map(s => s.id), wf: h.waterfront }; })()`);
    ok(r.pts > 1500 && r.edge === 0 && r.inSign === 0 && !r.clipped.length, `CLEAN NEON at ${view[0]}: ${r.pts} tube points, none within 2.4 pt of the screen's edge, none through a sign; no sign clipped (${r.clipped.join(', ') || 'none'})`);
    ok(r.wf.fronts >= 8 && !r.wf.words && r.wf.shops.includes('marquee') && r.wf.shops.includes('cocktail'), `THE WATERFRONT at ${view[0]}: ${r.wf.fronts} storefronts read by shape on a phone (${[...new Set(r.wf.shops)].join(', ')}), no small words`);
    await P.ctx.close();
  }
});
G('sky', async () => {
  // ================================================================ DT2: THE CLOUDS — the real weather's kinds, baked + drawn, in the sky band, in budget
  { const C = await open({ slot: 'h31', qs: 'when=2026-10-22T13:00&tz=America/Detroit&at=42.96,-85.67&wx=clouds', view: [402, 874] });
    await harborUp(C.page);
    await waitFor(C.page, '!!(window.__district.harbor().clouds || {}).born', 'the clouds baked', 20000);
    const c = (await ev(C.page, 'window.__district.harbor()')).clouds;
    const cu = c.at.filter(d => d.k === 'cumulus');
    ok(cu.length >= 8 && c.kinds.includes('strato') && c.mix.cumulus > 0.3, `THE CLOUDS (a cloudy day): ${c.clouds} clouds — ${cu.length} cumulus + ${c.kinds.filter(k => k === 'strato').length} stratocumulus patches (the cover's mix ${JSON.stringify(c.mix)})`);
    ok(cu.every(d => d.y > 62 && d.y < 520 && d.w >= 30 && d.h >= 10), 'THE CLOUDS in the sky band, never a sliver (≥ 30 × 10 pt)');
    const near = cu.filter(d => d.s > 0.55), far = cu.filter(d => d.s < 0.4);
    ok(near.length && far.length && Math.max(...far.map(d => d.w)) < Math.max(...near.map(d => d.w)), `PERSPECTIVE: the near ones bigger (${near.length} near up to ${Math.max(...near.map(d => d.w))} pt, ${far.length} far up to ${Math.max(...far.map(d => d.w))} pt)`);
    ok(c.mb < 9, `THE CLOUDS' MEMORY: ${c.mb.toFixed(1)} MB (sprites + their cached shapes)`);
    okT(c.pending === 0, `THE CLOUDS baked in time: ${c.pending} left to bake`);
    await C.ctx.close(); }
  { const C = await open({ slot: 'h32', qs: 'when=2026-10-22T13:00&tz=America/Detroit&at=42.96,-85.67&wx=overcast', view: [402, 874] });
    await harborUp(C.page);
    await waitFor(C.page, '!!(window.__district.harbor().clouds || {}).born', 'the overcast baked', 25000);
    const c = (await ev(C.page, 'window.__district.harbor()')).clouds;
    ok(c.deck && c.kinds.includes('scud'), `OVERCAST: the deck + scud under it (${c.kinds.join(', ')})`);
    await C.ctx.close(); }
});
G('sky', async () => {
  // (&speed=8: the message holds after ~36 s of the show's clock — ~5 s here)
  { const D = await open({ slot: 'h8', qs: `${NIGHT}&force=drones&text=HI%20THERE&colours=ff2e97,2ee6ff&by=word&show=heart&speed=8` });
    await harborUp(D.page);
    await waitFor(D.page, '!!window.__district.harbor().sky.state.drones', 'the drone show', 10000);
    await waitFor(D.page, "(() => { const d = window.__district.harbor().sky.state.drones; return d && d.e > 36.5; })()", 'the message held', 45000);
    const d = (await ev(D.page, 'window.__district.harbor()')).sky.state.drones;
    ok(d.colours === 2 && d.lit > 60, `THE DRONES' COLOURS (&colours=…&by=word): "HI THERE" in ${d.colours} colours, a colour per word (${d.lit} lit)`);
    // NEON PASS 3 (the owner): the formation in OPEN SKY — under the SPEAKEASY word / the tagline, over the tallest crown
    const g = await ev(D.page, `(() => { const h = window.__district.harbor(); return { crown: Math.min(...h.boxes.filter(b => b.kind === 'sky').map(b => b.y)), word: document.querySelector('.nd-word').getBoundingClientRect().bottom }; })()`);
    ok(d.box && d.box[3] < g.crown - 2 && d.box[1] > g.word, `THE DRONES IN OPEN SKY: the formation ${d.box && d.box[1]}–${d.box && d.box[3]} pt, under the word (${Math.round(g.word)}), over the tallest crown (${Math.round(g.crown)})`);
    await D.ctx.close(); }
});
G('neon', async () => {
  // ================================================================ 3h. NEON PASS 3: the night spectacular, the lighthouse in neon, the party show, the everyday motion
  { const N = await open({ slot: 'h9', qs: NIGHT, view: [402, 874] });
    await harborUp(N.page);
    await waitFor(N.page, 'window.__district.harbor().neon.signs.every(s => s.on) && !!window.__district.harbor().daily', 'the neon on + the motion tonight', 15000);
    const h = await ev(N.page, 'window.__district.harbor()');
    const bands = h.neon.outlines.filter(o => o.id.startsWith('threads-near') || o.id.startsWith('threads-mid'));
    ok(bands.length >= 5 && bands.reduce((a, o) => a + o.runs, 0) >= 20 && h.neon.outlines.some(o => o.id === 'lighthouse' && o.runs >= 6), `THE NIGHT CITY LIT: ${bands.length} neon clusters on the near + mid buildings (${bands.reduce((a, o) => a + o.runs, 0)} runs), the lighthouse in neon (${(h.neon.outlines.find(o => o.id === 'lighthouse') || {}).runs} runs)`);
    // (NEON PASS 6: no icon signs any more — nothing cycles its colour)
    ok(h.daily && h.daily.spell.length >= 2 && h.daily.blink.length >= 1 && h.daily.chase.length >= 3, `THE EVERYDAY MOTION (NEON PASS 4: alive): ${h.daily.spell} spells on, ${h.daily.blink} blink, ${h.daily.chase.join(' + ')} chase slowly`);
    ok(h.neon.scheme === 'city' && !h.neon.partyLook, 'A NORMAL NIGHT: the city\'s own colours');
    ok(!h.show.scene && h.beams === 0, 'A NORMAL NIGHT: no party show, no searchlights');
    ok(h.daily.rotate.length >= 1 && h.daily.stages.length >= 1, `COLOURS THROUGH THE NIGHT: ${h.daily.rotate.join(' + ')} rotate slowly, ${h.daily.stages.join(' + ')} change scheme by the hour`);
    await N.ctx.close(); }
  // 7a — THE SPELL-ON ROUND's preview (&force=spell-on): the next sign every 6 s, every named sign in turn, never two at once (PF: watched
  // until every sign has spelled — up to 40 s on the CI's slower machine — never a fixed window only)
  { const N = await open({ slot: 'h9', qs: `${NIGHT}&force=spell-on`, view: [402, 874] });
    await harborUp(N.page);
    await waitFor(N.page, 'window.__district.harbor().neon.signs.every(s => s.on) && !!window.__district.harbor().daily', 'the neon on', 15000);
    const r = await ev(N.page, `new Promise(res => { const seen = [], t0 = performance.now(); let shot = null; const tick = () => { const d = window.__district.harbor().daily; const s = d && d.spellOn; if (s && (!seen.length || seen[seen.length - 1].k !== s.k)) seen.push({ id: s.id, k: s.k }); const n = new Set(seen.map(v => v.id)).size, el = performance.now() - t0; if ((el < 19500 || n < Math.min(3, (d && d.spell || []).length)) && el < 40000) requestAnimationFrame(tick); else res({ seen, all: d.spell }); }; requestAnimationFrame(tick); })`);
    const ids = new Set(r.seen.map(s => s.id));
    ok(r.seen.length >= 3 && ids.size >= Math.min(3, r.all.length) && r.seen.every((s, i) => !i || s.id !== r.seen[i - 1].id), `SPELL-ON ROUND (&force=spell-on): ${r.seen.map(s => s.id).join(' → ')} — every sign in turn (${r.all.join(', ')})`);
    if (SHOTS) { await waitFor(N.page, '(() => { const s = window.__district.harbor().daily.spellOn; return s && s.u > 1.4 && s.u < 1.9; })()', 'mid-spell', 8000).catch(() => {}); await N.page.screenshot({ path: `${OUT}neon-spell-on-402x874.png` }); }
    await N.ctx.close(); }
  { const N = await open({ slot: 'h12', qs: `${NIGHT}&force=burnout`, view: [402, 874] });
    await harborUp(N.page);
    await waitFor(N.page, '!!(window.__district.harbor().daily || {}).burnout', 'the burnt-out letter', 15000);
    const b = (await ev(N.page, 'window.__district.harbor()')).daily.burnout, sg = (await ev(N.page, 'window.__district.harbor()')).neon.signs.find(s => s.id === b.id);
    ok(sg && sg.kind === 'named', `A BURNT-OUT LETTER (&force=burnout): letter ${b.letter + 1} of ${b.id} is dead tonight (never the NEON logo)`);
    await N.ctx.close(); }
});
G('neon', async () => {
  // ================================================================ C1.5: THE O KEEPS ITS WHITE CORE (review-2.md §2) + the holiday O + the sign-dim hook
  { const N = await open({ slot: 'h21', qs: NIGHT, view: [402, 874] });
    await harborUp(N.page);
    await waitFor(N.page, "document.querySelector('.nd-sign').classList.contains('is-steady')", 'the sign steady', 20000);
    // make the flutter land on the O: for a few seconds Math.random alternates "flutter now" / "the third lit letter"
    const landed = await ev(N.page, `new Promise(res => {
      const o = document.querySelector('.nd-logo .ndl-3 .ndl-core'); let seen = false;
      const mo = new MutationObserver(() => { if (o.classList.contains('is-flut')) seen = true; }); mo.observe(o, { attributes: true });
      const rnd = Math.random; let k = 0; Math.random = () => (k++ % 2 ? 0.55 : 0.1);
      const end = () => { Math.random = rnd; setTimeout(() => { mo.disconnect(); res(seen); }, 400); };
      const t0 = Date.now(), poll = setInterval(() => { if (seen || Date.now() - t0 > 12000) { clearInterval(poll); end(); } }, 250);
    })`);
    const cores = await ev(N.page, "[...document.querySelectorAll('.nd-logo .ndl-core')].map(c => ({ style: c.hasAttribute('style'), stroke: getComputedStyle(c).stroke, flut: c.classList.contains('is-flut') }))");
    ok(landed && cores.every(c => !c.style && c.stroke !== 'none' && !c.flut), `THE O'S WHITE CORE: the flutter landed on the O (${landed}) and every letter keeps its core — no style attribute left, stroke ${[...new Set(cores.map(c => c.stroke))].join(' / ')}`);
    // (the CSS half: even an empty style="" on the plain O no longer takes its core away)
    const s2 = await ev(N.page, "(() => { const o = document.querySelector('.nd-logo .ndl-3 .ndl-core'); o.setAttribute('style', ''); const s = getComputedStyle(o).stroke; o.removeAttribute('style'); return s; })()");
    ok(s2 !== 'none', `THE O'S WHITE CORE: the holiday rule reaches only the swapped O (a stray style="" leaves stroke ${s2})`);
    // THE SIGN-DIM HOOK (built for Part 6b's sky messages): the logo dims, the tagline fades, and both come back
    await ev(N.page, "window.__district.signDim('test', { logo: 0.3, tag: 0, ms: 150 })");
    await sleep(600);
    const dim = await ev(N.page, "(() => { const s = document.querySelector('.nd-sign'); return { logo: +getComputedStyle(s.querySelector('.nd-logo-wrap')).opacity, word: +getComputedStyle(s.querySelector('.nd-word-g')).opacity, tag: +getComputedStyle(s.querySelector('.nd-tag')).opacity, by: window.__district.signDim().by }; })()");
    await ev(N.page, "window.__district.signDim('test', null)");
    await sleep(600);
    const back = await ev(N.page, "(() => { const s = document.querySelector('.nd-sign'); return { logo: +getComputedStyle(s.querySelector('.nd-logo-wrap')).opacity, word: +getComputedStyle(s.querySelector('.nd-word-g')).opacity, tag: +getComputedStyle(s.querySelector('.nd-tag')).opacity }; })()");
    ok(Math.abs(dim.logo - 0.3) < 0.02 && Math.abs(dim.word - 0.3) < 0.02 && dim.tag < 0.02 && dim.by.includes('test') && back.logo === 1 && back.word === 1 && back.tag > 0.98, `THE SIGN-DIM HOOK: dimmed logo ${dim.logo} / SPEAKEASY ${dim.word} / tagline ${dim.tag} → back ${back.logo} / ${back.word} / ${back.tag}`);
    await N.ctx.close(); }
  for (const [when, kind, core] of [['2026-10-31T22:00', 'halloween', 'rgb(255, 244, 224)'], ['2027-03-17T22:00', 'stpatrick', 'rgb(240, 255, 246)']]) {
    const N = await open({ slot: `h22${kind[0]}`, qs: `when=${when}${GR}`, view: [402, 874] });
    await harborUp(N.page);
    await waitFor(N.page, `!!document.querySelector('.nd-logo .ndl-3[data-kind="${kind}"]')`, `the ${kind} O`, 20000);
    const o = await ev(N.page, `(() => { const g = document.querySelector('.nd-logo .ndl-3'); return { cores: [...g.querySelectorAll('.ndl-core')].map(c => getComputedStyle(c).stroke), styled: [...g.querySelectorAll('path.ndl-body[style]')].map(c => getComputedStyle(c).stroke) }; })()`);
    ok(o.cores.length > 1 && o.cores.every(c => c !== 'none') && o.cores.includes(core) && o.styled.every(c => c !== 'none'), `THE ${kind.toUpperCase()} O: its parts keep their colours (cores ${[...new Set(o.cores)].join(' / ')}; the coloured parts ${[...new Set(o.styled)].join(' / ') || '—'})`);
    await N.ctx.close();
  }
});
G('party', async () => {
  { const Q = await open({ slot: 'h10', qs: `when=2026-10-24T23:00${GR}&scene=climb%2Bcrowns`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, 'window.__district.party().show.scene === "climb+crowns" && window.__district.party().show.racing > 0', 'the party show at its peak', 20000);
    // (NEON PASS 5: tiers 1–2 wear THE ROTATING PALETTE — the baked 'party' scheme is tier 0's still party)
    await waitFor(Q.page, "(() => { const n = window.__district.harbor().neon; return n.pal && n.pal.on && n.pal.built > 20 && !n.queued; })()", 'the party colours rolled in', 15000);
    const p = await ev(Q.page, 'window.__district.party()'), hq = await ev(Q.page, 'window.__district.harbor()'), ws = await ev(Q.page, 'window.__district.harbor().wheel.scheme()');
    ok(p.show.moving >= 6 && p.show.racing >= 6 && ws === 'party', `THE PARTY SHOW (11 pm): scene "${p.show.scene}", ${p.show.racing} buildings racing + ${p.show.moving - p.show.racing} running an effect, the wheel in party colours`);
    // NEON PASS 4: obvious in one frame — the party scheme, the sky beams, the beat punching, the string lights in colour
    const pk = await ev(Q.page, `new Promise(res => { let lo = 9, hi = 0, n = 0; const tick = () => { const v = window.__district.party().punch; lo = Math.min(lo, v); hi = Math.max(hi, v); if (++n < 150) requestAnimationFrame(tick); else res({ lo, hi }); }; requestAnimationFrame(tick); })`);
    ok(hq.skyBeams.beams.length >= 2 && p.show.beams > 0.5, `THE SKY BEAMS: ${hq.skyBeams.beams.map(b => b.id + (b.under ? '' : ' (to the top)')).join(', ')}`);
    ok(pk.hi - pk.lo > 0.5, `THE HARD BEAT: the punch swings ${pk.lo.toFixed(2)} → ${pk.hi.toFixed(2)} over ~2.5 s`);
    // PART 7a: the roof string lights are ON, mounted on the parapet's posts (NEON PASS 5 had them off until the speakeasy was built)
    ok(hq.strings.on === false && hq.strings.bulbs >= 20 && hq.strings.runs >= 5, `STRING LIGHTS: OFF for now (PF — the owner: re-rendered with the rooftop in 7b), still laid out on the parapet (${hq.strings.runs} swags, ${hq.strings.bulbs} bulbs)`);
    await Q.ctx.close(); }
  await neonPass5Party();
  { const Q = await open({ slot: 'h11', qs: `when=2026-10-24T21:00${GR}`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, '!!window.__district.party().show.scene', 'the warm-up show', 20000);
    const p = await ev(Q.page, 'window.__district.party()');
    ok(p.name === 'warm' && p.show.lights === 0 && ['glow', 'sweep-slow', 'climb-slow', 'chase-heroes'].includes(p.show.scene), `THE WARM-UP (9 pm): a classy scene ("${p.show.scene}"), no searchlights yet`);
    await Q.ctx.close(); }
  // FP2 — PARTY TIMING EARLIER: nothing at 8:15 pm (the warm-up is 8:30), THE PEAK from 9:30 pm (core/harbor-show.js#harborPartyPlan)
  for (const [when, want] of [['2026-10-24T20:15', 'off'], ['2026-10-24T21:45', 'peak']]) {
    const Q = await open({ slot: 'h12', qs: `when=${when}${GR}`, view: [402, 874] });
    await harborUp(Q.page);
    if (want === 'peak') await waitFor(Q.page, "window.__district.party().name === 'peak'", 'the peak at 9:45 pm', 20000);
    else await sleep(1500);         // (timed: the party would have switched on by now)
    const p = await ev(Q.page, '({ on: window.__district.party().on, name: window.__district.party().name, plan: window.__district.party().plan })');
    ok(want === 'off' ? !(p.on > 0) : p.name === 'peak' && p.on > 0, `FP2 TIMING ${when.slice(11)}: ${want === 'off' ? 'no show before the 8:30 warm-up' : 'THE PEAK'} (on ${p.on}, ${p.name}; plan ${p.plan ? `${p.plan.warm}/${p.plan.peak}` : '?'})`);
    await Q.ctx.close(); }
});
// ================================================================ 3i. THE PREVIEW PANEL (JUST ME + EVERYONE ON CITY 2)
G('panel', async () => { await panelSection(); await neonPass5Panel(); });
G('dock', async () => {
  // ================================================================ 4. the dock: HOST, JOIN, the knock on the door
  const H = await open({ slot: 'hh', qs: NIGHT });
  await harborUp(H.page);
  await tap(H.page, '.nd-hostbtn');
  await waitFor(H.page, '!!window.__arcade.state.code && !!document.querySelector(".lobby-screen")', 'lobby after HOST', 20000);
  const code = await ev(H.page, 'window.__arcade.state.code');
  ok(!!code, `HOST (city 2): one tap opens room ${code}`);
  ok(/[?&]city=2(&|$)/.test(await ev(H.page, 'location.search')) && /room=/.test(await ev(H.page, 'location.search')), `THE FLAG IN THE URL: the room's address keeps city=2 (${await ev(H.page, 'location.search')})`);
  await H.page.reload();
  await waitFor(H.page, '!!window.__arcade && window.__arcade.state.code === ' + JSON.stringify(code), 'rejoin after a refresh', 20000);
  ok(/[?&]city=2(&|$)/.test(await ev(H.page, 'location.search')), 'THE FLAG IN THE URL: a refresh in the lobby rejoins and stays on city=2');
  const B = await open({ slot: 'hb', qs: NIGHT, view: [402, 874] });
  await harborUp(B.page);
  const door = await ev(B.page, 'window.__district.door()');
  const blocked = await ev(B.page, `(() => { const d = ${JSON.stringify(door.rect)}; return [...document.querySelectorAll('.nd-ringbtn, .nd-tab, .nd-bar, .menu-btn, .music-btn')].map(e => e.getBoundingClientRect()).filter(r => r.width && d.x < r.right && d.x + d.w > r.left && d.y < r.bottom && d.y + d.h > r.top).length; })()`);
  ok(door.rect.w >= 44 && door.rect.h >= 44 && !blocked, `THE DOOR: a ${Math.round(door.rect.w)}×${Math.round(door.rect.h)} pt tap target, clear of the dock and the corner buttons`);
  await tapAt(B.page, door.rect.x + door.rect.w / 2, door.rect.y + door.rect.h / 2);
  await waitFor(B.page, "document.querySelector('.nd-actions').classList.contains('is-join')", 'JOIN from the knock', 4000).catch(() => {});
  ok((await ev(B.page, "document.querySelector('.nd-actions').classList.contains('is-join')")) && (await ev(B.page, 'window.__district.street().people.knocks')) === 1, 'KNOCK (city 2): a tap on the speakeasy\'s door opens JOIN');
  await tap(B.page, '.nd-codebox'); await sleep(250);
  await B.page.keyboard.type(code.toLowerCase(), { delay: 90 });
  await waitFor(B.page, '!!window.__arcade.state.code', 'B joined', 20000);
  ok((await ev(B.page, 'window.__arcade.state.code')) === code, 'JOIN (city 2): typing the hush word joins the room');
  await H.ctx.close(); await B.ctx.close();
});
G('perf', async () => {
  // ================================================================ 5. frame pacing at 4× CPU, memory over 20 cycles, a hidden tab
  const Q = await open({ slot: 'hq', qs: `when=2026-10-24T23:00${GR}` });   // a Saturday at the party's peak
  await harborUp(Q.page);
  await Q.page.bringToFront();
  const cdp = await Q.page.target().createCDPSession();
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  const perf = [];
  for (const t of [2, 1, 0]) {
    // (one plain-value read; a page torn down under 4× throttle + GC once lost a pending evaluate: "Promise was collected" — retried)
    for (let k = 0; k < 2; k++) {
      try {
        await ev(Q.page, `window.__district.setTier(${t})`);
        // (FP2: 30 s — at 4× CPU without a GPU a frame costs ~110 ms here and the bake runs a step a frame; FP2's smaller night steps
        // (the setts two rows a step, the street, the neon's depth plan) pushed the re-bake past 15 s — the commit before missed it too on
        // its first try)
        await waitFor(Q.page, '!window.__district.harbor().pending && !window.__district.harbor().fading', 're-bake', 30000);
        await sleep(6000);   // (the measuring window)
        const r = await ev(Q.page, '(() => { const d = window.__district, c = d.cost(), f = [...d.frames()].sort((a, b) => a - b); return { now: d.scene().tier, cost: c.reduce((a, b) => a + b, 0) / Math.max(1, c.length), p50: f.length ? f[Math.floor(f.length / 2)] : 0 }; })()');
        perf.push({ tier: t, now: r.now, cost: +r.cost.toFixed(2), p50: +r.p50.toFixed(1) });
        break;
      } catch (e) {
        // (FP2: say WHAT is still pending — the bake, the windows' light key, a fade — before retrying / failing)
        const st = await ev(Q.page, '(() => { const h = window.__district.harbor(), w = h.windows || {}; return JSON.stringify({ tier: window.__district.scene().tier, pending: h.pending, fading: h.fading, bakes: h.bakes, key: h.key, win: { key: w.key, pending: w.pending, bakes: w.bakes } }); })()').catch(x => x.message);
        log('perf: state', st);
        if (k) throw e; log('perf: retrying tier', t, e.message); }
    }
  }
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  writeFileSync(`${OUT}perf.json`, JSON.stringify(perf, null, 1));
  // C1.5 (the owner's decision): absolute numbers on this laptop are WARNINGS — the gate is the relative A/B in one run
  // (title-perf.mjs --ab) and her iPhone (&debug=1's session line). Headless Chrome without a GPU is raster-bound on a party
  // night (frames 33–100 ms at 4× on the commit before C1.5 too, the tier stepping down): the check is that it measured.
  ok(perf.length === 3 && perf.every(p => p.cost > 0), `PERF (city 2, party peak, ${CPU}× CPU) measured: ${perf.map(p => `t${p.tier}${p.now !== p.tier ? `→${p.now}` : ''}: p50 ${p.p50} ms, work ${p.cost} ms`).join(' · ')}`);
  for (const p of perf) {
    if (p.cost > BUDGET_MS[p.tier]) log(`WARN  PERF: t${p.tier} scene work ${p.cost} ms > the ${BUDGET_MS[p.tier]} ms budget on this laptop (a warning — the A/B + the phone decide)`);
    if (p.p50 > 18 || (p.tier > 0 && p.now === 0)) log(`WARN  PERF: t${p.tier} frames p50 ${p.p50} ms${p.now === 0 && p.tier > 0 ? ', fell to tier 0' : ''} (a warning on this laptop)`);
  }
  // (MEMORY at tier 0: it can't step lower — a party night on this laptop steps 2 → 1 on its own, and memory scales with the tier)
  await setTierBack();
  async function setTierBack() { await ev(Q.page, 'window.__district.setTier(0)'); await waitFor(Q.page, '!window.__district.harbor().pending && !window.__district.harbor().fading', 're-bake', 15000); }
  const memH0 = await ev(Q.page, 'window.__district.harbor()'), mem0 = memH0.mem.mb;
  await cdp.send('HeapProfiler.collectGarbage');
  const q0 = (await cdp.send('Runtime.getHeapUsage')).usedSize;
  for (let i = 0; i < 20; i++) {
    await Q.page.evaluate(() => import('/js/store.js').then(m => m.setState({ view: 'setup', setupMode: 'host' })));
    await waitFor(Q.page, "!!document.querySelector('.setup-screen') && !window.__district", 'the setup screen', 8000).catch(() => {});
    await Q.page.evaluate(() => import('/js/store.js').then(m => m.setState({ view: 'title' })));
    await waitFor(Q.page, '!!window.__district && !!window.__district.harbor() && window.__district.harbor().shown', 'the title again', 10000);
  }
  await waitFor(Q.page, '!!window.__district && !!window.__district.harbor() && window.__district.harbor().shown', 'back on the title', 15000);
  await sleep(800);
  await waitFor(Q.page, '!window.__district.harbor().pending && !window.__district.harbor().fading', 'settled (the memory is read between crossfades)', 15000);
  // (the same tier as the first reading: a loaded laptop may probe a tier down — NEON PASS 5's tiering — and memory scales with the tier)
  if ((await ev(Q.page, 'window.__district.harbor().mem.tier')) !== memH0.mem.tier) { await ev(Q.page, `window.__district.setTier(${memH0.mem.tier})`); await settled(Q.page, 'the same tier again'); }
  await cdp.send('HeapProfiler.collectGarbage');
  const q1 = (await cdp.send('Runtime.getHeapUsage')).usedSize;
  const mem1 = (await ev(Q.page, 'window.__district.harbor()')).mem.mb;
  const scenes = await ev(Q.page, `document.querySelectorAll('.nd-scene').length`);
  const lay = h => h.mem.layers.map(l => `${l.name.split(' ')[0]}:${l.mb}`).join(' ');
  const hq0 = memH0, hq1 = await ev(Q.page, 'window.__district.harbor()');
  ok(scenes === 1 && q1 - q0 < 6e6 && Math.abs(mem1 - mem0) < 0.05, `MEMORY: 20 title↔setup cycles leave one city, heap ${Math.round((q1 - q0) / 1e5) / 10} MB, offscreen ${mem0} → ${mem1} MB${Math.abs(mem1 - mem0) >= 0.05 ? ` (tier ${hq0.mem.tier} → ${hq1.mem.tier}; ${lay(hq0)} → ${lay(hq1)})` : ''}`);
  await Q.page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await sleep(300);
  ok((await ev(Q.page, 'window.__district.scene()')).running === false, 'HIDDEN TAB (city 2): the Harbor stops rendering');
  await Q.page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await sleep(300);
  ok((await ev(Q.page, 'window.__district.scene()')).running === true, 'VISIBLE AGAIN: it resumes');

  // ================================================================ 5b. BATTERY (cleanup pass 1): a calm night draws every other frame; a hidden page draws none
  { const C = await open({ slot: 'hc', qs: `${NIGHT}&force=no-planes,no-birds` });
    await harborUp(C.page);
    await waitFor(C.page, '!window.__district.harbor().pending && !window.__district.harbor().fading', 'settled', 15000);
    await waitFor(C.page, "window.__district.harbor().rate.fast === ''", 'the city calm (the neon booted)', 20000);   // (the boot's sputters count as motion)
    // (a 3 s window with nothing fast in it — a loaded laptop may re-bake mid-window (the tier's probe): then the next window, ≤ 4)
    let r0, r1;
    for (let k = 0; k < 4; k++) {
      await waitFor(C.page, "window.__district.harbor().rate.fast === ''", 'calm again', 20000).catch(() => {});
      await sleep(500);
      r0 = await ev(C.page, 'window.__district.harbor().rate'); await sleep(3000); r1 = await ev(C.page, 'window.__district.harbor().rate');
      if (r1.fast === '') break;
    }
    const fps = (r1.drawn - r0.drawn) / 3;
    okT(r1.fast === '' && fps > 22 && fps < 40, `BATTERY: a calm night draws ${fps.toFixed(0)} frames a second (every other rAF; fast: '${r1.fast || 'calm'}')`);
    await C.page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await sleep(400); const h0 = await ev(C.page, 'window.__district.harbor().rate'); await sleep(600); const h1 = await ev(C.page, 'window.__district.harbor().rate');
    ok(h1.drawn === h0.drawn && h1.running === false, `BATTERY: hidden, nothing is drawn (${h0.drawn} → ${h1.drawn})`);
    await C.page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await sleep(600); const v = await ev(C.page, 'window.__district.harbor().rate');
    ok(v.running && v.fast !== '', `BATTERY: visible again, it resumes (fast: ${v.fast})`);
    okT(v.drawn > h1.drawn + 20, `BATTERY: visible again, at 60 fps for a moment (${v.drawn - h1.drawn} frames in 0.6 s)`);
    await C.ctx.close(); }
  await Q.ctx.close();
});

// ================================================================ CITY 2.0 MUSIC (the owner's mood songs, the MUSIC MOOD setting; docs/audio.md#city-20-music)
G('music', async () => {
  const songs = await (await fetch(`${BASE}/data/mood-music.json`)).json();
  const deck = m => songs.city2.moods[m];
  const NOW = `(() => { const d = window.__arcade.musicDebug(); return d.list === 'mood' && d.playing ? String(d.playing).replace(/^m:/, '') : null; })()`;
  const unlock = p => tapAt(p, 30, 300);
  const start = async p => { await unlock(p); await waitFor(p, NOW, 'a mood song playing', 25000); return ev(p, NOW); };
  const setMood = (p, v) => ev(p, `import('/js/audio/settings.js').then(m => m.updateSettings({ musicMood: '${v}' }))`);
  const voices = p => ev(p, 'window.__arcade.musicDebug().voices.filter(v => v.gain > 0.03).length');
  const changed = (p, from, what, ms = 20000) => waitFor(p, `(() => { const id = ${NOW}; return !!id && id !== '${from}'; })()`, what, ms);

  // ---- 1. the five preview links: the mood follows the city's own clock, the song comes from that mood's City 2.0 deck
  for (const [when, mood] of [['2026-10-23T08:00', 'morning'], ['2026-10-23T13:00', 'day'], ['2026-10-23T19:30', 'evening'], ['2026-10-22T23:45', 'late'], ['2026-10-24T23:00', 'party']]) {
    const P = await open({ slot: 'mu', qs: `when=${when}${GR}&debug=1`, view: [402, 874] });
    const m = await ev(P.page, 'window.__arcade.mood()');
    const id = await start(P.page);
    ok(m === mood && deck(mood).includes(id), `MUSIC ${when} → ${mood}: plays ${id} from City 2.0's ${mood} deck (${deck(mood).length} songs)`);
    ok(!songs.moods[mood].includes(id) && songs.songs[id].c2,`MUSIC ${mood}: not one of City 1.0's songs (${id})`);
    // (7a §0 — THE MUSIC'S FIRST TAP: the sign answered the music's start — a surge through the daytime glass, a race through the lit tubes)
    { await waitFor(P.page, '!!window.__district.surge().last', 'the sign answers the music', 4000).catch(() => {});
      const sg = await ev(P.page, 'window.__district.surge()');
      // (8a: from the sign's real state — unlit: 'surge', lit: 'first', the warm-up window: 'catch')
      const want = mood === 'day' ? ['surge'] : mood === 'late' || mood === 'party' ? ['first'] : ['surge', 'first', 'catch'];
      ok(sg && sg.spent && sg.last && sg.last.why === 'music' && want.includes(sg.last.did), `FIRST TAP ${mood}: the music started → the NEON sign answered (${sg && sg.last ? sg.last.did : 'nothing'})`); }
    await sleep(1500);
    const b = await ev(P.page, 'window.__arcade.beat()'), line = await ev(P.page, 'window.__district.harbor().music');
    const s = songs.songs[id];
    ok(b && b.id === id && ((s.grid.trusted === false && b.untrusted && !b.grid) || (s.grid.trusted !== false && b.grid && Math.abs(b.grid.bpm - s.grid.bpm) < 0.01)), `MUSIC ${mood}: the beat follows ${id}'s ${s.grid.trusted === false ? 'kicks (grid not trusted)' : `grid (${s.grid.bpm} bpm)`}`);
    ok(/music/i.test(line) && line.includes(id), `MUSIC ${mood}: the readout names it ("${line}")`);
    if (mood === 'party') { const sl = await ev(P.page, 'window.__district.harbor().sync'); ok(/^sync out \d+ ms.* · lead [+−-]?\d+( → [+−-]?\d+)? ms \([^)]*\) · lag \d+ ms$/.test(sl || ''), `SYNC: the readout says what the beat subtracts ("${sl}")`); }
    if (SHOTS && mood === 'party') await P.page.screenshot({ path: `${OUT}music-party-402x874.png` });
    await P.ctx.close();
  }

  // ---- 2. MUSIC MOOD (the setting): a forced change is a ~4 s crossfade into the new mood's deck, AUTO goes back without a cut
  { const P = await open({ slot: 'mu', qs: `when=2026-10-23T13:00${GR}`, view: [402, 874] });
    const first = await start(P.page);
    ok(deck('day').includes(first), `SETTING: AUTO at 1 pm plays DAY (${first})`);
    await setMood(P.page, 'late');
    let peak = 0; const t0 = Date.now();
    while (Date.now() - t0 < 14000) { peak = Math.max(peak, await voices(P.page)); const id = await ev(P.page, NOW); if (id && id !== first && peak >= 2 && (await voices(P.page)) === 1) break; await sleep(150); }
    const now = await ev(P.page, NOW);
    ok(now && now !== first && deck('late').includes(now), `SETTING: LATE NIGHT crossfades to ${now} (late deck) without waiting for the song to end`);
    ok(peak >= 2, `SETTING: it is a crossfade — two voices sounding at once (${peak}), never a cut`);
    ok(await ev(P.page, `JSON.parse(localStorage.getItem('na:settings')).musicMood === 'late'`), 'SETTING: saved on this device');
    await setMood(P.page, 'auto');
    await changed(P.page, now, 'AUTO again');
    ok(deck('day').includes(await ev(P.page, NOW)), 'SETTING: AUTO again — back to the time of day (a crossfade into the DAY deck)');
    // the settings sheet row
    await ev(P.page, `document.querySelector('button.gear').click()`);
    await waitFor(P.page, `document.querySelectorAll('.set-mood-seg .seg-btn').length === 6`, 'the MUSIC MOOD row', 5000);
    const labels = await ev(P.page, `[...document.querySelectorAll('.set-mood-seg .seg-btn')].map(b => b.textContent)`);
    ok(labels.join(',') === 'AUTO,MORNING,DAY,EVENING,LATE NIGHT,PARTY', `SETTING: the row reads ${labels.join(' · ')}`);
    if (SHOTS) for (const [w, h] of [[390, 844], [412, 915], [1440, 900]]) { await P.page.setViewport({ width: w, height: h, deviceScaleFactor: w < 1000 ? 2 : 1, isMobile: w < 1000, hasTouch: w < 1000 }); await sleep(500); await P.page.screenshot({ path: `${OUT}music-setting-${w}x${h}.png` }); }
    await P.ctx.close(); }

  // ---- 3. a natural change waits for the song; a link's &mood= plays that mood; the party starting is forced
  { const P = await open({ slot: 'mu', qs: `when=2026-10-22T10:59:00&speed=20${GR}`, view: [402, 874] });
    const first = await start(P.page);
    await waitFor(P.page, `window.__arcade.mood() === 'day'`, 'the clock reaching 11 am', 12000);
    await sleep(2500);
    ok((await ev(P.page, NOW)) === first, `NATURAL CHANGE: MORNING → DAY at 11 am — ${first} plays on (never cut)`);
    await ev(P.page, 'window.__arcade.musicSeek(44)');
    await waitFor(P.page, `!!window.__arcade.musicDebug().next`, 'the next song chosen', 8000);
    const nx = String(await ev(P.page, 'window.__arcade.musicDebug().next')).replace(/^m:/, '');
    ok(deck('day').includes(nx) && nx !== first, `NATURAL CHANGE: the next song (${nx}) comes from the DAY deck`);
    await P.ctx.close(); }
  { const P = await open({ slot: 'mu', qs: `when=2026-10-23T20:28:30&speed=20${GR}`, view: [402, 874] });
    const first = await start(P.page);
    ok(deck('evening').includes(first), `PARTY START: evening plays ${first}`);
    await waitFor(P.page, `window.__arcade.mood() === 'party'`, 'the party starting (FP2: 8:30 pm)', 15000);
    await changed(P.page, first, 'the forced switch');
    const now = await ev(P.page, NOW);
    ok(deck('party').includes(now), `PARTY START: 8:30 pm (FP2) switches at once to the PARTY deck (${now}) — the evening song did not have to end`);
    await P.ctx.close(); }
  { const P = await open({ slot: 'mu', qs: `when=2026-10-23T13:00&mood=late${GR}`, view: [402, 874] });
    const id = await start(P.page);
    ok(deck('late').includes(id), `LINK &mood=late at 1 pm plays the LATE NIGHT deck (${id})`);
    await P.ctx.close(); }

  // ---- 4. THE PREVIEW PANEL's MUSIC row: force a mood (the state), SKIP, the song + its grid status
  { const P = await open({ slot: 'mu', qs: `when=2026-10-23T13:00${GR}&panel=1`, view: [402, 874] });
    await waitFor(P.page, '!!window.__district.remote()', 'the panel', 10000);
    const first = await start(P.page);
    await ev(P.page, "window.__district.remote().setMine({ mood: 'party' })");
    await changed(P.page, first, 'the panel forces PARTY');
    const now = await ev(P.page, NOW);
    ok(deck('party').includes(now), `PANEL: MOOD = PARTY plays the party deck (${now}); the chip reads "${await ev(P.page, "document.querySelector('.hr-lbl').textContent")}"`);
    await ev(P.page, 'window.__district.remote().open()');
    await waitFor(P.page, `[...document.querySelectorAll('.hr-h')].some(h => h.textContent === 'MUSIC')`, 'the MUSIC section', 5000);
    const btns = await ev(P.page, `[...[...document.querySelectorAll('.hr-sec')].find(s => s.querySelector('.hr-h').textContent === 'MUSIC').querySelectorAll('.hr-b')].map(b => b.textContent)`);
    ok(btns.join(',') === 'AUTO,MORNING,DAY,EVENING,LATE NIGHT,PARTY,SKIP TO THE NEXT SONG', `PANEL: the MUSIC row (${btns.join(' · ')})`);
    await waitFor(P.page, `document.querySelector('.hr-music') && /GRID/.test(document.querySelector('.hr-music').textContent)`, 'the song line', 5000);
    const txt = await ev(P.page, "document.querySelector('.hr-music').textContent");
    ok(txt.includes(now) && /PLAYING PARTY/.test(txt) && /GRID (TRUSTED|NOT TRUSTED|NONE)/.test(txt), `PANEL: shows the song + its grid status ("${txt}")`);
    if (SHOTS) { await ev(P.page, `window.__district.remote().openCats(['music'])`); await ev(P.page, `[...document.querySelectorAll('.hr-sec')].find(s => s.querySelector('.hr-h').textContent === 'MUSIC').scrollIntoView({ block: 'start' })`); await sleep(400); await P.page.screenshot({ path: `${OUT}music-panel-402x874.png` }); }
    await ev(P.page, `[...document.querySelectorAll('.hr-b')].find(b => b.textContent === 'SKIP TO THE NEXT SONG').click()`);
    await changed(P.page, now, 'SKIP');
    const after = await ev(P.page, NOW);
    ok(deck('party').includes(after), `PANEL: SKIP moves to the next party song (${now} → ${after})`);
    await ev(P.page, 'window.__district.remote().setMine({})');
    await changed(P.page, after, 'AUTO again');
    ok(deck('day').includes(await ev(P.page, NOW)), 'PANEL: clearing the mood goes back to the time of day (DAY)');
    await P.ctx.close(); }

  // ---- 6. THE MUSIC COMES BACK (the owner's iPhone: leaving Safari killed it; the music button didn't help; only a reload did)
  { const els = { fn: () => { window.__els = new Set(); const o = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function () { window.__els.add(this); return o.call(this); }; } };
    const P = await open({ slot: 'mu', qs: `when=2026-10-23T13:00${GR}`, view: [402, 874], init: els });
    const p = P.page;
    const H = () => ev(p, 'window.__arcade.musicDebug().health');
    const cur = () => ev(p, `(() => { const d = window.__arcade.musicDebug(); const v = d.voices.find(x => x.id === d.playing); return { id: d.playing, t: v ? v.t : -1, paused: v ? v.paused : true, ctx: d.health.state }; })()`);
    const vis = v => ev(p, `(() => { Object.defineProperty(document, 'visibilityState', { value: '${v}', configurable: true }); Object.defineProperty(document, 'hidden', { value: ${v === 'hidden'}, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); })()`);
    const PLAYING = `(() => { const d = window.__arcade.musicDebug(); const v = d.voices.find(x => x.id === d.playing); return !!d.playing && d.health.sounding && (d.out === 'direct' || (!!v && !v.paused && d.health.state === 'running')); })()`;
    const playingOn = async (what, ms = 8000) => { try { await waitFor(p, PLAYING, what, ms); return true; } catch { return false; } };
    const first = await start(p);
    await sleep(2500);
    // a) leave the browser + come back (no tap): the same song goes on from where it was
    const a0 = await cur();
    await vis('hidden'); await sleep(1200);
    const hid = await cur();
    ok(hid.paused && hid.ctx === 'suspended', `RESUME: hidden — the song pauses + the context sleeps (${JSON.stringify(hid)})`);
    await vis('visible');
    ok(await playingOn('back on screen'), 'RESUME: back on screen — it plays again with no tap');
    const a1 = await cur();
    ok(a1.id === a0.id && Math.abs(a1.t - a0.t) < 4, `RESUME: the same song (${first}) from the same place (${a0.t} → ${a1.t} s)`);
    // b) iOS won't give the context back (resume refused, "interrupted"): ONE tap anywhere rebuilds it — the same song plays on
    await vis('hidden'); await sleep(400);
    await ev(p, `import('/js/audio/engine.js').then(e => e.simulateStuck('interrupted'))`);
    await vis('visible'); await sleep(1900);
    const sh = await H();
    ok(sh.stuck && !sh.sounding, `STUCK: back on screen, the context won't run (${sh.state}) — marked stuck, waiting for a tap`);
    const b0 = await cur();
    await tapAt(p, 30, 300);
    ok(await playingOn('one tap after a stuck context'), 'STUCK: one tap — a fresh context, the music plays again (no reload)');
    const b1 = await cur(), bh = await H();
    ok(bh.rebuilds === 1 && b1.id === b0.id && Math.abs(b1.t - b0.t) < 4, `STUCK: rebuilt once (${bh.why}); the same song ${b1.id} from ${b0.t} → ${b1.t} s`);
    await ev(p, `import('/js/audio/sfx.js').then(m => m.sfx('tap'))`);
    ok(!errors.some(e => /different audio context|InvalidAccessError/i.test(e)), 'STUCK: the effects follow the new context (no cross-context errors)');
    // c) stuck again — this time the tap is ON THE MUSIC BUTTON: it must end with music playing, never switch the music off
    await vis('hidden'); await sleep(400);
    await ev(p, `import('/js/audio/engine.js').then(e => e.simulateStuck('suspended'))`);
    await vis('visible'); await sleep(1900);
    const mb = await ev(p, `(() => { const r = document.querySelector('.music-btn').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`);
    await tapAt(p, mb[0], mb[1]);
    ok(await playingOn('the music button after a stuck context'), 'MUSIC BUTTON: one tap on it brings the music back');
    ok(await ev(p, `!JSON.parse(localStorage.getItem('na:settings') || '{}').musicOff`), 'MUSIC BUTTON: that tap meant "play" — the music is still ON (not switched off)');
    await sleep(1700);        // (a second tap within 1.5 s of a rescue is part of the same "play")
    await tapAt(p, mb[0], mb[1]); await sleep(300);
    ok(await ev(p, `JSON.parse(localStorage.getItem('na:settings') || '{}').musicOff === true`), 'MUSIC BUTTON: with the music playing, a tap switches it off as before');
    await tapAt(p, mb[0], mb[1]);
    ok(await playingOn('music on again') && await ev(p, `!JSON.parse(localStorage.getItem('na:settings')).musicOff`), 'MUSIC BUTTON: and on again — playing');
    // d) the connection dropped while the phone slept (the element errors): reloaded from its place, never marked "missing"
    const d0 = await cur();
    await ev(p, `(() => { const d = window.__arcade.musicDebug(); const f = String(d.playing).replace(/^m:/, ''); const el = [...window.__els].find(a => a.src.includes(f)); el.dispatchEvent(new Event('error')); })()`);
    await waitFor(p, `/error/.test(window.__arcade.musicDebug().health.last)`, 'the reload after the error', 6000);
    ok(true, 'NETWORK: the error is seen as "reload", not "missing"');
    ok(await playingOn('reloaded after a network error', 9000), 'NETWORK: reloaded + playing again');
    const d1 = await cur(), st = await ev(p, 'window.__arcade.musicDebug().status');
    ok(d1.id === d0.id && st[d0.id] !== 'missing' && Math.abs(d1.t - d0.t) < 6, `NETWORK: the same song (${d0.t} → ${d1.t} s), not marked missing (${st[d0.id]})`);
    // e) the OS pauses the element behind our back (a call, Siri, another app's audio) while we're on screen: the watchdog restarts it
    await ev(p, '[...window.__els].forEach(a => a.pause())');
    ok(await playingOn('the watchdog after an OS pause', 5000), 'OS PAUSE: restarted with no tap');
    // f) the back-forward cache: pagehide → pageshow (no visibilitychange)
    await ev(p, `window.dispatchEvent(new Event('pagehide'))`); await sleep(600);
    const fh = await cur();
    await ev(p, `window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))`);
    ok(fh.paused && await playingOn('after a bfcache restore'), 'BFCACHE: pagehide pauses, pageshow plays again');
    // g) the voice "plays" but nothing comes out (WebKit after the lock screen): seen by the probe, the next tap makes new voices
    const g0 = await cur();
    await ev(p, `import('/js/audio/music.js').then(m => m.musicSimulateDead())`);
    await waitFor(p, 'window.__arcade.musicDebug().health.dead', 'the dead voice seen', 9000);
    await tapAt(p, 30, 300);
    ok(await playingOn('new voices after a dead one'), 'DEAD VOICE: seen by the probe; one tap — new voices, playing');
    const g1 = await cur(), gh = await H();
    ok(g1.id === g0.id && !gh.dead && /new voices/.test(gh.last), `DEAD VOICE: the same song goes on (${g0.id}, ${g0.t} → ${g1.t} s; ${gh.last})`);
    await P.ctx.close(); }

  // ---- 7. iOS's GESTURE RULE, emulated (the owner's iPhone: "the music still doesn't come back, even when I tap"). Chrome here lets
  // anything play; Safari only lets a media element / an AudioContext START inside touchend / click / keydown (a touch's pointerdown is
  // NOT a gesture there). This page refuses play() and resume() outside those — the engine must still bring the music back in ONE tap.
  { const iosRule = { fn: () => {
      let g = 0;
      const gesture = e => { if ((e.type === 'pointerdown' || e.type === 'mousedown') && e.pointerType !== 'mouse' && e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return; if (e.type === 'pointerdown' && e.pointerType !== 'mouse') return; g++; setTimeout(() => { g--; }, 0); };
      for (const t of ['touchend', 'click', 'keydown', 'pointerdown']) window.addEventListener(t, gesture, { capture: true });
      const okEl = new WeakSet(), okCtx = new WeakSet();
      window.__iosRefused = 0;
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () {
        if (g > 0) okEl.add(this);
        if (!okEl.has(this)) { window.__iosRefused++; return Promise.reject(new DOMException('not in a gesture (emulated iOS)', 'NotAllowedError')); }
        return play.call(this);
      };
      const AC = window.AudioContext, resume = AC.prototype.resume;
      AC.prototype.resume = function () { if (g > 0) okCtx.add(this); return okCtx.has(this) ? resume.call(this) : new Promise(() => {}); };
      window.AudioContext = class extends AC { constructor(o) { super(o); if (g > 0) okCtx.add(this); else AC.prototype.suspend.call(this); } };
    } };
    const P = await open({ slot: 'mu', qs: `when=2026-10-23T13:00${GR}&debug=1`, view: [402, 874], init: iosRule });
    const p = P.page;
    const vis = v => ev(p, `(() => { Object.defineProperty(document, 'visibilityState', { value: '${v}', configurable: true }); Object.defineProperty(document, 'hidden', { value: ${v === 'hidden'}, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); })()`);
    const PLAYING = `(() => { const d = window.__arcade.musicDebug(); const v = d.voices.find(x => x.id === d.playing); return !!d.playing && d.health.sounding && (d.out === 'direct' || (!!v && !v.paused && d.health.state === 'running')); })()`;
    const playingOn = async (what, ms = 6000) => { try { await waitFor(p, PLAYING, what, ms); return true; } catch { return false; } };
    await tapAt(p, 30, 300);
    ok(await playingOn('iOS rule: the first tap'), 'iOS RULE: the FIRST tap starts the music (play() + resume() only count inside touchend / click)');
    // stuck after leaving Safari + ONE tap anywhere
    await vis('hidden'); await sleep(400);
    await ev(p, `import('/js/audio/engine.js').then(e => e.simulateStuck('interrupted'))`);
    await vis('visible'); await sleep(1900);
    await tapAt(p, 30, 300);
    ok(await playingOn('iOS rule: one tap after a stuck context'), `iOS RULE: stuck after leaving Safari — ONE tap brings it back (${JSON.stringify(await ev(p, 'window.__arcade.musicDebug().health'))})`);
    // stuck + the tap is on the MUSIC BUTTON: music, never a silent "MUSIC ON"
    await vis('hidden'); await sleep(400);
    await ev(p, `import('/js/audio/engine.js').then(e => e.simulateStuck('interrupted'))`);
    await vis('visible'); await sleep(1900);
    const mb = await ev(p, `(() => { const r = document.querySelector('.music-btn').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`);
    ok(await ev(p, `!!document.elementFromPoint(${mb[0]}, ${mb[1]}).closest('.music-btn')`), 'iOS RULE: the tap lands on the music button itself (the AUDIO block keeps clear of it)');
    await tapAt(p, mb[0], mb[1]);
    ok(await playingOn('iOS rule: the music button') && await ev(p, `!JSON.parse(localStorage.getItem('na:settings') || '{}').musicOff`), 'iOS RULE: stuck — one tap on the MUSIC BUTTON plays (and leaves it ON)');
    // a FROZEN context: it says "running" but its clock has stopped (a WebKit bug after the background) — seen; ONE tap gives music
    // (M4: through the direct element if it is armed, else a rebuilt context), the tap rebuilds the context; a tap once the new one
    // has run for 2 s has the song on a voice through the graph (its fades, the kick listener). (§8 covers the no-tap case.)
    const f0 = await ev(p, 'window.__arcade.musicDebug().at');
    await ev(p, `import('/js/audio/engine.js').then(e => e.simulateFrozen())`);
    await waitFor(p, 'window.__arcade.musicDebug().health.frozen', 'the frozen clock seen', 6000).catch(() => {});
    const fz = await ev(p, 'window.__arcade.musicDebug().health');
    ok(fz.frozen, `FROZEN: a "running" context whose clock stopped is seen (${fz.state}, frozen ${fz.frozen})`);
    await tapAt(p, 30, 300);
    ok(await playingOn('iOS rule: one tap after a frozen clock', 3000), `FROZEN: one tap — music (${JSON.stringify(await ev(p, '(() => { const d = window.__arcade.musicDebug(); return { out: d.out, at: d.at, rebuilds: d.health.rebuilds, last: d.health.last }; })()'))}, was at ${f0} s)`);
    // (this context was itself born of a rebuild seconds ago: the tap makes NO third one within 20 s — the loop her readout showed — the
    // direct element carries the music meanwhile; §8 has the way back onto a voice once a context's clock runs)
    const fr = await ev(p, 'window.__arcade.musicDebug().health.rebuilds');
    await sleep(1500); await tapAt(p, 30, 300); await sleep(600);
    const fh = await ev(p, '(() => { const d = window.__arcade.musicDebug(); return { out: d.out, rebuilds: d.health.rebuilds, sounding: d.health.sounding, last: d.health.last }; })()');
    ok(fh.rebuilds === fr && fh.out === 'direct' && fh.sounding, `FROZEN: a rebuilt context that froze is not rebuilt again within 20 s (rebuilds ${fr} → ${fh.rebuilds}); the direct element plays on (${fh.out}, sounding ${fh.sounding})`);
    // the readout's AUDIO block (&debug=1): states + the last events, so one screenshot after the bug says where it died
    await sleep(700);
    const diag = await ev(p, `(() => { const d = document.querySelector('.ad-diag'); return d ? d.textContent : ''; })()`);
    ok(/ctx running/.test(diag) && /el .*playing/.test(diag) && /touchend|click/.test(diag) && /rebuild/.test(diag), `DIAGNOSTIC: the AUDIO block shows the context, the element + the events ("${diag.slice(0, 160)}…")`);
    if (SHOTS) await p.screenshot({ path: `${OUT}music-diag-402x874.png` });
    await P.ctx.close(); }

  // ---- 8. THE EVIDENCE (M4 — the owner's iPhone, Oct 23, after leaving the app and coming back): every NEW AudioContext, made inside a
  // real touchend, says 'running' (resume ok) and its clock NEVER moves (0.00), the song element plays on (its clock advancing), the
  // probe hears nothing — six rebuilds, none ever started. Emulated on §7's gesture rule: once __deadGraph is on, every new context's
  // clock reads 0 for ever (the real one runs underneath); navigator.audioSession is given (iOS 17+). Expected: the music through the
  // DIRECT element within ~2 s of coming back (one tap or none), ONE rebuild, no loop; the session type 'playback' with the music on,
  // 'ambient' off; back onto a voice once a context's clock really runs; the AUDIO panel saying all of it.
  { const evidence = { fn: () => {
      let g = 0;
      const gesture = e => { if (e.type === 'pointerdown' && e.pointerType !== 'mouse') return; g++; setTimeout(() => { g--; }, 0); };
      for (const t of ['touchend', 'click', 'keydown', 'pointerdown']) window.addEventListener(t, gesture, { capture: true });
      const okEl = new WeakSet(), okCtx = new WeakSet();
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () {
        if (g > 0) okEl.add(this);
        if (!okEl.has(this)) return Promise.reject(new DOMException('not in a gesture (emulated iOS)', 'NotAllowedError'));
        return play.call(this);
      };
      const AC = window.AudioContext, resume = AC.prototype.resume;
      const realTime = Object.getOwnPropertyDescriptor(BaseAudioContext.prototype, 'currentTime').get;
      window.__deadGraph = false; window.__contexts = 0;
      AC.prototype.resume = function () { if (g > 0) okCtx.add(this); return okCtx.has(this) ? resume.call(this) : new Promise(() => {}); };
      window.AudioContext = class extends AC { constructor(o) {
        super(o); window.__contexts++;
        if (g > 0) okCtx.add(this); else AC.prototype.suspend.call(this);
        // the evidence: a context born while the session is dead renders nothing, ever — its clock stays at 0.00 (while 'running')
        if (window.__deadGraph) { const me = this; Object.defineProperty(this, 'currentTime', { get: () => (window.__deadGraph ? 0 : realTime.call(me)), configurable: true }); }
      } };
      const session = { type: 'auto', state: 'active', log: [], addEventListener() {} };
      Object.defineProperty(navigator, 'audioSession', { get: () => session, configurable: true });
      const t = Object.getOwnPropertyDescriptor(session, 'type');
      let type = 'auto';
      Object.defineProperty(session, 'type', { get: () => type, set: v => { type = v; session.log.push(v); }, configurable: true });
      void t;
    } };
    const P = await open({ slot: 'mu', qs: `when=2026-10-23T13:00${GR}&debug=1`, view: [402, 874], init: evidence });
    const p = P.page;
    const vis = v => ev(p, `(() => { Object.defineProperty(document, 'visibilityState', { value: '${v}', configurable: true }); Object.defineProperty(document, 'hidden', { value: ${v === 'hidden'}, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); })()`);
    const D = () => ev(p, `(() => { const d = window.__arcade.musicDebug(); return { id: d.playing, at: d.at, out: d.out, sounding: d.health.sounding, rebuilds: d.health.rebuilds, frozen: d.health.frozen, alive: d.health.alive, made: d.health.made, time: d.health.time, last: d.health.last, session: navigator.audioSession.type, set: d.health.sessionSet.type, contexts: window.__contexts }; })()`);
    const SOUND = `(() => { const d = window.__arcade.musicDebug(); return !!d.playing && d.health.sounding; })()`;
    await tapAt(p, 30, 300);
    await waitFor(p, SOUND, 'the first song', 25000);
    const e0 = await D();
    ok(e0.out === 'web' && e0.session === 'playback' && e0.set === 'playback', `EVIDENCE: music on, through the graph; the audio session asked for 'playback' before the context was made (session ${e0.session}, set ${e0.set})`);
    await sleep(2000);
    // leave: the old context's clock stops; the session is dead for every context made from now on
    const a0 = await D();
    await vis('hidden'); await sleep(400);
    await ev(p, `import('/js/audio/engine.js').then(e => e.simulateFrozen())`);
    await ev(p, 'window.__deadGraph = true');
    await vis('visible');
    // a tap (the owner's first tap, a moment after coming back): the old clock, seen stopped AT THE TAP → the direct element inside it;
    // the tap rebuilds the context; the new one never starts (its clock 0.00) — seen within a second, no second rebuild
    await sleep(800); await tapAt(p, 30, 300);
    const t0 = Date.now();
    ok(await waitFor(p, `${SOUND} && window.__arcade.musicDebug().out === 'direct'`, 'the direct element', 4000).catch(() => false), `EVIDENCE: back + one tap — the music sounds through the DIRECT element within ${((Date.now() - t0) / 1000).toFixed(1)} s (${JSON.stringify(await D())})`);
    const a1 = await D();
    ok(a1.id === a0.id && Math.abs(a1.at - a0.at) < 5, `EVIDENCE: the same song (${a0.id}) from its place (${a0.at} → ${a1.at} s)`);
    await waitFor(p, 'window.__arcade.musicDebug().health.frozen && window.__arcade.musicDebug().health.rebuilds >= 1', 'the rebuilt context seen frozen', 4000).catch(() => {});
    const a2 = await D();
    ok(a2.rebuilds === 1 && a2.frozen && a2.time === 0, `EVIDENCE: the tap rebuilt ONCE; the new context never started (t ${a2.time}, frozen ${a2.frozen}) — seen within a second, not 1.5 s`);
    // a second tap 2 s later (the owner's, 8 s later): NO new context — the direct element keeps playing
    await sleep(2000); await tapAt(p, 30, 300); await sleep(800);
    const a3 = await D();
    ok(a3.rebuilds === 1 && a3.out === 'direct' && a3.sounding && a3.at > a1.at, `EVIDENCE: a second tap makes no third context (rebuilds ${a3.rebuilds}, contexts made ${a3.contexts}); still sounding, direct, the song advancing (${a1.at} → ${a3.at} s)`);
    ok(a3.alive <= 2, `EVIDENCE: the old contexts are closed (alive ${a3.alive}, made ${a3.made})`);
    // the panel says it
    const diag = await ev(p, `(() => { const d = document.querySelector('.ad-diag'); return d ? d.textContent : ''; })()`);
    ok(/out DIRECT ELEMENT/.test(diag) && /alive \d/.test(diag) && /set playback at/.test(diag) && /FROZEN/.test(diag), `PANEL: the AUDIO block shows the output path, the contexts alive, the session type set + the frozen clock ("${diag.slice(0, 200)}…")`);
    // the music button on the direct path: OFF mutes it (+ the session goes 'ambient'); ON again plays (+ 'playback')
    const mb = await ev(p, `(() => { const r = document.querySelector('.music-btn').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`);
    await sleep(1600);        // (a tap within 1.5 s of a rescue is part of the same "play")
    await tapAt(p, mb[0], mb[1]); await sleep(500);
    const off = await ev(p, `import('/js/audio/music.js').then(m => ({ off: JSON.parse(localStorage.getItem('na:settings') || '{}').musicOff, gain: m.musicDiag().el.gain, session: navigator.audioSession.type }))`);
    ok(off.off === true && off.gain === 0 && off.session === 'ambient', `MUSIC BUTTON on the direct path: OFF (${off.off}, the element muted: gain ${off.gain}) — the session back to 'ambient' (${off.session})`);
    await tapAt(p, mb[0], mb[1]);
    ok(await waitFor(p, `${SOUND} && !JSON.parse(localStorage.getItem('na:settings')).musicOff && navigator.audioSession.type === 'playback'`, 'music on again', 4000).catch(() => false), `MUSIC BUTTON on the direct path: ON again — sounding, 'playback' (${JSON.stringify(await D())})`);
    // the session comes back (the direct element's playback re-activated it): the rebuilt context's clock starts moving → back onto a voice at a tap
    await ev(p, 'window.__deadGraph = false');
    await waitFor(p, 'window.__arcade.musicDebug().health.ok', 'the graph seen running for 2 s', 6000).catch(() => {});
    const b0 = await D();
    await tapAt(p, 30, 300);
    ok(await waitFor(p, `${SOUND} && window.__arcade.musicDebug().out === 'web'`, 'back to web audio', 5000).catch(() => false), `RECOVERY: the clock moving again for 2 s + one tap — the song back on a voice through the graph (${JSON.stringify(await D())})`);
    const b1 = await D();
    ok(b1.id === b0.id && Math.abs(b1.at - b0.at) < 4 && b1.rebuilds === 1, `RECOVERY: the same song from its place (${b0.at} → ${b1.at} s), no extra context`);
    if (SHOTS) await p.screenshot({ path: `${OUT}music-evidence-402x874.png` });
    await P.ctx.close();

  // ---- 9. 7a — THE BEAT IN DIRECT MODE (the owner, iPhone: back from the home screen the music plays on the direct element, but the
  // city's lights no longer pulse). §8's dead graph on a PARTY NIGHT, plus what a frozen graph's analyser really does: it keeps its LAST
  // window (the music that was playing when it froze) — a steady RMS the kick listener read as "live, no kicks" = a breakdown, calm.
  // Expected: with no tap (the direct element takes over by itself) and after a tap (the rebuilt context, dead too) the beat follows the
  // song's GRID on the direct element's clock ('direct-grid'), punching as hard as before; an untrusted song a gentle pulse ('tempo').
    const stale = { fn: () => {
      const AN = AnalyserNode.prototype, gf = AN.getFloatTimeDomainData, last = new WeakMap();
      AN.getFloatTimeDomainData = function (a) { const s = last.get(this); if (window.__deadGraph && s) { a.set(s); return; } gf.call(this, a); if (!window.__deadGraph) last.set(this, Float32Array.from(a)); };
    } };
    const Q = await open({ slot: 'mu', qs: `when=2026-10-24T23:00${GR}&debug=1`, view: [402, 874], init: { fn: new Function(`(${evidence.fn})(); (${stale.fn})();`) } });
    const q = Q.page;
    const PUNCH = ms => ev(q, `new Promise(res => { let lo = 9, hi = 0; const t0 = performance.now(); const tick = () => { const v = window.__district.party().punch; lo = Math.min(lo, v); hi = Math.max(hi, v); if (performance.now() - t0 < ${ms}) requestAnimationFrame(tick); else res({ lo: +lo.toFixed(3), hi: +hi.toFixed(3), src: window.__district.party().src, level: window.__district.party().level, live: window.__district.party().live, line: window.__district.harbor().beatLine, out: window.__arcade.musicDebug().out }); }; requestAnimationFrame(tick); })`);
    const qvis = v => ev(q, `(() => { Object.defineProperty(document, 'visibilityState', { value: '${v}', configurable: true }); Object.defineProperty(document, 'hidden', { value: ${v === 'hidden'}, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); })()`);
    // THE PANEL'S ONE STATUS (the owner: its header said "sounding" over a row saying "sounding NO · locked (no tap yet)"): the header
    // and the want row print the same verdict — before the first tap LOCKED, after it sounding
    const PANEL = () => ev(q, `(() => { const h = document.querySelector('.ad-diag .ad-h'), w = [...document.querySelectorAll('.ad-diag .ad-body div')].find(d => d.textContent.startsWith('want ')); return { h: h ? h.textContent : '', w: w ? w.textContent : '' }; })()`);
    await waitFor(q, `!!document.querySelector('.ad-diag .ad-h')`, 'the AUDIO panel', 8000).catch(() => {});
    await sleep(600);
    const pn0 = await PANEL();
    ok(/LOCKED \(no tap yet\)/.test(pn0.h) && /LOCKED \(no tap yet\)/.test(pn0.w) && !/sounding/.test(pn0.h + pn0.w), `PANEL before a tap: the header + the want row agree — LOCKED ("${pn0.h.replace(/ · \d\d:\d\d:\d\d$/, '')}" / "${pn0.w}")`);
    await tapAt(q, 30, 300);
    await waitFor(q, `(() => { const d = window.__arcade.musicDebug(); return !!d.playing && d.health.sounding; })()`, 'the party song', 25000);
    await waitFor(q, 'window.__district.party().on > 0.5', 'the party on', 25000);
    // whichever song the deck dealt: trusted for this part (the grid), untrusted below (the tempo)
    const sid = await ev(q, NOW);
    const sg = songs.songs[sid].grid;
    await ev(q, `import('/js/audio/mood.js').then(m => { const g = m.moodData().songs['${sid}'].grid; delete g.trusted; g.agree = 0.9; })`);
    await sleep(600);
    const pn1 = await PANEL();
    ok(/ sounding · ctx/.test(pn1.h) && / · sounding · heals/.test(pn1.w), `PANEL playing: the header + the want row both say sounding ("${pn1.h.replace(/ · \d\d:\d\d:\d\d$/, '')}" / "${pn1.w}")`);
    const before = await PUNCH(2600);
    ok(before.out === 'web' && before.src === 'grid' && before.hi - before.lo > 0.5, `DIRECT BEAT: before leaving, through the graph — '${before.src}', the punch ${before.lo} → ${before.hi} (${sid}, "${before.line}")`);
    await qvis('hidden'); await sleep(400);
    await ev(q, `import('/js/audio/engine.js').then(e => e.simulateFrozen())`);
    await ev(q, 'window.__deadGraph = true');
    await qvis('visible');
    // no tap: the direct element takes the song by itself (armed in the first tap); the old context's analyser repeats its last window
    ok(await waitFor(q, `window.__arcade.musicDebug().out === 'direct' && window.__arcade.musicDebug().health.sounding`, 'the direct element (no tap)', 6000).catch(() => false), 'DIRECT BEAT: back, no tap — the song on the direct element');
    await sleep(2500);    // (past the listener's 2 s "live" window: the stale analyser would have calmed it by now)
    const d1 = await PUNCH(2600);
    ok(d1.src === 'direct-grid' && d1.hi - d1.lo > 0.5 && d1.hi > before.hi * 0.8 && !d1.live, `DIRECT BEAT (no tap): '${d1.src}', the punch still swings ${d1.lo} → ${d1.hi} (before ${before.hi}), level ${d1.level}, the dead listener ignored (live ${d1.live})`);
    ok(/^beat direct-grid \d+\.\d · bar \d+ · [1-4]\/4 · drift [+−]\d+ ms · pulse \d\.\d\d$/.test(d1.line || ''), `READOUT: the beat line says direct-grid ("${d1.line}")`);
    const pn2 = await PANEL();
    ok(/ sounding DIRECT · ctx/.test(pn2.h) && / · sounding DIRECT · heals/.test(pn2.w), `PANEL on the direct element: the header + the want row both say sounding DIRECT ("${pn2.h.replace(/ · \d\d:\d\d:\d\d$/, '')}" / "${pn2.w}")`);
    // a tap: the context rebuilt (dead too — its clock 0.00); still the grid on the direct element
    await tapAt(q, 30, 300);
    await waitFor(q, 'window.__arcade.musicDebug().health.rebuilds >= 1 && window.__arcade.musicDebug().health.frozen', 'the rebuilt context seen frozen', 4000).catch(() => {});
    await sleep(2500);
    const d2 = await PUNCH(2600);
    ok(d2.out === 'direct' && d2.src === 'direct-grid' && d2.hi - d2.lo > 0.5, `DIRECT BEAT (after a tap, the rebuilt context dead too): '${d2.src}', the punch ${d2.lo} → ${d2.hi}`);
    // the bars land where the grid says on the direct element's clock (beat 0 mod 4 = a downbeat)
    const ph = await ev(q, `(() => { const b = window.__arcade.beat(), p = window.__district.party(); const g = b.grid; const k = (b.pos - (g.t0 || 0)) * g.bpm / 60 - (g.down || 0); let d = ((k - p.beatsF) % 4 + 4) % 4; return { d: Math.min(d, 4 - d), direct: b.direct }; })()`);
    ok(ph.direct && ph.d < 0.15, `DIRECT BEAT: on the grid's bars on the direct element's clock (${ph.d.toFixed(3)} beats off)`);
    // an untrusted song (party3's kind) on the direct element: a gentle steady pulse at its tempo
    await ev(q, `import('/js/audio/mood.js').then(m => { m.moodData().songs['${sid}'].grid.trusted = false; })`);
    await sleep(1500);
    const d3 = await PUNCH(3000);
    const bpmNow = await ev(q, 'window.__district.party().bpm');
    ok(d3.src === 'tempo' && Math.abs(bpmNow - songs.songs[sid].bpm) < 0.5 && d3.hi - d3.lo > 0.3 && d3.hi < d2.hi, `DIRECT BEAT (untrusted grid): '${d3.src}' at ${bpmNow} bpm (the song's ${songs.songs[sid].bpm}), a gentler pulse ${d3.lo} → ${d3.hi} ("${d3.line}")`);
    void sg;
    if (SHOTS) await q.screenshot({ path: `${OUT}music-direct-beat-402x874.png` });
    await Q.ctx.close(); }

  // ---- 10. 8a — THE PULSE COMES BACK (the owner's iPhone after 7a: back from the home screen Web Audio recovered — the AUDIO panel
  // live — but the city's lights didn't pulse; the readout's beat line is drawn by the city's loop, so it froze with it). The loop had
  // one way back (a visibilitychange to 'visible' while it thought it was stopped). Emulated here: WebKit dropping the pending rAF
  // across the suspension with the hidden event missed (the loop "running" with no frame coming), a return with no event at all, a
  // page restored with only a pageshow, and the plain return. Expected: the watchdog / the events restart it; the punch swings
  // again; the readout's pulse; the AUDIO panel's city row. + PULSE STRENGTH live through JUST ME.
  { const drop = { fn: () => {
      const raf = window.requestAnimationFrame.bind(window);
      window.__suspend = false;
      window.__raf = { ran: 0, dropped: 0 };
      window.requestAnimationFrame = cb => raf(ts => { if (!window.__suspend) { window.__raf.ran++; cb(ts); } else window.__raf.dropped++; });     // (suspended: the callback is dropped, never run)
    } };
    const R = await open({ slot: 'mu', qs: `when=2026-10-24T23:00${GR}&debug=1`, view: [402, 874], init: drop });
    const r = R.page;
    const PUNCH = ms => ev(r, `new Promise(res => { let lo = 9, hi = 0, n = 0, gap = 0, lt = 0; const t0 = performance.now(); const tick = () => { const tn = performance.now(); n++; if (lt) gap = Math.max(gap, tn - lt); lt = tn; const v = window.__district.party().punch; lo = Math.min(lo, v); hi = Math.max(hi, v); if (performance.now() - t0 < ${ms}) requestAnimationFrame(tick); else res({ lo: +lo.toFixed(3), hi: +hi.toFixed(3), n, gap: Math.round(gap), line: window.__district.harbor().beatLine, loop: window.__district.loop() }); }; requestAnimationFrame(tick); })`);
    const setVis = v => ev(r, `(() => { Object.defineProperty(document, 'visibilityState', { value: '${v}', configurable: true }); Object.defineProperty(document, 'hidden', { value: ${v === 'hidden'}, configurable: true }); })()`);
    // (headless Chrome here can sit seconds without serving a rAF once a page stopped drawing — a frame nudge after each return; an
    // iPhone runs rAF at the display's rate, and the city's own watchdog is what this section tests)
    const nudge = () => r.screenshot({ type: 'jpeg', quality: 10, clip: { x: 0, y: 0, width: 8, height: 8 } }).catch(() => {});
    const fire = async t => { await ev(r, t === 'pageshow' ? `window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))` : `document.dispatchEvent(new Event('visibilitychange'))`); await nudge(); };
    await tapAt(r, 30, 300);
    await waitFor(r, `(() => { const d = window.__arcade.musicDebug(); return !!d.playing && d.health.sounding; })()`, 'the party song', 25000);
    await waitFor(r, 'window.__district.party().on > 0.5', 'the party on', 25000);
    await sleep(800);
    const p0 = await PUNCH(2600);
    ok(p0.hi - p0.lo > 0.5 && / · pulse (0\.[3-9]|[12]\.)\d*/.test(p0.line || ''), `RETURN: before leaving the punch swings ${p0.lo} → ${p0.hi}; the readout's beat line carries the pulse ("${p0.line}")`);
    // (a) the plain return: hidden → visible (the loop stops, the 'visible' event restarts it)
    await setVis('hidden'); await fire('vis'); await sleep(600);
    const l1 = await ev(r, 'window.__district.loop()');
    await setVis('visible'); await fire('vis'); await sleep(900);
    const p1 = await PUNCH(2600);
    ok(!l1.running && p1.loop.running && p1.loop.restarts >= 1 && p1.loop.drawn > l1.drawn + 20, `RETURN (plain): stopped while hidden, restarted by 'visible' (${JSON.stringify(p1.loop)})`);
    okT(p1.hi - p1.lo > 0.5, `RETURN (plain): the punch swings again ${p1.lo} → ${p1.hi}`);
    // THE BEAT-SYNC PASS — a return never costs a tier: the first seconds back are held out of the tiering (RETURN_GRACE), the frame window emptied
    { const ti = await ev(r, 'window.__district.tiering()');
      ok(ti.returns >= 1 && ti.hist.length === 1 && ti.hist[0] === ti.tier, `RETURN never costs a tier: still t${ti.tier} (${ti.hist.join('→')}; ${ti.returns} return(s) seen, the grace ${ti.holdMs} ms left)`); }
    // (b) iOS: the hidden event missed + the pending rAF dropped across the suspension — "running", no frame ever coming
    const d0 = (await ev(r, 'window.__district.loop()')).drawn;
    await ev(r, 'window.__suspend = true'); await sleep(2600);
    const l2 = await ev(r, 'window.__district.loop()');
    ok(l2.running && l2.drawn <= d0 + 2 && l2.stalls >= 1, `RETURN (rAF dropped): "running" yet not one frame drawn in 2.6 s (${d0} → ${l2.drawn}) — the old loop's dead end (start() saw running and did nothing); the watchdog saw it stall (${l2.stalls})`);
    await ev(r, 'window.__suspend = false'); await fire('vis');
    await sleep(900);
    const p2 = await PUNCH(2600);
    ok(p2.loop.running && p2.loop.drawn > l2.drawn + 20 && ['visible', 'watchdog'].includes(p2.loop.why) && p2.loop.stalls >= 2 && p2.hi - p2.lo > 0.5 && p2.hi > p0.hi * 0.7, `RETURN (rAF dropped): restarted (${JSON.stringify(p2.loop)} · rAF ${JSON.stringify(await ev(r, 'window.__raf'))} · suspend ${await ev(r, 'window.__suspend')} · ticks ${p2.n}, max gap ${p2.gap} ms), the punch swings again ${p2.lo} → ${p2.hi} (before ${p0.hi})`);
    // (b2) the same with NO event at all on return: the watchdog (once a second) finds it
    await ev(r, 'window.__suspend = true'); await sleep(2000); await ev(r, 'window.__suspend = false'); await nudge();
    ok(await waitFor(r, `window.__district.loop().ago < 300 && window.__district.loop().why === 'watchdog'`, 'the watchdog', 4500).catch(() => false), `RETURN (no event): the watchdog restarts it (${JSON.stringify(await ev(r, 'window.__district.loop()'))})`);
    // (c) a page restored with only a pageshow (no visibilitychange): hidden fired, the return didn't
    await setVis('hidden'); await fire('vis'); await sleep(500);
    await setVis('visible'); await fire('pageshow');
    ok(await waitFor(r, `window.__district.loop().running && window.__district.loop().ago < 300`, 'pageshow', 2000).catch(() => false), `RETURN (pageshow only): running again (${JSON.stringify(await ev(r, 'window.__district.loop()'))})`);
    const p3 = await PUNCH(2000);
    ok(p3.hi - p3.lo > 0.5, `RETURN (pageshow only): the punch ${p3.lo} → ${p3.hi}`);
    // the AUDIO panel (the DOM, live while the canvas froze) names the loop
    await sleep(600);
    const row = await ev(r, `(() => { const d = [...document.querySelectorAll('.ad-diag .ad-body div')].find(x => x.textContent.startsWith('city ')); return d ? d.textContent : ''; })()`);
    ok(/^city running · last frame 0\.\d s ago · restarts \d+/.test(row), `PANEL: the AUDIO block shows the city's loop ("${row}")`);
    // PULSE STRENGTH, live (JUST ME's flag through the scene): 250 % punches clearly harder than 50 %, the cap holds
    const at = async v => { await ev(r, `window.__district.remote() && window.__district.remote().setMine(${v == null ? '{}' : `{ pulse: ${v} }`})`); await sleep(400); return PUNCH(2600); };
    const hasRemote = await waitFor(r, '!!window.__district.remote()', 'the panel', 8000).catch(() => false);
    if (hasRemote) {
      const lo = await at(50), hi = await at(250);
      const pl = await ev(r, 'window.__district.party().pulse');
      ok(hi.hi > lo.hi * 1.6 && hi.hi < 2.05 && pl === 2.5 && / ×2\.50/.test(hi.line || ''), `PULSE STRENGTH: 50 % peaks ${lo.hi}, 250 % ${hi.hi} (under the cap 2), the readout says ×2.50 ("${hi.line}")`);
      await at(null);
      ok((await ev(r, 'window.__district.party().pulse')) === 1.75, 'PULSE STRENGTH: cleared → the default 175 %');
    } else ok(false, 'PULSE STRENGTH: the preview panel module loaded');
    await R.ctx.close(); }

  // ---- 11. FP — THE SONG CLOCK (the owner, iPhone: after the home screen "the lights pulse to random beats"). The beat's position must
  // come from the SONG (the element's currentTime), re-anchored whenever the song and the frame clock can part: the element paused while
  // the context runs on, the context suspended while the element plays on, a seek. Expected after each: the lights' beat (party().beatsF)
  // on the element's grid position within a frame or two, the readout's beat line with the song's bar + `drift`, the clock line.
  { const F = await open({ slot: 'mu', qs: `when=2026-10-24T23:00${GR}&debug=1`, view: [402, 874] });
    const f = F.page;
    await tapAt(f, 30, 300);
    await waitFor(f, `(() => { const d = window.__arcade.musicDebug(); return !!d.playing && d.health.sounding; })()`, 'the party song', 25000);
    await waitFor(f, 'window.__district.party().on > 0.5', 'the party on', 25000);
    const fid = await ev(f, NOW);
    await ev(f, `import('/js/audio/mood.js').then(m => { const g = m.moodData().songs['${fid}'].grid; delete g.trusted; g.agree = 0.9; })`);
    // the lights vs the element, sampled inside a frame: the element's clock → the grid's beat; the lights' beats; the readout
    const PHASE = () => ev(f, `import('/js/audio/music.js').then(m => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(() => {
      const np = m.nowPlaying(), b = window.__arcade.beat(), p = window.__district.party(), hb = window.__district.harbor();
      if (!np || !b || !b.grid) return res(null);
      const g = b.grid, k = (b.pos - (g.t0 || 0)) * g.bpm / 60 - (g.down || 0);
      let d = ((k - p.beatsF) % 4 + 4) % 4; d = Math.min(d, 4 - d);
      res({ d: +d.toFixed(3), lag: +(np.at - b.pos).toFixed(3), src: p.src, line: hb.beatLine, clock: hb.clock });
    }))))`);
    await sleep(1500);
    const f0 = await PHASE();
    ok(f0 && f0.src === 'grid' && f0.d < 0.12 && f0.lag >= 0 && f0.lag < 0.5, `SONG CLOCK: playing — the lights on the element's grid (${f0 && f0.d} beats off; the element − heard ${f0 && f0.lag} s)`);
    ok(/ · bar \d+ · [1-4]\/4 · drift [+−]\d+ ms · pulse /.test((f0 && f0.line) || '') && /^clock el [+−]\d+ ms · anchors \d+/.test((f0 && f0.clock) || ''), `READOUT: the beat line has the song's bar + drift ("${f0 && f0.line}"), the clock line ("${f0 && f0.clock}")`);
    // (a) the ELEMENT paused for 2 s while the context runs on, then played again
    await ev(f, `import('/js/audio/music.js').then(m => { const np = m.nowPlaying(); window.__pausedEl = np && np.el; if (window.__pausedEl) window.__pausedEl.pause(); })`);
    await sleep(2000);
    await ev(f, 'window.__pausedEl && window.__pausedEl.play().catch(() => {})');
    await waitFor(f, `(() => { const d = window.__arcade.musicDebug(); return !!d.playing && d.health.sounding; })()`, 'playing again', 8000).catch(() => {});
    await sleep(500);
    const f1 = await PHASE();
    ok(f1 && f1.d < 0.12, `SONG CLOCK: the element paused 2 s (the context running on) → back on its grid (${f1 && f1.d} beats off, "${f1 && f1.clock}")`);
    // (b) the CONTEXT suspended for 2 s while the element plays on, then resumed
    await ev(f, `import('/js/audio/engine.js').then(e => e.getContext().suspend())`);
    await sleep(2000);
    await ev(f, `import('/js/audio/engine.js').then(e => e.getContext().resume())`);
    await sleep(500);
    const f2 = await PHASE();
    ok(f2 && f2.d < 0.12, `SONG CLOCK: the context suspended 2 s (the element on) → the lights on the element's grid (${f2 && f2.d} beats off, "${f2 && f2.clock}")`);
    // (c) a seek of 17.3 s with no event the clock is told about (a reading jump)
    await ev(f, `import('/js/audio/music.js').then(m => { const np = m.nowPlaying(); if (np) np.el.currentTime = np.at + 17.3; })`);
    await sleep(600);
    const f3 = await PHASE();
    ok(f3 && f3.d < 0.12, `SONG CLOCK: a 17 s seek → re-locked (${f3 && f3.d} beats off, "${f3 && f3.clock}")`);
    await F.ctx.close(); }

  // ---- 5. City 1.0 (no flag) is untouched: its own decks, and the same setting
  { const P = await open({ slot: 'mu', qs: 'when=2026-10-22T13:00&tz=America/Detroit', view: [402, 874], city: false });
    const id = await start(P.page);
    ok(songs.moods.day.includes(id) && !songs.songs[id].c2, `CITY 1.0: 1 pm plays its own DAY deck (${id}), none of the owner's c2 songs`);
    await setMood(P.page, 'party');
    await changed(P.page, id, 'City 1.0 forced');
    const p2 = await ev(P.page, NOW);
    ok(songs.moods.party.includes(p2) && !songs.songs[p2].c2, `CITY 1.0: the setting PARTY plays City 1.0's party deck (${p2})`);
    await P.ctx.close(); }
});

// ================================================================ PART 7a — THE SPEAKEASY (ONLY=speakeasy)
G('speakeasy', async () => {
  // a pixel of the main canvas (pt), after the scene drew; a window's centre
  const px = (p, X, Y) => ev(p, `new Promise(res => requestAnimationFrame(() => { const cv = document.querySelector('.nd-scene canvas'), k = cv.width / cv.clientWidth; res(Array.from(cv.getContext('2d').getImageData(Math.round(${X} * k), Math.round(${Y} * k), 1, 1).data).slice(0, 3)); }))`);
  const settle = p => waitFor(p, '!window.__district.harbor().pending && !window.__district.harbor().fading', 'settled', 20000);
  // ---- the night: the rooms lit, the edge windows half cut, the blade sign (the corner as it is), the knock's door unchanged
  { const Q = await open({ slot: 'sp1', qs: NIGHT, view: [402, 874] });
    await harborUp(Q.page); await settle(Q.page);
    await waitFor(Q.page, 'window.__district.harbor().speakeasy.k > 0.9', 'the city powered on (the rooms lit)', 20000);
    const sp = await ev(Q.page, '(() => { const s = window.__district.harbor().speakeasy; return { ...s, wins: s.windows() }; })()');
    ok(sp.wins.length === 6 && ['edge2', 'bar', 'jazz', 'edge3', 'apartment', 'back'].every(id => sp.wins.some(w => w.id === id)), `THE SPEAKEASY: six windows with their rooms (${sp.wins.map(w => w.id).join(', ')})`);
    const edge = sp.wins.filter(w => w.edge), seen = edge.map(w => (w.rect.x + w.rect.w) / w.rect.w);
    ok(edge.length === 2 && seen.every(v => v > 0.35 && v < 0.65), `THE EDGE WINDOWS: the screen's left edge cuts each at about half (${seen.map(v => Math.round(v * 100) + ' %').join(', ')} showing)`);
    ok(sp.k > 0.9 && sp.lit && !sp.turned && sp.ad, `THE ROOMS LIT AT NIGHT (k ${sp.k}); the corner as it is; this week's ad: ${sp.ad} (on the blade sign)`);
    const bar = sp.wins.find(w => w.id === 'bar').rect, c = await px(Q.page, bar.x + bar.w * 0.5, bar.y + bar.h * 0.28);
    ok(c[0] > 150 && c[0] > c[2] + 60, `THE BAR at night: warm light in its window (rgb ${c.join(',')})`);
    const board = (await ev(Q.page, 'window.__district.harbor().neon')).boards[0];
    ok(!board || board.game !== sp.ad, `THE AD never doubles tonight's billboard (board ${board && board.game}, ad ${sp.ad})`);
    ok(sp.mb < 4, `THE SPEAKEASY's live layer: ${sp.mb} MB`);
    // FP — THE BARBER POLE at night: the hero light of the shopfront (its glass brighter than the sconce's + the shop lamp's glow), turning
    // smoothly (the phase moving at the slow night pace between samples); the raid's hook snaps it dark + still, then gives it back
    { const lumA = cs => Math.max(...cs.map(c => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]));
      const pr = sp.poleRect, col = async () => { const o = []; for (const f of [0.25, 0.4, 0.55, 0.7]) o.push(await px(Q.page, pr.x + pr.w * 0.5, pr.y + pr.h * f)); return o; };
      const lp = lumA(await col()), ga = sp.glowAt;
      // (the sconce + the shop lamp: their glow's mean over a 6 × 6 pt patch round each — a bulb is a point; the pole's glass a column)
      const patch = async ([X, Y]) => { let t = 0, n = 0; for (let dx = -3; dx <= 3; dx += 1.5) for (let dy = -3; dy <= 3; dy += 1.5) { const c = await px(Q.page, X + dx, Y + dy); t += 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; n++; } return t / n; };
      const ls = await patch(ga.sconce), ll = await patch(ga.lamp);
      ok(pr && lp > 150 && lp > ls * 1.1 && lp > ll * 1.1, `THE POLE lit at night: its glass ${lp.toFixed(0)} — brighter than the sconce (${ls.toFixed(0)}) + the shop lamp (${ll.toFixed(0)}): the hero light of the shopfront`);
      const ph0 = await ev(Q.page, 'window.__district.harbor().speakeasy.polePh'), t0 = Date.now();
      await sleep(1500);
      const ph1 = await ev(Q.page, 'window.__district.harbor().speakeasy.polePh'), d = ((ph1 - ph0 + 1) % 1) / ((Date.now() - t0) / 1000);
      okT(d > 0.08 && d < 0.3, `THE POLE turns slowly at night: ${d.toFixed(3)} periods a second`);
      // FP2 — red / white / blue on a normal night (vivid through the LED-lit glass)
      { const cs = []; for (let f = 0.15; f < 0.86; f += 0.035) cs.push(await px(Q.page, pr.x + pr.w * 0.5, pr.y + pr.h * f));
        ok(cs.some(c => c[0] > 180 && c[1] < 120 && c[2] < 140) && cs.some(c => c[2] > 180 && c[0] < 140) && cs.some(c => Math.min(...c) > 200), `THE POLE at night: red, blue + a bright cool white on the glass (${cs.slice(0, 6).map(c => c.join(',')).join(' · ')}…)`); }
      // FP2 — THE SLIDE, frame by frame: the stripes' rendered offset (the column's fundamental, in device px) follows the clock's phase on
      // every drawn frame — even, never a stall or a jump (the owner: "still jittery")
      { const run = await ev(Q.page, `new Promise(res => { const hb = window.__district.harbor(), r = hb.speakeasy.poleRect, cv = document.querySelector('.nd-scene canvas'), k = cv.width / cv.clientWidth, g = cv.getContext('2d');
          const x = Math.round((r.x + r.w / 2) * k), y0 = Math.round((r.y + r.w * 0.6) * k), y1 = Math.round((r.y + r.h - r.w * 0.6) * k), rows = []; let last = '', n = 0;
          const tick = ts => { const d = g.getImageData(x - 1, y0, 3, y1 - y0).data, pf = []; for (let i = 0; i < y1 - y0; i++) { let s = 0; for (let j = 0; j < 3; j++) s += d[(i * 3 + j) * 4] - d[(i * 3 + j) * 4 + 2]; pf.push(s / 3); }
            const key = pf.join(','); if (key !== last) { last = key; rows.push({ ts, pf, ph: window.__district.harbor().speakeasy.polePh }); } if (++n < 50) requestAnimationFrame(tick); else res({ rows, Pd: 4.4 * (r.w / 2) * k }); };
          requestAnimationFrame(tick); })`);
        const Pd = run.Pd, phaseOf = pf => { const m = pf.reduce((a, b) => a + b, 0) / pf.length; let re = 0, im = 0; pf.forEach((v, i) => { re += (v - m) * Math.cos(2 * Math.PI * i / Pd); im += (v - m) * Math.sin(2 * Math.PI * i / Pd); }); return Math.atan2(im, re) / (2 * Math.PI) * Pd; };
        const wrap = v => { while (v > Pd / 2) v -= Pd; while (v < -Pd / 2) v += Pd; return v; };
        const res = [0], st = [];
        for (let i = 1; i < run.rows.length; i++) { const m = wrap(phaseOf(run.rows[i].pf) - phaseOf(run.rows[i - 1].pf)), dph = run.rows[i].ph - run.rows[i - 1].ph, e = -((dph + 1.5) % 1 - 0.5) * Pd; st.push(m); res.push(res[i - 1] + m - e); }
        const mr = res.reduce((a, b) => a + b, 0) / res.length, dev = Math.max(...res.map(v => Math.abs(v - mr)));
        ok(st.every(s => s < 0), `THE POLE'S SLIDE: ${run.rows.length} drawn frames, every one moving the same way (steps ${Math.min(...st.map(Math.abs)).toFixed(2)}–${Math.max(...st.map(Math.abs)).toFixed(2)} px)`);
        okT(run.rows.length >= 12 && dev < 0.45, `THE POLE'S SLIDE in time: ${run.rows.length} drawn frames, within ${dev.toFixed(2)} px of the clock`); }
      // FP2 — NO SMOKE: what the lit pole adds round it (lit − the raid's dark) — light on the brick right beside the glass, nothing ~15 pt
      // away (FP's warm wash reached ~28 pt: ~17–20 levels at 15 pt; the noise floor here ±5)
      const lumP = async ([X, Y]) => { let t = 0, n = 0; for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) { const c = await px(Q.page, X + dx, Y + dy); t += 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; n++; } return t / n; };
      await waitFor(Q.page, 'window.__district.harbor().speakeasy.k > 0.985', 'the power-on done (the city still brightening would read as a difference)', 15000).catch(() => {});
      const pcx = pr.x + pr.w / 2, mid = pr.y + pr.h / 2;
      const nearAt = [[pr.x - 3.5, mid], [pr.x + pr.w + 3.5, mid - 6]], farAt = [[pcx - 15, mid], [pcx, pr.y - 15], [pcx - 16, pr.y + 4], [pcx + 28, mid]];
      const on1 = { near: [], far: [] }; for (const p of nearAt) on1.near.push(await lumP(p)); for (const p of farAt) on1.far.push(await lumP(p));
      await ev(Q.page, 'window.__district.harbor().speakeasy.pole({ on: false })');
      await sleep(300);
      const a = await ev(Q.page, 'window.__district.harbor().speakeasy.polePh'); await sleep(500);
      const b = await ev(Q.page, 'window.__district.harbor().speakeasy.polePh'), ld = lumA(await col());
      ok(a === b && ld < lp * 0.6, `THE RAID's hook: the pole dark (${ld.toFixed(0)}) + still`);
      { const nd = []; for (const [i, p] of nearAt.entries()) nd.push(on1.near[i] - await lumP(p)); const fd = []; for (const [i, p] of farAt.entries()) fd.push(on1.far[i] - await lumP(p));
        ok(Math.max(...nd) > 10 && fd.every(v => Math.abs(v) < 6), `NO SMOKE round the pole: its light on the brick beside it +${nd.map(v => v.toFixed(1)).join(' / +')}; ~15–28 pt away ${fd.map(v => v.toFixed(1)).join(' / ')} (≈ 0)`); }
      await ev(Q.page, 'window.__district.harbor().speakeasy.pole({ on: true })');
      // (the condition, not a fixed pause: the parallel run's loaded frames can take longer than 400 ms to show it)
      let lit = 0; for (let i = 0; i < 25 && !(lit > lp * 0.85); i++) { await sleep(200); lit = lumA(await col()); }
      ok(lit > lp * 0.85, `THE RAID over: the pole lit again (${lit.toFixed(0)} vs ${lp.toFixed(0)})`); }
    if (SHOTS) await Q.page.screenshot({ path: `${OUT}speakeasy-night-402x874.png` });
    await Q.ctx.close(); }
  // ---- FP2: a PARTY night — the pole's stripes in the party's neon (magenta + electric blue on gold), the same slow turn
  { const Q = await open({ slot: 'sp3', qs: `${NIGHT}&force=party`, view: [402, 874] });
    await harborUp(Q.page); await settle(Q.page);
    await waitFor(Q.page, 'window.__district.harbor().speakeasy.k > 0.9 && window.__district.party().on > 0.9', 'the party on, the rooms lit', 20000);
    const sp = await ev(Q.page, 'window.__district.harbor().speakeasy'), pr = sp.poleRect;
    // (a column down the glass; up to 5 sweeps — a loaded parallel run can catch a sweep mid-punch, washed toward white)
    const party = cs => cs.some(c => c[0] > 180 && c[2] > 100 && c[1] < 130) && cs.some(c => c[2] > 180 && c[0] < 150), red = cs => cs.some(c => c[0] > 180 && c[1] < 110 && c[2] < 90);
    let cs = [], sawRed = false;
    for (let k = 0; k < 5; k++) { cs = []; for (let f = 0.15; f < 0.86; f += 0.035) cs.push(await px(Q.page, pr.x + pr.w * 0.5, pr.y + pr.h * f)); sawRed ||= red(cs); if (party(cs)) break; await sleep(300); }
    ok(party(cs) && !sawRed, `THE POLE on a party night: neon magenta + electric blue, no plain red (${cs.slice(0, 6).map(c => c.join(',')).join(' · ')}…)`);
    const ph0 = await ev(Q.page, 'window.__district.harbor().speakeasy.polePh'), t0 = Date.now(); await sleep(1500);
    const ph1 = await ev(Q.page, 'window.__district.harbor().speakeasy.polePh'), d = ((ph1 - ph0 + 1) % 1) / ((Date.now() - t0) / 1000);
    okT(d > 0.08 && d < 0.3, `THE POLE's party turn: the same slow turn (${d.toFixed(3)} periods a second)`);
    await Q.ctx.close(); }
  // ---- by day: the windows not lit, the basement's amber still glowing (the one hint), the pole turning
  { const Q = await open({ slot: 'sp2', qs: `when=2026-10-22T12:30${GR}`, view: [402, 874] });
    await harborUp(Q.page); await settle(Q.page);
    const sp = await ev(Q.page, '(() => { const s = window.__district.harbor().speakeasy; return { ...s, wins: s.windows() }; })()');
    const bar = sp.wins.find(w => w.id === 'bar').rect, c = await px(Q.page, bar.x + bar.w * 0.5, bar.y + bar.h * 0.28);
    ok(sp.k < 0.05 && !(c[0] > 150 && c[0] > c[2] + 60), `BY DAY: the rooms unlit (k ${sp.k}), the bar's glass not glowing (rgb ${c.join(',')})`);
    if (SHOTS) await Q.page.screenshot({ path: `${OUT}speakeasy-day-402x874.png` });
    await Q.ctx.close(); }
});

// ================================================================ PART 8a — THE CITY SOUNDS (ONLY=sounds; docs/audio.md#the-city-sounds)
// ---- PART 8a: THE PROMENADE — the layout the owner approved, the season by the real date (+ forced), the lamps' pools baked into
// the setts at night, the implied road (a car's headlights; off by the owner's flag)
G('promenade', async () => {
  const px = (p, X, Y) => ev(p, `new Promise(res => requestAnimationFrame(() => { const cv = document.querySelector('.nd-scene canvas'), k = cv.width / cv.clientWidth; res(Array.from(cv.getContext('2d').getImageData(Math.round(${X} * k), Math.round(${Y} * k), 1, 1).data).slice(0, 3)); }))`);
  const lum = c => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  const settle = p => waitFor(p, '!window.__district.harbor().pending && !window.__district.harbor().fading', 'settled', 20000);
  { const Q = await open({ slot: 'pr1', qs: NIGHT, view: [402, 874] });
    await harborUp(Q.page); await settle(Q.page);
    await waitFor(Q.page, 'window.__district.harbor().promenade.lampK >= 0.99', 'the lamps fully on (baked)', 25000); await settle(Q.page);
    const pr = await ev(Q.page, 'window.__district.harbor().promenade');
    ok(pr.season === 'autumn' && !pr.flag && pr.impliedOn, `THE PROMENADE (Oct 21): autumn by the real date, no flag, the implied road on (${pr.season})`);
    const tall = pr.lamps.filter(l => l.kind === 'tall'), globes = pr.lamps.filter(l => l.kind === 'globe');
    ok(tall.length >= 1 && globes.length >= 2 && pr.lamps.every(l => l.heads >= 1), `THE LAMPS: ${tall.length} tall double-head + ${globes.length} globes, every one with its glass on screen`);
    // (FP2: the framing maple + the curb crabapple over the bench — the red maple by the blade is gone)
    ok(pr.trees.length >= 2 && pr.trees.some(t => t.kind === 'maple') && pr.trees.some(t => t.kind === 'crab') && pr.trees.every(t => t.at[0] - t.r >= 0 && t.at[0] + t.r <= 402), `THE TREES: ${pr.trees.map(t => t.kind).join(', ')} — none cut by the screen's edges`);
    const door = await ev(Q.page, 'window.__district.harbor().door');
    ok(pr.medallion[0] > door.x + 40 && pr.medallion[1] < 758, `THE MEDALLION in the open plaza, right of the door (${pr.medallion[0]} vs the door ${Math.round(door.x)})`);
    // (a patch's mean, 14 × 4 pt: the setts' joints + tops average out)
    // (a patch's mean, once two frames in a row agree — FP: right after the bake settles the city is still fading in)
    const patchOn = (p, X, Y) => ev(p, `new Promise(res => { const cv = document.querySelector('.nd-scene canvas'), k = cv.width / cv.clientWidth; let last = null, n = 0; const f = () => { const d = cv.getContext('2d').getImageData(Math.round((${X} - 7) * k), Math.round((${Y} - 2) * k), Math.round(14 * k), Math.round(4 * k)).data; let r = 0, g = 0, b = 0, m = d.length / 4; for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; } const c = [r / m, g / m, b / m]; if ((last && Math.abs(c[0] + c[1] + c[2] - last[0] - last[1] - last[2]) < 3) || ++n > 40) res(c); else { last = c; requestAnimationFrame(f); } }; requestAnimationFrame(f); })`);
    const patch = (X, Y) => patchOn(Q.page, X, Y);
    const a = lum(await patch(pr.pool.lit[0], pr.pool.lit[1]));
    // the same patch with the lamps' pools switched off (&force=no-lamp-light, the A/B): the pool is the lamps' light, the ground dim
    const O = await open({ slot: 'pr1b', qs: `${NIGHT}&force=no-lamp-light`, view: [402, 874] });
    await harborUp(O.page); await settle(O.page);
    const b = lum(await patchOn(O.page, pr.pool.lit[0], pr.pool.lit[1]));
    await O.ctx.close();
    ok(a > b * 1.4 && b > 4, `THE POOLS: the cobbles by a globe lamp (at ${pr.pool.lit.join(",")}) ${a.toFixed(0)} lit vs ${b.toFixed(0)} unlit — a clear pool on a dim (never black) ground`);
    if (SHOTS) await Q.page.screenshot({ path: `${OUT}promenade-night-402x874.png` });
    // FP — THE CROSSING: the stop lights + the WALK / WAIT lantern in step on the city's clock; the lit pane glowing, the other dark
    { await waitFor(Q.page, 'window.__district.harbor().crossing.lit', 'the lantern lit (not in a blink off half)', 5000);
      const cr = await ev(Q.page, 'window.__district.harbor().crossing'), ln = cr.lantern;
      const litP = ln && ln.panes[cr.walk === 'walk' ? 1 : 0], offP = ln && ln.panes[cr.walk === 'walk' ? 0 : 1];
      const maxLum = q => ev(Q.page, `new Promise(res => requestAnimationFrame(() => { const cv = document.querySelector('.nd-scene canvas'), k = cv.width / cv.clientWidth, d = cv.getContext('2d').getImageData(Math.round(${q.x} * k), Math.round(${q.y} * k), Math.max(1, Math.round(${q.w} * k)), Math.max(1, Math.round(${q.h} * k))).data; let m = 0; for (let i = 0; i < d.length; i += 4) m = Math.max(m, 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]); res(m); }))`);
      const lit = ln ? await maxLum(litP) : 0, dark = ln ? await maxLum(offP) : 0;
      ok(ln && cr.heads.every(h => h && h.state === cr.road) && (cr.walk !== 'walk' || cr.road === 'red') && ln.letter > 6, `THE CROSSING: both heads ${cr.road}, the lantern ${cr.walk.toUpperCase()}${cr.blink ? ' (blinking)' : ''} — letters ${ln && ln.letter.toFixed(1)} pt`);
      ok(lit > 170 && lit > dark + 60, `THE LANTERN: the lit ${litP && litP.word} pane glows (max ${lit.toFixed(0)}) over the unlit ${offP && offP.word} (${dark.toFixed(0)})`); }
    await Q.ctx.close(); }
  // the implied road: a car passing (forced); the owner's flag switches the road off; a forced season
  { const Q = await open({ slot: 'pr2', qs: `${NIGHT}&force=road-pass,season-winter`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, '!!window.__district.harbor().road.pass', 'a car passing on the implied road', 20000);
    const rd = await ev(Q.page, 'window.__district.harbor().road'), pr = await ev(Q.page, 'window.__district.harbor().promenade');
    ok(rd.pass && Math.abs(rd.pass.dir) === 1 && pr.season === 'winter', `THE IMPLIED ROAD: a car passing (${rd.pass && rd.pass.id}, dir ${rd.pass && rd.pass.dir}); &force=season-winter → ${pr.season}`);
    await Q.ctx.close(); }
  // FP2 — THE STREET UNDER THE DOCK (full-bleed) + THE MOTORCAR: with the dock shown no car is drawn; at rest the band is a finished
  // street (not the old flat asphalt) and the forced pass's car rolls across it, inside the band; the dock back → the car gone
  { const Q = await open({ slot: 'pr5', qs: `${NIGHT}&force=road-pass`, view: [402, 874] });
    await harborUp(Q.page); await settle(Q.page);
    await waitFor(Q.page, '!!window.__district.harbor().road.pass', 'a pass under way', 20000);
    const r0 = await ev(Q.page, 'window.__district.harbor().road');
    ok(r0.vis === 0 && !r0.car, `FP2 — THE DOCK SHOWN: no car drawn (vis ${r0.vis}) — only the implied light`);
    await ev(Q.page, 'window.__district.idle()');
    await waitFor(Q.page, 'window.__district.isIdle() && window.__district.harbor().road.vis >= 0.99', 'the dock at rest, the car visible', 8000);
    const cam = await ev(Q.page, 'window.__district.harbor().cam');
    // the band's texture: the setts + the rails (the old asphalt was one flat tone: σ ≈ 2)
    const band = await ev(Q.page, `new Promise(res => requestAnimationFrame(() => { const cv = document.querySelector('.nd-scene canvas'), k = cv.width / cv.clientWidth, y0 = ${cam.dock.y} + 14, h = 874 - 8 - y0;
      const d = cv.getContext('2d').getImageData(Math.round(20 * k), Math.round(y0 * k), Math.round(362 * k), Math.round(h * k)).data; let s = 0, s2 = 0, n = 0;
      for (let i = 0; i < d.length; i += 16) { const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; s += l; s2 += l * l; n++; } const m = s / n; res({ m, sd: Math.sqrt(Math.max(0, s2 / n - m * m)) }); }))`);
    ok(band.sd > 5 && band.m > 14, `FP2 — THE STREET at rest: the band under the dock is cobbled (σ ${band.sd.toFixed(1)}, mean ${band.m.toFixed(0)}) — never the old flat grey, never black`);
    await waitFor(Q.page, '!!window.__district.harbor().road.car', 'the motorcar on screen', 16000);
    const car = (await ev(Q.page, 'window.__district.harbor().road')).car;
    ok(car.drawn && car.top >= cam.dock.y - 1 && car.y <= 874 && car.h > 36 && car.h < 52 && car.w / car.h > 2.2, `FP2 — THE MOTORCAR: ${car.look}, dir ${car.dir}, ${car.w.toFixed(0)} × ${car.h.toFixed(0)} pt, roof ${car.top.toFixed(0)} under the dock's top ${cam.dock.y}, wheels ${car.y.toFixed(0)}`);
    const fast = await ev(Q.page, 'window.__district.harbor().rate.fast');
    ok(fast !== '', `FP2 — 60 fps while it shows (its wheels; the reason now: ${fast} — 'car' when nothing else asks)`);
    if (SHOTS) await Q.page.screenshot({ path: `${OUT}street-car-night-402x874.png` });
    await tapAt(Q.page, 30, 300);
    await waitFor(Q.page, '!window.__district.isIdle() && window.__district.harbor().road.vis === 0 && !window.__district.harbor().road.car', 'the car gone with the dock back', 3000);
    ok(true, 'FP2 — THE DOCK BACK: the car gone at once (vis 0)');
    await Q.ctx.close(); }
  { const Q = await open({ slot: 'pr3', qs: `${NIGHT}&force=no-implied-road`, view: [402, 874] });
    await harborUp(Q.page);
    const pr = await ev(Q.page, 'window.__district.harbor().promenade');
    ok(pr.impliedOn === false, 'THE IMPLIED ROAD OFF (&force=no-implied-road): the setts run to the foot');
    await Q.ctx.close(); }
  // by day: the shot (the owner's review)
  { const Q = await open({ slot: 'pr4', qs: `when=2026-10-22T12:30${GR}`, view: [402, 874] });
    await harborUp(Q.page); await settle(Q.page);
    const pr = await ev(Q.page, 'window.__district.harbor().promenade');
    ok(pr.lampK === 0, `BY DAY: no lamp light baked (${pr.lampK})`);
    if (SHOTS) await Q.page.screenshot({ path: `${OUT}promenade-noon-402x874.png` });
    await Q.ctx.close(); }
});
G('sounds', async () => {
  const { SLOTS, filledSlots } = await import('../../js/core/city-sounds.js');
  const SND = 'window.__district.harbor().sounds';
  const PLAYER = "import('/js/audio/city-sound.js')";
  const loops = p => ev(p, `${SND}.player.loops`);
  // ---- 1. BY DAY (1 pm): silent until the first tap; then the bed — the water + the DAY hum (the night hum not even loaded)
  // (&force=no-planes: a passing airliner's flyby — 2.7 MB decoded — would cloud the bed's memory check)
  const P = await open({ slot: 'sd', qs: `when=2026-10-22T13:00${GR}&panel=1&force=no-planes`, view: [402, 874] });
  await harborUp(P.page);
  const l0 = await loops(P.page);
  ok(l0.every(l => !l.voices), `BED: nothing sounds before the first tap (audio locked: ${l0.map(l => l.slot).join(', ') || 'no loops'})`);
  await tapAt(P.page, 30, 300);
  await waitFor(P.page, `${SND}.player.loops.filter(l => l.ready && l.voices > 0).length >= 2`, 'the bed sounding', 20000);
  const d = await ev(P.page, `(() => { const s = ${SND}; return { mix: s.mix, loops: s.player.loops, mb: s.player.mb, rate: s.player.decodeRate }; })()`);
  const has = id => d.loops.find(l => l.slot === id && l.voices > 0);
  ok(has('water-lapping') && has('city-hum-day') && !d.loops.some(l => l.slot === 'city-hum-night') && d.mix.day > 0.95 && d.mix.night < 0.05,
    `BED by day: water ${has('water-lapping') && has('water-lapping').gain} + the DAY hum ${has('city-hum-day') && has('city-hum-day').gain} (mix day ${d.mix.day} / night ${d.mix.night}, darkness ${d.mix.dark}); the night hum not loaded`);
  ok(d.mb > 0 && d.mb < 14, `BED: ${d.mb} MB decoded (mono; the water at 32 kHz, the hum at 16: ${d.rate} Hz)`);
  // FP — the water far + soft under the hum (its gain + a low-pass); the whole bed ducked while the music is on, back up with it off
  { const w = has('water-lapping'), hd = has('city-hum-day'), mOn = await ev(P.page, "import('/js/audio/settings.js').then(m => !m.settings.musicOff && !m.settings.muted && m.settings.music > 0.01)");
    ok(w.lp === 1600 && w.gain < hd.gain * 0.75 && (mOn ? d.mix.k < 0.8 : d.mix.k === 1),
      `FP BED: the water ${w.gain} through a ${w.lp} Hz low-pass, under the day hum ${hd.gain}; the music ${mOn ? 'on → ducked' : 'off →'} ×${d.mix.k}`);
    await ev(P.page, "import('/js/audio/settings.js').then(m => m.updateSettings({ musicOff: true }))");
    await waitFor(P.page, `${SND}.mix.k === 1 && ${SND}.player.loops.find(l => l.slot === 'city-hum-day').gain > ${hd.gain} + 0.005`, 'the bed up with the music off', 8000).catch(() => {});
    const off = await ev(P.page, `(() => { const s = ${SND}; return { k: s.mix.k, hum: (s.player.loops.find(l => l.slot === 'city-hum-day') || {}).gain }; })()`);
    ok(off.k === 1 && off.hum > hd.gain, `FP BED: MUSIC OFF → the bed is the main sound (×${off.k}: the day hum ${hd.gain} → ${off.hum})`);
    await ev(P.page, "import('/js/audio/settings.js').then(m => m.updateSettings({ musicOff: false }))"); }
  // ---- 2. a one-shot from a slot (the road's cars, the gulls) + an EMPTY slot is silent
  const r = await ev(P.page, `(() => { const s = window.__district.harbor().sounds, car = s.play('car-1920s-pass', { pan: -0.5 }), gull = s.play('gulls'), cat = s.play('cat-meow'), mute = s.loop('club-murmur-calm');
    return { car: car && { take: car.take, peak: car.peak }, gull: gull && gull.take, cat, mute: !!mute.silent }; })()`);
  await sleep(600);
  const log = await ev(P.page, `${PLAYER}.then(m => m.cityLog.slice(-4).map(x => x.slot))`);
  ok(r.car && r.car.peak > 5 && /car-1920s-pass/.test(r.car.take) && r.gull && log.includes('car-1920s-pass') && log.includes('gulls'),
    `ONE-SHOTS: play('car-1920s-pass') → ${r.car && r.car.take} (nearest at ${r.car && r.car.peak} s); play('gulls') → ${r.gull}; both sounded (${log.join(', ')})`);
  ok(r.cat === null && r.mute, 'EMPTY SLOTS: play(\'cat-meow\') → null, loop(\'club-murmur-calm\') → a silent handle (no error, no beep)');
  // ---- 3. THE SEAM: a loop started 4 s before its end crossfades into a fresh pass (2 voices for 2.5 s), then carries on with one
  const seam = await ev(P.page, `${PLAYER}.then(async m => { const h = m.cityLoop('city-hum-day', { start: 66, fadeIn: 1, gain: 0.01 }); const v = []; for (let i = 0; i < 18; i++) { await new Promise(r => setTimeout(r, 500)); v.push(h.debug().voices); } h.stop(0.2); return v; })`);
  ok(seam.includes(2) && seam[seam.length - 1] === 1 && seam.indexOf(2) > 0, `THE SEAM: voices over 9 s ${seam.join('')} — one pass, the crossfade (two), one again`);
  // ---- 4. EFFECTS OFF: the bed stops (nothing playing into a muted bus); back on, it comes back faded in
  await ev(P.page, "import('/js/audio/settings.js').then(m => m.updateSettings({ sfx: 0 }))");
  await waitFor(P.page, `${SND}.player.loops.every(l => !l.voices)`, 'the bed stops with the effects off', 5000);
  await ev(P.page, "import('/js/audio/settings.js').then(m => m.updateSettings({ sfx: 0.7 }))");
  await waitFor(P.page, `${SND}.player.loops.filter(l => l.voices > 0).length >= 2`, 'the bed back', 5000);
  ok(true, 'EFFECTS: off → the bed stops; on → it comes back');
  // ---- 5. THE PANEL's SOUNDS: every slot, filled / empty, ▶ on the filled ones only; ▶ plays it
  await ev(P.page, 'window.__district.remote().open()');
  await ev(P.page, "window.__district.remote().openCats(['sounds'])");
  await waitFor(P.page, "!!document.querySelector('.hr-sec[data-cat=\"sounds\"] .hr-snd')", 'the SOUNDS rows', 5000);
  const rows = await ev(P.page, `[...document.querySelectorAll('.hr-sec[data-cat="sounds"] .hr-snd')].map(r => ({ id: r.dataset.slot, filled: r.classList.contains('is-filled'), dis: r.querySelector('.hr-snd-play').disabled, st: r.querySelector('.hr-snd-st').textContent, h: r.getBoundingClientRect().height }))`);
  const filled = rows.filter(x => x.filled).map(x => x.id).sort();
  ok(rows.length === SLOTS.length && filled.join() === filledSlots().sort().join() && rows.every(x => x.filled !== x.dis) && rows.filter(x => !x.filled).every(x => x.st === 'EMPTY') && rows.every(x => x.h >= 44),
    `PANEL SOUNDS: ${rows.length} slots, ${filled.length} filled (${filled.join(', ')}), ▶ only on those, the rest EMPTY, rows ≥ 44 pt`);
  await ev(P.page, `(() => { const b = document.querySelector('.hr-snd[data-slot="water-lapping"] .hr-snd-play'); b.scrollIntoView({ block: 'center' }); b.click(); })()`);
  await waitFor(P.page, `${SND}.player.loops.filter(l => l.slot === 'water-lapping').length >= 2`, 'the preview loop', 5000);
  ok(true, 'PANEL SOUNDS: ▶ water-lapping plays a preview over the bed');
  await waitFor(P.page, "/water-lapping/.test(document.querySelector('.hr-snd-now').textContent)", 'the SOUNDING NOW line', 5000);
  if (SHOTS) { await ev(P.page, "document.querySelector('.hr-snd[data-slot=\"water-lapping\"]').scrollIntoView({ block: 'center' })"); await sleep(400); await P.page.screenshot({ path: `${OUT}sounds-panel-402x874.png` }); }
  await P.ctx.close();
  // ---- 6. AT NIGHT (10 pm): the NIGHT hum, not the day one; THE NEON TAP ~25 % quieter (dropout 0.5 × 0.5625)
  const N = await open({ slot: 'sn', qs: NIGHT, view: [390, 844] });
  await harborUp(N.page);
  await tapAt(N.page, 30, 300);
  await waitFor(N.page, `${SND}.player.loops.filter(l => l.ready && l.voices > 0).length >= 2`, 'the night bed', 20000);
  const n = await ev(N.page, `(() => { const s = ${SND}; return { mix: s.mix, loops: s.player.loops.filter(l => l.voices > 0).map(l => l.slot) }; })()`);
  ok(n.loops.includes('city-hum-night') && n.loops.includes('water-lapping') && !n.loops.includes('city-hum-day') && n.mix.night > 0.95, `BED at night: ${n.loops.join(' + ')} (mix night ${n.mix.night}, darkness ${n.mix.dark})`);
  const lr = await ev(N.page, "(() => { const s = document.querySelector('.nd-logo-wrap svg.nd-logo') || document.querySelector('svg.nd-logo'); const b = s.getBoundingClientRect(); return { x: b.left + b.width * 0.12, y: b.top + b.height / 2 }; })()");
  const n0 = await ev(N.page, "import('/js/audio/ambience.js').then(m => m.neonLog.length)");
  await tapAt(N.page, lr.x, lr.y);
  await waitFor(N.page, `import('/js/audio/ambience.js').then(m => m.neonLog.length >= ${n0} + 2)`, 'the tap\'s two sounds', 6000).catch(() => {});
  const tapLog = await ev(N.page, `import('/js/audio/ambience.js').then(m => m.neonLog.slice(${n0}).map(x => ({ name: x.name, gain: x.gain })))`);
  ok(tapLog.length >= 2 && tapLog.every(x => Math.abs(x.gain - 0.5 * 0.5625) < 1e-6), `NEON TAP: its dropout + power-on at ${tapLog.map(x => `${x.name.replace('neon-', '').replace('.wav', '')} ${x.gain}`).join(', ')} (was 0.375: × 0.75 ≈ −2.5 dB)`);
  await N.ctx.close();
  // ---- 7. FP3 — THE CAR IN SYNC (the owner: its sound came 5–6 s after the car): every car file held back 2.5 s (a slow phone
  // network) — the take's PEAK still lands on the car's mid-crossing (it used to start whenever its file arrived: late by the wait);
  // the pass's own take; the car on screen for its take's crossing; the pan follows the car's side
  { const C = await open({ slot: 'sc', qs: `${NIGHT}&force=road-pass`, view: [402, 874] });
    await C.page.setRequestInterception(true);
    C.page.on('request', r => { if (r.isInterceptResolutionHandled()) return; if (/\/audio\/city\/car-/.test(r.url())) setTimeout(() => r.continue().catch(() => {}), 2500); else r.continue().catch(() => {}); });
    await harborUp(C.page);
    await tapAt(C.page, 30, 300);
    await waitFor(C.page, "import('/js/audio/engine.js').then(m => m.isUnlocked())", 'audio unlocked', 8000);
    await ev(C.page, 'window.__district.idle()');
    const res = await ev(C.page, `(async () => {
      const m = await import('/js/audio/city-sound.js'), cs = await import('/js/core/city-sounds.js'), seen = new Map(), t0 = performance.now();
      await new Promise(done => { const f = () => { const rd = window.__district.harbor().road; if (rd.car && rd.pass) { const now = performance.now(), s = seen.get(rd.pass.id) || { first: 1e12, last: 0, take: rd.pass.take, cross: rd.pass.cross }; s.first = Math.min(s.first, now); s.last = Math.max(s.last, now); seen.set(rd.pass.id, s); }
        if (performance.now() - t0 < 30000) requestAnimationFrame(f); else done(); }; f(); });
      const takes = cs.takesOf('car-1920s-pass');
      const sounds = m.cityLog.filter(x => x.slot === 'car-1920s-pass' && !x.late).map(x => { const t = takes.find(k => k.f === x.f); return { f: x.f, pan: x.pan, peakAt: x.at + (x.wait + t.peak - x.off) * 1000 }; });
      const late = m.cityLog.filter(x => x.slot === 'car-1920s-pass' && x.late).map(x => x.f);
      return { late, cars: [...seen.values()].filter(s => s.first > t0 + 200 && s.last < t0 + 29800).map(s => ({ mid: (s.first + s.last) / 2, on: (s.last - s.first) / 1000, cross: s.cross, f: takes[s.take].f })), sounds };
    })()`);
    // (PF: a sound is paired with its own car only — one whose peak lands within 8 s of it; a car whose sound was SKIPPED by design
    // (its file arrived under 1 s before the centre: `late`, silent rather than out of sync — the first pass after the page opened)
    // has none, and is listed as such — so may the FIRST car in the window on a slow machine: its file may not even arrive before it passes)
    const pairs = res.cars.map(c => { const s = res.sounds.filter(x => x.f === c.f && Math.abs(x.peakAt - c.mid) < 8000).sort((a, b) => Math.abs(a.peakAt - c.mid) - Math.abs(b.peakAt - c.mid))[0]; return { ...c, dt: s ? (s.peakAt - c.mid) / 1000 : null, skipped: !s && (res.late.includes(c.f) || c === res.cars[0]) }; });
    const heard = pairs.filter(q => !q.skipped);
    okT(heard.length >= 1 && heard.every(q => q.dt != null && Math.abs(q.dt) < 0.35) && pairs.every(q => Math.abs(q.on - q.cross) < 0.4),
      `FP3 — THE CAR IN SYNC (car files held back 2.5 s): ${pairs.map(q => `${q.f} on screen ${q.on.toFixed(2)} s (its swell's ${q.cross} s), its sound's peak ${q.skipped ? 'SKIPPED (late, silent by design)' : q.dt == null ? 'MISSING' : `${q.dt >= 0 ? '+' : ''}${q.dt.toFixed(2)} s`} from mid-crossing`).join(' · ')}`);
    ok(res.sounds.every(x => Math.abs(x.pan) <= 0.6 + 1e-6) && res.sounds.some(x => Math.abs(x.pan) > 0.3), `FP3 — THE PAN: each sound starts on its car's side, gentle (${res.sounds.map(x => x.pan).join(', ')}; ±0.6 at most)`);
    await C.ctx.close(); }
});

// ================================================================ THE RUNNER: ONLY=… in this process, else parallel shards + the two serial groups
async function runGroup(name) {
  const fns = GROUPS.get(name);
  if (!fns) { errors.push(`unknown group ${name} (known: ${[...GROUPS.keys()].join(', ')})`); return; }
  const g0 = Date.now();
  for (const fn of fns) { try { await fn(); } catch (e) { errors.push(`FATAL [${name}] ${e.message}`); log('FAILED', name, e.message); } }
  log(`group ${name}: ${((Date.now() - g0) / 1000).toFixed(1)} s`);
}
const ONLY = (process.env.ONLY || '').split(',').map(x => x.trim()).filter(Boolean), TAG = process.env.SHARD_TAG || '';
const SERIAL = ['panel', 'perf'];
// (the shards, balanced on the measured times: ~35 s each)
const SHARD_PLAN = { 1: [], 2: [['core', 'flags', 'skyline', 'water', 'harbor', 'speakeasy', 'promenade'], ['neon', 'dock', 'sky', 'party', 'music', 'sounds']], 3: [['core', 'flags', 'skyline', 'water', 'promenade'], ['neon', 'harbor', 'dock', 'speakeasy'], ['sky', 'party', 'music', 'sounds']] };
const SHARDS = Number(process.env.SHARDS || 3);
if (ONLY.length) { for (const g of ONLY) await runGroup(g); }
else if (SHARDS > 1) {
  const plan = SHARD_PLAN[SHARDS] || SHARD_PLAN[3], me = fileURLToPath(import.meta.url);
  await Promise.all(plan.map((groups, i) => new Promise(res => {
    const ch = spawn(process.execPath, [me, BROWSER, OUT], { env: { ...process.env, ONLY: groups.join(','), SHARD_TAG: `s${i + 1}` }, stdio: ['ignore', 'pipe', 'pipe'] });
    const pre = `[s${i + 1}]`;
    for (const st of [ch.stdout, ch.stderr]) { let buf = ''; st.on('data', d => { buf += d; let k; while ((k = buf.indexOf('\n')) >= 0) { console.log(pre, buf.slice(0, k)); buf = buf.slice(k + 1); } }); }
    // ('exit', not 'close': the headless browsers a shard spawned hold its stdout pipe open for a while after it ends)
    ch.on('exit', () => {
      const rf = `${OUT}result-s${i + 1}.json`;
      if (existsSync(rf)) { const r = JSON.parse(readFileSync(rf, 'utf8')); checks.push(...r.checks); errors.push(...r.errors); warnings.push(...(r.warnings || [])); }
      else errors.push(`shard s${i + 1} wrote no result`);
      res();
    });
  })));
  for (const g of SERIAL) await runGroup(g);
} else { for (const g of GROUPS.keys()) await runGroup(g); }
const passed = checks.filter(c => c.ok).length;
log(`checks ${passed}/${checks.length} passed${warnings.length ? ` · timing warnings ${warnings.length}:\n${warnings.map(w => `  ~ ${w}`).join('\n')}` : ''}`);
log(errors.length ? `errors:\n${errors.join('\n')}` : 'errors none');
writeFileSync(`${OUT}result${TAG ? '-' + TAG : ''}.json`, JSON.stringify({ checks, errors, warnings }, null, 1));
if (browser) await Promise.race([browser.close(), sleep(5000)]);
process.exit(errors.length ? 1 : 0);
