// CITY 2.0 — THE HARBOR end to end: LOBBY FIXES (Nov 4 — docs/harbor/passes/lobby-fixes.md — the owner's real-phone test of the room).
// Its own cloud job (`lobbyfix`).
//   oneseat  — ONE PROFILE, ONE SEAT + ONE ACCOUNT, ONE ROOM on THREE slots sharing one profile: the second device asked (CANCEL keeps it out,
//              MOVE HERE takes the seat + the first walks out), a third hosting another room takes it from the second
// ADDING A GROUP: G('name', …) here + the name in ../harbor-jobs.mjs (CI_JOBS.lobbyfix).
import { log, sleep, ok, open, ev, waitFor, harborUp, G, OUT, SHOTS } from './kit.mjs';
import { dbPatch, dbGet, ROOMQ, hostRoom } from './lobby2.mjs';

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
