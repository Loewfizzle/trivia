// NEON SPEAKEASY title screen end to end (needs the emulators + scripts/serve.mjs).
//   node e2e-title.mjs "<browser path>" ./shots-title        (env SHOTS=0, VIDEO=0, CPU=4, GPU=1)
// First visit (gate -> tap -> full power-on, audio unlocked by that tap), returning visit (short, no gate),
// back from the name screen (quick re-light), skip by tapping, reduced effects; HOST with a saved profile (straight into a
// room), JOIN by typing (auto-join on the 4th letter), by pasting an invite link, an invalid word, digits ignored,
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
  // a fixed autumn night (the sign lit, clear, no live weather): the checks never depend on when the suite runs
  const night = /(^|&)when=/.test(qs) ? '' : '&when=2026-10-14T21:30&tz=America/New_York';
  await p.goto(`${BASE}/?emu&intro=1&slot=${slot}${qs ? '&' + qs : ''}${night}`);
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

// ONLY=gate,flow,dock,neon,perf runs just those groups (gate = 1–3 first visit / returning / skip; flow = 4–8 HOST, JOIN,
// invites, REJOIN — they share one room; dock = 8b THE FLANK; neon = 8c THE NEON COMES ALIVE; perf = 9 tiers, frame pacing,
// memory). Run the group you touched while iterating; the whole suite once before committing.
const ONLY = new Set((process.env.ONLY || '').split(',').filter(Boolean));
const on = g => !ONLY.size || ONLY.has(g);
if (ONLY.size) log('ONLY', [...ONLY].join(', '));
let A = null, H = null, B = null, C = null, D = null, F = null;
try {
  if (on('gate')) {
  // ================================================================ 1. first visit: the gate, then the full power-on
  const tStart = Date.now();
  A = await open({ slot: 'a', view: [390, 844] });
  await A.page.evaluate(() => 0).catch(() => {});
  await A.page.waitForSelector('#boot .boot-logo', { timeout: 10000 });
  const bootMs = Date.now() - tStart;
  if (SHOTS) await A.page.screenshot({ path: `${OUT}n-00-boot-390.png` });
  await A.page.waitForSelector('.nd-gate.is-in', { timeout: 15000 });
  // measured in the page (navigation start = 0), not from the test harness (a cold browser context adds seconds)
  const inPage = await ev(A.page, `Math.round(window.__gateAt || 0)`);
  const fcp = await ev(A.page, `Math.round((performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime || 0)`);
  // KNOWN (Oct 20 2026, ROADMAP → Next up): on a cold start the first frame after the gate is built is blocked ~1.6 s (the city's
  // first build / the sky shader), so the gate shows at ~2.2 s (target 1.5 s; ~0.6 s warm). This guards against it getting worse.
  ok(inPage > 0 && inPage < 2600, `FIRST VISIT: TAP TO ENTER is up ${inPage} ms after navigation (first paint at ${fcp} ms; target 1500, regression guard 2600)`);
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
  ok(music.desired === 'mood' && /^m:/.test(music.playing || '') && music.list === 'mood', `AUDIO: the time-of-day mood music plays (${JSON.stringify({ desired: music.desired, playing: music.playing, list: music.list })})`);
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
  // a tapped letter: by night it goes dark for a moment and re-ignites (by day it sparks on for a moment)
  { const r = await ev(A.page, `(() => { const b = document.querySelector('svg.nd-logo').getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; })()`);
    await A.page.mouse.click(r.x + r.w * 0.375, r.y + r.h * 0.5);
    await sleep(700);
    const mid = await ev(A.page, `[...document.querySelectorAll('.nd-sign .ndl')].map(l => l.classList.contains('on') ? 1 : 0).join('')`);
    await sleep(2000);
    const after = await ev(A.page, `[...document.querySelectorAll('.nd-sign .ndl')].map(l => l.classList.contains('on') ? 1 : 0).join('')`);
    ok(mid === '1011' && after === '1111', `SIGN TAP: the E goes dark for a moment, then re-ignites (${mid} → ${after})`); }
  ok(await ev(A.page, `getComputedStyle(document.querySelector('.nd-tab-join')).opacity === '1' && getComputedStyle(document.querySelector('.nd-dk')).opacity === '1'`), 'MENU: eased in');
  ok(await ev(A.page, `document.querySelector('.nd-tab-you').classList.contains('is-guest') && !document.querySelector('.nd-tab-you .avatar')`), 'DOCK, FIRST VISIT: YOU is a neutral outline emblem');
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

  } // gate
  if (on('flow')) {
  // ================================================================ 4. HOST with a saved profile -> straight into a room
  H = await open({ slot: 'h', profile: PROFILES.ava, seen: true, view: [390, 844] });
  await waitFor(H.page, '!!window.__district && window.__district.phase().done', 'title');
  ok(await ev(H.page, `!!document.querySelector('.nd-tab-you .avatar[data-av="bolt"]') && document.querySelector('.nd-tab-you').getAttribute('aria-label').includes('AVA')`), 'RETURNING PLAYER: YOU is their own emblem (and names them for screen readers)');
  await shotAll(H.page, 'n-03-welcome-back');
  // GAMES: the sheet of every game → a game's preview sheet → HOW TO PLAY
  await tap(H.page, '.nd-link-games');
  await H.page.waitForSelector('.nd-games .nd-gtile', { timeout: 4000 });
  ok(await ev(H.page, `document.querySelectorAll('.nd-games .nd-gtile').length === window.__arcade ? true : true`) && await ev(H.page, `document.querySelectorAll('.nd-games .nd-gtile').length`) >= 12, 'GAMES: the sheet lists every game');
  ok(await ev(H.page, `document.querySelector('.nd-sub').hidden`), 'RETURNING PLAYER: just the tagline (the explainer line is for first visits)');
  { const L = await ev(H.page, `(() => { const f = document.querySelector('.nd-flank'), kids = [...f.children].map(c => c.className.split(' ').find(k => /nd-rslot-|nd-pill/.test(k))); const box = s => document.querySelector(s).getBoundingClientRect(); const j = box('.nd-joinring'), hst = box('.nd-hostbtn'), p = box('.nd-pill'); const ic = [...document.querySelectorAll('.nd-pill .nd-tab')].map(t => t.className.match(/nd-tab-(board|games|you)/)[1]); return { kids, ic, labels: document.querySelectorAll('.nd-pill .nd-tab-l').length, jw: Math.round(j.width), hw: Math.round(hst.width), gapL: Math.round(p.left - j.right), gapR: Math.round(hst.left - p.right), mid: Math.round((j.left + hst.right) / 2 - innerWidth / 2), words: [document.querySelector('.nd-joinring .nd-host-label').textContent, document.querySelector('.nd-hostbtn .nd-host-label').textContent], old: !!document.querySelector('.nd-welcome, .nd-links, .nd-edit, .nd-tab-slot') }; })()`);
    ok(L.kids.join(' ') === 'nd-rslot-join nd-pill nd-rslot-host' && L.ic.join(' ') === 'board games you' && L.labels === 0 && !L.old && L.words.join(' ') === 'JOIN HOST',
      `THE FLANK: [ JOIN ring ] [ pill: BOARD · GAMES · YOU, icons only ] [ HOST ring ] (${L.kids.join(' · ')})`);
    ok(L.jw === L.hw && Math.abs(L.gapL - L.gapR) <= 1 && L.gapL >= 6 && L.gapL <= 16 && Math.abs(L.mid) <= 1,
      `THE FLANK: the two rings the same size (${L.jw}/${L.hw}), mirrored round the pill with even tight gaps (${L.gapL}/${L.gapR}), centred (${L.mid})`); }
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
  ok(sg.filter(s => s.type === 'blade').length === 2 && sg.some(s => s.type === 'icon' || s.type === 'roof') && sg.some(s => s.type === 'ticker') && sg.length === 4, `SIGNS: two blades, a rooftop billboard and a ticker on a phone (${sg.map(s => s.type + ':' + (s.game || '-')).join(' ')})`);
  const games = sg.filter(s => s.game).map(s => s.game);
  ok(new Set(games).size === games.length, 'SIGNS: no game on two signs at once');
  for (let si = 0; si < sg.length; si++) {
    // where that sign is right now (they're re-placed when the screen's layout changes)
    const s = (await ev(H.page, 'JSON.stringify(window.__district.scene().signs)').then(JSON.parse))[si] || sg[si];
    const why = await H.page.evaluate(({ x, y }) => {
      const tgt = document.elementFromPoint(x, y);
      const o = { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerType: 'touch', isPrimary: true };
      tgt.dispatchEvent(new PointerEvent('pointerdown', o)); tgt.dispatchEvent(new PointerEvent('pointerup', o));
      return { at: typeof tgt.className === 'string' ? tgt.className : tgt.tagName, hit: window.__district.hit(x, y), done: window.__district.phase().done };
    }, { x: s.x + s.w / 2, y: s.y + s.h / 2 });
    await H.page.waitForSelector('.help', { timeout: 3000 }).catch(() => {});
    const opened = await ev(H.page, '!!document.querySelector(".help")');
    ok(opened, `SIGNS: tapping the ${s.type} opens HOW TO PLAY${opened ? '' : ` (under the finger: ${JSON.stringify(why)})`}`);
    await H.page.keyboard.press('Escape');
    await sleep(450);
    await H.page.evaluate(() => document.querySelectorAll('.modal, .help').forEach(m => m.remove()));
  }
  // the rotation: one sign at a time, spaced out
  // (the first change comes at a random moment; wait for two, then check their spacing)
  await waitFor(H.page, 'window.__district.scene().changes.length >= 2', 'two sign changes', 40000).catch(() => {});
  const ch = await ev(H.page, 'JSON.stringify(window.__district.scene().changes)').then(JSON.parse);
  ok(ch.length >= 2 && ch.every((c, i) => i === 0 || c.t - ch[i - 1].t >= 11.9), `SIGNS: they rotate one at a time (${ch.map(c => c.sign + '→' + c.game).join(', ')})`);
  // the window easter egg is gone: a tap on a building does nothing
  const hits = await H.page.evaluate(() => { const k = new Set(); for (let y = 300; y < innerHeight * 0.66; y += 9) for (let x = 6; x < innerWidth; x += 9) { const h = window.__district.hit(x, y); if (h) k.add(h.kind); } return [...k]; });
  ok(!hits.includes('window'), `EASTER EGGS: no window switching (taps found: ${hits.join(', ') || 'none'})`);
  // at rest: the menu fades, a tap brings it back without pressing anything
  await H.page.evaluate(() => window.__district.idle());
  await waitFor(H.page, `getComputedStyle(document.querySelector('.nd-actions')).opacity === '0'`, 'at rest', 5000).catch(() => {});
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
  B = await open({ slot: 'b', profile: PROFILES.ben, seen: true, view: [390, 844] });
  await waitFor(B.page, '!!window.__district && window.__district.phase().done', 'title B');
  await tap(B.page, '.nd-joinbtn');
  await sleep(400);
  await tap(B.page, '.nd-codebox');
  await sleep(250);
  await B.page.keyboard.type(code.slice(0, 2).toLowerCase(), { delay: 90 });
  const two = await ev(B.page, `[...document.querySelectorAll('.nd-box')].map(b => b.textContent).join('')`);
  ok(two === code.slice(0, 2), `JOIN: letters appear in the boxes, capitalised (${two})`);
  await shotAll(B.page, 'n-06-typing');
  await B.page.keyboard.type('7-', { delay: 60 });
  ok((await ev(B.page, `[...document.querySelectorAll('.nd-box')].map(b => b.textContent).join('')`)) === code.slice(0, 2), 'JOIN: digits and symbols don\'t type (hush words are letters; I and O are fine)');
  await B.page.keyboard.type(code.slice(2).toLowerCase(), { delay: 90 });
  await waitFor(B.page, '!!window.__arcade.state.code', 'B joined', 20000);
  ok((await state(B.page)).code === code, 'JOIN: joins automatically after the 4th letter');

  // ================================================================ 6. an invalid code, then a pasted invite link
  C = await open({ slot: 'c', profile: PROFILES.cal, seen: true, view: [390, 844] });
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
  D = await open({ slot: 'd', profile: PROFILES.dee, seen: true, qs: `room=${code}`, view: [390, 844] });
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
  F = await open({ slot: 'f', profile: { name: 'FAY', color: 'violet', avatar: 'wave' }, seen: true, view: [390, 844] });
  await waitFor(F.page, '!!window.__district && window.__district.phase().done', 'title F');
  await F.page.evaluate(c => import('/js/store.js').then(m => m.setState({ rejoin: c })), code);
  await F.page.waitForSelector('.nd-rejoin-btn', { timeout: 4000 });
  ok((await ev(F.page, `document.querySelector('.nd-rejoin-btn').textContent`)).includes(`REJOIN ${code}`), `REJOIN: a saved room shows a prominent REJOIN ${code}`);
  await shotAll(F.page, 'n-09-rejoin');
  // edit the profile first, then rejoin
  // (no EDIT button on the title: the name opens the card, which has EDIT PROFILE)
  await tap(F.page, '.nd-me');
  await F.page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent.includes('EDIT PROFILE')), { timeout: 8000 });
  await F.page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.includes('EDIT PROFILE')).click());
  await F.page.waitForFunction(() => [...document.querySelectorAll('.setup-screen .bar-title')].some(b => b.textContent.includes('EDIT')), { timeout: 6000 }).catch(() => {});
  ok(await ev(F.page, `[...document.querySelectorAll('.setup-screen .bar-title')].some(b => b.textContent.includes('PROFILE // EDIT'))`), 'EDIT: the profile screen opens (from the card)');
  await F.page.evaluate(() => { const i = document.querySelector('.setup-screen input.input'); i.value = 'FAYE'; i.dispatchEvent(new Event('input', { bubbles: true })); });
  await F.page.evaluate(() => document.querySelector('.form-cta .btn-primary').click());
  await waitFor(F.page, '!!window.__district && document.querySelector(".nd-tab-you") && document.querySelector(".nd-tab-you").getAttribute("aria-label").includes("FAYE")', 'back on the title with the new name', 6000);
  ok(true, 'EDIT: saved, back on the title (YOU: FAYE)');
  await F.page.evaluate(c => import('/js/store.js').then(m => m.setState({ rejoin: c })), code);
  await F.page.waitForSelector('.nd-rejoin-btn', { timeout: 4000 });
  // (a person can't tap in the screen's first few hundred ms; Chrome sends a touch's click to the page behind it then)
  await waitFor(F.page, 'window.__district.phase().done', 'title settled', 6000);
  await sleep(500);
  await tap(F.page, '.nd-rejoin-btn');
  await waitFor(F.page, '!!window.__arcade.state.code', 'F rejoined', 20000);
  ok((await state(F.page)).code === code, 'REJOIN: one tap back into the room');
  ok(await ev(F.page, `!document.querySelector('.nd-cic') && !document.querySelector('.nd-cl-lit') && getComputedStyle(document.querySelector('.menu-btn .mb-bars')).display !== 'none'`), 'CORNER BUTTONS: off the title (the lobby) they are exactly as before');

  } // flow
  if (on('dock')) {
  // ================================================================ 8b. THE NEON RING: the dock
  { const G = await open({ slot: 'g', profile: PROFILES.ava, seen: true, view: [390, 844], qs: 'when=2026-10-20T21:30&tz=America/New_York' });
    await waitFor(G.page, '!!window.__district && window.__district.phase().done', 'title G');
    // touch targets (≥ 44 px) and labels for screen readers
    const tg = await ev(G.page, `JSON.stringify([...document.querySelectorAll('.nd-ringbtn, .nd-tab')].map(b => { const r = b.getBoundingClientRect(), i = b.querySelector('.nd-tab-ic svg'); return { l: b.getAttribute('aria-label'), w: Math.round(r.width), h: Math.round(r.height), ic: i ? Math.round(i.getBoundingClientRect().width) : 0 }; }))`).then(JSON.parse);
    ok(tg.length === 5 && tg.every(t => t.w >= 48 && t.h >= 48 && t.l), `DOCK: five targets, each ≥ 48 px with a label (${tg.map(t => `${t.l.split(',')[0]} ${t.w}×${t.h}`).join(' · ')})`);
    const icons = tg.filter(t => t.ic > 0), rings = tg.filter(t => t.ic === 0);
    ok(icons.length === 3 && rings.length === 2 && icons.every(t => t.ic >= 26 && t.ic <= 29) && rings.every(r => icons.every(t => r.w > t.w)), `DOCK: the pill's icons a comfortable ${icons.map(t => t.ic).join('/')} px; the rings stay the largest`);
    // the ring: lit, wearing the sign's own colours
    const same = async () => ev(G.page, `(() => { const ls = [...document.querySelectorAll('.nd-sign .ndl')].map(l => getComputedStyle(l.querySelector('.ndl-glow1')).stroke); const h = getComputedStyle(document.querySelector('.nd-hostbtn')); return ls.every((c, i) => h.getPropertyValue('--hg' + (i + 1)).trim() === c); })()`);
    let ring = await ev(G.page, 'window.__district.dock.ring()');
    ok(ring.lit && ring.on && await same(), `HOST RING: lit, in the sign's colours (${ring.g[0]})`);
    const white = () => ev(G.page, `(() => { const s = getComputedStyle(document.querySelector('.nd-joinring')); return [s.getPropertyValue('--hg1').trim(), s.getPropertyValue('--hc1').trim(), document.querySelector('.nd-joinring').classList.contains('is-lit')]; })()`);
    let jw = await white();
    ok(jw[2] && ring.join && jw[1] === 'rgb(255, 255, 255)' && /^rgb\((2\d\d), (2\d\d), 255\)$/.test(jw[0]), `JOIN RING: lit, white neon (core ${jw[1]}, glow ${jw[0]})`);
    ok((await ev(G.page, 'window.__district.dock.icons()')).every(Boolean), 'DOCK ICONS, AT NIGHT: the pill\'s icons and the corner buttons lit with the sign');
    ok(await ev(G.page, `!!document.querySelector('.menu-btn .nd-cic svg') && !!document.querySelector('.music-btn .nd-cic svg') && getComputedStyle(document.querySelector('.menu-btn .mb-bars')).display === 'none'`), 'CORNER BUTTONS (title): white neon tubes in the pill\'s glass');
    // a holiday's colours blend in (registered colours): switch the sign to Valentine's and sample the ring mid-way
    await G.page.evaluate(() => { document.querySelector('.nd-sign').classList.add('sg-valentine'); window.__district.dock.recolor(); });
    await sleep(500);
    const mid = await ev(G.page, `getComputedStyle(document.querySelector('.nd-hostbtn')).getPropertyValue('--hg1').trim()`);
    await sleep(1400);
    ring = await ev(G.page, 'window.__district.dock.ring()');
    ok(ring.g[0] === 'rgb(255, 46, 110)' && mid !== 'rgb(255, 46, 110)' && mid !== 'rgb(255, 46, 151)' && await same(), `HOST RING: a holiday's colour blends in with the sign (${mid} → ${ring.g[0]})`);
    jw = await white();
    ok(jw[1] === 'rgb(255, 255, 255)' && /, 255\)$/.test(jw[0]), 'JOIN RING: still white on a holiday');
    await G.page.evaluate(() => { document.querySelector('.nd-sign').classList.remove('sg-valentine'); window.__district.dock.recolor(); });
    // BOARD, GAMES, YOU
    await tap(G.page, '.nd-tab-games'); await G.page.waitForSelector('.nd-games', { timeout: 4000 });
    ok(true, 'DOCK: GAMES opens the games sheet');
    await G.page.evaluate(() => document.querySelectorAll('.modal').forEach(m => m.remove()));
    // JOIN: the panel opens above the bar (the bar never changes shape) and closes by JOIN, outside, swipe down, Escape
    const barBox = async () => ev(G.page, `JSON.stringify(document.querySelector('.nd-bar').getBoundingClientRect())`);
    const bar0 = await barBox();
    await tap(G.page, '.nd-tab-join'); await sleep(500);
    const open1 = await ev(G.page, `(() => { const a = document.querySelector('.nd-actions'), p = document.querySelector('.nd-jpanel').getBoundingClientRect(), b = document.querySelector('.nd-bar').getBoundingClientRect(); return a.classList.contains('is-join') && document.querySelector('.nd-tab-join').getAttribute('aria-expanded') === 'true' && getComputedStyle(document.querySelector('.nd-tab-ind')).opacity === '1' && p.bottom < b.top && /ENTER THE HUSH WORD/.test(document.querySelector('.nd-jpanel').textContent); })()`);
    ok(open1 && (await barBox()) === bar0, 'JOIN: a glass panel rises above the bar ("ENTER THE HUSH WORD", a cyan light under JOIN); the bar doesn\'t move');
    await shotAll(G.page, 'n-10-join-panel');
    await tap(G.page, '.nd-tab-join'); await sleep(450);
    const isOpen = () => ev(G.page, `document.querySelector('.nd-actions').classList.contains('is-join')`);
    ok(!(await isOpen()), 'JOIN: tapping JOIN again closes it');
    await tap(G.page, '.nd-tab-join'); await sleep(450);
    await G.page.evaluate(() => { const o = { bubbles: true, cancelable: true, clientX: 200, clientY: 200, pointerType: 'touch' }; document.querySelector('.nd-sign').dispatchEvent(new PointerEvent('pointerdown', o)); });
    await sleep(300);
    ok(!(await isOpen()), 'JOIN: a tap outside closes it');
    await tap(G.page, '.nd-tab-join'); await sleep(450);
    await G.page.evaluate(() => { const p = document.querySelector('.nd-jp-h'), r = p.getBoundingClientRect(); const o = y => ({ bubbles: true, cancelable: true, clientX: r.x + 20, clientY: y, pointerType: 'touch' }); p.dispatchEvent(new PointerEvent('pointerdown', o(r.y))); p.dispatchEvent(new PointerEvent('pointerup', o(r.y + 70))); });
    await sleep(300);
    ok(!(await isOpen()), 'JOIN: swiping the panel down closes it');
    await tap(G.page, '.nd-tab-join'); await sleep(450);
    await G.page.keyboard.press('Escape'); await sleep(300);
    ok(!(await isOpen()), 'JOIN: Escape closes it');
    // the iOS keyboard: the panel stays just above it (a fake keyboard: the visual viewport shrinks)
    await tap(G.page, '.nd-tab-join'); await sleep(450);
    const kb = await G.page.evaluate(() => {
      const H = innerHeight, vv = window.visualViewport;
      Object.defineProperty(vv, 'height', { get: () => H - 330, configurable: true });
      Object.defineProperty(vv, 'offsetTop', { get: () => 0, configurable: true });
      vv.dispatchEvent(new Event('resize'));
      const p = document.querySelector('.nd-jpanel'); const r = p.getBoundingClientRect();
      return { kb: p.classList.contains('is-kb'), bottom: Math.round(r.bottom), top: Math.round(r.top), limit: H - 330 };
    });
    await sleep(500);
    const kb2 = await ev(G.page, `JSON.stringify(document.querySelector('.nd-jpanel').getBoundingClientRect())`).then(JSON.parse);
    ok(kb.kb && kb2.bottom <= kb.limit && kb2.top > 0, `JOIN: with the keyboard up the panel sits just above it (bottom ${Math.round(kb2.bottom)} ≤ ${kb.limit})`);
    await G.page.keyboard.press('Escape');
    // BOARD
    await tap(G.page, '.nd-tab-board');
    await waitFor(G.page, `window.__arcade.state.view === 'board'`, 'board', 6000);
    ok(true, 'DOCK: BOARD opens THE BOARD');
    await G.ctx.close(); }
  // holidays: the ring matches the sign every time (four colours on a four-colour sign)
  for (const [when, id, multi] of [['2026-10-31T21:00', 'halloween', '1'], ['2026-12-25T20:00', 'christmas', '1'], ['2027-02-14T20:00', 'valentine', '0'], ['2027-03-17T21:00', 'stpatrick', '0']]) {
    const X = await open({ slot: 'x' + id.slice(0, 2), profile: PROFILES.ava, seen: true, view: [390, 844], qs: `when=${when}&tz=America/New_York` });
    await waitFor(X.page, '!!window.__district && window.__district.phase().done', 'title ' + id);
    // the ring has taken the sign's colours (they blend over 1.4 s)
    await waitFor(X.page, `(() => { const ls = [...document.querySelectorAll('.nd-sign .ndl')].map(l => getComputedStyle(l.querySelector('.ndl-glow1')).stroke); const h = getComputedStyle(document.querySelector('.nd-hostbtn')); return (window.__district.scene().holiday || {}).id === '${id}' && ls.every((c, i) => h.getPropertyValue('--hg' + (i + 1)).trim() === c); })()`, 'ring colours ' + id, 6000).catch(() => {});
    const r = await ev(X.page, `(() => { const ls = [...document.querySelectorAll('.nd-sign .ndl')].map(l => getComputedStyle(l.querySelector('.ndl-glow1')).stroke); const h = getComputedStyle(document.querySelector('.nd-hostbtn')); return { hol: (window.__district.scene().holiday || {}).id, match: ls.every((c, i) => h.getPropertyValue('--hg' + (i + 1)).trim() === c), multi: document.querySelector('.nd-hostbtn').dataset.multi, g: h.getPropertyValue('--hg1').trim() }; })()`);
    ok(r.hol === id && r.match && r.multi === multi, `HOST RING, ${id.toUpperCase()}: matches the sign (${r.g}${multi === '1' ? ', four tubes' : ''})`);
    await X.ctx.close();
  }
  // by day: unlit glass, like the sign (Oct 21), the label still crisp; a tap gives a brief glow; the intro: it flickers on with the letters
  { const Y = await open({ slot: 'yd', profile: PROFILES.ava, seen: true, view: [390, 844], qs: 'when=2026-10-20T13:00&tz=America/New_York' });
    await waitFor(Y.page, '!!window.__district && window.__district.phase().done', 'title day');
    const r = await ev(Y.page, `({ lit: document.querySelector('.nd-hostbtn').classList.contains('is-lit'), day: document.querySelector('.nd-actions').classList.contains('is-daylit'), sign: document.querySelector('.nd-sign').classList.contains('is-day') })`);
    ok(!r.lit && r.day && r.sign, 'HOST RING, BY DAY: the sign is dark, and so is the ring (unlit glass)');
    const lab = await ev(Y.page, "getComputedStyle(document.querySelector('.nd-hostbtn .nd-host-label')).color");
    const la = /rgba?\(([\d.]+), ([\d.]+), ([\d.]+)(?:, ([\d.]+))?\)/.exec(lab);
    ok(la && +la[1] > 200 && +la[2] > 200 && (la[4] == null || +la[4] >= 0.85), `HOST RING, BY DAY: its label stays crisp on the dark glass (${lab})`);
    await Y.page.evaluate(() => { const b = document.querySelector('.nd-hostbtn'); b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); });
    ok(await ev(Y.page, "document.querySelector('.nd-hostbtn').classList.contains('is-flash')"), 'HOST RING, BY DAY: a tap gives the dark ring a brief glow');
    ok((await ev(Y.page, 'window.__district.dock.icons()')).every(x => !x), 'DOCK ICONS, BY DAY: empty glass tubes, like the sign (the corner buttons too)');
    ok(!(await ev(Y.page, `document.querySelector('.nd-joinring').classList.contains('is-lit')`)), 'JOIN RING, BY DAY: dark with HOST');
    await Y.ctx.close(); }
  { const I = await open({ slot: 'in', profile: PROFILES.ava, seen: true, view: [390, 844], qs: 'intro=1&when=2026-10-20T21:30&tz=America/New_York' });
    await waitFor(I.page, '!!window.__district && window.__district.phase().kind === "full"', 'intro', 8000);
    const seen = await I.page.evaluate(() => new Promise(res => { const out = []; const t0 = performance.now(); const tick = () => { const h = document.querySelector('.nd-hostbtn'), n = document.querySelector('.nd-sign .ndl-1'); const ic = document.querySelector('.nd-tab-board'), j = document.querySelector('.nd-joinring'); if (h && n) out.push([h.classList.contains('is-lit') ? 1 : 0, n.classList.contains('on') ? 1 : 0, ic && ic.classList.contains('is-lit') ? 1 : 0, j && j.classList.contains('is-lit') ? 1 : 0]); if (performance.now() - t0 < 3600) requestAnimationFrame(tick); else res(out); }; tick(); }));
    const ringFlips = seen.reduce((n, s, i) => n + (i && s[0] !== seen[i - 1][0] ? 1 : 0), 0);
    const firstRing = seen.findIndex(s => s[0]), firstN = seen.findIndex(s => s[1]);
    const icFlips = seen.reduce((n, x, i) => n + (i && x[2] !== seen[i - 1][2] ? 1 : 0), 0);
    ok(icFlips >= 3 && seen[seen.length - 1][2] === 1, `DOCK ICONS, INTRO: BOARD flickers on with its letter (${icFlips} flips) and holds`);
    ok(seen.every(s => s[3] === s[0]), 'JOIN RING, INTRO: flickers on together with HOST, frame for frame');
    ok(ringFlips >= 3 && seen[seen.length - 1][0] === 1 && firstRing >= firstN && firstRing - firstN < 12, `HOST RING, INTRO: flickers on with the letters (${ringFlips} flips, first light ${firstRing - firstN} frames after the N) and holds`);
    await I.ctx.close(); }
  // Reduced effects: no breathing
  { const Rd = await open({ slot: 'rd', profile: PROFILES.ava, seen: true, reduced: true, view: [390, 844], qs: 'when=2026-10-20T21:30&tz=America/New_York' });
    await waitFor(Rd.page, '!!window.__district && window.__district.phase().done', 'title reduced');
    const r = await ev(Rd.page, `({ lit: document.querySelector('.nd-hostbtn').classList.contains('is-lit'), anim: getComputedStyle(document.querySelector('.nd-hglow')).animationName })`);
    ok(r.lit && r.anim === 'none', `REDUCED EFFECTS: the ring is lit, no breathing (${r.anim})`);
    await Rd.ctx.close(); }

  } // dock
  if (on('neon')) {
  // ================================================================ 8c. THE NEON COMES ALIVE (the sign follows the sun)
  { const NY = 'tz=America/New_York';
    const page = async (qs, o = {}) => { const X = await open({ slot: 'n' + Math.random().toString(36).slice(2, 6), profile: PROFILES.ava, seen: true, view: [390, 844], qs, ...o }); await waitFor(X.page, '!!window.__district && window.__district.phase().done', 'title neon'); await waitFor(X.page, `(() => { const n = window.__district.neon(); if (!n.plan || !n.stage) return false; const lit = document.querySelector('.nd-hostbtn').classList.contains('is-lit'); return n.stage === 'day' || n.stage === 'ramp' ? true : lit; })()`, 'neon settled', 8000); await sleep(400); return X; };
    const look = X => ev(X.page, `({ n: window.__district.neon(), icons: window.__district.dock.icons(), ring: window.__district.dock.ring().on, daylit: document.querySelector('.nd-actions').classList.contains('is-daylit'), day: document.querySelector('.nd-sign').classList.contains('is-day'), steady: document.querySelector('.nd-sign').classList.contains('is-steady'), fade: document.querySelector('.nd-sign').classList.contains('is-fade') })`);
    // the day, the ramp, the night, the morning goodbye
    let X = await page(`when=2026-10-20T13:00&${NY}&wx=clear`); let r = await look(X);
    ok(r.n.stage === 'day' && r.n.letters.every(x => !x) && r.icons.every(x => !x) && !r.ring && r.daylit, `NEON, DAY: the sign, the icons and the rings are glass (${r.n.stage})`);
    const plan = r.n.plan;
    ok(plan && plan.catchAt > plan.startAt + 25 * 60000 && plan.clearAt < plan.endAt, 'NEON: the day\'s plan (ramp start, the catch, the morning clear, the goodbye)');
    await X.ctx.close();
    X = await page(`when=2026-10-20T17:25&${NY}&wx=clear`); r = await look(X);
    ok(r.n.stage === 'ramp' && r.icons.every(x => !x) && !r.ring && r.day && !r.steady, `NEON, RAMP: before the catch the sign isn't forced on, the icons and the rings wait for the catch (${r.n.letters.map(Number).join('')})`);
    // a letter tap still works mid-ramp
    { const b = await ev(X.page, `(() => { const r = document.querySelector('svg.nd-logo').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()`);
      const target = r.n.letters[1] ? null : 1;
      if (target != null) { await X.page.mouse.click(b.x + b.w * 0.375, b.y + b.h * 0.5); await sleep(400); }
      ok(target == null || await ev(X.page, `document.querySelectorAll('.nd-sign .ndl')[1].classList.contains('on')`), 'NEON, RAMP: tapping a letter still sparks it'); }
    await X.ctx.close();
    // the catch: fast-forward through it (60×) — the letters lock on, the one sound, the icons on, HOST bright, then the city signs
    // (start three minutes before this layout's catch, read from the plan)
    const cw = new Date(plan.catchAt - 3 * 60000).toLocaleString('sv-SE', { timeZone: 'America/New_York' }).slice(0, 16).replace(' ', 'T');
    X = await page(`when=${cw}&${NY}&wx=clear&speed=10`);
    const s0 = await ev(X.page, 'window.__district.neonSounds()');
    await waitFor(X.page, `window.__district.neon().stage === 'lit'`, 'the catch', 45000);
    await sleep(600);
    r = await look(X);
    const s1 = await ev(X.page, 'window.__district.neonSounds()');
    ok(r.n.letters.every(Boolean) && r.steady && r.icons.every(Boolean) && r.ring && !r.daylit && s0 === 0 && s1 === 1, `NEON, THE CATCH: all four lock on with the one sound (${s0} → ${s1}), the icons and the rings light`);
    const sun = await ev(X.page, `(() => { const s = window.__district.scene(), sk = s.skyline || null; return s.sun; })()`);
    ok(!sun || sun.x > 390 * 0.6, `NEON, THE CATCH: as the sun goes into the right-hand towers (${sun ? sun.x + ',' + sun.y : 'set'})`);
    await waitFor(X.page, `(window.__district.neon().signs || []).slice(0, 2).some(Boolean)`, 'a city sign', 20000).catch(() => {});
    const sg = await ev(X.page, 'window.__district.neon().signs.slice(0, 4).filter(Boolean).length');
    ok(sg >= 1 && sg < 4, `NEON, THE CITY ANSWERS: one sign at a time after the catch (${sg} on so far)`);
    await X.ctx.close();
    // the morning goodbye: the city signs already off, the logo faltering, the icons still lit
    // (3 min after this layout's morning clear — on a phone the arch climbs behind the tall left towers first)
    const clearLocal = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(plan.clearAt + 3 * 60000)).replace(' ', 'T');
    X = await page(`when=${clearLocal}&${NY}&wx=clear`); r = await look(X);
    ok(r.n.stage === 'goodbye' && (r.n.signs || []).every(x => !x) && r.icons.every(Boolean) && r.ring && !r.daylit, `NEON, MORNING: the city signs are off, the logo falters (${r.n.letters.map(Number).join('')}), the dock and the rings stay lit until the last letter`);
    await X.ctx.close();
    // the weather never moves the timing; the same plan on reload
    const catchOf = async qs => { const Y = await page(qs); const c = (await ev(Y.page, 'window.__district.neon()')).plan; const at = await ev(Y.page, `JSON.stringify(window.__district.neonAt(${Date.UTC(2026, 9, 20, 21, 40)}))`); await Y.ctx.close(); return { c, at }; };
    const a = await catchOf(`when=2026-10-20T17:30&${NY}&wx=clear`), b = await catchOf(`when=2026-10-20T17:30&${NY}&wx=storm`), c = await catchOf(`when=2026-10-20T17:30&${NY}&wx=clear`);
    ok(Math.abs(a.c.catchAt - b.c.catchAt) < 15000, `NEON: a storm doesn't move the catch (${new Date(a.c.catchAt).toISOString().slice(11, 19)} vs ${new Date(b.c.catchAt).toISOString().slice(11, 19)})`);
    ok(a.at === c.at, 'NEON: a reload shows the same sputters at the same moment (seeded)');
    // the intro before the catch: the city boots, the sign joins its stage (not forced on)
    X = await page(`intro=1&when=2026-10-20T17:30&${NY}&wx=clear`);
    await waitFor(X.page, 'window.__district.phase().done', 'intro done', 8000);
    r = await look(X);
    ok(r.n.stage === 'ramp' && r.day && !r.steady, 'NEON, INTRO MID-RAMP: the power-on doesn\'t force the sign on');
    await X.ctx.close();
    // ALWAYS NIGHT: lit at noon; Reduced effects: a fade instead of sputters
    X = await open({ slot: 'nan', profile: PROFILES.ava, seen: true, view: [390, 844], qs: `when=2026-10-20T13:00&${NY}&wx=clear` });
    await X.page.evaluateOnNewDocument(() => { try { localStorage.setItem('na:settings', JSON.stringify({ alwaysNight: true })); } catch {} });
    await X.page.reload(); await waitFor(X.page, '!!window.__district && window.__district.phase().done', 'title always night'); await waitFor(X.page, `window.__district.neon().letters.every(Boolean)`, 'always night lit', 6000).catch(() => {});
    r = await look(X);
    ok(r.n.letters.every(Boolean) && r.steady, `NEON, ALWAYS NIGHT: lit at noon (${r.n.stage})`);
    await X.ctx.close();
    X = await page(`when=2026-10-20T17:40&${NY}&wx=clear`, { reduced: true }); r = await look(X);
    const rf = await ev(X.page, `parseFloat(getComputedStyle(document.querySelector('.nd-sign')).getPropertyValue('--rf'))`);
    ok(r.n.stage === 'ramp' && r.fade && rf > 0 && rf < 1 && r.n.plan.reduced, `NEON, REDUCED EFFECTS: a fade instead of sputters (${rf.toFixed(2)})`);
    await X.ctx.close(); }

  } // neon
  // ================================================================ 9. quality tiers + frame pacing (CPU throttled), and repeated title<->setup cycles
  // everything else closed first: other open pages would share the CPU being measured
  for (const x of [A, H, B, C, D, F]) if (x) await x.ctx.close().catch(() => {});
  if (on('perf')) {
  // measured at a fixed afternoon (the cost the budget was set for). At night the top tier is heavier — the lit windows, the
  // trims, the sky — and a 4×-slowed CPU steps down a tier there, as designed (the same before and after LIVE WEATHER).
  const Q = await open({ slot: 'q', seen: true, view: [390, 844], qs: 'when=2026-10-14T14:00&tz=America/New_York' });
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
  } // perf
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
