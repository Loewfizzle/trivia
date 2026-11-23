// JAYWALK — THE SOUNDS' TABLE (H2 — docs/jaywalk.md "THE SOUNDS"). PURE, no imports (the unit tests read it; sfx.js plays it): every sound,
// The long notes: docs/games/jaywalk-notes.md
/** every JAYWALK sound: id, its words in the audition, a B backup?, a loop (the whole WAV), its gain into the limiter, its priority, … */
export const SOUNDS = Object.freeze([
  { id: 'hop', label: 'HOP', b: true, gain: 1.25, pri: 1, play: true },
  { id: 'land-wood', label: 'LAND ON A LOG', b: true, gain: 1.4, pri: 1, play: true },
  { id: 'hit', label: 'HIT', b: false, gain: 2.1, pri: 4, play: true },
  { id: 'splash', label: 'SPLASH', b: false, gain: 2.2, pri: 4, play: true },
  { id: 'horn', label: 'HORN', b: false, gain: 0.5, pri: 2, play: true, max: 1 },
  { id: 'train-bell', label: 'TRAIN BELL (LOOP)', b: false, gain: 0.29, pri: 3, loop: true, ext: 'wav', play: true, max: 1, fade: 0.5 },
  { id: 'train-horn', label: 'TRAIN HORN', b: false, gain: 0.23, pri: 3, play: true, max: 1, fade: 0.5 },
  { id: 'train-pass', label: 'TRAIN PASSING', b: true, gain: 1.2, pri: 3, play: true, max: 1, fade: 0.5 },
  { id: 'truck-horn', label: 'TRUCK HORN', b: false, gain: 0.145, pri: 2, play: true, max: 1 },
  { id: 'stopwatch-tick', label: 'THE STOPWATCH (LOOP)', b: false, gain: 0.9, pri: 3, loop: true, ext: 'wav', play: true, max: 1 },
  { id: 'area-arrive', label: 'AREA ARRIVAL', b: false, gain: 1.25, pri: 3, play: true },
  { id: 'new-best', label: 'NEW BEST', b: false, gain: 1.45, pri: 3, play: true },
  // J1 — THE MATCH MOMENTS (the owner's picks — original sounds, CC0 1.0 Ben; scripts/build-jaywalk-sounds.mjs): `match` = fetched only for a …
  { id: 'out-drop', label: 'OUT (A MATCH)', b: false, gain: 0.28, pri: 3, play: true, match: true, max: 1 },
  { id: 'h2h-siren', label: 'HEAD TO HEAD SIREN', b: false, gain: 0.19, pri: 2, play: true, match: true, max: 1, fade: 0.4 },
  { id: 'last-standing', label: 'LAST ONE STANDING', b: false, gain: 0.6, pri: 3, play: true, match: true, max: 1 },
  // JT1 — THE SEASONS (the owner, Nov 22 — CC0, the delivery's sfx11 + sfx12; scripts/build-jaywalk-sounds.mjs --jt1): `season` = fetched …
  { id: 'leaf-crunch', label: 'LEAF PILE (AUTUMN)', b: false, gain: 0.9, pri: 1, play: true, season: 'autumn', max: 1 },
  { id: 'firework-pops', label: 'FIREWORKS — POPS', b: false, gain: 0.22, pri: 1, play: true, season: 'fireworks', max: 1, fade: 0.4 },
  { id: 'firework-crackle', label: 'FIREWORKS — CRACKLE', b: false, gain: 0.2, pri: 1, play: true, season: 'fireworks', max: 1, fade: 0.4 },
  { id: 'firework-volley', label: 'FIREWORKS — VOLLEY', b: false, gain: 0.2, pri: 1, play: true, season: 'fireworks', max: 1, fade: 0.4 },
]);
/** JT1 — the season's sounds for a day ('d20261231'): the leaf crunch Oct 20 → Nov 30 (season.js — AUTUMN), the fireworks on Dec 31 + Jan 1 */
export function seasonSoundsOf(day) {
  const m = /^d\d{4}(\d{2})(\d{2})$/.exec(day || ''), mo = m ? +m[1] : 0, d = m ? +m[2] : 0;
  const k = (mo === 10 && d >= 20) || mo === 11 ? 'autumn' : (mo === 12 && d === 31) || (mo === 1 && d === 1) ? 'fireworks' : '';
  return k ? SOUNDS.filter(s => s.season === k).map(s => s.id) : [];
}
/** J1 — the match-only sounds (view.js fetches them for a MATCH) */
export const MATCH_SOUNDS = Object.freeze(SOUNDS.filter(s => s.match).map(s => s.id));
/** the music ducks a little under the train (the bell + the pass): to this much of its level, in / out over these seconds */
export const TRAIN_DUCK = Object.freeze({ level: 0.72, inS: 0.25, outS: 0.9, holdMs: 1700 });
/** H5B — the train sounds' fade (s): the bell's loop when its signals stop, the pass at its own end / when it is stopped */
export const FADE_S = 0.5;
export const VOICES = 8;
export const HOP_VARY = Object.freeze({ rate: 0.06, db: 2 });
/** PRIORITY: a full house (8 voices) drops the new sound unless it outranks the quietest-ranked one sounding (the oldest of those goes) */
export function admit(voices, pri, max = VOICES) {
  if (voices.length < max) return { ok: true, drop: -1 };
  let lo = 0;
  for (let i = 1; i < voices.length; i++) if (voices[i].pri < voices[lo].pri || (voices[i].pri === voices[lo].pri && voices[i].at < voices[lo].at)) lo = i;
  return voices[lo].pri < pri ? { ok: true, drop: lo } : { ok: false, drop: -1 };
}

