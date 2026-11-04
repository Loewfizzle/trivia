// CITY 2.0 — THE HARBOR end to end: LOBBY FIXES (Nov 4 — docs/harbor/passes/lobby-fixes.md — the owner's real-phone test of the room).
// Its own cloud job (`lobbyfix`).
//   oneseat  — ONE PROFILE, ONE SEAT + ONE ACCOUNT, ONE ROOM on THREE slots sharing one profile: the second device asked (CANCEL keeps it out,
//              MOVE HERE takes the seat + the first walks out), a third hosting another room takes it from the second
// ADDING A GROUP: G('name', …) here + the name in ../harbor-jobs.mjs (CI_JOBS.lobbyfix).
import { log, sleep, ok, open, ev, waitFor, harborUp, dbPut, G, OUT, SHOTS, NIGHT } from './kit.mjs';
import { dbPatch, dbGet, ROOMQ, hostRoom, joinRoom, settledRoom, topAt, fakeGuests, startOC, onTitle, podium } from './lobby2.mjs';

/** this slot's profile record (me.js) once the server has linked it */
const meOf = async (p, slot) => { await waitFor(p, `(() => { try { const m = JSON.parse(localStorage.getItem('na:${slot}:me') || 'null'); return !!(m && m.pid); } catch { return false; } })()`, `${slot}'s profile`, 20000); return ev(p, `JSON.parse(localStorage.getItem('na:${slot}:me'))`); };
/** this slot takes the given profile (as BRING YOUR CARD would): the device link on the server + the record on the phone */
async function shareProfile(p, slot, me) {
  const uid = await ev(p, 'window.__arcade.state.uid');
  await dbPatch('uids', { [uid]: me.pid });
  await ev(p, `localStorage.setItem('na:${slot}:me', JSON.stringify(${JSON.stringify({ ...me, uid: '__UID__' })}).replace('__UID__', '${uid}'))`);
  return uid;
}
/** taps HOST or JOIN (by the invite link already in the URL) and answers the seat question with `answer` ('move' | 'cancel' | null = none expected) */
async function knock(p, act, answer) {
  // (JOIN by the link's button the first time; again after a CANCEL straight through room.js — the same path, the title's field aside)
  await ev(p, act === 'host' ? "document.querySelector('.nd-hostbtn').click()" : act === 'join' ? "(() => { const b = document.querySelector('.nd-go'); if (b) b.click(); })()"
    : `(() => { import('/js/room.js').then(m => m.joinRoom('${act}', JSON.parse(localStorage.getItem('na:' + new URLSearchParams(location.search).get('slot') + ':profile')))).catch(e => { window.__joinErr = e.message; }); return 1; })()`);
  if (!answer) return null;
  await waitFor(p, "!!document.querySelector('.st-sheet:not(.is-out) [data-act]')", 'the seat question', 15000);
  const q = await ev(p, "({ t: document.querySelector('.st-sheet .pfs-t b').textContent, line: document.querySelector('.st-sheet .st-line').textContent })");
  await ev(p, `document.querySelector('.st-sheet [data-act="${answer}"]').click()`);
  return q;
}

