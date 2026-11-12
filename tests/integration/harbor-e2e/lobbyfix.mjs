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
  // (THE LOAD FIX — green means green: this was a FIXED-TIME sample at 2.3 s; the cloud's slow runner read 'wait' there once while the walk
  //  starts at ~1.45 s on the mini PC before + after the pass. Now a CONDITION: the host walks (or is in) before the fade, the sign lit then)
  const walkP = `(() => { const r = window.__district.room(); const h = r && r.people.find(x => x.uid === '${me}'); const g = window.__arcade.state.meta.go; return h && g && (h.inside || (h.s && h.s.pose === 'walk')) && window.__arcade.serverNow() - g.at < 4300; })()`;
  const walked = await waitFor(p, walkP, 'the host walking in', 4000).then(() => true, () => false);
  const walk = walked ? { ...(await ev(p, `(() => { const r = window.__district.room(); const h = r && r.people.find(x => x.uid === '${me}'); return h ? { pose: h.s && h.s.pose, inside: h.inside } : null; })()`)), age: await ageOf(p), lit: (await signState(p)).lit } : null;
  const s3 = await at(4000);
  ok(s1.go && s1.full && s1.lit === 0, `THE FULL START: NEON powers down first — the game's sign not lit yet at ${s1.age} ms (${s1.lit} tubes lit)`);
  ok(s2.tubes >= 6 && s2.lit === s2.tubes && s2.pink && s2.shown > 0.95, `…THE GAME's OWN SIGN lit for real — every tube (${s2.lit}/${s2.tubes}) in the NEON pink by ${s2.age} ms`);
  ok(s3.lit === s3.tubes && s3.shown > 0.95, `…and it HOLDS (still all lit at ${s3.age} ms — readable ~3 s)`);
  ok(walk && (walk.pose === 'walk' || walk.inside) && walk.lit > 0, `…the lines walk in UNDER the lit sign (the host ${walk ? `${walk.inside ? 'inside' : walk.pose} at ${walk.age} ms, ${walk.lit} tubes lit` : 'never walked before the fade'})`);
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
    // (the stepped plate: its short row reaches past its own words — the level line, or the name on THE REVERSE STEP — CARD FIXES)
    const st = pl.dataset.step, x2 = +pl.dataset.x2, row = st === 'n' ? pl.querySelector('.vl-lv, .vl-fc-lv') : st === 'r' ? pl.querySelector('.vl-name, .vl-fc-name') : null; if (row) { const r = document.createRange(); r.selectNodeContents(row); const sc = P.width / pl.offsetWidth; if ((r.getBoundingClientRect().right - P.left) / sc > x2 - 2) out.push(card + ' step ' + st + ' ' + Math.round((r.getBoundingClientRect().right - P.left) / sc - x2)); } }
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
    // THE HERO-SPOT RULE (SHELL 2.0 B2 — the audit): every card's declared hero (js/vault/hero.js) clear of the LIVE stepped plate (its name
    // row + its level row up to the step) and the tier gem, with the owner's own name, at this width
    { const H = await ev(p, "import('/js/vault/hero.js').then(m => Object.keys(m.HERO).join(','))");
      await p.goto(`${BASE}/tests/integration/plate-preview.html?only=strip&name=LOEWFIZZLE&lv=9&cards=${H}`);
      await waitFor(p, 'window.__ready', 'the preview', 15000); await sleep(700);
      const r = await ev(p, `(async () => { const M = await import('/js/vault/hero.js'), out = [];
        for (const s of document.querySelectorAll('.vl-strip')) {
          const S = s.getBoundingClientRect(), P = s.querySelector('.vl-plate').getBoundingClientRect(), N = s.querySelector('.vl-name').getBoundingClientRect(), V = s.querySelector('.vl-lv').getBoundingClientRect(), G = s.querySelector('.vl-gem').getBoundingClientRect();
          const fr = (x, y, w, h) => [(x - S.left) / S.width, (y - S.top) / S.height, w / S.width, h / S.height], y1 = (N.bottom + V.top) / 2;
          const stepped = s.querySelector('.vl-plate').classList.contains('vl-stepped');
          const pl = s.querySelector('.vl-plate'), x2 = P.left + +pl.dataset.x2, yy = P.top + +pl.dataset.y1;   // (CARD FIXES: the step's own corner — normal or reverse)
          const plate = !stepped ? [fr(P.left, P.top, P.width, P.height)] : pl.dataset.step === 'r' ? [fr(P.left, P.top, x2 - P.left, yy - P.top), fr(P.left, yy, P.width, P.bottom - yy)] : [fr(P.left, P.top, P.width, yy - P.top), fr(P.left, yy, x2 - P.left, P.bottom - yy)];
          const gem = fr(G.left, G.top, G.width, G.height);
          // (the hero's CENTRE clear of the name row — a long name may cover a wing; the whole box clear of the level row + the gem)
          for (const b of M.HERO[s.dataset.card] || []) { const c = [b[0] + b[2] / 2 - 0.005, b[1] + b[3] / 2 - 0.005, 0.01, 0.01];
            if (M.overlaps(c, plate[0]) || plate.slice(1).some(q => M.overlaps(b, q)) || M.overlaps(b, gem)) out.push(s.dataset.card); }
        }
        return { n: document.querySelectorAll('.vl-strip').length, bad: [...new Set(out)], pure: M.heroMisses() }; })()`);
      ok(r.n >= 15 && !r.bad.length && !r.pure.length, `THE HERO-SPOT RULE at ${w}: ${r.n} cards' main features middle → middle-right, clear of the stepped plate (LOEWFIZZLE) + the tier gem${r.bad.length || r.pure.length ? ` — OVER: ${[...r.bad, ...r.pure].join(', ')}` : ''}`); }
    if (SHOTS) { await p.goto(`${BASE}/tests/integration/plate-preview.html?name=LOEWFIZZLE&lv=9&cards=card-dev-source,card-dev-switchboard,card-founder`); await waitFor(p, 'window.__ready', 'p', 15000); await sleep(900); await p.screenshot({ path: `${OUT}platefit-${w}.png`, fullPage: true }); }
    await Q.ctx.close();
  }
});

