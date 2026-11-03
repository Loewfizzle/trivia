// BIRTHDAYS (PROGRESSION B — the owner, Nov 2: month + day on the profile, NEVER the year, optional, changeable ONCE A YEAR — no farming).
// PURE (server + client). The server keeps it private (ppriv/{pid}/bd = { m, d, at (its last change) } — never in a public response);
// on the day the player's own city SKYWRITES "HAPPY BDAY <NAME>" the first time they open it (their room too once LOBBY 2.0 makes the
// lobby the live city — the server's room copy is built now, dormant), and MANY HAPPY RETURNS wakes (core/achievements.js).
import { isOffensive } from './names.js';

/** a change waits this long after the last one (setting it the first time is free) */
export const BDAY_CHANGE_MS = 365 * 864e5;
const DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export const BDAY_MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** the phone's month + day → { bd: { m, d } } | { bd: null } (cleared) | { bad } — Feb 29 allowed (it's kept on Feb 28 in other years) */
export function cleanBirthday(m, d) {
  if (m == null && d == null) return { bd: null };
  const M = Number(m), D = Number(d);
  if (!Number.isInteger(M) || M < 1 || M > 12) return { bad: 'bad_month' };
  if (!Number.isInteger(D) || D < 1 || D > DAYS[M - 1]) return { bad: 'bad_day' };
  return { bd: { m: M, d: D } };
}
/** may it change now? prev: the stored { m, d, at } | null → { ok, until (ms — when it may change next) } */
export function canChangeBirthday(prev, now) {
  if (!prev || !prev.at) return { ok: true, until: 0 };
  const until = prev.at + BDAY_CHANGE_MS;
  return { ok: now >= until, until };
}
const leap = y => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
/** the local date of `ms` in a zone → { y, m, d } */
export function localDate(ms, tz) {
  try {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz || undefined, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date(ms)).map(x => [x.type, x.value]));
    return { y: +p.year, m: +p.month, d: +p.day };
  } catch { const x = new Date(ms); return { y: x.getUTCFullYear(), m: x.getUTCMonth() + 1, d: x.getUTCDate() }; }
}
/** is `ms` (in the zone) the birthday? (Feb 29 → Feb 28 when the year has none) */
export function isBirthdayOn(bd, ms, tz) {
  if (!bd || !bd.m || !bd.d) return false;
  const L = localDate(ms, tz);
  if (bd.m === 2 && bd.d === 29 && !leap(L.y)) return L.m === 2 && L.d === 28;
  return L.m === bd.m && L.d === bd.d;
}
/** the day's key ("2026-11-03") — the city's skywrite once a day, the room's once a day */
export const dayKeyOf = (ms, tz) => { const L = localDate(ms, tz); return `${L.y}-${String(L.m).padStart(2, '0')}-${String(L.d).padStart(2, '0')}`; };
/** the skywrite's words: HAPPY BDAY + the player's name (their own, through the name filter — a name it refuses becomes FRIEND), ≤ 16 letters */
export function bdayText(name) {
  let n = String(name || '').toUpperCase().replace(/[^A-Z0-9 '\-.!]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16);
  if (!n || isOffensive(n)) n = 'FRIEND';
  return `HAPPY BDAY ${n}`;
}
/** the profile's line: "NOV 3" (never the year) */
export const bdayLabel = bd => (bd && bd.m ? `${BDAY_MONTHS[bd.m - 1]} ${bd.d}` : '');
