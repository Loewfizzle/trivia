// JAYWALK — THE CAMERA (H2B — docs/jaywalk.md "THE CAMERA"): ONE camera for both views (the night look + the graybox behind ?gray=1), so
// they always agree. PURE MATH — no three.js, no DOM, no clock of its own (the view hands it `dt`): it only needs a camera object with
// `position.set(x, y, z)` + `lookAt(x, y, z)`.
//   · ZOOM = the columns seen ACROSS THE SCREEN at the kid's row: 7 · 8 · 9 (default 8) — on EVERY screen shape (the lens is fitted to the
//     screen's WIDTH: a shorter screen sees fewer lanes, never smaller columns). THE PROVEN RIG (H1: 16 up / 12 back — the kid seen from
//     ≈ 53° above) is kept and scaled about the kid by zoom / 9.42.
//   · THE SIDEWAYS FOLLOW: the camera's x eases to the kid's x (a hop is led to where it lands; a log ride is followed smoothly), CLAMPED
//     so the view never shows more than PAST_EDGE (1) column past the play area's edge — cars + logs are still seen coming.
//   · THE TURN: a slight yaw, TURN_DEG, about the kid — the lanes run on a gentle diagonal and the cars' sides show. ANGLE: STRAIGHT · TURNED
//     (default TURNED). Swipes stay screen-relative (the rules never know).
//   · THE FRAMING: the kid's feet sit KID_AT (62 %) down the screen on every screen shape → 3–4 lanes are seen behind him (THE BLACKOUT is
//     seen climbing before it bites).
// The rules never import this (tests/jaywalk-camera.test.mjs).
import { COLS } from './tuning.js';

/** THE PROVEN RIG (H1) at 9.42 columns across: fov 54 on a 390 × 844 phone, 16 up / 12 back. `kidAt`: how far down the screen he stands. */
export const CAM = Object.freeze({ fov: 54, up: 16, back: 12, width: 9.42, kidAt: 0.62 });
export const ZOOMS = Object.freeze([7, 8, 9]);
export const ZOOM = 8;
export const ANGLES = Object.freeze(['straight', 'turned']);
export const ANGLE = 'turned';
/** THE TURN: the one tuned number — the camera sits this many degrees round the kid (to his right), so "up the course" runs up + a little right */
export const TURN_DEG = 12;
/** the follow never shows more than this many columns past the play area's edge (the dim edge column = the cue) */
export const PAST_EDGE = 1;
/** the eases (ms): the sideways follow · the follow up the lanes · a ZOOM / ANGLE change on the lab */
export const EASE_MS = Object.freeze({ x: 140, y: 105, set: 170 });
const DIST = Math.sqrt(CAM.up * CAM.up + CAM.back * CAM.back), KID_PITCH = Math.atan2(CAM.up, CAM.back), NDC = 2 * CAM.kidAt - 1;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

/** the lens for a screen shape (aspect = width / height): the vertical fov (degrees) that puts exactly ZOOM columns across at the kid's row,
 *  + how far ahead of him (in rig units) the camera aims so his feet sit KID_AT down the screen. PURE. */
export function lensFor(aspect) {
  const q = CAM.width / 2 / DIST / (aspect > 0 ? aspect : 0.462);
  // (the kid sits below the lens's centre, a touch nearer than the rig's distance: T / √(1 + NDC² T²) = q)
  const T = clamp(Math.sqrt(q * q / Math.max(1e-6, 1 - NDC * NDC * q * q)), 0.2, 0.9);
  const aim = KID_PITCH - Math.atan(NDC * T);
  return { fov: 2 * Math.atan(T) * 180 / Math.PI, ahead: CAM.up / Math.tan(aim) - CAM.back, tan: T };
}
/** how far the follow may slide (columns from the centre) at a zoom: the view's edge stops PAST_EDGE past the play area's */
export const followLimit = zoom => Math.max(0, COLS / 2 + PAST_EDGE - zoom / 2);

export function createCamera(o = {}) {
  let zoom = ZOOMS.includes(o.zoom) ? o.zoom : ZOOM, angle = ANGLES.includes(o.angle) ? o.angle : ANGLE;
  let k = zoom / CAM.width, yaw = angle === 'turned' ? TURN_DEG * Math.PI / 180 : 0, x = 0, y = 0, fresh = true, lens = lensFor(0.462);
  const kT = () => zoom / CAM.width, yawT = () => (angle === 'turned' ? TURN_DEG * Math.PI / 180 : 0);
  return {
    zoom: () => zoom, angle: () => angle,
    /** the lab's switches (eased over EASE_MS.set; `snap` = at once) */
    choose(z, a, snap) { if (ZOOMS.includes(z)) zoom = z; if (ANGLES.includes(a)) angle = a; if (snap) { k = kT(); yaw = yawT(); } },
    /** the screen changed shape → the vertical fov to give the three.js camera */
    fit(aspect) { lens = lensFor(aspect); return lens.fov; },
    /** one frame: ease to the kid — `tx` his column centre (cells, 0 … 9; a hop's = where it lands), `ty` his lane (+ 0.5), `dt` ms */
    follow(tx, ty, dt) {
      const far = fresh || Math.abs(ty - y) > 12, e = ms => (far ? 1 : 1 - Math.exp(-dt / ms)), es = 1 - Math.exp(-dt / EASE_MS.set);
      k += (kT() - k) * es; yaw += (yawT() - yaw) * es;
      if (Math.abs(kT() - k) < 1e-4) k = kT();
      if (Math.abs(yawT() - yaw) < 1e-4) yaw = yawT();
      const lim = followLimit(k * CAM.width);
      x += (clamp(tx - COLS / 2, -lim, lim) - x) * e(EASE_MS.x); y += (ty - y) * e(EASE_MS.y);
      fresh = false;
    },
    /** place a three.js camera (anything with position.set + lookAt); (sx, sy) = the view's own shake */
    apply(cam, sx = 0, sy = 0) {
      const s = Math.sin(yaw), c = Math.cos(yaw);
      cam.position.set(x + sx + s * CAM.back * k, CAM.up * k + sy, -y + c * CAM.back * k);
      cam.lookAt(x + sx - s * lens.ahead * k, sy, -y - c * lens.ahead * k);
    },
    /** the rig's scale (1 = 9.42 columns across) · the follow's place (columns from the centre · lanes) · the turn (radians), as eased */
    k: () => k, x: () => x, y: () => y, yaw: () => yaw,
    reset() { fresh = true; },
  };
}
