// THE TAP WATCH (CITY FIXES + HOLD'EM, Nov 8 → CITY A item 5): the watch · the rescue · afterTap · EVERY TAP ACTS (data-press). Its full header
// lives in docs/title.md "THE TAP WATCH — the header (moved, CITY H1)", verbatim (out of the boot bytes). Polish: anything failing here never touches the app.

const TAPPABLE = 'button, a[href], [role="button"], [role="tab"], [role="switch"], [role="menuitem"], [role="option"], label, summary, input[type="checkbox"], input[type="radio"], .sh-row, [data-tap]';
export const RESCUE_MS = 350;
const HOLD_MS = 450;
const LONG_MS = 700;           // a press longer than this is a long-press, not a tap
const SLOP = 10;               // px the finger may travel and still be a tap
const MOVE_PX = 6;             // the target moved under the finger (a layout shift)
const MIN_GAP_MS = 60_000, DAY_MAX = 20;
export const PRESS_MS = 600, PRESS_SLOP = 10, TOOK_SWALLOW_MS = 800, SETTLE_MS = 350;   // (4. EVERY TAP ACTS)
// (the add-on, Nov 14 7:56 pm — a LOST TAP on the profile's "CUSTOMIZE YOUR CARD": held 113 ms, 0 px, the tube MOVED 6 px under the finger) — the
// press + lift ALSO on every full-width tube (.btn.btn-block — a layout shift nudges those) and every .btn inside a screen that says so
// (`data-press-all` — the profile screen), with no attribute on each. NOT on a control that needs Safari's OWN gesture — a share sheet, the
// clipboard, a passkey, a notification prompt, a form's submit (the password keychain): `data-gesture` (or data-act copy / share) keeps its click.
// (CITY B's add-on — a LOST TAP on the profile's BACK: + every icon button + the two corner buttons — ☰ and the music note)
export const PRESS_IMPLICIT = '.btn.btn-block, [data-press-all] .btn, .icon-btn, .menu-btn, .music-btn';
// (+ a control with its OWN pointer-up path — the dock's pressTap — never twice; the implicit rule is off while a GAME runs: a game's buttons
//  keep their own pointer events — only an explicit data-press acts there)
export const PRESS_NEVER = '[data-gesture], [data-act="copy"], [data-act="share"], [type="submit"], [data-press-tap], [data-tap-own], [data-tap-own] *';
// CITY D — the add-on (Nov 15 10:43 am — a LOST TAP on SAVE YOUR KEY → SHARE, iOS sent no click; the rescue's synthetic click can't open a share
// sheet — the key most likely never saved): a control that needs Safari's OWN gesture (a share sheet, the clipboard, a passkey) acts INSIDE THE
// TOUCH's own lift — a pointerup (not a mouse's) is a user activation, and its click() runs inside that dispatch — the browser's late click
// swallowed after; THE RESCUE never clicks one (it would always fail) — it is logged instead. A form's submit keeps its real click (the keychain).
export const GESTURE_OWN = '[data-gesture], [data-act="copy"], [data-act="share"]';
/** every control a press may act on (THE REVIEW A13 — the twin lookup at the lift) */
export const TWIN_SEL = `[data-press], ${PRESS_IMPLICIT}, ${GESTURE_OWN}`;
/** PURE: does a press on `el` (a pointer of `type`) act at its lift as a gesture control? (a mouse's click carries the gesture itself) */
export function gestureControl(el, type = 'touch') {
  try { return !!(el && el.matches && type !== 'mouse' && el.matches(GESTURE_OWN) && !el.matches('[type="submit"], [data-press-tap], [data-tap-own], [data-tap-own] *')) ? el : null; } catch { return null; }
}
// THE GARDEN PARTY PASS — THE FIELD IN A LABEL (the owner's LOST TAP, Nov 21 10:23 am: label.nd-codebox — iOS sent no click, the rescue's late click
// focused the field WITHOUT the keyboard): a touch on a <label> wrapping a text field focuses it IN THE GESTURE — on the press for a label that
// says so (data-focus-press — the join-code box), on every clean lift (a pointerup is a user activation: iOS opens the keyboard) — handled, never rescued
const TEXTY = /^(text|search|tel|url|email|password|number|date|time|datetime-local|month|week)$/;
/** the text field a <label> wraps (label.control — never a checkbox / radio / range: their click does its own job), or null */
export function labelField(el) {
  try { if (!el || el.tagName !== 'LABEL') return null; const c = el.control; if (!c || c.disabled || c.readOnly) return null; return c.tagName === 'TEXTAREA' || (c.tagName === 'INPUT' && TEXTY.test(c.type || 'text')) ? c : null; } catch { return null; }
}
const focusField = f => { try { if (document.activeElement !== f) f.focus(); return document.activeElement === f; } catch { return false; } };
/** the control a press acts on (the element itself), or null */
export function pressControl(el, game = false) {
  try {
    if (!el || !el.matches) return null;
    if (el.matches(PRESS_NEVER)) return null;
    return el.matches('[data-press]') || (!game && el.matches(PRESS_IMPLICIT)) ? el : null;
  } catch { return null; }
}
const LS_KEY = 'nd:tapwatch';

