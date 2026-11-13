// FR7 FIXES C2 — NO TWO CAMERAS in CHROMIUM, any path(s) on their own (wk-double.mjs's twin; the harbor `cameras` group runs the set it lists):
// the cloud's red — "HOURS hidden — the clock +10 h … ✗ 0.25 s after the return: 86×48 item: its copy 23,-48 pt away" — reproduced at the
// time it landed (Grand Rapids' sunset) with `hours-dusk@HH:MM` (kit/two-cameras.mjs). 402 × 659 @3, the same driver as the harbor group.
//   node tests/integration/cr-double.mjs "<chromium>" --paths hours-dusk@17:10,hours-dusk@17:20 [--repeat N] [--shots DIR]
// On the emulators + scripts/serve.mjs --emu. Exit 1 when any run showed two cameras.
import puppeteer from './kit/puppeteer.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { guardUrl } from './kit/live-guard.mjs';
import { PIXELS, runPath } from './kit/two-cameras.mjs';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const PATHS = String(opt('paths', 'hours-dusk')).split(','), N = Number(opt('repeat', 1)), SHOTS = opt('shots', '');
const br = await puppeteer.launch({ executablePath: argv[0], headless: 'new' });
const helper = await (await br.createBrowserContext()).newPage();
await helper.goto('about:blank');
const D = {
  async open({ vh, inits, routes }) {
    const ctx = await br.createBrowserContext(), p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    const VP = h => p.setViewport({ width: 402, height: h, deviceScaleFactor: 3, isMobile: true, hasTouch: true }).catch(() => {});
    await VP(vh);
    if (Number(opt('cpu', 0)) > 1) { const cdp = await p.createCDPSession(); await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(opt('cpu', 0)) }); }   // (--cpu N: the cloud's slower runner)
    for (const [fn, arg] of inits) await p.evaluateOnNewDocument(fn, arg);
    if (routes.length) {
      await p.setRequestInterception(true);
      p.on('request', async r => { const hit = routes.find(([re]) => re.test(r.url())); if (!hit) { r.continue().catch(() => {}); return; } const a = await hit[1](); r.respond({ status: a.status, contentType: 'application/json', headers: { 'cache-control': 'no-store' }, body: a.body }).catch(() => {}); });
    }
    return {
      errors: errs,
      ev: js => p.evaluate(js).catch(() => null),
      goto: url => p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }),
      vp: VP,
      shot: async () => { try { return { png: Buffer.from(await p.screenshot({ type: 'png' })), k: 3 }; } catch { return null; } },
      back: () => p.goBack({ waitUntil: 'domcontentloaded' }),
      close: () => ctx.close(),
    };
  },
  pixels: (a, b, boxes, k) => helper.evaluate(PIXELS, [a.toString('base64'), b.toString('base64'), boxes, k]),
};
const results = [];
for (let i = 0; i < N; i++) for (const name of PATHS) {
  const r = await runPath(D, name, { base: BASE, slot: `cd${i}`, fast: true, diag: opt('diag', '') || null, guard: u => guardUrl(u, 'cr-double.mjs') });
  console.log(`${r.bad ? 'FAIL' : 'OK  '} ${r.line}`);
  if (argv.includes('--diag-all')) for (const p of r.pics) console.log(`   · ${p.label}: ${p.px.map(q => `${q.box[2]}×${q.box[3]}@${q.box[0]},${q.box[1]} best ${q.dx},${q.dy} s ${q.s}/${q.s00}`).join(' | ')} · ${p.diag || ''}`);   // (every look's match + the --diag answer, red or not)
  if (argv.includes('--diag-all') && r.bad) console.log(`   · the marks: ${(r.marks || []).map(m => `${Math.round(m.t)} ${m.label}`).join(' · ')} · the bad frames from ${r.frames.at.join(', ')} ms`);
  if (SHOTS && (r.bad || argv.includes("--shots-all"))) { mkdirSync(SHOTS, { recursive: true }); r.pics.forEach((p, j) => { const f = `${SHOTS}/${name.replace(/[@:]/g, '-')}-${i}-${j}`; writeFileSync(`${f}.png`, p.png); if (p.bare) writeFileSync(`${f}-bare.png`, p.bare); writeFileSync(`${f}.json`, JSON.stringify({ label: p.label, px: p.px, diag: p.diag })); }); }
  delete r.pics; results.push(r);
}
await br.close();
const bad = results.filter(r => r.bad);
console.log(`\ncr-double: ${results.length} runs · ${bad.length} with two cameras${bad.length ? ` (${bad.map(r => r.name).join(', ')})` : ''}`);
process.exit(bad.length ? 1 : 0);
