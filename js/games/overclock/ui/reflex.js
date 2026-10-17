// OVERCLOCK — SIGNAL LOCK: tap the moment the pad flashes (reaction time).
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game() — see view.js.
import { h } from '../../../ui/dom.js';
import { sfx } from '../../../audio/sfx.js';
import { REFLEX_TIMEOUT_MS, reflexCredit } from '../challenges.js';
import { fastButton } from '../shared.js';

export default function uiReflex(s, api) {
  const { chal } = api;
  const label = h('div.rx-label', 'GET READY');
  const sub = h('div.rx-sub', `ROUND ${chal.p + 1}/${s.parts}`);
  const pad = fastButton('button.rx-pad', { 'aria-label': 'Reaction pad' }, e => tap(e), label, sub);
  const log = h('div.rx-log', Array.from({ length: s.parts }, (_, i) => h('span.rx-chip', { class: i < chal.p ? 'is-done' : null }, i < chal.p ? '✓' : '—')));
  let mode = 'idle';
  let goAt = 0;
  let timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const startRound = () => {
    if (chal.done || chal.p >= s.parts) return;
    mode = 'wait';
    pad.className = 'rx-pad is-wait';
    label.textContent = 'WAIT…';
    sub.textContent = `ROUND ${chal.p + 1}/${s.parts}`;
    later(go, s.delays[chal.p]);
  };
  const go = () => {
    mode = 'go';
    goAt = performance.now();
    pad.className = 'rx-pad is-go';
    label.textContent = 'TAP!';
    sfx('select');
    // time from the frame the flash actually paints
    requestAnimationFrame(() => { if (mode === 'go') goAt = performance.now(); });
    later(() => { if (mode === 'go') record(null, 'TOO SLOW'); }, REFLEX_TIMEOUT_MS);
  };
  const tap = e => {
    if (mode === 'wait') record(null, 'TOO EARLY');
    else if (mode === 'go') record(Math.max(0, (e && e.timeStamp ? e.timeStamp : performance.now()) - goAt));
  };
  const record = (ms, why) => {
    mode = 'shown';
    timers.forEach(clearTimeout);
    timers = [];
    const i = chal.p;
    chal.times[i] = ms;
    pad.className = `rx-pad ${ms == null ? 'is-miss' : 'is-hit'}`;
    label.textContent = ms == null ? why : `${Math.round(ms)} ms`;
    const chip = log.children[i];
    if (chip) { chip.textContent = ms == null ? '✕' : String(Math.round(ms)); chip.className = `rx-chip ${ms == null ? 'is-miss' : 'is-hit'}`; }
    api.part(ms == null ? 0 : reflexCredit(ms));
    if (!chal.done) later(startRound, 950);
  };
  later(startRound, 900);
  api.key = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); tap(e); } };
  return { el: h('div.ch.ch-reflex', h('div.ch-prompt', 'TAP THE MOMENT IT FLASHES'), pad, log), destroy() { timers.forEach(clearTimeout); api.key = null; } };
}
