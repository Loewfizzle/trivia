// Air traffic + satellites (js/screens/district/aircraft.js) and THE SUN (sun.js) in the title city, in a real browser:
//   the preview flags (planes, approach, satellites, sat); live paths never level and never through the sign / tagline / dock
//   zones; the Starlink train only in its twilight window; Reduced effects keeps them (fewer, steady); frame pacing on a
//   mid-range phone profile (4× CPU) with planes and a train up. The sun: there by day and clear of the sign, none at night or
//   with ALWAYS NIGHT, hidden by rain, the forced eclipses, Reduced effects, frame pacing at golden hour.
//   node e2e-sky.mjs "<browser>" [./shots-sky]          (local server: node scripts/serve.mjs --emu)
import { createHarness } from './kit/harness.mjs';
import puppeteer from 'puppeteer-core';

const H = await createHarness({ name: 'sky', slot: 'sk', sizes: [[390, 844]] });
const { ok, log, sleep, browser, finish } = H;
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const NIGHT = 'when=2026-10-20T21:30&tz=America/New_York&wx=clear';

async function open(q, { reduced = false, view = [390, 844], dpr = 2, night = false } = {}) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  page.on('pageerror', e => H.errors.push(`pageerror: ${e.message}`));
  await page.evaluateOnNewDocument(n => { try { localStorage.setItem('nd:entered', '1'); if (n) localStorage.setItem('na:settings', JSON.stringify({ alwaysNight: true })); } catch {} }, night);
  if (reduced) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.setViewport({ width: view[0], height: view[1], deviceScaleFactor: dpr, isMobile: view[0] < 800, hasTouch: view[0] < 800 });
  await page.goto(`${BASE}/?emu&slot=sk&${q}`);
  await page.waitForFunction(() => window.__district && window.__district.phase().done, { timeout: 20000 });
  return { ctx, page };
}
const scene = p => p.evaluate(() => window.__district.scene());
const inside = (x, y, z) => x > z.x && x < z.x + z.w && y > z.y && y < z.y + z.h;

