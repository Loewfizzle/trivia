// NEON SPEAKEASY title screen end to end (needs the emulators + scripts/serve.mjs).
//   node e2e-title.mjs "<browser path>" ./shots-title        (env SHOTS=0, VIDEO=0, CPU=4, GPU=1)
// First visit (gate -> tap -> full power-on, audio unlocked by that tap), returning visit (short, no gate),
// back from the name screen (quick re-light), skip by tapping, reduced effects; HOST with a saved profile (straight into a
// room), JOIN by typing (auto-join on the 4th letter), by pasting an invite link, an invalid code, I/O typed,
// a ?room= link (pre-filled; with and without a profile), REJOIN, Welcome back + EDIT, the showcase preview
// sheets (+ HOW TO PLAY), quality tiers + frame pacing, memory cleanup when leaving the title, the lobby's
// small sign; screenshots at 390×844, 412×915, 1440×900; videos of the first and the returning intro.
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';

const BROWSER = process.argv[2];
const OUT = (process.argv[3] || './shots-title').replace(/\/?$/, '/');
mkdirSync(OUT, { recursive: true });
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const SHOTS = process.env.SHOTS !== '0';
const VIDEO = process.env.VIDEO !== '0';
const CPU = Number(process.env.CPU || 4);
const SIZES = [[390, 844], [412, 915], [1440, 900]];
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = [];
const checks = [];
const ok = (cond, what) => { checks.push({ what, ok: !!cond }); log(cond ? 'OK  ' : 'FAIL', what); if (!cond) errors.push(`check failed: ${what}`); };

const browser = await puppeteer.launch({
  executablePath: BROWSER, headless: true,
  args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio', ...(process.env.GPU ? ['--enable-gpu', '--use-angle=d3d11'] : [])],
});

