// THE VAULT 1A — the `vault` group (THE CARD LAB's look page + THE EFFECT LIBRARY's rules; docs/vault.md):
//   · the lab: all 10 items (the 8 strips + the 2 test emblems), each strip a SLOT in ONE shared canvas (never a canvas per strip),
//     APPROVE / FIX + a note / CUT mark + read back
//   · A FULL LOBBY of 8 LEGENDARY strips at 4× CPU on the REAL compositor — 60 fps (the owner's bar), its effect tier held
//   · only ON-SCREEN slots draw; a hidden page draws nothing; REDUCED MOTION = each strip's still frame, drawn once
//   · BY FINGER (HOTFIX Nov 3 — the owner's iPhone: /lab wouldn't scroll; base.css's one-screen lock carried into the lab and VAULT 1A's
//     checks only ever moved it with scrollIntoView, which works on a locked page): real touch swipes (Chromium's mobile touch path,
//     402 × 874) scroll the lab top → bottom — starting ON a strip + its buttons — then A FULL LOBBY → 8 LEGENDARIES, a real tap still
//     marks (APPROVE → stored → tap again → cleared); the membership card's key section + the bring-your-card sheet scroll by finger too.
//     The same lab in WebKit at iPhone size (isMobile + hasTouch; Playwright's mobile WebKit has taps but no drag or wheel, so the page
//     scrolls by WebKit's own user scroll — PageDown, blocked by the same lock — and marks by a real tap). WebKit needs Playwright 1.56
//     (WK_PLAYWRIGHT, default ~/wk on the mini PC): skipped with a warning where it isn't installed (the cloud).
// THE VAULT 2B adds: the lab's 50 cards with the 2 DEV cards FIRST + their full cards (49), the EMBLEMS tab's 46 items in all 15 finishes, the
//   GLOWS tab's 14 glows, DRESS YOUR CARD (the profile's one panel + the dress screen's tabs + tier-edged tiles, the widest name whole) and
//   DRESS YOUR CARD BY FINGER (real taps wear an emblem · a glow · a card on the pinned strip at once, VIEW FULL ›, a long-press → the full card).
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { BASE, ok, okT, sleep, ev, waitFor, G, launch, launchReal, closeReal, OUT, SHOTS, log, checks, warnings, BROWSER } from './kit.mjs';
import puppeteer from '../kit/puppeteer.mjs';

async function page(qs, { real = false, cpu = 0, view = [402, 874], dpr = 3 } = {}) {
  const ctx = await (await (real ? launchReal() : launch())).createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport({ width: view[0], height: view[1], deviceScaleFactor: dpr, isMobile: true, hasTouch: true });
  if (cpu > 1) { const cd = await p.target().createCDPSession(); await cd.send('Emulation.setCPUThrottlingRate', { rate: cpu }); }
  await p.goto(`${BASE}/tests/integration/vault-preview.html?${qs}`);
  await waitFor(p, '!!(document.body.dataset.ready && window.__lab)', 'the lab', 30000);
  return { ctx, p };
}
const frames = (p, n = 180) => ev(p, `new Promise(res => { const t = []; let last = 0; const f = x => { if (last) t.push(x - last); last = x; if (t.length < ${n}) requestAnimationFrame(f); else res(t); }; requestAnimationFrame(f); })`);

G('vault', async () => {
  // THE LAB: the strips view
  { const { ctx, p } = await page('view=strips');
    await sleep(1200);
    const s = await ev(p, `(() => ({ items: document.querySelectorAll('.vl-item').length, strips: document.querySelectorAll('.vl-strip').length, canvases: document.querySelectorAll('canvas.fx-canvas').length, slots: window.__lab.stats.slots, names: [...document.querySelectorAll('.vl-item-h b')].map(b => b.textContent) }))()`);
    ok(s.items === 50 && s.strips === 50 && s.canvases === 1 && /^116 · /.test(s.names[0]) && /^92 · /.test(s.names[2]), `THE CARD LAB: 50 cards (2B's 2 DEV cards FIRST, 2A's 3 held cards, 1C's 8 sighting cards, 1A's 8, 1B's 8, 1C's held-back 21 — ${s.strips} strips on the page; the emblems in their own tab) on ONE shared effect canvas (${s.canvases}) — first: ${s.names[0]}`);
    await ev(p, `document.querySelector('.vl-item[data-id="card-smoke"] .vl-mark[data-m="approve"]').click()`);
    await ev(p, `document.querySelector('.vl-item[data-id="card-prism"] .vl-mark[data-m="fix"]').click()`);
    await sleep(200);
    await p.type('.vl-item[data-id="card-prism"] .vl-note', 'More sheen');
    await ev(p, `[...document.querySelectorAll('.vl-item[data-id="card-prism"] .vl-mark')].find(b => b.textContent === 'SAVE NOTE').click()`);
    await ev(p, `document.querySelector('.vl-item[data-id="card-glitter"] .vl-mark[data-m="cut"]').click()`);
    await sleep(300);
    const m = await ev(p, `({ m: window.__lab.marks, on: [...document.querySelectorAll('.vl-mark.is-on')].map(b => b.closest('.vl-item').dataset.id + ':' + b.dataset.m) })`);
    ok(m.m['card-smoke'].m === 'approve' && m.m['card-prism'].m === 'fix' && m.m['card-prism'].note === 'More sheen' && m.m['card-glitter'].m === 'cut' && m.on.length === 3,
      `THE CARD LAB: APPROVE · FIX + a note · CUT marked + shown (${m.on.join(', ')})`);
    if (SHOTS) await p.screenshot({ path: `${OUT}vault-lab-402x874.png` });
    await ctx.close(); }
  // A FULL LOBBY OF 8 LEGENDARIES — 4× CPU, the real compositor (a phone's GPU path): 60 fps
  { const { ctx, p } = await page('view=lobby&bare=1&mix=legend', { real: true, cpu: 4, dpr: 3 });
    await sleep(2500);
    const t = await frames(p, 240); t.sort((a, b) => a - b);
    const st = await ev(p, 'window.__lab.stats');
    const med = t[t.length >> 1], p95 = t[Math.floor(t.length * 0.95)], slow = t.filter(x => x > 20).length;
    okT(med < 17.5 && slow < t.length * 0.06 && st.slots === 8, `THE VAULT: A FULL LOBBY of 8 LEGENDARY strips at 4× CPU — median ${med.toFixed(1)} ms, p95 ${p95.toFixed(1)}, ${slow}/${t.length} slow frames; ${st.slots} drawn on one canvas, effect tier ${st.tier}, draw ${st.ms} ms`);
    await ctx.close(); await closeReal(); }
  // ONLY ON SCREEN: a slot scrolled away isn't drawn; a hidden page draws nothing
  { const { ctx, p } = await page('view=lobby&mix=legend', { view: [402, 600], dpr: 2 });
    await sleep(1200);
    const a = await ev(p, 'window.__lab.stats.slots');
    await ev(p, `document.querySelector('.vl-lobby').scrollIntoView({ block: 'start' })`); await sleep(800);
    const b = await ev(p, 'window.__lab.stats.slots');
    const f0 = await ev(p, 'window.__lab.stats.frames');
    await ev(p, `(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); })()`);
    await sleep(900);
    const f1 = await ev(p, 'window.__lab.stats.frames'); await sleep(900); const f2 = await ev(p, 'window.__lab.stats.frames');
    ok(a < 8 && b > a && f2 - f1 <= 1, `THE EFFECT LIBRARY draws only what's ON SCREEN: ${a} of 8 legendaries drawn at the top of a short page, ${b} once scrolled to them; hidden → ${f2 - f1} frames (it stops)`);
    void f0; await ctx.close(); }
  // REDUCED MOTION: each strip's still frame, drawn once — the canvas stops; the emblems still
  // (2A: the lobby's guests wear the samples' emblems + glows — every layer + every glow piece still)
  { const { ctx, p } = await page('view=lobby&bare=1&mix=samples&still=1&wear=emb,glow', { dpr: 2 });
    await sleep(1500);
    const f1 = await ev(p, 'window.__lab.stats.frames'); await sleep(1200); const f2 = await ev(p, 'window.__lab.stats.frames');
    const px = await ev(p, `import('/js/fx/renderer.js').then(m => m.fxProbe())`);
    const anim = await ev(p, `(() => { const a = [...document.querySelectorAll('.vl-strip .ve-l, .vl-strip .vg > i')].map(x => getComputedStyle(x).animationName); return a.length + ' layers, ' + a.filter(n => n !== 'none').length + ' moving'; })()`);
    ok(f2 - f1 <= 1 && px > 500 && /^\d{2,} layers, 0 moving$/.test(anim), `REDUCED MOTION: the strips' still frames drawn once (${px} lit samples), the canvas stops (${f2 - f1} frames in 1.2 s), the emblems still (${anim})`);
    await ctx.close(); }
});

