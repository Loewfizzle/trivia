// SKINS 2B — THE TIER STEP, WATCHED (a dev probe, not a suite — docs/prism.md "THE TIERS"): the real view on AUTO under a throttled CPU, the
// heavy moment on a loop; every tier change is logged with its time + what the screen shows at that tier — the board's pixel ratio, the
// skin's EXTRAS (the sky's motion: is its animation running? · the scanlines: shown? · the page's `lite`) — so a pass can show the order:
// the extras go FIRST, the board's sharpness LAST.
//   E2E_BASE=http://localhost:5173 node tests/integration/prism-tier-probe.mjs "<browser>" [cpu throttle, default 10]      SKINS=pixel,galaxy  MS=9000
import puppeteer from './kit/puppeteer.mjs';
const BASE = process.env.E2E_BASE || 'http://localhost:5173', CPU = Number(process.argv[3] || 10), MS = Number(process.env.MS || 9000);
const SKINS = (process.env.SKINS || 'pixel,galaxy').split(',');
const browser = await puppeteer.launch({ executablePath: process.argv[2], headless: 'new', args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
try {
  for (const skin of SKINS) {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const cdp = await page.target().createCDPSession();
    await page.goto(`${BASE}/tests/integration/prism-preview.html?skin=${skin}&n=7&stack=6&bot=1&heavy=1&st=47&sb=34`, { waitUntil: 'load' });
    await page.waitForFunction(() => document.body.dataset.ready === '1' && !!window.__prism, { timeout: 20000 });
    await new Promise(r => setTimeout(r, 1200));
    const snap = () => page.evaluate(() => {
      const root = document.querySelector('.pd'), sky = root.querySelector('.pd-sky'), mover = sky && sky.firstElementChild;
      const cs = mover ? getComputedStyle(mover) : null, scan = getComputedStyle(root, '::after');
      return { tier: window.__prism.tier(), dpr: window.__prism.layout().dpr, lite: root.hasAttribute('data-lite'),
        sky: !mover ? 'none' : cs.animationName !== 'none' ? 'moving' : 'still', scan: scan.content !== 'none' && scan.display !== 'none' ? 'on' : 'off' };
    });
    const first = await snap();
    console.log(`${skin}: at rest (1× CPU) — tier ${first.tier} · board ${first.dpr}× · sky ${first.sky} · scanlines ${first.scan}`);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
    const t0 = Date.now();
    let last = first.tier;
    while (Date.now() - t0 < MS) {
      const s = await snap();
      if (s.tier !== last) { console.log(`${skin}: ${((Date.now() - t0) / 1000).toFixed(1)} s at ${CPU}× CPU — tier ${last} → ${s.tier} · board ${s.dpr}× · data-lite ${s.lite} · sky ${s.sky} · scanlines ${s.scan}`); last = s.tier; }
      await new Promise(r => setTimeout(r, 100));
    }
    await page.close();
  }
} finally { await browser.close(); }
