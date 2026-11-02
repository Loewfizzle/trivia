// WHICH CITY IS SHOWING, and the clock it runs on (docs/audio.md#city-20-music). Shared by the audio — MOOD MUSIC follows City 2.0's own
// day, so it needs to know which city is up and the clock that city runs on — and the title, which says when the Harbor failed to
// load. No imports: the audio must not pull the title in.
//   (no flag)  City 2.0 — THE QUIET DEFAULT FLIP (WINDOWS, Nov 1 — the owner): title.js loads the Harbor; a failed load calls cityFailed()
//              and everything falls back to City 1.0. `?city=2` (every older link + test) still means the Harbor.
//   ?city=1    City 1.0 — kept in the code until the switch-over deletes it, UNTESTED since WINDOWS.
export const CITY1_URL = typeof location !== 'undefined' && /[?&]city=1(?:&|$)/.test(location.search || '');
export const city = { two: typeof location !== 'undefined' && !CITY1_URL, clock: null };
export const isCity2 = () => city.two;
export function cityFailed() { city.two = false; city.clock = null; }

/** The Harbor registers the clock it runs on: { now(): ms, tz(): zone, wx(): the weather it shows|null, q(name): a preview flag's value,
 *  show(): a forced show's mood ('party' — 8b1: the panel's PARTY + the forced shows play a party song) | null }.
 *  They are the scene's own live values, so the preview panel's time jumps and speeds move the music with the light. */
export function setCityClock(c) { city.clock = c; }
export const cityClock = () => city.clock;
