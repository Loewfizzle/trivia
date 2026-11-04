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
import puppeteer from 'puppeteer-core';
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
const launch = async (opts = {}) => { const { realCompositor, ...rest } = opts; return guard(await puppeteer.launch({ ...rest, args: testArgs(rest.args, { realCompositor }) })); };

export default new Proxy(puppeteer, {
  get(t, k) {
    if (k === 'launch') return launch;
    const v = t[k];
    return typeof v === 'function' ? v.bind(t) : v;
  },
});
