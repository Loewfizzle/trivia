// LOBBY 2.0 B — THE LOOK RUN (not a test: screenshots for the refine passes — CLAUDE.md "Visual review"): THE GAME START mid-way, the walk
// back out, THE WINNER's BANNER, THE REMATCH VOTE (host + guest), the reduced-motion still card — at 390 / 402 / 430 (+ 1440 × 900 once),
// a night city. `node tests/integration/room2-look.mjs "<browser>" ./shots-room2 [390,402,430,1440]` — on the emulators + serve.mjs --emu.
import { open, ev, waitFor, harborUp, sleep, log, OUT } from './harbor-e2e/kit.mjs';
import { hostRoom, joinRoom, fakeGuests, settledRoom, startOC, onTitle, dbPatch, podium } from './harbor-e2e/lobby2.mjs';

const SIZES = (process.argv[4] || '390,402,430,1440').split(',').map(Number);
const NIGHTQ = 'when=2026-10-21T22:00&tz=America/Detroit&at=42.96,-85.67&wx=clear';
const view = w => (w >= 1000 ? [w, 900] : [w, w === 390 ? 844 : w === 402 ? 874 : 932]);
const age = (p, ms) => waitFor(p, `window.__arcade.serverNow() - window.__arcade.state.meta.go.at >= ${ms}`, `the start at ${ms}`, 5000).catch(() => {});
const RM = { fn: () => { const mm = window.matchMedia.bind(window); window.matchMedia = q => (/prefers-reduced-motion/.test(q) ? { matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} } : mm(q)); }, arg: null };

for (const w of SIZES) {
  const v = view(w);
  const { Q: A, p, code, me } = await hostRoom(`lk${w}`, v, { qs: NIGHTQ, dpr: w >= 1000 ? 1 : 3 });
  const { Q: B, p: q, me: meB } = await joinRoom(`lg${w}`, code, v, { qs: NIGHTQ });
  const fakes = await fakeGuests(code, 5);
  await settledRoom(p, 7, 45000).catch(() => {});
  await startOC(p);
  for (const ms of [300, 900, 1250, 2300, 4000, 4700]) { await age(p, ms); await p.screenshot({ path: `${OUT}start-${w}-${ms}.png` }); }   // (LOBBY FIXES: the full start — the ignition, the hold + the walk-in, the fade)
  await waitFor(p, `!(${onTitle})`, 'the game', 8000);
  await podium(p, code, [meB]);
  await sleep(600);
  await ev(p, "import('/js/host.js').then(m => m.backToLobby())");
  await waitFor(p, onTitle, 'back', 12000); await harborUp(p);
  await sleep(1500); await p.screenshot({ path: `${OUT}walkout-${w}.png` });
  await waitFor(p, '(() => { const r = window.__district.roomBanner && window.__district.roomBanner(); return !!(r && r.last && r.last.how); })()', 'the banner', 30000).catch(() => {});
  await sleep(4500); await p.screenshot({ path: `${OUT}banner-${w}.png` });
  await waitFor(p, "document.querySelector('.rdk-play').classList.contains('rdk-rm')", 'REMATCH', 10000).catch(() => {});
  const m = await ev(p, 'window.__arcade.state.meta.back.m');
  await dbPatch(`rooms/${code}/rv`, { [fakes[0]]: m, [fakes[2]]: m });
  await ev(q, "document.querySelector('.rdk-play').click()");
  await sleep(1200);
  await p.screenshot({ path: `${OUT}vote-host-${w}.png` }); await q.screenshot({ path: `${OUT}vote-guest-${w}.png` });
  // (LOBBY FIXES: the QUICK start — a same-game REMATCH: the sign lit at once, the walk-in)
  await ev(p, "document.querySelector('.rdk-play').click()");
  for (const ms of [400, 1500]) { await age(p, ms); await p.screenshot({ path: `${OUT}quick-${w}-${ms}.png` }); }
  log('look', w, 'done');
  await A.ctx.close(); await B.ctx.close();
}
// reduced motion: the start's plain fade + the banner's still card (402)
{ const { Q: A, p, code } = await hostRoom('lkrm', [402, 874], { qs: NIGHTQ, init: RM });
  await fakeGuests(code, 2); await settledRoom(p, 3, 30000).catch(() => {});
  await startOC(p); await age(p, 1300); await p.screenshot({ path: `${OUT}start-rm-1300.png` }); await age(p, 4600); await p.screenshot({ path: `${OUT}start-rm-4600.png` });
  await waitFor(p, `!(${onTitle})`, 'the game', 8000);
  const g = await ev(p, '({ m: window.__arcade.state.game.matchId, players: window.__arcade.state.players })');
  const pts = {}, n = {}; Object.keys(g.players).forEach((u, i) => { pts[u] = i === 0 ? 3 : 1; n[u] = g.players[u].name; });
  await dbPatch(`rooms/${code}/night/${g.m}`, { g: 'overclock', p: pts, n, at: { '.sv': 'timestamp' } });
  await ev(p, "import('/js/host.js').then(m => m.backToLobby())");
  await waitFor(p, onTitle, 'back', 12000); await harborUp(p);
  await waitFor(p, "!!document.querySelector('.rc-bancard')", 'the still card', 30000).catch(() => {});
  await sleep(800); await p.screenshot({ path: `${OUT}banner-rm-402.png` });
  await A.ctx.close(); }
process.exit(0);
