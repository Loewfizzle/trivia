// THE TRI-VISION (Nov 12 night) — THE JAYWALK POSTER, the roof board's second face (core/harbor-trivision.js). REBUILT in FR7 FIXES C (the owner's
// iPhone, Nov 13 3:12 am — "can't even see what this billboard says": the lettering ~1/3 of HOLD'EM's, thin pink squeezed into the left half, COMING
// SOON tiny, the art a dark smear on an ~85 pt board). Now it reads like the HOLD'EM face at 390, unzoomed — laid out in THE SAME POSTER BOX as
// HOLD'EM's (holdem-art.js#POSTER_ASPECT 848 : 448, fitted inside the board) so their sizes compare one to one:
//   JAYWALK  BIG across the poster (~94 % of its width — C2: Bowlby One, a heavy wide face: that is what HOLD'EM's cap height takes), its cap ≥ HOLD'EM's
//            (0.235 H); white-hot pink with a HEAVY dark outline + a drop, so it reads over any part of the art
//   THE BAND COMING SOON (NOW OPEN from JAYWALK's open day) on a SOLID hot-pink band across the poster's foot — its letters ≥ HOLD'EM's NOW OPEN
//            (0.135 H), white with a dark plum edge
//   THE ART  re-cropped TIGHT on the kid + the car's headlights (the kid big, right of centre, between the word + the band) and LIFTED (exposure +
//            contrast + the neon street brighter) by scripts/build-jaywalk-billboard.mjs → assets/city/jaywalk/billboard.webp at the poster's own
//            848 : 448 — COVER on the board, never stretched; under the billboard's lamps at night it glows like HOLD'EM's face, by day a printed poster
// FR7 FIXES C2 — A FACE THAT READS (the owner's iPhone, Nov 13 7 am: "JAYWALK needs a different font or something" — Bungee's thin pink + white
// blocks blurred at ~10 pt over the busy art): JAYWALK in BOWLBY ONE (a heavy, wide grotesque — no thin strokes), WHITE-HOT with a hot-pink edge,
// a THICK dark outline + a drop, on A CALM PANEL (a solid dark band across the poster's top — nothing busy under the letters); the art drawn
// BELOW the panel (shifted down: the kid's cap + the headlights under the word, never behind it); COMING SOON in the same heavy face on its band.
// The lettering = path data (jaywalk-glyphs.js — no font load). The art loads LAZILY after the city's reveal (warmJaywalk — never in THE BOOT
// BUDGET); until it has landed the board stays on HOLD'EM (no turn). Drawn into the board's rect R (screen pt) by signs.js#buildBillboard's poster().
import { JW_GLYPHS } from './jaywalk-glyphs.js';

const SRC = new URL('../../../assets/city/jaywalk/billboard.webp', import.meta.url).href;
const PINK = '#ff4fc4', PINK_HI = '#ffb3e6', CORE = '#fff4fb', EDGE = '#14030f', PLUM = '#3a0428';
/** how far the art moves down (a share of the panel's height): the kid's cap just under the panel's rule */
const ART_DROP = 0.08;
let img = null, ready = false, paths = null;
const P = () => paths || (paths = Object.fromEntries(Object.entries(JW_GLYPHS).map(([k, g]) => [k, { ...g, p: typeof Path2D === 'function' ? new Path2D(g.d) : null }])));
/** load the poster (once; after the reveal — the scene calls it when the tri-vision is wanted); `onReady` when it has decoded */
export function warmJaywalk(onReady, onFail) {
  if (ready) { if (onReady) onReady(); return; }
  if (img || typeof Image === 'undefined') return;
  const me = img = new Image(); img.decoding = 'async';
  img.onload = () => { const done = () => { ready = true; if (onReady) onReady(); }; if (me.decode) me.decode().then(done, done); else done(); };
  // (a missing file / a blip: the board stays on HOLD'EM — PLAY NOW 0c: the scene asks again on a backoff + reports it; never left for good)
  img.onerror = () => { if (img === me) img = null; if (onFail) onFail('the image failed'); };
  img.src = SRC;
}
export const jaywalkReady = () => ready;

/** the poster's own shape — HOLD'EM's (holdem-art.js#POSTER_ASPECT): both faces lay out in the same box */
export const JW_ASPECT = 848 / 448;
/** the poster box inside R (HOLD'EM's rule: its own aspect, fitted inside + centred) → { X, Y, W, H } */
export function boxOf(R) { let W = R.w, H = R.w / JW_ASPECT; if (H > R.h) { H = R.h; W = R.h * JW_ASPECT; } return { X: R.x + (R.w - W) / 2, Y: R.y + (R.h - H) / 2, W, H }; }
/** the art's place in R: COVER (the art is the poster's own 848 : 448 — the board's few % of difference cropped), centred → { dx, dy, dw, dh } */
export function coverOf(R, iw = 848, ih = 448) {
  const s = Math.max(R.w / iw, R.h / ih), dw = iw * s, dh = ih * s;
  return { dx: R.x + (R.w - dw) * 0.5, dy: R.y + (R.h - dh) * 0.5, dw, dh };
}
/** the words in R: JAYWALK's cap + baseline, the band's top + its words' cap + baseline (pt) */
export function wordsOf(R, bar = 'soon') {
  const B = boxOf(R), G = JW_GLYPHS, g2 = bar === 'open' ? G.open : G.soon, rj = G.jaywalk.w / G.jaywalk.cap, r2 = g2.w / g2.cap;
  const jc = Math.min(B.H * 0.25, (B.W * 0.94) / rj), jb = B.Y + B.H * 0.065 + jc;
  const bandY = B.Y + B.H * 0.775, bandH = R.y + R.h - bandY;
  const bc = Math.min(B.H * 0.145, (B.W * 0.86) / r2), bb = bandY + (bandH + bc) / 2;
  // THE CALM PANEL: solid from the board's top to a little under JAYWALK's baseline (its drop + outline inside it)
  const panelY = jb + B.H * 0.055;
  return { cx: B.X + B.W / 2, jc, jb, bc, bb, bandY, bandH, B, panelY };
}
/** the two faces' lettering heights in R (pt) — the owner's rule: JAYWALK's ≥ HOLD'EM's (the HOLD'EM numbers from holdem-art.js's own layout) */
export function capsOf(R, bar = 'soon') { const W = wordsOf(R, bar); return { word: W.jc, bar: W.bc }; }
function word(x, g, cx, by, cap, paint) { const s = cap / g.cap; x.save(); x.translate(cx - (g.w * s) / 2, by); x.scale(s, s); paint(g.p, s); x.restore(); }

