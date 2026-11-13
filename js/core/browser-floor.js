// FR7 FIXES C2 — THE SUPPORTED FLOOR (the owner's /admin, Nov 13: two BOOT HANGs at 5:54 am were a bot — "Mac Chrome 83" (2020), macOS 10.14,
// an 800×600 @1 window, app.js failing in 7 ms: an engine too old for the code). PURE — the server's copy (api/log.js: a below-floor 'boot'
// report is COUNTED as an old browser, never stored as a BOOT HANG); the phone's copy is INLINE in index.html (THE BOOT WATCHDOG runs before
// any module — an old engine never runs one), kept in step by tests/safari-floor.test.mjs (the same UA table through both).
// THE FLOOR = what the code needs: `Array.prototype.at` + logical assignment (Chrome 92, Firefox 90, Safari 15.4) and THE HARBOR's written
// floor, iOS / Safari 16 (docs/harbor.md — no regex lookbehind is the rule for 16.0–16.3). Every browser on iOS is WebKit: its iOS version decides.
// An UNKNOWN browser is never called old (a real current browser must always report its hangs).
export const FLOOR = Object.freeze({ chrome: 92, firefox: 90, safari: 16, ios: 16 });

/** PURE: a user-agent string → { old, name, v, floor } (old = below the supported floor), or null when the browser isn't recognised */
export function browserFloor(ua) {
  const s = String(ua || '');
  let m;
  // iOS / iPadOS (every browser there is WebKit — CriOS, FxiOS, in-app included): the OS version. An iPad asking for the desktop site says
  // "Macintosh" + "Mobile/" — its Safari version stands in.
  if (/iPhone|iPad|iPod/.test(s) && (m = s.match(/OS (\d+)[_.]\d/))) return verdict('iOS', +m[1], FLOOR.ios);
  if (/Macintosh/.test(s) && /Mobile\//.test(s) && (m = s.match(/Version\/(\d+)/))) return verdict('iOS', +m[1], FLOOR.ios);
  if ((m = s.match(/Firefox\/(\d+)/))) return verdict('Firefox', +m[1], FLOOR.firefox);
  if ((m = s.match(/(?:Chrome|Chromium)\/(\d+)/))) return verdict('Chrome', +m[1], FLOOR.chrome);
  if (/Safari\//.test(s) && (m = s.match(/Version\/(\d+)/))) return verdict('Safari', +m[1], FLOOR.safari);
  return null;
}
const verdict = (name, v, floor) => (v > 0 ? { old: v < floor, name, v, floor } : null);
/** PURE: below the floor? (false for an unknown browser) */
export const tooOld = ua => { const f = browserFloor(ua); return !!(f && f.old); };
/** the words the boot screen shows an old browser */
export const OLD_TEXT = 'This browser is too old for NEON SPEAKEASY — try a current Safari or Chrome.';
