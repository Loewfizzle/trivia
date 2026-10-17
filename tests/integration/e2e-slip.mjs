// SLIPSTREAM end to end with N players (default 8), each in their own browser context.
//   node e2e-slip.mjs "<browser path>" ./shots-slip     (env N=8, SHOTS=0, CPU=4, GPU=1, PERF=0)
// Lobby card + options + ride picker; the same seeded course on every phone; a synced countdown; real touch input
// (hold = dive keeps you on the ground, a tap in the air = a flip); bots ride; ghosts (count + smoothness while
// following); every biome (audio treatment + screenshots); equal look-ahead in portrait and landscape, rotating
// mid-ride; refresh mid-ride (rejoin near the last spot, lives kept, shimmer); crashes + rewind; eliminations and
// announcements; Call the Winner; the host's phone dies (a new host carries on); LAST RIDERS; the winner; results;
// rematch (the room playlist moves on, no repeats); frame pacing at every tier under CPU throttling.
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const BROWSER = process.argv[2];
const OUT = (process.argv[3] || './shots-slip').replace(/\/?$/, '/');
mkdirSync(OUT, { recursive: true });
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const N = Number(process.env.N || 8);
const SHOTS = process.env.SHOTS !== '0';
const CPU = Number(process.env.CPU || 4);
const NAMES = ['ALICE', 'BOB', 'CHARLIE', 'DANA', 'EVE', 'FINN', 'GRACE', 'HAL'];
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = [];
const checks = [];
const ok = (cond, what) => { checks.push({ what, ok: !!cond }); log(cond ? 'OK  ' : 'FAIL', what); if (!cond) errors.push(`check failed: ${what}`); };
const fail = m => { throw new Error(m); };
const VIEW = { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true };
const SIZES = [[390, 844], [412, 915], [844, 390], [915, 412], [1440, 900]];

const browser = await puppeteer.launch({
  executablePath: BROWSER, headless: true,
  args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', ...(process.env.GPU ? ['--enable-gpu', '--use-angle=d3d11'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'])],
});
const pages = [];
const ctxs = [];
const dead = new Set();
const uids = [];
let code = '';

async function openPlayer(i, qs = '') {
  const ctx = ctxs[i] || (ctxs[i] = await browser.createBrowserContext());
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'warning' && /claim host/.test(m.text())) log(NAMES[i], m.text()); if (m.type() === 'warning' && /game view|sky shader|slip publish/.test(m.text())) errors.push(`${NAMES[i]}: ${m.text()}`); });
  page.on('pageerror', e => { const m = `${NAMES[i]} pageerror: ${e.message}`; if (errors.includes(m)) return; errors.push(m); log(`${NAMES[i]} PAGEERROR`, e.message); });
  page.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/ERR_|Failed to load resource|favicon|permission_denied|PERMISSION_DENIED|Client is offline|net::/i.test(t)) { errors.push(`${NAMES[i]}: ${t}`); log(`${NAMES[i]} console.error`, t); } });
  await page.setViewport(VIEW);
  await page.goto(`${BASE}/?emu&slot=s${i}${qs ? '&' + qs : ''}`);
  pages[i] = page;
  return page;
}
async function shotAll(page, name, sizes = SIZES) {
  if (!SHOTS) return;
  for (const [w, h] of sizes) {
    const desk = w >= 1200;
    // isMobile stays on: toggling it makes puppeteer reload the page
    await page.setViewport({ width: w, height: h, deviceScaleFactor: desk ? 1 : 2, isMobile: true, hasTouch: true });
    await sleep(600);
    await page.screenshot({ path: `${OUT}${name}-${w}x${h}.png` });
  }
  await page.setViewport(VIEW);
  await sleep(200);
}
const evalIn = (page, fn, arg) => page.evaluate(`(async () => { const s = window.__arcade.state; return (${fn})(s, ${JSON.stringify(arg ?? null)}); })()`);
async function waitFor(page, fn, what, timeout = 30000, arg) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { try { if (await evalIn(page, fn, arg)) return true; } catch { /* busy */ } await sleep(150); }
  fail(`timeout: ${what}`);
}
const alive = () => pages.map((p, i) => i).filter(i => pages[i] && !dead.has(i));
const idx = uid => uids.indexOf(uid);
const game = page => evalIn(page, s => s.game);
const P = (page, js) => page.evaluate(js);
const S = (page, js) => page.evaluate(`window.__slip && (${js})`);

