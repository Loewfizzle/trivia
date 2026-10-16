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
import { GAME_MODULES, liveKeyFor, ALL_PLAYER_NODES } from './games/registry.js';
import { toast } from './ui/toast.js';

let lastBeat = 0;
let lastActive = 0;
let lastClaim = 0;
let inflight = { sig: '', at: 0 };
// room chat (system lines, pruning) loads lazily the first time we're in a room
let chatMod = null;
let chatLoading = false;
const withChat = fn => {
  if (chatMod) return fn(chatMod);
  if (!chatLoading) { chatLoading = true; import('./chat/chat.js').then(m => { chatMod = m; }).catch(() => { chatLoading = false; }); }
  return undefined;
};

export function startHostLoop() {
  setInterval(tick, DIRECTOR_TICK_MS);
  // Background tabs throttle timers; run a tick as soon as we're visible again.
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') tick(); });
}

function tick() {
  if (!state.code || !state.meta || !state.connected || !state.uid) return;
  const now = serverNow();
  withChat(m => m.hostTick());
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
  // Only decide with player data that belongs to the current step.
  if (state.liveKey !== liveKeyFor(game)) return;
  mod.prepare(game, { code: state.code, host: true }); // e.g. word lists / trivia top-ups on a freshly promoted host
  const step = mod.step(game, { code: state.code, now, live: state.live, online: onlineMap() });
  if (!step) return;
  const sig = `${game.matchId}|${game.phase}|${game.phaseStartAt}`;
  if (inflight.sig === sig && now - inflight.at < 3000) return; // write already on its way
  inflight = { sig, at: now };
  if (step.lobby) { backToLobby(); return; }
  update(dbRef(`rooms/${state.code}`), roomPatch(game, step)).catch(e => { inflight.sig = ''; console.warn('director', e); });
}

// Points toward the room's game-night leaderboard for finishing 1st / 2nd / 3rd.
export const NIGHT_POINTS = { 1: 3, 2: 2, 3: 1 };

// Turns a director step into one atomic room update: game/* paths, optional room-level
// side writes ($room), and the night-scoreboard entry when a match reaches its podium.
function roomPatch(game, step) {
  const { $room, ...gamePatch } = step;
  const patch = {};
  for (const [k, v] of Object.entries(gamePatch)) patch[`game/${k}`] = v;
  Object.assign(patch, $room || {});
  const mod = GAME_MODULES[game.id];
  if (gamePatch.phase === 'final' && mod && mod.finalRanks) {
    const finished = applyPatch(structuredClone(game), gamePatch);
    const p = {};
    const n = {};
    for (const r of mod.finalRanks(finished)) {
      p[r.uid] = NIGHT_POINTS[r.rank] || 0;
      n[r.uid] = (state.players[r.uid] && state.players[r.uid].name) || 'GHOST';
    }
    patch[`night/${game.matchId}`] = { g: game.id, at: serverTimestamp(), p, n };
  }
  return patch;
}

function applyPatch(obj, patch) {
  for (const [k, v] of Object.entries(patch)) {
    const parts = k.split('/');
    let o = obj;
    for (const part of parts.slice(0, -1)) o = (o[part] ??= {});
    if (v === null) delete o[parts.at(-1)]; else o[parts.at(-1)] = v;
  }
  return obj;
}

export function onlineCount() {
  return Object.keys(state.players).filter(uid => isOnline(state.presence, uid)).length;
}

// Resolves true once the match is written; false (after a toast) when it can't start.
export async function startGame(gameId, settings) {
  const mod = GAME_MODULES[gameId];
  if (!mod || !isHost()) return false;
  const participants = {};
  for (const uid of Object.keys(state.players)) if (isOnline(state.presence, uid)) participants[uid] = true;
  if (Object.keys(participants).length < MIN_PLAYERS) { toast(`NEED ${MIN_PLAYERS}+ CONNECTED PLAYERS`, 'err'); return false; }
  const matchId = Math.random().toString(36).slice(2, 8);
  const created = await mod.start({ code: state.code, matchId, settings, participants, now: serverNow() });
  if (!created) { toast('COULD NOT START — TRY AGAIN', 'err'); return false; }
  const { $room, ...game } = created;
  inflight = { sig: '', at: 0 };
  await update(dbRef(`rooms/${state.code}`), {
    game,
    ...($room || {}),
    ...clearPlayerNodes(),
    'meta/status': 'playing',
    'meta/activeAt': serverTimestamp(),
    'meta/hostBeat': serverTimestamp(),
    [`meta/settings/${gameId}`]: settings,
  });
  withChat(m => m.announceStart(gameId, matchId));
  return true;
}

// Same game, same settings, everyone currently connected (late joiners included).
export function rematch() {
  if (!isHost() || !state.game) return Promise.resolve(false);
  const id = state.game.id;
  const mod = GAME_MODULES[id];
  const settings = (state.meta.settings && state.meta.settings[id]) || state.game.settings || (mod && mod.DEFAULT_SETTINGS) || {};
  return startGame(id, settings);
}

const clearPlayerNodes = () => Object.fromEntries(ALL_PLAYER_NODES.map(n => [n, null]));

export async function backToLobby() {
  if (!isHost() || !state.code) return;
  await update(dbRef(`rooms/${state.code}`), {
    game: null,
    ...clearPlayerNodes(),
    'meta/status': 'lobby',
    'meta/activeAt': serverTimestamp(),
  }).catch(e => console.warn('lobby', e));
}