G('oneseat', async () => {
  const A = await hostRoom('osa'), code = A.code;
  const meA = await meOf(A.p, 'osa');
  const seatA = await dbGet(`seats/${meA.pid}`);
  ok(seatA && seatA.code === code && seatA.uid === A.me, `ONE ACCOUNT, ONE ROOM: HOST takes the profile's seat (seats/{pid} = ${JSON.stringify(seatA)})`);
  // ---- the laptop (the same card) joins the SAME room: asked; CANCEL keeps it out
  const B = await open({ slot: 'osb', qs: `${ROOMQ}&room=${code}` });
  await harborUp(B.page); await sleep(700);
  const uidB = await shareProfile(B.page, 'osb', meA);
  const q1 = await knock(B.page, 'join', 'cancel');
  ok(q1 && /ALREADY IN THIS ROOM/.test(q1.t) && /already in this room on another device/i.test(q1.line), `ONE PROFILE, ONE SEAT: the second device in the same room is asked ("${q1 && q1.t}" — "${q1 && q1.line}")`);
  await sleep(1500);
  const inB = await ev(B.page, 'window.__arcade.state.code');
  const nodes1 = await dbGet(`rooms/${code}/players`);
  ok(!inB && !nodes1[uidB] && nodes1[A.me], `CANCEL: the laptop stays out, the phone keeps its seat (laptop in ${inB || 'no room'}; ${Object.keys(nodes1).length} player node)`);
  // ---- again → MOVE HERE: the laptop takes the seat, the phone walks out (its node goes; it's back on the title with a toast)
  const q2 = await knock(B.page, code, 'move');
  await waitFor(B.page, `window.__arcade.state.code === '${code}'`, 'the laptop in the room', 20000);
  await waitFor(A.p, '!window.__arcade.state.code', 'the phone walked out', 15000).catch(() => {});
  const aOut = await ev(A.p, '!window.__arcade.state.code'), nodes2 = await dbGet(`rooms/${code}/players`), seat2 = await dbGet(`seats/${meA.pid}`);
  await sleep(1500);
  const hostNow = await dbGet(`rooms/${code}/meta/hostId`), bStill = await ev(B.page, 'window.__arcade.state.code');
  ok(q2 && aOut && nodes2 && nodes2[uidB] && !nodes2[A.me] && seat2.uid === uidB, `MOVE HERE: the laptop sits (seat → the laptop), the phone left the room (out ${aOut}; nodes ${Object.keys(nodes2 || {}).join(', ')})`);
  ok(hostNow === uidB && bStill === code, `MOVE HERE from the HOST's own phone: the room is handed to the laptop (host ${hostNow === uidB ? 'the laptop' : hostNow}), never closed as "the last one out"`);
  if (SHOTS) await A.p.screenshot({ path: `${OUT}oneseat-moved.png` });
  // ---- a THIRD device (the same card) HOSTS another room → "You're in XXXX on another device" → MOVE HERE; the laptop walks out of its room
  const C = await open({ slot: 'osc', qs: ROOMQ });
  await harborUp(C.page); await sleep(700);
  const uidC = await shareProfile(C.page, 'osc', meA);
  const q3 = await knock(C.page, 'host', 'move');
  await waitFor(C.page, 'window.__arcade.state.code', 'the third device hosted', 20000);
  const codeC = await ev(C.page, 'window.__arcade.state.code');
  await waitFor(B.page, '!window.__arcade.state.code', 'the laptop walked out', 15000).catch(() => {});
  const seat3 = await dbGet(`seats/${meA.pid}`), bOut = await ev(B.page, '!window.__arcade.state.code');
  ok(q3 && new RegExp(`YOU.RE IN ${code}`).test(q3.t) && new RegExp(`room ${code} on another device`, 'i').test(q3.line), `ONE ACCOUNT, ONE ROOM: a third device hosting asks first ("${q3 && q3.t}" — "${q3 && q3.line}")`);
  ok(codeC !== code && seat3.code === codeC && seat3.uid === uidC && bOut, `… MOVE HERE: the seat goes to ${codeC}, the laptop walked out of ${code} (seat ${JSON.stringify(seat3)})`);
  // ---- leaving gives the seat back
  await ev(C.page, "import('/js/room.js').then(m => m.leaveRoom())");
  await waitFor(C.page, '!window.__arcade.state.code', 'left', 10000);
  await sleep(800);
  ok((await dbGet(`seats/${meA.pid}`)) == null, 'LEAVE ROOM gives the seat back (seats/{pid} gone)');
  log('oneseat', 'done');
  for (const X of [A.Q, B, C]) await X.ctx.close().catch(() => {});
});

