// FREEFALL — THE END SCREEN's BODY = JAYWALK'S STANDARD (F2; F4B — THE LOGO HEADER: docs/freefall.md "THE END SCREEN"; HIGH RISE's
// endscreen.js is the pattern). ONE builder for the test page's own card and the cartridge's body inside the console's podium frame — top
// to bottom (the owner's approved mock, Nov 26):
//   THE HEADER = THE LOGO — title-05's lettering (the opening's own WebP, its alpha) centred, ~58 % of the card's width (≈ 226 pt at 390 —
//     never under 210: the script must read) + the mode under it in small teal caps (SOLO · MATCH; DAILY later). In the cartridge the logo
//     sits in the console frame's own header slot (view.js puts `endLogo` there); the test page's card wears it itself.
//   the CAUSE — big neon words, up to two lines, in FREEFALL's TEAL (the colour IS the letter); YOU HIT THE BOTTOM = GOLD.
//     NEVER RED: red is danger on the tower and nothing else, anywhere.
//   THE FLOOR NUMBER, huge — the one WHITE hero, a hot-pink glow — and FLOORS under it
//   YOUR BEST · 88 · AVG 62 in gold (a NEW BEST: NEW BEST · WAS 88 — the AVG then on its own quiet line) + ONE small line:
//     12 BOUNCES · 3 BLAZES · BEST RUN 9
// THE TABLE's slot follows (YOUR TABLE — final.js); THE FOOT is the caller's (the console's universal footer · the page's own copy of it:
// PLAY AGAIN · SHARE | HOME). No stats strip, no pills. A VIEW's helper: DOM only — no rules, no storage, no fetch.
import { h } from '../../ui/dom.js';

/** FREEFALL's ACCENT = title-05's colours (F3 — the owner, Nov 26: docs/games/plan.md "FREEFALL — F3"; replaces F2's ultraviolet + lime): HOT PINK + ELECTRIC TEAL */
export const NEON = Object.freeze({ pink: '#ff4fa8', teal: '#27e0e6', mode: '#cfeff5', gold: '#ffc83c' });
/** the lettering's cache key (= night.js#FF_ART_REV — pinned equal by tests/freefall-play.test.mjs: this file imports no scene) */
export const LOGO_REV = 1;
const whole = n => Math.max(0, Math.floor(Number(n) || 0));
const say = n => whole(n).toLocaleString('en-US');
const many = (n, one) => `${say(n)} ${one}${whole(n) === 1 ? '' : 'S'}`;
const art = w => new URL(`../../../assets/freefall/title/lettering-${w}.webp?v=${LOGO_REV}`, import.meta.url).href;

/** the mode's words under the logo: SOLO · MATCH · DAILY */
export const modeWords = (mode = 'solo') => (mode === 'match' ? 'MATCH' : mode === 'daily' ? 'DAILY' : 'SOLO');
/** THE LOGO HEADER: the lettering (a 390-wide phone at 3× takes the 780 — it is drawn ≈ 226 pt wide) + the mode in small teal caps — one node, a heading */
export function endLogo(mode = 'solo') {
  const m = modeWords(mode);
  return h('div.ff-ec-logo', { role: 'heading', 'aria-level': '1', 'aria-label': `Freefall, ${m.toLowerCase()}` },
    h('img.ff-ec-logo-img', { alt: '', decoding: 'async', draggable: 'false', width: '780', height: '379', sizes: '250px', srcset: `${art(780)} 780w, ${art(1170)} 1170w`, src: art(780) }),
    h('div.ff-ec-mode', { 'aria-hidden': 'true' }, m));
}
/** "12 BOUNCES · 3 BLAZES · BEST RUN 9" (1 BOUNCE · 1 BLAZE) — F5B: "0 BLAZES" never shows (no blaze lit = the part is left out) */
export const statsLine = (bounces, blazes, bestRun) => [many(bounces, 'BOUNCE'), whole(blazes) > 0 ? many(blazes, 'BLAZE') : '', `BEST RUN ${say(bestRun)}`].filter(Boolean).join(' · ');
/** THE AVERAGE's words beside YOUR BEST (JAYWALK's JT2 — core/board-avg.js): a number = "AVG 62" · null = fewer than 5 counted runs: "AVG —" · undefined = not known here (the test page; counting OFF): nothing */
export const avgWords = avg => (avg === undefined ? '' : avg == null || !Number.isFinite(Number(avg)) ? 'AVG —' : `AVG ${say(avg)}`);

/**
 * endCard({ header }) → { el, table, header(mode), set({ words, made, floor, bounces, blazes, bestRun }), best(value, isNew, was, avg) }
 *   header: 'solo' | 'match' = the card wears THE LOGO itself (the test page); none = the console's frame shows it (the cartridge)
 *   best: YOUR BEST's line — 0 = no best yet (no line); isNew = this run beat it (NEW BEST — `was` > 0: NEW BEST · WAS n); `avg` =
 *   THE AVERAGE (avgWords): beside YOUR BEST · n — under a NEW BEST on its own quiet line
 */
export function endCard({ header = '' } = {}) {
  const cause = h('div.ff-ec-cause.fn-line'), n = h('div.ff-ec-n'), fl = h('div.ff-ec-fl', 'FLOORS'), bestL = h('div.ff-ec-best'), avgL = h('div.ff-ec-avg'), line = h('div.ff-ec-line'), table = h('div.ff-ec-table');
  cause.style.setProperty('--fn', NEON.teal); cause.style.setProperty('--fn-g', NEON.teal);
  const hd = header ? h('div.ff-ec-hd', endLogo(header)) : null;
  const el = h('div.ff-ec', hd, cause, n, fl, bestL, avgL, line, table);
  return {
    el, table,
    header(mode) { if (hd) hd.replaceChildren(endLogo(mode)); },
    set({ words, made, floor, bounces, blazes, bestRun }) {
      const f = whole(floor);
      el.classList.toggle('is-made', !!made); cause.classList.toggle('is-gold', !!made);   // (YOU HIT THE BOTTOM = the gold line)
      cause.textContent = words || '';
      // (each digit its own box — a little room between two: a 1 never runs into its neighbour)
      n.replaceChildren(...[...String(f)].map(d => h('span.ff-dg', { 'aria-hidden': 'true' }, d)));
      n.setAttribute('aria-label', String(f)); n.dataset.dg = String(String(f).length);
      fl.textContent = f === 1 ? 'FLOOR' : 'FLOORS';
      line.textContent = statsLine(bounces, blazes, bestRun);
    },
    best(value, isNew, was = 0, avg = undefined) {
      const v = whole(value), nb = !!isNew && v > 0, av = v ? avgWords(avg) : '';
      const text = !v ? '' : nb ? (whole(was) > 0 ? `NEW BEST · WAS ${say(was)}` : 'NEW BEST') : `YOUR BEST · ${say(v)}`;
      bestL.textContent = av && !nb ? `${text} · ${av}` : text;
      avgL.textContent = av && nb ? av : '';
      bestL.classList.toggle('is-new', nb);
      el.classList.toggle('is-new', nb);
    },
  };
}