let ctxFn = null;
/** the city (or anything heavy) says what it is doing: () => ({ frameMs, bake, … }) — read only when a tap is lost */
export function setTapContext(fn) { ctxFn = fn; }

let press = null;              // the finger on a tappable now: { id, el, sig, x, y, t, rect, … }
const waiting = new Set();     // afterTap's queue
let rescued = null;            // { el, sig, at } — a late real click on it is swallowed
const longTasks = [];          // [{ t, d }] (Chromium only — Safari doesn't count them)
let installed = false, sentMem = null, rescueOn = true;
let lastDown = '';   // (tests: which control the last touch pressed)
const stats = { downs: 0, lost: 0, rescues: 0, swallowed: 0, deferred: 0, reports: 0, pressed: 0, tookSwallowed: 0, unsettled: 0, stoppers: 0 };
let lastReport = '';

/** PURE: a short, safe description of an element: tag.class1.class2 "LABEL" (the label ≤ 24 chars, letters only — never a name / code) */
export function describe(el) {
  if (!el || el.nodeType !== 1) return '(none)';
  const cls = [...(el.classList || [])].filter(c => !/^is-|^js-/.test(c)).slice(0, 3).join('.');
  const raw = (el.getAttribute && (el.getAttribute('aria-label') || '')) || (el.textContent || '');
  const label = String(raw).replace(/\s+/g, ' ').trim().slice(0, 24).replace(/[^A-Za-z ·’'—-]/g, '').trim();
  return `${el.tagName.toLowerCase()}${cls ? `.${cls}` : ''}${label ? ` "${label}"` : ''}`;
}
/** PURE-ish: the signature two copies of the same control share (a re-render's replacement) */
export const sigOf = el => (el && el.nodeType === 1 ? `${el.tagName}|${el.className}|${(el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60)}` : '');

/** PURE: the rate limit on this device → { ok, mem } (mem: { d: 'YYYY-MM-DD', n, last }) */
export function mayReport(mem, now) {
  const d = new Date(now).toISOString().slice(0, 10);
  const m = mem && mem.d === d ? mem : { d, n: 0, last: 0 };
  if (m.n >= DAY_MAX || now - (m.last || 0) < MIN_GAP_MS) return { ok: false, mem: m };
  return { ok: true, mem: { d, n: m.n + 1, last: now } };
}

/** PURE: was this press a clean TAP the page should have answered? (the rules the rescue + the report share) */
/** PURE (4. EVERY TAP ACTS): does a data-press control act on this lift? p: { type, dur, travel, cancelled, settled, disabled } */
export function pressActs(p) {
  if (!p || p.type === 'mouse' || p.cancelled || p.disabled || p.settled === false || p.stopper) return false;
  return p.dur >= 0 && p.dur <= PRESS_MS && p.travel < PRESS_SLOP;
}
/** PURE: is this trusted click the tail of a tap a data-press control already took? (near the lift point, inside 800 ms) */
export function tookClick(took, c) {
  if (!took || !c) return false;
  return c.at - took.at >= 0 && c.at - took.at < TOOK_SWALLOW_MS && Math.abs(c.x - took.x) < 24 && Math.abs(c.y - took.y) < 24;
}
/** PURE: a pop-up born at `born` (performance.now) — has it SETTLED at `t`? (no data-born = always settled) */
export const settledAt = (born, t) => !(born > 0) || t - born >= SETTLE_MS;
const bornOf = el => { try { const b = el && el.closest && el.closest('[data-born]'); return b ? Number(b.dataset.born) || 0 : 0; } catch { return 0; } };
let took = null;   // { el, x, y, at } — the last tap a data-press control acted on
// FIXES R2 — THE REVIEW A8 (+ the owner's SCORES add-on): A TOUCH THAT ONLY STOPS A SCROLLING LIST never acts. A press is a STOPPER when the
// list it sits in (or the page) scrolled within SCROLL_STOP_MS AND a finger DRAG (a pointer the browser cancelled for a scroll, or one that
// travelled past the slop) ended within DRAG_MS — a fling's momentum, never a programmatic scroll. A stopper: no press-act, no rescue, and its
// click (if the browser sends one) swallowed.
export const SCROLL_STOP_MS = 120, DRAG_MS = 3000;
let lastScroll = -1e9, scrollEl = null, lastDrag = -1e9, stopper = null;   // stopper: { x, y, at } — the last stopping touch's lift
let drag = null;   // the pointer being tracked for "was it a drag": { id, x, y, far }
/** PURE: did this press begin while a list a finger flung was still moving? (the press's time, the last scroll's, the last drag's end) */
export const stopsScroll = (downAt, scrollAt, dragAt) => downAt - scrollAt >= 0 && downAt - scrollAt < SCROLL_STOP_MS && downAt - dragAt >= 0 && downAt - dragAt < DRAG_MS;
const onScroll = e => { lastScroll = performance.now(); scrollEl = e && e.target; };
const scrolledHolds = el => { const t = scrollEl; if (!t || !el) return false; if (t === document || t === document.documentElement || t === document.body || t === document.scrollingElement) return true; return !!(t.contains && t.contains(el)); };
const trackDown = e => { if (e.pointerType !== 'mouse' && e.isPrimary !== false) drag = { id: e.pointerId, x: e.clientX, y: e.clientY, far: false }; };
const trackMove = e => { if (drag && e.pointerId === drag.id && !drag.far && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) >= PRESS_SLOP) drag.far = true; };
const trackEnd = e => { if (drag && e.pointerId === drag.id) { if (e.type === 'pointercancel' || drag.far) lastDrag = performance.now(); drag = null; } };

export function cleanTap(p) {
  if (!p) return false;
  if (p.cancelled || p.prevented || p.own || p.game || p.stopper) return false;
  if (p.dur > LONG_MS || p.travel > SLOP) return false;
  return p.sameAtUp !== false;
}

function tappableOf(t) {
  if (!t || t.nodeType !== 1) t = t && t.parentElement;
  if (!t || !t.closest) return null;
  const el = t.closest(TAPPABLE);
  if (el) return el;
  // anything else that says it's tappable (a div with a click handler wears cursor: pointer) — six steps up at most, once per tap
  let n = t;
  for (let i = 0; n && i < 6 && n !== document.body; i++, n = n.parentElement) {
    try { if (getComputedStyle(n).cursor === 'pointer') return n; } catch { return null; }
  }
  return null;
}
const disabled = el => !!(el.disabled || el.getAttribute('aria-disabled') === 'true' || el.closest('[inert]'));
const inside = (a, b) => !!(a && b && (a === b || (b.contains && b.contains(a))));
const gameOn = () => !!(document.body && document.body.dataset.theme);
let whereFn = null;
const screenName = () => { try { return (whereFn && String(whereFn() || '')) || ''; } catch { return ''; } };

function endPress(reason) {
  if (!press) return;
  const p = press; press = null;
  p.ended = reason;
  if (p.mo) { try { p.mo.disconnect(); } catch { /* fine */ } }
  if (waiting.size) {
    const list = [...waiting]; waiting.clear();
    // (a microtask: the click's own handlers run first, then the deferred repaints, once each)
    Promise.resolve().then(() => { for (const fn of list) { try { fn(); } catch (e) { console.warn('[tapwatch] deferred', e); } } });
  }
}

/** run fn now — or, while a finger is on a tappable, once its tap has landed (≤ HOLD_MS after the lift). The shared layer's repaints. */
export function afterTap(fn) {
  if (!press) { fn(); return; }
  stats.deferred++;
  waiting.add(fn);
}
export const fingerDown = () => !!press;
/** a control that acts on its OWN pointer events (CUSTOMIZE's tiles, the room's name tags) says it took this press — never a lost tap */
export function tapHandled() { if (press) { press.handled = true; } else if (lastUp && performance.now() - lastUp.at < RESCUE_MS + 50) lastUp.p.handled = true; }
let lastUp = null;

// THE FIRST TAP (the owner's /admin errors, Nov 13 — the LOST TAP on the city's dock right after a cold load, on iOS): a dock button acts on its
// OWN pointer-up — a primary press that lifts ON it (not a long-press, not a drag) — never waiting for the `click` iOS may not send while the
// first frames are busy. Its press shows AT ONCE (`is-press` at the pointerdown — css/title.css, beside :active); the work (a lazy import, a
// sheet built, a screen switched) runs ONE FRAME later (requestAnimationFrame), so the lift paints the press first. The click stays for the
// keyboard / a screen reader and a pointer this never saw; one tap runs `fn` ONCE (a click right after the pointer-up took it is ignored).
const TOOK_MS = 800;
export function pressTap(el, fn) {
  if (!el || typeof fn !== 'function') return el;
  let down = null, tookAt = -1e9;
  const run = e => {
    const go = () => { try { fn(e); } catch (err) { console.warn('[tap]', err); } };
    if (typeof requestAnimationFrame === 'function' && document.visibilityState !== 'hidden') requestAnimationFrame(go); else setTimeout(go, 0);
  };
  const lift = () => { down = null; el.classList.remove('is-press'); };
  el.addEventListener('pointerdown', e => {
    if (e.isPrimary === false || (e.pointerType === 'mouse' && e.button !== 0) || el.disabled) return;
    down = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() };
    // (CITY A: the lift comes back to this control even if it MOVED under a still finger — the touch's capture, made explicit)
    if (e.pointerType !== 'mouse') { try { el.setPointerCapture(e.pointerId); } catch { /* fine */ } }
    el.classList.add('is-press');
  });
  el.addEventListener('pointerup', e => {
    const d = down; lift();
    if (!d || e.pointerId !== d.id || el.disabled) return;
    // (CITY A — EVERY TAP ACTS: the FINGER decides — < 10 px, ≤ 600 ms; the control's own place at the lift doesn't (a row that slid 38 px under
    //  a still finger is still the tap). A mouse lifting off the control is no tap)
    if (performance.now() - d.t > PRESS_MS || Math.hypot(e.clientX - d.x, e.clientY - d.y) >= PRESS_SLOP) return;
    if (e.pointerType === 'mouse') { const r = el.getBoundingClientRect(); if (e.clientX < r.left - 8 || e.clientX > r.right + 8 || e.clientY < r.top - 8 || e.clientY > r.bottom + 8) return; }
    tookAt = performance.now();
    tapHandled();
    run(e);
  });
  el.addEventListener('pointercancel', lift);
  el.addEventListener('lostpointercapture', () => { if (down) el.classList.remove('is-press'); });
  el.addEventListener('click', e => {
    if (performance.now() - tookAt < TOOK_MS) return;   // (the pointer-up already took this tap)
    run(e);
  });
  el.dataset.pressTap = '1';
  return el;
}

