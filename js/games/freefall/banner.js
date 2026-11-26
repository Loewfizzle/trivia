// FREEFALL — THE ARRIVAL BANNERS (F3 — docs/freefall.md "THE ARRIVAL BANNERS"): on reaching an area a band crosses the foot of the screen
// — "THE SPEAKEASY" big, "FLOOR 80" under it — for 1.6 s, never over the ball or the big number. NIGHT = a dark band between two thin pink
// rules, white words in a pink glow; DAY = a frosted pale band, navy words (the stylesheet: .ff-banner — the CSS is the one source of the
// look). BAKED TEXT (bakedtext.js's way — HIGH RISE's lesson): the two lines are drawn WITH THEIR GLOW ONCE into ONE canvas, AHEAD of the
// arrival (the stage prepares the next area's band between two arrivals — nothing is baked in the frame the ball arrives in); showing it
// is one Web Animations one-shot: opacity + transform, no reflow. The words stay in the DOM for a reader (transparent under the canvas).
// DOM + canvas only — no rules, nothing counts.
import { h } from '../../ui/dom.js';
import { parseShadows } from './bakedtext.js';

/** a band's whole stay: in, read, out */
export const BANNER_MS = 1600;
/** the band's way in + out: opacity + transform only (a reduced-motion phone: it only fades) */
export const BANNER_KEYS = Object.freeze([{ opacity: 0, transform: 'translate3d(-5%, 0, 0)' }, { opacity: 1, transform: 'translate3d(0, 0, 0)', offset: 0.16 }, { opacity: 1, transform: 'translate3d(0, 0, 0)', offset: 0.84 }, { opacity: 0, transform: 'translate3d(5%, 0, 0)' }]);
export const BANNER_KEYS_STILL = Object.freeze([{ opacity: 0 }, { opacity: 1, offset: 0.16 }, { opacity: 1, offset: 0.84 }, { opacity: 0 }]);
const fontOf = cs => `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
const fontReady = f => { try { return !document.fonts || !document.fonts.check || document.fonts.check(f); } catch { return true; } };

/** createBanner() → { el, prepare(name, sub), show() → shown?, dirty(), ready(key), showing(), info(), destroy() } */
export function createBanner() {
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nameEl = h('b.ff-banner-n'), subEl = h('i.ff-banner-s'), cv = h('canvas.ff-banner-c', { 'aria-hidden': 'true' });
  const el = h('div.ff-banner', { role: 'status', 'aria-live': 'polite' }, h('span.ff-banner-t', nameEl, subEl), cv);
  let key = '', baked = '', anim = null, until = 0, bakes = 0, shows = 0, gone = false;
  /** one line, drawn letter by letter at its own spacing (a canvas has no letter-spacing everywhere), its shadows under it — the LAST of the list at the bottom */
  function line(c, text, cs, cx, cy, dpr) {
    const font = fontOf(cs), ls = parseFloat(cs.letterSpacing) || 0, shadows = parseShadows(cs.textShadow);
    c.font = font; c.textBaseline = 'middle'; c.textAlign = 'left';
    let w = 0;
    for (const ch of text) w += c.measureText(ch).width + ls;
    w -= ls;
    const put = (dx, fill) => { let x = cx - w / 2 + dx; c.fillStyle = fill; for (const ch of text) { c.fillText(ch, x, cy); x += c.measureText(ch).width + ls; } };
    for (let i = shadows.length - 1; i >= 0; i--) {
      const s = shadows[i], off = 10000;
      c.save(); c.shadowColor = s.color; c.shadowBlur = s.blur * dpr; c.shadowOffsetX = (s.x + off) * dpr; c.shadowOffsetY = s.y * dpr;
      put(-off, '#000'); c.restore();
    }
    put(0, cs.color);
  }
  /** the band's two lines into its canvas, from their OWN computed styles (the look's inks + glows) — never called in a frame a ball lands in */
  function bake() {
    if (gone || !key || !el.isConnected) return;
    const box = el.getBoundingClientRect();
    if (!box.width || !box.height) return;
    // (a long name on a narrow phone: the line is fitted to the band — "UNDER THE HARBOR" at 375 wide)
    nameEl.style.fontSize = '';
    const fit = box.width * 0.92 / Math.max(1, nameEl.scrollWidth || nameEl.getBoundingClientRect().width);
    if (fit < 1) nameEl.style.fontSize = `${(parseFloat(getComputedStyle(nameEl).fontSize) * fit).toFixed(2)}px`;
    el.classList.remove('is-baked');
    const nc = getComputedStyle(nameEl), sc = getComputedStyle(subEl), nb = nameEl.getBoundingClientRect(), sb = subEl.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 3), fN = fontOf(nc), fS = fontOf(sc);
    if (!fontReady(fN) || !fontReady(fS)) { const k = key; Promise.all([document.fonts.load(fN), document.fonts.load(fS)]).then(() => { if (!gone && k === key) { baked = ''; bake(); } }, () => {}); }
    cv.width = Math.ceil(box.width * dpr); cv.height = Math.ceil(box.height * dpr);
    const c = cv.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, box.width, box.height);
    line(c, nameEl.textContent, nc, box.width / 2, nb.top - box.top + nb.height / 2, dpr);
    line(c, subEl.textContent, sc, box.width / 2, sb.top - box.top + sb.height / 2, dpr);
    el.classList.add('is-baked');
    baked = `${key}|${nc.color}|${nc.textShadow}|${box.width}`; bakes++;
  }
  return {
    el,
    /** the NEXT arrival's band, made ready ahead of it (the stage calls this between two arrivals — a timer, never the frame) */
    prepare(name, sub) {
      const k = `${name}|${sub}`;
      if (k === key && baked) return;
      key = k; baked = '';
      nameEl.textContent = name; subEl.textContent = sub;
      bake();
    },
    /** is the band of this arrival the one that is ready? */
    ready: (name, sub) => key === `${name}|${sub}` && !!baked,
    /** the look (or the size) changed: the ready band is baked again in its new inks */
    dirty() { if (key) { baked = ''; bake(); } },
    /** the band crosses: one one-shot (opacity + transform) → false = a band is still up (the caller keeps this one for after it) */
    show(onDone) {
      if (performance.now() < until) return false;
      until = performance.now() + BANNER_MS; shows++;
      if (anim) anim.cancel();
      anim = el.animate ? el.animate(reduce ? BANNER_KEYS_STILL : BANNER_KEYS, { duration: BANNER_MS, easing: 'ease-out', fill: 'forwards' }) : null;
      if (anim && onDone) anim.onfinish = onDone; else if (onDone) setTimeout(onDone, BANNER_MS);
      return true;
    },
    showing: () => performance.now() < until,
    /** the run starts over: nothing is up */
    clear() { until = 0; if (anim) { anim.cancel(); anim = null; } },
    info: () => ({ key, baked: !!baked, bakes, shows, showing: performance.now() < until, w: cv.width, h: cv.height }),
    destroy() { gone = true; if (anim) anim.cancel(); el.remove(); },
  };
}
