// CITY 2.0 — THE HARBOR end to end (docs/harbor.md). Needs the emulators + scripts/serve.mjs --emu.
//   node e2e-harbor.mjs "<browser path>" ./shots-harbor        (env SHOTS=0, CPU=4, GPU=1)
// ?city=2 loads the Harbor with no errors and with every title flag (&when &tz &at &wx &force &speed &grid &debug); a normal
// visit (no flag) gets today's city and never loads a harbor file; the flag is never saved (localStorage, sessionStorage,
// cookies) — a reload without it is today's city; the dock: HOST opens a room, JOIN by typing joins it, a knock on the
// speakeasy's door opens JOIN; frame pacing within the City 2.0 budget at 4× CPU; 20 title ↔ setup cycles leave one city, no
// growing heap and the same offscreen memory; a hidden tab stops rendering. Screens at the six review sizes.
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const BROWSER = process.argv[2];
const OUT = (process.argv[3] || './shots-harbor').replace(/\/?$/, '/');
mkdirSync(OUT, { recursive: true });
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const SHOTS = process.env.SHOTS !== '0';
const CPU = Number(process.env.CPU || 4);
const BUDGET_MS = 8;          // City 2.0, tier 2 on a phone: ≤ 8 ms of scene work a frame on average (docs/harbor.md#performance)
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = [], checks = [];
const ok = (cond, what) => { checks.push({ what, ok: !!cond }); log(cond ? 'OK  ' : 'FAIL', what); if (!cond) errors.push(`check failed: ${what}`); };
const GR = '&tz=America/Detroit&at=42.96,-85.67';
const NIGHT = `when=2026-10-21T22:00${GR}`;

