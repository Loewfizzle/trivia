// PRISM DROP — THE THIN META (SHELL 2.0 B1 — THE CONTRACT, D1: docs/cartridge.md "THE THIN META + LAZY LOGIC"). What the CONSOLE reads
// before a match — the options sheet, the GAMES list's minutes, the banner, the chat's lock, the music. PURE + tiny: no DOM, no engine, no
// songs (registry.js imports this at boot; index.js + its logic load at the game start — games/registry.js#loadGame). logic.js and
// index.js take these from here (one source).
export const MODES = ['battle', 'rush'];
export const DEFAULT_SETTINGS = { mode: 'battle' };
export const MIN_PLAYERS = 2;

export const MUSIC = null;                 // (the songs are the music)
export const BANNER_NAME = 'PRISM DROP';

export function cleanSettings(s = {}) {
  return { mode: MODES.includes(s.mode) ? s.mode : DEFAULT_SETTINGS.mode };
}

export const OPTIONS = [
  { key: 'mode', label: 'MODE', type: 'list', choices: [
    { value: 'battle', label: 'BATTLE', sub: 'Clear lines to send junk — last one standing wins' },
    { value: 'rush', label: 'SCORE RUSH', sub: 'No attacks — one song, highest score wins' },
  ] },
];

export function estimateMinutes(settings, songMinutes = 3.2) {
  return cleanSettings(settings).mode === 'rush' ? Math.round(songMinutes + 1) : 5;
}

/** THE CARTRIDGE PLUG — the chat's lock: shut while your board is in play (count + play), open once you're out or watching */
export function chatLocked(game, uid, live) {
  if (game.phase !== 'count' && game.phase !== 'play') return false;
  if (game.out && game.out[uid]) return false;
  const n = live && live.boards ? live.boards[uid] : undefined;
  return !(n && n.st === 'out');
}
