// HOLD'EM — THE BET SLIDER (HE11 — the owner's play-test, Nov 12: the built-in range input "jumps and skips around"). A custom control
// built for a thumb: a fat track (44 pt tall, the panel's whole width) you grab ANYWHERE — the thumb jumps to the finger and follows it;
// the amount snaps to THE BET STEPS (bet-steps.js — PURE: round amounts, the minimum + ALL IN exact, ALL IN only at the very end);
// − / + either side of the amount (one stop a tap, hold = repeat, gently faster); the presets set the slider; a light tick per stop
// where the phone can (never required). The thumb + the fill move on the compositor (transform only); the track's width comes from a
// ResizeObserver (never a layout read in a frame — the track's left edge is read ONCE at the touch-down). Pointer events with
// setPointerCapture; `touch-action: none` on the slider's own parts only. Every colour a skin variable (css/holdem.css "THE BET SLIDER").
// The view builds it once per open (THE TAP WATCH — never rebuilt under a finger) and calls destroy() when it goes.
import { h, vibrate, reducedMotion } from '../../ui/dom.js';
import { betStops, valueAt, posOf, stepFrom } from './bet-steps.js';

const THUMB = 30;                // px — the thumb's size (css: .he-sl-thumb)
const HOLD_FIRST = 380, HOLD_START = 150, HOLD_MIN = 45, HOLD_EASE = 0.86;   // − / + held: the first repeat, then faster to 45 ms a stop
const TICK_GAP = 28;             // ms between two haptic ticks (a fast drag never buzzes)

/**
 * betSlider({ minTo, maxTo, sb, value, kind, presets, fmt, onValue, onConfirm, onBack }) → { el, value(), set(v), destroy() }
 * kind 'bet' | 'raise' (the wording); presets = legalActions' list ({ key, label, to, allin? }); onConfirm(to, allin).
 */
