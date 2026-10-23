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
// party,panel,dock,perf (comma-separated) runs those groups in this process. With no ONLY the independent groups run in PARALLEL
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
  const chip = async label => {
    // (NEON PASS 5: a sky piece switched on makes the sheet PEEK — wait for its height to settle before measuring a button)
    await waitFor(O.page, "!document.querySelector('.hr-sheet') || document.querySelector('.hr-sheet').getAnimations().every(x => x.playState !== 'running')", "the sheet still", 3000).catch(() => {});
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
  await O.page.evaluate(() => document.querySelector('.hr-clear').scrollIntoView({ block: 'center', behavior: 'instant' })); await sleep(150);
  await tap(O.page, '.hr-clear');
  await waitFor(O.page, '!window.__district.harbor().flags.remote', 'cleared', 5000);
  await waitFor(O.page, '!window.__district.harbor().windows.spelling', 'the word gone', 5000);
  f1 = await flags(O.page);
  ok(!f1.force.length && !f1.q.text && f1.speed === 1 && f1.wx === 'clear', `JUST ME: CLEAR ALL — the real city again (force [${f1.force}], wx ${f1.wx} from the link's own &at)`);
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
  const on = await ev(D.page, `(() => { const b = [...document.querySelectorAll('.hr-sheet .hr-b')].filter(x => x.textContent.trim() === 'ON')[0]; if (!b) return null; b.scrollIntoView({ block: 'center', behavior: 'instant' }); const q = b.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2 }; })()`);
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
      const f = d.w / 1.5, px = d.x - 6.3 * f, py = d.y - 1.5 * f, sy = hb.cam.VPY - 30;
      const x = cv.getContext('2d');
      const read = (X, Y) => { const k = cv.width / cv.clientWidth; return Array.from(x.getImageData(Math.round(X * k), Math.round(Y * k), 1, 1).data).slice(0, 3); };
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
  { const files = []; A.page.on('request', r => files.push(r.url()));
    await A.page.goto(`${BASE}/?emu&slot=ha&${NIGHT}`);
    await waitFor(A.page, '!!window.__district && window.__district.phase().done', 'reload without the flag');
    const d2 = await ev(A.page, 'window.__district.scene()');
    ok(d2.city !== 2 && d2.signs.length >= 4 && (await ev(A.page, 'window.__district.harbor()')) === null && !files.some(u => /\/harbor\//.test(u)), 'NO FLAG: a reload without ?city=2 is today\'s city (its signs up, no harbor file loaded)'); }
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
    ok(new Set(games).size === 4 && h.neon.signs.filter(s => s.kind === 'named').length === 4 && !h.neon.signs.some(s => s.kind === 'icon') && h.neon.signs.every(s => s.on) && bb && !games.includes(h.neon.boards[0].game),
      `SIGNS: 4 named games in the skyline tonight (${h.neon.signs.filter(s => s.kind === 'named').map(s => s.game).join(', ')}; stacked roof signs + the blade), no icons, the billboard a fifth (${bb}), every sign lit at night`);
    ok(h.neon.outlines.length >= 12 && h.neon.outlines.some(o => o.id === 'needle') && h.neon.led === 2 && h.beacons.length >= 10,
      `NEON OUTLINES: ${h.neon.outlines.length} buildings outlined (the needle, the heroes…), the 2 glass towers' LED facades, ${h.beacons.length} aircraft beacons`);
    const sg = h.neon.signs.find(s => s.game), hit = await ev(N.page, `window.__district.hit(${sg.rect.x + sg.rect.w / 2}, ${sg.rect.y + sg.rect.h / 2})`);
    ok(hit && hit.kind === 'sign' && hit.id === sg.game, `A TAP ON A SIGN: ${sg.id} → ${hit && hit.kind} ${hit && hit.id} (its HOW TO PLAY)`);
    const sigs = await ev(N.page, '(window.__district.scene().signPower || []).length');
    ok(sigs === h.neon.items, `THE NEON PLAN: one power state per sign + outline (${sigs} of ${h.neon.items})`);
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
      ok(sm.grid && sm.n > 20 && sm.edge >= sm.rest - 0.015, `NO SEAMS IN THE WATER (tier ${tr}): every strip on whole device rows; the rows where strips meet ${(100 * sm.edge).toFixed(1)} % of their neighbours' light, every other row ${(100 * sm.rest).toFixed(1)} % (${sm.n} meeting rows sampled)`);
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
    ok(h.daily && h.daily.spell.length === 1 && h.daily.blink.length >= 1 && h.daily.chase.length >= 3, `THE EVERYDAY MOTION (NEON PASS 4: alive): ${h.daily.spell} spells on, ${h.daily.blink} blink, ${h.daily.chase.join(' + ')} chase slowly`);
    ok(h.neon.scheme === 'city' && !h.neon.partyLook, 'A NORMAL NIGHT: the city\'s own colours');
    ok(!h.show.scene && h.beams === 0, 'A NORMAL NIGHT: no party show, no searchlights');
    ok(h.daily.rotate.length >= 1 && h.daily.stages.length >= 1, `COLOURS THROUGH THE NIGHT: ${h.daily.rotate.join(' + ')} rotate slowly, ${h.daily.stages.join(' + ')} change scheme by the hour`);
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
      setTimeout(() => { Math.random = rnd; setTimeout(() => { mo.disconnect(); res(seen); }, 400); }, 6000);
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
    // NEON PASS 5: the roof string lights are off until Parts 7–8 (the code a hook: &force=strings-party)
    ok(hq.strings.on === false, 'STRING LIGHTS: switched off (a hook for Parts 7–8)');
    await Q.ctx.close(); }
  await neonPass5Party();
  { const Q = await open({ slot: 'h11', qs: `when=2026-10-24T21:00${GR}`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, '!!window.__district.party().show.scene', 'the warm-up show', 20000);
    const p = await ev(Q.page, 'window.__district.party()');
    ok(p.name === 'warm' && p.show.lights === 0 && ['glow', 'sweep-slow', 'climb-slow', 'chase-heroes'].includes(p.show.scene), `THE WARM-UP (9 pm): a classy scene ("${p.show.scene}"), no searchlights yet`);
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
        await waitFor(Q.page, '!window.__district.harbor().pending && !window.__district.harbor().fading', 're-bake', 15000);
        await sleep(6000);   // (the measuring window)
        const r = await ev(Q.page, '(() => { const d = window.__district, c = d.cost(), f = [...d.frames()].sort((a, b) => a - b); return { now: d.scene().tier, cost: c.reduce((a, b) => a + b, 0) / Math.max(1, c.length), p50: f.length ? f[Math.floor(f.length / 2)] : 0 }; })()');
        perf.push({ tier: t, now: r.now, cost: +r.cost.toFixed(2), p50: +r.p50.toFixed(1) });
        break;
      } catch (e) { if (k) throw e; log('perf: retrying tier', t, e.message); }
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
  ok(scenes === 1 && q1 - q0 < 6e6 && Math.abs(mem1 - mem0) < 0.01, `MEMORY: 20 title↔setup cycles leave one city, heap ${Math.round((q1 - q0) / 1e5) / 10} MB, offscreen ${mem0} → ${mem1} MB${Math.abs(mem1 - mem0) >= 0.01 ? ` (tier ${hq0.mem.tier} → ${hq1.mem.tier}; ${lay(hq0)} → ${lay(hq1)})` : ''}`);
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
    ok(r1.fast === '' && fps > 22 && fps < 40, `BATTERY: a calm night draws ${fps.toFixed(0)} frames a second (every other rAF; fast: '${r1.fast || 'calm'}')`);
    await C.page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await sleep(400); const h0 = await ev(C.page, 'window.__district.harbor().rate'); await sleep(600); const h1 = await ev(C.page, 'window.__district.harbor().rate');
    ok(h1.drawn === h0.drawn && h1.running === false, `BATTERY: hidden, nothing is drawn (${h0.drawn} → ${h1.drawn})`);
    await C.page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await sleep(600); const v = await ev(C.page, 'window.__district.harbor().rate');
    ok(v.running && v.drawn > h1.drawn + 20 && v.fast !== '', `BATTERY: visible again, it resumes at 60 fps for a moment (fast: ${v.fast})`);
    await C.ctx.close(); }
  await Q.ctx.close();
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
const SHARD_PLAN = { 1: [], 2: [['core', 'flags', 'skyline', 'water', 'harbor'], ['neon', 'dock', 'sky', 'party']], 3: [['core', 'flags', 'skyline', 'water'], ['neon', 'harbor', 'dock'], ['sky', 'party']] };
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
      if (existsSync(rf)) { const r = JSON.parse(readFileSync(rf, 'utf8')); checks.push(...r.checks); errors.push(...r.errors); }
      else errors.push(`shard s${i + 1} wrote no result`);
      res();
    });
  })));
  for (const g of SERIAL) await runGroup(g);
} else { for (const g of GROUPS.keys()) await runGroup(g); }
const passed = checks.filter(c => c.ok).length;
log(`checks ${passed}/${checks.length} passed`);
log(errors.length ? `errors:\n${errors.join('\n')}` : 'errors none');
writeFileSync(`${OUT}result${TAG ? '-' + TAG : ''}.json`, JSON.stringify({ checks, errors }, null, 1));
if (browser) await Promise.race([browser.close(), sleep(5000)]);
process.exit(errors.length ? 1 : 0);
