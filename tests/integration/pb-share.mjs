// THE PERSONAL-BEST SHARE CARD (THE GARDEN PARTY PASS — the owner, Nov 21 11:16 pm; docs/jaywalk.md + docs/highrise.md "THE PERSONAL-BEST CARD"):
// a run that is a NEW PERSONAL BEST (the server's — the moment its end card shows NEW BEST) shows its big number in THE HOUSE GOLD (NEW DAILY
// BEST's foil, with its glow) + a clear PERSONAL BEST line under it; a normal run's card unchanged. Drawn IN THE PAGE with the cartridges' own
// functions (on the LOCAL server — never the live site), each card NORMAL vs PB:
//   JAYWALK's run card (night — its only look) · HIGH RISE's poster (always night) · JAYWALK's daily card (night + day — gold on a new daily best)
//   · HIGH RISE's daily poster
// Checks: the number's lit pixels are GOLD on a PB (red > blue by far) and NOT on a normal card; PERSONAL BEST's band is lit on a PB and dark /
// unchanged on a normal one; the PB words are at least the stat line's size (readable at 360 + 390 wide: their cap height ≥ 7 px there).
//   node tests/integration/pb-share.mjs "<chromium>" [outDir]      (scripts/serve.mjs on :5173) — outDir gets the PNGs at 390 wide
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const argv = process.argv.slice(2), OUT = argv[1] || null;
if (OUT) mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: argv[0], headless: true, protocolTimeout: 300000 });
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };
const p = await b.newPage(), errs = [];
p.on('pageerror', e => errs.push(String(e.message || e)));
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
await p.goto(guardUrl(`${BASE}/highrise-play?look=night`, 'pb-share'), { waitUntil: 'load' });

