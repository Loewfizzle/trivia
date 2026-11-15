// CITY D — 7, SCORES SHOWS INSTANTLY: how long DAILIES → SCORES takes to show its EVERYONE list in the REAL app, on a phone network (150 ms each
// way, Chromium's network emulation) against a server whose /api modules are COLD (start a fresh `scripts/serve.mjs <port> --emu` per sample —
// serve.mjs loads each /api module on its first call, as a cold function does):
//   visit 1 — nothing kept on this phone: the time to the list (the rows or "NO ONE HAS FINISHED YET")
//   visit 2 — a return (the kept scores): the time to the list + to the fresh answer ("UPDATING" gone)
//   node tests/integration/scores-open.mjs "<browser>" [--base http://localhost:5176] [--visit 1|2|both]    (the emulators)
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';

const argv = process.argv.slice(2), opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const BASE = opt('base', process.env.E2E_BASE || 'http://localhost:5173'), VISIT = opt('visit', 'both'), SLOT = opt('slot', 'sco');
const browser = await puppeteer.launch({ executablePath: argv[0], headless: true, userDataDir: opt('profile', undefined) });
const p = await browser.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const cdp = await p.createCDPSession();
await p.goto(guardUrl(`${BASE}/?emu&slot=${SLOT}`, 'scores-open.mjs'));
await p.evaluate(s => { localStorage.setItem(`na:${s}:profile`, JSON.stringify({ name: 'TIMER', color: 'cyan', avatar: 'bolt' })); localStorage.setItem('nd:entered', '1'); }, SLOT);
await p.reload();
await p.waitForFunction(s => !document.getElementById('boot') && !!window.__arcade && !!(JSON.parse(localStorage.getItem(`na:${s}:me`) || 'null') || {}).pid, { timeout: 60000 }, SLOT);
await new Promise(r => setTimeout(r, 1500));
await cdp.send('Network.enable');
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8 * 10, uploadThroughput: 750e3 / 8 * 10 });
const SHOWN = "(() => { const s = document.querySelector('.dy-sec'); if (!s) return false; return !!(s.querySelector('.dy-every-today .lb-row, .dy-none') ); })()";
const FRESH = `${SHOWN} && !document.querySelector('.dy-upd')`;
async function visit(tag) {
  const t0 = Date.now();
  await p.evaluate(() => import('/js/store.js').then(m => m.setState({ daily: { v: 'screen', tab: 'scores' } })));
  await p.waitForFunction("!!document.querySelector('.dy-screen .dy-body')", { timeout: 60000, polling: 20 });
  const screen = Date.now() - t0;
  await p.waitForFunction(SHOWN, { timeout: 60000, polling: 50 });
  const shown = Date.now() - t0, kept = await p.evaluate("!!document.querySelector('.dy-upd')");
  await p.waitForFunction(FRESH, { timeout: 60000, polling: 50 });
  const fresh = Date.now() - t0;
  console.log(`${tag}: the screen up in ${screen} ms · the list on screen in ${shown} ms${kept ? ' (the kept scores, marked UPDATING)' : ''} · the fresh answer in ${fresh} ms`);
  await p.evaluate(() => import('/js/store.js').then(m => m.setState({ daily: null })));
  await new Promise(r => setTimeout(r, 800));
  return { screen, shown, fresh, kept };
}
const out = {};
if (VISIT === '1' || VISIT === 'both') out.v1 = await visit('visit 1 (nothing kept)');
if (VISIT === '2' || VISIT === 'both') out.v2 = await visit('visit 2 (a return)');
console.log(JSON.stringify(out));
await browser.close();
