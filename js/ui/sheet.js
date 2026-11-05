// THE SHEET (SHELL 2.0 A — the owner's approved look, docs/harbor/refs/shell/shell-look.png): THE ONE pop-up every screen opens. A SOLID dark
// sheet (nothing behind reads through — the EDIT USERNAME ghost-text bug), a handle, the title in small spaced letters, a ‹ (one step back)
// when it sits on another sheet + an × in a circle (closes the whole stack); the city behind dims. ONE STEP AT A TIME (the owner, Nov 3:
// "back goes to the main page instead of one screen back — very annoying"): the sheets STACK; ‹, a swipe down on the handle / header, the
// scrim or Esc (ui/layers.js — the one Esc) close the TOP sheet only.
//   const s = openSheet({ title, kicker?, body: [nodes] | node, cls?, theme?, label?, onClose?, wide?, from? })  → { el, sheet, body, close() }
// ‹ BACK ON EVERY NESTED SHEET (SHELL 2.0 B1 — the owner, Nov 5 9:15 am: ☰'s sheets had only an ×): a sheet opened FROM another — on top of
// a sheet (automatic) or on a full-screen tool that isn't one (`from: 'CUSTOMIZE'`) — shows ‹ at its top-left (one step back) + its
// parent's NAME small under the title (unless the caller gives its own kicker) + the × (closes every sheet); a top-level sheet = the × only.
//   closeAllSheets() — a page going away (its own BACK) closes what it opened
// Replaces: the old `.modal > .sheet` builders (settings, HOW TO PLAY, CREDITS, a game's options, the chat, BRING YOUR CARD, CALL IN A FAVOR,
// the radio's sheet) + openPfSheet (profile/sheets.js re-exports this). Its look: components.css "THE SHELL — THE SHEET".
import { h, reducedMotion } from './dom.js';
import { takeLayer, onCloseAll } from './layers.js';

const stack = [];

export function openSheet({ title = '', kicker = '', body = [], cls = '', theme = null, label = null, onClose = null, closeAll: xAll = true, from = null } = {}) {
  let closed = false, release = null;
  const kids = Array.isArray(body) ? body : [body];
  const inner = h('div.sh-body', ...kids.filter(Boolean));
  const parent = from || (stack.length ? stack[stack.length - 1].title : null);
  const nested = !!parent;
  if (nested && !String(kicker).trim()) kicker = parent;
  // (‹ shows only when this sheet sits on another; a first sheet keeps it hidden — the one-step close every caller can reach)
  const back = h('button.sh-back', { type: 'button', 'aria-label': 'Back', hidden: !nested }, h('span', { 'aria-hidden': 'true' }, '‹'));
  const x = h('button.sh-x', { type: 'button', 'aria-label': 'Close' }, h('span', { 'aria-hidden': 'true' }, '×'));
  const head = h('header.sh-head', h('div.sh-grip', { 'aria-hidden': 'true' }), back,
    h('div.sh-t', h('b', title), kicker ? h('small', kicker) : null), x);
  const sheet = h('div.sh-panel', { role: 'dialog', 'aria-modal': 'true', 'aria-label': label || title || kicker || 'Sheet' }, head, inner);
  const el = h(`div.sh${cls ? `.${cls.split(' ').join('.')}` : ''}`, theme ? { dataset: { theme } } : null, h('div.sh-scrim'), sheet);
  if (nested) el.classList.add('is-nested');
  const close = () => {
    if (closed) return; closed = true;
    const i = stack.indexOf(api); if (i >= 0) stack.splice(i, 1);
    if (release) release();
    el.classList.add('is-out'); el.classList.remove('is-in');
    setTimeout(() => el.remove(), reducedMotion() ? 0 : 280);
    if (onClose) { try { onClose(); } catch (e) { console.warn('[sheet] onClose', e); } }
  };
  // × closes the whole stack (from the top down), ‹ one step
  x.addEventListener('click', () => (xAll ? closeAllSheets() : close()));
  back.addEventListener('click', close);
  el.firstChild.addEventListener('click', close);
  // the swipe down (the handle + the header): the sheet follows the finger (transform only); far enough or fast enough → closed
  let y0 = null, t0 = 0, dy = 0;
  head.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; y0 = e.clientY; t0 = performance.now(); dy = 0; try { head.setPointerCapture(e.pointerId); } catch { /* fine */ } sheet.style.transition = 'none'; });
  head.addEventListener('pointermove', e => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); sheet.style.transform = `translateY(${dy}px)`; });
  const end = () => {
    if (y0 == null) return;
    const v = dy / Math.max(1, performance.now() - t0); y0 = null;
    sheet.style.transition = ''; sheet.style.transform = '';
    if (dy > 90 || (dy > 24 && v > 0.6)) close();
  };
  head.addEventListener('pointerup', end); head.addEventListener('pointercancel', end);
  const api = { el, body: inner, close, sheet, head, title: title || label || '', nested };
  stack.push(api);
  release = takeLayer(el, { close });   // (THE LAYER STACK: the newest pop-up on top + the one Esc closes it)
  document.body.append(el);
  requestAnimationFrame(() => { if (!closed) el.classList.add('is-in'); });
  return api;
}

export const sheetDepth = () => stack.length;
export const topSheet = () => stack[stack.length - 1] || null;
export function closeAllSheets() { for (const s of [...stack].reverse()) s.close(); }
onCloseAll(closeAllSheets);   // (FR6 FIXES A — B1: the game start + a kick close them)
