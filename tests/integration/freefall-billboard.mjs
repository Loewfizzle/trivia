// FREEFALL F5A — THE BILLBOARD's READABILITY PROOF (A · THE LOGO — docs/freefall.md "THE BILLBOARD"; HIGH RISE's proof is the pattern:
// tests/integration/highrise-billboard.mjs), on the LOCAL server (NEVER THE LIVE SITE): the face is rendered IN THE CITY at 390 × 844 —
// LOCAL-ONLY: the roof board's JAYWALK OPEN NOW face is forced (&force=billboard-jaywalk&jaywalk=open) and, for the second shot, ITS
// PICTURE'S REQUEST is answered with assets/city/freefall/billboard.webp (request interception in this test — NOTHING is committed into
// the city). Both posters are drawn whole in the SAME poster box, so their lettering compares one to one ON SCREEN:
//   · each poster's letter heights MEASURED in its own picture (the rows of its lettering's light pixels — JAYWALK's pink JAYWALK + its
//     cyan-boxed NOW OPEN; FREEFALL's script lettering (its peach-pink faces: the word's whole body) + its white OPEN NOW) × the box's scale
//   · PASSES when FREEFALL's OPEN NOW ≥ JAYWALK's NOW OPEN and FREEFALL's word ≥ JAYWALK's word — the numbers go into the pass log
//   · the shots: the city at 390 × 844 with each poster up + a close crop of the board (3×)
//   node tests/integration/freefall-billboard.mjs "<chromium>" [outDir]
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const argv = process.argv.slice(2), OUT = argv.slice(1).find(a => !a.startsWith('--')) || null;
if (OUT) mkdirSync(OUT, { recursive: true });
const HI = readFileSync(new URL('../../assets/city/freefall/billboard.webp', import.meta.url));
const b = await puppeteer.launch({ executablePath: argv[0], headless: true, protocolTimeout: 300000, args: ['--enable-gpu', '--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist'] });
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

/** a poster's lettering rows, measured in its OWN picture (848 × 448): the vertical runs of rows holding many "letter" pixels in the
 *  central columns → [{ top, bottom, h }] (px of the picture) — `isLetter` = what a letter face looks like on that poster */
async function rowsOf(page, url, isLetterSrc, minRun = 8, minFrac = 0.04) {
  return page.evaluate(async (u, src, minRun, minFrac) => {
    const isLetter = new Function('r', 'g', 'b', `return (${src});`);
    const im = new Image(); im.src = u; await im.decode();
    const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const x = c.getContext('2d'); x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data, rows = [];
    for (let y = 0; y < c.height; y++) { let n = 0; for (let q = 0; q < c.width; q++) { const i = (y * c.width + q) * 4; if (isLetter(d[i], d[i + 1], d[i + 2])) n++; } rows.push(n / c.width >= minFrac); }
    const runs = []; let s = -1;
    for (let y = 0; y <= rows.length; y++) { if (y < rows.length && rows[y]) { if (s < 0) s = y; } else if (s >= 0) { if (y - s >= minRun) runs.push({ top: s, bottom: y - 1, h: y - s }); s = -1; } }
    return { w: c.width, h: c.height, runs };
  }, url, isLetterSrc, minRun, minFrac);
}

