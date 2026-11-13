// THE BOARD'S LOST TAB TAP (the owner's /admin LOST TAP, Nov 13, iPhone Safari, build cfb7eb0): a tap on THE BOARD's HOLD'EM tab was lost —
// THE BOARD re-rendered nav.bd-tabs, .bd-seg.bd-period, .bd-picks, h2.bd-label, span.bd-when and ol.bd-rows WHILE THE FINGER WAS DOWN (that
// order = board/view.js#pickTab → renderTabs → refresh: ANOTHER tab's switch landing mid-press — the previous tap's late / rescued click), so
// the HOLD'EM button under the finger was a NEW node at the lift and Safari sent no click. The fix: the tabs, the period switch, the RECORDS /
// CAREER switch and the picks are built ONCE and updated in place (classes + aria); the rows list is swapped only when no finger is down
// (ui/tapwatch.js#afterTap). The proof in Safari's engine (Playwright's WebKit from ~/wk, 402 × 874 @3, touch), THE RESCUE OFF (the raw page —
// a tap only the rescue saved would be a fail), on the real /board (the emulators + serve.mjs --emu — its /api/board answers delayed 300 ms):
//   for EACH tab T: the finger DOWN on T → mid-press ANOTHER tab's switch + a period flip land (the real path: __board.pick → pickTab /
//   refresh, their /api/board answers arrive while the finger is still down) → the finger UP → T is on; 0 lost taps (the watch's own
//   counter); nothing under nav.bd-tabs / the switches / the picks replaced while the finger was down — once with a held MOUSE press (the
//   engine's own "same node?" click rule) and once with a TOUCH tap (the switch fired from the touch's own pointerdown)
//   a ROW control (the row's ⋯): the finger down on it → a refresh + its answer land → up → its REPORT sheet opens (the rows are swapped only
//   after the tap)
//   the tab buttons, the period switch, the picks are the SAME nodes at the end as at the start (marked at the load)
//   node tests/integration/wk-board-taps.mjs [--base http://localhost:5173]
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { guardUrl } from './kit/live-guard.mjs';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const BASE = opt('base', process.env.E2E_BASE || 'http://localhost:5173');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const { webkit } = await import(pathToFileURL(process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs')).href);
const results = [];
const ok = (c, what) => { results.push({ ok: !!c, what }); console.log(c ? 'OK  ' : 'FAIL', what); };
const TABS = ['xp', 'dailies', 'overclock', 'prism', 'holdem'];
const VERDICT_MS = 550;   // (the watch judges a tap RESCUE_MS = 350 ms after the lift — its verdict window, then the count is final)

const browser = await webkit.launch();
const ctx = await browser.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
// every /api/board answer counted in the page (the view's data answer arriving = this counter moving)
await ctx.addInitScript(() => {
  window.__bdAns = 0;
  const f = window.fetch.bind(window);
  window.fetch = async (u, o) => { const r = await f(u, o); if (String(u).includes('/api/board')) r.clone().text().then(() => { window.__bdAns++; }).catch(() => {}); return r; };
});
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', e => errs.push(e.message));
// the answers arrive late (a real phone's network) — so they land while the finger is still down
await p.route(/\/api\/board\?/, async route => { await sleep(300); await route.continue().catch(() => {}); });
const waitFor = async (js, ms = 10000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* navigating */ } await sleep(40); } return false; };
const frames = () => p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));

await p.goto(guardUrl(`${BASE}/board`, 'wk-board-taps.mjs'));
const up = await waitFor("!!(window.__board && window.__tapwatch && document.querySelectorAll('.bd-tabs .bd-tab').length === 5 && !document.querySelector('.bd-rows.is-skel'))", 30000);
ok(up, 'THE BOARD is up (/board, the public page): five tabs, the first rows painted');
if (!up) { await browser.close(); process.exit(1); }
await p.evaluate('window.__tapwatch.rescue(false)');   // (THE RESCUE OFF: only the page's own click may land the tap)

// the controls marked at the load — the same nodes at the end
await p.evaluate(() => {
  const q = s => document.querySelector(s);
  window.__bdMark = { tabs: q('.bd-tabs'), tabBtns: [...document.querySelectorAll('.bd-tabs .bd-tab')], period: q('.bd-seg.bd-period'), periodBtns: [...document.querySelectorAll('.bd-period .bd-seg-b')], cat: q('.bd-ctrl .bd-seg:not(.bd-period)'), picks: q('.bd-picks') };
  // what is REPLACED under the controls (a removal anywhere under the tabs / the switches / the picks) — counted per press
  window.__bdCut = 0;
  const mo = new MutationObserver(l => { for (const m of l) if (m.removedNodes.length) window.__bdCut += m.removedNodes.length; });
  for (const el of [q('.bd-tabs'), q('.bd-ctrl'), q('.bd-picks')]) mo.observe(el, { childList: true, subtree: true });
});
const settled = () => waitFor("!window.__tapwatch.pressing() && !document.querySelector('.bd-rows.is-skel')", 10000).then(frames);
const centre = sel => p.evaluate(s => { const el = document.querySelector(s); if (!el) return null; const r = el.getBoundingClientRect(); return r.width && r.height ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; }, sel);
const tabSel = id => `.bd-tabs .bd-tab[data-id="${id}"]`;
const st = () => p.evaluate('({ tab: window.__board.state().tab, period: window.__board.state().period, lost: window.__tapwatch.stats().lost, ans: window.__bdAns, cut: window.__bdCut })');
const fresh = () => p.evaluate(() => import('/js/profile/api.js').then(m => m.clearBoardCache()));
const summary = { mouse: [0, 0], touch: [0, 0], lost: 0 };

