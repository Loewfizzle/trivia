// FREEFALL — THE SOUNDS' TABLE (F2 — docs/freefall.md "THE SOUNDS"; the files: audio/freefall/ + CREDITS.md — all CC0; two are JAYWALK's).
// PURE, no imports (the unit tests read it; sfx.js plays it): every sound, its words in the SOUNDS list, its file + folder, its gain into
// the limiter, its PRIORITY. THE PICKS ARE THE OWNER's (take A of each).
// THE TRIGGERS (cuesOf — the engine's events → the sounds):
//   bounce       every landing on solid ground — SOFT, the note as recorded, never the same twice (± 1.5 dB)
//   whoosh + THE NOTE UP ITS SCALE   every CLEAN fall through a gap: the bounce's one note pitch-shifted in code, a step higher each
//                clean floor in a row (do re mi so la do′ re′ mi′ — holding at the top), back to the first note after a bounce
//   blaze        THE BLAZE lights · shatter  a slice shatters · crack (the crash, short + high + quiet)  the landing right after a
//   shatter came down on red (saved) · crash  out on red · lights-out  out in the dark · bottom  THE FINISH (ready for F3)
//   area-arrive  the ball enters an area · new-best  the fall that passes YOUR BEST   (the stage's: it knows the best)
//   F3B — THE BREAKTHROUGHS: skylight (floor 40: the glass breaks) · splashdown (floor 120: the plunge) · bottom (floor 200: the ball hits
//   the seabed — SOLO too now) take the place of the arrival's sound on those three floors, each timed to the moment the ball gets there;
//   fireworks = a finish by night, softly, right after bottom (the stage's: it knows the look)
/** a sound: `file` in audio/<dir>/, played at `rate`, `gain` into the limiter, its priority; `play` = it sounds in a run today */
const snd = (id, label, dir, gain, pri, play = true, more = null) => Object.freeze({ id, label, file: id, dir, rate: 1, gain, pri, play, ...more });
export const SOUNDS = Object.freeze([
  snd('bounce', 'BOUNCE — THE NOTE', 'freefall', 0.5, 1, true, { scale: true }),
  snd('whoosh', 'WHOOSH (THROUGH A GAP)', 'freefall', 0.34, 1),
  snd('blaze', 'THE BLAZE', 'freefall', 0.8, 3),
  snd('shatter', 'SHATTER', 'freefall', 0.85, 3),
  snd('crash', 'CRASH (OUT ON RED)', 'freefall', 1.0, 4),
  snd('lights-out', 'LIGHTS OUT', 'freefall', 1.0, 4),
  snd('bottom', 'THE BOTTOM (THE SEABED)', 'freefall', 0.9, 4),
  snd('area-arrive', 'AREA ARRIVAL', 'jaywalk', 1.0, 3),
  snd('new-best', 'NEW BEST', 'jaywalk', 1.15, 3),
  // F3B — THE BREAKTHROUGHS (CC0). skylight + splashdown come in ≈ 7 dB quieter than the rest (−23.4 / −23.7 LUFS against ≈ −16 — the
  // delivery's own measure): LOUDNESS-MATCHED HERE, by their gain (× 2.34 = + 7.4 dB · × 2.43 = + 7.7 dB over a shatter's 0.85 — the
  // build machine has no MP3 encoder; the limiter holds their peaks). fireworks: soft, on purpose.
  snd('skylight', 'THE SKYLIGHT (FLOOR 40)', 'freefall', 2.0, 4),
  snd('splashdown', 'THE SPLASHDOWN (FLOOR 120)', 'freefall', 2.05, 4),
  snd('fireworks', 'FIREWORKS (A NIGHT FINISH)', 'freefall', 0.5, 3),
]);
export const SOUND_IDS = Object.freeze(SOUNDS.map(s => s.id));
/** every file the table names: [dir, file] (the fetch list + the test that each exists) */
export const SOUND_FILES = Object.freeze(SOUNDS.map(s => Object.freeze([s.dir, s.file])));
export const VOICES = 8;
/** a bounce: gain ± 1.5 dB — never the same twice (its pitch is the scale's: never bent) */
export const BOUNCE_VARY_DB = 1.5;
/** THE MUSIC (F4's cartridge — the console plays it; the test page has none, as HIGH RISE's): the site's mood stations, the evening deck by night */
export const MUSIC = Object.freeze(['mood:evening', 'menu']);

/**
 * THE NOTE climbs a bright MAJOR-PENTATONIC scale — one step a clean floor in a row, HOLDING at the top after 8: the semitones over the
 * recorded note (C4 — do re mi so la do′ re′ mi′).
 */
export const SCALE_STEPS = Object.freeze([0, 2, 4, 7, 9, 12, 14, 16]);
/** the note's pitch (a playback rate) for `n` clean floors in a row (1 = the first fall after a bounce; 0 = a bounce: the note itself) */
export function scaleRate(n) {
  const i = n < 1 ? 0 : n > SCALE_STEPS.length ? SCALE_STEPS.length - 1 : Math.floor(n) - 1;
  return Math.pow(2, SCALE_STEPS[i] / 12);
}