// ---- BY FINGER (HOTFIX Nov 3) -----------------------------------------------------------------------------------------------
const center = (p, sel) => ev(p, `(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)]; })()`);
// one finger, a real drag (touchstart → 12 moves → touchend: the browser's own touch scrolling, never a wheel or a scrollTo)
async function swipe(p, x, y0, dy) { await p.touchscreen.touchStart(x, y0); for (let i = 1; i <= 12; i++) await p.touchscreen.touchMove(x, Math.round(y0 - (i * dy) / 12)); await p.touchscreen.touchEnd(); await sleep(450); }
// swipe up until the scroller reaches its end (or stops moving); the scroller's { top, max } before + after
async function swipeToEnd(p, x, y0, dy, read, n = 14) {
  let s = await read(), moved = 0; const first = s;
  for (let i = 0; i < n && s.top < s.max - 1; i++) { await swipe(p, x, y0, dy); const t = await read(); if (t.top <= s.top) break; moved += t.top - s.top; s = t; }
  return { first, last: s, moved };
}
const pageScroll = p => () => ev(p, '({ top: Math.round(scrollY), max: document.scrollingElement.scrollHeight - innerHeight })');
async function fingerPage(url, view = [402, 874]) {
  const ctx = await (await launch()).createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport({ width: view[0], height: view[1], deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.goto(`${BASE}${url}`);
  return { ctx, p };
}
const markOf = (p, id, sel) => ev(p, `({ m: (window.__lab.marks[${JSON.stringify(id)}] || {}).m || null, on: document.querySelector(${JSON.stringify(sel)}).classList.contains('is-on') })`);

G('vault', async () => {
  // the real /lab carries the classes the unlock hangs on (the preview mounts the same views under the same classes)
  { const html = await (await fetch(`${BASE}/lab.html`)).text();
    ok(/<html[^>]*class="[^"]*\bvl-lab-html\b/.test(html) && /<body[^>]*class="[^"]*\bvl-lab-on\b/.test(html), 'BY FINGER: /lab carries <html class="vl-lab-html"> + <body class="vl-lab-on"> (what vault.css unlocks the scroll on)'); }

  // THE LAB at iPhone size: swipe it top → bottom, the swipes starting ON a strip / its mark buttons
  { const { ctx, p } = await fingerPage('/tests/integration/vault-preview.html?view=strips');
    await waitFor(p, '!!(document.body.dataset.ready && window.__lab)', 'the lab', 30000);
    const lock = await ev(p, `(() => { const h = getComputedStyle(document.documentElement), b = getComputedStyle(document.body); return h.overflowY + ' / ' + b.overflowY; })()`);
    const r = await swipeToEnd(p, 200, 760, 560, pageScroll(p));
    ok(r.first.max > 1200 && r.last.top >= r.last.max - 2, `BY FINGER: THE CARD LAB scrolls top → bottom by touch swipes at 402 × 874 — ${r.moved} of ${r.first.max} px (html / body overflow ${lock})`);
    // a real TAP on a mark: APPROVE → stored; the same tap again → cleared (a tap marks, a swipe scrolls)
    const sel = '.vl-item[data-id="card-smoke"] .vl-mark[data-m="approve"]';
    await ev(p, `document.querySelector(${JSON.stringify(sel)}).scrollIntoView({ block: 'center' })`); await sleep(300);
    let c = await center(p, sel); await p.touchscreen.tap(c[0], c[1]); await sleep(350);
    const m1 = await markOf(p, 'card-smoke', sel);
    c = await center(p, sel); await p.touchscreen.tap(c[0], c[1]); await sleep(350);
    const m2 = await markOf(p, 'card-smoke', sel);
    ok(m1.m === 'approve' && m1.on && m2.m === null && !m2.on, `BY FINGER: a TAP still marks — APPROVE → stored (${m1.m}, lit ${m1.on}), tapped again → cleared (${m2.m}, lit ${m2.on})`);
    // A FULL LOBBY → 8 LEGENDARIES by taps (the tabs are sticky), then swipe it to the bottom
    c = await center(p, '.vl-tab[data-v="lobby"]'); await p.touchscreen.tap(c[0], c[1]);
    await waitFor(p, `!!document.querySelector('.vl-mix .vl-tab[data-k="legend"]')`, 'the lobby view');
    c = await center(p, '.vl-mix .vl-tab[data-k="legend"]'); await p.touchscreen.tap(c[0], c[1]);
    await waitFor(p, `window.__lab.mix === 'legend' && document.querySelectorAll('.vl-lobby .vl-strip').length === 8`, 'the 8 legendaries');
    await sleep(600);
    const l = await swipeToEnd(p, 200, 760, 560, pageScroll(p));
    const box = await ev(p, `Math.round(document.querySelector('.vl-lobby').getBoundingClientRect().bottom) <= innerHeight`);
    ok(l.first.max > 0 && l.last.top >= l.last.max - 2 && box, `BY FINGER: A FULL LOBBY → 8 LEGENDARIES (by taps) scrolls to its bottom by swipes — ${l.moved} of ${l.first.max} px, the lobby's foot on screen (${box})`);
    if (SHOTS) await p.screenshot({ path: `${OUT}vault-finger-lobby-402x874.png` });
    await ctx.close(); }

  // THE MEMBERSHIP CARD (inside the app's locked screen; its own scroller) — swipe down to the key section
  { const { ctx, p } = await fingerPage('/tests/integration/title-preview.html?guest=1');
    await waitFor(p, '!!window.__preview', 'the title preview', 40000);
    await ev(p, `(async () => { if (![...document.styleSheets].some(s => /board\\.css/.test(s.href || ''))) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/css/board.css'; document.head.append(l); await new Promise(r => { l.onload = r; l.onerror = r; }); } (await import('/js/screens/profile.js')).openCard(); })()`);
    await waitFor(p, `!!document.querySelector('.pf-overlay .pf-scroll .byc-else-btn')`, 'the membership card');
    await sleep(700);
    const read = () => ev(p, `(() => { const s = document.querySelector('.pf-overlay .pf-scroll'); return { top: Math.round(s.scrollTop), max: s.scrollHeight - s.clientHeight }; })()`);
    const r = await swipeToEnd(p, 200, 760, 520, read);
    const key = await ev(p, `(() => { const r = document.querySelector('.pf-overlay .byc-else-btn').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; })()`);
    const bo = await ev(p, 'getComputedStyle(document.body).overflowY');
    ok(r.first.max > 0 && r.last.top >= r.last.max - 2 && key, `BY FINGER: the membership card scrolls by swipes to its key section — ${r.moved} of ${r.first.max} px, USE THIS CARD ON ANOTHER DEVICE on screen (${key}); the app's own lock untouched (body overflow ${bo})`);
    await ctx.close(); }

  // BRING YOUR CARD on a short screen (a keyboard up / a small phone): the sheet scrolls inside by finger
  { const { ctx, p } = await fingerPage('/tests/integration/title-preview.html?guest=1', [402, 400]);
    await waitFor(p, '!!window.__preview', 'the title preview', 40000);
    await ev(p, `import('/js/profile/bring.js').then(B => { B.openBring({ lead: true }); return true; })`);
    await waitFor(p, `!!document.querySelector('.byc-bring .byc-help')`, 'the bring sheet');
    await sleep(800);
    const read = () => ev(p, `(() => { const s = document.querySelector('.byc-bring .sheet'); return { top: Math.round(s.scrollTop), max: s.scrollHeight - s.clientHeight }; })()`);
    const r = await swipeToEnd(p, 200, 360, 260, read);
    const nw = await ev(p, `!document.querySelector('.byc-bring .byc-new') && document.querySelector('.byc-bring .byc-help').getBoundingClientRect().bottom <= innerHeight + 1`);
    ok(r.first.max > 0 && r.last.top >= r.last.max - 2 && nw, `BY FINGER: BRING YOUR CARD on a 402 × 400 screen scrolls inside by swipes — ${r.moved} of ${r.first.max} px, its last line reachable + no I'M NEW HERE (THE VAULT 2A) (${nw})`);
    await ctx.close(); }

  // THE SAME LAB IN WEBKIT at iPhone size (Safari's engine)
  { const pw = process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs');
    const what = 'BY FINGER in WebKit: the lab at 402 × 874 (isMobile + hasTouch) scrolls + marks by a tap';
    if (!existsSync(pw)) { checks.push({ what, ok: true, warn: 'skipped' }); warnings.push(`[skipped] ${what} — no Playwright 1.56 here (WK_PLAYWRIGHT)`); log('SKIP', what); return; }
    const { webkit } = await import(pathToFileURL(pw).href);
    const b = await webkit.launch();
    try {
      const ctx = await b.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
      const p = await ctx.newPage();
      const E = js => p.evaluate(js);
      const scrollDown = async (max, n) => { for (let i = 0; i < n && (await E('Math.round(scrollY)')) < max - 1; i++) { await p.keyboard.press('PageDown'); await p.waitForTimeout(250); } return E('Math.round(scrollY)'); };
      await p.goto(`${BASE}/tests/integration/vault-preview.html?view=strips`);
      await p.waitForFunction('!!(document.body.dataset.ready && window.__lab)', null, { timeout: 60000 });
      const max = await E('document.scrollingElement.scrollHeight - innerHeight');
      await p.touchscreen.tap(392, 400);   // (the empty gutter: focus the page, nothing marked)
      const y = await scrollDown(max, 40);   // (VAULT 1C: the lab is ~12,000 px now — PageDown until the foot, ≤ 40 presses)
      ok(max > 1200 && y >= max - 2, `BY FINGER in WebKit: THE CARD LAB at 402 × 874 scrolls top → bottom by WebKit's own user scroll — ${y} of ${max} px (the old lock left 0 px to scroll)`);
      const sel = '.vl-item[data-id="card-frostbite"] .vl-mark[data-m="approve"]';
      const tapSel = async () => { await p.locator(sel).scrollIntoViewIfNeeded(); const bb = await p.locator(sel).boundingBox(); await p.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(400); return E(`(window.__lab.marks['card-frostbite'] || {}).m || null`); };
      const a = await tapSel(), c = await tapSel();
      await p.locator('.vl-tab[data-v="lobby"]').tap(); await p.locator('.vl-mix .vl-tab[data-k="legend"]').tap();
      await p.waitForFunction(`window.__lab.mix === 'legend' && document.querySelectorAll('.vl-lobby .vl-strip').length === 8`, null, { timeout: 20000 });
      await E('scrollTo(0, 0)');
      const lmax = await E('document.scrollingElement.scrollHeight - innerHeight');
      await p.touchscreen.tap(392, 600);
      const ly = await scrollDown(lmax, 6);
      ok(a === 'approve' && c === null && lmax > 0 && ly >= lmax - 2, `BY FINGER in WebKit: a tap marks APPROVE (${a}) → tapped again cleared (${c}); A FULL LOBBY → 8 LEGENDARIES by taps scrolls to its bottom (${ly} of ${lmax} px)`);
      if (SHOTS) await p.screenshot({ path: `${OUT}vault-finger-webkit-402x874.png` });
      await ctx.close();
    } finally { await b.close(); }
  }
});

