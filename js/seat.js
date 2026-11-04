// LOBBY FIXES — ONE ACCOUNT, ONE ROOM (the owner, Nov 4 2:17 pm: his phone + his laptop on one account sat in one room twice; "XP farming,
// confused stats"). A profile (pid) holds ONE SEAT in ONE live room at a time:
//   seats/{pid} : { code, uid, at }   written by the profile's own devices only (the rules: uids/{auth.uid} === $pid; uid = the writer)
// Before HOST / JOIN / a resume, this device looks at its profile's seat: held by ANOTHER device in a room where that device still has a
// player node → "You're already in room XXXX on another device" · MOVE HERE (this device takes the seat — the other one sees the seat go and
// walks out of its room) · CANCEL. The rules refuse a players/{uid} node carrying the pid while the seat is someone else's; the SERVER never
// credits two overlapping matches for one profile (js/core/progress.js#overlaps) nor one match twice (api/report.js#dedupePids) — the hard
// line, whatever a modified client does. Polish like profiles: no profile, /api down or the rules not yet re-published = no check at all
// (every read + write here is caught — joining never depends on it).
import { dbRef, get, set, onValue, runTransaction, serverTimestamp } from './firebase.js';
import { state } from './store.js';
import { loadMe } from './identity.js';

/** this device's profile id (only when its link is for this slot's uid) */
export const myPid = () => { const m = loadMe(); return m && m.uid === state.uid && m.pid ? m.pid : null; };

/**
 * The seat held by ANOTHER device, still live → { code, uid, same } (same = the room this device is joining); else null.
 * (a seat whose room or player node is gone is stale — taken over without asking)
 */
export async function seatConflict(code = null) {
  const pid = myPid();
  if (!pid || !state.uid) return null;
  let seat = null;
  try { seat = (await get(dbRef(`seats/${pid}`))).val(); } catch { return null; }   // (the rules not yet re-published: no check)
  if (!seat || !seat.code || !seat.uid || seat.uid === state.uid) return null;
  let live = false;
  try { live = (await get(dbRef(`rooms/${seat.code}/players/${seat.uid}`))).exists(); } catch { live = false; }
  return live ? { code: seat.code, uid: seat.uid, same: !!code && seat.code === code } : null;
}

/** takes the seat for this device in `code` (best effort) */
export async function takeSeat(code) {
  const pid = myPid();
  if (!pid || !code) return false;
  try { await set(dbRef(`seats/${pid}`), { code, uid: state.uid, at: serverTimestamp() }); return true; } catch { return false; }
}

/** gives the seat back (only while it's still this device's) — leaving a room */
export async function freeSeat(code = null) {
  const pid = myPid();
  if (!pid) return;
  try { await runTransaction(dbRef(`seats/${pid}`), cur => (cur && cur.uid === state.uid && (!code || cur.code === code) ? null : undefined), { applyLocally: false }); } catch { /* fine */ }
}

/** while in a room: calls onMoved({ code, here, uid }) when another device of this profile takes the seat. → unsubscribe */
export function watchSeat(code, onMoved) {
  const pid = myPid();
  if (!pid) return () => {};
  let fired = false, mine = false;
  try {
    return onValue(dbRef(`seats/${pid}`), s => {
      const v = s.val();
      if (v && v.uid === state.uid) { mine = true; return; }
      // (only a seat this device HELD and then lost: a stale seat it never got — a failed write — is never a reason to walk out)
      if (fired || !mine || !v || !v.uid) return;
      fired = true;
      onMoved({ code: v.code, here: v.code === code, uid: v.uid });
    }, () => { /* the old rules: nothing to watch */ });
  } catch { return () => {}; }
}

/** THE QUESTION: "You're already in room XXXX on another device" · MOVE HERE · CANCEL → true (move) | false */
export async function askMoveHere(conflict) {
  const [{ openPfSheet }, { h }] = await Promise.all([import('./profile/sheets.js'), import('./ui/dom.js')]);
  return new Promise(resolve => {
    let answer = false;
    const done = v => { answer = v; s.close(); };
    const move = h('button.btn.btn-primary.btn-block.st-move', { type: 'button', 'data-act': 'move', onclick: () => done(true) }, 'MOVE HERE');
    const cancel = h('button.btn.btn-text.btn-block.st-cancel', { type: 'button', 'data-act': 'cancel', onclick: () => done(false) }, 'CANCEL');
    const s = openPfSheet({ kicker: 'ONE CARD, ONE SEAT', title: conflict.same ? 'ALREADY IN THIS ROOM' : `YOU’RE IN ${conflict.code}`, cls: 'st-sheet',
      body: [h('p.st-line', conflict.same ? 'You’re already in this room on another device.' : `You’re already in room ${conflict.code} on another device.`),
        h('p.pfs-note', 'MOVE HERE takes your seat on this device — the other one walks out of the room.'), move, cancel],
      onClose: () => resolve(answer) });
  });
}

/**
 * The check before a seat is taken (HOST / JOIN): no conflict → takes the seat; a conflict → asks; MOVE HERE → takes it; CANCEL →
 * throws "Staying in room XXXX on your other device." (the title shows it). `code` null = a room not yet made (HOST).
 */
export async function claimSeatFor(code, { ask = askMoveHere } = {}) {
  const c = await seatConflict(code);
  if (c && !(await ask(c))) { const e = new Error(`Staying in room ${c.code} on your other device.`); e.seat = true; throw e; }
  return c;
}
