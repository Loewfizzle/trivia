// TWO SONGS AT ONCE (the inbox, Nov 26 2026 — the owner's iPhone: city music → THE DAILIES → start a daily → the daily's song AND the city's):
// the REAL app on the emulators (never the live site), 402 × 874 @3, a real tap to unlock the audio, the city's radio SYNCED — then
//   · THE PICKER (state.daily = { v: 'screen' }) keeps the radio on
//   · a daily RUN (state.daily = { v: 'run', id }) rests the synced radio within a second, and ONE song plays: the run's own deck on this
//     phone's own player (js/app.js#inDailyRun — musicTick's gates + the stop in render()).
// The state is set on the app's own state object (window.__arcade.state — what musicTick reads every 250 ms): the music's gates are what is
// tested here, not the dailies' screens (e2e-daily.mjs plays those).
// THE ROOM-LOBBY CASE (FREEFALL F3B — the owner's F3 OPEN FOR BEN 9, "also from a room's lobby"): a second phone HOSTS a real room on the
// emulators (the app's own HOST flow), ONE song sounds in its lobby; a daily run from there → still exactly ONE song (the run's own deck:
// the room's synced song rests on this phone, the city's radio stays off — the host keeps the room's queue going); back in the lobby: ONE.
//   node tests/integration/daily-music.mjs "<chromium>"      (the emulators + `node scripts/serve.mjs <port> --emu`; E2E_BASE=http://localhost:<port>)
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const b = await puppeteer.launch({ executablePath: process.argv[2], headless: true, protocolTimeout: 240000, args: ['--enable-gpu', '--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=user-gesture-required'] });
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const waitFor = async (p, js, ms = 20000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* loading */ } await sleep(50); } return false; };
/** what plays: the synced city radio · the room's synced song · this phone's own player (its unpaused voices that sound) */
const music = p => p.evaluate(() => { const A = window.__arcade, pm = A.partyMusicDebug(), md = A.musicDebug(); return { synced: !!(pm && pm.synced), station: pm && (pm.station || pm.kind), lobby: !!A.lobbyMusicDebug(), desired: md.desired, playing: md.playing, own: md.voices.filter(v => !v.paused && v.gain > 0.02).map(v => v.id), daily: A.state.daily ? A.state.daily.v : null }; });

