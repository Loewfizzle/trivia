// Single app state object + change notification (batched to one render per microtask).
export const state = {
  uid: null,
  connected: false,
  ready: false,           // firebase signed in

  // local navigation while not in a room: 'title' | 'setup'
  view: 'title',
  quit: null,             // a matchId this phone quit to the lobby (QUIT GAME); the next match deals it back in
  setupMode: 'host',      // 'host' | 'join' | 'edit' (profile only, back to the title)
  invite: '',             // room code from ?room=
  rejoin: '',             // a saved room we couldn't reach on boot: the title offers REJOIN
  busy: false,

  // room mirror (null when not in a room)
  code: null,
  meta: null,
  players: {},
  presence: {},
  kicked: {},
  game: null,
  live: {},               // per-game player-written data for the current step, e.g. { boards } or { answers, targets }
  liveKey: null,          // which paths `live` currently reflects (see games/registry.js liveKeyFor)
};

const listeners = new Set();
let queued = false;

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setState(patch) {
  Object.assign(state, patch);
  if (queued) return;
  queued = true;
  queueMicrotask(() => {
    queued = false;
    for (const fn of listeners) fn(state);
  });
}

export const isHost = () => !!(state.meta && state.uid && state.meta.hostId === state.uid);
export const me = () => state.players[state.uid];
export const onlineMap = () => {
  const out = {};
  for (const uid of Object.keys(state.players)) out[uid] = !!(state.presence[uid] && state.presence[uid].online);
  return out;
};