/** a tap on a player's figure in the line (the tag's own pointer pair, at the figure's middle) */
const tapPlayer = (p, uid) => ev(p, `(() => { const t = document.querySelector('.rc-tag[data-uid="${uid}"]'); if (!t) return false; const r = t.getBoundingClientRect(), o = { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 + 16, pointerId: 1 }; t.dispatchEvent(new PointerEvent('pointerdown', o)); t.dispatchEvent(new PointerEvent('pointerup', o)); return true; })()`);
/** what is open now: a card (full / the gilded sheet), its CREW row, the radio panel, any stale copy */
const cardNow = p => ev(p, `(() => { const full = document.querySelector('.vl-full'), sh = document.querySelector('.rc-card-sheet:not(.is-out)'), c = full || sh;
  return { card: !!c, kind: full ? 'full' : sh ? 'sheet' : null, crew: !!(c && c.querySelector('.cr-row')), radio: !!document.querySelector('.rd-modal.is-in, .rd-pcard'),
    stale: /once lobbies are in the city/i.test(document.body.textContent) }; })()`);
const closeCards = p => ev(p, "(() => { const x = document.querySelector('.vl-full .vl-full-x'); if (x) x.click(); document.querySelectorAll('.pfs:not(.is-out) .pfs-back').forEach(e => e.click()); })()");
const pidIn = async (p, slot) => { for (let i = 0; i < 60; i++) { const m = await ev(p, `(() => { try { return JSON.parse(localStorage.getItem('na:${slot}:me') || 'null'); } catch { return null; } })()`); if (m && m.pid) return m.pid; await sleep(400); } return null; };

G('playercard', async () => {
  // THE OWNER (the radio on the server's yes — testAdmins on the emulators) hosts; a normal player joins
  const O = await hostRoom('pco');
  const opid = await pidIn(O.p, 'pco');
  await dbPut(`testAdmins/${opid}`, true);
  await ev(O.p, 'sessionStorage.clear()'); await O.p.reload(); await harborUp(O.p);
  await waitFor(O.p, "!!document.querySelector('.rd-btn') && document.body.classList.contains('rd-owner') && window.__arcade.state.code", 'the owner radio + back in the room', 30000);
  const N = await joinRoom('pcn', O.code);
  await settledRoom(O.p, 2, 30000).catch(() => {}); await settledRoom(N.p, 2, 30000).catch(() => {});
  await sleep(800);
  // ---- the owner taps the guest IN THE LINE → their card, on top, + the CREW row; never the radio panel
  await tapPlayer(O.p, N.me);
  await waitFor(O.p, "!!document.querySelector('.vl-full, .rc-card-sheet:not(.is-out), .rd-modal.is-in')", 'something opened', 8000).catch(() => {});
  await waitFor(O.p, "!!document.querySelector('.cr-row .cr-sw') && !document.querySelector('.cr-row .cr-sw').disabled", 'the crew row filled', 8000).catch(() => {});
  const a = await cardNow(O.p), topA = await topAt(O.p);
  ok(a.card && a.crew && !a.radio && !a.stale, `THE PLAYER CARD (the OWNER, the line): the guest's card (${a.kind}) + the CREW row — no radio panel (${a.radio}), no stale "once lobbies" copy (${a.stale})`);
  ok(topA && topA !== 'none', `… on top (${topA})`);
  if (SHOTS) await O.p.screenshot({ path: `${OUT}playercard-owner.png` });
  // the CREW switch on the card: ON → the server has them; OFF again
  const npid = await pidIn(N.p, 'pcn');
  await ev(O.p, "document.querySelector('.cr-row .cr-sw').click()");
  await waitFor(O.p, "document.querySelector('.cr-row .cr-sw').getAttribute('aria-checked') === 'true'", 'CREW ON', 8000).catch(() => {});
  const onSrv = await dbGet(`radio/crew/${npid}`);
  await waitFor(O.p, "!document.querySelector('.cr-row .cr-sw').disabled", 'the switch free', 8000).catch(() => {});
  await ev(O.p, "document.querySelector('.cr-row .cr-sw').click()");
  await waitFor(O.p, "document.querySelector('.cr-row .cr-sw').getAttribute('aria-checked') === 'false'", 'CREW OFF', 8000).catch(() => {});
  const offSrv = await dbGet(`radio/crew/${npid}`);
  ok(!!onSrv && offSrv == null, `… its CREW switch works from the card (ON → radio/crew has them: ${!!onSrv}; OFF → gone: ${offSrv == null})`);
  await closeCards(O.p); await sleep(600);
  // ---- the owner taps the guest IN GUESTS → the same: their card on top of the list, the CREW row, no radio
  await ev(O.p, "document.querySelector('.rdk-guests').click()");
  await waitFor(O.p, `!!document.querySelector('.rg-row[data-uid="${N.me}"]')`, 'the guest list', 8000);
  await sleep(500);
  await ev(O.p, `document.querySelector('.rg-row[data-uid="${N.me}"]').click()`);
  await waitFor(O.p, "!!document.querySelector('.vl-full, .rc-card-sheet:not(.is-out)')", 'the card from GUESTS', 8000).catch(() => {});
  await sleep(500);
  const b = await cardNow(O.p), topB = await topAt(O.p);
  ok(b.card && b.crew && !b.radio && topB && topB !== 'none', `THE PLAYER CARD (the OWNER, GUESTS): their card on top of the list (${topB}) + the CREW row, no radio panel`);
  await closeCards(O.p); await sleep(600);
  // ---- a NORMAL player taps the owner (the line + GUESTS) → the owner's card, no CREW row
  await tapPlayer(N.p, O.me);
  await waitFor(N.p, "!!document.querySelector('.vl-full, .rc-card-sheet:not(.is-out)')", 'the card (normal player)', 8000).catch(() => {});
  const c = await cardNow(N.p);
  await closeCards(N.p); await sleep(600);
  await ev(N.p, "document.querySelector('.rdk-guests').click()");
  await waitFor(N.p, `!!document.querySelector('.rg-row[data-uid="${O.me}"]')`, 'the guest list (normal)', 8000);
  await sleep(500);
  await ev(N.p, `document.querySelector('.rg-row[data-uid="${O.me}"]').click()`);
  await waitFor(N.p, "!!document.querySelector('.vl-full, .rc-card-sheet:not(.is-out)')", 'the card from GUESTS (normal)', 8000).catch(() => {});
  const d = await cardNow(N.p);
  ok(c.card && !c.crew && !c.radio && d.card && !d.crew && !d.radio, `THE PLAYER CARD (a NORMAL player): the owner's card from the line (${c.kind}) + GUESTS (${d.kind}) — no CREW row, no radio`);
  await dbPut(`testAdmins/${opid}`, null);
  for (const X of [O.Q, N.Q]) await X.ctx.close().catch(() => {});
});

