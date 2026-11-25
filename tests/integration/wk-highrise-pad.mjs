// HIGH RISE PAD + GO — THE CONTROLLER ON WEBKIT (the engine an iPhone runs; Playwright's WebKit as a phone, 390 × 844) on the LOCAL server +
// the emulators (NEVER THE LIVE SITE): the SAME fake-pad checks e2e-highrise.mjs runs in Chromium (kit/highrise-pad.mjs#padSoloCase) —
// the first press only CONNECTS ("🎮 CONNECTED" once) · A = TAP TO START · A drops, each logged at THE PRESS's OWN TICK (an injected
// timestamp) · a pad on another clock still drops · B / Start / the D-pad do nothing · a touch drops the same · REPLAY = LIVE (the
// server's judge on the proof node) · the podium: A = PLAY AGAIN, B = HOME.
//   node tests/integration/wk-highrise-pad.mjs [--browser webkit|chromium] [--base http://localhost:5173] [--shots <dir>]
//   (exit 0 + "SKIPPED" where ~/wk is not installed: the cloud)
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { guardUrl } from './kit/live-guard.mjs';
import { padSoloCase } from './kit/highrise-pad.mjs';
import { verifyNode } from '../../api/_lib/highrise.js';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const BASE = guardUrl(opt('base', 'http://localhost:5173'), 'wk-highrise-pad'), BROWSER = opt('browser', 'webkit'), SHOTS = opt('shots', null);
const at = process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs');
if (!existsSync(at)) { console.log('SKIPPED — Playwright is not installed here (~/wk)'); process.exit(0); }
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const pw = await import(pathToFileURL(at).href);
const DB = 'http://127.0.0.1:9000', NS = 'ns=demo-arcade-default-rtdb', AUTH = { Authorization: 'Bearer owner' };
const dbGet = path => fetch(`${DB}/${path}.json?${NS}`, { headers: AUTH }).then(r => r.json());
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fails = [];
let n = 0;
const ok = (c, what) => { n++; if (!c) fails.push(what); console.log(c ? 'OK  ' : 'FAIL', `${BROWSER}: ${what}`); };
const S = 'window.__arcade.state';
const UP = '!!(window.__district && window.__district.harbor() && window.__district.harbor().shown) && !!window.__arcade && window.__arcade.state.ready && !!window.__arcade.state.uid';

const browser = await pw[BROWSER].launch(BROWSER === 'chromium' ? { executablePath: process.env.CHROME || 'C:/Users/benja/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe', args: ['--mute-audio', '--enable-gpu', '--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist'] } : {});
let fatal = null;
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: BROWSER === 'webkit', hasTouch: true, serviceWorkers: 'block' });
  const slot = `hp${Date.now() % 100000}`;
  await ctx.addInitScript(([s]) => { try { localStorage.setItem('nd:entered', '1'); localStorage.setItem(`na:${s}:profile`, JSON.stringify({ name: 'PADDER', color: 'cyan', avatar: 'bolt' })); localStorage.setItem('na:settings', JSON.stringify({ musicOff: true })); localStorage.setItem('ns:look', 'night'); } catch { /* fine */ } }, [slot]);
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => { if (!/ResizeObserver loop/i.test(e.message)) errs.push(e.message); });
  const ev = js => p.evaluate(js);
  const waitFor = async (js, ms = 20000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* navigating */ } await sleep(80); } return false; };
  const P = { ev, waitFor };
  await p.goto(`${BASE}/?emu&slot=${slot}&city=2&when=2026-11-10T20:30`);
  if (!await waitFor(UP, 90000)) throw new Error('the city never came up');
  // PLAY NOW → HIGH RISE (host.js#playSolo — the card's solo tube calls it)
  await ev("import('/js/host.js').then(h => { h.playSolo('highrise'); })");
  ok(await waitFor(`${S}.game && ${S}.game.id === 'highrise' && ${S}.game.phase === 'play' && !!document.querySelector('.hi-stage.hi-game canvas.hi-canvas') && !!window.__hiGame && window.__hiStage.state().info.warmed > 0`, 60000), 'PLAY NOW → HIGH RISE: the stage in the console\'s frame, at TAP TO START');
  await padSoloCase(P, ok, { sleep, verifyNode, nodeOf: (code, m, uid) => dbGet(`rooms/${code}/hr/${m}/${uid}`), shot: SHOTS ? name => p.screenshot({ path: join(SHOTS, `${BROWSER}-${name}.png`) }) : null });
  ok(errs.length === 0, `no page error (${errs.slice(0, 3).join(' | ') || 'none'})`);
  await ctx.close();
} catch (e) { fatal = e; console.log('FATAL', (e && e.stack) || e); }
await browser.close();
console.log(`\n${BROWSER}: ${n - fails.length}/${n} checks passed${fails.length ? `\nFAILED:\n - ${fails.join('\n - ')}` : ''}`);
process.exit(fatal || fails.length ? 1 : 0);
