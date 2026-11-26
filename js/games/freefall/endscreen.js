// FREEFALL — THE END SCREEN's BODY = JAYWALK'S STANDARD (F2 — docs/freefall.md "THE END SCREEN"; HIGH RISE's endscreen.js is the
// pattern). ONE builder for the test page's own card today and the cartridge's body inside the console's podium frame in F4 — top to
// bottom, JAYWALK's layout, type, sizes + spacing:
//   the HEADER "FREEFALL · SOLO" (· MATCH in a match) — FREE in ultraviolet, FALL in lime, the mode in a soft lavender (THE END NEON's
//     class names — ui/fin-neon.js; FREEFALL has no row in metas.js yet (nothing is registered): the card writes the colours itself)
//   the CAUSE — big neon words, up to two lines, in FREEFALL's ultraviolet (the colour IS the letter); MADE IT TO THE BOTTOM = GOLD.
//     NEVER RED: red is danger on the tower and nothing else, anywhere.
//   THE FLOOR NUMBER, huge — the one WHITE hero, an ultraviolet glow — and FLOORS under it
//   YOUR BEST · 88 in gold (NEW BEST · WAS 88 when this run beat it) + ONE small line: 12 BOUNCES · 3 BLAZES · BEST RUN 9
// THE TABLE's slot follows (YOUR TABLE — F4); THE FOOT is the caller's (the console's universal footer · the page's PLAY AGAIN bar).
// No stats strip, no pills. A VIEW's helper: DOM only — no rules, no storage, no fetch.
import { h } from '../../ui/dom.js';

/** FREEFALL's neon: ULTRAVIOLET + LIME (+ mint as a touch) — no other game uses them (docs/games/plan.md "FREEFALL — F2") */
export const NEON = Object.freeze({ uv: '#9b5cff', uv2: '#c35bff', uv3: '#6a6bff', lime: '#b8ff3b', mint: '#5dffc0', mode: '#c9b6ff', gold: '#ffc83c' });
const whole = n => Math.max(0, Math.floor(Number(n) || 0));
const say = n => whole(n).toLocaleString('en-US');
const many = (n, one) => `${say(n)} ${one}${whole(n) === 1 ? '' : 'S'}`;

/** the header's words in their own neon: FREE (ultraviolet) FALL (lime) · the mode (lavender) — one node (fin-neon's shape) */
export function endHeader(mode = 'solo') {
  const m = mode === 'match' ? 'MATCH' : mode === 'daily' ? 'DAILY' : 'SOLO';
  const w = (cls, text, c, g) => { const b = h(cls, { 'aria-hidden': 'true' }, text); b.style.setProperty('--fn', c); b.style.setProperty('--fn-g', g); return b; };
  return h('span.fn-hd', { role: 'heading', 'aria-level': '1', 'aria-label': `Freefall, ${m.toLowerCase()}` },
    w('b.fn-w.fn-w1', 'FREE', NEON.uv2, NEON.uv), w('b.fn-w.fn-w2', 'FALL', NEON.lime, NEON.lime), w('i.fn-m', ` · ${m}`, NEON.mode, NEON.uv3));
}
/** "12 BOUNCES · 3 BLAZES · BEST RUN 9" (1 BOUNCE · 1 BLAZE) */
export const statsLine = (bounces, blazes, bestRun) => `${many(bounces, 'BOUNCE')} · ${many(blazes, 'BLAZE')} · BEST RUN ${say(bestRun)}`;

/**
 * endCard({ header }) → { el, header(mode), set({ words, made, floor, bounces, blazes, bestRun }), best(value, isNew, was) }
 *   header: 'solo' | 'match' = the card wears the header itself (the test page); none = the console's frame shows it (the cartridge)
 *   best: YOUR BEST's line — 0 = no best yet (no line); isNew = this run beat it (NEW BEST — `was` > 0: NEW BEST · WAS n)
 */
export function endCard({ header = '' } = {}) {
  const cause = h('div.ff-ec-cause.fn-line'), n = h('div.ff-ec-n'), fl = h('div.ff-ec-fl', 'FLOORS'), bestL = h('div.ff-ec-best'), line = h('div.ff-ec-line'), table = h('div.ff-ec-table', { 'aria-hidden': 'true' });
  cause.style.setProperty('--fn', NEON.uv2); cause.style.setProperty('--fn-g', NEON.uv);
  const hd = header ? h('div.ff-ec-hd', endHeader(header)) : null;
  const el = h('div.ff-ec', hd, cause, n, fl, bestL, line, table);
  return {
    el, table,
    header(mode) { if (hd) hd.replaceChildren(endHeader(mode)); },
    set({ words, made, floor, bounces, blazes, bestRun }) {
      const f = whole(floor);
      el.classList.toggle('is-made', !!made); cause.classList.toggle('is-gold', !!made);   // (MADE IT TO THE BOTTOM = the gold line)
      cause.textContent = words || '';
      // (each digit its own box — a little room between two: a 1 never runs into its neighbour)
      n.replaceChildren(...[...String(f)].map(d => h('span.ff-dg', { 'aria-hidden': 'true' }, d)));
      n.setAttribute('aria-label', String(f)); n.dataset.dg = String(String(f).length);
      fl.textContent = f === 1 ? 'FLOOR' : 'FLOORS';
      line.textContent = statsLine(bounces, blazes, bestRun);
    },
    best(value, isNew, was = 0) {
      const v = whole(value), nb = !!isNew && v > 0;
      bestL.textContent = !v ? '' : nb ? (whole(was) > 0 ? `NEW BEST · WAS ${say(was)}` : 'NEW BEST') : `YOUR BEST · ${say(v)}`;
      bestL.classList.toggle('is-new', nb);
      el.classList.toggle('is-new', nb);
    },
  };
}
