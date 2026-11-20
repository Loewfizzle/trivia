// HIGH RISE — THE SHARE CARD = B · THE POSTER (REVIEW FIX B — docs/highrise.md "THE SHARE CARD" · the owner's mockup
// Downloads\NEON\highrise-share-B.png), on the LOCAL server (NEVER THE LIVE SITE). THE CARD is drawn IN THE PAGE (share.js#drawHiCard + the
// band's hero shot through loadHero — the same functions the cartridge's SHARE draws) for:
//   · every band (ROOFTOPS 14 · SKYLINE 42 · CLOUDS 93 · STARS 131 · DEEP SPACE 187) · a MATCH card with a long name · ONE FLOOR (the singular) ·
//     THE FINISH (MADE IT TO THE MOTHERSHIP — the long cause on two lines, ALL GOLD, the gold shot) — each at 1080 × 1350 + the link's 540 × 675 + a message
//     thread's 300 × 375.
//   · checks: the six hero shots load (1080 × 1350 each, small); the card is full-bleed (no inner frame — the hero's own pixels at the
//     edges); the band's shot is the one drawn; HIGH pink + RISE cyan (both GOLD for the finish); the number white-hot; THE READABILITY at
//     300 px wide — the number, HIGH RISE + the cause big enough + standing on the dark; the link picture ≤ 300 KB after fitPng.
//   node tests/integration/highrise-share.mjs "<chromium>" [outDir]     (outDir: Downloads\NEON\highrise-fix-b\share)
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const argv = process.argv.slice(2), OUT = argv.slice(1).find(a => !a.startsWith('--')) || null;
if (OUT) mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: argv[0], headless: true, protocolTimeout: 300000, args: ['--enable-gpu', '--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist'] });
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };
const p = await b.newPage(), errs = [];
p.on('pageerror', e => errs.push(String(e.message || e)));
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
await p.goto(guardUrl(`${BASE}/highrise-play?look=night`, 'highrise-play'), { waitUntil: 'load' });

// ---- the six hero shots
const heroes = await p.evaluate(async () => {
  const H = await import('/js/games/highrise/share.js');
  const out = [];
  for (const id of H.HERO_IDS) { const im = await H.loadHero(id), r = await fetch(H.heroUrl(id)); out.push({ id, w: im ? im.width : 0, h: im ? im.height : 0, kb: (await r.arrayBuffer()).byteLength / 1024 }); }
  return out;
});
ok(heroes.length === 6 && heroes.map(x => x.id).join() === 'rooftops,skyline,clouds,stars,space,mothership', `six hero shots (${heroes.map(x => x.id).join(' · ')})`);
for (const x of heroes) ok(x.w === 1080 && x.h === 1350 && x.kb > 20 && x.kb <= 120, `${x.id}: 1080 × 1350, ${x.kb.toFixed(0)} KB (≤ 120)`);

