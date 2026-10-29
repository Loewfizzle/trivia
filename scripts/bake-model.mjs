// THE BAKE TOOL — any 3D model (art/models/<name>/, SOURCE files only, never shipped) rendered OFFLINE into the sprites the city
// draws in Canvas 2D. three.js lives only in the bake's page (from the jsDelivr CDN, pinned), never on the site. One harness, one
// RECIPE per model (scripts/bake/<recipe>.mjs: what to load, what to render, where it goes). docs/harbor/passes/bname.md#the-bake-tool.
//
//   node scripts/bake-model.mjs "<chromium>" <recipe> [--look DIR] [--model art/models/…/x.glb] [--out DIR]
//     ufo    → assets/city/ufo/   (the abduction's craft: "UFO" by sebslom; js/screens/harbor/ufo-model.js) — BNAME: generalised from
//              scripts/bake-ufo.mjs with its page + steps moved over VERBATIM; the re-bake is byte-for-byte the same (proved Oct 28)
//     crane  → assets/city/crane/ (the construction tower's crane; js/screens/harbor/crane-model.js)
//     harvest → assets/city/harvest/ (C4c: Thanksgiving's harvest display as a 3D model TEST — &prop=model; js/screens/harbor/harvest.js)
//   --look DIR: the recipe's look renders + the bake into DIR (assets untouched). --model: another model file (a recipe's look of a
//   candidate). --out DIR: the bake into DIR (assets untouched, no look renders).
//
// <chromium>: the Playwright Chromium already on the machine (…/ms-playwright/chromium-*/chrome-win64/chrome.exe) — any Chrome with
// WebGL. Software GL (SwiftShader) on purpose: the same pixels on every machine, so a re-bake of an unchanged recipe is identical.
//
// A RECIPE exports: MODEL (its .glb, from the repo root), OUT (its assets folder), page({ THREE }) → the bake page's HTML (it serves
// /model.glb; sets window.ready → a promise of the model's info), and run({ page, out, look, ROOT, THREE, MODEL, save, dataUrlToBuf }).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(ROOT, 'tests/integration/package.json'));
const puppeteer = require('puppeteer-core');

const argv = process.argv.slice(2);
const BROWSER = argv[0], NAME = argv[1];
const opt = k => (argv.includes(`--${k}`) ? argv[argv.indexOf(`--${k}`) + 1] : null);
const RECIPE = path.join(ROOT, 'scripts/bake', `${NAME}.mjs`);
if (!BROWSER || !fs.existsSync(BROWSER) || !NAME || !fs.existsSync(RECIPE)) {
  console.error('usage: node scripts/bake-model.mjs "<chromium.exe>" <recipe: ' + fs.readdirSync(path.join(ROOT, 'scripts/bake')).map(f => f.replace(/\.mjs$/, '')).join(' | ') + '> [--look DIR] [--model FILE] [--out DIR]');
  process.exit(1);
}
const recipe = await import(pathToFileURL(RECIPE).href);
const THREE = 'https://cdn.jsdelivr.net/npm/three@0.170.0';
const MODEL = path.resolve(ROOT, opt('model') || recipe.MODEL);
const LOOK = opt('look');
const out = LOOK || opt('out') || path.join(ROOT, recipe.OUT);

const server = http.createServer((req, res) => {
  if (req.url === '/model.glb') { res.writeHead(200, { 'content-type': 'model/gltf-binary' }); fs.createReadStream(MODEL).pipe(res); return; }
  if (req.url === '/' || req.url === '/bake.html') { res.writeHead(200, { 'content-type': 'text/html' }); res.end(recipe.page({ THREE })); return; }
  res.writeHead(404); res.end();
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
page.on('console', m => console.log('[page]', m.text()));
page.on('pageerror', e => console.log('[page error]', e.message));
await page.goto(`http://127.0.0.1:${port}/bake.html`);
const info = await page.evaluate(() => window.ready);
console.log('model:', JSON.stringify(info));

const dataUrlToBuf = u => Buffer.from(u.split(',')[1], 'base64');
fs.mkdirSync(out, { recursive: true });
const save = (name, buf) => { fs.writeFileSync(path.join(out, name), buf); return buf.length; };
await recipe.run({ page, out, look: !!LOOK, ROOT, THREE, MODEL: path.relative(ROOT, MODEL).split(path.sep).join('/'), info, save, dataUrlToBuf });

await browser.close();
server.close();
