// HIGH RISE — ZERO GARBAGE IN PLAY (S4A FIX — docs/highrise.md "THE LAG RULES" · docs/games/passes/highrise-s4a-fix.md): the owner's
// iPhone showed one 2–3-frame stall a floor — a browser's collector pauses on a page that makes garbage every frame. The cure: a LIVE
// RUN MAKES NO OBJECTS (what changes once a LANDING — the new words, the engine's events, a sound's source — is all that is left).
// This is the MEASURE and the GUARD:
//   · Chromium's own allocation sampler (CDP HeapProfiler.startSampling — the collected ones too), run at a rate that catches (nearly)
//     EVERY allocation at its true size, over a live run on /highrise-play (?fps=1 on — the owner's own line), 390 × 844 @3, in EACH
//     look, with a flyer in the sky (night: from floor 30 — the seed's flyby at 35–45 · day: from floor 70 — the UFO at 85). A bot
//     drops each slab at its perfect moment (every 9th a cut: its sparks + its falling piece) from ONE frame callback that builds
//     nothing itself.
//   · every allocation is charged to the function that made it, and TOLD APART by its size: 12 bytes = a BOXED NUMBER — Chromium's
//     own way of holding a fraction in a function its optimizer has not reached (a function called once a frame stays in its first
//     tiers for minutes; Safari keeps a fraction in the value itself: nothing is allocated for one) — anything else is an OBJECT: a
//     list, a record, a closure, a string. OBJECTS are garbage in every engine: they are what the guard counts.
//   node tests/integration/highrise-alloc.mjs "<chromium>" [--table] [--min-three]
//     (no flag) THE GUARD: 30 s a look — FAILS if the game's own code makes over ALLOC_BUDGET_KB (12) KB of objects a second (the
//                pass's target was 20; measured: 3–6), or three.js over its own line (ALLOC_THREE_KB: 20 by day · 45 by night — its
//                render lists regrow each pass in Chromium, five passes a frame under the bloom)
//     --table      the pass's table: 60 s a look from floor 30 (the flyby, then the UFO), the top sites
//     --min-three  three.js's MINIFIED build in place of the readable one the pages load (the pass's own comparison: the minified
//                  build makes a closure at every draw call — its minifier folded setProgram into its caller as a function made + called
//                  on the spot; the readable build makes none)
//   ALLOC_S (seconds) · ALLOC_LOOKS (night,day) · ALLOC_FROM (the start floor, both looks) · ALLOC_TOP (24) · ALLOC_Q (extra query) ·
//   ALLOC_SIZES=1 (what sizes each top site's objects are) · ALLOC_JS (V8 flags) · E2E_BASE (the code from BEFORE the pass is
//   measured with this same script: it has no phase() / soon() hook — the bot reads its whole state four times a second instead)
// The page is the TEST PAGE: zero server calls — a plain `node scripts/serve.mjs` is enough (no emulators).
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const argv = process.argv.slice(2), TABLE = argv.includes('--table'), MIN = argv.includes('--min-three');
const SECS = Number(process.env.ALLOC_S) || (TABLE ? 60 : 30), BUDGET = Number(process.env.ALLOC_BUDGET_KB) || 12, TOP = Number(process.env.ALLOC_TOP) || 24;
/** the start floor a look (a flyer in the window): the table's 60 s from floor 30 hold the flyby AND the UFO */
const fromOf = look => (process.env.ALLOC_FROM != null ? Number(process.env.ALLOC_FROM) : TABLE || look !== 'day' ? 30 : 70), threeOf = look => Number(process.env.ALLOC_THREE_KB) || (look === 'day' ? 20 : 45);
const LOOKS = (process.env.ALLOC_LOOKS || 'night,day').split(',');
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js', THREE_MIN = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };

let minSrc = null;
if (MIN) {
  const at = join(tmpdir(), 'three-0.160.0.module.min.js');
  if (!existsSync(at)) { const r = await fetch(THREE_MIN); if (!r.ok) throw new Error(`three's minified build answered ${r.status}`); writeFileSync(at, await r.text()); }
  minSrc = readFileSync(at, 'utf8');
}

