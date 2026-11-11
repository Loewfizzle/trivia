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
// HE7: FULL adds ROTATE MID-HAND (a phone turned sideways + back: the same hand + cards, no replay, an open slider closes, a real tap still
// acts), ONE WHOLE HAND SIDEWAYS at 8 (one phone a 1440 × 900 desktop) on real, uncovered taps, and the busiest moment's 60 fps SIDEWAYS too.
// HE8: FAST starts it as THE OWNER'S LIVE TEST (the live rule on: testHoldemGate — a normal host refused by the dealer, the owner's list shows
// HOLD'EM · TEST, a guest's doesn't) + THE WAKE LOCK (seated → on, busted → off, the end → off). FULL adds THE TOUGHNESS (a slow line:
// pressed at once, a double tap sends once, a pre-action lit at once; NO SIGNAL 10 s on someone else's turn + on your own, 40 s into your time
// bank; an APP SWITCH of 30 s — the state, no replay, the sound back on a tap; the wake lock given back on a hidden page + taken again).
// TOUGH_ONLY=1 = the start + THE TOUGHNESS alone (N=4 is enough).
import { createHarness } from './kit/harness.mjs';
import { GAIN } from '../../js/games/holdem/sfx.js';

const H = await createHarness({ name: 'holdem', slot: 'h', hook: '__holdem', sizes: [[390, 844], [402, 874], [430, 932]] });
const { pages, log, ok, sleep, waitFor, evalIn, G, alive, uids, NAMES } = H;
const FAST = H.FAST;
const N = FAST ? 3 : Number(process.env.N || 8);
const CASH_ONLY = process.env.CASH_ONLY === '1';   // (the full path's CASH session alone — a quick re-check)
const TOUGH_ONLY = process.env.TOUGH_ONLY === '1';   // (HE8: the start + THE TOUGHNESS alone)
const DB = 'http://127.0.0.1:9000', NS = 'demo-arcade-default-rtdb';
const dbPut = (path, v) => fetch(`${DB}/${path}.json?ns=${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: JSON.stringify(v) });
const pidOf = async (p, i) => { for (let k = 0; k < 60; k++) { const m = await p.evaluate(sl => { try { return JSON.parse(localStorage.getItem(`na:${sl}:me`) || 'null'); } catch { return null; } }, `h${i}`).catch(() => null); if (m && m.pid) return m.pid; await sleep(400); } return null; };
const awakeOf = p => p.evaluate(async () => { const w = await import('/js/wakelock.js'); return { view: window.__holdem ? window.__holdem.awake() : null, ...w.awakeState() }; }).catch(() => null);
/** the games sheet as the room shows it on this phone (the dock's GAMES) → the game ids listed + which carry the TEST tag */
async function gamesList(p) {
  await p.evaluate(() => { const b = document.querySelector('.rdk-games'); if (b) b.click(); });
  await p.waitForSelector('.rc-game', { timeout: 10000 }).catch(() => {});
  await sleep(300);
  const r = await p.evaluate(() => [...document.querySelectorAll('.rc-game')].map(b => ({ id: b.dataset.game, test: !!b.querySelector('.rc-game-test') })));
  await p.evaluate(() => { document.querySelectorAll('.sh:not(.is-out) .sh-x, .sh:not(.is-out) .sh-close').forEach(e => e.click()); }).catch(() => {});
  await p.keyboard.press('Escape').catch(() => {});
  await sleep(400);
  return r;
}

const pub = p => G(p, 'window.__holdem.pub()');
const VIEW_UP = H.VIEW;   // (HE7: back upright — the harness's phone)
const hole = p => G(p, 'window.__holdem.hole()');
const uidOf = p => evalIn(p, s => s.uid);
// HE5 — THE SOUNDS, checked silently (headless audio stays locked — the PLAN is what's tested: sfx.js#planned): every cue a known sound at
// its table gain (the deals 1.1 × 0.85–1.0, a blind 0.75 ×), the deals ≥ 110 ms apart, a shuffle before each run of deals (2 a player)
async function soundCheck(page, who) {
  const list = await page.evaluate(() => window.__holdem.planned()).catch(() => []);
  const bad = list.filter(c => !(c.name in GAIN));
  const off = list.filter(c => c.name === 'deal' ? !(c.gain >= GAIN.deal * 0.85 - 0.01 && c.gain <= GAIN.deal + 0.01 && c.rate >= 0.959 && c.rate <= 1.041)
    : !(Math.abs(c.gain - GAIN[c.name]) < 0.01 || (c.name === 'chip-bet' && Math.abs(c.gain - GAIN[c.name] * 0.75) < 0.01)));
  const deals = list.filter(c => c.name === 'deal').sort((a, b) => a.when - b.when);
  let close = 0;
  for (let i = 1; i < deals.length; i++) { const g = deals[i].when - deals[i - 1].when; if (g < 105 && g > -1) close++; }
  const shuffles = list.filter(c => c.name === 'shuffle').length;
  const n = name => list.filter(c => c.name === name).length;
  ok(list.length > 0 && !bad.length && !off.length && !close && (shuffles === 0 || deals.length % 2 === 0),
    `THE SOUNDS (${who}): ${list.length} cues planned — ${shuffles} shuffle · ${deals.length} deal · ${n('chip-bet') + n('chip-raise') + n('all-in')} chips · ${n('pot-win')} pot-win · ${n('your-turn')} your-turn · ${n('knockout')} knockout; every gain from the table${off.length ? ` (OFF: ${JSON.stringify(off.slice(0, 3))})` : ''}, the deals ≥ 110 ms apart${close ? ` (${close} too close)` : ''}`);
  return list;
}
async function ready(p, what, timeout = 40000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { try { const v = await p.evaluate(() => !!(window.__holdem && window.__holdem.pub() && document.querySelector('.he-table'))); if (v) return true; } catch { /* reloading */ } await sleep(200); }
  const diag = await p.evaluate(() => { const s = window.__arcade.state; return JSON.stringify({ hook: !!window.__holdem, game: s.game && { id: s.game.id, phase: s.game.phase, m: s.game.matchId }, status: s.meta && s.meta.status, liveKeys: Object.keys(s.live || {}), table: !!(s.live && s.live.table), tm: s.live && s.live.table && Object.keys(s.live.table), screen: [...document.querySelectorAll('section.screen')].map(e => e.className + ':' + (e.firstElementChild && e.firstElementChild.className)).join(' | ') }); }).catch(e => String(e));
  throw new Error(`timeout: ${what} — ${diag}`);
}
/** one move for whoever's turn it is on this phone: 'shove' (all in when it can, else call / check) · 'passive' (check / call) · 'click' (the real buttons)
 *  · HE7 'tap' (a REAL tap at CALL / CHECK's centre — proved uncovered first: nothing of the table over it, in whatever layout the phone has) */
const tapped = { n: 0, covered: [] };
async function moveOn(p, policy) {
  if (policy === 'tap') {
    const at = await p.evaluate(() => {
      const h = window.__holdem; if (!h) return null;
      const L = h.legal(), me = window.__arcade.state.uid;
      if (!L || L.id !== me) return null;
      const b = document.querySelector('.he-actions .he-call'); if (!b) return null;
      const r = b.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, top = document.elementFromPoint(x, y);
      const desc = e => (e ? `${e.tagName}${e.id ? `#${e.id}` : ''}${typeof e.className === 'string' && e.className ? `.${e.className.trim().split(/\s+/).join('.')}` : ''}` : 'nothing');
      return { x, y, free: !!top && (top === b || b.contains(top)), what: top ? `${desc(top)} in ${desc(top.parentElement)} in ${desc(top.parentElement && top.parentElement.parentElement)}` : 'nothing' };
    }).catch(() => null);
    if (!at) return null;
    if (!at.free) { tapped.covered.push(at.what); return null; }
    await p.mouse.click(at.x, at.y);
    tapped.n++;
    return 'tap';
  }
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

// ------------------------------------------------------------------ HE8 — THE TOUGHNESS (FULL, or TOUGH_ONLY=1): real-world phones
/** drive the others (check / call) until it's phone i's turn */
const turnFor = (i, what, timeout = 150000) => drive('passive', async () => { const L = await G(pages[i], 'window.__holdem.legal()'); return !!L && L.id === (await uidOf(pages[i])); }, what, { timeout, skip: new Set([i]), watch: pages[i] });
const centre = (p, sel) => p.evaluate(q => { const b = document.querySelector(q); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel);
/** a phone's app switch: the page hidden / shown (visibilityState + hidden + the event — as iOS's) */
const setHidden = (p, on) => p.evaluate(hid => { for (const [k, v] of [['visibilityState', hid ? 'hidden' : 'visible'], ['hidden', hid]]) Object.defineProperty(document, k, { configurable: true, get: () => v }); document.dispatchEvent(new Event('visibilitychange')); }, on);
const playOn = async (ms, skip) => { const end = Date.now() + ms; while (Date.now() < end) { for (const i of alive()) if (!skip.has(i)) await moveOn(pages[i], 'passive'); await sleep(150); } };
const barOf = p => p.evaluate(() => { const i = document.querySelector('.he-plate .he-clock > i'); const m = i && /scaleX\(([\d.]+)\)/.exec(i.style.transform); return m ? Number(m[1]) : null; });
const audioOf = p => p.evaluate(() => import('/js/audio/engine.js').then(m => { const c = m.getContext(); return c ? c.state : 'none'; })).catch(() => 'err');
const tapFelt = async p => { const c = await centre(p, '.he-print'); if (c) await p.mouse.click(c.x, c.y - 30); };

async function toughness(host, used = new Set()) {
  const seated = async i => { const x = await pub(pages[i]); const u = await uidOf(pages[i]); const s = x && x.table.seats.find(y => y.id === u); return !!s && s.status !== 'out' && !s.away; };
  const guests = [];
  for (const i of alive()) if (pages[i] !== host && !used.has(i) && (await seated(i))) guests.push(i);
  if (guests.length < 2) { ok(false, `THE TOUGHNESS: not enough seated guests (${guests.length})`); return; }
  const pick = k => guests[k % guests.length];
  const [ga, gb, gc, gd] = [pick(0), pick(1), pick(2), pick(3)];
  log('toughness on', NAMES[ga], NAMES[gb], NAMES[gc], NAMES[gd]);

  // ---------------------------------------------------------------- A SLOW LINE (slow 3G-ish: 300 ms each way, 400 kbps) on one phone
  {
    const p = pages[ga];
    const cdp = await p.target().createCDPSession();
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 300, downloadThroughput: 51200, uploadThroughput: 51200 });
    const sent = [];
    const onReq = r => { if (r.method() === 'POST' && r.url().includes('/api/report')) { const m = /"holdem":"(\w+)"/.exec(r.postData() || ''); if (m && m[1] !== 'poke') sent.push(m[1]); } };
    p.on('request', onReq);
    // (1) a PRE-ACTION lit AT ONCE — before the server's answer, never a dead toggle
    await drive('passive', () => p.evaluate(() => !!document.querySelector('.he-pres .he-pre') && !document.querySelector('.he-actions.is-busy')), `${NAMES[ga]}'s pre-actions`, { timeout: 120000, watch: p });
    const pc = await centre(p, '.he-pres .he-pre');
    await p.mouse.click(pc.x, pc.y);
    const lit = await p.evaluate(() => ({ on: !!document.querySelector('.he-pres .he-pre.is-on'), real: (window.__holdem.hole() || {}).pre || null, busy: !!window.__holdem.busy() }));
    await waitFor(p, () => !!((window.__holdem.hole() || {}).pre) || !document.querySelector('.he-pres'), 'the pre-action reached the server', 15000).catch(() => {});
    ok(lit.on && !lit.real && lit.busy, `A SLOW LINE (300 ms + 400 kbps): ${NAMES[ga]}'s PRE-ACTION lit at once — before the server's answer (pending)`);
    // (take it back, so the next turn is a real one)
    if (await p.evaluate(() => !!document.querySelector('.he-pres .he-pre.is-on'))) {
      await waitFor(p, () => !window.__holdem.busy(), 'the pre-action settled', 10000).catch(() => {});
      const c2 = await centre(p, '.he-pres .he-pre.is-on'); if (c2) await p.mouse.click(c2.x, c2.y);
      await waitFor(p, () => !window.__holdem.busy() && !((window.__holdem.hole() || {}).pre), 'the pre-action cleared', 10000).catch(() => {});
    }
    // (2) YOUR TURN: CALL / CHECK pressed at once, the impatient DOUBLE TAP sends once, the table catches up, nothing held after
    await turnFor(ga, `${NAMES[ga]}'s turn on the slow line`);
    const seq0 = (await pub(p)).seq;
    const b = await centre(p, '.he-actions .he-buttons .he-call');
    const n1 = sent.length;
    const t0 = Date.now();
    await p.mouse.click(b.x, b.y);
    const fb = await p.evaluate(() => ({ sent: !!document.querySelector('.he-actions .he-call.is-sent'), busy: window.__holdem.busy(), dim: document.querySelector('.he-actions').classList.contains('is-busy') }));
    await p.mouse.click(b.x, b.y);
    await waitFor(p, (s, q) => window.__holdem.pub().seq > q && !window.__holdem.busy(), 'the move on the slow line', 25000, seq0).catch(async e => { log('slow-line diag', JSON.stringify({ seq0, fb, sent: sent.slice(n1), now: await p.evaluate(() => ({ seq: window.__holdem.pub().seq, busy: window.__holdem.busy(), legal: window.__holdem.legal(), me: window.__arcade.state.uid, net: window.__arcade.state.net })) })); throw e; });
    const ms = Date.now() - t0;
    await sleep(1200);
    const acts = sent.slice(n1).filter(x => x === 'act').length;
    const after = await p.evaluate(() => ({ busy: window.__holdem.busy(), dim: document.querySelector('.he-actions').classList.contains('is-busy'), sent: document.querySelectorAll('.he-actions .is-sent, .he-actions .is-press').length }));
    ok(fb.sent && fb.busy && fb.dim && acts === 1 && !after.busy && !after.dim && !after.sent,
      `A SLOW LINE: CALL / CHECK pressed AT ONCE (the pending look, ${ms} ms to the answer on this table), the impatient DOUBLE TAP sent ONCE (${acts} act), then caught up — nothing held, nothing dead`);
    // (3) the next turn: RAISE's slider opens at once (no network) → BACK; a PRESET pressed at once → the table moves
    await turnFor(ga, `${NAMES[ga]}'s next turn on the slow line`);
    const sl = await p.evaluate(() => { const r = document.querySelector('.he-actions .he-raise'); if (!r || r.disabled) return null; r.click(); const open = !!document.querySelector('.he-slider'); const bk = document.querySelector('.he-slider .he-back-b'); if (bk) bk.click(); return open && !!document.querySelector('.he-actions .he-buttons .he-call'); });
    const seq1 = (await pub(p)).seq;
    const pr = (await centre(p, '.he-presets .he-preset')) || (await centre(p, '.he-actions .he-buttons .he-call'));
    await p.mouse.click(pr.x, pr.y);
    const fb2 = await p.evaluate(() => !!document.querySelector('.he-actions .is-sent'));
    await waitFor(p, (s, q) => window.__holdem.pub().seq > q && !window.__holdem.busy(), 'the preset on the slow line', 25000, seq1);
    ok((sl === null || sl === true) && fb2, `A SLOW LINE: RAISE's slider opened + closed at once (${sl === null ? 'no raise allowed' : 'no network'}), a PRESET pressed at once → the dealer moved on`);
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    p.off('request', onReq);
    await cdp.detach().catch(() => {});
  }

  // ---------------------------------------------------------------- NO SIGNAL 10 s on SOMEONE ELSE's turn → back: the right state, no replay
  {
    const p = pages[gb];
    await drive('passive', () => p.evaluate(() => { const L = window.__holdem.legal(); return !!L && L.id !== window.__arcade.state.uid; }), 'someone else\'s turn', { timeout: 60000, watch: p });
    await p.setOfflineMode(true);
    await sleep(700);
    const off = await p.evaluate(() => ({ he: document.querySelector('.he').classList.contains('is-offline'), net: document.getElementById('net').classList.contains('is-on') }));
    await playOn(6000, new Set([gb]));
    // (HE10 — B8: back while the table is BUSY — the last moves only just made: the newest missed event fresh, the oldest ~6 s old — the
    //  whole missed run is history (motion-plan.js#freshEvents, A5), never a squeezed burst)
    await sleep(150);
    const hostSeq = (await pub(host)).seq, planned0 = await p.evaluate(() => window.__holdem.planned().length);
    await p.setOfflineMode(false);
    await waitFor(p, (s, q) => window.__holdem.pub().seq >= q && s.net === 'online' && !document.querySelector('.he.is-offline'), 'back online: caught up', 25000, hostSeq);
    // (back: only what is NEW may sound / move — e.g. YOUR TURN if the table reached you meanwhile: the chime + the buttons rising, never the past)
    const back = await p.evaluate(n0 => { const L = window.__holdem.legal(); return { motion: window.__holdem.motion(), planned: window.__holdem.planned().length, cues: window.__holdem.planned().slice(n0).map(c => c.name), mine: !!L && L.id === window.__arcade.state.uid, he: document.querySelector('.he').classList.contains('is-offline') }; }, planned0);
    const still = (await pub(host)).seq === hostSeq;
    log('no-signal diag', JSON.stringify({ off, back, still, planned0 }));
    ok(off.he && off.net && !back.he && (!still || (back.cues.every(c => c === 'your-turn' && back.mine) && (!back.motion || back.mine))),
      `NO SIGNAL 10 s on someone else's turn (${NAMES[gb]}): the console's SIGNAL LOST + the buttons waiting, then back on the table's latest (seq ${hostSeq}) — ${still ? (back.mine ? 'nothing replayed (only YOUR TURN — it reached you meanwhile)' : 'no motion, no sound replayed') : 'the table moved on meanwhile'}`);
  }

  // ---------------------------------------------------------------- NO SIGNAL 10 s on YOUR OWN turn: the clock keeps the server's truth; back → a real tap acts
  {
    const p = pages[gc];
    await turnFor(gc, `${NAMES[gc]}'s turn (to lose the signal on)`);
    await p.setOfflineMode(true);
    const b1 = await barOf(p); await sleep(2000); const b2 = await barOf(p);
    const c = await centre(p, '.he-actions .he-buttons .he-call');
    if (c) await p.mouse.click(c.x, c.y);   // (a tap with no signal: waits, sends nothing)
    const tapOff = await p.evaluate(() => window.__holdem.busy());
    await sleep(7500);
    await p.setOfflineMode(false);
    const tOn = Date.now();
    await waitFor(p, (s) => s.net === 'online', 'the socket back', 20000).catch(() => {});
    log('socket back after', Date.now() - tOn, 'ms');
    await waitFor(p, (s, q) => window.__holdem.pub().seq >= q && s.net === 'online' && !document.querySelector('.he.is-offline'), 'back online on its own turn', 20000, (await pub(host)).seq);
    await sleep(500);
    const mine = await p.evaluate(() => { const L = window.__holdem.legal(); return !!L && L.id === window.__arcade.state.uid; });
    const seq0 = (await pub(p)).seq;
    const how = mine ? await moveOn(p, 'tap') : null;
    if (how) await waitFor(p, (s, q) => window.__holdem.pub().seq > q, 'the tap after the signal came back', 15000, seq0).catch(() => {});
    log('own-turn diag', JSON.stringify({ b1, b2, tapOff, mine, how }));
    ok(b1 != null && b2 != null && b2 < b1 - 0.05 && !tapOff && mine && how === 'tap' && (await pub(p)).seq > seq0,
      `NO SIGNAL 10 s on ${NAMES[gc]}'s OWN turn: the bar kept draining from the server's numbers (${b1} → ${b2}), a tap sent nothing, back online still its turn → a REAL tap acted`);
  }

  // ---------------------------------------------------------------- NO SIGNAL 40 s on YOUR turn: the 20 s ran out → back INSIDE the time bank → the timeout
  {
    const p = pages[gd], u = await uidOf(p);
    await turnFor(gd, `${NAMES[gd]}'s turn (40 s with no signal)`);
    const hand = (await pub(p)).hand;
    await p.setOfflineMode(true);
    await sleep(40000);   // (the host pokes the 20 s deadline → the bank starts at the ORIGINAL deadline — the server's clock)
    await p.setOfflineMode(false);
    await waitFor(p, (s, q) => window.__holdem.pub().seq >= q && s.net === 'online', 'back online inside the bank', 20000, (await pub(host)).seq);
    await sleep(400);
    const v = await p.evaluate(async () => { const { serverNow } = await import('/js/firebase.js'); const t = window.__holdem.pub().table, me = window.__arcade.state.uid; const ck = document.querySelector('.he-plate .he-clock');
      return { bank: !!t.bankOn, mine: (t.seats.find(x => x.seat === t.turn) || {}).id === me, left: Math.round(t.deadline - serverNow()), red: !!(ck && ck.classList.contains('is-bank') && !ck.hidden) }; });
    const end = Date.now() + 25000;
    let timedOut = false;
    while (Date.now() < end && !timedOut) { const x = await pub(host); timedOut = (x.ev || []).some(e => e.t === 'timeout' && e.id === u && e.hand === hand); await sleep(800); }
    ok(v.bank && v.mine && v.left > 2000 && v.left < 16000 && v.red && timedOut,
      `NO SIGNAL 40 s on ${NAMES[gd]}'s turn: back INSIDE the time bank (${v.left} ms left by the server's clock, the bar red-orange), then the TIMEOUT applied by the server`);
  }

  // ---------------------------------------------------------------- AN APP SWITCH (30 s hidden): the state, no replay, the sound back on a tap
  {
    const p = pages[gb];
    await tapFelt(p); await sleep(500);
    const a0 = await audioOf(p);
    await setHidden(p, true);
    await playOn(26000, new Set([gb]));
    await sleep(150);   // (HE10 — B8: back while the table is BUSY, not after a quiet moment)
    const a1 = await audioOf(p);
    const hostSeq = (await pub(host)).seq, planned0 = await p.evaluate(() => window.__holdem.planned().length);
    await setHidden(p, false);
    await sleep(500);
    const back = await p.evaluate(() => ({ motion: window.__holdem.motion(), planned: window.__holdem.planned().length, seq: window.__holdem.pub().seq }));
    await tapFelt(p); await sleep(900);
    const a2 = await audioOf(p);
    const still = (await pub(host)).seq === hostSeq;
    ok(back.seq >= hostSeq && (!still || (!back.motion && back.planned === planned0)) && (a0 !== 'running' || (a2 === 'running')),
      `AN APP SWITCH (${NAMES[gb]}, 30 s hidden): back on the table's latest (seq ${back.seq}), ${still ? 'no motion + no sound replayed' : 'the table moved on'}; the audio ${a0} → ${a1} hidden → ${a2} after a tap`);
  }

  // ---------------------------------------------------------------- THE WAKE LOCK given back on a hidden page, taken again on return (a stub API: counted)
  {
    const p = pages[gc];
    const r = await p.evaluate(async () => {
      const log = window.__wl = { req: 0, rel: 0, live: null };
      const fake = { request: async () => { log.req++; const ls = new Set(); const s = { type: 'screen', released: false, addEventListener: (k, f) => ls.add(f), removeEventListener: (k, f) => ls.delete(f), release: async () => { if (s.released) return; s.released = true; log.rel++; if (log.live === s) log.live = null; ls.forEach(f => f()); } }; log.live = s; return s; } };
      Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: fake });
      const w = await import('/js/wakelock.js');
      w.gameAwake(false); w.gameAwake(window.__holdem.awake());   // (re-ask through the stub)
      await new Promise(res => setTimeout(res, 100));
      return { seated: window.__holdem.awake(), ...w.awakeState(), req: log.req };
    });
    await setHidden(p, true);
    await p.evaluate(() => { if (window.__wl.live) window.__wl.live.release(); });   // (the browser drops it on a hidden page)
    const hid = await awakeOf(p);
    await setHidden(p, false);
    await sleep(200);
    const ret = await p.evaluate(async () => ({ ...(await import('/js/wakelock.js')).awakeState(), req: window.__wl.req }));
    ok(r.seated && r.held && r.req === 1 && hid && !hid.held && ret.held && ret.req === 2,
      `THE WAKE LOCK (${NAMES[gc]}, seated): held, given back on the hidden page, taken again on return (requests ${r.req} → ${ret.req})`);
  }
  await leakCheck('after the toughness');
}

