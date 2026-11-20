// HIGH RISE — THE LANDING FRAME (S4A FIX 2 — docs/games/passes/highrise-s4a-fix2.md): the measure + THE ON-PHONE TRACE's own check.
// The owner's iPhone names "tap" (a stall right after a touch = the landing frame) as the biggest cause; the Beelink can not make an
// iPhone stall, so this MEASURES what the page's own code does on a landing frame — Chromium at 4× CPU (a phone-class core), 390 × 844 @3,
// `?trace=1` on (trace.js: every frame timed in phases), a bot dropping each slab on its perfect moment (every 9th early: a cut — its
// falling piece + its sparks) from floor 30 (the flyby, then the UFO in the window).
//   node tests/integration/highrise-landing.mjs "<chromium>" [outDir]
//     prints the landing frames' own work (mean · p95 · max ms, by phase for the worst) against the plain frames', the touch's own cost,
//     THE 5 WORST + the counts by phase; checks the end card's panel (≥ 12 px, inside 390 × 844, clear of the PLAY AGAIN bar) + a shot.
//   LAND_S (seconds, 40) · LAND_CPU (4) · LAND_Q (extra query) · LAND_GATE (ms — fails if the landing frame's p95 work is over it)
// The page is the TEST PAGE: zero server calls — a plain `node scripts/serve.mjs` is enough (no emulators).
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const argv = process.argv.slice(2), OUT = argv[1] && !argv[1].startsWith('--') ? argv[1] : null;
const SECS = Number(process.env.LAND_S) || 40, RATE = Number(process.env.LAND_CPU) || 4;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };
if (OUT) mkdirSync(OUT, { recursive: true });

/** THE BOT (in the page): a touch ON each slab's perfect moment — a timer set for it (never "the next frame": a throttled page draws
 *  at ~30 Hz), every 9th early (a cut) */
const BOT = secs => new Promise(res => {
  const L = window.__hiPlay, play = document.querySelector('.hi-play'), init = { bubbles: true, pointerType: 'touch', button: 0 };
  let drops = 0;
  const end = performance.now() + secs * 1000;
  (function poll() {
    if (performance.now() > end || L.phase() > 1) return res({ drops, floor: L.state().floor });
    const m = L.soon();
    if (m !== -9999 && m <= 40) { setTimeout(() => { drops++; play.dispatchEvent(new PointerEvent('pointerdown', init)); setTimeout(poll, 200); }, drops % 9 === 8 ? m + 30 : Math.max(0, m - 2)); return; }
    setTimeout(poll, 4);
  })();
});

