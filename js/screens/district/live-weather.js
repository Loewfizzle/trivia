// LIVE WEATHER on the page: asks /api/sky (the visitor's area, never a location prompt) a moment after the title paints, then
// every 15 minutes while the page is open and when it comes back to the front. The last answer is kept ON THIS DEVICE (POLISH 5:
// localStorage, while it is fresh — 45 min) so a reload or the next visit paints its FIRST frame with the weather already in: City
// 2.0's load gate waits for it (weatherSettled) instead of the city fading from clear to overcast after it showed. Polish, never a
// dependency: no answer = a dry city (core/sky.js).
import { isFresh, WEATHER_TTL_MS } from '../../core/weather.js';

const KEY = 'nd:wx';
const WET = 'nd:wet';          // RAINBOWS: when this device last knew it rained here (ms), kept across visits
const EVERY = 15 * 60_000;
const KP = 'nd:kp';           // CITY 2.0 (Part 6a): NOAA's planetary Kp blocks [[ms, kp], …] — the aurora's storm night
let wx = null, kp = null, started = false, at = 0, inflight = null, settled = false, fromCache = false;
const readCache = st => { try { const s = JSON.parse(st.getItem(KEY) || 'null'); return isFresh(s) ? s : null; } catch { return null; } };
try { wx = readCache(localStorage) || readCache(sessionStorage); } catch { /* private mode */ }
if (wx) { settled = true; fromCache = true; at = Math.min(Date.now(), wx.got || 0); }    // (fetched less than 15 min ago: no new ask until then)
try { const k = JSON.parse(sessionStorage.getItem(KP) || 'null'); if (k && Array.isArray(k.b) && Date.now() - k.at < 6 * 3600e3) kp = k; } catch { /* private mode */ }

let lastAsk = null, retried = false;
async function load() {
  if (inflight) return inflight;
  at = Date.now();
  const t0 = Date.now();
  let retry = false;
  inflight = (async () => {
    try {
      const r = await fetch('/api/sky', { cache: 'no-store' });
      lastAsk = { status: r.status, ms: Date.now() - t0, err: null };
      // (SP3: a FAILED first ask — a network blip, a 5xx — is asked once more at once before the load gate counts it as settled; a
      // 204 (no location) is an answer)
      if (r.status !== 200) { retry = r.status >= 500 && !retried; return; }
      const j = await r.json();
      if (j && Array.isArray(j.kp) && j.kp.length) { kp = { b: j.kp, at: Date.now() }; try { sessionStorage.setItem(KP, JSON.stringify(kp)); } catch { /* fine */ } }
      if (j && j.kind) {
        wx = { ...j, at: j.at || Date.now(), got: Date.now() }; fromCache = false;
        const txt = JSON.stringify(wx);
        try { localStorage.setItem(KEY, txt); } catch { try { sessionStorage.setItem(KEY, txt); } catch { /* fine */ } }
        if (wx.wetAt) rememberWet(wx.wetAt);
      }
    } catch (e) { lastAsk = { status: 0, ms: Date.now() - t0, err: String((e && e.message) || e).slice(0, 80) }; retry = !retried; /* offline, no /api: seeded weather */ } finally {
      inflight = null;
      if (retry && !wx) { retried = true; setTimeout(() => { load(); }, 300); } else settled = true;
    }
  })();
  return inflight;
}

/** Starts the feed once (idempotent). */
export function startWeather() {
  if (started || typeof window === 'undefined') return;
  started = true;
  // every 15 minutes, whatever the last answer was (no location → 204: ask again in 15 minutes, not every minute)
  // (SP3 — the owner's load log: "+0.48 s wx none (seeded)" — a SAVED answer is aged from the weather's own slot (up to ~30 min old when
  // it was fetched), so one can go stale moments after the reveal while the 15-min poll waits. Ask again as soon as it is within 15 min
  // of stale — at most once a minute)
  const nearStale = () => !!wx && Date.now() - wx.at > WEATHER_TTL_MS - 15 * 60_000;
  const kick = () => { const since = Date.now() - at; if (since > EVERY || (nearStale() && since > 60_000)) load(); };
  // nothing fresh on this device: ask AT ONCE (City 2.0 holds its first frame dark for it, up to a cap); a fresh answer in hand:
  // refresh when the page is idle — the title never waits for that one
  if (!wx || nearStale()) load();
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

/** SP3: the last ask's outcome { status, ms, err } (the load log + the readout) */
export const weatherAsk = () => lastAsk;

/** POLISH 5: has the weather had its chance? (a fresh answer on this device, or the first ask answered / failed) */
export const weatherSettled = () => settled || !started;

/** SP3: where the answer in hand came from — { src: 'live' (asked this visit) | 'cached' (kept on this device) | null, age (min since
 *  the weather's slot), got (when it was fetched) } */
export const weatherSource = () => (wx ? { src: fromCache ? 'cached' : 'live', age: Math.round((Date.now() - wx.at) / 60000), got: wx.got || null, fresh: isFresh(wx) } : { src: null, age: null, got: null, fresh: false });

/** The live weather right now (null when unknown or stale). */
export const liveWeather = () => (isFresh(wx) ? wx : null);

/** CITY 2.0: the planetary Kp blocks from /api/sky ([[ms, kp], …], ≤ 6 h old) or null — the Harbor's aurora (a storm night) */
export const liveKp = () => (kp && Date.now() - kp.at < 6 * 3600e3 ? kp.b : null);
