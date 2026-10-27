// CITY 2.0 — THE HARBOR, PART 11a-2: BLACK FRIDAY + THE FIRST OF CHRISTMAS (PURE — tests/harbor-xmas.test.mjs; docs/harbor.md#part-11a-2).
// Thanksgiving's dressing is gone overnight (core/harbor-holiday.js ends it at 4 am, the big pieces at the next load); the day after is
// a busy SHOPPING DAY — more people out, walking faster, with bags + boxes; the banner plane flies a SALE; the CHRISTMAS-TREE VENDOR sets
// up his stand by the bench; and late morning the FIRST CHRISTMAS CREW comes in the electrician's van: two men take the window washers'
// rig down the speakeasy's front stringing big bulbs along every sill + under the cornice, a third strings the awning's edge from his
// stepladder (core/harbor-crew.js#PLAN.xlights — a scene meant to be WATCHED: it changes on screen). That evening the first strings
// switch on, and stay up every evening after — Part 11b's Christmas takes them over.
// Pure: the date → the day's state; the crew's work → which strings are up (segments + their share hung) at a time.
import { thanksgiving } from './sky.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const dayNum = (y, m, d) => Math.round(Date.UTC(y, m - 1, d) / 864e5);

/** the numbers: the shops' rush (local hours, ramped), the tree stand's season (from Black Friday morning to Christmas Eve's evening),
 *  the strings' evenings (on at dusk − `early` h, off at `off` — 1 am) and the season they stay up (to Jan 6) */
export const XMAS = Object.freeze({
  rush: [6.5, 8.5, 18.5, 21], tree: { h: 7.5, to: [12, 24, 21] }, early: 0.25, off: 25, until: [1, 6],
  // THE FIRST CREW (core/harbor-workers.js#SHOWS.xlights): its start (local h) + length (min) — the strings appear as they work
  crew: { at: 9.75, len: 150 },
});
/** Black Friday's date in year y → { m, d } (the day after the fourth Thursday of November) */
export const blackFriday = y => { const t = thanksgiving(y); return { m: 11, d: t.d + 1 }; };

/**
 * xmasPrelude(lc, o) → the day's state for local time lc ({ y, m, d, h, mi, s? }); o: { dusk (local h, 17 by default) }
 *   bf       it is Black Friday (all day)
 *   rush     the shopping rush 0..1 (Black Friday's day: ramped in from 6:30, full 8:30 → 6:30 pm, out by 9)
 *   tree     the tree vendor's stand is out (Black Friday 7:30 am → Christmas Eve 9 pm)
 *   crew     'before' | 'during' | 'after' | null (the first crew's day: before / while they work / after; null on other days)
 *   lights   the strings up: 0 before the crew's day, 1 once they're done (every day after, to Jan 6); on the crew's own day 'crew' = during
 *   lit      the strings switched on (an evening after they're up: dusk − 15 min → 1 am)
 *   banner   the banner plane's sale messages (Black Friday 9 am → 5 pm)
 */
export function xmasPrelude(lc, o = {}) {
  const none = { bf: false, rush: 0, tree: false, crew: null, lights: 0, lit: false, banner: false };
  if (!lc || !lc.y) return none;
  const y = lc.y, hr = (lc.h || 0) + (lc.mi || 0) / 60 + (lc.s || 0) / 3600, dusk = o.dusk == null ? 17 : o.dusk;
  // (the year the season belongs to: Jan 1 → Jan 6 is last year's)
  const yy = lc.m === 1 ? y - 1 : y, B = blackFriday(yy), n = dayNum(y, lc.m, lc.d), n0 = dayNum(yy, B.m, B.d), nEnd = dayNum(yy + 1, XMAS.until[0], XMAS.until[1]);
  // (the small hours belong to the evening before: Black Friday's first lit evening runs on past midnight into Saturday)
  const small = hr < XMAS.off - 24, litNight = small ? n - 1 >= n0 && n - 1 <= nEnd : false;
  if (n < n0 || n > nEnd) return litNight ? { ...none, lights: 1, lit: true } : none;
  const bf = n === n0, C = XMAS.crew, crewEnd = C.at + C.len / 60;
  const crew = bf ? (hr < C.at ? 'before' : hr < crewEnd ? 'during' : 'after') : null;
  const up = n > n0 || crew === 'after' ? 1 : 0;
  const R = XMAS.rush, rush = bf ? smooth(R[0], R[1], hr) * (1 - smooth(R[2], R[3], hr)) : 0;
  const tEnd = dayNum(yy, XMAS.tree.to[0], XMAS.tree.to[1]);
  const tree = (n > n0 || (bf && hr >= XMAS.tree.h)) && (n < tEnd || (n === tEnd && hr < XMAS.tree.to[2]));
  return { bf, rush, tree, crew, lights: up, lit: small ? litNight : up === 1 && hr >= dusk - XMAS.early, banner: bf && hr >= 9 && hr < 17 };
}

// ------------------------------------------------------------------ THE STRINGS ON THE SPEAKEASY (hung by the crew)
/** the windows' sills + the cornice + the awning's edge, in the front wall's units (u along from its left end, v up) — the window
 *  u ranges + rows come from core/harbor-speakeasy.js (SPEAK_WIN / SPEAK_V); `bay` = the rig's bay that hangs it (0 = the middle
 *  window + the far-left one it reaches, 1 = the right window) */
export function xlightSegments(win, rows, cornice, awning) {
  const out = [{ id: 'cornice', u0: 0.15, u1: 11.05, v: cornice - 0.05, sag: 0.16, n: 26, from: 1 }];
  rows.forEach(([v0], fl) => win.forEach(([a, b], i) => out.push({ id: `sill-${fl}-${i}`, u0: a - 0.12, u1: b + 0.12, v: v0 - 0.08, sag: 0.2, n: 8, floor: fl, win: i, bay: i === 2 ? 1 : 0, from: i === 2 ? 0 : 1 })));
  if (awning) out.push({ id: 'awning', u0: awning.u0 + 0.05, u1: awning.u1 - 0.05, v: awning.v, sag: 0.13, n: 14, from: 0, awning: true });
  return out;
}
/** the rig's work → each segment's share hung (0..1) at show-fraction k (core/harbor-workers.js#platformAt's order: parked over the
 *  parapet → down past the cornice to the top floor, its right bay, then its left; down a floor: the left bay, then the right; back up) */
export function sillsAt(k) {
  const span = (a, b) => clamp01((k - a) / (b - a));
  const out = { cornice: span(0.015, 0.08) };
  // (the top floor = rows[1] → floor 1; the right bay first)
  out['sill-1-2'] = span(0.1, 0.27); out['sill-1-1'] = span(0.31, 0.42); out['sill-1-0'] = span(0.42, 0.49);
  out['sill-0-0'] = span(0.57, 0.64); out['sill-0-1'] = span(0.64, 0.73); out['sill-0-2'] = span(0.75, 0.91);
  return out;
}
/** the rush at an absolute time t (s) in a zone (off: minutes east of UTC) — for the people's planner (core/harbor-people.js: ctx.rush) */
export function rushAtT(t, off = 0) {
  const d = new Date((t + off * 60) * 1000);
  return xmasPrelude({ y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), h: d.getUTCHours(), mi: d.getUTCMinutes(), s: d.getUTCSeconds() }).rush;
}
