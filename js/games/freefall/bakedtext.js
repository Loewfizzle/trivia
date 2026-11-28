// FREEFALL — THE BAKED NUMBER (F2 — docs/freefall.md "THE … bakedtext.js#1

// "rgb(255, 0, 0) 0px 0px 14px, rgba(…) 0px 3px 0px" → [{ … bakedtext.js#2
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
/** the digit sets kept (the plain + the gold of the size on screen) */
export const SETS_KEPT = 2;
const fontReady = f => { try { return !document.fonts || !document.fonts.check || document.fonts.check(f); } catch { return true; } };
const zero = list => { for (const g of list) { g.width = 0; g.height = 0; } };

// the number's overlay: `node` = .ff-num (its digit boxes … bakedtext.js#3
export function bakedNumber(node) {
  const cv = document.createElement('canvas');
  cv.className = 'ff-numc'; cv.setAttribute('aria-hidden', 'true');
  node.append(cv);
  node.classList.add('is-baked');
  let key = '', glyphs = null, gap = 0, pad = 0, lh = 0, dpr = 1, shown = -1, cssW = 0, cssH = 0, em = 84, gw = null;
  const sets = new Map();   // style key → { glyphs, gw, gap, pad, lh, em, dpr } (most recent last)
  /** the ten digits, baked from the number's OWN computed style (read once a style — never in a plain floor) */
  function bake() {
    const cs = getComputedStyle(node);
    const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`, fill = cs.color, sh = cs.getPropertyValue('--ff-num-shadow').trim() || cs.textShadow;
    const k = `${font}|${fill}|${sh}|${Math.min(window.devicePixelRatio || 1, 3)}`;
    if (k === key && glyphs) return false;
    // (the font not here yet: bake now, and once more the moment it lands — never a fallback face left on screen)
    const ready = fontReady(font);
    if (!ready) document.fonts.load(font).then(() => { for (const S of sets.values()) zero(S.glyphs); sets.clear(); key = ''; glyphs = null; if (shown >= 0) { const n = shown; shown = -1; api.set(n); } }).catch(() => {});
    const had = sets.get(k);
    if (had) { sets.delete(k); sets.set(k, had); ({ glyphs, gw, gap, pad, lh, em, dpr } = had); key = k; shown = -1; cssW = 0; return true; }
    key = k; dpr = Math.min(window.devicePixelRatio || 1, 3); cssW = 0;
    const px = parseFloat(cs.fontSize) || 84, lhV = parseFloat(cs.lineHeight);
    lh = Number.isFinite(lhV) ? lhV : px * 0.92;
    const shadows = parseShadows(sh);
    pad = Math.ceil(shadows.reduce((m, s) => Math.max(m, s.blur * 1.25 + Math.max(Math.abs(s.x), Math.abs(s.y))), 2));
    const m = document.createElement('canvas').getContext('2d');
    m.font = font;
    gw = new Float64Array(10); let adv = 0; for (let i = 0; i < 10; i++) { gw[i] = m.measureText(DIG[i]).width; adv = Math.max(adv, gw[i]); }
    em = px; gap = px * 0.07;
    const met = m.measureText('0'), fa = met.fontBoundingBoxAscent || px * 0.95, fd = met.fontBoundingBoxDescent || px * 0.25, base = (lh - (fa + fd)) / 2 + fa;
    glyphs = [];
    for (const d of DIG) {
      const g = document.createElement('canvas'), w = adv + 2 * pad + px * 0.3, hh = lh + 2 * pad;   // (+0.3 em: an italic's lean past its box)
      g.width = Math.ceil(w * dpr); g.height = Math.ceil(hh * dpr);
      const c = g.getContext('2d');
      c.scale(dpr, dpr); c.font = font; c.textBaseline = 'alphabetic';
      const x = pad + px * 0.15, y = pad + base;
      // the shadows under the digit, the LAST of the list at the … bakedtext.js#4
      for (let i = shadows.length - 1; i >= 0; i--) {
        const s = shadows[i], off = 10000;
        c.save(); c.shadowColor = s.color; c.shadowBlur = s.blur * dpr; c.shadowOffsetX = (s.x + off) * dpr; c.shadowOffsetY = s.y * dpr; c.fillStyle = '#000';
        c.fillText(d, x - off, y); c.restore();
      }
      c.fillStyle = fill; c.fillText(d, x, y);
      glyphs.push(g);
    }
    if (ready) { sets.set(k, { glyphs, gw, gap, pad, lh, em, dpr }); while (sets.size > SETS_KEPT) { const [k0, S0] = sets.entries().next().value; sets.delete(k0); if (S0.glyphs !== glyphs) zero(S0.glyphs); } }
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
    /** the floor number (a floor passed: 1 – 3 bitmaps copied — no blur, no text) */
    set(n) { if (!glyphs) bake(); if (n === shown) return; shown = n; draw(n); },
    // the number's style changed (gold · a resize): the ten … bakedtext.js#5
    dirty() { if (!glyphs) return; if (bake() && shown >= 0) { const n = shown; shown = -1; api.set(n); } },
    // bake the set of the number's CURRENT style now (the … bakedtext.js#6
    warm() { bake(); },
    info: () => ({ key, pad, dpr, glyphs: glyphs ? glyphs.length : 0, sets: sets.size, w: cv.width, h: cv.height }),
    destroy() { cv.remove(); node.classList.remove('is-baked'); },
  };
  return api;
}
