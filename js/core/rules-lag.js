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
