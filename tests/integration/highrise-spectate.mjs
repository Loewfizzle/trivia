// HIGH RISE REVIEW FIX A — SPECTATE IN SYNC (docs/highrise.md "THE MATCH" · docs/games/passes/highrise-fix-a.md "GROUP 2"), on the LOCAL
// server (NEVER THE LIVE SITE): /highrise-play?mode=match&rivals=7 — you + seven bot rivals on the same seed (nothing counts), 390 × 844.
// The owner, watching GUS: "it goes past, and then it snaps back on top and drops" — the review measured the watched slab drawn 10–15
// frames PAST the tap, 27–47 px from the tap spot, on all 11 landings. THE FIX: WATCH plays the watched player back on a short delay
// (stage.js — WATCH_DELAY_MS), each landed tap at its own tick.
//   Your run ends on its own fuse (no tap) → WATCH; ALEX (the steadiest bot) is picked; EVERY drawn frame of the watched tower is recorded
//   (the tick drawn, the sliding slab's offset + its screen centre + px per unit). For every landing: the slab's spot AT ITS TAP comes
//   from the engine (the same seed, the bot's own taps) — the furthest the slab was ever DRAWN PAST that spot, in px on this screen.
//   PASS: ≥ 20 landings, every one drawn past its tap by ≤ 1 px, no tap ever came after the playback had passed it, the slab never drawn
//   past its sweep's edge. THE CONTROL (the test sees the bug): the same with the delay set to 0 — the old live clock — must overshoot.
//   + a clean start: a switch to another player (a row's tap) — the first frame of the new tower already its own (no slab of the old one).
//   node tests/integration/highrise-spectate.mjs "<chromium>" [outDir]     (SPECTATE_LOOKS=night,day)
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const argv = process.argv.slice(2), OUT = argv.slice(1).find(a => !a.startsWith('--')) || null;
const LOOKS = (process.env.SPECTATE_LOOKS || 'night,day').split(',');
const WATCH_S = Number(process.env.SPECTATE_S || 26);
if (OUT) mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: argv[0], headless: true, protocolTimeout: 300000, args: ['--enable-gpu', '--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function until(p, js, ms = 15000) { const end = Date.now() + ms; while (Date.now() < end) { try { const v = await p.evaluate(js); if (v) return v; } catch { /* loading */ } await sleep(60); } return null; }

/** the landings in the record: per floor, the tap's tick + the slab's offset there (the engine's own) + how far the slab was drawn past it */
const MEASURE = `(async (recs, uid) => {
  const E = await import('/js/games/highrise/engine.js');
  const L = window.__hiPlay, taps = L.sim.taps(uid), run = E.createRun({ seed: L.seed(), mode: 'match' });
  const out = [], sl = { floor: 0, axis: 'x', off: 0, x0: 0, x1: 0, z0: 0, z1: 0 };
  for (const t of taps) {
    E.stepTo(run, t);
    if (run.st !== 'slide') break;
    const s = E.slabInto(run, t, sl), floor = s.floor, offT = s.off, edge = run.s0 + 2 * run.S - 1;
    const mine = recs.filter(r => r[1] === floor);
    if (mine.length > 3) {
      let past = 0, pastF = 0, near = Infinity, overEdge = 0;
      for (const r of mine) {
        const px = Math.abs(r[2] - offT) * r[5];
        if (r[0] > t + 1e-6) { pastF++; if (px > past) past = px; } else near = Math.min(near, px);
        if (r[0] > edge + 1e-6) overEdge++;
      }
      out.push({ floor, t, past, pastF, near: near === Infinity ? -1 : near, frames: mine.length, overEdge });
    }
    E.tap(run, t);
    if (E.isOver(run)) break;
  }
  return out;
})`;

async function watchRun(look, delay, secs, tag) {
  const p = await b.newPage(), errs = [];
  p.on('pageerror', e => errs.push(String(e.message || e)));
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await p.goto(guardUrl(`${BASE}/highrise-play?mode=match&rivals=7&seed=sync7&floor=4&look=${look}`, 'highrise-play'), { waitUntil: 'load' });
  ok(!!await until(p, '(() => { const L = window.__hiPlay; return L && L.sim && L.state().warm; })()', 25000), `${look} ${tag}: the page + its seven bots are up`);
  await p.evaluate("document.querySelector('.hi-play').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', button: 0 }))");
  // (no tap of yours: your slab's fuse ends the run — TOO SLOW — then WATCH)
  ok(!!await until(p, 'window.__hiPlay.watching()', 20000), `${look} ${tag}: OUT → WATCH`);
  if (delay != null) await p.evaluate(`window.__hiPlay.watchSync(${delay}, true)`);
  await p.evaluate("window.__hiPlay.sim.pick('s0')");
  ok(!!await until(p, "window.__hiPlay.watching() === 's0'", 4000), `${look} ${tag}: watching ALEX`);
  await sleep(400);
  await p.evaluate('window.__hiPlay.watchRec(true)');
  await sleep(secs * 1000);
  const recs = await p.evaluate('window.__hiPlay.watchRec(false)');
  const sync = await p.evaluate('window.__hiPlay.watchSync()');
  const land = await p.evaluate(`${MEASURE}(${JSON.stringify(recs)}, 's0')`);
  return { p, errs, recs, sync, land };
}

for (const look of LOOKS) {
  // THE CONTROL — the old live clock (delay 0): the slab is drawn past the tap, then jumps back
  {
    const { p, errs, land } = await watchRun(look, 0, 7, 'CONTROL (delay 0)');
    const worst = land.reduce((m, l) => Math.max(m, l.past), 0), hit = land.filter(l => l.past > 5).length;
    ok(land.length >= 4 && hit >= land.length * 0.6 && worst > 10, `${look} CONTROL: on the live clock the slab is drawn PAST the tap on ${hit} of ${land.length} landings, up to ${worst.toFixed(1)} px (the bug the test must see)`);
    ok(errs.length === 0, `${look} CONTROL: no page error (${errs.join(' | ')})`);
    await p.close();
  }
  // THE FIX — the delayed playback
  const { p, errs, recs, sync, land } = await watchRun(look, null, WATCH_S, 'THE PLAYBACK');
  const worst = land.reduce((m, l) => Math.max(m, l.past), 0), nearW = land.reduce((m, l) => Math.max(m, l.near), 0);
  console.log(`   ${look}: ${recs.length} frames · delay ${sync.delayMs.toFixed(0)} ms (wanted ${sync.wantMs.toFixed(0)}) · ${land.length} landings · drawn past the tap: max ${worst.toFixed(2)} px · the nearest frame before it: max ${nearW.toFixed(1)} px`);
  ok(land.length >= 20, `${look}: ${land.length} landings recorded (≥ 20)`);
  ok(land.every(l => l.past <= 1), `${look}: EVERY landing — the slab never drawn more than 1 px past its tap spot (max ${worst.toFixed(2)} px; ${land.filter(l => l.pastF).length} landings with a frame past the tick)`);
  ok(sync.past === 0, `${look}: no tap came after the playback had passed it (${sync.past})`);
  ok(land.every(l => !l.overEdge), `${look}: the slab never drawn past its sweep's edge`);
  ok(sync.delayMs >= 700 && sync.delayMs <= 2500, `${look}: the delay ${sync.delayMs.toFixed(0)} ms (750 · grows only for a late line, ≤ 2500)`);
  if (OUT) await p.screenshot({ path: join(OUT, `spectate-${look}-390x844-watch.png`) });
  // the watcher's line + the list read the DRAWN (delayed) tower
  const line = await p.evaluate("(() => ({ w: window.__hiPlay.matchState().watch, f: window.__hiPlay.watchFloor(), row: (window.__hiPlay.matchState().alt.find(r => r.uid === 's0') || {}).text }))()");
  ok(line.f >= 0 && line.w.includes(`· ${line.f}`) && (!line.row || line.row.endsWith(String(line.f))), `${look}: the watcher's line + the list show the drawn tower's floor (${line.w} · the row "${line.row}" · drawn ${line.f})`);
  // A CLEAN START: a switch to another player — from the switch on, every frame is the new tower's (no slab of the old one)
  await p.evaluate('window.__hiPlay.watchRec(true)');
  const other = await p.evaluate("(() => { const L = window.__hiPlay, s = L.sim.state().filter(x => !x.over && x.uid !== 's0'); return s.length ? s[0].uid : ''; })()");
  if (other) {
    const before = await p.evaluate("window.__hiPlay.state().floor");
    await p.evaluate(`window.__hiPlay.sim.pick('${other}')`);
    await until(p, `window.__hiPlay.watching() === '${other}'`, 3000);
    await sleep(1500);
    const r2 = await p.evaluate('window.__hiPlay.watchRec(false)');
    const land2 = await p.evaluate(`${MEASURE}(${JSON.stringify(r2)}, '${other}')`);
    const ticks = r2.map(r => r[0]), back = ticks.some((t, i) => i && t < ticks[i - 1] - 1e-6);
    ok(r2.length > 20 && !back && land2.every(l => l.past <= 1), `${look}: a SWITCH (ALEX at ${before} → ${other}) starts clean — the playback never runs backwards, no slab drawn past a tap (${r2.length} frames)`);
  }
  ok(errs.length === 0, `${look}: no page error (${errs.join(' | ')})`);
  await p.close();
}
await b.close();
console.log(`\n${checks - fails.length} / ${checks}${fails.length ? ` — FAILED: ${fails.join(' · ')}` : ''}`);
process.exit(fails.length ? 1 : 0);
