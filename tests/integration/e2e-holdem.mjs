// HOLD'EM (HE3) — THE TABLE SCREEN on the emulators: real phones (the harness), the REAL server dealer (/api/report { holdem } through
// `node scripts/serve.mjs --emu`), the view's own buttons + its hook.
//   cd tests/integration && npm run emulators          (another terminal)
//   node scripts/serve.mjs --emu                        (another terminal — :5173)
//   node tests/integration/e2e-holdem.mjs "<browser>" ./shots-e2e-holdem          FAST=1: 3 phones, a whole TURBO match (≈ 2–3 min)
// FULL (8 phones): a hand played on the real buttons to a showdown, a refresh mid-hand (the same cards back), THE LEAK CHECK on every
// phone, a phone LOCKED through its turn (the shot clock → the time bank → the auto check / fold), the host's phone KILLED mid-hand (a
// guest's poke moves the table on, a new host), 60 fps at 4× CPU at 8 players, then a CASH session: a REBUY + END SESSION → the ledger.
// HE4: FAST also checks a BUST → THE KO CARD → SPECTATING on the busted phone + THE END SCREEN's body (every place as a slim card). FULL adds a
// REFRESH in the MIDDLE of a pot award (the state, no replay), 60 fps at 4× CPU during THE BUSIEST MOMENT (the preview's 8-seat side-pot run-out
// + its three awards — the motion's ghosts, flips + roll-ups), and CASH's LEAVE TABLE (the button + its confirm) → the leaver in THE LEDGER.
import { createHarness } from './kit/harness.mjs';

const H = await createHarness({ name: 'holdem', slot: 'h', hook: '__holdem', sizes: [[390, 844], [402, 874], [430, 932]] });
const { pages, log, ok, sleep, waitFor, evalIn, G, alive, uids, NAMES } = H;
const FAST = H.FAST;
const N = FAST ? 3 : Number(process.env.N || 8);
const CASH_ONLY = process.env.CASH_ONLY === '1';   // (the full path's CASH session alone — a quick re-check)

const pub = p => G(p, 'window.__holdem.pub()');
const hole = p => G(p, 'window.__holdem.hole()');
const uidOf = p => evalIn(p, s => s.uid);
async function ready(p, what, timeout = 40000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { try { const v = await p.evaluate(() => !!(window.__holdem && window.__holdem.pub() && document.querySelector('.he-table'))); if (v) return true; } catch { /* reloading */ } await sleep(200); }
  const diag = await p.evaluate(() => { const s = window.__arcade.state; return JSON.stringify({ hook: !!window.__holdem, game: s.game && { id: s.game.id, phase: s.game.phase, m: s.game.matchId }, status: s.meta && s.meta.status, liveKeys: Object.keys(s.live || {}), table: !!(s.live && s.live.table), tm: s.live && s.live.table && Object.keys(s.live.table), screen: [...document.querySelectorAll('section.screen')].map(e => e.className + ':' + (e.firstElementChild && e.firstElementChild.className)).join(' | ') }); }).catch(e => String(e));
  throw new Error(`timeout: ${what} — ${diag}`);
}
/** one move for whoever's turn it is on this phone: 'shove' (all in when it can, else call / check) · 'passive' (check / call) · 'click' (the real buttons) */
async function moveOn(p, policy) {
  return p.evaluate(async pol => {
    const h = window.__holdem; if (!h) return null;
    const L = h.legal(), me = window.__arcade.state.uid;
    if (!L || L.id !== me) return null;
    if (pol === 'click') {
      const b = document.querySelector(L.canCheck ? '.he-call' : '.he-call');
      if (b) { b.click(); return L.canCheck ? 'check (tap)' : 'call (tap)'; }
      return null;
    }
    const shove = pol === 'shove' || (pol === 'mix' && Math.random() < 0.22);
    if (pol === 'mix' && L.callAllIn && Math.random() < 0.6) { await h.act('fold'); return 'fold'; }   // (some fold to a shove: a match of several hands)
    const a = shove && L.canRaise ? 'allin' : L.canCheck ? 'check' : 'call';
    await h.act(a);
    return a;
  }, policy).catch(() => null);
}
/** drive every live phone (minus `skip`) with a policy until `until(page)` holds on `watch` */
async function drive(policy, until, what, { timeout = 180000, skip = new Set(), watch = null } = {}) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const w = watch || pages[alive()[0]];
    if (await until(w).catch(() => false)) return true;
    for (const i of alive()) if (!skip.has(i)) await moveOn(pages[i], policy);
    await sleep(120);
  }
  throw new Error(`timeout: ${what}`);
}
/** THE LEAK CHECK: the card faces a phone draws = its own two + the board + the cards a seat has SHOWN — nothing else */
async function leakCheck(where) {
  for (const i of alive()) {
    const r = await pages[i].evaluate(() => {
      const h = window.__holdem; const p = h.pub(), mine = (h.hole() || {}).c || [];
      const allowed = new Set([...mine, ...((p && p.table.board) || []), ...((p && p.table.seats) || []).flatMap(x => x.cards || [])]);
      const drawn = [...document.querySelectorAll('.he-card[data-c]')].map(e => e.dataset.c);
      return { bad: drawn.filter(c => !allowed.has(c)), n: drawn.length };
    });
    if (r.bad.length) return ok(false, `LEAK (${where}): ${NAMES[i]} draws ${r.bad.join(' ')}`);
  }
  return ok(true, `LEAK CHECK (${where}): every phone draws only its own cards + the board + the shown hands`);
}

