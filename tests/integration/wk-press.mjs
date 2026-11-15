// CITY A — item 5, EVERY TAP ACTS (the owner's iPhone, Safari 27.2: TODAY'S SCORES' "ALL TIME" — 2 lost taps, held 113 ms, travelled 0 px,
// nothing re-rendered: iOS simply sent NO click; another phone, Safari 27.0.1: a games-shelf row MOVED 38 px under a still finger).
// Playwright's WebKit as an iPhone (390 × 844 @3, touch), the page's TRUSTED clicks KILLED before anything sees them — exactly what iOS does
// when it drops a tap — and every control on the owner's list tapped by a real touch: each must ACT, ONCE, with THE TAP WATCH counting it as a
// press (ui/tapwatch.js — data-press) and 0 RESCUES. Then the same controls with the clicks ON: still once (the browser's click swallowed).
// + THE MOVED ROW: a pointerdown on a shelf row, the row slides 38 px, the lift of the still finger → it acts.
//   node tests/integration/wk-press.mjs [--base http://localhost:5173]      (the emulators + scripts/serve.mjs --emu; WebKit from ~/wk or WK_PLAYWRIGHT)
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { guardUrl } from './kit/live-guard.mjs';

const argv = process.argv.slice(2);
const BASE = (i => (i < 0 ? 'http://localhost:5173' : argv[i + 1]))(argv.indexOf('--base'));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const { webkit } = await import(pathToFileURL(process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs')).href);
const DB = 'http://127.0.0.1:9000';
const dbPut = (path, v) => fetch(`${DB}/${path}.json?ns=demo-arcade-default-rtdb`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: JSON.stringify(v) });
const results = [], table = [];
const ok = (c, what) => { results.push({ ok: !!c, what }); console.log(c ? 'OK  ' : 'FAIL', what); };

const browser = await webkit.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
const slot = `wp${Date.now() % 10000}`;
await ctx.addInitScript(s => {
  try { localStorage.setItem('nd:entered', '1'); localStorage.setItem('nd:byc', 'test'); localStorage.setItem(`na:${s}:profile`, JSON.stringify({ name: 'AVA', color: 'magenta', avatar: 'bolt' })); } catch { /* fine */ }
  // iOS's dropped tap: a TRUSTED click never reaches the page (registered first — before THE TAP WATCH's own listener)
  window.__noClick = false; window.__killed = 0;
  window.addEventListener('click', e => { if (e.isTrusted && window.__noClick) { e.stopImmediatePropagation(); e.preventDefault(); window.__killed++; } }, true);
}, slot);
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', e => errs.push(e.message));
const waitFor = async (js, ms = 8000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* navigating */ } await sleep(80); } return false; };
// (sel: a CSS selector, or { js } — an expression that finds the control AT THE TAP: a re-render between a mark and the tap can't lose it)
const centre = sel => p.evaluate(s => { const el = typeof s === 'string' ? document.querySelector(s) : (0, eval)(s.js); if (!el) return null; el.scrollIntoView({ block: 'center', behavior: 'instant' }); const r = el.getBoundingClientRect(); return r.width && r.height ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; }, sel);
const tw = () => p.evaluate('window.__tapwatch.stats()');

