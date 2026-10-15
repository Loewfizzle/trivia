// Single app state object + change notification (batched to one render per microtask).
export const state = {
  uid: null,
  connected: false,
  ready: false,           // firebase signed in

  // local navigation while not in a room: 'title' | 'setup'
  view: 'title',
  setupMode: 'host',      // 'host' | 'join'
  invite: '',             // room code from ?room=
  busy: false,

  // room mirror (null when not in a room)
  code: null,
  meta: null,
  players: {},
  presence: {},
  kicked: {},
  game: null,
  boards: {},             // boards for game.matchId / game.round
  boardsKey: null,        // `${matchId}/${round}` the boards belong to
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
