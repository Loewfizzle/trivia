// OVERCLOCK — THE THIN META (SHELL 2.0 B1 — THE CONTRACT, D1: docs/cartridge.md "THE THIN META + LAZY LOGIC"). What the CONSOLE reads
// before a match — the options sheet, the GAMES list's minutes, the banner, the chat's lock, the music, the look. PURE + tiny: no DOM, no
// logic, no challenges (registry.js imports this at boot; index.js + its logic load at the game start — games/registry.js#loadGame). logic.js
// and index.js take these from here (one source). THE TIMINGS ARE THE OWNER's (Nov 4: "I was barely keeping up as it was") — never change
// them; tests/overclock-oc1.test.mjs pins every one.
export const CHALLENGE_MS = 30_000;
export const READY_MS = 3_200;
export const STANDINGS_MS = 8_000;          // the round's ranking, then the race (ROUND_STAGE_MS before the end it becomes the leaderboard)
export const MODES = { quick: 6, standard: 12, marathon: 24 };
// OC1 (docs/overclock.md — "DEFAULT MODE = QUICK"): six challenges, ~4 min; Standard + Marathon stay for big nights
export const DEFAULT_SETTINGS = { mode: 'quick' };

// MUSIC BY MOOD (docs/cartridge.md): the EVENING radio station on the server clock — every phone the same song (the owner, Nov 1: a random
// evening track each match until OVERCLOCK has its own night tracks; audio/music/overclock.mp3 stays in the repo, unused)
export const MUSIC = 'mood:evening';
// THE SOLO LANE (SHELL 2.0 B1 — D3; the Overclock chat: "min 1, SOLO"): a room of one may start it (cartridge.js#minPlayersOf → 1)
export const SOLO = true;
export const BANNER_NAME = 'OVERCLOCK';
// THE LOOKS (OC1 — docs/cartridge.md "LOOKS"): OVERCLOCK plays at NIGHT only (the OVERDRIVE skin) — the console paints night whatever the
// phone's GAME LOOK says + shows the setting LOCKED while it's on screen. A DAY skin later = ['day', 'night'] and the setting comes back.
export const LOOKS = ['night'];

export const OPTIONS = [
  { key: 'mode', label: 'MODE', type: 'list', choices: [
    { value: 'quick', label: `QUICK · ${MODES.quick}`, sub: 'Six different challenges · about 4 min' },
    { value: 'standard', label: `STANDARD · ${MODES.standard}`, sub: 'Twelve different challenges' },
    { value: 'marathon', label: `MARATHON · ${MODES.marathon}`, sub: 'Every challenge, plus a few repeats' },
  ] },
];

export function estimateMinutes(s) {
  const n = MODES[s.mode] || MODES.quick;
  return Math.round((n * (CHALLENGE_MS * 0.8 + READY_MS + STANDINGS_MS + 1500)) / 60000);
}

/** THE CARTRIDGE PLUG (docs/cartridge.md) — the chat's lock. NO CHAT DURING OVERCLOCK (the owner, Nov 5 — too fast-paced): shut for a
 *  participant the WHOLE match (every phase until the podium); the console checks "a participant" first. The room's chat is open between
 *  games. No CHAT_CHIPS. */
export function chatLocked(game) {
  return !!game && game.phase !== 'final';
}
