// FREEFALL — THE END SCREEN's BODY = JAYWALK'S STANDARD (F2; … endscreen.js#1
import { h } from '../../ui/dom.js';

// FREEFALL's ACCENT = title-05's colours (F3 — the owner, Nov … endscreen.js#2
export const NEON = Object.freeze({ pink: '#ff4fa8', teal: '#27e0e6', mode: '#cfeff5', gold: '#ffc83c' });
// the lettering's cache key (= night.js#FF_ART_REV — pinned … endscreen.js#3
export const LOGO_REV = 1;
const whole = n => Math.max(0, Math.floor(Number(n) || 0));
const say = n => whole(n).toLocaleString('en-US');
const many = (n, one) => `${say(n)} ${one}${whole(n) === 1 ? '' : 'S'}`;
const art = w => new URL(`../../../assets/freefall/title/lettering-${w}.webp?v=${LOGO_REV}`, import.meta.url).href;

/** the mode's words under the logo: SOLO · MATCH · DAILY */
export const modeWords = (mode = 'solo') => (mode === 'match' ? 'MATCH' : mode === 'daily' ? 'DAILY' : 'SOLO');
const LOGO_ATTRS = { width: '780', height: '379', sizes: '250px', srcset: `${art(780)} 780w, ${art(1170)} 1170w`, src: art(780) };
let warmImg = null;
/** F5C — THE LOGO ALWAYS SHOWS: the lettering is fetched + DECODED during play (the same srcset + sizes as the end screen's, so the
 *  browser picks the same file) — the end screen's image then paints in its first frame; before F5C it was asked for at the end screen
 *  and decoded async: a slow fetch (or a shot) caught its empty box. Once a page; a failure is quiet (the end screen asks again). */
export function warmLogo() {
  if (warmImg || typeof Image !== 'function') return;
  try { warmImg = new Image(); warmImg.sizes = LOGO_ATTRS.sizes; warmImg.srcset = LOGO_ATTRS.srcset; warmImg.src = LOGO_ATTRS.src; if (warmImg.decode) warmImg.decode().catch(() => {}); } catch { /* polish */ }
}
// THE LOGO HEADER: the lettering (a 390-wide phone at 3× … endscreen.js#4
export function endLogo(mode = 'solo') {
  const m = modeWords(mode);
  return h('div.ff-ec-logo', { role: 'heading', 'aria-level': '1', 'aria-label': `Freefall, ${m.toLowerCase()}` },
    h('img.ff-ec-logo-img', { alt: '', decoding: 'sync', fetchpriority: 'high', draggable: 'false', ...LOGO_ATTRS }),
    h('div.ff-ec-mode', { 'aria-hidden': 'true' }, m));
}
// "12 BOUNCES · 3 BLAZES · BEST RUN 9" (1 BOUNCE · 1 BLAZE) — … endscreen.js#5
export const statsLine = (bounces, blazes, bestRun) => [many(bounces, 'BOUNCE'), whole(blazes) > 0 ? many(blazes, 'BLAZE') : '', `BEST RUN ${say(bestRun)}`].filter(Boolean).join(' · ');
/** THE AVERAGE's words beside YOUR BEST (JAYWALK's JT2 — core/board-avg.js): a number = "AVG 62" · anything else = fewer than 5 counted
 *  runs (or none known here — the test page, counting OFF): "AVG —" (F5C — the owner: the AVG always shows, a dash under 5 runs) */
export const avgWords = avg => (avg == null || avg === '' || !Number.isFinite(Number(avg)) ? 'AVG —' : `AVG ${say(avg)}`);
/** F5C — YOUR BEST's line (the owner, Nov 27): "YOUR BEST 141 · AVG 62" · a NEW BEST = its own celebrated line "NEW BEST · 141" (the AVG
 *  under it — `avgWords`) · no best yet = '' */
export const bestWords = (best, isNew) => { const v = whole(best); return !v ? '' : isNew ? `NEW BEST · ${say(v)}` : `YOUR BEST ${say(v)}`; };

/**
 * endCard({ header }) → { el, table, header(mode), set({ words, made, floor, bounces, blazes, bestRun }), best(value, isNew, was, avg) }
 *   header: 'solo' | 'match' = the card wears THE LOGO itself (the test page); none = the console's frame shows it (the cartridge)
 *   best: YOUR BEST's line — 0 = no best yet (no line); isNew = this run beat it (F5C: "NEW BEST · n", celebrated, the AVG on its own
 *   line under it); `avg` = THE AVERAGE (avgWords — a dash when it isn't known): "YOUR BEST n · AVG n"
 */
export function endCard({ header = '', stats = true } = {}) {   // (F5B: `stats: false` = the cartridge's FINAL SHAPE — no stats line, no table slot)
  const cause = h('div.ff-ec-cause.fn-line'), n = h('div.ff-ec-n'), fl = h('div.ff-ec-fl', 'FLOORS'), bestL = h('div.ff-ec-best'), avgL = h('div.ff-ec-avg'), line = h('div.ff-ec-line'), table = h('div.ff-ec-table');
  cause.style.setProperty('--fn', NEON.teal); cause.style.setProperty('--fn-g', NEON.teal);
  const hd = header ? h('div.ff-ec-hd', endLogo(header)) : null;
  const el = h('div.ff-ec', hd, cause, n, fl, bestL, avgL, stats ? line : null, stats ? table : null);
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
      if (stats) line.textContent = statsLine(bounces, blazes, bestRun);
    },
    best(value, isNew, was = 0, avg = null) {   // (`was` kept for the callers — F5C's NEW BEST line names the new number)
      const v = whole(value), nb = !!isNew && v > 0, av = v ? avgWords(avg) : '', text = bestWords(v, nb);
      bestL.textContent = av && !nb ? `${text} · ${av}` : text;
      avgL.textContent = av && nb ? av : '';
      bestL.classList.toggle('is-new', nb);
      el.classList.toggle('is-new', nb);
    },
  };
}
