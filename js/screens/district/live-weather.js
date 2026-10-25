// LIVE WEATHER on the page: asks /api/sky (the visitor's area, never a location prompt) a moment after the title paints, then
// every 15 minutes while the page is open and when it comes back to the front. The last answer is kept ON THIS DEVICE (POLISH 5:
// localStorage, while it is fresh — 45 min) so a reload or the next visit paints its FIRST frame with the weather already in: City
// 2.0's load gate waits for it (weatherSettled) instead of the city fading from clear to overcast after it showed. Polish, never a
// dependency: no answer = a dry city (core/sky.js).
import { isFresh } from '../../core/weather.js';

const KEY = 'nd:wx';
const WET = 'nd:wet';          // RAINBOWS: when this device last knew it rained here (ms), kept across visits
const EVERY = 15 * 60_000;
const KP = 'nd:kp';           // CITY 2.0 (Part 6a): NOAA's planetary Kp blocks [[ms, kp], …] — the aurora's storm night
let wx = null, kp = null, started = false, at = 0, inflight = null, settled = false;
const readCache = st => { try { const s = JSON.parse(st.getItem(KEY) || 'null'); return isFresh(s) ? s : null; } catch { return null; } };
try { wx = readCache(localStorage) || readCache(sessionStorage); } catch { /* private mode */ }
if (wx) { settled = true; at = Math.min(Date.now(), wx.got || 0); }    // (fetched less than 15 min ago: no new ask until then)
try { const k = JSON.parse(sessionStorage.getItem(KP) || 'null'); if (k && Array.isArray(k.b) && Date.now() - k.at < 6 * 3600e3) kp = k; } catch { /* private mode */ }

async function load() {
  if (inflight) return inflight;
  at = Date.now();
  inflight = (async () => {
    try {
      const r = await fetch('/api/sky', { cache: 'no-store' });
      if (r.status !== 200) return;
      const j = await r.json();
      if (j && Array.isArray(j.kp) && j.kp.length) { kp = { b: j.kp, at: Date.now() }; try { sessionStorage.setItem(KP, JSON.stringify(kp)); } catch { /* fine */ } }
      if (j && j.kind) {
        wx = { ...j, at: j.at || Date.now(), got: Date.now() };
        const txt = JSON.stringify(wx);
        try { localStorage.setItem(KEY, txt); } catch { try { sessionStorage.setItem(KEY, txt); } catch { /* fine */ } }
        if (wx.wetAt) rememberWet(wx.wetAt);
      }
    } catch { /* offline, no /api: seeded weather */ } finally { inflight = null; settled = true; }
  })();
  return inflight;
}

/** Starts the feed once (idempotent). */
export function startWeather() {
  if (started || typeof window === 'undefined') return;
  started = true;
  // every 15 minutes, whatever the last answer was (no location → 204: ask again in 15 minutes, not every minute)
  const kick = () => { if (Date.now() - at > EVERY) load(); };
  // nothing fresh on this device: ask AT ONCE (City 2.0 holds its first frame dark for it, up to a cap); a fresh answer in hand:
  // refresh when the page is idle — the title never waits for that one
  if (!wx) kick();
  else { const idle = window.requestIdleCallback || (fn => setTimeout(fn, 1200)); idle(() => kick(), { timeout: 2500 }); }
  setInterval(() => { if (document.visibilityState === 'visible') kick(); }, 60_000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') kick(); });
}

function rememberWet(ms) { try { if (ms > (Number(localStorage.getItem(WET)) || 0)) localStorage.setItem(WET, String(ms)); } catch { /* private mode */ } }
/** RAINBOWS: when it last really rained here (ms) — the live answer's wetAt, or what this device remembers (a reload, a
 *  visit right after the rain); null when unknown. Never invented: only ever a time the weather service reported rain. */
export function lastWetAt() {
  let m = null;
  try { m = Number(localStorage.getItem(WET)) || null; } catch { /* private mode */ }
  const w = wx && wx.wetAt ? wx.wetAt : null;
  return w && m ? Math.max(w, m) : w || m;
}

/** POLISH 5: has the weather had its chance? (a fresh answer on this device, or the first ask answered / failed) */
export const weatherSettled = () => settled || !started;

/** The live weather right now (null when unknown or stale). */
export const liveWeather = () => (isFresh(wx) ? wx : null);

/** CITY 2.0: the planetary Kp blocks from /api/sky ([[ms, kp], …], ≤ 6 h old) or null — the Harbor's aurora (a storm night) */
export const liveKp = () => (kp && Date.now() - kp.at < 6 * 3600e3 ? kp.b : null);
