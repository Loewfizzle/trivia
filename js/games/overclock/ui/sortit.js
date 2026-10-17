// OVERCLOCK — SORT IT: swipe or tap cards to their side; the window shrinks card by card.
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game() — see view.js.
import { h, pulseClass, vibrate } from '../../../ui/dom.js';
import { sfx } from '../../../audio/sfx.js';
import { sortWindowMs, sortOk } from '../challenges.js';
import { sortSplit } from '../shared.js';

export default function uiSortIt(s, api) {
  const { chal } = api;
  const wrap = h('div.ch.ch-sort');
  const loc = chal.local.sort || (chal.local.sort = { ...sortSplit(chal.ok, chal.p), log: [] });
  let i = chal.p;
  let busy = true;
  let card = null;
  let timer = 0;
  let drag = null;
  const sideL = h('div.st-side.st-left', h('i', '←'), h('b', s.left));
  const sideR = h('div.st-side.st-right', h('b', s.right), h('i', '→'));
  const flashL = h('div.st-flash.st-flash-l');
  const flashR = h('div.st-flash.st-flash-r');
  const deck = h('div.st-deck');
  const fill = h('i');
  const bar = h('div.st-bar', fill);
  const count = h('div.st-count');
  const hint = h('div.st-hint', 'SWIPE THE CARD — OR TAP A SIDE');
  const paintCount = () => count.replaceChildren(
    h('span', `CARD ${Math.min(i + 1, s.cards.length)}/${s.cards.length}`),
    h('span.st-tally', h('b.is-ok', `✓ ${loc.right}`), h('b.is-bad', `✕ ${loc.wrong}`)));
  const deal = () => {
    if (chal.done || i >= s.cards.length) return;
    card = h('div.st-card.is-in', h('span', s.cards[i].t));
    deck.replaceChildren(...(i + 1 < s.cards.length ? [h('div.st-card.is-back')] : []), card);
    const ms = sortWindowMs(i);
    fill.style.transition = 'none';
    fill.style.transform = 'scaleX(1)';
    void fill.offsetWidth;
    fill.style.transition = `transform ${ms}ms linear`;
    fill.style.transform = 'scaleX(0)';
    clearTimeout(timer);
    timer = setTimeout(() => commit(null), ms);
    busy = false;
    paintCount();
  };
  const commit = side => {
    if (busy || chal.done || !card) return;
    busy = true;
    clearTimeout(timer);
    const c = s.cards[i];
    const ok = side === c.s;
    if (ok) loc.right += 1; else loc.wrong += 1;
    loc.log[i] = side;
    const el = card;
    card = null;
    const dir = side == null ? 0 : side === 0 ? -1 : 1;
    el.classList.remove('is-in', 'is-drag');
    el.classList.add(ok ? 'is-right' : 'is-wrong', 'is-out');
    el.style.transform = dir ? `translateX(${dir * 135}%) rotate(${dir * 20}deg)` : 'translateY(45%) scale(0.85)';
    const fl = (side ?? c.s) === 0 ? flashL : flashR;
    fl.classList.remove('is-ok', 'is-bad');
    fl.classList.add(ok ? 'is-ok' : 'is-bad');
    pulseClass(fl, 'on', 450);
    hint.textContent = ok ? 'SWIPE THE CARD — OR TAP A SIDE' : side == null ? `TOO SLOW — ${c.s ? s.right : s.left}` : `NOPE — ${c.s ? s.right : s.left}`;
    hint.classList.toggle('is-warn', !ok);
    sfx(ok ? 'ocCorrect' : 'ocWrong');
    vibrate(ok ? 10 : [20, 30, 20]);
    i += 1;
    api.step(sortOk(loc.right, loc.wrong), i, ok ? 'ok' : 'miss', i >= s.cards.length, 600);
    paintCount();
    if (i < s.cards.length) setTimeout(deal, 230);
  };
  const springBack = () => { if (card) { card.classList.remove('is-drag'); card.style.transform = ''; card.style.removeProperty('--lean'); } sideL.classList.remove('is-hot'); sideR.classList.remove('is-hot'); };
  wrap.addEventListener('pointerdown', e => {
    if (busy || !card || chal.done || drag) return;
    e.preventDefault();
    const now = performance.now();
    drag = { id: e.pointerId, x: e.clientX, t: now, dx: 0, moved: false, lx: e.clientX, lt: now, vx: 0 };
    try { wrap.setPointerCapture(e.pointerId); } catch { /* synthetic events */ }
    card.classList.add('is-drag');
  });
  wrap.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id || !card) return;
    const now = performance.now();
    drag.dx = e.clientX - drag.x;
    if (now > drag.lt) { drag.vx = (e.clientX - drag.lx) / (now - drag.lt); drag.lx = e.clientX; drag.lt = now; }
    if (Math.abs(drag.dx) > 8) drag.moved = true;
    card.style.transform = `translateX(${drag.dx}px) rotate(${drag.dx / 16}deg)`;
    card.style.setProperty('--lean', Math.min(1, Math.abs(drag.dx) / 90).toFixed(2));
    card.dataset.lean = drag.dx < 0 ? 'l' : 'r';
    sideL.classList.toggle('is-hot', drag.dx < -30);
    sideR.classList.toggle('is-hot', drag.dx > 30);
  });
  wrap.addEventListener('pointerup', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    if (!card) return;
    const box = wrap.getBoundingClientRect();
    if (Math.abs(d.dx) > 70 || (Math.abs(d.dx) > 24 && Math.abs(d.vx) > 0.45)) { springBack(); commit(d.dx < 0 ? 0 : 1); }
    else if (!d.moved && performance.now() - d.t < 450) { springBack(); commit(e.clientX < box.left + box.width / 2 ? 0 : 1); }
    else springBack();
  });
  wrap.addEventListener('pointercancel', () => { drag = null; springBack(); });
  api.key = e => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); commit(0); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); commit(1); }
  };
  wrap.append(h('div.st-sides', sideL, sideR), count, h('div.st-table', flashL, deck, flashR), bar, hint);
  paintCount();
  setTimeout(deal, 300);
  return { el: wrap, destroy() { clearTimeout(timer); api.key = null; } };
}
