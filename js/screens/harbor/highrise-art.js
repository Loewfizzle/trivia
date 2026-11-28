// CITY PART 1 — HIGH RISE's OPEN NOW FACE, the tri-vision's newest face (core/harbor-trivision.js#highriseShow; the owner, Nov 20 8:12 am + 5:52 pm —
// "B1": HIGH in pink over RISE in cyan + a dark band with white OPEN NOW; ONLY OPEN NOW). The picture is the games chat's own build
// (scripts/build-highrise-billboard.mjs → assets/city/highrise/billboard.webp, 848 × 448 — the poster box HOLD'EM + JAYWALK lay out in; its
// words baked in, nothing lettered over it): drawn WHOLE, COVER in the board, like JAYWALK's OPEN NOW poster (jaywalk-art.js#paintJaywalk 'open').
// LAZY: fetched after the city's reveal (or before it when it is the face the board opens on — THE BOARD OPENS ON THE NEWEST GAME), never in
// the boot graph; a face only once its picture has DECODED (no flash) — every waiting scene answered (jaywalk-art.js#artLoader's loader).
import { artLoader, coverOf } from './jaywalk-art.js';

const SRC = new URL('../../../assets/city/highrise/billboard.webp', import.meta.url).href;
const ART = artLoader(SRC, 'the HIGH RISE poster');
/** load the poster (once); onReady when it has decoded — EVERY caller answered; onFail on a missing file / a blip (the scene retries) */
export function warmHighrise(onReady, onFail) { ART.warm(onReady, onFail); }
export const highriseReady = () => ART.ready;
/** the poster into the board's rect R (screen pt) — whole, COVER, on a near-black ground (a missing picture = the ground alone) */
export function paintHighrise(x, R) {
  x.save(); x.beginPath(); x.rect(R.x, R.y, R.w, R.h); x.clip();
  x.fillStyle = '#05030a'; x.fillRect(R.x, R.y, R.w, R.h);
  if (ART.ready && ART.img) { const img = ART.img, C = coverOf(R, img.naturalWidth || 848, img.naturalHeight || 448); x.drawImage(img, C.dx, C.dy, C.dw, C.dh); }
  x.restore();
}
// (THE FREEFALL CITY PASS: the row faces' one shape — scene.js warms + paints every row face by these names)
export { warmHighrise as warm, paintHighrise as paint };
