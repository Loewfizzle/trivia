// JAYWALK — THE SEASON GATE (JT1 — ROOM FIRST, docs/jaywalk.md "JT1 — SEASONS"): PURE + TINY — the only seasonal code in the START bundle.
// Whether a day ('d20261224') may need THE SEASONAL PACK at all: Oct 20 → Mar 1 (autumn → the melt). Everything else — the season clock
// (season.js), the looks, the models — is the pack's, fetched only on such a day (or when the lab forces one). A VIEW's input only: the
// rules, the course, the replay + the server never read it (THE GAMEPLAY LOCK — tests/jaywalk-jt1.test.mjs: it agrees with season.js#packDay
// on every day of the year).
/** the day key of an ISO date ('2026-12-24' → 'd20261224'; a key stays a key; anything else '') */
export const dayKeyIn = v => { const s = String(v || ''); const m = /^d?(\d{4})-?(\d{2})-?(\d{2})$/.exec(s); return m ? `d${m[1]}${m[2]}${m[3]}` : ''; };
/** the pack may be wanted on this day: Oct 20 → the last day of February */
export function seasonWindow(day) {
  const m = /^d\d{4}(\d{2})(\d{2})$/.exec(day || '');
  if (!m) return false;
  const mo = +m[1], d = +m[2];
  return mo >= 11 || mo <= 2 || (mo === 10 && d >= 20);
}
