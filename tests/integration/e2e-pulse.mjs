// PULSE end to end: N players in separate browser contexts (default 3; N=8 for the big run).
//   node e2e-pulse.mjs "<browser path>" ./shots
// Env: N=8 players · SONG=pulse3 · DIFF=hard · COUNT=1|2 · ECHO=on|off · QUICK=1 (stop after a short slice of the song)
// Covers: lobby card + host options, first-run calibration (a bot taps 40 ms late → ~+40 ms saved), sound unlock,
// load → synced start, a bot per player with its own timing (perfect / late / sloppy / idle), chords (multi-touch),
// live leaderboard, a refresh mid-song (resumes at the right position), backgrounding, the quality-tier fallback
// under CPU throttling, frame pacing on a throttled "mid-range phone", Echo rounds, standings, podium + stats.
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const BROWSER = process.argv[2];
const OUT = (process.argv[3] || './shots').replace(/\/?$/, '/');
mkdirSync(OUT, { recursive: true });
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const N = Number(process.env.N || 3);
const SONG = process.env.SONG || 'pulse3';
const DIFF = process.env.DIFF || 'hard';
const COUNT = Number(process.env.COUNT || 1);
const ECHO = process.env.ECHO || 'on';
const NAMES = ['ALICE', 'BOB', 'CHARLIE', 'DANA', 'EVE', 'FINN', 'GRACE', 'HAL'];
// how each bot plays: ms offset from the note, jitter, chance to skip a note
const STYLE = [
  { off: 0, jitter: 6, skip: 0 },        // ALICE: near-perfect
  { off: 62, jitter: 8, skip: 0.02 },    // BOB: late → GREATs
  { off: -20, jitter: 70, skip: 0.08 },  // CHARLIE: sloppy
  { off: 15, jitter: 20, skip: 0.05 },
  { off: -35, jitter: 25, skip: 0.1 },
  { off: 100, jitter: 15, skip: 0.04 },  // FINN: GOODs
  { off: 0, jitter: 40, skip: 0.2 },
  { off: 5, jitter: 10, skip: 0 },
];
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = [];
const fail = m => { throw new Error(m); };

const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, args: ['--autoplay-policy=user-gesture-required', '--mute-audio'] });
const pages = [];

async function openPlayer(i, qs = '') {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  page.on('pageerror', e => { errors.push(`${NAMES[i]} pageerror: ${e.message}`); log(`${NAMES[i]} PAGEERROR`, e.message); });
  page.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/ERR_|Failed to load resource|favicon/i.test(t)) { errors.push(`${NAMES[i]}: ${t}`); log(`${NAMES[i]} console.error`, t); } });
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(`${BASE}/?emu&slot=p${i}${qs ? '&' + qs : ''}`);
  pages[i] = page;
  return page;
}
async function shotBoth(page, name) {
  for (const [w, h] of [[390, 844], [412, 915]]) {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await sleep(260);
    await page.screenshot({ path: `${OUT}${name}-${w}.png` });
  }
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
}
const evalIn = (page, fn, arg) => page.evaluate(`(async () => { const s = window.__arcade.state; return (${fn})(s, ${JSON.stringify(arg ?? null)}); })()`);
async function waitFor(page, fn, what, timeout = 30000, arg) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    try { if (await evalIn(page, fn, arg)) return; } catch { /* page busy */ }
    await sleep(150);
  }
  fail(`timeout: ${what}`);
}
const click = (page, sel) => page.evaluate(s => { const el = document.querySelector(s); if (!el) throw new Error('no ' + s); el.click(); }, sel);
const tapReal = async (page, sel) => { const el = await page.waitForSelector(sel, { timeout: 15000 }); await el.tap(); }; // trusted gesture: unlocks audio