async function joinAll() {
  const host = await openPlayer(0);
  await host.waitForSelector('.nd-host', { timeout: 20000 });
  for (let k = 0; k < 5 && !(await host.$('.setup-screen input.input')); k++) {
    await host.click('.nd-host').catch(() => {});
    await host.waitForSelector('.setup-screen input.input', { timeout: 6000 }).catch(() => {});
  }
  await host.type('.setup-screen input.input', NAMES[0]);
  await host.click('.form-cta .btn-primary');
  await host.waitForSelector('.lobby-screen .room-code', { timeout: 20000 });
  code = await evalIn(host, s => s.code);
  log('room', code);
  for (let i = 1; i < N; i++) {
    const p = await openPlayer(i, `room=${code}`);
    await p.waitForSelector('.nd-go', { timeout: 20000 });
    await p.waitForFunction(() => !document.getElementById('boot'), { timeout: 15000 });
    await p.click('.nd-go');
    await p.waitForSelector('.input-code');
    await p.type('.setup-screen input.input:not(.input-code)', NAMES[i]);
    await p.click('.form-cta .btn-primary');
    await p.waitForSelector('.lobby-screen', { timeout: 20000 });
  }
  await waitFor(host, (s, n) => Object.keys(s.players).length === n, `${N} players`, 30000, N);
  for (let i = 0; i < N; i++) uids[i] = await evalIn(pages[i], s => s.uid);
  return host;
}
async function hostIdx() {
  for (const i of alive()) { try { if (await evalIn(pages[i], s => s.meta && s.meta.hostId === s.uid)) return i; } catch { /* */ } }
  return alive()[0];
}
// a real finger through CDP: down, held for ms, up
async function press(page, ms, x = 200, y = 600) {
  const c = await page.target().createCDPSession();
  await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
  await sleep(ms);
  await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await c.detach();
}
const BAD = /\bnull\b|\bundefined\b|\bNaN\b|\[object Object\]/;
const cleanText = async (page, where) => {
  const t = await page.evaluate(() => (document.querySelector('.sl') || document.body).innerText);
  const m = t.match(BAD);
  const near = m ? `: …${t.slice(Math.max(0, m.index - 30), m.index + 20).replace(/\s+/g, ' ')}…` : '';
  ok(!m, `TEXT: no stray "null"/"undefined" on screen (${where}${near})`);
};
const rider = page => S(page, 'window.__slip.rider()');
// with 8 browsers on one CPU, only the phones a step looks at draw frames (the rest ride, publish and play on)
const watch = async (...keep) => { for (const i of alive()) await S(pages[i], `window.__slip.draw(${keep.includes(i)})`).catch(() => {}); };
const botAll = async (opts = '{}', except = []) => { for (const i of alive()) if (!except.includes(i)) await S(pages[i], `window.__slip.bot(Object.assign({ seed: ${i + 1} }, ${opts}))`); };

