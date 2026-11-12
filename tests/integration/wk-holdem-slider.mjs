// HOLD'EM — THE BET SLIDER in Safari's engine (HE11 — the owner's play-test, Nov 12: "jumps and skips around — not smooth"). Playwright's
// WebKit (~/wk/node_modules/playwright, or WK_PLAYWRIGHT), 402×874 @3 as an iPhone with touch, on the preview (no emulators — the REAL
// view over the dealer's own pure core; tests/integration/holdem-preview.html?state=slider). Each run:
//   1. A DRAG ACROSS the track (WebKit's pointer path, 120 small moves): the amounts it shows are MONOTONIC (never back), never skip a
//      stop the finger passed, all round, and ALL IN appears only at the very end.
//   2. − / + one stop each; a preset sets the slider.
//   3. CONFIRM sends EXACTLY the amount on screen, ONCE (the dealer's fetch counted — /api/report answered by the page's own stub).
//   4. The page never scrolled under the drag (touch-action: none on the slider only).
//   node tests/integration/wk-holdem-slider.mjs [--base http://localhost:5173] [--skin casino]
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { guardUrl } from './kit/live-guard.mjs';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const BASE = opt('base', process.env.E2E_BASE || 'http://localhost:5173'), SKIN = opt('skin', '');
const { webkit } = await import(pathToFileURL(process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs')).href);
const browser = await webkit.launch();
const results = [];
const ok = (c, what) => { results.push({ ok: !!c, what }); console.log(c ? 'OK  ' : 'FAIL', what); };

// the dealer's /api/report answered on the page (counted, the body kept); the ID token stubbed by the preview's fake firebase
const INIT = () => {
  window.__sent = [];
  window.__fakeToken = 'wk';
  const real = window.fetch;
  window.fetch = (url, o) => {
    if (String(url).includes('/api/report')) {
      let body = null; try { body = JSON.parse(o && o.body); } catch { /* fine */ }
      window.__sent.push(body);
      return Promise.resolve(new Response(JSON.stringify({ ok: true, changed: false }), { status: 200, headers: { 'content-type': 'application/json' } }));
    }
    return real(url, o);
  };
};

const ctx = await browser.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await ctx.addInitScript(INIT);
const p = await ctx.newPage();
await p.goto(guardUrl(`${BASE}/tests/integration/holdem-preview.html?state=slider&n=8${SKIN ? `&skin=${SKIN}` : ''}`, 'a test page'));
await p.waitForFunction(() => document.body.dataset.ready === '1' && !!document.querySelector('.he-sl-track'), null, { timeout: 30000 });

const read = () => p.evaluate(() => ({ amt: Number(document.querySelector('.he-sl-amt').textContent.replace(/,/g, '')), sub: document.querySelector('.he-sl-sub').textContent }));
const box = await p.evaluate(() => { const r = document.querySelector('.he-sl-track').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
ok(box.h >= 44 && box.w > 250, `the track is fat: ${Math.round(box.w)} × ${Math.round(box.h)} pt (≥ 44 tall)`);
const scroll0 = await p.evaluate(() => [scrollX, scrollY, document.scrollingElement.scrollTop]);

// ---- 1. a drag across through WebKit's real pointer path (Playwright's WebKit has no touch-drag API — the mouse drives the same
//      pointerdown → setPointerCapture → pointermove × 120 → pointerup the control listens to; − / + + CONFIRM below are real TAPS)
const y = box.y + box.h / 2, seen = [];
await p.mouse.move(box.x + 4, y);
await p.mouse.down();
seen.push(await read());
for (let i = 1; i <= 120; i++) { await p.mouse.move(box.x + 4 + (box.w + 20) * i / 120, y); seen.push(await read()); }
await p.mouse.up();
const amts = seen.map(s => s.amt);
const stops = await p.evaluate(async () => {
  const { betStops } = await import('/js/games/holdem/bet-steps.js');
  const L = window.__holdem.legal(), t = window.__holdem.table ? window.__holdem.table() : null;
  return { L, sb: t ? t.sb : null, ...(L ? betStops({ minTo: L.minTo, maxTo: L.maxTo, sb: t ? t.sb : 10 }) : {}) };
});
const mono = amts.every((v, i) => i === 0 || v >= amts[i - 1]);
const distinct = [...new Set(amts)];
ok(mono, `a drag across: the amount only climbs (${distinct.length} distinct, ${distinct.slice(0, 6).join(' · ')} … ${distinct.slice(-3).join(' · ')})`);
const S = stops.stops || [];
ok(S.length >= 30 && S.length <= 60, `the track holds ${S.length} stops (unit ${stops.unit}, min ${S[0]}, ALL IN ${S[S.length - 1]})`);
const skipped = S.filter(v => v >= amts[0] && v <= amts[amts.length - 1] && !amts.includes(v));
ok(skipped.length === 0, `no stop skipped under a slow finger${skipped.length ? ` (skipped ${skipped.join(', ')})` : ''}`);
ok(distinct.slice(1, -1).every(v => v % stops.unit === 0), `every amount between the min and ALL IN is round (× ${stops.unit})`);
const firstAll = seen.findIndex(s => s.sub === 'ALL IN');
ok(firstAll > 0 && seen.slice(firstAll).every(s => s.sub === 'ALL IN') && amts[firstAll] === S[S.length - 1] && amts[firstAll - 1] === S[S.length - 2],
  `ALL IN only at the very end (from move ${firstAll} of 120; the stop before it ${amts[firstAll - 1]})`);
const scroll1 = await p.evaluate(() => [scrollX, scrollY, document.scrollingElement.scrollTop]);
ok(JSON.stringify(scroll0) === JSON.stringify(scroll1), 'the page never scrolled under the drag');
const ta = await p.evaluate(() => [getComputedStyle(document.querySelector('.he-sl-track')).touchAction, getComputedStyle(document.querySelector('.he-sl-step')).touchAction, getComputedStyle(document.body).touchAction]);
ok(ta[0] === 'none' && ta[1] === 'none' && ta[2] !== 'none', `touch-action: none on the slider's parts only (track ${ta[0]}, − / + ${ta[1]}, the page ${ta[2]})`);

// ---- 2. − / + and a preset
await p.tap('.he-sl-step.is-minus'); const m1 = await read();
await p.tap('.he-sl-step.is-minus'); const m2 = await read();
await p.tap('.he-sl-step.is-plus'); const p1 = await read();
ok(m1.amt === S[S.length - 2] && m2.amt === S[S.length - 3] && p1.amt === S[S.length - 2], `− − + : one stop each (${m1.amt} · ${m2.amt} · ${p1.amt})`);
const pre = await p.evaluate(() => { const b = document.querySelector('.he-sl-pre:not(:last-child)'); return b ? { to: Number(b.dataset.to), label: b.textContent } : null; });
if (pre) { await p.tap(`.he-sl-pre[data-to="${pre.to}"]`); const r = await read(); ok(r.amt === pre.to, `the preset ${pre.label} sets the slider (${r.amt})`); }
// a held + : repeats (more than one stop in 900 ms), gently (from the minimum: − is off there — checked)
ok(await p.evaluate(() => document.querySelector('.he-sl-step.is-minus').disabled), '− is off at the minimum');
const h0 = (await read()).amt;
const plus = await p.$('.he-sl-step.is-plus'), pb = await plus.boundingBox();
await p.mouse.move(pb.x + pb.width / 2, pb.y + pb.height / 2); await p.mouse.down();
await p.waitForTimeout(900);
await p.mouse.up();
const h1 = (await read()).amt;
const nHeld = S.filter(v => v > h0 && v <= h1).length;
ok(nHeld >= 3, `HOLD + : repeats (${h0} → ${h1}, ${nHeld} stops in 0.9 s)`);

// ---- 3. CONFIRM sends the shown amount, once
await p.tap('.he-sl-step.is-minus');
const shown = await read();
const before = await p.evaluate(() => window.__sent.length);
await p.tap('.he-slider .he-confirm');
await p.tap('.he-slider .he-confirm').catch(() => {});   // (a double tap — the panel has gone / the lock holds: never twice)
await p.waitForTimeout(500);
const sent = await p.evaluate(n => window.__sent.slice(n), before);
const acts = sent.filter(b => b && b.holdem === 'act');
ok(acts.length === 1 && acts[0].amount === shown.amt && (acts[0].action === 'raise' || acts[0].action === 'bet'),
  `CONFIRM sends the amount on screen ONCE (${shown.amt} → ${JSON.stringify(acts.map(a => [a.action, a.amount]))})`);

await browser.close();
const bad = results.filter(r => !r.ok);
console.log(`\n${results.length - bad.length} / ${results.length} OK`);
process.exit(bad.length ? 1 : 0);
