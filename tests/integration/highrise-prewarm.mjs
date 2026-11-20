// HIGH RISE S4B — THE LAG CHECK's browser half (docs/highrise.md "THE PRE-WARM" · "?lean=1"), on the LOCAL server (NEVER THE LIVE SITE):
//   · THE PRE-WARM: behind the welcome screen — before the first tap — the look's FIVE plates + its reflection map are uploaded, every
//     program is built (the warm frame), every flyer's model (the Blackbird, the F-22, the UFO, THE MOTHERSHIP's hull) is read + uploaded.
//     PROVEN by two runs with `?trace=1`: a `?floor=1` run played to floor 120 (the skyline + clouds + stars seams, the flyby, the UFO)
//     and a `?floor=80` run — the trace's SET-UP AFTER START says "none" (no program compiled, no picture / model uploaded, no sound
//     decoded after the first tap), the scene's own program + upload counts do not move. And the detector WORKS: a look switch forced
//     mid-run (the other look's pictures) is counted.
//   · `?lean=1`: every DOM / CSS effect over the canvas is off while a run is live (no text-shadow, no transition, no animation) — the
//     panel + the note say LEAN; a plain run keeps its glows (the look is unchanged)
//   · `?floor=N`: the floors the START tap builds count toward nothing — the announcer, the end card's perfects + best streak, YOUR BEST
//   node tests/integration/highrise-prewarm.mjs "<chromium>" [outDir] [--quick]     (--quick: the ?floor=1 run only to floor 50)
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const argv = process.argv.slice(2), OUT = argv.slice(1).find(a => !a.startsWith('--')) || null, QUICK = argv.includes('--quick');
if (OUT) mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: argv[0], headless: true, protocolTimeout: 900000, args: ['--enable-gpu', '--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const waitFor = async (p, js, ms = 20000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* loading */ } await sleep(60); } return false; };

async function open(q, before = null) {
  const ctx = await b.createBrowserContext(), p = await ctx.newPage(), errs = [], reqs = [];
  p.on('pageerror', e => errs.push(String(e.message || e)));
  p.on('request', r => { if (!r.url().startsWith('data:') && !r.url().startsWith('blob:')) reqs.push(r.url()); });
  const cdp = await p.createCDPSession();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  if (before) await p.evaluateOnNewDocument(before);
  await p.goto(guardUrl(`${BASE}/highrise-play${q}`, 'highrise-prewarm'), { waitUntil: 'load' });
  await waitFor(p, "!!window.__hiPlay && !!document.querySelector('canvas.hi-canvas')");
  const tap = async (x = 195, y = 600) => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1, radiusX: 4, radiusY: 4, force: 1 }] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
  return { p, errs, reqs, tap, close: () => ctx.close() };
}
/** a bot INSIDE the page: a pointerdown on the play area at each slab's perfect moment, up to floor `to` (→ the floor reached) */
const botTo = (p, to, ms = 300000) => p.evaluate((target, limit) => new Promise(res => {
  const L = window.__hiPlay, play = document.querySelector('.hi-play'), t0 = performance.now();
  (function poll() {
    const ph = L.phase(), fl = L.result().floor;
    if (ph !== 1 || fl >= target || performance.now() - t0 > limit) return res(fl);
    const m = L.soon();
    if (m !== -9999 && m <= 5) { play.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', pointerId: 7 })); return setTimeout(poll, 150); }
    setTimeout(poll, m !== -9999 && m > 14 ? Math.min(30, m - 8) : 1);
  })();
}), to, ms);
const warmState = p => p.evaluate(() => { const L = window.__hiPlay, i = L.state().info, f = L.flyInfo(); return { warm: L.state().warm, plates: i.plates, held: i.held, env: i.env, programs: i.programs, uploads: i.uploads, warmed: i.warmed, models: f.models || [], bloom: i.bloom }; });

// ---- 1 · 2: THE PRE-WARM — nothing is set up for the first time after the first tap
for (const [name, q, to, look] of [['?floor=1 → floor ' + (QUICK ? 50 : 120), '?floor=1&trace=1&seed=warm1&look=night', QUICK ? 50 : 120, 'night'], ['?floor=80 → floor 115 (by day)', '?floor=80&trace=1&seed=warm2&look=day', 115, 'day']]) {
  const t = await open(q), { p } = t;
  const warm = await waitFor(p, 'window.__hiPlay.state().warm', 20000);
  const w0 = await warmState(p), before = t.reqs.length;
  ok(warm && w0.plates.length === 5 && w0.env && w0.warmed >= 1, `${name}: BEFORE THE FIRST TAP the look's FIVE plates (${w0.plates.join(' ')}) + its reflection map are on the GPU, the warm frame drawn (${w0.programs} programs${w0.bloom ? ' — the bloom\'s too' : ''})`);
  ok(['blackbird', 'f22', 'mothership', 'ufo'].every(k => w0.models.includes(k)) && t.reqs.some(u => /flyers\.js/.test(u)) && ['blackbird.glb', 'f22.glb', 'ufo.glb'].every(f => t.reqs.some(u => u.includes(f))), `${name}: … and EVERY FLYER — the lazy module + the Blackbird, the F-22, the UFO, THE MOTHERSHIP's hull (${w0.models.join(' ')})`);
  await sleep(400);
  await t.tap();
  ok(await waitFor(p, 'window.__hiPlay.phase() === 1', 5000), `${name}: START → the run is live${/floor=80/.test(q) ? ' from floor 80' : ''}`);
  const reached = await botTo(p, to);
  const w1 = await warmState(p), tr = await p.evaluate(() => window.__hiPlay.trace()), hit = await p.evaluate(() => window.__hiPlay.hitches()), played = await p.evaluate(() => (window.__hiPlay.flyInfo().played || []).slice()), late = t.reqs.slice(before).filter(u => !/favicon/.test(u));
  ok(reached >= to, `${name}: the bot climbed to floor ${reached} (${tr.frames} live frames)`);
  ok(tr.setup.compile === 0 && tr.setup.upload === 0 && tr.setup.decode === 0, `${name}: THE TRACE — SET-UP AFTER START: compile ${tr.setup.compile} · upload ${tr.setup.upload} · decode ${tr.setup.decode} (all 0: nothing was built, uploaded or decoded for the first time after the first tap)`);
  ok(w1.programs === w0.programs && w1.uploads === w0.uploads && w1.warmed === w0.warmed, `${name}: the scene's own counts did not move — ${w1.programs} programs, ${w1.uploads} pictures uploaded, ${w1.warmed} warm frame${w1.warmed === 1 ? '' : 's'}`);
  ok((hit.by.plate || 0) === 0 && (hit.by.compile || 0) === 0, `${name}: no hitch named plate / compile (${JSON.stringify(hit.by)})`);
  ok(late.filter(u => /\.(webp|png|glb)(\?|$)|flyers\.js/.test(u)).length === 0, `${name}: no picture, no model, no module fetched after the first tap (${late.map(u => u.split('/').pop()).join(' ') || 'nothing at all'})`);
  ok(to < 86 || played.some(x => /ufo/.test(x)), `${name}: the flyers flew in it (${played.join(' ') || '—'})`);
  if (/floor=80/.test(q)) {
    // THE DETECTOR WORKS: the other look's pictures forced in mid-run ARE counted
    await p.evaluate(lk => window.__hiPlay.setLook(lk), look === 'day' ? 'night' : 'day');
    await botTo(p, reached + 4, 20000); await sleep(600);
    const tr2 = await p.evaluate(() => window.__hiPlay.trace());
    ok(tr2.setup.upload >= 1 && tr2.setup.at[1] >= reached, `${name}: (the detector works) a look switch forced mid-run uploads the other look's pictures — counted: upload ${tr2.setup.upload} @F${tr2.setup.at[1]}`);
  }
  // the fuse ends the run → the panel's own line
  await waitFor(p, 'window.__hiPlay.state().shown', 15000); await sleep(500);
  const panel = await p.evaluate(() => (document.querySelector('.hi-trace') || {}).textContent || '');
  ok(/^TRACE · 5 WORST FRAMES OF \d+/.test(panel) && (/floor=80/.test(q) ? /SET-UP AFTER START: upload \d+ @F\d+/.test(panel) : /SET-UP AFTER START: none$/.test(panel)), `${name}: the end card's panel ends "${panel.split('\n').pop()}"`);
  if (OUT) await p.screenshot({ path: join(OUT, `prewarm-${look}-${/floor=80/.test(q) ? 'floor80' : 'floor1'}.png`) });
  ok(t.errs.length === 0, `${name}: no page error (${t.errs.join(' | ')})`);
  await t.close();
}

// ---- 3: `?lean=1` — every DOM / CSS effect over the canvas is off in a live run; a plain run keeps its look
{
  const css = p => p.evaluate(() => { const q = s => document.querySelector(s), cs = s => getComputedStyle(q(s)); return { lean: q('.hi-stage').classList.contains('is-lean'), num: cs('.hi-num').textShadow, band: cs('.hi-band').textShadow, call: cs('.hi-call').textShadow, tagTr: cs('.hi-tag').transitionDuration, hudTr: cs('.hi-hud').transitionDuration, anims: document.getAnimations().filter(a => a.playState === 'running').length, callT: q('.hi-call').textContent, note: q('.hi-note').textContent }; });
  for (const lean of [true, false]) {
    const t = await open(`?seed=lean1&trace=1&look=night${lean ? '&lean=1' : ''}`, "try { localStorage.setItem('hi:play:best', '40'); } catch {}"), { p } = t;
    await waitFor(p, 'window.__hiPlay.state().warm', 20000); await sleep(300);
    await t.tap();
    await waitFor(p, 'window.__hiPlay.phase() === 1', 5000);
    await botTo(p, 4, 30000); await sleep(140);
    const c = await css(p);
    if (lean) ok(c.lean && c.num === 'none' && c.band === 'none' && c.call === 'none' && parseFloat(c.tagTr) === 0 && parseFloat(c.hudTr) === 0 && c.anims === 0 && /PERFECT/.test(c.callT) && /LEAN/.test(c.note), `?lean=1, in a live run: no text-shadow on the number / the band / the announcer, no transition on the tag / the HUD, ${c.anims} running animations (the lane still says "${c.callT}") — the note: "${c.note}"`);
    else ok(!c.lean && c.num !== 'none' && c.call !== 'none' && parseFloat(c.tagTr) > 0 && c.anims >= 1 && !/LEAN/.test(c.note), `a plain run keeps its look: the number's + the announcer's glows, the tag's ride, the announcer's motion (${c.anims} running)`);
    await waitFor(p, 'window.__hiPlay.state().shown', 15000); await sleep(400);
    const first = await p.evaluate(() => ((document.querySelector('.hi-trace') || {}).textContent || '').split('\n')[0]);
    ok(lean ? /^TRACE · LEAN · 5 WORST FRAMES/.test(first) : /^TRACE · 5 WORST FRAMES/.test(first), `${lean ? '?lean=1' : 'plain'}: the panel's title — "${first}"`);
    if (lean) { const e = await p.evaluate(() => getComputedStyle(document.querySelector('.hi-ec-n')).textShadow); ok(e !== 'none', 'LEAN is for the LIVE run only: the end card keeps its glows'); if (OUT) await p.screenshot({ path: join(OUT, 'lean-end.png') }); }
    ok(t.errs.length === 0, `${lean ? '?lean=1' : 'plain'}: no page error (${t.errs.join(' | ')})`);
    await t.close();
  }
}

// ---- 4: `?floor=N` — the floors the START tap builds count toward NOTHING
{
  const t = await open('?floor=20&seed=skip1&look=night', "try { localStorage.setItem('hi:play:best', '22'); } catch {}"), { p } = t;
  await waitFor(p, 'window.__hiPlay.state().warm', 20000); await sleep(300);
  await t.tap();
  await waitFor(p, 'window.__hiPlay.phase() === 1 && window.__hiPlay.state().floor >= 20', 5000);
  await waitFor(p, '!window.__hiPlay.state().tag', 1500);   // (the welcome's own BEST tag goes with the landing's deferred tag write — three frames on)
  const s0 = await p.evaluate(() => { const s = window.__hiPlay.state(); return { floor: s.floor, perfects: s.perfects, streak: s.streak, shownP: s.shownPerfects, shownS: s.shownStreak, tag: s.tag }; });
  ok(s0.floor === 20 && s0.perfects === 20 && s0.shownP === 0 && s0.shownS === 0 && !s0.tag, `?floor=20: the run stands on floor 20 — the engine played 20 perfect drops, the page counts ${s0.shownP} perfects, a streak of ${s0.shownS}; no gold BEST tag (a shortcut run never compares a best)`);
  const calls = [];
  for (let i = 1; i <= 4; i++) { await botTo(p, 20 + i, 20000); await sleep(120); calls.push(await p.evaluate(() => document.querySelector('.hi-call').textContent)); }
  ok(calls.join('|') === 'PERFECT|PERFECT ×2|PERFECT ×3|PERFECT ×4', `the announcer counts the streak PLAYED — ${calls.join(' · ')} (never ×21 …), though floor 23 passed the stored best of 22 with no NEW BEST`);
  const mid = await p.evaluate(() => ({ gold: document.querySelector('.hi-stage').classList.contains('is-gold'), tape: window.__hiPlay.state().tapeOn }));
  ok(!mid.gold && !mid.tape, 'no gold number, no gold tape: YOUR BEST is never compared in a shortcut run');
  await waitFor(p, 'window.__hiPlay.state().shown', 15000); await sleep(400);
  const e = await p.evaluate(() => ({ line: document.querySelector('.hi-ec-line').textContent, best: document.querySelector('.hi-ec-best').textContent, floor: document.querySelector('.hi-ec-n').getAttribute('aria-label'), stored: localStorage.getItem('hi:play:best'), check: document.querySelector('.hi-check').textContent }));
  ok(e.floor === '24' && e.line === '4 PERFECTS · BEST STREAK 4' && e.best === 'YOUR BEST · 22' && e.stored === '22' && e.check === 'REPLAY = LIVE ✓', `the end card: floor ${e.floor} — "${e.line}" (the 4 that were PLAYED) — "${e.best}" (never set: stored ${e.stored}) — ${e.check}`);
  ok(t.errs.length === 0, `?floor=20: no page error (${t.errs.join(' | ')})`);
  await t.close();
}

await b.close();
console.log(`\n${checks - fails.length}/${checks} checks passed${fails.length ? `\nFAILED:\n  ${fails.join('\n  ')}` : ''}`);
process.exit(fails.length ? 1 : 0);
