// CITY PART 1 — ADD FRIEND ON THE PLAYER PAGE (the owner's iPhone, Nov 20 2:40 pm: "ADD FRIEND does nothing" — no message, never REQUESTED).
// The causes (both fixed): THE COVER (css/vault.css body.vl-covered) paused EVERY animation outside the page — THE MESSAGE's own entrance too,
// so every toast over the player page stood at its first frame (opacity 0) — success AND refusal; and a SCORES
// row opens the page with { id, dg } — the friend button sent an EMPTY target, the server refused it (its refusal: one more invisible toast).
// Every entry point, with REAL TOUCH TAPS (the tap watch's press + lift — never element.click()), and every outcome checked VISIBLE: the
// message's opacity 1, its animation running, above the page's layer; the bar's label following the answer; the server's own nodes.
//   (a) a ROOM's guest list → ADD FRIEND · CANCEL (REQUESTED → TAP AGAIN) · MORE → Add friend · the other side: ACCEPT
//   (b) THE BOARD's row ({ b, bid }) → ADD FRIEND        (c) a SCORES row's exact target ({ id, dg }) → ADD FRIEND, on a SLOW /api (busy first)
//   (d) a refusal (the server's 429) → its reason, visible on top · MORE → Remove friend → its message
//   node tests/integration/e2e-friend-page.mjs "<browser>" ./shots-friend-page      (emulators + node scripts/serve.mjs --emu; SHOTS=0)
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
process.env.GCLOUD_PROJECT ||= 'demo-arcade';
import { createHarness } from './kit/harness.mjs';
import { val, ref } from '../../api/_lib/fb.js';
import { streakDay } from '../../js/core/streak.js';
import { DAILIES } from '../../js/config.js';

const SIZES = [[390, 844], [375, 667]];
const H = await createHarness({ name: 'friend-page', slot: 'fp', sizes: SIZES });
const { pages, log, sleep, ok, waitFor, uids, shotAll } = H;
const ev = (p, js, ...a) => p.evaluate(js, ...a);
const waitJs = (p, js, what, t = 15000, ...a) => p.waitForFunction(js, { timeout: t }, ...a).then(() => true, () => { ok(false, `timed out: ${what}`); return false; });
const meOf = (p, i) => p.evaluate(s => JSON.parse(localStorage.getItem(`na:${s}:me`) || 'null'), `fp${i}`);

/** a REAL touch tap at the element's centre (the tap watch acts on the press + lift; iOS's path) */
async function touch(p, sel, what) {
  const box = await p.waitForFunction(s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return r.width && r.height ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; }, { timeout: 15000 }, sel).then(h => h.jsonValue(), () => null);
  if (!ok(!!box, `${what}: the control is on screen (${sel})`)) return false;
  await p.touchscreen.tap(box.x, box.y);
  return true;
}
/** THE MESSAGE matching `re` is SEEN: opacity 1 + its entrance running/finished (never paused at frame 0) + above every open layer */
const seen = (p, re, what, t = 8000) => p.waitForFunction(src => {
  const rx = new RegExp(src, 'i');
  const m = [...document.querySelectorAll('.sh-msg:not(.is-out)')].find(e => rx.test(e.textContent));
  if (!m) return false;
  const r = m.getBoundingClientRect();
  const paused = m.getAnimations().some(a => a.playState === 'paused');
  const zMsg = Number(getComputedStyle(m.parentElement).zIndex) || 0;
  const zTop = Math.max(0, ...[...document.querySelectorAll('[data-layer]')].map(e => Number(e.dataset.layer) || 0));
  return Number(getComputedStyle(m).opacity) > 0.97 && !paused && r.width > 100 && r.bottom > 0 && r.top < innerHeight && zMsg > zTop;
}, { timeout: t }, re.source).then(() => ok(true, `${what}: the message "${re.source}" is SEEN on top of the page`), () => ok(false, `${what}: the message "${re.source}" never showed on top`));
const label = p => ev(p, () => { const b = document.querySelector('.vl-full.pp .pp-main .fr-btn'); return b ? b.textContent.replace(/\s+/g, ' ').trim() : ''; });
const pageUp = p => waitJs(p, "(() => { const e = document.querySelector('.vl-full.pp'); return e && e.dataset.state === 'card' && !!e.querySelector('.pp-main .fr-btn, .pp-main .pp-invite'); })()", 'the player page with its bar', 20000);
const closePage = p => ev(p, () => { const b = document.querySelector('.vl-full.pp .vl-full-x'); if (b) b.click(); }).then(() => sleep(500));
async function guestPage(p, uid) {
  await ev(p, () => document.querySelector('.rdk-guests').click());
  await waitJs(p, `!!document.querySelector('.rg-row[data-uid="${uid}"]')`, 'the guest list');
  await sleep(450);
  await touch(p, `.rg-row[data-uid="${uid}"]`, 'the guest row');
  return pageUp(p);
}

