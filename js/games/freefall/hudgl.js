// FREEFALL — THE GL HUD (FIX D … hudgl.js#1
import * as THREE from 'three';
import { NAME_GAP } from './matchhud.js';

export const BIG_BLUR = 12;
const OFF = 10000, MAXW = 2048, NIL = [];
const nm = v => parseFloat(v) || 0;
const devS = () => Math.min(window.devicePixelRatio || 1, 3);
export const fontOf = cs => `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
const fontReady = f => { try { return !document.fonts || !document.fonts.check || document.fonts.check(f); } catch { return true; } };
const splitTop = s => { const out = []; let d = 0, cur = ''; for (const ch of s) { if (ch === '(') d++; else if (ch === ')') d--; if (ch === ',' && !d) { out.push(cur.trim()); cur = ''; } else cur += ch; } if (cur.trim()) out.push(cur.trim()); return out; };
const COL = /(?:rgba?|hsla?|hwb|color|lab|lch|oklab|oklch)\([^)]*\)|#[0-9a-f]{3,8}\b|\b(?!inset\b)[a-z]+\b/i;
// "rgb(255, 0, 0) 0px 0px 14px 2px, … hudgl.js#2
export function parseShadows(s) {
  if (!s || s === 'none') return [];
  return splitTop(s).map(t => { const m = t.match(COL), n = (m ? t.replace(m[0], '') : t).replace(/\binset\b/, '').trim().split(/\s+/).map(parseFloat).filter(Number.isFinite); return { color: m ? m[0] : 'transparent', x: n[0] || 0, y: n[1] || 0, blur: n[2] || 0, spread: n[3] || 0, inset: /\binset\b/.test(t) }; });
}
const reach = L => L.reduce((m, s) => (s.inset ? m : Math.max(m, s.blur * 1.25 + Math.max(Math.abs(s.x), Math.abs(s.y)) + Math.max(0, s.spread))), 0);
// in PAINT order (the list's last first): … hudgl.js#3
const lastBig = D => { let k = -1; for (let i = 0; i < D.length; i++) if (D[i].blur >= BIG_BLUR) k = i; return k; };
const clear = c => !c || c === 'transparent' || /^rgba\(.*,\s*0\)$/.test(c);
const path = (c, x, y, w, h, r) => { if (r > 0 && c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); };

// ---- THE PAINTER (an element's subtree, as … hudgl.js#4
let SC = 1;
function shadowed(c, s, draw) {
  if (!s.blur) { c.fillStyle = s.color; draw(s.x, s.y); return; }
  c.save(); c.shadowColor = s.color; c.shadowBlur = s.blur * SC; c.shadowOffsetX = (s.x + OFF) * SC; c.shadowOffsetY = s.y * SC; c.fillStyle = '#000'; draw(-OFF, 0); c.restore();
}
const isPx = v => /px$/.test(v);
function pseudo(el, w, pcs, r, L) {
  const cs = getComputedStyle(el, w);
  if (!cs || cs.content === 'none' || cs.content === 'normal' || cs.display === 'none' || cs.position !== 'absolute') return;
  const bl = nm(pcs.borderLeftWidth), bt = nm(pcs.borderTopWidth), W = r.width - bl - nm(pcs.borderRightWidth), H = r.height - bt - nm(pcs.borderBottomWidth);
  const lf = isPx(cs.left) ? nm(cs.left) : W - nm(cs.right) - nm(cs.width), tp = isPx(cs.top) ? nm(cs.top) : H - nm(cs.bottom) - nm(cs.height);
  const ww = isPx(cs.width) ? nm(cs.width) : W - lf - nm(cs.right), hh = isPx(cs.height) ? nm(cs.height) : H - tp - nm(cs.bottom);
  let xf = null;
  if (cs.transform && cs.transform !== 'none') { const v = cs.transform.slice(cs.transform.indexOf('(') + 1).split(',').map(parseFloat), q = cs.transformOrigin.split(' ').map(nm); xf = [v.length === 16 ? [v[0], v[1], v[4], v[5], v[12], v[13]] : v, q[0], q[1]]; }
  L.push({ cs, r: [r.left + bl + lf + nm(cs.marginLeft), r.top + bt + tp + nm(cs.marginTop), ww, hh], xf });
}
// the subtree → its paint ops in … hudgl.js#5
function collect(root, keep) {
  const L = [];
  const walk = el => {
    if (el.hidden) return;
    const cs = getComputedStyle(el);
    if (cs.display === 'none') return;
    const r = el.getBoundingClientRect();
    L.push({ cs, r: [r.left, r.top, r.width, r.height], xf: null });
    pseudo(el, '::before', cs, r, L);
    for (const n of el.childNodes) {
      if (n.nodeType === 3) { const t = n.data.replace(/\s+/g, ' ').trim(); if (!t) continue; const rg = document.createRange(); rg.selectNodeContents(n); const q = rg.getClientRects(); if (q.length) L.push({ cs, t, x: q[0].left, y: q[0].top, mid: r.top + r.height / 2 }); }
      else if (n.nodeType === 1 && (!keep || keep(n))) walk(n);
    }
    pseudo(el, '::after', cs, r, L);
  };
  walk(root);
  return L;
}
const len = (v, L) => (v === 'center' || v == null ? L / 2 : v === 'left' || v === 'top' ? 0 : v === 'right' || v === 'bottom' ? L : v.endsWith('%') ? nm(v) / 100 * L : nm(v));
function stops(g, list, L) {
  const P = list.map(t => { const m = t.match(COL), rest = m ? t.slice(m.index + m[0].length).trim() : ''; return [m ? m[0] : 'transparent', rest ? (rest.endsWith('%') ? nm(rest) / 100 : nm(rest) / L) : NaN]; });
  if (!Number.isFinite(P[0][1])) P[0][1] = 0;
  if (!Number.isFinite(P[P.length - 1][1])) P[P.length - 1][1] = 1;
  for (let i = 1; i < P.length - 1; i++) if (!Number.isFinite(P[i][1])) { let j = i; while (!Number.isFinite(P[j][1])) j++; for (let k = i; k < j; k++) P[k][1] = P[i - 1][1] + (P[j][1] - P[i - 1][1]) * (k - i + 1) / (j - i + 1); }
  let at = 0;
  for (const [col, p] of P) { at = Math.max(at, Math.min(1, Math.max(0, p))); g.addColorStop(at, col); }
}
const SIDES = { 'to top': 0, 'to right': 90, 'to bottom': 180, 'to left': 270 };
// a computed linear- / radial-gradient → { … hudgl.js#6
function grad(c, s, x, y, w, h) {
  const m = s.match(/^(linear|radial)-gradient\((.*)\)$/);
  if (!m) return null;
  const P = splitTop(m[2]);
  if (m[1] === 'linear') {
    let ang = 180, st = P;
    if (/^to\s|deg$|turn$/.test(P[0])) { st = P.slice(1); ang = P[0] in SIDES ? SIDES[P[0]] : parseFloat(P[0]) * (/turn$/.test(P[0]) ? 360 : 1); }
    const a = ang * Math.PI / 180, sx = Math.sin(a), sy = -Math.cos(a), L = Math.abs(w * sx) + Math.abs(h * sy), cx = x + w / 2, cy = y + h / 2;
    const g = c.createLinearGradient(cx - sx * L / 2, cy - sy * L / 2, cx + sx * L / 2, cy + sy * L / 2);
    stops(g, st, L);
    return { f: g, k: 1 };
  }
  let cx = x + w / 2, cy = y + h / 2, sz = '', st = P;
  if (/^(circle|ellipse|closest-|farthest-|at\s|-?\d)/.test(P[0])) {
    st = P.slice(1); const k = P[0].indexOf('at ');
    sz = (k < 0 ? P[0] : P[0].slice(0, k)).replace(/\b(ellipse|circle)\b/g, '').trim();
    if (k >= 0) { const q = P[0].slice(k + 3).trim().split(/\s+/); cx = x + len(q[0], w); cy = y + len(q[1], h); }
  }
  const dx = cx - x, dy = cy - y;
  let rx, ry;
  if (/closest-side/.test(sz)) { rx = Math.min(dx, w - dx); ry = Math.min(dy, h - dy); }
  else if (/\d/.test(sz)) { const v = sz.split(/\s+/); rx = len(v[0], w); ry = len(v[1] || v[0], h); }
  else { rx = Math.max(dx, w - dx) * Math.SQRT2; ry = Math.max(dy, h - dy) * Math.SQRT2; }   // (farthest-corner)
  rx = Math.max(rx, 0.01); ry = Math.max(ry, 0.01);
  const k = ry / rx, g = c.createRadialGradient(cx, cy / k, 0, cx, cy / k, rx);
  stops(g, st, rx);
  return { f: g, k };
}
function paintBox(c, { cs, r: [x, y, w, h], xf }) {
  c.save();
  if (xf) { const [m, ox, oy] = xf; c.translate(x + ox, y + oy); c.transform(m[0], m[1], m[2], m[3], m[4], m[5]); c.translate(-x - ox, -y - oy); }
  const rd = cs.borderTopLeftRadius, rad = Math.max(0, Math.min(rd.includes('%') ? nm(rd) / 100 * Math.min(w, h) : nm(rd), w / 2, h / 2));
  const sh = parseShadows(cs.boxShadow).filter(s => !s.inset);
  if (sh.length) {   // hudgl.js#30
    c.save(); c.beginPath(); c.rect(x - 999, y - 999, w + 1998, h + 1998); path(c, x, y, w, h, rad); c.clip('evenodd');
    for (let i = sh.length - 1; i >= 0; i--) { const s = sh[i], p = s.spread; shadowed(c, s, (dx, dy) => { c.beginPath(); path(c, x + dx - p, y + dy - p, w + 2 * p, h + 2 * p, rad > 0 ? Math.max(0, rad + p) : 0); c.fill(); }); }
    c.restore();
  }
  if (!clear(cs.backgroundColor)) { c.fillStyle = cs.backgroundColor; c.beginPath(); path(c, x, y, w, h, rad); c.fill(); }
  const g = cs.backgroundImage && cs.backgroundImage !== 'none' ? grad(c, cs.backgroundImage, x, y, w, h) : null;
  if (g) { c.save(); c.scale(1, g.k); c.fillStyle = g.f; c.beginPath(); path(c, x, y / g.k, w, h / g.k, rad); c.fill(); c.restore(); }
  const side = k => (/none|hidden/.test(cs[`border${k}Style`]) ? 0 : nm(cs[`border${k}Width`]));
  const T = side('Top'), B = side('Bottom'), Lw = side('Left'), Rw = side('Right');
  if (T) { c.fillStyle = cs.borderTopColor; c.fillRect(x, y, w, T); }
  if (B) { c.fillStyle = cs.borderBottomColor; c.fillRect(x, y + h - B, w, B); }
  if (Lw) { c.fillStyle = cs.borderLeftColor; c.fillRect(x, y, Lw, h); }
  if (Rw) { c.fillStyle = cs.borderRightColor; c.fillRect(x + w - Rw, y, Rw, h); }
  c.restore();
}
// the pen x of each letter: the … hudgl.js#7
function pens(c, ch, ls) { const out = new Float64Array(ch.length); let s = ''; for (let i = 0; i < ch.length; i++) { out[i] = (i ? c.measureText(s).width : 0) + i * ls; s += ch[i]; } return out; }
// the alphabetic baseline's drop below a MIDDLE … hudgl.js#31
const midDrop = c => { const a = c.measureText('F').actualBoundingBoxAscent; c.textBaseline = 'middle'; const b = c.measureText('F').actualBoundingBoxAscent; c.textBaseline = 'alphabetic'; return a - b; };
const ascOf = (c, cs) => c.measureText('0').fontBoundingBoxAscent || nm(cs.fontSize) * 0.95;
function paintText(c, { cs, t, x, y, mid: m }, glow, sharp, mid) {
  c.font = fontOf(cs); c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  const ch = Array.from(t), xs = pens(c, ch, nm(cs.letterSpacing)), base = mid ? m + midDrop(c) : y + ascOf(c, cs);
  const D = parseShadows(cs.textShadow).reverse(), K = lastBig(D);
  const put = (dx, dy) => { for (let i = 0; i < ch.length; i++) c.fillText(ch[i], x + xs[i] + dx, base + dy); };
  for (let i = 0; i < D.length; i++) if (i <= K ? glow : sharp) shadowed(c, D[i], put);
  if (sharp) { c.fillStyle = cs.color; put(0, 0); }
}
let MC0 = null;
const mctx = () => (MC0 ||= document.createElement('canvas').getContext('2d'));
const painted = cs => parseShadows(cs.boxShadow).length || !clear(cs.backgroundColor) || cs.backgroundImage !== 'none' || nm(cs.borderTopWidth) || nm(cs.borderBottomWidth) || nm(cs.borderLeftWidth) || nm(cs.borderRightWidth);
// the ops' named parts (box · glow … hudgl.js#8
function paint(ops, part, s) {
  const c0 = mctx(), use = [];
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const op of ops) {
    if (op.t == null) {
      if (!part.box || !painted(op.cs)) continue;
      const e = reach(parseShadows(op.cs.boxShadow)) + (op.xf ? Math.max(op.r[2], op.r[3]) : 0), [x, y, w, h] = op.r;
      x0 = Math.min(x0, x - e); y0 = Math.min(y0, y - e); x1 = Math.max(x1, x + w + e); y1 = Math.max(y1, y + h + e);
    } else {
      const D = parseShadows(op.cs.textShadow).reverse(), K = lastBig(D), sh = D.filter((_, i) => (i <= K ? part.glow : part.sharp));
      if (!sh.length && !part.sharp) continue;
      c0.font = fontOf(op.cs);
      const fs = nm(op.cs.fontSize), w = c0.measureText(op.t).width + nm(op.cs.letterSpacing) * op.t.length, e = reach(sh) + fs * 0.2;
      x0 = Math.min(x0, op.x - e); y0 = Math.min(y0, op.y - e); x1 = Math.max(x1, op.x + w + e); y1 = Math.max(y1, op.y + fs * 1.4 + e);
    }
    use.push(op);
  }
  if (!use.length) return null;
  x0 = Math.floor(x0 * s) / s; y0 = Math.floor(y0 * s) / s;
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.ceil((x1 - x0) * s)); cv.height = Math.max(1, Math.ceil((y1 - y0) * s));
  const c = cv.getContext('2d');
  SC = s; c.setTransform(s, 0, 0, s, -x0 * s, -y0 * s);
  for (const op of use) if (op.t == null) paintBox(c, op); else paintText(c, op, part.glow, part.sharp, part.mid);
  return { cv, x: x0, y: y0, w: cv.width / s, h: cv.height / s };
}
// an element → its layers [{ cv, … hudgl.js#9
export function bakeEl(root, keep, mid) {
  const ops = collect(root, keep), S = devS();
  const big = ops.some(op => op.t != null && lastBig(parseShadows(op.cs.textShadow).reverse()) >= 0);
  return (big ? [[{ box: 1 }, S], [{ glow: 1 }, 1], [{ sharp: 1 }, S]] : [[{ box: 1, glow: 1, sharp: 1 }, S]]).map(([p, s]) => paint(ops, { ...p, mid }, s)).filter(Boolean);
}

// ---- THE GLYPH ATLAS: a style's letters, … hudgl.js#10
const CHARS = ' 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ·+:-–—…!?\'.,&#/';
function pack(set) {
  const c0 = set.m, cells = [];
  set.map.clear();
  for (const ch of set.chars) {
    const m = c0.measureText(ch), l = m.actualBoundingBoxLeft || 0, r = m.actualBoundingBoxRight || 0, a = m.actualBoundingBoxAscent || 0, d = m.actualBoundingBoxDescent || 0, per = [];
    if (l + r > 0 && a + d > 0) set.layers.forEach(L => { const pad = (L.sh ? reach(L.sh) : 0) + 1, bx = Math.ceil((pad + l) * L.s) / L.s, by = Math.ceil((pad + a) * L.s) / L.s, w = bx + r + pad, h = by + d + pad, q = { ch, L, pad, l, a, bx, by, w, h, dw: Math.ceil(w * L.s) + 1, dh: Math.ceil(h * L.s) + 1 }; cells.push(q); per.push(q); });
    set.map.set(ch, per);
  }
  let x = 0, y = 0, rowH = 0, W = 1;
  for (const q of cells) { if (x + q.dw > MAXW) { x = 0; y += rowH; rowH = 0; } q.px = x; q.py = y; x += q.dw; rowH = Math.max(rowH, q.dh); W = Math.max(W, x); }
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = Math.max(1, y + rowH);
  const c = cv.getContext('2d');
  for (const q of cells) {
    c.save(); c.setTransform(q.L.s, 0, 0, q.L.s, q.px, q.py); SC = q.L.s;
    c.beginPath(); c.rect(0, 0, q.w, q.h); c.clip();   // hudgl.js#32
    c.font = set.font; c.textBaseline = 'alphabetic';
    const px = q.bx, py = q.by, put = (dx, dy) => c.fillText(q.ch, px + dx, py + dy);
    if (q.L.sh) for (const s of q.L.sh) shadowed(c, s, put); else { c.fillStyle = q.L.fill; put(0, 0); }
    c.restore();
    q.u0 = q.px / cv.width; q.v0 = q.py / cv.height; q.u1 = (q.px + q.w * q.L.s) / cv.width; q.v1 = (q.py + q.h * q.L.s) / cv.height;
  }
  set.cv = cv; set.ver++;
}
// a text style (an element's computed text: … hudgl.js#33
export function glyphSet(el, chars = CHARS) {
  const cs = getComputedStyle(el), font = fontOf(cs), D = parseShadows(cs.textShadow).reverse(), K = lastBig(D), S = devS(), layers = [];
  if (K >= 0) layers.push({ sh: D.slice(0, K + 1), s: 1 });
  if (K + 1 < D.length) layers.push({ sh: D.slice(K + 1), s: S });
  layers.push({ sh: null, fill: cs.color, s: S });
  const m = document.createElement('canvas').getContext('2d');
  m.font = font;
  const z = m.measureText('0'), fs = nm(cs.fontSize);
  const set = { font, fs, ls: nm(cs.letterSpacing), indent: nm(cs.textIndent), lh: nm(cs.lineHeight) || fs * 1.2, fa: z.fontBoundingBoxAscent || fs * 0.95, fd: z.fontBoundingBoxDescent || fs * 0.25, layers, m, chars: '', map: new Map(), cv: null, ver: 0, ready: fontReady(font),
    // the letters of `str` not in the … hudgl.js#34
    add(str) { let n = ''; for (const ch of str) if (!set.chars.includes(ch) && !n.includes(ch)) n += ch; if (!n) return false; set.chars += n; pack(set); return true; },
    width(t) { return t ? m.measureText(t).width + set.ls * Array.from(t).length : 0; } };
  set.add(chars);
  return set;
}

// ---- THE GL PASS: quads in canvas … hudgl.js#11
const QV = /* glsl */`
attribute vec4 aR, aU;
attribute float aK;
uniform vec2 uView, uO;
uniform vec3 uXf;
varying vec2 vUv; varying float vK;
void main() {
  vec2 k = vec2(position.x + 0.5, 0.5 - position.y);
  vec2 p = uO + (aR.xy + k * aR.zw - uO) * uXf.x + uXf.yz;
  vUv = mix(aU.xy, aU.zw, k); vK = aK;
  gl_Position = vec4(p.x * uView.x - 1.0, 1.0 - p.y * uView.y, 0.0, 1.0);
}`;
const QF = /* glsl */`
uniform sampler2D tT;
uniform float uA;
varying vec2 vUv; varying float vK;
void main() { vec4 c = texture2D(tT, vUv) * (uA * vK); if (c.a < 0.002) discard; gl_FragColor = c; }`;
const BLEND = { transparent: true, depthTest: false, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor };

// cubic-bezier(x1, y1, x2, y2) → t → eased (CSS's own)
const bez = (x1, y1, x2, y2) => t => {
  if (t <= 0) return 0; if (t >= 1) return 1;
  const ax = 1 - 3 * x2 + 3 * x1, bx = 3 * x2 - 6 * x1, cx = 3 * x1, ay = 1 - 3 * y2 + 3 * y1, by = 3 * y2 - 6 * y1, cy = 3 * y1;
  let u = t;
  for (let i = 0; i < 8; i++) { const x = ((ax * u + bx) * u + cx) * u - t, d = (3 * ax * u + 2 * bx) * u + cx; if (Math.abs(x) < 1e-5 || Math.abs(d) < 1e-6) break; u -= x / d; }
  u = Math.min(1, Math.max(0, u));
  return ((ay * u + by) * u + cy) * u;
};
export const EASE = bez(0.25, 0.1, 0.25, 1), EASE_OUT = bez(0, 0, 0.58, 1);
// keyframes [{ at, o, s, x, y … hudgl.js#12
function kf(F, p, seg, out) {
  let i = 0;
  while (i < F.length - 2 && p > F[i + 1].at) i++;
  const a = F[i], b = F[i + 1], span = b.at - a.at, u0 = span > 0 ? Math.min(1, Math.max(0, (p - a.at) / span)) : 1, u = seg ? seg(u0) : u0;
  out.o = a.o + (b.o - a.o) * u; out.s = a.s + (b.s - a.s) * u; out.x = a.x + (b.x - a.x) * u; out.y = a.y + (b.y - a.y) * u;
  return out;
}
// WAAPI-style frames ({ opacity, transform: 'scale(…)' | … hudgl.js#13
export function framesOf(K) {
  const n = K.length;
  return K.map((k, i) => {
    const t = k.transform || '', sc = /scale\(([-\d.]+)\)/.exec(t), tx = /translate3d\(([-\d.]+)%/.exec(t), ty = /translateY\(([-\d.]+)px\)/.exec(t);
    return { at: k.offset != null ? k.offset : n > 1 ? i / (n - 1) : 0, o: k.opacity == null ? 1 : k.opacity, s: sc ? +sc[1] : 1, x: tx ? +tx[1] / 100 : 0, y: ty ? +ty[1] : 0 };
  });
}
// css @keyframes ff-out (1.5 s ease-out) · … hudgl.js#14
export const OUT_FRAMES = framesOf([{ opacity: 0, transform: 'translateY(8px) scale(0.92)' }, { opacity: 1, offset: 0.14 }, { opacity: 1, offset: 0.78 }, { opacity: 0, transform: 'translateY(-4px)' }]);
export const LAST_FRAMES = framesOf([{ opacity: 0, transform: 'scale(0.7)' }, { opacity: 1, offset: 0.12 }, { opacity: 1, offset: 0.82 }, { opacity: 0 }]);
// the warning plate's blink (steps(2, jump-none) 0.7 … hudgl.js#35
export const BLINK_MS = 700, BLINK_LOW = 0.62;

// the stacking (the page's old order): the … hudgl.js#15
const CC = new THREE.Color();
const SL = { top: 0, num: 1, call: 2, bandG: 3, bandN: 4, bandS: 5, rail: 6, dots: 7, clock: 8, outs: 9, watch: 10, last: 11, lastL: 12, note: 13 }, NSL = 14;
const DOTS = ['', 'is-lost', 'is-made', 'is-out'], ME_DOTS = ['', 'is-made', 'is-out'];

// createHud(P, o) — THE HUD's pieces in … hudgl.js#16
export function createHud(P, o = {}) {
  const reduce = !!o.reduce, view2 = new THREE.Vector2(1, 1), uView = { value: view2 };
  let R = null, scene = null, cam = null, dpr = 1, cw = 1, chh = 1, ox = 0, oy = 0, bakes = 0, gen = 0, want = '', cur = '';
  let Qs = [], order = [], QG0 = null, api = null, muted = false;
  const QG = () => (QG0 ||= new THREE.PlaneGeometry(1, 1));
  function quads(n, slot) {
    const g = new THREE.InstancedBufferGeometry(), q0 = QG();
    g.index = q0.index; g.setAttribute('position', q0.getAttribute('position'));
    const aR = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4), aU = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4), aK = new THREE.InstancedBufferAttribute(new Float32Array(n).fill(1), 1);
    for (const a of [aR, aU, aK]) a.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('aR', aR); g.setAttribute('aU', aU); g.setAttribute('aK', aK); g.instanceCount = 0;
    const U = { tT: { value: null }, uA: { value: 1 }, uXf: { value: new THREE.Vector3(1, 0, 0) }, uO: { value: new THREE.Vector2() }, uView };
    const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: QV, fragmentShader: QF, uniforms: U, ...BLEND }));
    m.frustumCulled = false; m.matrixAutoUpdate = false; m.visible = false;
    const Q = { m, U, n, k: 0, own: null,
      put(i, x, y, w, h, u0, v0, u1, v1, a = 1) { const r = aR.array, u = aU.array, j = i * 4; r[j] = x; r[j + 1] = y; r[j + 2] = w; r[j + 3] = h; u[j] = u0; u[j + 1] = v0; u[j + 2] = u1; u[j + 3] = v1; aK.array[i] = a; },
      done(k) { Q.k = k; g.instanceCount = k; aR.needsUpdate = aU.needsUpdate = aK.needsUpdate = true; },
      dispose() { g.dispose(); m.material.dispose(); if (Q.own) Q.own.dispose(); } };
    Qs.push(Q); order[slot].push(m); if (scene) restack();
    return Q;
  }
  function restack() { scene.clear(); for (const L of order) for (const m of L) scene.add(m); }
  // a canvas → a texture, UPLOADED NOW … hudgl.js#36
  function tex(cv) {
    const t = new THREE.Texture(cv);
    t.flipY = false; t.premultiplyAlpha = true; t.generateMipmaps = false; t.minFilter = t.magFilter = THREE.LinearFilter; t.needsUpdate = true;
    try { R.initTexture(t); cv.width = cv.height = 0; } catch { /* uploaded at its first draw */ }
    return t;
  }
  // a baked element → a sprite: its … hudgl.js#37
  const sprite = (layers, slot) => ({ q: layers.map(b => { const Q = quads(1, slot); Q.own = tex(b.cv); Q.U.tT.value = Q.own; Q.put(0, b.x - ox, b.y - oy, b.w, b.h, 0, 0, 1, 1); Q.done(1); return Q; }) });
  const runQ = (slot, n) => ({ q: [quads(n, slot)], a: NaN, b: NaN, c: NaN, d: NaN });
  // a run's words changed? (four cached fields … hudgl.js#38
  const changed = (Rn, a, b, c, d) => { if (Rn.a === a && Rn.b === b && Rn.c === c && Rn.d === d) return false; Rn.a = a; Rn.b = b; Rn.c = c; Rn.d = d; return true; };
  function show(S, on, a = 1, sc = 1, tx = 0, ty = 0, cx = 0, cy = 0) { for (const Q of S.q) { Q.m.visible = on && a > 0.001 && Q.k > 0; Q.U.uA.value = a; Q.U.uXf.value.set(sc, tx, ty); Q.U.uO.value.set(cx, cy); } }
  const hide = S => { if (S) for (const Q of S.q) Q.m.visible = false; };

  // the page → canvas px (the canvas … hudgl.js#39
  const rel = el => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); const b = { l: r.left - ox + nm(cs.borderLeftWidth) + nm(cs.paddingLeft), r: r.right - ox - nm(cs.borderRightWidth) - nm(cs.paddingRight), t: r.top - oy + nm(cs.borderTopWidth) + nm(cs.paddingTop), b: r.bottom - oy - nm(cs.borderBottomWidth) - nm(cs.paddingBottom), w: r.width, h: r.height }; b.cx = (b.l + b.r) / 2; return b; };
  const textTop = el => { for (const n of el.childNodes) if (n.nodeType === 3 && n.data.trim()) { const rg = document.createRange(); rg.selectNodeContents(n); const q = rg.getClientRects(); if (q.length) return q[0].top - oy; } return null; };
  // a style's anchor: its content box + … hudgl.js#40
  function anchor(el, set, sample) {
    const keep = el.textContent;
    if (sample != null) el.textContent = sample;
    const b = rel(el), t = textTop(el);
    if (sample != null) el.textContent = keep;
    b.base = (t == null ? b.t : t) + set.fa;
    return b;
  }
  // lay a run: lines [{ t, x … hudgl.js#17
  function lay(Rn, set, lines, gap) {
    const Q = Rn.q[0];
    if (set.texVer !== set.ver) { if (set.tex) set.tex.dispose(); set.tex = tex(set.cv); set.texVer = set.ver; }
    Q.U.tT.value = set.tex;
    let k = 0;
    const D = dpr;
    for (const ln of lines) ln.xs = gap != null ? digitPens(set, ln.t, gap) : pens(set.m, Array.from(ln.t), set.ls);
    for (let li = 0; li < set.layers.length; li++) for (const ln of lines) {
      const cs = Array.from(ln.t);
      for (let i = 0; i < cs.length && k < Q.n; i++) {
        const cell = (set.map.get(cs[i]) || NIL)[li];
        if (cell) Q.put(k++, Math.round((ln.x + ln.xs[i]) * D) / D - cell.bx, Math.round(ln.y * D) / D - cell.by, cell.w, cell.h, cell.u0, cell.v0, cell.u1, cell.v1);
      }
    }
    Q.done(k);
    { const r = Q.m.geometry.attributes.aR.array; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let i = 0; i < k; i++) { const j = i * 4; x0 = Math.min(x0, r[j]); y0 = Math.min(y0, r[j + 1]); x1 = Math.max(x1, r[j] + r[j + 2]); y1 = Math.max(y1, r[j + 1] + r[j + 3]); } Rn.box = k ? [Math.floor(x0 * dpr) / dpr, Math.floor(y0 * dpr) / dpr, x1, y1] : null; }
    Rn.ext = lines.map(ln => ({ t: ln.t, l: ln.x, r: ln.x + (gap != null ? digitSpan(set, ln.t, gap) : set.width(ln.t) - set.ls), y: ln.y }));
  }
  // the big number's spacing (the old baked … hudgl.js#41
  function digitPens(set, t, gap) { const out = new Float64Array(t.length); let x = 0; for (let i = 0; i < t.length; i++) { out[i] = x; x += set.m.measureText(t[i]).width + gap; } return out; }
  const digitSpan = (set, t, gap) => { let w = 0; for (let i = 0; i < t.length; i++) w += set.m.measureText(t[i]).width + (i ? gap : 0); return w; };
  // THE TOP LINE clears the corner buttons (GO-LIVE G0.1 — docs/freefall.md): centred right of `edge`, too wide → two lines at the last ' · '
  function topLines(set, t, A, edge) {
    const l = Math.max(A.l, edge + 6), cx = (l + A.r) / 2, i = t.lastIndexOf(' · ');
    if (set.width(t) <= A.r - l || i < 0) return [{ t, x: centred(set, t, cx), y: A.base }];
    const a = t.slice(0, i), b = t.slice(i + 3), d = set.fs * 0.62;
    return [{ t: a, x: centred(set, a, cx), y: A.base - d }, { t: b, x: centred(set, b, cx), y: A.base + d }];
  }
  // a centred line's first pen (the page's … hudgl.js#18
  const centred = (set, t, cx) => cx - (set.indent + set.width(t)) / 2 + set.indent;
  // the alphabetic baseline's drop below a MIDDLE … hudgl.js#42
  // a look's change on the stage, for … hudgl.js#19
  function under(lk, gold, fn) {
    const stage = P.stage, was = stage.dataset.look, g0 = stage.classList.contains('is-gold');
    stage.dataset.look = lk; stage.classList.toggle('is-gold', gold);
    try { return fn(); } finally { stage.dataset.look = was; stage.classList.toggle('is-gold', g0); }
  }

  // ---- A LOOK's pieces (each look ONCE: … hudgl.js#43
  const K = { night: null, day: null };
  const fonts = new Set();
  function bakeLook(lk) {
    const k = { sets: [] }, set = (el, chars) => { const s = glyphSet(el, chars); s.tex = tex(s.cv); s.texVer = s.ver; k.sets.push(s); if (!s.ready) fonts.add(s.font); return s; };
    under(lk, false, () => {
      k.num = set(P.num, '0123456789'); k.numA = rel(P.num);
      k.top = set(P.top); k.topA = anchor(P.top, k.top, 'YOUR BEST 0');
      const c0 = P.call.textContent, cl0 = P.call.className;
      k.calls = new Map();
      for (const [t, cls] of o.kinds || []) { P.call.textContent = t; P.call.className = `ff-call ${cls}`; const b = rel(P.call); k.calls.set(t, { S: sprite(bakeEl(P.call), SL.call), cx: b.cx, cy: (b.t + b.b) / 2 }); }
      P.call.textContent = c0; P.call.className = cl0;
      k.warn = sprite(bakeEl(P.warn), SL.call);
      // THE BANDS: the ground (normal + THE … hudgl.js#44
      const B = P.band;
      B.s.textContent = 'FLOOR 0'; B.n.textContent = 'THE ROOFTOP';
      const ground = gold => { B.node.classList.toggle('is-gold', gold); const tcs = getComputedStyle(B.t), sub = set(B.s); const sa = anchor(B.s, sub); sa.base = (sa.t + sa.b) / 2 + midDrop(sub.m); return { S: sprite(bakeEl(B.node, () => false), SL.bandG), r: rel(B.node), sub, sa, row: /column/.test(tcs.gridAutoFlow), gap: nm(tcs.columnGap) }; };
      k.band = ground(false); k.bandG = ground(true);
      k.names = new Map();
      for (const [name, gold] of o.areas || []) {
        B.node.classList.toggle('is-gold', !!gold); B.n.textContent = name; B.n.style.fontSize = '';
        // (a long name on a narrow phone: … hudgl.js#45
        const fit = B.node.getBoundingClientRect().width * 0.92 / Math.max(1, B.n.scrollWidth || B.n.getBoundingClientRect().width);
        if (fit < 1) B.n.style.fontSize = `${(parseFloat(getComputedStyle(B.n).fontSize) * fit).toFixed(2)}px`;
        const r = rel(B.n);
        k.names.set(`${name}|${gold ? 1 : 0}`, { S: sprite(bakeEl(B.n, null, true), SL.bandN), l: r.l, w: r.r - r.l });
        B.n.style.fontSize = '';
      }
      B.node.classList.remove('is-gold');
      k.clock = set(P.clock, '0123456789:'); k.clockA = anchor(P.clock, k.clock, '0:30');
      k.watch = set(P.watch); k.watchA = anchor(P.watch, k.watch, 'W');
      // LAST ONE STANDING: its ground + its … hudgl.js#20
      const Ls = P.last;
      Ls.i[0].textContent = 'W ·'; Ls.i[1].textContent = 'W'; Ls.el.hidden = false;
      k.last = { S: sprite(bakeEl(Ls.el, n => n !== Ls.span), SL.last), box: rel(Ls.el) };
      k.lastSub = set(Ls.i[0]); k.lastA = [anchor(Ls.i[0], k.lastSub), anchor(Ls.i[1], k.lastSub)];
      Ls.el.hidden = true;
    });
    under(lk, true, () => { k.numG = set(P.num, '0123456789'); k.topG = set(P.top); });
    const s = k.num;
    k.numBase = k.numA.t + (s.lh - (s.fa + s.fd)) / 2 + s.fa;   // hudgl.js#21
    k.callL = [...k.calls.values()]; k.nameL = [...k.names.values()];
    if (!grp) groupMake(Math.ceil(cw * dpr), Math.ceil(k.num.fs * 2.4 * dpr));   // (the number's group target: made with the look — never in a run)
    k.runs = { num: runQ(SL.num, 12), top: runQ(SL.top, 240), sub: runQ(SL.bandS, 120), clock: runQ(SL.clock, 30), watch: runQ(SL.watch, 480), last: [runQ(SL.lastL, 160), runQ(SL.lastL, 160)] };
    K[lk] = k; bakes++;
    if (fonts.size) { const F = [...fonts]; fonts.clear(); Promise.all(F.map(f => document.fonts.load(f))).then(() => { if (R && api) api.dirty(); }, () => {}); }   // hudgl.js#46
    return k;
  }
  function hideLook(k) { if (!k) return; for (const c of k.calls.values()) hide(c.S); for (const S of [k.warn, k.band.S, k.bandG.S, k.last.S]) hide(S); for (const n of k.names.values()) hide(n.S); for (const r of Object.values(k.runs).flat()) hide(r); }
  function build() {
    for (const Q of Qs) Q.dispose();
    for (const k of [K.night, K.day]) if (k) for (const s of k.sets) if (s.tex) s.tex.dispose();
    if (st.roster) st.roster.tex.dispose();
    Qs = []; order = Array.from({ length: NSL }, () => []);
    scene = new THREE.Scene(); scene.matrixAutoUpdate = false; scene.matrixWorldAutoUpdate = false;
    cam = cam || new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    K.night = K.day = null; cur = ''; gen++;
    railS = null; grp = null; st.roster = null; st.rosterKey = ''; st.noteS = null; st.noteKey = '';
  }
  function useLook(lk) {
    if (!R || !lk) return;
    const r = P.play.getBoundingClientRect(); ox = r.left; oy = r.top;
    if (!K[lk]) bakeLook(lk);
    if (cur && cur !== lk) hideLook(K[cur]);
    cur = lk;
    const k = K[lk];
    for (const R2 of Object.values(k.runs).flat()) R2.a = NaN;
  }

  // ---- THE MATCH's pieces — baked at … hudgl.js#22
  let railS = null;
  function bakeRoster(rows) {
    const D = P.rail, was = D.el.hidden;
    D.el.hidden = false;
    if (!railS) railS = sprite(bakeEl(D.el, n => n !== D.inner), SL.rail);
    const items = [];
    D.inner.append(D.dot, D.name); P.outs.append(P.out);
    for (const r of rows) {
      const hex = r.hex || '#fff';
      D.dot.style.setProperty('--c', hex);
      for (const cls of r.me ? ME_DOTS : DOTS) { D.dot.className = `ff-rail-dot${r.me ? ' is-me' : ''}${cls ? ` ${cls}` : ''}`; for (const b of bakeEl(D.dot)) items.push({ kind: 'dot', uid: r.uid, cls, b }); }
      if (r.me) continue;
      D.name.textContent = r.rn; D.name.style.setProperty('--c', hex);
      for (const cls of ['', 'is-made']) { D.name.className = `ff-rail-name${cls ? ` ${cls}` : ''}`; for (const b of bakeEl(D.name)) items.push({ kind: 'name', uid: r.uid, cls, b }); }
      P.out.textContent = r.out; P.out.style.setProperty('--c', hex);
      const box = rel(P.out);
      for (const b of bakeEl(P.out)) items.push({ kind: 'out', uid: r.uid, key: `${r.out}|${hex}`, b, box });
    }
    D.dot.remove(); D.name.remove(); P.out.remove(); D.el.hidden = was;
    const abc = rows.map(r => r.name || '').join('');
    for (const k of [K.night, K.day]) if (k) for (const s of [k.watch, k.lastSub, k.top]) if (s.add(abc)) { if (s.tex) s.tex.dispose(); s.tex = tex(s.cv); s.texVer = s.ver; }
    let x = 0, y = 0, rowH = 0, W = 1;
    for (const it of items) { const w = it.b.cv.width + 1, h = it.b.cv.height + 1; if (x + w > MAXW) { x = 0; y += rowH; rowH = 0; } it.px = x; it.py = y; x += w; rowH = Math.max(rowH, h); W = Math.max(W, x); }
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = Math.max(1, y + rowH);
    const c = cv.getContext('2d');
    for (const it of items) { c.drawImage(it.b.cv, it.px, it.py); it.u = [it.px / cv.width, it.py / cv.height, (it.px + it.b.cv.width) / cv.width, (it.py + it.b.cv.height) / cv.height]; it.b.cv.width = it.b.cv.height = 0; }
    const old = st.roster, T = tex(cv), n = items.length + 1;
    const Ro = { tex: T, names: quads(n, SL.dots), dots: quads(n, SL.dots), slots: [quads(4, SL.outs), quads(4, SL.outs)], items, outs: rel(P.outs), gap: nm(getComputedStyle(P.outs).rowGap), byKey: new Map() };
    for (const Q of [Ro.names, Ro.dots, ...Ro.slots]) Q.U.tT.value = T;
    Ro.nd = { q: [Ro.names, Ro.dots] }; Ro.slotS = Ro.slots.map(Q => ({ q: [Q] }));
    for (const it of items) if (it.kind === 'out') { if (!Ro.byKey.has(it.key)) Ro.byKey.set(it.key, []); Ro.byKey.get(it.key).push(it); }
    if (old) { for (const Q of [old.names, old.dots, ...old.slots]) drop(Q); old.tex.dispose(); }
    st.roster = Ro;
    for (const r of rows) r.its = items.filter(it => it.uid === r.uid);
  }
  function drop(Q) { Q.dispose(); Qs.splice(Qs.indexOf(Q), 1); for (const L of order) { const i = L.indexOf(Q.m); if (i >= 0) L.splice(i, 1); } restack(); }

  // ---- THE STATE (the stage's: the number, … hudgl.js#47
  const st = { num: -1, gold: false, top: '', edge: 0, note: '', noteS: null, noteKey: '', near: false, nearAt: 0, call: null, band: null, rows: null, rosterKey: '', roster: null, outs: [], last: null, clock: '', watch: '', hudTo: 0, hudFrom: 0, hudAt: 0, hudMs: 0 };
  const F0 = { o: 1, s: 1, x: 0, y: 0 }, STILL = { o: 1, s: 1, x: 0, y: 0 };
  // THE GROUP FADE: an element's opacity fades … hudgl.js#48
  let grp = null;
  function groupMake(w, h) { const rt = new THREE.WebGLRenderTarget(w, h, { depthBuffer: false, stencilBuffer: false }); const Q = quads(1, SL.num); Q.U.tT.value = rt.texture; Q.own = rt; grp = { rt, Q, S: { q: [Q] }, on: false }; }
  function groupOn(Rn, a) {
    const b = Rn.box, w = Math.max(1, Math.ceil((b[2] - b[0]) * dpr)), h = Math.max(1, Math.ceil((b[3] - b[1]) * dpr));
    if (!grp) groupMake(w, h);
    if (w > grp.rt.width || h > grp.rt.height) grp.rt.setSize(Math.max(w, grp.rt.width), Math.max(h, grp.rt.height));   // (only ever grows — made with the look, wide enough)
    const W = grp.rt.width, H = grp.rt.height;
    grp.Q.put(0, b[0], b[1], w / dpr, h / dpr, 0, 1, w / W, 1 - h / H); grp.Q.done(1);
    grp.Rn = Rn; grp.on = true; grp.w = W; grp.h = H;
    show(grp.S, true, a);
  }
  const hudNow = now => { const u = st.hudMs > 0 ? Math.min(1, (now - st.hudAt) / st.hudMs) : 1; return st.hudFrom + (st.hudTo - st.hudFrom) * EASE(u); };
  // a value eased linearly to its target … hudgl.js#23
  const tw = (e, target, now, ms) => { if (e.v == null || reduce) { e.v = e.to = e.from = target; e.at = now; return target; } if (target !== e.to) { e.from = e.v; e.to = target; e.at = now; } const u = Math.min(1, (now - e.at) / ms); e.v = e.from + (e.to - e.from) * u; return e.v; };

  // ONE FRAME: every piece's place + alpha … hudgl.js#24
  function frame(now, S) {
    if (!R) return;
    if (want !== cur) useLook(want);
    const k = K[cur];
    if (!k) return;
    view2.set(2 / cw, 2 / chh);
    const live = S.live || S.starting, off = S.final || (S.nohud && live), R2 = k.runs;
    // .ff-hud's fade: 0.4 s in (ease) · … hudgl.js#49
    const to = off ? 0 : live || (S.over && S.watch) ? 1 : 0;
    if (to !== st.hudTo) { st.hudFrom = hudNow(now); st.hudTo = to; st.hudAt = now; st.hudMs = to === 0 && (S.over || off) ? 0 : S.over && S.watch ? 300 : 400; }
    const hudA = hudNow(now);
    // THE NUMBER (the gold set on NEW … hudgl.js#50
    const gold = st.gold && !S.watch, ns = gold ? k.numG : k.num;
    if (st.num >= 0 && changed(R2.num, st.num, gold, ns.ver, dpr)) { const t = String(st.num), gap = ns.fs * 0.07; lay(R2.num, ns, [{ t, x: k.numA.cx - digitSpan(ns, t, gap) / 2, y: k.numBase }], gap); }
    const na = hudA * (S.watch ? 0.82 : 1);
    if (st.num >= 0 && na > 0.001 && na < 0.999 && R2.num.box) { show(R2.num, false); groupOn(R2.num, na); } else { show(R2.num, st.num >= 0, na); if (grp) grp.on = false, hide(grp.S); }
    // THE TOP LINE (YOUR BEST n · n PLAYING)
    const ts = st.gold ? k.topG : k.top;
    if (R2.top.e !== st.edge) { R2.top.e = st.edge; R2.top.a = NaN; }
    if (changed(R2.top, st.top, st.gold, ts.ver, dpr)) { if (ts.add(st.top)) R2.top.c = ts.ver; lay(R2.top, ts, topLines(ts, st.top, k.topA, st.edge ? st.edge - ox : 0)); }
    show(R2.top, !!st.top && !S.dim && !S.final && !(S.nohud && live) && (!S.over || S.match));
    // THE CALL (its pop: ease-out over its … hudgl.js#51
    for (let i = 0; i < k.callL.length; i++) hide(k.callL[i].S);
    if (st.call && !off) {
      const c = k.calls.get(st.call.t), p = Math.min(1, (now - st.call.at) / st.call.ms);
      if (c && p < 1) { const f = kf(o.pop, EASE_OUT(p), null, F0); show(c.S, true, f.o * hudA, f.s, 0, 0, c.cx, c.cy); } else if (p >= 1) st.call = null;
    }
    // THE PLATE (THE LIGHTS ARE GOING OUT — its blink)
    show(k.warn, st.near && !off, hudA * (reduce ? 1 : (now - st.nearAt) % BLINK_MS < BLINK_MS / 2 ? 1 : BLINK_LOW));
    bandFrame(now, S, off, k);
    matchFrame(now, S, off, k);
    // THE NOTE (an unproven run's line · … hudgl.js#52
    const noteOn = !!st.note && live && !S.watch && !off && !S.noteHidden;
    if (noteOn && st.noteKey !== `${st.note}|${cur}`) { st.noteKey = `${st.note}|${cur}`; if (st.noteS) for (const Q of st.noteS.q) drop(Q); st.noteS = sprite(bakeEl(P.note), SL.note); }
    if (st.noteS) show(st.noteS, noteOn);
  }
  function bandFrame(now, S, off, k) {
    const b = st.band;
    st.bandA = 0;
    hide(k.band.S); hide(k.bandG.S); for (let i = 0; i < k.nameL.length; i++) hide(k.nameL[i].S);
    const p = b ? Math.min(1, (now - b.at) / b.ms) : 1;
    if (!b || p >= 1 || off || S.over || S.open) { hide(k.runs.sub); return; }
    const G = b.gold ? k.bandG : k.band, f = kf(b.frames, b.ease ? b.ease(p) : p, null, F0), tx = f.x * G.r.w, N = k.names.get(`${b.name}|${b.gold ? 1 : 0}`), ss = G.sub;
    if (changed(k.runs.sub, b, ss.ver, dpr, cur)) {
      if (ss.add(b.sub)) k.runs.sub.b = ss.ver;
      let sx = centred(ss, b.sub, G.sa.cx);
      b.dx = 0;
      if (G.row && N) { const total = N.w + G.gap + ss.width(b.sub), left = G.sa.cx - total / 2; b.dx = left - N.l; sx = left + N.w + G.gap; }   // hudgl.js#53
      lay(k.runs.sub, ss, [{ t: b.sub, x: sx, y: G.sa.base }]);
    }
    st.bandA = f.o; st.bandBox = N ? { l: N.l + tx + b.dx, r: N.l + N.w + tx + b.dx, t: G.r.t, b: G.r.b } : null;
    show(G.S, true, f.o, 1, tx, 0);
    if (N) show(N.S, true, f.o, 1, tx + b.dx, 0);
    show(k.runs.sub, true, f.o, 1, tx, 0);
  }
  // GO-LIVE G0.2 — the EASED names kept NAME_GAP apart too: two names passing each other never cross mid-ease (insertion sort, no garbage)
  const NS = [];
  function apart(M, n, now) {
    let m = 0, hi = -1e9;
    for (let j = 0; j < n; j++) { const d = M[j]; if (d.ny == null) continue; d.nv = tw(d.tny ||= {}, d.ny, now, 200); if (d.ny > hi) hi = d.ny; let i = m++; while (i > 0 && NS[i - 1].nv > d.nv) { NS[i] = NS[i - 1]; i--; } NS[i] = d; }
    for (let i = 1; i < m; i++) if (NS[i].nv < NS[i - 1].nv + NAME_GAP) NS[i].nv = NS[i - 1].nv + NAME_GAP;
    if (m && NS[m - 1].nv > hi) NS[m - 1].nv = hi;   // (the foot: never below the lowest settled name)
    for (let i = m - 2; i >= 0; i--) if (NS[i].nv > NS[i + 1].nv - NAME_GAP) NS[i].nv = NS[i + 1].nv - NAME_GAP;
  }
  // THE MATCH: the rail (dots + names … hudgl.js#25
  function matchFrame(now, S, off, k) {
    const M = st.rows, Ro = st.roster, on = !!M && !!Ro && !off && !S.sheet;
    if (railS) show(railS, on);
    if (Ro) {
      let a = 0, b = 0;
      const n = M ? M.length : 0, meLast = n && M[n - 1].me;
      if (on) apart(M, n, now);
      if (on) for (let j = 0; j < n; j++) {
        const d = M[meLast ? (j < n - 1 ? n - 2 - j : n - 1) : n - 1 - j];
        const y = tw(d.ty ||= {}, d.y, now, 200), ny = d.ny == null ? 0 : d.nv;
        for (const it of d.its || NIL) {
          if (it.kind === 'dot' && it.cls === d.cls) Ro.dots.put(a++, it.b.x - ox, it.b.y - oy + y, it.b.w, it.b.h, it.u[0], it.u[1], it.u[2], it.u[3], d.cls === 'is-lost' ? 0.6 : 1);
          else if (it.kind === 'name' && it.cls === (d.cls === 'is-made' ? 'is-made' : '')) Ro.names.put(b++, it.b.x - ox, it.b.y - oy + ny, it.b.w, it.b.h, it.u[0], it.u[1], it.u[2], it.u[3], d.cls === 'is-out' || d.cls === 'is-lost' ? 0.5 : 1);
        }
      }
      Ro.dots.done(a); Ro.names.done(b);
      show(Ro.nd, a + b > 0);
      // the callouts: their own lines' keyframes; stacked … hudgl.js#26
      let row = 0;
      for (let i = 0; i < Ro.slots.length; i++) {
        const Q = Ro.slots[i], c = st.outs[i];
        Q.m.visible = false;
        if (!c || off) continue;
        const p = (now - c.at) / c.ms;
        if (p >= 1) { st.outs.splice(i, 1); i--; continue; }
        let its = Ro.byKey.get(c.key);
        if (!its) for (const [kk, v] of Ro.byKey) if (kk.split('|')[0] === c.key.split('|')[0]) its = v;   // hudgl.js#54
        if (!its) continue;
        const box = its[0].box, dy = Ro.outs.t + row * (box.h + Ro.gap) - box.t, f = reduce ? STILL : kf(OUT_FRAMES, p, EASE_OUT, F0);
        for (let j = 0; j < its.length; j++) { const it = its[j]; Q.put(j, it.b.x - ox, it.b.y - oy + dy, it.b.w, it.b.h, it.u[0], it.u[1], it.u[2], it.u[3]); }
        Q.done(its.length); row++;
        show(Ro.slotS[i], true, f.o, f.s, 0, f.y, box.cx, box.t + dy + box.h / 2);
      }
    }
    const R2 = k.runs;
    // the clock (the last half minute) · … hudgl.js#27
    if (changed(R2.clock, st.clock, k.clock.ver, dpr, 0)) { lay(R2.clock, k.clock, [{ t: st.clock, x: k.clockA.l + k.clock.indent, y: k.clockA.base }]); }
    show(R2.clock, !!st.clock && !off);
    const ws = k.watch;
    if (changed(R2.watch, st.watch, ws.ver, dpr, 0)) {
      if (ws.add(st.watch)) R2.watch.b = ws.ver;
      const A = k.watchA, lines = wrap(ws, st.watch, A.r - A.l), lh = ws.lh, top = A.b - lines.length * lh, half = (lh - (ws.fa + ws.fd)) / 2;
      lay(R2.watch, ws, lines.map((t, i) => ({ t, x: centred(ws, t, A.cx), y: top + i * lh + half + ws.fa })));
    }
    show(R2.watch, !!st.watch && !S.final && !(S.nohud && (S.live || S.starting)));
    // LAST ONE STANDING (the card's keyframes; its … hudgl.js#55
    const L = st.last;
    if (L && (now - L.at >= L.ms || off)) st.last = null;
    hide(k.last.S); hide(R2.last[0]); hide(R2.last[1]);
    if (st.last) {
      const p = (now - L.at) / L.ms, f = reduce ? STILL : kf(LAST_FRAMES, p, EASE_OUT, F0), bx = k.last.box, cx = bx.cx, cy = (bx.t + bx.b) / 2;
      show(k.last.S, true, f.o, f.s, 0, 0, cx, cy);
      for (let i = 0; i < 2; i++) {
        const t = L.lines[i] || '', ls = k.lastSub;
        if (changed(R2.last[i], t, ls.ver, dpr, 0)) { if (ls.add(t)) R2.last[i].b = ls.ver; lay(R2.last[i], ls, [{ t, x: centred(ls, t, k.lastA[i].cx), y: k.lastA[i].base }]); }
        show(R2.last[i], !!t, f.o, f.s, 0, 0, cx, cy);
      }
    }
  }
  function wrap(set, text, W) {
    const out = [];
    for (const para of String(text).split('\n')) {
      let line = '';
      for (const w of para.replace(/[ \t]+/g, ' ').trim().split(' ')) { const t = line ? `${line} ${w}` : w; if (line && set.width(t) - set.ls > W) { out.push(line); line = w; } else line = t; }
      out.push(line);
    }
    return out;
  }

  api = {
    // built on a view's renderer — a … hudgl.js#56
    attach(view) { R = view && view.renderer ? view.renderer : null; if (!R) return; const z = view.cssSize(); cw = z[0] || 1; chh = z[1] || 1; dpr = z[2] || 1; build(); },
    // the look to draw (its pieces baked … hudgl.js#28
    look(lk) { want = lk; },
    // the page's size changed / a font … hudgl.js#57
    dirty() { if (R) { const lk = cur || want; build(); if (lk) useLook(lk); } },
    // the other look made ready while nothing … hudgl.js#58
    warmOther() { if (R && cur) { const lk = cur === 'day' ? 'night' : 'day'; if (!K[lk]) { const r = P.play.getBoundingClientRect(); ox = r.left; oy = r.top; bakeLook(lk); hideLook(K[lk]); } } },
    size(w, h, d) { cw = w || 1; chh = h || 1; dpr = d || 1; },
    num(n) { st.num = n; },
    gold(on) { st.gold = !!on; },
    top(t) { st.top = String(t || ''); },
    edge(x) { st.edge = x || 0; },
    note(t) { st.note = String(t || ''); },
    say(t, ms, now) { st.call = { t, ms, at: now }; },
    unsay() { st.call = null; },
    band(name, sub, gold, ms, frames, ease) { st.band = { name, sub, gold: !!gold, ms, frames, ease, at: performance.now(), dx: 0 }; },
    unband() { st.band = null; },
    near(on, now) { if (on && !st.near) st.nearAt = now; st.near = !!on; },
    // THE MATCH: the rail's records [{ uid, … hudgl.js#29
    rail(rows, key) { if (!R || !cur) return; if (key !== st.rosterKey) { st.rosterKey = key; const r = P.play.getBoundingClientRect(); ox = r.left; oy = r.top; bakeRoster(rows); } st.rows = rows; },
    railOff() { st.rows = null; },
    callout(key, ms) { st.outs.push({ key, at: performance.now(), ms }); },
    last(lines, ms) { st.last = { lines, at: performance.now(), ms }; },
    clock(t) { st.clock = String(t || ''); },
    watch(t) { st.watch = String(t || ''); },
    reset() { st.call = null; st.band = null; st.outs.length = 0; st.last = null; st.clock = ''; st.watch = ''; st.rows = null; st.near = false; },
    frame,
    /** the frame's LAST pass (after the veil) */
    // (the checks' own: the picture without its … hudgl.js#59
    mute(on) { muted = !!on; },
    draw() {
      if (!R || !scene || muted) return;
      if (grp && grp.on) {   // hudgl.js#60
        const Q = grp.Rn.q[0], b = grp.Rn.box, vx = view2.x, vy = view2.y, c0 = R.getClearAlpha();
        R.getClearColor(CC); view2.set(2 * dpr / grp.w, 2 * dpr / grp.h); Q.U.uXf.value.set(1, -b[0], -b[1]); Q.U.uA.value = 1; Q.m.visible = true;
        R.setRenderTarget(grp.rt); R.setClearColor(0x000000, 0); R.clear(true, false, false); R.render(Q.m, cam);
        R.setRenderTarget(null); R.setClearColor(CC, c0); view2.set(vx, vy); Q.U.uXf.value.set(1, 0, 0); Q.m.visible = false;
      } let any = false; for (const m of scene.children) if (m.visible) { any = true; break; } if (!any) return; const a = R.autoClear; R.autoClear = false; R.render(scene, cam); R.autoClear = a; },
    info: () => ({ on: !!R, look: cur, bakes, gen, meshes: Qs.length, shown: Qs.filter(Q => Q.m.visible).length, num: st.num, gold: st.gold, top: st.top, call: st.call ? st.call.t : '', band: st.band ? `${st.band.name} · ${st.band.sub}` : '', near: st.near, outs: st.outs.map(c => c.key.split('|')[0]), last: st.last ? st.last.lines.join(' ') : '', clock: st.clock, watch: st.watch, note: st.note, roster: st.roster ? st.roster.items.length : 0, nameY: st.rows ? st.rows.filter(d => d.ny != null).map(d => d.nv) : [], bandA: st.bandA || 0, bands: K[cur] ? [...K[cur].names.keys()] : [], bandBox: st.bandA ? st.bandBox : null, lines: K[cur] ? Object.fromEntries(Object.entries(K[cur].runs).map(([n, r]) => [n, Array.isArray(r) ? r.map(x => x.ext || null) : r.ext || null])) : null }),
    destroy() { for (const Q of Qs) Q.dispose(); for (const k of [K.night, K.day]) if (k) for (const s of k.sets) if (s.tex) s.tex.dispose(); if (st.roster) st.roster.tex.dispose(); Qs = []; R = null; },
  };
  return api;
}
