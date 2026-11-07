// COAST CLEAR — THE THIN META (CC1 — docs/coastclear.md; docs/cartridge.md D1): what the console reads before a match. PURE + tiny, no imports.
// A DAILY-ONLY solo Minesweeper-type (the owner, Nov 7 — docs/games/plan.md CC1): slip a small boat across the night harbor past the hidden
// patrol SEARCHLIGHTS; the buoys mark where you think one is. The server keeps the board and answers every dig. No practice, archive or
// multiplayer mode — a DAILIES row, never GAMES; THE DAILY MODULE (later) opens it once a day.
export const W = 9;                 // the board: 9 wide …
export const H = 12;                // … 12 tall (the owner's fallback, if taps prove cramped: 8 × 11 at 42 pt)
export const LIGHTS = 18;           // the hidden searchlights
export const SPOT_S = 30;           // SPOTTED: +30 s on the clock, the run goes on
export const PAUSE_S = 15;          // a pause (the room started a game mid-run): the clock stops + a flat 15 s
export const MAX_SPOTS = 3;         // the 3rd spot ends the run (CAUGHT)
/** the share line's day number (CC2): COAST CLEAR #n = days since this epoch + 1 — set it at THE SWITCH-OVER (a streak-day key) */
export const CC_EPOCH = 'd20261101';

export const DEFAULT_SETTINGS = {};
export const OPTIONS = [];
export const estimateMinutes = () => 3;

// a quiet solo run on the EVENING station, like THE PASSWORD's night (CC2: the day deck in the day look)
export const MUSIC = 'mood:evening';
export const SOLO = true;
export const MIN_PLAYERS = 1;
export const BANNER_NAME = 'COAST CLEAR';

/** a solo daily: the chat is never locked */
export function chatLocked() {
  return false;
}
