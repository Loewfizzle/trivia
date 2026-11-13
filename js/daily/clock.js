// THE DAILY KIT — THE CLOCK (DM1 — FABLE REVIEW #1, 10: THE PASSWORD + COAST CLEAR had each their own copy). PURE (the server's logic.js
// files import these too): the time to the next 4 am Eastern, the h:mm:ss countdown, the run's own day key.
import { streakDay, dayStartAt, dayOf, dayNum } from '../core/streak.js';

/** ms until the next 4 am Eastern (the dailies' day turns with the streak's). THE ONE DAY LINE (FR7 FIXES C, M3): given an INSTANT (server
 *  ms) → the next day's start (core/streak.js#dayStartAt) − now — right on the nights the clocks change (the old wall-clock sum + 24 h was an
 *  hour out there, and a screen opened after 3 am on the spring-forward night armed for the NEXT day). (The legacy form — the Eastern clock
 *  { h, mi, s } + the ms within the second — is kept for old callers + the tests.) */
export function msToTurn(now, subMs = 0, turnH = 4) {
  if (typeof now === 'number') return dayStartAt(dayOf(dayNum(streakDay(now)) + 1)) - now;
  const { h, mi, s } = now;
  const secs = h * 3600 + mi * 60 + s, left = (turnH * 3600 - secs + 86400) % 86400 || 86400;
  return left * 1000 - subMs;
}
/** h:mm:ss (the countdown to the next day — "NEXT PASSWORD IN 13:39:21") */
export const fmtCountdown = ms => { const t = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(t / 3600)}:${String(Math.floor(t / 60) % 60).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
/** the run's OWN day (DFIX1 — its start's), else the day of its start, else the day now */
export const runDayKey = (day, startedAt, now) => (/^d\d{8}$/.test(String(day || '')) ? day : streakDay(startedAt || now));