// AN INTENTIONAL LEAVE: the leaver goes STRAIGHT to the wave + the walk-off on the other phone — never the lost-signal lie-down first
G('leavewave', async () => {
  const O = await hostRoom('lwo');
  const N = await joinRoom('lwn', O.code);
  await settledRoom(O.p, 2, 30000).catch(() => {});
  await sleep(600);
  // the other phone samples the leaver's state every frame from the moment the leave is sent
  await ev(O.p, `(() => { window.__lw = []; const u = '${N.me}'; const t0 = performance.now(); const tick = () => { const r = window.__district.room(); const q = r && r.people && r.people.find(x => x.uid === u); window.__lw.push(q ? { t: Math.round(performance.now() - t0), on: q.online, lv: q.leaving } : { t: Math.round(performance.now() - t0), gone: true }); if (performance.now() - t0 < 4500) requestAnimationFrame(tick); }; requestAnimationFrame(tick); return 1; })()`);
  await ev(N.p, "(() => { import('/js/room.js').then(m => m.leaveRoom()); return 1; })()");
  await sleep(4800);
  const s = await ev(O.p, 'window.__lw');
  const lay = s.filter(x => !x.gone && x.on === false && !x.lv), left = s.some(x => x.lv);
  ok(s.length > 30 && left && !lay.length, `AN INTENTIONAL LEAVE: the other phone sees the wave + the walk-off (leaving ${left}) and never the lost-signal pose first (${lay.length} of ${s.length} frames offline before leaving)`);
  // a REAL lost signal still lies down — after the short grace
  const N2 = await joinRoom('lwm', O.code);
  await settledRoom(O.p, 2, 30000).catch(() => {});
  await sleep(600);
  await dbPatch(`rooms/${O.code}/presence/${N2.me}`, { online: false, c: null });
  await N2.Q.ctx.close().catch(() => {});
  const t0 = Date.now();
  await waitFor(O.p, `(() => { const r = window.__district.room(); const q = r && r.people && r.people.find(x => x.uid === '${N2.me}'); return !!(q && q.online === false); })()`, 'the lie-down', 8000).catch(() => {});
  const dt = Date.now() - t0, down = await ev(O.p, `(() => { const r = window.__district.room(); const q = r && r.people && r.people.find(x => x.uid === '${N2.me}'); return !!(q && q.online === false); })()`);
  ok(down && dt >= 1200, `… a real lost signal still lies down, after the grace (${dt} ms)`);
  for (const X of [O.Q, N.Q]) await X.ctx.close().catch(() => {});
});