/** ONE touch on `sel` → `land` (a page expression) within 3 s, the watch's press count +1, rescues +0; `count` (optional) = how many times it acted */
async function press(name, sel, land, { before = null, after = null, count = null, settle = 450 } = {}) {
  if (before) await before();
  await sleep(settle);
  const c = await centre(sel);
  if (!c) { ok(false, `${name}: ${typeof sel === 'string' ? sel : sel.js} on screen`); return false; }
  const s0 = await tw(), k0 = await p.evaluate('window.__killed');
  if (count) await p.evaluate(count.arm);
  await p.touchscreen.tap(c.x, c.y);
  const hit = await waitFor(land, 3000);
  await sleep(500);
  const s1 = await tw(), k1 = await p.evaluate('window.__killed'), n = count ? await p.evaluate(count.read) : null;
  const clicks = await p.evaluate('window.__noClick');
  const good = hit && s1.pressed - s0.pressed === 1 && s1.rescues === s0.rescues && (n == null || n === 1);
  ok(good, `${name}: ${hit ? 'ACTED' : 'did NOTHING'} on one touch (${clicks ? `the browser's click killed: ${k1 - k0}` : `the browser's click swallowed: ${s1.tookSwallowed - s0.tookSwallowed}`}) · press +${s1.pressed - s0.pressed} · rescues +${s1.rescues - s0.rescues}${n != null ? ` · acted ${n}×` : ''}`);
  table.push(`${clicks ? 'no click' : 'click on'} · ${name}: ${hit ? 'acted' : 'LOST'} · rescues +${s1.rescues - s0.rescues}${n != null ? ` · ${n}×` : ''}`);
  if (after) await after();
  return good;
}
const closeSheets = () => p.evaluate(() => import('/js/ui/sheet.js').then(m => m.closeAllSheets())).then(() => sleep(350));
const home = async () => { await p.evaluate(() => import('/js/store.js').then(m => m.setState({ view: 'title', daily: null }))); await waitFor("window.__arcade.state.view === 'title' && !document.querySelector('.dy-overlay')", 15000); await sleep(600); };
const UP = '!!(window.__district && window.__district.harbor() && window.__district.harbor().shown && window.__tapwatch)';

