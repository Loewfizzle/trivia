// JAYWALK — THE ARRIVAL BANNER (BEFORE THE FLIP — the owner, Nov 17: "when I cross it, it plays the noise, but nothing tells me where I am";
// The long notes: docs/games/jaywalk-notes.md
import { h } from '../../ui/dom.js';
import { area } from './course.js';   // (the area table — PURE; the colours come in from the caller: areas.js#LOOKS needs three.js)

/** how long the banner is on the screen (ms) — its entrance + its fade inside (css/jaywalk.css .jw-arrive: the same 2.5 s) */
export const ARRIVE_MS = 2500;

const hex = n => `#${(n >>> 0).toString(16).padStart(6, '0').slice(-6)}`;
/** a colour darkened (k < 1): the day board's paint under white letters (≥ 4.5 : 1 on every area's paint) */
export const shade = (n, k) => (Math.round(((n >> 16) & 255) * k) << 16) | (Math.round(((n >> 8) & 255) * k) << 8) | Math.round((n & 255) * k);

/** the banner's words for a gate lane (null = not a gate of an area): the area's name + LANE n (a lap: LAP 2 · LANE 450) */
export function arrivalWords(lane) {
  const a = area(lane);
  if (!a || a.index < 0 || !a.name) return null;
  return { name: a.name, sub: a.loop ? `LAP ${a.loop + 1} · LANE ${lane}` : `LANE ${lane}`, index: a.index };
}

/** the banner on `parent` (the game's / the lab's stage), the areas' colours = areas.js#LOOKS ({ accent, paint } an area) →
 *  { show(lane, look) → shown?, hide(), on(), text(), destroy() } */
export function createArrival(parent, LOOKS) {
  const nameEl = h('b.jw-arrive-n'), subEl = h('span.jw-arrive-s');
  const el = h('div.jw-arrive', { role: 'status', 'aria-live': 'polite' }, h('div.jw-arrive-board', nameEl, subEl));
  parent.append(el);
  let t = 0, on = false;
  const hide = () => { clearTimeout(t); if (!on) return; on = false; el.classList.remove('is-on'); };
  return {
    el,
    show(lane, look) {
      const w = arrivalWords(lane);
      if (!w) return false;
      const L = LOOKS[w.index] || LOOKS[0];
      nameEl.textContent = w.name; subEl.textContent = w.sub;
      el.dataset.look = look === 'day' ? 'day' : 'night';
      el.style.setProperty('--c', hex(L.accent)); el.style.setProperty('--p', hex(shade(L.paint, 0.72)));
      el.classList.remove('is-on'); void el.offsetWidth; el.classList.add('is-on');   // (the entrance again from its start — once a crossing, never in a frame)
      on = true; clearTimeout(t); t = setTimeout(hide, ARRIVE_MS);
      return true;
    },
    hide,
    on: () => on,
    text: () => (on ? `${nameEl.textContent} · ${subEl.textContent}` : ''),
    destroy() { clearTimeout(t); el.remove(); },
  };
}
