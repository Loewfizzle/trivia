// LIVE WEATHER on the page: asks /api/sky (the visitor's area, never a location prompt) a moment after the title paints, then
// every 15 minutes while the page is open and when it comes back to the front. The last answer is kept for the session so
// the menus and a reload don't wait. Polish, never a dependency: no answer = a dry city (core/sky.js).
import { isFresh } from '../../core/weather.js';

const KEY = 'nd:wx';
const EVERY = 15 * 60_000;
let wx = null, started = false, at = 0, inflight = null;
try { const s = JSON.parse(sessionStorage.getItem(KEY) || 'null'); if (isFresh(s)) wx = s; } catch { /* private mode */ }

async function load() {
  if (inflight) return inflight;
  at = Date.now();
  inflight = (async () => {
    try {
      const r = await fetch('/api/sky', { cache: 'no-store' });
      if (r.status !== 200) return;
      const j = await r.json();
      if (j && j.kind) { wx = { ...j, at: j.at || Date.now() }; try { sessionStorage.setItem(KEY, JSON.stringify(wx)); } catch { /* fine */ } }
    } catch { /* offline, no /api: seeded weather */ } finally { inflight = null; }
  })();
  return inflight;
}

/** Starts the feed once (idempotent). */
export function startWeather() {
  if (started || typeof window === 'undefined') return;
  started = true;
  // every 15 minutes, whatever the last answer was (no location → 204: ask again in 15 minutes, not every minute)
  const kick = () => { if (Date.now() - at > EVERY) load(); };
  // after the first paint, when the page is idle: the title never waits for the weather
  const idle = window.requestIdleCallback || (fn => setTimeout(fn, 1200));
  idle(() => kick(), { timeout: 2500 });
  setInterval(() => { if (document.visibilityState === 'visible') kick(); }, 60_000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') kick(); });
}

/** The live weather right now (null when unknown or stale). */
export const liveWeather = () => (isFresh(wx) ? wx : null);