// THE BANNER PLANE STAYS FULLY VISIBLE (the owner: after a match + LAST CALL after a leave, ~2 s in "the plane + banner faded almost
// invisible while still crossing" — "…R TAKES PRI…" a ghost in the clouds, worse on the laptop): the banner flies under an OVERCAST night sky;
// the canvas inside its panels is sampled through the crossing — the cream nylon must read on every sample (it was drawn UNDER the clouds)
async function bannerVisible(view, slot) {
  const Q = await open({ slot, qs: `${NIGHT}&wx=overcast`, view });
  await harborUp(Q.page); await sleep(1500);
  await ev(Q.page, "window.__district.harbor().sky.banner(['TESTER TAKES PRISM', 'DROP CHAMPION'], { passes: 1 })");
  await ev(Q.page, `(() => { window.__bv = []; const t0 = performance.now(); const cv = document.querySelector('.nd-scene canvas'), x = cv.getContext('2d');
    const tick = () => { const b = (window.__district.harbor().sky.state.banner || {}).box, k = cv.width / cv.clientWidth;
      if (b && b.x1 - b.x0 > 20) { const x0 = Math.max(0, b.x0 + 2), x1 = Math.min(cv.clientWidth, b.x1 - 2), y0 = b.y0 + 3, y1 = b.y1 - 3;
        if (x1 - x0 > 30) { const d = x.getImageData(Math.round(x0 * k), Math.round(y0 * k), Math.round((x1 - x0) * k), Math.max(1, Math.round((y1 - y0) * k))).data; let n = 0, br = 0;
          for (let i = 0; i < d.length; i += 16) { n++; if (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2] > 170) br++; }
          window.__bv.push({ t: Math.round(performance.now() - t0), br: +(br / n).toFixed(2), x: Math.round(x0) }); } }
      if (performance.now() - t0 < 16000) setTimeout(tick, 250); }; tick(); return 1; })()`);
  await sleep(16500);
  const s = await ev(Q.page, 'window.__bv');
  await Q.ctx.close().catch(() => {});
  return s;
}

G('bannerfull', async () => {
  for (const [view, slot] of [[[402, 874], 'bfp'], [[1440, 900], 'bfd']]) {
    const s = await bannerVisible(view, slot);
    const min = s.length ? Math.min(...s.map(x => x.br)) : 0, avg = s.length ? s.reduce((a, x) => a + x.br, 0) / s.length : 0;
    ok(s.length >= 20 && min >= 0.3, `THE BANNER PLANE FULLY VISIBLE (${view[0]}×${view[1]}, an overcast night): the cream nylon reads on every one of ${s.length} samples across the crossing (the faintest ${min}, average ${avg.toFixed(2)})`);
  }
});