const b = await puppeteer.launch({ executablePath: argv[0], headless: true, protocolTimeout: 600000, args: ['--enable-gpu', '--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required', '--enable-precise-memory-info', ...(process.env.ALLOC_JS ? [`--js-flags=${process.env.ALLOC_JS}`] : [])] });

/** THE BOT (in the page): ONE frame callback, nothing built in it — it asks the stage two numbers (phase · msToPerfect) and, once a
 *  floor, sends ONE pointerdown (a real player's touch makes one event too) */
const BOT = () => {
  const L = window.__hiPlay, play = document.querySelector('.hi-play'), init = { bubbles: true, pointerType: 'touch', button: 0 };
  const B = window.__bot = { drops: 0, runs: 0, top: 0, wait: 0, stop: false };
  let endSeen = 0, startAt = 0;
  // (the code from BEFORE this pass has no phase() / soon(): its whole state is read instead, four times a second — that reading's own garbage shows as the sites `state` + `info`: the bot's, not the game's)
  let oldN = 0, oldPh = 0;
  const phaseOld = () => { if (oldN++ % 15 === 0) { const s = L.state(); oldPh = s.shown ? 3 : !s.started ? 0 : s.over ? 2 : 1; } return oldPh; }, soonOld = () => { const m = L.msToPerfect(); return m == null ? -9999 : Math.round(m); };
  function fr(now) {
    if (B.stop) return;
    requestAnimationFrame(fr);
    const ph = L.phase ? L.phase() : phaseOld();
    // (START is asked once; while it waits for the sounds' decode the page is still on its start screen — never a second START)
    if (ph === 0) { if (now > startAt) { startAt = now + 1500; B.wait = now + 200; B.runs++; play.dispatchEvent(new PointerEvent('pointerdown', init)); } return; }
    if (ph === 3) { if (!endSeen) endSeen = now; else if (now - endSeen > 900) { endSeen = 0; startAt = now + 1500; B.wait = now + 200; B.runs++; play.dispatchEvent(new PointerEvent('pointerdown', init)); } return; }
    if (ph !== 1 || now < B.wait) return;
    const m = L.soon ? L.soon() : soonOld();
    if (m === -9999) return;
    // (dead on: within half a frame of the perfect moment — every 9th drop early: a cut, its sparks, its falling piece)
    if (m <= (B.drops % 9 === 8 ? 46 : 8)) { B.drops++; B.wait = now + 180; play.dispatchEvent(new PointerEvent('pointerdown', init)); }
  }
  requestAnimationFrame(fr);
};

