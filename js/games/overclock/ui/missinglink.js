// OVERCLOCK — MISSING LINK on the kit's LETTER KEYBOARD (OC3 — docs/overclock.md "Challenge looks"). NEVER the phone's system keyboard: no
// input element (the old hidden <input> + its iOS-keyboard code are gone) — the clues stay on screen, no autocorrect, no layout jump.
//   Three BIG clue words on slanted glass cards; the glowing orange ANSWER SLOT with one dash per letter, your letters filling in HOT ORANGE
//   as you type; QWERTY glass keys (kit/keyboard.js) + ⌫ + an orange GO (+ SKIP on the first puzzle, as before).
//   The exact answer LOCKS IN BY ITSELF the moment it's typed (unchanged); anything else (a plural, another spelling) waits for GO.
//   A wrong GO: the slot shakes red, "NOT IT", and the next letter starts a fresh word (⌫ edits the one you had).
// A computer's keyboard types into it (letters, Backspace, Enter — view.js routes keydown → kb.key). Timings unchanged (950 / 1300 ms).
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game(), fx(), pick(), sfx() — view.js.
import { h, pulseClass } from '../../../ui/dom.js';
import { createKeyboard } from '../../kit/keyboard.js';
import { flash } from '../../kit/numpad.js';
import { tubeMark } from '../../kit/answer.js';
import { linkAccepts, normWord } from '../challenges.js';

export default function uiMissingLink(s, api) {
  const { chal } = api;
  const wrap = h('div.ch.oc-link');
  let idx = Math.min(1, Math.floor(chal.p));
  let busy = false, fresh = false, timer = 0, lastKey = '';
  const pz = () => s.puzzles[idx];
  const len = () => normWord(pz().answer).length;
  const qn = h('b', '1');
  const lenTag = h('span.oc-unit');
  const words = h('div.oc-ml-words');
  const slot = h('div.oc-ml-slot', { role: 'status', 'aria-live': 'polite' });
  const mark = h('i.oc-ml-mark', { 'aria-hidden': 'true' });
  const hint = h('div.oc-ml-hint');
  const kb = createKeyboard({
    go: 'GO', maxLen: 12,
    onKey: (k, changed) => { lastKey = k; if (changed && !busy) api.sfx('tap'); },
    // (after a wrong GO the next LETTER starts a fresh word; ⌫ edits the one you had — the keyboard has its new value by now)
    onChange: () => { if (busy) return; if (fresh) { fresh = false; if (lastKey !== '⌫') kb.set(lastKey); } paint(); typed(); },
    onGo: () => submit(),
  });
  // SKIP (the first puzzle only — as before): a glass key beside GO
  const skip = h('button.gk-key.gk-kb-key.oc-ml-skip', { type: 'button', dataset: { sfx: 'none' }, 'aria-label': 'Skip this puzzle' }, h('span.gk-key-face'), h('span.gk-key-glow'), h('span.gk-key-label', 'SKIP ›'));
  skip.addEventListener('pointerdown', e => { e.preventDefault(); flash(skip); doSkip(); });
  skip.addEventListener('click', e => { if (e.detail === 0) doSkip(); });
  kb.el.querySelector('.gk-kb-r3').prepend(skip);
  const paint = (win = false) => {
    const v = win ? normWord(pz().answer) : kb.value;
    const n = Math.max(len(), v.length);
    slot.style.setProperty('--n', String(n));
    slot.replaceChildren(h('span.oc-ml-glow', { 'aria-hidden': 'true' }), ...Array.from({ length: n }, (_, i) => h('span.oc-ml-cell', {
      class: [i < v.length ? 'is-full' : '', i >= len() ? 'is-extra' : '', !win && !busy && i === Math.min(v.length, n - 1) && v.length < n ? 'is-caret' : '', win ? 'is-win' : ''].join(' '),
      style: win ? { '--i': i } : null,
    }, h('b', v[i] || ''))), mark);
  };
  const say = (t, cls = '') => { hint.textContent = t; hint.className = `oc-ml-hint ${cls}`; };
  const show = () => {
    qn.textContent = String(idx + 1);
    lenTag.textContent = `${len()} LETTERS`;
    words.replaceChildren(...pz().words.map((w, k) => h('div.oc-ml-word', { style: { '--k': k } }, h('span.oc-ml-word-glass', { 'aria-hidden': 'true' }), h('b', w))));
    kb.clear();
    kb.lock(false);
    skip.hidden = idx > 0;
    fresh = false;
    wrap.classList.remove('is-solved', 'is-wrong');
    mark.replaceChildren();
    say('TYPE THE WORD THAT JOINS ALL THREE');
    paint();
    pulseClass(words, 'q-in');
  };
  const advance = () => { busy = false; if (chal.done) return; idx = 1; show(); };
  const success = () => {
    busy = true;
    kb.lock(true);
    wrap.classList.add('is-solved');
    api.pick(idx, normWord(pz().answer));
    paint(true);
    mark.replaceChildren(tubeMark('check', 'Linked'));
    say('LINKED!', 'is-good');
    api.fx(slot, true);
    api.part(true);
    if (!chal.done) timer = setTimeout(advance, 950);
  };
  // the exact answer locks in by itself; anything else waits for GO
  const typed = () => { if (!busy && normWord(kb.value).length === len() && linkAccepts(kb.value, pz())) success(); };
  const submit = () => {
    if (busy || chal.done) return;
    const v = normWord(kb.value);
    if (!v) { say('TYPE YOUR ANSWER FIRST', 'is-warn'); pulseClass(slot, 'oc-shake', 380); return; }
    if (linkAccepts(v, pz())) { success(); return; }
    api.pick(idx, v);   // (THE ANSWER shows your last guess when you never got it)
    api.sfx('wrong');
    wrap.classList.remove('is-wrong'); void wrap.offsetWidth; wrap.classList.add('is-wrong');
    pulseClass(slot, 'oc-shake', 380);
    say('NOT IT — TRY AGAIN', 'is-warn');
    fresh = true;
  };
  const doSkip = () => {
    if (busy || chal.done || idx > 0) return;
    busy = true;
    kb.lock(true);
    say(`IT WAS ${normWord(pz().answer)}`, 'is-warn');
    api.part(false, true);
    timer = setTimeout(advance, 1300);
  };
  api.key = e => { if (!busy) kb.key(e); };
  wrap.append(h('div.oc-qhead', h('span.oc-chip', 'FIND THE LINK'), lenTag, h('span.oc-qn', qn, ' / 2')), words, slot, hint, kb.el);
  show();
  return { el: wrap, destroy() { clearTimeout(timer); api.key = null; } };
}
