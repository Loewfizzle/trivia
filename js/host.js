// Host duties, run on every client:
//  - if I am host: heartbeat + run the active game's director (state machine)
//  - if I am not: watch for a dead/frozen host and claim the role
//
// Nothing here keeps game state locally — every decision is re-derived from the
// mirrored database state on each tick, so any client can take over at any time.
import { dbRef, update, runTransaction, serverTimestamp, serverNow } from './firebase.js';
import { state, isHost, onlineMap } from './store.js';
import { shouldClaimHost, isOnline } from './core/room-logic.js';
import { DIRECTOR_TICK_MS, HOST_BEAT_MS, MIN_PLAYERS } from './config.js';
import { GAME_MODULES } from './games/registry.js';
import { toast } from './ui/toast.js';

let lastBeat = 0;
let lastActive = 0;
let lastClaim = 0;
let inflight = { sig: '', at: 0 };

export function startHostLoop() {
  setInterval(tick, DIRECTOR_TICK_MS);
  // Background tabs throttle timers; run a tick as soon as we're visible again.
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') tick(); });
}

function tick() {
  if (!state.code || !state.meta || !state.connected || !state.uid) return;
  const now = serverNow();
  if (isHost()) {
    beat(now);
    if (state.meta.status === 'playing' && state.game) direct(now);
  } else if (now - lastClaim > 3000 && shouldClaimHost({ meta: state.meta, players: state.players, presence: state.presence, now, me: state.uid })) {
    lastClaim = now;
    claimHost(state.meta.hostId);
  }
}

function beat(now) {
  if (now - lastBeat < HOST_BEAT_MS) return;
  lastBeat = now;
  const patch = { hostBeat: serverTimestamp() };
  if (now - lastActive > 10 * 60_000) { lastActive = now; patch.activeAt = serverTimestamp(); }
  update(dbRef(`rooms/${state.code}/meta`), patch).catch(() => {});
}

async function claimHost(oldHost) {
  const code = state.code;
  try {
    // cur is null on the first run if the local cache is cold; proposing ourselves
    // then just makes the server hand back the real value and re-run the function.
    const res = await runTransaction(dbRef(`rooms/${code}/meta/hostId`), cur => (cur === oldHost || cur == null ? state.uid : undefined));
    if (res.committed && res.snapshot.val() === state.uid) {
      lastBeat = 0;
      await update(dbRef(`rooms/${code}/meta`), { hostBeat: serverTimestamp() });
      toast('HOST SIGNAL LOST — YOU ARE NOW THE HOST', 'warn', 3500);
    }
  } catch (e) {
    // Security rules reject the claim if the host is actually still alive. Fine.
    console.warn('claim host', e && e.message);
  }
}

function direct(now) {
  const game = state.game;
  const mod = GAME_MODULES[game.id];
  if (!mod) return;
  // Only decide with boards that belong to the current round.
  const key = `${game.matchId}/${game.round}`;
  if (state.boardsKey !== key) return;
  mod.prepare(game); // ensures word lists etc. are loading on a freshly promoted host
  const step = mod.nextStep(game, { code: state.code, now, boards: state.boards, online: onlineMap(), pickWord: mod.pickWord });
  if (!step) return;
  const sig = `${game.matchId}|${game.round}|${game.phase}`;
  if (inflight.sig === sig && now - inflight.at < 3000) return; // write already on its way
  inflight = { sig, at: now };
  if (step.lobby) { backToLobby(); return; }
  update(dbRef(`rooms/${state.code}/game`), step).catch(e => { inflight.sig = ''; console.warn('director', e); });
}

export function onlineCount() {
  return Object.keys(state.players).filter(uid => isOnline(state.presence, uid)).length;
}

export async function startGame(gameId, settings) {
  const mod = GAME_MODULES[gameId];
  if (!mod || !isHost()) return;
  const participants = {};
  for (const uid of Object.keys(state.players)) if (isOnline(state.presence, uid)) participants[uid] = true;
  if (Object.keys(participants).length < MIN_PLAYERS) { toast(`NEED ${MIN_PLAYERS}+ CONNECTED PLAYERS`, 'err'); return; }
  const matchId = Math.random().toString(36).slice(2, 8);
  const game = await mod.start({ code: state.code, matchId, settings, participants, now: serverNow() });
  if (!game) { toast('COULD NOT START — TRY AGAIN', 'err'); return; }
  inflight = { sig: '', at: 0 };
  await update(dbRef(`rooms/${state.code}`), {
    game,
    boards: null,
    'meta/status': 'playing',
    'meta/activeAt': serverTimestamp(),
    'meta/hostBeat': serverTimestamp(),
    [`meta/settings/${gameId}`]: settings,
  });
}

export async function backToLobby() {
  if (!isHost() || !state.code) return;
  await update(dbRef(`rooms/${state.code}`), {
    game: null,
    boards: null,
    'meta/status': 'lobby',
    'meta/activeAt': serverTimestamp(),
  }).catch(e => console.warn('lobby', e));
}