/** the finger DOWN on tab T, ANOTHER tab's switch + a period flip land with their answers, the finger UP → T on, nothing lost / replaced */
async function pressCase(kind, T, from, X) {
  await p.evaluate(([f]) => window.__board.pick(f), [from]);
  await settled();
  await fresh();
  const c = await centre(tabSel(T));
  const s0 = await st();
  const flip = s0.period === 'week' ? 'all' : 'week';
  if (kind === 'mouse') {
    await p.mouse.move(c.x, c.y);
    await p.mouse.down();
    await p.evaluate(([x, fl]) => { window.__board.pick(x); window.__board.pick(null, null, fl); }, [X, flip]);
    await waitFor(`window.__bdAns >= ${s0.ans + 2}`, 8000);   // (both data answers arrived — the finger still down)
    await frames();
    ok(await p.evaluate('window.__tapwatch.pressing()'), `${kind} ${T}: the finger still down while ${X.toUpperCase()}'s switch + the ${flip.toUpperCase()} flip + their answers landed`);
    await p.mouse.up();
  } else {
    // the switch fired from the touch's OWN pointerdown (between the down and the up of one real tap)
    await p.evaluate(([x, fl]) => { document.addEventListener('pointerdown', () => { window.__board.pick(x); window.__board.pick(null, null, fl); }, { capture: true, once: true }); }, [X, flip]);
    await p.touchscreen.tap(c.x, c.y);
  }
  const hit = await waitFor(`window.__board.state().tab === ${JSON.stringify(T)}`, 4000);
  await sleep(VERDICT_MS);
  await settled();
  const s1 = await st();
  const lost = s1.lost - s0.lost, cut = s1.cut - s0.cut;
  summary[kind][hit && !lost && !cut ? 0 : 1]++;
  summary.lost += lost;
  ok(hit && lost === 0 && cut === 0, `${kind} ${T} (from ${from.toUpperCase()}, ${X.toUpperCase()} + ${flip.toUpperCase()} landing mid-press): ${hit ? `${T.toUpperCase()} is on` : `NOT switched — still ${s1.tab}`} · lost taps ${lost} · nodes replaced under the controls ${cut}${lost ? ` — the watch: ${(await p.evaluate('window.__tapwatch.last()')).split('\n').filter(l => /re-rendered|node at the lift/.test(l)).join(' | ')}` : ''}`);
}

for (const kind of ['mouse', 'touch']) {
  for (let i = 0; i < TABS.length; i++) {
    const T = TABS[i];
    // from DAILIES (it has picks — the owner's report replaced .bd-picks too) unless T is DAILIES; the switch landing mid-press = another tab
    const from = T === 'dailies' ? 'overclock' : 'dailies';
    const X = TABS.find((t, j) => j > i && t !== from) || TABS.find(t => t !== T && t !== from);
    await pressCase(kind, T, from, X);
  }
}

// a ROW control: the row's ⋯ (REPORT on the public page) — a refresh lands while the finger is on it
{
  await p.evaluate(() => window.__board.pick('xp', null, 'week'));
  await settled();
  const has = await waitFor("!!document.querySelector('.bd-rows .bd-row .bd-more')", 5000);
  if (!has) console.log('note ROW: no row with a ⋯ on XP · THIS WEEK on these emulators — the row case skipped (play a match to put a name up)');
  else {
    await fresh();
    const c = await centre('.bd-rows .bd-row .bd-more');
    const s0 = await st();
    const row0 = await p.evaluateHandle(() => document.querySelector('.bd-rows .bd-row .bd-more'));
    await p.mouse.move(c.x, c.y);
    await p.mouse.down();
    await p.evaluate(() => window.__board.pick(null, null, 'all'));
    await waitFor(`window.__bdAns >= ${s0.ans + 1}`, 8000);
    await frames();
    const kept = await p.evaluate(b => b.isConnected, row0);
    await p.mouse.up();
    const opened = await waitFor("!!document.querySelector('.sh.bd-rep')", 4000);
    await sleep(VERDICT_MS);
    const s1 = await st();
    const swapped = await waitFor("window.__board.state().period === 'all' && !document.querySelector('.bd-rows.is-skel')", 6000);
    ok(opened && kept && s1.lost === s0.lost, `ROW ⋯: a refresh + its answer landed while the finger was on it → the row kept under the finger (${kept}) · its REPORT sheet opened (${opened}) · lost taps ${s1.lost - s0.lost}`);
    ok(swapped, `ROW ⋯: the rows swapped to ALL TIME after the tap (${swapped})`);
    await p.evaluate(() => import('/js/ui/sheet.js').then(m => m.closeAllSheets())).catch(() => {});
    await waitFor("!document.querySelector('.sh.bd-rep')", 4000);
  }
}

