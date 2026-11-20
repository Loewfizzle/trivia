// HIGH RISE S5 — THE SHARE IMAGE (docs/highrise.md "THE SHARE IMAGE" · the owner's mockup Downloads\NEON\highrise-share-image.png), on the
// LOCAL server (NEVER THE LIVE SITE): a REAL run on /highrise-play ends — its frame is taken a beat after (shot.js, the stage's
// night.js#snap) — then THE CARD is drawn from it IN THE PAGE (share.js#drawHiCard — the same function the cartridge's SHARE draws):
//   · a normal run by night (MISSED THE STACK, from THE CLOUDS) · the same by day · a LONG cause (two lines) · THE FINISH (MADE IT TO THE
//     MOTHERSHIP — ALL GOLD, the tower under THE MOTHERSHIP: ?mode=match&floor=193) — each 1080 × 1350 + the link's 540 × 675.
//   · checks: the size; the frame was taken (its top slab's point inside it) and drawn as the hero (the box's pixels are the frame's);
//     the frame's edge pink (gold for the finish); the title line + the number gold for the finish; the link picture ≤ 300 KB after fitPng.
//   node tests/integration/highrise-share.mjs "<chromium>" [outDir]     (outDir: Downloads\NEON\highrise-s5\share)
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const argv = process.argv.slice(2), OUT = argv.slice(1).find(a => !a.startsWith('--')) || null;
if (OUT) mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: argv[0], headless: true, protocolTimeout: 300000, args: ['--enable-gpu', '--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function until(p, js, ms = 15000) { const end = Date.now() + ms; while (Date.now() < end) { try { const v = await p.evaluate(js); if (v) return v; } catch { /* loading */ } await sleep(60); } return null; }

/** one run → its frame → the card. `how`: 'miss' (an early tap off the stack) · 'made' (climb to floor 200 in a match-mode look check) */
async function card(name, q, how, extra = {}) {
  const p = await b.newPage(), errs = [];
  p.on('pageerror', e => errs.push(String(e.message || e)));
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await p.goto(guardUrl(`${BASE}/highrise-play?${q}`, 'highrise-play'), { waitUntil: 'load' });
  await until(p, '(() => { const L = window.__hiPlay; return L && L.state().warm; })()', 25000);
  await p.evaluate("document.querySelector('.hi-play').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', button: 0 }))");
  await until(p, 'window.__hiPlay.phase() === 1');
  await sleep(500);
  // (the taps from ONE frame callback IN the page — a poll from outside misses a 12 ms window)
  await p.evaluate(how => {
    const L = window.__hiPlay, play = document.querySelector('.hi-play'), init = { bubbles: true, pointerType: 'touch', button: 0 };
    let done = false, wait = 0, lastM = -1, far = -1;
    (function fr(now) {
      if (done || L.state().over) return;
      requestAnimationFrame(fr);
      const m = L.msToPerfect();
      if (m == null || now < wait) return;
      // (a MISS: the tap half a pass after dead on — the slab at the FAR end of its path, off the stack · THE FINISH: within a frame of dead on)
      const q = how === 'miss' ? L.state() : null;   // (the slab's path: s0 … s0 + 2S, dead on at s0 + S/2 and s0 + 3S/2 — its far end at s0 + S)
      if (how === 'miss' ? q.st === 'slide' && q.t >= q.s0 + q.S - 1 && q.t <= q.s0 + q.S + 3 : m <= 14) { play.dispatchEvent(new PointerEvent('pointerdown', init)); wait = now + 200; if (how === 'miss') done = true; }
    })(performance.now());
  }, how);
  await until(p, 'window.__hiPlay.state().over', 30000);
  const shot = await until(p, `(async () => { const S = await import('/js/games/highrise/shot.js'); const s = S.lastShot(); return s && s.canvas ? { w: s.canvas.width, h: s.canvas.height, topX: s.topX, topY: s.topY, floor: s.floor, cause: s.cause, made: s.made, look: s.look } : null; })()`, 8000);
  ok(!!shot && shot.w === 1080 && shot.topX > 0.05 && shot.topX < 0.95 && shot.topY > 0.05 && shot.topY < 0.95, `${name}: the run's frame was taken (${shot ? `${shot.w} × ${shot.h}, the top at ${shot.topX.toFixed(2)}, ${shot.topY.toFixed(2)} — floor ${shot.floor}, ${shot.cause}` : 'none'})`);
  const res = await p.evaluate(async (ex) => {
    const S = await import('/js/games/highrise/shot.js'), H = await import('/js/games/highrise/share.js'), K = await import('/js/games/kit/share-run.js'), D = await import('/js/daily/share.js');
    await D.shareFonts();
    const s = S.lastShot(), run = { floor: s.floor, perfects: s.perfects, cause: ex.cause || s.cause, made: s.made, mode: ex.mode || 'solo', name: ex.name || 'BEN' };
    const cv = H.drawHiCard(run, s), c = cv.getContext('2d'), B = H.HI_CARD.box;
    const px = (x, y) => Array.from(c.getImageData(x, y, 1, 1).data.slice(0, 3));
    const edge = px(B.x + B.w / 2, B.y), title = (() => { const d = c.getImageData(300, 285, 480, 45).data; let r = 0, g = 0, bl = 0, n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 300) { r += d[i]; g += d[i + 1]; bl += d[i + 2]; n++; } return n ? [r / n, g / n, bl / n].map(Math.round) : [0, 0, 0]; })();
    // the hero: the frame's middle drawn into the box (its pixels are the scene's, not the card's dark)
    let lit = 0; const mid = c.getImageData(B.x + 100, B.y + 260, B.w - 200, 260).data; for (let i = 0; i < mid.length; i += 4) if (mid[i] + mid[i + 1] + mid[i + 2] > 180) lit++;
    const full = cv.toDataURL('image/png'), half = document.createElement('canvas'); half.width = 540; half.height = 675; half.getContext('2d').drawImage(cv, 0, 0, 540, 675);
    const hb = await new Promise(r => half.toBlob(r, 'image/png')), fit = await K.fitPng(hb);
    const raw = s.canvas.toDataURL('image/jpeg', 0.8);
    return { raw, w: cv.width, h: cv.height, edge, title, lit: lit / (mid.length / 4), full, half: half.toDataURL('image/png'), halfKb: hb.size / 1024, fitKb: fit ? fit.size / 1024 : -1, line: H.hiRunCard(run).line, band: H.hiRunCard(run).band };
  }, extra);
  ok(res.w === 1080 && res.h === 1350, `${name}: the card is 1080 × 1350 — "${res.line}" · "${res.band}"`);
  ok(res.lit > 0.08, `${name}: THE HERO FRAME holds the run's real picture (${(res.lit * 100).toFixed(0)} % of its middle lit)`);
  const gold = extra.gold, isGold = c => c[0] > 200 && c[1] > 150 && c[2] < 140, isPink = c => c[0] > 200 && c[2] > 150 && c[1] < 160;
  ok(gold ? isGold(res.edge) : isPink(res.edge), `${name}: the frame's ONE neon edge is ${gold ? 'GOLD' : 'pink'} (${res.edge})`);
  ok(gold ? isGold(res.title) : isPink(res.title), `${name}: the title line HIGH RISE · ${extra.mode === 'match' ? 'MATCH' : 'SOLO'} is ${gold ? 'GOLD' : 'pink'} (${res.title})`);
  ok(res.fitKb > 0 && res.fitKb <= 300, `${name}: the link's 540 × 675 picture fits the server's cap (${res.halfKb.toFixed(0)} KB → ${res.fitKb.toFixed(0)} KB)`);
  ok(errs.length === 0, `${name}: no page error (${errs.join(' | ')})`);
  if (OUT) writeFileSync(join(OUT, `frame-${name}.jpg`), Buffer.from(res.raw.split(',')[1], 'base64'));
  if (OUT) { writeFileSync(join(OUT, `card-${name}-1080x1350.png`), Buffer.from(res.full.split(',')[1], 'base64')); writeFileSync(join(OUT, `card-${name}-540x675.png`), Buffer.from(res.half.split(',')[1], 'base64')); }
  await p.close();
}

await card('night-miss', 'seed=share1&floor=62&look=night', 'miss');
await card('day-miss', 'seed=share1&floor=62&look=day', 'miss');
await card('night-long-match', 'seed=share2&floor=118&look=night&mode=match', 'miss', { cause: 'thin', mode: 'match', name: 'CHRISTOPHER' });
await card('night-made', 'seed=share3&floor=193&look=night&mode=match', 'made', { gold: true });
await b.close();
console.log(`\n${checks - fails.length} / ${checks}${fails.length ? ` — FAILED: ${fails.join(' · ')}` : ''}`);
process.exit(fails.length ? 1 : 0);