// CARD FIXES — THE CARD's LAYOUT (the owner, Nov 5 4:58 + 5:04 pm: "don't let the overlap happen" · "show THE MOST OF THE CARD"): on EVERY full
// card (the 11 gifts, the dev cards, the rest) at 390 / 402 / 430 — a founder AND not, a short + the longest name, HOST on the strips — none of
// the pieces overlap (the top line's words, the tier gem / the 1 OF 1 badge, the FOUNDER pill, the plate, MEMBER SINCE, the card's name), the
// plate covers 0 of the card's HERO (vault/layout.js — its real stepped shape), a GIFT card has NO FOUNDER pill; the strips' plates step the
// right way (THE REVERSE STEP when the level line is the longer)
const cardFit = async (p, BASE, w) => {
  const out = [];
  for (const [qs, what] of [['name=BEN&lv=23', 'BEN · founder'], ['name=BEN&lv=23&fd=0', 'BEN'], ['name=WWWWWWWWWWWW&lv=100', 'WWWWWWWWWWWW · founder'], ['name=LOEWFIZZLE&lv=9&fd=0', 'LOEWFIZZLE']]) {
    await p.goto(`${BASE}/tests/integration/plate-preview.html?only=full&${qs}`);
    await p.waitForFunction('window.__ready', { timeout: 15000 }); await new Promise(r => setTimeout(r, 700));
    const r = await p.evaluate(async () => {
      const L = await import('/js/vault/layout.js'), G = await import('/js/core/gift-cards.js'), bad = [];
      const tb = n => { if (!n) return null; const rg = document.createRange(); rg.selectNodeContents(n); return rg.getBoundingClientRect(); };
      const bb = n => (n ? n.getBoundingClientRect() : null);
      const ov = (a, b) => a && b && a.width && b.width && a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
      let n = 0, heroed = 0;
      for (const el of document.querySelectorAll('.vl-fc')) {
        n++; const card = el.dataset.card, C = el.getBoundingClientRect(), pl = el.querySelector('.vl-fc-plate');
        const pieces = { top: tb(el.querySelector('.vl-fc-house')), badge: bb(el.querySelector('.vl-fc-gem')), fd: bb(el.querySelector(':scope > .vl-fc-fd')), plate: bb(pl), since: bb(el.querySelector('.vl-fc-since')), name: tb(el.querySelector('.vl-fc-card')) };
        const ks = Object.keys(pieces);
        for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) if (ov(pieces[ks[i]], pieces[ks[j]])) bad.push(`${card}: ${ks[i]} × ${ks[j]}`);
        if (G.isGiftCard(card) && pieces.fd) bad.push(`${card}: a FOUNDER pill on a gift`);
        // (the 6:04 pm ADD-ON: the plate = the NAME + LV n; the RANK in gold above MEMBER SINCE; the card's printed name on every full card)
        const lvt = (el.querySelector('.vl-fc-lv') || {}).textContent || '';
        if (!/^LV \d+$/.test(lvt)) bad.push(`${card}: the plate's second row "${lvt}"`);
        const own = !el.classList.contains('is-sight') && card !== 'card-founder';
        if (own && !(el.querySelector('.vl-fc-rank') || {}).textContent) bad.push(`${card}: no rank line`);
        if (own && !(pieces.name && pieces.name.width > 4)) bad.push(`${card}: no printed name`);
        const hero = L.heroBox(card, el.clientWidth, el.clientHeight);
        if (hero && pl && !el.classList.contains('is-sight')) {
          heroed++;
          const sh = L.shape(pl, pl.offsetLeft, pl.offsetTop, pl.offsetWidth, pl.offsetHeight);
          if (sh.some(b => L.hit(b, hero))) bad.push(`${card}: the plate over the hero`);
        }
        void C;
      }
      // the strips (the same page's ?only=strip is the next pass): nothing here
      return { n, heroed, bad };
    });
    out.push({ what, ...r });
  }
  // the strips: FRIENDS B — NO STEP on any plate (one clean box as wide as its longest row; both rows inside it)
  await p.goto(`${BASE}/tests/integration/plate-preview.html?only=strip&name=BEN&lv=100&host=1`);
  await p.waitForFunction('window.__ready', { timeout: 15000 }); await new Promise(r => setTimeout(r, 700));
  const st = await p.evaluate(() => { const bad = []; let rev = 0, n = 0;
    for (const pl of document.querySelectorAll('.vl-plate')) { n++; const rg = document.createRange(), ext = s => { rg.selectNodeContents(pl.querySelector(s)); return rg.getBoundingClientRect().right; };
      const nm = ext('.vl-name'), lv = ext('.vl-lv'), P = pl.getBoundingClientRect(), x2 = +pl.dataset.x2;
      void x2; if (pl.dataset.step || pl.style.clipPath || pl.classList.contains('vl-stepped') || pl.querySelector('.vl-step')) { rev++; bad.push(pl.closest('[data-card]').dataset.card + ' (stepped)'); }
      else if (nm > P.right + 0.5 || lv > P.right + 0.5) bad.push(pl.closest('[data-card]').dataset.card + ' (a row past the box)'); }
    return { n, rev, bad }; });
  return { out, st };
};
G('cardfit', async () => {
  for (const w of [390, 402, 430]) {
    const Q = await open({ slot: `cf${w}`, view: [w, 900], wait: false, city: false }), p = Q.page;
    const r = await cardFit(p, BASE, w);
    for (const o of r.out) ok(o.n >= 55 && o.heroed >= 11 && !o.bad.length, `THE CARD's LAYOUT at ${w} — ${o.what}: ${o.n} full cards, nothing overlapping (the top line, the badge, the FOUNDER pill, the plate, MEMBER SINCE, the card's name), the plate off the hero on ${o.heroed}, no FOUNDER pill on a gift${o.bad.length ? ` — ${o.bad.slice(0, 8).join(' | ')}` : ''}`);
    ok(r.st.n >= 55 && r.st.rev === 0 && !r.st.bad.length, `NO STEP (FRIENDS B) at ${w}: ${r.st.n} strips (BEN · LV 100 · HOST), ${r.st.rev} stepped — every plate one clean box, both rows inside${r.st.bad.length ? ` — ${r.st.bad.slice(0, 6).join(' | ')}` : ''}`);
    if (SHOTS) { await p.goto(`${BASE}/tests/integration/plate-preview.html?name=BEN&lv=23&fx=1&cards=card-gift-playerone,card-gift-youngbuck,card-gift-icecold,card-gift-anarchist`); await waitFor(p, 'window.__ready', 'p', 15000); await sleep(1200); await p.screenshot({ path: `${OUT}cardfit-${w}.png`, fullPage: true }); }
    await Q.ctx.close();
  }
});

