// LOAD FIX 4 — TIME ON SCREEN: ONE clock for every boot wait that must not run out while the page is hidden (Grok's boot audit #6: a phone
// locked or switched to Messages mid-load let every reveal gate expire — the city revealed half built, then popped in). The clock stands
// still while the page is hidden (a locked phone isn't time spent waiting), like THE BOOT WATCHDOG's own count in index.html (an inline
// classic script — it can't import this). Users: app.js (THE REJOIN LIMIT, the boot screen's hold), title.js (the safety reveal),
// harbor/scene.js (REVEAL_MAX, WX_WAIT, FONT_WAIT).
const D = typeof document !== 'undefined' ? document : null;
const now = () => performance.now();
const hidden = () => !!D && D.visibilityState === 'hidden';
let hiddenMs = 0, hiddenAt = hidden() ? now() : -1;
const subs = new Set();
if (D) {
  D.addEventListener('visibilitychange', () => {
    if (hidden()) { if (hiddenAt < 0) hiddenAt = now(); } else if (hiddenAt >= 0) { hiddenMs += now() - hiddenAt; hiddenAt = -1; }
    for (const f of [...subs]) f();
  });
}

/** page ms spent ON SCREEN since this module loaded (on performance.now()'s scale, minus every hidden span) */
export const onScreenNow = () => now() - hiddenMs - (hiddenAt >= 0 ? now() - hiddenAt : 0);

/** a stopwatch from now (or from an earlier onScreenNow() reading): () → the on-screen ms since */
export function onScreenSince(t = onScreenNow()) { return () => onScreenNow() - t; }

/** resolves once `ms` have passed ON SCREEN (paused while hidden). A timer that iOS held while the page was hidden and fires at the
 *  return re-measures first — it never resolves early. */
export function onScreenWait(ms) {
  return new Promise(resolve => {
    const t0 = onScreenNow();
    let timer = 0;
    const arm = () => {
      clearTimeout(timer);
      if (hidden()) return;   // (the visibilitychange back calls arm again)
      const left = ms - (onScreenNow() - t0);
      if (left <= 0) { subs.delete(arm); resolve(); return; }
      timer = setTimeout(arm, left + 4);
    };
    subs.add(arm);
    arm();
  });
}
