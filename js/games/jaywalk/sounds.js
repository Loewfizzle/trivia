// JAYWALK — THE SOUNDS' TABLE (H2 — docs/jaywalk.md "THE SOUNDS"). PURE, no imports (the unit tests read it; sfx.js plays it): every sound,
// its words in THE AUDITION, whether a `-b` backup was delivered, the loop, its gain into the limiter, its PRIORITY — and the voice rule.
/** every JAYWALK sound: id, its words in the audition, a B backup?, a loop (the whole WAV), its gain into the limiter, its priority,
 *  `max` (how many of it may sound at once), `fade` (s — H5B: it NEVER stops dead: its own end, a stop and a dropped voice all ramp
 *  out through its gain). H5A — ALL IN PLAY (the owner picked ALL A): THE PRIORITY = your own hit / splash (4) > the train · the
 *  lights dying · a gateway · a new best (3) > a horn (2) > a hop · a landing (1).
 *  H5B (the owner, playing H5A): THE HORN AT HALF its level (1.0 → 0.5) · the CAR-PASS near-miss whoosh is GONE ("it's terrible" — its
 *  row, its cue, its fetch, its two files) · the train sounds FADE OUT (`FADE_S`)
 *  H5C (the owner): THE TRAIN SOUNDS = set B — a North American crossing bell (ONE take: the old bells, A + B, are gone) + THE TRAIN
 *  HORN (one blast a train, when its warning starts) · THE AREA ARRIVAL ("area-arrive") replaces the landmark ping (its row + file gone) */
export const SOUNDS = Object.freeze([
  { id: 'hop', label: 'HOP', b: true, gain: 1.5, pri: 1, play: true },
  { id: 'land-wood', label: 'LAND ON A LOG', b: true, gain: 1.7, pri: 1, play: true },
  { id: 'hit', label: 'HIT', b: false, gain: 2.1, pri: 4, play: true },
  { id: 'splash', label: 'SPLASH', b: false, gain: 2.2, pri: 4, play: true },
  { id: 'horn', label: 'HORN', b: false, gain: 0.5, pri: 2, play: true, max: 1 },
  { id: 'train-bell', label: 'TRAIN BELL (LOOP)', b: false, gain: 1.0, pri: 3, loop: true, ext: 'wav', play: true, max: 1, fade: 0.5 },
  { id: 'train-horn', label: 'TRAIN HORN', b: false, gain: 0.8, pri: 3, play: true, max: 1, fade: 0.5 },
  { id: 'train-pass', label: 'TRAIN PASSING', b: true, gain: 1.6, pri: 3, play: true, max: 1, fade: 0.5 },
  { id: 'lights-die', label: 'THE LIGHTS DIE', b: false, gain: 1.6, pri: 3, play: true, max: 1 },
  { id: 'area-arrive', label: 'AREA ARRIVAL', b: false, gain: 1.4, pri: 3, play: true },
  { id: 'new-best', label: 'NEW BEST', b: true, gain: 1.6, pri: 3, play: true },
]);
/** the music ducks a little under the train (the bell + the pass): to this much of its level, in / out over these seconds */
export const TRAIN_DUCK = Object.freeze({ level: 0.72, inS: 0.25, outS: 0.9, holdMs: 1700 });
/** H5B — the train sounds' fade (s): the bell's loop when its signals stop, the pass at its own end / when it is stopped */
export const FADE_S = 0.5;
export const VOICES = 8;
export const HOP_VARY = Object.freeze({ rate: 0.06, db: 2 });   // (a hop: pitch ± 6 %, gain ± 2 dB — never the same twice)
/** PRIORITY: a full house (8 voices) drops the new sound unless it outranks the quietest-ranked one sounding (the oldest of those goes) */
export function admit(voices, pri, max = VOICES) {
  if (voices.length < max) return { ok: true, drop: -1 };
  let lo = 0;
  for (let i = 1; i < voices.length; i++) if (voices[i].pri < voices[lo].pri || (voices[i].pri === voices[lo].pri && voices[i].at < voices[lo].at)) lo = i;
  return voices[lo].pri < pri ? { ok: true, drop: lo } : { ok: false, drop: -1 };
}