/** F3B — the breakthroughs' moments after their `area` event (s): the glass + the water 8 ticks on · the seabed a whole fall (18 ticks) on */
export const BREAK_HIT_S = 8 / 60, BOTTOM_HIT_S = 18 / 60;
/** the floors whose arrival is a BREAKTHROUGH (its own sound takes the arrival's place) */
export const BREAK_AT = Object.freeze({ skylight: 40, splash: 120, seabed: 200 });
/** FIREWORKS (a finish by night — the stage plays it: it knows the look): softly, right after the seabed's hit */
export const CUE_FIREWORKS = Object.freeze({ id: 'fireworks', delay: BOTTOM_HIT_S + 0.9 });
// (ZERO GARBAGE — HIGH RISE's: every cue is one of a few CONSTANT records)
const CUE = Object.freeze({
  bounce: Object.freeze({ id: 'bounce', vary: true }), whoosh: Object.freeze({ id: 'whoosh' }), blaze: Object.freeze({ id: 'blaze' }), shatter: Object.freeze({ id: 'shatter' }),
  crash: Object.freeze({ id: 'crash' }), crack: Object.freeze({ id: 'crash', rate: 1.6, vol: 0.45 }), dark: Object.freeze({ id: 'lights-out' }), bottom: Object.freeze({ id: 'bottom' }), area: Object.freeze({ id: 'area-arrive', delay: 0.12 }),
  // F3B — THE BREAKTHROUGHS, each at the moment the ball gets there (the `area` event is the tick it leaves the floor above: the glass / the
  // water 8 ticks on, the seabed a whole fall on)
  skylight: Object.freeze({ id: 'skylight', delay: BREAK_HIT_S }), splash: Object.freeze({ id: 'splashdown', delay: BREAK_HIT_S }), seabed: Object.freeze({ id: 'bottom', delay: BOTTOM_HIT_S }),
});
/** the note's eight cues (one a step of the scale), a little quieter than a bounce (it rings on every floor of a dive) */
const CUE_NOTE = Object.freeze(SCALE_STEPS.map((_, i) => Object.freeze({ id: 'bounce', rate: scaleRate(i + 1), vol: 0.85 })));
export const CUE_NEW_BEST = Object.freeze({ id: 'new-best' });

/**
 * THE TRIGGERS (PURE): one frame's engine EVENTS (engine.js#stepTo / turn / hold — in order) from `from` on → the cues to play, written
 * into `out`: [{ id, rate?, vol?, vary?, delay? (s) }]. `late` = a batch that came after the page was away (a match's run went on
 * unseen): only its END sounds — never a burst of every bounce that "happened" while nobody watched.
 */
export function cuesOf(events, late = false, out = [], from = 0) {
  out.length = 0;
  let bed = false;
  for (let i = from; i < events.length; i++) {
    const e = events[i];
    if (e.e === 'out') { out.push(e.cause === 'dark' ? CUE.dark : CUE.crash); continue; }
    if (e.e === 'made') { if (!bed) out.push(CUE.bottom); continue; }   // (a finish: the seabed's hit was cued by the arrival just before it — a late batch has only this)
    if (late) continue;
    if (e.e === 'bounce') { out.push(CUE.bounce); if (e.red) out.push(CUE.crack); }
    else if (e.e === 'shatter') out.push(CUE.shatter);
    else if (e.e === 'fall') { out.push(CUE.whoosh); if (e.clean > 0) out.push(CUE_NOTE[e.clean > SCALE_STEPS.length ? SCALE_STEPS.length - 1 : e.clean - 1]); }
    else if (e.e === 'blaze') out.push(CUE.blaze);
    else if (e.e === 'area') {
      if (e.floor === BREAK_AT.skylight) out.push(CUE.skylight); else if (e.floor === BREAK_AT.splash) out.push(CUE.splash);
      else if (e.floor === BREAK_AT.seabed) { out.push(CUE.seabed); bed = true; } else out.push(CUE.area);
    }
  }
  return out;
}

/**
 * PRIORITY on a POOL of voice slots (HIGH RISE's): −1 = a voice is free · −2 = a full house and the new sound is outranked (dropped) ·
 * else the slot it takes over (the lowest-ranked sounding, the oldest of those)
 */
export function admitSlot(slots, pri, max = VOICES) {
  let n = 0, lo = -1;
  for (let i = 0; i < slots.length; i++) {
    const v = slots[i];
    if (!v.on) continue;
    n++;
    if (lo < 0 || v.pri < slots[lo].pri || (v.pri === slots[lo].pri && v.at < slots[lo].at)) lo = i;
  }
  if (n < max) return -1;
  return slots[lo].pri < pri ? lo : -2;
}
