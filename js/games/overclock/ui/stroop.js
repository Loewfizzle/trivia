// OVERCLOCK — COLOR CLASH. OC4 — THE OVERDRIVE LOOK (docs/overclock.md "Challenge looks"): ONE HUGE COLOR WORD (Barlow 900 italic) drawn in a
// DIFFERENT colour; the line "TAP THE TEXT COLOR". THE ADD-ONS (the owner, Nov 7 — "matching the text colour to a square is too easy"): the four
// answers are COLOR WORDS, big + bold, on dark glass tiles (no solid swatch anywhere: you have to READ them), their text colours a DERANGEMENT of
// the four — all different, never a word's own colour, re-rolled every word (challenges.js#genStroop); the right one = the word that names the
// prompt's text colour (challenges.js#clashAnswer — so its own colour never gives it away). (A "TAP THE WORD" rule was built + dropped the same
// evening — the owner: no.) Right: the tile bursts + sparks and wears a GREEN outline; wrong: the REAL-GLASS CRACK on it, a red edge, and the
// right one's green outline — NO ✓ / ✕ (the owner, after OC4). Timings unchanged (220 / 650 ms to the next word). Never "ink" on screen.
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game(), fx(), pick(), sfx() — view.js.
import { h, pulseClass } from '../../../ui/dom.js';
import { STROOP_COLORS, clashAnswer } from '../challenges.js';

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
    stage.replaceChildren(h('div.oc-cc-word', { style: { '--cc-tc': STROOP_COLORS[it.color].hex, '--len': word.length }, 'aria-label': `The word ${word}, shown in ${STROOP_COLORS[it.color].name.toLowerCase()}` }, h('span.oc-cc-word-glow', { 'aria-hidden': 'true' }, word), h('b', { 'aria-hidden': 'true' }, word)));
    btns = it.order.map(id => {
      const tc = (it.opts && it.opts[id]) || id;
      const name = STROOP_COLORS[id].name;
      const b = h('button.oc-tile.oc-cc-opt', { type: 'button', dataset: { sfx: 'none', c: id, tc }, style: { '--cc-tc': STROOP_COLORS[tc].hex, '--len': name.length }, 'aria-label': `${name}, written in ${STROOP_COLORS[tc].name.toLowerCase()}` },
        h('span.oc-tile-face'), h('b.oc-cc-optw', { 'aria-hidden': 'true' }, name), h('span.oc-tile-ok'), h('span.oc-tile-bad'));
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
    const ans = clashAnswer(s, it);
    const right = id === ans;
    if (api.pick) api.pick(k, id);   // (OC2 — THE ANSWER)
    const mine = btns.find(b => b.dataset.c === id), truth = btns.find(b => b.dataset.c === ans);
    btns.forEach(b => b.classList.add('is-locked'));
    mine.classList.add('is-picked');
    truth.classList.add('is-right');
    truth.setAttribute('aria-label', `${truth.getAttribute('aria-label')} — right`);
    if (!right) { mine.classList.add('is-wrong'); mine.setAttribute('aria-label', `${mine.getAttribute('aria-label')} — wrong`); }
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
    h('p.oc-q.oc-cc-q', 'TAP THE ', h('em', 'TEXT COLOR')),
    stage,
    tiles);
  show();
  return { el: wrap, destroy() { clearTimeout(timer); api.key = null; } };
}
