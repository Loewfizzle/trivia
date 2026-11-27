// FREEFALL F5A — THE BILLBOARD = A · THE LOGO (the owner's pick, Nov 26; docs/freefall.md "THE BILLBOARD"). scripts/build-highrise-
// billboard.mjs is the pattern:
//   1. THE STAGED SHOT of the finished game: /freefall-play (the real night scene — the seed `poster1`, the bot dropping through the gaps
//      until THE BLAZE is lit on the rooftop) in a tall viewport (the stage's column ≥ 1400 px wide at 2×: the tower is never upscaled);
//      the page's own HUD is hidden for the picture; the frame round the ball is cut out of the canvas' screenshot.
//   2. THE BOARD: js/games/freefall/billboard.js#paintBoard (pure canvas, in the page) — FREEFALL's own night panorama, title-05's
//      lettering, the staged tower, the foot band + OPEN NOW (Bowlby One's path data: HIGH RISE's billboard-glyphs.js — no font load,
//      nothing fetched from outside) → the board at 2× (1696 × 896) + 1× (848 × 448).
//   3. → assets/city/freefall/billboard.webp (the 1× board, its words baked in — as JAYWALK's + HIGH RISE's faces) + the PNGs into
//      Downloads\NEON\freefall-f5a\billboard\ (or argv[3]). NOT wired into the city: the CITY chat installs it at go-live.
//   node scripts/build-freefall-billboard.mjs "<chromium>" [outDir]     (needs scripts/serve.mjs — E2E_BASE, :5173 by default)
import fs from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import puppeteer from '../tests/integration/kit/puppeteer.mjs';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const SEED = process.env.POSTER_SEED || 'poster1';
const OUT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : join(homedir(), 'Downloads', 'NEON', 'freefall-f5a', 'billboard');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: process.argv[2], headless: true, protocolTimeout: 240000, args: ['--enable-gpu', '--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const p = await browser.newPage();
const errs = [];
p.on('pageerror', e => errs.push(String(e.message || e)));
// ---- 1. the staged shot (a tall viewport: the stage's column is 0.47 of the height wide — 705 css px × 2)
await p.setViewport({ width: 900, height: 1500, deviceScaleFactor: 2 });
await p.goto(`${BASE}/freefall-play?seed=${SEED}&look=night&tier=2`, { waitUntil: 'load' });
const waitFor = async (js, ms = 60000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* loading */ } await sleep(60); } return false; };
if (!await waitFor("!!window.__ffPlay && !!document.querySelector('canvas.ff-canvas') && window.__ffPlay.state().info.frames > 3 && window.__ffPlay.state().info.landed >= 12")) { console.error('the page never came', errs); await browser.close(); process.exit(1); }
await p.mouse.move(450, 1000); await p.mouse.down(); await p.mouse.up();
await waitFor('window.__ffPlay.state().started');
await p.evaluate(() => { window.__ffPlay.auto = 'gap'; });
// THE BLAZE lit, the ball in a fall, well inside the rooftop (the city behind it, the roof far below)
const lit = await waitFor('(() => { const s = window.__ffPlay.state(); return s.blaze && s.floor >= 9 && s.floor <= 30 && s.fl === "fall"; })()', 90000);
await sleep(180);
// (the picture: the scene alone — the page's own HUD + words are hidden for it)
await p.evaluate(() => { const cv = document.querySelector('canvas.ff-canvas'); for (const n of document.querySelectorAll('.ff-stage *')) if (n !== cv && !n.contains(cv)) n.style.visibility = 'hidden'; });
const box = await p.evaluate(() => { const r = document.querySelector('canvas.ff-canvas').getBoundingClientRect(); const f = window.__ffPlay.frame ? window.__ffPlay.frame() : null; return { x: r.left, y: r.top, w: r.width, h: r.height, ball: f && f.ball ? f.ball : null }; });
// the frame round the ball: the stage's whole width, from over the flames to three floors under the ball
const by = box.ball && box.ball.y != null ? box.ball.y : box.y + box.h * 0.34;
const clip = { x: box.x, y: Math.max(box.y, by - box.w * 0.62), width: box.w, height: box.w * 1.25 };
const shot = await p.screenshot({ type: 'png', clip });
const st = await p.evaluate(() => { const s = window.__ffPlay.state(); return { floor: s.floor, blaze: s.blaze, fl: s.fl }; });
const ball = { x: 0.5, y: (by - clip.y) / clip.height };
// ---- 2. the board (in the page: the painter + its pictures)
const made = await p.evaluate(async (towerUrl, ball) => {
  const [{ paintBoard, BOARD }, { HI_GLYPHS }] = await Promise.all([import('/js/games/freefall/billboard.js'), import('/js/games/highrise/billboard-glyphs.js')]);
  const load = async u => { const im = new Image(); im.src = u; try { await im.decode(); } catch (e) { throw new Error(`can't decode ${u.slice(0, 60)} (${u.length} chars)`); } return im; };
  const [city, logo, tower] = await Promise.all([load('/assets/freefall/sky/rooftop-night.webp'), load('/assets/freefall/title/lettering-1170.webp'), load(towerUrl)]);
  const out = {};
  for (const [name, k] of [['board2x', 2], ['board1x', 1]]) {
    const c = document.createElement('canvas'); c.width = BOARD.w * k; c.height = BOARD.h * k;
    out.at = paintBoard(c.getContext('2d'), c.width, c.height, { city, tower, ball, logo, open: HI_GLYPHS.open });
    out[name] = c.toDataURL('image/png');
    if (k === 1) out.webp = c.toDataURL('image/webp', 0.88);
  }
  return out;
}, `data:image/png;base64,${Buffer.from(shot).toString("base64")}`, ball);
fs.mkdirSync(OUT, { recursive: true });
const bin = u => Buffer.from(u.split(',')[1], 'base64');
fs.writeFileSync(join(OUT, 'freefall-billboard-2x.png'), bin(made.board2x));
fs.writeFileSync(join(OUT, 'freefall-billboard-1x.png'), bin(made.board1x));
fs.writeFileSync(join(OUT, 'freefall-billboard-tower-frame.png'), shot);
// ---- 3. the city's file: the 1× board as WebP (the browser's own encoder — no tool on the build machine)
fs.mkdirSync(new URL('../assets/city/freefall/', import.meta.url), { recursive: true });
const wb = bin(made.webp);
fs.writeFileSync(new URL('../assets/city/freefall/billboard.webp', import.meta.url), wb);
await browser.close();
console.log(`the staged frame: floor ${st.floor}, THE BLAZE ${st.blaze ? 'lit' : 'NOT lit'}${lit ? '' : ' (the wait ran out)'}, ${st.fl} → ${OUT}: freefall-billboard-2x.png · -1x.png · -tower-frame.png · assets/city/freefall/billboard.webp ${(wb.length / 1024).toFixed(1)} KB${errs.length ? ` — page errors: ${errs.join(' | ')}` : ''}`);