// AFTER HOST: HOW TO SHARE — the host's glass card (the real hush word, SHARE INVITE, "or tap INVITE anytime"; closes itself / on a tap) +
// the INVITE ring breathing until an invite or a guest; THE DESKTOP HOST's FLASH: HOST never unmounts the city (no boot screen in between)
G('hostcard', async () => {
  for (const [view, slot] of [[[1440, 900], 'hcd'], [[402, 874], 'hcp']]) {
    const Q = await open({ slot, qs: ROOMQ, view }), p = Q.page;
    await harborUp(p); await sleep(900);
    await ev(p, `(() => { const cv = document.querySelector('.nd-scene canvas'); if (cv) cv.dataset.lf = 'before'; window.__boots = 0;
      new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.classList && (n.classList.contains('boot-screen') || n.querySelector && n.querySelector('.boot-screen'))) window.__boots++; }).observe(document.body, { childList: true, subtree: true }); return 1; })()`);
    await ev(p, "document.querySelector('.nd-hostbtn').click()");
    await waitFor(p, 'window.__arcade.state.code && window.__district.room()', 'hosted', 20000);
    await waitFor(p, "!!document.querySelector('.rc-hostcard')", 'the host card', 8000).catch(() => {});
    const code = await ev(p, 'window.__arcade.state.code');
    const r = await ev(p, `(() => { const c = document.querySelector('.rc-hostcard'), s = c && c.querySelector('.rc-hc-share'), cv = document.querySelector('.nd-scene canvas'), b = s && s.getBoundingClientRect(), cb = c && c.getBoundingClientRect();
      return { boots: window.__boots, same: !!(cv && cv.dataset.lf === 'before'), text: c ? c.textContent : null, share: b ? Math.round(b.height) : 0, inView: !!(cb && cb.left >= 0 && cb.right <= innerWidth && cb.top >= 0),
        pulse: document.querySelector('.rdk-invite').classList.contains('rdk-pulse') }; })()`);
    ok(r.boots === 0 && r.same, `THE ${view[0] > 1000 ? 'DESKTOP' : 'PHONE'} HOST: a clean move into the room — no boot screen in between (${r.boots}), the same city canvas (${r.same})`);
    ok(r.text && /YOUR ROOM IS OPEN/.test(r.text) && new RegExp(`THE HUSH WORD IS ${code}`).test(r.text) && /SHARE INVITE/.test(r.text) && /or tap INVITE anytime/.test(r.text) && r.share >= 44 && r.inView,
      `AFTER HOST (${view[0]}): the card — "${r.text}" — SHARE INVITE ${r.share} pt, on screen`);
    ok(r.pulse, `… the INVITE ring breathes (no invite yet, no guest)`);
    if (SHOTS) await p.screenshot({ path: `${OUT}hostcard-${view[0]}.png` });
    await sleep(8600);
    const later = await ev(p, "({ card: !!document.querySelector('.rc-hostcard:not(.is-out)'), pulse: document.querySelector('.rdk-invite').classList.contains('rdk-pulse') })");
    ok(!later.card && later.pulse, `… it closes itself after a few seconds (gone: ${!later.card}); the ring still breathes until an invite or a guest (${later.pulse})`);
    if (view[0] < 1000) {
      const N = await joinRoom('hcg', code);
      await waitFor(p, "!document.querySelector('.rdk-invite').classList.contains('rdk-pulse')", 'the pulse stops', 10000).catch(() => {});
      ok(!(await ev(p, "document.querySelector('.rdk-invite').classList.contains('rdk-pulse')")), '… a guest arrived → the INVITE ring stops breathing');
      await N.Q.ctx.close().catch(() => {});
    }
    await Q.ctx.close().catch(() => {});
  }
  // a tap closes it; INVITE (the ring) stops the breathing
  const T = await hostRoom('hct');
  await waitFor(T.p, "!!document.querySelector('.rc-hostcard')", 'the card', 8000).catch(() => {});
  await sleep(500);
  await ev(T.p, "(() => { const o = { bubbles: true, clientX: 30, clientY: 200 }; document.body.dispatchEvent(new PointerEvent('pointerdown', o)); return 1; })()");
  await sleep(500);
  const gone = !(await ev(T.p, "!!document.querySelector('.rc-hostcard:not(.is-out)')"));
  await ev(T.p, "(() => { window.navigator.share = undefined; return 1; })()");
  await ev(T.p, "document.querySelector('.rdk-invite').click()");
  await sleep(600);
  const pulse = await ev(T.p, "document.querySelector('.rdk-invite').classList.contains('rdk-pulse')");
  ok(gone && !pulse, `… a tap closes the card (${gone}); a tap on INVITE stops the breathing (${!pulse})`);
  await T.Q.ctx.close().catch(() => {});
});

