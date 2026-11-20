// HIGH RISE — THE BAKED NUMBER (S5 — THE EFFECTS REBUILD; docs/highrise.md "THE EFFECTS REBUILD"). The owner's iPhone A/B: ?lean=1 halved
// Safari's slow frames — half of them were OUR over-the-game effects: the browser re-rasterising glowing text (a text-shadow's blur) at
// every landing. The bisect (tests/integration/highrise-paint.mjs --bisect) ranked THE FLOOR NUMBER first: its 84 px digits under a
// 34 px pink glow, repainted at every floor.
// The cure, SAME LOOK: each digit is drawn WITH ITS GLOW ONCE (from the number's own computed style — its font, colour, every
// text-shadow: the CSS stays the one source of the look, the gold, the day's ink, ?lean's switches included) into a small bitmap; a
// landing then only COPIES the 1 – 3 digits' bitmaps into ONE canvas over the number (drawImage — no blur, no text layout). The digit
// boxes underneath keep the layout + the reading (aria-label) with transparent, shadowless text. A style change (gold, the sky's tone,
// a resize) bakes the ten digits again — a few times a run, never in a landing's frame when it can be helped (stage.js warms both styles).
// DOM + canvas only — no rules, nothing counts.

/** "rgb(255, 0, 0) 0px 0px 14px, rgba(…) 0px 3px 0px" → [{ color, x, y, blur }] (the computed style's own order: the FIRST on top) */
export function parseShadows(s) {
  const out = [];
  if (!s || s === 'none') return out;
  let depth = 0, cur = '';
  const push = () => {
    const t = cur.trim(); cur = '';
    if (!t) return;
    const col = (t.match(/rgba?\([^)]*\)|#[0-9a-f]{3,8}\b|\b[a-z]+\b/i) || ['transparent'])[0], nums = t.replace(col, '').trim().split(/\s+/).map(parseFloat).filter(Number.isFinite);
    out.push({ color: col, x: nums[0] || 0, y: nums[1] || 0, blur: nums[2] || 0 });
  };
  for (const ch of s) { if (ch === '(') depth++; else if (ch === ')') depth--; if (ch === ',' && !depth) push(); else cur += ch; }
  push();
  return out;
}
const DIG = '0123456789';
/** the number's overlay: `node` = .hi-num (its digit boxes stay for the layout + the reading) → { set(n), dirty(), destroy() } */
export function bakedNumber(node, mark) {
  const cv = document.createElement('canvas');
  cv.className = 'hi-numc'; cv.setAttribute('aria-hidden', 'true');
  node.append(cv);
  node.classList.add('is-baked');
  let key = '', glyphs = null, adv = 0, gap = 0, pad = 0, lh = 0, dpr = 1, shown = -1, cssW = 0, cssH = 0, em = 84;
  const gw = new Float64Array(10);   // (each digit's OWN advance — the face's numerals are proportional: a 1 is narrow, as in the DOM)
  /** the ten digits, baked from the number's OWN computed style (read once a style — never in a plain landing) */
  function bake() {
    const cs = getComputedStyle(node), probe = cs;   // (the digits inherit the number's font + colour; the text-shadow is the number's)
    const font = `${probe.fontStyle} ${probe.fontWeight} ${probe.fontSize} ${probe.fontFamily}`, fill = probe.color, sh = probe.getPropertyValue('--hi-num-shadow').trim() || probe.textShadow;
    const k = `${font}|${fill}|${sh}|${Math.min(window.devicePixelRatio || 1, 3)}`;
    if (k === key && glyphs) return false;
    // (the font not here yet: bake now, and once more the moment it lands — never a fallback face left on screen)
    if (document.fonts && document.fonts.check && !document.fonts.check(font)) document.fonts.load(font).then(() => { key = ''; api.dirty(); }).catch(() => {});
    key = k; dpr = Math.min(window.devicePixelRatio || 1, 3);
    const px = parseFloat(probe.fontSize) || 84, lhV = parseFloat(probe.lineHeight);
    lh = Number.isFinite(lhV) ? lhV : px * 0.92;
    const shadows = parseShadows(sh);
    pad = Math.ceil(shadows.reduce((m, s) => Math.max(m, s.blur * 1.25 + Math.max(Math.abs(s.x), Math.abs(s.y))), 2));
    const m = document.createElement('canvas').getContext('2d');
    m.font = font;
    adv = 0; for (let i = 0; i < 10; i++) { gw[i] = m.measureText(DIG[i]).width; adv = Math.max(adv, gw[i]); }
    em = px;
    gap = px * 0.07;
    const met = m.measureText('0'), fa = met.fontBoundingBoxAscent || px * 0.95, fd = met.fontBoundingBoxDescent || px * 0.25, base = (lh - (fa + fd)) / 2 + fa;
    glyphs = [];
    for (const d of DIG) {
      const g = document.createElement('canvas'), w = adv + 2 * pad + px * 0.3, hh = lh + 2 * pad;   // (+0.3 em: the italic's lean past its box)
      g.width = Math.ceil(w * dpr); g.height = Math.ceil(hh * dpr);
      const c = g.getContext('2d');
      c.scale(dpr, dpr); c.font = font; c.textBaseline = 'alphabetic';
      const x = pad + px * 0.15, y = pad + base;
      // the shadows under the digit, the LAST of the list at the bottom (CSS paints the first on top) — each alone: the digit itself drawn
      // far off the canvas, only its shadow offset back onto it
      for (let i = shadows.length - 1; i >= 0; i--) {
        const s = shadows[i], off = 10000;
        c.save(); c.shadowColor = s.color; c.shadowBlur = s.blur * dpr; c.shadowOffsetX = (s.x + off) * dpr; c.shadowOffsetY = s.y * dpr; c.fillStyle = '#000';
        c.fillText(d, x - off, y); c.restore();
      }
      c.fillStyle = fill; c.fillText(d, x, y);
      glyphs.push(g);
    }
    shown = -1;
    return true;
  }
  function draw(n) {
    const s = String(n), count = s.length;
    let span = 0; for (let i = 0; i < count; i++) span += gw[s.charCodeAt(i) - 48] + (i ? gap : 0);
    const wNeed = span + 2 * pad + em * 0.3;
    if (Math.abs(wNeed - cssW) > 0.5 || Math.abs(lh + 2 * pad - cssH) > 0.5) {
      cssW = wNeed; cssH = lh + 2 * pad;
      cv.width = Math.ceil(cssW * dpr); cv.height = Math.ceil(cssH * dpr);
      cv.style.width = `${cssW}px`; cv.style.height = `${cssH}px`; cv.style.marginTop = `${-pad}px`;
    }
    const c = cv.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
    let x = 0;
    for (let i = 0; i < count; i++) { const d = s.charCodeAt(i) - 48; c.drawImage(glyphs[d], Math.round(x * dpr), 0); x += gw[d] + gap; }
  }
  const api = {
    /** the floor number (a landing: 1 – 3 bitmaps copied — no blur, no text) */
    set(n) { if (!glyphs) bake(); if (n === shown) return; shown = n; if (mark) mark('dom'); draw(n); },
    /** the number's style changed (gold · the sky's tone · a resize · ?lean): the ten digits are baked again, then drawn */
    dirty() { if (!glyphs) return; if (bake() && shown >= 0) { const n = shown; shown = -1; api.set(n); } },
    /** (the checks) */
    info: () => ({ key, pad, adv, dpr, glyphs: glyphs ? glyphs.length : 0, w: cv.width, h: cv.height }),
    destroy() { cv.remove(); node.classList.remove('is-baked'); },
  };
  return api;
}

/** a style read off an element's computed style → the font, the fill, the shadows, the spacing, the line height (+ the pad its glow needs) */
function styleOf(el) {
  const cs = getComputedStyle(el), px = parseFloat(cs.fontSize) || 20, lhV = parseFloat(cs.lineHeight), ls = parseFloat(cs.letterSpacing);
  const shadows = parseShadows(cs.textShadow);
  return { font: `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`, fill: cs.color, shadows, px, lh: Number.isFinite(lhV) ? lhV : px * 1.1, ls: Number.isFinite(ls) ? ls : 0,
    pad: Math.ceil(shadows.reduce((m, s) => Math.max(m, s.blur * 1.25 + Math.max(Math.abs(s.x), Math.abs(s.y))), 2)), key: `${cs.fontStyle}|${cs.fontWeight}|${cs.fontSize}|${cs.fontFamily}|${cs.color}|${cs.textShadow}|${cs.letterSpacing}` };
}
/** a piece of text WITH its glow, drawn once into a bitmap (letter by letter — the CSS letter-spacing kept on every engine) */
function bakePiece(S, text, dpr) {
  const m = document.createElement('canvas').getContext('2d');
  m.font = S.font;
  let w = 0; for (const ch of text) w += m.measureText(ch).width + S.ls;
  w -= S.ls;
  const met = m.measureText('M'), fa = met.fontBoundingBoxAscent || S.px * 0.95, fd = met.fontBoundingBoxDescent || S.px * 0.25, base = (S.lh - (fa + fd)) / 2 + fa, lean = S.px * 0.25;
  const g = document.createElement('canvas');
  g.width = Math.ceil((w + 2 * S.pad + lean) * dpr); g.height = Math.ceil((S.lh + 2 * S.pad) * dpr);
  const c = g.getContext('2d');
  c.scale(dpr, dpr); c.font = S.font; c.textBaseline = 'alphabetic';
  const line = (x0, y, paint) => { let x = x0; for (const ch of text) { paint(ch, x, y); x += c.measureText(ch).width + S.ls; } };
  const x0 = S.pad + lean / 2, y = S.pad + base;
  for (let i = S.shadows.length - 1; i >= 0; i--) {
    const s = S.shadows[i], off = 10000;
    c.save(); c.shadowColor = s.color; c.shadowBlur = s.blur * dpr; c.shadowOffsetX = (s.x + off) * dpr; c.shadowOffsetY = s.y * dpr; c.fillStyle = '#000';
    line(x0 - off, y, (ch, x, yy) => c.fillText(ch, x, yy)); c.restore();
  }
  c.fillStyle = S.fill; line(x0, y, (ch, x, yy) => c.fillText(ch, x, yy));
  return { g, w, lean };
}
const SPLIT = /(\d)/;
/** THE BAKED LINE (S5 — the announcer's lane: PERFECT ×7 under a 26 px glow was re-rasterised at every perfect): `node` = the lane (its
 *  text node stays — the reading + the checks — transparent + shadowless: css .hi-call.is-baked) → { set(text, styleKey), info() }. A call
 *  = its pieces' bitmaps copied into ONE canvas: the words ("PERFECT ×", "NEW BEST", "FASTER" …) and each digit baked ONCE a style. */
export function bakedLine(node) {
  const cv = document.createElement('canvas');
  cv.className = 'hi-callc'; cv.setAttribute('aria-hidden', 'true');
  node.append(cv); node.classList.add('is-baked');
  const styles = new Map(), pieces = new Map(), parts = [];
  let shownKey = '', cssW = 0, cssH = 0, dpr = 1, fontWait = false;
  return {
    /** the lane now says `text` in its current class; `sk` = what its style depends on (its class + the sky's tone + the size) */
    set(text, sk) {
      const k = `${sk}|${text}`;
      if (k === shownKey) return;
      shownKey = k;
      if (!text) { if (cssW) { const c = cv.getContext('2d'); c.clearRect(0, 0, cv.width, cv.height); } return; }
      dpr = Math.min(window.devicePixelRatio || 1, 3);
      let S = styles.get(sk);
      if (!S) { S = styleOf(node); styles.set(sk, S); if (styles.size > 24) styles.delete(styles.keys().next().value); }
      if (!fontWait && document.fonts && document.fonts.check && !document.fonts.check(S.font)) { fontWait = true; document.fonts.load(S.font).then(() => { pieces.clear(); shownKey = ''; fontWait = false; }).catch(() => {}); }
      // the pieces: the words between digits + each digit alone (a digit's bitmap serves every PERFECT ×n)
      parts.length = 0;
      for (const p of text.split(SPLIT)) if (p) parts.push(p);
      let w = 0, lean = 0;
      for (let i = 0; i < parts.length; i++) {
        const pk = `${S.key}|${dpr}|${parts[i]}`;
        let P = pieces.get(pk);
        if (!P) { P = bakePiece(S, parts[i], dpr); pieces.set(pk, P); if (pieces.size > 96) { const first = pieces.keys().next().value; pieces.delete(first); } }
        parts[i] = P; w += P.w + (i ? S.ls : 0); lean = P.lean;
      }
      const W = w + 2 * S.pad + lean, H = S.lh + 2 * S.pad;
      if (Math.abs(W - cssW) > 0.5 || Math.abs(H - cssH) > 0.5) {
        cssW = W; cssH = H;
        cv.width = Math.ceil(W * dpr); cv.height = Math.ceil(H * dpr);
        cv.style.width = `${W}px`; cv.style.height = `${H}px`; cv.style.marginTop = `${-S.pad}px`;
      }
      const c = cv.getContext('2d');
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
      let x = 0;
      for (let i = 0; i < parts.length; i++) { const P = parts[i]; c.drawImage(P.g, Math.round(x * dpr), 0); x += P.w + S.ls; }
    },
    info: () => ({ styles: styles.size, pieces: pieces.size, w: cv.width, h: cv.height }),
    destroy() { cv.remove(); node.classList.remove('is-baked'); },
  };
}