const b = await puppeteer.launch({ executablePath: argv[0], headless: true, protocolTimeout: 600000, args: ['--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage(), errs = [];
p.on('pageerror', e => errs.push(String(e.message || e)));
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await p.goto(guardUrl(`${BASE}/highrise-play?seed=land&trace=1&floor=30${process.env.LAND_Q || ''}`, 'highrise-play'), { waitUntil: 'load' });
await p.waitForFunction(() => { const i = window.__hiPlay && window.__hiPlay.state().info; return !!i && i.plates.includes(0) && i.warmed > 0 && i.frames > 5; }, { timeout: 30000 });
await sleep(500);
const cdp = await p.createCDPSession();
// (START first — the climb to floor 30 is played at once — then the throttle: the measure is the run, not its start)
await p.evaluate(() => document.querySelector('.hi-play').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', button: 0 })));
await p.waitForFunction(() => window.__hiPlay.phase() === 1, { timeout: 5000 });
if (RATE > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
await cdp.send('Performance.enable');
const metric = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
const m0 = await metric();
const r = await p.evaluate(BOT, SECS);
const m1 = await metric();
const tr = await p.evaluate(() => window.__hiPlay.trace());
if (RATE > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
console.log(`\nTHE LANDING FRAME — Chromium ${RATE}× CPU, 390 × 844 @3, ${SECS} s: ${r.drops} drops to floor ${r.floor} · ${tr.frames} frames traced`);
console.log(`  LANDING frames (their own work, ms): n ${tr.land.n} · mean ${tr.land.mean} · p95 ${tr.land.p95} · max ${tr.land.max}`);
console.log(`  the TOUCH (its engine step + its sounds, ms): n ${tr.tap.n} · mean ${tr.tap.mean} · p95 ${tr.tap.p95} · max ${tr.tap.max}`);
console.log(`  a landing frame's phases (mean ms): ${Object.entries(tr.landPh).filter(([, v]) => v >= 0.005).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
const dm = k => m1[k] - m0[k];
console.log(`  the browser's own work over the run (Chromium's counters): style ${dm('RecalcStyleCount')} × · ${(dm('RecalcStyleDuration') * 1000).toFixed(0)} ms · layout ${dm('LayoutCount')} × · ${(dm('LayoutDuration') * 1000).toFixed(0)} ms · script ${(dm('ScriptDuration') * 1000).toFixed(0)} ms · task ${(dm('TaskDuration') * 1000).toFixed(0)} ms — a landing: ${(dm('RecalcStyleCount') / Math.max(1, r.drops)).toFixed(1)} style recalcs, ${(dm('LayoutCount') / Math.max(1, r.drops)).toFixed(1)} layouts`);
console.log(`  the other frames: n ${tr.plain.n} · mean ${tr.plain.mean} ms · frames over 33 ms: ${tr.over}`);
for (const w of tr.worst) console.log(`    ${w.gap} ms · F${w.floor} · ev ${w.ev} · work ${w.work} · ${Object.entries(w.ph).filter(([, v]) => v >= 0.2).sort((a, c) => c[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
ok(tr.land.n >= 10 && tr.frames > 200, `the trace counted the run (${tr.land.n} landing frames, ${tr.frames} frames)`);
if (process.env.LAND_GATE) ok(tr.land.p95 <= Number(process.env.LAND_GATE), `the landing frame's p95 work ≤ ${process.env.LAND_GATE} ms (${tr.land.p95})`);

// ---- THE END CARD's PANEL: the run ends (no more drops: THE FUSE) → the 5 worst under the stats strip
await p.waitForFunction(() => window.__hiPlay.state().shown, { timeout: 20000 });
await sleep(900);
const pan = await p.evaluate(() => {
  const t = document.querySelector('.hi-trace'), a = document.querySelector('.hi-again'), s = document.querySelector('.hi-ec-line');   // (S4B: the panel sits under the card's last personal line)
  if (!t || t.hidden) return null;
  const r = t.getBoundingClientRect(), ra = a.getBoundingClientRect(), rs = s.getBoundingClientRect(), cs = getComputedStyle(t);
  return { text: t.textContent, top: r.top, bottom: r.bottom, left: r.left, right: r.right, againTop: ra.top, stripBottom: rs.bottom, font: parseFloat(cs.fontSize), w: innerWidth, h: innerHeight, lines: t.textContent.split('\n').length };
});
ok(!!pan, 'the end card shows the TRACE panel');
if (pan) {
  console.log(`\n${pan.text}\n`);
  ok(pan.font >= 12, `the panel's text is ≥ 12 px (${pan.font})`);
  ok(pan.left >= 0 && pan.right <= pan.w && pan.top >= pan.stripBottom - 1 && pan.bottom <= pan.againTop - 4, `the panel fits 390 × 844 under the stats strip, clear of PLAY AGAIN (${Math.round(pan.top)}–${Math.round(pan.bottom)} px, the bar at ${Math.round(pan.againTop)})`);
  ok(pan.lines >= 3 && /^TRACE · 5 WORST FRAMES OF \d+/.test(pan.text) && /> 33 MS: \d+/.test(pan.text), 'the panel: its title, the worst frames (total ms · the floor · what happened · the top 2 phases), the counts over 33 ms');
}
if (OUT) await p.screenshot({ path: join(OUT, 'trace-end-390x844.png') });
// (OFF = nothing: no ?trace → no panel, no trace object)
await p.goto(guardUrl(`${BASE}/highrise-play?seed=land`, 'highrise-play'), { waitUntil: 'load' });
await p.waitForFunction(() => !!window.__hiPlay, { timeout: 20000 });
ok(await p.evaluate(() => window.__hiPlay.trace() === null && !document.querySelector('.hi-trace')), 'without ?trace=1 there is no trace (null) and no panel');
ok(errs.length === 0, `no page error (${errs.join(' | ')})`);
await b.close();
console.log(`\n${checks - fails.length} / ${checks} checks`);
if (fails.length) { console.log('FAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
