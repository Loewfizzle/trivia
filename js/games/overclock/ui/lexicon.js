// OVERCLOCK — LEXICON: build words from nine letters; the longest counts.
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game() — see view.js.
import { h, pulseClass, vibrate } from '../../../ui/dom.js';
import { sfx } from '../../../audio/sfx.js';
import { shuffle } from '../../../core/rng.js';
import { lexiconOk } from '../challenges.js';
import { fastButton } from '../shared.js';

export default function uiLexicon(s, api) {
  const { chal } = api;
  const valid = new Set(s.words);
  const found = [];
  let best = chal.extra.w || '';
  let order = s.letters.map((ch, i) => ({ ch, i }));
  let picked = [];
  const word = h('div.lx-word', { 'aria-live': 'polite' });
  const meter = h('div.lx-meter');
  const hint = h('div.lx-hint');
  const grid = h('div.lx-grid');
  const chips = h('div.lx-found');
  const paint = () => {
    word.replaceChildren(...(picked.length ? picked.map(t => h('span.lx-l', t.ch.toUpperCase())) : [h('span.lx-ph', 'TAP LETTERS')]));
    word.classList.toggle('is-empty', !picked.length);
    grid.replaceChildren(...order.map(t => fastButton('button.lx-tile', { class: picked.includes(t) ? 'is-used' : null, disabled: picked.includes(t), 'aria-label': t.ch }, () => add(t), t.ch.toUpperCase())));
    meter.replaceChildren(h('span', 'BEST ', h('b', best ? `${best.length}` : '–')), h('span', 'LONGEST POSSIBLE ', h('b', String(s.max))));
  };
  const say = (t, kind = '') => { hint.textContent = t; hint.className = `lx-hint is-on ${kind}`; clearTimeout(say.t); say.t = setTimeout(() => { hint.className = 'lx-hint'; }, 1300); };
  const add = t => { if (chal.done || picked.includes(t)) return; picked.push(t); sfx('key'); vibrate(5); paint(); };
  const back = () => { picked.pop(); paint(); };
  const submit = () => {
    if (chal.done) return;
    const w = picked.map(t => t.ch).join('');
    if (w.length < 3) { say('3+ LETTERS', 'is-warn'); return; }
    if (!valid.has(w)) { sfx('invalid'); vibrate([30, 30, 30]); pulseClass(word, 'shake', 450); say('NOT IN THE DICTIONARY', 'is-warn'); return; }
    if (found.includes(w)) { say('ALREADY FOUND', 'is-warn'); picked = []; paint(); return; }
    found.unshift(w);
    chips.prepend(h('span.lx-chip', { class: w.length >= best.length ? 'is-best' : null }, w.toUpperCase(), h('small', String(w.length))));
    picked = [];
    if (w.length > best.length) {
      best = w;
      chips.querySelectorAll('.lx-chip').forEach((c, k) => c.classList.toggle('is-best', k === 0));
      const max = best.length >= s.max;
      say(max ? 'LONGEST POSSIBLE!' : `NEW BEST · ${w.length} LETTERS`, 'is-good');
      sfx(max ? 'solve' : 'ocCorrect');
      vibrate(max ? [20, 40, 20] : 12);
      api.progress(lexiconOk(best.length, s.max), lexiconOk(best.length, s.max), { w: best }, max, 900);
    } else { say(`+ ${w.toUpperCase()}`, 'is-good'); sfx('ocCorrect'); }
    paint();
  };
  api.key = e => {
    if (/^[a-z]$/i.test(e.key)) { const t = order.find(x => x.ch === e.key.toLowerCase() && !picked.includes(x)); if (t) add(t); }
    else if (e.key === 'Backspace') back();
    else if (e.key === 'Enter') submit();
  };
  if (best) chips.append(h('span.lx-chip.is-best', best.toUpperCase(), h('small', String(best.length))));
  paint();
  const el = h('div.ch.ch-lexicon',
    h('div.ch-prompt', 'BUILD THE LONGEST WORD'),
    meter, word, hint, grid,
    h('div.ch-actions.lx-actions',
      h('button.btn.btn-ghost.btn-sm', { type: 'button', onclick: () => { order = shuffle(Math.random, order); paint(); } }, 'SHUFFLE'),
      h('button.btn.btn-ghost.btn-sm', { type: 'button', 'aria-label': 'Delete letter', onclick: back }, '⌫'),
      h('button.btn.btn-primary.btn-sm.lx-go', { type: 'button', onclick: submit }, 'SUBMIT')),
    chips);
  return { el, destroy() { api.key = null; clearTimeout(say.t); } };
}
