// FIXES R1 — THE PAGES LOAD (THE REVIEW A1): CITY E shipped js/admin/admin.js with `backups` declared twice — the module failed to parse and
// /admin hung on "Signing in…" for everyone; nothing local ever opened /admin. Every page with its own script is loaded here, in a REAL browser,
// and FAILS on any page error (an unparsed module is one) or a page that never leaves its placeholder:
//   the app (/), /admin, /board, /lab, /daychart, /jaywalk-lab, /highrise-play, /freefall-lab, /freefall-play — on the emulators (?emu). e2e-smoke.mjs runs it first (Chromium; + WebKit when Playwright's
//   WebKit is installed at ~/wk — the cloud has none, it says so). Alone: node tests/integration/kit/page-loads.mjs "<chrome>" [--base URL]
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { guardUrl } from './live-guard.mjs';

/** [path, what "the page's script ran" looks like — a predicate evaluated in the page] */
export const PAGES = [
  ['/', '!!window.__arcade'],
  ['/admin', "!!document.querySelector('#app') && !document.querySelector('#app .ad-wait')"],
  ['/board', "!!document.querySelector('#app') && document.querySelector('#app').children.length > 0"],
  ['/lab', "!!document.querySelector('#app') && !/Checking the door/.test(document.querySelector('#app').textContent)"],
  ['/daychart', "!!document.querySelector('#app') && document.querySelector('#app').textContent.trim() !== 'Checking…'"],
  // (JAYWALK H2B — THE JAYWALK LAB IS OPEN: no gate, no server call — a stranger gets the lab's stage, never a door. The stage alone:
  //  a browser with no WebGL still loaded the page — it says so on the stage)
  ['/jaywalk-lab', "!!document.querySelector('#app .jw-stage') && !document.querySelector('#app .jw-deny')"],
  ['/highrise-play', "!!document.querySelector('#app .hi-stage')"],
  // (FREEFALL F1 — THE FREEFALL LAB: the graybox's stage; no gate, no server call)
  ['/freefall-lab', "!!document.querySelector('#app .ff-stage')"],
  // (FREEFALL F2 — THE TEST PAGE: the real game's stage; no gate, no server call)
  ['/freefall-play', "!!document.querySelector('#app .ff-stage')"],
];
const READY_MS = 25000;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function poll(evalFn, js, ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) { try { if (await evalFn(js)) return true; } catch { /* navigating */ } await sleep(200); }
  return false;
}

/** one engine: `open()` → { page, close } with page.on('pageerror') wired; returns [{ engine, path, ok, why }] */
async function run(engine, open, base) {
  const out = [];
  for (const [path, ready] of PAGES) {
    const errs = [];
    const { page, close } = await open(e => errs.push(String(e && e.message || e)));
    try {
      await page.goto(guardUrl(`${base}${path}${path.includes('?') ? '&' : '?'}emu`, 'page-loads'), { waitUntil: 'load', timeout: 30000 });
      const ran = await poll(js => page.evaluate(js), ready, READY_MS);
      await sleep(400);   // (a late module error after the first paint)
      const ok = ran && !errs.length;
      out.push({ engine, path, ok, why: ok ? '' : [!ran ? 'its script never ran (still the placeholder)' : '', ...errs].filter(Boolean).join(' · ') });
    } catch (e) {
      out.push({ engine, path, ok: false, why: `load failed: ${e.message}` });
    } finally { await close(); }
  }
  return out;
}

/** Chromium through puppeteer's browser (the smoke test's own) */
export async function chromiumPages(browser, base) {
  return run('chromium', async onErr => {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    page.on('pageerror', onErr);
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    return { page, close: () => ctx.close() };
  }, base);
}

/** WebKit through Playwright (~/wk) when installed — null when it isn't (the cloud) */
export async function webkitPages(base) {
  const at = process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs');
  if (!existsSync(at)) return null;
  const { webkit } = await import(pathToFileURL(at).href);
  const browser = await webkit.launch();
  try {
    return await run('webkit', async onErr => {
      const ctx = await browser.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
      const page = await ctx.newPage();
      page.on('pageerror', onErr);
      return { page, close: () => ctx.close() };
    }, base);
  } finally { await browser.close(); }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const argv = process.argv.slice(2);
  const i = argv.indexOf('--base');
  const base = i < 0 ? (process.env.E2E_BASE || 'http://localhost:5173') : argv[i + 1];
  const { default: puppeteer } = await import('./puppeteer.mjs');
  const browser = await puppeteer.launch({ executablePath: argv[0], headless: true, args: ['--mute-audio'] });
  const rows = [...await chromiumPages(browser, base).finally(() => browser.close()), ...(await webkitPages(base) || [])];
  for (const r of rows) console.log(r.ok ? 'OK  ' : 'FAIL', `${r.engine} ${r.path}${r.why ? ' — ' + r.why : ''}`);
  process.exitCode = rows.every(r => r.ok) ? 0 : 1;
}
