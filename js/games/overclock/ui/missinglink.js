// OVERCLOCK — MISSING LINK: type the word that joins three clues (iOS-keyboard aware).
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game() — see view.js.
import { h, pulseClass, vibrate } from '../../../ui/dom.js';
import { sfx } from '../../../audio/sfx.js';
import { linkAccepts, normWord } from '../challenges.js';
import { fastButton } from '../shared.js';

export default function uiMissingLink(s, api) {
  const { chal } = api;
  const wrap = h('div.ch.ch-link');
  let idx = Math.min(1, Math.floor(chal.p));
  let busy = false;
  const input = h('input.ml-input', {
    type: 'text', inputmode: 'text', autocapitalize: 'characters', autocomplete: 'off', autocorrect: 'off',
    spellcheck: 'false', enterkeyhint: 'go', 'aria-label': 'Your answer',
  });
  const blanks = h('div.ml-blanks', { 'aria-hidden': 'true' });
  const field = h('label.ml-field', blanks, input);
  const hint = h('div.ml-hint');
  const title = h('div.ch-prompt');
  const words = h('div.ml-words');
  const pz = () => s.puzzles[idx];
  const len = () => normWord(pz().answer).length;
  const go = fastButton('button.btn.btn-primary.ml-go', {}, () => submit(), 'ENTER');
  const skip = fastButton('button.btn.btn-ghost.ml-skip', {}, () => doSkip(), 'SKIP →');
  const paint = () => {
    const v = normWord(input.value);
    const cells = Math.max(len(), v.length);
    const focused = document.activeElement === input;
    blanks.style.setProperty('--n', cells);
    blanks.replaceChildren(...Array.from({ length: cells }, (_, i) => h('span.ml-cell', {
      class: [i < v.length ? 'is-full' : '', i >= len() ? 'is-extra' : '', focused && i === Math.min(v.length, cells - 1) ? 'is-caret' : ''].join(' '),
    }, v[i] || '')));
    field.classList.toggle('is-focus', focused);
  };
  const say = (t, cls = '') => { hint.textContent = t; hint.className = `ml-hint ${cls}`; };
  const show = () => {
    title.textContent = `PUZZLE ${idx + 1}/2 · ${len()} LETTERS`;
    words.replaceChildren(...pz().words.map((w, k) => h('div.ml-word', { style: { animationDelay: `${k * 90}ms` } }, w)));
    input.value = '';
    input.maxLength = len() + 3;
    skip.hidden = idx > 0;
    wrap.classList.remove('is-solved');
    say(matchMedia('(pointer: coarse)').matches ? 'TAP THE BOXES TO TYPE' : 'TYPE YOUR ANSWER · ENTER');
    paint();
  };
  const advance = () => { busy = false; if (chal.done) return; idx = 1; show(); };
  const success = () => {
    busy = true;
    wrap.classList.add('is-solved');
    blanks.replaceChildren(...[...normWord(pz().answer)].map((c, i) => h('span.ml-cell.is-full.is-win', { style: { animationDelay: `${i * 45}ms` } }, c)));
    say('LINKED!', 'is-good');
    api.part(true);
    if (!chal.done) setTimeout(advance, 950);
  };
  const submit = () => {
    if (busy || chal.done) return;
    const v = normWord(input.value);
    if (!v) { say('TYPE YOUR ANSWER FIRST', 'is-warn'); input.focus({ preventScroll: true }); return; }
    if (linkAccepts(v, pz())) { success(); return; }
    sfx('invalid');
    vibrate([30, 30, 30]);
    pulseClass(field, 'shake', 450);
    say('NOT IT — TRY AGAIN', 'is-warn');
    input.focus({ preventScroll: true });
    input.select();
  };
  const doSkip = () => {
    if (busy || chal.done || idx > 0) return;
    busy = true;
    say(`IT WAS ${normWord(pz().answer)}`, 'is-warn');
    api.part(false, true);
    setTimeout(advance, 1300);
  };
  input.addEventListener('input', () => {
    const clean = input.value.toUpperCase().replace(/[^A-Z]/g, '');
    if (clean !== input.value) input.value = clean;
    if (busy) return;
    sfx('key');
    paint();
    // the exact answer locks in by itself; anything else (a plural, a wrong guess) waits for ENTER
    if (normWord(input.value).length === len() && linkAccepts(input.value, pz())) success();
  });
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
  input.addEventListener('focus', paint);
  input.addEventListener('blur', paint);
  show();
  // desktop: type straight away (a phone needs a tap to raise its keyboard)
  if (!matchMedia('(pointer: coarse)').matches) setTimeout(() => input.focus({ preventScroll: true }), 60);
  wrap.append(title, words, field, hint, h('div.ml-actions', skip, go));
  return { el: wrap, destroy() { input.blur(); } };
}