await H.run(async () => {
  const host = await H.joinAll(N);
  log('room', H.code, N, 'phones');

  // ------------------------------------------------------------ the start: the walk inside, then the dealer's hand 1 on every phone
  if (FAST) {
    // ---------------------------------------------------------- HE8 — THE OWNER'S LIVE TEST (the live site's rule on the emulators: testHoldemGate)
    await dbPut('testHoldemGate', true);
    const gp = await pages[1].evaluate(async room => { const m = await import('/js/games/holdem/index.js'); try { await m.dealer({ holdem: 'start', room, mode: 'tournament' }); return 'started'; } catch (e) { return `${e.status} ${e.code}`; } }, H.code);
    const hp = await host.evaluate(async room => { const m = await import('/js/games/holdem/index.js'); try { await m.dealer({ holdem: 'start', room, mode: 'tournament' }); return 'started'; } catch (e) { return `${e.status} ${e.code}`; } }, H.code);
    const plainList = await gamesList(host);
    const plainPlayable = await host.evaluate(() => import('/js/config.js').then(m => m.isPlayable('holdem')));
    ok(gp === '403 not_host' && hp === '403 not_open' && !plainList.some(g => g.id === 'holdem') && !plainPlayable,
      `THE OWNER'S LIVE TEST — a NORMAL host: the dealer refuses the start (${hp}; a guest: ${gp}), no HOLD'EM in the list (${plainList.map(g => g.id).join(' ')})`);
    // the host becomes the OWNER (the emulators' owner list — the radio's server check, as on the live site's ADMIN_PIDS)
    const opid = await pidOf(host, 0);
    await dbPut(`testAdmins/${opid}`, true);
    await host.evaluate(() => sessionStorage.clear());
    await host.reload();
    await waitFor(host, () => document.body.classList.contains('rd-owner') && !!window.__arcade.state.code && window.__arcade.state.meta && window.__arcade.state.meta.hostId === window.__arcade.state.uid, 'the owner\'s radio yes + back in the room as host', 40000);
    await sleep(800);
    const ownerList = await gamesList(host), guestList = await gamesList(pages[1]);
    const hg = ownerList.find(g => g.id === 'holdem');
    ok(!!hg && hg.test && ownerList.filter(g => g.test).length === 1 && !guestList.some(g => g.id === 'holdem' || g.test),
      `THE OWNER'S LIST: HOLD'EM with its TEST tag (${ownerList.map(g => g.id + (g.test ? '·TEST' : '')).join(' ')}); a guest's list unchanged (${guestList.map(g => g.id).join(' ')})`);
    ok(await H.startGame(host, 'holdem', { mode: 'tournament', speed: 'turbo' }), 'THE OWNER starts HOLD\'EM · TEST — the dealer checked him (no preview switch on any phone)');
  } else {
    for (const p of pages) if (p) await p.evaluate(() => { window.__nsPreview = true; });   // (a game being built starts only where asked: config.js#isPlayable)
    ok(await H.startGame(host, 'holdem', { mode: 'tournament', speed: 'turbo' }), 'the host starts HOLD\'EM (a local emulator page: `preview`)');
  }
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
  ok(/^LVL 1 · BLINDS 10\/20\nNEXT 15\/30 IN \d:\d\d$/.test(lv), `the level line (HE10 — two lines: the next blinds + the countdown to them): ${JSON.stringify(lv)}`);
  await H.shotAll(host, 'he-01-start');
  // HE8 — THE WAKE LOCK: every seated phone in a live match wants the screen on (the console's rule narrowed by the table's own)
  const aw0 = await Promise.all(alive().map(i => awakeOf(pages[i])));
  ok(aw0.every(a => a && a.view === true && a.wanted === true), `THE WAKE LOCK: every seated phone keeps its screen on (${aw0.map(a => (a && a.wanted ? 'ON' : 'off')).join(' ')})`);

  if (TOUGH_ONLY) { await toughness(host); return; }

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
    if (koSeen) { const a = await awakeOf(pages[koSeen.i]); ok(a && a.view === false && a.wanted === false, `THE WAKE LOCK released on the busted phone (spectating: ${a && a.wanted ? 'still on' : 'off'})`); }
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
    const awEnd = await Promise.all(alive().map(i => awakeOf(pages[i])));
    ok(awEnd.every(a => a && a.view === false && a.wanted === false), `THE WAKE LOCK released on every phone at the match's end (${awEnd.map(a => (a && a.wanted ? 'ON' : 'off')).join(' ')})`);
    await dbPut('testHoldemGate', null); await dbPut('testAdmins', null);
    for (const i of alive()) await soundCheck(pages[i], NAMES[i]);
    const champ = await host.evaluate(() => window.__holdem.planned().filter(c => c.name === 'champion').length);
    ok(champ === 1, `ONE winner sound: champion planned once on the podium (${champ}) — the console's sting skipped (OWN_VICTORY_SOUND)`);
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
  // HE5 — NO REPLAY after a refresh: the hand's deal + its bets are history (the dealer's ev) — the refreshed phone plans none of them
  const rp = await pages[ri].evaluate(() => window.__holdem.planned());
  ok(pr.hand === before.h ? !rp.some(c => c.name === 'deal' || c.name === 'shuffle') : true, `NO REPLAY: the refreshed phone replayed none of the hand's sounds (${rp.length} cue(s) since, all new: ${rp.map(c => c.name).join(' ') || 'none'})`);

  // ------------------------------------------------------------ HE6: THE PICKER's LIVE SWITCH mid-hand on one phone — the table re-skins at once
  // (no reload, the same hand + cards on screen), only the chosen skin's files are fetched, then back to NEON CASINO
  {
    const sp = pages[ri];
    await sp.evaluate(() => { window.__heMark = Math.random(); window.__heFetched = []; new PerformanceObserver(l => { for (const e of l.getEntries()) window.__heFetched.push(e.name); }).observe({ type: 'resource', buffered: false }); });
    const handBefore = (await pub(sp)).hand;
    const res = [];
    for (const id of ['cabin', 'apartment', 'casino']) {
      await sp.evaluate(async sid => { const m = await import('/js/audio/settings.js'); m.updateSettings({ heSkin: sid }); }, id);
      await waitFor(sp, (s, sid) => window.__holdem.skin() === sid && document.querySelector('.he').dataset.skin === sid, `the table re-skinned to ${id}`, 8000, id);
      await sleep(900);
      res.push(await sp.evaluate(sid => {
        const root = document.querySelector('.he'), cs = getComputedStyle(root);
        const backs = [...document.querySelectorAll('.he-backs .he-back')].map(b => b.getAttribute('src'));
        return { id: sid, felt: cs.getPropertyValue('--he-felt-img').includes(`/${sid}/felt`), backs: backs.length === 0 || backs.every(u => u.includes(`cardback-${sid}`)),
          live: root.querySelectorAll('.he-live').length, mark: !!window.__heMark, seats: document.querySelectorAll('.he-seat').length };
      }, id));
    }
    const fetched = await sp.evaluate(() => window.__heFetched.filter(u => /assets\/holdem\//.test(u)));
    const pr2 = await pub(sp);
    const okAll = res.every(r => r.felt && r.backs && r.live > 0 && r.mark && r.seats === res[0].seats);
    const strays = fetched.filter(u => !/(casino|cabin|apartment)\//.test(u) && !/cardback-(casino|cabin|apartment)/.test(u) && !/cards\/|chips\//.test(u));
    ok(okAll && strays.length === 0 && (pr2.hand === handBefore || pr2.hand === handBefore + 1),
      `LIVE SKIN SWITCH mid-hand (${NAMES[ri]}): ${res.map(r => r.id).join(' → ')} — the felt, the backs + the living touches each time, no reload, ${res[0].seats} seats throughout; fetched only the skins' own files (${fetched.length})`);
    await H.cleanText(sp, 'the table after the skin switches', '.he');
  }

  // ------------------------------------------------------------ HE7: ROTATE MID-HAND on one phone — the same hand + cards, nothing replayed, an open
  // slider closes, and the action still works (a real tap on CALL / CHECK in the turned layout)
  const SIDE = { width: 844, height: 390, deviceScaleFactor: 1, isMobile: true, hasTouch: true };
  const DESK = { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false };
  const orient = p => p.evaluate(() => { const r = document.querySelector('.he'); return r ? r.dataset.orient : null; });
  const turnTo = async (p, v) => { await p.setViewport(v); await waitFor(p, (st, w) => { const r = document.querySelector('.he'); return !!r && r.dataset.orient === (w ? 'wide' : 'tall'); }, 'the table turned', 8000, v.width > v.height); };
  {
    const rp = pages[ri], myUid = await uidOf(rp);
    const b0 = await rp.evaluate(() => ({ hand: window.__holdem.pub().hand, seq: window.__holdem.pub().seq, c: (window.__holdem.hole() || {}).c, planned: window.__holdem.planned().length, seats: document.querySelectorAll('.he-seat').length }));
    await turnTo(rp, SIDE);
    const b1 = await rp.evaluate(() => ({ hand: window.__holdem.pub().hand, seq: window.__holdem.pub().seq, c: (window.__holdem.hole() || {}).c, planned: window.__holdem.planned().length, seats: document.querySelectorAll('.he-seat').length, motion: window.__holdem.motion(), wide: !!window.__holdem.layout().wide }));
    ok(b1.wide && b1.hand === b0.hand && JSON.stringify(b1.c) === JSON.stringify(b0.c) && b1.seats === b0.seats && !b1.motion && (b1.planned === b0.planned || b1.seq !== b0.seq),
      `ROTATE MID-HAND (${NAMES[ri]}): sideways at once — hand ${b1.hand}, the same ${(b1.c || []).join(' ')}, ${b1.seats} seats, nothing in flight, no sound replayed (${b0.planned} → ${b1.planned} cues)`);
    // its turn: RAISE opens the slider → turn back upright → the slider closes cleanly, the buttons back → a REAL tap on CALL / CHECK counts
    await drive('passive', async () => { const L = await G(rp, 'window.__holdem.legal()'); return !!L && L.id === myUid; }, `${NAMES[ri]}'s turn`, { timeout: 120000, skip: new Set([ri]), watch: rp });
    const canRaise = await rp.evaluate(() => { const b = document.querySelector('.he-actions .he-raise'); if (b && !b.disabled) { b.click(); return true; } return false; });
    if (canRaise) await waitFor(rp, () => !!document.querySelector('.he-slider'), 'the slider open (sideways)', 5000);
    await turnTo(rp, VIEW_UP);
    const sl = await rp.evaluate(() => ({ slider: !!document.querySelector('.he-slider'), call: !!document.querySelector('.he-actions .he-buttons .he-call') }));
    ok(!sl.slider && sl.call, `ROTATE with the slider open (${canRaise ? 'RAISE tapped' : 'no raise allowed — the buttons'}): upright again, the slider closed, FOLD / RAISE / CALL back`);
    await turnTo(rp, SIDE);
    const seq0 = (await pub(rp)).seq;
    const how = await moveOn(rp, 'tap');
    await waitFor(rp, (st, q) => window.__holdem.pub().seq > q, 'the tap reached the dealer', 10000, seq0).catch(() => {});
    if (how !== 'tap') log('tap diag', how, JSON.stringify(tapped.covered.slice(-3)), JSON.stringify(await rp.evaluate(() => { const L = window.__holdem.legal(); const R = e => { const r = e && e.getBoundingClientRect(); return r ? [r.left, r.top, r.width, r.height].map(Math.round) : null; }; const he = document.querySelector('.he'); return { L: L && L.id, me: window.__arcade.state.uid, iw: innerWidth, ih: innerHeight, btn: R(document.querySelector('.he-actions .he-call')), he: R(he), par: he && R(he.parentElement), parCls: he && he.parentElement.className, sec: R(he && he.closest('section')), secCls: he && he.closest('section') && he.closest('section').className, stage: R(document.querySelector('.he-stage')), orient: he && he.dataset.orient }; })));
    ok(how === 'tap' && (await pub(rp)).seq > seq0, `the action still works sideways: a REAL tap on CALL / CHECK (uncovered) → the dealer moved on`);
    await turnTo(rp, VIEW_UP);
  }

  // ------------------------------------------------------------ HE7: ONE WHOLE HAND SIDEWAYS at ${N}: every phone on its side (844 × 390) — one a DESKTOP
  // window (1440 × 900: the stage scaled) — played to its end on REAL taps (each CALL / CHECK proved uncovered first)
  {
    const di = alive().find(i => pages[i] !== host && i !== ri);
    for (const i of alive()) await turnTo(pages[i], i === di ? DESK : SIDE);
    const handS = (await pub(host)).hand;
    // (from the next deal — a whole hand sideways)
    await drive('passive', p => pub(p).then(x => x.hand > handS), 'the next deal', { timeout: 120000, watch: host });
    const handW = (await pub(host)).hand;
    tapped.n = 0; tapped.covered = [];
    await drive('tap', p => pub(p).then(x => x.hand > handW || (x.hand === handW && x.table.street === 'done')), `hand ${handW} sideways (taps)`, { timeout: 150000, watch: host });
    const sw = await Promise.all(alive().map(i => pages[i].evaluate(() => { const L = window.__holdem.layout(), st = getComputedStyle(document.querySelector('.he-stage')).transform; return { wide: !!L.wide, k: L.k, misfits: L.misfits, st, seats: document.querySelectorAll('.he-seat').length }; })));
    ok(sw.every(x => x.wide && !x.misfits) && tapped.n > 0 && tapped.covered.length === 0, `A WHOLE HAND SIDEWAYS at ${N}: hand ${handW} to its end on ${tapped.n} real taps, every button uncovered, every table laid out clean (${sw.map(x => x.seats).join('/')} seats)`);
    const dk = sw[alive().indexOf(di)];
    ok(dk.wide && /^matrix\(1\.6/.test(dk.st), `DESKTOP 1440 × 900 (${NAMES[di]}): the sideways table on the stage, × 1.6 (${dk.st})`);
    await leakCheck('the sideways hand');
    if (H.SHOTS) for (const i of [ri, di]) await pages[i].screenshot({ path: `${H.OUT}he7-sideways-${NAMES[i]}.png` }).catch(() => {});
    for (const i of alive()) await turnTo(pages[i], VIEW_UP);
  }

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
  // (HE7: + SIDEWAYS — 844 × 390, the wide stadium — in each skin: the same busiest moment on the turned table)
  if (process.env.PERF !== '0') for (const [skin, wide] of ['casino', 'cabin', 'apartment'].flatMap(k => [[k, false], [k, true]])) {   // (HE6: in EACH skin — its living touches + its light on)
    const bctx = await H.browser.createBrowserContext(), bp = await bctx.newPage();
    await bp.setViewport({ width: wide ? 844 : 390, height: wide ? 390 : 844, deviceScaleFactor: process.env.GPU ? 2.75 : 1, isMobile: true, hasTouch: true });
    const cdp = await bp.target().createCDPSession();
    await bp.goto(`${H.BASE}/tests/integration/holdem-preview.html?state=sidepots&n=8&skin=${skin}`);
    await bp.waitForFunction(() => document.body.dataset.ready === '1', { timeout: 30000 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: H.CPU });
    await sleep(7400);   // (the run-out from ~0.6 s, the hands' awards ~4–7.4 s: the frames buffer = the last ~4 s — the river, the showdown, all three pots)
    const f = await bp.evaluate(() => window.__holdem.fps());
    const busy = await bp.evaluate(() => window.__holdem.pub().table.street);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    const s2 = [...f].sort((a, b) => a - b);
    const p50 = +(s2[Math.floor(s2.length * 0.5)] || 0).toFixed(1), p95 = +(s2[Math.floor(s2.length * 0.95)] || 0).toFixed(1);
    log('busiest moment', skin, wide ? 'sideways' : 'upright', JSON.stringify({ p50, p95, n: s2.length, busy }));
    ok(p50 <= 17.5 && s2.length > 150, `PERF ${skin.toUpperCase()}${wide ? ' SIDEWAYS' : ''} (the busiest moment, ${H.CPU}× CPU, 8 seats — the side-pot run-out + three awards): p50 ${p50} / p95 ${p95} ms over ${s2.length} frames`);
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
  await toughness(host, new Set(lockI != null ? [lockI] : []));

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
      // (the REBUY step's all-ins leave most seats broke — a CASH table waits for rebuys: every broke guest rebuys, so the hands go on)
      for (const i of gi) {
        const k = await pages[i].evaluate(async () => { const h = window.__holdem, p = h.pub(), me = window.__arcade.state.uid, x = p && p.table.seats.find(y => y.id === me);
          if (x && x.stack === 0 && p.table.street === 'done') { await h.op('rebuy'); return 'rebuy'; } return h.leave(); }).catch(() => '');
        if (process.env.DEBUG_LEAVE) log('leave?', NAMES[i], k);
        if (k === 'after') { li = i; break; }
      }
      if (li == null) for (const i of alive()) await moveOn(pages[i], 'passive');
      await sleep(150);
    }
    if (li != null) {
      leftUid = await uidOf(pages[li]); leftName = NAMES[li];
      await pages[li].evaluate(() => document.querySelector('.he-leave').click());
      for (let w = 0; w < 50 && (await pages[li].evaluate(() => window.__holdem.leave())) !== 'queued'; w++) await sleep(150);
      const q = await pages[li].evaluate(() => window.__holdem.leave());
      await Promise.resolve(H.shot(pages[li], 'he-06-leave')).catch(() => {});
      ok(q === 'queued', `LEAVE AFTER THIS HAND: ${leftName}'s tap queued it (the button: ${q})`);
      const t0 = Date.now();
      while (Date.now() - t0 < 60000) {
        if (await nh.evaluate(id => { const n = window.__arcade.state.live.table; return !!(n && n.p && n.p[id] && /"left":true/.test(n.p[id])); }, leftUid)) break;
        for (const i of alive()) await moveOn(pages[i], 'passive');
        await sleep(200);
      }
      await sleep(600);
      ok(await pages[li].evaluate(() => window.__holdem.spectating()), `LEAVE AFTER THIS HAND: ${leftName} played the hand out, then left — now SPECTATING`);
      const la = await awakeOf(pages[li]);
      ok(la && la.view === false && la.wanted === false, `THE WAKE LOCK released after ${leftName} LEFT the table (${la && la.wanted ? 'still on' : 'off'})`);
    } else ok(false, 'LEAVE: the button never offered LEAVE AFTER THIS HAND');
  }
  // END SESSION: the host's button, twice (the second tap confirms) → the session closes when the running hand ends
  await nh.evaluate(() => { const b = document.querySelector('.he-hostbar button'); b && b.click(); });
  await sleep(300);
  await nh.evaluate(() => { const b = document.querySelector('.he-hostbar button'); b && b.click(); });
  await drive('passive', p => p.evaluate(() => window.__arcade.state.game && window.__arcade.state.game.phase === 'final'), 'END SESSION → the podium', { timeout: 120000, watch: nh });
  const cf = await pub(nh);
  const sum = (cf.ledger || []).reduce((n, r) => n + r.net, 0);
  // (HE10 — Ben's A7: a CASH session counts from 10 hands + 5 minutes — this one's result is 'done' or 'short' by exactly that rule)
  const counted = cf.hands >= 10 && (cf.endAt || 0) - (cf.startAt || 0) >= 300_000;
  ok(cf.ended && cf.rep === (counted ? 'done' : 'short') && cf.ledger && sum === 0, `THE LEDGER: ${cf.ledger && cf.ledger.length} rows, Σ net = ${sum} (chips only); ${cf.hands} hands → ${cf.rep}`);
  await soundCheck(nh, 'the host, the whole FULL run');
  await sleep(1500);
  const lg = await nh.evaluate(() => { const b = document.querySelector('.he-final .he-fs.is-cash'); return b && { rows: [...b.querySelectorAll('.he-fs-list > li')].map(li => li.textContent), foot: (b.querySelector('.he-fs-foot') || {}).textContent, money: /\$/.test(b.textContent) }; });
  const played = (cf.ledger || []).filter(r => r.hands > 0).length;
  ok(lg && lg.rows.length === played && !lg.money && /HANDS? PLAYED/.test(lg.foot || '') && (!leftName || lg.rows.some(r => r.includes(leftName))), `THE LEDGER SCREEN: ${lg && lg.rows.length} slim-card rows (BOUGHT IN · FINAL · NET)${leftName ? `, the leaver ${leftName} among them` : ''}; "${lg && lg.foot}"; no money signs`);
  await H.cleanText(nh, 'the ledger', '.he');
  await H.shotAll(nh, 'he-09-ledger');
  await H.backToLobby(nh);
  await waitFor(nh, s => s.meta.status === 'lobby' && !s.game, 'back in the room', 30000);
});
