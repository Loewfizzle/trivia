// HIGH RISE S4B — WHAT REPAINTS DURING PLAY (docs/highrise.md "WHAT REPAINTS IN PLAY"; the owner's iPhone trace: every slow frame was
// the BROWSER's own paint, spread over the run, never on a landing). The Beelink can not make Safari stall — but it can LIST what the
// page gives a browser to do: a Chromium trace (devtools.timeline) of a bot's run on the LOCAL server, every style recalc / layout /
// paint set against the taps:
//   · a frame that changes nothing writes NOTHING: no style recalc, no layout, no paint more than SETTLE ms after a landing's last
//     deferred write (the tags ride a transition; the announcer's one-shot is a Web Animation: both run on the compositor)
//   · what a LANDING costs: its style recalcs, layouts + paints (the number, the lane, the tags)
// FAILS if anything repaints BETWEEN landings (a per-frame DOM write, an animated paint over the canvas).
//   node tests/integration/highrise-paint.mjs "<chromium>" [--table] [--q='&look=day'] [--secs=30]
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const argv = process.argv.slice(2), TABLE = argv.includes('--table'), arg = k => (argv.find(a => a.startsWith(`--${k}=`)) || '').slice(k.length + 3);
const SECS = Number(arg('secs')) || 30, EXTRA = arg('q');
/** a landing's own writes are over within this (the number 2 frames after, the tags 3, the announcer's start, the band's swell: ≤ 4 frames + a paint) */
const SETTLE = 140;
const b = await puppeteer.launch({ executablePath: argv[0], headless: true, protocolTimeout: 600000, args: ['--enable-gpu', '--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run(q, name) {
  const ctx = await b.createBrowserContext(), p = await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push(String(e.message || e)));
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.goto(guardUrl(`${BASE}/highrise-play${q}`, 'highrise-paint'), { waitUntil: 'load' });
  await p.waitForFunction(() => window.__hiPlay && window.__hiPlay.state().warm, { timeout: 30000 });
  await sleep(400);
  // START, then a few floors before the trace begins (the start's own writes are not the steady state)
  const cdp = await p.createCDPSession();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 600, id: 1, radiusX: 4, radiusY: 4, force: 1 }] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await p.waitForFunction(() => window.__hiPlay.phase() === 1, { timeout: 5000 });
  const bot = ms => p.evaluate(limit => new Promise(res => {
    const L = window.__hiPlay, play = document.querySelector('.hi-play'), t0 = performance.now();
    let n = 0;
    (function poll() {
      if (L.phase() !== 1 || performance.now() - t0 > limit) return res(n);
      const m = L.soon();
      // (every 5th drop 2 ticks early: a cut + its sparks — the trace sees both kinds of landing)
      if (m !== -9999 && m <= (n % 5 === 4 ? 40 : 5)) { play.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', pointerId: 7 })); console.timeStamp('hi-tap'); n++; return setTimeout(poll, 150); }
      setTimeout(poll, m !== -9999 && m > 50 ? Math.min(30, m - 44) : 1);
    })();
  }), ms);
  await bot(5000);
  await p.tracing.start({ categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline'] });
  const taps = await bot(SECS * 1000);
  const buf = await p.tracing.stop();
  const floor = await p.evaluate(() => window.__hiPlay.result().floor);
  await ctx.close();
  const ev = JSON.parse(Buffer.from(buf).toString('utf8')).traceEvents || [];
  const tapsAt = ev.filter(e => e.name === 'TimeStamp' && e.args && e.args.data && e.args.data.message === 'hi-tap').map(e => e.ts / 1000).sort((x, y) => x - y);
  const kinds = { UpdateLayoutTree: 'style', Layout: 'layout', Paint: 'paint' }, rows = { style: [], layout: [], paint: [] };
  for (const e of ev) { const k = kinds[e.name]; if (k && (e.ph === 'X' || e.ph === 'B')) rows[k].push({ at: e.ts / 1000, ms: (e.dur || 0) / 1000, node: e.args && e.args.data && (e.args.data.nodeName || '') }); }
  const from = tapsAt[0] || 0, to = tapsAt[tapsAt.length - 1] || 0;
  const since = at => { let lo = -1; for (const t of tapsAt) { if (t <= at) lo = t; else break; } return lo < 0 ? Infinity : at - lo; };
  const out = { name, taps: tapsAt.length, floor, secs: (to - from) / 1000 };
  for (const k of ['style', 'layout', 'paint']) {
    const inRun = rows[k].filter(r => r.at >= from && r.at <= to), idle = inRun.filter(r => since(r.at) > SETTLE);
    out[k] = { n: inRun.length, perTap: inRun.length / Math.max(1, tapsAt.length), ms: inRun.reduce((s, r) => s + r.ms, 0), idle: idle.length, idleNodes: [...new Set(idle.map(r => r.node).filter(Boolean))].slice(0, 6), idleAt: idle.slice(0, 6).map(r => Math.round(since(r.at))) };
  }
  out.errs = errs;
  return out;
}

const RUNS = [['night', `?seed=paint1&look=night${EXTRA}`], ['day', `?seed=paint1&look=day${EXTRA}`], ['night, ?mode=match (the clock)', `?seed=paint1&look=night&mode=match${EXTRA}`], ['night, ?lean=1', `?seed=paint1&look=night&lean=1${EXTRA}`]];
const res = [];
for (const [name, q] of RUNS) {
  const r = await run(q, name);
  res.push(r);
  const clock = /mode=match/.test(q), lean = /lean=1/.test(q);
  ok(r.taps >= 8 && r.errs.length === 0, `${name}: ${r.taps} landings over ${r.secs.toFixed(0)} s to floor ${r.floor}, no page error (${r.errs.join(' | ')})`);
  // (a match's clock is written once a SECOND — its own text node: one small layout + its paint, allowed, counted apart. A style
  //  recalc with NO layout and NO paint is an animation's own tick — the announcer's one-shot, the tag's ride: compositor work — and
  //  LEAN has none of them)
  //  (LEAN: the lane has no animation to hide its words — it hides them itself, ONE plain write a call, no glow to paint)
  const allow = clock ? Math.ceil(r.secs) + 2 : lean ? r.taps : 0;
  ok(r.layout.idle <= allow && r.paint.idle <= allow * 2, `${name}: BETWEEN landings (> ${SETTLE} ms after a tap) the page gives the browser NOTHING to lay out or paint — ${r.layout.idle} layouts · ${r.paint.idle} paints${clock ? ` (≤ ${allow} · ${allow * 2}: the clock's one write a second)` : lean ? ` (≤ ${allow} · ${allow * 2}: the lane hiding its own words, once a call)` : ''}${r.paint.idle && !clock && !lean ? ` — ${r.paint.idleNodes.join(' ')} at ${r.paint.idleAt.join(' ')} ms` : ''}; ${r.style.idle} style ticks (a running animation's own, no paint)`);
  if (lean) ok(r.style.idle <= r.taps, `${name}: … and LEAN has NO animation over the canvas — ${r.style.idle} style recalcs between landings (the lane's own hide, ≤ one a call; a plain run ticks ~${res[0].style.idle})`);
  ok(r.paint.perTap <= 6.5 && r.layout.perTap <= 4, `${name}: a LANDING costs ${r.layout.perTap.toFixed(1)} layouts · ${r.paint.perTap.toFixed(1)} paints (${(r.paint.ms / Math.max(1, r.taps)).toFixed(2)} ms of paint on this machine) — the number, the lane, the tag`);
}
if (TABLE) {
  console.log('\n| run | landings | style recalcs (a landing · between) | layouts (a landing · between) | paints (a landing · between) | paint ms a landing |\n| --- | --- | --- | --- | --- | --- |');
  for (const r of res) console.log(`| ${r.name} | ${r.taps} | ${r.style.perTap.toFixed(1)} · ${r.style.idle} | ${r.layout.perTap.toFixed(1)} · ${r.layout.idle} | ${r.paint.perTap.toFixed(1)} · ${r.paint.idle} | ${(r.paint.ms / Math.max(1, r.taps)).toFixed(2)} |`);
}
await b.close();
console.log(`\n${checks - fails.length}/${checks} checks passed${fails.length ? `\nFAILED:\n  ${fails.join('\n  ')}` : ''}`);
process.exit(fails.length ? 1 : 0);