// in-page bot: plays the chart with a timing style; Echo too
const BOT = `(style) => {
  const V = window.__pulseView;
  if (!V || window.__bot) return;
  window.__bot = true;
  const canvas = document.querySelector('.pl-canvas');
  let next = 0, pid = 10, lastNotes = null;
  const rnd = () => Math.random();
  const lanePoint = lane => { const g = V.geometry(); const lo = (lane - 1) * (2 / 3); return { x: (g.cx + lo * g.halfW) / g.dpr, y: g.yHit / g.dpr }; };
  const fire = lane => { const p = lanePoint(lane); const id = pid++;
    canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: p.x, clientY: p.y, pointerId: id, bubbles: true, cancelable: true, pointerType: 'touch' }));
    setTimeout(() => canvas.dispatchEvent(new PointerEvent('pointerup', { clientX: p.x, clientY: p.y, pointerId: id, bubbles: true, pointerType: 'touch' })), 40); };
  const echoDone = new Set();
  function loop() {
    requestAnimationFrame(loop);
    const st = window.__arcade.state;
    const game = st.game;
    if (!game) return;
    if (game.phase === 'song') {
      const notes = V.notes();
      if (!notes) return;
      if (notes !== lastNotes) { lastNotes = notes; next = 0; }
      const t = V.songTime();
      while (next < notes.length && notes[next][0] < t - 0.2) next++;
      while (next < notes.length && notes[next][0] + style.off / 1000 + (rnd() - 0.5) * style.jitter / 1000 <= t) {
        if (rnd() >= style.skip) fire(notes[next][1]);
        next++;
      }
    } else if (game.phase === 'echo' && game.echoStartAt) {
      const e = V.echo();
      if (!e) return;
      const el = Date.now() + (window.__srvOff || 0) - game.echoStartAt;
      e.plan.rounds.forEach((r, ri) => {
        if (echoDone.has(ri) || el < r.repeatAt - 200 || el > r.repeatAt) return;
        echoDone.add(ri);
        e.plan.patterns[ri].notes.forEach(n => setTimeout(() => fire(n.lane), Math.max(0, r.repeatAt - el + n.beat * r.beat + style.off + (rnd() - 0.5) * style.jitter)));
      });
    }
  }
  requestAnimationFrame(loop);
}`;

