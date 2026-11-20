// HIGH RISE — THE END SCREEN's BODY = JAYWALK'S STANDARD (S4B — the owner, Nov 19: "the end screen needs to look like JAYWALK's"; the
// mockup: Downloads\NEON\highrise-end-jaywalk-style-v2.png; docs/highrise.md "THE END"). It replaces S4A FIX's "A · THE HERO NUMBER".
// ONE builder for the test page's own card (stage.js) AND the cartridge's body inside the console's podium frame (final.js) — top to
// bottom, JAYWALK's layout, type, sizes + spacing (js/games/jaywalk/victory.js#buildEnd · css .jw-fin*):
//   the HEADER "HIGH RISE · SOLO" (· MATCH in a match) — HIGH in the sign's hot pink, RISE in its cyan, the mode in a soft lavender
//     (endHeader: the cartridge hands it to the console's frame as its kicker; the page's card wears it itself)
//   the CAUSE — big neon words, up to two lines, SATURATED HOT PINK (the colour IS the letter: a hair-thin bright core + its glow);
//     MADE IT TO THE MOTHERSHIP = GOLD
//   THE FLOOR NUMBER, huge — the one WHITE hero, a cyan glow — and FLOORS under it
//   YOUR BEST · 119 in gold (NEW BEST · WAS 119 when this run beat it) + ONE small line: 66 PERFECTS · BEST STREAK 14
// YOUR TABLE (final.js) follows right under the personal numbers; THE FOOT is the caller's (the console's universal footer · the page's
// PLAY AGAIN bar). No stats strip, no dashed tower line, no pills. A VIEW's helper: DOM only — no rules, no storage, no fetch.
import { h } from '../../ui/dom.js';

const whole = n => Math.max(0, Math.floor(Number(n) || 0));
const say = n => whole(n).toLocaleString('en-US');

/** the header's words in their own neon: HIGH (hot pink) · RISE (cyan) · the mode (lavender) — one node, the frame's kicker or the card's top line */
export function endHeader(mode = 'solo') {
  const m = mode === 'match' ? 'MATCH' : 'SOLO';
  return h('span.hi-hd', { role: 'heading', 'aria-level': '1', 'aria-label': `High Rise, ${m.toLowerCase()}` }, h('b.hi-hd-a', { 'aria-hidden': 'true' }, 'HIGH'), ' ', h('b.hi-hd-b', { 'aria-hidden': 'true' }, 'RISE'), h('i.hi-hd-m', { 'aria-hidden': 'true' }, ` · ${m}`));
}
/** "66 PERFECTS · BEST STREAK 14" (1 PERFECT) */
export const statsLine = (perfects, streak) => `${say(perfects)} PERFECT${whole(perfects) === 1 ? '' : 'S'} · BEST STREAK ${say(streak)}`;

/**
 * endCard({ header }) → { el, set({ words, made, floor, perfects, streak }), best(value, isNew, was) }
 *   header: 'solo' | 'match' = the card wears the header itself (the test page); none = the console's frame shows it (the cartridge)
 *   set: the run's own numbers (the judge's / the engine's) · best: YOUR BEST's line — 0 = no best yet (no line);
 *   isNew = this run beat it (NEW BEST — `was` > 0: NEW BEST · WAS n)
 */
export function endCard({ header = '' } = {}) {
  const cause = h('div.hi-ec-cause'), n = h('div.hi-ec-n'), fl = h('div.hi-ec-fl', 'FLOORS'), bestL = h('div.hi-ec-best'), line = h('div.hi-ec-line');
  const hd = header ? h('div.hi-ec-hd', endHeader(header)) : null;
  const el = h('div.hi-ec', hd, cause, n, fl, bestL, line);
  return {
    el,
    /** the card's own header says SOLO or MATCH (a cartridge's stage plays both) */
    header(mode) { if (hd) hd.replaceChildren(endHeader(mode)); },
    set({ words, made, floor, perfects, streak }) {
      const f = whole(floor);
      el.classList.toggle('is-made', !!made);
      cause.textContent = words || '';
      // (each digit its own box — a little room between two: a 1 never runs into its neighbour)
      n.replaceChildren(...[...String(f)].map(d => h('span.hi-dg', { 'aria-hidden': 'true' }, d)));
      n.setAttribute('aria-label', String(f)); n.dataset.dg = String(String(f).length);
      fl.textContent = f === 1 ? 'FLOOR' : 'FLOORS';
      line.textContent = statsLine(perfects, streak);
    },
    best(value, isNew, was = 0) {
      const v = whole(value), nb = !!isNew && v > 0;
      bestL.textContent = !v ? '' : nb ? (whole(was) > 0 ? `NEW BEST · WAS ${say(was)}` : 'NEW BEST') : `YOUR BEST · ${say(v)}`;
      bestL.classList.toggle('is-new', nb);
      el.classList.toggle('is-new', nb);
    },
  };
}