/** one card: drawn at 1080, scaled to 540 (the link) + 300 (a thread's thumbnail) — the checks read the pixels */
async function card(name, run, want) {
  const res = await p.evaluate(async (run) => {
    const H = await import('/js/games/highrise/share.js'), K = await import('/js/games/kit/share-run.js'), D = await import('/js/daily/share.js');
    await D.shareFonts();
    const k = H.hiRunCard(run), hero = await H.loadHero(k.hero), cv = H.drawHiCard(run, hero), c = cv.getContext('2d'), L = H.POSTER_L;
    const avg = (x, y, w, h, min = 0) => { const d = c.getImageData(x, y, w, h).data; let r = 0, g = 0, bl = 0, n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] >= min) { r += d[i]; g += d[i + 1]; bl += d[i + 2]; n++; } return n ? [r / n, g / n, bl / n].map(Math.round) : [0, 0, 0]; };
    // FULL-BLEED: the card's edge pixels = the hero's own (drawn at 1 : 1 — no frame, no box)
    const hc = document.createElement('canvas'); hc.width = 1080; hc.height = 1350; const h2 = hc.getContext('2d'); if (hero) h2.drawImage(hero, 0, 0);
    const diff = (x, y) => { const a = c.getImageData(x, y, 1, 1).data, q = h2.getImageData(x, y, 1, 1).data; return Math.abs(a[0] - q[0]) + Math.abs(a[1] - q[1]) + Math.abs(a[2] - q[2]); };
    const edge = Math.max(diff(4, 700), diff(1075, 700), diff(4, 860), diff(1075, 860));
    // the tower's middle shows (the hero's lit glass at the card's centre, under the words)
    const tower = avg(440, 760, 200, 160);
    // HIGH (left of centre) · RISE (right) — their lit letters' colour · the number's core
    const high = avg(260, L.titleY - 70, 230, 64, 330), rise = avg(600, L.titleY - 70, 230, 64, 330), num = avg(Math.round(cv.hiRow.bx), L.bigY - 170, Math.round(cv.hiRow.ux - L.unitGap - cv.hiRow.bx), 140, 600);   // (THE GO-LIVE: the number's own place — FLOORS stands right of it)
    const out = { w: cv.width, h: cv.height, card: { line: k.line, unit: k.bigUnit, band: k.band, stat: k.stat, hero: k.hero, gold: k.gold }, edge, tower, high, rise, num, row: cv.hiRow };
    // (THE GO-LIVE: FLOORS's lit core colour where it stands beside the number · the band's)
    out.unitCol = avg(Math.round(cv.hiRow.ux), L.bigY - Math.round(L.unitPx * 0.7), Math.round(cv.hiRow.uw), Math.round(L.unitPx * 0.66), 330);
    out.bandCol = avg(200, L.bandY - Math.round(L.bandPx * 0.7), 680, Math.round(L.bandPx * 0.66), 330);
    const scaled = w => { const s = document.createElement('canvas'); s.width = w; s.height = Math.round(w * 1350 / 1080); const x = s.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(cv, 0, 0, s.width, s.height); return s; };
    const half = scaled(540), thumb = scaled(300), t = thumb.getContext('2d'), sc = 300 / 1080;
    // THE READABILITY at 300 px: the lettering's lit core against the dark round it (a luminance ratio — the words read when the core is
    // far brighter than the ground they stand on); the sizes from the layout (a cap height ≈ 0.72 of the px)
    const lum = (r, g, b2) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b2); };
    const ratio = (x, y, w, h) => { const d = t.getImageData(Math.round(x * sc), Math.round(y * sc), Math.max(1, Math.round(w * sc)), Math.max(1, Math.round(h * sc))).data, ls = []; for (let i = 0; i < d.length; i += 4) ls.push(lum(d[i], d[i + 1], d[i + 2])); ls.sort((a, b2) => a - b2); const hi = ls[Math.floor(ls.length * 0.97)], lo = ls[Math.floor(ls.length * 0.2)]; return (hi + 0.05) / (lo + 0.05); };
    out.read = {
      num: { cap: Math.round(L.bigPx * 0.72 * sc), ratio: ratio(240, L.bigY - L.bigPx * 0.78, 600, L.bigPx * 0.8) },
      title: { cap: Math.round(L.titlePx * 0.72 * sc), ratio: ratio(200, L.titleY - L.titlePx * 0.8, 680, L.titlePx * 0.85) },
      cause: { cap: Math.round(L.causePx * 0.72 * sc), ratio: ratio(80, L.causeY - L.causePx * 0.8, 920, L.causePx * 0.85) },
      unit: { cap: Math.round(L.unitPx * 0.72 * sc), ratio: ratio(out.row.ux, L.bigY - L.unitPx * 0.8, out.row.uw, L.unitPx * 0.85) },
      band: { cap: Math.round(L.bandPx * 0.72 * sc), ratio: ratio(100, L.bandY - L.bandPx * 0.8, 880, L.bandPx * 0.85) },
    };
    const hb = await new Promise(r => half.toBlob(r, 'image/png')), fit = await K.fitPng(hb);
    out.halfKb = hb.size / 1024; out.fitKb = fit ? fit.size / 1024 : -1;
    out.full = cv.toDataURL('image/png'); out.half = half.toDataURL('image/png'); out.thumb = thumb.toDataURL('image/png');
    return out;
  }, run);
  const C = res.card;
  ok(res.w === 1080 && res.h === 1350, `${name}: 1080 × 1350 — "${C.line}" · "${C.unit}" · "${C.band}" · "${C.stat}" · the ${C.hero} shot`);
  // THE GO-LIVE — "10 FLOORS" on ONE row (FLOORS right of the number, inside the card), the band on its own line under it
  ok(res.row && res.row.ux > res.row.bx && res.row.bx >= 60 && res.row.ux + res.row.uw <= 1020, `${name}: "${C.unit}" stands right beside the number on its line (the row ${Math.round(res.row.bx)} … ${Math.round(res.row.ux + res.row.uw)} of 1080)`);
  ok(C.hero === want.hero, `${name}: the hero shot = the band reached (${C.hero})`);
  ok(res.edge <= 24, `${name}: FULL-BLEED — the card's edges are the hero's own pixels (Δ ${res.edge}) · no inner frame`);
  ok(res.tower[0] + res.tower[1] + res.tower[2] > 120, `${name}: the tower shows under the words (${res.tower})`);
  const isGold = c => c[0] > 200 && c[1] > 150 && c[2] < 170, isPink = c => c[0] > 200 && c[2] > 170 && c[1] < 200, isCyan = c => c[2] > 200 && c[1] > 180 && c[0] < 200;
  ok(want.gold ? isGold(res.high) && isGold(res.rise) : isPink(res.high) && isCyan(res.rise), `${name}: HIGH ${want.gold ? 'GOLD' : 'pink'} (${res.high}) · RISE ${want.gold ? 'GOLD' : 'cyan'} (${res.rise})`);
  ok(res.num[0] > 225 && res.num[1] > 225 && res.num[2] > 210, `${name}: the floor white-hot (${res.num})`);
  ok(want.gold ? isGold(res.unitCol) && isGold(res.bandCol) : isCyan(res.unitCol) && isPink(res.bandCol), `${name}: FLOORS ${want.gold ? 'GOLD' : 'cyan'} (${res.unitCol}) · the band ${want.gold ? 'GOLD' : 'PINK'} (${res.bandCol})`);
  const NAMES = { num: 'number', title: 'HIGH RISE', cause: 'cause', unit: 'FLOORS', band: 'band' };
  for (const k of ['num', 'title', 'cause', 'unit', 'band']) ok(res.read[k].ratio >= 3 && res.read[k].cap >= (k === 'num' ? 50 : 13), `${name}: at 300 px wide the ${NAMES[k]} reads — ${res.read[k].cap} px caps, ${res.read[k].ratio.toFixed(1)} : 1 on its ground`);
  ok(res.fitKb > 0 && res.fitKb <= 390, `${name}: the link's 540 × 675 picture fits the server's cap (≤ LINK_HARD 390) (${res.halfKb.toFixed(0)} KB → ${res.fitKb.toFixed(0)} KB)`);
  if (OUT) for (const [k, sz] of [['full', '1080x1350'], ['half', '540x675'], ['thumb', '300x375']]) writeFileSync(join(OUT, `card-${name}-${sz}.png`), Buffer.from(res[k].split(',')[1], 'base64'));
}