async function perfRun(p) {
  // the measured phone rides by hand (the test bot plans with thousands of physics steps a second, which no real phone runs);
  // it holds on descents like a player would
  await S(p, 'window.__slip.stopBot()');
  await p.evaluate(() => { window.__perfRide = setInterval(() => { const r = window.__slip.rider(); if (r) window.__slip.press(r.gnd && r.sp < 30 && Math.random() < 0.5); }, 300); });
  const cdp = await p.target().createCDPSession();
  await p.setViewport({ width: 844, height: 390, deviceScaleFactor: process.env.GPU ? 2.75 : 1, isMobile: true, hasTouch: true });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  const perf = [];
  for (const t of [2, 1, 0]) {
    await S(p, `window.__slip.setTier(${t})`);
    if (process.env.PROFILE && t === 2) {
      await cdp.send('Profiler.enable'); await cdp.send('Profiler.start');
      await sleep(3000);
      const { profile } = await cdp.send('Profiler.stop');
      const self = new Map(); const dt = profile.timeDeltas; const byId = new Map(profile.nodes.map(n => [n.id, n]));
      profile.samples.forEach((id, k) => { const n = byId.get(id); const key = n.callFrame.functionName + ' ' + n.callFrame.url.split('/').pop() + ':' + n.callFrame.lineNumber; self.set(key, (self.get(key) || 0) + (dt[k] || 0)); });
      log('profile', [...self].sort((x, y) => y[1] - x[1]).slice(0, 25).map(([k, v]) => `${(v / 1000).toFixed(0)}ms ${k}`).join(' | '));
    }
    await sleep(4500);
    log('parts', t, JSON.stringify(await S(p, 'window.__slip.parts()')));
    const f = await S(p, 'window.__slip.fps()');
    const w = await S(p, 'window.__slip.work()');
    const s2 = [...f].sort((a, b) => a - b), w2 = [...w].sort((a, b) => a - b);
    perf.push({ tier: t, after: await S(p, 'window.__slip.tier()'), p50: +s2[Math.floor(s2.length * 0.5)].toFixed(1), p95: +s2[Math.floor(s2.length * 0.95)].toFixed(1), work75: +w2[Math.floor(w2.length * 0.75)].toFixed(1), n: s2.length });
  }
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await p.setViewport(VIEW);
  log('frame pacing', JSON.stringify(perf));
  writeFileSync(`${OUT}perf.json`, JSON.stringify(perf, null, 1));
  ok(perf.every(x => x.p50 <= 17.5), `PERF: ${CPU}× CPU — 60 fps median at every tier (${perf.map(x => `t${x.tier}: p50 ${x.p50} / p95 ${x.p95} / work ${x.work75} ms`).join(' · ')})`);
}

