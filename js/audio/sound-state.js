// THE SOUND STATE (CITY G): the session by state + THE THREE-WAY CORNER BUTTON (ONE builder: the app's corner in ui/settings-panel.js + /board's
// page) + the AUDIO LEAVE row's keys. FIXES R3's leave modes (A · B · C1 · C2 — the owner's test bench) are retired for ONE path: docs/audio.md
// "CITY G — THE THREE-WAY BUTTON + THE SESSION BY STATE". The decisions (sessionFor · soundState · soundTap) are PURE; the button reads them.
// Tap 1 = MUSIC OFF, the effects on (the note slashed) · tap 2 = ALL SOUND OFF (a SPEAKER ✕) · tap 3 = everything back; a toast each tap; it
// FOLLOWS ☰ Settings — ONE state (audio/settings.js). MUTED = NOTHING RUNS, as ever.
import { settings, updateSettings, onSettings } from './settings.js';
export const LEAVE_REC_KEY = 'ns:audioleave'; // (the leave being recorded / not sent yet)
/** the page really left (a blur alone is a share sheet / an alert) */
export const isLeftSignal = s => /^(hidden|pagehide|freeze|ctx interrupted)/.test(String(s));
/** THE SESSION BY STATE (the owner, Nov 16–17): the mic held → 'play-and-record' · the music ON → 'playback' · the music OFF + the effects ON →
 *  'ambient' (another app's audio keeps playing, the effects on top) · everything OFF → 'auto' (iOS left alone) */
export function sessionFor(s = {}, mic = 0) {
  if (mic) return 'play-and-record';
  if (s.muted || (s.musicOff && s.sfxOff)) return 'auto';
  return s.musicOff ? 'ambient' : 'playback';
}
/** THE THREE-WAY CORNER BUTTON (CITY G): the state the button shows — 'on' (the plain note: the music on, whatever the effects say) · 'music'
 *  (the music off, the effects on: the note slashed) · 'all' (everything off / muted: the speaker ✕) */
export function soundState(s = {}) {
  if (s.muted || (s.musicOff && s.sfxOff)) return 'all';
  return s.musicOff ? 'music' : 'on';
}
/** a tap on the button → the settings patch + its toast: on → MUSIC OFF (effects on) → ALL SOUND OFF → SOUND ON (everything back); the music
 *  on with the effects off (Settings) → ALL SOUND OFF */
export function soundTap(s = {}) {
  const st = soundState(s);
  // (the music on + the effects already off from ☰ Settings: the plain note — the next tap = all off, never the effects switched on behind you)
  if (st === 'on' && s.sfxOff) return { patch: { musicOff: true, sfxOff: true, muted: false }, say: 'ALL SOUND OFF' };
  if (st === 'on') return { patch: { musicOff: true, sfxOff: false, muted: false }, say: 'MUSIC OFF · EFFECTS ON' };
  if (st === 'music') return { patch: { musicOff: true, sfxOff: true, muted: false }, say: 'ALL SOUND OFF' };
  return { patch: { musicOff: false, sfxOff: false, muted: false }, say: 'SOUND ON' };
}

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