// the switches + picks still work in place: OVERCLOCK → CAREER (touch) → a chip (touch); ONE row of picks showing, the right chip lit
{
  await p.evaluate(() => window.__board.pick('overclock', 'records', 'week'));
  await settled();
  const tap = async sel => { const c = await centre(sel); if (c) await p.touchscreen.tap(c.x, c.y); return !!c; };
  const tc = await tap('.bd-ctrl .bd-seg:not(.bd-period) .bd-seg-b:not(.is-on)');
  const career = await waitFor("window.__board.state().cat === 'career'", 4000);
  await settled();
  const chipOff = '.bd-picks .bd-chips:not([hidden]) .bd-chip:not(.is-on)';
  const hasChip = await p.evaluate(s => !!document.querySelector(s), chipOff);
  const b0 = await p.evaluate('window.__board.state().board');
  if (hasChip) await tap(chipOff);
  const moved = !hasChip || await waitFor(`window.__board.state().board !== ${JSON.stringify(b0)}`, 4000);
  await settled();
  const look = await p.evaluate(() => { const rows = [...document.querySelectorAll('.bd-picks .bd-chips')].filter(r => !r.hidden && getComputedStyle(r).display !== 'none'); const on = document.querySelector('.bd-picks .bd-chips:not([hidden]) .bd-chip.is-on'); return { shown: rows.length, onCount: rows[0] ? rows[0].querySelectorAll('.bd-chip.is-on').length : 0, onIsBoard: !!on, catOn: document.querySelector('.bd-ctrl .bd-seg:not(.bd-period) .bd-seg-b.is-on').textContent }; });
  ok(tc && career && moved && look.catOn === 'CAREER' && (!hasChip || (look.shown === 1 && look.onCount === 1)), `in place: RECORDS → CAREER by a tap (${career}, lit ${look.catOn}) · a chip tap moved the board (${hasChip ? moved : 'no second chip'}) · ${look.shown} row of picks showing, ${look.onCount} chip lit`);
}

// the controls are the SAME nodes they were at the load
const same = await p.evaluate(() => {
  const M = window.__bdMark, q = s => document.querySelector(s);
  const tabBtns = [...document.querySelectorAll('.bd-tabs .bd-tab')], periodBtns = [...document.querySelectorAll('.bd-period .bd-seg-b')];
  return {
    tabs: q('.bd-tabs') === M.tabs,
    tabBtns: tabBtns.length === M.tabBtns.length && tabBtns.every((b, i) => b === M.tabBtns[i]),
    period: q('.bd-seg.bd-period') === M.period,
    periodBtns: periodBtns.length === M.periodBtns.length && periodBtns.every((b, i) => b === M.periodBtns[i]),
    cat: q('.bd-ctrl .bd-seg:not(.bd-period)') === M.cat,
    picks: q('.bd-picks') === M.picks,
  };
});
ok(Object.values(same).every(Boolean), `the SAME nodes at the end as at the load: ${Object.entries(same).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
// the selected state painted in place: one tab on (aria-pressed), one period on (aria-selected)
const sel = await p.evaluate(() => ({ tabsOn: document.querySelectorAll('.bd-tab.is-on').length, pressed: document.querySelectorAll('.bd-tab[aria-pressed="true"]').length, onIsState: document.querySelector('.bd-tab.is-on').dataset.id === window.__board.state().tab, periodOn: document.querySelectorAll('.bd-period .bd-seg-b.is-on[aria-selected="true"]').length }));
ok(sel.tabsOn === 1 && sel.pressed === 1 && sel.onIsState && sel.periodOn === 1, `the selected state in place: ${sel.tabsOn} tab lit (${sel.pressed} aria-pressed, the state's tab: ${sel.onIsState}) · ${sel.periodOn} period lit`);
ok(errs.length === 0, `no page error (${errs.slice(0, 2).join(' | ') || 'none'})`);
console.log(`THE TAP TABLE: mouse ${summary.mouse[0]} landed / ${summary.mouse[1]} failed · touch ${summary.touch[0]} landed / ${summary.touch[1]} failed · lost taps (the watch, rescue off) ${summary.lost}`);

await browser.close();
const bad = results.filter(r => !r.ok);
console.log(`wk-board-taps: ${results.length - bad.length}/${results.length} passed`);
process.exit(bad.length ? 1 : 0);
