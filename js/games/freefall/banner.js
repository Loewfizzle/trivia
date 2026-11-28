// FREEFALL — THE ARRIVAL BANNERS (F3 — docs/freefall.md "THE … banner.js#1
import { h } from '../../ui/dom.js';
import { parseShadows } from './bakedtext.js';

/** a band's whole stay: in, read, out */
export const BANNER_MS = 1600;
/** the band's way in + out: opacity + transform only (a reduced-motion phone: it only fades). At rest a band is ALL BUT CLEAR (0.001 — never
 *  0: a clear layer is dropped by the browser and painted again at the arrival; this one stays on the GPU) */
export const BANNER_REST = 0.001;
export const BANNER_KEYS = Object.freeze([{ opacity: BANNER_REST, transform: 'translate3d(-5%, 0, 0)' }, { opacity: 1, transform: 'translate3d(0, 0, 0)', offset: 0.16 }, { opacity: 1, transform: 'translate3d(0, 0, 0)', offset: 0.84 }, { opacity: BANNER_REST, transform: 'translate3d(5%, 0, 0)' }]);
export const BANNER_KEYS_STILL = Object.freeze([{ opacity: BANNER_REST }, { opacity: 1, offset: 0.16 }, { opacity: 1, offset: 0.84 }, { opacity: BANNER_REST }]);
/** F4A — THE BOTTOM's GOLD BAND (the owner: in SOLO it read "faint grey by night, near-invisible by day" — it was seen in its 0.26 s fade in +
 *  out, with THE TRENCH's band a floor behind it): the gold band SNAPS in (0.09 s), stays longer and leaves fast — solo + a finish alike */
