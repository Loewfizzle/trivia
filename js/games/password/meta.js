// THE PASSWORD — THE THIN META (PW1 — docs/password.md; docs/cartridge.md D1): what the console reads before a match. PURE + tiny, no imports.
// A DAILY-ONLY solo Wordle-type (the owner, Nov 7 — docs/games/plan.md): two doors in a row, each a 5-letter word, 6 guesses each; the server
// judges every guess. No practice, archive or multiplayer mode — `playable: false` in GAMES; THE DAILY MODULE (later) opens it once a day.
export const WORD_LEN = 5;
export const DOORS = 2;
export const GUESSES = 6;
export const DOOR_NAMES = ['THE FRONT DOOR', 'THE BACK ROOM'];   // (PW2: the first door is THE FRONT DOOR — was "THE DOOR")
/** THE SHARE LINE's day number: THE PASSWORD #n = days since this epoch + 1 (PW2 — set it at THE SWITCH-OVER to the first live day; a streak-day key) */
export const PW_EPOCH = 'd20261101';

export const DEFAULT_SETTINGS = {};
export const OPTIONS = [];
export const estimateMinutes = () => 4;

// a quiet solo run: the EVENING station, like OVERCLOCK (the console keeps the one mute)
export const MUSIC = 'mood:evening';
export const SOLO = true;
export const MIN_PLAYERS = 1;
export const BANNER_NAME = 'THE PASSWORD';
/** DM2 — THE DAILY SCREEN's line for a score (TODAY's DONE row, YOUR TABLE, SHARE TODAY — spoiler-free): a crack = the guesses, a held door = LOCKED OUT */
export const scoreLine = s => (s < 100 ? `${s} ${s === 1 ? 'GUESS' : 'GUESSES'}` : 'LOCKED OUT');

/** a solo daily: the chat is never locked (there is nobody to chat with mid-run; the console hides it in a room of one anyway) */
export function chatLocked() {
  return false;
}
