// GRIDLOCK end to end. Match A — CLASSIC with 2 players: the lobby card + options, a real drag of a ship from the tray
// onto the grid (touch), a tap rotates it, an invalid drop glows red and snaps back, AUTO-PLACE, READY, the 10×10 board,
// a real aimed shot through the HUD (target chip, cell, FIRE), turns alternate, a timed-out turn fires a random shot,
// refresh mid-match (fleet + marks restored), privacy (another player cannot read your fleet), the end, results.
// Match B — BATTLE ROYALE with N (8) players: 8×8, everyone locks in, TARGET LOCK warnings, simultaneous resolution,
// two players on the same cell both credited, the bounty, the owner-offline fallback (a target's phone is closed:
// the host resolves within ~4 s), host killed mid-round, Call the Winner, a finish, results; frame pacing per tier.
//   node e2e-gridlock.mjs "<browser path>" ./shots-gridlock     (env N=8, SHOTS=0, GPU=1, PERF=0, CPU=4)
import { createHarness, REVIEW_SIZES } from './kit/harness.mjs';

const H = await createHarness({ name: 'gridlock', slot: 'g', hook: '__gridlock', sizes: REVIEW_SIZES, warnPattern: /game view|gridlock cinematic/ });
const { N, SHOTS, CPU, OUT, VIEW, NAMES, pages, uids, dead, errors, checks, log, sleep, ok, fail, evalIn, waitFor, alive, idx, game, G, join, hostIdx, touch, line, shotAll } = H;
const SIZES = REVIEW_SIZES;
let code = '';
const joinAll = async n => { const host = await H.joinAll(n); code = H.code; return host; };
const name = uid => H.nameOf(uid);
const cleanText = (page, where) => H.cleanText(page, where, '.gl');
// the board fades in when it changes: wait until it has settled before measuring where things are on screen
async function settle(page) { for (let k = 0; k < 40; k++) { const c = await G(page, 'window.__gridlock.camera()'); if (c && c.settled) return; await sleep(100); } }
// screen position of a cell on the board that is up (the scene's geometry is exact; the picker agrees with it)
async function cellXY(page, uid, r, c) {
  const xy = await G(page, `window.__gridlock.cellXY(${JSON.stringify(uid)}, ${r}, ${c})`);
  if (!xy) return null;
  const back = await G(page, `window.__gridlock.pick(${xy[0]}, ${xy[1]})`);
  if (!back || back.uid !== uid || back.r !== r || back.c !== c || back.near) fail(`GEOMETRY: cell ${r},${c} of ${name(uid)} is not where the scene says (${JSON.stringify(back)})`);
  return xy;
}
let fatal = null;
try {
  // ================================================================ MATCH A — CLASSIC, 2 players
  const host = await joinAll(process.env.SKIP_A ? N : 2);
  const A = pages[0], B = pages[1];
  if (!process.env.SKIP_A) {
  await host.evaluate(() => document.querySelector('.game-card[data-theme="gridlock"]').scrollIntoView({ block: 'center' }));
  await sleep(500);
  await shotAll(host, 'gl-00-lobby-card', SIZES.slice(0, 2));
  await host.evaluate(() => document.querySelector('.game-card[data-theme="gridlock"]').click());
  await host.waitForSelector('.modal .sheet.options', { timeout: 8000 });
  await sleep(500);
  await shotAll(host, 'gl-01-options', SIZES.slice(0, 2));
  await host.evaluate(() => document.querySelector('.modal .btn-text.btn-block').click());
  await sleep(300);
  await host.evaluate(() => import('/js/host.js').then(m => m.startGame('gridlock', { mode: 'classic', placeSec: 60, turnSec: 30 })));
  await waitFor(host, s => s.game && s.game.id === 'gridlock' && s.game.phase === 'place', 'placement');
  const gA = await game(host);
  ok(gA.size === 10 && gA.fleet.length === 5, `BOARD: 2 players → 10×10, 5 ships (${gA.size}, ${gA.fleet.join('/')})`);
  await Promise.all([A, B].map(p => p.waitForFunction(() => window.__gridlock && window.__gridlock.fleet(), { timeout: 20000 })));
  await sleep(900);
  await cleanText(A, 'placement');
  await shotAll(A, 'gl-02-deploy');

  // ---- a real drag: the DREADNOUGHT (slot 0) from the tray to a cell on my grid
  const tray = await A.$('.gl-ship[data-idx="0"]');
  const tb = await tray.boundingBox();
  await settle(A);
  const dest = await cellXY(A, uids[0], 4, 4);
  log('drop point', dest);
  ok(!!dest, 'PLACE: a grid cell is tappable on screen');
  await touch(A, line(tb.x + tb.width / 2, tb.y + tb.height / 2, dest[0], dest[1], 18), 18);
  let f = await G(A, 'window.__gridlock.fleet()');
  ok(f[0] && f[0].len === 5 && f[0].r === 4, `PLACE: the ship dropped onto the grid where the finger let go (${JSON.stringify(f[0])})`);
  // a tap on it turns it
  const on = await cellXY(A, uids[0], f[0].r, f[0].c + 1);
  await touch(A, [on, on], 30);
  f = await G(A, 'window.__gridlock.fleet()');
  ok(f[0] && f[0].d === 1, `PLACE: a tap rotates it (${JSON.stringify(f[0])})`);
  // an invalid drop (hanging off the bottom edge): red ghost mid-drag, snaps back
  const tray2 = await A.$('.gl-ship[data-idx="1"]');
  const tb2 = await tray2.boundingBox();
  const off = await cellXY(A, uids[0], 9, 9);
  const path = line(tb2.x + tb2.width / 2, tb2.y + tb2.height / 2, off[0], off[1], 16);
  {
    const c = await A.target().createCDPSession();
    await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: path[0][0], y: path[0][1], id: 1 }] });
    for (const p of path.slice(1)) { await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: p[0], y: p[1], id: 1 }] }); await sleep(16); }
    const mid = await G(A, 'window.__gridlock.drag()');
    ok(mid && mid.valid === false, `PLACE: an impossible spot shows an invalid (red) ghost while dragging (${JSON.stringify(mid)})`);
    if (SHOTS) await A.screenshot({ path: `${OUT}gl-03-invalid-390x844.png` });
    await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await c.detach();
  }
  f = await G(A, 'window.__gridlock.fleet()');
  ok(!f[1], 'PLACE: it can\'t be dropped there (slot stays empty)');
  await A.evaluate(() => [...document.querySelectorAll('.gl-btn')].find(b => b.textContent === 'AUTO-PLACE').click());
  f = await G(A, 'window.__gridlock.fleet()');
  ok(f.every(Boolean) && f[0].r === 4 && f[0].d === 1, 'PLACE: AUTO-PLACE fills the rest and keeps the ship you placed');
  await sleep(400);
  await shotAll(A, 'gl-04-placed');
  await A.evaluate(() => [...document.querySelectorAll('.gl-btn')].find(b => b.textContent === 'READY').click());
  await waitFor(A, (s, u) => s.live && s.live.ready && s.live.ready[u], 'ALICE ready', 10000, uids[0]);
  // BOB: privacy check (reads ALICE's fleet → denied), then auto + ready
  const priv = await B.evaluate((c, u) => import('/js/firebase.js').then(m => m.get(m.dbRef(`fleets/${c}/${window.__arcade.state.game.matchId}/${u}`)).then(() => 'READ', e => String(e.code || e.message))), code, uids[0]);
  ok(/permission|denied/i.test(priv), `PRIVACY: another player can't read your fleet (${priv})`);
  await B.evaluate(() => { window.__gridlock.autoPlace(); window.__gridlock.setReady(); });
  await waitFor(host, s => s.game.phase === 'turn', 'first turn', 15000);
  ok(true, 'PLACE: both READY → the first turn starts before the timer');

  // ---- a real aimed shot through the HUD on whoever is up
  let g = await game(host);
  let shooter = pages[idx(g.cur)], other = g.cur === uids[0] ? uids[1] : uids[0];
  await sleep(600);
  await settle(shooter);
  await cleanText(shooter, 'aiming');
  await shotAll(shooter, 'gl-05-aim');
  const cell = await cellXY(shooter, other, 2, 3);
  await touch(shooter, [cell, cell], 30);
  const aimed = await G(shooter, 'window.__gridlock.aimCell()');
  ok(aimed && aimed.r === 2 && aimed.c === 3, `AIM: a tap on the opponent's board picks the cell (${JSON.stringify(aimed)}) — nothing fires yet`);
  ok((await game(host)).phase === 'turn', 'AIM: confirm-to-fire — the tap alone did not shoot');
  await sleep(300);
  await shotAll(shooter, 'gl-06-reticle', SIZES.slice(0, 1));
  log('before FIRE', JSON.stringify(await shooter.evaluate(() => ({ aim: window.__gridlock.aimCell(), target: window.__gridlock.target(), btn: !!document.querySelector('.gl-btn-fire'), cls: document.querySelector('.gl').className, rk: window.__arcade.state.game.rk, cur: window.__arcade.state.game.cur === window.__arcade.state.uid }))));
  await shooter.evaluate(() => document.querySelector('.gl-btn-fire').click());
  await sleep(800);
  log('after FIRE', JSON.stringify(await shooter.evaluate(() => ({ shots: window.__arcade.state.live.shots, phase: window.__arcade.state.game.phase, toasts: [...document.querySelectorAll('.toast')].map(t => t.textContent), action: (document.querySelector('.gl-action') || {}).textContent }))));
  await waitFor(host, s => s.game.phase === 'show' || s.game.v >= 2, 'the shot lands', 15000);   // a one-shot cinematic is short: the volley number is the reliable sign
  g = await game(host);
  log('volley', JSON.stringify(g.fire), JSON.stringify(g.ev));
  ok(g.fire && g.ev && g.ev.some(e => e.k === 'shot' && e.r === 2 && e.c === 3 && e.t === other), 'FIRE: the volley holds that exact shot; the cinematic plays it');
  await sleep(900);
  await shotAll(other === uids[0] ? A : B, 'gl-07-impact', SIZES.slice(0, 1).concat(SIZES.slice(2)));
  await waitFor(host, s => s.game.phase === 'turn', 'next turn', 15000);
  g = await game(host);
  ok(g.cur === other, 'CLASSIC: the turn passes to the other player');
  // a timed-out turn: nobody fires → a random shot is fired for them
  await waitFor(host, s => (s.game.v === 2 && s.game.phase === 'show') || s.game.v >= 3, 'auto-shot on timeout', 40000);
  g = await game(host);
  ok(g.ev && g.ev.length >= 1 && g.v >= 2, 'CLASSIC: after the timer a random shot was fired for the slow player');
  // bots finish the match; refresh ALICE mid-match
  for (const p of [A, B]) await G(p, 'window.__gridlock.bot({ delay: 500, seed: 7 })');
  await waitFor(host, s => s.game.v >= 6, 'a few volleys', 60000);
  const before = await G(A, 'window.__gridlock.fleet()');
  const marksBefore = await evalIn(A, s => Object.keys((s.game.boards && s.game.boards[s.uid] && s.game.boards[s.uid].cells) || {}).length);
  await A.reload();
  await A.waitForFunction(() => window.__gridlock && window.__gridlock.fleet() && window.__gridlock.fleet().every(Boolean), { timeout: 30000 });
  const after = await G(A, 'window.__gridlock.fleet()');
  ok(JSON.stringify(after) === JSON.stringify(before), 'REJOIN: a refresh restores your fleet from your private node');
  const marksAfter = await evalIn(A, s => Object.keys((s.game.boards && s.game.boards[s.uid] && s.game.boards[s.uid].cells) || {}).length);
  ok(marksAfter >= marksBefore, `REJOIN: the public marks are back (${marksAfter} ≥ ${marksBefore})`);
  await G(A, 'window.__gridlock.bot({ delay: 400, seed: 8 })');
  await waitFor(host, s => s.game.phase === 'final', 'match A final', 720000);
  g = await game(host);
  ok(g.winner && g.results && Object.keys(g.results).length === 2 && g.results[g.winner].hi === 17, `CLASSIC: a winner with every enemy cell hit (${name(g.winner)}, ${JSON.stringify(g.results[g.winner])})`);
  await sleep(4200);
  await cleanText(A, 'final');
  await shotAll(A, 'gl-08-final');
  await A.evaluate(() => { const t = document.querySelector('.gl-res'); t && t.scrollIntoView({ block: 'center' }); });
  await sleep(400);
  await shotAll(A, 'gl-09-report', SIZES.slice(0, 1));

  }
  // ================================================================ MATCH B — BATTLE ROYALE, N players
  for (let i = 2; i < N; i++) if (!pages[i]) { await join(i); uids[i] = await evalIn(pages[i], s => s.uid); }
  await waitFor(host, (s, k) => Object.keys(s.players).length === k, `${N} players`, 30000, N);
  const hi = await hostIdx();
  if (await evalIn(pages[hi], s => !!s.game)) { await pages[hi].evaluate(() => import('/js/host.js').then(m => m.backToLobby())); await waitFor(pages[hi], s => !s.game, 'lobby', 20000); }
  await pages[hi].evaluate(() => import('/js/host.js').then(m => m.startGame('gridlock', { mode: 'royale', placeSec: 45, turnSec: 15 })));
  await waitFor(pages[hi], s => s.game && s.game.id === 'gridlock' && s.game.mode === 'royale' && s.game.phase === 'place', 'royale placement');
  const gB = await game(pages[hi]);
  const wantB = N >= 4 ? [8, 4] : [10, 5];
  ok(gB.size === wantB[0] && gB.fleet.length === wantB[1], `BOARD: ${N} players → ${wantB[0]}×${wantB[0]}, ${wantB[1]} ships`);
  await Promise.all(alive().map(i => pages[i].waitForFunction(() => window.__gridlock && window.__gridlock.fleet(), { timeout: 20000 })));
  // everyone but HAL places (HAL's fleet comes from the host: auto-place for a phone that never placed)
  for (const i of alive()) if (i !== N - 1) await G(pages[i], 'window.__gridlock.autoPlace(); window.__gridlock.setReady();');
  await waitFor(pages[hi], s => s.game.phase === 'aim', 'round 1', 60000);
  ok(true, 'ROYALE: round 1 begins when the placement timer ends (one phone never placed)');
  await sleep(800);
  await shotAll(pages[1], 'gl-10-royale-aim');
  // lock-on warning: BOB + CHARLIE lock onto DANA; DANA sees two locks (who, not where)
  await G(pages[1], `window.__gridlock.aim(${JSON.stringify(uids[3])}, 1, 1); window.__gridlock.fire();`);
  await G(pages[2], `window.__gridlock.aim(${JSON.stringify(uids[3])}, 1, 1); window.__gridlock.fire();`);
  await waitFor(pages[3], (s, u) => s.live && s.live.shots && Object.values(s.live.shots).filter(x => x.t === u || (x.ts && x.ts[u])).length === 2, 'two locks on DANA', 10000, uids[3]);
  await sleep(400);
  const locks = await G(pages[3], 'window.__gridlock.locks()');
  ok(locks === 2, `TARGET LOCK: DANA is warned twice (${locks} dots)`);
  const hidden = await evalIn(pages[3], s => Object.values(s.live.shots).map(x => x.r == null && x.c == null && !!x.x).every(Boolean));
  ok(hidden, 'TARGET LOCK: who is public, the cell is not');
  await shotAll(pages[3], 'gl-11-target-lock', SIZES.slice(0, 1).concat(SIZES.slice(2)));
  // the rest fire randomly; HAL is a closed phone this round (owner-offline fallback: the host resolves DANA? no — HAL's board)
  await G(pages[0], `window.__gridlock.aim(${JSON.stringify(uids[N - 1])}, 0, 0); window.__gridlock.fire();`);
  for (const i of alive()) if (i >= 4 && i !== N - 1) await G(pages[i], 'window.__gridlock.bot({ delay: 200, seed: 11 })');
  log('closing HAL (a target whose phone is gone)');
  await pages[N - 1].close(); dead.add(N - 1);
  await waitFor(pages[hi], s => s.game.phase === 'resolve' || s.game.phase === 'show', 'the volley resolves', 40000);
  const tRes = Date.now();
  await waitFor(pages[hi], s => s.game.phase === 'show', 'show', 30000);
  const gS = await game(pages[hi]);
  const dana = gS.ev.filter(e => e.k === 'shot' && e.t === uids[3] && e.r === 1 && e.c === 1);
  ok(dana.length === 2 && dana[0].h === dana[1].h, `SAME CELL: BOB and CHARLIE both land on D1 1,1 and get the same result (h=${dana[0] && dana[0].h})`);
  ok(gS.ev.some(e => e.k === 'shot' && e.t === uids[N - 1]), `OFFLINE OWNER: HAL's board still resolved (the host stepped in, ${((Date.now() - tRes) / 1000).toFixed(1)} s)`);
  ok(gS.boards[uids[N - 1]] && Object.keys(gS.boards[uids[N - 1]].cells).length >= 1, 'OFFLINE OWNER: marks landed on the absent player\'s board');
  await sleep(1500);
  await shotAll(pages[1], 'gl-12-volley', SIZES.slice(0, 1).concat(SIZES.slice(2)));
  // bots everywhere; bounty + eliminations + call the winner + host killed
  for (const i of alive()) await G(pages[i], 'window.__gridlock.bot({ delay: 250, seed: ' + (i + 3) + ' })');
  await waitFor(pages[hi], s => s.game.bounty, 'a bounty', 120000);
  const gBo = await game(pages[hi]);
  const top = Object.entries(gBo.pts).sort((a, b) => b[1] - a[1]);
  ok(gBo.bounty === top[0][0] && top[0][1] > (top[1] ? top[1][1] : 0), `BOUNTY: on the points leader (${name(gBo.bounty)} ${top[0][1]} pts)`);
  const annB = await G(pages[1], 'window.__gridlock.announcements()');
  ok(annB.some(a => a.startsWith('BOUNTY:')), 'ANNOUNCE: the bounty is called out');
  await waitFor(pages[hi], s => s.game.out && Object.keys(s.game.out).length >= 1, 'first elimination', 300000);
  const gO = await game(pages[hi]);
  const firstOut = Object.keys(gO.out)[0];
  const op = pages[idx(firstOut)];
  let callMade = false;
  const canCall = Object.keys(gO.participants).length - Object.keys(gO.out).length >= 2;   // a call needs two fleets still in
  if (!canCall) log('no call possible: the first elimination left fewer than two fleets', JSON.stringify(gO.out));
  if (op && !dead.has(idx(firstOut)) && canCall) {
    await op.waitForSelector('.gl-call', { timeout: 8000 }).catch(() => {});
    ok(!!(await op.$('.gl-call')), `CALL: the eliminated player (${name(firstOut)}) gets CALL THE WINNER`);
    await sleep(500);
    await shotAll(op, 'gl-13-call', SIZES.slice(0, 1));
    await op.evaluate(() => { const b = document.querySelector('.gl-call-pick'); b && b.click(); });
    await sleep(600);
    const call = await evalIn(op, (s, u) => s.live.calls && s.live.calls[u], firstOut);
    ok(!!(call && call.w), 'CALL: the pick is saved');
    callMade = !!(call && call.w);
    await sleep(800);
    await shotAll(op, 'gl-14-spectate', SIZES.slice(0, 1));
  }
  // the host's phone dies mid-match
  const h2 = await hostIdx();
  log('killing host', NAMES[h2]);
  await pages[h2].close(); dead.add(h2);
  const w = alive()[0];
  await waitFor(pages[w], (s, old) => s.meta && s.meta.hostId && s.meta.hostId !== old, 'a new host', 40000, uids[h2]);
  const vBefore = (await game(pages[w])).v;
  await waitFor(pages[w], (s, v) => s.game.v > v + 1 || s.game.phase === 'final', 'the match goes on under the new host', 60000, vBefore);
  ok(true, 'HOST: the host left; a new host carried the battle on');
  await waitFor(pages[w], s => s.game.phase === 'final', 'match B final', 600000);
  const gF = await game(pages[w]);
  const places = Object.values(gF.out).map(o => o.place).sort((a, b) => a - b);
  ok(gF.winner && places.length === N - 1 && places[0] === 2, `ROYALE: a finish — ${name(gF.winner)} wins, places ${places.join(',')}${gF.capped ? ' (round cap)' : ''}`);
  if (callMade) ok(Object.values(gF.calls || {}).length >= 1, `CALL: calls scored (${JSON.stringify(gF.calls)})`);
  else log('no call was made this match (small N): the scoring check is skipped');
  await sleep(4000);
  await cleanText(pages[w], 'royale final');
  await shotAll(pages[w], 'gl-15-royale-final', SIZES.slice(0, 1).concat(SIZES.slice(2)));

  // ================================================================ MATCH C — SALVO, 2 players (markers, the counter, a volley of shots)
  if (process.env.PART2 !== '0') {
    const hiC = await hostIdx();
    const C1 = pages[alive()[0]], C2 = pages[alive()[1]];
    const u1 = uids[alive()[0]], u2 = uids[alive()[1]];
    await pages[hiC].evaluate(() => import('/js/host.js').then(m => m.backToLobby()));
    await waitFor(pages[hiC], s => !s.game, 'lobby', 20000);
    // the four mode cards in the options sheet
    await pages[hiC].evaluate(() => document.querySelector('.game-card[data-theme="gridlock"]').click());
    await pages[hiC].waitForSelector('.modal .sheet.options .opt-cards', { timeout: 8000 });
    const modeCards = await pages[hiC].$$eval('.opt-card', els => els.map(e => e.querySelector('.opt-card-label').textContent));
    ok(modeCards.join('|') === 'CLASSIC|SALVO|BATTLE ROYALE|ARCADE', `MODES: four mode cards (${modeCards.join(', ')})`);
    await sleep(400);
    await shotAll(pages[hiC], 'gl-20-mode-cards', SIZES.slice(0, 1));
    await pages[hiC].evaluate(() => document.querySelector('.modal .btn-text.btn-block').click());
    await sleep(300);
    // only two phones take part: the rest sit this one out by leaving the room? No — everyone connected is dealt in, so
    // SALVO runs with everyone alive; the checks below are about the two we drive
    await pages[hiC].evaluate(() => import('/js/host.js').then(m => m.startGame('gridlock', { mode: 'salvo', placeSec: 45, turnSec: 15 })));
    await waitFor(pages[hiC], s => s.game && s.game.mode === 'salvo' && s.game.phase === 'place', 'salvo placement');
    await Promise.all(alive().map(i => pages[i].waitForFunction(() => window.__gridlock && window.__gridlock.fleet(), { timeout: 20000 })));
    for (const i of alive()) await G(pages[i], 'window.__gridlock.autoPlace(); window.__gridlock.setReady();');
    await waitFor(pages[hiC], s => s.game.phase === 'aim', 'salvo round 1', 60000);
    await sleep(500);
    const gC = await game(pages[hiC]);
    const allow = await G(C1, 'window.__gridlock.allowance()');
    ok(allow === gC.fleet.length, `SALVO: one shot per ship afloat (${allow} shots with ${gC.fleet.length} ships)`);
    // markers: place, lift, replace the last when full
    for (let k = 0; k < allow + 1; k++) await G(C1, `window.__gridlock.aim(${JSON.stringify(u2)}, ${Math.floor(k / gC.size)}, ${k % gC.size})`);
    let planC = await G(C1, 'window.__gridlock.plan()');
    ok(planC.shots.length === allow, `SALVO: a marker past the allowance replaces the last one (${planC.shots.length} markers)`);
    await G(C1, `window.__gridlock.aim(${JSON.stringify(u2)}, 0, 0)`);
    planC = await G(C1, 'window.__gridlock.plan()');
    ok(planC.shots.length === allow - 1 && !planC.shots.some(s => s.r === 0 && s.c === 0), 'SALVO: tapping a marker lifts it');
    await cleanText(C1, 'salvo aim');
    await shotAll(C1, 'gl-21-salvo-markers', SIZES.slice(0, 1).concat(SIZES.slice(2)));
    // a refresh keeps the unsent markers
    await C1.reload();
    await C1.waitForFunction(() => window.__gridlock && window.__gridlock.plan() && window.__gridlock.plan().shots.length > 0, { timeout: 30000 }).catch(() => {});
    const planR = await G(C1, 'window.__gridlock.plan()');
    ok(!!planR && planR.shots.length === allow - 1, `REJOIN: the unsent markers come back after a refresh (${planR && planR.shots.length})`);
    await G(C1, 'window.__gridlock.fire()');
    await waitFor(C1, (s, u) => s.live && s.live.shots && s.live.shots[u], 'salvo lock written', 10000, u1);
    const nodeC = await evalIn(C1, (s, u) => s.live.shots[u], u1);
    ok(nodeC && nodeC.ts && nodeC.ts[u2] && nodeC.x && nodeC.t == null && nodeC.r == null, 'SALVO: the lock-in names who (ts) and hides where (x)');
    for (const i of alive()) if (pages[i] !== C1) await G(pages[i], 'window.__gridlock.bot({ delay: 200, seed: 21 })');
    await waitFor(pages[hiC], s => s.game.phase === 'show', 'salvo volley', 40000);
    const gS2 = await game(pages[hiC]);
    const mineC = (gS2.fire[u1] || []).length;
    ok(mineC === allow - 1, `SALVO: every marker fired as its own shot (${mineC})`);
    await sleep(2500);
    await shotAll(C2, 'gl-22-salvo-volley', SIZES.slice(0, 1));
    await G(C1, 'window.__gridlock.bot({ delay: 200, seed: 22 })');
    await waitFor(pages[hiC], s => s.game.phase === 'final', 'salvo final', 600000);
    const gCF = await game(pages[hiC]);
    ok(gCF.winner && Object.values(gCF.results).every(r => r.sh > 0 && typeof r.acc === 'number'), `SALVO: a finish with shots + accuracy in the results (${name(gCF.winner)} wins${gCF.capped ? ', round cap' : ''})`);
    await sleep(4000);
    await cleanText(pages[hiC], 'salvo final');
    await shotAll(pages[hiC], 'gl-23-salvo-final', SIZES.slice(0, 1));

    // ================================================================ MATCH D — ARCADE, N players (cards, abilities, sonar privacy, rejoin with cards)
    const hiD = await hostIdx();
    await pages[hiD].evaluate(() => import('/js/host.js').then(m => m.backToLobby()));
    await waitFor(pages[hiD], s => !s.game, 'lobby', 20000);
    await pages[hiD].evaluate(() => import('/js/host.js').then(m => m.startGame('gridlock', { mode: 'arcade', placeSec: 45, turnSec: 15 })));
    await waitFor(pages[hiD], s => s.game && s.game.mode === 'arcade' && s.game.phase === 'place', 'arcade placement');
    await Promise.all(alive().map(i => pages[i].waitForFunction(() => window.__gridlock && window.__gridlock.fleet(), { timeout: 20000 })));
    for (const i of alive()) await G(pages[i], 'window.__gridlock.autoPlace(); window.__gridlock.setReady();');
    await waitFor(pages[hiD], s => s.game.phase === 'aim', 'arcade round 1', 60000);
    await sleep(500);
    const D1 = pages[alive()[0]], d1 = uids[alive()[0]];
    const gD = await game(pages[hiD]);
    ok(Object.values(gD.hand).every(hd => hd.length === 2), 'ARCADE: everyone starts with two cards');
    const handD = await G(D1, 'window.__gridlock.hand()');
    ok(handD.length === 2 && (await D1.$$('.gl-abil')).length === 2, `ARCADE: the hand shows the two cards (${handD.join(', ')})`);
    await cleanText(D1, 'arcade hand');
    await shotAll(D1, 'gl-24-arcade-hand');
    // a refresh keeps the cards (they live in the public game) and the armed plan
    const cardA = handD[0];
    const others = alive().map(i => uids[i]).filter(u => u !== d1);
    const aimCard = async (page, a, t) => {
      await G(page, `window.__gridlock.arm(${JSON.stringify(a)})`);
      if (a === 'sonar' || a === 'cluster' || a === 'torpedo') await G(page, `window.__gridlock.aim(${JSON.stringify(t)}, 2, 2)`);
      if (a === 'shield') await G(page, 'window.__gridlock.aim(null, 1, 1)');
      if (a === 'double') { await G(page, `window.__gridlock.aim(${JSON.stringify(t)}, 1, 1)`); await G(page, `window.__gridlock.aim(${JSON.stringify(t)}, 3, 3)`); }
      if (a === 'relocate') {
        const okMove = await page.evaluate(() => { const f = window.__gridlock.fleet(); for (let i = 0; i < f.length; i++) { const s = f[i]; for (const cand of [{ ...s, d: s.d ? 0 : 1 }, { ...s, r: (s.r + 1) % 8, c: (s.c + 1) % 8 }, { ...s, r: 0, c: 0 }, { ...s, r: 0, c: 0, d: 1 }]) if (window.__gridlock.reloc(i, cand)) return i; } return -1; });
        if (okMove < 0) { await G(page, 'window.__gridlock.arm(null)'); return false; }
      }
      return true;
    };
    const armedOk = await aimCard(D1, cardA, others[0]);
    await sleep(300);
    const planA = await G(D1, 'window.__gridlock.plan()');
    ok(!armedOk || planA.a === cardA, `ARCADE: ${cardA} armed and aimed (${JSON.stringify({ a: planA.a, act: planA.act, reloc: planA.reloc && planA.reloc.i })})`);
    await shotAll(D1, `gl-25-arcade-armed-${cardA}`, SIZES.slice(0, 1).concat(SIZES.slice(2)));
    if (armedOk && cardA !== 'relocate') {
      await D1.reload();
      await D1.waitForFunction(() => window.__gridlock && window.__gridlock.plan() && window.__gridlock.plan().a, { timeout: 30000 }).catch(() => {});
      const planB = await G(D1, 'window.__gridlock.plan()');
      ok(!!planB && planB.a === cardA && (await G(D1, 'window.__gridlock.hand()')).length === 2, 'REJOIN: the armed card and the hand survive a refresh');
    }
    await G(D1, 'window.__gridlock.fire()');
    await waitFor(D1, (s, u) => s.live && s.live.shots && s.live.shots[u], 'arcade lock written', 10000, d1);
    const nodeD = await evalIn(D1, (s, u) => s.live.shots[u], d1);
    ok(!armedOk || nodeD.a === cardA, `ARCADE: the lock-in carries the card (${nodeD.a})`);
    for (const i of alive()) if (pages[i] !== D1) await G(pages[i], 'window.__gridlock.bot({ delay: 200, seed: 31, abilityRate: 1 })');
    await waitFor(pages[hiD], s => s.game.phase === 'show', 'arcade volley', 40000);
    const gDS = await game(pages[hiD]);
    const kinds = [...new Set(gDS.ev.map(e => e.k))];
    log('arcade volley', JSON.stringify(gDS.acts), kinds.join(','));
    if (armedOk) {
      const expect = { sonar: e => e.k === 'sonar' && e.by === d1, cluster: e => e.k === 'shot' && e.a === 'cluster' && e.by === d1, torpedo: e => e.k === 'torpedo' && e.by === d1, shield: e => e.k === 'shield' && e.t === d1, relocate: e => e.k === 'relocate' && e.t === d1, double: null };
      if (expect[cardA]) ok(gDS.ev.some(expect[cardA]), `ARCADE: the ${cardA} shows in the volley's events`);
      else ok((gDS.fire[d1] || []).length === 2, 'ARCADE: DOUBLE TAP fired two shots');
      ok(gDS.acts && gDS.acts[d1] && gDS.acts[d1].a === cardA, 'ARCADE: the card is public once the volley resolves');
      ok(!(gDS.hand[d1] || []).includes(cardA) || handD.filter(c => c === cardA).length > 1, 'ARCADE: the card left the hand');
    }
    if (armedOk && cardA === 'sonar') {
      await D1.waitForFunction(() => window.__gridlock.readouts().length > 0, { timeout: 15000 }).catch(() => {});
      const ro = await G(D1, 'window.__gridlock.readouts()');
      ok(ro.length > 0 && /SIGNALS? DETECTED/.test(ro[0]), `SONAR: a private readout (${ro[0]})`);
      await shotAll(D1, 'gl-26-sonar-readout', SIZES.slice(0, 1));
      const peek = await pages[alive().find(i => uids[i] !== d1)].evaluate((c, u, rk) => import('/js/firebase.js').then(m => m.get(m.dbRef(`glsonar/${c}/${window.__arcade.state.game.matchId}/${u}/${rk}`)).then(() => 'READ', e => String(e.code || e.message))), code, d1, gDS.rk);
      ok(/permission|denied/i.test(peek), `PRIVACY: another player can't read the sonar answer (${peek})`);
    }
    await sleep(2500);
    await shotAll(pages[alive()[1]], 'gl-27-arcade-volley', SIZES.slice(0, 1).concat(SIZES.slice(2)));
    // bots to the end (abilities 60 %), the host killed once more
    for (const i of alive()) await G(pages[i], 'window.__gridlock.bot({ delay: 200, seed: ' + (i + 40) + ' })');
    await waitFor(pages[hiD], s => s.game.round >= 3, 'a few arcade rounds', 120000);
    const h3 = await hostIdx();
    if (alive().length > 2) {
      log('killing host', NAMES[h3]);
      await pages[h3].close(); dead.add(h3);
      const w3 = alive()[0];
      await waitFor(pages[w3], (s, old) => s.meta && s.meta.hostId && s.meta.hostId !== old, 'a new host (arcade)', 40000, uids[h3]);
      ok(true, 'HOST: a new host carried the arcade on');
    }
    const wD = pages[alive()[0]];
    await waitFor(wD, s => s.game.phase === 'final', 'arcade final', 900000);
    const gDF = await game(wD);
    const anyAb = Object.values(gDF.results).some(r => r.ab > 0);
    ok(gDF.winner && anyAb, `ARCADE: a finish, abilities in the results (${name(gDF.winner)} wins${gDF.capped ? ', round cap' : ''}; ${JSON.stringify(Object.fromEntries(Object.entries(gDF.results).map(([u, r]) => [name(u), [r.ab, r.bl, r.bp]])))})`);
    await sleep(4000);
    await cleanText(wD, 'arcade final');
    await shotAll(wD, 'gl-28-arcade-final', SIZES.slice(0, 1).concat(SIZES.slice(2)));
  }

  // ================================================================ frame pacing (a quiet phone during a volley)
  if (process.env.PERF !== '0') {
    const hi3 = await hostIdx();
    await pages[hi3].evaluate(() => import('/js/host.js').then(m => m.rematch()));
    await waitFor(pages[hi3], s => s.game && s.game.phase === 'place', 'rematch', 20000);
    await Promise.all(alive().map(i => pages[i].waitForFunction(() => window.__gridlock && window.__gridlock.fleet(), { timeout: 20000 })));
    for (const i of alive()) await G(pages[i], 'window.__gridlock.autoPlace(); window.__gridlock.setReady(); window.__gridlock.bot({ delay: 300, seed: ' + (i + 5) + ' })');
    const p = pages[alive().at(-1)];
    for (const i of alive()) if (pages[i] !== p) await G(pages[i], 'window.__gridlock.setTier(0)');
    await H.perfRun(p, { viewport: { width: 390, height: 844 }, settle: 5000, extra: page => G(page, 'window.__gridlock.stats()') });
  }
} catch (e) {
  fatal = e;
}
await H.finish(fatal);
