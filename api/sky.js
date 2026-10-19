// GET /api/sky — the live weather over the visitor's area, for the title's city (core/weather.js, docs/title.md).
// Where: Vercel adds the visitor's approximate location to every request (x-vercel-ip-latitude / -longitude / -city, from the
// IP address — no permission prompt, the browser never sees it). It is rounded to ~0.5° (≈ 35 miles) at once: that area is
// the cache key and all this function ever keeps. Weather: Open-Meteo (free, no key), cached per area for 15 minutes in
// memory and in wx/{area} (server-only), so a busy night costs a few requests an hour per area.
// Without Vercel's headers (local dev, some networks): ?lat=&lon= (tests), else 204 — the city stays dry (no weather drawn).
import { route, send } from './_lib/http.js';
import { ref, val } from './_lib/fb.js';
import { normalize, areaOf } from '../js/core/weather.js';

export const SKY_TTL_MS = 15 * 60_000;
const mem = new Map();

const header = (req, k) => { const v = req.headers[k]; return v == null ? null : decodeURIComponent(String(v)); };

/** Where the visitor is (rounded), from Vercel's headers or ?lat&lon. Null when unknown. */
export function placeOf(req) {
  const q = new URL(req.url || '/', 'http://x').searchParams;
  const lat = header(req, 'x-vercel-ip-latitude') ?? q.get('lat');
  const lon = header(req, 'x-vercel-ip-longitude') ?? q.get('lon');
  const a = areaOf(lat, lon);
  if (!a) return null;
  return { ...a, city: header(req, 'x-vercel-ip-city') || null };
}

async function fetchWeather(a, fetcher) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${a.lat}&longitude=${a.lon}`
    + '&current=temperature_2m,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,visibility,is_day&wind_speed_unit=ms';
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 4000);
  try {
    const r = await fetcher(url, { signal: ctl.signal });
    if (!r.ok) throw new Error(`open-meteo ${r.status}`);
    const j = await r.json();
    return j && j.current ? j.current : null;
  } finally { clearTimeout(timer); }
}

/** The weather for a place (cached per area). fetcher: the network (tests pass a fake). */
export async function skyFor(place, { now = Date.now(), fetcher = fetch } = {}) {
  const hit = mem.get(place.key);
  if (hit && now - hit.at < SKY_TTL_MS) return { ...hit, city: place.city };
  let stored = null;
  try { stored = await val(`wx/${place.key}`); } catch { /* no database: fetch */ }
  if (stored && now - stored.at < SKY_TTL_MS) { mem.set(place.key, stored); return { ...stored, city: place.city }; }
  const cur = await fetchWeather(place, fetcher);
  if (!cur) return stored ? { ...stored, city: place.city } : null;
  const wx = normalize(cur, { lat: place.lat, lon: place.lon }, now);
  mem.set(place.key, wx);
  if (mem.size > 500) mem.delete(mem.keys().next().value);
  try { ref(`wx/${place.key}`).set(wx).catch(() => {}); } catch { /* no database configured: memory only */ }
  return { ...wx, city: place.city };
}

export function clearSkyCache() { mem.clear(); }

export default route(['GET'], async (req, res) => {
  const place = placeOf(req);
  if (!place) { res.statusCode = 204; res.setHeader('Cache-Control', 'no-store'); res.end(); return; }
  let wx = null;
  try { wx = await skyFor(place); } catch (e) { console.warn('sky', e && e.message); }
  if (!wx) { res.statusCode = 204; res.setHeader('Cache-Control', 'no-store'); res.end(); return; }
  // private: the answer depends on where the caller is, so no shared CDN cache; the browser may keep it 10 minutes
  send(res, 200, wx, { 'Cache-Control': 'private, max-age=600' });
});
