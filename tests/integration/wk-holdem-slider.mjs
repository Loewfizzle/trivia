// HOLD'EM — THE BET SLIDER in Safari's engine (HE11 — the owner's play-test, Nov 12: "jumps and skips around — not smooth"). Playwright's
// WebKit (~/wk/node_modules/playwright, or WK_PLAYWRIGHT), 402×874 @3 as an iPhone with touch, on the preview (no emulators — the REAL
// view over the dealer's own pure core; tests/integration/holdem-preview.html?state=slider). Each run:
//   1. A DRAG ACROSS the track (WebKit's pointer path, 120 small moves): the amounts it shows are MONOTONIC (never back), never skip a
//      stop the finger passed, all round, and ALL IN appears only at the very end.
//   2. − / + one stop each; a preset sets the slider.
//   3. CONFIRM sends EXACTLY the amount on screen, ONCE (the dealer's fetch counted — /api/report answered by the page's own stub).
//   4. The page never scrolled under the drag (touch-action: none on the slider only).
//   THE HARDENING (Nov 13 — the slider's review): a held + stops on the window's blur and on the page going hidden (and its blur /
//   visibilitychange listeners go with the hold); a second finger (synthetic PointerEvents — Playwright drives one pointer) never moves
//   the thumb nor steps − / +, mid-drag or mid-hold; CONFIRM LOCKS THE PANEL (a − tap / a drag change nothing) — a refused move (409)
//   opens it at once, a double tap / a triple click sends ONE act, a yes the table never showed opens it after the grace (never sticks).
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
// (window.__fail = n: the next n moves are REFUSED — a 409 stale, the table moved — to prove the lock opens again)
// (the blur / visibilitychange listeners counted — window.__lis — to prove a hold's own go with it)
const INIT = () => {
  window.__sent = [];
  window.__fail = 0;
  window.__fakeToken = 'wk';
  const real = window.fetch;
  window.fetch = (url, o) => {
    if (String(url).includes('/api/report')) {
      let body = null; try { body = JSON.parse(o && o.body); } catch { /* fine */ }
      window.__sent.push(body);
      if (body && body.holdem === 'act' && window.__fail > 0) {
        window.__fail--;
        return Promise.resolve(new Response(JSON.stringify({ error: 'stale' }), { status: 409, headers: { 'content-type': 'application/json' } }));
      }
      return Promise.resolve(new Response(JSON.stringify({ ok: true, changed: false }), { status: 200, headers: { 'content-type': 'application/json' } }));
    }
    return real(url, o);
  };
  window.__lis = { blur: new Set(), vis: new Set() };
  const wrap = (target, type, set) => {
    const add = target.addEventListener, rem = target.removeEventListener;
    target.addEventListener = function (t, fn, opt) { if (t === type) set.add(fn); return add.call(this, t, fn, opt); };
    target.removeEventListener = function (t, fn, opt) { if (t === type) set.delete(fn); return rem.call(this, t, fn, opt); };
  };
  wrap(window, 'blur', window.__lis.blur);
  wrap(document, 'visibilitychange', window.__lis.vis);
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

// ---- 2b. THE HARDENING: a hold stops on the window's blur / the page hidden — the finger still down — and its listeners go with it
const lis = () => p.evaluate(() => [window.__lis.blur.size, window.__lis.vis.size]);
const toMin = async () => { await p.focus('.he-sl-track'); await p.keyboard.press('Home'); };
const isHeld = () => p.evaluate(() => !!document.querySelector('.he-sl-step.is-held'));
for (const [name, cut, undo] of [
  ['the window\'s blur (a call / the app switcher)', () => window.dispatchEvent(new Event('blur')), () => {}],
  ['the page hidden (the phone locked)', () => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  }, () => { delete document.hidden; delete document.visibilityState; }],
]) {
  await toMin();
  const l0 = await lis(), a0 = (await read()).amt;
  await p.mouse.move(pb.x + pb.width / 2, pb.y + pb.height / 2); await p.mouse.down();
  await p.waitForTimeout(650);
  const lHeld = await lis(), heldOn = await isHeld();
  await p.evaluate(cut);
  const a1 = (await read()).amt, heldAfter = await isHeld(), lCut = await lis();
  await p.waitForTimeout(700);                              // (a running hold would step ~10 more stops here)
  const a2 = (await read()).amt;
  await p.mouse.up();
  await p.evaluate(undo);
  const a3 = (await read()).amt;
  ok(a1 > a0 && heldOn && !heldAfter && a2 === a1 && a3 === a1,
    `HOLD + then ${name}: stepping STOPS at once (${a0} → ${a1}, 0.7 s later ${a2}, after the lift ${a3})`);
  ok(lHeld[0] === l0[0] + 1 && lHeld[1] === l0[1] + 1 && lCut[0] === l0[0] && lCut[1] === l0[1],
    `  the hold's blur + visibilitychange listeners: added for the hold, removed when it ended (${l0.join('/')} → ${lHeld.join('/')} → ${lCut.join('/')})`);
}
// a plain hold's lift removes them too
{
  const l0 = await lis();
  await p.mouse.move(pb.x + pb.width / 2, pb.y + pb.height / 2); await p.mouse.down();
  await p.waitForTimeout(100);
  await p.mouse.up();
  const a = (await read()).amt; await p.waitForTimeout(600); const b = (await read()).amt; const l1 = await lis();
  ok(a === b && l1.join() === l0.join() && !(await isHeld()), `a short press + lift: one stop, then nothing (${a} · ${b}), its listeners gone (${l1.join('/')})`);
}

