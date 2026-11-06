// OVERCLOCK — SPELLCHECK: pick the one correct spelling of four. OC3B — THE OVERDRIVE LOOK (docs/overclock.md "Challenge looks"):
//   its own slanted 5-SEGMENT BAR (a word each — lit orange as you answer, the current one outlined), "WHICH ONE IS RIGHT?" in bold white,
//   four STYLE-C tiles (≥ 56 pt, blue letter badges; the tapped one turns hot orange, the press sinks + flashes) with the spellings in a
//   plain UPRIGHT face — never slanted, letter-spaced, big enough to compare every letter at 390 pt. Right: the tile bursts + sparks into the
//   score and rests with the --good edge + ✓; wrong: it cracks + shakes, rests dark with a red edge + ✕, and the right one lights ✓.
//   Your pick is kept for THE ANSWER (api.pick — this device only). Timings unchanged (480 / 1100 ms to the next word).
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game(), fx(), pick(), sfx() — view.js.
import { h, pulseClass } from '../../../ui/dom.js';
import { tubeMark } from '../../kit/answer.js';

const LETTERS = 'ABCD';

export default function uiSpellcheck(s, api) {
  const { chal } = api;
  const N = s.items.length;
  // (.oc-ownbar: the challenge draws its own progress bar — the frame's slim pips step aside)
  const wrap = h('div.ch.oc-sp.oc-ownbar');
  const segs = Array.from({ length: N }, () => h('i'));
  const bar = h('div.oc-segbar.oc-sp-bar', { 'aria-hidden': 'true' }, segs);
  const qn = h('b', '1');
  const tiles = h('div.oc-tiles.oc-sp-tiles');
  let locked = false, timer = 0, opts = [];
  const paintBar = () => segs.forEach((g, i) => { g.className = i < chal.p ? 'is-on' : i === chal.p ? 'is-cur' : ''; });
  const show = () => {
    if (chal.p >= N) return;
    const it = s.items[chal.p];
    const k = chal.p;
    qn.textContent = String(k + 1);
    opts = it.options.map((w, i) => {
      const b = h('button.oc-tile.oc-sp-opt', { type: 'button', dataset: { sfx: 'none', i: String(i) }, 'aria-label': `${LETTERS[i]}: ${w}` },
        h('span.oc-tile-face'), h('span.oc-tile-ok'), h('span.oc-tile-bad'), h('span.oc-tile-glow'),
        h('i.oc-badge', LETTERS[i]), h('span.oc-tile-t.oc-sp-word', { style: { '--len': String(w).length } }, w), h('i.oc-tile-mark', { 'aria-hidden': 'true' }));
      b.addEventListener('pointerdown', e => { e.preventDefault(); choose(i, k); });
      b.addEventListener('click', e => { if (e.detail === 0) choose(i, k); });
      return b;
    });
    tiles.replaceChildren(...opts);
    paintBar();
    pulseClass(tiles, 'q-in');
  };
  const choose = (i, k) => {
    if (locked || chal.done || k !== chal.p) return;
    locked = true;
    const it = s.items[k];
    const right = i === it.ans;
    opts.forEach(o => o.classList.add('is-locked'));
    opts[i].classList.add('is-picked');
    opts[it.ans].classList.add('is-right');
    opts[it.ans].querySelector('.oc-tile-mark').replaceChildren(tubeMark('check', 'Right spelling'));
    if (!right) { opts[i].classList.add('is-wrong'); opts[i].querySelector('.oc-tile-mark').replaceChildren(tubeMark('cross', 'Wrong')); }
    opts.forEach((o, j) => { if (j !== it.ans && j !== i) o.classList.add('is-dim'); });
    api.pick(k, i);
    api.fx(opts[i], right);
    api.part(right);
    paintBar();
    timer = setTimeout(() => { locked = false; if (!chal.done) show(); }, right ? 480 : 1100);
  };
  const KEY = { a: 0, b: 1, c: 2, d: 3, 1: 0, 2: 1, 3: 2, 4: 3 };
  api.key = e => { const i = KEY[String(e.key).toLowerCase()]; if (i != null && opts[i]) choose(i, chal.p); };
  wrap.append(
    h('div.oc-qhead', h('span.oc-chip', 'PICK THE SPELLING'), h('span.oc-qn', qn, ` / ${N}`)),
    bar,
    h('p.oc-q.oc-sp-q', 'WHICH ONE IS RIGHT?'),
    tiles);
  show();
  return { el: wrap, destroy() { clearTimeout(timer); api.key = null; } };
}
