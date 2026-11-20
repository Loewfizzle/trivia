// HIGH RISE — THE RUN's FRAME (S5 — docs/highrise.md "THE SHARE IMAGE"; JAYWALK's shot.js is the pattern): the picture of the moment a
// tower fell (the last slab, the falling piece, the sparks — or THE MOTHERSHIP over a finished tower), kept on THIS phone until the next
// run. The stage takes it (night.js#snap — a beat after the end, per cause), the share card draws it (share.js). Pure state, no DOM.

let held = null;
/** keep this run's frame (a 2D canvas + what the card says about it — { key, canvas, topX, topY, floor, perfects, cause, made }); the one
 *  before it is let go */
export function keepShot(s) { if (held && held.canvas && held.canvas !== (s && s.canvas)) { held.canvas.width = 0; held.canvas.height = 0; } held = s || null; }
/** the frame of the run `key` names on this phone (the cartridge: its match id) — null = none (a refresh on the podium, another phone) */
export const shotFor = key => (held && key && held.key === key ? held : null);
/** the last frame taken on this phone, whatever its run (the checks) */
export const lastShot = () => held;
/** ms after the end to take the frame, per cause: the missed slab is still FALLING past the top with its sparks (a miss / too thin), the
 *  fuse's slab mid-drop (too slow), the bell at once, the finish under THE MOTHERSHIP once its gold light has poured (stage.js holds the
 *  end card MADE_HOLD_MS for it) */
export const SHOT_AT = Object.freeze({ miss: 170, thin: 200, slow: 300, cap: 60, made: 1700 });
export const shotMs = (cause, made) => (made ? SHOT_AT.made : SHOT_AT[cause] != null ? SHOT_AT[cause] : SHOT_AT.miss);
