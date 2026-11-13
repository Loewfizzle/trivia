// Calendar keys on Eastern time (America/New_York), PURE.
// THE ONE DAY LINE (FR7 FIXES C — Grok's progression + calendar review, M3 + S1): the day TURNS at 4:00 AM America/New_York WALL CLOCK
// (`turnAt` — the instant always exists: DST moves at 2 am), and so does THE WEEK — weekly boards are keyed by the Monday they start on
// ("w20261012") and a new week starts writing to a new key at MONDAY 4:00 AM Eastern (it was Monday 00:00 while the streak + the dailies
// stayed on Sunday until 4 am). dayKey = the plain Eastern calendar date (midnight); turnDay = the 4 am day everything is credited on.
const TZ = 'America/New_York';
let fmt = null;
const parts = ms => {
  fmt ||= new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  const o = {};
  for (const p of fmt.formatToParts(new Date(ms))) o[p.type] = p.value;
  return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour % 24, mi: +o.minute, s: +o.second };
};
/** Eastern wall-clock parts of an instant: { y, m, d, h, mi, s, dow } (dow: 0 = Monday … 6 = Sunday). */
export function easternParts(ms) {
  const p = parts(ms);
  return { ...p, dow: (new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay() + 6) % 7 };
}
const pad = n => String(n).padStart(2, '0');
const ymd = (y, m, d) => `${y}${pad(m)}${pad(d)}`;

export function dayKey(ms) {
  const p = parts(ms);
  return `d${ymd(p.y, p.m, p.d)}`;
}

/** THE DAY TURN: 4 am Eastern (late nights count for the evening they started) */
export const DAY_TURN_H = 4;
const dayN = dk => { const k = String(dk); return Math.round(Date.UTC(+k.slice(1, 5), +k.slice(5, 7) - 1, +k.slice(7, 9)) / 864e5); };
const keyOfN = n => { const d = new Date(n * 864e5); return `d${ymd(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate())}`; };
const TURNS = new Map();
/** THE ONE DAY LINE (M3): the INSTANT of 4:00 AM America/New_York wall clock on the Eastern date `dk` ('d20261102') — 08:00 UTC in summer
 *  time, 09:00 UTC in winter; on a DST change day the one whose Eastern clock really reads 4:00 (the clocks change at 2 am, so it exists) */
export function turnAt(dk) {
  let t = TURNS.get(dk);
  if (t != null) return t;
  const base = dayN(dk) * 864e5;
  t = base + 9 * 3600e3;
  for (const h of [8, 9]) {
    const x = base + h * 3600e3, p = parts(x);
    if (p.h === DAY_TURN_H && p.mi === 0 && `d${ymd(p.y, p.m, p.d)}` === String(dk)) { t = x; break; }
  }
  if (TURNS.size > 800) TURNS.clear();
  TURNS.set(dk, t);
  return t;
}
/** THE ONE DAY LINE: the 4 am day of an instant ('d20261102' from Nov 2 4:00 am to Nov 3 3:59:59 am Eastern wall clock — every day of the year) */
export function turnDay(ms) {
  const dk = dayKey(ms);
  return ms >= turnAt(dk) ? dk : keyOfN(dayN(dk) - 1);
}
/** the Monday (a day number) of the week a 4 am day belongs to */
const mondayN = dk => { const n = dayN(dk); return n - ((new Date(n * 864e5).getUTCDay() + 6) % 7); };

/** THE WEEK of an instant (S1): the Monday of its 4 am day — 'w20261109' from Mon Nov 9 4:00 am to Mon Nov 16 3:59:59 am Eastern */
export function weekKey(ms) {
  return `w${keyOfN(mondayN(turnDay(ms))).slice(1)}`;
}

/** When the week containing ms ends (the next Monday 4:00 am Eastern), as an epoch ms. */
export function weekEndsAt(ms) {
  return turnAt(keyOfN(mondayN(turnDay(ms)) + 7));
}

export const isWeekKey = k => /^w\d{8}$/.test(String(k));
