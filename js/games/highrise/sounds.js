// HIGH RISE — THE SOUNDS' TABLE (S2 — docs/highrise.md "THE SOUNDS"; the files: audio/highrise/ + CREDITS.md — all CC0). PURE, no imports
// (the unit tests read it; sfx.js plays it): every sound, its words in the SOUNDS list, its TAKE (its file + the rate it plays at), its
// gain into the limiter, its PRIORITY. THE PICKS ARE FINAL (S3 — the owner, Nov 19: ALL A): drop as recorded · the chime starting an
// octave down · the slice = the glassy snap; S2's B takes (the slice's backup file, the two in-code variants) left the game.
// THE TRIGGERS (cuesOf — the engine's events → the sounds): drop (every landing, a slight pitch vary) · perfect (THE CHIME) · slice (a
// cut) · falling-piece ≈ 0.1 s after a slice · grow-back · streak (every 10 perfects in a row) · out · band-arrival · [pass = the
// match's, S4 — in the audition only].
/** a sound: its take = `file` (audio/highrise/<file>.mp3) played at `rate` */
const snd = (id, label, gain, pri, play, rate = 1, more = null) => Object.freeze({ id, label, file: id, rate, gain, pri, play, ...more });
export const SOUNDS = Object.freeze([
  snd('drop', 'DROP', 1.5, 1, true),
  snd('perfect', 'PERFECT — THE CHIME', 0.7, 3, true, 0.5, { chime: true }),   // (its first note = the crystal bell an octave down)
  snd('slice', 'SLICE', 1.18, 2, true),
  snd('falling-piece', 'FALLING PIECE', 0.32, 1, true),
  snd('grow-back', 'GROW-BACK', 0.4, 2, true),
  snd('streak', 'STREAK (EVERY 10)', 0.78, 3, true),
  snd('out', 'OUT', 2.1, 4, true),
  snd('band-arrival', 'BAND ARRIVAL', 0.53, 3, true),
  snd('pass', 'PASS (THE MATCH)', 0.65, 3, false),
]);
export const SOUND_IDS = Object.freeze(SOUNDS.map(s => s.id));
/** every file the table names (the fetch list + the test that each exists) */
export const SOUND_FILES = Object.freeze([...new Set(SOUNDS.map(s => s.file))]);
export const VOICES = 8;
/** a drop: pitch ± 4 %, gain ± 1.5 dB — never the same twice */
export const DROP_VARY = Object.freeze({ rate: 0.04, db: 1.5 });
/** the falling piece sounds this long after its slice (s) */
export const FALL_DELAY_S = 0.1;
/** a streak's sparkle: every this many perfects in a row */
export const STREAK_EVERY = 10;

/**
 * THE PERFECT CHIME climbs a bright MAJOR-PENTATONIC scale — one step a perfect in a row, HOLDING at the top after 8: the semitones over
 * the take's own first note (1 · 2 · 3 · 5 · 6 · 8 · 9 · 10 of the scale: do re mi so la do′ re′ mi′).
 */
export const CHIME_STEPS = Object.freeze([0, 2, 4, 7, 9, 12, 14, 16]);
/** the chime's pitch (a playback rate over the take's own) for a streak of `n` perfects in a row (1 = the first) */
export function chimeRate(n) {
  const i = n < 1 ? 0 : n > CHIME_STEPS.length ? CHIME_STEPS.length - 1 : Math.floor(n) - 1;
  return Math.pow(2, CHIME_STEPS[i] / 12);
}

/** PRIORITY: a full house (8 voices) drops the new sound unless it outranks the lowest-ranked one sounding (the oldest of those goes) */
export function admit(voices, pri, max = VOICES) {
  if (voices.length < max) return { ok: true, drop: -1 };
  let lo = 0;
  for (let i = 1; i < voices.length; i++) if (voices[i].pri < voices[lo].pri || (voices[i].pri === voices[lo].pri && voices[i].at < voices[lo].at)) lo = i;
  return voices[lo].pri < pri ? { ok: true, drop: lo } : { ok: false, drop: -1 };
}

/**
 * THE TRIGGERS (PURE): one frame's engine EVENTS (engine.js#stepTo / tap — in order) → the cues to play:
 *   [{ id, rate?, vary?, delay? (s) }]. `late` = a batch that came after the tab was hidden (the fuse ended the run unseen): only its
 *   OUT sounds — never a burst of every drop that "happened" while nobody watched.
 * A band's arrival is the VIEW's (it knows the band a floor stands in): see bandCue.
 */
export function cuesOf(events, late = false) {
  const out = [];
  for (const e of events) {
    if (e.e === 'out') out.push({ id: 'out' });
    if (late) continue;
    if (e.e === 'land') out.push({ id: 'drop', vary: true });
    else if (e.e === 'perfect') {
      out.push({ id: 'perfect', rate: chimeRate(e.streak) });
      if (e.streak > 0 && e.streak % STREAK_EVERY === 0) out.push({ id: 'streak' });
    } else if (e.e === 'cut') { out.push({ id: 'slice' }); out.push({ id: 'falling-piece', delay: FALL_DELAY_S }); }
    else if (e.e === 'grow') out.push({ id: 'grow-back' });
  }
  return out;
}
