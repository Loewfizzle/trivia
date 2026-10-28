// Profiles, THE BOARD and the results moments, end to end (emulators + node scripts/serve.mjs --emu, which serves /api):
//   node e2e-profiles.mjs "<browser>" ./shots-profiles        (env SHOTS=0, MATCHES=1)
// New players get a profile on their own (no signup); an existing player (saved name, no server profile) is migrated on
// load; room seats carry the profile id and the lobby shows emblems + tags; a finished match lands on the boards with
// plaques on the podium, XP, and a RANK UP; the key reminder appears back in the lobby; a fresh browser restores the
// profile with the key; a new key retires the old one; opting out takes you off the boards; a phone that was offline at
// the podium reports later and the match is still counted exactly once. BNAME (Oct 28): one match is under the 3-match floor
// (your pinned row says how many more, nobody's listed); topped up to 3, your own row reads your real name + YOU, every other
// row a HOUSE NICKNAME (never a typed name), ⋯ → REPORT lands in flags/; the public page shows nicknames only.
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
process.env.GCLOUD_PROJECT ||= 'demo-arcade';
import { createHarness, REVIEW_SIZES } from './kit/harness.mjs';
import { val, ref } from '../../api/_lib/fb.js';
import { finalGame } from '../fixtures/finals.mjs';

const H = await createHarness({ name: 'profiles', slot: 'f', sizes: REVIEW_SIZES });
const { pages, log, sleep, ok, evalIn, waitFor, uids, shotAll, openPlayer, BASE, browser } = H;
const meOf = (page, slotId) => page.evaluate(s => JSON.parse(localStorage.getItem(`na:${s}:me`) || 'null'), slotId);
const slotOf = i => `f${i}`;

