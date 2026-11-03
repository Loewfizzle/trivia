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
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { BASE, ok, okT, sleep, ev, waitFor, G, launch, launchReal, closeReal, OUT, SHOTS, log, checks, warnings } from './kit.mjs';

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
    ok(s.items === 10 && s.strips === 12 && s.canvases === 1, `THE CARD LAB: 10 items (8 strips + 2 test emblems — ${s.strips} strips on the page) on ONE shared effect canvas (${s.canvases}) — ${s.names.join(' · ')}`);
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
  { const { ctx, p } = await page('view=lobby&bare=1&mix=samples&still=1', { dpr: 2 });
    await sleep(1500);
    const f1 = await ev(p, 'window.__lab.stats.frames'); await sleep(1200); const f2 = await ev(p, 'window.__lab.stats.frames');
    const px = await ev(p, `(() => { const c = document.querySelector('canvas.fx-canvas'); const x = c.getContext('2d'); const d = x.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 64) if (d[i] > 10) n++; return n; })()`);
    const anim = await ev(p, `getComputedStyle(document.querySelector('.vl-e-neon')).animationName + ' / ' + getComputedStyle(document.querySelector('.vl-e-prism .p-sweep')).animationName`);
    ok(f2 - f1 <= 1 && px > 500 && /none \/ none/.test(anim), `REDUCED MOTION: the strips' still frames drawn once (${px} lit samples), the canvas stops (${f2 - f1} frames in 1.2 s), the emblems still (${anim})`);
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
    await waitFor(p, `!!document.querySelector('.byc-bring .byc-new')`, 'the bring sheet');
    await sleep(800);
    const read = () => ev(p, `(() => { const s = document.querySelector('.byc-bring .sheet'); return { top: Math.round(s.scrollTop), max: s.scrollHeight - s.clientHeight }; })()`);
    const r = await swipeToEnd(p, 200, 360, 260, read);
    const nw = await ev(p, `document.querySelector('.byc-bring .byc-new').getBoundingClientRect().bottom <= innerHeight + 1`);
    ok(r.first.max > 0 && r.last.top >= r.last.max - 2 && nw, `BY FINGER: BRING YOUR CARD on a 402 × 400 screen scrolls inside by swipes — ${r.moved} of ${r.first.max} px, I'M NEW HERE reachable (${nw})`);
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
      const y = await scrollDown(max, 12);
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