const res = await p.evaluate(async () => {
  const J = await import('/js/games/jaywalk/share.js'), H = await import('/js/games/highrise/share.js'), D = await import('/js/daily/share.js');
  const JD = await import('/js/games/jaywalk/daily-share.js'), HD = await import('/js/games/highrise/daily-share.js');
  await D.shareFonts();
  /** the lit pixels' mean colour in a box (only the bright ones — the lettering's core) */
  const lit = (cv, x, y, w, h, min = 420, max = 766) => { const d = cv.getContext('2d').getImageData(x, y, w, h).data; let r = 0, g = 0, bl = 0, n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] >= min && d[i] + d[i + 1] + d[i + 2] < max) { r += d[i]; g += d[i + 1]; bl += d[i + 2]; n++; } return n ? { r: r / n, g: g / n, b: bl / n, n } : { r: 0, g: 0, b: 0, n: 0 }; };
  const png = (cv, w = 390) => { const s = document.createElement('canvas'); s.width = w; s.height = Math.round(w * cv.height / cv.width); const x = s.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(cv, 0, 0, s.width, s.height); return s.toDataURL('image/png'); };
  const out = {};
  // JAYWALK's run card (no frame on this page: the night's dark middle) — the big lanes at the frame's foot, PERSONAL BEST under them
  const game = { matchId: 'pbm', mode: 'solo', results: { u1: { l: 143, w: 'car' } } };
  for (const pb of [false, true]) {
    const cv = J.drawJwCard(game, { uid: 'u1', name: 'LOEWFIZZLE12', code: '', pb }), B = J.JW_CARD.box;
    const by = B.y + B.h - 42 - (pb ? J.PB_UP : 0);
    out[`jaywalk-run-${pb ? 'pb' : 'normal'}`] = { num: lit(cv, B.x + 32, by - Math.round(J.BIG_PX * 0.7), 380, Math.round(J.BIG_PX * 0.66)), words: lit(cv, B.x + 36, B.y + B.h - 38 - J.PB_PX, 560, J.PB_PX, 330), wordsPx: J.PB_PX, statPx: 52, png: png(cv) };
  }
  // HIGH RISE's poster (night) — the floor, PERSONAL BEST on the band's line (the band a line under)
  for (const pb of [false, true]) {
    const run = { floor: 93, perfects: 31, cause: 'missed', made: false, mode: 'solo', name: 'LOEWFIZZLE12', pb }, hero = await H.loadHero(H.hiRunCard(run).hero), cv = H.drawHiCard(run, hero), L = H.POSTER_L, R = cv.hiRow;
    out[`highrise-run-${pb ? 'pb' : 'normal'}`] = { num: lit(cv, Math.round(R.bx), L.bigY - 170, Math.round(R.ux - L.unitGap - R.bx), 140, 600), words: lit(cv, 200, L.bandY - Math.round(L.bandPx * 0.7), 680, Math.round(L.bandPx * 0.66), 330), wordsPx: L.bandPx, statPx: L.statPx, png: png(cv) };
  }
  // JAYWALK's daily card, night + day — gold on a NEW DAILY BEST (its stat line keeps "BEST OF 3 · NEW DAILY BEST")
  for (const look of ['night', 'day']) for (const nb of [false, true]) {
    const cv = JD.renderShare({ inputs: { t: [88, 143, 120], b: 1, nb, day: 'd20261121' }, look });
    out[`jaywalk-daily-${look}-${nb ? 'pb' : 'normal'}`] = { num: look === 'day' ? lit(cv, 200, 300, 680, 260, 0, 420) : lit(cv, 200, 300, 680, 260), png: png(cv), look }   // (by day the lettering is the DARK ink on the light sky);
  }
  // HIGH RISE's daily poster (night) on a NEW DAILY BEST
  for (const nb of [false, true]) {
    const cv = await HD.renderShare({ inputs: { f: 93, p: 31, w: [], x: [], pf: [], nb, day: 'd20261121', c: 'missed' } });
    out[`highrise-daily-${nb ? 'pb' : 'normal'}`] = { png: png(cv) };
  }
  return out;
});
const gold = c => c.n > 40 && c.r > 200 && c.b < c.r - 60 && c.g > c.b + 20;
const whiteish = c => c.n > 40 && !(c.b < c.r - 60);
ok(gold(res['jaywalk-run-pb'].num) && whiteish(res['jaywalk-run-normal'].num), `JAYWALK's run card: the lanes GOLD on a PB (${JSON.stringify(res['jaywalk-run-pb'].num)}) — white-hot on a normal run (${JSON.stringify(res['jaywalk-run-normal'].num)})`);
ok(res['jaywalk-run-pb'].words.n > 400 && gold(res['jaywalk-run-pb'].words) && !gold(res['jaywalk-run-normal'].words), `JAYWALK's run card: PERSONAL BEST lit + gold under the number on a PB (${JSON.stringify(res['jaywalk-run-pb'].words)}), no gold there on a normal one (${JSON.stringify(res['jaywalk-run-normal'].words)} — the white lanes' foot)`);
ok(gold(res['highrise-run-pb'].num) && !gold(res['highrise-run-normal'].num), `HIGH RISE's poster: the floor GOLD on a PB (${JSON.stringify(res['highrise-run-pb'].num)}) — the white-hot cyan on a normal run`);
ok(res['highrise-run-pb'].words.n > 400 && gold(res['highrise-run-pb'].words), `HIGH RISE's poster: PERSONAL BEST lit + gold under the floor on a PB (${JSON.stringify(res['highrise-run-pb'].words)})`);
for (const k of ['jaywalk-run-pb', 'highrise-run-pb']) {
  const R = res[k];
  ok(R.wordsPx >= R.statPx && R.wordsPx * 0.72 * (360 / 1080) >= 7, `${k}: PERSONAL BEST ${R.wordsPx} px ≥ the stat line's ${R.statPx} — cap height at 360 wide ${(R.wordsPx * 0.72 * 360 / 1080).toFixed(1)} px, at 390 ${(R.wordsPx * 0.72 * 390 / 1080).toFixed(1)} px`);
}
ok(gold(res['jaywalk-daily-night-pb'].num) && !gold(res['jaywalk-daily-night-normal'].num), `JAYWALK's daily card by night: the big BEST gold on a NEW DAILY BEST (${JSON.stringify(res['jaywalk-daily-night-pb'].num)}), white otherwise`);
const deep = c => c.n > 40 && c.r > c.b + 40;
ok(deep(res['jaywalk-daily-day-pb'].num) && !deep(res['jaywalk-daily-day-normal'].num), `JAYWALK's daily card by day: the big BEST in the day's deep gold on a NEW DAILY BEST (${JSON.stringify(res['jaywalk-daily-day-pb'].num)})`);
ok(errs.length === 0, `no page error (${errs.slice(0, 2).join(' | ')})`);
if (OUT) for (const [k, v] of Object.entries(res)) writeFileSync(join(OUT, `${k}-390.png`), Buffer.from(v.png.split(',')[1], 'base64'));
await b.close();
console.log(`\n${checks - fails.length}/${checks} checks passed${fails.length ? `\nFAILED:\n - ${fails.join('\n - ')}` : ''}${OUT ? `\nshots → ${OUT}` : ''}`);
process.exit(fails.length ? 1 : 0);
