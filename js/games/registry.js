// Playable game modules by id. Each module exports:
//   start({ code, matchId, settings, participants, now }) -> Promise<game | null>
//   prepare(game, { code, host }) -> idempotent; preload assets / top up trivia (called every host tick)
//   step(game, { code, now, live, online }) -> pure director step: patch | { lobby: true } | null
//   livePaths(game)          -> { name: 'path/under/room' } player-written data to mirror into state.live
//   createView()             -> { mount(el, state), update(state), unmount() }
//   DEFAULT_SETTINGS, OPTIONS, estimateMinutes(settings)  (lobby options sheet)
//   MUSIC                    -> music track id (js/audio/music.js)
//   finalRanks(game)         -> [{ uid, rank }] for the game-night scoreboard
//   MIN_PLAYERS (optional)   -> more than the app-wide minimum (DOUBLE AGENT needs 4)
//   nightBonus(game) (opt.)  -> { uid: points } extra game-night points that aren't a placing (PRISM DROP's Call the Winner)
// A director step may include `$room: { 'path/under/room': value }` for room-level side writes.
// SHELL 2.0 B1 — THE THIN META + LAZY LOGIC (THE CONTRACT, D1 — docs/cartridge.md): the title's boot carried all twelve games' code
// (~297 KB of js/games in the static graph — scripts/boot-bytes.mjs). Now the registry imports only each PLAYABLE game's thin meta.js
// (what the console reads before a match: OPTIONS, DEFAULT_SETTINGS, estimateMinutes, MUSIC, MIN_PLAYERS / SOLO, BANNER_NAME,
// CHAT_CHIPS, chatLocked, daily.on) and loads a game's whole cartridge (index.js: start, prepare, step, livePaths, finalRanks,
// finalScene, sealed, createView …) on demand: the host's start awaits it, every phone loads it during the walk inside, a refresh
// mid-match waits for it. A HIDDEN game has no meta (it's never offered); its module still loads by id (the tests, a stale state).
//   META[id]           the thin meta (sync)            metaOf(id)   the loaded cartridge, else its meta (sync — what the console reads)
//   GAME_MODULES[id]   the LOADED cartridge or none   loadGame(id) → Promise<cartridge|null>   onGameLoaded(fn) → off()
import * as overclockMeta from './overclock/meta.js';
import * as prismMeta from './prism/meta.js';
import { state } from '../store.js';
import { unsealed } from './kit/seal.js';
import { lazyImport } from '../ui/lazy-import.js';

const LOADERS = {
  cipher: () => import('./cipher/index.js'), signal: () => import('./signal/index.js'), overclock: () => import('./overclock/index.js'),
  bluff: () => import('./bluff/index.js'), pulse: () => import('./pulse/index.js'), golf: () => import('./golf/index.js'),
  agent: () => import('./agent/index.js'), prism: () => import('./prism/index.js'), slip: () => import('./slip/index.js'),
  gridlock: () => import('./gridlock/index.js'), stakes: () => import('./stakes/index.js'), rum: () => import('./rum/index.js'),
  password: () => import('./password/index.js'),   // (PW1 — DAILY-ONLY: never playable in a room; no meta at boot — the console never offers it)
  coastclear: () => import('./coastclear/index.js'),   // (CC1 — DAILY-ONLY, like THE PASSWORD)
  holdem: () => import('./holdem/index.js'),   // (HE3 — BEING BUILT: playable false, no meta at boot — config.js `preview` starts it on a local emulator page only)
};
export const GAME_IDS = Object.freeze(Object.keys(LOADERS));
export const META = Object.freeze({ overclock: overclockMeta, prism: prismMeta });
export const GAME_MODULES = {};
const pending = {}, loadedFns = new Set();
export function loadGame(id) {
  if (GAME_MODULES[id]) return Promise.resolve(GAME_MODULES[id]);
  if (!LOADERS[id]) return Promise.resolve(null);
  return (pending[id] ||= lazyImport(LOADERS[id](), `games/${id}`).then(m => {   // (LOAD FIX 4: the skew wrapper)
    GAME_MODULES[id] = m;
    for (const fn of [...loadedFns]) { try { fn(id, m); } catch (e) { console.warn('[registry] onGameLoaded', e); } }
    return m;
  }, e => { delete pending[id]; throw e; }));
}
export const metaOf = id => GAME_MODULES[id] || META[id] || null;
export function onGameLoaded(fn) { loadedFns.add(fn); return () => loadedFns.delete(fn); }

export function livePathsFor(game) {
  const mod = game && GAME_MODULES[game.id];
  if (game && game.id && !mod && LOADERS[game.id]) loadGame(game.id).catch(() => {});   // (a refresh mid-match: the paths come once it's here — room.js listens)
  if (!mod || game.matchId == null) return null;
  const paths = { ...mod.livePaths(game) };
  // THE SEAL (kit/seal.js): your own envelope on every phone; the round's envelopes for the host once unsealed (absolute paths: '/…')
  if (mod.sealed && state.code && state.uid) {
    const host = !!(state.meta && state.meta.hostId === state.uid);
    for (const [name, path] of Object.entries(mod.sealed(game))) {
      const [node, , key] = path.split('/');
      paths[`my_${name}`] = `/seal/${state.code}/${path}/${state.uid}`;
      if (host && unsealed(game, node, key)) paths[`seal_${name}`] = `/seal/${state.code}/${path}`;
    }
  }
  return paths;
}

export function liveKeyFor(game) {
  const p = livePathsFor(game);
  return p ? `${game.id}|${JSON.stringify(p)}` : null;
}

// THE RULES-LAG (FR6 FIXES A — CLAUDE.md): player nodes NEWER than the rules as published (tests/fixtures/rules-live.json) — cleared in a write
// of their OWN, best effort: on the old rules a delete of a path they don't know is refused, and inside the atomic start / return it would
// take the whole write down (OC1: OVERCLOCK's combo marks + READY taps). They're keyed by the match, so a leftover never leaks into the next.
// Once the owner has re-published, a later pass may move them into ALL_PLAYER_NODES.
export const NEW_PLAYER_NODES = ['ocm', 'ocnext'];
// Every player-writable node any game uses; wiped when a match starts or ends.
export const ALL_PLAYER_NODES = ['boards', 'answers', 'targets', 'oc', 'lies', 'votes', 'pulse', 'golf', 'agclue', 'agready', 'agpin', 'agvote', 'agguess', 'prism', 'prismq', 'prismcall', 'slip', 'slipcall', 'glready', 'glshot', 'glres', 'glcall', 'hslock', 'rrpub'];
