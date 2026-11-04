// THE PROFILE's POP-UPS (LOBBY 2.0 A — the owner, Nov 3 9:33 pm: "use pop-ups wherever they clean the profile"): glass sheets that slide up
// over the page — THE TROPHY CASE, the sightings album, EDIT PROFILE (+ its NAME / COLOUR editors), YOUR KEY's steps, RESTORE YOUR ACCOUNT, a
// game's records. ONE STEP AT A TIME (the owner: "back goes to the main page instead of one screen back — very annoying"): the sheets STACK;
// ‹ BACK, a swipe down on the grip / header, the scrim or Esc close the TOP sheet only — editor → Edit profile → the profile → the city.
//   const s = openPfSheet({ title, kicker?, body: [nodes] | node, cls?, onClose? })  → { el, close(), body }
//   closeAllPfSheets() — the page going away (its own BACK) closes what it opened
import { h, reducedMotion } from '../ui/dom.js';

const stack = [];
let keyOn = false;
const onKey = e => { if (e.key === 'Escape' && stack.length) { e.preventDefault(); stack[stack.length - 1].close(); } };

export function openPfSheet({ title = '', kicker = '', body = [], cls = '', onClose = null } = {}) {
  let closed = false;
  const kids = Array.isArray(body) ? body : [body];
  const inner = h('div.pfs-body', ...kids.filter(Boolean));
  const back = h('button.pfs-back', { type: 'button', 'aria-label': 'Back' }, '‹', h('span', 'BACK'));
  const head = h('header.pfs-head', h('div.pfs-grip', { 'aria-hidden': 'true' }), back, h('div.pfs-t', kicker ? h('small', kicker) : null, h('b', title)));
  const sheet = h('div.pfs-sheet', { role: 'dialog', 'aria-label': title || kicker || 'Sheet' }, head, inner);
  const el = h(`div.pfs${cls ? `.${cls}` : ''}`, h('div.pfs-scrim'), sheet);
  const close = () => {
    if (closed) return; closed = true;
    const i = stack.indexOf(api); if (i >= 0) stack.splice(i, 1);
    if (!stack.length && keyOn) { window.removeEventListener('keydown', onKey); keyOn = false; }
    el.classList.add('is-out');
    setTimeout(() => el.remove(), reducedMotion() ? 0 : 260);
    if (onClose) { try { onClose(); } catch { /* fine */ } }
  };
  back.addEventListener('click', close);
  el.firstChild.addEventListener('click', close);
  // the swipe down (the grip + the header): the sheet follows the finger (transform only); far enough or fast enough → closed
  let y0 = null, t0 = 0, dy = 0;
  head.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; y0 = e.clientY; t0 = performance.now(); dy = 0; head.setPointerCapture && head.setPointerCapture(e.pointerId); sheet.style.transition = 'none'; });
  head.addEventListener('pointermove', e => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); sheet.style.transform = `translateY(${dy}px)`; });
  const end = () => {
    if (y0 == null) return;
    const v = dy / Math.max(1, performance.now() - t0); y0 = null;
    sheet.style.transition = ''; sheet.style.transform = '';
    if (dy > 90 || (dy > 24 && v > 0.6)) close();
  };
  head.addEventListener('pointerup', end); head.addEventListener('pointercancel', end);
  const api = { el, body: inner, close, sheet };
  stack.push(api);
  if (!keyOn) { window.addEventListener('keydown', onKey); keyOn = true; }
  el.style.zIndex = String(400 + stack.length);
  document.body.append(el);
  requestAnimationFrame(() => el.classList.add('is-in'));
  return api;
}

export const pfSheetDepth = () => stack.length;
export function closeAllPfSheets() { for (const s of [...stack].reverse()) s.close(); }
