// CITY A — item 7, THE BILLBOARD FLASH (the owner: "a quick flash of the previous face mid-turn" on the speakeasy's tri-vision). Every frame the
// page PAINTS (a CDP screencast — what the screen showed, the crisp layer and the city's canvas together) across several turns of the roof
// board (&force=trivision: a turn every 8 s), at 390 / 402 / 430, night + day. The board's rect is cut into its slats; each slat in each frame is
// matched against the two faces at rest (the frames just before the turn = the OLD face, just before the next turn = the NEW one):
//   THE RULE: once a slat has shown the NEW face, no later frame of that turn shows it OLD again — never a frame of the old face after the new
//   one showed (per slat AND for the whole board). N faces: a turn is judged from the face before it to the face after it.
//   node tests/integration/tri-flash.mjs "<chromium>" [--sizes 390x844,402x874,430x932] [--times night,day] [--turns 4] [--keep DIR] [--force billboard-drop]
//   (THE CITY TIMETABLE's knobs: billboard.trivision — 12 slats, 1.2-s turns, force 8 s)
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { guardUrl } from './kit/live-guard.mjs';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const BASE = opt('base', 'http://localhost:5173');
const SIZES = opt('sizes', '390x844,402x874,430x932').split(',').map(s => s.split('x').map(Number));
const TIMES = { night: '2026-11-10T21:30', day: '2026-11-10T13:30' };
const WHEN = opt('times', 'night,day').split(',');
// (CITY B: --force billboard-drop — THE DROP's face too: the three-face turn A → B → C → A, each judged from the face before it)
const EXTRA = opt('force', '');
const TURNS = Number(opt('turns', 4)), KEEP = opt('keep', ''), DSF = Number(opt('dpr', 2)), CPU = Number(opt('cpu', 1));   // (--cpu 6: a slow phone — the bake lands late)
const sleep = ms => new Promise(r => setTimeout(r, ms));
const { default: puppeteer } = await import('./kit/puppeteer.mjs');
const browser = await puppeteer.launch({ executablePath: argv[0], headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const fails = [], rows = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };
if (KEEP) mkdirSync(KEEP, { recursive: true });

/** the board's slats in a decoded frame → per slat a small grey + colour signature (8 × 6 cells of RGB means) */
const SIG = `async (b64, R, n, dsf) => {
  const img = new Image(); img.src = 'data:image/jpeg;base64,' + b64; await img.decode();
  const k = img.naturalWidth / innerWidth;   // (the screencast's own scale — not always the dpr)
  const c = document.createElement('canvas'), W = Math.max(n * 4, Math.round(R.w * k)), H = Math.max(12, Math.round(R.h * k)); c.width = W; c.height = H;
  const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, R.x * k, R.y * k, R.w * k, R.h * k, 0, 0, W, H);
  const d = x.getImageData(0, 0, W, H).data, out = [];
  for (let i = 0; i < n; i++) {
    const x0 = Math.floor(i * W / n) + 1, x1 = Math.floor((i + 1) * W / n) - 1, cells = [];
    for (let gy = 0; gy < 6; gy++) for (let gx = 0; gx < 2; gx++) {
      let r = 0, g = 0, bl = 0, k = 0;
      for (let y = Math.floor(gy * H / 6); y < Math.floor((gy + 1) * H / 6); y++) for (let xx = x0 + Math.floor(gx * (x1 - x0) / 2); xx < x0 + Math.floor((gx + 1) * (x1 - x0) / 2); xx++) { const q = (y * W + xx) * 4; r += d[q]; g += d[q + 1]; bl += d[q + 2]; k++; }
      cells.push(r / k, g / k, bl / k);
    }
    out.push(cells);
  }
  return out;
}`;
const dist = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return s / a.length; };
const median = arr => arr[0].map((_, i) => arr[0][i].map((__, k) => { const v = arr.map(f => f[i][k]).sort((p, q) => p - q); return v[v.length >> 1]; }));

