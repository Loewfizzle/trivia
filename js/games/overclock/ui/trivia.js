// OVERCLOCK — TRIVIA LIGHTNING: three multiple-choice questions. OC1 — THE OVERDRIVE LOOK (docs/overclock.md): the category chip, the
// question in BOLD WHITE, four "style C" answer tiles (slanted solid graphite glass ≥ 56 pt, BLUE letter badges; the tapped one turns hot
// ORANGE, the press sinks + flashes), then the feedback — right: the tile bursts + sparks stream into the score; wrong: it cracks + shakes,
// the right one lights ✓. Your pick is kept for THE ANSWER after the round (api.pick — this device only). Timings unchanged (450 / 900 ms).
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game(), fx(), pick(), sfx() — view.js.
import { h, pulseClass } from '../../../ui/dom.js';
import { CATEGORY_LABEL } from '../../../trivia/categories.js';
import { tubeMark } from '../../kit/answer.js';

const LETTERS = 'ABCD';
const catLabel = c => (c && (CATEGORY_LABEL[c] || String(c).replace(/_/g, ' ').toUpperCase().slice(0, 18))) || 'TRIVIA';

export default function uiTrivia(s, api) {
  const { chal } = api;
  const wrap = h('div.ch.ch-trivia.oc-trivia');
  let locked = false, timer = 0;
  const show = () => {
    if (chal.p >= s.questions.length) return;
    const q = s.questions[chal.p];
    const k = chal.p;
    const opts = q.a.map((a, i) => {
      const b = h('button.oc-tile.tl-opt', { type: 'button', dataset: { sfx: 'none', i: String(i) }, 'aria-label': `${LETTERS[i]}: ${a}` },
        h('span.oc-tile-face'), h('span.oc-tile-glow'),
        h('i.oc-badge', LETTERS[i]), h('span.oc-tile-t', a), h('i.oc-tile-mark', { 'aria-hidden': 'true' }));
      b.addEventListener('pointerdown', e => { e.preventDefault(); choose(i, q, opts, k); });
      b.addEventListener('click', e => { if (e.detail === 0) choose(i, q, opts, k); });
      return b;
    });
    wrap.replaceChildren(
      h('div.oc-qhead', h('span.oc-chip', catLabel(q.cat)), h('span.oc-qn', h('b', String(k + 1)), ` / ${s.questions.length}`)),
      h('p.oc-q.tl-q', q.q),
      h('div.oc-tiles.tl-opts', opts));
    pulseClass(wrap, 'q-in');
  };
  const choose = (i, q, opts, k) => {
    if (locked || chal.done || k !== chal.p) return;
    locked = true;
    const right = i === q.c;
    opts.forEach(o => o.classList.add('is-locked'));
    opts[i].classList.add('is-picked');
    opts[q.c].classList.add('is-right');
    opts[q.c].querySelector('.oc-tile-mark').replaceChildren(tubeMark('check', 'Right answer'));
    if (!right) { opts[i].classList.add('is-wrong'); opts[i].querySelector('.oc-tile-mark').replaceChildren(tubeMark('cross', 'Wrong')); }
    api.pick(k, i);
    api.fx(opts[i], right);
    api.part(right);
    timer = setTimeout(() => { locked = false; if (!chal.done) show(); }, right ? 450 : 900);
  };
  const KEY = { a: 0, b: 1, c: 2, d: 3, 1: 0, 2: 1, 3: 2, 4: 3 };
  api.key = e => { const i = KEY[e.key.toLowerCase()]; const q = s.questions[chal.p]; if (i != null && q) { const opts = [...wrap.querySelectorAll('.oc-tile')]; if (opts[i]) choose(i, q, opts, chal.p); } };
  show();
  return { el: wrap, destroy() { clearTimeout(timer); api.key = null; } };
}