export function betSlider(o) {
  const { stops } = betStops({ minTo: o.minTo, maxTo: o.maxTo, sb: o.sb });
  const lo = stops[0], hi = stops[stops.length - 1];
  const fmt = o.fmt || (n => String(n));
  let value = Math.max(lo, Math.min(hi, Math.round(o.value || lo)));
  let width = 0, rect = null, drag = null, holdT = 0, lastTick = 0, dead = false;

  const amt = h('b.he-sl-amt');
  const sub = h('small.he-sl-sub');
  const thumb = h('i.he-sl-thumb');
  const fill = h('i.he-sl-fill');
  const track = h('div.he-sl-track', { role: 'slider', tabindex: '0', 'aria-label': o.kind === 'bet' ? 'Bet' : 'Raise to',
    'aria-valuemin': String(lo), 'aria-valuemax': String(hi) }, h('i.he-sl-rail', fill), thumb);
  const stepBtn = dir => h(`button.he-sl-step.${dir > 0 ? 'is-plus' : 'is-minus'}`, { type: 'button', 'aria-label': dir > 0 ? 'More' : 'Less' });
  const minus = stepBtn(-1), plus = stepBtn(+1);
  const chips = (o.presets || []).map(p => h('button.he-sl-pre', { type: 'button', dataset: { to: String(p.to) },
    onclick: () => set(p.allin ? hi : p.to, true) }, p.label));
  // CONFIRM is ONE-SHOT: a second tap while the move is on its way (or answered, the table not yet moved) sends nothing; a move that
  // didn't go (no signal, a refusal — onConfirm resolves falsy) re-arms it
  let sent = false;
  const confirm = h('button.he-btn.he-call.he-confirm', { type: 'button', onclick: () => {
    if (sent || !o.onConfirm) return;
    sent = true;
    Promise.resolve(o.onConfirm(value, value >= hi)).then(r => { if (!r) sent = false; }, () => { sent = false; });
  } }, h('b', 'CONFIRM'));
  const back = h('button.he-btn.he-fold.he-back-b', { type: 'button', onclick: () => o.onBack && o.onBack() }, h('b', 'BACK'));
  const el = h('div.he-slider', { dataset: { tapOwn: '' } },
    h('div.he-sl-top', minus, h('div.he-sl-read', sub, amt), plus),
    track,
    h('div.he-sl-foot', back, chips.length ? h('div.he-sl-pres', chips) : null, confirm));
  if (stops.length <= 1) { el.classList.add('is-one'); minus.disabled = plus.disabled = true; }

  // ---- paint: the words + the thumb (transform only)
  function words() {
    const all = value >= hi;
    amt.textContent = fmt(value);
    sub.textContent = all ? 'ALL IN' : o.kind === 'bet' ? 'BET' : 'RAISE TO';
    el.classList.toggle('is-allin', all);
    track.setAttribute('aria-valuenow', String(value));
    track.setAttribute('aria-valuetext', `${all ? 'all in' : o.kind === 'bet' ? 'bet' : 'raise to'} ${value}`);
    minus.disabled = stops.length <= 1 || value <= lo;
    plus.disabled = stops.length <= 1 || value >= hi;
    for (const c of chips) c.classList.toggle('is-on', Number(c.dataset.to) === value || (c.dataset.to === String(o.maxTo) && value >= hi));
  }
  function place(p) {
    if (!width) return;
    const travel = Math.max(0, width - THUMB), x = p * travel;
    thumb.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
    fill.style.transform = `scaleX(${((x + THUMB / 2) / width).toFixed(4)})`;
  }
  function set(v, settle) {
    const nv = Math.max(lo, Math.min(hi, v));
    const changed = nv !== value;
    value = nv;
    if (changed) { tick(); o.onValue && o.onValue(value); }
    words();
    if (settle !== false) place(posOf(stops, value));
    return changed;
  }
  function tick() {
    const now = performance.now();
    if (now - lastTick < TICK_GAP) return;
    lastTick = now;
    vibrate(4);
  }

  // ---- the track: grab anywhere, follow the finger, settle on the stop at the lift
  const posAt = clientX => {
    const travel = Math.max(1, (rect ? rect.width : width) - THUMB);
    const p = ((clientX - (rect ? rect.left : 0)) - THUMB / 2) / travel;
    return p < 0 ? 0 : p > 1 ? 1 : p;
  };
  // (each move applied at once: a phone sends one pointermove a frame — a rAF on top only adds a frame of lag)
  function follow(clientX) {
    if (drag == null || dead) return;
    const p = posAt(clientX);
    place(p);                                   // the thumb under the finger (smooth) …
    set(valueAt(stops, p), false);              // … the amount on its stop
  }
  track.addEventListener('pointerdown', e => {
    if (stops.length <= 1 || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    try { track.setPointerCapture(e.pointerId); } catch { /* an old engine — the moves still come while over the track */ }
    rect = track.getBoundingClientRect();       // (once per touch — never in a frame)
    drag = e.pointerId;
    el.classList.add('is-drag');
    follow(e.clientX);
  });
  track.addEventListener('pointermove', e => {
    if (drag !== e.pointerId) return;
    follow(e.clientX);
  });
  const lift = e => {
    if (drag == null || (e && e.pointerId !== drag)) return;
    if (e && e.type === 'pointerup') set(valueAt(stops, posAt(e.clientX)), false);
    drag = null; rect = null;
    el.classList.remove('is-drag');
    place(posOf(stops, value));                 // the thumb settles on its stop (a short ease — none with reduced motion)
  };
  track.addEventListener('pointerup', lift);
  track.addEventListener('pointercancel', lift);
  track.addEventListener('lostpointercapture', lift);
  track.addEventListener('keydown', e => {
    const k = e.key;
    const dir = k === 'ArrowRight' || k === 'ArrowUp' ? 1 : k === 'ArrowLeft' || k === 'ArrowDown' ? -1 : 0;
    if (dir) { e.preventDefault(); set(stepFrom(stops, value, dir)); }
    else if (k === 'Home') { e.preventDefault(); set(lo); }
    else if (k === 'End') { e.preventDefault(); set(hi); }
  });

  // ---- − / +: one stop a tap; held = repeat, gently faster (pointer events: the press starts at once; a keyboard's click = one stop)
  function hold(btn, dir) {
    let delay = HOLD_START;
    const stop = () => { clearTimeout(holdT); holdT = 0; btn.classList.remove('is-held'); };
    const again = () => {
      if (dead || !btn.isConnected) return stop();
      if (!set(stepFrom(stops, value, dir))) return stop();      // (at the end: done)
      delay = Math.max(HOLD_MIN, delay * HOLD_EASE);
      holdT = setTimeout(again, delay);
    };
    btn.addEventListener('pointerdown', e => {
      if (btn.disabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
      stop();
      btn.classList.add('is-held');
      set(stepFrom(stops, value, dir));
      holdT = setTimeout(again, HOLD_FIRST);
    });
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave', 'lostpointercapture']) btn.addEventListener(ev, stop);
    btn.addEventListener('click', e => { if (e.detail === 0) set(stepFrom(stops, value, dir)); });   // (Enter / Space — the pointer already stepped)
    btn.addEventListener('contextmenu', e => e.preventDefault());                                    // (a long press is a hold, never a menu)
  }
  hold(minus, -1);
  hold(plus, +1);

  // ---- the size: a ResizeObserver (the thumb's travel) — re-placed on any change, a rotation included
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(es => {
    if (dead) return;
    const w = es[es.length - 1].contentRect.width;
    if (w === width) return;
    width = w;
    if (drag == null) place(posOf(stops, value));
  }) : null;
  if (ro) ro.observe(track);
  else { width = 240; }

  if (reducedMotion()) el.classList.add('is-still');
  words();
  place(posOf(stops, value));

  function destroy() {
    dead = true;
    if (ro) ro.disconnect();
    clearTimeout(holdT);
  }
  return { el, value: () => value, set: v => set(v), stops, destroy };
}
