// FIXES R3 — THE LEAVE MODES + THE AUDIO LEAVE row's text (PURE — no DOM, no imports). The why + the modes in full: docs/audio.md
// "FIXES R3 — THE SQUEAL ON LEAVING". A IDLE SILENCE · B CLOSE AT ONCE · C1 / C2 the session at boot; MUTED = NOTHING RUNS in every mode.
export const LEAVE_KEY = 'ns:leavemode';      // (this device only)
export const LEAVE_REC_KEY = 'ns:audioleave'; // (the leave being recorded / not sent yet)
export const LEAVE_MODES = Object.freeze({
  A: { name: 'IDLE SILENCE', sub: 'Music off: nothing runs between effects' },
  B: { name: 'CLOSE AT ONCE', sub: 'The first leave signal closes the audio' },
  C1: { name: 'SESSION AMBIENT', sub: 'Audio session “ambient” from the start' },
  C2: { name: 'SESSION PLAYBACK', sub: 'Audio session “playback” from the start' },
});
export const LEAVE_ORDER = Object.freeze(['A', 'B', 'C1', 'C2']);
/** every phone's default until the owner's ear picks the winner */
export const LEAVE_DEFAULT = 'A';
export const leaveModeOf = v => (Object.prototype.hasOwnProperty.call(LEAVE_MODES, v) ? v : LEAVE_DEFAULT);
export const nextLeaveMode = v => LEAVE_ORDER[(LEAVE_ORDER.indexOf(leaveModeOf(v)) + 1) % LEAVE_ORDER.length];
/** the page really left (a blur alone is a share sheet / an alert) */
export const isLeftSignal = s => /^(hidden|pagehide|freeze|ctx interrupted|closed \(mode B\))/.test(String(s));
