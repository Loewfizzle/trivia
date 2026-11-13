// FR6 FIXES A (G6) — THE RULES-LAG, PURE: what a refused database write looks like + the path SHAPE it is reported under (js/firebase.js
// #write reports every refusal once per shape a page to /admin's errors). No ids leave the phone: a room code, a uid, a push id, a match id
// become *. docs/testing.md "THE RULES-LAG".
/** a Firebase error that is the rules saying no */
export const isRefusal = e => !!e && (e.code === 'PERMISSION_DENIED' || /permission[_ ]denied/i.test(String(e.message || e)));
/** PURE: a database path with its ids masked → rooms/(star)/meta/go (a room code, a uid, a push id, a match id: anything with a digit, any
 *  4-letter code, anything ≥ 12 chars) — the shape a refusal is reported under */
export function pathShape(path) {
  return String(path || '').replace(/^\/+|\/+$/g, '').split('/').map((seg, i, all) => (
    i > 0 && (/^[A-Z]{4}$/.test(seg) || /\d/.test(seg) || seg.length >= 12 || /^-/.test(seg) || (i === 1 && /^(rooms|chats|fleets|glsonar|spy|hsbet|rrp|seal|night|presence|players|uids|profiles)$/.test(all[0]))) ? '*' : seg)).join('/');
}
/** the room code a room / chat path is under (rooms/ABCD/… · chats/ABCD/…) — null for any other path */
export const roomOfPath = path => { const m = /^\/?(?:rooms|chats)\/([^/]+)/.exec(String(path || '')); return m ? m[1] : null; };
// THE CHAT FALSE ALARM (the owner's /admin errors, Nov 13): a room / chat write the rules refuse because this phone is NO LONGER IN THE ROOM (it
// left, was removed, the room closed — a typing ping or a send already on its way) is the leave's race, not a rules-lag. PURE: after the settle
// (firebase.js waits HOST_SETTLE_MS for the newest room state), a refused room / chat write → its QUIET label (a console line), or null = the
// alarm (/admin's errors: re-publish the rules). hostGone() = this phone lost the host moments ago; roomGone(code) = this phone isn't in that room.
export const QUIET_HOST = 'no longer the host', QUIET_ROOM = 'no longer in the room';
export function quietRoomRefusal(path, { hostGone = () => false, roomGone = () => false } = {}) {
  const code = roomOfPath(path);
  if (!code) return null;
  try { if (hostGone()) return QUIET_HOST; } catch { /* fine */ }
  try { if (roomGone(code)) return QUIET_ROOM; } catch { /* fine */ }
  return null;
}
