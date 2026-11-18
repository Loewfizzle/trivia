// CITY G — THE THREE-WAY CORNER BUTTON (the owner, Nov 16–17): the music button, top right, on every screen — ONE builder (the app's corner
// in ui/settings-panel.js + /board's own page). Tap 1 = MUSIC OFF, the effects on (the note slashed) · tap 2 = ALL SOUND OFF (a SPEAKER with an
// ✕ — a different symbol, it reads at 36 pt) · tap 3 = everything back (the plain note). A short toast each tap. ☰ Settings keeps its two
// switches (music · effects); the button FOLLOWS them (the music on + the effects off = the plain note; the next tap = all off) — ONE state:
// audio/settings.js, read through the PURE audio/leave-report.js#soundState / #soundTap. The session follows the state (engine.js).
import { settings, updateSettings, onSettings } from '../audio/settings.js';
import { soundState, soundTap } from '../audio/leave-report.js';

export const SOUND_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><g class="nt"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></g><path class="slash-bg" d="M4 4l16 16"/><path class="slash" d="M4 4l16 16"/><g class="spk"><path d="M3.5 9.2h3.6L11.8 5v14l-4.7-4.2H3.5z"/><path d="M15.2 8.9l5.9 5.9M21.1 8.9l-5.9 5.9"/></g></svg>';
const LABEL = { on: 'Sound on — tap to turn the music off', music: 'Music off, effects on — tap to turn all sound off', all: 'All sound off — tap to turn it back on' };

/** the button's look + its words from the settings (classes: is-off = the music off · is-all = everything off) */
export function paintSoundBtn(b, s = settings) {
  const st = soundState(s);
  b.classList.toggle('is-off', st !== 'on');
  b.classList.toggle('is-all', st === 'all');
  b.dataset.sound = st;
  b.setAttribute('aria-pressed', String(st === 'on'));
  b.setAttribute('aria-label', LABEL[st]);
}
/** wire a .music-btn: its SVG, the tap (rescue() → true = the music was meant on but had gone quiet: this tap brought it back — no state
 *  change), the toast, the paint on every settings change. → the tap handler (for an onclick the caller sets itself) */
export function wireSoundButton(b, { toast = null, rescue = null, say = null } = {}) {
  b.innerHTML = SOUND_SVG;
  const tap = () => {
    if (soundState(settings) === 'on' && rescue && rescue()) { if (say) say('Music on'); return; }
    const t = soundTap(settings);
    updateSettings(t.patch);
    if (!settings.musicOff && rescue) rescue();     // (switched on: make sure it really plays — still inside the tap)
    if (toast) toast(t.say, 'info', 1500);
    if (say) say(t.say);
  };
  const paint = () => paintSoundBtn(b);
  onSettings(paint); paint();
  return tap;
}
