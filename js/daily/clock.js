// THE DAILY KIT — THE CLOCK (DM1 — FABLE REVIEW #1, 10: THE PASSWORD + COAST CLEAR had each their own copy). PURE (the server's logic.js
// files import these too): the time to the next 4 am Eastern, the h:mm:ss countdown, the run's own day key.
import { streakDay } from '../core/streak.js';

/** ms until the next 4 am Eastern (the dailies' day turns with the streak's — core/streak.js#DAY_TURN_H) given the Eastern clock now
 *  ({ h, mi, s } — core/week.js#easternParts) and the ms within this second (a DST night is at most an hour out — once a year) */
export function msToTurn({ h, mi, s }, subMs = 0, turnH = 4) {
  const secs = h * 3600 + mi * 60 + s, left = (turnH * 3600 - secs + 86400) % 86400 || 86400;
  return left * 1000 - subMs;
}
/** h:mm:ss (the countdown to the next day — "NEXT PASSWORD IN 13:39:21") */
export const fmtCountdown = ms => { const t = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(t / 3600)}:${String(Math.floor(t / 60) % 60).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
/** the run's OWN day (DFIX1 — its start's), else the day of its start, else the day now */
export const runDayKey = (day, startedAt, now) => (/^d\d{8}$/.test(String(day || '')) ? day : streakDay(startedAt || now));