// THE CARD PASS — THE SLIM-CARD LONG-NAME STANDARD (the owner, Nov 7 2:44 pm + the 9:15 pm ADD-ON: "get in the habit"): on EVERY slim card the
// hero (the face / the subject — js/vault/hero.js) sits far right and the left holds the plate with the LONGEST name — NAME_MAX letters
// (js/config.js — the check reads it, so it follows the rule if the limit ever changes): the widest twelve (W × NAME_MAX) + MAXIMILIANOS at 390,
// LV 100 (the widest level line): the name + the level line never past the plate (never truncated — two lines at most), the plate's real
// stepped shape never over ANY of the card's hero box, the tier gem never under the plate
G('stripfit', async () => {
  const Q = await open({ slot: 'sf390', view: [390, 900], wait: false, city: false }), p = Q.page;
  await p.goto(`${BASE}/tests/integration/plate-preview.html?only=strip&cards=card-gilded`);
  await waitFor(p, 'window.__ready', 'the preview', 15000);
  const { max, ids } = await ev(p, "Promise.all([import('/js/config.js'), import('/js/vault/strip.js')]).then(([c, s]) => ({ max: c.NAME_MAX, ids: Object.keys(s.LOOKS).join(',') }))");
  const long = max >= 12 ? 'MAXIMILIANOS' + 'S'.repeat(max - 12) : 'MAXIMILIANOS'.slice(0, max);
  for (const name of ['W'.repeat(max), long]) {
    await p.goto(`${BASE}/tests/integration/plate-preview.html?only=strip&lv=100&name=${name}&cards=${ids}`);
    await waitFor(p, 'window.__ready', 'the preview', 15000); await sleep(900);
    const r = await ev(p, `(async () => { const M = await import('/js/vault/hero.js'), bad = [], fits = [];
      for (const s of document.querySelectorAll('.vl-strip')) {
        const card = s.dataset.card, S = s.getBoundingClientRect(), pl = s.querySelector('.vl-plate'), P = pl.getBoundingClientRect();
        const rg = document.createRange(), ext = n => { rg.selectNodeContents(n); return rg.getBoundingClientRect(); };
        const nm = s.querySelector('.vl-name'), lv = s.querySelector('.vl-lv'), N = ext(nm), V = ext(lv);
        if (N.right > P.right - 1 || V.right > P.right - 1 || nm.textContent.replace(/\\s/g, '') !== ${JSON.stringify(name)}) bad.push(card + ': the name / level past its plate');
        const fr = (x, y, w, h) => [(x - S.left) / S.width, (y - S.top) / S.height, w / S.width, h / S.height];
        const x2 = P.left + +pl.dataset.x2, yy = P.top + +pl.dataset.y1, st = pl.dataset.step;
        const plate = st === 'r' ? [fr(P.left, P.top, x2 - P.left, yy - P.top), fr(P.left, yy, P.width, P.bottom - yy)] : st === 'n' ? [fr(P.left, P.top, P.width, yy - P.top), fr(P.left, yy, x2 - P.left, P.bottom - yy)] : [fr(P.left, P.top, P.width, P.height)];
        // (the name row's real right edge — the plate's padding past the words is glass, not the name)
        plate[0][2] = Math.min(plate[0][2], (N.right + 4 - P.left) / S.width + 0.0001);
        for (const b of M.HERO[card] || []) if (plate.some(q => M.overlaps(b, q))) bad.push(card + ': the plate over its hero');
        fits.push(card + ' ' + (nm.classList.contains('fit-2') ? '2 lines' : Math.round(parseFloat(getComputedStyle(nm).fontSize)) + 'px'));
      }
      return { n: document.querySelectorAll('.vl-strip').length, bad: [...new Set(bad)], heroed: Object.keys(M.HERO).length, fits }; })()`);
    ok(r.n >= 60 && !r.bad.length, `THE SLIM-CARD LONG-NAME STANDARD at 390 — "${name}" (NAME_MAX ${max}, LV 100): ${r.n} strips, every name whole inside its plate, the plate off every hero (${r.heroed} cards declare one)${r.bad.length ? ` — ${r.bad.slice(0, 10).join(' | ')}` : ''}`);
  }
  if (SHOTS) { await p.goto(`${BASE}/tests/integration/plate-preview.html?only=strip&fx=1&lv=100&name=MAXIMILIANOS&cards=card-gift-dispatcher,card-gift-outoforder,card-gift-notguilty,card-gift-wastelander,card-gift-survivor,card-gift-zadomovinu`); await waitFor(p, 'window.__ready', 'p', 15000); await sleep(1500); await p.screenshot({ path: `${OUT}stripfit-390.png`, fullPage: true }); }
  await Q.ctx.close();
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
    // (CITY FIXES — THE TAP WATCH: TAPPABLE while it FADES (a tap on the still-visible button is a real tap), untappable once AT REST)
    await waitFor(O.page, "document.body.classList.contains('nd-rest')", 'at rest', 5000);
    const restPe = await ev(O.page, "getComputedStyle(document.querySelector('.rd-btn')).pointerEvents");
    ok(worst < 0.08 && endR < 0.05 && fade[0].pe !== 'none' && restPe === 'none', `THE RADIO BUTTON RESTS (${view[0]}): its opacity follows the corner buttons' through the fade (worst gap ${worst.toFixed(2)}, at rest ${endR}), tappable while fading (${fade[0].pe}), untappable at rest (${restPe})`);
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
  // (DM2: + THE DAILIES while a daily is live — the test server's DAILY_TEST opens them; production shows it once the owner's switch is on)
  ok(/^Your card · How to play · Settings · Sound effects( · The dailies)?$/.test(m.labels.join(' · ')) && m.h >= 56 && m.solid && !/rgba/.test(m.bg) && (!m.blur || m.blur === 'none'),
    `THE ☰ MENU: ${m.labels.join(' · ')} (no admin rows for a member), rows ${m.h} pt, the sheet SOLID (${m.solid}, no blur)`);
  // ---- SHELL 2.0 B1 — ‹ BACK ON EVERY NESTED SHEET (the owner, 9:15 am: ☰'s sheets had only an ×): a sheet opened FROM another shows a
  //      VISIBLE ‹ at its top-left + its parent's name small under the title; ‹ = one step back to the parent; × closes everything; Esc = the
  //      top only; a top-level sheet = the × only. One case per nested path: ☰ → SETTINGS, ☰ → HOW TO PLAY, SETTINGS → CREDITS, ☰ → YOUR CARD
  //      (a full screen — its ‹ brings the menu back)
  const vis = sel => `(() => { const s = [...document.querySelectorAll('${sel}')].filter(x => !x.classList.contains('is-out')).pop(); if (!s) return null; const b = s.querySelector('.sh-back'), r = b && b.getBoundingClientRect(), pr = s.querySelector('.sh-panel').getBoundingClientRect();
    return { back: !!(b && !b.hidden && r.width >= 40 && getComputedStyle(b).display !== 'none' && r.left - pr.left < 60), kick: (s.querySelector('.sh-t small') || {}).textContent || '', x: !!s.querySelector('.sh-x') }; })()`;
  const live = () => ev(p, "[...document.querySelectorAll('.sh:not(.is-out)')].map(x => x.className)");
  const top0 = await ev(p, vis('.sh.gm'));
  const nest = [];
  for (const [row, sel, name] of [['.gm-settings', '.sh.settings', 'SETTINGS'], ['.gm-help', '.help-sheet', 'HOW TO PLAY']]) {
    await ev(p, `document.querySelector('.gm ${row}').click()`);
    await waitFor(p, `!!document.querySelector('${sel}.is-in')`, name, 6000); await sleep(400);
    const v = await ev(p, vis(sel)), open1 = await live();
    await ev(p, `[...document.querySelectorAll('${sel} .sh-back')].pop().click()`); await sleep(450);
    const after = await live();
    nest.push({ name, ...v, under: open1.length === 2 && /\bgm\b/.test(open1[0]), backTo: after.length === 1 && /\bgm\b/.test(after[0]) });
  }
  // SETTINGS → CREDITS (a sheet two deep): ‹ → SETTINGS; Esc = the top only; then × closes all
  await ev(p, "document.querySelector('.gm .gm-settings').click()"); await waitFor(p, "!!document.querySelector('.sh.settings.is-in')", 'SETTINGS', 6000); await sleep(350);
  const credits = "[...document.querySelectorAll('.sh.settings .sh-row')].find(r => /Credits/.test(r.textContent)).click()";
  await ev(p, credits);
  await waitFor(p, "!!document.querySelector('.cr-sheet.is-in')", 'CREDITS', 6000); await sleep(400);
  const cr = await ev(p, vis('.cr-sheet'));
  await ev(p, "document.querySelector('.cr-sheet .sh-back').click()"); await sleep(450);
  const crBack = await live();
  await ev(p, credits);
  await waitFor(p, "!!document.querySelector('.cr-sheet.is-in')", 'CREDITS again', 6000); await sleep(350);
  await p.keyboard.press('Escape'); await sleep(450);
  const esc = await live();
  await ev(p, "[...document.querySelectorAll('.sh:not(.is-out) .sh-x')].pop().click()"); await sleep(500);
  const xAll = await live();
  nest.push({ name: 'CREDITS (on SETTINGS)', ...cr, under: true, backTo: crBack.length === 2 && /settings/.test(crBack[1]) });
  // ☰ → YOUR CARD (the membership card, a full screen): the menu steps aside; the card's ‹ BACK brings the menu back on top
  await ev(p, "document.querySelector('.menu-btn').click()"); await waitFor(p, "!!document.querySelector('.gm.is-in .sh-row')", 'the menu again', 6000); await sleep(350);
  await ev(p, "document.querySelector('.gm .gm-card').click()");
  const card = await waitFor(p, "!!document.querySelector('.vl-dp-go, .pf-back, .screen-profile')", 'YOUR CARD', 12000).then(() => true, () => false);
  await sleep(600);
  await ev(p, "(() => { const b = document.querySelector('.pf-back') || [...document.querySelectorAll('.screen button')].find(x => /back/i.test(x.getAttribute('aria-label') || x.textContent)); if (b) b.click(); })()");
  const cardBack = await waitFor(p, "!!document.querySelector('.gm.is-in .sh-row')", 'the menu back after YOUR CARD', 8000).then(() => true, () => false);
  await ev(p, "(() => { const x = document.querySelector('.gm .sh-x'); if (x) x.click(); })()"); await sleep(450);
  ok(!top0.back && top0.x && nest.every(n => n.back && n.x && n.under && n.backTo && n.kick) && esc.length === 2 && /settings/.test(esc[1] || '') && !xAll.length && card && cardBack,
    `‹ BACK ON EVERY NESTED SHEET: the menu (top level) × only (‹ ${top0.back}); ${nest.map(n => `${n.name}: ‹ ${n.back} "${n.kick}" on the parent ${n.under} → ‹ back ${n.backTo}`).join(' · ')}; Esc on CREDITS → SETTINGS stays (${esc.length} open); × closes all (${xAll.length} left); ☰ → YOUR CARD (${card}) → its ‹ → the menu again (${cardBack})`);
  // ---- SHELL 2.0 B1 — COLOUR-BLIND (the dailies chat): ☰ → SETTINGS → "Colour-blind colours" → body[data-cb]: --good BLUE + --close ORANGE
  await ev(p, "document.querySelector('.menu-btn').click()"); await waitFor(p, "!!document.querySelector('.gm.is-in .sh-row')", 'the menu (colour-blind)', 6000);
  await ev(p, "document.querySelector('.gm .gm-settings').click()"); await waitFor(p, "!!document.querySelector('.sh.settings.is-in')", 'SETTINGS (colour-blind)', 6000); await sleep(350);
  const tok = () => ev(p, "({ cb: document.body.dataset.cb || '', good: getComputedStyle(document.body).getPropertyValue('--good').trim(), close: getComputedStyle(document.body).getPropertyValue('--close').trim() })");
  const cb0 = await tok();
  const hasRow = await ev(p, "(() => { const r = [...document.querySelectorAll('.sh.settings .sh-row')].find(x => /Colour-blind colours/.test(x.textContent)); if (!r) return false; r.click(); return true; })()");
  await sleep(300);
  const cb1 = await tok(), kept = await ev(p, "JSON.parse(localStorage.getItem('na:settings') || localStorage.getItem('settings') || '{}').colorBlind ?? null").catch(() => null);
  await ev(p, "[...document.querySelectorAll('.sh.settings .sh-row')].find(x => /Colour-blind colours/.test(x.textContent)).click()"); await sleep(250);
  const cb2 = await tok();
  await ev(p, "[...document.querySelectorAll('.sh:not(.is-out) .sh-x')].pop().click()"); await sleep(450);
  ok(hasRow && !cb0.cb && cb0.good === '#3dff8b' && cb1.cb === '1' && cb1.good === '#3ea6ff' && cb1.close === '#ff8f2e' && !cb2.cb && cb2.good === '#3dff8b',
    `COLOUR-BLIND: the SETTINGS row → body[data-cb] — right ${cb0.good} → ${cb1.good}, close ${cb0.close} → ${cb1.close}; off again → ${cb2.good} (saved: ${kept})`);
  // ---- ONE MESSAGE at a time, above the dock, never on the sign
  await ev(p, "import('/js/ui/toast.js').then(m => { m.toast('FIRST', 'info', 5000); m.toast('Host left — you’re the host now', 'warn', { ms: 5000, sub: 'Your friends are still in the room.' }); return 1; })");
  await sleep(500);
  const ms = await ev(p, `(() => { const on = [...document.querySelectorAll('.sh-msg:not(.is-out)')], r = on[0] && on[0].getBoundingClientRect(), d = document.querySelector('.nd-actions').getBoundingClientRect(), sign = document.querySelector('.nd-logo, .nd-sign, .nd-neon');
    const s = sign ? sign.getBoundingClientRect() : { bottom: 0 }; return { n: on.length, t: on[0] && on[0].querySelector('.sh-msg-t').textContent, above: r && r.bottom <= d.top + 1, clear: r && r.top >= s.bottom, tube: on[0] && getComputedStyle(on[0].querySelector('.sh-msg-tube')).width, x: on[0] && on[0].querySelector('.sh-msg-x').getBoundingClientRect().height }; })()`);
  ok(ms.n === 1 && /you’re the host now/i.test(ms.t) && ms.above && ms.clear && ms.x >= 44, `ONE MESSAGE: "${ms.t}" — one at a time (${ms.n}), above the dock (${ms.above}), clear of the sign (${ms.clear}), its tube ${ms.tube}, × ${ms.x} pt`);
  // ---- the dock's labels
  const lb = await ev(p, "[...document.querySelectorAll('.nd-actions .nd-tab:not([hidden]) .rdk-lbl')].map(x => x.textContent).join(' · ')");
  // (DM2: DAILY leads the pill while a daily is live — the test server's DAILY_TEST; hidden otherwise)
  ok(lb === 'BOARD · GAMES · YOU' || lb === 'DAILY · BOARD · GAMES · YOU', `THE TITLE DOCK's LABELS: ${lb}`);
  if (SHOTS) await p.screenshot({ path: `${OUT}shell-message-390.png` });
  await Q.ctx.close();
  // ---- THE PODIUM's FRAME (the results preview: no Firebase): BACK TO THE ROOM in view without scrolling at 390 — HOLD'EM IN THE CITY B3: the
  //      frame's LAST piece (below the XP box, after the board), in a row STICKY at the screen's foot
  const { launch } = await import('./kit.mjs');
  const ctx = await (await launch()).createBrowserContext(), q = await ctx.newPage();
  await q.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await q.goto(`${BASE}/tests/integration/results-preview.html?case=pb&n=5`);   // (FRIENDS B — B4: 5 players, the list from 4th)
  await waitFor(q, "!!document.querySelector('.final .final-back')", 'the podium', 15000);
  for (let i = 0; i < 6 && await ev(q, "!!document.querySelector('.pg-moment')"); i++) { await ev(q, "(() => { const b = document.querySelector('.pg-moment .pg-btn'); if (b) b.click(); })()"); await sleep(700); }
  await sleep(600);
  const pd = await ev(q, `(() => { const b = document.querySelector('.final-back'), x = document.querySelector('.final .rc-slot'), r = b.getBoundingClientRect(), xr = x ? x.getBoundingClientRect() : null, lb = document.querySelector('.final .board-list');
    return { inView: r.bottom <= innerHeight && r.top >= 0, under: !!(xr && r.top >= xr.bottom - 1), afterBoard: !!(lb && (b.compareDocumentPosition(lb) & 2)), sticky: getComputedStyle(b.parentElement).position === 'sticky', main: b.classList.contains('btn-primary'), n: document.querySelectorAll('.final button.btn').length, h: Math.round(r.height), top: Math.round(r.top) }; })()`);
  ok(pd.inView && pd.under && pd.afterBoard && pd.sticky && pd.main && pd.h >= 54, `THE PODIUM's FRAME (390): BACK TO THE ROOM — the tube main (${pd.main}) at ${pd.top} pt, below the XP box (${pd.under}), in view (${pd.inView}), after the board (${pd.afterBoard}), sticky at the foot (${pd.sticky}); ${pd.n} tube(s) on the podium`);
  // ---- THE ADD-ON: the results rows = the players' SLIM CARDS (the winner's on top), on ONE shared effect surface
  const sb = await ev(q, `(() => { const l = document.querySelector('.final .board-list'), rows = [...l.querySelectorAll('.lb-row')];
    return { strips: l.classList.contains('is-strips'), n: rows.filter(r => r.querySelector('.vl-strip')).length, rows: rows.length, first: (rows[0].querySelector('.vl-name') || {}).textContent, rank: rows[0].querySelector('.lb-rank').textContent,
      score: !!rows[0].querySelector('.lb-sub .lb-score'), canvases: l.querySelectorAll('canvas').length }; })()`);
  ok(sb.strips && sb.n === sb.rows && sb.rows === 2 && /MAXIMILIANOS/.test(sb.first) && sb.rank === '04' && sb.score && sb.canvases <= 1, `THE RESULTS ROWS = SLIM CARDS: ${sb.n}/${sb.rows} strips — B4: the podium shows 1st–3rd, the list starts at 4th ("${sb.first}" ${sb.rank}), the score in the line under the card, ${sb.canvases} shared canvas`);
  if (SHOTS) await q.screenshot({ path: `${OUT}shell-podium-390.png` });
  await ctx.close();
  // ---- THE XP BOX FITS (the owner: "LEVEL 1451 XP"): its pieces never collide; FRIENDS B: the WHOLE box is the button to your card (no YOUR
  //      CARD tube), the reason line WRAPS (never cut) — a 2-digit level, a 2-digit + 3-digit
  //      pair (LEGEND · LEVEL 99 → 662 XP TO 100) and the longest band name (NEWCOMER) at 390 / 402 / 430
  const fits = [];
  for (const [w, hh] of [[390, 844], [402, 874], [430, 932]]) for (const xpq of ['', '&xp=44300,44338', '&xp=0,20']) {
    const c2 = await (await launch()).createBrowserContext(), r2 = await c2.newPage();
    await r2.setViewport({ width: w, height: hh, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await r2.goto(`${BASE}/tests/integration/results-preview.html?case=pb${xpq}`);
    await waitFor(r2, "!!document.querySelector('.final .rc-xp .rc-xp-chev')", 'the XP box', 15000).catch(() => {});
    await sleep(500);
    fits.push(await ev(r2, `(() => { const box = document.querySelector('.final .rc-xp'); if (!box) return { ok: false, why: 'no box' };
      const parts = [...box.querySelectorAll('.rc-xp-step, .rc-xp-need, .rc-xp-chev, .rc-xp-top')].map(e => ({ t: e.textContent, r: e.getBoundingClientRect() }));
      const hit = (a, b) => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
      const clash = []; for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) if (parts[i].t && parts[j].t && hit(parts[i].r, parts[j].r)) clash.push(parts[i].t + ' × ' + parts[j].t);
      const pr = box.querySelector('.rc-xp-parts'), lines = pr && pr.scrollWidth <= pr.clientWidth + 1 && getComputedStyle(pr).textOverflow !== 'ellipsis' ? 1 : 0;
      const btn = box.tagName === 'BUTTON' && !box.querySelector('.rc-xp-card');
      const inBox = parts.every(p => p.r.right <= box.getBoundingClientRect().right + 0.5);
      return { ok: !clash.length && lines === 1 && inBox && btn, w: innerWidth, lv: (box.querySelector('.rc-xp-step') || {}).textContent, clash, lines, inBox }; })()`));
    await c2.close();
  }
  ok(fits.every(f => f.ok), `THE XP BOX FITS at 390 / 402 / 430 (${fits.map(f => `${f.w}: ${f.lv}${f.ok ? '' : ` ✗ ${f.clash.join(' · ')} lines ${f.lines} in ${f.inBox}`}`).join(' | ')}) — nothing collides, the whole box a button (no YOUR CARD tube), the reasons whole`);
});
