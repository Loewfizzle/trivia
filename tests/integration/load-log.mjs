// POLISH 5 — THE LOAD LOG, read from a real load: City 2.0 opened like a phone opens it (a Safari-sized viewport whose height changes
// as a tab's bars settle, a throttled network + CPU, a cold cache or a warm one) and its LOAD LOG printed (core/harbor-loadlog.js —
// the same lines the owner's &debug=1 strip shows), ⚠ on every change the eye sees after the reveal.
//
//   node load-log.mjs "<browser>" [--size 402x874] [--bars 716,760@600] [--net 3g|4g] [--cpu 4] [--warm] [--qs "when=…"] [--intro]
//                     [--wait 16000] [--shots ./shots-load]
// --bars H0,H1@ms[,H2@ms…]: the viewport's height at the start, then each later height at its ms after the navigation (a tab's bars).
// --warm: navigate once, then measure a SECOND load in the same browser (the cache warm — the owner's case: every load).
// --intro: the full power-on (the emulators are not needed for the title); the default skips it like every E2E (?emu).
// --live: no &when / &tz / &at (any of them makes a preview clock with no live weather) — the real clock + the live weather path (/api/sky: run scripts/serve.mjs --emu, or it fails fast → the seeded sky).
// Exit code 1 when a visible change was logged after the reveal.
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const argv = process.argv.slice(2);
const BROWSER = argv[0];
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true); };
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const [W, H] = String(opt('size', '402x874')).split('x').map(Number);
const BARS = String(opt('bars', '')).split(',').filter(Boolean).map(s => { const [h, t] = s.split('@'); return { h: Number(h), t: Number(t || 0) }; });
const NET = { '3g': { latency: 150, down: 1.6e6, up: 0.75e6 }, '4g': { latency: 60, down: 9e6, up: 3e6 } }[opt('net', '')] || null;
const CPU = Number(opt('cpu', 0)) || 0, WARM = !!opt('warm', false), INTRO = !!opt('intro', false), LIVE = !!opt('live', false);
const WAIT = Number(opt('wait', 16000)), SHOTS = opt('shots', '') || '';
const QS = opt('qs', '') ? `&${opt('qs')}` : '';
const url = `${BASE}/?emu&slot=ll${INTRO ? '&intro=1' : ''}${LIVE ? '' : '&when=2026-10-23T13:00&tz=America/Detroit&at=42.96,-85.67'}&city=2&debug=1${QS}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
const h0 = BARS.length ? BARS[0].h : H;
await page.setViewport({ width: W, height: h0, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await page.evaluateOnNewDocument(() => { try { localStorage.setItem('nd:entered', '1'); localStorage.setItem('na:ll:profile', JSON.stringify({ name: 'AVA', color: 'magenta', avatar: 'bolt' })); } catch { /* fine */ } });
const cdp = await page.target().createCDPSession();
async function load(tag) {
  if (NET) { await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: NET.latency, downloadThroughput: NET.down / 8, uploadThroughput: NET.up / 8 }); }
  if (CPU) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  await page.setViewport({ width: W, height: h0, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const t0 = Date.now();
  const nav = page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  for (const b of BARS.slice(1)) { await sleep(Math.max(0, b.t - (Date.now() - t0))); await page.setViewport({ width: W, height: b.h, deviceScaleFactor: 3, isMobile: true, hasTouch: true }); }
  await nav;
  await page.waitForFunction('!!window.__district && !!window.__district.harbor && !!window.__district.harbor() && window.__district.harbor().shown', { timeout: 30000 }).catch(() => {});
  if (SHOTS) { mkdirSync(SHOTS, { recursive: true }); for (let i = 0; i < 6; i++) { await page.screenshot({ path: `${SHOTS}/${tag}-${String(i).padStart(2, '0')}.png` }); await sleep(400); } }
  await sleep(Math.max(0, WAIT - (Date.now() - t0)));
  const L = await page.evaluate('(() => { const h = window.__district.harbor(); return h ? h.loadLog : null; })()');
  if (CPU) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  return L;
}
let L = await load('cold');
if (WARM) L = await load('warm');
console.log(`LOAD LOG — ${W}×${h0}${BARS.length > 1 ? ` bars ${BARS.map(b => b.h).join('→')}` : ''}${NET ? ` net ${opt('net')}` : ''}${CPU ? ` cpu ${CPU}×` : ''} ${WARM ? 'warm' : 'cold'}${INTRO ? ' intro' : ''}${LIVE ? ' live' : ''}`);
if (!L) { console.log('no load log (the Harbor never came up)'); await browser.close(); process.exit(1); }
for (const l of L.lines) console.log('  ' + l);
console.log(`visible changes after the reveal: ${L.visible.length}`);
await browser.close();
process.exit(L.visible.length ? 1 : 0);
