// THE TRI-VISION (Nov 12 night) — THE JAYWALK POSTER, the roof board's second face (core/harbor-trivision.js): Grok's approved poster (the kid
// mid-hop across a wet night street, a voxel car's light trails behind him — assets/city/jaywalk/billboard.webp, scripts/build-jaywalk-billboard.mjs)
// fitted to the board by COVER — never stretched (the board ~1.84 : 1, the art 2 : 1 — the sides cropped, set 92 % right so the kid stays whole + the words get the room) —
// + the WORDS painted in code on the art's black left: JAYWALK big (hot pink, a white-hot core + a dark edge — a printed neon look, the hoodie's
// pink) and COMING SOON (NOW OPEN from JAYWALK's open day) under it in white with a dark edge, ~60 % of JAYWALK's height (the owner's HOLD'EM rule:
// it reads on the phone unzoomed). The lettering = path data (jaywalk-glyphs.js — no font load). The art loads LAZILY after the city's reveal
// (warmJaywalk — never in THE BOOT BUDGET); until it has landed the board stays on HOLD'EM (no turn). Drawn into the board's rect R (screen pt) by
// signs.js#buildBillboard's poster(): the same art by day + night (the lamps light it — THE LIGHT stays the board's own).
import { JW_GLYPHS } from './jaywalk-glyphs.js';

const SRC = new URL('../../../assets/city/jaywalk/billboard.webp', import.meta.url).href;
const PINK = '#ff3db4', PINK_D = '#5a0a3c', EDGE = '#12040e', CORE = '#ffe3f4';
let img = null, ready = false, paths = null;
const P = () => paths || (paths = Object.fromEntries(Object.entries(JW_GLYPHS).map(([k, g]) => [k, { ...g, p: new Path2D(g.d) }])));
/** load the poster (once; after the reveal — the scene calls it when the tri-vision is wanted); `onReady` when it has decoded */
export function warmJaywalk(onReady) {
  if (ready) { if (onReady) onReady(); return; }
  if (img || typeof Image === 'undefined') return;
  img = new Image(); img.decoding = 'async';
  img.onload = () => { const done = () => { ready = true; if (onReady) onReady(); }; if (img.decode) img.decode().then(done, done); else done(); };
  img.onerror = () => { img = null; };   // (a missing file: the board stays on HOLD'EM — the next warm tries again)
  img.src = SRC;
}
export const jaywalkReady = () => ready;
/** the art's place in the board's rect: COVER, 92 % right (the kid kept whole), centred up + down → { dx, dy, dw, dh } */
export function coverOf(R, iw = 640, ih = 320) {
  const s = Math.max(R.w / iw, R.h / ih), dw = iw * s, dh = ih * s;
  return { dx: R.x + (R.w - dw) * 0.92, dy: R.y + (R.h - dh) * 0.5, dw, dh };
}
/** the words' block in R: JAYWALK's cap height + COMING SOON's (~60 %), their baselines + the zone (the black left, up to the kid) */
export function wordsOf(R, bar = 'soon') {
  // (the kid's body starts at 57.9 % across the art at the words' height — measured on billboard.png; a magenta sign block above them at 51.6 %, the trails'
  //  reflection below at 47.6 % — the words' band sits between: their zone ends at 56.5 %)
  const G = JW_GLYPHS, C = coverOf(R), kidL = C.dx + C.dw * 0.565;
  const zx0 = R.x + R.w * 0.035, zx1 = Math.min(kidL - R.w * 0.02, R.x + R.w * 0.6), zw = zx1 - zx0, cx = (zx0 + zx1) / 2;
  const g2 = bar === 'open' ? G.open : G.soon, rj = G.jaywalk.w / G.jaywalk.cap, r2 = g2.w / g2.cap;
  const jc = Math.min(R.h * 0.3, zw / rj, zw / (0.6 * r2)), bc = jc * 0.6, gap = jc * 0.42, H = jc + gap + bc, top = R.y + (R.h - H) / 2;
  return { cx, zw, jc, bc, jb: top + jc, bb: top + H, kidL };
}
function word(x, g, cx, by, cap, paint) { const s = cap / g.cap; x.save(); x.translate(cx - (g.w * s) / 2, by); x.scale(s, s); paint(g.p, s); x.restore(); }

/** the poster face into R; bar: 'soon' | 'open'; sd: the sun's side (the shadows fall away from it; 0 at night) */
export function paintJaywalk(x, R, bar = 'soon', sd = 0) {
  const G = P();
  x.save();
  x.beginPath(); x.rect(R.x, R.y, R.w, R.h); x.clip();
  x.fillStyle = '#030208'; x.fillRect(R.x, R.y, R.w, R.h);
  if (ready && img) { const C = coverOf(R, img.naturalWidth || 640, img.naturalHeight || 320); x.drawImage(img, C.dx, C.dy, C.dw, C.dh); }
  const W = wordsOf(R, bar), sh = (sd > 0 ? -1 : 1) * W.jc * 0.05;
  // JAYWALK: a dark drop + edge → the pink glow → the pink face → the white-hot core (a band down the letters' middle)
  word(x, G.jaywalk, W.cx + sh, W.jb + Math.abs(sh), W.jc, p => { x.fillStyle = 'rgba(2,0,6,0.8)'; x.fill(p); });
  word(x, G.jaywalk, W.cx, W.jb, W.jc, (p, s) => {
    x.lineJoin = 'round';
    x.strokeStyle = EDGE; x.lineWidth = Math.max(0.4, W.jc * 0.16) / s; x.stroke(p);
    // (the glow's blur in device px: the board's pt × its dpr — the word's own scale divided out)
    x.save(); x.shadowColor = 'rgba(255,61,180,0.85)'; x.shadowBlur = W.jc * 0.5 * (x.getTransform ? Math.abs(x.getTransform().a) / s : 2);
    x.strokeStyle = PINK; x.lineWidth = Math.max(0.25, W.jc * 0.07) / s; x.stroke(p); x.restore();
    const g = x.createLinearGradient(0, -JW_GLYPHS.jaywalk.cap, 0, 0);
    g.addColorStop(0, PINK); g.addColorStop(0.3, '#ff8fd6'); g.addColorStop(0.5, CORE); g.addColorStop(0.7, '#ff8fd6'); g.addColorStop(1, PINK);
    x.fillStyle = g; x.fill(p);
    x.strokeStyle = PINK_D; x.lineWidth = Math.max(0.15, W.jc * 0.025) / s; x.stroke(p);
  });
  // COMING SOON / NOW OPEN: white letters with a dark edge (+ a soft drop) — HOLD'EM's bar, the same rule
  const g2 = bar === 'open' ? G.open : G.soon;
  word(x, g2, W.cx + sh * 0.6, W.bb + Math.abs(sh) * 0.6, W.bc, p => { x.fillStyle = 'rgba(2,0,6,0.75)'; x.fill(p); });
  word(x, g2, W.cx, W.bb, W.bc, (p, s) => { x.lineJoin = 'round'; x.strokeStyle = EDGE; x.lineWidth = Math.max(0.3, W.bc * 0.14) / s; x.stroke(p); x.fillStyle = '#ffffff'; x.fill(p); });
  x.restore();
}