// ---- 2c. a SECOND FINGER (synthetic PointerEvents — ids 11 / 12 / 13 …) never moves the thumb nor steps, mid-drag or mid-hold
await toMin();
const two = await p.evaluate(() => {
  const tr = document.querySelector('.he-sl-track'), r = tr.getBoundingClientRect(), y = r.top + r.height / 2;
  const minus = document.querySelector('.he-sl-step.is-minus'), plus = document.querySelector('.he-sl-step.is-plus');
  const amt = () => Number(document.querySelector('.he-sl-amt').textContent.replace(/,/g, ''));
  const tx = () => document.querySelector('.he-sl-thumb').style.transform;
  const ev = (type, id, x, target = tr) => target.dispatchEvent(new PointerEvent(type, { pointerId: id, clientX: x, clientY: y, bubbles: true,
    cancelable: true, pointerType: 'touch', isPrimary: id === 11 || id === 21, button: 0, buttons: type === 'pointerup' ? 0 : 1 }));
  const o = {};
  // mid-DRAG: finger 11 on the track at a quarter; finger 12 lands + moves far right; finger 13 taps − ; 12 lifts; 11 moves on + lifts
  ev('pointerdown', 11, r.left + r.width * 0.25); o.a1 = amt(); o.t1 = tx();
  ev('pointerdown', 12, r.left + r.width * 0.85); ev('pointermove', 12, r.left + r.width * 0.9); o.a2 = amt(); o.t2 = tx();
  ev('pointerdown', 13, 0, minus); ev('pointerup', 13, 0, minus); ev('pointerdown', 14, 0, plus); ev('pointerup', 14, 0, plus); o.a3 = amt();
  ev('pointerup', 12, r.left + r.width * 0.9); o.dragOn = tr.closest('.he-slider').classList.contains('is-drag');
  ev('pointermove', 11, r.left + r.width * 0.5); o.a4 = amt();
  ev('pointerup', 11, r.left + r.width * 0.5); o.a5 = amt(); o.dragOff = !tr.closest('.he-slider').classList.contains('is-drag');
  // mid-HOLD: finger 21 holds + (one stop at once); finger 22 presses + and − and the track → nothing; 22 lifts → the hold goes on; 21 lifts
  ev('pointerdown', 21, 0, plus); o.h1 = amt();
  ev('pointerdown', 22, 0, plus); ev('pointerup', 22, 0, plus); ev('pointerdown', 23, 0, minus); ev('pointerup', 23, 0, minus);
  ev('pointerdown', 24, r.left + r.width * 0.9); ev('pointermove', 24, r.left + r.width * 0.95); ev('pointerup', 24, r.left + r.width * 0.95);
  o.h2 = amt(); o.heldOn = plus.classList.contains('is-held');
  ev('pointerup', 21, 0, plus); o.heldOff = !plus.classList.contains('is-held');
  return o;
});
ok(two.a2 === two.a1 && two.t2 === two.t1, `mid-drag, a SECOND finger on the track: the thumb + amount stay (${two.a1} · ${two.a2})`);
ok(two.a3 === two.a1, `mid-drag, a second finger on − / + : no step (${two.a3})`);
ok(two.dragOn && two.a4 > two.a1 && two.a5 === two.a4 && two.dragOff, `the second finger's lift never ends the first finger's drag (it moves on: ${two.a1} → ${two.a4}, settles ${two.a5})`);
ok(two.h2 === two.h1 && two.heldOn && two.heldOff, `mid-hold, a second finger on + / − / the track: no extra step, no move (${two.h1} · ${two.h2}); the hold ends on ITS finger`);

