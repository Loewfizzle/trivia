// THE SONG DOESN'T CHANGE when entering a lobby (audio/lobby-music.js, core/lobby-song.js), end to end with real audio.
//   node e2e-lobbysong.mjs "<browser path>"        (emulators + scripts/serve.mjs --emu)
// 1. The host hears a mood song on the title, opens a room: the same song keeps playing — no change, no restart, the
//    position continuous — and the room's queue starts with it (meta/lm).
// 2. A joiner on another song crossfades (~1.8 s) into the room's song at the room's place.
// 3. A joiner already on the room's song at the room's place keeps playing it (no restart).
// 4. The fallback: with CLASSIC menu music the room picks its own song as before.
import puppeteer from 'puppeteer-core';

const BROWSER = process.argv[2];
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = [];
const checks = [];
const ok = (cond, what) => { checks.push({ what, ok: !!cond }); log(cond ? 'OK  ' : 'FAIL', what); if (!cond) errors.push(`check failed: ${what}`); };
const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const WHEN = 'when=2026-10-19T22:30&tz=America/Detroit&at=42.96,-85.67';   // evening mood for everyone
const ctxs = [];

async function open(slot, { settings = null, bag = null } = {}) {
  const ctx = await browser.createBrowserContext(); ctxs.push(ctx);
  const p = await ctx.newPage();
  p.on('pageerror', e => { errors.push(`${slot}: ${e.message}`); log(slot, 'PAGEERROR', e.message); });
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await p.evaluateOnNewDocument((s, st, bg) => {
    localStorage.setItem(`na:${s}:profile`, JSON.stringify({ name: s.toUpperCase(), color: 'cyan', avatar: 'bolt' }));
    localStorage.setItem('nd:entered', '1');
    if (st) localStorage.setItem('na:settings', JSON.stringify(st));
    if (bg) localStorage.setItem(`nd:moodbag:${bg.mood}`, JSON.stringify(bg.bag));
  }, slot, settings, bag);
  await p.goto(`${BASE}/?emu&slot=${slot}&${WHEN}`);
  await waitFor(p, '!!window.__district && window.__district.phase().done', `${slot} title`, 25000);
  // the first tap unlocks audio (iOS rules; the engine listens for it)
  await p.mouse.click(195, 300); await sleep(300); await p.mouse.click(200, 320);
  return { ctx, p };
}
const ev = (p, js) => p.evaluate(js);
const md = p => ev(p, 'window.__arcade.musicDebug()');
const ld = p => ev(p, 'window.__arcade.lobbyMusicDebug()');
async function waitFor(p, js, what, timeout = 20000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { try { if (await ev(p, js)) return true; } catch { /* navigating */ } await sleep(150); }
  throw new Error(`timeout: ${what}`);
}
async function joinWord(p, word) {
  await p.click('.nd-joinbtn'); await sleep(400);
  await p.focus('.nd-code-in'); await p.keyboard.type(word.toLowerCase(), { delay: 60 });
  await waitFor(p, `window.__arcade.state.code === '${word}'`, 'joined', 20000);
}

