// FIXES R2 — GROUP 4, THE YOU SCREEN LOADED MESSY (the owner: the card comes up, then the blocks under it pop in and jump). Chromium 390 × 844
// @3 as a phone, the emulators: a member with a server profile opens YOU (☰ / the dock's YOU = view 'profile'). Measured: the LAYOUT SHIFT
// seen on screen — the browser's layout-shift entries (CLS) while the page is visible, and every block's place from the moment it shows to
// 3 s later. FAILS when the visible page shifts (CLS > 0.01) or a block moves after the reveal. The reveal itself: ONE fade (opacity).
//   node tests/integration/you-open.mjs "<chromium>"        (scripts/serve.mjs --emu + the emulators)
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
process.env.GCLOUD_PROJECT ||= 'demo-arcade';
import { guardUrl } from './kit/live-guard.mjs';
import puppeteer from './kit/puppeteer.mjs';
import { fb } from '../../api/_lib/fb.js';
import { deleteApp } from 'firebase-admin/app';
import { profileAction } from '../../api/profile.js';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };
const browser = await puppeteer.launch({ executablePath: process.argv[2], headless: true });
try {
  const p = await browser.newPage();
  await p.evaluateOnNewDocument(() => {
    try { localStorage.setItem('nd:entered', '1'); localStorage.setItem('na:yo1:profile', JSON.stringify({ name: 'AVA', color: 'cyan', avatar: 'bolt' })); } catch { /* fine */ }
    window.__ls = [];
    try { new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__ls.push({ t: e.startTime, v: e.value, n: (e.sources || []).map(s => (s.node && s.node.className) || '?').join(',') }); }).observe({ type: 'layout-shift', buffered: true }); } catch { /* fine */ }
  });
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  p.on('pageerror', e => fails.push(`page error: ${e.message}`));
  await p.goto(guardUrl(`${BASE}/?emu&slot=yo1&city=2&idle=1`, 'you-open.mjs'));
  await p.waitForFunction('!!(window.__district && window.__district.harbor() && window.__district.harbor().shown && window.__arcade.state.uid)', { timeout: 60000 });
  const uid = await p.evaluate('window.__arcade.state.uid');
  await profileAction(uid, { action: 'ensure', name: 'Ava', avatar: 'bolt', color: 'cyan' }, '', Date.now() - 7 * 864e5);
  await sleep(1500);
  for (let round = 1; round <= 2; round++) {
    const t0 = await p.evaluate(() => { window.__ls = []; window.__seen = null; const t = performance.now(); import('/js/store.js').then(m => m.setState({ view: 'profile' })); return t; });
    // every frame: once the page is visible (its scroll's opacity > 0.5), the blocks' places are recorded; then 3 s more
    const r = await p.evaluate(async () => {
      const out = { first: null, last: null, vis: -1 };
      const place = () => [...document.querySelectorAll('.pf-scroll > *')].map(e => { const b = e.getBoundingClientRect(); return `${(e.className || e.tagName).toString().split(' ')[0]}:${Math.round(b.top)}:${Math.round(b.height)}`; });
      const t0 = performance.now();
      await new Promise(res => { const f = () => { const sc = document.querySelector('.pf-screen .pf-scroll'); const op = sc ? +getComputedStyle(sc).opacity : 0; if (sc && op > 0.5 && !out.first) { out.first = place(); out.vis = performance.now(); } if (out.first && performance.now() - out.vis > 3000) { out.last = place(); res(); return; } if (performance.now() - t0 > 12000) { res(); return; } requestAnimationFrame(f); }; requestAnimationFrame(f); });
      return { ...out, ls: window.__ls.slice(), why: (document.querySelector('.pf-screen') || {}).dataset ? document.querySelector('.pf-screen').dataset.revealed : '' };
    });
    const after = r.ls.filter(e => e.t >= r.vis - 5), cls = +after.reduce((a, e) => a + e.v, 0).toFixed(4), all = +r.ls.reduce((a, e) => a + e.v, 0).toFixed(4);
    const moved = r.first && r.last ? r.first.filter((x, i) => x !== r.last[i]) : ['never shown'];
    console.log(`  · round ${round}: shown ${Math.round(r.vis - t0)} ms after the tap (${r.why || 'no gate'}) · CLS on screen ${cls} (every shift, unseen ones too: ${all}) · ${after.map(e => `${e.v.toFixed(3)} ${e.n}`).join(' | ') || 'no shift'}`);
    ok(cls <= 0.01, `round ${round}: the YOU screen opens with NO visible layout shift (CLS ${cls})`);
    ok(moved.length === 0, `round ${round}: no block moves after it shows (${moved.length ? moved.join(' ; ') : 'every block where it first showed'})`);
    if (process.env.SHOTS && round === 1) await p.screenshot({ path: `${process.env.SHOTS}/you-open-390.png` });
    await p.evaluate(() => import('/js/store.js').then(m => m.setState({ view: 'title' })));
    await sleep(1500);
  }
} catch (e) { console.log('CRASH', e && e.stack || e); fails.push(String(e && e.message)); }
finally { await browser.close(); try { await deleteApp(fb().app); } catch { /* fine */ } }
console.log(`\n${checks - fails.length}/${checks} checks${fails.length ? ` — FAILED:\n  ${fails.join('\n  ')}` : ' — all green'}`);
process.exit(fails.length ? 1 : 0);
