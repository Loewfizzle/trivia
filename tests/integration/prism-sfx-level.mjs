// SKINS 2A — THE SKINS' SOUNDS, LEVELLED IN THE GAME (a dev tool — docs/audio.md "PRISM DROP's SKIN SOUNDS"): the real view, the audio unlocked,
// each skin's LOCK + CLEAR played through the real synth and CAPTURED on the SFX bus (every sample — a tap node), then measured the way an ear
// weighs it: K-weighted (ITU-R BS.1770's two filters), the loudest 400 ms (the "momentary" loudness, in LUFS-like dB) + the peak. The song is
// measured the same way on the MUSIC bus. What it answers: does each skin's clear sit level with the others', and under the song?
// (A machine's reading, not an ear — the owner's phone is the last word.)
//   E2E_BASE=http://localhost:5190 node tests/integration/prism-sfx-level.mjs "<browser>"        BLOCK=1 = also the code-made voices (files blocked)
import puppeteer from './kit/puppeteer.mjs';
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const browser = await puppeteer.launch({ executablePath: process.argv[2], headless: 'new', args: ['--autoplay-policy=no-user-gesture-required', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

/** in the page: play `fn()` and capture `ms` of a bus → { lufs (the loudest 400 ms, K-weighted), peak (dBFS) } */
const CAPTURE = `async (which, ms, fnSrc) => {
  const e = await import('/js/audio/engine.js');
  const ctx = e.getContext(), bus = which === 'music' ? e.getMusicBus() : e.getSfxBus();
  const sp = ctx.createScriptProcessor(4096, 1, 1), z = ctx.createGain(), chunks = [];
  z.gain.value = 0;
  sp.onaudioprocess = ev => chunks.push(new Float32Array(ev.inputBuffer.getChannelData(0)));
  bus.connect(sp); sp.connect(z); z.connect(ctx.destination);
  await new Promise(r => setTimeout(r, 200));
  chunks.length = 0;
  if (fnSrc) (0, eval)(fnSrc)();
  await new Promise(r => setTimeout(r, ms));
  bus.disconnect(sp); sp.disconnect(); z.disconnect();
  const n = chunks.reduce((a, c) => a + c.length, 0), x = new Float32Array(n);
  let o = 0; for (const c of chunks) { x.set(c, o); o += c.length; }
  // BS.1770's K-weighting: a high shelf (+4 dB above ~1.7 kHz) then a high-pass (~38 Hz), designed at this context's rate
  const fs = ctx.sampleRate;
  const biquad = (b0, b1, b2, a1, a2) => { let x1 = 0, x2 = 0, y1 = 0, y2 = 0; return v => { const y = b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = v; y2 = y1; y1 = y; return y; }; };
  const shelf = (() => { const f0 = 1681.974450955533, G = 3.999843853973347, Q = 0.7071752369554196, K = Math.tan(Math.PI * f0 / fs), Vh = Math.pow(10, G / 20), Vb = Math.pow(Vh, 0.4996667741545416), a0 = 1 + K / Q + K * K;
    return biquad((Vh + Vb * K / Q + K * K) / a0, 2 * (K * K - Vh) / a0, (Vh - Vb * K / Q + K * K) / a0, 2 * (K * K - 1) / a0, (1 - K / Q + K * K) / a0); })();
  const hp = (() => { const f0 = 38.13547087602444, Q = 0.5003270373238773, K = Math.tan(Math.PI * f0 / fs), a0 = 1 + K / Q + K * K; return biquad(1, -2, 1, 2 * (K * K - 1) / a0, (1 - K / Q + K * K) / a0); })();
  let peak = 0; const k = new Float32Array(n);
  for (let i = 0; i < n; i++) { const v = x[i]; if (Math.abs(v) > peak) peak = Math.abs(v); k[i] = hp(shelf(v)); }
  const win = Math.round(fs * 0.4), hop = Math.round(fs * 0.02);
  let best = 0, acc = 0;
  const sq = new Float64Array(n + 1); for (let i = 0; i < n; i++) sq[i + 1] = sq[i] + k[i] * k[i];
  for (let i = 0; i + win <= n; i += hop) { acc = (sq[i + win] - sq[i]) / win; if (acc > best) best = acc; }
  if (n < win && n > 0) best = sq[n] / win;
  return { lufs: best > 0 ? -0.691 + 10 * Math.log10(best) : -120, peak: peak > 0 ? 20 * Math.log10(peak) : -120, n, fs };
}`;

const rows = [];
async function measure(skin, block) {
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  if (block) { await page.setRequestInterception(true); page.on('request', r => (/\/audio\/sfx\/prism\//.test(r.url()) ? r.abort() : r.continue())); }
  await page.goto(`${BASE}/tests/integration/prism-preview.html?skin=${skin}&n=1&stack=4&under=1&sound=1`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.body.dataset.ready === '1' && !!window.__prism, { timeout: 20000 });
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /TAP FOR SOUND/.test(x.textContent)); if (b) b.click(); });
  await page.mouse.click(195, 500);
  await page.waitForFunction(async () => { const e = await import('/js/audio/engine.js'); return e.isUnlocked(); }, { timeout: 10000 });
  const files = await page.evaluate(() => window.__prism.synthLog && 1);
  void files;
  if (!block) await page.waitForFunction(() => { const s = window.__prism; return !s.samplesReady || s.samplesReady().length === 2 || !/watercolor|paper/.test(location.search); }, { timeout: 8000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 2500));   // (the song has started)
  const cap = (which, ms, fn) => page.evaluate(`(${CAPTURE})(${JSON.stringify(which)}, ${ms}, ${JSON.stringify(fn || '')})`);
  const tag = `${skin}${block ? ' (code-made)' : ''}`;
  const out = { skin: tag };
  // the lock: five plays, the mean (a file's pitch varies ± 3 % a play)
  let l = 0, lp = -120; for (let i = 0; i < 5; i++) { const m = await cap('sfx', 600, `() => window.__prism.sound('lock')`); l += m.lufs / 5; lp = Math.max(lp, m.peak); }
  out.lock = l; out.lockPeak = lp;
  for (const lines of [1, 2, 4]) { const m = await cap('sfx', 1700, `() => window.__prism.sound('clear', { lines: ${lines}, combo: 0 })`); out[`clear${lines}`] = m.lufs; out[`clear${lines}Peak`] = m.peak; }
  const song = await cap('music', 3000, '');
  out.song = song.lufs;
  out.what = await page.evaluate(() => { const l = window.__prism.synthLog(); const k = l.filter(x => x.name === 'lock').pop(), c = l.filter(x => x.name === 'clear').pop(); return `${k && k.file ? 'file' : 'code'} / ${c && c.file ? 'file' : 'code'}`; });
  rows.push(out);
  await page.close();
}
try {
  for (const skin of ['crayon', 'neon', 'watercolor', 'paper']) await measure(skin, false);
  if (process.env.BLOCK === '1') for (const skin of ['watercolor', 'paper']) await measure(skin, true);
} finally { await browser.close(); }
const f = v => (v <= -100 ? '  —  ' : v.toFixed(1).padStart(5));
console.log('the loudest 400 ms, K-weighted (dB, LUFS-like) · peak dBFS in brackets');
console.log('skin                     lock          clear ×1       clear ×2       clear ×4       the song   lock / clear');
for (const r of rows) console.log(`${r.skin.padEnd(22)} ${f(r.lock)} [${f(r.lockPeak)}]  ${f(r.clear1)} [${f(r.clear1Peak)}]  ${f(r.clear2)} [${f(r.clear2Peak)}]  ${f(r.clear4)} [${f(r.clear4Peak)}]   ${f(r.song)}     ${r.what}`);
