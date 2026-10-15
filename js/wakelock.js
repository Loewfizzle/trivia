// Keeps the screen on during games where the Screen Wake Lock API exists.
let sentinel = null;
let wanted = false;
let requesting = false;

async function acquire() {
  if (!wanted || sentinel || requesting || !('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
  requesting = true;
  try {
    sentinel = await navigator.wakeLock.request('screen');
    sentinel.addEventListener('release', () => { sentinel = null; });
    if (!wanted) { sentinel.release().catch(() => {}); sentinel = null; }
  } catch { sentinel = null; }
  requesting = false;
}

export function keepAwake(on) {
  if (on === wanted) return;
  wanted = on;
  if (on) acquire();
  else if (sentinel) { sentinel.release().catch(() => {}); sentinel = null; }
}

// The lock is dropped whenever the page is hidden; take it back on return.
document.addEventListener('visibilitychange', acquire);