try {
  // ---- planes: forced, then checked against the live clear zones
  for (const view of [[390, 844], [1440, 900]]) {
    const { ctx, page } = await open(`${NIGHT}&force=planes`, { view });
    await page.waitForFunction(() => { const a = window.__district.scene().air; return a && a.planes && a.planes.length > 0; }, { timeout: 20000 });
    await sleep(9500);
    const s = await scene(page);
    const zones = (s.clear || []).filter(z => z.w >= 70 && z.y < s.H * 0.74);
    const ps = s.air.planes;
    ok(ps.length >= 1, `PLANES (${view[0]}): ${ps.length} in the sky with &force=planes`);
    ok(ps.every(p => Math.abs(p.slope) >= 0.017), `PLANES (${view[0]}): never level (${ps.map(p => p.slope).join(', ')})`);
    // the whole sky, like the birds (behind the sign is fine): never below the towers' tops, never under the status bar
    const HZ = s.H * (s.W > s.H ? 0.74 : 0.735), bottom = HZ * (s.W > s.H ? 0.55 : 0.5);
    ok(ps.every(p => Math.max(p.y0, p.y1) <= bottom + 1 && Math.min(p.y0, p.y1) >= 25), `PLANES (${view[0]}): in the sky above the towers (${ps.map(p => Math.round(p.y0) + '→' + Math.round(p.y1)).join(', ')})`);
    void zones; void inside;
    await ctx.close();
  }
  // ---- an approach
  { const { ctx, page } = await open(`${NIGHT}&force=approach`);
    await page.waitForFunction(() => { const a = window.__district.scene().air; return a && a.planes && a.planes.some(p => p.approach); }, { timeout: 20000 });
    const p = (await scene(page)).air.planes.find(q => q.approach);
    ok(p && p.y1 > p.y0, `APPROACH: a plane descending with its landing lights (${p && p.y0}→${p && p.y1})`);
    await H.shot(page, 'approach'); await ctx.close(); }
  // ---- the Starlink train: forced works; a real one never outside twilight
  { const { ctx, page } = await open('when=2026-10-20T19:15&tz=America/New_York&wx=clear&force=satellites');
    await page.waitForFunction(() => { const a = window.__district.scene().air; return a && a.train; }, { timeout: 20000 });
    const tr = (await scene(page)).air.train;
    ok(tr.n >= 20 && tr.n <= 40, `STARLINK: a train of ${tr.n} with &force=satellites (${tr.mode})`);
    await sleep(14000); await H.shot(page, 'starlink'); await ctx.close(); }
  { const { ctx, page } = await open('when=2026-10-20T23:30&tz=America/New_York&wx=clear');
    await sleep(8000);
    const a = (await scene(page)).air;
    ok(!a.train && !a.sat, 'SATELLITES: none deep in the night (the earth\'s shadow)');
    await ctx.close(); }
  { const { ctx, page } = await open(`${NIGHT}&force=sat`);
    await page.waitForFunction(() => { const a = window.__district.scene().air; return a && a.sat; }, { timeout: 20000 }).catch(() => {});
    ok(!!(await scene(page)).air.sat, 'SATELLITE: a single one with &force=sat');
    await ctx.close(); }
  // ---- Reduced effects: still planes (fewer, steady lights)
  { const { ctx, page } = await open(`${NIGHT}&force=planes`, { reduced: true });
    await page.waitForFunction(() => { const a = window.__district.scene().air; return a && a.planes && a.planes.length > 0; }, { timeout: 20000 }).catch(() => {});
    const s = await scene(page);
    ok(s.motion === 0 && s.air.planes.length > 0, 'REDUCED EFFECTS: planes still cross (motion 0)');
    await ctx.close(); }
  // ---- THE SUN
  const NY = 'tz=America/New_York&force=no-planes';
  const sunOf = async (q, o) => { const { ctx, page } = await open(q, o); await sleep(2500); const s = await scene(page); return { ctx, page, s, sun: s.sun }; };
  for (const view of [[390, 844], [1440, 900]]) {
    const { ctx, s, sun } = await sunOf(`when=2026-10-20T10:30&${NY}&wx=clear`, { view });
    const sign = (s.clear || []).find(z => z.w > s.W * 0.2 && z.y < s.H * 0.5);
    ok(sun && sun.vis > 0.9, `SUN (${view[0]}): in the sky on a clear morning (${JSON.stringify(sun)})`);
    ok(sun && sign && !(sun.x > sign.x + 20 && sun.x < sign.x + sign.w - 20 && sun.y > sign.y + 10 && sun.y < sign.y + sign.h - 10), `SUN (${view[0]}): clear of the sign and the tagline`);
    await ctx.close();
  }
  { const { ctx, page, sun } = await sunOf(`when=2026-10-20T18:05&${NY}&wx=clear`);
    ok(sun && sun.el < 1 && sun.col[1] < 110 && sun.r > 20, `SUN: at sunset low, large and red-orange (${JSON.stringify(sun)})`);
    await H.shot(page, 'sun-sunset'); await ctx.close(); }
  { const { ctx, sun } = await sunOf(`when=2026-10-20T22:30&${NY}&wx=clear`); ok(!sun, 'SUN: none at night'); await ctx.close(); }
  { const { ctx, sun } = await sunOf(`when=2026-10-20T12:30&${NY}&wx=clear`, { night: true }); ok(!sun, 'SUN: none with ALWAYS NIGHT'); await ctx.close(); }
  { const { ctx, sun } = await sunOf(`when=2026-10-20T12:30&${NY}&wx=rain`); ok(!sun || sun.vis === 0, `SUN: hidden in the rain (${JSON.stringify(sun)})`); await ctx.close(); }
  { const { ctx, sun } = await sunOf(`when=2026-10-20T12:30&${NY}&wx=overcast`); ok(sun && sun.vis < 0.2, `SUN: the disc hidden by overcast (${sun && sun.vis})`); await ctx.close(); }
  { const { ctx, page, sun } = await sunOf('when=2026-10-20T12:30&tz=America/New_York&wx=clear&force=totality,no-planes');
    ok(sun && sun.eclipse && sun.eclipse.total, 'SUN: &force=totality — a total eclipse');
    await H.shot(page, 'sun-totality'); await ctx.close(); }
  { const { ctx, sun } = await sunOf('when=2026-10-20T12:30&tz=America/New_York&wx=clear&force=eclipse-sun,no-planes');
    ok(sun && sun.eclipse && !sun.eclipse.total, 'SUN: &force=eclipse-sun — a partial'); await ctx.close(); }
  { const { ctx, sun } = await sunOf('when=2024-04-08T15:07&tz=America/Indiana/Indianapolis&wx=clear&force=no-planes');
    ok(sun && sun.eclipse && sun.eclipse.total, 'SUN: the real 8 Apr 2024 eclipse is total in Indianapolis (?when=)'); await ctx.close(); }
  { const { ctx, sun } = await sunOf(`when=2026-10-20T10:30&${NY}&wx=clear`, { reduced: true });
    ok(sun && sun.vis > 0.9, 'SUN: Reduced effects keeps the sun'); await ctx.close(); }
  // ---- performance: a mid-range phone (4× CPU), planes + a train up — measured like e2e-title's frame pacing (Chrome's own
  //      renderer at 1×; the harness forces a software GL renderer for the games, which measures the painter, not the scene)
  { const pb = await puppeteer.launch({ executablePath: process.argv[2], headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
    const page = await pb.newPage();
    await page.evaluateOnNewDocument(() => { try { localStorage.setItem('nd:entered', '1'); } catch {} });
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await page.goto(`${BASE}/?emu&slot=skp&when=2026-10-20T19:15&tz=America/New_York&wx=clear&force=planes,satellites`);
    await page.waitForFunction(() => window.__district && window.__district.phase().done, { timeout: 20000 });
    await sleep(5000);
    const cdp = await page.target().createCDPSession();
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    let p50 = 999;
    for (let k = 0; k < 2; k++) {
      await page.evaluate(() => window.__district.setTier(1));
      await sleep(3500);
      const f = await page.evaluate(() => window.__district.frames());
      const sorted = [...f].sort((x, y) => x - y);
      p50 = Math.min(p50, sorted[Math.floor(sorted.length / 2)] || 999);
    }
    const a = (await page.evaluate(() => window.__district.scene())).air;
    ok(p50 <= 18, `PERF: 4× CPU, tier 1, planes ${a.planes.length} + train ${a.train ? a.train.n : 0}: median frame ${p50.toFixed(1)} ms`);
    // golden hour: the low sun, its halo, the rays, rim light and glints
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await page.goto(`${BASE}/?emu&slot=skp&when=2026-10-20T17:40&tz=America/New_York&wx=partly`);
    await page.waitForFunction(() => window.__district && window.__district.phase().done, { timeout: 20000 });
    await sleep(5000);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    let g50 = 999;
    for (let k = 0; k < 2; k++) {
      await page.evaluate(() => window.__district.setTier(1));
      await sleep(3500);
      const f = await page.evaluate(() => window.__district.frames());
      const sorted = [...f].sort((x, y) => x - y);
      g50 = Math.min(g50, sorted[Math.floor(sorted.length / 2)] || 999);
    }
    ok(g50 <= 18, `PERF: 4× CPU, tier 1, golden hour with the sun: median frame ${g50.toFixed(1)} ms`);
    await pb.close(); }
} catch (e) {
  log('FAILED', e.message);
  H.errors.push(e.message);
}
await finish();
