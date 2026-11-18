// CITY CONTROLS A — THE RADIO DESK's SOUNDS (Grok's picks: art/city-sfx/radio/claude-notes.txt → scripts/add-city-sfx.py → the radio-* slots
// of core/city-sounds.js): the jack in / out, the FIRE thunk, the dial's detent tick, the band button, the soft "no", the safety cover.
// The owner's phone only, quiet ("felt not heard"); audio is polish — an empty / locked / muted engine plays nothing, the desk works the same.
import { citySound, cityPrefetch } from '../../audio/city-sound.js';

const SLOT = Object.freeze({ jackIn: 'radio-jack-in', jackOut: 'radio-jack-out', fire: 'radio-fire', tick: 'radio-tick', band: 'radio-band', denied: 'radio-denied', coverOpen: 'radio-cover-open', coverClose: 'radio-cover-close' });

export function radioSound() {
  let warm = false;
  return {
    /** one of SLOT's names → plays a take (never throws) */
    play(name) {
      const slot = SLOT[name]; if (!slot) return;
      try {
        if (!warm) { warm = true; for (const s of Object.values(SLOT)) cityPrefetch(s); }
        citySound(slot, { jitter: 0.02 });
      } catch { /* polish */ }
    },
    slots: SLOT,
  };
}
