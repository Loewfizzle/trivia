// MOOD MUSIC — which mood the menu music is in, and which song plays next (docs/audio.md).
// Moods follow a LOCAL clock (each player's own outside a room; the host's in a lobby), with the real sunrise / sunset
// from the LIVING CITY's sky (core/sky.js), so the ?when=&tz= preview switch drives the music too:
//   late (midnight → sunrise) · morning (sunrise → 11 am) · day (11 am → sunset) · evening (sunset → midnight)
//   party: Friday and Saturday 8 pm → 2 am (overrides evening and late)
// The songs per mood come from data/mood-music.json (one line per song; keepers are the owner's picks).
// PURE helpers are exported for tests; the small device state (the per-mood shuffle bag) lives in localStorage.
import { look, skyClock, sunTimes, localParts } from '../core/sky.js';

export const MOODS = ['late', 'morning', 'day', 'evening', 'party'];

/** PURE: the mood at a local time. p: { dow (0 Sun..6 Sat), h, mi }; rise / set: local hours (fractional). */
export function moodAt(p, rise = 6.5, set = 19) {
  const hr = p.h + (p.mi || 0) / 60;
  const party = (p.dow === 5 && hr >= 20) || (p.dow === 6 && (hr < 2 || hr >= 20)) || (p.dow === 0 && hr < 2);
  if (party) return 'party';
  if (hr < rise) return 'late';
  if (hr < 11) return 'morning';
  if (hr < set) return 'day';
  return 'evening';
}

/** The mood right now for this device's clock (or a given ms / tz, e.g. the host's). */
export function moodNow(clock = skyClock(), ms = clock.now(), tz = clock.tz) {
  if (globalThis.__moodOverride) return globalThis.__moodOverride;   // test hook
  const L = look(ms, tz, {});
  const p = localParts(ms, tz);
  let rise = 6.5, set = 19;
  try {
    const st = sunTimes(ms, tz, L.lat, L.lon);
    const toH = t => { const q = localParts(t, tz); return q.h + q.mi / 60; };
    if (st && st.rise) rise = toH(st.rise);
    if (st && st.set) set = toH(st.set);
  } catch { /* defaults */ }
  return moodAt(p, rise, Math.max(set, 12));
}

/** PURE: the next song from a shuffle bag. bag: { order: [...ids], i } for this mood; never repeats a song until every song in
 *  the mood has played, and a new cycle never starts with the song that just ended. Returns { id, bag }. */
export function nextFromBag(bag, ids, rnd = Math.random, last = null) {
  const same = bag && bag.order && bag.order.length === ids.length && bag.order.every(x => ids.includes(x));
  let b = same ? { order: bag.order.slice(), i: bag.i } : null;
  if (!b || b.i >= b.order.length) {
    const o = ids.slice();
    for (let k = o.length - 1; k > 0; k--) { const j = Math.floor(rnd() * (k + 1)); [o[k], o[j]] = [o[j], o[k]]; }
    if (o.length > 1 && o[0] === last) [o[0], o[1]] = [o[1], o[0]];
    b = { order: o, i: 0 };
  }
  const id = b.order[b.i];
  return { id, bag: { order: b.order, i: b.i + 1 } };
}

// ---------------------------------------------------------------- the song list (loaded once)
let data = null, loading = null;
export function loadMoodMusic() {
  if (data) return Promise.resolve(data);
  if (!loading) loading = fetch(new URL('../../data/mood-music.json', import.meta.url)).then(r => r.json()).then(d => { data = d; return d; }).catch(() => null);
  return loading;
}
export const moodData = () => data;
export const songsFor = mood => (data && data.moods && data.moods[mood]) || [];
export const durOf = id => (data && data.songs[id] ? data.songs[id].dur : 180);

// ---------------------------------------------------------------- this device's bags (outside a room)
const KEY = m => `nd:moodbag:${m}`;
export function nextForDevice(mood, last = null) {
  const ids = songsFor(mood);
  if (!ids.length) return null;
  let bag = null;
  try { bag = JSON.parse(localStorage.getItem(KEY(mood)) || 'null'); } catch { bag = null; }
  const r = nextFromBag(bag, ids, Math.random, last);
  try { localStorage.setItem(KEY(mood), JSON.stringify(r.bag)); } catch { /* private mode */ }
  return r.id;
}