try {
  // ============================================================ 1. the host's song carries on into the room
  const H = await open('lshost');
  await waitFor(H.p, `(() => { const d = window.__arcade.musicDebug(); return d.playing && d.playing.startsWith('m:') && d.at > 4; })()`, 'host mood song', 30000);
  const a = await md(H.p);
  log('host hears', a.playing, a.at);
  await H.p.click('.nd-host');
  await waitFor(H.p, '!!document.querySelector(".lobby-screen")', 'host lobby', 25000);
  await sleep(4000);
  const b = await md(H.p);
  const st = await ev(H.p, '({ code: window.__arcade.state.code, lm: window.__arcade.state.meta && window.__arcade.state.meta.lm })');
  const l1 = await ld(H.p);
  ok(b.playing === a.playing && b.at > a.at + 3 && b.at < a.at + 30, `HOST: the same song keeps playing into the lobby (${a.playing} ${a.at}s → ${b.playing} ${b.at}s, no restart)`);
  ok(st.lm && st.lm.songs[0] === a.playing.slice(2), `HOST: the room's queue starts with it (${st.lm && st.lm.songs[0]})`);
  const voicesOn = b.voices.filter(v => v.gain > 0.05).length;
  ok(voicesOn === 1 && (!l1 || !l1.slots.length), `HOST: one voice only — nothing else started (${voicesOn} own voice, ${l1 ? l1.slots.length : 0} room voices)`);
  // the room's place agrees with the song's place on this phone
  const place = await ev(H.p, `(() => { const lm = window.__arcade.state.meta.lm; return (window.__arcade.serverNow ? window.__arcade.serverNow() : Date.now()) - lm.t0; })()`);
  ok(Math.abs(place / 1000 - b.at) < 3, `HOST: the queue's t0 matches the playback position (${(place / 1000).toFixed(1)}s vs ${b.at}s)`);

  // ============================================================ 2. a joiner on another song crossfades into the room's song
  const others = ['golf-cyber', 'run4', 'spy1', 'prism3', 'slip7', 'menu4', 'prism2', 'run3'].filter(x => x !== st.lm.songs[0]);
  const J = await open('lsjoin', { bag: { mood: 'evening', bag: { order: [others[0], ...others.slice(1), st.lm.songs[0]], i: 0 } } });
  await waitFor(J.p, `(() => { const d = window.__arcade.musicDebug(); return d.playing === 'm:${others[0]}' && d.at > 1; })()`, 'joiner own song', 30000);
  await joinWord(J.p, st.code);
  // sample the handover: the room's voice fades in while the old one fades out
  const samples = [];
  const end = Date.now() + 15000;
  while (Date.now() < end) {
    const [m, l] = await Promise.all([md(J.p), ld(J.p)]);
    const old = m.voices.find(v => v.id === `m:${others[0]}`);
    const room = l && l.slots.find(s => s.id === st.lm.songs[0]);
    samples.push({ old: old ? old.gain : 0, room: room ? room.gain : 0, rt: room ? room.t : null });
    if (room && room.gain > 0.98 && (!old || old.gain < 0.02)) break;
    await sleep(120);
  }
  const both = samples.filter(s => s.old > 0.05 && s.room > 0.05);
  const fin = samples[samples.length - 1];
  ok(both.length >= 3, `JOINER: a crossfade, not a cut (${both.length} samples with both songs sounding)`);
  ok(fin.room > 0.98 && fin.old < 0.02, `JOINER: then only the room's song (${fin.room.toFixed(2)} / ${fin.old.toFixed(2)})`);
  const hNow = await md(H.p);
  ok(fin.rt != null && Math.abs(fin.rt - hNow.at) < 1.5, `JOINER: at the room's place (${fin.rt}s here, ${hNow.at}s on the host)`);
  // M2 — iOS took the joiner's audio and won't give it back (leaving Safari, a call): back on screen + ONE tap → a fresh context, and
  // the room's song comes back in sync with the room's clock (engine.js#rebuild → synced-songs re-connects + re-places it)
  { const vis = v => ev(J.p, `(() => { Object.defineProperty(document, 'visibilityState', { value: '${v}', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); })()`);
    await vis('hidden'); await sleep(500);
    await ev(J.p, `import('/js/audio/engine.js').then(e => e.simulateStuck('interrupted'))`);
    await vis('visible'); await sleep(1900);
    const stuck = await ev(J.p, `import('/js/audio/engine.js').then(e => e.audioHealth())`);
    await ev(J.p, `document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))`);
    let back = null;
    for (let i = 0; i < 40 && !back; i++) { await sleep(150); const l = await ld(J.p); const r = l && l.slots.find(s => s.id === st.lm.songs[0] && s.gain > 0.5); if (r) back = r; }
    const h1 = await md(H.p);
    ok(back && Math.abs(back.t - h1.at) < 1.5, `STUCK: from its first moment back the room's song is at the room's place (${back ? back.t : '—'}s here, ${h1.at}s on the host)`);
    await sleep(2500);        // (and stays there: the player re-places its song twice a second)
    { const l = await ld(J.p); back = (l && l.slots.find(s => s.id === st.lm.songs[0] && s.gain > 0.5)) || back; }
    const h2 = await md(H.p), health = await ev(J.p, `import('/js/audio/engine.js').then(e => e.audioHealth())`);
    ok(stuck.stuck && health.rebuilds === 1 && health.state === 'running', `STUCK: one tap rebuilt the joiner's audio (${stuck.state} → ${health.state}, ${health.why})`);
    ok(back && Math.abs(back.t - h2.at) < 1.5, `STUCK: the room's song is back in sync with the room (${back ? back.t : '—'}s here, ${h2.at}s on the host)`); }

  // ============================================================ 3. a joiner already on the room's song at its place: no restart
  const K = await open('lssame', { bag: { mood: 'evening', bag: { order: [st.lm.songs[0], ...others], i: 0 } } });
  await waitFor(K.p, `(() => { const d = window.__arcade.musicDebug(); return d.playing === 'm:${st.lm.songs[0]}' && d.dur > 0; })()`, 'same song', 30000);
  // put it at the room's place (as if it had started the song together with the host)
  const hAt = (await md(H.p)).at, kd = await md(K.p);
  await K.p.evaluate(s => window.__arcade.musicSeek(s), kd.dur - hAt - 0.4);
  await sleep(300);
  const k0 = await md(K.p);
  await joinWord(K.p, st.code);
  await sleep(5000);
  const k1 = await md(K.p), kl = await ld(K.p);
  ok(k1.playing === k0.playing && k1.at > k0.at + 4 && (!kl || !kl.slots.length), `SAME SONG: keeps playing, no restart (${k0.at}s → ${k1.at}s, ${kl ? kl.slots.length : 0} room voices)`);

  // ============================================================ 4. the fallback: CLASSIC menu music → the room picks its song
  const C = await open('lscls', { settings: { menuMusic: 'classic' } });
  await sleep(3000);
  const tBefore = Date.now();
  await C.p.click('.nd-host');
  await waitFor(C.p, '!!(window.__arcade.state.meta && window.__arcade.state.meta.lm)', 'classic room queue', 25000).catch(async e => { log('classic state', await ev(C.p, 'JSON.stringify({ code: window.__arcade.state.code, view: window.__arcade.state.view, meta: window.__arcade.state.meta, toast: document.querySelector(".nd-note") && document.querySelector(".nd-note").textContent })')); throw e; });
  const clm = await ev(C.p, 'window.__arcade.state.meta.lm');
  ok(clm.t0 >= tBefore - 5000, `FALLBACK: no song to carry over — the room starts its own queue as before (t0 ${((clm.t0 - tBefore) / 1000).toFixed(1)}s after HOST)`);
} catch (e) {
  errors.push(String(e && e.stack || e));
  log('ERROR', e);
}
for (const c of ctxs) await c.close().catch(() => {});
await browser.close();
log(`${checks.filter(c => c.ok).length}/${checks.length} checks passed`);
if (errors.length) { console.log('\nERRORS:\n' + errors.join('\n')); process.exit(1); }
