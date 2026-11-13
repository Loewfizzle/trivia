// THE TAP WATCH (CITY FIXES + HOLD'EM — the owner, Nov 8: "randomly a button does nothing on the first tap, works on the second" — the
// intercom's SEND, HOST / JOIN, a card in SETTINGS, ADD FRIEND… on his iPhone, everywhere, at random). ALWAYS ON (never &debug=1 only —
// the owner uses the live site normally). Three jobs, all on listeners (no frame loop, no layout read outside a tap):
//   1. THE WATCH — a pointerdown + pointerup on a tappable (a button, a link, a row, anything with cursor: pointer) with NO click on it
//      within RESCUE_MS = a LOST TAP → a report to /admin ("Reports from phones" → LOST TAP; /api/log { p: 'report', r: { kind: 'lost' } }):
//      the screen, the element (its tag + classes + a short label — never a name, a code or an id), whether it was REPLACED / DETACHED
//      between the down and the up, what was ON TOP at the lift point, whether it MOVED (> 6 px), the delays (the touch's input delay =
//      the main thread busy; a late click), what re-rendered in that window (the parents whose children changed), what the page was doing
//      (setTapContext: the city's last frame + a bake pending; a sheet animating; the long tasks where the browser counts them).
//      Rate-limited on the device: ≤ 1 report a minute, ≤ 20 a day (+ the server's own limits).
//   2. THE RESCUE — iOS drops a click when the node under the finger changed between the touch and the lift (WebKit re-hit-tests the tap at
//      the lift: a re-render that REPLACED the button with an identical new one = "a different node" = no click), or when it decides the
//      tap was a hover (content became visible during it). For a clean tap (a finger — never a mouse —, short, still, the lift on the same
//      tappable or its identical replacement, nothing cancelled it) that got NO click by RESCUE_MS, the click is given to it (or to its
//      replacement at the same spot); a real click arriving late after a rescue is swallowed (never twice). Off while a game runs
//      (body[data-theme]: a game's pads act on their own pointer events) and on anything marked [data-tap-own].
//   3. afterTap(fn) — the shared layer's "never re-render under a finger": a periodic repaint (the radio, the dock's DAILY slot, the guest
//      list…) waits while a finger is down until its click has landed (≤ HOLD_MS after the lift), then runs once. A click's own handler runs
//      after the press ends (the capture listener ends it first), so a tap's own re-render is never delayed.
// Polish like the error log: anything failing here never touches the app.

const TAPPABLE = 'button, a[href], [role="button"], [role="tab"], [role="switch"], [role="menuitem"], [role="option"], label, summary, input[type="checkbox"], input[type="radio"], .sh-row, [data-tap]';
export const RESCUE_MS = 350;
const HOLD_MS = 450;
const LONG_MS = 700;           // a press longer than this is a long-press, not a tap
const SLOP = 10;               // px the finger may travel and still be a tap
const MOVE_PX = 6;             // the target moved under the finger (a layout shift)
const MIN_GAP_MS = 60_000, DAY_MAX = 20;
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
const stats = { downs: 0, lost: 0, rescues: 0, swallowed: 0, deferred: 0, reports: 0 };
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
export function cleanTap(p) {
  if (!p) return false;
  if (p.cancelled || p.prevented || p.own || p.game) return false;
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
    el.classList.add('is-press');
  });
  el.addEventListener('pointerup', e => {
    const d = down; lift();
    if (!d || e.pointerId !== d.id || el.disabled) return;
    if (performance.now() - d.t > LONG_MS || Math.hypot(e.clientX - d.x, e.clientY - d.y) > SLOP) return;
    const r = el.getBoundingClientRect();
    if (e.clientX < r.left - 8 || e.clientX > r.right + 8 || e.clientY < r.top - 8 || e.clientY > r.bottom + 8) return;
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
      own: !!el.closest('[data-tap-own]'), game: gameOn(), where: screenName(), clicked: false,
    };
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
  setTimeout(() => check(p), RESCUE_MS);
  setTimeout(() => { if (press === p) endPress('hold'); }, HOLD_MS);
}
function onCancel(e) { if (press && e.pointerId === press.id) { press.cancelled = true; endPress('cancel'); } }
function onTouchEnd(e) { if (press && e.defaultPrevented) press.prevented = true; }
function onClick(e) {
  try {
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
  const mayRescue = rescueOn && p.type !== 'mouse' && target && !disabled(target);
  if (press === p) endPress('lost');
  if (mayRescue) {
    stats.rescues++;
    rescued = { el: target, sig: p.sig, at: performance.now(), upT: p.up ? p.up.t : 0, late: 0 };
    try { target.click(); } catch (e) { console.warn('[tapwatch] rescue', e); }
  }
  // the report a moment later (a late real click, if one comes, is counted in it)
  setTimeout(() => report(p, mayRescue ? how : 'none'), 250);
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
      `rescued: ${rescue === 'none' ? 'NO (not a clean tap to rescue)' : `yes — clicked ${rescue}`}${rescued && rescued.late ? ` · a late real click came ${rescued.late} ms after the lift (swallowed)` : ''}`,
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
  window.__tapwatch = { stats: () => ({ ...stats }), last: () => lastReport, pressing: () => !!press, lastDown: () => lastDown, reset: () => { for (const k of Object.keys(stats)) stats[k] = 0; lastReport = ''; },
    rescue: on => { rescueOn = !!on; },
    resetLimit: () => { sentMem = null; try { localStorage.removeItem(LS_KEY); } catch { /* fine */ } } };   // (tests: THE RESCUE off = the raw lost taps; e2e-taps.mjs)
}