export const BANNER_GOLD_MS = 2200;
export const BANNER_GOLD_KEYS = Object.freeze([{ opacity: BANNER_REST, transform: 'translate3d(-2%, 0, 0)' }, { opacity: 1, transform: 'translate3d(0, 0, 0)', offset: 0.04 }, { opacity: 1, transform: 'translate3d(0, 0, 0)', offset: 0.93 }, { opacity: BANNER_REST, transform: 'translate3d(2%, 0, 0)' }]);
export const BANNER_GOLD_KEYS_STILL = Object.freeze([{ opacity: BANNER_REST }, { opacity: 1, offset: 0.04 }, { opacity: 1, offset: 0.93 }, { opacity: BANNER_REST }]);
/** the bands kept at once (the areas' six + a few laps) — the oldest goes first */
export const BANNER_KEEP = 10;
/** a reader is told of the arrival this long after the band is up (never in the arrival's own frame) */
export const BANNER_SAY_MS = 350;
const fontOf = cs => `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
const fontReady = f => { try { return !document.fonts || !document.fonts.check || document.fonts.check(f); } catch { return true; } };

// createBanner() → { el, prepare(name, sub, cls?), … banner.js#2
export function createBanner() {
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const live = h('span.ff-banner-live', { role: 'status', 'aria-live': 'polite' });
  const el = h('div.ff-banners', live);
  const bands = new Map();   // "name|sub" → { node, nameEl, subEl, cv, cls, name, sub }
  let anim = null, until = 0, bakes = 0, shows = 0, gone = false, shown = '', lastBake = 0, sayTimer = 0;
  const keyOf = (name, sub) => `${name}|${sub}`;
  // one line, drawn letter by letter at its own spacing (a … banner.js#3
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
  /** a band's own node: its words (for the bake's measure) + its canvas — in the list from now on */
  function build(name, sub, cls) {
    const nameEl = h('b.ff-banner-n', name), subEl = h('i.ff-banner-s', sub), cv = h('canvas.ff-banner-cv');
    const node = h(`div.ff-banner${cls ? `.${cls}` : ''}`, { 'aria-hidden': 'true' }, h('span.ff-banner-t', nameEl, subEl), h('span.ff-banner-c', cv));
    el.append(node);
    const b = { node, nameEl, subEl, cv, cls: cls || '', name, sub };
    bands.set(keyOf(name, sub), b);
    if (bands.size > BANNER_KEEP) { const first = bands.keys().next().value; if (first !== shown) { bands.get(first).node.remove(); bands.delete(first); } }
    return b;
  }
  // a band's two lines into its own canvas, from their OWN … banner.js#4
  function bake(b) {
    if (gone || !b.node.isConnected) return false;
    const box = b.node.getBoundingClientRect();
    if (!box.width || !box.height) return false;
    // (a long name on a narrow phone: the line is fitted to the band — "UNDER THE HARBOR" at 375 wide)
    b.nameEl.style.fontSize = '';
    b.node.classList.remove('is-baked');
    const fit = box.width * 0.92 / Math.max(1, b.nameEl.scrollWidth || b.nameEl.getBoundingClientRect().width);
    if (fit < 1) b.nameEl.style.fontSize = `${(parseFloat(getComputedStyle(b.nameEl).fontSize) * fit).toFixed(2)}px`;
    const nc = getComputedStyle(b.nameEl), sc = getComputedStyle(b.subEl), nb = b.nameEl.getBoundingClientRect(), sb = b.subEl.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 3), fN = fontOf(nc), fS = fontOf(sc);
    if (!fontReady(fN) || !fontReady(fS)) Promise.all([document.fonts.load(fN), document.fonts.load(fS)]).then(() => { if (!gone && performance.now() >= until) bake(b); }, () => {});
    b.cv.width = Math.ceil(box.width * dpr); b.cv.height = Math.ceil(box.height * dpr);
    const c = b.cv.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    // (each line about ITS OWN middle: on a sideways phone the two stand side by side on one line)
    line(c, b.name, nc, nb.left - box.left + nb.width / 2, nb.top - box.top + nb.height / 2, dpr);
    line(c, b.sub, sc, sb.left - box.left + sb.width / 2, sb.top - box.top + sb.height / 2, dpr);
    b.node.classList.add('is-baked');
    bakes++; lastBake = performance.now();
    return true;
  }
  return {
    el,
    // a band made ready AHEAD of its arrival (the stage: every … banner.js#5
    prepare(name, sub, cls) {
      if (bands.has(keyOf(name, sub)) || performance.now() < until) return;
      bake(build(name, sub, cls));
    },
    /** is this arrival's band built + baked? */
    ready: (name, sub) => bands.has(keyOf(name, sub)),
    /** the look (or the size) changed: every kept band is baked again in its new inks */
    dirty() { if (performance.now() >= until) for (const b of bands.values()) bake(b); },
    // the band crosses: ONE one-shot (opacity + transform) on its … banner.js#6
    show(name, sub, onDone, cls) {
      if (performance.now() < until) return false;
      let b = bands.get(keyOf(name, sub));
      if (!b) { b = build(name, sub, cls); bake(b); }   // (a `?floor=N` start can land past the ones made ready: built now, once)
      shown = keyOf(name, sub);
      const gold = b.cls === 'is-gold', ms = gold ? BANNER_GOLD_MS : BANNER_MS;
      until = performance.now() + ms; shows++;
      if (anim) anim.cancel();
      anim = b.node.animate ? b.node.animate(gold ? (reduce ? BANNER_GOLD_KEYS_STILL : BANNER_GOLD_KEYS) : reduce ? BANNER_KEYS_STILL : BANNER_KEYS, { duration: ms, easing: gold ? 'linear' : 'ease-out', fill: 'none' }) : null;
      if (anim && onDone) anim.onfinish = onDone; else if (onDone) setTimeout(onDone, ms);
      clearTimeout(sayTimer);
      sayTimer = setTimeout(() => { if (!gone) live.textContent = `${name} — ${sub}`; }, BANNER_SAY_MS);
      return true;
    },
    showing: () => performance.now() < until,
    /** the last time a band was baked (a frame right after may be a long one: the stage's hitch log names it) */
    lastBake: () => lastBake,
    /** the run starts over: nothing is up (the bands are KEPT) */
    clear() { until = 0; if (anim) { anim.cancel(); anim = null; } clearTimeout(sayTimer); },
    info: () => { const b = bands.get(shown); return { key: shown, opacity: b && performance.now() < until ? Number(getComputedStyle(b.node).opacity) : 0, baked: bands.size, keys: [...bands.keys()], at: b ? [...el.children].indexOf(b.node) - 1 : -1, bakes, shows, showing: performance.now() < until, gold: !!b && b.cls === 'is-gold', w: b ? b.cv.width : 0, h: b ? b.cv.height : 0 }; },
    destroy() { gone = true; if (anim) anim.cancel(); clearTimeout(sayTimer); bands.clear(); el.remove(); },
  };
}
