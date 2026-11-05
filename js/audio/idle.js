// SHELL 2.0 B2 — THE MUSIC's IDLE CUTOFF (the owner, Nov 4 7:18 pm): a page left open with no tap, key or scroll for 5 HOURS fades its music
// out (the page-quiet switch — audio/settings.js#setPageQuiet(…, 'idle'): this page only, never saved) and says so ONCE: "Music paused — tap
// to bring it back" (the one message, kept up until the next tap). Any tap / key / scroll / wheel brings it back. NEVER during a match in a
// room (a long game, a phone left on the table between rounds of one). Wall-clock time is right here (not game timing).
//   startIdleCutoff({ now, inMatch, say }) → { check(), wake(), quiet(), stop() }   — app.js starts it once; tests fake `now`
import { setPageQuiet } from './settings.js';

export const IDLE_MS = 5 * 3600e3;
export const IDLE_LINE = 'Music paused — tap to bring it back';
/** PURE — is the page idle now? (the last input's time, now, whether a match is on screen) */
export const isIdle = ({ last, now, inMatch }) => !inMatch && now - last >= IDLE_MS;

export function startIdleCutoff({ now = () => Date.now(), inMatch = () => false, say = null, target = typeof window !== 'undefined' ? window : null, every = 60e3 } = {}) {
  let last = now(), quiet = false, msg = null;
  const wake = () => {
    last = now();
    if (!quiet) return;
    quiet = false; setPageQuiet(false, 'idle');
    if (msg && msg.close) { try { msg.close(); } catch { /* gone */ } } msg = null;
  };
  const check = () => {
    if (quiet || !isIdle({ last, now: now(), inMatch: inMatch() })) return false;
    quiet = true; setPageQuiet(true, 'idle');
    try { msg = say ? say(IDLE_LINE) : null; } catch { msg = null; }
    return true;
  };
  const EV = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'];
  if (target) for (const e of EV) target.addEventListener(e, wake, { capture: true, passive: true });
  const t = every ? setInterval(check, every) : null;
  return { check, wake, quiet: () => quiet, stop() { if (t) clearInterval(t); if (target) for (const e of EV) target.removeEventListener(e, wake, { capture: true }); } };
}
