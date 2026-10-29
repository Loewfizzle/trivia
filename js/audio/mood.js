// MOOD MUSIC — which mood the menu music is in, and which song plays next (docs/audio.md).
// Moods follow a LOCAL clock (each player's own outside a room; the host's in a lobby), with the real sunrise / sunset
// from the LIVING CITY's sky (core/sky.js), so the ?when=&tz= preview switch drives the music too:
//   late (midnight → sunrise) · morning (sunrise → 11 am) · day (11 am → sunset) · evening (sunset → midnight)
//   party: Friday and Saturday 8 pm → 2 am (overrides evening and late)
// The songs per mood come from data/mood-music.json (one line per song; keepers are the owner's picks).
// PURE helpers are exported for tests; the small device state (the per-mood shuffle bag) lives in localStorage.
import { look, skyClock, sunTimes, localParts } from '../core/sky.js';
import { isCity2, cityClock } from '../core/city.js';
import { cityMoodAt } from '../core/city-mood.js';
import { settings } from './settings.js';

export const MOODS = ['late', 'morning', 'day', 'evening', 'party'];
/** the MUSIC MOOD setting's choices (settings.musicMood; AUTO follows the clock) and how they read */
export const MOOD_CHOICES = ['auto', 'morning', 'day', 'evening', 'late', 'party'];
export const MOOD_LABEL = { auto: 'AUTO', morning: 'MORNING', day: 'DAY', evening: 'EVENING', late: 'LATE NIGHT', party: 'PARTY' };

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

/** The mood the listener CHOSE, or null for AUTO: the preview panel's / a link's &mood= (City 2.0, a preview — it wins over the
 *  saved setting) or the MUSIC MOOD setting (both cities; saved per device). */
export function fixedMood() { const f = fixedMoodFrom(); return f ? f.mood : null; }
/** ... and where the choice comes from: { mood, from: 'panel' (the preview panel / a link's &mood=) | 'setting' (MUSIC MOOD) } or null (AUTO) */
export function fixedMoodFrom() {
  let q = null;
  try {
    const cc = isCity2() ? cityClock() : null;
    q = cc && cc.q ? cc.q('mood') : typeof location !== 'undefined' && isCity2() ? new URLSearchParams(location.search).get('mood') : null;
  } catch { q = null; }
  if (q && MOODS.includes(q)) return { mood: q, from: 'panel' };
  return MOODS.includes(settings.musicMood) ? { mood: settings.musicMood, from: 'setting' } : null;
}

// CITY 2.0 has no clock of its own until the Harbor registers one (core/city.js); until then, one for the page (a running &when=)
let pageClock = null;
/** CITY 2.0's mood: its own day (core/city-mood.js) on the clock the Harbor runs — the preview panel's jumps and speeds included. */
export function cityMoodNow(ms, tz, wx) {
  const L = look(ms, tz, { wx });
  return cityMoodAt(L.local, L.sun ? L.sun.el : null);
}

/** The mood right now for this device's clock (or a given ms / tz, e.g. the host's). MUSIC MOOD (a chosen mood) wins; AUTO is
 *  City 1.0's rule (sunrise / 11 am / sunset / midnight, party Fri + Sat 8 pm → 2 am) or, in City 2.0, the Harbor's (cityMoodNow). */
export function moodNow(clock, ms, tz) {
  if (globalThis.__moodOverride) return globalThis.__moodOverride;   // test hook
  const ch = fixedMoodFrom(), chosen = ch ? ch.mood : null;
  if (ch && ch.from === 'panel') return chosen;
  if (isCity2()) {
    const cc = clock ? null : cityClock();
    // (8b1: a forced party SHOW — the preview panel's PARTY, &force=party / neon-party / finale / fireworks / drones / dance — plays a
    // party song over AUTO, so the show's lights follow a party song's grid; app.js#moodWatch switches to it at once)
    // (NIGHT-A — the owner's PARTY MODE test, "beat grid", no pulse with the music: a MUSIC MOOD saved on the device (EVENING…) won
    // over the forced show, so the party's lights ran on a calm song. The show now beats the saved setting; a mood the panel / a link
    // names (&mood=) still wins over everything.)
    { const sh = cc && cc.show ? cc.show() : null; if (sh && MOODS.includes(sh)) return sh; }
    if (chosen) return chosen;
    if (cc) return cityMoodNow(cc.now(), cc.tz(), cc.wx ? cc.wx() : null);
    const c = clock || pageClock || (pageClock = skyClock());
    return cityMoodNow(ms != null ? ms : c.now(), tz || c.tz, c.wx || null);
  }
  if (chosen) return chosen;
  return autoMood(clock || skyClock(), ms, tz);
}

/** City 1.0's AUTO (unchanged): sunrise / 11 am / sunset / midnight, the weekend party */
function autoMood(clock, ms = clock.now(), tz = clock.tz) {
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
/** (tests) the song list without a fetch */
export function setMoodData(d) { data = d; loading = null; }
/** the deck for a mood in the city that's showing: City 2.0's own (data `city2.moods`: the owner's songs, some shared between moods) or City 1.0's */
export const songsFor = mood => {
  const d = data;
  if (!d) return [];
  if (isCity2() && d.city2 && d.city2.moods && d.city2.moods[mood] && d.city2.moods[mood].length) return deckForNow(d.city2.moods[mood]);
  return (d.moods && d.moods[mood]) || [];
};
/** HOOK, not built (the owner's idea): once a City 2.0 deck has HALVES_FROM or more songs, play one half of it each week (core/week.js has
 *  the Eastern week keys) so a regular's repeats get rarer. Below that — every deck today — it is the whole deck. */
export const HALVES_FROM = 30;
export const deckForNow = ids => ids;
export const durOf = id => (data && data.songs[id] ? data.songs[id].dur : 180);

// ---------------------------------------------------------------- this device's bags (outside a room)
// (a deck per city: City 2.0's bags are their own, so a mood's list changing never confuses the other city's)
const KEY = m => (isCity2() ? `nd:moodbag:c2:${m}` : `nd:moodbag:${m}`);
export function nextForDevice(mood, last = null) {
  const ids = songsFor(mood);
  if (!ids.length) return null;
  let bag = null;
  try { bag = JSON.parse(localStorage.getItem(KEY(mood)) || 'null'); } catch { bag = null; }
  let r = nextFromBag(bag, ids, Math.random, last);
  // (a song shared between moods — the end of a MORNING song that is also in DAY — never plays twice in a row)
  if (r.id === last && ids.length > 1) r = nextFromBag(r.bag, ids, Math.random, last);
  try { localStorage.setItem(KEY(mood), JSON.stringify(r.bag)); } catch { /* private mode */ }
  return r.id;
}
