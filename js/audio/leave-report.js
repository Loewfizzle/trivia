// THE AUDIO SESSION BY STATE + THE AUDIO LEAVE row's keys (PURE — no DOM, no imports). CITY G retired FIXES R3's leave modes (A IDLE SILENCE ·
// B CLOSE AT ONCE · C1 / C2 the session at boot — the owner's test bench) for ONE path: docs/audio.md "CITY G — THE THREE-WAY BUTTON + THE
// SESSION BY STATE". MUTED = NOTHING RUNS, as ever.
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