async function city(poster) {
  const ctx = await b.createBrowserContext(), p = await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push(String(e.message || e)));
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await p.evaluateOnNewDocument(() => { try { localStorage.setItem('nd:entered', '1'); localStorage.setItem('na:sh:profile', JSON.stringify({ name: 'AVA', color: 'magenta', avatar: 'bolt' })); } catch { /* fine */ } });
  if (poster === 'freefall') {
    await p.setRequestInterception(true);
    p.on('request', r => { if (/\/assets\/city\/jaywalk\/open-now\.webp/.test(r.url())) r.respond({ status: 200, contentType: 'image/webp', body: HI }); else r.continue(); });
  }
  await p.goto(guardUrl(`${BASE}/?emu&slot=sh&when=2026-11-18T21:30&wx=clear&force=billboard-jaywalk,no-hints&jaywalk=open`, 'freefall-billboard'), { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForFunction(() => window.__district && window.__district.phase().done, { timeout: 60000 });
  const end = Date.now() + 45000;
  let t = null;
  while (Date.now() < end) { t = await p.evaluate(() => { const q = window.__district.tri && window.__district.tri(); return q ? { rect: q.rect, open: q.open, board: q.board, shown: q.shown, turn: q.turn } : null; }); if (t && t.open && t.rect && /jaywalk/.test(String(t.board || t.shown || '')) && !t.turn) break; await sleep(300); }
  await sleep(1500);
  const shot = await p.screenshot({ type: 'png' });
  let crop = null;
  if (t && t.rect) { const R = t.rect, pad = 10; crop = await p.screenshot({ type: 'png', clip: { x: Math.max(0, R.x - pad), y: Math.max(0, R.y - pad), width: R.w + 2 * pad, height: R.h + 2 * pad } }); }
  await ctx.close();
  return { t, shot, crop, errs };
}

const jw = await city('jaywalk'), hi = await city('freefall');
ok(!!(jw.t && jw.t.rect && jw.t.open), `the roof board shows JAYWALK's live OPEN NOW poster (the face: ${jw.t ? `${jw.t.board || jw.t.shown}, the box ${JSON.stringify(jw.t.rect && { x: Math.round(jw.t.rect.x), y: Math.round(jw.t.rect.y), w: Math.round(jw.t.rect.w), h: Math.round(jw.t.rect.h) })}` : 'none'})`);
ok(!!(hi.t && hi.t.rect && hi.t.open), 'the same board with FREEFALL\'s poster swapped in (this test\'s request interception — nothing in the city)');
ok(jw.errs.length === 0 && hi.errs.length === 0, `no page error (${[...jw.errs, ...hi.errs].join(' | ')})`);
if (OUT) {
  writeFileSync(join(OUT, 'city-390x844-jaywalk-open.png'), jw.shot); writeFileSync(join(OUT, 'city-390x844-freefall-open.png'), hi.shot);
  if (jw.crop) writeFileSync(join(OUT, 'city-390x844-jaywalk-open-board.png'), jw.crop);
  if (hi.crop) writeFileSync(join(OUT, 'city-390x844-freefall-open-board.png'), hi.crop);
}
// ---- the letters: measured in each poster's own picture, scaled to the board's box ON SCREEN (both drawn whole in the same poster box)
const R = (hi.t && hi.t.rect) || (jw.t && jw.t.rect);
const pg = await b.newPage();
await pg.goto(`${BASE}/404.html`);
const toUrl = buf => `data:image/webp;base64,${buf.toString('base64')}`;
const JW = readFileSync(new URL('../../assets/city/jaywalk/open-now.webp', import.meta.url));
// JAYWALK's open poster: JAYWALK = the pink-white neon letters (bright, pink-ish) · NOW OPEN = its cyan-boxed white-cyan letters
const jwWord = await rowsOf(pg, toUrl(JW), 'r > 215 && g > 150 && b > 200 && r > g + 20', 10, 0.04);
const jwOpen = await rowsOf(pg, toUrl(JW), 'g > 200 && b > 200 && r < g - 25', 10, 0.04);
// FREEFALL's: the script lettering's peach-pink faces (the word's whole body, over the city) + OPEN NOW (white on the dark band)
const ffWord = await rowsOf(pg, toUrl(HI), 'r > 225 && g > 105 && b > 95 && r > b + 12 && g < 235', 10, 0.05);
const ffOpen = await rowsOf(pg, toUrl(HI), 'r > 238 && g > 232 && b > 238', 10, 0.05);
await pg.close();
const scale = R ? Math.min(R.w / 848, R.h / 448) : 0;   // (coverOf: the poster box fitted in R — the same for both)
const jwW = Math.max(0, ...jwWord.runs.filter(r => r.top < 260).map(r => r.h)), jwO = Math.max(0, ...jwOpen.runs.filter(r => r.top > 230).map(r => r.h));
const ffW = Math.max(0, ...ffWord.runs.filter(r => r.top < 336).map(r => r.h)), ffO = Math.max(0, ...ffOpen.runs.filter(r => r.top >= 336).map(r => r.h));
const pt = v => (v * scale).toFixed(1);
console.log(`
  the board's box on screen: ${R ? `${R.w.toFixed(1)} × ${R.h.toFixed(1)} pt` : '—'} (the poster at ${scale.toFixed(3)} pt a picture px)`);
console.log(`  JAYWALK (live): the word ${jwW} px → ${pt(jwW)} pt · NOW OPEN ${jwO} px → ${pt(jwO)} pt   (runs: ${JSON.stringify(jwWord.runs)} · ${JSON.stringify(jwOpen.runs)})`);
console.log(`  FREEFALL (A · THE LOGO): the lettering ${ffW} px → ${pt(ffW)} pt · OPEN NOW ${ffO} px → ${pt(ffO)} pt   (runs: ${JSON.stringify(ffWord.runs)} · ${JSON.stringify(ffOpen.runs)})`);
ok(jwW > 0 && jwO > 0 && ffW > 0 && ffO > 0, `the letters were found in both posters (JAYWALK ${jwW} / ${jwO} px · FREEFALL ${ffW} / ${ffO} px)`);
ok(ffO >= jwO, `READABLE: FREEFALL's OPEN NOW ${pt(ffO)} pt ≥ JAYWALK's NOW OPEN ${pt(jwO)} pt on screen (${(ffO / Math.max(1, jwO)).toFixed(2)} ×)`);
ok(ffW >= jwW, `READABLE: FREEFALL's lettering ${pt(ffW)} pt ≥ JAYWALK's word ${pt(jwW)} pt on screen (${(ffW / Math.max(1, jwW)).toFixed(2)} ×)`);
writeFileSync(join(OUT || '.', 'billboard-measure.json'), JSON.stringify({ box: R, scale, jaywalk: { word: jwW, open: jwO, wordPt: +pt(jwW), openPt: +pt(jwO) }, freefall: { word: ffW, open: ffO, wordPt: +pt(ffW), openPt: +pt(ffO) } }, null, 2));
await b.close();
console.log(`\n${checks - fails.length} / ${checks}${fails.length ? ` — FAILED: ${fails.join(' · ')}` : ''}`);
process.exit(fails.length ? 1 : 0);
