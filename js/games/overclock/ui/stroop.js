// OVERCLOCK — COLOR CLASH: tap the color the word is shown in. OC4 — THE OVERDRIVE LOOK (docs/overclock.md "Challenge looks"):
//   ONE HUGE COLOUR WORD (Barlow 900 italic) drawn in a DIFFERENT colour; the line "TAP THE COLOR OF THE TEXT" (never "ink"); four big SOLID
//   colour tiles (style-C slant, full-saturation red / blue / green / yellow — as far apart in hue as four can be; NO colour names on them:
//   that would give the answer away — the screen reader hears the name). Right: the tile bursts + sparks, ✓ in its socket; wrong: the
//   REAL-GLASS CRACK on it + ✕, and the right one shows ✓ (never colour alone). Timings unchanged (220 / 650 ms to the next word).
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game(), fx(), pick(), sfx() — view.js.
import { h, pulseClass } from '../../../ui/dom.js';
import { STROOP_COLORS } from '../challenges.js';
import { tubeMark } from '../../kit/answer.js';

export default function uiStroop(s, api) {
  const { chal } = api;
  const N = s.items.length;
  const wrap = h('div.ch.oc-cc.oc-ownbar');
  const segs = Array.from({ length: N }, () => h('i'));
  const bar = h('div.oc-segbar.oc-cc-bar', { 'aria-hidden': 'true' }, segs);
  const qn = h('b', '1');
  const stage = h('div.oc-cc-stage');
  const tiles = h('div.oc-cc-tiles');
  let locked = false, timer = 0;
  let btns = [];
  const paintBar = () => segs.forEach((g, i) => { g.className = i < chal.p ? 'is-on' : i === chal.p ? 'is-cur' : ''; });
  const show = () => {
    if (chal.p >= N) return;
    const it = s.items[chal.p];
    const k = chal.p;
    qn.textContent = String(k + 1);
    const word = STROOP_COLORS[it.word].name;
    stage.replaceChildren(h('div.oc-cc-word', { style: { '--ink': STROOP_COLORS[it.ink].hex, '--len': word.length }, 'aria-label': `The word ${word}, shown in ${STROOP_COLORS[it.ink].name.toLowerCase()}` }, h('span.oc-cc-word-glow', { 'aria-hidden': 'true' }, word), h('b', { 'aria-hidden': 'true' }, word)));
    btns = it.order.map(id => {
      const b = h('button.oc-tile.oc-cc-opt', { type: 'button', dataset: { sfx: 'none', c: id }, style: { '--sw': STROOP_COLORS[id].hex }, 'aria-label': `${STROOP_COLORS[id].name} text` },
        h('span.oc-tile-face'), h('span.oc-cc-sheen'), h('span.oc-tile-ok'), h('span.oc-tile-bad'), h('i.oc-tile-mark', { 'aria-hidden': 'true' }));
      b.addEventListener('pointerdown', e => { e.preventDefault(); choose(id, k); });
      b.addEventListener('click', e => { if (e.detail === 0) choose(id, k); });
      return b;
    });
    tiles.replaceChildren(...btns);
    paintBar();
    pulseClass(stage, 'q-in');
  };
  const choose = (id, k = chal.p) => {
    if (locked || chal.done || k !== chal.p) return;
    locked = true;
    const it = s.items[k];
    const right = id === it.ink;
    if (api.pick) api.pick(k, id);   // (OC2 — THE ANSWER)
    const mine = btns.find(b => b.dataset.c === id), truth = btns.find(b => b.dataset.c === it.ink);
    btns.forEach(b => b.classList.add('is-locked'));
    mine.classList.add('is-picked');
    truth.classList.add('is-right');
    truth.querySelector('.oc-tile-mark').replaceChildren(tubeMark('check', 'The text color'));
    if (!right) { mine.classList.add('is-wrong'); mine.querySelector('.oc-tile-mark').replaceChildren(tubeMark('cross', 'Wrong')); }
    btns.forEach(b => { if (b !== mine && b !== truth) b.classList.add('is-dim'); });
    api.fx(mine, right);
    api.part(right);
    paintBar();
    timer = setTimeout(() => { locked = false; if (!chal.done) show(); }, right ? 220 : 650);
  };
  api.key = e => { const k = Number(e.key); if (k >= 1 && k <= 4 && s.items[chal.p]) choose(s.items[chal.p].order[k - 1]); };
  wrap.append(
    h('div.oc-qhead', h('span.oc-chip', 'COLOR CLASH'), h('span.oc-qn', qn, ` / ${N}`)),
    bar,
    h('p.oc-q.oc-cc-q', 'TAP THE COLOR OF THE TEXT'),
    stage,
    tiles);
  show();
  return { el: wrap, destroy() { clearTimeout(timer); api.key = null; } };
}
