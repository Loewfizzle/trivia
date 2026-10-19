// THE CITY'S SIGNS — the rules (pure, no DOM; tested in tests/signs.test.mjs).
//   rotation: which sign shows which game. One sign changes at a time, every CHANGE_EVERY seconds, always to a game that
//             isn't already showing, round-robin through the signs and the games — every game appears within a minute.
//   ticker:   the scrolling band's message: holiday build-ups and greetings, the New Year countdown, the games playing.
import { easter, thanksgiving } from '../../core/sky.js';

export const CHANGE_EVERY = 4.6;   // seconds between sign changes (one sign at a time)

export function createRotation(nSigns, nGames, seed = 0) {
  const n = Math.min(nSigns, nGames);
  return { shown: Array.from({ length: n }, (_, i) => (seed + i) % nGames), cursor: (seed + n) % nGames, turn: 0, at: 0 };
}

/** Advance at time t (s). Returns { r, change: { sign, game } | null }. */
export function rotate(r, nGames, t) {
  if (!r.shown.length || nGames <= r.shown.length || t - r.at < CHANGE_EVERY) return { r, change: null };
  let g = r.cursor, guard = 0;
  while (r.shown.includes(g) && guard++ < nGames) g = (g + 1) % nGames;
  const sign = r.turn % r.shown.length;
  const shown = r.shown.slice();
  shown[sign] = g;
  return { r: { shown, cursor: (g + 1) % nGames, turn: r.turn + 1, at: t }, change: { sign, game: g } };
}

const HOLIDAY = {
  halloween: { name: 'HALLOWEEN', hi: 'HAPPY HALLOWEEN', date: y => ({ m: 10, d: 31 }) },
  thanksgiving: { name: 'THANKSGIVING', hi: 'HAPPY THANKSGIVING', date: thanksgiving },
  christmas: { name: 'CHRISTMAS', hi: 'MERRY CHRISTMAS', date: () => ({ m: 12, d: 25 }) },
  valentine: { name: "VALENTINE'S DAY", hi: "HAPPY VALENTINE'S DAY", date: () => ({ m: 2, d: 14 }) },
  stpatrick: { name: "ST. PATRICK'S DAY", hi: "HAPPY ST. PATRICK'S DAY", date: () => ({ m: 3, d: 17 }) },
  easter: { name: 'EASTER', hi: 'HAPPY EASTER', date: easter },
  july4: { name: 'THE FOURTH', hi: 'HAPPY FOURTH OF JULY', date: () => ({ m: 7, d: 4 }) },
};

/** Nights from a local date to a holiday this year. */
export function nightsTo(id, y, m, d) {
  const h = HOLIDAY[id];
  if (!h) return null;
  const t = h.date(y);
  return Math.round((Date.UTC(y, t.m - 1, t.d) - Date.UTC(y, m - 1, d)) / 86400000);
}

/** The holiday part of the ticker for a look (core/sky.js#look), or ''. */
export function holidayLine(L) {
  if (L.nye && L.nye.countdown != null) { const s = L.nye.countdown; return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} TO MIDNIGHT`; }
  if (L.nye && L.nye.finale != null) return 'HAPPY NEW YEAR';
  const hol = L.holiday;
  if (!hol) return '';
  if (hol.id === 'nye') return L.local && L.local.m === 1 ? 'HAPPY NEW YEAR' : "IT'S NEW YEAR'S EVE";
  const h = HOLIDAY[hol.id];
  if (!h) return '';
  if (hol.full) return h.hi;
  const p = L.local || {};
  const n = nightsTo(hol.id, p.y, p.m, p.d);
  return n > 0 ? `${n} NIGHT${n === 1 ? '' : 'S'} TO ${h.name}` : h.hi;
}

/** The whole ticker message: the countdown alone in the last minutes of the year; otherwise the holiday, then the games. */
export function tickerText(L, names) {
  const hol = holidayLine(L);
  if (L.nye && L.nye.countdown != null) return hol;
  const games = `NOW PLAYING: ${names.join(' · ')}`;
  return hol ? `${hol}   ★   ${games}` : games;
}