function onDown(e) {
  // (FIXES R1 — THE REVIEW A12: a NEW press ends the last press-act's swallow window — `took` lived 800 ms, so a second tap in it on a control
  //  that needs its REAL click had that click swallowed (inside a game: a lost tap). Only the click of the SAME tap is ever the tail)
  if (e.isPrimary !== false) took = null;
  try {
    if (e.isPrimary === false) return;
    if (press) endPress('new');
    const el = tappableOf(e.target);
    lastDown = el ? describe(el) : `(not a control) ${describe(e.target && e.target.nodeType === 1 ? e.target : e.target && e.target.parentElement)}`;
    if (!el || disabled(el)) return;
    stats.downs++;
    const r = el.getBoundingClientRect();
    press = {
      id: e.pointerId, type: e.pointerType || 'touch', el, sig: sigOf(el), x: e.clientX, y: e.clientY, t: e.timeStamp,
      inDelay: Math.max(0, performance.now() - e.timeStamp), rect: [r.left, r.top], travel: 0, muts: [], up: null,
      own: !!el.closest('[data-tap-own]'), game: gameOn(), where: screenName(), clicked: false, stopper: stopsScroll(performance.now(), lastScroll, lastDrag) && scrolledHolds(el),
      act: pressControl(el, gameOn()) || gestureControl(el, e.pointerType || 'touch'),   // (the control itself — a kick button inside a pressable row is its own; a press that BEGAN on a row acts even while its sheet still slides in: the 38-px shelf row)
    };
    // (THE FIELD IN A LABEL — on the press for data-focus-press: inside the touch, before any re-render)
    if (press.type !== 'mouse') { const f = labelField(el); if (f) { press.field = f; if (el.matches('[data-focus-press]')) focusField(f); } }
    // what re-renders while the finger is down (childList only, until the tap ends — off the rest of the time)
    if (typeof MutationObserver !== 'undefined') {
      const p = press;
      p.mo = new MutationObserver(list => {
        for (const m of list) {
          if (p.muts.length >= 6) break;
          if (m.removedNodes.length && m.target && m.target.nodeType === 1) p.muts.push(describe(m.target).replace(/ ".*$/, ''));
        }
      });
      p.mo.observe(document.body, { childList: true, subtree: true });
    }
  } catch { press = null; }
}
function onMove(e) {
  if (!press || e.pointerId !== press.id) return;
  const d = Math.hypot(e.clientX - press.x, e.clientY - press.y);
  if (d > press.travel) press.travel = d;
}
function onUp(e) {
  if (!press || e.pointerId !== press.id || press.up) return;
  const p = press;
  try {
    p.up = { t: e.timeStamp, x: e.clientX, y: e.clientY };
    p.dur = e.timeStamp - p.t;
    p.travel = Math.max(p.travel, Math.hypot(e.clientX - p.x, e.clientY - p.y));
    p.connectedAtUp = p.el.isConnected;
    const top = document.elementFromPoint(e.clientX, e.clientY);
    p.topAtUp = top;
    const upTap = tappableOf(e.target);
    p.sameAtUp = inside(e.target, p.el) || !!(upTap && sigOf(upTap) === p.sig);
    if (p.connectedAtUp) { const r = p.el.getBoundingClientRect(); p.moved = Math.hypot(r.left - p.rect[0], r.top - p.rect[1]); }
    // (a press the page itself ended — the button's own pointerup closed the sheet it sat on — is no lost tap: it is judged at the check)
  } catch { /* fine */ }
  lastUp = { p, at: performance.now() };
  if (p.stopper && p.up) { stopper = { x: p.up.x, y: p.up.y, at: performance.now() }; stats.stoppers = (stats.stoppers || 0) + 1; }
  // (THE FIELD IN A LABEL — the lift of a clean tap focuses it: iOS's keyboard opens here; the rescue never clicks it late)
  try { if (p.field && p.up && p.sameAtUp && !p.cancelled && p.travel <= SLOP && p.field.isConnected && focusField(p.field)) { p.handled = true; stats.focused = (stats.focused || 0) + 1; } } catch { /* fine */ }
  // 4. EVERY TAP ACTS — a data-press control acts HERE, at the lift (its click dispatched once; the browser's own click swallowed in onClick)
  try {
    if (p.act && p.up && pressActs({ type: p.type, dur: p.dur, travel: p.travel, cancelled: p.cancelled, disabled: disabled(p.act), stopper: p.stopper })) {
      let target = p.act.isConnected ? p.act : null;
      // (FIXES R1 — THE REVIEW A13: the twin of a control re-rendered between down + up is found by EVERY press rule — data-press, the implicit
      //  .btn-block / icon buttons, AND the gesture controls (share / copy / passkey: re-rendered mid-press they never acted — the rescue refuses them))
      if (!target) { const at = document.elementFromPoint(p.up.x, p.up.y), c = at && at.closest && at.closest(TWIN_SEL), tw = c && (pressControl(c, p.game) || gestureControl(c, p.type)); if (tw && sigOf(tw) === sigOf(p.act)) target = tw; }
      if (target) {
        p.handled = true; stats.pressed++;
        took = { el: target, x: p.up.x, y: p.up.y, at: performance.now() };
        if (press === p) endPress('press');
        target.click();
      }
    }
  } catch (err) { console.warn('[tapwatch] press', err); }
  setTimeout(() => check(p), RESCUE_MS);
  setTimeout(() => { if (press === p) endPress('hold'); }, HOLD_MS);
}
function onCancel(e) { if (press && e.pointerId === press.id) { press.cancelled = true; endPress('cancel'); } }
function onTouchEnd(e) { if (press && e.defaultPrevented) press.prevented = true; }
function onClick(e) {
  try {
    // 4. EVERY TAP ACTS: the browser's own click after a data-press control took the tap — swallowed (never twice, never on what slid in under it)
    if (e.isTrusted && took && tookClick(took, { x: e.clientX, y: e.clientY, at: performance.now() })) { e.stopImmediatePropagation(); e.preventDefault(); stats.tookSwallowed++; took = null; return; }
    // (FIXES R2 — A8: the click of a touch that only stopped a scrolling list — swallowed: the row under the finger never opens)
    if (e.isTrusted && stopper && tookClick(stopper, { x: e.clientX, y: e.clientY, at: performance.now() })) { e.stopImmediatePropagation(); e.preventDefault(); stopper = null; return; }
    // …and A SHEET SETTLES before its rows take taps: a click inside a pop-up younger than 350 ms that no press began on (the opening tap's own click)
    if (e.isTrusted && e.detail > 0) { const b = bornOf(e.target); if (b && !settledAt(b, performance.now()) && !(press && inside(e.target, press.el)) && !(press && press.el && inside(press.el, e.target.closest ? (e.target.closest('[data-born]') || e.target) : e.target))) { e.stopImmediatePropagation(); e.preventDefault(); stats.unsettled++; return; } }
    // a late real click on a control the rescue already clicked: swallowed (never twice)
    if (rescued && e.isTrusted && performance.now() - rescued.at < 1000 && (inside(e.target, rescued.el) || (tappableOf(e.target) && sigOf(tappableOf(e.target)) === rescued.sig))) {
      e.stopImmediatePropagation(); e.preventDefault(); stats.swallowed++; rescued.late = Math.round(e.timeStamp - rescued.upT); return;
    }
    const p = press;
    if (p && (inside(e.target, p.el) || (tappableOf(e.target) && sigOf(tappableOf(e.target)) === p.sig))) {
      p.clicked = true; p.clickDelay = p.up ? Math.max(0, e.timeStamp - p.up.t) : 0; p.handlerDelay = Math.max(0, performance.now() - e.timeStamp);
      endPress('click');
    }
  } catch { /* fine */ }
}

function check(p) {
  if (p.clicked || p.handled) return;
  if (!cleanTap(p)) { if (press === p) endPress('dirty'); return; }
  // THE RESCUE: the control itself, or (replaced) the identical one under the lift point
  let target = p.el.isConnected ? p.el : null, how = target ? 'same node' : '';
  if (!target && p.up) {
    const at = tappableOf(document.elementFromPoint(p.up.x, p.up.y));
    if (at && sigOf(at) === p.sig) { target = at; how = 'its replacement'; }
  }
  // (still there at the lift, gone now, no twin = its own lift handler took it away — closed the sheet it sat on: handled, not lost)
  if (!target && p.connectedAtUp) { if (press === p) endPress('gone'); return; }
  stats.lost++;
  const gesture = !!(target && target.matches && target.matches(GESTURE_OWN));
  const mayRescue = rescueOn && p.type !== 'mouse' && target && !disabled(target) && !gesture;
  if (press === p) endPress('lost');
  if (mayRescue) {
    stats.rescues++;
    rescued = { el: target, sig: p.sig, at: performance.now(), upT: p.up ? p.up.t : 0, late: 0 };
    try { target.click(); } catch (e) { console.warn('[tapwatch] rescue', e); }
  }
  // the report a moment later (a late real click, if one comes, is counted in it)
  setTimeout(() => report(p, mayRescue ? how : gesture ? 'gesture' : 'none'), 250);
}

function pageNow() {
  const out = [];
  try { const c = ctxFn && ctxFn(); if (c) out.push(...Object.entries(c).map(([k, v]) => `${k} ${typeof v === 'number' ? Math.round(v * 10) / 10 : v}`)); } catch { /* fine */ }
  try {
    const sh = document.querySelectorAll('.sh:not(.is-in), .sh.is-out').length;
    if (sh) out.push(`a sheet animating (${sh})`);
    const toast = document.querySelector('.sh-msgs > :not(.is-out)');
    if (toast) out.push('a message showing');
  } catch { /* fine */ }
  return out.join(' · ');
}

function report(p, rescue) {
  try {
    const now = Date.now();
    let mem = sentMem;
    if (!mem) { try { mem = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch { mem = null; } }
    const lt = longTasks.filter(x => x.t + x.d >= p.t - 50 && x.t <= (p.up ? p.up.t : p.t) + RESCUE_MS);
    const top = p.topAtUp && !inside(p.topAtUp, p.el) ? describe(p.topAtUp) : '';
    const lines = [
      'A LOST TAP — a pointerdown + pointerup on a tappable, no click on it within ' + RESCUE_MS + ' ms.',
      `screen: ${p.where || '?'}`,
      `element: ${describe(p.el)}`,
      `pointer: ${p.type} · held ${Math.round(p.dur || 0)} ms · travelled ${Math.round(p.travel || 0)} px`,
      `node at the lift: ${p.connectedAtUp ? 'the same node' : 'REPLACED / DETACHED between the down and the up'}${p.el.isConnected ? '' : ' · gone now'}`,
      `on top at the lift point: ${top || 'the element itself'}`,
      `moved under the finger: ${p.moved != null ? `${Math.round(p.moved)} px${p.moved > MOVE_PX ? ' — MOVED' : ''}` : '?'}`,
      `input delay at the touch: ${Math.round(p.inDelay)} ms (the main thread's backlog when the touch arrived)`,
      `long tasks around it: ${lt.length ? lt.map(x => `${Math.round(x.d)} ms`).join(', ') : typeof PerformanceObserver !== 'undefined' && (PerformanceObserver.supportedEntryTypes || []).includes('longtask') ? 'none' : 'not counted on this browser'}`,
      `re-rendered while the finger was down: ${p.muts.length ? [...new Set(p.muts)].join(', ') : 'nothing'}`,
      `the page: ${pageNow() || '—'}`,
      `rescued: ${rescue === 'none' ? 'NO (not a clean tap to rescue)' : rescue === 'gesture' ? 'NO — a gesture control (share / copy / passkey): a synthetic click cannot open it, so it is never rescued' : `yes — clicked ${rescue}`}${rescued && rescued.late ? ` · a late real click came ${rescued.late} ms after the lift (swallowed)` : ''}`,
      `this page so far: ${stats.downs} taps watched · ${stats.lost} lost · ${stats.rescues} rescued`,
    ];
    lastReport = lines.join('\n');
    const r = mayReport(mem, now);
    sentMem = r.mem;
    try { localStorage.setItem(LS_KEY, JSON.stringify(r.mem)); } catch { /* private mode: the page's own memory limits it */ }
    if (!r.ok) return;
    stats.reports++;
    const body = JSON.stringify({ p: 'report', r: { kind: 'lost', text: lastReport } });
    const blob = new Blob([body], { type: 'text/plain' });
    if (!(navigator.sendBeacon && navigator.sendBeacon('/api/log', blob))) fetch('/api/log', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(() => {});
  } catch { /* never let reporting throw */ }
}

/** installs the watch (once; app.js + /board's entry). o.where() = which screen is up (the error log's own — no ids) */
export function installTapWatch(o = {}) {
  if (o.where) whereFn = o.where;
  if (installed || typeof document === 'undefined' || typeof window === 'undefined') return;
  installed = true;
  const opt = { capture: true, passive: true };
  document.addEventListener('pointerdown', onDown, opt);
  document.addEventListener('scroll', onScroll, { capture: true, passive: true });   // (FIXES R2 — A8: every scroll, any list — capture sees them all)
  for (const [t, fn] of [['pointerdown', trackDown], ['pointermove', trackMove], ['pointerup', trackEnd], ['pointercancel', trackEnd]]) document.addEventListener(t, fn, opt);
  document.addEventListener('pointermove', onMove, opt);
  document.addEventListener('pointerup', onUp, opt);
  document.addEventListener('pointercancel', onCancel, opt);
  document.addEventListener('touchend', onTouchEnd, { passive: true });   // (bubble: the page's own handlers have had their say)
  window.addEventListener('click', onClick, true);
  try {
    if (typeof PerformanceObserver !== 'undefined' && (PerformanceObserver.supportedEntryTypes || []).includes('longtask')) {
      new PerformanceObserver(l => { for (const x of l.getEntries()) { longTasks.push({ t: x.startTime, d: x.duration }); if (longTasks.length > 30) longTasks.shift(); } }).observe({ type: 'longtask', buffered: false });
    }
  } catch { /* fine */ }
  window.__tapwatch = { stats: () => ({ ...stats }), scrolls: () => ({ sinceScroll: Math.round(performance.now() - lastScroll), sinceDrag: Math.round(performance.now() - lastDrag), el: scrollEl && scrollEl.className }), last: () => lastReport, pressing: () => !!press, lastDown: () => lastDown, reset: () => { for (const k of Object.keys(stats)) stats[k] = 0; lastReport = ''; },
    rescue: on => { rescueOn = !!on; },
    resetLimit: () => { sentMem = null; try { localStorage.removeItem(LS_KEY); } catch { /* fine */ } } };   // (tests: THE RESCUE off = the raw lost taps; e2e-taps.mjs)
}
