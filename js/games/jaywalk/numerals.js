// JAYWALK — THE BIG NUMERALS (H5A's add-on — the owner, Nov 16: on his iMessage share card "172" read like "N2" — the 1's top flag
// The long notes: docs/games/jaywalk-notes.md
import { ctx2d } from '../../ui/canvas-safe.js';

/** the DOM numerals' font, as css/base.css names it (--font-num — the whole stack: a phone without the web font measures what it draws) */
export const NUM_FAMILY = "'Chakra Petch', system-ui, sans-serif";
/** the extra room between two glyphs of a numeral, in em (on top of the font's own advance) */
export const NUM_GAP = 0.09;
const FOOT = new Map();   // 'weight family' → { l, w, r, h, b } in em (w = 0: this font's 1 already stands on a foot — or it can't be measured)
const NONE = Object.freeze({ l: 0, w: 0, r: 0, h: 0, b: 0, adv: 0 });

/** THE FOOT of this font's "1" (em): l = its left edge from the glyph's origin · w = its width · r = how far it reaches past the
 *  glyph's advance · h = its height · b = where the baseline sits above the foot of a line-height-1 box · adv = the 1's advance.
 *  Measured once a font (a 1 drawn at 200 px, its stem read off the pixels); `fresh` measures again (the web font just landed). */
export function footOf(family, weight = 700, fresh = false) {
  const key = `${weight} ${family}`;
  if (!fresh && FOOT.has(key)) return FOOT.get(key);
  let out = NONE;
  try {
    const S = 200, cv = document.createElement('canvas');
    cv.width = 420; cv.height = 360;
    const c = ctx2d(cv);
    c.font = `${weight} ${S}px ${family}`; c.textBaseline = 'alphabetic'; c.fillStyle = '#fff';
    const X0 = 120, Y0 = 280, m = c.measureText('1');
    c.fillText('1', X0, Y0);
    const px = c.getImageData(0, 0, cv.width, cv.height).data;
    const span = y => { let a = -1, z = -1; for (let x = 0; x < cv.width; x++) if (px[(y * cv.width + x) * 4 + 3] > 128) { if (a < 0) a = x; z = x; } return a < 0 ? null : [a, z + 1]; };
    const mid = span(Y0 - Math.round(S * 0.3)), base = span(Y0 - 4);
    if (mid && base) {
      const t = mid[1] - mid[0], has = base[1] - base[0] > t * 1.6;   // (a base already wider than the stem: the font's own foot)
      const l = mid[0] - t * 0.8, r = mid[1] + t * 0.8, A = m.fontBoundingBoxAscent || S * 0.95, D = m.fontBoundingBoxDescent || S * 0.3;
      out = has ? { ...NONE, adv: m.width / S } : { l: (l - X0) / S, w: (r - l) / S, r: Math.max(0, (r - X0 - m.width) / S), h: t * 0.62 / S, b: Math.max(0, (S - A + D) / 2 / S), adv: m.width / S };
    }
    cv.width = 0; cv.height = 0;
  } catch { out = NONE; }
  // (kept only once the web font itself is in: a measure of the fallback font is right for what is drawn NOW, wrong a moment later)
  let ready = true;
  try { ready = document.fonts.check(`${weight} 64px ${family}`); } catch { ready = true; }
  if (ready) FOOT.set(key, out);
  return out;
}

/** DOM — the foot's numbers as CSS variables on `root` (css/jaywalk.css `.jw-d1::after` reads them); again once the web font is in */
export function prepNums(root, family = NUM_FAMILY, weight = 700) {
  const put = fresh => { const f = footOf(family, weight, fresh); for (const k of ['l', 'w', 'r', 'h', 'b']) root.style.setProperty(`--jw-1${k}`, String(+f[k].toFixed(4))); };
  put(false);
  try { document.fonts.load(`${weight} 64px ${family}`).then(() => put(true), () => {}); } catch { /* an old browser: the first measure stands */ }
}
/** DOM — a numeral into `el`: each digit its own box (the room between them is CSS), a "1" marked for its foot; its plain text for a reader */
export function setNum(el, text) {
  const t = String(text);
  if (el.dataset.num === t) return;
  el.dataset.num = t; el.dataset.dg = String(t.length); el.setAttribute('aria-label', t);   // (data-dg: the lane count steps down a size at 3 + 4 digits — css .jw-lanes[data-dg])
  el.replaceChildren(...t.split('').map(ch => { const s = document.createElement('span'); s.className = ch === '1' ? 'jw-dg jw-d1' : ch >= '0' && ch <= '9' ? 'jw-dg' : 'jw-dgx'; s.textContent = ch; s.setAttribute('aria-hidden', 'true'); return s; }));
}

const isDigit = ch => ch >= '0' && ch <= '9';
/** canvas — how wide drawNum draws `text` at the context's font (size px, the family + weight the font was set with) */
export function numWidth(c, text, size, family, weight = 900) {
  const f = footOf(family, weight), t = String(text);
  let w = 0;
  for (let i = 0; i < t.length; i++) { const ch = t[i]; w += c.measureText(ch).width + (ch === '1' ? f.r * size : 0); if (i + 1 < t.length && (isDigit(ch) || isDigit(t[i + 1]))) w += NUM_GAP * size; }
  return w;
}
/** canvas — draw `text` from x (its left edge; the baseline at y) glyph by glyph: the room between digits, a foot under every 1.
 *  Uses the context's own fill + shadow (call it once a pass). The context's font must be `${weight} ${size}px ${family}`. → its width */
export function drawNum(c, text, x, y, size, family, weight = 900) {
  const f = footOf(family, weight), t = String(text), keep = c.textAlign;
  c.textAlign = 'left';
  let at = x;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    c.fillText(ch, at, y);
    if (ch === '1' && f.w > 0) c.fillRect(at + f.l * size, y - f.h * size, f.w * size, f.h * size);
    at += c.measureText(ch).width + (ch === '1' ? f.r * size : 0);
    if (i + 1 < t.length && (isDigit(ch) || isDigit(t[i + 1]))) at += NUM_GAP * size;
  }
  c.textAlign = keep;
  return at - x;
}
