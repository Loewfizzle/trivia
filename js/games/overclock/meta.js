// OVERCLOCK — THE THIN META (SHELL 2.0 B1 — THE CONTRACT, D1: docs/cartridge.md "THE THIN META + LAZY LOGIC"). What the CONSOLE reads
// before a match — the options sheet, the GAMES list's minutes, the banner, the chat's lock, the music. PURE + tiny: no DOM, no logic, no
// challenges (registry.js imports this at boot; index.js + its logic load at the game start — games/registry.js#loadGame). logic.js and
// index.js take these from here (one source).
export const CHALLENGE_MS = 30_000;
export const READY_MS = 3_200;
export const STANDINGS_MS = 8_000;          // the round's ranking, then the race (ROUND_STAGE_MS before the end it becomes the leaderboard)
export const MODES = { quick: 6, standard: 12, marathon: 24 };
export const DEFAULT_SETTINGS = { mode: 'standard' };

export const MUSIC = 'overclock';
// THE SOLO LANE (SHELL 2.0 B1 — D3; the Overclock chat: "min 1, SOLO"): a room of one may start it (cartridge.js#minPlayersOf → 1)
export const SOLO = true;
export const BANNER_NAME = 'OVERCLOCK';

export const OPTIONS = [
  { key: 'mode', label: 'MODE', type: 'list', choices: [
    { value: 'quick', label: `QUICK · ${MODES.quick}`, sub: 'Six different challenges' },
    { value: 'standard', label: `STANDARD · ${MODES.standard}`, sub: 'Twelve different challenges' },
    { value: 'marathon', label: `MARATHON · ${MODES.marathon}`, sub: 'All twenty, plus a few repeats' },
  ] },
];

export function estimateMinutes(s) {
  const n = MODES[s.mode] || MODES.standard;
  return Math.round((n * (CHALLENGE_MS * 0.8 + READY_MS + STANDINGS_MS + 1500)) / 60000);
}

/** THE CARTRIDGE PLUG (docs/cartridge.md) — the chat's lock: locked while you're answering this challenge; done (or watching) = chat */
export function chatLocked(game, uid, live) {
  if (game.phase !== 'play') return false;
  const b = live && live.boards ? live.boards[uid] : undefined;
  return !(b && b.done);
}
