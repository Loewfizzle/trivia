// RUMRUNNER end to end on the match-kit harness (emulators + node scripts/serve.mjs --emu).
//   node e2e-rum.mjs "<browser>" ./shots-rum          (env N=8 players · FAST=1: 2 players, one 15-day match, no shots)
// One whole match with bots through the real UI hooks: the city and the first day's prices, a trade and a tip-off written
// as a private day log (another phone and the host are refused the read during the day), the public DONE flag with no
// destination in it, the day ending early, the night resolution (arrivals, moved prices, the tipped-off player hot),
// an event answered through the hook, the last morning, the books, the newspaper, the podium with victory.mp3, results on
// the boards (server-verified by replaying the whole city). The full run adds a refresh mid-day (the day's log comes
// back), the host killed mid-match, a late joiner watching, the music (seeded playlist, the mute button), screenshots at
// the review sizes and frame pacing at 4× CPU.
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
process.env.GCLOUD_PROJECT ||= 'demo-arcade';
import { createHarness, REVIEW_SIZES } from './kit/harness.mjs';
import { val } from '../../api/_lib/fb.js';
import { verifyDays, HOME, DIST_IDS, START_CASH } from '../../js/games/rum/logic.js';

const H = await createHarness({ name: 'rum', slot: 'r', hook: '__rum', sizes: REVIEW_SIZES });
const { pages, log, ok, sleep, waitFor, evalIn, uids, G, alive, shotAll, FAST } = H;
const N = FAST ? 2 : Number(process.env.N || 8);
const DAYS = 15;
const game = page => evalIn(page, s => s.game);
// (functions are sent into the page as text: pass values as the argument, never through a closure)
const waitPhase = (page, p, d, what, timeout = 60000) => waitFor(page, (s, a) => s.game && s.game.phase === a.p && (a.d == null || s.game.day === a.d), what, timeout, { p, d });
const my = page => G(page, 'window.__rum.state()');
const STRATS = ['trader', 'mean', 'careful', 'gambler', 'trader', 'random', 'careful', 'gambler'];

