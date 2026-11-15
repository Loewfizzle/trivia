// CITY A — item 19, THE 8-CARD LOBBY: a full room (8 players' cards) at 4× CPU throttle — the room's first paint after HOST, each guest's
// arrival (the write → their name tag in the city), the GUESTS sheet with 8 slim cards (the tap → the sheet in → every card painted), and EVERY
// frame over 50 ms in those windows with the long tasks behind it (Chromium's own longtask entries + where the main thread was).
//   node tests/integration/lobby8.mjs "<chromium>" [--cpu 4]       (the emulators + serve.mjs --emu)  → the numbers + a check: no frame > 50 ms
//   blocked by the room's own work (a frame over 50 ms is reported with its long tasks; the check fails on one past MAX_MS)
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
import { guardUrl } from './kit/live-guard.mjs';

const argv = process.argv.slice(2);
const CPU = Number((i => (i < 0 ? 4 : argv[i + 1]))(argv.indexOf('--cpu')));
const MAX_MS = Number(process.env.LOBBY_MAX_MS || 50);
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const DB = 'http://127.0.0.1:9000', NS = 'ns=demo-arcade-default-rtdb';
const dbPatch = (path, v) => fetch(`${DB}/${path}.json?${NS}`, { method: 'PATCH', headers: { Authorization: 'Bearer owner' }, body: JSON.stringify(v) });
const { default: puppeteer } = await import('./kit/puppeteer.mjs');
const browser = await puppeteer.launch({ executablePath: argv[0], headless: true });
const fails = []; let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };
const WATCH = `(() => { window.__lf = { frames: [], tasks: [] }; let l = 0; const f = t => { if (l && t - l > ${MAX_MS}) window.__lf.frames.push({ at: Math.round(t), d: Math.round(t - l) }); l = t; requestAnimationFrame(f); }; requestAnimationFrame(f);
  try { new PerformanceObserver(L => { for (const e of L.getEntries()) window.__lf.tasks.push({ at: Math.round(e.startTime), d: Math.round(e.duration), a: (e.attribution && e.attribution[0] && (e.attribution[0].containerSrc || e.attribution[0].name)) || '' }); }).observe({ type: 'longtask', buffered: false }); } catch { /* fine */ } })()`;
const mark = p => p.evaluate('performance.now()');
const window_ = async (p, a, b) => p.evaluate(([a0, b0]) => ({ frames: window.__lf.frames.filter(x => x.at >= a0 && x.at <= b0), tasks: window.__lf.tasks.filter(x => x.at + x.d >= a0 && x.at <= b0) }), [a, b]);
const fmt = w => `${w.frames.length} frames > ${MAX_MS} ms (${w.frames.map(x => x.d).join(', ') || 'none'}) · long tasks ${w.tasks.map(x => x.d).join(', ') || 'none'}`;

