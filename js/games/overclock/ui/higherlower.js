// OVERCLOCK — HIGHER OR LOWER (strict: one wrong answer ends your run — the owner's rule, kept). OC3B — THE OVERDRIVE LOOK (docs/overclock.md
// "Challenge looks"): the STAT chip on top ("HEIGHT", "POPULATION" …), its own slanted 10-SEGMENT STREAK BAR (a segment lights orange per right
// answer), two STACKED GLASS CARDS — the known one shows its number, the other a "?" — with an orange VS slamming in between them, and HIGHER /
// LOWER as two big buttons in the thumb zone (years: LATER / EARLIER under them).
//   Right: the hidden number FLIPS in, the card + your button rest with the --good edge + ✓, the next segment lights; the next pair after
//   1250 ms. A miss: the card's real number SLAMS in, the card cracks red (+ ✕), the bar CRACKS at that segment — the run is over.
// THE SAME QUESTION AS EVER, asked as "is the hidden one higher or lower": the pair's winner (spec ans — 'max' or 'min' stats) never changes,
// and "HIGHER" is right exactly when the hidden value is the bigger one (hlFair: never equal) — the scoring, the answer check and the record
// the server reads (ok = the streak, p = streak + 1 on a miss) are unchanged. Timings unchanged (1250 ms to the next pair, 1200 / 1700 ms to
// the done screen). Your calls are kept for THE ANSWER (api.pick — this device only).
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game(), fx(), pick(), sfx() — view.js.
import { h, pulseClass } from '../../../ui/dom.js';
import { tubeMark } from '../../kit/answer.js';
import { fmtStat } from '../shared.js';

/** the right call for a pair: 'up' when the hidden (second) value is the bigger one */
export const hlRightDir = P => (P.b.v > P.a.v ? 'up' : 'down');
/** a value as its big number + small unit ('828' · 'm'); a written-out value ('c. 2560 BC') or a year stays whole */
export function statParts(P, x) {
  const t = fmtStat(P.unit, x.v, x.shown);
  if (x.shown || P.unit === 'year' || !P.unit) return [t, ''];
  const i = t.indexOf(' ');
  return i < 0 ? [t, ''] : [t.slice(0, i), t.slice(i + 1)];
}
/** the buttons' small words for a stat (a year: LATER / EARLIER — "higher" alone would make you think) */
export const dirSub = P => (P.unit === 'year' ? ['LATER', 'EARLIER'] : ['', '']);
export const DIR_WORD = { up: 'HIGHER', down: 'LOWER' };

/** the value element: the big number + its unit */
export const statEl = (P, x, cls = '') => { const [n, u] = statParts(P, x); return h(`span.oc-hl-num${cls}`, h('b', n), u ? h('small', u) : null); };

