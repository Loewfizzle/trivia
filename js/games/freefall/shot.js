// FREEFALL — THE RUN's FRAME (F4B — docs/freefall.md "THE SHARE CARD"; HIGH RISE S5's shot.js is the pattern): the picture of the moment a
// run ended (the red's burst round the ball · the darkness on the ball · the seabed's impact, gold · the bell), kept on THIS phone until
// the next run. The stage takes it (stage.js — a beat after the end, per cause: night.js#snap copies the frame off the canvas in the
// frame it was drawn), the share card draws it (share.js). Pure state + numbers: no DOM, no fetch, nothing that counts.

let held = null;
/** keep this run's frame — { key, canvas (THE BOX's size: the picture round the ball), cause, made, floor, blazes, look } — the one before
 *  it is let go (its pixels freed) */
export function keepShot(s) { if (held && held.canvas && held.canvas !== (s && s.canvas)) { held.canvas.width = 0; held.canvas.height = 0; } held = s && s.canvas ? s : null; }
/** the frame of the run `key` names on this phone (the cartridge: its match id · the test page + a solo run: its seed) — null = none
 *  (a refresh on the podium, another phone) */
export const shotFor = key => (held && key && held.key === key ? held : null);
/** the last frame taken on this phone, whatever its run (the checks) */
export const lastShot = () => held;
/** THE BOX: the frame is taken at the share card's own hero box (share.js#FF_CARD.box — 984 × 792 of its 1080 × 1350): the phone's column
 *  wide, the ball in its middle across */
export const SHOT_BOX = Object.freeze({ w: 984, h: 792 });
/** ms after the end to take the frame, per cause — picked from the beats' contact sheets (tests/integration/freefall-share.mjs `--beats`):
 *  RED 90 = the burst still bright round the ball's place, the slice it died on white-hot (at 150 the sparks have flown up under the
 *  cause's tab; by 400 the slice is plain red again) · DARK 240 = the ball's light going out, its ring still faintly lit (grey from 450) ·
 *  the bell at once · THE BOTTOM 390 = THE IMPACT — the ball on the seabed (it lands 300 ms after the run's last tick), the shockwave
 *  ring wide in the picture, the dust rising, the last floor's shards in the air (at 600 the ring has left the frame; from 1100 the
 *  dust covers the bed). stage.js holds the end card END_HOLD_MS / END_HOLD_MADE_MS: the frame is always taken before it. */
// (F4B — the screen review: at 90 ms the slice was still WHITE-HOT — under a HIT THE RED tab the frame read as a white wedge. At 200 ms
//  the slice is RED again, a pale flash still on it, the sparks spread in the air: it reads as the hit.)
export const SHOT_AT = Object.freeze({ red: 200, dark: 240, cap: 60, made: 390 });
const own = (T, k) => typeof k === 'string' && Object.prototype.hasOwnProperty.call(T, k);   // (the table's own rows only: never 'constructor')
export const shotMs = cause => (own(SHOT_AT, cause) ? SHOT_AT[cause] : SHOT_AT.cap);
/** where the ball stands DOWN the frame (0 … 1 of its height), per cause: clear of the cause's tab above it and of the floors' number
 *  below it — the red's burst + THE BOTTOM's ring a little lower (what flies up from the ball stays off the tab) */
export const BALL_AT = Object.freeze({ red: 0.42, dark: 0.4, cap: 0.4, made: 0.42 });
export const ballAt = cause => (own(BALL_AT, cause) ? BALL_AT[cause] : BALL_AT.cap);
/**
 * PURE: the part of a `sw` × `sh` picture the frame shows — the phone's COLUMN wide (`col` = its width : its height, night.js#CAM.aspectMax:
 * a wide screen is framed as the phone's), of THE BOX's shape, centred across on the ball (`bx`, `by`: 0 … 1 of the picture), the ball
 * `at` down it; never past an edge → { x, y, w, h } in the picture's own pixels
 */
export function shotCrop(sw, sh, bx = 0.5, by = 0.34, at = BALL_AT.cap, col = 0.47, box = SHOT_BOX) {
  let w = Math.min(sw, sh * col), h = w * box.h / box.w;
  if (h > sh) { h = sh; w = h * box.w / box.h; }
  return { x: Math.max(0, Math.min(sw - w, bx * sw - w / 2)), y: Math.max(0, Math.min(sh - h, by * sh - h * at)), w, h };
}
