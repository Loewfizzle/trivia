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
/** the share line's day number (CC2): COAST CLEAR #n = days since this epoch + 1 — THE PASSWORD's epoch (PW_EPOCH); both move together at THE SWITCH-OVER */
export const CC_EPOCH = 'd20261101';

export const DEFAULT_SETTINGS = {};
export const OPTIONS = [];
export const estimateMinutes = () => 3;

// a quiet solo run on the EVENING station, like THE PASSWORD's night (CC2: the music follows the look — index.js#musicFor: the day deck by day)
export const MUSIC = 'mood:evening';
export const SOLO = true;
export const MIN_PLAYERS = 1;
export const BANNER_NAME = 'COAST CLEAR';
/** DM2 — THE DAILY SCREEN's line for a score (spoiler-free — nothing about the board): a clear = its time (m:ss, spots + pauses in), CAUGHT */
export const scoreLine = s => (s >= 10000 ? 'CAUGHT' : `${Math.floor(s / 60)}:${String(Math.floor(s) % 60).padStart(2, '0')}`);
/** DFIX5 — THE SPOT ICONS beside a result (SCORES, the TODAY ticket): ONE drawn searchlight per spot on a CLEAR (0–2 — a 3rd spot is CAUGHT:
 *  no icons); the count is the SERVER's (the run's extra { sp } from its record). The time already holds the +30 s a spot — the icons explain it. */
export const resultMarks = (score, extra) => (score < 10000 && extra && extra.sp > 0 ? Math.min(MAX_SPOTS - 1, Math.floor(extra.sp)) : 0);
/** the searchlight (the game's status-row lamp — view.js draws the same path): a lamp on a stand, its cone to the upper right */
export const LAMP_SVG = '<path class="cc-sl-beam" d="M13.5 9.5 L31 1.5 L31 14.5 L14.5 13.5 Z"/><circle class="cc-sl-head" cx="10" cy="11.5" r="4.6"/><circle class="cc-sl-lens" cx="11.4" cy="11.2" r="2"/><path class="cc-sl-stand" d="M10 16 V21 M6.5 21.5 H13.5"/>';
export const RESULT_MARK = Object.freeze({ box: '0 0 32 24', svg: LAMP_SVG, label: n => (n === 1 ? '1 spot' : `${n} spots`) });
/** CC2 — BOTH LOOKS: the night harbor (neon) + the sunny harbor (THE PASSWORD's C1 clear morning sky); the Settings look switches it LIVE */
export const LOOKS = ['day', 'night'];

/** a solo daily: the chat is never locked */
export function chatLocked() {
  return false;
}