try {
  const ctx = await browser.createBrowserContext();
  const p = await ctx.newPage();
  await p.evaluateOnNewDocument(() => { try { localStorage.setItem('nd:entered', '1'); localStorage.setItem('na:lb8:profile', JSON.stringify({ name: 'HOST', color: 'magenta', avatar: 'bolt' })); } catch { /* fine */ } });
  await p.setViewport({ width: 402, height: 874, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await p.goto(guardUrl(`${BASE}/?emu&slot=lb8&city=2&idle=1&when=2026-11-10T20:30`, 'lobby8.mjs'));
  await p.waitForFunction('!!(window.__district && window.__district.harbor() && window.__district.harbor().shown && window.__arcade && window.__arcade.state.uid)', { timeout: 60000 });
  await sleep(2500);
  const cdp = await p.target().createCDPSession();
  if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  await p.evaluate(WATCH);
  await sleep(1500);
  // 1. HOST → the room's first paint (the room's layer up + a frame drawn after it)
  const t0 = await mark(p);
  await p.evaluate("document.querySelector('.nd-hostbtn').click()");
  await p.waitForFunction('!!(window.__arcade.state.code && document.body.classList.contains("rc-on") && document.querySelector(".rdk-guests"))', { timeout: 60000 });
  const t1 = await p.evaluate('new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(performance.now()))))');
  const code = await p.evaluate('window.__arcade.state.code');
  await sleep(4000);
  const w1 = await window_(p, t0, await mark(p));
  // 2. seven guests land at once (each a player row + presence) → each name tag in the city
  const now = Date.now(), players = {}, presence = {};
  for (let i = 0; i < 7; i++) { players[`gp${i}`] = { name: `GUEST${i}`, color: ['cyan', 'yellow', 'green', 'orange', 'violet', 'red', 'blue'][i], avatar: 'star', joinedAt: now + 200 * i, ln: i % 2 ? 'L' : 'R' }; presence[`gp${i}`] = { online: true, lastSeen: now, v: 2, c: { [`c${i}`]: now } }; }
  const t2 = await mark(p);
  await dbPatch(`rooms/${code}/players`, players); await dbPatch(`rooms/${code}/presence`, presence);
  const arr = await p.evaluate(`new Promise(res => { const t0 = ${t2}, seen = {}; const f = () => { for (const el of document.querySelectorAll('.rc-tags [data-uid]')) { const u = el.dataset.uid; if (/^gp/.test(u) && !seen[u]) seen[u] = Math.round(performance.now() - t0); } if (Object.keys(seen).length >= 7 || performance.now() - t0 > 30000) res(seen); else requestAnimationFrame(f); }; f(); })`);
  await sleep(4000);
  const w2 = await window_(p, t2, await mark(p));
  // 3. GUESTS → the sheet with 8 slim cards (the tap → the sheet in → every card's strip painted)
  const t3 = await mark(p);
  await p.evaluate("document.querySelector('.rdk-guests').click()");
  const sheetIn = await p.evaluate(`new Promise(res => { const t0 = ${t3}; let a = null; const f = () => { const s = document.querySelector('.sh.is-in'); if (s && a == null) a = Math.round(performance.now() - t0); const rows = s ? s.querySelectorAll('.rg-row') : []; const painted = [...rows].filter(r => r.querySelector('canvas, svg, .sb-strip, .strip')).length; if ((rows.length >= 8 && painted >= 8) || performance.now() - t0 > 30000) res({ sheet: a, rows: rows.length, painted, all: Math.round(performance.now() - t0) }); else requestAnimationFrame(f); }; f(); })`);
  await sleep(3000);
  const w3 = await window_(p, t3, await mark(p));
  const tagT = Object.values(arr);
  console.log(`\nTHE 8-CARD LOBBY at ${CPU}× CPU (402 × 874 @3):`);
  console.log(`  HOST → the room's first paint: ${Math.round(t1 - t0)} ms · ${fmt(w1)}`);
  console.log(`  7 guests at once → their name tags: first ${Math.min(...tagT)} ms, last ${Math.max(...tagT)} ms (${tagT.length}/7) · ${fmt(w2)}`);
  console.log(`  GUESTS → the sheet in ${sheetIn.sheet} ms, ${sheetIn.painted}/${sheetIn.rows} cards painted at ${sheetIn.all} ms · ${fmt(w3)}`);
  const worst = Math.max(0, ...[w1, w2, w3].flatMap(w => w.frames.map(x => x.d)));
  ok(tagT.length === 7 && sheetIn.rows >= 8, `the full room: 7 name tags + 8 rows in GUESTS (${tagT.length} tags, ${sheetIn.rows} rows)`);
  ok(worst <= Number(process.env.LOBBY_BLOCK_MS || 250), `the worst frame in the room's own windows: ${worst} ms (reported above with its long tasks)`);
  await ctx.close();
} catch (e) { console.log('CRASH', e && e.stack || e); fails.push(String(e && e.message)); }
finally { await browser.close(); }
console.log(`\n${checks - fails.length}/${checks} checks${fails.length ? ` — FAILED:\n  ${fails.join('\n  ')}` : ' — all green'}`);
process.exit(fails.length ? 1 : 0);
