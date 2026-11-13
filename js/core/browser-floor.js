// FR7 FIXES C2 — THE SUPPORTED FLOOR (the owner's /admin, Nov 13: two BOOT HANGs at 5:54 am were a bot — "Mac Chrome 83" (2020), macOS 10.14,
// an 800×600 @1 window, app.js failing in 7 ms: an engine too old for the code). PURE — the server's copy (api/log.js: a below-floor 'boot'
// report is COUNTED as an old browser, never stored as a BOOT HANG); the phone's copy is INLINE in index.html (THE BOOT WATCHDOG runs before
// any module — an old engine never runs one), kept in step by tests/safari-floor.test.mjs (the same UA table through both).
// THE FLOOR = what the code needs (PLAY NOW — 0d, checked feature by feature: docs/harbor.md#the-supported-floor): `Array#at`, `structuredClone`,
// BroadcastChannel, CSS `:has` + `dvh` (Safari 15.4 · Chrome 92 · Firefox 90 — `Array#at` sets the Chrome + Firefox numbers); the canvas
// `roundRect` (Safari 16) is filled in (ui/canvas-safe.js); `color-mix` (16.2) + `@property` (16.4) only change the look. C2's iOS 16 turned
// away iPhones on 15.4–15.8 that run the app — never block a browser that works. Every browser on iOS is WebKit: its iOS version decides.
// An UNKNOWN browser is never called old (a real current browser must always report its hangs).
export const FLOOR = Object.freeze({ chrome: 92, firefox: 90, safari: '15.4', ios: '15.4' });
/** PURE: a version ('15.4', 92, '16') → a comparable number (major × 100 + minor) */
export const verNum = v => { const p = String(v).split('.'); return (Number(p[0]) || 0) * 100 + (Number(p[1]) || 0); };

/** PURE: a user-agent string → { old, name, v, floor } (old = below the supported floor), or null when the browser isn't recognised */
export function browserFloor(ua) {
  const s = String(ua || '');
  let m;
  // iOS / iPadOS (every browser there is WebKit — CriOS, FxiOS, in-app included): the OS version. An iPad asking for the desktop site says
  // "Macintosh" + "Mobile/" — its Safari version stands in.
  if (/iPhone|iPad|iPod/.test(s) && (m = s.match(/OS (\d+)[_.](\d+)/))) return verdict('iOS', `${m[1]}.${m[2]}`, FLOOR.ios);
  if (/Macintosh/.test(s) && /Mobile\//.test(s) && (m = s.match(/Version\/(\d+)(?:\.(\d+))?/))) return verdict('iOS', `${m[1]}.${m[2] || 0}`, FLOOR.ios);
  if ((m = s.match(/Firefox\/(\d+)/))) return verdict('Firefox', m[1], FLOOR.firefox);
  if ((m = s.match(/(?:Chrome|Chromium)\/(\d+)/))) return verdict('Chrome', m[1], FLOOR.chrome);
  if (/Safari\//.test(s) && (m = s.match(/Version\/(\d+)(?:\.(\d+))?/))) return verdict('Safari', `${m[1]}.${m[2] || 0}`, FLOOR.safari);
  return null;
}
const verdict = (name, v, floor) => (verNum(v) > 0 ? { old: verNum(v) < verNum(floor), name, v: String(v), floor: String(floor) } : null);
/** PURE: below the floor? (false for an unknown browser) */
export const tooOld = ua => { const f = browserFloor(ua); return !!(f && f.old); };
/** the words the boot screen shows an old browser */
export const OLD_TEXT = 'This browser is too old for NEON SPEAKEASY — try a current Safari or Chrome.';
