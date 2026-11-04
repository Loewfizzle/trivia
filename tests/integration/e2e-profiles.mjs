// Profiles, THE BOARD and the results moments, end to end (emulators + node scripts/serve.mjs --emu, which serves /api):
//   node e2e-profiles.mjs "<browser>" ./shots-profiles        (env SHOTS=0, MATCHES=1)
// New players get a profile on their own (no signup); an existing player (saved name, no server profile) is migrated on
// load; room seats carry the profile id and the lobby shows emblems + tags; a finished match lands on the boards with
// plaques on the podium, XP, and THE END-OF-ROUND MOMENT (PROGRESSION A: the XP lines, a LEVEL-UP into REGULAR, the streak, FIRST
// ROUND, the skip, CONTINUE back to the podium); the key reminder appears back in the lobby; a fresh browser restores the
// profile with the key; a new key retires the old one; opting out takes you off the boards; a phone that was offline at
// the podium reports later and the match is still counted exactly once. BNAME (Oct 28): one match is under the 3-match floor
// (your pinned row says how many more, nobody's listed); topped up to 3, your own row reads your real name + YOU, every other
// row a HOUSE NICKNAME (never a typed name), ⋯ → REPORT lands in flags/; the public page shows nicknames only.
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
process.env.GCLOUD_PROJECT ||= 'demo-arcade';
import { createHarness, REVIEW_SIZES } from './kit/harness.mjs';
import { val, ref } from '../../api/_lib/fb.js';
import { finalGame, cipherSigned } from '../fixtures/finals.mjs';

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
  // (LOBBY 2.0 A: the room is the live city — each seat's emblem over its player's head; their strips in the guest list)
  await p0.waitForFunction(() => document.querySelectorAll('.rc-tags .rc-tag').length === 2 || document.querySelectorAll('.lobby-screen .chip .rk-badge').length === 2, { timeout: 15000 });
  ok(true, 'the room shows both players (an emblem over each head)');
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
  // (APP FIXES: a CIPHER final is checked against the players' own signed boards — written here as the players would have)
  const { boards } = cipherSigned(game, code);
  await ref(`rooms/${code}/boards/${game.matchId}`).set(boards);
  await p0.evaluate(async (c, g, names) => {
    const fb = await import('/js/firebase.js');
    const night = { g: g.id, at: fb.serverTimestamp(), p: { [Object.keys(g.participants)[0]]: 3, [Object.keys(g.participants)[1]]: 2 }, n: names };
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
  // PROGRESSION A — THE END-OF-ROUND MOMENT right after the podium (its own outcome — the server's)
  await p0.waitForSelector('.pg-moment', { timeout: 15000 }).catch(async () => { log('no .pg-moment; plaques:', await p0.$eval('.rc-plaque', e => e.length), 'xp:', await p0.$eval('.rc-xp', e => e.length)); });
  await p0.waitForSelector('.pg-moment.is-place', { timeout: 6000 });
  ok(/1ST PLACE/.test(await p0.$eval('.pg-place', e => e.textContent)), 'THE MOMENT: the placement lands (1ST PLACE)');
  await p0.waitForSelector('.pg-moment .pg-line.is-in', { timeout: 6000 });
  const xl = await p0.evaluate(() => [...document.querySelectorAll('.pg-line')].map(e => e.textContent));
  ok(xl.length >= 2 && xl.some(x => /MATCH PLAYED/.test(x)) && xl.some(x => /VICTORY/.test(x)), `the XP lines count up one by one (${xl.join(' | ')})`);
  await p0.waitForSelector('.pg-moment.is-up .pg-up.is-on', { timeout: 8000 });
  const upTxt = await p0.evaluate(() => `${document.querySelector('.pg-up-n').textContent} · ${document.querySelector('.pg-up em').textContent}`);
  ok(/^LEVEL [56] · NEW BAND · REGULAR$/.test(upTxt), `a LEVEL-UP: the medal flips — ${upTxt}`);
  await sleep(600);
  await H.shot(p0, 'pf-03-levelup-390x844');
  // THE LEVEL-UP HOLDS (the owner's PROGRESSION A review): a tap in its first second is ignored; it is still up 5 s later; a tap → the score screen
  await p0.evaluate(() => document.querySelector('.pg-moment').dispatchEvent(new PointerEvent('pointerup', { bubbles: true })));
  await sleep(5000);
  const held = await p0.evaluate(() => !!document.querySelector('.pg-up.is-on.is-held.is-tap') && /TAP TO CONTINUE/.test((document.querySelector('.pg-up-tap') || {}).textContent || ''));
  ok(held, 'the level-up is still up after 5 s (a skip-tap in its first second ignored) — TAP TO CONTINUE');
  await p0.evaluate(() => document.querySelector('.pg-moment').dispatchEvent(new PointerEvent('pointerup', { bubbles: true })));
  await p0.waitForFunction(() => !document.querySelector('.pg-up.is-on'), { timeout: 3000 });
  ok(true, 'a tap → back to the score screen, which finishes from there');
  // the skip: a tap anywhere → the end, at once
  await p0.evaluate(() => document.querySelector('.pg-moment').dispatchEvent(new PointerEvent('pointerup', { bubbles: true })));
  await p0.waitForSelector('.pg-moment.is-end', { timeout: 3000 });
  const end = await p0.evaluate(() => ({ lv: document.querySelector('.pg-lv-n').textContent, st: (document.querySelector('.pg-streak b') || {}).textContent || '',
    today: !!document.querySelector('.pg-streak .pg-dots i.is-played'), ach: [...document.querySelectorAll('.pg-ach div > b')].map(b => b.textContent), tease: (document.querySelector('.pg-tease b') || {}).textContent || '',
    total: document.querySelector('.pg-total-v').textContent, upGone: !document.querySelector('.pg-up.is-on') }));
  ok(/^LEVEL [56]$/.test(end.lv) && end.upGone && /^\+\d+ XP$/.test(end.total), `the skip → the end at once (${end.lv}, ${end.total})`);
  ok(/1 NIGHT STREAK/.test(end.st) && end.today, `the streak lights + today's dot (${end.st})`);
  ok(end.ach.includes('FIRST ROUND'), `an achievement slides in (${end.ach.join(', ')})`);
  ok(/^NEXT UNLOCK AT LEVEL \d+$/.test(end.tease), `the tease — when, never what (${end.tease})`);
  // (LOBBY FIXES: the round-end bar = the profile's pink neon tube — the earned part a dimmer pink, this match's gain the bright pink; no gold)
  const bar = await p0.evaluate(() => { const b = document.querySelector('.pg-moment .pg-bar'), had = b && b.querySelector('.pg-bar-had'), got = b && b.querySelector('.pg-bar-got'); const bg = e => getComputedStyle(e).backgroundImage; return b ? { tube: b.classList.contains('pg-bar-tube'), had: bg(had), got: bg(got) } : null; });
  ok(bar && bar.tube && /138, 42, 102/.test(bar.had) && /255, 79, 184/.test(bar.got) && !/169, 130, 60|230, 196, 122/.test(bar.had), `THE ROUND-END BAR is the PINK NEON TUBE (earned ${bar && bar.had.slice(0, 40)}… · the gain ${bar && bar.got.slice(0, 40)}…)`);
  ok(!/\?\?\?|\d+ of \d+/i.test(await p0.$eval('.pg-moment', e => e.textContent)), 'no ??? and no totals anywhere');
  await H.shot(p0, 'pf-03b-moment-end-390x844');
  await p0.click('.pg-moment .pg-btn');
  await p0.waitForFunction(() => !document.querySelector('.pg-moment'), { timeout: 3000 });
  ok(!!(await p0.$('.final')), 'CONTINUE → back to the podium (REMATCH / LOBBY as today)');
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
  ok(!(await p1.$('.pg-moment')) && !!(await p1.$('.final')), '/api down: no end-of-round moment — the podium exactly as before (profiles are polish)');
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

  // ---- 5. back in the room: THE SAVE-YOUR-KEY POP-UP (LOBBY 2.0 A's ADD-ON — replaced the 3rd-match reminder): her card + COPY · SHARE · LATER
  await H.backToLobby(p0);
  await p0.waitForSelector('.kp-sheet:not(.is-out) .kp-later', { timeout: 15000 });
  ok(/Save your key so you never lose your card/.test(await p0.$eval('.kp-sheet .kp-line', e => e.textContent)) && !!(await p0.$('.kp-sheet [data-act="copy"]')), 'THE SAVE-YOUR-KEY POP-UP back in the room after a counted match (her card, COPY · SHARE · LATER)');
  await shotAll(p0, 'pf-05-key-prompt', REVIEW_SIZES.slice(0, 2));
  await p0.evaluate(() => document.querySelector('.kp-sheet .kp-later').click());

  // ---- 6. a new device: the key restores the profile, stats and all
  const key0 = await p0.evaluate(s => localStorage.getItem(`na:${s}:pkey`), slotOf(0));
  const p3 = await openPlayer(3);
  await p3.evaluate(() => localStorage.setItem('na:f3:profile', JSON.stringify({ name: 'NEWPHONE', color: 'cyan', avatar: 'bolt' })));
  await p3.reload();
  await p3.waitForFunction(() => !!localStorage.getItem('na:f3:me'), { timeout: 25000 });
  const blank = await meOf(p3, 'f3');
  await p3.waitForFunction(() => !!localStorage.getItem('na:f3:pkey'), { timeout: 15000 }).catch(() => {});
  const blankKey = JSON.parse(await p3.evaluate(() => localStorage.getItem('na:f3:pkey')) || 'null');
  await p3.evaluate(() => { window.__arcade && import('/js/store.js').then(m => m.setState({ view: 'profile' })); });
  await p3.waitForSelector('.pg-card', { timeout: 15000 });
  // (LOBBY 2.0 A — RESTORE YOUR ACCOUNT: a big glass button → its own sheet)
  await p3.waitForSelector('.screen-in .pf-restore', { timeout: 15000 });
  await p3.evaluate(() => [...document.querySelectorAll('.screen-in .pf-restore')].pop().click());
  await p3.waitForSelector('.pf-restore-sheet .pf-key-in', { timeout: 6000 });
  await p3.type('.pf-restore-sheet .pf-key-in', JSON.parse(key0).toLowerCase().replace(/-/g, ' '));
  await p3.click('.pf-restore-sheet .btn-primary');
  await p3.waitForFunction(pid => JSON.parse(localStorage.getItem('na:f3:me') || 'null').pid === pid, { timeout: 15000 }, me0.pid);
  ok(true, 'a fresh browser restored ALICE\'s profile with her key (typed in lowercase with spaces)');
  // (FR6 FIXES A — C1: the new browser's profile holds a MEMBER Nº from its creation — it OWNS something, so it is KEPT, only unlinked; C2:
  //  its key stays on this device as YOUR PREVIOUS KEY in ACCOUNT, never silently overwritten)
  ok(!!(await val(`profiles/${blank.pid}`)), 'the numbered profile the new browser made is kept on the server (C1)');
  { const prev = await p3.evaluate(() => import('/js/profile/me.js').then(m => m.previousKey()));
    ok(!!prev && !!blankKey && prev.replace(/[^A-Z0-9]/gi, '') === blankKey.replace(/[^A-Z0-9]/gi, ''), `the restore kept the device's previous key — YOUR PREVIOUS KEY (C2: ${prev ? 'kept' : 'lost'})`); }
  ok(JSON.parse(await p3.evaluate(() => localStorage.getItem('na:f3:profile'))).name === 'ALICE', 'the room name follows the restored profile');
  await p3.waitForFunction(() => { const b = document.querySelector('.pg-stats b'); return b && Number(b.textContent) >= 1; }, { timeout: 15000 });
  ok(true, 'her stats came with it (her matches on the profile)');
  // PROGRESSION A — THE GILDED CARD + THE PROFILE: the level, the stats, the achievements she holds (+ X%), THE VAULT = only what she owns
  await p3.waitForFunction(() => document.querySelectorAll('.pg-prof .pg-ach').length >= 2 && !!document.querySelector('.pg-cz'), { timeout: 15000 }).catch(() => {});   // (the restored profile's sections, not the blank one's)
  // THE VAULT 2C — THE PROFILE REARRANGED: the card on top, CUSTOMIZE YOUR CARD under it, then LEVEL · THE STREAK · STATS · ACHIEVEMENTS (as
  // trophies) …; ACCOUNT at the foot (EDIT PROFILE · YOUR KEY · the birthday · the opt-out); no BOARD button on the profile
  const lay = await p3.evaluate(() => { const sc = document.querySelector('.pf-scroll'), kids = [...sc.children]; const at = sel => kids.findIndex(k => k.matches(sel) || !!k.querySelector(sel));
    return { card: at('.pf-card-slot'), cz: at('.pg-cz'), prog: at('.pg-prof'), mast: at('.pf-mastery'), acc: at('.pf-account'), board: [...sc.querySelectorAll('button')].some(b => /^THE BOARD$/.test(b.textContent.trim())), edit: !!sc.querySelector('.pf-account .pf-acc-row'),
      goal: !!document.querySelector('.pg-prof .pf-goal-t'), old: /NOT PLAYED YET|MEMBERSHIP/.test(document.querySelector('.pf-screen').textContent), menu: (() => { const m = document.querySelector('.menu-btn'); return !!m && getComputedStyle(m).display !== 'none'; })(),
      medals: document.querySelectorAll('.pg-trophies .pg-medal').length, chips: document.querySelectorAll('.pg-trophies .pg-rw[data-id]').length }; });
  ok(lay.card === 0 && lay.cz === 1 && lay.prog > lay.cz && lay.mast > lay.prog && lay.acc > lay.mast && !lay.board && lay.edit && lay.medals >= 2 && lay.chips >= 2 && lay.goal && !lay.old && !lay.menu,
    `THE PROFILE (LOBBY 2.0 A): the card (${lay.card}) → CUSTOMIZE YOUR CARD (${lay.cz}) → the sections + THE GOAL TILE (${lay.prog}, ${lay.goal}) → MASTERY (${lay.mast}) → ACCOUNT (${lay.acc}); no BOARD button, no NOT PLAYED YET / MEMBERSHIP (${!lay.old}), no ☰ on the page (${!lay.menu}); ${lay.medals} trophies with ${lay.chips} reward chips`);
  // EDIT PROFILE → NAME › → its own sheet; ‹ goes back ONE step (to Edit profile), then one more (the profile)
  const tapIt = sel => p3.evaluate(q => { const e = document.querySelector(q); if (e) e.click(); return !!e; }, sel);
  // (LOBBY FIXES — EDIT PROFILE REDONE: NAME ✎ + COLOUR ✎ at ACCOUNT's TOP showing the current values; each opens its editor; ‹ = one step)
  const edRows = await p3.evaluate(() => { const acc = document.querySelector('.pf-account'), kids = [...acc.children].filter(k => k.tagName !== 'H3'), v = s => (acc.querySelector(s + ' .pf-er-v') || {}).textContent || '';
    return { first: kids[0] && kids[0].classList.contains('pf-er-name'), second: kids[1] && kids[1].classList.contains('pf-er-colour'), name: v('.pf-er-name'), col: v('.pf-er-colour'), sw: !!acc.querySelector('.pf-er-colour .pf-er-sw'), pen: !!document.querySelector('.pf-card-slot .pf-pen') }; });
  ok(edRows.first && edRows.second && edRows.name.length > 0 && edRows.col.length > 0 && edRows.sw && edRows.pen, `EDIT PROFILE: NAME "${edRows.name}" ✎ + COLOUR (a swatch) "${edRows.col}" ✎ — the TOP of ACCOUNT; a ✎ beside the name on the card (${edRows.pen})`);
  ok(await tapIt('.pf-account .pf-er-name'), 'the NAME row is a real row'); await p3.waitForSelector('.pf-name-sheet .pf-name-in', { timeout: 6000 });
  const depth = () => p3.evaluate(() => document.querySelectorAll('.pfs:not(.is-out)').length);
  const d1 = await depth();
  await tapIt('.pf-name-sheet .pfs-back'); await sleep(450);
  const d0 = await depth();
  await tapIt('.pf-card-slot .pf-pen'); await p3.waitForSelector('.pf-name-sheet:not(.is-out) .pf-name-in', { timeout: 6000 }).catch(() => {});
  const penOpens = await depth(); await tapIt('.pf-name-sheet .pfs-back'); await sleep(450);
  ok(d1 === 1 && d0 === 0 && penOpens === 1, `BACK = ONE STEP: the name editor → the profile (${d1} → ${d0} sheets open); the card's ✎ opens the same editor (${penOpens})`);
  // (a trophy's reward chip = WEAR IT: FIRST ROUND's EMBER glow → on the server)
  await p3.click('.pg-trophies .pg-rw[data-id="glow-ember"]');
  for (let i = 0; i < 40 && (await val(`profiles/${me0.pid}/g`)) !== 'glow-ember'; i++) await sleep(150);
  ok((await val(`profiles/${me0.pid}/g`)) === 'glow-ember' && await p3.evaluate(() => document.querySelector('.pg-trophies .pg-rw[data-id="glow-ember"]').classList.contains('is-on')), 'A TROPHY REWARD CHIP: a tap EQUIPS EMBER (on the server; the chip says EQUIPPED ✓)');
  // (THE VAULT 2B — CUSTOMIZE (was DRESS YOUR CARD): its button opens the screen; the CARD tab's tiles = only what she owns)
  await p3.click('.vl-dp-go'); await p3.waitForSelector('.vl-dress .vl-dt', { timeout: 8000 });
  const prof = await p3.evaluate(() => ({ card: document.querySelector('.pg-card').dataset.card, lv: (document.querySelector('.pg-card-lv') || {}).textContent || '',
    ach: [...document.querySelectorAll('.pg-prof .pg-ach div > b')].map(b => b.firstChild.nodeValue), vault: [...document.querySelectorAll('.vl-dress .vl-dt')].map(b => b.dataset.id),   // (THE VAULT 2B: the dress screen's card tiles)
    text: document.querySelector('.pg-prof').textContent }));
  ok(prof.card === 'card-gilded' && /^REGULAR · LEVEL [56]$/.test(prof.lv), `the GILDED card: ${prof.lv}`);
  ok(prof.ach.includes('FIRST ROUND') && prof.ach.includes('HOUSE WARMING'), `the achievements she holds (${prof.ach.join(', ')})`);
  ok(prof.vault.includes('card-gilded') && prof.vault.includes('card-founder') && prof.vault.includes('card-brass') && !prof.vault.includes('card-house'), `THE VAULT: only what she owns (${prof.vault.join(', ')})`);
  ok(!/\?\?\?|\d+ \/ \d+ UNLOCKED|\d+ of \d+/.test(prof.text), 'no ??? · no locked slots · no totals');
  await p3.waitForFunction(() => /of players have this/.test((document.querySelector('.pg-prof .pg-ach .pg-pct') || {}).textContent || ''), { timeout: 10000 }).catch(() => {});
  ok(/^\d+% of players have this$/.test(await p3.evaluate(() => (document.querySelector('.pg-prof .pg-ach .pg-pct') || {}).textContent || '')), 'X% of players have this (the server’s count — pink, sentence case)');
  // wear another card she owns → the card changes (the server checked it)
  await p3.click('.vl-dt[data-id="card-founder"]');   // (THE VAULT 2B: tap its tile — worn at once)
  await p3.waitForFunction(() => (document.querySelector('.vl-dr-pin') || {}).dataset && document.querySelector('.vl-dr-pin').dataset.card === 'card-founder', { timeout: 5000 }).catch(() => {});
  await p3.click('.vl-dr-back'); await sleep(400);
  await p3.waitForFunction(() => document.querySelector('.pg-card').dataset.card === 'card-founder', { timeout: 8000 });
  ok((await val(`profiles/${me0.pid}/cd`)) === 'card-founder', 'WEAR IT: FOUNDING MEMBER — on the card + on the server');
  // the streak: the card's flame → the streak card
  await p3.click('.pg-card-st');
  await p3.waitForSelector('.pg-sc .pg-sk-n', { timeout: 5000 });
  ok(/^\d+$/.test(await p3.$eval('.pg-sk-n', e => e.textContent)) && (await p3.evaluate(() => document.querySelectorAll('.pg-sk .pg-sk-day').length)) === 7 && !!(await p3.$('.pg-sk .pg-sk-flame svg')), 'tap the flame → THE STREAK CARD (THE BIG FLAME, the count, the week’s 7 flames)');
  await shotAll(p3, 'pf-06b-streak-card');
  await p3.click('.pg-sc .pg-x');
  await sleep(800);
  await shotAll(p3, 'pf-06-profile');

  // ---- 6c. THE VAULT 1A — BRING YOUR CARD (the owner: the Home Screen app opened as a STRANGER): a fresh device with NOTHING saved → the
  // title's "ALREADY A MEMBER? BRING YOUR CARD" → the sheet → ALICE's key → this device JOINED her card; the first one stays signed in
  { const p7 = await openPlayer(6);
    await p7.waitForSelector('.byc-chip .byc-chip-go', { timeout: 25000 }).catch(() => {});
    ok(!!(await p7.$('.byc-chip .byc-chip-go')), 'BRING YOUR CARD: a fresh device (nothing saved) shows "ALREADY A MEMBER? BRING YOUR CARD" on the title');
    await shotAll(p7, 'pf-06c-bring-chip', REVIEW_SIZES.slice(0, 2));
    await p7.click('.byc-chip-go');
    await p7.waitForSelector('.byc-bring .byc-in', { timeout: 8000 });
    ok(/all your devices at once/i.test(await p7.$eval('.byc-bring', e => e.textContent)), 'the sheet says one card works on all your devices at once');
    await shotAll(p7, 'pf-06c-bring-sheet', REVIEW_SIZES.slice(0, 2));
    await p7.type('.byc-bring .byc-in', JSON.parse(key0));
    await p7.click('.byc-bring .byc-go');
    await p7.waitForFunction(pid => (JSON.parse(localStorage.getItem('na:f6:me') || 'null') || {}).pid === pid, { timeout: 20000 }, me0.pid).catch(() => {});
    await p7.waitForFunction(() => !document.querySelector('.byc-bring'), { timeout: 3000 }).catch(() => {});
    const m7 = await meOf(p7, 'f6');
    ok(m7 && m7.pid === me0.pid && !(await p7.$('.byc-chip')) && !(await p7.$('.byc-bring')), 'BRING YOUR CARD: ALICE\'s key → this device joined her card (the pill + the sheet gone)');
    const still = await p0.evaluate(() => import('/js/profile/me.js').then(m => m.fetchMe()).then(r => r.pid, e => `ERR ${e.code}`));
    ok(still === me0.pid, `the first device stays signed in — one card on both at once (${still})`);
    // LOBBY 2.0 A — YOUR KEY, ONE BLOCK: masked (tap to reveal) · COPY · SHARE · the saved line ("I saved it"); USE THIS CARD ON ANOTHER DEVICE
    await p7.browserContext().overridePermissions(BASE, ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']).catch(() => {});
    await p7.evaluate(() => { const k = 'na:f6:pnotes'; const n = JSON.parse(localStorage.getItem(k) || '{}'); localStorage.setItem(k, JSON.stringify({ ...n, saved: false })); window.__shared = null; navigator.share = async d => { window.__shared = d; }; });
    await p7.evaluate(() => import('/js/store.js').then(m => m.setState({ view: 'profile' })));
    await p7.waitForSelector('.pf-kb .pf-kb-acts [data-act="share"]', { timeout: 15000 }).catch(() => {});
    const box = await p7.evaluate(() => { const b = document.querySelector('.pf-kb'); return b ? { text: b.textContent, saved: !!b.querySelector('.pf-kb-saved.is-ok'), n: document.querySelectorAll('.pf-kb, .byc-save:not(.is-none), .pf-key').length, acts: [...b.querySelectorAll('[data-act]')].map(x => x.dataset.act), did: !!b.querySelector('.pf-kb-did') } : null; });
    ok(box && box.n === 1 && /YOUR KEY/.test(box.text) && /Not saved yet/.test(box.text) && !box.saved && box.did && ['copy', 'share'].every(a => box.acts.includes(a)), `YOUR KEY — ONE block (${box && box.n}): masked + COPY · SHARE + "Not saved yet — I saved it" (${JSON.stringify(box && box.acts)})`);
    await shotAll(p7, 'pf-06d-save-key', REVIEW_SIZES.slice(0, 2));
    await p7.click('.pf-kb [data-act="copy"]');
    await sleep(500);
    const clip = await p7.evaluate(() => navigator.clipboard.readText().catch(() => null));
    const n1 = await p7.evaluate(() => JSON.parse(localStorage.getItem('na:f6:pnotes') || '{}'));
    ok(clip === JSON.parse(key0) && n1.saved === true, `COPY puts the key on the clipboard + quiets the reminder (${clip ? 'copied' : 'no clipboard'}, saved ${n1.saved})`);
    await p7.evaluate(() => { const k = 'na:f6:pnotes'; localStorage.setItem(k, JSON.stringify({ ...JSON.parse(localStorage.getItem(k) || '{}'), saved: false })); });
    await p7.click('.pf-kb [data-act="share"]');
    await sleep(400);
    const sh = await p7.evaluate(() => ({ s: window.__shared, saved: JSON.parse(localStorage.getItem('na:f6:pnotes') || '{}').saved }));
    ok(sh.s && sh.s.text.includes(JSON.parse(key0)) && sh.saved === true, 'SHARE hands the key to the phone\'s share sheet (Notes · Mail · Messages) + quiets the reminder');
    await p7.evaluate(() => { const k = 'na:f6:pnotes'; localStorage.setItem(k, JSON.stringify({ ...JSON.parse(localStorage.getItem(k) || '{}'), saved: false })); });
    // (the key block repaints its saved line on its own buttons; the page is re-opened to read the note it starts from)
    await p7.evaluate(() => import('/js/store.js').then(m => { m.setState({ view: 'title' }); setTimeout(() => m.setState({ view: 'profile' }), 300); }));
    await p7.waitForSelector('.pf-kb .pf-kb-did', { timeout: 10000 });
    await p7.click('.pf-kb .pf-kb-did');
    await sleep(300);
    const sv = await p7.evaluate(() => ({ saved: JSON.parse(localStorage.getItem('na:f6:pnotes') || '{}').saved, box: !!document.querySelector('.pf-kb .pf-kb-saved.is-ok') }));
    ok(sv.saved === true && sv.box, 'I SAVED IT: the reminder quiets (saved) + the line turns green ("✓ saved")');
    await p7.click('.pf-elsewhere');
    await p7.waitForSelector('.byc-else .byc-key', { timeout: 6000 }).catch(() => {});
    const el = await p7.evaluate(() => { const s = document.querySelector('.byc-else'); return s ? { key: s.querySelector('.byc-key').textContent, text: s.textContent, steps: s.querySelectorAll('.byc-steps li').length } : null; });
    ok(el && el.key === JSON.parse(key0) && el.steps === 3 && /stays signed in/.test(el.text) && /NEW KEY/.test(el.text) && /Home Screen/.test(el.text), 'USE THIS CARD ON ANOTHER DEVICE: the key big + COPY + SHARE + the 3 steps (Home Screen too), "this device stays signed in", no NEW KEY needed');
    await shotAll(p7, 'pf-06e-use-elsewhere', REVIEW_SIZES.slice(0, 2));
    await p7.click('.byc-else .byc-x').catch(() => {});
    await p7.close(); }

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

  // ---- 7b. PERF-A — THE KEY ON THE DEVICE IS NEVER OVERWRITTEN (Grok 1.3): a lost guest login (a new anonymous uid) with ALICE's key +
  // name still on the device → ensure makes a NEW profile, but the device KEEPS her key + its "saved" note, the new key waits aside, the
  // membership card offers "THIS DEVICE ALREADY HAD A KEY — RESTORE IT?" and RESTORE IT brings ALICE back
  const p5 = await openPlayer(5);
  await p5.evaluate((k, me) => { localStorage.setItem('na:f5:pkey', JSON.stringify(k)); localStorage.setItem('na:f5:pnotes', JSON.stringify({ saved: true, games: 4 }));
    localStorage.setItem('na:f5:me', JSON.stringify({ uid: 'a-lost-guest-login', pid: me.pid, profile: me.profile, at: 1 })); localStorage.setItem('na:f5:profile', JSON.stringify({ name: 'ALICE', color: 'magenta', avatar: 'bolt' })); }, fresh, me0);
  await p5.reload();
  await p5.waitForFunction(() => !!JSON.parse(localStorage.getItem('na:f5:pnotes') || '{}').heldNew, { timeout: 25000 });
  { const kept = JSON.parse(await p5.evaluate(() => localStorage.getItem('na:f5:pkey'))), n5 = await p5.evaluate(() => JSON.parse(localStorage.getItem('na:f5:pnotes')));
    ok(kept === fresh && n5.saved === true && n5.heldNew && n5.heldNew !== fresh, `THE KEY KEPT: a new profile for a lost login never overwrites the device's key (kept ${kept === fresh}, "saved" ${n5.saved}, the new key aside ${!!n5.heldNew})`); }
  await p5.evaluate(() => import('/js/store.js').then(m => m.setState({ view: 'profile' })));
  await p5.waitForSelector('.pf-note.is-offer .pf-gb', { timeout: 15000 });
  ok(/ALREADY HAD A KEY/.test(await p5.$eval('.pf-note.is-offer', e => e.textContent)), 'the membership card offers the restore');
  await shotAll(p5, 'pf-06b-key-offer');
  await p5.click('.pf-note.is-offer .pf-gb');
  await p5.waitForFunction(pid => { const m = JSON.parse(localStorage.getItem('na:f5:me') || 'null'); return m && m.pid === pid; }, { timeout: 20000 }, me0.pid);
  { const n5 = await p5.evaluate(() => JSON.parse(localStorage.getItem('na:f5:pnotes')));
    ok(!n5.heldNew && !(await p5.$('.pf-note.is-offer')), 'RESTORE IT: ALICE is back on this device, the offer gone'); }
  // ---- 7c. PERF-A — THE SECOND TAB (Grok 5.4): the same player opened again → the NEW tab yields with a banner that stays ("ALREADY OPEN IN
  // ANOTHER TAB — USE THAT ONE", never ?slot=2), its host loop stopped; USE THIS TAB swaps them; closing the other tab frees this one
  const p6 = await openPlayer(5);
  await p6.waitForSelector('.dup-tab', { timeout: 15000 });
  // (a phone is slot 1: "ALREADY OPEN IN ANOTHER TAB — USE THAT ONE"; this test's slot f5 names itself: "SLOT f5 IS ALREADY OPEN …")
  ok(/ALREADY OPEN IN ANOTHER TAB/.test(await p6.$eval('.dup-tab', e => e.textContent)) && !/slot=2/i.test(await p6.$eval('.dup-tab', e => e.textContent)), `THE SECOND TAB says so: "${(await p6.$eval('.dup-tab span', e => e.textContent))}" (no ?slot=2)`);
  ok((await p6.evaluate(() => import('/js/store.js').then(m => !!m.state.dupTab))) && !(await p5.$('.dup-tab')), 'the newer tab yields (its host loop idle); the first tab stays the player');
  await p6.click('.dup-tab .btn');
  await p5.waitForSelector('.dup-tab', { timeout: 15000 });
  await p6.waitForFunction(() => !document.querySelector('.dup-tab'), { timeout: 15000 });
  ok(true, 'USE THIS TAB: the tabs swap (the other one yields now)');
  await p6.close();
  await p5.waitForFunction(() => !document.querySelector('.dup-tab'), { timeout: 20000 });
  ok(true, 'the other tab closed: this one is the player again, the banner gone');
  // ---- 7d. PERF-A — THE EMPTY CARD SAYS WHY (the Oct 31 scare): no key + no profile on this address → one line, never a card that looks wiped
  const p7 = await openPlayer(7);
  await p7.evaluate(() => import('/js/store.js').then(m => m.setState({ view: 'profile' })));
  await p7.waitForSelector('.pf-note', { timeout: 15000 });
  ok(/ALREADY A MEMBER\?.*Nothing is saved on this device yet .*wasn’t deleted.*BRING YOUR CARD/.test(await p7.$eval('.pf-note', e => e.textContent)), `THE EMPTY CARD SAYS WHY: "${await p7.$eval('.pf-note', e => e.textContent)}"`);

  // ---- 8. THE BOARD in the app (the floor, REAL USERNAMES — LOBBY 2.0 A, your own row, REPORT), and the opt-out
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
    // (BOB's seeded match scores 0 — give him a best score elsewhere so the board has another player's row; it used to come from older runs' leftovers)
    await ref('/').update({ [`pstats/${m.pid}/g/slip/p`]: 2, [`profiles/${m.pid}/m`]: 3, ...(m === me1 ? { [`pstats/${m.pid}/b/cipher-score`]: { a: 412 } } : {}) });
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
  ok(others.length > 0 && others.every(r => r.more), `every other row: its player's username + ⋯ (${others.map(r => r.n).join(', ')})`);
  ok(!others.some(r => /^[A-Z][a-z]+ [A-Z][a-z]+$/.test(r.n)), `no house nicknames on the board — the players' usernames (${others.map(r => r.n).join(', ')})`);
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
  ok(pubText.includes(String(me0.profile.n).toUpperCase()) && !pubText.includes(String(me0.pid).toUpperCase()) && !pubText.includes(String(me1.pid).toUpperCase()), `the public page: ${me0.profile.n}'s USERNAME on it — never a profile id`);
  await shotAll(pub, 'pf-08-public');
  await ctx.close();
});