try {
  await p.goto(guardUrl(`${BASE}/?emu&slot=${slot}&when=2026-11-03T21:00&city=2&idle=1`, 'wk-press.mjs'));
  if (!await waitFor(UP, 45000)) throw new Error('the city never came up');
  // the owner (THE RADIO is the owner's)
  let pid = null;
  for (let i = 0; i < 60 && !pid; i++) { pid = await p.evaluate(async () => { const m = await import('/js/profile/api.js'); try { return (await m.api('admin', { action: 'whoami' })).pid; } catch { return null; } }); if (!pid) await sleep(500); }
  if (pid) { await dbPut(`testAdmins/${pid}`, true); await p.evaluate('sessionStorage.clear()'); await p.reload(); await waitFor(UP, 45000); }
  ok(!!pid, `the owner's profile (${pid ? 'admin on the emulators' : 'none'})`);

  for (const noClick of [true, false]) {
    await p.evaluate(v => { window.__noClick = v; }, noClick);
    const tag = noClick ? '[iOS: NO click]' : '[the click arrives]';
    // ---- THE GAMES SHELF (the dock's PLAY → a row → its game's card)
    await press(`${tag} the games shelf row`, '.nd-shelf-row', "!!document.querySelector('.nd-card-sheet')", {
      before: async () => { await p.evaluate("document.querySelector('.nd-tab-play').click()"); await waitFor("!!document.querySelector('.sh.is-in .nd-shelf-row')", 4000); },
      count: { arm: "window.__nc = 0; window.__ncMo = new MutationObserver(l => { for (const m of l) for (const n of m.addedNodes) if (n.nodeType === 1 && n.matches('.nd-card-sheet')) window.__nc++; }); window.__ncMo.observe(document.body, { childList: true })", read: 'window.__ncMo.disconnect(), window.__nc' },
      after: closeSheets });
    // ---- THE RADIO (the owner's): a face tab, a jack, the ×
    if (pid && await waitFor("!!document.querySelector('.rd-btn')", 20000)) {
      await p.evaluate("document.querySelector('.rd-btn').click()");
      await waitFor("!!document.querySelector('.rd-bb')", 6000);
      await press(`${tag} the radio's PROGRAM tab`, { js: "[...document.querySelectorAll('.rd-bb')].find(b => b.textContent === 'PROGRAM')" }, "(document.querySelector('.rd-bb.is-on') || {}).textContent === 'PROGRAM'");
      await press(`${tag} the radio's DESK tab`, { js: "[...document.querySelectorAll('.rd-bb')].find(b => b.textContent === 'DESK')" }, "(document.querySelector('.rd-bb.is-on') || {}).textContent === 'DESK'");
      await waitFor("!!document.querySelector('.rd-jack:not(.is-preset)')", 6000);
      await press(`${tag} a jack`, '.rd-jack:not(.is-preset)', "!!(document.querySelector('.rd-cardwrap') || document.querySelector('.rd-bub'))",
        { after: async () => { await p.keyboard.press('Escape'); await sleep(300); await p.evaluate("document.querySelectorAll('.rd-bub').forEach(b => b.remove())"); } });
      await press(`${tag} the radio's ×`, '.rd-x', "!document.body.classList.contains('rd-open')");
      await sleep(400);
    } else ok(false, `${tag} the radio's button (the owner)`);
    // ---- THE BOARD: a game tab, the period tab
    await p.evaluate(() => import('/js/store.js').then(m => m.setState({ view: 'board' })));
    if (await waitFor("document.querySelectorAll('.bd-tab').length > 1", 15000)) {
      await p.evaluate("window.__wpTab = (document.querySelector('.bd-tab.is-on') || {}).dataset?.id || ''; const b = document.querySelector('.bd-tab:not(.is-on)'); if (b) b.dataset.wpB = '1'");
      await press(`${tag} THE BOARD's game tab`, '.bd-tab[data-wp-b]', "((document.querySelector('.bd-tab.is-on') || {}).dataset || {}).id !== window.__wpTab");
      // (the period switch on a game that has one: the first VISIBLE unselected segment — HOLD'EM's one board has none)
      const VIS = "[...document.querySelectorAll('.bd-seg-b')].filter(b => b.getBoundingClientRect().width > 0)";
      if (await waitFor(`${VIS}.some(b => b.getAttribute('aria-selected') === 'false')`, 4000)) {
        await p.evaluate(`window.__wpSeg = (${VIS}.find(b => b.getAttribute('aria-selected') === 'false') || {}).textContent || ''`);
        await press(`${tag} THE BOARD's period tab`, { js: `${VIS}.find(b => b.textContent === window.__wpSeg)` }, "[...document.querySelectorAll('.bd-seg-b')].some(b => b.textContent === window.__wpSeg && b.getAttribute('aria-selected') === 'true')");
      }
    } else ok(false, `${tag} THE BOARD opened`);
    await home();
    // ---- THE PROFILE (the add-on, Nov 14 7:56 pm — "CUSTOMIZE YOUR CARD": held 113 ms, 0 px, MOVED 6 px, no click): every .btn there acts
    await p.evaluate(() => import('/js/store.js').then(m => m.setState({ view: 'profile' })));
    if (await waitFor("!!document.querySelector('.pf-screen .pg-cz-go')", 20000)) {
      await press(`${tag} the profile's CUSTOMIZE YOUR CARD`, '.pf-screen .pg-cz-go', "!!document.querySelector('.vl-dress')", {
        after: async () => { await p.keyboard.press('Escape'); await waitFor("!document.querySelector('.vl-dress')", 4000); await sleep(400); } });
      // (+ THE MOVED TUBE: the same tube nudged 6 px between the touch + the lift — a layout shift under a still finger)
      if (noClick) {
        const s0 = await tw();
        const r = await p.evaluate(async () => {
          const b = document.querySelector('.pf-screen .pg-cz-go'), q = b.getBoundingClientRect(), x = q.left + q.width / 2, y = q.top + q.height / 2;
          const ev = t => b.dispatchEvent(new PointerEvent(t, { bubbles: true, cancelable: true, composed: true, pointerId: 92, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y }));
          ev('pointerdown'); await new Promise(r2 => setTimeout(r2, 50)); b.style.transform = 'translateY(6px)'; await new Promise(r2 => setTimeout(r2, 63)); ev('pointerup');
          await new Promise(r2 => setTimeout(r2, 500)); b.style.transform = ''; return !!document.querySelector('.vl-dress');
        });
        const s1 = await tw();
        ok(r && s1.pressed - s0.pressed === 1 && s1.rescues === s0.rescues, `${tag} CUSTOMIZE YOUR CARD moved 6 px under a still finger (held 113 ms): it ACTS (${r ? 'opened' : 'NEVER opened'}; rescues +${s1.rescues - s0.rescues})`);
        await p.keyboard.press('Escape'); await waitFor("!document.querySelector('.vl-dress')", 4000); await sleep(400);
      }
      // ---- CITY B's add-on (Nov 15 1:16 am — a LOST TAP on the profile's BACK: a FRIENDS update re-built the box, the badge + the card slot
      // while the finger was down): BACK pressed, a friends update lands mid-press (friends.js#setBadge → every subscriber), the lift →
      // BACK acts ONCE, nothing under the finger re-built (0 mutations in the friends box, its count, the card slot, the YOU tab between
      // the touch + the lift), 0 rescues
      if (noClick && await waitFor("!!document.querySelector('.pf-screen .pf-back')", 8000)) {
        const s0 = await tw();
        const r = await p.evaluate(async () => {
          const F = await import('/js/profile/friends.js');
          const b = document.querySelector('.pf-screen .pf-back'), q = b.getBoundingClientRect(), x = q.left + q.width / 2, y = q.top + q.height / 2;
          let muts = 0; const mo = new MutationObserver(l => { muts += l.length; });
          for (const e of document.querySelectorAll('.fr-body, .fr-count, .pf-card-slot, .nd-tab')) mo.observe(e, { childList: true, subtree: true, characterData: true });
          const ev = t => b.dispatchEvent(new PointerEvent(t, { bubbles: true, cancelable: true, composed: true, pointerId: 93, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y }));
          ev('pointerdown'); await new Promise(r2 => setTimeout(r2, 40));
          F.setBadge(F.pendingBadge() + 3); await new Promise(r2 => setTimeout(r2, 73));
          const under = muts; mo.disconnect(); ev('pointerup');
          await new Promise(r2 => setTimeout(r2, 600));
          return { under, view: window.__arcade.state.view };
        });
        const s1 = await tw();
        ok(r.view !== 'profile' && r.under === 0 && s1.pressed - s0.pressed === 1 && s1.rescues === s0.rescues, `${tag} the profile's BACK with a FRIENDS update mid-press: it ACTS once (${r.view}), ${r.under} re-renders under the finger, rescues +${s1.rescues - s0.rescues}`);
      }
    } else ok(false, `${tag} the profile's CUSTOMIZE YOUR CARD on screen (${await p.evaluate("(() => { const o = document.querySelector('.pf-screen'); return o ? [...o.querySelectorAll('.btn')].map(b => b.className + ' ' + b.textContent.trim().slice(0, 20)).join(' | ') + ' :: ' + o.textContent.replace(/\s+/g, ' ').slice(0, 160) : 'no .pf-screen; view ' + window.__arcade.state.view; })()")})`);
    await home();
    // ---- THE DAILY SCREEN: SCORES → ALL TIME ↔ TODAY, the FRIENDS box, the TODAY tab, BACK
    await p.evaluate(() => import('/js/store.js').then(m => m.setState({ daily: { v: 'screen', tab: 'scores' } })));
    if (await waitFor("!!document.querySelector('.dy-scope-b')", 15000)) {
      await p.evaluate("window.__wpSc = (document.querySelector('.dy-scope-b.is-on') || {}).textContent || ''");
      await press(`${tag} SCORES' scope tab (ALL TIME ↔ TODAY)`, '.dy-scope-b:not(.is-on)', "((document.querySelector('.dy-scope-b.is-on') || {}).textContent || '') !== window.__wpSc");
      if (await waitFor("!!document.querySelector('.dy-fbox')", 4000)) {
        await p.evaluate("window.__wpF = document.querySelector('.dy-fbox').getAttribute('aria-checked')");
        await press(`${tag} the FRIENDS box`, '.dy-fbox', "document.querySelector('.dy-fbox') && document.querySelector('.dy-fbox').getAttribute('aria-checked') !== window.__wpF");
      }
      await p.evaluate("document.querySelectorAll('.dy-tab').forEach(b => { if (/TODAY/.test(b.textContent)) b.dataset.wpT = '1'; })");
      await press(`${tag} the daily screen's TODAY tab`, '.dy-tab[data-wp-t]', "!!document.querySelector('.dy-ticket')");
      await press(`${tag} the daily screen's BACK`, '.dy-screen .dy-back', "!document.querySelector('.dy-overlay')");
    } else ok(false, `${tag} the DAILY screen opened`);
    await home();
  }

  // ---- CITY D — the add-on (Nov 15 10:43 am): SAVE YOUR KEY → SHARE lost its tap (iOS sent no click) and the rescue's synthetic click can't
  //      open a share sheet. A gesture control (data-act share / copy, data-gesture) acts INSIDE the touch's own lift — a user activation —
  //      never rescued. The phone's share + clipboard stubbed (they record the call + whether the page held a user activation then)
  await p.evaluate(() => {
    window.__shared = 0; window.__copied = null; window.__act = [];
    const ua = () => (navigator.userActivation ? navigator.userActivation.isActive : 'n/a');
    navigator.share = async () => { window.__shared++; window.__act.push(['share', ua()]); };
    try { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async t => { window.__copied = t; window.__act.push(['copy', ua()]); } } }); } catch { /* fine */ }
    const box = document.createElement('div');
    box.id = 'kp-test'; box.style.cssText = 'position:fixed;left:20px;right:20px;top:300px;z-index:99999;display:flex;gap:10px';
    box.innerHTML = '<button type="button" class="btn btn-ghost kp-share" data-act="share" style="flex:1;height:56px">SHARE</button><button type="button" class="btn btn-primary kp-copy" data-act="copy" style="flex:1;height:56px">COPY</button>';
    document.body.append(box);
    box.querySelector('.kp-share').onclick = () => import('/js/profile/bring.js').then(B => B.shareKey('NEON-TEST-KEY1'));
    box.querySelector('.kp-copy').onclick = () => import('/js/profile/bring.js').then(B => B.copyKey('NEON-TEST-KEY1'));
  });
  for (const noClick of [true, false]) {
    await p.evaluate(v => { window.__noClick = v; window.__shared = 0; window.__copied = null; window.__act = []; }, noClick);
    const tag = noClick ? '[iOS: NO click]' : '[the click arrives]';
    const s0 = await tw();
    const sh = await centre('#kp-test .kp-share'); await p.touchscreen.tap(sh.x, sh.y);
    await waitFor('window.__shared >= 1', 3000); await sleep(400);
    const cp = await centre('#kp-test .kp-copy'); await p.touchscreen.tap(cp.x, cp.y);
    await waitFor('!!window.__copied', 3000); await sleep(400);
    const r = await p.evaluate('({ shared: window.__shared, copied: window.__copied, act: window.__act })'), s1 = await tw();
    ok(r.shared === 1 && r.act.find(a => a[0] === 'share')?.[1] !== false && s1.rescues === s0.rescues, `${tag} SAVE YOUR KEY → SHARE: share() called ${r.shared}× inside the touch's lift (user activation: ${JSON.stringify(r.act.find(a => a[0] === 'share')?.[1])}) · rescues +${s1.rescues - s0.rescues}`);
    ok(r.copied === 'NEON-TEST-KEY1' && s1.rescues === s0.rescues, `${tag} SAVE YOUR KEY → COPY copies the key (${r.copied || 'nothing'}) · rescues +${s1.rescues - s0.rescues}`);
    table.push(`${noClick ? 'no click' : 'click on'} · SAVE YOUR KEY: share ${r.shared}× · copy ${r.copied ? 'ok' : 'LOST'}`);
  }
  await p.evaluate("document.getElementById('kp-test').remove(); window.__noClick = false");

  // ---- CITY E — THE TAPPABLE SHARE CARD: SHARE TODAY now shares a LINK (its preview = the day's card, uploaded while the screen opened —
  //      js/daily/share.js#prepShare's `upload`). The tap stays ONE share() call inside the touch's own lift (a real gesture), nothing awaited
  //      before it, never rescued; the share carries the url + the same line (no file)
  await p.evaluate(async () => {
    window.__shareArgs = []; window.__act = [];
    const ua = () => (navigator.userActivation ? navigator.userActivation.isActive : 'n/a');
    navigator.share = async a => { window.__shareArgs.push(a); window.__act.push(['share', ua()]); };
    navigator.canShare = () => true;
    const S = await import('/js/daily/share.js');
    window.__dyH = S.prepShare(async () => { const cv = document.createElement('canvas'); cv.width = S.SHARE_W; cv.height = S.SHARE_H; cv.getContext('2d').fillRect(0, 0, 10, 10); return { cv, name: 't.png', line: 'NEON SPEAKEASY DAILIES · neonspeakeasy.com', upload: async png => { window.__upBytes = png.size; return 'https://www.neonspeakeasy.com/api/daily?s=TESTcode0001'; } }; });
    await window.__dyH.ready();
    const box = document.createElement('div');
    box.id = 'dy-test'; box.style.cssText = 'position:fixed;left:20px;right:20px;top:300px;z-index:99999';
    box.innerHTML = '<button type="button" class="btn btn-ghost btn-block dy-share" data-gesture style="height:56px">SHARE TODAY</button>';
    document.body.append(box);
    box.querySelector('.dy-share').onclick = () => window.__dyH.send();
  });
  for (const noClick of [true, false]) {
    await p.evaluate(v => { window.__noClick = v; window.__shareArgs = []; window.__act = []; }, noClick);
    const tag = noClick ? '[iOS: NO click]' : '[the click arrives]';
    const s0 = await tw();
    const sh = await centre('#dy-test .dy-share'); await p.touchscreen.tap(sh.x, sh.y);
    await waitFor('window.__shareArgs.length >= 1', 3000); await sleep(500);
    const r = await p.evaluate('({ args: window.__shareArgs, act: window.__act, up: window.__upBytes })'), s1 = await tw();
    const a = r.args[0] || {};
    ok(r.args.length === 1 && a.url === 'https://www.neonspeakeasy.com/api/daily?s=TESTcode0001' && !a.files && /DAILIES/.test(a.text || '') && r.act[0]?.[1] !== false && s1.rescues === s0.rescues,
      `${tag} SHARE TODAY → ONE share() with the LINK (${a.url || 'none'}) + the line, no file, inside the touch's lift (user activation: ${JSON.stringify(r.act[0]?.[1])}) · the half card uploaded at prepare (${r.up} B) · rescues +${s1.rescues - s0.rescues}`);
    table.push(`${noClick ? 'no click' : 'click on'} · SHARE TODAY (the link): share ${r.args.length}×`);
  }
  await p.evaluate("document.getElementById('dy-test').remove(); window.__noClick = false");

  // ---- THE MOVED ROW (Safari 27.0.1: a shelf row slid 38 px under a still finger): down on the row → the row moves → the still finger lifts.
  //      The pointer events are the page's own here (a touch down, the move, the up — no click from anyone): the row still acts, once
  await p.evaluate("window.__noClick = true; document.querySelector('.nd-tab-play').click()");
  await waitFor("!!document.querySelector('.sh.is-in .nd-shelf-row')", 4000); await sleep(450);
  const s0 = await tw();
  const moved = await p.evaluate(async () => {
    const row = document.querySelector('.nd-shelf-row'), r = row.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const ev = (t, el, yy) => el.dispatchEvent(new PointerEvent(t, { bubbles: true, cancelable: true, composed: true, pointerId: 91, pointerType: 'touch', isPrimary: true, clientX: x, clientY: yy }));
    ev('pointerdown', row, y);
    await new Promise(r2 => setTimeout(r2, 60));
    row.style.transform = 'translateY(38px)';   // (the sheet still sliding: the row 38 px lower, the finger where it was)
    await new Promise(r2 => setTimeout(r2, 50));
    ev('pointerup', row, y);   // (the touch's capture: the lift comes back to the row it began on)
    await new Promise(r2 => setTimeout(r2, 400));
    row.style.transform = '';
    return { card: !!document.querySelector('.nd-card-sheet') };
  });
  const s1 = await tw();
  ok(moved.card && s1.pressed - s0.pressed === 1 && s1.rescues === s0.rescues, `THE MOVED ROW: a shelf row 38 px lower at the lift of a still finger still ACTS (its card ${moved.card ? 'opened' : 'NEVER opened'}; press +${s1.pressed - s0.pressed}, rescues +${s1.rescues - s0.rescues})`);
  await closeSheets();
  const st = await tw();
  ok(st.rescues === 0, `THE TAP WATCH over every case: ${st.rescues} rescues, ${st.lost} lost, ${st.pressed} presses acted, ${st.tookSwallowed} late clicks swallowed`);
  ok(!errs.length, `no page error (${errs.slice(0, 2).join(' | ') || 'none'})`);
} catch (e) {
  ok(false, `CRASH ${e && e.stack || e}`);
} finally {
  await browser.close();
}
console.log(`\nTHE PRESS TABLE (WebKit, 390 × 844):\n  ${table.join('\n  ')}`);
const bad = results.filter(r => !r.ok);
console.log(`\n${results.length - bad.length} / ${results.length} OK${bad.length ? ` — FAIL: ${bad.map(b => b.what).join(' · ')}` : ''}`);
process.exit(bad.length ? 1 : 0);