export default function uiHigherLower(s, api) {
  const { chal } = api;
  const N = s.pairs.length;
  const wrap = h('div.ch.oc-hl.oc-ownbar');
  let k = Math.floor(chal.ok);
  let locked = false, timer = 0;
  const segs = Array.from({ length: N }, () => h('i'));
  const crack = h('span.oc-hl-crack', { 'aria-hidden': 'true' });
  const streakN = h('b', String(k));
  const bar = h('div.oc-hl-barrow', h('div.oc-segbar.oc-hl-bar', { 'aria-hidden': 'true' }, segs, crack), h('span.oc-hl-streak', 'STREAK ', streakN));
  const chip = h('span.oc-chip');
  const qn = h('b', '1');
  const cards = h('div.oc-hl-cards');
  const paintBar = () => { segs.forEach((g, i) => g.classList.toggle('is-on', i < k)); streakN.textContent = String(k); };
  let cardB = null, btns = {};
  const card = (P, x, known) => h(`div.oc-hl-card.${known ? 'is-known' : 'is-unknown'}`,
    h('span.oc-hl-glass', { 'aria-hidden': 'true' }), h('span.oc-tile-ok'), h('span.oc-tile-bad'),
    h('span.oc-hl-name', x.name),
    h('span.oc-hl-val', known ? statEl(P, x) : [h('b.oc-hl-q', '?'), statEl(P, x, '.is-flip')]),
    known ? null : h('i.oc-tile-mark.oc-hl-sock', { 'aria-hidden': 'true' }));
  const button = (dir, word, sub) => {
    const b = h(`button.oc-tf-btn.oc-hl-btn.is-${dir}`, { type: 'button', dataset: { sfx: 'none', dir }, 'aria-label': word },
      h('span.oc-tile-face'), h('span.oc-tile-ok'), h('span.oc-tile-bad'), h('span.oc-tile-glow'),
      h('i.oc-hl-arrow', { 'aria-hidden': 'true' }), h('b.oc-hl-word', word), sub ? h('small.oc-hl-sub', sub) : null,
      h('i.oc-tile-mark.oc-tf-sock', { 'aria-hidden': 'true' }));
    b.addEventListener('pointerdown', e => { e.preventDefault(); choose(dir); });
    b.addEventListener('click', e => { if (e.detail === 0) choose(dir); });
    return b;
  };
  const btnRow = h('div.oc-hl-btns');
  const show = () => {
    if (chal.done || k >= N) return;
    const P = s.pairs[k];
    chip.textContent = P.stat;
    qn.textContent = String(k + 1);
    cardB = card(P, P.b, false);
    cards.replaceChildren(card(P, P.a, true), h('div.oc-hl-vs', { 'aria-hidden': 'true' }, h('span.oc-hl-vs-glow'), h('b', 'VS')), cardB);
    const [su, sd] = dirSub(P);
    btns = { up: button('up', 'HIGHER', su), down: button('down', 'LOWER', sd) };
    btnRow.replaceChildren(btns.up, btns.down);
    paintBar();
    pulseClass(cards, 'q-in');
  };
  const choose = dir => {
    if (locked || chal.done || k >= N) return;
    locked = true;
    const P = s.pairs[k];
    const right = dir === hlRightDir(P);
    const mine = btns[dir], other = btns[dir === 'up' ? 'down' : 'up'];
    mine.classList.add('is-picked');
    mine.classList.add('is-locked'); other.classList.add('is-locked');
    api.pick(k, dir);
    cardB.classList.add(right ? 'is-flipped' : 'is-slammed');
    if (right) {
      cardB.classList.add('is-right');
      mine.classList.add('is-right');
      mine.querySelector('.oc-tile-mark').replaceChildren(tubeMark('check', 'Right'));
      cardB.querySelector('.oc-tile-mark').replaceChildren(tubeMark('check', 'Right'));
      other.classList.add('is-dim');
      api.fx(mine, true);
      api.sfx('correct');
      k += 1;
      paintBar();
      pulseClass(segs[k - 1], 'is-pop', 500);
      api.step(k, k, 'ok', k >= N, 1200);
      if (k < N) timer = setTimeout(() => { locked = false; show(); }, 1250);
      return;
    }
    // THE MISS: the real number slams in, the card + your button crack, the bar cracks at this segment — the run ends (the owner's rule)
    cardB.classList.add('is-wrong');
    mine.classList.add('is-wrong');
    mine.querySelector('.oc-tile-mark').replaceChildren(tubeMark('cross', 'Wrong'));
    cardB.querySelector('.oc-tile-mark').replaceChildren(tubeMark('cross', 'Wrong'));
    crack.style.setProperty('--at', String(k));
    bar.classList.add('is-cracked');
    segs[k].classList.add('is-crack');
    api.fx(cardB, false);
    api.sfx('wrong');
    api.step(k, k + 1, 'miss', true, 1700);
  };
  api.key = e => {
    const key = String(e.key).toLowerCase();
    if (key === 'arrowup' || key === 'h' || key === '1') { e.preventDefault(); choose('up'); }
    else if (key === 'arrowdown' || key === 'l' || key === '2') { e.preventDefault(); choose('down'); }
  };
  wrap.append(
    h('div.oc-qhead', chip, h('span.oc-qn', qn, ` / ${N}`)),
    bar,
    h('div.oc-hl-play', cards),
    h('p.oc-hl-ask', 'IS THE ', h('b', '?'), ' HIGHER OR LOWER?'),
    btnRow);
  show();
  return { el: wrap, destroy() { clearTimeout(timer); api.key = null; } };
}
