// Calendar keys on Eastern time (America/New_York), PURE.
// Weekly boards are keyed by the Monday they start on ("w20261012"), so a new week simply starts writing to a new
// key at Monday 00:00 Eastern — no reset job. Day keys ("d20261018") drive the "new game tonight" XP bonus.
const TZ = 'America/New_York';
let fmt = null;
const parts = ms => {
  fmt ||= new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  const o = {};
  for (const p of fmt.formatToParts(new Date(ms))) o[p.type] = p.value;
  return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour % 24, mi: +o.minute, s: +o.second };
};
const pad = n => String(n).padStart(2, '0');
const ymd = (y, m, d) => `${y}${pad(m)}${pad(d)}`;

/** Eastern calendar date of an instant as a UTC-midnight timestamp (for day arithmetic). */
function localDay(ms) {
  const p = parts(ms);
  return Date.UTC(p.y, p.m - 1, p.d);
}

/** Offset of Eastern time from UTC at an instant, in ms (−4 h or −5 h). */
function offsetAt(ms) {
  const p = parts(ms);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - Math.floor(ms / 1000) * 1000;
}

/** The instant of local Eastern midnight on a UTC-midnight day stamp. */
function midnightAt(dayUtc) {
  let t = dayUtc - offsetAt(dayUtc);
  t = dayUtc - offsetAt(t);
  return t;
}

export function dayKey(ms) {
  const p = parts(ms);
  return `d${ymd(p.y, p.m, p.d)}`;
}

/** Monday (Eastern) of the week containing ms. */
function mondayOf(ms) {
  const day = localDay(ms);
  const dow = new Date(day).getUTCDay(); // 0 Sunday … 6 Saturday
  return day - ((dow + 6) % 7) * 86_400_000;
}

export function weekKey(ms) {
  const d = new Date(mondayOf(ms));
  return `w${ymd(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate())}`;
}

/** When the week containing ms ends (next Monday 00:00 Eastern), as an epoch ms. */
export function weekEndsAt(ms) {
  return midnightAt(mondayOf(ms) + 7 * 86_400_000);
}

export const isWeekKey = k => /^w\d{8}$/.test(String(k));
