// PULSE calibration: "tap along with the beat". 4 count-in clicks, then 10 to tap with; the median
// offset (tap heard-time − click heard-time) is this device's correction: Bluetooth / TV latency the
// browser doesn't report, plus touch latency. Saved per device; reachable from the settings sheet.
import { h } from '../../ui/dom.js';
import { getContext, isUnlocked } from '../../audio/engine.js';
import { heard, tone, saveCalibration, loadCalibration } from './clock.js';
import { sfx } from '../../audio/sfx.js';

const BPM = 100;
let open = 0;
/** True while the calibration overlay is up (the highway pauses so the beat display never stutters). */
export const isCalibrating = () => open > 0;
const COUNT_IN = 4;
const TAPS = 10;

export function openCalibration({ onDone, reason = '' } = {}) {
  const spb = 60 / BPM;
  const prev = loadCalibration();
  let clicks = [];
  let offsets = [];
  let raf = 0;
  let running = false;
  let endTimer = 0;

  const ring = h('div.pcal-ring', h('i'), h('b'));
  const label = h('div.pcal-label', 'READY');
  const dots = h('div.pcal-dots', Array.from({ length: TAPS }, () => h('i')));
  const info = h('p.pcal-info', 'Tap anywhere on the screen exactly on each beat. Use the speakers or headphones you’ll play with.');
  const startBtn = h('button.btn.btn-primary.btn-block', { type: 'button', onclick: e => { e.stopPropagation(); begin(); } }, h('span', 'START'));
  const doneBtn = h('button.btn.btn-ghost.btn-block', { type: 'button', onclick: e => { e.stopPropagation(); finish(null); } }, h('span', prev ? 'KEEP CURRENT' : 'SKIP FOR NOW'));
  const actions = h('div.pcal-actions', startBtn, doneBtn);
  const pad = h('div.pcal-pad', { onpointerdown: e => onTap(e) }, ring, label, dots);
  const el = h('div.pcal', { role: 'dialog', 'aria-label': 'Audio calibration', 'data-theme': 'pulse' },
    h('div.pcal-card',
      h('div.pcal-kicker', reason || 'PULSE · ONE-TIME SETUP'),
      h('h2.pcal-title', 'SYNC YOUR AUDIO'),
      info, pad, actions));
  document.body.append(el);
  open++;
  requestAnimationFrame(() => el.classList.add('is-in'));

  function begin() {
    const ctx = getContext();
    if (!ctx || !isUnlocked()) { info.textContent = 'Sound is still locked — tap START again.'; ctx && ctx.resume && ctx.resume(); return; }
    clearTimeout(endTimer);
    cancelAnimationFrame(raf);
    offsets = [];
    [...dots.children].forEach(d => { d.className = ''; d.style.transform = ''; });
    running = true;
    el.classList.add('is-running');
    el.classList.remove('is-result');
    actions.hidden = true;
    info.textContent = 'Listen for four clicks, then tap along with the next ten.';
    const t0 = heard() + 0.7;
    clicks = Array.from({ length: COUNT_IN + TAPS }, (_, k) => t0 + k * spb);
    clicks.forEach((c, k) => tone(c, { freq: k < COUNT_IN ? 1320 : 880, dur: 0.06, gain: 0.5, type: 'triangle' }));
    let shown = -1;
    const loop = () => {
      const now = heard();
      const k = clicks.findIndex(c => c > now) - 1;
      if (k !== shown && k >= 0) {
        shown = k;
        ring.classList.remove('beat'); void ring.offsetWidth; ring.classList.add('beat');
        label.textContent = k < COUNT_IN ? String(COUNT_IN - k) : 'TAP';
      }
      if (now < clicks.at(-1) + 0.6) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    endTimer = setTimeout(result, (clicks.at(-1) - heard() + 0.7) * 1000);
  }

  function onTap(e) {
    if (!running) return;
    e.preventDefault();
    const t = heard(e.timeStamp);
    let best = -1;
    for (let k = COUNT_IN; k < clicks.length; k++) if (best < 0 || Math.abs(t - clicks[k]) < Math.abs(t - clicks[best])) best = k;
    if (best < 0 || Math.abs(t - clicks[best]) > 0.3) return;
    const off = t - clicks[best];
    offsets.push(off);
    if (/[?&]emu\b/.test(location.search)) window.__pcal = { offsets: [...offsets], clicks: clicks.length }; // test hook (emulator runs only)
    const dot = dots.children[Math.min(TAPS - 1, offsets.length - 1)];
    dot.className = Math.abs(off) < 0.05 ? 'is-good' : 'is-off';
    dot.style.transform = `translateY(${Math.max(-14, Math.min(14, -off * 120))}px)`;
    ring.classList.remove('tap'); void ring.offsetWidth; ring.classList.add('tap');
  }

  function result() {
    running = false;
    cancelAnimationFrame(raf);
    el.classList.remove('is-running');
    el.classList.add('is-result');
    actions.hidden = false;
    if (offsets.length < 6) {
      label.textContent = '—';
      info.textContent = `Only ${offsets.length} taps landed near a beat. Try again — tap with the clicks.`;
      startBtn.firstChild.textContent = 'TRY AGAIN';
      return;
    }
    const sorted = [...offsets].sort((a, b) => a - b);
    const med = sorted[sorted.length >> 1];
    const mad = [...offsets.map(o => Math.abs(o - med))].sort((a, b) => a - b)[offsets.length >> 1];
    if (mad > 0.07) {
      label.textContent = '?';
      info.textContent = 'Those taps were all over the place. One more try — keep a steady rhythm.';
      startBtn.firstChild.textContent = 'TRY AGAIN';
      return;
    }
    const ms = Math.round(med * 1000);
    saveCalibration(ms);
    sfx('lock');
    label.textContent = `${ms > 0 ? '+' : ''}${ms} ms`;
    info.textContent = Math.abs(ms) < 25
      ? 'Your audio is right on time. All set.'
      : `Your setup hears the beat ${Math.abs(ms)} ms ${ms > 0 ? 'late' : 'early'} — PULSE now corrects for it.`;
    startBtn.firstChild.textContent = 'REDO';
    doneBtn.firstChild.textContent = 'DONE';
    doneBtn.onclick = ev => { ev.stopPropagation(); finish(ms); };
  }

  let finished = false;
  function finish(ms) {
    if (finished) return;
    finished = true;
    open = Math.max(0, open - 1);
    clearTimeout(endTimer);
    cancelAnimationFrame(raf);
    el.classList.remove('is-in');
    setTimeout(() => el.remove(), 260);
    onDone && onDone(ms);
  }

  return { close: () => finish(null) };
}
