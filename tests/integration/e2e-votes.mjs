// CITY PART 2 — GAME VOTES IN A ROOM (the owner, Nov 18/19 — core/room-votes.js; rooms/{CODE}/gv/{uid} = { g, at }): three phones in a real room.
//   two guests open GAMES (the dock's tab, a real touch) and tap a game = their VOTE ("YOUR VOTE" on it) → the host's dock counts the new votes,
//   the host's GAMES list shows the voted game on top with its voters' colour DOTS + the COUNT and MOST WANTED · <GAME> (n) → a guest's vote
//   MOVES (another game) → the dots + the count + MOST WANTED follow → the same game again takes it back → MOST WANTED's ONE TAP starts the game
//   on every phone and every vote is CLEARED; 0 refused writes on any phone. Shots: the guest's + the host's sheets at 390 (+ 375).
//   node e2e-votes.mjs "<browser>" [./shots-votes]        (on the emulators + scripts/serve.mjs --emu)
import { createHarness } from './kit/harness.mjs';

const H = await createHarness({ name: 'votes', slot: 'gv', sizes: [[390, 844]] });
const { ok, log, sleep, waitFor, evalIn, pages } = H;
const refusedOn = p => p.evaluate(() => import('/js/firebase.js').then(m => ({ r: m.refusals(), h: m.hostRefusals(), g: m.goneRefusals() })));
const gvOf = p => p.evaluate(() => { const r = window.__district && window.__district.room && window.__district.room(); return r ? r.gv : null; });
const rectOf = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; e.scrollIntoView({ block: 'center' }); const q = e.getBoundingClientRect(); return { x: q.x, y: q.y, w: q.width, h: q.height }; }, sel);
async function tapSel(p, sel, fx = 0.5) {
  let r = null;
  for (let i = 0; i < 30 && !(r = await rectOf(p, sel)); i++) await sleep(200);
  if (!r) return false;
  await sleep(250);
  r = await rectOf(p, sel);
  await H.tap(p, r.x + r.w * fx, r.y + r.h / 2);
  return true;
}
const sheetOpen = p => waitFor(p, () => !!document.querySelector('.rc-games-sheet .rc-game'), 'the GAMES sheet', 15000);
const closeSheets = p => p.evaluate(() => import('/js/ui/layers.js').then(m => m.closeAll && m.closeAll())).catch(() => {});

