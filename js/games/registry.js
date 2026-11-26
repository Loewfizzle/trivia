// Playable game modules by id. THE CONTRACT each module meets is js/games/contract.js (REQUIRED + OPTIONAL — FIXES R2 T2: this file used to
// carry a stale copy of it) and docs/cartridge.md (+ THE GAME FRAME the console reads, THE 3 S RULE). A director step may include
// `$room: { 'path/under/room': value }` for room-level side writes. FROZEN games (config.js#FROZEN_IDS) are never loaded (FIXES R2 — B1).
// SHELL 2.0 B1 — THE THIN META + LAZY LOGIC (THE CONTRACT, D1 — docs/cartridge.md): the title's boot carried all twelve games' code
// (~297 KB of js/games in the static graph — scripts/boot-bytes.mjs). Now the registry imports only each PLAYABLE game's thin meta.js
// (what the console reads before a match: OPTIONS, DEFAULT_SETTINGS, estimateMinutes, MUSIC, MIN_PLAYERS / SOLO, BANNER_NAME,
// CHAT_CHIPS, chatLocked, daily.on) and loads a game's whole cartridge (index.js: start, prepare, step, livePaths, finalRanks,
// finalScene, sealed, createView …) on demand: the host's start awaits it, every phone loads it during the walk inside, a refresh
// mid-match waits for it. A HIDDEN game has no meta (it's never offered); a FROZEN one never loads (FIXES R2 — B1: loadGame → null; the emulators' &frozen=1 loads it on purpose).
//   META[id]           the thin meta (sync)            metaOf(id)   the loaded cartridge, else its meta (sync — what the console reads)
//   GAME_MODULES[id]   the LOADED cartridge or none   loadGame(id) → Promise<cartridge|null>   onGameLoaded(fn) → off()
import { META as ROWS } from './metas.js';   // (CITY PART 1 — THE ONE META MODULE: every playable game's meta as a ROW in ONE boot module; a new game = a row, not a file)
import { state } from '../store.js';
import { FROZEN_IDS } from '../config.js';   // (FIXES R2 — B1: the frozen games are never loaded)
import { unsealed } from './kit/seal.js';
import { lazyImport } from '../ui/lazy-import.js';

const LOADERS = {
  cipher: () => import('./cipher/index.js'), signal: () => import('./signal/index.js'), overclock: () => import('./overclock/index.js'),
  bluff: () => import('./bluff/index.js'), pulse: () => import('./pulse/index.js'), golf: () => import('./golf/index.js'),
  agent: () => import('./agent/index.js'), prism: () => import('./prism/index.js'), slip: () => import('./slip/index.js'),
  gridlock: () => import('./gridlock/index.js'), stakes: () => import('./stakes/index.js'), rum: () => import('./rum/index.js'),
  password: () => import('./password/index.js'),   // (PW1 — DAILY-ONLY: never playable in a room; no meta at boot — the console never offers it)
  coastclear: () => import('./coastclear/index.js'),   // (CC1 — DAILY-ONLY, like THE PASSWORD)
  drop: () => import('./drop/index.js'),   // (THE DROP A — DAILY-ONLY: PRISM DROP's daily — its row ships OFF)
  holdem: () => import('./holdem/index.js'),
  jaywalk: () => import('./jaywalk/index.js'),
  highrise: () => import('./highrise/index.js'),
  freefall: () => import('./freefall/index.js'),
};
export const GAME_IDS = Object.freeze(Object.keys(LOADERS));
export const META = ROWS;
export const GAME_MODULES = {};
const pending = {}, loadedFns = new Set();
// (FIXES R2 — B1: a FROZEN game is never loaded — config.js#FROZEN_IDS; the emulators' `&frozen=1` lets a test load one on purpose)
const frozenOk = () => { try { return /[?&]emu(?:[=&]|$)/.test(location.search) && /[?&]frozen=1(?:&|$)/.test(location.search); } catch { return false; } };
const isLocal = () => { try { return /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname); } catch { return false; } };
export function loadGame(id) {
  if (GAME_MODULES[id]) return Promise.resolve(GAME_MODULES[id]);
  if (!LOADERS[id]) return Promise.resolve(null);
  if (FROZEN_IDS.includes(id) && !frozenOk()) return Promise.resolve(null);
  return (pending[id] ||= lazyImport(LOADERS[id](), `games/${id}`).then(m => {   // (LOAD FIX 4: the skew wrapper)
    GAME_MODULES[id] = m;
    // (FIXES R2 — B2 T3: on localhost the contract is checked as the cartridge loads — its gaps named in the console, never a stop)
    if (isLocal()) lazyImport(import('./contract.js'), './contract.js').then(C => { const p = C.checkCartridge(id, m); if (p.length) console.warn(`[cartridge] ${id} — the contract:`, p); }).catch(() => {});
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

const NO_TREES = Object.freeze([]);
export const liveTreesFor = game => { const mod = game && GAME_MODULES[game.id]; return (mod && mod.liveTrees) || NO_TREES; };

export function liveKeyFor(game) {
  const p = livePathsFor(game);
  return p ? `${game.id}|${JSON.stringify(p)}` : null;
}

// THE RULES-LAG (FR6 FIXES A — CLAUDE.md): player nodes NEWER than the rules as published (tests/fixtures/rules-live.json) — cleared in a write
// of their OWN, best effort: on the old rules a delete of a path they don't know is refused, and inside the atomic start / return it would
// take the whole write down (OC1: OVERCLOCK's combo marks + READY taps). They're keyed by the match, so a leftover never leaks into the next.
// Once the owner has re-published, a later pass may move them into ALL_PLAYER_NODES.
export const NEW_PLAYER_NODES = ['ocm', 'ocnext', 'jw', 'hr', 'ff'];
// (FR7 FIXES B: a play's proof — report.js#PROOF_TREES; kept at the walk back, wiped at the next start)
export const PROOF_NODE_LIST = Object.freeze(['prism', 'oc', 'ocm', 'jw', 'hr', 'ff']);
// (HIGH RISE S4B — THE LIVE LOCK: the proof trees the host may delete only once his own GO in them is 10 min old — core/room-logic.js#proofUnlocked)
export const LOCKED_PROOF_NODES = Object.freeze(['jw', 'hr', 'ff']);
// Every player-writable node any game uses; wiped when a match starts or ends.
export const ALL_PLAYER_NODES = ['boards', 'answers', 'targets', 'oc', 'lies', 'votes', 'pulse', 'golf', 'agclue', 'agready', 'agpin', 'agvote', 'agguess', 'prism', 'prismq', 'prismcall', 'slip', 'slipcall', 'glready', 'glshot', 'glres', 'glcall', 'hslock', 'rrpub'];