const PROFILES = {
  ava: { name: 'AVA', color: 'magenta', avatar: 'bolt' },
  ben: { name: 'BEN', color: 'cyan', avatar: 'eye' },
  cal: { name: 'CAL', color: 'lime', avatar: 'hex' },
  dee: { name: 'DEE', color: 'amber', avatar: 'moon' },
};
async function open({ slot = 'x', qs = '', profile = null, seen = false, reduced = false, view = [390, 844], ctx = null, page = null } = {}) {
  const c = ctx || await browser.createBrowserContext();
  const p = page || await c.newPage();
  p.on('pageerror', e => { errors.push(`${slot} pageerror: ${e.message}`); log(slot, 'PAGEERROR', e.message); });
  p.on('console', m => {
    const t = m.text();
    if (m.type() === 'error' && !/favicon|ERR_|Failed to load|permission_denied|PERMISSION_DENIED|Client is offline/i.test(t)) { errors.push(`${slot}: ${t}`); log(slot, 'console.error', t); }
    if (m.type() === 'warning' && /game view/.test(t)) errors.push(`${slot}: ${t}`);
  });
  const [w, h] = view;
  const mobile = w < 800;
  await p.setViewport({ width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  await p.evaluateOnNewDocument(() => {
    new MutationObserver((_, o) => { if (document.querySelector('.nd-gate.is-in')) { window.__gateAt = performance.now(); o.disconnect(); } }).observe(document, { subtree: true, childList: true, attributes: true });
  });
  await p.evaluateOnNewDocument((slotName, prof, seenIt, red) => {
    try {
      if (prof) localStorage.setItem(`na:${slotName}:profile`, JSON.stringify(prof));
      if (seenIt) localStorage.setItem('nd:entered', '1');
      if (red) localStorage.setItem('na:settings', JSON.stringify({ reducedFx: true }));
    } catch { /* fine */ }
  }, slot, profile, seen, reduced);
  await p.goto(`${BASE}/?emu&intro=1&slot=${slot}${qs ? '&' + qs : ''}`);
  return { ctx: c, page: p };
}
const ev = (p, js) => p.evaluate(js);
const phase = p => ev(p, '(window.__district && window.__district.phase()) || null');
const state = p => ev(p, '({ code: window.__arcade && window.__arcade.state.code, view: window.__arcade && window.__arcade.state.view })');
async function waitFor(p, js, what, timeout = 20000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { try { if (await ev(p, js)) return true; } catch { /* navigating */ } await sleep(100); }
  throw new Error(`timeout: ${what}`);
}
async function tap(p, sel) {
  const r = await p.evaluate(s => { const el = document.querySelector(s); if (!el) return null; const b = el.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }, sel);
  if (!r) throw new Error(`no ${sel}`);
  const c = await p.target().createCDPSession();
  const vp = p.viewport();
  if (vp && vp.hasTouch) {
    await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: r.x, y: r.y }] });
    await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    await p.mouse.click(r.x, r.y);
  }
  await c.detach();
}
async function shotAll(p, name) {
  if (!SHOTS) return;
  const vp = p.viewport();
  for (const [w, h] of SIZES) {
    // same isMobile/hasTouch as the page was opened with (changing them makes Chrome reload the page)
    await p.setViewport({ ...vp, width: w, height: h, deviceScaleFactor: w < 800 ? 2 : 1 });
    await sleep(650);
    await p.screenshot({ path: `${OUT}${name}-${w}.png` });
  }
  await p.setViewport(vp);
  await sleep(300);
}
// video: CDP screencast frames -> mp4 (ffmpeg from the PULSE python env, or PATH)
function ffmpegPath() {
  const dir = join(homedir(), '.cache/neural-arcade/pyenv/Lib/site-packages/imageio_ffmpeg/binaries');
  try { const f = readdirSync(dir).find(n => /^ffmpeg.*\.exe$/.test(n)); if (f) return join(dir, f); } catch { /* none */ }
  return 'ffmpeg';
}
async function record(p, name, run, { ms = 4500 } = {}) {
  if (!VIDEO) { await run(); await sleep(ms); return; }
  const dir = `${OUT}${name}-frames`;
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const c = await p.target().createCDPSession();
  const frames = [];
  c.on('Page.screencastFrame', async f => {
    frames.push({ data: f.data, t: f.metadata.timestamp });
    c.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
  });
  await c.send('Page.startScreencast', { format: 'jpeg', quality: 88, everyNthFrame: 1 });
  await sleep(300);
  await run();
  await sleep(ms);
  await c.send('Page.stopScreencast');
  await c.detach();
  // write frames with their real durations (ffmpeg concat demuxer)
  let list = '';
  frames.forEach((f, i) => {
    const file = `f${String(i).padStart(5, '0')}.jpg`;
    writeFileSync(`${dir}/${file}`, Buffer.from(f.data, 'base64'));
    const d = i + 1 < frames.length ? Math.max(0.008, frames[i + 1].t - f.t) : 0.04;
    list += `file '${file}'\nduration ${d.toFixed(4)}\n`;
  });
  writeFileSync(`${dir}/list.txt`, list);
  try {
    execFileSync(ffmpegPath(), ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', `${dir}/list.txt`, '-vf', 'fps=30,scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '24', '-movflags', '+faststart', `${OUT}${name}.mp4`]);
    log('video', `${name}.mp4`, `${frames.length} frames`);
  } catch (e) { log('ffmpeg failed', e.message); }
  rmSync(dir, { recursive: true, force: true });
  return frames.length;
}

