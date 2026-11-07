// OVERCLOCK — SIGNAL LOCK: tap the moment the screen flashes (reaction time). OC4 — THE OVERDRIVE LOOK (docs/overclock.md "Challenge looks"):
//   THE WAIT = a dim, tense screen (the pad dark, a slow pulse in its rim — opacity only, "WAIT…"); on GO the WHOLE SCREEN FLASHES WHITE-HOT
//   ORANGE with a giant "TAP!" (a pre-rendered full-screen layer, at full brightness on the GO frame — no fade-in: your time is fair); an early
//   tap = a red slanted EARLY stamp (a miss — the owner's rule, unchanged); each round's time as a slanted chip, your best one lit.
//   Timings unchanged: the first round 900 ms in, the seeded waits (s.delays), TOO SLOW after REFLEX_TIMEOUT_MS, the next round 950 ms after.
//   Your time is measured from the frame the flash paints (as before).
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game(), fx(), pick(), sfx() — view.js.
import { h } from '../../../ui/dom.js';
import { REFLEX_TIMEOUT_MS, reflexCredit } from '../challenges.js';
import { fastButton } from '../shared.js';

export const RX_FIRST_MS = 900, RX_NEXT_MS = 950;   // (unchanged)

export default function uiReflex(s, api) {
  const { chal } = api;
  const label = h('b.oc-rx-label', 'GET READY');
  const sub = h('span.oc-rx-sub', `ROUND ${chal.p + 1} / ${s.parts}`);
  const stamp = h('span.oc-rx-stamp', { 'aria-hidden': 'true' }, h('b', 'EARLY'));
  const flash = h('i.oc-rx-flash', { 'aria-hidden': 'true' }, h('b', 'TAP!'));
  const pad = fastButton('button.oc-rx-pad', { 'aria-label': 'Reaction pad' }, e => tap(e), h('i.oc-rx-glass'), h('i.oc-rx-pulse'), label, sub, stamp);
  const chips = Array.from({ length: s.parts }, (_, i) => h('span.oc-rx-chip', { class: i < chal.p ? 'is-done' : null }, h('b', i < chal.p ? '✓' : '—')));
  const log = h('div.oc-rx-log', chips);
  const wrap = h('div.ch.oc-rx', h('div.oc-qhead', h('span.oc-chip', 'SIGNAL LOCK'), h('span.oc-qn', 'TOO EARLY = A MISS')), h('p.oc-q.oc-rx-q', 'TAP THE MOMENT IT FLASHES'), pad, log, flash);
  let mode = 'idle';
  let goAt = 0;
  let timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const setMode = m => { mode = m; wrap.dataset.mode = m; };
  const paintBest = () => {
    const hits = chal.times.map((t, i) => [t, i]).filter(([t]) => t != null);
    const best = hits.length ? hits.reduce((a, b) => (b[0] < a[0] ? b : a))[1] : -1;
    chips.forEach((c, i) => c.classList.toggle('is-best', i === best));
  };
  const startRound = () => {
    if (chal.done || chal.p >= s.parts) return;
    setMode('wait');
    label.textContent = 'WAIT…';
    sub.textContent = `ROUND ${chal.p + 1} / ${s.parts}`;
    chips.forEach((c, i) => c.classList.toggle('is-cur', i === chal.p));
    later(go, s.delays[chal.p]);
  };
  const go = () => {
    setMode('go');
    goAt = performance.now();
    label.textContent = 'TAP!';
    if (api.sfx) api.sfx('flash');   // (OC8 — A9: never the console's synth beside the Overclock set)
    // time from the frame the flash actually paints
    requestAnimationFrame(() => { if (mode === 'go') goAt = performance.now(); });
    later(() => { if (mode === 'go') record(null, 'TOO SLOW'); }, REFLEX_TIMEOUT_MS);
  };
  const tap = e => {
    if (mode === 'wait') record(null, 'TOO EARLY');
    else if (mode === 'go') record(Math.max(0, (e && e.timeStamp ? e.timeStamp : performance.now()) - goAt));
  };
  const record = (ms, why) => {
    setMode(ms == null ? (why === 'TOO EARLY' ? 'early' : 'slow') : 'hit');
    timers.forEach(clearTimeout);
    timers = [];
    const i = chal.p;
    chal.times[i] = ms;
    if (api.pick) api.pick(i, ms == null ? null : Math.round(ms));   // (OC2 — THE ANSWER: your times survive a refresh)
    label.textContent = ms == null ? (why === 'TOO EARLY' ? '' : why) : `${Math.round(ms)}`;   // (EARLY: the stamp says it)
    sub.textContent = ms == null ? (why === 'TOO EARLY' ? 'A MISS · WAIT FOR THE FLASH' : 'A MISS') : 'MS';
    const chip = chips[i];
    if (chip) { chip.replaceChildren(h('b', ms == null ? '✕' : String(Math.round(ms)))); chip.className = `oc-rx-chip ${ms == null ? 'is-miss' : 'is-hit'}`; }
    paintBest();
    api.part(ms == null ? 0 : reflexCredit(ms));
    if (!chal.done) later(startRound, RX_NEXT_MS);
  };
  // on GO the flash covers the whole screen — a tap ANYWHERE on it counts (the pad under it can't be reached)
  flash.addEventListener('pointerdown', e => { if (mode === 'go') { e.preventDefault(); tap(e); } });
  setMode('idle');
  later(startRound, RX_FIRST_MS);
  api.key = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); tap(e); } };
  return { el: wrap, destroy() { timers.forEach(clearTimeout); api.key = null; } };
}
