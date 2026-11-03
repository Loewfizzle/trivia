// THE ACHIEVEMENTS' EVENTS from this phone (PROGRESSION A — api/_lib/events.js decides what each is worth; a repeat is a no-op there).
// Fire-and-forget polish: nothing waits on it, nothing breaks without /api, each event at most once a page load (the server's own
// guards do the rest). Only with a profile on this device (a stranger's first visit has nothing to earn yet).
//   knock       the speakeasy's door was knocked (title.js)
//   watchStart  the harbor came into view (THE WATCHER's hour starts on the SERVER's clock)
//   watch       THE WATCHER's reward fired on this device (scene.js) — the server checks its own hour
//   weather     a match just ended (the podium) — the server looks up the REAL weather where the phone is
// An event that earned something says so: a quiet toast (ACHIEVEMENT · KNOCK KNOCK) + the achievement bell.
import { api } from './api.js';
import { myPid } from './me.js';

const sent = new Set();

async function told(r) {
  try {
    const [{ ACH }, { ITEM }, { toast }, { pgSfx }] = await Promise.all([import('../core/achievements.js'), import('../core/items.js'), import('../ui/toast.js'), import('../audio/progress-sfx.js')]);
    const a = (r.ach || []).map(id => ACH[id]).filter(Boolean)[0];
    const it = !a && (r.items || []).map(id => ITEM[id]).filter(Boolean)[0];
    if (!a && !it) return;
    toast(a ? `ACHIEVEMENT · ${a.name}` : `UNLOCKED · ${it.name}`, 'ok', 4200);
    pgSfx('achievement');
  } catch { /* polish */ }
}

export function progressEvent(ev, { again = false } = {}) {
  if ((!again && sent.has(ev)) || !myPid()) return;
  sent.add(ev);
  api('profile', { action: 'event', ev }).then(r => { if (r && ((r.ach && r.ach.length) || (r.items && r.items.length))) told(r); }).catch(() => {});
}
