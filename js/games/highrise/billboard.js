// HIGH RISE — THE B1 BILLBOARD (S5 — the owner's pick: Downloads\NEON\highrise-billboard-B-v2.png, the TOP one; docs/highrise.md "THE
// BILLBOARD"). ONE billboard: "HIGH" over "RISE", centred, filling most of the board — white-hot faces, HIGH a hot-pink edge, RISE a cyan
// one, both a THICK dark outline — over the REAL night scene (poster.js: the glowing tower in the clouds band, darkened for the words);
// a DARK foot band with a pink neon line along its top and "OPEN NOW" in big WHITE heavy letters (never black-on-pink). At the roof board's
// own 848 : 448 (JAYWALK's poster box). The lettering = path data in BOWLBY ONE (JAYWALK's billboard face — billboard-glyphs.js, GENERATED
// by scripts/build-highrise-billboard.mjs: no font load on the site). PURE canvas drawing — no DOM, no fetch.
// NOT in the city: the CITY chat installs assets/city/highrise/billboard.webp at go-live (JAYWALK's OPEN NOW face: the poster drawn whole).
import { HI_GLYPHS } from './billboard-glyphs.js';

/** the board's own shape (JAYWALK's / HOLD'EM's poster box) */
export const BOARD_W = 848, BOARD_H = 448;
/** THE LAYOUT, as shares of the board's height H (the mockup's): the words' cap heights + where they stand. The readability proof
 *  (tests/integration/highrise-billboard.mjs) measures them IN THE CITY against JAYWALK's live OPEN NOW poster — both pass with room. */
export const B1 = Object.freeze({
  wordCap: 0.255, highTop: 0.05, riseTop: 0.385, maxW: 0.9,
  bandTop: 0.745, line: 0.014, openCap: 0.14, openMaxW: 0.86,
});
export const PINK = '#ff4fd8', CYAN = '#36e0ff', FACE = '#fff4fc', INK = '#0c0410', BAND = '#0d0614';

let paths = null;
const P = () => paths || (paths = Object.fromEntries(Object.entries(HI_GLYPHS).map(([k, g]) => [k, { ...g, p: typeof Path2D === 'function' ? new Path2D(g.d) : null }])));
/** a word's cap height in px for a box W × H (its cap → the board's share, never wider than `maxW` of W) */
export const capFor = (g, W, H, cap, maxW) => Math.min(H * cap, (W * maxW) / (g.w / g.cap));
/** PURE: where the words stand in a W × H board → { high, rise, open: { cap, base, w }, bandY, lineH } (px) */
export function layout(W = BOARD_W, H = BOARD_H) {
  const G = HI_GLYPHS, hc = capFor(G.high, W, H, B1.wordCap, B1.maxW), rc = capFor(G.rise, W, H, B1.wordCap, B1.maxW), oc = capFor(G.open, W, H, B1.openCap, B1.openMaxW);
  const bandY = H * B1.bandTop;
  return {
    high: { cap: hc, base: H * B1.highTop + hc, w: G.high.w * hc / G.high.cap },
    rise: { cap: rc, base: H * B1.riseTop + rc, w: G.rise.w * rc / G.rise.cap },
    open: { cap: oc, base: bandY + (H - bandY + oc) / 2, w: G.open.w * oc / G.open.cap },
    bandY, lineH: Math.max(1, H * B1.line),
  };
}
function word(c, g, cx, base, cap, paint) { const s = cap / g.cap; c.save(); c.translate(cx - (g.w * s) / 2, base); c.scale(s, s); paint(g.p, s); c.restore(); }

/** the whole board into a W × H canvas context: `art` = the scene (a canvas / image at the board's aspect — poster.js) or null (the dark) */
export function paintBillboard(c, W, H, art = null) {
  const G = P(), L = layout(W, H), cx = W / 2;
  c.save();
  c.fillStyle = '#07040f'; c.fillRect(0, 0, W, H);
  if (art) c.drawImage(art, 0, 0, W, H);
  // THE FOOT BAND: dark, a hot-pink neon line along its top (its glow up over the scene)
  c.fillStyle = BAND; c.fillRect(0, L.bandY, W, H - L.bandY);
  const glow = c.createLinearGradient(0, L.bandY - H * 0.07, 0, L.bandY); glow.addColorStop(0, 'rgba(255,79,216,0)'); glow.addColorStop(1, 'rgba(255,79,216,0.38)');
  c.fillStyle = glow; c.fillRect(0, L.bandY - H * 0.07, W, H * 0.07);
  c.fillStyle = PINK; c.shadowColor = PINK; c.shadowBlur = H * 0.03; c.fillRect(0, L.bandY, W, L.lineH); c.shadowBlur = 0;
  c.fillStyle = 'rgba(255,214,246,0.9)'; c.fillRect(0, L.bandY + L.lineH * 0.3, W, Math.max(0.5, L.lineH * 0.3));
  // HIGH + RISE: the drop → the THICK dark outline (+ a soft neon glow off it) → the coloured edge → the white-hot face
  for (const [g, w, col] of [[G.high, L.high, PINK], [G.rise, L.rise, CYAN]]) {
    const cap = w.cap, sh = cap * 0.05;
    word(c, g, cx + sh * 0.4, w.base + sh, cap, (p, s) => { c.lineJoin = 'round'; c.strokeStyle = 'rgba(0,0,0,0.85)'; c.lineWidth = (cap * 0.24) / s; c.stroke(p); });
    word(c, g, cx, w.base, cap, (p, s) => {
      c.lineJoin = 'round';
      c.shadowColor = col; c.shadowBlur = cap * 0.28; c.strokeStyle = INK; c.lineWidth = (cap * 0.22) / s; c.stroke(p); c.shadowBlur = 0;
      c.strokeStyle = col; c.lineWidth = (cap * 0.1) / s; c.stroke(p);
      c.fillStyle = FACE; c.fill(p);
    });
  }
  // OPEN NOW: big WHITE heavy letters on the dark band (a fine dark edge — never black-on-pink)
  word(c, G.open, cx, L.open.base, L.open.cap, (p, s) => { c.lineJoin = 'round'; c.strokeStyle = INK; c.lineWidth = (L.open.cap * 0.12) / s; c.stroke(p); c.fillStyle = '#ffffff'; c.fill(p); });
  c.restore();
}
