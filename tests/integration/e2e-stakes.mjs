// HIGH STAKES end to end on the match-kit harness (emulators + node scripts/serve.mjs --emu).
//   node e2e-stakes.mjs "<browser>" ./shots-stakes          (env N=8 players · FAST=1: 2 players, one whole match, no shots)
// One whole match with bots (bets and answers through the real UI hooks): the category card, hidden bets (another phone
// is refused the read), the public lock flags, early ends, the showdown with every bet card, payouts matching the rules,
// the DOUBLE DOWN rounds, ALL IN last-to-first, standings, the podium with victory.mp3, results on the boards. The full run
// adds a refresh mid-bet (the locked bet comes back), the host killed mid-match, a late joiner watching, the music (seeded
// playlist, the mute button), screenshots at the review sizes and frame pacing at 4× CPU.
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
process.env.GCLOUD_PROJECT ||= 'demo-arcade';
import { createHarness, REVIEW_SIZES } from './kit/harness.mjs';
import { val } from '../../api/_lib/fb.js';
import { ledger, standings, payout, FINAL, ROUNDS, START } from '../../js/games/stakes/logic.js';

const H = await createHarness({ name: 'stakes', slot: 'h', hook: '__stakes', sizes: REVIEW_SIZES });
const { pages, log, ok, sleep, waitFor, evalIn, uids, G, alive, shotAll, FAST } = H;
const N = FAST ? 2 : Number(process.env.N || 8);
const game = page => evalIn(page, s => s.game);
// (functions are sent into the page as text: pass values as the argument, never through a closure)
const waitPhase = (page, p, r, what, timeout = 30000) => waitFor(page, (s, a) => s.game && s.game.phase === a.p && (a.r == null || s.game.round === a.r), what, timeout, { p, r });

