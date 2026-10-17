// OVERCLOCK — CLOSEST CALL: one estimate on a keypad.
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game() — see view.js.
import { h, vibrate } from '../../../ui/dom.js';
import { sfx } from '../../../audio/sfx.js';
import { closestCredit } from '../challenges.js';
import { fmtVal, fastButton } from '../shared.js';

export default function uiClosest(s, api) {
  const { chal } = api;
  let value = '';
  const display = h('div.cl-display');
  const unit = h('span.cl-unit', s.unit);
  const paint = () => {
    display.replaceChildren(h('span.cl-num', value ? fmtVal(value) : '0'), unit);
    display.classList.toggle('is-empty', !value);
    lock.disabled = !value || value === '.';
  };
  const press = k => {
    if (chal.done) return;
    if (k === '<') value = value.slice(0, -1);
    else if (k === '.') { if (!value.includes('.') && value.length < 10) value = (value || '0') + '.'; }
    else if (value.replace('.', '').length < 10) value = value === '0' ? k : value + k;
    sfx('key');
    vibrate(5);
    paint();
  };
  const go = () => {
    if (chal.done || !value || value === '.') return;
    const g = Number(value);
    if (!(g >= 0)) return;
    sfx('lock');
    vibrate(14);
    api.progress(closestCredit(g, s.answer), 1, { g }, true, 350);
  };
  const pad = h('div.keypad.cl-pad', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '<'].map(k => fastButton('button.kp', { class: k === '<' ? 'kp-del' : null, 'aria-label': k === '<' ? 'Delete' : k }, () => press(k), k === '<' ? '⌫' : k)));
  const lock = h('button.btn.btn-primary.btn-block.cl-lock', { type: 'button', disabled: true, onclick: go }, 'LOCK IT IN');
  api.key = e => {
    if (/^[0-9.]$/.test(e.key)) press(e.key);
    else if (e.key === 'Backspace') press('<');
    else if (e.key === 'Enter') go();
  };
  paint();
  const el = h('div.ch.ch-closest',
    h('div.cl-card', h('span.cl-cat', s.cat.toUpperCase()), h('p.cl-q', s.q)),
    display, pad, lock);
  return { el, destroy() { api.key = null; } };
}