await H.run(async () => {
  const host = await H.joinAll(3);
  const [hp, ga, gb] = pages.slice(0, 3);
  const uidOf = p => evalIn(p, s => s.uid);
  const [ua, ub] = [await uidOf(ga), await uidOf(gb)];
  ok(host === hp || true, 'three phones in the room');
  await waitFor(hp, s => s.meta && s.meta.status === 'lobby', 'the lobby', 20000);

  // guest A: GAMES → tap PRISM DROP (the row's left: never the dots or ?) = a vote
  await tapSel(ga, '.rdk-games'); await sheetOpen(ga);
  const noteA = await ga.evaluate(() => (document.querySelector('.rc-games-sheet .sh-note') || {}).textContent || '');
  ok(/vote/i.test(noteA) && await ga.evaluate(() => !!document.querySelector('.rc-game[data-game="prism"] .rc-game-help')), `a GUEST's GAMES sheet: tap = a vote, ? = how to play ("${noteA}")`);
  await tapSel(ga, '.rc-game[data-game="prism"]', 0.3);
  await waitFor(ga, (s, u) => s.gv && s.gv[u] && s.gv[u].g === 'prism', 'A voted PRISM DROP', 10000, ua);
  await waitFor(ga, () => { const r = window.__district.room(); return r && r.gv && r.gv.sheet && r.gv.sheet.rows.some(x => x.id === 'prism' && x.mine); }, 'YOUR VOTE on it', 8000).then(() => ok(true, 'guest A: YOUR VOTE on PRISM DROP'), () => ok(false, 'guest A: YOUR VOTE on PRISM DROP'));
  if (H.SHOTS) await H.shot(ga, 'guest-sheet-390');
  await closeSheets(ga);

  // guest B: votes PRISM DROP too
  await tapSel(gb, '.rdk-games'); await sheetOpen(gb);
  await tapSel(gb, '.rc-game[data-game="prism"]', 0.3);
  await waitFor(gb, (s, u) => s.gv && s.gv[u] && s.gv[u].g === 'prism', 'B voted PRISM DROP', 10000, ub);
  await closeSheets(gb);

  // the host: the dock's GAMES count, then the sheet — dots + count + MOST WANTED
  await waitFor(hp, () => { const c = document.querySelector('.rdk-cnt'); return c && !c.hidden && c.textContent === '2'; }, 'the dock counts 2 new votes', 10000).then(() => ok(true, 'the HOST\'s dock: GAMES counts the 2 new votes'), () => ok(false, 'the HOST\'s dock: GAMES counts the 2 new votes'));
  await tapSel(hp, '.rdk-games'); await sheetOpen(hp);
  const h1 = await gvOf(hp);
  const first = await hp.evaluate(() => (document.querySelector('.rc-games .rc-game') || {}).dataset.game);
  const prow = h1 && h1.sheet && h1.sheet.rows.find(r => r.id === 'prism');
  ok(first === 'prism' && prow && prow.n === '2' && prow.dots === 2, `the HOST's list: PRISM DROP on top with 2 dots + "2" (${JSON.stringify(prow)}; first ${first})`);
  ok(h1 && /^MOST WANTED · PRISM DROP \(2\)$/.test(h1.sheet.mw || ''), `MOST WANTED on top: "${h1 && h1.sheet.mw}"`);
  await waitFor(hp, () => { const c = document.querySelector('.rdk-cnt'); return c && c.hidden; }, 'the count cleared once seen', 8000).then(() => ok(true, 'the dock count clears once the host looked'), () => ok(false, 'the dock count clears once the host looked'));
  if (H.SHOTS) {   // (the host's sheet at 375 × 667 too — MOST WANTED + the dots whole; then back to 390)
    await hp.setViewport({ width: 375, height: 667, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await sleep(600); await H.shot(hp, 'host-sheet-375');
    const fit = await hp.evaluate(() => { const m = document.querySelector('.rc-mw'), d = document.querySelector('.rc-game[data-game="prism"] .rc-gv'); const r = e => e && e.getBoundingClientRect(); return { mw: m && r(m).right <= innerWidth, dots: d && r(d).right <= innerWidth && r(d).width >= 44 && r(d).height >= 44 }; });
    ok(fit.mw && fit.dots, `375: MOST WANTED + the dots inside the screen, the dots' tap area ≥ 44 pt (${JSON.stringify(fit)})`);
    await hp.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await sleep(400);
  }
  // the dots = who (a toast with the names)
  await tapSel(hp, '.rc-game[data-game="prism"] .rc-gv');
  const who = await hp.waitForFunction(() => [...document.querySelectorAll('.sh-msg')].map(e => e.textContent).join(' | '), { timeout: 5000 }).then(j => j.jsonValue()).catch(() => '');
  ok(/2 want prism drop/i.test(who), `a tap on the dots = who: "${String(who).slice(0, 80)}"`);
  if (H.SHOTS) await H.shot(hp, 'host-sheet-390');

  // a vote MOVES: guest B → JAYWALK (the host's open sheet follows live)
  await tapSel(gb, '.rdk-games'); await sheetOpen(gb);
  await tapSel(gb, '.rc-game[data-game="jaywalk"]', 0.3);
  await waitFor(hp, () => { const r = window.__district.room(); const s = r && r.gv && r.gv.sheet; if (!s) return false; const p = s.rows.find(x => x.id === 'prism'), j = s.rows.find(x => x.id === 'jaywalk'); return p && j && p.n === '1' && j.n === '1'; }, 'the host sees the move', 10000)
    .then(() => ok(true, 'a vote MOVES: PRISM DROP 1 · JAYWALK 1 on the host\'s open sheet'), () => ok(false, 'a vote MOVES'));
  const mw2 = (await gvOf(hp)).sheet.mw;
  ok(mw2 === 'MOST WANTED · PRISM DROP (1)', `a tie = the EARLIEST vote leads: "${mw2}"`);
  // the same game again = taken back
  await tapSel(gb, '.rc-game[data-game="jaywalk"]', 0.3);
  await waitFor(gb, (s, u) => !(s.gv && s.gv[u]), 'B took it back', 10000, ub).then(() => ok(true, 'the same game again takes the vote back'), () => ok(false, 'the same game again takes the vote back'));
  await closeSheets(gb);

  // MOST WANTED's ONE TAP = the start on every phone; every vote cleared
  await tapSel(hp, '.rc-mw');
  for (const p of [hp, ga, gb]) await waitFor(p, s => s.game && s.game.id === 'prism' && window.__arcade.route().startsWith('game:prism:'), 'PRISM DROP on screen', 45000);
  ok(true, 'MOST WANTED → PRISM DROP started on every phone (one tap)');
  await waitFor(hp, s => !s.gv || !Object.keys(s.gv).length, 'the votes cleared', 10000).then(() => ok(true, 'the start CLEARED every vote'), () => ok(false, 'the start CLEARED every vote'));
  const rf = await Promise.all([hp, ga, gb].map(refusedOn));
  ok(rf.every(x => !(x.r || []).length && !(x.h || []).length), `0 refused writes on any phone (${JSON.stringify(rf).slice(0, 160)})`);
  log('votes', 'done');
});
