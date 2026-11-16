// JAYWALK — THE SOUNDS' TABLE (H2 — docs/jaywalk.md "THE SOUNDS"). PURE, no imports (the unit tests read it; sfx.js plays it): every sound,
// its words in THE AUDITION, whether a `-b` backup was delivered, the loop, its gain into the limiter, its PRIORITY — and the voice rule.
/** every JAYWALK sound: id, its words in the audition, a B backup?, a loop (the whole WAV), its gain into the limiter, its priority */
export const SOUNDS = Object.freeze([
  { id: 'hop', label: 'HOP', b: true, gain: 1.5, pri: 1, play: true },
  { id: 'land-wood', label: 'LAND ON A LOG', b: true, gain: 1.7, pri: 1, play: true },
  { id: 'hit', label: 'HIT', b: false, gain: 2.1, pri: 3, play: true },
  { id: 'splash', label: 'SPLASH', b: false, gain: 2.2, pri: 3, play: true },
  { id: 'car-pass', label: 'CAR PASSING', b: true, gain: 1.6, pri: 0 },
  { id: 'horn', label: 'HORN', b: false, gain: 1.4, pri: 0 },
  { id: 'train-bell', label: 'TRAIN BELL (LOOP)', b: true, gain: 1.6, pri: 2, loop: true, ext: 'wav' },
  { id: 'train-pass', label: 'TRAIN PASSING', b: true, gain: 1.7, pri: 2 },
  { id: 'lights-die', label: 'THE LIGHTS DIE', b: false, gain: 1.8, pri: 2 },
  { id: 'landmark', label: 'LANDMARK', b: false, gain: 1.6, pri: 2 },
  { id: 'new-best', label: 'NEW BEST', b: true, gain: 1.6, pri: 2 },
  { id: 'respawn', label: 'RESPAWN', b: true, gain: 1.6, pri: 2 },
]);
export const VOICES = 8;
export const HOP_VARY = Object.freeze({ rate: 0.06, db: 2 });   // (a hop: pitch ± 6 %, gain ± 2 dB — never the same twice)
/** PRIORITY: a full house (8 voices) drops the new sound unless it outranks the quietest-ranked one sounding (the oldest of those goes) */
export function admit(voices, pri, max = VOICES) {
  if (voices.length < max) return { ok: true, drop: -1 };
  let lo = 0;
  for (let i = 1; i < voices.length; i++) if (voices[i].pri < voices[lo].pri || (voices[i].pri === voices[lo].pri && voices[i].at < voices[lo].at)) lo = i;
  return voices[lo].pri < pri ? { ok: true, drop: lo } : { ok: false, drop: -1 };
}