const ctx = await b.createBrowserContext(), p = await ctx.newPage(), cdp = await p.createCDPSession(), errs = [];
p.on('pageerror', e => errs.push(String(e.message || e)));
await p.setViewport({ width: 402, height: 874, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await p.evaluateOnNewDocument(() => { try { localStorage.setItem('nd:entered', '1'); } catch { /* fine */ } });
// (a mid-song evening on the night station: the city's radio is a station on the server clock)
await p.goto(guardUrl(`${BASE}/?emu&slot=dmu1&when=2026-11-06T21:32:40&wx=clear&tz=America/Detroit&at=42.96,-85.67&city=2`, 'daily-music'), { waitUntil: 'load' });
const up = await waitFor(p, "(() => { const b = document.getElementById('boot'); return !!(window.__arcade && window.__district && window.__district.loadProbe && window.__district.loadProbe().shown) && (!b || b.classList.contains('out')); })()", 60000);
ok(up, 'the real app is up on the emulators: the city on screen');
await sleep(2500);
const pt = { x: 200, y: 230, id: 1, radiusX: 4, radiusY: 4, force: 1 };
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });   // (the sky: the first gesture)
const synced = await waitFor(p, 'window.__arcade.partyMusicDebug() && window.__arcade.partyMusicDebug().synced', 40000);
let m = await music(p);
ok(synced && !m.lobby && !m.own.length, `after the first tap the city's radio plays SYNCED (${m.station}) — and nothing else (this phone's own player: ${m.own.join(', ') || 'silent'})`);
// THE PICKER: the radio stays on
await p.evaluate(() => { window.__arcade.state.daily = { v: 'screen', tab: 'today' }; });
await sleep(900);
m = await music(p);
ok(m.synced && !m.own.length && m.daily === 'screen', `the daily PICKER (v: 'screen') keeps the city's radio on (synced ${m.synced})`);
await p.evaluate(() => { window.__arcade.state.daily = null; });
await sleep(300);
// A RUN: the synced radio rests, ONE song plays
const t0 = Date.now();
await p.evaluate(() => { window.__arcade.state.daily = { v: 'run', id: 'password' }; });
const rested = await waitFor(p, '!window.__arcade.partyMusicDebug().synced', 1500), ms = Date.now() - t0;
m = await music(p);
ok(rested && ms <= 1500 && m.daily === 'run', `a daily RUN (v: 'run'): the synced city radio rests ${ms} ms after it began (the 250-ms tick + its fade)`);
const own = await waitFor(p, "(() => { const d = window.__arcade.musicDebug(); return /^mood:/.test(d.desired || '') && d.voices.some(v => !v.paused && v.gain > 0.02); })()", 20000);
await sleep(1200);
m = await music(p);
ok(own && !m.synced && !m.lobby && m.own.length === 1 && /^mood:(day|evening)$/.test(m.desired || ''), `… and exactly ONE song plays: the run's own deck (${m.desired}) on this phone's own player (${m.own.join(', ') || 'none'}) — the radio ${m.synced ? 'STILL ON' : 'off'}, no room song`);
// back on the city: the radio comes back
await p.evaluate(() => { window.__arcade.state.daily = null; });
const back = await waitFor(p, 'window.__arcade.partyMusicDebug() && window.__arcade.partyMusicDebug().synced', 30000);
const alone = await waitFor(p, "window.__arcade.partyMusicDebug().synced && !window.__arcade.musicDebug().voices.some(v => !v.paused && v.gain > 0.02)", 10000);
m = await music(p);
ok(back && alone && m.synced && !m.own.length, `the run is over: the city's radio is back, synced — and it plays ALONE again (this phone's own player: ${m.own.join(', ') || 'silent'})`);
ok(!errs.length, `no page error (${errs.join(' | ') || 'none'})`);
await ctx.close();