await H.run(async () => {
  let host = await H.joinAll(N);
  await H.startGame(host, 'rum', { days: DAYS, daySec: 30 });
  await waitFor(host, s => s.game && s.game.id === 'rum', 'the match starts', 40000);
  const g0 = await game(host);
  ok(g0.days && g0.days[1] && DIST_IDS.every(d => g0.days[1].p[d] && Object.values(g0.days[1].p[d]).filter(Boolean).length >= 3), 'day 1: prices in all six districts, three goods on sale at least');
  ok(Object.values(g0.days[1].at).every(d => d === HOME), 'everyone wakes up in the Old Quarter');
  await pages[0].waitForSelector('.rr-city', { timeout: 15000 });
  ok(await pages[0].$('.rr-intro'), 'the intro: RUMRUNNER and Mr. Balboni\'s welcome');
  await waitPhase(host, 'dawn', 1, 'the first dawn', 20000);
  ok(await pages[0].$('.rr-dawn'), 'the dawn card');
  if (!FAST) await H.shot(pages[0], 'rr-01-dawn-390x844');

  // ---- day 1 on phone 0, by hand: a tip-off, a trade, a destination, DONE
  await waitPhase(host, 'day', 1, 'day 1 opens', 20000);
  await waitFor(pages[0], () => window.__rum && window.__rum.state().loaded && !!window.__rum.state().S, 'the books are open', 15000);
  await sleep(600);
  ok(await pages[0].$('.rr-panel .rr-good'), 'the market: a card per good');
  // a rumour may already be waiting on day 1: answer it (nothing else is allowed while an event is up)
  for (let k = 0; k < 2 && (await my(pages[0])).showing; k++) { const c = await G(pages[0], 'window.__rum.choices()'); await G(pages[0], `window.__rum.choose(${JSON.stringify(c[0])})`); await sleep(300); await pages[0].evaluate(() => { const b = document.querySelector('.rr-choice.is-go'); if (b) b.click(); }); await sleep(300); }
  const cash0 = (await my(pages[0])).S.cash;
  ok(cash0 === START_CASH, `starting cash $${START_CASH} (${cash0})`);
  const tip = await G(pages[0], `window.__rum.act(['x', ${JSON.stringify(uids[1])}])`);
  ok(tip && tip.k === 'x' && tip.cost === 300, `a tip-off on a rival costs its price (${tip && tip.cost})`);
  const prices0 = await G(pages[0], 'window.__rum.prices()');
  const good = Object.keys(prices0).filter(g => prices0[g] > 0).sort((a, b) => prices0[a] - prices0[b])[0];   // the cheapest thing on sale this morning
  const qty = Math.max(1, Math.min(10, Math.floor((START_CASH - tip.cost) / prices0[good])));
  const trade = await G(pages[0], `window.__rum.act(['t', ${JSON.stringify(good)}, ${qty}])`);
  ok(trade && trade.k === 't' && trade.q === qty, `bought ${qty} ${good} at $${prices0[good]}`);
  const bad = await G(pages[0], `window.__rum.act(['t', ${JSON.stringify(good)}, 100000])`);
  ok(bad === null, 'a trade you can\'t afford is refused locally');
  const s1 = await my(pages[0]);
  ok(s1.S.cash === START_CASH - tip.cost - prices0[good] * qty && s1.S.cargo[good] === qty, 'cash and cargo follow the trade');
  await G(pages[0], "window.__rum.dest('docks')");
  await sleep(700);
  if (!FAST) await H.shot(pages[0], 'rr-02-market-390x844');
  const priv = await pages[1].evaluate(async (code, m, u) => { const fb = await import('/js/firebase.js'); try { await fb.get(fb.dbRef(`rrp/${code}/${m}/${u}/1`)); return 'read'; } catch (e) { return String(e.message || e); } }, H.code, g0.matchId, uids[0]);
  ok(/permission/i.test(priv), `another phone can't read your day (${priv.slice(0, 40)})`);
  const hostPriv = await host.evaluate(async (code, m) => { const fb = await import('/js/firebase.js'); try { await fb.get(fb.dbRef(`rrp/${code}/${m}`)); return 'read'; } catch (e) { return String(e.message || e); } }, H.code, g0.matchId);
  ok(/permission/i.test(hostPriv), 'nor can the host, during the day');
  const own = await pages[0].evaluate(async (code, m, u) => { const fb = await import('/js/firebase.js'); const s = await fb.get(fb.dbRef(`rrp/${code}/${m}/${u}/1`)); return s.val(); }, H.code, g0.matchId, uids[0]);
  ok(own && own.dest === 'docks' && own.a && Object.keys(own.a).length === 2, 'your own log is there: the tip-off, the trade, the destination');
  await G(pages[0], 'window.__rum.done()');
  await waitFor(pages[1], (s, u) => s.live && s.live.pub && s.live.pub[u] && s.live.pub[u].done, 'the public DONE flag', 10000, uids[0]);
  const pub = await evalIn(pages[1], (s, u) => JSON.stringify(s.live.pub[u]), uids[0]);
  ok(!pub.includes('docks') && pub.includes('"nw"'), 'the flag carries the net worth, never the destination');
  // bots everywhere else; the day ends early once everyone is done
  for (const i of alive()) if (i !== 0) await G(pages[i], `window.__rum.bot({ strategy: ${JSON.stringify(STRATS[i % STRATS.length])}, seed: ${i}, delay: 300 })`);
  const t0 = Date.now();
  await waitPhase(host, 'night', 1, 'night 1 (early: everyone done)', 40000);
  ok(Date.now() - t0 < 29000, 'the day ended early once everyone tapped DONE');
  if (!FAST) await H.shot(pages[0], 'rr-03-night-390x844');

  // ---- the night resolves: arrivals, moved prices, the hot rival
  await waitPhase(host, 'dawn', 2, 'dawn 2', 30000);
  let g = await game(host);
  ok(g.days[2].at[uids[0]] === 'docks', 'you arrive where you chose');
  ok(g.days[2].hot && g.days[2].hot[uids[1]] === true, 'the tipped-off rival is hot today');
  ok(JSON.stringify(g.days[2].p) !== JSON.stringify(g.days[1].p), 'prices moved overnight');
  ok(g.nwh && g.nwh[1] && typeof g.nwh[1][uids[0]] === 'number' && g.nw[uids[0]] === g.nwh[1][uids[0]], 'net worths written for the leaderboard');
  ok(g.days[2].m && Object.keys(g.days[2].m).length >= 1, 'the shared market remembers the day\'s trading');

  // ---- day 2 by hand: an event, if one found you with cargo; then the bot takes over
  await waitPhase(host, 'day', 2, 'day 2', 30000);
  await sleep(1200);
  let st = await my(pages[0]);
  if (st.showing) {
    const choices = await G(pages[0], 'window.__rum.choices()');
    ok(choices.length >= 1 && (await pages[0].$('.rr-ev .rr-choice')), `an event finds you (${st.events.join(', ')}): ${choices.join(' / ')}`);
    if (!FAST) await H.shot(pages[0], 'rr-04-event-390x844');
    await G(pages[0], `window.__rum.choose(${JSON.stringify(choices[0])})`);
    await sleep(500);
    ok(await pages[0].$('.rr-ev.is-out'), 'the outcome card');
    const after = await my(pages[0]);
    ok(after.evIdx === 1, 'the choice is in the log');
  } else ok(true, `no event on day 2 (${st.events.length ? st.events.join(', ') : 'quiet morning'})`);
  if (!FAST) {
    // refresh mid-day: the day's log comes back from the private node
    const before = await my(pages[0]);
    await H.refresh(pages[0], '.rr-city');
    await waitFor(pages[0], () => window.__rum && window.__rum.state().loaded && !!window.__rum.state().S, 'back in the city', 20000);
    await sleep(800);
    const again = await my(pages[0]);
    ok(again.S.cash === before.S.cash && JSON.stringify(again.S.cargo) === JSON.stringify(before.S.cargo), `REJOIN: cash and cargo restored ($${again.S.cash})`);
  }
  await G(pages[0], `window.__rum.bot({ strategy: 'trader', seed: 99, delay: 300 })`);

  // ---- the middle: the host dies, a late joiner watches
  if (!FAST) {
    await waitFor(host, s => s.game.day >= 4, 'day 4', 180000);
    const before = await game(host);
    host = pages[await H.killHost()];
    await waitFor(host, (s, d) => s.game && s.game.day >= d, 'HOST MIGRATION: the match carries on', 120000, before.day + 1);
    ok(true, 'HOST MIGRATION: a new host carries the match on');
    const late = await H.openPlayer(N + 1, `room=${H.code}`);
    await late.waitForSelector('.nd-go', { timeout: 20000 });
    await late.click('.nd-go');
    await late.waitForSelector('.input-code');
    await late.type('.setup-screen input.input:not(.input-code)', 'LATE');
    await late.click('.form-cta .btn-primary');
    await late.waitForSelector('.rr-spec', { timeout: 30000 });
    ok(true, 'LATE JOINER: watches the city, dealt in next game');
    await waitFor(host, s => s.game.phase === 'day', 'a day', 60000);
    await sleep(600);
    await shotAll(pages[alive()[0]], 'rr-05-midgame');
  }

  // ---- to the end
  await waitPhase(host, 'dawn', DAYS, 'the last morning', 900000);
  g = await game(host);
  ok(g.days[DAYS].w === 'dawn', 'the last morning is a dawn');
  const weathers = new Set(Object.values(g.days).filter(Boolean).map(d => d.w));   // (Firebase returns day-keyed objects as arrays with a null at 0)
  ok(weathers.size >= 2, `weather changed over the match (${[...weathers].join(', ')})`);
  if (!FAST) { await sleep(1500); await shotAll(pages[alive()[0]], 'rr-06-lastdawn', REVIEW_SIZES.slice(0, 1)); }
  await waitFor(host, s => s.game.phase === 'final', 'the final', 120000);
  g = await game(host);
  ok(g.books && Object.keys(g.books).length === N, 'the books are open for everyone');
  ok(g.final && g.final.length === N && g.final.every((r, i) => i === 0 || g.final[i - 1].nw >= r.nw), 'final standings sorted by fortune');
  ok(verifyDays(g), 'the whole city verifies from the seed and the books');
  const p0 = pages[alive()[0]];
  await p0.waitForSelector('.rr-paper-c', { timeout: 30000 });
  const paper = await G(p0, 'window.__rum.paper()');
  ok(paper && paper.main && paper.main.head && paper.items.length === N, `THE NEON GAZETTE: "${paper.main.head}"`);
  ok(await p0.$('.rr-paper-b .btn-ghost'), 'SAVE THE FRONT PAGE');
  if (!FAST) await shotAll(p0, 'rr-07-paper');
  await G(p0, 'window.__rum.podium()');
  await p0.waitForSelector('.rr-final .winner', { timeout: 15000 });
  const music = await p0.evaluate(() => window.__arcade.musicDebug());
  ok(/^victory1$/.test(music.playing || music.desired || '') || JSON.stringify(music).includes('victory1'), `victory.mp3 at the winner reveal (${music.playing})`);
  if (!FAST) await shotAll(p0, 'rr-08-podium');
  // the boards: the match was reported and counted
  await sleep(6000);
  const res = await val(`results/${H.code}_${g.matchId}`);
  ok(res && res.st === 'done' && res.g === 'rum', `reported to the boards (server-verified: ${res && res.st})`);
  const anyRec = Object.values((res && res.o) || {}).some(o => (o.pbs || []).some(p => p.b === `rum-f${DAYS}`));
  ok(anyRec || g.final[0].nw <= 0, 'BIGGEST FORTUNE recorded for the length');

  if (!FAST) {
    // the music: the seeded playlist during play and the mute button
    await H.rematch(p0);
    await waitFor(p0, s => s.game && s.game.phase !== 'final', 'a rematch', 40000);
    await sleep(2500);
    const m2 = await p0.evaluate(() => window.__arcade.musicDebug());
    ok(/^run[1234]$/.test(m2.playing || ''), `the city's music plays (${m2.playing})`);
    ok(await p0.$('.music-btn'), 'the music button is there, as in every game');
    await p0.click('.music-btn');
    await sleep(800);
    const m3 = await p0.evaluate(() => JSON.parse(localStorage.getItem('na:audio') || localStorage.getItem('na:settings') || '{}'));
    ok(m3.music === 0 || m3.musicOn === false || m3.musicMuted === true || (await p0.$('.music-btn.is-off')), 'one tap mutes the music');
    await p0.click('.music-btn');
    // frame pacing on a mid-range phone profile (4× CPU)
    await waitFor(p0, s => s.game.phase === 'day' || s.game.phase === 'dawn', 'a live city', 60000);
    await H.perfRun(p0, { viewport: { width: 390, height: 844 }, extra: p => G(p, 'window.__rum.stats()') });
  }
});
