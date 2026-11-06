// OVERCLOCK — CLOSEST CALL on the kit's NUMBER PAD (OC3 — docs/overclock.md "Challenge looks"): the category chip + the bold question, its
// UNIT CHIP ("km", "years" …) — in the answer field too, so your number always reads with its unit; the "." key (any estimate may be a
// decimal — shown on every question: showing it only when the answer has one would be a hint); one LOCK IT IN. Never the system keyboard.
// No right / wrong here — how close you were is THE ANSWER's (the seal holds it until the round closes): LOCK IT IN turns the field hot
// orange + LOCKED, then the done card (350 ms, as before). The score is the same closestCredit; DEAD ON (the server's: credit 1) unchanged.
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game(), fx(), pick(), sfx() — view.js.
import { h, vibrate } from '../../../ui/dom.js';
import { createNumpad } from '../../kit/numpad.js';
import { closestCredit } from '../challenges.js';
import { dressField } from './numeric.js';

export default function uiClosest(s, api) {
  const { chal } = api;
  let sent = false;
  const pad = createNumpad({
    extra: '.', confirm: 'LOCK IT IN', maxLen: 9, placeholder: 'YOUR ESTIMATE',
    onKey: (k, changed) => { if (changed) api.sfx('tap'); },
    onSubmit: (v, g) => go(g),
  });
  dressField(pad.field);
  pad.field.classList.add('oc-cl-field');
  pad.field.append(h('span.oc-unit.oc-cl-unit', s.unit));
  const go = g => {
    if (sent || chal.done || !(g >= 0)) return;
    sent = true;
    pad.lock(true);
    pad.field.classList.add('is-sent');
    api.sfx('submit');
    vibrate(14);
    api.progress(closestCredit(g, s.answer), 1, { g }, true, 350);
  };
  api.key = e => { if (!sent) pad.key(e); };
  const el = h('div.ch.oc-num.oc-closest',
    h('div.oc-qhead', h('span.oc-chip', String(s.cat || 'ESTIMATE').toUpperCase()), h('span.oc-unit', s.unit)),
    h('div.oc-num-q.oc-cl-q', h('p.oc-q.oc-cl-text', s.q)),
    pad.el);
  return { el, destroy() { api.key = null; } };
}
