// FREEFALL — THE ARRIVAL BANNERS (F3 — docs/freefall.md "THE … banner.js#1
// FIX D: the band is drawn IN THE 3D PICTURE (hudgl.js — its ground, its name, FLOOR n); this node is its hidden source (the stylesheet's look)
import { h } from '../../ui/dom.js';
import { framesOf, EASE_OUT } from './hudgl.js';

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
// createBanner(H) → { el, src, prepare, ready, dirty, show(name, sub, onDone, cls), showing, say, clear, info, destroy } — H = the GL HUD
export function createBanner(H) {
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const live = h('span.ff-banner-live', { role: 'status', 'aria-live': 'polite' });
  const n = h('b.ff-banner-n'), s = h('i.ff-banner-s'), t = h('span.ff-banner-t', n, s), node = h('div.ff-banner', { 'aria-hidden': 'true' }, t);
  const el = h('div.ff-banners', live, node);
  const F = [framesOf(BANNER_KEYS), framesOf(BANNER_KEYS_STILL), framesOf(BANNER_GOLD_KEYS), framesOf(BANNER_GOLD_KEYS_STILL)];
  let until = 0, shows = 0, gone = false, shown = '', gold = false, sayTimer = 0, doneT = 0;
  return {
    el, src: { node, t, n, s },
    /** (every band is baked with its look — nothing to make ready) */
    prepare() {}, ready: () => true, dirty() {},
    // the band crosses: its frames on the GL HUD's clock (opacity + a slide; a reduced-motion phone: it only fades)
    show(name, sub, onDone, cls) {
      if (performance.now() < until) return false;
      gold = cls === 'is-gold';
      const ms = gold ? BANNER_GOLD_MS : BANNER_MS;
      shown = `${name}|${sub}`; until = performance.now() + ms; shows++;
      H.band(name, sub, gold, ms, F[(gold ? 2 : 0) + (reduce ? 1 : 0)], gold ? null : EASE_OUT);
      clearTimeout(doneT); if (onDone) doneT = setTimeout(onDone, ms);
      clearTimeout(sayTimer);
      sayTimer = setTimeout(() => { if (!gone) live.textContent = `${name} — ${sub}`; }, BANNER_SAY_MS);
      return true;
    },
    showing: () => performance.now() < until,
    /** FIX D — THE ONE SCREEN-READER LINE (the floor count every 10 floors + the arrivals): never more than once a floor */
    say(text) { if (!gone && live.textContent !== text) live.textContent = text; },
    lastBake: () => -1e9,
    /** the run starts over: nothing is up */
    clear() { until = 0; H.unband(); clearTimeout(sayTimer); clearTimeout(doneT); },
    info: () => ({ key: shown, showing: performance.now() < until, gold: gold && performance.now() < until, shows, live: live.textContent }),
    destroy() { gone = true; clearTimeout(sayTimer); clearTimeout(doneT); el.remove(); },
  };
}