// THE NEW GAME START (the owner, Nov 4 3:05–3:06 pm — no camera push): the FULL start (~5 s): NEON powers down → the game's OWN sign ignites
// in the NEON pink, tube by tube, holds → the lines walk in under it → a clean fade (the city never scales); AFTER THE MATCH (change-game v2):
// the host's GAMES tab = NEW GAME in cyan, breathing until tapped; the guest's stays GAMES; a same-game REMATCH = the QUICK start (~3 s)
const signState = p => ev(p, `(() => { const s = document.querySelector('.nd-sign'), t = document.querySelector('.rc-tonight'), L = t ? [...t.querySelectorAll('.ndl-light')] : [];
  const op = e => +getComputedStyle(e).opacity; const lay = [document.querySelector('.title-screen'), document.querySelector('.nd-scene')].filter(Boolean).map(e => getComputedStyle(e).transform);
  return { go: !!(s && s.classList.contains('rc-go')), quick: !!(s && s.classList.contains('rc-quick')), full: !!(s && s.classList.contains('rc-full')), shown: t ? op(t) : 0, tubes: L.length, lit: L.filter(e => op(e) > 0.9).length,
    pink: !!(t && /ff2e97/i.test(t.innerHTML)), scaled: lay.some(x => x && x !== 'none' && !/^matrix\\(1, 0, 0, 1, 0, 0\\)$/.test(x)), m: window.__arcade.state.meta && window.__arcade.state.meta.go && window.__arcade.state.meta.go.m }; })()`);
const ageOf = p => ev(p, '(() => { const g = window.__arcade.state.meta.go; return g ? window.__arcade.serverNow() - g.at : null; })()');

