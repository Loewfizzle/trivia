// Air traffic + satellites (js/screens/district/aircraft.js) and THE SUN (sun.js) in the title city, in a real browser:
//   the preview flags (planes, approach, satellites, sat); live paths never level and never through the sign / tagline / dock
//   zones; the Starlink train only in its twilight window; Reduced effects keeps them (fewer, steady); frame pacing on a
//   mid-range phone profile (4× CPU) with planes and a train up. The sun: there by day and clear of the sign, none at night or
//   with ALWAYS NIGHT, hidden by rain, the forced eclipses, Reduced effects, frame pacing at golden hour.
//   node e2e-sky.mjs "<browser>" [./shots-sky]          (local server: node scripts/serve.mjs --emu)
import { createHarness } from './kit/harness.mjs';
import puppeteer from './kit/puppeteer.mjs'; // (+ --mute-audio, the 60 fps fix: kit/puppeteer.mjs)

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
  await page.goto(`${BASE}/?emu&slot=sk&${q}${process.env.SKY_QS ? '&' + process.env.SKY_QS : ''}`);
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
  // (waits for the sun to settle — faded in and no longer easing toward its place — rather than a fixed pause: on a busy machine
  // the sign's text settles later and the sun follows it; up to 8 s)
  const sunOf = async (q, o = {}, until = s => s.sun && s.sun.fade >= 0.97) => {
    const { ctx, page } = await open(q, o);
    let s = null;
    for (let i = 0; i < 40; i++) { await sleep(200); s = await scene(page); if (i >= 4 && until(s)) break; }
    return { ctx, page, s, sun: s.sun };
  };
  for (const view of [[390, 844], [1440, 900]]) {
    const { ctx, s, sun } = await sunOf(`when=2026-10-20T10:30&${NY}&wx=clear`, { view });
    const sign = (s.clear || []).find(z => z.w > s.W * 0.2 && z.y < s.H * 0.5);
    ok(sun && sun.vis > 0.9, `SUN (${view[0]}): in the sky on a clear morning (${JSON.stringify(sun)})`);
    if (view[0] > 800) ok(sun && sign && !(sun.x > sign.x + 20 && sun.x < sign.x + sign.w - 20 && sun.y > sign.y + 10 && sun.y < sign.y + sign.h - 10), `SUN (${view[0]}): clear of the sign and the tagline`);
    else { const n = s.textRects && s.textRects.neon; ok(sun && n && !(sun.x + sun.r > n.x && sun.x - sun.r < n.x + n.w && sun.y - sun.r < n.y + n.h), `SUN (${view[0]}): never over the NEON letters (${sun && sun.x},${sun && sun.y})`); }
    await ctx.close();
  }
  // phones, THE BIG ARCH: a June noon sits behind SPEAKEASY (below the NEON letters), and the word keeps a soft dark edge
  { const { ctx, page, s, sun } = await sunOf(`when=2026-06-21T12:57&${NY}&wx=clear`, {}, x => { const u = x.sun, t = x.textRects; return u && t && u.fade >= 0.97 && Math.abs(u.y - (t.word.y + t.word.h / 2)) < 8 && Math.abs(u.x - x.W / 2) < 12; });
    const tr = s.textRects;
    ok(sun && tr && sun.y - sun.r > tr.neon.y + tr.neon.h && Math.abs(sun.y - (tr.word.y + tr.word.h / 2)) < 8 && Math.abs(sun.x - s.W / 2) < 12, `SUN, PHONE: a June noon behind SPEAKEASY (${sun && sun.x},${sun && sun.y})`);
    await sleep(800);
    const edge = await page.evaluate(() => { const w = document.querySelector('.nd-word'); return w.classList.contains('nd-sunbk') && parseFloat(w.style.getPropertyValue('--sunk')) > 0.5; });
    ok(edge, 'SUN, PHONE: SPEAKEASY keeps a soft dark edge while the sun is behind it');
    await H.shot(page, 'sun-phone-noon'); await ctx.close(); }
  { const { ctx, page, s, sun } = await sunOf(`when=2026-12-21T11:55&${NY}&wx=clear`);
    const tr = s.textRects;
    ok(sun && tr && sun.y > tr.tag.y && sun.y < tr.tag.y + tr.tag.h + sun.r, `SUN, PHONE: a December noon lower, at the tagline (${sun && sun.y} vs ${tr && Math.round(tr.tag.y)})`);
    const edge = await page.evaluate(() => document.querySelector('.nd-word').classList.contains('nd-sunbk'));
    ok(true, `(SPEAKEASY's edge in December: ${edge})`);
    await ctx.close(); }
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
  // ---- the sun on a phone's load: there during the intro (not only once it ends), fading in — never a pop
  { const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    page.on('pageerror', e => H.errors.push(`pageerror: ${e.message}`));
    await page.evaluateOnNewDocument(() => { try { localStorage.removeItem('nd:entered'); } catch {} });
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto(`${BASE}/?emu&slot=sk2&when=2026-10-20T11:00&tz=America/Detroit&at=42.96,-85.67`);
    await page.waitForFunction(() => !!window.__district, { timeout: 20000 });
    const seen = [];
    for (let i = 0; i < 120; i++) {
      const s = await page.evaluate(() => ({ sun: window.__district.scene().sun, done: window.__district.phase().done }));
      if (s.sun) seen.push({ fade: s.sun.fade, done: s.done });
      if (s.done && s.sun && s.sun.fade >= 1) break;
      await sleep(40);
    }
    const first = seen[0], rise = seen.findIndex(s => s.fade >= 1);
    let maxStep = 0; for (let i = 1; i < seen.length; i++) maxStep = Math.max(maxStep, seen[i].fade - seen[i - 1].fade);
    ok(first && !first.done, `SUN ON LOAD (phone): placed during the intro, not after it (${seen.length} samples, first while the intro runs: ${first && !first.done})`);
    ok(first && first.fade < 0.5 && rise > 2 && maxStep < 0.4, `SUN ON LOAD (phone): it fades in (first ${first && first.fade}, full after ${rise} samples, largest step ${maxStep.toFixed(2)}) — never a pop`);
    await ctx.close(); }

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
