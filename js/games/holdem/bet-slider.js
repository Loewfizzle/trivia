// HOLD'EM — THE BET SLIDER (HE11 — the owner's play-test, Nov 12: the built-in range input "jumps and skips around"). A custom control
// built for a thumb: a fat track (44 pt tall, the panel's whole width) you grab ANYWHERE — the thumb jumps to the finger and follows it;
// the amount snaps to THE BET STEPS (bet-steps.js — PURE: round amounts, the minimum + ALL IN exact, ALL IN only at the very end);
// − / + either side of the amount (one stop a tap, hold = repeat, gently faster); the presets set the slider; a light tick per stop
// where the phone can (never required). The thumb + the fill move on the compositor (transform only); the track's width comes from a
// ResizeObserver (never a layout read in a frame — the track's left edge is read ONCE at the touch-down). Pointer events with
// setPointerCapture; `touch-action: none` on the slider's own parts only. Every colour a skin variable (css/holdem.css "THE BET SLIDER").
// The view builds it once per open (THE TAP WATCH — never rebuilt under a finger) and calls destroy() when it goes.
// THE HARDENING (Nov 13 — the slider's review): THE ONE POINTER — one finger owns the slider at a time (a drag or a held − / +; its
// pointerId — bet-steps.js#pointerMay): a second finger never moves the thumb or doubles a step. A held − / + captures its pointer and
// stops on pointerup / pointercancel / lostpointercapture, the window's blur and the page going hidden (a call, the lock button) — the
// listeners for a hold live only as long as the hold. THE CONFIRM LOCK (bet-steps.js#confirmLock): CONFIRM locks the whole panel until
// the table answers — never a double bet, nothing moves in flight; a refusal / no signal opens it at once, a yes the table never showed
// after LOCK_GRACE_MS, silence after LOCK_MAX_MS (the view's SAFE_RELEASE_MS) — it can never stick.
import { h, vibrate, reducedMotion } from '../../ui/dom.js';
import { betStops, valueAt, posOf, stepFrom, confirmLock, pointerMay, LOCK_OPEN, LOCK_GRACE_MS, LOCK_MAX_MS } from './bet-steps.js';

const THUMB = 30;                // px — the thumb's size (css: .he-sl-thumb)
const HOLD_FIRST = 380, HOLD_START = 150, HOLD_MIN = 45, HOLD_EASE = 0.86;   // − / + held: the first repeat, then faster to 45 ms a stop
const TICK_GAP = 28;             // ms between two haptic ticks (a fast drag never buzzes)
const HOLD_ENDS = ['pointerup', 'pointercancel', 'lostpointercapture', 'pointerleave'];   // (pointerleave: only where capture failed)

/**
 * betSlider({ minTo, maxTo, sb, value, kind, presets, fmt, onValue, onConfirm, onBack, lockMaxMs }) → { el, value(), set(v), locked(), destroy() }
 * kind 'bet' | 'raise' (the wording); presets = legalActions' list ({ key, label, to, allin? }); onConfirm(to, allin) → a promise of the
 * dealer's answer (falsy = refused / never went: the lock opens).
 */