async function measure(look) {
  const FROM = fromOf(look);
  const ctx = await b.createBrowserContext(), p = await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push(String(e.message || e)));
  p.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text())) errs.push(`console: ${m.text()}`); });
  if (minSrc) {
    await p.setRequestInterception(true);
    p.on('request', r => { if (r.url() === THREE_URL) r.respond({ status: 200, contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' }, body: minSrc }); else r.continue(); });
  }
  const cdp = await p.createCDPSession();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await p.goto(guardUrl(`${BASE}/highrise-play?seed=alloc&fps=1&look=${look}${FROM ? `&floor=${FROM}` : ''}${process.env.ALLOC_Q || ''}`, 'highrise-play'), { waitUntil: 'load' });
  const end = Date.now() + 20000;
  while (Date.now() < end) { try { if (await p.evaluate(() => { const i = window.__hiPlay && window.__hiPlay.state().info; return !!i && i.env && i.plates.includes(0) && i.warmed > 0 && i.frames > 5; })) break; } catch { /* loading */ } await sleep(80); }
  await sleep(500);
  await p.evaluate(BOT);
  // "after the first second": the START touch, the climb to the start floor, the first second of the run
  const t1 = Date.now() + 15000;
  while (Date.now() < t1 && !(await p.evaluate(() => { const L = window.__hiPlay; if (L.phase) return L.phase() === 1; const q = L.state(); return q.started && !q.over && !q.shown; }))) await sleep(50);
  await sleep(1500);
  await cdp.send('HeapProfiler.enable');
  await cdp.send('HeapProfiler.collectGarbage');
  await cdp.send('HeapProfiler.startSampling', { samplingInterval: Number(process.env.ALLOC_RATE) || 4, includeObjectsCollectedByMajorGC: true, includeObjectsCollectedByMinorGC: true });
  // (a second, independent number: the heap's own growth, read from OUTSIDE the page four times a second — every rise summed)
  const t0 = Date.now();
  let grew = 0, was = (await cdp.send('Runtime.getHeapUsage')).usedSize, gcs = 0;
  while (Date.now() - t0 < SECS * 1000) {
    await sleep(250);
    const u = (await cdp.send('Runtime.getHeapUsage')).usedSize;
    if (u > was) grew += u - was; else if (u < was - 100000) gcs++;
    was = u;
  }
  const secs = (Date.now() - t0) / 1000;
  const { profile } = await cdp.send('HeapProfiler.stopSampling');
  const info = await p.evaluate(() => { const L = window.__hiPlay, s = L.state(), B = window.__bot; B.stop = true; return { floor: s.floor, look: s.info.look, tier: s.tier, hitch: L.hitches(), plan: L.plan ? L.plan() : { flown: {} }, fly: L.flyInfo ? L.flyInfo().played : [], drops: B.drops, runs: B.runs, programs: s.info.programs, lights: s.info.lights, ends: L.ends.map(e => `${e.live.floor} ${e.live.cause} (${e.taps.length} taps)`) }; });
  await ctx.close();
  // ---- the sites: every allocation is charged to the function that made it (a browser-made one — a DOM text, an event — to the page's
  // function that asked for it). The sampler is run at a rate that catches (nearly) EVERY allocation at its true size, so the two kinds
  // can be told apart: a 12-byte one is a BOXED NUMBER — Chromium's own way of holding a fraction that leaves a function its optimizer
  // has not reached yet (a function called once a frame stays in its first tiers for minutes; Safari keeps a fraction in the value
  // itself and allocates nothing for it) — anything else is an OBJECT (a list, a record, a closure, a string): garbage in every engine.
  const short = u => (u || '').replace(BASE, '').replace(/^https:\/\/cdn\.jsdelivr\.net\/npm\//, '').replace(/\?.*$/, '');
  const nodeSite = new Map();
  (function walk(n, js) {
    const f = n.callFrame, own = f.url ? `${f.functionName || '(anonymous)'} ${short(f.url)}:${f.lineNumber + 1}` : null;
    nodeSite.set(n.id, own || (js ? `${js} → ${f.functionName || '?'}` : f.functionName || '(root)'));
    for (const c of n.children || []) walk(c, own || js);
  })(profile.head, '');
  // (ONE-OFFS: a big allocation seen once or twice in the whole window — a list's store growing, a decoded model, the engine's own
  //  records for a function it just compiled — is not garbage a FRAME makes: it is listed, never counted in the rates. A big one
  //  that comes back again and again IS counted.)
  const ONE_OFF = 1024, hist = new Map();    // site → Map(size → how many)
  for (const q of profile.samples || []) { const site = nodeSite.get(q.nodeId) || '?'; if (!hist.has(site)) hist.set(site, new Map()); const h = hist.get(site); h.set(q.size, (h.get(q.size) || 0) + 1); }
  const sites = new Map();   // site → [object bytes, number bytes]
  let objs = 0, nums = 0, own = 0, three = 0, once = 0;
  for (const [site, h] of hist) {
    const row = [0, 0], top = site.split(' → ')[0];
    for (const [size, n] of h) {
      if (size === 12) { row[1] += size * n; nums += size * n; continue; }
      if (size >= ONE_OFF && n <= 3) { once += size * n; continue; }
      row[0] += size * n; objs += size * n;
      if (/three@|three\.module/.test(top)) three += size * n; else if (/ \/js\//.test(top)) own += size * n;
    }
    sites.set(site, row);
  }
  const rows = [...sites.entries()].sort((x, y) => y[1][0] - x[1][0] || y[1][1] - x[1][1]);
  return { look, from: FROM, secs, onceKb: once / 1024, objKbs: objs / 1024 / secs, numKbs: nums / 1024 / secs, ownKbs: own / 1024 / secs, threeKbs: three / 1024 / secs, grewKbs: grew / 1024 / secs, gcs, rows, info, errs, hist };
}

const out = [];
for (const look of LOOKS) {
  const r = await measure(look);
  out.push(r);
  console.log(`\nHIGH RISE — ALLOCATION, the ${r.look} look, ${r.secs.toFixed(0)} s of a live run after its first second (from floor ${r.from} to ${r.info.floor}, ${r.info.drops} drops, ${r.info.runs} run(s), tier ${r.info.tier}):`);
  console.log(`  OBJECTS ${r.objKbs.toFixed(1)} KB a second (the game's own code ${r.ownKbs.toFixed(1)} · three.js's ${r.threeKbs.toFixed(1)} · the browser's ${(r.objKbs - r.ownKbs - r.threeKbs).toFixed(1)}) · one-offs (not in the rates) ${r.onceKb.toFixed(0)} KB in all · boxed numbers (Chromium only) ${r.numKbs.toFixed(1)} KB a second · the heap's own growth ${r.grewKbs.toFixed(1)} KB a second, ${r.gcs} collections seen · the page's HITCH ${r.info.hitch.n}${r.info.hitch.last ? ` (last: ${r.info.hitch.last})` : ''}`);
  console.log(`  the flyers: ${r.info.plan.jet} at ${r.info.plan.jetAt}, the UFO at ${r.info.plan.ufoAt} — flown ${JSON.stringify(r.info.plan.flown)} · sounds ${(r.info.fly || []).join(' · ') || '—'}${r.info.ends.length ? ` · runs ended: ${r.info.ends.join(' · ')}` : ''}`);
  if (TABLE || r.objKbs > BUDGET) {
    console.log('  | objects, bytes / s | boxed numbers, bytes / s | site |');
    for (const [site, [o, n]] of r.rows.slice(0, TOP)) console.log(`  | ${(o / r.secs).toFixed(0).padStart(8)} | ${(n / r.secs).toFixed(0).padStart(8)} | ${site} |${process.env.ALLOC_SIZES && r.hist.has(site) ? ` sizes: ${[...r.hist.get(site).entries()].sort((x, y) => y[0] * y[1] - x[0] * x[1]).slice(0, 7).map(([sz, c]) => `${sz} B × ${c}`).join(' · ')}` : ''}`);
  }
  ok(r.errs.length === 0, `${look}: no page error (${r.errs.join(' | ')})`);
  ok(r.info.drops >= SECS * 0.5 && r.info.look === look, `${look}: the run was LIVE the whole time (${r.info.drops} drops in ${r.secs.toFixed(0)} s, the ${r.info.look} look)`);
  if (!TABLE || process.env.ALLOC_BUDGET_KB) {
    ok(r.ownKbs <= BUDGET, `${look}: THE GAME's OWN CODE makes ≤ ${BUDGET} KB of objects a second in a live run (${r.ownKbs.toFixed(1)})`);
    ok(r.threeKbs <= threeOf(look), `${look}: three.js's own objects ≤ ${threeOf(look)} KB a second (${r.threeKbs.toFixed(1)})`);
  }
}
await b.close();
console.log(`\n${checks - fails.length} / ${checks}${fails.length ? ` — FAILED: ${fails.join(' · ')}` : ''}`);
process.exit(fails.length ? 1 : 0);