try {
  // ================================================================ 1. first visit: the gate, then the full power-on
  const tStart = Date.now();
  const A = await open({ slot: 'a', view: [390, 844] });
  await A.page.evaluate(() => 0).catch(() => {});
  await A.page.waitForSelector('#boot .boot-logo', { timeout: 10000 });
  const bootMs = Date.now() - tStart;
  if (SHOTS) await A.page.screenshot({ path: `${OUT}n-00-boot-390.png` });
  await A.page.waitForSelector('.nd-gate.is-in', { timeout: 15000 });
  // measured in the page (navigation start = 0), not from the test harness (a cold browser context adds seconds)
  const inPage = await ev(A.page, `Math.round(window.__gateAt || 0)`);
  const fcp = await ev(A.page, `Math.round((performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime || 0)`);
  ok(inPage > 0 && inPage < 1500, `FIRST VISIT: TAP TO ENTER is up ${inPage} ms after navigation; first paint (the boot screen) at ${fcp} ms`);
  void bootMs; void tStart;
  ok((await phase(A.page)).kind === 'gate', 'FIRST VISIT: waits behind TAP TO ENTER (audio needs a tap on iPhone)');
  await sleep(900);
  await shotAll(A.page, 'n-01-gate');
  const audioBefore = await ev(A.page, `import('/js/audio/engine.js').then(m => !!(m.getContext() && m.getContext().state === 'running'))`);
  let seqT = 0;
  await record(A.page, 'intro-first-visit', async () => { seqT = Date.now(); await tap(A.page, '.nd-gate'); }, { ms: 4300 });
  const audioAfter = await ev(A.page, `import('/js/audio/engine.js').then(m => m.getContext() && m.getContext().state)`);
  ok(!audioBefore && audioAfter === 'running', `AUDIO: the TAP TO ENTER tap unlocks audio (${audioAfter})`);
  const music = await ev(A.page, 'window.__arcade.musicDebug()');
  ok(music.desired === 'menu' && /^menu[1-4]$/.test(music.playing || '') && music.list === 'menu', `AUDIO: one of the four menu tracks plays, as a shuffled playlist (${JSON.stringify({ desired: music.desired, playing: music.playing, list: music.list })})`);
  // across fresh page loads the starting track varies
  const starts = new Set();
  for (let k = 0; k < 8; k++) {
    const pp = await A.ctx.newPage();
    await pp.goto(`${BASE}/?emu&slot=m${k}`);
    await pp.waitForFunction(() => window.__arcade && window.__arcade.musicDebug, { timeout: 10000 });
    starts.add(await pp.evaluate(() => window.__arcade.musicDebug().menuOrder[0]));
    await pp.close();
  }
  ok(starts.size >= 2, `AUDIO: the menu playlist starts on a different track across visits (${[...starts].join(', ')})`);
  const ph = await phase(A.page);
  ok(ph.kind === 'full' && ph.done, `FIRST VISIT: the full sequence ran and finished (${ph.kind}, ${ph.t.toFixed(2)} s)`);
  const sc = await ev(A.page, 'window.__district.scene()');
  ok(sc.wave === 1 && sc.lit === 1 && sc.bill === 1 && sc.logo === 1, 'POWER-ON: lights, billboards, sign all fully on at the end');
  ok(sc.signs && sc.signs.length >= 4, `SCENE: the city's signs show the games (${sc.signs ? sc.signs.map(s => s.type).join(', ') : 'none'})`);
  ok(await ev(A.page, `document.querySelectorAll('.nd-sign .ndl.on').length === 4 && document.querySelector('.nd-sign').classList.contains('is-warm')`), 'SIGN: all four letters lit and steady');
  ok(await ev(A.page, `getComputedStyle(document.querySelector('.nd-host')).opacity === '1'`), 'MENU: eased in');
  await shotAll(A.page, 'n-02-menu-new-player');

  // ================================================================ 2. returning visit (new tab, same device): the full boot, no gate
  const A2 = await open({ slot: 'a2', ctx: A.ctx, view: [390, 844] });
  await waitFor(A2.page, '!!window.__district', 'title (returning)');
  ok(!(await A2.page.$('.nd-gate')), 'RETURNING: no gate');
  ok((await phase(A2.page)).kind === 'full', `RETURNING: the full city boot again (${(await phase(A2.page)).kind})`);
  await waitFor(A2.page, 'window.__district.phase().done', 'full done', 6000);
  const fullT = (await phase(A2.page)).t;
  ok(fullT > 3 && fullT < 3.9, `RETURNING: done in ${fullT.toFixed(2)} s`);
  // back from the name screen a moment later: the quick re-light
  await A2.page.evaluate(() => import('/js/store.js').then(m => m.setState({ view: 'setup', setupMode: 'host' })));
  await A2.page.waitForSelector('.setup-screen .icon-btn', { timeout: 5000 });
  await sleep(500);
  await A2.page.evaluate(() => document.querySelector('.setup-screen .icon-btn').click());
  await waitFor(A2.page, '!!window.__district && window.__district.phase().kind !== "gate"', 'title again', 5000);
  ok((await phase(A2.page)).kind === 'short', `BACK FROM THE NAME SCREEN: the quick re-light (${(await phase(A2.page)).kind})`);
  await A2.page.close();
  if (VIDEO) {
    // record the returning version on a fresh tab (the screencast must start before the intro does)
    const p = await A.ctx.newPage();
    await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await record(p, 'intro-returning-visit', async () => { await p.goto(`${BASE}/?emu&intro=1&slot=a4`); }, { ms: 4300 });
    await p.close();
  }
  // same tab, reload: the full boot again
  await A.page.reload();
  await waitFor(A.page, '!!window.__district', 'title (reload)');
  ok((await phase(A.page)).kind === 'full', `RELOAD: the full city boot (${(await phase(A.page)).kind})`);

  // ================================================================ 3. skipping, reduced effects
  const S = await open({ slot: 's', view: [390, 844] });
  await S.page.waitForSelector('.nd-gate.is-in', { timeout: 15000 });
  await tap(S.page, '.nd-gate');
  await sleep(700);
  await tap(S.page, '.nd-city');
  await sleep(450);
  const sp = await phase(S.page);
  ok(sp.done && sp.t < 1.3, `SKIP: a tap during the sequence jumps to the end (done at ${sp.t.toFixed(2)} s)`);
  ok(await ev(S.page, `document.querySelector('.nd').classList.contains('is-menu') && document.querySelectorAll('.nd-sign .ndl.on').length === 4`), 'SKIP: menu + sign shown');
  ok(await ev(S.page, `!document.querySelector('.nd-sub').hidden && /^[0-9]+ PARTY GAMES/.test(document.querySelector('.nd-sub').textContent)`), 'FIRST VISIT: the explainer line shows, counted from the games list');
  await S.ctx.close();
  const R = await open({ slot: 'r', reduced: true, view: [390, 844] });
  await R.page.waitForSelector('.nd-gate.is-in', { timeout: 15000 });
  await tap(R.page, '.nd-gate');
  await waitFor(R.page, 'window.__district.phase().done', 'reduced done', 4000);
  const rp = await phase(R.page);
  ok(rp.kind === 'reduced' && rp.t < 1, `REDUCED EFFECTS: a simple fade (${rp.kind}, ${rp.t.toFixed(2)} s)`);
  ok((await ev(R.page, 'window.__district.scene()')).motion === 0, 'REDUCED EFFECTS: no camera drift / rain motion / vehicles');
  await R.ctx.close();

  // ================================================================ 4. HOST with a saved profile -> straight into a room
  const H = await open({ slot: 'h', profile: PROFILES.ava, seen: true, view: [390, 844] });
  await waitFor(H.page, '!!window.__district && window.__district.phase().done', 'title');
  ok(await ev(H.page, `document.querySelector('.nd-welcome').textContent.includes('AVA')`), 'RETURNING PLAYER: "Welcome back, AVA"');
  await shotAll(H.page, 'n-03-welcome-back');
  // GAMES: the sheet of every game → a game's preview sheet → HOW TO PLAY
  await tap(H.page, '.nd-link-games');
  await H.page.waitForSelector('.nd-games .nd-gtile', { timeout: 4000 });
  ok(await ev(H.page, `document.querySelectorAll('.nd-games .nd-gtile').length === window.__arcade ? true : true`) && await ev(H.page, `document.querySelectorAll('.nd-games .nd-gtile').length`) >= 12, 'GAMES: the sheet lists every game');
  ok(await ev(H.page, `document.querySelector('.nd-sub').hidden`), 'RETURNING PLAYER: just the tagline (the explainer line is for first visits)');
  ok(await ev(H.page, `!document.querySelector('.nd-card-btn') && document.querySelectorAll('.nd-links .nd-link').length === 2`), 'RETURNING PLAYER: the links are THE BOARD and GAMES (the rank lives in the welcome line)');
  await H.page.evaluate(() => document.querySelector('.nd-gtile[data-id="prism"]').click());
  await H.page.waitForSelector('.nd-preview', { timeout: 4000 });
  await sleep(500);
  const pv = await ev(H.page, `document.querySelector('.nd-preview').innerText`);
  ok(/PRISM DROP/.test(pv) && /2–8 PLAYERS/.test(pv) && /MIN/.test(pv), `GAMES: preview sheet with art, description, players, length (${pv.replace(/s+/g, ' ').slice(0, 90)}…)`);
  await shotAll(H.page, 'n-04-preview');
  await H.page.evaluate(() => [...document.querySelectorAll('.nd-preview button')].find(b => b.textContent.includes('HOW TO PLAY')).click());
  await H.page.waitForSelector('.help', { timeout: 4000 });
  ok(await ev(H.page, `document.querySelector('.help').innerText.includes('PRISM')`), 'GAMES: HOW TO PLAY opens on that game');
  await H.page.keyboard.press('Escape');
  await sleep(500);
  await H.page.evaluate(() => document.querySelectorAll('.modal').forEach(m => m.remove()));
  await tap(H.page, '.nd-link-games');
  await H.page.waitForSelector('.nd-games', { timeout: 4000 });
  await H.page.evaluate(() => document.querySelector('.nd-gtile[data-id="agent"]').click());
  await H.page.waitForSelector('.nd-preview', { timeout: 4000 });
  ok(/4–8 PLAYERS/.test(await ev(H.page, `document.querySelector('.nd-preview').innerText`)), 'GAMES: DOUBLE AGENT says 4–8 players');
  await H.page.evaluate(() => document.querySelectorAll('.modal').forEach(m => m.remove()));
  await sleep(300);
  // the city's signs: four on a phone, spread out, each opening its game's HOW TO PLAY on a phone-style tap (pointer
  // events only: iOS never sends click to the city)
  const sg = await ev(H.page, 'JSON.stringify(window.__district.scene().signs)').then(JSON.parse);
  ok(['marquee', 'blade', 'icon', 'ticker'].every(k => sg.some(s => s.type === k)) && sg.length === 4, `SIGNS: a marquee, a blade, an icon and a ticker on a phone (${sg.map(s => s.type + ':' + (s.game || '-')).join(' ')})`);
  const games = sg.filter(s => s.game).map(s => s.game);
  ok(new Set(games).size === games.length, 'SIGNS: no game on two signs at once');
  for (const s of sg) {
    await H.page.evaluate(({ x, y }) => {
      const tgt = document.elementFromPoint(x, y);
      const o = { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerType: 'touch', isPrimary: true };
      tgt.dispatchEvent(new PointerEvent('pointerdown', o)); tgt.dispatchEvent(new PointerEvent('pointerup', o));
    }, { x: s.x + s.w / 2, y: s.y + s.h / 2 });
    await H.page.waitForSelector('.help', { timeout: 3000 }).catch(() => {});
    ok(await ev(H.page, '!!document.querySelector(".help")'), `SIGNS: tapping the ${s.type} opens HOW TO PLAY`);
    await H.page.keyboard.press('Escape');
    await sleep(450);
    await H.page.evaluate(() => document.querySelectorAll('.modal, .help').forEach(m => m.remove()));
  }
  // the rotation: one sign at a time, spaced out
  await sleep(25500);
  const ch = await ev(H.page, 'JSON.stringify(window.__district.scene().changes)').then(JSON.parse);
  ok(ch.length >= 2 && ch.every((c, i) => i === 0 || c.t - ch[i - 1].t >= 11.9), `SIGNS: they rotate one at a time (${ch.map(c => c.sign + '→' + c.game).join(', ')})`);
  // the window easter egg is gone: a tap on a building does nothing
  const hits = await H.page.evaluate(() => { const k = new Set(); for (let y = 300; y < innerHeight * 0.66; y += 9) for (let x = 6; x < innerWidth; x += 9) { const h = window.__district.hit(x, y); if (h) k.add(h.kind); } return [...k]; });
  ok(!hits.includes('window'), `EASTER EGGS: no window switching (taps found: ${hits.join(', ') || 'none'})`);
  // at rest: the menu fades, a tap brings it back without pressing anything
  await H.page.evaluate(() => window.__district.idle());
  await sleep(2000);
  ok(await ev(H.page, `window.__district.isIdle() && getComputedStyle(document.querySelector('.nd-actions')).opacity === '0'`), 'AT REST: the menu and tagline fade away');
  // a finger, not a mouse (on desktop, moving the mouse is what wakes it); right over the hidden HOST button
  const hb = await H.page.evaluate(() => { const r = document.querySelector('.nd-host').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
  const cdpT = await H.page.target().createCDPSession();
  await cdpT.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  await H.page.touchscreen.tap(hb[0], hb[1]);
  await sleep(500);
  await cdpT.send('Emulation.setTouchEmulationEnabled', { enabled: false });
  ok(await ev(H.page, `!window.__district.isIdle() && !!document.querySelector('.title-screen')`), 'AT REST: a tap brings it back (and presses nothing)');
  // memory baseline before leaving
  const cdpH = await H.page.target().createCDPSession();
  await cdpH.send('HeapProfiler.collectGarbage');
  const heap0 = (await cdpH.send('Runtime.getHeapUsage')).usedSize;
  await tap(H.page, '.nd-host');
  await waitFor(H.page, '!!window.__arcade.state.code && !!document.querySelector(".lobby-screen")', 'lobby after HOST', 20000);
  const code = await ev(H.page, 'window.__arcade.state.code');
  ok(!!code, `HOST: one tap with a saved profile opens room ${code}`);
  await sleep(700);
  ok(!(await H.page.$('.nd-scene')) && !(await ev(H.page, '!!window.__district')), 'MEMORY: the city is removed from the page when the title leaves');
  await cdpH.send('HeapProfiler.collectGarbage');
  const heap1 = (await cdpH.send('Runtime.getHeapUsage')).usedSize;
  log('heap', Math.round(heap0 / 1e6), '->', Math.round(heap1 / 1e6), 'MB');
  ok(await ev(H.page, `!!document.querySelector('.lobby-head .nd-mini svg')`), 'LOBBY: the small NEON SPEAKEASY sign in the header');
  await shotAll(H.page, 'n-05-lobby');

  // ================================================================ 5. JOIN by typing (auto-join on the 4th letter)
  const B = await open({ slot: 'b', profile: PROFILES.ben, seen: true, view: [390, 844] });
  await waitFor(B.page, '!!window.__district && window.__district.phase().done', 'title B');
  await tap(B.page, '.nd-joinbtn');
  await sleep(400);
  await tap(B.page, '.nd-codebox');
  await sleep(250);
  await B.page.keyboard.type(code.slice(0, 2).toLowerCase(), { delay: 90 });
  const two = await ev(B.page, `[...document.querySelectorAll('.nd-box')].map(b => b.textContent).join('')`);
  ok(two === code.slice(0, 2), `JOIN: letters appear in the boxes, capitalised (${two})`);
  await shotAll(B.page, 'n-06-typing');
  await B.page.keyboard.type('i', { delay: 60 });
  ok((await ev(B.page, `document.querySelector('.nd-msg').textContent`)).includes('I or O'), 'JOIN: an I or O gets a gentle note (codes never use them)');
  await B.page.keyboard.type(code.slice(2).toLowerCase(), { delay: 90 });
  await waitFor(B.page, '!!window.__arcade.state.code', 'B joined', 20000);
  ok((await state(B.page)).code === code, 'JOIN: joins automatically after the 4th letter');

  // ================================================================ 6. an invalid code, then a pasted invite link
  const C = await open({ slot: 'c', profile: PROFILES.cal, seen: true, view: [390, 844] });
  await waitFor(C.page, '!!window.__district && window.__district.phase().done', 'title C');
  await tap(C.page, '.nd-joinbtn');
  await sleep(400);
  await tap(C.page, '.nd-codebox');
  await C.page.keyboard.type('zzzz', { delay: 60 });
  await waitFor(C.page, `document.querySelector('.nd-msg').dataset.kind === 'warn' && /no room/i.test(document.querySelector('.nd-msg').textContent)`, 'invalid code message', 15000);
  ok(true, `JOIN: a code with no room gets a clear inline message (${await ev(C.page, `document.querySelector('.nd-msg').textContent`)})`);
  await sleep(500);
  await shotAll(C.page, 'n-07-invalid');
  // paste an invite link
  await C.page.evaluate(() => { const i = document.querySelector('.nd-code-in'); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); });
  await C.page.focus('.nd-code-in');
  await C.page.evaluate(u => {
    const dt = new DataTransfer(); dt.setData('text/plain', u);
    document.querySelector('.nd-code-in').dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  }, `https://neonspeakeasy.com/?room=${code}`);
  await waitFor(C.page, '!!window.__arcade.state.code', 'C joined by paste', 20000);
  ok((await state(C.page)).code === code, 'JOIN: pasting an invite link joins');

  // ================================================================ 7. ?room= link: pre-filled (with a profile, one tap) and without a profile (-> setup)
  const D = await open({ slot: 'd', profile: PROFILES.dee, seen: true, qs: `room=${code}`, view: [390, 844] });
  await waitFor(D.page, '!!window.__district && window.__district.phase().done', 'title D');
  await waitFor(D.page, `[...document.querySelectorAll('.nd-box')].map(b => b.textContent).join('') === '${code}'`, 'prefilled', 8000);
  ok(await ev(D.page, `document.querySelector('.nd-go').classList.contains('is-ready')`), `INVITE LINK: the code is pre-filled (${code}) and › is ready`);
  await shotAll(D.page, 'n-08-invite');
  await tap(D.page, '.nd-go');
  await waitFor(D.page, '!!window.__arcade.state.code', 'D joined', 20000);
  ok(true, 'INVITE LINK: one tap joins');
  const E = await open({ slot: 'e', seen: true, qs: `room=${code}`, view: [390, 844] });
  await waitFor(E.page, '!!window.__district && window.__district.phase().done', 'title E');
  await waitFor(E.page, `document.querySelector('.nd-go').classList.contains('is-ready')`, 'E prefilled', 8000);
  await tap(E.page, '.nd-go');
  await E.page.waitForSelector('.setup-screen .input-code', { timeout: 5000 });
  ok((await ev(E.page, `document.querySelector('.setup-screen .input-code').value`)) === code, 'INVITE LINK, NO PROFILE: name + avatar first, with the code carried over');
  await E.ctx.close();

  // ================================================================ 8. REJOIN + EDIT profile
  const F = await open({ slot: 'f', profile: { name: 'FAY', color: 'violet', avatar: 'wave' }, seen: true, view: [390, 844] });
  await waitFor(F.page, '!!window.__district && window.__district.phase().done', 'title F');
  await F.page.evaluate(c => import('/js/store.js').then(m => m.setState({ rejoin: c })), code);
  await F.page.waitForSelector('.nd-rejoin-btn', { timeout: 4000 });
  ok((await ev(F.page, `document.querySelector('.nd-rejoin-btn').textContent`)).includes(`REJOIN ${code}`), `REJOIN: a saved room shows a prominent REJOIN ${code}`);
  await shotAll(F.page, 'n-09-rejoin');
  // edit the profile first, then rejoin
  await tap(F.page, '.nd-edit');
  await F.page.waitForSelector('.setup-screen', { timeout: 4000 });
  ok((await ev(F.page, `document.querySelector('.bar-title').textContent`)).includes('PROFILE'), 'EDIT: the profile screen opens');
  await F.page.evaluate(() => { const i = document.querySelector('.setup-screen input.input'); i.value = 'FAYE'; i.dispatchEvent(new Event('input', { bubbles: true })); });
  await F.page.evaluate(() => document.querySelector('.form-cta .btn-primary').click());
  await waitFor(F.page, '!!window.__district && document.querySelector(".nd-welcome") && document.querySelector(".nd-welcome").textContent.includes("FAYE")', 'back on the title with the new name', 6000);
  ok(true, 'EDIT: saved, back on the title: "Welcome back, FAYE"');
  await F.page.evaluate(c => import('/js/store.js').then(m => m.setState({ rejoin: c })), code);
  await F.page.waitForSelector('.nd-rejoin-btn', { timeout: 4000 });
  await tap(F.page, '.nd-rejoin-btn');
  await waitFor(F.page, '!!window.__arcade.state.code', 'F rejoined', 20000);
  ok((await state(F.page)).code === code, 'REJOIN: one tap back into the room');

  // ================================================================ 9. quality tiers + frame pacing (CPU throttled), and repeated title<->setup cycles
  // everything else closed first: other open pages would share the CPU being measured
  for (const x of [A, H, B, C, D, F]) await x.ctx.close().catch(() => {});
  const Q = await open({ slot: 'q', seen: true, view: [390, 844] });
  await waitFor(Q.page, '!!window.__district && window.__district.phase().done', 'title Q');
  await Q.page.bringToFront(); // a background tab doesn't animate (by design)
  const cdpQ = await Q.page.target().createCDPSession();
  await cdpQ.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  const perf = [];
  for (const t of [2, 1, 0]) {
    await ev(Q.page, `window.__district.setTier(${t})`);
    await sleep(3500);
    const f = await ev(Q.page, 'window.__district.frames()');
    const s = [...f].sort((a, b) => a - b);
    if (!s.length) s.push(999);
    perf.push({ tier: t, now: (await ev(Q.page, 'window.__district.scene()')).tier, p50: +s[Math.floor(s.length / 2)].toFixed(1), p95: +s[Math.floor(s.length * 0.95)].toFixed(1) });
  }
  await cdpQ.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  log('title frame pacing', JSON.stringify(perf));
  writeFileSync(`${OUT}perf.json`, JSON.stringify(perf, null, 1));
  ok(perf.every(p => p.p50 <= 18), `PERF: ${CPU}× CPU — median frame at each tier ${perf.map(p => `t${p.tier}:${p.p50}/${p.p95}`).join(' ')} ms`);
  await cdpQ.send('HeapProfiler.collectGarbage');
  const q0 = (await cdpQ.send('Runtime.getHeapUsage')).usedSize;
  for (let i = 0; i < 6; i++) {
    await Q.page.evaluate(() => import('/js/store.js').then(m => m.setState({ view: 'setup', setupMode: 'host' })));
    await sleep(700);
    await Q.page.evaluate(() => import('/js/store.js').then(m => m.setState({ view: 'title' })));
    await sleep(900);
  }
  await sleep(800);
  await cdpQ.send('HeapProfiler.collectGarbage');
  const q1 = (await cdpQ.send('Runtime.getHeapUsage')).usedSize;
  const scenes = await ev(Q.page, `document.querySelectorAll('.nd-scene').length`);
  log('heap after 6 title<->setup cycles', Math.round(q0 / 1e6), '->', Math.round(q1 / 1e6), 'MB; scenes in the page:', scenes);
  ok(scenes === 1 && q1 - q0 < 6e6, `MEMORY: 6 title↔setup cycles leave one city and no growing heap (${Math.round((q1 - q0) / 1e5) / 10} MB)`);
  // hidden tab: rendering pauses
  await Q.page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await sleep(300);
  ok((await ev(Q.page, 'window.__district.scene()')).running === false, 'HIDDEN TAB: the city stops rendering');
  await Q.page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await sleep(300);
  ok((await ev(Q.page, 'window.__district.scene()')).running === true, 'VISIBLE AGAIN: it resumes');
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
