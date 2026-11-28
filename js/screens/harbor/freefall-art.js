// THE FREEFALL CITY PASS — FREEFALL's OPEN NOW FACE, the tri-vision's newest face (core/harbor-trivision.js#ROW_FACES — lit by its GAMES row's go-live).
// The picture is the games chat's own build (scripts/build-freefall-billboard.mjs → assets/city/freefall/billboard.webp, 848 × 448 — A · THE LOGO,
// its words + OPEN NOW baked in, nothing lettered over it): drawn WHOLE, COVER in the board, like HIGH RISE's (highrise-art.js). LAZY: never the
// boot graph; a face only once its picture has DECODED (jaywalk-art.js#artLoader).
import { artLoader, coverOf } from './jaywalk-art.js';

const SRC = new URL('../../../assets/city/freefall/billboard.webp', import.meta.url).href;
const ART = artLoader(SRC, 'the FREEFALL poster');
/** load the poster (once); onReady when it has decoded; onFail on a missing file / a blip (the scene retries) */
export function warm(onReady, onFail) { ART.warm(onReady, onFail); }
export const ready = () => ART.ready;
/** the poster into the board's rect R (screen pt) — whole, COVER, on a near-black ground (a missing picture = the ground alone) */
export function paint(x, R) {
  x.save(); x.beginPath(); x.rect(R.x, R.y, R.w, R.h); x.clip();
  x.fillStyle = '#05030a'; x.fillRect(R.x, R.y, R.w, R.h);
  if (ART.ready && ART.img) { const img = ART.img, C = coverOf(R, img.naturalWidth || 848, img.naturalHeight || 448); x.drawImage(img, C.dx, C.dy, C.dw, C.dh); }
  x.restore();
}
