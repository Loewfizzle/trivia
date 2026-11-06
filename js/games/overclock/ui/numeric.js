// OVERCLOCK — QUICK MATH / PATTERN LOCK on the kit's NUMBER PAD (OC3 — docs/overclock.md "Challenge looks"). NEVER the phone's system
// keyboard: no input element anywhere (kit/numpad.js) — the question stays in view, the pad sits in the thumb zone below it.
//   QUICK MATH: a HUGE sum (Barlow Condensed 900 italic, sized to fit one line) + "= ?", the "−" key for a negative answer.
//   PATTERN LOCK: the sequence as big slanted number chips, the missing slot glowing orange "?"; a right answer DROPS into the slot.
//   Both: the answer field = the kit's slanted orange-edged field + its blinking cursor; LOCK IT IN; the feedback is the kit's resting tiles
//   (OC2): right = the --good edge + ✓ in its socket (+ the burst + the sparks into the score), wrong = dark glass + a red edge + ✕ + the
//   cracks + a shake, your number struck through → the right one. Timings unchanged: the next part comes 380 ms after a right answer, 900
//   ms after a wrong one. A computer's keyboard types into the pad (digits, "-", Backspace, Enter — view.js routes keydown → pad.key).
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game(), fx(), pick(), sfx() — view.js.
import { h, pulseClass } from '../../../ui/dom.js';
import { createNumpad } from '../../kit/numpad.js';
import { tubeMark } from '../../kit/answer.js';
import { fmtVal } from '../shared.js';
import { clearCrack } from '../crack.js';

const MINUS = '−';
const shown = v => (v < 0 ? `${MINUS}${fmtVal(-v)}` : fmtVal(v));
/** the sum's text with the real minus sign (the generators write "−" already) */
const sumText = t => String(t).replace(/-/g, MINUS);

/** the field's resting-tile layers (the kit's field + OC2's right / wrong layers + the mark socket) — shared with CLOSEST CALL */
export function dressField(field) {
  field.classList.add('oc-np-field');
  field.prepend(h('span.oc-tile-ok', { 'aria-hidden': 'true' }), h('span.oc-tile-bad', { 'aria-hidden': 'true' }));
  const mark = h('i.oc-np-mark', { 'aria-hidden': 'true' });
  const fix = h('span.oc-np-fix');
  field.append(fix, mark);
  return {
    right() { field.classList.remove('is-wrong'); field.classList.add('is-right'); mark.replaceChildren(tubeMark('check', 'Right')); },
    wrong(answer) { field.classList.remove('is-right'); field.classList.add('is-wrong'); mark.replaceChildren(tubeMark('cross', 'Wrong')); fix.replaceChildren(h('i', '→'), h('b', answer)); },
    reset() { field.classList.remove('is-right', 'is-wrong'); mark.replaceChildren(); fix.replaceChildren(); field.querySelectorAll('.oc-ring').forEach(n => n.remove()); clearCrack(field); },
  };
}

export default function uiNumeric(s, api) {
  const { chal } = api;
  const math = s.type === 'math';
  const items = math ? s.problems.map(p => ({ ans: p.ans, text: sumText(p.text) })) : s.seqs.map(q => ({ ans: q.ans, shown: q.shown }));
  const wrap = h('div.ch.oc-num', { class: math ? 'oc-math' : 'oc-pat' });
  const qn = h('b', '1');
  const head = h('div.oc-qhead', h('span.oc-chip', math ? 'SOLVE IT' : 'WHAT COMES NEXT?'), h('span.oc-qn', qn, ` / ${items.length}`));
  const prompt = h('div.oc-num-q');
  let locked = false, timer = 0, slot = null;
  const pad = createNumpad({
    extra: MINUS, confirm: 'LOCK IT IN', maxLen: 6, placeholder: 'TYPE YOUR ANSWER',
    onKey: (k, changed) => { if (changed) api.sfx('tap'); },
    onSubmit: (v, n) => submit(n),
  });
  const field = dressField(pad.field);
  const show = () => {
    if (chal.p >= items.length) return;
    const it = items[chal.p];
    qn.textContent = String(chal.p + 1);
    pad.clear();
    pad.lock(false);
    field.reset();
    if (math) {
      // one line, as big as it fits: the font follows the sum's length (Barlow Condensed's digits ≈ 0.5 em)
      prompt.replaceChildren(h('div.oc-sum', { style: { '--len': String(it.text.length + 3) }, 'aria-label': `${it.text} equals what?` },
        h('span.oc-sum-t', it.text), h('span.oc-sum-eq', ' = ', h('b', '?'))));
    } else {
      const digits = Math.max(...[...it.shown, it.ans].map(v => String(Math.abs(v)).length + (v < 0 ? 1 : 0)));
      slot = h('span.oc-seq-chip.is-slot', h('span.oc-seq-glow', { 'aria-hidden': 'true' }), h('b', '?'));
      prompt.replaceChildren(h('div.oc-seq', { class: digits >= 4 ? 'is-two' : null, style: { '--dg': String(Math.max(2, digits)) }, 'aria-label': `${it.shown.join(', ')}, then what?` },
        it.shown.map((v, i) => h('span.oc-seq-chip', { style: { '--i': i } }, h('b', shown(v)))), slot));
    }
    pulseClass(prompt, 'q-in');
  };
  const submit = n => {
    if (locked || chal.done || Number.isNaN(n)) return;
    locked = true;
    pad.lock(true);
    const it = items[chal.p];
    const right = n === it.ans;
    api.pick(chal.p, n);   // (THE ANSWER shows your pick when it was wrong — this device only)
    if (right) field.right(); else field.wrong(shown(it.ans));
    if (slot) { slot.classList.add(right ? 'is-right' : 'is-wrong', 'is-filled'); slot.querySelector('b').textContent = shown(it.ans); }
    api.fx(pad.field, right);
    api.part(right);
    timer = setTimeout(() => { locked = false; if (!chal.done) show(); }, right ? 380 : 900);
  };
  api.key = e => { if (!locked) pad.key(e); };
  show();
  wrap.append(head, prompt, pad.el);
  return { el: wrap, destroy() { clearTimeout(timer); api.key = null; } };
}
