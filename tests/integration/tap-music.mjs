// LOAD FIX 3 — THE MUSIC ON THE TAP: from the first tap to the city's music SOUNDING (LOAD FIX 2's known issue: ½–1 s after it).
// The real boot (402×874 @3, cold, the emulators), the city revealed, then a wait (a player looking at the city), then ONE tap on the sky
// (the first gesture: engine.js's unlock). An init script hooks every AudioBufferSourceNode.start of a SONG (a buffer > 8 s) + every
// <audio>.play of a music file: the first sound = the start's call time + its scheduled delay (`when` − the clock). Also: no song voice
// before the tap (NO AUDIO BEFORE A GESTURE), and every phone on the server clock (the station's place at the tap vs the voice's offset).
//   node tests/integration/tap-music.mjs [--engine webkit|chromium|both] [--runs 3] [--wait 3000] [--base http://localhost:5173]
//        [--scene night|day] [--net wifi] (wifi: THE LINE in front — 40 ms + 40 Mbps)
//        [--notap 60] (HE4 — THE WARM-UP, SMALLER: NO tap — the bytes of /audio/music/ fetched in that many seconds after the reveal, each
//                      request + its Range; exits 1 above --cap KB, default 1024)
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { guardUrl } from './kit/live-guard.mjs';
import { startLine } from './kit/line-proxy.mjs';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true); };
const ENGINES = String(opt('engine', 'both')) === 'both' ? ['webkit', 'chromium'] : [String(opt('engine'))];
const RUNS = +opt('runs', 3), WAIT = +opt('wait', 3000), NET = opt('net', '');
const NOTAP = +opt('notap', 0), CAP_KB = +opt('cap', 1024);
// (HE4: after the music starts, HOLD s of it sampled every 200 ms — the warm SLICE hands over to the whole song with no gap: `gaps` = samples
//  with nothing heard, `swaps` = the player's part → whole hand-overs, `whole` = the song decoded whole by then)
const HOLD = +opt('hold', 18);
const UP = opt('base', 'http://localhost:5173');
// (mid-song on each station — a song boundary's crossfade is its own case: --when to pick another moment)
const SCENES = { night: 'when=2026-11-06T21:32:40&wx=clear', day: 'when=2026-11-06T13:01:30&wx=clear' };
const GR = '&tz=America/Detroit&at=42.96,-85.67';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const pw = await import(pathToFileURL(process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs')).href);
const CHROME = process.env.CHROME || 'C:/Users/benja/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe';
const line = NET === 'wifi' ? await startLine({ port: 5187, to: UP, rtt: 40, mbps: 40 }) : null;
const BASE = line ? 'http://localhost:5187' : UP;

const HOOK = () => {
  try { localStorage.setItem('nd:entered', '1'); } catch { /* fine */ }
  const S = window.__tm = { starts: [], tapAt: 0 };
  const o = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function (when, off) {
    try { const b = this.buffer, c = this.context; if (b && b.duration > 60) S.starts.push({ call: performance.now(), at: performance.now() + Math.max(0, ((when || 0) - c.currentTime)) * 1000, dur: +b.duration.toFixed(1), off: +(off || 0).toFixed(2) }); } catch { /* fine */ }
    return o.apply(this, arguments);
  };
  const p = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () { try { if (/\/audio\/music\//.test(this.currentSrc || this.src || '')) S.starts.push({ call: performance.now(), at: performance.now(), el: true, dur: 0 }); } catch { /* fine */ } return p.apply(this, arguments); };
  addEventListener('touchend', () => { if (!S.tapAt) S.tapAt = performance.now(); }, true);
  addEventListener('pointerup', () => { if (!S.tapAt) S.tapAt = performance.now(); }, true);
};

const rows = [];
for (const eng of ENGINES) {
  const browser = await pw[eng === 'webkit' ? 'webkit' : 'chromium'].launch(eng === 'webkit' ? {} : { executablePath: CHROME, args: ['--autoplay-policy=user-gesture-required'] });
  for (let i = 0; i < RUNS; i++) {
    const ctx = await browser.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    await ctx.addInitScript(HOOK);
    const page = await ctx.newPage();
    const music = [];
    if (NOTAP) page.on('response', async res => { if (!/\/audio\/music\//.test(res.url())) return; const req = res.request(); const b = await res.body().catch(() => null); music.push({ url: res.url().split('/').pop().split('?')[0], status: res.status(), range: (req.headers().range || ''), bytes: b ? b.length : Number(res.headers()['content-length'] || 0) }); });
    await page.goto(guardUrl(`${BASE}/?emu&slot=tm${i}&${opt('when', '') ? `when=${opt('when')}&wx=clear` : SCENES[opt('scene', 'night')] || SCENES.night}${GR}&city=2`, 'tap-music.mjs'), { waitUntil: 'commit' });
    await page.waitForFunction("(() => { const b = document.getElementById('boot'); return !!(window.__district && window.__district.loadProbe && window.__district.loadProbe().shown) && (!b || b.classList.contains('out')); })()", null, { timeout: 40000, polling: 50 });
    if (NOTAP) {
      await sleep(NOTAP * 1000);
      const kb = Math.round(music.reduce((n, m) => n + m.bytes, 0) / 1024);
      rows.push({ eng, notapKB: kb, reqs: music.length, before: await page.evaluate('window.__tm.starts.length') });
      console.log(`${eng.padEnd(8)} run ${i + 1}: NO TAP for ${NOTAP} s → ${kb} KB of music fetched in ${music.length} request(s): ${music.map(m => `${m.url} ${m.status}${m.range ? ` [${m.range}]` : ''} ${Math.round(m.bytes / 1024)} KB`).join(' · ') || 'none'}`);
      await ctx.close();
      continue;
    }
    await sleep(WAIT);
    const before = await page.evaluate('window.__tm.starts.length');
    await page.touchscreen.tap(200, 230);   // (the sky: no button, no city piece — the first gesture)
    // (THE MUSIC SOUNDING = the station's synced player has a voice past its start (partyMusicDebug().heard) or this phone's own player
    //  plays (.own) — polled every 20 ms in the page; the song-length buffer starts above only say which kind started)
    await page.evaluate(`(() => { const S = window.__tm; const f = () => { let pm = null; try { pm = window.__arcade.partyMusicDebug(); } catch (e) { /* fine */ } if (pm && (pm.heard || (pm.own && pm.own.el !== undefined && pm.own.at > 0))) { S.heardAt = performance.now(); S.heard = pm.heard ? 'the synced station player' : 'this phone’s own player'; return; } if (performance.now() - S.tapAt < 15000) setTimeout(f, 20); }; f(); })()`);
    await page.waitForFunction('window.__tm.heardAt > 0', null, { timeout: 16000, polling: 50 }).catch(() => {});
    const r = await page.evaluate(`(() => { const S = window.__tm, f = S.starts.find(s => s.call >= S.tapAt && s.dur > 60); let pm = null; try { pm = window.__arcade.partyMusicDebug(); } catch (e) { /* fine */ } return { tap: S.tapAt, heardAt: S.heardAt || 0, heard: S.heard, first: f || null, pm: pm ? { song: pm.song, at: pm.at, synced: pm.synced } : null }; })()`);
    const ms = r.heardAt ? Math.round(r.heardAt - r.tap) : null;
    let hold = null;
    if (ms != null && HOLD > 0) {
      hold = await page.evaluate(async secs => {
        let gaps = 0, n = 0;
        for (let k = 0; k < secs * 5; k++) { await new Promise(res => setTimeout(res, 200)); const d = window.__arcade.partyMusicDebug(); n++; if (!d || !(d.heard || (d.own && d.own.at > 0))) gaps++; }
        const d = window.__arcade.partyMusicDebug(), p = d && d.player;
        return { gaps, n, swaps: p ? p.swaps : null, whole: !!(p && p.decoded && p.decoded.length), parts: p ? p.parts : null };
      }, HOLD);
      console.log(`         ${HOLD} s after: ${hold.gaps}/${hold.n} silent samples · the slice → the whole song: ${hold.swaps} swap(s), whole ${hold.whole}`);
    }
    rows.push({ eng, ms, before, hold, el: !!(r.first && r.first.el), call: r.first ? Math.round(r.first.call - r.tap) : null });
    console.log(`${eng.padEnd(8)} run ${i + 1}: the tap → the music ${ms == null ? 'NEVER (15 s)' : `${ms} ms`}${r.first ? ` (the start called at +${Math.round(r.first.call - r.tap)} ms${r.first.el ? ', this phone\u2019s own <audio>' : `, a ${r.first.dur}-s song from ${r.first.off} s`})` : ''} · song voices before the tap: ${before}${r.pm ? ` · the station: ${r.pm.song} at ${r.pm.at} s` : ''}`);
    await ctx.close();
  }
  await browser.close();
}
if (line) await line.close();
if (NOTAP) {
  for (const eng of ENGINES) { const a = rows.filter(r => r.eng === eng).map(r => r.notapKB).sort((x, y) => x - y); console.log(`${eng}: NO TAP ${NOTAP} s → music fetched, median ${a[Math.floor(a.length / 2)]} KB (${a.join(' / ')}) · song voices: ${rows.filter(r => r.eng === eng).reduce((s, r) => s + r.before, 0)}`); }
  process.exit(rows.some(r => r.notapKB > CAP_KB || r.before > 0) ? 1 : 0);
}
for (const eng of ENGINES) { const a = rows.filter(r => r.eng === eng && r.ms != null).map(r => r.ms).sort((x, y) => x - y); console.log(`${eng}: the tap → the music, median ${a.length ? a[Math.floor(a.length / 2)] : '—'} ms (${a.join(' / ')}) · voices before a tap: ${rows.filter(r => r.eng === eng).reduce((s, r) => s + r.before, 0)}`); }
process.exit(rows.some(r => r.before > 0 || r.ms == null || (r.hold && r.hold.gaps > 0)) ? 1 : 0);
