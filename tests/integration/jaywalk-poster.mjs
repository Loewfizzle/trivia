// JAYWALK H4 — THE POSTER: the lab's ?poster=1 renders the hero frame at the board's size; this saves its two PNGs (2× + 1×).
//   node tests/integration/jaywalk-poster.mjs "<chromium>" <outDir>
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.E2E_BASE || 'http://localhost:5173', OUT = process.argv[3];
mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: process.argv[2], headless: true, args: ['--enable-gpu', '--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist'] });
const p = await b.newPage(), errs = [], reqs = [];
p.on('pageerror', e => errs.push(String(e.message || e)));
p.on('request', r => reqs.push(r.url()));
await p.setViewport({ width: 900, height: 700, deviceScaleFactor: 2 });
await p.goto(guardUrl(`${BASE}/jaywalk-lab?emu&poster=1`, 'jaywalk-poster'), { waitUntil: 'load' });
const end = Date.now() + 30000;
while (Date.now() < end && !(await p.evaluate(() => !!window.__jwPoster))) await new Promise(r => setTimeout(r, 200));
const r = await p.evaluate(() => window.__jwPoster ? { a: window.__jwPoster.c2.toDataURL('image/png'), b: window.__jwPoster.c1.toDataURL('image/png'), w2: window.__jwPoster.c2.width, h2: window.__jwPoster.c2.height, w1: window.__jwPoster.c1.width, h1: window.__jwPoster.c1.height, stage: window.__jwPoster.stage } : null);
let bad = 0;
const ok = (c, what) => { console.log(c ? 'OK  ' : 'FAIL', what); if (!c) bad++; };
ok(!!r && r.w2 === 1696 && r.h2 === 896 && r.w1 === 848 && r.h1 === 448, `THE POSTER: 2× ${r && r.w2} × ${r && r.h2} + 1× ${r && r.w1} × ${r && r.h1} (the board's size) — staged on ${r ? JSON.stringify(r.stage) : '?'}`);
ok(!reqs.some(u => /firebase|googleapis\.com\/identitytoolkit|\/api\//.test(u)), 'ZERO server calls (the lab\'s rule)');
ok(!errs.length, `no page error (${errs.slice(0, 2).join(' | ') || 'none'})`);
if (r) { writeFileSync(join(OUT, 'jaywalk-poster-1696x896.png'), Buffer.from(r.a.split(',')[1], 'base64')); writeFileSync(join(OUT, 'jaywalk-poster-848x448.png'), Buffer.from(r.b.split(',')[1], 'base64')); await p.screenshot({ path: join(OUT, 'poster-page.png') }); }
await b.close();
process.exit(bad ? 1 : 0);
