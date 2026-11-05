// WHICH CITY IS SHOWING, and the clock it runs on (docs/audio.md#city-20-music). Shared by the audio — MOOD MUSIC follows City 2.0's own
// day, so it needs the clock that city runs on. No imports: the audio must not pull the title in.
// CITY 1.0 OUT (Nov 5): THE HARBOR is the only city — `?city=1` and `?city=2` are both just old links now; there is nothing to choose.
export const city = { clock: null };

/** The Harbor registers the clock it runs on: { now(): ms, tz(): zone, wx(): the weather it shows|null, q(name): a preview flag's value,
 *  show(): a forced show's mood ('party' — 8b1: the panel's PARTY + the forced shows play a party song) | null }.
 *  They are the scene's own live values, so the preview panel's time jumps and speeds move the music with the light. */
export function setCityClock(c) { city.clock = c; }
export const cityClock = () => city.clock;