async function run(when, [w, h]) {
  const ctx = await browser.createBrowserContext();
  const p = await ctx.newPage();
  await p.evaluateOnNewDocument(() => { try { localStorage.setItem('nd:entered', '1'); localStorage.setItem('na:tf:profile', JSON.stringify({ name: 'AVA', color: 'cyan', avatar: 'bolt' })); } catch { /* fine */ } });
  await p.setViewport({ width: w, height: h, deviceScaleFactor: DSF, isMobile: true, hasTouch: true });
  await p.goto(guardUrl(`${BASE}/?emu&slot=tf&city=2&idle=1&when=${TIMES[when]}&force=trivision${EXTRA ? `,${EXTRA}` : ''}`, 'tri-flash.mjs'));
  const ev = js => p.evaluate(js);
  const waitFor = async (js, ms = 30000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await ev(js)) return true; } catch { /* navigating */ } await sleep(100); } return false; };
  const label = `${when} ${w}×${h}${CPU > 1 ? ` · CPU ÷${CPU}` : ''}${DSF !== 2 ? ` · @${DSF}` : ''}`;
  if (!await waitFor('!!(window.__district && window.__district.harbor() && window.__district.harbor().shown && window.__district.tri && window.__district.tri() && window.__district.tri().ready)', 60000)) { ok(false, `${label}: the tri-vision up`); await ctx.close(); return; }
  // (the first turn after the art warmed, then start the cast just after a turn ENDED — a whole rest, then TURNS turns)
  await waitFor('(() => { const t = window.__district.tri(); return t && t.turns.length >= 1 && !t.turn; })()', 30000);
  const T0 = await ev('window.__district.tri()');
  const R = T0.rect, n = 12, F = 8;
  // (the turns follow THE CITY's clock — a &when= jump moves it — never the server's: the frames are stamped on it)
  const off = await ev('window.__district.tri().now * 1000 - Date.now()');
  const cdp = await p.target().createCDPSession(), frames = [];
  if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  cdp.on('Page.screencastFrame', f => { frames.push({ ts: f.metadata.timestamp * 1000 + off, data: f.data }); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, everyNthFrame: 1, maxWidth: w * DSF, maxHeight: h * DSF });
  await sleep((TURNS * F + 3) * 1000);
  await cdp.send('Page.stopScreencast');
  if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });   // (the capture was the slow phone; reading it back needn't be)
  console.log(`  ${label}: ${frames.length} frames captured — reading the slats…`);
  const T1 = await ev('window.__district.tri()');
  // the turns inside the cast (the clock: every F s) → each judged from the face before it to the face after it
  const startS = frames[0].ts / 1000, endS = frames[frames.length - 1].ts / 1000;
  const turns = []; for (let k = Math.ceil(startS / F); k * F < endS - F; k++) turns.push(k * F);
  const sigs = [];
  for (const f of frames) sigs.push(await p.evaluate(`(${SIG})(${JSON.stringify(f.data)}, ${JSON.stringify(R)}, ${n}, ${DSF})`));
  let flashes = 0, wholeFlash = 0, judged = 0;
  const notes = [];
  for (const at of turns) {
    const idx = (a, b) => frames.map((f, i) => [f.ts / 1000, i]).filter(([t]) => t >= a && t < b).map(([, i]) => i);
    const pre = idx(at - 1.6, at - 0.15), post = idx(at + F - 1.6, at + F - 0.15), during = idx(at - 0.15, at + F - 1.6);
    if (pre.length < 3 || post.length < 3 || !during.length) { notes.push(`turn @${at}: too few frames (${pre.length}/${during.length}/${post.length})`); continue; }
    const A = median(pre.map(i => sigs[i])), B = median(post.map(i => sigs[i]));
    if (KEEP && process.env.TF_DEBUG) { writeFileSync(join(KEEP, `${when}-${w}-pre-${at}.jpg`), Buffer.from(frames[pre[0]].data, 'base64')); writeFileSync(join(KEEP, `${when}-${w}-post-${at}.jpg`), Buffer.from(frames[post[0]].data, 'base64')); }
    const faceGap = A.map((a, i) => dist(a, B[i])), apart = faceGap.filter(g => g > 6).length;
    if (apart < n / 2) { notes.push(`turn @${at}: the two faces are alike on this board (${apart} slats apart)`); continue; }
    judged++;
    const seenNew = new Array(n).fill(false); let boardNew = false, firstNewAt = null;
    for (const i of during) {
      const s = sigs[i], st = s.map((c, k) => { if (faceGap[k] <= 6) return '='; const dA = dist(c, A[k]), dB = dist(c, B[k]); return dB < dA * 0.45 ? 'B' : dA < dB * 0.45 ? 'A' : '~'; });
      const nB = st.filter(x => x === 'B').length, nA = st.filter(x => x === 'A').length, live = st.filter(x => x !== '=').length;
      for (let k = 0; k < n; k++) {
        if (st[k] === 'B') seenNew[k] = true;
        else if (st[k] === 'A' && seenNew[k]) { flashes++; if (notes.length < 12) notes.push(`turn @${at}: slat ${k} OLD again at +${((frames[i].ts / 1000) - at).toFixed(2)} s (${st.join('')})`); if (KEEP) writeFileSync(join(KEEP, `${when}-${w}-flash-${at}-${i}.jpg`), Buffer.from(frames[i].data, 'base64')); seenNew[k] = false; }
      }
      if (nB >= live - 1 && live) { boardNew = true; if (firstNewAt == null) firstNewAt = frames[i].ts / 1000 - at; }
      else if (boardNew && nA >= live / 2) wholeFlash++;
    }
    rows.push(`${label} turn @${at}: the new face whole at +${firstNewAt == null ? '?' : firstNewAt.toFixed(2)} s`);
  }
  const heldOut = (T1.heldOut || 0) - (T0.heldOut || 0);
  if (flashes || wholeFlash) console.log(`  the board's events (the city clock):\n    ${(T1.log || []).join('\n    ')}`);   // (CITY A: a turn whose hold ran out before the new bake landed — the flash's path)
  ok(judged >= Math.min(2, turns.length - 1) && flashes === 0 && wholeFlash === 0 && heldOut === 0, `${label}: ${frames.length} painted frames over ${judged} judged turns (${(frames.length / Math.max(1, endS - startS)).toFixed(0)} fps) — ${flashes} slat flashes of the OLD face after the new one showed, ${wholeFlash} whole-board flashes, ${heldOut} holds run out${notes.length ? ` · ${notes.slice(0, 6).join(' · ')}` : ''} (turns logged ${T1.turns.length - T0.turns.length})`);
  await ctx.close();
}

try { for (const when of WHEN) for (const sz of SIZES) await run(when, sz); }
catch (e) { console.log('CRASH', e && e.stack || e); fails.push(String(e && e.message)); }
finally { await browser.close(); }
console.log(`\n${rows.join('\n')}`);
console.log(`\n${checks - fails.length}/${checks} checks${fails.length ? ` — FAILED:\n  ${fails.join('\n  ')}` : ' — all green'}`);
process.exit(fails.length ? 1 : 0);
