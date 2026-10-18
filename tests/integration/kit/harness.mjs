// The E2E harness every game suite shares: N phones in separate browser contexts, create/join a room, screenshots at
// the review sizes, the state poller, real CDP touch, the host killer, the frame-pacing run, the final report.
//
//   import { createHarness } from './kit/harness.mjs';
//   const H = await createHarness({ name: 'gridlock', slot: 'g', hook: '__gridlock', sizes: [[390, 844], [412, 915], [1440, 900]] });
//   const host = await H.joinAll(N);  … H.ok(cond, 'what');  await H.waitFor(page, s => s.game.phase === 'play', 'GO');
//   await H.finish();        // prints checks n/m, writes result.json, exits 1 on any failure
//
// Env: N (players), SHOTS=0 (no screenshots), GPU=1 (real GPU; default software WebGL), CPU=4 (throttle for perf runs),
// PERF=0/1, FAST=1 (the suite's own short path), E2E_BASE (default the local server).
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';

export const NAMES = ['ALICE', 'BOB', 'CHARLIE', 'DANA', 'EVE', 'FINN', 'GRACE', 'HAL'];
export const VIEW = { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true };
export const PHONE_SIZES = [[390, 844], [412, 915]];
export const REVIEW_SIZES = [[390, 844], [412, 915], [1440, 900]];
export const BAD_TEXT = /\bnull\b|\bundefined\b|\bNaN\b|\[object Object\]/;
const CONSOLE_NOISE = /ERR_|Failed to load resource|favicon|permission_denied|PERMISSION_DENIED|Client is offline|net::|WebGL|GPU stall/i;

