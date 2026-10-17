// OVERCLOCK — UNSCRAMBLE: tap the letters back into the word (any valid anagram counts).
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game() — see view.js.
import { h, clear, pulseClass, vibrate } from '../../../ui/dom.js';
import { sfx } from '../../../audio/sfx.js';
import { shuffle } from '../../../core/rng.js';
import { isValidGuess } from '../../cipher/words.js';
import { unscrambleAccepts } from '../challenges.js';

export default function uiUnscramble(s, api) {
  const { chal } = api;
  const n = s.word.length;
  let pool = s.letters.map((ch, i) => ({ ch, i }));
  let picked = [];
  const slots = h('div.us-slots', { style: { '--n': n } });
  const tiles = h('div.us-tiles', { style: { '--n': n } });
  const render = () => {
    clear(slots);
    for (let k = 0; k < n; k++) {
      const t = picked[k];
      slots.append(h('button.us-slot', { type: 'button', class: t ? 'is-full' : null, dataset: { sfx: 'none' }, onclick: () => { if (t) { picked.splice(k, 1); sfx('key'); render(); } } }, t ? t.ch : ''));
    }
    clear(tiles);
    for (const t of pool) {
      const used = picked.includes(t);
      tiles.append(h('button.us-tile', { type: 'button', class: used ? 'is-used' : null, disabled: used, dataset: { sfx: 'none' }, onclick: () => add(t) }, t.ch));
    }
  };
  const add = t => {
    if (picked.length >= n || picked.includes(t)) return;
    picked.push(t);
    sfx('key');
    vibrate(6);
    render();
    if (picked.length === n) check();
  };
  const check = () => {
    const guess = picked.map(t => t.ch).join('');
    if (unscrambleAccepts(guess, s.word, isValidGuess)) {
      slots.classList.add('is-win');
      api.part(true);
    } else {
      sfx('invalid');
      vibrate([30, 30, 30]);
      pulseClass(slots, 'shake', 500);
      setTimeout(() => { picked = []; render(); }, 420);
    }
  };
  api.key = e => {
    if (/^[a-z]$/i.test(e.key)) { const t = pool.find(x => x.ch === e.key.toLowerCase() && !picked.includes(x)); if (t) add(t); }
    else if (e.key === 'Backspace') { picked.pop(); render(); }
  };
  render();
  const el = h('div.ch.ch-unscramble',
    h('div.ch-prompt', 'REBUILD THE WORD'),
    slots, tiles,
    h('div.ch-actions',
      h('button.btn.btn-ghost.btn-sm', { type: 'button', onclick: () => { pool = shuffle(Math.random, pool); render(); } }, 'SHUFFLE'),
      h('button.btn.btn-ghost.btn-sm', { type: 'button', onclick: () => { picked = []; render(); } }, 'CLEAR')));
  return { el, destroy() { api.key = null; } };
}
