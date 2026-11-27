// FREEFALL — THE RUN's FRAME (F4B — docs/freefall.md "THE SHARE CARD"; HIGH RISE S5's shot.js is the pattern): the picture of the moment a (→ §1, docs/freefall.md MODULE NOTES)

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
// (F5A: THE BOTTOM 390 → 410 — the GOLD ring stands round the ball, inside the picture)
export const SHOT_AT = Object.freeze({ red: 200, dark: 240, cap: 60, made: 600 });   // (FIX A — N3: 600 — the gold ring at its widest, the camera pulled back: the game's top result its best card)
/** F5A — THE HERO FRAME TELLS THE STORY (the owner's real SHARE read as noise: taken AFTER the crash — no ball, a white hit-flash slice,
 *  random spark streaks): the frame is STAGED — the scene draws the moment a beat BEFORE the end once more, for the card alone
 *  (night.js#shot: zoomed out a little, no hit flash, no sparks; the screen never shows it) —
 *  · SHOT_BEFORE: how many ticks before the run's last tick the staged picture shows (60 a second: 9 = 150 ms — the BALL clearly in the
 *    air, just above the RED slice it is about to land on · the darkness: the ball still lit, the dark edge closing above it · the bell:
 *    the ball as it stands). THE BOTTOM has none: its picture is the impact itself (SHOT_AT.made — the ball on the seabed, the gold ring).
 *  · SHOT_ZOOM: how far the camera steps back for it (2–3 floors of context under the ball; THE BOTTOM keeps the finish's own pose)
 *  · SHOT_BLOOM: the glow's share (THE BOTTOM's kept LOW — the night gold card was a white blob) · SHOT_GLOW: the red slice's own glow */
export const SHOT_BEFORE = Object.freeze({ red: 9, dark: 9, cap: 0, made: 0 });
export const SHOT_ZOOM = Object.freeze({ red: 1.32, dark: 1.28, cap: 1.28, made: 1.14 });   // (the camera's distance × this: FIX A — N3, the finish pulled back a little)
export const SHOT_BLOOM = Object.freeze({ red: 0.75, dark: 0.75, cap: 0.75, made: 0.08 });   // (F5B: THE BOTTOM 0.3 → 0.12 — still a hazy white blur at 360 px)
export const SHOT_GLOW = 1.15;   // (THE MARK's own light under the ball, wide + red-hot — a white flash would whiten the slice: it must read RED)
const own = (T, k) => typeof k === 'string' && Object.prototype.hasOwnProperty.call(T, k);   // (the table's own rows only: never 'constructor')
export const shotMs = cause => (own(SHOT_AT, cause) ? SHOT_AT[cause] : SHOT_AT.cap);
/** where the ball stands DOWN the frame (0 … 1 of its height), per cause: clear of the cause's tab above it and of the floors' number
 *  below it — the red's burst + THE BOTTOM's ring a little lower (what flies up from the ball stays off the tab) */
export const BALL_AT = Object.freeze({ red: 0.42, dark: 0.4, cap: 0.4, made: 0.42 });
export const ballAt = cause => (own(BALL_AT, cause) ? BALL_AT[cause] : BALL_AT.cap);
/** the staged frame's numbers for a cause → { before, zoom, bloom, glow, alive } (an unknown cause: the bell's) */
export const stagingOf = cause => { const k = own(SHOT_ZOOM, cause) ? cause : 'cap'; return { before: SHOT_BEFORE[k], zoom: SHOT_ZOOM[k], bloom: SHOT_BLOOM[k], glow: k === 'red' ? SHOT_GLOW : 0, alive: k !== 'made' }; };
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