G('newstart', async () => {
  const { Q: A, p, code, me } = await hostRoom('nsa');
  const { Q: B, p: q } = await joinRoom('nsb', code);
  await fakeGuests(code, 2);
  await settledRoom(p, 4, 40000).catch(() => {}); await settledRoom(q, 4, 40000).catch(() => {});
  // ---- THE FULL START (a room's first game): sampled at its beats on the host's phone
  const t0 = Date.now();
  await startOC(p);
  const at = async ms => { await waitFor(p, `window.__arcade.state.meta.go && window.__arcade.serverNow() - window.__arcade.state.meta.go.at >= ${ms}`, `the start at ${ms}`, 7000).catch(() => {}); return { ...(await signState(p)), age: await ageOf(p) }; };
  const s1 = await at(420), s2 = await at(2300);
  if (SHOTS) await p.screenshot({ path: `${OUT}newstart-full-2300.png` });
  const walk = await ev(p, `(() => { const r = window.__district.room(); const h = r && r.people.find(x => x.uid === '${me}'); return h ? { pose: h.s && h.s.pose, inside: h.inside } : null; })()`);
  const s3 = await at(4000);
  ok(s1.go && s1.full && s1.lit === 0, `THE FULL START: NEON powers down first — the game's sign not lit yet at ${s1.age} ms (${s1.lit} tubes lit)`);
  ok(s2.tubes >= 6 && s2.lit === s2.tubes && s2.pink && s2.shown > 0.95, `…THE GAME's OWN SIGN lit for real — every tube (${s2.lit}/${s2.tubes}) in the NEON pink by ${s2.age} ms`);
  ok(s3.lit === s3.tubes && s3.shown > 0.95, `…and it HOLDS (still all lit at ${s3.age} ms — readable ~3 s)`);
  ok(walk && (walk.pose === 'walk' || walk.inside), `…the lines walk in UNDER the lit sign (the host at 2.3 s: ${walk && (walk.inside ? 'inside' : walk.pose)})`);
  ok(![s1, s2, s3].some(x => x.scaled), 'NO CAMERA PUSH: the city + the screen never scale');
  const routed = await Promise.all([p, q].map(x => waitFor(x, `!(${onTitle})`, 'the game', 8000).then(() => Date.now() - t0, () => null)));
  ok(routed.every(v => v != null && v >= 4300 && v <= 6200), `…a clean fade into the game on both phones (${routed.join(' / ')} ms after the tap — the full start is 5 s)`);
  // ---- AFTER THE MATCH: NEW GAME (host only), breathing until tapped
  await podium(p, code, [me]); await sleep(600);
  await ev(p, "import('/js/host.js').then(m => m.backToLobby())");
  await Promise.all([p, q].map(x => waitFor(x, onTitle, 'back', 12000)));
  await waitFor(p, "document.querySelector('.rdk-play').classList.contains('rdk-rm')", 'the REMATCH ring', 30000).catch(() => {});
  const ng = await ev(p, "(() => { const t = document.querySelector('.rdk-games'); return { lbl: t.textContent, breathe: t.classList.contains('rdk-breathe'), col: getComputedStyle(t.querySelector('.rdk-lbl')).color }; })()");
  const ngB = await ev(q, "document.querySelector('.rdk-games').textContent");
  ok(/NEW GAME/.test(ng.lbl) && ng.breathe && /143, 246, 255/.test(ng.col) && /GAMES/.test(ngB) && !/NEW GAME/.test(ngB), `AFTER THE MATCH: the host's tab reads NEW GAME in cyan (${ng.col}) and breathes; the guest's still GAMES ("${ngB}")`);
  const pill = await ev(p, "document.querySelector('.rdk-votes').hidden");
  ok(pill, '…no pill until someone votes (no empty dots, no count)');
  if (SHOTS) await p.screenshot({ path: `${OUT}newstart-aftermatch-host.png` });
  await ev(p, "document.querySelector('.rdk-games').click()");
  await waitFor(p, "!!document.querySelector('.rc-games-sheet')", 'the game list', 6000).catch(() => {});
  const calm = await ev(p, "(() => { const t = document.querySelector('.rdk-games'); return { lbl: t.textContent, breathe: t.classList.contains('rdk-breathe') }; })()");
  ok(/NEW GAME/.test(calm.lbl) && !calm.breathe, `…tapped → the game list; NEW GAME stops breathing ("${calm.lbl}")`);
  await ev(p, "(() => { const b = document.querySelector('.rc-games-sheet .pfs-back'); if (b) b.click(); })()"); await sleep(500);
  // ---- THE QUICK START (a same-game REMATCH): the sign lit at once, the walk-in, the fade — ~3 s
  const t1 = Date.now();
  await ev(p, "document.querySelector('.rdk-play').click()");
  await waitFor(p, "!!document.querySelector('.nd-sign.rc-go')", 'the rematch start', 5000).catch(() => {});
  const r1 = await (async () => { await waitFor(p, 'window.__arcade.serverNow() - window.__arcade.state.meta.go.at >= 450', 'q 450', 5000).catch(() => {}); return { ...(await signState(p)), age: await ageOf(p) }; })();
  ok(r1.quick && /^q/.test(r1.m) && r1.lit === r1.tubes && r1.tubes >= 6 && !r1.scaled, `THE QUICK START (a REMATCH — match ${r1.m}): the game's sign already lit at ${r1.age} ms (${r1.lit}/${r1.tubes}), no push`);
  const routed2 = await Promise.all([p, q].map(x => waitFor(x, `!(${onTitle})`, 'the rematch', 8000).then(() => Date.now() - t1, () => null)));
  ok(routed2.every(v => v != null && v >= 2400 && v <= 4200), `…in the game on both phones ${routed2.join(' / ')} ms after the tap (the quick start is 3 s)`);
  const clock = await ev(p, '({ s: window.__arcade.state.game.phaseStartAt, go: window.__arcade.state.meta.go.at })');
  ok(Math.abs(clock.s - clock.go - 3000) < 400, `…the game's own clock starts after the quick start (the tap + ${clock.s - clock.go} ms)`);
  await A.ctx.close(); await B.ctx.close();
});
