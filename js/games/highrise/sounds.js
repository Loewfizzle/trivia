// HIGH RISE — THE SOUNDS' TABLE (S2 — docs/highrise.md "THE SOUNDS"; the files: audio/highrise/ + CREDITS.md — all CC0). PURE, no imports
// (the unit tests read it; sfx.js plays it): every sound, its words in THE AUDITION, its TAKES (A = the pick · B = the backup — a second
// FILE where one was delivered, else an IN-CODE VARIANT: the same file at another pitch), its gain into the limiter, its PRIORITY.
// THE TRIGGERS (cuesOf — the engine's events → the sounds): drop (every landing, a slight pitch vary) · perfect (THE CHIME) · slice (a
// cut) · falling-piece ≈ 0.1 s after a slice · grow-back · streak (every 10 perfects in a row) · out · band-arrival · [pass = the
// match's, S4 — in the audition only].
/** a take: `file` (audio/highrise/<file>.mp3) played at `rate` */
const take = (file, rate = 1) => Object.freeze({ file, rate });
export const SOUNDS = Object.freeze([
  { id: 'drop', label: 'DROP', takes: { a: take('drop'), b: take('drop', 0.78) }, about: { a: 'as recorded', b: 'lower — a heavier slab' }, gain: 1.5, pri: 1, play: true },
  { id: 'perfect', label: 'PERFECT — THE CHIME', takes: { a: take('perfect', 0.5), b: take('perfect', 0.6674) }, about: { a: 'starts low (an octave down)', b: 'starts higher (a fifth down)' }, gain: 0.7, pri: 3, play: true, chime: true },
  { id: 'slice', label: 'SLICE', takes: { a: take('slice'), b: take('slice-b') }, about: { a: 'the pick — a glassy snap', b: 'the backup — shorter, clickier' }, gain: { a: 1.18, b: 2.2 }, pri: 2, play: true },
  { id: 'falling-piece', label: 'FALLING PIECE', takes: { a: take('falling-piece') }, gain: 0.32, pri: 1, play: true },
  { id: 'grow-back', label: 'GROW-BACK', takes: { a: take('grow-back') }, gain: 0.4, pri: 2, play: true },
  { id: 'streak', label: 'STREAK (EVERY 10)', takes: { a: take('streak') }, gain: 0.78, pri: 3, play: true },
  { id: 'out', label: 'OUT', takes: { a: take('out') }, gain: 2.1, pri: 4, play: true },
  { id: 'band-arrival', label: 'BAND ARRIVAL', takes: { a: take('band-arrival') }, gain: 0.53, pri: 3, play: true },
  { id: 'pass', label: 'PASS (THE MATCH)', takes: { a: take('pass') }, gain: 0.65, pri: 3, play: false },
].map(s => Object.freeze(s)));
export const SOUND_IDS = Object.freeze(SOUNDS.map(s => s.id));
/** every file the table names (the fetch list + the test that each exists) */
export const SOUND_FILES = Object.freeze([...new Set(SOUNDS.flatMap(s => Object.values(s.takes).map(t => t.file)))]);
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
