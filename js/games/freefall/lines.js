// FREEFALL — THE BOARD's LINES (F4A — docs/freefall.md "THE BOARD + AVG"; JAYWALK's + HIGH RISE's lines.js are the pattern). PURE (no DOM,
// no clock, no server): the words a run's board numbers are said in — the end screen (final.js; F4B's "YOUR BEST · n · AVG n"), the
// would-be line while THE SWITCH is OFF.
export const BOARD = 'freefall-solo';
/** the best the SERVER last told this phone (floors) — only ever written from the server's own answer (counting ON) */
export const SRV_BEST_KEY = 'ff:best';
const num = n => Math.round(Number(n) || 0).toLocaleString('en-US');

/** THE SWITCH's line (counting OFF): what the server WOULD have awarded for the run it just judged — floor, XP, a best, the cards.
 *  `w` = api/report.js#wouldAward's answer: { floor, cause, xp, streak, best, table, cards: ['harbor' | 'terminal' | 'bottom'], cap?, cut?, skip? } */
export function wouldLine(w) {
  if (!w || typeof w !== 'object') return '';
  if (w.skip) return `WOULD NOT COUNT · ${String(w.skip).toUpperCase()}`;
  const parts = [`FLOOR ${num(w.floor)}`, w.cap ? '+0 XP · DAILY CAP' : `+${num(w.xp)} XP`];
  if (w.best) parts.push('NEW BEST');
  if (w.cards && w.cards.length) parts.push(w.cards.length === 1 ? '1 CARD' : `${w.cards.length} CARDS`);
  if (w.cut) parts.push('CUT SHORT');
  return `WOULD COUNT · ${parts.join(' · ')}`;
}
/** F4B's end-card line, its data wired now (JAYWALK's JT2 — core/board-avg.js: shown from 5 counted SOLO runs; a dash under 5):
 *  "YOUR BEST 141 · AVG 62" · "YOUR BEST 141 · AVG —" · '' = no best yet (F5C — the owner's wording: no dot between YOUR BEST + its number) */
export const bestAvgLine = (best, avg) => (best > 0 ? `YOUR BEST ${num(best)} · AVG ${avg != null && avg >= 0 ? num(avg) : '—'}` : '');
