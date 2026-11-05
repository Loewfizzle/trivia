// CITY 2.0 — THE HARBOR end to end: LOBBY FIXES (Nov 4 — docs/harbor/passes/lobby-fixes.md — the owner's real-phone test of the room).
// Its own cloud job (`lobbyfix`).
//   oneseat  — ONE PROFILE, ONE SEAT + ONE ACCOUNT, ONE ROOM on THREE slots sharing one profile: the second device asked (CANCEL keeps it out,
//              MOVE HERE takes the seat + the first walks out), a third hosting another room takes it from the second
// ADDING A GROUP: G('name', …) here + the name in ../harbor-jobs.mjs (CI_JOBS.lobbyfix).
import { log, sleep, ok, open, ev, waitFor, harborUp, dbPut, G, OUT, SHOTS, NIGHT, BASE } from './kit.mjs';
import { dbPatch, dbGet, ROOMQ, hostRoom, joinRoom, settledRoom, topAt, fakeGuests, startOC, onTitle, podium } from './lobby2.mjs';

/** this slot's profile record (me.js) once the server has linked it */
const meOf = async (p, slot) => { await waitFor(p, `(() => { try { const m = JSON.parse(localStorage.getItem('na:${slot}:me') || 'null'); return !!(m && m.pid); } catch { return false; } })()`, `${slot}'s profile`, 20000); return ev(p, `JSON.parse(localStorage.getItem('na:${slot}:me'))`); };
/** this slot takes the given profile (as BRING YOUR CARD would): the device link on the server + the record on the phone */
async function shareProfile(p, slot, me) {
  // (the device's OWN profile link lands first — on a slow runner its sync finished AFTER the swap and put its own card back: no question)
  await meOf(p, slot).catch(() => {}); await sleep(400);
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
  const q = await ev(p, "({ t: document.querySelector('.st-sheet .sh-t b').textContent, line: document.querySelector('.st-sheet .st-line').textContent })");
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
const closeCards = p => ev(p, "(() => { const x = document.querySelector('.vl-full .vl-full-x'); if (x) x.click(); document.querySelectorAll('.sh:not(.is-out) .sh-back').forEach(e => e.click()); })()");
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
  await ev(p, "(() => { const b = document.querySelector('.rc-games-sheet .sh-back'); if (b) b.click(); })()"); await sleep(500);
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

// THE NAME PLATE COVERS ITS WIDEST LINE (the owner, Nov 4 2:58 pm: "THE DEVELOPER · Nº 0001" ran past the plate, sized to the name): on every
// full card + every strip, the longest name + the dev line / LV 100 · HOST stay INSIDE the plate (the stepped plate's lower row too) at 390 / 402 / 430
const plateMiss = (p, sel) => ev(p, `(() => { const out = [];
  for (const pl of document.querySelectorAll('${sel}')) { const P = pl.getBoundingClientRect(), card = pl.closest('[data-card]').dataset.card;
    const lines = [...pl.querySelectorAll('.vl-fc-name, .vl-fc-lv, .vl-name, .vl-lv')];
    for (const l of lines) { const r = document.createRange(); r.selectNodeContents(l); const b = r.getBoundingClientRect(); if (b.right > P.right - 1 || b.left < P.left) out.push(card + ' ' + l.className.split(' ')[0] + ' ' + Math.round(b.right - P.right)); }
    // (the stepped plate: its lower row reaches past the level line)
    const cp = pl.style.clipPath, lv = pl.querySelector('.vl-lv'); if (cp && lv) { const m = /L (-?[\\d.]+) (-?[\\d.]+) A [\\d.]+ [\\d.]+ 0 0 0 (-?[\\d.]+)/.exec(cp); if (m) { const x2 = +m[3], r = document.createRange(); r.selectNodeContents(lv); if (r.getBoundingClientRect().right - P.left > x2 - 2) out.push(card + ' step ' + Math.round(r.getBoundingClientRect().right - P.left - x2)); } } }
  return out; })()`);
G('platefit', async () => {
  for (const w of [390, 402, 430]) {
    const Q = await open({ slot: `pf${w}`, view: [w, 900], wait: false, city: false }), p = Q.page;
    for (const [qs, what] of [['name=WWWWWWWWWWWW&lv=100', 'the widest name + LV 100'], ['name=LOEWFIZZLE&lv=9', 'LOEWFIZZLE'], ['name=WWWWWWWWWWWW&lv=100&host=1&only=strip', 'LV 100 · HOST']]) {
      await p.goto(`${BASE}/tests/integration/plate-preview.html?${qs}`);
      await waitFor(p, 'window.__ready', 'the preview', 15000); await sleep(700);
      const miss = [...(await plateMiss(p, '.vl-fc-plate')), ...(await plateMiss(p, '.vl-plate'))];
      const n = await ev(p, "document.querySelectorAll('.vl-fc-plate, .vl-plate').length");
      ok(n > 40 && !miss.length, `THE PLATE COVERS ITS WIDEST LINE at ${w} — ${what}: ${n} plates (full cards + strips, the dev line incl.)${miss.length ? ` — PAST: ${miss.slice(0, 8).join(', ')}` : ''}`);
    }
    if (SHOTS) { await p.goto(`${BASE}/tests/integration/plate-preview.html?name=LOEWFIZZLE&lv=9&cards=card-dev-source,card-dev-switchboard,card-founder`); await waitFor(p, 'window.__ready', 'p', 15000); await sleep(900); await p.screenshot({ path: `${OUT}platefit-${w}.png`, fullPage: true }); }
    await Q.ctx.close();
  }
});

// THE YOU PAGE ON A DESKTOP (a slim visible scrollbar, the WHEEL anywhere on the page + a mouse DRAG scroll it) + EDIT PROFILE's two rows at
// ACCOUNT's top IN A ROOM too (they were missing from the room's profile) — 1440 × 900 + the phone (402: unchanged, no bar)
G('youpage', async () => {
  for (const [view, slot] of [[[1440, 900], 'ypd'], [[402, 874], 'ypp']]) {
    const desk = view[0] > 1000;
    const { Q, p } = await hostRoom(slot, view);
    await ev(p, "(() => { const b = document.querySelector('.rdk-you'); if (b) b.click(); return 1; })()");
    await waitFor(p, "!!document.querySelector('.pf-overlay .pf-scroll .pf-account')", 'the YOU page over the room', 10000);
    await sleep(900);
    const r = await ev(p, `(() => { const sc = document.querySelector('.pf-overlay .pf-scroll'), acc = sc.querySelector('.pf-account'), kids = [...acc.children].filter(k => k.tagName !== 'H3'), R = sc.getBoundingClientRect();
      return { sbw: getComputedStyle(sc).scrollbarWidth, bar: sc.offsetWidth - sc.clientWidth, w: Math.round(R.width), rows: !!acc.querySelector('.pf-er-name, .pf-er-colour, .pf-edit'), max: sc.scrollHeight - sc.clientHeight }; })()`);
    // (the desktop rule matches a mouse OR a wide screen — the cloud's headless Linux reports no fine pointer)
    // (the owner's ADD-ON 3: NAME + COLOUR at the TOP of CUSTOMIZE — in a room too — on screen without scrolling; none in ACCOUNT)
    await ev(p, "document.querySelector('.pf-overlay .vl-dp-go').click()");
    await waitFor(p, "!!document.querySelector('.vl-dress .vl-yr-name')", 'CUSTOMIZE', 8000);
    await sleep(500);
    const cz = await ev(p, "(() => { const n = document.querySelector('.vl-yr-name').getBoundingClientRect(); return { inView: n.top >= 0 && n.bottom <= innerHeight, h: Math.round(n.height), colour: !!document.querySelector('.vl-yr-colour') }; })()");
    ok(!r.rows && cz.inView && cz.h >= 44 && !cz.colour, `EDIT USERNAME at the TOP of CUSTOMIZE in a ROOM (${view[0]}): on screen without scrolling (${cz.inView}, a ${cz.h} pt row; no COLOUR row); none in ACCOUNT (${!r.rows})`);
    if (SHOTS) await p.screenshot({ path: `${OUT}customize-you-${view[0]}.png` });
    await ev(p, "document.querySelector('.vl-dr-back').click()"); await sleep(400);
    if (desk) {
      ok(r.sbw === 'thin' && r.w >= view[0] - 40 && r.max > 200, `THE YOU PAGE ON A DESKTOP: the whole width scrolls (${r.w} pt) with a slim visible scrollbar (scrollbar-width ${r.sbw}; headless Chromium draws none)`);
      await p.mouse.move(120, 500); await p.mouse.wheel({ deltaY: 500 }); await sleep(600);
      const t1 = await ev(p, "document.querySelector('.pf-overlay .pf-scroll').scrollTop");
      await p.mouse.move(view[0] - 160, 700); await p.mouse.down(); await p.mouse.move(view[0] - 160, 600, { steps: 6 }); await p.mouse.move(view[0] - 160, 450, { steps: 6 }); await p.mouse.up(); await sleep(300);
      const t2 = await ev(p, "document.querySelector('.pf-overlay .pf-scroll').scrollTop");
      ok(t1 > 100 && t2 > t1 + 100, `…the mouse WHEEL at the page's side scrolls it (${Math.round(t1)} pt) and a click-DRAG too (${Math.round(t2)} pt)`);
      if (SHOTS) await p.screenshot({ path: `${OUT}youpage-1440.png` });
    } else {
      ok(r.sbw === 'none', `…the PHONE's YOU page unchanged (no visible bar: ${r.sbw})`);
      if (SHOTS) { await ev(p, "document.querySelector('.pf-overlay .pf-account').scrollIntoView()"); await sleep(400); await p.screenshot({ path: `${OUT}youpage-402.png` }); }
    }
    await Q.ctx.close();
  }
});

// THE ADD-ONS (the owner, desktop 1440 × 900): THE MUSIC BUTTON in the SCREEN's top-right corner, level with ☰ (title + room, any theme) on
// every size; ARRIVALS from the edge NEAREST the door (per camera, off-screen first, at the line in their normal time); THE RADIO BUTTON rests
// with the dock + the corner buttons
const corner = p => ev(p, "(() => { const m = document.querySelector('.music-btn').getBoundingClientRect(), b = document.querySelector('.menu-btn').getBoundingClientRect(); return { gapR: Math.round(innerWidth - m.right), top: Math.round(m.top), menuTop: Math.round(b.top), w: innerWidth }; })()");
G('corners', async () => {
  for (const view of [[1440, 900], [1180, 820], [844, 390], [390, 844], [402, 874], [430, 932]]) {
    const { Q, p } = await hostRoom(`cn${view[0]}`, view);
    const room = await corner(p);
    await ev(p, "document.body.dataset.theme = 'overclock'"); await sleep(150);   // (a game's theme on the body — the walk-in, or left after a match)
    const themed = await corner(p);
    await ev(p, "document.body.dataset.theme = ''");
    const okc = c => Math.abs(c.gapR - 12) <= 2 && c.top === c.menuTop;
    ok(okc(room) && okc(themed), `THE MUSIC BUTTON at ${view[0]}×${view[1]}: the SCREEN's top-right corner, level with ☰ — in the room (${room.gapR} pt from the edge) + with a game's theme on (${themed.gapR} pt)`);
    if (SHOTS && (view[0] === 1440 || view[0] === 402)) await p.screenshot({ path: `${OUT}corners-${view[0]}.png` });
    await Q.ctx.close();
  }
  // + the title itself (no room) at 1440
  const T = await open({ slot: 'cnt', qs: ROOMQ, view: [1440, 900] }); await harborUp(T.page);
  const t = await corner(T.page);
  ok(Math.abs(t.gapR - 12) <= 2 && t.top === t.menuTop, `…and on the title at 1440 (${t.gapR} pt)`);
  await T.ctx.close();
});

G('arrivals', async () => {
  for (const view of [[402, 874], [1440, 900]]) {
    const { Q, p, code } = await hostRoom(`ar${view[0]}`, view);
    await settledRoom(p, 1, 20000).catch(() => {});
    // the right line's first guest (R0 — the old rule sent them in from the RIGHT edge): every frame from the join
    await ev(p, "(() => { window.__ar = []; const t0 = performance.now(); const tick = () => { const r = window.__district.room(), x = r && r.people && r.people.find(q => q.uid === 'arv0'), hb = r && r.hits && r.hits.arv0; if (x && x.s) window.__ar.push({ t: Math.round(performance.now() - t0), x: x.s.x, pose: x.s.pose, l: hb ? hb.x0 : null, rr: hb ? hb.x1 : null }); if (performance.now() - t0 < 30000) requestAnimationFrame(tick); }; requestAnimationFrame(tick); return 1; })()");
    await fakeGuests(code, 1, 0, 'arv');
    if (SHOTS) { await sleep(view[0] > 1000 ? 1600 : 2600); await p.screenshot({ path: `${OUT}arrivals-${view[0]}.png` }); }
    await waitFor(p, "(() => { const a = window.__ar || []; return a.length && a[a.length - 1].pose === 'wait'; })()", 'at the line', 30000).catch(() => {});
    const s = await ev(p, 'window.__ar'), door = await ev(p, "(() => { const d = window.__district.door && window.__district.door(); return d ? Math.round(d.x) : null; })()");
    const first = s[0] || {}, last = s[s.length - 1] || {}, W = view[0];
    const nearLeft = door != null ? door < W / 2 : true;
    const fromLeft = first.x < last.x, off = first.rr != null ? (fromLeft ? first.rr <= 2 : first.l >= W - 2) : true;
    const tAt = (s.find(q => q.pose === 'wait') || {}).t;
    ok(s.length > 10 && fromLeft === nearLeft && off && tAt != null && tAt < 16000, `ARRIVALS at ${W}: in from the ${fromLeft ? 'LEFT' : 'RIGHT'} edge — the one nearest the door (the door at ${door} of ${W} pt) — off-screen first (${off}), at the line in ${tAt} ms`);
    await Q.ctx.close();
  }
});

G('radiorest', async () => {
  for (const view of [[402, 874], [1440, 900]]) {
    const O = await open({ slot: `rr${view[0]}`, qs: `${NIGHT}&idle=1`, view });
    await harborUp(O.page);
    const pid = await (async () => { for (let i = 0; i < 60; i++) { const m = await ev(O.page, `(() => { try { return JSON.parse(localStorage.getItem('na:rr${view[0]}:me') || 'null'); } catch { return null; } })()`); if (m && m.pid) return m.pid; await sleep(400); } return null; })();
    await dbPut(`testAdmins/${pid}`, true);
    await ev(O.page, 'sessionStorage.clear()'); await O.page.reload(); await harborUp(O.page);
    await waitFor(O.page, "!!document.querySelector('.rd-btn') && getComputedStyle(document.querySelector('.rd-btn')).display !== 'none'", 'the radio button', 25000);
    // the rest: sampled through the fade — the radio's opacity follows the corner buttons' (the same 1.8 s ease)
    await waitFor(O.page, "document.body.classList.contains('nd-idle')", 'the rest', 20000);
    const fade = [];
    for (let i = 0; i < 12; i++) { fade.push(await ev(O.page, "(() => { const o = s => +getComputedStyle(document.querySelector(s)).opacity; return { r: o('.rd-btn'), m: o('.menu-btn'), pe: getComputedStyle(document.querySelector('.rd-btn')).pointerEvents }; })()")); await sleep(180); }
    const worst = Math.max(...fade.map(f => Math.abs(f.r - f.m))), endR = fade[fade.length - 1].r;
    ok(worst < 0.08 && endR < 0.05 && fade.every(f => f.pe === 'none'), `THE RADIO BUTTON RESTS (${view[0]}): its opacity follows the corner buttons' through the fade (worst gap ${worst.toFixed(2)}, at rest ${endR}), untappable while faded`);
    // the wake tap only wakes: a tap where the radio sits brings everything back — and opens nothing
    const rb = await ev(O.page, "(() => { const b = document.querySelector('.rd-btn').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; })()");
    await O.page.mouse.click(rb.x, rb.y);
    await sleep(700);
    const back = await ev(O.page, "(() => { const o = s => +getComputedStyle(document.querySelector(s)).opacity; return { r: o('.rd-btn'), m: o('.menu-btn'), idle: document.body.classList.contains('nd-idle'), open: document.body.classList.contains('rd-open') }; })()");
    ok(!back.idle && back.r > 0.9 && back.m > 0.9 && !back.open, `…the WAKE tap brings it back with the rest (${back.r} / ${back.m}) — and only wakes (the radio didn't open: ${!back.open})`);
    await dbPut(`testAdmins/${pid}`, null);
    await O.ctx.close();
  }
});

// SHELL 2.0 A — THE ONE LOOK in the browser (docs/harbor/passes/shell-a.md; the unit half: tests/shell.test.mjs): THE ☰ MENU's rows (no admin
// rows for a member), THE SHEET solid + stacked (‹ on the second, the one Esc closes the TOP only), ONE MESSAGE at a time ABOVE THE DOCK,
// the dock's labels, THE PODIUM's BACK TO THE ROOM under the XP box + in view at 390
G('shell', async () => {
  const Q = await open({ slot: 'shl', qs: NIGHT, view: [390, 844] }), p = Q.page;
  await harborUp(p);
  // ---- the ☰ menu
  await ev(p, "document.querySelector('.menu-btn').click()");
  await waitFor(p, "!!document.querySelector('.gm.is-in .sh-row')", 'the menu', 6000);
  await sleep(450);
  const m = await ev(p, `(() => { const rows = [...document.querySelectorAll('.gm .sh-row')], pn = document.querySelector('.gm .sh-panel'), r = pn.getBoundingClientRect(), mid = document.elementFromPoint(r.left + r.width / 2, r.top + 40);
    return { labels: rows.map(x => x.querySelector('.sh-row-l b').textContent), h: Math.min(...rows.map(x => Math.round(x.getBoundingClientRect().height))), solid: !!(mid && mid.closest('.sh-panel')), bg: getComputedStyle(pn).backgroundImage, blur: getComputedStyle(pn).backdropFilter }; })()`);
  ok(m.labels.join(' · ') === 'Your card · How to play · Settings · Sound effects' && m.h >= 56 && m.solid && !/rgba/.test(m.bg) && (!m.blur || m.blur === 'none'),
    `THE ☰ MENU: ${m.labels.join(' · ')} (no admin rows for a member), rows ${m.h} pt, the sheet SOLID (${m.solid}, no blur)`);
  // ---- a sheet on a sheet: ‹ shows on the second; Esc closes the TOP only, then the next
  await ev(p, "document.querySelector('.gm .gm-settings').click()");
  await waitFor(p, "!!document.querySelector('.sh.settings.is-in')", 'SETTINGS', 6000); await sleep(400);
  // (the menu closes itself when it opens SETTINGS; open HOW TO PLAY on top of SETTINGS to test the stack)
  await ev(p, "import('/js/ui/help.js').then(m => { m.openHelp('prism'); return 1; })");
  await waitFor(p, "!!document.querySelector('.help-sheet.is-in')", 'HOW TO PLAY', 6000); await sleep(400);
  const st = await ev(p, `({ n: document.querySelectorAll('.sh:not(.is-out)').length, back: !document.querySelector('.help-sheet .sh-back').hidden, top: document.elementFromPoint(innerWidth / 2, innerHeight - 120).closest('.sh').className })`);
  await p.keyboard.press('Escape'); await sleep(450);
  const e1 = await ev(p, `({ help: !!document.querySelector('.help-sheet:not(.is-out)'), set: !!document.querySelector('.sh.settings:not(.is-out)') })`);
  await p.keyboard.press('Escape'); await sleep(450);
  const e2 = await ev(p, `!!document.querySelector('.sh:not(.is-out)')`);
  ok(st.n === 2 && st.back && /help-sheet/.test(st.top) && !e1.help && e1.set && !e2, `THE SHEET STACK: HOW TO PLAY on SETTINGS (‹ ${st.back}, on top) → Esc closes HOW TO PLAY only (settings still ${e1.set}) → Esc closes SETTINGS (${!e2})`);
  // ---- ONE MESSAGE at a time, above the dock, never on the sign
  await ev(p, "import('/js/ui/toast.js').then(m => { m.toast('FIRST', 'info', 5000); m.toast('Host left — you’re the host now', 'warn', { ms: 5000, sub: 'Your friends are still in the room.' }); return 1; })");
  await sleep(500);
  const ms = await ev(p, `(() => { const on = [...document.querySelectorAll('.sh-msg:not(.is-out)')], r = on[0] && on[0].getBoundingClientRect(), d = document.querySelector('.nd-actions').getBoundingClientRect(), sign = document.querySelector('.nd-logo, .nd-sign, .nd-neon');
    const s = sign ? sign.getBoundingClientRect() : { bottom: 0 }; return { n: on.length, t: on[0] && on[0].querySelector('.sh-msg-t').textContent, above: r && r.bottom <= d.top + 1, clear: r && r.top >= s.bottom, tube: on[0] && getComputedStyle(on[0].querySelector('.sh-msg-tube')).width, x: on[0] && on[0].querySelector('.sh-msg-x').getBoundingClientRect().height }; })()`);
  ok(ms.n === 1 && /you’re the host now/i.test(ms.t) && ms.above && ms.clear && ms.x >= 44, `ONE MESSAGE: "${ms.t}" — one at a time (${ms.n}), above the dock (${ms.above}), clear of the sign (${ms.clear}), its tube ${ms.tube}, × ${ms.x} pt`);
  // ---- the dock's labels
  const lb = await ev(p, "[...document.querySelectorAll('.nd-actions .nd-tab .rdk-lbl')].map(x => x.textContent).join(' · ')");
  ok(lb === 'BOARD · GAMES · YOU', `THE TITLE DOCK's LABELS: ${lb}`);
  if (SHOTS) await p.screenshot({ path: `${OUT}shell-message-390.png` });
  await Q.ctx.close();
  // ---- THE PODIUM's FRAME (the results preview: no Firebase): BACK TO THE ROOM right under the XP box, in view without scrolling at 390
  const { launch } = await import('./kit.mjs');
  const ctx = await (await launch()).createBrowserContext(), q = await ctx.newPage();
  await q.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await q.goto(`${BASE}/tests/integration/results-preview.html?case=pb`);
  await waitFor(q, "!!document.querySelector('.final .final-back')", 'the podium', 15000);
  for (let i = 0; i < 6 && await ev(q, "!!document.querySelector('.pg-moment')"); i++) { await ev(q, "(() => { const b = document.querySelector('.pg-moment .pg-btn'); if (b) b.click(); })()"); await sleep(700); }
  await sleep(600);
  const pd = await ev(q, `(() => { const b = document.querySelector('.final-back'), x = document.querySelector('.final .rc-slot'), r = b.getBoundingClientRect(), xr = x ? x.getBoundingClientRect() : null, lb = document.querySelector('.final .board-list');
    return { inView: r.bottom <= innerHeight && r.top >= 0, under: !!(xr && r.top >= xr.bottom - 1 && r.top - xr.bottom < 80), beforeBoard: !!(lb && (b.compareDocumentPosition(lb) & 4)), main: b.classList.contains('btn-primary'), n: document.querySelectorAll('.final button.btn').length, h: Math.round(r.height), top: Math.round(r.top) }; })()`);
  ok(pd.inView && pd.under && pd.beforeBoard && pd.main && pd.h >= 54, `THE PODIUM's FRAME (390): BACK TO THE ROOM — the tube main (${pd.main}) at ${pd.top} pt, right under the XP box (${pd.under}), in view (${pd.inView}), before the board (${pd.beforeBoard}); ${pd.n} tube(s) on the podium`);
  // ---- THE ADD-ON: the results rows = the players' SLIM CARDS (the winner's on top), on ONE shared effect surface
  const sb = await ev(q, `(() => { const l = document.querySelector('.final .board-list'), rows = [...l.querySelectorAll('.lb-row')];
    return { strips: l.classList.contains('is-strips'), n: rows.filter(r => r.querySelector('.vl-strip')).length, rows: rows.length, first: (rows[0].querySelector('.vl-name') || {}).textContent, rank: rows[0].querySelector('.lb-rank').textContent,
      score: !!rows[0].querySelector('.lb-over .lb-score'), canvases: l.querySelectorAll('canvas').length }; })()`);
  ok(sb.strips && sb.n === sb.rows && /BENNY/.test(sb.first) && sb.rank === '01' && sb.score && sb.canvases <= 1, `THE RESULTS ROWS = SLIM CARDS: ${sb.n}/${sb.rows} strips, the winner's on top ("${sb.first}" ${sb.rank}), the score over it, ${sb.canvases} shared canvas`);
  if (SHOTS) await q.screenshot({ path: `${OUT}shell-podium-390.png` });
  await ctx.close();
  // ---- THE XP BOX FITS (the owner: "LEVEL 1451 XP"): its pieces never collide + YOUR CARD on ONE line — a 2-digit level, a 2-digit + 3-digit
  //      pair (LEGEND · LEVEL 99 → 662 XP TO 100) and the longest band name (NEWCOMER) at 390 / 402 / 430
  const fits = [];
  for (const [w, hh] of [[390, 844], [402, 874], [430, 932]]) for (const xpq of ['', '&xp=44300,44338', '&xp=0,20']) {
    const c2 = await (await launch()).createBrowserContext(), r2 = await c2.newPage();
    await r2.setViewport({ width: w, height: hh, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await r2.goto(`${BASE}/tests/integration/results-preview.html?case=pb${xpq}`);
    await waitFor(r2, "!!document.querySelector('.final .rc-xp .rc-xp-card')", 'the XP box', 15000).catch(() => {});
    await sleep(500);
    fits.push(await ev(r2, `(() => { const box = document.querySelector('.final .rc-xp'); if (!box) return { ok: false, why: 'no box' };
      const parts = [...box.querySelectorAll('.rc-xp-step, .rc-xp-need, .rc-xp-card, .rc-xp-top')].map(e => ({ t: e.textContent, r: e.getBoundingClientRect() }));
      const hit = (a, b) => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
      const clash = []; for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) if (parts[i].t && parts[j].t && hit(parts[i].r, parts[j].r)) clash.push(parts[i].t + ' × ' + parts[j].t);
      const b = box.querySelector('.rc-xp-card'), rg = document.createRange(); rg.selectNodeContents(b); const lines = new Set([...rg.getClientRects()].map(x => Math.round(x.top))).size;
      const inBox = parts.every(p => p.r.right <= box.getBoundingClientRect().right + 0.5);
      return { ok: !clash.length && lines === 1 && inBox, w: innerWidth, lv: (box.querySelector('.rc-xp-step') || {}).textContent, clash, lines, inBox }; })()`));
    await c2.close();
  }
  ok(fits.every(f => f.ok), `THE XP BOX FITS at 390 / 402 / 430 (${fits.map(f => `${f.w}: ${f.lv}${f.ok ? '' : ` ✗ ${f.clash.join(' · ')} lines ${f.lines} in ${f.inBox}`}`).join(' | ')}) — nothing collides, YOUR CARD on one line`);
});
