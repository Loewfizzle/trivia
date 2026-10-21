// The title city's frame cost, per scene and tier, at a slowed CPU (no Firebase: the real title in title-preview.html).
//   node title-perf.mjs "<browser>" [--city 2] [--scenes party,night,day] [--cpu 4] [--size 390x844] [--secs 6] [--gpu]
// Prints, per scene: the scene's own draw cost (window.__district.cost(): ms spent drawing, not tick-quantised) and the frame
// intervals (frames()), median / p95 / mean, at each tier 2 → 1 → 0, plus the tier the auto-tiering settles on.
// The City 2.0 baseline (docs/harbor.md#performance) was measured with this. Needs scripts/serve.mjs on :5173.
import puppeteer from 'puppeteer-core';

const BROWSER = process.argv[2];
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const CITY = arg('city', '1');
const CPU = Number(arg('cpu', 4));
const SECS = Number(arg('secs', 6));
const [VW, VH] = arg('size', '390x844').split('x').map(Number);
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
// Grand Rapids by default (the owner's city); party = a Saturday at the peak (10 pm–midnight)
const AT = '&tz=America/Detroit&at=42.96,-85.67';
const SCENES = {
  party: 'when=2026-10-17T23:00&wx=clear',
  night: 'when=2026-10-14T21:30&wx=clear',
  day: 'when=2026-10-14T14:00&wx=clear',
  golden: 'when=2026-10-14T18:30&wx=clear',
  rain: 'when=2026-10-14T21:30&wx=rain',
  snow: 'when=2026-12-15T21:30&wx=snow',
};
const names = arg('scenes', 'party,night,day').split(',');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const stats = a => { const s = [...a].sort((x, y) => x - y); if (!s.length) return { p50: 0, p95: 0, mean: 0 }; return { p50: +s[Math.floor(s.length / 2)].toFixed(2), p95: +s[Math.floor(s.length * 0.95)].toFixed(2), mean: +(s.reduce((x, y) => x + y, 0) / s.length).toFixed(2) }; };

const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, args: ['--mute-audio', ...(process.argv.includes('--gpu') ? ['--enable-gpu', '--use-angle=d3d11'] : [])] });
const out = [];
for (const name of names) {
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  const mobile = VW < 800;
  await page.setViewport({ width: VW, height: VH, deviceScaleFactor: mobile ? 3 : 1, isMobile: mobile, hasTouch: mobile });
  await page.goto(`${BASE}/tests/integration/title-preview.html?${SCENES[name] || name}${AT}${CITY !== '1' ? `&city=${CITY}` : ''}`);
  const end = Date.now() + 20000;
  while (Date.now() < end && !(await page.evaluate('!!(window.__district && window.__district.phase().done)').catch(() => false))) await sleep(150);
  await sleep(2500);   // the extras (weather, the street) load ~1.2 s after the first paint
  const cdp = await page.target().createCDPSession();
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  const row = { scene: name, city: CITY, cpu: CPU, size: `${VW}x${VH}`, tiers: [] };
  for (const t of [2, 1, 0]) {
    await page.evaluate(`window.__district.setTier(${t})`);
    await sleep(2500);                                  // the tier's rebuild settles
    await page.evaluate('0');
    await sleep(SECS * 1000);
    const cost = await page.evaluate('window.__district.cost()');
    const frames = await page.evaluate('window.__district.frames()');
    const now = (await page.evaluate('window.__district.scene()')).tier;
    row.tiers.push({ tier: t, settled: now, cost: stats(cost), frame: stats(frames) });
  }
  row.errors = errs;
  out.push(row);
  console.log(`${name.padEnd(7)} city ${CITY} ${CPU}x CPU ${VW}x${VH}: ` + row.tiers.map(r => `t${r.tier}${r.settled !== r.tier ? `→${r.settled}` : ''} cost ${r.cost.mean}/${r.cost.p50}/${r.cost.p95} frame ${r.frame.p50}/${r.frame.p95}`).join(' | ') + (errs.length ? `  ERRORS ${errs.join('; ')}` : ''));
  await cdp.detach();
  await page.close();
}
console.log('(cost = mean/p50/p95 ms of drawing per frame; frame = p50/p95 ms between frames)');
if (process.argv.includes('--json')) console.log(JSON.stringify(out, null, 1));
await browser.close();