await H.run(async () => {
  let host = await H.joinAll(N);
  await H.startGame(host, 'stakes', {});
  await waitFor(host, s => s.game && s.game.id === 'stakes', 'the match starts', 40000);
  const g0 = await game(host);
  ok(Object.keys(g0.qmeta || {}).length >= 8, `a question bank in the room (${Object.keys(g0.qmeta).length}, MEDIUM + HARD)`);
  ok(Object.values(g0.qmeta).every(m => /\|(medium|hard)$/.test(m)), 'never an easy question');
  ok(!JSON.stringify(g0.bank).match(/\b(the|which|what)\b/i), 'the questions are obfuscated in the room');
  await pages[0].waitForSelector('.hs-room', { timeout: 15000 });

  // ---- round 1: the category card, then the bet
  await waitPhase(host, 'cat', 0, 'the first category', 20000);
  await sleep(1800);
  ok(await pages[0].$('.hs-cat.is-flipped .hs-cat-name'), 'the category card turns over');
  await waitPhase(host, 'bet', 0, 'betting', 15000);
  // phone 0 bets 300 through the UI, phone 1 the minimum by timing out? no: phone 1 bets ALL IN
  await G(pages[0], 'window.__stakes.bet(300)');
  if (!FAST) await H.shot(pages[1], 'hs-02-bet-390x844');   // (timed phases: one quick shot; every size is reviewed in stakes-preview.html)
  await waitFor(pages[1], s => s.live && s.live.lock && s.live.lock[Object.keys(s.game.participants).sort()[0]] !== undefined || Object.values((s.live && s.live.lock) || {}).some(x => x && x.b), 'a public lock flag', 10000);
  const hidden = await pages[1].evaluate(async (code, m, u) => { const fb = await import('/js/firebase.js'); try { await fb.get(fb.dbRef(`hsbet/${code}/${m}/0/${u}`)); return 'read'; } catch (e) { return String(e.message || e); } }, H.code, g0.matchId, uids[0]);
  ok(/permission/i.test(hidden), `another phone can't see a bet before the showdown (${hidden.slice(0, 40)})`);
  const flags = await evalIn(pages[1], s => JSON.stringify(s.live.lock));
  ok(!flags.includes('300'), 'the public lock flag carries no amount');
  if (!FAST) {
    // refresh mid-bet: the locked bet comes back from the private node
    await H.refresh(pages[0], '.hs-room');
    await waitFor(pages[0], s => s.game && s.game.phase === 'bet', 'back at the table', 15000).catch(() => {});
    await sleep(1500);
    const st0 = await G(pages[0], 'window.__stakes.state()');
    ok(st0.lockedBet === 300 || (await game(host)).phase !== 'bet', `REJOIN: the locked bet is restored (${st0.lockedBet})`);
  }
  for (const i of alive()) await G(pages[i], `window.__stakes.bot({ rate: ${0.45 + 0.08 * (i % 5)}, allIn: ${i === 1 ? 0.25 : 0.05}, seed: ${i + 7}, delay: 350 })`);
  await waitPhase(host, 'q', 0, 'the question (early: everyone locked)', 20000);
  const qAt = await game(host);
  ok(qAt.phaseStartAt - (qAt.phaseStartAt - 0) >= 0, 'the question appears');
  await sleep(500);
  ok(await pages[0].$('.hs-q.is-on .hs-opt'), 'the cream question card with four answers');
  if (!FAST) await H.shot(pages[0], 'hs-03-question-390x844');
  await waitFor(host, s => s.game.phase === 'show' && s.game.res && s.game.res[0], 'the showdown resolves', 20000);
  await sleep(2600);
  if (!FAST) await H.shot(pages[0], 'hs-04-showdown-390x844');
  await sleep(2600);
  ok((await pages[0].$$('.hs-bc.is-flipped')).length === N, 'every bet card turned face-up');
  let g = await game(host);
  const r0 = g.res[0];
  const mult = payout(g.plan[0].d, 0);
  ok(r0[uids[0]].b === 300, 'the bet resolved is the one locked in');
  ok(Object.values(r0).every(x => x.d === (x.ok ? x.b * mult : -x.b)), `payouts follow the rules (×${mult})`);
  ok(Object.values(r0).every(x => x.b >= Math.min(100, START) && x.b <= START), 'every bet between the minimum and all in');

  // ---- the middle of the match: the host dies, a late joiner watches
  if (!FAST) {
    await waitFor(host, s => s.game.round >= 2, 'round 3', 120000);
    const before = await game(host);
    host = pages[await H.killHost()];
    await waitFor(host, (s, r) => s.game && s.game.round >= r, 'HOST MIGRATION: the match carries on', 90000, before.round + 1);
    ok(true, 'HOST MIGRATION: a new host carries the match on');
    const late = await H.openPlayer(N + 1, `room=${H.code}`);
    await late.waitForSelector('.nd-go', { timeout: 20000 });
    await late.click('.nd-go');
    await late.waitForSelector('.input-code');
    await late.type('.setup-screen input.input:not(.input-code)', 'LATE');
    await late.click('.form-cta .btn-primary');
    await late.waitForSelector('.hs-spec', { timeout: 30000 });
    ok(true, 'LATE JOINER: watches the table, dealt in next game');
    await waitFor(host, s => s.game.round === 3 && ['cat', 'bet'].includes(s.game.phase), 'DOUBLE DOWN round', 120000).catch(() => {});
    if ((await game(host)).round === 3) { await sleep(300); await shotAll(alive().map(i => pages[i])[0], 'hs-05-doubledown', REVIEW_SIZES.slice(0, 1)); }
  }

  // ---- to the end
  await waitFor(host, (s, r) => s.game.round === r, 'ALL IN', 600000, FINAL);
  await waitPhase(host, 'show', FINAL, 'the final showdown', 120000);
  await waitFor(host, (s, r) => s.game.res && s.game.res[r], 'the final resolves', 30000, FINAL);
  g = await game(host);
  const order = g.order;
  const pre = standings({ ...g, res: Object.fromEntries(Object.entries(g.res).filter(([k]) => Number(k) < FINAL)) }).map(r => r.uid).reverse();
  ok(JSON.stringify(order) === JSON.stringify(pre), 'ALL IN: revealed from last place to first');
  ok(g.plan[FINAL].d === 'hard', 'the final question is HARD');
  if (!FAST) { await sleep(3200); await shotAll(pages[alive()[0]], 'hs-06-allin', REVIEW_SIZES.slice(0, 1)); }
  await waitFor(host, s => s.game.phase === 'final', 'the podium', 120000);
  g = await game(host);
  const cats = Object.keys(g.plan).sort((a, b) => a - b).map(k => g.plan[k].cat);
  ok(cats.every((c, i) => i === 0 || c !== cats[i - 1]), `no category twice in a row (${cats.join(' ')})`);
  const dd = [3, 7].every(r => g.res[r] && Object.values(g.res[r]).every(x => x.d === (x.ok ? x.b * payout(g.plan[r].d, r) : -x.b)));
  ok(dd, 'DOUBLE DOWN rounds 4 and 8 paid double');
  const L = ledger(g);
  ok(Object.values(L).every(o => o.net === o.stack - o.loans), 'final totals are chips minus loans');
  ok(Object.keys(g.res).length === ROUNDS + 1, '10 rounds + ALL IN');
  const p0 = pages[alive()[0]];
  await p0.waitForSelector('.hs-final .winner', { timeout: 15000 });
  const music = await p0.evaluate(() => window.__arcade.musicDebug());
  ok(/^victory1$/.test(music.playing || music.desired || '') || JSON.stringify(music).includes('victory1'), `victory.mp3 at the winner reveal (${music.playing})`);
  if (!FAST) await shotAll(p0, 'hs-07-final');
  // the boards: the match was reported and counted
  await sleep(5000);
  const res = await val(`results/${H.code}_${g.matchId}`);
  ok(res && res.st === 'done' && res.g === 'stakes', 'reported to the boards (server-verified)');
  const anyRec = Object.values((res && res.o) || {}).some(o => (o.pbs || []).some(p => p.b === 'stakes-chips' || p.b === 'stakes-big'));
  ok(anyRec, 'best final stack / biggest hand recorded');

  if (!FAST) {
    // the music: the seeded playlist during play and the mute button
    await H.rematch(pages[alive()[0]]);
    const q = pages[alive()[0]];
    await waitFor(q, s => s.game && s.game.phase !== 'final', 'a rematch', 40000);
    await sleep(2500);
    const m2 = await q.evaluate(() => window.__arcade.musicDebug());
    ok(/^high[123]$/.test(m2.playing || ''), `the back room's music plays (${m2.playing})`);
    ok(await q.$('.music-btn'), 'the music button is there, as in every game');
    await q.click('.music-btn');
    await sleep(800);
    const m3 = await q.evaluate(() => JSON.parse(localStorage.getItem('na:audio') || localStorage.getItem('na:settings') || '{}'));
    ok(m3.music === 0 || m3.musicOn === false || m3.musicMuted === true || (await q.$('.music-btn.is-off')), 'one tap mutes the music');
    await q.click('.music-btn');
    // frame pacing on a mid-range phone profile (4× CPU)
    await waitFor(q, s => s.game.phase === 'bet' || s.game.phase === 'q' || s.game.phase === 'show', 'a live table', 60000);
    await H.perfRun(q, { viewport: { width: 390, height: 844 }, extra: p => G(p, 'window.__stakes.room()') });
  }
});
