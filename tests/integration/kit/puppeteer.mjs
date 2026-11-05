// THE TEST BROWSER (ATM-A Group 0) — every test / shot / bench script imports puppeteer from HERE, never 'puppeteer-core' directly:
//   import puppeteer from './kit/puppeteer.mjs';
// It is puppeteer-core with ONE change: launch() adds the test flags every run needs.
//  · --mute-audio — the tests are SILENT (the owner, Oct 30: the city's sounds came out of the mini PC's TV + soundbar during a pass).
//    Web Audio still runs: the audio checks read the page's own state / analysers, never the speakers.
//  · --disable-gpu-compositing on Windows — THE 30 FPS FIX: the mini PC drives its TV at 4K / 29 Hz, and Chromium on Windows takes
//    its frame clock from the primary display's vsync EVEN HEADLESS (a plain rAF counter: 33.4-ms frames, ~28.5 fps). Software
//    compositing runs on Chromium's own 60 Hz clock (16.7-ms frames) while WebGL stays on the real GPU. Linux (the cloud) is untouched.
//    Skipped when a run asks for the GPU on purpose (--enable-gpu, GPU=1) or VSYNC=display — or a launch with { realCompositor: true }
//    (DESKTOP Group 2: the calm-load check measures FRAME PACING — software compositing adds ~30 ms of presentation a frame under 2× CPU
//    that a phone's GPU never pays; since the owner set the TV to 60 Hz (Nov 1) the real compositor is a 60-Hz clock again).
//  · --use-adapter-luid=<the real GPU> on Windows — THE GPU PIN (SHELL 2.0 B1 Group 0): booted with NO DISPLAY attached (the TV off at a
//    restart), Windows puts the "Microsoft Basic Render Driver" first; Chromium's GPU process then crashes on it ("GPU access is disabled
//    due to frequent crashes") → NO WebGL at all (SHELL 2.0 A's 18 local reds). The Radeon 780M is still there as the second adapter, so
//    the kit asks chrome://gpu once per boot for the first non-Microsoft adapter's LUID (cached in the temp folder — a LUID changes each
//    boot) and pins it. GPU_LUID=off skips it; GPU_LUID=<hi,lo> sets it. Proof: node tests/integration/gpu-check.mjs "<browser>".
import puppeteer from 'puppeteer-core';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { guardUrl } from './live-guard.mjs';

export function testArgs(args = [], o = {}) {
  const out = [...args];
  if (!out.includes('--mute-audio')) out.push('--mute-audio');
  const gpu = out.includes('--enable-gpu') || !!process.env.GPU;
  if (process.platform === 'win32' && !gpu && !o.realCompositor && process.env.VSYNC !== 'display' && !out.includes('--disable-gpu-compositing')) out.push('--disable-gpu-compositing');
  return out;
}

// FR6 FIXES A (G7) — THE LIVE-SITE GUARD on every page of every test browser: page.goto() of a non-local address throws unless LIVE=1
// (then it carries &test=1). Patched once on the page class (every page of every context shares it)
let guarded = false;
async function guard(browser) {
  if (guarded) return browser;
  const pages = await browser.pages(), p = pages[0] || await browser.newPage(), proto = Object.getPrototypeOf(p);
  if (!proto.__liveGuard) {
    const goto = proto.goto;
    proto.goto = function (url, o) { return goto.call(this, guardUrl(url, 'a test page'), o); };
    proto.__liveGuard = true;
  }
  guarded = true;
  return browser;
}
// chrome://gpu's adapter list → the LUID to pin ('hi,lo'), or null when the ACTIVE adapter is already a real GPU (or none is found).
// PURE — tests/test-browser.test.mjs feeds it the text the mini PC printed.
export function pickAdapter(text) {
  const head = String(text).split(/Optimus\s*:/)[0];         // the adapter rows come first, run together (no line breaks)
  const rows = head.split(/GPU\d+\s*:/).slice(1).map(c => {
    const v = /VENDOR\s*=\s*(0x[0-9a-f]+)/i.exec(c), l = /LUID=\{(\d+),(\d+)\}/.exec(c);
    return v && l ? { vendor: v[1].toLowerCase(), luid: l[1] + ',' + l[2], active: /\*ACTIVE\*/.test(c) } : null;
  }).filter(Boolean);
  const real = rows.find(r => r.vendor !== '0x1414');      // 0x1414 = Microsoft (Basic Render Driver / WARP)
  if (!real || rows.some(r => r.active && r.vendor !== '0x1414')) return null;
  return real.luid;
}
let luidAsk = null;
async function adapterLuid(exe) {
  const env = process.env.GPU_LUID;
  if (env === 'off' || process.platform !== 'win32' || !exe) return null;
  if (env && /^d+,d+$/.test(env)) return env;
  const boot = Math.round((Date.now() / 1000 - os.uptime()) / 120);
  const file = path.join(os.tmpdir(), 'neon-gpu-' + boot + '.json');
  try { return JSON.parse(fs.readFileSync(file, 'utf8')).luid; } catch {}
  luidAsk ||= (async () => {
    let luid = null;
    const b = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--mute-audio'] });
    try {
      const p = await b.newPage();
      await p.goto('chrome://gpu');
      for (let i = 0; i < 40 && luid === null; i++) {
        const t = await p.evaluate(() => document.querySelector('info-view')?.shadowRoot?.textContent || '');
        if (/LUID=/.test(t)) { luid = pickAdapter(t); break; }
        await new Promise(r => setTimeout(r, 100));
      }
    } finally { await b.close(); }
    try { fs.writeFileSync(file, JSON.stringify({ luid })); } catch {}
    return luid;
  })();
  return luidAsk;
}
const launch = async (opts = {}) => {
  const { realCompositor, ...rest } = opts;
  const args = testArgs(rest.args, { realCompositor });
  if (!args.some(a => a.startsWith('--use-adapter-luid')) && !args.includes('--disable-gpu')) {
    const luid = await adapterLuid(rest.executablePath).catch(() => null);
    if (luid) {
      args.push('--use-adapter-luid=' + luid);
      // (no display → DirectComposition presents through a display-less DWM at ~20 Hz: the real compositor's frames 51 ms under 2× CPU
      //  with 8 ms of work. Without it the same page runs 15.6-ms frames — the plain swap chain, the GPU's own pace.)
      if (!args.includes('--disable-gpu-compositing') && !args.includes('--disable-direct-composition')) args.push('--disable-direct-composition');
    }
  }
  return guard(await puppeteer.launch({ ...rest, args }));
};

export default new Proxy(puppeteer, {
  get(t, k) {
    if (k === 'launch') return launch;
    const v = t[k];
    return typeof v === 'function' ? v.bind(t) : v;
  },
});
