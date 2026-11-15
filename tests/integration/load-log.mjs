// POLISH 5 — THE LOAD LOG, read from a real load: City 2.0 opened like a phone opens it (a Safari-sized viewport whose height changes
// as a tab's bars settle, a throttled network + CPU, a cold cache or a warm one) and its LOAD LOG printed (core/harbor-loadlog.js —
// the same lines the owner's &debug=1 strip shows), ⚠ on every change the eye sees after the reveal.
//
//   node load-log.mjs "<browser>" [--size 402x874] [--bars 716,760@600] [--net 3g|4g] [--cpu 4] [--warm] [--qs "when=…"] [--intro]
//                     [--wait 16000] [--shots ./shots-load] [--dpr 3] [--desktop] [--maxframe 250] [--nodebug] [--qs "party=1"]
// CITY C 0c: --dpr N (default 3) · --desktop (no mobile / touch emulation — the Chromebook) · --maxframe MS: every rAF gap after the reveal
// is watched — exit 1 when one is over MS (the throttled 1366×647 dpr 1 4× CPU proof: no frame > 250 ms after the reveal).
// --bars H0,H1@ms[,H2@ms…]: the viewport's height at the start, then each later height at its ms after the navigation (a tab's bars).
// --warm: navigate once, then measure a SECOND load in the same browser (the cache warm — the owner's case: every load).
// --intro: the full power-on (the emulators are not needed for the title); the default skips it like every E2E (?emu).
// --live: no &when / &tz / &at (any of them makes a preview clock with no live weather) — the real clock + the live weather path (/api/sky: run scripts/serve.mjs --emu, or it fails fast → the seeded sky).
// Exit code 1 when a visible change was logged after the reveal.
import puppeteer from './kit/puppeteer.mjs'; // (+ --mute-audio, the 60 fps fix: kit/puppeteer.mjs)
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
const DPR = Number(opt('dpr', 3)) || 3, DESK = !!opt('desktop', false), MAXF = Number(opt('maxframe', 0)) || 0;
const VP = h => ({ width: W, height: h, deviceScaleFactor: DPR, isMobile: !DESK, hasTouch: !DESK });
const url = `${BASE}/?emu&slot=ll${INTRO ? '&intro=1' : ''}${LIVE ? '' : '&when=2026-10-23T13:00&tz=America/Detroit&at=42.96,-85.67'}&city=2${opt('nodebug', false) ? '' : '&debug=1'}${QS}`;   // (CITY C 0c: --nodebug — what a phone runs: no PIXEL WATCH readback a second after the reveal)
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
const h0 = BARS.length ? BARS[0].h : H;
await page.setViewport(VP(h0));
await page.evaluateOnNewDocument(() => { try { localStorage.setItem('nd:entered', '1'); localStorage.setItem('na:ll:profile', JSON.stringify({ name: 'AVA', color: 'magenta', avatar: 'bolt' })); } catch { /* fine */ } });
const cdp = await page.target().createCDPSession();
// (CITY C 0c: the frame watch — every rAF gap, stamped; the reveal's time read from the harbor's own `shownAt` via the load log's reveal)
if (MAXF) await page.evaluateOnNewDocument(() => { window.__gaps = []; let l = 0; const f = t => { if (l) window.__gaps.push([Math.round(t), Math.round(t - l)]); l = t; requestAnimationFrame(f); }; requestAnimationFrame(f); });
async function load(tag) {
  if (NET) { await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: NET.latency, downloadThroughput: NET.down / 8, uploadThroughput: NET.up / 8 }); }
  if (CPU) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  await page.setViewport(VP(h0));
  const t0 = Date.now();
  const nav = page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  for (const b of BARS.slice(1)) { await sleep(Math.max(0, b.t - (Date.now() - t0))); await page.setViewport(VP(b.h)); }
  await nav;
  await page.waitForFunction('!!window.__district && !!window.__district.harbor && !!window.__district.harbor() && window.__district.harbor().shown', { timeout: 30000 }).catch(() => {});
  if (SHOTS) { mkdirSync(SHOTS, { recursive: true }); for (let i = 0; i < 6; i++) { await page.screenshot({ path: `${SHOTS}/${tag}-${String(i).padStart(2, '0')}.png` }); await sleep(400); } }
  await sleep(Math.max(0, WAIT - (Date.now() - t0)));
  const L = await page.evaluate('(() => { const h = window.__district.harbor(); return h ? h.loadLog : null; })()');
  if (MAXF && L) L.gaps = await page.evaluate(() => { const h = window.__district.harbor(), at = h && h.shownAtMs != null ? h.shownAtMs : null; return { at, after: at == null ? null : window.__gaps.filter(g => g[0] - g[1] >= at).map(g => g[1]), when: at == null ? [] : window.__gaps.filter(g => g[0] - g[1] >= at && g[1] > 250).map(g => `${g[1]}@+${((g[0] - g[1] - at) / 1000).toFixed(2)}s`) }; });
  if (CPU) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  return L;
}
let L = await load('cold');
if (WARM) L = await load('warm');
console.log(`LOAD LOG — ${W}×${h0}${BARS.length > 1 ? ` bars ${BARS.map(b => b.h).join('→')}` : ''}${NET ? ` net ${opt('net')}` : ''}${CPU ? ` cpu ${CPU}×` : ''} ${WARM ? 'warm' : 'cold'}${INTRO ? ' intro' : ''}${LIVE ? ' live' : ''}`);
if (!L) { console.log('no load log (the Harbor never came up)'); await browser.close(); process.exit(1); }
for (const l of L.lines) console.log('  ' + l);
console.log(`visible changes after the reveal: ${L.visible.length}`);
let bad = L.visible.length > 0;
if (MAXF) {
  const g = L.gaps || {}, after = g.after || [], worst = after.length ? Math.max(...after) : null, over = after.filter(d => d > MAXF);
  console.log(`frames after the reveal (at ${g.at == null ? '?' : Math.round(g.at)} ms): ${after.length} · the longest ${worst == null ? '—' : worst} ms · over ${MAXF} ms: ${over.length ? (g.when && g.when.length ? g.when.join(', ') : over.join(', ')) : 'none'}`);
  if (g.at == null || over.length) bad = true;
}
await browser.close();
process.exit(bad ? 1 : 0);
