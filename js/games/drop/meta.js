// THE DROP — THE THIN META (THE DROP A — docs/prism.md "THE DROP"; docs/cartridge.md D1): PRISM DROP's DAILY. PURE + tiny, no imports.
// A DAILY-ONLY cartridge (a DAILIES row, never GAMES): SURVIVAL on the day's pieces + rising rows — the same for everyone — played on PRISM
// DROP's own view (js/games/prism/view.js in its DROP mode); the server replays the run's input log (api/_lib/drop.js). Ships OFF.
export const DEFAULT_SETTINGS = {};
export const OPTIONS = [];
export const estimateMinutes = () => 4;
// a solo run on THE DAILY KIT's decks like the other dailies (index.js#musicFor: the day deck by day, the evening deck by night)
export const MUSIC = 'mood:evening';
export const SOLO = true;
export const MIN_PLAYERS = 1;
export const BANNER_NAME = 'THE DROP';
/** DM2 — THE DAILY SCREEN's line for a score (spoiler-free): the time survived + the lines (THE END at 8:00) — drop.js#dropLine's words */
export function scoreLine(score) {
  const d = Math.floor(Math.max(0, Number(score) || 0) / 1000), ln = Math.max(0, Math.round(Number(score) || 0) % 1000), s = Math.floor(d / 10);
  if (d >= 4800) return '8:00 · THE END';
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}.${d % 10} · ${ln} ${ln === 1 ? 'LINE' : 'LINES'}`;
}
/** BOTH LOOKS (PRISM DROP's: day = crayon, night = neon — THE GAME LOOK, read live) */
export const LOOKS = ['day', 'night'];
/** a solo daily: the chat is never locked */
export function chatLocked() {
  return false;
}