/** the poster face into R; bar: 'soon' | 'open'; sd: the sun's side (the shadows fall away from it; 0 at night) */
export function paintJaywalk(x, R, bar = 'soon', sd = 0) {
  const G = P();
  x.save();
  x.beginPath(); x.rect(R.x, R.y, R.w, R.h); x.clip();
  x.fillStyle = '#08040e'; x.fillRect(R.x, R.y, R.w, R.h);
  const W = wordsOf(R, bar), sh = (sd > 0 ? -1 : 1) * W.jc * 0.06;
  // THE ART below the panel: COVER as before, moved DOWN so the kid's cap + the headlights sit just under the panel (never under the word)
  if (ready && img) { const C = coverOf(R, img.naturalWidth || 848, img.naturalHeight || 448), dy = (W.panelY - R.y) * ART_DROP; x.drawImage(img, C.dx, C.dy + dy, C.dw, C.dh); }
  // THE CALM PANEL: a solid dark band (a touch of plum at its foot), a fine hot-pink rule under it — nothing busy under the letters
  { const y1 = W.panelY, g = x.createLinearGradient(0, R.y, 0, y1);
    g.addColorStop(0, '#07020c'); g.addColorStop(0.8, '#0d0414'); g.addColorStop(1, '#16061f');
    x.fillStyle = g; x.fillRect(R.x, R.y, R.w, y1 - R.y);
    const rule = Math.max(0.3, W.B.H * 0.014);
    x.fillStyle = PINK; x.fillRect(R.x, y1, R.w, rule);
    // (a soft shade under the rule: the art steps back from the panel's edge)
    const s2 = x.createLinearGradient(0, y1 + rule, 0, y1 + rule + W.B.H * 0.06); s2.addColorStop(0, 'rgba(7,2,12,0.55)'); s2.addColorStop(1, 'rgba(7,2,12,0)');
    x.fillStyle = s2; x.fillRect(R.x, y1 + rule, R.w, W.B.H * 0.06); }
  // JAYWALK: the drop → the THICK dark outline → the hot-pink edge → the white-hot face (crisp: no glow blur at ~10 pt)
  word(x, G.jaywalk, W.cx + sh, W.jb + Math.abs(sh), W.jc, (p, s) => { x.lineJoin = 'round'; x.strokeStyle = 'rgba(0,0,0,0.9)'; x.lineWidth = (W.jc * 0.26) / s; x.stroke(p); x.fillStyle = 'rgba(0,0,0,0.9)'; x.fill(p); });
  word(x, G.jaywalk, W.cx, W.jb, W.jc, (p, s) => {
    x.lineJoin = 'round';
    x.strokeStyle = EDGE; x.lineWidth = (W.jc * 0.26) / s; x.stroke(p);
    x.strokeStyle = PINK; x.lineWidth = (W.jc * 0.12) / s; x.stroke(p);
    const g = x.createLinearGradient(0, -JW_GLYPHS.jaywalk.cap, 0, 0);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.55, CORE); g.addColorStop(1, PINK_HI);
    x.fillStyle = g; x.fill(p);
  });
  // THE BAND: solid hot pink across the foot (a lighter top edge, a dark rule above it), the words white with a dark plum edge + a soft drop
  { const y0 = W.bandY, h = W.bandH, g = x.createLinearGradient(0, y0, 0, y0 + h);
    g.addColorStop(0, '#ff5ccb'); g.addColorStop(0.5, '#f02fa8'); g.addColorStop(1, '#c21a86');
    x.fillStyle = g; x.fillRect(R.x, y0, R.w, h);
    x.fillStyle = EDGE; x.fillRect(R.x, y0 - Math.max(0.3, W.B.H * 0.012), R.w, Math.max(0.3, W.B.H * 0.012));
    x.fillStyle = 'rgba(255,230,246,0.55)'; x.fillRect(R.x, y0, R.w, Math.max(0.25, h * 0.06)); }
  const g2 = bar === 'open' ? G.open : G.soon;
  word(x, g2, W.cx + sh * 0.4, W.bb + Math.abs(sh) * 0.4, W.bc, p => { x.fillStyle = 'rgba(40,0,26,0.6)'; x.fill(p); });
  word(x, g2, W.cx, W.bb, W.bc, (p, s) => { x.lineJoin = 'round'; x.strokeStyle = PLUM; x.lineWidth = (W.bc * 0.2) / s; x.stroke(p); x.fillStyle = '#ffffff'; x.fill(p); });
  x.restore();
}