try {
  const host = await joinAll();
  if (process.env.PERF_ONLY) {
    await host.evaluate(() => import('/js/host.js').then(m => m.startGame('slip', { lives: 3 })));
    await waitFor(host, s => s.game && s.game.phase === 'play', 'GO', 40000);
    await sleep(800);
    await botAll('{ flips: true }');
    await sleep(4000);
    await perfRun(pages[alive().length - 1]);
    throw new Error('PERF_ONLY done');
  }

  // ---------------------------------------------------------------- lobby card, options, ride picker
  await host.evaluate(() => document.querySelector('.game-card[data-theme="slip"]').scrollIntoView({ block: 'center' }));
  await sleep(600);
  await shotAll(host, 'sl-00-lobby-card', SIZES.slice(0, 2));
  await host.evaluate(() => document.querySelector('.game-card[data-theme="slip"]').click());
  await host.waitForSelector('.modal .sheet.options', { timeout: 8000 });
  await sleep(500);
  await shotAll(host, 'sl-01-options', SIZES.slice(0, 2));
  await host.evaluate(() => document.querySelector('.modal .btn-text.btn-block').click());
  await sleep(500);
  // ride picker from the settings sheet: pick the light-cycle + light wall on BOB's phone
  const B = pages[1];
  await B.evaluate(() => import('/js/games/slip/ride.js').then(m => m.openRidePicker({ color: '#ff3fb0' })));
  await B.waitForSelector('.sl-pick', { timeout: 8000 });
  await sleep(700);
  await shotAll(B, 'sl-02-ride-picker', SIZES.slice(0, 3));
  await B.evaluate(() => { const segs = document.querySelectorAll('.sl-pick .seg'); segs[0].querySelectorAll('button')[1].click(); segs[1].querySelectorAll('button')[2].click(); });
  await sleep(500);
  await shotAll(B, 'sl-03-ride-picker-cycle', SIZES.slice(0, 1));
  const rideB = await B.evaluate(() => localStorage.getItem('na:slipride'));
  ok(/cycle/.test(rideB) && /wall/.test(rideB), `RIDE: picker saves the light-cycle + light wall on the device (${rideB})`);
  await B.evaluate(() => document.querySelector('.sl-pick .btn-primary').click());
  await sleep(400);

  // ================================================================ MATCH A
  await host.evaluate(() => import('/js/host.js').then(m => m.startGame('slip', { lives: 2 })));
  await waitFor(host, s => s.game && s.game.id === 'slip' && s.game.phase === 'count', 'count phase');
  const gA = await game(host);
  log('songs', gA.songs.join(','), 'lives', gA.settings.lives);
  ok(gA.songs.length === 4 && new Set(gA.songs).size === 4, `MUSIC: four different songs dealt from the room playlist (${gA.songs.join(', ')})`);
  await Promise.all(alive().map(i => pages[i].waitForFunction(() => window.__slip && window.__slip.course(), { timeout: 20000 })));
  const sigs = await Promise.all(alive().map(i => S(pages[i], 'window.__slip.course().sig')));
  ok(new Set(sigs).size === 1, `COURSE: identical seeded course on all ${alive().length} phones (${sigs[0]})`);
  const cA = await S(host, 'window.__slip.course()');
  log('biomes', JSON.stringify(cA.biomes), 'hazards', JSON.stringify(cA.counts));
  ok(cA.biomes[0][0] === 'dunes' && cA.biomes.at(-1)[0] === 'space', 'COURSE: DUSK DUNES first, OPEN SPACE last');
  await sleep(900);
  await cleanText(host, 'countdown');
  await shotAll(host, 'sl-04-countdown');
  await waitFor(host, s => s.game.phase === 'play', 'GO', 20000);
  await sleep(300);
  const r0 = await rider(host);
  ok(r0 && r0.st === 'ride' && r0.x >= 6, 'GO: every phone rides from the start line');

  // ---------------------------------------------------------------- real input on ALICE's phone
  await host.waitForFunction(() => !document.querySelector('.sl-count, .sl-ride-btn'), { timeout: 8000 });
  log('under the finger', await host.evaluate(() => { let e = document.elementFromPoint(200, 600); const out = []; while (e && out.length < 8) { out.push(e.tagName + '.' + String(e.className).replace(/ /g, '.')); e = e.parentElement; } return out.join(' < '); }));
  // hold: a press into the ground (no launch while held) — sample over 1.5 s of holding
  const held = await (async () => {
    const c = await host.target().createCDPSession();
    await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: 600, id: 1 }] });
    let air = 0;
    for (let k = 0; k < 15; k++) { const r = await rider(host); if (!r.gnd) air++; await sleep(100); }
    await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await c.detach();
    return air;
  })();
  const in1 = await S(host, 'window.__slip.input()');
  ok(in1.downs >= 1 && held <= 2, `INPUT: holding keeps the rider pressed to the ground (${held}/15 samples airborne; ${in1.downs} press)`);
  // release and wait for a real flight, then a tap = one flip
  let flipped = false;
  for (let k = 0; k < 40 && !flipped; k++) {
    let r = await rider(host);
    // dive down a slope for speed, let go, and wait to be airborne
    if (r.gnd) { await press(host, 500); for (let j = 0; j < 20; j++) { r = await rider(host); if (!r.gnd) break; await sleep(60); } }
    if (r && !r.gnd && r.st === 'ride') {
      const before = (await S(host, 'window.__slip.sfxLog()')).filter(x => x === 'flip').length;
      await press(host, 70);
      await sleep(80);
      const after = (await S(host, 'window.__slip.sfxLog()')).filter(x => x === 'flip').length;
      flipped = after > before;
    } else await sleep(120);
  }
  ok(flipped, `INPUT: a tap in the air starts a flip (${JSON.stringify(await S(host, 'window.__slip.input()'))})`);
  await botAll('{ flips: true, flipRate: 0.5 }');
  await watch(0);
  await sleep(7000);
  await cleanText(host, 'riding');
  await shotAll(host, 'sl-05-ride');
  const gh = await S(host, 'window.__slip.ghosts()');
  ok(Object.keys(gh).length >= alive().length - 1, `GHOSTS: every other rider streams samples (${JSON.stringify(gh)})`);
  const rds = await evalIn(host, s => Object.values(s.live.riders || {}).map(n => n.rd));
  ok(rds.includes('cw'), `GHOSTS: BOB's ride + trail published for the ghosts (${rds.join(',')})`);

  // ---------------------------------------------------------------- equal look-ahead, rotating mid-ride
  const view = async (w, h) => { await host.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: true, hasTouch: true }); await sleep(900); return S(host, 'window.__slip.camera()'); };
  const tBefore = (await rider(host)).t;
  const vp = await view(390, 844), vl = await view(844, 390);
  const rAfter = await rider(host);
  log('portrait', JSON.stringify(vp), 'landscape', JSON.stringify(vl));
  ok(Math.abs(vp.ahead - vp.look) < 0.01 && Math.abs(vl.ahead - vl.look) < 0.01 && vp.scale < vl.scale, `FAIR: the look-ahead in metres is the rule's value in both orientations; portrait zooms out (${vp.scale.toFixed(1)} vs ${vl.scale.toFixed(1)} px/m)`);
  const lookP = await S(host, `(() => { const c = window.__slip.camera(); return c.look; })()`);
  ok(rAfter.t > tBefore + 1.5 && rAfter.st !== undefined, `ROTATE: the ride carries on through two rotations (clock ${tBefore.toFixed(1)} → ${rAfter.t.toFixed(1)} s)`);
  void lookP;
  await host.setViewport(VIEW);

  // ---------------------------------------------------------------- biomes: teleport ALICE through each one
  const TREAT = { dunes: 2600, crystal: 15000, city: 20000, storm: 20000, space: 8500 };
  await S(host, 'window.__slip.stopBot()');
  const seen = new Set();
  for (const [id, v, x0] of cA.biomes) {
    if (seen.has(id)) continue;
    seen.add(id);
    await S(host, `window.__slip.teleport(${x0 + 140})`);
    await S(host, 'window.__slip.bot({ seed: 9 })');
    await sleep(1600);
    const a = await S(host, 'window.__slip.audio()');
    const fq = (await S(host, 'window.__slip.fps()')).slice(-30).sort((x, y) => x - y); log('fps check', id, fq[15], fq[29], JSON.stringify(await S(host, 'window.__slip.rider()')).slice(0, 120));
    ok(Math.abs(a.want.lp - TREAT[id]) < TREAT[id] * 0.05, `AUDIO: ${id} (variant ${v}) gets its own treatment (low-pass ${a.want.lp} Hz, reverb ${a.want.rev.toFixed(2)})`);
    await shotAll(host, `sl-06-biome-${id}`, id === 'dunes' ? SIZES.slice(2, 3) : SIZES.slice(0, 1).concat(SIZES.slice(2, 3)));
    await S(host, 'window.__slip.stopBot()');
  }
  await S(host, 'window.__slip.bot({ seed: 11, flips: true })');

  // ---------------------------------------------------------------- refresh mid-ride (CHARLIE)
  if (N >= 3) {
    const C = pages[2];
    const before = await rider(C);
    await C.reload();
    const tR = Date.now();
    const cmsgs = []; C.on('console', m => cmsgs.push(m.type() + ': ' + m.text().slice(0, 200)));
    setTimeout(() => log('C console', JSON.stringify(cmsgs.slice(0, 30))), 20000);
    await C.waitForFunction(() => window.__slip && window.__slip.rider(), { timeout: 90000 }).catch(async e => {
      log('after reload', JSON.stringify(await C.evaluate(() => { const s = window.__arcade && window.__arcade.state; return { hook: !!window.__slip, code: s && s.code, phase: s && s.game && s.game.phase, liveKey: s && s.liveKey, live: s && Object.keys(s.live || {}), boot: !!document.getElementById('boot'), screen: document.querySelector('.screen') && document.querySelector('.screen').className, part: s && s.game && s.game.participants && !!s.game.participants[s.uid], node: s && s.live && s.live.riders && s.live.riders[s.uid] }; })));
      throw e;
    });
    await sleep(500);
    const after = await rider(C);
    log('rejoin took', Date.now() - tR, 'ms');
    log('refresh', JSON.stringify(before), '→', JSON.stringify(after));
    ok(after.lives === before.lives && Math.abs(after.x - before.x) < 120 && after.inv > 0, `REJOIN: back near the last spot (${before.x.toFixed(0)} → ${after.x.toFixed(0)} m), same lives, shimmering`);
    await S(C, 'window.__slip.bot({ seed: 3, flips: true })');
    await S(C, 'window.__slip.draw(false)');
  }

  // ---------------------------------------------------------------- a crash: rewind + respawn (DANA or BOB)
  const V = pages[N >= 4 ? 3 : 1];
  await S(V, 'window.__slip.crash()');
  await sleep(250);
  const rv = await rider(V);
  ok(rv.st === 'rewind' && rv.lives === 1, `CRASH: lives 2 → ${rv.lives}, rewinding`);
  await sleep(1100);
  const rv2 = await rider(V);
  ok(rv2.st === 'ride' && rv2.inv > 0, 'CRASH: respawned a little behind, 2 s of shimmer');
  await watch(0, pages.indexOf(V));
  await shotAll(V, 'sl-07-respawn', SIZES.slice(0, 1));
  await watch(0);

  // ---------------------------------------------------------------- eliminations + Call the Winner
  const order = alive().filter(i => i !== 0 && i !== 2).reverse(); // ALICE + CHARLIE stay to the end
  const outs = [];
  for (const i of order.slice(0, Math.max(0, order.length - 0))) {
    if (alive().length - outs.length <= 3 && N >= 3) break;
    for (let k = 0; k < 3; k++) { await S(pages[i], 'window.__slip.stopBot()'); await S(pages[i], 'window.__slip.crash()'); await sleep(1300); }
    outs.push(i);
    await waitFor(host, (s, u) => s.game.out && s.game.out[u], `${NAMES[i]} out`, 15000, uids[i]);
  }
  if (outs.length) {
    const ann = await S(host, 'window.__slip.announcements()');
    ok(ann.some(a => /CRASHED — \d+ LEFT/.test(a)), `ANNOUNCE: eliminations ("${ann.find(a => /LEFT/.test(a))}")`);
    const o = pages[outs.at(-1)];
    await watch(0, outs.at(-1));
    await o.waitForSelector('.sl-call', { timeout: 6000 }).catch(() => {});
    const hasCall = await o.$('.sl-call');
    ok(!!hasCall, 'CALL: the eliminated rider gets CALL THE WINNER');
    if (hasCall) {
      await sleep(500);
      await shotAll(o, 'sl-08-call', SIZES.slice(0, 1));   // the window is 10 s: one shot, then the pick
      // call ALICE
      await o.evaluate(n => { const b = [...document.querySelectorAll('.sl-call-pick')].find(x => x.textContent.includes(n)); b && b.click(); }, NAMES[0]);
      await sleep(600);
      const call = await evalIn(o, (s, u) => s.live.calls && s.live.calls[u], uids[outs.at(-1)]);
      ok(call && call.w === uids[0], 'CALL: the pick is saved (ALICE)');
    }
    await sleep(1200);
    await shotAll(o, 'sl-09-spectate', SIZES.slice(0, 1).concat(SIZES.slice(2, 3)));
    // ghost smoothness while following a rider
    // speed between frames (frames are uneven with 8 browsers on one machine, so per-frame steps aren't comparable):
    // a smooth ghost's speed stays close to its running median; a stuttering one jumps and stops
    const pr = (await S(o, 'window.__slip.ghostProbe()')).slice(-150);
    const v = [];
    for (let k = 1; k < pr.length; k++) { const dt = (pr[k][0] - pr[k - 1][0]) / 1000; if (dt > 0.004) v.push((pr[k][1] - pr[k - 1][1]) / dt); }
    const med = (a) => { const s2 = [...a].sort((x, y) => x - y); return s2[Math.floor(s2.length / 2)] || 0; };
    const dev = v.map((x, k) => Math.abs(x - med(v.slice(Math.max(0, k - 6), k + 7)))).sort((a, b) => a - b);
    const p95 = dev[Math.floor(dev.length * 0.95)] || 0, vm = med(v);
    const back = v.filter(x => x < -1).length;
    ok(v.length > 60 && back <= 2 && p95 < Math.max(4, vm * 0.35), `GHOSTS: smooth when followed (${v.length} frames at ~${vm.toFixed(1)} m/s, p95 speed wobble ${p95.toFixed(1)} m/s, ${back} backward steps)`);
  }

  // ---------------------------------------------------------------- the host's phone dies
  if (N >= 4) {
    const h0 = await hostIdx();
    const k = h0 === 0 ? 1 : h0;
    log('killing host', NAMES[h0]);
    if (h0 !== 0 && h0 !== 2) { await pages[h0].close(); dead.add(h0); }
    else {
      // ALICE is the host and must stay to the end: hand the crown over by killing ALICE's tab and rejoining
      await pages[0].close(); dead.add(0);
      await waitFor(pages[2], (s, old) => s.meta && s.meta.hostId && s.meta.hostId !== old, 'new host', 40000, uids[0]).catch(async e => {
        log('meta', JSON.stringify(await evalIn(pages[2], s => ({ meta: s.meta, presence: s.presence, me: s.uid, connected: s.connected }))));
        throw e;
      });
      dead.delete(0);
      const p = await openPlayer(0);
      await p.waitForFunction(() => window.__slip && window.__slip.rider(), { timeout: 60000 }).catch(async e => {
        log('ALICE after reopen', JSON.stringify(await p.evaluate(() => { const s = window.__arcade && window.__arcade.state; return { hook: !!window.__slip, code: s && s.code, phase: s && s.game && s.game.phase, liveKey: s && s.liveKey, boot: !!document.getElementById('boot'), out: s && s.game && s.game.out && !!s.game.out[s.uid], screen: (document.querySelector('.screen') || {}).className }; })));
        throw e;
      });
      await S(p, 'window.__slip.bot({ seed: 21, flips: true })');
      ok(true, 'HOST: ALICE (host) closed the tab; a new host took over; ALICE rejoined mid-ride');
    }
    void k;
  }

  // ---------------------------------------------------------------- LAST RIDERS
  if (N >= 3) {
    const rest = alive().filter(i => i !== 0 && i !== 2 && !(outs.includes(i)));
    for (const i of rest) {
      for (let k = 0; k < 3; k++) { await S(pages[i], 'window.__slip.stopBot()'); await S(pages[i], 'window.__slip.crash()'); await sleep(1300); if ((await rider(pages[i])).st === 'out') break; }
    }
    const watcher = pages[alive().find(i => i !== 0 && i !== 2) ?? 0];
    await waitFor(watcher, s => s.game.lastAt, 'LAST RIDERS', 20000);
    await pages[0].waitForSelector('.sl-overlay .sl-last', { timeout: 6000 }).catch(() => {});
    await sleep(700);
    await shotAll(pages[0], 'sl-10-last-riders', SIZES.slice(0, 1));
    ok((await S(pages[0], 'window.__slip.moments()')).includes('last'), 'LAST RIDERS: the cinematic plays');
    const au = await S(pages[0], 'window.__slip.audio()');
    ok(au.lastRiders === true, 'LAST RIDERS: the music opens up');

    // CHARLIE crashes out: ALICE wins
    for (let k = 0; k < 3; k++) { await S(pages[2], 'window.__slip.stopBot()'); await S(pages[2], 'window.__slip.crash()'); await sleep(1300); }
    await waitFor(pages[0], s => s.game.phase === 'end', 'end', 20000);
    const g = await game(pages[0]);
    ok(g.winner === uids[0], `END: ALICE is the last rider (${NAMES[idx(g.winner)]})`);
    await pages[0].waitForSelector('.sl-card.is-win', { timeout: 5000 }).catch(() => {});
    ok(!!(await pages[0].$('.sl-card.is-win')), 'END: the winner sees VICTORY');
    await sleep(500);
    await shotAll(pages[0], 'sl-11-victory', SIZES.slice(0, 1));
    await waitFor(pages[0], s => s.game.phase === 'final', 'final', 20000);
    await sleep(4200);
    await cleanText(pages[0], 'final');
    await shotAll(pages[0], 'sl-12-final');
    const gf = await game(pages[0]);
    ok(gf.results && Object.keys(gf.results).length === N, 'RESULTS: every rider has a distance / combo / flips / clean % / biomes row');
    const callOk = Object.values(gf.calls || {}).some(c => c.ok && c.bonus > 0);
    ok(!outs.length || callOk, `CALL: the right call earns game-night points (${JSON.stringify(gf.calls)})`);
    await pages[0].evaluate(() => { const t = document.querySelector('.sl-res'); t && t.scrollIntoView({ block: 'center' }); });
    await sleep(400);
    await shotAll(pages[0], 'sl-13-report', SIZES.slice(0, 1).concat(SIZES.slice(2, 3)));

    // ---------------------------------------------------------------- rematch: the playlist moves on
    const hi = await hostIdx();
    const meta0 = await evalIn(pages[hi], s => s.meta.slip);
    await pages[hi].evaluate(() => import('/js/host.js').then(m => m.rematch()));
    await waitFor(pages[hi], (s, m) => s.game && s.game.id === 'slip' && s.game.matchId !== m, 'rematch', 20000, gf.matchId);
    const gB = await game(pages[hi]);
    const meta1 = await evalIn(pages[hi], s => s.meta.slip);
    log('playlist', JSON.stringify(meta0), JSON.stringify(meta1), gB.songs.join(','));
    ok(meta1.n > 0 && !gB.songs.some((s, k) => k === 0 && s === gA.songs[gA.songs.length - 1]), `MUSIC: the rematch continues the room playlist at position ${meta1.n} (${gB.songs.join(', ')})`);
    const sigB = await (async () => { await pages[hi].waitForFunction(m => window.__slip && window.__slip.course() && window.__slip.course().seed !== m, { timeout: 15000 }, gA.seed); return S(pages[hi], 'window.__slip.course().sig'); })();
    ok(sigB !== sigs[0], 'COURSE: a fresh course every match');
    if (process.env.PERF === '1') {   // frame pacing is measured on its own: PERF_ONLY=1 N=2 (8 browsers on one CPU can't stand in for one phone)
      await waitFor(pages[hi], s => s.game.phase === 'play', 'GO B', 20000);
      await sleep(800);
      await botAll('{ flips: true }');
      await sleep(3000);
      await watch(alive().at(-1));
      await perfRun(pages[alive().at(-1)]);
    }
  }
} catch (e) {
  if (!/PERF_ONLY done/.test(e.message)) { errors.push(`FATAL: ${e.message}`); log('FATAL', e.stack); }
} finally {
  const passed = checks.filter(c => c.ok).length;
  log(`checks ${passed}/${checks.length} passed`);
  log('errors:', errors.length ? `\n  ${errors.join('\n  ')}` : '');
  writeFileSync(`${OUT}result.json`, JSON.stringify({ checks, errors }, null, 1));
  await browser.close();
  process.exit(errors.length ? 1 : 0);
}
