// CITY 2.0 MUSIC — which mood the Harbor's music is in (PURE; docs/audio.md#city-20-music). City 1.0 keeps core's old rule
// (audio/mood.js#moodAt: sunrise / 11 am / sunset / midnight); the Harbor follows ITS day, so the music lines up with the light:
//   LATE NIGHT   11 pm → dawn            (the small hours: before the sun is 6° below the horizon again)
//   MORNING      dawn → 11 am            (dawn = the sun back above -6°, the same twilight the neon's power-down runs in)
//   DAY          11 am → golden hour     (golden hour = the sun at 10° and falling: harbor-dark.js#DUSK's top knot)
//   EVENING      golden hour → 11 pm
//   PARTY        Friday + Saturday nights, the party show's hours (FP2: from the 8:30 pm warm-up → 2 am) — once the city has
//                powered up (harbor-dark.js#partyReady, the same gate the show starts on), so a long summer dusk is still EVENING
import { inPartyWindow, partyHour } from './party.js';
import { darkness, partyReady } from './harbor-dark.js';
import { HARBOR_PARTY } from './harbor-show.js';

export const MOOD_IDS = ['late', 'morning', 'day', 'evening', 'party'];
export const DAWN_EL = -6;          // °: the morning starts when the sun is back above this
export const GOLDEN_EL = 10;        // °: the evening starts when the afternoon sun is at or below this
export const MORNING_TO_H = 11;     // the morning ends, the day begins
export const LATE_FROM_H = 23;      // the late night begins

/**
 * The mood at a local time. local: { dow (0 Sun..6 Sat), h, mi, s? } (core/sky.js#localParts); el: the real sun's elevation (°)
 * in that place, or null when unknown (fixed hours then: dawn 6, golden hour 6 pm).
 */
export function cityMoodAt(local, el = null) {
  const sun = el != null && Number.isFinite(+el);
  if (inPartyWindow(local) && partyHour(local) >= HARBOR_PARTY.warm && (!sun || partyReady(darkness({ el: +el })))) return 'party';
  const hr = local.h + (local.mi || 0) / 60;
  if (hr < 12) {
    if (hr >= MORNING_TO_H) return 'day';
    if (hr < 3) return 'late';                                  // (never a morning before 3 am, even where the sun doesn't set)
    return (sun ? +el < DAWN_EL : hr < 6) ? 'late' : 'morning';
  }
  if (hr >= LATE_FROM_H) return 'late';
  return (sun ? +el <= GOLDEN_EL : hr >= 18) ? 'evening' : 'day';
}
