// THE SOUND STATE (CITY G — docs/audio.md "CITY G"): the session by state + THE THREE-WAY CORNER BUTTON (ONE builder: the app + /board) + the
// AUDIO LEAVE keys. The decisions are PURE; the button reads them. FIXES R3's leave modes are retired.
import { settings, updateSettings, onSettings } from './settings.js';
export const LEAVE_REC_KEY = 'ns:audioleave';
/** the page really left (a blur alone is a share sheet / an alert) */
export const isLeftSignal = s => /^(hidden|pagehide|freeze|ctx interrupted)/.test(String(s));
/** the mic → 'play-and-record' · the music on → 'playback' · off + the effects on → 'ambient' · everything off → 'auto' (iOS left alone) */
export function sessionFor(s = {}, mic = 0) {
  if (mic) return 'play-and-record';
  if (s.muted || (s.musicOff && s.sfxOff)) return 'auto';
  return s.musicOff ? 'ambient' : 'playback';
}
/** the button's state: 'on' (the note — the music on, whatever the effects) · 'music' (the note slashed) · 'all' (the speaker ✕) */
export function soundState(s = {}) {
  if (s.muted || (s.musicOff && s.sfxOff)) return 'all';
  return s.musicOff ? 'music' : 'on';
}
/** a tap → { patch, say }: on → MUSIC OFF · EFFECTS ON → ALL SOUND OFF → SOUND ON; the music on + the effects off (Settings) → ALL SOUND OFF */
export function soundTap(s = {}) {
  const st = soundState(s);
  if (st === 'on' && s.sfxOff) return { patch: { musicOff: true, sfxOff: true, muted: false }, say: 'ALL SOUND OFF' };
  if (st === 'on') return { patch: { musicOff: true, sfxOff: false, muted: false }, say: 'MUSIC OFF · EFFECTS ON' };
  if (st === 'music') return { patch: { musicOff: true, sfxOff: true, muted: false }, say: 'ALL SOUND OFF' };
  return { patch: { musicOff: false, sfxOff: false, muted: false }, say: 'SOUND ON' };
}

export const SOUND_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><g class="nt"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></g><path class="slash-bg" d="M4 4l16 16"/><path class="slash" d="M4 4l16 16"/><g class="spk"><path d="M3.5 9.2h3.6L11.8 5v14l-4.7-4.2H3.5z"/><path d="M15.2 8.9l5.9 5.9M21.1 8.9l-5.9 5.9"/></g></svg>';
const LABEL = { on: 'Sound on — tap to turn the music off', music: 'Music off, effects on — tap to turn all sound off', all: 'All sound off — tap to turn it back on' };
/** the look + the words (is-off = the music off · is-all = everything off) */
export function paintSoundBtn(b, s = settings) {
  const st = soundState(s);
  b.classList.toggle('is-off', st !== 'on');
  b.classList.toggle('is-all', st === 'all');
  b.dataset.sound = st;
  b.setAttribute('aria-pressed', String(st === 'on'));
  b.setAttribute('aria-label', LABEL[st]);
}
/** wire a .music-btn → its tap handler. rescue() → true = the music was meant on but had gone quiet: the tap brought it back, no change */
export function wireSoundButton(b, { toast = null, rescue = null, say = null } = {}) {
  b.innerHTML = SOUND_SVG;
  const tap = () => {
    if (soundState(settings) === 'on' && rescue && rescue()) { if (say) say('Music on'); return; }
    const t = soundTap(settings);
    updateSettings(t.patch);
    if (!settings.musicOff && rescue) rescue();     // (switched on: it really plays — still inside the tap)
    if (toast) toast(t.say, 'info', 1500);
    if (say) say(t.say);
  };
  const paint = () => paintSoundBtn(b);
  onSettings(paint); paint();
  return tap;
}
