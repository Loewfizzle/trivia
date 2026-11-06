// OVERCLOCK — UNSCRAMBLE: tap the letters back into the word (any valid anagram counts). OC3 — the OVERDRIVE look (docs/overclock.md
// "Challenge looks"; it keeps its letter tiles — no keyboard): DASHED answer slots fill with HOT-ORANGE letters as you tap the big glass
// letter tiles below; a used tile fades out (opacity) and comes back when you take its letter out — tap a filled slot to undo it; CLEAR +
// SHUFFLE keys. Full word: right = the slots light white-hot + ✓ (the burst + the sparks); wrong = a red shake, then they empty (420 ms, as
// before). A computer's keyboard types the letters (Backspace undoes). Your guess is kept for THE ANSWER (api.pick — this device only).
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game(), fx(), pick(), sfx() — view.js.
import { h } from '../../../ui/dom.js';
import { shuffle } from '../../../core/rng.js';
import { isValidGuess } from '../../cipher/words.js';
import { unscrambleAccepts } from '../challenges.js';
import { flash } from '../../kit/numpad.js';
import { tubeMark } from '../../kit/answer.js';
import { clearCrack } from '../crack.js';

const press = (el, fn) => {
  el.addEventListener('pointerdown', e => { e.preventDefault(); fn(); });
  el.addEventListener('click', e => { if (e.detail === 0) fn(); });
  return el;
};

export default function uiUnscramble(s, api) {
  const { chal } = api;
  const n = s.word.length;
  let pool = s.letters.map((ch, i) => ({ ch, i }));
  let picked = [];
  let busy = false, timer = 0;
  const slots = h('div.oc-us-slots', { style: { '--n': n } });
  const mark = h('i.oc-us-mark', { 'aria-hidden': 'true' });
  const tiles = h('div.oc-us-tiles', { class: n >= 6 ? 'is-two' : null, style: { '--n': n, '--per': n >= 6 ? Math.ceil(n / 2) : n } });
  const tileEls = new Map();
  const buildTiles = () => {
    tileEls.clear();
    tiles.replaceChildren(...pool.map(t => {
      const b = press(h('button.oc-us-tile', { type: 'button', dataset: { sfx: 'none', ch: t.ch }, 'aria-label': t.ch.toUpperCase() },
        h('span.oc-us-face', { 'aria-hidden': 'true' }), h('span.oc-us-glow', { 'aria-hidden': 'true' }), h('b', t.ch.toUpperCase())), () => add(t));
      tileEls.set(t, b);
      return b;
    }));
  };
  const render = () => {
    slots.replaceChildren(...Array.from({ length: n }, (_, k) => {
      const t = picked[k];
      return press(h('button.oc-us-slot', { type: 'button', class: [t ? 'is-full' : '', !t && k === picked.length ? 'is-next' : ''].join(' '), dataset: { sfx: 'none' }, 'aria-label': t ? `Take out ${t.ch.toUpperCase()}` : 'Empty' },
        h('span.oc-us-sface', { 'aria-hidden': 'true' }), h('b', t ? t.ch.toUpperCase() : '')), () => undo(k));
    }), mark);
    for (const [t, b] of tileEls) { const used = picked.includes(t); b.classList.toggle('is-used', used); b.disabled = used; }
  };
  const add = t => {
    if (busy || chal.done || picked.length >= n || picked.includes(t)) return;
    const b = tileEls.get(t);
    if (b) flash(b);
    picked.push(t);
    api.sfx('tap');
    render();
    if (picked.length === n) check();
  };
  const undo = k => {
    if (busy || chal.done || !picked[k]) return;
    picked.splice(k, 1);
    api.sfx('tap');
    render();
  };
  const check = () => {
    const guess = picked.map(t => t.ch).join('');
    api.pick(0, guess);
    if (unscrambleAccepts(guess, s.word, isValidGuess)) {
      busy = true;
      slots.classList.add('is-win');
      mark.replaceChildren(tubeMark('check', 'Solved'));
      api.fx(slots, true);
      api.part(true);
    } else {
      busy = true;
      api.sfx('wrong');
      slots.classList.add('is-bad');
      api.fx(slots, false);
      timer = setTimeout(() => { busy = false; slots.classList.remove('is-bad'); clearCrack(slots); picked = []; render(); }, 420);
    }
  };
  const key = (label, fn, cls) => { const b = h(`button.gk-key.oc-us-key${cls}`, { type: 'button', dataset: { sfx: 'none' } }, h('span.gk-key-face'), h('span.gk-key-glow'), h('span.gk-key-label', label)); return press(b, () => { flash(b); fn(); }); };
  // (SHUFFLE is this phone's own view of the tiles — Math.random is fine here: nothing about it is the game's state)
  const clearKey = key('CLEAR', () => { if (busy || chal.done) return; picked = []; api.sfx('tap'); render(); }, '.is-clear');
  const shuffleKey = key('SHUFFLE', () => { if (busy || chal.done) return; pool = shuffle(Math.random, pool); api.sfx('tap'); buildTiles(); render(); }, '.is-shuffle');
  api.key = e => {
    if (/^[a-z]$/i.test(e.key)) { const t = pool.find(x => x.ch === e.key.toLowerCase() && !picked.includes(x)); if (t) add(t); e.preventDefault(); }
    else if (e.key === 'Backspace') { if (picked.length) undo(picked.length - 1); e.preventDefault(); }
  };
  buildTiles();
  render();
  const el = h('div.ch.oc-us',
    h('div.oc-qhead', h('span.oc-chip', 'REBUILD THE WORD'), h('span.oc-unit', `${n} LETTERS`)),
    h('div.oc-us-play', slots, tiles),
    h('div.oc-us-keys', clearKey, shuffleKey));
  return { el, destroy() { clearTimeout(timer); api.key = null; } };
}
