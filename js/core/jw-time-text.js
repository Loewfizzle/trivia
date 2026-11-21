// J3 — THE TIME BOARDS' WORDS (PURE, tiny — the daily screen + the share card import ONLY this: never JAYWALK's tuning.js; the full board logic
// is js/core/jw-times.js, the server's). TICK_HZ / SPLIT_EVERY here = tuning.js's own (tests/jaywalk-j3.test.mjs checks they agree).
export const TICK_HZ = 60, SPLIT_EVERY = 50;

/** a split time as a time row shows it: m:ss.t (60 ticks = 1 s; the tenths FLOORED — "reached by" its time; never rounds up into a tie) */
export function timeClock(tick) {
  const tn = Math.floor((Math.max(0, Math.floor(Number(tick) || 0)) * 10) / TICK_HZ);
  const s = Math.floor(tn / 10);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}.${tn % 10}`;
}
/** a tab's words: the first time tab says FASTEST TO 50, the next ones TO 100 · TO 150 … (the owner's row) */
export const tabLabel = (lane, first = false) => `${first ? 'FASTEST ' : ''}TO ${lane}`;
/** THE SHARE CARD's line: "TO 100 · 1:14" (m:ss — the end card's own split clock) | '' (no 50 reached today) */
export function bestTimeLine(hs) {
  if (!hs || !(Number(hs.at) >= SPLIT_EVERY) || !(Number(hs.t) > 0)) return '';
  const s = Math.floor(Number(hs.t) / TICK_HZ);
  return `TO ${Math.floor(Number(hs.at))} · ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
