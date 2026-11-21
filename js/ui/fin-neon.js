// THE END NEON (CITY PART 2 — the owner, Nov 19 6:55 pm item 2; docs/match-kit.md "THE END NEON"): ONE builder for the coloured neon on EVERY
// game's end screen — HIGH RISE's look (S4B), now every game's:
//   the HEADER "<GAME> · SOLO / · MATCH" — the game's NAME in its own sign's colours, the mode softer (finHeader — the console's frame kicker
//     through createFinal's `mode`, or a page's own card);
//   the RESULT line — saturated neon in the game's accent, the colour IS the letter (a hair-thin bright core + its glow); a win / finish line
//     GOLD (finLine — a body's cause line; the console frame's own WINNER title through `.final.has-neon`).
// The colours = the game's ONE row (js/games/metas.js NEON) — never a per-screen copy; `day` = paint inks for an end that stands on a light
// ground (PRISM DROP's paper), read LIVE from body[data-look] (THE GAME LOOK). The words carry the meaning, never the colour alone (COLOUR-BLIND).
// DOM only: no store, no fetch (HIGH RISE's /highrise-play page builds its card with it too).
import { h } from './dom.js';
import { META } from '../games/metas.js';

const HEX = /^#[0-9a-f]{6}$/i;
/** the game's NEON row | null */
export const neonOf = id => (id && META[id] && META[id].NEON) || null;
const put = (el, v) => { for (const k in v) if (HEX.test(String(v[k] || ''))) el.style.setProperty(k, v[k]); return el; };

/** the header node: the name's words in their colours + " · MODE" softer — the frame's kicker or a card's top line (role heading) */
export function finHeader(id, mode = 'SOLO') {
  const N = neonOf(id), m = String(mode || '').toUpperCase(), D = (N && N.day) || null;
  const words = N ? N.name : [[String((META[id] && META[id].BANNER_NAME) || id || '').toUpperCase(), '', '']];
  const label = words.map(w => w[0]).join(' ');
  const kids = [];
  words.forEach(([w, c, g], i) => { if (i) kids.push(' '); kids.push(put(h(`b.fn-w.fn-w${i + 1}`, { 'aria-hidden': 'true' }, w), { '--fn': c, '--fn-g': g || c, '--fn-day': D && D.name ? D.name[Math.min(i, D.name.length - 1)] : '' })); });
  if (m) kids.push(put(h('i.fn-m', { 'aria-hidden': 'true' }, ` · ${m}`), { '--fn': N && N.mode[0], '--fn-g': N && N.mode[1], '--fn-day': D && D.mode }));
  return h('span.fn-hd', { role: 'heading', 'aria-level': '1', 'aria-label': `${label.charAt(0)}${label.slice(1).toLowerCase()}${m ? `, ${m.toLowerCase()}` : ''}`, class: D ? 'has-day' : null }, ...kids);
}

/** the RESULT line: an element takes the game's accent neon (gold = a win / finish line) — returns the element */
export function finLine(el, id, gold = false) {
  const N = neonOf(id), D = (N && N.day) || null;
  if (!el) return el;
  el.classList.add('fn-line');
  el.classList.toggle('is-gold', !!gold);
  if (D) el.classList.add('has-day');
  return N ? put(el, { '--fn': N.line[0], '--fn-g': N.line[1], '--fn-day': D && D.line, '--fn-gold-day': D && D.gold }) : el;
}

/** the console frame (ui/final.js): its WINNER title + the winner's line take the row's colours (`.final.has-neon` in css/components.css) */
export function finFrame(el, id) {
  const N = neonOf(id), D = (N && N.day) || null;
  if (!N || !el) return false;
  el.classList.add('has-neon');
  if (D) el.classList.add('has-day');
  put(el, { '--fn': N.line[0], '--fn-g': N.line[1], '--fn-day': D && D.line, '--fn-gold-day': D && D.gold });
  return true;
}

/** the header never runs under a corner button: its line shrinks to the box when too wide (375 × 667: "PRISM DROP · MATCH") — measured by a
 *  ResizeObserver + once the fonts are in, never in a frame loop; returns its stop */
export function fitHeader(box) {
  const span = box && box.firstElementChild;
  if (!span || typeof ResizeObserver !== 'function') return () => {};
  const fit = () => {
    if (!box.isConnected) return;
    span.style.fontSize = '';
    const cs = getComputedStyle(box), avail = box.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0), w = span.getBoundingClientRect().width;
    if (avail > 0 && w > avail) span.style.fontSize = `${Math.max(11, Math.floor((parseFloat(getComputedStyle(span).fontSize) * avail / w) * 10) / 10)}px`;
  };
  const ro = new ResizeObserver(fit); ro.observe(box);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit, () => {});
  return () => ro.disconnect();
}