try {
  // ---------------- lobby
  const host = await openPlayer(0);
  await host.waitForSelector('.title-actions .btn-primary', { timeout: 20000 });
  await tapReal(host, '.title-actions .btn-primary');
  await host.waitForSelector('.setup-screen input.input');
  await host.type('.setup-screen input.input', NAMES[0]);
  await tapReal(host, '.form-cta .btn-primary');
  await host.waitForSelector('.lobby-screen .room-code', { timeout: 20000 });
  const code = await evalIn(host, s => s.code);
  log('room', code);
  for (let i = 1; i < N; i++) {
    const p = await openPlayer(i, `room=${code}`);
    await p.waitForSelector('.invite-card', { timeout: 20000 });
    await tapReal(p, '.invite-card');
    await p.waitForSelector('.input-code');
    await p.type('.setup-screen input.input:not(.input-code)', NAMES[i]);
    await tapReal(p, '.form-cta .btn-primary');
    await p.waitForSelector('.lobby-screen', { timeout: 20000 });
  }
  await waitFor(host, (s, n) => Object.keys(s.players).length === n, `${N} players`, 30000, N);
  log(`${N} players in the lobby`);
  await host.evaluate(() => document.querySelector('.game-card[data-theme="pulse"]').scrollIntoView({ block: 'center' }));
  await sleep(500);
  await shotBoth(host, 'p-01-lobby-card');
  await click(host, '.game-card[data-theme="pulse"]');
  await host.waitForSelector('.modal .opt-list .opt-row', { timeout: 10000 });
  await sleep(400);
  await click(host, `.opt-row[data-v="${SONG}"]`);
  await host.evaluate(({ diff, count, echo }) => {
    for (const [v] of [[diff], [String(count)], [echo]]) {
      const b = [...document.querySelectorAll('.modal .seg-btn')].find(x => x.dataset.v === v); b && b.click();
    }
  }, { diff: DIFF, count: COUNT, echo: ECHO });
  await shotBoth(host, 'p-02-options');
  await click(host, '.modal .btn-primary.btn-xl');
  await waitFor(host, s => s.game && s.game.id === 'pulse' && s.game.phase === 'load', 'pulse load phase', 20000);
  log('match started; songs', JSON.stringify(await evalIn(host, s => s.game.songs.map(x => x.id))));

  // ---------------- load: calibration on ALICE (bot taps 40 ms after each beat), others skip
  await host.waitForSelector('.pl-load-act .btn-primary', { timeout: 30000 });
  await sleep(600);
  await shotBoth(pages[1], 'p-03-load');
  await tapReal(host, '.pl-load-act .btn-primary');
  await host.waitForSelector('.pcal .pcal-actions .btn-primary', { timeout: 5000 });
  await sleep(300);
  await shotBoth(host, 'p-04-calibration');
  await host.evaluate(() => {
    const ring = document.querySelector('.pcal-ring');
    const pad = document.querySelector('.pcal-pad');
    // tap 40 ms after each beat starts (only when 'beat' is newly added — our own taps restyle the ring too)
    new MutationObserver(recs => {
      const began = recs.some(r => !/\bbeat\b/.test(r.oldValue || '')) && ring.classList.contains('beat');
      if (!began || document.querySelector('.pcal-label').textContent !== 'TAP') return;
      setTimeout(() => pad.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType: 'touch' })), 40);
    }).observe(ring, { attributes: true, attributeFilter: ['class'], attributeOldValue: true });
  });
  await tapReal(host, '.pcal .pcal-actions .btn-primary');
  await host.waitForSelector('.pcal.is-result', { timeout: 20000 });
  const calText = await host.$eval('.pcal-label', el => el.textContent);
  const calMs = parseInt(calText, 10);
  log('calibration tap offsets (ms)', await host.evaluate(() => JSON.stringify(((window.__pcal || {}).offsets || []).map(o => Math.round(o * 1000)))));
  log('calibration result', calText);
  await shotBoth(host, 'p-05-calibration-result');
  if (!(calMs >= 20 && calMs <= 85)) fail(`calibration should land near +40..60 ms, got ${calText}`);
  await tapReal(host, '.pcal .pcal-actions .btn-ghost');
  for (let i = 1; i < N; i++) {
    const p = pages[i];
    await p.waitForSelector('.pl-load-act .btn-primary', { timeout: 30000 });
    await tapReal(p, '.pl-load-act .btn-primary'); // opens calibration
    await p.waitForSelector('.pcal .pcal-actions .btn-ghost', { timeout: 5000 });
    await tapReal(p, '.pcal .pcal-actions .btn-ghost'); // skip for now
  }
  await waitFor(host, s => s.game.phase === 'song', 'everyone ready → synced start', 40000);
  const lead = await evalIn(host, s => s.game.songStartAt - (Date.now()));
  log(`song scheduled ${Math.round(lead)} ms ahead`);
  await sleep(700);
  await shotBoth(pages[1], 'p-06-intro');
  for (let i = 0; i < N; i++) await pages[i].evaluate(`(${BOT})(${JSON.stringify(STYLE[i % STYLE.length])})`);
  await sleep(Math.max(0, lead - 2600));
  await shotBoth(pages[1], 'p-07-countdown');

  // ---------------- play
  await waitFor(host, s => Date.now() > s.game.songStartAt + 9000, 'song under way', 30000);
  // frame pacing on a throttled "mid-range phone" (4x CPU) for BOB, quality tier allowed to adapt
  const cdp = await pages[1].createCDPSession();
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await sleep(9000); // let the quality tier settle first
  if (process.env.PROFILE) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start'); }
  const { d: pacing, longTasks } = await pages[1].evaluate(() => new Promise(res => {
    const lt = [];
    const po = new PerformanceObserver(l => l.getEntries().forEach(e => lt.push(Math.round(e.duration))));
    try { po.observe({ type: 'longtask' }); } catch { /* unsupported */ }
    const d = []; let last = performance.now(); let n = 0;
    const f = t => { d.push(t - last); last = t; if (++n < 300) requestAnimationFrame(f); else { po.disconnect(); res({ d, longTasks: lt }); } };
    requestAnimationFrame(f);
  }));
  log('long tasks during sampling (ms)', JSON.stringify(longTasks));
  if (process.env.PROFILE) {
    const { profile } = await cdp.send('Profiler.stop');
    const self = new Map();
    const dt = profile.timeDeltas || [];
    const byId = new Map(profile.nodes.map(n => [n.id, n]));
    profile.samples.forEach((id, i) => { const n = byId.get(id); const k = `${n.callFrame.functionName || '(anon)'} ${(n.callFrame.url || '').split('/').pop()}:${n.callFrame.lineNumber + 1}`; self.set(k, (self.get(k) || 0) + (dt[i] || 0)); });
    const total = [...self.values()].reduce((a, b) => a + b, 0);
    log('profile top self-time:\n' + [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 18).map(([k, v]) => `   ${(100 * v / total).toFixed(1)}%  ${k}`).join('\n'));
  }
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  const sorted = [...pacing].sort((a, b) => a - b);
  const fps = Math.round(1000 / (pacing.reduce((a, b) => a + b, 0) / pacing.length));
  const tierB = await pages[1].evaluate(() => window.__pulseView.tier());
  log(`mid-range profile (4x CPU): ${fps} fps, p95 frame ${sorted[Math.floor(sorted.length * 0.95)].toFixed(1)} ms, tier ${tierB}`);
  writeFileSync(`${OUT}pulse-perf.json`, JSON.stringify({ fps, p95: sorted[Math.floor(sorted.length * 0.95)], tier: tierB }));
  await shotBoth(pages[0], 'p-08-play');
  // quality fallback: heavy throttling on CHARLIE must step the tier down
  if (N > 2) {
    const c2 = await pages[2].createCDPSession();
    const before = await pages[2].evaluate(() => window.__pulseView.tier());
    await c2.send('Emulation.setCPUThrottlingRate', { rate: 12 });
    await sleep(7000);
    const after = await pages[2].evaluate(() => window.__pulseView.tier());
    await c2.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    log(`quality fallback under 12x CPU: ${before} → ${after}`);
    if (before === after && before !== 'low') fail('tier did not step down under heavy load');
  }
  // refresh mid-song: BOB comes back at the right position, judged notes kept, missed ones counted
  const beforeReload = await pages[1].evaluate(() => window.__pulseView.stats());
  await pages[1].reload();
  await pages[1].waitForSelector('.pl-canvas', { timeout: 20000 });
  await tapReal(pages[1], '.pl-canvas'); // a tap re-unlocks audio after a reload (as on a phone)
  await waitFor(pages[1], () => window.__pulseView && window.__pulseView.stats() && window.__pulseView.songTime() > 0, 'BOB resumed mid-song', 20000);
  await pages[1].evaluate(`(${BOT})(${JSON.stringify(STYLE[1])})`);
  await sleep(3000);
  const afterReload = await pages[1].evaluate(() => ({ st: window.__pulseView.stats(), t: window.__pulseView.songTime() }));
  log('BOB refresh mid-song', JSON.stringify({ before: beforeReload, after: afterReload.st, at: afterReload.t.toFixed(1) }));
  if (afterReload.st.n < beforeReload.n) fail('rejoin lost judged notes');
  if (afterReload.st.s < beforeReload.s * 0.9) fail('rejoin lost score');
  // backgrounding: DANA's tab goes to the background for 3 s, then comes back in sync
  if (N > 3) {
    await pages[0].bringToFront();
    await sleep(3000);
    await pages[3].bringToFront();
    await sleep(1500);
    const d = await pages[3].evaluate(() => ({ t: window.__pulseView.songTime(), st: window.__pulseView.stats() }));
    log('DANA back from background', JSON.stringify({ t: d.t.toFixed(1), m: d.st.m }));
  }
  // live leaderboard screenshot mid-song
  await shotBoth(pages[0], 'p-09-play-board');

  // ---------------- echo / standings / final
  const songEnd = await evalIn(host, s => s.game.phaseEndsAt - Date.now());
  log(`waiting ${Math.round(songEnd / 1000)} s for the song to end`);
  await waitFor(host, s => s.game.phase !== 'song', 'song end', songEnd + 20000);
  const res0 = await evalIn(host, s => Object.fromEntries(Object.entries(s.game.results[0]).map(([u, r]) => [s.players[u].name, [r.s, r.p, r.g, r.o, r.m, r.mc]])));
  log('song results [score, P, G, Good, Miss, maxCombo]', JSON.stringify(res0));
  const alice = res0.ALICE;
  const total = alice[1] + alice[2] + alice[3] + alice[4];
  if (alice[1] / total < 0.8) fail(`ALICE (near-perfect bot) should be mostly PERFECT: ${alice}`);
  if (res0.BOB && res0.BOB[2] < res0.BOB[1]) log('note: BOB (62 ms late) is mostly GREAT as expected');
  if (ECHO === 'on') {
    await waitFor(host, s => s.game.phase === 'echo', 'echo', 10000);
    await sleep(900);
    await shotBoth(pages[1], 'p-10-echo-card');
    await waitFor(host, s => { const e = window.__pulseView.echo(); return e && Date.now() - s.game.echoStartAt > e.plan.rounds[0].listenAt + 600; }, 'echo listen', 15000);
    await shotBoth(pages[1], 'p-11-echo-listen');
    await waitFor(host, s => { const e = window.__pulseView.echo(); return e && Date.now() - s.game.echoStartAt > e.plan.rounds[0].repeatAt + 300; }, 'echo repeat', 20000);
    await shotBoth(pages[1], 'p-12-echo-repeat');
    await waitFor(host, s => { const e = window.__pulseView.echo(); return e && Date.now() - s.game.echoStartAt > e.plan.rounds[0].closeAt + 500; }, 'echo score', 20000);
    await shotBoth(pages[1], 'p-13-echo-score');
    await waitFor(host, s => s.game.phase !== 'echo', 'echo end', 90000);
    const echoRes = await evalIn(host, s => Object.fromEntries(Object.entries(s.game.results[0]).map(([u, r]) => [s.players[u].name, r.e || 0])));
    log('echo points', JSON.stringify(echoRes));
    if (!(echoRes.ALICE > 0)) fail('ALICE should score Echo points');
  }
  if (COUNT > 1) {
    await waitFor(host, s => s.game.phase === 'standings', 'standings', 15000);
    await sleep(1600);
    await shotBoth(pages[0], 'p-14-standings');
  }
  await waitFor(host, s => s.game.phase === 'final', 'final', COUNT > 1 ? 400000 : 30000);
  await sleep(4500);
  await shotBoth(pages[0], 'p-15-final');
  await pages[0].evaluate(() => document.querySelector('.pl-stats') && document.querySelector('.pl-stats').scrollIntoView({ block: 'center' }));
  await sleep(400);
  await shotBoth(pages[0], 'p-16-final-stats');
  const night = await evalIn(host, s => Object.keys(s.night || {}).length);
  if (!night) fail('game-night points were not recorded');
  if (errors.length) fail(`browser errors:\n${errors.join('\n')}`);
  log('PULSE E2E PASSED');
} catch (e) {
  console.error('PULSE E2E FAILED:', e.message);
  for (const [i, p] of pages.entries()) if (p) await p.screenshot({ path: `${OUT}fail-${NAMES[i]}.png` }).catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
}
