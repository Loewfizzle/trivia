// THE FIX PASS (Nov 22 — THE FABLE REVIEW's P1 + P8), in Chromium on the emulators: three phones in a JAYWALK match —
//   ALICE (the host) plays as ever;
//   BOB's browser has NO IMPORT MAPS (HTMLScriptElement.supports('importmap') = false — Safari below 16.4): his game screen is the clear card
//     "UPDATE YOUR iPHONE TO PLAY JAYWALK" + BACK TO THE ROOM (never a blank match), and the button takes him back to the room (state.quit);
//   CARL's view never loads (js/games/jaywalk/view.js refused, twice — the one retry): SOMETHING BROKE + BACK TO THE ROOM, reported.
//   node e2e-fix-pass.mjs "<chromium>"      (the emulators + scripts/serve.mjs --emu)
import { createHarness } from './kit/harness.mjs';

const H = await createHarness({
  name: 'fix-pass', slot: 'fp', sizes: [[390, 844]], warnPattern: /^$^/,
  beforeLoad: async (page, i) => {
    if (i === 1) await page.evaluateOnNewDocument(() => { const s = HTMLScriptElement.supports; HTMLScriptElement.supports = t => (t === 'importmap' ? false : s.call(HTMLScriptElement, t)); });
    if (i === 2) {
      await page.setRequestInterception(true);
      page.on('request', r => { if (/\/js\/games\/jaywalk\/view\.js(\?|$)/.test(r.url())) { globalThis.__fpRefused = (globalThis.__fpRefused || 0) + 1; r.abort('failed'); } else r.continue(); });
    }
  },
});
const { ok, log, waitFor, evalIn, pages, shot } = H; H.sleep = H.sleep || (ms => new Promise(r => setTimeout(r, ms)));

await H.run(async () => {
  await H.joinAll(3);
  const [A, B, C] = pages;
  await H.startGame(A, 'jaywalk', {});
  for (const p of pages) await waitFor(p, s => s.game && s.game.id === 'jaywalk' && s.meta.status === 'playing', 'the match on every phone', 40000);
  const card = p => p.evaluate(() => { const c = document.querySelector('.gk-broke'); return c ? { t: (c.querySelector('.gk-broke-t') || {}).textContent || '', p: (c.querySelector('.gk-broke-p') || {}).textContent || '', b: (c.querySelector('.gk-broke-b') || {}).textContent || '' } : null; });
  // BOB — P1
  await B.waitForFunction(() => !!document.querySelector('.gk-broke .gk-broke-b'), { timeout: 20000 }).catch(() => {});
  const b = await card(B);
  ok(b && b.t === 'UPDATE YOUR iPHONE TO PLAY JAYWALK' && /iOS 16\.4/.test(b.p) && /BACK TO THE ROOM/.test(b.b), `P1: no import maps → the card, never a blank match (${JSON.stringify(b)})`);
  ok(await B.evaluate(() => { const host = document.querySelector('.gk-broke').parentElement; return host.children.length === 1 && !host.querySelector('canvas'); }), 'P1: the game screen holds the card alone (no 3D view mounted under it)');
  await H.sleep(1200);
  await shot(B, 'p1-update-card-390');
  // CARL — P8
  await C.waitForFunction(() => !!document.querySelector('.gk-broke .gk-broke-b'), { timeout: 30000 }).catch(() => {});
  const c = await card(C);
  ok(c && c.t === 'SOMETHING BROKE' && /BACK TO THE ROOM/.test(c.b), `P8: the view never loaded (refused ${globalThis.__fpRefused || 0}×) → SOMETHING BROKE + BACK TO THE ROOM (${JSON.stringify(c)})`);
  ok((globalThis.__fpRefused || 0) >= 2, `P8: the load was tried again once before the card (${globalThis.__fpRefused || 0} requests)`);
  const rep = await C.evaluate(() => (window.__errlog ? window.__errlog.pending().concat([]).map(x => String(x.label || x.l || x.where || JSON.stringify(x)).slice(0, 80)) : []));
  ok(rep.some(x => /view load/.test(x)) || (await C.evaluate(() => (window.__errlog ? window.__errlog.seen().length : 0))) > 0, `P8: reported to /admin's errors (${rep.slice(0, 3).join(' · ') || 'seen'})`);
  await shot(C, 'p8-something-broke-390');
  // the way out: BACK TO THE ROOM = the menu's QUIT TO THE ROOM (the others play on)
  await B.click('.gk-broke-b');
  ok(await waitFor(B, s => s.quit && s.game && s.quit === s.game.matchId, 'BOB back to the room', 8000).then(() => true, () => false), 'BACK TO THE ROOM: BOB quit the match (state.quit = the match) — the others play on');
  ok(await evalIn(A, s => s.game && s.game.phase !== 'final' && s.meta.status === 'playing'), 'the match goes on for ALICE');
  log('done');
});
