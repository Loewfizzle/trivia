// OVERCLOCK OC8 — A6 (THE FABLE REVIEW): a POOL challenge FIRST on a SLOW connection. Every phone on Chrome's "Fast 3G" profile (1.6 Mbps down,
// ~560 ms latency — puppeteer's own numbers); TRIVIA LIGHTNING forced first on every phone (`?emu` + window.__ocFirst — deal.js#orderFor); a
// QUICK match started by the host. The proof: every phone starts fetching data/oc/trivia.json DURING THE WALK INSIDE (from meta/go — before the
// match is written), the host's deal carries the night memory for it (game/dk/0 — never the seeded fallback), and the challenge opens on its
// questions (no SYNCING).
//   node tests/integration/e2e-oc-slow.mjs "<browser path>" ./shots-oc-slow      (N=2 phones by default; LATE=1 = the host's pool held 1.5 s more (on top of its 3G transfer)
//   → start() misses it and THE LATE DEAL deals it during the rules card — both runs are part of the pass's check)
import puppeteer from './kit/puppeteer.mjs'; // (+ --mute-audio, the live-site guard: kit/puppeteer.mjs)
import { mkdirSync, writeFileSync } from 'node:fs';

const BROWSER = process.argv[2];
const OUT = (process.argv[3] || './shots').replace(/\/?$/, '/');
mkdirSync(OUT, { recursive: true });
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const N = Number(process.env.N || 2);
const HOLD = Number(process.env.HOLD || 6000);   // (LATE=1: how long the host's trivia request is held)
const NAMES = ['ALICE', 'BOB', 'CHARLIE', 'DANA'];
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = [], checks = [];
const ok = (cond, what) => { checks.push({ what, ok: !!cond }); log(cond ? 'OK  ' : 'FAIL', what); if (!cond) errors.push(`check failed: ${what}`); };
const fail = m => { throw new Error(m); };
const VIEW = { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true };
// (puppeteer's PredefinedNetworkConditions['Fast 3G'])
// (FRIENDS C — THE SLOW-3G START: SLOW=1 = Chrome's "Slow 3G" — puppeteer's PredefinedNetworkConditions['Slow 3G']: 400 kbps, 2 s latency)
const NET = process.env.SLOW === '1' ? { download: ((500 * 1000) / 8) * 0.8, upload: ((500 * 1000) / 8) * 0.8, latency: 400 * 5 } : { download: ((1.6 * 1000 * 1000) / 8) * 0.9, upload: ((750 * 1000) / 8) * 0.9, latency: 150 * 3.75 };

const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, args: ['--autoplay-policy=user-gesture-required', '--mute-audio'] });
const pages = [];
async function openPlayer(i, qs = '') {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  if (process.env.MOUNT === '1') await page.evaluateOnNewDocument(() => { window.__wireDelay = 1e9; });   // (FRIENDS C: the lobby's own wiring off — the test decides A / B)
  page.on('pageerror', e => { errors.push(`${NAMES[i]} pageerror: ${e.message}`); log(`${NAMES[i]} PAGEERROR`, e.message); });
  await page.setViewport(VIEW);
  await page.goto(`${BASE}/?emu&slot=s${i}${qs ? '&' + qs : ''}`);
  pages[i] = page;
  return page;
}
const evalIn = (page, fn, arg) => page.evaluate(`(async () => { const s = window.__arcade.state; return (${fn})(s, ${JSON.stringify(arg ?? null)}); })()`);
async function waitFor(page, fn, what, timeout = 30000, arg) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { try { if (await evalIn(page, fn, arg)) return true; } catch { /* busy */ } await sleep(100); }
  fail(`timeout: ${what}`);
}
const tapReal = async (page, sel) => { const el = await page.waitForSelector(sel, { timeout: 20000 }); await el.tap(); };

