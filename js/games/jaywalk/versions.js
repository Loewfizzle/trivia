// JAYWALK — COURSE RULES VERSIONS (J2 — docs/jaywalk.md "COURSE RULES v2"): a course is a PURE function of (seed, course version). ONE
// The long notes: docs/games/jaywalk-notes.md

/** the moment v2 switches on: 2026-11-22 09:00 UTC = 4 am America/New_York (EST) — the daily turn */
export const CV_SWITCH_MS = Date.UTC(2026, 10, 22, 9, 0, 0);
/** the streak day that is v2's first (THE ONE DAY LINE's key) — its 4 am IS the switch moment (tests/jaywalk-versions.test.mjs) */
export const CV_SWITCH_DAY = 'd20261122';
/** a run with NO version (an old-code phone) is accepted — as v1 — until this moment: 2026-11-27 09:00 UTC (4 am Eastern) */
export const CV_GRACE_END_MS = Date.UTC(2026, 10, 27, 9, 0, 0);
/** the newest version this code knows (the daily's START tells the server so: an old phone says nothing) */
export const CV_LATEST = 2;
export const CV_IDS = Object.freeze([1, 2]);
/** J2 FIX — the REVISION of v2's numbers this code plays: 2 = THE BLACKBIRD YOU CAN SEE (the jets slower, the tell 1.2 s — tuning.js#RUNWAY,
 *  changed BEFORE v2 went live; v2 is FROZEN from here — tests/fixtures/jaywalk-v2/). A phone still on the pre-fix J2 build plays the old
 *  numbers under the same `cv` 2: the daily's START refuses it on a v2 day (no `cvr` — it is told to refresh) and a solo / match run of its is
 *  refused by THE END CHECK (replay.js#judgeRun: its own end `e` never matches the server's replay) — never a wrong count. */
export const CV_REV = 2;

// (TESTS ONLY — the emulator's E2E plays v2 before the real switch: the page's `?emu&jwcv=<ms>` · the local /api's JW_CV_SWITCH_MS, both …
let switchAt = CV_SWITCH_MS, switchDay = CV_SWITCH_DAY;
export function setCvSwitch(ms, day = null) {
  switchAt = typeof ms === 'number' && !Number.isNaN(ms) ? ms : CV_SWITCH_MS;   // (Infinity = v1 for ever: the unit tests of the match logic)
  switchDay = typeof day === 'string' && /^d\d{8}$/.test(day) ? day : ms === 0 ? 'd00000000' : ms === Infinity ? 'd99999999' : CV_SWITCH_DAY;
}
export const cvSwitch = () => switchAt;
// (the emulator page's own: `?emu&jwcv=0` = v2 from the start — read ONCE at load, on a LOCAL host only; the phone, its host's podium and …
if (typeof location !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(location.hostname || '') && /[?&]emu(?:&|=|$)/.test(location.search || '')) {
  const m = /[?&]jwcv=(\d+)/.exec(location.search);
  if (m) setCvSwitch(Number(m[1]));
}

/** the version in force at a server time (a run's GO) */
export const versionAt = ms => (Number(ms) >= switchAt ? 2 : 1);
/** the version a DAY's daily is played on — the one in force at that day's 4 am (day keys sort as strings: d20261122 > d20261121) */
export const versionOfDay = day => (typeof day === 'string' && day >= switchDay ? 2 : 1);
/**
 * THE CHECK (PURE — the host's podium + the server's count): the version a run REPLAYS on, from what its proof carries.
 *   `cv` = the run's own field (undefined / null = none) · `E` = the version in force at its GO (versionAt) · `go` = its GO (a server time)
 * → 1 | 2, or 0 = REFUSED ('version' — a version that is not the one in force at its GO; or none at all once THE GRACE is over)
 */
export function runVersion(cv, E, go) {
  if (cv != null) return cv === E ? E : 0;
  return E === 1 || Number(go) < CV_GRACE_END_MS ? 1 : 0;
}
/** the daily's START: the version a NEW try is opened on → 1 | 2, or 0 = refused. ONE COURSE A DAY ("a day's daily uses the version in force
 *  at its 4 am" — the fresh-eyes review's M4: no grace here): a v2 day refuses a phone that does not know v2 (it is told to refresh); a v1 day
 *  is v1 for everyone. `cvs` = the newest version the phone says it knows (none = an old-code phone) · `cvr` = its v2 numbers' revision (J2 FIX:
 *  none = the pre-fix J2 build — refused on a v2 day). (`now` kept for the callers' shape) */
export function tryVersion(day, cvs, now, cvr = null) {
  const E = versionOfDay(day);
  void now;
  return E === 1 ? 1 : Number(cvs) >= E && Number(cvr) >= CV_REV ? E : 0;
}
