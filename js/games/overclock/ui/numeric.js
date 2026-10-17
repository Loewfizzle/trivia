// OVERCLOCK — QUICK MATH / PATTERN LOCK: a prompt and a numeric keypad.
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game() — see view.js.
import { h, pulseClass, vibrate } from '../../../ui/dom.js';
import { sfx } from '../../../audio/sfx.js';

export default function uiNumeric(s, api) {
  const { chal } = api;
  const items = s.type === 'math'
    ? s.problems.map(p => ({ prompt: h('div.num-q', p.text, h('span.num-eq', ' = ?')), ans: p.ans }))
    : s.seqs.map(q => ({ prompt: h('div.num-q.num-seq', q.shown.join(', '), h('span.num-eq', ', ?')), ans: q.ans }));
  const head = h('div.ch-prompt');
  const promptBox = h('div.num-prompt');
  const display = h('div.num-display');
  let value = '';
  let locked = false;
  const paint = () => {
    display.textContent = value || ' ';
    display.classList.toggle('is-empty', !value);
  };
  const show = () => {
    if (chal.p >= items.length) return;
    head.textContent = `${s.type === 'math' ? 'SOLVE' : 'NEXT IN SEQUENCE'} · ${chal.p + 1}/${items.length}`;
    promptBox.replaceChildren(items[chal.p].prompt);
    pulseClass(promptBox, 'q-in');
    value = '';
    paint();
  };
  const press = k => {
    if (locked || chal.done) return;
    if (k === '<') { value = value.slice(0, -1); paint(); return; }
    if (k === '>') {
      if (!value) return;
      const right = Number(value) === items[chal.p].ans;
      locked = true;
      display.classList.add(right ? 'is-right' : 'is-wrong');
      if (!right) display.textContent = `${value} → ${items[chal.p].ans}`;
      api.part(right);
      setTimeout(() => { locked = false; display.classList.remove('is-right', 'is-wrong'); if (!chal.done) show(); }, right ? 380 : 900);
      return;
    }
    if (value.length >= 6) return;
    value += k;
    sfx('key');
    vibrate(6);
    paint();
  };
  const pad = h('div.keypad', { dataset: { sfx: 'none' } },
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '<', '0', '>'].map(k => h('button.kp', {
      type: 'button', class: k === '>' ? 'kp-go' : k === '<' ? 'kp-del' : null,
      onpointerdown: e => { e.preventDefault(); press(k); },
      onclick: e => { if (e.detail === 0) press(k); },
    }, k === '<' ? '⌫' : k === '>' ? 'ENTER' : k)));
  api.key = e => {
    if (/^[0-9]$/.test(e.key)) press(e.key);
    else if (e.key === 'Backspace') press('<');
    else if (e.key === 'Enter') press('>');
  };
  show();
  return { el: h('div.ch.ch-num', head, promptBox, display, pad), destroy() { api.key = null; } };
}
