// Host duties, run on every client:
//  - if I am host: heartbeat + run the active game's director (state machine)
//  - if I am not: watch for a dead/frozen host and claim the role
//
// Nothing here keeps game state locally — every decision is re-derived from the
// mirrored database state on each tick, so any client can take over at any time.
import { dbRef, update, remove, runTransaction, serverTimestamp, serverNow } from './firebase.js';
import { START_MS } from './core/room-show.js';
import { state, isHost, onlineMap } from './store.js';
import { shouldClaimHost, isOnline, roomIdle } from './core/room-logic.js';
import { closeIdleRoom } from './room.js';
import { DIRECTOR_TICK_MS, HOST_BEAT_MS, MIN_PLAYERS, isPlayable } from './config.js';
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
  // (PERF-A — Grok 5.4: the same player open in two tabs ran two host loops; the tab that yields (identity.js#watchDuplicateTabs) is idle)
  if (state.dupTab) return;
  if (!state.code || !state.meta || !state.connected || !state.uid) return;
  const now = serverNow();
  withChat(m => m.hostTick());
  // An hour without a game: the host closes the room (every phone gets ROOM CLOSED); everyone else leaves on
  // their own a little later in case the host's phone is asleep or the room can't be deleted.
  if (roomIdle(state.meta, now - (isHost() ? 0 : 90_000))) { closeIdleRoom(); return; }
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
  // only a running game keeps the room alive (an idle lobby closes after ROOM_IDLE_MS)
  if (state.meta.status === 'playing' && now - lastActive > 10 * 60_000) { lastActive = now; patch.activeAt = serverTimestamp(); }
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
  // (THE SEAL: an unseal is a step of its own inside a phase — the director's real step follows it at once, not 3 s later)
  const sig = `${game.matchId}|${game.phase}|${game.phaseStartAt}|${JSON.stringify(game.unseal || null)}`;
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
    const entry = { g: game.id, at: serverTimestamp(), p, n };
    // bonus points that aren't a placing (PRISM DROP's Call the Winner): added to the total, never a win
    const b = mod.nightBonus ? mod.nightBonus(finished) : null;
    if (b && Object.keys(b).length) entry.b = b;
    patch[`night/${game.matchId}`] = entry;
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
  // (WINDOWS — ONLY TWO GAMES PLAYABLE: a hidden game never starts — not from a rematch, an invite, a stale link or the console)
  if (!isPlayable(gameId)) { toast('COMING SOON', 'info'); return false; }
  const participants = {};
  for (const uid of Object.keys(state.players)) if (isOnline(state.presence, uid)) participants[uid] = true;
  const min = Math.max(MIN_PLAYERS, mod.MIN_PLAYERS || 0);
  if (Object.keys(participants).length < min) { toast(`NEED ${min}+ CONNECTED PLAYERS`, 'err'); return false; }
  const matchId = Math.random().toString(36).slice(2, 8);
  // (LOBBY 2.0 B — THE GAME START: the start's stamp goes up FIRST — every phone begins the walk inside at the host's tap, while this phone
  //  prepares the match (a question bank, a song); the game's OWN clock starts when the walk ends (START_MS later): a cartridge's start()
  //  gets the moment its match begins, never the tap — docs/cartridge.md. The stamp also ends the last match's walk-out, its REMATCH ring +
  //  every vote. A start that fails takes the stamp back down.)
  const tGo = serverNow();
  await update(dbRef(`rooms/${state.code}`), { 'meta/go': { at: serverTimestamp(), m: matchId, g: gameId }, 'meta/back': null, rv: null }).catch(e => console.warn('go', e));
  const created = await mod.start({ code: state.code, matchId, settings, participants, now: tGo + START_MS + 150 }).catch(e => { console.warn('start', e); return null; });
  if (!created) { update(dbRef(`rooms/${state.code}/meta`), { go: null }).catch(() => {}); toast('COULD NOT START — TRY AGAIN', 'err'); return false; }
  const { $room, ...game } = created;
  inflight = { sig: '', at: 0 };
  wipeSeal(state.code);
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
// (LOBBY 2.0 B — THE REMATCH RING: back in the room the match is gone (game: null) — the game it replays is meta/back's)
export function rematch() {
  const back = state.meta && state.meta.back;
  if (!isHost() || !(state.game || (back && back.g))) return Promise.resolve(false);
  const id = state.game ? state.game.id : back.g;
  const mod = GAME_MODULES[id];
  const settings = (state.meta.settings && state.meta.settings[id]) || (state.game && state.game.settings) || (mod && mod.DEFAULT_SETTINGS) || {};
  return startGame(id, settings);
}

const clearPlayerNodes = () => Object.fromEntries(ALL_PLAYER_NODES.map(n => [n, null]));
// THE SEAL's envelopes (seal/{CODE}, outside the room) go with the player nodes at a match's start + end
const wipeSeal = code => { if (code) remove(dbRef(`seal/${code}`)).catch(() => {}); };

export async function backToLobby() {
  if (!isHost() || !state.code) return;
  wipeSeal(state.code);
  const g = state.game;
  // (LOBBY 2.0 B — AFTER THE MATCH: the walk back out, THE WINNER's BANNER PLANE + the REMATCH ring all read this stamp — core/room-show.js.
  //  Written FIRST (the room still 'playing': nothing shows yet), so every phone has it when the room comes back; its own write — a room on
  //  rules not yet re-published still gets back to the lobby below, it only misses the show)
  await update(dbRef(`rooms/${state.code}`), {
    'meta/go': null,
    'meta/back': g && g.matchId ? { at: serverTimestamp(), m: g.matchId, g: g.id, rm: isPlayable(g.id) } : null,
    rv: null,
  }).catch(e => console.warn('back', e));
  await update(dbRef(`rooms/${state.code}`), {
    game: null,
    ...clearPlayerNodes(),
    'meta/status': 'lobby',
    'meta/activeAt': serverTimestamp(),
  }).catch(e => console.warn('lobby', e));
}
