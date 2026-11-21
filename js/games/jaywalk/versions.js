// JAYWALK — COURSE RULES VERSIONS (J2 — docs/jaywalk.md "COURSE RULES v2"): a course is a PURE function of (seed, course version). ONE
// source for which version a run is played + replayed on — the phone, the host's podium, the server's count + the daily all read THIS.
// PURE: no imports, no DOM, no clock of its own (every moment is handed in — a server time).
//   · v1 = the rules as they shipped up to J1 (tests/fixtures/jaywalk-v1/ is the frozen copy; tests/jaywalk-v1-frozen.test.mjs).
//   · v2 = EVEN STARTS + THE BLACKBIRD's RUNWAYS (course.js — every v2 change sits behind `cv >= 2`).
// THE SWITCH: v2 from the 4 am Eastern daily turn after J2 shipped — never mid-day. A run's version = the one in force at its GO (a
// SERVER time — a solo run's own GO, a match's FIRST GO); the daily's = the one in force at its day's 4 am. The version travels in the
// proof (`cv` beside `go` — rooms/{CODE}/jw/{matchId}/{uid}/cv; the daily's try record, server-written) and is CHECKED against the GO:
// a phone never picks its own. A run WITHOUT one (an old-code phone) replays as v1 until THE GRACE ends.

/** the moment v2 switches on: 2026-11-22 09:00 UTC = 4 am America/New_York (EST) — the daily turn */
export const CV_SWITCH_MS = Date.UTC(2026, 10, 22, 9, 0, 0);
/** the streak day that is v2's first (THE ONE DAY LINE's key) — its 4 am IS the switch moment (tests/jaywalk-versions.test.mjs) */
export const CV_SWITCH_DAY = 'd20261122';
/** a run with NO version (an old-code phone) is accepted — as v1 — until this moment: 2026-11-27 09:00 UTC (4 am Eastern) */
export const CV_GRACE_END_MS = Date.UTC(2026, 10, 27, 9, 0, 0);
/** the newest version this code knows (the daily's START tells the server so: an old phone says nothing) */
export const CV_LATEST = 2;
export const CV_IDS = Object.freeze([1, 2]);

// (TESTS ONLY — the emulator's E2E plays v2 before the real switch: the page's `?emu&jwcv=<ms>` · the local /api's JW_CV_SWITCH_MS, both
//  honoured OFF Vercel only — api/_lib/jaywalk.js#cvFromEnv · view.js. The deployed site never moves the switch.)
let switchAt = CV_SWITCH_MS, switchDay = CV_SWITCH_DAY;
export function setCvSwitch(ms, day = null) {
  switchAt = typeof ms === 'number' && !Number.isNaN(ms) ? ms : CV_SWITCH_MS;   // (Infinity = v1 for ever: the unit tests of the match logic)
  switchDay = typeof day === 'string' && /^d\d{8}$/.test(day) ? day : ms === 0 ? 'd00000000' : ms === Infinity ? 'd99999999' : CV_SWITCH_DAY;
}
export const cvSwitch = () => switchAt;
// (the emulator page's own: `?emu&jwcv=0` = v2 from the start — read ONCE at load, on a LOCAL host only; the phone, its host's podium and
//  the local /api — JW_CV_SWITCH_MS — then agree. Never on the live site: the hostname is checked)
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
 *  is v1 for everyone. `cvs` = the newest version the phone says it knows (none = an old-code phone). (`now` kept for the callers' shape) */
export function tryVersion(day, cvs, now) {
  const E = versionOfDay(day);
  void now;
  return E === 1 ? 1 : Number(cvs) >= E ? E : 0;
}