await card('rooftops-miss', { floor: 14, perfects: 6, cause: 'miss', mode: 'solo', name: 'BEN' }, { hero: 'rooftops' });
await card('skyline-miss', { floor: 42, perfects: 31, cause: 'miss', mode: 'solo', name: 'BEN' }, { hero: 'skyline' });
await card('clouds-thin', { floor: 93, perfects: 71, cause: 'thin', mode: 'solo', name: 'BEN' }, { hero: 'clouds' });
await card('stars-slow', { floor: 131, perfects: 104, cause: 'slow', mode: 'solo', name: 'BEN' }, { hero: 'stars' });
await card('space-cap', { floor: 187, perfects: 150, cause: 'cap', mode: 'match', name: 'BEN' }, { hero: 'space' });
await card('match-longname', { floor: 118, perfects: 88, cause: 'miss', mode: 'match', name: 'CHRISTOPHERS' }, { hero: 'stars' });
await card('one-floor', { floor: 1, perfects: 1, cause: 'miss', mode: 'solo', name: 'BEN' }, { hero: 'rooftops' });
await card('mothership-gold', { floor: 200, perfects: 171, cause: 'made', made: true, mode: 'match', name: 'BEN' }, { hero: 'mothership', gold: true });
ok(errs.length === 0, `no page error (${errs.join(' | ')})`);
await b.close();
console.log(`\n${checks - fails.length} / ${checks}${fails.length ? ` — FAILED: ${fails.join(' · ')}` : ''}`);
process.exit(fails.length ? 1 : 0);