await H.run(async () => {
  await H.joinAll(3);
  const [A, B, C] = pages;
  for (const i of [0, 1, 2]) await pages[i].waitForFunction(s => !!localStorage.getItem(`na:${s}:me`), { timeout: 25000 }, `fp${i}`);
  await waitFor(A, s => Object.values(s.players).every(p => p.pid), 'the seats carry profile ids', 20000);
  const [ma, mb, mc] = [await meOf(A, 0), await meOf(B, 1), await meOf(C, 2)];
  const [pa, pb, pc] = [ma.pid, mb.pid, mc.pid];
  ok(pa && pb && pc && new Set([pa, pb, pc]).size === 3, 'three profiles');

  // ---- (a) A ROOM: ALICE → GUESTS → BOB → ADD FRIEND (a real tap)
  await guestPage(A, uids[1]);
  ok(/ADD FRIEND/.test(await label(A)), `the bar offers ADD FRIEND (${await label(A)})`);
  await touch(A, '.vl-full.pp .pp-main .fr-btn', 'ADD FRIEND');
  await seen(A, /Friend request sent/, 'a room → ADD FRIEND');
  await waitJs(A, "/REQUESTED/.test((document.querySelector('.vl-full.pp .pp-main .fr-btn') || {}).textContent || '')", 'REQUESTED on the bar');
  ok(!!(await val(`pfr/${pb}/in/${pa}`)), 'the request landed on BOB\'s side (the server wrote it)');
  await shotAll(A, 'fp-01-room-requested');
  // CANCEL from the same bar: REQUESTED → TAP AGAIN TO CANCEL → ADD FRIEND
  await touch(A, '.vl-full.pp .pp-main .fr-btn', 'REQUESTED (1st tap)');
  await waitJs(A, "/TAP AGAIN/.test((document.querySelector('.vl-full.pp .pp-main .fr-btn') || {}).textContent || '')", 'TAP AGAIN TO CANCEL');
  await touch(A, '.vl-full.pp .pp-main .fr-btn', 'TAP AGAIN TO CANCEL');
  await waitJs(A, "/ADD FRIEND/.test((document.querySelector('.vl-full.pp .pp-main .fr-btn') || {}).textContent || '')", 'back to ADD FRIEND after CANCEL');
  ok(!(await val(`pfr/${pb}/in/${pa}`)), 'CANCEL: the request is gone from BOB\'s side');
  // MORE → Add friend (the sheet over the page must SHOW — the cover froze it at its first frame)
  await touch(A, '.vl-full.pp .pp-more', 'MORE');
  const sheetSeen = await A.waitForFunction(() => { const s = document.querySelector('.pp-more-sheet'); const sh = s && (s.querySelector('.sheet') || s); if (!sh) return false; const r = sh.getBoundingClientRect(); return r.top < innerHeight - 40 && r.bottom <= innerHeight + 2 && !sh.getAnimations().some(a => a.playState === 'paused') && Number(getComputedStyle(sh).opacity) > 0.97; }, { timeout: 6000 }).then(() => true, () => false);
  ok(sheetSeen, 'MORE: its sheet slides IN over the page (never frozen off screen)');
  await sleep(450);
  await shotAll(A, 'fp-02-more-sheet', SIZES.slice(0, 1));
  await touch(A, '.pp-more-sheet .pp-add', 'MORE → Add friend');
  await seen(A, /Friend request sent/, 'MORE → Add friend');
  await waitJs(A, "/REQUESTED/.test((document.querySelector('.vl-full.pp .pp-main .fr-btn') || {}).textContent || '')", 'the bar follows: REQUESTED');
  ok(!!(await val(`pfr/${pb}/in/${pa}`)), 'MORE → Add friend: the request landed');
  await closePage(A);
  // BOB: ALICE's page → ACCEPT on the bar
  await guestPage(B, uids[0]);
  ok(/ACCEPT/.test(await label(B)), `BOB's bar offers ACCEPT (${await label(B)})`);
  await touch(B, '.vl-full.pp .pp-main .fr-btn', 'ACCEPT');
  await seen(B, /are friends/, 'ACCEPT');
  await waitJs(B, "/FRIENDS/.test((document.querySelector('.vl-full.pp .pp-main .fr-btn') || {}).textContent || '')", 'FRIENDS on the bar');
  ok(!!(await val(`pfr/${pa}/f/${pb}`)) && !!(await val(`pfr/${pb}/f/${pa}`)), 'ACCEPT: friends on both sides');
  await shotAll(B, 'fp-03-accepted', SIZES.slice(0, 1));
  await closePage(B);

  // ---- (b) THE BOARD: CHARLIE on the XP board (3 counted plays) → ALICE taps his row → ADD FRIEND
  await ref('/').update({ [`pstats/${pc}/cp`]: 3, [`profiles/${pc}/m`]: 3, [`pstats/${pc}/xp`]: 777 });
  await C.evaluate(() => import('/js/profile/me.js').then(x => x.setShown(false)));
  await C.evaluate(() => import('/js/profile/me.js').then(x => x.setShown(true)));
  ok((await val(`lb/xp/all/${pc}`)) != null, 'CHARLIE is on THE BOARD (XP, all time)');
  const bidC = mc.profile && mc.profile.bid;
  await A.evaluate(() => import('/js/profile/api.js').then(m => m.clearBoardCache()));
  await A.evaluate(() => import('/js/store.js').then(m => m.setState({ view: 'board', boardGame: 'xp', boardBoard: 'xp', boardPeriod: 'all' })));
  await waitJs(A, `!!document.querySelector('.bd-row[data-id="${bidC}"] .bd-open')`, 'CHARLIE\'s row on the board', 25000);
  await sleep(900);
  await touch(A, `.bd-row[data-id="${bidC}"] .bd-open`, 'CHARLIE\'s board row');
  await pageUp(A);
  ok(/ADD FRIEND/.test(await label(A)), `THE BOARD → the bar offers ADD FRIEND (${await label(A)})`);
  await touch(A, '.vl-full.pp .pp-main .fr-btn', 'ADD FRIEND (THE BOARD)');
  await seen(A, /Friend request sent/, 'THE BOARD → ADD FRIEND');
  await waitJs(A, "/REQUESTED/.test((document.querySelector('.vl-full.pp .pp-main .fr-btn') || {}).textContent || '')", 'REQUESTED (THE BOARD)');
  ok(!!(await val(`pfr/${pc}/in/${pa}`)), 'THE BOARD → the request landed on CHARLIE\'s side');
  await shotAll(A, 'fp-04-board-requested');
  await closePage(A);
  await A.evaluate(() => import('/js/store.js').then(m => m.setState({ view: 'title' })));

  // ---- (c) SCORES: the row's exact target ({ id: the board id, dg }) on a SLOW /api — the tube is busy at once, then REQUESTED
  const dg = DAILIES[0].id;
  await ref(`dly/${dg}/${streakDay(Date.now())}/t`).set({ v: 1, rows: [{ k: pc, s: 7 }] });
  await B.evaluate(() => { const f = window.fetch; window.fetch = function (u, o) { if (String(u).includes('/api/profile') && o && /friendAdd/.test(String(o.body || ''))) return new Promise(r => setTimeout(r, 2500)).then(() => f.call(this, u, o)); return f.call(this, u, o); }; });
  await B.evaluate((id, g) => import('/js/profile/player-page.js').then(m => { m.openPlayer({ id, dg: g, row: { n: 'CHARLIE' } }); }), bidC, dg);
  await pageUp(B);
  ok(/ADD FRIEND/.test(await label(B)), `SCORES → the bar offers ADD FRIEND (${await label(B)})`);
  await touch(B, '.vl-full.pp .pp-main .fr-btn', 'ADD FRIEND (SCORES)');
  ok(await B.waitForFunction(() => { const b = document.querySelector('.vl-full.pp .pp-main .fr-btn'); return b && b.classList.contains('is-busy') && b.getAttribute('aria-busy') === 'true'; }, { timeout: 1200 }).then(() => true, () => false), 'a slow /api: the tube shows BUSY at once (never a dead tap)');
  await seen(B, /Friend request sent/, 'SCORES → ADD FRIEND (slow)', 12000);
  await waitJs(B, "/REQUESTED/.test((document.querySelector('.vl-full.pp .pp-main .fr-btn') || {}).textContent || '')", 'REQUESTED (SCORES)');
  ok(!!(await val(`pfr/${pc}/in/${pb}`)), 'SCORES → the request landed on CHARLIE\'s side (it was refused as an empty target before)');
  await closePage(B);

  // ---- (d) a REFUSAL is SEEN on top: the server's 429 (THE ANTI-SPAM limit) on CHARLIE's ACCEPT of BOB from the room → its sentence over the page
  await C.evaluate(() => { const f = window.fetch; window.fetch = function (u, o) { if (String(u).includes('/api/profile') && o && /friend(Add|Accept)/.test(String(o.body || ''))) return Promise.resolve(new Response(JSON.stringify({ error: 'rate', message: 'rate' }), { status: 429, headers: { 'content-type': 'application/json' } })); return f.call(this, u, o); }; });
  await guestPage(C, uids[1]);
  const before = await label(C);
  ok(/ACCEPT/.test(before), `CHARLIE's bar for BOB says ACCEPT — the SERVER's relation (BOB asked him from SCORES; the cached list never knew) (${before})`);
  await touch(C, '.vl-full.pp .pp-main .fr-btn', 'ACCEPT (refused)');
  await seen(C, /a lot of requests/, 'a refusal (429)');
  ok((await label(C)) === before, `a refusal: the bar keeps its label (${await label(C)})`);
  await shotAll(C, 'fp-05-refused', SIZES.slice(0, 1));
  await closePage(C);
  // MORE → Remove friend over the page (BOB + ALICE are friends): its message is seen
  await guestPage(A, uids[1]);
  await touch(A, '.vl-full.pp .pp-more', 'MORE (friends)');
  await sleep(450);
  await touch(A, '.pp-more-sheet .pp-remove', 'Remove friend (1st tap)');
  await sleep(300);
  await touch(A, '.pp-more-sheet .pp-remove', 'TAP AGAIN TO REMOVE');
  await seen(A, /removed/, 'MORE → Remove friend');
  ok(!(await val(`pfr/${pa}/f/${pb}`)), 'Remove: the friendship is gone');
  log('done');
});
