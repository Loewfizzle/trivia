// SKINS 2A — THE SKINS' SOURCED SOUNDS, in a real page (a dev probe, not a suite — docs/prism.md "THE SKINS" → the sounds):
//   each skin fetches ONLY its own files, only when it shows (watercolor: 2 · paper: 2 · crayon + neon: none); once the audio is unlocked they
//   decode and a lock / a clear PLAYS THE FILE through the synth (the log's `file`); with the files BLOCKED the code-made voice plays instead
//   (the log's `voice`, no `file`) and nothing throws.
//   E2E_BASE=http://localhost:5190 node tests/integration/prism-sfx-probe.mjs "<browser>"
import puppeteer from './kit/puppeteer.mjs';
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const browser = await puppeteer.launch({ executablePath: process.argv[2], headless: 'new', args: ['--autoplay-policy=no-user-gesture-required', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let bad = 0;
const ok = (c, m) => { console.log(`${c ? 'ok  ' : 'FAIL'} ${m}`); if (!c) bad++; };
const WANT = { watercolor: ['watercolor-clear.mp3', 'watercolor-lock.mp3'], paper: ['paper-clear.mp3', 'paper-lock.mp3'], crayon: [], neon: [],
  pixel: ['pixel-clear.mp3', 'pixel-lock.mp3'], galaxy: ['galaxy-clear.mp3', 'galaxy-lock.mp3'] };   // (SKINS 2B: the night skins')
async function run(skin, block) {
  const page = await browser.newPage();
  const errors = [], got = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR_FAILED/.test(m.text())) errors.push(m.text()); });
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.setRequestInterception(true);
  page.on('request', r => { const m = /\/audio\/sfx\/prism\/([^/?]+)$/.exec(r.url()); if (m) got.push(m[1]); if (m && block) r.abort(); else r.continue(); });
  await page.goto(`${BASE}/tests/integration/prism-preview.html?skin=${skin}&n=1&stack=4&under=1&sound=1`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.body.dataset.ready === '1' && !!window.__prism, { timeout: 20000 });
  // the first tap unlocks the audio (the engine's own listeners) — the preview's TAP FOR SOUND button
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /TAP FOR SOUND/.test(x.textContent)); if (b) b.click(); });
  await page.mouse.click(195, 500);
  await page.waitForFunction(async () => { const e = await import('/js/audio/engine.js'); return e.isUnlocked(); }, { timeout: 10000 }).catch(() => {});
  const want = WANT[skin];
  if (want.length && !block) await page.waitForFunction(() => window.__prism.samplesReady().length === 2, { timeout: 10000 }).catch(() => {});
  else await new Promise(r => setTimeout(r, 700));
  const ready = await page.evaluate(() => window.__prism.samplesReady());
  const log = await page.evaluate(async () => {
    const n0 = window.__prism.synthLog().length;
    window.__prism.sound('lock'); window.__prism.sound('clear', { lines: 2, combo: 1 });
    await new Promise(r => setTimeout(r, 300));
    return window.__prism.synthLog().slice(n0).map(x => ({ name: x.name, voice: x.voice || null, file: x.file || null, rate: x.rate == null ? null : x.rate, notes: x.notes.length }));
  });
  const tag = `${skin}${block ? ' (its files BLOCKED)' : ''}`;
  ok(JSON.stringify([...new Set(got)].sort()) === JSON.stringify(want), `${tag}: fetched only its own files (${[...new Set(got)].sort().join(', ') || 'none'})`);
  const lock = log.find(x => x.name === 'lock'), clear = log.find(x => x.name === 'clear');
  ok(!!lock && !!clear, `${tag}: a lock + a clear sounded (${JSON.stringify(log)})`);
  if (want.length && !block) {
    ok(ready.length === 2, `${tag}: both files decoded (${ready})`);
    ok(lock && lock.file === `${skin}-lock` && clear && clear.file === `${skin}-clear`, `${tag}: the FILES played (lock ${lock && lock.file}, clear ${clear && clear.file}); the clear kept its ${clear && clear.notes} notes`);
    // (the owner's add-on) THE LOCK's PITCH: ± 3 % at random each play — 12 locks: every rate inside 0.97 – 1.03, and they differ
    const rates = await page.evaluate(async () => {
      const n0 = window.__prism.synthLog().length;
      for (let i = 0; i < 12; i++) { window.__prism.sound('lock'); await new Promise(r => setTimeout(r, 40)); }
      return window.__prism.synthLog().slice(n0).filter(x => x.name === 'lock').map(x => x.rate);
    });
    const lo = Math.min(...rates), hi = Math.max(...rates);
    ok(rates.length === 12 && rates.every(r => typeof r === 'number') && lo >= 0.97 && hi <= 1.03 && hi - lo > 0.005 && new Set(rates.map(r => r.toFixed(4))).size >= 6,
      `${tag}: a lock's pitch varies ± 3 % a play (${rates.length} plays: ${lo.toFixed(3)} – ${hi.toFixed(3)})`);
    ok(clear && clear.rate == null, `${tag}: a clear keeps its pitch`);
  } else {
    ok(ready.length === 0 && lock && !lock.file && clear && !clear.file, `${tag}: the code-made ${lock && lock.voice ? `voices (${lock.voice} · ${clear.voice})` : 'synth'} played — no file`);
  }
  ok(errors.length === 0, `${tag}: no error (${errors.join(' | ') || 'none'})`);
  await page.close();
}
try {
  for (const skin of ['watercolor', 'paper', 'pixel', 'galaxy', 'crayon', 'neon']) await run(skin, false);
  for (const skin of ['watercolor', 'paper', 'pixel', 'galaxy']) await run(skin, true);
} finally { await browser.close(); }
console.log(bad ? `${bad} FAILED` : 'all ok');
process.exit(bad ? 1 : 0);
