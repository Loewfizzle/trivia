// LOAD FIX 2 (Nov 9) — THE CLOUD SNAP: the owner's iPhone, right after the reveal: the clouds SNAPPED (jumped), then FADED to a different
// cloud field. Every path that changes the sky after the reveal, forced on the REAL boot (the live path: no &when / &wx — the real clock +
// the weather feed), with the weather + the clock answered by this script:
//   late       nothing kept on this device; /api/sky answers after the reveal's wait (WX_WAIT) — the seeded sky first, then the real one
//   late-rain  the same, the answer RAIN (the rain ramps in after it lands)
//   stale      a kept answer 20 min old (fresh — the reveal uses it) + a fresh answer moments after the reveal, a different sky
//   nearstale  a kept answer near its end (asked at once, but the reveal doesn't wait) + a different answer 1.2 s later
//   twice      the kept answer, then TWO different answers in a row (1 s + 4 s after the reveal: a second change inside the first blend)
//   clock      the server's clock 5 min ahead, answered late (/api/time after 2 s)
// Per frame for 8 s (--secs) after the reveal: loadProbe().sky (clouds.js#probe — the plan, the shown mass of each set, the set's mean place, the
// cuts) + the LOAD LOG's sky rows. A SNAP = a cut (a set still on screen dropped), the shown mass falling > 25 % in one frame, or the
// set's place jumping > 4 pt in one frame. Exit 1 on any.
//   node tests/integration/sky-snap.mjs "<browser>" [--case late,stale,…|all] [--runs 1] [--cpu 1] [--json out.json]
// On the emulators + scripts/serve.mjs --emu.
import puppeteer from './kit/puppeteer.mjs';
import { writeFileSync } from 'node:fs';
import { SKY_REC, skyJudge } from './kit/load-probe.mjs';

const argv = process.argv.slice(2);
const BROWSER = argv[0];
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true); };
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const CPU = Number(opt('cpu', 1)) || 1, RUNS = Number(opt('runs', 1)) || 1, SECS = Number(opt('secs', 8)) || 8;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const MIN = 60_000;
const ans = (o) => ({ cloud: 0.3, code: 2, fog: 0, gust: 3, kind: 'cloudy', lat: 43, lon: -85.5, layers: { hi: 0.1, lo: 0.1, mid: 0.25 }, opaque: 0.3, rain: 0, rate: 0, snow: 0, snowDepth: 0, snowfall: 0, src: 'test', storm: 0, temp: 8, veil: 0, vis: 20000, wind: 2.5, windDir: 226, ...o });
const OVERCAST = { cloud: 1, kind: 'overcast', layers: { hi: 0.02, lo: 0.1, mid: 1 }, opaque: 0.9, code: 3 };
const RAIN = { cloud: 1, kind: 'rain', layers: { hi: 0.3, lo: 0.8, mid: 1 }, opaque: 1, rain: 0.6, rate: 1.4, code: 61 };
const FAIR = { cloud: 0.15, kind: 'clear', layers: { hi: 0.15, lo: 0.05, mid: 0.05 }, opaque: 0.1, code: 1 };
// (each case: the kept answer (age in min, or none), the answers /api/sky gives in turn (each after its delay), the clock's offset + delay)
const CASES = {
  late: { kept: null, sky: [{ ms: 3600, a: OVERCAST }] },
  'late-rain': { kept: null, sky: [{ ms: 3600, a: RAIN }] },
  stale: { kept: { age: 20, a: FAIR }, sky: [{ ms: 200, a: OVERCAST }] },
  'stale-rain': { kept: { age: 20, a: FAIR }, sky: [{ ms: 200, a: RAIN }] },
  nearstale: { kept: { age: 33, a: FAIR }, sky: [{ ms: 1200, a: OVERCAST }] },
  twice: { kept: { age: 33, a: FAIR }, sky: [{ ms: 2500, a: { cloud: 0.6, kind: 'cloudy', layers: { hi: 0.1, lo: 0.3, mid: 0.6 }, opaque: 0.6 } }, { ms: 0, a: OVERCAST, after: 4000 }] },
  clock: { kept: { age: 5, a: FAIR }, sky: [], time: { off: 5 * MIN, ms: 2000 } },
};
const pick = String(opt('case', 'all'));
const names = pick === 'all' ? Object.keys(CASES) : pick.split(',');



