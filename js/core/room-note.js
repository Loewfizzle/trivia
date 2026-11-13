// THE ROOM NOTE (the owner's add-on, Nov 13 1:38 pm — in a friend's room GULF while PRISM DROP was on, his iPhone at 390: the old two-line
// slab "PRISM DROP IS ON — TAP TO WATCH (you're dealt into the next one)" over the promenade read as a STUCK message he couldn't send away).
// PURE (no imports): what the room's one-line pill above the dock says (screens/room-city.js#paintNotes draws it):
//   · LIVE — a match on that this phone stepped out of: "<GAME> IS ON · TAP TO WATCH" + a × that hides it until the NEXT match (keyed per
//     match id, kept in localStorage — survives a refresh); the "dealt into the next one" line moved to THE MESSAGE on the watch tap, once a match;
//   · IDLE — the room closing soon: "ROOM CLOSES IN n MIN · TAP TO KEEP IT OPEN" (the host) / "· A GAME KEEPS IT OPEN" (a guest) — NO ×
//     (the host must see it).

export const NOTE_HIDE_KEY = 'nd:note-x';

/** the dismissal's key: one match of one room (a new match = a new key → the note is back) */
export const noteHideKey = (code, matchId) => (code && matchId ? `${code}:${matchId}` : '');

/** was THIS match's note sent away? stored = the key last saved (localStorage — null when unreadable) */
export const noteHidden = (stored, code, matchId) => !!stored && stored === noteHideKey(code, matchId);

/** { kind: 'live' | 'idle' | '', text, close } — s = { status, matchId, gameName, quit, left (ms until the idle close), warnMs, host,
 *  code, hidden (the stored dismissal key) } */
export function roomNote(s) {
  const o = s || {};
  const live = o.status === 'playing' && !!o.matchId && o.quit === o.matchId;
  if (live) {
    if (noteHidden(o.hidden, o.code, o.matchId)) return { kind: '', text: '', close: false };
    return { kind: 'live', text: `${String(o.gameName || 'A GAME').toUpperCase()} IS ON · TAP TO WATCH`, close: true };
  }
  const left = typeof o.left === 'number' ? o.left : Infinity;
  if (left <= (o.warnMs || 0)) {
    const m = Math.max(1, Math.ceil(left / 60000));
    return { kind: 'idle', text: o.host ? `ROOM CLOSES IN ${m} MIN · TAP TO KEEP IT OPEN` : `ROOM CLOSES IN ${m} MIN · A GAME KEEPS IT OPEN`, close: false };
  }
  return { kind: '', text: '', close: false };
}