export async function createHarness({ name, slot = 'e', hook = null, sizes = REVIEW_SIZES, out = process.argv[3] || `./shots-${name}`, browserPath = process.argv[2], warnPattern = /game view/, extraArgs = [] } = {}) {
  const OUT = out.replace(/\/?$/, '/');
  mkdirSync(OUT, { recursive: true });
  const BASE = process.env.E2E_BASE || 'http://localhost:5173';
  const N = Number(process.env.N || 8);
  const SHOTS = process.env.SHOTS !== '0';
  const CPU = Number(process.env.CPU || 4);
  const FAST = process.env.FAST === '1';
  const t0 = Date.now();
  const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const errors = [];
  const checks = [];
  const ok = (cond, what) => { checks.push({ what, ok: !!cond }); log(cond ? 'OK  ' : 'FAIL', what); if (!cond) errors.push(`check failed: ${what}`); return !!cond; };
  const fail = m => { throw new Error(m); };

  const browser = await puppeteer.launch({
    executablePath: browserPath, headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
      ...(process.env.GPU ? ['--enable-gpu', '--use-angle=d3d11'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']), ...extraArgs],
  });
  const pages = [], ctxs = [], uids = [];
  const dead = new Set();
  let code = '';

  async function openPlayer(i, qs = '') {
    const ctx = ctxs[i] || (ctxs[i] = await browser.createBrowserContext());
    const page = await ctx.newPage();
    page.on('pageerror', e => { const m = `${NAMES[i]} pageerror: ${e.message}`; if (errors.includes(m)) return; errors.push(m); log(`${NAMES[i]} PAGEERROR`, e.message); });
    page.on('console', m => {
      const t = m.text();
      if (/^warn/.test(m.type()) && warnPattern.test(t)) errors.push(`${NAMES[i]}: ${t}`);
      if (m.type() === 'error' && !CONSOLE_NOISE.test(t)) { errors.push(`${NAMES[i]}: ${t}`); log(`${NAMES[i]} console.error`, t); }
    });
    await page.setViewport(VIEW);
    await page.goto(`${BASE}/?emu&slot=${slot}${i}${qs ? '&' + qs : ''}`);
    pages[i] = page;
    return page;
  }
  async function shotAll(page, shotName, which = sizes) {
    if (!SHOTS) return;
    for (const [w, h] of which) {
      // isMobile stays on: toggling it makes puppeteer reload the page
      await page.setViewport({ width: w, height: h, deviceScaleFactor: w >= 1200 ? 1 : 2, isMobile: true, hasTouch: true });
      await sleep(650);
      await page.screenshot({ path: `${OUT}${shotName}-${w}x${h}.png` });
    }
    await page.setViewport(VIEW);
    await sleep(250);
  }
  const shot = (page, shotName) => (SHOTS ? page.screenshot({ path: `${OUT}${shotName}.png` }) : null);
  const evalIn = (page, fn, arg) => page.evaluate(`(async () => { const s = window.__arcade.state; return (${fn})(s, ${JSON.stringify(arg ?? null)}); })()`);
  async function waitFor(page, fn, what, timeout = 30000, arg) {
    const end = Date.now() + timeout;
    while (Date.now() < end) { try { if (await evalIn(page, fn, arg)) return true; } catch { /* busy */ } await sleep(150); }
    fail(`timeout: ${what}`);
  }
  const alive = () => pages.map((p, i) => i).filter(i => pages[i] && !dead.has(i));
  const idx = uid => uids.indexOf(uid);
  const nameOf = uid => NAMES[idx(uid)] || uid;
  const game = page => evalIn(page, s => s.game);
  // run an expression (or statements, when it contains ';') against the game's test hook
  const G = (page, js) => page.evaluate(js.includes(';') ? `window.${hook} && (function () { ${js} }())` : `window.${hook} && (${js})`);

  async function createRoom() {
    const host = await openPlayer(0);
    await host.waitForSelector('.nd-host', { timeout: 20000 });
    for (let k = 0; k < 5 && !(await host.$('.setup-screen input.input')); k++) { await host.click('.nd-host').catch(() => {}); await host.waitForSelector('.setup-screen input.input', { timeout: 6000 }).catch(() => {}); }
    await host.type('.setup-screen input.input', NAMES[0]);
    await host.click('.form-cta .btn-primary');
    await host.waitForSelector('.lobby-screen .room-code', { timeout: 20000 });
    code = await evalIn(host, s => s.code);
    log('room', code);
    uids[0] = await evalIn(host, s => s.uid);
    return host;
  }
  async function join(i) {
    const p = await openPlayer(i, `room=${code}`);
    await p.waitForSelector('.nd-go', { timeout: 20000 });
    await p.waitForFunction(() => !document.getElementById('boot'), { timeout: 15000 });
    await p.click('.nd-go');
    await p.waitForSelector('.input-code');
    await p.type('.setup-screen input.input:not(.input-code)', NAMES[i]);
    await p.click('.form-cta .btn-primary');
    await p.waitForSelector('.lobby-screen', { timeout: 20000 });
    uids[i] = await evalIn(p, s => s.uid);
    return p;
  }
  async function joinAll(n = N) {
    const host = await createRoom();
    for (let i = 1; i < n; i++) await join(i);
    await waitFor(host, (s, k) => Object.keys(s.players).length === k, `${n} players`, 30000, n);
    return host;
  }
  async function hostIdx() { for (const i of alive()) { try { if (await evalIn(pages[i], s => s.meta && s.meta.hostId === s.uid)) return i; } catch { /* */ } } return alive()[0]; }
  const startGame = (page, id, settings) => page.evaluate((gid, st) => import('/js/host.js').then(m => m.startGame(gid, st)), id, settings);
  const backToLobby = page => page.evaluate(() => import('/js/host.js').then(m => m.backToLobby()));
  const rematch = page => page.evaluate(() => import('/js/host.js').then(m => m.rematch()));
  /** Close a phone for good (the host, a target…): the room sees SIGNAL LOST, then a new host claims. */
  async function kill(i) { await pages[i].close(); dead.add(i); log('killed', NAMES[i]); }
  /** Kill whoever is host (never `keep`), return the new host's index once the room has one. */
  async function killHost({ keep = [], timeout = 40000 } = {}) {
    const hi = await hostIdx();
    const victim = keep.includes(hi) ? null : hi;
    if (victim == null) return hi;
    log('killing host', NAMES[victim]);
    await kill(victim);
    const other = pages[alive()[0]];
    await waitFor(other, (s, old) => s.meta && s.meta.hostId && s.meta.hostId !== old, 'a new host', timeout, uids[victim]);
    return hostIdx();
  }
  async function refresh(page, waitSel = null, timeout = 25000) { await page.reload(); if (waitSel) await page.waitForSelector(waitSel, { timeout }); }
  // a real finger through CDP: down, a path of moves, up
  async function touch(page, pts, dtMs = 16) {
    const c = await page.target().createCDPSession();
    const base = Date.now() / 1000; let k = 0;
    const ev = (type, [x, y]) => c.send('Input.dispatchTouchEvent', { type, timestamp: base + (k++) * dtMs / 1000, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
    await ev('touchStart', pts[0]);
    for (const p of pts.slice(1)) { await ev('touchMove', p); await sleep(dtMs); }
    await ev('touchEnd', pts[pts.length - 1]);
    await c.detach();
    await sleep(150);
  }
  async function press(page, ms, x = 200, y = 600) {
    const c = await page.target().createCDPSession();
    await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
    await sleep(ms);
    await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await c.detach();
  }
  const line = (x0, y0, x1, y1, n) => Array.from({ length: n + 1 }, (_, i) => [x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n]);
  const tap = (page, x, y) => touch(page, [[x, y], [x, y]], 40);
  /** No "null"/"undefined"/"NaN" visible inside `selector` (the game's root). */
  async function cleanText(page, where, selector = 'body') {
    const t = await page.evaluate(sel => (document.querySelector(sel) || document.body).innerText, selector);
    const m = t.match(BAD_TEXT);
    const near = m ? `: …${t.slice(Math.max(0, m.index - 30), m.index + 20).replace(/\s+/g, ' ')}…` : '';
    return ok(!m, `TEXT: no stray "null"/"undefined" on screen (${where}${near})`);
  }
  /**
   * Frame pacing at every tier under CPU throttling. The hook must expose setTier(t), tier(), fps() (frame ms) and work()
   * (CPU ms per frame); `extra` (per tier) may add stats. Passes at a 60 fps median.
   */
  async function perfRun(page, { viewport = { width: 844, height: 390 }, settle = 4500, tiers = [2, 1, 0], extra = null } = {}) {
    const cdp = await page.target().createCDPSession();
    await page.setViewport({ ...viewport, deviceScaleFactor: process.env.GPU ? 2.75 : 1, isMobile: true, hasTouch: true });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
    const perf = [];
    for (const t of tiers) {
      await G(page, `window.${hook}.setTier(${t})`);
      await sleep(settle);
      const f = await G(page, `window.${hook}.fps()`);
      const w = await G(page, `window.${hook}.work()`);
      const s2 = [...f].sort((a, b) => a - b), w2 = [...w].sort((a, b) => a - b);
      const row = { tier: t, after: await G(page, `window.${hook}.tier()`), p50: +(s2[Math.floor(s2.length * 0.5)] || 0).toFixed(1), p95: +(s2[Math.floor(s2.length * 0.95)] || 0).toFixed(1), work75: +(w2[Math.floor(w2.length * 0.75)] || 0).toFixed(1), n: s2.length };
      if (extra) row.stats = await extra(page, t);
      perf.push(row);
    }
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await page.setViewport(VIEW);
    log('frame pacing', JSON.stringify(perf));
    writeFileSync(`${OUT}perf.json`, JSON.stringify(perf, null, 1));
    ok(perf.every(x => x.p50 <= 17.5), `PERF: ${CPU}× CPU — 60 fps median at every tier (${perf.map(x => `t${x.tier}: p50 ${x.p50} / p95 ${x.p95} / work ${x.work75} ms`).join(' · ')})`);
    return perf;
  }
  async function finish(fatal = null) {
    if (fatal && fatal.message !== 'done') { errors.push(`FATAL: ${fatal.message}`); log('FATAL', fatal.stack || fatal.message); }
    const passed = checks.filter(c => c.ok).length;
    log(`checks ${passed}/${checks.length} passed`);
    log('errors:', errors.length ? '\n  ' + errors.join('\n  ') : 'none');
    writeFileSync(`${OUT}result.json`, JSON.stringify({ checks, errors }, null, 1));
    await browser.close();
    process.exit(errors.length ? 1 : 0);
  }
  /** Run the suite body: any throw becomes FATAL, and the report + exit always happen. */
  async function run(body) { try { await body(); await finish(); } catch (e) { await finish(e); } }

  return {
    OUT, BASE, N, SHOTS, CPU, FAST, NAMES, VIEW, sizes, browser, pages, ctxs, uids, dead, log, sleep, ok, fail, errors, checks,
    get code() { return code; }, openPlayer, shotAll, shot, evalIn, waitFor, alive, idx, nameOf, game, G, createRoom, join, joinAll,
    hostIdx, startGame, backToLobby, rematch, kill, killHost, refresh, touch, press, tap, line, cleanText, perfRun, finish, run,
  };
}
