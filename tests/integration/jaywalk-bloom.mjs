// JAYWALK J1 — THE NIGHT GLOW FIX's test (js/games/jaywalk/night-fx.js#createBloom — docs/jaywalk.md "THE NIGHT GLOW FIX"): a light quad
// BEHIND a box truck (K.trucks' own geometry on the solid layer) adds NOTHING to the bloom's lights target where the truck covers it; the
// same light without the occluder does (the bug: the trailer looked see-through at night); a light BESIDE it and one ON its near face
// (the amber marker's place, z + 0.4) are lit the same either way. A LOCAL page only (tests/integration/jaywalk-bloom.html).
//   node tests/integration/jaywalk-bloom.mjs "<chromium>"
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const b = await puppeteer.launch({ executablePath: process.argv[2], headless: true, args: ['--enable-gpu', '--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist'] });
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };
try {
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 390 });
  const url = guardUrl(`${BASE}/tests/integration/jaywalk-bloom.html`);
  await p.goto(url, { waitUntil: 'load' });
  await p.waitForFunction('window.__bloomReady === true', { timeout: 30000 });
  const on = await p.evaluate(() => window.__bloomTest(true)), off = await p.evaluate(() => window.__bloomTest(false));
  console.log('occluders ON ', JSON.stringify(on));
  console.log('occluders OFF', JSON.stringify(off));
  ok(off.behind > 2000, `without the occluder the light behind the truck glows on the target (${off.behind}) — the bug, reproduced`);
  ok(on.behind === 0, `with the occluder it adds nothing where the truck covers it (${on.behind})`);
  ok(on.beside > 2000 && on.beside === off.beside, `a light BESIDE the truck glows the same either way (${on.beside} / ${off.beside})`);
  ok(on.near > 2000 && on.near >= off.near * 0.9, `the near-face marker (z + 0.4) stays lit (${on.near} / ${off.near})`);
} catch (e) { ok(false, `the run: ${e && e.message}`); }
await b.close();
console.log(`\n${checks - fails.length}/${checks} passed${fails.length ? `\nFAILED:\n  ${fails.join('\n  ')}` : ''}`);
process.exit(fails.length ? 1 : 0);
