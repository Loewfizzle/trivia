// Keeps the screen on during games where the Screen Wake Lock API exists.
// The console's rule (app.js): a room whose game is playing. HE8 — a running game may narrow it with its OWN rule (`gameAwake(true | false)`;
// `null` = back to the console's): HOLD'EM keeps the screen on only while you're SEATED in a live match — never while you spectate, after you
// leave, once it ends. The browser drops the lock whenever the page is hidden; it is taken back on return while still wanted.
let sentinel = null;
let appWants = false;
let gameWants = null;
let requesting = false;

const wanted = () => appWants && gameWants !== false;

async function acquire() {
  if (!wanted() || sentinel || requesting || typeof navigator === 'undefined' || !('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
  requesting = true;
  try {
    sentinel = await navigator.wakeLock.request('screen');
    sentinel.addEventListener('release', () => { sentinel = null; });
    if (!wanted()) { sentinel.release().catch(() => {}); sentinel = null; }
  } catch { sentinel = null; }
  requesting = false;
}

function apply() {
  if (wanted()) acquire();
  else if (sentinel) { sentinel.release().catch(() => {}); sentinel = null; }
}

/** the console's rule: on while a room's game plays */
export function keepAwake(on) {
  on = !!on;
  if (on === appWants) return;
  appWants = on;
  apply();
}

/** HE8 — a game's own rule while its screen is up: true / false narrows the console's; null hands it back */
export function gameAwake(on) {
  const v = on == null ? null : !!on;
  if (v === gameWants) return;
  gameWants = v;
  apply();
}

/** (the tests: what this page wants + whether it holds a lock now) */
export const awakeState = () => ({ wanted: wanted(), held: !!sentinel, app: appWants, game: gameWants });

// The lock is dropped whenever the page is hidden; take it back on return.
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', acquire);
