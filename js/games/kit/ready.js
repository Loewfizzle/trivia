// THE READY HELPER (SHELL 2.0 B1 — THE CONTRACT; the Overclock chat's ask b, Nov 5): "everyone tapped" for a game's ready / next screen.
// PURE (a director calls it — host migration replays it the same): ONLY CONNECTED players count, a MIN TIME holds the screen even if
// everyone taps at once, a DROPPED player never blocks (they stop counting the moment they're offline), an optional MAX TIME moves on
// anyway, and a match where nobody is connected waits out the min time and goes. Never Date.now(): `now` + `since` are the server clock.
//   readyState({ taps, players, online, since, now, minMs, maxMs }) → { ready, n, of, waiting: [uid], why }
//     taps     { uid: at | true }      the player-written taps (live data — check liveKey first)
//     players  [uid] | { uid: any }    who is in this match (the participants)
//     online   (uid) → bool | { uid: bool }   connected now (core/room-logic.js#presenceOnline per uid)
//     since    the screen's start (server ms)    minMs  the least it shows (default 1500)    maxMs  the most (default none)
export function readyState({ taps = {}, players = [], online = () => true, since = 0, now = 0, minMs = 1500, maxMs = null } = {}) {
  const ids = Array.isArray(players) ? players : Object.keys(players || {});
  const on = typeof online === 'function' ? online : uid => !!(online && online[uid]);
  const live = ids.filter(uid => on(uid));
  const done = live.filter(uid => taps && taps[uid] != null && taps[uid] !== false);
  const waiting = live.filter(uid => !done.includes(uid));
  const age = now - since;
  const held = age < minMs;
  let ready = false, why = 'waiting';
  if (maxMs != null && age >= maxMs) { ready = true; why = 'time'; }
  else if (!held && !waiting.length) { ready = true; why = live.length ? 'all' : 'nobody'; }
  else if (held) why = waiting.length ? 'waiting' : 'min';
  return { ready, n: done.length, of: live.length, waiting, why };
}