await H.run(async () => {
  // ---- 1. new players: a profile appears on its own after the name screen
  const host = await H.joinAll(2);
  const [p0, p1] = pages;
  for (const i of [0, 1]) await pages[i].waitForFunction(s => !!localStorage.getItem(`na:${s}:me`), { timeout: 25000 }, slotOf(i));
  const me0 = await meOf(p0, slotOf(0)), me1 = await meOf(p1, slotOf(1));
  ok(/^p[a-z2-9]{11}$/.test(me0.pid) && /^\d{4}$/.test(me0.profile.t), `ALICE got a profile automatically (${me0.profile.n}#${me0.profile.t})`);
  ok(me1.pid && me1.pid !== me0.pid, 'BOB got his own');
  ok(!!(await p0.evaluate(s => localStorage.getItem(`na:${s}:pkey`), slotOf(0))), 'the key is kept on the device');
  await waitFor(p0, s => Object.values(s.players).every(p => p.pid), 'room seats carry the profile id', 20000);
  await p0.waitForSelector('.lobby-screen .chip .rk-badge', { timeout: 15000 });
  ok((await p0.$$eval('.lobby-screen .chip .rk-badge', els => els.length)) === 2, 'the lobby shows an emblem + tag for both');
  await shotAll(p0, 'pf-01-lobby');

  // ---- 2. an existing player: saved name, no server profile → migrated on load
  const p2 = await openPlayer(2);
  await p2.evaluate(() => localStorage.setItem('na:f2:profile', JSON.stringify({ name: 'VETERAN', color: 'green', avatar: 'star' })));
  await p2.reload();
  await p2.waitForFunction(() => !!localStorage.getItem('na:f2:me'), { timeout: 25000 });
  const me2 = await meOf(p2, 'f2');
  ok(me2.profile.n === 'VETERAN' && me2.profile.a === 'star', 'an existing player was migrated with their name and avatar');
  await p2.waitForFunction(() => { const y = document.querySelector('.nd-tab-you'); return y && y.querySelector('.avatar') && /VETERAN, /.test(y.getAttribute('aria-label') || ''); }, { timeout: 10000 });
  ok(true, 'the title\'s YOU tab shows their emblem (and names their rank)');

  // ---- 3. a finished match → the boards, plaques, XP, a rank-up
  // ALICE is 10 XP short of REGULAR; she has played two matches before (the key reminder comes after the third)
  await ref(`pstats/${me0.pid}`).update({ xp: 240 });
  await ref(`profiles/${me0.pid}/x`).set(240);
  await p0.evaluate(s => localStorage.setItem(`na:${s}:pnotes`, JSON.stringify({ games: 2 })), slotOf(0));
  // BOB can't reach the results server when the podium appears (his game connection is fine): his report waits
  let blockApi = true;
  await p1.setRequestInterception(true);
  p1.on('request', r => { if (r.isInterceptResolutionHandled()) return; if (blockApi && r.url().includes('/api/')) r.abort('internetdisconnected'); else r.continue(); });
  const game = finalGame('cipher', [uids[0], uids[1]], { matchId: `e2e${Date.now().toString(36).slice(-6)}` });
  game.phaseStartAt = Date.now(); game.phaseEndsAt = Date.now() + 60_000;
  const code = H.code;
  await p0.evaluate(async (c, g, names) => {
    const fb = await import('/js/firebase.js');
    const night = { g: g.id, at: fb.serverNow(), p: { [Object.keys(g.participants)[0]]: 3, [Object.keys(g.participants)[1]]: 2 }, n: names };
    await fb.update(fb.dbRef(`rooms/${c}`), { game: g, 'meta/status': 'playing', [`night/${g.matchId}`]: night });
  }, code, game, { [uids[0]]: 'ALICE', [uids[1]]: 'BOB' });
  await p0.waitForSelector('.final', { timeout: 20000 });
  await p0.waitForSelector('.rc-plaque.is-in', { timeout: 25000 });
  const plaques = await p0.$$eval('.rc-plaque .rc-n', els => els.map(e => e.textContent));
  ok(plaques.length >= 1, `plaques on the podium: ${plaques.join(' | ')}`);
  ok(plaques.some(t => /PERSONAL BEST|WORLDWIDE|THIS WEEK|TOP 10/.test(t)), 'a personal best / world-rank moment');
  await p0.waitForSelector('.rc-xp.is-in', { timeout: 10000 });
  ok(/\+\d+/.test(await p0.$eval('.rc-xp-top b', e => e.textContent)), 'the XP earned counts up');
  await sleep(600);
  await shotAll(p0, 'pf-02-podium', REVIEW_SIZES.slice(0, 1));
  await p0.bringToFront();
  await p0.waitForSelector('.rc-up', { timeout: 15000 }).catch(async () => { log('no .rc-up; plaques:', await p0.$$eval('.rc-plaque', e => e.length), 'xp:', await p0.$$eval('.rc-xp', e => e.length)); });
  await p0.waitForSelector('.rc-up.is-on', { timeout: 15000 });
  ok(/REGULAR/.test(await p0.$eval('.rc-up-name', e => e.textContent)), 'RANK UP → REGULAR');
  await sleep(1700);
  await H.shot(p0, 'pf-03-rankup-390x844');
  await p0.evaluate(() => { const u = document.querySelector('.rc-up'); if (u) u.click(); });
  await p0.waitForFunction(() => !document.querySelector('.rc-up'), { timeout: 5000 });
  ok(true, 'the rank-up closes on a tap (or by itself)');
  const pub0 = await val(`profiles/${me0.pid}`);
  ok(pub0.r === 1 && pub0.x >= 250, `the public profile shows REGULAR (${pub0.x} XP)`);
  ok((await val(`pstats/${me0.pid}/g/cipher/p`)) === 1, 'ALICE: one cipher match counted');
  await p0.waitForSelector('.final .pod .rk-badge', { timeout: 10000 }).catch(() => {});
  ok(await p0.$('.final .rk-badge'), 'emblems on the podium / results list');
  await shotAll(p0, 'pf-04-podium-done');

  // ---- 4. the offline phone comes back: its report goes, nothing is counted twice
  await p1.waitForSelector('.final', { timeout: 20000 });
  await sleep(1500);
  ok((await p1.evaluate(s => (JSON.parse(localStorage.getItem(`na:${s}:rq`) || '[]')).length, slotOf(1))) === 1, 'BOB\'s report waits in the queue while the server is unreachable');
  blockApi = false;
  await p1.evaluate(() => import('/js/profile/queue.js').then(m => m.flush(true)));
  await p1.waitForFunction(s => !(JSON.parse(localStorage.getItem(`na:${s}:rq`) || '[]')).length, { timeout: 20000 }, slotOf(1));
  ok(true, 'BOB\'s queued report was delivered once he was back');
  await p1.waitForSelector('.rc-plaque, .rc-xp', { timeout: 15000 }).catch(() => {});
  ok(await p1.$('.rc-xp'), 'BOB gets his own outcome on his podium');
  ok((await val(`pstats/${me1.pid}/g/cipher/p`)) === 1 && (await val(`pstats/${me0.pid}/g/cipher/p`)) === 1, 'the match is counted exactly once for each');
  await p1.evaluate(() => import('/js/profile/queue.js').then(m => { localStorage.removeItem(`na:f1:rdone`); return m.queueReport(window.__arcade.state.code, window.__arcade.state.game); }));
  await sleep(2500);
  ok((await val(`pstats/${me1.pid}/g/cipher/p`)) === 1, 'a forced re-send is still counted once');

  // ---- 5. back to the lobby: the key reminder after the third match
  await H.backToLobby(p0);
  await p0.waitForSelector('.pf-prompt .pf-key', { timeout: 15000 });
  ok(true, 'the key reminder appears back in the lobby (3rd match)');
  await p0.evaluate(() => document.querySelector('.pf-prompt .pf-key').click());
  await sleep(400);
  ok(/^NEON-[A-Z2-9]{4}-/.test(await p0.$eval('.pf-prompt .pf-key-text', e => e.textContent)), 'tap to reveal shows the key');
  await shotAll(p0, 'pf-05-key-prompt', REVIEW_SIZES.slice(0, 2));
  await p0.evaluate(() => document.querySelector('.pf-prompt .btn-primary').click());

  // ---- 6. a new device: the key restores the profile, stats and all
  const key0 = await p0.evaluate(s => localStorage.getItem(`na:${s}:pkey`), slotOf(0));
  const p3 = await openPlayer(3);
  await p3.evaluate(() => localStorage.setItem('na:f3:profile', JSON.stringify({ name: 'NEWPHONE', color: 'cyan', avatar: 'bolt' })));
  await p3.reload();
  await p3.waitForFunction(() => !!localStorage.getItem('na:f3:me'), { timeout: 25000 });
  const blank = await meOf(p3, 'f3');
  await p3.evaluate(() => { window.__arcade && import('/js/store.js').then(m => m.setState({ view: 'profile' })); });
  await p3.waitForSelector('.pf-card', { timeout: 15000 });
  await p3.click('.pf-link');
  await p3.type('.pf-key-in', JSON.parse(key0).toLowerCase().replace(/-/g, ' '));
  await p3.click('.pf-restore-box .btn-primary');
  await p3.waitForFunction(pid => JSON.parse(localStorage.getItem('na:f3:me') || 'null').pid === pid, { timeout: 15000 }, me0.pid);
  ok(true, 'a fresh browser restored ALICE\'s profile with her key (typed in lowercase with spaces)');
  ok((await val(`profiles/${blank.pid}`)) === null, 'the blank profile the new browser made is gone');
  ok(JSON.parse(await p3.evaluate(() => localStorage.getItem('na:f3:profile'))).name === 'ALICE', 'the room name follows the restored profile');
  await p3.waitForSelector('.pf-game', { timeout: 15000 });
  ok(/CIPHER/.test(await p3.$eval('.pf-game', e => e.textContent)), 'her stats came with it');
  await sleep(800);
  await shotAll(p3, 'pf-06-profile');

  // ---- 7. a new key: the old one stops working
  const fresh = await p0.evaluate(() => import('/js/profile/me.js').then(m => m.regenKey()));
  ok(fresh !== JSON.parse(key0), 'a new key was issued');
  const p4 = await openPlayer(4);
  await p4.evaluate(() => localStorage.setItem('na:f4:profile', JSON.stringify({ name: 'THIEF', color: 'red', avatar: 'ghost' })));
  await p4.reload();
  await p4.waitForFunction(() => !!localStorage.getItem('na:f4:me'), { timeout: 25000 });
  const oldTry = await p4.evaluate(k => import('/js/profile/me.js').then(m => m.restoreKey(k)).then(() => 'ok', e => e.code), JSON.parse(key0));
  ok(oldTry === 'no_key', `the old key is refused (${oldTry})`);
  const newTry = await p4.evaluate(k => import('/js/profile/me.js').then(m => m.restoreKey(k)).then(r => r.pid, e => e.code), fresh);
  ok(newTry === me0.pid, 'the new key works');

  // ---- 8. THE BOARD in the app (BNAME: the floor, nicknames, your real name, REPORT), and the opt-out
  const openBoard = async () => {
    await p3.evaluate(() => import('/js/profile/api.js').then(m => m.clearBoardCache()));
    await p3.evaluate(() => import('/js/store.js').then(m => m.setState({ view: 'title' })));
    await p3.evaluate(() => import('/js/store.js').then(m => m.setState({ view: 'board', boardGame: 'cipher' })));
    await p3.waitForSelector('.bd-card.is-cascade .bd-row, .bd-card .bd-empty', { timeout: 20000 });
    await sleep(1200);
  };
  await openBoard();
  const floorNote = await p3.$eval('.bd-me', el => el.textContent).catch(() => '');
  ok(/MORE MATCH/.test(floorNote), `one match: under the 3-match floor, the pinned row says so ("${floorNote.replace(/\s+/g, ' ').trim()}")`);
  ok((await val(`lb/cipher-score/all/${me0.pid}`)) == null, '…and no board entry is written yet');
  // top both players up to 3 matches (two earlier ones elsewhere), then a resync puts them up
  for (const [pg, m] of [[p0, me0], [p1, me1]]) {
    await ref('/').update({ [`pstats/${m.pid}/g/slip/p`]: 2, [`profiles/${m.pid}/m`]: 3 });
    await pg.evaluate(() => import('/js/profile/me.js').then(x => x.setShown(false)));
    await pg.evaluate(() => import('/js/profile/me.js').then(x => x.setShown(true)));
  }
  ok((await val(`lb/cipher-score/all/${me0.pid}`)) != null, '3 matches: on the boards');
  // the board's GET is browser-cached (max-age 10 s + stale-while-revalidate 60 s): look at ALL TIME, a list this browser hasn't fetched
  await p3.evaluate(() => sessionStorage.setItem('bd:period', 'all'));
  await openBoard();
  ok(await p3.$('.bd-me.is-ranked'), 'your pinned row shows your exact rank');
  const rows = await p3.$$eval('.bd-row:not(.is-skel)', els => els.map(el => ({ n: el.querySelector('.bd-n').textContent, me: el.classList.contains('is-me'), more: !!el.querySelector('.bd-more'), id: el.dataset.id })));
  const mine = rows.find(r => r.me);
  const bid3 = await p3.evaluate(() => { for (const k of Object.keys(localStorage)) if (/:me$/.test(k)) { const v = JSON.parse(localStorage.getItem(k)); return `${k}=${v && v.profile && v.profile.bid}`; } return 'none'; });
  ok(mine && mine.n.startsWith(me0.profile.n) && /YOU$/.test(mine.n) && !mine.more, `your own row: your real name + YOU, no REPORT (${mine && mine.n}; ${bid3}; rows ${rows.map(r => r.id).join(',')})`);
  const others = rows.filter(r => !r.me);
  ok(others.length > 0 && others.every(r => r.more && /^[A-Z][a-z]+ [A-Z][a-z]+$/.test(r.n)), `every other row: a house nickname + ⋯ (${others.map(r => r.n).join(', ')})`);
  ok(!rows.some(r => !r.me && r.n.toUpperCase().includes(String(me1.profile.n).toUpperCase())), `${me1.profile.n}'s typed name is nowhere on ALICE's board`);
  await shotAll(p3, 'pf-07-board');
  // REPORT: ⋯ → the sheet → SUSPICIOUS SCORE → thanks, stored for /admin
  const target = others[0];
  const flagged0 = (await val(`flags/${target.id}/why/score`)) || 0;
  await p3.click(`.bd-row[data-id="${target.id}"] .bd-more`);
  await p3.waitForSelector('.bd-rep .bd-rep-b');
  await shotAll(p3, 'pf-07b-report');
  await p3.evaluate(() => [...document.querySelectorAll('.bd-rep-b')].find(b => /SCORE/.test(b.textContent)).click());
  await p3.waitForFunction(() => /THANKS/.test((document.querySelector('.bd-rep-msg') || {}).textContent || ''), { timeout: 10000 });
  ok((await val(`flags/${target.id}/why/score`)) === flagged0 + 1, 'REPORT: stored under flags/ for /admin');
  await p3.waitForFunction(() => !document.querySelector('.bd-rep'), { timeout: 5000 });
  await p0.evaluate(() => import('/js/profile/me.js').then(m => m.setShown(false)));
  ok((await val(`lb/cipher-score/all/${me0.pid}`)) == null, 'opted out: off the boards');
  ok((await val(`pstats/${me0.pid}/g/cipher/p`)) === 1, '…and the stats are still there');
  await p0.evaluate(() => import('/js/profile/me.js').then(m => m.setShown(true)));
  ok((await val(`lb/cipher-score/all/${me0.pid}`)) != null, 'opted back in: on the boards again');

  // ---- 9. the public page, for anyone
  const ctx = await browser.createBrowserContext();
  const pub = await ctx.newPage();
  await pub.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await pub.goto(`${BASE}/board?g=cipher&c=records&p=all`);
  await pub.waitForSelector('.bd-row:not(.is-skel)', { timeout: 20000 });
  ok(await pub.$('.bd-play'), 'neonspeakeasy.com/board: the board for anyone, with PLAY NOW');
  const pubText = await pub.$eval('.bd-rows', el => el.textContent.toUpperCase());
  ok(!pubText.includes(String(me0.profile.n).toUpperCase()) && !pubText.includes(String(me1.profile.n).toUpperCase()), 'the public page: house nicknames only, no typed names');
  await shotAll(pub, 'pf-08-public');
  await ctx.close();
});
