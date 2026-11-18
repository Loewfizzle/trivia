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
import { dailyTestMode, DAILY_MODE_FIX } from './kit/daily-mode.mjs';

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
      const VIS = "[...document.querySelectorAll('.bd-period-b')].filter(b => b.getBoundingClientRect().width > 0)";
      if (await waitFor(`${VIS}.some(b => b.getAttribute('aria-selected') === 'false')`, 4000)) {
        await p.evaluate(`window.__wpSeg = (${VIS}.find(b => b.getAttribute('aria-selected') === 'false') || {}).textContent || ''`);
        await press(`${tag} THE BOARD's period tab`, { js: `${VIS}.find(b => b.textContent === window.__wpSeg)` }, "[...document.querySelectorAll('.bd-period-b')].some(b => b.textContent === window.__wpSeg && b.getAttribute('aria-selected') === 'true')");
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
    // ---- CITY G — A CONFIRM CONTROL (☰ → LEAVE ROOM's "TAP AGAIN TO LEAVE" — 2 lost taps on the owner's phone, both rescued): the first tap
    //  ARMS it (the label swapped, .is-confirm), the SECOND acts — each on its OWN press + lift (ui/components.js#confirmTap → data-press)
    await p.evaluate(() => import('/js/ui/components.js').then(m => { window.__cfN = 0; const r = m.row({ icon: 'leave', label: 'Leave room', danger: true, cls: 'gm-leave wp-cf', confirm: 'TAP AGAIN TO LEAVE', onClick: () => { window.__cfN++; } }); r.style.cssText = 'position:fixed;left:20px;right:20px;top:320px;z-index:99999'; document.body.append(r); }));
    await press(`${tag} a CONFIRM row's first tap (arms it: TAP AGAIN TO LEAVE)`, '.wp-cf', "document.querySelector('.wp-cf').classList.contains('is-confirm') && window.__cfN === 0");
    await press(`${tag} the CONFIRM row's SECOND tap (acts once)`, '.wp-cf', 'window.__cfN === 1');
    await p.evaluate(() => { const r = document.querySelector('.wp-cf'); if (r) r.remove(); });
    // ---- THE DAILY SCREEN: SCORES → ALL TIME ↔ TODAY, the FRIENDS box, the TODAY tab, BACK
    // (CITY G: its evening "red" was a server without DAILY_TEST=1 — the dailies switched off on fresh emulators: said, never a timeout)
    if (!(await dailyTestMode(p))) { console.log(`FATAL ${DAILY_MODE_FIX}`); process.exit(1); }
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
  //      before it, never rescued; the share carries the url ONLY (FIXES R1 — the owner: no text; no file)
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
    // (FIXES R1 — THE OWNER: the LINK ONLY — no text in the message; the preview carries the card)
    ok(r.args.length === 1 && a.url === 'https://www.neonspeakeasy.com/api/daily?s=TESTcode0001' && !a.files && !('text' in a) && r.act[0]?.[1] !== false && s1.rescues === s0.rescues,
      `${tag} SHARE TODAY → ONE share() with the LINK ONLY (${a.url || 'none'}; text: ${JSON.stringify(a.text)}), no file, inside the touch's lift (user activation: ${JSON.stringify(r.act[0]?.[1])}) · the half card uploaded at prepare (${r.up} B) · rescues +${s1.rescues - s0.rescues}`);
    table.push(`${noClick ? 'no click' : 'click on'} · SHARE TODAY (the link): share ${r.args.length}×`);
  }
  await p.evaluate("document.getElementById('dy-test').remove(); window.__noClick = false");

  // ---- FIXES R1 — THE REVIEW A12: a press-act with NO click from iOS leaves `took` (the swallow window, 800 ms); a SECOND tap in that window on
  //      a control that needs its REAL click (a plain button: no data-press, not implicit) at the same spot — its click must ARRIVE (it was
  //      swallowed as the first tap's tail)
  await p.evaluate(() => {
    window.__plain = 0;
    const box = document.createElement('div');
    box.id = 'a12-test'; box.style.cssText = 'position:fixed;left:20px;right:20px;top:360px;z-index:99999';
    box.innerHTML = '<button type="button" class="btn btn-ghost btn-block a12-first" style="height:56px">FIRST</button>';
    document.body.append(box);
    box.querySelector('.a12-first').onclick = () => { box.innerHTML = '<button type="button" class="a12-plain" style="width:100%;height:56px">PLAIN</button>'; box.querySelector('.a12-plain').onclick = () => { window.__plain++; }; };
  });
  { const c1 = await centre('#a12-test .a12-first');
    await p.evaluate("window.__noClick = true"); await p.touchscreen.tap(c1.x, c1.y);
    await waitFor("!!document.querySelector('#a12-test .a12-plain')", 2000);
    await p.evaluate("window.__noClick = false"); await sleep(150);
    const s0 = await tw(); const c2 = await centre('#a12-test .a12-plain'); await p.touchscreen.tap(c2.x, c2.y); await sleep(450);
    const r = await p.evaluate('window.__plain'), s1 = await tw();
    ok(r === 1 && s1.tookSwallowed === s0.tookSwallowed, `A12 — a second tap inside the last press-act's window on a control needing its REAL click: it ACTED ${r}× (swallowed +${s1.tookSwallowed - s0.tookSwallowed})`);
    table.push(`A12 · the second tap's real click: ${r === 1 ? 'arrived' : 'SWALLOWED'}`); }
  await p.evaluate("document.getElementById('a12-test').remove(); window.__noClick = false");

  // ---- FIXES R1 — THE REVIEW A13: a SHARE control re-rendered between the finger's down and up (a repaint lands mid-press) — its twin under
  //      the lift acts INSIDE the lift (share() once, user activation), never lost, never rescued
  await p.evaluate(() => {
    window.__shared13 = 0;
    navigator.share = async () => { window.__shared13++; };
    const box = document.createElement('div');
    box.id = 'a13-test'; box.style.cssText = 'position:fixed;left:20px;right:20px;top:360px;z-index:99999';
    const paint = () => { box.innerHTML = '<button type="button" class="btn btn-ghost a13-share" data-gesture style="width:100%;height:56px">SHARE</button>'; box.querySelector('.a13-share').onclick = () => navigator.share({ url: 'https://www.neonspeakeasy.com/' }); };
    paint(); window.__a13paint = paint;
    document.body.append(box);
  });
  for (const noClick of [true, false]) {
    await p.evaluate(v => { window.__noClick = v; window.__shared13 = 0; }, noClick);
    const c = await centre('#a13-test .a13-share'), s0 = await tw();
    // (the finger down → the control re-rendered → up: a CDP-style down / up pair so the repaint lands between them)
    await p.evaluate(({ x, y }) => { const t = document.elementFromPoint(x, y); const o = { bubbles: true, cancelable: true, pointerId: 77, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y }; t.dispatchEvent(new PointerEvent('pointerdown', o)); window.__a13paint(); const t2 = document.elementFromPoint(x, y); t2.dispatchEvent(new PointerEvent('pointerup', o)); }, c);
    await sleep(600);
    const r = await p.evaluate('window.__shared13'), s1 = await tw();
    ok(r === 1 && s1.rescues === s0.rescues, `A13 ${noClick ? '[iOS: NO click]' : '[the click arrives]'} — a SHARE re-rendered mid-press: its twin acted ${r}× at the lift · rescues +${s1.rescues - s0.rescues}`);
    table.push(`A13 · ${noClick ? 'no click' : 'click on'} · the re-rendered share: ${r}×`);
  }
  await p.evaluate("document.getElementById('a13-test').remove(); window.__noClick = false");

  // ---- FIXES R2 — GROUP 1: a LOST TAP on the heads-up message's ✕ (button.sh-msg-x "Dismiss heads up", build 0973fed — iOS sent no click):
  //      it acts on its own press + lift now (data-press)
  await p.evaluate("window.__noClick = true");
  await press('[iOS: NO click] the heads-up message\'s ✕', '.sh-msg-x', "!document.querySelector('.sh-msg:not(.is-out)')",
    { before: () => p.evaluate(() => import('/js/ui/toast.js').then(m => m.toast('Heads up — a test message', 'warn', 20000))) });
  await p.evaluate("window.__noClick = false");

  // ---- FIXES R2 — the owner's add-on (Nov 15 7:36 pm): a SCORES row's slim card opens that player's page (THE BOARD's opener) — one touch, iOS's
  //      click dropped, press + lift; and THE REVIEW A8: a touch that only STOPS a scrolling list (a fling still moving) never opens the row
  { const { streakDay } = await import('../../js/core/streak.js');
    const day = streakDay(Date.now()), fake = `wpz${Date.now() % 100000}`;
    await dbPut(`profiles/${fake}`, { n: 'ZEDDY', a: 'star', c: 'cyan', x: 900 });
    const full = `${fake}f`;   // (a FULL player for the shots: a worn card + three achievements)
    await dbPut(`profiles/${full}`, { n: 'FULLY', a: 'crown', c: 'gold', x: 40000, cd: 'card-velvet' });
    await dbPut(`pstats/${full}/ac`, { 'first-round': 1, 'the-regular': 2, 'full-house': 3 }); await dbPut(`pstats/${full}/it`, { 'card-velvet': 1 });
    await dbPut(`dly/password/${day}/t`, { v: 1, rows: [{ k: fake, s: 3, at: Date.now() - 60000 }, { k: full, s: 5, at: Date.now() - 50000 }] });
    await p.evaluate(() => { try { for (const k of Object.keys(localStorage)) if (/dy:scores/.test(k)) localStorage.removeItem(k); } catch { /* fine */ } });
    await home();
    await p.evaluate(() => import('/js/store.js').then(m => m.setState({ daily: { v: 'screen', tab: 'scores' } })));
    await waitFor("!!document.querySelector('.dy-scope-b')", 15000);
    // (SCORES → TODAY: EVERYONE · TODAY lists the seeded finisher)
    await p.evaluate("document.querySelectorAll('.dy-scope-b').forEach(b => { if (/TODAY/.test(b.textContent) && !b.classList.contains('is-on')) b.click(); })");
    const ROW = "document.querySelector('.dy-every-today .dy-card[role=\"button\"][aria-label^=\"ZEDDY\"]')";
    const there = await waitFor(`!!${ROW}`, 12000);
    if (there && process.env.SHOTS) { await sleep(800); await p.screenshot({ path: join(process.env.SHOTS, 'scores-today-row-390.png') }); }
    ok(there, `SCORES → TODAY: the EVERYONE row is a tappable card (${there ? await p.evaluate(`${ROW}.getAttribute('aria-label')`) : 'no row'})`);
    if (there) {
      await p.evaluate("window.__noClick = true");
      await press('[iOS: NO click] a SCORES row → THAT PLAYER\'S PAGE', { js: ROW }, "!!document.querySelector('.vl-full.pp')");
      if (process.env.SHOTS) {
        await sleep(900); await p.screenshot({ path: join(process.env.SHOTS, 'player-page-bare-390.png') });   // (no card, no achievements)
        await p.keyboard.press('Escape'); await waitFor("!document.querySelector('.vl-full.pp')", 3000); await sleep(400);
        const F = "document.querySelector('.dy-every-today .dy-card[role=\"button\"][aria-label^=\"FULLY\"]')";
        if (await waitFor(`!!${F}`, 4000)) { const c = await centre({ js: F }); await p.touchscreen.tap(c.x, c.y); await waitFor("!!document.querySelector('.vl-full.pp[data-state=\"card\"]')", 6000); await sleep(1400); await p.screenshot({ path: join(process.env.SHOTS, 'player-page-full-390.png') }); }
        else console.log('   (the FULLY row never showed — no full shot)');
        await p.evaluate("window.__noClick = true");
      }
      await p.keyboard.press('Escape'); await waitFor("!document.querySelector('.vl-full.pp')", 3000);
      if (!await waitFor(`!!${ROW}`, 3000)) {   // (the Esc took the daily screen too: back to SCORES → TODAY)
        await p.evaluate(() => import('/js/store.js').then(m => m.setState({ daily: { v: 'screen', tab: 'scores' } })));
        await waitFor("!!document.querySelector('.dy-scope-b')", 15000);
        await p.evaluate("document.querySelectorAll('.dy-scope-b').forEach(b => { if (/TODAY/.test(b.textContent) && !b.classList.contains('is-on')) b.click(); })");
        await waitFor(`!!${ROW}`, 12000);
      }
      await sleep(400);
      // A8 — a FLING still moving: the list scrolls 2 px each frame, the finger lands on the row (where it is at that moment) mid-scroll
      const c = await centre({ js: ROW });
      await p.evaluate(sel => { const row = (0, eval)(sel); let sc = row.parentElement; while (sc && !/auto|scroll/.test(getComputedStyle(sc).overflowY)) sc = sc.parentElement; sc = sc || document.scrollingElement; if (sc.scrollHeight <= sc.clientHeight + 4) { const pad = document.createElement('div'); pad.id = 'a8-pad'; pad.style.height = '1600px'; sc.append(pad); } sc.scrollTop = Math.max(1, sc.scrollTop); window.__flingOn = true; const step = () => { if (!window.__flingOn) return; sc.scrollTop += 2; requestAnimationFrame(step); }; requestAnimationFrame(step); window.__fling = 0; window.__flingEl = sc.className || sc.tagName; }, ROW);
      // (the FLING's finger: down on the list, dragged 90 px, then the browser takes it for the scroll — pointercancel, as iOS sends it)
      await p.evaluate(() => { const el = document.querySelector('.dy-scroll') || document.body, o = { pointerId: 77, pointerType: 'touch', isPrimary: true, bubbles: true, clientX: 60, clientY: 600 };
        el.dispatchEvent(new PointerEvent('pointerdown', o)); el.dispatchEvent(new PointerEvent('pointermove', { ...o, clientY: 510 })); el.dispatchEvent(new PointerEvent('pointercancel', { ...o, clientY: 510 })); });
      await sleep(300);
      const s0 = await tw();
      console.log('   (the fling just before the tap:', JSON.stringify(await p.evaluate('window.__tapwatch.scrolls()')), ')');
      await p.evaluate("window.__noClick = false");
      const c2 = await p.evaluate(sel => { const r = (0, eval)(sel).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, ROW);   // (where the row is NOW — it moves with the fling)
      await p.touchscreen.tap(c2.x, c2.y);
      await sleep(900);
      await p.evaluate("window.__flingOn = false; document.getElementById('a8-pad') && document.getElementById('a8-pad').remove()");
      const s1 = await tw(), opened = await p.evaluate("!!document.querySelector('.vl-full.pp')");
      ok(!opened && s1.pressed === s0.pressed && s1.rescues === s0.rescues && s1.stoppers > s0.stoppers, `A8 — a touch that STOPS a scrolling list (${await p.evaluate('window.__flingEl')}): the row did NOT open (${opened ? 'OPENED' : 'closed'}) · press +${s1.pressed - s0.pressed} · rescues +${s1.rescues - s0.rescues} · stoppers +${s1.stoppers - s0.stoppers}`);
      table.push(`A8 · a fling-stop on a SCORES row: ${opened ? 'OPENED' : 'nothing'}`);
      if (opened) await p.keyboard.press('Escape');
    }
    // (the seeded day's top + the two profiles go — e2e-daily counts today's EVERYONE list)
    await dbPut(`dly/password/${day}/t`, null); await dbPut(`profiles/${fake}`, null); await dbPut(`profiles/${full}`, null); await dbPut(`pstats/${full}`, null);
    await home(); }

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
