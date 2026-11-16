// JAYWALK — THE RUN's FRAME (H4 — docs/jaywalk.md "THE SHARE IMAGE"): the picture of the moment a player went out, kept on this phone only
// until the next run — the view takes it (night.js#snap), the share card draws it (share.js). Tiny + pure state: no DOM of its own.
let held = null;
/** keep this run's frame (a 2D canvas) + what the card says about it; the one before it is let go */
export function keepShot(s) { if (held && held.canvas && held.canvas !== (s && s.canvas)) { held.canvas.width = 0; held.canvas.height = 0; } held = s || null; }
/** the frame of this match's run on this phone (null = none: a refresh, another phone) */
export const shotFor = matchId => (held && held.matchId === matchId ? held : null);
