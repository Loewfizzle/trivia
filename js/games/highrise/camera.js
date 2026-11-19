// HIGH RISE — THE CAMERA's NUMBERS (S2 — docs/highrise.md "THE CAMERA"): PURE, no imports. THE DIAGONAL CAMERA — turned 45°, looking 33°
// down, a narrow 20° lens — climbing with the top slab; the first slab = 60 % of the screen's width (on a wide screen: of a phone-shaped
// column). The SAME numbers as the lab's graybox (graybox.js#CAM — tests/highrise-play.test.mjs pins the two equal: the lab's own test
// keeps its copy in its file).
export const CAM = Object.freeze({ fov: 20, yaw: 45, pitch: 33, fill: 0.6, aspectMax: 0.62, lift: 0.5 });
/** how far the camera stands from the point it looks at, for a screen of `aspect` (w / h): the first slab, √2 wide seen corner-on, fills CAM.fill of the width */
export const camDist = aspect => Math.SQRT2 / (2 * CAM.fill * Math.min(aspect, CAM.aspectMax) * Math.tan(CAM.fov * Math.PI / 360));
/** a slab's thickness in world units (a slab's side = 1) — the view's, never the rules' */
export const SLAB_H = 0.14;
