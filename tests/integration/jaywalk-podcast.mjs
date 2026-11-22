// JAYWALK WITH THE SITE's MUSIC OFF (PODCAST MODE — CITY I): EVERY JAYWALK sound still starts — in play and in THE SOUND AUDITION.
// (HIGH RISE S2 FIX, Group 5: js/games/jaywalk/sfx.js refused a NAPPING audio context — the whole game was silent with music off.)
// On /jaywalk-lab (the real sounds module on the shared engine; zero server calls): `na:settings { musicOff: true }` before the page,
// a real touch unlocks the audio, then each sound is asked for through the lab's own hook and must START on the audio context.
//   node tests/integration/jaywalk-podcast.mjs "<chromium>"      (scripts/serve.mjs on :5173)
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { SOUNDS } from '../../js/games/jaywalk/sounds.js';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const b = await puppeteer.launch({ executablePath: process.argv[2], headless: true, args: ['--enable-gpu', '--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const p = await b.newPage(), errs = [];
p.on('pageerror', e => errs.push(String(e.message || e)));
const cdp = await p.createCDPSession();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await p.evaluateOnNewDocument(() => { try { localStorage.setItem('na:settings', JSON.stringify({ musicOff: true })); } catch { /* fine */ } });
await p.goto(guardUrl(`${BASE}/jaywalk-lab?emu`, 'jaywalk-lab'), { waitUntil: 'load' });
const waitFor = async (js, ms = 15000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* loading */ } await sleep(60); } return false; };
const tapAt = async (x, y) => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1, radiusX: 4, radiusY: 4, force: 1 }] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };

ok(await waitFor('!!window.__jwLab && !!window.__jwLab.sfx', 20000), 'the lab is up, its sounds on the shared audio engine');
await tapAt(195, 500); await sleep(500); await tapAt(195, 500);   // (real touches: the first unlocks the audio)
await sleep(900);
// THE AUDITION (the SOUNDS sheet — the lab's run holds still under it)
const snd = await p.evaluate(() => { const r = document.querySelector('.jw-snd').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
await tapAt(snd[0], snd[1]);
ok(await waitFor("!!document.querySelector('.sh.jw-au-sheet.is-in')", 6000), 'SOUNDS → THE SOUND AUDITION opens');
await sleep(900);
const ids = SOUNDS.filter(s => s.play).map(s => s.id);
// each sound, alone (the caps + the voice rule never refuse a lone sound; the sheet holds the lab's own run still — its world makes no
// sound of its own meanwhile): asked through the page's own module — it must START
const res = await p.evaluate(async list => {
  const S = window.__jwLab.sfx, out = {}, wait = ms => new Promise(r => setTimeout(r, ms));
  for (const id of list) {
    S.stopAll(); await wait(260);
    const t0 = performance.now();
    let n0 = S.totals().started, started = false;
    while (!started && performance.now() - t0 < 4000) { S.play(id); await wait(160); started = S.totals().started > n0; }   // (a sound not decoded yet is asked again)
    out[id] = started;
  }
  S.stopAll();
  return out;
}, ids);
const silent = ids.filter(id => !res[id]);
ok(silent.length === 0, `MUSIC OFF (HEAR THE HARBOR): EVERY JAYWALK sound starts — ${ids.length - silent.length} of ${ids.length}${silent.length ? ` (silent: ${silent.join(' · ')})` : ` (${ids.join(' · ')})`}`);
const n0 = await p.evaluate(() => window.__jwLab.sfx.totals().started);
for (const sel of ['[data-snd="hop:a"]', '[data-snd="hop:b"]', '[data-snd="hit:a"]']) {
  const at = await p.evaluate(q => { const el = document.querySelector(q); el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, sel);
  await sleep(350); await tapAt(at[0], at[1]); await sleep(450);
}
const n1 = await p.evaluate(() => window.__jwLab.sfx.totals().started);
ok(n1 - n0 >= 3, `… and THE AUDITION's own PLAY buttons sound with music off (${n1 - n0} of 3 started)`);
ok(errs.length === 0, `no page error (${errs.join(' | ')})`);
await b.close();
console.log(`\n${checks - fails.length}/${checks} checks passed`);
if (fails.length) { console.log('FAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