const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, args: ['--no-sandbox'] });
const out = [];
for (const name of names) for (let run = 0; run < RUNS; run++) {
  const C = CASES[name];
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 402, height: 874, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const kept = C.kept ? { ...ans(C.kept.a), at: Date.now() - C.kept.age * MIN, got: Date.now() - C.kept.age * MIN } : null;
  await page.evaluateOnNewDocument(k => { try { if (k) localStorage.setItem('nd:wx', k); else localStorage.removeItem('nd:wx'); } catch { /* fine */ } }, kept ? JSON.stringify(kept) : '');
  await page.evaluateOnNewDocument("try { localStorage.setItem('nd:entered', '1'); } catch {}");
  await page.evaluateOnNewDocument(SKY_REC(SECS * 1000));
  if (CPU > 1) { const cdp = await page.target().createCDPSession(); await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU }); }
  await page.setRequestInterception(true);
  const t0 = Date.now();
  let skyN = 0, shownWall = 0;
  page.on('request', async req => {
    const u = req.url();
    if (/\/api\/sky/.test(u)) {
      const step = C.sky[Math.min(skyN++, C.sky.length - 1)];
      if (!step) return req.respond({ status: 204, body: '' }).catch(() => {});
      // (`after`: this answer only once the reveal is that many ms old — the second change of 'twice'; asked by the city's own poll, or forced below)
      if (step.after) { while (!shownWall) await sleep(50); const w = shownWall + step.after - Date.now(); if (w > 0) await sleep(w); }
      else if (step.ms) await sleep(step.ms);
      return req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...ans(step.a), at: Date.now() - 2 * MIN }) }).catch(() => {});
    }
    if (C.time && /\/api\/time/.test(u)) { await sleep(C.time.ms); return req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ t: Date.now() + C.time.off }) }).catch(() => {}); }
    req.continue().catch(() => {});
  });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(`${BASE}/?emu&slot=sk${run}&city=2${opt('debug', false) ? '&debug=1' : ''}`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await page.waitForFunction('window.__sk && window.__sk.shownAt >= 0', { timeout: 60000, polling: 50 }).catch(() => {});
  shownWall = Date.now();
  // ('twice': the city asks again only every 15 min — the second answer is pulled by live-weather.js#askWeatherNow, a test hook)
  if (C.sky.some(s => s.after)) { await sleep(C.sky[0].ms + 600); await page.evaluate(() => import('/js/screens/harbor/live-weather.js').then(m => m.askWeatherNow())).catch(() => {}); }
  await sleep(SECS * 1000 + 600 - (Date.now() - shownWall));
  const R = await page.evaluate('window.__sk').catch(() => null);
  const L = await page.evaluate('(() => { const h = window.__district.harbor(); return h ? { lines: h.loadLog.lines, visible: h.loadLog.visible.map(r => r.kind + " " + r.msg) } : null; })()').catch(() => null);
  await ctx.close();
  // the judge
  const F = (R && R.frames) || [];
  const { snaps, plans, planAt, jumps } = skyJudge(F);
  const skyRows = L ? L.lines.filter(l => /\b(wx|sky|clouds)\b/.test(l)) : [];
  const vis = L ? L.visible.filter(v => /^(sky|clouds|pix)/.test(v)) : [];
  out.push({ name, run, plans, planAt, snaps, vis, skyRows, errs, frames: F });
  console.log(`${name.padEnd(10)} re-plans after the reveal ${plans}${planAt.length ? ` (at ${planAt.join(', ')} ms)` : ''}${jumps ? ` · clock jumps absorbed ${jumps}` : ''} · ${snaps.length ? `SNAP ×${snaps.length}: ${snaps.slice(0, 3).join(' · ')}` : 'no snap'} · LOAD LOG seen in the sky ${vis.length}${errs.length ? ` · errors ${errs[0]}` : ''}`);
  if (opt('log', false)) for (const l of skyRows) console.log('    ' + l);
}
await browser.close();
const J = opt('json', '');
if (J) writeFileSync(String(J), JSON.stringify(out, null, 1));
process.exit(out.some(o => o.snaps.length || o.vis.length) ? 1 : 0);