await H.run(async () => {
  const host = await H.joinAll(N);
  log('room', H.code, N, 'phones');

  // ------------------------------------------------------------ the start: the walk inside, then the dealer's hand 1 on every phone
  for (const p of pages) if (p) await p.evaluate(() => { window.__nsPreview = true; });   // (a game being built starts only where asked: config.js#isPlayable)
  ok(await H.startGame(host, 'holdem', { mode: 'tournament', speed: 'turbo' }), 'the host starts HOLD\'EM (a local emulator page: `preview`)');
  for (const i of alive()) await ready(pages[i], `${NAMES[i]}'s table`);
  await waitFor(host, s => s.live && s.live.table && s.live.table.m, 'the public table in the room');
  let p0 = await pub(host);
  await sleep(5500);   // (the first deal waits for the walk inside — start's `at`)
  p0 = await pub(host);
  ok(p0 && p0.hand >= 1 && p0.table.seats.length === N, `hand ${p0 && p0.hand} dealt, ${p0 && p0.table.seats.length} seats`);
  const holes = await Promise.all(alive().map(i => hole(pages[i])));
  ok(holes.every(h => h && Array.isArray(h.c) && h.c.length === 2), 'every phone holds its own two cards');
  ok(new Set(holes.flatMap(h => h.c)).size === 2 * N, 'no card dealt twice');
  const counts = await Promise.all(alive().map(i => pages[i].evaluate(() => [document.querySelectorAll('.he-seat').length, document.querySelectorAll('.he-hand .he-card').length])));
  ok(counts.every(([s, c]) => s === N - 1 && c === 2), `each phone: ${N - 1} opponents on the rail + its own two faces (${JSON.stringify(counts)})`);
  await leakCheck('hand 1');
  await H.cleanText(host, 'the table', '.he');
  const lv = await host.evaluate(() => document.querySelector('.he-level').textContent);
  ok(/^LVL 1 · BLINDS 10\/20 · \d:\d\d$/.test(lv), `the level line: "${lv}"`);
  await H.shotAll(host, 'he-01-start');

  if (FAST) {
    // ---------------------------------------------------------- FAST: a whole TURBO match at 3 — shoves to a winner, the podium, the room
    // (HE4: the first BUST — the busted phone shows THE KO CARD (a fresh bust), then SPECTATING in its own area; the seat goes on the others)
    let koSeen = null;
    const watchKo = async () => {
      for (const i of alive()) {
        const r = await pages[i].evaluate(() => { const h = window.__holdem; return h ? { ko: h.ko(), spec: h.spectating() } : null; }).catch(() => null);
        if (r && r.ko && !koSeen) koSeen = { i, ko: r.ko };
        if (koSeen && koSeen.i === i && r && r.spec) koSeen.spec = true;
      }
    };
    await drive('mix', async p => { await watchKo(); return p.evaluate(() => window.__arcade.state.game && window.__arcade.state.game.phase === 'final'); }, 'the match to its podium', { timeout: 300000, watch: host });
    // (a bust in the match's LAST hand: the podium may come before its KO card — it still shows, over the table, for ~4 s)
    for (let k = 0; k < 30 && !koSeen; k++) { await watchKo(); await sleep(200); }
    ok(!!koSeen && /KNOCKED OUT/.test(koSeen.ko) && /(2ND|3RD) OF 3/.test(koSeen.ko) && /HAND/.test(koSeen.ko), `THE KO CARD on the busted phone: "${koSeen && koSeen.ko}"`);
    const fin0 = await pub(host), lastHand = fin0.hand;
    const firstOut = [...(fin0.places || [])].sort((a, b) => b.place - a.place)[0];
    if (firstOut && firstOut.hand < lastHand) ok(!!(koSeen && koSeen.spec), 'then SPECTATING in its own area (the table played on)');
    else log('the first bust ended the match in the same hand — no table left to spectate');
    const hands = (await pub(host)).hands;
    ok(hands >= 1, `the match ran ${hands} hand(s) to a winner`);
    const fin = await pub(host);
    ok(fin.ended && fin.rep === 'done' && fin.winner, `the dealer ended it (winner ${fin.winner}), its result sent (${fin.rep})`);
    const g = await evalIn(host, s => s.game);
    ok(Array.isArray(g.ranks) && g.ranks.length === 3 && g.ranks[0].uid === fin.winner, `the podium's places from the dealer (${JSON.stringify(g.ranks)})`);
    for (const i of alive()) await pages[i].waitForSelector('.he-final .he-fs', { timeout: 15000 }).catch(() => {});
    const fs = await host.evaluate(() => { const b = document.querySelector('.he-final .final-body[data-game="holdem"]'); return b && { all: b.dataset.podium, win: (b.querySelector('.he-fs-name') || {}).textContent, rows: b.querySelectorAll('.he-fs-list > li').length, frameList: document.querySelectorAll('.he-final .final > .board-list').length, back: !!document.querySelector('.he-final .final-back') }; });
    ok(fs && fs.all === 'all' && fs.rows === 3 && fs.frameList === 0 && fs.back && !!fs.win, `THE END SCREEN: the console's frame + HOLD'EM's body — ${fs && fs.win} WINS HOLD'EM, every place as a slim card (${fs && fs.rows}), no second list`);
    await H.shotAll(host, 'he-09-final');
    await H.backToLobby(host);
    await waitFor(host, s => s.meta.status === 'lobby' && !s.game, 'back in the room', 30000);
    return;
  }

  let nh = host;
  if (!CASH_ONLY) {
  // ------------------------------------------------------------ FULL: a REFRESH mid-hand — the same hand + the same two cards back
  const ri = alive().find(i => pages[i] !== host);
  const before = await hole(pages[ri]);
  await H.refresh(pages[ri]);
  await ready(pages[ri], 'the refreshed table');
  await sleep(800);
  const after = await hole(pages[ri]);
  const pr = await pub(pages[ri]);
  ok(after && before && after.h === before.h && JSON.stringify(after.c) === JSON.stringify(before.c) && pr.hand === before.h, `REFRESH mid-hand: ${NAMES[ri]} is back on hand ${pr.hand} with the same ${after && after.c.join(' ')}`);

  // ------------------------------------------------------------ one hand on the REAL buttons (CALL / CHECK taps) to its showdown
  const handA = (await pub(host)).hand;
  await drive('click', p => pub(p).then(x => x.hand > handA || x.table.street === 'done'), 'the hand to its end (taps)', { timeout: 120000, watch: host });
  const sd = await pub(host);
  ok(sd.table.street === 'done' || sd.hand > handA, `hand ${handA} played out on the buttons (${sd.table.street})`);
  if (sd.table.street === 'done' && !sd.table.result.byFold) {
    const shown = sd.table.seats.filter(x => x.cards && x.cards.length).length;
    ok(shown >= 2, `the showdown: ${shown} hands turned up`);
    await leakCheck('the showdown');
    await H.shotAll(host, 'he-02-showdown');
  }

  // ------------------------------------------------------------ HE4: a REFRESH in the MIDDLE of a pot award — the state, never a replay
  {
    let mid = null;
    await drive('passive', async () => {
      for (const i of alive()) {
        if (pages[i] === host) continue;
        const a = await pages[i].evaluate(() => window.__holdem && window.__holdem.award()).catch(() => null);
        if (a) { mid = { i, a }; return true; }
      }
      return false;
    }, 'a pot being awarded on a guest', { timeout: 150000, watch: host }).catch(() => null);
    if (mid) {
      const rp = pages[mid.i];
      await H.refresh(rp);
      await ready(rp, 'the table after a refresh mid-award');
      await sleep(250);
      const r = await rp.evaluate(() => {
        const h = window.__holdem, p = h.pub(), t = p.table;
        const stacks = [...document.querySelectorAll('.he-seat')].map(e => e.querySelector('.he-sstack').textContent.replace(/,/g, ''));
        const want = t.seats.filter(x => x.id !== window.__arcade.state.uid).map(x => String(x.stack));
        return { motion: h.motion(), award: h.award(), ghosts: document.querySelectorAll('.he-ghost').length, stacksOk: stacks.every(v => want.includes(v)), street: t.street };
      });
      ok(!r.motion && !r.award && r.ghosts === 0 && r.stacksOk, `REFRESH MID-AWARD ("${mid.a}"): ${NAMES[mid.i]} lands on the state — no motion, no award replayed, every stack its real number (${r.street})`);
    } else ok(false, 'REFRESH MID-AWARD: no pot award was caught on a guest');
  }

  // ------------------------------------------------------------ HE4: 60 fps at 4× CPU in THE BUSIEST MOMENT (8 seats: the side-pot run-out + three awards)
  if (process.env.PERF !== '0') {
    const bctx = await H.browser.createBrowserContext(), bp = await bctx.newPage();
    await bp.setViewport({ width: 390, height: 844, deviceScaleFactor: process.env.GPU ? 2.75 : 1, isMobile: true, hasTouch: true });
    const cdp = await bp.target().createCDPSession();
    await bp.goto(`${H.BASE}/tests/integration/holdem-preview.html?state=sidepots&n=8`);
    await bp.waitForFunction(() => document.body.dataset.ready === '1', { timeout: 30000 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: H.CPU });
    await sleep(7400);   // (the run-out from ~0.6 s, the hands' awards ~4–7.4 s: the frames buffer = the last ~4 s — the river, the showdown, all three pots)
    const f = await bp.evaluate(() => window.__holdem.fps());
    const busy = await bp.evaluate(() => window.__holdem.pub().table.street);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    const s2 = [...f].sort((a, b) => a - b);
    const p50 = +(s2[Math.floor(s2.length * 0.5)] || 0).toFixed(1), p95 = +(s2[Math.floor(s2.length * 0.95)] || 0).toFixed(1);
    log('busiest moment', JSON.stringify({ p50, p95, n: s2.length, busy }));
    ok(p50 <= 17.5 && s2.length > 150, `PERF (the busiest moment, ${H.CPU}× CPU, 8 seats — the side-pot run-out + three awards): p50 ${p50} / p95 ${p95} ms over ${s2.length} frames`);
    await bctx.close();
  }

  // ------------------------------------------------------------ a phone LOCKED through its turn: 20 s, then its 30 s TIME BANK, then the auto move
  let lockI = null, lockUid = null;
  await drive('passive', async () => {
    for (const i of alive()) {
      if (pages[i] === host) continue;
      const l = await G(pages[i], 'window.__holdem.legal()');
      const u = await uidOf(pages[i]);
      if (l && l.id === u) { lockI = i; lockUid = u; return true; }
    }
    return false;
  }, 'a guest\'s turn', { timeout: 120000, watch: host, skip: new Set(alive().filter(i => pages[i] !== host)) }).catch(() => null);
  if (lockI != null) {
    log('locking', NAMES[lockI]);
    const lh = (await pub(host)).hand;
    const t0 = Date.now();
    const end = Date.now() + 75000;
    let seen = { bank: false, out: false };
    while (Date.now() < end && !seen.out) {
      const x = await pub(host);
      const ev = (x.ev || []).filter(e => e.id === lockUid && e.hand === lh);
      seen = { bank: seen.bank || ev.some(e => e.t === 'timebank'), out: ev.some(e => e.t === 'timeout') };
      await sleep(1000);
    }
    ok(seen.bank && seen.out, `LOCKED: ${NAMES[lockI]}'s 20 s ran out → the TIME BANK → the auto check / fold (${Math.round((Date.now() - t0) / 1000)} s)`);
  } else ok(false, 'LOCKED: no guest turn came up');

  // ------------------------------------------------------------ 60 fps at 4× CPU, 8 players on the rail
  if (process.env.PERF !== '0') await H.perfRun(pages[alive().find(i => pages[i] !== host)], { viewport: { width: 390, height: 844 }, tiers: [0], settle: 5000 });

  // ------------------------------------------------------------ the HOST's phone KILLED mid-hand: the table moves on (a guest pokes), a new host
  const handK = (await pub(host)).hand;
  const hi = await H.killHost({ timeout: 60000 });
  nh = pages[hi];
  log('the new host', NAMES[hi]);
  await drive('passive', p => pub(p).then(x => x.hand > handK), 'the table moves on without the old host', { timeout: 150000, watch: nh });
  ok(true, `HOST KILLED mid-hand ${handK}: the table moved on to hand ${(await pub(nh)).hand} (guest pokes + ${NAMES[hi]} the new host)`);
  await leakCheck('after the host died');
  }

  // ------------------------------------------------------------ END GAME → back to the room → a CASH session: a REBUY, then END SESSION
  await H.backToLobby(nh);
  await waitFor(nh, s => s.meta.status === 'lobby' && !s.game, 'back in the room', 30000);
  await sleep(1500);
  await nh.evaluate(() => { window.__nsPreview = true; });   // (a refreshed phone may be the new host)
  ok(await H.startGame(nh, 'holdem', { mode: 'cash', speed: 'turbo' }), 'the new host starts a CASH session (it replaces the unfinished tournament)');
  for (const i of alive()) await ready(pages[i], `${NAMES[i]}'s CASH table`);
  await sleep(5500);
  const c0 = await pub(nh);
  ok(c0.mode === 'cash' && c0.table.seats.length === alive().length, `CASH: ${c0.table.seats.length} seats (the online players), BLINDS 5/10`);
  // shoves until a phone is broke, then its REBUY button
  let rebought = null;
  const tEnd = Date.now() + 180000;
  while (!rebought && Date.now() < tEnd) {
    for (const i of alive()) await moveOn(pages[i], 'shove');
    for (const i of alive()) {
      const b = await pages[i].evaluate(() => { const x = [...document.querySelectorAll('.he-mini')].find(e => /REBUY/.test(e.textContent)); if (x) { x.click(); return true; } return false; });
      if (b) { rebought = i; break; }
    }
    await sleep(150);
  }
  if (rebought != null) {
    const u = await uidOf(pages[rebought]);
    await waitFor(nh, (s, id) => { const n = s.live.table; return n && n.e && Object.values(n.e).some(v => typeof v === 'string' && v.includes('"rebuy"') && v.includes(id)); }, 'the rebuy on the table', 20000, u);
    ok(true, `REBUY: ${NAMES[rebought]} bought back in from 0 (the button)`);
  } else ok(false, 'REBUY: nobody went broke');
  await H.shotAll(nh, 'he-05-cash');
  // HE5 — LEAVE IS ALWAYS THERE: a guest in a running hand taps LEAVE AFTER THIS HAND → LEAVING… · CANCEL (queued by the dealer, they play on)
  // → the hand ends → gone at the next deal → SPECTATING; their chips in the ledger
  let leftUid = null, leftName = '';
  {
    const gi = alive().filter(i => pages[i] !== nh);
    const end = Date.now() + 90000;
    let li = null;
    while (li == null && Date.now() < end) {
      if (await pages[gi[0]].evaluate(() => window.__holdem.leave() === 'after').catch(() => false)) li = gi[0];
      else for (const i of alive()) await moveOn(pages[i], 'passive');
      await sleep(150);
    }
    if (li != null) {
      leftUid = await uidOf(pages[li]); leftName = NAMES[li];
      await pages[li].evaluate(() => document.querySelector('.he-leave').click());
      for (let w = 0; w < 50 && (await pages[li].evaluate(() => window.__holdem.leave())) !== 'queued'; w++) await sleep(150);
      const q = await pages[li].evaluate(() => window.__holdem.leave());
      await H.shot(pages[li], 'he-06-leave').catch(() => {});
      ok(q === 'queued', `LEAVE AFTER THIS HAND: ${leftName}'s tap queued it (the button: ${q})`);
      const t0 = Date.now();
      while (Date.now() - t0 < 60000) {
        if (await nh.evaluate(id => { const n = window.__arcade.state.live.table; return !!(n && n.p && n.p[id] && /"left":true/.test(n.p[id])); }, leftUid)) break;
        for (const i of alive()) await moveOn(pages[i], 'passive');
        await sleep(200);
      }
      await sleep(600);
      ok(await pages[li].evaluate(() => window.__holdem.spectating()), `LEAVE AFTER THIS HAND: ${leftName} played the hand out, then left — now SPECTATING`);
    } else ok(false, 'LEAVE: the button never offered LEAVE AFTER THIS HAND');
  }
  // END SESSION: the host's button, twice (the second tap confirms) → the session closes when the running hand ends
  await nh.evaluate(() => { const b = document.querySelector('.he-hostbar button'); b && b.click(); });
  await sleep(300);
  await nh.evaluate(() => { const b = document.querySelector('.he-hostbar button'); b && b.click(); });
  await drive('passive', p => p.evaluate(() => window.__arcade.state.game && window.__arcade.state.game.phase === 'final'), 'END SESSION → the podium', { timeout: 120000, watch: nh });
  const cf = await pub(nh);
  const sum = (cf.ledger || []).reduce((n, r) => n + r.net, 0);
  ok(cf.ended && cf.rep === 'done' && cf.ledger && sum === 0, `THE LEDGER: ${cf.ledger && cf.ledger.length} rows, Σ net = ${sum} (chips only)`);
  await sleep(1500);
  const lg = await nh.evaluate(() => { const b = document.querySelector('.he-final .he-fs.is-cash'); return b && { rows: [...b.querySelectorAll('.he-fs-list > li')].map(li => li.textContent), foot: (b.querySelector('.he-fs-foot') || {}).textContent, money: /\$/.test(b.textContent) }; });
  const played = (cf.ledger || []).filter(r => r.hands > 0).length;
  ok(lg && lg.rows.length === played && !lg.money && /HANDS? PLAYED/.test(lg.foot || '') && (!leftName || lg.rows.some(r => r.includes(leftName))), `THE LEDGER SCREEN: ${lg && lg.rows.length} slim-card rows (BOUGHT IN · FINAL · NET)${leftName ? `, the leaver ${leftName} among them` : ''}; "${lg && lg.foot}"; no money signs`);
  await H.cleanText(nh, 'the ledger', '.he');
  await H.shotAll(nh, 'he-09-ledger');
  await H.backToLobby(nh);
  await waitFor(nh, s => s.meta.status === 'lobby' && !s.game, 'back in the room', 30000);
});
