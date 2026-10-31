// THE TEST BROWSER (ATM-A Group 0) — every test / shot / bench script imports puppeteer from HERE, never 'puppeteer-core' directly:
//   import puppeteer from './kit/puppeteer.mjs';
// It is puppeteer-core with ONE change: launch() adds the test flags every run needs.
//  · --mute-audio — the tests are SILENT (the owner, Oct 30: the city's sounds came out of the mini PC's TV + soundbar during a pass).
//    Web Audio still runs: the audio checks read the page's own state / analysers, never the speakers.
//  · --disable-gpu-compositing on Windows — THE 30 FPS FIX: the mini PC drives its TV at 4K / 29 Hz, and Chromium on Windows takes
//    its frame clock from the primary display's vsync EVEN HEADLESS (a plain rAF counter: 33.4-ms frames, ~28.5 fps). Software
//    compositing runs on Chromium's own 60 Hz clock (16.7-ms frames) while WebGL stays on the real GPU. Linux (the cloud) is untouched.
//    Skipped when a run asks for the GPU on purpose (--enable-gpu, GPU=1) or VSYNC=display.
import puppeteer from 'puppeteer-core';

export function testArgs(args = []) {
  const out = [...args];
  if (!out.includes('--mute-audio')) out.push('--mute-audio');
  const gpu = out.includes('--enable-gpu') || !!process.env.GPU;
  if (process.platform === 'win32' && !gpu && process.env.VSYNC !== 'display' && !out.includes('--disable-gpu-compositing')) out.push('--disable-gpu-compositing');
  return out;
}

const launch = (opts = {}) => puppeteer.launch({ ...opts, args: testArgs(opts.args) });

export default new Proxy(puppeteer, {
  get(t, k) {
    if (k === 'launch') return launch;
    const v = t[k];
    return typeof v === 'function' ? v.bind(t) : v;
  },
});