// ---- THE ROOM-LOBBY CASE: a hosted room's lobby → a daily run → back
{
  const ctx2 = await b.createBrowserContext(), q = await ctx2.newPage(), cdp2 = await q.createCDPSession(), errs2 = [];
  q.on('pageerror', e => errs2.push(String(e.message || e)));
  await q.setViewport({ width: 402, height: 874, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await q.evaluateOnNewDocument(() => { try { localStorage.setItem('nd:entered', '1'); } catch { /* fine */ } });
  await q.goto(guardUrl(`${BASE}/?emu&slot=dmu2&when=2026-11-06T21:32:40&wx=clear&tz=America/Detroit&at=42.96,-85.67&city=2`, 'daily-music'), { waitUntil: 'load' });
  const up2 = await waitFor(q, "(() => { const b = document.getElementById('boot'); return !!(window.__arcade && window.__district && window.__district.loadProbe && window.__district.loadProbe().shown) && (!b || b.classList.contains('out')); })()", 60000);
  await sleep(2500);
  await cdp2.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt] }); await cdp2.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await waitFor(q, 'window.__arcade.partyMusicDebug() && window.__arcade.partyMusicDebug().synced', 40000);
  // HOST a room (the app's own flow — kit/harness.mjs#createRoom's steps)
  await q.waitForSelector('.nd-host', { timeout: 20000 });
  for (let k = 0; k < 5 && !(await q.$('.setup-screen input.input')); k++) { await q.click('.nd-host').catch(() => {}); await q.waitForSelector('.setup-screen input.input', { timeout: 6000 }).catch(() => {}); }
  await q.type('.setup-screen input.input', 'ALFA');
  await q.click('.form-cta .btn-primary');
  await q.waitForSelector('.lobby-screen .room-code, .title-screen.is-room .rdk-dock', { timeout: 20000 });
  const inRoom = await waitFor(q, '!!window.__arcade.state.code && window.__arcade.state.ready && window.__arcade.state.meta && window.__arcade.state.meta.status === "lobby"', 20000);
  /** what SOUNDS on this phone: the city's synced radio · the room's synced song (its voices) · this phone's own player (its voices) */
  const sounding = () => q.evaluate(() => { const A = window.__arcade, pm = A.partyMusicDebug(), lm = A.lobbyMusicDebug(), md = A.musicDebug(); const own = md.voices.filter(v => !v.paused && v.gain > 0.02).map(v => v.id), room = lm ? lm.slots.filter(s => s.gain > 0.02).map(s => s.id) : []; return { party: !!(pm && pm.synced), room, own, n: (pm && pm.synced ? 1 : 0) + room.length + own.length, desired: md.desired, queue: !!(A.state.meta && A.state.meta.lm && A.state.meta.lm.songs && A.state.meta.lm.songs.length), daily: A.state.daily ? A.state.daily.v : null }; });
  const one = js => waitFor(q, `(() => { const A = window.__arcade, pm = A.partyMusicDebug(), lm = A.lobbyMusicDebug(), md = A.musicDebug(); const own = md.voices.filter(v => !v.paused && v.gain > 0.02).length, room = lm ? lm.slots.filter(s => s.gain > 0.02).length : 0, party = pm && pm.synced ? 1 : 0; return party + room + own === 1 && (${js}); })()`, 40000);
  const lobbyOne = await one('!party');
  await sleep(1500);
  let v = await sounding();
  ok(up2 && inRoom && lobbyOne && v.n === 1 && !v.party && v.queue, `THE ROOM's LOBBY (a hosted room on the emulators): exactly ONE song sounds — ${v.room.length ? `the room's synced song (${v.room.join(', ')})` : `this phone's own player on the room's song (${v.own.join(', ')})`}; the city's radio is off; the room has its queue`);
  // a daily RUN from the lobby
  const t1 = Date.now();
  await q.evaluate(() => { window.__arcade.state.daily = { v: 'run', id: 'password' }; });
  const rested2 = await waitFor(q, "(() => { const A = window.__arcade, pm = A.partyMusicDebug(), lm = A.lobbyMusicDebug(); return !(pm && pm.synced) && !(lm && lm.slots.some(s => s.gain > 0.02)); })()", 3000), ms2 = Date.now() - t1;
  const ownRun = await one("own === 1 && /^mood:/.test(md.desired || '')");
  await sleep(1500);
  v = await sounding();
  ok(rested2 && ownRun && v.n === 1 && v.own.length === 1 && !v.room.length && !v.party && v.daily === 'run' && /^mood:(day|evening)$/.test(v.desired || ''), `a daily RUN from the lobby: the room's song rests on this phone (${ms2} ms) and exactly ONE song plays — the run's own deck (${v.desired}: ${v.own.join(', ') || 'none'}); room song ${v.room.length ? 'STILL ON' : 'off'}, city radio ${v.party ? 'ON' : 'off'}`);
  ok(v.queue, 'the host keeps the room\'s queue going while it plays its daily (the others still hear the room\'s song)');
  // back in the lobby: ONE song again
  await q.evaluate(() => { window.__arcade.state.daily = null; });
  const backOne = await one('!party');
  await sleep(2500);
  v = await sounding();
  ok(backOne && v.n === 1 && !v.party, `back in the lobby: exactly ONE song again (${v.room.length ? `the room's: ${v.room.join(', ')}` : `this phone's player: ${v.own.join(', ')}`})`);
  ok(!errs2.length, `the room-lobby case: no page error (${errs2.join(' | ') || 'none'})`);
  await ctx2.close();
}
await b.close();
console.log(`\n${checks} checks · ${fails.length} failed`);
for (const f of fails) console.log('  ✗', f);
process.exit(fails.length ? 1 : 0);