// ---- 3. CONFIRM LOCKS THE PANEL: a refusal opens it again; a double tap = ONE act of the amount on screen; it never sticks
const locked = () => p.evaluate(() => !!document.querySelector('.he-slider.is-locked'));
const acts = n => p.evaluate(k => window.__sent.slice(k).filter(b => b && b.holdem === 'act'), n);
// 3a. a REFUSED move (409 — the table moved) → the panel opens again at once, the slider still up, − steps
await p.tap('.he-sl-step.is-plus');
await p.evaluate(() => { window.__fail = 1; });
const before0 = await p.evaluate(() => window.__sent.length);
await p.tap('.he-slider .he-confirm');
await p.waitForFunction(() => !document.querySelector('.he-slider.is-locked'), null, { timeout: 5000 }).catch(() => {});
const refused = await acts(before0);
const r0 = (await read()).amt; await p.tap('.he-sl-step.is-minus'); const r1 = (await read()).amt;
ok(refused.length === 1 && !(await locked()) && !!(await p.$('.he-slider')) && r1 < r0,
  `a REFUSED CONFIRM (409): one act sent, the panel OPENS again at once (− steps: ${r0} → ${r1})`);
// 3b. CONFIRM tapped twice (real taps) → ONE act, the amount on screen; meanwhile LOCKED: − / + / a drag / a preset change nothing
await p.tap('.he-sl-step.is-plus');
const shown = await read();
const before = await p.evaluate(() => window.__sent.length);
await p.tap('.he-slider .he-confirm');
const lockedNow = await locked();
// (force: a real impatient finger — Playwright counts aria-disabled as disabled and would otherwise WAIT for the lock to open, then tap)
await p.tap('.he-slider .he-confirm', { force: true, timeout: 2000 }).catch(() => {});
await p.tap('.he-sl-step.is-minus').catch(() => {});
await p.tap('.he-sl-step.is-plus').catch(() => {});
await p.mouse.move(box.x + 8, y); await p.mouse.down(); await p.mouse.move(box.x + box.w * 0.8, y); await p.mouse.up();
if (pre) await p.tap(`.he-sl-pre[data-to="${pre.to}"]`).catch(() => {});
const still = await read();
await p.waitForTimeout(400);
const sent = await acts(before);
ok(lockedNow && still.amt === shown.amt, `CONFIRM LOCKS the panel: − / + / a drag / a preset change nothing in flight (${shown.amt} · ${still.amt})`);
ok(sent.length === 1 && sent[0].amount === shown.amt && (sent[0].action === 'raise' || sent[0].action === 'bet'),
  `CONFIRM tapped TWICE sends the amount on screen ONCE (${shown.amt} → ${JSON.stringify(sent.map(a => [a.action, a.amount]))})`);
// 3c. the dealer said yes but this table never moved (the stub's changed: false) → the lock opens after the grace — it never sticks
const t0 = Date.now();
const opened = await p.waitForFunction(() => !document.querySelector('.he-slider.is-locked'), null, { timeout: 8000 }).then(() => true, () => false);
ok(opened && (await acts(before)).length === 1, `a yes the table never showed: the lock opens by itself (${((Date.now() - t0) / 1000).toFixed(1)} s) — never stuck, still ONE act`);
// 3d. an impatient triple CLICK in one task (no frame between) → ONE act
const before3 = await p.evaluate(() => window.__sent.length);
await p.evaluate(() => { const c = document.querySelector('.he-slider .he-confirm'); c.click(); c.click(); c.click(); });
await p.waitForTimeout(400);
ok((await acts(before3)).length === 1, `three CONFIRM clicks in one go: ONE act (${(await acts(before3)).length})`);

await browser.close();
const bad = results.filter(r => !r.ok);
console.log(`\n${results.length - bad.length} / ${results.length} OK`);
process.exit(bad.length ? 1 : 0);
