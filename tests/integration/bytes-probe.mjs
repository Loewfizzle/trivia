// THE BYTES PROBE (SPEED PASS B — E2): a fresh visit's bytes in its first SECS seconds (default 25), split music / everything else —
// a fresh browser context (no cache), 402×874, one tap at 3 s (the audio unlocked), a fixed city time (&when= — the same station song).
//   node tests/integration/bytes-probe.mjs "<chrome>"   (env SECS=25 WHEN=2026-10-21T22:00 RUNS=2)
import puppeteer from './kit/puppeteer.mjs';
const BIN = process.argv[2], BASE = process.env.BASE || 'http://localhost:5173', SECS = Number(process.env.SECS || 25), RUNS = Number(process.env.RUNS || 1);
const WHEN = process.env.WHEN || '2026-10-21T22:00';
const browser = await puppeteer.launch({ executablePath: BIN, headless: 'new', args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
for (let k = 0; k < RUNS; k++) {
  const ctx = await browser.createBrowserContext(), p = await ctx.newPage();
  await p.setViewport({ width: 402, height: 874, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const cd = await p.target().createCDPSession(); await cd.send('Network.enable'); await cd.send('Network.setCacheDisabled', { cacheDisabled: false });
  const url = new Map(), tot = { music: 0, other: 0, songs: new Map() };
  cd.on('Network.requestWillBeSent', e => url.set(e.requestId, e.request.url));
  cd.on('Network.loadingFinished', e => { const u = url.get(e.requestId) || ''; const b = e.encodedDataLength || 0; if (/\/audio\/music\//.test(u)) { tot.music += b; const id = u.split('/').pop().split('?')[0]; tot.songs.set(id, (tot.songs.get(id) || 0) + b); } else tot.other += b; });
  await p.evaluateOnNewDocument(() => { try { localStorage.setItem('nd:entered', '1'); } catch { /* */ } });
  await p.goto(`${BASE}/?emu&slot=bp${k}&city=2&when=${WHEN}&tz=America/Detroit&at=42.96,-85.67`);
  await new Promise(r => setTimeout(r, 3000));
  await p.touchscreen.tap(200, 300).catch(() => {});
  await new Promise(r => setTimeout(r, (SECS - 3) * 1000));
  console.log(`run ${k + 1}: music ${(tot.music / 1e6).toFixed(2)} MB (${[...tot.songs].map(([i, b]) => `${i} ${(b / 1e6).toFixed(1)}`).join(', ')}) · everything else ${(tot.other / 1e6).toFixed(2)} MB · total ${((tot.music + tot.other) / 1e6).toFixed(2)} MB in ${SECS} s`);
  await ctx.close();
}
await browser.close();
