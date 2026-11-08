// COAST CLEAR's sounds (CC2 — the dailies chat's Grok set 12–19: scripts/build-cc-sfx.py → audio/sfx/coastclear/*.mp3, mono 96 kbps; credits.txt
// beside them + ☰ → CREDITS). Quiet-leaning — OK in bed. DFIX1: played by THE DAILIES' ONE SOUND ENGINE (js/daily/sfx.js — was this file: the
// console's SFX bus, THE FIRST-TAP CATCH (iOS: a sound asked for while the context is still waking from the tap that unlocked it is held
// ≤ 400 ms and played the moment the context runs), every buffer decoded the moment the audio unlocks). Audio is POLISH: nothing plays before
// the unlock, muted, a missing file or a dead graph — nothing throws.
//   ccSfx(name, { gain }) → bool        ccSfxBytes() → Promise        ccSfxPlayed() → [{ name, at }] (the test hook)
// THE MAP: dig (a single cell) · flood (a calm area) · buoy / unbuoy · mode (the DIG / BUOY switch) · spotted (with the sweep) · caught (the
// third light — never louder than the win) · win (COAST CLEAR, with the lighthouse sweep).
import { createDailySfx } from '../../daily/sfx.js';
export { CATCH_MS } from '../../daily/sfx.js';

const DIR = new URL('../../../audio/sfx/coastclear/', import.meta.url);
// name → [file, gain, min gap ms]   (the level trims are baked in at import — build-cc-sfx.py: mode +4 dB, caught −5 dB + a low cut ~120 Hz)
export const CC_SOUNDS = Object.freeze({
  dig: ['12-dig', 0.42, 45],
  flood: ['13-open-area', 0.45, 120],
  buoy: ['14-buoy-place', 0.45, 40],
  unbuoy: ['15-buoy-remove', 0.42, 40],
  mode: ['16-mode-toggle', 0.5, 60],
  spotted: ['17-spotted', 0.42, 300],          // (a short siren blip)
  caught: ['18-caught', 0.62, 1500],           // (firmer — still ~5 LU under the win: build-cc-sfx.py measured −26.3 vs −20 LUFS)
  win: ['19-coast-clear-win', 0.55, 2000],
});
export const CC_FILES = [...new Set(Object.values(CC_SOUNDS).map(s => s[0]))];

const S = createDailySfx({ dir: DIR, sounds: CC_SOUNDS });
export const ccSfx = (name, opts) => S.play(name, opts);
/** fetch every file's bytes now (the mount — no AudioContext needed) + decode them all the moment the audio unlocks */
export const ccSfxBytes = () => S.bytes();
export const ccSfxPlayed = () => S.played();