export function betSlider(o) {
  const { stops } = betStops({ minTo: o.minTo, maxTo: o.maxTo, sb: o.sb });
  const lo = stops[0], hi = stops[stops.length - 1];
  const fmt = o.fmt || (n => String(n));
  let value = Math.max(lo, Math.min(hi, Math.round(o.value || lo)));
  let width = 0, rect = null, drag = null, holdT = 0, lastTick = 0, dead = false;
  // THE ONE POINTER: { id, end } — the finger that owns the slider (a drag / a held − +); end() lets it go (a blur, the page hidden, CONFIRM)
  let owner = null;
  const win = typeof window !== 'undefined' ? window : null, doc = typeof document !== 'undefined' ? document : null;
  const dropOwner = () => { if (owner) owner.end(); };
  const onHidden = () => { if (doc && doc.hidden) dropOwner(); };
  function claim(id, end) {
    owner = { id, end };
    if (win) win.addEventListener('blur', dropOwner);
    if (doc) doc.addEventListener('visibilitychange', onHidden);
  }
  function letGo(id) {
    if (!owner || owner.id !== id) return;
    owner = null;
    if (win) win.removeEventListener('blur', dropOwner);
    if (doc) doc.removeEventListener('visibilitychange', onHidden);
  }
  const busyFor = id => !pointerMay(owner ? owner.id : null, id);
  // THE CONFIRM LOCK (bet-steps.js#confirmLock)
  let gate = LOCK_OPEN, graceT = 0, capT = 0;
  const locked = () => gate.lock !== 'open';

  const amt = h('b.he-sl-amt');
  const sub = h('small.he-sl-sub');
  const thumb = h('i.he-sl-thumb');
  const fill = h('i.he-sl-fill');
  const track = h('div.he-sl-track', { role: 'slider', tabindex: '0', 'aria-label': o.kind === 'bet' ? 'Bet' : 'Raise to',
    'aria-valuemin': String(lo), 'aria-valuemax': String(hi) }, h('i.he-sl-rail', fill), thumb);
  const stepBtn = dir => h(`button.he-sl-step.${dir > 0 ? 'is-plus' : 'is-minus'}`, { type: 'button', 'aria-label': dir > 0 ? 'More' : 'Less' });
  const minus = stepBtn(-1), plus = stepBtn(+1);
  const chips = (o.presets || []).map(p => h('button.he-sl-pre', { type: 'button', dataset: { to: String(p.to) },
    onclick: () => { if (!dead && !locked() && !owner) set(p.allin ? hi : p.to, true); } }, p.label));
  // CONFIRM is ONE-SHOT + LOCKS THE PANEL: a second tap while the move is on its way (or answered, the table not yet moved) sends nothing,
  // nothing on the panel moves; a move that didn't go (no signal, a refusal — onConfirm resolves falsy) opens it again
  const confirm = h('button.he-btn.he-call.he-confirm', { type: 'button', onclick: () => {
    if (dead || !o.onConfirm) return;
    if (!feed({ type: 'tap' }).send) return;
    const n = gate.n;
    dropOwner();                                  // (a finger still on the track / a held − + lets go — the amount sent is the one shown)
    capT = setTimeout(() => feed({ type: 'timeout', n }), o.lockMaxMs || LOCK_MAX_MS);
    let answer;
    try { answer = Promise.resolve(o.onConfirm(value, value >= hi)); } catch (e) { answer = Promise.reject(e); }
    answer.then(r => {
      if (dead) return;
      if (!r) { feed({ type: 'fail', n }); return; }
      feed({ type: 'ok', n });
      if (gate.lock === 'answered' && gate.n === n) { clearTimeout(graceT); graceT = setTimeout(() => feed({ type: 'timeout', n }), LOCK_GRACE_MS); }
    }, () => { if (!dead) feed({ type: 'fail', n }); });
  } }, h('b', 'CONFIRM'));
  const back = h('button.he-btn.he-fold.he-back-b', { type: 'button', onclick: () => { if (!dead && !locked() && o.onBack) o.onBack(); } }, h('b', 'BACK'));
  const el = h('div.he-slider', { dataset: { tapOwn: '' } },
    h('div.he-sl-top', minus, h('div.he-sl-read', sub, amt), plus),
    track,
    h('div.he-sl-foot', back, chips.length ? h('div.he-sl-pres', chips) : null, confirm));
  if (stops.length <= 1) { el.classList.add('is-one'); minus.disabled = plus.disabled = true; }

  // the lock's one door: every change goes through the pure gate; the panel says it (is-locked + aria — no look of its own: the
  // action row's is-busy + CONFIRM's pressed glow already show the move on its way); open = the timers cleared
  function feed(ev) {
    const was = locked();
    const r = confirmLock(gate, ev);
    gate = r.gate;
    const now = locked();
    if (was !== now) {
      el.classList.toggle('is-locked', now);
      el.setAttribute('aria-busy', String(now));
      confirm.setAttribute('aria-disabled', String(now));
    }
    if (!now) { clearTimeout(graceT); clearTimeout(capT); graceT = capT = 0; }
    return r;
  }

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
    if (drag == null || dead || locked()) return;
    const p = posAt(clientX);
    place(p);                                   // the thumb under the finger (smooth) …
    set(valueAt(stops, p), false);              // … the amount on its stop
  }
  track.addEventListener('pointerdown', e => {
    if (stops.length <= 1 || dead || locked() || busyFor(e.pointerId) || drag != null || (e.pointerType === 'mouse' && e.button !== 0)) return;   // (THE ONE POINTER)
    e.preventDefault();
    try { track.setPointerCapture(e.pointerId); } catch { /* an old engine — the moves still come while over the track */ }
    rect = track.getBoundingClientRect();       // (once per touch — never in a frame)
    drag = e.pointerId;
    claim(drag, () => lift(null));
    el.classList.add('is-drag');
    follow(e.clientX);
  });
  track.addEventListener('pointermove', e => {
    if (drag !== e.pointerId) return;           // (a second finger's moves: never the thumb)
    follow(e.clientX);
  });
  // the lift: the finger's own pointerup / cancel / lost capture — or null: the slider let go of it (a blur, the page hidden, CONFIRM)
  function lift(e) {
    if (drag == null || (e && e.pointerId !== drag)) return;
    const id = drag;
    if (e && e.type === 'pointerup' && !locked()) set(valueAt(stops, posAt(e.clientX)), false);
    drag = null; rect = null;
    letGo(id);
    if (!e) { try { if (track.hasPointerCapture && track.hasPointerCapture(id)) track.releasePointerCapture(id); } catch { /* gone */ } }
    el.classList.remove('is-drag');
    place(posOf(stops, value));                 // the thumb settles on its stop (a short ease — none with reduced motion)
  }
  track.addEventListener('pointerup', lift);
  track.addEventListener('pointercancel', lift);
  track.addEventListener('lostpointercapture', lift);
  track.addEventListener('keydown', e => {
    if (dead || locked()) { if (e.key.startsWith('Arrow') || e.key === 'Home' || e.key === 'End') e.preventDefault(); return; }
    const k = e.key;
    const dir = k === 'ArrowRight' || k === 'ArrowUp' ? 1 : k === 'ArrowLeft' || k === 'ArrowDown' ? -1 : 0;
    if (dir) { e.preventDefault(); set(stepFrom(stops, value, dir)); }
    else if (k === 'Home') { e.preventDefault(); set(lo); }
    else if (k === 'End') { e.preventDefault(); set(hi); }
  });

  // ---- − / +: one stop a tap; held = repeat, gently faster (pointer events: the press starts at once; a keyboard's click = one stop).
  //      The press CAPTURES its pointer and owns the slider (THE ONE POINTER); it ends on its own pointer's up / cancel / lost capture,
  //      the window's blur, the page hidden, CONFIRM, the end of the track — and every listener it added goes with it.
  function hold(btn, dir) {
    let delay = HOLD_START, pid = null;
    const onEnd = e => { if (pid != null && e.pointerId === pid) stop(); };
    function stop() {
      if (pid == null) return;
      const id = pid;
      pid = null;
      clearTimeout(holdT); holdT = 0;
      btn.classList.remove('is-held');
      for (const ev of HOLD_ENDS) btn.removeEventListener(ev, onEnd);
      try { if (btn.hasPointerCapture && btn.hasPointerCapture(id)) btn.releasePointerCapture(id); } catch { /* gone */ }
      letGo(id);
    }
    const again = () => {
      holdT = 0;
      if (pid == null) return;
      if (dead || locked() || !btn.isConnected) return stop();
      if (!set(stepFrom(stops, value, dir))) return stop();      // (at the end: done)
      delay = Math.max(HOLD_MIN, delay * HOLD_EASE);
      holdT = setTimeout(again, delay);
    };
    btn.addEventListener('pointerdown', e => {
      if (btn.disabled || dead || locked() || owner || (e.pointerType === 'mouse' && e.button !== 0)) return;   // (THE ONE POINTER: a second finger does nothing)
      pid = e.pointerId;
      delay = HOLD_START;
      try { btn.setPointerCapture(pid); } catch { /* an old engine — pointerleave ends it instead */ }
      claim(pid, stop);
      for (const ev of HOLD_ENDS) btn.addEventListener(ev, onEnd);
      btn.classList.add('is-held');
      set(stepFrom(stops, value, dir));
      holdT = setTimeout(again, HOLD_FIRST);
    });
    btn.addEventListener('click', e => { if (e.detail === 0 && !dead && !locked() && !owner) set(stepFrom(stops, value, dir)); });   // (Enter / Space — the pointer already stepped)
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
    dropOwner();                                  // (a hold / a drag lets go — its window + document listeners removed)
    dead = true;
    if (ro) ro.disconnect();
    clearTimeout(holdT); clearTimeout(graceT); clearTimeout(capT);
  }
  return { el, value: () => value, set: v => (dead || locked() ? false : set(v)), locked, stops, destroy };
}
