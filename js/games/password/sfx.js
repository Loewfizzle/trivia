// THE PASSWORD's sounds (PW2 — the dailies chat's Grok set: scripts/build-pw-sfx.py → audio/sfx/password/*.mp3, mono 96 kbps; credits.txt
// beside them + ☰ → CREDITS). Quiet-leaning — OK in bed. DFIX1: played by THE DAILIES' ONE SOUND ENGINE (js/daily/sfx.js — the console's SFX
// bus, THE FIRST-TAP CATCH: a key tap's sound asked for just before iOS's audio is running still plays, ≤ 400 ms late; every buffer decoded the
// moment the audio unlocks). Audio is POLISH: before the unlock, muted, a missing file or a dead graph — nothing plays, nothing throws.
//   pwSfx(name, { gain }) → bool        pwSfxBytes() → Promise        pwSfxPlayed() → [{ name, at }] (the test hook)
// THE MAP: tap · back · submit · hit / near / miss (one per flipping tile, as its mark lands) · refuse (the shake) · unlock + open (the door
// reveal) · win (WELCOME IN) · fail (LOCKED OUT).
import { createDailySfx } from '../../daily/sfx.js';
export { CATCH_MS } from '../../daily/sfx.js';

const DIR = new URL('../../../audio/sfx/password/', import.meta.url);
// name → [file, gain, min gap ms]
export const PW_SOUNDS = Object.freeze({
  tap: ['01-key-tap', 0.5, 40],
  back: ['02-key-delete', 0.5, 40],
  submit: ['03-guess-submit', 0.45, 150],
  hit: ['04-tile-hit', 0.42, 0],
  near: ['05-tile-near', 0.4, 0],
  miss: ['06-tile-miss', 0.4, 0],
  refuse: ['07-not-a-word', 0.5, 300],
  unlock: ['08-door-unlock', 0.55, 800],
  open: ['09-door-open', 0.5, 800],
  win: ['10-win-sting', 0.5, 2000],
  fail: ['11-fail', 0.5, 1500],
});
export const PW_FILES = [...new Set(Object.values(PW_SOUNDS).map(s => s[0]))];

const S = createDailySfx({ dir: DIR, sounds: PW_SOUNDS });
export const pwSfx = (name, opts) => S.play(name, opts);
/** fetch every file's bytes now (the mount — no AudioContext needed); they decode the moment the audio unlocks */
export const pwSfxBytes = () => S.bytes();
export const pwSfxPlayed = () => S.played();
