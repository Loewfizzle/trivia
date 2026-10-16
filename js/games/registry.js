// Playable game modules by id. Each module exports:
//   start({ code, matchId, settings, participants, now }) -> Promise<game | null>
//   prepare(game, { code, host }) -> idempotent; preload assets / top up trivia (called every host tick)
//   step(game, { code, now, live, online }) -> pure director step: patch | { lobby: true } | null
//   livePaths(game)          -> { name: 'path/under/room' } player-written data to mirror into state.live
//   createView()             -> { mount(el, state), update(state), unmount() }
//   DEFAULT_SETTINGS, OPTIONS, estimateMinutes(settings)  (lobby options sheet)
//   MUSIC                    -> music track id (js/audio/music.js)
//   finalRanks(game)         -> [{ uid, rank }] for the game-night scoreboard
// A director step may include `$room: { 'path/under/room': value }` for room-level side writes.
import * as cipher from './cipher/index.js';
import * as signal from './signal/index.js';
import * as overclock from './overclock/index.js';
import * as bluff from './bluff/index.js';
import * as pulse from './pulse/index.js';

export const GAME_MODULES = { cipher, signal, overclock, bluff, pulse };

export function livePathsFor(game) {
  const mod = game && GAME_MODULES[game.id];
  return mod && game.matchId != null ? mod.livePaths(game) : null;
}

export function liveKeyFor(game) {
  const p = livePathsFor(game);
  return p ? `${game.id}|${JSON.stringify(p)}` : null;
}

// Every player-writable node any game uses; wiped when a match starts or ends.
export const ALL_PLAYER_NODES = ['boards', 'answers', 'targets', 'oc', 'lies', 'votes', 'pulse'];
