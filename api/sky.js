// GET /api/sky — the live weather over the visitor's area, for the title's city (core/weather.js, docs/title.md).
// Where: Vercel adds the visitor's approximate location to every request (x-vercel-ip-latitude / -longitude / -city, from the
// IP address — no permission prompt, the browser never sees it). It is rounded to ~0.5° (≈ 35 miles) at once: that area is
// the cache key and all this function ever keeps. Weather: Open-Meteo (free, no key), cached per area for 15 minutes in
// memory and in wx/{area} (server-only), so a busy night costs a few requests an hour per area. With it, the past two hours of
// precipitation in quarter hours → wetAt (when the rain really stopped: RAINBOWS, core/rainbow.js).
// Without Vercel's headers (local dev, some networks): ?lat=&lon= (tests), else no weather — the city stays dry (no weather drawn).
// CITY 2.0 (Part 6a): every answer also carries `kp` — NOAA SWPC's planetary K-index in 3-hour blocks (12 h back, 36 h ahead;
// core/harbor-sky.js#parseKp), fetched once an hour for everyone (one global cache): the Harbor's aurora gets a bonus night on a
// real strong storm (Kp ≥ 7). With no location the answer is just { kp } (204 when neither is known).
import { route, send } from './_lib/http.js';
import { ref, val } from './_lib/fb.js';
import { normalize, areaOf, parseKp } from '../js/core/weather.js';

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
    + '&current=temperature_2m,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,visibility,is_day&wind_speed_unit=ms'
    // RAINBOWS: the last two hours of precipitation in quarter hours (when the rain really stopped), no forecast
    + '&minutely_15=precipitation&past_minutely_15=8&forecast_minutely_15=0&timeformat=unixtime';
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 4000);
  try {
    const r = await fetcher(url, { signal: ctl.signal });
    if (!r.ok) throw new Error(`open-meteo ${r.status}`);
    const j = await r.json();
    return j && j.current ? { cur: j.current, m15: j.minutely_15 || null } : null;
  } finally { clearTimeout(timer); }
}

/** The weather for a place (cached per area). fetcher: the network (tests pass a fake). */
export async function skyFor(place, { now = Date.now(), fetcher = fetch } = {}) {
  const hit = mem.get(place.key);
  if (hit && now - hit.at < SKY_TTL_MS) return { ...hit, city: place.city };
  let stored = null;
  try { stored = await val(`wx/${place.key}`); } catch { /* no database: fetch */ }
  if (stored && now - stored.at < SKY_TTL_MS) { mem.set(place.key, stored); return { ...stored, city: place.city }; }
  const got = await fetchWeather(place, fetcher);
  if (!got) return stored ? { ...stored, city: place.city } : null;
  const wx = normalize(got.cur, { lat: place.lat, lon: place.lon }, now, got.m15);
  mem.set(place.key, wx);
  if (mem.size > 500) mem.delete(mem.keys().next().value);
  try { ref(`wx/${place.key}`).set(wx).catch(() => {}); } catch { /* no database configured: memory only */ }
  return { ...wx, city: place.city };
}

export const KP_TTL_MS = 60 * 60_000;
const KP_URL = 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json';
let kpMem = null, kpFetch = (...a) => fetch(...a);
/** tests: the network for the Kp fetch (null = the real one) */
export const setKpFetcher = fn => { kpFetch = fn || ((...a) => fetch(...a)); kpMem = null; };
/** The planetary Kp blocks (cached an hour for everyone; a failed fetch keeps the last answer up to 6 hours). Null when unknown. */
export async function kpNow({ now = Date.now(), fetcher = kpFetch } = {}) {
  if (kpMem && now - kpMem.at < KP_TTL_MS) return kpMem.blocks;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 3500);
  try {
    const r = await fetcher(KP_URL, { signal: ctl.signal });
    if (!r.ok) throw new Error(`swpc ${r.status}`);
    const blocks = parseKp(await r.json(), now);
    if (blocks.length) { kpMem = { at: now, got: now, blocks }; return blocks; }
  } catch (e) { console.warn('kp', e && e.message); } finally { clearTimeout(timer); }
  if (kpMem && now - kpMem.got < 6 * KP_TTL_MS) { kpMem.at = now - KP_TTL_MS + 10 * 60_000; return kpMem.blocks; }   // (stale ≤ 6 h; retry in 10 min)
  return null;
}

export function clearSkyCache() { mem.clear(); kpMem = null; }

export default route(['GET'], async (req, res) => {
  const place = placeOf(req);
  let wx = null, kp = null;
  await Promise.all([
    place ? skyFor(place).then(v => { wx = v; }, e => console.warn('sky', e && e.message)) : null,
    kpNow().then(v => { kp = v; }, () => {}),
  ]);
  if (!wx && !kp) { res.statusCode = 204; res.setHeader('Cache-Control', 'no-store'); res.end(); return; }
  // private: the answer depends on where the caller is, so no shared CDN cache; the browser may keep it 10 minutes
  send(res, 200, wx ? { ...wx, kp } : { kp }, { 'Cache-Control': 'private, max-age=600' });
});