// ---- THE VAULT 1B ---------------------------------------------------------------------------------------------------------------
// SPEED FIRST (the effects on the GPU — js/fx/gl.js): 8 legendaries + the 8 samples at 4× CPU at the FULL tier (3×), scroll-pause, the
// diagnostics row; THE FULL CARDS tab; SAVED ✓; THE VAULT PICKER (real strips, WEARING, one canvas); THE NAME NEVER CUTS OFF (the widest
// twelve at 390); every bottom sheet floats (its whole border above the bottom); THE PROGRAM's switch; THE NO-TAP SIGHTING in WebKit
async function anyPage(url, { view = [402, 874], dpr = 2, real = false, cpu = 0 } = {}) {
  const ctx = await (await (real ? launchReal() : launch())).createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport({ width: view[0], height: view[1], deviceScaleFactor: dpr, isMobile: true, hasTouch: true });
  if (cpu > 1) { const cd = await p.target().createCDPSession(); await cd.send('Emulation.setCPUThrottlingRate', { rate: cpu }); }
  await p.goto(`${BASE}${url}`);
  return { ctx, p };
}
G('vault', async () => {
  // THE GPU PATH at the FULL tier: 8 legendaries, then the 8 samples, 4× CPU, the real compositor, 3× — every frame on time
  // (its own browser: the real compositor + the GPU for WebGL — headless Chromium's default GL is a software one, which a phone never runs)
  // (THE VAULT 1C: + THE 8 SIGHTINGS + THE NEW 21's lobby mix — every new card at the same bar)
  for (const mix of ['samples', 'legend', 'sightings', 'held']) {
    const gpuB = await puppeteer.launch({ executablePath: BROWSER, headless: 'new', realCompositor: true, args: ['--enable-gpu', '--mute-audio', '--no-sandbox'] });   // (a fresh one per mix, like THE VAULT BENCH)
    const ctx = await gpuB.createBrowserContext(), p = await ctx.newPage();
    await p.setViewport({ width: 402, height: 874, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    await p.goto(`${BASE}/tests/integration/vault-preview.html?view=lobby&mix=${mix}&bare=1&tier=2`);
    await waitFor(p, '!!(document.body.dataset.ready && window.__lab)', 'the lab', 30000);
    { const cd = await p.target().createCDPSession(); await cd.send('Emulation.setCPUThrottlingRate', { rate: 4 }); }
    await sleep(1500);
    const t = await frames(p, 180);
    const st = await ev(p, '({ ...window.__lab.stats })');
    const s = [...t].sort((a, b) => a - b), med = s[90], slow = t.filter(x => x > 20).length, fps = 1000 / (t.reduce((a, b) => a + b, 0) / t.length);
    // (4× CPU on the mini PC is the stress case — an iPhone 16 Pro's CPU is well ahead of it: ≥ 54 fps on average + a median frame ≤ 18 ms
    //  there, at the FULL tier, is the bar; the busiest mix — glitter + smoke + the bulbs + the frost's clip — sits ~56)
    okT(st.gpu && st.tier === 2 && st.dpr >= 2.9 && fps >= 54 && med <= 18, `SPEED (the GPU path): A FULL LOBBY of ${({ legend: '8 LEGENDARIES', samples: 'THE 8 SAMPLES', sightings: 'THE 8 SIGHTING CARDS', held: 'THE NEW 21 (8 of them)' })[mix]} at 4× CPU — ${fps.toFixed(1)} fps, median ${med.toFixed(1)} ms, ${slow}/180 slow, ${st.gpu ? 'GPU' : '2D'} at tier ${st.tier} ${st.dpr}× (${st.draws} draws, ${st.ms} ms of script)`);
    await ctx.close(); await gpuB.close();
  }
  // SCROLL-PAUSE + THE DIAGNOSTICS ROW: a scroll holds the effects (no frames), they resume after; &diag= sets the switches; 7 of them
  { const { ctx, p } = await page('view=lobby&mix=legend&diag=nolaser,noglow');
    await sleep(900);
    // (2A: the lab's header grew — two rows of tabs + the wear row: the lobby into view first, an off-screen slot never draws; all 8 on
    //  screen draw slower on the cloud's software GL, so 'resumed' = frames ticking again (≥ 3 in 500 ms) — the speed has its own checks)
    await ev(p, "document.querySelector('.vl-lobby').scrollIntoView({ block: 'start' })"); await sleep(900);
    const d = await ev(p, `({ n: document.querySelectorAll('.vl-dg[data-k]').length, diag: window.__lab.diag, off: [...document.querySelectorAll('.vl-dg.is-off')].map(b => b.dataset.k), glow: document.documentElement.classList.contains('vl-diag-noglow') })`);
    const held = await ev(p, `new Promise(res => { const f0 = window.__lab.stats.frames; let n = 0; const tick = () => { document.dispatchEvent(new Event('scroll')); if (++n < 12) setTimeout(tick, 50); else res({ during: window.__lab.stats.frames - f0, scrolling: window.__lab.stats.scrolling }); }; tick(); })`);
    await sleep(700);
    const f1 = await ev(p, 'window.__lab.stats.frames'); await sleep(500); const f2 = await ev(p, 'window.__lab.stats.frames');
    ok(d.n === 7 && d.off.sort().join() === 'glow,laser' && d.glow && held.during <= 2 && held.scrolling && f2 - f1 >= 3, `DIAGNOSTICS + SCROLL-PAUSE: 7 switches (${d.off.join(' + ')} off from &diag=, the page's glows off: ${d.glow}); a scroll held the effects (${held.during} frames in 600 ms) — they resumed (${f2 - f1} frames in 500 ms)`);
    await ctx.close(); }
  // THE FULL CARDS tab: 47 full cards (2A's 3 held + 1C's 8 sighting cards + 1A's 8 + 1B's 7 + 1C's 21) on ONE canvas; a mark flashes SAVED ✓
  { const { ctx, p } = await page('view=full');
    await sleep(900);
    const f = await ev(p, `({ cards: document.querySelectorAll('.vl-fc').length, canvases: document.querySelectorAll('canvas.fx-canvas').length, sight: !!document.querySelector('.vl-fc.is-sight .vl-fc-title b') })`);
    await ev(p, `document.querySelector('.vl-item[data-id="full-card-inferno"] .vl-mark[data-m="approve"]').click()`);
    const saved = await waitFor(p, `!!document.querySelector('.vl-item[data-id="full-card-inferno"] .vl-saved')`, 'SAVED', 3000).then(() => true).catch(() => false);
    const txt = saved ? await ev(p, `document.querySelector('.vl-item[data-id="full-card-inferno"] .vl-saved').textContent`) : '';
    ok(f.cards === 49 && f.canvases === 1 && f.sight && saved && /SAVED ✓/.test(txt), `THE FULL CARDS: ${f.cards} full cards on ${f.canvases} shared canvas (the sighting's title in neon: ${f.sight}); a mark flashes "${txt}"`);
    await ctx.close(); }
  // THE VAULT 1C — THE SIGHTING'S SCENE (the reveal's pair + the album's no-photo tile): once its full card is APPROVED the placeholder becomes
  // the card's real scene (js/vault/full.js#upgradeScene) — all 9 sightings, each its own canvas drawn; unapproved → the placeholder stays
  { const { ctx, p } = await anyPage('/tests/integration/card-review.html?cards=card-sg-ufo&strips=0&full=0&labmarks=all', { view: [402, 874] });
    await waitFor(p, '!!document.body.dataset.ready', 'the review page', 30000);
    const r = await ev(p, `(async () => {
      const V = await import('/js/vault/full.js'), out = [];
      for (const id of ['card-sg-ufo', 'card-sg-tr3b', 'card-sg-blackbird', 'card-sg-f22', 'card-sg-ghostship', 'card-sg-aurora', 'card-sg-fireball', 'card-sg-skull', 'card-sg-btc']) {
        const ph = document.createElement('div'); ph.className = 'sg-card'; ph.style.width = '170px'; document.body.append(ph);
        const got = await V.upgradeScene(ph, id, { label: 'test' });
        out.push(!!(got && got.el.querySelector('.vl-fc-scene[data-card="' + id + '"]') && got.el.querySelector('canvas.fx-canvas') && !ph.isConnected));
      }
      const ph = document.createElement('div'); document.body.append(ph);
      const none = await V.upgradeScene(ph, 'card-gilded', {});
      return { ok: out, plain: none === null && ph.isConnected };
    })()`);
    ok(r.ok.every(Boolean) && r.plain, `THE SIGHTING'S SCENE: the 9 sighting cards' approved scenes replace the reveal's / the album's placeholder (${r.ok.filter(Boolean).length}/9, each on its canvas); a card with no scene keeps its placeholder (${r.plain})`);
    await ctx.close(); }
  // THE VAULT 2B — DRESS YOUR CARD (the owner's approved mock) + THE NAME NEVER CUTS OFF (the widest twelve at 390): the profile's ONE panel
  // (the strip, the worn names, the big button, YOUR COLLECTION — no long lists); the dress screen: the pinned strip, 4 tabs, a tile per
  // owned card (tier-edged, one ticked), the name whole on the pinned strip + every card
  { const { ctx, p } = await anyPage('/tests/integration/progress-preview.html?view=profile&labmarks=all&dev=1&name=WWWWWWWWWWWW&dress=1', { view: [390, 844] });
    await waitFor(p, `!!document.querySelector('.vl-dress .vl-dt') && !!document.querySelector('.vl-dp .vl-strip')`, 'the dress screen', 20000);
    await sleep(1200);
    const r = await ev(p, `(() => { const over = e => e.scrollWidth > e.clientWidth + 1; const names = [...document.querySelectorAll('.pg-card-name, .vl-dp .vl-name, .vl-dr-pin .vl-name')];
      return { panel: !!document.querySelector('.vl-dp-go') && /DRESS YOUR CARD/.test(document.querySelector('.vl-dp-go').textContent), coll: !!document.querySelector('.vl-dc-row'), lists: document.querySelectorAll('.pg-prof .vl-picker').length,
        tabs: [...document.querySelectorAll('.vl-dr-tab')].map(b => b.textContent).join(), sel: (document.querySelector('.vl-dr-tab[aria-selected="true"]') || {}).textContent,
        tiles: document.querySelectorAll('.vl-dt').length, on: document.querySelectorAll('.vl-dt.is-on').length, tiers: [...document.querySelectorAll('.vl-dt')].every(t => /vl-dt-(common|uncommon|rare|epic|legendary)/.test(t.className)),
        dev1: [...document.querySelectorAll('.vl-dt')].slice(0, 2).map(t => t.dataset.id).join(), pin: document.querySelectorAll('.vl-dr-pin .vl-strip').length,
        names: names.length, over: names.filter(over).length, ell: names.filter(e => getComputedStyle(e).textOverflow === 'ellipsis').length, no: (document.querySelector('.pg-card-no') || {}).textContent || '' }; })()`);
    ok(r.panel && r.coll && r.lists === 0 && r.tabs === 'CARD,EMBLEM,GLOW,TUBE' && r.sel === 'CARD' && r.tiles > 10 && r.on === 1 && r.tiers && r.dev1 === 'card-dev-switchboard,card-dev-source' && r.pin === 1 && r.names >= 3 && r.over === 0 && r.ell === 0 && /0001/.test(r.no),
      `DRESS YOUR CARD: the profile's ONE panel + YOUR COLLECTION (${r.lists} long lists left); the dress screen — the pinned strip, tabs ${r.tabs}, ${r.tiles} card tiles tier-edged (${r.on} ticked, the DEV cards first: ${r.dev1}); WWWWWWWWWWWW whole on the card + the strips (${r.over} over, ${r.ell} cut); the card's ${r.no}`);
    await ctx.close(); }
  // EVERY BOTTOM SHEET FLOATS: BRING YOUR CARD at 402 × 874 — its whole rounded border above the screen's bottom
  { const { ctx, p } = await anyPage('/tests/integration/title-preview.html?guest=1');
    await waitFor(p, '!!window.__preview', 'the title preview', 40000);
    await ev(p, `import('/js/profile/bring.js').then(B => { B.openBring({ lead: true }); return true; })`);
    await waitFor(p, `!!document.querySelector('.byc-bring .byc-sheet')`, 'the bring sheet');
    await sleep(700);
    const s = await ev(p, `(() => { const e = document.querySelector('.byc-bring .byc-sheet'), r = e.getBoundingClientRect(), c = getComputedStyle(e); return { gap: Math.round(innerHeight - r.bottom), rad: parseFloat(c.borderBottomLeftRadius), bw: parseFloat(c.borderBottomWidth) }; })()`);
    ok(s.gap >= 8 && s.rad >= 16 && s.bw >= 1, `BOTTOM SHEETS: BRING YOUR CARD floats ${s.gap} pt above the bottom, its rounded border whole (radius ${s.rad}, bottom border ${s.bw} px)`);
    await ctx.close(); }
  // THE PROGRAM (the add-on): the full day (a Friday ~180 rows) · RARE + LEGENDARY (only those) · VAULT 1C: EVERY row its tier badge in THE ONE
  // TIER PALETTE + its name tinted; the filter's rows all rare / epic / legendary; remembered
  { const { ctx, p } = await anyPage('/tests/integration/program-preview.html?at=2026-11-06T21:30&filter=all');
    await waitFor(p, 'document.body.dataset.ready', 'the program', 15000);
    const all = await ev(p, `document.querySelectorAll('.rd-paper:first-child .rd-pr').length`);
    const badges = await ev(p, `(() => { const rows = [...document.querySelectorAll('.rd-paper:first-child .rd-pr[data-tier]')]; return { n: rows.length, badged: rows.filter(x => x.querySelector('i.rd-tier')).length, tinted: rows.filter(x => { const c = getComputedStyle(x.querySelector(':scope > span')).color; return c !== 'rgb(42, 26, 10)'; }).length, tiers: [...new Set(rows.map(x => x.dataset.tier))].sort().join(',') }; })()`);
    ok(badges.n === all && badges.badged === all && badges.tinted === all && /common/.test(badges.tiers) && /legendary/.test(badges.tiers), `THE PROGRAM's TIER COLOURS: ${badges.badged}/${all} rows wear their tier badge, ${badges.tinted} names tinted (tiers tonight: ${badges.tiers})`);
    await ev(p, `[...document.querySelectorAll('.rd-prfb')].find(b => /RARE/.test(b.textContent)).click()`);
    const r = await ev(p, `({ n: document.querySelectorAll('.rd-paper:first-child .rd-pr').length, tagged: [...document.querySelectorAll('.rd-paper:first-child .rd-pr')].filter(x => ['rare', 'epic', 'legendary'].includes(x.dataset.tier)).length, saved: localStorage.getItem('rd:prog') })`);
    ok(all > 120 && r.n >= 3 && r.n < 20 && r.tagged === r.n - (r.n > r.tagged ? 1 : 0) && r.saved === 'rare', `THE PROGRAM: THE FULL DAY lists ${all} rows; RARE + LEGENDARY ${r.n} (${r.tagged} rare / epic / legendary), remembered (${r.saved})`);
    await ctx.close(); }
  // THE NO-TAP SIGHTING in WebKit (Safari's engine) at 402 × 874, a returning visitor: zero input → nothing · a tap AWAY → nothing · a tap
  // ON the UFO → it reacts (the 1B rule: a trusted touch ≥ 800 ms after the page was shown, its down + up on the legendary)
  { const pw = process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs');
    const what = 'THE NO-TAP SIGHTING in WebKit: nothing / a tap away / a tap on it';
    if (!existsSync(pw)) { checks.push({ what, ok: true, warn: 'skipped' }); warnings.push(`[skipped] ${what} — no Playwright 1.56 here (WK_PLAYWRIGHT)`); log('SKIP', what); return; }
    const { webkit } = await import(pathToFileURL(pw).href);
    const b = await webkit.launch();
    try {
      const run = async mode => {
        const ctx = await b.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
        await ctx.addInitScript(() => { try { localStorage.setItem('nd:entered', '1'); localStorage.setItem('na:sh:profile', JSON.stringify({ name: 'BEN', color: 'magenta', avatar: 'bolt' })); } catch { /* fine */ } });
        const p = await ctx.newPage();
        await p.goto(`${BASE}/?when=2026-11-03T22:00&force=ufo&lgnow=1`);
        const t0 = Date.now(); let fired = false, tapped = false, box = null;
        while (Date.now() - t0 < (mode === 'none' ? 14000 : 9000)) {
          const r = await p.evaluate(() => import('/js/progress/sighting.js').then(m => ({ tap: !!m.last.tap, dom: !!document.querySelector('.sg-fly, .sg-modal, .sg-flash'), box: window.__district && window.__district.sightBoxes ? window.__district.sightBoxes().find(x => x.id === 'ufo') || null : null }))).catch(() => ({}));
          if (r.box) box = r.box;
          if (!tapped && box && Date.now() - t0 > 4000 && mode !== 'none') { tapped = true; await p.touchscreen.tap(mode === 'on' ? box.x : (box.x > 200 ? 60 : 340), mode === 'on' ? box.y : 820); }
          if (r.tap || r.dom) { fired = true; if (mode !== 'on') break; }
          if (fired && mode === 'on') break;
          await p.waitForTimeout(350);
        }
        await ctx.close();
        return { fired, box: !!box };
      };
      const none = await run('none'), away = await run('away'), on = await run('on');
      ok(none.box && !none.fired && !away.fired && on.fired, `THE NO-TAP SIGHTING in WebKit at 402 × 874: zero input → ${none.fired ? 'FIRED' : 'nothing'} · a tap away → ${away.fired ? 'FIRED' : 'nothing'} · a tap on the UFO → ${on.fired ? 'it reacts' : 'NOTHING'}`);
    } finally { await b.close(); }
  }
});

// ---- THE VAULT 2A — THE 3 HELD CARDS + THE EMBLEM / GLOW / TUBE-STYLE SYSTEM ----------------------------------------------------------
//   · THE EMBLEMS tab: the 10 samples + the 12 sign-up shapes + 3 tube styles + 1A's 2 test emblems, each at full size + 28 pt + on two
//     strips; a mark stored; NOTHING ANIMATES ON AN SVG ELEMENT (each moving part an HTML-wrapped layer: the compositor moves it)
//   · THE GLOWS tab: 3 glows on a short + a LOEWFIZZLE-length name (whole, one line on the strip), the level line never lit
//   · the 3 held cards: their strips + full cards drawn, FOUNDING MEMBER's gold № (strip corner + the full card's stamp)
//   · THE PICKER's style rows: emblems · tube styles · name glows as rows on the player's own strip, one WEARING each, a tap wears it
//   · A FULL LOBBY of 8 LEGENDARIES + every sample's emblem + glow at 4× CPU on the real compositor (the prominence rule's budget)
G('vault', async () => {
  { const { ctx, p } = await page('view=emblems');
    await sleep(1400);
    const e = await ev(p, `(() => { const svgAnim = [...document.querySelectorAll('.ve svg, .ve svg *')].filter(x => getComputedStyle(x).animationName !== 'none').length;
      return { items: document.querySelectorAll('.vl-item').length, ves: document.querySelectorAll('.ve').length, finishes: [...new Set([...document.querySelectorAll('.ve')].map(v => (v.className.match(/ve-f-(\\w+)/) || [])[1]))].sort().join(),
        moving: [...document.querySelectorAll('.ve-l')].filter(x => getComputedStyle(x).animationName !== 'none').length, svgAnim, canvases: document.querySelectorAll('canvas.fx-canvas').length,
        small: [...document.querySelectorAll('.vl-emb-big .ve.is-28')].every(v => Math.round(v.getBoundingClientRect().width) === 28) }; })()`);
    ok(e.items === 46 && e.ves > 150 && e.finishes === 'aurora,autumn,balloon,chrome,coin,comet,galaxy,glitch,gold,ice,metal,molten,neon,prism,spectral' && e.moving > 60 && e.svgAnim === 0 && e.canvases === 1 && e.small,
      `THE EMBLEMS tab: ${e.items} items (2A's 10 samples + 2B's 25 · the 12 sign-up shapes · 8 tube styles · 1A's 2), ${e.ves} emblems in all 8 finishes (${e.finishes}), 28 pt checked; ${e.moving} layers moving on the compositor, ${e.svgAnim} animations on an SVG element (none allowed)`);
    await ev(p, `document.querySelector('.vl-item[data-id="emb-owl"] .vl-mark[data-m="approve"]').click()`); await sleep(300);
    const m = await ev(p, `(window.__lab.marks['emb-owl'] || {}).m`);
    ok(m === 'approve', `THE EMBLEMS tab: a mark stored (emb-owl → ${m})`);
    if (SHOTS) await p.screenshot({ path: `${OUT}vault-emblems-402x874.png` });
    await ctx.close(); }
  { const { ctx, p } = await page('view=glows', { dpr: 2 });
    await sleep(1200);
    const g = await ev(p, `(() => { const names = [...document.querySelectorAll('.vl-name.vg, .vl-fc-name.vg')];
      return { items: document.querySelectorAll('.vl-item').length, names: names.length, looks: [...new Set(names.map(n => (n.className.match(/vg-[a-z]+/g) || []).map(c => c.slice(3)).filter(c => c !== 'still')).flat())].sort().join(),
        over: names.filter(n => { const d = [...n.children].filter(c => c.tagName === 'I'); d.forEach(c => { c.style.display = 'none'; }); const o = n.scrollWidth > n.clientWidth + 1; d.forEach(c => { c.style.display = ''; }); return o; }).length, strip2: [...document.querySelectorAll('.vl-strip .vl-name.vg')].filter(n => n.classList.contains('fit-2')).length,
        lvLit: [...document.querySelectorAll('.vl-lv, .vl-fc-lv')].filter(l => l.className.includes('vg')).length, pieces: document.querySelectorAll('.vg > i').length }; })()`);
    ok(g.items === 14 && g.names === 42 && g.looks.split(',').length === 14 && g.over === 0 && g.strip2 === 0 && g.lvLit === 0 && g.pieces > 10,
      `THE GLOWS tab: ${g.items} glows on ${g.names} names (${g.looks}) — LOEWFIZZLE whole on one line on every strip (${g.over} overflowing, ${g.strip2} split), the level line never lit (${g.lvLit}), ${g.pieces} glints + arcs`);
    await ctx.close(); }
  { const { ctx, p } = await anyPage('/tests/integration/card-review.html?cards=card-founder,card-house,card-platinum', { view: [402, 1200] });
    await waitFor(p, '!!document.body.dataset.ready', 'the review page', 30000); await sleep(1500);
    const h = await ev(p, `(async () => { const R = await import('/js/fx/renderer.js'); return { slots: R.fxStats.slots, probe: await R.fxProbe(), no: (document.querySelector('.vl-strip.vl-s-founder .vl-no') || {}).textContent || '',
      stamp: (document.querySelector('.vl-fc.vl-s-founder .vl-fc-stamp b') || {}).textContent || '', plat: getComputedStyle(document.querySelector('.vl-strip.vl-s-platinum .vl-mat')).backgroundImage,
      tiers: [...document.querySelectorAll('.vl-strip')].map(x => x.dataset.tier).join() }; })()`);
    ok(h.slots === 6 && h.probe > 300 && h.no === '№ 0001' && h.stamp === '№ 0001' && /platinum\.webp/.test(h.plat) && h.tiers === 'legendary,legendary,epic',
      `THE 3 HELD CARDS: strips + full cards drawn (${h.slots} slots, ${h.probe} lit samples; tiers ${h.tiers}); FOUNDING MEMBER's gold № on the strip ("${h.no}") + the full card's stamp ("${h.stamp}"); PLATINUM on its metal`);
    await ctx.close(); }
  // DRESS YOUR CARD BY FINGER (402 × 874, real taps): EMBLEM tab → tap SNOWED IN → the pinned strip wears the ice crystal at once; GLOW →
  // GOLD LEAF; TUBE → its tiles; CARD → tap INFERNO → the strip's card; VIEW FULL › → the full card; a long-press on a card tile → its full card
  { const { ctx, p } = await anyPage('/tests/integration/progress-preview.html?view=profile&labmarks=all&dress=1', { view: [402, 874] });
    await waitFor(p, `!!document.querySelector('.vl-dress .vl-dt')`, 'the dress screen', 20000); await sleep(900);
    const tab = async k => { await p.tap(`.vl-dr-tab[data-tab="${k}"]`); await sleep(350); };
    await tab('emblem');
    const em = await ev(p, `({ tiles: document.querySelectorAll('.vl-dt').length, none: !!document.querySelector('.vl-dt[data-id="none"].is-on'), ve: document.querySelectorAll('.vl-dt .ve').length })`);
    await p.tap('.vl-dt[data-id="emb-snowflake"]'); await sleep(400);
    const pin1 = await ev(p, `({ ice: !!document.querySelector('.vl-dr-pin .ve.ve-f-ice'), ticked: (document.querySelector('.vl-dt.is-on') || {}).dataset ? document.querySelector('.vl-dt.is-on').dataset.id : '' })`);
    await tab('glow'); await p.tap('.vl-dt[data-id="glow-gold"]'); await sleep(400);
    const gold = await ev(p, `!!document.querySelector('.vl-dr-pin .vl-name.vg-goldleaf')`);
    await tab('tube'); const tubes = await ev(p, `document.querySelectorAll('.vl-dt').length`);
    await tab('card'); await p.tap('.vl-dt[data-id="card-inferno"]'); await sleep(500);
    const card = await ev(p, `({ pin: (document.querySelector('.vl-dr-pin') || {}).dataset ? document.querySelector('.vl-dr-pin').dataset.card : '', strip: !!document.querySelector('.vl-dr-pin .vl-strip.vl-s-inferno') })`);
    await p.tap('.vl-dr-view'); await waitFor(p, `!!document.querySelector('.vl-full')`, 'VIEW FULL', 5000).catch(() => {});
    const view = await ev(p, `!!document.querySelector('.vl-full')`);
    await ev(p, `document.querySelector('.vl-full-x') && document.querySelector('.vl-full-x').click()`); await sleep(300);
    // (a long-press: the finger held ~0.6 s on the PRISM tile → its full card)
    await ev(p, `document.querySelector('.vl-dt[data-id="card-prism"]').scrollIntoView({ block: 'center' })`); await sleep(400);
    const b = await p.$('.vl-dt[data-id="card-prism"]'); const bb = await b.boundingBox();
    await p.touchscreen.touchStart(bb.x + bb.width / 2, bb.y + bb.height / 2); await sleep(650); await p.touchscreen.touchEnd(); await sleep(400);
    const held = await ev(p, `!!document.querySelector('.vl-full')`);
    ok(em.tiles > 8 && em.none && em.ve === em.tiles && pin1.ice && pin1.ticked === 'emb-snowflake' && gold && tubes >= 3 && card.pin === 'card-inferno' && card.strip && view && held,
      `DRESS YOUR CARD by finger [${JSON.stringify({ em, pin1, gold, tubes, card, view, held })}]: EMBLEM ${em.tiles} tiles (YOUR SHAPE ticked) → a tap on SNOWED IN → the pinned strip wears it at once (${pin1.ice}); GLOW → GOLD LEAF (${gold}); TUBE ${tubes} tiles; CARD → INFERNO on the strip (${card.pin}); VIEW FULL › (${view}); a long-press → the full card (${held})`);
    await ctx.close(); }
  { const { ctx, p } = await page('view=lobby&bare=1&mix=legend&wear=emb,glow', { real: true, cpu: 4, dpr: 3 });
    await sleep(2500);
    const t = await frames(p, 240); t.sort((x, y) => x - y);
    const st = await ev(p, 'window.__lab.stats');
    const ems = await ev(p, `({ n: document.querySelectorAll('.vl-strip .ve').length, quiet: document.querySelectorAll('.vl-strip .ve.is-quiet').length, glows: document.querySelectorAll('.vl-strip .vg.vg-still').length })`);
    const med = t[t.length >> 1], p95 = t[Math.floor(t.length * 0.95)], slow = t.filter(x => x > 20).length;
    okT(med < 17.5 && slow < t.length * 0.08 && ems.n === 8 && ems.quiet === 8 && ems.glows === 8, `THE VAULT 2A: A FULL LOBBY of 8 LEGENDARIES wearing every sample's emblem + glow at 4× CPU — median ${med.toFixed(1)} ms, p95 ${p95.toFixed(1)}, ${slow}/${t.length} slow; the card leads (${ems.quiet}/8 emblems + ${ems.glows}/8 glows holding still); effect tier ${st.tier}`);
    await ctx.close(); await closeReal(); }
});