const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio', ...(process.env.GPU ? ['--enable-gpu', '--use-angle=d3d11'] : [])] });
async function open({ slot = 'h', qs = '', city = true, view = [390, 844], profile = true } = {}) {
  const ctx = await browser.createBrowserContext();
  const p = await ctx.newPage();
  const files = [];
  p.on('pageerror', e => { errors.push(`${slot} pageerror: ${e.message}`); log(slot, 'PAGEERROR', e.message); });
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/favicon|ERR_|Failed to load|permission_denied|PERMISSION_DENIED|Client is offline/i.test(t)) { errors.push(`${slot}: ${t}`); log(slot, 'console.error', t); } });
  p.on('request', r => files.push(r.url()));
  const [w, h] = view, mobile = w < 1000;
  await p.setViewport({ width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
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

try {
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
    await sleep(1500);
    await A.page.screenshot({ path: `${OUT}night-${w}x${h}.png` });
  }
  await A.page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await sleep(800);

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

  // ================================================================ 3. every title flag works with ?city=2
  { const X = await open({ slot: 'hf', qs: `when=2026-10-14T13:00${GR}&wx=rain&speed=60&force=demo&grid=1&debug=1` });
    await harborUp(X.page);
    const s = await ev(X.page, 'window.__district.scene()'), h2 = await ev(X.page, 'window.__district.harbor()');
    const sp = await ev(X.page, 'window.__district.neon().now');
    await sleep(1200);
    const sp2 = await ev(X.page, 'window.__district.neon().now');
    ok(s.rain > 0 && Math.abs(s.w.day - 1) < 0.5 && h2.events.some(e => e.id === 'demo') && sp2 - sp > 30000,
      `FLAGS: &when &tz &at (day), &wx=rain (rain ${s.rain}), &speed=60 (+${Math.round((sp2 - sp) / 1000)} s of clock in ~1.2 s), &force=demo (the demo event in lane ${h2.events.map(e => e.lanes).join()}), &grid=1, &debug=1 — no errors`);
    if (SHOTS) await X.page.screenshot({ path: `${OUT}flags-grid-390x844.png` });
    await X.ctx.close(); }

  // ================================================================ 4. the dock: HOST, JOIN, the knock on the door
  const H = await open({ slot: 'hh', qs: NIGHT });
  await harborUp(H.page);
  await tap(H.page, '.nd-hostbtn');
  await waitFor(H.page, '!!window.__arcade.state.code && !!document.querySelector(".lobby-screen")', 'lobby after HOST', 20000);
  const code = await ev(H.page, 'window.__arcade.state.code');
  ok(!!code, `HOST (city 2): one tap opens room ${code}`);
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

  // ================================================================ 5. frame pacing at 4× CPU, memory over 20 cycles, a hidden tab
  const Q = await open({ slot: 'hq', qs: `when=2026-10-24T23:00${GR}` });   // a Saturday at the party's peak
  await harborUp(Q.page);
  await Q.page.bringToFront();
  const cdp = await Q.page.target().createCDPSession();
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  const perf = [];
  for (const t of [2, 1, 0]) {
    await ev(Q.page, `window.__district.setTier(${t})`);
    await waitFor(Q.page, '!window.__district.harbor().pending', 're-bake', 15000);
    await sleep(6000);
    const cost = await ev(Q.page, 'window.__district.cost()'), fr = [...await ev(Q.page, 'window.__district.frames()')].sort((a, b) => a - b);
    perf.push({ tier: t, now: await ev(Q.page, 'window.__district.scene().tier'), cost: +(cost.reduce((a, b) => a + b, 0) / cost.length).toFixed(2), p50: +fr[Math.floor(fr.length / 2)].toFixed(1) });
  }
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  writeFileSync(`${OUT}perf.json`, JSON.stringify(perf, null, 1));
  ok(perf.every(p => p.cost <= BUDGET_MS && p.p50 <= 18), `PERF (city 2, party peak, ${CPU}× CPU): scene work ${perf.map(p => `t${p.tier}: ${p.cost} ms/frame, p50 ${p.p50}`).join(' · ')} (budget ${BUDGET_MS} ms)`);
  await setTierBack();
  async function setTierBack() { await ev(Q.page, 'window.__district.setTier(2)'); await waitFor(Q.page, '!window.__district.harbor().pending', 're-bake', 15000); }
  const mem0 = (await ev(Q.page, 'window.__district.harbor()')).mem.mb;
  await cdp.send('HeapProfiler.collectGarbage');
  const q0 = (await cdp.send('Runtime.getHeapUsage')).usedSize;
  for (let i = 0; i < 20; i++) {
    await Q.page.evaluate(() => import('/js/store.js').then(m => m.setState({ view: 'setup', setupMode: 'host' })));
    await sleep(600);
    await Q.page.evaluate(() => import('/js/store.js').then(m => m.setState({ view: 'title' })));
    await sleep(700);
  }
  await waitFor(Q.page, '!!window.__district && !!window.__district.harbor() && window.__district.harbor().shown', 'back on the title', 15000);
  await sleep(800);
  await cdp.send('HeapProfiler.collectGarbage');
  const q1 = (await cdp.send('Runtime.getHeapUsage')).usedSize;
  const mem1 = (await ev(Q.page, 'window.__district.harbor()')).mem.mb;
  const scenes = await ev(Q.page, `document.querySelectorAll('.nd-scene').length`);
  ok(scenes === 1 && q1 - q0 < 6e6 && Math.abs(mem1 - mem0) < 0.01, `MEMORY: 20 title↔setup cycles leave one city, heap ${Math.round((q1 - q0) / 1e5) / 10} MB, offscreen ${mem0} → ${mem1} MB`);
  await Q.page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await sleep(300);
  ok((await ev(Q.page, 'window.__district.scene()')).running === false, 'HIDDEN TAB (city 2): the Harbor stops rendering');
  await Q.page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await sleep(300);
  ok((await ev(Q.page, 'window.__district.scene()')).running === true, 'VISIBLE AGAIN: it resumes');
  await Q.ctx.close();
} catch (e) {
  errors.push(`FATAL ${e.message}`);
  log('FAILED', e.message);
}
const passed = checks.filter(c => c.ok).length;
log(`checks ${passed}/${checks.length} passed`);
log(errors.length ? `errors:\n${errors.join('\n')}` : 'errors none');
writeFileSync(`${OUT}result.json`, JSON.stringify({ checks, errors }, null, 1));
await browser.close();
process.exit(errors.length ? 1 : 0);
