// PRISM DROP — THE SKIN SOUNDS' KEY (PFIX-3 — FABLE REVIEW 2's S13; PURE — no audio, no DOM: audio.js plays by it, the unit tests import it).
// A skin names each PITCHED sourced file's note (skins.js `sounds.pitch` — a pitch class 0 … 11: C = 0 … G = 7 … B = 11; a noise file has
// none) and the synth plays the file at the rate that lands that note on the CURRENT song's ROOT or FIFTH — whichever is nearer, never more
// than 3 semitones away (a blip / a chime keeps its character). The song's key = its `tonic` + `mode` (data/prism/<id>.json — THE per-song
// key table: the same one every code-made sound already follows through audio.js#setKey).
// A file that rings a CHORD (galaxy's stardust: a major-seventh shimmer, C–E–G–B) is placed where the WHOLE chord sits in the song's scale:
// a major song's root or fourth, a minor song's third or sixth — on a minor song's root its third + seventh would be out of key.
export const LOCK_WANDER_CENTS = 20;
/** where a file's note may land, in semitones above the song's tonic: a single note → the root or the fifth; a major-seventh chord → the
 *  degrees whose maj7 chord is all in the scale */
export const KEY_TARGETS = Object.freeze({ note: Object.freeze({ major: [0, 7], minor: [0, 7] }), maj7: Object.freeze({ major: [0, 5], minor: [3, 8] }) });
const pitchOf = p => (p && typeof p === 'object' ? { pc: p.pc, chord: p.chord || 'note' } : { pc: p, chord: 'note' });
/** PURE: the file's note (`pitch`: a pitch class, or { pc, chord: 'maj7' }) → the nearest allowed degree of the song's key (`tonic` 0 … 11 +
 *  `mode`): { shift (semitones, −3 … +3), to (the pitch class it lands on), rate } */
export function keyShift(pitch, tonic, mode = 'minor') {
  const { pc, chord } = pitchOf(pitch);
  const p = ((Number(pc) | 0) % 12 + 12) % 12, t = ((Number(tonic) | 0) % 12 + 12) % 12;
  const degs = (KEY_TARGETS[chord] || KEY_TARGETS.note)[mode === 'major' ? 'major' : 'minor'];
  let best = null;
  for (const deg of degs) {
    const to = (t + deg) % 12;
    let d = ((to - p) % 12 + 12) % 12; if (d > 6) d -= 12;                    // the nearest way round: −5 … +6
    if (!best || Math.abs(d) < Math.abs(best.shift)) best = { shift: d, to };   // (a tie → the first degree listed: the root)
  }
  return { ...best, rate: 2 ** (best.shift / 12) };
}
/** PURE: a pitched lock's rate — on the song's root / fifth, wandering inside ±LOCK_WANDER_CENTS (`r` = a random 0 … 1) */
export const pitchedLockRate = (pitch, tonic, mode = 'minor', r = 0.5) => keyShift(pitch, tonic, mode).rate * 2 ** ((r * 2 - 1) * LOCK_WANDER_CENTS * 0.75 / 1200);