try {
  const host = await openPlayer(0);
  await host.waitForSelector('.nd-host', { timeout: 30000 });
  for (let k = 0; k < 5 && !(await host.$('.setup-screen input.input')); k++) {
    await tapReal(host, '.nd-host').catch(() => {});
    await host.waitForSelector('.setup-screen input.input', { timeout: 6000 }).catch(() => {});
  }
  await host.type('.setup-screen input.input', NAMES[0]);
  await tapReal(host, '.form-cta .btn-primary');
  await host.waitForSelector('.title-screen.is-room .rdk-dock', { timeout: 30000 });
  const code = await evalIn(host, s => s.code);
  log('room', code);
  for (let i = 1; i < N; i++) {
    const p = await openPlayer(i, `room=${code}`);
    await p.waitForSelector('.nd-go', { timeout: 30000 });
    await p.waitForFunction(() => !document.getElementById('boot'), { timeout: 20000 });
    await tapReal(p, '.nd-go');
    await p.waitForSelector('.input-code');
    await p.type('.setup-screen input.input:not(.input-code)', NAMES[i]);
    await tapReal(p, '.form-cta .btn-primary');
    await p.waitForSelector('.title-screen.is-room', { timeout: 30000 });
  }
  await waitFor(host, (s, n) => Object.keys(s.players).length === n, `${N} players`, 30000, N);
  // every phone: THE 3G PROFILE from here on (the pools come over HTTP), TRIVIA first, and a watch on the bank's request + the start's stamp
  for (const p of pages) {
    const cdp = await p.target().createCDPSession();
    await cdp.send('Network.enable');
    if (process.env.NET !== '0') await cdp.send('Network.emulateNetworkConditions', { offline: false, downloadThroughput: NET.download, uploadThroughput: NET.upload, latency: NET.latency });
    await p.evaluate(() => {
      window.__ocFirst = 'trivia';
      const S = window.__slow = { req: null, done: null, go: null, game: null, mount: null, playAt: null, liveAt: null, synced: null };
      new PerformanceObserver(l => { for (const e of l.getEntries()) if (/data\/oc\/trivia\.json/.test(e.name) && S.req == null) { S.req = performance.timeOrigin + e.startTime; S.done = performance.timeOrigin + e.responseEnd; } }).observe({ type: 'resource' });
      const iv = setInterval(() => {
        const st = window.__arcade.state;
        if (!S.go && st.meta && st.meta.go) S.go = Date.now();
        if (!S.game && st.game && st.game.id === 'overclock') S.game = Date.now();
        if (S.go && !S.mount && document.querySelector('.oc-stage')) S.mount = Date.now();
        if (S.game && !S.playAt && st.game.phase === 'play') { S.playAt = Date.now(); S.dealAtPlay = !!(st.game.deal && st.game.deal[0]); }
        if (S.playAt && !S.liveAt && st.liveKey && st.liveKey.includes(`"oc/${st.game.matchId}/0"`)) S.liveAt = Date.now();
        if (S.playAt && !S.synced && document.querySelector('.oc-trivia .oc-tile')) { S.synced = Date.now(); clearInterval(iv); }
      }, 20);
    });
  }
  log(`every phone on ${process.env.SLOW === '1' ? 'Slow' : 'Fast'} 3G`, JSON.stringify(NET));
  // LATE=1: the HOST's trivia request held 1.5 s more — start() can't have it; THE LATE DEAL (index.js#prepare) must deal it before it opens
  if (process.env.LATE === '1') {
    await host.setRequestInterception(true);
    host.on('request', req => { if (/data\/oc\/trivia\.json/.test(req.url())) setTimeout(() => req.continue().catch(() => {}), HOLD); else req.continue().catch(() => {}); });
    log(`LATE=1: the host trivia pool held ${HOLD} ms`);
  }
  // (MOUNT=1 + LOBBY=ms: B — a lobby that long on the slow line, the guests wiring the cartridges in it — else A: the start at once, no wiring)
  if (process.env.MOUNT === '1' && Number(process.env.LOBBY || 0) > 0) {
    for (const p of pages.slice(1)) await p.evaluate(() => import('/js/games/registry.js').then(R => { for (const id of Object.keys(R.META)) R.wireGame(id); }));
    log(`B: ${process.env.LOBBY} ms in the lobby on the slow line (the guests wiring the cartridges)`); await sleep(Number(process.env.LOBBY));
  }
  await host.evaluate(() => import('/js/host.js').then(m => m.startGame('overclock', { mode: 'quick' })));
  await waitFor(host, s => s.game && s.game.id === 'overclock', 'overclock started', 30000);
  // (FRIENDS C — THE SLOW-3G START: MOUNT=1 measures only when each phone's MATCH SCREEN mounts after the start's stamp, then stops — the
  //  guest within ~2 s of the host. Before / after in docs/harbor/passes/friends-c.md)
  if (process.env.MOUNT === '1') {
    for (const p of pages) await p.waitForFunction(() => window.__slow && window.__slow.mount, { timeout: 60000 }).catch(() => {});
    const M = [];
    for (const [i, p] of pages.entries()) { const S = await p.evaluate(() => window.__slow); M.push(S.mount && S.go ? S.mount - S.go : null); log(`${NAMES[i]}${i ? '' : ' (host)'}: the match screen mounted ${M[i]} ms after the start's stamp (the walk = 5000)`); }
    const gap = M.every(v => v != null) ? Math.max(...M.slice(1)) - M[0] : null;
    ok(gap != null && gap < 2000, `THE SLOW-3G START: the guest's match screen ${gap} ms after the host's (${process.env.SLOW === '1' ? 'Slow' : 'Fast'} 3G)`);
    await browser.close(); console.log(`\nchecks ${checks.filter(c => c.ok).length}/${checks.length} passed`); process.exit(errors.length ? 1 : 0);
  }
  const g0 = await evalIn(host, s => ({ order: s.game.order, dk: s.game.dk || null }));
  ok(g0.order[0] === 'trivia', `the order: TRIVIA first (${g0.order.join(' ')})`);
  log(`at the start: ${g0.dk && g0.dk[0] ? 'TRIVIA dealt in start()' : 'TRIVIA not dealt yet — THE LATE DEAL (prepare) owes it'}`);
  // (OC8 — A6: start() deals what arrived inside the walk; THE LATE DEAL deals a pool that came later, before its challenge opens)
  await waitFor(host, s => (s.game.dk && s.game.dk[0]) || s.game.phase === 'play', 'TRIVIA dealt or the challenge open', 30000);
  const g = await evalIn(host, s => ({ dk: s.game.dk || null, phase: s.game.phase }));
  ok(!!(g.dk && /tv-/.test(String(g.dk[0] || ''))) && g.phase === 'ready', `THE NIGHT MEMORY: the host dealt TRIVIA's three by id${process.env.NET === '0' ? '' : ' on 3G'}, before it opened (${g.dk && g.dk[0]})`);
  for (const [i, p] of pages.entries()) await p.waitForFunction(() => window.__slow && window.__slow.synced, { timeout: 40000 }).catch(() => fail(`${NAMES[i]}: TRIVIA's questions never came up`));
  for (const [i, p] of pages.entries()) {
    const S = await p.evaluate(() => window.__slow);
    log(NAMES[i], JSON.stringify({ reqAfterGo: S.req && S.go ? Math.round(S.req - S.go) : null, doneAfterGo: S.done && S.go ? Math.round(S.done - S.go) : null, gameAfterGo: S.game && S.go ? S.game - S.go : null, playAfterGo: S.playAt && S.go ? S.playAt - S.go : null, liveSync: S.liveAt && S.playAt ? S.liveAt - S.playAt : null, synced: S.synced && S.playAt ? S.synced - S.playAt : null, mountAfterGo: S.mount && S.go ? S.mount - S.go : null }));
    // (the walk inside = 5 s; a phone that isn't the host loads the cartridge's own modules first over the same 3G line)
    ok(S.req != null && S.go != null && S.req - S.go < 5000 && (!S.game || S.req <= S.game), `${NAMES[i]}: the trivia pool's fetch began IN THE WALK (${S.req && S.go ? Math.round(S.req - S.go) : '?'} ms after the start's stamp, before the match was written)`);
    ok(S.dealAtPlay === true, `${NAMES[i]}: the deal was on this phone before the challenge opened (every phone builds the same three)`);
    ok(S.done != null && S.playAt != null && S.done < S.playAt, `${NAMES[i]}: the pool was in before the challenge opened (${S.done && S.playAt ? Math.round(S.playAt - S.done) : '?'} ms to spare)`);
    // the questions follow the room's own live-path sync at once (its 3G round trip is the console's — measured, not the pool)
    // (KNOWN — OC8's log: on Fast 3G the match SCREEN itself mounts late — the cartridge's view + its ~40 modules load in a waterfall during the
    //  walk; unthrottled it mounts at the walk's end, 5.1 s. Measured here, not a fail: the pool is what A6 is about)
    const ready = Math.max(S.playAt || 0, S.liveAt || 0, S.mount || 0);
    log(`${NAMES[i]}: the match screen mounted ${S.mount && S.go ? S.mount - S.go : '?'} ms after the start's stamp (the walk = 5000)`);
    ok(S.synced != null && S.synced - ready < 400, `${NAMES[i]}: the pool is never the wait — the questions on screen ${S.synced - ready} ms after the challenge could open (screen mounted + the room's live paths synced)`);
  }
  await pages[N - 1].screenshot({ path: `${OUT}slow-first-trivia-390.png` });
  log('checks', `${checks.filter(c => c.ok).length}/${checks.length} passed`);
  log('errors', errors.length ? errors : 'none');
  if (errors.length || checks.some(c => !c.ok)) process.exitCode = 1;
} catch (e) {
  log('FAILED', e.message);
  errors.push(e.message);
  try { if (pages[N - 1]) await pages[N - 1].screenshot({ path: `${OUT}slow-fail.png` }); } catch { /* */ }
  process.exitCode = 1;
} finally {
  writeFileSync(`${OUT}oc-slow-report.json`, JSON.stringify({ checks, errors }, null, 2));
  await browser.close();
}
